function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(values) {
  return values[randomInt(0, values.length - 1)];
}

function pvpRollModifier(currentModifier = null) {
  let choices = PVP_MODIFIERS.slice();
  if (Number.isFinite(currentModifier)) {
    choices =
      currentModifier >= 1
        ? choices.filter((modifier) => modifier < 1)
        : choices.filter((modifier) => modifier > currentModifier);
  }
  if (!choices.length) choices = PVP_MODIFIERS.slice();
  return randomFrom(choices);
}

function shuffled(values) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function nearestMultiple(value, divisor) {
  const number = Number(value);
  const step = Math.max(1, Math.ceil(divisor));
  if (!Number.isFinite(number)) return 0;
  return Math.ceil(Math.round(number / step) * step);
}

function nearestMultipleFromDivisors(value, divisors) {
  const number = Number(value);
  if (!Number.isFinite(number)) return { value: 0, divisor: 1 };
  const forceDifferent = divisors.some((divisor) => {
    const step = Math.max(1, Math.ceil(divisor));
    return number % step === 0;
  });
  return divisors
    .flatMap((divisor) => {
      const step = Math.max(1, Math.ceil(divisor));
      const lower = Math.floor(number / step) * step;
      const upper = Math.ceil(number / step) * step;
      const values = new Set([lower, upper]);
      if (forceDifferent && values.has(number)) {
        values.delete(number);
        values.add(lower - step);
        values.add(upper + step);
      }
      return [...values].map((snapped) => ({ divisor, value: Math.ceil(snapped), distance: Math.abs(snapped - number) }));
    })
    .sort((left, right) => left.distance - right.distance || left.value - right.value || left.divisor - right.divisor)[0];
}

function hasPassive(id) {
  return passiveStack(id) > 0;
}

function passiveEntry(id) {
  return state.player.passives.find((item) => item.id === id) || null;
}

function directPassiveStack(id) {
  return passiveEntry(id)?.stack || 0;
}

function sealSlotCost(idOrItem) {
  const id = typeof idOrItem === "string" ? idOrItem : idOrItem?.id;
  return SATAN_SEAL_IDS.has(id) ? 2 : 1;
}

function ownedSealSlotCount() {
  return state.player.passives
    .filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id))
    .reduce((sum, item) => sum + sealSlotCost(item), 0);
}

function hasSealSlotRoomFor(item) {
  return ownedSealSlotCount() + sealSlotCost(item) <= passiveLimit();
}

function pruneRemovedPassives() {
  const before = state.player.passives.length;
  state.player.passives = state.player.passives.filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id));
  if (state.player.passives.length !== before) refreshMimicTarget();
}

function suppressingBossForSeal(id) {
  if (!id || !state.bots?.length) return null;
  const sealName = ITEMS[id]?.name || "";
  return (
    state.bots.find(
      (bot) =>
        bot.isBoss &&
        bot.hp > 0 &&
        !bot.eliminated &&
        (bot.goeticPassiveId === id || (sealName && bot.goeticSealName === sealName))
    ) || null
  );
}

function kalhaSuppressionForSeal(id) {
  const round = state.roundState;
  if (!id || !round || !round.kalhaSuppressedPassiveIds?.has(id)) return null;
  return state.bots.find((bot) => bot.id === round.kalhaSuppressedById && bot.hp > 0 && !bot.eliminated) || {
    name: "Kalha"
  };
}

function isSealSuppressed(id) {
  return Boolean(suppressingBossForSeal(id) || kalhaSuppressionForSeal(id));
}

function sealSuppressionNotice(id) {
  const goeticBoss = suppressingBossForSeal(id);
  if (goeticBoss) return `Disabled while ${goeticBoss.name} is alive.\n`;
  const kalhaBoss = kalhaSuppressionForSeal(id);
  if (kalhaBoss) return `Disabled by ${kalhaBoss.name} this round.\n`;
  return "";
}

function mimicEntry() {
  return passiveEntry("p28");
}

function availableMimicTargets() {
  return state.player.passives.filter(
    (item) => item && item.id !== "p28" && !REMOVED_PASSIVE_IDS.has(item.id) && !isSelfStackingSeal(item.id)
  );
}

function chooseMimicTarget(mimic = mimicEntry()) {
  if (!mimic) return null;
  const choices = availableMimicTargets();
  if (!choices.length) {
    delete mimic.copiedPassiveId;
    return null;
  }
  const target = randomFrom(choices);
  mimic.copiedPassiveId = target.id;
  return target;
}

function mimicTargetEntry() {
  const mimic = mimicEntry();
  if (!mimic) return null;
  const target = mimic.copiedPassiveId
    ? state.player.passives.find(
        (item) =>
          item &&
          item.id === mimic.copiedPassiveId &&
          item.id !== "p28" &&
          !REMOVED_PASSIVE_IDS.has(item.id) &&
          !isSelfStackingSeal(item.id)
      )
    : null;
  return target || chooseMimicTarget(mimic);
}

function refreshMimicTarget() {
  const mimic = mimicEntry();
  if (!mimic) return null;
  return mimicTargetEntry();
}

function mimicContributionFor(id) {
  if (id === "p28") return 0;
  if (isSealSuppressed("p28") || isSealSuppressed(id)) return 0;
  const mimic = mimicEntry();
  const target = mimicTargetEntry();
  return target?.id === id ? mimic?.stack || 0 : 0;
}

function passiveStack(id) {
  if (REMOVED_PASSIVE_IDS.has(id)) return 0;
  if (isSealSuppressed(id)) return 0;
  return directPassiveStack(id) + mimicContributionFor(id);
}

function eliteLevels(idOrItem) {
  const stack = typeof idOrItem === "string" ? passiveStack(idOrItem) : idOrItem?.stack || 0;
  return Math.max(0, stack - 1);
}

