"use strict";

// Central audio tuning. Edit volumes here, then run `pnpm run build:game`.
// Values are multiplied by the in-game Sfx slider and muted by the mute toggle.
const SOUNDTRACK_SRC = "assets/audio/Zingaresca_1910_loop.ogg";
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
