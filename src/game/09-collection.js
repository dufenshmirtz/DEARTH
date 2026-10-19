/* ---------- SEAL collection and unlockable SEALS ----------
   Some SEALS start locked: they never appear in the Devil's Offerings until their achievement is met
   once, and then stay unlocked forever (localStorage COLLECTION_STORAGE_KEY).
   A SEAL is "discovered" the first time it triggers in a run.
   The collection (click Satan in the main menu, or Pause > Collection) shows every SEAL that can be
   bought: locked (dark, hover shows the achievement), unlocked but undiscovered (white),
   discovered (red).

   To lock another SEAL or change an achievement, edit SEAL_UNLOCKS below. Each entry is one of:
     stat: lifetime counter across all runs           (COLLECTION_STAT_LABELS lists them)
     best: best value reached at any one moment / run  (COLLECTION_BEST_LABELS lists them)
     flag: something that happened at least once       (COLLECTION_FLAG_LABELS lists them)
   with `goal` for stat/best. A new kind of achievement needs its counter recorded below
   (search for collectionBump / collectionRaise / collectionFlag). */

const COLLECTION_STORAGE_KEY = "dearthCollectionV2";
const COLLECTION_OLD_STORAGE_KEYS = ["dearthCollectionV1"]; // discovered SEALS are carried over

const SEAL_UNLOCKS = {
  // Apocalypse Seals
  p74: { best: "roundSpent", goal: 160, text: "Spend 160 SIN in one round." },
  p75: { flag: "oneHealth", text: "Have exactly 1 HEALTH." },
  p76: { best: "critStreak", goal: 8, text: "Score 8 CRITICAL hits in a row." },
  p77: { flag: "fullHealthBossKill", text: "Eliminate a BOSS that was at max HEALTH." },
  p78: { flag: "fullHealthKill", text: "Be at 100 HEALTH and eliminate a DAMNED." },
  p79: { flag: "beatNoArtifacts", text: "Beat the game without using a single ARTIFACT (defeat the 8 BOSSES)." },
  p80: { best: "pentakillStreak", goal: 3, text: "Score 3 PENTAKILLS in a row." },
  // Boss Seals
  p92: { flag: "dantrePentakill", text: "Score a PENTAKILL while Dantre is active." },
  p93: { flag: "zilonBuyouts", text: "Buy out three entire Devil's Offerings while Zilon is active." },
  p94: { flag: "serafimNoSteal", text: "Have Serafeim steal 0 SIN from you when he is first summoned." },
  p95: { flag: "pyrosGiftBossKill", text: "Defeat a BOSS other than Pyros that has been granted a PYROS-TECH ability." },
  p96: { best: "noKoStreak", goal: 8, text: "Don't get a KO for 8 rounds in a row." },
  p97: { flag: "threonArtifacts", text: "Use 4 ARTIFACTS in one round while Threon is active." },
  p110: { best: "bossesAtOnce", goal: 5, text: "Have 5 BOSSES active at the same time." },
  // Satan Seals
  p111: { best: "sinHeld", goal: 666, text: "Have 666 SIN." },
  // Seals of Saturn
  p98: { best: "critStreak", goal: 3, text: "Score 3 CRITICAL hits in a row." },
  p99: { stat: "gamesBeaten", goal: 8, text: "Beat the game 8 times (defeat the 8 BOSSES)." },
  p100: { best: "eliteLevel", goal: 6, text: "Get a SEAL to ELITE level 6." },
  p101: { stat: "goeticKills", goal: 66, text: "Eliminate 66 demons (Goetic BOSSES) in total." },
  p102: { stat: "eliminations", goal: 666, text: "Eliminate 666 DAMNED in total." },
  p109: { stat: "yannisKills", goal: 8, text: "Eliminate 8 DAMNED named Yannis in total." }
  // Still to come: "Get six SEALS that are all ELITE level 1 or more" for a Seal of Kalha
  // (there is no Seal of Kalha yet; the counter is recorded as flag sixEliteSeals).
};

const COLLECTION_STAT_LABELS = {
  eliminations: "DAMNED eliminated",
  yannisKills: "Yannis eliminated",
  goeticKills: "Goetic BOSSES eliminated",
  gamesBeaten: "games beaten"
};

