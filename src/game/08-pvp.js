function pvpInitialState() {
  return {
    stage: "lobby",
    round: 0,
    slots: Array.from({ length: PVP_SLOT_COUNT }, (_, slot) => null),
    modifier: pvpRollModifier(),
    previousTarget: null,
    previousAverage: null,
    previousModifier: null,
    baseTarget: null,
    finalTarget: null,
    tableAverage: null,
    finalAverage: null,
    targetOffset: 0,
    removedIds: new Set(),
    criticalHitIds: new Set(),
    finalCriticalHitIds: new Set(),
    activeResults: [],
    log: [],
    winner: null,
    forceModifierNextRound: false,
    modifierRoundsSinceChange: 0,
    waitForHost: false,
    autoKey: null,
    autoDueAt: null,
    onlineRoom: null,
    removedRemoteIds: new Set()
  };
}

function pvpParticipant(slot, name, human = true, remoteId = null) {
  return {
    id: remoteId || `local-${slot}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    slot,
    name: name || `Player ${slot + 1}`,
    human,
    remoteId,
    color: randomFrom(BOT_ARCHETYPES).color,
    image: randomBotImage(),
    hp: PVP_MAX_HP,
    maxHp: PVP_MAX_HP,
    eliminated: false,
    guess: null,
    firstPhaseGuess: null,
    activeOptions: [],
    activeChoiceId: null,
    activeTargetId: null,
    activeCast: null,
    activeResolved: false,
    activeGuaranteeThisRound: false,
    activeGuaranteeNextRound: false,
    damageReduction: 0,
    roundStartHp: null,
    aliveAtRoundStart: false,
    lastDamage: 0,
    damageSources: [],
    critical: false
  };
}

function pvpBot(slot) {
  const profile = randomBotProfile();
  return {
    ...pvpParticipant(slot, profile.name, false),
    name: profile.name,
    country: profile.country,
    flag: profile.flag
  };
}

function pvpActiveById(id) {
  if (id === PVP_SKIP_ACTIVE.id) return PVP_SKIP_ACTIVE;
  return PVP_ACTIVES.find((active) => active.id === id) || PVP_ACTIVES[0];
}

function pvpSelectableActives(participant) {
  return [...(participant?.activeOptions || []), PVP_SKIP_ACTIVE];
}

function pvpAliveParticipants() {
  return state.pvp.slots.filter((participant) => participant && !participant.eliminated && participant.hp > 0);
}

function pvpHumanParticipants() {
  return pvpAliveParticipants().filter((participant) => participant.human);
}

function pvpAddLog(message) {
  if (!state.pvp) return;
  state.pvp.log.unshift(normalizeGameText(message));
  state.pvp.log = state.pvp.log.slice(0, 8);
}

function pvpClearAutoTimer() {
  if (pvpAutoTimer) clearTimeout(pvpAutoTimer);
  pvpAutoTimer = null;
  if (state.pvp) {
    state.pvp.autoKey = null;
    state.pvp.autoDueAt = null;
  }
}

function pvpScheduleAuto(key, delay, callback) {
  const pvp = state.pvp;
  if (!pvp || pvp.waitForHost || typeof setTimeout !== "function") return;
  if (pvpAutoTimer && pvp.autoKey === key) return;
  pvpClearAutoTimer();
  pvp.autoKey = key;
  pvp.autoDueAt = Date.now() + delay;
  pvpAutoTimer = setTimeout(() => {
    if (!state.pvp || state.pvp.autoKey !== key || state.pvp.waitForHost) return;
    pvpClearAutoTimer();
    callback();
  }, delay);
}

function pvpMaybeAutoAdvance() {
  const pvp = state.pvp;
  if (!pvp || state.mode !== "pvp") return;
  if (pvp.waitForHost) {
    pvpClearAutoTimer();
    return;
  }
  if (pvp.stage === "guess" && pvpAllGuessesReady()) {
    pvpScheduleAuto(`guess-${pvp.round}`, PVP_PHASE_AUTO_DELAY, pvpPrepareActivePhase);
    return;
  }
  if (pvp.stage === "active" && pvpAllActivesReady()) {
    pvpScheduleAuto(`active-${pvp.round}`, PVP_PHASE_AUTO_DELAY, pvpResolveActives);
    return;
  }
  if (pvp.stage === "summary") {
    pvpScheduleAuto(`summary-${pvp.round}`, PVP_SUMMARY_AUTO_DELAY, pvpNextRound);
    return;
  }
  pvpClearAutoTimer();
}

function pvpToggleWait() {
  if (!state.pvp) return;
  state.pvp.waitForHost = !state.pvp.waitForHost;
  if (state.pvp.waitForHost) {
    pvpClearAutoTimer();
    pvpAddLog("Wait is on. Host signal required.");
  } else {
    pvpAddLog("Wait is off. Auto flow resumed.");
    pvpMaybeAutoAdvance();
  }
  pvpPostHostState();
  render();
}

function startPvpMode() {
  if (isNativeArcadeApp()) {
    showMainMenu();
    return;
  }
  resumeSoundtrack();
  pvpClearAutoTimer();
  state.mode = "pvp";
  state.pauseOpen = false;
  state.pvp = pvpInitialState();
  pvpAddLog("PvP lobby opened. Add or remove slots before starting.");
  pvpHostResetRoom();
  pvpStartHostPolling();
  render();
}

function pvpLocalServerUrl() {
  return "http://localhost:5177";
}

function pvpShouldAutoStartFromHash() {
  return typeof location !== "undefined" && location.hash === "#pvp" && !isNativeArcadeApp();
}

async function pvpOpenServedHostIfAvailable() {
  if (typeof location === "undefined" || location.protocol !== "file:" || typeof fetch !== "function") return false;
  const url = pvpLocalServerUrl();
  try {
    await fetch(`${url}/api/room`, { cache: "no-store", mode: "no-cors" });
    window.location.href = `${url}/#pvp`;
    return true;
  } catch (error) {
    return false;
  }
}

