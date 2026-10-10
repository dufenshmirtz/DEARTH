"use strict";

// Central audio tuning. Edit volumes here, then run `pnpm run build:game`.
// Values are multiplied by the in-game Sfx slider and muted by the mute toggle.
// PLACEHOLDER for the vibe (Tricky, "Hell Is Round the Corner" instrumental): not licensed, replace before release.
// The previous track is still in assets/audio/Zingaresca_1910_loop.ogg.
const SOUNDTRACK_SRC = "assets/audio/music/hell-is-round-the-corner-placeholder.mp3";
const SOUNDTRACK_VOLUME = 0.55;

const SEAL_PURCHASE_SFX_SRC = "assets/audio/dragon-studio-evil-laughter-353177.mp3";
const GUESS_SFX_SRC = "assets/audio/Guess.mp3";
const READY_SFX_SRC = "assets/audio/Ready.mp3";
const NEXT_ROUND_SFX_SRC = "assets/audio/nextroundSound.mp3";
const CLOCK_TICK_SFX_SRCS = [
  "assets/audio/tickinclock_RdeIBkld.mp3",
  "assets/audio/tickinclock_N3shRVgw.mp3"
];

const SEAL_PURCHASE_SFX_VOLUME = 0.055;
const GUESS_SFX_VOLUME = 0.9;
const READY_SFX_VOLUME = 0.2;
const NEXT_ROUND_SFX_VOLUME = 0.2;
const CLOCK_TICK_SFX_VOLUME = 0.154;
const GUESS_SFX_START_OFFSET = 0.12;

const DEFAULT_ARTIFACT_SFX_VOLUME = 0.45;
const ARTIFACT_SFX = {
  a6: { src: "assets/audio/artifacts/Altar.mp3", volume: 0.45 },
  a7: { src: "assets/audio/artifacts/Statue.mp3", volume: 0.45 },
  a8: { src: "assets/audio/artifacts/goat.mp3", volume: 0.45 },
  a9: { src: "assets/audio/artifacts/invertedCross.mp3", volume: 0.42 },
  a10: { src: "assets/audio/artifacts/coin.mp3", volume: 0.48 },
  a11: { src: "assets/audio/artifacts/VialofBlood.mp3", volume: 0.5 },
  a12: { src: "assets/audio/artifacts/invertedCross.mp3", volume: 0.38 },
  a14: { src: "assets/audio/artifacts/candle.mp3", volume: 0.45 },
  a15: { src: "assets/audio/artifacts/Dagger.mp3", volume: 0.5 },
  a18: { src: "assets/audio/artifacts/Crystal.mp3", volume: 0.5 },
  a21: { src: "assets/audio/artifacts/pentakill.mp3", volume: 0.44 },
  a22: { src: "assets/audio/artifacts/chalice.mp3", volume: 0.42 },
  a23: { src: "assets/audio/artifacts/book.mp3", volume: 0.48 },
  a25: { src: "assets/audio/artifacts/lamb.mp3", volume: 0.55 },
  a28: { src: "assets/audio/artifacts/skull.mp3", volume: 0.43 }
};

const PENTAKILL_SFX = {
  src: "assets/audio/artifacts/voodoo.mp3",
  volume: 0.43
};

// Sounds for game moments (hits, KOs, CRITICAL, bosses, shop...).
// Every file in assets/audio/sfx/ is a placeholder Claude synthesised; drop a real
// recording in with the same file name to replace it, or point `srcs` at a new file.
// `srcs`: one is picked at random each time. `pitch`: random +/- playback-rate variation.
// `duck`: lowers the music for that many milliseconds so big stingers cut through.
const GAME_SFX = {
  hitSmall: { srcs: ["assets/audio/sfx/hit-small-1.mp3", "assets/audio/sfx/hit-small-2.mp3"], volume: 0.32, pitch: 0.07 },
  hitMid: { srcs: ["assets/audio/sfx/hit-mid-1.mp3", "assets/audio/sfx/hit-mid-2.mp3"], volume: 0.42, pitch: 0.05 },
  hitBig: { srcs: ["assets/audio/sfx/hit-big-1.mp3", "assets/audio/sfx/hit-big-2.mp3"], volume: 0.5, pitch: 0.04 },
  ko: { srcs: ["assets/audio/sfx/ko.mp3"], volume: 0.42, pitch: 0.03 },
  sealCharge: { srcs: ["assets/audio/sfx/seal-charge.mp3"], volume: 0.5, pitch: 0.03 },
  sealSlam: { srcs: ["assets/audio/sfx/seal-slam.mp3"], volume: 0.55, pitch: 0.04 },
  critical: { srcs: ["assets/audio/sfx/critical.mp3"], volume: 0.6, duck: 900 },
  targetLand: { srcs: ["assets/audio/sfx/target-land.mp3"], volume: 0.42 },
  sinGain: { srcs: ["assets/audio/sfx/sin-gain-1.mp3", "assets/audio/sfx/sin-gain-2.mp3"], volume: 0.26, pitch: 0.04 },
  heal: { srcs: ["assets/audio/sfx/heal.mp3"], volume: 0.3 },
  reroll: { srcs: ["assets/audio/sfx/reroll.mp3"], volume: 0.38, pitch: 0.05 },
  sell: { srcs: ["assets/audio/sfx/sell.mp3"], volume: 0.32 },
  artifactBuy: { srcs: ["assets/audio/sfx/artifact-buy.mp3"], volume: 0.4, pitch: 0.04 },
  bossArrive: { srcs: ["assets/audio/sfx/boss-arrive.mp3"], volume: 0.5, duck: 1800 },
  finalBosses: { srcs: ["assets/audio/sfx/final-bosses.mp3"], volume: 0.5, duck: 3600 },
  shopSealed: { srcs: ["assets/audio/sfx/shop-sealed.mp3"], volume: 0.42 },
  gameOver: { srcs: ["assets/audio/sfx/game-over.mp3"], volume: 0.5, duck: 4500 },
  uiHover: { srcs: ["assets/audio/sfx/ui-hover.mp3"], volume: 0.12, pitch: 0.1 }
};