const COLLECTION_BEST_LABELS = {
  roundSpent: "most SIN spent in a round",
  sinHeld: "most SIN held",
  critStreak: "CRITICALS in a row",
  pentakillStreak: "PENTAKILLS in a row",
  noKoStreak: "rounds in a row without a KO",
  bossesAtOnce: "BOSSES active at once",
  eliteLevel: "highest ELITE level"
};

const COLLECTION_FLAG_LABELS = {
  oneHealth: "had exactly 1 HEALTH",
  fullHealthBossKill: "one-shot a full-HEALTH BOSS",
  fullHealthKill: "eliminated at 100 HEALTH",
  beatNoArtifacts: "beat the game with no ARTIFACTS",
  dantrePentakill: "PENTAKILL with Dantre active",
  zilonBuyouts: "3 buyouts with Zilon active",
  serafimNoSteal: "Serafeim stole nothing",
  pyrosGiftBossKill: "beat a PYROS-TECH BOSS",
  threonArtifacts: "4 ARTIFACTS with Threon active",
  sixEliteSeals: "six ELITE SEALS"
};

// sections of the collection, in order (as in ITEMS.txt); any purchasable SEAL not listed lands in "Player Seals"
const COLLECTION_SECTIONS = [
  { key: "player", title: "Player Seals" },
  { key: "apocalypse", title: "Apocalypse Seals", ids: ["p74", "p75", "p76", "p77", "p78", "p79", "p80"] },
  { key: "bosses", title: "Boss Seals", ids: ["p92", "p93", "p94", "p95", "p96", "p97", "p110"] },
  { key: "satan", title: "Satan Seals", ids: ["p111"] },
  // the self-stacking SEALS, drawn as the seven Pentacles of Saturn (in pentacle order)
  { key: "saturn", title: "Seals of Saturn", ids: ["p98", "p99", "p100", "p101", "p102", "p103", "p109"] },
  // former Goetic SEALS whose demons now belong to newer SEALS
  { key: "special", title: "Special Seals", ids: ["p55", "p69"] }
];

/* ---- builds: the collection filters ----
   Every SEAL is tagged with the build(s) it belongs to; a SEAL that fits two builds shows under both.
   BOUNTY means the SEAL works with the BOUNTY the DAMNED carry (gives it, reads it, spends it). SEALS
   that only pay you SIN, or only multiply the SIN paid on elimination, are not BOUNTY SEALS. */
const SEAL_BUILDS = [
  { key: "bounty", label: "Bounty" },
  { key: "memory", label: "Memory" },
  { key: "reveal", label: "Reveal" },
  { key: "critical", label: "Critical" },
  { key: "personality", label: "Personality" },
  { key: "artifact", label: "Artifact" },
  { key: "general", label: "General" }
];

