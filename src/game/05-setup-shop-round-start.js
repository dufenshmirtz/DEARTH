function randomBotProfile() {
  const profile = randomFrom(BOT_PROFILES);
  return {
    flag: profile.flag,
    country: profile.country,
    name: `${randomFrom(profile.names)}-${randomInt(10, 99)}`
  };
}

function randomBotImage() {
  return `assets/bots/occult-stickmen-pack/${randomFrom(BOT_IMAGE_FILES)}`;
}

function botImagePath(entity) {
  return entity?.image || `assets/bots/occult-stickmen-pack/${BOT_IMAGE_FILES[0]}`;
}

function botSinDisplay(bot) {
  if (bot?.finalKey === "satan") return "∞ SIN";
  if (bot?.finalKey === "jesus") return "-∞ SIN";
  if (bot?.isBoss) return `${botBossBounty(bot)}+${botRegularBounty(bot)} SIN`;
  return `${botRegularBounty(bot)} SIN`;
}

function stealPlayerSinToBoss(bot, amount, source) {
  if (!bot || bot.eliminated || bot.immortal) return 0;
  const available = Math.max(0, Math.ceil(state.player.credits || 0));
  const stolen = Math.min(available, Math.max(0, Math.ceil(amount)));
  if (stolen <= 0) return 0;
  state.player.credits = Math.max(0, state.player.credits - stolen);
  bot.bossBountyBonus = (bot.bossBountyBonus || 0) + stolen;
  return stolen;
}

function uniquePowerSourceName(bot, key) {
  const spec = UNIQUE_BOSS_SPECS[key];
  if (!bot || bot.uniqueKey === key) return `${spec?.name || key}'s Seal`;
  return `${bot.name}'s borrowed ${spec?.name || key} Seal`;
}

function applySerafimEntrySteal(bot) {
  const stolen = stealPlayerSinToBoss(
    bot,
    Math.ceil(Math.max(0, state.player.credits || 0) / 2),
    uniquePowerSourceName(bot, "serafim")
  );
  if (stolen <= 0) return;
  const hpGain = stolen * 2;
  bot.maxHp += hpGain;
  bot.hp += hpGain;
  addLog(`${bot.name} stole ${stolen} SIN and gained ${hpGain} health.`);
}

function applySerafimRoundSteal() {
  const bosses = activeBossesWithPower("serafim");
  if (!bosses.length) return;
  bosses.forEach((bot) => {
    const stolen = stealPlayerSinToBoss(bot, 2, uniquePowerSourceName(bot, "serafim"));
    if (stolen > 0) state.roundState.roundEvents.push(`${bot.name} stole ${stolen} SIN.`);
  });
}

function padmaHealingBlocker(sourceLabel = "") {
  if (String(sourceLabel || "").toLowerCase().includes("boss kill")) return null;
  return activeBossesWithPower("padma")[0] || null;
}

function applyPadmaStartHealing() {
  const padmas = activeBossesWithPower("padma");
  if (!padmas.length) return;
  padmas.forEach((padma) => {
    const source = uniquePowerSourceName(padma, "padma");
    healBot(padma, Math.ceil(padma.maxHp * 0.05), source, source);
    activeBots()
      .filter((bot) => bot.id !== padma.id && !bot.isBoss)
      .forEach((bot) => healBot(bot, Math.ceil(bot.maxHp * 0.1), source, source));
  });
}

function applyKalhaSealSuppression() {
  const kalhas = activeBossesWithPower("kalha");
  const choices = state.player.passives.filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id) && !suppressingBossForSeal(item.id));
  if (!kalhas.length || !choices.length || !state.roundState) return;
  const boss = randomFrom(kalhas);
  const count = Math.floor(choices.length / 2);
  if (count <= 0) return;
  const seals = shuffled(choices).slice(0, count);
  state.roundState.kalhaSuppressedPassiveIds = new Set(seals.map((seal) => seal.id));
  state.roundState.kalhaSuppressedById = boss.id;
  state.roundState.roundEvents.push(
    `${boss.name} deactivated ${seals.map((seal) => passiveDisplayName(seal)).join(", ")} for this round.`
  );
}

function createFinalBoss(key) {
  const spec = FINAL_BOSS_SPECS[key];
  const archetype = archetypeByType(spec.personality);
  return {
    id: state.nextBotId++,
    name: spec.name,
    flag: "🏴",
    country: "Final Judgment",
    type: "Final Boss",
    color: spec.color,
    image: spec.image,
    anchor: archetype.anchor,
    aggression: Math.min(0.82, archetype.aggression + 0.18),
    noise: Math.max(6, archetype.noise - 1),
    hp: 100,
    maxHp: 100,
    reward: key === "satan" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
    isBoss: true,
    bossOrder: state.bossSpawnCount + 1,
    uniqueKey: null,
    goeticKey: null,
    goeticPassiveId: null,
    goeticSealName: null,
    finalKey: key,
    immortal: true,
    damageTakenTotal: 0,
    modifierOverride: null,
    shopTax: 0,
    eliminationDamage: 0,
    grantsBuffs: false,
    passiveKeys: [],
    buffPassiveKey: null,
    uniqueDescriptions: spec.descriptions,
    memory: state.gameMemory.slice(),
    markedByPlayer: false,
    plannedGuess: null,
    lastDamage: 0,
    lastHeal: 0,
    lastSinDelta: 0,
    lastMemoryDelta: 0,
    damageSources: [],
    healSources: [],
    sinSources: [],
    memorySources: [],
    poisonCounters: 0,
    deathCause: null,
    deathNotice: null,
    eliminated: false,
    skipEliminationReward: false,
    pendingReplacementSpec: null,
    pendingReplacementInheritance: null,
    revealedByPassive: false,
    fresh: false
  };
}

function activeGoeticBoss() {
  return state.bots.some((bot) => bot.goeticKey && bot.hp > 0 && !bot.eliminated);
}

function enterFinalBossPhase() {
  state.finalBossQueued = false;
  state.finalBossPhase = true;
  state.bossQueued = false;
  state.killsSinceBossSpawn = 0;
  state.uniqueBossQueue = [];
  state.goeticBossQueue = [];
  state.pendingActive = null;
  state.mobileOfferingsOpen = false;
  state.bots = [createFinalBoss("jesus"), createFinalBoss("satan")];
  state.shop = [];
  addLog("Jesus and Satan enter. Devil's Offerings are sealed.");
}

function skipToFirstGoeticBoss() {
  state.pauseOpen = false;
  state.pendingActive = null;
  state.uniqueBossQueue = [];
  state.goeticBossQueue = shuffled(GOETIC_BOSS_KEYS);
  state.goeticBossKills = 0;
  state.killsSinceBossSpawn = 0;
  state.finalBossPhase = false;
  state.finalBossQueued = false;
  state.bossQueued = false;
  state.bossKills = Math.max(state.bossKills, UNIQUE_BOSS_KEYS.length);
  state.bossSpawnCount = Math.max(state.bossSpawnCount, UNIQUE_BOSS_KEYS.length);
  state.eliminations = Math.max(state.eliminations, UNIQUE_BOSS_INTERVAL * UNIQUE_BOSS_KEYS.length);
  const firstBossSpec = takeNextBossSpec();
  state.bots = firstBossSpec ? [createBot({ boss: true, bossSpec: firstBossSpec })] : [];
  fillBots();
  state.rerollBaseCost = 1;
  rerollShop();
  beginRound();
  addLog("SKIP: jumped past the eight special bosses to the first Goetic Seal boss.");
  render();
}

function skipToFinalBosses() {
  state.pauseOpen = false;
  state.pendingActive = null;
  state.goeticBossKills = GOETIC_BOSS_TOTAL;
  state.bossKills = Math.max(state.bossKills, UNIQUE_BOSS_KEYS.length + GOETIC_BOSS_TOTAL);
  state.bossSpawnCount = Math.max(state.bossSpawnCount, UNIQUE_BOSS_KEYS.length + GOETIC_BOSS_TOTAL);
  state.eliminations = Math.max(state.eliminations, UNIQUE_BOSS_INTERVAL * (UNIQUE_BOSS_KEYS.length + GOETIC_BOSS_TOTAL));
  enterFinalBossPhase();
  rerollShop();
  beginRound();
  addLog("SKIP: jumped to the Jesus and Satan phase.");
  render();
}

function skipArcadeProgression() {
  if (arcadeActionLocked()) return;
  if (state.finalBossPhase) {
    addLog("SKIP: final phase is already active.");
    render();
    return;
  }
  if (activeGoeticBoss() || state.goeticBossKills > 0) {
    skipToFinalBosses();
  } else {
    skipToFirstGoeticBoss();
  }
}

