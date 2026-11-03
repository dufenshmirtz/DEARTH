"use strict";

// pnpm run bot:tune [-- --batches 2026-11-03_1400,2026-11-04_0900]
// The bot's "experience": reads finished batches and writes what each SEAL and ARTIFACT is worth.
// A SEAL's worth mixes what it did itself (damage, healing, SIN... capped so one streak can't dominate)
// with whether runs holding it beat more BOSSES than runs alive at the same round; the second counts
// more as more runs hold it. The shop uses this instead of judging by price.
// Re-run after big changes (several new SEALS); small number tweaks don't need it.
const fs = require("node:fs");
const path = require("node:path");
const { readRuns, buildCoverage } = require("./report");
const { RUNS_DIR, EXPERIENCE_FILE } = require("./run");
const CONFIG = require("./config");

function parseArgs(argv) {
  const args = { batches: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--batches") args.batches = String(argv[++i] || "").split(",").map((name) => name.trim()).filter(Boolean);
  }
  return args;
}

function tune(batchNames) {
  const dirs = (batchNames.length ? batchNames : fs.existsSync(RUNS_DIR) ? fs.readdirSync(RUNS_DIR) : [])
    .map((name) => path.join(RUNS_DIR, name))
    .filter((dir) => fs.existsSync(path.join(dir, "runs")));
  if (!dirs.length) throw new Error("No batches found in bot-runs/. Run some first: pnpm run bot -- --runs 100");

  // 1. typical points per round at each stage of a run (5-round buckets)
  const stage = new Map();
  const rounds = [];
  const sinCorrection = {}; // SEAL id -> points to take off its own total (old runs only)
  const runsInfo = []; // per run: rounds, BOSSES beaten, round each SEAL first arrived
  const coverageRuns = [];
  let runCount = 0;
  for (const dir of dirs) {
    for (const record of readRuns(dir)) {
      if (record.error) continue;
      runCount += 1;
      // Coverage runs (every SEAL on the same seeds) give the fairest SEAL comparison: keep them apart
      if (record.coverage) {
        const id = record.coverage.seal;
        coverageRuns.push({ seed: `${path.basename(dir)}:${record.coverage.seed}`, seal: id, build: record.build, bosses: record.result.uniqueBossKills, win: Boolean(record.result.mainWin), rounds: record.result.rounds, damage: 0, ownPoints: 0 });
      }
      record.rounds.forEach((round) => {
        if (!Number.isFinite(round.pts) || round.pts <= -999) return;
        const bucket = Math.floor((round.r - 1) / 5);
        const entry = stage.get(bucket) || { sum: 0, count: 0 };
        entry.sum += round.pts;
        entry.count += 1;
        stage.set(bucket, entry);
        rounds.push({ bucket, pts: round.pts, seals: (round.seals || []).map((tag) => tag.split("x")[0]), sg: round.sg || {}, art: round.art });
      });
      const firstOwned = {};
      record.rounds.forEach((round) => (round.seals || []).forEach((tag) => {
        const id = tag.split("x")[0];
        if (!(id in firstOwned)) firstOwned[id] = round.r;
      }));
      runsInfo.push({ rounds: record.result.rounds, bosses: record.result.uniqueBossKills, firstOwned });
      // runs from before the SIN fix counted every SIN a SEAL paid at full value: correct them
      if ((record.version || 1) < 2) oldRunSinCorrection(record, sinCorrection);
    }
  }

  // 2. per SEAL: what it did itself (its own SEAL stats) and how rounds went while it was owned
  const seals = {};
  let allResidual = 0;
  rounds.forEach((round) => {
    const base = stage.get(round.bucket);
    round.residual = round.pts - base.sum / base.count;
    allResidual += round.residual;
  });
  rounds.forEach((round) => {
    round.seals.forEach((id) => {
      const entry = seals[id] || (seals[id] = { rounds: 0, direct: 0, residual: 0 });
      entry.rounds += 1;
      entry.direct += round.sg[id]?.pts || 0;
      entry.residual += round.residual;
    });
  });
  const out = { made: new Date().toISOString(), runs: runCount, batches: dirs.map((dir) => path.basename(dir)), seals: {}, artifacts: {} };
  const raw = {};
  Object.entries(seals).forEach(([id, entry]) => {
    const direct = Math.max(0, entry.direct - (sinCorrection[id] || 0)) / entry.rounds;
    const ownedResidual = entry.residual / entry.rounds;
    const otherRounds = rounds.length - entry.rounds;
    const otherResidual = otherRounds ? (allResidual - entry.residual) / otherRounds : 0;
    const matched = ownedResidual - otherResidual;
    // half what the SEAL did itself, half the better of that and how the rounds went with it
    raw[id] = { perRound: 0.5 * direct + 0.5 * Math.max(direct, matched), direct, matched, rounds: entry.rounds };
  });
  // one lucky streak can't make a SEAL dominate: cap at a few times a typical SEAL
  const solid = Object.values(raw).filter((entry) => entry.rounds >= 100 && entry.perRound > 0).map((entry) => entry.perRound);
  const pool = solid.length >= 5 ? solid : Object.values(raw).filter((entry) => entry.perRound > 0).map((entry) => entry.perRound);
  const typical = median(pool);
  const cap = typical > 0 ? typical * CONFIG.shop.valueCapMultiple : Infinity;
  out.typicalPerRound = round2(typical);
  out.cap = Number.isFinite(cap) ? round2(cap) : null;
  // what really matters: did runs holding the SEAL beat more BOSSES than runs alive at the same round?
  // (SIN or BOUNTY that never turns into BOSS kills shouldn't make a SEAL look good)
  const outcome = sealOutcomes(runsInfo);
  // where Coverage batches measured a SEAL against the average SEAL on the same seeds, trust that instead
  if (coverageRuns.length) {
    buildCoverage(coverageRuns, {}).seals.forEach((seal) => {
      if (seal.runs < 10) return;
      outcome[seal.id] = { runs: seal.runs, bossEdge: seal.edge, remaining: seal.avgRounds, coverage: true };
    });
  }
  Object.entries(raw).forEach(([id, entry]) => {
    const capped = entry.perRound > cap;
    const ownPoints = Math.min(entry.perRound, cap);
    const o = outcome[id];
    let perRound = ownPoints;
    let outcomePerRound = null;
    if (o && o.runs > 0 && o.remaining > 0) {
      outcomePerRound = (o.bossEdge * BOSS_POINTS) / o.remaining;
      const weight = o.runs / (o.runs + CONFIG.shop.outcomeTrustRuns);
      perRound = weight * outcomePerRound + (1 - weight) * ownPoints;
    }
    out.seals[id] = {
      perRound: round2(perRound),
      ownPoints: round2(ownPoints),
      raw: round2(entry.perRound),
      capped,
      bossEdge: o ? round2(o.bossEdge) : null,
      outcomePerRound: outcomePerRound === null ? null : round2(outcomePerRound),
      runs: o ? o.runs : 0,
      fromCoverage: Boolean(o && o.coverage),
      direct: round2(entry.direct),
      matched: round2(entry.matched),
      rounds: entry.rounds
    };
  });
  // price-based starting estimate on the same scale as the measurements (for SEALS with little data)
  const prices = loadPrices();
  const ratios = Object.entries(out.seals)
    .filter(([id, entry]) => entry.runs >= 20 && prices[id] > 0)
    .map(([id, entry]) => Math.max(0, entry.perRound) / prices[id]);
  if (ratios.length >= 10) out.priorPointsPerPrice = Math.round(Math.max(0.01, median(ratios)) * 1000) / 1000;

  // 3. per ARTIFACT: average gain per use
  const artifacts = {};
  for (const dir of dirs) {
    for (const record of readRuns(dir)) {
      if (record.error) continue;
      Object.entries(record.artifactUses || {}).forEach(([id, use]) => {
        const entry = artifacts[id] || (artifacts[id] = { uses: 0, gain: 0 });
        entry.uses += use.uses;
        entry.gain += use.gain;
      });
    }
  }
  Object.entries(artifacts).forEach(([id, entry]) => {
    out.artifacts[id] = { uses: entry.uses, gain: round2(entry.gain / Math.max(1, entry.uses)) };
  });

  fs.mkdirSync(path.dirname(EXPERIENCE_FILE), { recursive: true });
  fs.writeFileSync(EXPERIENCE_FILE, JSON.stringify(out, null, 2).replace(/\n/g, "\r\n") + "\r\n");
  return out;
}

