"use strict";

// pnpm run bot -- --runs 300 [--build critical] [--tag before-change] [--main-only] [--workers 6]
//                 [--seeds name] [--force-seal p31] [--max-rounds 1000]
// Plays a batch of runs in parallel and writes everything to bot-runs/<date>_<tag>/.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execSync } = require("node:child_process");
const crypto = require("node:crypto");
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
    else if (key === "--continue") args.continueId = String(next() || "").replace(/[^a-zA-Z0-9_.-]+/g, "");
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

// write to a temporary file first, then swap it in: a Stop in the middle never leaves half a file
function writeJson(file, data) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data));
  fs.renameSync(temp, file);
}

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return null;
  }
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

// ---- fingerprint: what a batch was played with (game rules, bot code and settings, experience) ----
// Continue is only allowed when all three are exactly the same, so the second half of a batch can never be
// played under different rules than the first half. Line endings are ignored (git on Windows changes them).
function hashFiles(files) {
  const hash = crypto.createHash("sha1");
  files.forEach((file) => {
    hash.update(path.basename(file));
    hash.update(fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : "<missing>");
  });
  return hash.digest("hex").slice(0, 16);
}
function fingerprint() {
  const { SOURCE_FILES } = require(path.join(ROOT, "scripts", "build-game.js"));
  // only the files that decide how runs are played (the report, Bot Lab and tuning can change freely)
  const notPlay = new Set(["test-bot.js", "report.js", "tune.js", "lab-server.js"]);
  const botFiles = fs.readdirSync(__dirname).filter((name) => name.endsWith(".js") && !notPlay.has(name)).sort();
  return {
    game: hashFiles(SOURCE_FILES.map((name) => path.join(ROOT, "src", "game", name))),
    bot: hashFiles(botFiles.map((name) => path.join(__dirname, name))),
    experience: fs.existsSync(EXPERIENCE_FILE) ? hashFiles([EXPERIENCE_FILE]) : "none"
  };
}

// ---- lock: a batch being played right now can't be continued from a second window ----
function lockFile(dir) {
  return path.join(dir, "running.lock");
}
function isRunning(dir) {
  const lock = readJsonSafe(lockFile(dir));
  if (!lock || !lock.pid) return false;
  try {
    process.kill(lock.pid, 0); // only checks the process exists
    return lock.pid !== process.pid;
  } catch (error) {
    return false;
  }
}

// the same list of runs every time for the same batch settings (that is what makes Continue exact)
function buildJobs(args, seeds, experience) {
  const jobs = [];
  if (args.mode === "coverage") {
    // Coverage: every SEAL gets the same seeds. Seed j is played once per SEAL, each time starting with that SEAL,
    // so SEALS are compared on identical dice. All SEALS of seed 1 come first, then seed 2..., so a batch stopped
    // early is still even.
    const sealIds = coverageSealIds();
    for (let j = 0; j < args.perSeal; j += 1) {
      sealIds.forEach((id, i) => {
        // builds rotate across both seeds and SEALS: every seed is played with every build, and every SEAL
        // gets every build equally often
        const build = args.build === "rotation" ? BUILDS[(j + i) % BUILDS.length] : args.build;
        jobs.push({ index: jobs.length, seed: `${seeds}-${j + 1}`, build, mainOnly: args.mainOnly, forceSeal: id, coverage: { seed: j + 1, seal: id }, maxRounds: args.maxRounds, experience });
      });
    }
    return { jobs, coverage: { perSeal: args.perSeal, seals: sealIds.length } };
  }
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
  return { jobs, coverage: null };
}

function runFile(dir, index) {
  return path.join(dir, "runs", `run-${String(index + 1).padStart(4, "0")}.json`);
}

// a finished run on disk that really belongs to this job (same seed, same forced SEAL, same build)
function jobDone(dir, job) {
  const record = readJsonSafe(runFile(dir, job.index));
  if (!record) return false;
  return record.seed === job.seed && record.build === job.build && (record.forcedSeal || null) === (job.forceSeal || null);
}

// Can this batch be continued? Returns { ok } or { ok: false, reason } in plain words.
function checkContinue(dir, now = fingerprint()) {
  const meta = readJsonSafe(path.join(dir, "batch.json"));
  if (!meta) return { ok: false, reason: "This batch has no batch.json." };
  if (isRunning(dir)) return { ok: false, running: true, reason: "This batch is still running. (If you are sure nothing is running, delete running.lock in its folder.)" };
  if (!meta.fingerprint) return { ok: false, reason: "This batch was made before Continue existed, so the bot can't check it would be played the same way. Start a new batch instead." };
  const changed = [];
  if (now.game !== meta.fingerprint.game) changed.push("the game code (src/game)");
  if (now.bot !== meta.fingerprint.bot) changed.push("the bot code or its settings (scripts/bot, config.js)");
  if (now.experience !== meta.fingerprint.experience) changed.push("the bot's experience (Update from all batches was clicked since)");
  if (changed.length) return { ok: false, reason: `Since this batch started, ${changed.join(", ")} changed. Continuing would mix runs played under different rules, so it is blocked. Start a new batch instead.` };
  const runsDir = path.join(dir, "runs");
  const done = fs.existsSync(runsDir) ? fs.readdirSync(runsDir).filter((name) => /^run-\d+\.json$/.test(name) && readJsonSafe(path.join(runsDir, name))).length : 0;
  // all runs are there but the batch never got its final report (e.g. closed at the very end): Continue just finishes it
  if (done >= meta.total) return { ok: true, done, total: meta.total, complete: true };
  return { ok: true, done, total: meta.total };
}

