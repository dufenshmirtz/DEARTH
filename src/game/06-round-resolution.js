let shiftTooltipMoreInstalled = false;

function setShiftTooltipMore(active) {
  document.body?.classList.toggle("shift-tooltip-more", Boolean(active));
}

function installShiftTooltipMore() {
  if (shiftTooltipMoreInstalled) return;
  shiftTooltipMoreInstalled = true;
  document.addEventListener("keydown", (event) => {
    if (event.key === "Shift") setShiftTooltipMore(true);
  });
  document.addEventListener("keyup", (event) => {
    if (event.key === "Shift") setShiftTooltipMore(false);
  });
  window.addEventListener("blur", () => setShiftTooltipMore(false));
}

function applyOrderedPenaltyPassiveDamage(activeBotList, botDamages, botDamageSources, addPlayerDamage, queuePlayerHeal) {
  const round = state.roundState;
  orderedPassiveEffectEntries(["p2", "p3", "p4", "p66"]).forEach((entry) => {
    if (entry.id === "p2") {
      const sin = paimonSinReward(entry, round);
      if (sin <= 0) return;
      const gained = gainCredits(sin, true, "Seal of Paimon");
      markPassiveEntryTriggered(entry);
      round.roundEvents.push(`Seal of Paimon paid ${gained} SIN for your close guess.`);
      return;
    }

    if (entry.id === "p4") {
      if (!round.edgeGambitStacks) return;
      const damage = edgeGambitDamage(entry);
      if (damage <= 0 || !activeBotList.length) return;
      markPassiveEntryTriggered(entry);
      activeBotList.forEach((bot) => {
        addPendingBotDamage(botDamages, botDamageSources, bot, damage, "Seal of Andras");
      });
      round.roundEvents.push(`Seal of Andras dealt ${damage} damage to every DAMNED.`);
      return;
    }

    if (entry.id === "p3") {
      if (round.criticalInteger % 3 !== 0) return;
      const verdictDamage = divisibleVerdictDamage(entry);
      activeBotList.forEach((bot) => {
        addPendingBotDamage(botDamages, botDamageSources, bot, verdictDamage, "Seal of Alloces");
      });
      markPassiveEntryTriggered(entry);
      round.roundEvents.push(`Seal of Alloces triggers for ${verdictDamage} damage to all DAMNED.`);
      return;
    }

    if (entry.id === "p66") {
      const targetValue = Math.ceil(round.target);
      if (!Number.isFinite(targetValue) || targetValue % 5 !== 0) return;
      const nonBossTargets = activeBotList.filter((bot) => !bot.isBoss && !bot.immortal);
      const bossTargets = activeBotList.filter((bot) => bot.isBoss && !bot.immortal);
      let triggered = false;
      if (nonBossTargets.length) {
        const target = randomFrom(nonBossTargets);
        addPendingBotDamage(botDamages, botDamageSources, target, target.hp, "Seal of Aim");
        round.roundEvents.push(`Seal of Aim chose ${target.name} for elimination because TARGET ${targetValue} is a multiple of 5.`);
        triggered = true;
      }
      const bossDamage = aimBossDamage(entry);
      if (bossDamage > 0 && bossTargets.length) {
        bossTargets.forEach((bot) => addPendingBotDamage(botDamages, botDamageSources, bot, bossDamage, "Seal of Aim"));
        round.roundEvents.push(`Seal of Aim dealt ${bossDamage} damage to each active BOSS because TARGET ${targetValue} is a multiple of 5.`);
        triggered = true;
      }
      if (triggered) markPassiveEntryTriggered(entry);
    }
  });
}

function applyZeparAdjacentTargetDifferenceDamage(botDamages, botDamageSources) {
  const entries = orderedPassiveEffectEntries("p54");
  const round = state.roundState;
  if (!round || !entries.length) return;
  const revealedDamageSources = activeBots()
    .filter((bot) => bot.revealedByPassive)
    .map((bot) => ({ bot, damage: Math.max(0, Math.ceil(botDamages.get(bot.id) || 0)) }))
    .filter((entry) => entry.damage > 0);
  if (!revealedDamageSources.length) return;
  entries.forEach((entry) => {
    let echoed = false;
    revealedDamageSources.forEach(({ bot: sourceBot, damage }) => {
      const targets = adjacentLivingBots(sourceBot);
      if (!targets.length) return;
      const echoedDamage = passiveEntryFlatDamage(entry, damage);
      targets.forEach((bot) => {
        addPendingBotDamage(botDamages, botDamageSources, bot, echoedDamage, "Seal of Zepar", false);
      });
      echoed = true;
      round.roundEvents.push(`Seal of Zepar echoed ${echoedDamage} damage from revealed ${sourceBot.name} to adjacent DAMNED.`);
    });
    if (echoed) {
      markPassiveEntryTriggered(entry);
    }
  });
}

function previousRecordedBotGuess(bot) {
  return bot?.memory
    ?.slice()
    .reverse()
    .find((entry) => Number.isFinite(entry?.ownGuess))?.ownGuess;
}

function applyBaelRepeatedGuessDamage(activeBotList, botDamages, botDamageSources) {
  const entries = orderedPassiveEffectEntries("p16");
  const round = state.roundState;
  if (!round || !entries.length) return;
  entries.forEach((entry) => {
    let triggeredCount = 0;
    activeBotList.forEach((bot) => {
      const currentGuess = round.botEffectiveGuesses.get(bot.id);
      const previousGuess = previousRecordedBotGuess(bot);
      if (!Number.isFinite(currentGuess) || !Number.isFinite(previousGuess)) return;
      const difference = Math.abs(currentGuess - previousGuess);
      if (difference >= 5) return;
      const baseDamage = difference === 0 ? 30 : 10;
      const damage = passiveEntryFlatDamage(entry, baseDamage);
      if (damage <= 0) return;
      triggeredCount += 1;
      addPendingBotDamage(botDamages, botDamageSources, bot, damage, "Seal of Bael");
    });
    if (triggeredCount > 0) {
      markPassiveEntryTriggered(entry);
      round.roundEvents.push(`Seal of Bael punished ${triggeredCount} repeated DAMNED guess${triggeredCount === 1 ? "" : "es"}.`);
    }
  });
}

function applyAstarothRevealedTargetDifferenceEcho(entry) {
  const round = state.roundState;
  if (!round) return;
  const sources = activeBots().filter((bot) => bot.revealedByPassive);
  if (!sources.length) return;
  const name = passiveName("p84", "Seal of Astaroth");
  let triggered = false;
  sources.forEach((sourceBot) => {
    const baseDamage = Math.max(0, Math.ceil(round.targetDifferenceDamageByBotId?.get(sourceBot.id) || 0));
    const damage = passiveEntryFlatDamage(entry, baseDamage);
    const targets = adjacentLivingBots(sourceBot);
    if (!targets.length || damage <= 0) return;
    if (!triggered) {
      markPassiveEntryTriggered(entry);
      triggered = true;
    }
    damageBots(targets, damage, (target, dealt) => `${name} dealt ${dealt} damage to ${target.name}.`, name);
    round.roundEvents.push(`${name} echoed ${damage} TARGET-difference damage from ${sourceBot.name} to adjacent DAMNED.`);
  });
}

