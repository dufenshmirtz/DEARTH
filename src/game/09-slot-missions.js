/* ---------- Satan's bets (missions in the code) and the slot machine ----------
   Every round one random mission appears (drawn when the round starts, lazily on the first render so logic
   tests keep their random numbers). It is replaced at the start of the next round, done or not. A finished
   mission pays its FAVOR (1, 2 or 3) at once. The slot machine left of the guess area is always available:
   a spin costs SLOT_SPIN_COST FAVOR, three reels each land on one icon, and the reward depends on how many
   of each icon came up (SLOT_PAYOUTS). Arcade only: no PvP, not in the story's tutorial rounds.
   Run state: state.missions (saved with the run); free rerolls won here: state.slotFreeRerolls (they last
   until used, unlike the Seal of the Son's). Hooks: startGame, beginRound, applyPenalties (READY and the
   results), advanceAfterSummary, buyShopItem, rerollShopClick, the sells, consumeActive, resolveEliminatedBots
   (missionsNoteElimination) and satanPactSign (missionsNoteDeal). */

const SLOT_SPIN_COST = 3;

// icon, label, chance in % (they add up to 100)
const SLOT_ICONS = [
  { key: "sin", label: "SIN", weight: 17 },
  { key: "soul", label: "SOUL", weight: 17 },
  { key: "damage", label: "DAMAGE", weight: 17 },
  { key: "elite", label: "ELITE", weight: 16 },
  { key: "karma", label: "KARMA", weight: 16 },
  { key: "reroll", label: "FREE REROLLS", weight: 17 }
];

// what 0, 1, 2 or 3 of an icon pay
const SLOT_PAYOUTS = {
  sin: [0, 5, 18, 150], // SIN
  soul: [0, 1, 4, 20], // SOUL healed; nothing can block it
  damage: [0, 5, 15, 100], // % max SOUL to every DAMNED, dealt at the end of the next round
  elite: [0, 0, 0, 1], // three ELITES: every SEAL of yours gains an ELITE level
  karmaArtifacts: [0, 3, 0, 0], // random ARTIFACTS
  karma: [0, 0, 1, 10], // KARMA
  reroll: [0, 2, 8, 30] // free rerolls
};

// reels stop one after the other (ms after the spin, before the animation speed setting)
const SLOT_REEL_STOP_MS = [700, 1050, 1400];
const SLOT_RESOLVE_DELAY_MS = 220;
const SLOT_SOURCE = "Slot machine";

// sounds only where the game can play them (not in the logic tests)
function slotSfx(key) {
  if (typeof Audio === "undefined" || typeof playGameSfx !== "function") return;
  playGameSfx(key);
}

// FAVOR: what Satan owes you for doing his work (the run state keeps its old name, state.missions.doubloons)
const FAVOR_MARK = `<span class="favor-mark" role="img" aria-label="FAVOR"></span>`;

/* ---- the missions (the player sees them as Satan's bets): 16 worth 1 FAVOR, 18 worth 2, 15 worth 3 ----
   The Nov 13 list (texts as written then), plus four from the Nov 14 list: a named ARTIFACT (1 FAVOR), no
   ARTIFACTS this round (2), a named DAMNED (2) and the same guess as a revealed DAMNED (2).
   Each round MISSION_TIER_ODDS decides how much the mission is worth (45% 1 FAVOR, 40% 2, 15% 3), then a
   mission of that worth is drawn by its weight (1 unless set). Only missions that can be done right now are drawn.
   when: "event"   checked after every action (shop, ARTIFACT, spin, deal) and after the results
         "resolve" checked once the round's results are in (and after any later action that round)
         "leave"   checked when you move on to the next round (NEXT ROUND)
   can(): may this mission be drawn now? param(): a value drawn with it (shown in the text).
   failed(): it can no longer be done this round (the box says Lost). */
const MISSION_TIER_ODDS = { 1: 45, 2: 40, 3: 15 };

// living DAMNED a mission can name (no BOSSES)
function missionNameableBots() {
  return activeBots().filter((bot) => !bot.isBoss && !bot.immortal);
}

function missionBotParam(bot) {
  return bot ? { id: bot.id, name: bot.name } : null;
}

function missionHeldArtifactIds() {
  return (state.player?.actives || []).filter((item) => item && !item.devTemporary).map((item) => item.id);
}

function missionShopOpen() {
  return typeof shopDisabledBySatan !== "function" || !shopDisabledBySatan();
}

// mission texts read exactly as the list they were written from: "Use a Spirit Board"
function missionArtifactWithArticle(name) {
  if (!name) return "an artifact";
  if (/^the\s/i.test(name)) return name;
  return `${/^[aeiou]/i.test(name) ? "an" : "a"} ${name}`;
}