function createBot(options = {}) {
  const isBoss = Boolean(options.boss);
  const bossSpec = options.bossSpec || null;
  const inherited = !isBoss && options.inheritFrom ? options.inheritFrom : null;
  const uniqueSpec = bossSpec?.uniqueKey ? UNIQUE_BOSS_SPECS[bossSpec.uniqueKey] : null;
  const copiedUniqueSpec = bossSpec?.copiedUniqueKey ? UNIQUE_BOSS_SPECS[bossSpec.copiedUniqueKey] : null;
  const powerSpec = copiedUniqueSpec || uniqueSpec;
  const profile = isBoss ? null : inherited ? inherited : randomBotProfile();
  const archetype = uniqueSpec
    ? archetypeByType((powerSpec || uniqueSpec).personality)
    : inherited
      ? archetypeByType(inherited.type)
      : passiveStack("p89")
        ? archetypeByType(allowedTwinTemperType())
        : randomFrom(BOT_ARCHETYPES);
  const bossOrder = isBoss ? state.bossSpawnCount + 1 : 0;
  const isEndlessBoss = isBoss && !uniqueSpec;
  const goeticSpec = isEndlessBoss ? goeticBossSpecFromKey(bossSpec?.goeticKey) : null;
  const bossBaseHp = 80 + bossHealthBonus();
  const statFactor = uniqueSpec?.statFactor ?? bossSpec?.statFactor ?? 1;
  const maxHp = isBoss ? Math.ceil(bossBaseHp * bossHealthScaleFactor() * statFactor) : randomBotHealth();
  const endlessModifier = isEndlessBoss ? randomInt(6, 12) / 10 : null;
  const passiveKeys = isBoss
    ? uniqueSpec
      ? []
      : randomBossPassiveKeys(1)
    : [];
  const reward = randomInt(1, 5);
  const loadedSpawnChance = Math.min(1, passiveStack("p23") ? 0.33 * passivePower("p23") : 0);
  const loadedSpawnBonus = !isBoss && loadedSpawnChance && Math.random() < loadedSpawnChance ? 6 : 0;
  if (loadedSpawnBonus) markPassiveTriggered("p23");
  const bot = {
    id: state.nextBotId++,
    name: isBoss ? uniqueSpec?.name || goeticSpec?.name || "PandoriumBeast" : profile.name,
    flag: profile?.flag || "🏴",
    country: profile?.country || "BOSS",
    type: isBoss ? "BOSS" : inherited?.type || archetype.type,
    color: isBoss ? "#d64f45" : archetype.color,
    image: uniqueSpec?.image || goeticSpec?.image || inherited?.image || randomBotImage(),
    anchor: clamp(inherited?.anchor ?? archetype.anchor + randomInt(-8, 8), 0, 100),
    aggression: inherited?.aggression ?? (isBoss ? Math.min(0.75, archetype.aggression + 0.12) : archetype.aggression),
    noise: inherited?.noise ?? (isBoss ? Math.max(7, archetype.noise - 1) : archetype.noise),
    hp: maxHp,
    maxHp,
    reward: reward + loadedSpawnBonus,
    isBoss,
    bossOrder,
    uniqueKey: uniqueSpec?.key || null,
    copiedUniqueKey: copiedUniqueSpec?.key || null,
    pairGroupId: bossSpec?.pairGroupId || null,
    modifierCycleStartRound: ["petros", "pavlos"].includes(uniqueSpec?.key) ? state.round : null,
    goeticKey: goeticSpec?.key || null,
    goeticPassiveId: goeticSpec?.passiveId || null,
    goeticSealName: goeticSpec?.sealName || null,
    modifierOverride: uniqueSpec?.modifierOverride ?? copiedUniqueSpec?.modifierOverride ?? endlessModifier,
    shopTax: uniqueSpec?.shopTax || 0,
    eliminationDamage: uniqueSpec?.eliminationDamage || copiedUniqueSpec?.eliminationDamage || 0,
    grantsBuffs: Boolean(uniqueSpec?.grantsBuffs || copiedUniqueSpec?.grantsBuffs),
    bossBountyFactor: uniqueSpec?.bossBountyFactor ?? bossSpec?.bossBountyFactor ?? 1,
    bossBountyBonus: 0,
    countsAsBossProgress: uniqueSpec?.countsAsBossProgress !== false && bossSpec?.countsAsBossProgress !== false,
    countsAsBossSpawn: uniqueSpec?.countsAsBossSpawn !== false && bossSpec?.countsAsBossSpawn !== false,
    passiveKeys,
    buffPassiveKey: null,
    uniqueDescriptions: uniqueSpec?.descriptions || [],
    memory: isBoss ? state.gameMemory.slice() : (inherited?.memory || []).slice(),
    markedByPlayer: false,
    plannedGuess: null,
    lastDamage: 0,
    lastHeal: 0,
    lastSinDelta: 0,
    lastMemoryDelta: 0,
    damageSources: [],
    healSources: [],
    sinSources: [],
    memorySources: [],
    poisonCounters: 0,
    deathCause: null,
    deathNotice: null,
    eliminated: false,
    skipEliminationReward: false,
    pendingReplacementSpec: null,
    revealedByPassive: false,
    fresh: true
  };
  if (isBoss && botHasUniquePower(bot, "serafim")) applySerafimEntrySteal(bot);
  seedNewBotMemoryFromVassago(bot);
  if (isBoss && bot.countsAsBossSpawn !== false) state.bossSpawnCount += 1;
  return bot;
}

function fillBots() {
  while (state.bots.length < BOT_COUNT) {
    state.bots.push(createBot());
  }
}

function resetBotsForRun() {
  state.bots = [];
  fillBots();
}

function applyPyrosBuffs() {
  const pyrosSource = activeBossesWithPower("pyros")[0];
  if (!pyrosSource || state.roundState?.pyrosGiftGranted) return;
  const candidates = activeBots();
  if (!candidates.length) return;
  const target = randomFrom(candidates);
  const key = grantRandomPyrosGift(target);
  if (!key) return;
  if (state.roundState) {
    state.roundState.pyrosGiftGranted = true;
    state.roundState.roundEvents.push(`${pyrosSource.name} gave ${target.name} ${botPassiveKeyName(key)}.`);
  }
}

function rerollShop() {
  if (shopDisabledBySatan()) {
    state.shop = [];
    return;
  }
  const eliteBoosted = eliteRerollBoostCount();
  state.eliteBoostedNextReroll = 0;
  state.shop = [drawPassiveShopItem(eliteBoosted), drawActiveShopItem(), drawActiveShopItem()];
  if (eliteBoosted) addLog(`${activeName("a23")} marked this Seal reroll. ELITE chance is ${Math.round(eliteShopChance(eliteBoosted) * 100)}%.`);
  syncShopSlotCount();
}

function syncShopSlotCount() {
  if (shopDisabledBySatan()) {
    state.shop = [];
    return;
  }
  const count = shopSlotCount();
  while (state.shop.length < count) state.shop.push(drawActiveShopItem());
  if (state.shop.length > count) state.shop = state.shop.slice(0, count);
}

function drawShopItem(pool) {
  const availablePool = pool.filter((id) => !REMOVED_PASSIVE_IDS.has(id));
  const id = randomFrom(availablePool.length ? availablePool : pool);
  return { item: itemCopy(id), sold: false };
}

function sacrificialDaggerShopWeight(idOrItem = "p70") {
  const stack = typeof idOrItem === "string" ? passiveStack(idOrItem) : idOrItem?.stack || 0;
  return stack ? 2 : 1;
}

function activeShopPool() {
  const pool = ACTIVE_IDS.slice();
  const daggerExtraCopies = Math.max(0, sacrificialDaggerShopWeight() - 1);
  for (let copy = 0; copy < daggerExtraCopies; copy += 1) {
    pool.push("a15");
  }
  return pool;
}

function drawActiveShopItem() {
  return drawShopItem(activeShopPool());
}

function drawPassiveShopItem(eliteBoosted = false) {
  const passivePool = PASSIVE_IDS.filter((id) => !REMOVED_PASSIVE_IDS.has(id));
  const availablePool = passivePool.filter((id) => !isSelfStackingSeal(id) || directPassiveStack(id) === 0);
  const ownedPassives = availablePool.filter((id) => directPassiveStack(id) > 0 && !isSelfStackingSeal(id));
  const freshPassives = availablePool.filter((id) => directPassiveStack(id) === 0);
  const eliteChance = eliteShopChance(eliteBoosted);
  const wantsElite = ownedPassives.length > 0 && Math.random() < eliteChance;
  const choices = wantsElite ? ownedPassives : freshPassives.length ? freshPassives : ownedPassives;
  if (!choices.length) return drawShopItem(availablePool.length ? availablePool : passivePool.filter((id) => !isSelfStackingSeal(id)));
  return { item: itemCopy(randomFrom(choices)), sold: false };
}

function playtestMoneyModeActive() {
  return Boolean(state.playtestInfiniteMoney);
}

