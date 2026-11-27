// ---------- Local PvP (host side) ----------
// The host screen runs the table; players join from their phones (controller.html) through the local
// server (server.js; the desktop app starts its own, see desktop/main.cjs). Empty seats are played by DAMNED.
// A session lasts while the host stays in PvP: Play Again keeps the table (same phones, same seats) and the
// wins; New Table starts over. Every win buys a face reroll (a random Goetic BOSS), PVP_ARCHANGEL_WINS wins
// open the Archangels.

function pvpNewSession() {
  return {
    game: 0,
    // per human player (phone id): { wins, rerolls, image, rerollSeqSeen }
    players: {},
    damnedWins: 0,
    timerSeconds: PVP_DEFAULT_TIMER,
    removedRemoteIds: new Set()
  };
}

function pvpInitialState(session = pvpNewSession(), seatCount = PVP_SLOT_COUNT) {
  return {
    stage: "lobby",
    session,
    game: session.game,
    round: 0,
    slots: Array.from({ length: seatCount }, () => null),
    modifier: pvpRollModifier(),
    previousTarget: null,
    lastRoundTarget: null,
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
    winners: [],
    winReason: null,
    reveal: null,
    forceModifierNextRound: false,
    modifierRoundsSinceChange: 0,
    waitForHost: false,
    autoKey: null,
    autoDueAt: null,
    phaseDeadline: null,
    phaseRemaining: null,
    joinInfo: null,
    rulesOpen: false
  };
}

function pvpSessionEntry(participant) {
  if (!state.pvp || !participant?.human) return null;
  const key = participant.remoteId || participant.id;
  const players = state.pvp.session.players;
  if (!players[key]) players[key] = { wins: 0, rerolls: 0, image: null, rerollSeqSeen: 0 };
  return players[key];
}

