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
  collectionNoteSerafimEntry(bot, stolen);
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
  return {
    id: state.nextBotId++,
    name: spec.name,
    flag: "🏴",
    country: "Final Judgment",
    type: "Final Boss",
    color: spec.color,
    image: spec.image,
    anchor: 50,
    aggression: 0,
    noise: 0,
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
  state.nextBossKillInterval = null;
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
  resetBossKillInterval();
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
  // bosses have no personality: they play the optimal guess (planBossGuess)
  const archetype = isBoss
    ? null
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
    anchor: isBoss ? 50 : clamp(inherited?.anchor ?? archetype.anchor + randomInt(-8, 8), 0, 100),
    aggression: isBoss ? 0 : inherited?.aggression ?? archetype.aggression,
    noise: isBoss ? 0 : inherited?.noise ?? archetype.noise,
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
  target.pyrosGifted = true;
  if (state.roundState) {
    state.roundState.pyrosGiftGranted = true;
    state.roundState.roundEvents.push(`${pyrosSource.name} gave ${target.name} ${botPassiveKeyName(key)}.`);
  }
}

function rerollShop() {
  collectionNoteShopReroll();
  if (shopDisabledBySatan()) {
    state.shop = [];
    return;
  }
  const eliteBoosted = eliteRerollBoostCount();
  state.eliteBoostedNextReroll = 0;
  // Seal of the Holy Spirit: "ELITE offer" makes this SEAL an ELITE upgrade when you own one that can take it
  const forceElite = Boolean(state.trinityEliteNextShop);
  state.trinityEliteNextShop = false;
  state.shop = [drawPassiveShopItem(eliteBoosted, forceElite), drawActiveShopItem(), drawActiveShopItem()];
  if (eliteBoosted) addLog(`${activeName("a23")} marked this Seal reroll. ELITE chance is ${Math.round(eliteShopChance(eliteBoosted) * 100)}%.`);
  if (forceElite) addLog(`${ITEMS.p133.name} made this SEAL offer ELITE.`);
  // Seal of the Holy Spirit: "Trinity" adds the missing Trinity SEALS as extra offers
  const trinityOffers = (state.trinityShopSealsNextShop || []).filter((id) => TRINITY_SEAL_IDS.has(id) && !directPassiveStack(id));
  state.trinityShopSealsNextShop = [];
  trinityOffers.forEach((id) => state.shop.push({ item: itemCopy(id), sold: false, bonus: true }));
  if (trinityOffers.length) addLog(`${ITEMS.p133.name} brought ${trinityOffers.map((id) => ITEMS[id].name).join(" and ")} to the offerings.`);
  syncShopSlotCount();
}

