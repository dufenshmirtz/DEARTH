function recordPlayerDamageSource(amount, source, kind = "") {
  const damage = Math.max(0, Math.ceil(amount));
  if (damage <= 0 || !source) return;
  state.playerDamageSources = state.playerDamageSources || [];
  state.playerDamageSources.push({ amount: damage, source, kind });
  if (kind === "saved") recordSealStatFromSource("saved", damage, source);
}

function recordPlayerHealSource(amount, source) {
  const healed = Math.max(0, Math.ceil(amount));
  if (healed <= 0 || !source) return;
  state.playerHealSources = state.playerHealSources || [];
  state.playerHealSources.push({ amount: healed, source });
  recordSealStatFromSource("healing", healed, source);
}

function recordPlayerCreditSource(amount, source) {
  const credits = Math.max(0, Math.ceil(amount));
  if (credits <= 0 || !source) return;
  state.playerCreditSources = state.playerCreditSources || [];
  state.playerCreditSources.push({ amount: credits, source });
  recordSealStatFromSource("credits", credits, source);
}

function recordBotSinSource(bot, amount, source) {
  const raw = Number(amount || 0);
  if (!bot || !Number.isFinite(raw) || raw === 0 || !source) return;
  const sin = raw > 0 ? Math.ceil(raw) : -Math.ceil(Math.abs(raw));
  bot.sinSources = bot.sinSources || [];
  bot.sinSources.push({ amount: sin, source });
  if (sin > 0) recordSealStatFromSource("bounty", sin, source);
  if (sin < 0) recordSealStatFromSource("bountyRemoved", Math.abs(sin), source);
}

function recordBotMemorySource(bot, amount, source) {
  const memory = Math.max(0, Math.ceil(amount));
  if (!bot || memory <= 0 || !sealIdFromStatSource(source)) return;
  bot.lastMemoryDelta = (bot.lastMemoryDelta || 0) + memory;
  bot.memorySources = bot.memorySources || [];
  bot.memorySources.push({ amount: memory, source });
  recordSealStatFromSource("memory", memory, source);
}

function clearBotMemoryBadges() {
  state.bots.forEach((bot) => {
    bot.lastMemoryDelta = 0;
    bot.memorySources = [];
  });
}

function recordBotDamageSource(bot, amount, source, kind = "") {
  const damage = Math.max(0, Math.ceil(amount));
  if (!bot || damage <= 0) return;
  recordRunDamage(damage);
  recordBotRoundDamage(bot, damage);
  if (!source) return;
  bot.damageSources = bot.damageSources || [];
  bot.damageSources.push({ amount: damage, source, kind });
  recordSealStatFromSource("damage", damage, source);
}

function recordBotRoundDamage(bot, amount) {
  const round = state.roundState;
  const damage = Math.max(0, Math.ceil(amount));
  if (!round || !bot || bot.eliminated || damage <= 0) return;
  const previous = round.botDamageTotals.get(bot.id) || 0;
  const next = previous + damage;
  round.botDamageTotals.set(bot.id, next);
  const maraxThreshold = Math.max(0, (bot.maxHp || 0) * 0.3);
  if (previous <= maraxThreshold && next > maraxThreshold) {
    applyHighDamageSinGain(bot);
  }
}

function applyHighDamageSinGain(bot) {
  const round = state.roundState;
  if (!round || !bot || bot.eliminated || round.highDamageSinBotIds.has(bot.id)) return;
  const entries = orderedPassiveEffectEntries("p51");
  if (!entries.length) return;
  round.highDamageSinBotIds.add(bot.id);
  entries.forEach((entry) => {
    const amount = passiveEntryScaledValue(entry, 4);
    if (amount <= 0) return;
    markPassiveEntryTriggered(entry);
    changeBotSin(bot, amount, `Seal of Marax gave ${bot.name} +${amount} SIN for taking more than 30% max-health damage.`, {
      triggerLossDamage: false
    });
  });
}

function recordBotHealSource(bot, amount, source) {
  const healed = Math.max(0, Math.ceil(amount));
  if (!bot || healed <= 0 || !source) return;
  bot.healSources = bot.healSources || [];
  bot.healSources.push({ amount: healed, source });
  recordSealStatFromSource("healing", healed, source);
}

function addPendingBotDamage(botDamages, botDamageSources, bot, amount, source, playerDealt = true) {
  if (!bot || bot.eliminated) return;
  const damageDetails = scaledBotDamageDetails(bot, amount, playerDealt);
  const damage = damageDetails.damage;
  if (!bot || damage <= 0) return;
  botDamages.set(bot.id, (botDamages.get(bot.id) || 0) + damage);
  if (botDamageSources) {
    const sources = botDamageSources.get(bot.id) || [];
    sources.push(...scaledBotDamageSourceEntries(damageDetails, source || "Unknown"));
    botDamageSources.set(bot.id, sources);
  }
  applyPendingRedirectDamage(damageDetails.redirectEntries, botDamages, botDamageSources);
}

