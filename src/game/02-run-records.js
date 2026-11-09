"use strict";

/* ---------- Records ----------
   Two stores, both shown on the Records screen (the Relic Wall, renderRecordsMenu in 09-rendering):
   - best values of one run: localStorage ARCADE_RECORDS_STORAGE_KEY (defaultArcadeRecords), raised by
     updateArcadeRecordsFromCurrentRun on every save and at game over;
   - lifetime numbers: localStorage RECORDS_LIFETIME_STORAGE_KEY (defaultLifetimeRecords): Guess quality,
     how often each SEAL / ARTIFACT / build was played, who killed you, SIN earned, pacts, runs.
   Lifetime counters the Collection already keeps (games beaten, DAMNED / demons / Yannis eliminated,
   CRITICALS in a row, most SIN held...) are read from there (loadCollectionProgress).

   Guess quality: every resolved round scores your final guess against the final TARGET:
   a CRITICAL scores 100, anything else 100 x GUESS_QUALITY_STEP ^ distance (at most 99).
   The shown number is the average, rounded down, so 100 means every guess was a CRITICAL. */

const RECORDS_LIFETIME_STORAGE_KEY = "dearthRecordsLifetimeV1";
const GUESS_QUALITY_STEP = 0.9; // each step away from the TARGET keeps 90% of the score
const GUESS_QUALITY_RECENT = 100; // "last 100 guesses"
const GUESS_QUALITY_MIN_RUN_GUESSES = 10; // a run needs this many guesses to set Best run Guess quality
const DEEPEST_DESCENT_ROUND_SPAN = 1000; // deepestDescent.value = depth x 1000 + round

function emptyRecord(extra = {}) {
  return { value: 0, ...extra };
}

function defaultRunStats() {
  return {
    overallDamage: 0,
    currentRoundDamage: 0,
    singleRoundDamage: 0,
    pentakills: 0,
    criticals: 0,
    guessSum: 0,
    guessRounds: 0,
    currentRoundSealDamage: {},
    maxSealRoundDamage: emptyRecord({ id: "", name: "" }),
    highestEliteLevel: emptyRecord({ id: "", name: "" }),
    sealPlays: {},
    artifactPlays: {},
    // SEALS that have been in a slot this run (each counts once per run for Most played SEAL)
    sealsSeen: {}
  };
}

function normalizeRunStats(stats) {
  const base = defaultRunStats();
  const source = stats && typeof stats === "object" ? stats : {};
  const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
  const object = (value) => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
  return {
    ...base,
    ...source,
    overallDamage: Math.max(0, Math.ceil(Number(source.overallDamage) || 0)),
    currentRoundDamage: Math.max(0, Math.ceil(Number(source.currentRoundDamage) || 0)),
    singleRoundDamage: Math.max(0, Math.ceil(Number(source.singleRoundDamage) || 0)),
    pentakills: count(source.pentakills),
    criticals: count(source.criticals),
    guessSum: count(source.guessSum),
    guessRounds: count(source.guessRounds),
    currentRoundSealDamage: object(source.currentRoundSealDamage),
    maxSealRoundDamage:
      source.maxSealRoundDamage && typeof source.maxSealRoundDamage === "object"
        ? { ...emptyRecord({ id: "", name: "" }), ...source.maxSealRoundDamage }
        : base.maxSealRoundDamage,
    highestEliteLevel:
      source.highestEliteLevel && typeof source.highestEliteLevel === "object"
        ? { ...emptyRecord({ id: "", name: "" }), ...source.highestEliteLevel }
        : base.highestEliteLevel,
    sealPlays: object(source.sealPlays),
    artifactPlays: object(source.artifactPlays),
    sealsSeen: object(source.sealsSeen)
  };
}

function ensureRunStats() {
  state.runStats = normalizeRunStats(state.runStats);
  return state.runStats;
}