const MISSIONS = [
  // ---- 1 FAVOR ----
  { id: "near10", value: 1, when: "resolve", text: "Guess within 10 of the TARGET.", check: (f) => f.guessed && f.dist <= 10 },
  { id: "notWorst", value: 1, when: "resolve", text: "Don't have the worst guess.", check: (f) => f.guessed && !f.worst },
  { id: "beat3", value: 1, when: "resolve", text: "Guess closer than 3 DAMNED.", check: (f) => f.guessed && f.botsFarther >= 3 },
  { id: "under", value: 1, when: "resolve", text: "Guess under the TARGET.", check: (f) => f.guessed && f.guess < f.target },
  { id: "over", value: 1, when: "resolve", text: "Guess over the TARGET.", check: (f) => f.guessed && f.guess > f.target },
  { id: "hurt15", value: 1, when: "resolve", text: "Take 15 damage or less.", check: (f) => f.guessed && f.damageTaken <= 15 },
  { id: "kill1", value: 1, when: "resolve", text: "Eliminate a DAMNED.", check: (f) => f.eliminations >= 1 },
  { id: "earn5", value: 1, when: "resolve", text: "Earn 5 SIN this round.", check: (f) => f.earned >= 5, progress: (f) => `${Math.min(5, f.earned)}/5` },
  { id: "pain40", value: 1, when: "resolve", text: "The DAMNED take 40 damage in total.", check: (f) => f.botDamage >= 40 },
  { id: "seal1", value: 1, when: "resolve", text: "Have a SEAL trigger.", can: () => ownedSealCount() >= 1, check: (f) => f.sealsTriggered >= 1 },
  { id: "use1", value: 1, when: "event", text: "Use an ARTIFACT.", check: (f) => f.artifactsUsed >= 1 },
  {
    id: "useItem",
    value: 1,
    weight: 4,
    when: "event",
    text: (param) => `Use ${missionArtifactWithArticle(ITEMS[param]?.name)}`,
    can: () => activeUseLimit() >= 1,
    param: () => {
      const ids = [...new Set(missionHeldArtifactIds())];
      return ids.length ? randomFrom(ids) : null;
    },
    check: (f, param) => (f.itemCounts.get(param) || 0) >= 1,
    failed: (f) => f.resolved
  },
  { id: "buy1", value: 1, when: "event", text: "Buy something in Devil's Offerings.", can: missionShopOpen, check: (f) => f.buys >= 1 },
  { id: "reroll1", value: 1, when: "event", text: "Reroll Devil's Offerings.", can: missionShopOpen, check: (f) => f.rerolls >= 1 },
  { id: "sell1", value: 1, when: "event", text: "Sell a SEAL or an ARTIFACT.", can: () => ownedSealCount() + (state.player.actives || []).length >= 1, check: (f) => f.sells >= 1 },
  { id: "keep10", value: 1, when: "leave", text: "Go into the next round with 10 SIN or more.", check: (f) => f.sin >= 10 },

  // ---- 2 FAVOR ----
  { id: "near3", value: 2, when: "resolve", text: "Guess within 3 of the TARGET.", check: (f) => f.guessed && f.dist <= 3 },
  { id: "closest", value: 2, when: "resolve", text: "Have the closest guess at the table.", check: (f) => f.guessed && f.closest },
  { id: "lowest", value: 2, when: "resolve", text: "Guess lower than every DAMNED.", check: (f) => f.guessed && f.lowest },
  { id: "hurt5", value: 2, when: "resolve", text: "Take 5 damage or less.", check: (f) => f.guessed && f.damageTaken <= 5 },
  { id: "kill2", value: 2, when: "resolve", text: "Eliminate 2 DAMNED.", check: (f) => f.eliminations >= 2, progress: (f) => `${Math.min(2, f.eliminations)}/2` },
  {
    id: "killType",
    value: 2,
    when: "resolve",
    text: (param) => `Eliminate a ${String(param || "").toUpperCase()} DAMNED.`,
    param: () => {
      const types = [...new Set(activeBots().filter((bot) => !bot.isBoss).flatMap((bot) => personalityTypes(bot)))];
      return types.length ? randomFrom(types) : null;
    },
    check: (f, param) => f.eliminatedTypes.includes(param)
  },
  {
    id: "killName",
    value: 2,
    weight: 5,
    when: "resolve",
    text: (param) => `Eliminate ${param?.name || "a Damned"}`,
    param: () => {
      const bots = missionNameableBots();
      return bots.length ? missionBotParam(randomFrom(bots)) : null;
    },
    check: (f, param) => Boolean(param) && f.killedIds.has(param.id)
  },
  { id: "bounty4", value: 2, when: "resolve", text: "Collect a BOUNTY of 4 SIN or more.", check: (f) => f.bestBounty >= 4 },
  { id: "use2", value: 2, when: "event", text: "Use 2 ARTIFACTS.", check: (f) => f.artifactsUsed >= 2, progress: (f) => `${Math.min(2, f.artifactsUsed)}/2` },
  { id: "noArtifacts", value: 2, when: "resolve", text: "Don't use artifacts this round", can: () => missionHeldArtifactIds().length >= 1, check: (f) => f.artifactsUsed === 0, failed: (f) => f.artifactsUsed > 0 },
  { id: "buySeal", value: 2, when: "event", text: "Buy a SEAL or an ELITE level.", can: missionShopOpen, check: (f) => f.sealsBought >= 1 },
  { id: "reroll3", value: 2, when: "event", text: "Reroll Devil's Offerings 3 times.", can: missionShopOpen, check: (f) => f.rerolls >= 3, progress: (f) => `${Math.min(3, f.rerolls)}/3` },
  { id: "seals3", value: 2, when: "resolve", text: "Have 3 different SEALS trigger.", can: () => ownedSealCount() >= 3, check: (f) => f.sealsTriggered >= 3, progress: (f) => `${Math.min(3, f.sealsTriggered)}/3` },
  { id: "earn10", value: 2, when: "resolve", text: "Earn 10 SIN this round.", check: (f) => f.earned >= 10, progress: (f) => `${Math.min(10, f.earned)}/10` },
  { id: "spend15", value: 2, when: "event", text: "Spend 15 SIN this round.", check: (f) => f.spent >= 15, progress: (f) => `${Math.min(15, f.spent)}/15` },
  { id: "pain10each", value: 2, when: "resolve", text: "Every DAMNED takes 10 damage or more.", check: (f) => f.everyBotHit10 },
  { id: "hold4", value: 2, when: "leave", text: "Go into the next round holding 4 ARTIFACTS.", check: (f) => f.artifactsHeld >= 4, progress: (f) => `${Math.min(4, f.artifactsHeld)}/4` },
  { id: "sameGuess", value: 2, when: "resolve", text: "Guess the same number as a revealed damned", check: (f) => f.matchesRevealed },

  // ---- 3 FAVOR ----
  { id: "critical", value: 3, when: "resolve", text: "Hit a CRITICAL.", check: (f) => f.critical },
  { id: "kill3", value: 3, when: "resolve", text: "Eliminate 3 DAMNED.", check: (f) => f.eliminations >= 3, progress: (f) => `${Math.min(3, f.eliminations)}/3` },
  { id: "unhurt", value: 3, when: "resolve", text: "Take no damage this round.", check: (f) => f.guessed && f.damageTaken === 0 },
  { id: "boss", value: 3, when: "resolve", text: "Defeat the BOSS.", can: () => activeBots().some((bot) => bot.isBoss && !bot.immortal), check: (f) => f.bossesKilled >= 1 },
  { id: "killFull", value: 3, when: "resolve", text: "Eliminate a DAMNED that started the round at full SOUL.", check: (f) => f.fullKills >= 1 },
  { id: "earn25", value: 3, when: "resolve", text: "Earn 25 SIN this round.", check: (f) => f.earned >= 25, progress: (f) => `${Math.min(25, f.earned)}/25` },
  { id: "seals5", value: 3, when: "resolve", text: "Have 5 different SEALS trigger.", can: () => ownedSealCount() >= 5, check: (f) => f.sealsTriggered >= 5, progress: (f) => `${Math.min(5, f.sealsTriggered)}/5` },
  { id: "reroll5", value: 3, when: "event", text: "Reroll Devil's Offerings 5 times.", can: missionShopOpen, check: (f) => f.rerolls >= 5, progress: (f) => `${Math.min(5, f.rerolls)}/5` },
  { id: "spend30", value: 3, when: "event", text: "Spend 30 SIN this round.", check: (f) => f.spent >= 30, progress: (f) => `${Math.min(30, f.spent)}/30` },
  { id: "critBare", value: 3, when: "resolve", text: "Hit a CRITICAL without using an ARTIFACT.", check: (f) => f.critical && f.artifactsUsed === 0 },
  { id: "near2safe", value: 3, when: "resolve", text: "Guess within 2 of the TARGET and take 5 damage or less.", check: (f) => f.guessed && f.dist <= 2 && f.damageTaken <= 5 },
  { id: "keepSoul", value: 3, when: "leave", text: "Go into the next round with as much SOUL as you started this one.", check: (f) => f.hp >= f.startHp },
  { id: "twoArtKill2", value: 3, when: "resolve", text: "Use 2 different ARTIFACTS and eliminate 2 DAMNED.", check: (f) => f.distinctArtifacts >= 2 && f.eliminations >= 2 },
  { id: "closestKill2", value: 3, when: "resolve", text: "Have the closest guess and eliminate 2 DAMNED.", check: (f) => f.guessed && f.closest && f.eliminations >= 2 },
  { id: "lowestNear3", value: 3, when: "resolve", text: "Guess lower than every DAMNED and within 3 of the TARGET.", check: (f) => f.guessed && f.lowest && f.dist <= 3 }
];

