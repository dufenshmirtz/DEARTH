"use strict";

const BASE_PASSIVE_LIMIT = 3;
const MAX_PASSIVE_LIMIT = 6;
const ACTIVE_LIMIT = 5;
const BOT_COUNT = 5;
const PLAYER_MAX_HP = 100;
const NON_BOSS_MEMORY_LIMIT = 13;
const ZEPAR_MEMORY_THRESHOLD = 10;
const BOT_MIN_HP = 20;
const BOT_MAX_HP = 60;
const STARTING_CREDITS = 8;
const BASE_TARGET_MODIFIER = 0.8;
const FINAL_BOSS_TARGET_MODIFIER = 0.666;
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
const SOUNDTRACK_SRC = "assets/audio/Zingaresca_1910_loop.ogg";
const SOUNDTRACK_VOLUME = 0.55;
const SEAL_PURCHASE_SFX_SRC = "assets/audio/dragon-studio-evil-laughter-353177.mp3";
const SEAL_PURCHASE_SFX_VOLUME = 0.055;
const GUESS_SFX_SRC = "assets/audio/Guess.mp3";
const READY_SFX_SRC = "assets/audio/Ready.mp3";
const GUESS_SFX_VOLUME = 0.9;
const READY_SFX_VOLUME = 0.2;
const MAIN_MENU_LOGO_SRC = "assets/ui/nterth-logo.png";
const MAIN_MENU_JESUS_SRC = "assets/ui/jesus.png";
const MAIN_MENU_DEVIL_SRC = "assets/ui/satanikois.png";
const FINAL_BOSS_JESUS_SRC = "assets/bots/final-bosses/jesusboss.png";
const FINAL_BOSS_SATAN_SRC = "assets/bots/final-bosses/satanboss.png";
const SHOP_ELITE_CHANCE = 0.2;
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
    description: "If it casts, change the final target by +5.",
    needsTarget: false
  },
  {
    id: "sink",
    name: "John Dee's Obsidian Mirror",
    description: "If it casts, change the final target by -5.",
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
    description: "If it casts, deal 5 damage to every player tied closest to the first target.",
    needsTarget: false
  },
  {
    id: "jam",
    name: "Null Vote",
    description: "If it casts, pick a player whose guess does not count for the final target.",
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
    description: "New non-boss SINNERS arrive with 5 memory. At end of round, each SINNER takes 1 damage per memory. ELITE doubles the damage each level."
  },
  p2: {
    id: "p2",
    type: "passive",
    name: "Seal of Paimon",
    price: 6,
    description: "If your final guess is within +/-5 of the target, all SINNERS take 10 damage. ELITE doubles the damage each level."
  },
  p3: {
    id: "p3",
    type: "passive",
    name: "Seal of Alloces",
    price: 7,
    description: "If the rounded target is a multiple of 3, all SINNERS take 20 extra damage. ELITE doubles the damage each level."
  },
  p4: {
    id: "p4",
    type: "passive",
    name: "Seal of Andras",
    price: 12,
    description: "If your final effective guess is 0, 50, or 100, SINNER penalty damage is doubled this round."
  },
  p5: {
    id: "p5",
    type: "passive",
    name: "Seal of Haures",
    price: 9,
    description: "Whenever you take damage, all SINNERS take the same amount of extra damage. ELITE doubles the echoed damage each level."
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
    description: "Heal 5 health at the end of every round. ELITE adds SIN instead of more healing."
  },
  p9: {
    id: "p9",
    type: "passive",
    name: "Seal of Marbas",
    price: 14,
    description: "Every sinner elimination heals you for 3 health. ELITE adds SIN instead of more healing."
  },
  p11: {
    id: "p11",
    type: "passive",
    name: "Seal of Valefor",
    price: 7,
    description: "When a SINNER dies, gain a random Artifact if you have room. Lottery Artifacts keep their normal sell value."
  },
  p12: {
    id: "p12",
    type: "passive",
    name: "Seal of Belial",
    price: 11,
    description: "At end of round, for every 10 SIN you have, deal 2 damage to every SINNER. ELITE doubles the damage each level."
  },
  p13: {
    id: "p13",
    type: "passive",
    name: "Seal of Bune",
    price: 14,
    description: "If you make more than one elimination in a round, heal 5 and gain 5 SIN. ELITE adds SIN instead of more healing."
  },
  p14: {
    id: "p14",
    type: "passive",
    name: "Seal of Leraje",
    price: 8,
    description: "At the start of each round, deal 20 damage to a random SINNER. If this kills, heal 5. ELITE doubles the damage each level, while healing stays fixed."
  },
  p15: {
    id: "p15",
    type: "passive",
    name: "Seal of Bathin",
    price: 8,
    description: "Whenever memory is added to a SINNER, each memory has a 50% chance to heal you for 1 health. ELITE adds SIN instead of more healing."
  },
  p16: {
    id: "p16",
    type: "passive",
    name: "Seal of Bael",
    price: 10,
    description: "Your guess counts five times when calculating the target average."
  },
  p17: {
    id: "p17",
    type: "passive",
    name: "Seal of Dantalion",
    price: 12,
    description: "At end of round, deal damage equal to the total memory of active SINNERS to one random SINNER. If any bosses are active, hit all bosses instead and exclude boss memory from the sum. ELITE doubles the damage each level."
  },
  p18: {
    id: "p18",
    type: "passive",
    name: "Seal of Berith",
    price: 8,
    description: "At end of round, this Seal's sell value increases by 3."
  },
  p19: {
    id: "p19",
    type: "passive",
    name: "Seal of Sabnock",
    price: 13,
    description: "Every time a SINNER dies, deal 5 damage to every other SINNER. ELITE doubles the damage each level."
  },
  p20: {
    id: "p20",
    type: "passive",
    name: "Seal of Haagenti",
    price: 11,
    description: "Devil's Offerings has one more Artifact slot. Whenever you use an Artifact, all SINNERS take damage equal to that Artifact's purchase cost. ELITE doubles the damage each level."
  },
  p23: {
    id: "p23",
    type: "passive",
    name: "Seal of Seere",
    price: 9,
    description: "New non-boss SINNERS have a 33% chance to spawn with +6 regular bounty."
  },
  p24: {
    id: "p24",
    type: "passive",
    name: "Seal of Orobas",
    price: 9,
    description: "You can use only one Artifact per round. All SINNERS pay 1.5x SIN when eliminated."
  },
  p25: {
    id: "p25",
    type: "passive",
    name: "Seal of Valac",
    price: 13,
    description: "Gain +2 Artifact uses per round and +2 Artifact inventory slots. Each ELITE level adds +2 more to both."
  },
  p26: {
    id: "p26",
    type: "passive",
    name: "Seal of Amdusias",
    price: 14,
    description: "Once per Artifact type each round, when you use two matching Artifacts, deal 30 damage to all SINNERS. ELITE doubles the damage each level."
  },
  p27: {
    id: "p27",
    type: "passive",
    name: "Seal of Zagan",
    price: 10,
    description: "Every Artifact used triggers one of three outcomes: heal 3, damage a random SINNER, or refund that Artifact's purchase cost. ELITE doubles the damage outcome and adds SIN instead of more healing."
  },
  p28: {
    id: "p28",
    type: "passive",
    name: "Seal of Ose",
    price: 15,
    description: "Copies a random Seal you own and keeps copying it. If that Seal is sold, Ose chooses another owned Seal. If no Seal is available, it waits for the next Seal you buy."
  },
  p29: {
    id: "p29",
    type: "passive",
    name: "Seal of Furfur",
    price: 10,
    description: "For every 2 SIN you spend in a round, deal 1 damage to the highest-health non-boss SINNER. ELITE doubles the damage each level."
  },
  p30: {
    id: "p30",
    type: "passive",
    name: "Seal of Andrealphus",
    price: 9,
    description: "Every time a SINNER is eliminated, deal 10 damage to the SINNER on its left and right. ELITE doubles the damage each level."
  },
  p31: {
    id: "p31",
    type: "passive",
    name: "Seal of Murmur",
    price: 10,
    description: "At end of round, two random SINNERS take damage equal to their regular bounty. ELITE doubles the damage each level."
  },
  p32: {
    id: "p32",
    type: "passive",
    name: "Seal of Foras",
    price: 11,
    description: "Every time a SINNER dies, all other SINNERS gain +1 or +2 regular bounty."
  },
  p33: {
    id: "p33",
    type: "passive",
    name: "Seal of Marchosias",
    price: 13,
    description: "Every time a SINNER is eliminated, all other SINNERS take damage equal to that SINNER's regular bounty. ELITE doubles the damage each level."
  },
  p34: {
    id: "p34",
    type: "passive",
    name: "Seal of Gremory",
    price: 12,
    description: "Whenever a SINNER with 6 or more regular bounty dies, heal 2 and gain 4 SIN. ELITE adds SIN instead of more healing."
  },
  p35: {
    id: "p35",
    type: "passive",
    name: "Seal of Forneus",
    price: 8,
    description: "At end of round, the two highest regular-bounty SINNERS gain +1 regular bounty. ELITE levels add +1 bounty."
  },
  p36: {
    id: "p36",
    type: "passive",
    name: "Seal of Asmoday",
    price: 15,
    description: "You deal 2x damage to non-bosses and get 1.5x regular bounty SIN. At end of round, all living non-bosses are erased without SIN or KO count."
  },
  p37: {
    id: "p37",
    type: "passive",
    name: "Seal of Malphas",
    price: 9,
    description: "When you take 4 or less total damage in a round, gain 4 SIN and heal 3. ELITE adds SIN instead of more healing."
  },
  p38: {
    id: "p38",
    type: "passive",
    name: "Seal of Astaroth",
    price: 12,
    description: "At the start of each round, mark a SINNER until round end. If the marked SINNER dies, its regular bounty payout becomes double bounty or 6 SIN, whichever is greater, and heals 5."
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
    description: "At end of round, deal half the total regular bounty of living SINNERS to every enemy. ELITE doubles the damage each level."
  },
  p43: {
    id: "p43",
    type: "passive",
    name: "Seal of Raum",
    price: 12,
    description: "Whenever a SINNER loses SIN, it takes 20 damage. At end of round, all SINNERS lose 1 SIN. ELITE doubles the damage each level."
  },
  p44: {
    id: "p44",
    type: "passive",
    name: "Seal of Andromalius",
    price: 13,
    description: "At end of round, any SINNER with 2 or less regular bounty is eliminated. Its SIN goes to the living SINNER with the highest regular bounty instead of paying you."
  },
  p45: {
    id: "p45",
    type: "passive",
    name: "Seal of Crocell",
    price: 9,
    description: "SINNERS with 3 or less regular bounty pay double regular bounty SIN when eliminated."
  },
  p46: {
    id: "p46",
    type: "passive",
    name: "Seal of Barbatos",
    price: 12,
    description: "SINNERS with 6 or more regular bounty take 1.5x damage."
  },
  p47: {
    id: "p47",
    type: "passive",
    name: "Seal of Ronove",
    price: 10,
    description: "At end of round, a SINNER loses half its regular bounty and you gain SIN equal to the amount lost."
  },
  p48: {
    id: "p48",
    type: "passive",
    name: "Seal of Cimejes",
    price: 14,
    description: "At start of round, double a random SINNER's regular bounty for 1 round. ELITE levels double one extra random SINNER."
  },
  p49: {
    id: "p49",
    type: "passive",
    name: "Seal of Phenex",
    price: 10,
    description: "Using an Artifact that targets one or more SINNERS increases those SINNERS' regular bounty by 4."
  },
  p50: {
    id: "p50",
    type: "passive",
    name: "Seal of Agares",
    price: 9,
    description: "At end of round, 10% of SIN earned this round spreads among SINNERS, prioritizing highest regular bounties. Whenever a SINNER gains SIN, they take 5 damage per SIN. ELITE doubles the damage each level."
  },
  p51: {
    id: "p51",
    type: "passive",
    name: "Seal of Marax",
    price: 11,
    description: "Once each round per SINNER, when that SINNER has taken more than 40 damage, its regular bounty increases by 4."
  },
  p52: {
    id: "p52",
    type: "passive",
    name: "Seal of Decarabia",
    price: 12,
    description: "SINNERS take 10% more damage for every memory they have. Bosses take 3% more damage per memory instead."
  },
  p53: {
    id: "p53",
    type: "passive",
    name: "Seal of Samigina",
    price: 10,
    description: "When a non-boss SINNER is eliminated, gain bonus SIN equal to its memory."
  },
  p54: {
    id: "p54",
    type: "passive",
    name: "Seal of Zepar",
    price: 13,
    description: "At end of round, living SINNERS gain 2 memory instead of 1. Non-boss SINNERS with 10 or more memory are eliminated."
  },
  a28: {
    id: "a28",
    type: "active",
    name: "Demon Bowl - Incantation Bowl",
    price: 4,
    description: "One use. Pick a non-boss bot. It gains 6 memory, 6 SIN, and 6 max health."
  },
  a14: {
    id: "a14",
    type: "active",
    name: "The Blasting Rod",
    price: 4,
    description: "One use. During reveal, reduce the target by 10."
  },
  a15: {
    id: "a15",
    type: "active",
    name: "The Magical Sword of Solomon",
    price: 4,
    description: "One use. Pick a target. Deal 20% max-health damage to non-boss bots, or 10% to bosses."
  },
  a6: {
    id: "a6",
    type: "active",
    name: "The Tablet of Destinies",
    price: 4,
    description: "One use. During reveal, add 20 to the target."
  },
  a7: {
    id: "a7",
    type: "active",
    name: "The Ring of Gyges",
    price: 6,
    description: "One use. Pick a non-boss bot and swap your effective guess with theirs."
  },
  a8: {
    id: "a8",
    type: "active",
    name: "The Ring of Solomon",
    price: 3,
    description: "One use. Pick a bot; their guess counts five times for the target average."
  },
  a9: {
    id: "a9",
    type: "active",
    name: "The Key of the Bottomless Pit",
    price: 3,
    description: "One use. Pick a bot; remove their guess from the target average, though they still take damage."
  },
  a10: {
    id: "a10",
    type: "active",
    name: "The Thirty Pieces of Silver",
    price: 6,
    description: "One use. Doubles SIN gained for this round. Multiple uses stack multiplicatively."
  },
  a11: {
    id: "a11",
    type: "active",
    name: "Witch Bottle",
    price: 4,
    description: "Heal 20. There is a 33% chance the next elimination spawns a boss."
  },
  a12: {
    id: "a12",
    type: "active",
    name: "The Philosopher's Stone",
    price: 2,
    description: "You take 50% less damage this round, including CRITICAL damage."
  },
  a13: {
    id: "a13",
    type: "active",
    name: "The White-Hilted Knife",
    price: 4,
    description: "One use. Deal 20 non-lethal damage to one bot, then heal another already-damaged bot for 20."
  },
  a16: {
    id: "a16",
    type: "active",
    name: "Dr Dee's Gold Disc",
    price: 4,
    description: "One use. Gain a random 3 to 9 SIN."
  },
  a17: {
    id: "a17",
    type: "active",
    name: "Defixio",
    price: 4,
    description: "Reserved for a future Artifact."
  },
  a18: {
    id: "a18",
    type: "active",
    name: "The Emerald Tablet",
    price: 4,
    description: "One use. Add a copy of a random other Artifact in your inventory."
  },
  a24: {
    id: "a24",
    type: "active",
    name: "Dr Dee's Crystal",
    price: 4,
    description: "Reserved for a future Artifact."
  },
  a21: {
    id: "a21",
    type: "active",
    name: "Amulet of Pazuzu",
    price: 4,
    description: "One use. This round, bots take double the damage you take."
  },
  a22: {
    id: "a22",
    type: "active",
    name: "The Necklace of Harmonia",
    price: 4,
    description: "One use. 10% take 20 damage, 20% take 10 damage, 30% gain 6 SIN, 20% gain 12 SIN, 10% gain 15 SIN and deal 20 damage to each bot. The remaining 10% fizzles."
  },
  a23: {
    id: "a23",
    type: "active",
    name: "The Hand of Glory",
    price: 3,
    description: "Arm the next Devil's Offerings reroll: the Seal slot has a 50% ELITE chance."
  },
  a25: {
    id: "a25",
    type: "active",
    name: "The Brazen Vessel of Solomon",
    price: 4,
    description: "One use. Pick a bot, heal it to full, and increase its bounty by 9."
  },
  a26: {
    id: "a26",
    type: "active",
    name: "Grandier's Pact",
    price: 3,
    description: "One use. Drain up to 5 bounty from one bot, then give the removed bounty to another bot."
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
  "p8",
  "p9",
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
  "p23",
  "p24",
  "p25",
  "p26",
  "p27",
  "p28",
  "p29",
  "p30",
  "p31",
  "p32",
  "p33",
  "p34",
  "p35",
  "p36",
  "p37",
  "p38",
  "p39",
  "p40",
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
  "p54"
];
const REMOVED_PASSIVE_IDS = new Set(["p21", "p41", "p42"]);
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
  "a26",
  "a28"
];
const RESERVED_ARTIFACT_IDS = ["a13", "a16", "a17", "a24", "a27"];
const ARTIFACT_ICONS = {
  a6: "a6.png",
  a7: "a7.png",
  a8: "a8.png",
  a9: "a9.png",
  a10: "a10.png",
  a11: "a11.png",
  a12: "a12.png",
  a13: "a13.png",
  a14: "a14.png",
  a15: "a15.png",
  a16: "a16.png",
  a17: "a17.png",
  a18: "a18.png",
  a21: "a21.png",
  a22: "a22.png",
  a23: "a23.png",
  a24: "a24.png",
  a25: "a25.png",
  a26: "a26.png",
  a27: "occult-new-9/bath-curse-tablets.png",
  a28: "occult-new-9/demon-bowl-incantation-bowl.png"
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
  p54: "072_Zepar.png"
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
  p54: "16-zepar.png"
};
const GOETIC_BOSS_SPECS = [
  { key: "bael", name: "Bael", image: "01-bael.png", passiveId: "p16" },
  { key: "agares", name: "Agares", image: "02-agares.png", passiveId: "p50" },
  { key: "vassago", name: "Vassago", image: "03-vassago.png", passiveId: "p1" },
  { key: "samigina", name: "Samigina", image: "04-samigina-gamigin.png", passiveId: "p53" },
  { key: "marbas", name: "Marbas", image: "05-marbas.png", passiveId: "p9" },
  { key: "valefor", name: "Valefor", image: "06-valefor.png", passiveId: "p11" },
  { key: "amon", name: "Amon", image: "07-amon.png" },
  { key: "barbatos", name: "Barbatos", image: "08-barbatos.png", passiveId: "p46" },
  { key: "paimon", name: "Paimon", image: "09-paimon.png", passiveId: "p2" },
  { key: "buer", name: "Buer", image: "10-buer.png", passiveId: "p8" },
  { key: "gusion", name: "Gusion", image: "11-gusion.png" },
  { key: "sitri", name: "Sitri", image: "12-sitri.png" },
  { key: "beleth", name: "Beleth", image: "13-beleth.png" },
  { key: "leraje", name: "Leraje", image: "14-leraje.png", passiveId: "p14" },
  { key: "eligos", name: "Eligos", image: "15-eligos.png" },
  { key: "zepar", name: "Zepar", image: "16-zepar.png", passiveId: "p54" },
  { key: "botis", name: "Botis", image: "17-botis.png" },
  { key: "bathin", name: "Bathin", image: "18-bathin.png", passiveId: "p15" },
  { key: "sallos", name: "Sallos", image: "19-sallos.png" },
  { key: "purson", name: "Purson", image: "20-purson.png", passiveId: "p39" },
  { key: "marax", name: "Marax", image: "21-marax-morax.png", passiveId: "p51" },
  { key: "ipos", name: "Ipos", image: "22-ipos.png" },
  { key: "aim", name: "Aim", image: "23-aim-haborym.png" },
  { key: "naberius", name: "Naberius", image: "24-naberius.png" },
  { key: "glasya-labolas", name: "Glasya-Labolas", image: "25-glasya-labolas.png", passiveId: "p7" },
  { key: "bune", name: "Bune", image: "26-bune-bime.png", passiveId: "p13" },
  { key: "ronove", name: "Ronove", image: "27-ronove.png", passiveId: "p47" },
  { key: "berith", name: "Berith", image: "28-berith.png", passiveId: "p18" },
  { key: "astaroth", name: "Astaroth", image: "29-astaroth.png", passiveId: "p38" },
  { key: "forneus", name: "Forneus", image: "30-forneus.png", passiveId: "p35" },
  { key: "foras", name: "Foras", image: "31-foras.png", passiveId: "p32" },
  { key: "asmoday", name: "Asmoday", image: "32-asmoday.png", passiveId: "p36" },
  { key: "gaap", name: "Gaap", image: "33-gaap.png" },
  { key: "furfur", name: "Furfur", image: "34-furfur.png", passiveId: "p29" },
  { key: "marchosias", name: "Marchosias", image: "35-marchosias.png", passiveId: "p33" },
  { key: "stolas", name: "Stolas", image: "36-stolas.png", passiveId: "p42" },
  { key: "phenex", name: "Phenex", image: "37-phenex-phoenix.png", passiveId: "p49" },
  { key: "halphas", name: "Halphas", image: "38-halphas.png" },
  { key: "malphas", name: "Malphas", image: "39-malphas.png", passiveId: "p37" },
  { key: "raum", name: "Raum", image: "40-raum.png", passiveId: "p43" },
  { key: "focalor", name: "Focalor", image: "41-focalor.png", passiveId: "p40" },
  { key: "vepar", name: "Vepar", image: "42-vepar.png" },
  { key: "sabnock", name: "Sabnock", image: "43-sabnock.png", passiveId: "p19" },
  { key: "shax", name: "Shax", image: "44-shax.png", passiveId: "p21" },
  { key: "vine", name: "Vine", image: "45-vine.png" },
  { key: "bifrons", name: "Bifrons", image: "46-bifrons.png", passiveId: "p41" },
  { key: "vual", name: "Vual", image: "47-vual-uvall.png" },
  { key: "haagenti", name: "Haagenti", image: "48-haagenti.png", passiveId: "p20" },
  { key: "crocell", name: "Crocell", image: "49-crocell.png", passiveId: "p45" },
  { key: "furcas", name: "Furcas", image: "50-furcas.png" },
  { key: "balam", name: "Balam", image: "51-balam.png" },
  { key: "alloces", name: "Alloces", image: "52-alloces.png", passiveId: "p3" },
  { key: "caim", name: "Caim", image: "53-caim-camio.png" },
  { key: "murmur", name: "Murmur", image: "54-murmur.png", passiveId: "p31" },
  { key: "orobas", name: "Orobas", image: "55-orobas.png", passiveId: "p24" },
  { key: "gremory", name: "Gremory", image: "56-gremory-gamori.png", passiveId: "p34" },
  { key: "ose", name: "Ose", image: "57-ose.png", passiveId: "p28" },
  { key: "amy", name: "Amy", image: "58-amy-avnas.png" },
  { key: "orias", name: "Orias", image: "59-orias.png", passiveId: "p6" },
  { key: "vapula", name: "Vapula", image: "60-vapula-naphula.png" },
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
    description: "This boss Seal heals 5 health at the end of every round."
  },
  fumes: {
    name: "Seal of Amon",
    description: "While this boss Seal is alive, you take 2 damage at the end of every round."
  },
  thief: {
    name: "Seal of Raum",
    description: "While this boss Seal is alive, you lose 1 SIN at the end of every round."
  },
  spite: {
    name: "Seal of Botis",
    description: "While this boss Seal is alive, every time you use an Artifact, you take 3 damage."
  },
  wideCrit: {
    name: "Seal of Ipos",
    description: "This boss Seal hits CRITICAL within 2 of the right integer and deals damage only to you."
  },
  shield: {
    name: "Seal of Halphas",
    description: "This boss Seal cannot be picked or targeted by Artifacts, and its guess cannot be revealed."
  },
  lamb: {
    name: "Seal of Sallos",
    description: "When this boss Seal dies, all other bots gain 10 health."
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
      "Devil's Offerings prices cost +3 SIN for Artifacts and +6 SIN for Seals while Zilon is alive.",
      "The target modifier becomes 1.5 while Zilon is alive."
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
      "The target modifier becomes 0.5 while Dantre is alive."
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
      "At the start of every round, one bot receives a new random boss-variant Seal while Pyros is alive.",
      "The target modifier becomes 1.0 while Pyros is alive."
    ]
  },
  threon: {
    key: "threon",
    name: "Threon",
    image: "assets/bots/occult-stickmen-pack/boss-threon.png",
    personality: "Drifter",
    descriptions: [
      "Each round, Threon applies a hidden mystery target modifier from 0.7 to 1.3.",
      "Every Artifact you use has a 50% chance to malfunction, do nothing, and deal 5 damage to you."
    ]
  }
};
const UNIQUE_BOSS_KEYS = Object.keys(UNIQUE_BOSS_SPECS);