function pvpParticipant(slot, name, human = true, remoteId = null) {
  const participant = {
    id: remoteId || `local-${slot}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    slot,
    name: name || `Player ${slot + 1}`,
    human,
    remoteId,
    connected: true,
    color: randomFrom(BOT_ARCHETYPES).color,
    image: randomBotImage(),
    hp: PVP_MAX_HP,
    maxHp: PVP_MAX_HP,
    eliminated: false,
    fellRound: null,
    guess: null,
    autoGuess: false,
    firstPhaseGuess: null,
    activeOptions: [],
    activeChoiceId: null,
    activeTargetId: null,
    activeTimedOut: false,
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
  // a phone keeps its face (and its rerolled faces) for the whole session
  const entry = human && state.pvp ? pvpSessionEntry(participant) : null;
  if (entry) {
    if (entry.image) participant.image = entry.image;
    else entry.image = participant.image;
  }
  return participant;
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

// sounds never stop the game (no audio in tests, blocked autoplay...)
function pvpSfx(play) {
  try {
    play();
  } catch (error) {}
}

// ---------- automatic flow ----------
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
    pvpScheduleAuto(`guess-${pvp.game}-${pvp.round}`, PVP_PHASE_AUTO_DELAY, pvpPrepareActivePhase);
    return;
  }
  if (pvp.stage === "active" && pvpAllActivesReady()) {
    pvpScheduleAuto(`active-${pvp.game}-${pvp.round}`, PVP_PHASE_AUTO_DELAY, pvpResolveActives);
    return;
  }
  if (pvp.stage === "reveal" && pvp.reveal) {
    const step = pvp.reveal.steps[pvp.reveal.index];
    const shownKind = pvp.reveal.steps[pvp.reveal.index - 1]?.kind;
    // big tables answer their ARTIFACTS faster, so a round's reveal stays short
    const artifactSteps = pvp.reveal.steps.filter((entry) => entry.kind === "artifact").length;
    const artifactDelay = clamp(Math.round((PVP_REVEAL_TIMING.artifact * 5) / Math.max(5, artifactSteps)), 550, PVP_REVEAL_TIMING.artifact);
    const delay = pvp.reveal.index === 0 ? PVP_REVEAL_TIMING.start : shownKind === "artifact" ? artifactDelay : PVP_REVEAL_TIMING[shownKind] || 900;
    pvpScheduleAuto(`reveal-${pvp.game}-${pvp.round}-${pvp.reveal.index}`, pvpMs(delay), step ? pvpAdvanceReveal : pvpFinishRound);
    return;
  }
  if (pvp.stage === "summary") {
    pvpScheduleAuto(`summary-${pvp.game}-${pvp.round}`, PVP_SUMMARY_AUTO_DELAY, pvpNextRound);
    return;
  }
  pvpClearAutoTimer();
}

// reveal timings follow Settings > Gameplay > animation speed
function pvpMs(ms) {
  return typeof gameMs === "function" ? gameMs(ms) : ms;
}

// ---------- the phase clock ----------
function pvpClockRunning() {
  const pvp = state.pvp;
  return Boolean(pvp && (pvp.stage === "guess" || pvp.stage === "active") && Number.isFinite(pvp.phaseDeadline));
}

function pvpStartPhaseClock() {
  const pvp = state.pvp;
  pvp.phaseRemaining = null;
  pvp.phaseDeadline = pvp.session.timerSeconds > 0 ? Date.now() + pvp.session.timerSeconds * 1000 : null;
  pvpEnsureClockTicker();
}

function pvpStopPhaseClock() {
  if (!state.pvp) return;
  state.pvp.phaseDeadline = null;
  state.pvp.phaseRemaining = null;
}

function pvpClockSecondsLeft() {
  const pvp = state.pvp;
  if (!pvp) return null;
  if (Number.isFinite(pvp.phaseRemaining)) return Math.ceil(pvp.phaseRemaining / 1000);
  if (!Number.isFinite(pvp.phaseDeadline)) return null;
  return Math.max(0, Math.ceil((pvp.phaseDeadline - Date.now()) / 1000));
}

function pvpEnsureClockTicker() {
  if (pvpClockTimer || typeof setInterval !== "function") return;
  pvpClockTimer = setInterval(pvpClockTick, 250);
}

function pvpStopClockTicker() {
  if (pvpClockTimer) clearInterval(pvpClockTimer);
  pvpClockTimer = null;
  pvpLastClockSecond = null;
}

// updates the countdown on screen without a full render, ticks out loud at the end, and runs out
function pvpClockTick() {
  const pvp = state.pvp;
  if (!pvp || state.mode !== "pvp") {
    pvpStopClockTicker();
    return;
  }
  if (!pvpClockRunning() || pvp.waitForHost) return;
  const left = pvpClockSecondsLeft();
  if (typeof document !== "undefined") {
    document.querySelectorAll("[data-pvp-clock]").forEach((element) => {
      element.textContent = String(left);
      element.closest(".pvp-clock")?.classList.toggle("pvp-clock-low", left <= PVP_TIMER_TICK_SECONDS);
    });
  }
  if (left !== pvpLastClockSecond) {
    pvpLastClockSecond = left;
    if (left > 0 && left <= PVP_TIMER_TICK_SECONDS) pvpSfx(playClockTickSfx);
  }
  if (Date.now() >= pvp.phaseDeadline) pvpTimerExpired();
}

function pvpTimerExpired() {
  const pvp = state.pvp;
  if (!pvp) return;
  const missing = pvpAliveParticipants();
  if (pvp.stage === "guess") {
    missing
      .filter((participant) => !Number.isFinite(participant.guess))
      .forEach((participant) => {
        participant.guess = PVP_TIMEOUT_GUESS;
        participant.autoGuess = true;
        pvpAddLog(`${participant.name} ran out of time: guess ${PVP_TIMEOUT_GUESS}.`);
      });
    pvpStopPhaseClock();
    pvpPrepareActivePhase();
    return;
  }
  if (pvp.stage === "active") {
    missing
      .filter((participant) => !participant.activeChoiceId)
      .forEach((participant) => {
        participant.activeChoiceId = PVP_SKIP_ACTIVE.id;
        participant.activeTimedOut = true;
        participant.activeTargetId = null;
      });
    pvpStopPhaseClock();
    pvpResolveActives();
  }
}

// The host's Pause holds the automatic flow and the clock; phones are told the game is paused.
function pvpSetHostPaused(paused) {
  const pvp = state.pvp;
  if (!pvp) return;
  pvp.waitForHost = Boolean(paused);
  if (paused) {
    pvpClearAutoTimer();
    if (Number.isFinite(pvp.phaseDeadline)) {
      pvp.phaseRemaining = Math.max(0, pvp.phaseDeadline - Date.now());
    }
  } else {
    if (Number.isFinite(pvp.phaseRemaining) && Number.isFinite(pvp.phaseDeadline)) {
      pvp.phaseDeadline = Date.now() + pvp.phaseRemaining;
    }
    pvp.phaseRemaining = null;
    pvpMaybeAutoAdvance();
  }
  pvpPostHostState();
}

function pvpCycleTimer() {
  const pvp = state.pvp;
  if (!pvp || pvp.stage !== "lobby") return;
  const index = PVP_TIMER_OPTIONS.indexOf(pvp.session.timerSeconds);
  pvp.session.timerSeconds = PVP_TIMER_OPTIONS[(index + 1) % PVP_TIMER_OPTIONS.length];
  pvpPostHostState();
  render();
}

// ---------- entering, leaving, rematch ----------
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
  pvpAddLog("The lobby is open.");
  pvpHostResetRoom();
  pvpFetchJoinInfo();
  pvpStartHostPolling();
  pvpEnsureClockTicker();
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
}

// New Table: everyone leaves, the wins of the session are forgotten
function restartPvpMode() {
  resumeSoundtrack();
  pvpClearAutoTimer();
  state.pauseOpen = false;
  const joinInfo = state.pvp?.joinInfo || null;
  state.pvp = pvpInitialState();
  state.pvp.joinInfo = joinInfo;
  pvpAddLog("New table.");
  pvpHostResetRoom();
  if (!joinInfo) pvpFetchJoinInfo();
  pvpStartHostPolling();
  render();
}

// Play Again: same table, same phones in the same seats, the session's wins kept; the DAMNED leave
// (fresh ones take the open seats at Start)
function pvpRematch() {
  const old = state.pvp;
  if (!old) return;
  resumeSoundtrack();
  pvpClearAutoTimer();
  state.pauseOpen = false;
  const next = pvpInitialState(old.session, old.slots.length);
  next.joinInfo = old.joinInfo;
  state.pvp = next;
  old.slots.forEach((participant, slot) => {
    if (!participant?.human) return;
    const seated = pvpParticipant(slot, participant.name, true, participant.remoteId);
    seated.connected = participant.connected;
    next.slots[slot] = seated;
  });
  pvpAddLog("Same table, new game.");
  pvpPostHostState();
  render();
}

function switchToArcadeMode() {
  pvpClearAutoTimer();
  pvpStopHostPolling();
  pvpStopClockTicker();
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
    render();
    return;
  }
  state.pvp.slots.push(null);
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

function pvpRemoveEmptySlot() {
  if (!state.pvp || state.pvp.stage !== "lobby") return;
  for (let slot = state.pvp.slots.length - 1; slot >= 0; slot -= 1) {
    if (!state.pvp.slots[slot]) {
      pvpRemoveLobbySlot(slot);
      return;
    }
  }
}

function pvpRemoveLobbySlot(slot) {
  if (!state.pvp || state.pvp.stage !== "lobby") return;
  if (slot < 0 || slot >= state.pvp.slots.length) return;
  if (state.pvp.slots.length <= 2) {
    render();
    return;
  }
  const [removed] = state.pvp.slots.splice(slot, 1);
  if (removed?.remoteId) {
    state.pvp.session.removedRemoteIds.add(removed.remoteId);
    pvpRemoveRemotePlayer(removed.remoteId);
  }
  pvpNormalizeSlots();
  pvpAddLog(removed ? `${removed.name} was removed from the table.` : `Seat ${slot + 1} removed.`);
  pvpPostHostState();
  render();
}

function pvpFillBotsAndStart() {
  const pvp = state.pvp;
  if (!pvp || pvp.stage !== "lobby" || pvp.slots.length < 2) return;
  pvp.slots = pvp.slots.map((participant, slot) => participant || pvpBot(slot));
  pvpNormalizeSlots();
  pvp.session.game += 1;
  pvp.game = pvp.session.game;
  pvpStartRound();
}

// ---------- a round ----------
function pvpStartRound() {
  const pvp = state.pvp;
  pvpClearAutoTimer();
  pvp.round += 1;
  pvp.stage = "guess";
  // "Previous" on the screens: the final TARGET of the round before
  pvp.lastRoundTarget = pvp.previousTarget;
  pvp.log = [];
  pvp.reveal = null;
  const forcedModifierChange = pvp.forceModifierNextRound;
  const roundsSinceModifierChange = Number.isFinite(pvp.modifierRoundsSinceChange) ? pvp.modifierRoundsSinceChange : 0;
  const scheduledModifierChange = pvp.round === 1 || roundsSinceModifierChange >= PVP_MODIFIER_INTERVAL;
  if (scheduledModifierChange || forcedModifierChange) {
    pvp.modifier = pvpRollModifier(pvp.round === 1 ? null : pvp.modifier);
    pvp.forceModifierNextRound = false;
    pvp.modifierRoundsSinceChange = 1;
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
    participant.autoGuess = false;
    participant.firstPhaseGuess = null;
    participant.activeOptions = [];
    participant.activeChoiceId = null;
    participant.activeTargetId = null;
    participant.activeTimedOut = false;
    participant.activeCast = null;
    participant.activeResolved = false;
    participant.damageReduction = 0;
    participant.lastDamage = 0;
    participant.damageSources = [];
    participant.critical = false;
  });
  if (pvp.round > 1) pvpSfx(playNextRoundSfx);
  pvpStartPhaseClock();
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

function pvpAllGuessesReady() {
  return pvpAliveParticipants().every((participant) => Number.isFinite(participant.guess));
}

function pvpPrepareActivePhase() {
  pvpClearAutoTimer();
  if (!state.pvp || state.pvp.stage !== "guess") return;
  if (!pvpAllGuessesReady()) {
    render();
    return;
  }
  const pvp = state.pvp;
  pvpStopPhaseClock();
  const alive = pvpAliveParticipants();
  pvp.tableAverage = average(alive.map((participant) => participant.guess));
  pvp.baseTarget = Math.ceil(pvp.tableAverage * pvp.modifier);
  pvp.finalTarget = pvp.baseTarget;
  pvp.criticalHitIds = new Set(
    alive.filter((participant) => participant.guess === pvp.baseTarget).map((participant) => participant.id)
  );
  alive.forEach((participant) => {
    participant.firstPhaseGuess = participant.guess;
    participant.critical = pvp.criticalHitIds.has(participant.id);
    participant.activeOptions = shuffled(PVP_ACTIVES).slice(0, 2);
    participant.activeChoiceId = null;
    participant.activeTargetId = null;
    participant.activeTimedOut = false;
    participant.activeCast = null;
    participant.activeResolved = false;
    if (!participant.human) pvpChooseBotActive(participant);
  });
  pvp.stage = "active";
  pvpSfx(() => playGameSfx("targetLand"));
  pvpStartPhaseClock();
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
    if (saved > 0) participant.damageSources.push({ amount: saved, source: "Dark Talisman", kind: "saved" });
  }
  if (reason) {
    state.pvp.activeResults.push(reason);
    if (saved > 0) state.pvp.activeResults.push(`Dark Talisman saved ${participant.name} ${saved} SOUL.`);
  }
  if (participant.hp <= 0) {
    participant.eliminated = true;
    participant.fellRound = state.pvp.round;
    state.pvp.activeResults.push(`${participant.name} was eliminated.`);
  }
  return damage;
}

// Everyone left fell in the same round: the one who started it with the least SOUL wins; if equal, the
// guess closest to the final TARGET; if still equal, the win is shared.
function pvpNoSurvivorWinners() {
  const pvp = state.pvp;
  const candidates = pvp.slots.filter((participant) => participant?.aliveAtRoundStart && Number.isFinite(participant.roundStartHp));
  if (!candidates.length) return { winners: [], reason: { kind: "none", round: pvp.round } };
  const leastSoul = Math.min(...candidates.map((participant) => participant.roundStartHp));
  const bySoul = candidates.filter((participant) => participant.roundStartHp === leastSoul);
  if (bySoul.length === 1) return { winners: bySoul, reason: { kind: "lowestSoul", round: pvp.round, soul: leastSoul } };
  const distance = (participant) =>
    Number.isFinite(participant.guess) && Number.isFinite(pvp.finalTarget) ? Math.abs(participant.guess - pvp.finalTarget) : Infinity;
  const closest = Math.min(...bySoul.map(distance));
  const byGuess = bySoul.filter((participant) => distance(participant) === closest);
  if (byGuess.length === 1) return { winners: byGuess, reason: { kind: "closest", round: pvp.round, soul: leastSoul } };
  return { winners: byGuess, reason: { kind: "shared", round: pvp.round, soul: leastSoul } };
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
    // running out of time is not a Skip: no sure cast next round
    participant.activeGuaranteeNextRound = !participant.activeTimedOut;
    if (participant.activeTimedOut) pvp.activeResults.push(`${participant.name} ran out of time and used no ARTIFACT.`);
    else pvp.activeResults.push(`${participant.name} skipped Artifact use. Next round their Artifact will cast for sure.`);
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
      pvpDamageParticipant(target, 5, `${target.name} took 5 as one of the closest guesses.`, "Sacrificial Dagger")
    );
  } else if (active.id === "jam") {
    const target = pvp.slots.find((candidate) => candidate?.id === participant.activeTargetId);
    if (target && target.aliveAtRoundStart) {
      pvp.removedIds.add(target.id);
      pvp.activeResults.push(`${participant.name} used Inverted Cross on ${target.name}; ${target.name}'s guess no longer counts.`);
    }
  }
}