/* ---------- best values of one run ---------- */
function defaultArcadeRecords() {
  return {
    // how far a run went (deepestDescentDepth) and the build you had when you got there
    deepestDescent: emptyRecord({ depth: 0, demons: 0, bosses: 0, round: 0, build: [], artifacts: [] }),
    mostEliminations: emptyRecord(),
    mostBossEliminations: emptyRecord(),
    mostOverallDamage: emptyRecord(),
    mostSingleRoundDamage: emptyRecord(),
    highestRoundReached: emptyRecord(),
    mostPentakills: emptyRecord(),
    mostCriticals: emptyRecord(),
    bestRunGuessQuality: emptyRecord({ guesses: 0 }),
    // lower is better (RECORD_LOWER_IS_BETTER): the round the 8th BOSS fell
    fastestWin: emptyRecord(),
    mostOverallSealDamage: emptyRecord({ id: "", name: "" }),
    mostRoundSealDamage: emptyRecord({ id: "", name: "" }),
    highestEliteLevel: emptyRecord({ id: "", name: "" })
  };
}

const RECORD_LOWER_IS_BETTER = new Set(["fastestWin"]);

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

function recordBeats(key, value, current) {
  if (value <= 0) return false;
  if (RECORD_LOWER_IS_BETTER.has(key)) return current <= 0 || value < current;
  return value > current;
}

function updateRecordIfHigher(records, key, candidate) {
  const current = records[key] || emptyRecord();
  const value = Math.max(0, Math.ceil(Number(candidate?.value) || 0));
  if (!recordBeats(key, value, Math.max(0, Math.ceil(Number(current.value) || 0)))) return;
  records[key] = { ...current, ...candidate, value };
}

// the unique BOSSES beaten this run (Petros counts once both twins are down)
function uniqueBossesBeatenThisRun() {
  const kills = Array.isArray(state.collectionRun?.uniqueKills) ? state.collectionRun.uniqueKills : [];
  return UNIQUE_BOSS_KEYS.filter((key) => (key === "petros" ? kills.includes("petros") && kills.includes("pavlos") : kills.includes(key))).length;
}

// depth: the unique BOSSES beaten (0-8), then +1 for every Goetic demon slain after them
function deepestDescentDepth() {
  return uniqueBossesBeatenThisRun() + Math.max(0, Math.floor(Number(state.goeticBossKills) || 0));
}

// the SEALS (with ELITE level) and ARTIFACTS held right now
function currentBuildSnapshot() {
  const build = (state.player?.passives || [])
    .filter((item) => item?.id)
    .map((item) => ({ id: item.id, elite: isSelfStackingSeal(item) ? 0 : Math.max(0, (item.stack || 1) - 1) }));
  const artifacts = (state.player?.actives || []).filter((item) => item?.id).map((item) => item.id);
  return { build, artifacts };
}

function runGuessQuality(stats = ensureRunStats()) {
  return guessQualityValue(stats.guessSum, stats.guessRounds);
}

// what this run has reached for each record. Best run Guess quality only counts a finished run.
function currentRunRecordCandidates({ final = Boolean(state.gameOver) } = {}) {
  const stats = ensureRunStats();
  const depth = deepestDescentDepth();
  const round = Math.max(0, Math.floor(Number(state.round) || 0));
  const runQuality = runGuessQuality(stats);
  return {
    deepestDescent: {
      value: depth * DEEPEST_DESCENT_ROUND_SPAN + Math.min(round, DEEPEST_DESCENT_ROUND_SPAN - 1),
      depth,
      demons: Math.max(0, Math.floor(Number(state.goeticBossKills) || 0)),
      bosses: uniqueBossesBeatenThisRun(),
      round,
      ...currentBuildSnapshot()
    },
    mostEliminations: { value: state.eliminations || 0 },
    mostBossEliminations: { value: state.bossKills || 0 },
    mostOverallDamage: { value: stats.overallDamage || 0 },
    mostSingleRoundDamage: { value: stats.singleRoundDamage || 0 },
    highestRoundReached: { value: round },
    mostPentakills: { value: stats.pentakills || 0 },
    mostCriticals: { value: stats.criticals || 0 },
    bestRunGuessQuality:
      final && stats.guessRounds >= GUESS_QUALITY_MIN_RUN_GUESSES && runQuality !== null
        ? { value: runQuality, guesses: stats.guessRounds }
        : { value: 0 },
    fastestWin: { value: Math.max(0, Math.floor(Number(state.collectionRun?.beatenRound) || 0)) },
    mostOverallSealDamage: bestOverallSealDamageEntry(),
    mostRoundSealDamage: stats.maxSealRoundDamage || emptyRecord({ id: "", name: "" }),
    highestEliteLevel: stats.highestEliteLevel || emptyRecord({ id: "", name: "" })
  };
}

