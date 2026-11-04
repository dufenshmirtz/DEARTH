"use strict";

// Turns a folder of runs into one balance report (summary.json) with alarms for anything that stands out.
const fs = require("node:fs");
const path = require("node:path");

const SUMMARY_VERSION = 5;
const UNIQUE_BOSSES = ["Zilon", "Dantre", "Pyros", "Threon", "Kalha", "Serafim", "Padma", "Petros", "Pavlos"];
const TWINS = "Petros & Pavlos";
const ALL_GOETIC = "All Goetic BOSSES";

// one name per BOSS as the report counts them: the twins are one BOSS, everyone else by name
function bossUnit(name) {
  return name === "Petros" || name === "Pavlos" ? TWINS : name;
}
function isMainBoss(unit) {
  return unit === TWINS || UNIQUE_BOSSES.includes(unit);
}

// "Threon + Padma" and "Padma + Threon" are the same group
function bossGroup(names) {
  const units = [...new Set(names.filter(Boolean).map(bossUnit))].sort((a, b) => a.localeCompare(b));
  return { key: units.join(" + "), size: units.length };
}

// 95% range for a share (Wilson): with few runs the range is wide
function shareRange(part, whole) {
  if (!whole) return [0, 0];
  const z = 1.96;
  const p = part / whole;
  const center = (p + (z * z) / (2 * whole)) / (1 + (z * z) / whole);
  const half = (z * Math.sqrt((p * (1 - p)) / whole + (z * z) / (4 * whole * whole))) / (1 + (z * z) / whole);
  return [Math.round(Math.max(0, center - half) * 1000) / 10, Math.round(Math.min(1, center + half) * 1000) / 10];
}
// Coverage batches replay each seed once per SEAL: runs on the same seed share their dice, so ranges must count
// games (seeds), not runs. Averages each seed first, then the range across seeds.
function seedLevel(list, value) {
  const bySeed = new Map();
  list.forEach((item) => {
    if (!bySeed.has(item.seed)) bySeed.set(item.seed, []);
    bySeed.get(item.seed).push(value(item));
  });
  const means = [...bySeed.values()].map((values) => values.reduce((a, b) => a + b, 0) / values.length);
  const mean = means.length ? means.reduce((a, b) => a + b, 0) / means.length : 0;
  return { games: means.length, mean, pm: avgPlusMinus(means) };
}
function seedShareRange(list, isHit) {
  const level = seedLevel(list, (item) => (isHit(item) ? 1 : 0));
  if (level.pm === null) return [0, 100];
  return [Math.round(Math.max(0, level.mean - level.pm) * 1000) / 10, Math.round(Math.min(1, level.mean + level.pm) * 1000) / 10];
}