const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((mission) => [mission.id, mission]));

function ownedSealCount() {
  return (state.player?.passives || []).filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id)).length;
}

// the BOUNTY on a DAMNED's card (a BOSS's BOSS BOUNTY counts too)
function missionBountyOf(bot) {
  if (!bot || bot.immortal) return 0;
  return Math.max(0, Math.ceil(botRegularBounty(bot) || 0)) + (bot.isBoss ? Math.max(0, Math.ceil(botBossBounty(bot) || 0)) : 0);
}

/* ---- state ---- */
function missionsFresh() {
  return {
    doubloons: 0,
    current: null, // { id, value, param, round, done }
    lastId: null,
    round: null, // this round's counters (missionsRoundFresh)
    spin: null, // { icons, at, resolved }
    lastIcons: null,
    lastText: "",
    completed: 0,
    earned: 0,
    spins: 0,
    triples: 0
  };
}

function missionsRoundFresh() {
  return {
    round: state.round,
    rerolls: 0,
    buys: 0,
    sealsBought: 0,
    sells: 0,
    soldSin: 0, // SIN from sales (not "earned" for the SIN missions)
    kills: [], // { id, memory, bounty, revealed } as each DAMNED fell
    startHp: state.player?.hp ?? 0,
    botStart: {},
    readyIds: null,
    resolved: false
  };
}

function missionsState() {
  if (!state.missions || typeof state.missions !== "object") state.missions = missionsFresh();
  const missions = state.missions;
  if (!Number.isFinite(missions.doubloons)) missions.doubloons = 0;
  if (!missions.round || missions.round.round !== state.round) missions.round = missionsRoundFresh();
  return missions;
}

/* the slot machine and the missions stay hidden until the player has won once and left Satan's first-win
   speech (09-intro-story.js, dearthFirstVictorySeenV1), or until Pause > DEV > Unlock slot machine */
const SLOT_MACHINE_UNLOCK_STORAGE_KEY = "dearthSlotMachineUnlockedV1";

function slotMachineStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage || null : null;
  } catch (error) {
    return null;
  }
}

function slotMachineUnlocked() {
  try {
    const storage = slotMachineStorage();
    if (!storage) return false;
    if (storage.getItem(SLOT_MACHINE_UNLOCK_STORAGE_KEY) === "1") return true;
    const firstWinKey = typeof SATAN_FIRST_VICTORY_STORAGE_KEY === "string" ? SATAN_FIRST_VICTORY_STORAGE_KEY : "dearthFirstVictorySeenV1";
    return storage.getItem(firstWinKey) === "1";
  } catch (error) {
    return false;
  }
}

