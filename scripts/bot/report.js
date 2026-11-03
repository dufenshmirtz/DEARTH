"use strict";

// Turns a folder of runs into one balance report (summary.json) with alarms for anything that stands out.
const fs = require("node:fs");
const path = require("node:path");

const UNIQUE_BOSSES = ["Zilon", "Dantre", "Pyros", "Threon", "Kalha", "Serafim", "Padma", "Petros", "Pavlos"];

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
  const deathBy = {};
  const deathSources = {};
  const seals = {};
  const artifacts = {};
  const curve = {};
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

    // BOSSES
    record.bosses.forEach((boss) => {
      const key = boss.unique ? boss.name : "Goetic (endless)";
      const entry = bosses[key] || (bosses[key] = { name: key, unique: boss.unique, met: 0, killed: 0, endedRun: 0, rounds: [], hpLost: [], examples: [] });
      entry.met += 1;
      if (boss.killRound !== null) {
        entry.killed += 1;
        entry.rounds.push(boss.rounds);
        entry.hpLost.push(boss.hpLost);
      }
    });
    if (r.outcome === "died") {
      const alive = r.diedTo?.boss;
      const key = alive || "no BOSS alive";
      deathBy[key] = (deathBy[key] || 0) + 1;
      // which BOSS ended it (unique ones by name, Goetic ones together)
      if (alive) {
        alive.split(" + ").forEach((name) => {
          const bossKey = UNIQUE_BOSSES.includes(name) ? name : "Goetic (endless)";
          if (bosses[bossKey]) {
            bosses[bossKey].endedRun += 1;
            if (bosses[bossKey].examples.length < 5) bosses[bossKey].examples.push({ file: record.file, round: r.diedRound });
          }
        });
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
    owned.forEach((id) => {
      const entry = seals[id];
      entry.runsOwned += 1;
      if (r.mainWin) entry.winsOwned += 1;
      entry.bossKillsOwned += r.uniqueBossKills;
    });
  }

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

  const sealRows = Object.values(seals).map((seal) => ({
    id: seal.id,
    name: seal.name,
    offered: seal.offered,
    bought: seal.bought,
    buyRate: pct(seal.bought, seal.offered),
    runsOwned: seal.runsOwned,
    roundsOwned: seal.roundsOwned,
    winRateOwned: seal.runsOwned ? pct(seal.winsOwned, seal.runsOwned) : null,
    avgBossKillsOwned: seal.runsOwned ? Math.round((seal.bossKillsOwned / seal.runsOwned) * 100) / 100 : null,
    pointsPerRound: seal.roundsOwned ? Math.round((seal.pointsSum / seal.roundsOwned) * 100) / 100 : 0,
    triggersPerRound: seal.roundsOwned ? Math.round((seal.triggers / seal.roundsOwned) * 100) / 100 : 0,
    roundPointsOwned: seal.roundsOwned ? Math.round((seal.roundPointsSum / seal.roundsOwned) * 100) / 100 : 0
  }));
  sealRows.sort((a, b) => (b.winRateOwned ?? -1) - (a.winRateOwned ?? -1));

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

  const alarms = buildAlarms({ overview, overallWin, buildRows, bossRows, sealRows, artifactRows });
  return { overview, builds: buildRows, bosses: bossRows, deaths, deathSources: sources, seals: sealRows, artifacts: artifactRows, curve: curveRows, runs, alarms };
}

function newItemEntry(id, names) {
  return { id, name: names[id] || id, offered: 0, bought: 0, uses: 0, gainSum: 0, runsOwned: 0, winsOwned: 0, roundsOwned: 0, pointsSum: 0, triggers: 0, roundPointsSum: 0, bossKillsOwned: 0 };
}

// thresholds for "this looks off" (small samples are ignored)
function buildAlarms({ overview, overallWin, buildRows, bossRows, sealRows, artifactRows }) {
  const alarms = [];
  const add = (level, text, link = null) => alarms.push({ level, text, link });
  if (overview.runs < 20) add("info", `Only ${overview.runs} runs: numbers below are rough. 100+ runs give steadier results.`);
  bossRows.forEach((boss) => {
    if (boss.met < 8) return;
    if (boss.endedRunRate >= 30) add("high", `${boss.name} ends ${boss.endedRunRate}% of the runs that reach it (${boss.endedRun}/${boss.met}).`, { type: "boss", id: boss.name });
    else if (boss.unique && boss.killRate >= 98 && boss.avgHpLost <= 3) add("low", `${boss.name} is almost never a threat: beaten ${boss.killRate}% of the time for ${boss.avgHpLost} HP on average.`, { type: "boss", id: boss.name });
    if (boss.avgRounds >= 12) add("medium", `${boss.name} fights last ${boss.avgRounds} rounds on average.`, { type: "boss", id: boss.name });
  });
  sealRows.forEach((seal) => {
    if (seal.runsOwned >= 12 && seal.winRateOwned !== null) {
      const diff = Math.round((seal.winRateOwned - overallWin) * 10) / 10;
      if (diff >= 20) add("high", `${seal.name}: ${seal.winRateOwned}% main-game wins when owned (overall ${overallWin}%).`, { type: "seal", id: seal.id });
      if (diff <= -20) add("medium", `${seal.name}: only ${seal.winRateOwned}% main-game wins when owned (overall ${overallWin}%).`, { type: "seal", id: seal.id });
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

module.exports = { buildSummary, readRuns };
