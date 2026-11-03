"use strict";

// pnpm run bot:lab  ->  http://localhost:5178
// Bot Lab: start batches with a button, watch progress, read reports and run logs.
// Dev tool only: listens on this computer alone (127.0.0.1) and is not part of any game build.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn, execSync } = require("node:child_process");
const { RUNS_DIR, BUILDS, ROOT, EXPERIENCE_FILE } = require("./run");

const PORT = Number(process.env.BOT_LAB_PORT) || 5178;
const LAB_PAGE = path.join(__dirname, "lab", "bot-lab.html");
const RUN_SCRIPT = path.join(__dirname, "run.js");
const TUNE_SCRIPT = path.join(__dirname, "tune.js");

let job = null; // the batch running now: { child, args, lines, started, kind }

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return null;
  }
}

function safeName(name) {
  return /^[A-Za-z0-9_.-]+$/.test(name) && !name.includes("..") ? name : null;
}

function currentCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch (error) {
    return null;
  }
}

function listBatches() {
  if (!fs.existsSync(RUNS_DIR)) return [];
  return fs
    .readdirSync(RUNS_DIR)
    .filter((name) => fs.existsSync(path.join(RUNS_DIR, name, "batch.json")))
    .map((name) => {
      const meta = readJson(path.join(RUNS_DIR, name, "batch.json")) || {};
      const summary = readJson(path.join(RUNS_DIR, name, "summary.json"));
      return {
        id: name,
        tag: meta.tag,
        started: meta.started,
        finished: meta.finished,
        total: meta.total,
        done: meta.done,
        args: meta.args,
        seeds: meta.seeds,
        git: meta.git,
        overview: summary ? summary.overview : null,
        alarms: summary ? summary.alarms.filter((alarm) => alarm.level === "high").length : 0
      };
    })
    .sort((a, b) => String(b.started).localeCompare(String(a.started)));
}

function sealList() {
  try {
    const { GameVM } = require("./game-vm");
    const g = new GameVM("lab");
    return g
      .run("PASSIVE_IDS.filter((id) => !REMOVED_PASSIVE_IDS.has(id))")
      .map((id) => ({ id, name: g.items[id]?.name || id, price: g.items[id]?.price || 0, description: g.items[id]?.description || "" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    return [];
  }
}
let sealCache = null;

function startJob(kind, args) {
  if (job && job.child.exitCode === null) return { error: "A batch is already running." };
  const script = kind === "tune" ? TUNE_SCRIPT : RUN_SCRIPT;
  const child = spawn(process.execPath, [script, ...args], { cwd: ROOT });
  job = { kind, child, args, lines: [], started: new Date().toISOString(), exitCode: null };
  const onData = (chunk) => {
    chunk
      .toString()
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => {
        job.lines.push(line);
        if (job.lines.length > 400) job.lines.shift();
      });
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  child.on("exit", (code) => {
    job.exitCode = code;
    job.finished = new Date().toISOString();
  });
  return { ok: true };
}

function jobStatus() {
  if (!job) return { running: false };
  const running = job.exitCode === null;
  let batch = null;
  if (job.kind === "run") {
    const newest = listBatches()[0];
    if (newest && new Date(newest.started) >= new Date(job.started) - 5000) batch = newest;
  }
  return { running, kind: job.kind, args: job.args, started: job.started, finished: job.finished || null, exitCode: job.exitCode, lines: job.lines.slice(-60), batch };
}

function batchArgs(body) {
  const args = body.mode === "coverage"
    ? ["--coverage", "--per-seal", String(Math.max(1, Math.min(200, parseInt(body.perSeal, 10) || 30)))]
    : ["--runs", String(Math.max(1, Math.min(5000, parseInt(body.runs, 10) || 100)))];
  if (body.build && body.build !== "rotation" && BUILDS.includes(body.build)) args.push("--build", body.build);
  if (body.tag) args.push("--tag", String(body.tag).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40));
  if (body.mainOnly) args.push("--main-only");
  if (body.seeds) args.push("--seeds", String(body.seeds).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40));
  if (body.mode !== "coverage" && body.forceSeal && /^p\d+$/.test(body.forceSeal)) args.push("--force-seal", body.forceSeal);
  if (body.workers) args.push("--workers", String(Math.max(1, Math.min(64, parseInt(body.workers, 10) || 1))));
  return args;
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 10000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (error) {
        resolve({});
      }
    });
  });
}

