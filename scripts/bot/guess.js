"use strict";

// Choosing the guess: imagine the table many times from the bot's own predictions, score every
// number 0-100, then re-check the best few on copies of the game where every SEAL rule applies.
const CONFIG = require("./config");
const { hpLossCost, scoreView, outcomePoints } = require("./values");

const MYSTERY_MODIFIERS = [0.6, 0.7, 0.8, 0.9, 1.0];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sampleTable(preds, obs, rng) {
  const guesses = preds.map((pred) => {
    if (pred.exact) return pred.mean;
    if (!obs.bots.find((bot) => bot.id === pred.id)?.isBoss && rng() < CONFIG.guess.wildGuessChance) return rng.int(0, 100);
    return clamp(Math.ceil(pred.mean + rng.normal() * pred.sd), 0, 100);
  });
  const modifier = obs.mysteryModifier ? MYSTERY_MODIFIERS[rng.int(0, MYSTERY_MODIFIERS.length - 1)] : obs.modifier;
  return { guesses, modifier };
}

function computeTarget(sum, count, myGuess, modifier, offset) {
  const average = (sum + myGuess) / (count + 1);
  return Math.ceil(Math.min(200, average * modifier + offset));
}

function chooseGuess(g, obs, model, opts) {
  const cfg = CONFIG.guess;
  const rng = opts.rng;
  const preds = model.predict(obs);
  const botsById = new Map(obs.bots.map((bot) => [bot.id, bot]));
  const myMax = obs.maxHp;
  const worstPenalty = Math.max(1, Math.ceil(myMax * 0.1));
  const critIn = Math.ceil(myMax * 0.1);
  const critWindow = g.run("critWindowDetails('p6').guaranteed + ascendingCritWindowBonus() + Math.max(0, Math.ceil(state.roundState?.artifactCriticalRangeBonus || 0))");
  const critFlat = g.run("playerCriticalFlatBonus()");
  const safeHp = opts.safeHp;
  const safeMode = obs.hp <= safeHp;
  const costTable = [];
  for (let d = 0; d <= obs.hp + 1; d += 1) costTable.push(hpLossCost(obs.hp, d, safeHp));
  const cost = (d) => (d >= costTable.length ? CONFIG.points.death : costTable[d]);

  const samples = [];
  for (let k = 0; k < cfg.samples; k += 1) samples.push(sampleTable(preds, obs, rng));

  const botValue = (bot, damage) => {
    if (bot.immortal || damage <= 0) return 0;
    const taken = Math.min(damage, bot.hp);
    const share = taken / bot.maxHp;
    if (bot.isBoss) return share * 100 * CONFIG.points.bossPercent + (damage >= bot.hp ? CONFIG.points.bossKillBonus : 0);
    let value = share * CONFIG.points.killProgress;
    if (damage >= bot.hp) value += bot.bounty * CONFIG.points.sin + 1;
    return value;
  };

  const scores = [];
  for (let guess = 0; guess <= 100; guess += 1) {
    let total = 0;
    let totalSq = 0;
    let crits = 0;
    let worsts = 0;
    let damageSum = 0;
    const targets = [];
    for (const sample of samples) {
      const sum = sample.guesses.reduce((acc, value) => acc + value, 0);
      const target = computeTarget(sum, sample.guesses.length, guess, sample.modifier, obs.offset);
      targets.push(target);
      const myDistance = Math.abs(guess - target);
      let maxDistance = myDistance;
      const distances = sample.guesses.map((value) => {
        const distance = Math.abs(value - target);
        if (distance > maxDistance) maxDistance = distance;
        return distance;
      });
      let myDamage = myDistance;
      if (myDistance === maxDistance && myDistance > 0) {
        myDamage += worstPenalty;
        worsts += 1;
      }
      distances.forEach((distance) => {
        if (distance === 0) myDamage += critIn;
      });
      const iCrit = myDistance <= critWindow;
      if (iCrit) crits += 1;
      let value = -cost(myDamage);
      preds.forEach((pred, index) => {
        const bot = botsById.get(pred.id);
        if (!bot) return;
        let damage = distances[index];
        if (distances[index] === maxDistance && distances[index] > 0) damage += Math.max(1, Math.ceil(bot.maxHp * 0.1));
        if (iCrit) damage += Math.ceil(bot.maxHp * 0.1) + critFlat;
        value += botValue(bot, damage);
      });
      damageSum += myDamage;
      total += value;
      totalSq += value * value;
    }
    const n = samples.length;
    const meanValue = total / n;
    const spread = Math.sqrt(Math.max(0, totalSq / n - meanValue * meanValue));
    const pCrit = crits / n;
    let score = meanValue;
    if (safeMode) score -= cfg.safeRiskAversion * spread;
    else if (pCrit >= cfg.critHuntChance) score += cfg.critHuntBonus;
    targets.sort((a, b) => a - b);
    scores.push({
      guess,
      score,
      meanValue,
      pCrit,
      pWorst: worsts / n,
      expectedDamage: damageSum / n,
      targetLow: targets[Math.floor(n * 0.1)],
      targetMid: targets[Math.floor(n * 0.5)],
      targetHigh: targets[Math.floor(n * 0.9)]
    });
  }

  // re-check the best few on copies of the game (every SEAL and BOSS rule applies there)
  const ranked = scores.slice().sort((a, b) => b.score - a.score);
  const candidates = ranked.slice(0, cfg.refineCandidates).map((entry) => entry.guess);
  if (obs.seals.some((seal) => seal.id === "p4")) [0, 50, 100].forEach((value) => candidates.includes(value) || candidates.push(value));
  const refineTables = [];
  for (let k = 0; k < cfg.refineSamples; k += 1) refineTables.push(sampleTable(preds, obs, rng));
  const unrevealed = preds.filter((pred) => !pred.exact).map((pred) => pred.id);
  const snap = g.snapshot();
  const refined = candidates.map((guess) => {
    let total = 0;
    let deaths = 0;
    refineTables.forEach((table, k) => {
      const result = g.lookahead(`${opts.seedBase}:guess:${obs.round}:${k}`, () => {
        const state = g.state;
        preds.forEach((pred, index) => {
          if (!unrevealed.includes(pred.id)) return;
          const bot = state.bots.find((candidate) => candidate.id === pred.id);
          if (bot) bot.plannedGuess = table.guesses[index];
        });
        if (obs.mysteryModifier) state.roundState.targetModifier = table.modifier;
        const before = scoreView(state);
        if (!g.api.guess(guess)) return null;
        g.api.ready();
        return outcomePoints(before, scoreView(g.state), { safeHp });
      }, snap);
      if (!result) return;
      total += result.total;
      if (result.total <= -CONFIG.points.death) deaths += 1;
    });
    const base = scores[guess];
    let score = total / refineTables.length;
    if (!safeMode && base.pCrit >= cfg.critHuntChance) score += cfg.critHuntBonus;
    return { guess, score, deaths };
  });
  refined.sort((a, b) => b.score - a.score);
  const intended = refined[0].guess;

  // the human part: the number typed is a little off from the plan now and then
  const offsets = [-2, -1, -1, 0, 0, 0, 0, 1, 1, 2];
  const noise = cfg.noise > 0 ? clamp(offsets[rng.int(0, offsets.length - 1)], -cfg.noise, cfg.noise) : 0;
  const final = clamp(intended + noise, 0, 100);
  const chosen = scores[intended];
  return {
    guess: final,
    intended,
    noise,
    expectedTarget: chosen.targetMid,
    targetRange: [chosen.targetLow, chosen.targetHigh],
    pCrit: round2(chosen.pCrit),
    pWorst: round2(chosen.pWorst),
    expectedDamage: round2(chosen.expectedDamage),
    safeMode,
    candidates: refined.map((entry) => ({ guess: entry.guess, score: round2(entry.score) })),
    predictions: preds.map((pred) => {
      const bot = botsById.get(pred.id);
      return { id: pred.id, name: bot?.name, type: bot?.isBoss ? "BOSS" : bot?.type, mean: Math.round(pred.mean), sd: round2(pred.sd), revealed: pred.exact };
    })
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

module.exports = { chooseGuess };