// true when this call unlocked it, false when it already was (or storage is unavailable)
function unlockSlotMachine() {
  const wasUnlocked = slotMachineUnlocked();
  try {
    slotMachineStorage()?.setItem(SLOT_MACHINE_UNLOCK_STORAGE_KEY, "1");
  } catch (error) {
    return false;
  }
  return !wasUnlocked && slotMachineUnlocked();
}

function missionsEnabled() {
  if (state.mode !== "arcade" || state.gameOver) return false;
  // Final Judgment closes them like the Devil's Offerings
  if (state.finalBossPhase) return false;
  if (!slotMachineUnlocked()) return false;
  if (typeof introBlocksRunSave === "function" && introBlocksRunSave()) return false;
  return true;
}

function resetMissionsForRun() {
  state.missions = missionsFresh();
  state.slotFreeRerolls = 0;
  state.slotPendingDamage = [];
}

function normalizeMissionsState() {
  const missions = missionsState();
  if (missions.current && !MISSION_BY_ID[missions.current.id]) missions.current = null;
  const counters = missions.round;
  if (!Array.isArray(counters.kills)) counters.kills = [];
  if (!Number.isFinite(counters.soldSin)) counters.soldSin = 0;
  if (!Number.isFinite(state.slotFreeRerolls)) state.slotFreeRerolls = 0;
  if (!Array.isArray(state.slotPendingDamage)) state.slotPendingDamage = [];
  // a spin that was still turning when the run was saved pays out now
  if (missions.spin && !missions.spin.resolved) slotResolve();
}

// called at the end of beginRound: new counters; the mission itself is drawn by missionsEnsureRound
function missionsBeginRound() {
  const missions = missionsState();
  missions.round = missionsRoundFresh();
  activeBots().forEach((bot) => {
    missions.round.botStart[bot.id] = { hp: bot.hp, maxHp: bot.maxHp };
  });
}

function missionText(mission, param) {
  return typeof mission.text === "function" ? mission.text(param) : mission.text;
}

function missionTier(mission) {
  return Math.min(3, mission.value);
}

function missionWeightedPick(entries, weightOf) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, weightOf(entry)), 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= Math.max(0, weightOf(entry));
    if (roll < 0) return entry;
  }
  return entries[entries.length - 1];
}

// the worth first (MISSION_TIER_ODDS, among the worths that have a mission that can be done now), then a mission
// of that worth by its weight; never the same mission twice in a row
function drawMission() {
  const missions = missionsState();
  const options = [];
  MISSIONS.forEach((mission) => {
    if (mission.id === missions.lastId) return;
    if (mission.can && !mission.can()) return;
    const param = mission.param ? mission.param() : null;
    if (mission.param && !param) return;
    options.push({ mission, param });
  });
  if (!options.length) return null;
  const tiers = Object.keys(MISSION_TIER_ODDS)
    .map(Number)
    .filter((tier) => options.some((option) => missionTier(option.mission) === tier));
  const tier = missionWeightedPick(tiers, (value) => MISSION_TIER_ODDS[value]);
  const pick = missionWeightedPick(
    options.filter((option) => missionTier(option.mission) === tier),
    (option) => option.mission.weight || 1
  );
  return { id: pick.mission.id, value: pick.mission.value, param: pick.param, round: state.round, done: false };
}

// the round's mission: drawn the first time it is needed in a round
function missionsEnsureRound() {
  if (!missionsEnabled()) return null;
  const missions = missionsState();
  if (!missions.current || missions.current.round !== state.round) {
    missions.current = drawMission();
    if (missions.current) missions.lastId = missions.current.id;
  }
  return missions.current;
}