// +/- for an average (95%)
function avgPlusMinus(values) {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.round(1.96 * Math.sqrt(variance / values.length) * 100) / 100;
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

function buildSummary(dir, { gameInfo = null } = {}) {
  const info = gameInfo || loadGameInfo();
  const names = info.names;
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
  const late = []; // runs that won the main game: how the endless part went
  const coverageRuns = []; // Coverage batches: one forced SEAL per run, same seeds for every SEAL
  const abilities = {}; // late-game BOSSES by their random ability (recorded since run version 3)
  const archangels = {}; // Archangels by name (fixed powers)
  let abilityRuns = 0;
  const lateDamage = { main: 0, mainRounds: 0, endless: 0, endlessRounds: 0 };
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
    runs.push({ file: record.file, seed: record.seed, build: record.build, forcedSeal: record.forcedSeal || null, ...r, sealStats: undefined });
    if (record.coverage) {
      const id = record.coverage.seal;
      coverageRuns.push({
        file: record.file,
        seed: record.coverage.seed,
        seal: id,
        build: record.build,
        bosses: r.uniqueBossKills,
        win: Boolean(r.mainWin),
        rounds: r.rounds,
        damage: r.sealStats?.[id]?.damage || 0,
        ownPoints: record.rounds.reduce((sum, round) => sum + (round.sg?.[id]?.pts || 0), 0)
      });
    }
    // late game: everything after the main-game win
    record.rounds.forEach((round) => {
      if (r.mainWin && round.r > r.mainWinRound) {
        lateDamage.endless += round.dmg || 0;
        lateDamage.endlessRounds += 1;
      } else {
        lateDamage.main += round.dmg || 0;
        lateDamage.mainRounds += 1;
      }
    });
    if (r.mainWin) {
      const winRound = record.rounds.find((round) => round.r === r.mainWinRound);
      late.push({
        seed: record.seed,
        file: record.file,
        build: record.build,
        winRound: r.mainWinRound,
        endless: r.endlessBossKills,
        endlessRounds: r.rounds - r.mainWinRound,
        hpAtWin: winRound ? winRound.hp1 : null,
        outcome: r.outcome,
        diedTo: r.outcome === "died" ? bossGroup(bossNamesOf(r.diedTo?.boss)).key || "no BOSS alive" : r.outcome,
        diedRound: r.diedRound
      });
    }
    const b = builds[record.build] || (builds[record.build] = { runs: 0, wins: 0, uniqueKills: [], rounds: [], endless: [], items: [] });
    b.items.push({ seed: record.seed, win: Boolean(r.mainWin), bosses: r.uniqueBossKills });
    b.runs += 1;
    if (r.mainWin) b.wins += 1;
    b.uniqueKills.push(r.uniqueBossKills);
    b.rounds.push(r.rounds);
    if (r.mainWin) b.endless.push(r.endlessBossKills);

    // late-game BOSSES by ability / Archangels by name (only runs that recorded BOSS kinds)
    if (record.bosses.some((boss) => boss.kind)) {
      abilityRuns += 1;
      const lateKey = (boss) => (boss.kind === "archangel" ? boss.name : boss.abilities && boss.abilities.length ? boss.abilities.join(" + ") : "(no ability)");
      const lateBucket = (boss) => (boss.kind === "archangel" ? archangels : abilities);
      const isLate = (boss) => boss.kind && boss.kind !== "main" && boss.kind !== "final";
      record.bosses.filter(isLate).forEach((boss) => {
        const bucket = lateBucket(boss);
        const key = lateKey(boss);
        const entry = bucket[key] || (bucket[key] = { name: key, met: 0, killed: 0, endedAlone: 0, endedWithOthers: 0, rounds: [], hpLost: [], examples: [] });
        entry.met += 1;
        if (boss.killRound !== null) {
          entry.killed += 1;
          entry.rounds.push(boss.rounds);
          entry.hpLost.push(boss.hpLost);
        }
      });
      if (r.outcome === "died") {
        const alive = record.bosses.filter((boss) => boss.killRound === null);
        const units = new Set(alive.map((boss) => bossUnit(boss.name))).size;
        alive.filter(isLate).forEach((boss) => {
          const entry = lateBucket(boss)[lateKey(boss)];
          if (!entry) return;
          if (units === 1) {
            entry.endedAlone += 1;
            if (entry.examples.length < 5) entry.examples.push({ file: record.file, round: r.diedRound });
          } else entry.endedWithOthers += 1;
        });
      }
    }

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
      arrivals.push({ unit, recordedKind: boss.kind || null, spawnRound: boss.spawnRound, killRound: boss.killRound, rounds: boss.rounds, hpLost: boss.hpLost });
    });
    arrivals.forEach((boss) => {
      const kind = isMainBoss(boss.unit)
        ? "main"
        : boss.recordedKind === "archangel"
          ? "archangel"
          : info.demonSeal[boss.unit] || boss.recordedKind === "goetic" || boss.recordedKind === "shadow"
            ? "goetic"
            : "final";
      const entry = bosses[boss.unit] || (bosses[boss.unit] = { name: boss.unit, unique: kind === "main", kind, blocks: info.demonSeal[boss.unit] || null, met: 0, killed: 0, endedRun: 0, rounds: [], hpLost: [], examples: [] });
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
      const target = group.size >= 2 ? groups[group.key] : group.size === 1 ? bosses[group.key] : null;
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
      (entry.edgeValues || (entry.edgeValues = [])).push(run.bosses - bossesReached[round] / reached[round]);
    });
  });

  const total = runs.length;
  const wins = runs.filter((run) => run.mainWin).length;
  const isCoverage = coverageRuns.length > 0;
  const overview = {
    runs: total,
    failed,
    mainWins: wins,
    mainWinRate: pct(wins, total),
    mainWinRange: isCoverage ? seedShareRange(runs, (run) => run.mainWin) : shareRange(wins, total),
    bossKillsPlusMinus: isCoverage ? seedLevel(runs, (run) => run.uniqueBossKills).pm : avgPlusMinus(runs.map((run) => run.uniqueBossKills)),
    games: isCoverage ? seedLevel(runs, () => 0).games : total,
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
    winRange: isCoverage ? seedShareRange(b.items, (item) => item.win) : shareRange(b.wins, b.runs),
    avgUniqueBossKills: avg(b.uniqueKills),
    bossKillsPlusMinus: isCoverage ? seedLevel(b.items, (item) => item.bosses).pm : avgPlusMinus(b.uniqueKills),
    avgRounds: avg(b.rounds),
    endlessAvg: avg(b.endless)
  }));

  const allBossRows = Object.values(bosses).map((boss) => ({
    name: boss.name,
    unique: boss.unique,
    kind: boss.kind,
    blocks: boss.blocks ? names[boss.blocks] || boss.blocks : null,
    few: boss.met < 8,
    met: boss.met,
    killed: boss.killed,
    killRate: pct(boss.killed, boss.met),
    endedRun: boss.endedRun,
    endedRunRate: pct(boss.endedRun, boss.met),
    avgRounds: avg(boss.rounds),
    avgHpLost: avg(boss.hpLost),
    examples: boss.examples
  }));
  allBossRows.sort((a, b) => b.endedRunRate - a.endedRunRate || b.met - a.met);
  const bossRows = allBossRows.filter((boss) => boss.kind === "main");
  // demons: most-met first (their percentages only mean something with enough meetings)
  const demonRows = allBossRows.filter((boss) => boss.kind === "goetic").sort((a, b) => b.met - a.met || b.endedRun - a.endedRun);
  // every Goetic BOSS together, the one steady number for the late game while each demon has few meetings
  const demons = Object.values(bosses).filter((boss) => boss.kind === "goetic");
  if (demons.length) {
    const sum = (key) => demons.reduce((total, boss) => total + boss[key], 0);
    const rounds = demons.flatMap((boss) => boss.rounds);
    const hpLost = demons.flatMap((boss) => boss.hpLost);
    demonRows.unshift({ name: ALL_GOETIC, total: true, kind: "goetic", blocks: null, few: false, met: sum("met"), killed: sum("killed"), killRate: pct(sum("killed"), sum("met")), endedRun: sum("endedRun"), endedRunRate: pct(sum("endedRun"), sum("met")), avgRounds: avg(rounds), avgHpLost: avg(hpLost), examples: [] });
  }

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
    bossEdgePlusMinus: seal.edgeValues ? avgPlusMinus(seal.edgeValues) : null,
    // the difference is bigger than its +/- range: likely real, not luck
    clear: Boolean(seal.edgeValues && seal.edgeValues.length >= 5 && Math.abs((seal.bossKillsOwned - seal.expectedBosses) / seal.runsOwned) > (avgPlusMinus(seal.edgeValues) ?? Infinity)),
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

  const coverage = coverageRuns.length ? buildCoverage(coverageRuns, names) : null;
  const lateGame = buildLateGame(late, lateDamage, total, isCoverage);
  lateGame.abilities = lateRows(abilities);
  lateGame.archangels = lateRows(archangels);
  lateGame.abilityRuns = abilityRuns;
  const alarms = buildAlarms({ overview, overallWin, buildRows, bossRows: allBossRows, groupRows, overlapSummary, sealRows, artifactRows, late, coverage, lateGame });
  return { version: SUMMARY_VERSION, overview, coverage, builds: buildRows, bosses: bossRows, demons: demonRows, lateGame, bossGroups: groupRows, overlap: overlapSummary, deaths, deathSources: sources, seals: sealRows, artifacts: artifactRows, curve: curveRows, runs, alarms };
}