function canSpendCredits(amount) {
  const cost = Math.max(0, Math.ceil(amount));
  return playtestMoneyModeActive() || state.player.credits >= cost;
}

function spendCredits(amount) {
  const cost = Math.max(0, Math.ceil(amount));
  if (!canSpendCredits(cost)) return false;
  state.player.credits -= cost;
  applyCreditLashSpent(cost);
  return true;
}

function resetNegativePlaytestSin() {
  if (state.player.credits >= 0) return false;
  state.player.credits = 0;
  addLog("Playtest SIN debt reset to 0.");
  return true;
}

function togglePlaytestMoneyMode() {
  if (arcadeActionLocked()) return;
  state.playtestInfiniteMoney = !state.playtestInfiniteMoney;
  if (!state.playtestInfiniteMoney) resetNegativePlaytestSin();
  addLog(`Playtest SIN debt ${state.playtestInfiniteMoney ? "enabled" : "disabled"}.`);
  render();
}

function gainCreditsFromSourceEntries(entries, applyRoundMultiplier = true) {
  const normalizedEntries = mergeSourceEntries(entries);
  const base = normalizedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const multiplier = applyRoundMultiplier && state.roundState ? state.roundState.bountyMultiplier || 1 : 1;
  const gained = Math.ceil(base * multiplier);
  state.player.credits += gained;
  if (gained > 0) {
    if (state.roundState) state.roundState.earnedSinThisRound = (state.roundState.earnedSinThisRound || 0) + gained;
    state.playerLastCredits = (state.playerLastCredits || 0) + gained;
    normalizedEntries.forEach((entry) => recordPlayerCreditSource(entry.amount, entry.source || "SIN"));
    const multiplierBonus = Math.max(0, gained - base);
    if (multiplierBonus > 0) {
      recordPlayerCreditSource(multiplierBonus, ITEMS.a10?.name || "Funeral Coin");
    }
  }
  return gained;
}

function gainCredits(amount, applyRoundMultiplier = true, source = undefined) {
  return gainCreditsFromSourceEntries([{ amount: Math.max(0, Math.ceil(amount)), source: source || "SIN" }], applyRoundMultiplier);
}

function loseCredits(amount, source = "SIN loss") {
  const loss = Math.max(0, Math.ceil(amount));
  if (loss <= 0) return 0;
  const before = Math.max(0, Math.ceil(state.player.credits || 0));
  const lost = Math.min(before, loss);
  state.player.credits = Math.max(0, before - lost);
  if (state.roundState) {
    state.roundState.roundEvents.push(`${source} removed ${lost} SIN.`);
  }
  return lost;
}

function recordEliminationCredits(credits) {
  const gained = Math.max(0, Math.ceil(credits));
  if (!state.roundState || gained <= 0) return;
  state.roundState.eliminationCreditRecords.push({ credits: gained });
}

function gainEliminationCredits(amount, applyRoundMultiplier = true, source = undefined) {
  const gained = gainCredits(amount, applyRoundMultiplier, source || "Bounty");
  recordEliminationCredits(gained);
  return gained;
}

function gainEliminationCreditsFromSourceEntries(entries, applyRoundMultiplier = true) {
  const gained = gainCreditsFromSourceEntries(entries, applyRoundMultiplier);
  recordEliminationCredits(gained);
  return gained;
}

function distributeSinAmongHighest(amount, targets) {
  const total = Math.max(0, Math.ceil(amount));
  const ordered = targets
    .filter((bot) => bot && !bot.eliminated && !bot.immortal && Number.isFinite(botRegularBounty(bot)))
    .sort((left, right) => botSin(right) - botSin(left) || left.id - right.id);
  if (total <= 0 || !ordered.length) return 0;
  const base = Math.floor(total / ordered.length);
  let remainder = total - base * ordered.length;
  let distributed = 0;
  ordered.forEach((bot) => {
    const gift = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    if (gift <= 0) return;
    const result = changeBotSin(bot, gift, `Seal of Agares gave ${bot.name} +${gift} SIN.`);
    distributed += result.gained;
  });
  return distributed;
}

function applyAgaresEarnedSinSpread() {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p50");
  if (!round || round.agaresSpreadApplied || !entries.length) return;
  const earned = Math.max(0, Math.ceil(round.earnedSinThisRound || 0));
  const amount = Math.ceil(earned * 0.1);
  const targets = activeBots().filter((bot) => !bot.immortal);
  if (earned <= 0 || amount <= 0 || !targets.length) return;
  round.agaresSpreadApplied = true;
  entries.forEach((entry) => {
    markPassiveEntryTriggered(entry);
    const distributed = distributeSinAmongHighest(amount, targets);
    if (distributed > 0) {
      round.roundEvents.push(`Seal of Agares spread ${distributed} SIN from ${earned} round-earned SIN.`);
    }
  });
}

function applyMarketHex(cost) {
  if (!passiveStack("p20")) return;
  const targets = activeBots();
  if (!targets.length) return;
  const damage = flatDamageValue("p20", cost);
  if (damage <= 0) return;
  markPassiveTriggered("p20");
  damageBots(targets, damage, (target, dealt) => `Seal of Haagenti dealt ${dealt} damage to ${target.name}.`);
}

function applyCreditLashSpent(amount) {
  const round = state.roundState;
  if (!round || !passiveStack("p29")) return;
  round.creditsSpentThisRound += Math.max(0, Math.ceil(amount));
  const totalTicks = Math.floor(round.creditsSpentThisRound / 2);
  const ticks = totalTicks - (round.creditLashDamageApplied || 0);
  if (ticks <= 0) return;
  markPassiveTriggered("p29");
  const damage = furfurDamage("p29");
  let appliedTicks = 0;
  for (let tick = 0; tick < ticks; tick += 1) {
    const target = highestHealthEnemy();
    if (!target) break;
    damageBot(target, damage, `Seal of Furfur dealt ${damage} damage to ${target.name}.`, "Seal of Furfur");
    appliedTicks += 1;
  }
  round.creditLashDamageApplied = (round.creditLashDamageApplied || 0) + appliedTicks;
}

function recordShopItemBought(itemId) {
  if (state.roundState) state.roundState.shopItemBoughtThisRound = true;
  state.player.passives.forEach((passive) => {
    if (passive.id === "p39") passive.counter = 0;
  });
  if (itemId === "p39") {
    const ledger = passiveEntry("p39");
    if (ledger) ledger.counter = 1;
  }
}

function activePurchaseCost(item) {
  if (!item || item.freeLoot) return 0;
  return Math.max(0, Math.ceil(item.purchaseCost ?? item.price ?? 0));
}

function arcadeActionLocked() {
  return state.mode !== "arcade" || state.gameOver || roundRevealAnimationActive();
}

function itemBuyValue(item) {
  if (!item) return 0;
  if (item.type === "active") return Math.max(0, Math.ceil(Math.max(item.purchaseCost ?? 0, item.price ?? 0)));
  return Math.max(0, Math.ceil((item.price || 0) * (item.stack || 1)));
}

function applyActiveUsePassives(item) {
  const round = state.roundState;
  if (!round || !item) return;
  if (state.player.hp <= 0) return;

  const previousCount = round.activeUseItemCounts.get(item.id) || 0;
  const nextCount = previousCount + 1;
  round.activeUseItemCounts.set(item.id, nextCount);

  orderedPassiveEffectEntries(["p20", "p26", "p27", "p60"]).forEach((entry) => {
    if (entry.id === "p20") {
      const targets = activeBots();
      const damage = passiveEntryFlatDamage(entry, activePurchaseCost(item));
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      queueEndOfRoundBotDamages(targets, damage, (target, queued) => `Seal of Haagenti dealt ${queued} damage to ${target.name}.`, "Seal of Haagenti");
      return;
    }

    if (entry.id === "p60") {
      if (Math.random() >= 0.5) return;
      markPassiveEntryTriggered(entry);
      const duplicate = copiedEffectItem(item);
      let duplicated = false;
      if (state.player.actives.length < activeInventoryLimit()) {
        state.player.actives.push(duplicate);
        normalizeActiveCarouselIndex();
        duplicated = true;
      }
      const targets = activeBots();
      const damage = gaapDamage(entry);
      if (targets.length && damage > 0) {
        queueEndOfRoundBotDamages(
          targets,
          damage,
          (bot, queued) => `Seal of Gaap dealt ${queued} damage to ${bot.name}.`,
          "Seal of Gaap"
        );
      }
      round.roundEvents.push(
        duplicated
          ? `Seal of Gaap copied ${item.name} and struck every DAMNED.`
          : `Seal of Gaap struck every DAMNED, but your ARTIFACT inventory was full.`
      );
      return;
    }

    if (entry.id === "p26") {
      const triggerKey = `${entry.index}:${item.id}`;
      if (nextCount < 2 || round.twinDetonatorTriggeredIds.has(triggerKey)) return;
      round.twinDetonatorTriggeredIds.add(triggerKey);
      const damage = twinDetonatorDamage(entry);
      const targets = activeBots();
      if (!targets.length) return;
      markPassiveEntryTriggered(entry);
      queueEndOfRoundBotDamages(
        targets,
        damage,
        (bot, queued) => `Seal of Amdusias dealt ${queued} damage to ${bot.name}.`,
        "Seal of Amdusias"
      );
      return;
    }

    if (entry.id === "p27") {
      const outcomes = ["heal", "damage", "refund"];
      const outcome = randomFrom(outcomes);
      markPassiveEntryTriggered(entry);

      if (outcome === "heal") {
        const { credits } = applyPassivePlayerHealForEntry(entry, 3, "Seal of Zagan");
        round.roundEvents.push(`Seal of Zagan paid ${credits} SIN.`);
        return;
      }

      if (outcome === "damage") {
        const targets = activeBots();
        if (!targets.length) {
          round.roundEvents.push("Seal of Zagan sparked, but no DAMNED could be hit.");
          return;
        }
        const target = randomFrom(targets);
        const damage = reactiveWarrantyDamage(entry);
        queueEndOfRoundBotDamage(target, damage, `Seal of Zagan dealt ${damage} damage to ${target.name}.`, "Seal of Zagan");
        return;
      }

      const refund = activePurchaseCost(item);
      const gained = gainCredits(refund, false, "Seal of Zagan");
      round.roundEvents.push(`Seal of Zagan refunded ${gained} SIN from ${item.name}.`);
    }
  });
}