function passivePower(idOrItem, eliteStep = 0.2) {
  const stack = typeof idOrItem === "string" ? passiveStack(idOrItem) : idOrItem?.stack || 0;
  if (!stack) return 0;
  return 1 + eliteLevels(idOrItem) * eliteStep;
}

function scaledPassiveValue(id, baseValue, eliteStep = 0.2) {
  const power = passivePower(id, eliteStep);
  return power ? Math.ceil(baseValue * power) : 0;
}

function scaledPassiveValueForItem(item, baseValue, eliteStep = 0.2) {
  const power = passivePower(item, eliteStep);
  return power ? Math.ceil(baseValue * power) : 0;
}

function flatDamagePower(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? Math.pow(1.5, Math.max(0, stack - 1)) : 0;
}

function flatDamageValue(idOrItem, baseValue) {
  const stack = simpleStackCount(idOrItem);
  if (!stack) return 0;
  let value = Math.max(0, Math.ceil(baseValue || 0));
  for (let level = 1; level < stack; level += 1) {
    value = Math.ceil(value * 1.5);
  }
  return value;
}

function passiveEntryFlatDamage(entry, baseValue) {
  return flatDamageValue(entry, baseValue);
}

function passiveEntryEliteLevels(entry) {
  return Math.max(0, (entry?.stack || 1) - 1);
}

function doubledStackPower(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? Math.pow(2, Math.max(0, stack - 1)) : 0;
}

function doubledStackValue(idOrItem, baseValue) {
  const power = doubledStackPower(idOrItem);
  return power ? Math.ceil((baseValue || 0) * power) : 0;
}

function rollScaledPassiveCount(id, baseCount = 1) {
  const power = passivePower(id);
  if (!power) return 0;
  const raw = baseCount * power;
  const guaranteed = Math.floor(raw);
  const chance = raw - guaranteed;
  return guaranteed + (Math.random() < chance ? 1 : 0);
}

function botSin(bot) {
  if (bot?.finalKey === "satan") return Number.POSITIVE_INFINITY;
  if (bot?.finalKey === "jesus") return Number.NEGATIVE_INFINITY;
  return Math.max(0, Math.ceil(bot?.reward || 0));
}

function scalingBonus(progress, earlyStep, lateStep, endlessStep = lateStep) {
  const count = Math.max(0, Math.ceil(progress || 0));
  const early = Math.min(count, SCALING_BREAKPOINT_BOSSES);
  const mid = Math.min(
    Math.max(0, count - SCALING_BREAKPOINT_BOSSES),
    ENDLESS_SCALING_BREAKPOINT_BOSSES - SCALING_BREAKPOINT_BOSSES
  );
  const endless = Math.max(0, count - ENDLESS_SCALING_BREAKPOINT_BOSSES);
  return early * earlyStep + mid * lateStep + endless * endlessStep;
}

function artifactScaleFactor() {
  return 1;
}

function artifactValue(baseValue) {
  const sign = Math.sign(baseValue || 0);
  const scaled = Math.floor(Math.abs(baseValue || 0) * artifactScaleFactor());
  return sign * scaled;
}

function artifactPercentValue(basePercent) {
  return clamp(artifactValue(basePercent), 0, 100);
}

function artifactPercent(basePercent) {
  return artifactPercentValue(basePercent) / 100;
}

function artifactCount(baseValue) {
  return Math.max(1, artifactValue(baseValue));
}

function artifactMultiplier(baseValue) {
  return Math.max(0, Math.floor((baseValue || 0) * artifactScaleFactor() * 10) / 10);
}