function newItemEntry(id, names) {
  return { id, name: names[id] || id, offered: 0, bought: 0, uses: 0, gainSum: 0, runsOwned: 0, winsOwned: 0, roundsOwned: 0, pointsSum: 0, triggers: 0, roundPointsSum: 0, bossKillsOwned: 0, expectedWins: 0, expectedBosses: 0, arrivalRoundSum: 0 };
}

// thresholds for "this looks off" (small samples are ignored)
function buildAlarms({ overview, overallWin, buildRows, bossRows, groupRows, overlapSummary, sealRows, artifactRows, late, coverage, lateGame }) {
  const alarms = [];
  const add = (level, text, link = null) => alarms.push({ level, text, link });
  if (coverage) {
    const nerf = coverage.seals.filter((seal) => seal.verdict === "nerf");
    const buff = coverage.seals.filter((seal) => seal.verdict === "buff");
    if (nerf.length) add("high", `Coverage: ${nerf.length} SEAL${nerf.length > 1 ? "S" : ""} clearly stronger than average (nerf candidates), e.g. ${nerf.slice(0, 3).map((seal) => `${seal.name} +${seal.edge}`).join(", ")}.`, { type: "coverage", id: null });
    if (buff.length) add("high", `Coverage: ${buff.length} SEAL${buff.length > 1 ? "S" : ""} clearly weaker than average (buff candidates), e.g. ${buff.slice(0, 3).map((seal) => `${seal.name} ${seal.edge}`).join(", ")}.`, { type: "coverage", id: null });
    coverage.builds.filter((build) => build.verdict !== "fine").forEach((build) => add("high", `Coverage: the ${build.build} build is clearly ${build.verdict === "strong" ? "stronger" : "weaker"} than average (${build.edge > 0 ? "+" : ""}${build.edge} BOSSES ±${build.pm}).`, { type: "coverage", id: null }));
    if (coverage.needsRuns) add("info", `Coverage: ${coverage.needsRuns} SEALS have fewer than ${COVERAGE_MIN_RUNS} runs yet; their verdicts wait for more data.`, { type: "coverage", id: null });
  }
  if (overview.runs < 20) add("info", `Only ${overview.runs} runs: numbers below are rough. 100+ runs give steadier results.`);
  // a Goetic BOSS's danger comes from its random ability, not its name: judge those by ability (when recorded)
  const byAbility = Boolean(lateGame && lateGame.abilityRuns);
  bossRows.forEach((boss) => {
    if (boss.met < 8) return;
    if (byAbility && boss.kind === "goetic") return;
    if (boss.endedRunRate >= 30) add("high", `${boss.name} alone ends ${boss.endedRunRate}% of the runs that reach it (${boss.endedRun}/${boss.met}).`, { type: "boss", id: boss.name });
    else if (boss.unique && boss.killRate >= 98 && boss.avgHpLost <= 3) add("low", `${boss.name} is almost never a threat: beaten ${boss.killRate}% of the time for ${boss.avgHpLost} HP on average.`, { type: "boss", id: boss.name });
    if (boss.avgRounds >= 12) add("medium", `${boss.name} fights last ${boss.avgRounds} rounds on average.`, { type: "boss", id: boss.name });
  });
  if (byAbility) {
    lateGame.abilities.concat(lateGame.archangels).forEach((row) => {
      if (row.met >= 8 && row.endedRunRate >= 30) add("high", `${lateGame.archangels.includes(row) ? row.name : `A Goetic BOSS with ${row.name}`} alone ends ${row.endedRunRate}% of the runs that reach it (${row.endedRun}/${row.met}).`, { type: "late", id: row.name });
    });
  }
  groupRows.forEach((group) => {
    if (group.met >= 5 && group.endedRunRate >= 40) add("high", `${group.name} together end ${group.endedRunRate}% of the runs where they meet (${group.endedRun}/${group.met}).`, { type: "group", id: group.name });
  });
  if (overview.runs >= 20 && overlapSummary.deathsShared >= 30) add("medium", `${overlapSummary.deathsShared}% of deaths happen with 2+ BOSSES alive (${overlapSummary.runsWithOverlap}% of runs meet an overlap).`, { type: "group", id: null });
  sealRows.forEach((seal) => {
    if (seal.runsOwned >= 12 && seal.bossEdge !== null && seal.clear) {
      const vs = `compared with runs still alive at round ${seal.arrivalRound}, when it usually arrives`;
      if (seal.bossEdge >= 1) add("high", `${seal.name}: +${seal.bossEdge} BOSSES beaten ${vs} (wins ${seal.winRateOwned}% vs ${seal.winRateExpected}%).`, { type: "seal", id: seal.id });
      else if (seal.bossEdge <= -1) add("medium", `${seal.name}: ${seal.bossEdge} BOSSES beaten ${vs} (wins ${seal.winRateOwned}% vs ${seal.winRateExpected}%).`, { type: "seal", id: seal.id });
      else if (seal.winEdge >= 20) add("high", `${seal.name}: ${seal.winRateOwned}% main-game wins vs ${seal.winRateExpected}% expected ${vs}.`, { type: "seal", id: seal.id });
    }
  });
  // what a SEAL does itself (SIN, damage...) vs whether that turns into BOSS kills
  sealRows.forEach((seal) => {
    if (seal.runsOwned >= 20 && seal.pointsPerRound > 0 && seal.bossEdge !== null && seal.bossEdge <= 0) {
      const typical = median(sealRows.filter((x) => x.roundsOwned >= 50 && x.pointsPerRound > 0).map((x) => x.pointsPerRound));
      if (typical > 0 && seal.pointsPerRound >= typical * 4) add("medium", `${seal.name} produces a lot itself (${seal.pointsPerRound} points per round, ${Math.round(seal.pointsPerRound / typical)}x a typical SEAL) but runs with it don't beat more BOSSES (${seal.bossEdge}). Its SIN/BOUNTY may not be turning into power.`, { type: "seal", id: seal.id });
    }
  });
  const neverBought = sealRows.filter((seal) => seal.offered >= 25 && seal.buyRate < 5);
  if (neverBought.length) add("low", `${neverBought.length} SEALS are almost never bought by the bot (under 5% of offers), e.g. ${neverBought.slice(0, 4).map((seal) => seal.name).join(", ")}. Sort the SEALS table by Bought %.`, { type: "seal", id: neverBought[0].id });
  artifactRows.forEach((item) => {
    if (item.offered >= 40 && item.uses === 0) add("low", `${item.name} was never used (${item.offered} offers).`, { type: "artifact", id: item.id });
  });
  if (buildRows.length > 1) {
    const solid = buildRows.filter((row) => row.runs >= 10);
    if (solid.length > 1) {
      const best = solid.reduce((a, b) => (b.winRate > a.winRate ? b : a));
      const worst = solid.reduce((a, b) => (b.winRate < a.winRate ? b : a));
      // BOSSES beaten is steadier than wins: flag it when the two ranges don't even overlap
      const top = solid.reduce((a, b) => (b.avgUniqueBossKills > a.avgUniqueBossKills ? b : a));
      const bottom = solid.reduce((a, b) => (b.avgUniqueBossKills < a.avgUniqueBossKills ? b : a));
      const apart = top.avgUniqueBossKills - (top.bossKillsPlusMinus || 0) > bottom.avgUniqueBossKills + (bottom.bossKillsPlusMinus || 0);
      if (apart) add("high", `Builds are uneven: ${top.build} beats ${top.avgUniqueBossKills} BOSSES on average, ${bottom.build} only ${bottom.avgUniqueBossKills} (wins ${top.winRate}% vs ${bottom.winRate}%).`, { type: "build", id: bottom.build });
      else if (best.winRate - worst.winRate >= 25) add("medium", `Builds may be uneven: ${best.build} wins ${best.winRate}%, ${worst.build} only ${worst.winRate}% (could still be luck).`, { type: "build", id: worst.build });
    }
  }
  if (late && late.length >= 5) {
    const depths = late.map((run) => run.endless);
    const mid = median(depths);
    if (mid <= 2) add("medium", `Endless is short: half of the runs that win the main game beat at most ${mid} Goetic BOSS${mid === 1 ? "" : "ES"} after it.`, { type: "late", id: null });
    if (mid >= 30) add("medium", `Endless may be too easy: half of the winning runs beat ${mid}+ Goetic BOSSES.`, { type: "late", id: null });
  }
  if (overview.peakSinOver150 >= 30) add("medium", `SIN piles up: ${overview.peakSinOver150}% of runs went over 150 SIN at some point.`);
  if (overview.roundCapHits) add("info", `${overview.roundCapHits} runs hit the ${"round cap"} and were stopped.`);
  const order = { high: 0, medium: 1, low: 2, info: 3 };
  return alarms.sort((a, b) => order[a.level] - order[b.level]);
}

