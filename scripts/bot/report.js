"use strict";

// Turns a folder of runs into one balance report (summary.json) with alarms for anything that stands out.
const fs = require("node:fs");
const path = require("node:path");

const SUMMARY_VERSION = 2;
const UNIQUE_BOSSES = ["Zilon", "Dantre", "Pyros", "Threon", "Kalha", "Serafim", "Padma", "Petros", "Pavlos"];
const TWINS = "Petros & Pavlos";
const GOETIC = "Goetic (endless)";

// one name per BOSS as the report counts them: the twins are one BOSS, Goetic demons are counted together
function bossUnit(name) {
  if (name === "Petros" || name === "Pavlos") return TWINS;
  return UNIQUE_BOSSES.includes(name) ? name : GOETIC;
}

// "Threon + Padma" and "Padma + Threon" are the same group; two Goetic demons at once are "Goetic (endless) x2"
function bossGroup(names) {
  const units = new Map();
  names.filter(Boolean).forEach((name) => {
    const unit = bossUnit(name);
    if (!units.has(unit)) units.set(unit, new Set());
    units.get(unit).add(name);
  });
  const parts = [...units.entries()]
    .map(([unit, originals]) => (unit === GOETIC && originals.size > 1 ? `${unit} x${originals.size}` : unit))
    .sort((a, b) => a.localeCompare(b));
  return { key: parts.join(" + "), size: [...units.entries()].reduce((sum, [unit, originals]) => sum + (unit === GOETIC ? originals.size : 1), 0) };
}

function bossNamesOf(text) {
  return text ? String(text).split(" + ") : [];
}

function pct(part, whole) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}
function avg(values) {
  return values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : 0;
}
function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function* readRuns(dir) {
  const runsDir = path.join(dir, "runs");
  if (!fs.existsSync(runsDir)) return;
  for (const file of fs.readdirSync(runsDir).filter((name) => name.endsWith(".json")).sort()) {
    try {
      const record = JSON.parse(fs.readFileSync(path.join(runsDir, file), "utf8"));
      record.file = file;
      yield record;
    } catch (error) {
      // a run still being written
    }
  }
}