function applyPenalties() {
  const round = state.roundState;
  round.penaltiesApplied = true;
  recalculateTarget();
  state.previousTarget = round.target;
  applyBifronsTargetSevenSin();
  applySallosGuessShiftAwayFromTarget();

  const botDamages = new Map();
  const botDamageSources = new Map();
  let playerDamage = 0;
  let playerDamageSources = [];
  const queuedPlayerHeals = [];
  const addPlayerDamage = (amount, source) => {
    const damage = Math.max(0, Math.ceil(amount));
    if (damage <= 0) return;
    playerDamage += damage;
    playerDamageSources.push({ amount: damage, source });
  };
  const queuePlayerHeal = (amount, reason, source) => {
    const heal = Math.max(0, Math.ceil(amount));
    if (heal <= 0) return;
    queuedPlayerHeals.push({ amount: heal, reason, source });
  };
  const activeBots = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated);
  const targetDiffEntries = orderedPassiveEffectEntries("p80");
  round.edgeGambitStacks = [0, 50, 100].includes(round.playerEffectiveGuess) ? passiveStack("p4") : 0;
  if (round.edgeGambitStacks) {
    markPassiveTriggered("p4");
    round.roundEvents.push("Seal of Andras used your final guess to arm damage, halve your TARGET-difference damage, and block worst guess damage.");
  }
  const playerIgnoresWorstPenalty = round.edgeGambitStacks > 0;

  applyDeathRollDamage();

  const participants = currentRoundParticipants(activeBots);
  const iposEntries = orderedPassiveEffectEntries("p58");
  if (iposEntries.length) {
    const rankedWorstGuessers = participants
      .map((participant, index) => ({ ...participant, order: index }))
      .filter((participant) => participant.distance > 0)
      .sort((left, right) => right.distance - left.distance || left.order - right.order)
      .slice(0, 3);
    iposEntries.forEach((entry) => {
      if (!rankedWorstGuessers.length) return;
      markPassiveEntryTriggered(entry);
      let blockedPlayerPenalty = false;
      rankedWorstGuessers.forEach((participant, index) => {
        const baseDamage = index === 0 ? 20 : 10;
        const damage = passiveEntryFlatDamage(entry, baseDamage);
        if (participant.kind === "player") {
          if (playerIgnoresWorstPenalty) {
            blockedPlayerPenalty = true;
          } else {
            addPlayerDamage(damage, "Seal of Ipos");
          }
        } else {
          addPendingTargetDifferenceBotDamage(botDamages, botDamageSources, participant.bot, damage, "Seal of Ipos", targetDiffEntries);
        }
      });
      round.roundEvents.push(
        `Seal of Ipos punished ${rankedWorstGuessers.map((participant) => participant.name).join(", ")} for the worst guesses.`
      );
      if (blockedPlayerPenalty) round.roundEvents.push("Seal of Andras blocked your worst guess penalty damage.");
    });
  } else {
    const worstDistance = participants.reduce((largest, participant) => Math.max(largest, participant.distance), -1);
    const worstGuessers = participants.filter((participant) => participant.distance === worstDistance && participant.distance > 0);
    if (worstGuessers.length) {
      let blockedPlayerPenalty = false;
      worstGuessers.forEach((participant) => {
        if (participant.kind === "player") {
          if (playerIgnoresWorstPenalty) {
            blockedPlayerPenalty = true;
          } else {
            addPlayerDamage(10, "Worst guess penalty");
          }
        } else {
          addPendingTargetDifferenceBotDamage(botDamages, botDamageSources, participant.bot, 10, "Worst guess penalty", targetDiffEntries);
        }
      });
      round.roundEvents.push(`${worstGuessers.map((participant) => participant.name).join(", ")} had the worst guess and took 10 damage.`);
      if (blockedPlayerPenalty) round.roundEvents.push("Seal of Andras blocked your worst guess penalty damage.");
    }
  }

  const criticals = findCriticalHits();
  round.criticalHitKeys = new Set(criticals.map((hitter) => hitter.key));
  const playerCritThisRound = criticals.some((hitter) => hitter.key === "player");
  if (playerCritThisRound) {
    round.selfStackingCriticalDamage = triggerSelfStackingSeal("p98");
    if (passiveStack("p6")) markPassiveTriggered("p6");
    if (passiveStack("p7")) markPassiveTriggered("p7");
    const paleHorseEntries = orderedPassiveEffectEntries("p77");
    if (paleHorseEntries.length) {
      paleHorseEntries.forEach((entry) => markPassiveEntryTriggered(entry));
      state.paleHorseBoostArmed = true;
      round.roundEvents.push("Seal of the Pale Horse armed next round's damage.");
    }
  }
  if (passiveStack("p91")) {
    if (playerCritThisRound) {
      const before = state.critMomentumBonus || 0;
      state.critMomentumBonus = Math.min(4, before + 1);
      markPassiveTriggered("p91");
      round.roundEvents.push(`${passiveName("p91", "Seal of Aim")} raised your CRITICAL range bonus to +${state.critMomentumBonus}.`);
    } else if (state.critMomentumBonus) {
      state.critMomentumBonus = 0;
      round.roundEvents.push(`${passiveName("p91", "Seal of Aim")} reset because you did not score CRITICAL.`);
    }
  } else {
    state.critMomentumBonus = 0;
  }
  let eligosBlockedCritical = false;
  criticals.forEach((hitter) => {
    const criticalSummary = criticalSummaryForHitter(hitter);
    round.roundEvents.push(`${hitter.name} hit CRITICAL ${round.criticalInteger} for ${criticalSummary}.`);
    getParticipants().forEach((victim) => {
      if (victim.key === hitter.key) return;
      const criticalDamage = criticalDamageForVictim(hitter, victim);
      if (victim.kind === "player") {
        if (hitter.kind === "bot" && passiveStack("p69")) {
          markPassiveTriggered("p69");
          eligosBlockedCritical = true;
          return;
        }
        addPlayerDamage(criticalDamage, `CRITICAL from ${hitter.name}`);
      } else {
        if (hitter.bot && botHasPassive(hitter.bot, "wideCrit")) return;
        addPendingBotDamage(
          botDamages,
          botDamageSources,
          victim.bot,
          criticalDamage,
          `CRITICAL from ${hitter.name}`,
          hitter.kind === "player"
        );
      }
    });
  });
  if (eligosBlockedCritical) round.roundEvents.push("Seal of Eligos blocked DAMNED CRITICAL damage against you.");

  applyOrderedPenaltyPassiveDamage(activeBots, botDamages, botDamageSources, addPlayerDamage, queuePlayerHeal);
  applyBaelRepeatedGuessDamage(activeBots, botDamages, botDamageSources);
  applyPendingBotDamageBatch(botDamages, botDamageSources, activeBots);

  const playerTargetDiffBaseDamage = Math.ceil(Math.abs(round.playerEffectiveGuess - round.target));
  let playerTargetDiffDamage = playerTargetDiffBaseDamage;
  if (round.edgeGambitStacks) playerTargetDiffDamage = Math.ceil(playerTargetDiffDamage * 0.5);
  round.playerTargetDifferenceDamage = playerTargetDiffDamage;
  addPlayerDamage(
    playerTargetDiffDamage,
    round.edgeGambitStacks ? "Target difference halved by Seal of Andras" : "Target difference"
  );
  const targetBotDamages = new Map();
  const targetBotDamageSources = new Map();
  const reactionBotDamages = new Map();
  const reactionBotDamageSources = new Map();
  state.bots
    .filter((bot) => bot.hp > 0 && !bot.eliminated)
    .forEach((bot) => {
      const damage = Math.ceil(Math.abs(round.botEffectiveGuesses.get(bot.id) - round.target));
      addPendingTargetDifferenceBotDamage(targetBotDamages, targetBotDamageSources, bot, damage, "Target difference", targetDiffEntries);
    });
  applyZeparAdjacentTargetDifferenceDamage(targetBotDamages, targetBotDamageSources);

  if (round.playerDamageReduction) {
    const beforeReduction = playerDamage;
    playerDamage = Math.ceil(playerDamage * (1 - round.playerDamageReduction));
    if (beforeReduction > playerDamage) {
      playerDamageSources.push({
        amount: beforeReduction - playerDamage,
        source: round.playerDamageReductionSource || "Damage reduction",
        kind: "saved"
      });
      round.roundEvents.push(`${round.playerDamageReductionSource || "Damage reduction"} reduced damage from ${beforeReduction} to ${playerDamage}.`);
    }
  }
  const memoryConversion = applyPlayerDamageMemoryConversion(playerDamage);
  playerDamage = memoryConversion.damage;
  if (memoryConversion.avoidedTotal > 0) {
    playerDamageSources.push({
      amount: memoryConversion.avoidedTotal,
      source: ITEMS.p22?.name || "Seal of Botis",
      kind: "saved"
    });
  }

  const appliedPlayerDamage = damagePlayer(playerDamage, null, false, false, null, false);
  if (appliedPlayerDamage > 0) {
    playerDamageSources.forEach((entry) => recordPlayerDamageSource(entry.amount, entry.source, entry.kind || ""));
    round.roundEvents.push(`You took ${appliedPlayerDamage} damage.`);
    applySpiteCircuitDamage(appliedPlayerDamage, reactionBotDamages, reactionBotDamageSources);
    applyPainEchoDamage(appliedPlayerDamage, reactionBotDamages, reactionBotDamageSources);
  } else {
    round.roundEvents.push("You took no damage.");
  }

  applyPendingBotDamageBatch(targetBotDamages, targetBotDamageSources, state.bots);
  applyPendingBotDamageBatch(reactionBotDamages, reactionBotDamageSources, state.bots);
  resolvePlayerDamageMemoryConversions(memoryConversion.conversions);

  if (state.player.hp <= 0) {
    finishGameOverRound();
    return;
  }

  queuedPlayerHeals.forEach((entry) => {
    healPlayer(entry.amount, entry.reason, entry.source);
  });

  applyEndOfRoundPassives();

  if (state.player.hp <= 0) {
    finishGameOverRound();
    return;
  }

  applyRoundEndBossPassiveDamage();

  if (state.player.hp <= 0) {
    finishGameOverRound();
    return;
  }

  applyRoundEliminationBonus();
  applyAgaresEarnedSinSpread();
  clearTemporaryBotSinBonuses();
  resolveDeferredPavlosEliminations();

  if (state.player.hp <= 0) {
    finishGameOverRound();
    return;
  }

  state.stage = "summary";
  addLog("Penalties applied. Advance when ready.");
}

