// Appended to the game inside the bot's VM (never part of main.js). Turns off everything a screen needs
// and gives the bot a small API that presses the same "buttons" a player does.
Math.random = () => __rng();
localStorage.setItem("dearthIntroSeenV1", "1");
// screen and sound functions become no-ops; each only if this version of the game has it (an older or newer
// game may not: assigning a name that doesn't exist stops the bot on some Node versions)
if (typeof render === "function") render = function () {};
if (typeof saveArcadeRun === "function") saveArcadeRun = function () {};
if (typeof saveArcadeRunForNativeExit === "function") saveArcadeRunForNativeExit = function () {};
if (typeof showInvalidGuessPopup === "function") showInvalidGuessPopup = function () {};
if (typeof showInvalidGuessToast === "function") showInvalidGuessToast = function () {};
if (typeof showNextCollectionToast === "function") showNextCollectionToast = function () {};
if (typeof resumeSoundtrack === "function") resumeSoundtrack = function () {};
if (typeof playSoundtrack === "function") playSoundtrack = function () {};
if (typeof playGameSfx === "function") playGameSfx = function () {};
if (typeof playArtifactSfx === "function") playArtifactSfx = function () {};
if (typeof playGuessSfx === "function") playGuessSfx = function () {};
if (typeof playReadySfx === "function") playReadySfx = function () {};
if (typeof playNextRoundSfx === "function") playNextRoundSfx = function () {};
if (typeof playPentakillSfx === "function") playPentakillSfx = function () {};
if (typeof playSealPurchaseSfx === "function") playSealPurchaseSfx = function () {};
if (typeof playClockTickSfx === "function") playClockTickSfx = function () {};
if (typeof playOneShot === "function") playOneShot = function () {};
if (typeof playClonedOneShot === "function") playClonedOneShot = function () {};
if (typeof playRoundRevealStepSfx === "function") playRoundRevealStepSfx = function () {};
state.sound.muted = true;

const __bot = (() => {
  // deep copy that keeps shared objects shared (a SEAL entry referenced twice stays one object)
  function clone(value, seen = new Map()) {
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) return seen.get(value);
    if (value instanceof Map) {
      const out = new Map();
      seen.set(value, out);
      value.forEach((v, k) => out.set(clone(k, seen), clone(v, seen)));
      return out;
    }
    if (value instanceof Set) {
      const out = new Set();
      seen.set(value, out);
      value.forEach((v) => out.add(clone(v, seen)));
      return out;
    }
    if (Array.isArray(value)) {
      const out = new Array(value.length);
      seen.set(value, out);
      for (let i = 0; i < value.length; i += 1) out[i] = clone(value[i], seen);
      return out;
    }
    if (typeof value.nodeType === "number" || typeof value.cloneNode === "function") return value;
    const out = {};
    seen.set(value, out);
    for (const key of Object.keys(value)) out[key] = clone(value[key], seen);
    return out;
  }

  function replaceContents(target, source) {
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, source);
  }

  function snapshot() {
    return {
      state: clone(state),
      intro: introState.phase,
      collection: clone(collectionProgressCache),
      collectionDirty
    };
  }

  function restore(snap) {
    replaceContents(state, clone(snap.state));
    introState.phase = snap.intro;
    collectionProgressCache = clone(snap.collection);
    collectionDirty = snap.collectionDirty;
  }

  function startRun() {
    startGame();
    // every SEAL can be offered, as with Pause > Unlock (the bot tests all of them)
    state.devUnlockAllSeals = true;
    rerollShop();
  }

  function finishAnimation() {
    if (roundRevealAnimationActive()) finishRoundRevealAnimation();
  }

  function guess(value) {
    document.querySelector("#guessInput").value = String(value);
    submitGuess();
    finishAnimation();
    return state.stage === "active";
  }

  function ready() {
    readyRound();
    finishAnimation();
  }

  // returns true when the ARTIFACT resolved; targets are DAMNED ids (Vial of Blood takes two)
  function use(index, targets = []) {
    const item = state.player.actives[index];
    if (!item) return false;
    const usesBefore = state.roundState?.activeUses || 0;
    const countBefore = state.player.actives.length;
    useActive(index);
    let guard = 0;
    while (state.pendingActive && guard < 4) {
      const pending = state.pendingActive;
      const target = targets[guard];
      if (target === undefined) break;
      chooseBot(target);
      guard += 1;
      if (state.pendingActive === pending && guard >= targets.length) break;
    }
    if (state.pendingActive) {
      cancelPendingActive();
      finishAnimation();
      return false;
    }
    finishAnimation();
    return (state.roundState?.activeUses || 0) > usesBefore || state.player.actives.length < countBefore;
  }

  function next() {
    // the main game is won: skip Satan's scene and keep going into endless
    if (state.satanVictoryDue) {
      state.satanVictoryDue = false;
      state.satanVictoryPlayed = true;
    }
    advanceAfterSummary();
    finishAnimation();
  }

  return {
    clone,
    snapshot,
    restore,
    startRun,
    guess,
    ready,
    use,
    next,
    buy: (slot) => buyShopItem(slot),
    reroll: () => rerollShopClick(),
    sellSeal: (index) => sellPassive(index),
    sellArtifact: (index) => sellActive(index),
    shopPrice: (item) => shopPrice(item),
    rerollCost: () => currentRerollCost(),
    canUse: (index) => canUseActive(index),
    roomFor: (slot) => Boolean(state.shop[slot]) && hasSealSlotRoomFor(state.shop[slot].item),
    description: (item) => {
      try {
        return itemDescription(item);
      } catch (error) {
        return item?.description || "";
      }
    }
  };
})();
