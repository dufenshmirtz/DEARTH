/* ---------- SEAL collection and unlockable SEALS ----------
   Some SEALS start locked: they never appear in the Devil's Offerings until their achievement is met
   once, and then stay unlocked forever (localStorage COLLECTION_STORAGE_KEY).
   A SEAL is "discovered" the first time it triggers in a run.
   The collection (click Satan in the main menu, or Pause > Collection) shows every SEAL that can be
   bought: locked (dark, hover shows the achievement), unlocked but undiscovered (white),
   discovered (red).

   To lock another SEAL or change an achievement, edit SEAL_UNLOCKS below. Each entry is one of:
     stat: lifetime counter across all runs   (COLLECTION_STAT_LABELS lists them)
     best: best value reached in any one run  (COLLECTION_BEST_LABELS lists them)
     bosses: unique BOSS keys that must have been eliminated (any run)
     flag: something that happened at least once (finalTable, martyr)
   with `goal` for stat/best. */

const COLLECTION_STORAGE_KEY = "dearthCollectionV1";

const SEAL_UNLOCKS = {
  // unique BOSS seals: beat the BOSS
  p93: { bosses: ["zilon"], text: "Eliminate the BOSS Zilon." },
  p92: { bosses: ["dantre"], text: "Eliminate the BOSS Dantre." },
  p95: { bosses: ["pyros"], text: "Eliminate the BOSS Pyros." },
  p97: { bosses: ["threon"], text: "Eliminate the BOSS Threon." },
  p94: { bosses: ["serafim"], text: "Eliminate the BOSS Serafeim." },
  p96: { bosses: ["padma"], text: "Eliminate the BOSS Padma." },
  p110: { bosses: ["petros", "pavlos"], text: "Eliminate both twin BOSSES, Petros and Pavlos." },
  // Seal of Satan
  p111: { flag: "finalTable", text: "Reach the final table against Jesus and Satan." },
  // the Seven Seals of Revelation
  p74: { stat: "eliminations", goal: 100, text: "Eliminate 100 DAMNED across all runs." },
  p75: { best: "roundDamage", goal: 300, text: "Deal 300 damage in a single round." },
  p76: { best: "sinHeld", goal: 60, text: "Hold 60 SIN at once." },
  p77: { stat: "deaths", goal: 1, text: "Die at the table." },
  p78: { flag: "martyr", text: "End a round alive with 10 HEALTH or less." },
  p79: { best: "round", goal: 25, text: "Reach round 25." },
  p80: { best: "goeticInRun", goal: 3, text: "Eliminate 3 Goetic demon BOSSES in one run." },
  // the angelic, self-stacking seals
  p98: { stat: "criticals", goal: 10, text: "Score 10 CRITICALS across all runs." },
  p99: { best: "maxMemory", goal: 15, text: "See a DAMNED reach 15 MEMORY." },
  p100: { best: "bountySum", goal: 60, text: "See the DAMNED carry 60 BOUNTY between them." },
  p101: { stat: "pentakills", goal: 3, text: "Score 3 PENTAKILLS across all runs." },
  p102: { best: "eliminationsInRun", goal: 30, text: "Eliminate 30 DAMNED in a single run." },
  p103: { stat: "artifactsUsed", goal: 100, text: "Use 100 ARTIFACTS across all runs." },
  p109: { stat: "stubbornEliminations", goal: 20, text: "Eliminate 20 STUBBORN DAMNED across all runs." }
};

const COLLECTION_STAT_LABELS = {
  eliminations: "DAMNED eliminated",
  stubbornEliminations: "STUBBORN DAMNED eliminated",
  criticals: "CRITICALS",
  pentakills: "PENTAKILLS",
  artifactsUsed: "ARTIFACTS used",
  deaths: "deaths"
};

const COLLECTION_BEST_LABELS = {
  round: "best round",
  roundDamage: "best round damage",
  sinHeld: "most SIN held",
  eliminationsInRun: "most eliminations in a run",
  goeticInRun: "most Goetic BOSSES in a run",
  maxMemory: "highest MEMORY seen",
  bountySum: "most BOUNTY on the table"
};

