"use strict";

// pnpm run bot:tune [-- --batches 2026-11-03_1400,2026-11-04_0900]
// The bot's "experience": reads finished batches and writes how many points each SEAL and ARTIFACT
// actually brought per round / per use. The shop uses this instead of judging by price.
// Re-run after big changes (several new SEALS); small number tweaks don't need it.
const fs = require("node:fs");
const path = require("node:path");
const { readRuns } = require("./report");
const { RUNS_DIR, EXPERIENCE_FILE } = require("./run");

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
  let runCount = 0;
  for (const dir of dirs) {
    for (const record of readRuns(dir)) {
      if (record.error || record.forcedSeal) continue;
      runCount += 1;
      record.rounds.forEach((round) => {
        if (!Number.isFinite(round.pts) || round.pts <= -999) return;
        const bucket = Math.floor((round.r - 1) / 5);
        const entry = stage.get(bucket) || { sum: 0, count: 0 };
        entry.sum += round.pts;
        entry.count += 1;
        stage.set(bucket, entry);
        rounds.push({ bucket, pts: round.pts, seals: (round.seals || []).map((tag) => tag.split("x")[0]), sg: round.sg || {}, art: round.art });
      });
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
  Object.entries(seals).forEach(([id, entry]) => {
    const direct = entry.direct / entry.rounds;
    const ownedResidual = entry.residual / entry.rounds;
    const otherRounds = rounds.length - entry.rounds;
    const otherResidual = otherRounds ? (allResidual - entry.residual) / otherRounds : 0;
    const matched = ownedResidual - otherResidual;
    // half what the SEAL did itself, half the better of that and how the rounds went with it
    const perRound = 0.5 * direct + 0.5 * Math.max(direct, matched);
    out.seals[id] = { perRound: round2(perRound), direct: round2(direct), matched: round2(matched), rounds: entry.rounds };
  });

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

function round2(value) {
  return Math.round(value * 100) / 100;
}

if (require.main === module) {
  try {
    const out = tune(parseArgs(process.argv.slice(2)).batches);
    const ranked = Object.entries(out.seals).filter(([, s]) => s.rounds >= 30).sort((a, b) => b[1].perRound - a[1].perRound);
    console.log(`Experience updated from ${out.runs} runs in ${out.batches.length} batch(es): ${Object.keys(out.seals).length} SEALS, ${Object.keys(out.artifacts).length} ARTIFACTS.`);
    console.log("Top SEALS (points per round):", ranked.slice(0, 5).map(([id, s]) => `${id} ${s.perRound}`).join(", "));
    console.log(`Saved to ${path.relative(process.cwd(), EXPERIENCE_FILE)}. The next batch uses it.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { tune };