function formatArtifactMultiplier(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

function botBossBounty(bot) {
  if (!bot?.isBoss || bot?.immortal) return 0;
  const factor = Number.isFinite(bot.bossBountyFactor) ? bot.bossBountyFactor : 1;
  const bonus = Math.max(0, Math.ceil(bot.bossBountyBonus || 0));
  return Math.max(0, Math.ceil((20 + state.bossKills) * factor) + bonus);
}

function botRegularBounty(bot) {
  if (bot?.immortal) return 0;
  return Math.max(0, Math.ceil(bot?.reward || 0));
}

function botRegularBountyPayout(bot, markTriggers = false) {
  return botRegularBountyPayoutDetails(bot, markTriggers).payout;
}

function botRegularBountyPayoutDetails(bot, markTriggers = false) {
  if (!bot || bot.immortal) return { payout: 0, baseReward: 0, modifierEntries: [] };
  const baseReward = botRegularBounty(bot);
  let exactReward = baseReward;
  let roundedReward = baseReward;
  const modifierEntries = [];
  const applyMultiplier = (multiplier, source, triggerId) => {
    if (!Number.isFinite(multiplier) || multiplier <= 1 || roundedReward <= 0) return;
    const before = roundedReward;
    exactReward *= multiplier;
    roundedReward = Math.ceil(exactReward);
    const extra = Math.max(0, roundedReward - before);
    if (extra <= 0) return;
    modifierEntries.push({ amount: extra, source });
    if (triggerId && markTriggers) markPassiveTriggered(triggerId);
  };

  if (hasPassive("p36")) {
    applyMultiplier(1.5 * passivePower("p36"), ITEMS.p36?.name || "Seal of Asmoday", "p36");
  }
  applyMultiplier(bountyOathMultiplier(), ITEMS.p24?.name || "Seal of Orobas", passiveStack("p24") ? "p24" : "");
  if (botHasLowSin(bot, 3) && passiveStack("p45")) {
    applyMultiplier(2 * passivePower("p45"), ITEMS.p45?.name || "Seal of Crocell", "p45");
  }
  if (bot.revealedByPassive && passiveStack("p64")) {
    applyMultiplier(revealedBountyMultiplier("p64"), ITEMS.p64?.name || "Seal of Vine", "p64");
  }
  if ((bot.memory?.length || 0) >= 8 && passiveStack("p67")) {
    applyMultiplier(memoryBountyMultiplier("p67"), ITEMS.p67?.name || "Seal of Caim", "p67");
  }

  return { payout: roundedReward, baseReward, modifierEntries };
}

function botHasLowSin(bot, limit = 3) {
  if (bot?.immortal) return false;
  return botSin(bot) <= limit;
}

function andromaliusBountyLimit(idOrItem) {
  return 2 + eliteLevels(idOrItem);
}

function wealthWeightBonus() {
  return 0;
}

function passiveShopDiscount() {
  return 0;
}

function sinPricePressureMultiplier() {
  const credits = Number.isFinite(state.player.credits) ? Math.max(0, state.player.credits) : 0;
  if (credits <= SIN_PRICE_PRESSURE_INTERVAL) return 1;
  return 2 ** Math.ceil((credits - SIN_PRICE_PRESSURE_INTERVAL) / SIN_PRICE_PRESSURE_INTERVAL);
}

function memoryEntryForBot(bot) {
  const round = state.roundState;
  const fallbackGuess = bot?.plannedGuess ?? bot?.anchor ?? 50;
  const ownGuess = round?.botEffectiveGuesses?.get(bot.id) ?? fallbackGuess;
  const tableAverage = Number.isFinite(round?.tableAverage) ? round.tableAverage : ownGuess;
  return {
    ownGuess,
    playerGuess: round?.playerEffectiveGuess ?? ownGuess,
    target: round?.target ?? state.previousTarget ?? ownGuess,
    targetModifier: round?.targetModifier ?? currentTargetModifier(),
    targetOffset: round?.targetOffset ?? 0,
    tableAverage,
    botAverage: tableAverage
  };
}

function bathinMemoryDamage(entry) {
  return passiveEntryFlatDamage(entry, 3);
}

function applyBathinMemoryDamage(bot, entries) {
  if (!state.roundState || !bot || bot.eliminated || !entries?.length) return;
  entries.forEach((entry) => {
    if (bot.eliminated) return;
    const damage = bathinMemoryDamage(entry);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    queueEndOfRoundBotDamage(bot, damage, `Seal of Bathin dealt ${damage} damage to ${bot.name} for gaining MEMORY.`, "Seal of Bathin");
  });
}

function reduceBotMemoryRecord(bot, amount) {
  let remaining = Math.max(0, Math.ceil(amount));
  if (!bot || remaining <= 0) return;
  bot.lastMemoryDelta = Math.max(0, (bot.lastMemoryDelta || 0) - remaining);
  if (!Array.isArray(bot.memorySources)) return;
  for (let index = bot.memorySources.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const source = bot.memorySources[index];
    const sourceAmount = Math.max(0, Math.ceil(source?.amount || 0));
    const removed = Math.min(sourceAmount, remaining);
    source.amount = sourceAmount - removed;
    remaining -= removed;
  }
  bot.memorySources = bot.memorySources.filter((source) => Math.max(0, Math.ceil(source?.amount || 0)) > 0);
}

function applyMemoryToBountyMirror(bot, amount, options = {}) {
  const memoriesAdded = Math.max(0, Math.ceil(amount));
  if (options.triggerMemoryBountyMirror === false || !state.roundState || !bot || bot.eliminated || memoriesAdded <= 0) return;
  const entry = orderedPassiveEffectEntries("p10")[0];
  if (!entry) return;
  const baseConverted = Math.floor(memoriesAdded / 2);
  const converted = baseConverted > 0 ? Math.min(memoriesAdded, baseConverted + passiveEntryEliteLevels(entry)) : 0;
  if (converted <= 0) return;
  bot.memory.splice(Math.max(0, bot.memory.length - converted), converted);
  reduceBotMemoryRecord(bot, converted);
  markPassiveEntryTriggered(entry);
  changeBotSin(bot, converted, `Seal of Gusion converted ${converted} MEMORY from ${bot.name} into BOUNTY.`, {
    source: "Seal of Gusion",
    triggerMemoryBountyMirror: false
  });
}

function applyBountyToMemoryMirror(bot, amount, options = {}) {
  const bountyGained = Math.max(0, Math.ceil(amount));
  if (options.triggerMemoryBountyMirror === false || !state.roundState || !bot || bot.eliminated || bountyGained <= 0) return;
  const entry = orderedPassiveEffectEntries("p10")[0];
  if (!entry) return;
  const baseConverted = Math.floor(bountyGained / 2);
  const converted = baseConverted > 0 ? Math.min(bountyGained, baseConverted + passiveEntryEliteLevels(entry)) : 0;
  if (converted <= 0) return;
  markPassiveEntryTriggered(entry);
  const result = changeBotSin(bot, -converted, "", {
    source: "Seal of Gusion",
    triggerMemoryBountyMirror: false,
    triggerLossDamage: false
  });
  if (result.lost <= 0) return;
  const added = addBotMemory(bot, result.lost, "", {
    source: "Seal of Gusion",
    triggerMemoryBountyMirror: false
  });
  addRoundEvent(`Seal of Gusion converted ${result.lost} BOUNTY from ${bot.name} into ${added} MEMORY.`);
}

function memoryRoundLimit() {
  return Math.max(0, Math.ceil(state.round || 0));
}

function botMemoryLimit(bot) {
  const roundLimit = memoryRoundLimit();
  if (bot?.isBoss) return roundLimit;
  return Math.min(NON_BOSS_MEMORY_LIMIT, roundLimit);
}

function trimBotMemoryToLimit(bot) {
  if (!bot?.memory) return 0;
  const limit = botMemoryLimit(bot);
  const before = bot.memory.length;
  bot.memory = limit > 0 ? bot.memory.slice(-limit) : [];
  return Math.max(0, before - bot.memory.length);
}

function sitriExcessMemoryDamage(entry) {
  return doubledStackValue(entry, 10);
}

function applyExcessMemoryDamage(bot, excessMemory) {
  const excess = Math.max(0, Math.ceil(excessMemory));
  if (!state.roundState || !bot || bot.eliminated || excess <= 0) return;
  orderedPassiveEffectEntries("p55").forEach((entry) => {
    if (bot.eliminated) return;
    const damage = excess * sitriExcessMemoryDamage(entry);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    queueEndOfRoundBotDamage(
      bot,
      damage,
      `Seal of Sitri converted ${excess} excess MEMORY into ${damage} damage to ${bot.name}.`,
      "Seal of Sitri"
    );
  });
}

function addBotMemory(bot, count, reason = "", options = {}) {
  if (!bot || bot.eliminated || count <= 0) return 0;
  const baseRequested = Math.ceil(count);
  const bathinEntries = options.triggerBathinMemory !== false ? orderedPassiveEffectEntries("p15") : [];
  const bonusRequested = bathinEntries.length;
  const requested = baseRequested + bonusRequested;
  trimBotMemoryToLimit(bot);
  const beforeMemory = bot.memory?.length || 0;
  const allowed = Math.max(0, botMemoryLimit(bot) - beforeMemory);
  const added = Math.min(requested, allowed);
  const excess = Math.max(0, requested - added);
  const entry = options.entry || memoryEntryForBot(bot);
  for (let index = 0; index < added; index += 1) {
    bot.memory.push({ ...entry });
  }
  const actualIncrease = Math.max(0, (bot.memory?.length || 0) - beforeMemory);
  const baseIncrease = Math.min(baseRequested, actualIncrease);
  const bathinIncrease = Math.max(0, actualIncrease - baseIncrease);
  recordBotMemorySource(bot, baseIncrease, options.source || sourceLabelFromReason(reason, "Memory"));
  recordBotMemorySource(bot, bathinIncrease, ITEMS.p15?.name || "Seal of Bathin");
  applyMemoryToBountyMirror(bot, actualIncrease, options);
  applyExcessMemoryDamage(bot, excess);
  applyBathinMemoryDamage(bot, bathinEntries);
  if (reason) state.roundState?.roundEvents.push(reason);
  applySelfStackingMemoryOverTen(bot, beforeMemory, bot.memory?.length || 0);
  checkBalamMemoryBountyEliminations();
  return actualIncrease;
}

function initialMemoryEntries(count) {
  const targetModifier = state.roundState?.targetModifier ?? currentTargetModifier();
  const targetOffset = state.roundState?.targetOffset ?? 0;
  const target = state.previousTarget ?? Math.ceil(50 * targetModifier + targetOffset);
  const tableAverage = targetModifier ? (target - targetOffset) / targetModifier : 50;
  return Array.from({ length: count }, () => ({
    ownGuess: 50,
    playerGuess: 50,
    target,
    targetModifier,
    targetOffset,
    tableAverage,
    botAverage: tableAverage
  }));
}

function seedNewBotMemoryFromVassago(bot) {
  if (!bot || bot.isBoss) return;
  if (bot.memory?.length) return;
  const entries = orderedPassiveEffectEntries("p1");
  if (!entries.length) return;
  const seedCount = Math.min(5, botMemoryLimit(bot));
  bot.memory = initialMemoryEntries(seedCount);
  recordBotMemorySource(bot, bot.memory.length, ITEMS.p1?.name || "Seal of Vassago");
  entries.forEach((entry) => markPassiveEntryTriggered(entry));
}

function applyBotSinLossDamage(bot, lost, extraDamagePerSin = 0, extraSource = "") {
  const amount = Math.max(0, Math.ceil(lost));
  if (!bot || bot.eliminated || amount <= 0) return;

  if (extraDamagePerSin > 0) {
    const damage = Math.ceil(amount * extraDamagePerSin);
    if (damage > 0) queueEndOfRoundBotDamage(bot, damage, `${extraSource} dealt ${damage} damage to ${bot.name}.`, extraSource || "SIN loss");
  }

  orderedPassiveEffectEntries("p43").forEach((entry) => {
    const damage = passiveEntryFlatDamage(entry, 20);
    if (damage <= 0 || bot.eliminated) return;
    markPassiveEntryTriggered(entry);
    queueEndOfRoundBotDamage(bot, damage, `Seal of Raum dealt ${damage} damage to ${bot.name} for losing SIN.`, "Seal of Raum");
  });
}

function agaresDamagePerSin(entry) {
  return flatDamageValue(entry, 5);
}

function applyBotSinGainDamage(bot, gained) {
  const amount = Math.max(0, Math.ceil(gained));
  if (!state.roundState || !bot || bot.eliminated || amount <= 0) return;
  orderedPassiveEffectEntries("p50").forEach((entry) => {
    if (bot.eliminated) return;
    const damage = amount * agaresDamagePerSin(entry);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    queueEndOfRoundBotDamage(bot, damage, `Seal of Agares dealt ${damage} damage to ${bot.name} for gaining ${amount} SIN.`, "Seal of Agares");
  });
}

function stubbornArtifactChance(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  if (!stack) return 0;
  return Math.min(1, 0.5 + Math.max(0, stack - 1) * 0.1);
}

function balamCollapseTargets(sourceBot) {
  const bosses = activeBots().filter((bot) => bot.id !== sourceBot?.id && bot.isBoss);
  if (bosses.length) return bosses;
  return activeBots().filter((bot) => bot.id !== sourceBot?.id);
}

function checkBalamMemoryBountyEliminations() {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p57");
  if (!round || round.balamResolving || !entries.length) return;
  round.balamResolving = true;
  try {
    let target = activeBots().find((bot) => !bot.isBoss && !bot.immortal && (bot.memory?.length || 0) >= 10 && botRegularBounty(bot) >= 10);
    while (target) {
      entries.forEach((entry) => markPassiveEntryTriggered(entry));
      const damagePool = passiveEntryFlatDamage(entries[0], target.maxHp || 0);
      target.hp = 0;
      target.deathCause = "memory-bounty";
      target.deathNotice = "BALAM";
      round.roundEvents.push(`Seal of Balam eliminated ${target.name} for reaching 10 memory and 10 bounty.`);

      const damageTargets = balamCollapseTargets(target);
      if (damagePool > 0 && damageTargets.length) {
        const allocations = randomDamageSpread(damagePool, damageTargets);
        damageBots(
          damageTargets,
          (bot) => allocations.get(bot.id) || 0,
          (bot, damage) => `Seal of Balam dealt ${damage} collapse damage to ${bot.name}.`,
          "Seal of Balam"
        );
      }

      resolveEliminatedBots([target]);
      target = activeBots().find((bot) => !bot.isBoss && !bot.immortal && (bot.memory?.length || 0) >= 10 && botRegularBounty(bot) >= 10);
    }
  } finally {
    round.balamResolving = false;
  }
}

function changeBotSin(bot, delta, reason = "", options = {}) {
  if (!bot || bot.eliminated) return { changed: 0, lost: 0, gained: 0 };
  if (bot.immortal || !Number.isFinite(botSin(bot))) return { changed: 0, lost: 0, gained: 0 };
  const before = botSin(bot);
  const next = Math.max(0, Math.ceil(before + delta));
  bot.reward = next;
  const changed = next - before;
  if (!changed) return { changed: 0, lost: 0, gained: 0 };
  const lost = Math.max(0, -changed);
  const gained = Math.max(0, changed);
  const fallbackSource = changed > 0 ? "SIN gain" : "SIN loss";
  const source = options.source || sourceLabelFromReason(reason, fallbackSource);
  bot.lastSinDelta = (bot.lastSinDelta || 0) + changed;
  recordBotSinSource(bot, changed, source);
  if (reason) state.roundState?.roundEvents.push(reason);
  if (lost > 0 && options.triggerLossDamage !== false) {
    applyBotSinLossDamage(bot, lost, options.extraDamagePerSin || 0, options.extraDamageSource || "");
  }
  if (gained > 0) {
    applyBountyToMemoryMirror(bot, gained, options);
  }
  if (gained > 0 && options.triggerGainDamage !== false) {
    applyBotSinGainDamage(bot, gained);
  }
  checkBalamMemoryBountyEliminations();
  return { changed, lost, gained };
}

function setBotSin(bot, value, reason = "", options = {}) {
  return changeBotSin(bot, Math.ceil(value) - botSin(bot), reason, options);
}

function increaseAllBotSin(amount, reasonFactory) {
  const increase = Math.max(0, Math.ceil(amount));
  if (increase <= 0) return 0;
  let total = 0;
  activeBots().forEach((bot) => {
    const result = changeBotSin(bot, increase, typeof reasonFactory === "function" ? reasonFactory(bot, increase) : "", {
      triggerLossDamage: false
    });
    total += result.gained;
  });
  return total;
}

function applyTargetedItemSinGain(item, targets) {
  const uniqueTargets = Array.from(new Set((targets || []).filter((bot) => bot && !bot.eliminated)));
  if (!item || !uniqueTargets.length) return;
  if (state.roundState?.artifactTargetCountsByBotId) {
    uniqueTargets.forEach((bot) => {
      const previous = state.roundState.artifactTargetCountsByBotId.get(bot.id) || 0;
      state.roundState.artifactTargetCountsByBotId.set(bot.id, previous + 1);
    });
  }
  orderedPassiveEffectEntries("p82").forEach((entry) => {
    const chance = Math.min(1, 0.5 + Math.max(0, (entry.stack || 1) - 1) * 0.1);
    let revealed = 0;
    uniqueTargets.forEach((bot) => {
      if (Math.random() < chance && revealBotGuess(bot, "Seal of Marked Offering", entry)) revealed += 1;
    });
    if (revealed > 0) state.roundState?.roundEvents.push(`Seal of Marked Offering revealed ${revealed} targeted DAMNED.`);
  });
  orderedPassiveEffectEntries("p105").forEach((entry) => {
    const chance = stubbornArtifactChance(entry);
    let changed = 0;
    uniqueTargets.forEach((bot) => {
      if (Math.random() < chance && setBotPersonality(bot, "Stubborn", passiveName("p105", "Seal of Andras"), { markEntry: entry })) {
        changed += 1;
      }
    });
    if (changed > 0) state.roundState?.roundEvents.push(`${passiveName("p105", "Seal of Andras")} made ${changed} ARTIFACT target${changed === 1 ? "" : "s"} STUBBORN.`);
  });
  const entries = orderedPassiveEffectEntries("p49");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const amount = passiveEntryScaledValue(entry, 4);
    if (amount <= 0) return;
    markPassiveEntryTriggered(entry);
    uniqueTargets.forEach((bot) => {
      changeBotSin(bot, amount, `Seal of Phenex gave ${bot.name} +${amount} SIN because ${item.name} targeted them.`, {
        triggerLossDamage: false
      });
    });
  });
}