const FONT_TYPES = { ".otf": "font/otf", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean);
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/bot-lab.html")) {
      return send(res, 200, fs.readFileSync(LAB_PAGE), "text/html; charset=utf-8");
    }
    if (req.method === "GET" && parts[0] === "fonts") {
      const file = path.join(ROOT, "fonts", ...parts.slice(1).map((part) => safeName(decodeURIComponent(part)) || "_"));
      if (!file.startsWith(path.join(ROOT, "fonts")) || !fs.existsSync(file)) return send(res, 404, { error: "not found" });
      return send(res, 200, fs.readFileSync(file), FONT_TYPES[path.extname(file)] || "application/octet-stream");
    }
    if (parts[0] !== "api") return send(res, 404, { error: "not found" });

    if (req.method === "GET" && parts[1] === "info") {
      if (!sealCache) sealCache = sealList();
      const experience = readJson(EXPERIENCE_FILE);
      return send(res, 200, {
        builds: BUILDS,
        seals: sealCache,
        commit: currentCommit(),
        cpus: require("node:os").cpus().length,
        config: require("./config"),
        experience: experience ? { made: experience.made, runs: experience.runs, batches: experience.batches } : null
      });
    }
    if (req.method === "GET" && parts[1] === "batches") return send(res, 200, listBatches());
    if (req.method === "GET" && parts[1] === "status") return send(res, 200, jobStatus());
    if (req.method === "GET" && parts[1] === "batch" && parts[2]) {
      const id = safeName(parts[2]);
      if (!id) return send(res, 400, { error: "bad name" });
      const dir = path.join(RUNS_DIR, id);
      if (parts[3] === "run" && parts[4]) {
        const file = safeName(parts[4]);
        const run = file && readJson(path.join(dir, "runs", file));
        return run ? send(res, 200, run) : send(res, 404, { error: "run not found" });
      }
      const meta = readJson(path.join(dir, "batch.json"));
      if (!meta) return send(res, 404, { error: "batch not found" });
      let summary = readJson(path.join(dir, "summary.json"));
      const report = require("./report");
      // a batch still running (or stopped): build the report from the runs finished so far
      if (!summary) summary = report.buildSummary(dir);
      // a finished batch made by an older version of the report: rebuild it once with the new stats
      else if ((summary.version || 1) < report.SUMMARY_VERSION) {
        summary = report.buildSummary(dir);
        fs.writeFileSync(path.join(dir, "summary.json"), JSON.stringify(summary));
      }
      return send(res, 200, { meta, summary });
    }
    if (req.method === "POST" && parts[1] === "start") {
      const body = await readBody(req);
      return send(res, 200, startJob("run", batchArgs(body)));
    }
    if (req.method === "POST" && parts[1] === "tune") {
      const body = await readBody(req);
      const args = Array.isArray(body.batches) && body.batches.length ? ["--batches", body.batches.map(safeName).filter(Boolean).join(",")] : [];
      return send(res, 200, startJob("tune", args));
    }
    if (req.method === "POST" && parts[1] === "stop") {
      if (job && job.exitCode === null) job.child.kill();
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: "not found" });
  } catch (error) {
    return send(res, 500, { error: String(error && error.message ? error.message : error) });
  }
});

function openBrowser(url) {
  if (process.argv.includes("--no-open")) return;
  const opener = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try {
    const child = spawn(opener[0], opener[1], { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
  } catch (error) {
    // no browser to open: the address still works
  }
}

// Bot Lab already open in another window: just show it again
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`Bot Lab is already running at http://localhost:${PORT}. Opening it; you can close this window.`);
    openBrowser(`http://localhost:${PORT}`);
    setTimeout(() => process.exit(0), 1500);
    return;
  }
  throw error;
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Bot Lab is open at ${url}  (keep this window open while batches run; Ctrl+C to close)`);
  openBrowser(url);
});