function startGame(options = {}) {
  resetRoundRevealAnimation();
  resumeSoundtrack();
  pvpClearAutoTimer();
  pvpStopHostPolling();
  const restartingSlotId = options.slotId || (state.mode === "arcade" ? state.currentRunSlotId : null) || createArcadeRunSlotId();
  state.mode = "arcade";
  state.currentRunSlotId = restartingSlotId;
  state.runStartedAt = Date.now();
  state.pauseOpen = false;
  state.pauseDevOpen = false;
  state.round = 1;
  state.stage = "guess";
  state.player.maxHp = PLAYER_MAX_HP;
  state.player.hp = PLAYER_MAX_HP;
  state.player.credits = STARTING_CREDITS;
  state.player.passives = [];
  state.player.actives = [];
  state.log = [];
  state.roundState = null;
  state.previousTarget = null;
  state.playerLastDamage = 0;
  state.playerLastHeal = 0;
  state.playerLastCredits = 0;
  state.playerDamageSources = [];
  state.playerHealSources = [];
  state.playerCreditSources = [];
  state.sealStats = {};
  state.runStats = defaultRunStats();
  state.pendingNextRoundMarbasBonuses = [];
  state.pendingNextRoundLambReveals = [];
  state.pendingSelfStackingPentakillDamage = 0;
  state.gameMemory = [];
  state.pendingActive = null;
  state.lastUsedArtifact = null;
  state.gameOver = false;
  state.inspectingGameOver = false;
  state.nextBotId = 1;
  state.nextItemUid = 1;
  state.eliminations = 0;
  state.bossKills = 0;
  state.itemsBought = 0;
  state.totalArtifactsUsed = 0;
  state.selfStackingGameConditionCounts = Object.fromEntries(Object.values(SELF_STACKING_SEAL_SPECS).map((spec) => [spec.key, 0]));
  state.rerollBaseCost = 1;
  state.activeCarouselIndex = 0;
  state.mobileOfferingsOpen = false;
  state.bossSpawnCount = 0;
  state.uniqueBossQueue = shuffled(UNIQUE_BOSS_KEYS);
  state.goeticBossQueue = shuffled(GOETIC_BOSS_KEYS);
  state.goeticBossKills = 0;
  state.nextBossPairId = 1;
  state.finalBossPhase = false;
  state.finalBossQueued = false;
  state.bossQueued = false;
  state.killsSinceBossSpawn = 0;
  state.eliteBoostedNextReroll = 0;
  state.paleHorseBoostArmed = false;
  state.critMomentumBonus = 0;
  state.previousRoundEliminationsForMartyrs = 0;
  resetBotsForRun();
  rerollShop();
  beginRound();
  addLog("Round 1 begins. The table continues until you fall.");
  render();
}

function beginRound() {
  beginRunRoundStats();
  resetNegativePlaytestSin();
  pruneRemovedPassives();
  state.stage = "guess";
  state.shouldFocusGuessInput = true;
  state.pendingActive = null;
  state.playerLastDamage = 0;
  state.playerLastHeal = 0;
  state.playerLastCredits = 0;
  state.playerDamageSources = [];
  state.playerHealSources = [];
  state.playerCreditSources = [];
  const twinModifier = petrosPavlosRoundModifier();
  const threonMystery = aliveUniqueBoss("threon");
  const paleHorseDamageBoostActive = Boolean(state.paleHorseBoostArmed);
  state.paleHorseBoostArmed = false;
  state.roundState = {
    playerSubmittedGuess: null,
    playerEffectiveGuess: null,
    botSubmittedGuesses: new Map(),
    botEffectiveGuesses: new Map(),
    targetModifier: twinModifier ?? (threonMystery ? randomInt(7, 13) / 10 : currentTargetModifier()),
    mysteryModifier: twinModifier === null && threonMystery,
    targetOffset: 0,
    target: null,
    criticalInteger: null,
    tableAverage: null,
    extraAverageGuesses: [],
    removedBotIds: new Set(),
    activeUses: 0,
    activeUseItemCounts: new Map(),
    artifactTargetCountsByBotId: new Map(),
    twinDetonatorTriggeredIds: new Set(),
    painEcho: false,
    bountyMultiplier: 1,
    edgeGambitStacks: 0,
    playerDamageReduction: 0,
    playerDamageReductionSource: "",
    creditsSpentThisRound: 0,
    earnedSinThisRound: 0,
    rerollSinSpentThisRound: 0,
    agaresSpreadApplied: false,
    creditLashDamageApplied: 0,
    temporaryBotSinBonuses: [],
    botDamageTotals: new Map(),
    highDamageSinBotIds: new Set(),
    balamResolving: false,
    shopItemBoughtThisRound: false,
    multiEliminationBonusPaid: false,
    eliminatedPersonalities: [],
    eliminationsThisRound: 0,
    eliminationCreditRecords: [],
    pentakillAwarded: false,
    pentakillPopup: false,
    revealedBotIds: new Set(),
    amonRewardKeys: new Set(),
    targetDifferenceDamageByBotId: new Map(),
    playerTargetDifferenceDamage: 0,
    bossRevealPunishedKeys: new Set(),
    bossAbilityNullifiedBotIds: new Set(),
    belethTriggeredBotIds: new Set(),
    vapulaTriggeredBotIds: new Set(),
    wiretapExtraCount: null,
    wiretapStack: 0,
    kalhaSuppressedPassiveIds: new Set(),
    kalhaSuppressedById: null,
    pavlosProtectedBotId: null,
    pavlosStartHpById: new Map(),
    pavlosDeferredBotIds: new Set(),
    resolvingDeferredPavlos: false,
    pyrosGiftGranted: false,
    devSealsRolled: false,
    devTemporaryActiveUids: new Set(),
    padmaVulnerableBotIds: new Set(),
    paleHorseDamageBoostActive,
    previousRoundEliminationsForMartyrs: state.previousRoundEliminationsForMartyrs || 0,
    selfStackingConditionCounts: Object.fromEntries(Object.values(SELF_STACKING_SEAL_SPECS).map((spec) => [spec.key, 0])),
    selfStackingCriticalDamage: 0,
    pendingEndOfRoundBotDamages: [],
    resolvingEndOfRoundPassives: false,
    triggeredPassiveIds: new Set(),
    penaltiesApplied: false,
    criticalHitKeys: new Set(),
    roundEvents: []
  };

  state.bots.forEach((bot) => {
    if (bot.eliminated) return;
    trimBotMemoryToLimit(bot);
    bot.fresh = bot.memory.length === 0;
    bot.lastDamage = 0;
    bot.lastHeal = 0;
    bot.lastSinDelta = 0;
    bot.damageSources = [];
    bot.healSources = [];
    bot.sinSources = [];
    bot.deathCause = null;
    bot.deathNotice = null;
    bot.markedByPlayer = false;
    bot.diffMarkedByPlayer = false;
    bot.revealedByPassive = false;
    if (bot.uniqueKey === "pavlos") state.roundState.pavlosStartHpById.set(bot.id, bot.hp);
  });

  enforceTwinTemperPersonalities();
  applyFixedWillStart();
  applyPendingNextRoundMarbasBonuses();
  state.bots.forEach((bot) => {
    if (bot.eliminated) return;
    bot.fresh = bot.memory.length === 0;
    bot.plannedGuess = planBotGuess(bot);
  });

  applyKalhaSealSuppression();
  applySerafimRoundSteal();
  applyBossSinStealing();
  applyPadmaStartHealing();
  applyPyrosBuffs();
  applyMarkedProspect();
  applyGuessReveals();
  applyPendingNextRoundLambReveals();
  applyStartOfRoundPassives();
  applyGuessReveals();
  applyRevealPoisonCounters();
}