function updateArcadeRecordsFromCurrentRun(options = {}) {
  if (state.mode !== "arcade") return;
  const records = loadArcadeRecords();
  Object.entries(currentRunRecordCandidates(options)).forEach(([key, candidate]) => updateRecordIfHigher(records, key, candidate));
  saveArcadeRecords(records);
}

// the records as they stood when this run began (kept in the run's save), so the death card can say
// which ones this run broke
function snapshotRecordsAtRunStart() {
  state.recordsAtRunStart = loadArcadeRecords();
}

// short names for the death card, in the order they are listed there
const NEW_RECORD_LABELS = {
  deepestDescent: "Deepest descent",
  highestRoundReached: "Highest round",
  fastestWin: "Fastest win",
  bestRunGuessQuality: "Guess quality",
  mostCriticals: "Most CRITICALS",
  mostEliminations: "Most KOs",
  mostBossEliminations: "Most BOSS kills",
  mostOverallDamage: "Most damage dealt",
  mostSingleRoundDamage: "Most damage in one round",
  mostPentakills: "Most PENTAKILLS",
  mostOverallSealDamage: "Most damage by one SEAL",
  mostRoundSealDamage: "Most SEAL damage in one round",
  highestEliteLevel: "Highest ELITE level"
};

// a record's value as the player reads it
function recordValueDisplay(key, record) {
  const value = Math.max(0, Math.ceil(Number(record?.value) || 0));
  if (value <= 0) return "None";
  if (key === "deepestDescent") return deepestDescentText(record);
  if (key === "highestEliteLevel") return eliteLevelText(value);
  if (key === "fastestWin") return `Round ${formatNumber(value)}`;
  return formatNumber(value);
}

// "5 of 8 BOSSES" until the main game is beaten, then "Demon 12" (the 12th demon slain)
function deepestDescentText(record) {
  const depth = Math.max(0, Math.floor(Number(record?.depth) || 0));
  const demons = Math.max(0, Math.floor(Number(record?.demons) || 0));
  if (demons > 0) return `Demon ${formatNumber(demons)}`;
  return `${formatNumber(Math.min(depth, UNIQUE_BOSS_KEYS.length))} of ${UNIQUE_BOSS_KEYS.length} BOSSES`;
}

// records this run beat. A record that was still 0 before the run (a first run) does not count;
// Deepest descent counts only when the run went deeper, not when it lasted longer at the same depth.
function newRecordsThisRun() {
  if (state.mode !== "arcade") return [];
  const before = normalizeArcadeRecords(state.recordsAtRunStart || loadArcadeRecords());
  const reached = currentRunRecordCandidates();
  return Object.keys(NEW_RECORD_LABELS)
    .map((key) => {
      const previousRecord = before[key] || emptyRecord();
      const previous = Math.max(0, Math.ceil(Number(previousRecord.value) || 0));
      const value = Math.max(0, Math.ceil(Number(reached[key]?.value) || 0));
      if (previous <= 0 || !recordBeats(key, value, previous)) return null;
      if (key === "deepestDescent" && (reached[key].depth || 0) <= (previousRecord.depth || 0)) return null;
      return {
        key,
        label: NEW_RECORD_LABELS[key],
        value,
        previous,
        text: recordValueDisplay(key, reached[key]),
        previousText: recordValueDisplay(key, previousRecord),
        name: reached[key]?.name || ""
      };
    })
    .filter(Boolean);
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
  collectionNotePentakill();
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
  if (!lifetimeRecordsCount()) return;
  const lifetime = loadLifetimeRecords();
  lifetime.artifactUses[id] = (lifetime.artifactUses[id] || 0) + 1;
  saveLifetimeRecords();
}

function recordEliteLevelBought(id, stack) {
  if (!id || state.mode !== "arcade") return;
  const eliteLevel = Math.max(0, Math.floor(Number(stack) || 1) - 1);
  const stats = ensureRunStats();
  if (eliteLevel > (stats.highestEliteLevel?.value || 0)) {
    stats.highestEliteLevel = { value: eliteLevel, id, name: ITEMS[id]?.name || id };
  }
}