function critWindowDetails(idOrItem) {
  return {
    guaranteed: criticalCalipersWindow(idOrItem),
    chance: 0,
    text: `+/-${criticalCalipersWindow(idOrItem)}`
  };
}

function ascendingCritWindowBonus() {
  return passiveStack("p91") ? Math.min(4, Math.max(0, Math.ceil(state.critMomentumBonus || 0))) : 0;
}

function ascendingCritDamageBonus() {
  return passiveStack("p91") ? eliteLevels("p91") * 5 : 0;
}

function passiveDisplayName(item) {
  if (isSelfStackingSeal(item)) return item.name;
  const stack = item.stack || 1;
  if (stack <= 1) return item.name;
  return stack === 2 ? `ELITE ${item.name}` : `ELITE +${stack - 1} ${item.name}`;
}

function simpleStackCount(idOrItem) {
  return typeof idOrItem === "string" ? passiveStack(idOrItem) : idOrItem?.stack || 0;
}

function divisibleVerdictDamage(idOrItem) {
  return flatDamageValue(idOrItem, 20);
}

function edgeGambitMultiplier(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? 2 * Math.pow(1.5, stack - 1) : 1;
}

function edgeGambitDamage(idOrItem) {
  return flatDamageValue(idOrItem, 10);
}

function spiteCircuitDamage(playerDamage) {
  return flatDamageValue("p5", playerDamage);
}

