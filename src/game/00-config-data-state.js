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
// KOs between BOSSES: 8-12 during the main game (the 8 unique BOSSES), 4-8 after it
const BOSS_KILL_INTERVAL_MIN = 8;
const BOSS_KILL_INTERVAL_MAX = 12;
const ENDLESS_BOSS_KILL_INTERVAL_MIN = 4;
const ENDLESS_BOSS_KILL_INTERVAL_MAX = 8;
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
// Settings that are a choice between a few values (Settings > Display / Gameplay)
const ANIM_SPEED_VALUES = [1, 2, 4];
const SCREEN_SHAKE_LABELS = ["Off", "Low", "Full"];
const FLASH_LABELS = ["Reduced", "Full"];
const TEXT_SIZE_LABELS = ["Normal", "Large"];
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
    description: "Gain +1 ARTIFACT use per round and +1 ARTIFACT inventory slot. Each ELITE level adds +1 more to both."
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
    name: "Seal of Samael Septagram",
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
      "Reveal one extra DAMNED each round. If a revealed DAMNED takes the worst guess penalty, all revealed DAMNED take it. ELITE adds +2% max-HEALTH to the penalty the other revealed DAMNED take each level."
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
      "Reveal one extra DAMNED each round. Revealed DAMNED pay double BOUNTY SIN when eliminated. ELITE raises the payout multiplier by +20%."
  },
  p65: {
    id: "p65",
    type: "passive",
    name: "Seal of Naberius",
    price: 10,
    description: "Reveal one extra DAMNED each round. At end of round, revealed DAMNED take damage equal to half their guess. ELITE multiplies the damage by x1.5 each level, rounded up."
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
    name: "Seal of Cassiel Hexagram",
    price: 14,
    description:
      "Whenever a DAMNED hits CRITICAL, gain 1 SIN. DAMNED CRITICAL damage cannot hurt you. ELITE increases the SIN gained by +20% each level, rounded up."
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
      "If 3 or more DAMNED are eliminated in one round, deal 20 damage split equally among the DAMNED that remain. If a BOSS is alive, all of it goes to the BOSS instead. ELITE multiplies the damage by x1.5 each level, rounded up."
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
    name: "Seal of Cassiel's Pentagram",
    price: 16,
    description: "At reveal, 30% chance to change the TARGET to your guess. ELITE adds +5% chance, capped at 80%."
  },
  p93: {
    id: "p93",
    type: "passive",
    name: "Seal of Zachriel's Triangle",
    price: 16,
    description: "When you press READY, 30% chance to double every DAMNED BOUNTY. ELITE adds +5% chance, capped at 80%."
  },
  p94: {
    id: "p94",
    type: "passive",
    name: "Seal of Aggiel's Hexagram",
    price: 16,
    description: "At reveal, 30% chance to give 5 random temporary ARTIFACTS usable only this round. ELITE adds +5% chance, capped at 80%."
  },
  p95: {
    id: "p95",
    type: "passive",
    name: "Seal of Cassiel's Sigil",
    price: 16,
    description: "When you press READY, 30% chance for revealed DAMNED to lose 50% current HEALTH. ELITE adds +5% chance, capped at 80%."
  },
  p96: {
    id: "p96",
    type: "passive",
    name: "Seal of Samael's Triangle",
    price: 16,
    description: "When you press READY, 30% chance to make every personality STUBBORN. DAMNED already STUBBORN take 25% extra damage this round. ELITE adds +5% chance, capped at 80%."
  },
  p97: {
    id: "p97",
    type: "passive",
    name: "Seal of Samael's Star",
    price: 16,
    description: "When you press READY, 30% chance for all DAMNED to gain up to the highest living non-boss DAMNED MEMORY and take damage equal to their original MEMORY. ELITE adds +5% chance, capped at 80%."
  },
  p110: {
    id: "p110",
    type: "passive",
    name: "Seal of Cassiel's Hexagram",
    price: 16,
    description: "When you press READY, 30% chance to remove all MEMORY and BOUNTY from all DAMNED, then each DAMNED takes damage equal to the total removed MEMORY and BOUNTY. ELITE adds +5% chance, capped at 80%."
  },
  p121: {
    id: "p121",
    type: "passive",
    name: "Seal of Zilon",
    price: 16,
    description: "40% of a BOSS's BOSS BOUNTY becomes regular BOUNTY on that BOSS, and the rest is randomly distributed among the other DAMNED as BOUNTY. ELITE adds +5% to the converted share."
  },
  p122: {
    id: "p122",
    type: "passive",
    name: "Seal of Kalha",
    price: 16,
    description: "Every PENTAKILL gives a random SEAL you own an ELITE upgrade. Cannot be upgraded."
  },
  p123: {
    id: "p123",
    type: "passive",
    name: "Seal of Pyros",
    price: 16,
    description: "At the start of every round, reveal one DAMNED, even one that is already revealed. DAMNED can be revealed more than once a round; each reveal adds a reveal stack, and effects on revealed DAMNED affect them once per stack. ELITE reveals +1 more DAMNED each round."
  },
  p124: {
    id: "p124",
    type: "passive",
    name: "Seal of Padma",
    price: 16,
    description: "All non-boss DAMNED are bipolar: they have two PERSONALITIES at once and guess the average of both. An effect that changes a PERSONALITY changes only one of the two. A DAMNED with the same PERSONALITY twice is affected twice by effects that target that PERSONALITY. Cannot be upgraded."
  },
  p125: {
    id: "p125",
    type: "passive",
    name: "Seal of Petros-Pavlos",
    price: 16,
    description: "Half of MEMORY gained by a DAMNED is converted to BOUNTY, rounded down. Half of BOUNTY gained by a DAMNED is converted to MEMORY, rounded down. Converted amounts are not converted again. ELITE gives +1 free MEMORY or BOUNTY with every conversion each level."
  },
  p126: {
    id: "p126",
    type: "passive",
    name: "Seal of Serafeim",
    price: 16,
    description: "Gain +1 ARTIFACT use per round and +1 ARTIFACT inventory slot. Each ELITE level adds +1 more to both."
  },
  p127: {
    id: "p127",
    type: "passive",
    name: "Seal of Threon",
    price: 16,
    description: "Excess MEMORY that would be added to a DAMNED becomes 4 damage per excess MEMORY to that DAMNED. ELITE doubles this damage each level."
  },
  p128: {
    id: "p128",
    type: "passive",
    name: "Seal of Dantre",
    price: 16,
    description: "Whenever a DAMNED hits CRITICAL, gain 1 SIN. DAMNED CRITICAL damage cannot hurt you. A DAMNED's CRITICAL counts as your CRITICAL. ELITE increases the SIN gained by +20% each level, rounded up."
  },
  p129: {
    id: "p129",
    type: "passive",
    name: "Seal of Gusion",
    price: 14,
    description: "BOSSES can have their guesses revealed. Whenever a BOSS's guess is revealed, all revealed DAMNED take 20 damage. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p130: {
    id: "p130",
    type: "passive",
    name: "Seal of Valac",
    price: 15,
    description: "If 4 DAMNED are eliminated in a round and the only living DAMNED is not a BOSS, it is eliminated too. ELITE makes PENTAKILLS give +2 SIN each level."
  },
  // the Trinity SEALS: sold apart, but every one you own shares a single SEAL slot (see TRINITY_SEAL_IDS)
  p131: {
    id: "p131",
    type: "passive",
    name: "Seal of the Father",
    price: 33,
    description: "When you press READY, one of three is cast at random for the round: every DAMNED takes its TARGET difference as % of its max HEALTH instead of flat damage; or a random DAMNED takes 20% max-HEALTH damage at end of round; or you deal double damage. Shares one SEAL slot with the other Trinity SEALS (together, the Seal of God). Cannot be upgraded."
  },
  p132: {
    id: "p132",
    type: "passive",
    name: "Seal of the Son",
    price: 33,
    description: "When you press READY, one of three is cast at random: double SIN from every source this round; or +8 SIN; or 4 free rerolls until the end of next round. Shares one SEAL slot with the other Trinity SEALS (together, the Seal of God). Cannot be upgraded."
  },
  p133: {
    id: "p133",
    type: "passive",
    name: "Seal of the Holy Spirit",
    price: 33,
    description: "When you press READY, one of ten is cast at random: +5 MEMORY to every DAMNED; double 2 random BOUNTIES; reveal 4 DAMNED guesses next round; 3 copies of one ARTIFACT; your guess is CRITICAL; 4 DAMNED turn STUBBORN; the next SEAL offer is ELITE; a random DAMNED is eliminated; you take no TARGET-difference damage this round; or a 50% chance the missing Trinity SEALS appear in the next offerings (with all three: heal 3 HEALTH). Shares one SEAL slot with the other Trinity SEALS (together, the Seal of God). Cannot be upgraded."
  },
  p111: {
    id: "p111",
    type: "passive",
    name: "Seal of Satan",
    price: 20,
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
    description: "Whenever you make a PENTAKILL, this SEAL gains +20 damage, then its current damage is dealt to all DAMNED at the next end of round. Cannot be upgraded."
  },
  p102: {
    id: "p102",
    type: "passive",
    name: "Seal of Zachriel Triangle",
    price: 15,
    description: "Reveal one extra DAMNED each round. Whenever a revealed DAMNED dies, this SEAL gains +1 damage, then adjacent DAMNED take its current damage. Cannot be upgraded."
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
    description: "STUBBORN DAMNED guesses can only be up to 2 away from their previous guess. At the end of every round, one random DAMNED personality changes to STUBBORN. ELITE deals 5 damage to every STUBBORN DAMNED per ELITE level."
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
  p112: {
    id: "p112",
    type: "passive",
    name: "Seal of Furfur",
    price: 12,
    description: "At end of round, DAMNED whose guesses are multiples of 2 take 2 damage, multiples of 3 take 3 damage, multiples of 5 take 5 damage, and multiples of 7 take 14 damage. Matching effects add together. ELITE multiplies each damage value by x1.5 each level, rounded up."
  },
  p113: {
    id: "p113",
    type: "passive",
    name: "Seal of Halphas",
    price: 12,
    description: "At end of round, each DAMNED independently has a 30% chance to take 5 damage and a separate 10% chance to take 10 damage. ELITE multiplies both damage values by x1.5 each level, rounded up."
  },
  p114: {
    id: "p114",
    type: "passive",
    name: "Seal of Buer",
    price: 12,
    description: "Once per DAMNED per round, when it takes more than 20% of its max HEALTH as damage, gain 2 SIN. ELITE increases the SIN gained by +20% each level, rounded up."
  },
  p115: {
    id: "p115",
    type: "passive",
    name: "Seal of Botis",
    price: 12,
    description: "At end of round, each DAMNED whose guess is within +/-5 of the TARGET takes 4 damage and gives you 2 SIN. ELITE multiplies the damage by x1.5 and increases the SIN gained by +20% each level, rounded up."
  },
  p116: {
    id: "p116",
    type: "passive",
    name: "Seal of Beleth",
    price: 12,
    description: "When you hit CRITICAL, the 2 DAMNED with the best guesses take 10 extra damage. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p117: {
    id: "p117",
    type: "passive",
    name: "Seal of Shax",
    price: 11,
    description: "In a round where you hit CRITICAL, every DAMNED that dies gives you 2 extra SIN. ELITE increases the SIN by +20% each level, rounded up."
  },
  p118: {
    id: "p118",
    type: "passive",
    name: "Seal of Malphas",
    price: 13,
    description: "At end of round, each DAMNED takes 2 damage for every round it has been alive: 2 in its first round, 4 in its second, and so on. ELITE multiplies the damage by x1.5 each level, rounded up."
  },
  p119: {
    id: "p119",
    type: "passive",
    name: "Seal of Eligos",
    price: 14,
    description: "If your guess is exactly the TARGET when it is revealed (before ARTIFACTS change it), your next CRITICAL deals 20% max-HEALTH damage instead of 10%. ELITE gains +5 SIN each level whenever this happens."
  },
  p120: {
    id: "p120",
    type: "passive",
    name: "Seal of Sitri",
    price: 13,
    description: "The non-boss DAMNED with the most MEMORY gets double HEALTH and +1 MEMORY at the end of every round. Only when it dies does another DAMNED take its place. ELITE adds +1 MEMORY each round per level."
  },
  a28: {
    id: "a28",
    type: "active",
    name: "Engraved Skull",
    price: 3,
    description: "Pick a DAMNED. It gains 6 MEMORY, 6 SIN, and heals 6% max HEALTH."
  },
  a14: {
    id: "a14",
    type: "active",
    name: "Black Candle",
    price: 3,
    description: "During reveal, reduce the TARGET by 10."
  },
  a15: {
    id: "a15",
    type: "active",
    name: "Sacrificial Dagger",
    price: 3,
    description: "Pick a DAMNED. Deal 20% max-HEALTH damage to non-boss DAMNED, or 10% to BOSSES."
  },
  a6: {
    id: "a6",
    type: "active",
    name: "Ceremonial Altar",
    price: 3,
    description: "During reveal, add 20 to the TARGET."
  },
  a7: {
    id: "a7",
    type: "active",
    name: "Demonic Idol",
    price: 5,
    description: "Pick a non-boss DAMNED and swap your effective guess with theirs."
  },
  a8: {
    id: "a8",
    type: "active",
    name: "Goat Head",
    price: 2,
    description: "Pick a DAMNED; their guess counts five times for the TARGET average."
  },
  a9: {
    id: "a9",
    type: "active",
    name: "Inverted Cross",
    price: 2,
    description: "Pick a DAMNED; remove their guess from the TARGET average, though they still take damage."
  },
  a10: {
    id: "a10",
    type: "active",
    name: "Funeral Coin",
    price: 3,
    description: "Gain 3 to 10 SIN."
  },
  a11: {
    id: "a11",
    type: "active",
    name: "Vial of Blood",
    price: 2,
    description: "Pick two non-boss DAMNED. The first takes 30% max-HEALTH damage. The second overheals 30% max HEALTH and copies the first's PERSONALITY."
  },
  a12: {
    id: "a12",
    type: "active",
    name: "Dark Talisman",
    price: 3,
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
    price: 3,
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
    price: 3,
    description: "This round, whenever you take damage, each DAMNED takes max-HEALTH damage equal to the same percent of your max HEALTH that you took."
  },
  a22: {
    id: "a22",
    type: "active",
    name: "Cursed Chalice",
    price: 6,
    description: "+1 CRITICAL range for the round."
  },
  a23: {
    id: "a23",
    type: "active",
    name: "Satanic Bible",
    price: 2,
    description: "Double the ELITE chance for the SEAL slot on the next Devil's Offerings reroll."
  },
  a25: {
    id: "a25",
    type: "active",
    name: "Mummified Lamb",
    price: 2,
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
  "p109",
  "p112",
  "p113",
  "p114",
  "p115",
  "p116",
  "p117",
  "p118",
  "p119",
  "p120",
  "p121",
  "p122",
  "p123",
  "p124",
  "p125",
  "p126",
  "p127",
  "p128",
  "p129",
  "p130",
  "p131",
  "p132",
  "p133"
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
  "p62",
  "p66",
  "p81",
  "p82",
  "p83",
  // effects moved to boss seals (Petros-Pavlos, Serafeim, Threon, Dantre); demons free for new SEALS
  "p10",
  "p25",
  "p55",
  "p69"
]);
// the seven archangel SEALS (they kept the effects of the old Dev/boss SEALS, which are now the Boss SEALS below)
const DEV_SEAL_IDS = new Set(["p92", "p93", "p94", "p95", "p96", "p97", "p110"]);
// the Boss SEALS, named after the eight unique BOSSES
const BOSS_SEAL_IDS = new Set(["p121", "p122", "p123", "p124", "p125", "p126", "p127", "p128"]);
// SEALS that can never get an ELITE upgrade (the self-stacking ones, plus Kalha and Padma)
const NON_UPGRADABLE_SEAL_IDS = new Set(["p98", "p99", "p100", "p101", "p102", "p103", "p109", "p122", "p124", "p131", "p132", "p133"]);
const SATAN_SEAL_IDS = new Set(["p111"]);
// the Trinity SEALS (Father, Son, Holy Spirit): each works alone, and all the ones you own share one SEAL slot,
// drawn as one interlaced seal (TRINITY_SEAL_ART). Order here is the order of their rings in the art.
const TRINITY_SEAL_IDS = new Set(["p131", "p132", "p133"]);
const TRINITY_SEAL_ORDER = ["p131", "p132", "p133"];
// art for the shared slot, by the set owned (ids in TRINITY_SEAL_ORDER order, joined by "+")
const TRINITY_SEAL_ART = {
  p131: "trinity/father.png",
  p132: "trinity/son.png",
  p133: "trinity/spirit.png",
  "p131+p132": "trinity/father-son.png",
  "p131+p133": "trinity/father-spirit.png",
  "p132+p133": "trinity/son-spirit.png",
  "p131+p132+p133": "trinity/trinity.png"
};
// former Goetic SEALS whose demons went to newer SEALS; drawn with the old self-stacking art for now
const SPECIAL_SEAL_IDS = new Set();
const SELF_STACKING_SEAL_IDS = new Set(["p98", "p99", "p100", "p101", "p102", "p103", "p109"]);
const SELF_STACKING_SEAL_SPECS = {
  p98: { key: "critical", label: "Player CRITICAL", increment: 3 },
  p99: { key: "memoryOverTen", label: "Non-boss MEMORY over 10", increment: 2 },
  p100: { key: "bountySum", label: "BOUNTY sum over 40", increment: 1 },
  p101: { key: "pentakill", label: "PENTAKILL", increment: 20 },
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
  p129: "037_Guison.png",
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
  p130: "070_Volac.png",
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
  p55: "self-stacking/Samael-Star.png",
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
  p69: "self-stacking/Cassiel-Hexagram.png",
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
  // archangel SEALS (old boss-seal effects); the Dev art below is now used by the Boss SEALS
  p92: "archangel seals/Cassiel-Pentagram.png",
  p93: "archangel seals/Zachriel-Triangle.png",
  p94: "archangel seals/Aggiel-Hexagram.png",
  p95: "archangel seals/Cassiel-Sigil.png",
  p96: "archangel seals/Samael-Triangle.png",
  p97: "archangel seals/Samael-Star.png",
  p110: "archangel seals/Cassiel-Hexagram.png",
  // Boss SEALS
  p121: "dev/ZilonSeal.png",
  p122: "dev/KalhaSeal.png",
  p123: "dev/PyrosSeal.png",
  p124: "dev/PadmaSeal.png",
  p125: "dev/PetrosPavlosSeal.png",
  p126: "dev/SerafeimSeal-v2.png", // old art kept: dev/SerafeimSeal.png
  p127: "dev/ThreonSeal.png",
  p128: "dev/DantreSeal.png",
  p111: "satan/lucifer-wide.png",
  p131: "trinity/father.png",
  p132: "trinity/son.png",
  p133: "trinity/spirit.png",
  // self-stacking SEALS: the Pentacles of Saturn (the old art stays in seals/self-stacking/)
  p98: "saturn/handdrawn/Saturn-Pentacle-01.png",
  p99: "saturn/handdrawn/Saturn-Pentacle-02.png",
  p100: "saturn/handdrawn/Saturn-Pentacle-03.png",
  p101: "saturn/handdrawn/Saturn-Pentacle-04.png",
  p102: "saturn/handdrawn/Saturn-Pentacle-05.png",
  p103: "saturn/handdrawn/Saturn-Pentacle-06.png",
  p104: "004_Allocer.png",
  p105: "008_Andras.png",
  p106: "071_Zagan.png",
  p107: "050_Ose.png",
  p108: "049_Orobas.png",
  p109: "saturn/handdrawn/Saturn-Pentacle-07.png",
  p112: "034_Furfur.png",
  p113: "039_Halphas.png",
  p114: "022_Buer.png",
  p115: "021_Botis.png",
  p116: "017_Beleth.png",
  p117: "060_Shax.png",
  p118: "043_Malphas.png",
  p119: "001_Abigor.png",
  p120: "062_Sytry.png"
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
  p129: "11-gusion.png",
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
  p130: "62-valac-ualac.png",
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
  p108: "55-orobas.png",
  p112: "34-furfur.png",
  p113: "38-halphas.png",
  p114: "10-buer.png",
  p115: "17-botis.png",
  p116: "13-beleth.png",
  p117: "44-shax.png",
  p118: "39-malphas.png",
  p119: "15-eligos.png",
  p120: "12-sitri.png"
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
  { key: "buer", name: "Buer", image: "10-buer.png", passiveId: "p114" },
  { key: "gusion", name: "Gusion", image: "11-gusion.png", passiveId: "p129" },
  { key: "sitri", name: "Sitri", image: "12-sitri.png", passiveId: "p120" },
  { key: "beleth", name: "Beleth", image: "13-beleth.png", passiveId: "p116" },
  { key: "leraje", name: "Leraje", image: "14-leraje.png", passiveId: "p14" },
  { key: "eligos", name: "Eligos", image: "15-eligos.png", passiveId: "p119" },
  { key: "zepar", name: "Zepar", image: "16-zepar.png", passiveId: "p54" },
  { key: "botis", name: "Botis", image: "17-botis.png", passiveId: "p115" },
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
  { key: "furfur", name: "Furfur", image: "34-furfur.png", passiveId: "p112" },
  { key: "marchosias", name: "Marchosias", image: "35-marchosias.png", passiveId: "p33" },
  { key: "stolas", name: "Stolas", image: "36-stolas.png", passiveId: "p42" },
  { key: "phenex", name: "Phenex", image: "37-phenex-phoenix.png", passiveId: "p49" },
  { key: "halphas", name: "Halphas", image: "38-halphas.png", passiveId: "p113" },
  { key: "malphas", name: "Malphas", image: "39-malphas.png", passiveId: "p118" },
  { key: "raum", name: "Raum", image: "40-raum.png", passiveId: "p88" },
  { key: "focalor", name: "Focalor", image: "41-focalor.png", passiveId: "p40" },
  { key: "vepar", name: "Vepar", image: "42-vepar.png", passiveId: "p61" },
  { key: "sabnock", name: "Sabnock", image: "43-sabnock.png", passiveId: "p19" },
  { key: "shax", name: "Shax", image: "44-shax.png", passiveId: "p117" },
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
  { key: "valac", name: "Valac", image: "62-valac-ualac.png", passiveId: "p130" },
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
    modifierOverride: 1.3,
    descriptions: [
      "Devil's Offerings prices cost +3 SIN for ARTIFACTS and +6 SIN for SEALS while Zilon is alive.",
      "The TARGET modifier becomes 1.3 while Zilon is alive."
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
      "Each round, Threon applies a hidden mystery TARGET modifier from 0.6 to 1.0.",
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
      "While either twin is alive, the TARGET modifier alternates each round between 0.9 and 1.1, starting at 0.9."
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
      "While either twin is alive, the TARGET modifier alternates each round between 0.9 and 1.1, starting at 0.9."
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
    masterVolume: 1,
    musicVolume: SOUNDTRACK_VOLUME,
    sfxVolume: 1,
    muted: false,
    muteInBackground: true
  },
  display: {
    outlineBoil: 2,
    animSpeed: 1,
    screenShake: 2,
    flashes: 1,
    textSize: 0
  },
  settingsTab: "audio",
  pauseOpen: false,
  pauseScreen: "main",
  menuCollectionOpen: false,
  pauseDevOpen: false,
  devUnlockAllSeals: false,
  collectionRun: null,
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
  recordsAtRunStart: null,
  pendingNextRoundMarbasBonuses: [],
  pendingNextRoundLambReveals: [],
  pendingSelfStackingPentakillDamage: 0,
  pendingSelfStackingPentakillRound: 0,
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
  nextBossKillInterval: null,
  nextBossKillIntervalEndless: false,
  nextBossPairId: 1,
  finalBossPhase: false,
  finalBossQueued: false,
  bossQueued: false,
  eliteBoostedNextReroll: 0,
  satanVictoryDue: false,
  satanVictoryPlayed: false,
  paleHorseBoostArmed: false,
  // Trinity SEALS: free rerolls left (Seal of the Son), and what the Holy Spirit's wheel queued for the next offerings
  freeRerolls: 0,
  freeRerollsUntilRound: 0,
  trinityRevealsNextRound: 0,
  trinityEliteNextShop: false,
  trinityShopSealsNextShop: [],
  critMomentumBonus: 0,
  exactGuessCritCharged: false,
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