const SEAL_BUILD_TAGS = {
  // Player SEALS
  p1: ["memory"], // Vassago
  p2: ["critical"], // Paimon
  p6: ["critical"], // Orias
  p7: ["critical"], // Glasya-Labolas
  p9: ["bounty", "memory"], // Marbas
  p10: ["bounty", "memory"], // Gusion
  p11: ["artifact"], // Valefor
  p12: ["general"], // Belial
  p13: ["general", "personality"], // Bune
  p14: ["personality"], // Leraje
  p15: ["memory"], // Bathin
  p16: ["general"], // Bael
  p17: ["memory"], // Dantalion
  p19: ["general"], // Sabnock
  p20: ["artifact"], // Haagenti
  p23: ["bounty"], // Seere
  p25: ["artifact"], // Valac
  p26: ["artifact"], // Amdusias
  p30: ["general"], // Andrealphus
  p31: ["bounty"], // Murmur
  p32: ["bounty"], // Foras
  p33: ["bounty"], // Marchosias
  p34: ["bounty"], // Gremory
  p35: ["bounty"], // Forneus
  p40: ["bounty"], // Focalor
  p42: ["memory"], // Stolas
  p44: ["bounty"], // Andromalius
  p45: ["general"], // Crocell (double SIN payout only)
  p46: ["bounty"], // Barbatos
  p47: ["bounty"], // Ronove
  p48: ["bounty"], // Cimejes
  p49: ["bounty", "artifact"], // Phenex
  p50: ["bounty"], // Agares
  p52: ["memory"], // Decarabia
  p53: ["memory"], // Samigina
  p54: ["reveal"], // Zepar
  p55: ["memory"], // Samael Septagram (special)
  p57: ["bounty", "memory"], // Balam
  p58: ["general"], // Ipos
  p59: ["reveal", "bounty", "memory"], // Amon
  p60: ["artifact"], // Gaap
  p61: ["reveal"], // Vepar
  p63: ["reveal"], // Vual
  p64: ["reveal"], // Vine (double SIN payout is not BOUNTY)
  p65: ["reveal"], // Naberius
  p67: ["memory"], // Caim (double SIN payout is not BOUNTY)
  p68: ["memory"], // Vapula
  p69: ["critical"], // Cassiel Hexagram (special)
  p70: ["artifact"], // Amy
  p71: ["general"], // Sallos
  p72: ["general"], // Furcas
  p73: ["general"], // Asmoday
  p84: ["reveal"], // Astaroth
  p85: ["personality"], // Berith
  p86: ["personality", "memory"], // Haures
  p87: ["personality"], // Purson
  p88: ["personality", "bounty"], // Raum
  p89: ["personality"], // Marax
  p90: ["personality"], // Bifrons
  p91: ["critical"], // Aim
  p104: ["personality", "bounty", "memory"], // Alloces
  p105: ["personality", "artifact"], // Andras
  p106: ["personality"], // Zagan
  p107: ["personality"], // Ose
  p108: ["personality"], // Orobas
  p112: ["general"], // Furfur
  p113: ["general"], // Halphas
  p114: ["general"], // Buer
  p115: ["general"], // Botis
  p116: ["critical"], // Beleth
  p117: ["critical"], // Shax (SIN from kills, not BOUNTY)
  p118: ["general"], // Malphas
  p119: ["critical"], // Eligos
  p120: ["memory"], // Sitri
  // Apocalypse SEALS
  p74: ["bounty"], // White Horse
  p75: ["reveal"], // Red Horse
  p76: ["memory"], // Black Horse
  p77: ["critical"], // Pale Horse
  p78: ["personality"], // Souls of Martyrs
  p79: ["artifact"], // Creation Uncreated
  p80: ["general"], // Silence in Heaven
  // Boss SEALS
  p92: ["critical"], // Dantre
  p93: ["bounty"], // Zilon
  p94: ["artifact"], // Serafeim
  p95: ["reveal"], // Pyros
  p96: ["personality"], // Padma
  p97: ["memory"], // Threon
  p110: ["general"], // Petros-Pavlos (wipes MEMORY and BOUNTY)
  // Satan SEALS
  p111: ["general"], // Satan
  // Seals of Saturn
  p98: ["critical"], // Samael Star
  p99: ["memory"], // Cassiel Sigil
  p100: ["bounty"], // Bethor
  p101: ["general"], // Aggiel Hexagram
  p102: ["reveal"], // Zachriel Triangle
  p103: ["artifact"], // Cassiel Pentagram
  p109: ["personality"] // Samael Triangle
};

function sealBuilds(id) {
  return SEAL_BUILD_TAGS[id] || ["general"];
}

function collectionFilter() {
  const key = state.collectionFilter;
  return SEAL_BUILDS.some((build) => build.key === key) ? key : "all";
}

function sealMatchesCollectionFilter(id, filter = collectionFilter()) {
  return filter === "all" || sealBuilds(id).includes(filter);
}

/* ---- stored progress ---- */
let collectionProgressCache = null;

function defaultCollectionProgress() {
  return {
    version: 2,
    unlocked: [],
    discovered: [],
    stats: Object.fromEntries(Object.keys(COLLECTION_STAT_LABELS).map((key) => [key, 0])),
    best: Object.fromEntries(Object.keys(COLLECTION_BEST_LABELS).map((key) => [key, 0])),
    flags: {}
  };
}

function loadCollectionProgress() {
  if (collectionProgressCache) return collectionProgressCache;
  const progress = defaultCollectionProgress();
  try {
    const raw = window.localStorage?.getItem(COLLECTION_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.unlocked)) progress.unlocked = saved.unlocked.filter((id) => typeof id === "string");
      if (Array.isArray(saved.discovered)) progress.discovered = saved.discovered.filter((id) => typeof id === "string");
      if (saved.flags && typeof saved.flags === "object") progress.flags = { ...saved.flags };
      for (const group of ["stats", "best"]) {
        const source = saved[group] && typeof saved[group] === "object" ? saved[group] : {};
        Object.keys(progress[group]).forEach((key) => {
          progress[group][key] = Math.max(0, Math.floor(Number(source[key]) || 0));
        });
      }
    } else {
      // the first version had other achievements: keep only what was discovered
      COLLECTION_OLD_STORAGE_KEYS.forEach((key) => {
        const old = JSON.parse(window.localStorage?.getItem(key) || "null");
        if (Array.isArray(old?.discovered)) progress.discovered = old.discovered.filter((id) => typeof id === "string");
      });
    }
  } catch (error) {}
  collectionProgressCache = progress;
  return progress;
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
  if (rule.flag) return { value: progress.flags[rule.flag] ? 1 : 0, goal: 1 };
  return null;
}