async function requestPvpMode() {
  if (isNativeArcadeApp()) {
    showMainMenu();
    return;
  }
  if (await pvpOpenServedHostIfAvailable()) return;
  startPvpMode();
  if (!pvpServerEnabled()) pvpAddLog("Phone server is not running. Browser security cannot start it from a local file.");
}

function restartPvpMode() {
  resumeSoundtrack();
  pvpClearAutoTimer();
  state.pauseOpen = false;
  state.pvp = pvpInitialState();
  pvpAddLog("PvP restarted.");
  pvpHostResetRoom();
  pvpStartHostPolling();
  render();
}

function switchToArcadeMode() {
  pvpClearAutoTimer();
  pvpStopHostPolling();
  state.pauseOpen = false;
  state.pvp = null;
  startGame();
}

function pvpNormalizeSlots() {
  if (!state.pvp) return;
  state.pvp.slots.forEach((participant, slot) => {
    if (participant) participant.slot = slot;
  });
}

function pvpAddEmptySlot() {
  if (!state.pvp || state.pvp.stage !== "lobby") return;
  if (state.pvp.slots.length >= PVP_MAX_SLOT_COUNT) {
    pvpAddLog(`PvP lobby supports up to ${PVP_MAX_SLOT_COUNT} slots.`);
    render();
    return;
  }
  state.pvp.slots.push(null);
  pvpAddLog(`Added slot ${state.pvp.slots.length}.`);
  pvpPostHostState();
  render();
}

function pvpRemoveRemotePlayer(remoteId) {
  if (!remoteId || !pvpServerEnabled()) return;
  fetch("/api/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: remoteId })
  }).catch(() => {});
}