function pvpResolveActiveChoice(participant) {
  pvpResolveActiveCast(participant);
  pvpApplyActiveEffect(participant);
}

// the TARGET with the ARTIFACTS applied so far: every player alive when the ARTIFACTS resolve counts
// (one knocked out by an ARTIFACT or a CRITICAL keeps their guess in), minus the Inverted Crosses
function pvpTargetFrom(counted) {
  const pvp = state.pvp;
  const kept = counted.filter((participant) => !pvp.removedIds.has(participant.id));
  const averageGuess = kept.length ? average(kept.map((participant) => participant.guess)) : 0;
  return { average: averageGuess, target: Math.ceil(averageGuess * pvp.modifier + pvp.targetOffset) };
}

// Works out the whole round at once, then plays it back step by step (stage "reveal"): every ARTIFACT
// cast or failed and what it did to the TARGET, the final TARGET, the CRITICALS, then the damage.
function pvpResolveActives() {
  pvpClearAutoTimer();
  const pvp = state.pvp;
  if (!pvp || pvp.stage !== "active") return;
  if (!pvpAllActivesReady()) {
    render();
    return;
  }
  pvpStopPhaseClock();
  pvp.activeResults = [];
  pvp.removedIds = new Set();
  pvp.targetOffset = 0;

  const resolvingParticipants = pvpAliveParticipants();
  const hpBefore = {};
  resolvingParticipants.forEach((participant) => {
    participant.damageReduction = 0;
    hpBefore[participant.id] = participant.hp;
  });
  resolvingParticipants.forEach((participant) => pvpResolveActiveCast(participant));

  const steps = [];
  resolvingParticipants.forEach((participant) => {
    const before = pvpTargetFrom(resolvingParticipants).target;
    pvpApplyActiveEffect(participant);
    const active = pvpActiveById(participant.activeChoiceId);
    if (active.skip) return;
    const after = pvpTargetFrom(resolvingParticipants).target;
    steps.push({ kind: "artifact", id: participant.id, activeId: active.id, cast: Boolean(participant.activeCast), from: before, to: after });
  });

  const criticalHitters = pvp.slots.filter((participant) => participant && pvp.criticalHitIds.has(participant.id));
  if (criticalHitters.length) steps.push({ kind: "critical", ids: criticalHitters.map((participant) => participant.id), first: true });
  criticalHitters.forEach((hitter) => {
    pvpAliveParticipants()
      .filter((target) => target.id !== hitter.id)
      .forEach((target) => pvpDamageParticipant(target, 5, `${hitter.name} hit CRITICAL: ${target.name} took 5.`, `CRITICAL from ${hitter.name}`));
  });

  const final = pvpTargetFrom(resolvingParticipants);
  pvp.finalAverage = final.average;
  pvp.finalTarget = final.target;
  pvp.previousTarget = pvp.finalTarget;
  pvp.previousAverage = pvp.finalAverage;
  pvp.previousModifier = pvp.modifier;
  steps.push({ kind: "target", to: pvp.finalTarget });
  if (pvp.finalTarget >= 100) {
    pvp.forceModifierNextRound = true;
    pvp.activeResults.push("Final target reached 100. Multiplier will change next round.");
  }

  const finalCriticalHitters = pvpAliveParticipants().filter((participant) => participant.guess === pvp.finalTarget);
  pvp.finalCriticalHitIds = new Set(finalCriticalHitters.map((participant) => participant.id));
  if (finalCriticalHitters.length) steps.push({ kind: "critical", ids: finalCriticalHitters.map((participant) => participant.id), first: false });
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
  steps.push({ kind: "damage" });

  pvp.reveal = {
    steps,
    index: 0,
    hpBefore,
    shownTarget: pvp.baseTarget,
    targetDelta: 0,
    focusId: null,
    criticalIds: [],
    damageShown: false
  };
  pvp.stage = "reveal";
  pvpMaybeAutoAdvance();
  pvpPostHostState();
  render();
}