function queueEndOfRoundBotDamage(bot, amount, reason, source = undefined, playerDealt = true) {
  const damage = Math.max(0, Math.ceil(amount));
  const round = state.roundState;
  if (!bot || bot.eliminated || damage <= 0) return 0;
  if (!round || round.resolvingEndOfRoundPassives) {
    return damageBot(bot, damage, reason, source, playerDealt);
  }
  if (!Array.isArray(round.pendingEndOfRoundBotDamages)) round.pendingEndOfRoundBotDamages = [];
  round.pendingEndOfRoundBotDamages.push({
    botId: bot.id,
    amount: damage,
    source: source === null ? null : source || sourceLabelFromReason(reason, "Damage"),
    playerDealt
  });
  return damage;
}

function queueEndOfRoundBotDamages(bots, amount, reasonFactory, sourceFactory = undefined, playerDealt = true) {
  return (bots || []).reduce((total, bot) => {
    if (!bot || bot.eliminated) return total;
    const rawAmount = typeof amount === "function" ? amount(bot) : amount;
    const damage = Math.max(0, Math.ceil(rawAmount));
    if (damage <= 0) return total;
    const reason = typeof reasonFactory === "function" ? reasonFactory(bot, damage) : reasonFactory;
    const source =
      sourceFactory === null
        ? null
        : typeof sourceFactory === "function"
          ? sourceFactory(bot, damage)
          : sourceFactory;
    return total + queueEndOfRoundBotDamage(bot, damage, reason, source, playerDealt);
  }, 0);
}

function applyQueuedEndOfRoundBotDamage() {
  const round = state.roundState;
  const queued = Array.isArray(round?.pendingEndOfRoundBotDamages) ? round.pendingEndOfRoundBotDamages : [];
  if (!round || !queued.length) return 0;
  round.pendingEndOfRoundBotDamages = [];
  const botDamages = new Map();
  const botDamageSources = new Map();
  queued.forEach((entry) => {
    const bot = state.bots.find((candidate) => candidate.id === entry.botId);
    const damage = Math.max(0, Math.ceil(entry.amount || 0));
    if (!bot || bot.eliminated || bot.hp <= 0 || damage <= 0) return;
    addPendingBotDamage(botDamages, botDamageSources, bot, damage, entry.source || "Queued damage", entry.playerDealt !== false);
  });
  if (!botDamages.size) return 0;
  const total = Array.from(botDamages.values()).reduce((sum, damage) => sum + Math.max(0, Math.ceil(damage || 0)), 0);
  applyPendingBotDamageBatch(botDamages, botDamageSources, state.bots);
  return total;
}

function targetDifferenceDamageDetailsForBot(bot, amount, targetDiffEntries = orderedPassiveEffectEntries("p80")) {
  const baseDamage = Math.max(0, Math.ceil(amount));
  if (!bot || baseDamage <= 0) return { damage: 0, baseDamage: 0, modifierEntries: [] };
  let exactDamage = baseDamage;
  let roundedDamage = baseDamage;
  const modifierEntries = [];
  const applyMultiplier = (multiplier, source, entry) => {
    if (!Number.isFinite(multiplier) || multiplier <= 1 || roundedDamage <= 0) return;
    const before = roundedDamage;
    exactDamage *= multiplier;
    roundedDamage = Math.ceil(exactDamage);
    const extra = Math.max(0, roundedDamage - before);
    if (extra <= 0) return;
    modifierEntries.push({ amount: extra, source, kind: "multiplier-bonus" });
    markPassiveEntryTriggered(entry);
  };

  targetDiffEntries.forEach((entry) => {
    if (entry.id === "p80" && baseDamage > 10) {
      applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p80?.name || "Seal of Silence in Heaven", entry);
    }
  });

  return { damage: roundedDamage, baseDamage, modifierEntries };
}

function addPendingTargetDifferenceBotDamage(botDamages, botDamageSources, bot, amount, source, targetDiffEntries) {
  if (!bot || amount <= 0) return 0;
  const targetDetails = targetDifferenceDamageDetailsForBot(bot, amount, targetDiffEntries);
  if (targetDetails.damage <= 0) return 0;
  const scaledDetails = scaledBotDamageDetails(bot, targetDetails.damage, false);
  const damage = scaledDetails.damage;
  if (damage <= 0) return 0;
  botDamages.set(bot.id, (botDamages.get(bot.id) || 0) + damage);
  const sourceEntries = [
    { amount: targetDetails.baseDamage, source: source || "Target difference" },
    ...targetDetails.modifierEntries,
    ...scaledDetails.modifierEntries.map((entry) => ({ ...entry, kind: entry.kind || "bonus" }))
  ];
  if (botDamageSources) {
    const sources = botDamageSources.get(bot.id) || [];
    sources.push(...sourceEntries);
    botDamageSources.set(bot.id, sources);
  }
  applyPendingRedirectDamage(scaledDetails.redirectEntries, botDamages, botDamageSources);
  const round = state.roundState;
  if (round) {
    round.targetDifferenceDamageByBotId.set(bot.id, (round.targetDifferenceDamageByBotId.get(bot.id) || 0) + damage);
  }
  return damage;
}

function recordBotExcessDamage(bot, damage, hpBefore) {
  if (!state.roundState || !bot || bot.immortal) return;
  const excess = Math.max(0, Math.ceil(damage || 0) - Math.max(0, Math.ceil(hpBefore || 0)));
  if (excess <= 0) return;
  bot.excessDamage = (bot.excessDamage || 0) + excess;
}