function pvpRemoveLobbySlot(slot) {
  if (!state.pvp || state.pvp.stage !== "lobby") return;
  if (slot < 0 || slot >= state.pvp.slots.length) return;
  if (state.pvp.slots.length <= 1) {
    pvpAddLog("Keep at least one lobby slot.");
    render();
    return;
  }
  const [removed] = state.pvp.slots.splice(slot, 1);
  if (removed?.remoteId) {
    state.pvp.removedRemoteIds.add(removed.remoteId);
    pvpRemoveRemotePlayer(removed.remoteId);
  }
  pvpNormalizeSlots();
  pvpAddLog(removed ? `${removed.name} was removed from the lobby.` : `Removed empty slot ${slot + 1}.`);
  pvpPostHostState();
  render();
}

function pvpAddLocalPlayer(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    pvpAddLog("Enter a name first.");
    render();
    return;
  }
  const slot = state.pvp.slots.findIndex((participant) => !participant);
  if (slot < 0 && state.pvp.slots.length >= PVP_MAX_SLOT_COUNT) {
    pvpAddLog(`PvP lobby supports up to ${PVP_MAX_SLOT_COUNT} players.`);
    render();
    return;
  }
  const targetSlot = slot >= 0 ? slot : state.pvp.slots.length;
  state.pvp.slots[targetSlot] = pvpParticipant(targetSlot, trimmed, true);
  pvpAddLog(`${trimmed} joined slot ${targetSlot + 1}.`);
  pvpPostHostState();
  render();
}

function pvpFillBotsAndStart() {
  if (state.pvp.slots.length < 2) {
    pvpAddLog("PvP needs at least two slots.");
    render();
    return;
  }
  state.pvp.slots = state.pvp.slots.map((participant, slot) => participant || pvpBot(slot));
  pvpNormalizeSlots();
  pvpAddLog("Empty slots filled with DAMNED.");
  pvpStartRound();
}

function pvpStartRound() {
  const pvp = state.pvp;
  pvpClearAutoTimer();
  pvp.round += 1;
  pvp.stage = "guess";
  pvp.log = [];
  const forcedModifierChange = pvp.forceModifierNextRound;
  const roundsSinceModifierChange = Number.isFinite(pvp.modifierRoundsSinceChange) ? pvp.modifierRoundsSinceChange : 0;
  const scheduledModifierChange = pvp.round === 1 || roundsSinceModifierChange >= PVP_MODIFIER_INTERVAL;
  if (scheduledModifierChange || forcedModifierChange) {
    pvp.modifier = pvpRollModifier(pvp.round === 1 ? null : pvp.modifier);
    pvp.forceModifierNextRound = false;
    pvp.modifierRoundsSinceChange = 1;
    pvpAddLog(
      forcedModifierChange
        ? `Target reached 100. Modifier changed to ${pvp.modifier.toFixed(1)}.`
        : `Modifier set to ${pvp.modifier.toFixed(1)}.`
    );
  } else {
    pvp.modifierRoundsSinceChange = roundsSinceModifierChange + 1;
  }
  pvp.baseTarget = null;
  pvp.finalTarget = null;
  pvp.tableAverage = null;
  pvp.finalAverage = null;
  pvp.targetOffset = 0;
  pvp.removedIds = new Set();
  pvp.criticalHitIds = new Set();
  pvp.finalCriticalHitIds = new Set();
  pvp.activeResults = [];

  pvp.slots.forEach((participant) => {
    if (!participant) return;
    participant.roundStartHp = null;
    participant.aliveAtRoundStart = false;
    if (participant.eliminated) return;
    participant.roundStartHp = participant.hp;
    participant.aliveAtRoundStart = true;
    participant.activeGuaranteeThisRound = Boolean(participant.activeGuaranteeNextRound);
    participant.activeGuaranteeNextRound = false;
    participant.guess = participant.human ? null : pvpBotGuess(participant);
    participant.firstPhaseGuess = null;
    participant.activeOptions = [];
    participant.activeChoiceId = null;
    participant.activeTargetId = null;
    participant.activeCast = null;
    participant.activeResolved = false;
    participant.damageReduction = 0;
    participant.lastDamage = 0;
    participant.damageSources = [];
    participant.critical = false;
  });
  pvpAddLog(`Round ${pvp.round} guess phase.`);
  pvpMaybeAutoAdvance();
  pvpPostHostState();
  render();
}