/* ---- facts about the round, for the checks ---- */
function missionFacts() {
  const missions = missionsState();
  const counters = missions.round;
  const round = state.roundState || {};
  const resolved = Boolean(counters.resolved);
  // your guess after ARTIFACTS against the final TARGET
  const guess = round.playerEffectiveGuess;
  const target = round.target;
  const guessed = resolved && Number.isFinite(guess) && Number.isFinite(target);
  const dist = guessed ? Math.abs(guess - target) : Infinity;
  const readyIds = counters.readyIds || Object.keys(counters.botStart).map(Number);
  const removed = round.removedBotIds instanceof Set ? round.removedBotIds : new Set();
  const botGuesses = [];
  readyIds.forEach((id) => {
    const value = round.botEffectiveGuesses instanceof Map ? round.botEffectiveGuesses.get(id) : undefined;
    if (Number.isFinite(value) && !removed.has(id)) botGuesses.push(value);
  });
  const botDists = botGuesses.map((value) => Math.abs(value - target));
  const startedBots = state.bots.filter((bot) => counters.botStart[bot.id]);
  const killedBots = startedBots.filter((bot) => bot.eliminated && !bot.immortal);
  const killedIds = new Set(killedBots.map((bot) => bot.id));
  // each fallen DAMNED as it was when it fell (missionsNoteElimination), or as it is now
  const kills = killedBots.map((bot) => counters.kills.find((kill) => kill.id === bot.id) || { id: bot.id, memory: (bot.memory || []).length, bounty: missionBountyOf(bot), revealed: Boolean(bot.revealedByPassive) });
  // the number you typed against a revealed DAMNED's typed guess
  const typed = round.playerSubmittedGuess;
  const revealedIds = new Set(round.revealedBotIds instanceof Set ? round.revealedBotIds : []);
  state.bots.forEach((bot) => {
    if (bot.revealedByPassive && counters.botStart[bot.id]) revealedIds.add(bot.id);
  });
  const typedGuesses = round.botSubmittedGuesses instanceof Map ? round.botSubmittedGuesses : new Map();
  const triggered = round.triggeredPassiveIds instanceof Set ? round.triggeredPassiveIds.size : 0;
  const itemCounts = round.activeUseItemCounts instanceof Map ? round.activeUseItemCounts : new Map();
  return {
    resolved,
    guessed,
    guess,
    target,
    dist,
    critical: Boolean(resolved && round.criticalHitKeys instanceof Set && round.criticalHitKeys.has("player")),
    worst: guessed && botDists.length > 0 && dist > 0 && botDists.every((other) => dist >= other),
    closest: guessed && botDists.every((other) => dist <= other),
    lowest: guessed && botGuesses.length > 0 && botGuesses.every((other) => guess < other),
    botsFarther: guessed ? botDists.filter((other) => other > dist).length : 0,
    matchesRevealed: resolved && Number.isFinite(typed) && [...revealedIds].some((id) => typedGuesses.get(id) === typed),
    damageTaken: Math.max(0, Math.ceil(state.playerLastDamage || 0)),
    hp: state.player.hp,
    startHp: counters.startHp,
    eliminations: killedBots.length,
    killedIds,
    kills,
    eliminatedTypes: Array.isArray(round.eliminatedPersonalities) ? round.eliminatedPersonalities : [],
    bestBounty: killedBots.reduce((best, bot) => Math.max(best, Number(bot.eliminationReward) || 0), 0),
    bossesKilled: killedBots.filter((bot) => bot.isBoss).length,
    fullKills: killedBots.filter((bot) => {
      const start = counters.botStart[bot.id];
      return start && start.hp >= start.maxHp;
    }).length,
    botDamage: startedBots.reduce((sum, bot) => sum + Math.max(0, Number(bot.lastDamage) || 0), 0),
    everyBotHit10:
      resolved &&
      readyIds.length > 0 &&
      readyIds.every((id) => {
        const bot = state.bots.find((entry) => entry.id === id);
        return bot && (Number(bot.lastDamage) || 0) >= 10;
      }),
    sealsTriggered: triggered,
    artifactsUsed: Math.max(0, round.activeUses || 0),
    distinctArtifacts: itemCounts.size,
    itemCounts,
    artifactsHeld: (state.player.actives || []).length,
    buys: counters.buys,
    sealsBought: counters.sealsBought,
    rerolls: counters.rerolls,
    sells: counters.sells,
    // SIN from sales does not count as earned
    earned: Math.max(0, Math.ceil((round.earnedSinThisRound || 0) - (counters.soldSin || 0))),
    spent: Math.max(0, Math.ceil(round.creditsSpentThisRound || 0)),
    sin: Math.max(0, Math.ceil(state.player.credits || 0))
  };
}

// point: "event" | "resolve" | "leave"
function missionsCheck(point = "event") {
  if (!missionsEnabled()) return false;
  const current = missionsEnsureRound();
  if (!current || current.done) return false;
  const mission = MISSION_BY_ID[current.id];
  if (!mission) return false;
  const counters = missionsState().round;
  if (mission.when === "leave" && point !== "leave") return false;
  if (mission.when === "resolve" && !counters.resolved) return false;
  if (!mission.check(missionFacts(), current.param)) return false;
  missionsComplete(current, mission);
  return true;
}

function missionsComplete(current, mission) {
  const missions = missionsState();
  current.done = true;
  missions.doubloons += current.value;
  missions.completed += 1;
  missions.earned += current.value;
  const text = missionText(mission, current.param);
  addLog(`Satan's bet won: ${text} (+${current.value} FAVOR).`);
  if (state.roundState) addRoundEvent(`Satan's bet won: +${current.value} FAVOR.`);
  slotSfx("bountyUp");
}

/* ---- hooks ---- */
// READY: who is at the table for this guess
function missionsNoteReady() {
  if (!missionsEnabled()) return;
  missionsState().round.readyIds = activeBots().map((bot) => bot.id);
}

// the results are in (end of applyPenalties)
function missionsAfterResolution() {
  if (!missionsEnabled()) return;
  missionsState().round.resolved = true;
  missionsCheck("resolve");
}

// NEXT ROUND: the "go into the next round" missions, before the round changes
function missionsBeforeNextRound() {
  if (!missionsEnabled()) return;
  missionsCheck("leave");
}

// a DAMNED falls (resolveEliminatedBots): its MEMORY, BOUNTY and whether its guess was revealed, as it fell
function missionsNoteElimination(bot) {
  if (!missionsEnabled() || !bot) return;
  const counters = missionsState().round;
  if (counters.kills.some((kill) => kill.id === bot.id)) return;
  counters.kills.push({ id: bot.id, memory: (bot.memory || []).length, bounty: missionBountyOf(bot), revealed: Boolean(bot.revealedByPassive) });
}

// the deal was signed (satanPactSign)
function missionsNoteDeal() {
  if (!missionsEnabled()) return;
  missionsCheck("event");
}

// kind: "buySeal" | "buyArtifact" | "reroll" | "sell" | "artifact"
// a sale: info = { sin: SIN it paid, sealIds: the SEALS sold (none for an ARTIFACT) }
function missionsNoteShop(kind, info = {}) {
  if (!missionsEnabled()) return;
  const counters = missionsState().round;
  if (kind === "buySeal" || kind === "buyArtifact") counters.buys += 1;
  if (kind === "buySeal") counters.sealsBought += 1;
  if (kind === "reroll") counters.rerolls += 1;
  if (kind === "sell") {
    counters.sells += 1;
    counters.soldSin = (counters.soldSin || 0) + Math.max(0, Math.ceil(info.sin || 0));
  }
  missionsCheck("event");
}