// sections of the collection, in order; any purchasable SEAL not listed lands in "Goetic Seals"
const COLLECTION_SECTIONS = [
  { key: "goetic", title: "Goetic Seals" },
  { key: "revelation", title: "The Seven Seals", ids: ["p74", "p75", "p76", "p77", "p78", "p79", "p80"] },
  { key: "angelic", title: "Angelic Sigils", ids: ["p98", "p99", "p100", "p101", "p102", "p103", "p109"] },
  { key: "bosses", title: "Seals of the Bosses", ids: ["p93", "p92", "p95", "p97", "p94", "p96", "p110"] },
  { key: "satan", title: "The Seal of Satan", ids: ["p111"] }
];

/* ---- stored progress ---- */
let collectionProgressCache = null;

function defaultCollectionProgress() {
  return {
    version: 1,
    unlocked: [],
    discovered: [],
    stats: Object.fromEntries(Object.keys(COLLECTION_STAT_LABELS).map((key) => [key, 0])),
    best: Object.fromEntries(Object.keys(COLLECTION_BEST_LABELS).map((key) => [key, 0])),
    bosses: [],
    flags: {}
  };
}

function loadCollectionProgress() {
  if (collectionProgressCache) return collectionProgressCache;
  const progress = defaultCollectionProgress();
  let fresh = true;
  try {
    const raw = window.localStorage?.getItem(COLLECTION_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      fresh = false;
      if (Array.isArray(saved.unlocked)) progress.unlocked = saved.unlocked.filter((id) => typeof id === "string");
      if (Array.isArray(saved.discovered)) progress.discovered = saved.discovered.filter((id) => typeof id === "string");
      if (Array.isArray(saved.bosses)) progress.bosses = saved.bosses.filter((key) => typeof key === "string");
      if (saved.flags && typeof saved.flags === "object") progress.flags = { ...saved.flags };
      for (const group of ["stats", "best"]) {
        const source = saved[group] && typeof saved[group] === "object" ? saved[group] : {};
        Object.keys(progress[group]).forEach((key) => {
          progress[group][key] = Math.max(0, Math.floor(Number(source[key]) || 0));
        });
      }
    }
  } catch (error) {}
  collectionProgressCache = progress;
  // players from before the collection keep credit for what their records already show
  if (fresh) seedCollectionFromRecords(progress);
  return progress;
}

function seedCollectionFromRecords(progress) {
  try {
    const records = loadArcadeRecords();
    progress.best.round = Math.max(progress.best.round, records.highestRoundReached?.value || 0);
    progress.best.roundDamage = Math.max(progress.best.roundDamage, records.mostSingleRoundDamage?.value || 0);
    progress.best.eliminationsInRun = Math.max(progress.best.eliminationsInRun, records.mostEliminations?.value || 0);
    progress.stats.pentakills = Math.max(progress.stats.pentakills, records.mostPentakills?.value || 0);
  } catch (error) {}
  evaluateSealUnlocks(false);
  saveCollectionProgress();
}

function saveCollectionProgress() {
  if (!collectionProgressCache) return;
  try {
    window.localStorage?.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collectionProgressCache));
  } catch (error) {}
}

/* ---- queries ---- */
function collectibleSealIds() {
  return PASSIVE_IDS.filter((id) => ITEMS[id] && !REMOVED_PASSIVE_IDS.has(id));
}

function isUnlockableSeal(id) {
  return Boolean(SEAL_UNLOCKS[id]);
}

function isSealUnlocked(id) {
  if (!isUnlockableSeal(id)) return true;
  // Pause > Unlock (testing): every SEAL counts as unlocked for the rest of this run
  if (state.devUnlockAllSeals && state.mode !== "menu") return true;
  return loadCollectionProgress().unlocked.includes(id);
}

function isSealLocked(id) {
  return !isSealUnlocked(id);
}

function isSealDiscovered(id) {
  return loadCollectionProgress().discovered.includes(id);
}

