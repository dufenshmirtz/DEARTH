"use strict";

/* English text snapshot: the safety net for the translation work.
   It loads the whole game in a Node VM (no browser) and records every English text it can produce:
   - every text table (UPPERCASE constants: Satan, Jesus, Codex, missions, unlocks, BOSSES...)
   - every SEAL and ARTIFACT: name, description, the text shown at stack 1-6, the tooltip HTML
   - the text of the screens built by the render* functions (menu, settings, collection...)
   - simulated arcade runs (fixed random seeds): every log line and round event, plus the SEAL stats,
     so text that game logic reads (damage sources, discovery, unlocks) is checked too.
   node scripts/text-snapshot.js            compare with scripts/text-snapshot.en.json (exit 1 if different)
   node scripts/text-snapshot.js --update   rewrite the snapshot (only after a change you meant to make)
   The same comparison runs in node --test scripts/test-text-snapshot.js. */

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { SOURCE_FILES } = require("./build-game");

const root = path.resolve(__dirname, "..");
const SNAPSHOT_FILE = path.join(__dirname, "text-snapshot.en.json");
const FIXED_NOW = Date.UTC(2026, 10, 24, 12, 0, 0);
const RUN_SEEDS = 20;
const ROUNDS_PER_RUN = 24;

const sources = SOURCE_FILES.filter((file) => file !== "10-events-bootstrap.js")
  .map((file) => fs.readFileSync(path.join(root, "src/game", file), "utf8"))
  .join("\n");

function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// a document/window that accepts anything: rendering code runs, nothing is drawn
function permissiveStub(read) {
  const target = function stub() {};
  const proxy = new Proxy(target, {
    get(_t, key) {
      if (key === Symbol.toPrimitive) return () => "";
      if (key === "then") return undefined;
      if (key === "length") return 0;
      if (key === "value") return read();
      if (key === "innerWidth") return 1600;
      if (key === "innerHeight") return 900;
      return proxy;
    },
    set: () => true,
    apply: () => proxy,
    construct: () => proxy
  });
  return proxy;
}

function createGame(seed) {
  const storage = new Map();
  const io = { guess: "" };
  const stub = permissiveStub(() => io.guess);
  const random = seededRandom(seed);
  const math = Object.create(Math);
  math.random = random;
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [FIXED_NOW]));
    }
    static now() {
      return FIXED_NOW;
    }
  }
  const context = vm.createContext({
    console: { log() {}, warn() {}, error() {}, info() {} },
    Math: math,
    Date: FixedDate,
    JSON,
    Intl,
    document: stub,
    window: stub,
    navigator: { language: "en-US", userAgent: "node" },
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame() {},
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 0,
    clearInterval() {},
    Audio: function Audio() { return stub; },
    Image: function Image() { return stub; },
    getComputedStyle: () => stub,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key)
    }
  });
  vm.runInContext(sources, context);
  const run = (code) => vm.runInContext(code, context);
  run(`render = () => {}; localStorage.setItem("dearthIntroSeenV1", "1");`);
  return { run, io, context };
}

const ASSET_PATH = /^[\w ./'()-]*\.(png|webp|jpe?g|mp3|ogg|wav|svg|otf|woff2?)$/i;

function textStrings(value, prefix, out, seen = new Set()) {
  if (typeof value === "string") {
    if (/[A-Za-z]/.test(value) && !ASSET_PATH.test(value)) out[prefix] = value;
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (value instanceof Set || value instanceof Map) value = Array.from(value);
  for (const key of Object.keys(value)) textStrings(value[key], `${prefix}.${key}`, out, seen);
}

function staticTables(game) {
  const names = Array.from(new Set(Array.from(sources.matchAll(/^(?:const|let|var)\s+([A-Z][A-Z0-9_]+)\s*=/gm), (m) => m[1]))).sort();
  const out = {};
  names.forEach((name) => {
    if (/^(AUDIO|SFX|MUSIC)_|LOUDNESS/.test(name)) return;
    let value;
    try {
      value = game.run(name);
    } catch {
      return;
    }
    if (name === "ITEMS") return; // recorded item by item below
    textStrings(value, name, out);
  });
  return out;
}

function itemTexts(game) {
  return JSON.parse(
    game.run(`(() => {
      const out = {};
      Object.keys(ITEMS).sort().forEach((id) => {
        const base = ITEMS[id];
        const entry = { name: base.name, description: base.description || "" };
        const stacks = base.type === "passive" ? [1, 2, 3, 4, 5, 6] : [1];
        stacks.forEach((stack) => {
          const item = { ...base, stack, uid: id + "-snap" };
          try { entry["text" + stack] = itemDescription(item); } catch (error) { entry["text" + stack] = "ERROR " + error.message; }
          if (base.type === "passive") {
            try { entry["display" + stack] = passiveDisplayName(item); } catch (error) { entry["display" + stack] = "ERROR " + error.message; }
            try { entry["tooltip" + stack] = renderSealTooltipHtml(item, passiveDisplayName(item), itemDescription(item), "", null); } catch (error) { entry["tooltip" + stack] = "ERROR " + error.message; }
          }
        });
        out[id] = entry;
      });
      return JSON.stringify(out);
    })()`)
  );
}

// visible text of an HTML string: text nodes plus the attributes people read (tooltips, labels, placeholders)
function htmlText(html) {
  const attrs = [];
  String(html).replace(/\s(title|aria-label|placeholder|alt|data-tooltip|data-label)="([^"]*)"/g, (_m, name, value) => {
    if (/[A-Za-z]/.test(value)) attrs.push(`[${name}] ${value}`);
    return "";
  });
  const text = String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, (svg) => ` ${svg.replace(/<[^>]+>/g, " ")} `)
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return [...text, ...attrs];
}