// extra offers (bonus: true) sit after the regular slots and are not counted in shopSlotCount()
function syncShopSlotCount() {
  if (shopDisabledBySatan()) {
    state.shop = [];
    return;
  }
  const count = shopSlotCount();
  const regular = state.shop.filter((slot) => !slot?.bonus);
  const bonus = state.shop.filter((slot) => slot?.bonus);
  while (regular.length < count) regular.push(drawActiveShopItem());
  state.shop = [...regular.slice(0, count), ...bonus];
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

function drawPassiveShopItem(eliteBoosted = false, forceElite = false) {
  // locked SEALS (see SEAL_UNLOCKS in 09-collection.js) never show up until unlocked
  const passivePool = PASSIVE_IDS.filter((id) => !REMOVED_PASSIVE_IDS.has(id) && !isSealLocked(id));
  const availablePool = passivePool.filter((id) => !isNonUpgradableSeal(id) || directPassiveStack(id) === 0);
  const ownedPassives = availablePool.filter((id) => directPassiveStack(id) > 0 && !isNonUpgradableSeal(id));
  const freshPassives = availablePool.filter((id) => directPassiveStack(id) === 0);
  const eliteChance = eliteShopChance(eliteBoosted);
  const wantsElite = ownedPassives.length > 0 && (forceElite || Math.random() < eliteChance);
  const choices = wantsElite ? ownedPassives : freshPassives.length ? freshPassives : ownedPassives;
  if (!choices.length) return drawShopItem(availablePool.length ? availablePool : passivePool.filter((id) => !isNonUpgradableSeal(id)));
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
  collectionNoteSpend(cost);
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
  const multiplied = Math.ceil(base * multiplier);
  // Seal of the Son ("double SIN"): the SIN from every source but sales comes twice
  const sonBonus = Math.ceil(trinitySonSinBonus(normalizedEntries) * multiplier);
  const gained = multiplied + sonBonus;
  state.player.credits += gained;
  if (gained > 0) {
    if (state.roundState) state.roundState.earnedSinThisRound = (state.roundState.earnedSinThisRound || 0) + gained;
    state.playerLastCredits = (state.playerLastCredits || 0) + gained;
    normalizedEntries.forEach((entry) => recordPlayerCreditSource(entry.amount, entry.source || "SIN"));
    const multiplierBonus = Math.max(0, multiplied - base);
    if (multiplierBonus > 0) {
      recordPlayerCreditSource(multiplierBonus, ITEMS.a10?.name || "Funeral Coin");
    }
    if (sonBonus > 0) {
      recordPlayerCreditSource(sonBonus, ITEMS.p132.name);
      markPassiveEntryTriggered(trinityEntry("p132"));
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

function distributeSinAmongHighest(amount, targets, entry) {
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
    const result = changeBotSin(bot, gift, `Seal of Agares gave ${bot.name} +${gift} SIN.`, {
      source: "Seal of Agares"
    });
    const damage = result.gained * agaresDamagePerSin(entry);
    if (damage > 0 && !bot.eliminated) {
      damageBot(
        bot,
        damage,
        `Seal of Agares dealt ${damage} damage to ${bot.name} for gaining ${result.gained} BOUNTY from its effect.`,
        "Seal of Agares"
      );
    }
    distributed += result.gained;
  });
  return distributed;
}

function applyAgaresEarnedSinSpread() {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p50");
  if (!round || round.agaresSpreadApplied || !entries.length) return;
  const earned = Math.max(0, Math.ceil(round.earnedSinThisRound || 0));
  const amount = Math.ceil(earned * 0.2);
  const targets = activeBots().filter((bot) => !bot.immortal);
  if (earned <= 0 || amount <= 0 || !targets.length) return;
  round.agaresSpreadApplied = true;
  entries.forEach((entry) => {
    markPassiveEntryTriggered(entry);
    const distributed = distributeSinAmongHighest(amount, targets, entry);
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
  // a restart in the middle of the first-launch story ends the story
  if (!options.intro) introAbort();
  resetRoundRevealAnimation();
  resumeSoundtrack();
  pvpClearAutoTimer();
  pvpStopHostPolling();
  const restartingSlotId = options.slotId || (state.mode === "arcade" ? state.currentRunSlotId : null) || createArcadeRunSlotId();
  state.mode = "arcade";
  state.currentRunSlotId = restartingSlotId;
  state.runStartedAt = Date.now();
  snapshotRecordsAtRunStart();
  state.satanVictoryDue = false;
  state.satanVictoryPlayed = false;
  state.pauseOpen = false;
  state.pauseDevOpen = false;
  state.devUnlockAllSeals = false;
  resetCollectionRun();
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
  state.pendingSelfStackingPentakillRound = 0;
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
  resetBossKillInterval();
  state.eliteBoostedNextReroll = 0;
  state.paleHorseBoostArmed = false;
  state.freeRerolls = 0;
  state.freeRerollsUntilRound = 0;
  state.trinityRevealsNextRound = 0;
  state.trinityEliteNextShop = false;
  state.trinityShopSealsNextShop = [];
  state.critMomentumBonus = 0;
  state.exactGuessCritCharged = false;
  state.previousRoundEliminationsForMartyrs = 0;
  resetBotsForRun();
  rerollShop();
  beginRound();
  addLog("Round 1 begins. The table continues until you fall.");
  render();
}

function beginRound() {
  beginRunRoundStats();
  collectionBeginRound();
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
    playerCorruption: null,
    botSubmittedGuesses: new Map(),
    botEffectiveGuesses: new Map(),
    targetModifier: twinModifier ?? (threonMystery ? randomInt(6, 10) / 10 : currentTargetModifier()),
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
    sallosSpreadDone: false,
    eliminationCreditRecords: [],
    pentakillAwarded: false,
    pentakillPopup: false,
    revealedBotIds: new Set(),
    pyrosRevealsDone: 0,
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
    pyrosGiftGranted: false,
    devSealsRolled: false,
    devSealsAfterReadyRolled: false,
    targetBeforeRevealSeals: null,
    devTemporaryActiveUids: new Set(),
    padmaVulnerableBotIds: new Set(),
    paleHorseDamageBoostActive,
    previousRoundEliminationsForMartyrs: state.previousRoundEliminationsForMartyrs || 0,
    selfStackingConditionCounts: Object.fromEntries(Object.values(SELF_STACKING_SEAL_SPECS).map((spec) => [spec.key, 0])),
    selfStackingCriticalDamage: 0,
    pendingEndOfRoundBotDamages: [],
    resolvingEndOfRoundPassives: false,
    triggeredPassiveIds: new Set(),
    // SEALS already shown in a trigger animation this round (the rest wait for READY)
    animatedPassiveIds: new Set(),
    // DAMNED alive when the round began: if one falls before READY, its KO is shown after READY
    aliveIdsAtStart: new Set(state.bots.filter((bot) => !bot.eliminated && bot.hp > 0).map((bot) => bot.id)),
    penaltiesApplied: false,
    criticalHitKeys: new Set(),
    roundEvents: []
  };

  state.bots.forEach((bot) => {
    if (bot.eliminated) return;
    if (!Number.isFinite(bot.spawnRound)) bot.spawnRound = state.round;
    trimBotMemoryToLimit(bot);
    bot.fresh = bot.memory.length === 0;
    bot.lastDamage = 0;
    bot.lastHeal = 0;
    bot.lastSinDelta = 0;
    bot.damageSources = [];
    bot.healSources = [];
    bot.sinSources = [];
    bot.memoryLossSources = [];
    bot.personalityChanges = [];
    bot.deathCause = null;
    bot.deathNotice = null;
    bot.markedByPlayer = false;
    bot.diffMarkedByPlayer = false;
    bot.revealedByPassive = false;
    bot.revealStacks = 0;
    bot.memoryOverflow = 0;
  });

  syncBipolarBots();
  enforceTwinTemperPersonalities();
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
  applyTrinityPendingReveals();
  applyStartOfRoundPassives();
  applyGuessReveals();
  ensureSitriHost();
  applyZilonBossBounty();
}

// Seal of Zilon: a share of every BOSS's BOSS BOUNTY (40%, ELITE +5% each level) becomes regular BOUNTY on that
// BOSS; the rest is dealt out one SIN at a time to random other DAMNED. Runs at the start of every round and only
// moves BOSS BOUNTY that has not been converted yet (bossBountyConverted).
function applyZilonBossBounty() {
  const entries = orderedPassiveEffectEntries("p121");
  if (!state.roundState || !entries.length) return;
  const name = ITEMS.p121.name;
  entries.forEach((entry) => {
    const percent = Math.min(100, zilonConversionPercent(entry));
    activeBots()
      .filter((bot) => bot.isBoss && !bot.immortal)
      .forEach((boss) => {
        const available = botBossBounty(boss);
        if (available <= 0) return;
        const converted = Math.floor((available * percent) / 100);
        const rest = available - converted;
        boss.bossBountyConverted = Math.max(0, Math.ceil(boss.bossBountyConverted || 0)) + available;
        markPassiveEntryTriggered(entry);
        if (converted > 0) changeBotSin(boss, converted, "", { source: name });
        const others = activeBots().filter((bot) => bot.id !== boss.id && !bot.immortal);
        const gains = new Map();
        for (let index = 0; index < rest; index += 1) {
          const target = others.length ? randomFrom(others) : boss;
          gains.set(target.id, (gains.get(target.id) || 0) + 1);
        }
        gains.forEach((amount, id) => {
          const target = state.bots.find((bot) => bot.id === id);
          if (target) changeBotSin(target, amount, "", { source: name });
        });
        addRoundEvent(
          `${name} turned ${converted} of ${boss.name}'s ${available} BOSS BOUNTY into BOUNTY and spread ${rest} among the other DAMNED.`
        );
      });
  });
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

/* ---------- Trinity SEALS: Father, Son, Holy Spirit ----------
   Each one casts one of its effects at random when you press READY, like any other SEAL, and its trigger
   animation shows it. The roll is kept in state.roundState.trinity for the rest of the round. */
const TRINITY_FATHER_BLESSINGS = {
  percent: { label: "Every DAMNED takes its TARGET difference as % of max HEALTH", short: "% TARGET damage" },
  strike: { label: "A random DAMNED takes 20% max-HEALTH damage at end of round", short: "20% strike" },
  double: { label: "You deal double damage this round", short: "Double damage" }
};
const TRINITY_SON_BLESSINGS = {
  doubleSin: { label: "Double SIN from every source this round", short: "Double SIN" },
  sin: { label: "+8 SIN", short: "+8 SIN" },
  rerolls: { label: "4 free rerolls until the end of next round", short: "4 free rerolls" }
};
// the Holy Spirit's ten effects (one is cast at random)
const TRINITY_SPIRIT_OUTCOMES = [
  { key: "memory", label: "+5 MEMORY to every DAMNED" },
  { key: "bounty", label: "Double the BOUNTY of 2 random DAMNED" },
  { key: "reveal", label: "Reveal 4 DAMNED guesses next round" },
  { key: "artifacts", label: "3 copies of one ARTIFACT" },
  { key: "critical", label: "Your guess is CRITICAL this round" },
  { key: "stubborn", label: "4 DAMNED turn STUBBORN" },
  { key: "elite", label: "The next SEAL offer is ELITE" },
  { key: "eliminate", label: "A random DAMNED is eliminated" },
  { key: "shield", label: "You take no TARGET-difference damage this round" },
  { key: "trinity", label: "50% chance the missing Trinity SEALS appear in the next offerings" }
];

function trinityRound() {
  return state.roundState?.trinity || null;
}

// this round's blessing of a Trinity SEAL, or null when it is not owned or is suppressed
function trinityFatherBlessing() {
  const key = trinityRound()?.father;
  return key && trinityEntry("p131") ? key : null;
}

function trinitySonBlessing() {
  const key = trinityRound()?.son;
  return key && trinityEntry("p132") ? key : null;
}

function trinitySpiritOutcome() {
  const key = trinityRound()?.spirit;
  return key && trinityEntry("p133") ? key : null;
}

function trinitySpiritOutcomeInfo(key) {
  return TRINITY_SPIRIT_OUTCOMES.find((outcome) => outcome.key === key) || null;
}

// the DAMNED a Trinity SEAL may pick at random: living, not immortal, optionally not a BOSS
function trinityTargets({ bosses = true } = {}) {
  return activeBots().filter((bot) => !bot.immortal && (bosses || !bot.isBoss));
}

// called by applyPenalties when you press READY, before any damage is worked out
function applyTrinityAtReady() {
  const round = state.roundState;
  if (!round) return;
  round.trinity = { father: null, son: null, spirit: null, spiritHealed: false };
  const fatherEntry = trinityEntry("p131");
  if (fatherEntry) {
    round.trinity.father = randomFrom(Object.keys(TRINITY_FATHER_BLESSINGS));
    markPassiveEntryTriggered(fatherEntry);
    addRoundEvent(`${ITEMS.p131.name}: ${TRINITY_FATHER_BLESSINGS[round.trinity.father].label}.`);
  }
  const sonEntry = trinityEntry("p132");
  if (sonEntry) {
    round.trinity.son = randomFrom(Object.keys(TRINITY_SON_BLESSINGS));
    markPassiveEntryTriggered(sonEntry);
    applyTrinitySonBlessing(round.trinity.son);
  }
  const spiritEntry = trinityEntry("p133");
  if (spiritEntry) {
    round.trinity.spirit = randomFrom(TRINITY_SPIRIT_OUTCOMES).key;
    markPassiveEntryTriggered(spiritEntry);
    applyTrinitySpiritOutcome(round.trinity.spirit);
  }
}

// Seal of the Holy Spirit, "Reveal 4": the guesses are revealed at the start of the next round
function applyTrinityPendingReveals() {
  const count = Math.max(0, Math.ceil(state.trinityRevealsNextRound || 0));
  state.trinityRevealsNextRound = 0;
  if (!count || state.stage !== "guess" || !state.roundState) return;
  const name = ITEMS.p133.name;
  let revealed = 0;
  shuffled(activeBots().filter((bot) => !bot.revealedByPassive && canRevealBotGuess(bot))).forEach((bot) => {
    if (revealed < count && revealBotGuess(bot, name)) revealed += 1;
  });
}

function applyTrinitySonBlessing(key) {
  const name = ITEMS.p132.name;
  if (key === "doubleSin") {
    addRoundEvent(`${name}: double SIN from every source this round.`);
    return;
  }
  if (key === "sin") {
    const gained = gainCredits(8, true, name);
    addRoundEvent(`${name} paid ${gained} SIN.`);
    return;
  }
  if (key === "rerolls") {
    state.freeRerolls = Math.max(0, Math.ceil(state.freeRerolls || 0)) + 4;
    state.freeRerollsUntilRound = state.round + 1;
    addRoundEvent(`${name} gave you 4 free rerolls.`);
  }
}

// Seal of the Son, "double SIN" blessing: every SIN you gain this round (sales aside) is doubled
function trinitySonSinBonus(entries) {
  if (trinitySonBlessing() !== "doubleSin") return 0;
  return entries
    .filter((entry) => !String(entry.source || "").startsWith("Sold "))
    .reduce((sum, entry) => sum + Math.max(0, entry.amount || 0), 0);
}

function applyTrinitySpiritOutcome(key) {
  const round = state.roundState;
  const name = ITEMS.p133.name;
  if (key === "memory") {
    const targets = activeBots();
    targets.forEach((bot) => addBotMemory(bot, 5, "", { source: name }));
    addRoundEvent(`${name} gave every DAMNED +5 MEMORY.`);
    return;
  }
  if (key === "bounty") {
    const targets = shuffled(trinityTargets().filter((bot) => Number.isFinite(botSin(bot)) && botSin(bot) > 0)).slice(0, 2);
    targets.forEach((bot) => changeBotSin(bot, botSin(bot), `${name} doubled ${bot.name}'s BOUNTY.`, { source: name }));
    if (!targets.length) addRoundEvent(`${name} found no BOUNTY to double.`);
    return;
  }
  if (key === "reveal") {
    state.trinityRevealsNextRound = 4;
    addRoundEvent(`${name}: 4 DAMNED guesses will be revealed next round.`);
    return;
  }
  if (key === "artifacts") {
    const id = randomFrom(ACTIVE_IDS);
    const room = Math.max(0, activeInventoryLimit() - state.player.actives.length);
    const count = Math.min(3, room);
    for (let copy = 0; copy < count; copy += 1) state.player.actives.push(freeActiveCopy(id));
    if (count) state.activeCarouselIndex = state.player.actives.length - 1;
    addRoundEvent(
      count
        ? `${name} gave you ${count} ${ITEMS[id].name}${count === 1 ? "" : " copies"}.`
        : `${name} offered ${ITEMS[id].name}, but your ARTIFACTS are full.`
    );
    return;
  }
  if (key === "critical") {
    addRoundEvent(`${name}: your guess is CRITICAL this round.`);
    return;
  }
  if (key === "stubborn") {
    const targets = shuffled(trinityTargets({ bosses: false }).filter((bot) => !hasPersonality(bot, "Stubborn"))).slice(0, 4);
    targets.forEach((bot) => setBotPersonality(bot, "Stubborn", name));
    if (!targets.length) addRoundEvent(`${name} found no DAMNED to make STUBBORN.`);
    return;
  }
  if (key === "elite") {
    state.trinityEliteNextShop = true;
    addRoundEvent(`${name}: the next SEAL offer will be ELITE.`);
    return;
  }
  if (key === "eliminate") {
    const pool = trinityTargets({ bosses: false });
    const target = pool.length ? randomFrom(pool) : null;
    if (!target) {
      addRoundEvent(`${name} found no DAMNED to eliminate.`);
      return;
    }
    const hp = Math.max(0, Math.ceil(target.hp || 0));
    target.lastDamage = (target.lastDamage || 0) + hp;
    recordBotDamageSource(target, hp, name);
    target.hp = 0;
    target.deathCause = "trinity";
    target.deathNotice = "TAKEN";
    addRoundEvent(`${name} took ${target.name}.`);
    resolveEliminatedBots([target]);
    return;
  }
  if (key === "shield") {
    addRoundEvent(`${name}: you take no TARGET-difference damage this round.`);
    return;
  }
  if (key === "trinity") {
    const missing = missingTrinitySealIds();
    if (!missing.length) {
      // with all three Trinity SEALS it heals 3 HEALTH instead, at end of round (after the round's damage)
      round.trinity.spiritHealed = true;
      return;
    }
    if (Math.random() < 0.5) {
      state.trinityShopSealsNextShop = missing.slice();
      addRoundEvent(`${name}: ${missing.map((id) => ITEMS[id].name).join(" and ")} will appear in the next offerings.`);
    } else {
      addRoundEvent(`${name}: the other Trinity SEALS did not answer this time.`);
    }
  }
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

// Bosses have no personality. They play the best reply to what the table is likely to do:
// estimate the other players' weighted average from the rounds they remember (or a level-1
// guess when they remember nothing), then pick the whole number closest to the TARGET their
// own guess would produce. No noise, no bluffing.
function bossTargetFor(guess, othersSum, othersWeight, ownWeight, modifier, offset) {
  const total = othersWeight + ownWeight;
  if (total <= 0) return guess;
  return Math.ceil(Math.min(200, ((othersSum + guess * ownWeight) / total) * modifier + offset));
}

function bestBossGuess(othersAverage, othersWeight, ownWeight, modifier, offset) {
  const othersSum = othersAverage * othersWeight;
  const total = othersWeight + ownWeight;
  const denominator = 1 - (modifier * ownWeight) / total;
  const solved = Math.abs(denominator) > 0.05 ? ((modifier * othersSum) / total + offset) / denominator : othersAverage * modifier + offset;
  let best = clamp(Math.round(solved), 0, 100);
  let bestMiss = Infinity;
  for (let guess = Math.max(0, best - 6); guess <= Math.min(100, best + 6); guess += 1) {
    const miss = Math.abs(guess - bossTargetFor(guess, othersSum, othersWeight, ownWeight, modifier, offset));
    if (miss < bestMiss || (miss === bestMiss && Math.abs(guess - solved) < Math.abs(best - solved))) {
      best = guess;
      bestMiss = miss;
    }
  }
  return best;
}

function planBossGuess(bot) {
  const memory = bot.memory || [];
  const modifier = state.roundState?.targetModifier ?? currentTargetModifier();
  const offset = state.roundState?.targetOffset ?? 0;
  const ownWeight = botTargetWeight(bot);
  const playerWeight = 1 + wealthWeightBonus();
  const othersWeight =
    playerWeight +
    activeBots()
      .filter((other) => other.id !== bot.id)
      .reduce((sum, other) => sum + botTargetWeight(other), 0);
  const participantWeight = othersWeight + ownWeight;
  const recent = memory.slice(-Math.min(6, memory.length));
  const remembered = weightedMemoryAverage(recent, (entry) => {
    const rawAverage = memoryRawAverage(entry);
    if (!Number.isFinite(rawAverage)) return null;
    if (Number.isFinite(entry.ownGuess) && participantWeight > ownWeight) {
      return (rawAverage * participantWeight - entry.ownGuess * ownWeight) / (participantWeight - ownWeight);
    }
    return rawAverage;
  });
  // nothing remembered: assume the table plays one step of reasoning (50 x modifier)
  const othersAverage = clamp(remembered ?? 50 * clamp(modifier, 0.2, 1.5), 0, 100);
  return clampFixedWillGuess(bot, bestBossGuess(othersAverage, othersWeight, ownWeight, modifier, offset));
}

function clampFixedWillGuess(bot, guess) {
  if (!passiveStack("p107") || !hasPersonality(bot, "Stubborn")) return guess;
  const previousGuess = bot?.memory?.slice().reverse().find((entry) => Number.isFinite(entry?.ownGuess))?.ownGuess;
  if (!Number.isFinite(previousGuess)) return guess;
  return clamp(guess, previousGuess - 2, previousGuess + 2);
}

function planBotGuess(bot) {
  if (bot.isBoss) return planBossGuess(bot);
  // Seal of Padma: a bipolar DAMNED guesses the average of what both of its personalities would guess
  const personas = [{ type: bot.type, anchor: bot.anchor, aggression: bot.aggression, noise: bot.noise }];
  if (padmaActive() && bot.type2) {
    personas.push({
      type: bot.type2,
      anchor: bot.anchor2 ?? bot.anchor,
      aggression: bot.aggression2 ?? bot.aggression,
      noise: bot.noise2 ?? bot.noise
    });
  }
  const guesses = personas.map((persona) => planPersonaGuess(bot, persona));
  const guess = guesses.reduce((sum, value) => sum + value, 0) / guesses.length;
  return Math.ceil(clamp(clampFixedWillGuess(bot, guess), 0, 100));
}

// one personality's guess (before the STUBBORN clamp and rounding)
function planPersonaGuess(bot, persona) {
  const memory = bot.memory;
  const currentModifier = state.roundState?.targetModifier ?? currentTargetModifier();
  let guess;

  if (!memory.length) {
    guess = persona.anchor + randomInt(-12, 12);
  } else {
    const last = memory[memory.length - 1];
    const prev = memory[memory.length - 2] || last;
    const lastTarget = projectedMemoryTarget(last, currentModifier) ?? last.target;
    const prevTarget = projectedMemoryTarget(prev, currentModifier) ?? prev.target ?? lastTarget;
    const trend = lastTarget - prevTarget;
    const tablePull = Number.isFinite(last.tableAverage) ? last.tableAverage * currentModifier : lastTarget;

    if (persona.type === "Analyst") {
      guess = lastTarget + trend * 0.45 + randomInt(-persona.noise, persona.noise);
    } else if (persona.type === "Follower") {
      guess = last.playerGuess * 0.52 + lastTarget * 0.48 + randomInt(-persona.noise, persona.noise);
    } else if (persona.type === "Stubborn") {
      guess = persona.anchor * 0.72 + lastTarget * 0.28 + randomInt(-persona.noise, persona.noise);
    } else if (persona.type === "Drifter") {
      guess = lastTarget * 0.56 + tablePull * 0.44 + randomInt(-persona.noise * 2, persona.noise * 2);
    } else if (persona.type === "Caller") {
      guess = last.botAverage * 0.62 + lastTarget * 0.38 + randomInt(-persona.noise, persona.noise);
    } else {
      guess = persona.anchor * 0.42 + lastTarget * 0.58 + randomInt(-persona.noise, persona.noise);
    }

    if (bot.isBoss) guess = guess * 0.82 + lastTarget * 0.18;
  }

  if (Math.random() < persona.aggression * 0.62) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    guess += direction * randomInt(5, 16);
  }

  if (Math.random() < persona.aggression * 0.09) {
    guess = randomFrom([0, 100, randomInt(8, 22), randomInt(78, 92), 50 + randomInt(-12, 12)]);
  }

  return guess;
}

function bossRevealAllowedBySeals() {
  return orderedPassiveEffectEntries("p129").length > 0;
}

function revealedDamnedCount() {
  return activeBots().filter((bot) => bot.revealedByPassive).length;
}

// Seal of Pyros: DAMNED can be revealed more than once a round; every reveal adds a reveal stack
function pyrosActive() {
  return Boolean(passiveStack("p123"));
}

function revealStacks(bot) {
  return bot?.revealedByPassive ? Math.max(1, Math.ceil(bot.revealStacks || 1)) : 0;
}

// how many times effects that target revealed DAMNED affect this DAMNED (one per reveal stack with Pyros)
function revealMultiplicity(bot) {
  if (!bot?.revealedByPassive) return 0;
  return pyrosActive() ? revealStacks(bot) : 1;
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
  const stacked = wasRevealed && pyrosActive();
  bot.revealedByPassive = true;
  bot.revealStacks = wasRevealed ? Math.max(1, Math.ceil(bot.revealStacks || 1)) + (stacked ? 1 : 0) : 1;
  state.roundState?.revealedBotIds?.add(bot.id);
  if (entry && (!wasRevealed || stacked)) markPassiveEntryTriggered(entry);
  // Seal of Gusion: every time a BOSS is revealed the revealed DAMNED are hit at end of round
  if (bot.isBoss && (!wasRevealed || stacked) && state.roundState && passiveStack("p129")) {
    state.roundState.bossRevealEvents = Math.max(0, Math.ceil(state.roundState.bossRevealEvents || 0)) + 1;
  }
  if (source && !wasRevealed) addRoundEvent(`${source} revealed ${bot.name}'s guess.`);
  if (source && stacked) addRoundEvent(`${source} revealed ${bot.name}'s guess again (x${bot.revealStacks}).`);
  if (!wasRevealed) {
    orderedPassiveEffectEntries("p104").forEach((stubbornEntry) => {
      setBotPersonality(bot, "Stubborn", passiveName("p104", "Seal of Alloces"), { markEntry: stubbornEntry });
    });
  }
  return !wasRevealed || stacked;
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
  const extraReveals = orderedPassiveEffectEntries(["p59", "p61", "p64", "p65", "p75", "p95", "p102"]).length;
  const revealableBots = state.bots.filter(
    (bot) =>
      (bossRevealAllowed || !bot.isBoss) &&
      bot.hp > 0 &&
      !bot.eliminated &&
      !botHasPassive(bot, "shield")
  );
  const desiredRevealCount = Math.min(revealableBots.length, MAX_REVEALED_DAMNED, 1 + extraReveals);
  const revealedCount = revealableBots.filter((bot) => bot.revealedByPassive).length;
  const hiddenBots = shuffled(revealableBots.filter((bot) => !bot.revealedByPassive));
  const newlyRevealed = hiddenBots.slice(0, Math.max(0, desiredRevealCount - revealedCount));
  newlyRevealed.forEach((bot) => {
    revealBotGuess(bot);
  });
  applyPyrosStartReveals(revealableBots);
  applyHighMemoryReveals();
  applyAmonRevealRewards(revealableBots.filter((bot) => bot.revealedByPassive), amonEntries);
}

// Seal of Pyros: at the start of every round it reveals one DAMNED (ELITE: +1 each level), chosen from ALL
// DAMNED, including ones that are already revealed (they gain a reveal stack). Done once per round.
function applyPyrosStartReveals(revealableBots) {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p123");
  if (!round || !entries.length) return;
  const owed = entries.reduce((sum, entry) => sum + 1 + passiveEntryEliteLevels(entry), 0);
  const done = Math.max(0, Math.ceil(round.pyrosRevealsDone || 0));
  round.pyrosRevealsDone = Math.max(done, owed);
  for (let index = done; index < owed; index += 1) {
    const candidates = revealableBots.filter((bot) => canRevealBotGuess(bot));
    if (!candidates.length) return;
    revealBotGuess(randomFrom(candidates), passiveName("p123", "Seal of Pyros"), entries[0]);
  }
}

function applyAmonRevealRewards(revealedBots, entries = orderedPassiveEffectEntries("p59")) {
  const round = state.roundState;
  if (!round || !entries.length || !revealedBots.length) return;
  entries.forEach((entry) => {
    let triggered = false;
    revealedBots.forEach((bot) => {
      // one reward per reveal stack (Seal of Pyros)
      for (let stack = 1; stack <= revealMultiplicity(bot); stack += 1) {
        const key = `${entry.sourceId || entry.id}:${bot.id}:${stack}`;
        if (round.amonRewardKeys.has(key)) continue;
        round.amonRewardKeys.add(key);
        const bounty = passiveEntryScaledValue(entry, 2);
        const bountyResult = changeBotSin(bot, bounty, "", { source: ITEMS.p59?.name || "Seal of Amon" });
        const memoryAdded = addBotMemory(bot, 2, "", { source: ITEMS.p59?.name || "Seal of Amon" });
        if (bountyResult.gained > 0 || memoryAdded > 0) triggered = true;
      }
    });
    if (triggered) {
      markPassiveEntryTriggered(entry);
      round.roundEvents.push(`${ITEMS.p59?.name || "Seal of Amon"} rewarded revealed DAMNED with BOUNTY and MEMORY.`);
    }
  });
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

// Dev SEALs that still act the moment the TARGET is revealed (GUESS): Dantre moves the TARGET itself,
// Serafeim's ARTIFACTS must arrive while they can still be used this round.
// Every other dev SEAL acts when READY is pressed, so it plays in the seal animation like the rest.
const DEV_SEALS_AT_REVEAL = new Set(["p92", "p94"]);

function applyDevSealsAtReveal() {
  const round = state.roundState;
  if (!round || round.devSealsRolled) return;
  round.devSealsRolled = true;
  applyDevSealEntries(Array.from(DEV_SEAL_IDS).filter((id) => DEV_SEALS_AT_REVEAL.has(id)));
}

function applyDevSealsAfterReady() {
  const round = state.roundState;
  if (!round || round.devSealsAfterReadyRolled) return;
  round.devSealsAfterReadyRolled = true;
  applyDevSealEntries(Array.from(DEV_SEAL_IDS).filter((id) => !DEV_SEALS_AT_REVEAL.has(id)));
}

function applyDevSealEntries(ids) {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries(ids);
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
        // once per reveal stack (Seal of Pyros): each time it takes half of the HEALTH it has left
        let left = bot.hp;
        for (let stack = 0; stack < revealMultiplicity(bot); stack += 1) {
          const damage = Math.ceil(left * 0.5);
          left -= damage;
          total += queueEndOfRoundBotDamage(bot, damage, `${source} burned ${bot.name} for ${damage} damage.`, source);
        }
      });
      addRoundEvent(total > 0 ? `${source} queued ${total} total damage to revealed DAMNED.` : `${source} found no revealed DAMNED.`);
      return;
    }

    if (entry.id === "p96") {
      let changed = 0;
      let vulnerable = 0;
      devSealTargetDamned().forEach((bot) => {
        if (hasPersonality(bot, "Stubborn")) {
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
          recordBotMemoryLoss(bot, memory, source);
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

// a DAMNED that fell this round before READY: its HEALTH shows 0, but the KO waits for READY
function botDeathAwaitsReady(bot) {
  const round = state.roundState;
  return Boolean(
    round && !round.penaltiesApplied && bot?.eliminated && !bot.immortal && round.aliveIdsAtStart?.has?.(bot.id)
  );
}

// KOs and BOUNTY SIN of DAMNED whose KO is still waiting for READY (kept off the HUD until then)
function deathsAwaitingReady() {
  const bots = (state.bots || []).filter((bot) => botDeathAwaitsReady(bot));
  return {
    count: bots.length,
    reward: bots.reduce((sum, bot) => sum + Math.max(0, Number(bot.eliminationReward) || 0), 0)
  };
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
      eliminated: Boolean(bot.eliminated) && !botDeathAwaitsReady(bot),
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
  const baseName = normalizeGameText(ITEMS[id]?.name || "");
  const displayName = normalizeGameText(roundRevealSealName(id));
  return Boolean((baseName && text.includes(baseName)) || (displayName && text.includes(displayName)));
}

// every SEAL that triggered this round and has not been animated yet, including ones whose
// condition was met before READY (they wait for it). onlyIds limits it (the reveal-time Dev SEALS).
function buildRoundRevealSequence(beforeSnapshot, onlyIds = null) {
  const round = state.roundState;
  if (!round) return [];
  const animated = round.animatedPassiveIds || new Set();
  const finalEvents = (round.roundEvents || []).slice();
  return Array.from(round.triggeredPassiveIds || [])
    .filter((id) => PASSIVE_IDS.includes(id) && !animated.has(id) && (!onlyIds || onlyIds.has(id)))
    .map((id) => ({
      id,
      name: roundRevealSealName(id),
      events: finalEvents.filter((event) => roundRevealEventMatchesSeal(id, event))
    }));
}

// a SEAL that acted before the snapshot is already counted in the snapshot's HEALTH and SIN;
// put those amounts back so its step shows them happening, like any other SEAL
function rebaseRoundRevealSnapshot(beforeSnapshot, sequence) {
  if (!beforeSnapshot || !sequence.length) return;
  const ids = new Set(sequence.map((step) => step.id));
  const fromSequence = (sources) => (sources || []).filter((entry) => ids.has(sealIdFromStatSource(entry?.source)));
  const total = (sources, options) =>
    fromSequence(sources).reduce((sum, entry) => {
      if (options?.damage && entry?.kind === "saved") return sum;
      const raw = Number(entry?.amount || 0);
      if (!Number.isFinite(raw) || raw === 0) return sum;
      const amount = raw > 0 ? Math.ceil(raw) : -Math.ceil(Math.abs(raw));
      return sum + (options?.signed ? amount : Math.abs(amount));
    }, 0);
  (beforeSnapshot.bots || []).forEach((bot) => {
    const damage = total(bot.damageSources, { damage: true });
    const healing = total(bot.healSources);
    bot.hp = Math.max(0, bot.hp + damage - healing);
    bot.damageTakenTotal = Math.max(0, (bot.damageTakenTotal || 0) - damage);
  });
  const player = beforeSnapshot.player;
  if (player) {
    player.hp = Math.max(0, player.hp + total(player.damageSources, { damage: true }) - total(player.healSources));
    player.credits -= total(player.creditSources, { signed: true });
  }
}

// a dark swell that rises while the seal fills and grows; the slam has its own sound
function playRoundRevealStepSfx() {
  playGameSfx("sealCharge");
}

function scheduleRoundRevealAnimation() {
  clearRoundRevealTimer();
  if (!roundRevealAnimationActive()) return;
  roundRevealTimer = setTimeout(advanceRoundRevealAnimation, gameMs(1000));
}

function startRoundRevealAnimation(beforeSnapshot, options = {}) {
  const sequence = buildRoundRevealSequence(beforeSnapshot, options.onlyIds || null);
  if (!sequence.length) return false;
  rebaseRoundRevealSnapshot(beforeSnapshot, sequence);
  sequence.forEach((step) => state.roundState?.animatedPassiveIds?.add(step.id));
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
    // the slam at the end of the fill is the sound of this step now
    animation.phase = "effect";
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
  applyEligosExactGuess();
  // seals acting at reveal get their seal animation now; while Dantre's plays, the old TARGET stays on screen
  const beforeReveal = captureRoundRevealSnapshot();
  const shownBefore = { target: round.target, offset: round.targetOffset };
  applyDevSealsAtReveal();
  round.targetBeforeRevealSeals = round.target !== shownBefore.target ? shownBefore : null;
  state.stage = "active";
  addLog(`Target revealed at ${formatNumber(round.target)}. CRITICAL integer: ${round.criticalInteger}.`);
  // only the reveal-time Dev SEALS (Dantre, Serafeim) animate now; every other SEAL waits for READY
  startRoundRevealAnimation(beforeReveal, { onlyIds: DEV_SEALS_AT_REVEAL });
  render();
}

// Seal of Eligos: your guess equals the TARGET as it is revealed (before any ARTIFACT or reveal SEAL moves it)
function applyEligosExactGuess() {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p119");
  if (!round || !entries.length) return false;
  if (!Number.isFinite(round.playerEffectiveGuess) || Math.ceil(round.playerEffectiveGuess) !== Math.ceil(round.target)) return false;
  state.exactGuessCritCharged = true;
  round.eligosExactGuess = true;
  entries.forEach((entry) => {
    markPassiveEntryTriggered(entry);
    const eliteSin = 5 * passiveEntryEliteLevels(entry);
    if (eliteSin > 0) gainCredits(eliteSin, true, ITEMS.p119.name);
  });
  round.roundEvents.push(`${ITEMS.p119.name}: your guess was exactly the TARGET. Your next CRITICAL deals 20% max HEALTH.`);
  return true;
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
  if (introCapturesInput()) return false;
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