function applyMarkedProspect() {
  if (!passiveStack("p38")) return;
  const targets = activeBots();
  if (!targets.length) return;
  const target = randomFrom(targets);
  target.markedByPlayer = true;
  markPassiveTriggered("p38");
  state.roundState.roundEvents.push(`Seal of Astaroth marked ${target.name}.`);
}

function queueMarbasNextRoundSpread(entry) {
  if (!entry) return;
  state.pendingNextRoundMarbasBonuses = state.pendingNextRoundMarbasBonuses || [];
  state.pendingNextRoundMarbasBonuses.push({
    sin: passiveEntryConvertedSin(entry, 3),
    memory: 3,
    source: ITEMS.p9?.name || "Seal of Marbas"
  });
  markPassiveEntryTriggered(entry);
  state.roundState?.roundEvents.push("Seal of Marbas will spread SIN and MEMORY among next-round DAMNED.");
}

function applyPendingNextRoundMarbasBonuses() {
  const pending = state.pendingNextRoundMarbasBonuses || [];
  if (!pending.length || !state.roundState) return;
  state.pendingNextRoundMarbasBonuses = [];
  pending.forEach((bonus) => {
    const targets = activeBots().filter((bot) => !bot.immortal);
    if (!targets.length) return;
    const source = bonus.source || "Seal of Marbas";
    let sinSpread = 0;
    let memorySpread = 0;
    for (let index = 0; index < Math.max(0, Math.ceil(bonus.sin || 0)); index += 1) {
      const target = randomFrom(targets);
      const result = changeBotSin(target, 1, "", { source });
      sinSpread += result.gained;
    }
    for (let index = 0; index < Math.max(0, Math.ceil(bonus.memory || 0)); index += 1) {
      const target = randomFrom(targets);
      memorySpread += addBotMemory(target, 1, "", { source });
    }
    if (sinSpread || memorySpread) {
      state.roundState.roundEvents.push(`${source} spread ${sinSpread} SIN and ${memorySpread} MEMORY among next-round DAMNED.`);
    }
  });
}

function queueMummifiedLambNextRoundReveal(bot, source = activeName("a25")) {
  if (!bot) return;
  state.pendingNextRoundLambReveals = state.pendingNextRoundLambReveals || [];
  state.pendingNextRoundLambReveals.push({
    botId: bot.id,
    botName: bot.name,
    bounty: 3,
    source
  });
  state.roundState?.roundEvents.push(`${source} marked ${bot.name} for next-round reveal and BOUNTY.`);
}

function applyPendingNextRoundLambReveals() {
  const pending = state.pendingNextRoundLambReveals || [];
  if (!pending.length || !state.roundState) return;
  state.pendingNextRoundLambReveals = [];
  pending.forEach((effect) => {
    const source = effect.source || activeName("a25");
    const bot = state.bots.find((candidate) => candidate.id === effect.botId && candidate.hp > 0 && !candidate.eliminated);
    if (!bot) {
      state.roundState.roundEvents.push(`${source} found no living target for ${effect.botName || "the marked DAMNED"}.`);
      return;
    }
    revealBotGuess(bot, source, null, { allowBoss: true });
    const bounty = Math.max(0, Math.ceil(effect.bounty || 0));
    const result = changeBotSin(bot, bounty, "", { source, triggerLossDamage: false });
    state.roundState.roundEvents.push(`${source} gave ${bot.name} +${result.gained} BOUNTY for its next-round mark.`);
  });
}

function applyStartOfRoundSinRedistribution() {
  const entries = orderedPassiveEffectEntries("p48");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const targets = shuffled(activeBots().filter((bot) => !bot.immortal && botRegularBounty(bot) > 0)).slice(0, Math.max(1, entry.stack || 1));
    if (!targets.length) return;
    markPassiveEntryTriggered(entry);
    targets.forEach((bot) => {
      const bonus = botSin(bot);
      if (bonus <= 0) return;
      const result = changeBotSin(bot, bonus, `Seal of Cimejes doubled ${bot.name}'s bounty for this round.`);
      if (result.gained > 0) {
        state.roundState.temporaryBotSinBonuses.push({
          botId: bot.id,
          amount: result.gained,
          source: "Seal of Cimejes"
        });
      }
    });
  });
}

function applyStartOfRoundPassives() {
  applyStartOfRoundSinRedistribution();

  orderedPassiveEffectEntries("p14").forEach((entry) => {
    const targets = activeBots();
    if (!targets.length) return;
    const target = randomFrom(targets);
    const damage = passiveEntryFlatDamage(entry, 20);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    const wasAlive = target.hp > 0 && !target.eliminated;
    damageBot(target, damage, `Seal of Leraje dealt ${damage} damage to ${target.name}.`, "Seal of Leraje");
    if (wasAlive && target.eliminated) {
      const credits = passiveEntryScaledValue(entry, 8);
      const gained = gainCredits(credits, true, "Seal of Leraje");
      state.roundState.roundEvents.push(`Seal of Leraje paid ${gained} SIN for eliminating ${target.name}.`);
      return;
    }
    if (!target.eliminated) {
      setBotPersonality(target, "Stubborn", "Seal of Leraje");
    }
  });
}

function projectedMemoryTarget(
  memoryEntry,
  modifier = state.roundState?.targetModifier ?? BASE_TARGET_MODIFIER,
  offset = state.roundState?.targetOffset ?? 0
) {
  if (!memoryEntry) return null;
  if (Number.isFinite(memoryEntry.tableAverage)) {
    return Math.ceil(memoryEntry.tableAverage * modifier + offset);
  }
  if (Number.isFinite(memoryEntry.target) && Number.isFinite(memoryEntry.targetModifier) && memoryEntry.targetModifier !== 0) {
    const previousOffset = Number.isFinite(memoryEntry.targetOffset) ? memoryEntry.targetOffset : 0;
    return Math.ceil(((memoryEntry.target - previousOffset) / memoryEntry.targetModifier) * modifier + offset);
  }
  return Number.isFinite(memoryEntry.target) ? memoryEntry.target : null;
}

function applyFurcasLastTargetGuessSet() {
  const entries = orderedPassiveEffectEntries("p72");
  const round = state.roundState;
  if (!entries.length || !round || !Number.isFinite(state.previousTarget)) return;
  const previous = Math.ceil(state.previousTarget);
  if (previous === 40) return;
  entries.forEach((entry) => {
    const targets = previous < 40 ? activeBots().filter((bot) => !bot.isBoss) : activeBots();
    if (!targets.length) return;
    const target = randomFrom(targets);
    const guess = previous < 40 ? 100 : 0;
    round.botSubmittedGuesses.set(target.id, guess);
    round.botEffectiveGuesses.set(target.id, guess);
    target.plannedGuess = guess;
    markPassiveEntryTriggered(entry);
    round.roundEvents.push(`Seal of Furcas set ${target.name}'s guess to ${guess} because the previous TARGET was ${previous}.`);
    const damage = furcasSelectedDamage(entry);
    if (damage > 0) {
      queueEndOfRoundBotDamage(target, damage, `Seal of Furcas dealt ${damage} damage to ${target.name}.`, "Seal of Furcas");
    }
  });
}

function applySallosGuessShiftAwayFromTarget() {
  const entries = orderedPassiveEffectEntries("p71");
  const round = state.roundState;
  if (!entries.length || !round || !Number.isFinite(round.target)) return;
  entries.forEach((entry) => {
    const values = sallosShiftValues(entry);
    let shifted = 0;
    activeBots().forEach((bot) => {
      const current = round.botEffectiveGuesses.get(bot.id);
      if (!Number.isFinite(current)) return;
      const direction = current === round.target ? randomFrom([-1, 1]) : current > round.target ? 1 : -1;
      const amount = randomFrom(values);
      const next = Math.ceil(clamp(current + direction * amount, 0, 100));
      if (next === current) return;
      round.botEffectiveGuesses.set(bot.id, next);
      shifted += 1;
    });
    if (!shifted) return;
    markPassiveEntryTriggered(entry);
    round.roundEvents.push(`Seal of Sallos shifted ${shifted} DAMNED guesses away from the TARGET without changing the average.`);
  });
}

function applyBifronsTargetSevenSin() {
  const entries = orderedPassiveEffectEntries("p41");
  const round = state.roundState;
  if (!entries.length || !round || !Number.isFinite(round.criticalInteger)) return;
  if (round.criticalInteger % 7 !== 0) return;
  entries.forEach((entry) => {
    const sin = bifronsSinReward(entry);
    if (sin <= 0) return;
    const gained = gainCredits(sin, true, "Seal of Bifrons");
    markPassiveEntryTriggered(entry);
    round.roundEvents.push(`Seal of Bifrons paid ${gained} SIN because the TARGET was a multiple of 7.`);
  });
}

