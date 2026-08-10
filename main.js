"use strict";

const BASE_PASSIVE_LIMIT = 3;
const ACTIVE_LIMIT = 5;
const BOT_COUNT = 5;
const PLAYER_MAX_HP = 100;
const BOT_MIN_HP = 20;
const BOT_MAX_HP = 60;
const STARTING_CREDITS = 8;
const BASE_TARGET_MODIFIER = 0.8;
const ACTIVE_USES_PER_ROUND = 2;
const UNIQUE_BOSS_INTERVAL = 8;
const ENDLESS_BOSS_INTERVAL = 5;

const ITEMS = {
  p1: {
    id: "p1",
    type: "passive",
    name: "Wiretap Lens",
    price: 6,
    description: "At the start of each round, reveals two extra bot guesses before you commit."
  },
  p2: {
    id: "p2",
    type: "passive",
    name: "Rule of Three",
    price: 8,
    description: "Any submitted guess that is a multiple of 3 becomes 50 before the target is calculated."
  },
  p3: {
    id: "p3",
    type: "passive",
    name: "Divisible Verdict",
    price: 7,
    description: "If the rounded target is a multiple of 3, all bots take 20 extra damage."
  },
  p4: {
    id: "p4",
    type: "passive",
    name: "Edge Gambit",
    price: 9,
    description: "If your submitted guess is 0, 50, or 100, bot penalty damage is doubled this round."
  },
  p5: {
    id: "p5",
    type: "passive",
    name: "Spite Circuit",
    price: 10,
    description: "Whenever you take damage, all bots take half as much extra damage, rounded up."
  },
  p6: {
    id: "p6",
    type: "passive",
    name: "Critical Calipers",
    price: 8,
    description: "Your CRITICAL hit triggers when your guess is within 2 of the right integer."
  },
  p7: {
    id: "p7",
    type: "passive",
    name: "Pressure Spike",
    price: 9,
    description: "When you hit CRITICAL, it deals 20 damage to everyone else instead of 10."
  },
  p8: {
    id: "p8",
    type: "passive",
    name: "Slow Repair",
    price: 6,
    description: "Heal 2 health at the end of every round."
  },
  p9: {
    id: "p9",
    type: "passive",
    name: "Victory Patch",
    price: 9,
    description: "Every bot elimination heals you for 5 health."
  },
  p10: {
    id: "p10",
    type: "passive",
    name: "Gold-Plated Salvage",
    price: 15,
    description: "When a bot with more than 50 max health dies, heal 20 and gain 3 credits."
  },
  p11: {
    id: "p11",
    type: "passive",
    name: "Scrap Lottery",
    price: 10,
    description: "When a bot with 20 or less max health dies, gain a random active item if you have room."
  },
  p12: {
    id: "p12",
    type: "passive",
    name: "Credit Furnace",
    price: 14,
    description: "At end of round, for every 10 credits you have, deal 2 damage to everyone, including you."
  },
  p13: {
    id: "p13",
    type: "passive",
    name: "Sweep Dividend",
    price: 13,
    description: "If you make more than one elimination in a round, heal 20 and gain 5 credits."
  },
  p14: {
    id: "p14",
    type: "passive",
    name: "Target Sink",
    price: 12,
    description: "Every revealed target is reduced by 20."
  },
  a6: {
    id: "a6",
    type: "active",
    name: "Modifier Lever",
    price: 3,
    description: "One use. During reveal, add 10 to the target."
  },
  a7: {
    id: "a7",
    type: "active",
    name: "Identity Swap",
    price: 5,
    description: "One use. Pick a bot and swap your effective guess with theirs."
  },
  a8: {
    id: "a8",
    type: "active",
    name: "Echo Weight",
    price: 4,
    description: "One use. Pick a bot; their guess counts five times for the target average."
  },
  a9: {
    id: "a9",
    type: "active",
    name: "Signal Jammer",
    price: 3,
    description: "One use. Pick a bot; remove their guess from the target average, though they still take damage."
  },
  a10: {
    id: "a10",
    type: "active",
    name: "Bounty Tripler",
    price: 4,
    description: "One use. Bot eliminations pay triple credits this round."
  },
  a11: {
    id: "a11",
    type: "active",
    name: "Null Insurance",
    price: 4,
    description: "One use. You take no damage this round, including CRITICAL damage."
  },
  a12: {
    id: "a12",
    type: "active",
    name: "Risky Medkit",
    price: 3,
    description: "One use. Heal 20. There is a 33% chance the next elimination spawns a boss."
  },
  a13: {
    id: "a13",
    type: "active",
    name: "Triage Beam",
    price: 4,
    description: "One use. Deal 20 non-lethal damage to one bot, then heal another bot for 20."
  }
};

const PASSIVE_IDS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12", "p13", "p14"];
const ACTIVE_IDS = ["a6", "a7", "a8", "a9", "a10", "a11", "a12", "a13"];
const BOSS_PASSIVES = {
  ruleFive: {
    name: "Rule of Five",
    description: "While this boss lives, guesses that are multiples of 5 become 50 before target calculation."
  },
  oddVerdict: {
    name: "Odd Verdict",
    description: "If the CRITICAL integer is odd, you take 15 extra damage."
  },
  edge: {
    name: "Hard Edge",
    description: "If this boss guesses 0 or 100, your penalty damage is doubled."
  },
  spite: {
    name: "Mirror Spite",
    description: "Whenever this boss takes damage, you take one third as much, rounded up."
  },
  wideCrit: {
    name: "Wide Critical",
    description: "This boss hits CRITICAL within 1 of the right integer."
  },
  heavyCrit: {
    name: "Heavy Critical",
    description: "This boss's CRITICAL hit deals 15 damage instead of 10."
  },
  repair: {
    name: "Boss Repair",
    description: "This boss heals 3 health at the end of every round."
  }
};
const BOSS_PASSIVE_KEYS = Object.keys(BOSS_PASSIVES);

const BOT_ARCHETYPES = [
  { type: "Anchor", anchor: 58, noise: 10, color: "#75c9c1", aggression: 0.48 },
  { type: "Analyst", anchor: 39, noise: 8, color: "#e1b84c", aggression: 0.34 },
  { type: "Follower", anchor: 52, noise: 9, color: "#7fc47b", aggression: 0.42 },
  { type: "Stubborn", anchor: 68, noise: 7, color: "#ef6f61", aggression: 0.6 },
  { type: "Drifter", anchor: 31, noise: 14, color: "#b68de6", aggression: 0.68 },
  { type: "Caller", anchor: 46, noise: 11, color: "#d58a4f", aggression: 0.52 }
];

