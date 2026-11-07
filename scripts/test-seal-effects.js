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

// puts every conditional reveal SEAL in its "reveal" state: below 50 HEALTH (Vepar), a winning 50% roll (Vine),
// a revealed DAMNED died last round (Naberius) and a DAMNED died last round (Zachriel Triangle)
const REVEAL_CONDITIONS_MET = `
  state.player.hp = 40;
  state.previousRoundRevealedEliminations = 1;
  state.previousRoundEliminationsForMartyrs = 1;
  Math.random = () => 0.1;
`;

test("each reveal seal adds one reveal when its condition holds, independent of elite level, with a shared cap of four", () => {
  for (const id of ["p59", "p61", "p64", "p65", "p102"]) {
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
    p61: "While you are below 50 HEALTH, reveal one extra DAMNED each round.",
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

test("Red Horse and Cassiel's Sigil no longer add reveals; Pyros and Zachriel Triangle still do", () => {
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

test("each boss gets a fresh random 8-12 kill interval, unaffected by round changes", () => {
  game()(`
    fixture([], [50]);
    state.uniqueBossQueue = ["zilon", "dantre", "pyros", "threon", "kalha"];
    const rolls = [0, 0.2, 0.4, 0.6, 0.8, 0.4];
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
    assert.equal(JSON.stringify(intervals), JSON.stringify([8, 9, 10, 11, 12]));
    assert.equal(rollIndex, 6);
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
    assert.equal(state.nextBossKillInterval, 12);
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
    assert.equal(state.nextBossKillInterval, 12);
    assert.equal(state.killsSinceBossSpawn, 6);
    normalizeLoadedArcadeRun();
    assert.equal(state.nextBossKillInterval, 12);
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
    assert.ok(state.nextBossKillInterval >= 8 && state.nextBossKillInterval <= 12);
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

test("Seal of Satan costs 20 SIN and Aggiel Hexagram stacks +20 per PENTAKILL", () => {
  game()(`
    assert.equal(ITEMS.p111.price, 20);
    assert.equal(SELF_STACKING_SEAL_SPECS.p101.increment, 20);
    assert.ok(ITEMS.p101.description.includes("+20 damage"));
  `);
});

test("Aggiel Hexagram: PENTAKILL damage waits for the NEXT end of round and hits the new DAMNED", () => {
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
  // max HEALTH 1000: the CRITICAL goes from 100 to 200
  assert.deepEqual(after.map((value, index) => value - before[index]), [100, 100, 100, 100, 100]);
  assert.equal(charged("state.exactGuessCritCharged"), false);
});

test("Sitri: the most-MEMORY DAMNED gets double HEALTH, gains MEMORY, and only a death passes it on", () => {
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

// ---- worst guess penalty is 10% max HEALTH; new Vepar ----
test("the worst guess penalty is 10% of max HEALTH", () => {
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

test("Vepar spreads the worst guess penalty to every revealed DAMNED", () => {
  game()(`
    fixture([["p61"]], [60, 60, 60, 60, 0]);
    state.bots.forEach(bot => { bot.revealedByPassive = false; bot.revealStacks = 0; });
    revealBotGuess(state.bots[4], "Test");
    revealBotGuess(state.bots[1], "Test");
    state.roundState.targetModifier = 1;
    state.roundState.playerEffectiveGuess = 60;
    applyPenalties();
    assertDamage([10, 110, 10, 10, 150]);
  `);
  game()(`
    fixture([["p61"]], [60, 60, 60, 60, 0]);
    state.bots.forEach(bot => { bot.revealedByPassive = false; bot.revealStacks = 0; });
    revealBotGuess(state.bots[1], "Test");
    state.roundState.targetModifier = 1;
    state.roundState.playerEffectiveGuess = 60;
    applyPenalties();
    assertDamage([10, 10, 10, 10, 150]);
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
    assert.ok(run(`collectibleSealIds().includes("${id}") && !isSealLocked("${id}")`));
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

test("Father: % TARGET difference uses max HEALTH, BOSSES included", () => {
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
  // differences 13, 3, 7: flat damage becomes 13%, 3%, 7% of 1000 max HEALTH
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
  outcome("trinity", `Math.random = () => 0.1;`, `
    assert.deepEqual(state.trinityShopSealsNextShop, ["p131", "p132"]);
    rerollShop();
    assert.deepEqual(state.shop.filter(slot => slot.bonus).map(slot => slot.item.id), ["p131", "p132"]);
    assert.equal(state.shop.length, 5);
    syncShopSlotCount();
    assert.equal(state.shop.length, 5);
    assert.ok(renderShopSlot(state.shop[3], 3).includes("TRINITY SEAL"));
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

test("Goetic BOSS HEALTH growth speeds up with depth and leaves the main game alone", () => {
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
      offeringToll: "Gluttony", avenging: "Pride", corruption: "Deceit", punishment: "Sloth", lifeSteal: "Lust"
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
// ---- conditional extra reveals: Vepar p61, Vine p64, Naberius p65, Zachriel Triangle p102 ----
test("Amon always reveals one extra DAMNED", () => {
  game()(`
    fixture([["p59"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 2);
  `);
});

test("Vepar reveals one extra DAMNED only while you are below 50 HEALTH", () => {
  game()(`
    state.player.hp = 50;
    fixture([["p61"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 1);
    assert.ok(!state.roundState.triggeredPassiveIds.has("p61"));
  `);
  game()(`
    state.player.hp = 49;
    fixture([["p61"]], [10, 20, 30, 40, 50]);
    assert.equal(revealedDamnedCount(), 2);
    assert.ok(state.roundState.triggeredPassiveIds.has("p61"));
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

test("Zachriel Triangle reveals one extra DAMNED only if a DAMNED died last round", () => {
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
    assert.ok(run(`collectibleSealIds().includes("${id}") && !isSealLocked("${id}")`), id);
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

test("4th Pentacle of the Moon: Cursed Chalice adds +2% max HEALTH to your CRITICAL this round (ELITE +1% each level)", () => {
  game()(`
    ${ARTIFACT_TEST_STUBS}
    fixture([["p137"]], [50, 50]);
    state.stage = "active";
    state.player.actives = [itemCopy("a22")];
    useActive(0);
    assert.equal(state.roundState.artifactCriticalRangeBonus, 1);
    assert.equal(playerCriticalDamageTotal({ kind: "bot", bot: state.bots[0] }), 120);
    assert.equal(criticalSummaryForHitter({ key: "player", kind: "player" }), "12% max HEALTH");
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

test("6th Pentacle of the Moon: Vial of Blood eliminates the first DAMNED; the second overheals by its HEALTH and turns STUBBORN (ELITE +5 BOUNTY)", () => {
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
    assert.ok(itemDescription(amy).includes("This round: ELITE Seal of Vual."));
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

test("1st Pentacle of Mars: a random DAMNED gets 1 POISON per 80 max HEALTH (at least 1), ELITE -25% HEALTH needed", () => {
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

test("the Poison SEALS are in the collection, catalog and art, and POISON shows as a skull beside max HEALTH", () => {
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
    assert.ok(run(`sealBuilds("${id}").includes("poison") && collectibleSealIds().includes("${id}") && !isSealLocked("${id}")`), id);
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
