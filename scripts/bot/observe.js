"use strict";

// What a player can see on screen, copied out of the game. The bot's decisions read only this
// (plus copies of the game where every hidden guess has been replaced by the bot's own estimate).

function observe(g) {
  const s = g.state;
  const round = s.roundState || {};
  const guessStage = s.stage === "guess";
  const tags = g.buildTags;
  const bots = s.bots
    .filter((bot) => !bot.eliminated && bot.hp > 0)
    .map((bot) => {
      const shownGuess = guessStage
        ? bot.revealedByPassive
          ? bot.plannedGuess
          : null
        : round.botEffectiveGuesses?.get(bot.id) ?? null;
      return {
        id: bot.id,
        name: bot.name,
        type: bot.type,
        type2: bot.type2 || null,
        isBoss: Boolean(bot.isBoss),
        bossName: bot.isBoss ? bot.name : null,
        uniqueKey: bot.uniqueKey || null,
        immortal: Boolean(bot.immortal),
        hp: bot.hp,
        maxHp: bot.maxHp,
        bounty: Number.isFinite(bot.reward) ? Math.max(0, Math.ceil(bot.reward)) : 0,
        memory: (bot.memory || []).length,
        fresh: (bot.memory || []).length === 0,
        revealed: shownGuess !== null && shownGuess !== undefined,
        guess: shownGuess
      };
    });
  return {
    round: s.round,
    stage: s.stage,
    hp: s.player.hp,
    maxHp: s.player.maxHp,
    sin: Math.max(0, Math.floor(s.player.credits || 0)),
    seals: s.player.passives.map((item, index) => ({
      index,
      id: item.id,
      name: item.name,
      stack: item.stack || 1,
      price: item.price || 0,
      tags: tags[item.id] || ["general"]
    })),
    sealLimit: g.run("passiveLimit()"),
    sealSlotsUsed: g.run("ownedSealSlotCount()"),
    artifacts: s.player.actives.map((item, index) => ({ index, id: item.id, name: item.name, price: item.price || 0, uid: item.uid })),
    artifactLimit: g.run("activeInventoryLimit()"),
    artifactUsesLeft: Math.max(0, g.run("activeUseLimit()") - (round.activeUses || 0)),
    shop: (s.shop || []).map((slot, index) => ({
      slot: index,
      id: slot.item.id,
      type: slot.item.type,
      name: slot.item.name,
      price: g.api.shopPrice(slot.item),
      sold: Boolean(slot.sold),
      tags: slot.item.type === "passive" ? tags[slot.item.id] || ["general"] : []
    })),
    rerollCost: g.api.rerollCost(),
    bots,
    modifier: round.mysteryModifier ? null : round.targetModifier,
    mysteryModifier: Boolean(round.mysteryModifier),
    offset: round.targetOffset || 0,
    target: guessStage ? null : round.target,
    playerGuess: guessStage ? null : round.playerEffectiveGuess,
    kills: s.eliminations,
    bossKills: s.bossKills,
    bossAlive: bots.some((bot) => bot.isBoss)
  };
}

module.exports = { observe };
