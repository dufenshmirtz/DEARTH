function applyStubbornWitnessEndRoundGrowth() {
  const entries = orderedPassiveEffectEntries("p104");
  if (!entries.length) return;
  const targets = state.bots.filter((bot) => bot && bot.hp > 0 && !bot.eliminated && hasPersonality(bot, "Stubborn"));
  if (!targets.length) return;
  entries.forEach((entry) => {
    const baseAmount = Math.max(0, Math.ceil(entry.stack || 1));
    if (baseAmount <= 0) return;
    const source = passiveName("p104", "Seal of Alloces");
    let totalMemory = 0;
    let totalBounty = 0;
    targets.forEach((bot) => {
      const amount = baseAmount * personalityCount(bot, "Stubborn");
      totalMemory += addBotMemory(bot, amount, "", { source });
      totalBounty += changeBotSin(bot, amount, "", { triggerLossDamage: false, source }).gained;
    });
    if (totalMemory > 0 || totalBounty > 0) {
      markPassiveEntryTriggered(entry);
      state.roundState?.roundEvents.push(`${source} gave STUBBORN DAMNED ${totalMemory} MEMORY and ${totalBounty} BOUNTY.`);
    }
  });
}

function rememberRound() {
  const round = state.roundState;
  clearBotMemoryBadges();
  const memoryGain = 1;
  const botGuessValues = state.bots
    .map((bot) => round.botEffectiveGuesses.get(bot.id))
    .filter((value) => Number.isFinite(value));
  const memoryEntry = {
    playerGuess: round.playerEffectiveGuess,
    target: round.target,
    targetModifier: round.targetModifier,
    targetOffset: round.targetOffset,
    tableAverage: round.tableAverage,
    botAverage: average(botGuessValues)
  };

  state.gameMemory.push(memoryEntry);
  // this round is now finished, so it counts toward the MEMORY limit
  round.memoryRecorded = true;

  state.bots.forEach((bot) => {
    if (bot.eliminated) return;
    const ownGuess = round.botEffectiveGuesses.get(bot.id);
    if (!Number.isFinite(ownGuess)) {
      if (bot.isBoss) bot.memory = state.gameMemory.slice(-botMemoryLimit(bot));
      return;
    }
    addBotMemory(
      bot,
      memoryGain,
      "",
      {
        source: "End of round memory",
        entry: {
          ownGuess,
          ...memoryEntry
        }
      }
    );
  });
  applyStubbornWitnessEndRoundGrowth();
}

// ---------- Dev: give yourself a SEAL by name (Pause > DEV) ----------
// "Seal of Bael", "bael", "BAEL" and "seal bael" all name the same SEAL; apostrophes and punctuation are ignored
function devSealSearchText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^seal( of)?( |$)/, "")
    .trim();
}

function devSealEditDistance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const kept = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = kept;
    }
  }
  return row[right.length];
}

// how well a SEAL's name matches the search: 0 = starts with it, 1 = a word starts with it, 2 = contains it,
// 3+ = close to it with a typo or two; null = no match
function devSealMatchScore(id, query) {
  const core = devSealSearchText(ITEMS[id]?.name);
  if (!core || !query) return null;
  if (core.startsWith(query)) return 0;
  const words = core.split(" ");
  if (words.some((word) => word.startsWith(query))) return 1;
  if (core.includes(query)) return 2;
  // several words typed: each one starts a word of the name, in any order ("7th mars")
  const parts = query.split(" ").filter(Boolean);
  if (parts.length > 1 && parts.every((part) => words.some((word) => word.startsWith(part)))) return 2;
  if (query.length < 3) return null;
  const allowedFor = (text) => (text.length <= 5 ? 1 : 2);
  const candidates = [core.slice(0, query.length), ...words.map((word) => word.slice(0, query.length))];
  const distance = Math.min(...candidates.map((candidate) => devSealEditDistance(query, candidate)));
  if (distance <= allowedFor(query)) return 3 + distance;
  if (parts.length < 2) return null;
  // several words with small typos ("pentacle marz")
  let typos = 0;
  for (const part of parts) {
    if (words.some((word) => word.startsWith(part))) continue;
    if (part.length < 3) return null;
    const best = Math.min(...words.map((word) => devSealEditDistance(part, word.slice(0, part.length))));
    if (best > allowedFor(part)) return null;
    typos += best;
  }
  return 3 + typos;
}

function devSealSearchPool() {
  return collectibleSealIds().filter((id) => ITEMS[id] && !REMOVED_PASSIVE_IDS.has(id));
}

// the SEALS whose names best match what was typed, best first
function devSealSuggestions(text, limit = 6) {
  const query = devSealSearchText(text);
  if (!query) return [];
  return devSealSearchPool()
    .map((id) => ({ id, score: devSealMatchScore(id, query) }))
    .filter((match) => match.score !== null)
    .sort(
      (left, right) =>
        left.score - right.score ||
        ITEMS[left.id].name.length - ITEMS[right.id].name.length ||
        ITEMS[left.id].name.localeCompare(ITEMS[right.id].name)
    )
    .slice(0, limit)
    .map((match) => match.id);
}