const FINAL_BOSS_SPECS = {
  jesus: {
    key: "jesus",
    name: "Jesus",
    image: FINAL_BOSS_JESUS_SRC,
    color: "#d64f45",
    personality: "Analyst",
    descriptions: [
      "Jesus has infinite health. Damage dealt to him is counted instead of reducing HP.",
      "Jesus's guess counts three times when calculating the target average."
    ]
  },
  satan: {
    key: "satan",
    name: "Satan",
    image: FINAL_BOSS_SATAN_SRC,
    color: "#d64f45",
    personality: "Caller",
    descriptions: [
      "Satan has infinite health. Damage dealt to him is counted instead of reducing HP.",
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
  finalBossPhase: false,
  finalBossQueued: false,
  bossQueued: false,
  eliteBoostedNextReroll: false,
  pendingActive: null,
  playtestInfiniteMoney: false,
  gameOver: false,
  pvp: null
};

let pvpPollTimer = null;
let pvpAutoTimer = null;
let soundtrackAudio = null;
let sealPurchaseSfx = null;
let guessSfx = null;
let readySfx = null;

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
}

function ensureSoundtrack() {
  if (soundtrackAudio) return soundtrackAudio;
  soundtrackAudio = new Audio(SOUNDTRACK_SRC);
  soundtrackAudio.loop = true;
  soundtrackAudio.preload = "auto";
  soundtrackAudio.volume = musicVolume();
  return soundtrackAudio;
}

function playSoundtrack() {
  const audio = ensureSoundtrack();
  audio.play().catch(() => {});
}

function unlockSoundtrack() {
  playSoundtrack();
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
  return sealPurchaseSfx;
}

function ensureButtonSfx(kind) {
  if (kind === "guess") {
    if (!guessSfx) {
      guessSfx = new Audio(GUESS_SFX_SRC);
      guessSfx.preload = "auto";
      guessSfx.volume = sfxVolume(GUESS_SFX_VOLUME);
    }
    return guessSfx;
  }

  if (!readySfx) {
    readySfx = new Audio(READY_SFX_SRC);
    readySfx.preload = "auto";
    readySfx.volume = sfxVolume(READY_SFX_VOLUME);
  }
  return readySfx;
}

function playOneShot(audio) {
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (error) {}
}

function playSealPurchaseSfx() {
  playOneShot(ensureSealPurchaseSfx());
}

function playGuessSfx() {
  playOneShot(ensureButtonSfx("guess"));
}

function playReadySfx() {
  playOneShot(ensureButtonSfx("ready"));
}

function installSoundtrack() {
  ensureSoundtrack();
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

function hasPassive(id) {
  return passiveStack(id) > 0;
}

function passiveEntry(id) {
  return state.player.passives.find((item) => item.id === id) || null;
}

function directPassiveStack(id) {
  return passiveEntry(id)?.stack || 0;
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

function isSealSuppressed(id) {
  return Boolean(suppressingBossForSeal(id));
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

function botBossBounty(bot) {
  if (!bot?.isBoss || bot?.immortal) return 0;
  return Math.max(0, Math.ceil(10 + state.bossKills * 5));
}

function botRegularBounty(bot) {
  if (bot?.immortal) return 0;
  return Math.max(0, Math.ceil(bot?.reward || 0));
}

function botRegularBountyPayout(bot) {
  if (!bot || bot.immortal) return 0;
  const baseReward = botRegularBounty(bot);
  const contractMultiplier = hasPassive("p36") ? 1.5 * passivePower("p36") : 1;
  const lowSinMultiplier = botHasLowSin(bot, 3) && passiveStack("p45") ? 2 * passivePower("p45") : 1;
  return Math.ceil(baseReward * contractMultiplier * bountyOathMultiplier() * lowSinMultiplier);
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
    let heals = 0;
    for (let index = 0; index < memoriesAdded; index += 1) {
      if (Math.random() < 0.5) heals += 1;
    }
    if (!heals) return;
    markPassiveEntryTriggered(entry);
    healPlayer(heals, `Seal of Bathin healed you from ${bot.name}'s memory growth.`, "Seal of Bathin");
    const creditBonus = passiveEntryHealEliteCredits(entry, 1) * heals;
    if (!creditBonus) return;
    const gained = gainCredits(creditBonus, true, "Seal of Bathin ELITE");
    addRoundEvent(`Seal of Bathin ELITE converted memory healing into ${gained} SIN.`);
  });
}

function addBotMemory(bot, count, reason = "") {
  if (!bot || bot.eliminated || count <= 0) return 0;
  const added = Math.ceil(count);
  const entry = memoryEntryForBot(bot);
  for (let index = 0; index < added; index += 1) {
    bot.memory.push({ ...entry });
  }
  if (!bot.isBoss) bot.memory = bot.memory.slice(-NON_BOSS_MEMORY_LIMIT);
  applyMemoryAddedHealing(bot, added);
  if (reason) state.roundState?.roundEvents.push(reason);
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
  if (gained > 0 && options.triggerGainDamage !== false) {
    applyBotSinGainDamage(bot, gained);
  }
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
  const entries = orderedPassiveEffectEntries("p49");
  const uniqueTargets = Array.from(new Set((targets || []).filter((bot) => bot && !bot.eliminated)));
  if (!item || !entries.length || !uniqueTargets.length) return;
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

function slowRepairHeal(idOrItem) {
  return passiveBaseHeal(idOrItem, 5);
}

function victoryPatchHeal(idOrItem) {
  return passiveBaseHeal(idOrItem, 3);
}

function sweepDividendHeal(idOrItem) {
  return passiveBaseHeal(idOrItem, 5);
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

function reactiveWarrantyHeal(idOrItem) {
  return passiveBaseHeal(idOrItem, 3);
}

function reactiveWarrantyDamage(idOrItem) {
  return flatDamageValue(idOrItem, 10);
}

function tripleBallotWeight(idOrItem) {
  const stack = simpleStackCount(idOrItem);
  return stack ? 5 + (stack - 1) * 2 : 1;
}

function passiveBaseHeal(idOrItem, baseHeal) {
  return simpleStackCount(idOrItem) ? Math.ceil(baseHeal) : 0;
}

function passiveHealEliteCredits(idOrItem, baseHeal) {
  const levels = eliteLevels(idOrItem);
  return levels ? Math.ceil(baseHeal / 5) * levels : 0;
}

function passiveHealCreditText(idOrItem, baseHeal) {
  const credits = passiveHealEliteCredits(idOrItem, baseHeal);
  return credits ? ` ELITE adds ${credits} SIN when this heal triggers.` : "";
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

function passiveEntryHealEliteCredits(entry, baseHeal) {
  const levels = Math.max(0, (entry?.stack || 0) - 1);
  return levels ? Math.ceil(baseHeal / 5) * levels : 0;
}

function markPassiveEntryTriggered(entry) {
  if (!state.roundState || !entry) return;
  state.roundState.triggeredPassiveIds.add(entry.sourceId || entry.id);
}

function nonBossDamageMultiplier(bot, playerDealt = true) {
  return playerDealt && bot && !bot.isBoss && hasPassive("p36") ? 2 * passivePower("p36") : 1;
}

function scaledBotDamage(bot, amount, playerDealt = true) {
  const damage = Math.max(0, Math.ceil(amount));
  if (!damage) return 0;
  let multiplier = nonBossDamageMultiplier(bot, playerDealt);
  if (multiplier > 1) markPassiveTriggered("p36");

  if (bot && botSin(bot) >= 6 && passiveStack("p46")) {
    multiplier *= 1.5 * passivePower("p46");
    markPassiveTriggered("p46");
  }

  if (bot && bot.memory?.length && passiveStack("p52")) {
    const memoryDamageRate = bot.isBoss ? 0.03 : 0.1;
    multiplier *= 1 + bot.memory.length * memoryDamageRate * passivePower("p52");
    markPassiveTriggered("p52");
  }

  return Math.ceil(damage * multiplier);
}

function highestHealthNonBossBot() {
  return activeBots()
    .filter((bot) => !bot.isBoss)
    .sort((left, right) => right.hp - left.hp || right.maxHp - left.maxHp || left.id - right.id)[0];
}

function applyPassivePlayerHeal(id, baseHeal, reason) {
  const heal = passiveBaseHeal(id, baseHeal);
  if (!heal || state.player.hp <= 0) return { healed: 0, credits: 0 };
  const healed = healPlayer(heal, reason);
  const creditBonus = passiveHealEliteCredits(id, baseHeal);
  if (!creditBonus) return { healed, credits: 0 };
  const gained = gainCredits(creditBonus, true, `${reason} ELITE`);
  addRoundEvent(`${reason} ELITE converted healing into ${gained} SIN.`);
  return { healed, credits: gained };
}

function applyPassivePlayerHealForEntry(entry, baseHeal, reason) {
  if (!entry?.stack || state.player.hp <= 0) return { healed: 0, credits: 0 };
  const healed = healPlayer(baseHeal, reason);
  const creditBonus = passiveEntryHealEliteCredits(entry, baseHeal);
  if (!creditBonus) return { healed, credits: 0 };
  const gained = gainCredits(creditBonus, true, `${reason} ELITE`);
  addRoundEvent(`${reason} ELITE converted healing into ${gained} SIN.`);
  return { healed, credits: gained };
}

function itemDescription(item) {
  if (!item || item.type !== "passive") return (item?.description || "").replace(/^One use\.\s*/i, "");
  const stack = item.stack || 1;
  if (item.id === "p28") {
    const target = mimicTargetEntry();
    if (!target) return "Copies a random Seal you own. If no Seal is available, it waits for the next Seal you buy.";
    const copiedVersion = passiveDisplayName({ ...target, stack });
    return `Copies ${target.name} as ${copiedVersion}. If the copied Seal is sold, Ose chooses another owned Seal.`;
  }
  if (item.id === "p39") return `Seal of Purson stacks: ${item.counter || 0}. Rounds without buying from Devil's Offerings add 1 stack. Buying an offering resets stacks. End of round pays ${Math.ceil((item.counter || 0) * passivePower(item))} SIN.`;
  if (stack <= 1) return item.description;
  if (item.id === "p1") return `New non-boss SINNERS arrive with 5 memory. At end of round, each SINNER takes ${flatDamageValue(item, 1)} damage per memory.`;
  if (item.id === "p2") {
    return `If your final guess is within +/-5 of the target, all SINNERS take ${flatDamageValue(item, 10)} damage.`;
  }
  if (item.id === "p3") return `If the rounded target is a multiple of 3, all SINNERS take ${divisibleVerdictDamage(item)} extra damage.`;
  if (item.id === "p4") return `If your final effective guess is 0, 50, or 100, SINNER penalty damage is x${edgeGambitMultiplier(item).toFixed(2)} this round.`;
  if (item.id === "p5") return `Whenever you take damage, all SINNERS take ${flatDamagePower(item)}x that damage as extra damage.`;
  if (item.id === "p6") return `Your CRITICAL hit triggers within ${criticalCalipersWindow(item)} of the right integer.`;
  if (item.id === "p7") return `When you hit CRITICAL, it deals ${pressureSpikeDamage(item)} damage to everyone else.`;
  if (item.id === "p8") return `Heal ${slowRepairHeal(item)} health at the end of every round.${passiveHealCreditText(item, 5)}`;
  if (item.id === "p9") return `Every SINNER elimination heals you for ${victoryPatchHeal(item)} health.${passiveHealCreditText(item, 3)}`;
  if (item.id === "p11") {
    return `When a SINNER dies, gain ${stack} random Artifact${stack === 1 ? "" : "s"} if you have room. Lottery Artifacts keep their normal sell value.`;
  }
  if (item.id === "p12") return `At end of round, for every 10 SIN you have, deal ${flatDamageValue(item, 2)} damage to every SINNER.`;
  if (item.id === "p13") return `If you make more than one elimination in a round, heal ${sweepDividendHeal(item)} and gain ${sweepDividendCredits(item)} SIN.${passiveHealCreditText(item, 5)}`;
  if (item.id === "p14") {
    return `At the start of each round, deal ${flatDamageValue(item, 20)} damage to a random SINNER. If this kills, heal ${passiveBaseHeal(item, 5)}.${passiveHealCreditText(item, 5)}`;
  }
  if (item.id === "p15") return `Whenever memory is added to a SINNER, each memory has a 50% chance to heal you for 1.${passiveHealCreditText(item, 1)}`;
  if (item.id === "p16") return `Your guess has x${tripleBallotWeight(item)} weight when calculating the target average.`;
  if (item.id === "p17") {
    return `At end of round, deal ${flatDamagePower(item)}x the total active memory to one random SINNER. If bosses are active, hit all bosses instead and exclude boss memory from the sum.`;
  }
  if (item.id === "p18") return `At end of round, this Seal's sell value increases by ${scaledPassiveValueForItem(item, 3)}.`;
  if (item.id === "p19") return `Every time a SINNER dies, deal ${flatDamageValue(item, 5)} damage to every other SINNER.`;
  if (item.id === "p20") return `Devil's Offerings has ${shopSlotCountForItem(item)} slots. Whenever you use an Artifact, all SINNERS take ${flatDamagePower(item)}x that Artifact's purchase cost as damage.`;
  if (item.id === "p21") return "This Seal is reserved and is not currently obtainable.";
  if (item.id === "p23") return `New non-boss SINNERS have a ${Math.min(100, Math.round(33 * passivePower(item)))}% chance to spawn with +6 regular bounty.`;
  if (item.id === "p24") return `You can use only one Artifact per round. All SINNERS pay ${bountyOathMultiplierForItem(item).toFixed(1)}x SIN when eliminated.`;
  if (item.id === "p25") return `Gain +${baseEditionBonus(item)} Artifact uses per round and +${baseEditionBonus(item)} Artifact inventory slots.`;
  if (item.id === "p26") return `Using two matching Artifacts in a round deals ${twinDetonatorDamage(item)} damage to all SINNERS.`;
  if (item.id === "p27") return `Every Artifact triggers one outcome: heal ${reactiveWarrantyHeal(item)}, deal ${reactiveWarrantyDamage(item)} damage to a random SINNER, or refund its purchase cost.${passiveHealCreditText(item, 3)}`;
  if (item.id === "p29") return `For every 2 SIN spent this round, deal ${furfurDamage(item)} damage to the highest-health non-boss SINNER.`;
  if (item.id === "p30") return `Every SINNER elimination deals ${andrealphusDamage(item)} damage to the SINNER on its left and right.`;
  if (item.id === "p31") return `At end of round, two random SINNERS take ${flatDamagePower(item)}x their regular bounty as damage.`;
  if (item.id === "p32") return `Every SINNER death gives each other living SINNER +${Math.ceil(passivePower(item))} to +${Math.ceil(2 * passivePower(item))} regular bounty.`;
  if (item.id === "p33") return `Every SINNER elimination makes all other SINNERS take ${flatDamagePower(item)}x that SINNER's regular bounty as damage.`;
  if (item.id === "p34") return `When a SINNER with 6 or more regular bounty dies, heal ${passiveBaseHeal(item, 2)} and gain ${scaledPassiveValueForItem(item, 4)} SIN.${passiveHealCreditText(item, 2)}`;
  if (item.id === "p35") return `At end of round, the two highest regular-bounty SINNERS gain +${stack} regular bounty.`;
  if (item.id === "p36") return `Your damage is x${(2 * passivePower(item)).toFixed(1)} against non-bosses and regular bounty SIN is x${(1.5 * passivePower(item)).toFixed(1)}. At end of round, living non-bosses are erased without SIN or KO count.`;
  if (item.id === "p37") return `If you take 4 or less total damage in a round, gain ${scaledPassiveValueForItem(item, 4)} SIN and heal ${passiveBaseHeal(item, 3)}.${passiveHealCreditText(item, 3)}`;
  if (item.id === "p38") return `Start each round by marking a SINNER. If it dies, its regular bounty payout becomes at least ${scaledPassiveValueForItem(item, 6)} SIN or ${Math.round(200 * passivePower(item))}% bounty, and you heal ${passiveBaseHeal(item, 5)}.${passiveHealCreditText(item, 5)}`;
  if (item.id === "p40") return `At end of round, deal ${flatDamagePower(item)}x half the total regular bounty of living SINNERS to every enemy.`;
  if (item.id === "p41" || item.id === "p42") return "This Seal is reserved and is not currently obtainable.";
  if (item.id === "p43") return `Whenever a SINNER loses SIN, it takes ${flatDamageValue(item, 20)} damage. At end of round, all SINNERS lose 1 SIN.`;
  if (item.id === "p44") return `At end of round, SINNERS with 2 or less regular bounty are eliminated. Their SIN goes to the living SINNER with the highest regular bounty instead of paying you.`;
  if (item.id === "p45") return `SINNERS with 3 or less regular bounty pay ${Math.round(200 * passivePower(item))}% regular bounty SIN when eliminated.`;
  if (item.id === "p46") return `SINNERS with 6 or more regular bounty take ${(1.5 * passivePower(item)).toFixed(1)}x damage.`;
  if (item.id === "p47") return `At end of round, ${stack} SINNER${stack === 1 ? "" : "s"} lose half their regular bounty and you gain the amount lost.`;
  if (item.id === "p48") return `At start of round, double ${stack} random SINNER regular ${stack === 1 ? "bounty" : "bounties"} for 1 round.`;
  if (item.id === "p49") return `Using an Artifact that targets SINNERS gives each target +${scaledPassiveValueForItem(item, 4)} regular bounty.`;
  if (item.id === "p50") return `At end of round, 10% of SIN earned this round spreads among SINNERS, prioritizing highest regular bounties. Whenever a SINNER gains SIN, it takes ${agaresDamagePerSin(item)} damage per SIN.`;
  if (item.id === "p51") return `Once each round per SINNER, when that SINNER has taken more than 40 damage, it gains +${scaledPassiveValueForItem(item, 4)} regular bounty.`;
  if (item.id === "p52") {
    return `SINNERS take ${Math.round(10 * passivePower(item))}% more damage per memory. Bosses take ${Math.round(3 * passivePower(item))}% more damage per memory instead.`;
  }
  if (item.id === "p53") return `When a non-boss SINNER is eliminated, gain bonus SIN equal to ${Math.round(100 * passivePower(item))}% of its memory.`;
  if (item.id === "p54") return `At end of round, living SINNERS gain ${1 + stack} memory instead of 1. Non-boss SINNERS with ${ZEPAR_MEMORY_THRESHOLD} or more memory are eliminated.`;
  return item.description;
}

function markPassiveTriggered(id) {
  if (!state.roundState || !passiveStack(id)) return;
  if (directPassiveStack(id)) state.roundState.triggeredPassiveIds.add(id);
  if (mimicContributionFor(id)) state.roundState.triggeredPassiveIds.add("p28");
}

function passiveLimit() {
  let limit = BASE_PASSIVE_LIMIT;
  if (state.bossKills >= 2) limit += 1;
  if (state.bossKills >= 4) limit += 2;
  return Math.min(MAX_PASSIVE_LIMIT, limit);
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

function aliveUniqueBoss(key, excludedIds = new Set()) {
  return state.bots.some((bot) => bot.isBoss && bot.uniqueKey === key && !excludedIds.has(bot.id) && bot.hp > 0 && !bot.eliminated);
}

function aliveFinalBoss(key) {
  return state.bots.some((bot) => bot.finalKey === key && bot.hp > 0 && !bot.eliminated);
}

function shopDisabledBySatan() {
  return state.finalBossPhase && aliveFinalBoss("satan");
}

function currentTargetModifier() {
  if (state.finalBossPhase) return FINAL_BOSS_TARGET_MODIFIER;
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
  return item.type === "passive" ? Math.max(0, taxedPrice - passiveShopDiscount()) : taxedPrice;
}

function botPassiveSummary(bot) {
  if (!bot) return "";
  const names = [];
  if (bot.isBoss && bot.uniqueKey) names.push(`${UNIQUE_BOSS_SPECS[bot.uniqueKey].name}'s Seal`);
  if (bot.isBoss && bot.goeticPassiveId) names.push(`${bot.goeticSealName || ITEMS[bot.goeticPassiveId]?.name || "Seal"} Lock`);
  bot.passiveKeys?.forEach((key) => names.push(BOSS_PASSIVES[key].name));
  if (bot.buffPassiveKey) names.push(`Pyros Gift: ${BOSS_PASSIVES[bot.buffPassiveKey].name}`);
  return names.join(" + ") || "No Seal";
}

function botPassiveDescription(bot) {
  if (!bot) return "";
  const descriptions = [];
  if (bot.isBoss && bot.uniqueKey) descriptions.push(...UNIQUE_BOSS_SPECS[bot.uniqueKey].descriptions);
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
  state.log.unshift(message);
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
  if (state.roundState) state.roundState.roundEvents.push(message);
}

function sourceLabelFromReason(reason, fallback) {
  const text = String(reason || "").trim();
  if (!text) return fallback || "";
  const knownSources = [
    ["FINAL CRITICAL", "Final CRITICAL"],
    ["CRITICAL", "CRITICAL"],
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
    ["Seal of Belial", "Seal of Belial"],
    ["Seal of Dantalion", "Seal of Dantalion"],
    ["Seal of Sabnock", "Seal of Sabnock"],
    ["Seal of Bune", "Seal of Bune"],
    ["Seal of Marbas", "Seal of Marbas"],
    ["Seal of Buer", "Seal of Buer"],
    ["Seal of Bathin", "Seal of Bathin"],
    ["Seal of Amon", "Seal of Amon"],
    ["Seal of Raum", "Seal of Raum"],
    ["Seal of Ronove", "Seal of Ronove"],
    ["Seal of Andromalius", "Seal of Andromalius"],
    ["Seal of Botis", "Seal of Botis"],
    ["Seal of Ipos", "Seal of Ipos"],
    ["Seal of Halphas", "Seal of Halphas"],
    ["Seal of Sallos", "Seal of Sallos"],
    ["Seal of Sallos", "Seal of Sallos"],
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
    merged.set(source, (merged.get(source) || 0) + amount);
  });
  return Array.from(merged, ([source, amount]) => ({ source, amount }));
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
  const sign = kind === "damage" ? "-" : "+";
  const unit = kind === "credits" ? "SIN" : "health";
  return mergeSourceEntries(sources)
    .map((entry) => `${sign}${entry.amount} ${unit} from ${entry.source}`)
    .join("\n");
}

function recordPlayerDamageSource(amount, source) {
  const damage = Math.max(0, Math.ceil(amount));
  if (damage <= 0 || !source) return;
  state.playerDamageSources = state.playerDamageSources || [];
  state.playerDamageSources.push({ amount: damage, source });
}

function recordPlayerHealSource(amount, source) {
  const healed = Math.max(0, Math.ceil(amount));
  if (healed <= 0 || !source) return;
  state.playerHealSources = state.playerHealSources || [];
  state.playerHealSources.push({ amount: healed, source });
}

function recordPlayerCreditSource(amount, source) {
  const credits = Math.max(0, Math.ceil(amount));
  if (credits <= 0 || !source) return;
  state.playerCreditSources = state.playerCreditSources || [];
  state.playerCreditSources.push({ amount: credits, source });
}

function recordBotSinSource(bot, amount, source) {
  const raw = Number(amount || 0);
  if (!bot || !Number.isFinite(raw) || raw === 0 || !source) return;
  const sin = raw > 0 ? Math.ceil(raw) : -Math.ceil(Math.abs(raw));
  bot.sinSources = bot.sinSources || [];
  bot.sinSources.push({ amount: sin, source });
}

function recordBotDamageSource(bot, amount, source) {
  const damage = Math.max(0, Math.ceil(amount));
  if (!bot || damage <= 0) return;
  recordBotRoundDamage(bot, damage);
  if (!source) return;
  bot.damageSources = bot.damageSources || [];
  bot.damageSources.push({ amount: damage, source });
}

function recordBotRoundDamage(bot, amount) {
  const round = state.roundState;
  const damage = Math.max(0, Math.ceil(amount));
  if (!round || !bot || bot.eliminated || damage <= 0) return;
  const previous = round.botDamageTotals.get(bot.id) || 0;
  const next = previous + damage;
  round.botDamageTotals.set(bot.id, next);
  if (previous <= 40 && next > 40) {
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
    changeBotSin(bot, amount, `Seal of Marax gave ${bot.name} +${amount} SIN for taking over 40 damage.`, {
      triggerLossDamage: false
    });
  });
}

function recordBotHealSource(bot, amount, source) {
  const healed = Math.max(0, Math.ceil(amount));
  if (!bot || healed <= 0 || !source) return;
  bot.healSources = bot.healSources || [];
  bot.healSources.push({ amount: healed, source });
}

function addPendingBotDamage(botDamages, botDamageSources, bot, amount, source, playerDealt = true) {
  const damage = scaledBotDamage(bot, amount, playerDealt);
  if (!bot || damage <= 0) return;
  botDamages.set(bot.id, (botDamages.get(bot.id) || 0) + damage);
  if (botDamageSources) {
    const sources = botDamageSources.get(bot.id) || [];
    sources.push({ amount: damage, source: source || "Unknown" });
    botDamageSources.set(bot.id, sources);
  }
}

function applyPendingBotDamageBatch(botDamages, botDamageSources, bots, { logZero = false } = {}) {
  const eliminated = [];
  bots.forEach((bot) => {
    if (!bot || bot.eliminated || bot.hp <= 0) return;
    const damage = botDamages.get(bot.id) || 0;
    if (damage <= 0) {
      if (logZero) state.roundState.roundEvents.push(`${bot.name} took 0 damage.`);
      return;
    }
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    scaleSourceEntries(botDamageSources.get(bot.id), damage).forEach((entry) => recordBotDamageSource(bot, entry.amount, entry.source));
    if (bot.immortal) {
      bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
      state.roundState.roundEvents.push(`${bot.name} took ${damage} damage. Total: ${bot.damageTakenTotal}.`);
      return;
    }
    bot.hp = Math.max(0, bot.hp - damage);
    state.roundState.roundEvents.push(`${bot.name} took ${damage} damage.`);
    if (bot.hp <= 0) eliminated.push(bot);
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
  return scaled.filter((entry) => entry.amount > 0).map(({ source, amount }) => ({ source, amount }));
}

function damagePlayer(amount, reason, echo = true, respectReduction = true, source = undefined) {
  let damage = Math.max(0, Math.ceil(amount));
  if (respectReduction && state.roundState?.playerDamageReduction) {
    damage = Math.ceil(damage * (1 - state.roundState.playerDamageReduction));
  }
  if (damage <= 0) return 0;
  state.player.hp = Math.max(0, state.player.hp - damage);
  state.playerLastDamage = (state.playerLastDamage || 0) + damage;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Damage");
  recordPlayerDamageSource(damage, sourceLabel);
  if (reason) addRoundEvent(reason);
  if (echo) applySpiteCircuitDamage(damage);
  if (echo) applyPainEchoDamage(damage);
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
    addRoundEvent(`Seal of Haures adds ${damage} damage to every bot.`);
    return;
  }
  damageBots(targets, damage, (bot, dealt) => `Seal of Haures dealt ${dealt} damage to ${bot.name}.`, "Seal of Haures");
}

function applyPainEchoDamage(playerDamage, pendingBotDamages = null, pendingBotSources = null) {
  const round = state.roundState;
  if (!round?.painEcho || playerDamage <= 0) return;
  const echoDamage = Math.ceil(playerDamage * 2);
  const targets = activeBots();
  if (!targets.length) return;
  if (pendingBotDamages) {
    targets.forEach((bot) => {
      addPendingBotDamage(pendingBotDamages, pendingBotSources, bot, echoDamage, "Amulet of Pazuzu");
    });
    round.roundEvents.push(`Amulet of Pazuzu adds ${echoDamage} damage to every bot.`);
    return;
  }
  damageBots(targets, echoDamage, (bot, damage) => `Amulet of Pazuzu dealt ${damage} damage to ${bot.name}.`, "Amulet of Pazuzu");
}

function healPlayer(amount, reason, source = undefined) {
  if (state.player.hp <= 0) return 0;
  amount = Math.ceil(amount);
  const before = state.player.hp;
  state.player.hp = Math.min(playerMaxHp(), state.player.hp + amount);
  const healed = state.player.hp - before;
  if (healed > 0) state.playerLastHeal = (state.playerLastHeal || 0) + healed;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Healing");
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

function botReward(bot) {
  if (bot?.immortal) return 0;
  return Math.ceil(botBossBounty(bot) + botRegularBountyPayout(bot));
}

function botHealthBonus() {
  return state.bossKills * 5;
}

function randomBotHealth() {
  return randomBotHealthValue();
}

function randomBotHealthValue() {
  const bonus = botHealthBonus();
  return randomInt(BOT_MIN_HP + bonus, BOT_MAX_HP + bonus);
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

function damageBot(bot, amount, reason, source = undefined, playerDealt = true) {
  const rawDamage = Math.max(0, Math.ceil(amount));
  const damage = scaledBotDamage(bot, amount, playerDealt);
  if (!bot || bot.eliminated || damage <= 0) return 0;
  bot.lastDamage = (bot.lastDamage || 0) + damage;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Damage");
  recordBotDamageSource(bot, damage, sourceLabel);
  if (bot.immortal) {
    bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
    if (reason) {
      addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${damage} damage to ${bot.name}.` : reason);
    }
    return damage;
  }
  bot.hp = Math.max(0, bot.hp - damage);
  if (reason) {
    addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${damage} damage to ${bot.name}.` : reason);
  }
  if (bot.hp <= 0) resolveEliminatedBots([bot]);
  return damage;
}

function damageBotNonLethal(bot, amount, reason, source = undefined, playerDealt = true) {
  const rawDamage = Math.max(0, Math.ceil(amount));
  const damage = scaledBotDamage(bot, amount, playerDealt);
  if (!bot || bot.eliminated || bot.hp <= 1 || damage <= 0) return 0;
  if (bot.immortal) {
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
    const reasonText = typeof reason === "function" ? reason(bot, damage) : reason;
    const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reasonText, "Damage");
    recordBotDamageSource(bot, damage, sourceLabel);
    if (reasonText) addRoundEvent(reasonText);
    return damage;
  }
  const before = bot.hp;
  bot.lastDamage = (bot.lastDamage || 0) + damage;
  bot.hp = Math.max(1, bot.hp - damage);
  const dealt = before - bot.hp;
  const reasonText = typeof reason === "function" ? reason(bot, dealt) : reason;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reasonText, "Damage");
  recordBotDamageSource(bot, dealt, sourceLabel);
  if (reasonText && dealt > 0) {
    addRoundEvent(damage !== rawDamage && sourceLabel ? `${sourceLabel} dealt ${dealt} non-lethal damage to ${bot.name}.` : reasonText);
  }
  return dealt;
}

function damageBots(bots, amount, reasonFactory, sourceFactory = undefined, playerDealt = true) {
  const eliminated = [];
  bots.forEach((bot) => {
    const damage = scaledBotDamage(bot, typeof amount === "function" ? amount(bot) : amount, playerDealt);
    if (!bot || bot.eliminated || damage <= 0) return;
    bot.lastDamage = (bot.lastDamage || 0) + damage;
    const reason = typeof reasonFactory === "function" ? reasonFactory(bot, damage) : reasonFactory;
    const source =
      sourceFactory === null
        ? ""
        : typeof sourceFactory === "function"
          ? sourceFactory(bot, damage)
          : sourceFactory || sourceLabelFromReason(reason, "Damage");
    recordBotDamageSource(bot, damage, source);
    if (bot.immortal) {
      bot.damageTakenTotal = (bot.damageTakenTotal || 0) + damage;
      if (reason) addRoundEvent(reason);
      return;
    }
    bot.hp = Math.max(0, bot.hp - damage);
    if (reason) addRoundEvent(reason);
    if (bot.hp <= 0) eliminated.push(bot);
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
    damageSources: [],
    healSources: [],
    sinSources: [],
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
  addLog("SKIP: jumped to the first Goetic Seal boss.");
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
  if (state.mode !== "arcade") return;
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
  const profile = isBoss ? null : randomBotProfile();
  const archetype = uniqueSpec ? archetypeByType(uniqueSpec.personality) : randomFrom(BOT_ARCHETYPES);
  const bossOrder = isBoss ? state.bossSpawnCount + 1 : 0;
  const isEndlessBoss = isBoss && !uniqueSpec;
  const goeticSpec = isEndlessBoss ? goeticBossSpecFromKey(bossSpec?.goeticKey) : null;
  const bossBaseHp = 80 + state.bossSpawnCount * 20;
  const maxHp = isBoss ? bossBaseHp * (state.bossSpawnCount >= 4 ? 2 : 1) : randomBotHealth();
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
    country: profile?.country || "Boss",
    type: isBoss ? "Boss" : archetype.type,
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
    goeticKey: goeticSpec?.key || null,
    goeticPassiveId: goeticSpec?.passiveId || null,
    goeticSealName: goeticSpec?.sealName || null,
    modifierOverride: uniqueSpec?.modifierOverride ?? endlessModifier,
    shopTax: uniqueSpec?.shopTax || 0,
    eliminationDamage: uniqueSpec?.eliminationDamage || 0,
    grantsBuffs: Boolean(uniqueSpec?.grantsBuffs),
    passiveKeys,
    buffPassiveKey: null,
    uniqueDescriptions: uniqueSpec?.descriptions || [],
    memory: isBoss ? state.gameMemory.slice() : [],
    markedByPlayer: false,
    plannedGuess: null,
    lastDamage: 0,
    lastHeal: 0,
    lastSinDelta: 0,
    damageSources: [],
    healSources: [],
    sinSources: [],
    deathCause: null,
    deathNotice: null,
    eliminated: false,
    skipEliminationReward: false,
    pendingReplacementSpec: null,
    revealedByPassive: false,
    fresh: true
  };
  seedNewBotMemoryFromVassago(bot);
  if (isBoss) state.bossSpawnCount += 1;
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
  if (!aliveUniqueBoss("pyros") || state.roundState?.pyrosGiftGranted) return;
  const candidates = activeBots();
  if (!candidates.length) return;
  const target = randomFrom(candidates);
  const key = grantRandomBossPassive(target);
  if (!key) return;
  if (state.roundState) {
    state.roundState.pyrosGiftGranted = true;
    state.roundState.roundEvents.push(`Pyros gave ${target.name} ${BOSS_PASSIVES[key].name}.`);
  }
}

function rerollShop() {
  if (shopDisabledBySatan()) {
    state.shop = [];
    return;
  }
  const eliteBoosted = state.eliteBoostedNextReroll;
  state.eliteBoostedNextReroll = false;
  state.shop = [drawPassiveShopItem(eliteBoosted), drawShopItem(ACTIVE_IDS), drawShopItem(ACTIVE_IDS)];
  if (eliteBoosted) addLog("The Hand of Glory set this Seal reroll's ELITE chance to 50%.");
  syncShopSlotCount();
}

function syncShopSlotCount() {
  if (shopDisabledBySatan()) {
    state.shop = [];
    return;
  }
  const count = shopSlotCount();
  while (state.shop.length < count) state.shop.push(drawShopItem(ACTIVE_IDS));
  if (state.shop.length > count) state.shop = state.shop.slice(0, count);
}

function drawShopItem(pool) {
  const id = randomFrom(pool);
  return { item: itemCopy(id), sold: false };
}

function drawPassiveShopItem(eliteBoosted = false) {
  const ownedPassives = PASSIVE_IDS.filter((id) => directPassiveStack(id) > 0);
  const freshPassives = PASSIVE_IDS.filter((id) => directPassiveStack(id) === 0);
  const eliteChance = eliteBoosted ? 0.5 : SHOP_ELITE_CHANCE;
  const wantsElite = ownedPassives.length > 0 && Math.random() < eliteChance;
  const choices = wantsElite ? ownedPassives : freshPassives.length ? freshPassives : ownedPassives;
  if (!choices.length) return drawShopItem(PASSIVE_IDS);
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
  state.playtestInfiniteMoney = !state.playtestInfiniteMoney;
  if (!state.playtestInfiniteMoney) resetNegativePlaytestSin();
  addLog(`Playtest SIN debt ${state.playtestInfiniteMoney ? "enabled" : "disabled"}.`);
  render();
}

function gainCredits(amount, applyRoundMultiplier = true, source = undefined) {
  const base = Math.max(0, Math.ceil(amount));
  const multiplier = applyRoundMultiplier && state.roundState ? state.roundState.bountyMultiplier || 1 : 1;
  const gained = Math.ceil(base * multiplier);
  state.player.credits += gained;
  if (gained > 0) {
    if (state.roundState) state.roundState.earnedSinThisRound = (state.roundState.earnedSinThisRound || 0) + gained;
    state.playerLastCredits = (state.playerLastCredits || 0) + gained;
    recordPlayerCreditSource(gained, source || "SIN");
  }
  return gained;
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

  orderedPassiveEffectEntries(["p20", "p26", "p27"]).forEach((entry) => {
    if (entry.id === "p20") {
      const targets = activeBots();
      const damage = passiveEntryFlatDamage(entry, activePurchaseCost(item));
      if (!targets.length || damage <= 0) return;
      markPassiveEntryTriggered(entry);
      damageBots(targets, damage, (target, dealt) => `Seal of Haagenti dealt ${dealt} damage to ${target.name}.`, "Seal of Haagenti");
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
        const { healed } = applyPassivePlayerHealForEntry(entry, 3, "Seal of Zagan");
        round.roundEvents.push(`Seal of Zagan restored ${healed} health.`);
        return;
      }

      if (outcome === "damage") {
        const targets = activeBots();
        if (!targets.length) {
          round.roundEvents.push("Seal of Zagan sparked, but no bot could be hit.");
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
  state.gameMemory = [];
  state.pendingActive = null;
  state.gameOver = false;
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
  state.finalBossPhase = false;
  state.finalBossQueued = false;
  state.bossQueued = false;
  state.killsSinceBossSpawn = 0;
  state.eliteBoostedNextReroll = false;
  resetBotsForRun();
  rerollShop();
  beginRound();
  addLog("Round 1 begins. The table continues until you fall.");
  render();
}

function beginRound() {
  resetNegativePlaytestSin();
  state.stage = "guess";
  state.pendingActive = null;
  state.playerLastDamage = 0;
  state.playerLastHeal = 0;
  state.playerLastCredits = 0;
  state.playerDamageSources = [];
  state.playerHealSources = [];
  state.playerCreditSources = [];
  const threonMystery = aliveUniqueBoss("threon");
  state.roundState = {
    playerSubmittedGuess: null,
    playerEffectiveGuess: null,
    botSubmittedGuesses: new Map(),
    botEffectiveGuesses: new Map(),
    targetModifier: threonMystery ? randomInt(7, 13) / 10 : currentTargetModifier(),
    mysteryModifier: threonMystery,
    targetOffset: 0,
    target: null,
    criticalInteger: null,
    tableAverage: null,
    extraAverageGuesses: [],
    removedBotIds: new Set(),
    activeUses: 0,
    activeUseItemCounts: new Map(),
    twinDetonatorTriggeredIds: new Set(),
    painEcho: false,
    bountyMultiplier: 1,
    edgeGambitStacks: 0,
    playerDamageReduction: 0,
    creditsSpentThisRound: 0,
    earnedSinThisRound: 0,
    agaresSpreadApplied: false,
    creditLashDamageApplied: 0,
    temporaryBotSinBonuses: [],
    botDamageTotals: new Map(),
    highDamageSinBotIds: new Set(),
    shopItemBoughtThisRound: false,
    multiEliminationBonusPaid: false,
    eliminationsThisRound: 0,
    eliminationCreditRecords: [],
    pentakillAwarded: false,
    pentakillPopup: false,
    revealedBotIds: new Set(),
    wiretapExtraCount: null,
    wiretapStack: 0,
    pyrosGiftGranted: false,
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
    bot.plannedGuess = planBotGuess(bot);
    bot.revealedByPassive = false;
  });

  applyPyrosBuffs();
  applyMarkedProspect();
  applyGuessReveals();
  applyStartOfRoundPassives();
  applyGuessReveals();
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
  const revealableBots = state.bots.filter((bot) => !bot.isBoss && bot.hp > 0 && !bot.eliminated && !botHasPassive(bot, "shield"));
  const desiredRevealCount = Math.min(revealableBots.length, 1);
  const revealedCount = revealableBots.filter((bot) => bot.revealedByPassive).length;
  const hiddenBots = shuffled(revealableBots.filter((bot) => !bot.revealedByPassive));
  hiddenBots.slice(0, Math.max(0, desiredRevealCount - revealedCount)).forEach((bot) => {
    bot.revealedByPassive = true;
    state.roundState.revealedBotIds.add(bot.id);
  });
}

function submitGuess() {
  if (state.stage !== "guess" || state.gameOver) return;
  const input = document.querySelector("#guessInput");
  const submitted = Number(input.value);
  const maxGuess = playerGuessLimit();
  if (!Number.isFinite(submitted) || submitted < 0 || submitted > maxGuess) {
    showInvalidGuessPopup();
    return;
  }

  const guess = Math.ceil(submitted);
  const round = state.roundState;
  round.playerSubmittedGuess = guess;
  round.playerEffectiveGuess = applyGuessMutation("Player", guess);

  state.bots.filter((bot) => !bot.eliminated).forEach((bot) => {
    round.botSubmittedGuesses.set(bot.id, bot.plannedGuess);
    round.botEffectiveGuesses.set(bot.id, applyGuessMutation(bot.name, bot.plannedGuess, bot));
  });

  round.edgeGambitStacks = 0;

  playGuessSfx();
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
  if (sinWeight > 0) markPassiveTriggered("p42");

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

function applyOrderedPenaltyPassiveDamage(activeBotList, botDamages, botDamageSources, addPlayerDamage) {
  const round = state.roundState;
  orderedPassiveEffectEntries(["p2", "p3"]).forEach((entry) => {
    if (entry.id === "p2") {
      if (Math.abs(round.playerEffectiveGuess - round.target) > 5) return;
      const damage = passiveEntryFlatDamage(entry, 10);
      activeBotList.forEach((bot) => {
        addPendingBotDamage(botDamages, botDamageSources, bot, damage, "Seal of Paimon");
      });
      markPassiveEntryTriggered(entry);
      round.roundEvents.push(`Seal of Paimon triggers for ${damage} damage to all SINNERS.`);
      return;
    }

    if (entry.id === "p3") {
      if (round.criticalInteger % 3 !== 0) return;
      const verdictDamage = divisibleVerdictDamage(entry);
      activeBotList.forEach((bot) => {
        addPendingBotDamage(botDamages, botDamageSources, bot, verdictDamage, "Seal of Alloces");
      });
      markPassiveEntryTriggered(entry);
      round.roundEvents.push(`Seal of Alloces triggers for ${verdictDamage} damage to all bots.`);
      return;
    }
  });
}

function applyPenalties() {
  const round = state.roundState;
  round.penaltiesApplied = true;
  recalculateTarget();
  state.previousTarget = round.target;

  const botDamages = new Map();
  const botDamageSources = new Map();
  let playerDamage = 0;
  let playerDamageSources = [];
  const addPlayerDamage = (amount, source) => {
    const damage = Math.max(0, Math.ceil(amount));
    if (damage <= 0) return;
    playerDamage += damage;
    playerDamageSources.push({ amount: damage, source });
  };
  const activeBots = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated);
  round.edgeGambitStacks = [0, 50, 100].includes(round.playerEffectiveGuess) ? passiveStack("p4") : 0;
  if (round.edgeGambitStacks) {
    const multiplier = edgeGambitMultiplier("p4");
    markPassiveTriggered("p4");
    round.roundEvents.push(`Seal of Andras used your final guess and multiplied bot penalty damage x${multiplier.toFixed(2)}.`);
  }

  const participants = currentRoundParticipants(activeBots);
  const worstDistance = participants.reduce((largest, participant) => Math.max(largest, participant.distance), -1);
  const worstGuessers = participants.filter((participant) => participant.distance === worstDistance && participant.distance > 0);
  if (worstGuessers.length) {
    worstGuessers.forEach((participant) => {
      if (participant.kind === "player") {
        addPlayerDamage(10, "Worst guess penalty");
      } else {
        addPendingBotDamage(botDamages, botDamageSources, participant.bot, 10, "Worst guess penalty", false);
      }
    });
    round.roundEvents.push(`${worstGuessers.map((participant) => participant.name).join(", ")} had the worst guess and took 10 damage.`);
  }

  const criticals = findCriticalHits();
  round.criticalHitKeys = new Set(criticals.map((hitter) => hitter.key));
  if (criticals.some((hitter) => hitter.key === "player")) {
    if (passiveStack("p6")) markPassiveTriggered("p6");
    if (passiveStack("p7")) markPassiveTriggered("p7");
  }
  criticals.forEach((hitter) => {
    const criticalSummary = hitter.key === "player" && passiveStack("p7") ? `${pressureSpikeDamage("p7")} damage` : `${hitter.damage} damage`;
    round.roundEvents.push(`${hitter.name} hit CRITICAL ${round.criticalInteger} for ${criticalSummary}.`);
    getParticipants().forEach((victim) => {
      if (victim.key === hitter.key) return;
      const criticalDamage = criticalDamageForVictim(hitter, victim);
      if (victim.kind === "player") {
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

  applyOrderedPenaltyPassiveDamage(activeBots, botDamages, botDamageSources, addPlayerDamage);
  applyPendingBotDamageBatch(botDamages, botDamageSources, activeBots);

  addPlayerDamage(Math.ceil(Math.abs(round.playerEffectiveGuess - round.target)), "Target difference");
  const targetBotDamages = new Map();
  const targetBotDamageSources = new Map();
  const reactionBotDamages = new Map();
  const reactionBotDamageSources = new Map();
  state.bots
    .filter((bot) => bot.hp > 0 && !bot.eliminated)
    .forEach((bot) => {
      let damage = Math.ceil(Math.abs(round.botEffectiveGuesses.get(bot.id) - round.target));
      if (round.edgeGambitStacks) damage = Math.ceil(damage * edgeGambitMultiplier("p4"));
      addPendingBotDamage(targetBotDamages, targetBotDamageSources, bot, damage, "Target difference", false);
    });

  if (round.playerDamageReduction) {
    const beforeReduction = playerDamage;
    playerDamage = Math.ceil(playerDamage * (1 - round.playerDamageReduction));
    if (beforeReduction > playerDamage) {
      round.roundEvents.push(`The Philosopher's Stone reduced damage from ${beforeReduction} to ${playerDamage}.`);
    }
  }
  playerDamageSources = scaleSourceEntries(playerDamageSources, playerDamage);

  const appliedPlayerDamage = damagePlayer(playerDamage, null, false, false, null);
  if (appliedPlayerDamage > 0) {
    playerDamageSources.forEach((entry) => recordPlayerDamageSource(entry.amount, entry.source));
    round.roundEvents.push(`You took ${appliedPlayerDamage} damage.`);
    applySpiteCircuitDamage(appliedPlayerDamage, reactionBotDamages, reactionBotDamageSources);
    applyPainEchoDamage(appliedPlayerDamage, reactionBotDamages, reactionBotDamageSources);
  } else {
    round.roundEvents.push("You took no damage.");
  }

  applyPendingBotDamageBatch(targetBotDamages, targetBotDamageSources, state.bots);
  applyPendingBotDamageBatch(reactionBotDamages, reactionBotDamageSources, state.bots);

  if (state.player.hp <= 0) {
    finishGameOverRound();
    return;
  }

  applyEndOfRoundPassives();

  if (state.player.hp <= 0) {
    finishGameOverRound();
    return;
  }

  applyRoundEliminationBonus();
  applyAgaresEarnedSinSpread();
  clearTemporaryBotSinBonuses();

  if (state.player.hp <= 0) {
    finishGameOverRound();
    return;
  }

  rememberRound();

  if (state.player.hp <= 0) {
    state.gameOver = true;
    state.stage = "ended";
    addLog("Game over. The table solved you first.");
    return;
  }

  state.stage = "summary";
  addLog("Penalties applied. Advance when ready.");
}

function finishGameOverRound() {
  rememberRound();
  state.gameOver = true;
  state.stage = "ended";
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
        window: botHasPassive(bot, "wideCrit") ? 2 : 0,
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
  return getParticipants().filter((participant) => {
    if (!Number.isFinite(participant.guess)) return false;
    const distance = Math.abs(participant.guess - rightInteger);
    return distance <= participant.window || (distance <= participant.window + 1 && Math.random() < participant.bonusWindowChance);
  });
}

function resolveEliminatedBots(eliminated) {
  const freshEliminations = eliminated.filter((bot) => bot && !bot.immortal && bot.hp <= 0 && !bot.eliminated);
  if (!freshEliminations.length) return;
  const dantreAlive = aliveUniqueBoss("dantre", new Set(freshEliminations.map((bot) => bot.id)));

  freshEliminations.forEach((bot) => {
    const rewardAmount = bot.skipEliminationReward ? 0 : botReward(bot);
    const reward = rewardAmount > 0 ? gainEliminationCredits(rewardAmount, true, `${bot.name} bounty`) : 0;
    if (hasPassive("p36") && botRegularBounty(bot) > 0) markPassiveTriggered("p36");
    state.eliminations += 1;
    state.killsSinceBossSpawn += 1;
    state.roundState.eliminationsThisRound += 1;
    bot.eliminated = true;
    bot.deathCause = "ko";
    bot.deathNotice = `${bot.name} -${bot.lastDamage || 0} KO`;
    state.roundState.roundEvents.push(
      reward > 0 ? `${bot.name} was eliminated. +${reward} SIN.` : `${bot.name} was eliminated. No SIN paid.`
    );

    if (dantreAlive) {
      const dantreDamage = damagePlayer(3, "Dantre dealt damage for the elimination.");
      if (dantreDamage > 0) state.roundState.roundEvents.push(`Dantre dealt ${dantreDamage} damage for the elimination.`);
    }

    if (bot.isBoss) {
      const previousPassiveLimit = passiveLimit();
      state.bossKills += 1;
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

  const lambDeaths = freshEliminations.filter((bot) => botHasPassive(bot, "lamb")).length;
  if (lambDeaths) {
    const heal = 10 * lambDeaths;
    activeBots().forEach((bot) => healBot(bot, heal, "Seal of Sallos"));
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
  const result = upgradeRandomSealFromPentakill();
  round.roundEvents.push(result.message);
}

function upgradeRandomSealFromPentakill() {
  const upgradeTargets = state.player.passives.filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id));
  if (upgradeTargets.length) {
    const target = randomFrom(upgradeTargets);
    target.stack = (target.stack || 1) + 1;
    return { item: target, message: `PENTAKILL! ${target.name} upgraded to ${passiveDisplayName(target)}.` };
  }

  if (state.player.passives.length >= passiveLimit()) {
    return { item: null, message: "PENTAKILL! No Seal slot was available for the upgrade." };
  }

  const item = itemCopy(randomFrom(PASSIVE_IDS));
  state.player.passives.push(item);
  refreshMimicTarget();
  syncShopSlotCount();
  return { item, message: `PENTAKILL! ${item.name} entered your Seals.` };
}

function replacePendingEliminations() {
  if (state.finalBossQueued) {
    enterFinalBossPhase();
    return;
  }
  let spawnedBoss = false;
  state.bots = state.bots.map((bot) => {
    if (!bot.eliminated) return bot;
    const bossSpec = bot.pendingReplacementSpec;
    const replacement = createBot({ boss: Boolean(bossSpec), bossSpec });
    if (bossSpec) {
      spawnedBoss = true;
      addLog(`${replacement.name} enters as a boss with ${botPassiveSummary(replacement)}.`);
    }
    return replacement;
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
    return { uniqueKey: state.uniqueBossQueue.shift() };
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
      applyPassivePlayerHealForEntry(entry, 2, "Seal of Gremory");
      const gained = gainEliminationCredits(passiveEntryScaledValue(entry, 4), true, "Seal of Gremory");
      state.roundState.roundEvents.push(`Seal of Gremory paid ${gained} SIN from ${bot.name}.`);
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
  orderedPassiveEffectEntries(["p1", "p12", "p17", "p31", "p40"]).forEach((entry) => {
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
      const memorySources = bosses.length ? living.filter((bot) => !bot.isBoss) : living;
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
    if (totalBonus > 0) state.roundState.roundEvents.push(`Seal of Forneus added ${totalBonus} total bounty to the two richest SINNERS.`);
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
      const gained = gainCredits(lost, false, "Seal of Ronove");
      state.roundState.roundEvents.push(`Seal of Ronove paid ${gained} SIN.`);
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
  const credits = scaledPassiveValue("p37", 4);
  const gained = gainCredits(credits, true, "Seal of Malphas");
  const { healed } = applyPassivePlayerHeal("p37", 3, "Seal of Malphas");
  markPassiveTriggered("p37");
  state.roundState.roundEvents.push(`Seal of Malphas paid ${gained} SIN and healed ${healed} for taking ${state.playerLastDamage || 0} damage.`);
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
  state.round += 1;
  replacePendingEliminations();
  state.rerollBaseCost = 1;
  rerollShop();
  beginRound();
  render();
}

function rememberRound() {
  const round = state.roundState;
  const memoryGrowthEntries = orderedPassiveEffectEntries("p54");
  const extraMemory = memoryGrowthEntries.reduce((sum, entry) => sum + Math.max(1, entry.stack || 1), 0);
  const memoryGain = 1 + extraMemory;
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
  if (memoryGrowthEntries.length) memoryGrowthEntries.forEach((entry) => markPassiveEntryTriggered(entry));
  const memoryEliminations = [];

  state.bots.forEach((bot) => {
    if (bot.eliminated) return;
    const ownGuess = round.botEffectiveGuesses.get(bot.id);
    if (!Number.isFinite(ownGuess)) {
      if (bot.isBoss) bot.memory = state.gameMemory.slice();
      return;
    }
    for (let copy = 0; copy < memoryGain; copy += 1) {
      bot.memory.push({
        ownGuess,
        ...memoryEntry
      });
    }
    applyMemoryAddedHealing(bot, memoryGain);
    if (!bot.isBoss) {
      bot.memory = bot.memory.slice(-NON_BOSS_MEMORY_LIMIT);
      if (memoryGrowthEntries.length && bot.memory.length >= ZEPAR_MEMORY_THRESHOLD) {
        bot.hp = 0;
        bot.deathCause = "memory-overload";
        memoryEliminations.push(bot);
        round.roundEvents.push(`Seal of Zepar eliminated ${bot.name} at ${bot.memory.length} memory.`);
      }
    }
  });

  if (memoryEliminations.length) resolveEliminatedBots(memoryEliminations);
}

function buyShopItem(slotIndex) {
  if (shopDisabledBySatan()) {
    addLog("Satan has disabled Devil's Offerings.");
    render();
    return;
  }
  const slot = state.shop[slotIndex];
  if (!slot || slot.sold) return;
  const item = slot.item;
  const cost = shopPrice(item);

  if (!canSpendCredits(cost)) {
    addLog("Not enough SIN.");
    render();
    return;
  }

  if (item.type === "passive") {
    const existing = passiveEntry(item.id);
    if (!existing && state.player.passives.length >= passiveLimit()) {
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
  rerollShop();
  state.rerollBaseCost += 1;
  addLog(`Devil's Offerings rerolled for ${cost} SIN.`);
  render();
}

function sellPassive(index) {
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
    state.stage === "active" &&
    state.roundState &&
    !state.roundState.penaltiesApplied &&
    state.roundState.activeUses < activeUseLimit()
  );
}

function useActive(index) {
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

  if (item.id === "a13") {
    const damagedHealTargets = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated && bot.hp < bot.maxHp);
    if (!damagedHealTargets.length) {
      addLog("The White-Hilted Knife needs a damaged bot to heal.");
      render();
      return;
    }
  }

  const mirrorSpiteBots = activeBots().filter((bot) => botHasPassive(bot, "spite"));
  mirrorSpiteBots.forEach((bot) => {
    damagePlayer(3, `${bot.name}'s Seal of Botis dealt 3 damage to you.`);
  });
  if (state.gameOver) {
    render();
    return;
  }

  if (aliveUniqueBoss("threon") && Math.random() < 0.5) {
    damagePlayer(5, `${item.name} malfunction dealt 5 damage to you.`);
    consumeActive(index, `${item.name} malfunctioned and did nothing.`, item.uid);
    return;
  }

  if (item.id === "a6") {
    state.roundState.targetOffset += 20;
    consumeActive(index, "The Tablet of Destinies added 20 to the target.", item.uid);
    return;
  }

  if (item.id === "a14") {
    state.roundState.targetOffset -= 10;
    consumeActive(index, "The Blasting Rod reduced the target by 10.", item.uid);
    return;
  }

  if (item.id === "a23") {
    state.eliteBoostedNextReroll = true;
    consumeActive(index, "The Hand of Glory marked the next reroll. The Seal slot has a 50% ELITE chance.", item.uid);
    return;
  }

  if (["a7", "a8", "a9", "a15", "a25", "a26", "a28"].includes(item.id)) {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot" };
    addLog("Pick a bot to resolve the Artifact.");
    render();
    return;
  }

  if (item.id === "a10") {
    state.roundState.bountyMultiplier *= 2;
    consumeActive(index, `The Thirty Pieces of Silver armed: SIN gains pay x${state.roundState.bountyMultiplier} this round.`, item.uid);
    return;
  }

  if (item.id === "a11") {
    const healed = healPlayer(20, null, "Witch Bottle");
    let message = `Witch Bottle healed you for ${healed}.`;
    if (Math.random() < 0.33) {
      state.bossQueued = true;
      message += " A boss is queued for the next elimination.";
    }
    consumeActive(index, message, item.uid);
    return;
  }

  if (item.id === "a12") {
    state.roundState.playerDamageReduction = Math.max(state.roundState.playerDamageReduction, 0.5);
    consumeActive(index, "The Philosopher's Stone armed: you take 50% less damage this round.", item.uid);
    return;
  }

  if (item.id === "a13") {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot", step: "damage", damageBotId: null };
    addLog("Pick a bot to take 20 non-lethal damage.");
    render();
    return;
  }

  if (item.id === "a16") {
    const credits = randomInt(3, 9);
    const gained = gainCredits(credits, true, "Dr Dee's Gold Disc");
    consumeActive(index, `Dr Dee's Gold Disc gained ${gained} SIN.`, item.uid);
    return;
  }

  if (item.id === "a18") {
    const copyOptions = state.player.actives.filter((active, activeIndex) => activeIndex !== index);
    if (!copyOptions.length) {
      addLog("The Emerald Tablet needs another Artifact to copy.");
      render();
      return;
    }
    const copied = randomFrom(copyOptions);
    const duplicate = itemCopy(copied.id);
    duplicate.purchaseCost = 0;
    state.player.actives.push(duplicate);
    consumeActive(index, `The Emerald Tablet copied ${copied.name}.`, item.uid);
    return;
  }

  if (item.id === "a21") {
    state.roundState.painEcho = true;
    consumeActive(index, "Amulet of Pazuzu armed: bots take double the damage you take this round.", item.uid);
    return;
  }

  if (item.id === "a22") {
    resolvePandoraRoll(index, item.uid);
    return;
  }

  render();
}

function cancelPendingActive() {
  const pending = state.pendingActive;
  if (!pending) return;
  const item = state.player.actives.find((active) => active.uid === pending.uid);
  if (pending.id === "a13" && pending.step === "heal") {
    addLog("The White-Hilted Knife has already hit; choose a heal target to finish it.");
    render();
    return;
  }
  if (pending.id === "a26" && pending.step === "give") {
    const source = state.bots.find((bot) => bot.id === pending.sourceBotId);
    if (source) {
      changeBotSin(source, pending.removedBounty || 0, "", {
        triggerLossDamage: false,
        source: "Grandier's Pact canceled"
      });
    }
    addLog("Grandier's Pact canceled and restored the drained bounty.");
  } else {
    addLog(`${item?.name || "Artifact"} canceled.`);
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
    state.gameOver = true;
    state.stage = "ended";
    addLog("Game over. The table solved you first.");
  }
  if (renderAfter) render();
}

function resolvePandoraRoll(index, uid) {
  const roll = Math.random();
  if (roll < 0.1) {
    damagePlayer(20, "The Necklace of Harmonia dealt 20 damage to you.");
    consumeActive(index, "The Necklace of Harmonia backfired.", uid);
    return;
  }
  if (roll < 0.3) {
    damagePlayer(10, "The Necklace of Harmonia dealt 10 damage to you.");
    consumeActive(index, "The Necklace of Harmonia stung you.", uid);
    return;
  }
  if (roll < 0.6) {
    const gained = gainCredits(6, true, "The Necklace of Harmonia");
    consumeActive(index, `The Necklace of Harmonia gained ${gained} SIN.`, uid);
    return;
  }
  if (roll < 0.8) {
    const gained = gainCredits(12, true, "The Necklace of Harmonia");
    consumeActive(index, `The Necklace of Harmonia gained ${gained} SIN.`, uid);
    return;
  }
  if (roll >= 0.9) {
    consumeActive(index, "The Necklace of Harmonia flickered and did nothing.", uid);
    return;
  }
  const gained = gainCredits(15, true, "The Necklace of Harmonia");
  damageBots(activeBots(), 20, (bot, damage) => `The Necklace of Harmonia dealt ${damage} damage to ${bot.name}.`);
  consumeActive(index, `The Necklace of Harmonia gained ${gained} SIN and struck every bot.`, uid);
}

function chooseBot(botId) {
  if (!state.pendingActive || state.pendingActive.mode !== "bot") return;
  const { id, index } = state.pendingActive;
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
  const item = state.player.actives.find((active) => active.uid === state.pendingActive.uid);

  if (id === "a7") {
    if (bot.isBoss) {
      addLog("The Ring of Gyges cannot target bosses.");
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
    consumeActive(index, `The Ring of Gyges traded guesses with ${bot.name}.`);
    return;
  }

  if (id === "a8") {
    const guess = round.botEffectiveGuesses.get(bot.id);
    for (let copy = 0; copy < 4; copy += 1) {
      round.extraAverageGuesses.push({ botId: bot.id, guess });
    }
    applyTargetedItemSinGain(item, [bot]);
    consumeActive(index, `The Ring of Solomon counted ${bot.name}'s guess five times.`);
    return;
  }

  if (id === "a9") {
    round.removedBotIds.add(bot.id);
    applyTargetedItemSinGain(item, [bot]);
    consumeActive(index, `The Key of the Bottomless Pit removed ${bot.name} from the average.`);
    return;
  }

  if (id === "a15") {
    const uid = state.pendingActive.uid;
    const damage = Math.ceil(bot.maxHp * (bot.isBoss ? 0.1 : 0.2));
    applyTargetedItemSinGain(item, [bot]);
    consumeActive(index, `The Magical Sword of Solomon hit ${bot.name} for ${damage}.`, uid, false);
    damageBot(bot, damage, `The Magical Sword of Solomon dealt ${damage} damage to ${bot.name}.`);
    render();
    return;
  }

  if (id === "a25") {
    changeBotSin(bot, 9, "", { triggerLossDamage: false, source: "The Brazen Vessel of Solomon" });
    const healed = healBot(bot, bot.maxHp, "The Brazen Vessel of Solomon");
    applyTargetedItemSinGain(item, [bot]);
    consumeActive(index, `The Brazen Vessel of Solomon healed ${bot.name} for ${healed} and added +9 bounty.`);
    return;
  }

  if (id === "a26") {
    const pending = state.pendingActive;
    if (pending.step === "give") {
      changeBotSin(bot, pending.removedBounty || 0, "", { triggerLossDamage: false, source: "Grandier's Pact" });
      applyTargetedItemSinGain(item, [bot]);
      consumeActive(index, `Grandier's Pact moved ${pending.removedBounty || 0} bounty to ${bot.name}.`);
      return;
    }
    const removed = Math.min(5, botSin(bot));
    changeBotSin(bot, -removed, `Grandier's Pact drained ${removed} bounty from ${bot.name}.`);
    applyTargetedItemSinGain(item, [bot]);
    pending.step = "give";
    pending.sourceBotId = bot.id;
    pending.removedBounty = removed;
    addLog(`Grandier's Pact drained ${removed} bounty from ${bot.name}. Pick a bot to receive it.`);
    render();
    return;
  }

  if (id === "a28") {
    if (bot.isBoss) {
      addLog(`${item.name} cannot target bosses.`);
      render();
      return;
    }
    addBotMemory(bot, 6, `${item.name} gave ${bot.name} +6 memory.`);
    changeBotSin(bot, 6, `${item.name} gave ${bot.name} +6 SIN.`, { triggerLossDamage: false });
    bot.maxHp += 6;
    bot.hp += 6;
    applyTargetedItemSinGain(item, [bot]);
    consumeActive(index, `${item.name} gave ${bot.name} +6 memory, +6 SIN, and +6 health.`);
    return;
  }

  if (id === "a13") {
    resolveTriageBeam(bot);
  }
}

function resolveTriageBeam(bot) {
  const pending = state.pendingActive;
  const item = state.player.actives.find((active) => active.uid === pending.uid);
  if (pending.step === "damage") {
    const possibleHealTargets = state.bots.filter(
      (candidate) => candidate.id !== bot.id && candidate.hp > 0 && !candidate.eliminated && candidate.hp < candidate.maxHp
    );
    if (!possibleHealTargets.length) {
      addLog("Pick a damage target that leaves another damaged bot to heal.");
      render();
      return;
    }
    const dealt = damageBotNonLethal(
      bot,
      20,
      (target, damage) => `The White-Hilted Knife dealt ${damage} non-lethal damage to ${target.name}.`,
      "The White-Hilted Knife"
    );
    applyTargetedItemSinGain(item, [bot]);
    pending.step = "heal";
    pending.damageBotId = bot.id;
    addLog("Now pick another bot to heal for 20.");
    render();
    return;
  }

  if (pending.step === "heal") {
    if (bot.id === pending.damageBotId) {
      addLog("Choose another bot to receive the heal.");
      render();
      return;
    }
    if (bot.hp >= bot.maxHp) {
      addLog("The White-Hilted Knife can only heal a damaged bot.");
      render();
      return;
    }
    healBot(bot, 20, "The White-Hilted Knife");
    applyTargetedItemSinGain(item, [bot]);
    consumeActive(pending.index, `The White-Hilted Knife healed ${bot.name}.`);
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
  state.pvp.log.unshift(message);
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
  pvpAddLog("Empty slots filled with bots.");
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
  const guess = Math.ceil(Number(value));
  if (!participant || participant.eliminated || !participant.human || !Number.isFinite(guess) || guess < 0 || guess > 100) {
    pvpAddLog("Invalid PvP guess.");
    render();
    return;
  }
  participant.guess = guess;
  playGuessSfx();
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
  if (!participant || participant.eliminated || damage <= 0) return 0;
  participant.hp = Math.max(0, participant.hp - damage);
  participant.lastDamage += damage;
  const sourceLabel = source === null ? "" : source || sourceLabelFromReason(reason, "Damage");
  if (sourceLabel) {
    participant.damageSources = participant.damageSources || [];
    participant.damageSources.push({ amount: damage, source: sourceLabel });
  }
  if (reason) {
    state.pvp.activeResults.push(
      reduction > 0 && damage < rawDamage
        ? `${participant.name} took ${damage} from ${sourceLabel || "damage"} after Witch in a Bottle reduced ${rawDamage}.`
        : reason
    );
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
              description: active.description,
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
    activeResults: state.pvp.activeResults,
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
      <img class="menu-figure menu-figure-jesus" src="${MAIN_MENU_JESUS_SRC}" alt="" aria-hidden="true" />
      <img class="menu-figure menu-figure-devil" src="${MAIN_MENU_DEVIL_SRC}" alt="" aria-hidden="true" />
      <img class="main-menu-logo" src="${MAIN_MENU_LOGO_SRC}" alt="Aenao" />
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
  const musicValue = Math.round(state.sound.musicVolume * 100);
  const sfxValue = Math.round(state.sound.sfxVolume * 100);
  return `
    <div class="options-menu">
      <div class="sound-setting">
        <label for="musicVolume">Music</label>
        <input id="musicVolume" class="sound-slider" type="range" min="0" max="100" step="1" value="${musicValue}" />
        <strong id="musicVolumeValue">${musicValue}%</strong>
      </div>
      <div class="sound-setting">
        <label for="sfxVolume">Sfx</label>
        <input id="sfxVolume" class="sound-slider" type="range" min="0" max="100" step="1" value="${sfxValue}" />
        <strong id="sfxVolumeValue">${sfxValue}%</strong>
      </div>
      <label class="sound-toggle">
        <input id="soundMuted" type="checkbox" ${state.sound.muted ? "checked" : ""} />
        <span>Mute Sound</span>
      </label>
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
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
        <div class="empty-state">Becomes a bot when Ready is pressed</div>
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
      <div class="bot-type">${participant.human ? "Phone Player" : "Bot"}</div>
      <div class="bot-stats">
        <div class="mini-stat">
          <span>${guessLabel}</span>
          <strong class="${guessClass}"${guessCloseness.style}>${guessText}</strong>
        </div>
        <div class="mini-stat">
          <span>Artifact</span>
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
        <option value="">Target</option>
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
  return `<div class="pvp-results">${state.pvp.activeResults.map((result) => `<div>${escapeHtml(result)}</div>`).join("")}</div>`;
}

function renderPvpLog() {
  if (!state.pvp.log.length) return "";
  return `<div class="pvp-log">${state.pvp.log.map((entry) => `<div>${escapeHtml(entry)}</div>`).join("")}</div>`;
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
      : "Skip to the first Goetic Seal boss";
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
        <button class="small-button round-skip-button" id="skipProgression" title="${escapeAttr(skipTitle)}" ${state.finalBossPhase ? "disabled" : ""}>SKIP</button>
      </div>
      <div class="stat-card">
        <span class="stat-label">KOs / Boss</span>
        <span class="stat-value">${state.eliminations}/${state.bossKills}</span>
      </div>
      <div class="stat-card credit-wrap">
        ${playerCreditBadge}
        <span class="stat-label">SIN</span>
        <span class="stat-value">${state.player.credits}</span>
        <button class="small-button ${playtestButtonClass}" id="playtestMoney">INF</button>
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
    </section>
  `;
}

function renderBots() {
  const pendingPick = state.pendingActive && state.pendingActive.mode === "bot";
  return `
    <section class="bot-grid ${pendingPick ? "picking" : ""} ${state.finalBossPhase ? "final-boss-grid" : ""}" aria-label="Bot players">
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
  const downClass = isDown ? "eliminated" : "";
  const deathCauseClass = bot.deathCause ? `death-${bot.deathCause}` : "";
  const faceClass = bot.isBoss ? "boss-face" : "";
  const passiveSummary = botPassiveSummary(bot);
  const hasVisiblePassive = passiveSummary && passiveSummary !== "No Seal";
  const typeLabel = hasVisiblePassive ? `${bot.isBoss ? "Boss" : bot.type}: ${passiveSummary}` : bot.type;
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
  const deathBadgeClass = bot.deathCause === "contract" ? "contract-badge" : "";
  const deathBadge = bot.deathNotice ? `<div class="death-badge ${deathBadgeClass}">${bot.deathNotice}</div>` : "";
  const markBadge = bot.markedByPlayer && !isDown ? `<div class="mark-badge">MARKED</div>` : "";
  const rewardLabel = botSinDisplay(bot);
  const flagHtml = bot.isBoss
    ? ""
    : `<span class="bot-flag" aria-label="${escapeAttr(bot.country)}" title="${escapeAttr(bot.country)}">${bot.flag}</span>`;
  const healthLabel = bot.immortal ? `Damage ${bot.damageTakenTotal || 0}` : `Health ${bot.hp}/${bot.maxHp}`;
  const healthPercent = bot.immortal ? 100 : (bot.hp / bot.maxHp) * 100;
  const identitySwapBlocked = state.pendingActive?.id === "a7" && bot.isBoss;
  const shieldBlocked = pendingPick && botHasPassive(bot, "shield");
  const pickDisabled = isDown || identitySwapBlocked || shieldBlocked;
  const pickButton = pendingPick
    ? `<button class="pick-button" data-pick-bot="${bot.id}" ${pickDisabled ? "disabled" : ""}>${isDown ? "Down" : identitySwapBlocked ? "Boss" : shieldBlocked ? "Seal" : "Pick"}</button>`
    : "";
  const tooltipAttr = passiveDescription ? ` data-tooltip="${escapeAttr(passiveDescription)}"` : "";
  const faceInner = isDown
    ? bot.deathCause === "contract"
      ? `<span class="contract-mark">PC</span>`
      : `<span class="ko-x">X</span>`
    : `<img class="bot-image" src="${escapeAttr(botImagePath(bot))}" alt="" loading="lazy" />`;

  return `
    <article class="bot-card ${pickClass} ${freshClass} ${bossClass} ${downClass} ${deathCauseClass}" style="--bot-color: ${bot.color}"${tooltipAttr}>
      ${deathBadge}
      ${markBadge}
      <div class="bot-face ${faceClass}">${faceInner}</div>
      <div class="bot-title">
        ${flagHtml}
        <div class="bot-name" title="${escapeAttr(`${bot.name} (${bot.country})`)}">${bot.name}</div>
        <div class="bot-reward" title="SIN">${rewardLabel}</div>
        ${sinBadge}
      </div>
      <div class="bot-type ${bot.isBoss ? "boss-type" : ""}" title="${typeLabel}">${typeLabel}</div>
      <div class="bot-stats">
        <div class="mini-stat">
          <span class="${criticalGuessLabelClass}">${removed}</span>
          <strong class="${guessClass}"${guessCloseness.style}>${revealed}</strong>
        </div>
        <div class="mini-stat">
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
    hint = `${round.activeUses}/${activeUseLimit()} Artifacts used. Ready applies penalties.`;
  } else if (state.stage === "summary") {
    buttonText = "Next Round";
    inputDisabled = "disabled";
    hint = shopDisabledBySatan()
      ? "Penalties are locked in. Satan has sealed Devil's Offerings."
      : "Penalties are locked in. Devil's Offerings is still available before you advance.";
  } else if (state.stage === "ended") {
    buttonText = "Restart";
    inputDisabled = "disabled";
    hint = "Run ended.";
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
      ${hint ? `<div class="console-hint">${hint}</div>` : ""}
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
        <span>${pendingText}</span>
        ${pendingCancel}
      </div>
    </section>
  `;
}

function renderPendingText() {
  if (!state.pendingActive) return "";
  const item = state.player.actives.find((active) => active.uid === state.pendingActive.uid);
  if (!item) return "";
  if (state.pendingActive.id === "a6") return "The Tablet of Destinies adds 20 to the target.";
  if (state.pendingActive.id === "a14") return "The Blasting Rod reduces the target by 10.";
  if (state.pendingActive.id === "a15") return "The Magical Sword of Solomon: pick a target. Non-bosses take 20%, bosses take 10%.";
  if (state.pendingActive.id === "a25") return "The Brazen Vessel of Solomon: pick a bot to heal to full and give +9 bounty.";
  if (state.pendingActive.id === "a26" && state.pendingActive.step === "give") return "Grandier's Pact: pick a bot to receive the drained bounty.";
  if (state.pendingActive.id === "a26") return "Grandier's Pact: pick a bot to drain up to 5 bounty.";
  if (state.pendingActive.id === "a28") return "Demon Bowl - Incantation Bowl: pick a non-boss bot to gain +6 memory, +6 SIN, and +6 health.";
  if (state.pendingActive.id === "a13" && state.pendingActive.step === "heal") {
    return "The White-Hilted Knife: pick a different bot to heal for 20.";
  }
  return `${item.name}: pick a bot card to resolve it.`;
}

function renderShop() {
  const locked = shopDisabledBySatan();
  return `
    <section class="panel shop-panel ${locked ? "shop-locked" : ""}" aria-label="Devil's Offerings">
      <div class="panel-header">
        <div>
          <div class="panel-title">Devil's Offerings</div>
        </div>
        <div class="reroll-control">
          <span class="reroll-cost">${currentRerollCost()} SIN</span>
          <button class="small-button" id="rerollShop" ${locked ? "disabled" : ""}>Reroll</button>
        </div>
      </div>
      <div class="shop-slots">
        ${locked ? `<div class="shop-lock-message">Satan has sealed Devil's Offerings.</div>` : state.shop.map((slot, index) => renderShopSlot(slot, index)).join("")}
      </div>
    </section>
  `;
}

function renderShopSlot(slot, index) {
  if (!slot || slot.sold) {
    return `<div class="item-card"><div class="empty-state">Sold out until reroll</div></div>`;
  }

  const item = slot.item;
  const cost = shopPrice(item);
  const passiveCopies = item.type === "passive" ? directPassiveStack(item.id) : 0;
  const full =
    item.type === "passive"
      ? passiveCopies === 0 && state.player.passives.length >= passiveLimit()
      : state.player.actives.length >= activeInventoryLimit();
  const disabled = shopDisabledBySatan() || !canSpendCredits(cost) || full ? "disabled" : "";
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
        <span class="item-kind">${item.type === "passive" ? "Seal" : "Artifact"}</span>
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
  const activeCards = count
    ? state.player.actives.map((item, index) => renderActiveItem(item, index)).join("")
    : `<div class="empty-state">No Artifacts</div>`;

  return `
    <section class="panel active-panel" aria-label="Artifacts">
      <div class="panel-header">
        <div>
          <div class="panel-title">Artifacts</div>
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
  const sellDisabled = actionLocked ? "disabled" : "";
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
        <span class="item-kind">Artifact</span>
      </div>
      <div class="item-actions">
        <button class="small-button" data-use-active="${index}" ${useDisabled}>Use</button>
        <button class="small-button sell-button" data-sell-active="${index}" ${sellDisabled}>Sell</button>
      </div>
    </article>
  `;
}

function renderPassives() {
  const slots = [];
  for (let index = 0; index < passiveLimit(); index += 1) {
    const item = state.player.passives[index];
    if (!item) {
      slots.push(`<div class="passive-slot empty">Empty Seal slot</div>`);
      continue;
    }
    const sale = Math.floor((item.price * (item.stack || 1)) / 2) + (item.saleBonus || 0);
    const displayName = passiveDisplayName(item);
    const description = itemDescription(item);
    const suppressedBy = suppressingBossForSeal(item.id);
    const disabledNotice = suppressedBy ? `Disabled while ${suppressedBy.name} is alive.\n` : "";
    const tooltip = `${displayName}\n${disabledNotice}${description}\nSell ${sale} SIN`;
    const triggeredClass = state.roundState?.triggeredPassiveIds?.has(item.id) ? "triggered" : "";
    const suppressedClass = suppressedBy ? "suppressed" : "";
    const counterBadge = item.id === "p39" ? `<div class="passive-counter">Stacks ${item.counter || 0}</div>` : "";
    const sealImage = renderSealSigil(item, "equipped-seal-sigil");
    slots.push(`
      <article class="passive-slot ${triggeredClass} ${suppressedClass}" data-tooltip="${escapeAttr(tooltip)}">
        ${sealImage}
        ${counterBadge}
        <button class="small-button sell-button seal-sell-button" data-sell-passive="${index}" aria-label="Sell ${escapeAttr(displayName)}">Sell</button>
      </article>
    `);
  }

  return `<footer class="passive-bar" aria-label="Seals">${slots.join("")}</footer>`;
}

function renderOverlay() {
  if (!state.gameOver) return `<div class="overlay"></div>`;
  return `
    <div class="overlay visible">
      <section class="end-card">
        <h1 class="end-title">Game Over</h1>
        <p class="end-copy">You reached round ${state.round} with ${state.eliminations} eliminations.</p>
        <button class="primary-button" id="restartGame">Restart</button>
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
  if (nextRound) nextRound.addEventListener("click", pvpNextRound);

  const restart = document.querySelector("#pvpRestart");
  if (restart) restart.addEventListener("click", restartPvpMode);
}

function bindEvents() {
  document.querySelectorAll("[data-menu-action]").forEach((button) => {
    button.addEventListener("click", () => handleMenuAction(button.dataset.menuAction));
  });

  const musicVolume = document.querySelector("#musicVolume");
  if (musicVolume) {
    musicVolume.addEventListener("input", () => {
      updateSoundSetting("musicVolume", musicVolume.value, false);
      const valueLabel = document.querySelector("#musicVolumeValue");
      if (valueLabel) valueLabel.textContent = `${musicVolume.value}%`;
    });
  }

  const sfxVolume = document.querySelector("#sfxVolume");
  if (sfxVolume) {
    sfxVolume.addEventListener("input", () => {
      updateSoundSetting("sfxVolume", sfxVolume.value, false);
      const valueLabel = document.querySelector("#sfxVolumeValue");
      if (valueLabel) valueLabel.textContent = `${sfxVolume.value}%`;
    });
  }

  const soundMuted = document.querySelector("#soundMuted");
  if (soundMuted) {
    soundMuted.addEventListener("change", () => updateSoundSetting("muted", soundMuted.checked));
  }

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
    mainAction.addEventListener("click", () => {
      if (state.stage === "guess") submitGuess();
      else if (state.stage === "active") readyRound();
      else if (state.stage === "summary") advanceAfterSummary();
      else if (state.stage === "ended") startGame();
    });
  }

  const guessInput = document.querySelector("#guessInput");
  if (guessInput) {
    guessInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && state.stage === "guess") submitGuess();
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
    document.querySelectorAll("[data-tooltip]").forEach((element) => {
      element.addEventListener("mouseenter", (event) => {
        floatingTooltip.textContent = element.dataset.tooltip;
        floatingTooltip.classList.add("visible");
        positionFloatingTooltip(event, floatingTooltip);
      });
      element.addEventListener("mousemove", (event) => {
        positionFloatingTooltip(event, floatingTooltip);
      });
      element.addEventListener("mouseleave", () => {
        floatingTooltip.classList.remove("visible");
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
}

window.addEventListener("resize", updateFullscreenLayoutClass);
document.addEventListener("fullscreenchange", updateFullscreenLayoutClass);

installSoundtrack();
updateFullscreenLayoutClass();
showMainMenu();
