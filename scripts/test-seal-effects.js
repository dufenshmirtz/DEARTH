"use strict";

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

function game() {
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
  vm.runInContext(`
    function fixture(passives, guesses) {
      state.mode = "arcade";
      state.player.passives = passives.map(([id, stack = 1]) => ({ ...ITEMS[id], stack }));
      state.player.credits = 0;
      state.bots = guesses.map(() => createBot());
      state.bots.forEach(bot => { bot.hp = bot.maxHp = 1000; });
      beginRound();
      state.roundState.target = 50;
      state.roundState.criticalInteger = 50;
      state.roundState.playerEffectiveGuess = 60;
      guesses.forEach((guess, index) => state.roundState.botEffectiveGuesses.set(state.bots[index].id, guess));
      Math.random = () => 0.99;
    }
    function assertDamage(expected) {
      assert.equal(JSON.stringify(state.bots.map(bot => bot.lastDamage)), JSON.stringify(expected));
    }
  `, context);
  return (code) => vm.runInContext(code, context);
}

// puts every conditional reveal SEAL in its "reveal" state: a winning 50% roll (Vine),
// a revealed DAMNED died last round (Naberius) and a DAMNED died last round (Seal of Cassiel (p102))
const REVEAL_CONDITIONS_MET = `
  state.player.hp = 40;
  state.previousRoundRevealedEliminations = 1;
  state.previousRoundEliminationsForMartyrs = 1;
  Math.random = () => 0.1;
`;

test("each reveal seal adds one reveal when its condition holds, independent of elite level, with a shared cap of four", () => {
  for (const id of ["p59", "p64", "p65", "p102"]) {
    game()(`
      ${REVEAL_CONDITIONS_MET}
      fixture([["${id}", 4]], [10, 20, 30, 40, 50]);
      assert.equal(revealedDamnedCount(), 2);
      applyGuessReveals();
      assert.equal(revealedDamnedCount(), 2);
    `);
  }
  game()(`
    ${REVEAL_CONDITIONS_MET}
    fixture([["p59"], ["p64"], ["p65"], ["p102"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 4);
    applyGuessReveals();
    assert.equal(revealedDamnedCount(), 4);
    state.bots.forEach(bot => queueMummifiedLambNextRoundReveal(bot));
    beginRound();
    assert.equal(revealedDamnedCount(), 4);
    const hidden = state.bots.find(bot => !bot.revealedByPassive);
    hidden.isBoss = true;
    queueMummifiedLambNextRoundReveal(hidden);
    applyPendingNextRoundLambReveals();
    assert.equal(hidden.revealedByPassive, false);
    assert.equal(revealedDamnedCount(), 4);
  `);
});

test("Lamb can reveal bosses below the cap and suppressed seals do not add reveals", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    const hidden = state.bots.find(bot => !bot.revealedByPassive);
    hidden.isBoss = true;
    queueMummifiedLambNextRoundReveal(hidden);
    applyPendingNextRoundLambReveals();
    assert.equal(hidden.revealedByPassive, true);
    assert.equal(revealedDamnedCount(), 2);
  `);
  game()(`
    fixture([["p64"]], [10, 20, 30, 40, 50]);
    state.bots[0].isBoss = true;
    state.bots[0].goeticPassiveId = "p64";
    beginRound();
    assert.equal(revealedDamnedCount(), 1);
  `);
});

test("new reveal text appears in saved-item and elite descriptions and the catalog", () => {
  const run = game();
  const catalog = fs.readFileSync(path.join(root, "ITEMS.txt"), "utf8");
  const prefixes = {
    p61: "The first time each round the leftmost or rightmost DAMNED is revealed, reveal one more DAMNED.",
    p64: "Each round, 50% chance to reveal one extra DAMNED.",
    p65: "If a revealed DAMNED died last round, reveal one extra DAMNED.",
    p102: "If a DAMNED died last round, reveal one extra DAMNED."
  };
  for (const [id, prefix] of Object.entries(prefixes)) {
    const item = run(`ITEMS.${id}`);
    assert.ok(catalog.includes(item.description));
    assert.ok(item.description.startsWith(prefix));
    for (const stack of [1, 2]) {
      assert.ok(run(`itemDescription({ ...ITEMS.${id}, stack: ${stack}, description: "Old description" })`).startsWith(prefix));
    }
  }
});

test("Red Horse and the Fourth Pentacle of Saturn (p95) no longer add reveals; Pyros and the Seal of Cassiel (p102) still do", () => {
  for (const id of ["p75", "p95"]) {
    game()(`
      fixture([["${id}", 3]], [10, 20, 30, 40, 50]);
      assert.equal(revealedDamnedCount(), 1);
      applyGuessReveals();
      assert.equal(revealedDamnedCount(), 1);
      assert.ok(!itemDescription({ ...ITEMS.${id}, stack: 1, description: "Old description" }).includes("Reveal one extra"));
      assert.ok(!itemDescription({ ...ITEMS.${id}, stack: 2 }).includes("Reveal one extra"));
    `);
  }
  game()(`
    state.previousRoundEliminationsForMartyrs = 1;
    fixture([["p75"], ["p95"], ["p102"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 2);
  `);
  game()(`
    fixture([["p123"]], [10, 20, 30, 40, 50]);
    const stacks = state.bots.reduce((sum, bot) => sum + revealStacks(bot), 0);
    assert.equal(stacks, 2);
  `);
  const catalog = fs.readFileSync(path.join(root, "ITEMS.txt"), "utf8");
  assert.ok(catalog.includes(game()("ITEMS.p75.description")));
  assert.ok(catalog.includes(game()("ITEMS.p95.description")));
});

test("boss kills heal 6 HP, normal kills heal 1, and healing respects max HP", () => {
  game()(`
    fixture([], [50, 50]);
    state.bots[0].isBoss = true;
    state.player.hp = 80;
    applyKillRuleHealing(state.bots[0]);
    assert.equal(state.player.hp, 86);
    assert.ok(state.roundState.roundEvents.includes("BOSS kill healed you for 6."));
    applyKillRuleHealing(state.bots[1]);
    assert.equal(state.player.hp, 87);
    state.player.hp = 98;
    applyKillRuleHealing(state.bots[0]);
    assert.equal(state.player.hp, 100);
    assert.ok(state.roundState.roundEvents.includes("BOSS kill healed you for 2."));
  `);
});

test("Threon rerolls a hidden multiplier between 0.6 and 1.0 each round", () => {
  game()(`
    fixture([], [50]);
    state.bots = [createBot({ boss: true, bossSpec: { uniqueKey: "threon" } })];
    const rolls = [0, 0.2, 0.4, 0.6, 0.999];
    const expected = [0.6, 0.7, 0.8, 0.9, 1];
    rolls.forEach((roll, index) => {
      Math.random = () => roll;
      beginRound();
      assert.equal(state.roundState.targetModifier, expected[index]);
      assert.ok(state.roundState.mysteryModifier);
      state.round++;
    });
  `);
});

test("Eligos uses native crit ranges, never mirrors, and pays per DAMNED critical", () => {
  const run = game();
  run(`
    fixture([["p128", 2]], [50, 51, 52, 40]);
    assert.equal(getParticipants()[2].window, 0);
    assert.equal(findCriticalHits().length, 1);
    assert.equal(findCriticalHits()[0].kind, "bot");
    assert.equal(criticalKeysForDisplay().has("player"), false);
    assert.equal(state.player.credits, 0);
    state.bots[2].buffPassiveKey = "wideCrit";
    assert.equal(getParticipants()[3].window, 2);
    assert.equal(findCriticalHits().length, 2);
    findCriticalHits().forEach(applyEligosCriticalReward);
    applyEligosCriticalReward({ kind: "player" });
    assert.equal(state.player.credits, 4);
    assert.equal(state.sealStats.p128.credits, 4);
  `);
});

test("Eligos pays once per critical in real resolution and preserves its protection", () => {
  game()(`
    fixture([["p128"]], [50, 50, 40, 50]);
    state.roundState.targetModifier = 1;
    applyPenalties();
    assert.equal(state.roundState.target, 50);
    assert.equal(state.roundState.criticalHitKeys.has("player"), false);
    assert.equal(state.player.credits, 3);
    assert.equal(state.playerDamageSources.some(source => source.source.startsWith("CRITICAL from")), false);
    assert.equal(state.stage, "summary");
  `);
});

test("Furfur adds matching divisors and applies normal elite rounding", () => {
  game()(`
    fixture([["p112"]], [9, 10, 14, 15, 21, 35, 0, 11]);
    applyEndOfRoundPassiveDamageInOrder();
    assertDamage([3, 7, 16, 8, 17, 19, 24, 0]);
    assert.equal(state.sealStats.p112.damage, 94);
  `);
  game()(`
    fixture([["p112", 3]], [15, 35, 0, NaN]);
    applyEndOfRoundPassiveDamageInOrder();
    assertDamage([20, 44, 57, 0]);
  `);
});

test("Halphas rolls both chances independently for every DAMNED including bosses", () => {
  game()(`
    fixture([["p113", 2]], [1, 2, 3, 4]);
    state.bots[2].isBoss = true;
    const rolls = [0.1, 0.01, 0.1, 0.9, 0.9, 0.099, 0.3, 0.1];
    let rollIndex = 0;
    Math.random = () => { assert.ok(rollIndex < rolls.length); return rolls[rollIndex++]; };
    applyEndOfRoundPassiveDamageInOrder();
    assert.equal(rollIndex, 8);
    assertDamage([23, 8, 15, 0]);
    assert.equal(state.sealStats.p113.damage, 46);
  `);
});

test("Buer pays only on strictly exceeding the cumulative threshold, resets each round", () => {
  game()(`
    fixture([["p114", 2]], [50]);
    const bot = state.bots[0];
    damageBot(bot, 100, "Artifact damage", "Artifact");
    damageBot(bot, 100, "Artifact damage", "Artifact");
    assert.equal(state.player.credits, 0);
    damageBot(bot, 1, "Artifact damage", "Artifact");
    assert.equal(state.player.credits, 3);
    damageBot(bot, 100, "Artifact damage", "Artifact");
    assert.equal(state.player.credits, 3);
    beginRound();
    damageBot(bot, 201, "Artifact damage", "Artifact");
    assert.equal(state.player.credits, 6);
    assert.equal(state.sealStats.p114.credits, 6);
  `);
});

test("Buer includes fatal hits and bosses without paying twice for split sources", () => {
  game()(`
    fixture([["p114"]], [50, 50]);
    const [bot, boss] = state.bots;
    boss.isBoss = true;
    bot.hp = 1;
    damageBots([bot, boss], 201, "Test damage", "Test");
    assert.equal(bot.eliminated, true);
    assert.equal(state.sealStats.p114.credits, 4);
    recordBotRoundDamage(boss, 201);
    assert.equal(state.sealStats.p114.credits, 4);
  `);
});

test("Botis includes exact TARGET and both +/-5 boundaries; rewards scale per target", () => {
  game()(`
    fixture([["p115", 2]], [45, 50, 55, 44, 56, NaN]);
    state.bots[1].isBoss = true;
    applyEndOfRoundPassiveDamageInOrder();
    assertDamage([6, 6, 6, 0, 0, 0]);
    assert.equal(state.player.credits, 9);
    assert.equal(state.sealStats.p115.damage, 18);
    assert.equal(state.sealStats.p115.credits, 9);
  `);
});

test("new seals obey matching-boss suppression and Beleth no longer applies", () => {
  for (const id of ["p112", "p113", "p114", "p115"]) {
    game()(`
      fixture([["${id}"]], [0]);
      state.bots[0].isBoss = true;
      state.bots[0].goeticPassiveId = "${id}";
      assert.equal(orderedPassiveEffectEntries("${id}").length, 0);
      applyEndOfRoundPassiveDamageInOrder();
      recordBotRoundDamage(state.bots[0], 201);
      assert.equal(state.player.credits, 0);
      assertDamage([0]);
    `);
  }
  game()(`
    fixture([["p62"]], [50]);
    assert.equal(state.player.passives.length, 0);
    state.player.passives.push({ ...ITEMS.p62, stack: 3 });
    assert.equal(passiveStack("p62"), 0);
    damageBot(state.bots[0], 1, "Test", "Test");
    assertDamage([1]);
    assert.equal(collectibleSealIds().includes("p62"), false);
  `);
});

test("new Goetic seals have valid unique names, images, elite help, and catalog entries", () => {
  const run = game();
  const catalog = fs.readFileSync(path.join(root, "ITEMS.txt"), "utf8");
  // the Goetic SEALS are exactly the 72 demons, each one once
  assert.equal(run("GOETIC_BOSS_PASSIVE_IDS.length"), 72);
  assert.equal(run("new Set(GOETIC_BOSS_PASSIVE_IDS.map(id => ITEMS[id].name)).size"), 72);
  assert.equal(run("GOETIC_BOSS_PASSIVE_IDS.some(id => SPECIAL_SEAL_IDS.has(id))"), false);
  for (const id of ["p128", "p112", "p113", "p114", "p115", "p116", "p117", "p118", "p119", "p120"]) {
    const item = run(`ITEMS.${id}`);
    assert.ok(catalog.includes(`${item.name} (${item.price} SIN)\n${item.description}`) ||
      catalog.includes(`${item.name} (${item.price} SIN)\r\n${item.description}`));
    assert.equal(run(`sealIdFromStatSource(ITEMS.${id}.name)`), id);
    assert.ok(run(`splitEliteDescription(ITEMS.${id}.description).elite`).length);
    assert.ok(run(`itemDescription({ ...ITEMS.${id}, stack: 2 })`).length);
    if (id === "p128") continue;
    assert.ok(run(`collectibleSealIds().includes("${id}") && !isSealLocked("${id}")`));
    const image = run(`sealSigilPath(ITEMS.${id})`);
    assert.ok(fs.existsSync(path.join(root, image)), image);
    assert.equal(run(`GOETIC_BOSS_SPECS.find(spec => spec.passiveId === "${id}").name`), item.name.replace("Seal of ", ""));
  }
});

test("saved rounds preserve Buer's paid threshold and Eligos shows its updated description", () => {
  game()(`
    fixture([["p114", 2]], [50]);
    damageBot(state.bots[0], 201, "Test", "Test");
    state.player.passives.push({ ...ITEMS.p62, stack: 1 });
    const saved = JSON.stringify(arcadeRunSaveSnapshot(), encodeArcadeSaveValue);
    Object.assign(state, JSON.parse(saved, decodeArcadeSaveValue));
    normalizeLoadedArcadeRun();
    pruneRemovedPassives();
    assert.equal(state.player.passives.length, 1);
    assert.equal(state.player.passives[0].stack, 2);
    damageBot(state.bots[0], 201, "Test", "Test");
    assert.equal(state.sealStats.p114.credits, 3);
    assert.equal(itemDescription({ ...ITEMS.p128, description: "Old Eligos effect", stack: 1 }), ITEMS.p128.description);
    assert.ok(renderShopSlot({ item: ITEMS.p62 }, 0).includes("Sold out"));
  `);
});

test("new damage resolves at round end with each seal attributed in the animation sequence", () => {
  game()(`
    fixture([["p112"], ["p113"], ["p114"], ["p115"]], [45, 50, 55]);
    assertDamage([0, 0, 0]);
    state.bots.forEach(bot => { bot.hp = bot.maxHp = 50; });
    const before = captureRoundRevealSnapshot();
    Math.random = () => 0.01;
    applyEndOfRoundPassives();
    assertDamage([27, 26, 24]);
    assert.equal(state.sealStats.p114.credits, 6);
    const sequence = buildRoundRevealSequence(before);
    for (const id of ["p112", "p113", "p114", "p115"]) {
      assert.ok(sequence.find(step => step.id === id)?.events.length);
    }
    assert.equal(state.player.credits, 12);
  `);
});

test("each boss gets a fresh random 8-10 kill interval, unaffected by round changes", () => {
  game()(`
    fixture([], [50]);
    state.uniqueBossQueue = ["zilon", "dantre", "pyros", "threon", "kalha"];
    const rolls = [0, 0.4, 0.7, 0.99, 0.5, 0.4];
    let rollIndex = 0;
    Math.random = () => rolls[rollIndex++];
    resetBossKillInterval();
    const intervals = [];
    for (let arrival = 0; arrival < 5; arrival++) {
      const interval = state.nextBossKillInterval;
      intervals.push(interval);
      state.round += 100;
      assert.equal(nextBossSpecIfNeeded(), null);
      for (let kill = 1; kill < interval; kill++) {
        state.killsSinceBossSpawn++;
        assert.equal(nextBossSpecIfNeeded(), null);
      }
      state.killsSinceBossSpawn++;
      assert.ok(nextBossSpecIfNeeded()?.uniqueKey);
      assert.equal(state.killsSinceBossSpawn, 0);
    }
    assert.equal(JSON.stringify(intervals), JSON.stringify([8, 9, 10, 10, 9]));
    assert.equal(rollIndex, 6);
  `);
});

test("the Pause menu shows who is bound for the run, or the sinner when nobody is", () => {
  game()(`
    fixture([], [50]);
    state.mode = "arcade";
    state.pauseOpen = true;
    state.pauseScreen = "main";
    state.boundDemon = null;
    let html = renderPauseMenu();
    assert.ok(html.includes("pause-bound is-unbound"));
    assert.ok(html.includes("The Sinner"));
    state.boundDemon = "bael";
    html = renderPauseMenu();
    assert.ok(html.includes("pause-bound is-bound"));
    assert.ok(html.includes(">Bael<") || html.includes("Bael<span"));
    assert.ok(html.includes(sealSigilPath(GOETIC_BOSS_BY_KEY.bael.passiveId)));
    state.boundDemon = "michael";
    html = renderPauseMenu();
    assert.ok(html.includes("Michael"));
    assert.ok(html.includes(sealSigilPath(ARCHANGEL_BY_KEY.michael.sealId)));
    state.mode = "pvp";
    assert.ok(!renderPauseMenu().includes("pause-bound"));
  `);
});

test("the living DAMNED never share art: a fresh DAMNED takes an image none of the others wears", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    let seed = 11;
    Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const distinct = () => new Set(state.bots.filter(bot => !bot.eliminated).map(bot => bot.image)).size;
    for (let tries = 0; tries < 100; tries += 1) {
      resetBotsForRun();
      assert.equal(distinct(), 5);
      // three die at once; one comes back with its own art (inherited), the other two are fresh
      const [comeback] = state.bots;
      comeback.eliminated = true;
      comeback.pendingReplacementInheritance = {
        name: comeback.name, flag: comeback.flag, country: comeback.country, type: comeback.type,
        anchor: comeback.anchor, aggression: comeback.aggression, noise: comeback.noise,
        color: comeback.color, image: comeback.image, memory: []
      };
      state.bots[2].eliminated = true;
      state.bots[4].eliminated = true;
      const keptImage = comeback.image;
      replacePendingEliminations();
      assert.equal(state.bots[0].image, keptImage);
      assert.equal(distinct(), 5);
    }
  `);
});

test("STUBBORN effects can make a BOSS STUBBORN for good, and every STUBBORN rule then counts it", () => {
  game()(`
    fixture([["p107"]], [10, 20, 30]);
    state.bots.forEach(bot => { bot.type = "Stubborn"; });
    const boss = createBot({ boss: true, bossSpec: { goeticKey: "bael" } });
    boss.hp = boss.maxHp = 1000;
    state.bots.push(boss);
    assert.equal(hasPersonality(boss, "Stubborn"), false);
    // a BOSS can only become STUBBORN: other personalities do nothing
    assert.equal(setBotPersonality(boss, "Analyst", "test"), false);
    // Seal of Ose picks a BOSS that is not STUBBORN yet when every DAMNED already is
    applyFixedWillEndRound();
    assert.equal(boss.stubborn, true);
    assert.deepEqual([...personalityTypes(boss)], ["Stubborn"]);
    assert.equal(setBotPersonality(boss, "Stubborn", "test"), false);
    // its guess is held within 2 of its last one like any STUBBORN DAMNED (Seal of Ose)
    boss.memory = [{ ownGuess: 50 }];
    assert.equal(clampFixedWillGuess(boss, 80), 52);
    // Seal of Bifrons never tries to give a BOSS another personality
    state.bots.forEach(bot => { if (!bot.isBoss) bot.type = "Analyst"; });
    state.player.passives = [{ ...ITEMS.p90, stack: 1 }];
    applyForcedDoctrineEndRound();
    assert.equal(boss.stubborn, true);
    // Jesus and Satan never turn STUBBORN
    const jesus = createFinalBoss("jesus");
    assert.equal(setBotPersonality(jesus, "Stubborn", "test"), false);
  `);
});

