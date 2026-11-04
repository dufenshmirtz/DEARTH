"use strict";

// Plays one whole run and writes down everything: every decision, why, and what happened.
const CONFIG = require("./config");
const { GameVM } = require("./game-vm");
const { createRng } = require("./rng");
const { observe } = require("./observe");
const { TableModel } = require("./predict");
const { chooseGuess } = require("./guess");
const { chooseArtifacts, keepValue } = require("./artifacts");
const { shopVisit } = require("./shop");
const { scoreView, outcomePoints, sinValue } = require("./values");

const UNIQUE_BOSS_COUNT = 8;

function round2(value) {
  return Math.round(value * 100) / 100;
}

// SEAL contribution of one round in points (damage, healing, SIN... from the game's own SEAL stats)
// (SIN a SEAL pays is valued at what it was worth when it came in: less when SIN is piling up)
function sealRoundPoints(before, after, avgDamnedMaxHp, sinHeld) {
  const out = {};
  const p = CONFIG.points;
  Object.keys(after).forEach((id) => {
    const a = after[id] || {};
    const b = before[id] || {};
    const d = (key) => Math.max(0, (a[key] || 0) - (b[key] || 0));
    const points =
      (d("damage") * p.killProgress) / Math.max(10, avgDamnedMaxHp) +
      d("healing") * p.hp +
      d("saved") * p.hp +
      sinValue(sinHeld, sinHeld + d("credits")) +
      d("bounty") * p.bountyOnLivingDamned +
      d("memory") * 0.05;
    const triggers = d("triggers");
    if (points > 0 || triggers > 0) out[id] = { pts: round2(points), trig: triggers, cr: d("credits") };
  });
  return out;
}

// what kind of BOSS it is and what it can do (late-game BOSSES get a random ability, so the name alone says little)
let abilityNames = null;
function bossTraits(bot) {
  const kind = bot.uniqueKey ? "main" : bot.archangelKey ? "archangel" : bot.shadowOf ? "shadow" : bot.goeticKey ? "goetic" : bot.finalKey ? "final" : "other";
  const keys = Array.isArray(bot.passiveKeys) ? bot.passiveKeys : [];
  return {
    kind,
    abilities: keys.map((key) => (abilityNames && abilityNames[key]) || key),
    abilityKeys: keys,
    modifier: Number.isFinite(bot.modifierOverride) ? bot.modifierOverride : null,
    blocks: bot.goeticPassiveId || null
  };
}

function copyStats(stats) {
  const out = {};
  Object.keys(stats || {}).forEach((id) => {
    out[id] = { ...stats[id] };
  });
  return out;
}