function criticalCalipersWindow(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? stack + 1 : 0;
}

function eligosBotCriticalWindow(idOrItem = "p69") {
  const stack = simpleStackCount(idOrItem);
  return stack ? stack : 0;
}

function pressureSpikeDamage(idOrItem) {
  return flatDamageValue(idOrItem, 20);
}

function gaapDamage(idOrItem) {
  return flatDamageValue(idOrItem, 5);
}

function poisonPercentPerCounter(idOrItem) {
  return Math.max(0, 5 + eliteLevels(idOrItem) * 2);
}

function paimonBaseSin(round = state.roundState) {
  if (!round) return 0;
  const distance = Math.ceil(Math.abs((round.playerEffectiveGuess ?? 0) - (round.target ?? 0)));
  if (!Number.isFinite(distance) || distance > 5) return 0;
  if (distance === 0) return 10;
  return Math.max(0, 6 - distance);
}

function paimonSinReward(idOrItem, round = state.roundState) {
  const baseSin = paimonBaseSin(round);
  return baseSin ? doubledStackValue(idOrItem, baseSin) : 0;
}

function bifronsSinReward(entry) {
  const currentSin = Math.max(0, Math.ceil(state.player.credits || 0));
  return passiveEntryScaledValue(entry, currentSin);
}