function pvpProjectedPreviousTarget() {
  const pvp = state.pvp;
  if (!pvp) return null;
  if (Number.isFinite(pvp.previousAverage)) {
    return Math.ceil(pvp.previousAverage * pvp.modifier);
  }
  if (Number.isFinite(pvp.previousTarget) && Number.isFinite(pvp.previousModifier) && pvp.previousModifier !== 0) {
    return Math.ceil((pvp.previousTarget / pvp.previousModifier) * pvp.modifier);
  }
  return Number.isFinite(pvp.previousTarget) ? pvp.previousTarget : null;
}

function pvpBotGuess(participant) {
  const projected = pvpProjectedPreviousTarget();
  const anchor = projected === null ? randomInt(24, 76) : projected;
  const jitter = projected === null ? randomInt(-18, 18) : randomInt(-12, 12);
  return Math.ceil(clamp(anchor + jitter, 0, 100));
}

function pvpSetLocalGuess(slot, value) {
  const participant = state.pvp.slots[slot];
  const rawGuess = (value || "").trim();
  const guess = Math.ceil(Number(rawGuess));
  if (!rawGuess || !participant || participant.eliminated || !participant.human || !Number.isFinite(guess) || guess < 0 || guess > 100) {
    pvpAddLog("Invalid PvP guess.");
    render();
    return;
  }
  playGuessSfx();
  participant.guess = guess;
  pvpAddLog(`${participant.name} is ready.`);
  pvpMaybeAutoAdvance();
  pvpPostHostState();
  render();
}

function pvpAllGuessesReady() {
  return pvpAliveParticipants().every((participant) => Number.isFinite(participant.guess));
}

function pvpPrepareActivePhase() {
  pvpClearAutoTimer();
  if (!pvpAllGuessesReady()) {
    pvpAddLog("Waiting for every living player to guess.");
    render();
    return;
  }
  const pvp = state.pvp;
  const alive = pvpAliveParticipants();
  pvp.tableAverage = average(alive.map((participant) => participant.guess));
  pvp.baseTarget = Math.ceil(pvp.tableAverage * pvp.modifier);
  pvp.finalTarget = pvp.baseTarget;
  pvp.previousTarget = pvp.baseTarget;
  pvp.previousAverage = pvp.tableAverage;
  pvp.previousModifier = pvp.modifier;
  pvp.criticalHitIds = new Set(
    alive.filter((participant) => participant.guess === pvp.baseTarget).map((participant) => participant.id)
  );
  alive.forEach((participant) => {
    participant.firstPhaseGuess = participant.guess;
    participant.critical = pvp.criticalHitIds.has(participant.id);
    participant.activeOptions = shuffled(PVP_ACTIVES).slice(0, 2);
    participant.activeChoiceId = null;
    participant.activeTargetId = null;
    participant.activeCast = null;
    participant.activeResolved = false;
    if (!participant.human) pvpChooseBotActive(participant);
  });
  pvp.stage = "active";
  pvpAddLog(`First target ${pvp.baseTarget}. Choose one Artifact.`);
  pvpMaybeAutoAdvance();
  pvpPostHostState();
  render();
}

function pvpChooseBotActive(participant) {
  const choice = randomFrom(participant.activeOptions);
  participant.activeChoiceId = choice.id;
  if (choice.needsTarget) {
    const targets = pvpAliveParticipants().filter((candidate) => candidate.id !== participant.id);
    participant.activeTargetId = targets.length ? randomFrom(targets).id : null;
  }
}

