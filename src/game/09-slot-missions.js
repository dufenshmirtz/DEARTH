/* ---------- Missions and the slot machine ----------
   Every round one random mission appears (drawn when the round starts, lazily on the first render so logic
   tests keep their random numbers). It is replaced at the start of the next round, done or not. A finished
   mission pays 1, 2 or 3 FAVOR at once. The slot machine left of the guess area is always available:
   a spin costs SLOT_SPIN_COST FAVOR, three reels each land on one icon, and the reward depends on how many
   of each icon came up (SLOT_PAYOUTS). Arcade only: no PvP, not in the story's tutorial rounds.
   Run state: state.missions (saved with the run); free rerolls won here: state.slotFreeRerolls (they last
   until used, unlike the Seal of the Son's). Hooks: startGame, beginRound, applyPenalties (READY and the
   results), advanceAfterSummary, buyShopItem, rerollShopClick, the sells and consumeActive. */

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
  sin: [0, 3, 6, 20], // SIN
  soul: [0, 2, 4, 10], // SOUL healed
  damage: [0, 5, 10, 30], // % max SOUL to every DAMNED
  elite: [0, 0, 0, 1], // ELITE levels on a random SEAL of yours
  karmaArtifacts: [0, 1, 2, 0], // random ARTIFACTS
  karma: [0, 0, 0, 6], // KARMA
  reroll: [0, 2, 4, 10] // free rerolls
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

/* ---- the missions: 15 worth 1, 15 worth 2, 15 worth 3 FAVOR ----
   when: "event"   checked after every action (shop, ARTIFACT, spin) and after the results
         "resolve" checked once the round's results are in (and after any later action that round)
         "leave"   checked when you move on to the next round
   can(): may this mission be drawn now? param(): a value drawn with it (shown in the text). */
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
  { id: "buy1", value: 1, when: "event", text: "Buy something in Devil's Offerings.", can: () => !shopDisabledBySatan(), check: (f) => f.buys >= 1 },
  { id: "reroll1", value: 1, when: "event", text: "Reroll Devil's Offerings.", can: () => !shopDisabledBySatan(), check: (f) => f.rerolls >= 1 },
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
  { id: "bounty4", value: 2, when: "resolve", text: "Collect a BOUNTY of 4 SIN or more.", check: (f) => f.bestBounty >= 4 },
  { id: "use2", value: 2, when: "event", text: "Use 2 ARTIFACTS.", check: (f) => f.artifactsUsed >= 2, progress: (f) => `${Math.min(2, f.artifactsUsed)}/2` },
  { id: "buySeal", value: 2, when: "event", text: "Buy a SEAL or an ELITE level.", can: () => !shopDisabledBySatan(), check: (f) => f.sealsBought >= 1 },
  { id: "reroll3", value: 2, when: "event", text: "Reroll Devil's Offerings 3 times.", can: () => !shopDisabledBySatan(), check: (f) => f.rerolls >= 3, progress: (f) => `${Math.min(3, f.rerolls)}/3` },
  { id: "seals3", value: 2, when: "resolve", text: "Have 3 different SEALS trigger.", can: () => ownedSealCount() >= 3, check: (f) => f.sealsTriggered >= 3, progress: (f) => `${Math.min(3, f.sealsTriggered)}/3` },
  { id: "earn10", value: 2, when: "resolve", text: "Earn 10 SIN this round.", check: (f) => f.earned >= 10, progress: (f) => `${Math.min(10, f.earned)}/10` },
  { id: "spend15", value: 2, when: "event", text: "Spend 15 SIN this round.", check: (f) => f.spent >= 15, progress: (f) => `${Math.min(15, f.spent)}/15` },
  { id: "pain10each", value: 2, when: "resolve", text: "Every DAMNED takes 10 damage or more.", check: (f) => f.everyBotHit10 },
  { id: "hold4", value: 2, when: "leave", text: "Go into the next round holding 4 ARTIFACTS.", check: (f) => f.artifactsHeld >= 4, progress: (f) => `${Math.min(4, f.artifactsHeld)}/4` },

  // ---- 3 FAVOR ----
  { id: "critical", value: 3, when: "resolve", text: "Hit a CRITICAL.", check: (f) => f.critical },
  { id: "kill3", value: 3, when: "resolve", text: "Eliminate 3 DAMNED.", check: (f) => f.eliminations >= 3, progress: (f) => `${Math.min(3, f.eliminations)}/3` },
  { id: "unhurt", value: 3, when: "resolve", text: "Take no damage this round.", check: (f) => f.guessed && f.damageTaken === 0 },
  { id: "boss", value: 3, when: "resolve", text: "Defeat the BOSS.", can: () => activeBots().some((bot) => bot.isBoss && !bot.immortal), check: (f) => f.bossesKilled >= 1 },
  { id: "killFull", value: 3, when: "resolve", text: "Eliminate a DAMNED that started the round at full SOUL.", check: (f) => f.fullKills >= 1 },
  { id: "earn25", value: 3, when: "resolve", text: "Earn 25 SIN this round.", check: (f) => f.earned >= 25, progress: (f) => `${Math.min(25, f.earned)}/25` },
  { id: "seals5", value: 3, when: "resolve", text: "Have 5 different SEALS trigger.", can: () => ownedSealCount() >= 5, check: (f) => f.sealsTriggered >= 5, progress: (f) => `${Math.min(5, f.sealsTriggered)}/5` },
  { id: "reroll5", value: 3, when: "event", text: "Reroll Devil's Offerings 5 times.", can: () => !shopDisabledBySatan(), check: (f) => f.rerolls >= 5, progress: (f) => `${Math.min(5, f.rerolls)}/5` },
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