function memoryRawAverage(memoryEntry) {
  if (!memoryEntry) return null;
  if (Number.isFinite(memoryEntry.tableAverage)) return memoryEntry.tableAverage;
  if (Number.isFinite(memoryEntry.target) && Number.isFinite(memoryEntry.targetModifier) && memoryEntry.targetModifier !== 0) {
    const previousOffset = Number.isFinite(memoryEntry.targetOffset) ? memoryEntry.targetOffset : 0;
    return (memoryEntry.target - previousOffset) / memoryEntry.targetModifier;
  }
  return null;
}

function weightedMemoryAverage(entries, readValue) {
  let weighted = 0;
  let totalWeight = 0;
  entries.forEach((entry, index) => {
    const value = readValue(entry);
    if (!Number.isFinite(value)) return;
    const weight = index + 1;
    weighted += value * weight;
    totalWeight += weight;
  });
  return totalWeight ? weighted / totalWeight : null;
}

function selfConsistentBossGuess(otherAverage, participantCount, modifier, offset) {
  const count = Math.max(2, participantCount);
  const others = Math.max(1, count - 1);
  const denominator = 1 - modifier / count;
  if (denominator <= 0.05) return otherAverage * modifier + offset;
  return (modifier * otherAverage * others / count + offset) / denominator;
}

function planBossGuess(bot) {
  const memory = bot.memory || [];
  const currentModifier = state.roundState?.targetModifier ?? currentTargetModifier();
  const currentOffset = state.roundState?.targetOffset ?? 0;
  const participantCount = Math.max(2, activeBots().length + 1);
  const recent = memory.slice(-Math.min(8, memory.length));
  const assumedOpeningAverage = bot.anchor * 0.28 + 50 * 0.72;

  if (!recent.length) {
    const openingGuess = selfConsistentBossGuess(assumedOpeningAverage, participantCount, currentModifier, currentOffset);
    return Math.ceil(clamp(openingGuess + randomInt(-4, 4), 0, 100));
  }

  const estimatedOtherAverage =
    weightedMemoryAverage(recent, (entry) => {
      const rawAverage = memoryRawAverage(entry);
      if (!Number.isFinite(rawAverage)) return null;
      if (Number.isFinite(entry.ownGuess) && participantCount > 1) {
        return (rawAverage * participantCount - entry.ownGuess) / (participantCount - 1);
      }
      return rawAverage;
    }) ?? assumedOpeningAverage;
  const selfConsistentGuess = selfConsistentBossGuess(
    clamp(estimatedOtherAverage, 0, 100),
    participantCount,
    currentModifier,
    currentOffset
  );
  const projectedTarget = weightedMemoryAverage(recent, (entry) => projectedMemoryTarget(entry, currentModifier, currentOffset));
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2] || last;
  const lastTarget = projectedMemoryTarget(last, currentModifier, currentOffset) ?? projectedTarget ?? selfConsistentGuess;
  const prevTarget = projectedMemoryTarget(prev, currentModifier, currentOffset) ?? lastTarget;
  const trendTarget = lastTarget + (lastTarget - prevTarget) * 0.35;
  const playerPull = weightedMemoryAverage(recent, (entry) => entry.playerGuess);
  const targetPlan = projectedTarget ?? lastTarget;
  let guess;

  if (bot.type === "Analyst") {
    guess = selfConsistentGuess * 0.72 + trendTarget * 0.28;
  } else if (bot.type === "Follower") {
    guess = selfConsistentGuess * 0.78 + (playerPull ?? targetPlan) * 0.22;
  } else if (bot.type === "Stubborn") {
    guess = selfConsistentGuess * 0.7 + bot.anchor * 0.3;
  } else if (bot.type === "Drifter") {
    const sample = projectedMemoryTarget(randomFrom(recent), currentModifier, currentOffset) ?? targetPlan;
    guess = selfConsistentGuess * 0.66 + sample * 0.34;
  } else if (bot.type === "Caller") {
    guess = selfConsistentGuess * 0.74 + targetPlan * 0.26;
  } else {
    guess = selfConsistentGuess * 0.76 + bot.anchor * 0.24;
  }

  const smartNoise = Math.max(2, Math.ceil(bot.noise * 0.45));
  const pressured = bot.hp <= bot.maxHp * 0.35;
  guess += randomInt(-smartNoise, smartNoise);

  if (!pressured && Math.random() < bot.aggression * 0.14) {
    guess += randomFrom([-1, 1]) * randomInt(4, 10);
  }

  if (!pressured && Math.random() < bot.aggression * 0.025) {
    guess = selfConsistentGuess + randomFrom([-1, 1]) * randomInt(10, 18);
  }

  return Math.ceil(clamp(clampFixedWillGuess(bot, guess), 0, 100));
}

function clampFixedWillGuess(bot, guess) {
  if (!passiveStack("p107") || personalityType(bot) !== "Stubborn") return guess;
  const previousGuess = bot?.memory?.slice().reverse().find((entry) => Number.isFinite(entry?.ownGuess))?.ownGuess;
  if (!Number.isFinite(previousGuess)) return guess;
  return clamp(guess, previousGuess - 2, previousGuess + 2);
}

function planBotGuess(bot) {
  if (bot.isBoss) return planBossGuess(bot);

  const memory = bot.memory;
  const currentModifier = state.roundState?.targetModifier ?? currentTargetModifier();
  let guess;

  if (!memory.length) {
    guess = bot.anchor + randomInt(-12, 12);
  } else {
    const last = memory[memory.length - 1];
    const prev = memory[memory.length - 2] || last;
    const lastTarget = projectedMemoryTarget(last, currentModifier) ?? last.target;
    const prevTarget = projectedMemoryTarget(prev, currentModifier) ?? prev.target ?? lastTarget;
    const trend = lastTarget - prevTarget;
    const tablePull = Number.isFinite(last.tableAverage) ? last.tableAverage * currentModifier : lastTarget;

    if (bot.type === "Analyst") {
      guess = lastTarget + trend * 0.45 + randomInt(-bot.noise, bot.noise);
    } else if (bot.type === "Follower") {
      guess = last.playerGuess * 0.52 + lastTarget * 0.48 + randomInt(-bot.noise, bot.noise);
    } else if (bot.type === "Stubborn") {
      guess = bot.anchor * 0.72 + lastTarget * 0.28 + randomInt(-bot.noise, bot.noise);
    } else if (bot.type === "Drifter") {
      guess = lastTarget * 0.56 + tablePull * 0.44 + randomInt(-bot.noise * 2, bot.noise * 2);
    } else if (bot.type === "Caller") {
      guess = last.botAverage * 0.62 + lastTarget * 0.38 + randomInt(-bot.noise, bot.noise);
    } else {
      guess = bot.anchor * 0.42 + lastTarget * 0.58 + randomInt(-bot.noise, bot.noise);
    }

    if (bot.isBoss) guess = guess * 0.82 + lastTarget * 0.18;
  }

  if (Math.random() < bot.aggression * 0.62) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    guess += direction * randomInt(5, 16);
  }

  if (Math.random() < bot.aggression * 0.09) {
    guess = randomFrom([0, 100, randomInt(8, 22), randomInt(78, 92), 50 + randomInt(-12, 12)]);
  }

  return Math.ceil(clamp(clampFixedWillGuess(bot, guess), 0, 100));
}

function bossRevealAllowedBySeals() {
  return orderedPassiveEffectEntries("p61").length > 0;
}

function revealedDamnedCount() {
  return activeBots().filter((bot) => bot.revealedByPassive).length;
}

function canRevealBotGuess(bot, options = {}) {
  if (!bot || bot.hp <= 0 || bot.eliminated || botHasPassive(bot, "shield")) return false;
  if (bot.revealedByPassive) return true;
  if (revealedDamnedCount() >= MAX_REVEALED_DAMNED) return false;
  return options.allowBoss || !bot.isBoss || bossRevealAllowedBySeals();
}

function revealBotGuess(bot, source = "", entry = null, options = {}) {
  if (!canRevealBotGuess(bot, options)) return false;
  const wasRevealed = Boolean(bot.revealedByPassive);
  bot.revealedByPassive = true;
  state.roundState?.revealedBotIds?.add(bot.id);
  if (entry && !wasRevealed) markPassiveEntryTriggered(entry);
  if (source && !wasRevealed) addRoundEvent(`${source} revealed ${bot.name}'s guess.`);
  if (!wasRevealed) {
    orderedPassiveEffectEntries("p104").forEach((stubbornEntry) => {
      setBotPersonality(bot, "Stubborn", passiveName("p104", "Seal of Alloces"), { markEntry: stubbornEntry });
    });
  }
  return !wasRevealed;
}