/* ---- the slot machine ---- */
function slotRollIcon() {
  const total = SLOT_ICONS.reduce((sum, icon) => sum + icon.weight, 0);
  let roll = Math.random() * total;
  for (const icon of SLOT_ICONS) {
    roll -= icon.weight;
    if (roll < 0) return icon.key;
  }
  return SLOT_ICONS[SLOT_ICONS.length - 1].key;
}

function slotIconLabel(key) {
  return SLOT_ICONS.find((icon) => icon.key === key)?.label || key;
}

// what three icons pay: { sin, soul, damagePercent, elite, artifacts, karma, rerolls, triple }
function slotRewardsFor(icons) {
  const count = (key) => icons.filter((icon) => icon === key).length;
  const n = (key) => Math.min(3, count(key));
  return {
    sin: SLOT_PAYOUTS.sin[n("sin")],
    soul: SLOT_PAYOUTS.soul[n("soul")],
    damagePercent: SLOT_PAYOUTS.damage[n("damage")],
    elite: SLOT_PAYOUTS.elite[n("elite")],
    artifacts: SLOT_PAYOUTS.karmaArtifacts[n("karma")],
    karma: SLOT_PAYOUTS.karma[n("karma")],
    rerolls: SLOT_PAYOUTS.reroll[n("reroll")],
    triple: icons.length === 3 && icons.every((icon) => icon === icons[0]) ? icons[0] : null
  };
}

function slotSpinning() {
  const spin = state.missions?.spin;
  return Boolean(spin && !spin.resolved);
}

function slotCanSpin() {
  return missionsEnabled() && !arcadeActionLocked() && !slotSpinning() && missionsState().doubloons >= SLOT_SPIN_COST;
}

function slotSpin() {
  if (!slotCanSpin()) return false;
  const missions = missionsState();
  missions.doubloons -= SLOT_SPIN_COST;
  missions.spins += 1;
  missions.spin = { icons: [slotRollIcon(), slotRollIcon(), slotRollIcon()], at: Date.now(), resolved: false };
  missions.lastText = "";
  slotSfx("reroll");
  // no timers (logic tests): it pays out at once
  if (typeof setTimeout !== "function" || typeof document?.querySelector !== "function") {
    slotResolve();
    return true;
  }
  SLOT_REEL_STOP_MS.forEach((ms, index) => {
    setTimeout(() => {
      slotSfx("uiHover");
      if (index < SLOT_REEL_STOP_MS.length - 1) render();
    }, gameMs(ms));
  });
  setTimeout(() => {
    slotResolve();
    render();
  }, gameMs(SLOT_REEL_STOP_MS[SLOT_REEL_STOP_MS.length - 1] + SLOT_RESOLVE_DELAY_MS));
  render();
  return true;
}

// has reel `index` of the current spin stopped?
function slotReelStopped(index) {
  const spin = state.missions?.spin;
  if (!spin || spin.resolved) return true;
  return Date.now() - spin.at >= gameMs(SLOT_REEL_STOP_MS[index]);
}

function slotResolve() {
  const missions = missionsState();
  const spin = missions.spin;
  if (!spin || spin.resolved) return;
  spin.resolved = true;
  missions.lastIcons = spin.icons.slice();
  if (state.gameOver || state.mode !== "arcade") return;
  const reward = slotRewardsFor(spin.icons);
  const parts = [];
  if (reward.triple) {
    missions.triples += 1;
    slotSfx("criticalBell");
  }
  if (reward.sin > 0) {
    const gained = gainCredits(reward.sin, false, SLOT_SOURCE);
    parts.push(`+${gained} SIN`);
  }
  if (reward.soul > 0) {
    const healed = slotHealUnblockable(reward.soul);
    parts.push(healed > 0 ? `+${healed} SOUL` : "SOUL already full");
  }
  if (reward.damagePercent > 0) {
    // dealt at the end of the next round (slotApplyPendingDamage, from applyPenalties)
    if (!Array.isArray(state.slotPendingDamage)) state.slotPendingDamage = [];
    state.slotPendingDamage.push({ round: state.round + 1, percent: reward.damagePercent });
    parts.push(`${reward.damagePercent}% DAMAGE at next round's end`);
  }
  if (reward.elite > 0) {
    // three ELITES: every SEAL you own that can take ELITE gains a level (free: selling does not pay it back)
    const seals = (state.player.passives || []).filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id) && !isNonUpgradableSeal(item.id));
    seals.forEach((seal) => {
      seal.stack = (seal.stack || 1) + reward.elite;
      seal.freeStacks = (seal.freeStacks || 0) + reward.elite;
      recordEliteLevelBought(seal.id, seal.stack);
    });
    parts.push(seals.length ? `ELITE on all ${seals.length} SEAL${seals.length === 1 ? "" : "S"}` : "ELITE, but no SEAL can take it");
  }
  if (reward.artifacts > 0) {
    let given = 0;
    for (let index = 0; index < reward.artifacts && state.player.actives.length < activeInventoryLimit(); index += 1) {
      state.player.actives.push(freeActiveCopy(randomFrom(ACTIVE_IDS)));
      given += 1;
    }
    if (given) state.activeCarouselIndex = state.player.actives.length - 1;
    parts.push(given ? `+${given} ARTIFACT${given === 1 ? "" : "S"}` : "ARTIFACTS full");
  }
  if (reward.karma > 0) {
    const gained = typeof karmaGain === "function" ? karmaGain(reward.karma, SLOT_SOURCE) : 0;
    parts.push(gained ? `+${gained} KARMA` : `${reward.karma} KARMA (not counted here)`);
  }
  if (reward.rerolls > 0) {
    state.slotFreeRerolls = Math.max(0, Math.ceil(state.slotFreeRerolls || 0)) + reward.rerolls;
    parts.push(`+${reward.rerolls} free rerolls`);
  }
  missions.lastText = parts.length ? parts.join(" · ") : "Nothing";
  missions.lastRound = state.round;
  addLog(`${SLOT_SOURCE}: ${spin.icons.map(slotIconLabel).join(" | ")}. ${missions.lastText}.`);
  if (state.roundState) addRoundEvent(`${SLOT_SOURCE}: ${missions.lastText}.`);
  if (state.player.hp <= 0) finishGameOverRound();
  // a spin can finish a mission (SIN earned, DAMNED eliminated, ...)
  missionsCheck("event");
}