// ---- Coverage: every SEAL played on the same seeds ----
const COVERAGE_MIN_RUNS = 10; // a verdict needs at least this many runs per SEAL
const COVERAGE_MIN_EFFECT = 0.25; // and a difference of at least this many BOSSES (smaller is "fine" for balance)

function verdictFor(edge, pm, runs) {
  if (runs < COVERAGE_MIN_RUNS || pm === null) return "needs runs";
  if (edge > pm && edge >= COVERAGE_MIN_EFFECT) return "nerf";
  if (edge < -pm && edge <= -COVERAGE_MIN_EFFECT) return "buff";
  return "fine";
}

// Each run is compared with the average of all SEALS on the same seed, so the dice cancel out:
// "+0.8" = runs starting with this SEAL beat 0.8 BOSSES more than the average SEAL on the same seeds.
function buildCoverage(list, names) {
  const bySeed = new Map();
  list.forEach((run) => {
    if (!bySeed.has(run.seed)) bySeed.set(run.seed, []);
    bySeed.get(run.seed).push(run);
  });
  const seedMean = new Map();
  bySeed.forEach((runs, seed) => {
    if (runs.length >= 2) seedMean.set(seed, runs.reduce((sum, run) => sum + run.bosses, 0) / runs.length);
  });
  const group = (key) => {
    const out = new Map();
    list.forEach((run) => {
      if (!seedMean.has(run.seed)) return;
      if (!out.has(run[key])) out.set(run[key], []);
      out.get(run[key]).push(run);
    });
    return out;
  };
  const summarize = (runs) => {
    const diffs = runs.map((run) => run.bosses - seedMean.get(run.seed));
    const edge = Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 100) / 100;
    const pm = avgPlusMinus(diffs);
    const wins = runs.filter((run) => run.win).length;
    return { runs: runs.length, avgBosses: avg(runs.map((run) => run.bosses)), wins, winRate: pct(wins, runs.length), edge, pm };
  };
  const seals = [...group("seal").entries()].map(([id, runs]) => {
    const base = summarize(runs);
    const rounds = runs.reduce((sum, run) => sum + run.rounds, 0);
    return {
      id,
      name: names[id] || id,
      ...base,
      verdict: verdictFor(base.edge, base.pm, base.runs),
      damagePerRound: rounds ? Math.round((runs.reduce((sum, run) => sum + run.damage, 0) / rounds) * 100) / 100 : 0,
      ownPointsPerRound: rounds ? Math.round((runs.reduce((sum, run) => sum + run.ownPoints, 0) / rounds) * 100) / 100 : 0,
      avgRounds: avg(runs.map((run) => run.rounds)),
      examples: runs.slice(0, 3).map((run) => ({ file: run.file, round: null }))
    };
  });
  seals.sort((a, b) => b.edge - a.edge);
  const builds = [...group("build").entries()].map(([build, runs]) => {
    // a build is played on many SEALS per seed: average it per seed first (runs on one seed share their dice)
    const base = summarize(runs);
    const level = seedLevel(runs.map((run) => ({ seed: run.seed, diff: run.bosses - seedMean.get(run.seed) })), (item) => item.diff);
    base.edge = Math.round(level.mean * 100) / 100;
    base.pm = level.pm;
    const verdict = verdictFor(base.edge, base.pm, base.runs);
    return { build, ...base, verdict: verdict === "nerf" ? "strong" : verdict === "buff" ? "weak" : verdict };
  });
  builds.sort((a, b) => b.edge - a.edge);
  const counts = seals.map((seal) => seal.runs);
  return {
    runs: list.length,
    seeds: seedMean.size,
    minRuns: Math.min(...counts),
    maxRuns: Math.max(...counts),
    needsRuns: seals.filter((seal) => seal.verdict === "needs runs").length,
    minRunsForVerdict: COVERAGE_MIN_RUNS,
    minEffect: COVERAGE_MIN_EFFECT,
    seals,
    builds
  };
}