function applyPendingBotDamageBatch(botDamages, botDamageSources, bots, { logZero = false } = {}) {
  const eliminated = [];
  maybeActivatePavlosProtection(botDamages);
  bots.forEach((bot) => {
    if (!bot || bot.eliminated || bot.hp <= 0) return;
    if (pavlosDamageBlocked(bot)) return;
    const damage = botDamages.get(bot.id) || 0;
    if (damage <= 0) {
      if (logZero) state.roundState.roundEvents.push(`${bot.name} took 0 damage.`);
      return;
    }
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    scaleSourceEntries(botDamageSources.get(bot.id), damage).forEach((entry) =>
      recordBotDamageSource(bot, entry.amount, entry.source, entry.kind)
    );
    if (bot.immortal) {
      bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
      state.roundState.roundEvents.push(`${bot.name} took ${damage} damage. Total: ${bot.damageTakenTotal}.`);
      return;
    }
    const hpBefore = bot.hp;
    bot.hp = Math.max(0, bot.hp - damage);
    state.roundState.roundEvents.push(`${bot.name} took ${damage} damage.`);
    if (bot.hp <= 0) {
      recordBotExcessDamage(bot, damage, hpBefore);
      eliminated.push(bot);
    }
  });
  if (eliminated.length) resolveEliminatedBots(eliminated);
  return eliminated;
}

function scaleSourceEntries(sources, total) {
  const target = Math.max(0, Math.ceil(total));
  const entries = mergeSourceEntries(sources);
  const rawTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
  if (target <= 0) return [];
  if (!entries.length || rawTotal <= 0) return [{ amount: target, source: "Damage" }];
  if (rawTotal === target) return entries;

  const scaled = entries.map((entry) => {
    const exact = (entry.amount * target) / rawTotal;
    return { ...entry, amount: Math.floor(exact), fraction: exact % 1 };
  });
  let remainder = target - scaled.reduce((sum, entry) => sum + entry.amount, 0);
  scaled
    .slice()
    .sort((left, right) => right.fraction - left.fraction)
    .forEach((entry) => {
      if (remainder <= 0) return;
      entry.amount += 1;
      remainder -= 1;
    });
  return scaled.filter((entry) => entry.amount > 0).map(({ source, kind, amount }) => ({ source, kind, amount }));
}

function highestMemorySinner() {
  return activeBots()
    .slice()
    .sort((left, right) => (right.memory?.length || 0) - (left.memory?.length || 0) || right.hp - left.hp || left.id - right.id)[0];
}

function applyPlayerDamageMemoryConversion(amount) {
  let damage = Math.max(0, Math.ceil(amount));
  const conversions = [];
  if (!state.roundState || damage <= 0) return { damage, conversions, avoidedTotal: 0 };

  orderedPassiveEffectEntries("p22").forEach((entry) => {
    if (damage <= 0) return;
    const avoided = Math.min(damage, Math.floor(damage * 0.2));
    if (avoided <= 0) return;
    damage -= avoided;
    conversions.push({
      entry,
      avoided,
      memory: doubledStackValue(entry, avoided)
    });
    markPassiveEntryTriggered(entry);
  });

  return {
    damage,
    conversions,
    avoidedTotal: conversions.reduce((sum, conversion) => sum + Math.max(0, Math.ceil(conversion.avoided || 0)), 0)
  };
}

function resolvePlayerDamageMemoryConversions(conversions = []) {
  conversions.forEach(({ avoided, memory }) => {
    const target = highestMemorySinner();
    if (!target || memory <= 0) {
      addRoundEvent(`Seal of Botis avoided ${avoided} damage, but no DAMNED could receive MEMORY.`);
      return;
    }
    const added = addBotMemory(target, memory, "", { source: ITEMS.p22?.name || "Seal of Botis" });
    addRoundEvent(`Seal of Botis avoided ${avoided} damage and gave ${target.name} +${added} memory.`);
  });
}

function damagePlayer(amount, reason, echo = true, respectReduction = true, source = undefined, applySealConversion = true) {
  let damage = Math.max(0, Math.ceil(amount));
  const sourceDamage = damage;
  let reductionSaved = 0;
  if (respectReduction && state.roundState?.playerDamageReduction) {
    const beforeReduction = damage;
    damage = Math.ceil(damage * (1 - state.roundState.playerDamageReduction));
    reductionSaved = Math.max(0, beforeReduction - damage);
  }
  const conversion = applySealConversion ? applyPlayerDamageMemoryConversion(damage) : { damage, conversions: [], avoidedTotal: 0 };
  damage = conversion.damage;
  if (damage <= 0) {
    if (reductionSaved > 0) {
      recordPlayerDamageSource(reductionSaved, state.roundState?.playerDamageReductionSource || "Damage reduction", "saved");
    }
    if (conversion.avoidedTotal > 0) {
      recordPlayerDamageSource(conversion.avoidedTotal, ITEMS.p22?.name || "Seal of Botis", "saved");
    }
    resolvePlayerDamageMemoryConversions(conversion.conversions);
    return 0;
  }
  state.player.hp = Math.max(0, state.player.hp - damage);
  state.playerLastDamage = (state.playerLastDamage || 0) + damage;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Damage");
  recordPlayerDamageSource(sourceDamage, sourceLabel);
  applyBossLifeStealHealing(damage);
  if (reductionSaved > 0) {
    recordPlayerDamageSource(reductionSaved, state.roundState?.playerDamageReductionSource || "Damage reduction", "saved");
  }
  if (conversion.avoidedTotal > 0) {
    recordPlayerDamageSource(conversion.avoidedTotal, ITEMS.p22?.name || "Seal of Botis", "saved");
  }
  if (reason) addRoundEvent(reason);
  if (echo) applySpiteCircuitDamage(damage);
  if (echo) applyPainEchoDamage(damage);
  resolvePlayerDamageMemoryConversions(conversion.conversions);
  return damage;
}

