function musicVolume() {
  return state.sound.muted ? 0 : clamp(state.sound.musicVolume, 0, 1);
}

function sfxVolume(baseVolume) {
  return state.sound.muted ? 0 : clamp(baseVolume * state.sound.sfxVolume, 0, 1);
}

function applySoundSettings() {
  if (soundtrackAudio) soundtrackAudio.volume = musicVolume();
  if (sealPurchaseSfx) sealPurchaseSfx.volume = sfxVolume(SEAL_PURCHASE_SFX_VOLUME);
  if (guessSfx) guessSfx.volume = sfxVolume(GUESS_SFX_VOLUME);
  if (readySfx) readySfx.volume = sfxVolume(READY_SFX_VOLUME);
  if (nextRoundSfx) nextRoundSfx.volume = sfxVolume(NEXT_ROUND_SFX_VOLUME);
  clockTickSfx.forEach((audio) => {
    if (audio) audio.volume = sfxVolume(CLOCK_TICK_SFX_VOLUME);
  });
  Object.entries(artifactSfx).forEach(([id, audio]) => {
    if (audio) audio.volume = artifactSfxVolume(id);
  });
  if (pentakillSfx) pentakillSfx.volume = pentakillSfxVolume();
}

function loadSoundSettings() {
  try {
    const raw = window.localStorage?.getItem(SOUND_SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Number.isFinite(saved.musicVolume)) state.sound.musicVolume = clamp(saved.musicVolume, 0, 1);
    if (Number.isFinite(saved.sfxVolume)) state.sound.sfxVolume = clamp(saved.sfxVolume, 0, 1);
    if (typeof saved.muted === "boolean") state.sound.muted = saved.muted;
  } catch (error) {}
}

// Display settings: trembling (line-boil) outlines. Off by default for players who ask their system to reduce motion.
function loadDisplaySettings() {
  const prefersReducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  state.display.outlineBoil = prefersReducedMotion ? 0 : 2;
  try {
    const raw = window.localStorage?.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (typeof saved.outlineBoil === "boolean") state.display.outlineBoil = saved.outlineBoil ? 2 : 0;
      else if (Number.isFinite(saved.outlineBoil)) state.display.outlineBoil = clamp(Math.round(saved.outlineBoil), 0, 3);
    }
  } catch (error) {}
  applyDisplaySettings();
}

function saveDisplaySettings() {
  try {
    window.localStorage?.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(state.display));
  } catch (error) {}
}

function applyDisplaySettings() {
  if (typeof document === "undefined" || !document.body) return;
  const level = clamp(Math.round(Number(state.display.outlineBoil) || 0), 0, 3);
  document.body.classList.toggle("outline-boil", level > 0);
  if (level > 0) document.body.style.setProperty("--boil-duration", `${OUTLINE_BOIL_DURATIONS_MS[level]}ms`);
  else document.body.style.removeProperty("--boil-duration");
}

function saveSoundSettings() {
  try {
    window.localStorage?.setItem(SOUND_SETTINGS_STORAGE_KEY, JSON.stringify(state.sound));
  } catch (error) {}
}

function isNativeArcadeApp() {
  return NATIVE_ARCADE_APP || Boolean(typeof document !== "undefined" && document.body?.classList.contains("native-arcade"));
}

function hasSavedArcadeRun() {
  try {
    return readArcadeRunSlots().length > 0;
  } catch (error) {
    return false;
  }
}

function markNativeArcadeResumeOnForeground() {
  if (!isNativeArcadeApp() || state.mode !== "arcade") return;
  try {
    window.sessionStorage?.setItem(ARCADE_RUN_SESSION_RESUME_KEY, "1");
  } catch (error) {}
}

function clearNativeArcadeResumeOnForeground() {
  if (!isNativeArcadeApp()) return;
  try {
    window.sessionStorage?.removeItem(ARCADE_RUN_SESSION_RESUME_KEY);
  } catch (error) {}
}