function sealUnlockMet(id) {
  const result = sealUnlockProgress(id);
  return Boolean(result && result.value >= result.goal);
}

/* ---- recording (called from the game) ---- */
function collectionCounts() {
  // only real arcade runs count: not PvP, not the story's tutorial rounds, not infinite-SIN testing
  if (state.mode !== "arcade") return false;
  if (typeof introBlocksRunSave === "function" && introBlocksRunSave()) return false;
  if (typeof playtestMoneyModeActive === "function" && playtestMoneyModeActive()) return false;
  return true;
}

let collectionDirty = false;
const collectionToastQueue = [];
let collectionToastBusy = false;

function collectionBump(stat, amount = 1) {
  if (!collectionCounts() || !(stat in COLLECTION_STAT_LABELS)) return;
  const progress = loadCollectionProgress();
  progress.stats[stat] = (progress.stats[stat] || 0) + amount;
  collectionDirty = true;
}

function collectionRaise(key, value) {
  if (!collectionCounts() || !(key in COLLECTION_BEST_LABELS)) return;
  const best = loadCollectionProgress().best;
  const next = Math.max(0, Math.floor(Number(value) || 0));
  if (next <= (best[key] || 0)) return;
  best[key] = next;
  collectionDirty = true;
}

function collectionFlag(key) {
  if (!collectionCounts() || !(key in COLLECTION_FLAG_LABELS)) return;
  const flags = loadCollectionProgress().flags;
  if (flags[key]) return;
  flags[key] = true;
  collectionDirty = true;
}

// per-run counters (saved with the run)
function collectionRun() {
  const defaults = { uniqueKills: [], beaten: false, zilonBuyouts: 0, buyoutCounted: false, critStreak: 0, pentakillStreak: 0, noKoStreak: 0, roundSpent: 0, roundProcessed: 0 };
  if (!state.collectionRun || typeof state.collectionRun !== "object") state.collectionRun = defaults;
  else Object.keys(defaults).forEach((key) => { if (!(key in state.collectionRun)) state.collectionRun[key] = defaults[key]; });
  return state.collectionRun;
}

function resetCollectionRun() {
  state.collectionRun = null;
  collectionRun();
}

// a unique BOSS (alive or knocked out this round) is on the table
function collectionBossPresent(key, aliveOnly = false) {
  return (state.bots || []).some((bot) => bot?.isBoss && bot.uniqueKey === key && (!aliveOnly || (!bot.eliminated && bot.hp > 0)));
}

function collectionBeginRound() {
  if (state.mode !== "arcade") return;
  collectionRun().roundSpent = 0;
  // BOSSES at full HEALTH when the round starts: knocking one out this round counts as a one-shot
  (state.bots || []).forEach((bot) => {
    if (bot?.isBoss) bot.fullHealthAtRoundStart = !bot.immortal && bot.hp >= bot.maxHp;
  });
}

function collectionNoteSpend(cost) {
  if (!collectionCounts() || !(cost > 0)) return;
  const run = collectionRun();
  run.roundSpent += cost;
  collectionRaise("roundSpent", run.roundSpent);
}

function collectionNoteElimination(bot) {
  if (!collectionCounts() || !bot) return;
  collectionBump("eliminations");
  if (/^Yannis\b/i.test(bot.name || "")) collectionBump("yannisKills");
  if (state.player.hp >= 100) collectionFlag("fullHealthKill");
  if (!bot.isBoss) return;
  if (bot.goeticKey) collectionBump("goeticKills");
  if (bot.fullHealthAtRoundStart) collectionFlag("fullHealthBossKill");
  if (bot.pyrosGifted && bot.uniqueKey !== "pyros") collectionFlag("pyrosGiftBossKill");
  if (bot.uniqueKey) {
    const run = collectionRun();
    if (!run.uniqueKills.includes(bot.uniqueKey)) run.uniqueKills.push(bot.uniqueKey);
    // beating the game = all 8 unique BOSSES defeated in one run (Petros and Pavlos both)
    const needed = [...UNIQUE_BOSS_KEYS, "pavlos"];
    if (!run.beaten && needed.every((key) => run.uniqueKills.includes(key))) {
      run.beaten = true;
      collectionBump("gamesBeaten");
      if (!(state.totalArtifactsUsed > 0)) collectionFlag("beatNoArtifacts");
    }
  }
}