function missionsEnabled() {
  if (state.mode !== "arcade" || state.gameOver) return false;
  if (typeof introBlocksRunSave === "function" && introBlocksRunSave()) return false;
  return true;
}

function resetMissionsForRun() {
  state.missions = missionsFresh();
  state.slotFreeRerolls = 0;
}

function normalizeMissionsState() {
  const missions = missionsState();
  if (missions.current && !MISSION_BY_ID[missions.current.id]) missions.current = null;
  if (!Number.isFinite(state.slotFreeRerolls)) state.slotFreeRerolls = 0;
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

function drawMission() {
  const missions = missionsState();
  const options = MISSIONS.filter((mission) => mission.id !== missions.lastId && (!mission.can || mission.can()));
  for (const mission of shuffled(options)) {
    const param = mission.param ? mission.param() : null;
    if (mission.param && !param) continue;
    return { id: mission.id, value: mission.value, param, round: state.round, done: false };
  }
  return null;
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
  const guess = round.playerEffectiveGuess;
  const target = round.target;
  const guessed = counters.resolved && Number.isFinite(guess) && Number.isFinite(target);
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
  const triggered = round.triggeredPassiveIds instanceof Set ? round.triggeredPassiveIds.size : 0;
  const itemCounts = round.activeUseItemCounts instanceof Map ? round.activeUseItemCounts : new Map();
  return {
    guessed,
    guess,
    target,
    dist,
    critical: Boolean(counters.resolved && round.criticalHitKeys instanceof Set && round.criticalHitKeys.has("player")),
    worst: guessed && botDists.length > 0 && dist > 0 && botDists.every((other) => dist >= other),
    closest: guessed && botDists.every((other) => dist <= other),
    lowest: guessed && botGuesses.length > 0 && botGuesses.every((other) => guess < other),
    botsFarther: guessed ? botDists.filter((other) => other > dist).length : 0,
    damageTaken: Math.max(0, Math.ceil(state.playerLastDamage || 0)),
    hp: state.player.hp,
    startHp: counters.startHp,
    eliminations: killedBots.length,
    eliminatedTypes: Array.isArray(round.eliminatedPersonalities) ? round.eliminatedPersonalities : [],
    bestBounty: killedBots.reduce((best, bot) => Math.max(best, Number(bot.eliminationReward) || 0), 0),
    bossesKilled: killedBots.filter((bot) => bot.isBoss).length,
    fullKills: killedBots.filter((bot) => {
      const start = counters.botStart[bot.id];
      return start && start.hp >= start.maxHp;
    }).length,
    botDamage: startedBots.reduce((sum, bot) => sum + Math.max(0, Number(bot.lastDamage) || 0), 0),
    everyBotHit10:
      counters.resolved &&
      readyIds.length > 0 &&
      readyIds.every((id) => {
        const bot = state.bots.find((entry) => entry.id === id);
        return bot && (Number(bot.lastDamage) || 0) >= 10;
      }),
    sealsTriggered: triggered,
    artifactsUsed: Math.max(0, round.activeUses || 0),
    distinctArtifacts: itemCounts.size,
    artifactsHeld: (state.player.actives || []).length,
    buys: counters.buys,
    sealsBought: counters.sealsBought,
    rerolls: counters.rerolls,
    sells: counters.sells,
    earned: Math.max(0, Math.ceil(round.earnedSinThisRound || 0)),
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
  addLog(`Mission done: ${text} +${current.value} FAVOR.`);
  if (state.roundState) addRoundEvent(`Mission done: +${current.value} FAVOR.`);
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

// kind: "buySeal" | "buyArtifact" | "reroll" | "sell" | "artifact"
function missionsNoteShop(kind) {
  if (!missionsEnabled()) return;
  const counters = missionsState().round;
  if (kind === "buySeal" || kind === "buyArtifact") counters.buys += 1;
  if (kind === "buySeal") counters.sealsBought += 1;
  if (kind === "reroll") counters.rerolls += 1;
  if (kind === "sell") counters.sells += 1;
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
    const healed = healPlayer(reward.soul, "The slot machine", SLOT_SOURCE);
    parts.push(healed > 0 ? `+${healed} SOUL` : state.player.hp >= playerMaxHp() ? "SOUL already full" : "SOUL blocked");
  }
  if (reward.damagePercent > 0) {
    const targets = activeBots();
    damageBots(
      targets,
      (bot) => Math.ceil((bot.maxHp || 0) * (reward.damagePercent / 100)),
      (bot, dealt) => `The slot machine dealt ${dealt} damage to ${bot.name}.`,
      SLOT_SOURCE
    );
    parts.push(`${reward.damagePercent}% damage to every DAMNED`);
  }
  if (reward.elite > 0) {
    const choices = (state.player.passives || []).filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id) && !isNonUpgradableSeal(item.id));
    if (choices.length) {
      const seal = randomFrom(choices);
      seal.stack = (seal.stack || 1) + reward.elite;
      // a free level: selling the SEAL does not pay it back
      seal.freeStacks = (seal.freeStacks || 0) + reward.elite;
      recordEliteLevelBought(seal.id, seal.stack);
      if (typeof syncShopSlotCount === "function") syncShopSlotCount();
      parts.push(`${passiveDisplayName(seal)}`);
    } else {
      parts.push("ELITE, but no SEAL can take it");
    }
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
  addLog(`${SLOT_SOURCE}: ${spin.icons.map(slotIconLabel).join(" | ")}. ${missions.lastText}.`);
  if (state.roundState) addRoundEvent(`${SLOT_SOURCE}: ${missions.lastText}.`);
  if (state.player.hp <= 0) finishGameOverRound();
  // a spin can finish a mission (SIN earned, DAMNED eliminated, ...)
  missionsCheck("event");
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
      ${row("sin", `+3${SIN_MARK}`, `+6${SIN_MARK}`, `+20${SIN_MARK}`)}
      ${row("soul", "+2 SOUL", "+4 SOUL", "+10 SOUL")}
      ${row("damage", "5%", "10%", "30%")}
      ${row("elite", "–", "–", "ELITE on a SEAL")}
      ${row("karma", "1 ARTIFACT", "2 ARTIFACTS", `+6${KARMA_MARK}`)}
      ${row("reroll", "2 rerolls", "4 rerolls", "10 rerolls")}
      <div class="slot-pay-note">Each symbol pays for how many of it came up. DAMAGE is % of max SOUL to every DAMNED. ELITE gives a random SEAL of yours an ELITE level. Free rerolls are kept until used. Missions pay FAVOR${FAVOR_MARK}.</div>
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
  const result = spin ? "" : missions.lastText;
  const disabled = slotCanSpin() ? "" : "disabled";
  const tooltip = `${slotPaytableHtml()}`;
  return `
    <div class="slot-machine${triple && missions.lastText ? " slot-triple" : ""}" data-tooltip-html="${escapeAttr(tooltip)}">
      <div class="slot-reels">${reels}</div>
      <div class="slot-side">
        <button type="button" id="slotSpin" class="slot-spin" ${disabled}>Spin <span class="slot-cost">${SLOT_SPIN_COST}${FAVOR_MARK}</span></button>
        <span class="slot-favor" aria-label="You have ${missions.doubloons} FAVOR">${formatNumber(missions.doubloons)}${FAVOR_MARK}</span>
      </div>
      <div class="slot-result">${escapeHtml(result || "Missions pay FAVOR.")}</div>
    </div>
  `;
}

function missionBoxHtml() {
  if (!missionsEnabled()) return "";
  const current = missionsEnsureRound();
  if (!current) return "";
  const mission = MISSION_BY_ID[current.id];
  const counters = missionsState().round;
  let status = "";
  if (current.done) status = "Done";
  else if (mission.when === "resolve" && counters.resolved && !mission.progress) status = "Missed";
  else if (mission.progress) status = mission.progress(missionFacts(), current.param);
  else if (mission.when === "leave") status = "At NEXT ROUND";
  const statusClass = current.done ? "done" : status === "Missed" ? "missed" : "";
  return `
    <div class="mission-box ${statusClass}" data-tooltip="A new mission every round. Finish it to earn FAVOR for the slot machine (${SLOT_SPIN_COST} a spin).">
      <div class="mission-head">
        <span class="mission-title">Mission</span>
        ${status ? `<span class="mission-status ${statusClass}">${escapeHtml(status)}</span>` : ""}
        <span class="mission-reward">+${current.value}${FAVOR_MARK}</span>
      </div>
      <div class="mission-text">${escapeHtml(missionText(mission, current.param))}</div>
    </div>
  `;
}

// the phone app: one band between the DAMNED and the SEALS
function nativeSlotBandHtml() {
  if (!missionsEnabled()) return "";
  return `<section class="native-slot-band" aria-label="Slot machine and mission">${slotMachineHtml()}${missionBoxHtml()}</section>`;
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
