"use strict";

const BASE_PASSIVE_LIMIT = 3;
const MAX_PASSIVE_LIMIT = 6;
const ACTIVE_LIMIT = 5;
const BOT_COUNT = 5;
const PLAYER_MAX_HP = 100;
const NON_BOSS_MEMORY_LIMIT = 13;
const BOT_MIN_HP = 20;
const BOT_MAX_HP = 60;
const STARTING_CREDITS = 8;
const BASE_TARGET_MODIFIER = 0.8;
const FINAL_BOSS_TARGET_MODIFIER = 0.666;
const SCALING_BREAKPOINT_BOSSES = 4;
const ENDLESS_SCALING_BREAKPOINT_BOSSES = 8;
const BOT_HP_BONUS_PER_BOSS = 5;
const BOT_HP_BONUS_PER_BOSS_LATE = 10;
const BOT_HP_BONUS_PER_BOSS_ENDLESS = 20;
const BOSS_HP_BONUS_PER_SPAWN = 20;
const BOSS_HP_BONUS_PER_SPAWN_LATE = 30;
const BOSS_HP_BONUS_PER_SPAWN_ENDLESS = 60;
const HP_EXPONENTIAL_RATE = 1.08;
const HP_EXPONENTIAL_STEP_BOSSES = 3;
const SIN_PRICE_PRESSURE_INTERVAL = 150;
const ACTIVE_USES_PER_ROUND = 2;
const UNIQUE_BOSS_INTERVAL = 8;
const ENDLESS_BOSS_INTERVAL = 8;
const TARGET_DIFF_DAMAGE_BOSS_INTERVAL = 8;
const TARGET_DIFF_DAMAGE_STEP = 1.5;
const PVP_SLOT_COUNT = 5;
const PVP_MAX_SLOT_COUNT = 12;
const PVP_MAX_HP = 100;
const PVP_MODIFIERS = [0.7, 0.8, 0.9, 1, 1.1, 1.2];
const PVP_MODIFIER_INTERVAL = 3;
const PVP_PHASE_AUTO_DELAY = 450;
const PVP_SUMMARY_AUTO_DELAY = 10000;
const SOUNDTRACK_SRC = "assets/audio/Zingaresca_1910_loop.ogg";
const SOUNDTRACK_VOLUME = 0.55;
const SEAL_PURCHASE_SFX_SRC = "assets/audio/dragon-studio-evil-laughter-353177.mp3";
const SEAL_PURCHASE_SFX_VOLUME = 0.055;
const GUESS_SFX_SRC = "assets/audio/Guess.mp3";
const READY_SFX_SRC = "assets/audio/Ready.mp3";
const NEXT_ROUND_SFX_SRC = "assets/audio/nextroundSound.mp3";
const CLOCK_TICK_SFX_SRCS = [
  "assets/audio/tickinclock_RdeIBkld.mp3",
  "assets/audio/tickinclock_N3shRVgw.mp3"
];
const GUESS_SFX_VOLUME = 0.9;
const READY_SFX_VOLUME = 0.2;
const NEXT_ROUND_SFX_VOLUME = 0.2;
const CLOCK_TICK_SFX_VOLUME = 0.154;
const GUESS_SFX_START_OFFSET = 0.12;
const SOUND_SETTINGS_STORAGE_KEY = "dearthSoundSettings";
const FINAL_BOSS_JESUS_SRC = "assets/bots/final-bosses/jesusboss.png";
const FINAL_BOSS_SATAN_SRC = "assets/bots/final-bosses/satanboss.png";
const SHOP_ELITE_CHANCE = 0.08;
const PVP_ACTIVES = [
  {
    id: "pulse",
    name: "Demon Bowl",
    description: "If it casts, deal 3 damage to everyone else.",
    needsTarget: false
  },
  {
    id: "rise",
    name: "Sigillum Dei Aemeth",
    description: "If it casts, change the final TARGET by +5.",
    needsTarget: false
  },
  {
    id: "sink",
    name: "John Dee's Obsidian Mirror",
    description: "If it casts, change the final TARGET by -5.",
    needsTarget: false
  },
  {
    id: "shield",
    name: "Witch in a Bottle",
    description: "If it casts, you take 50% less damage this round.",
    needsTarget: false
  },
  {
    id: "markBest",
    name: "The Black-Hilted Knife",
    description: "If it casts, deal 5 damage to every player tied closest to the first TARGET.",
    needsTarget: false
  },
  {
    id: "jam",
    name: "Null Vote",
    description: "If it casts, pick a player whose guess does not count for the final TARGET.",
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
    price: 10,
    description: "New non-boss DAMNED arrive with 5 MEMORY. At end of round, each DAMNED takes 1 damage per MEMORY. ELITE doubles the damage each level."
  },
  p2: {
    id: "p2",
    type: "passive",
    name: "Seal of Paimon",
    price: 6,
    description: "If your final guess is close to the TARGET, gain ladder SIN: 1 at +/-5, +1 per step closer, up to 5 at +/-1. On exact TARGET, gain 10 SIN. ELITE doubles all SIN gained."
  },
  p3: {
    id: "p3",
    type: "passive",
    name: "Seal of Alloces",
    price: 7,
    description: "If the rounded TARGET is a multiple of 3, all DAMNED take 20 extra damage. ELITE doubles the damage each level."
  },
  p4: {
    id: "p4",
    type: "passive",
    name: "Seal of Andras",
    price: 12,
    description: "If your final effective guess is 0, 50, or 100, deal 10 damage to every DAMNED, take half TARGET-difference damage, and ignore worst guess penalty damage."
  },
  p5: {
    id: "p5",
    type: "passive",
    name: "Seal of Haures",
    price: 9,
    description: "Whenever you take damage, all DAMNED take the same amount of extra damage. ELITE doubles the echoed damage each level."
  },
  p6: {
    id: "p6",
    type: "passive",
    name: "Seal of Orias",
    price: 13,
    description: "Your CRITICAL hit triggers when your guess is within 2 of the right integer. Each extra stack widens it by 1."
  },
  p7: {
    id: "p7",
    type: "passive",
    name: "Seal of Glasya-Labolas",
    price: 9,
    description: "When you hit CRITICAL, it deals 30 damage to everyone else. ELITE doubles the damage each level."
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
    price: 14,
    description: "Every DAMNED elimination pays 3 SIN. ELITE increases this payout by +20%."
  },
  p10: {
    id: "p10",
    type: "passive",
    name: "Seal of Gusion",
    price: 15,
    description: "Whenever a DAMNED gains MEMORY, it gains that much BOUNTY too. Whenever a DAMNED gains BOUNTY, it gains that much MEMORY too. ELITE makes each point add +2, +3, and so on."
  },
  p11: {
    id: "p11",
    type: "passive",
    name: "Seal of Valefor",
    price: 7,
    description: "When a DAMNED dies, gain a random ARTIFACT if you have room."
  },
  p12: {
    id: "p12",
    type: "passive",
    name: "Seal of Belial",
    price: 11,
    description: "At end of round, for every 10 SIN you have, deal 2 damage to every DAMNED. ELITE doubles the damage each level."
  },
  p13: {
    id: "p13",
    type: "passive",
    name: "Seal of Bune",
    price: 14,
    description: "If you make more than one elimination in a round, gain 10 SIN. ELITE increases this payout by +20%."
  },
  p14: {
    id: "p14",
    type: "passive",
    name: "Seal of Leraje",
    price: 8,
    description: "At the start of each round, deal 20 damage to a random DAMNED. If this kills, gain 5 SIN. ELITE doubles the damage each level and increases the SIN payout by +20%."
  },
  p15: {
    id: "p15",
    type: "passive",
    name: "Seal of Bathin",
    price: 8,
    description: "Whenever MEMORY is added to a DAMNED, each MEMORY has a 50% chance to pay 1 SIN. ELITE increases this payout by +20%."
  },
  p16: {
    id: "p16",
    type: "passive",
    name: "Seal of Bael",
    price: 10,
    description: "Your guess counts five times when calculating the TARGET average."
  },
  p17: {
    id: "p17",
    type: "passive",
    name: "Seal of Dantalion",
    price: 12,
    description: "At end of round, deal damage equal to the total MEMORY of all DAMNED on the board, including dead ones, to one random living DAMNED. If any BOSSES are active, hit all active BOSSES instead and exclude BOSS MEMORY from the sum. ELITE doubles the damage each level."
  },
  p18: {
    id: "p18",
    type: "passive",
    name: "Seal of Berith",
    price: 8,
    description: "At end of round, this SEAL's sell value increases by 3."
  },
  p19: {
    id: "p19",
    type: "passive",
    name: "Seal of Sabnock",
    price: 13,
    description: "Every time a DAMNED dies, deal 5 damage to every other DAMNED. ELITE doubles the damage each level."
  },
  p20: {
    id: "p20",
    type: "passive",
    name: "Seal of Haagenti",
    price: 11,
    description: "Devil's Offerings has one more ARTIFACT slot. Whenever you use an ARTIFACT, all DAMNED take damage equal to that ARTIFACT's purchase cost. ELITE doubles the damage each level."
  },
  p21: {
    id: "p21",
    type: "passive",
    name: "Seal of Shax",
    price: 10,
    description: "Every time you reroll Devil's Offerings, all DAMNED take damage equal to double the SIN spent at end of round. ELITE doubles the damage each level."
  },
  p22: {
    id: "p22",
    type: "passive",
    name: "Seal of Botis",
    price: 14,
    description: "Avoid 20% of damage you would take in a round and convert the avoided damage into MEMORY for the living DAMNED with the most MEMORY. ELITE doubles only the MEMORY added each level."
  },
  p23: {
    id: "p23",
    type: "passive",
    name: "Seal of Seere",
    price: 9,
    description: "New non-boss DAMNED have a 33% chance to spawn with +6 BOUNTY."
  },
  p24: {
    id: "p24",
    type: "passive",
    name: "Seal of Orobas",
    price: 9,
    description: "You can use only one ARTIFACT per round. All DAMNED pay 1.5x BOUNTY SIN when eliminated."
  },
  p25: {
    id: "p25",
    type: "passive",
    name: "Seal of Valac",
    price: 13,
    description: "Gain +2 ARTIFACT uses per round and +2 ARTIFACT inventory slots. Each ELITE level adds +2 more to both."
  },
  p26: {
    id: "p26",
    type: "passive",
    name: "Seal of Amdusias",
    price: 14,
    description: "Once per ARTIFACT type each round, when you use two matching ARTIFACTS, deal 30 damage to all DAMNED. ELITE doubles the damage each level."
  },
  p27: {
    id: "p27",
    type: "passive",
    name: "Seal of Zagan",
    price: 10,
    description: "Every ARTIFACT used triggers one of three outcomes: gain 3 SIN, damage a random DAMNED, or refund that ARTIFACT's purchase cost. ELITE doubles the damage outcome and increases the SIN outcome by +20%."
  },
  p28: {
    id: "p28",
    type: "passive",
    name: "Seal of Ose",
    price: 15,
    description: "Copies a random SEAL you own and keeps copying it. If that SEAL is sold, Ose chooses another owned SEAL. If no SEAL is available, it waits for the next SEAL you buy."
  },
  p29: {
    id: "p29",
    type: "passive",
    name: "Seal of Furfur",
    price: 10,
    description: "For every 2 SIN you spend in a round, deal 1 damage to the highest-HEALTH non-boss DAMNED. ELITE doubles the damage each level."
  },
  p30: {
    id: "p30",
    type: "passive",
    name: "Seal of Andrealphus",
    price: 9,
    description: "Every time a DAMNED is eliminated, deal 10 damage to the DAMNED on its left and right. ELITE doubles the damage each level."
  },
  p31: {
    id: "p31",
    type: "passive",
    name: "Seal of Murmur",
    price: 10,
    description: "At end of round, two random DAMNED take damage equal to their BOUNTY. ELITE doubles the damage each level."
  },
  p32: {
    id: "p32",
    type: "passive",
    name: "Seal of Foras",
    price: 11,
    description: "Every time a DAMNED dies, all other DAMNED gain +1 or +2 BOUNTY."
  },
  p33: {
    id: "p33",
    type: "passive",
    name: "Seal of Marchosias",
    price: 13,
    description: "Every time a DAMNED is eliminated, all other DAMNED take damage equal to that DAMNED's BOUNTY. ELITE doubles the damage each level."
  },
  p34: {
    id: "p34",
    type: "passive",
    name: "Seal of Gremory",
    price: 12,
    description: "Whenever a DAMNED with 6 or more BOUNTY dies, gain 2 SIN and deal 10 damage to the highest-HEALTH enemy. ELITE doubles the damage and increases the SIN payout by +20%."
  },
  p35: {
    id: "p35",
    type: "passive",
    name: "Seal of Forneus",
    price: 8,
    description: "At end of round, the two highest BOUNTY DAMNED gain +1 BOUNTY. ELITE levels add +1 BOUNTY."
  },
  p36: {
    id: "p36",
    type: "passive",
    name: "Pandorium Contract",
    price: 15,
    description: "Removed."
  },
  p37: {
    id: "p37",
    type: "passive",
    name: "Seal of Malphas",
    price: 9,
    description: "When you take 4 or less total damage in a round, gain 7 SIN. ELITE increases this payout by +20%."
  },
  p38: {
    id: "p38",
    type: "passive",
    name: "Seal of Astaroth",
    price: 12,
    description: "At the start of each round, mark a DAMNED until round end. If the marked DAMNED dies, its BOUNTY payout becomes double BOUNTY or 6 SIN, whichever is greater, and you gain 5 SIN."
  },
  p39: {
    id: "p39",
    type: "passive",
    name: "Seal of Purson",
    price: 10,
    description: "Starts with 1 stack. Rounds without buying from Devil's Offerings add a stack. Buying an offering resets it. At end of round, gain SIN equal to its stacks."
  },
  p40: {
    id: "p40",
    type: "passive",
    name: "Seal of Focalor",
    price: 14,
    description: "At end of round, deal half the total BOUNTY of living DAMNED to every enemy. ELITE doubles the damage each level."
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
    description: "Removed."
  },
  p43: {
    id: "p43",
    type: "passive",
    name: "Seal of Raum",
    price: 12,
    description: "Whenever a DAMNED loses SIN, it takes 20 damage. At end of round, all DAMNED lose 1 SIN. ELITE doubles the damage each level."
  },
  p44: {
    id: "p44",
    type: "passive",
    name: "Seal of Andromalius",
    price: 13,
    description: "At end of round, any DAMNED with 2 or less BOUNTY is eliminated. Its SIN goes to the living DAMNED with the highest BOUNTY."
  },
  p45: {
    id: "p45",
    type: "passive",
    name: "Seal of Crocell",
    price: 9,
    description: "DAMNED with 3 or less BOUNTY pay double BOUNTY SIN when eliminated."
  },
  p46: {
    id: "p46",
    type: "passive",
    name: "Seal of Barbatos",
    price: 12,
    description: "Whenever a DAMNED with 6 or more BOUNTY takes damage, it takes 5 extra damage."
  },
  p47: {
    id: "p47",
    type: "passive",
    name: "Seal of Ronove",
    price: 10,
    description: "At end of round, a DAMNED loses half its BOUNTY and you gain double the SIN removed."
  },
  p48: {
    id: "p48",
    type: "passive",
    name: "Seal of Cimejes",
    price: 14,
    description: "At start of round, double a random DAMNED's BOUNTY for 1 round. ELITE levels double one extra random DAMNED."
  },
  p49: {
    id: "p49",
    type: "passive",
    name: "Seal of Phenex",
    price: 10,
    description: "Using an ARTIFACT that targets one or more DAMNED increases those DAMNED's BOUNTY by 4."
  },
  p50: {
    id: "p50",
    type: "passive",
    name: "Seal of Agares",
    price: 9,
    description: "At end of round, 10% of SIN earned this round spreads among DAMNED, prioritizing highest BOUNTY. Whenever a DAMNED gains SIN, they take 5 damage per SIN. ELITE doubles the damage each level."
  },
  p51: {
    id: "p51",
    type: "passive",
    name: "Seal of Marax",
    price: 11,
    description: "Once each round per DAMNED, when that DAMNED has taken more than 30% max-HEALTH damage, its BOUNTY increases by 4."
  },
  p52: {
    id: "p52",
    type: "passive",
    name: "Seal of Decarabia",
    price: 12,
    description: "Whenever a DAMNED takes damage, it takes 3 extra damage per MEMORY. BOSSES take 1 extra damage per MEMORY instead."
  },
  p53: {
    id: "p53",
    type: "passive",
    name: "Seal of Samigina",
    price: 10,
    description: "When a non-boss DAMNED is eliminated, gain bonus SIN equal to its MEMORY."
  },
  p54: {
    id: "p54",
    type: "passive",
    name: "Seal of Zepar",
    price: 12,
    description: "Every round, one DAMNED is marked blue. When it takes TARGET-difference damage, each adjacent DAMNED takes that much damage too."
  },
  p55: {
    id: "p55",
    type: "passive",
    name: "Seal of Sitri",
    price: 11,
    description: "If your final guess is within 5 of the TARGET, deal 5 damage to every DAMNED and gain 2 SIN. If it is outside 5, take 5 damage. ELITE doubles only the damage you deal."
  },
  p56: {
    id: "p56",
    type: "passive",
    name: "Seal of Halphas",
    price: 12,
    description: "At end of round, deal round x BOSSES defeated total damage, spread randomly among enemies. ELITE gives +2 SIN each round per upgrade."
  },
  p57: {
    id: "p57",
    type: "passive",
    name: "Seal of Balam",
    price: 15,
    description:
      "If a non-boss DAMNED has 10+ MEMORY and 10+ BOUNTY, it is instantly eliminated. Its max HEALTH becomes damage spread to other DAMNED; if BOSSES are active, BOSSES take the damage."
  },
  p58: {
    id: "p58",
    type: "passive",
    name: "Seal of Ipos",
    price: 13,
    description:
      "The worst guess penalty hits the 3 furthest guesses. The furthest takes 20 damage, the next two take 10. ELITE doubles both damage values."
  },
  p59: {
    id: "p59",
    type: "passive",
    name: "Seal of Amon",
    price: 11,
    description: "Whenever you take damage, prevent 4 of it. ELITE doubles the prevented damage each level."
  },
  p60: {
    id: "p60",
    type: "passive",
    name: "Seal of Gaap",
    price: 14,
    description:
      "Whenever you use an ARTIFACT, 50% chance to create a copy of it in your inventory and deal 5 damage to every DAMNED. ELITE doubles the damage each level."
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
    description: "The first time each full-HEALTH DAMNED takes damage in a round, it takes 10 extra damage."
  },
  p63: {
    id: "p63",
    type: "passive",
    name: "Seal of Vual",
    price: 10,
    description: "One extra DAMNED is revealed. Whenever a revealed DAMNED takes damage, it takes 15 extra damage. ELITE reveals +1 more DAMNED."
  },
  p64: {
    id: "p64",
    type: "passive",
    name: "Seal of Vine",
    price: 10,
    description:
      "One extra DAMNED is revealed. Revealed DAMNED pay double BOUNTY SIN when eliminated. ELITE reveals +1 more and raises the payout multiplier by +20%."
  },
  p65: {
    id: "p65",
    type: "passive",
    name: "Seal of Naberius",
    price: 12,
    description: "At end of round, revealed DAMNED take damage equal to half their guess. ELITE doubles the damage each level."
  },
  p66: {
    id: "p66",
    type: "passive",
    name: "Seal of Aim",
    price: 15,
    description: "On round numbers that are multiples of 5, eliminate one random non-boss DAMNED. If a BOSS is active, deal 30 damage to each active BOSS. ELITE doubles only the BOSS damage."
  },
  p67: {
    id: "p67",
    type: "passive",
    name: "Seal of Caim",
    price: 11,
    description: "DAMNED with 8 or more MEMORY pay 1.5x BOUNTY SIN when eliminated. ELITE increases the payout multiplier by +20%."
  },
  p68: {
    id: "p68",
    type: "passive",
    name: "Seal of Vapula",
    price: 13,
    description:
      "Whenever a DAMNED with 8 or more MEMORY takes damage, it takes 10 extra damage. With more than 12 MEMORY, it takes 20 extra damage."
  },
  p69: {
    id: "p69",
    type: "passive",
    name: "Seal of Eligos",
    price: 14,
    description:
      "Whenever a DAMNED hits CRITICAL, your guess counts as CRITICAL too and DAMNED CRITICAL damage cannot hurt you. DAMNED hit CRITICAL within +/-1 of the TARGET."
  },
  p70: {
    id: "p70",
    type: "passive",
    name: "Seal of Amy",
    price: 12,
    description:
      "Sacrificial Dagger deals 20% max-HEALTH damage to BOSSES too and appears twice as often in Devil's Offerings. ELITE adds +2% BOSS damage and one more shop weight."
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
    price: 12,
    description:
      "Every round, if the previous TARGET was below 40, one random non-boss DAMNED guess becomes 100. If it was above 40, one random DAMNED guess becomes 0. ELITE deals 5 damage per level to the selected DAMNED."
  },
  p73: {
    id: "p73",
    type: "passive",
    name: "Seal of Asmoday",
    price: 12,
    description: "When a DAMNED dies from excess damage, split that excess damage equally among the other living enemies. ELITE doubles the excess damage split each level."
  },
  p74: {
    id: "p74",
    type: "passive",
    name: "Seal of the White Horse",
    price: 30,
    description: "For every 2 SIN a DAMNED has, it takes x1.1 damage from all sources. ELITE adds +0.1 to the multiplier."
  },
  p75: {
    id: "p75",
    type: "passive",
    name: "Seal of the Red Horse",
    price: 30,
    description: "For each ARTIFACT used on a DAMNED this round, it takes x1.5 damage from all sources until round end. ELITE adds +0.1 to the multiplier."
  },
  p76: {
    id: "p76",
    type: "passive",
    name: "Seal of the Black Horse",
    price: 30,
    description: "For every 2 MEMORY a DAMNED has, it takes x1.1 damage from all sources. ELITE adds +0.1 to the multiplier."
  },
  p77: {
    id: "p77",
    type: "passive",
    name: "Seal of the Pale Horse",
    price: 30,
    description: "If you score CRITICAL this round, DAMNED take x2 damage from all sources next round. ELITE adds +0.1 to the multiplier."
  },
  p78: {
    id: "p78",
    type: "passive",
    name: "Seal of the Souls of Martyrs",
    price: 30,
    description: "For every DAMNED eliminated in the previous round, DAMNED take x1.15 damage from all sources. ELITE adds +0.1 to the multiplier."
  },
  p79: {
    id: "p79",
    type: "passive",
    name: "Seal of Creation Uncreated",
    price: 30,
    description: "Revealed DAMNED take x2 damage from all sources, and BOSSES can have their guesses revealed. ELITE adds +0.1 to the multiplier."
  },
  p80: {
    id: "p80",
    type: "passive",
    name: "Seal of Silence in Heaven",
    price: 30,
    description: "DAMNED take x1.5 TARGET-difference damage. Worst guess damage counts as TARGET-difference damage. ELITE adds +0.1 to the multiplier."
  },
  a28: {
    id: "a28",
    type: "active",
    name: "Engraved Skull",
    price: 4,
    description: "Pick a non-boss DAMNED. It gains 6 MEMORY, 6 SIN, and 6 max HEALTH."
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
    price: 4,
    description: "Heal 10. There is a 33% chance the next elimination spawns a BOSS."
  },
  a12: {
    id: "a12",
    type: "active",
    name: "Dark Talisman",
    price: 2,
    description: "You take 50% less damage this round, including CRITICAL damage."
  },
  a13: {
    id: "a13",
    type: "active",
    name: "The White-Hilted Knife",
    price: 4,
    description: "Deal 20 non-lethal damage to one DAMNED, then heal another already-damaged DAMNED for 20."
  },
  a16: {
    id: "a16",
    type: "active",
    name: "Dr Dee's Gold Disc",
    price: 4,
    description: "Gain a random 3 to 9 SIN."
  },
  a17: {
    id: "a17",
    type: "active",
    name: "Defixio",
    price: 4,
    description: "Move the TARGET to the closest multiple of 3, 5, or 7."
  },
  a18: {
    id: "a18",
    type: "active",
    name: "Corrupted Crystal",
    price: 4,
    description: "Instantly copy the effect of a random other ARTIFACT in your inventory."
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
    description: "This round, DAMNED take double the damage you take."
  },
  a22: {
    id: "a22",
    type: "active",
    name: "Cursed Chalice",
    price: 4,
    description: "10% take 20 damage, 20% take 10 damage, 30% gain 6 SIN, 20% gain 12 SIN, 10% gain 15 SIN and deal 20 damage to each DAMNED. The remaining 10% fizzles."
  },
  a23: {
    id: "a23",
    type: "active",
    name: "Satanic Bible",
    price: 3,
    description: "Arm the next Devil's Offerings reroll: the SEAL slot has a 50% ELITE chance."
  },
  a25: {
    id: "a25",
    type: "active",
    name: "Mummified Lamb",
    price: 4,
    description: "Pick a DAMNED, heal it to full, and increase its BOUNTY by 9."
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
  "p10",
  "p11",
  "p12",
  "p13",
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
  "p35",
  "p39",
  "p40",
  "p41",
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
  "p80"
];
const REMOVED_PASSIVE_IDS = new Set(["p8", "p9", "p14", "p15", "p27", "p34", "p36", "p37", "p38", "p42", "p55"]);
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
  "a17",
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
  a17: "a17.png",
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
  p74: "013_Bael.png",
  p75: "008_Andras.png",
  p76: "029_Decarabia.png",
  p77: "072_Zepar.png",
  p78: "028_Dantalion.png",
  p79: "035_Glasya-Labolas.png",
  p80: "061_Stolas.png"
};