// ---- combining Coverage batches (several PCs, several sessions) into one table ----
// Each batch keeps a small cache of its Coverage rows (coverage-rows.json) so combining doesn't re-read every run.
function coverageRows(dir) {
  const runsDir = path.join(dir, "runs");
  const files = fs.existsSync(runsDir) ? fs.readdirSync(runsDir).filter((name) => /^run-\d+\.json$/.test(name)) : [];
  const cacheFile = path.join(dir, "coverage-rows.json");
  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    if (cache.files === files.length && Array.isArray(cache.rows)) return cache.rows;
  } catch (error) {
    // no cache yet
  }
  const rows = [];
  for (const record of readRuns(dir)) {
    if (record.error || !record.coverage) continue;
    const id = record.coverage.seal;
    const r = record.result;
    rows.push({
      file: record.file,
      seed: record.coverage.seed,
      seal: id,
      build: record.build,
      bosses: r.uniqueBossKills,
      win: Boolean(r.mainWin),
      rounds: r.rounds,
      damage: r.sealStats?.[id]?.damage || 0,
      ownPoints: record.rounds.reduce((sum, round) => sum + (round.sg?.[id]?.pts || 0), 0)
    });
  }
  try {
    fs.writeFileSync(cacheFile, JSON.stringify({ files: files.length, rows }));
  } catch (error) {
    // read-only folder: just don't cache
  }
  return rows;
}