function applyHighMemoryReveals() {
  const entries = orderedPassiveEffectEntries("p81");
  if (!entries.length) return;
  entries.forEach((entry) => {
    state.bots
      .filter((bot) => (bot.memory?.length || 0) > 16)
      .forEach((bot) => revealBotGuess(bot, passiveName("p81", "Seal of Buer"), entry));
  });
}

function applyGuessReveals() {
  if (state.stage !== "guess" || !state.roundState) return;
  const bossRevealAllowed = bossRevealAllowedBySeals();
  const amonEntries = orderedPassiveEffectEntries("p59");
  const revealableBots = state.bots.filter(
    (bot) =>
      (bossRevealAllowed || !bot.isBoss) &&
      bot.hp > 0 &&
      !bot.eliminated &&
      !botHasPassive(bot, "shield")
  );
  const desiredRevealCount = Math.min(revealableBots.length, MAX_REVEALED_DAMNED, 1 + amonEntries.length);
  const revealedCount = revealableBots.filter((bot) => bot.revealedByPassive).length;
  const hiddenBots = shuffled(revealableBots.filter((bot) => !bot.revealedByPassive));
  const newlyRevealed = hiddenBots.slice(0, Math.max(0, desiredRevealCount - revealedCount));
  newlyRevealed.forEach((bot) => {
    revealBotGuess(bot);
  });
  applyHighMemoryReveals();
  applyAmonRevealRewards(revealableBots.filter((bot) => bot.revealedByPassive), amonEntries);
}

function applyAmonRevealRewards(revealedBots, entries = orderedPassiveEffectEntries("p59")) {
  const round = state.roundState;
  if (!round || !entries.length || !revealedBots.length) return;
  entries.forEach((entry) => {
    let triggered = false;
    revealedBots.forEach((bot) => {
      const key = `${entry.sourceId || entry.id}:${bot.id}`;
      if (round.amonRewardKeys.has(key)) return;
      round.amonRewardKeys.add(key);
      const bounty = passiveEntryScaledValue(entry, 2);
      const bountyResult = changeBotSin(bot, bounty, "", { source: ITEMS.p59?.name || "Seal of Amon" });
      const memoryAdded = addBotMemory(bot, 2, "", { source: ITEMS.p59?.name || "Seal of Amon" });
      if (bountyResult.gained > 0 || memoryAdded > 0) triggered = true;
    });
    if (triggered) {
      markPassiveEntryTriggered(entry);
      round.roundEvents.push(`${ITEMS.p59?.name || "Seal of Amon"} rewarded revealed DAMNED with BOUNTY and MEMORY.`);
    }
  });
}

function applyRevealPoisonCounters() {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p61");
  if (!round || !entries.length) return;
  const targets = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated && bot.revealedByPassive);
  if (!targets.length) return;
  entries.forEach((entry) => {
    markPassiveEntryTriggered(entry);
    targets.forEach((bot) => {
      bot.poisonCounters = (bot.poisonCounters || 0) + 1;
    });
  });
  round.roundEvents.push(`Seal of Vepar added poison to ${targets.map((bot) => bot.name).join(", ")}.`);
}

function grantDevTemporaryArtifact(source) {
  const id = randomFrom(ACTIVE_IDS);
  if (!id) return null;
  const active = devTemporaryActiveCopy(id);
  state.player.actives.push(active);
  state.roundState?.devTemporaryActiveUids?.add(active.uid);
  normalizeActiveCarouselIndex();
  addRoundEvent(`${source} granted temporary ${active.name}.`);
  return active;
}

function clearDevTemporaryArtifacts() {
  const round = state.roundState;
  const temporaryUids = round?.devTemporaryActiveUids;
  if (!temporaryUids?.size) return;
  state.player.actives = state.player.actives.filter((item) => !item?.devTemporary && !temporaryUids.has(item?.uid));
  temporaryUids.clear();
  normalizeActiveCarouselIndex();
}

function devSealTargetDamned() {
  return activeBots().filter((bot) => !bot.immortal);
}

function applyDevSealsAtReveal() {
  const round = state.roundState;
  if (!round || round.devSealsRolled) return;
  round.devSealsRolled = true;
  const entries = orderedPassiveEffectEntries(Array.from(DEV_SEAL_IDS));
  if (!entries.length) return;

  entries.forEach((entry) => {
    const source = ITEMS[entry.id]?.name || "Dev Seal";
    if (Math.random() >= devSealEntryChance(entry)) return;
    markPassiveEntryTriggered(entry);

    if (entry.id === "p92") {
      const guess = Math.ceil(round.playerEffectiveGuess);
      if (!Number.isFinite(guess)) return;
      const before = round.target;
      const base = (round.tableAverage || 0) * (round.targetModifier || 0);
      round.targetOffset = guess - base;
      recalculateTarget();
      addRoundEvent(`${source} changed the TARGET from ${formatNumber(before)} to ${formatNumber(round.target)}.`);
      return;
    }

    if (entry.id === "p93") {
      let total = 0;
      devSealTargetDamned().forEach((bot) => {
        const bounty = botRegularBounty(bot);
        if (bounty <= 0) return;
        const result = changeBotSin(bot, bounty, "", { source });
        total += result.gained;
      });
      addRoundEvent(total > 0 ? `${source} doubled ${total} total BOUNTY.` : `${source} found no BOUNTY to double.`);
      return;
    }

    if (entry.id === "p94") {
      const granted = [];
      for (let count = 0; count < 5; count += 1) {
        const artifact = grantDevTemporaryArtifact(source);
        if (artifact) granted.push(artifact.name);
      }
      addRoundEvent(
        granted.length
          ? `${source} gave ${granted.length} temporary ARTIFACTS for this round.`
          : `${source} found no ARTIFACTS to grant.`
      );
      return;
    }

    if (entry.id === "p95") {
      const targets = devSealTargetDamned().filter((bot) => bot.revealedByPassive);
      let total = 0;
      targets.forEach((bot) => {
        const damage = Math.ceil(bot.hp * 0.5);
        total += queueEndOfRoundBotDamage(bot, damage, `${source} burned ${bot.name} for ${damage} damage.`, source);
      });
      addRoundEvent(total > 0 ? `${source} queued ${total} total damage to revealed DAMNED.` : `${source} found no revealed DAMNED.`);
      return;
    }

    if (entry.id === "p96") {
      let changed = 0;
      let vulnerable = 0;
      devSealTargetDamned().forEach((bot) => {
        if (personalityType(bot) === "Stubborn") {
          round.padmaVulnerableBotIds?.add(bot.id);
          vulnerable += 1;
          return;
        }
        if (setBotPersonality(bot, "Stubborn", source)) changed += 1;
      });
      addRoundEvent(`${source} made ${changed} personalities STUBBORN and marked ${vulnerable} already STUBBORN DAMNED for extra damage.`);
      return;
    }

    if (entry.id === "p97") {
      const targets = devSealTargetDamned();
      const memoryReferenceTargets = targets.filter((bot) => !bot.isBoss);
      const maxMemory = Math.max(0, ...(memoryReferenceTargets.length ? memoryReferenceTargets : targets).map((bot) => bot.memory?.length || 0));
      let memoryAdded = 0;
      let damage = 0;
      targets.forEach((bot) => {
        const originalMemory = bot.memory?.length || 0;
        memoryAdded += addBotMemory(bot, Math.max(0, maxMemory - originalMemory), "", { source });
        if (originalMemory > 0) {
          damage += queueEndOfRoundBotDamage(bot, originalMemory, `${source} dealt ${originalMemory} damage to ${bot.name}.`, source);
        }
      });
      addRoundEvent(`${source} used ${maxMemory} as the living MEMORY peak, added ${memoryAdded} MEMORY, and queued ${damage} total damage.`);
      return;
    }

    if (entry.id === "p110") {
      const targets = devSealTargetDamned();
      let memoryRemoved = 0;
      let bountyRemoved = 0;
      targets.forEach((bot) => {
        const memory = bot.memory?.length || 0;
        if (memory > 0) {
          memoryRemoved += memory;
          bot.memory = [];
        }
        const bounty = botRegularBounty(bot);
        if (bounty > 0) {
          const result = changeBotSin(bot, -bounty, "", {
            source,
            triggerLossDamage: false
          });
          bountyRemoved += result.lost;
        }
      });
      const damage = memoryRemoved + bountyRemoved;
      if (damage > 0) {
        queueEndOfRoundBotDamages(
          targets,
          damage,
          (bot, dealt) => `${source} dealt ${dealt} removed MEMORY and BOUNTY damage to ${bot.name}.`,
          source
        );
      }
      addRoundEvent(
        damage > 0
          ? `${source} removed ${memoryRemoved} MEMORY and ${bountyRemoved} BOUNTY, then queued ${damage} damage to every DAMNED.`
          : `${source} found no MEMORY or BOUNTY to remove.`
      );
    }
  });
}