const GOETIC_BOSS_IMAGE_ROOT = "assets/bots/goetic-stickmen-72";
const GOETIC_BOSS_IMAGE_BY_PASSIVE_ID = {
  p1: "03-vassago.png",
  p2: "09-paimon.png",
  p3: "52-alloces.png",
  p4: "63-andras.png",
  p5: "64-haures-flauros.png",
  p6: "59-orias.png",
  p7: "25-glasya-labolas.png",
  p8: "10-buer.png",
  p9: "05-marbas.png",
  p10: "11-gusion.png",
  p11: "06-valefor.png",
  p12: "68-belial.png",
  p13: "26-bune-bime.png",
  p14: "14-leraje.png",
  p15: "18-bathin.png",
  p16: "01-bael.png",
  p17: "71-dantalion.png",
  p18: "28-berith.png",
  p19: "43-sabnock.png",
  p20: "48-haagenti.png",
  p21: "44-shax.png",
  p22: "17-botis.png",
  p23: "70-seere-seir.png",
  p24: "55-orobas.png",
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
  p36: "32-asmoday.png",
  p37: "39-malphas.png",
  p38: "29-astaroth.png",
  p39: "20-purson.png",
  p40: "41-focalor.png",
  p41: "46-bifrons.png",
  p42: "36-stolas.png",
  p43: "40-raum.png",
  p44: "72-andromalius.png",
  p45: "49-crocell.png",
  p46: "08-barbatos.png",
  p47: "27-ronove.png",
  p48: "66-cimejes-kimaris.png",
  p49: "37-phenex-phoenix.png",
  p50: "02-agares.png",
  p51: "21-marax-morax.png",
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
  p66: "23-aim-haborym.png",
  p67: "53-caim-camio.png",
  p68: "60-vapula-naphula.png",
  p69: "15-eligos.png",
  p70: "58-amy-avnas.png",
  p71: "19-sallos.png",
  p72: "50-furcas.png",
  p73: "32-asmoday.png"
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
  { key: "buer", name: "Buer", image: "10-buer.png", passiveId: "p8" },
  { key: "gusion", name: "Gusion", image: "11-gusion.png", passiveId: "p10" },
  { key: "sitri", name: "Sitri", image: "12-sitri.png", passiveId: "p55" },
  { key: "beleth", name: "Beleth", image: "13-beleth.png", passiveId: "p62" },
  { key: "leraje", name: "Leraje", image: "14-leraje.png", passiveId: "p14" },
  { key: "eligos", name: "Eligos", image: "15-eligos.png", passiveId: "p69" },
  { key: "zepar", name: "Zepar", image: "16-zepar.png", passiveId: "p54" },
  { key: "botis", name: "Botis", image: "17-botis.png", passiveId: "p22" },
  { key: "bathin", name: "Bathin", image: "18-bathin.png", passiveId: "p15" },
  { key: "sallos", name: "Sallos", image: "19-sallos.png", passiveId: "p71" },
  { key: "purson", name: "Purson", image: "20-purson.png", passiveId: "p39" },
  { key: "marax", name: "Marax", image: "21-marax-morax.png", passiveId: "p51" },
  { key: "ipos", name: "Ipos", image: "22-ipos.png", passiveId: "p58" },
  { key: "aim", name: "Aim", image: "23-aim-haborym.png", passiveId: "p66" },
  { key: "naberius", name: "Naberius", image: "24-naberius.png", passiveId: "p65" },
  { key: "glasya-labolas", name: "Glasya-Labolas", image: "25-glasya-labolas.png", passiveId: "p7" },
  { key: "bune", name: "Bune", image: "26-bune-bime.png", passiveId: "p13" },
  { key: "ronove", name: "Ronove", image: "27-ronove.png", passiveId: "p47" },
  { key: "berith", name: "Berith", image: "28-berith.png", passiveId: "p18" },
  { key: "astaroth", name: "Astaroth", image: "29-astaroth.png", passiveId: "p38" },
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
  { key: "raum", name: "Raum", image: "40-raum.png", passiveId: "p43" },
  { key: "focalor", name: "Focalor", image: "41-focalor.png", passiveId: "p40" },
  { key: "vepar", name: "Vepar", image: "42-vepar.png", passiveId: "p61" },
  { key: "sabnock", name: "Sabnock", image: "43-sabnock.png", passiveId: "p19" },
  { key: "shax", name: "Shax", image: "44-shax.png", passiveId: "p21" },
  { key: "vine", name: "Vine", image: "45-vine.png", passiveId: "p64" },
  { key: "bifrons", name: "Bifrons", image: "46-bifrons.png", passiveId: "p41" },
  { key: "vual", name: "Vual", image: "47-vual-uvall.png", passiveId: "p63" },
  { key: "haagenti", name: "Haagenti", image: "48-haagenti.png", passiveId: "p20" },
  { key: "crocell", name: "Crocell", image: "49-crocell.png", passiveId: "p45" },
  { key: "furcas", name: "Furcas", image: "50-furcas.png", passiveId: "p72" },
  { key: "balam", name: "Balam", image: "51-balam.png", passiveId: "p57" },
  { key: "alloces", name: "Alloces", image: "52-alloces.png", passiveId: "p3" },
  { key: "caim", name: "Caim", image: "53-caim-camio.png", passiveId: "p67" },
  { key: "murmur", name: "Murmur", image: "54-murmur.png", passiveId: "p31" },
  { key: "orobas", name: "Orobas", image: "55-orobas.png", passiveId: "p24" },
  { key: "gremory", name: "Gremory", image: "56-gremory-gamori.png", passiveId: "p34" },
  { key: "ose", name: "Ose", image: "57-ose.png", passiveId: "p28" },
  { key: "amy", name: "Amy", image: "58-amy-avnas.png", passiveId: "p70" },
  { key: "orias", name: "Orias", image: "59-orias.png", passiveId: "p6" },
  { key: "vapula", name: "Vapula", image: "60-vapula-naphula.png", passiveId: "p68" },
  { key: "zagan", name: "Zagan", image: "61-zagan.png", passiveId: "p27" },
  { key: "valac", name: "Valac", image: "62-valac-ualac.png", passiveId: "p25" },
  { key: "andras", name: "Andras", image: "63-andras.png", passiveId: "p4" },
  { key: "haures", name: "Haures", image: "64-haures-flauros.png", passiveId: "p5" },
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
const GOETIC_BOSS_PASSIVE_IDS = PASSIVE_IDS.filter((id) => GOETIC_BOSS_IMAGE_BY_PASSIVE_ID[id]);
const BOSS_PASSIVES = {
  metabolism: {
    name: "Seal of Bathin",
    description: "This BOSS SEAL heals 5 HEALTH at the end of every round."
  },
  fumes: {
    name: "Seal of Amon",
    description: "While this BOSS SEAL is alive, you take 2 damage at the end of every round."
  },
  thief: {
    name: "Seal of Raum",
    description: "While this BOSS SEAL is alive, you lose 1 SIN at the end of every round."
  },
  spite: {
    name: "Seal of Botis",
    description: "While this BOSS SEAL is alive, every time you use an ARTIFACT, you take 3 damage."
  },
  wideCrit: {
    name: "Seal of Ipos",
    description: "This BOSS SEAL hits CRITICAL within 2 of the right integer and deals damage only to you."
  },
  shield: {
    name: "Seal of Halphas",
    description: "This BOSS SEAL cannot be picked or targeted by ARTIFACTS, and its guess cannot be revealed."
  },
  lamb: {
    name: "Seal of Sallos",
    description: "When this BOSS SEAL dies, all other DAMNED gain 10 HEALTH."
  }
};
const BOSS_PASSIVE_KEYS = Object.keys(BOSS_PASSIVES);

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
    personality: "Caller",
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
    personality: "Stubborn",
    modifierOverride: 0.5,
    eliminationDamage: 3,
    descriptions: [
      "Every elimination deals 3 damage to you while Dantre is alive.",
      "The TARGET modifier becomes 0.5 while Dantre is alive."
    ]
  },
  pyros: {
    key: "pyros",
    name: "Pyros",
    image: "assets/bots/occult-stickmen-pack/boss-pyros.png",
    personality: "Analyst",
    modifierOverride: 1,
    grantsBuffs: true,
    descriptions: [
      "At the start of every round, one DAMNED receives a new random BOSS-variant SEAL while Pyros is alive.",
      "The TARGET modifier becomes 1.0 while Pyros is alive."
    ]
  },
  threon: {
    key: "threon",
    name: "Threon",
    image: "assets/bots/occult-stickmen-pack/boss-threon.png",
    personality: "Drifter",
    descriptions: [
      "Each round, Threon applies a hidden mystery TARGET modifier from 0.7 to 1.3.",
      "Every ARTIFACT you use has a 50% chance to malfunction, do nothing, and deal 5 damage to you."
    ]
  },
  kalha: {
    key: "kalha",
    name: "Kalha",
    image: "assets/bots/new-red-bosses-5/Kalha-vibrant.png",
    personality: "Drifter",
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
    personality: "Caller",
    modifierOverride: 0.7,
    descriptions: [
      "When Serafim enters play, you lose half your SIN; Serafim gains that SIN and twice that amount as HEALTH.",
      "Each round, you lose up to 2 SIN and Serafim gains the amount lost.",
      "The TARGET modifier becomes 0.7 while Serafim is alive."
    ]
  },
  padma: {
    key: "padma",
    name: "Padma",
    image: "assets/bots/new-red-bosses-5/Padma-vibrant.png",
    personality: "Stubborn",
    modifierOverride: 0.6,
    descriptions: [
      "While Padma is alive, you cannot recover HEALTH in any way.",
      "At the start of every round, Padma heals every other DAMNED for 10% max HEALTH.",
      "The TARGET modifier becomes 0.6 while Padma is alive."
    ]
  },
  petros: {
    key: "petros",
    name: "Petros",
    image: "assets/bots/new-red-bosses-5/Petros-vibrant.png",
    personality: "Anchor",
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
    personality: "Anchor",
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
    personality: "Analyst",
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
    personality: "Caller",
    descriptions: [
      "Satan has infinite HEALTH. Damage dealt to him is counted without reducing HP.",
      "The Devil disables Devil's Offerings while Satan is alive."
    ]
  }
};