function pvpSetActiveChoice(slot, activeId, targetId = null) {
  const participant = state.pvp.slots[slot];
  if (!participant || participant.eliminated || !participant.human) return;
  const active = pvpSelectableActives(participant).find((option) => option.id === activeId);
  if (!active) {
    pvpAddLog("That Artifact is not available.");
    render();
    return;
  }
  if (active.needsTarget && !targetId) {
    pvpAddLog(`${active.name} needs a target.`);
    render();
    return;
  }
  participant.activeChoiceId = activeId;
  participant.activeTargetId = targetId;
  pvpAddLog(`${participant.name} is ready.`);
  pvpMaybeAutoAdvance();
  pvpPostHostState();
  render();
}

function pvpAllActivesReady() {
  return pvpAliveParticipants().every((participant) => Boolean(participant.activeChoiceId));
}

function pvpDamageParticipant(participant, amount, reason, source = undefined) {
  const rawDamage = Math.max(0, Math.ceil(amount));
  const reduction = clamp(participant?.damageReduction || 0, 0, 1);
  const damage = reduction > 0 ? Math.max(0, Math.ceil(rawDamage * (1 - reduction))) : rawDamage;
  const saved = Math.max(0, rawDamage - damage);
  if (!participant || participant.eliminated || damage <= 0) return 0;
  participant.hp = Math.max(0, participant.hp - damage);
  participant.lastDamage += damage;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Damage");
  if (sourceLabel) {
    participant.damageSources = participant.damageSources || [];
    participant.damageSources.push({ amount: rawDamage, source: sourceLabel });
    if (saved > 0) participant.damageSources.push({ amount: saved, source: "Witch in a Bottle", kind: "saved" });
  }
  if (reason) {
    state.pvp.activeResults.push(reason);
    if (saved > 0) state.pvp.activeResults.push(`Witch in a Bottle saved ${participant.name} ${saved} health.`);
  }
  if (participant.hp <= 0) {
    participant.eliminated = true;
    state.pvp.activeResults.push(`${participant.name} was eliminated.`);
  }
  return damage;
}

function pvpNoSurvivorWinner() {
  const candidates = state.pvp.slots.filter(
    (participant) => participant?.aliveAtRoundStart && Number.isFinite(participant.roundStartHp)
  );
  if (!candidates.length) return null;
  return candidates
    .slice()
    .sort((left, right) => left.roundStartHp - right.roundStartHp || left.slot - right.slot)[0];
}

function pvpBestGuessParticipants() {
  const pvp = state.pvp;
  if (!Number.isFinite(pvp.baseTarget)) return [];
  const candidates = pvpAliveParticipants()
    .map((participant) => ({
      participant,
      guess: Number.isFinite(participant.firstPhaseGuess) ? participant.firstPhaseGuess : participant.guess
    }))
    .filter((entry) => Number.isFinite(entry.guess));
  if (!candidates.length) return [];
  const bestDistance = Math.min(...candidates.map((entry) => Math.abs(entry.guess - pvp.baseTarget)));
  return candidates
    .filter((entry) => Math.abs(entry.guess - pvp.baseTarget) === bestDistance)
    .map((entry) => entry.participant);
}

function pvpResolveActiveCast(participant) {
  const pvp = state.pvp;
  const active = pvpActiveById(participant.activeChoiceId);
  if (active.skip) {
    participant.activeCast = null;
    participant.activeResolved = true;
    participant.activeGuaranteeThisRound = false;
    participant.activeGuaranteeNextRound = true;
    pvp.activeResults.push(`${participant.name} skipped Artifact use. Next round their Artifact will cast for sure.`);
    return;
  }
  const guaranteed = Boolean(participant.activeGuaranteeThisRound);
  const cast = guaranteed || Math.random() >= 0.5;
  participant.activeCast = cast;
  participant.activeResolved = true;
  participant.activeGuaranteeThisRound = false;
  if (!cast) {
    pvp.activeResults.push(`${participant.name}'s ${active.name} failed to cast.`);
    return;
  }
  pvp.activeResults.push(
    guaranteed ? `${participant.name}'s ${active.name} cast with Skip guarantee.` : `${participant.name}'s ${active.name} cast.`
  );

  if (active.id === "shield") {
    participant.damageReduction = Math.max(participant.damageReduction || 0, 0.5);
  }
}