// the one SEAL the search names: an exact name, or the only match
function devResolveSealQuery(text) {
  const query = devSealSearchText(text);
  if (!query) return { id: null, note: "Write a SEAL's name." };
  const exact = devSealSearchPool().find((id) => devSealSearchText(ITEMS[id].name) === query);
  if (exact) return { id: exact, note: "" };
  const matches = devSealSuggestions(text, 50);
  if (matches.length === 1) return { id: matches[0], note: "" };
  return { id: null, note: matches.length ? "Several SEALS match: pick one from the list." : "No SEAL has that name." };
}

// give the SEAL if there is room for it, or upgrade it once if you already have it
function devGrantSeal(id) {
  const item = ITEMS[id];
  if (!item || item.type !== "passive" || REMOVED_PASSIVE_IDS.has(id)) return { ok: false, note: "No SEAL has that name." };
  const existing = passiveEntry(id);
  let note;
  if (existing) {
    if (isNonUpgradableSeal(id)) return { ok: false, note: `${item.name} cannot be upgraded.` };
    existing.stack = (existing.stack || 1) + 1;
    note = `Upgraded: ${passiveDisplayName(existing)}.`;
  } else {
    if (!hasSealSlotRoomFor(item)) {
      return { ok: false, note: SATAN_SEAL_IDS.has(id) ? `${item.name} needs 2 empty SEAL slots.` : "Your SEAL slots are full." };
    }
    state.player.passives.push(itemCopy(id));
    refreshMimicTarget();
    if (id === AMY_SEAL_ID && state.roundState && !state.roundState.penaltiesApplied) rollAmyCopy();
    note = `Gave you ${item.name}.`;
  }
  syncShopSlotCount();
  applyGuessReveals();
  checkBalamMemoryBountyEliminations();
  playSealPurchaseSfx();
  addLog(`Testing: ${note}`);
  return { ok: true, note };
}

function buyShopItem(slotIndex) {
  if (arcadeActionLocked()) return;
  pruneRemovedPassives();
  if (shopDisabledBySatan()) {
    addLog("Satan has disabled Devil's Offerings.");
    render();
    return;
  }
  const slot = state.shop[slotIndex];
  if (!slot || slot.sold) return;
  const item = slot.item;
  if (item.type === "passive" && REMOVED_PASSIVE_IDS.has(item.id)) {
    slot.sold = true;
    addLog(`${item.name} is no longer offered.`);
    syncShopSlotCount();
    render();
    return;
  }
  const cost = shopPrice(item);

  if (!canSpendCredits(cost)) {
    addLog("Not enough SIN.");
    render();
    return;
  }

  if (item.type === "passive") {
    const existing = passiveEntry(item.id);
    if (existing && isNonUpgradableSeal(item.id)) {
      slot.sold = true;
      addLog(`${item.name} cannot be upgraded.`);
      syncShopSlotCount();
      render();
      return;
    }
    if (!existing && !hasSealSlotRoomFor(item)) {
      addLog(SATAN_SEAL_IDS.has(item.id) ? "Need 2 empty Seal slots." : "Seal slots are full.");
      render();
      return;
    }
    // a copy taken free (the bound demon's SEAL, not yet owned) sells for nothing
    const free = isFreeBoundSealOffer(item);
    spendCredits(cost);
    if (existing) {
      existing.stack = (existing.stack || 1) + 1;
      if (free) existing.freeStacks = (existing.freeStacks || 0) + 1;
      recordEliteLevelBought(existing.id, existing.stack);
      addLog(`Upgraded ${existing.name} to ${passiveDisplayName(existing)}.`);
    } else {
      const boughtSeal = itemCopy(item.id);
      if (free) boughtSeal.freeStacks = 1;
      state.player.passives.push(boughtSeal);
      refreshMimicTarget();
      // Seal of Amy bought mid-round takes its Goetic SEAL for the rest of this round
      if (item.id === AMY_SEAL_ID && state.roundState && !state.roundState.penaltiesApplied) rollAmyCopy();
      addLog(`Bought ${item.name}.`);
    }
    recordPlayedSeal(item.id);
    recordShopItemBought(item.id);
    state.itemsBought += 1;
    slot.sold = true;
    syncShopSlotCount();
    collectionNoteShopBuy();
    applyGuessReveals();
    checkBalamMemoryBountyEliminations();
    playSealPurchaseSfx();
    applyOfferingTollDamage(item);
    if (state.player.hp <= 0) finishGameOverRound();
    render();
    return;
  }

  if (state.player.actives.length >= activeInventoryLimit()) {
    addLog("Artifact inventory is full.");
    render();
    return;
  }

  spendCredits(cost);
  const active = itemCopy(item.id);
  active.purchaseCost = cost;
  state.player.actives.push(active);
  state.activeCarouselIndex = state.player.actives.length - 1;
  recordShopItemBought(item.id);
  state.itemsBought += 1;
  slot.sold = true;
  syncShopSlotCount();
  collectionNoteShopBuy();
  addLog(`Bought ${item.name}.`);
  playGameSfx("artifactBuy");
  applyOfferingTollDamage(item);
  if (state.player.hp <= 0) finishGameOverRound();
  render();
}