function buildSummary(dir, { itemNames = null } = {}) {
  const names = itemNames || loadItemNames();
  const runs = [];
  const builds = {};
  const bosses = {};
  const groups = {};
  const overlap = { bossRounds: 0, overlapRounds: 0, soloDamage: 0, overlapDamage: 0, runsWithOverlap: 0, deaths: 0, deathsInOverlap: 0 };
  const deathBy = {};
  const deathSources = {};
  const seals = {};
  const artifacts = {};
  const curve = {};
  const ownership = []; // per run: { rounds, win, bosses, firstOwned: { sealId: round } }
  let failed = 0;
  let predErrSum = 0;
  let predErrCount = 0;
  let roundsTotal = 0;
  let critTotal = 0;
  let worstTotal = 0;
  let damageTotal = 0;

  for (const record of readRuns(dir)) {
    if (record.error) {
      failed += 1;
      continue;
    }
    const r = record.result;
    runs.push({ file: record.file, seed: record.seed, build: record.build, ...r, sealStats: undefined });
    const b = builds[record.build] || (builds[record.build] = { runs: 0, wins: 0, uniqueKills: [], rounds: [], endless: [] });
    b.runs += 1;
    if (r.mainWin) b.wins += 1;
    b.uniqueKills.push(r.uniqueBossKills);
    b.rounds.push(r.rounds);
    if (r.mainWin) b.endless.push(r.endlessBossKills);

    // BOSSES, one entry per arrival (the twins arrive together and count as one BOSS)
    const arrivals = [];
    record.bosses.forEach((boss) => {
      const unit = bossUnit(boss.name);
      const twin = unit === TWINS ? arrivals.find((entry) => entry.unit === TWINS && entry.spawnRound === boss.spawnRound) : null;
      if (twin) {
        // the pair is beaten when both are; the fight lasts until the second one falls
        if (twin.killRound === null || boss.killRound === null) twin.killRound = null;
        else if (boss.killRound > twin.killRound) {
          twin.killRound = boss.killRound;
          twin.rounds = boss.rounds;
          twin.hpLost = boss.hpLost;
        }
        return;
      }
      arrivals.push({ unit, spawnRound: boss.spawnRound, killRound: boss.killRound, rounds: boss.rounds, hpLost: boss.hpLost });
    });
    arrivals.forEach((boss) => {
      const entry = bosses[boss.unit] || (bosses[boss.unit] = { name: boss.unit, unique: boss.unit !== GOETIC, met: 0, killed: 0, endedRun: 0, rounds: [], hpLost: [], examples: [] });
      entry.met += 1;
      if (boss.killRound !== null) {
        entry.killed += 1;
        entry.rounds.push(boss.rounds);
        entry.hpLost.push(boss.hpLost);
      }
    });

    // rounds with 2+ BOSSES alive: each stretch with the same group is one meeting
    let current = null;
    let hadOverlap = false;
    const lastRound = record.rounds[record.rounds.length - 1];
    record.rounds.forEach((round) => {
      const group = bossGroup(bossNamesOf(round.boss));
      if (group.size >= 1) {
        overlap.bossRounds += 1;
        if (group.size >= 2) {
          overlap.overlapRounds += 1;
          overlap.overlapDamage += round.dmg || 0;
        } else overlap.soloDamage += round.dmg || 0;
      }
      if (group.size < 2) {
        current = null;
        return;
      }
      hadOverlap = true;
      if (!current || current.key !== group.key) {
        const entry = groups[group.key] || (groups[group.key] = { name: group.key, size: group.size, met: 0, endedRun: 0, rounds: 0, damage: 0, examples: [] });
        entry.met += 1;
        current = { key: group.key, entry };
      }
      current.entry.rounds += 1;
      current.entry.damage += round.dmg || 0;
    });
    if (hadOverlap) overlap.runsWithOverlap += 1;

    if (r.outcome === "died") {
      const group = bossGroup(bossNamesOf(r.diedTo?.boss));
      const key = group.size ? group.key : "no BOSS alive";
      deathBy[key] = (deathBy[key] || 0) + 1;
      overlap.deaths += 1;
      // a death counts for a BOSS only when it was alone; with others alive it counts for the group
      const target = group.size >= 2 ? groups[group.key] : group.size === 1 ? bosses[group.key.replace(/ x\d+$/, "")] : null;
      if (group.size >= 2) overlap.deathsInOverlap += 1;
      if (target) {
        target.endedRun += 1;
        if (target.examples.length < 5) target.examples.push({ file: record.file, round: r.diedRound });
      }
      (r.diedTo?.sources || []).forEach((source) => {
        const label = source.replace(/: \d+$/, "").replace(/CRITICAL from .*/, "CRITICAL from a DAMNED");
        deathSources[label] = (deathSources[label] || 0) + 1;
      });
    }

    // SEALS and ARTIFACTS offered / bought
    Object.entries(record.offers || {}).forEach(([id, offer]) => {
      const bucket = offer.type === "passive" ? seals : artifacts;
      const entry = bucket[id] || (bucket[id] = newItemEntry(id, names));
      entry.offered += offer.offered;
      entry.bought += offer.bought;
    });
    Object.entries(record.artifactUses || {}).forEach(([id, use]) => {
      const entry = artifacts[id] || (artifacts[id] = newItemEntry(id, names));
      entry.uses += use.uses;
      entry.gainSum += use.gain;
    });

    // per round: SEAL ownership and what each SEAL did; HP / SIN curves; guessing quality
    const owned = new Set();
    record.rounds.forEach((round) => {
      roundsTotal += 1;
      if (round.crit) critTotal += 1;
      if (round.worst) worstTotal += 1;
      damageTotal += round.dmg || 0;
      const bucketKey = Math.min(200, Math.floor((round.r - 1) / 5) * 5 + 1);
      const c = curve[bucketKey] || (curve[bucketKey] = { round: bucketKey, hp: [], sin: [], dmg: [], alive: 0 });
      c.hp.push(round.hp0);
      c.sin.push(round.sin0);
      c.dmg.push(round.dmg || 0);
      c.alive += 1;
      (round.guess?.preds || []).forEach((pred) => {
        if (!pred.revealed && Number.isFinite(pred.actual)) {
          predErrSum += Math.abs(pred.actual - pred.mean);
          predErrCount += 1;
        }
      });
      (round.seals || []).forEach((tag) => {
        const id = tag.split("x")[0];
        const entry = seals[id] || (seals[id] = newItemEntry(id, names));
        entry.roundsOwned += 1;
        entry.pointsSum += round.sg?.[id]?.pts || 0;
        entry.triggers += round.sg?.[id]?.trig || 0;
        entry.roundPointsSum += round.pts || 0;
        owned.add(id);
      });
    });
    const firstOwned = {};
    record.rounds.forEach((round) => {
      (round.seals || []).forEach((tag) => {
        const id = tag.split("x")[0];
        if (!(id in firstOwned)) firstOwned[id] = round.r;
      });
    });
    owned.forEach((id) => {
      const entry = seals[id];
      entry.runsOwned += 1;
      if (r.mainWin) entry.winsOwned += 1;
      entry.bossKillsOwned += r.uniqueBossKills;
    });
    ownership.push({ rounds: r.rounds, win: Boolean(r.mainWin), bosses: r.uniqueBossKills, firstOwned });
  }

  // fair comparison for SEALS: runs that were still alive at the round the SEAL arrived
  // (a SEAL bought in round 30 is only ever owned by runs that already survived 30 rounds)
  const maxRound = Math.max(1, ...ownership.map((run) => run.rounds));
  const reached = new Array(maxRound + 2).fill(0);
  const winsReached = new Array(maxRound + 2).fill(0);
  const bossesReached = new Array(maxRound + 2).fill(0);
  ownership.forEach((run) => {
    for (let round = 1; round <= run.rounds; round += 1) {
      reached[round] += 1;
      if (run.win) winsReached[round] += 1;
      bossesReached[round] += run.bosses;
    }
  });
  ownership.forEach((run) => {
    Object.entries(run.firstOwned).forEach(([id, round]) => {
      const entry = seals[id];
      if (!entry || !reached[round]) return;
      entry.expectedWins += winsReached[round] / reached[round];
      entry.expectedBosses += bossesReached[round] / reached[round];
      entry.arrivalRoundSum += round;
    });
  });

  const total = runs.length;
  const wins = runs.filter((run) => run.mainWin).length;
  const overview = {
    runs: total,
    failed,
    mainWins: wins,
    mainWinRate: pct(wins, total),
    avgUniqueBossKills: avg(runs.map((run) => run.uniqueBossKills)),
    avgRounds: avg(runs.map((run) => run.rounds)),
    medianRounds: median(runs.map((run) => run.rounds)),
    roundCapHits: runs.filter((run) => run.outcome === "round cap").length,
    endlessAvg: avg(runs.filter((run) => run.mainWin).map((run) => run.endlessBossKills)),
    endlessBest: Math.max(0, ...runs.map((run) => run.endlessBossKills || 0)),
    critRate: pct(critTotal, roundsTotal),
    worstRate: pct(worstTotal, roundsTotal),
    avgDamagePerRound: roundsTotal ? Math.round((damageTotal / roundsTotal) * 100) / 100 : 0,
    predictionError: predErrCount ? Math.round((predErrSum / predErrCount) * 10) / 10 : null,
    peakSinOver150: pct(runs.filter((run) => run.peakSin > 150).length, total)
  };
  const overallWin = overview.mainWinRate;

  const buildRows = Object.entries(builds).map(([build, b]) => ({
    build,
    runs: b.runs,
    winRate: pct(b.wins, b.runs),
    avgUniqueBossKills: avg(b.uniqueKills),
    avgRounds: avg(b.rounds),
    endlessAvg: avg(b.endless)
  }));

  const bossRows = Object.values(bosses).map((boss) => ({
    name: boss.name,
    unique: boss.unique,
    met: boss.met,
    killed: boss.killed,
    killRate: pct(boss.killed, boss.met),
    endedRun: boss.endedRun,
    endedRunRate: pct(boss.endedRun, boss.met),
    avgRounds: avg(boss.rounds),
    avgHpLost: avg(boss.hpLost),
    examples: boss.examples
  }));
  bossRows.sort((a, b) => b.endedRunRate - a.endedRunRate);

  const groupRows = Object.values(groups).map((group) => ({
    name: group.name,
    size: group.size,
    met: group.met,
    endedRun: group.endedRun,
    endedRunRate: pct(group.endedRun, group.met),
    avgRoundsTogether: group.met ? Math.round((group.rounds / group.met) * 100) / 100 : 0,
    damagePerRound: group.rounds ? Math.round((group.damage / group.rounds) * 100) / 100 : 0,
    few: group.met < 8,
    examples: group.examples
  }));
  groupRows.sort((a, b) => b.endedRun - a.endedRun || b.met - a.met);

  const overlapSummary = {
    runsWithOverlap: pct(overlap.runsWithOverlap, runs.length),
    bossRoundsShared: pct(overlap.overlapRounds, overlap.bossRounds),
    damageSolo: overlap.bossRounds - overlap.overlapRounds ? Math.round((overlap.soloDamage / (overlap.bossRounds - overlap.overlapRounds)) * 100) / 100 : 0,
    damageShared: overlap.overlapRounds ? Math.round((overlap.overlapDamage / overlap.overlapRounds) * 100) / 100 : 0,
    deathsShared: pct(overlap.deathsInOverlap, overlap.deaths)
  };

  const sealRows = Object.values(seals).map((seal) => ({
    id: seal.id,
    name: seal.name,
    offered: seal.offered,
    bought: seal.bought,
    buyRate: pct(seal.bought, seal.offered),
    runsOwned: seal.runsOwned,
    roundsOwned: seal.roundsOwned,
    arrivalRound: seal.runsOwned ? Math.round(seal.arrivalRoundSum / seal.runsOwned) : null,
    winRateOwned: seal.runsOwned ? pct(seal.winsOwned, seal.runsOwned) : null,
    winRateExpected: seal.runsOwned ? pct(seal.expectedWins, seal.runsOwned) : null,
    winEdge: seal.runsOwned ? Math.round((pct(seal.winsOwned, seal.runsOwned) - pct(seal.expectedWins, seal.runsOwned)) * 10) / 10 : null,
    avgBossKillsOwned: seal.runsOwned ? Math.round((seal.bossKillsOwned / seal.runsOwned) * 100) / 100 : null,
    bossKillsExpected: seal.runsOwned ? Math.round((seal.expectedBosses / seal.runsOwned) * 100) / 100 : null,
    bossEdge: seal.runsOwned ? Math.round(((seal.bossKillsOwned - seal.expectedBosses) / seal.runsOwned) * 100) / 100 : null,
    pointsPerRound: seal.roundsOwned ? Math.round((seal.pointsSum / seal.roundsOwned) * 100) / 100 : 0,
    triggersPerRound: seal.roundsOwned ? Math.round((seal.triggers / seal.roundsOwned) * 100) / 100 : 0,
    roundPointsOwned: seal.roundsOwned ? Math.round((seal.roundPointsSum / seal.roundsOwned) * 100) / 100 : 0
  }));
  sealRows.sort((a, b) => (b.bossEdge ?? -99) - (a.bossEdge ?? -99));

  const artifactRows = Object.values(artifacts).map((item) => ({
    id: item.id,
    name: item.name,
    offered: item.offered,
    bought: item.bought,
    uses: item.uses,
    avgGain: item.uses ? Math.round((item.gainSum / item.uses) * 100) / 100 : null
  }));
  artifactRows.sort((a, b) => b.uses - a.uses);

  const curveRows = Object.values(curve)
    .sort((a, b) => a.round - b.round)
    .map((c) => ({ round: c.round, alive: c.alive, hp: avg(c.hp), sin: avg(c.sin), dmg: avg(c.dmg) }));

  const deaths = Object.entries(deathBy).map(([by, count]) => ({ by, count, share: pct(count, total) })).sort((a, b) => b.count - a.count);
  const sources = Object.entries(deathSources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 12);

  const alarms = buildAlarms({ overview, overallWin, buildRows, bossRows, groupRows, overlapSummary, sealRows, artifactRows });
  return { version: SUMMARY_VERSION, overview, builds: buildRows, bosses: bossRows, bossGroups: groupRows, overlap: overlapSummary, deaths, deathSources: sources, seals: sealRows, artifacts: artifactRows, curve: curveRows, runs, alarms };
}

