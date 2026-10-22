function masterVolume() {
  return Number.isFinite(state.sound.masterVolume) ? clamp(state.sound.masterVolume, 0, 1) : 1;
}

function musicVolume() {
  return state.sound.muted ? 0 : clamp(state.sound.musicVolume * SOUNDTRACK_LEVEL * masterVolume(), 0, 1);
}

function sfxVolume(baseVolume) {
  return state.sound.muted ? 0 : clamp(baseVolume * state.sound.sfxVolume * masterVolume(), 0, 1);
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
    if (Number.isFinite(saved.masterVolume)) state.sound.masterVolume = clamp(saved.masterVolume, 0, 1);
    if (Number.isFinite(saved.musicVolume)) state.sound.musicVolume = clamp(saved.musicVolume, 0, 1);
    if (Number.isFinite(saved.sfxVolume)) state.sound.sfxVolume = clamp(saved.sfxVolume, 0, 1);
    if (typeof saved.muted === "boolean") state.sound.muted = saved.muted;
    if (typeof saved.muteInBackground === "boolean") state.sound.muteInBackground = saved.muteInBackground;
  } catch (error) {}
}

// Display settings: trembling (line-boil) outlines. Off by default for players who ask their system to reduce motion.
function loadDisplaySettings() {
  const prefersReducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  state.display.outlineBoil = prefersReducedMotion ? 0 : 2;
  state.display.screenShake = prefersReducedMotion ? 0 : 2;
  try {
    const raw = window.localStorage?.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (typeof saved.outlineBoil === "boolean") state.display.outlineBoil = saved.outlineBoil ? 2 : 0;
      else if (Number.isFinite(saved.outlineBoil)) state.display.outlineBoil = clamp(Math.round(saved.outlineBoil), 0, 3);
      if (ANIM_SPEED_VALUES.includes(saved.animSpeed)) state.display.animSpeed = saved.animSpeed;
      if (Number.isFinite(saved.screenShake)) state.display.screenShake = clamp(Math.round(saved.screenShake), 0, 2);
      if (Number.isFinite(saved.flashes)) state.display.flashes = clamp(Math.round(saved.flashes), 0, 1);
      if (Number.isFinite(saved.textSize)) state.display.textSize = clamp(Math.round(saved.textSize), 0, 1);
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
  document.body.classList.toggle("reduce-flashes", !state.display.flashes);
  document.body.classList.toggle("text-large", Boolean(state.display.textSize));
  document.body.dataset.animSpeed = String(animSpeed());
}

// ---------- iPhone: the hand-drawn lines tremble like the outlines ----------
// Safari mis-draws lines whose picture is animated through a CSS variable, so on iPhone the
// picture is stepped from here instead (body[data-line-frame] = 0/1/2, read by styles.css).
let iosLineBoilFrame = 0;
function stepIosLineBoil() {
  const body = document.body;
  if (body?.classList.contains("outline-boil") && !document.hidden) {
    iosLineBoilFrame = (iosLineBoilFrame + 1) % 3;
    body.dataset.lineFrame = String(iosLineBoilFrame);
  }
  const duration = body ? parseFloat(getComputedStyle(body).getPropertyValue("--boil-duration")) : NaN;
  setTimeout(stepIosLineBoil, (Number.isFinite(duration) && duration > 0 ? duration : 375) / 3);
}
if (NATIVE_IOS_APP) setTimeout(stepIosLineBoil, 0);

// ---------- iPhone audio: Web Audio instead of <audio> for the short sounds ----------
// On iPhone, <audio> ignores .volume (everything plays at full volume), starting one is slow
// enough to stutter taps and hit animations, and a playing <audio> makes iOS treat the game as a
// media player (lock screen / Now Playing controls). So on iPhone every sound, the looping music
// included, is decoded once and played through Web Audio with its own gain. The rest of the game
// code is unchanged: this swaps play/pause/load/volume/paused on <audio> elements, on iPhone only.
const iosAudio = NATIVE_IOS_APP ? setupIosAudio() : null;

function setupIosAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || typeof HTMLMediaElement === "undefined" || typeof fetch !== "function") return null;
  let ctx;
  try {
    ctx = new AudioCtx();
  } catch (error) {
    return null;
  }
  const proto = HTMLMediaElement.prototype;
  const nativePause = proto.pause;
  const buffers = new Map(); // url -> AudioBuffer, or a pending Promise, or null when it failed
  const urlOf = (el) => el.currentSrc || el.src || "";
  const isMusic = (el) => Boolean(el.loop);
  const resume = () => {
    if (ctx.state !== "running") ctx.resume().catch(() => {});
  };

  // the music is minutes long: decode it at a lower rate so it does not take ~90 MB of memory
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  function decoderFor(lowRate) {
    if (!lowRate || !OfflineCtx) return ctx;
    try {
      return new OfflineCtx(2, 1, 32000);
    } catch (error) {
      return ctx;
    }
  }

  function loadBuffer(url, lowRate = false) {
    if (!url || buffers.has(url)) return;
    const decoder = decoderFor(lowRate);
    const pending = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => new Promise((resolve, reject) => decoder.decodeAudioData(data, resolve, reject)))
      .then((buffer) => {
        buffers.set(url, buffer);
        return buffer;
      })
      .catch(() => {
        buffers.set(url, null);
        return null;
      });
    buffers.set(url, pending);
  }

  function stopSources(el) {
    if (!el.__iosSources) return;
    el.__iosSources.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
      } catch (error) {}
    });
    el.__iosSources.clear();
  }

  Object.defineProperty(proto, "volume", {
    configurable: true,
    get() {
      return this.__iosVolume ?? 1;
    },
    set(value) {
      const volume = Math.min(1, Math.max(0, Number(value) || 0));
      this.__iosVolume = volume;
      if (this.__iosGain) this.__iosGain.gain.value = volume;
    }
  });

  // ---- looping music: one buffer source at a time, remembers where it was paused ----
  function musicState(el) {
    if (!el.__iosMusic) el.__iosMusic = { source: null, wanted: false, offset: 0, startedAt: 0 };
    return el.__iosMusic;
  }

  function startMusic(el) {
    const music = musicState(el);
    if (!music.wanted || music.source) return;
    const buffer = buffers.get(urlOf(el));
    if (!buffer || typeof buffer.then === "function") return; // starts when decoding finishes
    try {
      if (!el.__iosGain) {
        el.__iosGain = ctx.createGain();
        el.__iosGain.connect(ctx.destination);
      }
      el.__iosGain.gain.value = el.__iosVolume ?? 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(el.__iosGain);
      music.offset %= buffer.duration;
      source.start(0, music.offset);
      music.startedAt = ctx.currentTime;
      music.source = source;
    } catch (error) {}
  }

  function stopMusic(el) {
    const music = el.__iosMusic;
    if (!music) return;
    music.wanted = false;
    if (!music.source) return;
    const duration = music.source.buffer?.duration || 0;
    if (duration) music.offset = (music.offset + ctx.currentTime - music.startedAt) % duration;
    try {
      music.source.stop();
    } catch (error) {}
    music.source = null;
  }

  const nativePaused = Object.getOwnPropertyDescriptor(proto, "paused");
  Object.defineProperty(proto, "paused", {
    configurable: true,
    get() {
      if (this.__iosMusic) return !this.__iosMusic.wanted;
      return nativePaused?.get ? nativePaused.get.call(this) : true;
    }
  });

  proto.load = function () {
    const url = urlOf(this);
    if (!isMusic(this)) {
      loadBuffer(url);
      return;
    }
    loadBuffer(url, true);
    const pending = buffers.get(url);
    if (pending && typeof pending.then === "function") pending.then(() => startMusic(this));
  };

  proto.play = function () {
    resume();
    if (isMusic(this)) {
      const music = musicState(this);
      music.wanted = true;
      if (!buffers.has(urlOf(this))) this.load();
      startMusic(this);
      return Promise.resolve();
    }
    const url = urlOf(this);
    const buffer = buffers.get(url);
    const ended = () => setTimeout(() => this.dispatchEvent(new Event("ended")), 0);
    // still decoding (only in the first moments after launch): skip it rather than blast it
    if (this.muted || !buffer || typeof buffer.then === "function") {
      loadBuffer(url);
      ended();
      return Promise.resolve();
    }
    stopSources(this); // replaying the same element restarts it, as <audio> does
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = this.playbackRate || 1;
      const gain = ctx.createGain();
      gain.gain.value = this.__iosVolume ?? 1;
      source.connect(gain);
      gain.connect(ctx.destination);
      if (!this.__iosSources) this.__iosSources = new Set();
      this.__iosSources.add(source);
      source.onended = () => {
        this.__iosSources?.delete(source);
        this.dispatchEvent(new Event("ended"));
      };
      const offset = Math.max(0, Number(this.__iosStartOffset ?? this.currentTime) || 0);
      source.start(0, Math.min(offset, Math.max(0, buffer.duration - 0.01)));
    } catch (error) {
      ended();
    }
    return Promise.resolve();
  };

  proto.pause = function () {
    stopSources(this);
    stopMusic(this);
    return nativePause.call(this);
  };

  // iPhone only starts (and after a call or the background, restarts) audio from a touch
  ["touchend", "click", "keydown"].forEach((type) => document.addEventListener(type, resume, true));

  return {
    ctx,
    suspend: () => ctx.suspend().catch(() => {}),
    resume
  };
}