function rerollShopClick() {
  if (arcadeActionLocked()) return;
  if (shopDisabledBySatan()) {
    addLog("Satan has disabled Devil's Offerings.");
    render();
    return;
  }
  if (satanRerollTollActive()) {
    rerollShopPayingSatanToll();
    render();
    return;
  }
  const free = freeRerollsLeft() > 0;
  const cost = currentRerollCost();
  if (!canSpendCredits(cost)) {
    addLog(`Reroll needs ${cost} SIN.`);
    render();
    return;
  }
  spendCredits(cost);
  if (state.roundState) {
    state.roundState.rerollSinSpentThisRound = (state.roundState.rerollSinSpentThisRound || 0) + Math.max(0, Math.ceil(cost));
  }
  rerollShop();
  playGameSfx("reroll");
  if (free) {
    // a free reroll (Seal of the Son) does not raise the price of the next paid one
    state.freeRerolls = freeRerollsLeft() - 1;
    markPassiveTriggered("p132");
    addLog(`Devil's Offerings rerolled for free (${ITEMS.p132.name}). ${freeRerollsLeft()} left.`);
  } else {
    state.rerollBaseCost += 1;
    addLog(`Devil's Offerings rerolled for ${cost} SIN.`);
  }
  applyRerollTollDamage();
  if (state.player.hp <= 0) finishGameOverRound();
  render();
}

// Satan's toll: this reroll takes every SIN you hold. The SIN is lost to him, not spent, so it feeds no
// spending SEAL (Furfur, Shax) and the normal reroll price does not go up.
function rerollShopPayingSatanToll() {
  const lost = Math.max(0, Math.ceil(state.player.credits || 0));
  state.player.credits = 0;
  state.satanRerollToll = false;
  state.satanTightwadAbove = false;
  rerollShop();
  playGameSfx("reroll");
  addLog(`Satan's toll: the reroll took all your SIN (${lost}).`);
  applyRerollTollDamage();
  if (state.player.hp <= 0) finishGameOverRound();
}

function passiveSellValue(item) {
  const paidStacks = Math.max(0, (item.stack || 1) - (item.freeStacks || 0));
  return Math.floor((item.price * paidStacks) / 2) + (item.saleBonus || 0);
}

// the Trinity SEALS share a slot: selling it sells every one of them
function sellTrinitySeals(index) {
  const pieces = ownedTrinitySeals();
  const sale = pieces.reduce((sum, item) => sum + passiveSellValue(item), 0);
  const names = trinitySlotName(pieces);
  ghostSealOut(index);
  state.player.passives = state.player.passives.filter((item) => !pieces.includes(item));
  refreshMimicTarget();
  gainCredits(sale, false, `Sold ${names}`);
  syncShopSlotCount();
  addLog(`Sold ${names} for ${sale} SIN.`);
  playGameSfx("sealSellGhost");
  quietMomentSfx("sinGain");
  render();
}

function sellPassive(index) {
  if (arcadeActionLocked()) return;
  const item = state.player.passives[index];
  if (!item) return;
  if (isTrinitySeal(item)) {
    sellTrinitySeals(index);
    return;
  }
  const sale = passiveSellValue(item);
  ghostSealOut(index);
  state.player.passives.splice(index, 1);
  refreshMimicTarget();
  gainCredits(sale, false, `Sold ${passiveDisplayName(item)}`);
  syncShopSlotCount();
  addLog(`Sold ${passiveDisplayName(item)} for ${sale} SIN.`);
  // a sold SEAL leaves with the ghost alone; the coin sound is for ARTIFACTS
  playGameSfx("sealSellGhost");
  quietMomentSfx("sinGain");
  render();
}

function sellActive(index) {
  if (arcadeActionLocked()) return;
  const item = state.player.actives[index];
  if (!item) return;
  const sale = activeSellValue(item);
  state.player.actives.splice(index, 1);
  gainCredits(sale, false, `Sold ${item.name}`);
  normalizeActiveCarouselIndex();
  addLog(`Sold ${item.name} for ${sale} SIN.`);
  playGameSfx("sell");
  quietMomentSfx("sinGain");
  render();
}

function normalizeActiveCarouselIndex() {
  const count = state.player.actives.length;
  if (!count) {
    state.activeCarouselIndex = 0;
    return;
  }
  state.activeCarouselIndex = clamp(state.activeCarouselIndex, 0, count - 1);
}

function moveActiveCarousel(delta) {
  const count = state.player.actives.length;
  if (!count) return;
  state.activeCarouselIndex = (state.activeCarouselIndex + delta + count) % count;
  render();
}

function positionFloatingTooltip(event, tooltip) {
  const gap = 14;
  tooltip.style.left = "0px";
  tooltip.style.top = "0px";
  const rect = tooltip.getBoundingClientRect();
  let left = event.clientX + gap;
  let top = event.clientY + gap;
  if (left + rect.width > window.innerWidth - gap) left = event.clientX - rect.width - gap;
  if (top + rect.height > window.innerHeight - gap) top = event.clientY - rect.height - gap;
  tooltip.style.left = `${Math.max(gap, left)}px`;
  tooltip.style.top = `${Math.max(gap, top)}px`;
}

