"use strict";

// Devil's Offerings: buy, reroll, sell or leave, one step at a time, until leaving is the best move.
const CONFIG = require("./config");
const { ARTIFACT_SEALS, TARGET_FIXERS } = require("./artifacts");
const { observe } = require("./observe");
const { sinValue } = require("./values");

const BUILDS = ["bounty", "memory", "reveal", "critical", "personality", "artifact"];

// ---- what things are worth ----
function sealPerRound(id, price, experience) {
  // the price-based guess, on the measured scale once bot:tune has fitted it
  const prior = (price || 0) * (experience?.priorPointsPerPrice ?? CONFIG.shop.priorPointsPerPrice);
  const known = experience?.seals?.[id];
  if (!known || !Number.isFinite(known.perRound)) return prior;
  // trust the measurement more as it is based on more rounds (half-trusted at trustRounds)
  const weight = known.rounds / (known.rounds + CONFIG.shop.trustRounds);
  const value = weight * known.perRound + (1 - weight) * prior;
  // a bad first impression never drops a SEAL to nothing: it keeps getting a chance
  return Math.max(value, prior * CONFIG.shop.valueFloor);
}

function buildMultiplier(tags, build) {
  if (!build) return 1;
  if (tags.includes(build)) return 1 + CONFIG.shop.buildBonus;
  if (tags.includes("general")) return 1;
  return 1 - CONFIG.shop.offBuildPenalty;
}

function sealWorth(id, tags, price, obs, plan, experience) {
  return sealPerRound(id, price, experience) * CONFIG.shop.horizonRounds * buildMultiplier(tags, plan.build);
}

function artifactWorth(id, price, obs, plan, experience) {
  const known = experience?.artifacts?.[id];
  const prior = (price || 0) * CONFIG.artifacts.priorWorthFactor;
  let worth = known && known.uses >= 5 ? (known.uses * known.gain + 5 * prior) / (known.uses + 5) : prior;
  if (id === "a15" && (obs.bossAlive || plan.bossPrep)) worth *= 1.8; // daggers for the BOSS
  if (plan.build === "artifact" || obs.seals.some((seal) => ARTIFACT_SEALS.has(seal.id))) worth *= CONFIG.artifacts.buildItemFactor;
  return worth;
}

function sellValue(seal) {
  return Math.floor(((seal.price || 0) * (seal.stack || 1)) / 2);
}

// how much SIN to keep back right now
function reserveFor(obs, plan) {
  if (obs.round <= CONFIG.shop.savingShops) return 0;
  let reserve = CONFIG.shop.reserve;
  if (plan.bossPrep || obs.bossAlive) reserve += 2;
  // before the 2nd, 4th and 6th BOSS: keep SIN for the new SEAL slot
  if (plan.bossPrep && obs.bossKills % 2 === 1 && obs.sealLimit < 6) reserve += CONFIG.plan.slotSaveSin;
  return reserve;
}