function pvpRevealHidesDamage() {
  return Boolean(state.pvp?.stage === "reveal" && state.pvp.reveal && !state.pvp.reveal.damageShown);
}

// the ARTIFACT step of this player has been shown (always true outside the reveal)
function pvpRevealShowsArtifact(participant) {
  const reveal = state.pvp?.reveal;
  if (state.pvp?.stage !== "reveal" || !reveal) return true;
  const stepIndex = reveal.steps.findIndex((step) => step.kind === "artifact" && step.id === participant.id);
  return stepIndex < 0 || stepIndex < reveal.index;
}

function pvpAdvanceReveal() {
  const pvp = state.pvp;
  const reveal = pvp?.reveal;
  if (!reveal || pvp.stage !== "reveal") return;
  const step = reveal.steps[reveal.index];
  if (!step) {
    pvpFinishRound();
    return;
  }
  reveal.index += 1;
  reveal.focusId = null;
  reveal.criticalIds = [];
  reveal.targetDelta = 0;
  if (step.kind === "artifact") {
    reveal.focusId = step.id;
    if (step.cast) pvpSfx(() => playArtifactSfx(PVP_ARTIFACT_SFX[step.activeId]));
    else pvpSfx(() => playGameSfx("pvpFizzle"));
    if (step.to !== step.from) {
      reveal.targetDelta = step.to - step.from;
      reveal.shownTarget = step.to;
    }
  } else if (step.kind === "target") {
    reveal.targetDelta = step.to - reveal.shownTarget;
    reveal.shownTarget = step.to;
    pvpSfx(() => playGameSfx("targetLand"));
  } else if (step.kind === "critical") {
    reveal.criticalIds = step.ids;
    pvpSfx(() => playGameSfx("critical"));
  } else if (step.kind === "damage") {
    reveal.damageShown = true;
    const hits = pvp.slots.filter((participant) => participant?.lastDamage > 0);
    const biggest = Math.max(0, ...hits.map((participant) => participant.lastDamage / Math.max(1, participant.maxHp)));
    const knockedOut = pvp.slots.some((participant) => participant?.eliminated && participant.fellRound === pvp.round);
    if (knockedOut) pvpSfx(() => playGameSfx("ko"));
    else if (biggest > 0) pvpSfx(() => playGameSfx(biggest >= 0.2 ? "hitBig" : biggest >= 0.08 ? "hitMid" : "hitSmall"));
  }
  pvpMaybeAutoAdvance();
  pvpPostHostState();
  render();
}