function pvpApplyActiveEffect(participant) {
  const pvp = state.pvp;
  const active = pvpActiveById(participant.activeChoiceId);
  if (!participant.activeCast || active.skip) return;

  if (active.id === "pulse") {
    pvpAliveParticipants()
      .filter((target) => target.id !== participant.id)
      .forEach((target) => pvpDamageParticipant(target, 3, `${target.name} took 3 from Demon Bowl.`, "Demon Bowl"));
  } else if (active.id === "rise") {
    pvp.targetOffset += 5;
  } else if (active.id === "sink") {
    pvp.targetOffset -= 5;
  } else if (active.id === "markBest") {
    pvpBestGuessParticipants().forEach((target) =>
      pvpDamageParticipant(target, 5, `${target.name} took 5 as one of the closest guesses.`, "The Black-Hilted Knife")
    );
  } else if (active.id === "jam") {
    const target = pvp.slots.find((candidate) => candidate?.id === participant.activeTargetId);
    if (target && !target.eliminated) {
      pvp.removedIds.add(target.id);
      pvp.activeResults.push(`${participant.name} used Null Vote on ${target.name}; ${target.name}'s guess no longer counts.`);
    }
  }
}

function pvpResolveActiveChoice(participant) {
  pvpResolveActiveCast(participant);
  pvpApplyActiveEffect(participant);
}

function pvpResolveActives() {
  pvpClearAutoTimer();
  if (!pvpAllActivesReady()) {
    pvpAddLog("Waiting for every living player to choose an Artifact.");
    render();
    return;
  }
  const pvp = state.pvp;
  pvp.activeResults = [];
  pvp.removedIds = new Set();
  pvp.targetOffset = 0;

  const resolvingParticipants = pvpAliveParticipants();
  resolvingParticipants.forEach((participant) => {
    participant.damageReduction = 0;
  });
  resolvingParticipants.forEach((participant) => pvpResolveActiveCast(participant));
  resolvingParticipants.forEach((participant) => pvpApplyActiveEffect(participant));

  const criticalHitters = pvp.slots.filter((participant) => participant && pvp.criticalHitIds.has(participant.id));
  criticalHitters.forEach((hitter) => {
    pvpAliveParticipants()
      .filter((target) => target.id !== hitter.id)
      .forEach((target) => pvpDamageParticipant(target, 5, `${hitter.name} hit CRITICAL: ${target.name} took 5.`, `CRITICAL from ${hitter.name}`));
  });

  const finalParticipants = pvpAliveParticipants().filter((participant) => !pvp.removedIds.has(participant.id));
  pvp.finalAverage = finalParticipants.length ? average(finalParticipants.map((participant) => participant.guess)) : 0;
  pvp.finalTarget = Math.ceil(pvp.finalAverage * pvp.modifier + pvp.targetOffset);
  pvp.previousTarget = pvp.finalTarget;
  pvp.previousAverage = pvp.finalAverage;
  pvp.previousModifier = pvp.modifier;
  if (pvp.finalTarget >= 100) {
    pvp.forceModifierNextRound = true;
    pvp.activeResults.push("Final target reached 100. Multiplier will change next round.");
  }

  const finalCriticalHitters = pvpAliveParticipants().filter((participant) => participant.guess === pvp.finalTarget);
  pvp.finalCriticalHitIds = new Set(finalCriticalHitters.map((participant) => participant.id));
  finalCriticalHitters.forEach((hitter) => {
    hitter.critical = true;
    pvpAliveParticipants()
      .filter((target) => target.id !== hitter.id)
      .forEach((target) =>
        pvpDamageParticipant(target, 5, `${hitter.name} hit FINAL CRITICAL: ${target.name} took 5.`, `Final CRITICAL from ${hitter.name}`)
      );
  });

  pvpAliveParticipants().forEach((participant) => {
    const damage = Math.ceil(Math.abs(participant.guess - pvp.finalTarget));
    pvpDamageParticipant(participant, damage, `${participant.name} took ${damage} target damage.`, "Target difference");
  });

  const alive = pvpAliveParticipants();
  if (alive.length <= 1) {
    pvp.stage = "ended";
    const tiebreakWinner = alive.length ? null : pvpNoSurvivorWinner();
    pvp.winner = alive[0]?.name || tiebreakWinner?.name || "No one";
    pvpAddLog(
      tiebreakWinner
        ? `${pvp.winner} wins PvP by lowest starting health (${tiebreakWinner.roundStartHp}).`
        : `${pvp.winner} wins PvP.`
    );
  } else {
    pvp.stage = "summary";
    pvpAddLog(`Round ${pvp.round} resolved.`);
    pvpMaybeAutoAdvance();
  }
  pvpPostHostState();
  render();
}

