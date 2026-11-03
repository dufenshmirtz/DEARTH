"use strict";

// ARTIFACTS after the TARGET is revealed. Every guess is on the cards now, so the bot can try each
// option (one or two ARTIFACTS, owned or bought on the spot, on each target) on a copy of the game,
// resolve the round there and keep the best result, if it beats keeping the ARTIFACTS for later.
const CONFIG = require("./config");
const { scoreView, outcomePoints } = require("./values");

const TARGETED = new Set(["a7", "a8", "a9", "a15", "a25", "a28"]);
const NON_BOSS_ONLY = new Set(["a7", "a11"]);
const ARTIFACT_SEALS = new Set(["p20", "p26", "p27", "p60", "p70"]);
const TARGET_FIXERS = new Set(["a6", "a7", "a8", "a9", "a14"]);

function keepValue(item, obs, plan) {
  const cfg = CONFIG.artifacts;
  let value = (item.price || 0) * cfg.keepFactor;
  if (item.id === "a12") value *= cfg.talismanKeepFactor;
  if (item.id === "a15") value *= obs.bossAlive ? cfg.daggerBossFactor : cfg.daggerHoardFactor;
  if (plan.build === "artifact" || obs.seals.some((seal) => ARTIFACT_SEALS.has(seal.id))) value *= cfg.buildItemFactor;
  return value;
}

// value an ARTIFACT's effect has after this round (the copy of this round cannot see it)
function delayedValue(action, obs, plan) {
  if (action.id === "a23") return obs.sealSlotsUsed >= obs.sealLimit && obs.seals.length ? 1.5 : 0.3; // Satanic Bible
  if (action.id === "a25") {
    const bot = obs.bots.find((candidate) => candidate.id === action.targets[0]);
    if (!bot) return 0;
    return 2 + (bot.isBoss ? 0 : 3 * CONFIG.points.bountyOnLivingDamned); // next round: reveal + 3 BOUNTY
  }
  if (action.id === "a28" && plan.build === "memory") return 1.5; // Engraved Skull feeds MEMORY builds
  return 0;
}

function targetSets(id, obs) {
  const bots = obs.bots.filter((bot) => !bot.immortal);
  const pool = NON_BOSS_ONLY.has(id) ? bots.filter((bot) => !bot.isBoss) : bots;
  if (id === "a11") {
    const sets = [];
    pool.forEach((first) => pool.forEach((second) => first.id !== second.id && sets.push([first.id, second.id])));
    return sets;
  }
  if (TARGETED.has(id)) return pool.map((bot) => [bot.id]);
  if (id === "a18") return [[], ...bots.map((bot) => [bot.id]), ...(pool.length > 1 ? [[pool[0].id, pool[1].id]] : [])];
  return [[]];
}

function listActions(obs) {
  const actions = [];
  obs.artifacts.forEach((item) => {
    targetSets(item.id, obs).forEach((targets) => actions.push({ kind: "use", uid: item.uid, id: item.id, name: item.name, targets }));
  });
  const room = obs.artifacts.length < obs.artifactLimit;
  if (room) {
    obs.shop
      .filter((slot) => slot.type === "active" && !slot.sold && slot.price <= obs.sin)
      .forEach((slot) => {
        targetSets(slot.id, obs).forEach((targets) =>
          actions.push({ kind: "buyUse", slot: slot.slot, id: slot.id, name: slot.name, price: slot.price, targets })
        );
      });
  }
  return actions;
}

// press the buttons for one action on the game in front of us (real or a copy); true if it resolved
function perform(g, action) {
  const actives = g.state.player.actives;
  if (action.kind === "buyUse") {
    const before = actives.length;
    g.api.buy(action.slot);
    if (g.state.player.actives.length <= before) return false;
    return g.api.use(g.state.player.actives.length - 1, action.targets);
  }
  const index = actives.findIndex((item) => item.uid === action.uid);
  if (index < 0) return false;
  return g.api.use(index, action.targets);
}

function describe(action, obs) {
  const names = action.targets.map((id) => obs.bots.find((bot) => bot.id === id)?.name || `#${id}`);
  const verb = action.kind === "buyUse" ? `bought ${action.name} (${action.price} SIN) and used it` : `used ${action.name}`;
  return names.length ? `${verb} on ${names.join(" then ")}` : verb;
}

