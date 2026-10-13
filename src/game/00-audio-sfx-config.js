"use strict";

// Central audio tuning. Then run `pnpm run build:game`.
//
// LOUDNESS BALANCE: every sound is given a tier instead of a raw volume. levelVolume() reads how
// loud the file really is (AUDIO_LOUDNESS, measured by `pnpm run audio:levels`) and sets the volume
// so it plays at its tier's level, whatever level the file was recorded at.
// - New or replaced audio file: run `pnpm run audio:levels`, give it a tier below, rebuild.
// - A whole group too loud or quiet: change that tier's number in SFX_LEVELS (dB; +3 is clearly louder).
// - One sound: add a trim in dB, e.g. levelVolume(src, "accent", -2).
// Results are multiplied by the in-game Sfx slider (and the Music slider for the soundtrack).
const SFX_LEVELS = {
  stinger: -17, // CRITICAL, seal slam, PENTAKILL, bosses, Judgement, game over
  big: -19,     // big hits, KO, the seal charging
  accent: -21,  // medium hits, TARGET, GUESS, next round, shop sealed
  item: -22,    // seals and items triggering
  feedback: -24,// small hits, SIN, heal, shop buttons, READY
  effect: -26,  // what SEALs do to a DAMNED (BOUNTY, MEMORY, personality), just under a small hit
  tick: -33,    // the click on every button (the clock tick sound)
  quiet: -29,   // background layers (the laugh when a seal is bought)
  ui: -34,      // menu hover
  music: -24    // the soundtrack at the default Music slider
};
const UNMEASURED_LOUDNESS = -16;

function levelVolume(srcs, tier, trimDb = 0) {
  const list = Array.isArray(srcs) ? srcs : [srcs];
  const table = typeof AUDIO_LOUDNESS === "object" ? AUDIO_LOUDNESS : {};
  const key = tier === "music" ? "i" : "m";
  const measured = list.map((src) => table[src]?.[key]).filter(Number.isFinite);
  const loudness = measured.length ? measured.reduce((sum, value) => sum + value, 0) / measured.length : UNMEASURED_LOUDNESS;
  const target = (SFX_LEVELS[tier] ?? SFX_LEVELS.feedback) + trimDb;
  return Math.min(1, Math.round(Math.pow(10, (target - loudness) / 20) * 1000) / 1000);
}

// PLACEHOLDER for the vibe (Tricky, "Hell Is Round the Corner" instrumental): not licensed, replace before release.
// The previous track is still in assets/audio/Zingaresca_1910_loop.ogg.
const SOUNDTRACK_SRC = "assets/audio/music/hell-is-round-the-corner-placeholder.mp3";
const SOUNDTRACK_VOLUME = 0.55; // default position of the Music slider
const SOUNDTRACK_LEVEL = levelVolume(SOUNDTRACK_SRC, "music") / SOUNDTRACK_VOLUME;

const SEAL_PURCHASE_SFX_SRC = "assets/audio/dragon-studio-evil-laughter-353177.mp3";
const GUESS_SFX_SRC = "assets/audio/Guess.mp3";
const READY_SFX_SRC = "assets/audio/Ready.mp3";
const NEXT_ROUND_SFX_SRC = "assets/audio/nextroundSound.mp3";
const CLOCK_TICK_SFX_SRCS = [
  "assets/audio/tickinclock_RdeIBkld.mp3",
  "assets/audio/tickinclock_N3shRVgw.mp3"
];

const SEAL_PURCHASE_SFX_VOLUME = levelVolume(SEAL_PURCHASE_SFX_SRC, "quiet");
const GUESS_SFX_VOLUME = levelVolume(GUESS_SFX_SRC, "accent");
const READY_SFX_VOLUME = levelVolume(READY_SFX_SRC, "feedback", -3); // the bell a bit lower
const NEXT_ROUND_SFX_VOLUME = levelVolume(NEXT_ROUND_SFX_SRC, "accent");
const CLOCK_TICK_SFX_VOLUME = levelVolume(CLOCK_TICK_SFX_SRCS, "tick");
const GUESS_SFX_START_OFFSET = 0.12;

const DEFAULT_ARTIFACT_SFX_VOLUME = levelVolume([], "item");
const ARTIFACT_SFX = {
  a6: { src: "assets/audio/artifacts/Altar.mp3", tier: "item" },
  a7: { src: "assets/audio/artifacts/Statue.mp3", tier: "item" },
  a8: { src: "assets/audio/artifacts/goat.mp3", tier: "item" },
  a9: { src: "assets/audio/artifacts/invertedCross.mp3", tier: "item" },
  a10: { src: "assets/audio/artifacts/coin.mp3", tier: "item" },
  a11: { src: "assets/audio/artifacts/VialofBlood.mp3", tier: "item" },
  a12: { src: "assets/audio/artifacts/invertedCross.mp3", tier: "item" },
  a14: { src: "assets/audio/artifacts/candle.mp3", tier: "item" },
  a15: { src: "assets/audio/artifacts/Dagger.mp3", tier: "item" },
  a18: { src: "assets/audio/artifacts/Crystal.mp3", tier: "item" },
  a21: { src: "assets/audio/artifacts/pentakill.mp3", tier: "item" },
  a22: { src: "assets/audio/artifacts/chalice.mp3", tier: "item" },
  a23: { src: "assets/audio/artifacts/book.mp3", tier: "item" },
  a25: { src: "assets/audio/artifacts/lamb.mp3", tier: "item" },
  a28: { src: "assets/audio/artifacts/skull.mp3", tier: "item" }
};

const PENTAKILL_SFX = {
  src: "assets/audio/artifacts/voodoo.mp3",
  tier: "stinger"
};