// SOUL from the slot machine: nothing blocks it (no BOSS ability, no Padma), it only stops at max SOUL
function slotHealUnblockable(amount) {
  if (state.player.hp <= 0) return 0;
  const before = state.player.hp;
  state.player.hp = Math.min(playerMaxHp(), state.player.hp + Math.max(0, Math.ceil(amount)));
  const healed = state.player.hp - before;
  if (healed > 0) {
    state.playerLastHeal = (state.playerLastHeal || 0) + healed;
    recordPlayerHealSource(healed, SLOT_SOURCE);
  }
  return healed;
}

// the % of max SOUL every DAMNED takes at the end of this round (spins from earlier rounds)
function slotPendingDamagePercent(round = state.round) {
  return (Array.isArray(state.slotPendingDamage) ? state.slotPendingDamage : [])
    .filter((entry) => entry && entry.round <= round)
    .reduce((sum, entry) => sum + Math.max(0, Number(entry.percent) || 0), 0);
}

// end of the round (applyPenalties, after the BOSS abilities): the DAMAGE won by a spin in an earlier round lands
function slotApplyPendingDamage() {
  if (!Array.isArray(state.slotPendingDamage) || !state.slotPendingDamage.length) return;
  const due = state.slotPendingDamage.filter((entry) => entry && entry.round <= state.round);
  if (!due.length) return;
  state.slotPendingDamage = state.slotPendingDamage.filter((entry) => entry && entry.round > state.round);
  due.forEach((entry) => {
    const percent = Math.max(0, Number(entry.percent) || 0);
    if (!percent) return;
    damageBots(
      activeBots(),
      (bot) => Math.ceil((bot.maxHp || 0) * (percent / 100)),
      (bot, dealt) => `The slot machine dealt ${dealt} damage to ${bot.name}.`,
      SLOT_SOURCE
    );
  });
}

/* ---- drawing ---- */
const SLOT_ICON_SVG = {
  soul: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c3.2 4.2 6 7.4 6 11.2a6 6 0 0 1-12 0c0-2.4 1.3-4.3 2.6-5.6.2 1.8 1 3 2.2 3.6-.6-3.3.2-6.2 1.2-9.2z"/></svg>`,
  damage: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 13h-4.4z"/><path d="M6.5 15.2h11"/><path d="M12 15.2v4.8"/><circle cx="12" cy="21.3" r="1.2"/></svg>`,
  elite: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 3.6l2.3 7.1h-4.6zM12 3.6L7 19M12 3.6L17 19M3.6 9.4h16.8M7 19L20.4 9.4M17 19L3.6 9.4"/></svg>`,
  reroll: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 9A8 8 0 0 0 5 7.2"/><path d="M5 3v4.4h4.4"/><path d="M4.5 15A8 8 0 0 0 19 16.8"/><path d="M19 21v-4.4h-4.4"/></svg>`
};

// the symbol alone (reels show no text)
function slotGlyphHtml(key) {
  if (key === "sin") return `<span class="slot-glyph-mask slot-glyph-sin"></span>`;
  if (key === "karma") return `<span class="slot-glyph-mask slot-glyph-karma"></span>`;
  return SLOT_ICON_SVG[key] || "";
}

function slotIconHtml(key) {
  return `<span class="slot-icon slot-icon-${key}" role="img" aria-label="${escapeAttr(slotIconLabel(key))}"><span class="slot-glyph">${slotGlyphHtml(key)}</span></span>`;
}

// the slot machine's description: each symbol with what 1, 2 or 3 of it pay
function slotPaytableHtml() {
  const symbol = (key) => `<span class="slot-pay-glyph slot-icon-${key}" role="img" aria-label="${escapeAttr(slotIconLabel(key))}">${slotGlyphHtml(key)}</span>`;
  const row = (key, one, two, three) =>
    `<div class="slot-pay-row">${symbol(key)}<span>${one}</span><span>${two}</span><span>${three}</span></div>`;
  return `
    <div class="slot-paytable">
      <div class="slot-pay-title">Slot machine · ${SLOT_SPIN_COST}${FAVOR_MARK} a spin</div>
      <div class="slot-pay-row slot-pay-head"><span></span><span>×1</span><span>×2</span><span>×3</span></div>
      ${row("sin", `+5${SIN_MARK}`, `+18${SIN_MARK}`, `+150${SIN_MARK}`)}
      ${row("soul", "+1 SOUL", "+4 SOUL", "+20 SOUL")}
      ${row("damage", "5%", "15%", "100%")}
      ${row("elite", "–", "–", "ELITE on every SEAL")}
      ${row("karma", "3 ARTIFACTS", `+1${KARMA_MARK}`, `+10${KARMA_MARK}`)}
      ${row("reroll", "2 rerolls", "8 rerolls", "30 rerolls")}
      <div class="slot-pay-note">Each symbol pays for how many of it came up. DAMAGE is % of max SOUL to every DAMNED, dealt at the end of the next round. SOUL can't be blocked. Three ELITES give every SEAL of yours an ELITE level. Free rerolls are kept until used. Missions pay FAVOR${FAVOR_MARK}.</div>
    </div>
  `;
}

