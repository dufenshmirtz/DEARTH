"use strict";

// The points scale: turns any result (HP lost, SIN gained, DAMNED hurt or killed, BOSS damage)
// into one number, so the bot can compare a guess, an ARTIFACT and a purchase with each other.
const CONFIG = require("./config");

// HP weight at a given HEALTH: 1 point per HP while healthy, rising smoothly to 2 at the safe line
function hpWeight(hp, safeHp, cfg = CONFIG.points) {
  const top = safeHp + 30;
  if (hp >= top) return cfg.hp;
  if (hp <= safeHp) return cfg.hpLow;
  return cfg.hp + ((top - hp) / 30) * (cfg.hpLow - cfg.hp);
}

// cost of losing `damage` HP starting at `hp` (negative damage = healing, worth the same)
function hpLossCost(hp, damage, safeHp, cfg = CONFIG.points) {
  if (damage === 0) return 0;
  if (damage >= hp) return cfg.death;
  const step = damage > 0 ? 1 : -1;
  let cost = 0;
  let h = hp;
  for (let i = 0; i < Math.abs(damage); i += 1) {
    const at = step > 0 ? h - 0.5 : h + 0.5;
    cost += step * hpWeight(at, safeHp, cfg);
    h -= step;
  }
  return cost;
}

// SIN is only worth what it can buy: full value for a working bank, less for a pile, little past 150
function sinValue(before, after, cfg = CONFIG.points) {
  const comfort = cfg.sinComfort;
  const cap = CONFIG.shop.sinCap;
  const value = (x) => {
    if (x <= comfort) return x * cfg.sin;
    if (x <= cap) return comfort * cfg.sin + (x - comfort) * cfg.sinPile;
    return comfort * cfg.sin + (cap - comfort) * cfg.sinPile + (x - cap) * cfg.sinAbove150;
  };
  return value(Math.max(0, after)) - value(Math.max(0, before));
}

// a compact copy of what matters for scoring
function scoreView(state) {
  return {
    hp: state.player.hp,
    sin: Math.max(0, state.player.credits || 0),
    gameOver: Boolean(state.gameOver),
    bossKills: state.bossKills,
    kills: state.eliminations,
    actives: state.player.actives.map((item) => item.uid),
    bots: state.bots.map((bot) => ({
      id: bot.id,
      isBoss: Boolean(bot.isBoss),
      immortal: Boolean(bot.immortal),
      hp: Math.max(0, bot.hp),
      maxHp: bot.maxHp,
      bounty: Number.isFinite(bot.reward) ? Math.max(0, bot.reward) : 0,
      dead: Boolean(bot.eliminated) || bot.hp <= 0
    }))
  };
}

// points for going from `before` to `after` (both scoreView)
function outcomePoints(before, after, { safeHp, keepValueOf = () => 0 } = {}) {
  const cfg = CONFIG.points;
  if (after.gameOver || after.hp <= 0) return { total: -cfg.death, parts: { death: -cfg.death } };
  const parts = {};
  parts.hp = -hpLossCost(before.hp, before.hp - after.hp, safeHp);
  parts.sin = sinValue(before.sin, after.sin);
  let damned = 0;
  let boss = 0;
  let bounty = 0;
  const afterById = new Map(after.bots.map((bot) => [bot.id, bot]));
  before.bots.forEach((bot) => {
    if (bot.dead || bot.immortal) return;
    const now = afterById.get(bot.id);
    const hpAfter = !now || now.dead ? 0 : now.hp;
    const lost = Math.max(0, bot.hp - hpAfter);
    const share = bot.maxHp > 0 ? Math.min(1, lost / bot.maxHp) : 0;
    if (bot.isBoss) {
      boss += share * 100 * cfg.bossPercent;
      if (hpAfter <= 0) boss += cfg.bossKillBonus;
    } else {
      damned += share * cfg.killProgress;
      if (now && !now.dead) bounty += (now.bounty - bot.bounty) * cfg.bountyOnLivingDamned;
    }
  });
  parts.damned = damned;
  parts.boss = boss;
  parts.bounty = bounty;
  // ARTIFACTS that are gone (used) lose their keep value; ones bought this step were paid in SIN
  const afterUids = new Set(after.actives);
  let used = 0;
  before.actives.forEach((uid) => {
    if (!afterUids.has(uid)) used += keepValueOf(uid);
  });
  parts.artifacts = -used;
  const total = Object.values(parts).reduce((sum, value) => sum + value, 0);
  return { total, parts };
}

module.exports = { hpWeight, hpLossCost, sinValue, scoreView, outcomePoints };