function finishGameOverRound() {
  if (state.gameOver && state.stage === "ended") return;
  updateArcadeRecordsFromCurrentRun();
  removeArcadeRunSlot(state.currentRunSlotId);
  state.gameOver = true;
  state.inspectingGameOver = false;
  state.stage = "ended";
  state.pendingActive = null;
  state.currentRunSlotId = null;
  addLog("Game over. The table solved you first.");
}

function currentRoundParticipants(activeBotList = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated)) {
  const round = state.roundState;
  return [
    { kind: "player", key: "player", name: "You", guess: round.playerEffectiveGuess },
    ...activeBotList.map((bot) => ({
      kind: "bot",
      key: `bot-${bot.id}`,
      bot,
      name: bot.name,
      guess: round.botEffectiveGuesses.get(bot.id)
    }))
  ]
    .filter((participant) => Number.isFinite(participant.guess))
    .map((participant) => ({
      ...participant,
      distance: Math.ceil(Math.abs(participant.guess - round.target))
    }));
}

function getParticipants() {
  const round = state.roundState;
  const playerCritWindow = critWindowDetails("p6");
  const ascendedWindow = ascendingCritWindowBonus();
  const artifactWindow = Math.max(0, Math.ceil(round.artifactCriticalRangeBonus || 0));
  return [
    {
      key: "player",
      kind: "player",
      name: "You",
      guess: round.playerEffectiveGuess,
      window: playerCritWindow.guaranteed + ascendedWindow + artifactWindow,
      bonusWindowChance: playerCritWindow.chance,
      damage: 0
    },
    ...state.bots
      .filter((bot) => bot.hp > 0 && !bot.eliminated)
      .map((bot) => ({
        key: `bot-${bot.id}`,
        kind: "bot",
        bot,
        name: bot.name,
        guess: round.botEffectiveGuesses.get(bot.id),
        window: Math.max(eligosBotCriticalWindow("p69"), botHasPassive(bot, "wideCrit") ? 2 : 0),
        bonusWindowChance: 0,
        damage: 0
      }))
  ];
}

function criticalDamageForVictim(hitter, victim) {
  if (hitter.key === "player") {
    return playerCriticalDamageTotal(victim);
  }
  return maxHealthCriticalDamageForVictim(victim);
}

function maxHealthCriticalDamageForVictim(victim) {
  if (victim?.kind === "player") return Math.ceil(playerMaxHp() * 0.1);
  if (victim?.bot) return Math.ceil((victim.bot.maxHp || 0) * 0.1);
  return 10;
}

function playerCriticalFlatBonus() {
  return ascendingCritDamageBonus() + Math.max(0, Math.ceil(state.roundState?.selfStackingCriticalDamage || 0));
}

function playerCriticalDamageTotal(victim) {
  const base = passiveStack("p7") ? pressureSpikeDamage("p7") : maxHealthCriticalDamageForVictim(victim);
  return base + playerCriticalFlatBonus();
}

function criticalSummaryForHitter(hitter) {
  if (hitter.key !== "player") return "10% max HEALTH";
  const flatBonus = playerCriticalFlatBonus();
  if (passiveStack("p7")) return `${pressureSpikeDamage("p7") + flatBonus} damage`;
  return flatBonus > 0 ? `10% max HEALTH + ${flatBonus} damage` : "10% max HEALTH";
}

function findCriticalHits() {
  const rightInteger = state.roundState.criticalInteger;
  const participants = getParticipants();
  const hits = participants.filter((participant) => {
    if (!Number.isFinite(participant.guess)) return false;
    const distance = Math.abs(participant.guess - rightInteger);
    return distance <= participant.window || (distance <= participant.window + 1 && Math.random() < participant.bonusWindowChance);
  });
  if (passiveStack("p69") && hits.some((participant) => participant.kind === "bot")) {
    const player = participants.find((participant) => participant.key === "player");
    if (player && Number.isFinite(player.guess) && !hits.some((participant) => participant.key === "player")) {
      hits.push({ ...player, mirroredByEligos: true });
    }
    markPassiveTriggered("p69");
  }
  return hits;
}

function equalDamageSplit(totalDamage, targets) {
  const total = Math.max(0, Math.ceil(totalDamage));
  const liveTargets = targets.filter((bot) => bot && !bot.eliminated && bot.hp > 0);
  const allocations = new Map();
  if (total <= 0 || !liveTargets.length) return allocations;
  const base = Math.floor(total / liveTargets.length);
  let remainder = total - base * liveTargets.length;
  liveTargets.forEach((bot) => {
    const amount = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    if (amount > 0) allocations.set(bot.id, amount);
  });
  return allocations;
}