// ---- one shop visit ----
function shopVisit(g, plan, opts) {
  const cfg = CONFIG.shop;
  const experience = opts.experience;
  const rng = opts.rng;
  const log = [];
  let rerolls = 0;
  // points lost by paying `price` now (SIN above 150 is worth little, so spending it costs little)
  const pay = (sin, price) => -sinValue(sin, sin - price);

  for (let step = 0; step < 20; step += 1) {
    const obs = observe(g);
    if (opts.onOffer) {
      g.state.shop.forEach((slot) => {
        if (!slot || opts.offerSeen.has(slot)) return;
        opts.offerSeen.add(slot);
        opts.onOffer(slot.item.id, slot.item.type);
      });
    }
    const saving = obs.round <= cfg.savingShops;
    const reserve = reserveFor(obs, plan);
    const spendable = obs.sin - reserve;
    const rich = obs.sin > cfg.sinCap;
    const owned = new Map(obs.seals.map((seal) => [seal.id, seal]));
    const ownedWorth = obs.seals.map((seal) => ({
      seal,
      worth: sealWorth(seal.id, seal.tags, seal.price, obs, plan, experience) * (1 + 0.5 * (seal.stack - 1))
    }));
    ownedWorth.sort((a, b) => a.worth - b.worth);
    const weakest = ownedWorth[0] || null;
    const options = [];

    obs.shop.forEach((slot) => {
      if (slot.sold || slot.price > obs.sin) return;
      if (slot.type === "passive") {
        const mine = owned.get(slot.id);
        const base = sealWorth(slot.id, slot.tags, g.items[slot.id]?.price || slot.price, obs, plan, experience);
        if (mine) {
          if (g.run(`isNonUpgradableSeal("${slot.id}")`)) return;
          const gain = base * 0.5; // ELITE: about +50%
          options.push({ kind: "elite", slot, score: gain - pay(obs.sin, slot.price), worth: gain });
          return;
        }
        const room = g.api.roomFor(slot.slot);
        if (room) {
          options.push({ kind: "seal", slot, score: base - pay(obs.sin, slot.price), worth: base });
        } else if (weakest && g.run(`sealSlotCost("${slot.id}")`) <= 1) {
          const sale = sellValue(weakest.seal);
          const swap = base - weakest.worth - pay(obs.sin + sale, slot.price) + sinValue(obs.sin, obs.sin + sale);
          options.push({ kind: "swap", slot, sell: weakest.seal, score: swap - cfg.sellMargin, worth: base, swapGain: swap });
        }
      } else if (obs.artifacts.length < obs.artifactLimit) {
        const worth = artifactWorth(slot.id, slot.price, obs, plan, experience);
        options.push({ kind: "artifact", slot, score: worth - pay(obs.sin, slot.price) - CONFIG.artifacts.buyMargin, worth });
      }
    });

    // pick the best buy that fits the plan for this part of the run
    const allowed = options.filter((option) => {
      if (saving) {
        if (option.kind === "artifact") return Boolean(opts.guessingBadly) && TARGET_FIXERS.has(option.slot.id);
        return option.score >= cfg.savingMinScore;
      }
      // the reserve holds back small buys (ARTIFACTS, rerolls); a SEAL worth having may use all the SIN
      const budget = rich || option.kind !== "artifact" ? obs.sin : spendable;
      return option.slot.price <= budget && option.score > 0;
    });
    allowed.sort((a, b) => b.score - a.score);
    let choice = allowed[0] || null;
    let trial = false;

    // now and then try a SEAL rated low, so every SEAL gets data
    if (!choice && !saving) {
      const cheapSeal = options.find((option) => option.kind === "seal" && option.slot.price <= spendable);
      if (cheapSeal && rng() < cfg.exploreChance) {
        choice = cheapSeal;
        trial = true;
      }
    }

    if (choice) {
      const slot = choice.slot;
      const why = trial
        ? "trial buy (low rating, tried so every SEAL gets data)"
        : choice.kind === "swap"
          ? `replaces ${choice.sell.name} (+${round2(choice.swapGain)} points)`
          : choice.kind === "elite"
            ? `ELITE upgrade worth ${round2(choice.worth)} points for ${slot.price} SIN`
            : choice.kind === "artifact"
              ? `ARTIFACT worth ${round2(choice.worth)} points for ${slot.price} SIN`
              : `${slot.tags.includes(plan.build) ? "on-build" : slot.tags.includes("general") ? "general" : "off-build"} SEAL worth ${round2(choice.worth)} points for ${slot.price} SIN`;
      if (choice.kind === "swap") {
        const index = g.state.player.passives.findIndex((item) => item.id === choice.sell.id);
        const sinBefore = g.state.player.credits;
        g.api.sellSeal(index);
        log.push({ action: "sell", id: choice.sell.id, name: choice.sell.name, stack: choice.sell.stack, sin: Math.round(g.state.player.credits - sinBefore), why: `to make room for ${slot.name}` });
      }
      const before = g.state.player.credits;
      g.api.buy(slot.slot);
      const paid = Math.round(before - g.state.player.credits);
      const bought = g.state.shop[slot.slot]?.sold;
      log.push({ action: choice.kind === "artifact" ? "buyArtifact" : choice.kind === "elite" ? "elite" : "buySeal", id: slot.id, name: slot.name, price: paid, ok: Boolean(bought), trial, why, tags: slot.tags });
      if (!bought) break;
      if (g.state.gameOver) break;
      continue;
    }

    // nothing worth buying: reroll if a find is likely worth it
    const rerollCap = rich ? cfg.richMaxRerolls : obs.sin > CONFIG.points.sinComfort ? cfg.pileMaxRerolls : cfg.maxRerolls;
    if (!saving && !opts.noReroll && rerolls < rerollCap && obs.rerollCost <= (rich ? obs.sin : spendable)) {
      // only SEALS we could pay for after this reroll count as a find
      const budgetAfter = (rich ? obs.sin : spendable) - obs.rerollCost;
      const expected = expectedSealFind(g, obs, plan, experience, weakest, budgetAfter);
      if (expected - pay(obs.sin, obs.rerollCost) >= cfg.rerollMinValue || rich) {
        const cost = obs.rerollCost;
        g.api.reroll();
        rerolls += 1;
        log.push({ action: "reroll", price: cost, why: rich ? "over 150 SIN: spending down" : `expected find worth ${round2(expected)} points` });
        continue;
      }
    }
    break;
  }
  return log;
}

// average value of the SEAL a reroll would show (only finds worth buying count)
function expectedSealFind(g, obs, plan, experience, weakest, budget) {
  if (!g.sealPool) g.sealPool = g.run("PASSIVE_IDS.filter((id) => !REMOVED_PASSIVE_IDS.has(id))");
  const owned = new Set(obs.seals.map((seal) => seal.id));
  const roomLeft = obs.sealSlotsUsed < obs.sealLimit;
  let total = 0;
  let count = 0;
  for (const id of g.sealPool) {
    if (owned.has(id)) continue;
    const item = g.items[id];
    if (!item) continue;
    const tags = g.buildTags[id] || ["general"];
    const worth = sealWorth(id, tags, item.price, obs, plan, experience);
    const price = item.price;
    const net = roomLeft ? worth - price * CONFIG.points.sin : weakest ? worth - weakest.worth - (price - sellValue(weakest.seal)) * CONFIG.points.sin - CONFIG.shop.sellMargin : 0;
    total += price <= budget ? Math.max(0, net) : 0;
    count += 1;
  }
  return count ? total / count : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

module.exports = { shopVisit, sealWorth, sealPerRound, BUILDS, reserveFor };