// Combine Coverage batches into one fair table:
// - only batches played on the same game, bot and experience (their fingerprints match) are mixed;
// - the same game played twice (same seed set, seed and SEAL, e.g. two PCs started in the same minute) counts once;
// - only seeds that every SEAL has played are used, so every SEAL is compared on exactly the same games.
function combineCoverage(dirs, { gameInfo = null } = {}) {
  const info = gameInfo || loadGameInfo();
  const included = [];
  const excluded = [];
  let reference = null;
  const seen = new Set();
  const rows = [];
  let duplicates = 0;
  for (const dir of dirs) {
    const id = path.basename(dir);
    let meta = null;
    try {
      meta = JSON.parse(fs.readFileSync(path.join(dir, "batch.json"), "utf8"));
    } catch (error) {
      excluded.push({ id, reason: "batch.json is missing or unreadable" });
      continue;
    }
    if (meta.args?.mode !== "coverage") {
      excluded.push({ id, reason: "not a Coverage batch" });
      continue;
    }
    const fp = meta.fingerprint;
    if (!fp) {
      excluded.push({ id, reason: "made before batches recorded their game version, so it can't be checked" });
      continue;
    }
    const key = `${fp.game}|${fp.bot}|${fp.experience}`;
    if (!reference) reference = { key, id, fp };
    else if (key !== reference.key) {
      const what = [fp.game !== reference.fp.game && "game code", fp.bot !== reference.fp.bot && "bot code/settings", fp.experience !== reference.fp.experience && "experience file"].filter(Boolean).join(", ");
      excluded.push({ id, reason: `played with a different ${what} than ${reference.id}` });
      continue;
    }
    let used = 0;
    let dup = 0;
    coverageRows(dir).forEach((row) => {
      const gameKey = `${meta.seeds}:${row.seed}:${row.seal}`;
      if (seen.has(gameKey)) {
        dup += 1;
        return;
      }
      seen.add(gameKey);
      rows.push({ ...row, seed: `${meta.seeds}:${row.seed}`, batch: id });
      used += 1;
    });
    duplicates += dup;
    included.push({ id, tag: meta.tag || null, runs: used + dup, used, duplicates: dup, finished: Boolean(meta.finished) });
  }
  // keep only seeds every SEAL has played
  const sealCount = new Set(rows.map((row) => row.seal)).size;
  const perSeed = new Map();
  rows.forEach((row) => perSeed.set(row.seed, (perSeed.get(row.seed) || 0) + 1));
  const complete = new Set([...perSeed.entries()].filter(([, count]) => count >= sealCount).map(([seed]) => seed));
  const usable = rows.filter((row) => complete.has(row.seed));
  const coverage = usable.length ? buildCoverage(usable, info.names) : null;
  return {
    coverage,
    included,
    excluded,
    duplicates,
    incompleteRuns: rows.length - usable.length,
    seeds: complete.size,
    sealCount,
    fingerprint: reference ? reference.fp : null
  };
}