function applyExcessDamageSpread(eliminations) {
  const entries = orderedPassiveEffectEntries("p73");
  if (!entries.length) return;
  eliminations.forEach((fallen) => {
    const excess = Math.max(0, Math.ceil(fallen?.excessDamage || 0));
    if (excess <= 0) return;
    fallen.excessDamage = 0;
    entries.forEach((entry) => {
      const targets = activeBots().filter((bot) => bot.id !== fallen.id);
      if (!targets.length) return;
      const totalDamage = passiveEntryFlatDamage(entry, excess);
      if (totalDamage <= 0) return;
      const allocations = equalDamageSplit(totalDamage, targets);
      const hitTargets = targets.filter((bot) => (allocations.get(bot.id) || 0) > 0);
      if (!hitTargets.length) return;
      markPassiveEntryTriggered(entry);
      damageBots(
        hitTargets,
        (bot) => allocations.get(bot.id) || 0,
        (bot, dealt) => `Seal of Asmoday dealt ${dealt} excess damage to ${bot.name}.`,
        "Seal of Asmoday"
      );
      state.roundState.roundEvents.push(`Seal of Asmoday split ${totalDamage} excess damage from ${fallen.name}.`);
    });
  });
}

function resolveEliminatedBots(eliminated) {
  const freshEliminations = protectPavlosAcrossRound(
    eliminated.filter((bot) => bot && !bot.immortal && bot.hp <= 0 && !bot.eliminated)
  );
  if (!freshEliminations.length) return;
  const eliminatedIds = new Set(freshEliminations.map((bot) => bot.id));
  const dantreSources = activeBossesWithPower("dantre", eliminatedIds);

  freshEliminations.forEach((bot) => {
    const rewardDetails = bot.skipEliminationReward ? { amount: 0, sourceEntries: [] } : botRewardDetails(bot, true);
    const reward = rewardDetails.amount > 0 ? gainEliminationCreditsFromSourceEntries(rewardDetails.sourceEntries, true) : 0;
    state.eliminations += 1;
    state.killsSinceBossSpawn += 1;
    state.roundState.eliminationsThisRound += 1;
    state.roundState.eliminatedPersonalities.push(personalityType(bot));
    bot.eliminated = true;
    bot.deathCause = bot.deathCause || "ko";
    bot.deathNotice = bot.deathNotice || `${bot.name} -${bot.lastDamage || 0} KO`;
    state.roundState.roundEvents.push(
      reward > 0 ? `${bot.name} was eliminated. +${reward} SIN.` : `${bot.name} was eliminated. No SIN paid.`
    );

    dantreSources.forEach((dantre) => {
      const dantreDamage = damagePlayer(dantre.eliminationDamage || 0, `${dantre.name} dealt damage for the elimination.`);
      if (dantreDamage > 0) state.roundState.roundEvents.push(`${dantre.name} dealt ${dantreDamage} damage for the elimination.`);
    });

    applyKillRuleHealing(bot);

    if (bot.isBoss) {
      const previousPassiveLimit = passiveLimit();
      if (bot.countsAsBossProgress !== false) state.bossKills += 1;
      if (bot.goeticKey) {
        state.goeticBossKills += 1;
        if (state.goeticBossKills >= GOETIC_BOSS_TOTAL) {
          state.finalBossQueued = true;
          state.roundState.roundEvents.push("The seventy-two Goetic Seals are broken. Jesus and Satan approach.");
        }
      }
      const unlockedSlots = passiveLimit() - previousPassiveLimit;
      if (unlockedSlots > 0) {
        state.roundState.roundEvents.push(
          `Boss kill ${state.bossKills}: ${unlockedSlots} Seal slot${unlockedSlots === 1 ? "" : "s"} unlocked.`
        );
      }
    }

    applyEliminationPassives(bot);
    bot.pendingReplacementSpec = state.finalBossQueued ? null : nextBossSpecIfNeeded();
    if (!bot.pendingReplacementSpec) {
      bot.pendingReplacementInheritance = null;
      for (const entry of orderedPassiveEffectEntries("p86")) {
        bot.pendingReplacementInheritance = inheritedReplacementProfile(bot, entry);
        if (bot.pendingReplacementInheritance) break;
      }
      if (bot.pendingReplacementInheritance) {
        state.roundState.roundEvents.push(`${passiveName("p86", "Seal of Haures")} prepared ${bot.name}'s replacement to inherit their identity.`);
      }
    }
  });

  applyExcessDamageSpread(freshEliminations);

  const lambDeaths = freshEliminations.filter((bot) => botHasPassive(bot, "lamb")).length;
  if (lambDeaths) {
    const heal = 10 * lambDeaths;
    activeBots().forEach((bot) => healBot(bot, heal, "Pyros Gift: Seal of Sallos"));
  }

  checkRoundPentakillBonus();
}

function adjacentLivingBots(bot) {
  const index = state.bots.findIndex((candidate) => candidate.id === bot.id);
  if (index < 0) return [];
  return [state.bots[index - 1], state.bots[index + 1]].filter((candidate) => candidate && candidate.hp > 0 && !candidate.eliminated);
}

function applyStolasMemoryDeathTransfer(bot, entry) {
  const memory = Math.max(0, Math.ceil(bot?.memory?.length || 0));
  if (memory <= 0) return;
  markPassiveEntryTriggered(entry);

  if (memory <= 3) {
    const credits = passiveEntryScaledValue(entry, memory);
    const gained = gainEliminationCredits(credits, true, "Seal of Stolas");
    state.roundState.roundEvents.push(`Seal of Stolas paid ${gained} SIN from ${bot.name}'s low MEMORY.`);
    return;
  }

  const index = state.bots.findIndex((candidate) => candidate.id === bot.id);
  if (index < 0) return;
  const left = state.bots[index - 1];
  const right = state.bots[index + 1];
  const leftAlive = left && left.hp > 0 && !left.eliminated;
  const rightAlive = right && right.hp > 0 && !right.eliminated;
  if (!leftAlive && !rightAlive) {
    state.roundState.roundEvents.push(`Seal of Stolas found no adjacent DAMNED for ${bot.name}'s MEMORY.`);
    return;
  }

  const half = Math.ceil(memory / 2);
  const transfers = [];
  if (leftAlive && rightAlive) {
    transfers.push({ bot: left, amount: half });
    transfers.push({ bot: right, amount: Math.max(0, memory - half) });
  } else if (leftAlive) {
    transfers.push({ bot: left, amount: half });
  } else if (rightAlive) {
    transfers.push({ bot: right, amount: half });
  }

  let totalAdded = 0;
  transfers.forEach((transfer) => {
    if (transfer.amount <= 0) return;
    totalAdded += addBotMemory(transfer.bot, transfer.amount, "", { source: "Seal of Stolas" });
  });
  state.roundState.roundEvents.push(`Seal of Stolas transferred ${totalAdded} MEMORY from ${bot.name}.`);
}

function applyAdjacentDeathDamage(bot) {
  if (!passiveStack("p30")) return;
  const targets = adjacentLivingBots(bot);
  if (!targets.length) return;
  const damage = andrealphusDamage("p30");
  markPassiveTriggered("p30");
  damageBots(targets, damage, (target, dealt) => `Seal of Andrealphus dealt ${dealt} damage to ${target.name}.`, "Seal of Andrealphus");
}

function applyBountyGrowthOnDeath(bot) {
  if (!passiveStack("p32")) return;
  const targets = activeBots();
  if (!targets.length) return;
  markPassiveTriggered("p32");
  targets.forEach((target) => {
    const bonus = Math.ceil(randomInt(1, 2) * passivePower("p32"));
    changeBotSin(target, bonus, "", { triggerLossDamage: false, source: "Seal of Foras" });
    state.roundState.roundEvents.push(`Seal of Foras gave ${target.name} +${bonus} bounty.`);
  });
}