function playerMaxHp() {
  return state.player.maxHp || PLAYER_MAX_HP;
}

function applySpiteCircuitDamage(playerDamage, pendingBotDamages = null, pendingBotSources = null) {
  const damage = spiteCircuitDamage(playerDamage);
  if (damage <= 0) return;
  const targets = activeBots();
  if (!targets.length) return;
  markPassiveTriggered("p5");
  if (pendingBotDamages) {
    targets.forEach((bot) => {
      addPendingBotDamage(pendingBotDamages, pendingBotSources, bot, damage, "Seal of Haures");
    });
    addRoundEvent(`Seal of Haures adds ${damage} damage to every DAMNED.`);
    return;
  }
  damageBots(targets, damage, (bot, dealt) => `Seal of Haures dealt ${dealt} damage to ${bot.name}.`, "Seal of Haures");
}

function applyPainEchoDamage(playerDamage, pendingBotDamages = null, pendingBotSources = null) {
  const round = state.roundState;
  if (!round?.painEcho || playerDamage <= 0) return;
  const source = ITEMS.a21?.name || "Voodoo Doll";
  const percent = playerDamage / Math.max(1, playerMaxHp());
  const targets = activeBots();
  if (!targets.length) return;
  const percentLabel = `${Math.round(percent * 100)}%`;
  if (pendingBotDamages) {
    targets.forEach((bot) => {
      const echoDamage = Math.ceil((bot.maxHp || 0) * percent);
      addPendingBotDamage(pendingBotDamages, pendingBotSources, bot, echoDamage, source);
    });
    round.roundEvents.push(`${source} adds ${percentLabel} max-HEALTH damage to every DAMNED.`);
    return;
  }
  targets.forEach((bot) => {
    const echoDamage = Math.ceil((bot.maxHp || 0) * percent);
    damageBot(bot, echoDamage, `${source} dealt ${echoDamage} damage to ${bot.name}.`, source);
  });
}

function healPlayer(amount, reason, source = undefined) {
  if (state.player.hp <= 0) return 0;
  amount = Math.ceil(amount);
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Healing");
  const soulBlocker = soulStealingBlocker();
  if (soulBlocker) {
    if (sourceLabel) addRoundEvent(`${soulBlocker.name}'s ${BOSS_PASSIVES.soulStealing.name} prevented ${sourceLabel} from healing you.`);
    return 0;
  }
  const healingBlocker = padmaHealingBlocker(sourceLabel);
  if (healingBlocker) {
    if (sourceLabel) addRoundEvent(`${healingBlocker.name} prevented ${sourceLabel} from healing you.`);
    return 0;
  }
  const before = state.player.hp;
  state.player.hp = Math.min(playerMaxHp(), state.player.hp + amount);
  const healed = state.player.hp - before;
  if (healed > 0) state.playerLastHeal = (state.playerLastHeal || 0) + healed;
  recordPlayerHealSource(healed, sourceLabel);
  if (healed > 0 && reason) addRoundEvent(`${reason} healed you for ${healed}.`);
  return healed;
}

function healBot(bot, amount, reason, source = undefined, options = {}) {
  amount = Math.ceil(amount);
  const before = bot.hp;
  bot.hp = options.allowOverheal ? bot.hp + amount : Math.min(bot.maxHp, bot.hp + amount);
  const healed = bot.hp - before;
  bot.lastHeal = (bot.lastHeal || 0) + healed;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Healing");
  recordBotHealSource(bot, healed, sourceLabel);
  if (healed > 0 && reason) addRoundEvent(`${reason} healed ${bot.name} for ${healed}.`);
  return healed;
}

function botRewardDetails(bot, markTriggers = false) {
  if (bot?.immortal) return { amount: 0, sourceEntries: [] };
  const bossBounty = botBossBounty(bot);
  const regularDetails = botRegularBountyPayoutDetails(bot, markTriggers);
  const sourceEntries = [];
  if (bossBounty > 0) sourceEntries.push({ amount: bossBounty, source: `${bot.name} boss bounty` });
  if (regularDetails.baseReward > 0) sourceEntries.push({ amount: regularDetails.baseReward, source: `${bot.name} bounty` });
  sourceEntries.push(...regularDetails.modifierEntries);
  return {
    amount: Math.ceil(bossBounty + regularDetails.payout),
    sourceEntries
  };
}

