"use strict";

// pnpm run bot -- --runs 300 [--build critical] [--tag before-change] [--main-only] [--workers 6]
//                 [--seeds name] [--force-seal p31] [--max-rounds 1000]
// Plays a batch of runs in parallel and writes everything to bot-runs/<date>_<tag>/.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execSync } = require("node:child_process");
const { Worker, isMainThread, parentPort, workerData } = require("node:worker_threads");

const ROOT = path.resolve(__dirname, "..", "..");
const RUNS_DIR = path.join(ROOT, "bot-runs");
const EXPERIENCE_FILE = path.join(__dirname, "data", "experience.json");
const BUILDS = ["bounty", "memory", "reveal", "critical", "personality", "artifact"];

function parseArgs(argv) {
  const args = { runs: 100, build: "rotation", tag: "", mainOnly: false, workers: Math.max(1, os.cpus().length - 1), seeds: "", forceSeal: "", maxRounds: 1000, mode: "normal", perSeal: 30 };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = () => argv[++i];
    if (key === "--runs") args.runs = Math.max(1, parseInt(next(), 10) || 1);
    else if (key === "--build") args.build = String(next() || "rotation").toLowerCase();
    else if (key === "--tag") args.tag = String(next() || "").replace(/[^a-zA-Z0-9_-]+/g, "-");
    else if (key === "--main-only") args.mainOnly = true;
    else if (key === "--workers") args.workers = Math.max(1, parseInt(next(), 10) || 1);
    else if (key === "--seeds") args.seeds = String(next() || "").replace(/[^a-zA-Z0-9_-]+/g, "-");
    else if (key === "--force-seal") args.forceSeal = String(next() || "");
    else if (key === "--max-rounds") args.maxRounds = Math.max(10, parseInt(next(), 10) || 1000);
    else if (key === "--coverage") args.mode = "coverage";
    else if (key === "--per-seal") args.perSeal = Math.max(1, parseInt(next(), 10) || 30);
  }
  if (args.build !== "rotation" && !BUILDS.includes(args.build)) {
    throw new Error(`Unknown build "${args.build}". Use one of: ${BUILDS.join(", ")} (or leave it out for the rotation).`);
  }
  return args;
}

function gitInfo() {
  try {
    const commit = execSync("git rev-parse --short HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    const dirty = execSync("git status --porcelain -- src", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim().length > 0;
    return { commit, branch, dirty };
  } catch (error) {
    return { commit: null, branch: null, dirty: null };
  }
}

function stamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function loadExperience() {
  try {
    return JSON.parse(fs.readFileSync(EXPERIENCE_FILE, "utf8"));
  } catch (error) {
    return null;
  }
}

// every SEAL that can be offered in the game (removed ones left out)
function coverageSealIds() {
  const { GameVM } = require("./game-vm");
  const g = new GameVM("coverage-list");
  return g.run("PASSIVE_IDS.filter((id) => !REMOVED_PASSIVE_IDS.has(id))");
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data));
}

// ---- worker: plays the runs it is given ----
if (!isMainThread) {
  const { playRun } = require("./player");
  parentPort.on("message", (job) => {
    if (job === "stop") process.exit(0);
    try {
      const record = playRun(job);
      parentPort.postMessage({ index: job.index, record });
    } catch (error) {
      parentPort.postMessage({ index: job.index, error: String(error && error.stack ? error.stack : error) });
    }
  });
  return;
}

