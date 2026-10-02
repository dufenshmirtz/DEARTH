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
    if (existing && isSelfStackingSeal(item.id)) {
      slot.sold = true;
      addLog(`${item.name} cannot be upgraded.`);
      syncShopSlotCount();
      render();
      return;
    }
    if (!existing && ownedSealSlotCount() >= passiveLimit()) {
      addLog("Seal slots are full.");
      render();
      return;
    }
    spendCredits(cost);
    if (existing) {
      existing.stack = (existing.stack || 1) + 1;
      addLog(`Upgraded ${existing.name} to ${passiveDisplayName(existing)}.`);
    } else {
      const boughtSeal = itemCopy(item.id);
      state.player.passives.push(boughtSeal);
      refreshMimicTarget();
      addLog(`Bought ${item.name}.`);
    }
    recordShopItemBought(item.id);
    state.itemsBought += 1;
    slot.sold = true;
    syncShopSlotCount();
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
  addLog(`Bought ${item.name}.`);
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
  state.rerollBaseCost += 1;
  addLog(`Devil's Offerings rerolled for ${cost} SIN.`);
  applyRerollTollDamage();
  if (state.player.hp <= 0) finishGameOverRound();
  render();
}

function sellPassive(index) {
  if (arcadeActionLocked()) return;
  const item = state.player.passives[index];
  if (!item) return;
  const sale = Math.floor((item.price * (item.stack || 1)) / 2) + (item.saleBonus || 0);
  state.player.passives.splice(index, 1);
  refreshMimicTarget();
  gainCredits(sale, false, `Sold ${passiveDisplayName(item)}`);
  syncShopSlotCount();
  addLog(`Sold ${passiveDisplayName(item)} for ${sale} SIN.`);
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
  if (TARGETED_ARTIFACT_IDS.has(item.id) || item.id === "a13") {
    state.pendingActive = { index: -1, uid: item.uid, id: item.id, mode: "bot", copiedItem: item, copiedByName: copierName };
    if (item.id === "a13") state.pendingActive.step = "damage";
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

  if (item.id === "a11") {
    recalculateTarget();
    const before = state.roundState.target;
    const snap = nearestMultipleFromDivisors(before, [3, 5, 7]);
    const snapped = snap.value;
    state.roundState.targetOffset += snapped - before;
    recalculateTarget();
    recordCopiedArtifactResolution(
      copierName,
      item,
      `${item.name} moved the TARGET to ${formatNumber(state.roundState.target)} (closest multiple of ${snap.divisor}).`
    );
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
    const credits = randomInt(artifactValue(3), artifactValue(10));
    const gained = gainCredits(credits, true, item.name);
    recordCopiedArtifactResolution(copierName, item, `${item.name} gained ${gained} SIN.`);
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
      `${item.name} armed: DAMNED take matching max-HEALTH percentage damage when you take damage this round.`
    );
    return;
  }

  if (item.id === "a22") {
    resolvePandoraRollEffect(item, (message) => recordCopiedArtifactResolution(copierName, item, message));
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

  if (item.id === "a13") {
    const damagedHealTargets = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated && bot.hp < bot.maxHp);
    if (!damagedHealTargets.length) {
      addLog(`${item.name} needs a damaged DAMNED to heal.`);
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

  if (item.id === "a11") {
    recalculateTarget();
    const before = state.roundState.target;
    const snap = nearestMultipleFromDivisors(before, [3, 5, 7]);
    const snapped = snap.value;
    state.roundState.targetOffset += snapped - before;
    recalculateTarget();
    consumeActive(index, `${item.name} moved the TARGET to ${formatNumber(state.roundState.target)} (closest multiple of ${snap.divisor}).`, item.uid);
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
    const credits = randomInt(artifactValue(3), artifactValue(10));
    const gained = gainCredits(credits, true, item.name);
    consumeActive(index, `${item.name} gained ${gained} SIN.`, item.uid);
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

  if (item.id === "a13") {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot", step: "damage", damageBotId: null };
    closeMobileOfferingsForTargetPick();
    addLog("Pick a DAMNED to take 20 non-lethal damage.");
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
      `${item.name} armed: DAMNED take matching max-HEALTH percentage damage when you take damage this round.`,
      item.uid
    );
    return;
  }

  if (item.id === "a22") {
    resolvePandoraRoll(index, item.uid);
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
  if (pending.id === "a13" && pending.step === "heal") {
    addLog(`${itemName} has already hit; choose a heal target to finish it.`);
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
  if (!item.devTemporary) state.roundState.activeUses += 1;
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

function resolvePandoraRollEffect(item, finish) {
  const name = item?.name || activeName("a22");
  const roll = Math.random();
  if (roll < 0.1) {
    const lost = loseCredits(artifactValue(8), name);
    finish(`${name} consumed ${lost} SIN.`);
    return;
  }
  if (roll < 0.25) {
    const lost = loseCredits(artifactValue(4), name);
    finish(`${name} consumed ${lost} SIN.`);
    return;
  }
  if (roll < 0.4) {
    const target = randomFrom(activeBots());
    const damage = artifactValue(10);
    if (target) {
      damageBot(target, damage, `${name} dealt ${damage} damage to ${target.name}.`, name);
      finish(`${name} struck ${target.name} for ${damage}.`);
    } else {
      finish(`${name} found no DAMNED to strike.`);
    }
    return;
  }
  if (roll < 0.7) {
    const gained = gainCredits(artifactValue(8), true, name);
    finish(`${name} gained ${gained} SIN.`);
    return;
  }
  if (roll < 0.9) {
    const gained = gainCredits(artifactValue(12), true, name);
    finish(`${name} gained ${gained} SIN.`);
    return;
  }
  const gained = gainCredits(artifactValue(16), true, name);
  const damage = artifactValue(20);
  damageBots(activeBots(), damage, (bot, dealt) => `${name} dealt ${dealt} damage to ${bot.name}.`, name);
  finish(`${name} gained ${gained} SIN and struck every DAMNED.`);
}

function resolvePandoraRoll(index, uid) {
  const item = state.player.actives.find((active) => active.uid === uid) || ITEMS.a22;
  resolvePandoraRollEffect(item, (message) => consumeActive(index, message, uid));
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
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} removed ${bot.name} from the average.`);
    return;
  }

  if (id === "a15") {
    const uid = pending.uid;
    const baseDamage = Math.ceil(bot.maxHp * artifactPercent(sacrificialDaggerPercentForBot(bot)));
    const extraDamage = sacrificialDaggerExtraDamage("p70");
    const damage = baseDamage + extraDamage;
    const amyText = extraDamage ? ` including ${extraDamage} from Seal of Amy` : "";
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} hit ${bot.name} for ${damage}${amyText}.`, uid, false);
    damageBot(bot, damage, `${itemName} dealt ${damage} damage to ${bot.name}${amyText}.`, itemName);
    if (extraDamage > 0) recordSealStatFromSource("damage", extraDamage, ITEMS.p70?.name || "Seal of Amy");
    if (state.player.hp <= 0) finishGameOverRound();
    render();
    return;
  }

  if (id === "a25") {
    const bounty = artifactValue(9);
    changeBotSin(bot, bounty, "", { triggerLossDamage: false, source: itemName });
    const healed = healBot(bot, bot.maxHp, itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} healed ${bot.name} for ${healed} and added +${bounty} bounty.`);
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
    if (bot.isBoss) {
      addLog(`${itemName} cannot target BOSSES.`);
      render();
      return;
    }
    const value = artifactValue(6);
    const healAmount = Math.ceil((bot.maxHp || 0) * artifactPercent(6));
    const memoryAdded = addBotMemory(bot, value, "", { source: itemName });
    changeBotSin(bot, value, `${itemName} gave ${bot.name} +${value} SIN.`, { triggerLossDamage: false });
    const healed = healBot(bot, healAmount, itemName, itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} gave ${bot.name} +${memoryAdded} memory, +${value} SIN, and healed ${healed}.`);
    return;
  }

  if (id === "a13") {
    resolveTriageBeam(bot);
  }
}

function resolveTriageBeam(bot) {
  const pending = state.pendingActive;
  const item = pendingArtifactItem();
  const itemName = item?.name || activeName("a13");
  if (pending.step === "damage") {
    const possibleHealTargets = state.bots.filter(
      (candidate) => candidate.id !== bot.id && candidate.hp > 0 && !candidate.eliminated && candidate.hp < candidate.maxHp
    );
    if (!possibleHealTargets.length) {
      addLog("Pick a damage target that leaves another damaged DAMNED to heal.");
      render();
      return;
    }
    const value = artifactValue(20);
    const dealt = damageBotNonLethal(
      bot,
      value,
      (target, damage) => `${itemName} dealt ${damage} non-lethal damage to ${target.name}.`,
      itemName
    );
    applyTargetedItemSinGain(item, [bot]);
    pending.step = "heal";
    pending.damageBotId = bot.id;
    addLog(`Now pick another DAMNED to heal for ${value}.`);
    render();
    return;
  }

  if (pending.step === "heal") {
    if (bot.id === pending.damageBotId) {
      addLog("Choose another DAMNED to receive the heal.");
      render();
      return;
    }
    if (bot.hp >= bot.maxHp) {
      addLog(`${itemName} can only heal a damaged DAMNED.`);
      render();
      return;
    }
    const healed = healBot(bot, artifactValue(20), itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(pending.index, `${itemName} healed ${bot.name} for ${healed}.`);
  }
}