function botReward(bot) {
  return botRewardDetails(bot, false).amount;
}

function botHealthBonus() {
  return scalingBonus(state.bossKills, BOT_HP_BONUS_PER_BOSS, BOT_HP_BONUS_PER_BOSS_LATE, BOT_HP_BONUS_PER_BOSS_ENDLESS);
}

function bossHealthBonus() {
  return scalingBonus(
    state.bossSpawnCount,
    BOSS_HP_BONUS_PER_SPAWN,
    BOSS_HP_BONUS_PER_SPAWN_LATE,
    BOSS_HP_BONUS_PER_SPAWN_ENDLESS
  );
}

function hpExponentialFactor(progressAfterFirstEight) {
  const progress = Math.max(0, progressAfterFirstEight || 0);
  return Math.pow(HP_EXPONENTIAL_RATE, progress / HP_EXPONENTIAL_STEP_BOSSES);
}

function botHealthScaleFactor() {
  return hpExponentialFactor((state.bossKills || 0) - ENDLESS_SCALING_BREAKPOINT_BOSSES);
}

function bossHealthScaleFactor() {
  return hpExponentialFactor((state.bossSpawnCount || 0) - ENDLESS_SCALING_BREAKPOINT_BOSSES);
}

function randomBotHealth() {
  return randomBotHealthValue();
}

function randomBotHealthValue() {
  const bonus = botHealthBonus();
  const factor = botHealthScaleFactor();
  return randomInt(Math.ceil((BOT_MIN_HP + bonus) * factor), Math.ceil((BOT_MAX_HP + bonus) * factor));
}

function shopSlotCount() {
  return 3 + (hasPassive("p20") ? 1 : 0);
}

function shopSlotCountForItem(item) {
  return 3 + (item?.id === "p20" ? 1 : 0);
}

function sealSlotsFull() {
  return ownedSealSlotCount() >= passiveLimit();
}

function eliteRerollBoostCount(value = state.eliteBoostedNextReroll) {
  if (value === true) return 1;
  if (!Number.isFinite(Number(value))) return 0;
  return Math.max(0, Math.ceil(Number(value)));
}

function addEliteRerollBoost() {
  state.eliteBoostedNextReroll = eliteRerollBoostCount() + 1;
}

function eliteShopChance(eliteBoosted = state.eliteBoostedNextReroll) {
  if (ownedSealSlotCount() <= 0) return 0;
  let multiplier = 1;
  multiplier *= 2 ** eliteRerollBoostCount(eliteBoosted);
  if (sealSlotsFull()) multiplier *= 2;
  return Math.min(1, SHOP_ELITE_CHANCE * multiplier);
}

function activeInventoryLimit() {
  return ACTIVE_LIMIT + baseEditionBonus("p25");
}

function activeUseLimit() {
  return hasPassive("p24") ? 1 : ACTIVE_USES_PER_ROUND + baseEditionBonus("p25");
}

function bountyOathMultiplier() {
  return hasPassive("p24") ? 1.5 * passivePower("p24") : 1;
}

function bountyOathMultiplierForItem(item) {
  return item?.id === "p24" ? 1.5 * passivePower(item) : 1;
}

function activeBots() {
  return state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated);
}

function activeBossByOwnKey(key) {
  return state.bots.find((bot) => bot.isBoss && bot.uniqueKey === key && bot.hp > 0 && !bot.eliminated) || null;
}

function pairedBossByKey(key, pairGroupId) {
  if (!pairGroupId) return null;
  return state.bots.find((bot) => bot.isBoss && bot.uniqueKey === key && bot.pairGroupId === pairGroupId) || null;
}

function restoreProtectedPavlos(pavlos) {
  const round = state.roundState;
  if (!round || !pavlos || round.pavlosProtectedBotId === pavlos.id) return false;
  const startingHp = round.pavlosStartHpById?.get(pavlos.id);
  round.pavlosDeferredBotIds?.delete(pavlos.id);
  pavlos.eliminated = false;
  pavlos.hp = Math.max(1, Math.ceil(startingHp || pavlos.hp || pavlos.maxHp / 2 || 1));
  pavlos.lastDamage = 0;
  pavlos.damageSources = [];
  pavlos.deathCause = null;
  pavlos.deathNotice = null;
  pavlos.pendingReplacementSpec = null;
  round.pavlosProtectedBotId = pavlos.id;
  round.roundEvents.push("Pavlos refused lethal damage because both twins would have fallen.");
  return true;
}

function protectPavlosAcrossRound(freshEliminations) {
  const round = state.roundState;
  if (!round || round.pavlosProtectedBotId) return freshEliminations;
  if (round.resolvingDeferredPavlos) return freshEliminations;
  const fallingIds = new Set(freshEliminations.map((bot) => bot.id));

  const protectedEliminations = freshEliminations.filter((bot) => {
    if (bot.uniqueKey !== "pavlos") return true;
    const petros = pairedBossByKey("petros", bot.pairGroupId);
    const petrosFalling = petros && (fallingIds.has(petros.id) || petros.eliminated || petros.hp <= 0);
    if (!petrosFalling && petros && !petros.eliminated && petros.hp > 0) {
      round.pavlosDeferredBotIds?.add(bot.id);
      bot.hp = 1;
      return false;
    }
    if (!petrosFalling) return true;
    restoreProtectedPavlos(bot);
    return false;
  });

  freshEliminations.forEach((bot) => {
    if (bot.uniqueKey !== "petros") return;
    const pavlos = pairedBossByKey("pavlos", bot.pairGroupId);
    if (pavlos && (pavlos.eliminated || pavlos.hp <= 0 || round.pavlosDeferredBotIds?.has(pavlos.id))) {
      restoreProtectedPavlos(pavlos);
    }
  });

  return protectedEliminations;
}