test("a pentakill queues only one boss and keeps remaining kills toward the next", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    state.uniqueBossQueue = ["zilon", "dantre", "threon"];
    state.nextBossKillInterval = 8;
    state.killsSinceBossSpawn = 7;
    state.bots.forEach(bot => { bot.hp = 0; });
    resolveEliminatedBots(state.bots);
    assert.equal(state.bots.filter(bot => bot.pendingReplacementSpec).length, 1);
    assert.equal(state.nextBossKillInterval, 10);
    assert.equal(state.killsSinceBossSpawn, 4);
    replacePendingEliminations();
    assert.equal(state.bots.filter(bot => bot.isBoss).length, 1);
  `);
});

test("random intervals preserve the first-eight gate, twin encounter, and final phase", () => {
  game()(`
    fixture([], [50, 50]);
    state.nextBossKillInterval = 8;
    state.killsSinceBossSpawn = 8;
    state.goeticBossQueue = ["bael"];
    state.bossKills = 7;
    assert.equal(nextBossSpecIfNeeded(), null);
    assert.equal(state.goeticBossQueue.length, 1);
    state.bossKills = 8;
    state.killsSinceBossSpawn = 10;
    assert.equal(nextBossSpecIfNeeded().goeticKey, "bael");
    state.uniqueBossQueue = ["petros"];
    state.killsSinceBossSpawn = state.nextBossKillInterval;
    const twins = nextBossSpecIfNeeded();
    assert.equal(twins.uniqueKey, "petros");
    assert.equal(twins.pairedBossSpec.uniqueKey, "pavlos");
    assert.equal(state.killsSinceBossSpawn, 0);
    state.bots[0].eliminated = true;
    state.bots[0].pendingReplacementSpec = twins;
    replacePendingEliminations();
    assert.equal(state.bots.filter(bot => bot.isBoss).length, 2);
    state.finalBossPhase = true;
    state.killsSinceBossSpawn = 100;
    assert.equal(nextBossSpecIfNeeded(), null);
  `);
});

test("saved runs keep the selected boss interval and old saves migrate without losing kills", () => {
  game()(`
    fixture([], [50]);
    state.nextBossKillInterval = 9;
    state.killsSinceBossSpawn = 6;
    const saved = JSON.stringify(arcadeRunSaveSnapshot(), encodeArcadeSaveValue);
    Object.assign(state, JSON.parse(saved, decodeArcadeSaveValue));
    normalizeLoadedArcadeRun();
    assert.equal(state.nextBossKillInterval, 9);
    assert.equal(state.killsSinceBossSpawn, 6);
    delete state.nextBossKillInterval;
    normalizeLoadedArcadeRun();
    assert.equal(state.nextBossKillInterval, 10);
    assert.equal(state.killsSinceBossSpawn, 6);
    normalizeLoadedArcadeRun();
    assert.equal(state.nextBossKillInterval, 10);
  `);
});

test("all playable artifact prices fall by one with a 2 SIN minimum and catalog parity", () => {
  const run = game();
  const oldPrices = { a6: 4, a7: 6, a8: 3, a9: 3, a10: 4, a11: 2, a12: 4,
    a14: 4, a15: 4, a18: 4, a21: 4, a22: 7, a23: 3, a25: 3, a28: 4 };
  const catalog = fs.readFileSync(path.join(root, "ITEMS.txt"), "utf8");
  assert.equal(run("ACTIVE_IDS.length"), Object.keys(oldPrices).length);
  for (const [id, oldPrice] of Object.entries(oldPrices)) {
    const item = run(`ITEMS.${id}`);
    assert.equal(item.price, Math.max(2, oldPrice - 1));
    assert.equal(run(`shopPrice(itemCopy("${id}"))`), item.price);
    assert.ok(catalog.includes(`${item.name} (${item.price} SIN)`));
  }
  run(`
    fixture([], [50]);
    state.player.actives = [{ ...ITEMS.a14, price: 4, purchaseCost: 4, sellValueOverride: 0 }];
    state.shop = [{ item: { ...ITEMS.a22, price: 7 }, sold: false }];
    normalizeLoadedArcadeRun();
    assert.equal(state.player.actives[0].price, 3);
    assert.equal(state.player.actives[0].purchaseCost, 4);
    assert.equal(state.player.actives[0].sellValueOverride, 0);
    assert.equal(shopPrice(state.shop[0].item), 6);
    assert.ok(itemDescription({ ...ITEMS.p113, description: "Old 5% chance", stack: 1 }).includes("10% chance"));
  `);
});

test("after the 8 unique bosses, bosses come every 4-8 KOs; KOs already counted are kept", () => {
  game()(`
    fixture([], [50]);
    state.bossKills = 7;
    resetBossKillInterval();
    assert.ok(state.nextBossKillInterval >= 8 && state.nextBossKillInterval <= 10);
    state.killsSinceBossSpawn = 5;
    state.bossKills = 8;
    const seen = new Set();
    let tick = 0;
    Math.random = () => ((tick++ * 0.37) % 1);
    for (let i = 0; i < 200; i++) {
      state.nextBossKillIntervalEndless = false;
      const interval = ensureBossKillInterval();
      assert.ok(interval >= 4 && interval <= 8, "endless interval " + interval);
      seen.add(interval);
    }
    assert.equal(seen.size, 5);
    assert.equal(state.killsSinceBossSpawn, 5);
    const kept = state.nextBossKillInterval;
    assert.equal(ensureBossKillInterval(), kept);
  `);
});

test("Petros and Pavlos can fall in the same round", () => {
  game()(`
    fixture([], [50, 50, 50, 50, 50]);
    const spec = uniqueBossSpecFromKey("petros");
    const petros = createBot({ boss: true, bossSpec: spec });
    const pavlos = createBot({ boss: true, bossSpec: spec.pairedBossSpec });
    state.bots[0] = petros;
    state.bots[1] = pavlos;
    damageBots([petros, pavlos], 100000, (bot, dealt) => bot.name + " took " + dealt, "Test");
    assert.equal(petros.eliminated, true);
    assert.equal(pavlos.eliminated, true);
    const borrowed = bossBorrowedPower(petros);
    assert.ok(borrowed && borrowed.name && !/TARGET modifier/i.test(borrowed.text));
    assert.ok(!botPassiveDescription(petros).includes("Borrowed"));
  `);
});

test("slaying a Goetic BOSS discovers its demon in the Ars Goetia, once, and only in arcade runs", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    const boss = state.bots[0];
    boss.isBoss = true;
    boss.goeticKey = "paimon";
    boss.hp = 0;
    assert.equal(isDemonSlain("paimon"), false);
    resolveEliminatedBots([boss]);
    assert.equal(isDemonSlain("paimon"), true);
    collectionSlayDemon("paimon");
    assert.equal(loadCollectionProgress().slain.filter(key => key === "paimon").length, 1);
    // a unique BOSS is not a demon
    const zilon = state.bots[1];
    zilon.isBoss = true;
    zilon.uniqueKey = "zilon";
    zilon.hp = 0;
    resolveEliminatedBots([zilon]);
    assert.deepEqual([...loadCollectionProgress().slain], ["paimon"]);
    state.mode = "pvp";
    collectionSlayDemon("bael");
    assert.equal(isDemonSlain("bael"), false);
    // the tab lists all 72 in book order; the ones not slain have no name
    const html = collectionDemonsHtml();
    assert.equal((html.match(/data-collection-demon=/g) || []).length, 72);
    assert.equal(html.split(">???<").length - 1, 71);
    assert.ok(html.indexOf('"bael"') < html.indexOf('"andromalius"'));
    assert.equal(romanNumeral(72), "LXXII");
  `);
});

test("SEAL records: a win goes to every SEAL in a slot, plus highest ELITE, triggers and amounts per run and round", () => {
  game()(`
    fixture([["p1", 4], ["p12"], ["p131"], ["p99"]], [10, 20, 30, 40, 50]);
    assert.equal(collectionCounts(), true);
    collectionRun().uniqueKills = [...UNIQUE_BOSS_KEYS];
    collectionNoteElimination({ isBoss: true, uniqueKey: "pavlos", name: "Pavlos" });
    assert.equal(sealRecord("p1").wins, 1);
    assert.equal(sealRecord("p131").wins, 1);
    assert.equal(isSealBeaten("p12"), true);
    assert.equal(isSealBeaten("p2"), false);
    assert.equal(isSealDiscovered("p12"), true);
    // more BOSS kills in the same run do not count the win again
    collectionNoteElimination({ isBoss: true, uniqueKey: "zilon", name: "Zilon" });
    assert.equal(sealRecord("p1").wins, 1);
    // highest ELITE, kept only for SEALS that can be upgraded
    collectionNoteSealElite();
    assert.equal(sealRecord("p1").elite, 3);
    assert.equal(sealRecord("p99").elite, 0);
    // amounts: lifetime total, most in one run, most in one round
    state.sealStats = {};
    state.round = 3;
    recordSealStat("p1", "damage", 40);
    recordSealStat("p1", "damage", 25);
    state.round = 4;
    recordSealStat("p1", "damage", 30);
    let record = sealRecord("p1");
    assert.deepEqual([record.total.damage, record.run.damage, record.round.damage], [95, 95, 65]);
    // next run: the totals keep adding, the bests stay until beaten
    state.sealStats = {};
    resetCollectionRun();
    state.round = 1;
    recordSealStat("p1", "damage", 50);
    assert.deepEqual([record.total.damage, record.run.damage, record.round.damage], [145, 95, 65]);
    recordSealTrigger("p1");
    recordSealTrigger("p1");
    assert.equal(record.triggers, 2);
    // PvP does not count
    state.mode = "pvp";
    recordSealStat("p1", "damage", 999);
    recordSealTrigger("p1");
    assert.equal(record.total.damage, 145);
    assert.equal(record.triggers, 2);
    state.mode = "arcade";
    // a personality changed by a SEAL is counted for that SEAL
    const bot = state.bots[0];
    assert.equal(setBotPersonality(bot, bot.type === "Stubborn" ? "Analyst" : "Stubborn", ITEMS.p14.name, { triggerAlterationDamage: false }), true);
    assert.equal(sealRecord("p14").total.personality, 1);
    // tooltip: the mark next to the status, the records with the ELITE in Roman numerals, the table
    const html = collectionInfoHtml("p1");
    assert.ok(html.includes("collection-beaten-mark"));
    assert.ok(html.includes(">III<"));
    assert.ok(html.includes("collection-record-table"));
    assert.ok(!collectionInfoHtml("p99").includes("Highest ELITE"));
    // what is saved reads back the same
    assert.deepEqual(normalizeSealRecord(JSON.parse(JSON.stringify(record))), record);
  `);
});

test("ELITE levels are written in Roman numerals in SEAL names", () => {
  game()(`
    assert.equal(passiveDisplayName({ ...ITEMS.p16, stack: 1 }), ITEMS.p16.name);
    assert.equal(passiveDisplayName({ ...ITEMS.p16, stack: 2 }), "ELITE I " + ITEMS.p16.name);
    assert.equal(passiveDisplayName({ ...ITEMS.p16, stack: 5 }), "ELITE IV " + ITEMS.p16.name);
    assert.equal(romanNumeral(99), "XCIX");
  `);
});

test("every collection SEAL has at least one known build tag", () => {
  game()(`
    const keys = new Set(SEAL_BUILDS.map(build => build.key));
    const ids = collectionSections().flatMap(section => section.ids);
    assert.equal(ids.length, 118);
    for (const id of ids) {
      assert.ok(Array.isArray(SEAL_BUILD_TAGS[id]) && SEAL_BUILD_TAGS[id].length, id + " has no build tag");
      for (const key of SEAL_BUILD_TAGS[id]) assert.ok(keys.has(key), id + " has unknown build " + key);
    }
    for (const id of Object.keys(SEAL_BUILD_TAGS)) assert.ok(ids.includes(id), id + " is tagged but not in the collection");
    assert.ok(sealMatchesCollectionFilter("p59", "reveal") && sealMatchesCollectionFilter("p59", "bounty"));
    assert.ok(!sealMatchesCollectionFilter("p45", "bounty"));
    assert.ok(sealMatchesCollectionFilter("p45", "all"));
  `);
});

test("Vial of Blood copies only the first DAMNED's PERSONALITY", () => {
  game()(`
    fixture([], [50, 50, 50]);
    globalThis.render = () => {};
    globalThis.playGameSfx = () => {};
    globalThis.playSfx = () => {};
    globalThis.playArtifactSfx = () => {};
    const [first, second] = state.bots;
    setBotPersonality(first, "Stubborn", "", { triggerAlterationDamage: false });
    setBotPersonality(second, "Analyst", "", { triggerAlterationDamage: false });
    first.passiveKeys = ["soulStealing"];
    second.passiveKeys = [];
    state.player.actives = [{ ...ITEMS.a11, uid: "vial-1" }];
    state.pendingActive = { index: 0, uid: "vial-1", id: "a11", mode: "bot", step: "damage" };
    resolveBloodVial(first);
    resolveBloodVial(second);
    assert.equal(personalityType(first), "Stubborn");
    assert.equal(personalityType(second), "Stubborn");
    assert.deepEqual(second.passiveKeys, []);
    assert.ok(itemDescription(ITEMS.a11).includes("PERSONALITY"));
  `);
});

test("Corruption shows the changed guess: the effective guess and what was typed are remembered", () => {
  game()(`
    fixture([], [50, 50]);
    state.bots[0].passiveKeys = ["corruption"];
    const rolls = [0.1, 0.9];
    Math.random = () => rolls.length ? rolls.shift() : 0.99;
    const mutated = applyCorruptionGuessMutation(27);
    assert.equal(mutated, 37);
    assert.equal(state.roundState.playerCorruption.from, 27);
    assert.equal(state.roundState.playerCorruption.to, 37);
    Math.random = () => 0.99;
    assert.equal(applyCorruptionGuessMutation(27), 27);
    assert.equal(state.roundState.playerCorruption, null);
  `);
});

test("Seal of Satan costs 20 SIN and the Seal of Raphael (p101) stacks +20 per PENTAKILL", () => {
  game()(`
    assert.equal(ITEMS.p111.price, 20);
    assert.equal(SELF_STACKING_SEAL_SPECS.p101.increment, 20);
    assert.ok(ITEMS.p101.description.includes("+20 damage"));
  `);
});

test("Seal of Raphael (p101): PENTAKILL damage waits for the NEXT end of round and hits the new DAMNED", () => {
  const run = game();
  run(`
    fixture([["p101"]], [10, 20, 30, 40, 50]);
    state.bots.forEach(bot => { bot.hp = 1; });
    state.roundState.eliminationsThisRound = 5;
    checkRoundPentakillBonus();
    assert.equal(state.pendingSelfStackingPentakillDamage, 20);
    // the PENTAKILL round's own end of round: everyone is dead, the damage must not be lost
    state.bots.forEach(bot => { bot.hp = 0; bot.eliminated = true; });
    applyEndOfRoundPassives();
    assert.equal(state.pendingSelfStackingPentakillDamage, 20);
    // next round: fresh DAMNED
    state.round += 1;
    state.bots = [1, 2, 3, 4, 5].map(() => createBot());
    state.bots.forEach(bot => { bot.hp = bot.maxHp = 1000; });
    applyPendingSelfStackingPentakillDamage();
    assert.equal(state.pendingSelfStackingPentakillDamage, 0);
    assert.deepEqual(state.bots.map(bot => bot.hp), [980, 980, 980, 980, 980]);
  `);
});

test("Sallos: 3+ eliminations spread 20 damage over the survivors (ELITE x1.5), all onto a BOSS if one lives", () => {
  for (const [stack, total] of [[1, 20], [2, 30], [3, 45]]) {
    game()(`
      fixture([["p71", ${stack}]], [10, 20, 30, 40, 50]);
      state.roundState.eliminationsThisRound = 2;
      applySallosEliminationSpread();
      assertDamage([0, 0, 0, 0, 0]);
      state.bots[0].hp = state.bots[1].hp = state.bots[2].hp = 0;
      state.bots[0].eliminated = state.bots[1].eliminated = state.bots[2].eliminated = true;
      state.roundState.eliminationsThisRound = 3;
      applySallosEliminationSpread();
      assert.equal(state.bots[3].lastDamage + state.bots[4].lastDamage, ${total});
      applySallosEliminationSpread();
      assert.equal(state.bots[3].lastDamage + state.bots[4].lastDamage, ${total});
    `);
  }
  game()(`
    fixture([["p71"]], [10, 20, 30, 40, 50]);
    state.bots[4].isBoss = true;
    state.bots.slice(0, 3).forEach(bot => { bot.hp = 0; bot.eliminated = true; });
    state.roundState.eliminationsThisRound = 3;
    applySallosEliminationSpread();
    assert.equal(state.bots[4].lastDamage, 20);
    assert.equal(state.bots[3].lastDamage || 0, 0);
  `);
});