// ---------- animation speed (Settings > Gameplay): x1, x2, x4 ----------
// Game animations (SEAL triggers, the READY reveal steps, hits, pops) run this many times faster.
function animSpeed() {
  const value = Number(state.display?.animSpeed);
  return ANIM_SPEED_VALUES.includes(value) ? value : 1;
}

// a duration in ms at the chosen speed
function gameMs(ms) {
  return Math.max(0, Math.round(ms / animSpeed()));
}

// CSS animations of the game itself are sped up as they start (menu, intro and the trembling
// outlines keep their own pace)
const SPEED_SCALED_ANIMATIONS = /^(seal-|slam-wave|hit-|hud-pop|damage-pop|health-ghost|ko-pop|death-pulse|pentakill-fade)/;

function installAnimationSpeed() {
  if (typeof document === "undefined") return;
  document.addEventListener(
    "animationstart",
    (event) => {
      const speed = animSpeed();
      if (speed === 1 || !SPEED_SCALED_ANIMATIONS.test(event.animationName || "")) return;
      const target = event.target;
      if (typeof document.getAnimations !== "function") return;
      // includes the element's ::before / ::after animations (their effect target is the element)
      document.getAnimations().forEach((animation) => {
        if (animation.animationName !== event.animationName || animation.effect?.target !== target) return;
        if (animation.playbackRate !== speed) animation.playbackRate = speed;
      });
    },
    true
  );
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
  snapshot.pauseScreen = "main";
  snapshot.menuCollectionOpen = false;
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
  // the story's two tutorial rounds are not a saved run until the pact is made
  if (typeof introBlocksRunSave === "function" && introBlocksRunSave()) return;
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
    "targetDifferenceDamageByBotId"
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
    "devTemporaryActiveUids",
    "padmaVulnerableBotIds",
    "triggeredPassiveIds",
    "animatedPassiveIds",
    "aliveIdsAtStart",
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
  state.exactGuessCritCharged = Boolean(state.exactGuessCritCharged);
  // SEALS keep their current name and text after a rename (older saves hold a copy of both)
  [...state.player.passives, ...state.shop.map((slot) => slot?.item)].forEach((item) => {
    if (item?.type === "passive" && ITEMS[item.id]) {
      item.name = ITEMS[item.id].name;
      item.description = ITEMS[item.id].description;
    }
  });
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
  // older saves have no snapshot; the records as they are now are the closest guess
  if (!state.recordsAtRunStart || typeof state.recordsAtRunStart !== "object") snapshotRecordsAtRunStart();
  state.roundState = normalizeLoadedRoundState(state.roundState);
  if (!state.finalBossPhase && !state.finalBossQueued) ensureBossKillInterval();
  [...state.player.actives, ...state.shop.map((slot) => slot?.item), state.lastUsedArtifact].forEach((item) => {
    if (item?.type === "active" && ACTIVE_IDS.includes(item.id)) item.price = ITEMS[item.id].price;
  });
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
  // the first-launch story keeps the music off until Satan's pact is sealed
  if (typeof introHoldsMusic === "function" && introHoldsMusic()) return;
  const audio = ensureSoundtrack();
  audio.play().catch(() => {});
}