function cloneRoundRevealSources(sources) {
  return (sources || []).map((entry) => ({ ...entry }));
}

function captureRoundRevealSnapshot() {
  const round = state.roundState;
  return {
    stage: state.stage,
    roundEventCount: round?.roundEvents?.length || 0,
    triggeredPassiveIds: Array.from(round?.triggeredPassiveIds || []),
    player: {
      hp: state.player.hp,
      credits: state.player.credits,
      lastDamage: state.playerLastDamage || 0,
      lastHeal: state.playerLastHeal || 0,
      lastCredits: state.playerLastCredits || 0,
      damageSources: cloneRoundRevealSources(state.playerDamageSources),
      healSources: cloneRoundRevealSources(state.playerHealSources),
      creditSources: cloneRoundRevealSources(state.playerCreditSources)
    },
    bots: state.bots.map((bot) => ({
      id: bot.id,
      hp: bot.hp,
      maxHp: bot.maxHp,
      eliminated: Boolean(bot.eliminated),
      damageTakenTotal: bot.damageTakenTotal || 0,
      lastDamage: bot.lastDamage || 0,
      lastHeal: bot.lastHeal || 0,
      lastSinDelta: bot.lastSinDelta || 0,
      lastMemoryDelta: bot.lastMemoryDelta || 0,
      damageSources: cloneRoundRevealSources(bot.damageSources),
      healSources: cloneRoundRevealSources(bot.healSources),
      sinSources: cloneRoundRevealSources(bot.sinSources),
      memorySources: cloneRoundRevealSources(bot.memorySources)
    }))
  };
}

function roundRevealAnimationActive() {
  return Boolean(state.roundRevealAnimation?.active);
}

function clearRoundRevealTimer() {
  if (!roundRevealTimer) return;
  clearTimeout(roundRevealTimer);
  roundRevealTimer = null;
}

function resetRoundRevealAnimation() {
  clearRoundRevealTimer();
  state.roundRevealAnimation = null;
}

function roundRevealSealName(id) {
  const entry = passiveEntry(id);
  return entry ? passiveDisplayName(entry) : ITEMS[id]?.name || "Seal";
}

function roundRevealEventMatchesSeal(id, event) {
  const text = normalizeGameText(event || "");
  const baseName = ITEMS[id]?.name || "";
  const displayName = roundRevealSealName(id);
  return Boolean((baseName && text.includes(baseName)) || (displayName && text.includes(displayName)));
}

function buildRoundRevealSequence(beforeSnapshot) {
  const round = state.roundState;
  if (!round) return [];
  const previousIds = new Set(beforeSnapshot?.triggeredPassiveIds || []);
  const finalEvents = (round.roundEvents || []).slice();
  const eventStart = beforeSnapshot?.roundEventCount || 0;
  return Array.from(round.triggeredPassiveIds || [])
    .filter((id) => PASSIVE_IDS.includes(id) && !previousIds.has(id))
    .map((id) => ({
      id,
      name: roundRevealSealName(id),
      events: finalEvents.slice(eventStart).filter((event) => roundRevealEventMatchesSeal(id, event))
    }));
}

function playRoundRevealStepSfx() {
  playArtifactSfx("a14");
}

function scheduleRoundRevealAnimation() {
  clearRoundRevealTimer();
  if (!roundRevealAnimationActive()) return;
  roundRevealTimer = setTimeout(advanceRoundRevealAnimation, 1000);
}

function startRoundRevealAnimation(beforeSnapshot) {
  const sequence = buildRoundRevealSequence(beforeSnapshot);
  if (!sequence.length) return false;
  clearRoundRevealTimer();
  state.roundRevealAnimation = {
    active: true,
    phase: "seal",
    stepIndex: 0,
    sequence,
    before: beforeSnapshot
  };
  playRoundRevealStepSfx();
  scheduleRoundRevealAnimation();
  return true;
}

function advanceRoundRevealAnimation() {
  const animation = state.roundRevealAnimation;
  if (!animation?.active) return;
  if (animation.phase === "seal") {
    animation.phase = "effect";
    playRoundRevealStepSfx();
    render();
    scheduleRoundRevealAnimation();
    return;
  }
  animation.stepIndex += 1;
  if (animation.stepIndex >= animation.sequence.length) {
    finishRoundRevealAnimation();
    return;
  }
  animation.phase = "seal";
  playRoundRevealStepSfx();
  render();
  scheduleRoundRevealAnimation();
}

function finishRoundRevealAnimation() {
  resetRoundRevealAnimation();
  render();
}

function submitGuess() {
  if (state.stage !== "guess" || state.gameOver) return;
  const input = document.querySelector("#guessInput");
  const rawGuess = (input?.value || "").trim();
  const submitted = Number(rawGuess);
  const maxGuess = playerGuessLimit();
  if (!rawGuess || !Number.isFinite(submitted) || submitted < 0 || submitted > maxGuess) {
    showInvalidGuessPopup();
    return;
  }

  playGuessSfx();
  const guess = Math.ceil(submitted);
  const round = state.roundState;
  round.playerSubmittedGuess = guess;
  round.playerEffectiveGuess = applyGuessMutation("Player", guess);

  state.bots.filter((bot) => !bot.eliminated).forEach((bot) => {
    round.botSubmittedGuesses.set(bot.id, bot.plannedGuess);
    round.botEffectiveGuesses.set(bot.id, applyGuessMutation(bot.name, bot.plannedGuess, bot));
  });
  applyFurcasLastTargetGuessSet();

  round.edgeGambitStacks = 0;

  recalculateTarget();
  applyDevSealsAtReveal();
  state.stage = "active";
  addLog(`Target revealed at ${formatNumber(round.target)}. CRITICAL integer: ${round.criticalInteger}.`);
  render();
}

function applyGuessMutation(name, guess, bot = null) {
  if (bot) return guess;
  return applyCorruptionGuessMutation(guess);
}

function botTargetWeight(bot) {
  return bot?.finalKey === "jesus" ? 3 : 1;
}

function recalculateTarget() {
  const round = state.roundState;
  let weightedTotal = 0;
  let totalWeight = 0;

  const addWeightedGuess = (guess, weight = 1) => {
    if (!Number.isFinite(guess) || weight <= 0) return;
    weightedTotal += guess * weight;
    totalWeight += weight;
  };

  const sinWeight = wealthWeightBonus();
  const playerWeight = 1 + sinWeight;
  addWeightedGuess(round.playerEffectiveGuess, playerWeight);

  state.bots.forEach((bot) => {
    const guess = round.botEffectiveGuesses.get(bot.id);
    if (!round.removedBotIds.has(bot.id)) {
      addWeightedGuess(guess, botTargetWeight(bot));
    }
  });

  round.extraAverageGuesses.forEach((entry) => {
    addWeightedGuess(entry.guess);
  });

  round.tableAverage = totalWeight ? weightedTotal / totalWeight : 0;
  const rawTarget = round.tableAverage * round.targetModifier + round.targetOffset;
  round.target = Math.ceil(Math.min(200, rawTarget));
  round.criticalInteger = round.target;
}

function readyRound() {
  if (state.stage !== "active" || !state.roundState || state.roundState.penaltiesApplied) return;
  if (state.pendingActive) {
    addLog("Finish the Artifact target first.");
    render();
    return;
  }
  const beforeReveal = captureRoundRevealSnapshot();
  playReadySfx();
  applyPenalties();
  if (startRoundRevealAnimation(beforeReveal)) {
    render();
    return;
  }
  render();
}

function performMainAction() {
  if (roundRevealAnimationActive()) {
    finishRoundRevealAnimation();
    return;
  }
  if (state.stage === "guess") submitGuess();
  else if (state.stage === "active") readyRound();
  else if (state.stage === "summary") {
    playNextRoundSfx();
    advanceAfterSummary();
  } else if (state.stage === "ended") {
    startGame();
  }
}

function shouldUseArcadeEnterShortcut(event) {
  if (event.key !== "Enter" || event.defaultPrevented) return false;
  if (state.mode !== "arcade" || state.pauseOpen) return false;
  if (!["guess", "active", "summary", "ended"].includes(state.stage)) return false;
  const target = event.target;
  if (target?.closest?.("button, a, select, textarea, [contenteditable='true']")) return false;
  if (target?.tagName === "INPUT" && target.id !== "guessInput") return false;
  const mainAction = document.querySelector("#mainAction");
  return Boolean(mainAction && !mainAction.disabled);
}

function installArcadeEnterShortcut() {
  document.addEventListener("keydown", (event) => {
    if (!shouldUseArcadeEnterShortcut(event)) return;
    event.preventDefault();
    document.querySelector("#mainAction")?.click();
  });
}