function pvpFinishRound() {
  pvpClearAutoTimer();
  const pvp = state.pvp;
  if (!pvp || pvp.stage !== "reveal") return;
  pvp.reveal = null;
  const alive = pvpAliveParticipants();
  if (alive.length <= 1) {
    const decided = alive.length ? { winners: alive, reason: { kind: "last", round: pvp.round } } : pvpNoSurvivorWinners();
    pvpEndGame(decided.winners, decided.reason);
  } else {
    pvp.stage = "summary";
    pvpMaybeAutoAdvance();
  }
  pvpPostHostState();
  render();
}

function pvpEndGame(winners, reason) {
  const pvp = state.pvp;
  pvp.stage = "ended";
  pvp.winners = winners.map((participant) => participant.id);
  pvp.winner = winners.length ? winners.map((participant) => participant.name).join(" & ") : "No one";
  pvp.winReason = reason;
  // the session's tally: a shared win counts for each; DAMNED wins count together
  let damnedWon = false;
  winners.forEach((participant) => {
    const entry = pvpSessionEntry(participant);
    if (entry) {
      entry.wins += 1;
      entry.rerolls += 1;
    } else {
      damnedWon = true;
    }
  });
  if (damnedWon) pvp.session.damnedWins += 1;
  pvpSfx(() => playGameSfx("pvpWinner"));
}