function slotMachineHtml() {
  if (!missionsEnabled()) return "";
  const missions = missionsState();
  const spin = missions.spin && !missions.spin.resolved ? missions.spin : null;
  const icons = spin ? spin.icons : missions.lastIcons;
  const reels = [0, 1, 2]
    .map((index) => {
      if (spin && !slotReelStopped(index)) {
        const strip = [...SLOT_ICONS, ...SLOT_ICONS].map((icon) => slotIconHtml(icon.key)).join("");
        return `<div class="slot-reel rolling"><div class="slot-window"><div class="slot-strip" style="animation-delay: -${index * 130}ms">${strip}</div></div></div>`;
      }
      if (!icons) return `<div class="slot-reel empty"><div class="slot-window"><span class="slot-idle">?</span></div></div>`;
      return `<div class="slot-reel ${spin ? "landed" : "shown"}"><div class="slot-window">${slotIconHtml(icons[index])}</div></div>`;
    })
    .join("");
  const triple = !spin && icons && icons.every((icon) => icon === icons[0]);
  const pendingNow = slotPendingDamagePercent(state.round);
  const pendingNext = slotPendingDamagePercent(state.round + 1) - pendingNow;
  const pendingText = pendingNow
    ? `${pendingNow}% DAMAGE at this round's end`
    : pendingNext
      ? `${pendingNext}% DAMAGE at next round's end`
      : "";
  // this round's spin shows its result; later rounds show the DAMAGE still on its way
  const result = spin ? "" : missions.lastRound === state.round ? missions.lastText : pendingText || missions.lastText;
  const disabled = slotCanSpin() ? "" : "disabled";
  const tooltip = `${slotPaytableHtml()}`;
  return `
    <div class="slot-machine${triple && missions.lastText ? " slot-triple" : ""}" data-tooltip-html="${escapeAttr(tooltip)}">
      <div class="slot-reels">${reels}</div>
      <div class="slot-side">
        <button type="button" id="slotSpin" class="slot-spin" ${disabled}>Spin <span class="slot-cost">${SLOT_SPIN_COST}${FAVOR_MARK}</span></button>
        <span class="slot-favor" aria-label="You have ${missions.doubloons} FAVOR">${formatNumber(missions.doubloons)}${FAVOR_MARK}</span>
      </div>
      <div class="slot-result${result ? "" : " guide-text"}">${escapeHtml(result || "Satan's bets pay FAVOR.")}</div>
    </div>
  `;
}

function missionBoxHtml() {
  if (!missionsEnabled()) return "";
  const current = missionsEnsureRound();
  if (!current) return "";
  const mission = MISSION_BY_ID[current.id];
  const counters = missionsState().round;
  const facts = missionFacts();
  let status = "";
  if (current.done) status = "Won";
  else if (mission.failed && mission.failed(facts, current.param)) status = "Lost";
  else if (mission.when === "resolve" && counters.resolved) status = "Lost";
  else if (mission.progress) status = mission.progress(facts, current.param);
  else if (mission.when === "leave") status = "At NEXT ROUND";
  const statusClass = current.done ? "done" : status === "Lost" ? "missed" : "";
  return `
    <div class="mission-box ${statusClass}" data-tooltip="Satan bets you can't do this. A new bet every round; win it to earn FAVOR for the slot machine (${SLOT_SPIN_COST} a spin).">
      <div class="mission-head">
        <span class="mission-title">Satan's bet</span>
        ${status ? `<span class="mission-status ${statusClass}">${escapeHtml(status)}</span>` : ""}
        <span class="mission-reward">+${current.value}${FAVOR_MARK}</span>
      </div>
      <div class="mission-text">${escapeHtml(missionText(mission, current.param))}</div>
    </div>
  `;
}

// the phone app: a rail on the left of the DAMNED, under the TARGET box (slot machine on top, mission under it)
function nativeSlotBandHtml() {
  if (!missionsEnabled()) return "";
  return `<section class="native-slot-band" aria-label="Slot machine and Satan's bet">${slotMachineHtml()}${missionBoxHtml()}</section>`;
}

/* ---- lining up with the DAMNED ----
   The slot machine's left edge sits on the leftmost DAMNED card's left edge and the mission's right edge on the
   rightmost card's right edge. The cards are laid out differently on every screen, so after each render the
   distance from the console (or the phone app's band) to the card row is measured into two CSS variables on the
   page root (--slot-edge-left / --slot-edge-right), which the render cycle never rebuilds. */
function syncSlotEdges() {
  if (typeof document === "undefined" || typeof document.querySelector !== "function") return;
  const grid = document.querySelector("#app .arena .bot-grid");
  const host = document.querySelector("#app .native-slot-band") || document.querySelector("#app .center-console.has-slot");
  if (!grid || !host) return;
  const cards = grid.getBoundingClientRect();
  const box = host.getBoundingClientRect();
  if (!cards.width || !box.width) return;
  const root = document.documentElement.style;
  const left = `${Math.round(cards.left - box.left)}px`;
  const right = `${Math.round(box.right - cards.right)}px`;
  if (root.getPropertyValue("--slot-edge-left") !== left) root.setProperty("--slot-edge-left", left);
  if (root.getPropertyValue("--slot-edge-right") !== right) root.setProperty("--slot-edge-right", right);
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("resize", () => syncSlotEdges());
}