test("Shop and Collection descriptions hide ELITE scaling; the equipped tooltip keeps it for Shift", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    assert.equal(descriptionWithoutElite(ITEMS.p71.description).includes("ELITE"), false);
    for (const id of PASSIVE_IDS.filter(id => ITEMS[id])) {
      for (const stack of [1, 2]) {
        const text = descriptionWithoutElite(itemDescription({ ...ITEMS[id], stack }));
        assert.ok(text.length > 0, id);
        assert.equal(/(^|[.!?]\\s)ELITE\\b/.test(text), false, id + " " + text);
      }
    }
    // Kalha says "an ELITE upgrade" mid-sentence: that is its main text, not an ELITE scaling note
    assert.equal(splitEliteDescription(ITEMS.p122.description).main, ITEMS.p122.description);
    const html = renderSealTooltipHtml({ ...ITEMS.p71, stack: 2 }, "x", itemDescription({ ...ITEMS.p71, stack: 2 }), "", 1);
    assert.ok(html.includes("tooltip-elite-line"));
    assert.ok(html.includes("ELITE"));
  `);
});

// player 60 vs DAMNED 49, 47, 30, 70, 100 with modifier 1: TARGET 60, only you hit CRITICAL
const CRIT_TABLE = "[49, 47, 30, 70, 100]";
function critRound(passives, extra = "") {
  return `
    fixture(${passives}, ${CRIT_TABLE});
    state.roundState.targetModifier = 1;
    state.roundState.playerEffectiveGuess = 60;
    ${extra}
    applyPenalties();
    assert.equal(state.roundState.target, 60);
    assert.ok(state.roundState.criticalHitKeys.has("player"));
  `;
}

test("Beleth: your CRITICAL hits the 2 DAMNED with the best guesses for 10 extra", () => {
  const base = game();
  base(critRound("[]"));
  const without = JSON.parse(base("JSON.stringify(state.bots.map(bot => bot.lastDamage))"));
  for (const [stack, extra] of [[1, 10], [2, 15]]) {
    const run = game();
    run(critRound(`[["p116", ${stack}]]`));
    const withSeal = JSON.parse(run("JSON.stringify(state.bots.map(bot => bot.lastDamage))"));
    assert.deepEqual(withSeal.map((value, index) => value - without[index]), [extra, 0, 0, extra, 0]);
  }
});

test("Shax: in a round you hit CRITICAL, every DAMNED that dies pays 2 extra SIN", () => {
  const run = game();
  run(critRound(`[["p117"]]`, "state.bots[2].hp = 1;"));
  run(`
    assert.ok(state.bots[2].eliminated);
    assert.equal(state.sealStats.p117.credits, 2);
  `);
  const quiet = game();
  quiet(`
    fixture([["p117"]], [50, 50, 50]);
    state.roundState.criticalHitKeys = new Set();
    state.bots[0].hp = 0;
    resolveEliminatedBots([state.bots[0]]);
    assert.equal(state.sealStats.p117?.credits || 0, 0);
  `);
});

test("Malphas: 2 damage per round alive, counting the current round", () => {
  game()(`
    fixture([["p118"]], [11, 13, 17]);
    state.round = 3;
    state.bots[0].spawnRound = 1;
    state.bots[1].spawnRound = 3;
    state.bots[2].spawnRound = 2;
    applyEndOfRoundPassiveDamageInOrder();
    assertDamage([6, 2, 4]);
  `);
  game()(`
    fixture([["p118", 2]], [11, 13]);
    state.round = 3;
    state.bots[0].spawnRound = 1;
    state.bots[1].spawnRound = 3;
    applyEndOfRoundPassiveDamageInOrder();
    assertDamage([9, 3]);
  `);
});

test("Eligos: an exact guess at reveal charges the next CRITICAL to 20%, ELITE pays 5 SIN per level", () => {
  game()(`
    fixture([["p119", 2]], [50]);
    state.roundState.target = 50;
    state.roundState.playerEffectiveGuess = 51;
    assert.equal(applyEligosExactGuess(), false);
    assert.equal(state.exactGuessCritCharged, false);
    state.roundState.playerEffectiveGuess = 50;
    assert.equal(applyEligosExactGuess(), true);
    assert.equal(state.exactGuessCritCharged, true);
    assert.equal(state.player.credits, 5);
  `);
  const plain = game();
  plain(critRound(`[["p119"]]`));
  const charged = game();
  charged(critRound(`[["p119"]]`, "state.exactGuessCritCharged = true;"));
  const before = JSON.parse(plain("JSON.stringify(state.bots.map(bot => bot.lastDamage))"));
  const after = JSON.parse(charged("JSON.stringify(state.bots.map(bot => bot.lastDamage))"));
  // max SOUL 1000: the CRITICAL goes from 100 to 200
  assert.deepEqual(after.map((value, index) => value - before[index]), [100, 100, 100, 100, 100]);
  assert.equal(charged("state.exactGuessCritCharged"), false);
});

test("Sitri: the most-MEMORY DAMNED gets double SOUL, gains MEMORY, and only a death passes it on", () => {
  game()(`
    fixture([["p120"]], [50, 50, 50]);
    // the round start already picked a host among equals; start over with MEMORY that decides it
    assert.ok(sitriHost());
    state.bots.forEach(bot => { bot.sitriHost = false; bot.hp = bot.maxHp = 1000; });
    state.round = 10;
    state.bots[1].memory = initialMemoryEntries(3);
    state.bots[2].memory = initialMemoryEntries(1);
    const host = ensureSitriHost();
    assert.equal(host, state.bots[1]);
    assert.equal(host.maxHp, 2000);
    assert.equal(host.hp, 2000);
    assert.equal(ensureSitriHost(), null);
    assert.equal(state.bots[1].maxHp, 2000);
    applySitriHostMemory();
    assert.equal(state.bots[1].memory.length, 4);
    state.bots[1].hp = 0;
    resolveEliminatedBots([state.bots[1]]);
    assert.equal(sitriHost(), state.bots[2]);
    assert.equal(state.bots[2].maxHp, 2000);
    assert.equal(state.bots[0].maxHp, 1000);
  `);
});

// ---- Boss SEALS (p121-p128) ----
test("Zilon converts 40% of a BOSS BOUNTY to its BOUNTY (+5% per ELITE level) and spreads the rest", () => {
  for (const [stack, converted] of [[1, 8], [3, 10]]) {
    game()(`
      fixture([["p121", ${stack}]], [50, 50, 50]);
      const boss = state.bots[0];
      boss.isBoss = true;
      boss.bossBountyConverted = 0;
      boss.bossBountyFactor = 1;
      state.bossKills = 0;
      const before = state.bots.map(bot => bot.reward);
      assert.equal(botBossBounty(boss), 20);
      applyZilonBossBounty();
      assert.equal(boss.reward - before[0], ${converted});
      const spread = state.bots.slice(1).reduce((sum, bot, index) => sum + bot.reward - before[index + 1], 0);
      assert.equal(spread, 20 - ${converted});
      assert.equal(botBossBounty(boss), 0);
      applyZilonBossBounty();
      assert.equal(boss.reward - before[0], ${converted});
    `);
  }
});

test("Kalha upgrades a random upgradable SEAL on every PENTAKILL and cannot be upgraded itself", () => {
  game()(`
    fixture([["p122"], ["p74"]], [50, 50, 50, 50, 50]);
    state.roundState.eliminationsThisRound = BOT_COUNT;
    checkRoundPentakillBonus();
    assert.equal(state.player.passives.find(item => item.id === "p74").stack, 2);
    assert.equal(state.player.passives.find(item => item.id === "p122").stack, 1);
    assert.equal(isNonUpgradableSeal("p122"), true);
    state.roundState.pentakillAwarded = false;
    checkRoundPentakillBonus();
    assert.equal(state.player.passives.find(item => item.id === "p74").stack, 3);
  `);
});

test("Pyros reveals a DAMNED at round start and lets reveals stack, which multiplies reveal effects", () => {
  game()(`
    fixture([["p123"]], [10, 20, 30, 40, 50]);
    assert.ok(revealedDamnedCount() >= 1);
    const bot = state.bots.find(candidate => candidate.revealedByPassive);
    const before = bot.revealStacks;
    revealBotGuess(bot, "Test");
    assert.equal(bot.revealStacks, before + 1);
    assert.equal(revealMultiplicity(bot), bot.revealStacks);
  `);
  game()(`
    fixture([["p64"]], [10, 20, 30, 40, 50]);
    const bot = state.bots.find(candidate => candidate.revealedByPassive);
    revealBotGuess(bot, "Test");
    assert.equal(bot.revealStacks, 1);
    assert.equal(revealMultiplicity(bot), 1);
  `);
});

test("Padma makes every DAMNED bipolar: averaged guess, one-part personality changes, doubled personalities count twice", () => {
  game()(`
    fixture([["p124"]], [10, 20, 30]);
    state.bots.forEach(bot => assert.ok(bot.type2, "bipolar"));
    const bot = state.bots[0];
    bot.type = "Analyst";
    bot.type2 = "Stubborn";
    assert.equal(JSON.stringify(personalityTypes(bot)), JSON.stringify(["Analyst", "Stubborn"]));
    assert.equal(hasPersonality(bot, "Analyst"), true);
    assert.equal(personalityCount(bot, "Stubborn"), 1);
    planPersonaGuess = (target, persona) => (persona.type === "Analyst" ? 20 : 41);
    assert.equal(planBotGuess(bot), 31);
    setBotPersonality(bot, "Stubborn", "Test");
    assert.equal(bot.type, "Stubborn");
    assert.equal(bot.type2, "Stubborn");
    assert.equal(personalityCount(bot, "Stubborn"), 2);
    assert.equal(setBotPersonality(bot, "Stubborn", "Test"), false);
    setBotPersonality(bot, "Follower", "Test");
    assert.equal(bot.type, "Follower");
    assert.equal(bot.type2, "Stubborn");
  `);
  game()(`
    fixture([], [10, 20, 30]);
    assert.equal(state.bots.some(bot => bot.type2), false);
    assert.equal(personalityTypes(state.bots[0]).length, 1);
  `);
});

test("Petros and Pavlos converts half of gained MEMORY and BOUNTY without reconverting, ELITE adds more", () => {
  game()(`
    fixture([["p125"]], [50, 50]);
    state.round = 10;
    const bot = state.bots[0];
    const rewardBefore = bot.reward;
    const memoryBefore = bot.memory.length;
    addBotMemory(bot, 4, "Test");
    assert.equal(bot.memory.length - memoryBefore, 2);
    assert.equal(bot.reward - rewardBefore, 2);
  `);
});

test("Serafeim adds ARTIFACT uses and inventory slots like Valac did", () => {
  game()(`
    fixture([], [50]);
    const base = [activeInventoryLimit(), activeUseLimit()];
    fixture([["p126"]], [50]);
    assert.equal(activeInventoryLimit(), base[0] + 1);
    assert.equal(activeUseLimit(), base[1] + 1);
    fixture([["p126", 3]], [50]);
    assert.equal(activeInventoryLimit(), base[0] + 3);
  `);
});

test("Threon keeps MEMORY beyond the limit visible, then removes it at round end for 10 damage each", () => {
  game()(`
    fixture([["p127"]], [50, 50]);
    state.round = 3;
    const bot = state.bots[0];
    bot.memory = [];
    const hp = bot.hp;
    addBotMemory(bot, 5, "Test");
    assert.equal(bot.memory.length, botMemoryLimit(bot));
    assert.equal(bot.memoryOverflow, 5 - botMemoryLimit(bot));
    const overflow = bot.memoryOverflow;
    applyMemoryOverflowDamage();
    assert.equal(bot.memoryOverflow, 0);
    assert.equal(hp - bot.hp, overflow * 4);
    const boss = state.bots[1];
    boss.isBoss = true;
    boss.memory = [];
    addBotMemory(boss, 6, "Test");
    assert.equal(boss.memory.length, botMemoryLimit(boss));
    assert.ok(boss.memoryOverflow > 0);
  `);
});

test("MEMORY limit is the rounds finished for DAMNED and BOSSES alike, with no cap of 20", () => {
  game()(`
    fixture([], [50, 50]);
    state.round = 3;
    const bot = state.bots[0];
    const boss = state.bots[1];
    boss.isBoss = true;
    assert.equal(botMemoryLimit(bot), 2);
    assert.equal(botMemoryLimit(boss), 2);
    boss.memory = [];
    addBotMemory(boss, 1, "Test");
    addBotMemory(boss, 1, "Test");
    assert.equal(addBotMemory(boss, 1, "Test"), 0);
    assert.equal(boss.memory.length, 2);
    assert.equal(boss.memoryOverflow || 0, 0);
    state.roundState.memoryRecorded = true;
    assert.equal(botMemoryLimit(boss), 3);
    state.round = 31;
    state.roundState.memoryRecorded = false;
    bot.memory = [];
    addBotMemory(bot, 30, "Test");
    assert.equal(bot.memory.length, 30);
  `);
});

test("Threon: a BOSS gaining MEMORY before round 3 ends keeps 2 and shows +1 excess", () => {
  game()(`
    fixture([["p127"]], [50, 50]);
    state.round = 3;
    const boss = state.bots[1];
    boss.isBoss = true;
    boss.memory = [{}, {}];
    addBotMemory(boss, 1, "Test");
    assert.equal(boss.memory.length, 2);
    assert.equal(boss.memoryOverflow, 1);
  `);
});

test("Threon: excess from Bathin when the round is recorded carries over and is damaged next round", () => {
  game()(`
    fixture([["p127"], ["p15"]], [50, 50]);
    state.round = 3;
    const bot = state.bots[0];
    bot.memory = [{}, {}];
    rememberRound();
    assert.equal(bot.memory.length, 3);
    assert.equal(bot.memoryOverflow, 1);
    globalThis.__hpAfterRecord = bot.hp;
    state.round += 1;
    beginRound();
    assert.equal(bot.memoryOverflow, 1);
    const hp = bot.hp;
    applyMemoryOverflowDamage();
    assert.equal(bot.memoryOverflow, 0);
    assert.equal(hp - bot.hp, 4);
  `);
});

test("Dantre pays SIN for DAMNED CRITICAL, shields you from it and counts it as your CRITICAL", () => {
  game()(`
    fixture([["p128"]], [50, 50, 40, 50]);
    state.roundState.targetModifier = 1;
    applyPenalties();
    assert.equal(state.player.credits > 0, true);
    assert.equal(state.playerDamageSources.some(source => source.source.startsWith("CRITICAL from")), false);
  `);
});

// ---- Gusion and Valac (new Goetic SEALS p129, p130) ----
test("Gusion lets BOSSES be revealed and hits every revealed DAMNED when one is (x1.5 per ELITE level)", () => {
  for (const [stack, damage] of [[1, 30], [2, 45]]) {
    game()(`
      fixture([["p129", ${stack}]], [10, 20, 30, 40, 50]);
      assert.equal(bossRevealAllowedBySeals(), true);
      state.bots.forEach(bot => { bot.revealedByPassive = false; bot.revealStacks = 0; });
      state.roundState.bossRevealEvents = 0;
      const boss = state.bots[0];
      boss.isBoss = true;
      assert.equal(revealBotGuess(boss, "Test"), true);
      assert.equal(state.roundState.bossRevealEvents, 1);
      revealBotGuess(state.bots[1], "Test");
      assert.equal(state.roundState.bossRevealEvents, 1);
      applyEndOfRoundPassiveDamageInOrder();
      assert.equal(state.bots[0].lastDamage, ${damage});
      assert.equal(state.bots[1].lastDamage, ${damage});
      assert.equal(state.bots[2].lastDamage || 0, 0);
    `);
  }
  game()(`
    fixture([], [10, 20]);
    assert.equal(bossRevealAllowedBySeals(), false);
  `);
  const run = game();
  assert.ok(fs.readFileSync(path.join(root, "ITEMS.txt"), "utf8").includes(run("ITEMS.p129.description")));
  assert.ok(run(`itemDescription({ ...ITEMS.p129, stack: 1, description: "Old description" })`).includes("take 30 damage"));
  assert.ok(run(`itemDescription({ ...ITEMS.p129, stack: 2 })`).includes("take 45 damage"));
});

test("Valac eliminates a lone non-BOSS survivor after 4 eliminations and pays +2 SIN per ELITE level on PENTAKILLS", () => {
  game()(`
    fixture([["p130"]], [10, 20, 30, 40, 50]);
    const round = state.roundState;
    state.bots.slice(0, 4).forEach(bot => { bot.hp = 0; });
    resolveEliminatedBots(state.bots.slice(0, 4));
    assert.equal(state.bots[4].eliminated, true);
    assert.equal(round.eliminationsThisRound, 5);
    assert.equal(round.pentakillAwarded, true);
  `);
  game()(`
    fixture([["p130"]], [10, 20, 30, 40, 50]);
    state.bots[4].isBoss = true;
    state.bots.slice(0, 4).forEach(bot => { bot.hp = 0; });
    resolveEliminatedBots(state.bots.slice(0, 4));
    assert.equal(state.bots[4].eliminated, false);
  `);
  game()(`
    fixture([["p130", 3]], [10, 20, 30, 40, 50]);
    const before = state.player.credits;
    state.roundState.eliminationsThisRound = BOT_COUNT;
    checkRoundPentakillBonus();
    assert.ok(state.player.credits - before >= 8 + 4);
    assert.equal(state.sealStats.p130.credits, 4);
  `);
});

// ---- worst guess penalty is 10% max SOUL; new Vepar ----
test("the worst guess penalty is 10% of max SOUL", () => {
  game()(`
    fixture([], [60, 60, 60, 60, 0]);
    state.roundState.targetModifier = 1;
    state.roundState.playerEffectiveGuess = 60;
    state.player.hp = state.player.maxHp = 200;
    applyPenalties();
    assert.equal(state.roundState.target, 50);
    assertDamage([10, 10, 10, 10, 150]);
  `);
});

// clears the round's reveals (fixture's beginRound already revealed one) so a test places them itself
const CLEAR_REVEALS = `
  state.bots.forEach(bot => { bot.revealedByPassive = false; bot.revealStacks = 0; bot.lastDamage = 0; });
  state.roundState.veparEdgeReveals = {};
`;

test("Vepar: revealed DAMNED take 8 damage per adjacent revealed DAMNED at end of round (ELITE x1.5)", () => {
  for (const [stack, per] of [[1, 8], [2, 12], [3, 18]]) {
    game()(`
      fixture([["p61", ${stack}]], [10, 20, 30, 40, 50]);
      ${CLEAR_REVEALS}
      state.roundState.veparEdgeReveals = { p61: true };
      revealBotGuess(state.bots[0]);
      revealBotGuess(state.bots[1]);
      revealBotGuess(state.bots[2]);
      revealBotGuess(state.bots[4]);
      assert.equal(revealedDamnedCount(), 4);
      applyEndOfRoundPassiveDamageInOrder();
      assertDamage([${per}, ${per * 2}, ${per}, 0, 0]);
      assert.equal(sealStatsFor("p61").triggers > 0, true);
    `);
  }
  game()(`
    fixture([["p61"]], [10, 20, 30, 40, 50]);
    ${CLEAR_REVEALS}
    state.roundState.veparEdgeReveals = { p61: true };
    revealBotGuess(state.bots[0]);
    revealBotGuess(state.bots[2]);
    applyEndOfRoundPassiveDamageInOrder();
    assertDamage([0, 0, 0, 0, 0]);
  `);
});


// ---- Trinity SEALS: Father p131, Son p132, Holy Spirit p133 ----
const TRINITY_STUBS = `
  globalThis.render = () => {};
  globalThis.playGameSfx = () => {};
  globalThis.quietMomentSfx = () => {};
  globalThis.performance = { now: () => 0 };
`;

test("Trinity SEALS share one slot, merge when slots are full, and sell together", () => {
  game()(`
    ${TRINITY_STUBS}
    fixture([["p131"], ["p1"], ["p2"]], [50]);
    assert.equal(ownedSealSlotCount(), 3);
    assert.equal(passiveLimit(), 3);
    assert.equal(hasSealSlotRoomFor(ITEMS.p133), true);
    assert.equal(hasSealSlotRoomFor("p132"), true);
    assert.equal(hasSealSlotRoomFor(ITEMS.p6), false);
    state.player.passives.push(itemCopy("p133"));
    assert.equal(ownedSealSlotCount(), 3);
    assert.equal(trinitySlotArtPath(), "assets/seals/trinity/father-spirit.png");
    const html = renderPassives();
    assert.equal((html.match(/trinity-seal-slot/g) || []).length, 1);
    assert.ok(html.includes("father-spirit.png"));
    assert.equal((html.match(/empty-seal-slot-image/g) || []).length, 0);
    state.player.passives.push(itemCopy("p132"));
    assert.equal(trinitySlotArtPath(), "assets/seals/trinity/trinity.png");
    assert.equal(ownedSealSlotCount(), 3);
    state.player.credits = 0;
    sellPassive(state.player.passives.findIndex(item => item.id === "p133"));
    assert.equal(ownedTrinitySeals().length, 0);
    assert.deepEqual(state.player.passives.map(item => item.id), ["p1", "p2"]);
    assert.equal(state.player.credits, 48);
  `);
});

test("Trinity SEALS cost 33, cannot be ELITE, have art for every set, and are in the catalog", () => {
  const run = game();
  const catalog = fs.readFileSync(path.join(root, "ITEMS.txt"), "utf8").replace(/\r\n/g, "\n");
  for (const id of ["p131", "p132", "p133"]) {
    const item = run(`ITEMS.${id}`);
    assert.equal(item.price, 33);
    assert.ok(run(`isNonUpgradableSeal("${id}")`));
    assert.ok(catalog.includes(`${item.name} (33 SIN)\n${item.description}`), item.name);
    assert.equal(run(`sealIdFromStatSource(ITEMS.${id}.name)`), id);
    assert.ok(run(`collectibleSealIds().includes("${id}") && isSealLocked("${id}") && SEAL_UNLOCKS["${id}"].gift === true`)); // only Jesus' Gifts unlock it
    assert.ok(fs.existsSync(path.join(root, run(`sealSigilPath("${id}")`))));
  }
  for (const file of Object.values(run("TRINITY_SEAL_ART"))) {
    assert.ok(fs.existsSync(path.join(root, "assets/seals", file)), file);
  }
  run(`
    fixture([["p131"]], [50]);
    const offered = new Set();
    for (let i = 0; i < 400; i += 1) offered.add(drawPassiveShopItem(false, true).item.id);
    assert.equal(offered.has("p131"), false);
  `);
});

test("Father: % TARGET difference uses max SOUL, BOSSES included", () => {
  const damage = (blessing) => {
    const run = game();
    run(`
      fixture([["p131"]], [40, 50, 60]);
      state.bots[2].isBoss = true;
      state.roundState.targetModifier = 1;
      state.roundState.trinity = { father: ${JSON.stringify(blessing)} };
      applyTrinityAtReady = () => {};
      applyPenalties();
      assert.equal(state.roundState.target, 53);
    `);
    return JSON.parse(run("JSON.stringify(state.bots.map(bot => bot.lastDamage))"));
  };
  const flat = damage(null);
  const percent = damage("percent");
  // differences 13, 3, 7: flat damage becomes 13%, 3%, 7% of 1000 max SOUL
  assert.deepEqual(percent.map((value, index) => value - flat[index]), [117, 27, 63]);
});

test("Father: double damage doubles what you deal, the 20% strike hits one DAMNED at end of round", () => {
  const base = game();
  base(critRound("[]"));
  const without = JSON.parse(base("JSON.stringify(state.bots.map(bot => bot.lastDamage))"));
  const run = game();
  run(critRound(`[["p131"]]`, `state.roundState.trinity = { father: "double" }; applyTrinityAtReady = () => {};`));
  const doubled = JSON.parse(run("JSON.stringify(state.bots.map(bot => bot.lastDamage))"));
  // your CRITICAL (10% of 1000) is doubled; TARGET difference is not damage you deal
  assert.deepEqual(doubled.map((value, index) => value - without[index]), [100, 100, 100, 100, 100]);
  game()(`
    fixture([["p131"]], [50, 50]);
    state.bots[1].isBoss = true;
    state.roundState.trinity = { father: "strike" };
    Math.random = () => 0.99;
    applyEndOfRoundPassives();
    assertDamage([0, 200]);
    assert.ok(state.roundState.triggeredPassiveIds.has("p131"));
  `);
});

test("Son: double SIN from every source but sales, +8 SIN, free rerolls keep the reroll price", () => {
  game()(`
    ${TRINITY_STUBS}
    fixture([], [50]);
    state.player.passives.push(itemCopy("p132"));
    state.roundState.trinity = { son: "doubleSin" };
    state.player.credits = 0;
    assert.equal(gainCredits(5, true, "Bounty"), 10);
    assert.equal(gainCredits(3, false, "PENTAKILL"), 6);
    assert.equal(gainCredits(4, false, "Sold Seal of Bael"), 4);
    assert.equal(state.player.credits, 20);
    assert.equal(state.sealStats.p132.credits, 8);
    state.roundState.trinity = { son: null };
    applyTrinitySonBlessing("sin");
    assert.equal(state.player.credits, 28);
    state.freeRerolls = 0;
    applyTrinitySonBlessing("rerolls");
    assert.equal(state.freeRerolls, 4);
    assert.equal(currentRerollCost(), 0);
    state.rerollBaseCost = 3;
    rerollShopClick();
    assert.equal(state.freeRerolls, 3);
    assert.equal(state.rerollBaseCost, 3);
    assert.equal(state.player.credits, 28);
    state.freeRerolls = 0;
    assert.equal(currentRerollCost(), 3);
  `);
});

test("Holy Spirit: each of its ten effects does what it says", () => {
  const outcome = (key, setup, check) =>
    game()(`
      ${TRINITY_STUBS}
      fixture([], [10, 20, 30, 40, 50]);
      state.player.passives.push(itemCopy("p133"));
      state.round = 30;
      state.bots.forEach(bot => { bot.memory = []; bot.reward = 3; bot.revealedByPassive = false; bot.revealStacks = 0; });
      state.player.actives = [];
      ${setup}
      state.roundState.trinity = { spirit: "${key}" };
      applyTrinitySpiritOutcome("${key}");
      ${check}
    `);
  outcome("memory", "", `assert.deepEqual(state.bots.map(bot => bot.memory.length), [5, 5, 5, 5, 5]);`);
  outcome("bounty", "", `assert.deepEqual(state.bots.map(bot => botSin(bot)).sort(), [3, 3, 3, 6, 6]);`);
  outcome("reveal", "", `
    assert.equal(state.trinityRevealsNextRound, 4);
    beginRound();
    assert.equal(revealedDamnedCount(), 4);
    assert.equal(state.trinityRevealsNextRound, 0);
  `);
  outcome("artifacts", "", `
    assert.equal(state.player.actives.length, 3);
    assert.equal(new Set(state.player.actives.map(item => item.id)).size, 1);
  `);
  outcome("stubborn", `state.bots.forEach(bot => setBotPersonality(bot, "Analyst", "", { triggerAlterationDamage: false }));`,
    `assert.equal(state.bots.filter(bot => hasPersonality(bot, "Stubborn")).length, 4);`);
  outcome("eliminate", `state.bots[0].isBoss = true;`, `
    assert.equal(state.bots.filter(bot => bot.eliminated).length, 1);
    assert.equal(state.bots[0].eliminated, false);
    assert.ok(state.player.credits > 0);
  `);
  outcome("elite", `state.player.passives.push(itemCopy("p1"));`, `
    assert.equal(state.trinityEliteNextShop, true);
    rerollShop();
    assert.equal(state.shop[0].item.id, "p1");
    assert.equal(state.trinityEliteNextShop, false);
  `);
  // the 50% hits: only ONE of the two missing Trinity SEALS is offered, picked at random
  outcome("trinity", `Math.random = () => 0.1; COLLECTION_SECTIONS.find((section) => section.key === "trinity").ids.forEach((id) => loadCollectionProgress().unlocked.push(id));`, `
    assert.deepEqual(state.trinityShopSealsNextShop, ["p131"]);
    rerollShop();
    assert.deepEqual(state.shop.filter(slot => slot.bonus).map(slot => slot.item.id), ["p131"]);
    assert.equal(state.shop.length, 4);
    syncShopSlotCount();
    assert.equal(state.shop.length, 4);
    assert.ok(renderShopSlot(state.shop[3], 3).includes("TRINITY SEAL"));
  `);
  outcome("trinity", `const rolls = [0.1, 0.9]; Math.random = () => rolls.shift() ?? 0.5;`, `
    assert.deepEqual(state.trinityShopSealsNextShop, ["p132"]);
  `);
  // the 50% misses: nothing is offered
  outcome("trinity", `Math.random = () => 0.7;`, `
    assert.deepEqual(state.trinityShopSealsNextShop, []);
    rerollShop();
    assert.equal(state.shop.filter(slot => slot.bonus).length, 0);
  `);
  // only one missing: that one
  outcome("trinity", `state.player.passives.push(itemCopy("p132")); Math.random = () => 0.1;`, `
    assert.deepEqual(state.trinityShopSealsNextShop, ["p131"]);
  `);
  outcome("trinity", `
    state.player.passives.push(itemCopy("p131"), itemCopy("p132"));
    state.player.hp = 90;
  `, `
    assert.equal(state.roundState.trinity.spiritHealed, true);
    applyEndOfRoundPassives();
    assert.equal(state.player.hp, 93);
  `);
});

test("Holy Spirit: CRITICAL whatever you guess, and no TARGET-difference damage to you", () => {
  game()(`
    fixture([], [49, 47, 30, 70, 100]);
    state.player.passives.push(itemCopy("p133"));
    state.roundState.targetModifier = 1;
    state.roundState.playerEffectiveGuess = 0;
    state.roundState.trinity = { spirit: "critical" };
    applyTrinityAtReady = () => {};
    assert.ok(criticalKeysForDisplay().has("player") || state.stage !== "active");
    applyPenalties();
    assert.ok(state.roundState.criticalHitKeys.has("player"));
  `);
  const hurt = (spirit) => {
    const run = game();
    run(`
      fixture([], [49, 47, 30, 70, 100]);
      state.player.passives.push(itemCopy("p133"));
      state.roundState.targetModifier = 1;
      state.roundState.playerEffectiveGuess = 20;
      state.roundState.trinity = { spirit: ${JSON.stringify(spirit)} };
      applyTrinityAtReady = () => {};
      applyPenalties();
    `);
    return run("state.player.maxHp - state.player.hp");
  };
  const normal = hurt(null);
  const shielded = hurt("shield");
  assert.ok(normal > shielded);
  assert.equal(normal - shielded, game()(`
    fixture([], [49, 47, 30, 70, 100]);
    state.roundState.targetModifier = 1;
    state.roundState.playerEffectiveGuess = 20;
    recalculateTarget();
    Math.abs(20 - state.roundState.target);
  `));
});

test("Trinity SEALS cast when you press READY, survive a save, and suppressed pieces cast nothing", () => {
  game()(`
    fixture([], [50, 50, 50]);
    state.player.passives.push(itemCopy("p131"), itemCopy("p132"), itemCopy("p133"));
    beginRound();
    assert.equal(trinityRound(), null);
    applyPenalties();
    const rolled = state.roundState.trinity;
    assert.ok(Object.keys(TRINITY_FATHER_BLESSINGS).includes(rolled.father));
    assert.ok(Object.keys(TRINITY_SON_BLESSINGS).includes(rolled.son));
    assert.ok(TRINITY_SPIRIT_OUTCOMES.some(outcome => outcome.key === rolled.spirit));
    ["p131", "p132", "p133"].forEach(id => assert.ok(state.roundState.triggeredPassiveIds.has(id)));
    const saved = JSON.stringify(arcadeRunSaveSnapshot(), encodeArcadeSaveValue);
    Object.assign(state, JSON.parse(saved, decodeArcadeSaveValue));
    normalizeLoadedArcadeRun();
    assert.equal(state.roundState.trinity.father, rolled.father);
    assert.equal(ownedSealSlotCount(), 1);
    assert.equal(trinitySlotName(), "Seal of God");
    state.roundState.kalhaSuppressedPassiveIds = new Set(["p131"]);
    state.roundState.kalhaSuppressedById = -1;
    assert.equal(trinityFatherBlessing(), null);
  `);
});

test("Son's free rerolls from READY last until the end of the next round", () => {
  game()(`
    ${TRINITY_STUBS}
    fixture([], [50, 50, 50]);
    state.round = 5;
    applyTrinitySonBlessing("rerolls");
    state.stage = "summary";
    advanceAfterSummary();
    assert.equal(state.round, 6);
    assert.equal(state.freeRerolls, 4);
    state.stage = "summary";
    advanceAfterSummary();
    assert.equal(state.freeRerolls, 0);
  `);
});

test("Goetic BOSS SOUL growth speeds up with depth and leaves the main game alone", () => {
  game()(`
    state.mode = "arcade";
    for (const spawned of [0, 4, 8]) {
      state.bossSpawnCount = spawned;
      assert.equal(bossHealthScaleFactor(), 1);
    }
    state.bossSpawnCount = 9;
    assert.ok(Math.abs(bossHealthScaleFactor() - 1.09) < 1e-9);
    let previousGrowth = 0;
    for (let spawned = 9; spawned <= 40; spawned += 1) {
      state.bossSpawnCount = spawned;
      const before = bossHealthScaleFactor();
      state.bossSpawnCount = spawned + 1;
      const growth = bossHealthScaleFactor() / before;
      assert.ok(growth > previousGrowth);
      previousGrowth = growth;
    }
    state.bossSpawnCount = 8;
    const first = createBot({ boss: true, bossSpec: { goeticKey: "bael" } });
    assert.equal(first.maxHp, 500);
    state.bossSpawnCount = 27;
    const deep = createBot({ boss: true, bossSpec: { goeticKey: "agares" } });
    assert.ok(deep.maxHp > 50000);
  `);
});

test("BOSS abilities carry sin names in tooltips and the log", () => {
  game()(`
    const names = Object.fromEntries(Object.entries(BOSS_PASSIVES).map(([key, spec]) => [key, spec.name]));
    assert.equal(JSON.stringify(names), JSON.stringify({
      sinStealing: "Greed", soullessness: "Envy", soulStealing: "Despair", deathRoll: "Wrath", rerollToll: "Vainglory",
      offeringToll: "Gluttony", avenging: "Pride", corruption: "Deceit", punishment: "Sloth", lifeSteal: "Lust", guilt: "Guilt"
    }));
    fixture([], [10, 20, 30, 40, 50]);
    state.bots[0].isBoss = true;
    state.bots[0].passiveKeys = ["punishment"];
    assert.ok(botPassiveSummary(state.bots[0]).includes("Sloth"));
    Math.random = () => 0;
    state.bots[0].passiveKeys = ["corruption"];
    applyCorruptionGuessMutation(27);
    assert.ok(state.roundState.roundEvents.some((line) => line.includes("Deceit shifted your guess")));
  `);
});
// ---- conditional extra reveals: Vepar p61, Vine p64, Naberius p65, Seal of Cassiel (p102) p102 ----
test("Amon always reveals one extra DAMNED", () => {
  game()(`
    fixture([["p59"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 2);
  `);
});

test("Vepar reveals one more DAMNED the first time each round the leftmost or rightmost DAMNED is revealed", () => {
  game()(`
    fixture([["p61"]], [10, 20, 30, 40, 50]);
    ${CLEAR_REVEALS}
    revealBotGuess(state.bots[2]);
    assert.equal(revealedDamnedCount(), 1, "a middle DAMNED does not count");
    Math.random = () => 0.99;
    revealBotGuess(state.bots[0]);
    assert.equal(revealedDamnedCount(), 3);
    assert.equal(state.bots[4].revealedByPassive, true, "the extra reveal is one of the hidden DAMNED");
    assert.ok(state.roundState.triggeredPassiveIds.has("p61"));
    revealBotGuess(state.bots[1]);
    assert.equal(revealedDamnedCount(), 4, "once per round: the other edge does not chain");
  `);
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    ${CLEAR_REVEALS}
    revealBotGuess(state.bots[0]);
    assert.equal(revealedDamnedCount(), 1);
  `);
  game()(`
    fixture([["p61"]], [10, 20, 30, 40, 50]);
    ${CLEAR_REVEALS}
    Math.random = () => 0;
    applyGuessReveals();
    assert.equal(revealedDamnedCount(), 2, "the round's own reveal on an edge brings one more");
    applyGuessReveals();
    assert.equal(revealedDamnedCount(), 2);
  `);
});