function playerTargetDistance(round = state.roundState) {
  if (!round) return Number.POSITIVE_INFINITY;
  const guess = round.playerEffectiveGuess;
  const target = round.target;
  if (!Number.isFinite(guess) || !Number.isFinite(target)) return Number.POSITIVE_INFINITY;
  return Math.ceil(Math.abs(guess - target));
}

function shaxRerollDamage(entry, spent) {
  return passiveEntryFlatDamage(entry, Math.max(0, Math.ceil(spent || 0)) * 2);
}

function sallosShiftValues(entry) {
  const max = 5 + Math.max(0, (entry?.stack || 1) - 1);
  return Array.from({ length: Math.max(1, max - 1) }, (_, index) => index + 2);
}

function barbatosDamage(idOrItem) {
  return flatDamageValue(idOrItem, 5);
}

function fullHealthExtraDamage(idOrItem) {
  return flatDamageValue(idOrItem, 10);
}

function revealedExtraDamage(idOrItem) {
  return flatDamageValue(idOrItem, 15);
}

function aimBossDamage(idOrItem) {
  return flatDamageValue(idOrItem, 30);
}

function vapulaMemoryExtraDamage(idOrItem, memoryCount) {
  if (memoryCount > 12) return flatDamageValue(idOrItem, 15);
  if (memoryCount >= 8) return flatDamageValue(idOrItem, 10);
  return 0;
}

function decarabiaMemoryExtraDamage(idOrItem, bot) {
  const memory = bot?.memory?.length || 0;
  if (!memory) return 0;
  const perMemory = bot?.isBoss ? 1 : 3;
  return flatDamageValue(idOrItem, memory * perMemory);
}

function furcasSelectedDamage(idOrItem) {
  return eliteLevels(idOrItem) * 5;
}

function specialSealBaseMultiplier(idOrItem, baseMultiplier) {
  const stack = simpleStackCount(idOrItem);
  if (!stack) return 1;
  return baseMultiplier + eliteLevels(idOrItem) * 0.2;
}

function revealedBountyMultiplier(idOrItem) {
  return 2 * passivePower(idOrItem);
}

function fullHealthDamageMultiplier(idOrItem) {
  return 1.5 * passivePower(idOrItem);
}

function fifthRoundDamageMultiplier(idOrItem) {
  return 2 * passivePower(idOrItem);
}

function memoryDamageMultiplier(idOrItem, memoryCount) {
  if (memoryCount > 12) return 2 * passivePower(idOrItem);
  if (memoryCount >= 8) return 1.5 * passivePower(idOrItem);
  return 1;
}

function memoryBountyMultiplier(idOrItem) {
  return 2 * passivePower(idOrItem);
}

function sacrificialDaggerBossPercent(idOrItem = "p70") {
  return 10;
}

function sacrificialDaggerPercentForBot(bot) {
  return bot?.isBoss ? sacrificialDaggerBossPercent() : 20;
}

function sacrificialDaggerExtraDamage(idOrItem = "p70") {
  return flatDamageValue(idOrItem, 10);
}

function halphasRoundBossDamage() {
  return Math.max(0, Math.ceil((state.round || 0) * (state.bossKills || 0)));
}

function halphasEliteCredits(entry) {
  return Math.max(0, ((entry?.stack || 1) - 1) * 2);
}

function satanSealMaxDivisor(entry) {
  return Math.max(1, Math.floor(100 * Math.pow(0.8, passiveEntryEliteLevels(entry))));
}

function satanSealDamageRoll(entry) {
  const maxDivisor = satanSealMaxDivisor(entry);
  const divisor = randomInt(1, maxDivisor);
  return {
    divisor,
    maxDivisor,
    damage: Math.ceil(666 / divisor)
  };
}