function applyBountyDetonation(bot) {
  if (!passiveStack("p33")) return;
  const targets = activeBots();
  if (!targets.length) return;
  const baseDamage = botRegularBounty(bot);
  const damage = flatDamageValue("p33", baseDamage);
  if (damage <= 0) return;
  markPassiveTriggered("p33");
  damageBots(targets, damage, (target, dealt) => `Seal of Marchosias dealt ${dealt} damage to ${target.name}.`, "Seal of Marchosias");
}

function checkRoundPentakillBonus() {
  const round = state.roundState;
  if (!round || round.pentakillAwarded || round.eliminationsThisRound < BOT_COUNT) return;
  round.pentakillAwarded = true;
  round.pentakillPopup = true;
  playPentakillSfx();
  recordRunPentakill();
  const healed = healPlayer(5, null, "PENTAKILL");
  const gained = gainCredits(8, false, "PENTAKILL");
  queueSelfStackingPentakillDamage();
  round.roundEvents.push(`PENTAKILL! Healed ${healed} and gained ${gained} SIN.`);
}

function applyKillRuleHealing(bot) {
  if (bot?.isBoss && botHasPassive(bot, "soullessness")) {
    const damage = bossPassiveDamage("soullessness");
    const dealt = damagePlayer(
      damage,
      null,
      true,
      true,
      BOSS_PASSIVES.soullessness.name
    );
    state.roundState.roundEvents.push(
      dealt > 0
        ? `${bot.name}'s ${BOSS_PASSIVES.soullessness.name} prevented the BOSS kill heal and dealt ${dealt} damage.`
        : `${bot.name}'s ${BOSS_PASSIVES.soullessness.name} prevented the BOSS kill heal.`
    );
    return;
  }
  const heal = bot?.isBoss ? 5 : 1;
  const source = bot?.isBoss ? "BOSS kill" : "DAMNED kill";
  const healed = healPlayer(heal, null, source);
  state.roundState.roundEvents.push(
    healed > 0 ? `${source} healed you for ${healed}.` : `${source} tried to heal you, but no health was recovered.`
  );
}

function replacePendingEliminations() {
  if (state.finalBossQueued) {
    enterFinalBossPhase();
    return;
  }
  const pairedBossSpecs = [];
  const normalReplacementIndexes = [];
  state.bots = state.bots.map((bot, index) => {
    if (!bot.eliminated) return bot;
    const bossSpec = bot.pendingReplacementSpec;
    const replacement = createBot({ boss: Boolean(bossSpec), bossSpec, inheritFrom: bot.pendingReplacementInheritance });
    if (bossSpec) {
      addLog(`${replacement.name} enters as a boss with ${botPassiveSummary(replacement)}.`);
      if (bossSpec.pairedBossSpec) pairedBossSpecs.push(bossSpec.pairedBossSpec);
    } else {
      normalReplacementIndexes.push(index);
    }
    return replacement;
  });
  pairedBossSpecs.forEach((bossSpec) => {
    const replacementIndex = normalReplacementIndexes.shift();
    const fallbackIndex = state.bots.findIndex((bot) => bot && !bot.isBoss && !bot.eliminated);
    const slotIndex = replacementIndex !== undefined ? replacementIndex : fallbackIndex;
    const replacement = createBot({ boss: true, bossSpec });
    if (slotIndex >= 0) {
      state.bots[slotIndex] = replacement;
    } else {
      state.bots.push(replacement);
    }
    addLog(`${replacement.name} enters beside Petros with ${botPassiveSummary(replacement)}.`);
  });
}

function applyRoundEliminationBonus() {
  const entries = orderedPassiveEffectEntries("p13");
  if (!entries.length) return;
  const round = state.roundState;
  if (round.multiEliminationBonusPaid || round.eliminationsThisRound < 2) return;
  round.multiEliminationBonusPaid = true;
  const counts = new Map();
  (round.eliminatedPersonalities || []).forEach((type) => counts.set(type, (counts.get(type) || 0) + 1));
  const samePersonalityPair = Array.from(counts.values()).some((count) => count >= 2);
  entries.forEach((entry) => {
    const base = samePersonalityPair ? 16 : 8;
    const credits = passiveEntryScaledValue(entry, base);
    if (credits <= 0) return;
    markPassiveEntryTriggered(entry);
    const gained = gainCredits(credits, true, "Seal of Bune");
    round.roundEvents.push(
      samePersonalityPair
        ? `Seal of Bune paid ${gained} SIN for same-personality eliminations.`
        : `Seal of Bune paid ${gained} SIN for multiple eliminations.`
    );
  });
}

function nextBossSpecIfNeeded() {
  if (state.finalBossPhase || state.finalBossQueued) return null;

  if (state.bossQueued) {
    const bossSpec = takeNextBossSpec();
    if (!bossSpec) return null;
    state.bossQueued = false;
    state.killsSinceBossSpawn = 0;
    return bossSpec;
  }

  if (state.killsSinceBossSpawn >= ENDLESS_BOSS_INTERVAL) {
    const bossSpec = takeNextBossSpec();
    if (!bossSpec) return null;
    state.killsSinceBossSpawn = 0;
    return bossSpec;
  }
  return null;
}

function allSpecialBossesKilled() {
  return (state.bossKills || 0) >= UNIQUE_BOSS_KEYS.length;
}

function takeNextBossSpec() {
  if (state.uniqueBossQueue.length) {
    return uniqueBossSpecFromKey(state.uniqueBossQueue.shift());
  }
  if (!allSpecialBossesKilled()) return null;
  if (state.goeticBossQueue.length) {
    return { goeticKey: state.goeticBossQueue.shift() };
  }
  if (state.goeticBossKills >= GOETIC_BOSS_TOTAL) {
    state.finalBossQueued = true;
  }
  return null;
}