function collectionNotePentakill() {
  if (!collectionCounts()) return;
  if (state.roundState) state.roundState.collectionPentakill = true;
  if (collectionBossPresent("dantre")) collectionFlag("dantrePentakill");
}

function collectionNoteArtifactUse() {
  if (!collectionCounts() || !state.roundState) return;
  if ((state.roundState.activeUses || 0) >= 4 && collectionBossPresent("threon", true)) collectionFlag("threonArtifacts");
}

function collectionNoteShopBuy() {
  if (!collectionCounts()) return;
  const run = collectionRun();
  const shop = state.shop || [];
  if (!shop.length || run.buyoutCounted || !shop.every((slot) => slot?.sold)) return;
  run.buyoutCounted = true;
  if (!collectionBossPresent("zilon", true)) return;
  run.zilonBuyouts += 1;
  if (run.zilonBuyouts >= 3) collectionFlag("zilonBuyouts");
}

function collectionNoteShopReroll() {
  if (state.mode === "arcade") collectionRun().buyoutCounted = false;
}

function collectionNoteSerafimEntry(bot, stolen) {
  if (bot?.uniqueKey === "serafim" && !(stolen > 0)) collectionFlag("serafimNoSteal");
}

// a SEAL triggered: it is discovered for good
function collectionDiscover(id) {
  if (state.mode !== "arcade" || !id || !ITEMS[id]) return;
  const progress = loadCollectionProgress();
  if (progress.discovered.includes(id)) return;
  progress.discovered.push(id);
  saveCollectionProgress();
}

