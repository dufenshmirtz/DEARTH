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

function saveSoundSettings() {
  try {
    window.localStorage?.setItem(SOUND_SETTINGS_STORAGE_KEY, JSON.stringify(state.sound));
  } catch (error) {}
}

function isNativeArcadeApp() {
  return NATIVE_ARCADE_APP || Boolean(typeof document !== "undefined" && document.body?.classList.contains("native-arcade"));
}

function hasSavedArcadeRun() {
  if (!isNativeArcadeApp()) return false;
  try {
    return Boolean(window.localStorage?.getItem(ARCADE_RUN_STORAGE_KEY));
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
    if (key === "sound" || key === "pvp") return;
    snapshot[key] = state[key];
  });
  snapshot.mode = "arcade";
  snapshot.pauseOpen = false;
  snapshot.pauseDevOpen = false;
  snapshot.mobileOfferingsOpen = false;
  return snapshot;
}

function saveArcadeRun() {
  if (!isNativeArcadeApp() || state.mode !== "arcade") return;
  try {
    const payload = {
      version: ARCADE_RUN_SAVE_VERSION,
      savedAt: Date.now(),
      state: arcadeRunSaveSnapshot()
    };
    window.localStorage?.setItem(ARCADE_RUN_STORAGE_KEY, JSON.stringify(payload, encodeArcadeSaveValue));
  } catch (error) {}
}

function removeCorruptArcadeRunSave() {
  try {
    window.localStorage?.removeItem(ARCADE_RUN_STORAGE_KEY);
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
  if (!Array.isArray(round.roundEvents)) round.roundEvents = [];
  if (!round.selfStackingConditionCounts || typeof round.selfStackingConditionCounts !== "object") {
    round.selfStackingConditionCounts = {};
  }
  Object.values(SELF_STACKING_SEAL_SPECS).forEach((spec) => {
    if (!Number.isFinite(round.selfStackingConditionCounts[spec.key])) round.selfStackingConditionCounts[spec.key] = 0;
  });
  if (!Number.isFinite(round.selfStackingCriticalDamage)) round.selfStackingCriticalDamage = 0;
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

function loadArcadeRun() {
  if (!isNativeArcadeApp()) return false;
  try {
    const raw = window.localStorage?.getItem(ARCADE_RUN_STORAGE_KEY);
    if (!raw) return false;
    const payload = JSON.parse(raw, decodeArcadeSaveValue);
    if (!payload || payload.version !== ARCADE_RUN_SAVE_VERSION || !payload.state || payload.state.mode !== "arcade") {
      removeCorruptArcadeRunSave();
      return false;
    }
    Object.keys(payload.state).forEach((key) => {
      if (key === "sound" || key === "pvp" || !(key in state)) return;
      state[key] = payload.state[key];
    });
    normalizeLoadedArcadeRun();
    return true;
  } catch (error) {
    removeCorruptArcadeRunSave();
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
    ...CLOCK_TICK_SFX_SRCS.map((_, index) => ensureClockTickSfx(index))
  ].forEach((audio) => {
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
    ...activeClockTickInstances
  ].forEach(pauseAudioElement);
  activeClockTickInstances.clear();
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

function playOneShot(audio, startOffset = 0) {
  try {
    audio.currentTime = Math.max(0, startOffset);
    audio.play().catch(() => {});
  } catch (error) {}
}

function playClonedOneShot(audio, volume) {
  try {
    const instance = audio.cloneNode(true);
    instance.volume = volume;
    activeClockTickInstances.add(instance);
    const cleanup = () => activeClockTickInstances.delete(instance);
    instance.addEventListener("ended", cleanup, { once: true });
    instance.addEventListener("error", cleanup, { once: true });
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
  installGameButtonTickSfx();
  document.addEventListener("pointerdown", unlockSoundtrack);
  document.addEventListener("keydown", unlockSoundtrack);
}

