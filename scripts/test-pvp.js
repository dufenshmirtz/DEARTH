"use strict";

// Local PvP rules (src/game/08-pvp.js): node --test scripts/test-pvp.js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const { SOURCE_FILES } = require("./build-game");

const root = path.resolve(__dirname, "..");
const sources = SOURCE_FILES.filter((file) => file !== "10-events-bootstrap.js")
  .map((file) => fs.readFileSync(path.join(root, "src/game", file), "utf8"))
  .join("\n");

// a table of `count` DAMNED (no server, no sounds, no screen), stopped in the ARTIFACT phase with these guesses
function table(guesses, { hp = [] } = {}) {
  const storage = new Map();
  const context = vm.createContext({
    assert,
    console,
    document: { addEventListener() {} },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key)
    }
  });
  vm.runInContext(sources, context);
  const run = (code) => vm.runInContext(code, context);
  run(`
    render = () => {};
    playGameSfx = () => {};
    playArtifactSfx = () => {};
    playNextRoundSfx = () => {};
    resumeSoundtrack = () => {};
    state.mode = "pvp";
    state.pvp = pvpInitialState(pvpNewSession(), ${guesses.length});
    state.pvp.session.timerSeconds = 0;
    pvpFillBotsAndStart();
    pvpClearAutoTimer();
    state.pvp.modifier = 1;
    const hp = ${JSON.stringify(hp)};
    state.pvp.slots.forEach((p, i) => { p.guess = ${JSON.stringify(guesses)}[i]; if (hp[i] !== undefined) p.hp = p.roundStartHp = hp[i]; });
    pvpPrepareActivePhase();
    pvpClearAutoTimer();
    state.pvp.slots.forEach((p) => { p.activeChoiceId = "skip"; p.activeTargetId = null; });
  `);
  return run;
}

// resolve the ARTIFACTS and play the whole reveal at once
const resolve = `pvpResolveActives(); while (state.pvp.stage === "reveal") pvpAdvanceReveal(); pvpClearAutoTimer();`;

test("a player knocked out by an ARTIFACT still counts for the final TARGET", () => {
  const run = table([10, 50, 90], { hp: [100, 2, 100] });
  run(`state.pvp.slots[0].activeChoiceId = "pulse"; state.pvp.slots[0].activeGuaranteeThisRound = true; ${resolve}`);
  assert.equal(run("state.pvp.slots[1].eliminated"), true);
  assert.equal(run("state.pvp.finalTarget"), 50);
});

test("an Inverted Cross takes a guess out of the final TARGET", () => {
  const run = table([10, 50, 90]);
  run(`const p = state.pvp.slots[0]; p.activeChoiceId = "jam"; p.activeTargetId = state.pvp.slots[2].id; p.activeGuaranteeThisRound = true; ${resolve}`);
  assert.equal(run("state.pvp.finalTarget"), 30);
});

test("everyone falls together: the least SOUL at the round's start wins", () => {
  const run = table([0, 100, 100], { hp: [20, 5, 10] });
  run(resolve);
  assert.equal(run("state.pvp.stage"), "ended");
  assert.equal(run("JSON.stringify(state.pvp.winners)"), run("JSON.stringify([state.pvp.slots[1].id])"));
  assert.equal(run("state.pvp.winReason.kind"), "lowestSoul");
});

test("even in SOUL: the guess closest to the final TARGET wins, then the win is shared", () => {
  // TARGET ceil(200/3) = 67: 100 is 33 away, 0 is 67 away
  let run = table([40, 60, 0], { hp: [5, 5, 50] });
  // TARGET ceil(100/3) = 34: 40 is 6 away, 60 is 26 away; seat 3 is knocked out too (34 damage)
  run(`state.pvp.slots[2].hp = state.pvp.slots[2].roundStartHp = 5; ${resolve}`);
  assert.equal(run("state.pvp.winReason.kind"), "closest");
  assert.equal(run("state.pvp.winners[0]"), run("state.pvp.slots[0].id"));
  run = table([20, 20], { hp: [5, 5] });
  run(`state.pvp.modifier = 3; ${resolve}`);
  assert.equal(run("state.pvp.winReason.kind"), "shared");
  assert.equal(run("state.pvp.winners.length"), 2);
});

test("the clock fills a missing guess with 50 and a missing ARTIFACT is lost without the Skip bonus", () => {
  const run = table([10, 20]);
  run(`
    state.pvp.stage = "guess";
    state.pvp.slots[0].guess = null;
    pvpTimerExpired();
    pvpClearAutoTimer();
  `);
  assert.equal(run("state.pvp.slots[0].guess"), 50);
  assert.equal(run("state.pvp.slots[0].autoGuess"), true);
  run(`state.pvp.slots[0].activeChoiceId = null; state.pvp.slots[1].activeChoiceId = "skip"; pvpTimerExpired(); while (state.pvp.stage === "reveal") pvpAdvanceReveal(); pvpClearAutoTimer();`);
  assert.equal(run("state.pvp.slots[0].activeTimedOut"), true);
  assert.equal(run("state.pvp.slots[0].activeGuaranteeNextRound"), false);
  assert.equal(run("state.pvp.slots[1].activeGuaranteeNextRound"), true);
});

test("a win counts for the session and buys a face reroll; Archangels need 8 wins", () => {
  const run = table([10, 20]);
  run(`
    const player = state.pvp.slots[0];
    player.human = true;
    player.remoteId = "phone-1";
    pvpEndGame([player], { kind: "last", round: 1 });
  `);
  assert.equal(run("pvpWins(state.pvp.slots[0])"), 1);
  assert.equal(run("pvpRerollFace(state.pvp.slots[0], 'archangel')"), false);
  assert.equal(run("pvpRerollFace(state.pvp.slots[0], 'goetic')"), true);
  assert.match(run("state.pvp.slots[0].image"), /goetic-stickmen-72/);
  assert.equal(run("pvpRerollFace(state.pvp.slots[0], 'goetic')"), false);
  run(`Object.assign(pvpSessionEntry(state.pvp.slots[0]), { wins: 8, rerolls: 1 }); pvpRerollFace(state.pvp.slots[0], 'archangel')`);
  assert.match(run("state.pvp.slots[0].image"), /archangels/);
  // Play Again keeps the player, the face and the wins
  run("pvpRematch()");
  assert.equal(run("state.pvp.stage"), "lobby");
  assert.equal(run("state.pvp.slots[0].remoteId"), "phone-1");
  assert.match(run("state.pvp.slots[0].image"), /archangels/);
  assert.equal(run("pvpWins(state.pvp.slots[0])"), 8);
  assert.equal(run("state.pvp.slots[1]"), null);
});
