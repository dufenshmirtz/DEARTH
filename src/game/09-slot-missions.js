/* ---------- Satan's bets (missions in the code) and the slot machine ----------
   Every round one random mission appears (drawn when the round starts, lazily on the first render so logic
   tests keep their random numbers). It is replaced at the start of the next round, done or not. A finished
   mission pays its FAVOR (1, 2, 3, 4, 6 or 8) at once. The slot machine left of the guess area is always available:
   a spin costs SLOT_SPIN_COST FAVOR, three reels each land on one icon, and the reward depends on how many
   of each icon came up (SLOT_PAYOUTS). Arcade only: no PvP, not in the story's tutorial rounds.
   Run state: state.missions (saved with the run); free rerolls won here: state.slotFreeRerolls (they last
   until used, unlike the Seal of the Son's). Hooks: startGame, beginRound, submitGuess (missionsNoteReveal),
   applyPenalties (READY and the results), advanceAfterSummary, buyShopItem, rerollShopClick, the sells,
   consumeActive, spendCredits and satanPactPay (missionsNoteSpend), resolveEliminatedBots
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
const FAVOR_MARK = `<span class="favor-mark" role="img" aria-label="FAVOR"></span>`; // built once at load, before the language is known: stays English (screen readers only)

/* ---- the missions ("Satan's Bets"): 23 worth 1 FAVOR, 23 worth 2, 22 worth 3 or more (3, 4, 6 or 8) ----
   The owner's list of Nov 17 2026, texts as he wrote them (Guess 0 and Guess 100 raised to 6 later that day). Each round MISSION_TIER_ODDS decides how much the mission
   is worth (45% 1 FAVOR, 40% 2, 15% 3 or more; the 3, 4, 6 and 8 ones share that 15%), then a mission of that worth
   is drawn, every one as likely as the next. Only missions that can be done right now are drawn.
   when: "event"   checked after every action (shop, ARTIFACT, spin, deal, GUESS) and after the results
         "resolve" checked once the round's results are in (and after any later action that round)
         "leave"   checked when you move on to the next round (NEXT ROUND)
   can(): may this mission be drawn now? param(): a value drawn with it (shown in the text).
   failed(): it can no longer be done this round (the box says Lost).
   "at reveal" = the moment the TARGET first shows, right after GUESS (missionsNoteReveal): the guesses then against
   that TARGET, before any ARTIFACT or SEAL moves them. The others read the round as it is scored at READY
   (missionsNoteReady). Bets that compare you with the DAMNED are paid after READY even when they read the reveal,
   so the box never gives away a hidden guess. */
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

// ARTIFACTS you aim at a DAMNED
function missionTargetedArtifactsHeld() {
  return missionHeldArtifactIds().filter((id) => TARGETED_ARTIFACT_IDS.has(id) || id === "a11").length;
}

function missionShopOpen() {
  return typeof shopDisabledBySatan !== "function" || !shopDisabledBySatan();
}

// different SEALS in your slots (ELITE copies count once)
function missionSealKinds() {
  return new Set((state.player?.passives || []).filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id)).map((item) => item.id)).size;
}

const missionTargets = (f, param) => (param ? f.targetCounts.get(param.id) || 0 : 0);

function missionIsPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return false;
  return true;
}