function resolveDeferredPavlosEliminations() {
  const round = state.roundState;
  const deferredIds = Array.from(round?.pavlosDeferredBotIds || []);
  if (!round || !deferredIds.length) return;
  round.pavlosDeferredBotIds.clear();
  deferredIds.forEach((id) => {
    const pavlos = state.bots.find((bot) => bot.id === id && bot.uniqueKey === "pavlos");
    if (!pavlos || pavlos.eliminated || round.pavlosProtectedBotId === pavlos.id) return;
    const petros = pairedBossByKey("petros", pavlos.pairGroupId);
    if (!petros || petros.eliminated || petros.hp <= 0) {
      restoreProtectedPavlos(pavlos);
      return;
    }
    round.resolvingDeferredPavlos = true;
    pavlos.hp = 0;
    resolveEliminatedBots([pavlos]);
    round.resolvingDeferredPavlos = false;
  });
}

function maybeActivatePavlosProtection(incomingDamageById) {
  const round = state.roundState;
  if (!round || round.pavlosProtectedBotId) return null;
  const petros = activeBossByOwnKey("petros");
  const pavlos = activeBossByOwnKey("pavlos");
  if (!petros || !pavlos || petros.pairGroupId !== pavlos.pairGroupId) return null;
  const petrosDamage = Math.max(0, Math.ceil(incomingDamageById.get(petros.id) || 0));
  const pavlosDamage = Math.max(0, Math.ceil(incomingDamageById.get(pavlos.id) || 0));
  if (petrosDamage < petros.hp || pavlosDamage < pavlos.hp) return null;
  round.pavlosProtectedBotId = pavlos.id;
  round.roundEvents.push("Pavlos refused lethal damage because both twins would have fallen.");
  return pavlos.id;
}

function pavlosDamageBlocked(bot) {
  return Boolean(
    bot &&
      (state.roundState?.pavlosProtectedBotId === bot.id || state.roundState?.pavlosDeferredBotIds?.has(bot.id))
  );
}

function damageBot(bot, amount, reason, source = undefined, playerDealt = true) {
  const rawDamage = Math.max(0, Math.ceil(amount));
  if (!bot || bot.eliminated || rawDamage <= 0) return 0;
  const damageDetails = scaledBotDamageDetails(bot, amount, playerDealt);
  const damage = damageDetails.damage;
  if (damage <= 0) return 0;
  if (pavlosDamageBlocked(bot)) return 0;
  bot.lastDamage = (bot.lastDamage || 0) + damage;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Damage");
  recordScaledBotDamageSources(bot, damageDetails, sourceLabel);
  if (bot.immortal) {
    bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
    if (reason) {
      addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${damage} damage to ${bot.name}.` : reason);
    }
    applyDirectRedirectDamage(damageDetails.redirectEntries);
    return damage;
  }
  const hpBefore = bot.hp;
  bot.hp = Math.max(0, bot.hp - damage);
  if (reason) {
    addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${damage} damage to ${bot.name}.` : reason);
  }
  applyDirectRedirectDamage(damageDetails.redirectEntries);
  if (bot.hp <= 0) {
    recordBotExcessDamage(bot, damage, hpBefore);
    resolveEliminatedBots([bot]);
  }
  return damage;
}