const BOT_NAMES = [
  "Bishop",
  "Nix",
  "Vault",
  "Hex",
  "Marl",
  "Kestrel",
  "Sable",
  "Juno",
  "Kite",
  "Vera",
  "Calder",
  "Rook",
  "Mica",
  "Iris",
  "Orin",
  "Slate",
  "Tess",
  "Warden"
];

const UNIQUE_BOSS_SPECS = {
  zilon: {
    key: "zilon",
    name: "Zilon",
    personality: "Caller",
    modifierOverride: 1.5,
    shopTax: 3,
    descriptions: [
      "Shop prices cost 3 more credits while Zilon is alive.",
      "The target modifier becomes 1.5 while Zilon is alive."
    ]
  },
  dantre: {
    key: "dantre",
    name: "Dantre",
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
    personality: "Analyst",
    modifierOverride: 1,
    grantsBuffs: true,
    descriptions: [
      "All bots receive a random boss-variant passive while Pyros is alive.",
      "The target modifier becomes 1.0 while Pyros is alive."
    ]
  },
  threon: {
    key: "threon",
    name: "Threon",
    personality: "Drifter",
    guessLimit: 200,
    lowHealthDamage: true,
    descriptions: [
      "You can guess from 0 to 200 while Threon is alive.",
      "Each round, Threon deals 1 damage for every 10 health you are below 60, rounded up."
    ]
  }
};
const UNIQUE_BOSS_KEYS = Object.keys(UNIQUE_BOSS_SPECS);