function pvpNextRound() {
  pvpClearAutoTimer();
  if (state.pvp.stage !== "summary") return;
  pvpStartRound();
}

// winners first, then whoever lasted longer, then more SOUL at the start of the round they fell in
function pvpStandings() {
  const pvp = state.pvp;
  const winners = new Set(pvp.winners || []);
  return pvp.slots
    .filter(Boolean)
    .slice()
    .sort((left, right) => {
      const winDiff = Number(winners.has(right.id)) - Number(winners.has(left.id));
      if (winDiff) return winDiff;
      const fell = (participant) => (participant.eliminated ? participant.fellRound || 0 : Infinity);
      if (fell(right) !== fell(left)) return fell(right) - fell(left);
      return (right.roundStartHp || 0) - (left.roundStartHp || 0) || left.slot - right.slot;
    });
}

function pvpWins(participant) {
  if (!participant?.human || !state.pvp) return 0;
  return state.pvp.session.players[participant.remoteId || participant.id]?.wins || 0;
}

// ---------- faces: every win buys a reroll ----------
function pvpFaceChoices(kind) {
  if (kind === "archangel") return ARCHANGEL_BOSS_SPECS.map((spec) => `${ARCHANGEL_BOSS_IMAGE_ROOT}/${spec.image}`);
  return GOETIC_BOSS_SPECS.map((spec) => `${GOETIC_BOSS_IMAGE_ROOT}/${spec.image}`);
}

function pvpRerollFace(participant, kind = "goetic") {
  const entry = pvpSessionEntry(participant);
  if (!entry || entry.rerolls <= 0) return false;
  if (kind === "archangel" && entry.wins < PVP_ARCHANGEL_WINS) return false;
  const choices = pvpFaceChoices(kind).filter((image) => image !== participant.image);
  if (!choices.length) return false;
  entry.rerolls -= 1;
  entry.image = randomFrom(choices);
  participant.image = entry.image;
  pvpSfx(() => playGameSfx("reroll"));
  return true;
}

// ---------- what the phones see ----------
function pvpJoinUrl() {
  const info = state.pvp?.joinInfo;
  if (info?.url) return info.url;
  if (typeof location !== "undefined" && /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname)) {
    return `${location.origin}/controller.html`;
  }
  return "";
}

// The commandments' Roman numbers
function pvpRoman(number) {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][number - 1] || String(number);
}