function sealUnlockProgress(id) {
  const rule = SEAL_UNLOCKS[id];
  if (!rule) return null;
  const progress = loadCollectionProgress();
  if (rule.stat) return { value: progress.stats[rule.stat] || 0, goal: rule.goal };
  if (rule.best) return { value: progress.best[rule.best] || 0, goal: rule.goal };
  if (rule.bosses) return { value: rule.bosses.filter((key) => progress.bosses.includes(key)).length, goal: rule.bosses.length };
  if (rule.flag) return { value: progress.flags[rule.flag] ? 1 : 0, goal: 1 };
  return null;
}

function sealUnlockMet(id) {
  const result = sealUnlockProgress(id);
  return Boolean(result && result.value >= result.goal);
}

/* ---- recording (called from the game) ---- */
function collectionCounts() {
  // only real arcade runs count: not PvP, not the story's tutorial rounds
  if (state.mode !== "arcade") return false;
  if (typeof introBlocksRunSave === "function" && introBlocksRunSave()) return false;
  return true;
}

function collectionBump(stat, amount = 1) {
  if (!collectionCounts() || !(stat in COLLECTION_STAT_LABELS)) return;
  const progress = loadCollectionProgress();
  progress.stats[stat] = (progress.stats[stat] || 0) + amount;
  collectionDirty = true;
}

function collectionNoteElimination(bot) {
  if (!collectionCounts() || !bot) return;
  collectionBump("eliminations");
  if (personalityType(bot) === "Stubborn") collectionBump("stubbornEliminations");
  if (bot.isBoss && bot.uniqueKey) {
    const progress = loadCollectionProgress();
    if (!progress.bosses.includes(bot.uniqueKey)) progress.bosses.push(bot.uniqueKey);
  }
}

// a SEAL triggered: it is discovered for good
function collectionDiscover(id) {
  if (state.mode !== "arcade" || !id || !ITEMS[id]) return;
  const progress = loadCollectionProgress();
  if (progress.discovered.includes(id)) return;
  progress.discovered.push(id);
  saveCollectionProgress();
}

let collectionDirty = false;
const collectionToastQueue = [];
let collectionToastBusy = false;

// after every render of a run: note the bests, unlock what is now earned
function collectionAfterRender() {
  if (!collectionCounts()) return;
  const progress = loadCollectionProgress();
  const best = progress.best;
  const raise = (key, value) => {
    const next = Math.max(0, Math.floor(Number(value) || 0));
    if (next > (best[key] || 0)) {
      best[key] = next;
      collectionDirty = true;
    }
  };
  const stats = ensureRunStats();
  raise("round", state.round);
  raise("roundDamage", stats.singleRoundDamage);
  raise("sinHeld", state.player.credits);
  raise("eliminationsInRun", state.eliminations);
  raise("goeticInRun", state.goeticBossKills);
  const living = (state.bots || []).filter((bot) => bot && !bot.isBoss && !bot.eliminated && bot.hp > 0);
  raise("maxMemory", Math.max(0, ...living.map((bot) => (Array.isArray(bot.memory) ? bot.memory.length : 0))));
  raise("bountySum", living.reduce((sum, bot) => sum + botRegularBounty(bot), 0));
  if (state.finalBossPhase && !progress.flags.finalTable) {
    progress.flags.finalTable = true;
    collectionDirty = true;
  }
  if (state.stage === "summary" && !state.gameOver && state.player.hp > 0 && state.player.hp <= 10 && !progress.flags.martyr) {
    progress.flags.martyr = true;
    collectionDirty = true;
  }
  if (!collectionDirty) return;
  collectionDirty = false;
  evaluateSealUnlocks(true);
  saveCollectionProgress();
}

function evaluateSealUnlocks(announce) {
  const progress = loadCollectionProgress();
  Object.keys(SEAL_UNLOCKS).forEach((id) => {
    if (progress.unlocked.includes(id) || !ITEMS[id] || !sealUnlockMet(id)) return;
    progress.unlocked.push(id);
    if (announce) collectionToastQueue.push(id);
  });
  if (announce) showNextCollectionToast();
}