function damageBotNonLethal(bot, amount, reason, source = undefined, playerDealt = true) {
  const rawDamage = Math.max(0, Math.ceil(amount));
  if (!bot || bot.eliminated || bot.hp <= 1 || rawDamage <= 0) return 0;
  const damageDetails = scaledBotDamageDetails(bot, amount, playerDealt);
  const damage = damageDetails.damage;
  if (damage <= 0) return 0;
  if (pavlosDamageBlocked(bot)) return 0;
  if (bot.immortal) {
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
    const reasonText = typeof reason === "function" ? reason(bot, damage) : reason;
    const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reasonText, "Damage");
    recordScaledBotDamageSources(bot, damageDetails, sourceLabel);
    if (reasonText) addRoundEvent(reasonText);
    applyDirectRedirectDamage(damageDetails.redirectEntries);
    return damage;
  }
  const before = bot.hp;
  bot.lastDamage = (bot.lastDamage || 0) + damage;
  bot.hp = Math.max(1, bot.hp - damage);
  const dealt = before - bot.hp;
  const reasonText = typeof reason === "function" ? reason(bot, dealt) : reason;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reasonText, "Damage");
  scaleSourceEntries(scaledBotDamageSourceEntries(damageDetails, sourceLabel), dealt).forEach((entry) =>
    recordBotDamageSource(bot, entry.amount, entry.source, entry.kind)
  );
  if (reasonText && dealt > 0) {
    addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${dealt} non-lethal damage to ${bot.name}.` : reasonText);
  }
  applyDirectRedirectDamage(damageDetails.redirectEntries);
  return dealt;
}

function damageBots(bots, amount, reasonFactory, sourceFactory = undefined, playerDealt = true) {
  const eliminated = [];
  const planned = bots.map((bot) => {
    if (!bot || bot.eliminated) return { bot, damageDetails: { damage: 0, baseDamage: 0, modifierEntries: [] }, damage: 0 };
    const damageDetails = scaledBotDamageDetails(bot, typeof amount === "function" ? amount(bot) : amount, playerDealt);
    const damage = damageDetails.damage;
    return { bot, damageDetails, damage };
  });
  maybeActivatePavlosProtection(new Map(planned.map(({ bot, damage }) => [bot?.id, damage])));
  planned.forEach(({ bot, damageDetails, damage }) => {
    if (!bot || bot.eliminated || damage <= 0 || pavlosDamageBlocked(bot)) return;
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    const reason = typeof reasonFactory === "function" ? reasonFactory(bot, damage) : reasonFactory;
    const source =
      sourceFactory === null
        ? ""
        : typeof sourceFactory === "function"
          ? sourceFactory(bot, damage)
          : sourceFactory || sourceLabelFromReason(reason, "Damage");
    recordScaledBotDamageSources(bot, damageDetails, source);
    if (bot.immortal) {
      bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
      if (reason) addRoundEvent(reason);
      applyDirectRedirectDamage(damageDetails.redirectEntries);
      return;
    }
    const hpBefore = bot.hp;
    bot.hp = Math.max(0, bot.hp - damage);
    if (reason) addRoundEvent(reason);
    if (bot.hp <= 0) {
      recordBotExcessDamage(bot, damage, hpBefore);
      eliminated.push(bot);
    }
    applyDirectRedirectDamage(damageDetails.redirectEntries);
  });
  if (eliminated.length) resolveEliminatedBots(eliminated);
  return eliminated;
}

function eraseBotWithoutReward(bot, reason, cause = "erased") {
  if (!bot || bot.eliminated) return;
  if (bot.immortal) {
    if (reason) addRoundEvent(`${bot.name} cannot be erased.`);
    return;
  }
  bot.hp = 0;
  bot.eliminated = true;
  bot.deathCause = cause;
  bot.deathNotice = cause === "contract" ? "CONTRACT" : "ERASED";
  bot.pendingReplacementSpec = null;
  if (reason) addRoundEvent(reason);
}

function archetypeByType(type) {
  return BOT_ARCHETYPES.find((archetype) => archetype.type === type) || randomFrom(BOT_ARCHETYPES);
}

// bosses have no personality, so every personality seal skips them
function personalityType(bot) {
  if (!bot || bot.isBoss) return "";
  return bot.type || "";
}

function samePersonalityBots(bot) {
  const type = personalityType(bot);
  if (!type) return [];
  return activeBots().filter((candidate) => candidate.id !== bot?.id && personalityType(candidate) === type);
}

function mostPrevalentPersonality() {
  const counts = new Map();
  activeBots().forEach((bot) => {
    const type = personalityType(bot);
    if (!type) return;
    counts.set(type, (counts.get(type) || 0) + 1);
  });
  const bestCount = Math.max(0, ...Array.from(counts.values()));
  const best = Array.from(counts.entries())
    .filter((entry) => entry[1] === bestCount)
    .map((entry) => entry[0]);
  return best.length ? randomFrom(best) : "";
}

function applyPersonalityAlterationDamage(bot, source = "Personality alteration") {
  const entries = orderedPassiveEffectEntries("p90");
  if (!bot || !entries.length || bot.eliminated) return;
  entries.forEach((entry) => {
    if (bot.eliminated) return;
    const damage = passiveEntryFlatDamage(entry, 10);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    const name = passiveName("p90", "Seal of Bifrons");
    queueEndOfRoundBotDamage(bot, damage, `${name} dealt ${damage} damage to ${bot.name} after ${source} altered their personality.`, name);
  });
}

function setBotPersonality(bot, type, source = "", { triggerAlterationDamage = true, markEntry = null } = {}) {
  if (!bot || bot.isBoss || bot.eliminated || !type || personalityType(bot) === type) return false;
  const archetype = archetypeByType(type);
  bot.type = archetype.type;
  bot.color = archetype.color;
  bot.anchor = clamp(Math.ceil((bot.anchor || archetype.anchor) * 0.55 + archetype.anchor * 0.45), 0, 100);
  bot.aggression = archetype.aggression;
  bot.noise = archetype.noise;
  if (markEntry) markPassiveEntryTriggered(markEntry);
  if (source) addRoundEvent(`${source} changed ${bot.name}'s personality to ${archetype.type}.`);
  if (triggerAlterationDamage) applyPersonalityAlterationDamage(bot, source || "a SEAL");
  return true;
}

function allowedTwinTemperType() {
  return randomFrom(["Analyst", "Stubborn"]);
}