function randomDamageSpread(totalDamage, targets, broadSpread = false) {
  const total = Math.max(0, Math.ceil(totalDamage));
  const liveTargets = targets.filter((bot) => bot && !bot.eliminated && bot.hp > 0);
  const allocations = new Map();
  if (total <= 0 || !liveTargets.length) return allocations;
  if (broadSpread && liveTargets.length > 1) {
    const seededTargets = shuffled(liveTargets).slice(0, Math.min(total, liveTargets.length));
    seededTargets.forEach((bot) => allocations.set(bot.id, 1));
    const extraAllocations = randomDamageSpread(total - seededTargets.length, liveTargets);
    extraAllocations.forEach((amount, botId) => {
      allocations.set(botId, (allocations.get(botId) || 0) + amount);
    });
    return allocations;
  }
  const weightedTargets = liveTargets.map((bot) => ({ bot, weight: Math.max(0.01, Math.random()) }));
  const weightTotal = weightedTargets.reduce((sum, entry) => sum + entry.weight, 0);
  let assigned = 0;
  weightedTargets.forEach((entry) => {
    const amount = Math.floor((total * entry.weight) / weightTotal);
    if (amount > 0) allocations.set(entry.bot.id, amount);
    assigned += amount;
  });
  let remainder = total - assigned;
  shuffled(weightedTargets).forEach((entry) => {
    if (remainder <= 0) return;
    allocations.set(entry.bot.id, (allocations.get(entry.bot.id) || 0) + 1);
    remainder -= 1;
  });
  return allocations;
}

function slowRepairSin(idOrItem) {
  return passiveConvertedSin(idOrItem, 5);
}

function victoryPatchSin(idOrItem) {
  return passiveConvertedSin(idOrItem, 3);
}

function sweepDividendHealingSin(idOrItem) {
  return passiveConvertedSin(idOrItem, 5);
}

function sweepDividendCredits(idOrItem) {
  return scaledPassiveValue(idOrItem, 5);
}

function furfurDamage(idOrItem) {
  return flatDamageValue(idOrItem, 1);
}

function andrealphusDamage(idOrItem) {
  return flatDamageValue(idOrItem, 10);
}

function baseEditionBonus(idOrItem) {
  return simpleStackCount(idOrItem) * 2;
}

function twinDetonatorDamage(idOrItem) {
  return flatDamageValue(idOrItem, 30);
}

function reactiveWarrantySin(idOrItem) {
  return passiveConvertedSin(idOrItem, 3);
}

function reactiveWarrantyDamage(idOrItem) {
  return flatDamageValue(idOrItem, 10);
}

function lowProfileRewardSin(idOrItem) {
  const baseSin = typeof idOrItem === "string" ? scaledPassiveValue(idOrItem, 4) : scaledPassiveValueForItem(idOrItem, 4);
  return baseSin + passiveConvertedSin(idOrItem, 3);
}

function passiveConvertedSin(idOrItem, baseHeal) {
  return simpleStackCount(idOrItem) ? Math.ceil(baseHeal * passivePower(idOrItem)) : 0;
}

function orderedPassiveEntries() {
  const passives = state.player.passives || [];
  return passives
    .map((item, index) => {
      if (!item) return null;
      if (REMOVED_PASSIVE_IDS.has(item.id)) return null;
      if (isSealSuppressed(item.id)) return null;
      if (item.id === "p28") {
        const target = mimicTargetEntry();
        if (!target || isSealSuppressed(target.id)) return null;
        return {
          id: target.id,
          item,
          stack: item.stack || 1,
          sourceId: "p28",
          copied: true,
          copiedName: target.name,
          index
        };
      }
      return {
        id: item.id,
        item,
        stack: item.stack || 1,
        sourceId: item.id,
        copied: false,
        index
      };
    })
    .filter(Boolean);
}

function orderedPassiveEffectEntries(ids) {
  const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
  return orderedPassiveEntries().filter((entry) => idSet.has(entry.id) && !isSealSuppressed(entry.id));
}

function passiveEntryPower(entry, eliteStep = 0.2) {
  const stack = entry?.stack || 0;
  return stack ? 1 + Math.max(0, stack - 1) * eliteStep : 0;
}

function passiveEntryScaledValue(entry, baseValue, eliteStep = 0.2) {
  const power = passiveEntryPower(entry, eliteStep);
  return power ? Math.ceil(baseValue * power) : 0;
}

function passiveEntryConvertedSin(entry, baseHeal) {
  return entry?.stack ? Math.ceil(baseHeal * passiveEntryPower(entry)) : 0;
}

function stackLinearMultiplier(entry) {
  return Math.max(1, entry?.stack || 1);
}

function markPassiveEntryTriggered(entry) {
  if (!state.roundState || !entry) return;
  const triggerId = entry.sourceId || entry.id;
  state.roundState.triggeredPassiveIds.add(triggerId);
  recordSealTrigger(triggerId);
}

function nonBossDamageMultiplier(bot, playerDealt = true) {
  return 1;
}

function scaledBotDamage(bot, amount, playerDealt = true) {
  return scaledBotDamageDetails(bot, amount, playerDealt).damage;
}