/* ---------- Guess quality ---------- */
function guessQualityScore(distance, critical) {
  if (critical) return 100;
  const steps = Math.max(0, Math.ceil(Number(distance) || 0));
  return Math.min(99, Math.round(100 * Math.pow(GUESS_QUALITY_STEP, steps)));
}

// the average score, rounded down (100 only when every guess was a CRITICAL); null with no guesses
function guessQualityValue(sum, rounds) {
  const count = Math.max(0, Math.floor(Number(rounds) || 0));
  if (count <= 0) return null;
  return Math.max(0, Math.min(100, Math.floor((Number(sum) || 0) / count)));
}

// once per resolved round (applyPenalties): your final guess against the final TARGET
function recordRoundGuess(distance, critical) {
  if (state.mode !== "arcade" || !Number.isFinite(Number(distance))) return;
  const score = guessQualityScore(distance, critical);
  const stats = ensureRunStats();
  stats.guessSum += score;
  stats.guessRounds += 1;
  if (critical) stats.criticals += 1;
  if (!lifetimeRecordsCount()) return;
  const lifetime = loadLifetimeRecords();
  lifetime.guessSum += score;
  lifetime.guessRounds += 1;
  lifetime.recentGuesses.push(score);
  if (lifetime.recentGuesses.length > GUESS_QUALITY_RECENT) lifetime.recentGuesses.splice(0, lifetime.recentGuesses.length - GUESS_QUALITY_RECENT);
  saveLifetimeRecords();
}

/* ---------- lifetime records ---------- */
let lifetimeRecordsCache = null;

function defaultLifetimeRecords() {
  return {
    version: 1,
    guessSum: 0,
    guessRounds: 0,
    recentGuesses: [],
    runs: 0,
    sinEarned: 0,
    pacts: 0,
    // runs each SEAL was in a slot (once per run), uses of each ARTIFACT
    sealRuns: {},
    artifactUses: {},
    // by build key (SEAL_BUILDS): { runs, depth } where depth is the deepest of those runs
    builds: {},
    // who was on the table when you fell: { key: { count, name, image } }
    deaths: {},
    // records broken in the last run that the Records screen has not shown yet
    unseen: []
  };
}

function loadLifetimeRecords() {
  if (lifetimeRecordsCache) return lifetimeRecordsCache;
  const records = defaultLifetimeRecords();
  try {
    const raw = window.localStorage?.getItem(RECORDS_LIFETIME_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved && typeof saved === "object") {
      const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
      ["guessSum", "guessRounds", "runs", "sinEarned", "pacts"].forEach((key) => { records[key] = count(saved[key]); });
      if (Array.isArray(saved.recentGuesses)) {
        records.recentGuesses = saved.recentGuesses.map((score) => Math.max(0, Math.min(100, count(score)))).slice(-GUESS_QUALITY_RECENT);
      }
      ["sealRuns", "artifactUses"].forEach((group) => {
        const source = saved[group] && typeof saved[group] === "object" ? saved[group] : {};
        Object.entries(source).forEach(([id, value]) => { if (ITEMS[id] && count(value) > 0) records[group][id] = count(value); });
      });
      if (saved.builds && typeof saved.builds === "object") {
        Object.entries(saved.builds).forEach(([key, value]) => {
          if (value && typeof value === "object" && count(value.runs) > 0) records.builds[key] = { runs: count(value.runs), depth: count(value.depth) };
        });
      }
      if (saved.deaths && typeof saved.deaths === "object") {
        Object.entries(saved.deaths).forEach(([key, value]) => {
          if (value && typeof value === "object" && count(value.count) > 0) {
            records.deaths[key] = { count: count(value.count), name: String(value.name || key), image: typeof value.image === "string" ? value.image : "" };
          }
        });
      }
      if (Array.isArray(saved.unseen)) records.unseen = saved.unseen.filter((key) => typeof key === "string");
    }
  } catch (error) {}
  lifetimeRecordsCache = records;
  return records;
}

function saveLifetimeRecords() {
  if (!lifetimeRecordsCache) return;
  try {
    window.localStorage?.setItem(RECORDS_LIFETIME_STORAGE_KEY, JSON.stringify(lifetimeRecordsCache));
  } catch (error) {}
}

// same rule as the Collection: real arcade runs only (no PvP, no story tutorial, no infinite SIN)
function lifetimeRecordsCount() {
  return typeof collectionCounts === "function" ? collectionCounts() : state.mode === "arcade";
}