function pvpPublicState() {
  const pvp = state.pvp;
  if (!pvp) return null;
  const revealActiveChoices = pvp.stage !== "active" || pvpAllActivesReady();
  const hideDamage = pvpRevealHidesDamage();
  const shownTarget = pvp.stage === "reveal" && pvp.reveal ? pvp.reveal.shownTarget : pvp.finalTarget ?? pvp.baseTarget;
  return {
    // the phones show their text in the host's language
    lang: currentLang(),
    game: pvp.game,
    stage: pvp.stage,
    round: pvp.round,
    modifier: pvp.modifier,
    previousTarget: Number.isFinite(pvp.lastRoundTarget) ? pvp.lastRoundTarget : null,
    baseTarget: pvp.baseTarget,
    finalTarget: pvp.stage === "reveal" ? shownTarget : pvp.finalTarget,
    waitForHost: pvp.waitForHost,
    autoDueAt: pvp.autoDueAt,
    // the clock: the host's time, compared on the phone with the server's (same computer)
    phaseDeadline: pvp.waitForHost ? null : pvp.phaseDeadline,
    phaseRemaining: pvp.waitForHost && Number.isFinite(pvp.phaseRemaining) ? pvp.phaseRemaining : null,
    timerSeconds: pvp.session.timerSeconds,
    archangelWins: PVP_ARCHANGEL_WINS,
    rules: PVP_COMMANDMENTS,
    players: pvp.slots.map((participant) => {
      if (!participant) return null;
      const artifactShown = pvpRevealShowsArtifact(participant);
      const entry = participant.human ? pvp.session.players[participant.remoteId || participant.id] : null;
      return {
        id: participant.id,
        slot: participant.slot,
        name: participant.name,
        image: participant.image,
        wins: entry?.wins || 0,
        rerolls: entry?.rerolls || 0,
        hp: hideDamage ? pvp.reveal.hpBefore[participant.id] ?? participant.hp : participant.hp,
        eliminated: hideDamage ? participant.eliminated && participant.fellRound !== pvp.round : participant.eliminated,
        lastDamage: hideDamage ? 0 : participant.lastDamage,
        damageSources: hideDamage ? [] : mergeSourceEntries(participant.damageSources),
        guessSubmitted: Number.isFinite(participant.guess),
        autoGuess: participant.autoGuess,
        activeOptions: pvpSelectableActives(participant).map((active) => ({
          id: active.id,
          name: active.name,
          icon: active.icon || null,
          description: normalizeGameText(active.description),
          needsTarget: active.needsTarget
        })),
        activeSubmitted: Boolean(participant.activeChoiceId),
        activeChoiceId: revealActiveChoices ? participant.activeChoiceId : null,
        activeTargetId: revealActiveChoices ? participant.activeTargetId : null,
        activeTimedOut: participant.activeTimedOut,
        activeCast: artifactShown ? participant.activeCast : null,
        activeResolved: artifactShown ? participant.activeResolved : false,
        activeGuaranteeThisRound: participant.activeGuaranteeThisRound,
        activeGuaranteeNextRound: artifactShown ? participant.activeGuaranteeNextRound : false,
        roundStartHp: participant.roundStartHp,
        guess: pvp.stage === "guess" ? null : participant.guess
      };
    }),
    activeResults: pvp.stage === "reveal" ? [] : pvp.activeResults.map((result) => normalizeGameText(result)),
    winner: pvp.stage === "ended" ? pvp.winner : null,
    winners: pvp.stage === "ended" ? pvp.winners : [],
    winReason: pvp.stage === "ended" ? pvpWinReason() : null
  };
}

// one line under the winner's name: why they won. { text, params }: English with placeholders, translated
// where shown (host: t(text, params); the phones get both and do the same)
function pvpWinReason() {
  const pvp = state.pvp;
  const reason = pvp?.winReason;
  if (!reason) return { text: "", params: {} };
  const name = (pvp.winners || []).map((id) => pvp.slots.find((participant) => participant?.id === id)?.name).filter(Boolean)[0] || "";
  if (reason.kind === "last") return { text: "Last soul standing.", params: {} };
  if (reason.kind === "lowestSoul") return { text: "Everyone fell in round {round}. {name} began it with the least SOUL ({soul}).", params: { round: reason.round, name, soul: reason.soul } };
  if (reason.kind === "closest") return { text: "Everyone fell in round {round}, even in SOUL. {name} was closest to the TARGET.", params: { round: reason.round, name } };
  if (reason.kind === "shared") return { text: "Everyone fell in round {round}, even in SOUL and guess. The win is shared.", params: { round: reason.round } };
  return { text: "No soul is left.", params: {} };
}

function pvpWinReasonText() {
  const reason = pvpWinReason();
  return reason.text ? t(reason.text, reason.params) : "";
}

// ---------- the local server ----------
function pvpServerEnabled() {
  return typeof location !== "undefined" && location.protocol !== "file:" && typeof fetch === "function";
}

function pvpHostResetRoom() {
  if (!pvpServerEnabled()) return;
  fetch("/api/reset", { method: "POST" })
    .then(() => pvpPostHostState())
    .catch(() => {});
}