function shouldResumeNativeArcadeOnForeground() {
  if (!isNativeArcadeApp() || !hasSavedArcadeRun()) return false;
  try {
    return window.sessionStorage?.getItem(ARCADE_RUN_SESSION_RESUME_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function resumeNativeArcadeOnForeground() {
  if (!shouldResumeNativeArcadeOnForeground()) return false;
  if (loadArcadeRun()) {
    render();
    return true;
  }
  clearNativeArcadeResumeOnForeground();
  return false;
}

function encodeArcadeSaveValue(key, value) {
  if (value instanceof Map) {
    return { __dearthType: "Map", entries: Array.from(value.entries()) };
  }
  if (value instanceof Set) {
    return { __dearthType: "Set", values: Array.from(value.values()) };
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    return {
      __dearthType: "Number",
      value: value === Infinity ? "Infinity" : value === -Infinity ? "-Infinity" : "NaN"
    };
  }
  return value;
}

function decodeArcadeSaveValue(key, value) {
  if (!value || typeof value !== "object" || !value.__dearthType) return value;
  if (value.__dearthType === "Map") return new Map(Array.isArray(value.entries) ? value.entries : []);
  if (value.__dearthType === "Set") return new Set(Array.isArray(value.values) ? value.values : []);
  if (value.__dearthType === "Number") {
    if (value.value === "Infinity") return Infinity;
    if (value.value === "-Infinity") return -Infinity;
    return NaN;
  }
  return value;
}

function arcadeRunSaveSnapshot() {
  const snapshot = {};
  Object.keys(state).forEach((key) => {
    if (key === "sound" || key === "pvp" || key === "roundRevealAnimation") return;
    snapshot[key] = state[key];
  });
  snapshot.mode = "arcade";
  snapshot.pauseOpen = false;
  snapshot.pauseDevOpen = false;
  snapshot.mobileOfferingsOpen = false;
  return snapshot;
}

function createArcadeRunSlotId() {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeArcadeRunPayload(payload) {
  if (!payload || payload.version !== ARCADE_RUN_SAVE_VERSION || !payload.state || payload.state.mode !== "arcade") return null;
  const slotId = payload.slotId || payload.state.currentRunSlotId || createArcadeRunSlotId();
  const startedAt = Number(payload.startedAt || payload.state.runStartedAt || payload.savedAt || Date.now());
  const lastPlayedAt = Number(payload.lastPlayedAt || payload.savedAt || startedAt);
  return {
    version: ARCADE_RUN_SAVE_VERSION,
    slotId,
    startedAt,
    lastPlayedAt,
    state: payload.state
  };
}

function sortArcadeRunSlots(slots) {
  return slots
    .map(normalizeArcadeRunPayload)
    .filter(Boolean)
    .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0))
    .slice(0, ARCADE_RUN_SLOT_COUNT);
}

function readLegacyArcadeRunSlot() {
  try {
    const raw = window.localStorage?.getItem(ARCADE_RUN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw, decodeArcadeSaveValue);
    const normalized = normalizeArcadeRunPayload(parsed);
    if (normalized && !parsed.slotId && !parsed.state?.currentRunSlotId) normalized.slotId = "legacy-run";
    return normalized;
  } catch (error) {
    return null;
  }
}

function readArcadeRunSlots() {
  try {
    const raw = window.localStorage?.getItem(ARCADE_RUN_SLOTS_STORAGE_KEY);
    if (!raw) {
      const legacy = readLegacyArcadeRunSlot();
      return legacy ? [legacy] : [];
    }
    const parsed = JSON.parse(raw, decodeArcadeSaveValue);
    const slots = Array.isArray(parsed?.slots) ? parsed.slots : Array.isArray(parsed) ? parsed : [];
    const normalized = sortArcadeRunSlots(slots);
    if (!normalized.length) {
      const legacy = readLegacyArcadeRunSlot();
      return legacy ? [legacy] : [];
    }
    return normalized;
  } catch (error) {
    const legacy = readLegacyArcadeRunSlot();
    return legacy ? [legacy] : [];
  }
}

function writeArcadeRunSlots(slots) {
  const normalized = sortArcadeRunSlots(slots);
  try {
    window.localStorage?.setItem(
      ARCADE_RUN_SLOTS_STORAGE_KEY,
      JSON.stringify({ version: ARCADE_RUN_SAVE_VERSION, slots: normalized }, encodeArcadeSaveValue)
    );
  } catch (error) {}
  return normalized;
}

function upsertArcadeRunPayload(payload) {
  const normalizedPayload = normalizeArcadeRunPayload(payload);
  if (!normalizedPayload) return;
  const slots = readArcadeRunSlots().filter((slot) => slot.slotId !== normalizedPayload.slotId);
  slots.unshift(normalizedPayload);
  writeArcadeRunSlots(slots);
}

function removeArcadeRunSlot(slotId) {
  if (!slotId) return;
  writeArcadeRunSlots(readArcadeRunSlots().filter((slot) => slot.slotId !== slotId));
}

function saveArcadeRun() {
  if (state.mode !== "arcade") return;
  if (state.gameOver) {
    removeArcadeRunSlot(state.currentRunSlotId);
    return;
  }
  try {
    if (!state.currentRunSlotId) state.currentRunSlotId = createArcadeRunSlotId();
    if (!Number.isFinite(state.runStartedAt)) state.runStartedAt = Date.now();
    updateArcadeRecordsFromCurrentRun();
    const payload = {
      version: ARCADE_RUN_SAVE_VERSION,
      slotId: state.currentRunSlotId,
      startedAt: state.runStartedAt,
      savedAt: Date.now(),
      lastPlayedAt: Date.now(),
      state: arcadeRunSaveSnapshot()
    };
    upsertArcadeRunPayload(payload);
  } catch (error) {}
}

function removeCorruptArcadeRunSave(slotId = "") {
  try {
    if (slotId) removeArcadeRunSlot(slotId);
    else {
      window.localStorage?.removeItem(ARCADE_RUN_SLOTS_STORAGE_KEY);
      window.localStorage?.removeItem(ARCADE_RUN_STORAGE_KEY);
    }
  } catch (error) {}
}

function ensureMap(value) {
  if (value instanceof Map) return value;
  return new Map(Array.isArray(value) ? value : []);
}

function ensureSet(value) {
  if (value instanceof Set) return value;
  return new Set(Array.isArray(value) ? value : []);
}

function normalizeLoadedRoundState(round) {
  if (!round || typeof round !== "object") return null;
  [
    "botSubmittedGuesses",
    "botEffectiveGuesses",
    "activeUseItemCounts",
    "artifactTargetCountsByBotId",
    "botDamageTotals",
    "targetDifferenceDamageByBotId",
    "pavlosStartHpById"
  ].forEach((key) => {
    round[key] = ensureMap(round[key]);
  });
  [
    "removedBotIds",
    "twinDetonatorTriggeredIds",
    "highDamageSinBotIds",
    "revealedBotIds",
    "amonRewardKeys",
    "bossRevealPunishedKeys",
    "bossAbilityNullifiedBotIds",
    "belethTriggeredBotIds",
    "vapulaTriggeredBotIds",
    "kalhaSuppressedPassiveIds",
    "pavlosDeferredBotIds",
    "devTemporaryActiveUids",
    "padmaVulnerableBotIds",
    "triggeredPassiveIds",
    "criticalHitKeys"
  ].forEach((key) => {
    round[key] = ensureSet(round[key]);
  });
  if (!Array.isArray(round.extraAverageGuesses)) round.extraAverageGuesses = [];
  if (!Array.isArray(round.temporaryBotSinBonuses)) round.temporaryBotSinBonuses = [];
  if (!Array.isArray(round.eliminationCreditRecords)) round.eliminationCreditRecords = [];
  if (!Array.isArray(round.eliminatedPersonalities)) round.eliminatedPersonalities = [];
  if (!Array.isArray(round.pendingEndOfRoundBotDamages)) round.pendingEndOfRoundBotDamages = [];
  if (!Array.isArray(round.roundEvents)) round.roundEvents = [];
  if (!round.selfStackingConditionCounts || typeof round.selfStackingConditionCounts !== "object") {
    round.selfStackingConditionCounts = {};
  }
  Object.values(SELF_STACKING_SEAL_SPECS).forEach((spec) => {
    if (!Number.isFinite(round.selfStackingConditionCounts[spec.key])) round.selfStackingConditionCounts[spec.key] = 0;
  });
  if (!Number.isFinite(round.selfStackingCriticalDamage)) round.selfStackingCriticalDamage = 0;
  round.resolvingEndOfRoundPassives = false;
  return round;
}

function normalizeLoadedArcadeRun() {
  state.mode = "arcade";
  state.menuScreen = "main";
  state.pauseOpen = false;
  state.pauseDevOpen = false;
  state.mobileOfferingsOpen = false;
  state.pvp = null;
  if (!state.player || typeof state.player !== "object") {
    state.player = { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, credits: STARTING_CREDITS, passives: [], actives: [] };
  }
  if (!Array.isArray(state.player.passives)) state.player.passives = [];
  if (!Array.isArray(state.player.actives)) state.player.actives = [];
  if (!Array.isArray(state.bots)) state.bots = [];
  if (!Array.isArray(state.shop)) state.shop = [];
  if (!Array.isArray(state.log)) state.log = [];
  if (!Array.isArray(state.gameMemory)) state.gameMemory = [];
  if (!Array.isArray(state.playerDamageSources)) state.playerDamageSources = [];
  if (!Array.isArray(state.playerHealSources)) state.playerHealSources = [];
  if (!Array.isArray(state.playerCreditSources)) state.playerCreditSources = [];
  if (!Number.isFinite(state.critMomentumBonus)) state.critMomentumBonus = 0;
  if (!Number.isFinite(state.totalArtifactsUsed)) state.totalArtifactsUsed = 0;
  if (!Number.isFinite(state.pendingSelfStackingPentakillDamage)) state.pendingSelfStackingPentakillDamage = 0;
  state.runStats = normalizeRunStats(state.runStats);
  if (!state.currentRunSlotId) state.currentRunSlotId = createArcadeRunSlotId();
  if (!Number.isFinite(state.runStartedAt)) state.runStartedAt = Date.now();
  selfStackingGameConditionCounts();
  if (!state.lastUsedArtifact || typeof state.lastUsedArtifact !== "object" || !ACTIVE_IDS.includes(state.lastUsedArtifact.id)) {
    state.lastUsedArtifact = null;
  }
  if (!state.sealStats || typeof state.sealStats !== "object") state.sealStats = {};
  state.roundState = normalizeLoadedRoundState(state.roundState);
  state.bots.forEach((bot) => {
    if (!Array.isArray(bot.passiveKeys)) bot.passiveKeys = [];
    bot.passiveKeys = bot.passiveKeys.filter((key) => BOSS_PASSIVES[key]);
    if (bot.isBoss && !bot.uniqueKey && !bot.finalKey && !bot.passiveKeys.length) {
      bot.passiveKeys = randomBossPassiveKeys(1);
    }
    if (bot.buffPassiveKey && !PYROS_GIFT_PASSIVES[bot.buffPassiveKey]) bot.buffPassiveKey = null;
    if (!Array.isArray(bot.memory)) bot.memory = [];
    if (!Array.isArray(bot.damageSources)) bot.damageSources = [];
    if (!Array.isArray(bot.healSources)) bot.healSources = [];
    if (!Array.isArray(bot.sinSources)) bot.sinSources = [];
    trimBotMemoryToLimit(bot);
  });
}

function loadArcadeRun(slotId = "") {
  try {
    const slots = readArcadeRunSlots();
    const payload = normalizeArcadeRunPayload(slotId ? slots.find((slot) => slot.slotId === slotId) : slots[0]);
    if (!payload) return false;
    if (!payload.state || payload.state.mode !== "arcade") {
      removeCorruptArcadeRunSave(slotId);
      return false;
    }
    Object.keys(payload.state).forEach((key) => {
      if (key === "sound" || key === "pvp" || !(key in state)) return;
      state[key] = payload.state[key];
    });
    state.currentRunSlotId = payload.slotId;
    state.runStartedAt = payload.startedAt;
    normalizeLoadedArcadeRun();
    saveArcadeRun();
    return true;
  } catch (error) {
    removeCorruptArcadeRunSave(slotId);
    return false;
  }
}

function loadAudioElement(audio) {
  try {
    audio.load();
  } catch (error) {}
  return audio;
}

function ensureSoundtrack() {
  if (soundtrackAudio) return soundtrackAudio;
  soundtrackAudio = new Audio(SOUNDTRACK_SRC);
  soundtrackAudio.loop = true;
  soundtrackAudio.preload = "auto";
  soundtrackAudio.volume = musicVolume();
  return loadAudioElement(soundtrackAudio);
}

function playSoundtrack() {
  const audio = ensureSoundtrack();
  audio.play().catch(() => {});
}

function primeSfxAudio() {
  if (sfxPrimed) return;
  sfxPrimed = true;
  [
    ensureSealPurchaseSfx(),
    ensureButtonSfx("guess"),
    ensureButtonSfx("ready"),
    ensureNextRoundSfx(),
    ...CLOCK_TICK_SFX_SRCS.map((_, index) => ensureClockTickSfx(index)),
    ...Object.keys(ARTIFACT_SFX).map((id) => ensureArtifactSfx(id)),
    ensurePentakillSfx()
  ].forEach((audio) => {
    if (!audio) return;
    try {
      const primer = audio.cloneNode(true);
      primer.volume = 0;
      const attempt = primer.play();
      const reset = () => {
        try {
          primer.pause();
          primer.currentTime = 0;
        } catch (error) {}
      };
      if (attempt && typeof attempt.then === "function") {
        attempt.then(reset).catch(() => {});
      } else {
        reset();
      }
    } catch (error) {}
  });
}

function unlockSoundtrack() {
  playSoundtrack();
  primeSfxAudio();
  document.removeEventListener("pointerdown", unlockSoundtrack);
  document.removeEventListener("keydown", unlockSoundtrack);
}

function resumeSoundtrack() {
  playSoundtrack();
}

function pauseAudioElement(audio) {
  if (!audio) return;
  try {
    audio.pause();
  } catch (error) {}
}

function pauseGameAudioForBackground() {
  soundtrackPausedByAppBackground = Boolean(soundtrackAudio && !soundtrackAudio.paused);
  [
    soundtrackAudio,
    sealPurchaseSfx,
    guessSfx,
    readySfx,
    nextRoundSfx,
    ...clockTickSfx,
    ...Object.values(artifactSfx),
    pentakillSfx,
    ...activeOneShotSfxInstances
  ].forEach(pauseAudioElement);
  activeOneShotSfxInstances.clear();
}

function resumeGameAudioAfterForeground() {
  if (!soundtrackPausedByAppBackground) return;
  soundtrackPausedByAppBackground = false;
  resumeSoundtrack();
}

function ensureSealPurchaseSfx() {
  if (sealPurchaseSfx) return sealPurchaseSfx;
  sealPurchaseSfx = new Audio(SEAL_PURCHASE_SFX_SRC);
  sealPurchaseSfx.preload = "auto";
  sealPurchaseSfx.volume = sfxVolume(SEAL_PURCHASE_SFX_VOLUME);
  return loadAudioElement(sealPurchaseSfx);
}

function ensureButtonSfx(kind) {
  if (kind === "guess") {
    if (!guessSfx) {
      guessSfx = new Audio(GUESS_SFX_SRC);
      guessSfx.preload = "auto";
      guessSfx.volume = sfxVolume(GUESS_SFX_VOLUME);
      loadAudioElement(guessSfx);
    }
    return guessSfx;
  }

  if (!readySfx) {
    readySfx = new Audio(READY_SFX_SRC);
    readySfx.preload = "auto";
    readySfx.volume = sfxVolume(READY_SFX_VOLUME);
    loadAudioElement(readySfx);
  }
  return readySfx;
}

function ensureNextRoundSfx() {
  if (nextRoundSfx) return nextRoundSfx;
  nextRoundSfx = new Audio(NEXT_ROUND_SFX_SRC);
  nextRoundSfx.preload = "auto";
  nextRoundSfx.volume = sfxVolume(NEXT_ROUND_SFX_VOLUME);
  return loadAudioElement(nextRoundSfx);
}

function ensureClockTickSfx(index) {
  if (!clockTickSfx[index]) {
    const audio = new Audio(CLOCK_TICK_SFX_SRCS[index]);
    audio.preload = "auto";
    audio.volume = sfxVolume(CLOCK_TICK_SFX_VOLUME);
    clockTickSfx[index] = loadAudioElement(audio);
  }
  return clockTickSfx[index];
}

function artifactSfxConfig(id) {
  return ARTIFACT_SFX[id] || null;
}

function artifactSfxVolume(id) {
  const config = artifactSfxConfig(id);
  return sfxVolume(config?.volume ?? DEFAULT_ARTIFACT_SFX_VOLUME);
}

function pentakillSfxVolume() {
  return sfxVolume(PENTAKILL_SFX.volume);
}

function ensureArtifactSfx(id) {
  const config = artifactSfxConfig(id);
  if (!config?.src) return null;
  if (!artifactSfx[id]) {
    const audio = new Audio(config.src);
    audio.preload = "auto";
    audio.volume = artifactSfxVolume(id);
    artifactSfx[id] = loadAudioElement(audio);
  }
  return artifactSfx[id];
}

function ensurePentakillSfx() {
  if (!PENTAKILL_SFX.src) return null;
  if (!pentakillSfx) {
    pentakillSfx = new Audio(PENTAKILL_SFX.src);
    pentakillSfx.preload = "auto";
    pentakillSfx.volume = pentakillSfxVolume();
    loadAudioElement(pentakillSfx);
  }
  return pentakillSfx;
}

function playOneShot(audio, startOffset = 0) {
  try {
    audio.currentTime = Math.max(0, startOffset);
    audio.play().catch(() => {});
  } catch (error) {}
}

function playClonedOneShot(audio, volume, startOffset = 0) {
  try {
    const instance = audio.cloneNode(true);
    instance.volume = volume;
    activeOneShotSfxInstances.add(instance);
    const cleanup = () => activeOneShotSfxInstances.delete(instance);
    instance.addEventListener("ended", cleanup, { once: true });
    instance.addEventListener("error", cleanup, { once: true });
    instance.currentTime = Math.max(0, startOffset || 0);
    instance.play().catch(cleanup);
  } catch (error) {}
}

function playSealPurchaseSfx() {
  playOneShot(ensureSealPurchaseSfx());
}

function playGuessSfx() {
  playOneShot(ensureButtonSfx("guess"), GUESS_SFX_START_OFFSET);
}

function playReadySfx() {
  playOneShot(ensureButtonSfx("ready"));
}

function playNextRoundSfx() {
  playOneShot(ensureNextRoundSfx());
}

function playClockTickSfx() {
  const tickIndex = nextClockTickIndex % CLOCK_TICK_SFX_SRCS.length;
  nextClockTickIndex = (nextClockTickIndex + 1) % CLOCK_TICK_SFX_SRCS.length;
  playClonedOneShot(ensureClockTickSfx(tickIndex), sfxVolume(CLOCK_TICK_SFX_VOLUME));
}

function playArtifactSfx(id) {
  const config = artifactSfxConfig(id);
  const audio = ensureArtifactSfx(id);
  if (!audio || !config) return;
  playClonedOneShot(audio, artifactSfxVolume(id), config.startOffset || 0);
}

function playPentakillSfx() {
  const audio = ensurePentakillSfx();
  if (!audio) return;
  playClonedOneShot(audio, pentakillSfxVolume(), PENTAKILL_SFX.startOffset || 0);
}

function installGameButtonTickSfx() {
  if (gameButtonTickInstalled) return;
  gameButtonTickInstalled = true;
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target?.closest?.("button");
      if (!button || button.disabled) return;
      playClockTickSfx();
    },
    true
  );
}

function installSoundtrack() {
  ensureSoundtrack();
  ensureSealPurchaseSfx();
  ensureButtonSfx("guess");
  ensureButtonSfx("ready");
  ensureNextRoundSfx();
  CLOCK_TICK_SFX_SRCS.forEach((_, index) => ensureClockTickSfx(index));
  Object.keys(ARTIFACT_SFX).forEach((id) => ensureArtifactSfx(id));
  ensurePentakillSfx();
  installGameButtonTickSfx();
  document.addEventListener("pointerdown", unlockSoundtrack);
  document.addEventListener("keydown", unlockSoundtrack);
}