// the late game: runs that won the main game and how far they got after it
function lateRows(bucket) {
  return Object.values(bucket)
    .map((entry) => ({
      name: entry.name,
      met: entry.met,
      killed: entry.killed,
      killRate: pct(entry.killed, entry.met),
      endedRun: entry.endedAlone,
      endedRunRate: pct(entry.endedAlone, entry.met),
      endedWithOthers: entry.endedWithOthers,
      avgRounds: avg(entry.rounds),
      avgHpLost: avg(entry.hpLost),
      few: entry.met < 8,
      examples: entry.examples
    }))
    .sort((a, b) => b.endedRunRate - a.endedRunRate || b.met - a.met);
}

function buildLateGame(late, damage, totalRuns, isCoverage = false) {
  const depths = late.map((run) => run.endless);
  const buckets = [["0", 0, 0], ["1-2", 1, 2], ["3-5", 3, 5], ["6-10", 6, 10], ["11-20", 11, 20], ["21+", 21, Infinity]];
  const ended = {};
  late.forEach((run) => {
    ended[run.diedTo] = (ended[run.diedTo] || 0) + 1;
  });
  return {
    winners: late.length,
    winShare: pct(late.length, totalRuns),
    endlessAvg: avg(depths),
    endlessPlusMinus: isCoverage ? seedLevel(late, (run) => run.endless).pm : avgPlusMinus(depths),
    endlessMedian: median(depths),
    endlessBest: Math.max(0, ...depths),
    endlessRoundsAvg: avg(late.map((run) => run.endlessRounds)),
    hpAtWinAvg: avg(late.map((run) => run.hpAtWin).filter((hp) => Number.isFinite(hp))),
    damageMain: damage.mainRounds ? Math.round((damage.main / damage.mainRounds) * 100) / 100 : 0,
    damageEndless: damage.endlessRounds ? Math.round((damage.endless / damage.endlessRounds) * 100) / 100 : 0,
    depth: buckets.map(([label, lo, hi]) => ({ label, count: depths.filter((d) => d >= lo && d <= hi).length })),
    endedBy: Object.entries(ended).map(([by, count]) => ({ by, count, share: pct(count, late.length) })).sort((a, b) => b.count - a.count),
    runs: late.sort((a, b) => b.endless - a.endless)
  };
}

// item names, and which SEAL each Goetic BOSS blocks while it lives
function loadGameInfo() {
  try {
    const { GameVM } = require("./game-vm");
    const g = new GameVM("names");
    const names = {};
    Object.entries(g.items).forEach(([id, item]) => {
      names[id] = item.name;
    });
    const demonSeal = {};
    g.run("GOETIC_BOSS_SPECS").forEach((spec) => {
      demonSeal[spec.name] = spec.passiveId;
    });
    return { names, demonSeal };
  } catch (error) {
    return { names: {}, demonSeal: {} };
  }
}

module.exports = { buildSummary, buildCoverage, combineCoverage, coverageRows, readRuns, SUMMARY_VERSION, bossGroup };
