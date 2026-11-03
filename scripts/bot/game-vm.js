"use strict";

// The whole game (src/game) loaded into a Node VM with no browser: no rendering, no sound, no timers.
// The bot drives it through the same functions the buttons call (submitGuess, useActive, buyShopItem, ...).
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRng } = require("./rng");

const root = path.resolve(__dirname, "..", "..");
const { SOURCE_FILES } = require(path.join(root, "scripts", "build-game.js"));

let cachedScript = null;
function gameScript() {
  if (cachedScript) return cachedScript;
  const sources = SOURCE_FILES.filter((file) => file !== "10-events-bootstrap.js")
    .map((file) => fs.readFileSync(path.join(root, "src", "game", file), "utf8"))
    .join("\n");
  cachedScript = new vm.Script(sources + "\n" + fs.readFileSync(path.join(__dirname, "vm-helpers.js"), "utf8"), {
    filename: "dearth-game.js"
  });
  return cachedScript;
}

function fakeElement() {
  const element = {
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild: (child) => child,
    removeChild() {},
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    focus() {},
    blur() {},
    play: () => Promise.resolve(),
    pause() {},
    load() {},
    cloneNode: () => fakeElement(),
    innerHTML: "",
    textContent: "",
    value: ""
  };
  return element;
}

class GameVM {
  constructor(seed) {
    this.storage = new Map();
    this.rng = createRng(seed);
    this.guessInput = fakeElement();
    const storage = this.storage;
    const guessInput = this.guessInput;
    const body = fakeElement();
    const sandbox = {
      console: { log() {}, info() {}, warn() {}, error() {}, debug() {} },
      setTimeout: () => 0,
      clearTimeout() {},
      setInterval: () => 0,
      clearInterval() {},
      requestAnimationFrame: () => 0,
      cancelAnimationFrame() {},
      performance: { now: () => 0 },
      navigator: { userAgent: "node-bot", maxTouchPoints: 0 },
      Audio: function Audio() { return fakeElement(); },
      localStorage: {
        getItem: (key) => (storage.has(key) ? storage.get(key) : null),
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: (key) => storage.delete(key)
      },
      document: {
        body,
        documentElement: fakeElement(),
        activeElement: body,
        addEventListener() {},
        removeEventListener() {},
        createElement: () => fakeElement(),
        querySelector: (selector) => (selector === "#guessInput" ? guessInput : null),
        querySelectorAll: () => [],
        getElementById: () => null
      },
      __rng: () => this.rng()
    };
    sandbox.window = sandbox;
    sandbox.innerWidth = 1600;
    sandbox.innerHeight = 900;
    sandbox.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    this.context = vm.createContext(sandbox);
    gameScript().runInContext(this.context);
    this.state = this.run("state");
    this.api = this.run("__bot");
    this.buildTags = this.run("SEAL_BUILD_TAGS");
    this.items = this.run("ITEMS");
  }

  run(code) {
    return vm.runInContext(code, this.context);
  }

  // ---- look-ahead: copy everything, try something, put it all back ----
  snapshot() {
    return { game: this.api.snapshot(), storage: new Map(this.storage), rng: this.rng.getState() };
  }

  restore(snap) {
    this.api.restore(snap.game);
    this.storage.clear();
    snap.storage.forEach((value, key) => this.storage.set(key, value));
    this.rng.setState(snap.rng);
  }

  // run fn on a copy of the game with its own dice; the real game is unchanged afterwards
  // (pass a snapshot taken once to try many options from the same moment more cheaply)
  lookahead(simSeed, fn, snap = this.snapshot()) {
    const realRng = this.rng;
    this.rng = createRng(simSeed);
    try {
      return fn();
    } finally {
      this.rng = realRng;
      this.restore(snap);
    }
  }
}

module.exports = { GameVM, root };