test("Fourth Pentacle of Saturn: on its roll every revealed DAMNED deals 10 damage to every other revealed DAMNED", () => {
  game()(`
    fixture([["p95"]], [10, 20, 30, 40, 50]);
    ${CLEAR_REVEALS}
    revealBotGuess(state.bots[0]);
    revealBotGuess(state.bots[2]);
    revealBotGuess(state.bots[3]);
    Math.random = () => 0.29;
    applyDevSealsAfterReady();
    applyQueuedEndOfRoundBotDamage();
    assertDamage([20, 0, 20, 20, 0]);
  `);
  game()(`
    fixture([["p95"]], [10, 20, 30, 40, 50]);
    ${CLEAR_REVEALS}
    revealBotGuess(state.bots[0]);
    revealBotGuess(state.bots[2]);
    Math.random = () => 0.3;
    applyDevSealsAfterReady();
    applyQueuedEndOfRoundBotDamage();
    assertDamage([0, 0, 0, 0, 0]);
  `);
  game()(`
    fixture([["p95", 3]], [10, 20, 30, 40, 50]);
    ${CLEAR_REVEALS}
    revealBotGuess(state.bots[1]);
    Math.random = () => 0.3;
    applyDevSealsAfterReady();
    applyQueuedEndOfRoundBotDamage();
    assertDamage([0, 0, 0, 0, 0]);
    assert.ok(!state.roundState.triggeredPassiveIds.has("p95"), "no glow with a single revealed DAMNED");
    assert.equal(devSealEntryChance({ id: "p95", stack: 3 }), 0.4);
  `);
});

test("Vine has a 50% chance to reveal one extra DAMNED, rolled once per round", () => {
  game()(`
    Math.random = () => 0.6;
    fixture([["p64"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 1);
    Math.random = () => 0.1;
    applyGuessReveals();
    assert.equal(revealedDamnedCount(), 1, "a lost roll stays lost for the round");
  `);
  game()(`
    Math.random = () => 0.1;
    fixture([["p64"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 2);
    applyGuessReveals();
    assert.equal(revealedDamnedCount(), 2);
    assert.equal(sealStatsFor("p64").triggers, 1, "re-applying reveals counts the trigger once");
  `);
});

test("Naberius reveals one extra DAMNED only if a revealed DAMNED died last round", () => {
  game()(`
    state.previousRoundEliminationsForMartyrs = 1;
    fixture([["p65"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 1, "a hidden DAMNED's death does not count");
  `);
  game()(`
    state.previousRoundRevealedEliminations = 1;
    fixture([["p65"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 2);
  `);
});

test("Seal of Cassiel (p102) reveals one extra DAMNED only if a DAMNED died last round", () => {
  game()(`
    fixture([["p102"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 1);
  `);
  game()(`
    state.previousRoundEliminationsForMartyrs = 1;
    fixture([["p102"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 2);
  `);
});

test("last round's deaths, revealed or not, carry into the next round", () => {
  game()(`
    globalThis.render = () => {};
    fixture([], [10, 20, 30, 40, 50]);
    const revealed = state.bots.find(bot => bot.revealedByPassive);
    const hidden = state.bots.find(bot => !bot.revealedByPassive);
    damageBot(hidden, 5000, "Test");
    assert.equal(state.roundState.eliminationsThisRound, 1);
    assert.equal(state.roundState.revealedEliminationsThisRound, 0);
    damageBot(revealed, 5000, "Test");
    assert.equal(state.roundState.revealedEliminationsThisRound, 1);
    state.stage = "summary";
    advanceAfterSummary();
    assert.equal(state.previousRoundEliminationsForMartyrs, 2);
    assert.equal(state.previousRoundRevealedEliminations, 1);
    assert.equal(state.roundState.revealedEliminationsThisRound, 0);
  `);
});

test("Vual: revealed DAMNED take 7 extra damage per hit (ELITE x1.5, rounded up)", () => {
  for (const [stack, extra] of [[1, 7], [2, 11]]) {
    game()(`
      fixture([["p63", ${stack}]], [10, 20, 30, 40, 50]);
      const revealed = state.bots.find(bot => bot.revealedByPassive);
      const hidden = state.bots.find(bot => !bot.revealedByPassive);
      damageBot(revealed, 10, "Test");
      damageBot(hidden, 10, "Test");
      assert.equal(revealed.maxHp - revealed.hp, 10 + ${extra});
      assert.equal(hidden.maxHp - hidden.hp, 10);
    `);
  }
  const run = game();
  const catalog = fs.readFileSync(path.join(root, "ITEMS.txt"), "utf8");
  assert.ok(catalog.includes(run("ITEMS.p63.description")));
  assert.ok(run(`itemDescription({ ...ITEMS.p63, stack: 1, description: "Old description" })`).includes("7 extra damage"));
  assert.ok(run(`itemDescription({ ...ITEMS.p63, stack: 2 })`).includes("11 extra damage"));
});

test("Red Horse: each revealed DAMNED has a 50% chance per round to take x1.5 damage, and the roll holds all round", () => {
  game()(`
    fixture([["p75"]], [10, 20, 30, 40, 50]);
    const revealed = state.bots.find(bot => bot.revealedByPassive);
    const hidden = state.bots.find(bot => !bot.revealedByPassive);
    assert.ok(revealed && hidden);
    Math.random = () => 0.1;
    assert.equal(scaledBotDamage(revealed, 10), 15);
    assert.equal(scaledBotDamage(hidden, 10), 10);
    Math.random = () => 0.99;
    assert.equal(scaledBotDamage(revealed, 10), 15);
  `);
  game()(`
    fixture([["p75", 2]], [10, 20, 30, 40, 50]);
    const revealed = state.bots.find(bot => bot.revealedByPassive);
    assert.equal(scaledBotDamage(revealed, 10), 10);
    Math.random = () => 0.1;
    assert.equal(scaledBotDamage(revealed, 10), 10);
  `);
  game()(`
    fixture([["p75", 2]], [10, 20, 30, 40, 50]);
    const revealed = state.bots.find(bot => bot.revealedByPassive);
    Math.random = () => 0.1;
    assert.equal(scaledBotDamage(revealed, 10), 17);
  `);
});

test("Second Pentacle of Saturn multiplies every DAMNED BOUNTY by x1.5 (rounded up) on a 30% roll", () => {
  game()(`
    fixture([["p93"]], [10, 20, 30, 40, 50]);
    const rewards = [10, 3, 1, 0, 7];
    state.bots.forEach((bot, index) => { bot.reward = rewards[index]; });
    Math.random = () => 0.99;
    applyDevSealEntries(["p93"]);
    assert.deepEqual(state.bots.map(bot => bot.reward), [10, 3, 1, 0, 7]);
    Math.random = () => 0.1;
    applyDevSealEntries(["p93"]);
    assert.deepEqual(state.bots.map(bot => bot.reward), [15, 5, 2, 0, 11]);
  `);
});

// ---- Ars Goetia binding: the bound demon's SEAL is free, YOU comes in its place ----
const BINDING_STUBS = `
  globalThis.render = () => {};
  globalThis.playGameSfx = () => {};
  globalThis.playSfx = () => {};
  globalThis.playSealPurchaseSfx = () => {};
  globalThis.quietMomentSfx = () => {};
  globalThis.ghostSealOut = () => {};
  globalThis.resumeSoundtrack = () => {};
  globalThis.playSoundtrack = () => {};
`;

test("only a defeated demon can be bound, and a run keeps the demon bound when it started", () => {
  game()(`
    ${BINDING_STUBS}
    state.mode = "arcade";
    loadCollectionProgress().slain.push("paimon", "bael");
    toggleBoundDemon("vassago");
    assert.equal(collectionBoundDemon(), null);
    toggleBoundDemon("paimon");
    assert.equal(collectionBoundDemon(), "paimon");
    startGame();
    assert.equal(state.boundDemon, "paimon");
    toggleBoundDemon("bael");
    assert.equal(collectionBoundDemon(), "bael");
    assert.equal(state.boundDemon, "paimon");
    toggleBoundDemon("bael");
    assert.equal(collectionBoundDemon(), null);
    startGame();
    assert.equal(state.boundDemon, null);
  `);
});

test("the bound demon's SEAL is free in the shop (its ELITE upgrades are not), and a free copy sells for nothing", () => {
  game()(`
    ${BINDING_STUBS}
    fixture([], [10, 20, 30, 40, 50]);
    state.stage = "shop";
    state.boundDemon = "paimon";
    const id = GOETIC_BOSS_BY_KEY.paimon.passiveId;
    const other = GOETIC_BOSS_BY_KEY.bael.passiveId;
    assert.equal(shopPrice(ITEMS[id]), 0);
    assert.ok(shopPrice(ITEMS[other]) > 0);
    state.player.credits = 0;
    state.shop = [{ item: itemCopy(id), sold: false }, { item: itemCopy(id), sold: false }];
    buyShopItem(0);
    const entry = passiveEntry(id);
    assert.ok(entry);
    assert.equal(state.player.credits, 0);
    assert.equal(passiveSellValue(entry), 0);
    // the ELITE upgrade costs what any SEAL's upgrade costs
    const upgradePrice = shopPrice(ITEMS[id]);
    assert.ok(upgradePrice > 0);
    state.boundDemon = null;
    assert.equal(upgradePrice, shopPrice(ITEMS[id]));
    state.boundDemon = "paimon";
    assert.ok(!/Upgrade free|Take free/.test(renderShopSlot(state.shop[1], 1)));
    buyShopItem(1);
    assert.equal(entry.stack, 1);
    state.player.credits = upgradePrice;
    buyShopItem(1);
    assert.equal(entry.stack, 2);
    assert.equal(state.player.credits, 0);
    assert.equal(entry.freeStacks, 1);
    // the paid upgrade sells for half its price, the free copy for nothing
    assert.equal(passiveSellValue(entry), Math.floor(ITEMS[id].price / 2));
    state.mode = "pvp";
    state.boundDemon = "paimon";
    assert.ok(shopPrice(ITEMS[id]) > 0);
  `);
});