// after every render of a run: a SEAL that is new in a slot this run counts one run for it
function recordsNoteSlots() {
  if (state.mode !== "arcade" || !lifetimeRecordsCount()) return;
  const stats = ensureRunStats();
  let changed = false;
  (state.player?.passives || []).forEach((item) => {
    const id = item?.id;
    if (!id || !ITEMS[id] || stats.sealsSeen[id]) return;
    stats.sealsSeen[id] = true;
    const lifetime = loadLifetimeRecords();
    lifetime.sealRuns[id] = (lifetime.sealRuns[id] || 0) + 1;
    changed = true;
  });
  if (changed) saveLifetimeRecords();
}

function recordSinEarned(amount) {
  const gained = Math.max(0, Math.floor(Number(amount) || 0));
  if (gained <= 0 || !lifetimeRecordsCount()) return;
  loadLifetimeRecords().sinEarned += gained;
  saveLifetimeRecords();
}

function recordPactSigned() {
  if (!lifetimeRecordsCount()) return;
  loadLifetimeRecords().pacts += 1;
  saveLifetimeRecords();
}

// the build a run was played as: the build tag most SEALS in your slots share ("general" only when
// nothing else is there); a tie goes to the build with more ELITE levels, then to SEAL_BUILDS order
function runBuildKey(passives = state.player?.passives || []) {
  const counts = {};
  const elites = {};
  passives.forEach((item) => {
    if (!item?.id) return;
    const tags = typeof sealBuilds === "function" ? sealBuilds(item.id) : ["general"];
    tags.forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
      elites[tag] = (elites[tag] || 0) + Math.max(0, (item.stack || 1) - 1);
    });
  });
  const order = (typeof SEAL_BUILDS !== "undefined" ? SEAL_BUILDS : []).map((build) => build.key);
  const candidates = Object.keys(counts).filter((key) => key !== "general");
  if (!candidates.length) return counts.general ? "general" : "";
  candidates.sort((a, b) => counts[b] - counts[a] || elites[b] - elites[a] || order.indexOf(a) - order.indexOf(b));
  return candidates[0];
}

// who was on the table when you fell: the newest BOSS still standing, or the DAMNED
function runNemesis() {
  const bosses = (state.bots || []).filter((bot) => bot?.isBoss && !bot.eliminated && bot.hp > 0);
  const boss = bosses.sort((a, b) => (b.id || 0) - (a.id || 0))[0];
  if (!boss) return { key: "damned", name: "The DAMNED", image: "" };
  const key = boss.shadowOf ? "you" : boss.uniqueKey || boss.goeticKey || boss.archangelKey || boss.name || "boss";
  return { key, name: boss.name || "A BOSS", image: typeof boss.image === "string" ? boss.image : "" };
}

// at game over, after the run's records are written
function recordRunEnded() {
  if (state.mode !== "arcade") return;
  const broken = newRecordsThisRun().map((record) => record.key);
  if (!lifetimeRecordsCount()) return;
  const lifetime = loadLifetimeRecords();
  lifetime.runs += 1;
  const depth = deepestDescentDepth();
  const build = runBuildKey();
  if (build) {
    const entry = lifetime.builds[build] || { runs: 0, depth: 0 };
    entry.runs += 1;
    entry.depth = Math.max(entry.depth || 0, depth);
    lifetime.builds[build] = entry;
  }
  const nemesis = runNemesis();
  const death = lifetime.deaths[nemesis.key] || { count: 0, name: nemesis.name, image: nemesis.image };
  death.count += 1;
  death.name = nemesis.name;
  if (nemesis.image) death.image = nemesis.image;
  lifetime.deaths[nemesis.key] = death;
  lifetime.unseen = broken;
  saveLifetimeRecords();
}

// the Records screen was left: its NEW marks are seen
function recordsMarkSeen() {
  const lifetime = loadLifetimeRecords();
  if (!lifetime.unseen.length) return;
  lifetime.unseen = [];
  saveLifetimeRecords();
}

// the entry with the most of something ({ id: count }), or null
function topEntry(counts) {
  return Object.entries(counts || {}).reduce((best, [key, value]) => (value > (best?.value || 0) ? { key, value } : best), null);
}