const state = {
  round: 1,
  stage: "guess",
  player: {
    hp: PLAYER_MAX_HP,
    credits: STARTING_CREDITS,
    passives: [],
    actives: []
  },
  bots: [],
  shop: [],
  log: [],
  roundState: null,
  previousTarget: null,
  gameMemory: [],
  nextBotId: 1,
  nextItemUid: 1,
  eliminations: 0,
  bossKills: 0,
  itemsBought: 0,
  bossSpawnCount: 0,
  uniqueBossQueue: [],
  bossQueued: false,
  pendingActive: null,
  gameOver: false
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(values) {
  return values[randomInt(0, values.length - 1)];
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
  return state.player.passives.some((item) => item.id === id);
}

function passiveLimit() {
  let limit = BASE_PASSIVE_LIMIT;
  if (state.bossKills >= 2) limit += 1;
  if (state.bossKills >= 4) limit += 1;
  if (state.bossKills >= 10) limit += 1;
  return limit;
}

function rerollCost() {
  return 1 + Math.floor(state.itemsBought / 2);
}

function currentRerollCost() {
  return rerollCost() + shopTax();
}

function botHasPassive(bot, key) {
  return Boolean(bot.passiveKeys?.includes(key) || bot.buffPassiveKey === key);
}

function hasBossPassive(key) {
  return state.bots.some((bot) => botHasPassive(bot, key));
}

function aliveUniqueBoss(key, excludedIds = new Set()) {
  return state.bots.some((bot) => bot.isBoss && bot.uniqueKey === key && !excludedIds.has(bot.id) && bot.hp > 0);
}

function currentTargetModifier() {
  const modifierBosses = state.bots
    .filter((bot) => bot.isBoss && bot.hp > 0 && bot.modifierOverride !== null && bot.modifierOverride !== undefined)
    .sort((left, right) => right.bossOrder - left.bossOrder);
  return modifierBosses.length ? modifierBosses[0].modifierOverride : BASE_TARGET_MODIFIER;
}

function playerGuessLimit() {
  return aliveUniqueBoss("threon") ? 200 : 100;
}

function shopTax() {
  return aliveUniqueBoss("zilon") ? 3 : 0;
}

function shopPrice(item) {
  return item.price + shopTax();
}

function bossPassiveSummary(bot) {
  if (!bot?.isBoss) return "";
  const names = [];
  if (bot.uniqueKey) names.push(`${UNIQUE_BOSS_SPECS[bot.uniqueKey].name} Kit`);
  bot.passiveKeys?.forEach((key) => names.push(BOSS_PASSIVES[key].name));
  if (bot.buffPassiveKey) names.push(`Pyros Gift: ${BOSS_PASSIVES[bot.buffPassiveKey].name}`);
  return names.join(" + ") || "No passive";
}

function bossPassiveDescription(bot) {
  if (!bot?.isBoss) return "";
  const descriptions = [];
  if (bot.uniqueKey) descriptions.push(...UNIQUE_BOSS_SPECS[bot.uniqueKey].descriptions);
  bot.passiveKeys?.forEach((key) => descriptions.push(BOSS_PASSIVES[key].description));
  if (bot.buffPassiveKey) descriptions.push(`Pyros gift: ${BOSS_PASSIVES[bot.buffPassiveKey].description}`);
  return descriptions.join(" ");
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return String(Math.ceil(value));
}

function itemCopy(id) {
  const uid = `${id}-${state.nextItemUid++}`;
  return { ...ITEMS[id], uid };
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

function healPlayer(amount, reason) {
  const before = state.player.hp;
  state.player.hp = Math.min(PLAYER_MAX_HP, state.player.hp + amount);
  const healed = state.player.hp - before;
  if (healed > 0 && reason) addRoundEvent(`${reason} healed you for ${healed}.`);
  return healed;
}

function healBot(bot, amount, reason) {
  const before = bot.hp;
  bot.hp = Math.min(bot.maxHp, bot.hp + amount);
  const healed = bot.hp - before;
  if (healed > 0 && reason) addRoundEvent(`${reason} healed ${bot.name} for ${healed}.`);
  return healed;
}

function botReward(bot) {
  return bot.isBoss ? bot.reward * 2 : bot.reward;
}

function randomBotHealth() {
  return randomInt(BOT_MIN_HP / 10, BOT_MAX_HP / 10) * 10;
}

function archetypeByType(type) {
  return BOT_ARCHETYPES.find((archetype) => archetype.type === type) || randomFrom(BOT_ARCHETYPES);
}

function randomBossPassiveKeys(count) {
  return shuffled(BOSS_PASSIVE_KEYS).slice(0, count);
}

function createBot(options = {}) {
  const isBoss = Boolean(options.boss);
  const bossSpec = options.bossSpec || null;
  const uniqueSpec = bossSpec?.uniqueKey ? UNIQUE_BOSS_SPECS[bossSpec.uniqueKey] : null;
  const archetype = uniqueSpec ? archetypeByType(uniqueSpec.personality) : randomFrom(BOT_ARCHETYPES);
  const bossOrder = isBoss ? state.bossSpawnCount + 1 : 0;
  const maxHp = isBoss ? 80 + state.bossSpawnCount * 20 : randomBotHealth();
  const passiveKeys = isBoss
    ? uniqueSpec
      ? []
      : randomBossPassiveKeys(2)
    : [];
  const bot = {
    id: state.nextBotId++,
    name: isBoss ? uniqueSpec?.name || "PandoriumBeast" : `${randomFrom(BOT_NAMES)}-${randomInt(10, 99)}`,
    type: isBoss ? "Boss" : archetype.type,
    color: isBoss ? "#d64f45" : archetype.color,
    anchor: clamp(archetype.anchor + randomInt(-8, 8), 0, 100),
    aggression: isBoss ? Math.min(0.75, archetype.aggression + 0.12) : archetype.aggression,
    noise: isBoss ? Math.max(7, archetype.noise - 1) : archetype.noise,
    hp: maxHp,
    maxHp,
    reward: randomInt(1, 5),
    isBoss,
    bossOrder,
    uniqueKey: uniqueSpec?.key || null,
    modifierOverride: uniqueSpec?.modifierOverride ?? null,
    shopTax: uniqueSpec?.shopTax || 0,
    eliminationDamage: uniqueSpec?.eliminationDamage || 0,
    lowHealthDamage: Boolean(uniqueSpec?.lowHealthDamage),
    grantsBuffs: Boolean(uniqueSpec?.grantsBuffs),
    passiveKeys,
    buffPassiveKey: null,
    uniqueDescriptions: uniqueSpec?.descriptions || [],
    memory: isBoss ? state.gameMemory.slice() : [],
    plannedGuess: null,
    lastDamage: 0,
    deathNotice: null,
    revealedByPassive: false,
    fresh: true
  };
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
  if (!aliveUniqueBoss("pyros")) return;
  state.bots.forEach((bot) => {
    if (!bot.buffPassiveKey) bot.buffPassiveKey = randomFrom(BOSS_PASSIVE_KEYS);
  });
}

function rerollShop() {
  state.shop = [drawShopItem(PASSIVE_IDS), drawShopItem(ACTIVE_IDS), drawShopItem(ACTIVE_IDS)];
}

function drawShopItem(pool) {
  const id = randomFrom(pool);
  return { item: itemCopy(id), sold: false };
}

function spendCredits(amount) {
  if (state.player.credits < amount) return false;
  state.player.credits -= amount;
  return true;
}

function startGame() {
  state.round = 1;
  state.stage = "guess";
  state.player.hp = PLAYER_MAX_HP;
  state.player.credits = STARTING_CREDITS;
  state.player.passives = [];
  state.player.actives = [];
  state.log = [];
  state.roundState = null;
  state.previousTarget = null;
  state.gameMemory = [];
  state.pendingActive = null;
  state.gameOver = false;
  state.nextBotId = 1;
  state.nextItemUid = 1;
  state.eliminations = 0;
  state.bossKills = 0;
  state.itemsBought = 0;
  state.bossSpawnCount = 0;
  state.uniqueBossQueue = shuffled(UNIQUE_BOSS_KEYS);
  state.bossQueued = false;
  resetBotsForRun();
  rerollShop();
  beginRound();
  addLog("Round 1 begins. The table continues until you fall.");
  render();
}

function beginRound() {
  state.stage = "guess";
  state.pendingActive = null;
  state.roundState = {
    playerSubmittedGuess: null,
    playerEffectiveGuess: null,
    botSubmittedGuesses: new Map(),
    botEffectiveGuesses: new Map(),
    targetModifier: currentTargetModifier(),
    targetOffset: hasPassive("p14") ? -20 : 0,
    target: null,
    criticalInteger: null,
    tableAverage: null,
    extraAverageGuesses: [],
    removedBotIds: new Set(),
    activeUses: 0,
    bountyMultiplier: 1,
    edgeGambit: false,
    playerShielded: false,
    multiEliminationBonusPaid: false,
    eliminationsThisRound: 0,
    revealedBotIds: new Set(),
    penaltiesApplied: false,
    criticalHitKeys: new Set(),
    roundEvents: []
  };

  state.bots.forEach((bot) => {
    bot.fresh = bot.memory.length === 0;
    bot.lastDamage = 0;
    bot.deathNotice = null;
    bot.plannedGuess = planBotGuess(bot);
    bot.revealedByPassive = false;
  });

  applyGuessReveals();
}

function planBotGuess(bot) {
  const memory = bot.memory;
  let guess;

  if (!memory.length) {
    guess = bot.anchor + randomInt(-16, 16);
  } else {
    const last = memory[memory.length - 1];
    const prev = memory[memory.length - 2] || last;
    const trend = last.target - prev.target;
    const tablePull = last.tableAverage * 0.8;

    if (bot.type === "Analyst") {
      guess = last.target + trend * 0.55 + randomInt(-bot.noise, bot.noise);
    } else if (bot.type === "Follower") {
      guess = last.playerGuess * 0.52 + last.target * 0.48 + randomInt(-bot.noise, bot.noise);
    } else if (bot.type === "Stubborn") {
      guess = bot.anchor * 0.72 + last.target * 0.28 + randomInt(-bot.noise, bot.noise);
    } else if (bot.type === "Drifter") {
      guess = last.target * 0.56 + tablePull * 0.44 + randomInt(-bot.noise * 2, bot.noise * 2);
    } else if (bot.type === "Caller") {
      guess = last.botAverage * 0.7 + last.target * 0.3 + randomInt(-bot.noise, bot.noise);
    } else {
      guess = bot.anchor * 0.42 + last.target * 0.58 + randomInt(-bot.noise, bot.noise);
    }

    if (bot.isBoss) guess = guess * 0.82 + last.target * 0.18;
  }

  if (Math.random() < bot.aggression) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    guess += direction * randomInt(8, 24);
  }

  if (Math.random() < bot.aggression * 0.22) {
    guess = randomFrom([0, 100, randomInt(0, 18), randomInt(82, 100), 50 + randomInt(-18, 18)]);
  }

  return Math.ceil(clamp(guess, 0, 100));
}

function applyGuessReveals() {
  if (state.stage !== "guess" || !state.roundState) return;
  const revealCount = 1 + (hasPassive("p1") ? 2 : 0);
  const hiddenBots = shuffled(state.bots.filter((bot) => !bot.revealedByPassive));
  hiddenBots.slice(0, revealCount).forEach((bot) => {
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

  state.bots.forEach((bot) => {
    round.botSubmittedGuesses.set(bot.id, bot.plannedGuess);
    round.botEffectiveGuesses.set(bot.id, applyGuessMutation(bot.name, bot.plannedGuess));
  });

  round.edgeGambit = hasPassive("p4") && [0, 50, 100].includes(guess);
  if (round.edgeGambit) {
    round.roundEvents.push("Edge Gambit is armed: bot penalty damage will be doubled.");
  }

  recalculateTarget();
  state.stage = "active";
  addLog(`Target revealed at ${formatNumber(round.target)}. CRITICAL integer: ${round.criticalInteger}.`);
  render();
}

function applyGuessMutation(name, guess) {
  if (hasPassive("p2") && guess % 3 === 0) {
    state.roundState.roundEvents.push(`${name}'s ${guess} became 50 by Rule of Three.`);
    return 50;
  }
  if (hasBossPassive("ruleFive") && guess % 5 === 0) {
    state.roundState.roundEvents.push(`${name}'s ${guess} became 50 by Rule of Five.`);
    return 50;
  }
  return guess;
}

function recalculateTarget() {
  const round = state.roundState;
  const values = [round.playerEffectiveGuess];

  state.bots.forEach((bot) => {
    if (!round.removedBotIds.has(bot.id)) {
      values.push(round.botEffectiveGuesses.get(bot.id));
    }
  });

  round.extraAverageGuesses.forEach((entry) => {
    values.push(entry.guess);
  });

  round.tableAverage = average(values);
  const rawTarget = round.tableAverage * round.targetModifier + round.targetOffset;
  round.target = Math.ceil(clamp(rawTarget, 0, 200));
  round.criticalInteger = round.target;
}

function readyRound() {
  if (state.stage !== "active" || !state.roundState || state.roundState.penaltiesApplied) return;
  if (state.pendingActive) {
    addLog("Finish the active item target first.");
    render();
    return;
  }
  applyPenalties();
  render();
}

function applyPenalties() {
  const round = state.roundState;
  round.penaltiesApplied = true;
  recalculateTarget();
  state.previousTarget = round.target;

  const botDamages = new Map();
  let playerDamage = Math.ceil(Math.abs(round.playerEffectiveGuess - round.target));
  const bossEdgeBots = [];

  state.bots.forEach((bot) => {
    let damage = Math.ceil(Math.abs(round.botEffectiveGuesses.get(bot.id) - round.target));
    if (round.edgeGambit) damage *= 2;
    if (botHasPassive(bot, "edge") && [0, 100].includes(round.botEffectiveGuesses.get(bot.id))) {
      bossEdgeBots.push(bot);
    }
    botDamages.set(bot.id, damage);
  });

  if (bossEdgeBots.length) {
    playerDamage *= 2;
    round.roundEvents.push(`${bossEdgeBots.map((bot) => bot.name).join(", ")} triggered Edge Gambit against you.`);
  }

  if (hasPassive("p3") && round.criticalInteger % 3 === 0) {
    state.bots.forEach((bot) => {
      botDamages.set(bot.id, botDamages.get(bot.id) + 20);
    });
    round.roundEvents.push("Divisible Verdict triggers for 20 damage to all bots.");
  }

  const bossVerdicts = state.bots.filter((bot) => botHasPassive(bot, "oddVerdict") && round.criticalInteger % 2 === 1);
  if (bossVerdicts.length) {
    playerDamage += 15 * bossVerdicts.length;
    round.roundEvents.push(`${bossVerdicts.map((bot) => bot.name).join(", ")} triggered Odd Verdict against you.`);
  }

  const threonBosses = state.bots.filter((bot) => bot.lowHealthDamage && bot.hp > 0);
  if (threonBosses.length && state.player.hp < 60) {
    const threonDamage = Math.ceil((60 - state.player.hp) / 10) * threonBosses.length;
    playerDamage += threonDamage;
    round.roundEvents.push(`Threon pressure adds ${threonDamage} damage.`);
  }

  const criticals = findCriticalHits();
  round.criticalHitKeys = new Set(criticals.map((hitter) => hitter.key));
  criticals.forEach((hitter) => {
    round.roundEvents.push(`${hitter.name} hit CRITICAL ${round.criticalInteger} for ${hitter.damage} damage.`);
    getParticipants().forEach((victim) => {
      if (victim.key === hitter.key) return;
      if (victim.kind === "player") {
        playerDamage += hitter.damage;
      } else {
        botDamages.set(victim.bot.id, botDamages.get(victim.bot.id) + hitter.damage);
      }
    });
  });

  state.bots.forEach((bot) => {
    if (!botHasPassive(bot, "spite")) return;
    const damageTaken = botDamages.get(bot.id);
    if (damageTaken <= 0) return;
    const spite = Math.ceil(damageTaken / 3);
    playerDamage += spite;
    round.roundEvents.push(`${bot.name}'s Mirror Spite adds ${spite} damage to you.`);
  });

  if (round.playerShielded) {
    if (playerDamage > 0) round.roundEvents.push(`Null Insurance prevented ${playerDamage} damage.`);
    playerDamage = 0;
  }

  if (hasPassive("p5") && playerDamage > 0) {
    const spiteDamage = Math.ceil(playerDamage / 2);
    state.bots.forEach((bot) => {
      botDamages.set(bot.id, botDamages.get(bot.id) + spiteDamage);
    });
    round.roundEvents.push(`Spite Circuit adds ${spiteDamage} damage to every bot.`);
  }

  state.player.hp = Math.max(0, state.player.hp - playerDamage);
  if (playerDamage > 0) {
    round.roundEvents.push(`You took ${playerDamage} damage.`);
  } else {
    round.roundEvents.push("You took no damage.");
  }

  const eliminated = [];
  state.bots.forEach((bot) => {
    const damage = botDamages.get(bot.id);
    bot.lastDamage = damage;
    bot.hp = Math.max(0, bot.hp - damage);
    round.roundEvents.push(`${bot.name} took ${damage} damage.`);
    if (bot.hp <= 0) eliminated.push(bot);
  });

  if (eliminated.length) {
    replaceEliminatedBots(eliminated);
  }

  applyPyrosBuffs();
  applyEndOfRoundPassives();
  applyRoundEliminationBonus();
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

function getParticipants() {
  const round = state.roundState;
  return [
    {
      key: "player",
      kind: "player",
      name: "You",
      guess: round.playerEffectiveGuess,
      window: hasPassive("p6") ? 2 : 0,
      damage: hasPassive("p7") ? 20 : 10
    },
    ...state.bots.map((bot) => ({
      key: `bot-${bot.id}`,
      kind: "bot",
      bot,
      name: bot.name,
      guess: round.botEffectiveGuesses.get(bot.id),
      window: botHasPassive(bot, "wideCrit") ? 1 : 0,
      damage: botHasPassive(bot, "heavyCrit") ? 15 : 10
    }))
  ];
}

function findCriticalHits() {
  const rightInteger = state.roundState.criticalInteger;
  return getParticipants().filter((participant) => {
    if (!Number.isFinite(participant.guess)) return false;
    return Math.abs(participant.guess - rightInteger) <= participant.window;
  });
}

function replaceEliminatedBots(eliminated) {
  const eliminatedById = new Map(eliminated.map((bot) => [bot.id, bot]));
  const dantreAlive = aliveUniqueBoss("dantre", new Set(eliminated.map((bot) => bot.id)));

  state.bots = state.bots.map((currentBot) => {
    const bot = eliminatedById.get(currentBot.id);
    if (!bot) return currentBot;

    const reward = botReward(bot) * state.roundState.bountyMultiplier;
    state.player.credits += reward;
    state.eliminations += 1;
    state.roundState.eliminationsThisRound += 1;
    state.roundState.roundEvents.push(`${bot.name} was eliminated. +${reward} credits.`);

    if (dantreAlive) {
      if (state.roundState.playerShielded) {
        state.roundState.roundEvents.push("Null Insurance prevented Dantre's elimination damage.");
      } else {
        state.player.hp = Math.max(0, state.player.hp - 3);
        state.roundState.roundEvents.push("Dantre dealt 3 damage for the elimination.");
      }
    }

    if (bot.isBoss) {
      state.bossKills += 1;
      if ([2, 4, 10].includes(state.bossKills)) {
        state.roundState.roundEvents.push(`Boss kill ${state.bossKills}: passive slot unlocked.`);
      }
    }

    applyEliminationPassives(bot);

    const bossSpec = nextBossSpecIfNeeded();
    const replacement = createBot({ boss: Boolean(bossSpec), bossSpec });
    replacement.deathNotice = `${bot.name} -${bot.lastDamage || 0} KO`;

    if (bossSpec) {
      const passive = bossPassiveSummary(replacement);
      state.roundState.roundEvents.push(`${replacement.name} enters as a boss with ${passive}.`);
    }

    return replacement;
  });
  applyPyrosBuffs();
}

function applyRoundEliminationBonus() {
  if (!hasPassive("p13")) return;
  const round = state.roundState;
  if (round.multiEliminationBonusPaid || round.eliminationsThisRound < 2) return;
  round.multiEliminationBonusPaid = true;
  healPlayer(20, "Sweep Dividend");
  state.player.credits += 5;
  round.roundEvents.push("Sweep Dividend paid 5 credits.");
}

function nextBossSpecIfNeeded() {
  if (state.bossQueued) {
    state.bossQueued = false;
    return takeNextBossSpec();
  }
  if (state.uniqueBossQueue.length) {
    if (state.eliminations > 0 && state.eliminations % UNIQUE_BOSS_INTERVAL === 0) {
      return takeNextBossSpec();
    }
    return null;
  }
  if (state.eliminations > 0 && state.eliminations % ENDLESS_BOSS_INTERVAL === 0) {
    return takeNextBossSpec();
  }
  return null;
}

function takeNextBossSpec() {
  if (state.uniqueBossQueue.length) {
    return { uniqueKey: state.uniqueBossQueue.shift() };
  }
  return { endless: true };
}

function applyEliminationPassives(bot) {
  if (hasPassive("p9")) {
    healPlayer(5, "Victory Patch");
  }

  if (hasPassive("p10") && bot.maxHp > 50) {
    healPlayer(20, "Gold-Plated Salvage");
    state.player.credits += 3;
    state.roundState.roundEvents.push("Gold-Plated Salvage paid 3 credits.");
  }

  if (hasPassive("p11") && bot.maxHp <= 20) {
    if (state.player.actives.length < ACTIVE_LIMIT) {
      const active = itemCopy(randomFrom(ACTIVE_IDS));
      state.player.actives.push(active);
      state.roundState.roundEvents.push(`Scrap Lottery found ${active.name}.`);
    } else {
      state.roundState.roundEvents.push("Scrap Lottery found an active, but your active inventory is full.");
    }
  }
}

function applyEndOfRoundPassives() {
  if (hasPassive("p12")) {
    const damage = Math.floor(state.player.credits / 10) * 2;
    if (damage > 0) {
      state.player.hp = Math.max(0, state.player.hp - damage);
      state.bots.forEach((bot) => {
        bot.lastDamage = (bot.lastDamage || 0) + damage;
        bot.hp = Math.max(0, bot.hp - damage);
      });
      state.roundState.roundEvents.push(`Credit Furnace dealt ${damage} damage to everyone.`);

      const eliminated = state.bots.filter((bot) => bot.hp <= 0);
      if (eliminated.length) replaceEliminatedBots(eliminated);
    }
  }

  if (hasPassive("p8")) {
    healPlayer(2, "Slow Repair");
  }

  state.bots.forEach((bot) => {
    if (botHasPassive(bot, "repair")) healBot(bot, 3, `${bot.name}'s Boss Repair`);
  });
}

function advanceAfterSummary() {
  if (state.stage !== "summary") return;
  state.round += 1;
  rerollShop();
  beginRound();
  render();
}

function rememberRound() {
  const round = state.roundState;
  const botGuessValues = state.bots
    .map((bot) => round.botEffectiveGuesses.get(bot.id))
    .filter((value) => Number.isFinite(value));
  const memoryEntry = {
    playerGuess: round.playerEffectiveGuess,
    target: round.target,
    tableAverage: round.tableAverage,
    botAverage: average(botGuessValues)
  };

  state.gameMemory.push(memoryEntry);

  state.bots.forEach((bot) => {
    const ownGuess = round.botEffectiveGuesses.get(bot.id);
    if (!Number.isFinite(ownGuess)) {
      if (bot.isBoss) bot.memory = state.gameMemory.slice();
      return;
    }
    bot.memory.push({
      ownGuess,
      ...memoryEntry
    });
    if (!bot.isBoss) bot.memory = bot.memory.slice(-5);
  });
}

function buyShopItem(slotIndex) {
  const slot = state.shop[slotIndex];
  if (!slot || slot.sold) return;
  const item = slot.item;
  const cost = shopPrice(item);

  if (state.player.credits < cost) {
    addLog("Not enough credits.");
    render();
    return;
  }

  if (item.type === "passive") {
    if (state.player.passives.length >= passiveLimit()) {
      addLog("Passive inventory is full.");
      render();
      return;
    }
    if (hasPassive(item.id)) {
      addLog("You already have that passive.");
      render();
      return;
    }
    spendCredits(cost);
    state.player.passives.push(itemCopy(item.id));
    state.itemsBought += 1;
    slot.sold = true;
    addLog(`Bought ${item.name}.`);
    if (item.id === "p14" && state.roundState && !state.roundState.penaltiesApplied) {
      state.roundState.targetOffset -= 20;
      if (state.roundState.target !== null) recalculateTarget();
    }
    applyGuessReveals();
    render();
    return;
  }

  if (state.player.actives.length >= ACTIVE_LIMIT) {
    addLog("Active inventory is full.");
    render();
    return;
  }

  spendCredits(cost);
  state.player.actives.push(itemCopy(item.id));
  state.itemsBought += 1;
  slot.sold = true;
  addLog(`Bought ${item.name}.`);
  render();
}

function rerollShopClick() {
  const cost = currentRerollCost();
  if (state.player.credits < cost) {
    addLog(`Reroll needs ${cost} credits.`);
    render();
    return;
  }
  spendCredits(cost);
  rerollShop();
  addLog(`Shop rerolled for ${cost}.`);
  render();
}

function sellPassive(index) {
  const [item] = state.player.passives.splice(index, 1);
  if (!item) return;
  const sale = Math.floor(item.price / 2);
  state.player.credits += sale;
  addLog(`Sold ${item.name} for ${sale} credits.`);
  render();
}

function sellActive(index) {
  const [item] = state.player.actives.splice(index, 1);
  if (!item) return;
  const sale = Math.floor(item.price / 2);
  state.player.credits += sale;
  addLog(`Sold ${item.name} for ${sale} credits.`);
  render();
}

function canUseActive() {
  return (
    state.stage === "active" &&
    state.roundState &&
    !state.roundState.penaltiesApplied &&
    state.roundState.activeUses < ACTIVE_USES_PER_ROUND
  );
}

function useActive(index) {
  if (!canUseActive()) {
    addLog("Actives can be used only during the reveal stage.");
    render();
    return;
  }

  if (state.pendingActive) {
    addLog("Finish the current active item first.");
    render();
    return;
  }

  const item = state.player.actives[index];
  if (!item) return;

  if (item.id === "a6") {
    state.roundState.targetOffset += 10;
    consumeActive(index, "Modifier Lever added 10 to the target.", item.uid);
    return;
  }

  if (["a7", "a8", "a9"].includes(item.id)) {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot" };
    addLog("Pick a bot to resolve the active.");
    render();
    return;
  }

  if (item.id === "a10") {
    state.roundState.bountyMultiplier = 3;
    consumeActive(index, "Bounty Tripler armed: eliminations pay triple this round.", item.uid);
    return;
  }

  if (item.id === "a11") {
    state.roundState.playerShielded = true;
    consumeActive(index, "Null Insurance armed: you will take no damage this round.", item.uid);
    return;
  }

  if (item.id === "a12") {
    const healed = healPlayer(20);
    let message = `Risky Medkit healed you for ${healed}.`;
    if (Math.random() < 0.33) {
      state.bossQueued = true;
      message += " A boss is queued for the next elimination.";
    }
    consumeActive(index, message, item.uid);
    return;
  }

  if (item.id === "a13") {
    state.pendingActive = { index, uid: item.uid, id: item.id, mode: "bot", step: "damage", damageBotId: null };
    addLog("Pick a bot to take 20 non-lethal damage.");
  }

  render();
}

function consumeActive(index, message, uid = state.pendingActive?.uid) {
  const actualIndex = uid ? state.player.actives.findIndex((item) => item.uid === uid) : index;
  if (actualIndex < 0) {
    state.pendingActive = null;
    addLog("That active is no longer available.");
    render();
    return;
  }
  const [item] = state.player.actives.splice(actualIndex, 1);
  if (!item) return;
  state.roundState.activeUses += 1;
  state.pendingActive = null;
  state.roundState.roundEvents.push(message);
  addLog(message);
  recalculateTarget();
  render();
}

function chooseBot(botId) {
  if (!state.pendingActive || state.pendingActive.mode !== "bot") return;
  const { id, index } = state.pendingActive;
  const bot = state.bots.find((candidate) => candidate.id === botId);
  if (!bot) return;
  const round = state.roundState;

  if (id === "a7") {
    const playerGuess = round.playerEffectiveGuess;
    const botGuess = round.botEffectiveGuesses.get(bot.id);
    round.playerEffectiveGuess = botGuess;
    round.playerSubmittedGuess = botGuess;
    round.botEffectiveGuesses.set(bot.id, playerGuess);
    round.botSubmittedGuesses.set(bot.id, playerGuess);
    consumeActive(index, `Identity Swap traded guesses with ${bot.name}.`);
    return;
  }

  if (id === "a8") {
    const guess = round.botEffectiveGuesses.get(bot.id);
    for (let copy = 0; copy < 4; copy += 1) {
      round.extraAverageGuesses.push({ botId: bot.id, guess });
    }
    consumeActive(index, `Echo Weight counted ${bot.name}'s guess five times.`);
    return;
  }

  if (id === "a9") {
    round.removedBotIds.add(bot.id);
    consumeActive(index, `Signal Jammer removed ${bot.name} from the average.`);
    return;
  }

  if (id === "a13") {
    resolveTriageBeam(bot);
  }
}

function resolveTriageBeam(bot) {
  const pending = state.pendingActive;
  if (pending.step === "damage") {
    const before = bot.hp;
    bot.hp = Math.max(1, bot.hp - 20);
    const dealt = before - bot.hp;
    state.roundState.roundEvents.push(`Triage Beam dealt ${dealt} non-lethal damage to ${bot.name}.`);
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
    healBot(bot, 20, "Triage Beam");
    consumeActive(pending.index, `Triage Beam healed ${bot.name}.`);
  }
}

function render() {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <main class="arena">
      ${renderTopbar()}
      ${renderTargetPanel()}
      ${renderBots()}
      ${renderConsole()}
      ${renderOverlay()}
    </main>
    <aside class="side-panel">
      ${renderShop()}
      ${renderActives()}
    </aside>
    ${renderPassives()}
  `;
  bindEvents();
}

function renderTopbar() {
  return `
    <section class="topbar" aria-label="Run status">
      <div class="stat-card">
        <span class="stat-label">Round</span>
        <span class="stat-value">${state.round}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">KOs / Boss</span>
        <span class="stat-value">${state.eliminations}/${state.bossKills}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Credits</span>
        <span class="stat-value">${state.player.credits}</span>
      </div>
      <div class="stat-card health-wrap">
        <div class="health-row">
          <span class="stat-label">Health</span>
          <strong>${state.player.hp}/${PLAYER_MAX_HP}</strong>
        </div>
        <div class="health-bar">
          <div class="health-fill" style="width: ${state.player.hp}%"></div>
        </div>
      </div>
    </section>
  `;
}

function renderTargetPanel() {
  const round = state.roundState;
  const target = round && round.target !== null ? formatNumber(round.target) : "--";
  const previousTarget = state.previousTarget !== null ? formatNumber(state.previousTarget) : "--";
  const avg = round && round.tableAverage !== null ? formatNumber(round.tableAverage) : "--";
  const modifier = round ? round.targetModifier.toFixed(1) : BASE_TARGET_MODIFIER.toFixed(1);
  const offset = round ? round.targetOffset : 0;
  const critical = round && round.criticalInteger !== null ? round.criticalInteger : "--";
  const details =
    state.stage === "guess"
      ? `Previous target: ${previousTarget}`
      : `Previous: ${previousTarget}. Average ${avg} x ${modifier}. Offset ${offset}. CRITICAL: ${critical}`;

  return `
    <section class="target-panel" aria-label="Target">
      <div class="target-value">
        <span class="stat-label">Target</span>
        <strong>${target}</strong>
      </div>
      <div class="target-detail">${details}</div>
    </section>
  `;
}

function renderBots() {
  const pendingPick = state.pendingActive && state.pendingActive.mode === "bot";
  return `
    <section class="bot-grid" aria-label="Bot players">
      ${state.bots.map((bot) => renderBot(bot, pendingPick)).join("")}
    </section>
  `;
}

function renderBot(bot, pendingPick) {
  const round = state.roundState;
  const submitted = round?.botSubmittedGuesses.get(bot.id);
  const effective = round?.botEffectiveGuesses.get(bot.id);
  const revealed =
    state.stage !== "guess" ? formatNumber(effective) : bot.revealedByPassive ? bot.plannedGuess : "--";
  const rawNote =
    state.stage !== "guess" && submitted !== effective ? `Raw ${submitted}` : bot.revealedByPassive ? "Revealed" : "Guess";
  const memoryText = bot.memory.length ? `${bot.memory.length} rounds` : "No memory";
  const pickClass = pendingPick ? "pickable" : "";
  const freshClass = bot.fresh ? "fresh" : "";
  const bossClass = bot.isBoss ? "boss" : "";
  const faceClass = bot.isBoss ? "boss-face" : "";
  const typeLabel = bot.isBoss ? `Boss: ${bossPassiveSummary(bot)}` : bot.type;
  const removed = round?.removedBotIds.has(bot.id) ? "Jammed" : rawNote;
  const criticalGuessClass = round?.criticalHitKeys?.has(`bot-${bot.id}`) ? "critical-guess" : "";
  const damageBadge =
    bot.lastDamage > 0 && state.stage !== "guess" ? `<div class="damage-badge">-${bot.lastDamage}</div>` : "";
  const deathBadge = bot.deathNotice ? `<div class="death-badge">${bot.deathNotice}</div>` : "";
  const bossTooltip = bot.isBoss ? `<span class="tooltip boss-tooltip">${bossPassiveDescription(bot)}</span>` : "";
  const reward = botReward(bot);
  const pickButton = pendingPick
    ? `<button class="pick-button" data-pick-bot="${bot.id}">Pick</button>`
    : "";

  return `
    <article class="bot-card ${pickClass} ${freshClass} ${bossClass}" style="--bot-color: ${bot.color}">
      ${damageBadge}
      ${deathBadge}
      <div class="bot-face ${faceClass}"><span class="bot-mouth"></span></div>
      <div class="bot-title">
        <div class="bot-name" title="${bot.name}">${bot.name}</div>
        <div class="bot-reward" title="Credits on elimination">+${reward}</div>
      </div>
      <div class="bot-type ${bot.isBoss ? "boss-type" : ""}" title="${typeLabel}">${typeLabel}</div>
      <div class="bot-stats">
        <div class="mini-stat">
          <span>${removed}</span>
          <strong class="${criticalGuessClass}">${revealed}</strong>
        </div>
        <div class="mini-stat">
          <span>Memory</span>
          <strong>${memoryText}</strong>
        </div>
        <div class="mini-stat bot-health">
          <span>Health ${bot.hp}/${bot.maxHp}</span>
          <div class="health-bar">
            <div class="health-fill" style="width: ${(bot.hp / bot.maxHp) * 100}%"></div>
          </div>
        </div>
      </div>
      ${pickButton}
      ${bossTooltip}
    </article>
  `;
}

function renderConsole() {
  const round = state.roundState;
  let buttonText = "Guess";
  let hint = "";
  let disabled = "";
  let inputDisabled = "";

  if (state.stage === "active") {
    buttonText = "Ready";
    inputDisabled = "disabled";
    disabled = state.pendingActive ? "disabled" : "";
    hint = `${round.activeUses}/${ACTIVE_USES_PER_ROUND} active items used. Ready applies penalties.`;
  } else if (state.stage === "summary") {
    buttonText = "Next Round";
    inputDisabled = "disabled";
    hint = "Penalties are locked in. The shop is still available before you advance.";
  } else if (state.stage === "ended") {
    buttonText = "Restart";
    inputDisabled = "disabled";
    hint = "Run ended.";
  }

  const value = round?.playerSubmittedGuess ?? "";
  const maxGuess = playerGuessLimit();
  const criticalInputClass = round?.criticalHitKeys?.has("player") ? "critical-guess" : "";
  const pendingText = renderPendingText();

  return `
    <section class="center-console" aria-label="Player action">
      <div class="console-row">
        <input
          id="guessInput"
          class="guess-input ${criticalInputClass}"
          type="number"
          min="0"
          max="${maxGuess}"
          step="1"
          value="${value}"
          ${inputDisabled}
        />
        <button id="mainAction" class="primary-button" ${disabled}>${buttonText}</button>
      </div>
      ${hint ? `<div class="console-hint">${hint}</div>` : ""}
      <div class="pending-panel ${state.pendingActive ? "visible" : ""}">${pendingText}</div>
    </section>
  `;
}

function renderPendingText() {
  if (!state.pendingActive) return "";
  const item = state.player.actives.find((active) => active.uid === state.pendingActive.uid);
  if (!item) return "";
  if (state.pendingActive.id === "a6") return "Modifier Lever adds 10 to the target.";
  if (state.pendingActive.id === "a13" && state.pendingActive.step === "heal") {
    return "Triage Beam: pick a different bot to heal for 20.";
  }
  return `${item.name}: pick a bot card to resolve it.`;
}

function renderShop() {
  return `
    <section class="panel shop-panel" aria-label="Shop">
      <div class="panel-header">
        <div>
          <div class="panel-title">Shop</div>
          <div class="panel-subtitle">One passive, two actives. Reroll costs ${currentRerollCost()}.</div>
        </div>
        <button class="small-button" id="rerollShop">Reroll</button>
      </div>
      <div class="shop-slots">
        ${state.shop.map((slot, index) => renderShopSlot(slot, index)).join("")}
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
  const ownedPassive = item.type === "passive" && hasPassive(item.id);
  const full =
    item.type === "passive"
      ? state.player.passives.length >= passiveLimit()
      : state.player.actives.length >= ACTIVE_LIMIT;
  const disabled = state.player.credits < cost || ownedPassive || full ? "disabled" : "";
  const buttonText = ownedPassive ? "Owned" : full ? "Full" : `Buy ${cost}`;

  return `
    <article class="item-card ${item.type}">
      <div class="item-top">
        <div>
          <div class="item-name">${item.name}</div>
          <div class="price">${cost} credits</div>
        </div>
        <span class="item-kind">${item.type}</span>
      </div>
      <div class="item-actions one">
        <button class="small-button" data-buy="${index}" ${disabled}>${buttonText}</button>
      </div>
      <span class="tooltip">${item.description}</span>
    </article>
  `;
}

function renderActives() {
  const activeCards = state.player.actives.length
    ? state.player.actives.map((item, index) => renderActiveItem(item, index)).join("")
    : `<div class="empty-state">No active items</div>`;

  return `
    <section class="panel active-panel" aria-label="Active items">
      <div class="panel-header">
        <div>
          <div class="panel-title">Actives</div>
          <div class="panel-subtitle">${state.player.actives.length}/${ACTIVE_LIMIT} consumables</div>
        </div>
      </div>
      <div class="active-list">${activeCards}</div>
    </section>
  `;
}

function renderActiveItem(item, index) {
  const actionLocked = Boolean(state.pendingActive);
  const useDisabled = canUseActive() && !actionLocked ? "" : "disabled";
  const sellDisabled = actionLocked ? "disabled" : "";
  const sale = Math.floor(item.price / 2);
  return `
    <article class="item-card active">
      <div class="item-top">
        <div>
          <div class="item-name">${item.name}</div>
          <div class="price">Sell ${sale}</div>
        </div>
        <span class="item-kind">active</span>
      </div>
      <div class="item-actions">
        <button class="small-button" data-use-active="${index}" ${useDisabled}>Use</button>
        <button class="small-button sell-button" data-sell-active="${index}" ${sellDisabled}>Sell</button>
      </div>
      <span class="tooltip">${item.description}</span>
    </article>
  `;
}

function renderPassives() {
  const slots = [];
  for (let index = 0; index < passiveLimit(); index += 1) {
    const item = state.player.passives[index];
    if (!item) {
      slots.push(`<div class="passive-slot empty">Empty passive slot</div>`);
      continue;
    }
    const sale = Math.floor(item.price / 2);
    slots.push(`
      <article class="passive-slot">
        <div class="item-top">
          <div>
            <div class="item-name">${item.name}</div>
            <div class="price">Sell ${sale}</div>
          </div>
          <span class="item-kind">passive</span>
        </div>
        <div class="item-actions one">
          <button class="small-button sell-button" data-sell-passive="${index}">Sell</button>
        </div>
        <span class="tooltip">${item.description}</span>
      </article>
    `);
  }

  return `<footer class="passive-bar" aria-label="Passive items">${slots.join("")}</footer>`;
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

function bindEvents() {
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

  document.querySelectorAll("[data-pick-bot]").forEach((button) => {
    button.addEventListener("click", () => chooseBot(Number(button.dataset.pickBot)));
  });

  const rerollButton = document.querySelector("#rerollShop");
  if (rerollButton) rerollButton.addEventListener("click", rerollShopClick);

  const restartButton = document.querySelector("#restartGame");
  if (restartButton) restartButton.addEventListener("click", startGame);
}

startGame();