function canUseActive(index = null) {
  const item = Number.isInteger(index) ? state.player.actives[index] : null;
  const temporaryDevArtifact = Boolean(item?.devTemporary);
  return (
    !arcadeActionLocked() &&
    state.stage === "active" &&
    state.roundState &&
    !state.roundState.penaltiesApplied &&
    (temporaryDevArtifact || state.roundState.activeUses < activeUseLimit())
  );
}

function activeName(id) {
  return ITEMS[id]?.name || "Artifact";
}

function pendingArtifactItem() {
  const pending = state.pendingActive;
  if (!pending) return null;
  return pending.copiedItem || state.player.actives.find((active) => active.uid === pending.uid) || null;
}

function copiedEffectItem(sourceItem) {
  const copy = itemCopy(sourceItem.id);
  copy.purchaseCost = sourceItem.purchaseCost ?? sourceItem.price ?? ITEMS[sourceItem.id]?.price ?? 0;
  if (Number.isFinite(sourceItem.sellValueOverride)) copy.sellValueOverride = sourceItem.sellValueOverride;
  return copy;
}

function rememberLastUsedArtifactEffect(item) {
  if (!item || item.id === "a18" || !ACTIVE_IDS.includes(item.id)) return;
  state.lastUsedArtifact = copiedEffectItem(item);
}

function lastUsedArtifactEffect() {
  const item = state.lastUsedArtifact;
  if (!item || item.id === "a18" || !ACTIVE_IDS.includes(item.id)) return null;
  return copiedEffectItem(item);
}

function lastUsedArtifactName() {
  const item = state.lastUsedArtifact;
  if (!item || item.id === "a18" || !ACTIVE_IDS.includes(item.id)) return "None";
  return item.name || activeName(item.id);
}

function stackPlayerDamageReduction(basePercent, source) {
  if (!state.roundState) return 0;
  const nextReduction = artifactPercent(basePercent);
  const currentReduction = clamp(state.roundState.playerDamageReduction || 0, 0, 0.99);
  state.roundState.playerDamageReduction = clamp(1 - (1 - currentReduction) * (1 - nextReduction), 0, 0.99);
  state.roundState.playerDamageReductionSource = source || "Damage reduction";
  return state.roundState.playerDamageReduction;
}

function addArtifactCriticalRangeBonus(amount, source) {
  if (!state.roundState) return 0;
  const bonus = Math.max(0, Math.ceil(amount || 0));
  state.roundState.artifactCriticalRangeBonus = Math.max(0, Math.ceil(state.roundState.artifactCriticalRangeBonus || 0)) + bonus;
  return state.roundState.artifactCriticalRangeBonus;
}

// Funeral Coin: pays you 3-10 SIN, or with the 2nd Pentacle of the Moon spreads 6-16 BOUNTY among the DAMNED
function resolveFuneralCoin(item) {
  const entry = artifactSealEntry("a10");
  if (!entry) {
    const credits = randomInt(artifactValue(3), artifactValue(10));
    const gained = gainCredits(credits, true, item.name);
    return `${item.name} gained ${gained} SIN.`;
  }
  const name = ITEMS.p135.name;
  const targets = activeBots().filter((bot) => !bot.immortal);
  if (!targets.length) return `${item.name} found no DAMNED to carry its BOUNTY (${name}).`;
  const range = moonCoinSpreadRange(entry);
  const amount = randomInt(range.min, range.max);
  const gains = new Map();
  for (let index = 0; index < amount; index += 1) {
    const target = randomFrom(targets);
    gains.set(target.id, (gains.get(target.id) || 0) + 1);
  }
  let spread = 0;
  gains.forEach((count, botId) => {
    const bot = state.bots.find((candidate) => candidate.id === botId);
    if (bot) spread += changeBotSin(bot, count, "", { source: name, triggerLossDamage: false }).gained;
  });
  markPassiveEntryTriggered(entry);
  return `${item.name} spread ${spread} BOUNTY among the DAMNED (${name}).`;
}

// Cursed Chalice: +1 CRITICAL range this round; with the 4th Pentacle of the Moon your CRITICAL also gains % max SOUL
function resolveCursedChalice(item) {
  const total = addArtifactCriticalRangeBonus(1, item.name);
  let message = `${item.name} raised your CRITICAL range by +1 this round. Total ARTIFACT bonus: +${total}.`;
  const entry = artifactSealEntry("a22");
  if (entry && state.roundState) {
    const percent = moonChaliceCriticalPercent(entry);
    state.roundState.artifactCriticalPercentBonus = criticalPercentBonus() + percent;
    markPassiveEntryTriggered(entry);
    message += ` ${ITEMS.p137.name}: your CRITICAL deals +${criticalPercentBonus()}% max SOUL this round.`;
  }
  return message;
}

// Vial of Blood: the second DAMNED takes the first one's PERSONALITY (nothing else)
function copyDamnedPersonality(bot, personality, source) {
  if (!bot || !personality) return false;
  return Boolean(setBotPersonality(bot, personality, source));
}