function scaledBotDamageDetails(bot, amount, playerDealt = true) {
  const damage = Math.max(0, Math.ceil(amount));
  if (!damage) return { damage: 0, baseDamage: 0, modifierEntries: [], redirectEntries: [] };
  let exactDamage = damage;
  let roundedDamage = damage;
  const modifierEntries = [];
  const redirectEntries = [];
  const applyFlatBonus = (bonus, source, entry) => {
    const extra = Math.max(0, Math.ceil(bonus || 0));
    if (extra <= 0 || roundedDamage <= 0) return false;
    exactDamage += extra;
    roundedDamage += extra;
    modifierEntries.push({ amount: extra, source, kind: "flat-bonus" });
    markPassiveEntryTriggered(entry);
    return true;
  };
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
  const applyRedirectMultiplier = (multiplier, source, entry, targetBot, redirectFullDamage = false) => {
    if (!Number.isFinite(multiplier) || multiplier <= 1 || roundedDamage <= 0 || !targetBot) return;
    const boostedDamage = Math.ceil(exactDamage * multiplier);
    const redirectedDamage = redirectFullDamage ? boostedDamage : Math.max(0, boostedDamage - roundedDamage);
    if (redirectedDamage <= 0) return;
    redirectEntries.push({ targetBotId: targetBot.id, amount: redirectedDamage, source, kind: "bonus" });
    markPassiveEntryTriggered(entry);
  };

  if (bot) {
    orderedPassiveEffectEntries(["p46", "p62", "p63", "p68", "p52"]).forEach((entry) => {
      if (entry.id === "p46" && botSin(bot) >= 6) {
        applyFlatBonus(barbatosDamage(entry), ITEMS.p46?.name || "Seal of Barbatos", entry);
        return;
      }

      if (entry.id === "p62" && bot.hp >= bot.maxHp && !state.roundState?.belethTriggeredBotIds?.has(bot.id)) {
        applyFlatBonus(fullHealthExtraDamage(entry), ITEMS.p62?.name || "Seal of Beleth", entry);
        state.roundState?.belethTriggeredBotIds?.add(bot.id);
        return;
      }

      if (entry.id === "p63" && bot.revealedByPassive) {
        applyFlatBonus(revealedExtraDamage(entry), ITEMS.p63?.name || "Seal of Vual", entry);
        return;
      }

      if (entry.id === "p68") {
        if (state.roundState?.vapulaTriggeredBotIds?.has(bot.id)) return;
        if (applyFlatBonus(vapulaMemoryExtraDamage(entry, bot.memory?.length || 0), ITEMS.p68?.name || "Seal of Vapula", entry)) {
          state.roundState?.vapulaTriggeredBotIds?.add(bot.id);
        }
        return;
      }

      if (entry.id === "p52") {
        applyFlatBonus(decarabiaMemoryExtraDamage(entry, bot), ITEMS.p52?.name || "Seal of Decarabia", entry);
      }
    });

    if (state.roundState?.padmaVulnerableBotIds?.has(bot.id)) {
      applyMultiplier(1.25, ITEMS.p96?.name || "Seal of Padma", null);
    }

    orderedPassiveEffectEntries(["p74", "p75", "p76", "p77", "p78", "p79"]).forEach((entry) => {
      if (entry.id === "p74") {
        if (botSin(bot) >= 10) applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p74?.name, entry);
        return;
      }

      if (entry.id === "p75") {
        if (bot.revealedByPassive) applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p75?.name, entry);
        return;
      }

      if (entry.id === "p76") {
        if (bot.isBoss || (bot.memory?.length || 0) < 10) return;
        const redirectBoss = blackHorseRedirectBoss(bot);
        if (redirectBoss) {
          applyRedirectMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p76?.name, entry, redirectBoss, true);
        } else {
          applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p76?.name, entry);
        }
        return;
      }

      if (entry.id === "p77" && state.roundState?.paleHorseDamageBoostActive) {
        applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p77?.name, entry);
        return;
      }

      if (entry.id === "p78") {
        if (personalityType(bot) === "Stubborn") {
          applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p78?.name, entry);
        }
        return;
      }

      if (entry.id === "p79" && (state.roundState?.artifactTargetCountsByBotId?.get(bot.id) || 0) > 0) {
        applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p79?.name, entry);
      }
    });
  }

  return {
    damage: roundedDamage,
    baseDamage: damage,
    modifierEntries,
    redirectEntries
  };
}

function blackHorseRedirectBoss(sourceBot) {
  return (
    activeBots()
      .filter((bot) => bot.isBoss && bot.id !== sourceBot?.id)
      .sort((left, right) => left.id - right.id)[0] || null
  );
}

function applyPendingRedirectDamage(entries, botDamages, botDamageSources) {
  (entries || []).forEach((entry) => {
    const target = state.bots.find((bot) => bot.id === entry.targetBotId);
    if (!target || target.eliminated) return;
    addPendingBotDamage(botDamages, botDamageSources, target, entry.amount, entry.source || "Redirected damage");
  });
}

function applyDirectRedirectDamage(entries) {
  (entries || []).forEach((entry) => {
    const target = state.bots.find((bot) => bot.id === entry.targetBotId);
    const damage = Math.max(0, Math.ceil(entry.amount || 0));
    if (!target || target.eliminated || damage <= 0) return;
    const source = entry.source || "Redirected damage";
    damageBot(target, damage, `${source} redirected ${damage} damage to ${target.name}.`, source);
  });
}

function scaledBotDamageSourceEntries(details, source) {
  const entries = [];
  const baseDamage = Math.max(0, Math.ceil(details?.baseDamage || 0));
  if (baseDamage > 0) entries.push({ amount: baseDamage, source });
  (details?.modifierEntries || []).forEach((entry) => {
    const amount = Math.max(0, Math.ceil(entry.amount || 0));
    if (amount > 0) entries.push({ amount, source: entry.source || "Damage modifier", kind: entry.kind || "bonus" });
  });
  return entries;
}

function recordScaledBotDamageSources(bot, details, source) {
  scaledBotDamageSourceEntries(details, source).forEach((entry) => recordBotDamageSource(bot, entry.amount, entry.source, entry.kind));
}

function highestHealthNonBossBot() {
  return activeBots()
    .filter((bot) => !bot.isBoss)
    .sort((left, right) => right.hp - left.hp || right.maxHp - left.maxHp || left.id - right.id)[0];
}

function highestHealthEnemy() {
  return activeBots().sort((left, right) => right.hp - left.hp || right.maxHp - left.maxHp || left.id - right.id)[0];
}

function applyPassivePlayerHeal(id, baseHeal, reason) {
  const credits = passiveConvertedSin(id, baseHeal);
  if (!credits || state.player.hp <= 0) return { healed: 0, credits: 0 };
  const gained = gainCredits(credits, true, reason);
  addRoundEvent(`${reason} paid ${gained} SIN.`);
  return { healed: 0, credits: gained };
}

function applyPassivePlayerHealForEntry(entry, baseHeal, reason) {
  const credits = passiveEntryConvertedSin(entry, baseHeal);
  if (!credits || state.player.hp <= 0) return { healed: 0, credits: 0 };
  const gained = gainCredits(credits, true, reason);
  addRoundEvent(`${reason} paid ${gained} SIN.`);
  return { healed: 0, credits: gained };
}