/* ---- "SEAL UNLOCKED" toast: lives outside #app so renders never touch it ---- */
function showNextCollectionToast() {
  if (collectionToastBusy || !collectionToastQueue.length) return;
  const id = collectionToastQueue.shift();
  collectionToastBusy = true;
  const toast = document.createElement("div");
  toast.className = "collection-toast";
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <img class="collection-toast-sigil" src="${escapeAttr(sealSigilPath(id))}" alt="" />
    <span class="collection-toast-text">
      <span class="collection-toast-kicker">Seal unlocked</span>
      <span class="collection-toast-name">${escapeHtml(ITEMS[id]?.name || "Seal")}</span>
    </span>`;
  document.body.appendChild(toast);
  playGameSfx("sealUnlock");
  setTimeout(() => {
    toast.classList.add("leaving");
    setTimeout(() => {
      toast.remove();
      collectionToastBusy = false;
      showNextCollectionToast();
    }, 600);
  }, 3600);
}

/* ---- the collection screen ---- */
function collectionOpen() {
  return state.mode === "menu" ? Boolean(state.menuCollectionOpen) : Boolean(state.pauseOpen && state.pauseScreen === "collection");
}

function collectionSealState(id) {
  if (isSealLocked(id)) return "locked";
  return isSealDiscovered(id) ? "discovered" : "undiscovered";
}

function collectionSections() {
  const all = collectibleSealIds();
  const listed = new Set(COLLECTION_SECTIONS.flatMap((section) => section.ids || []));
  return COLLECTION_SECTIONS.map((section) => ({
    ...section,
    ids: (section.ids || all.filter((id) => !listed.has(id))).filter((id) => all.includes(id))
  })).filter((section) => section.ids.length);
}

function collectionInfoHtml(id) {
  const item = ITEMS[id];
  const status = collectionSealState(id);
  if (status === "locked") {
    const rule = SEAL_UNLOCKS[id];
    const result = sealUnlockProgress(id);
    const progressText = result && result.goal > 1 ? `<div class="collection-info-progress">${formatNumber(Math.min(result.value, result.goal))} / ${formatNumber(result.goal)}</div>` : "";
    return `
      <div class="collection-info-status locked">Locked</div>
      <div class="collection-info-name">${escapeHtml(item.name)}</div>
      <div class="collection-info-text">${descriptionHtml(rule.text)}</div>
      ${progressText}`;
  }
  const note = status === "undiscovered" ? `<div class="collection-info-note">Not discovered yet: make it trigger in a run.</div>` : "";
  return `
    <div class="collection-info-status ${status}">${status === "discovered" ? "Discovered" : "Undiscovered"}</div>
    <div class="collection-info-name">${escapeHtml(item.name)}</div>
    <div class="collection-info-text">${descriptionHtml(collectionDescription(item))}</div>
    ${note}`;
}

function collectionDescription(item) {
  try {
    return itemDescription(item) || item.description || "";
  } catch (error) {
    return item.description || "";
  }
}

function renderCollectionScreen(from) {
  const all = collectibleSealIds();
  const unlocked = all.filter((id) => isSealUnlocked(id)).length;
  const discovered = all.filter((id) => isSealUnlocked(id) && isSealDiscovered(id)).length;
  const sections = collectionSections()
    .map(
      (section) => `
        <section class="collection-section collection-section-${section.key}">
          <h2 class="collection-section-title">${escapeHtml(section.title)}</h2>
          <div class="collection-grid">
            ${section.ids
              .map((id) => {
                const status = collectionSealState(id);
                const wide = SATAN_SEAL_IDS.has(id) ? " wide" : "";
                return `
                  <button class="collection-seal ${status}${wide}" type="button" data-collection-seal="${id}" aria-label="${escapeAttr(status === "locked" ? `Locked SEAL` : ITEMS[id].name)}">
                    <img class="collection-sigil" src="${escapeAttr(sealSigilPath(id))}" alt="" loading="lazy" draggable="false" />
                    ${status === "locked" ? `<span class="collection-lock" aria-hidden="true"></span>` : ""}
                  </button>`;
              })
              .join("")}
          </div>
        </section>`
    )
    .join("");
  return `
    <div class="collection-screen collection-from-${from}" role="dialog" aria-label="SEAL collection">
      <header class="collection-header">
        <button class="collection-back" type="button" data-collection-back="${from}">Back</button>
        <h1 class="collection-title">Collection</h1>
        <div class="collection-counts">
          <span><strong>${discovered}</strong> / ${all.length} discovered</span>
          <span><strong>${unlocked}</strong> / ${all.length} unlocked</span>
        </div>
      </header>
      <div class="collection-legend" aria-hidden="true">
        <span class="legend discovered">discovered</span>
        <span class="legend undiscovered">undiscovered</span>
        <span class="legend locked">locked</span>
      </div>
      <div class="collection-body">${sections}</div>
      <div class="collection-info" aria-live="polite"></div>
    </div>`;
}

function showCollectionInfo(button, pinned) {
  const screen = button.closest(".collection-screen");
  const info = screen?.querySelector(".collection-info");
  if (!info) return;
  const id = button.dataset.collectionSeal;
  info.innerHTML = collectionInfoHtml(id);
  info.className = `collection-info visible ${collectionSealState(id)}`;
  screen.querySelectorAll(".collection-seal.selected").forEach((el) => el.classList.remove("selected"));
  if (pinned) button.classList.add("selected");
  // beside the seal, kept on screen
  const rect = button.getBoundingClientRect();
  const width = info.offsetWidth;
  const height = info.offsetHeight;
  let left = rect.right + 12;
  if (left + width > window.innerWidth - 8) left = rect.left - width - 12;
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  let top = rect.top + rect.height / 2 - height / 2;
  top = Math.max(8, Math.min(top, window.innerHeight - height - 8));
  info.style.left = `${Math.round(left)}px`;
  info.style.top = `${Math.round(top)}px`;
}

function hideCollectionInfo(screen) {
  const info = screen?.querySelector(".collection-info");
  if (info && !screen.querySelector(".collection-seal.selected")) info.classList.remove("visible");
}

function closeCollection(from) {
  if (from === "menu") state.menuCollectionOpen = false;
  else state.pauseScreen = "main";
  render();
}

function bindCollectionEvents() {
  document.querySelectorAll("[data-collection-back]").forEach((button) => {
    bindOn(button, "click", () => closeCollection(button.dataset.collectionBack));
  });
  document.querySelectorAll("[data-collection-seal]").forEach((button) => {
    bindOn(button, "pointerenter", (event) => {
      if (event.pointerType === "mouse") showCollectionInfo(button, false);
    });
    bindOn(button, "pointerleave", (event) => {
      if (event.pointerType === "mouse") hideCollectionInfo(button.closest(".collection-screen"));
    });
    bindOn(button, "click", (event) => {
      event.stopPropagation();
      const wasSelected = button.classList.contains("selected");
      if (wasSelected) {
        button.classList.remove("selected");
        hideCollectionInfo(button.closest(".collection-screen"));
      } else {
        showCollectionInfo(button, true);
      }
    });
  });
  const screen = document.querySelector(".collection-screen");
  if (screen) {
    bindOn(screen, "click", () => {
      screen.querySelectorAll(".collection-seal.selected").forEach((el) => el.classList.remove("selected"));
      hideCollectionInfo(screen);
    });
    bindOn(screen.querySelector(".collection-body"), "scroll", () => {
      screen.querySelectorAll(".collection-seal.selected").forEach((el) => el.classList.remove("selected"));
      hideCollectionInfo(screen);
    });
  }
}

// Esc closes the collection
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !collectionOpen()) return;
  event.preventDefault();
  closeCollection(state.mode === "menu" ? "menu" : "pause");
});

/* ---- main menu: Satan opens the collection (eyes flare red, a red pulse) ---- */
function triggerMenuSatan() {
  const fig = document.querySelector(".menu-fig-satan");
  if (!fig) return;
  menuFigureTrigger.busy = true;
  setMenuFigureLit("satan");
  fig.classList.add("eyes-flare");
  playGameSfx("menuSatanOpen");
  const pulse = document.createElement("div");
  pulse.className = "menu-satan-pulse";
  document.body.appendChild(pulse);
  setTimeout(() => {
    fig.classList.remove("eyes-flare");
    setMenuFigureLit(null);
    menuFigureTrigger.busy = false;
    openCollectionFromMenu();
  }, 360);
  setTimeout(() => pulse.remove(), 900);
}

function openCollectionFromMenu() {
  if (state.mode !== "menu") return;
  state.menuCollectionOpen = true;
  render();
}
