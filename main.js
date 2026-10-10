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
  sealSlam: { srcs: ["assets/audio/sfx/seal-slam.mp3"], volume: 0.5, pitch: 0.05 },
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
"use strict";

const GAME_VERSION = "0.1.0";

const BASE_PASSIVE_LIMIT = 3;
const MAX_PASSIVE_LIMIT = 6;
const MAX_REVEALED_DAMNED = 4;
const ACTIVE_LIMIT = 5;
const BOT_COUNT = 5;
const PLAYER_MAX_HP = 100;
const NON_BOSS_MEMORY_LIMIT = 20;
const BOT_MIN_HP = 20;
const BOT_MAX_HP = 60;
const STARTING_CREDITS = 8;
const BASE_TARGET_MODIFIER = 0.8;
const FINAL_BOSS_TARGET_MODIFIER = 0.666;
const SCALING_BREAKPOINT_BOSSES = 4;
const ENDLESS_SCALING_BREAKPOINT_BOSSES = 8;
const BOT_HP_BONUS_PER_BOSS = 17;
const BOT_HP_BONUS_PER_BOSS_LATE = 18;
const BOT_HP_BONUS_PER_BOSS_ENDLESS = 50;
const BOSS_HP_BONUS_PER_SPAWN = 50;
const BOSS_HP_BONUS_PER_SPAWN_LATE = 55;
const BOSS_HP_BONUS_PER_SPAWN_ENDLESS = 150;
const HP_EXPONENTIAL_RATE = 1.2;
const HP_EXPONENTIAL_STEP_BOSSES = 3;
const SIN_PRICE_PRESSURE_INTERVAL = 150;
const ACTIVE_USES_PER_ROUND = 2;
const UNIQUE_BOSS_INTERVAL = 8;
const ENDLESS_BOSS_INTERVAL = 8;
const PVP_SLOT_COUNT = 5;
const PVP_MAX_SLOT_COUNT = 12;
const PVP_MAX_HP = 100;
const PVP_MODIFIERS = [0.7, 0.8, 0.9, 1, 1.1, 1.2];
const PVP_MODIFIER_INTERVAL = 3;
const PVP_PHASE_AUTO_DELAY = 450;
const PVP_SUMMARY_AUTO_DELAY = 10000;
const SOUND_SETTINGS_STORAGE_KEY = "dearthSoundSettings";
const DISPLAY_SETTINGS_STORAGE_KEY = "dearthDisplaySettings";
// Trembling outlines: 0 = off, 1 = slow (4 drawings/s), 2 = normal (8/s), 3 = fast (12/s)
const OUTLINE_BOIL_LABELS = ["Off", "Slow", "Normal", "Fast"];
const OUTLINE_BOIL_DURATIONS_MS = [0, 750, 375, 250];
const ARCADE_RUN_STORAGE_KEY = "dearthArcadeRunSaveV1";
const ARCADE_RUN_SLOTS_STORAGE_KEY = "dearthArcadeRunSlotsV1";
const ARCADE_RECORDS_STORAGE_KEY = "dearthArcadeRecordsV1";
const ARCADE_RUN_SESSION_RESUME_KEY = "dearthArcadeRunResumeOnForeground";
const ARCADE_RUN_SAVE_VERSION = 1;
const ARCADE_RUN_SLOT_COUNT = 5;
const NATIVE_ARCADE_APP = typeof window !== "undefined" && window.DEARTH_APP_MODE === "arcade-native";
const FINAL_BOSS_JESUS_SRC = "assets/bots/final-bosses/jesusboss.png";
const FINAL_BOSS_SATAN_SRC = "assets/bots/final-bosses/satanboss.png";
const SHOP_ELITE_CHANCE = 0.08;
const PVP_ACTIVES = [
  {
    id: "pulse",
    name: "Demon Bowl",
    icon: "assets/artifacts/occult-new-9/demon-bowl-incantation-bowl.png",
    description: "Deal 3 damage to everyone else.",
    needsTarget: false
  },
  {
    id: "rise",
    name: "Ceremonial Altar",
    icon: "assets/artifacts/occult-items-17/17 CEREMONIAL ALTAR.png",
    description: "Change the final TARGET by +5.",
    needsTarget: false
  },
  {
    id: "sink",
    name: "Black Candle",
    icon: "assets/artifacts/occult-items-17/02 BLACK CANDLE.png",
    description: "Change the final TARGET by -5.",
    needsTarget: false
  },
  {
    id: "shield",
    name: "Dark Talisman",
    icon: "assets/artifacts/occult-items-17/16 DARK TALISMAN.png",
    description: "You take 50% less damage this round.",
    needsTarget: false
  },
  {
    id: "markBest",
    name: "Sacrificial Dagger",
    icon: "assets/artifacts/occult-items-17/01 SACRIFICIAL DAGGER.png",
    description: "Deal 5 damage to every player tied closest to the first TARGET.",
    needsTarget: false
  },
  {
    id: "jam",
    name: "Inverted Cross",
    icon: "assets/artifacts/occult-items-17/11 INVERTED CROSS.png",
    description: "Pick a player whose guess does not count for the final TARGET.",
    needsTarget: true
  }
];
const PVP_SKIP_ACTIVE = {
  id: "skip",
  name: "Skip",
  description: "Do not use an Artifact this round. Your next round Artifact casts for sure.",
  needsTarget: false,
  skip: true
};

const ITEMS = {
  p1: {
    id: "p1",
    type: "passive",
    name: "Seal of Vassago",
    price: 13,
    description: "New non-boss DAMNED arrive with 3 MEMORY. At end of round, each DAMNED takes 1 damage per MEMORY. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p2: {
    id: "p2",
    type: "passive",
    name: "Seal of Paimon",
    price: 15,
    description: "If your final guess is close to the TARGET, gain ladder SIN: 1 at +/-5, +1 per step closer, up to 5 at +/-1. On exact TARGET, gain 10 SIN. ELITE doubles all SIN gained."
  },
  p3: {
    id: "p3",
    type: "passive",
    name: "Seal of Alloces",
    price: 7,
    description: "If the rounded TARGET is a multiple of 3, all DAMNED take 20 extra damage. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p4: {
    id: "p4",
    type: "passive",
    name: "Seal of Andras",
    price: 12,
    description: "If your final effective guess is 0, 50, or 100, deal 10 damage to every DAMNED, take half TARGET-difference damage, and ignore worst guess penalty damage. ELITE multiplies only the damage by x1.5 each level, rounded up."
  },
  p5: {
    id: "p5",
    type: "passive",
    name: "Seal of Haures",
    price: 9,
    description: "Whenever you take damage, all DAMNED take the same amount of extra damage. ELITE multiplies the echoed damage by x1.5 each level, rounded up."
  },
  p6: {
    id: "p6",
    type: "passive",
    name: "Seal of Orias",
    price: 13,
    description: "Your CRITICAL hit triggers when your guess is within 2 of the right integer. ELITE widens the CRITICAL range by +1 each level."
  },
  p7: {
    id: "p7",
    type: "passive",
    name: "Seal of Glasya-Labolas",
    price: 12,
    description: "When you hit CRITICAL, it deals 20 damage to everyone else. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p8: {
    id: "p8",
    type: "passive",
    name: "Seal of Buer",
    price: 7,
    description: "At end of round, gain 5 SIN. ELITE increases this payout by +20%."
  },
  p9: {
    id: "p9",
    type: "passive",
    name: "Seal of Marbas",
    price: 12,
    description: "Every DAMNED elimination spreads 3 SIN and 3 MEMORY randomly among the DAMNED of the next round. ELITE increases only the SIN spread by +20%."
  },
  p10: {
    id: "p10",
    type: "passive",
    name: "Seal of Gusion",
    price: 11,
    description: "Half of MEMORY gained by a DAMNED is converted to BOUNTY, rounded down. Half of BOUNTY gained by a DAMNED is converted to MEMORY, rounded down. ELITE converts +1 extra MEMORY or BOUNTY each level when this triggers."
  },
  p11: {
    id: "p11",
    type: "passive",
    name: "Seal of Valefor",
    price: 12,
    description: "When a DAMNED dies, gain a random ARTIFACT with 0 sell value if you have room. ELITE gives +1 random ARTIFACT each level."
  },
  p12: {
    id: "p12",
    type: "passive",
    name: "Seal of Belial",
    price: 11,
    description: "At end of round, for every 10 SIN you have, deal 2 damage to every DAMNED. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p13: {
    id: "p13",
    type: "passive",
    name: "Seal of Bune",
    price: 14,
    description: "If two or more DAMNED are eliminated in a round, gain 8 SIN. If two or more with the same personality were eliminated, gain 16 SIN. ELITE increases the payout by +20%."
  },
  p14: {
    id: "p14",
    type: "passive",
    name: "Seal of Leraje",
    price: 12,
    description: "At the start of each round, deal 20 damage to a random DAMNED and change their personality to STUBBORN. If that damage eliminates them, gain 8 SIN. ELITE multiplies the damage by x1.5 each level, rounded up, and increases the SIN payout by +20%."
  },
  p15: {
    id: "p15",
    type: "passive",
    name: "Seal of Bathin",
    price: 11,
    description:
      "Whenever MEMORY would be added to a DAMNED, add +1 extra MEMORY and deal 3 damage to that DAMNED. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p16: {
    id: "p16",
    type: "passive",
    name: "Seal of Bael",
    price: 10,
    description: "If a DAMNED's guess is less than 5 away from their previous guess, they take 10 damage. If it is exactly the same, they take 30 damage. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p17: {
    id: "p17",
    type: "passive",
    name: "Seal of Dantalion",
    price: 15,
    description: "At end of round, deal damage equal to the total MEMORY of all DAMNED on the board, including dead ones, to one random living DAMNED. If any BOSSES are active, hit all active BOSSES instead and exclude BOSS MEMORY from the sum. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p18: {
    id: "p18",
    type: "passive",
    name: "Seal of Berith",
    price: 8,
    description: "At end of round, this SEAL's sell value increases by 3. ELITE increases the sell-value growth by +20% each level, rounded up."
  },
  p19: {
    id: "p19",
    type: "passive",
    name: "Seal of Sabnock",
    price: 13,
    description: "Every time a DAMNED dies, deal 5 damage to every other DAMNED. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p20: {
    id: "p20",
    type: "passive",
    name: "Seal of Haagenti",
    price: 12,
    description: "Devil's Offerings has one more ARTIFACT slot. Whenever you use an ARTIFACT, all DAMNED take damage equal to that ARTIFACT's purchase cost. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p21: {
    id: "p21",
    type: "passive",
    name: "Seal of Shax",
    price: 10,
    description: "Every time you reroll Devil's Offerings, all DAMNED take damage equal to double the SIN spent at end of round. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p22: {
    id: "p22",
    type: "passive",
    name: "Seal of Botis",
    price: 14,
    description: "Avoid 20% of damage you would take in a round, rounded down, and convert the avoided damage into MEMORY for the living DAMNED with the most MEMORY. ELITE doubles only the MEMORY added each level."
  },
  p23: {
    id: "p23",
    type: "passive",
    name: "Seal of Seere",
    price: 10,
    description: "New non-boss DAMNED have a 33% chance to spawn with +6 BOUNTY. ELITE increases the spawn chance by +20% each level, capped at 100%."
  },
  p24: {
    id: "p24",
    type: "passive",
    name: "Seal of Orobas",
    price: 9,
    description: "You can use only one ARTIFACT per round. All DAMNED pay 1.5x BOUNTY SIN when eliminated. ELITE increases the payout multiplier by +20% each level; the one-ARTIFACT limit does not change."
  },
  p25: {
    id: "p25",
    type: "passive",
    name: "Seal of Valac",
    price: 17,
    description: "Gain +2 ARTIFACT uses per round and +2 ARTIFACT inventory slots. Each ELITE level adds +2 more to both."
  },
  p26: {
    id: "p26",
    type: "passive",
    name: "Seal of Amdusias",
    price: 14,
    description: "Once per ARTIFACT type each round, when you use two matching ARTIFACTS, deal 30 damage to all DAMNED. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p27: {
    id: "p27",
    type: "passive",
    name: "Seal of Zagan",
    price: 10,
    description: "Every ARTIFACT used triggers one of three outcomes: gain 3 SIN, damage a random DAMNED, or refund that ARTIFACT's purchase cost. ELITE multiplies the damage outcome by x1.5 each level, rounded up, and increases the SIN outcome by +20%."
  },
  p28: {
    id: "p28",
    type: "passive",
    name: "Seal of Ose",
    price: 14,
    description: "Copies a random SEAL you own and keeps copying it. If that SEAL is sold, Ose chooses another owned SEAL. If no SEAL is available, it waits for the next SEAL you buy. ELITE makes the copied SEAL resolve one level stronger each level."
  },
  p29: {
    id: "p29",
    type: "passive",
    name: "Seal of Furfur",
    price: 10,
    description: "For every 2 SIN you spend in a round, deal 1 damage to the highest-HEALTH DAMNED. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p30: {
    id: "p30",
    type: "passive",
    name: "Seal of Andrealphus",
    price: 9,
    description: "Every time a DAMNED is eliminated, deal 10 damage to the DAMNED on its left and right. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p31: {
    id: "p31",
    type: "passive",
    name: "Seal of Murmur",
    price: 14,
    description: "At end of round, two random DAMNED take damage equal to their BOUNTY. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p32: {
    id: "p32",
    type: "passive",
    name: "Seal of Foras",
    price: 14,
    description: "Every time a DAMNED dies, all other DAMNED gain +1 or +2 BOUNTY. ELITE increases the BOUNTY gain by +20% each level, rounded up."
  },
  p33: {
    id: "p33",
    type: "passive",
    name: "Seal of Marchosias",
    price: 17,
    description: "Every time a DAMNED is eliminated, all other DAMNED take damage equal to that DAMNED's BOUNTY. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p34: {
    id: "p34",
    type: "passive",
    name: "Seal of Gremory",
    price: 16,
    description: "Whenever a DAMNED with 6 or more BOUNTY dies, deal 10 damage to the highest-HEALTH enemy and give it +1 BOUNTY. ELITE multiplies the damage by x1.5 and increases the BOUNTY gain by +20%."
  },
  p35: {
    id: "p35",
    type: "passive",
    name: "Seal of Forneus",
    price: 15,
    description: "At end of round, the two highest BOUNTY DAMNED gain +1 BOUNTY. ELITE levels add +1 BOUNTY."
  },
  p36: {
    id: "p36",
    type: "passive",
    name: "Pandorium Contract",
    price: 15,
    description: "Removed. ELITE does not change this effect."
  },
  p37: {
    id: "p37",
    type: "passive",
    name: "Seal of Malphas",
    price: 11,
    description: "When you take 4 or less TARGET-difference damage in a round, gain 7 SIN. ELITE increases this payout by +20%."
  },
  p38: {
    id: "p38",
    type: "passive",
    name: "Seal of Astaroth",
    price: 12,
    description: "At the start of each round, mark a DAMNED until round end. If the marked DAMNED dies, its BOUNTY payout becomes double BOUNTY or 6 SIN, whichever is greater, and you gain 5 SIN. ELITE increases the payout bonus and SIN gain by +20% each level."
  },
  p39: {
    id: "p39",
    type: "passive",
    name: "Seal of Purson",
    price: 10,
    description: "Starts with 1 stack. Rounds without buying from Devil's Offerings add a stack. Buying an offering resets it. At end of round, gain SIN equal to its stacks. ELITE increases the end-round SIN payout by +20% each level."
  },
  p40: {
    id: "p40",
    type: "passive",
    name: "Seal of Focalor",
    price: 14,
    description: "At end of round, deal half the total BOUNTY of living DAMNED to every enemy. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p41: {
    id: "p41",
    type: "passive",
    name: "Seal of Bifrons",
    price: 15,
    description: "If the rounded TARGET is a multiple of 7, gain SIN equal to your current SIN. ELITE increases the paid SIN by +20%."
  },
  p42: {
    id: "p42",
    type: "passive",
    name: "Seal of Stolas",
    price: 13,
    description:
      "When a DAMNED with 3 or less MEMORY dies, gain SIN equal to its MEMORY. If it had more than 3 MEMORY, split its MEMORY between the DAMNED on its left and right; with only one side, only half is transferred and the rest is lost. ELITE increases only the low-MEMORY SIN payout by +20%."
  },
  p43: {
    id: "p43",
    type: "passive",
    name: "Seal of Raum",
    price: 12,
    description: "Whenever a DAMNED loses SIN, it takes 20 damage. At end of round, all DAMNED lose 1 SIN. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p44: {
    id: "p44",
    type: "passive",
    name: "Seal of Andromalius",
    price: 15,
    description: "At end of round, any non-boss DAMNED with 2 or less BOUNTY is eliminated. Its SIN goes to the living DAMNED with the highest BOUNTY. ELITE increases the BOUNTY limit by +1 each level."
  },
  p45: {
    id: "p45",
    type: "passive",
    name: "Seal of Crocell",
    price: 11,
    description: "DAMNED with 3 or less BOUNTY pay double BOUNTY SIN when eliminated. ELITE increases the payout multiplier by +20% each level."
  },
  p46: {
    id: "p46",
    type: "passive",
    name: "Seal of Barbatos",
    price: 12,
    description: "Whenever a DAMNED with 6 or more BOUNTY takes damage, it takes 5 extra damage. ELITE multiplies the extra damage by x1.5 each level, rounded up."
  },
  p47: {
    id: "p47",
    type: "passive",
    name: "Seal of Ronove",
    price: 11,
    description: "At end of round, a DAMNED loses half its BOUNTY and you gain double the SIN removed. ELITE adds one more DAMNED target each level."
  },
  p48: {
    id: "p48",
    type: "passive",
    name: "Seal of Cimejes",
    price: 11,
    description: "At start of round, double a random DAMNED's BOUNTY for 1 round. ELITE levels double one extra random DAMNED."
  },
  p49: {
    id: "p49",
    type: "passive",
    name: "Seal of Phenex",
    price: 16,
    description: "Using an ARTIFACT that targets one or more DAMNED increases those DAMNED's BOUNTY by 3. ELITE increases the BOUNTY gain by +20% each level, rounded up."
  },
  p50: {
    id: "p50",
    type: "passive",
    name: "Seal of Agares",
    price: 14,
    description: "At end of round, 20% of SIN earned this round spreads among DAMNED, prioritizing highest BOUNTY. DAMNED take 5 damage per BOUNTY gained from this SEAL. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p51: {
    id: "p51",
    type: "passive",
    name: "Seal of Marax",
    price: 11,
    description: "Once each round per DAMNED, when that DAMNED has taken more than 30% max-HEALTH damage, its BOUNTY increases by 4. ELITE increases the BOUNTY gain by +20% each level, rounded up."
  },
  p52: {
    id: "p52",
    type: "passive",
    name: "Seal of Decarabia",
    price: 12,
    description: "At end of round, DAMNED take 3 damage per MEMORY. BOSSES take 1 damage per MEMORY instead. ELITE multiplies both per-MEMORY damage values by x1.5 each level, rounded up."
  },
  p53: {
    id: "p53",
    type: "passive",
    name: "Seal of Samigina",
    price: 11,
    description: "When a non-boss DAMNED is eliminated, gain bonus SIN equal to its MEMORY. ELITE increases this SIN payout by +20% each level."
  },
  p54: {
    id: "p54",
    type: "passive",
    name: "Seal of Zepar",
    price: 12,
    description: "When revealed DAMNED take TARGET-difference damage, each adjacent DAMNED takes that much damage too. ELITE multiplies the echoed damage by x1.5 each level, rounded up."
  },
  p55: {
    id: "p55",
    type: "passive",
    name: "Seal of Sitri",
    price: 11,
    description:
      "Excess MEMORY that would be added to a DAMNED becomes 10 damage per excess MEMORY to that DAMNED. ELITE doubles this damage each level."
  },
  p56: {
    id: "p56",
    type: "passive",
    name: "Seal of Halphas",
    price: 14,
    description: "At end of round, deal round x BOSSES defeated total damage, spread randomly among enemies. ELITE gives +2 SIN each round per upgrade."
  },
  p57: {
    id: "p57",
    type: "passive",
    name: "Seal of Balam",
    price: 14,
    description:
      "If a non-boss DAMNED has 10+ MEMORY and 10+ BOUNTY, it is instantly eliminated. Its max HEALTH becomes damage spread to other DAMNED; if BOSSES are active, BOSSES take the damage. ELITE multiplies the collapse damage by x1.5 each level, rounded up."
  },
  p58: {
    id: "p58",
    type: "passive",
    name: "Seal of Ipos",
    price: 13,
    description:
      "The worst guess penalty hits the 3 furthest guesses. The furthest takes 20 damage, the next two take 10. ELITE multiplies both damage values by x1.5 each level, rounded up."
  },
  p59: {
    id: "p59",
    type: "passive",
    name: "Seal of Amon",
    price: 12,
    description:
      "Reveal one extra DAMNED each round. Revealed DAMNED gain +2 BOUNTY and +2 MEMORY, and the gains stay even if they are not revealed next round. ELITE adds +1 BOUNTY to the reveal reward."
  },
  p60: {
    id: "p60",
    type: "passive",
    name: "Seal of Gaap",
    price: 14,
    description:
      "Whenever you use an ARTIFACT, 50% chance to create a copy of it in your inventory and deal 5 damage to every DAMNED. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p61: {
    id: "p61",
    type: "passive",
    name: "Seal of Vepar",
    price: 13,
    description:
      "BOSSES can have their guess revealed. At the start of each round, each revealed DAMNED gains 1 poison. At end of round, each poison deals 5% max-HEALTH damage. ELITE adds +2% per poison."
  },
  p62: {
    id: "p62",
    type: "passive",
    name: "Seal of Beleth",
    price: 12,
    description: "The first time each full-HEALTH DAMNED takes damage in a round, it takes 10 extra damage. ELITE multiplies the extra damage by x1.5 each level, rounded up."
  },
  p63: {
    id: "p63",
    type: "passive",
    name: "Seal of Vual",
    price: 10,
    description: "Whenever a revealed DAMNED takes damage, it takes 15 extra damage. ELITE multiplies the extra damage by x1.5 each level, rounded up."
  },
  p64: {
    id: "p64",
    type: "passive",
    name: "Seal of Vine",
    price: 10,
    description:
      "Revealed DAMNED pay double BOUNTY SIN when eliminated. ELITE raises the payout multiplier by +20%."
  },
  p65: {
    id: "p65",
    type: "passive",
    name: "Seal of Naberius",
    price: 10,
    description: "At end of round, revealed DAMNED take damage equal to half their guess. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p66: {
    id: "p66",
    type: "passive",
    name: "Seal of Aim",
    price: 15,
    description: "When the TARGET is a multiple of 5, eliminate one random non-boss DAMNED. If a BOSS is active, deal 30 damage to each active BOSS. ELITE multiplies only the BOSS damage by x1.5 each level, rounded up."
  },
  p67: {
    id: "p67",
    type: "passive",
    name: "Seal of Caim",
    price: 11,
    description: "DAMNED with 8 or more MEMORY pay double BOUNTY SIN when eliminated. ELITE increases the payout multiplier by +20%."
  },
  p68: {
    id: "p68",
    type: "passive",
    name: "Seal of Vapula",
    price: 13,
    description:
      "Once per round per DAMNED, when a DAMNED with 8 or more MEMORY takes damage, it takes 10 extra damage. With more than 12 MEMORY, it takes 15 extra damage. ELITE multiplies both damage values by x1.5 each level, rounded up."
  },
  p69: {
    id: "p69",
    type: "passive",
    name: "Seal of Eligos",
    price: 14,
    description:
      "Whenever a DAMNED hits CRITICAL, your guess counts as CRITICAL too and DAMNED CRITICAL damage cannot hurt you. DAMNED hit CRITICAL within +/-1 of the TARGET. ELITE adds +/-1 to the DAMNED CRITICAL range."
  },
  p70: {
    id: "p70",
    type: "passive",
    name: "Seal of Amy",
    price: 12,
    description:
      "Sacrificial Dagger deals 10 extra flat damage and appears twice as often in Devil's Offerings. ELITE multiplies the flat damage by x1.5 each level, rounded up."
  },
  p71: {
    id: "p71",
    type: "passive",
    name: "Seal of Sallos",
    price: 14,
    description:
      "Before damage calculation, all DAMNED guesses shift away from the TARGET by a random 2, 3, 4, or 5 without changing the average. ELITE adds one larger shift value each level."
  },
  p72: {
    id: "p72",
    type: "passive",
    name: "Seal of Furcas",
    price: 11,
    description:
      "Every round, if the previous TARGET was below 40, one random non-boss DAMNED guess becomes 100. If it was above 40, one random DAMNED guess becomes 0. ELITE deals 5 damage per level to the selected DAMNED."
  },
  p73: {
    id: "p73",
    type: "passive",
    name: "Seal of Asmoday",
    price: 12,
    description: "When a DAMNED dies from excess damage, split that excess damage equally among the other living enemies. ELITE multiplies the excess damage split by x1.5 each level, rounded up."
  },
  p74: {
    id: "p74",
    type: "passive",
    name: "Seal of the White Horse",
    price: 20,
    description: "DAMNED with 10 or more BOUNTY take x1.5 damage from all sources. ELITE adds +0.2 to the multiplier."
  },
  p75: {
    id: "p75",
    type: "passive",
    name: "Seal of the Red Horse",
    price: 20,
    description: "Revealed DAMNED take x1.5 damage from all sources. ELITE adds +0.2 to the multiplier."
  },
  p76: {
    id: "p76",
    type: "passive",
    name: "Seal of the Black Horse",
    price: 20,
    description: "Non-boss DAMNED with 10 or more MEMORY take x1.5 damage from all sources. If a BOSS is active, this SEAL's damage is dealt to that BOSS instead. ELITE adds +0.2 to the multiplier."
  },
  p77: {
    id: "p77",
    type: "passive",
    name: "Seal of the Pale Horse",
    price: 20,
    description: "If you score CRITICAL this round, DAMNED take x1.5 damage from all sources next round. ELITE adds +0.2 to the multiplier."
  },
  p78: {
    id: "p78",
    type: "passive",
    name: "Seal of the Souls of Martyrs",
    price: 20,
    description: "DAMNED with the STUBBORN personality take x1.5 damage from all sources. ELITE adds +0.2 to the multiplier."
  },
  p79: {
    id: "p79",
    type: "passive",
    name: "Seal of Creation Uncreated",
    price: 20,
    description: "DAMNED take x1.5 damage from all sources if an ARTIFACT was used on them this round. ELITE adds +0.2 to the multiplier."
  },
  p80: {
    id: "p80",
    type: "passive",
    name: "Seal of Silence in Heaven",
    price: 20,
    description: "DAMNED take x1.5 damage if they have more than 10 TARGET-difference damage. Worst guess penalty counts as TARGET-difference damage. ELITE adds +0.2 to the multiplier."
  },
  p81: {
    id: "p81",
    type: "passive",
    name: "Seal of Buer",
    price: 12,
    description: "If a DAMNED has more than 16 MEMORY, their guess is revealed. ELITE does not change this effect."
  },
  p82: {
    id: "p82",
    type: "passive",
    name: "Seal of Marked Offering",
    price: 11,
    description: "Using an ARTIFACT on a DAMNED has a 50% chance to reveal their guess. ELITE adds +10% reveal chance."
  },
  p84: {
    id: "p84",
    type: "passive",
    name: "Seal of Astaroth",
    price: 13,
    description: "At end of round, every revealed DAMNED makes each adjacent DAMNED take damage equal to that revealed DAMNED's TARGET-difference damage this round. Worst guess penalty counts as TARGET-difference damage. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p85: {
    id: "p85",
    type: "passive",
    name: "Seal of Berith",
    price: 14,
    description: "At end of round, each DAMNED takes 10 damage for every other living DAMNED with the same personality. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p86: {
    id: "p86",
    type: "passive",
    name: "Seal of Haures",
    price: 14,
    description: "When a DAMNED is eliminated, 50% chance the replacement arrives with the same personality, MEMORY, name, number, and flag. ELITE adds +10% chance."
  },
  p87: {
    id: "p87",
    type: "passive",
    name: "Seal of Purson",
    price: 13,
    description: "When a DAMNED is eliminated, deal 30 damage to each other living DAMNED with the same personality. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p88: {
    id: "p88",
    type: "passive",
    name: "Seal of Raum",
    price: 16,
    description: "When a DAMNED dies, half of their BOUNTY is added to each other living DAMNED with the same personality. You gain that dead DAMNED's BOUNTY. ELITE increases the added and gained SIN by +20%."
  },
  p89: {
    id: "p89",
    type: "passive",
    name: "Seal of Marax",
    price: 16,
    description: "DAMNED can only have two personalities: ANALYST or STUBBORN. At end of round, a DAMNED takes 5 damage if both adjacent DAMNED have the same personality. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p90: {
    id: "p90",
    type: "passive",
    name: "Seal of Bifrons",
    price: 15,
    description: "Whenever a DAMNED's personality is altered by a SEAL or ARTIFACT, they take 10 damage. At the end of each round, one DAMNED has their personality altered to the most prevalent personality. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p91: {
    id: "p91",
    type: "passive",
    name: "Seal of Aim",
    price: 14,
    description: "Scoring CRITICAL increases your CRITICAL range by +1, up to +4. If you do not score CRITICAL in a round, this resets. ELITE adds +5 CRITICAL damage."
  },
  p92: {
    id: "p92",
    type: "passive",
    name: "Seal of Dantre",
    price: 16,
    description: "At reveal, 30% chance to change the TARGET to your guess. ELITE adds +5% chance, capped at 80%."
  },
  p93: {
    id: "p93",
    type: "passive",
    name: "Seal of Zilon",
    price: 16,
    description: "At reveal, 30% chance to double every DAMNED BOUNTY. ELITE adds +5% chance, capped at 80%."
  },
  p94: {
    id: "p94",
    type: "passive",
    name: "Seal of Serafeim",
    price: 16,
    description: "At reveal, 30% chance to give 5 random temporary ARTIFACTS usable only this round. ELITE adds +5% chance, capped at 80%."
  },
  p95: {
    id: "p95",
    type: "passive",
    name: "Seal of Pyros",
    price: 16,
    description: "At reveal, 30% chance for revealed DAMNED to lose 50% current HEALTH. ELITE adds +5% chance, capped at 80%."
  },
  p96: {
    id: "p96",
    type: "passive",
    name: "Seal of Padma",
    price: 16,
    description: "At reveal, 30% chance to make every personality STUBBORN. DAMNED already STUBBORN take 25% extra damage this round. ELITE adds +5% chance, capped at 80%."
  },
  p97: {
    id: "p97",
    type: "passive",
    name: "Seal of Threon",
    price: 16,
    description: "At reveal, 30% chance for all DAMNED to gain up to the highest living non-boss DAMNED MEMORY and take damage equal to their original MEMORY. ELITE adds +5% chance, capped at 80%."
  },
  p110: {
    id: "p110",
    type: "passive",
    name: "Seal of Petros-Pavlos",
    price: 16,
    description: "At reveal, 30% chance to remove all MEMORY and BOUNTY from all DAMNED, then each DAMNED takes damage equal to the total removed MEMORY and BOUNTY. ELITE adds +5% chance, capped at 80%."
  },
  p111: {
    id: "p111",
    type: "passive",
    name: "Seal of Satan",
    price: 50,
    description: "Takes 2 SEAL slots. At end of round, divide 666 by a random number from 1 to 100 and deal the result as damage to every DAMNED. ELITE multiplies the max divisor by x0.8 each level."
  },
  p98: {
    id: "p98",
    type: "passive",
    name: "Seal of Samael Star",
    price: 15,
    description: "Whenever you hit CRITICAL, this SEAL gains +3 damage, then your CRITICAL hits deal its current damage as extra damage. Cannot be upgraded."
  },
  p99: {
    id: "p99",
    type: "passive",
    name: "Seal of Cassiel Sigil",
    price: 15,
    description: "Whenever a non-boss DAMNED exceeds 10 MEMORY, this SEAL gains +2 damage, then that DAMNED takes its current damage. Cannot be upgraded."
  },
  p100: {
    id: "p100",
    type: "passive",
    name: "Seal of Bethor",
    price: 15,
    description: "At end of round, if the regular BOUNTY sum of all living DAMNED is more than 40, this SEAL gains +1 damage, then all DAMNED take its current damage. Cannot be upgraded."
  },
  p101: {
    id: "p101",
    type: "passive",
    name: "Seal of Aggiel Hexagram",
    price: 15,
    description: "Whenever you make a PENTAKILL, this SEAL gains +5 damage, then its current damage is dealt to all DAMNED at the next end of round. Cannot be upgraded."
  },
  p102: {
    id: "p102",
    type: "passive",
    name: "Seal of Zachriel Triangle",
    price: 15,
    description: "Whenever a revealed DAMNED dies, this SEAL gains +1 damage, then adjacent DAMNED take its current damage. Cannot be upgraded."
  },
  p103: {
    id: "p103",
    type: "passive",
    name: "Seal of Cassiel Pentagram",
    price: 15,
    description: "Every 20 ARTIFACTS used, this SEAL gains +1 damage. After that, every ARTIFACT used deals its current damage to all DAMNED. Cannot be upgraded."
  },
  p104: {
    id: "p104",
    type: "passive",
    name: "Seal of Alloces",
    price: 13,
    description: "At end of round, STUBBORN DAMNED gain +1 additional MEMORY and +1 BOUNTY. When a DAMNED is revealed, their personality changes to STUBBORN. ELITE adds +1 to both end-of-round gains."
  },
  p105: {
    id: "p105",
    type: "passive",
    name: "Seal of Andras",
    price: 13,
    description: "Using an ARTIFACT on a DAMNED has a 50% chance to change their personality to STUBBORN. At end of round, BOSSES take 5 damage for every STUBBORN DAMNED. ELITE adds +10% chance and multiplies the BOSS damage by x1.5 each level, rounded up."
  },
  p106: {
    id: "p106",
    type: "passive",
    name: "Seal of Zagan",
    price: 15,
    description: "At end of round, DAMNED with the most prevalent personality take 5 damage for every DAMNED with that personality. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p107: {
    id: "p107",
    type: "passive",
    name: "Seal of Ose",
    price: 14,
    description: "STUBBORN DAMNED guesses can only be up to 2 away from their previous guess. At the start of every round, one random DAMNED personality changes to STUBBORN. ELITE deals 5 damage to every STUBBORN DAMNED per ELITE level."
  },
  p108: {
    id: "p108",
    type: "passive",
    name: "Seal of Orobas",
    price: 14,
    description: "When a STUBBORN DAMNED dies, all BOSSES take 30 damage. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p109: {
    id: "p109",
    type: "passive",
    name: "Seal of Samael Triangle",
    price: 15,
    description: "Whenever a STUBBORN DAMNED dies, this SEAL gains +1 damage, then all non-STUBBORN DAMNED take its current damage. Cannot be upgraded."
  },
  a28: {
    id: "a28",
    type: "active",
    name: "Engraved Skull",
    price: 4,
    description: "Pick a DAMNED. It gains 6 MEMORY, 6 SIN, and heals 6% max HEALTH."
  },
  a14: {
    id: "a14",
    type: "active",
    name: "Black Candle",
    price: 4,
    description: "During reveal, reduce the TARGET by 10."
  },
  a15: {
    id: "a15",
    type: "active",
    name: "Sacrificial Dagger",
    price: 4,
    description: "Pick a DAMNED. Deal 20% max-HEALTH damage to non-boss DAMNED, or 10% to BOSSES."
  },
  a6: {
    id: "a6",
    type: "active",
    name: "Ceremonial Altar",
    price: 4,
    description: "During reveal, add 20 to the TARGET."
  },
  a7: {
    id: "a7",
    type: "active",
    name: "Demonic Idol",
    price: 6,
    description: "Pick a non-boss DAMNED and swap your effective guess with theirs."
  },
  a8: {
    id: "a8",
    type: "active",
    name: "Goat Head",
    price: 3,
    description: "Pick a DAMNED; their guess counts five times for the TARGET average."
  },
  a9: {
    id: "a9",
    type: "active",
    name: "Inverted Cross",
    price: 3,
    description: "Pick a DAMNED; remove their guess from the TARGET average, though they still take damage."
  },
  a10: {
    id: "a10",
    type: "active",
    name: "Funeral Coin",
    price: 4,
    description: "Gain 3 to 10 SIN."
  },
  a11: {
    id: "a11",
    type: "active",
    name: "Vial of Blood",
    price: 2,
    description: "Pick two non-boss DAMNED. The first takes 30% max-HEALTH damage. The second overheals 30% max HEALTH and copies the first's ability."
  },
  a12: {
    id: "a12",
    type: "active",
    name: "Dark Talisman",
    price: 4,
    description: "You take 50% less damage this round, including CRITICAL damage. Multiple uses stack multiplicatively."
  },
  a13: {
    id: "a13",
    type: "active",
    name: "The White-Hilted Knife",
    price: 4,
    description: "Removed."
  },
  a16: {
    id: "a16",
    type: "active",
    name: "Dr Dee's Gold Disc",
    price: 4,
    description: "Gain a random 3 to 9 SIN."
  },
  a18: {
    id: "a18",
    type: "active",
    name: "Corrupted Crystal",
    price: 4,
    description: "Instantly copy the effect of the last non-Crystal ARTIFACT you used."
  },
  a24: {
    id: "a24",
    type: "active",
    name: "Dr Dee's Crystal",
    price: 4,
    description: "Reserved for a future ARTIFACT."
  },
  a21: {
    id: "a21",
    type: "active",
    name: "Voodoo Doll",
    price: 4,
    description: "This round, whenever you take damage, each DAMNED takes max-HEALTH damage equal to the same percent of your max HEALTH that you took."
  },
  a22: {
    id: "a22",
    type: "active",
    name: "Cursed Chalice",
    price: 7,
    description: "+1 CRITICAL range for the round."
  },
  a23: {
    id: "a23",
    type: "active",
    name: "Satanic Bible",
    price: 3,
    description: "Double the ELITE chance for the SEAL slot on the next Devil's Offerings reroll."
  },
  a25: {
    id: "a25",
    type: "active",
    name: "Mummified Lamb",
    price: 3,
    description: "Pick a DAMNED. Next round, reveal its guess and give it +3 BOUNTY."
  },
  a26: {
    id: "a26",
    type: "active",
    name: "Spirit Board",
    price: 3,
    description: "Reserved for a future ARTIFACT."
  }
};

const PASSIVE_IDS = [
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "p7",
  "p9",
  "p10",
  "p11",
  "p12",
  "p13",
  "p14",
  "p15",
  "p16",
  "p17",
  "p18",
  "p19",
  "p20",
  "p21",
  "p22",
  "p23",
  "p24",
  "p25",
  "p26",
  "p28",
  "p29",
  "p30",
  "p31",
  "p32",
  "p33",
  "p34",
  "p35",
  "p37",
  "p39",
  "p40",
  "p41",
  "p42",
  "p43",
  "p44",
  "p45",
  "p46",
  "p47",
  "p48",
  "p49",
  "p50",
  "p51",
  "p52",
  "p53",
  "p54",
  "p55",
  "p56",
  "p57",
  "p58",
  "p59",
  "p60",
  "p61",
  "p62",
  "p63",
  "p64",
  "p65",
  "p66",
  "p67",
  "p68",
  "p69",
  "p70",
  "p71",
  "p72",
  "p73",
  "p74",
  "p75",
  "p76",
  "p77",
  "p78",
  "p79",
  "p80",
  "p81",
  "p82",
  "p83",
  "p84",
  "p85",
  "p86",
  "p87",
  "p88",
  "p89",
  "p90",
  "p91",
  "p92",
  "p93",
  "p94",
  "p95",
  "p96",
  "p97",
  "p110",
  "p111",
  "p98",
  "p99",
  "p100",
  "p101",
  "p102",
  "p103",
  "p104",
  "p105",
  "p106",
  "p107",
  "p108",
  "p109"
];
const REMOVED_PASSIVE_IDS = new Set([
  "p3",
  "p4",
  "p5",
  "p8",
  "p18",
  "p21",
  "p22",
  "p24",
  "p27",
  "p28",
  "p29",
  "p36",
  "p37",
  "p38",
  "p39",
  "p41",
  "p43",
  "p51",
  "p56",
  "p66",
  "p81",
  "p82",
  "p83"
]);
const DEV_SEAL_IDS = new Set(["p92", "p93", "p94", "p95", "p96", "p97", "p110"]);
const SATAN_SEAL_IDS = new Set(["p111"]);
const SELF_STACKING_SEAL_IDS = new Set(["p98", "p99", "p100", "p101", "p102", "p103", "p109"]);
const SELF_STACKING_SEAL_SPECS = {
  p98: { key: "critical", label: "Player CRITICAL", increment: 3 },
  p99: { key: "memoryOverTen", label: "Non-boss MEMORY over 10", increment: 2 },
  p100: { key: "bountySum", label: "BOUNTY sum over 40", increment: 1 },
  p101: { key: "pentakill", label: "PENTAKILL", increment: 5 },
  p102: { key: "revealedDeath", label: "Revealed death", increment: 1 },
  p103: { key: "artifactThreshold", label: "20 ARTIFACT uses", increment: 1 },
  p109: { key: "stubbornDeath", label: "STUBBORN death", increment: 1 }
};
const ACTIVE_IDS = [
  "a6",
  "a7",
  "a8",
  "a9",
  "a10",
  "a11",
  "a12",
  "a14",
  "a15",
  "a18",
  "a21",
  "a22",
  "a23",
  "a25",
  "a28"
];
const RESERVED_ARTIFACT_IDS = ["a13", "a16", "a24", "a26", "a27"];
const TARGETED_ARTIFACT_IDS = new Set(["a7", "a8", "a9", "a15", "a25", "a28"]);
const ARTIFACT_ICONS = {
  a6: "occult-items-17/17 CEREMONIAL ALTAR.png",
  a7: "occult-items-17/12 DEMONIC IDOL.png",
  a8: "occult-items-17/04 GOAT HEAD.png",
  a9: "occult-items-17/11 INVERTED CROSS.png",
  a10: "occult-items-17/07 FUNERAL COIN.png",
  a11: "occult-items-17/05 VIAL OF BLOOD.png",
  a12: "occult-items-17/16 DARK TALISMAN.png",
  a13: "a13.png",
  a14: "occult-items-17/02 BLACK CANDLE.png",
  a15: "occult-items-17/01 SACRIFICIAL DAGGER.png",
  a16: "a16.png",
  a18: "occult-items-17/14 CORRUPTED CRYSTAL.png",
  a21: "occult-items-17/08 VOODOO DOLL.png",
  a22: "occult-items-17/06 CURSED CHALICE.png",
  a23: "occult-items-17/09 SATANIC BIBLE.png",
  a24: "a24.png",
  a25: "occult-items-17/15 MUMMIFIED LAMB.png",
  a26: "occult-items-17/13 SPIRIT BOARD.png",
  a27: "occult-new-9/bath-curse-tablets.png",
  a28: "occult-items-17/03 ENGRAVED SKULL.png"
};
const SEAL_SIGILS = {
  p1: "068_Vassago.png",
  p2: "051_Paimon.png",
  p3: "004_Allocer.png",
  p4: "008_Andras.png",
  p5: "040_Haures.png",
  p6: "048_Orias.png",
  p7: "035_Glasya-Labolas.png",
  p8: "022_Buer.png",
  p9: "045_Marbas.png",
  p10: "037_Guison.png",
  p11: "065_Valfor.png",
  p12: "018_Belial.png",
  p13: "023_Bune.png",
  p14: "042_Leraje.png",
  p15: "016_Bathin.png",
  p16: "013_Bael.png",
  p17: "028_Dantalion.png",
  p18: "019_Benith.png",
  p19: "056_Sabnock.png",
  p20: "038_Haagenti.png",
  p21: "060_Shax.png",
  p22: "021_Botis.png",
  p23: "059_Seere.png",
  p24: "049_Orobas.png",
  p25: "070_Volac.png",
  p26: "063_Tap.png",
  p27: "071_Zagan.png",
  p28: "050_Ose.png",
  p29: "034_Furfur.png",
  p30: "009_Andrealphus.png",
  p31: "047_Murmur.png",
  p32: "031_Forcas.png",
  p33: "046_Marchosias.png",
  p34: "036_Gomory.png",
  p35: "032_Forneus.png",
  p36: "011_Asmodeus.png",
  p37: "043_Malphas.png",
  p38: "012_Astaroth.png",
  p39: "053_Purson.png",
  p40: "030_Focalor.png",
  p41: "020_Bifrons.png",
  p42: "061_Stolas.png",
  p43: "054_Raum.png",
  p44: "010_Andromalius.png",
  p45: "027_Crocell.png",
  p46: "015_Barbatos.png",
  p47: "055_Ronwe.png",
  p48: "026_Cimejes.png",
  p49: "052_Phenex.png",
  p50: "002_Agares.png",
  p51: "044_Marax.png",
  p52: "029_Decarabia.png",
  p53: "058_Samigina.png",
  p54: "072_Zepar.png",
  p55: "062_Sytry.png",
  p56: "039_Halphas.png",
  p57: "014_Balan.png",
  p58: "041_Ipes.png",
  p59: "007_Ammon.png",
  p60: "063_Tap.png",
  p61: "066_Vapar.png",
  p62: "017_Beleth.png",
  p63: "064_Uval.png",
  p64: "069_Vine.png",
  p65: "025_Cerbere.png",
  p66: "003_Aim.png",
  p67: "024_Caim.png",
  p68: "067_Vapula.png",
  p69: "001_Abigor.png",
  p70: "006_Amy.png",
  p71: "057_Sallos.png",
  p72: "031_Forcas.png",
  p73: "011_Asmodeus.png",
  p74: "apocalypse/01-four-living-creatures.png",
  p75: "apocalypse/02-enthroned-figure.png",
  p76: "apocalypse/03-radiant-shield.png",
  p77: "apocalypse/04-angel-book-pillars.png",
  p78: "apocalypse/05-seven-trumpets.png",
  p79: "apocalypse/06-holy-city-tablet.png",
  p80: "apocalypse/07-angel-dragon.png",
  p81: "022_Buer.png",
  p82: "071_Zagan.png",
  p83: "049_Orobas.png",
  p84: "012_Astaroth.png",
  p85: "019_Benith.png",
  p86: "040_Haures.png",
  p87: "053_Purson.png",
  p88: "054_Raum.png",
  p89: "044_Marax.png",
  p90: "020_Bifrons.png",
  p91: "003_Aim.png",
  p92: "dev/DantreSeal.png",
  p93: "dev/ZilonSeal.png",
  p94: "dev/SerafeimSeal.png",
  p95: "dev/PyrosSeal.png",
  p96: "dev/PadmaSeal.png",
  p97: "dev/ThreonSeal.png",
  p110: "dev/PetrosPavlosSeal.png",
  p111: "satan/lucifer-wide.png",
  p98: "self-stacking/Samael-Star.png",
  p99: "self-stacking/Cassiel-Sigil.png",
  p100: "self-stacking/Bethor.png",
  p101: "self-stacking/Aggiel-Hexagram.png",
  p102: "self-stacking/Zachriel-Triangle.png",
  p103: "self-stacking/Cassiel-Pentagram.png",
  p104: "004_Allocer.png",
  p105: "008_Andras.png",
  p106: "071_Zagan.png",
  p107: "050_Ose.png",
  p108: "049_Orobas.png",
  p109: "self-stacking/Samael-Triangle.png"
};

const GOETIC_BOSS_IMAGE_ROOT = "assets/bots/goetic-stickmen-72";
const GOETIC_BOSS_IMAGE_BY_PASSIVE_ID = {
  p1: "03-vassago.png",
  p2: "09-paimon.png",
  p3: "52-alloces.png",
  p4: "63-andras.png",
  p6: "59-orias.png",
  p7: "25-glasya-labolas.png",
  p9: "05-marbas.png",
  p10: "11-gusion.png",
  p11: "06-valefor.png",
  p12: "68-belial.png",
  p13: "26-bune-bime.png",
  p14: "14-leraje.png",
  p15: "18-bathin.png",
  p16: "01-bael.png",
  p17: "71-dantalion.png",
  p19: "43-sabnock.png",
  p20: "48-haagenti.png",
  p21: "44-shax.png",
  p22: "17-botis.png",
  p23: "70-seere-seir.png",
  p25: "62-valac-ualac.png",
  p26: "67-amdusias.png",
  p27: "61-zagan.png",
  p28: "57-ose.png",
  p29: "34-furfur.png",
  p30: "65-andrealphus.png",
  p31: "54-murmur.png",
  p32: "31-foras.png",
  p33: "35-marchosias.png",
  p34: "56-gremory-gamori.png",
  p35: "30-forneus.png",
  p37: "39-malphas.png",
  p40: "41-focalor.png",
  p42: "36-stolas.png",
  p44: "72-andromalius.png",
  p45: "49-crocell.png",
  p46: "08-barbatos.png",
  p47: "27-ronove.png",
  p48: "66-cimejes-kimaris.png",
  p49: "37-phenex-phoenix.png",
  p50: "02-agares.png",
  p52: "69-decarabia.png",
  p53: "04-samigina-gamigin.png",
  p54: "16-zepar.png",
  p55: "12-sitri.png",
  p56: "38-halphas.png",
  p57: "51-balam.png",
  p58: "22-ipos.png",
  p59: "07-amon.png",
  p60: "33-gaap.png",
  p61: "42-vepar.png",
  p62: "13-beleth.png",
  p63: "47-vual-uvall.png",
  p64: "45-vine.png",
  p65: "24-naberius.png",
  p67: "53-caim-camio.png",
  p68: "60-vapula-naphula.png",
  p69: "15-eligos.png",
  p70: "58-amy-avnas.png",
  p71: "19-sallos.png",
  p72: "50-furcas.png",
  p73: "32-asmoday.png",
  p81: "10-buer.png",
  p83: "55-orobas.png",
  p84: "29-astaroth.png",
  p85: "28-berith.png",
  p86: "64-haures-flauros.png",
  p87: "20-purson.png",
  p88: "40-raum.png",
  p89: "21-marax-morax.png",
  p90: "46-bifrons.png",
  p91: "23-aim-haborym.png",
  p104: "52-alloces.png",
  p105: "63-andras.png",
  p106: "61-zagan.png",
  p107: "57-ose.png",
  p108: "55-orobas.png"
};
const GOETIC_BOSS_SPECS = [
  { key: "bael", name: "Bael", image: "01-bael.png", passiveId: "p16" },
  { key: "agares", name: "Agares", image: "02-agares.png", passiveId: "p50" },
  { key: "vassago", name: "Vassago", image: "03-vassago.png", passiveId: "p1" },
  { key: "samigina", name: "Samigina", image: "04-samigina-gamigin.png", passiveId: "p53" },
  { key: "marbas", name: "Marbas", image: "05-marbas.png", passiveId: "p9" },
  { key: "valefor", name: "Valefor", image: "06-valefor.png", passiveId: "p11" },
  { key: "amon", name: "Amon", image: "07-amon.png", passiveId: "p59" },
  { key: "barbatos", name: "Barbatos", image: "08-barbatos.png", passiveId: "p46" },
  { key: "paimon", name: "Paimon", image: "09-paimon.png", passiveId: "p2" },
  { key: "buer", name: "Buer", image: "10-buer.png", passiveId: "p81" },
  { key: "gusion", name: "Gusion", image: "11-gusion.png", passiveId: "p10" },
  { key: "sitri", name: "Sitri", image: "12-sitri.png", passiveId: "p55" },
  { key: "beleth", name: "Beleth", image: "13-beleth.png", passiveId: "p62" },
  { key: "leraje", name: "Leraje", image: "14-leraje.png", passiveId: "p14" },
  { key: "eligos", name: "Eligos", image: "15-eligos.png", passiveId: "p69" },
  { key: "zepar", name: "Zepar", image: "16-zepar.png", passiveId: "p54" },
  { key: "botis", name: "Botis", image: "17-botis.png", passiveId: "p22" },
  { key: "bathin", name: "Bathin", image: "18-bathin.png", passiveId: "p15" },
  { key: "sallos", name: "Sallos", image: "19-sallos.png", passiveId: "p71" },
  { key: "purson", name: "Purson", image: "20-purson.png", passiveId: "p87" },
  { key: "marax", name: "Marax", image: "21-marax-morax.png", passiveId: "p89" },
  { key: "ipos", name: "Ipos", image: "22-ipos.png", passiveId: "p58" },
  { key: "aim", name: "Aim", image: "23-aim-haborym.png", passiveId: "p91" },
  { key: "naberius", name: "Naberius", image: "24-naberius.png", passiveId: "p65" },
  { key: "glasya-labolas", name: "Glasya-Labolas", image: "25-glasya-labolas.png", passiveId: "p7" },
  { key: "bune", name: "Bune", image: "26-bune-bime.png", passiveId: "p13" },
  { key: "ronove", name: "Ronove", image: "27-ronove.png", passiveId: "p47" },
  { key: "berith", name: "Berith", image: "28-berith.png", passiveId: "p85" },
  { key: "astaroth", name: "Astaroth", image: "29-astaroth.png", passiveId: "p84" },
  { key: "forneus", name: "Forneus", image: "30-forneus.png", passiveId: "p35" },
  { key: "foras", name: "Foras", image: "31-foras.png", passiveId: "p32" },
  { key: "asmoday", name: "Asmoday", image: "32-asmoday.png", passiveId: "p73" },
  { key: "gaap", name: "Gaap", image: "33-gaap.png", passiveId: "p60" },
  { key: "furfur", name: "Furfur", image: "34-furfur.png", passiveId: "p29" },
  { key: "marchosias", name: "Marchosias", image: "35-marchosias.png", passiveId: "p33" },
  { key: "stolas", name: "Stolas", image: "36-stolas.png", passiveId: "p42" },
  { key: "phenex", name: "Phenex", image: "37-phenex-phoenix.png", passiveId: "p49" },
  { key: "halphas", name: "Halphas", image: "38-halphas.png", passiveId: "p56" },
  { key: "malphas", name: "Malphas", image: "39-malphas.png", passiveId: "p37" },
  { key: "raum", name: "Raum", image: "40-raum.png", passiveId: "p88" },
  { key: "focalor", name: "Focalor", image: "41-focalor.png", passiveId: "p40" },
  { key: "vepar", name: "Vepar", image: "42-vepar.png", passiveId: "p61" },
  { key: "sabnock", name: "Sabnock", image: "43-sabnock.png", passiveId: "p19" },
  { key: "shax", name: "Shax", image: "44-shax.png", passiveId: "p21" },
  { key: "vine", name: "Vine", image: "45-vine.png", passiveId: "p64" },
  { key: "bifrons", name: "Bifrons", image: "46-bifrons.png", passiveId: "p90" },
  { key: "vual", name: "Vual", image: "47-vual-uvall.png", passiveId: "p63" },
  { key: "haagenti", name: "Haagenti", image: "48-haagenti.png", passiveId: "p20" },
  { key: "crocell", name: "Crocell", image: "49-crocell.png", passiveId: "p45" },
  { key: "furcas", name: "Furcas", image: "50-furcas.png", passiveId: "p72" },
  { key: "balam", name: "Balam", image: "51-balam.png", passiveId: "p57" },
  { key: "alloces", name: "Alloces", image: "52-alloces.png", passiveId: "p104" },
  { key: "caim", name: "Caim", image: "53-caim-camio.png", passiveId: "p67" },
  { key: "murmur", name: "Murmur", image: "54-murmur.png", passiveId: "p31" },
  { key: "orobas", name: "Orobas", image: "55-orobas.png", passiveId: "p108" },
  { key: "gremory", name: "Gremory", image: "56-gremory-gamori.png", passiveId: "p34" },
  { key: "ose", name: "Ose", image: "57-ose.png", passiveId: "p107" },
  { key: "amy", name: "Amy", image: "58-amy-avnas.png", passiveId: "p70" },
  { key: "orias", name: "Orias", image: "59-orias.png", passiveId: "p6" },
  { key: "vapula", name: "Vapula", image: "60-vapula-naphula.png", passiveId: "p68" },
  { key: "zagan", name: "Zagan", image: "61-zagan.png", passiveId: "p106" },
  { key: "valac", name: "Valac", image: "62-valac-ualac.png", passiveId: "p25" },
  { key: "andras", name: "Andras", image: "63-andras.png", passiveId: "p105" },
  { key: "haures", name: "Haures", image: "64-haures-flauros.png", passiveId: "p86" },
  { key: "andrealphus", name: "Andrealphus", image: "65-andrealphus.png", passiveId: "p30" },
  { key: "cimejes", name: "Cimejes", image: "66-cimejes-kimaris.png", passiveId: "p48" },
  { key: "amdusias", name: "Amdusias", image: "67-amdusias.png", passiveId: "p26" },
  { key: "belial", name: "Belial", image: "68-belial.png", passiveId: "p12" },
  { key: "decarabia", name: "Decarabia", image: "69-decarabia.png", passiveId: "p52" },
  { key: "seere", name: "Seere", image: "70-seere-seir.png", passiveId: "p23" },
  { key: "dantalion", name: "Dantalion", image: "71-dantalion.png", passiveId: "p17" },
  { key: "andromalius", name: "Andromalius", image: "72-andromalius.png", passiveId: "p44" }
];
const GOETIC_BOSS_BY_KEY = Object.fromEntries(GOETIC_BOSS_SPECS.map((spec) => [spec.key, spec]));
const GOETIC_BOSS_KEYS = GOETIC_BOSS_SPECS.map((spec) => spec.key);
const GOETIC_BOSS_TOTAL = GOETIC_BOSS_KEYS.length;
const GOETIC_BOSS_PASSIVE_IDS = PASSIVE_IDS.filter((id) => GOETIC_BOSS_IMAGE_BY_PASSIVE_ID[id] && !REMOVED_PASSIVE_IDS.has(id));
const BOSS_PASSIVES = {
  sinStealing: {
    name: "Sin-Stealing"
  },
  soullessness: {
    name: "Soulessness",
    baseDamage: 5
  },
  soulStealing: {
    name: "Soul-stealing"
  },
  deathRoll: {
    name: "Death Roll"
  },
  rerollToll: {
    name: "Reroll Toll",
    baseDamage: 5
  },
  offeringToll: {
    name: "Offering Toll",
    baseDamage: 2
  },
  avenging: {
    name: "Avenging",
    baseDamage: 4
  },
  corruption: {
    name: "Corruption"
  },
  punishment: {
    name: "Punishment",
    baseDamage: 5
  },
  lifeSteal: {
    name: "Life-Steal"
  }
};
const BOSS_PASSIVE_KEYS = Object.keys(BOSS_PASSIVES);
const PYROS_GIFT_PASSIVES = {
  metabolism: {
    name: "Seal of Bathin",
    description: "This Pyros Gift heals 5 HEALTH at the end of every round."
  },
  fumes: {
    name: "Seal of Amon",
    description: "While this Pyros Gift is alive, you take 1 damage at the end of every round."
  },
  thief: {
    name: "Seal of Raum",
    description: "While this Pyros Gift is alive, you lose 1 SIN at the end of every round."
  },
  spite: {
    name: "Seal of Botis",
    description: "While this Pyros Gift is alive, every time you use an ARTIFACT, you take 3 damage."
  },
  wideCrit: {
    name: "Seal of Ipos",
    description: "This Pyros Gift hits CRITICAL within 2 of the right integer and deals damage only to you."
  },
  shield: {
    name: "Seal of Halphas",
    description: "This Pyros Gift cannot be picked or targeted by ARTIFACTS, and its guess cannot be revealed."
  },
  lamb: {
    name: "Seal of Sallos",
    description: "When this Pyros Gift dies, all other DAMNED gain 10 HEALTH."
  }
};
const PYROS_GIFT_KEYS = Object.keys(PYROS_GIFT_PASSIVES);

const BOT_ARCHETYPES = [
  { type: "Anchor", anchor: 56, noise: 7, color: "#75c9c1", aggression: 0.34 },
  { type: "Analyst", anchor: 40, noise: 5, color: "#e1b84c", aggression: 0.22 },
  { type: "Follower", anchor: 51, noise: 6, color: "#7fc47b", aggression: 0.3 },
  { type: "Stubborn", anchor: 66, noise: 5, color: "#ef6f61", aggression: 0.44 },
  { type: "Drifter", anchor: 33, noise: 10, color: "#b68de6", aggression: 0.48 },
  { type: "Caller", anchor: 46, noise: 8, color: "#d58a4f", aggression: 0.38 }
];

const BOT_PROFILES = [
  { flag: "🇬🇷", country: "Greece", names: ["Nikos", "Eleni", "Yannis", "Sofia"] },
  { flag: "🇯🇵", country: "Japan", names: ["Haruto", "Yuki", "Aiko", "Ren"] },
  { flag: "🇧🇷", country: "Brazil", names: ["Joao", "Ana", "Luiza", "Mateus"] },
  { flag: "🇪🇬", country: "Egypt", names: ["Omar", "Layla", "Youssef", "Nour"] },
  { flag: "🇮🇳", country: "India", names: ["Arjun", "Priya", "Anaya", "Ravi"] },
  { flag: "🇳🇬", country: "Nigeria", names: ["Chidi", "Ada", "Kemi", "Tunde"] },
  { flag: "🇫🇷", country: "France", names: ["Luc", "Camille", "Julien", "Amelie"] },
  { flag: "🇩🇪", country: "Germany", names: ["Lukas", "Greta", "Anja", "Felix"] },
  { flag: "🇲🇽", country: "Mexico", names: ["Diego", "Valeria", "Sofia", "Mateo"] },
  { flag: "🇮🇹", country: "Italy", names: ["Marco", "Giulia", "Luca", "Chiara"] },
  { flag: "🇰🇷", country: "South Korea", names: ["Minjun", "Jiwoo", "Hana", "Seo"] },
  { flag: "🇨🇳", country: "China", names: ["Wei", "Lin", "Mei", "Jun"] },
  { flag: "🇹🇷", country: "Turkey", names: ["Deniz", "Emre", "Ayla", "Selin"] },
  { flag: "🇪🇸", country: "Spain", names: ["Pablo", "Lucia", "Ines", "Javier"] },
  { flag: "🇪🇹", country: "Ethiopia", names: ["Dawit", "Hana", "Selam", "Amanuel"] },
  { flag: "🇺🇦", country: "Ukraine", names: ["Olena", "Maksym", "Kateryna", "Andriy"] },
  { flag: "🇵🇱", country: "Poland", names: ["Marek", "Zofia", "Antek", "Ewa"] },
  { flag: "🇿🇦", country: "South Africa", names: ["Thabo", "Lindiwe", "Sipho", "Naledi"] },
  { flag: "🇦🇷", country: "Argentina", names: ["Tomas", "Martina", "Javier", "Lucia"] },
  { flag: "🇮🇩", country: "Indonesia", names: ["Budi", "Sari", "Dewi", "Agus"] },
  { flag: "🇸🇪", country: "Sweden", names: ["Erik", "Freja", "Linnea", "Astrid"] },
  { flag: "🇵🇹", country: "Portugal", names: ["Tiago", "Ines", "Beatriz", "Rafael"] }
];
const BOT_IMAGE_FILES = [
  "01-original-standing.png",
  "02-predatory-crouch.png",
  "03-raised-invocation.png",
  "04-insect-crawl.png",
  "05-kneeling-anguish.png",
  "06-ritual-levitation.png",
  "07-stalking-stride.png",
  "08-broken-cruciform.png",
  "09-seated-ritual.png",
  "10-inverted-backbend.png",
  "11-contorted-balance.png",
  "extra-20/01-crossed-arms.png",
  "extra-20/02-hands-behind-back.png",
  "extra-20/03-tiptoe-stalk.png",
  "extra-20/04-panicked-sprint.png",
  "extra-20/05-silent-shush.png",
  "extra-20/06-listening-ear.png",
  "extra-20/07-hands-up-surrender.png",
  "extra-20/08-looming-hands-on-knees.png",
  "extra-20/09-cross-legged-stillness.png",
  "extra-20/10-side-recline.png",
  "extra-20/11-one-knee-reach.png",
  "extra-20/12-kneeling-hands-behind.png",
  "extra-20/13-retreating-palms-out.png",
  "extra-20/14-standing-self-embrace.png",
  "extra-20/15-shielding-upward-gaze.png",
  "extra-20/16-peering-between-legs.png",
  "extra-20/17-drunken-windmill.png",
  "extra-20/18-invisible-pull.png",
  "extra-20/19-sleepwalking-drag.png",
  "extra-20/20-hands-frame-head.png"
];

const UNIQUE_BOSS_SPECS = {
  zilon: {
    key: "zilon",
    name: "Zilon",
    image: "assets/bots/occult-stickmen-pack/boss-zilon.png",
    modifierOverride: 1.5,
    descriptions: [
      "Devil's Offerings prices cost +3 SIN for ARTIFACTS and +6 SIN for SEALS while Zilon is alive.",
      "The TARGET modifier becomes 1.5 while Zilon is alive."
    ]
  },
  dantre: {
    key: "dantre",
    name: "Dantre",
    image: "assets/bots/occult-stickmen-pack/boss-dantre.png",
    modifierOverride: 0.5,
    eliminationDamage: 2,
    descriptions: [
      "Every elimination deals 2 damage to you while Dantre is alive.",
      "The TARGET modifier becomes 0.5 while Dantre is alive."
    ]
  },
  pyros: {
    key: "pyros",
    name: "Pyros",
    image: "assets/bots/occult-stickmen-pack/boss-pyros.png",
    modifierOverride: 1,
    grantsBuffs: true,
    descriptions: [
      "At the start of every round, one DAMNED receives a random Pyros Gift from Pyros's own gift pool.",
      "The TARGET modifier becomes 1.0 while Pyros is alive."
    ]
  },
  threon: {
    key: "threon",
    name: "Threon",
    image: "assets/bots/occult-stickmen-pack/boss-threon.png",
    descriptions: [
      "Each round, Threon applies a hidden mystery TARGET modifier from 0.7 to 1.3.",
      "Every ARTIFACT you use has a 50% chance to malfunction, do nothing, and deal 3 damage to you."
    ]
  },
  kalha: {
    key: "kalha",
    name: "Kalha",
    image: "assets/bots/new-red-bosses-5/Kalha-vibrant.png",
    modifierOverride: 1.2,
    descriptions: [
      "Each round, half your equipped SEALS rounded down are deactivated until the round ends.",
      "The TARGET modifier becomes 1.2 while Kalha is alive."
    ]
  },
  serafim: {
    key: "serafim",
    name: "Serafim",
    image: "assets/bots/new-red-bosses-5/Serafeim-vibrant-v2.png",
    modifierOverride: 0.7,
    descriptions: [
      "When Serafim enters play, you lose half your SIN; Serafim adds the stolen SIN to his BOSS bounty and gains twice that amount as HEALTH.",
      "Each round, you lose up to 2 SIN and Serafim adds the stolen SIN to his BOSS bounty.",
      "The TARGET modifier becomes 0.7 while Serafim is alive."
    ]
  },
  padma: {
    key: "padma",
    name: "Padma",
    image: "assets/bots/new-red-bosses-5/Padma-vibrant.png",
    modifierOverride: 0.6,
    descriptions: [
      "While Padma is alive, non-boss healing cannot restore your HEALTH.",
      "At the start of every round, Padma heals non-boss DAMNED for 10% max HEALTH and herself for 5% max HEALTH.",
      "The TARGET modifier becomes 0.6 while Padma is alive."
    ]
  },
  petros: {
    key: "petros",
    name: "Petros",
    image: "assets/bots/new-red-bosses-5/Petros-vibrant.png",
    statFactor: 0.5,
    bossBountyFactor: 0.5,
    descriptions: [
      "Petros enters with Pavlos. Each twin has half BOSS HEALTH and half BOSS SIN.",
      "Each twin borrows one other special BOSS ability.",
      "While either twin is alive, the TARGET modifier alternates each round between 0.9 and 1.1, starting at 0.9.",
      "If both twins would take lethal damage in the same round, Pavlos takes no damage for the rest of that round."
    ]
  },
  pavlos: {
    key: "pavlos",
    name: "Pavlos",
    image: "assets/bots/new-red-bosses-5/Pavlos-vibrant.png",
    statFactor: 0.5,
    bossBountyFactor: 0.5,
    countsAsBossProgress: false,
    countsAsBossSpawn: false,
    descriptions: [
      "Pavlos enters with Petros. Each twin has half BOSS HEALTH and half BOSS SIN.",
      "Each twin borrows one other special BOSS ability.",
      "While either twin is alive, the TARGET modifier alternates each round between 0.9 and 1.1, starting at 0.9.",
      "If both twins would take lethal damage in the same round, Pavlos takes no damage for the rest of that round."
    ]
  }
};
const UNIQUE_BOSS_KEYS = ["zilon", "dantre", "pyros", "threon", "kalha", "serafim", "padma", "petros"];
const PETROS_PAVLOS_POWER_KEYS = UNIQUE_BOSS_KEYS.filter((key) => key !== "petros");
const PETROS_PAVLOS_MODIFIERS = [0.9, 1.1];

const FINAL_BOSS_SPECS = {
  jesus: {
    key: "jesus",
    name: "Jesus",
    image: FINAL_BOSS_JESUS_SRC,
    color: "#d64f45",
    descriptions: [
      "Jesus has infinite HEALTH. Damage dealt to him is counted without reducing HP.",
      "Jesus's guess counts three times when calculating the TARGET average."
    ]
  },
  satan: {
    key: "satan",
    name: "Satan",
    image: FINAL_BOSS_SATAN_SRC,
    color: "#d64f45",
    descriptions: [
      "Satan has infinite HEALTH. Damage dealt to him is counted without reducing HP.",
      "The Devil disables Devil's Offerings while Satan is alive."
    ]
  }
};

const state = {
  mode: "menu",
  menuScreen: "main",
  pendingRunDeleteSlotId: null,
  sound: {
    musicVolume: SOUNDTRACK_VOLUME,
    sfxVolume: 1,
    muted: false
  },
  display: {
    outlineBoil: 2
  },
  pauseOpen: false,
  pauseDevOpen: false,
  round: 1,
  stage: "guess",
  player: {
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    credits: STARTING_CREDITS,
    passives: [],
    actives: []
  },
  bots: [],
  shop: [],
  log: [],
  roundState: null,
  roundRevealAnimation: null,
  previousTarget: null,
  playerLastDamage: 0,
  playerLastHeal: 0,
  playerLastCredits: 0,
  playerDamageSources: [],
  playerHealSources: [],
  playerCreditSources: [],
  sealStats: {},
  runStats: null,
  currentRunSlotId: null,
  runStartedAt: null,
  pendingNextRoundMarbasBonuses: [],
  pendingNextRoundLambReveals: [],
  pendingSelfStackingPentakillDamage: 0,
  gameMemory: [],
  nextBotId: 1,
  nextItemUid: 1,
  eliminations: 0,
  bossKills: 0,
  itemsBought: 0,
  totalArtifactsUsed: 0,
  selfStackingGameConditionCounts: {},
  rerollBaseCost: 1,
  activeCarouselIndex: 0,
  mobileOfferingsOpen: false,
  bossSpawnCount: 0,
  uniqueBossQueue: [],
  goeticBossQueue: [],
  goeticBossKills: 0,
  killsSinceBossSpawn: 0,
  nextBossPairId: 1,
  finalBossPhase: false,
  finalBossQueued: false,
  bossQueued: false,
  eliteBoostedNextReroll: 0,
  paleHorseBoostArmed: false,
  critMomentumBonus: 0,
  previousRoundEliminationsForMartyrs: 0,
  shouldFocusGuessInput: false,
  pendingActive: null,
  lastUsedArtifact: null,
  playtestInfiniteMoney: false,
  gameOver: false,
  inspectingGameOver: false,
  pvp: null
};

let pvpPollTimer = null;
let pvpAutoTimer = null;
let soundtrackAudio = null;
let sealPurchaseSfx = null;
let guessSfx = null;
let readySfx = null;
let nextRoundSfx = null;
let clockTickSfx = [];
let artifactSfx = {};
let pentakillSfx = null;
let nextClockTickIndex = 0;
const activeOneShotSfxInstances = new Set();
let roundRevealTimer = null;
let sfxPrimed = false;
let gameButtonTickInstalled = false;
let soundtrackPausedByAppBackground = false;

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
    if (config.pitch) {
      instance.preservesPitch = false;
      instance.playbackRate = 1 + (Math.random() * 2 - 1) * config.pitch;
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

"use strict";

function emptyRecord(extra = {}) {
  return { value: 0, ...extra };
}

function defaultRunStats() {
  return {
    overallDamage: 0,
    currentRoundDamage: 0,
    singleRoundDamage: 0,
    pentakills: 0,
    currentRoundSealDamage: {},
    maxSealRoundDamage: emptyRecord({ id: "", name: "" }),
    highestEliteLevel: emptyRecord({ id: "", name: "" }),
    sealPlays: {},
    artifactPlays: {}
  };
}

function normalizeRunStats(stats) {
  const base = defaultRunStats();
  const source = stats && typeof stats === "object" ? stats : {};
  return {
    ...base,
    ...source,
    overallDamage: Math.max(0, Math.ceil(Number(source.overallDamage) || 0)),
    currentRoundDamage: Math.max(0, Math.ceil(Number(source.currentRoundDamage) || 0)),
    singleRoundDamage: Math.max(0, Math.ceil(Number(source.singleRoundDamage) || 0)),
    pentakills: Math.max(0, Math.floor(Number(source.pentakills) || 0)),
    currentRoundSealDamage: source.currentRoundSealDamage && typeof source.currentRoundSealDamage === "object" ? source.currentRoundSealDamage : {},
    maxSealRoundDamage:
      source.maxSealRoundDamage && typeof source.maxSealRoundDamage === "object"
        ? { ...emptyRecord({ id: "", name: "" }), ...source.maxSealRoundDamage }
        : base.maxSealRoundDamage,
    highestEliteLevel:
      source.highestEliteLevel && typeof source.highestEliteLevel === "object"
        ? { ...emptyRecord({ id: "", name: "" }), ...source.highestEliteLevel }
        : base.highestEliteLevel,
    sealPlays: source.sealPlays && typeof source.sealPlays === "object" ? source.sealPlays : {},
    artifactPlays: source.artifactPlays && typeof source.artifactPlays === "object" ? source.artifactPlays : {}
  };
}

function ensureRunStats() {
  state.runStats = normalizeRunStats(state.runStats);
  return state.runStats;
}

function defaultArcadeRecords() {
  return {
    mostEliminations: emptyRecord(),
    mostBossEliminations: emptyRecord(),
    mostOverallDamage: emptyRecord(),
    mostSingleRoundDamage: emptyRecord(),
    highestRoundReached: emptyRecord(),
    mostPentakills: emptyRecord(),
    mostOverallSealDamage: emptyRecord({ id: "", name: "" }),
    mostRoundSealDamage: emptyRecord({ id: "", name: "" }),
    highestEliteLevel: emptyRecord({ id: "", name: "" }),
    mostPlayedSeal: emptyRecord({ id: "", name: "" }),
    mostPlayedArtifact: emptyRecord({ id: "", name: "" })
  };
}

function normalizeRecord(record, fallback) {
  const source = record && typeof record === "object" ? record : {};
  return { ...fallback, ...source, value: Math.max(0, Math.ceil(Number(source.value) || 0)) };
}

function normalizeArcadeRecords(records) {
  const defaults = defaultArcadeRecords();
  const source = records && typeof records === "object" ? records : {};
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, normalizeRecord(source[key], fallback)]));
}

function loadArcadeRecords() {
  try {
    const raw = window.localStorage?.getItem(ARCADE_RECORDS_STORAGE_KEY);
    return normalizeArcadeRecords(raw ? JSON.parse(raw) : null);
  } catch (error) {
    return defaultArcadeRecords();
  }
}

function saveArcadeRecords(records) {
  try {
    window.localStorage?.setItem(ARCADE_RECORDS_STORAGE_KEY, JSON.stringify(normalizeArcadeRecords(records)));
  } catch (error) {}
}

function bestCountEntry(counts, type) {
  if (!counts || typeof counts !== "object") return emptyRecord({ id: "", name: "" });
  return Object.entries(counts).reduce(
    (best, [id, raw]) => {
      const value = Math.max(0, Math.floor(Number(raw) || 0));
      if (value <= best.value) return best;
      return { value, id, name: ITEMS[id]?.name || id || type };
    },
    emptyRecord({ id: "", name: "" })
  );
}

function bestOverallSealDamageEntry() {
  const stats = state.sealStats && typeof state.sealStats === "object" ? state.sealStats : {};
  return Object.entries(stats).reduce(
    (best, [id, sealStats]) => {
      const value = Math.max(0, Math.ceil(Number(sealStats?.damage) || 0));
      if (value <= best.value) return best;
      return { value, id, name: ITEMS[id]?.name || id || "SEAL" };
    },
    emptyRecord({ id: "", name: "" })
  );
}

function updateRecordIfHigher(records, key, candidate) {
  const current = records[key] || emptyRecord();
  const value = Math.max(0, Math.ceil(Number(candidate?.value) || 0));
  if (value <= Math.max(0, Math.ceil(Number(current.value) || 0))) return;
  records[key] = { ...current, ...candidate, value };
}

function updateArcadeRecordsFromCurrentRun() {
  if (state.mode !== "arcade") return;
  const stats = ensureRunStats();
  const records = loadArcadeRecords();
  updateRecordIfHigher(records, "mostEliminations", { value: state.eliminations || 0 });
  updateRecordIfHigher(records, "mostBossEliminations", { value: state.bossKills || 0 });
  updateRecordIfHigher(records, "mostOverallDamage", { value: stats.overallDamage || 0 });
  updateRecordIfHigher(records, "mostSingleRoundDamage", { value: stats.singleRoundDamage || 0 });
  updateRecordIfHigher(records, "highestRoundReached", { value: state.round || 0 });
  updateRecordIfHigher(records, "mostPentakills", { value: stats.pentakills || 0 });
  updateRecordIfHigher(records, "mostOverallSealDamage", bestOverallSealDamageEntry());
  updateRecordIfHigher(records, "mostRoundSealDamage", stats.maxSealRoundDamage || emptyRecord({ id: "", name: "" }));
  updateRecordIfHigher(records, "highestEliteLevel", stats.highestEliteLevel || emptyRecord({ id: "", name: "" }));
  updateRecordIfHigher(records, "mostPlayedSeal", bestCountEntry(stats.sealPlays, "SEAL"));
  updateRecordIfHigher(records, "mostPlayedArtifact", bestCountEntry(stats.artifactPlays, "ARTIFACT"));
  saveArcadeRecords(records);
}

function beginRunRoundStats() {
  const stats = ensureRunStats();
  stats.currentRoundDamage = 0;
  stats.currentRoundSealDamage = {};
}

function recordRunDamage(amount) {
  const damage = Math.max(0, Math.ceil(Number(amount) || 0));
  if (damage <= 0 || state.mode !== "arcade") return;
  const stats = ensureRunStats();
  stats.overallDamage += damage;
  stats.currentRoundDamage += damage;
  if (stats.currentRoundDamage > stats.singleRoundDamage) stats.singleRoundDamage = stats.currentRoundDamage;
}

function recordRunSealDamage(id, amount) {
  const damage = Math.max(0, Math.ceil(Number(amount) || 0));
  if (!id || damage <= 0 || state.mode !== "arcade") return;
  const stats = ensureRunStats();
  const next = (Number(stats.currentRoundSealDamage[id]) || 0) + damage;
  stats.currentRoundSealDamage[id] = next;
  if (next > (stats.maxSealRoundDamage?.value || 0)) {
    stats.maxSealRoundDamage = { value: next, id, name: ITEMS[id]?.name || id };
  }
}

function recordRunPentakill() {
  if (state.mode !== "arcade") return;
  ensureRunStats().pentakills += 1;
}

function recordPlayedSeal(id) {
  if (!id || state.mode !== "arcade") return;
  const stats = ensureRunStats();
  stats.sealPlays[id] = (Number(stats.sealPlays[id]) || 0) + 1;
}

function recordPlayedArtifact(id) {
  if (!id || state.mode !== "arcade") return;
  const stats = ensureRunStats();
  stats.artifactPlays[id] = (Number(stats.artifactPlays[id]) || 0) + 1;
}

function recordEliteLevelBought(id, stack) {
  if (!id || state.mode !== "arcade") return;
  const eliteLevel = Math.max(0, Math.floor(Number(stack) || 1) - 1);
  const stats = ensureRunStats();
  if (eliteLevel > (stats.highestEliteLevel?.value || 0)) {
    stats.highestEliteLevel = { value: eliteLevel, id, name: ITEMS[id]?.name || id };
  }
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(values) {
  return values[randomInt(0, values.length - 1)];
}

function pvpRollModifier(currentModifier = null) {
  let choices = PVP_MODIFIERS.slice();
  if (Number.isFinite(currentModifier)) {
    choices =
      currentModifier >= 1
        ? choices.filter((modifier) => modifier < 1)
        : choices.filter((modifier) => modifier > currentModifier);
  }
  if (!choices.length) choices = PVP_MODIFIERS.slice();
  return randomFrom(choices);
}

function shuffled(values) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function nearestMultiple(value, divisor) {
  const number = Number(value);
  const step = Math.max(1, Math.ceil(divisor));
  if (!Number.isFinite(number)) return 0;
  return Math.ceil(Math.round(number / step) * step);
}

function nearestMultipleFromDivisors(value, divisors) {
  const number = Number(value);
  if (!Number.isFinite(number)) return { value: 0, divisor: 1 };
  const forceDifferent = divisors.some((divisor) => {
    const step = Math.max(1, Math.ceil(divisor));
    return number % step === 0;
  });
  return divisors
    .flatMap((divisor) => {
      const step = Math.max(1, Math.ceil(divisor));
      const lower = Math.floor(number / step) * step;
      const upper = Math.ceil(number / step) * step;
      const values = new Set([lower, upper]);
      if (forceDifferent && values.has(number)) {
        values.delete(number);
        values.add(lower - step);
        values.add(upper + step);
      }
      return [...values].map((snapped) => ({ divisor, value: Math.ceil(snapped), distance: Math.abs(snapped - number) }));
    })
    .sort((left, right) => left.distance - right.distance || left.value - right.value || left.divisor - right.divisor)[0];
}

function hasPassive(id) {
  return passiveStack(id) > 0;
}

function passiveEntry(id) {
  return state.player.passives.find((item) => item.id === id) || null;
}

function directPassiveStack(id) {
  return passiveEntry(id)?.stack || 0;
}

function sealSlotCost(idOrItem) {
  const id = typeof idOrItem === "string" ? idOrItem : idOrItem?.id;
  return SATAN_SEAL_IDS.has(id) ? 2 : 1;
}

function ownedSealSlotCount() {
  return state.player.passives
    .filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id))
    .reduce((sum, item) => sum + sealSlotCost(item), 0);
}

function hasSealSlotRoomFor(item) {
  return ownedSealSlotCount() + sealSlotCost(item) <= passiveLimit();
}

function pruneRemovedPassives() {
  const before = state.player.passives.length;
  state.player.passives = state.player.passives.filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id));
  if (state.player.passives.length !== before) refreshMimicTarget();
}

function suppressingBossForSeal(id) {
  if (!id || !state.bots?.length) return null;
  const sealName = ITEMS[id]?.name || "";
  return (
    state.bots.find(
      (bot) =>
        bot.isBoss &&
        bot.hp > 0 &&
        !bot.eliminated &&
        (bot.goeticPassiveId === id || (sealName && bot.goeticSealName === sealName))
    ) || null
  );
}

function kalhaSuppressionForSeal(id) {
  const round = state.roundState;
  if (!id || !round || !round.kalhaSuppressedPassiveIds?.has(id)) return null;
  return state.bots.find((bot) => bot.id === round.kalhaSuppressedById && bot.hp > 0 && !bot.eliminated) || {
    name: "Kalha"
  };
}

function isSealSuppressed(id) {
  return Boolean(suppressingBossForSeal(id) || kalhaSuppressionForSeal(id));
}

function sealSuppressionNotice(id) {
  const goeticBoss = suppressingBossForSeal(id);
  if (goeticBoss) return `Disabled while ${goeticBoss.name} is alive.\n`;
  const kalhaBoss = kalhaSuppressionForSeal(id);
  if (kalhaBoss) return `Disabled by ${kalhaBoss.name} this round.\n`;
  return "";
}

function mimicEntry() {
  return passiveEntry("p28");
}

function availableMimicTargets() {
  return state.player.passives.filter(
    (item) => item && item.id !== "p28" && !REMOVED_PASSIVE_IDS.has(item.id) && !isSelfStackingSeal(item.id)
  );
}

function chooseMimicTarget(mimic = mimicEntry()) {
  if (!mimic) return null;
  const choices = availableMimicTargets();
  if (!choices.length) {
    delete mimic.copiedPassiveId;
    return null;
  }
  const target = randomFrom(choices);
  mimic.copiedPassiveId = target.id;
  return target;
}

function mimicTargetEntry() {
  const mimic = mimicEntry();
  if (!mimic) return null;
  const target = mimic.copiedPassiveId
    ? state.player.passives.find(
        (item) =>
          item &&
          item.id === mimic.copiedPassiveId &&
          item.id !== "p28" &&
          !REMOVED_PASSIVE_IDS.has(item.id) &&
          !isSelfStackingSeal(item.id)
      )
    : null;
  return target || chooseMimicTarget(mimic);
}

function refreshMimicTarget() {
  const mimic = mimicEntry();
  if (!mimic) return null;
  return mimicTargetEntry();
}

function mimicContributionFor(id) {
  if (id === "p28") return 0;
  if (isSealSuppressed("p28") || isSealSuppressed(id)) return 0;
  const mimic = mimicEntry();
  const target = mimicTargetEntry();
  return target?.id === id ? mimic?.stack || 0 : 0;
}

function passiveStack(id) {
  if (REMOVED_PASSIVE_IDS.has(id)) return 0;
  if (isSealSuppressed(id)) return 0;
  return directPassiveStack(id) + mimicContributionFor(id);
}

function eliteLevels(idOrItem) {
  const stack = typeof idOrItem === "string" ? passiveStack(idOrItem) : idOrItem?.stack || 0;
  return Math.max(0, stack - 1);
}

function passivePower(idOrItem, eliteStep = 0.2) {
  const stack = typeof idOrItem === "string" ? passiveStack(idOrItem) : idOrItem?.stack || 0;
  if (!stack) return 0;
  return 1 + eliteLevels(idOrItem) * eliteStep;
}

function scaledPassiveValue(id, baseValue, eliteStep = 0.2) {
  const power = passivePower(id, eliteStep);
  return power ? Math.ceil(baseValue * power) : 0;
}

function scaledPassiveValueForItem(item, baseValue, eliteStep = 0.2) {
  const power = passivePower(item, eliteStep);
  return power ? Math.ceil(baseValue * power) : 0;
}

function flatDamagePower(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? Math.pow(1.5, Math.max(0, stack - 1)) : 0;
}

function flatDamageValue(idOrItem, baseValue) {
  const stack = simpleStackCount(idOrItem);
  if (!stack) return 0;
  let value = Math.max(0, Math.ceil(baseValue || 0));
  for (let level = 1; level < stack; level += 1) {
    value = Math.ceil(value * 1.5);
  }
  return value;
}

function passiveEntryFlatDamage(entry, baseValue) {
  return flatDamageValue(entry, baseValue);
}

function passiveEntryEliteLevels(entry) {
  return Math.max(0, (entry?.stack || 1) - 1);
}

function doubledStackPower(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? Math.pow(2, Math.max(0, stack - 1)) : 0;
}

function doubledStackValue(idOrItem, baseValue) {
  const power = doubledStackPower(idOrItem);
  return power ? Math.ceil((baseValue || 0) * power) : 0;
}

function rollScaledPassiveCount(id, baseCount = 1) {
  const power = passivePower(id);
  if (!power) return 0;
  const raw = baseCount * power;
  const guaranteed = Math.floor(raw);
  const chance = raw - guaranteed;
  return guaranteed + (Math.random() < chance ? 1 : 0);
}

function botSin(bot) {
  if (bot?.finalKey === "satan") return Number.POSITIVE_INFINITY;
  if (bot?.finalKey === "jesus") return Number.NEGATIVE_INFINITY;
  return Math.max(0, Math.ceil(bot?.reward || 0));
}

function scalingBonus(progress, earlyStep, lateStep, endlessStep = lateStep) {
  const count = Math.max(0, Math.ceil(progress || 0));
  const early = Math.min(count, SCALING_BREAKPOINT_BOSSES);
  const mid = Math.min(
    Math.max(0, count - SCALING_BREAKPOINT_BOSSES),
    ENDLESS_SCALING_BREAKPOINT_BOSSES - SCALING_BREAKPOINT_BOSSES
  );
  const endless = Math.max(0, count - ENDLESS_SCALING_BREAKPOINT_BOSSES);
  return early * earlyStep + mid * lateStep + endless * endlessStep;
}

function artifactScaleFactor() {
  return 1;
}

function artifactValue(baseValue) {
  const sign = Math.sign(baseValue || 0);
  const scaled = Math.floor(Math.abs(baseValue || 0) * artifactScaleFactor());
  return sign * scaled;
}

function artifactPercentValue(basePercent) {
  return clamp(artifactValue(basePercent), 0, 100);
}

function artifactPercent(basePercent) {
  return artifactPercentValue(basePercent) / 100;
}

function artifactCount(baseValue) {
  return Math.max(1, artifactValue(baseValue));
}

function artifactMultiplier(baseValue) {
  return Math.max(0, Math.floor((baseValue || 0) * artifactScaleFactor() * 10) / 10);
}

function formatArtifactMultiplier(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

function botBossBounty(bot) {
  if (!bot?.isBoss || bot?.immortal) return 0;
  const factor = Number.isFinite(bot.bossBountyFactor) ? bot.bossBountyFactor : 1;
  const bonus = Math.max(0, Math.ceil(bot.bossBountyBonus || 0));
  return Math.max(0, Math.ceil((20 + state.bossKills) * factor) + bonus);
}

function botRegularBounty(bot) {
  if (bot?.immortal) return 0;
  return Math.max(0, Math.ceil(bot?.reward || 0));
}

function botRegularBountyPayout(bot, markTriggers = false) {
  return botRegularBountyPayoutDetails(bot, markTriggers).payout;
}

function botRegularBountyPayoutDetails(bot, markTriggers = false) {
  if (!bot || bot.immortal) return { payout: 0, baseReward: 0, modifierEntries: [] };
  const baseReward = botRegularBounty(bot);
  let exactReward = baseReward;
  let roundedReward = baseReward;
  const modifierEntries = [];
  const applyMultiplier = (multiplier, source, triggerId) => {
    if (!Number.isFinite(multiplier) || multiplier <= 1 || roundedReward <= 0) return;
    const before = roundedReward;
    exactReward *= multiplier;
    roundedReward = Math.ceil(exactReward);
    const extra = Math.max(0, roundedReward - before);
    if (extra <= 0) return;
    modifierEntries.push({ amount: extra, source });
    if (triggerId && markTriggers) markPassiveTriggered(triggerId);
  };

  if (hasPassive("p36")) {
    applyMultiplier(1.5 * passivePower("p36"), ITEMS.p36?.name || "Seal of Asmoday", "p36");
  }
  applyMultiplier(bountyOathMultiplier(), ITEMS.p24?.name || "Seal of Orobas", passiveStack("p24") ? "p24" : "");
  if (botHasLowSin(bot, 3) && passiveStack("p45")) {
    applyMultiplier(2 * passivePower("p45"), ITEMS.p45?.name || "Seal of Crocell", "p45");
  }
  if (bot.revealedByPassive && passiveStack("p64")) {
    applyMultiplier(revealedBountyMultiplier("p64"), ITEMS.p64?.name || "Seal of Vine", "p64");
  }
  if ((bot.memory?.length || 0) >= 8 && passiveStack("p67")) {
    applyMultiplier(memoryBountyMultiplier("p67"), ITEMS.p67?.name || "Seal of Caim", "p67");
  }

  return { payout: roundedReward, baseReward, modifierEntries };
}

function botHasLowSin(bot, limit = 3) {
  if (bot?.immortal) return false;
  return botSin(bot) <= limit;
}

function andromaliusBountyLimit(idOrItem) {
  return 2 + eliteLevels(idOrItem);
}

function wealthWeightBonus() {
  return 0;
}

function passiveShopDiscount() {
  return 0;
}

function sinPricePressureMultiplier() {
  const credits = Number.isFinite(state.player.credits) ? Math.max(0, state.player.credits) : 0;
  if (credits <= SIN_PRICE_PRESSURE_INTERVAL) return 1;
  return 2 ** Math.ceil((credits - SIN_PRICE_PRESSURE_INTERVAL) / SIN_PRICE_PRESSURE_INTERVAL);
}

function memoryEntryForBot(bot) {
  const round = state.roundState;
  const fallbackGuess = bot?.plannedGuess ?? bot?.anchor ?? 50;
  const ownGuess = round?.botEffectiveGuesses?.get(bot.id) ?? fallbackGuess;
  const tableAverage = Number.isFinite(round?.tableAverage) ? round.tableAverage : ownGuess;
  return {
    ownGuess,
    playerGuess: round?.playerEffectiveGuess ?? ownGuess,
    target: round?.target ?? state.previousTarget ?? ownGuess,
    targetModifier: round?.targetModifier ?? currentTargetModifier(),
    targetOffset: round?.targetOffset ?? 0,
    tableAverage,
    botAverage: tableAverage
  };
}

function bathinMemoryDamage(entry) {
  return passiveEntryFlatDamage(entry, 3);
}

function applyBathinMemoryDamage(bot, entries) {
  if (!state.roundState || !bot || bot.eliminated || !entries?.length) return;
  entries.forEach((entry) => {
    if (bot.eliminated) return;
    const damage = bathinMemoryDamage(entry);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    queueEndOfRoundBotDamage(bot, damage, `Seal of Bathin dealt ${damage} damage to ${bot.name} for gaining MEMORY.`, "Seal of Bathin");
  });
}

function reduceBotMemoryRecord(bot, amount) {
  let remaining = Math.max(0, Math.ceil(amount));
  if (!bot || remaining <= 0) return;
  bot.lastMemoryDelta = Math.max(0, (bot.lastMemoryDelta || 0) - remaining);
  if (!Array.isArray(bot.memorySources)) return;
  for (let index = bot.memorySources.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const source = bot.memorySources[index];
    const sourceAmount = Math.max(0, Math.ceil(source?.amount || 0));
    const removed = Math.min(sourceAmount, remaining);
    source.amount = sourceAmount - removed;
    remaining -= removed;
  }
  bot.memorySources = bot.memorySources.filter((source) => Math.max(0, Math.ceil(source?.amount || 0)) > 0);
}

function applyMemoryToBountyMirror(bot, amount, options = {}) {
  const memoriesAdded = Math.max(0, Math.ceil(amount));
  if (options.triggerMemoryBountyMirror === false || !state.roundState || !bot || bot.eliminated || memoriesAdded <= 0) return;
  const entry = orderedPassiveEffectEntries("p10")[0];
  if (!entry) return;
  const baseConverted = Math.floor(memoriesAdded / 2);
  const converted = baseConverted > 0 ? Math.min(memoriesAdded, baseConverted + passiveEntryEliteLevels(entry)) : 0;
  if (converted <= 0) return;
  bot.memory.splice(Math.max(0, bot.memory.length - converted), converted);
  reduceBotMemoryRecord(bot, converted);
  markPassiveEntryTriggered(entry);
  changeBotSin(bot, converted, `Seal of Gusion converted ${converted} MEMORY from ${bot.name} into BOUNTY.`, {
    source: "Seal of Gusion",
    triggerMemoryBountyMirror: false
  });
}

function applyBountyToMemoryMirror(bot, amount, options = {}) {
  const bountyGained = Math.max(0, Math.ceil(amount));
  if (options.triggerMemoryBountyMirror === false || !state.roundState || !bot || bot.eliminated || bountyGained <= 0) return;
  const entry = orderedPassiveEffectEntries("p10")[0];
  if (!entry) return;
  const baseConverted = Math.floor(bountyGained / 2);
  const converted = baseConverted > 0 ? Math.min(bountyGained, baseConverted + passiveEntryEliteLevels(entry)) : 0;
  if (converted <= 0) return;
  markPassiveEntryTriggered(entry);
  const result = changeBotSin(bot, -converted, "", {
    source: "Seal of Gusion",
    triggerMemoryBountyMirror: false,
    triggerLossDamage: false
  });
  if (result.lost <= 0) return;
  const added = addBotMemory(bot, result.lost, "", {
    source: "Seal of Gusion",
    triggerMemoryBountyMirror: false
  });
  addRoundEvent(`Seal of Gusion converted ${result.lost} BOUNTY from ${bot.name} into ${added} MEMORY.`);
}

function memoryRoundLimit() {
  return Math.max(0, Math.ceil(state.round || 0));
}

function botMemoryLimit(bot) {
  const roundLimit = memoryRoundLimit();
  if (bot?.isBoss) return roundLimit;
  return Math.min(NON_BOSS_MEMORY_LIMIT, roundLimit);
}

function trimBotMemoryToLimit(bot) {
  if (!bot?.memory) return 0;
  const limit = botMemoryLimit(bot);
  const before = bot.memory.length;
  bot.memory = limit > 0 ? bot.memory.slice(-limit) : [];
  return Math.max(0, before - bot.memory.length);
}

function sitriExcessMemoryDamage(entry) {
  return doubledStackValue(entry, 10);
}

function applyExcessMemoryDamage(bot, excessMemory) {
  const excess = Math.max(0, Math.ceil(excessMemory));
  if (!state.roundState || !bot || bot.eliminated || excess <= 0) return;
  orderedPassiveEffectEntries("p55").forEach((entry) => {
    if (bot.eliminated) return;
    const damage = excess * sitriExcessMemoryDamage(entry);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    queueEndOfRoundBotDamage(
      bot,
      damage,
      `Seal of Sitri converted ${excess} excess MEMORY into ${damage} damage to ${bot.name}.`,
      "Seal of Sitri"
    );
  });
}

function addBotMemory(bot, count, reason = "", options = {}) {
  if (!bot || bot.eliminated || count <= 0) return 0;
  const baseRequested = Math.ceil(count);
  const bathinEntries = options.triggerBathinMemory !== false ? orderedPassiveEffectEntries("p15") : [];
  const bonusRequested = bathinEntries.length;
  const requested = baseRequested + bonusRequested;
  trimBotMemoryToLimit(bot);
  const beforeMemory = bot.memory?.length || 0;
  const allowed = Math.max(0, botMemoryLimit(bot) - beforeMemory);
  const added = Math.min(requested, allowed);
  const excess = Math.max(0, requested - added);
  const entry = options.entry || memoryEntryForBot(bot);
  for (let index = 0; index < added; index += 1) {
    bot.memory.push({ ...entry });
  }
  const actualIncrease = Math.max(0, (bot.memory?.length || 0) - beforeMemory);
  const baseIncrease = Math.min(baseRequested, actualIncrease);
  const bathinIncrease = Math.max(0, actualIncrease - baseIncrease);
  recordBotMemorySource(bot, baseIncrease, options.source || sourceLabelFromReason(reason, "Memory"));
  recordBotMemorySource(bot, bathinIncrease, ITEMS.p15?.name || "Seal of Bathin");
  applyMemoryToBountyMirror(bot, actualIncrease, options);
  applyExcessMemoryDamage(bot, excess);
  applyBathinMemoryDamage(bot, bathinEntries);
  if (reason) state.roundState?.roundEvents.push(reason);
  applySelfStackingMemoryOverTen(bot, beforeMemory, bot.memory?.length || 0);
  checkBalamMemoryBountyEliminations();
  return actualIncrease;
}

function initialMemoryEntries(count) {
  const targetModifier = state.roundState?.targetModifier ?? currentTargetModifier();
  const targetOffset = state.roundState?.targetOffset ?? 0;
  const target = state.previousTarget ?? Math.ceil(50 * targetModifier + targetOffset);
  const tableAverage = targetModifier ? (target - targetOffset) / targetModifier : 50;
  return Array.from({ length: count }, () => ({
    ownGuess: 50,
    playerGuess: 50,
    target,
    targetModifier,
    targetOffset,
    tableAverage,
    botAverage: tableAverage
  }));
}

function seedNewBotMemoryFromVassago(bot) {
  if (!bot || bot.isBoss) return;
  if (bot.memory?.length) return;
  const entries = orderedPassiveEffectEntries("p1");
  if (!entries.length) return;
  const seedCount = Math.min(3, botMemoryLimit(bot));
  bot.memory = initialMemoryEntries(seedCount);
  recordBotMemorySource(bot, bot.memory.length, ITEMS.p1?.name || "Seal of Vassago");
  entries.forEach((entry) => markPassiveEntryTriggered(entry));
}

function applyBotSinLossDamage(bot, lost, extraDamagePerSin = 0, extraSource = "") {
  const amount = Math.max(0, Math.ceil(lost));
  if (!bot || bot.eliminated || amount <= 0) return;

  if (extraDamagePerSin > 0) {
    const damage = Math.ceil(amount * extraDamagePerSin);
    if (damage > 0) queueEndOfRoundBotDamage(bot, damage, `${extraSource} dealt ${damage} damage to ${bot.name}.`, extraSource || "SIN loss");
  }

  orderedPassiveEffectEntries("p43").forEach((entry) => {
    const damage = passiveEntryFlatDamage(entry, 20);
    if (damage <= 0 || bot.eliminated) return;
    markPassiveEntryTriggered(entry);
    queueEndOfRoundBotDamage(bot, damage, `Seal of Raum dealt ${damage} damage to ${bot.name} for losing SIN.`, "Seal of Raum");
  });
}

function agaresDamagePerSin(entry) {
  return flatDamageValue(entry, 5);
}

function applyBotSinGainDamage(bot, gained) {
  return 0;
}

function stubbornArtifactChance(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  if (!stack) return 0;
  return Math.min(1, 0.5 + Math.max(0, stack - 1) * 0.1);
}

function balamCollapseTargets(sourceBot) {
  const bosses = activeBots().filter((bot) => bot.id !== sourceBot?.id && bot.isBoss);
  if (bosses.length) return bosses;
  return activeBots().filter((bot) => bot.id !== sourceBot?.id);
}

function checkBalamMemoryBountyEliminations() {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p57");
  if (!round || round.balamResolving || !entries.length) return;
  round.balamResolving = true;
  try {
    let target = activeBots().find((bot) => !bot.isBoss && !bot.immortal && (bot.memory?.length || 0) >= 10 && botRegularBounty(bot) >= 10);
    while (target) {
      entries.forEach((entry) => markPassiveEntryTriggered(entry));
      const damagePool = passiveEntryFlatDamage(entries[0], target.maxHp || 0);
      target.hp = 0;
      target.deathCause = "memory-bounty";
      target.deathNotice = "BALAM";
      round.roundEvents.push(`Seal of Balam eliminated ${target.name} for reaching 10 memory and 10 bounty.`);

      const damageTargets = balamCollapseTargets(target);
      if (damagePool > 0 && damageTargets.length) {
        const allocations = randomDamageSpread(damagePool, damageTargets);
        damageBots(
          damageTargets,
          (bot) => allocations.get(bot.id) || 0,
          (bot, damage) => `Seal of Balam dealt ${damage} collapse damage to ${bot.name}.`,
          "Seal of Balam"
        );
      }

      resolveEliminatedBots([target]);
      target = activeBots().find((bot) => !bot.isBoss && !bot.immortal && (bot.memory?.length || 0) >= 10 && botRegularBounty(bot) >= 10);
    }
  } finally {
    round.balamResolving = false;
  }
}

function changeBotSin(bot, delta, reason = "", options = {}) {
  if (!bot || bot.eliminated) return { changed: 0, lost: 0, gained: 0 };
  if (bot.immortal || !Number.isFinite(botSin(bot))) return { changed: 0, lost: 0, gained: 0 };
  const before = botSin(bot);
  const next = Math.max(0, Math.ceil(before + delta));
  bot.reward = next;
  const changed = next - before;
  if (!changed) return { changed: 0, lost: 0, gained: 0 };
  const lost = Math.max(0, -changed);
  const gained = Math.max(0, changed);
  const fallbackSource = changed > 0 ? "SIN gain" : "SIN loss";
  const source = options.source || sourceLabelFromReason(reason, fallbackSource);
  bot.lastSinDelta = (bot.lastSinDelta || 0) + changed;
  recordBotSinSource(bot, changed, source);
  if (reason) state.roundState?.roundEvents.push(reason);
  if (lost > 0 && options.triggerLossDamage !== false) {
    applyBotSinLossDamage(bot, lost, options.extraDamagePerSin || 0, options.extraDamageSource || "");
  }
  if (gained > 0) {
    applyBountyToMemoryMirror(bot, gained, options);
  }
  checkBalamMemoryBountyEliminations();
  return { changed, lost, gained };
}

function setBotSin(bot, value, reason = "", options = {}) {
  return changeBotSin(bot, Math.ceil(value) - botSin(bot), reason, options);
}

function increaseAllBotSin(amount, reasonFactory) {
  const increase = Math.max(0, Math.ceil(amount));
  if (increase <= 0) return 0;
  let total = 0;
  activeBots().forEach((bot) => {
    const result = changeBotSin(bot, increase, typeof reasonFactory === "function" ? reasonFactory(bot, increase) : "", {
      triggerLossDamage: false
    });
    total += result.gained;
  });
  return total;
}

function applyTargetedItemSinGain(item, targets) {
  const uniqueTargets = Array.from(new Set((targets || []).filter((bot) => bot && !bot.eliminated)));
  if (!item || !uniqueTargets.length) return;
  if (state.roundState?.artifactTargetCountsByBotId) {
    uniqueTargets.forEach((bot) => {
      const previous = state.roundState.artifactTargetCountsByBotId.get(bot.id) || 0;
      state.roundState.artifactTargetCountsByBotId.set(bot.id, previous + 1);
    });
  }
  orderedPassiveEffectEntries("p82").forEach((entry) => {
    const chance = Math.min(1, 0.5 + Math.max(0, (entry.stack || 1) - 1) * 0.1);
    let revealed = 0;
    uniqueTargets.forEach((bot) => {
      if (Math.random() < chance && revealBotGuess(bot, "Seal of Marked Offering", entry)) revealed += 1;
    });
    if (revealed > 0) state.roundState?.roundEvents.push(`Seal of Marked Offering revealed ${revealed} targeted DAMNED.`);
  });
  orderedPassiveEffectEntries("p105").forEach((entry) => {
    const chance = stubbornArtifactChance(entry);
    let changed = 0;
    uniqueTargets.forEach((bot) => {
      if (Math.random() < chance && setBotPersonality(bot, "Stubborn", passiveName("p105", "Seal of Andras"), { markEntry: entry })) {
        changed += 1;
      }
    });
    if (changed > 0) state.roundState?.roundEvents.push(`${passiveName("p105", "Seal of Andras")} made ${changed} ARTIFACT target${changed === 1 ? "" : "s"} STUBBORN.`);
  });
  const entries = orderedPassiveEffectEntries("p49");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const amount = passiveEntryScaledValue(entry, 3);
    if (amount <= 0) return;
    markPassiveEntryTriggered(entry);
    uniqueTargets.forEach((bot) => {
      changeBotSin(bot, amount, `Seal of Phenex gave ${bot.name} +${amount} SIN because ${item.name} targeted them.`, {
        triggerLossDamage: false
      });
    });
  });
}

function critWindowDetails(idOrItem) {
  return {
    guaranteed: criticalCalipersWindow(idOrItem),
    chance: 0,
    text: `+/-${criticalCalipersWindow(idOrItem)}`
  };
}

function ascendingCritWindowBonus() {
  return passiveStack("p91") ? Math.min(4, Math.max(0, Math.ceil(state.critMomentumBonus || 0))) : 0;
}

function ascendingCritDamageBonus() {
  return passiveStack("p91") ? eliteLevels("p91") * 5 : 0;
}

function passiveDisplayName(item) {
  if (isSelfStackingSeal(item)) return item.name;
  const stack = item.stack || 1;
  if (stack <= 1) return item.name;
  return stack === 2 ? `ELITE ${item.name}` : `ELITE +${stack - 1} ${item.name}`;
}

function simpleStackCount(idOrItem) {
  return typeof idOrItem === "string" ? passiveStack(idOrItem) : idOrItem?.stack || 0;
}

function divisibleVerdictDamage(idOrItem) {
  return flatDamageValue(idOrItem, 20);
}

function edgeGambitMultiplier(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? 2 * Math.pow(1.5, stack - 1) : 1;
}

function edgeGambitDamage(idOrItem) {
  return flatDamageValue(idOrItem, 10);
}

function spiteCircuitDamage(playerDamage) {
  return flatDamageValue("p5", playerDamage);
}

function criticalCalipersWindow(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? stack + 1 : 0;
}

function eligosBotCriticalWindow(idOrItem = "p69") {
  const stack = simpleStackCount(idOrItem);
  return stack ? stack : 0;
}

function pressureSpikeDamage(idOrItem) {
  return flatDamageValue(idOrItem, 20);
}

function gaapDamage(idOrItem) {
  return flatDamageValue(idOrItem, 5);
}

function poisonPercentPerCounter(idOrItem) {
  return Math.max(0, 5 + eliteLevels(idOrItem) * 2);
}

function paimonBaseSin(round = state.roundState) {
  if (!round) return 0;
  const distance = Math.ceil(Math.abs((round.playerEffectiveGuess ?? 0) - (round.target ?? 0)));
  if (!Number.isFinite(distance) || distance > 5) return 0;
  if (distance === 0) return 10;
  return Math.max(0, 6 - distance);
}

function paimonSinReward(idOrItem, round = state.roundState) {
  const baseSin = paimonBaseSin(round);
  return baseSin ? doubledStackValue(idOrItem, baseSin) : 0;
}

function bifronsSinReward(entry) {
  const currentSin = Math.max(0, Math.ceil(state.player.credits || 0));
  return passiveEntryScaledValue(entry, currentSin);
}

function playerTargetDistance(round = state.roundState) {
  if (!round) return Number.POSITIVE_INFINITY;
  const guess = round.playerEffectiveGuess;
  const target = round.target;
  if (!Number.isFinite(guess) || !Number.isFinite(target)) return Number.POSITIVE_INFINITY;
  return Math.ceil(Math.abs(guess - target));
}

function shaxRerollDamage(entry, spent) {
  return passiveEntryFlatDamage(entry, Math.max(0, Math.ceil(spent || 0)) * 2);
}

function sallosShiftValues(entry) {
  const max = 5 + Math.max(0, (entry?.stack || 1) - 1);
  return Array.from({ length: Math.max(1, max - 1) }, (_, index) => index + 2);
}

function barbatosDamage(idOrItem) {
  return flatDamageValue(idOrItem, 5);
}

function fullHealthExtraDamage(idOrItem) {
  return flatDamageValue(idOrItem, 10);
}

function revealedExtraDamage(idOrItem) {
  return flatDamageValue(idOrItem, 15);
}

function aimBossDamage(idOrItem) {
  return flatDamageValue(idOrItem, 30);
}

function vapulaMemoryExtraDamage(idOrItem, memoryCount) {
  if (memoryCount > 12) return flatDamageValue(idOrItem, 15);
  if (memoryCount >= 8) return flatDamageValue(idOrItem, 10);
  return 0;
}

function decarabiaMemoryExtraDamage(idOrItem, bot) {
  const memory = bot?.memory?.length || 0;
  if (!memory) return 0;
  const perMemory = bot?.isBoss ? 1 : 3;
  return flatDamageValue(idOrItem, memory * perMemory);
}

function furcasSelectedDamage(idOrItem) {
  return eliteLevels(idOrItem) * 5;
}

function specialSealBaseMultiplier(idOrItem, baseMultiplier) {
  const stack = simpleStackCount(idOrItem);
  if (!stack) return 1;
  return baseMultiplier + eliteLevels(idOrItem) * 0.2;
}

function revealedBountyMultiplier(idOrItem) {
  return 2 * passivePower(idOrItem);
}

function fullHealthDamageMultiplier(idOrItem) {
  return 1.5 * passivePower(idOrItem);
}

function fifthRoundDamageMultiplier(idOrItem) {
  return 2 * passivePower(idOrItem);
}

function memoryDamageMultiplier(idOrItem, memoryCount) {
  if (memoryCount > 12) return 2 * passivePower(idOrItem);
  if (memoryCount >= 8) return 1.5 * passivePower(idOrItem);
  return 1;
}

function memoryBountyMultiplier(idOrItem) {
  return 2 * passivePower(idOrItem);
}

function sacrificialDaggerBossPercent(idOrItem = "p70") {
  return 10;
}

function sacrificialDaggerPercentForBot(bot) {
  return bot?.isBoss ? sacrificialDaggerBossPercent() : 20;
}

function sacrificialDaggerExtraDamage(idOrItem = "p70") {
  return flatDamageValue(idOrItem, 10);
}

function halphasRoundBossDamage() {
  return Math.max(0, Math.ceil((state.round || 0) * (state.bossKills || 0)));
}

function halphasEliteCredits(entry) {
  return Math.max(0, ((entry?.stack || 1) - 1) * 2);
}

function satanSealMaxDivisor(entry) {
  return Math.max(1, Math.floor(100 * Math.pow(0.8, passiveEntryEliteLevels(entry))));
}

function satanSealDamageRoll(entry) {
  const maxDivisor = satanSealMaxDivisor(entry);
  const divisor = randomInt(1, maxDivisor);
  return {
    divisor,
    maxDivisor,
    damage: Math.ceil(666 / divisor)
  };
}

function randomDamageSpread(totalDamage, targets, broadSpread = false) {
  const total = Math.max(0, Math.ceil(totalDamage));
  const liveTargets = targets.filter((bot) => bot && !bot.eliminated && bot.hp > 0);
  const allocations = new Map();
  if (total <= 0 || !liveTargets.length) return allocations;
  if (broadSpread && liveTargets.length > 1) {
    const seededTargets = shuffled(liveTargets).slice(0, Math.min(total, liveTargets.length));
    seededTargets.forEach((bot) => allocations.set(bot.id, 1));
    const extraAllocations = randomDamageSpread(total - seededTargets.length, liveTargets);
    extraAllocations.forEach((amount, botId) => {
      allocations.set(botId, (allocations.get(botId) || 0) + amount);
    });
    return allocations;
  }
  const weightedTargets = liveTargets.map((bot) => ({ bot, weight: Math.max(0.01, Math.random()) }));
  const weightTotal = weightedTargets.reduce((sum, entry) => sum + entry.weight, 0);
  let assigned = 0;
  weightedTargets.forEach((entry) => {
    const amount = Math.floor((total * entry.weight) / weightTotal);
    if (amount > 0) allocations.set(entry.bot.id, amount);
    assigned += amount;
  });
  let remainder = total - assigned;
  shuffled(weightedTargets).forEach((entry) => {
    if (remainder <= 0) return;
    allocations.set(entry.bot.id, (allocations.get(entry.bot.id) || 0) + 1);
    remainder -= 1;
  });
  return allocations;
}

function slowRepairSin(idOrItem) {
  return passiveConvertedSin(idOrItem, 5);
}

function victoryPatchSin(idOrItem) {
  return passiveConvertedSin(idOrItem, 3);
}

function sweepDividendHealingSin(idOrItem) {
  return passiveConvertedSin(idOrItem, 5);
}

function sweepDividendCredits(idOrItem) {
  return scaledPassiveValue(idOrItem, 5);
}

function furfurDamage(idOrItem) {
  return flatDamageValue(idOrItem, 1);
}

function andrealphusDamage(idOrItem) {
  return flatDamageValue(idOrItem, 10);
}

function baseEditionBonus(idOrItem) {
  return simpleStackCount(idOrItem) * 2;
}

function twinDetonatorDamage(idOrItem) {
  return flatDamageValue(idOrItem, 30);
}

function reactiveWarrantySin(idOrItem) {
  return passiveConvertedSin(idOrItem, 3);
}

function reactiveWarrantyDamage(idOrItem) {
  return flatDamageValue(idOrItem, 10);
}

function lowProfileRewardSin(idOrItem) {
  const baseSin = typeof idOrItem === "string" ? scaledPassiveValue(idOrItem, 4) : scaledPassiveValueForItem(idOrItem, 4);
  return baseSin + passiveConvertedSin(idOrItem, 3);
}

function passiveConvertedSin(idOrItem, baseHeal) {
  return simpleStackCount(idOrItem) ? Math.ceil(baseHeal * passivePower(idOrItem)) : 0;
}

function orderedPassiveEntries() {
  const passives = state.player.passives || [];
  return passives
    .map((item, index) => {
      if (!item) return null;
      if (REMOVED_PASSIVE_IDS.has(item.id)) return null;
      if (isSealSuppressed(item.id)) return null;
      if (item.id === "p28") {
        const target = mimicTargetEntry();
        if (!target || isSealSuppressed(target.id)) return null;
        return {
          id: target.id,
          item,
          stack: item.stack || 1,
          sourceId: "p28",
          copied: true,
          copiedName: target.name,
          index
        };
      }
      return {
        id: item.id,
        item,
        stack: item.stack || 1,
        sourceId: item.id,
        copied: false,
        index
      };
    })
    .filter(Boolean);
}

function orderedPassiveEffectEntries(ids) {
  const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
  return orderedPassiveEntries().filter((entry) => idSet.has(entry.id) && !isSealSuppressed(entry.id));
}

function passiveEntryPower(entry, eliteStep = 0.2) {
  const stack = entry?.stack || 0;
  return stack ? 1 + Math.max(0, stack - 1) * eliteStep : 0;
}

function passiveEntryScaledValue(entry, baseValue, eliteStep = 0.2) {
  const power = passiveEntryPower(entry, eliteStep);
  return power ? Math.ceil(baseValue * power) : 0;
}

function passiveEntryConvertedSin(entry, baseHeal) {
  return entry?.stack ? Math.ceil(baseHeal * passiveEntryPower(entry)) : 0;
}

function stackLinearMultiplier(entry) {
  return Math.max(1, entry?.stack || 1);
}

function markPassiveEntryTriggered(entry) {
  if (!state.roundState || !entry) return;
  const triggerId = entry.sourceId || entry.id;
  state.roundState.triggeredPassiveIds.add(triggerId);
  recordSealTrigger(triggerId);
}

function nonBossDamageMultiplier(bot, playerDealt = true) {
  return 1;
}

function scaledBotDamage(bot, amount, playerDealt = true) {
  return scaledBotDamageDetails(bot, amount, playerDealt).damage;
}

function scaledBotDamageDetails(bot, amount, playerDealt = true) {
  const damage = Math.max(0, Math.ceil(amount));
  if (!damage) return { damage: 0, baseDamage: 0, modifierEntries: [], redirectEntries: [] };
  let exactDamage = damage;
  let roundedDamage = damage;
  const modifierEntries = [];
  const redirectEntries = [];
  const applyFlatBonus = (bonus, source, entry) => {
    const extra = Math.max(0, Math.ceil(bonus || 0));
    if (extra <= 0 || roundedDamage <= 0) return false;
    exactDamage += extra;
    roundedDamage += extra;
    modifierEntries.push({ amount: extra, source, kind: "flat-bonus" });
    markPassiveEntryTriggered(entry);
    return true;
  };
  const applyMultiplier = (multiplier, source, entry) => {
    if (!Number.isFinite(multiplier) || multiplier <= 1 || roundedDamage <= 0) return;
    const before = roundedDamage;
    exactDamage *= multiplier;
    roundedDamage = Math.ceil(exactDamage);
    const extra = Math.max(0, roundedDamage - before);
    if (extra <= 0) return;
    modifierEntries.push({ amount: extra, source, kind: "multiplier-bonus" });
    markPassiveEntryTriggered(entry);
  };
  const applyRedirectMultiplier = (multiplier, source, entry, targetBot, redirectFullDamage = false) => {
    if (!Number.isFinite(multiplier) || multiplier <= 1 || roundedDamage <= 0 || !targetBot) return;
    const boostedDamage = Math.ceil(exactDamage * multiplier);
    const redirectedDamage = redirectFullDamage ? boostedDamage : Math.max(0, boostedDamage - roundedDamage);
    if (redirectedDamage <= 0) return;
    redirectEntries.push({ targetBotId: targetBot.id, amount: redirectedDamage, source, kind: "bonus" });
    markPassiveEntryTriggered(entry);
  };

  if (bot) {
    orderedPassiveEffectEntries(["p46", "p62", "p63", "p68"]).forEach((entry) => {
      if (entry.id === "p46" && botSin(bot) >= 6) {
        applyFlatBonus(barbatosDamage(entry), ITEMS.p46?.name || "Seal of Barbatos", entry);
        return;
      }

      if (entry.id === "p62" && bot.hp >= bot.maxHp && !state.roundState?.belethTriggeredBotIds?.has(bot.id)) {
        applyFlatBonus(fullHealthExtraDamage(entry), ITEMS.p62?.name || "Seal of Beleth", entry);
        state.roundState?.belethTriggeredBotIds?.add(bot.id);
        return;
      }

      if (entry.id === "p63" && bot.revealedByPassive) {
        applyFlatBonus(revealedExtraDamage(entry), ITEMS.p63?.name || "Seal of Vual", entry);
        return;
      }

      if (entry.id === "p68") {
        if (state.roundState?.vapulaTriggeredBotIds?.has(bot.id)) return;
        if (applyFlatBonus(vapulaMemoryExtraDamage(entry, bot.memory?.length || 0), ITEMS.p68?.name || "Seal of Vapula", entry)) {
          state.roundState?.vapulaTriggeredBotIds?.add(bot.id);
        }
        return;
      }
    });

    if (state.roundState?.padmaVulnerableBotIds?.has(bot.id)) {
      applyMultiplier(1.25, ITEMS.p96?.name || "Seal of Padma", null);
    }

    orderedPassiveEffectEntries(["p74", "p75", "p76", "p77", "p78", "p79"]).forEach((entry) => {
      if (entry.id === "p74") {
        if (botSin(bot) >= 10) applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p74?.name, entry);
        return;
      }

      if (entry.id === "p75") {
        if (bot.revealedByPassive) applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p75?.name, entry);
        return;
      }

      if (entry.id === "p76") {
        if (bot.isBoss || (bot.memory?.length || 0) < 10) return;
        const redirectBoss = blackHorseRedirectBoss(bot);
        if (redirectBoss) {
          applyRedirectMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p76?.name, entry, redirectBoss, true);
        } else {
          applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p76?.name, entry);
        }
        return;
      }

      if (entry.id === "p77" && state.roundState?.paleHorseDamageBoostActive) {
        applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p77?.name, entry);
        return;
      }

      if (entry.id === "p78") {
        if (personalityType(bot) === "Stubborn") {
          applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p78?.name, entry);
        }
        return;
      }

      if (entry.id === "p79" && (state.roundState?.artifactTargetCountsByBotId?.get(bot.id) || 0) > 0) {
        applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p79?.name, entry);
      }
    });
  }

  return {
    damage: roundedDamage,
    baseDamage: damage,
    modifierEntries,
    redirectEntries
  };
}

function blackHorseRedirectBoss(sourceBot) {
  return (
    activeBots()
      .filter((bot) => bot.isBoss && bot.id !== sourceBot?.id)
      .sort((left, right) => left.id - right.id)[0] || null
  );
}

function applyPendingRedirectDamage(entries, botDamages, botDamageSources) {
  (entries || []).forEach((entry) => {
    const target = state.bots.find((bot) => bot.id === entry.targetBotId);
    if (!target || target.eliminated) return;
    addPendingBotDamage(botDamages, botDamageSources, target, entry.amount, entry.source || "Redirected damage");
  });
}

function applyDirectRedirectDamage(entries) {
  (entries || []).forEach((entry) => {
    const target = state.bots.find((bot) => bot.id === entry.targetBotId);
    const damage = Math.max(0, Math.ceil(entry.amount || 0));
    if (!target || target.eliminated || damage <= 0) return;
    const source = entry.source || "Redirected damage";
    damageBot(target, damage, `${source} redirected ${damage} damage to ${target.name}.`, source);
  });
}

function scaledBotDamageSourceEntries(details, source) {
  const entries = [];
  const baseDamage = Math.max(0, Math.ceil(details?.baseDamage || 0));
  if (baseDamage > 0) entries.push({ amount: baseDamage, source });
  (details?.modifierEntries || []).forEach((entry) => {
    const amount = Math.max(0, Math.ceil(entry.amount || 0));
    if (amount > 0) entries.push({ amount, source: entry.source || "Damage modifier", kind: entry.kind || "bonus" });
  });
  return entries;
}

function recordScaledBotDamageSources(bot, details, source) {
  scaledBotDamageSourceEntries(details, source).forEach((entry) => recordBotDamageSource(bot, entry.amount, entry.source, entry.kind));
}

function highestHealthNonBossBot() {
  return activeBots()
    .filter((bot) => !bot.isBoss)
    .sort((left, right) => right.hp - left.hp || right.maxHp - left.maxHp || left.id - right.id)[0];
}

function highestHealthEnemy() {
  return activeBots().sort((left, right) => right.hp - left.hp || right.maxHp - left.maxHp || left.id - right.id)[0];
}

function applyPassivePlayerHeal(id, baseHeal, reason) {
  const credits = passiveConvertedSin(id, baseHeal);
  if (!credits || state.player.hp <= 0) return { healed: 0, credits: 0 };
  const gained = gainCredits(credits, true, reason);
  addRoundEvent(`${reason} paid ${gained} SIN.`);
  return { healed: 0, credits: gained };
}

function applyPassivePlayerHealForEntry(entry, baseHeal, reason) {
  const credits = passiveEntryConvertedSin(entry, baseHeal);
  if (!credits || state.player.hp <= 0) return { healed: 0, credits: 0 };
  const gained = gainCredits(credits, true, reason);
  addRoundEvent(`${reason} paid ${gained} SIN.`);
  return { healed: 0, credits: gained };
}

function artifactDescription(item) {
  if (!item) return "";
  if (item.id === "a6") return `During reveal, add ${artifactValue(20)} to the TARGET.`;
  if (item.id === "a7") return "Pick a non-boss DAMNED and swap your effective guess with theirs.";
  if (item.id === "a8") return `Pick a DAMNED; their guess counts ${artifactCount(5)} times for the TARGET average.`;
  if (item.id === "a9") return "Pick a DAMNED; remove their guess from the TARGET average, though they still take damage.";
  if (item.id === "a10") {
    return `Gain ${artifactValue(3)} to ${artifactValue(10)} SIN.`;
  }
  if (item.id === "a11") {
    return `Pick two non-boss DAMNED. The first takes ${artifactPercentValue(30)}% max-HEALTH damage. The second overheals ${artifactPercentValue(30)}% max HEALTH and copies the first's ability.`;
  }
  if (item.id === "a12") return `You take ${artifactPercentValue(50)}% less damage this round, including CRITICAL damage. Multiple uses stack multiplicatively.`;
  if (item.id === "a13") {
    return "Removed.";
  }
  if (item.id === "a14") return `During reveal, reduce the TARGET by ${artifactValue(10)}. The TARGET can go below zero.`;
  if (item.id === "a15") {
    const extra = sacrificialDaggerExtraDamage("p70");
    return `Pick a target. Deal ${artifactPercentValue(20)}% max-HEALTH damage to non-boss DAMNED, or ${artifactPercentValue(sacrificialDaggerBossPercent())}% to BOSSES${extra ? `, plus ${extra} flat damage from Seal of Amy` : ""}.`;
  }
  if (item.id === "a16") return `Gain a random ${artifactValue(3)} to ${artifactValue(9)} SIN.`;
  if (item.id === "a18") {
    return `Instantly copy the effect of the last non-Crystal ARTIFACT you used. Last: ${lastUsedArtifactName()}.`;
  }
  if (item.id === "a21") {
    return "This round, whenever you take damage, each DAMNED takes max-HEALTH damage equal to the same percent of your max HEALTH that you took.";
  }
  if (item.id === "a22") {
    return "+1 CRITICAL range for the round.";
  }
  if (item.id === "a23") return "Double the ELITE chance for the Seal slot on the next Devil's Offerings reroll.";
  if (item.id === "a25") return "Pick a DAMNED. Next round, reveal its guess and give it +3 BOUNTY.";
  if (item.id === "a26") {
    return "Reserved for a future ARTIFACT.";
  }
  if (item.id === "a28") {
    const value = artifactValue(6);
    return `Pick a DAMNED. It gains ${value} MEMORY, ${value} SIN, and heals ${artifactPercentValue(6)}% max HEALTH.`;
  }
  return normalizeGameText((item.description || "").replace(/^One use\.\s*/i, ""));
}

function itemDescription(item) {
  if (!item) return "";
  if (item.type === "active") return artifactDescription(item);
  if (item.type !== "passive") return normalizeGameText((item.description || "").replace(/^One use\.\s*/i, ""));
  const stack = item.stack || 1;
  if (isSelfStackingSeal(item)) return selfStackingSealDescription(item);
  if (item.id === "p28") {
    const target = mimicTargetEntry();
    if (!target) return "Copies a random SEAL you own. If no SEAL is available, it waits for the next SEAL you buy.";
    const copiedVersion = passiveDisplayName({ ...target, stack });
    return `Copies ${target.name} as ${copiedVersion}. If the copied SEAL is sold, Ose chooses another owned SEAL.`;
  }
  if (item.id === "p39") return `Seal of Purson stacks: ${item.counter || 0}. Rounds without buying from Devil's Offerings add 1 stack. Buying an offering resets stacks. End of round pays ${Math.ceil((item.counter || 0) * passivePower(item))} SIN.`;
  if (item.id === "p111") {
    const lastRoll =
      item.lastSatanDivisor && item.lastSatanMaxDivisor
        ? ` Last divisor: ${item.lastSatanDivisor}. Last damage: ${item.lastSatanDamage || 0}.`
        : "";
    return `Takes 2 SEAL slots. At end of round, divide 666 by a random number from 1 to ${satanSealMaxDivisor(item)} and deal the result as damage to every DAMNED.${lastRoll}`;
  }
  if (stack <= 1) return item.description;
  if (item.id === "p1") return `New non-boss DAMNED arrive with 3 MEMORY. At end of round, each DAMNED takes ${flatDamageValue(item, 1)} damage per MEMORY.`;
  if (item.id === "p2") {
    return `Close guesses pay SIN: ${doubledStackValue(item, 1)} at +/-5, adding ${doubledStackValue(item, 1)} per step closer through ${doubledStackValue(item, 5)} at +/-1. On exact TARGET, gain ${doubledStackValue(item, 10)} SIN.`;
  }
  if (item.id === "p3") return `If the rounded TARGET is a multiple of 3, all DAMNED take ${divisibleVerdictDamage(item)} extra damage.`;
  if (item.id === "p4") {
    return `If your final effective guess is 0, 50, or 100, deal ${edgeGambitDamage(item)} damage to every DAMNED, take half TARGET-difference damage, and ignore worst guess penalty damage.`;
  }
  if (item.id === "p5") return `Whenever you take damage, all DAMNED take ${flatDamagePower(item)}x that damage as extra damage.`;
  if (item.id === "p6") return `Your CRITICAL hit triggers within ${criticalCalipersWindow(item)} of the right integer.`;
  if (item.id === "p7") return `When you hit CRITICAL, it deals ${pressureSpikeDamage(item)} damage to everyone else.`;
  if (item.id === "p8") return `At end of round, gain ${slowRepairSin(item)} SIN.`;
  if (item.id === "p9") return `Every DAMNED elimination spreads ${passiveConvertedSin(item, 3)} SIN and 3 MEMORY randomly among the DAMNED of the next round.`;
  if (item.id === "p10") {
    const bonus = eliteLevels(item);
    return `Half of MEMORY gained by a DAMNED is converted to BOUNTY, rounded down. Half of BOUNTY gained by a DAMNED is converted to MEMORY, rounded down${bonus ? `, plus ${bonus} extra when it triggers` : ""}.`;
  }
  if (item.id === "p11") {
    return `When a DAMNED dies, gain ${stack} random ARTIFACT${stack === 1 ? "" : "S"} with 0 sell value if you have room.`;
  }
  if (item.id === "p12") return `At end of round, for every 10 SIN you have, deal ${flatDamageValue(item, 2)} damage to every DAMNED.`;
  if (item.id === "p13") {
    return `If two or more DAMNED are eliminated in a round, gain ${scaledPassiveValueForItem(item, 8)} SIN. If two or more share a personality, gain ${scaledPassiveValueForItem(item, 16)} SIN.`;
  }
  if (item.id === "p14") {
    return `At the start of each round, deal ${flatDamageValue(item, 20)} damage to a random DAMNED and change their personality to STUBBORN. If that damage eliminates them, gain ${scaledPassiveValueForItem(item, 8)} SIN.`;
  }
  if (item.id === "p15") {
    return `Whenever MEMORY would be added to a DAMNED, add +1 extra MEMORY and deal ${bathinMemoryDamage(item)} damage to that DAMNED.`;
  }
  if (item.id === "p16") {
    return `If a DAMNED's guess is less than 5 away from their previous guess, they take ${flatDamageValue(item, 10)} damage. If it is exactly the same, they take ${flatDamageValue(item, 30)} damage.`;
  }
  if (item.id === "p17") {
    return `At end of round, deal ${flatDamagePower(item)}x the total MEMORY of all DAMNED on the board, including dead ones, to one random living DAMNED. If BOSSES are active, hit all active BOSSES and exclude BOSS MEMORY from the sum.`;
  }
  if (item.id === "p18") return `At end of round, this SEAL's sell value increases by ${scaledPassiveValueForItem(item, 3)}.`;
  if (item.id === "p19") return `Every time a DAMNED dies, deal ${flatDamageValue(item, 5)} damage to every other DAMNED.`;
  if (item.id === "p20") return `Devil's Offerings has ${shopSlotCountForItem(item)} slots. Whenever you use an ARTIFACT, all DAMNED take ${flatDamagePower(item)}x that ARTIFACT's purchase cost as damage.`;
  if (item.id === "p21") return `Every reroll makes all DAMNED take ${shaxRerollDamage(item, 1)} damage per SIN spent at end of round.`;
  if (item.id === "p22") return `Avoid 20% of damage you would take in a round, rounded down. The avoided damage becomes ${doubledStackPower(item)}x MEMORY for the living DAMNED with the most MEMORY.`;
  if (item.id === "p23") return `New non-boss DAMNED have a ${Math.min(100, Math.round(33 * passivePower(item)))}% chance to spawn with +6 BOUNTY.`;
  if (item.id === "p24") return `You can use only one ARTIFACT per round. All DAMNED pay ${bountyOathMultiplierForItem(item).toFixed(1)}x BOUNTY SIN when eliminated.`;
  if (item.id === "p25") return `Gain +${baseEditionBonus(item)} ARTIFACT uses per round and +${baseEditionBonus(item)} ARTIFACT inventory slots.`;
  if (item.id === "p26") return `Using two matching ARTIFACTS in a round deals ${twinDetonatorDamage(item)} damage to all DAMNED.`;
  if (item.id === "p27") return `Every ARTIFACT triggers one outcome: gain ${reactiveWarrantySin(item)} SIN, deal ${reactiveWarrantyDamage(item)} damage to a random DAMNED, or refund its purchase cost.`;
  if (item.id === "p29") return `For every 2 SIN spent this round, deal ${furfurDamage(item)} damage to the highest-HEALTH DAMNED.`;
  if (item.id === "p30") return `Every DAMNED elimination deals ${andrealphusDamage(item)} damage to the DAMNED on its left and right.`;
  if (item.id === "p31") return `At end of round, two random DAMNED take ${flatDamagePower(item)}x their BOUNTY as damage.`;
  if (item.id === "p32") return `Every DAMNED death gives each other living DAMNED +${Math.ceil(passivePower(item))} to +${Math.ceil(2 * passivePower(item))} BOUNTY.`;
  if (item.id === "p33") return `Every DAMNED elimination makes all other DAMNED take ${flatDamagePower(item)}x that DAMNED's BOUNTY as damage.`;
  if (item.id === "p34") {
    return `When a DAMNED with 6 or more BOUNTY dies, deal ${flatDamageValue(item, 10)} damage to the highest-HEALTH enemy and give it +${scaledPassiveValueForItem(item, 1)} BOUNTY.`;
  }
  if (item.id === "p35") return `At end of round, the two highest BOUNTY DAMNED gain +${stack} BOUNTY.`;
  if (item.id === "p36") return "Removed.";
  if (item.id === "p37") return `If you take 4 or less TARGET-difference damage in a round, gain ${lowProfileRewardSin(item)} SIN.`;
  if (item.id === "p38") return `Start each round by marking a DAMNED. If it dies, its BOUNTY payout becomes at least ${scaledPassiveValueForItem(item, 6)} SIN or ${Math.round(200 * passivePower(item))}% BOUNTY, and you gain ${passiveConvertedSin(item, 5)} SIN.`;
  if (item.id === "p40") return `At end of round, deal ${flatDamagePower(item)}x half the total BOUNTY of living DAMNED to every enemy.`;
  if (item.id === "p41") return `If the rounded TARGET is a multiple of 7, gain SIN equal to ${Math.round(passivePower(item) * 100)}% of your current SIN.`;
  if (item.id === "p42") {
    return `When a DAMNED with 3 or less MEMORY dies, gain ${Math.round(100 * passivePower(item))}% of its MEMORY as SIN. If it had more than 3 MEMORY, split its MEMORY between adjacent DAMNED.`;
  }
  if (item.id === "p43") return `Whenever a DAMNED loses SIN, it takes ${flatDamageValue(item, 20)} damage. At end of round, all DAMNED lose 1 SIN.`;
  if (item.id === "p44") return `At end of round, non-boss DAMNED with ${andromaliusBountyLimit(item)} or less BOUNTY are eliminated. Their SIN goes to the living DAMNED with the highest BOUNTY.`;
  if (item.id === "p45") return `DAMNED with 3 or less BOUNTY pay ${Math.round(200 * passivePower(item))}% BOUNTY SIN when eliminated.`;
  if (item.id === "p46") return `Whenever a DAMNED with 6 or more BOUNTY takes damage, it takes ${barbatosDamage(item)} extra damage.`;
  if (item.id === "p47") return `At end of round, ${stack} DAMNED lose half their BOUNTY and you gain double the SIN removed.`;
  if (item.id === "p48") return `At start of round, double ${stack} random DAMNED ${stack === 1 ? "BOUNTY" : "BOUNTIES"} for 1 round.`;
  if (item.id === "p49") return `Using an ARTIFACT that targets DAMNED gives each target +${scaledPassiveValueForItem(item, 3)} BOUNTY.`;
  if (item.id === "p50") return `At end of round, 20% of SIN earned this round spreads among DAMNED, prioritizing highest BOUNTY. DAMNED take ${agaresDamagePerSin(item)} damage per BOUNTY gained from this SEAL.`;
  if (item.id === "p51") return `Once each round per DAMNED, when that DAMNED has taken more than 30% max-HEALTH damage, it gains +${scaledPassiveValueForItem(item, 4)} BOUNTY.`;
  if (item.id === "p52") {
    return `At end of round, DAMNED take ${flatDamageValue(item, 3)} damage per MEMORY. BOSSES take ${flatDamageValue(item, 1)} damage per MEMORY instead.`;
  }
  if (item.id === "p53") return `When a non-boss DAMNED is eliminated, gain bonus SIN equal to ${Math.round(100 * passivePower(item))}% of its MEMORY.`;
  if (item.id === "p54") {
    const multiplier = Number(flatDamagePower(item).toFixed(2));
    return `When revealed DAMNED take TARGET-difference damage, each adjacent DAMNED takes ${multiplier}x that damage.`;
  }
  if (item.id === "p55") {
    return `Each excess MEMORY becomes ${sitriExcessMemoryDamage(item)} damage to that DAMNED.`;
  }
  if (item.id === "p56") {
    return `At end of round, spread ${halphasRoundBossDamage()} damage randomly among enemies. ELITE pays ${halphasEliteCredits(item)} SIN each round.`;
  }
  if (item.id === "p57") {
    const multiplier = Number(flatDamagePower(item).toFixed(2));
    return `If a non-boss DAMNED has 10+ MEMORY and 10+ BOUNTY, it is instantly eliminated. ${multiplier}x its max HEALTH becomes damage spread to other DAMNED; if BOSSES are active, BOSSES take the damage.`;
  }
  if (item.id === "p58") {
    return `The worst guess penalty hits the 3 furthest guesses. The furthest takes ${flatDamageValue(item, 20)} damage, and the next two take ${flatDamageValue(item, 10)}.`;
  }
  if (item.id === "p59") {
    return `Reveal one extra DAMNED each round. Revealed DAMNED gain +${scaledPassiveValueForItem(item, 2)} BOUNTY and +2 MEMORY permanently.`;
  }
  if (item.id === "p60") {
    return `Whenever you use an ARTIFACT, 50% chance to create a copy of it in your inventory and deal ${gaapDamage(item)} damage to every DAMNED.`;
  }
  if (item.id === "p61") {
    return `BOSSES can have their guess revealed. At the start of each round, each revealed DAMNED gains 1 poison. At end of round, each poison deals ${poisonPercentPerCounter(item)}% max-HEALTH damage.`;
  }
  if (item.id === "p62") return `The first time each full-HEALTH DAMNED takes damage in a round, it takes ${fullHealthExtraDamage(item)} extra damage.`;
  if (item.id === "p63") {
    return `Revealed DAMNED take ${revealedExtraDamage(item)} extra damage whenever they take damage.`;
  }
  if (item.id === "p64") {
    return `Revealed DAMNED pay ${revealedBountyMultiplier(item).toFixed(1)}x BOUNTY SIN when eliminated.`;
  }
  if (item.id === "p65") return `At end of round, revealed DAMNED take ${flatDamagePower(item)}x half their guess as damage.`;
  if (item.id === "p66") return `When the TARGET is a multiple of 5, eliminate one random non-boss DAMNED. If BOSSES are active, each active BOSS takes ${aimBossDamage(item)} damage.`;
  if (item.id === "p67") return `DAMNED with 8 or more MEMORY pay ${memoryBountyMultiplier(item).toFixed(1)}x BOUNTY SIN when eliminated.`;
  if (item.id === "p68") {
    return `Once per round per DAMNED, a DAMNED with 8 or more MEMORY takes ${vapulaMemoryExtraDamage(item, 8)} extra damage the first time it takes damage. With more than 12 MEMORY, it takes ${vapulaMemoryExtraDamage(item, 13)} extra damage.`;
  }
  if (item.id === "p69") {
    return `Whenever a DAMNED hits CRITICAL, your guess counts as CRITICAL too and DAMNED CRITICAL damage cannot hurt you. DAMNED hit CRITICAL within +/-${eligosBotCriticalWindow(item)} of the TARGET.`;
  }
  if (item.id === "p70") {
    return `Sacrificial Dagger deals ${sacrificialDaggerExtraDamage(item)} extra flat damage and appears ${sacrificialDaggerShopWeight(item)}x as often in Devil's Offerings.`;
  }
  if (item.id === "p71") {
    const values = sallosShiftValues(item);
    return `Before damage calculation, all DAMNED guesses shift away from the TARGET by random ${values.join(", ")} without changing the average.`;
  }
  if (item.id === "p72") {
    return `Previous TARGET below 40 sets one non-boss DAMNED guess to 100; above 40 sets one DAMNED guess to 0. ELITE deals ${furcasSelectedDamage(item)} damage to the selected DAMNED.`;
  }
  if (item.id === "p73") {
    return `When a DAMNED dies from excess damage, split ${flatDamagePower(item)}x that excess damage equally among the other living enemies.`;
  }
  if (item.id === "p74") return `DAMNED with 10 or more BOUNTY take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources.`;
  if (item.id === "p75") return `Revealed DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources.`;
  if (item.id === "p76") {
    return `Non-boss DAMNED with 10 or more MEMORY take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources. If a BOSS is active, this SEAL's damage is dealt to that BOSS instead.`;
  }
  if (item.id === "p77") return `If you scored CRITICAL this round, DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources next round.`;
  if (item.id === "p78") {
    return `STUBBORN DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources.`;
  }
  if (item.id === "p79") return `DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage from all sources if an ARTIFACT was used on them this round.`;
  if (item.id === "p80") {
    return `DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} damage if they have more than 10 TARGET-difference damage. Worst guess damage counts as TARGET-difference damage.`;
  }
  if (item.id === "p81") return "If a DAMNED has more than 16 MEMORY, their guess is revealed.";
  if (item.id === "p82") {
    return `Using an ARTIFACT on a DAMNED has a ${Math.round(Math.min(1, 0.5 + Math.max(0, stack - 1) * 0.1) * 100)}% chance to reveal their guess.`;
  }
  if (item.id === "p84") {
    return `At end of round, every revealed DAMNED makes adjacent DAMNED take ${flatDamagePower(item)}x the TARGET-difference damage it took this round. Worst guess penalty counts.`;
  }
  if (item.id === "p85") {
    return `At end of round, each DAMNED takes ${flatDamageValue(item, 10)} damage for every other living DAMNED with the same personality.`;
  }
  if (item.id === "p86") {
    return `When a DAMNED is eliminated, ${Math.round(Math.min(1, 0.5 + Math.max(0, stack - 1) * 0.1) * 100)}% chance the replacement inherits its personality, MEMORY, name, number, and flag.`;
  }
  if (item.id === "p87") {
    return `When a DAMNED is eliminated, deal ${flatDamageValue(item, 30)} damage to each other living DAMNED with the same personality.`;
  }
  if (item.id === "p88") {
    return `When a DAMNED dies, ${scaledPassiveValueForItem(item, 50) / 100}x its BOUNTY is added to each other living DAMNED with the same personality, and you gain ${Math.round(passivePower(item) * 100)}% of its BOUNTY.`;
  }
  if (item.id === "p89") {
    return `DAMNED can only be ANALYST or STUBBORN. At end of round, a DAMNED takes ${flatDamageValue(item, 5)} damage if both adjacent DAMNED have the same personality.`;
  }
  if (item.id === "p90") {
    return `Whenever a DAMNED's personality is altered by a SEAL or ARTIFACT, they take ${flatDamageValue(item, 10)} damage. At end of round, one DAMNED changes to the most prevalent personality.`;
  }
  if (item.id === "p91") {
    return `Scoring CRITICAL increases your CRITICAL range by +1, up to +4. Missing CRITICAL resets it. ELITE adds +${eliteLevels(item) * 5} CRITICAL damage. Current range bonus: +${ascendingCritWindowBonus()}.`;
  }
  if (item.id === "p104") {
    const amount = item.stack || 1;
    return `At end of round, STUBBORN DAMNED gain +${amount} additional MEMORY and +${amount} BOUNTY. Revealed DAMNED become STUBBORN.`;
  }
  if (item.id === "p105") {
    const chance = Math.round(stubbornArtifactChance(item) * 100);
    return `Using an ARTIFACT on a DAMNED has a ${chance}% chance to make them STUBBORN. At end of round, BOSSES take ${flatDamageValue(item, 5)} damage per STUBBORN DAMNED.`;
  }
  if (item.id === "p106") {
    return `At end of round, DAMNED with the most prevalent personality take ${flatDamageValue(item, 5)} damage for every DAMNED with that personality.`;
  }
  if (item.id === "p107") {
    const eliteDamage = eliteLevels(item) * 5;
    return `STUBBORN DAMNED guesses can only be up to 2 away from their previous guess. At start of round, one random DAMNED becomes STUBBORN${eliteDamage ? ` and every STUBBORN DAMNED takes ${eliteDamage} damage` : ""}.`;
  }
  if (item.id === "p108") {
    return `When a STUBBORN DAMNED dies, all BOSSES take ${flatDamageValue(item, 30)} damage.`;
  }
  if (item.id === "p92") return `At reveal, ${devSealChanceText(item)} chance to change the TARGET to your guess.`;
  if (item.id === "p93") return `At reveal, ${devSealChanceText(item)} chance to double every DAMNED BOUNTY.`;
  if (item.id === "p94") return `At reveal, ${devSealChanceText(item)} chance to give 5 random temporary ARTIFACTS usable only this round.`;
  if (item.id === "p95") return `At reveal, ${devSealChanceText(item)} chance for revealed DAMNED to lose 50% current HEALTH.`;
  if (item.id === "p96") {
    return `At reveal, ${devSealChanceText(item)} chance to make every personality STUBBORN. DAMNED already STUBBORN take 25% extra damage this round.`;
  }
  if (item.id === "p97") {
    return `At reveal, ${devSealChanceText(item)} chance for all DAMNED to gain up to the highest living non-boss DAMNED MEMORY and take damage equal to their original MEMORY.`;
  }
  if (item.id === "p110") {
    return `At reveal, ${devSealChanceText(item)} chance to remove all MEMORY and BOUNTY from all DAMNED, then each DAMNED takes damage equal to the total removed MEMORY and BOUNTY.`;
  }
  return item.description;
}

function markPassiveTriggered(id) {
  if (!state.roundState || !passiveStack(id)) return;
  if (directPassiveStack(id)) {
    state.roundState.triggeredPassiveIds.add(id);
    recordSealTrigger(id);
  }
  if (mimicContributionFor(id)) {
    state.roundState.triggeredPassiveIds.add("p28");
    recordSealTrigger("p28");
  }
}

function passiveLimit() {
  return Math.min(MAX_PASSIVE_LIMIT, BASE_PASSIVE_LIMIT + Math.floor(state.bossKills / 2));
}

function rerollCost() {
  return state.rerollBaseCost;
}

function currentRerollCost() {
  return rerollCost();
}

function bossAbilityNullified(bot) {
  return Boolean(bot?.isBoss && state.roundState?.bossAbilityNullifiedBotIds?.has(bot.id));
}

function botHasPassive(bot, key) {
  if (bossAbilityNullified(bot) && bot?.passiveKeys?.includes(key)) return false;
  return Boolean(bot.passiveKeys?.includes(key) || bot.buffPassiveKey === key);
}

function botPassiveKeyName(key) {
  return BOSS_PASSIVES[key]?.name || PYROS_GIFT_PASSIVES[key]?.name || key;
}

function botPassiveKeyDescription(key) {
  return BOSS_PASSIVES[key] ? bossPassiveEffectDescription(key) : PYROS_GIFT_PASSIVES[key]?.description || "";
}

function hasBossPassive(key) {
  return state.bots.some((bot) => bot.hp > 0 && botHasPassive(bot, key));
}

function bossPassiveDamage(key) {
  const passive = BOSS_PASSIVES[key];
  if (!passive) return 0;
  return Math.max(0, Math.ceil(passive.baseDamage || 0));
}

function bossPassiveEffectDescription(key) {
  const damage = bossPassiveDamage(key);
  if (!BOSS_PASSIVES[key]) return "";
  if (key === "sinStealing") return "At the start of each round, removes 20% of your total SIN plus 5 more SIN. The stolen SIN vanishes.";
  if (key === "soullessness") return `When this BOSS is defeated, it does not heal you and instead deals ${damage} damage.`;
  if (key === "soulStealing") return "While this BOSS ability is alive, you cannot recover HEALTH.";
  if (key === "deathRoll") return "If the TARGET is a multiple of 3, you take 3 damage. If it is a multiple of 5, you take 5 damage. If it is a multiple of 7, you take 7 damage.";
  if (key === "rerollToll") return `Every time you reroll Devil's Offerings, you take ${damage} damage.`;
  if (key === "offeringToll") return `Every time you buy an ARTIFACT or SEAL, you take ${damage} damage.`;
  if (key === "avenging") return `If 2 or more DAMNED are eliminated in the same round, you take ${damage} damage.`;
  if (key === "corruption") return "When you submit a guess, 33% chance to shift it by +10 or -10.";
  if (key === "punishment") return `If you eliminate no DAMNED in a round, you take ${damage} damage.`;
  if (key === "lifeSteal") return "Whenever you take damage, this BOSS heals that amount as percent max HEALTH.";
  return "";
}

function activeBotsWithBossPassive(key) {
  return activeBots().filter((bot) => botHasPassive(bot, key));
}

function applyBossPassivePlayerDamage(key, reasonForBot) {
  const damage = bossPassiveDamage(key);
  if (damage <= 0) return 0;
  let total = 0;
  activeBotsWithBossPassive(key).forEach((bot) => {
    total += damagePlayer(damage, reasonForBot(bot, damage), true, true, BOSS_PASSIVES[key]?.name);
  });
  return total;
}

function applyBossSinStealing() {
  activeBotsWithBossPassive("sinStealing").forEach((bot) => {
    const currentSin = Math.max(0, Math.ceil(state.player.credits || 0));
    if (currentSin <= 0) return;
    const amount = Math.ceil(currentSin * 0.2) + 5;
    loseCredits(amount, `${bot.name}'s ${BOSS_PASSIVES.sinStealing.name}`);
  });
}

function deathRollDamageForTarget(target) {
  const value = Math.ceil(target);
  if (!Number.isFinite(value)) return 0;
  let damage = 0;
  if (value % 3 === 0) damage += 3;
  if (value % 5 === 0) damage += 5;
  if (value % 7 === 0) damage += 7;
  return damage;
}

function deathRollMultiplesForTarget(target) {
  const value = Math.ceil(target);
  if (!Number.isFinite(value)) return [];
  return [3, 5, 7].filter((divisor) => value % divisor === 0);
}

function applyDeathRollDamage() {
  const round = state.roundState;
  const damage = deathRollDamageForTarget(round?.target);
  if (damage <= 0) return;
  const multiples = deathRollMultiplesForTarget(round.target).join(", ");
  activeBotsWithBossPassive("deathRoll").forEach((bot) => {
    damagePlayer(
      damage,
      `${bot.name}'s ${BOSS_PASSIVES.deathRoll.name} dealt ${damage} damage because TARGET ${formatNumber(round.target)} is a multiple of ${multiples}.`,
      true,
      true,
      BOSS_PASSIVES.deathRoll.name
    );
  });
}

function applyRerollTollDamage() {
  applyBossPassivePlayerDamage(
    "rerollToll",
    (bot, damage) => `${bot.name}'s ${BOSS_PASSIVES.rerollToll.name} dealt ${damage} damage because you rerolled Devil's Offerings.`
  );
}

function applyOfferingTollDamage(item) {
  applyBossPassivePlayerDamage(
    "offeringToll",
    (bot, damage) => `${bot.name}'s ${BOSS_PASSIVES.offeringToll.name} dealt ${damage} damage because you bought ${item.name}.`
  );
}

function applyRoundEndBossPassiveDamage() {
  const eliminations = state.roundState?.eliminationsThisRound || 0;
  if (eliminations >= 2) {
    applyBossPassivePlayerDamage(
      "avenging",
      (bot, damage) => `${bot.name}'s ${BOSS_PASSIVES.avenging.name} dealt ${damage} damage because ${eliminations} DAMNED were eliminated this round.`
    );
  }
  if (eliminations === 0) {
    applyBossPassivePlayerDamage(
      "punishment",
      (bot, damage) => `${bot.name}'s ${BOSS_PASSIVES.punishment.name} dealt ${damage} damage because no DAMNED were eliminated this round.`
    );
  }
}

function applyCorruptionGuessMutation(guess) {
  let mutated = Math.ceil(guess);
  activeBotsWithBossPassive("corruption").forEach((bot) => {
    if (Math.random() >= 0.33) return;
    const before = mutated;
    const shift = Math.random() < 0.5 ? -10 : 10;
    mutated = Math.ceil(clamp(mutated + shift, 0, playerGuessLimit()));
    state.roundState?.roundEvents.push(`${bot.name}'s ${BOSS_PASSIVES.corruption.name} shifted your guess from ${before} to ${mutated}.`);
  });
  return mutated;
}

function soulStealingBlocker() {
  return activeBotsWithBossPassive("soulStealing")[0] || null;
}

function applyBossLifeStealHealing(playerDamage) {
  const damage = Math.max(0, Math.ceil(playerDamage));
  if (damage <= 0) return;
  activeBotsWithBossPassive("lifeSteal").forEach((bot) => {
    const heal = Math.ceil((bot.maxHp || 0) * (damage / 100));
    if (heal <= 0) return;
    const healed = healBot(bot, heal, null, BOSS_PASSIVES.lifeSteal.name);
    if (healed > 0) addRoundEvent(`${bot.name}'s ${BOSS_PASSIVES.lifeSteal.name} converted ${damage} player damage into ${healed} healing.`);
  });
}

function botHasUniquePower(bot, key) {
  if (bossAbilityNullified(bot)) return false;
  return Boolean(bot && (bot.uniqueKey === key || bot.copiedUniqueKey === key));
}

function activeBossesWithPower(key, excludedIds = new Set()) {
  return state.bots.filter(
    (bot) => bot.isBoss && botHasUniquePower(bot, key) && !excludedIds.has(bot.id) && bot.hp > 0 && !bot.eliminated
  );
}

function aliveUniqueBoss(key, excludedIds = new Set()) {
  return activeBossesWithPower(key, excludedIds).length > 0;
}

function aliveFinalBoss(key) {
  return state.bots.some((bot) => bot.finalKey === key && bot.hp > 0 && !bot.eliminated);
}

function shopDisabledBySatan() {
  return state.finalBossPhase && aliveFinalBoss("satan");
}

function activePetrosPavlosBosses() {
  return state.bots.filter(
    (bot) => bot.isBoss && ["petros", "pavlos"].includes(bot.uniqueKey) && !bossAbilityNullified(bot) && bot.hp > 0 && !bot.eliminated
  );
}

function petrosPavlosRoundModifier() {
  const twins = activePetrosPavlosBosses();
  if (!twins.length) return null;
  const startRound = twins.reduce((earliest, bot) => Math.min(earliest, bot.modifierCycleStartRound || state.round), state.round);
  const cycleIndex = Math.max(0, state.round - startRound) % PETROS_PAVLOS_MODIFIERS.length;
  return PETROS_PAVLOS_MODIFIERS[cycleIndex];
}

function currentTargetModifier() {
  if (state.finalBossPhase) return FINAL_BOSS_TARGET_MODIFIER;
  const twinModifier = petrosPavlosRoundModifier();
  if (twinModifier !== null) return twinModifier;
  const modifierBosses = state.bots
    .filter(
      (bot) =>
        bot.isBoss &&
        bot.hp > 0 &&
        !bot.eliminated &&
        !bossAbilityNullified(bot) &&
        bot.modifierOverride !== null &&
        bot.modifierOverride !== undefined
    )
    .sort((left, right) => right.bossOrder - left.bossOrder);
  return modifierBosses.length ? modifierBosses[0].modifierOverride : BASE_TARGET_MODIFIER;
}

function playerGuessLimit() {
  return 100;
}

function shopTax(item = null) {
  if (!aliveUniqueBoss("zilon") || !item) return 0;
  return item.type === "passive" ? 6 : 3;
}

function shopPrice(item) {
  const duplicateMultiplier = item.type === "passive" && !isSelfStackingSeal(item.id) ? directPassiveStack(item.id) + 1 : 1;
  const basePrice = item.price * duplicateMultiplier;
  const taxedPrice = basePrice + shopTax({ ...item, price: basePrice });
  const discountedPrice = item.type === "passive" ? Math.max(0, taxedPrice - passiveShopDiscount()) : taxedPrice;
  return Math.ceil(discountedPrice * sinPricePressureMultiplier());
}

function botPassiveSummary(bot) {
  if (!bot) return "";
  const names = [];
  if (bot.isBoss && bot.uniqueKey) names.push(`${UNIQUE_BOSS_SPECS[bot.uniqueKey].name}'s Seal`);
  if (bot.isBoss && bot.copiedUniqueKey) names.push(`Borrowed ${UNIQUE_BOSS_SPECS[bot.copiedUniqueKey].name}'s Seal`);
  bot.passiveKeys?.forEach((key) => names.push(botPassiveKeyName(key)));
  if (bot.buffPassiveKey) names.push(`Pyros Gift: ${botPassiveKeyName(bot.buffPassiveKey)}`);
  return names.join(" + ") || "No Seal";
}

function botPassiveDescription(bot) {
  if (!bot) return "";
  const descriptions = [];
  if (bot.isBoss && bot.uniqueKey) descriptions.push(...UNIQUE_BOSS_SPECS[bot.uniqueKey].descriptions);
  if (bot.isBoss && bot.copiedUniqueKey) {
    const copiedSpec = UNIQUE_BOSS_SPECS[bot.copiedUniqueKey];
    const borrowedText = copiedSpec.descriptions
      .join(" ")
      .replaceAll(copiedSpec.name, bot.name)
      .replaceAll(`${copiedSpec.name}'s`, `${bot.name}'s`);
    descriptions.push(`Borrowed power: ${borrowedText}`);
  }
  bot.passiveKeys?.forEach((key) => descriptions.push(botPassiveKeyDescription(key)));
  if (bot.buffPassiveKey) descriptions.push(`Pyros gift: ${botPassiveKeyDescription(bot.buffPassiveKey)}`);
  return descriptions.join(" ");
}

function bossPassiveSummary(bot) {
  return bot?.isBoss ? botPassiveSummary(bot) : "";
}

function bossPassiveDescription(bot) {
  return bot?.isBoss ? botPassiveDescription(bot) : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function normalizeGameText(value) {
  return String(value)
    .replace(/\bnon-bosses\b/gi, "non-boss DAMNED")
    .replace(/\bnon-boss\b/gi, "non-boss")
    .replace(/\bsinners\b/gi, "DAMNED")
    .replace(/\bsinner\b/gi, "DAMNED")
    .replace(/\bbots\b/gi, "DAMNED")
    .replace(/\bbot\b/gi, "DAMNED")
    .replace(/\bbosses\b/gi, (match, offset, text) => (text[offset - 1] === "-" ? "bosses" : "BOSSES"))
    .replace(/\bboss\b/gi, (match, offset, text) => (text[offset - 1] === "-" ? "boss" : "BOSS"))
    .replace(/\bartifacts\b/gi, "ARTIFACTS")
    .replace(/\bartifact\b/gi, "ARTIFACT")
    .replace(/\bseals\b/gi, "SEALS")
    .replace(/\bseal\b/gi, "SEAL");
}

function htmlWithLineBreaks(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function descriptionHtml(value) {
  const protectedPhrases = [];
  const plainTargetText = normalizeGameText(value);
  const protectedText = [
    /\bpick a target\b/gi,
    /\beach target\b/gi,
    /\bchoose a target\b/gi,
    /\bneeds a target\b/gi,
    /\bheal target\b/gi,
    /\bdamage target\b/gi
  ].reduce((text, pattern) => text.replace(pattern, (match) => {
    const token = `__PLAIN_TARGET_${protectedPhrases.length}__`;
    protectedPhrases.push(match);
    return token;
  }), plainTargetText);
  let html = htmlWithLineBreaks(protectedText).replace(
    /\b(SIN|DAMNED|ARTIFACTS?|SEALS?|BOSSES|BOSS|ELITE|CRITICAL|TARGET|KOS?|KO|HEALTH|MEMORY|BOUNTY)\b/gi,
    (keyword, _whole, offset, fullText) => {
      if (/^boss(?:es)?$/i.test(keyword) && fullText[offset - 1] === "-") return keyword.toLowerCase();
      return `<span class="tooltip-keyword">${keyword.toUpperCase()}</span>`;
    }
  );
  protectedPhrases.forEach((phrase, index) => {
    html = html.replace(`__PLAIN_TARGET_${index}__`, escapeHtml(phrase));
  });
  return html;
}

function splitEliteDescription(value) {
  const text = String(value || "").trim();
  const eliteMatch = text.match(/\s+(ELITE(?:\s+levels)?:?[\s\S]*)$/i);
  if (!eliteMatch) return { main: text, elite: "" };
  return {
    main: text.slice(0, eliteMatch.index).trim(),
    elite: eliteMatch[1].trim()
  };
}

function renderSealTooltipHtml(item, displayName, description, disabledNotice, sale) {
  const contribution = sealContributionSummary(item);
  const runDetails = sealContributionDetails(item);
  const splitDescription = splitEliteDescription(description);
  const fallbackElite = splitEliteDescription(ITEMS[item?.id]?.description || "").elite;
  const mainDescription = splitDescription.main || description;
  const eliteDescription = splitDescription.elite || fallbackElite;
  const bodyText = `${disabledNotice || ""}${mainDescription}`;
  return `
    <div class="tooltip-heading">
      <div class="tooltip-title">${escapeHtml(displayName)}</div>
      <div class="tooltip-shift-hint">press shift for more</div>
    </div>
    <div class="tooltip-body">${descriptionHtml(bodyText)}</div>
    ${eliteDescription ? `<div class="tooltip-elite-line">${descriptionHtml(eliteDescription)}</div>` : ""}
    <div class="tooltip-stat-line">${descriptionHtml(runDetails)}</div>
    <div class="seal-tooltip-footer">
      <span>${contribution ? escapeHtml(contribution) : ""}</span>
      <span>Sell ${sale}${SIN_MARK}</span>
    </div>
  `;
}

function sealSigilPath(item) {
  const id = typeof item === "string" ? item : item?.id;
  const file = SEAL_SIGILS[id];
  return file ? `assets/seals/${file}` : "";
}

function renderSealSigil(item, extraClass = "") {
  const src = sealSigilPath(item);
  if (!src) return "";
  const id = typeof item === "string" ? item : item?.id;
  const className = [
    "seal-sigil",
    DEV_SEAL_IDS.has(id) ? "dev-seal-sigil" : "",
    SATAN_SEAL_IDS.has(id) ? "satan-seal-sigil" : "",
    extraClass
  ].filter(Boolean).join(" ");
  const name = typeof item === "string" ? ITEMS[item]?.name || "Seal" : item?.name || "Seal";
  return `<img class="${className}" src="${escapeAttr(src)}" alt="${escapeAttr(`${name} sigil`)}" loading="lazy" />`;
}

function passiveName(id, fallback = "Seal") {
  return ITEMS[id]?.name || fallback;
}

function artifactIconPath(item) {
  const id = typeof item === "string" ? item : item?.id;
  const file = ARTIFACT_ICONS[id];
  return file ? `assets/artifacts/${file}` : "";
}

function renderArtifactIcon(item, extraClass = "") {
  const src = artifactIconPath(item);
  if (!src) return "";
  const className = ["artifact-icon", extraClass].filter(Boolean).join(" ");
  const name = typeof item === "string" ? ITEMS[item]?.name || "Artifact" : item?.name || "Artifact";
  return `<img class="${className}" src="${escapeAttr(src)}" alt="${escapeAttr(`${name} icon`)}" loading="lazy" />`;
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return String(Math.ceil(value));
}

function formatModifier(value) {
  if (!Number.isFinite(value)) return "?";
  return Number.isInteger(value * 10)
    ? value.toFixed(1)
    : value.toFixed(3).replace(/0+$/u, "").replace(/\.$/u, "");
}

function guessClosenessColor(guess, target) {
  if (!Number.isFinite(guess) || !Number.isFinite(target)) return "";
  const distance = Math.abs(guess - target);
  if (distance >= 10) return "";
  const closeness = clamp(1 - distance / 10, 0, 1);
  const intensity = Math.pow(closeness, 2.35) * 0.78;
  const from = { r: 255, g: 255, b: 255 };
  const to = { r: 239, g: 111, b: 97 };
  const mix = (start, end) => Math.round(start + (end - start) * intensity);
  return `rgb(${mix(from.r, to.r)}, ${mix(from.g, to.g)}, ${mix(from.b, to.b)})`;
}

function guessClosenessAttrs(guess, target, isCritical) {
  if (isCritical) return { className: "", style: "" };
  const color = guessClosenessColor(guess, target);
  if (!color) return { className: "", style: "" };
  return {
    className: "guess-closeness-number",
    style: ` style="--guess-closeness-color: ${color}"`
  };
}

function itemCopy(id) {
  const uid = `${id}-${state.nextItemUid++}`;
  const copy = { ...ITEMS[id], uid, stack: ITEMS[id].type === "passive" ? 1 : undefined };
  if (id === "p39") copy.counter = 1;
  if (isSelfStackingSeal(id)) copy.selfDamage = 0;
  return copy;
}

function freeActiveCopy(id) {
  return { ...itemCopy(id), purchaseCost: 0, sellValueOverride: 0 };
}

function devTemporaryActiveCopy(id) {
  const copy = freeActiveCopy(id);
  copy.devTemporary = true;
  copy.sellValueOverride = 0;
  return copy;
}

function devSealChance(idOrItem) {
  const stack = typeof idOrItem === "string" ? simpleStackCount(idOrItem) : idOrItem?.stack || 0;
  if (!stack) return 0;
  return Math.min(0.8, 0.3 + Math.max(0, stack - 1) * 0.05);
}

function devSealEntryChance(entry) {
  if (!entry?.stack) return 0;
  return Math.min(0.8, 0.3 + Math.max(0, entry.stack - 1) * 0.05);
}

function isSelfStackingSeal(idOrItem) {
  const id = typeof idOrItem === "string" ? idOrItem : idOrItem?.id;
  return SELF_STACKING_SEAL_IDS.has(id);
}

function selfStackingSpec(idOrItem) {
  const id = typeof idOrItem === "string" ? idOrItem : idOrItem?.id;
  return SELF_STACKING_SEAL_SPECS[id] || null;
}

function selfStackingCurrentDamage(item) {
  return Math.max(0, Math.ceil(item?.selfDamage || 0));
}

function selfStackingCurrentDamageForId(id) {
  return orderedPassiveEffectEntries(id).reduce((sum, entry) => sum + selfStackingCurrentDamage(entry.item), 0);
}

function selfStackingSealDescription(item) {
  return `${item.description}\nCurrent damage: ${selfStackingCurrentDamage(item)}.`;
}

function selfStackingConditionCounts(round = state.roundState) {
  if (!round) return {};
  if (!round.selfStackingConditionCounts || typeof round.selfStackingConditionCounts !== "object") {
    round.selfStackingConditionCounts = {};
  }
  Object.values(SELF_STACKING_SEAL_SPECS).forEach((spec) => {
    if (!Number.isFinite(round.selfStackingConditionCounts[spec.key])) round.selfStackingConditionCounts[spec.key] = 0;
  });
  return round.selfStackingConditionCounts;
}

function selfStackingGameConditionCounts() {
  if (!state.selfStackingGameConditionCounts || typeof state.selfStackingGameConditionCounts !== "object") {
    state.selfStackingGameConditionCounts = {};
  }
  Object.values(SELF_STACKING_SEAL_SPECS).forEach((spec) => {
    if (!Number.isFinite(state.selfStackingGameConditionCounts[spec.key])) {
      state.selfStackingGameConditionCounts[spec.key] = 0;
    }
  });
  return state.selfStackingGameConditionCounts;
}

function recordSelfStackingCondition(idOrKey) {
  const spec = SELF_STACKING_SEAL_SPECS[idOrKey] || Object.values(SELF_STACKING_SEAL_SPECS).find((entry) => entry.key === idOrKey);
  if (!spec || !state.roundState) return;
  const roundCounts = selfStackingConditionCounts();
  roundCounts[spec.key] = (roundCounts[spec.key] || 0) + 1;
  const gameCounts = selfStackingGameConditionCounts();
  gameCounts[spec.key] = (gameCounts[spec.key] || 0) + 1;
}

function increaseSelfStackingSealDamage(entry) {
  const spec = selfStackingSpec(entry?.id);
  if (!spec || !entry?.item) return 0;
  entry.item.selfDamage = selfStackingCurrentDamage(entry.item) + spec.increment;
  markPassiveEntryTriggered(entry);
  return selfStackingCurrentDamage(entry.item);
}

function triggerSelfStackingSeal(id) {
  recordSelfStackingCondition(id);
  let totalDamage = 0;
  orderedPassiveEffectEntries(id).forEach((entry) => {
    totalDamage += increaseSelfStackingSealDamage(entry);
  });
  return totalDamage;
}

function applySelfStackingMemoryOverTen(bot, beforeMemory, afterMemory) {
  if (!bot || bot.isBoss || bot.eliminated || beforeMemory > 10 || afterMemory <= 10) return;
  const damage = triggerSelfStackingSeal("p99");
  if (damage <= 0) return;
  queueEndOfRoundBotDamage(
    bot,
    damage,
    `${ITEMS.p99.name} dealt ${damage} damage to ${bot.name} for exceeding 10 MEMORY.`,
    ITEMS.p99.name
  );
}

function applySelfStackingBountySumDamage() {
  const targets = activeBots();
  if (!targets.length) return;
  const bountySum = targets.reduce((sum, bot) => sum + botRegularBounty(bot), 0);
  if (bountySum <= 40) return;
  const damage = triggerSelfStackingSeal("p100");
  if (damage <= 0) return;
  damageBots(
    targets,
    damage,
    (bot, dealt) => `${ITEMS.p100.name} dealt ${dealt} damage to ${bot.name} because total BOUNTY was ${bountySum}.`,
    ITEMS.p100.name
  );
}

function queueSelfStackingPentakillDamage() {
  const damage = triggerSelfStackingSeal("p101");
  if (damage <= 0) return;
  state.pendingSelfStackingPentakillDamage = Math.max(0, Math.ceil(state.pendingSelfStackingPentakillDamage || 0)) + damage;
  state.roundState?.roundEvents.push(`${ITEMS.p101.name} queued ${damage} end-of-round damage.`);
}

function applyPendingSelfStackingPentakillDamage() {
  const damage = Math.max(0, Math.ceil(state.pendingSelfStackingPentakillDamage || 0));
  if (damage <= 0) return;
  state.pendingSelfStackingPentakillDamage = 0;
  const targets = activeBots();
  if (!targets.length) return;
  damageBots(
    targets,
    damage,
    (bot, dealt) => `${ITEMS.p101.name} dealt ${dealt} queued PENTAKILL damage to ${bot.name}.`,
    ITEMS.p101.name
  );
}

function applySelfStackingRevealedDeath(bot) {
  if (!bot?.revealedByPassive) return;
  const damage = triggerSelfStackingSeal("p102");
  if (damage <= 0) return;
  const targets = adjacentLivingBots(bot);
  if (!targets.length) return;
  queueEndOfRoundBotDamages(
    targets,
    damage,
    (target, queued) => `${ITEMS.p102.name} dealt ${queued} damage to ${target.name} from ${bot.name}'s revealed death.`,
    ITEMS.p102.name
  );
}

function applySelfStackingStubbornDeath(bot) {
  if (personalityType(bot) !== "Stubborn") return;
  const damage = triggerSelfStackingSeal("p109");
  if (damage <= 0) return;
  const targets = activeBots().filter((target) => personalityType(target) !== "Stubborn");
  if (!targets.length) return;
  queueEndOfRoundBotDamages(
    targets,
    damage,
    (target, queued) => `${ITEMS.p109.name} dealt ${queued} damage to ${target.name} from ${bot.name}'s STUBBORN death.`,
    ITEMS.p109.name
  );
}

function recordArtifactUseForSelfStacking() {
  const before = Math.max(0, Math.floor(state.totalArtifactsUsed || 0));
  const after = before + 1;
  state.totalArtifactsUsed = after;
  const thresholds = Math.floor(after / 20) - Math.floor(before / 20);
  for (let count = 0; count < thresholds; count += 1) {
    triggerSelfStackingSeal("p103");
  }
  const damage = selfStackingCurrentDamageForId("p103");
  if (damage <= 0) return;
  const targets = activeBots();
  if (!targets.length) return;
  queueEndOfRoundBotDamages(
    targets,
    damage,
    (bot, queued) => `${ITEMS.p103.name} dealt ${queued} damage to ${bot.name} from ARTIFACT use.`,
    ITEMS.p103.name
  );
}

function devSealChanceText(idOrItem) {
  return `${Math.round(devSealChance(idOrItem) * 100)}%`;
}

function activeSellValue(item) {
  if (!item) return 0;
  if (Number.isFinite(item.sellValueOverride)) return Math.max(0, Math.ceil(item.sellValueOverride));
  return Math.floor((item.price || 0) / 2);
}

function addLog(message) {
  state.log.unshift(normalizeGameText(message));
  state.log = state.log.slice(0, 5);
}

function showInvalidGuessPopup() {
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert("Invalid");
  } else {
    addLog("Invalid");
  }
}

function addRoundEvent(message) {
  if (state.roundState) state.roundState.roundEvents.push(normalizeGameText(message));
}

function sourceLabelFromReason(reason, fallback) {
  const text = String(reason || "").trim();
  if (!text) return fallback || "";
  const knownSources = [
    ["FINAL CRITICAL", "Final CRITICAL"],
    ["CRITICAL", "CRITICAL"],
    ["Sacrificial Dagger", "Sacrificial Dagger"],
    ["Engraved Skull", "Engraved Skull"],
    ["Black Candle", "Black Candle"],
    ["Ceremonial Altar", "Ceremonial Altar"],
    ["Demonic Idol", "Demonic Idol"],
    ["Goat Head", "Goat Head"],
    ["Inverted Cross", "Inverted Cross"],
    ["Funeral Coin", "Funeral Coin"],
    ["Vial of Blood", "Vial of Blood"],
    ["Dark Talisman", "Dark Talisman"],
    ["Corrupted Crystal", "Corrupted Crystal"],
    ["Voodoo Doll", "Voodoo Doll"],
    ["Cursed Chalice", "Cursed Chalice"],
    ["Satanic Bible", "Satanic Bible"],
    ["Mummified Lamb", "Mummified Lamb"],
    ["Spirit Board", "Spirit Board"],
    ["The Magical Sword of Solomon", "The Magical Sword of Solomon"],
    ["Demon Bowl", "Demon Bowl"],
    ["The Black-Hilted Knife", "The Black-Hilted Knife"],
    ["Target damage", "Target difference"],
    ["target damage", "Target difference"],
    ["Seal of Leraje", "Seal of Leraje"],
    ["Seal of Paimon", "Seal of Paimon"],
    ["Seal of Haagenti", "Seal of Haagenti"],
    ["Seal of Amdusias", "Seal of Amdusias"],
    ["Seal of Zagan", "Seal of Zagan"],
    ["Seal of Furfur", "Seal of Furfur"],
    ["Seal of Furfur", "Seal of Furfur"],
    ["Seal of Andrealphus", "Seal of Andrealphus"],
    ["The Brazen Vessel of Solomon", "The Brazen Vessel of Solomon"],
    ["Seal of Murmur", "Seal of Murmur"],
    ["Seal of Foras", "Seal of Foras"],
    ["Seal of Marchosias", "Seal of Marchosias"],
    ["Seal of Gremory", "Seal of Gremory"],
    ["Seal of Forneus", "Seal of Forneus"],
    ["Seal of Cimejes", "Seal of Cimejes"],
    ["Seal of Asmoday", "Seal of Asmoday"],
    ["Seal of Malphas", "Seal of Malphas"],
    ["Seal of Astaroth", "Seal of Astaroth"],
    ["Seal of Purson", "Seal of Purson"],
    ["Seal of Focalor", "Seal of Focalor"],
    ["Seal of Bifrons", "Seal of Bifrons"],
    ["Seal of Stolas", "Seal of Stolas"],
    ["Grandier's Pact", "Grandier's Pact"],
    ["Seal of Haures", "Seal of Haures"],
    ["Seal of Vassago", "Seal of Vassago"],
    ["Amulet of Pazuzu", "Amulet of Pazuzu"],
    ["Seal of Alloces", "Seal of Alloces"],
    ["Seal of Shax", "Seal of Shax"],
    ["Seal of Belial", "Seal of Belial"],
    ["Seal of Agares", "Seal of Agares"],
    ["Seal of Phenex", "Seal of Phenex"],
    ["Seal of Marax", "Seal of Marax"],
    ["Seal of Decarabia", "Seal of Decarabia"],
    ["Seal of Belial", "Seal of Belial"],
    ["Seal of Dantalion", "Seal of Dantalion"],
    ["Seal of Sabnock", "Seal of Sabnock"],
    ["Seal of Bune", "Seal of Bune"],
    ["Seal of Sitri", "Seal of Sitri"],
    ["Seal of Halphas", "Seal of Halphas"],
    ["Seal of Balam", "Seal of Balam"],
    ["Seal of Marbas", "Seal of Marbas"],
    ["Seal of Buer", "Seal of Buer"],
    ["Seal of Bathin", "Seal of Bathin"],
    ["Seal of Botis", "Seal of Botis"],
    ["Seal of Gusion", "Seal of Gusion"],
    ["Seal of Raum", "Seal of Raum"],
    ["Seal of Ronove", "Seal of Ronove"],
    ["Seal of Andromalius", "Seal of Andromalius"],
    ["Seal of Botis", "Seal of Botis"],
    ["Seal of Gaap", "Seal of Gaap"],
    ["Seal of Vepar", "Seal of Vepar"],
    ["Seal of Beleth", "Seal of Beleth"],
    ["Seal of Vual", "Seal of Vual"],
    ["Seal of Vine", "Seal of Vine"],
    ["Seal of Naberius", "Seal of Naberius"],
    ["Seal of Aim", "Seal of Aim"],
    ["Seal of Caim", "Seal of Caim"],
    ["Seal of Vapula", "Seal of Vapula"],
    ["Seal of Eligos", "Seal of Eligos"],
    ["Seal of Amy", "Seal of Amy"],
    ["Seal of Ipos", "Seal of Ipos"],
    ["Seal of Zepar", "Seal of Zepar"],
    ["Seal of Sallos", "Seal of Sallos"],
    ["Seal of Furcas", "Seal of Furcas"],
    ["Seal of the White Horse", "Seal of the White Horse"],
    ["Seal of the Red Horse", "Seal of the Red Horse"],
    ["Seal of the Black Horse", "Seal of the Black Horse"],
    ["Seal of the Pale Horse", "Seal of the Pale Horse"],
    ["Seal of the Souls of Martyrs", "Seal of the Souls of Martyrs"],
    ["Seal of Creation Uncreated", "Seal of Creation Uncreated"],
    ["Seal of Silence in Heaven", "Seal of Silence in Heaven"],
    ["Seal of Dantre", "Seal of Dantre"],
    ["Seal of Zilon", "Seal of Zilon"],
    ["Seal of Serafeim", "Seal of Serafeim"],
    ["Seal of Pyros", "Seal of Pyros"],
    ["Seal of Padma", "Seal of Padma"],
    ["Seal of Threon", "Seal of Threon"],
    ["Seal of Petros-Pavlos", "Seal of Petros-Pavlos"],
    ["Seal of Bathin", "Seal of Bathin"],
    ["The White-Hilted Knife", "The White-Hilted Knife"],
    ["The Philosopher's Stone", "The Philosopher's Stone"],
    ["The Necklace of Harmonia", "The Necklace of Harmonia"],
    ["Dantre", "Dantre"],
    ["Seal of Botis", "Seal of Botis"]
  ];
  const match = knownSources.find(([needle]) => text.includes(needle));
  if (match) return match[1];
  return (
    text
      .replace(/\s+dealt\s+\d+.*$/i, "")
      .replace(/\s+took\s+\d+.*$/i, "")
      .replace(/\s+healed\s+.*$/i, "")
      .replace(/\s+restored\s+.*$/i, "")
      .replace(/[.!]$/g, "")
      .trim() || fallback || "Unknown"
  );
}

function mergeSourceEntries(sources) {
  const merged = new Map();
  (sources || []).forEach((entry) => {
    const amount = Math.max(0, Math.ceil(entry.amount || 0));
    if (amount <= 0) return;
    const source = entry.source || "Unknown";
    const kind = entry.kind || "";
    const key = `${kind}\u0000${source}`;
    const previous = merged.get(key) || { source, kind, amount: 0 };
    previous.amount += amount;
    merged.set(key, previous);
  });
  return Array.from(merged.values());
}

function mergeSignedSourceEntries(sources) {
  const merged = new Map();
  (sources || []).forEach((entry) => {
    const raw = Number(entry.amount || 0);
    if (!Number.isFinite(raw) || raw === 0) return;
    const amount = raw > 0 ? Math.ceil(raw) : -Math.ceil(Math.abs(raw));
    const source = entry.source || "Unknown";
    merged.set(source, (merged.get(source) || 0) + amount);
  });
  return Array.from(merged, ([source, amount]) => ({ source, amount })).filter((entry) => entry.amount !== 0);
}

function sourceTooltip(sources, kind = "damage") {
  if (kind === "signed-credits") {
    return mergeSignedSourceEntries(sources)
      .map((entry) => `${entry.amount > 0 ? "+" : "-"}${Math.abs(entry.amount)} SIN from ${entry.source}`)
      .join("\n");
  }
  if (kind === "damage") {
    const damageEntries = mergeSourceEntries((sources || []).filter((entry) => !entry.kind || entry.kind === "damage"));
    const flatBonusEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "flat-bonus"));
    const multiplierBonusEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "multiplier-bonus"));
    const bonusEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "bonus"));
    const savedEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "saved"));
    return [
      ...damageEntries.map((entry) => `-${entry.amount} health from ${entry.source}`),
      ...flatBonusEntries.map((entry) => `+${entry.amount} flat damage from ${entry.source}`),
      ...multiplierBonusEntries.map((entry) => `+${entry.amount} multiplied damage from ${entry.source}`),
      ...bonusEntries.map((entry) => `+${entry.amount} bonus damage from ${entry.source}`),
      ...savedEntries.map((entry) => `+${entry.amount} health saved from ${entry.source}`)
    ].join("\n");
  }
  const sign = kind === "damage" ? "-" : "+";
  const unit = kind === "credits" ? "SIN" : kind === "memory" ? "memory" : "health";
  return mergeSourceEntries(sources)
    .map((entry) => `${sign}${entry.amount} ${unit} from ${entry.source}`)
    .join("\n");
}

function sealIdFromStatSource(source) {
  const sourceText = String(source || "").trim();
  if (!sourceText) return "";
  return (
    PASSIVE_IDS.find((id) => {
      const name = ITEMS[id]?.name;
      return name && (sourceText === name || sourceText.startsWith(`${name} `));
    }) || ""
  );
}

function sealStatsFor(id) {
  if (!id) return null;
  state.sealStats = state.sealStats || {};
  const stats = state.sealStats[id] || {
    damage: 0,
    healing: 0,
    credits: 0,
    saved: 0,
    memory: 0,
    bounty: 0,
    bountyRemoved: 0,
    triggers: 0
  };
  state.sealStats[id] = stats;
  return stats;
}

function recordSealStat(id, kind, amount) {
  const value = Math.max(0, Math.ceil(amount));
  if (!PASSIVE_IDS.includes(id) || value <= 0) return;
  const stats = sealStatsFor(id);
  if (!stats) return;
  stats[kind] = (stats[kind] || 0) + value;
  if (kind === "damage") recordRunSealDamage(id, value);
}

function recordSealTrigger(id) {
  if (!PASSIVE_IDS.includes(id)) return;
  const stats = sealStatsFor(id);
  if (!stats) return;
  stats.triggers = (stats.triggers || 0) + 1;
}

function recordSealStatFromSource(kind, amount, source) {
  const id = sealIdFromStatSource(source);
  recordSealStat(id, kind, amount);
}

function sealContributionParts(stats, { includeTriggers = false } = {}) {
  const parts = [];
  if (!stats) return parts;
  if (stats.damage > 0) parts.push(`${stats.damage} damage dealt`);
  if (stats.healing > 0) parts.push(`${stats.healing} healing done`);
  if (stats.saved > 0) parts.push(`${stats.saved} damage negated`);
  if (stats.credits > 0) parts.push(`${stats.credits} SIN gained`);
  if (stats.memory > 0) parts.push(`${stats.memory} MEMORY added`);
  if (stats.bounty > 0) parts.push(`${stats.bounty} BOUNTY added`);
  if (stats.bountyRemoved > 0) parts.push(`${stats.bountyRemoved} BOUNTY removed`);
  if (includeTriggers && stats.triggers > 0) parts.push(`${stats.triggers} trigger${stats.triggers === 1 ? "" : "s"}`);
  return parts;
}

function sealContributionSummary(item) {
  const stats = state.sealStats?.[item?.id];
  if (!stats) return "";
  const parts = sealContributionParts(stats);
  if (!parts.length && stats.triggers > 0) parts.push(`${stats.triggers} trigger${stats.triggers === 1 ? "" : "s"}`);
  return parts.length ? `Total: ${parts.join(" / ")}` : "";
}

function sealContributionDetails(item) {
  const stats = state.sealStats?.[item?.id];
  const parts = sealContributionParts(stats, { includeTriggers: true });
  if (item?.id === "p111" && item.lastSatanDivisor && item.lastSatanMaxDivisor) {
    parts.push(`last divisor ${item.lastSatanDivisor}`);
    parts.push(`last Satan damage ${item.lastSatanDamage || 0}`);
  }
  if (!parts.length) return "This run:\nNo tracked effect yet.";
  return `This run:\n${parts.map((part) => `- ${part}`).join("\n")}`;
}

function recordPlayerDamageSource(amount, source, kind = "") {
  const damage = Math.max(0, Math.ceil(amount));
  if (damage <= 0 || !source) return;
  state.playerDamageSources = state.playerDamageSources || [];
  state.playerDamageSources.push({ amount: damage, source, kind });
  if (kind === "saved") recordSealStatFromSource("saved", damage, source);
}

function recordPlayerHealSource(amount, source) {
  const healed = Math.max(0, Math.ceil(amount));
  if (healed <= 0 || !source) return;
  state.playerHealSources = state.playerHealSources || [];
  state.playerHealSources.push({ amount: healed, source });
  recordSealStatFromSource("healing", healed, source);
}

function recordPlayerCreditSource(amount, source) {
  const credits = Math.max(0, Math.ceil(amount));
  if (credits <= 0 || !source) return;
  state.playerCreditSources = state.playerCreditSources || [];
  state.playerCreditSources.push({ amount: credits, source });
  recordSealStatFromSource("credits", credits, source);
}

function recordBotSinSource(bot, amount, source) {
  const raw = Number(amount || 0);
  if (!bot || !Number.isFinite(raw) || raw === 0 || !source) return;
  const sin = raw > 0 ? Math.ceil(raw) : -Math.ceil(Math.abs(raw));
  bot.sinSources = bot.sinSources || [];
  bot.sinSources.push({ amount: sin, source });
  if (sin > 0) recordSealStatFromSource("bounty", sin, source);
  if (sin < 0) recordSealStatFromSource("bountyRemoved", Math.abs(sin), source);
}

function recordBotMemorySource(bot, amount, source) {
  const memory = Math.max(0, Math.ceil(amount));
  if (!bot || memory <= 0 || !sealIdFromStatSource(source)) return;
  bot.lastMemoryDelta = (bot.lastMemoryDelta || 0) + memory;
  bot.memorySources = bot.memorySources || [];
  bot.memorySources.push({ amount: memory, source });
  recordSealStatFromSource("memory", memory, source);
}

function clearBotMemoryBadges() {
  state.bots.forEach((bot) => {
    bot.lastMemoryDelta = 0;
    bot.memorySources = [];
  });
}

function recordBotDamageSource(bot, amount, source, kind = "") {
  const damage = Math.max(0, Math.ceil(amount));
  if (!bot || damage <= 0) return;
  recordRunDamage(damage);
  recordBotRoundDamage(bot, damage);
  if (!source) return;
  bot.damageSources = bot.damageSources || [];
  bot.damageSources.push({ amount: damage, source, kind });
  recordSealStatFromSource("damage", damage, source);
}

function recordBotRoundDamage(bot, amount) {
  const round = state.roundState;
  const damage = Math.max(0, Math.ceil(amount));
  if (!round || !bot || bot.eliminated || damage <= 0) return;
  const previous = round.botDamageTotals.get(bot.id) || 0;
  const next = previous + damage;
  round.botDamageTotals.set(bot.id, next);
  const maraxThreshold = Math.max(0, (bot.maxHp || 0) * 0.3);
  if (previous <= maraxThreshold && next > maraxThreshold) {
    applyHighDamageSinGain(bot);
  }
}

function applyHighDamageSinGain(bot) {
  const round = state.roundState;
  if (!round || !bot || bot.eliminated || round.highDamageSinBotIds.has(bot.id)) return;
  const entries = orderedPassiveEffectEntries("p51");
  if (!entries.length) return;
  round.highDamageSinBotIds.add(bot.id);
  entries.forEach((entry) => {
    const amount = passiveEntryScaledValue(entry, 4);
    if (amount <= 0) return;
    markPassiveEntryTriggered(entry);
    changeBotSin(bot, amount, `Seal of Marax gave ${bot.name} +${amount} SIN for taking more than 30% max-health damage.`, {
      triggerLossDamage: false
    });
  });
}

function recordBotHealSource(bot, amount, source) {
  const healed = Math.max(0, Math.ceil(amount));
  if (!bot || healed <= 0 || !source) return;
  bot.healSources = bot.healSources || [];
  bot.healSources.push({ amount: healed, source });
  recordSealStatFromSource("healing", healed, source);
}

function addPendingBotDamage(botDamages, botDamageSources, bot, amount, source, playerDealt = true) {
  if (!bot || bot.eliminated) return;
  const damageDetails = scaledBotDamageDetails(bot, amount, playerDealt);
  const damage = damageDetails.damage;
  if (!bot || damage <= 0) return;
  botDamages.set(bot.id, (botDamages.get(bot.id) || 0) + damage);
  if (botDamageSources) {
    const sources = botDamageSources.get(bot.id) || [];
    sources.push(...scaledBotDamageSourceEntries(damageDetails, source || "Unknown"));
    botDamageSources.set(bot.id, sources);
  }
  applyPendingRedirectDamage(damageDetails.redirectEntries, botDamages, botDamageSources);
}

function queueEndOfRoundBotDamage(bot, amount, reason, source = undefined, playerDealt = true) {
  const damage = Math.max(0, Math.ceil(amount));
  const round = state.roundState;
  if (!bot || bot.eliminated || damage <= 0) return 0;
  if (!round || round.resolvingEndOfRoundPassives) {
    return damageBot(bot, damage, reason, source, playerDealt);
  }
  if (!Array.isArray(round.pendingEndOfRoundBotDamages)) round.pendingEndOfRoundBotDamages = [];
  round.pendingEndOfRoundBotDamages.push({
    botId: bot.id,
    amount: damage,
    source: source === null ? null : source || sourceLabelFromReason(reason, "Damage"),
    playerDealt
  });
  return damage;
}

function queueEndOfRoundBotDamages(bots, amount, reasonFactory, sourceFactory = undefined, playerDealt = true) {
  return (bots || []).reduce((total, bot) => {
    if (!bot || bot.eliminated) return total;
    const rawAmount = typeof amount === "function" ? amount(bot) : amount;
    const damage = Math.max(0, Math.ceil(rawAmount));
    if (damage <= 0) return total;
    const reason = typeof reasonFactory === "function" ? reasonFactory(bot, damage) : reasonFactory;
    const source =
      sourceFactory === null
        ? null
        : typeof sourceFactory === "function"
          ? sourceFactory(bot, damage)
          : sourceFactory;
    return total + queueEndOfRoundBotDamage(bot, damage, reason, source, playerDealt);
  }, 0);
}

function applyQueuedEndOfRoundBotDamage() {
  const round = state.roundState;
  const queued = Array.isArray(round?.pendingEndOfRoundBotDamages) ? round.pendingEndOfRoundBotDamages : [];
  if (!round || !queued.length) return 0;
  round.pendingEndOfRoundBotDamages = [];
  const botDamages = new Map();
  const botDamageSources = new Map();
  queued.forEach((entry) => {
    const bot = state.bots.find((candidate) => candidate.id === entry.botId);
    const damage = Math.max(0, Math.ceil(entry.amount || 0));
    if (!bot || bot.eliminated || bot.hp <= 0 || damage <= 0) return;
    addPendingBotDamage(botDamages, botDamageSources, bot, damage, entry.source || "Queued damage", entry.playerDealt !== false);
  });
  if (!botDamages.size) return 0;
  const total = Array.from(botDamages.values()).reduce((sum, damage) => sum + Math.max(0, Math.ceil(damage || 0)), 0);
  applyPendingBotDamageBatch(botDamages, botDamageSources, state.bots);
  return total;
}

function targetDifferenceDamageDetailsForBot(bot, amount, targetDiffEntries = orderedPassiveEffectEntries("p80")) {
  const baseDamage = Math.max(0, Math.ceil(amount));
  if (!bot || baseDamage <= 0) return { damage: 0, baseDamage: 0, modifierEntries: [] };
  let exactDamage = baseDamage;
  let roundedDamage = baseDamage;
  const modifierEntries = [];
  const applyMultiplier = (multiplier, source, entry) => {
    if (!Number.isFinite(multiplier) || multiplier <= 1 || roundedDamage <= 0) return;
    const before = roundedDamage;
    exactDamage *= multiplier;
    roundedDamage = Math.ceil(exactDamage);
    const extra = Math.max(0, roundedDamage - before);
    if (extra <= 0) return;
    modifierEntries.push({ amount: extra, source, kind: "multiplier-bonus" });
    markPassiveEntryTriggered(entry);
  };

  targetDiffEntries.forEach((entry) => {
    if (entry.id === "p80" && baseDamage > 10) {
      applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p80?.name || "Seal of Silence in Heaven", entry);
    }
  });

  return { damage: roundedDamage, baseDamage, modifierEntries };
}

function addPendingTargetDifferenceBotDamage(botDamages, botDamageSources, bot, amount, source, targetDiffEntries) {
  if (!bot || amount <= 0) return 0;
  const targetDetails = targetDifferenceDamageDetailsForBot(bot, amount, targetDiffEntries);
  if (targetDetails.damage <= 0) return 0;
  const scaledDetails = scaledBotDamageDetails(bot, targetDetails.damage, false);
  const damage = scaledDetails.damage;
  if (damage <= 0) return 0;
  botDamages.set(bot.id, (botDamages.get(bot.id) || 0) + damage);
  const sourceEntries = [
    { amount: targetDetails.baseDamage, source: source || "Target difference" },
    ...targetDetails.modifierEntries,
    ...scaledDetails.modifierEntries.map((entry) => ({ ...entry, kind: entry.kind || "bonus" }))
  ];
  if (botDamageSources) {
    const sources = botDamageSources.get(bot.id) || [];
    sources.push(...sourceEntries);
    botDamageSources.set(bot.id, sources);
  }
  applyPendingRedirectDamage(scaledDetails.redirectEntries, botDamages, botDamageSources);
  const round = state.roundState;
  if (round) {
    round.targetDifferenceDamageByBotId.set(bot.id, (round.targetDifferenceDamageByBotId.get(bot.id) || 0) + damage);
  }
  return damage;
}

function recordBotExcessDamage(bot, damage, hpBefore) {
  if (!state.roundState || !bot || bot.immortal) return;
  const excess = Math.max(0, Math.ceil(damage || 0) - Math.max(0, Math.ceil(hpBefore || 0)));
  if (excess <= 0) return;
  bot.excessDamage = (bot.excessDamage || 0) + excess;
}

function applyPendingBotDamageBatch(botDamages, botDamageSources, bots, { logZero = false } = {}) {
  const eliminated = [];
  maybeActivatePavlosProtection(botDamages);
  bots.forEach((bot) => {
    if (!bot || bot.eliminated || bot.hp <= 0) return;
    if (pavlosDamageBlocked(bot)) return;
    const damage = botDamages.get(bot.id) || 0;
    if (damage <= 0) {
      if (logZero) state.roundState.roundEvents.push(`${bot.name} took 0 damage.`);
      return;
    }
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    scaleSourceEntries(botDamageSources.get(bot.id), damage).forEach((entry) =>
      recordBotDamageSource(bot, entry.amount, entry.source, entry.kind)
    );
    if (bot.immortal) {
      bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
      state.roundState.roundEvents.push(`${bot.name} took ${damage} damage. Total: ${bot.damageTakenTotal}.`);
      return;
    }
    const hpBefore = bot.hp;
    bot.hp = Math.max(0, bot.hp - damage);
    state.roundState.roundEvents.push(`${bot.name} took ${damage} damage.`);
    if (bot.hp <= 0) {
      recordBotExcessDamage(bot, damage, hpBefore);
      eliminated.push(bot);
    }
  });
  if (eliminated.length) resolveEliminatedBots(eliminated);
  return eliminated;
}

function scaleSourceEntries(sources, total) {
  const target = Math.max(0, Math.ceil(total));
  const entries = mergeSourceEntries(sources);
  const rawTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
  if (target <= 0) return [];
  if (!entries.length || rawTotal <= 0) return [{ amount: target, source: "Damage" }];
  if (rawTotal === target) return entries;

  const scaled = entries.map((entry) => {
    const exact = (entry.amount * target) / rawTotal;
    return { ...entry, amount: Math.floor(exact), fraction: exact % 1 };
  });
  let remainder = target - scaled.reduce((sum, entry) => sum + entry.amount, 0);
  scaled
    .slice()
    .sort((left, right) => right.fraction - left.fraction)
    .forEach((entry) => {
      if (remainder <= 0) return;
      entry.amount += 1;
      remainder -= 1;
    });
  return scaled.filter((entry) => entry.amount > 0).map(({ source, kind, amount }) => ({ source, kind, amount }));
}

function highestMemorySinner() {
  return activeBots()
    .slice()
    .sort((left, right) => (right.memory?.length || 0) - (left.memory?.length || 0) || right.hp - left.hp || left.id - right.id)[0];
}

function applyPlayerDamageMemoryConversion(amount) {
  let damage = Math.max(0, Math.ceil(amount));
  const conversions = [];
  if (!state.roundState || damage <= 0) return { damage, conversions, avoidedTotal: 0 };

  orderedPassiveEffectEntries("p22").forEach((entry) => {
    if (damage <= 0) return;
    const avoided = Math.min(damage, Math.floor(damage * 0.2));
    if (avoided <= 0) return;
    damage -= avoided;
    conversions.push({
      entry,
      avoided,
      memory: doubledStackValue(entry, avoided)
    });
    markPassiveEntryTriggered(entry);
  });

  return {
    damage,
    conversions,
    avoidedTotal: conversions.reduce((sum, conversion) => sum + Math.max(0, Math.ceil(conversion.avoided || 0)), 0)
  };
}

function resolvePlayerDamageMemoryConversions(conversions = []) {
  conversions.forEach(({ avoided, memory }) => {
    const target = highestMemorySinner();
    if (!target || memory <= 0) {
      addRoundEvent(`Seal of Botis avoided ${avoided} damage, but no DAMNED could receive MEMORY.`);
      return;
    }
    const added = addBotMemory(target, memory, "", { source: ITEMS.p22?.name || "Seal of Botis" });
    addRoundEvent(`Seal of Botis avoided ${avoided} damage and gave ${target.name} +${added} memory.`);
  });
}

function damagePlayer(amount, reason, echo = true, respectReduction = true, source = undefined, applySealConversion = true) {
  let damage = Math.max(0, Math.ceil(amount));
  const sourceDamage = damage;
  let reductionSaved = 0;
  if (respectReduction && state.roundState?.playerDamageReduction) {
    const beforeReduction = damage;
    damage = Math.ceil(damage * (1 - state.roundState.playerDamageReduction));
    reductionSaved = Math.max(0, beforeReduction - damage);
  }
  const conversion = applySealConversion ? applyPlayerDamageMemoryConversion(damage) : { damage, conversions: [], avoidedTotal: 0 };
  damage = conversion.damage;
  if (damage <= 0) {
    if (reductionSaved > 0) {
      recordPlayerDamageSource(reductionSaved, state.roundState?.playerDamageReductionSource || "Damage reduction", "saved");
    }
    if (conversion.avoidedTotal > 0) {
      recordPlayerDamageSource(conversion.avoidedTotal, ITEMS.p22?.name || "Seal of Botis", "saved");
    }
    resolvePlayerDamageMemoryConversions(conversion.conversions);
    return 0;
  }
  state.player.hp = Math.max(0, state.player.hp - damage);
  state.playerLastDamage = (state.playerLastDamage || 0) + damage;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Damage");
  recordPlayerDamageSource(sourceDamage, sourceLabel);
  applyBossLifeStealHealing(damage);
  if (reductionSaved > 0) {
    recordPlayerDamageSource(reductionSaved, state.roundState?.playerDamageReductionSource || "Damage reduction", "saved");
  }
  if (conversion.avoidedTotal > 0) {
    recordPlayerDamageSource(conversion.avoidedTotal, ITEMS.p22?.name || "Seal of Botis", "saved");
  }
  if (reason) addRoundEvent(reason);
  if (echo) applySpiteCircuitDamage(damage);
  if (echo) applyPainEchoDamage(damage);
  resolvePlayerDamageMemoryConversions(conversion.conversions);
  return damage;
}

function playerMaxHp() {
  return state.player.maxHp || PLAYER_MAX_HP;
}

function applySpiteCircuitDamage(playerDamage, pendingBotDamages = null, pendingBotSources = null) {
  const damage = spiteCircuitDamage(playerDamage);
  if (damage <= 0) return;
  const targets = activeBots();
  if (!targets.length) return;
  markPassiveTriggered("p5");
  if (pendingBotDamages) {
    targets.forEach((bot) => {
      addPendingBotDamage(pendingBotDamages, pendingBotSources, bot, damage, "Seal of Haures");
    });
    addRoundEvent(`Seal of Haures adds ${damage} damage to every DAMNED.`);
    return;
  }
  damageBots(targets, damage, (bot, dealt) => `Seal of Haures dealt ${dealt} damage to ${bot.name}.`, "Seal of Haures");
}

function applyPainEchoDamage(playerDamage, pendingBotDamages = null, pendingBotSources = null) {
  const round = state.roundState;
  if (!round?.painEcho || playerDamage <= 0) return;
  const source = ITEMS.a21?.name || "Voodoo Doll";
  const percent = playerDamage / Math.max(1, playerMaxHp());
  const targets = activeBots();
  if (!targets.length) return;
  const percentLabel = `${Math.round(percent * 100)}%`;
  if (pendingBotDamages) {
    targets.forEach((bot) => {
      const echoDamage = Math.ceil((bot.maxHp || 0) * percent);
      addPendingBotDamage(pendingBotDamages, pendingBotSources, bot, echoDamage, source);
    });
    round.roundEvents.push(`${source} adds ${percentLabel} max-HEALTH damage to every DAMNED.`);
    return;
  }
  targets.forEach((bot) => {
    const echoDamage = Math.ceil((bot.maxHp || 0) * percent);
    damageBot(bot, echoDamage, `${source} dealt ${echoDamage} damage to ${bot.name}.`, source);
  });
}

function healPlayer(amount, reason, source = undefined) {
  if (state.player.hp <= 0) return 0;
  amount = Math.ceil(amount);
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Healing");
  const soulBlocker = soulStealingBlocker();
  if (soulBlocker) {
    if (sourceLabel) addRoundEvent(`${soulBlocker.name}'s ${BOSS_PASSIVES.soulStealing.name} prevented ${sourceLabel} from healing you.`);
    return 0;
  }
  const healingBlocker = padmaHealingBlocker(sourceLabel);
  if (healingBlocker) {
    if (sourceLabel) addRoundEvent(`${healingBlocker.name} prevented ${sourceLabel} from healing you.`);
    return 0;
  }
  const before = state.player.hp;
  state.player.hp = Math.min(playerMaxHp(), state.player.hp + amount);
  const healed = state.player.hp - before;
  if (healed > 0) state.playerLastHeal = (state.playerLastHeal || 0) + healed;
  recordPlayerHealSource(healed, sourceLabel);
  if (healed > 0 && reason) addRoundEvent(`${reason} healed you for ${healed}.`);
  return healed;
}

function healBot(bot, amount, reason, source = undefined, options = {}) {
  amount = Math.ceil(amount);
  const before = bot.hp;
  bot.hp = options.allowOverheal ? bot.hp + amount : Math.min(bot.maxHp, bot.hp + amount);
  const healed = bot.hp - before;
  bot.lastHeal = (bot.lastHeal || 0) + healed;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Healing");
  recordBotHealSource(bot, healed, sourceLabel);
  if (healed > 0 && reason) addRoundEvent(`${reason} healed ${bot.name} for ${healed}.`);
  return healed;
}

function botRewardDetails(bot, markTriggers = false) {
  if (bot?.immortal) return { amount: 0, sourceEntries: [] };
  const bossBounty = botBossBounty(bot);
  const regularDetails = botRegularBountyPayoutDetails(bot, markTriggers);
  const sourceEntries = [];
  if (bossBounty > 0) sourceEntries.push({ amount: bossBounty, source: `${bot.name} boss bounty` });
  if (regularDetails.baseReward > 0) sourceEntries.push({ amount: regularDetails.baseReward, source: `${bot.name} bounty` });
  sourceEntries.push(...regularDetails.modifierEntries);
  return {
    amount: Math.ceil(bossBounty + regularDetails.payout),
    sourceEntries
  };
}

function botReward(bot) {
  return botRewardDetails(bot, false).amount;
}

function botHealthBonus() {
  return scalingBonus(state.bossKills, BOT_HP_BONUS_PER_BOSS, BOT_HP_BONUS_PER_BOSS_LATE, BOT_HP_BONUS_PER_BOSS_ENDLESS);
}

function bossHealthBonus() {
  return scalingBonus(
    state.bossSpawnCount,
    BOSS_HP_BONUS_PER_SPAWN,
    BOSS_HP_BONUS_PER_SPAWN_LATE,
    BOSS_HP_BONUS_PER_SPAWN_ENDLESS
  );
}

function hpExponentialFactor(progressAfterFirstEight) {
  const progress = Math.max(0, progressAfterFirstEight || 0);
  return Math.pow(HP_EXPONENTIAL_RATE, progress / HP_EXPONENTIAL_STEP_BOSSES);
}

function botHealthScaleFactor() {
  return hpExponentialFactor((state.bossKills || 0) - ENDLESS_SCALING_BREAKPOINT_BOSSES);
}

function bossHealthScaleFactor() {
  return hpExponentialFactor((state.bossSpawnCount || 0) - ENDLESS_SCALING_BREAKPOINT_BOSSES);
}

function randomBotHealth() {
  return randomBotHealthValue();
}

function randomBotHealthValue() {
  const bonus = botHealthBonus();
  const factor = botHealthScaleFactor();
  return randomInt(Math.ceil((BOT_MIN_HP + bonus) * factor), Math.ceil((BOT_MAX_HP + bonus) * factor));
}

function shopSlotCount() {
  return 3 + (hasPassive("p20") ? 1 : 0);
}

function shopSlotCountForItem(item) {
  return 3 + (item?.id === "p20" ? 1 : 0);
}

function sealSlotsFull() {
  return ownedSealSlotCount() >= passiveLimit();
}

function eliteRerollBoostCount(value = state.eliteBoostedNextReroll) {
  if (value === true) return 1;
  if (!Number.isFinite(Number(value))) return 0;
  return Math.max(0, Math.ceil(Number(value)));
}

function addEliteRerollBoost() {
  state.eliteBoostedNextReroll = eliteRerollBoostCount() + 1;
}

function eliteShopChance(eliteBoosted = state.eliteBoostedNextReroll) {
  if (ownedSealSlotCount() <= 0) return 0;
  let multiplier = 1;
  multiplier *= 2 ** eliteRerollBoostCount(eliteBoosted);
  if (sealSlotsFull()) multiplier *= 2;
  return Math.min(1, SHOP_ELITE_CHANCE * multiplier);
}

function activeInventoryLimit() {
  return ACTIVE_LIMIT + baseEditionBonus("p25");
}

function activeUseLimit() {
  return hasPassive("p24") ? 1 : ACTIVE_USES_PER_ROUND + baseEditionBonus("p25");
}

function bountyOathMultiplier() {
  return hasPassive("p24") ? 1.5 * passivePower("p24") : 1;
}

function bountyOathMultiplierForItem(item) {
  return item?.id === "p24" ? 1.5 * passivePower(item) : 1;
}

function activeBots() {
  return state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated);
}

function activeBossByOwnKey(key) {
  return state.bots.find((bot) => bot.isBoss && bot.uniqueKey === key && bot.hp > 0 && !bot.eliminated) || null;
}

function pairedBossByKey(key, pairGroupId) {
  if (!pairGroupId) return null;
  return state.bots.find((bot) => bot.isBoss && bot.uniqueKey === key && bot.pairGroupId === pairGroupId) || null;
}

function restoreProtectedPavlos(pavlos) {
  const round = state.roundState;
  if (!round || !pavlos || round.pavlosProtectedBotId === pavlos.id) return false;
  const startingHp = round.pavlosStartHpById?.get(pavlos.id);
  round.pavlosDeferredBotIds?.delete(pavlos.id);
  pavlos.eliminated = false;
  pavlos.hp = Math.max(1, Math.ceil(startingHp || pavlos.hp || pavlos.maxHp / 2 || 1));
  pavlos.lastDamage = 0;
  pavlos.damageSources = [];
  pavlos.deathCause = null;
  pavlos.deathNotice = null;
  pavlos.pendingReplacementSpec = null;
  round.pavlosProtectedBotId = pavlos.id;
  round.roundEvents.push("Pavlos refused lethal damage because both twins would have fallen.");
  return true;
}

function protectPavlosAcrossRound(freshEliminations) {
  const round = state.roundState;
  if (!round || round.pavlosProtectedBotId) return freshEliminations;
  if (round.resolvingDeferredPavlos) return freshEliminations;
  const fallingIds = new Set(freshEliminations.map((bot) => bot.id));

  const protectedEliminations = freshEliminations.filter((bot) => {
    if (bot.uniqueKey !== "pavlos") return true;
    const petros = pairedBossByKey("petros", bot.pairGroupId);
    const petrosFalling = petros && (fallingIds.has(petros.id) || petros.eliminated || petros.hp <= 0);
    if (!petrosFalling && petros && !petros.eliminated && petros.hp > 0) {
      round.pavlosDeferredBotIds?.add(bot.id);
      bot.hp = 1;
      return false;
    }
    if (!petrosFalling) return true;
    restoreProtectedPavlos(bot);
    return false;
  });

  freshEliminations.forEach((bot) => {
    if (bot.uniqueKey !== "petros") return;
    const pavlos = pairedBossByKey("pavlos", bot.pairGroupId);
    if (pavlos && (pavlos.eliminated || pavlos.hp <= 0 || round.pavlosDeferredBotIds?.has(pavlos.id))) {
      restoreProtectedPavlos(pavlos);
    }
  });

  return protectedEliminations;
}

function resolveDeferredPavlosEliminations() {
  const round = state.roundState;
  const deferredIds = Array.from(round?.pavlosDeferredBotIds || []);
  if (!round || !deferredIds.length) return;
  round.pavlosDeferredBotIds.clear();
  deferredIds.forEach((id) => {
    const pavlos = state.bots.find((bot) => bot.id === id && bot.uniqueKey === "pavlos");
    if (!pavlos || pavlos.eliminated || round.pavlosProtectedBotId === pavlos.id) return;
    const petros = pairedBossByKey("petros", pavlos.pairGroupId);
    if (!petros || petros.eliminated || petros.hp <= 0) {
      restoreProtectedPavlos(pavlos);
      return;
    }
    round.resolvingDeferredPavlos = true;
    pavlos.hp = 0;
    resolveEliminatedBots([pavlos]);
    round.resolvingDeferredPavlos = false;
  });
}

function maybeActivatePavlosProtection(incomingDamageById) {
  const round = state.roundState;
  if (!round || round.pavlosProtectedBotId) return null;
  const petros = activeBossByOwnKey("petros");
  const pavlos = activeBossByOwnKey("pavlos");
  if (!petros || !pavlos || petros.pairGroupId !== pavlos.pairGroupId) return null;
  const petrosDamage = Math.max(0, Math.ceil(incomingDamageById.get(petros.id) || 0));
  const pavlosDamage = Math.max(0, Math.ceil(incomingDamageById.get(pavlos.id) || 0));
  if (petrosDamage < petros.hp || pavlosDamage < pavlos.hp) return null;
  round.pavlosProtectedBotId = pavlos.id;
  round.roundEvents.push("Pavlos refused lethal damage because both twins would have fallen.");
  return pavlos.id;
}

function pavlosDamageBlocked(bot) {
  return Boolean(
    bot &&
      (state.roundState?.pavlosProtectedBotId === bot.id || state.roundState?.pavlosDeferredBotIds?.has(bot.id))
  );
}

function damageBot(bot, amount, reason, source = undefined, playerDealt = true) {
  const rawDamage = Math.max(0, Math.ceil(amount));
  if (!bot || bot.eliminated || rawDamage <= 0) return 0;
  const damageDetails = scaledBotDamageDetails(bot, amount, playerDealt);
  const damage = damageDetails.damage;
  if (damage <= 0) return 0;
  if (pavlosDamageBlocked(bot)) return 0;
  bot.lastDamage = (bot.lastDamage || 0) + damage;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Damage");
  recordScaledBotDamageSources(bot, damageDetails, sourceLabel);
  if (bot.immortal) {
    bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
    if (reason) {
      addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${damage} damage to ${bot.name}.` : reason);
    }
    applyDirectRedirectDamage(damageDetails.redirectEntries);
    return damage;
  }
  const hpBefore = bot.hp;
  bot.hp = Math.max(0, bot.hp - damage);
  if (reason) {
    addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${damage} damage to ${bot.name}.` : reason);
  }
  applyDirectRedirectDamage(damageDetails.redirectEntries);
  if (bot.hp <= 0) {
    recordBotExcessDamage(bot, damage, hpBefore);
    resolveEliminatedBots([bot]);
  }
  return damage;
}

function damageBotNonLethal(bot, amount, reason, source = undefined, playerDealt = true) {
  const rawDamage = Math.max(0, Math.ceil(amount));
  if (!bot || bot.eliminated || bot.hp <= 1 || rawDamage <= 0) return 0;
  const damageDetails = scaledBotDamageDetails(bot, amount, playerDealt);
  const damage = damageDetails.damage;
  if (damage <= 0) return 0;
  if (pavlosDamageBlocked(bot)) return 0;
  if (bot.immortal) {
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
    const reasonText = typeof reason === "function" ? reason(bot, damage) : reason;
    const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reasonText, "Damage");
    recordScaledBotDamageSources(bot, damageDetails, sourceLabel);
    if (reasonText) addRoundEvent(reasonText);
    applyDirectRedirectDamage(damageDetails.redirectEntries);
    return damage;
  }
  const before = bot.hp;
  bot.lastDamage = (bot.lastDamage || 0) + damage;
  bot.hp = Math.max(1, bot.hp - damage);
  const dealt = before - bot.hp;
  const reasonText = typeof reason === "function" ? reason(bot, dealt) : reason;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reasonText, "Damage");
  scaleSourceEntries(scaledBotDamageSourceEntries(damageDetails, sourceLabel), dealt).forEach((entry) =>
    recordBotDamageSource(bot, entry.amount, entry.source, entry.kind)
  );
  if (reasonText && dealt > 0) {
    addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${dealt} non-lethal damage to ${bot.name}.` : reasonText);
  }
  applyDirectRedirectDamage(damageDetails.redirectEntries);
  return dealt;
}

function damageBots(bots, amount, reasonFactory, sourceFactory = undefined, playerDealt = true) {
  const eliminated = [];
  const planned = bots.map((bot) => {
    if (!bot || bot.eliminated) return { bot, damageDetails: { damage: 0, baseDamage: 0, modifierEntries: [] }, damage: 0 };
    const damageDetails = scaledBotDamageDetails(bot, typeof amount === "function" ? amount(bot) : amount, playerDealt);
    const damage = damageDetails.damage;
    return { bot, damageDetails, damage };
  });
  maybeActivatePavlosProtection(new Map(planned.map(({ bot, damage }) => [bot?.id, damage])));
  planned.forEach(({ bot, damageDetails, damage }) => {
    if (!bot || bot.eliminated || damage <= 0 || pavlosDamageBlocked(bot)) return;
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    const reason = typeof reasonFactory === "function" ? reasonFactory(bot, damage) : reasonFactory;
    const source =
      sourceFactory === null
        ? ""
        : typeof sourceFactory === "function"
          ? sourceFactory(bot, damage)
          : sourceFactory || sourceLabelFromReason(reason, "Damage");
    recordScaledBotDamageSources(bot, damageDetails, source);
    if (bot.immortal) {
      bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
      if (reason) addRoundEvent(reason);
      applyDirectRedirectDamage(damageDetails.redirectEntries);
      return;
    }
    const hpBefore = bot.hp;
    bot.hp = Math.max(0, bot.hp - damage);
    if (reason) addRoundEvent(reason);
    if (bot.hp <= 0) {
      recordBotExcessDamage(bot, damage, hpBefore);
      eliminated.push(bot);
    }
    applyDirectRedirectDamage(damageDetails.redirectEntries);
  });
  if (eliminated.length) resolveEliminatedBots(eliminated);
  return eliminated;
}

function eraseBotWithoutReward(bot, reason, cause = "erased") {
  if (!bot || bot.eliminated) return;
  if (bot.immortal) {
    if (reason) addRoundEvent(`${bot.name} cannot be erased.`);
    return;
  }
  bot.hp = 0;
  bot.eliminated = true;
  bot.deathCause = cause;
  bot.deathNotice = cause === "contract" ? "CONTRACT" : "ERASED";
  bot.pendingReplacementSpec = null;
  if (reason) addRoundEvent(reason);
}

function archetypeByType(type) {
  return BOT_ARCHETYPES.find((archetype) => archetype.type === type) || randomFrom(BOT_ARCHETYPES);
}

// bosses have no personality, so every personality seal skips them
function personalityType(bot) {
  if (!bot || bot.isBoss) return "";
  return bot.type || "";
}

function samePersonalityBots(bot) {
  const type = personalityType(bot);
  if (!type) return [];
  return activeBots().filter((candidate) => candidate.id !== bot?.id && personalityType(candidate) === type);
}

function mostPrevalentPersonality() {
  const counts = new Map();
  activeBots().forEach((bot) => {
    const type = personalityType(bot);
    if (!type) return;
    counts.set(type, (counts.get(type) || 0) + 1);
  });
  const bestCount = Math.max(0, ...Array.from(counts.values()));
  const best = Array.from(counts.entries())
    .filter((entry) => entry[1] === bestCount)
    .map((entry) => entry[0]);
  return best.length ? randomFrom(best) : "";
}

function applyPersonalityAlterationDamage(bot, source = "Personality alteration") {
  const entries = orderedPassiveEffectEntries("p90");
  if (!bot || !entries.length || bot.eliminated) return;
  entries.forEach((entry) => {
    if (bot.eliminated) return;
    const damage = passiveEntryFlatDamage(entry, 10);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    const name = passiveName("p90", "Seal of Bifrons");
    queueEndOfRoundBotDamage(bot, damage, `${name} dealt ${damage} damage to ${bot.name} after ${source} altered their personality.`, name);
  });
}

function setBotPersonality(bot, type, source = "", { triggerAlterationDamage = true, markEntry = null } = {}) {
  if (!bot || bot.isBoss || bot.eliminated || !type || personalityType(bot) === type) return false;
  const archetype = archetypeByType(type);
  bot.type = archetype.type;
  bot.color = archetype.color;
  bot.anchor = clamp(Math.ceil((bot.anchor || archetype.anchor) * 0.55 + archetype.anchor * 0.45), 0, 100);
  bot.aggression = archetype.aggression;
  bot.noise = archetype.noise;
  if (markEntry) markPassiveEntryTriggered(markEntry);
  if (source) addRoundEvent(`${source} changed ${bot.name}'s personality to ${archetype.type}.`);
  if (triggerAlterationDamage) applyPersonalityAlterationDamage(bot, source || "a SEAL");
  return true;
}

function allowedTwinTemperType() {
  return randomFrom(["Analyst", "Stubborn"]);
}

function enforceTwinTemperPersonalities() {
  const entries = orderedPassiveEffectEntries("p89");
  if (!entries.length) return;
  activeBots().forEach((bot) => {
    if (["Analyst", "Stubborn"].includes(personalityType(bot))) return;
    const entry = entries[0];
    setBotPersonality(bot, allowedTwinTemperType(), passiveName("p89", "Seal of Marax"), { markEntry: entry });
  });
}

function applyForcedDoctrineEndRound() {
  const entries = orderedPassiveEffectEntries("p90");
  if (!entries.length) return;
  const prevalent = mostPrevalentPersonality();
  if (!prevalent) return;
  entries.forEach((entry) => {
    const targets = activeBots().filter((bot) => personalityType(bot) !== prevalent);
    if (!targets.length) return;
    const target = randomFrom(targets);
    setBotPersonality(target, prevalent, passiveName("p90", "Seal of Bifrons"), { markEntry: entry });
  });
}

function applyFixedWillStart() {
  const entries = orderedPassiveEffectEntries("p107");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const targets = activeBots().filter((bot) => personalityType(bot) !== "Stubborn");
    if (targets.length) {
      const target = randomFrom(targets);
      setBotPersonality(target, "Stubborn", passiveName("p107", "Seal of Ose"), { markEntry: entry });
    }
    const eliteDamage = Math.max(0, Math.ceil((entry.stack || 1) - 1) * 5);
    if (eliteDamage <= 0) return;
    const stubbornTargets = activeBots().filter((bot) => personalityType(bot) === "Stubborn");
    if (!stubbornTargets.length) return;
    markPassiveEntryTriggered(entry);
    queueEndOfRoundBotDamages(
      stubbornTargets,
      eliteDamage,
      (bot, damage) => `${passiveName("p107", "Seal of Ose")} dealt ${damage} ELITE damage to ${bot.name}.`,
      passiveName("p107", "Seal of Ose")
    );
  });
}

function inheritedReplacementProfile(bot, entry) {
  if (!bot || bot.isBoss || bot.immortal || !entry) return null;
  const chance = Math.min(1, 0.5 + Math.max(0, (entry.stack || 1) - 1) * 0.1);
  if (Math.random() >= chance) return null;
  markPassiveEntryTriggered(entry);
  return {
    name: bot.name,
    flag: bot.flag,
    country: bot.country,
    type: personalityType(bot),
    anchor: bot.anchor,
    aggression: bot.aggression,
    noise: bot.noise,
    color: bot.color,
    image: bot.image,
    memory: (bot.memory || []).slice(-botMemoryLimit(bot))
  };
}

function randomBossPassiveKeys(count) {
  return shuffled(BOSS_PASSIVE_KEYS).slice(0, count);
}

function sealEntityName(passiveId) {
  return (ITEMS[passiveId]?.name || "PandoriumBeast").replace(/^Seal of\s+/i, "");
}

function goeticBossImagePath(passiveId) {
  const file = GOETIC_BOSS_IMAGE_BY_PASSIVE_ID[passiveId];
  return file ? `${GOETIC_BOSS_IMAGE_ROOT}/${file}` : randomBotImage();
}

function goeticBossSpecFromKey(key) {
  const spec = GOETIC_BOSS_BY_KEY[key] || randomFrom(GOETIC_BOSS_SPECS);
  const passiveId = spec.passiveId || null;
  return {
    key: spec.key,
    passiveId,
    name: spec.name,
    sealName: passiveId ? ITEMS[passiveId]?.name || `Seal of ${spec.name}` : `Seal of ${spec.name}`,
    image: `${GOETIC_BOSS_IMAGE_ROOT}/${spec.image}`
  };
}

function uniqueBossSpecFromKey(key) {
  if (key !== "petros") return { uniqueKey: key };
  const groupId = `petros-pavlos-${state.nextBossPairId++}`;
  const powers = shuffled(PETROS_PAVLOS_POWER_KEYS);
  return {
    uniqueKey: "petros",
    pairGroupId: groupId,
    copiedUniqueKey: powers[0] || "zilon",
    pairedBossSpec: {
      uniqueKey: "pavlos",
      pairGroupId: groupId,
      copiedUniqueKey: powers[1] || powers[0] || "dantre"
    }
  };
}

function grantRandomBossPassive(bot) {
  if (!bot || bot.hp <= 0 || bot.eliminated) return null;
  const owned = new Set([...(bot.passiveKeys || []), bot.buffPassiveKey].filter(Boolean));
  if (bot.isBoss && bot.goeticKey && owned.size >= 1) return null;
  const choices = BOSS_PASSIVE_KEYS.filter((key) => !owned.has(key));
  if (!choices.length) return null;
  const key = randomFrom(choices);
  bot.passiveKeys.push(key);
  return key;
}

function grantRandomPyrosGift(bot) {
  if (!bot || bot.hp <= 0 || bot.eliminated) return null;
  const owned = new Set([...(bot.passiveKeys || []), bot.buffPassiveKey].filter(Boolean));
  const choices = PYROS_GIFT_KEYS.filter((key) => !owned.has(key));
  if (!choices.length) return null;
  const key = randomFrom(choices);
  bot.passiveKeys.push(key);
  return key;
}

function randomBotProfile() {
  const profile = randomFrom(BOT_PROFILES);
  return {
    flag: profile.flag,
    country: profile.country,
    name: `${randomFrom(profile.names)}-${randomInt(10, 99)}`
  };
}

function randomBotImage() {
  return `assets/bots/occult-stickmen-pack/${randomFrom(BOT_IMAGE_FILES)}`;
}

function botImagePath(entity) {
  return entity?.image || `assets/bots/occult-stickmen-pack/${BOT_IMAGE_FILES[0]}`;
}

function botSinDisplay(bot) {
  if (bot?.finalKey === "satan") return "∞ SIN";
  if (bot?.finalKey === "jesus") return "-∞ SIN";
  if (bot?.isBoss) return `${botBossBounty(bot)}+${botRegularBounty(bot)} SIN`;
  return `${botRegularBounty(bot)} SIN`;
}

function stealPlayerSinToBoss(bot, amount, source) {
  if (!bot || bot.eliminated || bot.immortal) return 0;
  const available = Math.max(0, Math.ceil(state.player.credits || 0));
  const stolen = Math.min(available, Math.max(0, Math.ceil(amount)));
  if (stolen <= 0) return 0;
  state.player.credits = Math.max(0, state.player.credits - stolen);
  bot.bossBountyBonus = (bot.bossBountyBonus || 0) + stolen;
  return stolen;
}

function uniquePowerSourceName(bot, key) {
  const spec = UNIQUE_BOSS_SPECS[key];
  if (!bot || bot.uniqueKey === key) return `${spec?.name || key}'s Seal`;
  return `${bot.name}'s borrowed ${spec?.name || key} Seal`;
}

function applySerafimEntrySteal(bot) {
  const stolen = stealPlayerSinToBoss(
    bot,
    Math.ceil(Math.max(0, state.player.credits || 0) / 2),
    uniquePowerSourceName(bot, "serafim")
  );
  if (stolen <= 0) return;
  const hpGain = stolen * 2;
  bot.maxHp += hpGain;
  bot.hp += hpGain;
  addLog(`${bot.name} stole ${stolen} SIN and gained ${hpGain} health.`);
}

function applySerafimRoundSteal() {
  const bosses = activeBossesWithPower("serafim");
  if (!bosses.length) return;
  bosses.forEach((bot) => {
    const stolen = stealPlayerSinToBoss(bot, 2, uniquePowerSourceName(bot, "serafim"));
    if (stolen > 0) state.roundState.roundEvents.push(`${bot.name} stole ${stolen} SIN.`);
  });
}

function padmaHealingBlocker(sourceLabel = "") {
  if (String(sourceLabel || "").toLowerCase().includes("boss kill")) return null;
  return activeBossesWithPower("padma")[0] || null;
}

function applyPadmaStartHealing() {
  const padmas = activeBossesWithPower("padma");
  if (!padmas.length) return;
  padmas.forEach((padma) => {
    const source = uniquePowerSourceName(padma, "padma");
    healBot(padma, Math.ceil(padma.maxHp * 0.05), source, source);
    activeBots()
      .filter((bot) => bot.id !== padma.id && !bot.isBoss)
      .forEach((bot) => healBot(bot, Math.ceil(bot.maxHp * 0.1), source, source));
  });
}

function applyKalhaSealSuppression() {
  const kalhas = activeBossesWithPower("kalha");
  const choices = state.player.passives.filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id) && !suppressingBossForSeal(item.id));
  if (!kalhas.length || !choices.length || !state.roundState) return;
  const boss = randomFrom(kalhas);
  const count = Math.floor(choices.length / 2);
  if (count <= 0) return;
  const seals = shuffled(choices).slice(0, count);
  state.roundState.kalhaSuppressedPassiveIds = new Set(seals.map((seal) => seal.id));
  state.roundState.kalhaSuppressedById = boss.id;
  state.roundState.roundEvents.push(
    `${boss.name} deactivated ${seals.map((seal) => passiveDisplayName(seal)).join(", ")} for this round.`
  );
}

function createFinalBoss(key) {
  const spec = FINAL_BOSS_SPECS[key];
  return {
    id: state.nextBotId++,
    name: spec.name,
    flag: "🏴",
    country: "Final Judgment",
    type: "Final Boss",
    color: spec.color,
    image: spec.image,
    anchor: 50,
    aggression: 0,
    noise: 0,
    hp: 100,
    maxHp: 100,
    reward: key === "satan" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
    isBoss: true,
    bossOrder: state.bossSpawnCount + 1,
    uniqueKey: null,
    goeticKey: null,
    goeticPassiveId: null,
    goeticSealName: null,
    finalKey: key,
    immortal: true,
    damageTakenTotal: 0,
    modifierOverride: null,
    shopTax: 0,
    eliminationDamage: 0,
    grantsBuffs: false,
    passiveKeys: [],
    buffPassiveKey: null,
    uniqueDescriptions: spec.descriptions,
    memory: state.gameMemory.slice(),
    markedByPlayer: false,
    plannedGuess: null,
    lastDamage: 0,
    lastHeal: 0,
    lastSinDelta: 0,
    lastMemoryDelta: 0,
    damageSources: [],
    healSources: [],
    sinSources: [],
    memorySources: [],
    poisonCounters: 0,
    deathCause: null,
    deathNotice: null,
    eliminated: false,
    skipEliminationReward: false,
    pendingReplacementSpec: null,
    pendingReplacementInheritance: null,
    revealedByPassive: false,
    fresh: false
  };
}

function activeGoeticBoss() {
  return state.bots.some((bot) => bot.goeticKey && bot.hp > 0 && !bot.eliminated);
}

function enterFinalBossPhase() {
  state.finalBossQueued = false;
  state.finalBossPhase = true;
  state.bossQueued = false;
  state.killsSinceBossSpawn = 0;
  state.uniqueBossQueue = [];
  state.goeticBossQueue = [];
  state.pendingActive = null;
  state.mobileOfferingsOpen = false;
  state.bots = [createFinalBoss("jesus"), createFinalBoss("satan")];
  state.shop = [];
  addLog("Jesus and Satan enter. Devil's Offerings are sealed.");
}

function skipToFirstGoeticBoss() {
  state.pauseOpen = false;
  state.pendingActive = null;
  state.uniqueBossQueue = [];
  state.goeticBossQueue = shuffled(GOETIC_BOSS_KEYS);
  state.goeticBossKills = 0;
  state.killsSinceBossSpawn = 0;
  state.finalBossPhase = false;
  state.finalBossQueued = false;
  state.bossQueued = false;
  state.bossKills = Math.max(state.bossKills, UNIQUE_BOSS_KEYS.length);
  state.bossSpawnCount = Math.max(state.bossSpawnCount, UNIQUE_BOSS_KEYS.length);
  state.eliminations = Math.max(state.eliminations, UNIQUE_BOSS_INTERVAL * UNIQUE_BOSS_KEYS.length);
  const firstBossSpec = takeNextBossSpec();
  state.bots = firstBossSpec ? [createBot({ boss: true, bossSpec: firstBossSpec })] : [];
  fillBots();
  state.rerollBaseCost = 1;
  rerollShop();
  beginRound();
  addLog("SKIP: jumped past the eight special bosses to the first Goetic Seal boss.");
  render();
}

function skipToFinalBosses() {
  state.pauseOpen = false;
  state.pendingActive = null;
  state.goeticBossKills = GOETIC_BOSS_TOTAL;
  state.bossKills = Math.max(state.bossKills, UNIQUE_BOSS_KEYS.length + GOETIC_BOSS_TOTAL);
  state.bossSpawnCount = Math.max(state.bossSpawnCount, UNIQUE_BOSS_KEYS.length + GOETIC_BOSS_TOTAL);
  state.eliminations = Math.max(state.eliminations, UNIQUE_BOSS_INTERVAL * (UNIQUE_BOSS_KEYS.length + GOETIC_BOSS_TOTAL));
  enterFinalBossPhase();
  rerollShop();
  beginRound();
  addLog("SKIP: jumped to the Jesus and Satan phase.");
  render();
}

function skipArcadeProgression() {
  if (arcadeActionLocked()) return;
  if (state.finalBossPhase) {
    addLog("SKIP: final phase is already active.");
    render();
    return;
  }
  if (activeGoeticBoss() || state.goeticBossKills > 0) {
    skipToFinalBosses();
  } else {
    skipToFirstGoeticBoss();
  }
}

function createBot(options = {}) {
  const isBoss = Boolean(options.boss);
  const bossSpec = options.bossSpec || null;
  const inherited = !isBoss && options.inheritFrom ? options.inheritFrom : null;
  const uniqueSpec = bossSpec?.uniqueKey ? UNIQUE_BOSS_SPECS[bossSpec.uniqueKey] : null;
  const copiedUniqueSpec = bossSpec?.copiedUniqueKey ? UNIQUE_BOSS_SPECS[bossSpec.copiedUniqueKey] : null;
  const powerSpec = copiedUniqueSpec || uniqueSpec;
  const profile = isBoss ? null : inherited ? inherited : randomBotProfile();
  // bosses have no personality: they play the optimal guess (planBossGuess)
  const archetype = isBoss
    ? null
    : inherited
      ? archetypeByType(inherited.type)
      : passiveStack("p89")
        ? archetypeByType(allowedTwinTemperType())
        : randomFrom(BOT_ARCHETYPES);
  const bossOrder = isBoss ? state.bossSpawnCount + 1 : 0;
  const isEndlessBoss = isBoss && !uniqueSpec;
  const goeticSpec = isEndlessBoss ? goeticBossSpecFromKey(bossSpec?.goeticKey) : null;
  const bossBaseHp = 80 + bossHealthBonus();
  const statFactor = uniqueSpec?.statFactor ?? bossSpec?.statFactor ?? 1;
  const maxHp = isBoss ? Math.ceil(bossBaseHp * bossHealthScaleFactor() * statFactor) : randomBotHealth();
  const endlessModifier = isEndlessBoss ? randomInt(6, 12) / 10 : null;
  const passiveKeys = isBoss
    ? uniqueSpec
      ? []
      : randomBossPassiveKeys(1)
    : [];
  const reward = randomInt(1, 5);
  const loadedSpawnChance = Math.min(1, passiveStack("p23") ? 0.33 * passivePower("p23") : 0);
  const loadedSpawnBonus = !isBoss && loadedSpawnChance && Math.random() < loadedSpawnChance ? 6 : 0;
  if (loadedSpawnBonus) markPassiveTriggered("p23");
  const bot = {
    id: state.nextBotId++,
    name: isBoss ? uniqueSpec?.name || goeticSpec?.name || "PandoriumBeast" : profile.name,
    flag: profile?.flag || "🏴",
    country: profile?.country || "BOSS",
    type: isBoss ? "BOSS" : inherited?.type || archetype.type,
    color: isBoss ? "#d64f45" : archetype.color,
    image: uniqueSpec?.image || goeticSpec?.image || inherited?.image || randomBotImage(),
    anchor: isBoss ? 50 : clamp(inherited?.anchor ?? archetype.anchor + randomInt(-8, 8), 0, 100),
    aggression: isBoss ? 0 : inherited?.aggression ?? archetype.aggression,
    noise: isBoss ? 0 : inherited?.noise ?? archetype.noise,
    hp: maxHp,
    maxHp,
    reward: reward + loadedSpawnBonus,
    isBoss,
    bossOrder,
    uniqueKey: uniqueSpec?.key || null,
    copiedUniqueKey: copiedUniqueSpec?.key || null,
    pairGroupId: bossSpec?.pairGroupId || null,
    modifierCycleStartRound: ["petros", "pavlos"].includes(uniqueSpec?.key) ? state.round : null,
    goeticKey: goeticSpec?.key || null,
    goeticPassiveId: goeticSpec?.passiveId || null,
    goeticSealName: goeticSpec?.sealName || null,
    modifierOverride: uniqueSpec?.modifierOverride ?? copiedUniqueSpec?.modifierOverride ?? endlessModifier,
    shopTax: uniqueSpec?.shopTax || 0,
    eliminationDamage: uniqueSpec?.eliminationDamage || copiedUniqueSpec?.eliminationDamage || 0,
    grantsBuffs: Boolean(uniqueSpec?.grantsBuffs || copiedUniqueSpec?.grantsBuffs),
    bossBountyFactor: uniqueSpec?.bossBountyFactor ?? bossSpec?.bossBountyFactor ?? 1,
    bossBountyBonus: 0,
    countsAsBossProgress: uniqueSpec?.countsAsBossProgress !== false && bossSpec?.countsAsBossProgress !== false,
    countsAsBossSpawn: uniqueSpec?.countsAsBossSpawn !== false && bossSpec?.countsAsBossSpawn !== false,
    passiveKeys,
    buffPassiveKey: null,
    uniqueDescriptions: uniqueSpec?.descriptions || [],
    memory: isBoss ? state.gameMemory.slice() : (inherited?.memory || []).slice(),
    markedByPlayer: false,
    plannedGuess: null,
    lastDamage: 0,
    lastHeal: 0,
    lastSinDelta: 0,
    lastMemoryDelta: 0,
    damageSources: [],
    healSources: [],
    sinSources: [],
    memorySources: [],
    poisonCounters: 0,
    deathCause: null,
    deathNotice: null,
    eliminated: false,
    skipEliminationReward: false,
    pendingReplacementSpec: null,
    revealedByPassive: false,
    fresh: true
  };
  if (isBoss && botHasUniquePower(bot, "serafim")) applySerafimEntrySteal(bot);
  seedNewBotMemoryFromVassago(bot);
  if (isBoss && bot.countsAsBossSpawn !== false) state.bossSpawnCount += 1;
  return bot;
}

function fillBots() {
  while (state.bots.length < BOT_COUNT) {
    state.bots.push(createBot());
  }
}

function resetBotsForRun() {
  state.bots = [];
  fillBots();
}

function applyPyrosBuffs() {
  const pyrosSource = activeBossesWithPower("pyros")[0];
  if (!pyrosSource || state.roundState?.pyrosGiftGranted) return;
  const candidates = activeBots();
  if (!candidates.length) return;
  const target = randomFrom(candidates);
  const key = grantRandomPyrosGift(target);
  if (!key) return;
  if (state.roundState) {
    state.roundState.pyrosGiftGranted = true;
    state.roundState.roundEvents.push(`${pyrosSource.name} gave ${target.name} ${botPassiveKeyName(key)}.`);
  }
}

function rerollShop() {
  if (shopDisabledBySatan()) {
    state.shop = [];
    return;
  }
  const eliteBoosted = eliteRerollBoostCount();
  state.eliteBoostedNextReroll = 0;
  state.shop = [drawPassiveShopItem(eliteBoosted), drawActiveShopItem(), drawActiveShopItem()];
  if (eliteBoosted) addLog(`${activeName("a23")} marked this Seal reroll. ELITE chance is ${Math.round(eliteShopChance(eliteBoosted) * 100)}%.`);
  syncShopSlotCount();
}

function syncShopSlotCount() {
  if (shopDisabledBySatan()) {
    state.shop = [];
    return;
  }
  const count = shopSlotCount();
  while (state.shop.length < count) state.shop.push(drawActiveShopItem());
  if (state.shop.length > count) state.shop = state.shop.slice(0, count);
}

function drawShopItem(pool) {
  const availablePool = pool.filter((id) => !REMOVED_PASSIVE_IDS.has(id));
  const id = randomFrom(availablePool.length ? availablePool : pool);
  return { item: itemCopy(id), sold: false };
}

function sacrificialDaggerShopWeight(idOrItem = "p70") {
  const stack = typeof idOrItem === "string" ? passiveStack(idOrItem) : idOrItem?.stack || 0;
  return stack ? 2 : 1;
}

function activeShopPool() {
  const pool = ACTIVE_IDS.slice();
  const daggerExtraCopies = Math.max(0, sacrificialDaggerShopWeight() - 1);
  for (let copy = 0; copy < daggerExtraCopies; copy += 1) {
    pool.push("a15");
  }
  return pool;
}

function drawActiveShopItem() {
  return drawShopItem(activeShopPool());
}

function drawPassiveShopItem(eliteBoosted = false) {
  const passivePool = PASSIVE_IDS.filter((id) => !REMOVED_PASSIVE_IDS.has(id));
  const availablePool = passivePool.filter((id) => !isSelfStackingSeal(id) || directPassiveStack(id) === 0);
  const ownedPassives = availablePool.filter((id) => directPassiveStack(id) > 0 && !isSelfStackingSeal(id));
  const freshPassives = availablePool.filter((id) => directPassiveStack(id) === 0);
  const eliteChance = eliteShopChance(eliteBoosted);
  const wantsElite = ownedPassives.length > 0 && Math.random() < eliteChance;
  const choices = wantsElite ? ownedPassives : freshPassives.length ? freshPassives : ownedPassives;
  if (!choices.length) return drawShopItem(availablePool.length ? availablePool : passivePool.filter((id) => !isSelfStackingSeal(id)));
  return { item: itemCopy(randomFrom(choices)), sold: false };
}

function playtestMoneyModeActive() {
  return Boolean(state.playtestInfiniteMoney);
}

function canSpendCredits(amount) {
  const cost = Math.max(0, Math.ceil(amount));
  return playtestMoneyModeActive() || state.player.credits >= cost;
}

function spendCredits(amount) {
  const cost = Math.max(0, Math.ceil(amount));
  if (!canSpendCredits(cost)) return false;
  state.player.credits -= cost;
  applyCreditLashSpent(cost);
  return true;
}

function resetNegativePlaytestSin() {
  if (state.player.credits >= 0) return false;
  state.player.credits = 0;
  addLog("Playtest SIN debt reset to 0.");
  return true;
}

function togglePlaytestMoneyMode() {
  if (arcadeActionLocked()) return;
  state.playtestInfiniteMoney = !state.playtestInfiniteMoney;
  if (!state.playtestInfiniteMoney) resetNegativePlaytestSin();
  addLog(`Playtest SIN debt ${state.playtestInfiniteMoney ? "enabled" : "disabled"}.`);
  render();
}

function gainCreditsFromSourceEntries(entries, applyRoundMultiplier = true) {
  const normalizedEntries = mergeSourceEntries(entries);
  const base = normalizedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const multiplier = applyRoundMultiplier && state.roundState ? state.roundState.bountyMultiplier || 1 : 1;
  const gained = Math.ceil(base * multiplier);
  state.player.credits += gained;
  if (gained > 0) {
    if (state.roundState) state.roundState.earnedSinThisRound = (state.roundState.earnedSinThisRound || 0) + gained;
    state.playerLastCredits = (state.playerLastCredits || 0) + gained;
    normalizedEntries.forEach((entry) => recordPlayerCreditSource(entry.amount, entry.source || "SIN"));
    const multiplierBonus = Math.max(0, gained - base);
    if (multiplierBonus > 0) {
      recordPlayerCreditSource(multiplierBonus, ITEMS.a10?.name || "Funeral Coin");
    }
  }
  return gained;
}

function gainCredits(amount, applyRoundMultiplier = true, source = undefined) {
  return gainCreditsFromSourceEntries([{ amount: Math.max(0, Math.ceil(amount)), source: source || "SIN" }], applyRoundMultiplier);
}

function loseCredits(amount, source = "SIN loss") {
  const loss = Math.max(0, Math.ceil(amount));
  if (loss <= 0) return 0;
  const before = Math.max(0, Math.ceil(state.player.credits || 0));
  const lost = Math.min(before, loss);
  state.player.credits = Math.max(0, before - lost);
  if (state.roundState) {
    state.roundState.roundEvents.push(`${source} removed ${lost} SIN.`);
  }
  return lost;
}

function recordEliminationCredits(credits) {
  const gained = Math.max(0, Math.ceil(credits));
  if (!state.roundState || gained <= 0) return;
  state.roundState.eliminationCreditRecords.push({ credits: gained });
}

function gainEliminationCredits(amount, applyRoundMultiplier = true, source = undefined) {
  const gained = gainCredits(amount, applyRoundMultiplier, source || "Bounty");
  recordEliminationCredits(gained);
  return gained;
}

function gainEliminationCreditsFromSourceEntries(entries, applyRoundMultiplier = true) {
  const gained = gainCreditsFromSourceEntries(entries, applyRoundMultiplier);
  recordEliminationCredits(gained);
  return gained;
}

function distributeSinAmongHighest(amount, targets, entry) {
  const total = Math.max(0, Math.ceil(amount));
  const ordered = targets
    .filter((bot) => bot && !bot.eliminated && !bot.immortal && Number.isFinite(botRegularBounty(bot)))
    .sort((left, right) => botSin(right) - botSin(left) || left.id - right.id);
  if (total <= 0 || !ordered.length) return 0;
  const base = Math.floor(total / ordered.length);
  let remainder = total - base * ordered.length;
  let distributed = 0;
  ordered.forEach((bot) => {
    const gift = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    if (gift <= 0) return;
    const result = changeBotSin(bot, gift, `Seal of Agares gave ${bot.name} +${gift} SIN.`, {
      source: "Seal of Agares"
    });
    const damage = result.gained * agaresDamagePerSin(entry);
    if (damage > 0 && !bot.eliminated) {
      damageBot(
        bot,
        damage,
        `Seal of Agares dealt ${damage} damage to ${bot.name} for gaining ${result.gained} BOUNTY from its effect.`,
        "Seal of Agares"
      );
    }
    distributed += result.gained;
  });
  return distributed;
}

function applyAgaresEarnedSinSpread() {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p50");
  if (!round || round.agaresSpreadApplied || !entries.length) return;
  const earned = Math.max(0, Math.ceil(round.earnedSinThisRound || 0));
  const amount = Math.ceil(earned * 0.2);
  const targets = activeBots().filter((bot) => !bot.immortal);
  if (earned <= 0 || amount <= 0 || !targets.length) return;
  round.agaresSpreadApplied = true;
  entries.forEach((entry) => {
    markPassiveEntryTriggered(entry);
    const distributed = distributeSinAmongHighest(amount, targets, entry);
    if (distributed > 0) {
      round.roundEvents.push(`Seal of Agares spread ${distributed} SIN from ${earned} round-earned SIN.`);
    }
  });
}

function applyMarketHex(cost) {
  if (!passiveStack("p20")) return;
  const targets = activeBots();
  if (!targets.length) return;
  const damage = flatDamageValue("p20", cost);
  if (damage <= 0) return;
  markPassiveTriggered("p20");
  damageBots(targets, damage, (target, dealt) => `Seal of Haagenti dealt ${dealt} damage to ${target.name}.`);
}

function applyCreditLashSpent(amount) {
  const round = state.roundState;
  if (!round || !passiveStack("p29")) return;
  round.creditsSpentThisRound += Math.max(0, Math.ceil(amount));
  const totalTicks = Math.floor(round.creditsSpentThisRound / 2);
  const ticks = totalTicks - (round.creditLashDamageApplied || 0);
  if (ticks <= 0) return;
  markPassiveTriggered("p29");
  const damage = furfurDamage("p29");
  let appliedTicks = 0;
  for (let tick = 0; tick < ticks; tick += 1) {
    const target = highestHealthEnemy();
    if (!target) break;
    damageBot(target, damage, `Seal of Furfur dealt ${damage} damage to ${target.name}.`, "Seal of Furfur");
    appliedTicks += 1;
  }
  round.creditLashDamageApplied = (round.creditLashDamageApplied || 0) + appliedTicks;
}

function recordShopItemBought(itemId) {
  if (state.roundState) state.roundState.shopItemBoughtThisRound = true;
  state.player.passives.forEach((passive) => {
    if (passive.id === "p39") passive.counter = 0;
  });
  if (itemId === "p39") {
    const ledger = passiveEntry("p39");
    if (ledger) ledger.counter = 1;
  }
}

function activePurchaseCost(item) {
  if (!item || item.freeLoot) return 0;
  return Math.max(0, Math.ceil(item.purchaseCost ?? item.price ?? 0));
}

function arcadeActionLocked() {
  return state.mode !== "arcade" || state.gameOver || roundRevealAnimationActive();
}

function itemBuyValue(item) {
  if (!item) return 0;
  if (item.type === "active") return Math.max(0, Math.ceil(Math.max(item.purchaseCost ?? 0, item.price ?? 0)));
  return Math.max(0, Math.ceil((item.price || 0) * (item.stack || 1)));
}

function applyActiveUsePassives(item) {
  const round = state.roundState;
  if (!round || !item) return;
  if (state.player.hp <= 0) return;

  const previousCount = round.activeUseItemCounts.get(item.id) || 0;
  const nextCount = previousCount + 1;
  round.activeUseItemCounts.set(item.id, nextCount);

  orderedPassiveEffectEntries(["p20", "p26", "p27", "p60"]).forEach((entry) => {
    if (entry.id === "p20") {
      const targets = activeBots();
      const damage = passiveEntryFlatDamage(entry, activePurchaseCost(item));
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      queueEndOfRoundBotDamages(targets, damage, (target, queued) => `Seal of Haagenti dealt ${queued} damage to ${target.name}.`, "Seal of Haagenti");
      return;
    }

    if (entry.id === "p60") {
      if (Math.random() >= 0.5) return;
      markPassiveEntryTriggered(entry);
      const duplicate = copiedEffectItem(item);
      let duplicated = false;
      if (state.player.actives.length < activeInventoryLimit()) {
        state.player.actives.push(duplicate);
        normalizeActiveCarouselIndex();
        duplicated = true;
      }
      const targets = activeBots();
      const damage = gaapDamage(entry);
      if (targets.length && damage > 0) {
        queueEndOfRoundBotDamages(
          targets,
          damage,
          (bot, queued) => `Seal of Gaap dealt ${queued} damage to ${bot.name}.`,
          "Seal of Gaap"
        );
      }
      round.roundEvents.push(
        duplicated
          ? `Seal of Gaap copied ${item.name} and struck every DAMNED.`
          : `Seal of Gaap struck every DAMNED, but your ARTIFACT inventory was full.`
      );
      return;
    }

    if (entry.id === "p26") {
      const triggerKey = `${entry.index}:${item.id}`;
      if (nextCount < 2 || round.twinDetonatorTriggeredIds.has(triggerKey)) return;
      round.twinDetonatorTriggeredIds.add(triggerKey);
      const damage = twinDetonatorDamage(entry);
      const targets = activeBots();
      if (!targets.length) return;
      markPassiveEntryTriggered(entry);
      queueEndOfRoundBotDamages(
        targets,
        damage,
        (bot, queued) => `Seal of Amdusias dealt ${queued} damage to ${bot.name}.`,
        "Seal of Amdusias"
      );
      return;
    }

    if (entry.id === "p27") {
      const outcomes = ["heal", "damage", "refund"];
      const outcome = randomFrom(outcomes);
      markPassiveEntryTriggered(entry);

      if (outcome === "heal") {
        const { credits } = applyPassivePlayerHealForEntry(entry, 3, "Seal of Zagan");
        round.roundEvents.push(`Seal of Zagan paid ${credits} SIN.`);
        return;
      }

      if (outcome === "damage") {
        const targets = activeBots();
        if (!targets.length) {
          round.roundEvents.push("Seal of Zagan sparked, but no DAMNED could be hit.");
          return;
        }
        const target = randomFrom(targets);
        const damage = reactiveWarrantyDamage(entry);
        queueEndOfRoundBotDamage(target, damage, `Seal of Zagan dealt ${damage} damage to ${target.name}.`, "Seal of Zagan");
        return;
      }

      const refund = activePurchaseCost(item);
      const gained = gainCredits(refund, false, "Seal of Zagan");
      round.roundEvents.push(`Seal of Zagan refunded ${gained} SIN from ${item.name}.`);
    }
  });
}

function startGame(options = {}) {
  resetRoundRevealAnimation();
  resumeSoundtrack();
  pvpClearAutoTimer();
  pvpStopHostPolling();
  const restartingSlotId = options.slotId || (state.mode === "arcade" ? state.currentRunSlotId : null) || createArcadeRunSlotId();
  state.mode = "arcade";
  state.currentRunSlotId = restartingSlotId;
  state.runStartedAt = Date.now();
  state.pauseOpen = false;
  state.pauseDevOpen = false;
  state.round = 1;
  state.stage = "guess";
  state.player.maxHp = PLAYER_MAX_HP;
  state.player.hp = PLAYER_MAX_HP;
  state.player.credits = STARTING_CREDITS;
  state.player.passives = [];
  state.player.actives = [];
  state.log = [];
  state.roundState = null;
  state.previousTarget = null;
  state.playerLastDamage = 0;
  state.playerLastHeal = 0;
  state.playerLastCredits = 0;
  state.playerDamageSources = [];
  state.playerHealSources = [];
  state.playerCreditSources = [];
  state.sealStats = {};
  state.runStats = defaultRunStats();
  state.pendingNextRoundMarbasBonuses = [];
  state.pendingNextRoundLambReveals = [];
  state.pendingSelfStackingPentakillDamage = 0;
  state.gameMemory = [];
  state.pendingActive = null;
  state.lastUsedArtifact = null;
  state.gameOver = false;
  state.inspectingGameOver = false;
  state.nextBotId = 1;
  state.nextItemUid = 1;
  state.eliminations = 0;
  state.bossKills = 0;
  state.itemsBought = 0;
  state.totalArtifactsUsed = 0;
  state.selfStackingGameConditionCounts = Object.fromEntries(Object.values(SELF_STACKING_SEAL_SPECS).map((spec) => [spec.key, 0]));
  state.rerollBaseCost = 1;
  state.activeCarouselIndex = 0;
  state.mobileOfferingsOpen = false;
  state.bossSpawnCount = 0;
  state.uniqueBossQueue = shuffled(UNIQUE_BOSS_KEYS);
  state.goeticBossQueue = shuffled(GOETIC_BOSS_KEYS);
  state.goeticBossKills = 0;
  state.nextBossPairId = 1;
  state.finalBossPhase = false;
  state.finalBossQueued = false;
  state.bossQueued = false;
  state.killsSinceBossSpawn = 0;
  state.eliteBoostedNextReroll = 0;
  state.paleHorseBoostArmed = false;
  state.critMomentumBonus = 0;
  state.previousRoundEliminationsForMartyrs = 0;
  resetBotsForRun();
  rerollShop();
  beginRound();
  addLog("Round 1 begins. The table continues until you fall.");
  render();
}

function beginRound() {
  beginRunRoundStats();
  resetNegativePlaytestSin();
  pruneRemovedPassives();
  state.stage = "guess";
  state.shouldFocusGuessInput = true;
  state.pendingActive = null;
  state.playerLastDamage = 0;
  state.playerLastHeal = 0;
  state.playerLastCredits = 0;
  state.playerDamageSources = [];
  state.playerHealSources = [];
  state.playerCreditSources = [];
  const twinModifier = petrosPavlosRoundModifier();
  const threonMystery = aliveUniqueBoss("threon");
  const paleHorseDamageBoostActive = Boolean(state.paleHorseBoostArmed);
  state.paleHorseBoostArmed = false;
  state.roundState = {
    playerSubmittedGuess: null,
    playerEffectiveGuess: null,
    botSubmittedGuesses: new Map(),
    botEffectiveGuesses: new Map(),
    targetModifier: twinModifier ?? (threonMystery ? randomInt(7, 13) / 10 : currentTargetModifier()),
    mysteryModifier: twinModifier === null && threonMystery,
    targetOffset: 0,
    target: null,
    criticalInteger: null,
    tableAverage: null,
    extraAverageGuesses: [],
    removedBotIds: new Set(),
    activeUses: 0,
    activeUseItemCounts: new Map(),
    artifactTargetCountsByBotId: new Map(),
    twinDetonatorTriggeredIds: new Set(),
    painEcho: false,
    bountyMultiplier: 1,
    edgeGambitStacks: 0,
    playerDamageReduction: 0,
    playerDamageReductionSource: "",
    creditsSpentThisRound: 0,
    earnedSinThisRound: 0,
    rerollSinSpentThisRound: 0,
    agaresSpreadApplied: false,
    creditLashDamageApplied: 0,
    temporaryBotSinBonuses: [],
    botDamageTotals: new Map(),
    highDamageSinBotIds: new Set(),
    balamResolving: false,
    shopItemBoughtThisRound: false,
    multiEliminationBonusPaid: false,
    eliminatedPersonalities: [],
    eliminationsThisRound: 0,
    eliminationCreditRecords: [],
    pentakillAwarded: false,
    pentakillPopup: false,
    revealedBotIds: new Set(),
    amonRewardKeys: new Set(),
    targetDifferenceDamageByBotId: new Map(),
    playerTargetDifferenceDamage: 0,
    bossRevealPunishedKeys: new Set(),
    bossAbilityNullifiedBotIds: new Set(),
    belethTriggeredBotIds: new Set(),
    vapulaTriggeredBotIds: new Set(),
    wiretapExtraCount: null,
    wiretapStack: 0,
    kalhaSuppressedPassiveIds: new Set(),
    kalhaSuppressedById: null,
    pavlosProtectedBotId: null,
    pavlosStartHpById: new Map(),
    pavlosDeferredBotIds: new Set(),
    resolvingDeferredPavlos: false,
    pyrosGiftGranted: false,
    devSealsRolled: false,
    devTemporaryActiveUids: new Set(),
    padmaVulnerableBotIds: new Set(),
    paleHorseDamageBoostActive,
    previousRoundEliminationsForMartyrs: state.previousRoundEliminationsForMartyrs || 0,
    selfStackingConditionCounts: Object.fromEntries(Object.values(SELF_STACKING_SEAL_SPECS).map((spec) => [spec.key, 0])),
    selfStackingCriticalDamage: 0,
    pendingEndOfRoundBotDamages: [],
    resolvingEndOfRoundPassives: false,
    triggeredPassiveIds: new Set(),
    penaltiesApplied: false,
    criticalHitKeys: new Set(),
    roundEvents: []
  };

  state.bots.forEach((bot) => {
    if (bot.eliminated) return;
    trimBotMemoryToLimit(bot);
    bot.fresh = bot.memory.length === 0;
    bot.lastDamage = 0;
    bot.lastHeal = 0;
    bot.lastSinDelta = 0;
    bot.damageSources = [];
    bot.healSources = [];
    bot.sinSources = [];
    bot.deathCause = null;
    bot.deathNotice = null;
    bot.markedByPlayer = false;
    bot.diffMarkedByPlayer = false;
    bot.revealedByPassive = false;
    if (bot.uniqueKey === "pavlos") state.roundState.pavlosStartHpById.set(bot.id, bot.hp);
  });

  enforceTwinTemperPersonalities();
  applyFixedWillStart();
  applyPendingNextRoundMarbasBonuses();
  state.bots.forEach((bot) => {
    if (bot.eliminated) return;
    bot.fresh = bot.memory.length === 0;
    bot.plannedGuess = planBotGuess(bot);
  });

  applyKalhaSealSuppression();
  applySerafimRoundSteal();
  applyBossSinStealing();
  applyPadmaStartHealing();
  applyPyrosBuffs();
  applyMarkedProspect();
  applyGuessReveals();
  applyPendingNextRoundLambReveals();
  applyStartOfRoundPassives();
  applyGuessReveals();
  applyRevealPoisonCounters();
}

function applyMarkedProspect() {
  if (!passiveStack("p38")) return;
  const targets = activeBots();
  if (!targets.length) return;
  const target = randomFrom(targets);
  target.markedByPlayer = true;
  markPassiveTriggered("p38");
  state.roundState.roundEvents.push(`Seal of Astaroth marked ${target.name}.`);
}

function queueMarbasNextRoundSpread(entry) {
  if (!entry) return;
  state.pendingNextRoundMarbasBonuses = state.pendingNextRoundMarbasBonuses || [];
  state.pendingNextRoundMarbasBonuses.push({
    sin: passiveEntryConvertedSin(entry, 3),
    memory: 3,
    source: ITEMS.p9?.name || "Seal of Marbas"
  });
  markPassiveEntryTriggered(entry);
  state.roundState?.roundEvents.push("Seal of Marbas will spread SIN and MEMORY among next-round DAMNED.");
}

function applyPendingNextRoundMarbasBonuses() {
  const pending = state.pendingNextRoundMarbasBonuses || [];
  if (!pending.length || !state.roundState) return;
  state.pendingNextRoundMarbasBonuses = [];
  pending.forEach((bonus) => {
    const targets = activeBots().filter((bot) => !bot.immortal);
    if (!targets.length) return;
    const source = bonus.source || "Seal of Marbas";
    let sinSpread = 0;
    let memorySpread = 0;
    for (let index = 0; index < Math.max(0, Math.ceil(bonus.sin || 0)); index += 1) {
      const target = randomFrom(targets);
      const result = changeBotSin(target, 1, "", { source });
      sinSpread += result.gained;
    }
    for (let index = 0; index < Math.max(0, Math.ceil(bonus.memory || 0)); index += 1) {
      const target = randomFrom(targets);
      memorySpread += addBotMemory(target, 1, "", { source });
    }
    if (sinSpread || memorySpread) {
      state.roundState.roundEvents.push(`${source} spread ${sinSpread} SIN and ${memorySpread} MEMORY among next-round DAMNED.`);
    }
  });
}

function queueMummifiedLambNextRoundReveal(bot, source = activeName("a25")) {
  if (!bot) return;
  state.pendingNextRoundLambReveals = state.pendingNextRoundLambReveals || [];
  state.pendingNextRoundLambReveals.push({
    botId: bot.id,
    botName: bot.name,
    bounty: 3,
    source
  });
  state.roundState?.roundEvents.push(`${source} marked ${bot.name} for next-round reveal and BOUNTY.`);
}

function applyPendingNextRoundLambReveals() {
  const pending = state.pendingNextRoundLambReveals || [];
  if (!pending.length || !state.roundState) return;
  state.pendingNextRoundLambReveals = [];
  pending.forEach((effect) => {
    const source = effect.source || activeName("a25");
    const bot = state.bots.find((candidate) => candidate.id === effect.botId && candidate.hp > 0 && !candidate.eliminated);
    if (!bot) {
      state.roundState.roundEvents.push(`${source} found no living target for ${effect.botName || "the marked DAMNED"}.`);
      return;
    }
    revealBotGuess(bot, source, null, { allowBoss: true });
    const bounty = Math.max(0, Math.ceil(effect.bounty || 0));
    const result = changeBotSin(bot, bounty, "", { source, triggerLossDamage: false });
    state.roundState.roundEvents.push(`${source} gave ${bot.name} +${result.gained} BOUNTY for its next-round mark.`);
  });
}

function applyStartOfRoundSinRedistribution() {
  const entries = orderedPassiveEffectEntries("p48");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const targets = shuffled(activeBots().filter((bot) => !bot.immortal && botRegularBounty(bot) > 0)).slice(0, Math.max(1, entry.stack || 1));
    if (!targets.length) return;
    markPassiveEntryTriggered(entry);
    targets.forEach((bot) => {
      const bonus = botSin(bot);
      if (bonus <= 0) return;
      const result = changeBotSin(bot, bonus, `Seal of Cimejes doubled ${bot.name}'s bounty for this round.`);
      if (result.gained > 0) {
        state.roundState.temporaryBotSinBonuses.push({
          botId: bot.id,
          amount: result.gained,
          source: "Seal of Cimejes"
        });
      }
    });
  });
}

function applyStartOfRoundPassives() {
  applyStartOfRoundSinRedistribution();

  orderedPassiveEffectEntries("p14").forEach((entry) => {
    const targets = activeBots();
    if (!targets.length) return;
    const target = randomFrom(targets);
    const damage = passiveEntryFlatDamage(entry, 20);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    const wasAlive = target.hp > 0 && !target.eliminated;
    damageBot(target, damage, `Seal of Leraje dealt ${damage} damage to ${target.name}.`, "Seal of Leraje");
    if (wasAlive && target.eliminated) {
      const credits = passiveEntryScaledValue(entry, 8);
      const gained = gainCredits(credits, true, "Seal of Leraje");
      state.roundState.roundEvents.push(`Seal of Leraje paid ${gained} SIN for eliminating ${target.name}.`);
      return;
    }
    if (!target.eliminated) {
      setBotPersonality(target, "Stubborn", "Seal of Leraje");
    }
  });
}

function projectedMemoryTarget(
  memoryEntry,
  modifier = state.roundState?.targetModifier ?? BASE_TARGET_MODIFIER,
  offset = state.roundState?.targetOffset ?? 0
) {
  if (!memoryEntry) return null;
  if (Number.isFinite(memoryEntry.tableAverage)) {
    return Math.ceil(memoryEntry.tableAverage * modifier + offset);
  }
  if (Number.isFinite(memoryEntry.target) && Number.isFinite(memoryEntry.targetModifier) && memoryEntry.targetModifier !== 0) {
    const previousOffset = Number.isFinite(memoryEntry.targetOffset) ? memoryEntry.targetOffset : 0;
    return Math.ceil(((memoryEntry.target - previousOffset) / memoryEntry.targetModifier) * modifier + offset);
  }
  return Number.isFinite(memoryEntry.target) ? memoryEntry.target : null;
}

function applyFurcasLastTargetGuessSet() {
  const entries = orderedPassiveEffectEntries("p72");
  const round = state.roundState;
  if (!entries.length || !round || !Number.isFinite(state.previousTarget)) return;
  const previous = Math.ceil(state.previousTarget);
  if (previous === 40) return;
  entries.forEach((entry) => {
    const targets = previous < 40 ? activeBots().filter((bot) => !bot.isBoss) : activeBots();
    if (!targets.length) return;
    const target = randomFrom(targets);
    const guess = previous < 40 ? 100 : 0;
    round.botSubmittedGuesses.set(target.id, guess);
    round.botEffectiveGuesses.set(target.id, guess);
    target.plannedGuess = guess;
    markPassiveEntryTriggered(entry);
    round.roundEvents.push(`Seal of Furcas set ${target.name}'s guess to ${guess} because the previous TARGET was ${previous}.`);
    const damage = furcasSelectedDamage(entry);
    if (damage > 0) {
      queueEndOfRoundBotDamage(target, damage, `Seal of Furcas dealt ${damage} damage to ${target.name}.`, "Seal of Furcas");
    }
  });
}

function applySallosGuessShiftAwayFromTarget() {
  const entries = orderedPassiveEffectEntries("p71");
  const round = state.roundState;
  if (!entries.length || !round || !Number.isFinite(round.target)) return;
  entries.forEach((entry) => {
    const values = sallosShiftValues(entry);
    let shifted = 0;
    activeBots().forEach((bot) => {
      const current = round.botEffectiveGuesses.get(bot.id);
      if (!Number.isFinite(current)) return;
      const direction = current === round.target ? randomFrom([-1, 1]) : current > round.target ? 1 : -1;
      const amount = randomFrom(values);
      const next = Math.ceil(clamp(current + direction * amount, 0, 100));
      if (next === current) return;
      round.botEffectiveGuesses.set(bot.id, next);
      shifted += 1;
    });
    if (!shifted) return;
    markPassiveEntryTriggered(entry);
    round.roundEvents.push(`Seal of Sallos shifted ${shifted} DAMNED guesses away from the TARGET without changing the average.`);
  });
}

function applyBifronsTargetSevenSin() {
  const entries = orderedPassiveEffectEntries("p41");
  const round = state.roundState;
  if (!entries.length || !round || !Number.isFinite(round.criticalInteger)) return;
  if (round.criticalInteger % 7 !== 0) return;
  entries.forEach((entry) => {
    const sin = bifronsSinReward(entry);
    if (sin <= 0) return;
    const gained = gainCredits(sin, true, "Seal of Bifrons");
    markPassiveEntryTriggered(entry);
    round.roundEvents.push(`Seal of Bifrons paid ${gained} SIN because the TARGET was a multiple of 7.`);
  });
}

function memoryRawAverage(memoryEntry) {
  if (!memoryEntry) return null;
  if (Number.isFinite(memoryEntry.tableAverage)) return memoryEntry.tableAverage;
  if (Number.isFinite(memoryEntry.target) && Number.isFinite(memoryEntry.targetModifier) && memoryEntry.targetModifier !== 0) {
    const previousOffset = Number.isFinite(memoryEntry.targetOffset) ? memoryEntry.targetOffset : 0;
    return (memoryEntry.target - previousOffset) / memoryEntry.targetModifier;
  }
  return null;
}

function weightedMemoryAverage(entries, readValue) {
  let weighted = 0;
  let totalWeight = 0;
  entries.forEach((entry, index) => {
    const value = readValue(entry);
    if (!Number.isFinite(value)) return;
    const weight = index + 1;
    weighted += value * weight;
    totalWeight += weight;
  });
  return totalWeight ? weighted / totalWeight : null;
}

// Bosses have no personality. They play the best reply to what the table is likely to do:
// estimate the other players' weighted average from the rounds they remember (or a level-1
// guess when they remember nothing), then pick the whole number closest to the TARGET their
// own guess would produce. No noise, no bluffing.
function bossTargetFor(guess, othersSum, othersWeight, ownWeight, modifier, offset) {
  const total = othersWeight + ownWeight;
  if (total <= 0) return guess;
  return Math.ceil(Math.min(200, ((othersSum + guess * ownWeight) / total) * modifier + offset));
}

function bestBossGuess(othersAverage, othersWeight, ownWeight, modifier, offset) {
  const othersSum = othersAverage * othersWeight;
  const total = othersWeight + ownWeight;
  const denominator = 1 - (modifier * ownWeight) / total;
  const solved = Math.abs(denominator) > 0.05 ? ((modifier * othersSum) / total + offset) / denominator : othersAverage * modifier + offset;
  let best = clamp(Math.round(solved), 0, 100);
  let bestMiss = Infinity;
  for (let guess = Math.max(0, best - 6); guess <= Math.min(100, best + 6); guess += 1) {
    const miss = Math.abs(guess - bossTargetFor(guess, othersSum, othersWeight, ownWeight, modifier, offset));
    if (miss < bestMiss || (miss === bestMiss && Math.abs(guess - solved) < Math.abs(best - solved))) {
      best = guess;
      bestMiss = miss;
    }
  }
  return best;
}

function planBossGuess(bot) {
  const memory = bot.memory || [];
  const modifier = state.roundState?.targetModifier ?? currentTargetModifier();
  const offset = state.roundState?.targetOffset ?? 0;
  const ownWeight = botTargetWeight(bot);
  const playerWeight = 1 + wealthWeightBonus();
  const othersWeight =
    playerWeight +
    activeBots()
      .filter((other) => other.id !== bot.id)
      .reduce((sum, other) => sum + botTargetWeight(other), 0);
  const participantWeight = othersWeight + ownWeight;
  const recent = memory.slice(-Math.min(6, memory.length));
  const remembered = weightedMemoryAverage(recent, (entry) => {
    const rawAverage = memoryRawAverage(entry);
    if (!Number.isFinite(rawAverage)) return null;
    if (Number.isFinite(entry.ownGuess) && participantWeight > ownWeight) {
      return (rawAverage * participantWeight - entry.ownGuess * ownWeight) / (participantWeight - ownWeight);
    }
    return rawAverage;
  });
  // nothing remembered: assume the table plays one step of reasoning (50 x modifier)
  const othersAverage = clamp(remembered ?? 50 * clamp(modifier, 0.2, 1.5), 0, 100);
  return clampFixedWillGuess(bot, bestBossGuess(othersAverage, othersWeight, ownWeight, modifier, offset));
}

function clampFixedWillGuess(bot, guess) {
  if (!passiveStack("p107") || personalityType(bot) !== "Stubborn") return guess;
  const previousGuess = bot?.memory?.slice().reverse().find((entry) => Number.isFinite(entry?.ownGuess))?.ownGuess;
  if (!Number.isFinite(previousGuess)) return guess;
  return clamp(guess, previousGuess - 2, previousGuess + 2);
}

function planBotGuess(bot) {
  if (bot.isBoss) return planBossGuess(bot);

  const memory = bot.memory;
  const currentModifier = state.roundState?.targetModifier ?? currentTargetModifier();
  let guess;

  if (!memory.length) {
    guess = bot.anchor + randomInt(-12, 12);
  } else {
    const last = memory[memory.length - 1];
    const prev = memory[memory.length - 2] || last;
    const lastTarget = projectedMemoryTarget(last, currentModifier) ?? last.target;
    const prevTarget = projectedMemoryTarget(prev, currentModifier) ?? prev.target ?? lastTarget;
    const trend = lastTarget - prevTarget;
    const tablePull = Number.isFinite(last.tableAverage) ? last.tableAverage * currentModifier : lastTarget;

    if (bot.type === "Analyst") {
      guess = lastTarget + trend * 0.45 + randomInt(-bot.noise, bot.noise);
    } else if (bot.type === "Follower") {
      guess = last.playerGuess * 0.52 + lastTarget * 0.48 + randomInt(-bot.noise, bot.noise);
    } else if (bot.type === "Stubborn") {
      guess = bot.anchor * 0.72 + lastTarget * 0.28 + randomInt(-bot.noise, bot.noise);
    } else if (bot.type === "Drifter") {
      guess = lastTarget * 0.56 + tablePull * 0.44 + randomInt(-bot.noise * 2, bot.noise * 2);
    } else if (bot.type === "Caller") {
      guess = last.botAverage * 0.62 + lastTarget * 0.38 + randomInt(-bot.noise, bot.noise);
    } else {
      guess = bot.anchor * 0.42 + lastTarget * 0.58 + randomInt(-bot.noise, bot.noise);
    }

    if (bot.isBoss) guess = guess * 0.82 + lastTarget * 0.18;
  }

  if (Math.random() < bot.aggression * 0.62) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    guess += direction * randomInt(5, 16);
  }

  if (Math.random() < bot.aggression * 0.09) {
    guess = randomFrom([0, 100, randomInt(8, 22), randomInt(78, 92), 50 + randomInt(-12, 12)]);
  }

  return Math.ceil(clamp(clampFixedWillGuess(bot, guess), 0, 100));
}

function bossRevealAllowedBySeals() {
  return orderedPassiveEffectEntries("p61").length > 0;
}

function revealedDamnedCount() {
  return activeBots().filter((bot) => bot.revealedByPassive).length;
}

function canRevealBotGuess(bot, options = {}) {
  if (!bot || bot.hp <= 0 || bot.eliminated || botHasPassive(bot, "shield")) return false;
  if (bot.revealedByPassive) return true;
  if (revealedDamnedCount() >= MAX_REVEALED_DAMNED) return false;
  return options.allowBoss || !bot.isBoss || bossRevealAllowedBySeals();
}

function revealBotGuess(bot, source = "", entry = null, options = {}) {
  if (!canRevealBotGuess(bot, options)) return false;
  const wasRevealed = Boolean(bot.revealedByPassive);
  bot.revealedByPassive = true;
  state.roundState?.revealedBotIds?.add(bot.id);
  if (entry && !wasRevealed) markPassiveEntryTriggered(entry);
  if (source && !wasRevealed) addRoundEvent(`${source} revealed ${bot.name}'s guess.`);
  if (!wasRevealed) {
    orderedPassiveEffectEntries("p104").forEach((stubbornEntry) => {
      setBotPersonality(bot, "Stubborn", passiveName("p104", "Seal of Alloces"), { markEntry: stubbornEntry });
    });
  }
  return !wasRevealed;
}

function applyHighMemoryReveals() {
  const entries = orderedPassiveEffectEntries("p81");
  if (!entries.length) return;
  entries.forEach((entry) => {
    state.bots
      .filter((bot) => (bot.memory?.length || 0) > 16)
      .forEach((bot) => revealBotGuess(bot, passiveName("p81", "Seal of Buer"), entry));
  });
}

function applyGuessReveals() {
  if (state.stage !== "guess" || !state.roundState) return;
  const bossRevealAllowed = bossRevealAllowedBySeals();
  const amonEntries = orderedPassiveEffectEntries("p59");
  const revealableBots = state.bots.filter(
    (bot) =>
      (bossRevealAllowed || !bot.isBoss) &&
      bot.hp > 0 &&
      !bot.eliminated &&
      !botHasPassive(bot, "shield")
  );
  const desiredRevealCount = Math.min(revealableBots.length, MAX_REVEALED_DAMNED, 1 + amonEntries.length);
  const revealedCount = revealableBots.filter((bot) => bot.revealedByPassive).length;
  const hiddenBots = shuffled(revealableBots.filter((bot) => !bot.revealedByPassive));
  const newlyRevealed = hiddenBots.slice(0, Math.max(0, desiredRevealCount - revealedCount));
  newlyRevealed.forEach((bot) => {
    revealBotGuess(bot);
  });
  applyHighMemoryReveals();
  applyAmonRevealRewards(revealableBots.filter((bot) => bot.revealedByPassive), amonEntries);
}

function applyAmonRevealRewards(revealedBots, entries = orderedPassiveEffectEntries("p59")) {
  const round = state.roundState;
  if (!round || !entries.length || !revealedBots.length) return;
  entries.forEach((entry) => {
    let triggered = false;
    revealedBots.forEach((bot) => {
      const key = `${entry.sourceId || entry.id}:${bot.id}`;
      if (round.amonRewardKeys.has(key)) return;
      round.amonRewardKeys.add(key);
      const bounty = passiveEntryScaledValue(entry, 2);
      const bountyResult = changeBotSin(bot, bounty, "", { source: ITEMS.p59?.name || "Seal of Amon" });
      const memoryAdded = addBotMemory(bot, 2, "", { source: ITEMS.p59?.name || "Seal of Amon" });
      if (bountyResult.gained > 0 || memoryAdded > 0) triggered = true;
    });
    if (triggered) {
      markPassiveEntryTriggered(entry);
      round.roundEvents.push(`${ITEMS.p59?.name || "Seal of Amon"} rewarded revealed DAMNED with BOUNTY and MEMORY.`);
    }
  });
}

function applyRevealPoisonCounters() {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p61");
  if (!round || !entries.length) return;
  const targets = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated && bot.revealedByPassive);
  if (!targets.length) return;
  entries.forEach((entry) => {
    markPassiveEntryTriggered(entry);
    targets.forEach((bot) => {
      bot.poisonCounters = (bot.poisonCounters || 0) + 1;
    });
  });
  round.roundEvents.push(`Seal of Vepar added poison to ${targets.map((bot) => bot.name).join(", ")}.`);
}

function grantDevTemporaryArtifact(source) {
  const id = randomFrom(ACTIVE_IDS);
  if (!id) return null;
  const active = devTemporaryActiveCopy(id);
  state.player.actives.push(active);
  state.roundState?.devTemporaryActiveUids?.add(active.uid);
  normalizeActiveCarouselIndex();
  addRoundEvent(`${source} granted temporary ${active.name}.`);
  return active;
}

function clearDevTemporaryArtifacts() {
  const round = state.roundState;
  const temporaryUids = round?.devTemporaryActiveUids;
  if (!temporaryUids?.size) return;
  state.player.actives = state.player.actives.filter((item) => !item?.devTemporary && !temporaryUids.has(item?.uid));
  temporaryUids.clear();
  normalizeActiveCarouselIndex();
}

function devSealTargetDamned() {
  return activeBots().filter((bot) => !bot.immortal);
}

function applyDevSealsAtReveal() {
  const round = state.roundState;
  if (!round || round.devSealsRolled) return;
  round.devSealsRolled = true;
  const entries = orderedPassiveEffectEntries(Array.from(DEV_SEAL_IDS));
  if (!entries.length) return;

  entries.forEach((entry) => {
    const source = ITEMS[entry.id]?.name || "Dev Seal";
    if (Math.random() >= devSealEntryChance(entry)) return;
    markPassiveEntryTriggered(entry);

    if (entry.id === "p92") {
      const guess = Math.ceil(round.playerEffectiveGuess);
      if (!Number.isFinite(guess)) return;
      const before = round.target;
      const base = (round.tableAverage || 0) * (round.targetModifier || 0);
      round.targetOffset = guess - base;
      recalculateTarget();
      addRoundEvent(`${source} changed the TARGET from ${formatNumber(before)} to ${formatNumber(round.target)}.`);
      return;
    }

    if (entry.id === "p93") {
      let total = 0;
      devSealTargetDamned().forEach((bot) => {
        const bounty = botRegularBounty(bot);
        if (bounty <= 0) return;
        const result = changeBotSin(bot, bounty, "", { source });
        total += result.gained;
      });
      addRoundEvent(total > 0 ? `${source} doubled ${total} total BOUNTY.` : `${source} found no BOUNTY to double.`);
      return;
    }

    if (entry.id === "p94") {
      const granted = [];
      for (let count = 0; count < 5; count += 1) {
        const artifact = grantDevTemporaryArtifact(source);
        if (artifact) granted.push(artifact.name);
      }
      addRoundEvent(
        granted.length
          ? `${source} gave ${granted.length} temporary ARTIFACTS for this round.`
          : `${source} found no ARTIFACTS to grant.`
      );
      return;
    }

    if (entry.id === "p95") {
      const targets = devSealTargetDamned().filter((bot) => bot.revealedByPassive);
      let total = 0;
      targets.forEach((bot) => {
        const damage = Math.ceil(bot.hp * 0.5);
        total += queueEndOfRoundBotDamage(bot, damage, `${source} burned ${bot.name} for ${damage} damage.`, source);
      });
      addRoundEvent(total > 0 ? `${source} queued ${total} total damage to revealed DAMNED.` : `${source} found no revealed DAMNED.`);
      return;
    }

    if (entry.id === "p96") {
      let changed = 0;
      let vulnerable = 0;
      devSealTargetDamned().forEach((bot) => {
        if (personalityType(bot) === "Stubborn") {
          round.padmaVulnerableBotIds?.add(bot.id);
          vulnerable += 1;
          return;
        }
        if (setBotPersonality(bot, "Stubborn", source)) changed += 1;
      });
      addRoundEvent(`${source} made ${changed} personalities STUBBORN and marked ${vulnerable} already STUBBORN DAMNED for extra damage.`);
      return;
    }

    if (entry.id === "p97") {
      const targets = devSealTargetDamned();
      const memoryReferenceTargets = targets.filter((bot) => !bot.isBoss);
      const maxMemory = Math.max(0, ...(memoryReferenceTargets.length ? memoryReferenceTargets : targets).map((bot) => bot.memory?.length || 0));
      let memoryAdded = 0;
      let damage = 0;
      targets.forEach((bot) => {
        const originalMemory = bot.memory?.length || 0;
        memoryAdded += addBotMemory(bot, Math.max(0, maxMemory - originalMemory), "", { source });
        if (originalMemory > 0) {
          damage += queueEndOfRoundBotDamage(bot, originalMemory, `${source} dealt ${originalMemory} damage to ${bot.name}.`, source);
        }
      });
      addRoundEvent(`${source} used ${maxMemory} as the living MEMORY peak, added ${memoryAdded} MEMORY, and queued ${damage} total damage.`);
      return;
    }

    if (entry.id === "p110") {
      const targets = devSealTargetDamned();
      let memoryRemoved = 0;
      let bountyRemoved = 0;
      targets.forEach((bot) => {
        const memory = bot.memory?.length || 0;
        if (memory > 0) {
          memoryRemoved += memory;
          bot.memory = [];
        }
        const bounty = botRegularBounty(bot);
        if (bounty > 0) {
          const result = changeBotSin(bot, -bounty, "", {
            source,
            triggerLossDamage: false
          });
          bountyRemoved += result.lost;
        }
      });
      const damage = memoryRemoved + bountyRemoved;
      if (damage > 0) {
        queueEndOfRoundBotDamages(
          targets,
          damage,
          (bot, dealt) => `${source} dealt ${dealt} removed MEMORY and BOUNTY damage to ${bot.name}.`,
          source
        );
      }
      addRoundEvent(
        damage > 0
          ? `${source} removed ${memoryRemoved} MEMORY and ${bountyRemoved} BOUNTY, then queued ${damage} damage to every DAMNED.`
          : `${source} found no MEMORY or BOUNTY to remove.`
      );
    }
  });
}

function cloneRoundRevealSources(sources) {
  return (sources || []).map((entry) => ({ ...entry }));
}

function captureRoundRevealSnapshot() {
  const round = state.roundState;
  return {
    stage: state.stage,
    roundEventCount: round?.roundEvents?.length || 0,
    triggeredPassiveIds: Array.from(round?.triggeredPassiveIds || []),
    player: {
      hp: state.player.hp,
      credits: state.player.credits,
      lastDamage: state.playerLastDamage || 0,
      lastHeal: state.playerLastHeal || 0,
      lastCredits: state.playerLastCredits || 0,
      damageSources: cloneRoundRevealSources(state.playerDamageSources),
      healSources: cloneRoundRevealSources(state.playerHealSources),
      creditSources: cloneRoundRevealSources(state.playerCreditSources)
    },
    bots: state.bots.map((bot) => ({
      id: bot.id,
      hp: bot.hp,
      maxHp: bot.maxHp,
      eliminated: Boolean(bot.eliminated),
      damageTakenTotal: bot.damageTakenTotal || 0,
      lastDamage: bot.lastDamage || 0,
      lastHeal: bot.lastHeal || 0,
      lastSinDelta: bot.lastSinDelta || 0,
      lastMemoryDelta: bot.lastMemoryDelta || 0,
      damageSources: cloneRoundRevealSources(bot.damageSources),
      healSources: cloneRoundRevealSources(bot.healSources),
      sinSources: cloneRoundRevealSources(bot.sinSources),
      memorySources: cloneRoundRevealSources(bot.memorySources)
    }))
  };
}

function roundRevealAnimationActive() {
  return Boolean(state.roundRevealAnimation?.active);
}

function clearRoundRevealTimer() {
  if (!roundRevealTimer) return;
  clearTimeout(roundRevealTimer);
  roundRevealTimer = null;
}

function resetRoundRevealAnimation() {
  clearRoundRevealTimer();
  state.roundRevealAnimation = null;
}

function roundRevealSealName(id) {
  const entry = passiveEntry(id);
  return entry ? passiveDisplayName(entry) : ITEMS[id]?.name || "Seal";
}

function roundRevealEventMatchesSeal(id, event) {
  const text = normalizeGameText(event || "");
  const baseName = ITEMS[id]?.name || "";
  const displayName = roundRevealSealName(id);
  return Boolean((baseName && text.includes(baseName)) || (displayName && text.includes(displayName)));
}

function buildRoundRevealSequence(beforeSnapshot) {
  const round = state.roundState;
  if (!round) return [];
  const previousIds = new Set(beforeSnapshot?.triggeredPassiveIds || []);
  const finalEvents = (round.roundEvents || []).slice();
  const eventStart = beforeSnapshot?.roundEventCount || 0;
  return Array.from(round.triggeredPassiveIds || [])
    .filter((id) => PASSIVE_IDS.includes(id) && !previousIds.has(id))
    .map((id) => ({
      id,
      name: roundRevealSealName(id),
      events: finalEvents.slice(eventStart).filter((event) => roundRevealEventMatchesSeal(id, event))
    }));
}

function playRoundRevealStepSfx() {
  playArtifactSfx("a14");
}

function scheduleRoundRevealAnimation() {
  clearRoundRevealTimer();
  if (!roundRevealAnimationActive()) return;
  roundRevealTimer = setTimeout(advanceRoundRevealAnimation, 1000);
}

function startRoundRevealAnimation(beforeSnapshot) {
  const sequence = buildRoundRevealSequence(beforeSnapshot);
  if (!sequence.length) return false;
  clearRoundRevealTimer();
  state.roundRevealAnimation = {
    active: true,
    phase: "seal",
    stepIndex: 0,
    sequence,
    before: beforeSnapshot
  };
  playRoundRevealStepSfx();
  scheduleRoundRevealAnimation();
  return true;
}

function advanceRoundRevealAnimation() {
  const animation = state.roundRevealAnimation;
  if (!animation?.active) return;
  if (animation.phase === "seal") {
    // the slam at the end of the fill is the sound of this step now
    animation.phase = "effect";
    render();
    scheduleRoundRevealAnimation();
    return;
  }
  animation.stepIndex += 1;
  if (animation.stepIndex >= animation.sequence.length) {
    finishRoundRevealAnimation();
    return;
  }
  animation.phase = "seal";
  playRoundRevealStepSfx();
  render();
  scheduleRoundRevealAnimation();
}

function finishRoundRevealAnimation() {
  resetRoundRevealAnimation();
  render();
}

function submitGuess() {
  if (state.stage !== "guess" || state.gameOver) return;
  const input = document.querySelector("#guessInput");
  const rawGuess = (input?.value || "").trim();
  const submitted = Number(rawGuess);
  const maxGuess = playerGuessLimit();
  if (!rawGuess || !Number.isFinite(submitted) || submitted < 0 || submitted > maxGuess) {
    showInvalidGuessPopup();
    return;
  }

  playGuessSfx();
  const guess = Math.ceil(submitted);
  const round = state.roundState;
  round.playerSubmittedGuess = guess;
  round.playerEffectiveGuess = applyGuessMutation("Player", guess);

  state.bots.filter((bot) => !bot.eliminated).forEach((bot) => {
    round.botSubmittedGuesses.set(bot.id, bot.plannedGuess);
    round.botEffectiveGuesses.set(bot.id, applyGuessMutation(bot.name, bot.plannedGuess, bot));
  });
  applyFurcasLastTargetGuessSet();

  round.edgeGambitStacks = 0;

  recalculateTarget();
  applyDevSealsAtReveal();
  state.stage = "active";
  addLog(`Target revealed at ${formatNumber(round.target)}. CRITICAL integer: ${round.criticalInteger}.`);
  render();
}

function applyGuessMutation(name, guess, bot = null) {
  if (bot) return guess;
  return applyCorruptionGuessMutation(guess);
}

function botTargetWeight(bot) {
  return bot?.finalKey === "jesus" ? 3 : 1;
}

function recalculateTarget() {
  const round = state.roundState;
  let weightedTotal = 0;
  let totalWeight = 0;

  const addWeightedGuess = (guess, weight = 1) => {
    if (!Number.isFinite(guess) || weight <= 0) return;
    weightedTotal += guess * weight;
    totalWeight += weight;
  };

  const sinWeight = wealthWeightBonus();
  const playerWeight = 1 + sinWeight;
  addWeightedGuess(round.playerEffectiveGuess, playerWeight);

  state.bots.forEach((bot) => {
    const guess = round.botEffectiveGuesses.get(bot.id);
    if (!round.removedBotIds.has(bot.id)) {
      addWeightedGuess(guess, botTargetWeight(bot));
    }
  });

  round.extraAverageGuesses.forEach((entry) => {
    addWeightedGuess(entry.guess);
  });

  round.tableAverage = totalWeight ? weightedTotal / totalWeight : 0;
  const rawTarget = round.tableAverage * round.targetModifier + round.targetOffset;
  round.target = Math.ceil(Math.min(200, rawTarget));
  round.criticalInteger = round.target;
}

function readyRound() {
  if (state.stage !== "active" || !state.roundState || state.roundState.penaltiesApplied) return;
  if (state.pendingActive) {
    addLog("Finish the Artifact target first.");
    render();
    return;
  }
  const beforeReveal = captureRoundRevealSnapshot();
  playReadySfx();
  applyPenalties();
  if (startRoundRevealAnimation(beforeReveal)) {
    render();
    return;
  }
  render();
}

function performMainAction() {
  if (roundRevealAnimationActive()) {
    finishRoundRevealAnimation();
    return;
  }
  if (state.stage === "guess") submitGuess();
  else if (state.stage === "active") readyRound();
  else if (state.stage === "summary") {
    playNextRoundSfx();
    advanceAfterSummary();
  } else if (state.stage === "ended") {
    startGame();
  }
}

function shouldUseArcadeEnterShortcut(event) {
  if (event.key !== "Enter" || event.defaultPrevented) return false;
  if (state.mode !== "arcade" || state.pauseOpen) return false;
  if (!["guess", "active", "summary", "ended"].includes(state.stage)) return false;
  const target = event.target;
  if (target?.closest?.("button, a, select, textarea, [contenteditable='true']")) return false;
  if (target?.tagName === "INPUT" && target.id !== "guessInput") return false;
  const mainAction = document.querySelector("#mainAction");
  return Boolean(mainAction && !mainAction.disabled);
}

function installArcadeEnterShortcut() {
  document.addEventListener("keydown", (event) => {
    if (!shouldUseArcadeEnterShortcut(event)) return;
    event.preventDefault();
    document.querySelector("#mainAction")?.click();
  });
}

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

function applyStubbornWitnessEndRoundGrowth() {
  const entries = orderedPassiveEffectEntries("p104");
  if (!entries.length) return;
  const targets = state.bots.filter((bot) => bot && bot.hp > 0 && !bot.eliminated && personalityType(bot) === "Stubborn");
  if (!targets.length) return;
  entries.forEach((entry) => {
    const amount = Math.max(0, Math.ceil(entry.stack || 1));
    if (amount <= 0) return;
    const source = passiveName("p104", "Seal of Alloces");
    let totalMemory = 0;
    let totalBounty = 0;
    targets.forEach((bot) => {
      totalMemory += addBotMemory(bot, amount, "", { source });
      totalBounty += changeBotSin(bot, amount, "", { triggerLossDamage: false, source }).gained;
    });
    if (totalMemory > 0 || totalBounty > 0) {
      markPassiveEntryTriggered(entry);
      state.roundState?.roundEvents.push(`${source} gave STUBBORN DAMNED ${totalMemory} MEMORY and ${totalBounty} BOUNTY.`);
    }
  });
}

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
  applyStubbornWitnessEndRoundGrowth();
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
    if (!existing && !hasSealSlotRoomFor(item)) {
      addLog(SATAN_SEAL_IDS.has(item.id) ? "Need 2 empty Seal slots." : "Seal slots are full.");
      render();
      return;
    }
    spendCredits(cost);
    if (existing) {
      existing.stack = (existing.stack || 1) + 1;
      recordEliteLevelBought(existing.id, existing.stack);
      addLog(`Upgraded ${existing.name} to ${passiveDisplayName(existing)}.`);
    } else {
      const boughtSeal = itemCopy(item.id);
      state.player.passives.push(boughtSeal);
      refreshMimicTarget();
      addLog(`Bought ${item.name}.`);
    }
    recordPlayedSeal(item.id);
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
  playGameSfx("artifactBuy");
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
  playGameSfx("reroll");
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
  playGameSfx("sell");
  quietMomentSfx("sinGain");
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
  playGameSfx("sell");
  quietMomentSfx("sinGain");
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

function addArtifactCriticalRangeBonus(amount, source) {
  if (!state.roundState) return 0;
  const bonus = Math.max(0, Math.ceil(amount || 0));
  state.roundState.artifactCriticalRangeBonus = Math.max(0, Math.ceil(state.roundState.artifactCriticalRangeBonus || 0)) + bonus;
  return state.roundState.artifactCriticalRangeBonus;
}

function snapshotDamnedAbility(bot) {
  return {
    type: personalityType(bot),
    passiveKeys: [...(bot?.passiveKeys || [])],
    buffPassiveKey: bot?.buffPassiveKey || null
  };
}

function applyDamnedAbilitySnapshot(bot, snapshot, source) {
  if (!bot || !snapshot) return false;
  let changed = false;
  if (snapshot.type) {
    changed = setBotPersonality(bot, snapshot.type, source) || changed;
  }
  const passiveKeys = (snapshot.passiveKeys || []).filter((key) => BOSS_PASSIVES[key] || PYROS_GIFT_PASSIVES[key]);
  const buffPassiveKey = PYROS_GIFT_PASSIVES[snapshot.buffPassiveKey] ? snapshot.buffPassiveKey : null;
  if (JSON.stringify(bot.passiveKeys || []) !== JSON.stringify(passiveKeys)) {
    bot.passiveKeys = [...passiveKeys];
    changed = true;
  }
  if ((bot.buffPassiveKey || null) !== buffPassiveKey) {
    bot.buffPassiveKey = buffPassiveKey;
    changed = true;
  }
  return changed;
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
  if (TARGETED_ARTIFACT_IDS.has(item.id) || item.id === "a11") {
    state.pendingActive = { index: -1, uid: item.uid, id: item.id, mode: "bot", copiedItem: item, copiedByName: copierName };
    if (item.id === "a11") state.pendingActive.step = "damage";
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
    const total = addArtifactCriticalRangeBonus(1, item.name);
    recordCopiedArtifactResolution(copierName, item, `${item.name} raised your CRITICAL range by +1 this round. Total ARTIFACT bonus: +${total}.`);
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

  if (item.id === "a11") {
    const nonBossTargets = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated && !bot.isBoss);
    if (nonBossTargets.length < 2) {
      addLog(`${item.name} needs two non-boss DAMNED.`);
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

  if (item.id === "a11") {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot", step: "damage", damageBotId: null };
    closeMobileOfferingsForTargetPick();
    addLog("Pick a non-boss DAMNED to take 30% max-HEALTH damage.");
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
    const total = addArtifactCriticalRangeBonus(1, item.name);
    consumeActive(index, `${item.name} raised your CRITICAL range by +1 this round. Total ARTIFACT bonus: +${total}.`, item.uid);
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
  if (pending.id === "a11" && pending.step === "heal") {
      addLog(`${itemName} has already hit; choose an overheal target to finish it.`);
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
  playArtifactSfx(item.id);
  recordPlayedArtifact(item.id);
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
    queueMummifiedLambNextRoundReveal(bot, itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} marked ${bot.name}. Next round, its guess is revealed and it gains +3 BOUNTY.`);
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
    const value = artifactValue(6);
    const healAmount = Math.ceil((bot.maxHp || 0) * artifactPercent(6));
    const memoryAdded = addBotMemory(bot, value, "", { source: itemName });
    changeBotSin(bot, value, `${itemName} gave ${bot.name} +${value} SIN.`, { triggerLossDamage: false });
    const healed = healBot(bot, healAmount, itemName, itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} gave ${bot.name} +${memoryAdded} memory, +${value} SIN, and healed ${healed}.`);
    return;
  }

  if (id === "a11") {
    resolveBloodVial(bot);
  }
}

function resolveBloodVial(bot) {
  const pending = state.pendingActive;
  const item = pendingArtifactItem();
  const itemName = item?.name || activeName("a11");
  if (pending.step === "damage") {
    if (bot.isBoss) {
      addLog(`${itemName} cannot target BOSSES.`);
      render();
      return;
    }
    const possibleHealTargets = state.bots.filter(
      (candidate) => candidate.id !== bot.id && candidate.hp > 0 && !candidate.eliminated && !candidate.isBoss
    );
    if (!possibleHealTargets.length) {
      addLog("Pick a target that leaves another non-boss DAMNED to overheal.");
      render();
      return;
    }
    const damage = Math.ceil((bot.maxHp || 0) * artifactPercent(30));
    damageBot(bot, damage, `${itemName} dealt ${damage} damage to ${bot.name}.`, itemName);
    applyTargetedItemSinGain(item, [bot]);
    pending.step = "heal";
    pending.damageBotId = bot.id;
    pending.copiedAbility = snapshotDamnedAbility(bot);
    pending.copiedAbilityName = bot.name;
    addLog("Now pick another non-boss DAMNED to overheal and receive the copied ability.");
    render();
    return;
  }

  if (pending.step === "heal") {
    if (bot.id === pending.damageBotId) {
      addLog("Choose another DAMNED to receive the heal.");
      render();
      return;
    }
    if (bot.isBoss) {
      addLog(`${itemName} cannot target BOSSES.`);
      render();
      return;
    }
    const healAmount = Math.ceil((bot.maxHp || 0) * artifactPercent(30));
    const healed = healBot(bot, healAmount, itemName, itemName, { allowOverheal: true });
    const copied = applyDamnedAbilitySnapshot(bot, pending.copiedAbility, itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(
      pending.index,
      `${itemName} overhealed ${bot.name} for ${healed} and ${copied ? "copied" : "matched"} ${pending.copiedAbilityName || "the first DAMNED"}'s ability.`
    );
  }
}

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
    if (saved > 0) participant.damageSources.push({ amount: saved, source: "Dark Talisman", kind: "saved" });
  }
  if (reason) {
    state.pvp.activeResults.push(reason);
    if (saved > 0) state.pvp.activeResults.push(`Dark Talisman saved ${participant.name} ${saved} health.`);
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
      pvpDamageParticipant(target, 5, `${target.name} took 5 as one of the closest guesses.`, "Sacrificial Dagger")
    );
  } else if (active.id === "jam") {
    const target = pvp.slots.find((candidate) => candidate?.id === participant.activeTargetId);
    if (target && !target.eliminated) {
      pvp.removedIds.add(target.id);
      pvp.activeResults.push(`${participant.name} used Inverted Cross on ${target.name}; ${target.name}'s guess no longer counts.`);
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
              icon: active.icon || null,
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

/* ---------- In-place screen updates ----------
   During a run the screen is patched instead of rebuilt: elements that did not
   change stay in the page (no image re-decode, no layout from scratch, running
   animations keep running). An element whose inline style changed is swapped
   for a fresh one, because inline styles carry the animation timing
   (hudPopAttrs, hitShakeAttrs, sealSummonAttrs) and those rely on a new element. */
const MORPH_LIVE_STYLE = /--ring-[a-z]+\s*:\s*[^;]*;?/g;
let lastRenderedMode = null;

function bindOn(element, type, handler, options) {
  const store = element.__dearthHandlers || (element.__dearthHandlers = {});
  if (store[type]) element.removeEventListener(type, store[type]);
  store[type] = handler;
  element.addEventListener(type, handler, options);
}

function morphStyleKey(element) {
  return (element.getAttribute("style") || "").replace(MORPH_LIVE_STYLE, "").replace(/\s+/g, "");
}

function morphSameNode(current, next) {
  if (current.nodeType !== next.nodeType) return false;
  if (current.nodeType !== 1) return true;
  if (current.nodeName !== next.nodeName) return false;
  if ((current.getAttribute("id") || "") !== (next.getAttribute("id") || "")) return false;
  if (current.getAttribute("data-morph-key") !== next.getAttribute("data-morph-key")) return false;
  if (morphStyleKey(current) !== morphStyleKey(next)) return false;
  if (current.nodeName === "IMG" && current.getAttribute("src") !== next.getAttribute("src")) return false;
  return true;
}

function morphAttributes(current, next) {
  const liveStyle = (current.getAttribute("style") || "").match(MORPH_LIVE_STYLE);
  for (const attr of Array.from(current.attributes)) {
    if (attr.name === "style") continue;
    if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
  }
  for (const attr of Array.from(next.attributes)) {
    if (attr.name === "style") continue;
    if (current.getAttribute(attr.name) !== attr.value) {
      if (current.nodeName === "INPUT" && attr.name === "value") current.value = attr.value;
      current.setAttribute(attr.name, attr.value);
    }
  }
  if (!liveStyle && !next.hasAttribute("style") && current.hasAttribute("style")) current.removeAttribute("style");
  if (current.nodeName === "INPUT") {
    if (!next.hasAttribute("value") && current.type !== "checkbox" && current.type !== "range" && current.value && document.activeElement !== current) current.value = "";
    if (current.type === "checkbox") current.checked = next.hasAttribute("checked");
    if (current.type === "range" && next.hasAttribute("value")) current.value = next.getAttribute("value");
  }
}

function morphNode(current, next) {
  if (current.nodeType !== 1) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }
  morphAttributes(current, next);
  morphChildren(current, next);
}

function morphChildren(current, next) {
  let a = current.firstChild;
  let b = next.firstChild;
  while (b) {
    const nextB = b.nextSibling;
    if (!a) {
      current.appendChild(b);
    } else if (morphSameNode(a, b)) {
      morphNode(a, b);
      a = a.nextSibling;
    } else {
      const nextA = a.nextSibling;
      current.replaceChild(b, a);
      a = nextA;
    }
    b = nextB;
  }
  while (a) {
    const nextA = a.nextSibling;
    current.removeChild(a);
    a = nextA;
  }
}

function patchAppHtml(app, html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  morphChildren(app, template.content);
}

function render() {
  updateFullscreenLayoutClass();
  const app = document.querySelector("#app");
  const className = `app ${state.mode === "pvp" ? "pvp-app" : ""} ${state.mode === "menu" ? "menu-app" : ""}`;
  const html = state.mode === "menu" ? renderMenuApp() : state.mode === "pvp" ? renderPvpApp() : renderArcadeApp();
  const canPatch = window.dearthDomMorph !== false && state.mode === "arcade" && lastRenderedMode === "arcade" && app.className === className && app.firstElementChild;
  if (app.className !== className) app.className = className;
  if (canPatch) patchAppHtml(app, html);
  else app.innerHTML = html;
  lastRenderedMode = state.mode;
  bindEvents();
  afterRenderEffects();
  if (state.mode === "menu") initMenuBackdrop();
  focusGuessInputAfterRender();
  saveArcadeRun();
}

function focusGuessInputAfterRender() {
  if (!state.shouldFocusGuessInput) return;
  if (state.mode !== "arcade" || state.stage !== "guess" || state.pauseOpen || state.gameOver || state.pendingActive || state.mobileOfferingsOpen) return;
  const input = document.querySelector("#guessInput");
  if (!input || input.disabled || input.readOnly) {
    state.shouldFocusGuessInput = false;
    return;
  }
  const focus = () => {
    if (document.activeElement === input) {
      state.shouldFocusGuessInput = false;
      return;
    }
    input.focus({ preventScroll: true });
    input.select();
    state.shouldFocusGuessInput = false;
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(focus);
  } else {
    focus();
  }
}

function renderMenuApp() {
  const screen = state.menuScreen || "main";
  return `
    <main class="main-menu" aria-label="main menu">
      ${menuBackdropState.node ? `<div class="menu-backdrop-slot"></div>` : renderMenuBackdrop()}
      <section class="main-menu-panel menu-screen-${escapeAttr(screen)}">
        ${
          screen === "play"
            ? renderPlayMenu()
            : screen === "arcade-options"
              ? renderArcadeOptionsMenu()
            : screen === "arcade-runs"
              ? renderArcadeRunsMenu()
            : screen === "options"
              ? renderOptionsMenu()
              : screen === "sound"
                ? renderSoundOptionsMenu()
                : screen === "records"
                  ? renderRecordsMenu()
                  : screen === "quit"
                    ? renderQuitMenu()
                    : renderMainMenu()
        }
      </section>
    </main>
    ${screen === "main" ? `<div class="menu-version">v${escapeHtml(GAME_VERSION)} &middot; early build</div>` : ""}
    <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
  `;
}

function renderMainMenu() {
  return `
    <div class="main-menu-actions">
      <button class="menu-button" data-menu-action="play">Play</button>
      <button class="menu-button" data-menu-action="options">Options</button>
      <button class="menu-button" data-menu-action="quit">Quit</button>
    </div>
  `;
}

function formatRunStartedAt(timestamp) {
  const date = new Date(Number(timestamp) || Date.now());
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderPlayMenu() {
  return `
    <div class="main-menu-actions">
      <button class="menu-button" data-menu-action="arcade">Arcade</button>
      ${isNativeArcadeApp() ? "" : `<button class="menu-button" data-menu-action="pvp">PvP</button>`}
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
    </div>
  `;
}

function renderArcadeOptionsMenu() {
  const primaryButton = hasSavedArcadeRun()
    ? `<button class="menu-button" data-menu-action="continue-arcade">Continue</button>`
    : `<button class="menu-button" data-new-run="arcade-options">New Run</button>`;
  return `
    <div class="main-menu-actions">
      ${primaryButton}
      <button class="menu-button" data-menu-action="load-run">Load Run</button>
      <button class="menu-button secondary-menu-button" data-menu-action="play">Back</button>
    </div>
  `;
}

function renderArcadeRunsMenu() {
  const savedSlots = readArcadeRunSlots();
  const emptyCount = Math.max(0, ARCADE_RUN_SLOT_COUNT - savedSlots.length);
  const pendingDeleteSlot = savedSlots.find((slot) => slot.slotId === state.pendingRunDeleteSlotId);
  const savedRows = savedSlots
    .map(
      (slot) => `
        <article class="run-slot-row">
          <button class="run-slot-button saved-run-slot" data-run-slot-id="${escapeAttr(slot.slotId)}">
            <span class="run-slot-label">Continue Run</span>
            <span class="run-slot-date">${escapeHtml(formatRunStartedAt(slot.startedAt))}</span>
          </button>
          <button
            class="run-remove-button"
            data-remove-run-slot-id="${escapeAttr(slot.slotId)}"
            data-tooltip="REMOVE RUN"
            aria-label="Remove run"
          >X</button>
        </article>
      `
    )
    .join("");
  const emptyRows = Array.from({ length: emptyCount }, (_, index) => {
    return `
      <button class="run-slot-button empty-run-slot" data-new-run="${index}">
        <span class="run-slot-label">New Run</span>
      </button>
    `;
  }).join("");
  return `
    <div class="run-menu">
      <div class="run-slot-list" aria-label="Saved runs">
        ${savedRows}${emptyRows}
      </div>
      ${
        pendingDeleteSlot
          ? `
            <div class="run-remove-confirm">
              <div>Are You Sure You Want To Remove This Run?</div>
              <div class="run-remove-confirm-date">${escapeHtml(formatRunStartedAt(pendingDeleteSlot.startedAt))}</div>
              <div class="run-remove-confirm-actions">
                <button class="small-button" data-confirm-remove-run="${escapeAttr(pendingDeleteSlot.slotId)}">Yes</button>
                <button class="small-button" data-cancel-remove-run>No</button>
              </div>
            </div>
          `
          : ""
      }
      <button class="menu-button secondary-menu-button" data-menu-action="arcade">Back</button>
    </div>
  `;
}

function renderOptionsMenu() {
  return `
    <div class="main-menu-actions">
      <button class="menu-button" data-menu-action="sound-options">Settings</button>
      <button class="menu-button" data-menu-action="records">Records</button>
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
    </div>
  `;
}

function renderSoundOptionsMenu() {
  return `
    <div class="options-menu">
      ${renderSoundSettings("menu")}
      <button class="menu-button secondary-menu-button" data-menu-action="options">Back</button>
    </div>
  `;
}

function recordValueText(record, { withName = false, prefix = "" } = {}) {
  const value = Math.max(0, Math.ceil(Number(record?.value) || 0));
  if (value <= 0) return "None";
  const label = withName && record?.name ? ` - ${record.name}` : "";
  return `${prefix}${formatNumber(value)}${label}`;
}

function renderRecordRow(label, value) {
  return `
    <div class="record-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderRecordsMenu() {
  const records = loadArcadeRecords();
  const rows = [
    renderRecordRow("Most Eliminations", recordValueText(records.mostEliminations)),
    renderRecordRow("Most Boss Eliminations", recordValueText(records.mostBossEliminations)),
    renderRecordRow("Most Overall Damage", recordValueText(records.mostOverallDamage)),
    renderRecordRow("Most Single Round Damage", recordValueText(records.mostSingleRoundDamage)),
    renderRecordRow("Highest Round Reached", recordValueText(records.highestRoundReached)),
    renderRecordRow("Most Pentakills In A Single Run", recordValueText(records.mostPentakills)),
    renderRecordRow("Most Overall Damage By One Seal", recordValueText(records.mostOverallSealDamage, { withName: true })),
    renderRecordRow("Most Damage By One Seal In A Round", recordValueText(records.mostRoundSealDamage, { withName: true })),
    renderRecordRow("Highest Elite Level Bought", recordValueText(records.highestEliteLevel, { withName: true, prefix: "ELITE " })),
    renderRecordRow("Most Played Seal", recordValueText(records.mostPlayedSeal, { withName: true })),
    renderRecordRow("Most Played Artifact", recordValueText(records.mostPlayedArtifact, { withName: true }))
  ].join("");
  return `
    <div class="records-menu">
      <h2 class="records-title">Records</h2>
      <div class="records-list">${rows}</div>
      <button class="menu-button secondary-menu-button" data-menu-action="options">Back</button>
    </div>
  `;
}

function renderSoundSettings(prefix) {
  const musicValue = Math.round(state.sound.musicVolume * 100);
  const sfxValue = Math.round(state.sound.sfxVolume * 100);
  const musicId = `${prefix}MusicVolume`;
  const sfxId = `${prefix}SfxVolume`;
  const muteId = `${prefix}SoundMuted`;
  return `
      <div class="sound-setting">
        <label for="${musicId}">Music</label>
        <input id="${musicId}" class="sound-slider" data-sound-setting="musicVolume" type="range" min="0" max="100" step="1" value="${musicValue}" />
        <strong data-sound-value="musicVolume">${musicValue}%</strong>
      </div>
      <div class="sound-setting">
        <label for="${sfxId}">Sfx</label>
        <input id="${sfxId}" class="sound-slider" data-sound-setting="sfxVolume" type="range" min="0" max="100" step="1" value="${sfxValue}" />
        <strong data-sound-value="sfxVolume">${sfxValue}%</strong>
      </div>
      <label class="sound-toggle">
        <input id="${muteId}" data-sound-setting="muted" type="checkbox" ${state.sound.muted ? "checked" : ""} />
        <span>Mute Sound</span>
      </label>
      <div class="sound-setting">
        <label for="${prefix}OutlineBoil">Outlines</label>
        <input id="${prefix}OutlineBoil" class="sound-slider" data-display-setting="outlineBoil" type="range" min="0" max="3" step="1" value="${state.display.outlineBoil}" />
        <strong data-display-value="outlineBoil">${OUTLINE_BOIL_LABELS[state.display.outlineBoil] || "Off"}</strong>
      </div>
  `;
}

function renderQuitMenu() {
  return `
    <div class="main-menu-actions">
      <div class="quit-copy">Close The Tab To Leave The Table.</div>
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
    </div>
  `;
}

function renderArcadeApp() {
  const mobileArcade = isMobileArcadeView();
  if (isNativeArcadeApp() && state.pauseOpen) {
    return `
      <main class="pause-scene" aria-label="Paused game">
        ${renderPauseMenu()}
      </main>
      <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
    `;
  }
  if (isNativeArcadeApp()) {
    const targetPicking = state.pendingActive?.mode === "bot";
    if (targetPicking) {
      return `
        <div class="native-arcade-frame target-picking">
          <main class="arena native-board-panel">
            ${renderTopbar()}
            ${renderBots()}
            ${renderOverlay()}
            ${renderPentakillPopup()}
          </main>
          ${renderNativeTargetPickPanel()}
        </div>
        <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
      `;
    }
    const playerGuessCritical = Boolean(state.roundState?.criticalHitKeys?.has("player"));
    return `
      <div class="native-arcade-frame">
        <main class="arena native-board-panel">
          ${renderTopbar()}
          ${renderBots()}
          ${renderOverlay()}
          ${renderPentakillPopup()}
        </main>
        <div class="native-seal-actions" aria-label="Menu controls">
          ${renderPauseButton()}
          ${renderMobileOfferingsButton()}
        </div>
        <section class="native-console-panel ${playerGuessCritical ? "critical-guess-panel" : ""}" aria-label="Player guess">
          ${renderConsole()}
        </section>
        ${renderNativeInputPanel()}
        ${renderPassives()}
      </div>
      ${renderMobileOfferingsBackdrop()}
      <aside class="side-panel ${mobileArcade && state.mobileOfferingsOpen ? "mobile-open" : ""}">
        ${renderMobileOfferingsHeader()}
        ${renderShop()}
        ${renderActives()}
      </aside>
      <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
      ${renderMoment()}
    `;
  }
  return `
    <div class="play-column">
      <main class="arena">
        ${renderPauseButton()}
        ${renderMobileOfferingsButton()}
        ${renderTopbar()}
        ${renderBots()}
        ${renderConsole()}
        ${renderOverlay()}
        ${renderPauseMenu()}
        ${renderPentakillPopup()}
      </main>
      ${renderPassives()}
    </div>
    ${renderMobileOfferingsBackdrop()}
    <aside class="side-panel ${mobileArcade && state.mobileOfferingsOpen ? "mobile-open" : ""}">
      ${renderMobileOfferingsHeader()}
      ${renderShop()}
      ${renderActives()}
    </aside>
    <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
    ${renderMoment()}
  `;
}

function isMobileArcadeView() {
  return document.body.classList.contains("mobile-arcade");
}

function closeMobileOfferingsForTargetPick() {
  if (isMobileArcadeView()) state.mobileOfferingsOpen = false;
}

function renderMobileOfferingsButton() {
  if (!isMobileArcadeView()) return "";
  return `<button class="mobile-offerings-button" id="mobileOfferingsToggle" aria-label="Open Devil's Offerings">Offerings</button>`;
}

function renderMobileOfferingsHeader() {
  if (!isMobileArcadeView()) return "";
  const playerSin = Math.max(0, Math.ceil(Number(state.player.credits) || 0));
  return `
    <div class="mobile-offerings-header">
      <div class="shop-title-wrap">
        <div class="panel-title">Devil's Offerings</div>
        <div class="elite-chance-label">${Math.round(eliteShopChance() * 100)}% ELITE</div>
      </div>
      <div class="mobile-offerings-sin">${formatNumber(playerSin)}${SIN_MARK}</div>
      <button class="small-button" id="mobileOfferingsClose">Close</button>
    </div>
  `;
}

function renderMobileOfferingsBackdrop() {
  if (!isMobileArcadeView()) return "";
  return `<div class="mobile-offerings-backdrop ${state.mobileOfferingsOpen ? "visible" : ""}" id="mobileOfferingsBackdrop"></div>`;
}

function renderPauseButton() {
  return `<button class="pause-button" id="pauseButton" aria-label="Pause">Pause</button>`;
}

function currentRoundRevealStep() {
  const animation = state.roundRevealAnimation;
  if (!animation?.active) return null;
  return animation.sequence?.[animation.stepIndex] || null;
}

function roundRevealEffectActive() {
  return state.roundRevealAnimation?.active && state.roundRevealAnimation.phase === "effect";
}

function roundRevealVisibleSealIds() {
  const animation = state.roundRevealAnimation;
  if (!animation?.active) return null;
  const visibleCount = Math.max(0, animation.stepIndex + (animation.phase === "effect" ? 1 : 0));
  return new Set((animation.sequence || []).slice(0, visibleCount).map((step) => step.id));
}

function roundRevealFilterSources(sources) {
  const visibleSealIds = roundRevealVisibleSealIds();
  if (!visibleSealIds) return sources || [];
  if (!visibleSealIds.size) return [];
  return (sources || []).filter((entry) => visibleSealIds.has(sealIdFromStatSource(entry?.source)));
}

function roundRevealSourceTotal(sources, { signed = false, damage = false } = {}) {
  return (sources || []).reduce((sum, entry) => {
    if (damage && entry?.kind === "saved") return sum;
    const raw = Number(entry?.amount || 0);
    if (!Number.isFinite(raw) || raw === 0) return sum;
    const amount = raw > 0 ? Math.ceil(raw) : -Math.ceil(Math.abs(raw));
    return sum + (signed ? amount : Math.abs(amount));
  }, 0);
}

function roundRevealBotSnapshot(bot) {
  return state.roundRevealAnimation?.before?.bots?.find((entry) => entry.id === bot?.id) || null;
}

function roundRevealBotDisplay(bot) {
  if (!roundRevealAnimationActive()) return null;
  const before = roundRevealBotSnapshot(bot);
  const damageSources = roundRevealFilterSources(bot.damageSources);
  const healSources = roundRevealFilterSources(bot.healSources);
  const sinSources = roundRevealFilterSources(bot.sinSources);
  const memorySources = roundRevealFilterSources(bot.memorySources);
  const damage = roundRevealSourceTotal(damageSources, { damage: true });
  const healing = roundRevealSourceTotal(healSources);
  const sin = roundRevealSourceTotal(sinSources, { signed: true });
  const memory = roundRevealSourceTotal(memorySources);
  const baseHp = Number.isFinite(before?.hp) ? before.hp : bot.hp;
  const displayHp = Math.max(0, Math.ceil(baseHp - damage + healing));
  return {
    hp: displayHp,
    maxHp: Number.isFinite(before?.maxHp) ? before.maxHp : bot.maxHp,
    eliminated: before ? Boolean(before.eliminated) || displayHp <= 0 : bot.eliminated || displayHp <= 0,
    damageTakenTotal: (before?.damageTakenTotal || 0) + damage,
    lastDamage: damage,
    lastHeal: healing,
    lastSinDelta: sin,
    lastMemoryDelta: memory,
    damageSources,
    healSources,
    sinSources,
    memorySources
  };
}

function roundRevealPlayerDisplay() {
  if (!roundRevealAnimationActive()) {
    return {
      hp: state.player.hp,
      credits: state.player.credits,
      lastDamage: state.playerLastDamage,
      lastHeal: state.playerLastHeal,
      lastCredits: state.playerLastCredits,
      damageSources: state.playerDamageSources,
      healSources: state.playerHealSources,
      creditSources: state.playerCreditSources
    };
  }
  const before = state.roundRevealAnimation.before?.player || {};
  const damageSources = roundRevealFilterSources(state.playerDamageSources);
  const healSources = roundRevealFilterSources(state.playerHealSources);
  const creditSources = roundRevealFilterSources(state.playerCreditSources);
  const damage = roundRevealSourceTotal(damageSources, { damage: true });
  const healing = roundRevealSourceTotal(healSources);
  const credits = roundRevealSourceTotal(creditSources);
  return {
    hp: Math.max(0, Math.ceil((before.hp ?? state.player.hp) - damage + healing)),
    credits: Math.ceil((before.credits ?? state.player.credits) + credits),
    lastDamage: damage,
    lastHeal: healing,
    lastCredits: credits,
    damageSources,
    healSources,
    creditSources
  };
}

function renderNativeInputPanel() {
  if (state.pendingActive?.mode === "bot") return renderNativeTargetPickPanel();
  return renderMobileNumpad();
}

function renderNativeTargetPickPanel() {
  const pendingText = renderPendingText();
  return `
    <section class="native-target-pick-panel" aria-label="Pick target">
      <div class="native-target-pick-title">Pick a DAMNED</div>
      <div class="native-target-pick-copy">${escapeHtml(normalizeGameText(pendingText))}</div>
      <button id="cancelPendingActive" class="small-button pending-cancel native-target-cancel">Cancel</button>
    </section>
  `;
}

function mobileNumpadEnabled() {
  return isNativeArcadeApp() && state.mode === "arcade" && state.stage === "guess" && !state.gameOver && !state.pauseOpen;
}

function renderMobileNumpad() {
  if (!isNativeArcadeApp() || state.pendingActive?.mode === "bot") return "";
  const numberDisabled = mobileNumpadEnabled() ? "" : "disabled";
  const { buttonText, disabled } = consoleActionState();
  const keys = [
    ["1", "1"],
    ["2", "2"],
    ["3", "3"],
    ["4", "4"],
    ["5", "5"],
    ["6", "6"],
    ["7", "7"],
    ["8", "8"],
    ["9", "9"],
    ["action", buttonText],
    ["0", "0"],
    ["backspace", "DEL"]
  ];
  return `
    <section class="mobile-numpad" aria-label="Number pad">
      ${keys
        .map(([key, label]) =>
          key === "action"
            ? `<button type="button" id="mainAction" class="mobile-numpad-key mobile-numpad-action" ${disabled}>${label}</button>`
            : `<button type="button" class="mobile-numpad-key" data-numpad-key="${key}" ${numberDisabled}>${label}</button>`
        )
        .join("")}
    </section>
  `;
}

function renderPauseMenu() {
  if (!state.pauseOpen) return "";
  const modeButton = state.mode === "pvp" ? "Arcade" : "PvP";
  const modeAction = state.mode === "pvp" ? "arcade" : "pvp";
  const modeSwitchButton = isNativeArcadeApp()
    ? ""
    : `<button class="primary-button" data-pause-action="${modeAction}">${modeButton}</button>`;
  return `
    <div class="overlay visible pause-overlay">
      <section class="end-card pause-card">
        <button class="small-button pause-dev-button" data-pause-action="dev">DEV</button>
        <h1 class="end-title">Paused</h1>
        <div class="pause-actions">
          <button class="primary-button" data-pause-action="resume">Resume</button>
          <button class="primary-button" data-pause-action="restart">Restart</button>
          ${modeSwitchButton}
          <button class="primary-button" data-pause-action="menu">Main Menu</button>
        </div>
        <div class="pause-sound-settings">
          ${renderSoundSettings("pause")}
        </div>
        ${state.pauseDevOpen ? renderSelfStackingDevPanel() : ""}
      </section>
    </div>
  `;
}

function renderSelfStackingDevPanel() {
  const counts = selfStackingGameConditionCounts();
  const rows = Object.values(SELF_STACKING_SEAL_SPECS)
    .map((spec) => {
      const count = counts[spec.key] || 0;
      return `<div class="dev-counter-row"><span>${escapeHtml(spec.label)}</span><strong>${count}</strong></div>`;
    })
    .join("");
  return `
    <div class="pause-dev-panel">
      <h2>Self-stacking conditions this game</h2>
      ${rows}
      <div class="dev-counter-row muted"><span>Total ARTIFACTS used</span><strong>${Math.max(0, Math.floor(state.totalArtifactsUsed || 0))}</strong></div>
    </div>
  `;
}

function renderPvpApp() {
  return `
    <main class="arena pvp-arena">
      ${renderPauseButton()}
      ${renderPvpTopbar()}
      ${renderPvpTargetPanel()}
      ${renderPvpSlots()}
      ${renderPvpConsole()}
      ${renderPauseMenu()}
    </main>
    <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
  `;
}

function renderPvpTopbar() {
  const pvp = state.pvp;
  const alive = pvpAliveParticipants().length;
  const slots = pvp.slots.length;
  return `
    <section class="topbar pvp-topbar" aria-label="PvP status">
      <div class="stat-card">
        <span class="stat-label">Mode</span>
        <span class="stat-value">PvP</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Round</span>
        <span class="stat-value">${pvp.round || "-"}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">${pvp.stage === "lobby" ? "Seats" : "Alive"}</span>
        <span class="stat-value">${pvp.stage === "lobby" ? slots : `${alive}/${slots}`}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Stage</span>
        <span class="stat-value">${pvp.stage}</span>
      </div>
    </section>
  `;
}

function renderPvpTargetPanel() {
  const pvp = state.pvp;
  const shownTarget = pvp.finalTarget !== null ? pvp.finalTarget : pvp.baseTarget !== null ? pvp.baseTarget : "?";
  const previous = pvp.previousTarget !== null ? pvp.previousTarget : "?";
  const base = pvp.baseTarget !== null ? pvp.baseTarget : "?";
  const final = pvp.finalTarget !== null ? pvp.finalTarget : "?";
  return `
    <section class="target-panel pvp-target-panel" aria-label="PvP target">
      <div class="target-value">
        <span class="stat-label">Target</span>
        <strong>${shownTarget}</strong>
      </div>
      <div class="target-detail">
        <div class="target-line target-previous">Previous: <strong>${previous}</strong></div>
        <div class="target-line target-modifier">Modifier: <strong>${pvp.modifier.toFixed(1)}</strong></div>
        <div>First: ${base}</div>
        <div>Final: ${final}</div>
      </div>
    </section>
  `;
}

function renderPvpSlots() {
  return `
    <section class="bot-grid pvp-grid" aria-label="PvP slots">
      ${state.pvp.slots.map((participant, slot) => renderPvpSlot(participant, slot)).join("")}
    </section>
  `;
}

function renderPvpSlot(participant, slot) {
  const canEditLobby = state.pvp.stage === "lobby";
  const removeButton = canEditLobby
    ? `<button class="small-button pvp-slot-remove" data-pvp-remove-slot="${slot}">${participant ? "Remove" : "Remove Slot"}</button>`
    : "";
  if (!participant) {
    return `
      <article class="bot-card pvp-slot empty-pvp-slot">
        <div class="bot-face empty-face"><span class="bot-mouth"></span></div>
        <div class="bot-title"><div class="bot-name">Empty Slot ${slot + 1}</div></div>
        <div class="bot-type">Waiting for phone player</div>
        <div class="empty-state">Becomes DAMNED when Ready is pressed</div>
        ${removeButton}
      </article>
    `;
  }
  const downClass = participant.eliminated ? "eliminated" : "";
  const damageTooltip = sourceTooltip(participant.damageSources, "damage");
  const damageBadge =
    participant.lastDamage > 0
      ? `<div class="damage-badge pvp-damage-badge" ${damageTooltip ? `data-tooltip="${escapeAttr(damageTooltip)}"` : ""}>-${participant.lastDamage}</div>`
      : "";
  const isGuessPhase = state.pvp.stage === "guess";
  const isDown = participant.eliminated || participant.hp <= 0;
  const allActivesReady = state.pvp.stage !== "active" || pvpAllActivesReady();
  const guessText = isDown
    ? "X"
    : isGuessPhase
      ? Number.isFinite(participant.guess)
        ? "Ready"
        : "--"
      : Number.isFinite(participant.guess)
        ? participant.guess
        : "--";
  const guessLabel = isGuessPhase ? "Status" : "First Guess";
  const pvpTargetForColor = state.pvp.finalTarget !== null ? state.pvp.finalTarget : state.pvp.baseTarget;
  const guessForColor = !isGuessPhase && !isDown && Number.isFinite(participant.guess) ? participant.guess : null;
  const guessCloseness = guessClosenessAttrs(guessForColor, pvpTargetForColor, participant.critical);
  const criticalClass = participant.critical ? "critical-guess" : "";
  const guessClass = [criticalClass, guessCloseness.className].filter(Boolean).join(" ");
  const active = participant.activeChoiceId ? pvpActiveById(participant.activeChoiceId) : null;
  const activeHidden = state.pvp.stage === "active" && participant.activeChoiceId && !allActivesReady;
  const activeResultVisible = participant.activeResolved && !activeHidden && !isDown && active && !active.skip;
  const activeClass = !activeResultVisible
    ? ""
    : participant.activeCast
      ? "cast-active pvp-artifact-hit"
      : participant.activeCast === false
        ? "pvp-artifact-failed"
        : "";
  const activeText = isDown
    ? "X"
    : activeHidden
      ? "Ready"
      : active
        ? active.name
        : participant.activeGuaranteeThisRound && state.pvp.stage === "active"
          ? "Guaranteed"
          : "--";
  const faceInner = isDown
    ? `<span class="ko-x">X</span>`
    : `<img class="bot-image" src="${escapeAttr(botImagePath(participant))}" alt="" loading="lazy" />`;
  return `
    <article class="bot-card pvp-slot ${downClass}" style="--bot-color: ${participant.color || "var(--cyan)"}">
      <div class="bot-face">${faceInner}</div>
      <div class="bot-title">
        <div class="bot-name" title="${escapeAttr(participant.name)}">${participant.name}</div>
      </div>
      <div class="bot-type">${participant.human ? "Phone Player" : "DAMNED"}</div>
      <div class="bot-stats">
        <div class="mini-stat">
          <span>${guessLabel}</span>
          <strong class="${guessClass}"${guessCloseness.style}>${guessText}</strong>
        </div>
        <div class="mini-stat">
          <span>ARTIFACT</span>
          <strong class="${activeClass}">${activeText}</strong>
        </div>
        <div class="mini-stat bot-health">
          ${damageBadge}
          <span>Health ${participant.hp}/${participant.maxHp}</span>
          <div class="health-bar">
            <div class="health-fill" style="width: ${(participant.hp / participant.maxHp) * 100}%"></div>
          </div>
        </div>
      </div>
      ${removeButton}
    </article>
  `;
}

function renderPvpConsole() {
  const pvp = state.pvp;
  if (pvp.stage === "lobby") return renderPvpLobbyConsole();
  if (pvp.stage === "guess") return renderPvpGuessConsole();
  if (pvp.stage === "active") return renderPvpActiveConsole();
  if (pvp.stage === "summary") return renderPvpSummaryConsole();
  return renderPvpEndedConsole();
}

function renderPvpLobbyConsole() {
  const joinUrl = pvpJoinUrl();
  const slotCount = state.pvp.slots.length;
  const addSlotDisabled = slotCount >= PVP_MAX_SLOT_COUNT ? "disabled" : "";
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">PvP Lobby</div>
          <div class="panel-subtitle">${slotCount} slots. Phone URL: ${escapeHtml(joinUrl)}</div>
        </div>
      </div>
      <div class="pvp-console-body">
        <div class="console-row">
          <input id="pvpLocalName" class="guess-input pvp-name-input" type="text" maxlength="16" placeholder="Local test name" />
          <button class="primary-button" id="pvpAddLocal">Add</button>
        </div>
        <div class="pvp-lobby-actions">
          <button class="small-button" id="pvpAddSlot" ${addSlotDisabled}>Add Slot</button>
          <button class="primary-button" id="pvpReadyLobby">Ready</button>
        </div>
        ${renderPvpLog()}
      </div>
    </section>
  `;
}

function renderPvpGuessConsole() {
  const humans = pvpHumanParticipants();
  const aliveCount = pvpAliveParticipants().length;
  const readyCount = pvpAliveParticipants().filter((participant) => Number.isFinite(participant.guess)).length;
  const allReady = readyCount === aliveCount;
  const autoText = state.pvp.waitForHost
    ? "Waiting for host signal."
    : allReady
      ? "Auto-revealing now."
      : "Auto-reveals when everyone is ready.";
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Guess Phase</div>
          <div class="panel-subtitle">${readyCount}/${aliveCount} ready. ${autoText}</div>
        </div>
        ${renderPvpPhaseActions(`<button class="primary-button" id="pvpRevealTarget" ${allReady ? "" : "disabled"}>Reveal</button>`)}
      </div>
      <div class="pvp-console-body pvp-local-controls">
        ${humans
          .map(
            (participant) => {
              const ready = Number.isFinite(participant.guess);
              if (participant.remoteId || ready) {
                return `
                  <div class="pvp-local-row pvp-ready-row">
                    <span>${participant.name}</span>
                    <strong class="${ready ? "good" : "warning"}">${ready ? "Ready" : "Waiting"}</strong>
                    <span></span>
                  </div>
                `;
              }
              return `
                <div class="pvp-local-row">
                  <span>${participant.name}</span>
                  <input class="guess-input pvp-small-input" id="pvpGuess-${participant.slot}" type="number" min="0" max="100" />
                  <button class="small-button" data-pvp-save-guess="${participant.slot}">Lock</button>
                </div>
              `;
            }
          )
          .join("")}
        ${renderPvpLog()}
      </div>
    </section>
  `;
}

function renderPvpActiveConsole() {
  const humans = pvpHumanParticipants();
  const targets = pvpAliveParticipants();
  const alive = pvpAliveParticipants();
  const readyCount = alive.filter((participant) => Boolean(participant.activeChoiceId)).length;
  const allReady = readyCount === alive.length;
  const autoText = state.pvp.waitForHost
    ? "Waiting for host signal."
    : allReady
      ? "Auto-ready now."
      : "Auto-readies when everyone chooses.";
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Artifact Phase</div>
          <div class="panel-subtitle">${readyCount}/${alive.length} ready. ${autoText}</div>
        </div>
        ${renderPvpPhaseActions(`<button class="primary-button" id="pvpResolveActives" ${allReady ? "" : "disabled"}>Ready</button>`)}
      </div>
      <div class="pvp-console-body">
        ${humans
          .map((participant) => renderPvpActiveControl(participant, targets, allReady))
          .join("")}
        ${renderPvpLog()}
      </div>
    </section>
  `;
}

function renderPvpActiveControl(participant, targets, allReady) {
  const ready = Boolean(participant.activeChoiceId);
  if (allReady) {
    return `
      <div class="pvp-local-row pvp-ready-row">
        <span>${participant.name}</span>
        <strong>${pvpActiveChoiceLabel(participant)}</strong>
        <span></span>
      </div>
    `;
  }
  if (participant.remoteId || ready) {
    return `
      <div class="pvp-local-row pvp-ready-row">
        <span>${participant.name}</span>
        <strong class="${ready ? "good" : "warning"}">${ready ? "Ready" : "Waiting"}</strong>
        <span></span>
      </div>
    `;
  }
  return `
    <div class="pvp-choice-block">
      <strong>${participant.name}</strong>
      <div class="pvp-active-options">
        ${pvpSelectableActives(participant).map((active) => renderPvpActiveOption(participant, active, targets)).join("")}
      </div>
    </div>
  `;
}

function pvpActiveChoiceLabel(participant) {
  const active = participant.activeChoiceId ? pvpActiveById(participant.activeChoiceId) : null;
  if (!active) return "--";
  if (!participant.activeTargetId) return active.name;
  const target = state.pvp.slots.find((candidate) => candidate?.id === participant.activeTargetId);
  return target ? `${active.name}: ${target.name}` : active.name;
}

function renderPvpActiveOption(participant, active, targets) {
  const selected = participant.activeChoiceId === active.id ? "selected" : "";
  const cast = selected && participant.activeCast ? "cast" : "";
  const targetSelect = active.needsTarget
    ? `
      <select class="pvp-target-select" data-pvp-target-for="${participant.slot}-${active.id}">
        <option value="">target</option>
        ${targets
          .filter((target) => target.id !== participant.id)
          .map((target) => {
            const guess = Number.isFinite(target.guess) ? ` - Guess ${target.guess}` : "";
            return `<option value="${target.id}" ${participant.activeTargetId === target.id ? "selected" : ""}>${target.name}${guess}</option>`;
          })
          .join("")}
      </select>
    `
    : "";
  return `
    <div class="pvp-active-option ${selected} ${cast}" data-tooltip="${escapeAttr(active.description)}">
      <button class="small-button" data-pvp-active-choice="${participant.slot}:${active.id}">${active.name}</button>
      ${targetSelect}
    </div>
  `;
}

function renderPvpSummaryConsole() {
  const autoText = state.pvp.waitForHost ? "Waiting for host signal." : "Next round starts automatically after 10 seconds.";
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Round ${state.pvp.round} Summary</div>
          <div class="panel-subtitle">Final target ${state.pvp.finalTarget}. ${autoText}</div>
        </div>
        ${renderPvpPhaseActions(`<button class="primary-button" id="pvpNextRound">Next Round</button>`)}
      </div>
      <div class="pvp-console-body">${renderPvpResults()}${renderPvpLog()}</div>
    </section>
  `;
}

function renderPvpPhaseActions(actionHtml) {
  const waitClass = state.pvp.waitForHost ? "active" : "";
  const waitText = state.pvp.waitForHost ? "Wait On" : "Wait";
  return `
    <div class="pvp-phase-actions">
      <button class="small-button wait-button ${waitClass}" id="pvpWaitToggle">${waitText}</button>
      ${actionHtml}
    </div>
  `;
}

function renderPvpEndedConsole() {
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Winner</div>
          <div class="panel-subtitle">${state.pvp.winner || "No one"}</div>
        </div>
        <button class="primary-button" id="pvpRestart">Restart</button>
      </div>
      <div class="pvp-console-body">${renderPvpResults()}${renderPvpLog()}</div>
    </section>
  `;
}

function renderPvpResults() {
  if (!state.pvp.activeResults.length) return "";
  return `<div class="pvp-results">${state.pvp.activeResults.map((result) => `<div>${escapeHtml(normalizeGameText(result))}</div>`).join("")}</div>`;
}

function renderPvpLog() {
  if (!state.pvp.log.length) return "";
  return `<div class="pvp-log">${state.pvp.log.map((entry) => `<div>${escapeHtml(normalizeGameText(entry))}</div>`).join("")}</div>`;
}

// ---------- HUD change tracking: animate only when a value actually changes ----------
// Renders rebuild the DOM, so CSS animations would replay on every render.
// We remember each value and when it last changed, and resume the animation
// with a negative delay instead of restarting it.
const hudChangeTracker = new Map();
const HEALTH_GHOST_DELAY_MS = 320;
const HEALTH_GHOST_DRAIN_MS = 520;
const HUD_POP_MS = 1100;

function trackHudChange(key, value) {
  const now = performance.now();
  const previous = hudChangeTracker.get(key);
  if (!previous) {
    hudChangeTracker.set(key, { value, from: value, changedAt: -Infinity });
    return { from: value, elapsed: Infinity };
  }
  if (value !== previous.value) {
    hudChangeTracker.set(key, { value, from: previous.value, changedAt: now });
    return { from: previous.value, elapsed: 0 };
  }
  return { from: previous.from, elapsed: now - previous.changedAt };
}

// red under-bar that shows the health just lost, then drains away
function healthGhostHtml(key, percent) {
  const change = trackHudChange(`hp:${key}`, Math.round(percent * 10) / 10);
  const total = HEALTH_GHOST_DELAY_MS + HEALTH_GHOST_DRAIN_MS;
  if (!(change.from > percent) || change.elapsed >= total) return "";
  const delay = Math.round(HEALTH_GHOST_DELAY_MS - change.elapsed);
  return `<div class="health-ghost" style="--ghost-from: ${change.from}%; --ghost-to: ${percent}%; animation-delay: ${delay}ms"></div>`;
}

// popup numbers pop in and rise into place once, when their value changes
function hudPopAttrs(key, value) {
  const change = trackHudChange(`pop:${key}`, `${state.round}:${value}`);
  if (change.elapsed >= HUD_POP_MS) return { className: "", style: "" };
  return { className: "hud-pop", style: ` style="--pop-delay: ${-Math.round(Math.min(change.elapsed, HUD_POP_MS))}ms"` };
}

// ---------- DAMNED cards: shake when hit, scaled by how big the hit was ----------
const HIT_SHAKE_MS = 420;

function hitShakeAttrs(key, value, maxHp, rising = false) {
  const change = trackHudChange(`shake:${key}`, value);
  if (change.elapsed >= HIT_SHAKE_MS) return { className: "", style: "", flash: "" };
  const lost = rising ? value - change.from : change.from - value;
  if (!(lost > 0)) return { className: "", style: "", flash: "" };
  const ratio = lost / Math.max(1, maxHp);
  const size = ratio >= 0.4 ? "hit-big" : ratio >= 0.15 ? "hit-mid" : "hit-small";
  const px = (2 + Math.min(10, Math.round(ratio * 10))).toFixed(0);
  const flash = size === "hit-small" ? "" : `<span class="hit-flash"></span>`;
  if (change.elapsed === 0) noteRenderHit(size === "hit-big" ? 3 : size === "hit-mid" ? 2 : 1);
  return { className: `hit-shake ${size}`, style: `; --shake-px: ${px}px; --shake-delay: ${-Math.round(change.elapsed)}ms`, flash };
}

// ---------- seals: purchase animation + Ignition ring geometry ----------
let lastEquippedSealIds = null;
const sealSummonedAt = new Map();
const SEAL_SUMMON_MS = 700;

// remembers which seals were equipped last render; a seal that wasn't there before was just bought
function sealSummonAttrs(id) {
  const at = sealSummonedAt.get(id);
  if (at === undefined) return { className: "", style: "" };
  const elapsed = performance.now() - at;
  if (elapsed >= SEAL_SUMMON_MS) return { className: "", style: "" };
  return { className: "seal-summoned", style: ` style="--summon-delay: ${-Math.round(elapsed)}ms"` };
}

function trackEquippedSeals(ids) {
  const now = performance.now();
  if (lastEquippedSealIds) {
    ids.forEach((id) => {
      if (!lastEquippedSealIds.has(id)) sealSummonedAt.set(id, now);
    });
  }
  lastEquippedSealIds = new Set(ids);
}

// the red ring and shockwave are sized from the sigil as drawn, so they sit on the seal's own circle in every layout
function syncSealRings() {
  document.querySelectorAll(".passive-slot.round-reveal-active, .passive-slot.round-reveal-effect, .passive-slot.seal-summoned").forEach((slot) => {
    const sigil = slot.querySelector(".equipped-seal-sigil");
    if (!sigil) return;
    const slotRect = slot.getBoundingClientRect();
    const sigilRect = sigil.getBoundingClientRect();
    const drawn = Math.min(sigil.offsetWidth || sigilRect.width, sigil.offsetHeight || sigilRect.height);
    if (!drawn) return;
    slot.style.setProperty("--ring-d", `${drawn}px`);
    slot.style.setProperty("--ring-x", `${(sigilRect.left + sigilRect.width / 2) - (slotRect.left + slotRect.width / 2)}px`);
    slot.style.setProperty("--ring-y", `${(sigilRect.top + sigilRect.height / 2) - (slotRect.top + slotRect.height / 2)}px`);
  });
}

// ==========================================================================
// Big moments and moment sounds.
// After every render the screen is compared with the previous one (what the
// player actually sees, including the step-by-step reveal) and the matching
// sound, title card, hit-stop and screen shake are fired once.
// ==========================================================================
const MOMENT_DURATIONS_MS = { critical: 1500, boss: 2000, finals: 3400, pentakill: 1900 };
let momentWatch = null;
let activeMoment = null;
let momentSeq = 0;
let momentClearTimer = null;
let renderHitTier = 0;
const quietSfxUntil = {};

function noteRenderHit(tier) {
  renderHitTier = Math.max(renderHitTier, tier);
}

function quietMomentSfx(key, ms = 500) {
  quietSfxUntil[key] = performance.now() + ms;
}

function momentSfx(key, delayMs = 0) {
  if ((quietSfxUntil[key] || 0) > performance.now()) return;
  if (delayMs > 0) setTimeout(() => playGameSfx(key), delayMs);
  else playGameSfx(key);
}

function motionReduced() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function startMoment(kind, title, sub = "") {
  momentSeq += 1;
  const duration = MOMENT_DURATIONS_MS[kind] || 1600;
  activeMoment = { id: momentSeq, kind, title, sub, until: performance.now() + duration };
  // moments start after a render has been drawn, so the card is put on screen straight away;
  // later renders carry the same card (same data-morph-key) and leave it running
  const app = document.querySelector("#app");
  if (app) {
    app.querySelectorAll(".moment-card").forEach((element) => element.remove());
    app.insertAdjacentHTML("beforeend", renderMoment());
  }
  clearTimeout(momentClearTimer);
  momentClearTimer = setTimeout(() => {
    activeMoment = null;
    document.querySelectorAll(".moment-card").forEach((element) => element.remove());
  }, duration);
}

function renderMoment() {
  const moment = activeMoment;
  if (!moment || moment.until <= performance.now()) return "";
  const figures =
    moment.kind === "finals"
      ? `<img class="moment-figure moment-figure-left" src="assets/ui/jesus.png" alt="" /><img class="moment-figure moment-figure-right" src="assets/ui/devil.png" alt="" />`
      : "";
  return `
    <div class="moment-card moment-${moment.kind}" data-morph-key="moment-${moment.id}" role="status" aria-live="assertive">
      ${figures}
      <div class="moment-text">
        <div class="moment-title">${escapeHtml(moment.title)}</div>
        ${moment.sub ? `<div class="moment-sub">${escapeHtml(moment.sub)}</div>` : ""}
      </div>
    </div>
  `;
}

// freeze every running animation for a beat, so a big hit lands
function hitStop(ms = 70) {
  if (motionReduced() || typeof document.getAnimations !== "function") return;
  const running = document.getAnimations().filter((animation) => animation.playState === "running");
  running.forEach((animation) => animation.pause());
  setTimeout(() => running.forEach((animation) => {
    try {
      if (animation.playState === "paused") animation.play();
    } catch (error) {}
  }), ms);
}

function screenShake(px = 6, ms = 380) {
  if (motionReduced()) return;
  const app = document.querySelector("#app");
  if (!app?.animate) return;
  const k = [0, -1, 0.8, -0.6, 0.45, -0.3, 0.15, 0];
  app.animate(
    k.map((f, index) => ({ transform: `translate(${(f * px).toFixed(1)}px, ${((index % 2 ? 0.5 : -0.5) * f * px).toFixed(1)}px)` })),
    { duration: ms, easing: "ease-out" }
  );
}

function readMomentSnapshot() {
  const round = state.roundState;
  const revealing = roundRevealAnimationActive();
  const shown = roundRevealPlayerDisplay();
  return {
    round: state.round,
    eliminations: state.eliminations,
    target: round && round.target !== null && round.target !== undefined ? round.target : null,
    playerCritical: Boolean(round?.criticalHitKeys?.has("player")),
    anyCritical: Boolean(round?.criticalHitKeys?.size),
    bosses: state.bots.filter((bot) => bot.isBoss && !bot.eliminated && bot.hp > 0).map((bot) => ({ id: bot.id, name: bot.name })),
    finals: Boolean(state.finalBossPhase),
    downIds: Array.from(document.querySelectorAll(".bot-card.eliminated")).map((card) => card.dataset.botId),
    downBossIds: Array.from(document.querySelectorAll(".bot-card.boss.eliminated")).map((card) => card.dataset.botId),
    hp: Number(shown.hp) || 0,
    credits: Number(shown.credits) || 0,
    pentakill: Boolean(round?.pentakillPopup) && !revealing,
    gameOver: Boolean(state.gameOver) && !revealing,
    sealed: shopDisabledBySatan()
  };
}

function watchMoments() {
  const now = readMomentSnapshot();
  const before = momentWatch;
  momentWatch = now;
  const hitTier = renderHitTier;
  renderHitTier = 0;
  // first frame of a run (new game, loaded save): just remember what is on screen
  if (!before || now.round < before.round || now.eliminations < before.eliminations) return;

  // sounds in the same frame are spaced out: TARGET first, then the hits, the KO, the SIN
  let beat = 0;
  if (before.target === null && now.target !== null) {
    beat = 260;
    if (now.playerCritical) {
      momentSfx("critical");
      startMoment("critical", "Critical", "You named the TARGET");
      hitStop(80);
      screenShake(9, 420);
    } else {
      momentSfx("targetLand");
      if (now.anyCritical) {
        momentSfx("critical", 120);
        screenShake(5, 320);
      }
    }
  }

  const newDowns = now.downIds.filter((id) => !before.downIds.includes(id));
  const newBossDowns = now.downBossIds.filter((id) => !before.downBossIds.includes(id));
  const lostHp = before.hp - now.hp;
  const playerTier = lostHp > 0 ? (lostHp >= playerMaxHp() * 0.25 ? 3 : lostHp >= playerMaxHp() * 0.1 ? 2 : 1) : 0;
  const tier = Math.max(hitTier, playerTier);
  if (newBossDowns.length) {
    momentSfx("hitBig", beat);
    momentSfx("ko", beat + 90);
    setTimeout(() => {
      hitStop(75);
      screenShake(8, 400);
    }, beat);
    beat += 90;
  } else if (newDowns.length) {
    momentSfx(tier >= 3 ? "hitBig" : "hitMid", beat);
    momentSfx("ko", beat + 80);
    beat += 80;
  } else if (tier) {
    momentSfx(tier >= 3 ? "hitBig" : tier === 2 ? "hitMid" : "hitSmall", beat);
  }
  if (playerTier >= 3) screenShake(6, 340);

  if (now.hp > before.hp && !now.gameOver) momentSfx("heal", beat);
  if (now.credits > before.credits) momentSfx("sinGain", tier || newDowns.length ? beat + 380 : beat);

  if (!before.pentakill && now.pentakill) {
    startMoment("pentakill", "Pentakill", "+5 HEALTH   +8 SIN");
    hitStop(80);
    screenShake(10, 460);
  }

  if (!before.finals && now.finals) {
    momentSfx("finalBosses");
    if (now.sealed) momentSfx("shopSealed", 1500);
    startMoment("finals", "Judgement", "Jesus and Satan take the table");
    screenShake(5, 600);
  } else if (!now.finals) {
    const arrived = now.bosses.find((boss) => !before.bosses.some((old) => old.id === boss.id));
    if (arrived) {
      momentSfx("bossArrive");
      startMoment("boss", arrived.name, "takes a seat at the table");
      screenShake(4, 500);
    }
  }

  if (!before.gameOver && now.gameOver) momentSfx("gameOver");
}

// ==========================================================================
// Seal trigger "Blood fill": the seal fills with red from its centre (CSS),
// while the screen leans in towards it; when it is full the screen slams back
// with a shockwave and cracks around the seal.
// ==========================================================================
const SEAL_FILL_MS = 620;
let lastSealSlamKey = "";

function sealCrackSvg(size) {
  const c = size / 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lines = [];
  const count = 7 + Math.floor(Math.random() * 3);
  for (let k = 0; k < count; k += 1) {
    let angle = (k / count) * Math.PI * 2 + rnd(-0.25, 0.25);
    let r = c * rnd(0.3, 0.36);
    const end = c * rnd(0.72, 0.98);
    const points = [[c + Math.cos(angle) * r, c + Math.sin(angle) * r]];
    while (r < end) {
      r += c * rnd(0.08, 0.16);
      angle += rnd(-0.22, 0.22);
      points.push([c + Math.cos(angle) * r, c + Math.sin(angle) * r]);
      if (Math.random() < 0.22) {
        const branchAngle = angle + rnd(0.35, 0.7) * (Math.random() < 0.5 ? -1 : 1);
        const br = r + c * rnd(0.08, 0.18);
        lines.push(`M${points[points.length - 1].map((v) => v.toFixed(1)).join(" ")}L${(c + Math.cos(branchAngle) * br).toFixed(1)} ${(c + Math.sin(branchAngle) * br).toFixed(1)}`);
      }
    }
    lines.push(`M${points.map((point) => point.map((v) => v.toFixed(1)).join(" ")).join("L")}`);
  }
  const d = lines.join("");
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="crack-glow" d="${d}"/><path class="crack-line" d="${d}"/></svg>`;
}

function sealSlamEffects(slot) {
  const sigil = slot?.querySelector(".equipped-seal-sigil");
  if (!sigil || !slot.isConnected) return;
  const rect = sigil.getBoundingClientRect();
  const diameter = Math.min(rect.width, rect.height);
  if (!diameter) return;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  playGameSfx("sealSlam");
  if (!motionReduced()) {
    hitStop(55);
    setTimeout(() => screenShake(Math.max(4, diameter / 18), 340), 55);
  }
  const size = Math.round(diameter * 3);
  const fx = document.createElement("div");
  fx.className = "seal-slam-fx";
  fx.style.cssText = `left:${cx}px;top:${cy}px;--fx-size:${size}px;--fx-d:${diameter}px`;
  fx.innerHTML = `<span class="slam-wave"></span><span class="slam-wave slam-wave-red"></span><span class="slam-cracks">${sealCrackSvg(size)}</span>`;
  document.body.appendChild(fx);
  setTimeout(() => fx.remove(), 1100);
}

function sealLeanIn(slot) {
  const app = document.querySelector("#app");
  const sigil = slot?.querySelector(".equipped-seal-sigil");
  if (!app?.animate || !sigil || motionReduced()) return;
  const appRect = app.getBoundingClientRect();
  const rect = sigil.getBoundingClientRect();
  app.style.transformOrigin = `${rect.left + rect.width / 2 - appRect.left}px ${rect.top + rect.height / 2 - appRect.top}px`;
  app.style.willChange = "transform";
  document.body.classList.add("seal-leaning");
  const lean = app.animate(
    [
      { transform: "scale(1)", easing: "cubic-bezier(0.55, 0, 0.9, 0.55)" },
      { transform: "scale(1.035)", offset: 0.66, easing: "cubic-bezier(0.2, 0, 0.1, 1)" },
      { transform: "scale(0.988)", offset: 0.74, easing: "ease-out" },
      { transform: "scale(1)" }
    ],
    { duration: Math.round(SEAL_FILL_MS / 0.66) }
  );
  lean.onfinish = lean.oncancel = () => {
    app.style.transformOrigin = "";
    app.style.willChange = "";
    document.body.classList.remove("seal-leaning");
  };
}

function watchSealTrigger() {
  const animation = state.roundRevealAnimation;
  if (!animation?.active || animation.phase !== "seal") return;
  const key = `${state.round}:${animation.stepIndex}:${currentRoundRevealStep()?.id || ""}`;
  if (key === lastSealSlamKey) return;
  lastSealSlamKey = key;
  const slot = document.querySelector(".passive-slot.round-reveal-active:not(.suppressed):not(.wide-seal-slot)") ||
    document.querySelector(".passive-slot.round-reveal-active:not(.suppressed)");
  if (!slot) return;
  sealLeanIn(slot);
  setTimeout(() => sealSlamEffects(document.querySelector(".passive-slot.round-reveal-active") || slot), SEAL_FILL_MS);
}

function afterRenderEffects() {
  if (state.mode !== "arcade") {
    lastEquippedSealIds = null;
    momentWatch = null;
    return;
  }
  syncSealRings();
  watchSealTrigger();
  watchMoments();
}

function renderTopbar() {
  const playerDisplay = roundRevealPlayerDisplay();
  const playerDamageTooltip = sourceTooltip(playerDisplay.damageSources, "damage");
  const playerHealTooltip = sourceTooltip(playerDisplay.healSources, "heal");
  const playerCreditTooltip = sourceTooltip(playerDisplay.creditSources, "credits");
  const playerDamagePop = hudPopAttrs("player-damage", playerDisplay.lastDamage);
  const playerHealPop = hudPopAttrs("player-heal", playerDisplay.lastHeal);
  const playerCreditPop = hudPopAttrs("player-credit", playerDisplay.lastCredits);
  const playerDamageBadge =
    playerDisplay.lastDamage > 0
      ? `<div class="player-damage-badge ${playerDamagePop.className}"${playerDamagePop.style} ${playerDamageTooltip ? `data-tooltip="${escapeAttr(playerDamageTooltip)}"` : ""}>-${playerDisplay.lastDamage}</div>`
      : "";
  const playerHealBadge =
    playerDisplay.lastHeal > 0
      ? `<div class="player-heal-badge ${playerHealPop.className}"${playerHealPop.style} ${playerHealTooltip ? `data-tooltip="${escapeAttr(playerHealTooltip)}"` : ""}>+${playerDisplay.lastHeal}</div>`
      : "";
  const playerCreditBadge =
    playerDisplay.lastCredits > 0
      ? `<div class="player-credit-badge ${playerCreditPop.className}"${playerCreditPop.style} ${playerCreditTooltip ? `data-tooltip="${escapeAttr(playerCreditTooltip)}"` : ""}>+${playerDisplay.lastCredits}${SIN_MARK}</div>`
      : "";
  const maxHp = playerMaxHp();
  const healthPercent = maxHp > 0 ? clamp((playerDisplay.hp / maxHp) * 100, 0, 100) : 0;
  const playtestButtonClass = playtestMoneyModeActive() ? "active" : "";
  const skipTitle = state.finalBossPhase
    ? "Final phase is already active"
    : activeGoeticBoss() || state.goeticBossKills > 0
      ? "Skip to Jesus and Satan"
      : "Skip past the eight special bosses";
  const arcadeLocked = arcadeActionLocked();
  return `
    <section class="topbar" aria-label="Run status">
      ${renderTargetPanel()}
      <div class="stat-card health-wrap">
        ${playerDamageBadge}
        ${playerHealBadge}
        <div class="health-row">
          <span class="stat-label">Health</span>
          <strong>${playerDisplay.hp}/${maxHp}</strong>
        </div>
        <div class="health-bar">
          ${healthGhostHtml("player", healthPercent)}
          <div class="health-fill" style="width: ${healthPercent}%"></div>
        </div>
      </div>
      <div class="stat-card round-wrap">
        <div class="round-kos-grid">
          <div class="round-kos-cell">
            <span class="stat-label">Round</span>
            <span class="stat-value">${state.round}</span>
          </div>
          <div class="round-kos-cell">
            <span class="stat-label">KOs / BOSS</span>
            <span class="stat-value">${state.eliminations}/${state.bossKills}</span>
          </div>
        </div>
      </div>
      <div class="stat-card credit-wrap">
        ${playerCreditBadge}
        <span class="stat-label">SIN${SIN_MARK}</span>
        <span class="stat-value">${playerDisplay.credits}</span>
      </div>
      <div class="dev-quick" aria-label="Test controls">
        <button class="small-button round-skip-button" id="skipProgression" title="${escapeAttr(normalizeGameText(skipTitle))}" ${state.finalBossPhase || arcadeLocked ? "disabled" : ""}>SKIP</button>
        <button class="small-button ${playtestButtonClass}" id="playtestMoney" ${arcadeLocked ? "disabled" : ""}>INF</button>
      </div>
    </section>
  `;
}

function renderTargetPanel() {
  const round = state.roundState;
  const target = round && round.target !== null ? formatNumber(round.target) : "?";
  const previousTarget = state.previousTarget !== null ? formatNumber(state.previousTarget) : "?";
  const avg = round && round.tableAverage !== null ? formatNumber(round.tableAverage) : "average";
  const modifier = round ? formatModifier(round.targetModifier) : formatModifier(BASE_TARGET_MODIFIER);
  const offset = round ? round.targetOffset : 0;
  const calcAverage = `<span class="target-calc-average">${escapeHtml(avg)}</span>`;
  const calculation =
    round && round.target !== null
      ? `${calcAverage} x ${modifier} ${offset >= 0 ? "+" : "-"} ${Math.abs(offset)} = ${target}`
      : `${calcAverage} x ${modifier} ${offset >= 0 ? "+" : "-"} ${Math.abs(offset)}`;

  // One box: TARGET on top, the number beneath it, Previous / Modifier (and the calc) on the right
  return `
    <section class="target-panel target-combined" aria-label="Target">
      <span class="stat-label target-head">Target</span>
      <strong class="target-big">${target}</strong>
      <div class="target-side">
        <div class="target-line target-previous">Previous: <strong>${previousTarget}</strong></div>
        <div class="target-line target-modifier">Modifier: <strong>${modifier}</strong></div>
        <div class="target-calc-line">Calc: ${calculation}</div>
      </div>
    </section>
  `;
}

// ---------- personality glyphs: one small chalk mark per DAMNED type (replaces the emoji flags) ----------
const PERSONALITY_GLYPHS = {
  Anchor: '<circle cx="12" cy="4.2" r="1.7"/><path d="M12 6v14.5M7.6 9.2h8.8M4.6 13.4c.4 4.3 3.4 7.2 7.4 7.3 4-.1 7-3 7.4-7.3M4.6 13.4l-1.3 1.5M19.4 13.4l1.3 1.5"/>',
  Analyst: '<path d="M12 2.8 21.4 19.6H2.6Z"/><path d="M7.4 14.4c2.6-3.1 6.6-3.1 9.2 0-2.6 3.1-6.6 3.1-9.2 0Z"/><circle cx="12" cy="14.4" r="1.15"/>',
  Follower: '<path d="M3.5 6.2 9.6 12l-6.1 5.8M10.6 6.2l6.1 5.8-6.1 5.8"/><path d="M19.2 9.4v5.2"/>',
  Stubborn: '<path d="M12 21v-8.6M12 12.4C10.2 6 3 5.7 3 10.6c0 2.9 3.7 3.2 4.1.4M12 12.4C13.8 6 21 5.7 21 10.6c0 2.9-3.7 3.2-4.1.4"/><path d="M8.6 21h6.8"/>',
  Drifter: '<path d="M2.6 9.2c2.3-3 4.5-3 6.6 0s4.4 3 6.6 0 4.3-3 5.6-1.4M2.6 15.6c2.3-3 4.5-3 6.6 0s4.4 3 6.6 0 4.3-3 5.6-1.4"/>',
  Caller: '<path d="M3.4 10v4.2h3.4l5.4 4.4V5.6L6.8 10Z"/><path d="M15.3 9c1.6 1.7 1.6 4.3 0 6M18.2 6.4c3.1 3.2 3.1 8 0 11.2"/>'
};

// SIN is shown as its mark after the value ("4" + mark) everywhere except in sentences
const SIN_MARK = `<span class="sin-mark" role="img" aria-label="SIN"></span>`;

function sinValueHtml(text) {
  return `${escapeHtml(String(text).replace(/\s*SIN$/, ""))}${SIN_MARK}`;
}

// bosses: an inverted pentagram instead of a personality mark
const BOSS_GLYPH_HTML = `<span class="bot-glyph boss-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12.4" r="9.6"/><path d="M12 21.9 6.4 4.7 20.9 15.3H3.1L17.6 4.7Z"/></svg></span>`;

// TEMPORARY look test: each boss shows a small seal (its own Goetic seal, or a stand-in) whose
// tooltip explains the boss's ability. These seals are only pictures here; the player's seals are unchanged.
const BOSS_STAND_IN_SEALS = {
  zilon: "p93",
  dantre: "p92",
  serafim: "p94",
  pyros: "p95",
  padma: "p96",
  threon: "p97",
  petros: "p110",
  pavlos: "p110",
  kalha: "p16",
  jesus: "p75",
  satan: "p111"
};

function bossSealId(bot) {
  if (!bot?.isBoss) return null;
  if (bot.goeticPassiveId && SEAL_SIGILS[bot.goeticPassiveId]) return bot.goeticPassiveId;
  return BOSS_STAND_IN_SEALS[bot.finalKey || bot.uniqueKey || bot.copiedUniqueKey] || null;
}

function bossAbilityText(bot) {
  if (bot.finalKey) return (FINAL_BOSS_SPECS[bot.finalKey]?.descriptions || []).join(" ");
  return botPassiveDescription(bot) || "No special ability.";
}

function bossSealBadgeHtml(bot) {
  const sealId = bossSealId(bot);
  if (!sealId) return "";
  const tooltip = `
    <div class="tooltip-heading">
      <div class="tooltip-title">${escapeHtml(bot.name)}</div>
      <div class="tooltip-shift-hint">BOSS</div>
    </div>
    <div class="tooltip-body">${descriptionHtml(bossAbilityText(bot))}</div>
  `;
  return `<span class="boss-seal ${SATAN_SEAL_IDS.has(sealId) ? "boss-seal-wide" : ""}" data-tooltip-html="${escapeAttr(tooltip)}">${renderSealSigil(sealId, "boss-seal-sigil")}</span>`;
}

function personalityGlyphHtml(type) {
  const paths = PERSONALITY_GLYPHS[type];
  if (!paths) return "";
  return `<span class="bot-glyph" title="${escapeAttr(type)}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}

function renderBots() {
  const pendingPick = state.pendingActive && state.pendingActive.mode === "bot";
  return `
    <section class="bot-grid ${pendingPick ? "picking" : ""} ${state.finalBossPhase ? "final-boss-grid" : ""}" aria-label="DAMNED">
      ${state.bots.map((bot) => renderBot(bot, pendingPick)).join("")}
    </section>
  `;
}

function renderBot(bot, pendingPick) {
  const round = state.roundState;
  const display = roundRevealBotDisplay(bot);
  const submitted = round?.botSubmittedGuesses.get(bot.id);
  const effective = round?.botEffectiveGuesses.get(bot.id);
  const displayHp = display?.hp ?? bot.hp;
  const displayMaxHp = display?.maxHp ?? bot.maxHp;
  const isDown = display ? display.eliminated : bot.eliminated || bot.hp <= 0;
  const revealed = Number.isFinite(effective)
    ? formatNumber(effective)
    : state.stage !== "guess"
      ? "--"
      : bot.revealedByPassive
        ? bot.plannedGuess
        : "--";
  const rawNote =
    state.stage !== "guess" && submitted !== effective ? `Raw ${submitted}` : bot.revealedByPassive ? "Revealed" : "Guess";
  const memoryText = bot.memory.length ? `${bot.memory.length} ${bot.memory.length === 1 ? "round" : "rounds"}` : "No memory";
  const pickClass = pendingPick ? "pickable" : "";
  const freshClass = bot.fresh ? "fresh" : "";
  const bossClass = bot.isBoss ? "boss" : "";
  const diffMarkedClass = bot.diffMarkedByPlayer && !isDown ? "diff-marked" : "";
  const downClass = isDown ? "eliminated" : "";
  const deathCauseClass = bot.deathCause ? `death-${bot.deathCause}` : "";
  const faceClass = bot.isBoss ? "boss-face" : "";
  const passiveSummary = botPassiveSummary(bot);
  const hasVisiblePassive = passiveSummary && passiveSummary !== "No Seal";
  const typeLabel = bot.isBoss ? "Boss" : normalizeGameText(hasVisiblePassive ? `${bot.type}: ${passiveSummary}` : bot.type);
  const passiveDescription = hasVisiblePassive && !bot.isBoss ? botPassiveDescription(bot) : "";
  const removed = round?.removedBotIds.has(bot.id) ? "Jammed" : rawNote;
  const isCriticalGuess = round?.criticalHitKeys?.has(`bot-${bot.id}`);
  const criticalGuessClass = isCriticalGuess ? "critical-guess" : "";
  const criticalGuessLabelClass = isCriticalGuess ? "critical-guess-label" : "";
  const guessCloseness = guessClosenessAttrs(effective, round?.target, isCriticalGuess);
  const guessClass = [criticalGuessClass, guessCloseness.className].filter(Boolean).join(" ");
  const botDamageSources = display?.damageSources ?? bot.damageSources;
  const botHealSources = display?.healSources ?? bot.healSources;
  const botSinSources = display?.sinSources ?? bot.sinSources;
  const botMemorySources = display?.memorySources ?? bot.memorySources;
  const botLastDamage = display?.lastDamage ?? bot.lastDamage;
  const botLastHeal = display?.lastHeal ?? bot.lastHeal;
  const botLastSinDelta = display?.lastSinDelta ?? bot.lastSinDelta;
  const botLastMemoryDelta = display?.lastMemoryDelta ?? bot.lastMemoryDelta;
  const damageTooltip = sourceTooltip(botDamageSources, "damage");
  const healTooltip = sourceTooltip(botHealSources, "heal");
  const sinTooltip = sourceTooltip(botSinSources, "signed-credits");
  const memoryTooltip = sourceTooltip(botMemorySources, "memory");
  const botPops = {
    damage: hudPopAttrs(`bot-${bot.id}-damage`, botLastDamage),
    heal: hudPopAttrs(`bot-${bot.id}-heal`, botLastHeal),
    sin: hudPopAttrs(`bot-${bot.id}-sin`, botLastSinDelta),
    memory: hudPopAttrs(`bot-${bot.id}-memory`, botLastMemoryDelta)
  };
  const damageBadge =
    botLastDamage > 0 && state.stage !== "guess"
      ? `<div class="damage-badge ${botPops.damage.className}"${botPops.damage.style} ${damageTooltip ? `data-tooltip="${escapeAttr(damageTooltip)}"` : ""}>-${botLastDamage}</div>`
      : "";
  const healBadge =
    botLastHeal > 0 && state.stage !== "guess"
      ? `<div class="heal-badge ${botPops.heal.className}"${botPops.heal.style} ${healTooltip ? `data-tooltip="${escapeAttr(healTooltip)}"` : ""}>+${botLastHeal}</div>`
      : "";
  const sinBadge =
    botLastSinDelta && !bot.immortal
      ? `<div class="bounty-badge ${botPops.sin.className}"${botPops.sin.style} ${sinTooltip ? `data-tooltip="${escapeAttr(sinTooltip)}"` : ""}>${botLastSinDelta > 0 ? "+" : ""}${botLastSinDelta}${SIN_MARK}</div>`
      : "";
  const memoryBadge =
    botLastMemoryDelta > 0
      ? `<div class="memory-badge ${botPops.memory.className}"${botPops.memory.style} ${memoryTooltip ? `data-tooltip="${escapeAttr(memoryTooltip)}"` : ""}>+${botLastMemoryDelta}</div>`
      : "";
  const poisonStackBadge =
    (bot.poisonCounters || 0) > 0
      ? `<span class="poison-stack-label ${damageBadge ? "has-damage-badge" : ""}">Poison ${bot.poisonCounters}</span>`
      : "";
  const deathBadgeClass = bot.deathCause === "contract" ? "contract-badge" : "";
  const deathBadge = isDown && bot.deathNotice ? `<div class="death-badge ${deathBadgeClass}">${bot.deathNotice}</div>` : "";
  const markBadge = bot.markedByPlayer && !isDown ? `<div class="mark-badge">MARKED</div>` : "";
  const rewardLabel = botSinDisplay(bot);
  const flagHtml = bot.isBoss ? BOSS_GLYPH_HTML : personalityGlyphHtml(bot.type);
  const bossSealHtml = bot.isBoss ? bossSealBadgeHtml(bot) : "";
  const safeDisplayMaxHp = Math.max(1, displayMaxHp || 1);
  const displayDamageTaken = display?.damageTakenTotal ?? (bot.damageTakenTotal || 0);
  const healthLabel = bot.immortal ? `Damage ${displayDamageTaken}` : `HEALTH ${displayHp}/${displayMaxHp}`;
  const healthPercent = bot.immortal ? 100 : clamp((displayHp / safeDisplayMaxHp) * 100, 0, 100);
  const identitySwapBlocked = state.pendingActive?.id === "a7" && bot.isBoss;
  const shieldBlocked = pendingPick && botHasPassive(bot, "shield");
  const pickDisabled = isDown || identitySwapBlocked || shieldBlocked;
  const pickButton = pendingPick
    ? `<button class="pick-button" data-pick-bot="${bot.id}" ${pickDisabled ? "disabled" : ""}>${isDown ? "Down" : identitySwapBlocked ? "BOSS" : shieldBlocked ? "SEAL" : "Pick"}</button>`
    : "";
  const tooltipAttr = passiveDescription ? ` data-tooltip="${escapeAttr(passiveDescription)}"` : "";
  const hit = bot.immortal
    ? hitShakeAttrs(`bot-${bot.id}`, displayDamageTaken, Math.max(100, displayMaxHp || 100), true)
    : hitShakeAttrs(`bot-${bot.id}`, displayHp, safeDisplayMaxHp);
  const faceInner = isDown
    ? bot.deathCause === "contract"
      ? `<span class="contract-mark">PC</span>`
      : `<span class="ko-x">X</span>`
    : `<img class="bot-image" src="${escapeAttr(botImagePath(bot))}" alt="" loading="lazy" />`;

  return `
    <article class="bot-card ${pickClass} ${freshClass} ${bossClass} ${diffMarkedClass} ${downClass} ${deathCauseClass} ${hit.className}" data-bot-id="${bot.id}" style="--bot-color: ${bot.color}${hit.style}"${tooltipAttr}>
      ${hit.flash}
      ${bossSealHtml}
      ${deathBadge}
      ${markBadge}
      <div class="bot-face ${faceClass}">${faceInner}</div>
      <div class="bot-title">
        ${flagHtml}
        <div class="bot-name" title="${escapeAttr(normalizeGameText(`${bot.name} (${bot.country})`))}">${bot.name}</div>
        <div class="bot-reward" title="SIN">${sinValueHtml(rewardLabel)}</div>
        ${sinBadge}
      </div>
      <div class="bot-type ${bot.isBoss ? "boss-type" : ""}" title="${typeLabel}">${typeLabel}</div>
      <div class="bot-stats">
        <div class="mini-stat">
          <span class="${criticalGuessLabelClass}">${removed}</span>
          <strong class="${guessClass}"${guessCloseness.style}>${revealed}</strong>
        </div>
        <div class="mini-stat memory-stat">
          ${memoryBadge}
          <span>Memory</span>
          <strong>${memoryText}</strong>
        </div>
        <div class="mini-stat bot-health">
          ${damageBadge}
          ${healBadge}
          <div class="bot-health-heading">
            <span>${healthLabel}</span>
            ${poisonStackBadge}
          </div>
          <div class="health-bar">
            ${healthGhostHtml(`bot-${bot.id}`, healthPercent)}
            <div class="health-fill" style="width: ${healthPercent}%"></div>
          </div>
        </div>
      </div>
      ${pickButton}
    </article>
  `;
}

function consoleActionState() {
  const round = state.roundState;
  let buttonText = "Guess";
  let hint = "";
  let disabled = "";
  let inputDisabled = "";
  const maxGuess = playerGuessLimit();

  if (roundRevealAnimationActive()) {
    const step = currentRoundRevealStep();
    buttonText = "Skip";
    inputDisabled = "disabled";
    hint = step
      ? roundRevealEffectActive()
        ? `${step.name} resolves.`
        : `${step.name} is triggering.`
      : "Revealing SEAL effects.";
  } else if (state.stage === "active") {
    buttonText = "Ready";
    inputDisabled = "disabled";
    disabled = state.pendingActive ? "disabled" : "";
    hint = `${round.activeUses}/${activeUseLimit()} ARTIFACTS used. Ready applies penalties.`;
  } else if (state.stage === "summary") {
    buttonText = "Next Round";
    inputDisabled = "disabled";
    hint = shopDisabledBySatan()
      ? "Penalties are locked in. Satan has sealed Devil's Offerings."
      : "Penalties are locked in. Devil's Offerings is still available before you advance.";
  } else if (state.stage === "ended") {
    buttonText = "Restart";
    inputDisabled = "disabled";
    hint = state.inspectingGameOver ? "Game over inspection. Hover damage, healing, SIN, and memory bubbles to inspect the round." : "Run ended.";
  } else {
    hint = `Pick a number between 0 and ${maxGuess}`;
  }

  return { buttonText, disabled, hint, inputDisabled, maxGuess, round };
}

function renderConsole() {
  const { buttonText, disabled, hint, inputDisabled, maxGuess, round } = consoleActionState();
  const value = round?.playerSubmittedGuess ?? "";
  const playerCritical = round?.criticalHitKeys?.has("player");
  const playerCloseness = guessClosenessAttrs(round?.playerEffectiveGuess, round?.target, playerCritical);
  const criticalInputClass = playerCritical ? "critical-guess" : "";
  const inputClass = ["guess-input", criticalInputClass, playerCloseness.className].filter(Boolean).join(" ");
  const nativeInputType = isNativeArcadeApp() ? "text" : "number";
  const nativeInputLock = isNativeArcadeApp()
    ? 'readonly inputmode="none" autocomplete="off" autocorrect="off" spellcheck="false" aria-readonly="true"'
    : "";
  const pendingText = renderPendingText();
  const nativeTargetPick = isNativeArcadeApp() && state.pendingActive?.mode === "bot";
  const pendingCancel = state.pendingActive && !nativeTargetPick ? `<button id="cancelPendingActive" class="small-button pending-cancel">Cancel</button>` : "";

  return `
    <section class="center-console" aria-label="Player action">
      ${hint ? `<div class="console-hint">${escapeHtml(normalizeGameText(hint))}</div>` : ""}
      <div class="console-row">
        <input
          id="guessInput"
          class="${inputClass}"
          type="${nativeInputType}"
          min="0"
          max="${maxGuess}"
          step="1"
          placeholder=" "
          value="${value}"
          ${playerCloseness.style.trim()}
          ${nativeInputLock}
          ${inputDisabled}
        />
        ${isNativeArcadeApp() ? "" : `<button id="mainAction" class="primary-button" ${disabled}>${buttonText}</button>`}
      </div>
      <div class="pending-panel ${state.pendingActive ? "visible" : ""}">
        <span>${escapeHtml(normalizeGameText(pendingText))}</span>
        ${pendingCancel}
      </div>
    </section>
  `;
}

function renderPendingText() {
  if (!state.pendingActive) return "";
  const item = pendingArtifactItem();
  if (!item) return "";
  if (state.pendingActive.id === "a6") return `${item.name} adds ${artifactValue(20)} to the TARGET.`;
  if (state.pendingActive.id === "a14") return `${item.name} reduces the TARGET by ${artifactValue(10)}.`;
  if (state.pendingActive.id === "a15") {
    const extra = sacrificialDaggerExtraDamage("p70");
    return `${item.name}: pick a target. non-boss DAMNED take ${artifactPercentValue(20)}%, BOSSES take ${artifactPercentValue(sacrificialDaggerBossPercent())}%${extra ? `, plus ${extra} from Seal of Amy` : ""}.`;
  }
  if (state.pendingActive.id === "a25") return `${item.name}: pick DAMNED to reveal next round and give +3 BOUNTY.`;
  if (state.pendingActive.id === "a26" && state.pendingActive.step === "give") return `${item.name}: pick DAMNED to receive the drained BOUNTY.`;
  if (state.pendingActive.id === "a26") return `${item.name}: pick DAMNED to drain up to ${artifactValue(5)} BOUNTY.`;
  if (state.pendingActive.id === "a28") {
    const value = artifactValue(6);
    return `${item.name}: pick a DAMNED to gain +${value} MEMORY, +${value} SIN, and heal ${artifactPercentValue(6)}% max HEALTH.`;
  }
  if (state.pendingActive.id === "a11" && state.pendingActive.step === "heal") {
    return `${item.name}: pick a different non-boss DAMNED to overheal ${artifactPercentValue(30)}% max HEALTH and copy the first's ability.`;
  }
  return `${item.name}: pick a DAMNED card to resolve it.`;
}

function setGuessInputValue(value) {
  const input = document.querySelector("#guessInput");
  if (!input) return;
  input.value = value;
}

function handleMobileNumpadKey(key) {
  if (!mobileNumpadEnabled()) return;
  const input = document.querySelector("#guessInput");
  if (!input) return;

  const current = String(input.value || "");
  if (key === "clear") {
    setGuessInputValue("");
    return;
  }
  if (key === "backspace") {
    setGuessInputValue(current.slice(0, -1));
    return;
  }
  if (!/^\d$/.test(key)) return;

  const maxGuess = playerGuessLimit();
  const next = current === "0" ? key : `${current}${key}`;
  const parsed = Number(next);
  if (!Number.isFinite(parsed) || parsed > maxGuess || next.length > String(maxGuess).length) return;
  setGuessInputValue(next);
}

function renderShop() {
  const locked = shopDisabledBySatan();
  const actionsLocked = arcadeActionLocked();
  const eliteChance = Math.round(eliteShopChance() * 100);
  return `
    <section class="panel shop-panel ${locked ? "shop-locked" : ""}" aria-label="Devil's Offerings">
      <div class="panel-header">
        <div class="shop-title-wrap">
          <div class="panel-title">Devil's Offerings</div>
          <div class="elite-chance-label">${eliteChance}% ELITE</div>
        </div>
        <div class="reroll-control">
          <button class="small-button reroll-button" id="rerollShop" ${locked || actionsLocked ? "disabled" : ""}>Reroll <span class="reroll-cost">${currentRerollCost()}${SIN_MARK}</span></button>
        </div>
      </div>
      <div class="shop-slots">
        ${locked ? `<div class="shop-lock-message"><img class="shop-lock-sigil" src="assets/seals/satan/lucifer-wide.png" alt="" /><span>Satan has sealed Devil's Offerings.</span></div>` : state.shop.map((slot, index) => renderShopSlot(slot, index)).join("")}
      </div>
    </section>
  `;
}

function renderShopSlot(slot, index) {
  if (!slot || slot.sold || (slot.item?.type === "passive" && REMOVED_PASSIVE_IDS.has(slot.item.id))) {
    return `<div class="item-card"><div class="empty-state">Sold out until reroll</div></div>`;
  }

  const item = slot.item;
  const cost = shopPrice(item);
  const passiveCopies = item.type === "passive" ? directPassiveStack(item.id) : 0;
  const ownedSelfStackingSeal = item.type === "passive" && isSelfStackingSeal(item.id) && passiveCopies > 0;
  const full =
    item.type === "passive"
      ? passiveCopies === 0 && !hasSealSlotRoomFor(item)
      : state.player.actives.length >= activeInventoryLimit();
  const disabled = arcadeActionLocked() || shopDisabledBySatan() || !canSpendCredits(cost) || full || ownedSelfStackingSeal ? "disabled" : "";
  const buttonText = ownedSelfStackingSeal ? "Owned" : passiveCopies ? `Upgrade ${cost}${SIN_MARK}` : full ? "Full" : `Buy ${cost}${SIN_MARK}`;
  const previewItem = ownedSelfStackingSeal ? passiveEntry(item.id) || item : passiveCopies ? { ...item, stack: passiveCopies + 1 } : item;
  const displayName = passiveCopies ? passiveDisplayName(previewItem) : item.name;
  const description = itemDescription(previewItem);
  const itemImage =
    item.type === "passive" ? renderSealSigil(previewItem, "shop-seal-sigil") : renderArtifactIcon(previewItem, "shop-artifact-icon");
  const imageClass = itemImage ? `has-item-icon ${item.type === "passive" ? "has-seal-sigil" : "has-artifact-icon"}` : "";
  const kindLabel = item.type === "passive" ? (SATAN_SEAL_IDS.has(item.id) ? "SATAN SEAL" : "SEAL") : "ARTIFACT";

  return `
    <article class="item-card ${item.type} ${imageClass} ${passiveCopies && !ownedSelfStackingSeal ? "elite-offer" : ""} ${SATAN_SEAL_IDS.has(item.id) ? "satan-offer" : ""}" data-tooltip="${escapeAttr(description)}">
      ${itemImage}
      <div class="item-top">
        <div>
          <div class="item-name">${displayName}</div>
        </div>
        <span class="item-kind">${kindLabel}</span>
      </div>
      <div class="item-actions one">
        <button class="small-button shop-buy-button" data-buy="${index}" ${disabled}>${buttonText}</button>
      </div>
    </article>
  `;
}

function renderActives() {
  normalizeActiveCarouselIndex();
  const count = state.player.actives.length;
  const limit = activeInventoryLimit();
  const subtitle = count >= limit ? `${count}/${limit} FULL` : `${count}/${limit}`;
  const readyClass = state.player.actives.some((item, index) => canUseActive(index)) && !state.pendingActive ? "artifact-panel-ready" : "";
  const activeCards = count
    ? state.player.actives.map((item, index) => renderActiveItem(item, index)).join("")
    : `<div class="empty-state">No ARTIFACTS</div>`;

  return `
    <section class="panel active-panel ${readyClass}" aria-label="ARTIFACTS">
      <div class="panel-header">
        <div>
          <div class="panel-title">ARTIFACTS</div>
          <div class="panel-subtitle">${subtitle}</div>
        </div>
      </div>
      <div class="active-list scroll-active-list">${activeCards}</div>
    </section>
  `;
}

function artifactStateClass(index, actionLocked) {
  if (canUseActive(index) && !actionLocked) return "artifact-ready";
  if (state.stage === "active" && state.roundState && !state.roundState.penaltiesApplied) return "artifact-spent";
  return "artifact-waiting";
}

function renderActiveItem(item, index) {
  const actionLocked = Boolean(state.pendingActive);
  const useDisabled = canUseActive(index) && !actionLocked ? "" : "disabled";
  const sellDisabled = actionLocked || arcadeActionLocked() ? "disabled" : "";
  const sale = activeSellValue(item);
  const description = itemDescription(item);
  const itemImage = renderArtifactIcon(item, "inventory-artifact-icon");
  const memoryLine =
    item.id === "a18" ? `<div class="artifact-memory-line">Last: ${escapeHtml(lastUsedArtifactName())}</div>` : "";
  return `
    <article class="item-card active ${itemImage ? "has-item-icon has-artifact-icon" : ""} ${artifactStateClass(index, actionLocked)}" data-tooltip="${escapeAttr(description)}">
      ${itemImage}
      <div class="item-top">
        <div>
          <div class="item-name">${item.name}</div>
          ${memoryLine}
          <div class="price">Sell ${sale}${SIN_MARK}</div>
        </div>
        <span class="item-kind">ARTIFACT</span>
      </div>
      <div class="item-actions">
        <button class="small-button" data-use-active="${index}" ${useDisabled}>Use</button>
        <button class="small-button sell-button" data-sell-active="${index}" ${sellDisabled}>Sell</button>
      </div>
    </article>
  `;
}

function renderPassives() {
  pruneRemovedPassives();
  const slots = [];
  const limit = passiveLimit();
  let occupiedSlots = 0;
  if (state.mode === "arcade") {
    trackEquippedSeals(state.player.passives.filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id)).map((item) => item.id));
  }
  state.player.passives.forEach((item, index) => {
    if (!item || REMOVED_PASSIVE_IDS.has(item.id) || occupiedSlots >= limit) return;
    const slotCost = sealSlotCost(item);
    occupiedSlots += slotCost;
    const sale = Math.floor((item.price * (item.stack || 1)) / 2) + (item.saleBonus || 0);
    const displayName = passiveDisplayName(item);
    const description = itemDescription(item);
    const disabledNotice = sealSuppressionNotice(item.id);
    const tooltip = renderSealTooltipHtml(item, displayName, description, disabledNotice, sale);
    const revealStep = currentRoundRevealStep();
    const revealClass =
      revealStep?.id === item.id ? (roundRevealEffectActive() ? "round-reveal-effect" : "round-reveal-active") : "";
    const triggeredClass = roundRevealAnimationActive()
      ? revealStep?.id === item.id
        ? "triggered"
        : ""
      : state.roundState?.triggeredPassiveIds?.has(item.id)
        ? "triggered"
        : "";
    const suppressedClass = isSealSuppressed(item.id) ? "suppressed" : "";
    const counterBadge = item.id === "p39" ? `<div class="passive-counter">Stacks ${item.counter || 0}</div>` : "";
    const sealImage =
      renderSealSigil(item, "equipped-seal-sigil") +
      (revealClass && !SATAN_SEAL_IDS.has(item.id) ? renderSealSigil(item, "equipped-seal-sigil seal-fill-sigil") : "");
    const sellDisabled = arcadeActionLocked() ? "disabled" : "";
    const wideClass = slotCost > 1 ? "wide-seal-slot" : "";
    const summon = sealSummonAttrs(item.id);
    slots.push(`
      <article class="passive-slot ${wideClass} ${triggeredClass} ${revealClass} ${suppressedClass} ${summon.className}"${summon.style} data-tooltip-html="${escapeAttr(tooltip)}">
        ${sealImage}
        ${counterBadge}
        <button class="small-button sell-button seal-sell-button" data-sell-passive="${index}" aria-label="Sell ${escapeAttr(displayName)}" ${sellDisabled}>Sell</button>
      </article>
    `);
  });
  const emptyCount = Math.max(0, limit - occupiedSlots);
  for (let index = 0; index < emptyCount; index += 1) {
    slots.push(`
      <div class="passive-slot empty" data-tooltip="Empty SEAL slot" aria-label="Empty SEAL slot">
        <img class="empty-seal-slot-image" src="assets/ui/empty-seal-slot-x.png" alt="" />
      </div>
    `);
  }

  return `<footer class="passive-bar" aria-label="SEALS">${slots.join("")}</footer>`;
}

function renderOverlay() {
  if (roundRevealAnimationActive()) return `<div class="overlay"></div>`;
  if (!state.gameOver || state.inspectingGameOver) return `<div class="overlay"></div>`;
  const stats = ensureRunStats();
  const bestSeal = stats.maxSealRoundDamage?.value > 0 ? `${stats.maxSealRoundDamage.name} (${formatNumber(stats.maxSealRoundDamage.value)})` : "None";
  const statRow = (label, value) => `<div class="end-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
  return `
    <div class="overlay visible game-over-overlay">
      <img class="end-figure end-figure-left" src="assets/ui/jesus.png" alt="" />
      <img class="end-figure end-figure-right" src="assets/ui/devil.png" alt="" />
      <section class="end-card game-over-card">
        <h1 class="end-title">Game Over</h1>
        <p class="end-copy">The table solved you in round ${state.round}.</p>
        <div class="end-stats">
          ${statRow("Round", state.round)}
          ${statRow("KOs", formatNumber(state.eliminations))}
          ${statRow("Bosses", formatNumber(state.bossKills))}
          ${statRow("Pentakills", formatNumber(stats.pentakills || 0))}
          ${statRow("Damage dealt", formatNumber(stats.overallDamage || 0))}
          ${statRow("Best round", formatNumber(stats.singleRoundDamage || 0))}
          <div class="end-stat end-stat-wide"><span>Strongest seal</span><strong>${escapeHtml(bestSeal)}</strong></div>
        </div>
        <div class="end-actions">
          <button class="primary-button" id="inspectGame">Inspect</button>
          <button class="primary-button end-restart" id="restartGame">Restart</button>
        </div>
      </section>
    </div>
  `;
}

// PENTAKILL is now a full-screen moment (see startMoment in watchMoments)
function renderPentakillPopup() {
  return "";
}

function showMainMenu(screen = "main") {
  saveArcadeRun();
  pvpClearAutoTimer();
  pvpStopHostPolling();
  clearNativeArcadeResumeOnForeground();
  state.mode = "menu";
  state.menuScreen = screen;
  state.pendingRunDeleteSlotId = null;
  state.pauseOpen = false;
  state.mobileOfferingsOpen = false;
  render();
}

function requestRunRemoval(slotId) {
  state.pendingRunDeleteSlotId = slotId || null;
  render();
}

function cancelRunRemoval() {
  state.pendingRunDeleteSlotId = null;
  render();
}

function confirmRunRemoval(slotId) {
  removeArcadeRunSlot(slotId);
  if (state.currentRunSlotId === slotId) state.currentRunSlotId = null;
  state.pendingRunDeleteSlotId = null;
  render();
}

function handleMenuAction(action) {
  resumeSoundtrack();
  if (action === "play") {
    state.menuScreen = "play";
    state.pendingRunDeleteSlotId = null;
    render();
    return;
  }
  if (action === "options") {
    state.menuScreen = "options";
    render();
    return;
  }
  if (action === "sound-options") {
    state.menuScreen = "sound";
    render();
    return;
  }
  if (action === "records") {
    state.menuScreen = "records";
    render();
    return;
  }
  if (action === "back") {
    state.menuScreen = "main";
    state.pendingRunDeleteSlotId = null;
    render();
    return;
  }
  if (action === "arcade") {
    state.menuScreen = "arcade-options";
    state.pendingRunDeleteSlotId = null;
    render();
    return;
  }
  if (action === "load-run") {
    state.menuScreen = "arcade-runs";
    state.pendingRunDeleteSlotId = null;
    render();
    return;
  }
  if (action === "continue-arcade") {
    if (loadArcadeRun()) {
      resumeSoundtrack();
      render();
    } else {
      startGame();
    }
    return;
  }
  if (action === "pvp") {
    requestPvpMode();
    return;
  }
  if (action === "quit") {
    state.menuScreen = "quit";
    render();
    window.close();
  }
}

function updateDisplaySetting(key, value) {
  if (!(key in state.display)) return;
  if (key === "outlineBoil") state.display.outlineBoil = clamp(Math.round(Number(value) || 0), 0, 3);
  saveDisplaySettings();
  applyDisplaySettings();
  document.querySelectorAll(`[data-display-value="${key}"]`).forEach((label) => {
    label.textContent = OUTLINE_BOIL_LABELS[state.display.outlineBoil] || "Off";
  });
  document.querySelectorAll(`[data-display-setting="${key}"]`).forEach((control) => {
    if (Number(control.value) !== state.display.outlineBoil) control.value = String(state.display.outlineBoil);
  });
}

function updateSoundSetting(key, value, renderAfter = true) {
  if (key === "muted") {
    state.sound.muted = Boolean(value);
  } else if (key in state.sound) {
    state.sound[key] = clamp(Number(value) / 100, 0, 1);
  }
  saveSoundSettings();
  applySoundSettings();
  if (renderAfter) render();
}

function handlePauseAction(action) {
  if (action === "dev") {
    state.pauseDevOpen = !state.pauseDevOpen;
    render();
    return;
  }
  if (action === "resume") {
    state.pauseOpen = false;
    render();
    return;
  }
  if (action === "restart") {
    if (state.mode === "pvp") restartPvpMode();
    else startGame();
    return;
  }
  if (action === "pvp") {
    requestPvpMode();
    return;
  }
  if (action === "arcade") {
    switchToArcadeMode();
    return;
  }
  if (action === "menu") {
    showMainMenu();
  }
}

/* ---------- Animated main menu: rotating background + glitching title ---------- */
// Layout is in artwork pixels (1672x941), scaled like background-size: cover.
const MENU_ART_W = 1672;
const MENU_ART_H = 941;
const MENU_BG_PIVOT = { x: 837, y: 312 }; // centre of the circle behind the title
const MENU_BG_COVER = 780; // radius around the pivot that menu-bg-spin.jpg fully covers
const MENU_BG_SPIN_MS = 240000;
// node: the live backdrop (background, doorway, figures, logo). It is built once and moved into each
// re-rendered menu so clicking buttons never reloads or restarts it.
const menuBackdropState = { startedAt: 0, resizeBound: false, glitchStarted: false, node: null };
// fixed dark doorway behind the buttons (art pixels): matches .menu-door in styles.css
const MENU_DOOR = { cx: 696 + 283 / 2, top: 476, solidTop: 55, solidBottom: 388 };

function menuReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// slow embers drifting up through the menu art (positions picked once, the backdrop node is reused)
function renderMenuEmbers() {
  const embers = Array.from({ length: 22 }, (_, index) => {
    const x = Math.round(80 + Math.random() * 1510);
    const size = (1.6 + Math.random() * 2.6).toFixed(1);
    const duration = (9 + Math.random() * 10).toFixed(1);
    const delay = (-Math.random() * 19).toFixed(1);
    const drift = Math.round(-60 + Math.random() * 120);
    const red = index % 4 === 0 ? " ember-red" : "";
    return `<span class="menu-ember${red}" style="left:${x}px;--ember-size:${size}px;--ember-drift:${drift}px;animation-duration:${duration}s;animation-delay:${delay}s"></span>`;
  }).join("");
  return `<div class="menu-embers">${embers}</div>`;
}

function renderMenuBackdrop() {
  return `
      <div class="menu-backdrop" aria-hidden="true">
        <svg width="0" height="0" style="position:absolute">
          <filter id="menuGlitchRed" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.86 0 0 0 0  0.1 0 0 0 0  0.12 0 0 0 0  0 0 0 1 0"/></filter>
          <filter id="menuGlitchCyan" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.91 0 0 0 0  0.89 0 0 0 0  0.84 0 0 0 0  0 0 0 0.75 0"/></filter>
        </svg>
        <div class="menu-stage">
          <div class="menu-bg-spin"><img class="menu-bg-img" src="assets/ui/menu/menu-bg-spin.jpg" alt=""></div>
          <img class="menu-door" src="assets/ui/menu/menu-door.webp" alt="">
          <div class="menu-logo-glow"></div>
          ${renderMenuFigure("jesus")}
          ${renderMenuFigure("satan")}
          ${renderMenuEmbers()}
          <div class="menu-logo">
            <img class="logo-base" src="assets/ui/menu/menu-logo.webp" alt="">
            <img class="logo-red" src="assets/ui/menu/menu-logo.webp" alt="">
            <img class="logo-cyan" src="assets/ui/menu/menu-logo.webp" alt="">
            <img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt=""><img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt=""><img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt="">
            <img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt=""><img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt=""><img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt="">
          </div>
        </div>
      </div>`;
}

function initMenuBackdrop() {
  if (!menuBackdropState.startedAt) menuBackdropState.startedAt = Date.now();
  const slot = document.querySelector(".menu-backdrop-slot");
  if (slot && menuBackdropState.node) slot.replaceWith(menuBackdropState.node);
  else menuBackdropState.node = document.querySelector(".menu-backdrop");
  // keep the rotation continuous when the menu re-renders (switching screens)
  const spinImg = document.querySelector(".menu-bg-img");
  if (spinImg) {
    const elapsed = (Date.now() - menuBackdropState.startedAt) % MENU_BG_SPIN_MS;
    spinImg.style.animationDelay = `-${elapsed}ms`;
  }
  // CSS animations restart when the backdrop is moved into the new menu, so resume them where they were
  const crown = document.querySelector(".menu-fig .fig-crown-shimmer");
  if (crown) crown.style.animationDelay = `-${(Date.now() - menuBackdropState.startedAt) % 7500}ms`;
  layoutMenuBackdrop();
  initMenuFigures(menuReducedMotion());
  if (!menuBackdropState.resizeBound) {
    menuBackdropState.resizeBound = true;
    window.addEventListener("resize", layoutMenuBackdrop);
    // button heights change once the menu font has loaded
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutMenuBackdrop);
  }
  if (!menuBackdropState.glitchStarted && !menuReducedMotion()) {
    menuBackdropState.glitchStarted = true;
    setTimeout(menuLogoGlitchBurst, 1400);
  }
}

function layoutMenuBackdrop() {
  const backdrop = document.querySelector(".menu-backdrop");
  const stage = backdrop?.querySelector(".menu-stage");
  if (!backdrop || !stage) return;
  const vw = backdrop.clientWidth || window.innerWidth;
  const vh = backdrop.clientHeight || window.innerHeight;
  const s = Math.max(vw / MENU_ART_W, vh / MENU_ART_H);
  const ox = (vw - MENU_ART_W * s) / 2;
  const oy = (vh - MENU_ART_H * s) / 2;
  stage.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
  // smallest zoom that keeps the visible screen covered at every angle of the spin
  const x0 = Math.max(0, -ox / s);
  const y0 = Math.max(0, -oy / s);
  const x1 = Math.min(MENU_ART_W, (vw - ox) / s);
  const y1 = Math.min(MENU_ART_H, (vh - oy) / s);
  let far = 0;
  for (const x of [x0, x1]) {
    for (const y of [y0, y1]) far = Math.max(far, Math.hypot(x - MENU_BG_PIVOT.x, y - MENU_BG_PIVOT.y));
  }
  const zoom = Math.max(1, (far + 2) / MENU_BG_COVER);
  const spin = stage.querySelector(".menu-bg-spin");
  if (spin) spin.style.transform = `scale(${zoom.toFixed(4)})`;
  // centre the menu buttons inside the solid part of the fixed dark doorway
  const panel = document.querySelector(".main-menu-panel");
  const menu = document.querySelector(".main-menu");
  if (panel && menu) {
    const doorX = ox + MENU_DOOR.cx * s;
    const doorMid = oy + (MENU_DOOR.top + (MENU_DOOR.solidTop + MENU_DOOR.solidBottom) / 2) * s;
    const h = panel.offsetHeight;
    const top = Math.max(8, Math.min(doorMid - h / 2, vh - h - 12));
    panel.classList.add("door-anchored");
    panel.style.left = `${doorX}px`;
    panel.style.top = `${top}px`;
  }
}

function menuLogoGlitchBurst() {
  const logo = document.querySelector(".menu-logo");
  const schedule = () => setTimeout(menuLogoGlitchBurst, 2600 + Math.random() * 4400);
  if (!logo || document.hidden) {
    schedule();
    return;
  }
  const base = logo.querySelector(".logo-base");
  const red = logo.querySelector(".logo-red");
  const cyan = logo.querySelector(".logo-cyan");
  const slices = [...logo.querySelectorAll(".logo-slice")];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const reset = () => {
    logo.style.opacity = "";
    for (const el of [base, red, cyan, ...slices]) if (el) el.style.cssText = "";
  };
  const frame = (strength) => {
    const cuts = [0, ...Array.from({ length: slices.length - 1 }, () => rnd(4, 96)).sort((a, b) => a - b), 100];
    slices.forEach((el, i) => {
      const shift = Math.random() < 0.45 ? rnd(-1, 1) * rnd(6, 34) * strength : 0;
      el.style.clipPath = `inset(${cuts[i]}% 0 ${100 - cuts[i + 1]}% 0)`;
      el.style.transform = `translateX(${shift.toFixed(1)}px)`;
      el.style.opacity = "1";
    });
    base.style.opacity = "0";
    const dx = rnd(3, 11) * strength;
    const dy = rnd(-2, 2) * strength;
    red.style.opacity = String(rnd(0.45, 0.85));
    red.style.transform = `translate(${-dx}px, ${dy}px)`;
    cyan.style.opacity = String(rnd(0.45, 0.85));
    cyan.style.transform = `translate(${dx}px, ${-dy}px)`;
    logo.style.opacity = Math.random() < 0.15 ? String(rnd(0.35, 0.7)) : "";
  };
  const strength = Math.random() < 0.25 ? 1.6 : 1;
  const frames = Math.round(rnd(4, 9) * strength);
  let n = 0;
  const step = () => {
    if (!logo.isConnected) {
      schedule();
      return;
    }
    if (n++ < frames) {
      if (Math.random() < 0.2) reset();
      else frame(strength);
      setTimeout(step, rnd(35, 85));
    } else {
      reset();
      schedule();
    }
  };
  step();
}

/* ---------- Menu figures: cloth drift, tail, claw, crown, hover (all slow and subtle) ---------- */
// Coordinates in each figure's padded frame (pixels of its base image).
const MENU_FIGURES = {
  jesus: {
    side: "left",
    stage: { left: -34, top: 62, width: 836, srcW: 866 },
    files: ["base", "cloth", "head", "crown"],
    meta: {"W": 898, "H": 1229, "pad": 16, "head": {"x": 343, "y": 16, "w": 228, "h": 214}, "head_pivot": [425, 190], "eyes": [[462, 113, 16, 8]], "crown_y": 88, "crown": {"x": 364, "y": 16, "w": 205, "h": 88}},
    leanDeg: 0.4,
    feet: [420, 1150],
    clothAmp: 1.3,
  },
  satan: {
    side: "right",
    stage: { left: 1006, top: 78, width: 716, srcW: 747 },
    files: ["base", "cloth", "head", "claw", "tailA", "tailB"],
    meta: {"W": 779, "H": 1206, "pad": 16, "head": {"x": 222, "y": 16, "w": 247, "h": 229}, "claw": {"x": 271, "y": 216, "w": 115, "h": 128}, "tailA": {"x": 500, "y": 600, "w": 44, "h": 169}, "tailB": {"x": 528, "y": 754, "w": 115, "h": 172}, "head_pivot": [350, 205], "claw_pivot": [282, 312], "tailA_pivot": [500, 600], "tailB_pivot": [519, 745], "eyes": [[323, 106, 15, 10], [303, 143, 16, 11]]},
    leanDeg: -0.4,
    feet: [330, 1130],
    clothAmp: 1.1,
  },
};

function menuFigureSrc(name, file) {
  return `assets/ui/menu/${name}-${file}${file === "cloth" ? ".png" : ".webp"}`;
}

function renderMenuFigure(name) {
  const f = MENU_FIGURES[name];
  const m = f.meta;
  const P = m.pad;
  const k = f.stage.width / f.stage.srcW;
  const part = (key, cls = key) => m[key]
    ? `<img class="fig-part fig-${cls}" src="${menuFigureSrc(name, key)}" alt="" style="left:${m[key].x}px;top:${m[key].y}px;width:${m[key].w}px;height:${m[key].h}px">`
    : "";
  const origin = (p) => `transform-origin:${p[0] + P}px ${p[1] + P}px`;
  const tail = m.tailA ? `
      <div class="fig-group fig-tailA-group" style="${origin(m.tailA_pivot)}">
        ${part("tailA")}
        <div class="fig-group fig-tailB-group" style="${origin(m.tailB_pivot)}">${part("tailB")}</div>
      </div>` : "";
  const claw = m.claw ? `<div class="fig-group fig-claw-group" style="${origin(m.claw_pivot)}">${part("claw")}</div>` : "";
  const crown = m.crown ? part("crown", "crown-shimmer") : "";
  return `
    <div class="menu-fig menu-fig-${name}" data-fig="${name}"
         style="left:${f.stage.left - P * k}px;top:${f.stage.top - P * k}px;width:${m.W}px;height:${m.H}px;transform:scale(${k})">
      <div class="fig-lean" style="transform-origin:${f.feet[0] + P}px ${f.feet[1] + P}px">
        <div class="fig-live">
          <img class="fig-base-img" src="${menuFigureSrc(name, "base")}" alt="">
          <canvas class="fig-cloth" width="${m.W}" height="${m.H}"></canvas>
          ${tail}
          ${claw}
          <div class="fig-group fig-head-group" style="${origin(m.head_pivot)}">
            ${part("head")}
            ${crown}
          </div>
        </div>
      </div>
    </div>`;
}

/* ---- runtime ---- */
const menuFigState = { started: false, rigs: {}, raf: 0, last: 0, hoverBound: false };
const figRnd = (a, b) => a + Math.random() * (b - a);
const figEase = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

function initMenuFigures(reduceMotion) {
  for (const name of Object.keys(MENU_FIGURES)) {
    const el = document.querySelector(`.menu-fig-${name}`);
    if (!el) continue;
    const prev = menuFigState.rigs[name];
    if (prev && prev.el === el) continue; // same live figure moved into the new menu: keep it as is
    // free the WebGL context of the figure from the previous render
    if (prev && prev.gl && prev.el !== el) {
      const lose = prev.gl.gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    }
    const rig = {
      name, el, cfg: MENU_FIGURES[name],
      lean: el.querySelector(".fig-lean"),
      live: el.querySelector(".fig-live"),
      head: el.querySelector(".fig-head-group"),
      claw: el.querySelector(".fig-claw-group"),
      tailA: el.querySelector(".fig-tailA-group"),
      tailB: el.querySelector(".fig-tailB-group"),
      // keep timers/state across menu re-renders
      flick: prev ? prev.flick : { start: -1 },
      curl: prev ? prev.curl : { start: -1 },
    };
    rig.gl = reduceMotion ? null : setupClothGL(rig);
    if (!rig.gl) el.querySelector(".fig-cloth").style.display = "none";
    else el.querySelector(".fig-base-img").style.visibility = "hidden";
    menuFigState.rigs[name] = rig;
  }
  bindMenuFigureHover();
  if (reduceMotion) return;
  if (!menuFigState.raf) menuFigState.raf = requestAnimationFrame(menuFigureFrame);
  if (menuFigState.started) return;
  menuFigState.started = true;
  scheduleFig("flick", () => { menuFigState.rigs.satan && (menuFigState.rigs.satan.flick.start = performance.now() / 1000); }, 14000, 26000);
  scheduleFig("curl", () => { menuFigState.rigs.satan && (menuFigState.rigs.satan.curl.start = performance.now() / 1000); }, 11000, 20000);
}

function scheduleFig(kind, fn, min, max) {
  const loop = () => {
    if (!document.hidden && document.querySelector(".menu-fig")) fn();
    setTimeout(loop, figRnd(min, max));
  };
  setTimeout(loop, figRnd(min * 0.4, max * 0.6));
}

function menuFigureFrame(now) {
  const t = now / 1000;
  let any = false;
  for (const rig of Object.values(menuFigState.rigs)) {
    if (!rig.el.isConnected) continue;
    any = true;
    if (rig.gl) drawCloth(rig, t);
    if (rig.tailA) {
      const fp = t - rig.flick.start;
      const flick = rig.flick.start > 0 && fp < 5 ? Math.sin(fp * 2.6) * Math.exp(-fp * 0.9) * 6 : 0;
      rig.tailA.style.transform = `rotate(${(1.1 * Math.sin(t * 0.3) + flick * 0.25).toFixed(2)}deg)`;
      rig.tailB.style.transform = `rotate(${(2.4 * Math.sin(t * 0.3 - 1.1) + flick).toFixed(2)}deg)`;
    }
    if (rig.claw) {
      const cp = t - rig.curl.start;
      let c = 0;
      if (rig.curl.start > 0 && cp < 7.5) c = cp < 2.2 ? figEase(cp / 2.2) : cp < 3.6 ? 1 : 1 - figEase((cp - 3.6) / 3.9);
      const idle = Math.sin(t * 0.45) * 0.35;
      rig.claw.style.transform = `rotate(${(-3 * c + idle).toFixed(2)}deg) scale(${(1 - 0.015 * c).toFixed(3)}, ${(1 - 0.025 * c).toFixed(3)})`;
    }
  }
  // stop animating once the menu is gone; initMenuFigures restarts it
  menuFigState.raf = any ? requestAnimationFrame(menuFigureFrame) : 0;
}


function bindMenuFigureHover() {
  if (menuFigState.hoverBound) return;
  menuFigState.hoverBound = true;
  const set = (btn) => {
    const action = btn ? (btn.dataset.menuAction || btn.dataset.go || "") : "";
    for (const rig of Object.values(menuFigState.rigs)) {
      if (!rig.el.isConnected) continue;
      rig.el.classList.toggle("leaning", !!btn);
      rig.el.classList.toggle("favored", (rig.name === "jesus" && action === "play") || (rig.name === "satan" && action === "quit"));
    }
  };
  document.addEventListener("pointerover", (e) => {
    const btn = e.target.closest && e.target.closest(".main-menu .menu-button");
    set(btn);
  });
  document.addEventListener("focusin", (e) => {
    const btn = e.target.closest && e.target.closest(".main-menu .menu-button");
    set(btn);
  });
}

/* ---- cloth & hair drift (WebGL displacement, weighted so face/hands/feet never move) ---- */
function setupClothGL(rig) {
  const canvas = rig.el.querySelector(".fig-cloth");
  let gl;
  try { gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }); } catch (e) { gl = null; }
  if (!gl) return null;
  const vs = `attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position = vec4(p,0.,1.); }`;
  const fs = `precision mediump float; varying vec2 uv; uniform sampler2D tex; uniform sampler2D wt; uniform vec2 size; uniform float t; uniform float amp;
    void main(){
      vec2 px = uv * size;
      float w = texture2D(wt, uv).r;
      float sway = sin(px.y * 0.035 + t * 1.5 + sin(px.x * 0.012 + t * 0.4) * 1.5);
      float flutter = sin(px.y * 0.11 - t * 3.1 + px.x * 0.02) * 0.35;
      vec2 off = w * vec2((sway + flutter) * amp, sin(px.x * 0.05 + t * 1.2) * amp * 0.35);
      gl_FragColor = texture2D(tex, (px + off) / size);
    }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const state = { gl, prog, ready: 0, uT: gl.getUniformLocation(prog, "t"), amp: rig.cfg.clothAmp };
  gl.uniform2f(gl.getUniformLocation(prog, "size"), canvas.width, canvas.height);
  gl.uniform1f(gl.getUniformLocation(prog, "amp"), rig.cfg.clothAmp);
  const load = (file, unit, uniform) => {
    const img = new Image();
    img.onload = () => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      } catch (err) {
        // e.g. game opened straight from disk (file://): fall back to the still drawing
        state.failed = true;
        canvas.style.display = "none";
        const still = rig.el.querySelector(".fig-base-img");
        if (still) still.style.visibility = "";
        return;
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.useProgram(prog); gl.uniform1i(gl.getUniformLocation(prog, uniform), unit);
      state.ready++;
    };
    img.src = menuFigureSrc(rig.name, file);
  };
  load("base", 0, "tex");
  load("cloth", 1, "wt");
  return state;
}

function drawCloth(rig, t) {
  const s = rig.gl;
  if (s.failed || s.ready < 2) return;
  const gl = s.gl;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(s.uT, (t + (rig.name === "satan" ? 17.3 : 0)) * 0.4);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function bindPvpEvents() {
  if (state.mode !== "pvp" || !state.pvp) return;

  const addLocal = document.querySelector("#pvpAddLocal");
  if (addLocal) {
    bindOn(addLocal, "click", () => {
      const input = document.querySelector("#pvpLocalName");
      pvpAddLocalPlayer(input?.value || "");
    });
  }

  const localName = document.querySelector("#pvpLocalName");
  if (localName) {
    bindOn(localName, "keydown", (event) => {
      if (event.key === "Enter") pvpAddLocalPlayer(localName.value);
    });
  }

  const readyLobby = document.querySelector("#pvpReadyLobby");
  if (readyLobby) bindOn(readyLobby, "click", pvpFillBotsAndStart);

  const addSlot = document.querySelector("#pvpAddSlot");
  if (addSlot) bindOn(addSlot, "click", pvpAddEmptySlot);

  document.querySelectorAll("[data-pvp-remove-slot]").forEach((button) => {
    bindOn(button, "click", () => pvpRemoveLobbySlot(Number(button.dataset.pvpRemoveSlot)));
  });

  document.querySelectorAll("[data-pvp-save-guess]").forEach((button) => {
    bindOn(button, "click", () => {
      const slot = Number(button.dataset.pvpSaveGuess);
      const input = document.querySelector(`#pvpGuess-${slot}`);
      pvpSetLocalGuess(slot, input?.value);
    });
  });

  const revealTarget = document.querySelector("#pvpRevealTarget");
  if (revealTarget) bindOn(revealTarget, "click", pvpPrepareActivePhase);

  const waitToggle = document.querySelector("#pvpWaitToggle");
  if (waitToggle) bindOn(waitToggle, "click", pvpToggleWait);

  document.querySelectorAll("[data-pvp-active-choice]").forEach((button) => {
    bindOn(button, "click", () => {
      const [slotText, activeId] = button.dataset.pvpActiveChoice.split(":");
      const slot = Number(slotText);
      const select = document.querySelector(`[data-pvp-target-for="${slot}-${activeId}"]`);
      pvpSetActiveChoice(slot, activeId, select?.value || null);
    });
  });

  const resolveActives = document.querySelector("#pvpResolveActives");
  if (resolveActives) {
    bindOn(resolveActives, "click", () => {
      playReadySfx();
      pvpResolveActives();
    });
  }

  const nextRound = document.querySelector("#pvpNextRound");
  if (nextRound) {
    bindOn(nextRound, "click", () => {
      playNextRoundSfx();
      pvpNextRound();
    });
  }

  const restart = document.querySelector("#pvpRestart");
  if (restart) bindOn(restart, "click", restartPvpMode);
}

function bindEvents() {
  document.querySelectorAll("[data-menu-action]").forEach((button) => {
    bindOn(button, "click", () => handleMenuAction(button.dataset.menuAction));
  });

  document.querySelectorAll("[data-run-slot-id]").forEach((button) => {
    bindOn(button, "click", () => {
      if (loadArcadeRun(button.dataset.runSlotId)) {
        resumeSoundtrack();
        render();
      } else {
        startGame();
      }
    });
  });

  document.querySelectorAll("[data-new-run]").forEach((button) => {
    bindOn(button, "click", () => startGame());
  });

  document.querySelectorAll("[data-remove-run-slot-id]").forEach((button) => {
    bindOn(button, "click", () => requestRunRemoval(button.dataset.removeRunSlotId));
  });

  document.querySelectorAll("[data-confirm-remove-run]").forEach((button) => {
    bindOn(button, "click", () => confirmRunRemoval(button.dataset.confirmRemoveRun));
  });

  document.querySelectorAll("[data-cancel-remove-run]").forEach((button) => {
    bindOn(button, "click", cancelRunRemoval);
  });

  document.querySelectorAll("[data-display-setting]").forEach((control) => {
    bindOn(control, "input", () => updateDisplaySetting(control.dataset.displaySetting, control.value));
  });

  document.querySelectorAll("[data-sound-setting]").forEach((control) => {
    const key = control.dataset.soundSetting;
    if (key === "muted") {
      bindOn(control, "change", () => updateSoundSetting(key, control.checked));
      return;
    }
    bindOn(control, "input", () => {
      updateSoundSetting(key, control.value, false);
      document.querySelectorAll(`[data-sound-value="${key}"]`).forEach((valueLabel) => {
        valueLabel.textContent = `${control.value}%`;
      });
    });
  });

  const pauseButton = document.querySelector("#pauseButton");
  if (pauseButton) {
    bindOn(pauseButton, "click", () => {
      state.pauseOpen = true;
      render();
    });
  }

  const playtestMoney = document.querySelector("#playtestMoney");
  if (playtestMoney) bindOn(playtestMoney, "click", togglePlaytestMoneyMode);

  const skipProgression = document.querySelector("#skipProgression");
  if (skipProgression) bindOn(skipProgression, "click", skipArcadeProgression);

  const mobileOfferingsToggle = document.querySelector("#mobileOfferingsToggle");
  if (mobileOfferingsToggle) {
    bindOn(mobileOfferingsToggle, "click", () => {
      state.mobileOfferingsOpen = true;
      render();
    });
  }

  const mobileOfferingsClose = document.querySelector("#mobileOfferingsClose");
  if (mobileOfferingsClose) {
    bindOn(mobileOfferingsClose, "click", () => {
      state.mobileOfferingsOpen = false;
      render();
    });
  }

  const mobileOfferingsBackdrop = document.querySelector("#mobileOfferingsBackdrop");
  if (mobileOfferingsBackdrop) {
    bindOn(mobileOfferingsBackdrop, "click", () => {
      state.mobileOfferingsOpen = false;
      render();
    });
  }

  document.querySelectorAll("[data-pause-action]").forEach((button) => {
    bindOn(button, "click", () => handlePauseAction(button.dataset.pauseAction));
  });

  bindPvpEvents();

  const mainAction = document.querySelector("#mainAction");
  if (mainAction) {
    bindOn(mainAction, "click", performMainAction);
  }

  const guessInput = document.querySelector("#guessInput");
  if (guessInput) {
    bindOn(guessInput, "keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        performMainAction();
      }
    });
  }

  document.querySelectorAll("[data-numpad-key]").forEach((button) => {
    bindOn(button, "click", () => {
      handleMobileNumpadKey(button.dataset.numpadKey);
      button.blur();
    });
  });

  document.querySelectorAll("[data-buy]").forEach((button) => {
    bindOn(button, "click", () => buyShopItem(Number(button.dataset.buy)));
  });

  document.querySelectorAll("[data-sell-passive]").forEach((button) => {
    bindOn(button, "click", () => sellPassive(Number(button.dataset.sellPassive)));
  });

  document.querySelectorAll("[data-sell-active]").forEach((button) => {
    bindOn(button, "click", () => sellActive(Number(button.dataset.sellActive)));
  });

  document.querySelectorAll("[data-use-active]").forEach((button) => {
    bindOn(button, "click", () => useActive(Number(button.dataset.useActive)));
  });

  document.querySelectorAll("[data-active-prev]").forEach((button) => {
    bindOn(button, "click", () => moveActiveCarousel(-1));
  });

  document.querySelectorAll("[data-active-next]").forEach((button) => {
    bindOn(button, "click", () => moveActiveCarousel(1));
  });

  const cancelActive = document.querySelector("#cancelPendingActive");
  if (cancelActive) bindOn(cancelActive, "click", cancelPendingActive);

  const floatingTooltip = document.querySelector("#floatingTooltip");
  if (floatingTooltip) {
    document.querySelectorAll("[data-tooltip], [data-tooltip-html]").forEach((element) => {
      bindOn(element, "mouseenter", (event) => {
        if (element.dataset.tooltipHtml) {
          floatingTooltip.innerHTML = element.dataset.tooltipHtml;
        } else {
          floatingTooltip.innerHTML = descriptionHtml(element.dataset.tooltip);
        }
        floatingTooltip.classList.add("visible");
        positionFloatingTooltip(event, floatingTooltip);
      });
      bindOn(element, "mousemove", (event) => {
        positionFloatingTooltip(event, floatingTooltip);
      });
      bindOn(element, "mouseleave", () => {
        floatingTooltip.classList.remove("visible");
        floatingTooltip.innerHTML = "";
      });
    });
  }

  document.querySelectorAll("[data-pick-bot]").forEach((button) => {
    bindOn(button, "click", () => chooseBot(Number(button.dataset.pickBot)));
  });

  const rerollButton = document.querySelector("#rerollShop");
  if (rerollButton) bindOn(rerollButton, "click", rerollShopClick);

  const restartButton = document.querySelector("#restartGame");
  if (restartButton) bindOn(restartButton, "click", startGame);

  const inspectButton = document.querySelector("#inspectGame");
  if (inspectButton) {
    bindOn(inspectButton, "click", () => {
      state.inspectingGameOver = true;
      render();
    });
  }
}

function saveArcadeRunForNativeExit() {
  markNativeArcadeResumeOnForeground();
  saveArcadeRun();
}

function blockNativeSelection(event) {
  if (isNativeArcadeApp()) event.preventDefault();
}

function installNativeSelectionGuards() {
  if (!isNativeArcadeApp()) return;
  document.addEventListener("selectstart", blockNativeSelection, { passive: false });
  document.addEventListener("contextmenu", blockNativeSelection, { passive: false });
  document.addEventListener("dragstart", blockNativeSelection, { passive: false });
}

window.addEventListener("resize", updateFullscreenLayoutClass);
window.addEventListener("pagehide", saveArcadeRunForNativeExit);
window.addEventListener("beforeunload", saveArcadeRunForNativeExit);
document.addEventListener("fullscreenchange", updateFullscreenLayoutClass);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    saveArcadeRunForNativeExit();
    if (isNativeArcadeApp()) pauseGameAudioForBackground();
    return;
  }
  if (isNativeArcadeApp()) {
    if (state.mode === "menu") resumeNativeArcadeOnForeground();
    resumeGameAudioAfterForeground();
  }
});
window.addEventListener("blur", () => {
  if (isNativeArcadeApp()) pauseGameAudioForBackground();
});
window.addEventListener("focus", () => {
  if (isNativeArcadeApp()) resumeGameAudioAfterForeground();
});

loadSoundSettings();
loadDisplaySettings();
installSoundtrack();
installArcadeEnterShortcut();
installShiftTooltipMore();
installNativeSelectionGuards();
updateFullscreenLayoutClass();
if (!resumeNativeArcadeOnForeground()) {
  if (pvpShouldAutoStartFromHash()) {
    if (window.history?.replaceState) window.history.replaceState(null, "", `${location.pathname}${location.search}`);
    startPvpMode();
  } else {
    showMainMenu();
  }
}