// mission texts read exactly as the list they were written from: "Use a Spirit Board", "Eliminate an Anchor damned"
function missionWithArticle(word) {
  return `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;
}

function missionArtifactWithArticle(name) {
  if (!name) return "an artifact";
  if (/^the\s/i.test(name)) return name;
  return missionWithArticle(name);
}

// "3/12" while it is still open
const missionCount = (value, goal) => `${Math.min(goal, Math.max(0, value))}/${goal}`;

// your guess against the DAMNED's, from a snapshot ({ guess, distance, bots: [{ id, guess, distance }] })
const missionClosest = (snap) => Boolean(snap && snap.bots.length && snap.bots.every((bot) => snap.distance <= bot.distance));
function missionWorst(snap) {
  if (!snap) return false;
  const worst = Math.max(snap.distance, ...snap.bots.map((bot) => bot.distance));
  return worst > 0 && snap.distance === worst;
}

// a bet on one of the ARTIFACTS you hold
const missionHeldArtifactParam = () => {
  const ids = [...new Set(missionHeldArtifactIds())];
  return ids.length ? randomFrom(ids) : null;
};
const missionNamedBotParam = () => {
  const bots = missionNameableBots();
  return bots.length ? missionBotParam(randomFrom(bots)) : null;
};

// counted ones: { id, value, text, goal, count(f), when, can }
function missionCounted(id, value, text, goal, count, extra = {}) {
  return { id, value, when: "event", text, check: (f) => count(f) >= goal, progress: (f) => missionCount(count(f), goal), ...extra };
}

const MISSIONS = [
  // ---- 1 FAVOR (23) ----
  { id: "noBuy", value: 1, when: "leave", text: "Don't buy any Devil's Offerings", can: missionShopOpen, check: (f) => f.buys === 0, failed: (f) => f.buys > 0 },
  { id: "noKill", value: 1, when: "resolve", text: "Don't eliminate any Damned", check: (f) => f.eliminations === 0, failed: (f) => f.eliminations > 0 },
  {
    id: "noArtifactsHeld",
    value: 1,
    when: "leave",
    text: "Have 0 artifacts in your inventory at the end of the round",
    can: () => missionHeldArtifactIds().length >= 1,
    check: (f) => f.artifactsHeld === 0
  },
  {
    id: "useOn",
    value: 1,
    when: "event",
    text: (param) => `Use an artifact on ${param?.name || "a Damned"}`,
    can: () => missionTargetedArtifactsHeld() >= 1 && activeUseLimit() >= 1,
    param: missionNamedBotParam,
    check: (f, param) => missionTargets(f, param) >= 1,
    failed: (f) => f.resolved
  },
  // your final guess against the round's final TARGET (an exact hit is neither)
  { id: "guessAbove", value: 1, when: "resolve", text: "Guess above the round target", check: (f) => f.guessed && Number.isFinite(f.target) && f.guess > f.target },
  { id: "guessBelow", value: 1, when: "resolve", text: "Guess below the round target", check: (f) => f.guessed && Number.isFinite(f.target) && f.guess < f.target },
  // 0 is a multiple of both
  { id: "guessMultiple3", value: 1, when: "resolve", text: "Guess a multiple of 3", check: (f) => f.guessed && f.guess % 3 === 0 },
  { id: "guessMultiple5", value: 1, when: "resolve", text: "Guess a multiple of 5", check: (f) => f.guessed && f.guess % 5 === 0 },
  { id: "kill1", value: 1, when: "resolve", text: "Eliminate a Damned", check: (f) => f.eliminations >= 1 },
  // buying a SEAL you own is its ELITE upgrade
  { id: "buySeal", value: 1, when: "event", text: "Buy or upgrade a seal", can: missionShopOpen, check: (f) => f.sealsBought >= 1 },
  missionCounted("buyArtifacts2", 1, "Buy two artifacts", 2, (f) => f.artifactsBought, { can: missionShopOpen }),
  {
    id: "guessDigit",
    value: 1,
    when: "resolve",
    text: (param) => `Guess a number containing the digit ${param?.digit ?? 0}`,
    param: () => ({ digit: Math.floor(Math.random() * 10) }),
    check: (f, param) => f.guessed && Boolean(param) && String(f.guess).includes(String(param.digit))
  },
  missionCounted("reroll2", 1, "Reroll Devil's Offerings 2 times", 2, (f) => f.rerolls, { can: missionShopOpen }),
  // every SIN you pay: the Devil's Offerings, paid rerolls, the deal's SIN
  missionCounted("spend12", 1, "Spend at least 12 SIN", 12, (f) => f.spent),
  {
    id: "revealWithin10",
    value: 1,
    when: "event",
    text: "Guess within 10 of the TARGET at reveal",
    check: (f) => Boolean(f.reveal) && f.reveal.distance <= 10,
    failed: (f) => Boolean(f.reveal) && f.reveal.distance > 10
  },
  // a tie for the worst guess is the worst guess (as for its penalty)
  { id: "notWorstReveal", value: 1, when: "resolve", text: "Don't have the worst Guess at reveal", check: (f) => Boolean(f.reveal) && !missionWorst(f.reveal) },
  {
    id: "closerThan3",
    value: 1,
    when: "resolve",
    text: "Guess closer than 3 DAMNED",
    check: (f) => Boolean(f.ready) && f.ready.bots.filter((bot) => bot.distance > f.ready.distance).length >= 3
  },
  { id: "hurtMax11", value: 1, when: "resolve", text: "Take 11 damage or less", check: (f) => f.guessed && f.damageTaken <= 11 },
  // SIN from sales is not earned
  missionCounted("earn5", 1, "Earn 5 SIN this round", 5, (f) => f.earned),
  // everyone at the table this round, a BOSS too, damage from anything
  missionCounted("damnedTake40", 1, "The DAMNED take at least 40 damage in total", 40, (f) => f.botDamageTotal, { when: "resolve" }),
  missionCounted("useTwo", 1, "Use two ARTIFACTS", 2, (f) => f.artifactsUsed, {
    can: () => missionHeldArtifactIds().length >= 2 && activeUseLimit() >= 2,
    failed: (f) => f.resolved
  }),
  { id: "sellSeal", value: 1, when: "event", text: "Sell a SEAL", can: () => missionSealKinds() >= 1, check: (f) => f.sealSells >= 1 },
  { id: "nextRound12Sin", value: 1, when: "leave", text: "Go into the next round with 12 sin or more", check: (f) => f.sin >= 12 },

  // ---- 2 FAVOR (23) ----
  {
    id: "useItem",
    value: 2,
    when: "event",
    text: (param) => `Use ${missionArtifactWithArticle(ITEMS[param]?.name)}`,
    can: () => activeUseLimit() >= 1,
    param: missionHeldArtifactParam,
    check: (f, param) => (f.itemCounts.get(param) || 0) >= 1,
    failed: (f) => f.resolved
  },
  { id: "noArtifacts", value: 2, when: "resolve", text: "Don't use artifacts this round", can: () => missionHeldArtifactIds().length >= 1, check: (f) => f.artifactsUsed === 0, failed: (f) => f.artifactsUsed > 0 },
  { id: "kill2", value: 2, when: "resolve", text: "Eliminate two Damned", check: (f) => f.eliminations >= 2, progress: (f) => missionCount(f.eliminations, 2) },
  missionCounted("buy3", 2, "Buy three seals or artifacts", 3, (f) => f.buys, { can: missionShopOpen }),
  { id: "killRevealed", value: 2, when: "resolve", text: "Eliminate a revealed Damned", check: (f) => f.kills.some((kill) => kill.revealed) },
  {
    id: "killName",
    value: 2,
    when: "resolve",
    text: (param) => `Eliminate ${param?.name || "a Damned"}`,
    param: missionNamedBotParam,
    check: (f, param) => Boolean(param) && f.killedIds.has(param.id)
  },
  { id: "sameGuess", value: 2, when: "resolve", text: "Guess the same number as a revealed damned", check: (f) => f.guessed && f.matchesRevealed },
  {
    id: "useOn2",
    value: 2,
    when: "event",
    text: (param) => `Use two artifacts on ${param?.name || "a Damned"}`,
    can: () => missionTargetedArtifactsHeld() >= 2 && activeUseLimit() >= 2,
    param: missionNamedBotParam,
    check: (f, param) => missionTargets(f, param) >= 2,
    progress: (f, param) => missionCount(missionTargets(f, param), 2),
    failed: (f) => f.resolved
  },
  {
    id: "useOnBoth",
    value: 2,
    when: "event",
    text: (param) => `Use one artifact on ${param?.first?.name || "a Damned"} and one on ${param?.second?.name || "another"}`,
    can: () => missionTargetedArtifactsHeld() >= 2 && activeUseLimit() >= 2,
    param: () => {
      const bots = shuffled(missionNameableBots());
      return bots.length >= 2 ? { first: missionBotParam(bots[0]), second: missionBotParam(bots[1]) } : null;
    },
    check: (f, param) => Boolean(param) && missionTargets(f, param.first) >= 1 && missionTargets(f, param.second) >= 1,
    progress: (f, param) => `${(missionTargets(f, param?.first) >= 1 ? 1 : 0) + (missionTargets(f, param?.second) >= 1 ? 1 : 0)}/2`,
    failed: (f) => f.resolved
  },
  { id: "guessPrime", value: 2, when: "resolve", text: "Guess a prime number", check: (f) => f.guessed && missionIsPrime(f.guess) },
  // only when you guessed last round (missions.lastGuess)
  {
    id: "sameAsLastRound",
    value: 2,
    when: "resolve",
    text: "Guess the same number as last round",
    param: () => {
      const last = missionsState().lastGuess;
      return last && last.round === state.round - 1 && Number.isFinite(last.guess) ? { guess: last.guess } : null;
    },
    check: (f, param) => f.guessed && Boolean(param) && f.guess === param.guess
  },
  { id: "within3", value: 2, when: "resolve", text: "Guess within 3 of the TARGET", check: (f) => Boolean(f.ready) && f.ready.distance <= 3 },
  // a tie for the closest guess counts
  { id: "closest", value: 2, when: "resolve", text: "Have the closest guess amongst the other Damned", check: (f) => missionClosest(f.ready) },
  { id: "lowerThanAll", value: 2, when: "resolve", text: "Guess lower than every DAMNED", check: (f) => Boolean(f.ready) && f.ready.bots.length > 0 && f.ready.bots.every((bot) => f.ready.guess < bot.guess) },
  { id: "hurtMax5", value: 2, when: "resolve", text: "Take 5 damage or less", check: (f) => f.guessed && f.damageTaken <= 5 },
  missionCounted("reroll3", 2, "Reroll Devil's Offerings 3 times", 3, (f) => f.rerolls, { can: missionShopOpen }),
  missionCounted("earn12", 2, "Earn 12 SIN this round", 12, (f) => f.earned),
  missionCounted("spend16", 2, "Spend at least 16 SIN", 16, (f) => f.spent),
  {
    id: "everyTakes10",
    value: 2,
    when: "resolve",
    text: "Every DAMNED takes 10 damage or more",
    check: (f) => f.botDamages.length > 0 && f.botDamages.every((damage) => damage >= 10)
  },
  {
    id: "nextRound5Artifacts",
    value: 2,
    when: "leave",
    text: "Go into the next round holding 5 ARTIFACTS",
    can: () => missionHeldArtifactIds().length >= 5 || missionShopOpen(),
    check: (f) => f.artifactsHeld >= 5
  },
  // a personality one of the DAMNED at the table has (a STUBBORN BOSS counts as Stubborn)
  {
    id: "killPersonality",
    value: 2,
    when: "resolve",
    text: (param) => `Eliminate ${missionWithArticle(param?.type || "Stubborn")} damned`,
    param: () => {
      const types = [...new Set(activeBots().filter((bot) => !bot.immortal).flatMap((bot) => personalityTypes(bot)))];
      return types.length ? { type: randomFrom(types) } : null;
    },
    check: (f, param) => Boolean(param) && f.kills.some((kill) => (kill.types || []).includes(param.type))
  },
  // different SEALS acting this round; only when you have that many in your slots
  { id: "seals3", value: 2, when: "resolve", text: "Have 3 seals trigger this round", can: () => missionSealKinds() >= 3, check: (f) => f.sealsTriggered >= 3 },
  { id: "closestReveal", value: 2, when: "resolve", text: "Have the closest Guess at reveal", check: (f) => missionClosest(f.reveal) },

  // ---- 3 FAVOR or more (22) ----
  { id: "critical", value: 3, when: "resolve", text: "Get a critical hit", check: (f) => f.critical },
  { id: "zeroSin", value: 3, when: "leave", text: "Have 0 sin at the end of the round", check: (f) => f.sin === 0 },
  missionCounted("reroll6", 3, "Reroll 6 times", 6, (f) => f.rerolls, { can: missionShopOpen }),
  { id: "under11", value: 3, when: "resolve", text: "Guess under 11", check: (f) => f.guessed && f.guess < 11 },
  {
    id: "killMemory",
    value: 3,
    when: "resolve",
    text: "Eliminate a Damned with 12 or more memory",
    can: () => activeBots().some((bot) => !bot.immortal && (bot.memory || []).length >= 12),
    check: (f) => f.kills.some((kill) => kill.memory >= 12)
  },
  {
    id: "killBounty",
    value: 3,
    when: "resolve",
    text: "Eliminate a Damned with 12 or more bounty",
    can: () => activeBots().some((bot) => !bot.immortal && missionBountyOf(bot) >= 12),
    check: (f) => f.kills.some((kill) => kill.bounty >= 12)
  },
  {
    id: "keepWeakest",
    value: 3,
    when: "resolve",
    text: (param) => `Keep ${param?.name || "the weakest Damned"} alive`,
    param: () => {
      const bots = missionNameableBots();
      if (!bots.length) return null;
      const least = Math.min(...bots.map((bot) => bot.hp));
      return missionBotParam(randomFrom(bots.filter((bot) => bot.hp === least)));
    },
    check: (f, param) => Boolean(param) && !f.killedIds.has(param.id),
    failed: (f, param) => Boolean(param) && f.killedIds.has(param.id)
  },
  {
    id: "killStrongest",
    value: 3,
    when: "resolve",
    text: (param) => `Eliminate ${param?.name || "the strongest Damned"}`,
    param: () => {
      const bots = missionNameableBots();
      if (!bots.length) return null;
      const most = Math.max(...bots.map((bot) => bot.hp));
      return missionBotParam(randomFrom(bots.filter((bot) => bot.hp === most)));
    },
    check: (f, param) => Boolean(param) && f.killedIds.has(param.id)
  },
  // your SOUL when you press NEXT ROUND against your SOUL when the round began
  { id: "keepSoul", value: 3, when: "leave", text: "Have the same or more SOUL at the end of the round", check: (f) => f.hp >= f.startHp },
  {
    id: "killBoss",
    value: 3,
    when: "resolve",
    text: "Defeat a Boss",
    can: () => activeBots().some((bot) => bot.isBoss && !bot.immortal),
    check: (f) => f.kills.some((kill) => kill.boss)
  },
  missionCounted("earn25", 3, "Earn 25 SIN this round", 25, (f) => f.earned),
  { id: "seals5", value: 3, when: "resolve", text: "Have 5 seals trigger this round", can: () => missionSealKinds() >= 5, check: (f) => f.sealsTriggered >= 5 },
  missionCounted("spend33", 3, "Spend at least 33 SIN", 33, (f) => f.spent),
  { id: "kill3", value: 4, when: "resolve", text: "Eliminate three Damned", check: (f) => f.eliminations >= 3, progress: (f) => missionCount(f.eliminations, 3) },
  missionCounted("buy6", 4, "Buy six seals or artifacts", 6, (f) => f.buys, { can: missionShopOpen }),
  { id: "hurt12", value: 4, when: "resolve", text: "Take 12 or more damage", check: (f) => f.guessed && f.damageTaken >= 12 },
  { id: "guess0", value: 6, when: "resolve", text: "Guess 0", check: (f) => f.guessed && f.guess === 0 },
  { id: "guess100", value: 6, when: "resolve", text: "Guess 100", can: () => playerGuessLimit() >= 100, check: (f) => f.guessed && f.guess === 100 },
  { id: "sellStartSeal", value: 4, when: "event", text: "Sell one of the seals you had at the start of the round", can: () => missionSealKinds() >= 1, check: (f) => f.startSealSold },
  { id: "kill4", value: 6, when: "resolve", text: "Eliminate four Damned", check: (f) => f.eliminations >= 4, progress: (f) => missionCount(f.eliminations, 4) },
  // only while the run's one deal is still to be made
  { id: "deal", value: 6, when: "event", text: "Complete a Deal", can: () => typeof satanPactAvailable === "function" && satanPactAvailable(), check: (f) => f.dealSigned },
  // all five DAMNED in one round (checkRoundPentakillBonus)
  { id: "pentakill", value: 8, when: "resolve", text: "Get a pentakill", check: (f) => f.pentakill }
];

const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((mission) => [mission.id, mission]));

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
    lastGuess: null, // { round, guess }: your guess last round (Guess the same number as last round)
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
    artifactsBought: 0,
    spent: 0, // SIN paid this round (missionsNoteSpend)
    sells: 0,
    sealSells: 0,
    soldSin: 0, // SIN from sales (not "gained" for the SIN missions)
    startSealIds: (state.player?.passives || []).filter(Boolean).map((item) => item.id),
    startSealSold: false,
    kills: [], // { id, memory, bounty, revealed, boss, types } as each DAMNED fell
    dealSigned: false,
    startHp: state.player?.hp ?? 0,
    botStart: {},
    readyIds: null,
    reveal: null, // the guesses when the TARGET first showed (missionsNoteReveal)
    ready: null, // the guesses as scored at READY (missionsNoteReady)
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
  if (!Array.isArray(counters.startSealIds)) counters.startSealIds = [];
  ["sealSells", "soldSin", "artifactsBought", "spent"].forEach((key) => {
    if (!Number.isFinite(counters[key])) counters[key] = 0;
  });
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
  // a mission saved before it was removed or its worth changed (the list of Nov 17 2026) is drawn again
  const saved = missions.current;
  if (!saved || saved.round !== state.round || !MISSION_BY_ID[saved.id] || MISSION_BY_ID[saved.id].value !== saved.value) {
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
  const guess = round.playerSubmittedGuess;
  const guessed = Boolean(counters.resolved) && Number.isFinite(guess);
  const startedBots = state.bots.filter((bot) => counters.botStart[bot.id]);
  const killedBots = startedBots.filter((bot) => bot.eliminated && !bot.immortal);
  const killedIds = new Set(killedBots.map((bot) => bot.id));
  // each fallen DAMNED as it was when it fell (missionsNoteElimination), or as it is now
  const kills = killedBots.map((bot) => counters.kills.find((kill) => kill.id === bot.id) || missionKillRecord(bot));
  const revealedIds = new Set(round.revealedBotIds instanceof Set ? round.revealedBotIds : []);
  state.bots.forEach((bot) => {
    if (bot.revealedByPassive && counters.botStart[bot.id]) revealedIds.add(bot.id);
  });
  const botGuesses = round.botSubmittedGuesses instanceof Map ? round.botSubmittedGuesses : new Map();
  const botDamages = startedBots.filter((bot) => !bot.immortal).map((bot) => Math.max(0, Math.ceil(bot.lastDamage || 0)));
  const triggered = round.triggeredPassiveIds instanceof Set ? round.triggeredPassiveIds : new Set();
  return {
    resolved: Boolean(counters.resolved),
    guessed,
    guess,
    target: round.target,
    critical: Boolean(counters.resolved && round.criticalHitKeys instanceof Set && round.criticalHitKeys.has("player")),
    pentakill: Boolean(round.pentakillAwarded),
    damageTaken: Math.max(0, Math.ceil(state.playerLastDamage || 0)),
    eliminations: killedBots.length,
    killedIds,
    kills,
    matchesRevealed: guessed && [...revealedIds].some((id) => botGuesses.get(id) === guess),
    reveal: counters.reveal || null,
    ready: counters.resolved ? counters.ready || null : null,
    artifactsUsed: Math.max(0, round.activeUses || 0),
    itemCounts: round.activeUseItemCounts instanceof Map ? round.activeUseItemCounts : new Map(),
    targetCounts: round.artifactTargetCountsByBotId instanceof Map ? round.artifactTargetCountsByBotId : new Map(),
    artifactsHeld: (state.player.actives || []).length,
    buys: counters.buys,
    sealsBought: counters.sealsBought || 0,
    artifactsBought: counters.artifactsBought || 0,
    spent: counters.spent || 0,
    rerolls: counters.rerolls,
    sealSells: counters.sealSells || 0,
    startSealSold: Boolean(counters.startSealSold),
    dealSigned: Boolean(counters.dealSigned),
    earned: Math.max(0, Math.ceil((round.earnedSinThisRound || 0) - (counters.soldSin || 0))),
    sin: Math.max(0, Math.ceil(state.player.credits || 0)),
    botDamages,
    botDamageTotal: botDamages.reduce((sum, damage) => sum + damage, 0),
    sealsTriggered: [...triggered].filter((id) => typeof id === "string" && /^p\d+$/.test(id)).length,
    hp: Math.max(0, Math.ceil(state.player.hp || 0)),
    startHp: Math.max(0, Math.ceil(counters.startHp || 0))
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
// your guess and the DAMNED's against a TARGET: { target, guess, distance, bots: [{ id, guess, distance }] }
function missionGuessSnapshot(target, playerGuess, botGuessOf) {
  if (!Number.isFinite(target) || !Number.isFinite(playerGuess)) return null;
  const distance = (guess) => Math.ceil(Math.abs(guess - target));
  const bots = activeBots()
    .filter((bot) => !bot.immortal)
    .map((bot) => ({ id: bot.id, guess: botGuessOf(bot) }))
    .filter((bot) => Number.isFinite(bot.guess))
    .map((bot) => ({ ...bot, distance: distance(bot.guess) }));
  return { target, guess: playerGuess, distance: distance(playerGuess), bots };
}

// GUESS: the TARGET has just been shown (submitGuess), before any ARTIFACT or SEAL moves it
function missionsNoteReveal() {
  if (!missionsEnabled()) return;
  const round = state.roundState;
  if (!round) return;
  const guesses = round.botEffectiveGuesses instanceof Map ? round.botEffectiveGuesses : new Map();
  const target = Number.isFinite(round.revealedTarget) ? round.revealedTarget : round.target;
  const missions = missionsState();
  missions.round.reveal = missionGuessSnapshot(target, round.playerEffectiveGuess, (bot) => guesses.get(bot.id));
  // the round's mission is drawn on the first render; a logic test without one keeps its random numbers
  if (missions.current && missions.current.round === state.round) missionsCheck("event");
}

// READY: who is at the table for this guess, and the guesses as they are scored (the final TARGET)
function missionsNoteReady() {
  if (!missionsEnabled()) return;
  const counters = missionsState().round;
  counters.readyIds = activeBots().map((bot) => bot.id);
  const round = state.roundState;
  if (!round) return;
  const guesses = round.botEffectiveGuesses instanceof Map ? round.botEffectiveGuesses : new Map();
  counters.ready = missionGuessSnapshot(round.target, round.playerEffectiveGuess, (bot) => guesses.get(bot.id));
}

// the results are in (end of applyPenalties); your guess is kept for next round's "same number" bet
function missionsAfterResolution() {
  if (!missionsEnabled()) return;
  const missions = missionsState();
  missions.round.resolved = true;
  const guess = state.roundState?.playerSubmittedGuess;
  if (Number.isFinite(guess)) missions.lastGuess = { round: state.round, guess };
  missionsCheck("resolve");
}

// SIN you paid: spendCredits (the Devil's Offerings, paid rerolls) and the deal's SIN price (satanPactPay)
function missionsNoteSpend(amount) {
  if (!missionsEnabled()) return;
  const cost = Math.max(0, Math.ceil(amount || 0));
  if (cost > 0) missionsState().round.spent += cost;
}

// NEXT ROUND: the "go into the next round" missions, before the round changes
function missionsBeforeNextRound() {
  if (!missionsEnabled()) return;
  missionsCheck("leave");
}

// a DAMNED as it falls: its MEMORY, BOUNTY, whether its guess was revealed, BOSS or not, its personalities
function missionKillRecord(bot) {
  return {
    id: bot.id,
    memory: (bot.memory || []).length,
    bounty: missionBountyOf(bot),
    revealed: Boolean(bot.revealedByPassive),
    boss: Boolean(bot.isBoss),
    types: personalityTypes(bot)
  };
}

// a DAMNED falls (resolveEliminatedBots)
function missionsNoteElimination(bot) {
  if (!missionsEnabled() || !bot) return;
  const counters = missionsState().round;
  if (counters.kills.some((kill) => kill.id === bot.id)) return;
  counters.kills.push(missionKillRecord(bot));
}

// the deal was signed (satanPactSign)
function missionsNoteDeal() {
  if (!missionsEnabled()) return;
  missionsState().round.dealSigned = true;
  missionsCheck("event");
}

// kind: "buySeal" | "buyArtifact" | "reroll" | "sell" | "artifact"
// a sale: info = { sin: SIN it paid, sealIds: the SEALS sold (none for an ARTIFACT) }
function missionsNoteShop(kind, info = {}) {
  if (!missionsEnabled()) return;
  const counters = missionsState().round;
  if (kind === "buySeal" || kind === "buyArtifact") counters.buys += 1;
  if (kind === "buySeal") counters.sealsBought += 1;
  if (kind === "buyArtifact") counters.artifactsBought += 1;
  if (kind === "reroll") counters.rerolls += 1;
  if (kind === "sell") {
    counters.sells += 1;
    counters.soldSin = (counters.soldSin || 0) + Math.max(0, Math.ceil(info.sin || 0));
    const sealIds = Array.isArray(info.sealIds) ? info.sealIds : [];
    if (sealIds.length) {
      counters.sealSells = (counters.sealSells || 0) + 1;
      if (sealIds.some((id) => (counters.startSealIds || []).includes(id))) counters.startSealSold = true;
    }
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
  return `<span class="slot-icon slot-icon-${key}" role="img" aria-label="${escapeAttr(t(slotIconLabel(key)))}"><span class="slot-glyph">${slotGlyphHtml(key)}</span></span>`;
}

// the slot machine's description: each symbol with what 1, 2 or 3 of it pay
function slotPaytableHtml() {
  const symbol = (key) => `<span class="slot-pay-glyph slot-icon-${key}" role="img" aria-label="${escapeAttr(t(slotIconLabel(key)))}">${slotGlyphHtml(key)}</span>`;
  const row = (key, one, two, three) =>
    `<div class="slot-pay-row">${symbol(key)}<span>${t(one)}</span><span>${t(two)}</span><span>${t(three)}</span></div>`;
  return `
    <div class="slot-paytable">
      <div class="slot-pay-title">${t("Slot machine · {cost} a spin", { cost: `${SLOT_SPIN_COST}${FAVOR_MARK}` })}</div>
      <div class="slot-pay-row slot-pay-head"><span></span><span>×1</span><span>×2</span><span>×3</span></div>
      ${row("sin", `+5${SIN_MARK}`, `+18${SIN_MARK}`, `+150${SIN_MARK}`)}
      ${row("soul", "+1 SOUL", "+4 SOUL", "+20 SOUL")}
      ${row("damage", "5%", "15%", "100%")}
      ${row("elite", "–", "–", "ELITE on every SEAL")}
      ${row("karma", "3 ARTIFACTS", `+1${KARMA_MARK}`, `+10${KARMA_MARK}`)}
      ${row("reroll", "2 rerolls", "8 rerolls", "30 rerolls")}
      <div class="slot-pay-note">${t("Each symbol pays for how many of it came up. DAMAGE is % of max SOUL to every DAMNED, dealt at the end of the next round. SOUL can't be blocked. Three ELITES give every SEAL of yours an ELITE level. Free rerolls are kept until used. Satan's bets pay FAVOR{favor}.", { favor: FAVOR_MARK })}</div>
    </div>
  `;
}

// Settings > Display > Slot machine: 0 Default, 1 Fancy (state.display.slotMachine)
function slotMachineFancy() {
  return state.display?.slotMachine === 1;
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
  const tripleClass = triple && missions.lastText ? " slot-triple" : "";
  const resultHtml = `<div class="slot-result${result ? "" : " guide-text"}">${escapeHtml(t(result || "Satan's bets pay FAVOR."))}</div>`;
  // Settings > Display > Slot machine: Default (the framed box with SPIN) or Fancy (the old machine below)
  if (!slotMachineFancy()) {
    return `
    <div class="slot-machine${tripleClass}" data-tooltip-html="${escapeAttr(tooltip)}">
      <div class="slot-reels">${reels}</div>
      <div class="slot-side">
        <button type="button" id="slotSpin" class="slot-spin" ${disabled}>${t("Spin")} <span class="slot-cost">${SLOT_SPIN_COST}${FAVOR_MARK}</span></button>
        <span class="slot-favor" aria-label="${t("You have {count} FAVOR", { count: missions.doubloons })}">${formatNumber(missions.doubloons)}${FAVOR_MARK}</span>
      </div>
      ${resultHtml}
    </div>
  `;
  }
  // Fancy: FAVOR on a little mechanical counter (three digits, more if it ever gets that far)
  const favorDigits = String(Math.max(0, Math.floor(missions.doubloons || 0)))
    .padStart(3, "0")
    .split("")
    .map((digit) => `<b>${digit}</b>`)
    .join("");
  // the lever swings down and back on a pull: the spin's first render adds the class, which starts the animation
  const pulling = spin && Date.now() - spin.at < 400;
  const rivets = ["tl", "tr", "bl", "br"].map((corner) => `<i class="slot-rivet slot-rivet-${corner}" aria-hidden="true"></i>`).join("");
  return `
    <div class="slot-machine slot-fancy${tripleClass}" data-tooltip-html="${escapeAttr(tooltip)}">
      ${rivets}
      <div class="slot-reels">${reels}</div>
      <div class="slot-side">
        <span class="slot-favor" aria-label="${t("You have {count} FAVOR", { count: missions.doubloons })}"><span class="slot-counter" aria-hidden="true">${favorDigits}</span>${FAVOR_MARK}</span>
      </div>
      ${resultHtml}
      <button type="button" id="slotSpin" class="slot-lever${pulling ? " pulling" : ""}" aria-label="${t("Pull the lever: spin for {cost} FAVOR", { cost: SLOT_SPIN_COST })}" ${disabled}><span class="slot-lever-hub"></span><span class="slot-lever-rod"></span><span class="slot-lever-knob"></span></button>
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
    <div class="mission-box ${statusClass}" data-tooltip="${t("Satan bets you can't do this. A new bet every round; win it to earn FAVOR for the slot machine ({cost} a spin).", { cost: SLOT_SPIN_COST })}">
      <div class="mission-head">
        <span class="mission-title">${t("Satan's Bet")}</span>
        ${status ? `<span class="mission-status ${statusClass}">${escapeHtml(t(status))}</span>` : ""}
        <span class="mission-reward">+${current.value}${FAVOR_MARK}</span>
      </div>
      <div class="mission-text">${escapeHtml(t(missionText(mission, current.param)))}</div>
    </div>
  `;
}

// the phone app: a rail on the left of the DAMNED, under the TARGET box (slot machine on top, mission under it)
function nativeSlotBandHtml() {
  if (!missionsEnabled()) return "";
  return `<section class="native-slot-band" aria-label="${t("Slot machine and Satan's bet")}">${slotMachineHtml()}${missionBoxHtml()}</section>`;
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