test("YOU replaces the bound demon, counts toward the 72 and doubles your TARGET damage", () => {
  game()(`
    ${BINDING_STUBS}
    fixture([], [50, 50, 50, 50, 50]);
    state.boundDemon = "paimon";
    const shadow = createBot({ boss: true, bossSpec: { goeticKey: "paimon" } });
    assert.equal(shadow.name, SHADOW_BOSS.name);
    assert.equal(shadow.image, SHADOW_BOSS.image);
    assert.equal(shadow.goeticKey, null);
    assert.equal(shadow.shadowOf, "paimon");
    assert.deepEqual([...shadow.passiveKeys], ["guilt"]);
    assert.ok(!grantRandomBossPassive(shadow));
    const demon = createBot({ boss: true, bossSpec: { goeticKey: "bael" } });
    assert.equal(demon.goeticKey, "bael");
    assert.ok(!demon.passiveKeys.includes("guilt"));
    // Guilt never rolls on another BOSS
    assert.ok(!BOSS_PASSIVE_KEYS.includes("guilt"));

    state.roundState.targetModifier = 1;
    state.roundState.playerEffectiveGuess = 70;
    applyPenalties();
    const plain = state.roundState.playerTargetDifferenceDamage;
    assert.ok(plain > 0);

    fixture([], [50, 50, 50, 50, 50]);
    state.bots[0] = shadow;
    shadow.hp = shadow.maxHp = 1000;
    state.roundState.botEffectiveGuesses.set(shadow.id, 50);
    state.roundState.targetModifier = 1;
    state.roundState.playerEffectiveGuess = 70;
    applyPenalties();
    assert.equal(state.roundState.playerTargetDifferenceDamage, plain * 2);

    const kills = state.goeticBossKills;
    shadow.hp = 0;
    resolveEliminatedBots([shadow]);
    assert.equal(state.goeticBossKills, kills + 1);
    assert.equal(isDemonSlain("paimon"), false);
  `);
});

test("YOU guesses the best BOSS guess, off by one of your misses from your last rounds", () => {
  game()(`
    ${BINDING_STUBS}
    fixture([], [10, 20, 30, 40, 50]);
    state.boundDemon = "paimon";
    const shadow = createBot({ boss: true, bossSpec: { goeticKey: "paimon" } });
    state.bots[0] = shadow;
    const best = planBossGuess(shadow);
    state.gameMemory = [];
    assert.equal(planBotGuess(shadow), best);
    state.gameMemory = [{ playerGuess: 30, target: 50 }, { playerGuess: 57, target: 50 }];
    Math.random = () => 0;
    assert.equal(planBotGuess(shadow), Math.max(0, best - 20));
    Math.random = () => 0.99;
    assert.equal(planBotGuess(shadow), Math.min(100, best + 7));
    // only the last rounds count
    state.gameMemory = [{ playerGuess: 0, target: 90 }, ...Array.from({ length: SHADOW_BOSS.memoryRounds }, () => ({ playerGuess: 50, target: 50 }))];
    Math.random = () => 0;
    assert.equal(planBotGuess(shadow), best);
  `);
});

test("a saved run keeps its bound demon, and saves from before binding have none", () => {
  game()(`
    ${BINDING_STUBS}
    fixture([], [10, 20, 30]);
    state.boundDemon = "paimon";
    const saved = JSON.parse(JSON.stringify(arcadeRunSaveSnapshot(), encodeArcadeSaveValue), decodeArcadeSaveValue);
    state.boundDemon = null;
    Object.assign(state, saved);
    normalizeLoadedArcadeRun();
    assert.equal(state.boundDemon, "paimon");
    state.boundDemon = "nobody";
    normalizeLoadedArcadeRun();
    assert.equal(state.boundDemon, null);
  `);
});

test("DEV unlock all: every demon counts as defeated and can be bound, off again restores the real progress", () => {
  game()(`
    ${BINDING_STUBS}
    state.mode = "arcade";
    loadCollectionProgress().slain.push("bael");
    toggleDevAllDemons();
    assert.equal(GOETIC_BOSS_KEYS.filter(key => isDemonSlain(key)).length, 72);
    toggleBoundDemon("andromalius");
    assert.equal(collectionBoundDemon(), "andromalius");
    toggleDevAllDemons();
    assert.deepEqual(GOETIC_BOSS_KEYS.filter(key => isDemonSlain(key)), ["bael"]);
    assert.equal(collectionBoundDemon(), null);
    // the skip to the Goetic BOSSES gives the bound demon's place (YOU) no head start: it is as likely as any other
    fixture([], [10, 20, 30]);
    let seed = 7;
    Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const bound of ["paimon", "michael"]) {
      state.boundDemon = bound;
      let youFirst = 0;
      for (let tries = 0; tries < 60; tries += 1) {
        skipToFirstGoeticBoss();
        const first = state.bots[0];
        if (first.shadowOf === bound) youFirst += 1;
        // the bound place is still to come when it was not first
        else assert.ok(state.goeticBossQueue.includes(bound) || state.archangelQueue.includes(bound));
      }
      assert.ok(youFirst < 10, bound + " came first " + youFirst + " times out of 60");
    }
    state.boundDemon = null;
  `);
});

test("Jesus and Satan: infinite BOSS BOUNTY shown, regular BOUNTY starts at 0 and SEALS can add to it", () => {
  game()(`
    fixture([["p32"]], []);
    state.bots = [createFinalBoss("jesus"), createFinalBoss("satan")];
    state.finalBossPhase = true;
    assert.equal(botSinDisplay(state.bots[0]), "-∞+0 SIN");
    assert.equal(botSinDisplay(state.bots[1]), "∞+0 SIN");
    // Seal of Foras on a death gives every living DAMNED 1-2 BOUNTY, the final BOSSES too
    applyBountyGrowthOnDeath(state.bots[0]);
    state.bots.forEach(bot => assert.ok(botRegularBounty(bot) >= 1));
    assert.equal(botSinDisplay(state.bots[1]), "∞+" + botRegularBounty(state.bots[1]) + " SIN");
    // nothing touches the BOSS BOUNTY: a SIN-stealing BOSS keeps nothing on them
    state.player.credits = 20;
    assert.equal(stealPlayerSinToBoss(state.bots[1], 10, "test"), 0);
    assert.equal(botBossBounty(state.bots[1]), 0);
    assert.equal(state.player.credits, 20);
  `);
});

test("Jesus strikes on an odd TARGET (10 on 33), Satan on an even one (6 on 66)", () => {
  const cases = [[7, 1, "Jesus"], [33, 10, "Jesus"], [8, 1, "Satan"], [66, 6, "Satan"], [0, 1, "Satan"]];
  for (const [target, damage, who] of cases) {
    game()(`
      fixture([], []);
      state.bots = [createFinalBoss("jesus"), createFinalBoss("satan")];
      state.finalBossPhase = true;
      state.player.hp = 100;
      state.roundState.target = ${target};
      applyFinalBossTargetStrikes();
      assert.equal(state.player.hp, ${100 - damage});
      assert.ok(state.roundState.roundEvents.some(line => line.startsWith("${who} dealt ${damage} damage")));
    `);
  }
  // no final BOSSES, no strikes
  game()(`
    fixture([], [10, 20]);
    state.player.hp = 100;
    state.roundState.target = 33;
    applyFinalBossTargetStrikes();
    assert.equal(state.player.hp, 100);
  `);
});

test("Satan's offer: due on reaching 1500 SIN, again only after dropping under, YES leaves the starting SIN", () => {
  game()(`
    fixture([], []);
    state.player.credits = 1499;
    noteSatanTightwad();
    assert.equal(state.satanTightwadDue, false);
    state.player.credits = 1500;
    noteSatanTightwad();
    assert.equal(state.satanTightwadDue, true);
    assert.equal(satanTightwadLines(), SATAN_TIGHTWAD_LINES);
    // refused: no new offer while the SIN stays over the line
    state.satanTightwadDue = false;
    state.satanTightwadOffers = 1;
    state.player.credits = 2400;
    noteSatanTightwad();
    assert.equal(state.satanTightwadDue, false);
    // under the line and back over it: he comes again, with one line
    state.player.credits = 900;
    noteSatanTightwad();
    state.player.credits = 1600;
    noteSatanTightwad();
    assert.equal(state.satanTightwadDue, true);
    assert.equal(satanTightwadLines(), SATAN_TIGHTWAD_AGAIN_LINES);
    // YES
    assert.equal(satanTightwadPay(), 1600 - STARTING_CREDITS);
    assert.equal(state.player.credits, STARTING_CREDITS);
    assert.equal(state.satanTightwadAbove, false);
    // not outside the arcade run
    state.mode = "pvp";
    state.satanTightwadDue = false;
    state.player.credits = 5000;
    noteSatanTightwad();
    assert.equal(state.satanTightwadDue, false);
  `);
});

test("Satan's toll: after refusing him, the next reroll takes all your SIN, then rerolls cost as before", () => {
  game()(`
    fixture([], []);
    state.stage = "guess";
    state.rerollBaseCost = 3;
    state.freeRerolls = 2;
    state.player.credits = 1600;
    state.satanRerollToll = true;
    assert.equal(currentRerollCost(), 1600);
    state.player.credits = 1234;
    assert.equal(currentRerollCost(), 1234);
    render = () => {};
    playGameSfx = () => {};
    rerollShopClick();
    assert.equal(state.player.credits, 0);
    assert.equal(state.satanRerollToll, false);
    assert.equal(state.freeRerolls, 2);
    assert.equal(state.rerollBaseCost, 3);
    assert.equal(currentRerollCost(), 0); // the free rerolls are back in charge
    state.freeRerolls = 0;
    assert.equal(currentRerollCost(), 3);
  `);
});

test("collection search: SEALS by name, text and build; demons by number, and by name only once defeated", () => {
  game()(`
    state.mode = "arcade";
    const paimonSeal = GOETIC_BOSS_BY_KEY.paimon.passiveId;
    assert.ok(sealMatchesSearch(paimonSeal, ""));
    assert.ok(sealMatchesSearch(paimonSeal, ITEMS[paimonSeal].name.toUpperCase()));
    assert.ok(!sealMatchesSearch(paimonSeal, "zzzz"));
    const bountyIds = collectibleSealIds().filter(id => sealBuilds(id).includes("bounty"));
    assert.ok(bountyIds.every(id => sealMatchesSearch(id, "bounty")));
    // every word has to match
    assert.ok(!sealMatchesSearch(paimonSeal, ITEMS[paimonSeal].name + " zzzz"));

    assert.ok(demonMatchesSearch("paimon", "9"));
    assert.ok(demonMatchesSearch("paimon", "ix"));
    assert.ok(!demonMatchesSearch("paimon", "19"));
    assert.ok(!demonMatchesSearch("paimon", "paimon"));
    loadCollectionProgress().slain.push("paimon", "marax");
    assert.ok(demonMatchesSearch("paimon", "Paim"));
    assert.ok(demonMatchesSearch("marax", "morax"));
    assert.ok(!demonMatchesSearch("bael", "paimon"));
    toggleBoundDemon("paimon");
    assert.ok(demonMatchesSearch("paimon", "bound"));
    assert.ok(!demonMatchesSearch("marax", "bound"));
    collectionSearch.goetia = "paimon";
    const html = collectionDemonsHtml();
    assert.equal((html.match(/class="collection-demon [^"]*" type="button" hidden/g) || []).length, 71);
  `);
});

// ---- Archangels: SEALS swapped with the Pentacles of Saturn, Archangel BOSSES, the Archangels tab ----
test("Archangel and Saturn SEALS swapped effects within the same build; each Archangel BOSS matches its SEAL", () => {
  game()(`
    assert.equal(ITEMS.p98.name, "Seal of Gabriel");
    assert.equal(ITEMS.p92.name, "Third Pentacle of Saturn");
    assert.equal(ITEMS.p101.name, "Seal of Raphael");
    assert.equal(ITEMS.p110.name, "Fifth Pentacle of Saturn");
    const archangelSeals = COLLECTION_SECTIONS.find(section => section.key === "archangel").ids;
    const saturnSeals = COLLECTION_SECTIONS.find(section => section.key === "saturn").ids;
    assert.ok(archangelSeals.every(id => SELF_STACKING_SEAL_IDS.has(id) && /^Seal of /.test(ITEMS[id].name)));
    assert.ok(saturnSeals.every(id => !SELF_STACKING_SEAL_IDS.has(id) && /Pentacle of Saturn$/.test(ITEMS[id].name)));
    ARCHANGEL_BOSS_SPECS.forEach(spec => {
      assert.equal(ITEMS[spec.sealId].name, "Seal of " + spec.name);
      assert.deepEqual([...SEAL_BUILD_TAGS[spec.sealId]], [spec.build]);
    });
  `);
});

test("Archangels: half a demon's chance each, once per run, not after the 72, and they do not count toward the 72", () => {
  game()(`
    globalThis.render = () => {};
    fixture([], [10, 20, 30]);
    state.bossKills = UNIQUE_BOSS_KEYS.length;
    state.uniqueBossQueue = [];
    state.goeticBossQueue = GOETIC_BOSS_KEYS.slice();
    state.archangelQueue = ARCHANGEL_KEYS.slice();
    Math.random = () => 3.5 / 75.5 - 0.0001;
    const first = takeNextBossSpec();
    assert.ok(ARCHANGEL_BY_KEY[first.archangelKey]);
    assert.equal(state.archangelQueue.length, 6);
    assert.equal(state.goeticBossQueue.length, 72);
    Math.random = () => 3 / 75 + 0.0001;
    assert.ok(takeNextBossSpec().goeticKey);
    state.goeticBossQueue = [];
    Math.random = () => 0;
    assert.equal(takeNextBossSpec(), null);
    // an Archangel's death does not count toward the 72
    const angel = createBot({ boss: true, bossSpec: { archangelKey: "gabriel" } });
    state.bots.push(angel);
    const kills = state.goeticBossKills;
    angel.hp = 0;
    resolveEliminatedBots([angel]);
    assert.equal(state.goeticBossKills, kills);
    assert.ok(isArchangelDefeated("gabriel"));
  `);
});

test("an Archangel BOSS: its own art and ability only, and the TARGET modifier cycles 0.8, 1, 1.2, 1", () => {
  game()(`
    fixture([], [10, 20, 30]);
    const angel = createBot({ boss: true, bossSpec: { archangelKey: "michael" } });
    assert.equal(angel.name, "Michael");
    assert.equal(angel.image, ARCHANGEL_BOSS_IMAGE_ROOT + "/04-michael.png");
    assert.equal(angel.goeticKey, null);
    assert.deepEqual([...angel.passiveKeys], []);
    // 1.5x the SOUL of a Goetic BOSS arriving at the same point; YOU in its place has the plain amount
    state.bossSpawnCount = 20;
    const plain = (80 + bossHealthBonus()) * bossHealthScaleFactor();
    const demon = createBot({ boss: true, bossSpec: { goeticKey: "bael" } });
    state.bossSpawnCount = 20;
    const strong = createBot({ boss: true, bossSpec: { archangelKey: "gabriel" } });
    assert.equal(demon.maxHp, Math.ceil(plain));
    assert.equal(strong.maxHp, Math.ceil(plain * 1.5));
    state.boundDemon = "michael";
    state.bossSpawnCount = 20;
    const you = createBot({ boss: true, bossSpec: { archangelKey: "michael" } });
    assert.equal(you.name, "YOU");
    assert.equal(you.maxHp, Math.ceil(plain));
    state.boundDemon = null;
    // the Collection text is the ability only
    loadCollectionProgress().archangels.push("michael");
    assert.ok(!collectionArchangelInfoHtml("michael").includes("modifier"));
    assert.equal(grantRandomBossPassive(angel), null);
    assert.ok(bossAbilityText(angel).includes("MEMORY"));
    state.bots = [angel];
    const start = state.round;
    const seen = [];
    for (let step = 0; step < 6; step += 1) {
      state.round = start + step;
      seen.push(currentTargetModifier());
    }
    assert.deepEqual(seen, [0.8, 1, 1.2, 1, 0.8, 1]);
  `);
});

test("Archangel abilities: gain, then deal the current damage to you", () => {
  game()(`
    globalThis.render = () => {};
    const hurt = (fn) => { const before = state.player.hp; fn(); return before - state.player.hp; };
    fixture([], [10, 20, 30, 40, 50]);
    const add = (key) => { const angel = createBot({ boss: true, bossSpec: { archangelKey: key } }); angel.hp = angel.maxHp = 1000; state.bots.push(angel); return angel; };
    state.player.hp = state.player.maxHp = 1000;
    // Anael: every ARTIFACT
    const anael = add("anael");
    assert.equal(hurt(() => applyArchangelArtifactUse()), 2);
    assert.equal(hurt(() => applyArchangelArtifactUse()), 4);
    assert.equal(anael.archangelDamage, 4);
    // Cassiel: a revealed DAMNED takes more than 10 at once
    const cassiel = add("cassiel");
    const revealed = state.bots[0];
    revealed.revealedByPassive = true;
    revealed.hp = revealed.maxHp = 1000;
    assert.equal(hurt(() => damageBot(revealed, 10, "")), 0);
    assert.equal(hurt(() => damageBot(revealed, 11, "")), 2);
    assert.equal(cassiel.archangelDamage, 2);
    // the end-of-round four
    const michael = add("michael"), samael = add("samael"), sachiel = add("sachiel"), raphael = add("raphael");
    const damned = state.bots.filter(bot => !bot.isBoss);
    damned.forEach(bot => { bot.memory = [1, 2, 3, 4]; bot.reward = 1; });
    setBotPersonality(damned[0], "Analyst", "", { triggerAlterationDamage: false });
    setBotPersonality(damned[1], "Analyst", "", { triggerAlterationDamage: false });
    state.roundState.eliminationsThisRound = 2;
    assert.equal(hurt(() => applyArchangelEndOfRound()), 2 + 2 + 2 + 3);
    assert.deepEqual([michael, samael, sachiel, raphael].map(bot => bot.archangelDamage), [2, 2, 2, 3]);
    // conditions not met: no gain, no damage; a PENTAKILL spares you from Raphael
    damned.forEach(bot => { bot.memory = []; bot.reward = 0; });
    damned.forEach((bot, index) => setBotPersonality(bot, ["Anchor", "Analyst", "Follower", "Stubborn", "Drifter"][index], "", { triggerAlterationDamage: false }));
    state.roundState.eliminationsThisRound = 5;
    const otherBounty = state.bots.filter(bot => bot.isBoss).reduce((sum, bot) => sum + botRegularBounty(bot), 0);
    state.bots.filter(bot => bot.isBoss).forEach(bot => { bot.reward = 0; });
    assert.equal(hurt(() => applyArchangelEndOfRound()), 0);
  `);
});

test("Gabriel gains +3 for every CRITICAL, yours or a DAMNED's", () => {
  game()(`
    globalThis.render = () => {};
    fixture([], [10, 20, 30, 40, 50]);
    const gabriel = createBot({ boss: true, bossSpec: { archangelKey: "gabriel" } });
    gabriel.hp = gabriel.maxHp = 1000;
    state.bots.push(gabriel);
    state.roundState.botEffectiveGuesses.set(gabriel.id, 0);
    state.roundState.targetModifier = 1;
    state.roundState.playerEffectiveGuess = 60;
    applyPenalties();
    const crits = findCriticalHits().length;
    assert.ok(crits >= 1);
    assert.equal(gabriel.archangelDamage, 3 * crits);
  `);
});

test("a bound Archangel: the run starts with its SEAL (sells for nothing) and YOU comes in its place", () => {
  game()(`
    ${BINDING_STUBS}
    state.mode = "arcade";
    toggleBoundDemon("michael");
    assert.equal(collectionBoundDemon(), null);
    loadCollectionProgress().archangels.push("michael");
    toggleBoundDemon("michael");
    assert.equal(collectionBoundDemon(), "michael");
    startGame();
    assert.equal(state.boundDemon, "michael");
    const seal = passiveEntry("p99");
    assert.ok(seal);
    assert.equal(passiveSellValue(seal), 0);
    assert.ok(shopPrice(ITEMS.p99) > 0);
    const you = createBot({ boss: true, bossSpec: { archangelKey: "michael" } });
    assert.equal(you.name, "YOU");
    assert.equal(you.archangelKey, null);
    state.bots.push(you);
    const kills = state.goeticBossKills;
    you.hp = 0;
    resolveEliminatedBots([you]);
    assert.equal(state.goeticBossKills, kills);
    // the search finds a defeated Archangel by name, an unknown one only by its planet
    assert.ok(archangelMatchesSearch("michael", "mich"));
    assert.ok(!archangelMatchesSearch("gabriel", "gabriel"));
    assert.ok(archangelMatchesSearch("gabriel", "moon"));
  `);
});