function enforceTwinTemperPersonalities() {
  const entries = orderedPassiveEffectEntries("p89");
  if (!entries.length) return;
  activeBots().forEach((bot) => {
    if (["Analyst", "Stubborn"].includes(personalityType(bot))) return;
    const entry = entries[0];
    setBotPersonality(bot, allowedTwinTemperType(), passiveName("p89", "Seal of Marax"), { markEntry: entry });
  });
}

function applyForcedDoctrineEndRound() {
  const entries = orderedPassiveEffectEntries("p90");
  if (!entries.length) return;
  const prevalent = mostPrevalentPersonality();
  if (!prevalent) return;
  entries.forEach((entry) => {
    const targets = activeBots().filter((bot) => personalityType(bot) !== prevalent);
    if (!targets.length) return;
    const target = randomFrom(targets);
    setBotPersonality(target, prevalent, passiveName("p90", "Seal of Bifrons"), { markEntry: entry });
  });
}

function applyFixedWillStart() {
  const entries = orderedPassiveEffectEntries("p107");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const targets = activeBots().filter((bot) => personalityType(bot) !== "Stubborn");
    if (targets.length) {
      const target = randomFrom(targets);
      setBotPersonality(target, "Stubborn", passiveName("p107", "Seal of Ose"), { markEntry: entry });
    }
    const eliteDamage = Math.max(0, Math.ceil((entry.stack || 1) - 1) * 5);
    if (eliteDamage <= 0) return;
    const stubbornTargets = activeBots().filter((bot) => personalityType(bot) === "Stubborn");
    if (!stubbornTargets.length) return;
    markPassiveEntryTriggered(entry);
    queueEndOfRoundBotDamages(
      stubbornTargets,
      eliteDamage,
      (bot, damage) => `${passiveName("p107", "Seal of Ose")} dealt ${damage} ELITE damage to ${bot.name}.`,
      passiveName("p107", "Seal of Ose")
    );
  });
}

function inheritedReplacementProfile(bot, entry) {
  if (!bot || bot.isBoss || bot.immortal || !entry) return null;
  const chance = Math.min(1, 0.5 + Math.max(0, (entry.stack || 1) - 1) * 0.1);
  if (Math.random() >= chance) return null;
  markPassiveEntryTriggered(entry);
  return {
    name: bot.name,
    flag: bot.flag,
    country: bot.country,
    type: personalityType(bot),
    anchor: bot.anchor,
    aggression: bot.aggression,
    noise: bot.noise,
    color: bot.color,
    image: bot.image,
    memory: (bot.memory || []).slice(-botMemoryLimit(bot))
  };
}

function randomBossPassiveKeys(count) {
  return shuffled(BOSS_PASSIVE_KEYS).slice(0, count);
}

function sealEntityName(passiveId) {
  return (ITEMS[passiveId]?.name || "PandoriumBeast").replace(/^Seal of\s+/i, "");
}

function goeticBossImagePath(passiveId) {
  const file = GOETIC_BOSS_IMAGE_BY_PASSIVE_ID[passiveId];
  return file ? `${GOETIC_BOSS_IMAGE_ROOT}/${file}` : randomBotImage();
}

function goeticBossSpecFromKey(key) {
  const spec = GOETIC_BOSS_BY_KEY[key] || randomFrom(GOETIC_BOSS_SPECS);
  const passiveId = spec.passiveId || null;
  return {
    key: spec.key,
    passiveId,
    name: spec.name,
    sealName: passiveId ? ITEMS[passiveId]?.name || `Seal of ${spec.name}` : `Seal of ${spec.name}`,
    image: `${GOETIC_BOSS_IMAGE_ROOT}/${spec.image}`
  };
}

function uniqueBossSpecFromKey(key) {
  if (key !== "petros") return { uniqueKey: key };
  const groupId = `petros-pavlos-${state.nextBossPairId++}`;
  const powers = shuffled(PETROS_PAVLOS_POWER_KEYS);
  return {
    uniqueKey: "petros",
    pairGroupId: groupId,
    copiedUniqueKey: powers[0] || "zilon",
    pairedBossSpec: {
      uniqueKey: "pavlos",
      pairGroupId: groupId,
      copiedUniqueKey: powers[1] || powers[0] || "dantre"
    }
  };
}

function grantRandomBossPassive(bot) {
  if (!bot || bot.hp <= 0 || bot.eliminated) return null;
  const owned = new Set([...(bot.passiveKeys || []), bot.buffPassiveKey].filter(Boolean));
  if (bot.isBoss && bot.goeticKey && owned.size >= 1) return null;
  const choices = BOSS_PASSIVE_KEYS.filter((key) => !owned.has(key));
  if (!choices.length) return null;
  const key = randomFrom(choices);
  bot.passiveKeys.push(key);
  return key;
}

function grantRandomPyrosGift(bot) {
  if (!bot || bot.hp <= 0 || bot.eliminated) return null;
  const owned = new Set([...(bot.passiveKeys || []), bot.buffPassiveKey].filter(Boolean));
  const choices = PYROS_GIFT_KEYS.filter((key) => !owned.has(key));
  if (!choices.length) return null;
  const key = randomFrom(choices);
  bot.passiveKeys.push(key);
  return key;
}