// the address the phones open: the server knows the computer's Wi-Fi address (not localhost)
function pvpFetchJoinInfo() {
  if (!pvpServerEnabled()) return;
  fetch("/api/info", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then((info) => {
      if (!state.pvp || !info) return;
      const urls = Array.isArray(info.controllerUrls) ? info.controllerUrls : [];
      state.pvp.joinInfo = { url: urls[0] || "", others: urls.slice(1, 3) };
      render();
    })
    .catch(() => {});
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
    const response = await fetch("/api/room", { cache: "no-store" });
    if (!response.ok) return;
    const room = await response.json();
    if (!state.pvp) return;
    const players = room.players || [];
    let changed = false;
    changed = pvpImportRemotePlayers(players) || changed;
    changed = pvpImportConnections(players) || changed;
    changed = pvpImportRerolls(players) || changed;
    changed = pvpImportRemoteInputs(players) || changed;
    if (state.pvp.serverDown) {
      state.pvp.serverDown = false;
      changed = true;
    }
    if (changed) {
      pvpMaybeAutoAdvance();
      pvpPostHostState();
      render();
    }
  } catch {
    // phone play is optional; the table keeps working with the DAMNED if the server is gone
    if (state.pvp && !state.pvp.serverDown) {
      state.pvp.serverDown = true;
      render();
    }
  }
}

function pvpImportRemotePlayers(players) {
  if (!state.pvp || state.pvp.stage !== "lobby") return false;
  let changed = false;
  players.forEach((player) => {
    if (!player?.id) return;
    if (state.pvp.session.removedRemoteIds.has(player.id)) return;
    if (state.pvp.slots.some((slot) => slot?.remoteId === player.id)) return;
    const slotIndex = state.pvp.slots.findIndex((slot) => !slot);
    if (slotIndex < 0 && state.pvp.slots.length >= PVP_MAX_SLOT_COUNT) return;
    const targetSlot = slotIndex >= 0 ? slotIndex : state.pvp.slots.length;
    state.pvp.slots[targetSlot] = pvpParticipant(targetSlot, player.name, true, player.id);
    pvpSfx(() => playGameSfx("artifactBuy"));
    changed = true;
  });
  if (changed) pvpNormalizeSlots();
  return changed;
}

// a phone that stopped asking for the room shows a red dot on its seat
function pvpImportConnections(players) {
  let changed = false;
  state.pvp.slots.forEach((participant) => {
    if (!participant?.remoteId) return;
    const player = players.find((candidate) => candidate?.id === participant.remoteId);
    const connected = Boolean(player?.connected);
    if (participant.connected !== connected) {
      participant.connected = connected;
      changed = true;
    }
  });
  return changed;
}

function pvpImportRerolls(players) {
  let changed = false;
  players.forEach((player) => {
    if (!player?.id || !Number.isFinite(player.rerollSeq)) return;
    const participant = state.pvp.slots.find((slot) => slot?.remoteId === player.id);
    const entry = participant ? pvpSessionEntry(participant) : null;
    if (!entry || player.rerollSeq <= entry.rerollSeqSeen) return;
    entry.rerollSeqSeen = player.rerollSeq;
    if (pvpRerollFace(participant, player.rerollKind)) changed = true;
    else changed = true; // the phone still needs to hear that nothing changed
  });
  return changed;
}

function pvpImportRemoteInputs(players) {
  const pvp = state.pvp;
  if (!pvp || (pvp.stage !== "guess" && pvp.stage !== "active")) return false;
  let changed = false;
  players.forEach((player) => {
    if (!player?.id) return;
    const participant = pvp.slots.find((slot) => slot?.remoteId === player.id);
    if (!participant || participant.eliminated) return;

    if (pvp.stage === "guess" && player.guessGame === pvp.game && player.guessRound === pvp.round && Number.isFinite(player.guess)) {
      const guess = Math.ceil(clamp(player.guess, 0, 100));
      if (participant.guess !== guess) {
        participant.guess = guess;
        changed = true;
      }
    }

    if (pvp.stage === "active" && player.activeGame === pvp.game && player.activeRound === pvp.round && player.activeChoiceId) {
      const active = pvpSelectableActives(participant).find((option) => option.id === player.activeChoiceId);
      if (!active) return;
      const targetId = player.activeTargetId || null;
      if (active.needsTarget && !targetId) return;
      if (participant.activeChoiceId !== player.activeChoiceId || participant.activeTargetId !== targetId) {
        participant.activeChoiceId = player.activeChoiceId;
        participant.activeTargetId = targetId;
        changed = true;
      }
    }
  });
  return changed;
}

// ---------- the join code ----------
// A QR code of the phone address (vendored qrcode-generator, 00-vendor-qrcode.js), dark on bone
function pvpQrSvg(text) {
  if (!text || typeof qrcode !== "function") return "";
  try {
    const code = qrcode(0, "M");
    code.addData(text);
    code.make();
    const count = code.getModuleCount();
    const margin = 2;
    const size = count + margin * 2;
    let path = "";
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (code.isDark(row, col)) path += `M${col + margin},${row + margin}h1v1h-1z`;
      }
    }
    return `<svg class="pvp-qr" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" aria-hidden="true"><rect width="${size}" height="${size}" fill="#e9e3d6"/><path d="${path}" fill="#000"/></svg>`;
  } catch (error) {
    return "";
  }
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