function chooseArtifacts(g, obs, plan, opts) {
  const cfg = CONFIG.artifacts;
  if (obs.artifactUsesLeft <= 0) return null;
  const actions = listActions(obs);
  if (!actions.length) return null;
  const keepByUid = new Map(obs.artifacts.map((item) => [item.uid, keepValue(item, obs, plan)]));
  const keepValueOf = (uid) => keepByUid.get(uid) || 0;
  const safeHp = opts.safeHp;
  let simCount = 0;
  const snap = g.snapshot();

  const evaluate = (sequence, from = 0, count = cfg.simSamples) => {
    let total = 0;
    let resolved = true;
    for (let k = from; k < from + count; k += 1) {
      const result = g.lookahead(`${opts.seedBase}:art:${obs.round}:${k}`, () => {
        simCount += 1;
        const before = scoreView(g.state);
        for (const action of sequence) {
          if (!perform(g, action)) return null;
        }
        g.api.ready();
        return outcomePoints(before, scoreView(g.state), { safeHp, keepValueOf });
      }, snap);
      if (!result) {
        resolved = false;
        break;
      }
      total += result.total;
    }
    if (!resolved) return null;
    return total / count + sequence.reduce((sum, action) => sum + delayedValue(action, obs, plan), 0);
  };

  let baseline = evaluate([]);
  const singles = [];
  for (const action of actions) {
    const value = evaluate([action]);
    if (value !== null) singles.push({ sequence: [action], value, gain: value - baseline });
  }
  singles.sort((a, b) => b.gain - a.gain);
  const tried = singles.slice();

  if (obs.artifactUsesLeft >= 2 && singles.length > 1) {
    const top = singles.slice(0, cfg.pairCandidates).map((entry) => entry.sequence[0]);
    for (const first of top) {
      for (const second of top) {
        if (first === second) continue;
        if (first.kind === "use" && second.kind === "use" && first.uid === second.uid) continue;
        if (first.kind === "buyUse" && second.kind === "buyUse" && first.slot === second.slot) continue;
        const value = evaluate([first, second]);
        if (value !== null) tried.push({ sequence: [first, second], value, gain: value - baseline });
      }
    }
  }

  // saving rounds (the first shops): buy on the spot only to fix a really bad guess
  const valid = tried.filter((entry) => {
    if (!opts.saving || !entry.sequence.some((action) => action.kind === "buyUse")) return true;
    return entry.sequence.every((action) => action.kind !== "buyUse" || TARGET_FIXERS.has(action.id)) && entry.gain >= CONFIG.shop.savingMinScore;
  });
  valid.sort((a, b) => b.gain - a.gain);
  // the dice make a single look noisy: check the best few again with more copies before choosing
  if (valid.length && valid[0].gain >= cfg.minGain - 1) {
    const extra = cfg.confirmSamples;
    const baseExtra = evaluate([], cfg.simSamples, extra);
    const total = cfg.simSamples + extra;
    const baselineAll = (baseline * cfg.simSamples + baseExtra * extra) / total;
    valid.slice(0, cfg.confirmTop).forEach((entry) => {
      const more = evaluate(entry.sequence, cfg.simSamples, extra);
      if (more === null) return;
      const delayed = entry.sequence.reduce((sum, action) => sum + delayedValue(action, obs, plan), 0);
      entry.value = ((entry.value - delayed) * cfg.simSamples + (more - delayed) * extra) / total + delayed;
      entry.gain = entry.value - baselineAll;
      entry.confirmed = true;
    });
    valid.splice(cfg.confirmTop);
    valid.sort((a, b) => b.gain - a.gain);
    baseline = baselineAll;
  }
  const best = valid[0] || null;

  const considered = tried.length;
  const top = valid.slice(0, 3).map((entry) => ({ what: entry.sequence.map((action) => describe(action, obs)).join(", "), gain: round2(entry.gain) }));
  if (!best || best.gain < cfg.minGain) {
    return { used: [], expected: round2(baseline), baseline: round2(baseline), bestGain: best ? round2(best.gain) : 0, considered, top, sims: simCount, reason: best ? `best option (${describe(best.sequence[0], obs)}) gained only ${round2(best.gain)} points: kept the ARTIFACTS` : "no option worth it" };
  }

  // do it for real
  const done = [];
  for (const action of best.sequence) {
    const ok = perform(g, action);
    done.push({ ...action, text: describe(action, obs), ok, fixer: TARGET_FIXERS.has(action.id) });
    if (!ok) break;
  }
  return {
    used: done,
    expected: round2(best.value - best.sequence.reduce((sum, action) => sum + delayedValue(action, obs, plan), 0)),
    baseline: round2(baseline),
    bestGain: round2(best.gain),
    considered,
    top,
    sims: simCount,
    reason: `${done.map((action) => action.text).join(", ")}: +${round2(best.gain)} points over doing nothing`
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

module.exports = { chooseArtifacts, keepValue, ARTIFACT_SEALS, TARGET_FIXERS };
