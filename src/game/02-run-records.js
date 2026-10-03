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