function pvpNextRound() {
  pvpClearAutoTimer();
  if (state.pvp.stage !== "summary") return;
  pvpStartRound();
}

function pvpJoinUrl() {
  if (typeof location === "undefined" || !location.origin || location.protocol === "file:") {
    return "Run start_pvp_server.bat, then open the shown phone URL.";
  }
  return `${location.origin}/controller.html`;
}

function pvpPublicState() {
  if (!state.pvp) return null;
  const revealActiveChoices = state.pvp.stage !== "active" || pvpAllActivesReady();
  return {
    stage: state.pvp.stage,
    round: state.pvp.round,
    modifier: state.pvp.modifier,
    previousTarget: state.pvp.previousTarget,
    baseTarget: state.pvp.baseTarget,
    finalTarget: state.pvp.finalTarget,
    waitForHost: state.pvp.waitForHost,
    autoDueAt: state.pvp.autoDueAt,
    players: state.pvp.slots.map((participant) =>
      participant
        ? {
            id: participant.id,
            slot: participant.slot,
            name: participant.name,
            hp: participant.hp,
            eliminated: participant.eliminated,
            lastDamage: participant.lastDamage,
            damageSources: mergeSourceEntries(participant.damageSources),
            guessSubmitted: Number.isFinite(participant.guess),
            activeOptions: pvpSelectableActives(participant).map((active) => ({
              id: active.id,
              name: active.name,
              description: normalizeGameText(active.description),
              needsTarget: active.needsTarget
            })),
            activeSubmitted: Boolean(participant.activeChoiceId),
            activeChoiceId: revealActiveChoices ? participant.activeChoiceId : null,
            activeTargetId: revealActiveChoices ? participant.activeTargetId : null,
            activeCast: participant.activeCast,
            activeResolved: participant.activeResolved,
            activeGuaranteeThisRound: participant.activeGuaranteeThisRound,
            activeGuaranteeNextRound: participant.activeGuaranteeNextRound,
            roundStartHp: participant.roundStartHp,
            guess: state.pvp.stage === "guess" ? null : participant.guess
          }
        : null
    ),
    activeResults: state.pvp.activeResults.map((result) => normalizeGameText(result)),
    winner: state.pvp.winner
  };
}

function pvpServerEnabled() {
  return typeof location !== "undefined" && location.protocol !== "file:" && typeof fetch === "function";
}

function pvpHostResetRoom() {
  if (!pvpServerEnabled()) return;
  fetch("/api/reset", { method: "POST" })
    .then(() => pvpPostHostState())
    .catch(() => pvpAddLog("Phone server not available."));
}