async function runBatch(args, { onProgress } = {}) {
  const started = new Date();
  const id = `${stamp(started)}${args.tag ? `_${args.tag}` : ""}`;
  let dir = path.join(RUNS_DIR, id);
  let n = 2;
  while (fs.existsSync(dir)) dir = path.join(RUNS_DIR, `${id}-${n++}`);
  fs.mkdirSync(path.join(dir, "runs"), { recursive: true });
  const experience = loadExperience();
  const seeds = args.seeds || path.basename(dir);
  const meta = {
    id: path.basename(dir),
    tag: args.tag || null,
    started: started.toISOString(),
    finished: null,
    args,
    seeds,
    git: gitInfo(),
    config: require("./config"),
    experience: experience ? { file: "scripts/bot/data/experience.json", made: experience.made, runs: experience.runs } : null,
    total: args.runs,
    done: 0,
    failed: 0
  };
  writeJson(path.join(dir, "batch.json"), meta);

  const jobs = [];
  if (args.mode === "coverage") {
    // Coverage: every SEAL gets the same seeds. Seed j is played once per SEAL, each time starting with that SEAL,
    // so SEALS are compared on identical dice. All SEALS of seed 1 come first, then seed 2..., so a batch stopped
    // early is still even.
    const sealIds = coverageSealIds();
    meta.coverage = { perSeal: args.perSeal, seals: sealIds.length };
    meta.total = sealIds.length * args.perSeal;
    for (let j = 0; j < args.perSeal; j += 1) {
      sealIds.forEach((id, i) => {
        // builds rotate across both seeds and SEALS: every seed is played with every build, and every SEAL
        // gets every build equally often
        const build = args.build === "rotation" ? BUILDS[(j + i) % BUILDS.length] : args.build;
        jobs.push({ index: jobs.length, seed: `${seeds}-${j + 1}`, build, mainOnly: args.mainOnly, forceSeal: id, coverage: { seed: j + 1, seal: id }, maxRounds: args.maxRounds, experience });
      });
    }
  } else {
    for (let i = 0; i < args.runs; i += 1) {
      jobs.push({
        index: i,
        seed: `${seeds}-${i + 1}`,
        build: args.build === "rotation" ? BUILDS[i % BUILDS.length] : args.build,
        mainOnly: args.mainOnly,
        forceSeal: args.forceSeal || null,
        maxRounds: args.maxRounds,
        experience
      });
    }
  }
  writeJson(path.join(dir, "batch.json"), meta);

  const workerCount = Math.min(args.workers, jobs.length);
  let nextJob = 0;
  const t0 = Date.now();
  await new Promise((resolve) => {
    let active = 0;
    const startWorker = () => {
      const worker = new Worker(__filename);
      active += 1;
      const feed = () => {
        if (nextJob >= jobs.length) {
          worker.postMessage("stop");
          return;
        }
        worker.postMessage(jobs[nextJob++]);
      };
      worker.on("message", (message) => {
        const file = path.join(dir, "runs", `run-${String(message.index + 1).padStart(4, "0")}.json`);
        if (message.error) {
          meta.failed += 1;
          writeJson(file, { seed: jobs[message.index].seed, build: jobs[message.index].build, error: message.error });
        } else {
          writeJson(file, message.record);
        }
        meta.done += 1;
        meta.elapsedSec = Math.round((Date.now() - t0) / 1000);
        writeJson(path.join(dir, "batch.json"), meta);
        if (onProgress) onProgress(meta, message);
        feed();
      });
      worker.on("exit", () => {
        active -= 1;
        if (active === 0) resolve();
      });
      feed();
    };
    for (let i = 0; i < workerCount; i += 1) startWorker();
  });

  const { buildSummary } = require("./report");
  const summary = buildSummary(dir);
  writeJson(path.join(dir, "summary.json"), summary);
  meta.finished = new Date().toISOString();
  meta.elapsedSec = Math.round((Date.now() - t0) / 1000);
  writeJson(path.join(dir, "batch.json"), meta);
  return { dir, meta, summary };
}

if (require.main === module) {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(args.mode === "coverage"
    ? `DEARTH bot: Coverage, ${args.perSeal} runs for every SEAL, build ${args.build}, ${args.workers} workers${args.tag ? `, tag ${args.tag}` : ""}`
    : `DEARTH bot: ${args.runs} runs, build ${args.build}, ${args.workers} workers${args.tag ? `, tag ${args.tag}` : ""}`);
  runBatch(args, {
    onProgress: (meta, message) => {
      const r = message.record?.result;
      const line = message.error ? "ERROR" : `${r.mainWin ? "WON " : "lost"} ${r.uniqueBossKills}/8 bosses${r.endlessBossKills ? ` +${r.endlessBossKills} endless` : ""}, ${r.rounds} rounds`;
      const forced = message.record?.coverage ? ` [${message.record.forcedSeal}]` : "";
      process.stdout.write(`  [${meta.done}/${meta.total}] ${message.record?.build || ""}${forced} ${line}\n`);
    }
  }).then(({ dir, meta, summary }) => {
    console.log(`\nDone in ${Math.round(meta.elapsedSec / 60)} min. Main game won in ${summary.overview.mainWins}/${summary.overview.runs} runs (${summary.overview.mainWinRate}%).`);
    if (summary.alarms.length) {
      console.log("Alarms:");
      summary.alarms.slice(0, 10).forEach((alarm) => console.log(`  - ${alarm.text}`));
    }
    console.log(`Results: ${path.relative(ROOT, dir)}  (open Bot Lab: pnpm run bot:lab)`);
  });
}

module.exports = { runBatch, parseArgs, coverageSealIds, RUNS_DIR, BUILDS, EXPERIENCE_FILE, ROOT };