function recordCopiedArtifactResolution(copierName, copiedItem, message, renderAfter = true) {
  rememberLastUsedArtifactEffect(copiedItem);
  const text = `${copierName} copied ${copiedItem?.name || "Artifact"}: ${message}`;
  state.roundState.roundEvents.push(text);
  addLog(text);
  recalculateTarget();
  if (state.player.hp <= 0) finishGameOverRound();
  if (renderAfter) render();
}

function finishActiveResolution(index, message, uid = state.pendingActive?.uid, renderAfter = true) {
  const pending = state.pendingActive;
  if (pending?.copiedItem) {
    const copiedItem = pending.copiedItem;
    const copierName = pending.copiedByName || activeName("a18");
    state.pendingActive = null;
    recordCopiedArtifactResolution(copierName, copiedItem, message, renderAfter);
    return;
  }
  consumeActive(index, message, uid, renderAfter);
}

function beginCopiedArtifactEffect(sourceItem, copierName) {
  const item = copiedEffectItem(sourceItem);
  if (TARGETED_ARTIFACT_IDS.has(item.id) || item.id === "a11") {
    state.pendingActive = { index: -1, uid: item.uid, id: item.id, mode: "bot", copiedItem: item, copiedByName: copierName };
    if (item.id === "a11") state.pendingActive.step = "damage";
    closeMobileOfferingsForTargetPick();
    addLog(`${copierName} copied ${item.name}. Pick a DAMNED to resolve the copied effect.`);
    render();
    return;
  }

  if (item.id === "a6") {
    const value = artifactValue(20);
    state.roundState.targetOffset += value;
    recordCopiedArtifactResolution(copierName, item, `${item.name} added ${value} to the target.`);
    return;
  }

  if (item.id === "a14") {
    const value = artifactValue(10);
    state.roundState.targetOffset -= value;
    recordCopiedArtifactResolution(copierName, item, `${item.name} reduced the target by ${value}.`);
    return;
  }

  if (item.id === "a23") {
    addEliteRerollBoost();
    recordCopiedArtifactResolution(
      copierName,
      item,
      `${item.name} marked the next reroll. The Seal slot's ELITE chance is ${Math.round(eliteShopChance() * 100)}%.`
    );
    return;
  }

  if (item.id === "a10") {
    recordCopiedArtifactResolution(copierName, item, resolveFuneralCoin(item));
    return;
  }

  if (item.id === "a12") {
    const reduction = stackPlayerDamageReduction(50, item.name);
    recordCopiedArtifactResolution(
      copierName,
      item,
      `${item.name} armed: you take ${artifactPercentValue(50)}% less damage this round. Total reduction: ${Math.round(reduction * 100)}%.`
    );
    return;
  }

  if (item.id === "a16") {
    const credits = randomInt(artifactValue(3), artifactValue(9));
    const gained = gainCredits(credits, true, item.name);
    recordCopiedArtifactResolution(copierName, item, `${item.name} gained ${gained} SIN.`);
    return;
  }

  if (item.id === "a21") {
    state.roundState.painEcho = true;
    recordCopiedArtifactResolution(
      copierName,
      item,
      `${item.name} armed: DAMNED take matching max-SOUL percentage damage when you take damage this round.`
    );
    return;
  }

  if (item.id === "a22") {
    recordCopiedArtifactResolution(copierName, item, resolveCursedChalice(item));
    return;
  }

  recordCopiedArtifactResolution(copierName, item, `${item.name} has no current effect.`);
}