function newItemEntry(id, names) {
  return { id, name: names[id] || id, offered: 0, bought: 0, uses: 0, gainSum: 0, runsOwned: 0, winsOwned: 0, roundsOwned: 0, pointsSum: 0, triggers: 0, roundPointsSum: 0, bossKillsOwned: 0, expectedWins: 0, expectedBosses: 0, arrivalRoundSum: 0 };
}

// thresholds for "this looks off" (small samples are ignored)
function buildAlarms({ overview, overallWin, buildRows, bossRows, groupRows, overlapSummary, sealRows, artifactRows }) {
  const alarms = [];
  const add = (level, text, link = null) => alarms.push({ level, text, link });
  if (overview.runs < 20) add("info", `Only ${overview.runs} runs: numbers below are rough. 100+ runs give steadier results.`);
  bossRows.forEach((boss) => {
    if (boss.met < 8) return;
    if (boss.endedRunRate >= 30) add("high", `${boss.name} alone ends ${boss.endedRunRate}% of the runs that reach it (${boss.endedRun}/${boss.met}).`, { type: "boss", id: boss.name });
    else if (boss.unique && boss.killRate >= 98 && boss.avgHpLost <= 3) add("low", `${boss.name} is almost never a threat: beaten ${boss.killRate}% of the time for ${boss.avgHpLost} HP on average.`, { type: "boss", id: boss.name });
    if (boss.avgRounds >= 12) add("medium", `${boss.name} fights last ${boss.avgRounds} rounds on average.`, { type: "boss", id: boss.name });
  });
  groupRows.forEach((group) => {
    if (group.met >= 5 && group.endedRunRate >= 40) add("high", `${group.name} together end ${group.endedRunRate}% of the runs where they meet (${group.endedRun}/${group.met}).`, { type: "group", id: group.name });
  });
  if (overview.runs >= 20 && overlapSummary.deathsShared >= 30) add("medium", `${overlapSummary.deathsShared}% of deaths happen with 2+ BOSSES alive (${overlapSummary.runsWithOverlap}% of runs meet an overlap).`, { type: "group", id: null });
  sealRows.forEach((seal) => {
    if (seal.runsOwned >= 12 && seal.bossEdge !== null) {
      const vs = `compared with runs still alive at round ${seal.arrivalRound}, when it usually arrives`;
      if (seal.bossEdge >= 1) add("high", `${seal.name}: +${seal.bossEdge} BOSSES beaten ${vs} (wins ${seal.winRateOwned}% vs ${seal.winRateExpected}%).`, { type: "seal", id: seal.id });
      else if (seal.bossEdge <= -1) add("medium", `${seal.name}: ${seal.bossEdge} BOSSES beaten ${vs} (wins ${seal.winRateOwned}% vs ${seal.winRateExpected}%).`, { type: "seal", id: seal.id });
      else if (seal.winEdge >= 20) add("high", `${seal.name}: ${seal.winRateOwned}% main-game wins vs ${seal.winRateExpected}% expected ${vs}.`, { type: "seal", id: seal.id });
    }
    if (seal.offered >= 25 && seal.buyRate < 5) add("low", `${seal.name} is almost never bought (${seal.bought} of ${seal.offered} offers).`, { type: "seal", id: seal.id });
  });
  const ppr = sealRows.filter((seal) => seal.roundsOwned >= 50).map((seal) => seal.pointsPerRound).filter((v) => v > 0);
  const med = median(ppr);
  sealRows.forEach((seal) => {
    if (seal.roundsOwned >= 50 && med > 0 && seal.pointsPerRound >= med * 4) add("medium", `${seal.name} produces ${seal.pointsPerRound} points per round, ${Math.round(seal.pointsPerRound / med)}x a typical SEAL.`, { type: "seal", id: seal.id });
  });
  artifactRows.forEach((item) => {
    if (item.offered >= 40 && item.uses === 0) add("low", `${item.name} was never used (${item.offered} offers).`, { type: "artifact", id: item.id });
  });
  if (buildRows.length > 1) {
    const solid = buildRows.filter((row) => row.runs >= 10);
    if (solid.length > 1) {
      const best = solid.reduce((a, b) => (b.winRate > a.winRate ? b : a));
      const worst = solid.reduce((a, b) => (b.winRate < a.winRate ? b : a));
      if (best.winRate - worst.winRate >= 25) add("medium", `Builds are uneven: ${best.build} wins ${best.winRate}%, ${worst.build} only ${worst.winRate}%.`, { type: "build", id: worst.build });
    }
  }
  if (overview.peakSinOver150 >= 30) add("medium", `SIN piles up: ${overview.peakSinOver150}% of runs went over 150 SIN at some point.`);
  if (overview.roundCapHits) add("info", `${overview.roundCapHits} runs hit the ${"round cap"} and were stopped.`);
  const order = { high: 0, medium: 1, low: 2, info: 3 };
  return alarms.sort((a, b) => order[a.level] - order[b.level]);
}

function loadItemNames() {
  try {
    const { GameVM } = require("./game-vm");
    const g = new GameVM("names");
    const names = {};
    Object.entries(g.items).forEach(([id, item]) => {
      names[id] = item.name;
    });
    return names;
  } catch (error) {
    return {};
  }
}

module.exports = { buildSummary, readRuns, SUMMARY_VERSION, bossGroup };