function primeSfxAudio() {
  if (sfxPrimed) return;
  sfxPrimed = true;
  // iPhone decodes every sound up front (iosAudio), so there is nothing to warm up
  if (iosAudio) return;
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
  iosAudio?.suspend();
}

function resumeGameAudioAfterForeground() {
  iosAudio?.resume();
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
    audio.__iosStartOffset = startOffset;
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
    instance.__iosStartOffset = startOffset;
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

// ---------- moment sounds (GAME_SFX) ----------
const gameSfxCache = {};
let musicDuckTimer = null;

function ensureGameSfx(key) {
  const config = GAME_SFX[key];
  if (!config?.srcs?.length) return [];
  if (!gameSfxCache[key]) {
    gameSfxCache[key] = config.srcs.map((src) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      return loadAudioElement(audio);
    });
  }
  return gameSfxCache[key];
}

function duckMusic(ms) {
  if (!soundtrackAudio || !(ms > 0)) return;
  soundtrackAudio.volume = musicVolume() * 0.35;
  clearTimeout(musicDuckTimer);
  musicDuckTimer = setTimeout(() => {
    if (soundtrackAudio) soundtrackAudio.volume = musicVolume();
  }, ms);
}

function playGameSfx(key) {
  const config = GAME_SFX[key];
  const pool = ensureGameSfx(key);
  if (!config || !pool.length || state.sound.muted) return;
  const audio = pool[Math.floor(Math.random() * pool.length)];
  if (!audio) return;
  try {
    const instance = audio.cloneNode(true);
    instance.volume = sfxVolume(config.volume ?? 0.4);
    if (config.pitch || config.rate) {
      instance.preservesPitch = false;
      instance.playbackRate = (config.rate || 1) * (1 + (Math.random() * 2 - 1) * (config.pitch || 0));
    }
    activeOneShotSfxInstances.add(instance);
    const cleanup = () => activeOneShotSfxInstances.delete(instance);
    instance.addEventListener("ended", cleanup, { once: true });
    instance.addEventListener("error", cleanup, { once: true });
    instance.play().catch(cleanup);
  } catch (error) {}
  if (config.duck) duckMusic(config.duck);
}

// a faint chalk tick when the pointer moves onto a menu button
function installMenuHoverSfx() {
  let lastHovered = null;
  document.addEventListener("pointerover", (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    const button = event.target?.closest?.(".menu-button, .run-slot-button");
    if (button === lastHovered) return;
    lastHovered = button;
    if (button && !button.disabled) playGameSfx("uiHover");
  });
}

function installGameButtonTickSfx() {
  if (gameButtonTickInstalled) return;
  gameButtonTickInstalled = true;
  installMenuHoverSfx();
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
  Object.keys(GAME_SFX).forEach((key) => ensureGameSfx(key));
  installGameButtonTickSfx();
  document.addEventListener("pointerdown", unlockSoundtrack);
  document.addEventListener("keydown", unlockSoundtrack);
}