function applyEliminationPassives(bot) {
  applySelfStackingRevealedDeath(bot);
  applySelfStackingStubbornDeath(bot);
  orderedPassiveEffectEntries(["p9", "p11", "p19", "p30", "p32", "p33", "p34", "p38", "p42", "p53", "p87", "p88", "p108"]).forEach((entry) => {
    if (entry.id === "p9") {
      queueMarbasNextRoundSpread(entry);
      return;
    }

    if (entry.id === "p11") {
      markPassiveEntryTriggered(entry);
      for (let draw = 0; draw < entry.stack; draw += 1) {
        if (state.player.actives.length >= activeInventoryLimit()) {
        state.roundState.roundEvents.push("Seal of Valefor found an Artifact, but your Artifact inventory is full.");
          return;
        }
        const active = freeActiveCopy(randomFrom(ACTIVE_IDS));
        state.player.actives.push(active);
      state.roundState.roundEvents.push(`Seal of Valefor found ${active.name}.`);
      }
      normalizeActiveCarouselIndex();
      return;
    }

    if (entry.id === "p19") {
      const targets = activeBots();
      const damage = passiveEntryFlatDamage(entry, 5);
      if (targets.length && damage > 0) {
        markPassiveEntryTriggered(entry);
        damageBots(targets, damage, (target, dealt) => `Seal of Sabnock dealt ${dealt} damage to ${target.name}.`, "Seal of Sabnock");
      }
      return;
    }

    if (entry.id === "p30") {
      const targets = adjacentLivingBots(bot);
      const damage = andrealphusDamage(entry);
      if (targets.length && damage > 0) {
        markPassiveEntryTriggered(entry);
        damageBots(targets, damage, (target, dealt) => `Seal of Andrealphus dealt ${dealt} damage to ${target.name}.`, "Seal of Andrealphus");
      }
      return;
    }

    if (entry.id === "p32") {
      const targets = activeBots();
      if (targets.length) {
        markPassiveEntryTriggered(entry);
        targets.forEach((target) => {
          const bonus = Math.ceil(randomInt(1, 2) * passiveEntryPower(entry));
          changeBotSin(target, bonus, "", { triggerLossDamage: false, source: "Seal of Foras" });
          state.roundState.roundEvents.push(`Seal of Foras gave ${target.name} +${bonus} bounty.`);
        });
      }
      return;
    }

    if (entry.id === "p33") {
      const targets = activeBots();
      const baseDamage = botRegularBounty(bot);
      const damage = passiveEntryFlatDamage(entry, baseDamage);
      if (targets.length && damage > 0) {
        markPassiveEntryTriggered(entry);
        damageBots(targets, damage, (target, dealt) => `Seal of Marchosias dealt ${dealt} damage to ${target.name}.`, "Seal of Marchosias");
      }
      return;
    }

    if (entry.id === "p34") {
      if (botRegularBounty(bot) < 6) return;
      markPassiveEntryTriggered(entry);
      const target = highestHealthEnemy();
      const damage = passiveEntryFlatDamage(entry, 10);
      const bounty = passiveEntryScaledValue(entry, 1);
      if (target && damage > 0) {
        damageBot(target, damage, `Seal of Gremory dealt ${damage} damage to ${target.name}.`, "Seal of Gremory");
      }
      if (target && bounty > 0) {
        changeBotSin(target, bounty, `Seal of Gremory gave ${target.name} +${bounty} BOUNTY.`, {
          source: "Seal of Gremory"
        });
      }
      state.roundState.roundEvents.push(
        target
          ? `Seal of Gremory struck ${target.name} for ${damage} and gave +${bounty} BOUNTY.`
          : "Seal of Gremory triggered, but no enemy could be struck."
      );
      return;
    }

    if (entry.id === "p38") {
      if (!bot.markedByPlayer) return;
      markPassiveEntryTriggered(entry);
      const normalBounty = botRegularBounty(bot);
      const totalTarget = Math.max(Math.ceil(normalBounty * 2 * passiveEntryPower(entry)), passiveEntryScaledValue(entry, 6));
      const bonus = Math.max(0, totalTarget - normalBounty);
      if (bonus > 0) {
        const gained = gainEliminationCredits(bonus, true, "Seal of Astaroth");
        state.roundState.roundEvents.push(`Seal of Astaroth paid ${gained} bonus SIN from ${bot.name}.`);
      }
      applyPassivePlayerHealForEntry(entry, 5, "Seal of Astaroth");
      return;
    }

    if (entry.id === "p42") {
      applyStolasMemoryDeathTransfer(bot, entry);
      return;
    }

    if (entry.id === "p87") {
      const targets = samePersonalityBots(bot);
      const damage = passiveEntryFlatDamage(entry, 30);
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      const name = passiveName("p87", "Seal of Purson");
      damageBots(targets, damage, (target, dealt) => `${name} dealt ${dealt} damage to ${target.name}.`, name);
      return;
    }

    if (entry.id === "p88") {
      const bounty = botRegularBounty(bot);
      if (bounty <= 0) return;
      const half = passiveEntryScaledValue(entry, Math.ceil(bounty / 2));
      const bonusGain = passiveEntryScaledValue(entry, bounty);
      const targets = samePersonalityBots(bot).filter((target) => !target.immortal);
      let changed = 0;
      targets.forEach((target) => {
        const result = changeBotSin(target, half, "", { triggerLossDamage: false, source: passiveName("p88", "Seal of Raum") });
        changed += result.gained;
      });
      const name = passiveName("p88", "Seal of Raum");
      const gained = gainEliminationCredits(bonusGain, true, name);
      markPassiveEntryTriggered(entry);
      state.roundState.roundEvents.push(`${name} added ${changed} BOUNTY to matching DAMNED and paid ${gained} SIN.`);
      return;
    }

    if (entry.id === "p108") {
      if (personalityType(bot) !== "Stubborn") return;
      const targets = activeBots().filter((target) => target.isBoss);
      const damage = passiveEntryFlatDamage(entry, 30);
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      const name = passiveName("p108", "Seal of Orobas");
      damageBots(targets, damage, (target, dealt) => `${name} dealt ${dealt} damage to ${target.name}.`, name);
      return;
    }

    if (entry.id === "p53") {
      if (bot.isBoss || !bot.memory?.length) return;
      const bonus = Math.ceil(bot.memory.length * passiveEntryPower(entry));
      if (bonus <= 0) return;
      markPassiveEntryTriggered(entry);
      const gained = gainEliminationCredits(bonus, true, "Seal of Samigina");
      state.roundState.roundEvents.push(`Seal of Samigina paid ${gained} memory SIN from ${bot.name}.`);
    }
  });
}