function playRun({ seed, build, mainOnly = false, experience = null, forceSeal = null, coverage = null, maxRounds = CONFIG.run.maxRounds, onRound = null }) {
  const g = new GameVM(seed);
  const rng = createRng(`${seed}:bot`);
  const model = new TableModel();
  const plan = { build, bossPrep: false, killsAtLastBoss: 0 };
  const record = {
    version: 3, // 2: SEAL SIN valued at the SIN held when it came in; 3: BOSS kind and abilities recorded
    seed,
    build,
    rounds: [],
    bosses: [],
    offers: {},
    artifactUses: {},
    result: null
  };
  const offerSeen = new WeakSet();
  const onOffer = (id, type) => {
    const entry = record.offers[id] || (record.offers[id] = { offered: 0, bought: 0, type });
    entry.offered += 1;
  };
  const bossesAlive = new Map();
  const recentDamage = [];
  let mainWinRound = null;

  g.api.startRun();
  const s = g.state;
  if (!abilityNames) {
    abilityNames = {};
    try {
      const passives = g.run("typeof BOSS_PASSIVES === 'object' ? BOSS_PASSIVES : {}");
      Object.keys(passives).forEach((key) => {
        abilityNames[key] = passives[key]?.name || key;
      });
    } catch (error) {
      // older game: keys only
    }
  }
  // A/B tests: start the run already holding one SEAL
  if (forceSeal && g.items[forceSeal]?.type === "passive") {
    g.run(`state.player.passives.push(itemCopy(${JSON.stringify(forceSeal)})); refreshMimicTarget();`);
    record.forcedSeal = forceSeal;
    plan.forcedSeal = forceSeal; // never sold: the run is about this SEAL
  }
  if (coverage) record.coverage = coverage;

  while (!s.gameOver && s.round <= maxRounds) {
    const roundNo = s.round;
    const startView = scoreView(s);
    const entry = { r: roundNo, hp0: s.player.hp, sin0: Math.floor(s.player.credits) };

    // BOSSES that arrived
    s.bots.forEach((bot) => {
      if (bot.isBoss && !bot.eliminated && !bossesAlive.has(bot.id)) {
        const boss = { id: bot.id, name: bot.name, key: bot.uniqueKey || bot.goeticKey || bot.finalKey || null, unique: Boolean(bot.uniqueKey), spawnRound: roundNo, hpAtSpawn: s.player.hp, killRound: null, ...bossTraits(bot) };
        bossesAlive.set(bot.id, boss);
        record.bosses.push(boss);
      }
    });
    const bossNames = [...bossesAlive.values()].map((boss) => boss.name);
    entry.boss = bossNames.length ? bossNames.join(" + ") : null;
    plan.bossPrep = !bossNames.length && s.eliminations - plan.killsAtLastBoss >= CONFIG.plan.bossPrepKills;
    entry.prep = plan.bossPrep;
    const safeHp = plan.bossPrep || bossNames.length ? CONFIG.guess.safeHpBossPrep : CONFIG.guess.safeHp;
    const guessingBadly = recentDamage.length >= 2 && recentDamage.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, recentDamage.length) >= CONFIG.shop.badGuessDamage;
    const saving = roundNo <= CONFIG.shop.savingShops;
    const opts = { rng, seedBase: seed, safeHp, experience, guessingBadly, saving, offerSeen, onOffer };

    // 1. shop: the new offers of this round
    entry.shop = shopVisit(g, plan, opts);
    entry.shop.forEach((step) => {
      if ((step.action === "buySeal" || step.action === "elite" || step.action === "buyArtifact") && step.ok && record.offers[step.id]) record.offers[step.id].bought += 1;
    });
    if (s.gameOver) {
      entry.diedIn = "shop";
      record.rounds.push(entry);
      break;
    }

    // 2. guess
    const statsBefore = copyStats(s.sealStats);
    const beforeGuess = scoreView(s);
    const obs = observe(g);
    const decision = chooseGuess(g, obs, model, opts);
    g.api.guess(decision.guess);
    entry.guess = {
      g: decision.guess,
      i: decision.intended,
      n: decision.noise,
      eT: decision.expectedTarget,
      tr: decision.targetRange,
      pc: decision.pCrit,
      pw: decision.pWorst,
      ed: decision.expectedDamage,
      safe: decision.safeMode,
      cand: decision.candidates,
      preds: decision.predictions
    };

    // 3. ARTIFACTS, now that the TARGET is on screen
    entry.T = s.roundState.target;
    let beforeArtifacts = null;
    let artExpected = null;
    let artifactKeep = null;
    if (s.stage === "active") {
      beforeArtifacts = scoreView(s);
      const artObs = observe(g);
      artifactKeep = new Map(artObs.artifacts.map((item) => [item.uid, keepValue(item, artObs, plan)]));
      const art = chooseArtifacts(g, artObs, plan, opts);
      if (art) {
        artExpected = art.expected;
        entry.art = { used: art.used.map((action) => action.text), gain: art.bestGain, considered: art.considered, top: art.top, sims: art.sims, why: art.reason };
        art.used.forEach((action) => {
          const stats = record.artifactUses[action.id] || (record.artifactUses[action.id] = { uses: 0, gain: 0, bought: 0 });
          stats.uses += 1;
          stats.gain += art.bestGain / art.used.length;
          if (action.kind === "buyUse") {
            stats.bought += 1;
            if (record.offers[action.id]) record.offers[action.id].bought += 1;
          }
        });
      }
      // 4. READY
      g.api.ready();
    }

    // 5. what happened
    const round = s.roundState;
    const afterView = scoreView(s);
    entry.Tf = round.target;
    entry.mod = round2(round.targetModifier);
    entry.pg = round.playerEffectiveGuess;
    entry.dmg = Math.max(0, beforeGuess.hp - s.player.hp);
    entry.crit = Boolean(round.criticalHitKeys?.has?.("player"));
    const distances = s.bots
      .map((bot) => round.botEffectiveGuesses.get(bot.id))
      .filter((value) => Number.isFinite(value))
      .map((value) => Math.abs(value - round.target));
    const myDistance = Math.abs(round.playerEffectiveGuess - round.target);
    entry.worst = myDistance > 0 && myDistance >= Math.max(0, ...distances);
    entry.kills = round.eliminationsThisRound || 0;
    entry.pts = round2(outcomePoints(beforeGuess, afterView, { safeHp }).total);
    if (entry.art && beforeArtifacts) {
      // what the bot expected from its ARTIFACT choice vs what really happened (dice can differ)
      entry.art.expected = artExpected;
      entry.art.actual = round2(outcomePoints(beforeArtifacts, afterView, { safeHp, keepValueOf: (uid) => artifactKeep.get(uid) || 0 }).total);
    }
    entry.srcs = (s.playerDamageSources || [])
      .filter((source) => source.amount > 0 && source.kind !== "saved")
      .map((source) => `${source.source}: ${Math.ceil(source.amount)}`)
      .slice(0, 6);
    const actualById = new Map();
    s.bots.forEach((bot) => {
      const guess = round.botEffectiveGuesses.get(bot.id);
      if (Number.isFinite(guess)) actualById.set(bot.id, guess);
    });
    entry.guess.preds.forEach((pred) => {
      pred.actual = actualById.get(pred.id) ?? null;
    });
    recentDamage.push(entry.dmg);
    if (recentDamage.length > 6) recentDamage.shift();

    // the SEALS we held this round and what each did
    entry.arts = s.player.actives.map((item) => item.id);
    entry.seals = s.player.passives.map((item) => `${item.id}${(item.stack || 1) > 1 ? `x${item.stack}` : ""}`);
    const damned = s.bots.filter((bot) => !bot.isBoss && Number.isFinite(bot.maxHp));
    const avgMaxHp = damned.length ? damned.reduce((sum, bot) => sum + bot.maxHp, 0) / damned.length : 40;
    entry.sg = sealRoundPoints(statsBefore, s.sealStats, avgMaxHp, beforeGuess.sin);

    // BOSSES that fell
    bossesAlive.forEach((boss, id) => {
      const bot = s.bots.find((candidate) => candidate.id === id);
      if (!bot || bot.eliminated || bot.hp <= 0) {
        boss.killRound = roundNo;
        boss.rounds = roundNo - boss.spawnRound + 1;
        boss.hpLost = Math.max(0, boss.hpAtSpawn - s.player.hp);
        bossesAlive.delete(id);
        plan.killsAtLastBoss = s.eliminations;
        entry.bossKilled = (entry.bossKilled ? `${entry.bossKilled} + ` : "") + boss.name;
      }
    });

    // the bot learns from the guesses now on the cards
    const botGuesses = s.bots
      .filter((bot) => actualById.has(bot.id))
      .map((bot) => ({ id: bot.id, type: bot.type, isBoss: Boolean(bot.isBoss), guess: actualById.get(bot.id) }));
    if (Number.isFinite(round.tableAverage)) {
      model.observeRound({
        target: round.target,
        tableAverage: round.tableAverage,
        modifier: round.targetModifier,
        offset: round.targetOffset || 0,
        playerGuess: round.playerEffectiveGuess,
        botAverage: botGuesses.length ? botGuesses.reduce((sum, b) => sum + b.guess, 0) / botGuesses.length : round.tableAverage,
        guesses: botGuesses
      });
    }

    if (s.gameOver) {
      entry.hp1 = s.player.hp;
      entry.sin1 = Math.floor(s.player.credits);
      record.rounds.push(entry);
      break;
    }

    // 6. last look at this round's offers before they are replaced (no rerolls here)
    const endShop = shopVisit(g, plan, { ...opts, noReroll: true });
    if (endShop.length) entry.shopEnd = endShop;
    endShop.forEach((step) => {
      if ((step.action === "buySeal" || step.action === "elite" || step.action === "buyArtifact") && step.ok && record.offers[step.id]) record.offers[step.id].bought += 1;
    });

    entry.hp1 = s.player.hp;
    entry.sin1 = Math.floor(s.player.credits);
    entry.ptsRound = round2(outcomePoints(startView, scoreView(s), { safeHp }).total);
    record.rounds.push(entry);
    if (onRound) onRound(entry);
    if (s.gameOver) break;

    if (mainWinRound === null && s.bossKills >= UNIQUE_BOSS_COUNT) {
      mainWinRound = roundNo;
      entry.mainWin = true;
      if (mainOnly) break;
    }
    g.api.next();
  }

  // ---- summary of the run ----
  const last = record.rounds[record.rounds.length - 1];
  const aliveBoss = [...bossesAlive.values()].map((boss) => boss.name);
  const result = s.gameOver ? "died" : mainOnly && mainWinRound !== null ? "won (main only)" : "round cap";
  // Pavlos comes with Petros and does not count as a BOSS of his own (the game counts the pair once)
  const uniqueKills = record.bosses.filter((boss) => boss.unique && boss.key !== "pavlos" && boss.killRound !== null).length;
  record.result = {
    outcome: result,
    mainWin: mainWinRound !== null,
    mainWinRound,
    rounds: last ? last.r : 0,
    kills: s.eliminations,
    bossKills: s.bossKills,
    uniqueBossKills: uniqueKills,
    endlessBossKills: record.bosses.filter((boss) => !boss.unique && boss.killRound !== null).length,
    diedRound: s.gameOver ? last?.r : null,
    diedTo: s.gameOver ? { boss: aliveBoss.join(" + ") || null, prep: Boolean(last?.prep), sources: last?.srcs || [], hpBefore: last?.hp0 } : null,
    finalSeals: s.player.passives.map((item) => ({ id: item.id, name: item.name, stack: item.stack || 1 })),
    crits: record.rounds.filter((r) => r.crit).length,
    worsts: record.rounds.filter((r) => r.worst).length,
    avgDamage: round2(record.rounds.reduce((sum, r) => sum + (r.dmg || 0), 0) / Math.max(1, record.rounds.length)),
    peakSin: Math.max(0, ...record.rounds.map((r) => r.sin1 || 0)),
    sealStats: copyStats(s.sealStats)
  };
  return record;
}

module.exports = { playRun };