function pvpPostHostState() {
  if (!pvpServerEnabled() || !state.pvp) return;
  fetch("/api/host", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostState: pvpPublicState() })
  }).catch(() => {});
}

function pvpStartHostPolling() {
  pvpStopHostPolling();
  if (!pvpServerEnabled()) return;
  pvpPollTimer = setInterval(pvpPollRoom, 900);
  pvpPollRoom();
}

function pvpStopHostPolling() {
  if (pvpPollTimer) clearInterval(pvpPollTimer);
  pvpPollTimer = null;
}

async function pvpPollRoom() {
  if (!pvpServerEnabled() || !state.pvp) return;
  try {
    const response = await fetch("/api/room");
    if (!response.ok) return;
    const room = await response.json();
    let changed = false;
    changed = pvpImportRemotePlayers(room.players || []) || changed;
    changed = pvpImportRemoteInputs(room.players || []) || changed;
    if (changed) {
      pvpMaybeAutoAdvance();
      pvpPostHostState();
      render();
    }
  } catch {
    // Phone play is optional; local PvP keeps working if the bridge is not running.
  }
}

function pvpImportRemotePlayers(players) {
  if (!state.pvp || state.pvp.stage !== "lobby") return false;
  let changed = false;
  players.forEach((player) => {
    if (!player?.id) return;
    if (state.pvp.removedRemoteIds?.has(player.id)) return;
    if (state.pvp.slots.some((slot) => slot?.remoteId === player.id)) return;
    const slotIndex = state.pvp.slots.findIndex((slot) => !slot);
    if (slotIndex < 0 && state.pvp.slots.length >= PVP_MAX_SLOT_COUNT) return;
    const targetSlot = slotIndex >= 0 ? slotIndex : state.pvp.slots.length;
    state.pvp.slots[targetSlot] = pvpParticipant(targetSlot, player.name, true, player.id);
    pvpAddLog(`${player.name} joined from phone in slot ${targetSlot + 1}.`);
    changed = true;
  });
  if (changed) pvpNormalizeSlots();
  return changed;
}

function pvpImportRemoteInputs(players) {
  if (!state.pvp || state.pvp.stage === "lobby") return false;
  let changed = false;
  players.forEach((player) => {
    if (!player?.id) return;
    const participant = state.pvp.slots.find((slot) => slot?.remoteId === player.id);
    if (!participant || participant.eliminated) return;

    if (state.pvp.stage === "guess" && player.guessRound === state.pvp.round && Number.isFinite(player.guess)) {
      const guess = Math.ceil(clamp(player.guess, 0, 100));
      if (participant.guess !== guess) {
        participant.guess = guess;
        pvpAddLog(`${participant.name} sent a phone guess.`);
        changed = true;
      }
    }

    if (state.pvp.stage === "active" && player.activeRound === state.pvp.round && player.activeChoiceId) {
      const active = pvpSelectableActives(participant).find((option) => option.id === player.activeChoiceId);
      if (!active) return;
      const targetId = player.activeTargetId || null;
      if (active.needsTarget && !targetId) return;
      if (participant.activeChoiceId !== player.activeChoiceId || participant.activeTargetId !== targetId) {
        participant.activeChoiceId = player.activeChoiceId;
        participant.activeTargetId = targetId;
        pvpAddLog(`${participant.name} is ready.`);
        changed = true;
      }
    }
  });
  return changed;
}

function isFullscreenLayoutMode() {
  const screenHeight = window.screen?.height || 0;
  const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  const outerHeight = window.outerHeight || viewportHeight;
  const browserFullscreen = screenHeight > 0 && outerHeight >= screenHeight - 8 && viewportHeight >= screenHeight - 120;
  return Boolean(document.fullscreenElement) || browserFullscreen;
}

function updateFullscreenLayoutClass() {
  document.body.classList.toggle("fullscreen-layout", isFullscreenLayoutMode());
}