// Sounds for game moments (hits, KOs, CRITICAL, bosses, shop...).
// Every file in assets/audio/sfx/ is a placeholder Claude synthesised; drop a real
// recording in with the same file name to replace it, or point `srcs` at a new file.
// `srcs`: one is picked at random each time. `pitch`: random +/- playback-rate variation.
// `tier`: loudness group (SFX_LEVELS). `trim`: optional extra dB for one sound.
// `duck`: lowers the music for that many milliseconds so big stingers cut through.
const GAME_SFX = {
  hitSmall: { srcs: ["assets/audio/sfx/hit-small-1.mp3", "assets/audio/sfx/hit-small-2.mp3"], tier: "feedback", trim: 3, pitch: 0.07 },
  hitMid: { srcs: ["assets/audio/sfx/hit-mid-1.mp3", "assets/audio/sfx/hit-mid-2.mp3"], tier: "accent", trim: 3, pitch: 0.05 },
  hitBig: { srcs: ["assets/audio/sfx/hit-big-1.mp3", "assets/audio/sfx/hit-big-2.mp3"], tier: "big", trim: 3, pitch: 0.04 },
  ko: { srcs: ["assets/audio/sfx/ko.mp3"], tier: "big", pitch: 0.03 },
  sealCharge: { srcs: ["assets/audio/sfx/seal-charge.mp3"], tier: "big", pitch: 0.03 },
  sealSlam: { srcs: ["assets/audio/sfx/seal-slam.mp3"], tier: "stinger", pitch: 0.04 },
  critical: { srcs: ["assets/audio/sfx/critical.mp3"], tier: "stinger", duck: 900 },
  criticalBell: { srcs: ["assets/audio/sfx/critical-bell.mp3"], tier: "stinger" }, // plays together with `critical` when YOU score a CRITICAL
  targetLand: { srcs: ["assets/audio/sfx/target-land.mp3"], tier: "accent" },
  sinGain: { srcs: ["assets/audio/sfx/sin-gain-1.mp3", "assets/audio/sfx/sin-gain-2.mp3"], tier: "feedback", pitch: 0.04 },
  heal: { srcs: ["assets/audio/sfx/heal.mp3"], tier: "feedback" },
  reroll: { srcs: ["assets/audio/sfx/reroll.mp3"], tier: "feedback", pitch: 0.05 },
  sell: { srcs: ["assets/audio/sfx/sell.mp3"], tier: "feedback" },
  artifactBuy: { srcs: ["assets/audio/sfx/artifact-buy.mp3"], tier: "feedback", pitch: 0.04 },
  bossArrive: { srcs: ["assets/audio/sfx/boss-arrive.mp3"], tier: "stinger", duck: 1800 },
  finalBosses: { srcs: ["assets/audio/sfx/final-bosses.mp3"], tier: "stinger", duck: 3600 },
  shopSealed: { srcs: ["assets/audio/sfx/shop-sealed.mp3"], tier: "accent" },
  gameOver: { srcs: ["assets/audio/sfx/game-over.mp3"], tier: "stinger", duck: 4500 },
  uiHover: { srcs: ["assets/audio/sfx/ui-hover.mp3"], tier: "ui", pitch: 0.1 },
  // what SEALs do to a DAMNED, during the seal animation
  bountyUp: { srcs: ["assets/audio/sfx/bounty-up.mp3"], tier: "effect", pitch: 0.04 },
  bountyDown: { srcs: ["assets/audio/sfx/bounty-down.mp3"], tier: "effect", pitch: 0.04 },
  memoryUp: { srcs: ["assets/audio/sfx/memory-up.mp3"], tier: "effect" },
  memoryDown: { srcs: ["assets/audio/sfx/memory-down.mp3"], tier: "effect" },
  personalityChange: { srcs: ["assets/audio/sfx/personality-change.mp3"], tier: "effect" },
  // a SEAL sold: a soft ghostly breath under the coin sound
  sealSellGhost: { srcs: ["assets/audio/sfx/seal-sell-ghost.mp3"], tier: "effect" },
  // first-launch story (09-intro-story.js), synthesised placeholders like the rest of sfx/.
  // Satan's laugh reuses the seal-purchase laugh, slowed down. `rate`: fixed playback speed (below 1 = deeper)
  introBell: { srcs: ["assets/audio/intro/intro-bell.mp3"], tier: "stinger" },
  introPencil: {
    srcs: [1, 2, 3, 4, 5].map((n) => `assets/audio/intro/intro-pencil-${n}.mp3`),
    tier: "tick",
    trim: -8, // one per letter, so they pile up into a continuous scratch
    pitch: 0.12
  },
  introBoot: { srcs: ["assets/audio/intro/intro-boot.mp3"], tier: "stinger" },
  introEvil: { srcs: ["assets/audio/intro/intro-evil.mp3"], tier: "stinger" },
  introLaugh: { srcs: [SEAL_PURCHASE_SFX_SRC], tier: "big", rate: 0.84 },
  introBurn: { srcs: ["assets/audio/intro/intro-burn.mp3"], tier: "accent" },
  menuJesusFlash: { srcs: ["assets/audio/sfx/critical-bell.mp3"], tier: "accent" }
};

// tiers -> volumes (see SFX_LEVELS at the top)
Object.values(ARTIFACT_SFX).forEach((config) => { config.volume = levelVolume(config.src, config.tier, config.trim); });
PENTAKILL_SFX.volume = levelVolume(PENTAKILL_SFX.src, PENTAKILL_SFX.tier, PENTAKILL_SFX.trim);
Object.values(GAME_SFX).forEach((config) => { config.volume = levelVolume(config.srcs, config.tier, config.trim); });