function applyEndOfRoundPassiveDamageInOrder() {
  orderedPassiveEffectEntries(["p1", "p12", "p17", "p52", "p21", "p31", "p40", "p56", "p111", "p61", "p65", "p84", "p85", "p89", "p105", "p106"]).forEach((entry) => {
    if (entry.id === "p1") {
      const targets = activeBots().filter((bot) => bot.memory.length > 0);
      if (!targets.length) return;
      markPassiveEntryTriggered(entry);
      damageBots(
        targets,
        (bot) => passiveEntryFlatDamage(entry, bot.memory.length),
        (bot, damage) => `Seal of Vassago dealt ${damage} damage to ${bot.name}.`,
        "Seal of Vassago"
      );
      return;
    }

    if (entry.id === "p12") {
      const damage = passiveEntryFlatDamage(entry, Math.floor(state.player.credits / 10) * 2);
      if (damage <= 0) return;
      const targets = activeBots();
      if (!targets.length) return;
      markPassiveEntryTriggered(entry);
      damageBots(targets, damage, (bot, dealt) => `Seal of Belial dealt ${dealt} damage to ${bot.name}.`, "Seal of Belial");
      return;
    }

    if (entry.id === "p17") {
      const living = activeBots();
      const bosses = living.filter((bot) => bot.isBoss);
      const targets = bosses.length ? bosses : shuffled(living).slice(0, 1);
      const memorySources = bosses.length ? state.bots.filter((bot) => !bot.isBoss) : state.bots;
      const memorySum = memorySources.reduce((sum, bot) => sum + (bot.memory?.length || 0), 0);
      const damage = passiveEntryFlatDamage(entry, memorySum);
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      damageBots(
        targets,
        damage,
        (bot, damage) => `Seal of Dantalion dealt ${damage} damage to ${bot.name}.`,
        "Seal of Dantalion"
      );
      return;
    }

    if (entry.id === "p52") {
      const targets = activeBots().filter((bot) => (bot.memory?.length || 0) > 0);
      if (!targets.length) return;
      markPassiveEntryTriggered(entry);
      damageBots(
        targets,
        (bot) => decarabiaMemoryExtraDamage(entry, bot),
        (bot, damage) => `Seal of Decarabia dealt ${damage} MEMORY damage to ${bot.name}.`,
        "Seal of Decarabia"
      );
      return;
    }

    if (entry.id === "p21") {
      const spent = state.roundState?.rerollSinSpentThisRound || 0;
      const damage = shaxRerollDamage(entry, spent);
      const targets = activeBots();
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      damageBots(targets, damage, (bot, dealt) => `Seal of Shax dealt ${dealt} reroll damage to ${bot.name}.`, "Seal of Shax");
      state.roundState.roundEvents.push(`Seal of Shax turned ${spent} reroll SIN into ${damage} damage.`);
      return;
    }

    if (entry.id === "p31") {
      const targets = activeBots();
      if (!targets.length) return;
      const murmurTargets = shuffled(targets).slice(0, Math.min(2, targets.length));
      markPassiveEntryTriggered(entry);
      murmurTargets.forEach((target) => {
        const baseDamage = botRegularBounty(target);
        const damage = passiveEntryFlatDamage(entry, baseDamage);
        if (damage <= 0) return;
        damageBot(target, damage, `Seal of Murmur dealt ${damage} damage to ${target.name}.`, "Seal of Murmur");
      });
      return;
    }

    if (entry.id === "p40") {
      const livingBounty = activeBots().reduce((sum, bot) => sum + botRegularBounty(bot), 0);
      const damage = passiveEntryFlatDamage(entry, livingBounty / 2);
      const targets = activeBots();
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      damageBots(targets, damage, (bot, dealt) => `Seal of Focalor dealt ${dealt} damage to ${bot.name}.`, "Seal of Focalor");
      return;
    }

    if (entry.id === "p56") {
      const targets = activeBots();
      const totalDamage = halphasRoundBossDamage();
      const eliteCredits = halphasEliteCredits(entry);
      if (!targets.length && eliteCredits <= 0) return;
      if (targets.length && totalDamage > 0) {
        const allocations = randomDamageSpread(totalDamage, targets, true);
        const hitTargets = targets.filter((bot) => (allocations.get(bot.id) || 0) > 0);
        markPassiveEntryTriggered(entry);
        damageBots(
          hitTargets,
          (bot) => allocations.get(bot.id) || 0,
          (bot, dealt) => `Seal of Halphas dealt ${dealt} random-spread damage to ${bot.name}.`,
          "Seal of Halphas"
        );
        state.roundState.roundEvents.push(`Seal of Halphas spread ${totalDamage} damage across the table.`);
      }
      if (eliteCredits > 0) {
        markPassiveEntryTriggered(entry);
        const gained = gainCredits(eliteCredits, true, "Seal of Halphas ELITE");
        state.roundState.roundEvents.push(`Seal of Halphas ELITE paid ${gained} SIN.`);
      }
      return;
    }

    if (entry.id === "p111") {
      const targets = activeBots();
      if (!targets.length) return;
      const roll = satanSealDamageRoll(entry);
      entry.item.lastSatanDivisor = roll.divisor;
      entry.item.lastSatanMaxDivisor = roll.maxDivisor;
      entry.item.lastSatanDamage = roll.damage;
      markPassiveEntryTriggered(entry);
      const name = passiveName("p111", "Seal of Satan");
      damageBots(targets, roll.damage, (bot, dealt) => `${name} dealt ${dealt} damage to ${bot.name} by dividing 666 by ${roll.divisor}.`, name);
      state.roundState.roundEvents.push(`${name} current divisor: ${roll.divisor}. Damage: ${roll.damage}.`);
      return;
    }

    if (entry.id === "p61") {
      const targets = activeBots().filter((bot) => (bot.poisonCounters || 0) > 0);
      if (!targets.length) return;
      const percent = poisonPercentPerCounter(entry);
      markPassiveEntryTriggered(entry);
      damageBots(
        targets,
        (bot) => Math.ceil((bot.maxHp || 0) * (percent / 100) * (bot.poisonCounters || 0)),
        (bot, dealt) => `Seal of Vepar dealt ${dealt} poison damage to ${bot.name}.`,
        "Seal of Vepar"
      );
      return;
    }

    if (entry.id === "p65") {
      const round = state.roundState;
      const targets = activeBots().filter((bot) => bot.revealedByPassive && Number.isFinite(round.botEffectiveGuesses.get(bot.id)));
      if (!targets.length) return;
      markPassiveEntryTriggered(entry);
      damageBots(
        targets,
        (bot) => passiveEntryFlatDamage(entry, Math.ceil((round.botEffectiveGuesses.get(bot.id) || 0) / 2)),
        (bot, dealt) => `Seal of Naberius dealt ${dealt} damage to ${bot.name}'s revealed guess.`,
        "Seal of Naberius"
      );
      return;
    }

    if (entry.id === "p84") {
      applyAstarothRevealedTargetDifferenceEcho(entry);
      return;
    }

    if (entry.id === "p85") {
      const living = activeBots();
      if (!living.length) return;
      const damages = new Map();
      living.forEach((bot) => {
        const matching = living.filter((candidate) => candidate.id !== bot.id && personalityType(candidate) === personalityType(bot)).length;
        const damage = passiveEntryFlatDamage(entry, matching * 10);
        if (damage > 0) damages.set(bot.id, damage);
      });
      const targets = living.filter((bot) => (damages.get(bot.id) || 0) > 0);
      if (!targets.length) return;
      markPassiveEntryTriggered(entry);
      const name = passiveName("p85", "Seal of Berith");
      damageBots(
        targets,
        (bot) => damages.get(bot.id) || 0,
        (bot, dealt) => `${name} dealt ${dealt} damage to ${bot.name}.`,
        name
      );
      return;
    }

    if (entry.id === "p89") {
      const targets = activeBots().filter((bot) => {
        const index = state.bots.findIndex((candidate) => candidate.id === bot.id);
        const left = state.bots[index - 1];
        const right = state.bots[index + 1];
        return left && right && left.hp > 0 && right.hp > 0 && !left.eliminated && !right.eliminated && personalityType(left) === personalityType(right);
      });
      const damage = passiveEntryFlatDamage(entry, 5);
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      const name = passiveName("p89", "Seal of Marax");
      damageBots(targets, damage, (bot, dealt) => `${name} dealt ${dealt} adjacency damage to ${bot.name}.`, name);
      return;
    }

    if (entry.id === "p105") {
      const stubbornCount = activeBots().filter((bot) => personalityType(bot) === "Stubborn").length;
      const targets = activeBots().filter((bot) => bot.isBoss);
      const damage = passiveEntryFlatDamage(entry, stubbornCount * 5);
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      const name = passiveName("p105", "Seal of Andras");
      damageBots(targets, damage, (bot, dealt) => `${name} dealt ${dealt} STUBBORN toll damage to ${bot.name}.`, name);
      return;
    }

    if (entry.id === "p106") {
      const living = activeBots();
      const type = mostPrevalentPersonality();
      if (!living.length || !type) return;
      const targets = living.filter((bot) => personalityType(bot) === type);
      const damage = passiveEntryFlatDamage(entry, targets.length * 5);
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      const name = passiveName("p106", "Seal of Zagan");
      damageBots(targets, damage, (bot, dealt) => `${name} dealt ${dealt} ${type} damage to ${bot.name}.`, name);
    }
  });
}

function applyEndOfRoundPassives() {
  const round = state.roundState;
  if (!round) return;
  round.resolvingEndOfRoundPassives = true;
  try {
    applyQueuedEndOfRoundBotDamage();
    applyPendingSelfStackingPentakillDamage();
    applyEndOfRoundPassiveDamageInOrder();

    const relicStacks = passiveStack("p18");
    if (relicStacks) {
      const relic = passiveEntry("p18");
      relic.saleBonus = (relic.saleBonus || 0) + scaledPassiveValue("p18", 3);
      markPassiveTriggered("p18");
      state.roundState.roundEvents.push(`Seal of Berith sell value rose by ${scaledPassiveValue("p18", 3)}.`);
    }

    const repairStacks = passiveStack("p8");
    if (repairStacks) {
      markPassiveTriggered("p8");
      applyPassivePlayerHeal("p8", 5, "Seal of Buer");
    }

    activeBots().forEach((bot) => {
      if (botHasPassive(bot, "metabolism")) healBot(bot, 5, `${bot.name}'s Pyros Gift: Seal of Bathin`);
      if (botHasPassive(bot, "fumes")) damagePlayer(1, `${bot.name}'s Pyros Gift: Seal of Amon dealt 1 damage to you.`);
      if (botHasPassive(bot, "thief")) {
        loseCredits(1, `${bot.name}'s Pyros Gift: Seal of Raum`);
      }
    });

    applyEndOfRoundBotSinPassives();
    applyForcedDoctrineEndRound();
    applyInflationEngine();
    applySelfStackingBountySumDamage();
    applyLowProfileReward();
    applyPursonReward();
    applyPandoriumContractCleanup();
    clearMarkedProspects();
  } finally {
    round.resolvingEndOfRoundPassives = false;
  }
}