// ---------- Satan's Pact (09-satan-pact.js) ----------
const PACT_SETUP = `
  state.mode = "arcade";
  state.round = 3;
  state.stage = "guess";
  state.bossKills = 0;
  state.pact = satanPactFresh();
  state.player.hp = 80;
  state.player.maxHp = 100;
  state.player.credits = 0;
  state.player.passives = [];
  state.player.actives = [];
  state.bots = [createBot(), createBot(), createBot()];
  state.bots[0].name = "Nikos";
  state.bots[1].name = "Haruto";
  Math.random = () => 0.5;
`;

test("Satan's Pact reads what you typed: typos, counts, numbers and kinds of request", () => {
  game()(`
    ${PACT_SETUP}
    const read = (text) => satanPactParse(text);
    assert.equal(read("gimme the pamion seal").intent, "seal");
    assert.equal(read("gimme the pamion seal").id, "p2");
    const candles = read("3 black candels please");
    assert.equal(candles.intent, "artifact");
    assert.equal(candles.id, "a14");
    assert.equal(candles.count, 3);
    assert.equal(read("a dagger").id, "a15");
    assert.equal(read("a dagger").count, 1);
    assert.equal(read("heal me for 10").intent, "heal");
    assert.equal(read("heal me for 10").n, 10);
    assert.equal(read("50 sin").intent, "sin");
    assert.equal(read("50 sin").n, 50);
    assert.equal(read("kill nikos").intent, "kill");
    assert.equal(read("kill nikos").botId, state.bots[0].id);
    assert.equal(read("one more artifact use").intent, "uses");
    assert.equal(read("let me cheat death").intent, "cheatDeath");
    assert.equal(read("elite on paimon").intent, "elite");
    assert.equal(read("your own seal").intent, "satanSeal");
    assert.equal(read("banana").intent, "gibberish");
    assert.equal(read("").intent, "gibberish");
  `);
});

test("Satan's Pact: 1 ARTIFACT costs SOUL, 3x its price in SIN, or a use cap, among the ones you can pay", () => {
  game()(`
    ${PACT_SETUP}
    // low on SOUL and SIN: only the use cap is left
    state.player.hp = 2;
    state.player.credits = 0;
    const offer = satanPactArtifactOffer("a14", 1);
    assert.equal(offer.price.length, 1);
    assert.equal(offer.price[0].type, "useCap");
    assert.equal(offer.price[0].cap, 1);
    assert.equal(offer.price[0].from, 3);
    // plenty of both: the SOUL option is half the Devil's Offerings price, at least 2
    state.player.hp = 80;
    state.player.credits = 100;
    const unit = shopPrice({ ...ITEMS.a14 });
    Math.random = () => 0.01;
    const cheap = satanPactArtifactOffer("a14", 1);
    assert.equal(cheap.price[0].type, "hp");
    assert.ok(cheap.price[0].n >= 2);
    assert.ok(cheap.price[0].n <= Math.max(2, Math.round(0.5 * unit * 1.25)));
    Math.random = () => 0.5;
    const middle = satanPactArtifactOffer("a14", 1);
    assert.equal(middle.price[0].type, "sin");
    assert.equal(middle.price[0].n, Math.round(3 * unit * satanPactRoll()));
  `);
});

test("Satan's Pact: 2 to 4 copies close the Offerings or cost SOUL, never more than fit", () => {
  game()(`
    ${PACT_SETUP}
    const many = satanPactArtifactOffer("a14", 9);
    assert.equal(many.gain.count, 4);
    assert.equal(many.lines[0][1], SATAN_DEAL_LINES.artifactsCapped[0][1]);
    state.player.actives = [freeActiveCopy("a6"), freeActiveCopy("a6"), freeActiveCopy("a6")];
    assert.equal(satanPactArtifactOffer("a14", 4).gain.count, activeInventoryLimit() - 3);
    state.player.hp = 1;
    const closed = satanPactArtifactOffer("a14", 2);
    assert.equal(closed.price[0].type, "shopClosed");
    state.player.actives = [1, 2, 3, 4, 5].map(() => freeActiveCopy("a6"));
    assert.equal(satanPactArtifactOffer("a14", 1).refuse, "handsFull");
  `);
});

test("Satan's Pact: SEALS and ELITE wait for every SEAL slot; angels, Trinity, Saturn and Apocalypse are never sold", () => {
  game()(`
    ${PACT_SETUP}
    assert.equal(satanPactAnswer("seal of paimon").refuse, "tooEarly");
    assert.equal(satanPactAnswer("elite paimon").refuse, "tooEarly");
    assert.equal(satanPactAnswer("seal of michael").refuse, "angel");
    assert.equal(satanPactAnswer("seal of the father").refuse, "trinity");
    assert.equal(satanPactAnswer("first pentacle of saturn").refuse, "saturn");
    assert.equal(satanPactAnswer("seal of the white horse").refuse, "apocalypse");
    state.bossKills = 6;
    state.player.passives = [itemCopy("p16")];
    assert.equal(satanPactAnswer("seal of satan").refuse, "satanSealNotEmpty");
    state.player.passives = [];
    assert.equal(satanPactAnswer("seal of satan").gain.id, "p111");
    assert.equal(satanPactAnswer("seal of satan").price.length, 0);
  `);
});

test("Satan's Pact: refusals and gibberish keep the chance; a turned-down SEAL locks it until the next BOSS kill; NO uses it up", () => {
  game()(`
    ${PACT_SETUP}
    satanPactRequest("banana");
    satanPactRequest("seal of michael");
    assert.equal(state.pact.used, false);
    assert.equal(satanPactAvailable(), true);
    state.bossKills = 6;
    state.player.passives = [itemCopy("p16"), itemCopy("p8")];
    Math.random = () => 0.9; // over the 50% the demon agrees with
    const refused = satanPactRequest("seal of paimon");
    assert.equal(refused.next, "leave");
    assert.equal(satanPactAvailable(), false);
    state.bossKills = 7;
    assert.equal(satanPactAvailable(), true);
    Math.random = () => 0.1;
    const offer = satanPactRequest("seal of paimon");
    assert.equal(offer.next, "offer");
    assert.ok(state.pact.offer);
    satanPactRefuse();
    assert.equal(state.pact.used, true);
    assert.equal(satanPactAvailable(), false);
  `);
});

test("Satan's Pact: a new Goetic SEAL takes a random SEAL of yours, SOUL and 20% of your SIN", () => {
  game()(`
    ${PACT_SETUP}
    state.bossKills = 6;
    state.player.credits = 100;
    state.player.passives = [itemCopy("p16"), itemCopy("p8")];
    Math.random = () => 0.1;
    satanPactRequest("seal of paimon");
    const parts = state.pact.offer.price.map((part) => part.type);
    assert.deepEqual(parts, ["loseSeal", "hp", "sin"]);
    satanPactSign();
    assert.equal(state.pact.used, true);
    assert.equal(state.pact.outcome, "signed");
    assert.ok(hasPassive("p2"));
    assert.equal(state.player.passives.length, 2);
    assert.ok(state.player.hp < 80);
    assert.ok(state.player.credits < 100);
    assert.equal(passiveEntry("p2").freeStacks, 1);
  `);
});

test("Satan's Pact: ELITE on the SEAL you asked for, or the other one it lands on for a cheaper debt", () => {
  game()(`
    ${PACT_SETUP}
    state.bossKills = 6;
    state.player.passives = [itemCopy("p2"), itemCopy("p8"), itemCopy("p16")];
    Math.random = () => 0.01; // lands on the first weight: Paimon, which you asked for
    const mine = satanPactEliteOffer("p2");
    assert.equal(mine.gain.id, "p2");
    assert.ok(["bossHealth", "loseSeal"].includes(mine.price[0].type));
    Math.random = () => 0.99; // the last SEAL in the list
    const other = satanPactEliteOffer("p2");
    assert.equal(other.gain.id, "p16");
    assert.equal(other.price[0].type, "bossHealth");
    assert.ok(other.price[0].pct <= Math.round(30 * 1.25));
    state.pact.offer = { gain: other.gain, price: other.price, request: other.request };
    satanPactSign();
    assert.equal(passiveEntry("p16").stack, 2);
    assert.equal(state.pact.bossDebt.healthPct, other.price[0].pct);
  `);
});

test("Satan's Pact: heal up to 5, SIN at a BOSS debt (and SOUL past 20), never a SOUL price that kills", () => {
  game()(`
    ${PACT_SETUP}
    const heal = satanPactHealOffer(40);
    assert.equal(heal.gain.n, 5);
    assert.equal(heal.lines, SATAN_DEAL_LINES.healTooMuch);
    assert.equal(heal.price[0].pct, Math.round(10 * 5 * satanPactRoll()));
    state.player.hp = 100;
    assert.equal(satanPactHealOffer(3).refuse, "fullHealth");
    state.player.hp = 80;
    const small = satanPactSinOffer(20);
    assert.deepEqual(small.price.map((part) => part.type), ["bossHealth"]);
    assert.equal(small.price[0].zeroBounty, true);
    const big = satanPactSinOffer(50);
    assert.deepEqual(big.price.map((part) => part.type), ["bossHealth", "hp"]);
    assert.equal(big.price[1].n, Math.round(10 * satanPactRoll()));
    state.player.hp = 3;
    const capped = satanPactSinOffer(200);
    assert.ok(capped.gain.n < 200);
    assert.ok(state.player.hp - capped.price[1].n >= 1);
    assert.equal(satanPactSinOffer(null).refuse, "sinHowMuch");
  `);
});

test("Satan's Pact prices act on the game: ARTIFACT uses, closed Offerings, more damage taken, BOSS debt", () => {
  game()(`
    ${PACT_SETUP}
    fixture([], [10, 20, 30]);
    state.round = 3;
    state.stage = "guess";
    const base = activeUseLimit();
    state.pact = satanPactFresh();
    state.pact.offer = satanPactUsesOffer(2);
    satanPactSign();
    assert.equal(activeUseLimit(), base + 2);
    state.round = 4;
    assert.equal(activeUseLimit(), 1);
    state.round = 3;
    state.pact.shopClosed = { from: 3, to: 4 };
    assert.equal(shopDisabledBySatan(), true);
    state.round = 5;
    assert.equal(shopDisabledBySatan(), false);
    state.pact.damageTaken = { from: 5, to: 5, pct: 50 };
    state.player.hp = 80;
    damagePlayer(10, null);
    assert.equal(state.player.hp, 65);
    state.pact.bossDebt = { healthPct: 50, zeroBounty: true, pairGroupId: null };
    const fake = { isBoss: true, maxHp: 200, hp: 20, bossBountyFactor: 1, name: "BOSS" };
    satanPactApplyBossDebt(fake);
    assert.equal(fake.maxHp, 300);
    assert.equal(fake.hp, 300);
    assert.equal(fake.bossBountyFactor, 0);
    assert.equal(state.pact.bossDebt, null);
    state.pact.bossDebt = { healthPct: 50, zeroBounty: true, pairGroupId: null };
    const boss = createBot({ boss: true });
    assert.equal(boss.bossBountyFactor, 0);
    assert.equal(boss.hp, boss.maxHp);
    assert.equal(state.pact.bossDebt, null);
    assert.equal(createBot({ boss: true }).bossBountyFactor, 1);
  `);
});

test("Satan's Pact: killing a DAMNED keeps its BOUNTY and takes your ARTIFACTS for a round; cheat death works once", () => {
  game()(`
    ${PACT_SETUP}
    fixture([], [10, 20, 30]);
    state.round = 3;
    state.stage = "guess";
    state.pact = satanPactFresh();
    const victim = state.bots[1];
    state.player.credits = 0;
    state.pact.offer = satanPactKillOffer(victim.id);
    satanPactSign();
    assert.equal(victim.eliminated, true);
    assert.equal(state.player.credits, 0);
    assert.equal(activeUseLimit(), 0);
    state.pact = satanPactFresh();
    state.pact.cheatDeath = true;
    state.player.hp = 5;
    state.player.credits = 40;
    damagePlayer(50, null);
    assert.equal(state.player.hp, 1);
    assert.equal(state.pact.cheatDeath, false);
    damagePlayer(50, null);
    assert.equal(state.player.hp, 0);
  `);
});

test("Guess quality: a CRITICAL scores 100, a miss 100 x 0.9 per step; the run, lifetime and last 100 averages", () => {
  game()(`
    assert.equal(guessQualityScore(0, true), 100);
    assert.equal(guessQualityScore(2, true), 100); // a widened CRITICAL window still counts as a CRITICAL
    assert.equal(guessQualityScore(0, false), 99); // never 100 without a CRITICAL
    assert.equal(guessQualityScore(1, false), 90);
    assert.equal(guessQualityScore(3, false), 73);
    assert.equal(guessQualityScore(10, false), 35);
    // the average is rounded down, so 100 only when every guess was a CRITICAL
    assert.equal(guessQualityValue(100 * 9 + 99, 10), 99);
    assert.equal(guessQualityValue(300, 3), 100);
    assert.equal(guessQualityValue(0, 0), null);
    // a resolved round records your final guess against the final TARGET (60 vs 50: 10 off)
    fixture([], [10, 20, 30, 40, 50]);
    applyPenalties();
    const first = guessQualityScore(Math.abs(60 - state.roundState.target), false);
    assert.ok(first < 100);
    assert.equal(state.runStats.guessRounds, 1);
    assert.equal(state.runStats.guessSum, first);
    assert.equal(runGuessQuality(), first);
    const lifetime = loadLifetimeRecords();
    assert.equal(lifetime.guessRounds, 1);
    assert.deepEqual([...lifetime.recentGuesses], [first]);
    // a CRITICAL counts for Most CRITICALS too
    recordRoundGuess(0, true);
    assert.equal(state.runStats.criticals, 1);
    assert.equal(runGuessQuality(), Math.floor((first + 100) / 2));
    // only the last 100 guesses are kept for the recent number
    for (let i = 0; i < 150; i += 1) recordRoundGuess(0, true);
    assert.equal(lifetime.recentGuesses.length, 100);
    assert.equal(guessQualityValue(lifetime.recentGuesses.reduce((a, b) => a + b, 0), lifetime.recentGuesses.length), 100);
    assert.equal(lifetime.guessRounds, 152);
    // PvP does not count
    state.mode = "pvp";
    recordRoundGuess(50, false);
    assert.equal(lifetime.guessRounds, 152);
  `);
});

test("Records: deepest descent keeps the build, fastest win is lowest, best run Guess quality needs a finished run of 10 guesses", () => {
  game()(`
    globalThis.window = globalThis; // the records are read back from localStorage
    fixture([["p1", 3], ["p12"]], [10, 20, 30, 40, 50]);
    state.player.actives = [{ ...ITEMS.a6 }];
    state.round = 9;
    collectionRun().uniqueKills = ["zilon", "dantre", "petros"];
    // Petros counts once Pavlos is down too
    assert.equal(deepestDescentDepth(), 2);
    for (let i = 0; i < 12; i += 1) recordRoundGuess(1, false);
    updateArcadeRecordsFromCurrentRun();
    let records = loadArcadeRecords();
    assert.equal(records.deepestDescent.depth, 2);
    assert.equal(records.deepestDescent.round, 9);
    assert.deepEqual(records.deepestDescent.build.map(entry => [entry.id, entry.elite]), [["p1", 2], ["p12", 0]]);
    assert.deepEqual([...records.deepestDescent.artifacts], ["a6"]);
    assert.equal(recordValueDisplay("deepestDescent", records.deepestDescent), "2 of 8 BOSSES");
    // a run in progress does not set Best run Guess quality
    assert.equal(records.bestRunGuessQuality.value, 0);
    updateArcadeRecordsFromCurrentRun({ final: true });
    records = loadArcadeRecords();
    assert.equal(records.bestRunGuessQuality.value, 90);
    assert.equal(records.bestRunGuessQuality.guesses, 12);
    // the same depth later in the run moves the round on, the build stays the one you got there with
    state.player.passives = [];
    state.round = 10;
    updateArcadeRecordsFromCurrentRun();
    assert.equal(loadArcadeRecords().deepestDescent.round, 10);
    // past the eighth BOSS, demons are the depth
    collectionRun().uniqueKills = [...UNIQUE_BOSS_KEYS, "pavlos"];
    state.goeticBossKills = 12;
    updateArcadeRecordsFromCurrentRun();
    assert.equal(recordValueDisplay("deepestDescent", loadArcadeRecords().deepestDescent), "Demon 12");
    // fastest win: lower is better, 0 never counts
    records = loadArcadeRecords();
    updateRecordIfHigher(records, "fastestWin", { value: 40 });
    updateRecordIfHigher(records, "fastestWin", { value: 55 });
    updateRecordIfHigher(records, "fastestWin", { value: 0 });
    assert.equal(records.fastestWin.value, 40);
    updateRecordIfHigher(records, "fastestWin", { value: 31 });
    assert.equal(records.fastestWin.value, 31);
    assert.equal(recordValueDisplay("fastestWin", records.fastestWin), "Round 31");
    // the eighth BOSS down sets the round of the win
    resetCollectionRun();
    collectionRun().uniqueKills = [...UNIQUE_BOSS_KEYS];
    state.round = 44;
    collectionNoteElimination({ isBoss: true, uniqueKey: "pavlos", name: "Pavlos" });
    assert.equal(state.collectionRun.beatenRound, 44);
  `);
});

test("Records: most played SEAL counts runs, build of a run, nemesis, NEW marks, and every Records tab renders", () => {
  game()(`
    globalThis.window = globalThis; // the records are read back from localStorage
    fixture([["p2", 2], ["p6"], ["p9"]], [10, 20, 30, 40, 50]);
    // a SEAL counts once per run, however long it stays
    recordsNoteSlots();
    recordsNoteSlots();
    const lifetime = loadLifetimeRecords();
    assert.equal(lifetime.sealRuns.p2, 1);
    state.runStats = defaultRunStats();
    recordsNoteSlots();
    assert.equal(lifetime.sealRuns.p2, 2);
    // the build most SEALS share: Paimon and Orias are Critical, Marbas Bounty + Memory
    assert.equal(runBuildKey(), "critical");
    assert.equal(runBuildKey([{ ...ITEMS.p12 }]), "general");
    assert.equal(runBuildKey([]), "");
    // ARTIFACT uses, pacts, SIN earned (sales do not count)
    recordPlayedArtifact("a6");
    recordPlayedArtifact("a6");
    assert.equal(lifetime.artifactUses.a6, 2);
    recordPactSigned();
    assert.equal(lifetime.pacts, 1);
    gainCreditsFromSourceEntries([{ amount: 10, source: "BOUNTY" }, { amount: 4, source: "Sold Seal of Bael" }], false);
    assert.equal(lifetime.sinEarned, 10);
    // game over: a run, its build, who was on the table, the records it broke
    state.recordsAtRunStart = loadArcadeRecords();
    state.recordsAtRunStart.mostEliminations = { value: 3 };
    state.eliminations = 7;
    // the most KOs in one round
    recordRunRoundEliminations(2);
    recordRunRoundEliminations(4);
    recordRunRoundEliminations(1);
    assert.equal(state.runStats.roundKOs, 4);
    const boss = state.bots[0];
    boss.isBoss = true;
    boss.uniqueKey = "padma";
    boss.name = "Padma";
    finishGameOverRound();
    assert.equal(lifetime.runs, 1);
    assert.equal(lifetime.builds.critical.runs, 1);
    assert.equal(lifetime.deaths.padma.count, 1);
    assert.ok(lifetime.unseen.includes("mostEliminations"));
    // the death card shows the run's Guess quality and the broken record
    const overlay = renderOverlay();
    assert.ok(overlay.includes("Guess quality"));
    assert.ok(overlay.includes("Most KOs"));
    // the Records screen opens on the tab with something new, every tab renders
    state.mode = "menu";
    state.menuScreen = "records";
    state.recordsTab = null;
    let html = renderRecordsMenu();
    assert.equal(state.recordsTab, "eliminations");
    assert.ok(html.includes("record-new"));
    for (const tab of RECORDS_TABS) {
      state.recordsTab = tab.key;
      html = renderRecordsMenu();
      assert.ok(html.includes("records-wall-" + tab.key));
    }
    state.recordsTab = "descent";
    assert.ok(renderRecordsMenu().includes("Padma"));
    state.recordsTab = "seals";
    html = renderRecordsMenu();
    assert.ok(html.includes("Critical"));
    assert.ok(html.includes(ITEMS.p2.name));
    // leaving the screen clears the NEW marks
    recordsMarkSeen();
    assert.equal(lifetime.unseen.length, 0);
    // what is saved reads back the same
    lifetimeRecordsCache = null;
    assert.equal(typeof loadLifetimeRecords().runs, "number");
  `);
});