function useActive(index) {
  if (arcadeActionLocked()) return;
  if (!canUseActive(index)) {
    addLog("Artifacts can be used only during the reveal stage.");
    render();
    return;
  }

  if (state.pendingActive) {
    addLog("Finish or cancel the current Artifact first.");
    render();
    return;
  }

  const item = state.player.actives[index];
  if (!item) return;
  if (!ACTIVE_IDS.includes(item.id)) {
    addLog(`${item.name} is reserved and can only be sold.`);
    render();
    return;
  }

  if (item.id === "a11") {
    const nonBossTargets = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated && !bot.isBoss);
    if (nonBossTargets.length < 2) {
      addLog(`${item.name} needs two non-boss DAMNED.`);
      render();
      return;
    }
  }

  activeBots()
    .filter((bot) => botHasPassive(bot, "spite"))
    .forEach((bot) => {
      damagePlayer(3, `${bot.name}'s Pyros Gift: Seal of Botis dealt 3 damage because you used an ARTIFACT.`);
    });
  if (state.player.hp <= 0) {
    finishGameOverRound();
    render();
    return;
  }

  const threonSource = activeBossesWithPower("threon")[0];
  if (threonSource && Math.random() < 0.5) {
    damagePlayer(3, `${threonSource.name} made ${item.name} malfunction for 3 damage.`);
    consumeActive(index, `${threonSource.name} made ${item.name} malfunction and do nothing.`, item.uid);
    return;
  }

  if (item.id === "a6") {
    const value = artifactValue(20);
    state.roundState.targetOffset += value;
    consumeActive(index, `${item.name} added ${value} to the target.`, item.uid);
    return;
  }

  if (item.id === "a14") {
    const value = artifactValue(10);
    state.roundState.targetOffset -= value;
    consumeActive(index, `${item.name} reduced the target by ${value}.`, item.uid);
    return;
  }

  if (item.id === "a23") {
    addEliteRerollBoost();
    consumeActive(
      index,
      `${item.name} marked the next reroll. The Seal slot's ELITE chance is ${Math.round(eliteShopChance() * 100)}%.`,
      item.uid
    );
    return;
  }

  if (TARGETED_ARTIFACT_IDS.has(item.id)) {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot" };
    closeMobileOfferingsForTargetPick();
    addLog("Pick a DAMNED to resolve the ARTIFACT.");
    render();
    return;
  }

  if (item.id === "a10") {
    consumeActive(index, resolveFuneralCoin(item), item.uid);
    return;
  }

  if (item.id === "a12") {
    const reduction = stackPlayerDamageReduction(50, item.name);
    consumeActive(
      index,
      `${item.name} armed: you take ${artifactPercentValue(50)}% less damage this round. Total reduction: ${Math.round(reduction * 100)}%.`,
      item.uid
    );
    return;
  }

  if (item.id === "a11") {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot", step: "damage", damageBotId: null };
    closeMobileOfferingsForTargetPick();
    addLog(artifactSealEntry("a11") ? "Pick a non-boss DAMNED to eliminate." : "Pick a non-boss DAMNED to take 30% max-SOUL damage.");
    render();
    return;
  }

  if (item.id === "a16") {
    const credits = randomInt(artifactValue(3), artifactValue(9));
    const gained = gainCredits(credits, true, item.name);
    consumeActive(index, `${item.name} gained ${gained} SIN.`, item.uid);
    return;
  }

  if (item.id === "a18") {
    const copied = lastUsedArtifactEffect();
    if (!copied) {
      addLog(`${item.name} needs a previously used non-Crystal ARTIFACT to copy.`);
      render();
      return;
    }
    consumeActive(index, `${item.name} shattered into ${copied.name}.`, item.uid, false);
    if (state.player.hp <= 0) {
      render();
      return;
    }
    beginCopiedArtifactEffect(copied, item.name);
    return;
  }

  if (item.id === "a21") {
    state.roundState.painEcho = true;
    consumeActive(
      index,
      `${item.name} armed: DAMNED take matching max-SOUL percentage damage when you take damage this round.`,
      item.uid
    );
    return;
  }

  if (item.id === "a22") {
    consumeActive(index, resolveCursedChalice(item), item.uid);
    return;
  }

  render();
}

function cancelPendingActive() {
  if (arcadeActionLocked()) return;
  const pending = state.pendingActive;
  if (!pending) return;
  const item = pendingArtifactItem();
  const itemName = item?.name || "Artifact";
  if (pending.id === "a11" && pending.step === "heal") {
      addLog(`${itemName} has already hit; choose an overheal target to finish it.`);
    render();
    return;
  }
  if (pending.id === "a26" && pending.step === "give") {
    const source = state.bots.find((bot) => bot.id === pending.sourceBotId);
    if (source) {
      changeBotSin(source, pending.removedBounty || 0, "", {
        triggerLossDamage: false,
        source: `${itemName} canceled`
      });
    }
    addLog(`${itemName} canceled and restored the drained bounty.`);
  } else if (pending.copiedItem) {
    addLog(`${pending.copiedByName || activeName("a18")} copied ${itemName}, but the copied effect was canceled.`);
  } else {
    addLog(`${itemName} canceled.`);
  }
  state.pendingActive = null;
  render();
}

function consumeActive(index, message, uid = state.pendingActive?.uid, renderAfter = true) {
  const actualIndex = uid ? state.player.actives.findIndex((item) => item.uid === uid) : index;
  if (actualIndex < 0) {
    state.pendingActive = null;
    addLog("That Artifact is no longer available.");
    render();
    return;
  }
  const [item] = state.player.actives.splice(actualIndex, 1);
  if (!item) return;
  playArtifactSfx(item.id);
  recordPlayedArtifact(item.id);
  // Seal of Serafeim never triggers on its own; using ARTIFACTS while holding it is what it does
  if (passiveStack("p126")) collectionDiscover("p126");
  if (!item.devTemporary) state.roundState.activeUses += 1;
  collectionNoteArtifactUse();
  applyArchangelArtifactUse();
  state.pendingActive = null;
  state.roundState.roundEvents.push(message);
  addLog(message);
  recordArtifactUseForSelfStacking();
  applyActiveUsePassives(item);
  rememberLastUsedArtifactEffect(item);
  recalculateTarget();
  normalizeActiveCarouselIndex();
  if (state.player.hp <= 0) {
    finishGameOverRound();
  }
  if (renderAfter) render();
}