function applyBountyReaper() {
  if (!passiveStack("p31")) return;
  const targets = activeBots();
  if (!targets.length) return;
  markPassiveTriggered("p31");
  shuffled(targets)
    .slice(0, Math.min(2, targets.length))
    .forEach((target) => {
      const baseDamage = botRegularBounty(target);
      const damage = flatDamageValue("p31", baseDamage);
      if (damage <= 0) return;
      damageBot(target, damage, `Seal of Murmur dealt ${damage} damage to ${target.name}.`, "Seal of Murmur");
    });
}

function applyInflationEngine() {
  const entries = orderedPassiveEffectEntries("p35");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const targets = activeBots()
      .filter((bot) => !bot.immortal)
      .sort((left, right) => botSin(right) - botSin(left) || left.id - right.id)
      .slice(0, 2);
    if (!targets.length) return;
    const bonus = Math.max(1, entry.stack || 1);
    markPassiveEntryTriggered(entry);
    let totalBonus = 0;
    targets.forEach((bot) => {
      const result = changeBotSin(bot, bonus, `Seal of Forneus gave ${bot.name} +${bonus} bounty.`, {
        triggerLossDamage: false
      });
      totalBonus += result.gained;
    });
    if (totalBonus > 0) state.roundState.roundEvents.push(`Seal of Forneus added ${totalBonus} total BOUNTY to the two richest DAMNED.`);
  });
}

function applyEndOfRoundBotSinPassives() {
  applyRaumEndOfRoundLoss();
  applyRonoveDrain();
  applyAndromaliusLowSinEliminations();
}

function applyRaumEndOfRoundLoss() {
  const entries = orderedPassiveEffectEntries("p43");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const loss = 1;
    markPassiveEntryTriggered(entry);
    activeBots().forEach((bot) => {
      changeBotSin(bot, -loss, `Seal of Raum made ${bot.name} lose ${loss} SIN.`);
    });
  });
}

function applyRonoveDrain() {
  const entries = orderedPassiveEffectEntries("p47");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const targetCount = Math.max(1, entry.stack || 1);
    const targets = activeBots()
      .filter((bot) => !bot.immortal && botSin(bot) > 0)
      .sort((left, right) => botSin(right) - botSin(left) || left.id - right.id)
      .slice(0, targetCount);
    if (!targets.length) return;
    markPassiveEntryTriggered(entry);
    targets.forEach((bot) => {
      const lost = Math.floor(botSin(bot) / 2);
      if (lost <= 0) return;
      changeBotSin(bot, -lost, `Seal of Ronove drained ${lost} SIN from ${bot.name}.`);
      const gained = gainCredits(lost * 2, false, "Seal of Ronove");
      state.roundState.roundEvents.push(`Seal of Ronove paid ${gained} SIN from ${lost} drained SIN.`);
    });
  });
}

function applyAndromaliusLowSinEliminations() {
  const entries = orderedPassiveEffectEntries("p44");
  if (!entries.length) return;
  const bountyLimit = Math.max(...entries.map((entry) => andromaliusBountyLimit(entry)));
  const targets = activeBots().filter((bot) => !bot.isBoss && !bot.immortal && botSin(bot) <= bountyLimit);
  if (!targets.length) return;
  entries.forEach((entry) => markPassiveEntryTriggered(entry));
  const targetIds = new Set(targets.map((bot) => bot.id));
  targets.forEach((bot) => {
    const transferred = botSin(bot);
    const recipient = activeBots()
      .filter((candidate) => !candidate.immortal && !targetIds.has(candidate.id))
      .sort((left, right) => botSin(right) - botSin(left) || left.id - right.id)[0];
    if (recipient && transferred > 0) {
      changeBotSin(recipient, transferred, `Seal of Andromalius gave ${bot.name}'s ${transferred} SIN to ${recipient.name}.`, {
        triggerLossDamage: false
      });
    }
    bot.skipEliminationReward = true;
    bot.hp = 0;
    bot.deathCause = "sin-judgment";
    state.roundState.roundEvents.push(`Seal of Andromalius eliminated ${bot.name} for having ${botSin(bot)} SIN.`);
  });
  resolveEliminatedBots(targets);
}

function applyLowProfileReward() {
  if (!passiveStack("p37") || state.player.hp <= 0) return;
  const targetDamage = Math.max(0, Math.ceil(state.roundState?.playerTargetDifferenceDamage || 0));
  if (targetDamage > 4) return;
  const credits = lowProfileRewardSin("p37");
  const gained = gainCredits(credits, true, "Seal of Malphas");
  markPassiveTriggered("p37");
  state.roundState.roundEvents.push(`Seal of Malphas paid ${gained} SIN for taking ${targetDamage} TARGET-difference damage.`);
}

function applyPursonReward() {
  const ledger = passiveEntry("p39");
  if (!ledger || !passiveStack("p39")) return;
  if (!state.roundState.shopItemBoughtThisRound) {
    ledger.counter = (ledger.counter || 0) + 1;
    state.roundState.roundEvents.push(`Seal of Purson gained a stack (${ledger.counter}).`);
  }
  const credits = Math.ceil((ledger.counter || 0) * passivePower("p39"));
  if (credits <= 0) return;
  const gained = gainCredits(credits, false, "Seal of Purson");
  markPassiveTriggered("p39");
  state.roundState.roundEvents.push(`Seal of Purson paid ${gained} SIN.`);
}

function applyPandoriumContractCleanup() {
  if (!passiveStack("p36")) return;
  const targets = activeBots().filter((bot) => !bot.isBoss);
  if (!targets.length) return;
  markPassiveTriggered("p36");
  targets.forEach((bot) => {
    eraseBotWithoutReward(bot, `Seal of Asmoday erased ${bot.name} without SIN or KO count.`, "contract");
  });
}

function clearTemporaryBotSinBonuses() {
  const bonuses = state.roundState?.temporaryBotSinBonuses || [];
  if (!bonuses.length) return;
  bonuses
    .slice()
    .reverse()
    .forEach((bonus) => {
      const bot = state.bots.find((candidate) => candidate.id === bonus.botId);
      if (!bot || bot.eliminated || bonus.amount <= 0) return;
      changeBotSin(bot, -bonus.amount, "", {
        triggerLossDamage: false,
        triggerGainDamage: false,
        source: "Seal of Cimejes expired"
      });
    });
  state.roundState.temporaryBotSinBonuses = [];
}

function clearMarkedProspects() {
  state.bots.forEach((bot) => {
    if (!bot.eliminated) bot.markedByPlayer = false;
  });
}

function advanceAfterSummary() {
  if (state.stage !== "summary") return;
  clearDevTemporaryArtifacts();
  rememberRound();
  if (state.player.hp <= 0) {
    finishGameOverRound();
    render();
    return;
  }
  state.previousRoundEliminationsForMartyrs = state.roundState?.eliminationsThisRound || 0;
  state.round += 1;
  replacePendingEliminations();
  state.rerollBaseCost = 1;
  rerollShop();
  beginRound();
  render();
}