// beating a BOSS on the points scale: its whole HEALTH (100% x bossPercent) plus the kill bonus
const BOSS_POINTS = 100 * CONFIG.points.bossPercent + CONFIG.points.bossKillBonus;

// per SEAL: BOSSES beaten by runs that held it minus runs still alive at the round it arrived,
// and how many rounds were left after it arrived (to spread that over the rounds it was owned)
function sealOutcomes(runs) {
  const maxRound = Math.max(1, ...runs.map((run) => run.rounds));
  const reached = new Array(maxRound + 2).fill(0);
  const bossesReached = new Array(maxRound + 2).fill(0);
  runs.forEach((run) => {
    for (let round = 1; round <= run.rounds; round += 1) {
      reached[round] += 1;
      bossesReached[round] += run.bosses;
    }
  });
  const out = {};
  runs.forEach((run) => {
    Object.entries(run.firstOwned).forEach(([id, round]) => {
      if (!reached[round]) return;
      const entry = out[id] || (out[id] = { runs: 0, edge: 0, remaining: 0 });
      entry.runs += 1;
      entry.edge += run.bosses - bossesReached[round] / reached[round];
      entry.remaining += Math.max(1, run.rounds - round + 1);
    });
  });
  Object.values(out).forEach((entry) => {
    entry.bossEdge = entry.edge / entry.runs;
    entry.remaining = entry.remaining / entry.runs;
  });
  return out;
}