const state = {
  mode: "menu",
  menuScreen: "main",
  sound: {
    musicVolume: SOUNDTRACK_VOLUME,
    sfxVolume: 1,
    muted: false
  },
  pauseOpen: false,
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
  previousTarget: null,
  playerLastDamage: 0,
  playerLastHeal: 0,
  playerLastCredits: 0,
  playerDamageSources: [],
  playerHealSources: [],
  playerCreditSources: [],
  sealStats: {},
  gameMemory: [],
  nextBotId: 1,
  nextItemUid: 1,
  eliminations: 0,
  bossKills: 0,
  itemsBought: 0,
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
  eliteBoostedNextReroll: false,
  paleHorseBoostArmed: false,
  previousRoundEliminationsForMartyrs: 0,
  pendingActive: null,
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
let nextClockTickIndex = 0;
const activeClockTickInstances = new Set();
let sfxPrimed = false;
let gameButtonTickInstalled = false;

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
  return divisors
    .map((divisor) => {
      const snapped = nearestMultiple(number, divisor);
      return { divisor, value: snapped, distance: Math.abs(snapped - number) };
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

function ownedSealSlotCount() {
  return state.player.passives.filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id)).length;
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
  return state.player.passives.filter((item) => item && item.id !== "p28" && !REMOVED_PASSIVE_IDS.has(item.id));
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
    ? state.player.passives.find((item) => item && item.id === mimic.copiedPassiveId && item.id !== "p28" && !REMOVED_PASSIVE_IDS.has(item.id))
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
  return stack ? Math.pow(2, Math.max(0, stack - 1)) : 0;
}

function flatDamageValue(idOrItem, baseValue) {
  const power = flatDamagePower(idOrItem);
  return power ? Math.ceil(baseValue * power) : 0;
}

function passiveEntryFlatDamage(entry, baseValue) {
  return flatDamageValue(entry, baseValue);
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
  return Math.max(0, Math.ceil((10 + state.bossKills * 5) * factor) + bonus);
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

function applyMemoryAddedHealing(bot, amount) {
  const memoriesAdded = Math.max(0, Math.ceil(amount));
  if (!state.roundState || !bot || bot.eliminated || memoriesAdded <= 0 || state.player.hp <= 0) return;
  orderedPassiveEffectEntries("p15").forEach((entry) => {
    let triggers = 0;
    for (let index = 0; index < memoriesAdded; index += 1) {
      if (Math.random() < 0.5) triggers += 1;
    }
    if (!triggers) return;
    markPassiveEntryTriggered(entry);
    const credits = passiveEntryConvertedSin(entry, 1) * triggers;
    const gained = gainCredits(credits, true, "Seal of Bathin");
    addRoundEvent(`Seal of Bathin paid ${gained} SIN from ${bot.name}'s memory growth.`);
  });
}

function applyMemoryToBountyMirror(bot, amount, options = {}) {
  const memoriesAdded = Math.max(0, Math.ceil(amount));
  if (options.triggerMemoryBountyMirror === false || !state.roundState || !bot || bot.eliminated || memoriesAdded <= 0) return;
  orderedPassiveEffectEntries("p10").forEach((entry) => {
    if (bot.eliminated) return;
    const bounty = memoriesAdded * stackLinearMultiplier(entry);
    if (bounty <= 0) return;
    markPassiveEntryTriggered(entry);
    changeBotSin(bot, bounty, `Seal of Gusion gave ${bot.name} +${bounty} bounty from memory growth.`, {
      source: "Seal of Gusion",
      triggerMemoryBountyMirror: false
    });
  });
}

function applyBountyToMemoryMirror(bot, amount, options = {}) {
  const bountyGained = Math.max(0, Math.ceil(amount));
  if (options.triggerMemoryBountyMirror === false || !state.roundState || !bot || bot.eliminated || bountyGained <= 0) return;
  orderedPassiveEffectEntries("p10").forEach((entry) => {
    if (bot.eliminated) return;
    const memory = bountyGained * stackLinearMultiplier(entry);
    if (memory <= 0) return;
    markPassiveEntryTriggered(entry);
    addBotMemory(bot, memory, `Seal of Gusion gave ${bot.name} +${memory} memory from bounty growth.`, {
      triggerMemoryBountyMirror: false
    });
  });
}

function addBotMemory(bot, count, reason = "", options = {}) {
  if (!bot || bot.eliminated || count <= 0) return 0;
  const added = Math.ceil(count);
  const beforeMemory = bot.memory?.length || 0;
  const entry = memoryEntryForBot(bot);
  for (let index = 0; index < added; index += 1) {
    bot.memory.push({ ...entry });
  }
  if (!bot.isBoss) bot.memory = bot.memory.slice(-NON_BOSS_MEMORY_LIMIT);
  const actualIncrease = Math.max(0, (bot.memory?.length || 0) - beforeMemory);
  recordBotMemorySource(bot, actualIncrease, options.source || sourceLabelFromReason(reason, "Memory"));
  applyMemoryAddedHealing(bot, actualIncrease);
  applyMemoryToBountyMirror(bot, actualIncrease, options);
  if (reason) state.roundState?.roundEvents.push(reason);
  checkBalamMemoryBountyEliminations();
  return added;
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
  const entries = orderedPassiveEffectEntries("p1");
  if (!entries.length) return;
  bot.memory = initialMemoryEntries(5).slice(-NON_BOSS_MEMORY_LIMIT);
  recordBotMemorySource(bot, bot.memory.length, ITEMS.p1?.name || "Seal of Vassago");
  entries.forEach((entry) => markPassiveEntryTriggered(entry));
}

function applyBotSinLossDamage(bot, lost, extraDamagePerSin = 0, extraSource = "") {
  const amount = Math.max(0, Math.ceil(lost));
  if (!bot || bot.eliminated || amount <= 0) return;

  if (extraDamagePerSin > 0) {
    const damage = Math.ceil(amount * extraDamagePerSin);
    if (damage > 0) damageBot(bot, damage, `${extraSource} dealt ${damage} damage to ${bot.name}.`, extraSource || "SIN loss");
  }

  orderedPassiveEffectEntries("p43").forEach((entry) => {
    const damage = passiveEntryFlatDamage(entry, 20);
    if (damage <= 0 || bot.eliminated) return;
    markPassiveEntryTriggered(entry);
    damageBot(bot, damage, `Seal of Raum dealt ${damage} damage to ${bot.name} for losing SIN.`, "Seal of Raum");
  });
}

function agaresDamagePerSin(entry) {
  return flatDamageValue(entry, 5);
}

function applyBotSinGainDamage(bot, gained) {
  const amount = Math.max(0, Math.ceil(gained));
  if (!state.roundState || !bot || bot.eliminated || amount <= 0) return;
  orderedPassiveEffectEntries("p50").forEach((entry) => {
    if (bot.eliminated) return;
    const damage = amount * agaresDamagePerSin(entry);
    if (damage <= 0) return;
    markPassiveEntryTriggered(entry);
    damageBot(bot, damage, `Seal of Agares dealt ${damage} damage to ${bot.name} for gaining ${amount} SIN.`, "Seal of Agares");
  });
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
      const damagePool = Math.max(0, Math.ceil(target.maxHp || 0));
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
  if (gained > 0 && options.triggerGainDamage !== false) {
    applyBotSinGainDamage(bot, gained);
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
  const entries = orderedPassiveEffectEntries("p49");
  if (!entries.length) return;
  entries.forEach((entry) => {
    const amount = passiveEntryScaledValue(entry, 4);
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

function passiveDisplayName(item) {
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
  const power = flatDamagePower("p5");
  return power ? Math.ceil(playerDamage * power) : 0;
}

function criticalCalipersWindow(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? stack + 1 : 0;
}

function pressureSpikeDamage(idOrItem) {
  return flatDamageValue(idOrItem, 30);
}

function sealDamageReduction(idOrItem) {
  return flatDamageValue(idOrItem, 4);
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
  return baseSin ? flatDamageValue(idOrItem, baseSin) : 0;
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

function sitriCloseGuessDamage(idOrItem) {
  return flatDamageValue(idOrItem, 5);
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
  if (memoryCount > 12) return flatDamageValue(idOrItem, 20);
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
  return baseMultiplier + eliteLevels(idOrItem) * 0.1;
}

function specialSealStackedMultiplier(entry, baseMultiplier, count) {
  const steps = Math.max(0, Math.floor(count || 0));
  if (!steps) return 1;
  return Math.pow(specialSealBaseMultiplier(entry, baseMultiplier), steps);
}

function apocalypseSealDescription(id, baseMultiplier, phrase) {
  const item = typeof id === "string" ? passiveEntry(id) || ITEMS[id] : id;
  const multiplier = specialSealBaseMultiplier(item, baseMultiplier);
  return `${phrase} x${multiplier.toFixed(2)} damage from all sources.`;
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
  return 1.5 * passivePower(idOrItem);
}

function sacrificialDaggerBossPercent(idOrItem = "p70") {
  const stack = typeof idOrItem === "string" ? passiveStack(idOrItem) : idOrItem?.stack || 0;
  return stack ? Math.min(100, 20 + Math.max(0, stack - 1) * 2) : 10;
}

function sacrificialDaggerPercentForBot(bot) {
  return bot?.isBoss ? sacrificialDaggerBossPercent("p70") : 20;
}

function halphasRoundBossDamage() {
  return Math.max(0, Math.ceil((state.round || 0) * (state.bossKills || 0)));
}

function halphasEliteCredits(entry) {
  return Math.max(0, ((entry?.stack || 1) - 1) * 2);
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

function tripleBallotWeight(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? 5 + (stack - 1) * 2 : 1;
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
  state.roundState.triggeredPassiveIds.add(entry.sourceId || entry.id);
}

function nonBossDamageMultiplier(bot, playerDealt = true) {
  return 1;
}

function scaledBotDamage(bot, amount, playerDealt = true) {
  return scaledBotDamageDetails(bot, amount, playerDealt).damage;
}

function scaledBotDamageDetails(bot, amount, playerDealt = true) {
  const damage = Math.max(0, Math.ceil(amount));
  if (!damage) return { damage: 0, baseDamage: 0, modifierEntries: [] };
  let exactDamage = damage;
  let roundedDamage = damage;
  const modifierEntries = [];
  const applyFlatBonus = (bonus, source, entry) => {
    const extra = Math.max(0, Math.ceil(bonus || 0));
    if (extra <= 0 || roundedDamage <= 0) return;
    exactDamage += extra;
    roundedDamage += extra;
    modifierEntries.push({ amount: extra, source, kind: "bonus" });
    markPassiveEntryTriggered(entry);
  };
  const applyMultiplier = (multiplier, source, entry) => {
    if (!Number.isFinite(multiplier) || multiplier <= 1 || roundedDamage <= 0) return;
    const before = roundedDamage;
    exactDamage *= multiplier;
    roundedDamage = Math.ceil(exactDamage);
    const extra = Math.max(0, roundedDamage - before);
    if (extra <= 0) return;
    modifierEntries.push({ amount: extra, source, kind: "bonus" });
    markPassiveEntryTriggered(entry);
  };

  if (bot) {
    orderedPassiveEffectEntries(["p46", "p62", "p63", "p68", "p52"]).forEach((entry) => {
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
        applyFlatBonus(vapulaMemoryExtraDamage(entry, bot.memory?.length || 0), ITEMS.p68?.name || "Seal of Vapula", entry);
        return;
      }

      if (entry.id === "p52") {
        applyFlatBonus(decarabiaMemoryExtraDamage(entry, bot), ITEMS.p52?.name || "Seal of Decarabia", entry);
      }
    });

    orderedPassiveEffectEntries(["p74", "p75", "p76", "p77", "p78", "p79"]).forEach((entry) => {
      if (entry.id === "p74") {
        applyMultiplier(specialSealStackedMultiplier(entry, 1.1, Math.floor(botSin(bot) / 2)), ITEMS.p74?.name, entry);
        return;
      }

      if (entry.id === "p75") {
        const targetCount = state.roundState?.artifactTargetCountsByBotId?.get(bot.id) || 0;
        applyMultiplier(specialSealStackedMultiplier(entry, 1.5, targetCount), ITEMS.p75?.name, entry);
        return;
      }

      if (entry.id === "p76") {
        applyMultiplier(specialSealStackedMultiplier(entry, 1.1, Math.floor((bot.memory?.length || 0) / 2)), ITEMS.p76?.name, entry);
        return;
      }

      if (entry.id === "p77" && state.roundState?.paleHorseDamageBoostActive) {
        applyMultiplier(specialSealBaseMultiplier(entry, 2), ITEMS.p77?.name, entry);
        return;
      }

      if (entry.id === "p78") {
        applyMultiplier(
          specialSealStackedMultiplier(entry, 1.15, state.roundState?.previousRoundEliminationsForMartyrs || 0),
          ITEMS.p78?.name,
          entry
        );
        return;
      }

      if (entry.id === "p79" && bot.revealedByPassive) {
        applyMultiplier(specialSealBaseMultiplier(entry, 2), ITEMS.p79?.name, entry);
      }
    });
  }

  return {
    damage: roundedDamage,
    baseDamage: damage,
    modifierEntries
  };
}

function scaledBotDamageSourceEntries(details, source) {
  const entries = [];
  const baseDamage = Math.max(0, Math.ceil(details?.baseDamage || 0));
  if (baseDamage > 0) entries.push({ amount: baseDamage, source });
  (details?.modifierEntries || []).forEach((entry) => {
    const amount = Math.max(0, Math.ceil(entry.amount || 0));
    if (amount > 0) entries.push({ amount, source: entry.source || "Damage modifier", kind: "bonus" });
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
    return `Heal ${artifactValue(10)}. There is a ${artifactPercentValue(33)}% chance the next elimination spawns a BOSS.`;
  }
  if (item.id === "a12") return `You take ${artifactPercentValue(50)}% less damage this round, including CRITICAL damage.`;
  if (item.id === "a13") {
    const value = artifactValue(20);
    return `Deal ${value} non-lethal damage to one DAMNED, then heal another already-damaged DAMNED for ${value}.`;
  }
  if (item.id === "a14") return `During reveal, reduce the TARGET by ${artifactValue(10)}. The TARGET can go below zero.`;
  if (item.id === "a15") {
    return `Pick a target. Deal ${artifactPercentValue(20)}% max-HEALTH damage to non-boss DAMNED, or ${artifactPercentValue(sacrificialDaggerBossPercent())}% to BOSSES.`;
  }
  if (item.id === "a16") return `Gain a random ${artifactValue(3)} to ${artifactValue(9)} SIN.`;
  if (item.id === "a17") return "Move the TARGET to the closest multiple of 3, 5, or 7.";
  if (item.id === "a18") {
    return "Instantly copy a random other ARTIFACT effect in your inventory.";
  }
  if (item.id === "a21") {
    return `This round, DAMNED take x${formatArtifactMultiplier(artifactMultiplier(2))} the damage you take.`;
  }
  if (item.id === "a22") {
    return `10% take ${artifactValue(20)} damage, 20% take ${artifactValue(10)} damage, 30% gain ${artifactValue(6)} SIN, 20% gain ${artifactValue(12)} SIN, 10% gain ${artifactValue(15)} SIN and deal ${artifactValue(20)} damage to each DAMNED. The remaining 10% fizzles.`;
  }
  if (item.id === "a23") {
    return `Arm the next Devil's Offerings reroll: the Seal slot has a ${artifactPercentValue(50)}% ELITE chance.`;
  }
  if (item.id === "a25") return `Pick a DAMNED, heal it to full, and increase its BOUNTY by ${artifactValue(9)}.`;
  if (item.id === "a26") {
    return "Reserved for a future ARTIFACT.";
  }
  if (item.id === "a28") {
    const value = artifactValue(6);
    return `Pick a non-boss DAMNED. It gains ${value} MEMORY, ${value} SIN, and ${value} max HEALTH.`;
  }
  return normalizeGameText((item.description || "").replace(/^One use\.\s*/i, ""));
}

function itemDescription(item) {
  if (!item) return "";
  if (item.type === "active") return artifactDescription(item);
  if (item.type !== "passive") return normalizeGameText((item.description || "").replace(/^One use\.\s*/i, ""));
  const stack = item.stack || 1;
  if (item.id === "p28") {
    const target = mimicTargetEntry();
    if (!target) return "Copies a random SEAL you own. If no SEAL is available, it waits for the next SEAL you buy.";
    const copiedVersion = passiveDisplayName({ ...target, stack });
    return `Copies ${target.name} as ${copiedVersion}. If the copied SEAL is sold, Ose chooses another owned SEAL.`;
  }
  if (item.id === "p39") return `Seal of Purson stacks: ${item.counter || 0}. Rounds without buying from Devil's Offerings add 1 stack. Buying an offering resets stacks. End of round pays ${Math.ceil((item.counter || 0) * passivePower(item))} SIN.`;
  if (stack <= 1) return item.description;
  if (item.id === "p1") return `New non-boss DAMNED arrive with 5 MEMORY. At end of round, each DAMNED takes ${flatDamageValue(item, 1)} damage per MEMORY.`;
  if (item.id === "p2") {
    return `Close guesses pay SIN: ${flatDamageValue(item, 1)} at +/-5, adding ${flatDamageValue(item, 1)} per step closer through ${flatDamageValue(item, 5)} at +/-1. On exact TARGET, gain ${flatDamageValue(item, 10)} SIN.`;
  }
  if (item.id === "p3") return `If the rounded TARGET is a multiple of 3, all DAMNED take ${divisibleVerdictDamage(item)} extra damage.`;
  if (item.id === "p4") {
    return `If your final effective guess is 0, 50, or 100, deal ${edgeGambitDamage(item)} damage to every DAMNED, take half TARGET-difference damage, and ignore worst guess penalty damage.`;
  }
  if (item.id === "p5") return `Whenever you take damage, all DAMNED take ${flatDamagePower(item)}x that damage as extra damage.`;
  if (item.id === "p6") return `Your CRITICAL hit triggers within ${criticalCalipersWindow(item)} of the right integer.`;
  if (item.id === "p7") return `When you hit CRITICAL, it deals ${pressureSpikeDamage(item)} damage to everyone else.`;
  if (item.id === "p8") return `At end of round, gain ${slowRepairSin(item)} SIN.`;
  if (item.id === "p9") return `Every DAMNED elimination pays ${victoryPatchSin(item)} SIN.`;
  if (item.id === "p10") return `MEMORY gained adds ${stackLinearMultiplier(item)}x that much BOUNTY. BOUNTY gained adds ${stackLinearMultiplier(item)}x that much MEMORY.`;
  if (item.id === "p11") {
    return `When a DAMNED dies, gain ${stack} random ARTIFACT${stack === 1 ? "" : "S"} if you have room.`;
  }
  if (item.id === "p12") return `At end of round, for every 10 SIN you have, deal ${flatDamageValue(item, 2)} damage to every DAMNED.`;
  if (item.id === "p13") return `If you make more than one elimination in a round, gain ${sweepDividendCredits(item) + sweepDividendHealingSin(item)} SIN.`;
  if (item.id === "p14") {
    return `At the start of each round, deal ${flatDamageValue(item, 20)} damage to a random DAMNED. If this kills, gain ${passiveConvertedSin(item, 5)} SIN.`;
  }
  if (item.id === "p15") return `Whenever MEMORY is added to a DAMNED, each MEMORY has a 50% chance to pay ${passiveConvertedSin(item, 1)} SIN.`;
  if (item.id === "p16") return `Your guess has x${tripleBallotWeight(item)} weight when calculating the TARGET average.`;
  if (item.id === "p17") {
    return `At end of round, deal ${flatDamagePower(item)}x the total MEMORY of all DAMNED on the board, including dead ones, to one random living DAMNED. If BOSSES are active, hit all active BOSSES and exclude BOSS MEMORY from the sum.`;
  }
  if (item.id === "p18") return `At end of round, this SEAL's sell value increases by ${scaledPassiveValueForItem(item, 3)}.`;
  if (item.id === "p19") return `Every time a DAMNED dies, deal ${flatDamageValue(item, 5)} damage to every other DAMNED.`;
  if (item.id === "p20") return `Devil's Offerings has ${shopSlotCountForItem(item)} slots. Whenever you use an ARTIFACT, all DAMNED take ${flatDamagePower(item)}x that ARTIFACT's purchase cost as damage.`;
  if (item.id === "p21") return `Every reroll makes all DAMNED take ${shaxRerollDamage(item, 1)} damage per SIN spent at end of round.`;
  if (item.id === "p22") return `Avoid 20% of damage you would take in a round. The avoided damage becomes ${flatDamagePower(item)}x MEMORY for the living DAMNED with the most MEMORY.`;
  if (item.id === "p23") return `New non-boss DAMNED have a ${Math.min(100, Math.round(33 * passivePower(item)))}% chance to spawn with +6 BOUNTY.`;
  if (item.id === "p24") return `You can use only one ARTIFACT per round. All DAMNED pay ${bountyOathMultiplierForItem(item).toFixed(1)}x BOUNTY SIN when eliminated.`;
  if (item.id === "p25") return `Gain +${baseEditionBonus(item)} ARTIFACT uses per round and +${baseEditionBonus(item)} ARTIFACT inventory slots.`;
  if (item.id === "p26") return `Using two matching ARTIFACTS in a round deals ${twinDetonatorDamage(item)} damage to all DAMNED.`;
  if (item.id === "p27") return `Every ARTIFACT triggers one outcome: gain ${reactiveWarrantySin(item)} SIN, deal ${reactiveWarrantyDamage(item)} damage to a random DAMNED, or refund its purchase cost.`;
  if (item.id === "p29") return `For every 2 SIN spent this round, deal ${furfurDamage(item)} damage to the highest-HEALTH non-boss DAMNED.`;
  if (item.id === "p30") return `Every DAMNED elimination deals ${andrealphusDamage(item)} damage to the DAMNED on its left and right.`;
  if (item.id === "p31") return `At end of round, two random DAMNED take ${flatDamagePower(item)}x their BOUNTY as damage.`;
  if (item.id === "p32") return `Every DAMNED death gives each other living DAMNED +${Math.ceil(passivePower(item))} to +${Math.ceil(2 * passivePower(item))} BOUNTY.`;
  if (item.id === "p33") return `Every DAMNED elimination makes all other DAMNED take ${flatDamagePower(item)}x that DAMNED's BOUNTY as damage.`;
  if (item.id === "p34") {
    return `When a DAMNED with 6 or more BOUNTY dies, gain ${passiveConvertedSin(item, 2)} SIN and deal ${flatDamageValue(item, 10)} damage to the highest-HEALTH enemy.`;
  }
  if (item.id === "p35") return `At end of round, the two highest BOUNTY DAMNED gain +${stack} BOUNTY.`;
  if (item.id === "p36") return "Removed.";
  if (item.id === "p37") return `If you take 4 or less total damage in a round, gain ${lowProfileRewardSin(item)} SIN.`;
  if (item.id === "p38") return `Start each round by marking a DAMNED. If it dies, its BOUNTY payout becomes at least ${scaledPassiveValueForItem(item, 6)} SIN or ${Math.round(200 * passivePower(item))}% BOUNTY, and you gain ${passiveConvertedSin(item, 5)} SIN.`;
  if (item.id === "p40") return `At end of round, deal ${flatDamagePower(item)}x half the total BOUNTY of living DAMNED to every enemy.`;
  if (item.id === "p41") return `If the rounded TARGET is a multiple of 7, gain SIN equal to ${Math.round(passivePower(item) * 100)}% of your current SIN.`;
  if (item.id === "p42") return "Removed.";
  if (item.id === "p43") return `Whenever a DAMNED loses SIN, it takes ${flatDamageValue(item, 20)} damage. At end of round, all DAMNED lose 1 SIN.`;
  if (item.id === "p44") return `At end of round, DAMNED with 2 or less BOUNTY are eliminated. Their SIN goes to the living DAMNED with the highest BOUNTY.`;
  if (item.id === "p45") return `DAMNED with 3 or less BOUNTY pay ${Math.round(200 * passivePower(item))}% BOUNTY SIN when eliminated.`;
  if (item.id === "p46") return `Whenever a DAMNED with 6 or more BOUNTY takes damage, it takes ${barbatosDamage(item)} extra damage.`;
  if (item.id === "p47") return `At end of round, ${stack} DAMNED lose half their BOUNTY and you gain double the SIN removed.`;
  if (item.id === "p48") return `At start of round, double ${stack} random DAMNED ${stack === 1 ? "BOUNTY" : "BOUNTIES"} for 1 round.`;
  if (item.id === "p49") return `Using an ARTIFACT that targets DAMNED gives each target +${scaledPassiveValueForItem(item, 4)} BOUNTY.`;
  if (item.id === "p50") return `At end of round, 10% of SIN earned this round spreads among DAMNED, prioritizing highest BOUNTY. Whenever a DAMNED gains SIN, it takes ${agaresDamagePerSin(item)} damage per SIN.`;
  if (item.id === "p51") return `Once each round per DAMNED, when that DAMNED has taken more than 30% max-HEALTH damage, it gains +${scaledPassiveValueForItem(item, 4)} BOUNTY.`;
  if (item.id === "p52") {
    return `Whenever a DAMNED takes damage, it takes ${flatDamageValue(item, 3)} extra damage per MEMORY. BOSSES take ${flatDamageValue(item, 1)} extra damage per MEMORY instead.`;
  }
  if (item.id === "p53") return `When a non-boss DAMNED is eliminated, gain bonus SIN equal to ${Math.round(100 * passivePower(item))}% of its MEMORY.`;
  if (item.id === "p54") return "Every round, one DAMNED is marked blue. When it takes TARGET-difference damage, each adjacent DAMNED takes that much damage too.";
  if (item.id === "p55") {
    return `If your final guess is within 5 of the TARGET, deal ${sitriCloseGuessDamage(item)} damage to every DAMNED and gain ${passiveConvertedSin(item, 2)} SIN. If outside 5, take 5 damage.`;
  }
  if (item.id === "p56") {
    return `At end of round, spread ${halphasRoundBossDamage()} damage randomly among enemies. ELITE pays ${halphasEliteCredits(item)} SIN each round.`;
  }
  if (item.id === "p57") {
    return "If a non-boss DAMNED has 10+ MEMORY and 10+ BOUNTY, it is instantly eliminated. Its max HEALTH becomes damage spread to other DAMNED; if BOSSES are active, BOSSES take the damage.";
  }
  if (item.id === "p58") {
    return `The worst guess penalty hits the 3 furthest guesses. The furthest takes ${flatDamageValue(item, 20)} damage, and the next two take ${flatDamageValue(item, 10)}.`;
  }
  if (item.id === "p59") return `Whenever you take damage, prevent ${sealDamageReduction(item)} of it.`;
  if (item.id === "p60") {
    return `Whenever you use an ARTIFACT, 50% chance to create a copy of it in your inventory and deal ${gaapDamage(item)} damage to every DAMNED.`;
  }
  if (item.id === "p61") {
    return `BOSSES can have their guess revealed. At the start of each round, each revealed DAMNED gains 1 poison. At end of round, each poison deals ${poisonPercentPerCounter(item)}% max-HEALTH damage.`;
  }
  if (item.id === "p62") return `The first time each full-HEALTH DAMNED takes damage in a round, it takes ${fullHealthExtraDamage(item)} extra damage.`;
  if (item.id === "p63") {
    return `${stack} extra DAMNED ${stack === 1 ? "is" : "are"} revealed. Revealed DAMNED take ${revealedExtraDamage(item)} extra damage.`;
  }
  if (item.id === "p64") {
    return `${stack} extra DAMNED ${stack === 1 ? "is" : "are"} revealed. Revealed DAMNED pay ${revealedBountyMultiplier(item).toFixed(1)}x BOUNTY SIN when eliminated.`;
  }
  if (item.id === "p65") return `At end of round, revealed DAMNED take ${flatDamagePower(item)}x half their guess as damage.`;
  if (item.id === "p66") return `On round numbers that are multiples of 5, eliminate one random non-boss DAMNED. If BOSSES are active, each active BOSS takes ${aimBossDamage(item)} damage.`;
  if (item.id === "p67") return `DAMNED with 8 or more MEMORY pay ${memoryBountyMultiplier(item).toFixed(1)}x BOUNTY SIN when eliminated.`;
  if (item.id === "p68") {
    return `DAMNED with 8 or more MEMORY take ${vapulaMemoryExtraDamage(item, 8)} extra damage. DAMNED with more than 12 MEMORY take ${vapulaMemoryExtraDamage(item, 13)} extra damage.`;
  }
  if (item.id === "p69") {
    return "Whenever a DAMNED hits CRITICAL, your guess counts as CRITICAL too and DAMNED CRITICAL damage cannot hurt you. DAMNED hit CRITICAL within +/-1 of the TARGET.";
  }
  if (item.id === "p70") {
    return `Sacrificial Dagger deals ${artifactPercentValue(sacrificialDaggerBossPercent(item))}% max-HEALTH damage to BOSSES too and appears ${sacrificialDaggerShopWeight(item)}x as often in Devil's Offerings.`;
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
  if (item.id === "p74") return apocalypseSealDescription(item, 1.1, "For every 2 SIN a DAMNED has, it takes");
  if (item.id === "p75") return apocalypseSealDescription(item, 1.5, "For each ARTIFACT used on a DAMNED this round, it takes");
  if (item.id === "p76") return apocalypseSealDescription(item, 1.1, "For every 2 MEMORY a DAMNED has, it takes");
  if (item.id === "p77") return apocalypseSealDescription(item, 2, "If you scored CRITICAL last round, DAMNED take");
  if (item.id === "p78") return apocalypseSealDescription(item, 1.15, "For each DAMNED eliminated in the previous round, DAMNED take");
  if (item.id === "p79") return `${apocalypseSealDescription(item, 2, "Revealed DAMNED take")} BOSSES can have their guesses revealed.`;
  if (item.id === "p80") {
    return `DAMNED take x${specialSealBaseMultiplier(item, 1.5).toFixed(2)} TARGET-difference damage. Worst guess damage counts as TARGET-difference damage.`;
  }
  return item.description;
}

function markPassiveTriggered(id) {
  if (!state.roundState || !passiveStack(id)) return;
  if (directPassiveStack(id)) state.roundState.triggeredPassiveIds.add(id);
  if (mimicContributionFor(id)) state.roundState.triggeredPassiveIds.add("p28");
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

function botHasPassive(bot, key) {
  return Boolean(bot.passiveKeys?.includes(key) || bot.buffPassiveKey === key);
}

function hasBossPassive(key) {
  return state.bots.some((bot) => bot.hp > 0 && botHasPassive(bot, key));
}

function botHasUniquePower(bot, key) {
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
    (bot) => bot.isBoss && ["petros", "pavlos"].includes(bot.uniqueKey) && bot.hp > 0 && !bot.eliminated
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
    .filter((bot) => bot.isBoss && bot.hp > 0 && !bot.eliminated && bot.modifierOverride !== null && bot.modifierOverride !== undefined)
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
  const duplicateMultiplier = item.type === "passive" ? directPassiveStack(item.id) + 1 : 1;
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
  if (bot.isBoss && bot.goeticPassiveId) names.push(`${bot.goeticSealName || ITEMS[bot.goeticPassiveId]?.name || "Seal"} Lock`);
  bot.passiveKeys?.forEach((key) => names.push(BOSS_PASSIVES[key].name));
  if (bot.buffPassiveKey) names.push(`Pyros Gift: ${BOSS_PASSIVES[bot.buffPassiveKey].name}`);
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
  if (bot.isBoss && bot.goeticPassiveId) {
    const sealName = bot.goeticSealName || ITEMS[bot.goeticPassiveId]?.name || "this Seal";
    descriptions.push(`While ${bot.name} is alive, your ${sealName} cannot trigger and appears darkened.`);
  }
  bot.passiveKeys?.forEach((key) => descriptions.push(BOSS_PASSIVES[key].description));
  if (bot.buffPassiveKey) descriptions.push(`Pyros gift: ${BOSS_PASSIVES[bot.buffPassiveKey].description}`);
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

function renderSealTooltipHtml(item, displayName, description, disabledNotice, sale) {
  const contribution = sealContributionSummary(item);
  return `
    <div class="tooltip-title">${escapeHtml(displayName)}</div>
    <div class="tooltip-body">${descriptionHtml(`${disabledNotice || ""}${description}`)}</div>
    <div class="seal-tooltip-footer">
      <span>${contribution ? escapeHtml(contribution) : ""}</span>
      <span>Sell ${sale} SIN</span>
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
  const className = ["seal-sigil", extraClass].filter(Boolean).join(" ");
  const name = typeof item === "string" ? ITEMS[item]?.name || "Seal" : item?.name || "Seal";
  return `<img class="${className}" src="${escapeAttr(src)}" alt="${escapeAttr(`${name} sigil`)}" loading="lazy" />`;
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

function targetDifferenceDamageTier() {
  return Math.max(0, Math.floor((state.bossKills || 0) / TARGET_DIFF_DAMAGE_BOSS_INTERVAL));
}

function targetDifferenceDamageMultiplier() {
  return Math.pow(TARGET_DIFF_DAMAGE_STEP, targetDifferenceDamageTier());
}

function targetDifferenceDamagePercent() {
  return Math.ceil(targetDifferenceDamageMultiplier() * 100);
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
  return copy;
}

function freeActiveCopy(id) {
  return { ...itemCopy(id), purchaseCost: 0 };
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
    ["Defixio", "Defixio"],
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
    ["Seal of Amon", "Seal of Amon"],
    ["Seal of Raum", "Seal of Raum"],
    ["Seal of Ronove", "Seal of Ronove"],
    ["Seal of Andromalius", "Seal of Andromalius"],
    ["Seal of Botis", "Seal of Botis"],
    ["Seal of Amon", "Seal of Amon"],
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
    ["Seal of Bathin", "Seal of Bathin"],
    ["The White-Hilted Knife", "The White-Hilted Knife"],
    ["The Philosopher's Stone", "The Philosopher's Stone"],
    ["The Necklace of Harmonia", "The Necklace of Harmonia"],
    ["Dantre", "Dantre"],
    ["Seal of Amon", "Seal of Amon"],
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
    const bonusEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "bonus"));
    const savedEntries = mergeSourceEntries((sources || []).filter((entry) => entry.kind === "saved"));
    return [
      ...damageEntries.map((entry) => `-${entry.amount} health from ${entry.source}`),
      ...bonusEntries.map((entry) => `+${entry.amount} total damage from ${entry.source}`),
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

function recordSealStatFromSource(kind, amount, source) {
  const value = Math.max(0, Math.ceil(amount));
  const id = sealIdFromStatSource(source);
  if (!id || value <= 0) return;
  const stats = state.sealStats[id] || { damage: 0, healing: 0, credits: 0, saved: 0 };
  stats[kind] = (stats[kind] || 0) + value;
  state.sealStats[id] = stats;
}

function sealContributionSummary(item) {
  const stats = state.sealStats?.[item?.id];
  if (!stats) return "";
  const parts = [];
  if (stats.damage > 0) parts.push(`${stats.damage} damage`);
  if (stats.healing > 0) parts.push(`${stats.healing} healing`);
  if (stats.saved > 0) parts.push(`${stats.saved} saved`);
  if (stats.credits > 0) parts.push(`${stats.credits} SIN`);
  return parts.length ? `Total: ${parts.join(" / ")}` : "";
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
}

function recordBotMemorySource(bot, amount, source) {
  const memory = Math.max(0, Math.ceil(amount));
  if (!bot || memory <= 0 || !sealIdFromStatSource(source)) return;
  bot.lastMemoryDelta = (bot.lastMemoryDelta || 0) + memory;
  bot.memorySources = bot.memorySources || [];
  bot.memorySources.push({ amount: memory, source });
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
  const damageDetails = scaledBotDamageDetails(bot, amount, playerDealt);
  const damage = damageDetails.damage;
  if (!bot || damage <= 0) return;
  botDamages.set(bot.id, (botDamages.get(bot.id) || 0) + damage);
  if (botDamageSources) {
    const sources = botDamageSources.get(bot.id) || [];
    sources.push(...scaledBotDamageSourceEntries(damageDetails, source || "Unknown"));
    botDamageSources.set(bot.id, sources);
  }
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
    modifierEntries.push({ amount: extra, source, kind: "bonus" });
    markPassiveEntryTriggered(entry);
  };

  targetDiffEntries.forEach((entry) => {
    if (entry.id === "p80") applyMultiplier(specialSealBaseMultiplier(entry, 1.5), ITEMS.p80?.name || "Seal of Silence in Heaven", entry);
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
    const avoided = Math.min(damage, Math.ceil(damage * 0.2));
    if (avoided <= 0) return;
    damage -= avoided;
    conversions.push({
      entry,
      avoided,
      memory: passiveEntryFlatDamage(entry, avoided)
    });
    markPassiveEntryTriggered(entry);
  });

  return {
    damage,
    conversions,
    avoidedTotal: conversions.reduce((sum, conversion) => sum + Math.max(0, Math.ceil(conversion.avoided || 0)), 0)
  };
}

function applyPlayerFlatDamageReduction(amount) {
  let damage = Math.max(0, Math.ceil(amount));
  const reductions = [];
  if (!state.roundState || damage <= 0) return { damage, reductions, savedTotal: 0 };
  orderedPassiveEffectEntries("p59").forEach((entry) => {
    if (damage <= 0) return;
    const saved = Math.min(damage, sealDamageReduction(entry));
    if (saved <= 0) return;
    damage -= saved;
    reductions.push({ saved, source: ITEMS.p59?.name || "Seal of Amon" });
    markPassiveEntryTriggered(entry);
  });
  return {
    damage,
    reductions,
    savedTotal: reductions.reduce((sum, reduction) => sum + reduction.saved, 0)
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
  const flatReduction =
    respectReduction || applySealConversion ? applyPlayerFlatDamageReduction(damage) : { damage, reductions: [], savedTotal: 0 };
  damage = flatReduction.damage;
  const conversion = applySealConversion ? applyPlayerDamageMemoryConversion(damage) : { damage, conversions: [], avoidedTotal: 0 };
  damage = conversion.damage;
  if (damage <= 0) {
    if (reductionSaved > 0) {
      recordPlayerDamageSource(reductionSaved, state.roundState?.playerDamageReductionSource || "Damage reduction", "saved");
    }
    flatReduction.reductions.forEach((entry) => recordPlayerDamageSource(entry.saved, entry.source, "saved"));
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
  if (reductionSaved > 0) {
    recordPlayerDamageSource(reductionSaved, state.roundState?.playerDamageReductionSource || "Damage reduction", "saved");
  }
  flatReduction.reductions.forEach((entry) => recordPlayerDamageSource(entry.saved, entry.source, "saved"));
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
  const multiplier = Number(round.painEcho) || 2;
  const echoDamage = Math.ceil(playerDamage * multiplier);
  const targets = activeBots();
  if (!targets.length) return;
  if (pendingBotDamages) {
    targets.forEach((bot) => {
      addPendingBotDamage(pendingBotDamages, pendingBotSources, bot, echoDamage, source);
    });
    round.roundEvents.push(`${source} adds ${echoDamage} damage to every DAMNED.`);
    return;
  }
  damageBots(targets, echoDamage, (bot, damage) => `${source} dealt ${damage} damage to ${bot.name}.`, source);
}

function healPlayer(amount, reason, source = undefined) {
  if (state.player.hp <= 0) return 0;
  amount = Math.ceil(amount);
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Healing");
  const healingBlocker = padmaHealingBlocker();
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

function healBot(bot, amount, reason, source = undefined) {
  amount = Math.ceil(amount);
  const before = bot.hp;
  bot.hp = Math.min(bot.maxHp, bot.hp + amount);
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
  const damageDetails = scaledBotDamageDetails(bot, amount, playerDealt);
  const damage = damageDetails.damage;
  if (!bot || bot.eliminated || damage <= 0) return 0;
  if (pavlosDamageBlocked(bot)) return 0;
  bot.lastDamage = (bot.lastDamage || 0) + damage;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Damage");
  recordScaledBotDamageSources(bot, damageDetails, sourceLabel);
  if (bot.immortal) {
    bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
    if (reason) {
      addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${damage} damage to ${bot.name}.` : reason);
    }
    return damage;
  }
  const hpBefore = bot.hp;
  bot.hp = Math.max(0, bot.hp - damage);
  if (reason) {
    addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${damage} damage to ${bot.name}.` : reason);
  }
  if (bot.hp <= 0) {
    recordBotExcessDamage(bot, damage, hpBefore);
    resolveEliminatedBots([bot]);
  }
  return damage;
}

function damageBotNonLethal(bot, amount, reason, source = undefined, playerDealt = true) {
  const rawDamage = Math.max(0, Math.ceil(amount));
  const damageDetails = scaledBotDamageDetails(bot, amount, playerDealt);
  const damage = damageDetails.damage;
  if (!bot || bot.eliminated || bot.hp <= 1 || damage <= 0) return 0;
  if (pavlosDamageBlocked(bot)) return 0;
  if (bot.immortal) {
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
    const reasonText = typeof reason === "function" ? reason(bot, damage) : reason;
    const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reasonText, "Damage");
    recordScaledBotDamageSources(bot, damageDetails, sourceLabel);
    if (reasonText) addRoundEvent(reasonText);
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
  return dealt;
}

function damageBots(bots, amount, reasonFactory, sourceFactory = undefined, playerDealt = true) {
  const eliminated = [];
  const planned = bots.map((bot) => {
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
      return;
    }
    const hpBefore = bot.hp;
    bot.hp = Math.max(0, bot.hp - damage);
    if (reason) addRoundEvent(reason);
    if (bot.hp <= 0) {
      recordBotExcessDamage(bot, damage, hpBefore);
      eliminated.push(bot);
    }
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
  const choices = BOSS_PASSIVE_KEYS.filter((key) => !owned.has(key));
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
  return `${botReward(bot)} SIN`;
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

function padmaHealingBlocker() {
  return activeBossesWithPower("padma")[0] || null;
}

function applyPadmaStartHealing() {
  const padmas = activeBossesWithPower("padma");
  if (!padmas.length) return;
  padmas.forEach((padma) => {
    const source = uniquePowerSourceName(padma, "padma");
    activeBots()
      .filter((bot) => bot.id !== padma.id)
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
  const archetype = archetypeByType(spec.personality);
  return {
    id: state.nextBotId++,
    name: spec.name,
    flag: "🏴",
    country: "Final Judgment",
    type: "Final Boss",
    color: spec.color,
    image: spec.image,
    anchor: archetype.anchor,
    aggression: Math.min(0.82, archetype.aggression + 0.18),
    noise: Math.max(6, archetype.noise - 1),
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
  const uniqueSpec = bossSpec?.uniqueKey ? UNIQUE_BOSS_SPECS[bossSpec.uniqueKey] : null;
  const copiedUniqueSpec = bossSpec?.copiedUniqueKey ? UNIQUE_BOSS_SPECS[bossSpec.copiedUniqueKey] : null;
  const powerSpec = copiedUniqueSpec || uniqueSpec;
  const profile = isBoss ? null : randomBotProfile();
  const archetype = uniqueSpec ? archetypeByType((powerSpec || uniqueSpec).personality) : randomFrom(BOT_ARCHETYPES);
  const bossOrder = isBoss ? state.bossSpawnCount + 1 : 0;
  const isEndlessBoss = isBoss && !uniqueSpec;
  const goeticSpec = isEndlessBoss ? goeticBossSpecFromKey(bossSpec?.goeticKey) : null;
  const bossBaseHp = 80 + bossHealthBonus();
  const bossHealthMultiplier = state.bossSpawnCount >= SCALING_BREAKPOINT_BOSSES ? 2 : 1;
  const statFactor = uniqueSpec?.statFactor ?? bossSpec?.statFactor ?? 1;
  const maxHp = isBoss ? Math.ceil(bossBaseHp * bossHealthMultiplier * bossHealthScaleFactor() * statFactor) : randomBotHealth();
  const endlessModifier = isEndlessBoss ? randomInt(6, 12) / 10 : null;
  const passiveKeys = isBoss
    ? uniqueSpec
      ? []
      : randomBossPassiveKeys(2)
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
    type: isBoss ? "BOSS" : archetype.type,
    color: isBoss ? "#d64f45" : archetype.color,
    image: uniqueSpec?.image || goeticSpec?.image || randomBotImage(),
    anchor: clamp(archetype.anchor + randomInt(-8, 8), 0, 100),
    aggression: isBoss ? Math.min(0.75, archetype.aggression + 0.12) : archetype.aggression,
    noise: isBoss ? Math.max(7, archetype.noise - 1) : archetype.noise,
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
    memory: isBoss ? state.gameMemory.slice() : [],
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
  const key = grantRandomBossPassive(target);
  if (!key) return;
  if (state.roundState) {
    state.roundState.pyrosGiftGranted = true;
    state.roundState.roundEvents.push(`${pyrosSource.name} gave ${target.name} ${BOSS_PASSIVES[key].name}.`);
  }
}

function rerollShop() {
  if (shopDisabledBySatan()) {
    state.shop = [];
    return;
  }
  const eliteBoosted = state.eliteBoostedNextReroll;
  state.eliteBoostedNextReroll = false;
  state.shop = [drawPassiveShopItem(eliteBoosted), drawActiveShopItem(), drawActiveShopItem()];
  if (eliteBoosted) addLog(`${activeName("a23")} set this Seal reroll's ELITE chance to ${artifactPercentValue(50)}%.`);
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
  return stack ? 1 + stack : 1;
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
  const ownedPassives = passivePool.filter((id) => directPassiveStack(id) > 0);
  const freshPassives = passivePool.filter((id) => directPassiveStack(id) === 0);
  const eliteChance = eliteBoosted ? artifactPercent(50) : SHOP_ELITE_CHANCE;
  const wantsElite = ownedPassives.length > 0 && Math.random() < eliteChance;
  const choices = wantsElite ? ownedPassives : freshPassives.length ? freshPassives : ownedPassives;
  if (!choices.length) return drawShopItem(passivePool);
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

function distributeSinAmongHighest(amount, targets) {
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
    const result = changeBotSin(bot, gift, `Seal of Agares gave ${bot.name} +${gift} SIN.`);
    distributed += result.gained;
  });
  return distributed;
}

function applyAgaresEarnedSinSpread() {
  const round = state.roundState;
  const entries = orderedPassiveEffectEntries("p50");
  if (!round || round.agaresSpreadApplied || !entries.length) return;
  const earned = Math.max(0, Math.ceil(round.earnedSinThisRound || 0));
  const amount = Math.ceil(earned * 0.1);
  const targets = activeBots().filter((bot) => !bot.immortal);
  if (earned <= 0 || amount <= 0 || !targets.length) return;
  round.agaresSpreadApplied = true;
  entries.forEach((entry) => {
    markPassiveEntryTriggered(entry);
    const distributed = distributeSinAmongHighest(amount, targets);
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
    const target = highestHealthNonBossBot();
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
  return state.mode !== "arcade" || state.gameOver;
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
      damageBots(targets, damage, (target, dealt) => `Seal of Haagenti dealt ${dealt} damage to ${target.name}.`, "Seal of Haagenti");
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
        damageBots(
          targets,
          damage,
          (bot, dealt) => `Seal of Gaap dealt ${dealt} damage to ${bot.name}.`,
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
      damageBots(
        targets,
        damage,
        (bot, dealt) => `Seal of Amdusias dealt ${dealt} damage to ${bot.name}.`,
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
        damageBot(target, damage, `Seal of Zagan dealt ${damage} damage to ${target.name}.`);
        return;
      }

      const refund = activePurchaseCost(item);
      const gained = gainCredits(refund, false, "Seal of Zagan");
      round.roundEvents.push(`Seal of Zagan refunded ${gained} SIN from ${item.name}.`);
    }
  });
}

function startGame() {
  resumeSoundtrack();
  pvpClearAutoTimer();
  pvpStopHostPolling();
  state.mode = "arcade";
  state.pauseOpen = false;
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
  state.gameMemory = [];
  state.pendingActive = null;
  state.gameOver = false;
  state.inspectingGameOver = false;
  state.nextBotId = 1;
  state.nextItemUid = 1;
  state.eliminations = 0;
  state.bossKills = 0;
  state.itemsBought = 0;
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
  state.eliteBoostedNextReroll = false;
  state.paleHorseBoostArmed = false;
  state.previousRoundEliminationsForMartyrs = 0;
  resetBotsForRun();
  rerollShop();
  beginRound();
  addLog("Round 1 begins. The table continues until you fall.");
  render();
}

function beginRound() {
  resetNegativePlaytestSin();
  pruneRemovedPassives();
  state.stage = "guess";
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
    eliminationsThisRound: 0,
    eliminationCreditRecords: [],
    pentakillAwarded: false,
    pentakillPopup: false,
    revealedBotIds: new Set(),
    targetDifferenceDamageByBotId: new Map(),
    belethTriggeredBotIds: new Set(),
    wiretapExtraCount: null,
    wiretapStack: 0,
    kalhaSuppressedPassiveIds: new Set(),
    kalhaSuppressedById: null,
    pavlosProtectedBotId: null,
    pavlosStartHpById: new Map(),
    pavlosDeferredBotIds: new Set(),
    resolvingDeferredPavlos: false,
    pyrosGiftGranted: false,
    paleHorseDamageBoostActive,
    previousRoundEliminationsForMartyrs: state.previousRoundEliminationsForMartyrs || 0,
    triggeredPassiveIds: new Set(),
    penaltiesApplied: false,
    criticalHitKeys: new Set(),
    roundEvents: []
  };

  state.bots.forEach((bot) => {
    if (bot.eliminated) return;
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
    bot.plannedGuess = planBotGuess(bot);
    bot.revealedByPassive = false;
    if (bot.uniqueKey === "pavlos") state.roundState.pavlosStartHpById.set(bot.id, bot.hp);
  });

  applyKalhaSealSuppression();
  applySerafimRoundSteal();
  applyPadmaStartHealing();
  applyPyrosBuffs();
  applyMarkedProspect();
  applyZeparTargetDifferenceMark();
  applyGuessReveals();
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

function applyZeparTargetDifferenceMark() {
  const entries = orderedPassiveEffectEntries("p54");
  if (!entries.length) return;
  const targets = activeBots();
  if (!targets.length) return;
  const target = randomFrom(targets);
  target.diffMarkedByPlayer = true;
  state.roundState.zeparMarkedBotId = target.id;
  entries.forEach((entry) => markPassiveEntryTriggered(entry));
  state.roundState.roundEvents.push(`Seal of Zepar marked ${target.name}; adjacent DAMNED echo its TARGET-difference damage.`);
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

  const salvoStacks = passiveStack("p14");
  if (!salvoStacks) return;
  const targets = activeBots();
  if (!targets.length) return;
  const target = randomFrom(targets);
  const damage = flatDamageValue("p14", 20);
  markPassiveTriggered("p14");
  damageBot(target, damage, `Seal of Leraje dealt ${damage} damage to ${target.name}.`);
  if (target.eliminated) {
    applyPassivePlayerHeal("p14", 5, "Seal of Leraje");
  }
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
      damageBot(target, damage, `Seal of Furcas dealt ${damage} damage to ${target.name}.`, "Seal of Furcas");
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

function selfConsistentBossGuess(otherAverage, participantCount, modifier, offset) {
  const count = Math.max(2, participantCount);
  const others = Math.max(1, count - 1);
  const denominator = 1 - modifier / count;
  if (denominator <= 0.05) return otherAverage * modifier + offset;
  return (modifier * otherAverage * others / count + offset) / denominator;
}

function planBossGuess(bot) {
  const memory = bot.memory || [];
  const currentModifier = state.roundState?.targetModifier ?? currentTargetModifier();
  const currentOffset = state.roundState?.targetOffset ?? 0;
  const participantCount = Math.max(2, activeBots().length + 1);
  const recent = memory.slice(-Math.min(8, memory.length));
  const assumedOpeningAverage = bot.anchor * 0.28 + 50 * 0.72;

  if (!recent.length) {
    const openingGuess = selfConsistentBossGuess(assumedOpeningAverage, participantCount, currentModifier, currentOffset);
    return Math.ceil(clamp(openingGuess + randomInt(-4, 4), 0, 100));
  }

  const estimatedOtherAverage =
    weightedMemoryAverage(recent, (entry) => {
      const rawAverage = memoryRawAverage(entry);
      if (!Number.isFinite(rawAverage)) return null;
      if (Number.isFinite(entry.ownGuess) && participantCount > 1) {
        return (rawAverage * participantCount - entry.ownGuess) / (participantCount - 1);
      }
      return rawAverage;
    }) ?? assumedOpeningAverage;
  const selfConsistentGuess = selfConsistentBossGuess(
    clamp(estimatedOtherAverage, 0, 100),
    participantCount,
    currentModifier,
    currentOffset
  );
  const projectedTarget = weightedMemoryAverage(recent, (entry) => projectedMemoryTarget(entry, currentModifier, currentOffset));
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2] || last;
  const lastTarget = projectedMemoryTarget(last, currentModifier, currentOffset) ?? projectedTarget ?? selfConsistentGuess;
  const prevTarget = projectedMemoryTarget(prev, currentModifier, currentOffset) ?? lastTarget;
  const trendTarget = lastTarget + (lastTarget - prevTarget) * 0.35;
  const playerPull = weightedMemoryAverage(recent, (entry) => entry.playerGuess);
  const targetPlan = projectedTarget ?? lastTarget;
  let guess;

  if (bot.type === "Analyst") {
    guess = selfConsistentGuess * 0.72 + trendTarget * 0.28;
  } else if (bot.type === "Follower") {
    guess = selfConsistentGuess * 0.78 + (playerPull ?? targetPlan) * 0.22;
  } else if (bot.type === "Stubborn") {
    guess = selfConsistentGuess * 0.7 + bot.anchor * 0.3;
  } else if (bot.type === "Drifter") {
    const sample = projectedMemoryTarget(randomFrom(recent), currentModifier, currentOffset) ?? targetPlan;
    guess = selfConsistentGuess * 0.66 + sample * 0.34;
  } else if (bot.type === "Caller") {
    guess = selfConsistentGuess * 0.74 + targetPlan * 0.26;
  } else {
    guess = selfConsistentGuess * 0.76 + bot.anchor * 0.24;
  }

  const smartNoise = Math.max(2, Math.ceil(bot.noise * 0.45));
  const pressured = bot.hp <= bot.maxHp * 0.35;
  guess += randomInt(-smartNoise, smartNoise);

  if (!pressured && Math.random() < bot.aggression * 0.14) {
    guess += randomFrom([-1, 1]) * randomInt(4, 10);
  }

  if (!pressured && Math.random() < bot.aggression * 0.025) {
    guess = selfConsistentGuess + randomFrom([-1, 1]) * randomInt(10, 18);
  }

  return Math.ceil(clamp(guess, 0, 100));
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

  return Math.ceil(clamp(guess, 0, 100));
}

function applyGuessReveals() {
  if (state.stage !== "guess" || !state.roundState) return;
  const revealEntries = orderedPassiveEffectEntries(["p63", "p64"]);
  const extraRevealCount = revealEntries.reduce((sum, entry) => sum + Math.max(1, entry.stack || 1), 0);
  const bossRevealAllowed = orderedPassiveEffectEntries(["p61", "p79"]).length > 0;
  const revealableBots = state.bots.filter(
    (bot) =>
      (bossRevealAllowed || !bot.isBoss) &&
      bot.hp > 0 &&
      !bot.eliminated &&
      !botHasPassive(bot, "shield")
  );
  const desiredRevealCount = Math.min(revealableBots.length, 1 + extraRevealCount);
  const revealedCount = revealableBots.filter((bot) => bot.revealedByPassive).length;
  const hiddenBots = shuffled(revealableBots.filter((bot) => !bot.revealedByPassive));
  const newlyRevealed = hiddenBots.slice(0, Math.max(0, desiredRevealCount - revealedCount));
  if (newlyRevealed.length && extraRevealCount > 0) {
    revealEntries.forEach((entry) => markPassiveEntryTriggered(entry));
  }
  newlyRevealed.forEach((bot) => {
    bot.revealedByPassive = true;
    state.roundState.revealedBotIds.add(bot.id);
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
  state.stage = "active";
  addLog(`Target revealed at ${formatNumber(round.target)}. CRITICAL integer: ${round.criticalInteger}.`);
  render();
}

function applyGuessMutation(name, guess, bot = null) {
  return guess;
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

  const tripleWeight = tripleBallotWeight("p16");
  const sinWeight = wealthWeightBonus();
  const playerWeight = tripleWeight + sinWeight;
  addWeightedGuess(round.playerEffectiveGuess, playerWeight);
  if (tripleWeight > 1) {
    markPassiveTriggered("p16");
  }

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
  playReadySfx();
  applyPenalties();
  render();
}

function performMainAction() {
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
      if (state.round % 5 !== 0) return;
      const nonBossTargets = activeBotList.filter((bot) => !bot.isBoss && !bot.immortal);
      const bossTargets = activeBotList.filter((bot) => bot.isBoss && !bot.immortal);
      let triggered = false;
      if (nonBossTargets.length) {
        const target = randomFrom(nonBossTargets);
        addPendingBotDamage(botDamages, botDamageSources, target, target.hp, "Seal of Aim");
        round.roundEvents.push(`Seal of Aim chose ${target.name} for elimination.`);
        triggered = true;
      }
      const bossDamage = aimBossDamage(entry);
      if (bossDamage > 0 && bossTargets.length) {
        bossTargets.forEach((bot) => addPendingBotDamage(botDamages, botDamageSources, bot, bossDamage, "Seal of Aim"));
        round.roundEvents.push(`Seal of Aim dealt ${bossDamage} damage to each active BOSS.`);
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
  const marked = state.bots.find((bot) => bot.id === round.zeparMarkedBotId);
  if (!marked) return;
  const damage = Math.max(0, Math.ceil(round.targetDifferenceDamageByBotId.get(marked.id) || 0));
  if (damage <= 0) return;
  const targets = adjacentLivingBots(marked);
  if (!targets.length) return;
  entries.forEach((entry) => {
    markPassiveEntryTriggered(entry);
    targets.forEach((bot) => {
      addPendingBotDamage(botDamages, botDamageSources, bot, damage, "Seal of Zepar", false);
    });
    round.roundEvents.push(`Seal of Zepar echoed ${damage} damage from ${marked.name} to adjacent DAMNED.`);
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
  if (criticals.some((hitter) => hitter.key === "player")) {
    if (passiveStack("p6")) markPassiveTriggered("p6");
    if (passiveStack("p7")) markPassiveTriggered("p7");
    const paleHorseEntries = orderedPassiveEffectEntries("p77");
    if (paleHorseEntries.length) {
      paleHorseEntries.forEach((entry) => markPassiveEntryTriggered(entry));
      state.paleHorseBoostArmed = true;
      round.roundEvents.push("Seal of the Pale Horse armed next round's damage.");
    }
  }
  let eligosBlockedCritical = false;
  criticals.forEach((hitter) => {
    const criticalSummary = hitter.key === "player" && passiveStack("p7") ? `${pressureSpikeDamage("p7")} damage` : `${hitter.damage} damage`;
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
        if (!hitter.bot || !botHasPassive(hitter.bot, "wideCrit")) {
          addPendingBotDamage(
            botDamages,
            botDamageSources,
            victim.bot,
            criticalDamage,
            `CRITICAL from ${hitter.name}`,
            hitter.kind === "player"
          );
        }
      }
    });
  });
  if (eligosBlockedCritical) round.roundEvents.push("Seal of Eligos blocked DAMNED CRITICAL damage against you.");

  applyOrderedPenaltyPassiveDamage(activeBots, botDamages, botDamageSources, addPlayerDamage, queuePlayerHeal);
  applyPendingBotDamageBatch(botDamages, botDamageSources, activeBots);

  const playerTargetDiffBaseDamage = Math.ceil(Math.abs(round.playerEffectiveGuess - round.target));
  const playerTargetDiffMultiplier = targetDifferenceDamageMultiplier();
  let playerTargetDiffDamage = Math.ceil(playerTargetDiffBaseDamage * playerTargetDiffMultiplier);
  if (round.edgeGambitStacks) playerTargetDiffDamage = Math.ceil(playerTargetDiffDamage * 0.5);
  addPlayerDamage(
    playerTargetDiffDamage,
    round.edgeGambitStacks
      ? "Target difference halved by Seal of Andras"
      : playerTargetDiffMultiplier > 1
        ? `Target difference x${targetDifferenceDamagePercent()}%`
        : "Target difference"
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
  const flatReduction = applyPlayerFlatDamageReduction(playerDamage);
  playerDamage = flatReduction.damage;
  if (flatReduction.savedTotal > 0) {
    flatReduction.reductions.forEach((entry) => {
      playerDamageSources.push({ amount: entry.saved, source: entry.source, kind: "saved" });
    });
    round.roundEvents.push(`Seal of Amon prevented ${flatReduction.savedTotal} damage.`);
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
  state.gameOver = true;
  state.inspectingGameOver = false;
  state.stage = "ended";
  state.pendingActive = null;
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
  return [
    {
      key: "player",
      kind: "player",
      name: "You",
      guess: round.playerEffectiveGuess,
      window: playerCritWindow.guaranteed,
      bonusWindowChance: playerCritWindow.chance,
      damage: 10
    },
    ...state.bots
      .filter((bot) => bot.hp > 0 && !bot.eliminated)
      .map((bot) => ({
        key: `bot-${bot.id}`,
        kind: "bot",
        bot,
        name: bot.name,
        guess: round.botEffectiveGuesses.get(bot.id),
        window: Math.max(botHasPassive(bot, "wideCrit") ? 2 : 0, passiveStack("p69") ? 1 : 0),
        bonusWindowChance: 0,
        damage: 10
      }))
  ];
}

function criticalDamageForVictim(hitter, victim) {
  if (hitter.key === "player" && passiveStack("p7")) {
    return pressureSpikeDamage("p7");
  }
  return hitter.damage;
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
    bot.eliminated = true;
    bot.deathCause = bot.deathCause || "ko";
    bot.deathNotice = bot.deathNotice || `${bot.name} -${bot.lastDamage || 0} KO`;
    state.roundState.roundEvents.push(
      reward > 0 ? `${bot.name} was eliminated. +${reward} SIN.` : `${bot.name} was eliminated. No SIN paid.`
    );

    dantreSources.forEach((dantre) => {
      const dantreDamage = damagePlayer(3, `${dantre.name} dealt damage for the elimination.`);
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
  });

  applyExcessDamageSpread(freshEliminations);

  const lambDeaths = freshEliminations.filter((bot) => botHasPassive(bot, "lamb")).length;
  if (lambDeaths) {
    const heal = 10 * lambDeaths;
    activeBots().forEach((bot) => healBot(bot, heal, "Boss Seal of Sallos"));
  }

  checkRoundPentakillBonus();
}

function adjacentLivingBots(bot) {
  const index = state.bots.findIndex((candidate) => candidate.id === bot.id);
  if (index < 0) return [];
  return [state.bots[index - 1], state.bots[index + 1]].filter((candidate) => candidate && candidate.hp > 0 && !candidate.eliminated);
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
  const healed = healPlayer(8, null, "PENTAKILL");
  const gained = gainCredits(8, false, "PENTAKILL");
  round.roundEvents.push(`PENTAKILL! Healed ${healed} and gained ${gained} SIN.`);
}

function applyKillRuleHealing(bot) {
  const heal = bot?.isBoss ? 8 : 1;
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
    const replacement = createBot({ boss: Boolean(bossSpec), bossSpec });
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
  const stack = passiveStack("p13");
  if (!stack) return;
  const round = state.roundState;
  if (round.multiEliminationBonusPaid || round.eliminationsThisRound < 2) return;
  round.multiEliminationBonusPaid = true;
  markPassiveTriggered("p13");
  const credits = sweepDividendCredits("p13");
  applyPassivePlayerHeal("p13", 5, "Seal of Bune");
  const gained = gainCredits(credits, true, "Seal of Bune");
  round.roundEvents.push(`Seal of Bune paid ${gained} SIN.`);
}

function nextBossSpecIfNeeded() {
  if (state.finalBossPhase || state.finalBossQueued) return null;

  if (state.bossQueued) {
    state.bossQueued = false;
    state.killsSinceBossSpawn = 0;
    return takeNextBossSpec();
  }

  if (state.killsSinceBossSpawn >= ENDLESS_BOSS_INTERVAL) {
    state.killsSinceBossSpawn = 0;
    return takeNextBossSpec();
  }
  return null;
}

function takeNextBossSpec() {
  if (state.uniqueBossQueue.length) {
    return uniqueBossSpecFromKey(state.uniqueBossQueue.shift());
  }
  if (state.goeticBossQueue.length) {
    return { goeticKey: state.goeticBossQueue.shift() };
  }
  if (state.goeticBossKills >= GOETIC_BOSS_TOTAL) {
    state.finalBossQueued = true;
  }
  return null;
}

function applyEliminationPassives(bot) {
  orderedPassiveEffectEntries(["p9", "p11", "p19", "p30", "p32", "p33", "p34", "p38", "p53"]).forEach((entry) => {
    if (entry.id === "p9") {
      markPassiveEntryTriggered(entry);
      applyPassivePlayerHealForEntry(entry, 3, "Seal of Marbas");
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
      const sin = passiveEntryConvertedSin(entry, 2);
      const gained = gainCredits(sin, true, "Seal of Gremory");
      const target = highestHealthEnemy();
      const damage = passiveEntryFlatDamage(entry, 10);
      if (target && damage > 0) {
        damageBot(target, damage, `Seal of Gremory dealt ${damage} damage to ${target.name}.`, "Seal of Gremory");
      }
      state.roundState.roundEvents.push(
        target
          ? `Seal of Gremory paid ${gained} SIN and struck ${target.name} for ${damage}.`
          : `Seal of Gremory paid ${gained} SIN, but no enemy could be struck.`
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
  orderedPassiveEffectEntries(["p1", "p12", "p17", "p21", "p31", "p40", "p56", "p61", "p65"]).forEach((entry) => {
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
    }
  });
}

function applyEndOfRoundPassives() {
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
    if (botHasPassive(bot, "metabolism")) healBot(bot, 5, `${bot.name}'s Seal of Bathin`);
    if (botHasPassive(bot, "fumes")) damagePlayer(2, `${bot.name}'s Seal of Amon dealt 2 damage to you.`);
    if (botHasPassive(bot, "thief") && state.player.credits > 0) {
      state.player.credits = Math.max(0, state.player.credits - 1);
      state.roundState.roundEvents.push(`${bot.name}'s Seal of Raum stole 1 SIN.`);
    }
  });

  applyEndOfRoundBotSinPassives();
  applyInflationEngine();
  applyLowProfileReward();
  applyPursonReward();
  applyPandoriumContractCleanup();
  clearMarkedProspects();
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
  const targets = activeBots().filter((bot) => !bot.immortal && botSin(bot) <= 2);
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
  if ((state.playerLastDamage || 0) > 4) return;
  const credits = lowProfileRewardSin("p37");
  const gained = gainCredits(credits, true, "Seal of Malphas");
  markPassiveTriggered("p37");
  state.roundState.roundEvents.push(`Seal of Malphas paid ${gained} SIN for taking ${state.playerLastDamage || 0} damage.`);
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
      if (bot.isBoss) bot.memory = state.gameMemory.slice();
      return;
    }
    const beforeMemory = bot.memory?.length || 0;
    for (let copy = 0; copy < memoryGain; copy += 1) {
      bot.memory.push({
        ownGuess,
        ...memoryEntry
      });
    }
    const memorySource = "End of round memory";
    if (!bot.isBoss) {
      bot.memory = bot.memory.slice(-NON_BOSS_MEMORY_LIMIT);
      const actualIncrease = Math.max(0, bot.memory.length - beforeMemory);
      applyMemoryAddedHealing(bot, actualIncrease);
      recordBotMemorySource(bot, actualIncrease, memorySource);
      applyMemoryToBountyMirror(bot, actualIncrease);
      checkBalamMemoryBountyEliminations();
    } else {
      const actualIncrease = Math.max(0, bot.memory.length - beforeMemory);
      applyMemoryAddedHealing(bot, actualIncrease);
      recordBotMemorySource(bot, actualIncrease, memorySource);
      applyMemoryToBountyMirror(bot, actualIncrease);
      checkBalamMemoryBountyEliminations();
    }
  });
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
    if (!existing && ownedSealSlotCount() >= passiveLimit()) {
      addLog("Seal slots are full.");
      render();
      return;
    }
    spendCredits(cost);
    if (existing) {
      existing.stack = (existing.stack || 1) + 1;
      addLog(`Upgraded ${existing.name} to ${passiveDisplayName(existing)}.`);
    } else {
      const boughtSeal = itemCopy(item.id);
      state.player.passives.push(boughtSeal);
      refreshMimicTarget();
      addLog(`Bought ${item.name}.`);
    }
    recordShopItemBought(item.id);
    state.itemsBought += 1;
    slot.sold = true;
    syncShopSlotCount();
    applyGuessReveals();
    checkBalamMemoryBountyEliminations();
    playSealPurchaseSfx();
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
  state.rerollBaseCost += 1;
  addLog(`Devil's Offerings rerolled for ${cost} SIN.`);
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
  render();
}

function sellActive(index) {
  if (arcadeActionLocked()) return;
  const item = state.player.actives[index];
  if (!item) return;
  const sale = Math.floor(item.price / 2);
  state.player.actives.splice(index, 1);
  gainCredits(sale, false, `Sold ${item.name}`);
  normalizeActiveCarouselIndex();
  addLog(`Sold ${item.name} for ${sale} SIN.`);
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

function canUseActive() {
  return (
    !arcadeActionLocked() &&
    state.stage === "active" &&
    state.roundState &&
    !state.roundState.penaltiesApplied &&
    state.roundState.activeUses < activeUseLimit()
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
  return copy;
}

function recordCopiedArtifactResolution(copierName, copiedItem, message, renderAfter = true) {
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
  if (TARGETED_ARTIFACT_IDS.has(item.id) || item.id === "a13") {
    state.pendingActive = { index: -1, uid: item.uid, id: item.id, mode: "bot", copiedItem: item, copiedByName: copierName };
    if (item.id === "a13") state.pendingActive.step = "damage";
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

  if (item.id === "a17") {
    recalculateTarget();
    const before = state.roundState.target;
    const snap = nearestMultipleFromDivisors(before, [3, 5, 7]);
    const snapped = snap.value;
    state.roundState.targetOffset += snapped - before;
    recalculateTarget();
    recordCopiedArtifactResolution(
      copierName,
      item,
      `${item.name} moved the TARGET to ${formatNumber(state.roundState.target)} (closest multiple of ${snap.divisor}).`
    );
    return;
  }

  if (item.id === "a23") {
    state.eliteBoostedNextReroll = true;
    recordCopiedArtifactResolution(
      copierName,
      item,
      `${item.name} marked the next reroll. The Seal slot has a ${artifactPercentValue(50)}% ELITE chance.`
    );
    return;
  }

  if (item.id === "a10") {
    const credits = randomInt(artifactValue(3), artifactValue(10));
    const gained = gainCredits(credits, true, item.name);
    recordCopiedArtifactResolution(copierName, item, `${item.name} gained ${gained} SIN.`);
    return;
  }

  if (item.id === "a11") {
    const heal = artifactValue(10);
    const healed = healPlayer(heal, null, item.name);
    let message = `${item.name} healed you for ${healed}.`;
    if (Math.random() < artifactPercent(33)) {
      state.bossQueued = true;
      message += " A boss is queued for the next elimination.";
    }
    recordCopiedArtifactResolution(copierName, item, message);
    return;
  }

  if (item.id === "a12") {
    state.roundState.playerDamageReduction = Math.max(state.roundState.playerDamageReduction, artifactPercent(50));
    state.roundState.playerDamageReductionSource = item.name;
    recordCopiedArtifactResolution(
      copierName,
      item,
      `${item.name} armed: you take ${artifactPercentValue(50)}% less damage this round.`
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
    const multiplier = artifactMultiplier(2);
    state.roundState.painEcho = Math.max(Number(state.roundState.painEcho) || 0, multiplier);
    recordCopiedArtifactResolution(
      copierName,
      item,
      `${item.name} armed: DAMNED take x${formatArtifactMultiplier(multiplier)} the damage you take this round.`
    );
    return;
  }

  if (item.id === "a22") {
    resolvePandoraRollEffect(item, (message) => recordCopiedArtifactResolution(copierName, item, message));
    return;
  }

  recordCopiedArtifactResolution(copierName, item, `${item.name} has no current effect.`);
}

function useActive(index) {
  if (arcadeActionLocked()) return;
  if (!canUseActive()) {
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

  if (item.id === "a13") {
    const damagedHealTargets = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated && bot.hp < bot.maxHp);
    if (!damagedHealTargets.length) {
      addLog(`${item.name} needs a damaged DAMNED to heal.`);
      render();
      return;
    }
  }

  const mirrorSpiteBots = activeBots().filter((bot) => botHasPassive(bot, "spite"));
  mirrorSpiteBots.forEach((bot) => {
    damagePlayer(3, `${bot.name}'s Seal of Botis dealt 3 damage to you.`);
  });
  if (state.player.hp <= 0) {
    finishGameOverRound();
    render();
    return;
  }

  const threonSource = activeBossesWithPower("threon")[0];
  if (threonSource && Math.random() < 0.5) {
    damagePlayer(5, `${threonSource.name} made ${item.name} malfunction for 5 damage.`);
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

  if (item.id === "a17") {
    recalculateTarget();
    const before = state.roundState.target;
    const snap = nearestMultipleFromDivisors(before, [3, 5, 7]);
    const snapped = snap.value;
    state.roundState.targetOffset += snapped - before;
    recalculateTarget();
    consumeActive(index, `${item.name} moved the TARGET to ${formatNumber(state.roundState.target)} (closest multiple of ${snap.divisor}).`, item.uid);
    return;
  }

  if (item.id === "a23") {
    state.eliteBoostedNextReroll = true;
    consumeActive(
      index,
      `${item.name} marked the next reroll. The Seal slot has a ${artifactPercentValue(50)}% ELITE chance.`,
      item.uid
    );
    return;
  }

  if (TARGETED_ARTIFACT_IDS.has(item.id)) {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot" };
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

  if (item.id === "a11") {
    const heal = artifactValue(10);
    const healed = healPlayer(heal, null, item.name);
    let message = `${item.name} healed you for ${healed}.`;
    if (Math.random() < artifactPercent(33)) {
      state.bossQueued = true;
      message += " A boss is queued for the next elimination.";
    }
    consumeActive(index, message, item.uid);
    return;
  }

  if (item.id === "a12") {
    state.roundState.playerDamageReduction = Math.max(state.roundState.playerDamageReduction, artifactPercent(50));
    state.roundState.playerDamageReductionSource = item.name;
    consumeActive(index, `${item.name} armed: you take ${artifactPercentValue(50)}% less damage this round.`, item.uid);
    return;
  }

  if (item.id === "a13") {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot", step: "damage", damageBotId: null };
    addLog("Pick a DAMNED to take 20 non-lethal damage.");
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
    const copyOptions = state.player.actives.filter(
      (active, activeIndex) => activeIndex !== index && active.id !== item.id && ACTIVE_IDS.includes(active.id)
    );
    if (!copyOptions.length) {
      addLog(`${item.name} needs another non-copier Artifact to copy.`);
      render();
      return;
    }
    const copied = randomFrom(copyOptions);
    consumeActive(index, `${item.name} shattered into ${copied.name}.`, item.uid, false);
    if (state.player.hp <= 0) {
      render();
      return;
    }
    beginCopiedArtifactEffect(copied, item.name);
    return;
  }

  if (item.id === "a21") {
    const multiplier = artifactMultiplier(2);
    state.roundState.painEcho = Math.max(Number(state.roundState.painEcho) || 0, multiplier);
    consumeActive(index, `${item.name} armed: DAMNED take x${formatArtifactMultiplier(multiplier)} the damage you take this round.`, item.uid);
    return;
  }

  if (item.id === "a22") {
    resolvePandoraRoll(index, item.uid);
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
  if (pending.id === "a13" && pending.step === "heal") {
    addLog(`${itemName} has already hit; choose a heal target to finish it.`);
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
  state.roundState.activeUses += 1;
  state.pendingActive = null;
  state.roundState.roundEvents.push(message);
  addLog(message);
  applyActiveUsePassives(item);
  recalculateTarget();
  normalizeActiveCarouselIndex();
  if (state.player.hp <= 0) {
    finishGameOverRound();
  }
  if (renderAfter) render();
}

function resolvePandoraRollEffect(item, finish) {
  const name = item?.name || activeName("a22");
  const roll = Math.random();
  if (roll < 0.1) {
    const damage = artifactValue(20);
    damagePlayer(damage, `${name} dealt ${damage} damage to you.`, true, true, name);
    finish(`${name} backfired.`);
    return;
  }
  if (roll < 0.3) {
    const damage = artifactValue(10);
    damagePlayer(damage, `${name} dealt ${damage} damage to you.`, true, true, name);
    finish(`${name} stung you.`);
    return;
  }
  if (roll < 0.6) {
    const gained = gainCredits(artifactValue(6), true, name);
    finish(`${name} gained ${gained} SIN.`);
    return;
  }
  if (roll < 0.8) {
    const gained = gainCredits(artifactValue(12), true, name);
    finish(`${name} gained ${gained} SIN.`);
    return;
  }
  if (roll >= 0.9) {
    finish(`${name} flickered and did nothing.`);
    return;
  }
  const gained = gainCredits(artifactValue(15), true, name);
  const damage = artifactValue(20);
  damageBots(activeBots(), damage, (bot, dealt) => `${name} dealt ${dealt} damage to ${bot.name}.`, name);
  finish(`${name} gained ${gained} SIN and struck every DAMNED.`);
}

function resolvePandoraRoll(index, uid) {
  const item = state.player.actives.find((active) => active.uid === uid) || ITEMS.a22;
  resolvePandoraRollEffect(item, (message) => consumeActive(index, message, uid));
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
    addLog(`${bot.name}'s Seal of Halphas blocks Artifacts.`);
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
    const damage = Math.ceil(bot.maxHp * artifactPercent(sacrificialDaggerPercentForBot(bot)));
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} hit ${bot.name} for ${damage}.`, uid, false);
    damageBot(bot, damage, `${itemName} dealt ${damage} damage to ${bot.name}.`, itemName);
    if (state.player.hp <= 0) finishGameOverRound();
    render();
    return;
  }

  if (id === "a25") {
    const bounty = artifactValue(9);
    changeBotSin(bot, bounty, "", { triggerLossDamage: false, source: itemName });
    const healed = healBot(bot, bot.maxHp, itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} healed ${bot.name} for ${healed} and added +${bounty} bounty.`);
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
    if (bot.isBoss) {
      addLog(`${itemName} cannot target BOSSES.`);
      render();
      return;
    }
    const value = artifactValue(6);
    addBotMemory(bot, value, `${itemName} gave ${bot.name} +${value} memory.`);
    changeBotSin(bot, value, `${itemName} gave ${bot.name} +${value} SIN.`, { triggerLossDamage: false });
    bot.maxHp += value;
    bot.hp += value;
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(index, `${itemName} gave ${bot.name} +${value} memory, +${value} SIN, and +${value} health.`);
    return;
  }

  if (id === "a13") {
    resolveTriageBeam(bot);
  }
}

function resolveTriageBeam(bot) {
  const pending = state.pendingActive;
  const item = pendingArtifactItem();
  const itemName = item?.name || activeName("a13");
  if (pending.step === "damage") {
    const possibleHealTargets = state.bots.filter(
      (candidate) => candidate.id !== bot.id && candidate.hp > 0 && !candidate.eliminated && candidate.hp < candidate.maxHp
    );
    if (!possibleHealTargets.length) {
      addLog("Pick a damage target that leaves another damaged DAMNED to heal.");
      render();
      return;
    }
    const value = artifactValue(20);
    const dealt = damageBotNonLethal(
      bot,
      value,
      (target, damage) => `${itemName} dealt ${damage} non-lethal damage to ${target.name}.`,
      itemName
    );
    applyTargetedItemSinGain(item, [bot]);
    pending.step = "heal";
    pending.damageBotId = bot.id;
    addLog(`Now pick another DAMNED to heal for ${value}.`);
    render();
    return;
  }

  if (pending.step === "heal") {
    if (bot.id === pending.damageBotId) {
      addLog("Choose another DAMNED to receive the heal.");
      render();
      return;
    }
    if (bot.hp >= bot.maxHp) {
      addLog(`${itemName} can only heal a damaged DAMNED.`);
      render();
      return;
    }
    const healed = healBot(bot, artifactValue(20), itemName);
    applyTargetedItemSinGain(item, [bot]);
    finishActiveResolution(pending.index, `${itemName} healed ${bot.name} for ${healed}.`);
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

function render() {
  updateFullscreenLayoutClass();
  const app = document.querySelector("#app");
  app.className = `app ${state.mode === "pvp" ? "pvp-app" : ""} ${state.mode === "menu" ? "menu-app" : ""}`;
  app.innerHTML = state.mode === "menu" ? renderMenuApp() : state.mode === "pvp" ? renderPvpApp() : renderArcadeApp();
  bindEvents();
}

function renderMenuApp() {
  const screen = state.menuScreen || "main";
  return `
    <main class="main-menu" aria-label="main menu">
      <section class="main-menu-panel">
        ${screen === "play" ? renderPlayMenu() : screen === "options" ? renderOptionsMenu() : screen === "quit" ? renderQuitMenu() : renderMainMenu()}
      </section>
    </main>
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

function renderPlayMenu() {
  return `
    <div class="main-menu-actions">
      <button class="menu-button" data-menu-action="arcade">Arcade</button>
      <button class="menu-button" data-menu-action="pvp">Pvp</button>
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
    </div>
  `;
}

function renderOptionsMenu() {
  return `
    <div class="options-menu">
      ${renderSoundSettings("menu")}
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
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
  `;
}

function isMobileArcadeView() {
  return document.body.classList.contains("mobile-arcade");
}

function renderMobileOfferingsButton() {
  if (!isMobileArcadeView()) return "";
  return `<button class="mobile-offerings-button" id="mobileOfferingsToggle" aria-label="Open Devil's Offerings">Offerings</button>`;
}

function renderMobileOfferingsHeader() {
  if (!isMobileArcadeView()) return "";
  return `
    <div class="mobile-offerings-header">
      <div class="panel-title">Devil's Offerings</div>
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

function renderPauseMenu() {
  if (!state.pauseOpen) return "";
  const modeButton = state.mode === "pvp" ? "Arcade" : "PvP";
  const modeAction = state.mode === "pvp" ? "arcade" : "pvp";
  return `
    <div class="overlay visible pause-overlay">
      <section class="end-card pause-card">
        <h1 class="end-title">Paused</h1>
        <div class="pause-actions">
          <button class="primary-button" data-pause-action="resume">Resume</button>
          <button class="primary-button" data-pause-action="restart">Restart</button>
          <button class="primary-button" data-pause-action="${modeAction}">${modeButton}</button>
          <button class="primary-button" data-pause-action="menu">Main Menu</button>
        </div>
        <div class="pause-sound-settings">
          ${renderSoundSettings("pause")}
        </div>
      </section>
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
  const activeClass = participant.activeCast && !activeHidden && !isDown ? "cast-active" : "";
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

function renderTopbar() {
  const playerDamageTooltip = sourceTooltip(state.playerDamageSources, "damage");
  const playerHealTooltip = sourceTooltip(state.playerHealSources, "heal");
  const playerCreditTooltip = sourceTooltip(state.playerCreditSources, "credits");
  const playerDamageBadge =
    state.playerLastDamage > 0
      ? `<div class="player-damage-badge" ${playerDamageTooltip ? `data-tooltip="${escapeAttr(playerDamageTooltip)}"` : ""}>-${state.playerLastDamage}</div>`
      : "";
  const playerHealBadge =
    state.playerLastHeal > 0
      ? `<div class="player-heal-badge" ${playerHealTooltip ? `data-tooltip="${escapeAttr(playerHealTooltip)}"` : ""}>+${state.playerLastHeal}</div>`
      : "";
  const playerCreditBadge =
    state.playerLastCredits > 0
      ? `<div class="player-credit-badge" ${playerCreditTooltip ? `data-tooltip="${escapeAttr(playerCreditTooltip)}"` : ""}>+${state.playerLastCredits} SIN</div>`
      : "";
  const maxHp = playerMaxHp();
  const healthPercent = maxHp > 0 ? clamp((state.player.hp / maxHp) * 100, 0, 100) : 0;
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
          <strong>${state.player.hp}/${maxHp}</strong>
        </div>
        <div class="health-bar">
          <div class="health-fill" style="width: ${healthPercent}%"></div>
        </div>
      </div>
      <div class="stat-card round-wrap">
        <span class="stat-label">Round</span>
        <span class="stat-value">${state.round}</span>
        <button class="small-button round-skip-button" id="skipProgression" title="${escapeAttr(normalizeGameText(skipTitle))}" ${state.finalBossPhase || arcadeLocked ? "disabled" : ""}>SKIP</button>
      </div>
      <div class="stat-card">
        <span class="stat-label">KOs / BOSS</span>
        <span class="stat-value">${state.eliminations}/${state.bossKills}</span>
      </div>
      <div class="stat-card credit-wrap">
        ${playerCreditBadge}
        <span class="stat-label">SIN</span>
        <span class="stat-value">${state.player.credits}</span>
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

  return `
    <section class="target-panel" aria-label="Target">
      <div class="target-value">
        <span class="stat-label">Target</span>
        <strong>${target}</strong>
      </div>
      <div class="target-detail">
        <div class="target-line target-previous">Previous: <strong>${previousTarget}</strong></div>
        <div class="target-line target-modifier">Modifier: <strong>${modifier}</strong></div>
        <div class="target-calc-line">Calc: ${calculation}</div>
      </div>
      <div class="target-diff-damage">diff dmg: ${targetDifferenceDamagePercent()}%</div>
    </section>
  `;
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
  const submitted = round?.botSubmittedGuesses.get(bot.id);
  const effective = round?.botEffectiveGuesses.get(bot.id);
  const isDown = bot.eliminated || bot.hp <= 0;
  const revealed = Number.isFinite(effective)
    ? formatNumber(effective)
    : state.stage !== "guess"
      ? "--"
      : bot.revealedByPassive
        ? bot.plannedGuess
        : "--";
  const rawNote =
    state.stage !== "guess" && submitted !== effective ? `Raw ${submitted}` : bot.revealedByPassive ? "Revealed" : "Guess";
  const memoryText = bot.memory.length ? `${bot.memory.length} rounds` : "No memory";
  const pickClass = pendingPick ? "pickable" : "";
  const freshClass = bot.fresh ? "fresh" : "";
  const bossClass = bot.isBoss ? "boss" : "";
  const diffMarkedClass = bot.diffMarkedByPlayer && !isDown ? "diff-marked" : "";
  const downClass = isDown ? "eliminated" : "";
  const deathCauseClass = bot.deathCause ? `death-${bot.deathCause}` : "";
  const faceClass = bot.isBoss ? "boss-face" : "";
  const passiveSummary = botPassiveSummary(bot);
  const hasVisiblePassive = passiveSummary && passiveSummary !== "No Seal";
  const typeLabel = normalizeGameText(hasVisiblePassive ? `${bot.isBoss ? "BOSS" : bot.type}: ${passiveSummary}` : bot.type);
  const passiveDescription = hasVisiblePassive ? botPassiveDescription(bot) : "";
  const removed = round?.removedBotIds.has(bot.id) ? "Jammed" : rawNote;
  const isCriticalGuess = round?.criticalHitKeys?.has(`bot-${bot.id}`);
  const criticalGuessClass = isCriticalGuess ? "critical-guess" : "";
  const criticalGuessLabelClass = isCriticalGuess ? "critical-guess-label" : "";
  const guessCloseness = guessClosenessAttrs(effective, round?.target, isCriticalGuess);
  const guessClass = [criticalGuessClass, guessCloseness.className].filter(Boolean).join(" ");
  const damageTooltip = sourceTooltip(bot.damageSources, "damage");
  const healTooltip = sourceTooltip(bot.healSources, "heal");
  const sinTooltip = sourceTooltip(bot.sinSources, "signed-credits");
  const memoryTooltip = sourceTooltip(bot.memorySources, "memory");
  const damageBadge =
    bot.lastDamage > 0 && state.stage !== "guess"
      ? `<div class="damage-badge" ${damageTooltip ? `data-tooltip="${escapeAttr(damageTooltip)}"` : ""}>-${bot.lastDamage}</div>`
      : "";
  const healBadge =
    bot.lastHeal > 0 && state.stage !== "guess"
      ? `<div class="heal-badge" ${healTooltip ? `data-tooltip="${escapeAttr(healTooltip)}"` : ""}>+${bot.lastHeal}</div>`
      : "";
  const sinBadge =
    bot.lastSinDelta && !bot.immortal
      ? `<div class="bounty-badge" ${sinTooltip ? `data-tooltip="${escapeAttr(sinTooltip)}"` : ""}>${bot.lastSinDelta > 0 ? "+" : ""}${bot.lastSinDelta} SIN</div>`
      : "";
  const memoryBadge =
    bot.lastMemoryDelta > 0
      ? `<div class="memory-badge" ${memoryTooltip ? `data-tooltip="${escapeAttr(memoryTooltip)}"` : ""}>+${bot.lastMemoryDelta}</div>`
      : "";
  const deathBadgeClass = bot.deathCause === "contract" ? "contract-badge" : "";
  const deathBadge = bot.deathNotice ? `<div class="death-badge ${deathBadgeClass}">${bot.deathNotice}</div>` : "";
  const markBadge = bot.markedByPlayer && !isDown ? `<div class="mark-badge">MARKED</div>` : "";
  const rewardLabel = botSinDisplay(bot);
  const flagHtml = bot.isBoss
    ? ""
    : `<span class="bot-flag" aria-label="${escapeAttr(bot.country)}" title="${escapeAttr(bot.country)}">${bot.flag}</span>`;
  const healthLabel = bot.immortal ? `Damage ${bot.damageTakenTotal || 0}` : `HEALTH ${bot.hp}/${bot.maxHp}`;
  const healthPercent = bot.immortal ? 100 : (bot.hp / bot.maxHp) * 100;
  const identitySwapBlocked = state.pendingActive?.id === "a7" && bot.isBoss;
  const shieldBlocked = pendingPick && botHasPassive(bot, "shield");
  const pickDisabled = isDown || identitySwapBlocked || shieldBlocked;
  const pickButton = pendingPick
    ? `<button class="pick-button" data-pick-bot="${bot.id}" ${pickDisabled ? "disabled" : ""}>${isDown ? "Down" : identitySwapBlocked ? "BOSS" : shieldBlocked ? "SEAL" : "Pick"}</button>`
    : "";
  const tooltipAttr = passiveDescription ? ` data-tooltip="${escapeAttr(passiveDescription)}"` : "";
  const faceInner = isDown
    ? bot.deathCause === "contract"
      ? `<span class="contract-mark">PC</span>`
      : `<span class="ko-x">X</span>`
    : `<img class="bot-image" src="${escapeAttr(botImagePath(bot))}" alt="" loading="lazy" />`;

  return `
    <article class="bot-card ${pickClass} ${freshClass} ${bossClass} ${diffMarkedClass} ${downClass} ${deathCauseClass}" style="--bot-color: ${bot.color}"${tooltipAttr}>
      ${deathBadge}
      ${markBadge}
      <div class="bot-face ${faceClass}">${faceInner}</div>
      <div class="bot-title">
        ${flagHtml}
        <div class="bot-name" title="${escapeAttr(normalizeGameText(`${bot.name} (${bot.country})`))}">${bot.name}</div>
        <div class="bot-reward" title="SIN">${rewardLabel}</div>
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
          <span>${healthLabel}</span>
          <div class="health-bar">
            <div class="health-fill" style="width: ${healthPercent}%"></div>
          </div>
        </div>
      </div>
      ${pickButton}
    </article>
  `;
}

function renderConsole() {
  const round = state.roundState;
  let buttonText = "Guess";
  let hint = "";
  let disabled = "";
  let inputDisabled = "";
  const maxGuess = playerGuessLimit();

  if (state.stage === "active") {
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

  const value = round?.playerSubmittedGuess ?? "";
  const playerCritical = round?.criticalHitKeys?.has("player");
  const playerCloseness = guessClosenessAttrs(round?.playerEffectiveGuess, round?.target, playerCritical);
  const criticalInputClass = playerCritical ? "critical-guess" : "";
  const inputClass = ["guess-input", criticalInputClass, playerCloseness.className].filter(Boolean).join(" ");
  const pendingText = renderPendingText();
  const pendingCancel = state.pendingActive ? `<button id="cancelPendingActive" class="small-button pending-cancel">Cancel</button>` : "";

  return `
    <section class="center-console" aria-label="Player action">
      ${hint ? `<div class="console-hint">${escapeHtml(normalizeGameText(hint))}</div>` : ""}
      <div class="console-row">
        <input
          id="guessInput"
          class="${inputClass}"
          type="number"
          min="0"
          max="${maxGuess}"
          step="1"
          value="${value}"
          ${playerCloseness.style.trim()}
          ${inputDisabled}
        />
        <button id="mainAction" class="primary-button" ${disabled}>${buttonText}</button>
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
    return `${item.name}: pick a target. non-boss DAMNED take ${artifactPercentValue(20)}%, BOSSES take ${artifactPercentValue(sacrificialDaggerBossPercent())}%.`;
  }
  if (state.pendingActive.id === "a25") return `${item.name}: pick DAMNED to heal to full and give +${artifactValue(9)} BOUNTY.`;
  if (state.pendingActive.id === "a26" && state.pendingActive.step === "give") return `${item.name}: pick DAMNED to receive the drained BOUNTY.`;
  if (state.pendingActive.id === "a26") return `${item.name}: pick DAMNED to drain up to ${artifactValue(5)} BOUNTY.`;
  if (state.pendingActive.id === "a28") {
    const value = artifactValue(6);
    return `${item.name}: pick a non-boss DAMNED to gain +${value} MEMORY, +${value} SIN, and +${value} HEALTH.`;
  }
  if (state.pendingActive.id === "a13" && state.pendingActive.step === "heal") {
    return `${item.name}: pick different DAMNED to heal for ${artifactValue(20)}.`;
  }
  return `${item.name}: pick a DAMNED card to resolve it.`;
}

function renderShop() {
  const locked = shopDisabledBySatan();
  const actionsLocked = arcadeActionLocked();
  return `
    <section class="panel shop-panel ${locked ? "shop-locked" : ""}" aria-label="Devil's Offerings">
      <div class="panel-header">
        <div>
          <div class="panel-title">Devil's Offerings</div>
        </div>
        <div class="reroll-control">
          <span class="reroll-cost">${currentRerollCost()} SIN</span>
          <button class="small-button" id="rerollShop" ${locked || actionsLocked ? "disabled" : ""}>Reroll</button>
        </div>
      </div>
      <div class="shop-slots">
        ${locked ? `<div class="shop-lock-message">Satan has sealed Devil's Offerings.</div>` : state.shop.map((slot, index) => renderShopSlot(slot, index)).join("")}
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
  const full =
    item.type === "passive"
      ? passiveCopies === 0 && ownedSealSlotCount() >= passiveLimit()
      : state.player.actives.length >= activeInventoryLimit();
  const disabled = arcadeActionLocked() || shopDisabledBySatan() || !canSpendCredits(cost) || full ? "disabled" : "";
  const buttonText = passiveCopies ? `Upgrade ${cost} SIN` : full ? "Full" : `Buy ${cost} SIN`;
  const previewItem = passiveCopies ? { ...item, stack: passiveCopies + 1 } : item;
  const displayName = passiveCopies ? passiveDisplayName(previewItem) : item.name;
  const description = itemDescription(previewItem);
  const itemImage =
    item.type === "passive" ? renderSealSigil(previewItem, "shop-seal-sigil") : renderArtifactIcon(previewItem, "shop-artifact-icon");
  const imageClass = itemImage ? `has-item-icon ${item.type === "passive" ? "has-seal-sigil" : "has-artifact-icon"}` : "";

  return `
    <article class="item-card ${item.type} ${imageClass}" data-tooltip="${escapeAttr(description)}">
      ${itemImage}
      <div class="item-top">
        <div>
          <div class="item-name">${displayName}</div>
        </div>
        <span class="item-kind">${item.type === "passive" ? "SEAL" : "ARTIFACT"}</span>
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
  const readyClass = canUseActive() && count > 0 && !state.pendingActive ? "artifact-panel-ready" : "";
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

function renderActiveItem(item, index) {
  const actionLocked = Boolean(state.pendingActive);
  const useDisabled = canUseActive() && !actionLocked ? "" : "disabled";
  const sellDisabled = actionLocked || arcadeActionLocked() ? "disabled" : "";
  const sale = Math.floor(item.price / 2);
  const description = itemDescription(item);
  const itemImage = renderArtifactIcon(item, "inventory-artifact-icon");
  return `
    <article class="item-card active ${itemImage ? "has-item-icon has-artifact-icon" : ""}" data-tooltip="${escapeAttr(description)}">
      ${itemImage}
      <div class="item-top">
        <div>
          <div class="item-name">${item.name}</div>
          <div class="price">Sell ${sale} SIN</div>
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
  for (let index = 0; index < passiveLimit(); index += 1) {
    const item = state.player.passives[index];
    if (!item) {
      slots.push(`<div class="passive-slot empty">Empty SEAL slot</div>`);
      continue;
    }
    const sale = Math.floor((item.price * (item.stack || 1)) / 2) + (item.saleBonus || 0);
    const displayName = passiveDisplayName(item);
    const description = itemDescription(item);
    const disabledNotice = sealSuppressionNotice(item.id);
    const tooltip = renderSealTooltipHtml(item, displayName, description, disabledNotice, sale);
    const triggeredClass = state.roundState?.triggeredPassiveIds?.has(item.id) ? "triggered" : "";
    const suppressedClass = isSealSuppressed(item.id) ? "suppressed" : "";
    const counterBadge = item.id === "p39" ? `<div class="passive-counter">Stacks ${item.counter || 0}</div>` : "";
    const sealImage = renderSealSigil(item, "equipped-seal-sigil");
    const sellDisabled = arcadeActionLocked() ? "disabled" : "";
    slots.push(`
      <article class="passive-slot ${triggeredClass} ${suppressedClass}" data-tooltip-html="${escapeAttr(tooltip)}">
        ${sealImage}
        ${counterBadge}
        <button class="small-button sell-button seal-sell-button" data-sell-passive="${index}" aria-label="Sell ${escapeAttr(displayName)}" ${sellDisabled}>Sell</button>
      </article>
    `);
  }

  return `<footer class="passive-bar" aria-label="SEALS">${slots.join("")}</footer>`;
}

function renderOverlay() {
  if (!state.gameOver || state.inspectingGameOver) return `<div class="overlay"></div>`;
  return `
    <div class="overlay visible">
      <section class="end-card">
        <h1 class="end-title">Game Over</h1>
        <p class="end-copy">You reached round ${state.round} with ${state.eliminations} eliminations.</p>
        <div class="end-actions">
          <button class="primary-button" id="inspectGame">Inspect</button>
          <button class="primary-button" id="restartGame">Restart</button>
        </div>
      </section>
    </div>
  `;
}

function renderPentakillPopup() {
  if (!state.roundState?.pentakillPopup) return "";
  return `<div class="pentakill-popup" aria-live="polite">PENTAKILL</div>`;
}

function showMainMenu(screen = "main") {
  pvpClearAutoTimer();
  pvpStopHostPolling();
  state.mode = "menu";
  state.menuScreen = screen;
  state.pauseOpen = false;
  state.mobileOfferingsOpen = false;
  render();
}

function handleMenuAction(action) {
  resumeSoundtrack();
  if (action === "play") {
    state.menuScreen = "play";
    render();
    return;
  }
  if (action === "options") {
    state.menuScreen = "options";
    render();
    return;
  }
  if (action === "back") {
    state.menuScreen = "main";
    render();
    return;
  }
  if (action === "arcade") {
    startGame();
    return;
  }
  if (action === "pvp") {
    startPvpMode();
    return;
  }
  if (action === "quit") {
    state.menuScreen = "quit";
    render();
    window.close();
  }
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
    startPvpMode();
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

function bindPvpEvents() {
  if (state.mode !== "pvp" || !state.pvp) return;

  const addLocal = document.querySelector("#pvpAddLocal");
  if (addLocal) {
    addLocal.addEventListener("click", () => {
      const input = document.querySelector("#pvpLocalName");
      pvpAddLocalPlayer(input?.value || "");
    });
  }

  const localName = document.querySelector("#pvpLocalName");
  if (localName) {
    localName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") pvpAddLocalPlayer(localName.value);
    });
  }

  const readyLobby = document.querySelector("#pvpReadyLobby");
  if (readyLobby) readyLobby.addEventListener("click", pvpFillBotsAndStart);

  const addSlot = document.querySelector("#pvpAddSlot");
  if (addSlot) addSlot.addEventListener("click", pvpAddEmptySlot);

  document.querySelectorAll("[data-pvp-remove-slot]").forEach((button) => {
    button.addEventListener("click", () => pvpRemoveLobbySlot(Number(button.dataset.pvpRemoveSlot)));
  });

  document.querySelectorAll("[data-pvp-save-guess]").forEach((button) => {
    button.addEventListener("click", () => {
      const slot = Number(button.dataset.pvpSaveGuess);
      const input = document.querySelector(`#pvpGuess-${slot}`);
      pvpSetLocalGuess(slot, input?.value);
    });
  });

  const revealTarget = document.querySelector("#pvpRevealTarget");
  if (revealTarget) revealTarget.addEventListener("click", pvpPrepareActivePhase);

  const waitToggle = document.querySelector("#pvpWaitToggle");
  if (waitToggle) waitToggle.addEventListener("click", pvpToggleWait);

  document.querySelectorAll("[data-pvp-active-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const [slotText, activeId] = button.dataset.pvpActiveChoice.split(":");
      const slot = Number(slotText);
      const select = document.querySelector(`[data-pvp-target-for="${slot}-${activeId}"]`);
      pvpSetActiveChoice(slot, activeId, select?.value || null);
    });
  });

  const resolveActives = document.querySelector("#pvpResolveActives");
  if (resolveActives) {
    resolveActives.addEventListener("click", () => {
      playReadySfx();
      pvpResolveActives();
    });
  }

  const nextRound = document.querySelector("#pvpNextRound");
  if (nextRound) {
    nextRound.addEventListener("click", () => {
      playNextRoundSfx();
      pvpNextRound();
    });
  }

  const restart = document.querySelector("#pvpRestart");
  if (restart) restart.addEventListener("click", restartPvpMode);
}

function bindEvents() {
  document.querySelectorAll("[data-menu-action]").forEach((button) => {
    button.addEventListener("click", () => handleMenuAction(button.dataset.menuAction));
  });

  document.querySelectorAll("[data-sound-setting]").forEach((control) => {
    const key = control.dataset.soundSetting;
    if (key === "muted") {
      control.addEventListener("change", () => updateSoundSetting(key, control.checked));
      return;
    }
    control.addEventListener("input", () => {
      updateSoundSetting(key, control.value, false);
      document.querySelectorAll(`[data-sound-value="${key}"]`).forEach((valueLabel) => {
        valueLabel.textContent = `${control.value}%`;
      });
    });
  });

  const pauseButton = document.querySelector("#pauseButton");
  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      state.pauseOpen = true;
      render();
    });
  }

  const playtestMoney = document.querySelector("#playtestMoney");
  if (playtestMoney) playtestMoney.addEventListener("click", togglePlaytestMoneyMode);

  const skipProgression = document.querySelector("#skipProgression");
  if (skipProgression) skipProgression.addEventListener("click", skipArcadeProgression);

  const mobileOfferingsToggle = document.querySelector("#mobileOfferingsToggle");
  if (mobileOfferingsToggle) {
    mobileOfferingsToggle.addEventListener("click", () => {
      state.mobileOfferingsOpen = true;
      render();
    });
  }

  const mobileOfferingsClose = document.querySelector("#mobileOfferingsClose");
  if (mobileOfferingsClose) {
    mobileOfferingsClose.addEventListener("click", () => {
      state.mobileOfferingsOpen = false;
      render();
    });
  }

  const mobileOfferingsBackdrop = document.querySelector("#mobileOfferingsBackdrop");
  if (mobileOfferingsBackdrop) {
    mobileOfferingsBackdrop.addEventListener("click", () => {
      state.mobileOfferingsOpen = false;
      render();
    });
  }

  document.querySelectorAll("[data-pause-action]").forEach((button) => {
    button.addEventListener("click", () => handlePauseAction(button.dataset.pauseAction));
  });

  bindPvpEvents();

  const mainAction = document.querySelector("#mainAction");
  if (mainAction) {
    mainAction.addEventListener("click", performMainAction);
  }

  const guessInput = document.querySelector("#guessInput");
  if (guessInput) {
    guessInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        performMainAction();
      }
    });
  }

  document.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => buyShopItem(Number(button.dataset.buy)));
  });

  document.querySelectorAll("[data-sell-passive]").forEach((button) => {
    button.addEventListener("click", () => sellPassive(Number(button.dataset.sellPassive)));
  });

  document.querySelectorAll("[data-sell-active]").forEach((button) => {
    button.addEventListener("click", () => sellActive(Number(button.dataset.sellActive)));
  });

  document.querySelectorAll("[data-use-active]").forEach((button) => {
    button.addEventListener("click", () => useActive(Number(button.dataset.useActive)));
  });

  document.querySelectorAll("[data-active-prev]").forEach((button) => {
    button.addEventListener("click", () => moveActiveCarousel(-1));
  });

  document.querySelectorAll("[data-active-next]").forEach((button) => {
    button.addEventListener("click", () => moveActiveCarousel(1));
  });

  const cancelActive = document.querySelector("#cancelPendingActive");
  if (cancelActive) cancelActive.addEventListener("click", cancelPendingActive);

  const floatingTooltip = document.querySelector("#floatingTooltip");
  if (floatingTooltip) {
    document.querySelectorAll("[data-tooltip], [data-tooltip-html]").forEach((element) => {
      element.addEventListener("mouseenter", (event) => {
        if (element.dataset.tooltipHtml) {
          floatingTooltip.innerHTML = element.dataset.tooltipHtml;
        } else {
          floatingTooltip.innerHTML = descriptionHtml(element.dataset.tooltip);
        }
        floatingTooltip.classList.add("visible");
        positionFloatingTooltip(event, floatingTooltip);
      });
      element.addEventListener("mousemove", (event) => {
        positionFloatingTooltip(event, floatingTooltip);
      });
      element.addEventListener("mouseleave", () => {
        floatingTooltip.classList.remove("visible");
        floatingTooltip.innerHTML = "";
      });
    });
  }

  document.querySelectorAll("[data-pick-bot]").forEach((button) => {
    button.addEventListener("click", () => chooseBot(Number(button.dataset.pickBot)));
  });

  const rerollButton = document.querySelector("#rerollShop");
  if (rerollButton) rerollButton.addEventListener("click", rerollShopClick);

  const restartButton = document.querySelector("#restartGame");
  if (restartButton) restartButton.addEventListener("click", startGame);

  const inspectButton = document.querySelector("#inspectGame");
  if (inspectButton) {
    inspectButton.addEventListener("click", () => {
      state.inspectingGameOver = true;
      render();
    });
  }
}

window.addEventListener("resize", updateFullscreenLayoutClass);
document.addEventListener("fullscreenchange", updateFullscreenLayoutClass);

loadSoundSettings();
installSoundtrack();
installArcadeEnterShortcut();
updateFullscreenLayoutClass();
showMainMenu();