function chooseBot(botId) {
  if (arcadeActionLocked()) return;
  if (!state.pendingActive || state.pendingActive.mode !== "bot") return;
  const pending = state.pendingActive;
  const { id, index } = pending;
  const bot = state.bots.find((candidate) => candidate.id === botId);
  if (!bot) return;
  if (bot.hp <= 0) {
    addLog(`${bot.name} is already down.`);
    render();
    return;
  }
  if (botHasPassive(bot, "shield")) {
    addLog(`${bot.name}'s Pyros Gift: Seal of Halphas blocks ARTIFACTS.`);
    render();
    return;
  }
  const round = state.roundState;
  const item = pendingArtifactItem();
  const itemName = item?.name || activeName(id);

  if (id === "a7") {
    if (bot.isBoss) {
      addLog(`${itemName} cannot target BOSSES.`);
      render();
      return;
    }
    const playerGuess = round.playerEffectiveGuess;
    const botGuess = round.botEffectiveGuesses.get(bot.id);
    round.playerEffectiveGuess = botGuess;
    round.playerSubmittedGuess = botGuess;
    round.playerCorruption = null;
    round.botEffectiveGuesses.set(bot.id, playerGuess);
    round.botSubmittedGuesses.set(bot.id, playerGuess);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} traded guesses with ${bot.name}.`);
    return;
  }

  if (id === "a8") {
    const guess = round.botEffectiveGuesses.get(bot.id);
    const count = artifactCount(5);
    for (let copy = 0; copy < count - 1; copy += 1) {
      round.extraAverageGuesses.push({ botId: bot.id, guess });
    }
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} counted ${bot.name}'s guess ${count} times.`);
    return;
  }

  if (id === "a9") {
    round.removedBotIds.add(bot.id);
    // 3rd Pentacle of the Moon: its guess is pushed away from the final TARGET at READY (ELITE: +3 MEMORY first)
    const crossEntry = artifactSealEntry("a9");
    let crossText = "";
    if (crossEntry) {
      const name = ITEMS.p136.name;
      const extraMemory = 3 * passiveEntryEliteLevels(crossEntry);
      const added = extraMemory > 0 ? addBotMemory(bot, extraMemory, "", { source: name }) : 0;
      if (!Array.isArray(round.moonCrossBotIds)) round.moonCrossBotIds = [];
      round.moonCrossBotIds.push(bot.id);
      markPassiveEntryTriggered(crossEntry);
      crossText = ` ${name}${added ? ` gave it +${added} MEMORY and` : ""} will push its guess away from the TARGET.`;
    }
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} removed ${bot.name} from the average.${crossText}`);
    return;
  }

  if (id === "a15") {
    const uid = pending.uid;
    const baseDamage = Math.ceil(bot.maxHp * artifactPercent(sacrificialDaggerPercentForBot(bot)));
    const extraDamage = sacrificialDaggerExtraDamage("p70");
    const damage = baseDamage + extraDamage;
    const pentacleText = extraDamage ? ` including ${extraDamage} from ${ITEMS.p70.name}` : "";
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} hit ${bot.name} for ${damage}${pentacleText}.`, uid, false);
    damageBot(bot, damage, `${itemName} dealt ${damage} damage to ${bot.name}${pentacleText}.`, itemName);
    if (extraDamage > 0) recordSealStatFromSource("damage", extraDamage, ITEMS.p70.name);
    if (state.player.hp <= 0) finishGameOverRound();
    render();
    return;
  }

  if (id === "a25") {
    // 5th Pentacle of the Moon: a DAMNED revealed this round also takes 30% max SOUL (15% for BOSSES)
    const lambEntry = artifactSealEntry("a25");
    const sealBounty = moonLambBountyBonus(lambEntry);
    const lambDamage = lambEntry && bot.revealedByPassive ? moonLambDamage(bot, lambEntry) : 0;
    queueMummifiedLambNextRoundReveal(bot, itemName, sealBounty);
    applyTargetedItemSinGain(item, [bot]);
    const uid = pending.uid;
    finishActiveResolution(
      index,
      `${itemName} marked ${bot.name}. Next round, its guess is revealed and it gains +${3 + sealBounty} BOUNTY.`,
      uid,
      false
    );
    if (lambEntry && (lambDamage > 0 || sealBounty > 0)) markPassiveEntryTriggered(lambEntry);
    if (lambDamage > 0) {
      const name = ITEMS.p138.name;
      damageBot(bot, lambDamage, `${name} dealt ${lambDamage} damage to revealed ${bot.name}.`, name);
    }
    if (state.player.hp <= 0) finishGameOverRound();
    render();
    return;
  }

  if (id === "a26") {
    if (pending.step === "give") {
      changeBotSin(bot, pending.removedBounty || 0, "", { triggerLossDamage: false, source: itemName });
      applyTargetedItemSinGain(item, [bot]);
      finishActiveResolution(index, `${itemName} moved ${pending.removedBounty || 0} bounty to ${bot.name}.`);
      return;
    }
    const maxDrain = artifactValue(5);
    const removed = Math.min(maxDrain, botSin(bot));
    changeBotSin(bot, -removed, `${itemName} drained ${removed} bounty from ${bot.name}.`);
    applyTargetedItemSinGain(item, [bot]);
    pending.step = "give";
    pending.sourceBotId = bot.id;
    pending.removedBounty = removed;
    addLog(`${itemName} drained ${removed} BOUNTY from ${bot.name}. Pick a DAMNED to receive it.`);
    render();
    return;
  }

  if (id === "a28") {
    const value = artifactValue(6);
    const healAmount = Math.ceil((bot.maxHp || 0) * artifactPercent(6));
    const memoryAdded = addBotMemory(bot, value, "", { source: itemName });
    changeBotSin(bot, value, `${itemName} gave ${bot.name} +${value} SIN.`, { triggerLossDamage: false });
    const healed = healBot(bot, healAmount, itemName, itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} gave ${bot.name} +${memoryAdded} memory, +${value} SIN, and healed ${healed}.`);
    return;
  }

  if (id === "a11") {
    resolveBloodVial(bot);
  }
}

function resolveBloodVial(bot) {
  const pending = state.pendingActive;
  const item = pendingArtifactItem();
  const itemName = item?.name || activeName("a11");
  if (pending.step === "damage") {
    if (bot.isBoss) {
      addLog(`${itemName} cannot target BOSSES.`);
      render();
      return;
    }
    const possibleHealTargets = state.bots.filter(
      (candidate) => candidate.id !== bot.id && candidate.hp > 0 && !candidate.eliminated && !candidate.isBoss
    );
    if (!possibleHealTargets.length) {
      addLog("Pick a target that leaves another non-boss DAMNED to overheal.");
      render();
      return;
    }
    pending.copiedPersonality = personalityType(bot);
    pending.copiedPersonalityName = bot.name;
    // 6th Pentacle of the Moon: the first DAMNED is eliminated, and the second overheals by the SOUL it had left
    const vialEntry = artifactSealEntry("a11");
    if (vialEntry) {
      const name = ITEMS.p139.name;
      const hpLeft = Math.max(0, Math.ceil(bot.hp || 0));
      markPassiveEntryTriggered(vialEntry);
      bot.lastDamage = (bot.lastDamage || 0) + hpLeft;
      recordBotDamageSource(bot, hpLeft, name);
      bot.hp = 0;
      bot.deathCause = "vial";
      bot.deathNotice = "DRAINED";
      addRoundEvent(`${name} eliminated ${bot.name} with ${itemName}.`);
      resolveEliminatedBots([bot]);
      pending.moonHeal = hpLeft;
    } else {
      const damage = Math.ceil((bot.maxHp || 0) * artifactPercent(30));
      damageBot(bot, damage, `${itemName} dealt ${damage} damage to ${bot.name}.`, itemName);
    }
    applyTargetedItemSinGain(item, [bot]);
    pending.step = "heal";
    pending.damageBotId = bot.id;
    if (state.player.hp <= 0) {
      finishGameOverRound();
      render();
      return;
    }
    // the first pick's death can take the others with it: with no one left to overheal, the Vial ends here
    const healTargetsLeft = state.bots.filter(
      (candidate) => candidate.id !== bot.id && candidate.hp > 0 && !candidate.eliminated && !candidate.isBoss
    );
    if (!healTargetsLeft.length) {
      finishActiveResolution(pending.index, `${itemName} found no DAMNED left to overheal.`);
      return;
    }
    addLog(
      vialEntry
        ? "Now pick another non-boss DAMNED to overheal and turn STUBBORN."
        : "Now pick another non-boss DAMNED to overheal and receive the copied PERSONALITY."
    );
    render();
    return;
  }

  if (pending.step === "heal") {
    if (bot.id === pending.damageBotId) {
      addLog("Choose another DAMNED to receive the heal.");
      render();
      return;
    }
    if (bot.isBoss) {
      addLog(`${itemName} cannot target BOSSES.`);
      render();
      return;
    }
    if (Number.isFinite(pending.moonHeal)) {
      const name = ITEMS.p139.name;
      const healed = healBot(bot, pending.moonHeal, itemName, itemName, { allowOverheal: true });
      const stubborn = setBotPersonality(bot, "Stubborn", name);
      const vialEntry = orderedPassiveEffectEntries("p139")[0];
      const bounty = vialEntry ? 5 * passiveEntryEliteLevels(vialEntry) : 0;
      const bountyGained = bounty > 0 ? changeBotSin(bot, bounty, "", { source: name, triggerLossDamage: false }).gained : 0;
      applyTargetedItemSinGain(item, [bot]);
      finishActiveResolution(
        pending.index,
        `${itemName} overhealed ${bot.name} for ${healed}${stubborn ? " and made it STUBBORN" : ""}${bountyGained ? `, +${bountyGained} BOUNTY` : ""} (${name}).`
      );
      return;
    }
    const healAmount = Math.ceil((bot.maxHp || 0) * artifactPercent(30));
    const healed = healBot(bot, healAmount, itemName, itemName, { allowOverheal: true });
    const copied = copyDamnedPersonality(bot, pending.copiedPersonality || pending.copiedAbility?.type, itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(
      pending.index,
      `${itemName} overhealed ${bot.name} for ${healed} and ${copied ? "copied" : "matched"} ${pending.copiedPersonalityName || pending.copiedAbilityName || "the first DAMNED"}'s PERSONALITY.`
    );
  }
}