function loadPrices() {
  try {
    const { GameVM } = require("./game-vm");
    const g = new GameVM("prices");
    const prices = {};
    Object.entries(g.items).forEach(([id, item]) => {
      prices[id] = item.price || 0;
    });
    return prices;
  } catch (error) {
    return {};
  }
}

// SIN worth per SIN at a given amount held (same scale as the bot's points)
function marginalSin(held) {
  const p = CONFIG.points;
  if (held <= p.sinComfort) return p.sin;
  if (held <= CONFIG.shop.sinCap) return p.sinPile;
  return p.sinAbove150;
}

// old runs stored a SEAL's SIN at full value; take off the part that was really worth less
// (whole-run SIN per SEAL, valued at the average SIN held while the SEAL was owned)
function oldRunSinCorrection(record, correction) {
  const stats = record.result?.sealStats || {};
  const held = {};
  record.rounds.forEach((round) => {
    (round.seals || []).forEach((tag) => {
      const id = tag.split("x")[0];
      (held[id] = held[id] || []).push(marginalSin(round.sin0 || 0));
    });
  });
  Object.entries(held).forEach(([id, values]) => {
    const credits = stats[id]?.credits || 0;
    if (!credits) return;
    const worth = values.reduce((a, b) => a + b, 0) / values.length;
    correction[id] = (correction[id] || 0) + credits * (CONFIG.points.sin - worth);
  });
}

function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

if (require.main === module) {
  try {
    const out = tune(parseArgs(process.argv.slice(2)).batches);
    const ranked = Object.entries(out.seals).filter(([, s]) => s.rounds >= 30).sort((a, b) => b[1].perRound - a[1].perRound);
    console.log(`Experience updated from ${out.runs} runs in ${out.batches.length} batch(es): ${Object.keys(out.seals).length} SEALS, ${Object.keys(out.artifacts).length} ARTIFACTS.`);
    console.log("Top SEALS (points per round):", ranked.slice(0, 5).map(([id, s]) => `${id} ${s.perRound}`).join(", "));
    const capped = Object.entries(out.seals).filter(([, s]) => s.capped);
    if (capped.length) console.log(`Capped at ${out.cap} (${CONFIG.shop.valueCapMultiple}x a typical SEAL): ${capped.map(([id, s]) => `${id} (${s.raw})`).join(", ")}`);
    console.log(`Saved to ${path.relative(process.cwd(), EXPERIENCE_FILE)}. The next batch uses it.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { tune };