function screenTexts(game, label) {
  const names = Array.from(new Set(Array.from(sources.matchAll(/^function (render[A-Za-z0-9_]*)\(/gm), (m) => m[1]))).sort();
  const out = {};
  names.forEach((name) => {
    if (name === "render") return;
    for (const arg of name === "renderSettingsPanel" ? ["menu", "pause"] : [undefined]) {
      let html;
      try {
        html = game.run(`${name}(${arg === undefined ? "" : JSON.stringify(arg)})`);
      } catch {
        continue;
      }
      if (typeof html !== "string" || !html.trim()) continue;
      const lines = htmlText(html);
      if (lines.length) out[`${label}.${name}${arg ? `(${arg})` : ""}`] = lines;
    }
  });
  return out;
}

// one arcade run: the player starts with a fixed set of SEALS, guesses the TARGET the DAMNED's plans point to,
// buys what it can afford, and every text the run writes is recorded
function simulatedRun(seed, sealIds, withScreens) {
  const game = createGame(seed);
  game.run(`
    globalThis.__snapLog = [];
    const __addLog = addLog;
    addLog = (message) => { __snapLog.push(normalizeGameText(message)); return __addLog(message); };
    startGame();
    // a sturdier player reaches the BOSSES, so their texts are in the snapshot too
    state.player.maxHp = 400;
    state.player.hp = 400;
  `);
  game.run(`${JSON.stringify(sealIds)}.forEach((id) => { if (ITEMS[id]) state.player.passives.push(itemCopy(id)); });`);
  const rounds = [];
  for (let step = 0; step < ROUNDS_PER_RUN * 3 + 6; step += 1) {
    const stage = game.run("state.stage");
    if (game.run("Boolean(state.gameOver)") || game.run("state.round") > ROUNDS_PER_RUN) break;
    if (stage === "guess") {
      game.io.guess = String(
        game.run(`(() => {
          const living = state.bots.filter((bot) => !bot.eliminated);
          const average = living.reduce((sum, bot) => sum + (bot.plannedGuess || 0), 0) / Math.max(1, living.length);
          return Math.max(0, Math.min(100, Math.round(average * 0.8)));
        })()`)
      );
      game.run("submitGuess()");
    } else if (stage === "active") {
      game.run("readyRound(); finishRoundRevealAnimation();");
      rounds.push({
        round: game.run("state.round"),
        events: JSON.parse(game.run("JSON.stringify((state.roundState && state.roundState.roundEvents) || [])"))
      });
    } else if (stage === "summary") {
      game.run(`state.shop.forEach((slot, index) => {
        if (!slot || slot.sold) return;
        if (slot.item.type === "active" && state.player.actives.length >= ACTIVE_LIMIT) return;
        buyShopItem(index);
      });`);
      // Satan's and Jesus' scenes need the browser (timers, dialogue boxes): the simulated run skips them
      game.run(`state.satanDealIntroDue = false; state.satanVictoryDue = false; state.judgementTalkDue = false; state.satanTightwadDue = false;
        introState.phase = "off"; advanceAfterSummary();`);
    } else {
      break;
    }
  }
  return {
    seals: sealIds,
    lastRound: game.run("state.round"),
    gameOver: game.run("Boolean(state.gameOver)"),
    log: JSON.parse(game.run("JSON.stringify(__snapLog)")),
    rounds,
    sealStats: JSON.parse(game.run("JSON.stringify(state.sealStats || {})")),
    screens: withScreens ? screenTexts(game, "run") : {}
  };
}

function buildSnapshot() {
  const base = createGame(1);
  const snapshot = {
    tables: staticTables(base),
    items: itemTexts(base),
    screens: screenTexts(base, "menu")
  };
  const sealIds = JSON.parse(base.run(`JSON.stringify(PASSIVE_IDS.filter((id) => !REMOVED_PASSIVE_IDS.has(id) && ITEMS[id]))`));
  snapshot.runs = [];
  for (let seed = 1; seed <= RUN_SEEDS; seed += 1) {
    const start = ((seed - 1) * 6) % sealIds.length;
    const seals = sealIds.slice(start, start + 6);
    snapshot.runs.push(simulatedRun(seed * 7919, seals, seed <= 3));
  }
  return snapshot;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 1)}\n`;
}

// first differences between two snapshots, as readable lines
function snapshotDifferences(expected, actual, limit = 30) {
  const flat = (value, prefix = "", out = new Map()) => {
    if (value && typeof value === "object") {
      Object.keys(value).forEach((key) => flat(value[key], prefix ? `${prefix}.${key}` : key, out));
      if (!Object.keys(value).length) out.set(prefix, Array.isArray(value) ? "[]" : "{}");
    } else out.set(prefix, value);
    return out;
  };
  const a = flat(expected);
  const b = flat(actual);
  const lines = [];
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    if (a.get(key) === b.get(key)) continue;
    lines.push(`${key}\n    was: ${JSON.stringify(a.get(key))}\n    now: ${JSON.stringify(b.get(key))}`);
    if (lines.length >= limit) break;
  }
  return lines;
}

module.exports = { buildSnapshot, stableJson, snapshotDifferences, SNAPSHOT_FILE, createGame };

if (require.main === module) {
  const actual = buildSnapshot();
  if (process.argv.includes("--update")) {
    fs.writeFileSync(SNAPSHOT_FILE, stableJson(actual));
    console.log(`Wrote ${path.relative(root, SNAPSHOT_FILE)}`);
  } else {
    const expected = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
    const differences = snapshotDifferences(expected, JSON.parse(stableJson(actual)));
    if (differences.length) {
      console.error(`English text changed (first ${differences.length} differences):\n${differences.join("\n")}`);
      process.exit(1);
    }
    console.log("English text snapshot: unchanged.");
  }
}
