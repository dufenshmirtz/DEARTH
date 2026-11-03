"use strict";

// The bot's picture of the table: what each DAMNED will probably guess, as a range (mean +/- spread).
// Rules of thumb per personality, the way an experienced player reads the cards, then corrected during
// the run by watching how wrong each guess was. It never reads the game's real planned guesses.

// a good player's rough idea of each personality's "usual number" and how wild it is
const TYPE_PRIOR = {
  Anchor: { usual: 55, sd: 7 },
  Analyst: { usual: 40, sd: 5 },
  Follower: { usual: 50, sd: 6 },
  Stubborn: { usual: 65, sd: 6 },
  Drifter: { usual: 35, sd: 11 },
  Caller: { usual: 45, sd: 8 },
  Boss: { usual: 40, sd: 3 }
};
const FRESH_SD = 13;
const KEEP = 6; // how many past rounds a player keeps in mind per DAMNED

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

class TableModel {
  constructor() {
    this.history = []; // one entry per finished round
    this.bots = new Map(); // DAMNED id -> what we learned about it
    this.typeResiduals = new Map(); // personality -> recent prediction errors (all DAMNED of that kind)
  }

  botRecord(bot) {
    if (!this.bots.has(bot.id)) this.bots.set(bot.id, { usualSamples: [], residuals: [], lastPrediction: null });
    return this.bots.get(bot.id);
  }

  typeKey(bot) {
    return bot.isBoss ? "Boss" : TYPE_PRIOR[bot.type] ? bot.type : "Anchor";
  }

  // projected "last TARGET" under this round's modifier (the TARGET moves when a BOSS changes it)
  context(obs) {
    const modifier = obs.modifier ?? 0.8;
    const offset = obs.offset || 0;
    const last = this.history[this.history.length - 1];
    const prev = this.history[this.history.length - 2] || last;
    if (!last) return null;
    const lastT = last.tableAverage * modifier + offset;
    const prevT = prev.tableAverage * modifier + offset;
    return { last, lastT, trend: lastT - prevT, modifier, offset };
  }

  // how much a personality leans on its usual number (the rest follows the table)
  usualWeight(type) {
    if (type === "Stubborn") return 0.72;
    if (type === "Anchor") return 0.42;
    return 0;
  }

  ruleMean(type, record, ctx) {
    const usual = this.usualOf(type, record);
    const { last, lastT, trend, modifier } = ctx;
    switch (type) {
      case "Analyst":
        return lastT + trend * 0.45;
      case "Follower":
        return Number.isFinite(last.playerGuess) ? last.playerGuess * 0.5 + lastT * 0.5 : lastT;
      case "Caller":
        return last.botAverage * 0.6 + lastT * 0.4;
      case "Stubborn":
        return usual * 0.72 + lastT * 0.28;
      case "Drifter":
        return lastT * 0.56 + last.tableAverage * modifier * 0.44;
      default:
        return usual * 0.42 + lastT * 0.58;
    }
  }

  usualOf(type, record) {
    const prior = (TYPE_PRIOR[type] || TYPE_PRIOR.Anchor).usual;
    const samples = record?.usualSamples || [];
    if (!samples.length) return prior;
    // one imagined sample of the prior keeps early estimates sensible
    return (prior + samples.reduce((sum, value) => sum + value, 0)) / (samples.length + 1);
  }

  // where the smart players (BOSSES, and us) will aim: the TARGET itself
  smartTarget(nonSmartSum, nonSmartCount, smartCount, ctx) {
    const total = nonSmartCount + smartCount;
    if (!total) return 40;
    const { modifier, offset } = ctx || { modifier: 0.8, offset: 0 };
    const denominator = 1 - (smartCount * modifier) / total;
    const value = Math.abs(denominator) > 0.05 ? ((nonSmartSum * modifier) / total + offset) / denominator : (nonSmartSum / Math.max(1, nonSmartCount)) * modifier + offset;
    return Math.max(0, Math.min(100, value));
  }