test("KARMA drops: the nth main BOSS at n x 10% (the twins roll once), +8 for beating the game, demons 90%, Archangels 3 always", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    assert.equal(karmaBalance(), 0);
    // 1st main BOSS: 10%
    Math.random = () => 0.099;
    collectionNoteElimination({ isBoss: true, uniqueKey: "zilon", name: "Zilon" });
    assert.equal(karmaBalance(), 1);
    // 2nd: 20%, a 0.21 roll misses
    Math.random = () => 0.21;
    collectionNoteElimination({ isBoss: true, uniqueKey: "dantre", name: "Dantre" });
    assert.equal(karmaBalance(), 1);
    // the twins are one BOSS: Petros alone does not roll, Pavlos makes it the 3rd (30%)
    Math.random = () => 0.29;
    collectionNoteElimination({ isBoss: true, uniqueKey: "petros", name: "Petros" });
    assert.equal(karmaBalance(), 1);
    assert.equal(collectionRun().karmaRolled, 2);
    collectionNoteElimination({ isBoss: true, uniqueKey: "pavlos", name: "Pavlos" });
    assert.equal(karmaBalance(), 2);
    assert.equal(collectionRun().karmaRolled, 3);
    // the rest; the 8th BOSS beats the game: +8, then its own 80% roll
    Math.random = () => 0.99;
    for (const key of ["pyros", "threon", "kalha", "serafim"]) collectionNoteElimination({ isBoss: true, uniqueKey: key, name: key });
    assert.equal(karmaBalance(), 2);
    Math.random = () => 0.79;
    collectionNoteElimination({ isBoss: true, uniqueKey: "padma", name: "Padma" });
    assert.equal(karmaBalance(), 2 + 8 + 1);
    assert.equal(collectionRun().karma, 11);
    // demons 90%, YOU in a demon's place too; Archangels 3, always
    Math.random = () => 0.89;
    collectionNoteElimination({ isBoss: true, goeticKey: GOETIC_BOSS_KEYS[0], name: "Demon" });
    assert.equal(karmaBalance(), 12);
    Math.random = () => 0.9;
    collectionNoteElimination({ isBoss: true, shadowOf: GOETIC_BOSS_KEYS[1], name: "YOU" });
    assert.equal(karmaBalance(), 12);
    Math.random = () => 0.999;
    collectionNoteElimination({ isBoss: true, archangelKey: ARCHANGEL_KEYS[0], name: "Michael" });
    assert.equal(karmaBalance(), 15);
    // DAMNED drop nothing, PvP counts nothing
    Math.random = () => 0;
    collectionNoteElimination({ name: "Yannis" });
    assert.equal(karmaBalance(), 15);
    state.mode = "pvp";
    collectionNoteElimination({ isBoss: true, goeticKey: GOETIC_BOSS_KEYS[2], name: "Demon" });
    assert.equal(karmaBalance(), 15);
    state.mode = "arcade";
    // the death card shows what the run earned
    assert.ok(renderOverlay() === renderOverlay());
    state.gameOver = true;
    assert.ok(renderOverlay().includes("+15"));
  `);
});

test("Jesus' Gifts: three packs whose odds match the table, Trinity/Planetary/Anael only from gifts", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    assert.deepEqual(GIFT_PACKS.map((pack) => [pack.key, pack.price]), [["myrrh", 44], ["frankincense", 88], ["gold", 166]]);
    const sum = (pack) => Object.values(pack.odds).reduce((total, odds) => total + odds, 0);
    assert.ok(Math.abs(sum(giftPack("myrrh")) - 100) < 0.01);
    assert.ok(Math.abs(sum(giftPack("frankincense")) - 100) < 0.01);
    assert.ok(Math.abs(sum(giftPack("gold")) - 100) < 0.01);
    assert.deepEqual(GIFT_PACKS.map((pack) => [pack.odds.trinity, pack.odds.satan]), [[1.333, 0.666], [1.333, 0.666], [1.333, 0.666]]);
    assert.deepEqual(GIFT_PACKS.map(giftRefund), [22, 44, 83]);
    // every kind has something to give, and the Ars Goetia are the 72
    GIFT_KINDS.forEach((kind) => assert.ok(giftKindItems(kind.key).length, kind.key));
    assert.equal(giftKindItems("goetia").length, 72);
    assert.ok(giftKindItems("archangel").includes("p103"));
    // gift-only SEALS: locked, no achievement opens them
    for (const id of ["p103", ...giftKindItems("planet"), ...giftKindItems("trinity")]) {
      assert.equal(isSealLocked(id), true, id);
      assert.equal(SEAL_UNLOCKS[id].gift, true, id);
      assert.equal(sealUnlockMet(id), false, id);
    }
    // the other locked SEALS keep their achievement and say a gift can bring them too
    assert.ok(!SEAL_UNLOCKS.p74.gift);
    assert.ok(collectionInfoHtml("p74").includes("Or find it in one of Jesus' Gifts."));
    assert.ok(!collectionInfoHtml("p103").includes("Or find it in one of Jesus' Gifts."));
    // no more buying with KARMA in the Collection
    loadCollectionProgress().karma = 999;
    assert.ok(!renderCollectionScreen("menu").includes("data-collection-karma"));
    assert.ok(!renderCollectionScreen("menu").includes("data-karma-price"));
  `);
});

test("Jesus' Gifts: opening a pack spends KARMA, unlocks what it rolls, and refunds half on a duplicate", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    globalThis.window = globalThis;
    const progress = loadCollectionProgress();
    const randoms = (...values) => { Math.random = () => values.length ? values.shift() : 0; };
    progress.karma = 40;
    assert.deepEqual(openGift("myrrh"), { error: "karma" });
    assert.equal(karmaBalance(), 40);
    // Myrrh: the first 57 of 100 are Ars Goetia; the item roll picks the demon
    progress.karma = 100;
    randoms(0, 0);
    const demon = openGift("myrrh");
    assert.equal(demon.kind, "goetia");
    assert.equal(demon.item, GOETIC_BOSS_KEYS[0]);
    assert.equal(demon.duplicate, false);
    assert.equal(isDemonSlain(GOETIC_BOSS_KEYS[0]), true);
    assert.equal(karmaBalance(), 56);
    // the same demon again: half of 44 back
    randoms(0, 0);
    const again = openGift("myrrh");
    assert.equal(again.duplicate, true);
    assert.equal(again.refund, 22);
    assert.equal(karmaBalance(), 56 - 44 + 22);
    // Gold: Goetia 5, Planetary 40, so 0.2 of the total lands on a Planetary SEAL
    progress.karma = 400;
    randoms(0.2, 0);
    const seal = openGift("gold");
    assert.equal(seal.kind, "planet");
    assert.equal(seal.item, giftKindItems("planet")[0]);
    assert.equal(isSealLocked(seal.item), false);
    assert.equal(karmaBalance(), 400 - 166);
    // the very top of the roll is the Seal of Satan
    randoms(0.99999, 0);
    const satan = openGift("gold");
    assert.equal(satan.kind, "satan");
    assert.equal(isSealLocked("p111"), false);
    // a SEAL that was never locked is a duplicate too: half of 166 back
    progress.unlocked = progress.unlocked.filter((id) => id !== "p111");
    assert.equal(giftAlreadyOwned("planet", "p2"), true);
    // it persists with the collection
    saveCollectionProgress();
    const saved = JSON.parse(localStorage.getItem("dearthCollectionV2"));
    assert.equal(saved.karma, karmaBalance());
    assert.ok(saved.unlocked.includes(seal.item));
  `);
});

test("Jesus' Gifts screen: Jesus on the left, the three vessels on a table, odds, and the menu wiring", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    loadCollectionProgress().karma = 50;
    state.menuGiftsOpen = true;
    state.giftsSelected = "frankincense";
    const html = renderGiftsScreen();
    assert.ok(html.includes('class="gifts-jesus"'));
    assert.ok(html.includes("Jesus' Gifts"));
    assert.equal((html.match(/data-gift-pick=/g) || []).length, 3);
    for (const name of ["Myrrh", "Frankincense", "Gold"]) assert.ok(html.includes(name), name);
    assert.ok(html.includes("Seal of Satan") && html.includes("0.666%"));
    assert.ok(html.includes("Already yours: 44"));
    // 50 is short of Frankincense's 88
    assert.ok(html.includes("gifts-short"));
    assert.ok(renderMenuApp().includes("gifts-screen"));
    state.menuGiftsOpen = false;
    assert.ok(!renderMenuApp().includes("gifts-screen"));
    assert.ok(GAME_SFX.karmaGain && GAME_SFX.karmaUnlock && GAME_SFX.introBurn);
  `);
});

// ---- Artifact SEALS (Pentacles of the Moon) and the new Seal of Amy ----
const ARTIFACT_TEST_STUBS = `
  globalThis.render = () => {};
  globalThis.playGameSfx = () => {};
  globalThis.playSfx = () => {};
  globalThis.playArtifactSfx = () => {};
  globalThis.playSealPurchaseSfx = () => {};
  globalThis.closeMobileOfferingsForTargetPick = () => {};
`;

test("1st Pentacle of the Moon keeps the old Seal of Amy Dagger effect; Seal of Amy stays the demon Amy's Goetic SEAL", () => {
  game()(`
    ${ARTIFACT_TEST_STUBS}
    assert.equal(ITEMS.p70.name, "1st Pentacle of the Moon");
    assert.equal(ITEMS.p134.name, "Seal of Amy");
    assert.equal(GOETIC_BOSS_SPECS.find((spec) => spec.key === "amy").passiveId, "p134");
    assert.ok(GOETIC_BOSS_PASSIVE_IDS.includes("p134") && !GOETIC_BOSS_PASSIVE_IDS.includes("p70"));
    fixture([["p70"]], [50, 50]);
    assert.equal(sacrificialDaggerExtraDamage(), 10);
    assert.ok(artifactDescription(ITEMS.a15).includes("1st Pentacle of the Moon"));
    // a living Goetic BOSS Amy switches off the new Seal of Amy, not the Dagger pentacle
    const boss = state.bots[0];
    boss.isBoss = true;
    boss.goeticKey = "amy";
    boss.goeticPassiveId = "p134";
    boss.goeticSealName = "Seal of Amy";
    assert.equal(isSealSuppressed("p70"), false);
    assert.equal(isSealSuppressed("p134"), true);
    // a saved Goetic BOSS Amy from before the change points at the new SEAL after loading
    boss.goeticPassiveId = "p70";
    normalizeLoadedArcadeRun();
    assert.equal(boss.goeticPassiveId, "p134");
    assert.equal(isSealSuppressed("p70"), false);
  `);
});

test("every Artifact SEAL doubles its ARTIFACT in the Devil's Offerings and is in the collection, catalog and art", () => {
  const run = game();
  const catalog = fs.readFileSync(path.join(root, "ITEMS.txt"), "utf8").replace(/\r\n/g, "\n");
  run(`
    fixture([], [50]);
    const count = (id) => activeShopPool().filter((entry) => entry === id).length;
    for (const [artifactId, sealId] of Object.entries(ARTIFACT_SEAL_BY_ARTIFACT)) {
      state.player.passives = [];
      assert.equal(count(artifactId), 1);
      state.player.passives = [itemCopy(sealId)];
      assert.equal(count(artifactId), 2, sealId);
      assert.equal(activeShopPool().length, ACTIVE_IDS.length + 1);
    }
    assert.deepEqual(Array.from(collectionSections().find((section) => section.key === "artifact").ids), ["p70", "p135", "p136", "p137", "p138", "p139"]);
  `);
  for (const id of ["p70", "p134", "p135", "p136", "p137", "p138", "p139"]) {
    const item = run(`ITEMS.${id}`);
    assert.ok(catalog.includes(`${item.name} (${item.price} SIN)\n${item.description}`), id);
    assert.ok(run(`splitEliteDescription(ITEMS.${id}.description).elite`).length, id);
    assert.ok(run(`itemDescription({ ...ITEMS.${id}, stack: 2 })`).length, id);
    assert.ok(fs.existsSync(path.join(root, run(`sealSigilPath("${id}")`))), id);
    assert.equal(run(`sealIdFromStatSource(ITEMS.${id}.name)`), id);
    // the Moon's SEALS only come from Jesus' Gifts; the Seal of Amy is a Goetic SEAL, always open
    assert.ok(run(id === "p134" ? `collectibleSealIds().includes("${id}") && !isSealLocked("${id}")` : `collectibleSealIds().includes("${id}") && isSealLocked("${id}") && SEAL_UNLOCKS["${id}"].gift === true`), id);
  }
});

test("2nd Pentacle of the Moon: Funeral Coin spreads 6-16 BOUNTY among the DAMNED instead of paying you (ELITE +4)", () => {
  for (const [stack, roll, expected] of [[1, 0, 6], [1, 0.999, 16], [2, 0, 10], [3, 0.999, 24]]) {
    game()(`
      ${ARTIFACT_TEST_STUBS}
      fixture([["p135", ${stack}]], [50, 50, 50]);
      state.stage = "active";
      state.player.credits = 5;
      const before = state.bots.reduce((sum, bot) => sum + botRegularBounty(bot), 0);
      state.player.actives = [itemCopy("a10")];
      Math.random = () => ${roll};
      useActive(0);
      assert.equal(state.player.credits, 5);
      assert.equal(state.bots.reduce((sum, bot) => sum + botRegularBounty(bot), 0) - before, ${expected});
      assert.ok(state.roundState.triggeredPassiveIds.has("p135"));
    `);
  }
  // without the SEAL it still pays 3-10 SIN
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([], [50, 50]);
    state.stage = "active";
    state.player.actives = [itemCopy("a10")];
    Math.random = () => 0;
    useActive(0);
    assert.equal(state.player.credits, 3);
  `);
});

test("3rd Pentacle of the Moon: Inverted Cross pushes the DAMNED's guess away from the final TARGET by its MEMORY (ELITE +3 MEMORY)", () => {
  for (const [stack, guess, expected] of [[1, 60, 64], [1, 30, 26], [1, 98, 100], [2, 60, 67]]) {
    game()(`
      ${ARTIFACT_TEST_STUBS}
      fixture([["p136", ${stack}]], [${guess}, 50, 50]);
      state.round = 10;
      const crossed = state.bots[0];
      crossed.memory = initialMemoryEntries(4);
      state.stage = "active";
      state.roundState.playerEffectiveGuess = 50;
      state.player.actives = [itemCopy("a9")];
      useActive(0);
      chooseBot(crossed.id);
      assert.ok(state.roundState.removedBotIds.has(crossed.id));
      assert.equal(crossed.memory.length, ${stack === 2 ? 7 : 4});
      applyPenalties();
      // its guess left the average, so the TARGET is 0.8 x 50 = 40 whatever it was pushed to
      assert.equal(state.roundState.target, 40);
      assert.equal(state.roundState.botEffectiveGuesses.get(crossed.id), ${expected});
      assert.ok(state.roundState.triggeredPassiveIds.has("p136"));
    `);
  }
});

test("4th Pentacle of the Moon: Cursed Chalice adds +2% max SOUL to your CRITICAL this round (ELITE +1% each level)", () => {
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([["p137"]], [50, 50]);
    state.stage = "active";
    state.player.actives = [itemCopy("a22")];
    useActive(0);
    assert.equal(state.roundState.artifactCriticalRangeBonus, 1);
    assert.equal(playerCriticalDamageTotal({ kind: "bot", bot: state.bots[0] }), 120);
    assert.equal(criticalSummaryForHitter({ key: "player", kind: "player" }), "12% max SOUL");
  `);
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([["p137", 3]], [50, 50]);
    state.stage = "active";
    state.player.actives = [itemCopy("a22"), itemCopy("a22")];
    useActive(0);
    useActive(0);
    assert.equal(state.roundState.artifactCriticalRangeBonus, 2);
    assert.equal(playerCriticalDamageTotal({ kind: "bot", bot: state.bots[0] }), 180);
  `);
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([], [50, 50]);
    state.stage = "active";
    state.player.actives = [itemCopy("a22")];
    useActive(0);
    assert.equal(playerCriticalDamageTotal({ kind: "bot", bot: state.bots[0] }), 100);
  `);
});

test("5th Pentacle of the Moon: Mummified Lamb hits a revealed DAMNED for 30% (BOSSES 15%), ELITE +5 damage and +3 BOUNTY", () => {
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([["p138"]], [50, 50, 50]);
    state.stage = "active";
    const revealed = state.bots.find((bot) => bot.revealedByPassive);
    const hidden = state.bots.find((bot) => !bot.revealedByPassive);
    state.player.actives = [itemCopy("a25"), itemCopy("a25")];
    useActive(0);
    chooseBot(revealed.id);
    useActive(0);
    chooseBot(hidden.id);
    assert.equal(revealed.lastDamage, 300);
    assert.equal(hidden.lastDamage, 0);
    assert.equal(state.pendingNextRoundLambReveals.length, 2);
    assert.ok(state.roundState.triggeredPassiveIds.has("p138"));
  `);
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([["p138", 3]], [50, 50, 50]);
    state.stage = "active";
    const boss = state.bots.find((bot) => bot.revealedByPassive);
    boss.isBoss = true;
    state.player.actives = [itemCopy("a25")];
    useActive(0);
    chooseBot(boss.id);
    assert.equal(boss.lastDamage, 150 + 10);
    assert.equal(state.pendingNextRoundLambReveals[0].sealBounty, 6);
    const before = botRegularBounty(boss);
    applyPendingNextRoundLambReveals();
    assert.equal(botRegularBounty(boss) - before, 9);
  `);
});

test("6th Pentacle of the Moon: Vial of Blood eliminates the first DAMNED; the second overheals by its SOUL and turns STUBBORN (ELITE +5 BOUNTY)", () => {
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([["p139", 2]], [50, 50, 50]);
    const [first, second] = state.bots;
    first.hp = 700;
    second.hp = 400;
    setBotPersonality(second, "Analyst", "", { triggerAlterationDamage: false });
    const bountyBefore = botRegularBounty(second);
    const sinBefore = state.player.credits;
    state.player.actives = [{ ...ITEMS.a11, uid: "vial-1" }];
    state.pendingActive = { index: 0, uid: "vial-1", id: "a11", mode: "bot", step: "damage" };
    resolveBloodVial(first);
    assert.equal(first.eliminated, true);
    assert.ok(state.player.credits > sinBefore, "the first DAMNED still pays its BOUNTY");
    resolveBloodVial(second);
    assert.equal(second.hp, 1100);
    assert.equal(personalityType(second), "Stubborn");
    assert.equal(botRegularBounty(second) - bountyBefore, 5);
    assert.equal(state.pendingActive, null);
    assert.ok(state.roundState.triggeredPassiveIds.has("p139"));
  `);
  // the Vial ends at once when the first pick's death leaves no one to overheal
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([["p139"], ["p19"]], [50, 50, 50]);
    const [first, second, third] = state.bots;
    second.isBoss = true;
    third.hp = 5; // Seal of Sabnock's 5 damage on the first death finishes it
    state.player.actives = [{ ...ITEMS.a11, uid: "vial-1" }];
    state.pendingActive = { index: 0, uid: "vial-1", id: "a11", mode: "bot", step: "damage" };
    resolveBloodVial(first);
    assert.equal(third.eliminated, true);
    assert.equal(state.pendingActive, null);
    assert.equal(state.player.actives.length, 0);
  `);
});