// after every render of a run: moment checks, end-of-round streaks, then unlock what is earned
function collectionAfterRender() {
  if (!collectionCounts()) return;
  const run = collectionRun();
  if (state.player.hp === 1) collectionFlag("oneHealth");
  collectionRaise("sinHeld", state.player.credits);
  collectionRaise("bossesAtOnce", (state.bots || []).filter((bot) => bot?.isBoss && !bot.eliminated && bot.hp > 0).length);
  collectionRaise("eliteLevel", Math.max(0, ...(state.player.passives || []).map((item) => (item?.stack || 1) - 1)));
  const eliteSeals = (state.player.passives || []).filter((item) => item && (item.stack || 1) >= 2).length;
  if (eliteSeals >= 6) collectionFlag("sixEliteSeals");
  // once per round, when it is resolved
  const round = state.roundState;
  if (state.stage === "summary" && round && !roundRevealAnimationActive() && run.roundProcessed !== state.round) {
    run.roundProcessed = state.round;
    run.critStreak = round.criticalHitKeys?.has?.("player") ? run.critStreak + 1 : 0;
    run.pentakillStreak = round.collectionPentakill ? run.pentakillStreak + 1 : 0;
    run.noKoStreak = (round.eliminationsThisRound || 0) === 0 ? run.noKoStreak + 1 : 0;
    collectionRaise("critStreak", run.critStreak);
    collectionRaise("pentakillStreak", run.pentakillStreak);
    collectionRaise("noKoStreak", run.noKoStreak);
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
      ${collectionBuildsHtml(id)}
      <div class="collection-info-text">${descriptionHtml(rule.text)}</div>
      ${progressText}`;
  }
  const note = status === "undiscovered" ? `<div class="collection-info-note">Not discovered yet: make it trigger in a run.</div>` : "";
  return `
    <div class="collection-info-status ${status}">${status === "discovered" ? "Discovered" : "Undiscovered"}</div>
    <div class="collection-info-name">${escapeHtml(item.name)}</div>
    ${collectionBuildsHtml(id)}
    <div class="collection-info-text">${descriptionHtml(collectionDescription(item))}</div>
    ${note}`;
}

function collectionBuildsHtml(id) {
  const labels = sealBuilds(id).map((key) => SEAL_BUILDS.find((build) => build.key === key)?.label).filter(Boolean);
  return `<div class="collection-info-builds">${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}</div>`;
}

function collectionFiltersHtml(all) {
  const filter = collectionFilter();
  const tabs = [{ key: "all", label: "All" }, ...SEAL_BUILDS].map((build) => {
    const count = build.key === "all" ? all.length : all.filter((id) => sealBuilds(id).includes(build.key)).length;
    const active = build.key === filter;
    return `<button class="collection-filter${active ? " active" : ""}" type="button" data-collection-filter="${build.key}" aria-pressed="${active}">${escapeHtml(build.label)}<span class="collection-filter-count">${count}</span></button>`;
  });
  return `<nav class="collection-filters" aria-label="Filter SEALS by build">${tabs.join("")}</nav>`;
}

// filters in place, so the screen does not replay its entrance
function applyCollectionFilter(screen, filter) {
  state.collectionFilter = filter;
  if (!screen) return;
  screen.querySelectorAll("[data-collection-filter]").forEach((button) => {
    const active = button.dataset.collectionFilter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  screen.querySelectorAll(".collection-seal").forEach((button) => {
    button.hidden = !sealMatchesCollectionFilter(button.dataset.collectionSeal, filter);
  });
  screen.querySelectorAll(".collection-section").forEach((section) => {
    section.hidden = !section.querySelector(".collection-seal:not([hidden])");
  });
  screen.querySelectorAll(".collection-seal.selected").forEach((el) => el.classList.remove("selected"));
  hideCollectionInfo(screen);
  const body = screen.querySelector(".collection-body");
  if (body) body.scrollTop = 0;
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
  const filter = collectionFilter();
  const sections = collectionSections()
    .map(
      (section) => `
        <section class="collection-section collection-section-${section.key}"${section.ids.some((id) => sealMatchesCollectionFilter(id, filter)) ? "" : " hidden"}>
          <h2 class="collection-section-title">${escapeHtml(section.title)}</h2>
          <div class="collection-grid">
            ${section.ids
              .map((id) => {
                const status = collectionSealState(id);
                const wide = SATAN_SEAL_IDS.has(id) ? " wide" : "";
                return `
                  <button class="collection-seal ${status}${wide}" type="button" data-collection-seal="${id}"${sealMatchesCollectionFilter(id, filter) ? "" : " hidden"} aria-label="${escapeAttr(status === "locked" ? `Locked SEAL` : ITEMS[id].name)}">
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
      ${collectionFiltersHtml(all)}
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
  document.querySelectorAll("[data-collection-filter]").forEach((button) => {
    bindOn(button, "click", (event) => {
      event.stopPropagation();
      applyCollectionFilter(button.closest(".collection-screen"), button.dataset.collectionFilter);
    });
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

/* ---- main menu: Satan opens the collection ----
   His eyes flare, a dark red bloom swells out of them over the screen, and the collection
   surfaces from it. */
function triggerMenuSatan() {
  const fig = document.querySelector(".menu-fig-satan");
  if (!fig) return;
  menuFigureTrigger.busy = true;
  setMenuFigureLit("satan");
  fig.classList.add("eyes-flare");
  playGameSfx("menuSatanOpen");
  const eyes = fig.querySelector(".fig-eyes");
  const rect = (eyes || fig).getBoundingClientRect();
  const meta = MENU_FIGURES.satan.meta;
  // between his two eyes (head-image pixels 104, 123)
  const ex = eyes ? rect.left + (rect.width * 104) / meta.head.w : rect.left + rect.width * 0.4;
  const ey = eyes ? rect.top + (rect.height * 123) / meta.head.h : rect.top + rect.height * 0.12;
  const veil = document.createElement("div");
  veil.className = "menu-satan-veil";
  veil.style.setProperty("--veil-x", `${Math.round(ex)}px`);
  veil.style.setProperty("--veil-y", `${Math.round(ey)}px`);
  document.body.appendChild(veil);
  setTimeout(() => {
    fig.classList.remove("eyes-flare");
    setMenuFigureLit(null);
    menuFigureTrigger.busy = false;
    openCollectionFromMenu();
    // keep the veil above the collection while it clears
    document.body.appendChild(veil);
    veil.classList.add("clearing");
    setTimeout(() => veil.remove(), 900);
  }, 640);
}

function openCollectionFromMenu() {
  if (state.mode !== "menu") return;
  state.menuCollectionOpen = true;
  render();
}