  // [{ id, mean, sd, exact }] for every living DAMNED
  predict(obs) {
    const ctx = this.context(obs);
    const out = [];
    const bosses = [];
    for (const bot of obs.bots) {
      const record = this.botRecord(bot);
      if (bot.revealed && Number.isFinite(bot.guess)) {
        out.push({ id: bot.id, mean: bot.guess, sd: 0, exact: true });
        record.lastPrediction = null;
        continue;
      }
      if (bot.isBoss) {
        bosses.push(bot);
        continue;
      }
      const key = this.typeKey(bot);
      let guessMean;
      let sd;
      if (!ctx || bot.fresh) {
        const types = [bot.type, bot.type2].filter(Boolean);
        guessMean = mean(types.map((type) => this.usualOf(type, record)));
        sd = FRESH_SD;
      } else {
        const types = [bot.type, bot.type2].filter(Boolean);
        guessMean = mean(types.map((type) => this.ruleMean(type, record, ctx)));
        sd = (TYPE_PRIOR[key] || TYPE_PRIOR.Anchor).sd;
      }
      const learned = this.learnedError(bot, record);
      guessMean += learned.bias;
      sd = Math.max(sd, learned.spread);
      out.push({ id: bot.id, mean: Math.max(0, Math.min(100, guessMean)), sd, exact: false, rawMean: guessMean - learned.bias });
    }
    if (bosses.length) {
      const known = out.reduce((sum, entry) => sum + entry.mean, 0);
      const target = this.smartTarget(known, out.length, bosses.length + 1, ctx);
      bosses.forEach((bot) => {
        const record = this.botRecord(bot);
        const learned = this.learnedError(bot, record);
        out.push({ id: bot.id, mean: Math.max(0, Math.min(100, target + learned.bias)), sd: Math.max(TYPE_PRIOR.Boss.sd, learned.spread), exact: false, rawMean: target });
      });
    }
    out.forEach((entry) => {
      if (!entry.exact) this.bots.get(entry.id).lastPrediction = { mean: entry.rawMean, ctx };
    });
    return out;
  }

  // the corrections we learned by watching this DAMNED (or others of its kind)
  learnedError(bot, record) {
    const own = record.residuals.slice(-KEEP);
    const kind = (this.typeResiduals.get(this.typeKey(bot)) || []).slice(-KEEP * 3);
    const pool = own.length >= 2 ? own : own.concat(kind);
    if (!pool.length) return { bias: 0, spread: 0 };
    const bias = mean(pool) * 0.5;
    const spread = Math.sqrt(mean(pool.map((value) => (value - bias) ** 2)));
    return { bias, spread: spread * 0.9 };
  }

  // after a round: every DAMNED's guess is on its card now; remember it and how wrong we were
  observeRound(info) {
    // info: { target, tableAverage, modifier, offset, playerGuess, botAverage, guesses: [{ id, type, isBoss, guess }] }
    const ctxBefore = this.history.length ? this.context({ modifier: info.modifier, offset: info.offset }) : null;
    for (const entry of info.guesses) {
      const record = this.botRecord(entry);
      if (record.lastPrediction && Number.isFinite(entry.guess)) {
        const residual = entry.guess - record.lastPrediction.mean;
        record.residuals.push(residual);
        if (record.residuals.length > KEEP * 2) record.residuals.shift();
        const key = this.typeKey(entry);
        if (!this.typeResiduals.has(key)) this.typeResiduals.set(key, []);
        const list = this.typeResiduals.get(key);
        list.push(residual);
        if (list.length > KEEP * 6) list.shift();
      }
      // learn the usual number of the DAMNED that lean on one
      const weight = this.usualWeight(entry.type);
      if (weight > 0 && Number.isFinite(entry.guess)) {
        const lastT = ctxBefore ? ctxBefore.lastT : null;
        const usual = lastT === null ? entry.guess : (entry.guess - (1 - weight) * lastT) / weight;
        record.usualSamples.push(Math.max(0, Math.min(100, usual)));
        if (record.usualSamples.length > KEEP) record.usualSamples.shift();
      }
      record.lastPrediction = null;
    }
    this.history.push({
      target: info.target,
      tableAverage: info.tableAverage,
      modifier: info.modifier,
      offset: info.offset,
      playerGuess: info.playerGuess,
      botAverage: info.botAverage
    });
    if (this.history.length > 20) this.history.shift();
  }
}

module.exports = { TableModel, TYPE_PRIOR };