test("Seal of Amy acts as a random Player SEAL each round as ELITE, ELITE Amy as ELITE +3, ELITE +2 Amy as ELITE +5", () => {
  game()(`
    ${ARTIFACT_TEST_STUBS}
    // Amy joins after the fixture's round start, so only the copy set here acts
    fixture([], [50, 50, 50]);
    const amy = itemCopy("p134");
    state.player.passives = [amy];
    amy.amyCopiedId = "p63"; // Seal of Vual
    amy.amyCopiedRound = state.round;
    assert.equal(passiveStack("p63"), 2);
    const entry = orderedPassiveEffectEntries("p63")[0];
    assert.equal(entry.stack, 2);
    assert.equal(entry.sourceId, "p134");
    amy.stack = 2;
    assert.equal(passiveStack("p63"), 4);
    amy.stack = 3;
    assert.equal(passiveStack("p63"), 6);
    amy.stack = 1;
    // the copied effect works and is counted for Amy: Vual's 7 extra damage, x1.5 as ELITE
    const revealed = state.bots.find((bot) => bot.revealedByPassive);
    damageBot(revealed, 10, "test hit", "Test");
    assert.equal(revealed.lastDamage, 10 + 11);
    assert.ok(state.roundState.triggeredPassiveIds.has("p134"));
    assert.equal(state.sealStats.p134.damage, 11);
    assert.ok(itemDescription(amy).includes("This round: ELITE I Seal of Vual."));
    // a living Goetic BOSS Vual switches the copy off
    const boss = state.bots.find((bot) => !bot.revealedByPassive);
    boss.isBoss = true;
    boss.goeticPassiveId = "p63";
    assert.equal(passiveStack("p63"), 0);
    boss.isBoss = false;
    boss.goeticPassiveId = null;
    // the copy lasts only its round
    state.round += 1;
    assert.equal(passiveStack("p63"), 0);
    // every round start rolls a new Player SEAL: never Amy, never a SEAL outside the 72 Goetic ones
    let seed = 7;
    Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const seen = new Set();
    for (let index = 0; index < 60; index += 1) {
      beginRound();
      const copied = amyCopyThisRound(amy);
      assert.ok(GOETIC_BOSS_PASSIVE_IDS.includes(copied) && copied !== "p134", copied);
      seen.add(copied);
    }
    assert.ok(seen.size > 10);
  `);
  // bought in the middle of a round, it takes a Player SEAL at once
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([], [50, 50, 50]);
    state.player.credits = 100;
    state.shop = [{ item: itemCopy("p134"), sold: false }];
    buyShopItem(0);
    assert.ok(amyCopyThisRound(passiveEntry("p134")));
  `);
});

// ---- Poison SEALS (Pentacles of Mars) ----
// a round with no SEALS, then the given Poison SEALS and no POISON yet (the fixture's own round start stays clean)
function poisonRound(passives, guesses = [50, 50, 50, 50, 50]) {
  return `
    fixture([], ${JSON.stringify(guesses)});
    state.player.passives = ${passives}.map(([id, stack = 1]) => ({ ...ITEMS[id], stack }));
    state.bots.forEach((bot) => { bot.poisonCounters = 0; bot.lastDamage = 0; });
    globalThis.render = () => {};
  `;
}

test("POISON deals 5 damage per stack at the end of every round, and ELITE 4th/5th/6th Pentacles of Mars raise it", () => {
  for (const [passives, perStack] of [["[]", 5], ['[["p143", 2]]', 7], ['[["p143", 3], ["p144", 2], ["p145", 3]]', 12]]) {
    game()(`
      ${poisonRound(passives)}
      state.roundState.revealedBotIds = new Set();
      state.bots.forEach((bot) => { bot.revealedByPassive = false; setBotPersonality(bot, "Analyst", "", { triggerAlterationDamage: false }); });
      state.bots[0].poisonCounters = 3;
      applyEndOfRoundPassives();
      assert.equal(poisonDamagePerStack(), ${perStack});
      assert.equal(state.bots[0].lastDamage, 3 * ${perStack});
      assert.equal(state.bots[1].lastDamage, 0);
      assert.equal(state.bots[0].poisonCounters, 3, "POISON stays");
      assert.equal(state.bots[0].poisonDamageTaken, 3 * ${perStack});
      applyEndOfRoundPassives();
      assert.equal(state.bots[0].poisonDamageTaken, 6 * ${perStack}, "the total keeps adding up");
    `);
  }
});

test("1st Pentacle of Mars: a random DAMNED gets 1 POISON per 80 max SOUL (at least 1), ELITE -25% SOUL needed", () => {
  for (const [stack, maxHp, expected] of [[1, 1000, 12], [1, 40, 1], [2, 1000, 16], [3, 1000, 22]]) {
    game()(`
      ${poisonRound(`[["p140", ${stack}]]`)}
      state.bots.forEach((bot) => { bot.hp = bot.maxHp = ${maxHp}; });
      Math.random = () => 0;
      applyPoisonStartOfRound();
      assert.equal(state.bots[0].poisonCounters, ${expected});
      assert.equal(state.bots.reduce((sum, bot) => sum + bot.poisonCounters, 0), ${expected});
      assert.ok(state.roundState.triggeredPassiveIds.has("p140"));
    `);
  }
});

test("2nd Pentacle of Mars: a random DAMNED gets 1 POISON per 5 MEMORY, ELITE +2 POISON each level", () => {
  for (const [stack, memory, expected] of [[1, 12, 2], [3, 12, 6], [1, 4, 0], [2, 0, 2]]) {
    game()(`
      ${poisonRound(`[["p141", ${stack}]]`)}
      state.round = 20;
      state.bots[0].memory = initialMemoryEntries(${memory});
      Math.random = () => 0;
      applyPoisonStartOfRound();
      assert.equal(state.bots[0].poisonCounters, ${expected});
      assert.equal(state.roundState.triggeredPassiveIds.has("p141"), ${expected > 0});
    `);
  }
});

test("3rd Pentacle of Mars: your CRITICAL gives every DAMNED POISON (ELITE +1); a POISONED death spreads half, BOSSES first", () => {
  for (const [stack, expected] of [[1, 1], [3, 3]]) {
    const run = game();
    run(critRound(`[["p142", ${stack}]]`, "state.bots.forEach((bot) => { bot.poisonCounters = 0; });"));
    assert.deepEqual(JSON.parse(run("JSON.stringify(activeBots().map((bot) => bot.poisonCounters))")), Array(5).fill(expected));
  }
  game()(`
    ${poisonRound('[["p142"]]')}
    const [dying, boss, other] = state.bots;
    boss.isBoss = true;
    dying.poisonCounters = 7;
    dying.hp = 1;
    damageBot(dying, 5, "test", "Test");
    assert.equal(dying.eliminated, true);
    assert.equal(boss.poisonCounters, 3);
    assert.equal(other.poisonCounters, 0);
    // with no BOSS alive, it spreads among every other DAMNED
    boss.isBoss = false;
    state.bots.forEach((bot) => { if (!bot.eliminated) bot.poisonCounters = 0; });
    const second = state.bots[3];
    second.poisonCounters = 5;
    second.hp = 1;
    damageBot(second, 5, "test", "Test");
    assert.equal(activeBots().reduce((sum, bot) => sum + bot.poisonCounters, 0), 2);
  `);
});

test("4th Pentacle of Mars: every DAMNED revealed at the start of the round gets 2 POISON", () => {
  game()(`
    ${poisonRound('[["p143"]]')}
    state.bots.forEach((bot, index) => { bot.revealedByPassive = index < 2; });
    applyPoisonStartOfRound();
    assert.deepEqual(state.bots.map((bot) => bot.poisonCounters), [2, 2, 0, 0, 0]);
    assert.ok(state.roundState.triggeredPassiveIds.has("p143"));
  `);
});

test("5th Pentacle of Mars: a DAMNED that gains BOUNTY gets 1 POISON, losing BOUNTY gives none", () => {
  game()(`
    ${poisonRound('[["p144"]]')}
    const [gainer, loser] = state.bots;
    changeBotSin(gainer, 4, "", { triggerLossDamage: false });
    changeBotSin(gainer, 2, "", { triggerLossDamage: false });
    loser.reward = 5;
    changeBotSin(loser, -3, "", { triggerLossDamage: false });
    assert.equal(gainer.poisonCounters, 2);
    assert.equal(loser.poisonCounters, 0);
    assert.ok(state.roundState.triggeredPassiveIds.has("p144"));
  `);
});

test("6th Pentacle of Mars: STUBBORN DAMNED get 1 POISON at the end of the round, after POISON has dealt its damage", () => {
  game()(`
    ${poisonRound('[["p145"]]')}
    state.bots.forEach((bot, index) => setBotPersonality(bot, index < 2 ? "Stubborn" : "Analyst", "", { triggerAlterationDamage: false }));
    state.bots.forEach((bot) => { bot.revealedByPassive = false; bot.lastDamage = 0; });
    applyEndOfRoundPassives();
    assert.deepEqual(state.bots.map((bot) => bot.poisonCounters), [1, 1, 0, 0, 0]);
    // new POISON starts hurting next round
    assert.deepEqual(state.bots.map((bot) => bot.lastDamage), [0, 0, 0, 0, 0]);
  `);
});

test("7th Pentacle of Mars: the two most POISONED take 15 (ELITE x1.5), lose 1 POISON and poison their neighbours", () => {
  for (const [stack, damage] of [[1, 15], [2, 23]]) {
    game()(`
      ${poisonRound(`[["p146", ${stack}]]`)}
      state.bots.forEach((bot) => { bot.revealedByPassive = false; setBotPersonality(bot, "Analyst", "", { triggerAlterationDamage: false }); });
      state.bots[1].poisonCounters = 4;
      state.bots[3].poisonCounters = 2;
      state.bots[4].poisonCounters = 1;
      applyEndOfRoundPassives();
      // POISON first (20, 10, 5), then the SEAL hits bots 1 and 3
      assert.deepEqual(state.bots.map((bot) => bot.lastDamage), [0, 20 + ${damage}, 0, 10 + ${damage}, 5]);
      // bot 1 lost 1 and gave 1 to bots 0 and 2; bot 3 lost 1 and gave 1 to bots 2 and 4
      assert.deepEqual(state.bots.map((bot) => bot.poisonCounters), [1, 3, 2, 1, 2]);
    `);
  }
  game()(`
    ${poisonRound('[["p146"]]')}
    state.bots.forEach((bot) => { bot.revealedByPassive = false; setBotPersonality(bot, "Analyst", "", { triggerAlterationDamage: false }); });
    applyEndOfRoundPassives();
    assert.equal(state.bots.reduce((sum, bot) => sum + bot.poisonCounters, 0), 2);
    assert.equal(state.bots.filter((bot) => bot.poisonCounters === 1).length, 2);
    assert.ok(state.bots.every((bot) => bot.lastDamage === 0));
  `);
});

test("the Poison SEALS are in the collection, catalog and art, and POISON shows as a skull beside max SOUL", () => {
  const run = game();
  const catalog = fs.readFileSync(path.join(root, "ITEMS.txt"), "utf8").replace(/\r\n/g, "\n");
  run(`
    assert.deepEqual(Array.from(collectionSections().find((section) => section.key === "poison").ids), POISON_SEAL_IDS);
    assert.ok(SEAL_BUILDS.some((build) => build.key === "poison"));
    ${poisonRound("[]")}
    state.bots[0].poisonCounters = 3;
    globalThis.performance = globalThis.performance || { now: () => 0 };
    const poisoned = renderBot(state.bots[0], false);
    assert.ok(poisoned.includes('class="poison-stack-label poison-label"') && poisoned.includes("poison-skull"));
    // no number beside the skull: the stacks, the damage each round and the total taken are in its tooltip
    const labelStart = poisoned.indexOf("poison-label");
    const label = poisoned.slice(labelStart, poisoned.indexOf("</span>", labelStart));
    assert.ok(label.trim().endsWith("</svg>"), label.slice(-40));
    state.bots[0].poisonDamageTaken = 45;
    assert.deepEqual(poisonTooltipText(state.bots[0]).split(String.fromCharCode(10)), ["3 POISON", "Takes 15 damage at the end of every round (5 per POISON).", "POISON damage taken so far: 45."]);
    assert.ok(!renderBot(state.bots[1], false).includes("poison-label"));
  `);
  for (const id of ["p140", "p141", "p142", "p143", "p144", "p145", "p146"]) {
    const item = run(`ITEMS.${id}`);
    assert.ok(catalog.includes(`${item.name} (${item.price} SIN)\n${item.description}`), id);
    assert.ok(run(`splitEliteDescription(ITEMS.${id}.description).elite`).length, id);
    assert.ok(run(`itemDescription({ ...ITEMS.${id}, stack: 3 })`).includes("POISON"), id);
    assert.ok(fs.existsSync(path.join(root, run(`sealSigilPath("${id}")`))), id);
    assert.ok(run(`sealBuilds("${id}").includes("poison") && collectibleSealIds().includes("${id}") && isSealLocked("${id}") && SEAL_UNLOCKS["${id}"].gift === true`), id); // only Jesus' Gifts unlock it
  }
});

// ---- Pause > DEV: SEAL search and grant ----
test("Dev SEAL search suggests SEALS named like what you type, best matches first", () => {
  game()(`
    fixture([], [50, 50]);
    assert.equal(devSealSuggestions("bae")[0], "p16");
    assert.equal(ITEMS[devSealSuggestions("Seal of Ba")[0]].name.startsWith("Seal of Ba"), true);
    // a word inside the name
    assert.ok(devSealSuggestions("moon").every((id) => ITEMS[id].name.includes("Moon")));
    assert.equal(devSealSuggestions("pentacle of mars", 10).length, 7);
    // a small typo still finds it
    assert.ok(devSealSuggestions("astarot").includes("p84"));
    assert.ok(devSealSuggestions("asmodai").some((id) => ITEMS[id].name === "Seal of Asmoday"));
    assert.ok(devSealSuggestions("cassiels").some((id) => ITEMS[id].name.includes("Cassiel")));
    // several words, each starting a word of the name, in any order
    assert.equal(devSealSuggestions("7th mars")[0], "p146");
    assert.equal(devSealSuggestions("mars 7")[0], "p146");
    assert.ok(devSealSuggestions("pentacle marz", 10).includes("p146"));
    assert.deepEqual(devSealSuggestions(""), []);
    assert.deepEqual(devSealSuggestions("zzzzqqq"), []);
    assert.ok(devSealSuggestions("e").length <= 6);
    // an exact name, with or without "Seal of", or the only match, picks one SEAL
    assert.equal(devResolveSealQuery("bael").id, "p16");
    assert.equal(devResolveSealQuery("SEAL OF BAEL").id, "p16");
    assert.equal(devResolveSealQuery("7th pentacle of mars").id, "p146");
    assert.equal(devResolveSealQuery("pentacle").id, null);
    assert.ok(devResolveSealQuery("pentacle").note.includes("Several"));
    assert.equal(devResolveSealQuery("zzzzqqq").id, null);
  `);
});

test("Dev SEAL grant gives the SEAL into an empty slot, upgrades one you have, and gives nothing when slots are full", () => {
  game()(`
    globalThis.playSealPurchaseSfx = () => {};
    globalThis.render = () => {};
    fixture([], [50, 50]);
    state.player.passives = [];
    assert.equal(passiveLimit(), 3);
    assert.equal(devGrantSeal("p16").ok, true);
    assert.deepEqual(state.player.passives.map((item) => [item.id, item.stack || 1]), [["p16", 1]]);
    // already owned: upgraded once, no new slot used
    const upgraded = devGrantSeal("p16");
    assert.equal(upgraded.ok, true);
    assert.ok(upgraded.note.includes("ELITE"));
    assert.deepEqual(state.player.passives.map((item) => [item.id, item.stack]), [["p16", 2]]);
    devGrantSeal("p140");
    devGrantSeal("p70");
    assert.equal(state.player.passives.length, 3);
    // full: a new SEAL is refused, but owned ones can still be upgraded
    const refused = devGrantSeal("p63");
    assert.equal(refused.ok, false);
    assert.equal(refused.note, "Your SEAL slots are full.");
    assert.equal(state.player.passives.length, 3);
    assert.equal(devGrantSeal("p140").ok, true);
    assert.equal(passiveEntry("p140").stack, 2);
    // SEALS that cannot be upgraded say so
    state.player.passives = [itemCopy("p98")];
    const kalha = devGrantSeal("p98");
    assert.equal(kalha.ok, false);
    assert.ok(kalha.note.includes("cannot be upgraded"));
  `);
});

test("DRIFTER: hard to predict but never trolling: always within 22 of where it aims, wild guesses drift instead of 0 or 100", () => {
  game()(`
    fixture([], [10, 20, 30, 40, 50]);
    const drifter = BOT_ARCHETYPES.find((entry) => entry.type === "Drifter");
    const persona = { type: "Drifter", anchor: drifter.anchor, aggression: drifter.aggression, noise: drifter.noise };
    // last round's TARGET was 44 and the table matched it
    const bot = { memory: [{ target: 44, tableAverage: 44 / 0.8, playerGuess: 44, botAverage: 55 }] };
    state.roundState.targetModifier = 0.8;
    const realRandom = Math.random;
    // every roll lands: the swing and the wild guess both fire
    Math.random = () => 0;
    const wild = planPersonaGuess(bot, persona);
    assert.ok(wild >= 44 - DRIFTER_MAX_DRIFT && wild <= 44 + DRIFTER_MAX_DRIFT, String(wild));
    assert.ok(wild > 5);
    Math.random = realRandom;
    let farthest = 0;
    for (let i = 0; i < 3000; i += 1) farthest = Math.max(farthest, Math.abs(planPersonaGuess(bot, persona) - 44));
    assert.ok(farthest <= DRIFTER_MAX_DRIFT, String(farthest));
    // before it remembers anything it stays around its anchor
    const fresh = { memory: [] };
    for (let i = 0; i < 1000; i += 1) {
      const guess = planPersonaGuess(fresh, persona);
      assert.ok(Math.abs(guess - drifter.anchor) <= DRIFTER_MAX_DRIFT);
    }
  `);
});

test("POISON damage is credited to the SEAL that gave the POISON, by its share of the stacks (Shift on the SEAL)", () => {
  game()(`
    ${poisonRound('[["p140"], ["p141"]]')}
    state.roundState.revealedBotIds = new Set();
    state.bots.forEach((bot) => { bot.revealedByPassive = false; setBotPersonality(bot, "Analyst", "", { triggerAlterationDamage: false }); });
    addBotPoison(state.bots[0], 3, "p140");
    addBotPoison(state.bots[0], 1, "p141");
    state.bots[1].poisonCounters = 2; // POISON from an old save: nobody is credited for it
    applyEndOfRoundPassives();
    assert.equal(state.bots[0].lastDamage, 20);
    assert.equal(state.sealStats.p140.poisonDamage, 15);
    assert.equal(state.sealStats.p141.poisonDamage, 5);
    assert.ok(sealContributionDetails({ id: "p140" }).includes("15 POISON damage dealt"));
    assert.ok(sealContributionDetails({ id: "p141" }).includes("5 POISON damage dealt"));
    applyEndOfRoundPassives();
    assert.equal(state.sealStats.p140.poisonDamage, 30, "it keeps adding up over the run");
  `);
});

test("removing POISON takes the uncredited stacks first, then from the SEAL that gave the most", () => {
  game()(`
    ${poisonRound('[["p140"], ["p141"]]')}
    const bot = state.bots[0];
    bot.poisonCounters = 1; // one uncredited stack
    addBotPoison(bot, 3, "p140");
    addBotPoison(bot, 2, "p141");
    removeBotPoison(bot, 1);
    assert.equal(bot.poisonCounters, 5);
    assert.equal(JSON.stringify(bot.poisonSources), JSON.stringify({ p140: 3, p141: 2 }));
    removeBotPoison(bot, 1);
    assert.equal(bot.poisonCounters, 4);
    assert.equal(JSON.stringify(bot.poisonSources), JSON.stringify({ p140: 2, p141: 2 }), "the biggest pile loses one");
  `);
});

test("Third Pentacle of Saturn has a 15% base chance (ELITE +5%), the other Seals of Saturn keep 30%", () => {
  game()(`
    assert.equal(devSealChance({ id: "p92", stack: 1 }), 0.15);
    assert.equal(Math.round(devSealChance({ id: "p92", stack: 3 }) * 100), 25);
    assert.equal(devSealEntryChance({ id: "p92", stack: 1 }), 0.15);
    assert.equal(devSealChance({ id: "p93", stack: 1 }), 0.3);
    assert.equal(devSealEntryChance({ id: "p94", stack: 1 }), 0.3);
    assert.ok(itemDescription({ ...ITEMS.p92, stack: 1 }).includes("15%"));
  `);
});

test("Seere and Vassago play their trigger animation as soon as the DAMNED they acted on arrives", () => {
  game()(`
    fixture([["p23"], ["p1"]], [10, 20, 30, 40, 50]);
    render = () => {};
    playGameSfx = () => {};
    setTimeout = () => 0;
    clearTimeout = () => {};
    state.round = 5;
    state.stage = "summary";
    const fallen = state.bots[2];
    fallen.eliminated = true;
    fallen.hp = 0;
    Math.random = () => 0.01;
    advanceAfterSummary();
    const arrived = state.bots[2];
    assert.notEqual(arrived.id, fallen.id);
    assert.ok(arrived.reward >= 7, "Seere gave +6 BOUNTY");
    assert.ok(arrived.memory.length > 0, "Vassago gave MEMORY");
    assert.equal(state.stage, "guess");
    assert.ok(state.roundState.triggeredPassiveIds.has("p23"), "Seere is marked in the new round");
    assert.ok(state.roundState.triggeredPassiveIds.has("p1"), "Vassago is marked in the new round");
    assert.equal(sealStatsFor("p23").triggers, 1, "counted once");
    // the animation starts right away, with only the two arrival SEALS, and they do not play again at READY
    assert.ok(roundRevealAnimationActive());
    assert.deepEqual(state.roundRevealAnimation.sequence.map((step) => step.id).sort(), ["p1", "p23"]);
    assert.ok(state.roundState.animatedPassiveIds.has("p23") && state.roundState.animatedPassiveIds.has("p1"));
    assert.equal(arrived.lastSinDelta, 6, "Seere's +6 shows as a BOUNTY badge");
    finishRoundRevealAnimation();
    // nothing carries over into the round after that
    state.stage = "summary";
    Math.random = () => 0.99;
    advanceAfterSummary();
    assert.ok(!state.roundState.triggeredPassiveIds.has("p23"));
    assert.ok(!roundRevealAnimationActive(), "no animation when nobody new arrived");
  `);
});