async function runBatch(args, { onProgress, continueId = null } = {}) {
  const started = new Date();
  let dir;
  let meta;
  const experience = loadExperience();
  if (continueId) {
    dir = path.join(RUNS_DIR, continueId);
    const check = checkContinue(dir);
    if (!check.ok) throw new Error(check.reason);
    meta = readJsonSafe(path.join(dir, "batch.json"));
    // same settings as when it started (only the number of workers may differ: it changes speed, not results)
    args = { ...meta.args, workers: args.workers };
    meta.continued = [...(meta.continued || []), started.toISOString()];
    meta.finished = null;
  } else {
    const id = `${stamp(started)}${args.tag ? `_${args.tag}` : ""}`;
    dir = path.join(RUNS_DIR, id);
    let n = 2;
    while (fs.existsSync(dir)) dir = path.join(RUNS_DIR, `${id}-${n++}`);
    fs.mkdirSync(path.join(dir, "runs"), { recursive: true });
    meta = {
      id: path.basename(dir),
      tag: args.tag || null,
      started: started.toISOString(),
      finished: null,
      args,
      seeds: args.seeds || path.basename(dir),
      git: gitInfo(),
      fingerprint: fingerprint(),
      config: require("./config"),
      experience: experience ? { file: "scripts/bot/data/experience.json", made: experience.made, runs: experience.runs } : null,
      total: args.runs,
      done: 0,
      failed: 0
    };
  }
  writeJson(lockFile(dir), { pid: process.pid, started: started.toISOString() });

  const { jobs, coverage } = buildJobs(args, meta.seeds, experience);
  if (coverage) meta.coverage = coverage;
  meta.total = jobs.length;
  // runs already on disk are kept; a run cut off by Stop was never written, so it is simply played again
  // (same seed, same result as if it had never been stopped)
  const todo = jobs.filter((job) => !jobDone(dir, job));
  meta.done = jobs.length - todo.length;
  meta.failed = jobs.filter((job) => readJsonSafe(runFile(dir, job.index))?.error).length;
  const elapsedBefore = meta.elapsedSec || 0;
  writeJson(path.join(dir, "batch.json"), meta);

  const workerCount = Math.min(args.workers, todo.length);
  let nextJob = 0;
  const t0 = Date.now();
  await new Promise((resolve) => {
    if (!workerCount) {
      resolve();
      return;
    }
    let active = 0;
    const startWorker = () => {
      const worker = new Worker(__filename);
      active += 1;
      const feed = () => {
        if (nextJob >= todo.length) {
          worker.postMessage("stop");
          return;
        }
        worker.postMessage(todo[nextJob++]);
      };
      worker.on("message", (message) => {
        const job = jobs[message.index];
        if (message.error) {
          meta.failed += 1;
          writeJson(runFile(dir, message.index), { seed: job.seed, build: job.build, forcedSeal: job.forceSeal || null, error: message.error });
        } else {
          writeJson(runFile(dir, message.index), message.record);
        }
        meta.done += 1;
        meta.elapsedSec = elapsedBefore + Math.round((Date.now() - t0) / 1000);
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
  meta.elapsedSec = elapsedBefore + Math.round((Date.now() - t0) / 1000);
  writeJson(path.join(dir, "batch.json"), meta);
  try {
    fs.unlinkSync(lockFile(dir));
  } catch (error) {
    // already gone
  }
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
  if (args.continueId) console.log(`DEARTH bot: continuing ${args.continueId} with ${args.workers} workers`);
  else console.log(args.mode === "coverage"
    ? `DEARTH bot: Coverage, ${args.perSeal} runs for every SEAL, build ${args.build}, ${args.workers} workers${args.tag ? `, tag ${args.tag}` : ""}`
    : `DEARTH bot: ${args.runs} runs, build ${args.build}, ${args.workers} workers${args.tag ? `, tag ${args.tag}` : ""}`);
  runBatch(args, {
    continueId: args.continueId || null,
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
  }).catch((error) => {
    console.error(`Could not run: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runBatch, parseArgs, checkContinue, isRunning, fingerprint, buildJobs, jobDone, coverageSealIds, RUNS_DIR, BUILDS, EXPERIENCE_FILE, ROOT };
