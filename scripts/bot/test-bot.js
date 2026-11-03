"use strict";

// node --test scripts/bot/test-bot.js
// The balance bot must play fair (see only the screen) and its look-aheads must not change the real game.
const assert = require("node:assert/strict");
const test = require("node:test");
const { GameVM } = require("./game-vm");
const { observe } = require("./observe");
const { playRun } = require("./player");

test("at the guess stage the bot sees only revealed guesses", () => {
  const g = new GameVM("fair-1");
  g.api.startRun();
  g.state.bots.forEach((bot, index) => {
    bot.revealedByPassive = index === 0;
  });
  const obs = observe(g);
  obs.bots.forEach((bot, index) => {
    if (index === 0) assert.equal(bot.guess, g.state.bots[0].plannedGuess);
    else assert.equal(bot.guess, null);
  });
  assert.equal(obs.target, null);
});

test("a look-ahead leaves the real game and its dice exactly as they were", () => {
  const g = new GameVM("fair-2");
  g.api.startRun();
  const before = JSON.stringify(g.api.snapshot().state, (key, value) => (value instanceof Map ? [...value] : value instanceof Set ? [...value] : value));
  const dice = g.rng.getState();
  g.lookahead("sim", () => {
    g.api.guess(40);
    g.api.ready();
    assert.ok(g.state.stage === "summary" || g.state.stage === "ended");
  });
  const after = JSON.stringify(g.api.snapshot().state, (key, value) => (value instanceof Map ? [...value] : value instanceof Set ? [...value] : value));
  assert.equal(after, before);
  assert.deepEqual(g.rng.getState(), dice);
});

test("the same seed plays the same run", () => {
  const a = playRun({ seed: "same", build: "critical", maxRounds: 6 });
  const b = playRun({ seed: "same", build: "critical", maxRounds: 6 });
  assert.deepEqual(
    a.rounds.map((r) => [r.guess.g, r.Tf, r.dmg, r.hp1]),
    b.rounds.map((r) => [r.guess.g, r.Tf, r.dmg, r.hp1])
  );
  assert.ok(a.rounds.length >= 1);
});

test("a Coverage run keeps its forced SEAL the whole run", () => {
  const run = playRun({ seed: "keep-forced", build: "bounty", forceSeal: "p13", coverage: { seed: 1, seal: "p13" }, maxRounds: 12 });
  assert.equal(run.forcedSeal, "p13");
  assert.deepEqual(run.coverage, { seed: 1, seal: "p13" });
  run.rounds.forEach((round) => {
    if (round.seals) assert.ok(round.seals.some((tag) => tag.split("x")[0] === "p13"), `round ${round.r} lost the forced SEAL`);
  });
});
