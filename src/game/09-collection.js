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
  // Boss Seals (the Pentacles of Saturn p92-p97 and p110 are open from the start)
  p121: { flag: "zilonBuyouts", text: "Buy out three entire Devil's Offerings while Zilon is active." },
  p122: { flag: "sixEliteSeals", text: "Get six SEALS that are all ELITE level 1 or more." },
  p123: { flag: "pyrosGiftBossKill", text: "Defeat a BOSS other than Pyros that has been granted a PYROS-TECH ability." },
  p124: { best: "noKoStreak", goal: 8, text: "Don't get a KO for 8 rounds in a row." },
  p125: { best: "bossesAtOnce", goal: 5, text: "Have 5 BOSSES active at the same time." },
  p126: { flag: "serafimNoSteal", text: "Have Serafeim steal 0 SIN from you when he is first summoned." },
  p127: { flag: "threonArtifacts", text: "Use 4 ARTIFACTS in one round while Threon is active." },
  p128: { flag: "dantrePentakill", text: "Score a PENTAKILL while Dantre is active." },
  // Seal of Satan
  p111: { best: "sinHeld", goal: 666, text: "Have 666 SIN." },
  // the Archangel Seals (self-stacking since they swapped effects with the Pentacles of Saturn)
  p98: { best: "critStreak", goal: 3, text: "Score 3 CRITICAL hits in a row." },
  p99: { stat: "gamesBeaten", goal: 8, text: "Beat the game 8 times (defeat the 8 BOSSES)." },
  p100: { best: "eliteLevel", goal: 6, text: "Get a SEAL to ELITE level 6." },
  p101: { stat: "goeticKills", goal: 66, text: "Eliminate 66 demons (Goetic BOSSES) in total." },
  p102: { stat: "eliminations", goal: 666, text: "Eliminate 666 DAMNED in total." },
  p109: { stat: "yannisKills", goal: 8, text: "Eliminate 8 DAMNED named Yannis in total." }
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

// sections of the collection, in order (as in ITEMS.txt); any purchasable SEAL not listed lands in "Goetic Seals"
const COLLECTION_SECTIONS = [
  { key: "player", title: "Goetic Seals" },
  { key: "apocalypse", title: "Apocalypse Seals", ids: ["p74", "p75", "p76", "p77", "p78", "p79", "p80"] },
  { key: "bosses", title: "Boss Seals", ids: ["p121", "p122", "p123", "p124", "p125", "p126", "p127", "p128"] },
  // the self-stacking SEALS, named after the archangel of each planet, in weekday order (Sun, Moon, Mars, Mercury,
  // Jupiter, Venus, Saturn): Michael, Gabriel, Samael, Raphael, Sachiel, Anael, Cassiel
  { key: "archangel", title: "Archangel Seals", ids: ["p99", "p98", "p109", "p101", "p100", "p103", "p102"] },
  { key: "satan", title: "Seal of Satan", ids: ["p111"] },
  // Father, Son and Holy Spirit: sold apart, they share one SEAL slot
  { key: "trinity", title: "Trinity Seals", ids: ["p131", "p132", "p133"] },
  // the seven Pentacles of Saturn (in pentacle order); they took the Archangel Seals' old chance effects
  { key: "saturn", title: "Seals of Saturn", ids: ["p97", "p93", "p92", "p95", "p110", "p94", "p96"] }
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
  p129: ["reveal"], // Gusion
  p130: ["general"], // Valac
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
  p121: ["bounty"], // Zilon
  p122: ["general"], // Kalha
  p123: ["reveal"], // Pyros
  p124: ["personality"], // Padma
  p125: ["bounty", "memory"], // Petros-Pavlos
  p126: ["artifact"], // Serafeim
  p127: ["memory"], // Threon
  p128: ["critical"], // Dantre
  // Seals of Saturn (chance effects at READY / reveal)
  p92: ["critical"], // Third Pentacle of Saturn
  p93: ["bounty"], // Second Pentacle of Saturn
  p94: ["artifact"], // Sixth Pentacle of Saturn
  p95: ["reveal"], // Fourth Pentacle of Saturn
  p96: ["personality"], // Seventh Pentacle of Saturn
  p97: ["memory"], // First Pentacle of Saturn
  p110: ["general"], // Fifth Pentacle of Saturn (wipes MEMORY and BOUNTY)
  // Satan SEALS
  p111: ["general"], // Satan
  // Trinity SEALS
  p131: ["general"], // Father (TARGET difference as %, 20% strike, double damage)
  p132: ["general"], // Son (double SIN, +8 SIN, free rerolls)
  p133: ["general"], // Holy Spirit (the wheel)
  // Archangel SEALS (self-stacking)
  p98: ["critical"], // Gabriel
  p99: ["memory"], // Michael
  p100: ["bounty"], // Sachiel
  p101: ["general"], // Raphael
  p102: ["reveal"], // Cassiel
  p103: ["artifact"], // Anael
  p109: ["personality"] // Samael
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

/* ---- search: one box on each tab, matched as you type ----
   SEALS match by name, text and build; demons by number (9 or IX) and, once defeated, by name (other
   spellings too: "morax", "gamigin"), their SEAL's name and "bound". Every word typed has to match. */
const collectionSearch = { seals: "", goetia: "", angels: "" };

function collectionSearchText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function collectionSearchWords(query) {
  const text = collectionSearchText(query);
  return text ? text.split(" ") : [];
}

function sealMatchesSearch(id, query = collectionSearch.seals) {
  const words = collectionSearchWords(query);
  if (!words.length) return true;
  const item = ITEMS[id];
  if (!item) return false;
  const builds = sealBuilds(id).map((key) => SEAL_BUILDS.find((build) => build.key === key)?.label || "");
  const haystack = collectionSearchText([item.name, item.description, ...builds].join(" "));
  return words.every((word) => haystack.includes(word));
}

function collectionSealVisible(id) {
  return sealMatchesCollectionFilter(id) && sealMatchesSearch(id);
}

function demonMatchesSearch(key, query) {
  if (ARCHANGEL_BY_KEY[key]) return archangelMatchesSearch(key, query ?? collectionSearch.angels);
  const words = collectionSearchWords(query ?? collectionSearch.goetia);
  if (!words.length) return true;
  const index = GOETIC_BOSS_KEYS.indexOf(key);
  const spec = GOETIC_BOSS_SPECS[index];
  if (!spec) return false;
  const numbers = [String(index + 1), romanNumeral(index + 1).toLowerCase()];
  if (words.length === 1 && numbers.includes(words[0])) return true;
  // a demon not defeated yet has no name to find
  if (!isDemonSlain(key)) return false;
  const seal = spec.passiveId && ITEMS[spec.passiveId] ? ITEMS[spec.passiveId].name : "";
  const haystack = collectionSearchText(
    [spec.name, spec.image.replace(/^\d+-|\.png$/gi, ""), seal, collectionBoundDemon() === key ? "bound" : ""].join(" ")
  );
  return words.every((word) => haystack.includes(word));
}

function archangelMatchesSearch(key, query = collectionSearch.angels) {
  const words = collectionSearchWords(query);
  if (!words.length) return true;
  const spec = ARCHANGEL_BY_KEY[key];
  if (!spec) return false;
  const known = [spec.planet, "archangel"];
  if (isArchangelDefeated(key)) known.push(spec.name, ITEMS[spec.sealId]?.name || "", spec.build, collectionBoundDemon() === key ? "bound" : "");
  const haystack = collectionSearchText(known.join(" "));
  return words.every((word) => haystack.includes(word));
}

function collectionSearchHtml(tab) {
  const value = collectionSearch[tab] || "";
  const label = tab === "goetia" ? "Search demons" : tab === "angels" ? "Search Archangels" : "Search SEALS";
  return `
    <label class="collection-search${value ? " has-value" : ""}">
      <img class="collection-search-icon" src="assets/ui/search-eye.png" alt="" aria-hidden="true" draggable="false" />
      <input class="collection-search-input" type="text" data-collection-search="${tab}" value="${escapeAttr(value)}" placeholder="Search" aria-label="${label}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" />
      <button type="button" class="collection-search-clear" data-collection-search-clear="${tab}" aria-label="Clear the search">&times;</button>
    </label>`;
}

function collectionEmptyHtml(tab) {
  return `<div class="collection-empty" data-collection-empty="${tab}" hidden>Nothing matches your search.</div>`;
}

// shows and hides SEALS, sections and demons in place for the build filter and both searches
function applyCollectionVisibility(screen) {
  if (!screen) return;
  screen.querySelectorAll(".collection-seal").forEach((button) => {
    button.hidden = !collectionSealVisible(button.dataset.collectionSeal);
  });
  screen.querySelectorAll(".collection-section").forEach((section) => {
    section.hidden = !section.querySelector(".collection-seal:not([hidden])");
  });
  screen.querySelectorAll(".collection-demon").forEach((button) => {
    button.hidden = !demonMatchesSearch(button.dataset.collectionDemon);
  });
  const sealsEmpty = screen.querySelector('[data-collection-empty="seals"]');
  if (sealsEmpty) sealsEmpty.hidden = Boolean(screen.querySelector(".collection-seal:not([hidden])"));
  ["goetia", "angels"].forEach((tab) => {
    const empty = screen.querySelector(`[data-collection-empty="${tab}"]`);
    const panel = screen.querySelector(`[data-collection-panel="${tab}"]`);
    if (empty && panel) empty.hidden = Boolean(panel.querySelector(".collection-demon:not([hidden])"));
  });
  screen.querySelectorAll(".collection-search").forEach((label) => {
    const input = label.querySelector("[data-collection-search]");
    label.classList.toggle("has-value", Boolean(input?.value));
  });
}

function applyCollectionSearch(screen, tab, value) {
  collectionSearch[tab] = value;
  if (!screen) return;
  screen.querySelectorAll(COLLECTION_SELECTED).forEach((el) => el.classList.remove("selected"));
  hideCollectionInfo(screen);
  applyCollectionVisibility(screen);
  const body = screen.querySelector(`[data-collection-panel="${tab}"] .collection-body`);
  if (body) body.scrollTop = 0;
}

/* ---- stored progress ---- */
let collectionProgressCache = null;

function defaultCollectionProgress() {
  return {
    version: 2,
    unlocked: [],
    discovered: [],
    // the Goetic BOSSES slain at least once (GOETIC_BOSS_SPECS keys): the Ars Goetia tab
    slain: [],
    // the Archangel BOSSES defeated at least once (ARCHANGEL_BOSS_SPECS keys): the Archangels tab
    archangels: [],
    // the demon or Archangel bound for the next run (a defeated one), or null
    boundDemon: null,
    // testing only (DEV button in the Ars Goetia): every demon counts as defeated while it is on
    devAllDemons: false,
    stats: Object.fromEntries(Object.keys(COLLECTION_STAT_LABELS).map((key) => [key, 0])),
    best: Object.fromEntries(Object.keys(COLLECTION_BEST_LABELS).map((key) => [key, 0])),
    flags: {},
    // SEAL records, by SEAL id (see normalizeSealRecord)
    seals: {}
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
      if (Array.isArray(saved.slain)) progress.slain = saved.slain.filter((key) => typeof key === "string" && GOETIC_BOSS_BY_KEY[key]);
      progress.devAllDemons = saved.devAllDemons === true;
      if (Array.isArray(saved.archangels)) progress.archangels = saved.archangels.filter((key) => typeof key === "string" && ARCHANGEL_BY_KEY[key]);
      if (typeof saved.boundDemon === "string" && (GOETIC_BOSS_BY_KEY[saved.boundDemon] || ARCHANGEL_BY_KEY[saved.boundDemon])) progress.boundDemon = saved.boundDemon;
      if (saved.flags && typeof saved.flags === "object") progress.flags = { ...saved.flags };
      if (saved.seals && typeof saved.seals === "object") {
        Object.entries(saved.seals).forEach(([id, record]) => {
          if (typeof id === "string" && record && typeof record === "object") progress.seals[id] = normalizeSealRecord(record);
        });
      }
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
  const defaults = { uniqueKills: [], beaten: false, zilonBuyouts: 0, buyoutCounted: false, critStreak: 0, pentakillStreak: 0, noKoStreak: 0, roundSpent: 0, roundProcessed: 0, sealRound: null };
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
  if (bot?.isBoss && bot.goeticKey) collectionSlayDemon(bot.goeticKey);
  if (bot?.isBoss && bot.archangelKey) collectionDefeatArchangel(bot.archangelKey);
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
      collectionNoteSealWins();
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

/* ---- SEAL records: lifetime numbers for each SEAL, shown in the Collection while Shift is held ----
     wins      games beaten (the 8 unique BOSSES) with the SEAL in a slot at the moment of the win;
               a SEAL you have won with turns deep red in the Collection, like a SEAL that triggers
     elite     the highest ELITE level it reached (not kept for SEALS that cannot be upgraded)
     triggers  every activation, in all runs
     total / run / round   for every amount the SEAL produces (the state.sealStats kinds below):
               the lifetime sum, the most in one run, the most in one round
   Only real arcade runs count (collectionCounts). */
const SEAL_RECORD_KINDS = [
  { key: "damage", label: "Damage dealt" },
  { key: "healing", label: "Healing done" },
  { key: "saved", label: "Damage negated" },
  { key: "credits", label: "SIN gained" },
  { key: "memory", label: "MEMORY added" },
  { key: "bounty", label: "BOUNTY added" },
  { key: "bountyRemoved", label: "BOUNTY removed" },
  { key: "personality", label: "Personalities changed" }
];

function normalizeSealRecord(source = {}) {
  const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
  const amounts = (group) =>
    Object.fromEntries(
      SEAL_RECORD_KINDS.map(({ key }) => [key, count(group && typeof group === "object" ? group[key] : 0)]).filter(([, value]) => value > 0)
    );
  return {
    wins: count(source.wins),
    elite: count(source.elite),
    triggers: count(source.triggers),
    total: amounts(source.total),
    run: amounts(source.run),
    round: amounts(source.round)
  };
}

function sealRecord(id, create = false) {
  const seals = loadCollectionProgress().seals;
  if (!seals[id] && create) seals[id] = normalizeSealRecord();
  return seals[id] || null;
}

function sealRecordShowsElite(id) {
  return !NON_UPGRADABLE_SEAL_IDS.has(id) && !SELF_STACKING_SEAL_IDS.has(id);
}

function isSealBeaten(id) {
  return (sealRecord(id)?.wins || 0) > 0;
}

// recordSealStat (03) calls this with the amount just added and the SEAL's total for this run
function collectionNoteSealStat(id, kind, value, runTotal) {
  if (!collectionCounts() || !ITEMS[id] || !(value > 0) || !SEAL_RECORD_KINDS.some((entry) => entry.key === kind)) return;
  const record = sealRecord(id, true);
  record.total[kind] = (record.total[kind] || 0) + value;
  record.run[kind] = Math.max(record.run[kind] || 0, runTotal || 0);
  const run = collectionRun();
  if (!run.sealRound || run.sealRound.round !== state.round) run.sealRound = { round: state.round, values: {} };
  const key = `${id}:${kind}`;
  run.sealRound.values[key] = (run.sealRound.values[key] || 0) + value;
  record.round[kind] = Math.max(record.round[kind] || 0, run.sealRound.values[key]);
  collectionDirty = true;
}

function collectionNoteSealTrigger(id) {
  if (!collectionCounts() || !ITEMS[id]) return;
  sealRecord(id, true).triggers += 1;
  collectionDirty = true;
}

// the game was just beaten: every SEAL in a slot right now gets the win
function collectionNoteSealWins() {
  const ids = [...new Set((state.player.passives || []).map((item) => item?.id).filter((id) => id && ITEMS[id] && !REMOVED_PASSIVE_IDS.has(id)))];
  ids.forEach((id) => {
    sealRecord(id, true).wins += 1;
    collectionDiscover(id);
  });
  if (ids.length) collectionDirty = true;
}

function collectionNoteSealElite() {
  (state.player.passives || []).forEach((item) => {
    if (!item || !ITEMS[item.id] || !sealRecordShowsElite(item.id)) return;
    const level = Math.max(0, (item.stack || 1) - 1);
    if (level <= 0 || level <= (sealRecord(item.id)?.elite || 0)) return;
    sealRecord(item.id, true).elite = level;
    collectionDirty = true;
  });
}

// the beaten mark: one small hand-drawn symbol next to the status, no word
const COLLECTION_BEATEN_MARKS = {
  pentagram: `<circle cx="12" cy="12" r="10.4"/><path d="M12 21.3 6.53 4.48 20.85 14.87H3.16L17.47 4.48Z"/>`,
  skull: `<path d="M12 2.6C6.9 2.6 4.1 6 4.1 10.2c0 2.5 1.1 4.2 2.6 5.2V18h2.2v2.4h6.2V18h2.2v-2.6c1.5-1 2.6-2.7 2.6-5.2 0-4.2-2.8-7.6-7.9-7.6Z"/><circle cx="8.9" cy="10.9" r="1.9" fill="currentColor"/><circle cx="15.1" cy="10.9" r="1.9" fill="currentColor"/><path d="M12 13.7 10.9 15.7h2.2ZM10.9 18v2.4M13.1 18v2.4"/>`,
  trophy: `<path d="M7 3.4h10v4.6c0 3-2.2 5.5-5 5.5S7 11 7 8Z"/><path d="M7 5.4H4.4c0 2.6 1.3 4.1 3.3 4.4M17 5.4h2.6c0 2.6-1.3 4.1-3.3 4.4M12 13.5v3.4M9.4 16.9h5.2v3.6H9.4ZM8 20.5h8"/>`
};
const COLLECTION_BEATEN_MARK = "pentagram";

function collectionBeatenMarkHtml(mark = COLLECTION_BEATEN_MARK) {
  const shape = COLLECTION_BEATEN_MARKS[mark] || COLLECTION_BEATEN_MARKS.pentagram;
  return `<svg class="collection-beaten-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Game beaten with this SEAL"><title>Game beaten with this SEAL</title>${shape}</svg>`;
}

// the records block: wins / ELITE / triggers, then a small table with total, best run and best round
function sealRecordsHtml(id) {
  const record = sealRecord(id) || normalizeSealRecord();
  const row = (label, value, shown = value, extraClass = "") =>
    `<div class="collection-record-row"><span>${escapeHtml(label)}</span><span class="collection-record-lead"></span><span class="collection-record-value${value > 0 ? "" : " zero"}${extraClass}">${escapeHtml(shown)}</span></div>`;
  const rows = [
    row("Games beaten", record.wins, formatNumber(record.wins)),
    sealRecordShowsElite(id) ? row("Highest ELITE", record.elite, record.elite > 0 ? romanNumeral(record.elite) : "-", " roman") : "",
    row("Times triggered", record.triggers, formatNumber(record.triggers))
  ].join("");
  const kinds = SEAL_RECORD_KINDS.filter(({ key }) => (record.total[key] || 0) > 0);
  const table = kinds.length
    ? `<table class="collection-record-table">
        <thead><tr><th></th><th>Total</th><th>Best run</th><th>Best round</th></tr></thead>
        <tbody>${kinds
          .map(({ key, label }) => `<tr><th>${escapeHtml(label)}</th><td>${formatNumber(record.total[key] || 0)}</td><td>${formatNumber(record.run[key] || 0)}</td><td>${formatNumber(record.round[key] || 0)}</td></tr>`)
          .join("")}</tbody>
      </table>`
    : "";
  return `<div class="collection-info-records">${rows}${table}</div>`;
}

/* ---- the Ars Goetia: the 72 Goetic BOSSES ----
   A demon is discovered the first time its BOSS is slain in a run (like a SEAL the first time it triggers).
   The Collection lists them on its second tab in the order of the book; the ones not slain yet stay dark
   and nameless. */
let collectionTab = "seals";

function isDemonSlain(key) {
  const progress = loadCollectionProgress();
  return Boolean(GOETIC_BOSS_BY_KEY[key]) && (progress.devAllDemons || progress.slain.includes(key));
}

// DEV (testing): every demon counts as defeated, so any of them can be bound; off again shows the real progress
function toggleDevAllDemons() {
  const progress = loadCollectionProgress();
  progress.devAllDemons = !progress.devAllDemons;
  saveCollectionProgress();
}

function isArchangelDefeated(key) {
  const progress = loadCollectionProgress();
  return Boolean(ARCHANGEL_BY_KEY[key]) && (progress.devAllDemons || progress.archangels.includes(key));
}

// a demon or an Archangel that can be bound
function isBossEntryDefeated(key) {
  return isDemonSlain(key) || isArchangelDefeated(key);
}

function collectionDefeatArchangel(key) {
  if (state.mode !== "arcade" || !ARCHANGEL_BY_KEY[key]) return;
  const progress = loadCollectionProgress();
  if (progress.archangels.includes(key)) return;
  progress.archangels.push(key);
  saveCollectionProgress();
}

function collectionSlayDemon(key) {
  if (state.mode !== "arcade" || !GOETIC_BOSS_BY_KEY[key]) return;
  const progress = loadCollectionProgress();
  if (progress.slain.includes(key)) return;
  progress.slain.push(key);
  saveCollectionProgress();
}

/* binding: one defeated demon can be bound. A run takes the one bound when it starts (state.boundDemon)
   and keeps it to the end: its SEAL is free in Devil's Offerings and YOU comes instead of it. */
function collectionBoundDemon() {
  const key = loadCollectionProgress().boundDemon;
  return key && isBossEntryDefeated(key) ? key : null;
}

function boundDemonForNewRun() {
  return collectionBoundDemon();
}

function toggleBoundDemon(key) {
  if (!isBossEntryDefeated(key)) return;
  const progress = loadCollectionProgress();
  progress.boundDemon = progress.boundDemon === key ? null : key;
  saveCollectionProgress();
}

// the header line and the marks on the grid, updated in place after a bind
function collectionBoundLine() {
  const key = collectionBoundDemon();
  const runKey = state.mode === "arcade" ? state.boundDemon : null;
  const name = (demonKey) => (demonKey ? (GOETIC_BOSS_BY_KEY[demonKey] || ARCHANGEL_BY_KEY[demonKey])?.name || "none" : "none");
  const runNote = state.mode === "arcade" && runKey !== key ? `<span>this run: <strong>${escapeHtml(name(runKey))}</strong></span>` : "";
  return `<span>bound: <strong>${escapeHtml(name(key))}</strong></span>${runNote}`;
}

function refreshCollectionBinding(screen) {
  if (!screen) return;
  const key = collectionBoundDemon();
  screen.querySelectorAll("[data-collection-demon]").forEach((button) => {
    button.classList.toggle("bound", button.dataset.collectionDemon === key);
  });
  screen.querySelectorAll(".collection-bound-line").forEach((line) => {
    line.innerHTML = collectionBoundLine();
  });
  const pinned = screen.querySelector(".collection-demon.selected");
  if (pinned) showCollectionInfo(pinned, true);
}

// small copies of the BOSS art (the full images are 1254px)
function demonThumbPath(spec) {
  return `${GOETIC_BOSS_IMAGE_ROOT}/thumbs/${spec.image.replace(/\.png$/i, ".webp")}`;
}

function collectionDemonsHtml() {
  const bound = collectionBoundDemon();
  const cells = GOETIC_BOSS_SPECS.map((spec, index) => {
    const slain = isDemonSlain(spec.key);
    const number = romanNumeral(index + 1);
    return `
      <button class="collection-demon ${slain ? "slain" : "unslain"}${spec.key === bound ? " bound" : ""}" type="button"${demonMatchesSearch(spec.key) ? "" : " hidden"} data-collection-demon="${escapeAttr(spec.key)}" aria-label="${escapeAttr(slain ? spec.name : `${number}, not defeated`)}">
        <img class="collection-demon-art" src="${escapeAttr(demonThumbPath(spec))}" alt="" loading="lazy" draggable="false" />
        <span class="collection-demon-number">${number}${slain ? `<span class="collection-demon-bound"> · Bound</span>` : ""}</span>
        <span class="collection-demon-name">${slain ? escapeHtml(spec.name) : "???"}</span>
      </button>`;
  });
  return `<div class="collection-demon-grid">${cells.join("")}</div>${collectionEmptyHtml("goetia")}`;
}

function archangelThumbPath(spec) {
  return `${ARCHANGEL_BOSS_IMAGE_ROOT}/thumbs/${spec.image.replace(/\.png$/i, ".webp")}`;
}

// the Archangels tab: the seven, in weekday order (Sun to Saturn); the line under each names its planet
function collectionArchangelsHtml() {
  const bound = collectionBoundDemon();
  const cells = ARCHANGEL_BOSS_SPECS.map((spec) => {
    const defeated = isArchangelDefeated(spec.key);
    const planet = spec.planet.replace(/^the /, "");
    return `
      <button class="collection-demon collection-angel ${defeated ? "slain" : "unslain"}${spec.key === bound ? " bound" : ""}" type="button"${demonMatchesSearch(spec.key) ? "" : " hidden"} data-collection-demon="${escapeAttr(spec.key)}" aria-label="${escapeAttr(defeated ? spec.name : `Archangel of ${spec.planet}, not defeated`)}">
        <img class="collection-demon-art" src="${escapeAttr(archangelThumbPath(spec))}" alt="" loading="lazy" draggable="false" />
        <span class="collection-demon-number">${escapeHtml(planet)}${defeated ? `<span class="collection-demon-bound"> · Bound</span>` : ""}</span>
        <span class="collection-demon-name">${defeated ? escapeHtml(spec.name) : "???"}</span>
      </button>`;
  });
  return `<div class="collection-demon-grid collection-angel-grid">${cells.join("")}</div>${collectionEmptyHtml("angels")}`;
}

function collectionArchangelInfoHtml(key, pinned = false) {
  const spec = ARCHANGEL_BY_KEY[key];
  if (!spec) return "";
  if (!isArchangelDefeated(key)) {
    return `
      <div class="collection-info-status unslain">Not defeated</div>
      <div class="collection-info-name">???</div>
      <div class="collection-info-number">Archangel of ${escapeHtml(spec.planet)}</div>
      <div class="collection-info-note">Not discovered yet: defeat this Archangel in a run.</div>`;
  }
  const seal = ITEMS[spec.sealId]?.name || "";
  return `
    <div class="collection-info-status slain">Defeated</div>
    <div class="collection-info-name">${escapeHtml(spec.name)}</div>
    <div class="collection-info-number">Archangel of ${escapeHtml(spec.planet)}</div>
    <div class="collection-info-text">${descriptionHtml(ARCHANGEL_ABILITY_TEXT[key])}</div>
    ${collectionDemonBindHtml(key, seal, pinned)}`;
}

function collectionDemonInfoHtml(key, pinned = false) {
  if (ARCHANGEL_BY_KEY[key]) return collectionArchangelInfoHtml(key, pinned);
  const index = GOETIC_BOSS_KEYS.indexOf(key);
  const spec = GOETIC_BOSS_SPECS[index];
  if (!spec) return "";
  const number = romanNumeral(index + 1);
  if (!isDemonSlain(key)) {
    return `
      <div class="collection-info-status unslain">Not defeated</div>
      <div class="collection-info-name">???</div>
      <div class="collection-info-number">Spirit ${number} of the Ars Goetia</div>
      <div class="collection-info-note">Not discovered yet: slay this BOSS in a run.</div>`;
  }
  const seal = spec.passiveId && ITEMS[spec.passiveId] && !REMOVED_PASSIVE_IDS.has(spec.passiveId) ? ITEMS[spec.passiveId].name : "";
  return `
    <div class="collection-info-status slain">Defeated</div>
    <div class="collection-info-name">${escapeHtml(spec.name)}</div>
    <div class="collection-info-number">Spirit ${number} of the Ars Goetia</div>
    ${seal ? `<div class="collection-info-text">While it lives, ${escapeHtml(seal)} is silenced.</div>` : ""}
    ${collectionDemonBindHtml(key, seal, pinned)}`;
}

function collectionDemonBindHtml(key, seal, pinned) {
  const bound = collectionBoundDemon() === key;
  const archangel = Boolean(ARCHANGEL_BY_KEY[key]);
  const sealName = seal ? escapeHtml(seal) : "its SEAL";
  const sealText = archangel ? `you start with ${sealName}` : `${sealName} costs nothing in Devil's Offerings`;
  const text = bound
    ? `Bound. From your next run, ${sealText}, and you will face yourself in its place.`
    : `Bind it, and from your next run ${sealText}, and you will face yourself in its place.`;
  const runNote = state.mode === "arcade" && state.boundDemon === key ? `<div class="collection-info-note">Bound in this run.</div>` : "";
  const control = pinned
    ? `<button type="button" class="collection-bind-button" data-collection-bind="${escapeAttr(key)}">${bound ? "Unbind" : "Bind"}</button>`
    : `<div class="collection-info-note">Click to ${bound ? "unbind" : "bind"}.</div>`;
  return `
    <div class="collection-info-bind">
      <div class="collection-info-text">${text}</div>
      ${runNote}
      ${control}
    </div>`;
}

// switches tabs in place, so the screen does not replay its entrance
function applyCollectionTab(screen, tab) {
  collectionTab = ["goetia", "angels"].includes(tab) ? tab : "seals";
  if (!screen) return;
  screen.querySelectorAll("[data-collection-tab]").forEach((button) => {
    const active = button.dataset.collectionTab === collectionTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  screen.querySelectorAll("[data-collection-panel], [data-collection-for]").forEach((el) => {
    el.hidden = (el.dataset.collectionPanel || el.dataset.collectionFor) !== collectionTab;
  });
  screen.querySelectorAll(COLLECTION_SELECTED).forEach((el) => el.classList.remove("selected"));
  hideCollectionInfo(screen);
}

const COLLECTION_SELECTED = ".collection-seal.selected, .collection-demon.selected";

// after every render of a run: moment checks, end-of-round streaks, then unlock what is earned
function collectionAfterRender() {
  if (!collectionCounts()) return;
  const run = collectionRun();
  if (state.player.hp === 1) collectionFlag("oneHealth");
  collectionRaise("sinHeld", state.player.credits);
  collectionRaise("bossesAtOnce", (state.bots || []).filter((bot) => bot?.isBoss && !bot.eliminated && bot.hp > 0).length);
  collectionRaise("eliteLevel", Math.max(0, ...(state.player.passives || []).map((item) => (item?.stack || 1) - 1)));
  collectionNoteSealElite();
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
  // hold Shift for the ELITE rule and the SEAL's records, like an equipped SEAL's tooltip
  const elite = splitEliteDescription(item.description || "").elite;
  const records = status === "discovered" ? sealRecordsHtml(id) : "";
  const more = elite || records;
  return `
    <div class="collection-info-top">
      <div class="collection-info-status ${status}">${status === "discovered" ? "Discovered" : "Undiscovered"}${isSealBeaten(id) ? collectionBeatenMarkHtml() : ""}</div>
      ${more ? `<div class="collection-info-shift-hint">press shift for more</div><button type="button" class="tooltip-more-button" data-tooltip-more><span class="more-label">More</span><span class="less-label">Less</span></button>` : ""}
    </div>
    <div class="collection-info-name">${escapeHtml(item.name)}</div>
    ${collectionBuildsHtml(id)}
    <div class="collection-info-text">${descriptionHtml(collectionDescription(item))}</div>
    ${elite ? `<div class="collection-info-elite">${descriptionHtml(elite)}</div>` : ""}
    ${records}
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
  applyCollectionVisibility(screen);
  screen.querySelectorAll(COLLECTION_SELECTED).forEach((el) => el.classList.remove("selected"));
  hideCollectionInfo(screen);
  const body = screen.querySelector(".collection-body");
  if (body) body.scrollTop = 0;
}

function collectionDescription(item) {
  try {
    return descriptionWithoutElite(itemDescription(item) || item.description || "");
  } catch (error) {
    return descriptionWithoutElite(item.description || "");
  }
}

function renderCollectionScreen(from) {
  const all = collectibleSealIds();
  const unlocked = all.filter((id) => isSealUnlocked(id)).length;
  const discovered = all.filter((id) => isSealUnlocked(id) && isSealDiscovered(id)).length;
  const filter = collectionFilter();
  const slain = GOETIC_BOSS_KEYS.filter((key) => isDemonSlain(key)).length;
  const goetia = collectionTab === "goetia";
  const angels = collectionTab === "angels";
  const angelsDefeated = ARCHANGEL_KEYS.filter((key) => isArchangelDefeated(key)).length;
  const devButton = () =>
    `<button type="button" class="collection-dev-button${loadCollectionProgress().devAllDemons ? " active" : ""}" data-collection-dev-demons data-tooltip="Testing: every demon and Archangel counts as defeated, so any of them can be bound">${loadCollectionProgress().devAllDemons ? "DEV: all unlocked" : "DEV: unlock all"}</button>`;
  const tabs = [
    { key: "seals", label: "Seals" },
    { key: "goetia", label: "Ars Goetia" },
    { key: "angels", label: "Archangels" }
  ].map((tab) => {
    const active = tab.key === collectionTab;
    return `<button class="collection-tab${active ? " active" : ""}" type="button" role="tab" data-collection-tab="${tab.key}" aria-selected="${active}">${escapeHtml(tab.label)}</button>`;
  });
  const sections = collectionSections()
    .map(
      (section) => `
        <section class="collection-section collection-section-${section.key}"${section.ids.some((id) => collectionSealVisible(id)) ? "" : " hidden"}>
          <h2 class="collection-section-title">${escapeHtml(section.title)}</h2>
          <div class="collection-grid">
            ${section.ids
              .map((id) => {
                const status = collectionSealState(id);
                const wide = SATAN_SEAL_IDS.has(id) ? " wide" : "";
                const beaten = status !== "locked" && isSealBeaten(id) ? " beaten" : "";
                return `
                  <button class="collection-seal ${status}${wide}${beaten}" type="button" data-collection-seal="${id}"${collectionSealVisible(id) ? "" : " hidden"} aria-label="${escapeAttr(status === "locked" ? `Locked SEAL` : ITEMS[id].name)}">
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
    <div class="collection-screen collection-from-${from}" role="dialog" aria-label="Collection">
      <header class="collection-header">
        <button class="collection-back" type="button" data-collection-back="${from}">Back</button>
        <nav class="collection-tabs" role="tablist" aria-label="Collection">${tabs.join("")}</nav>
        <div class="collection-counts" data-collection-for="seals"${goetia || angels ? " hidden" : ""}>
          <span><strong>${discovered}</strong> / ${all.length} discovered</span>
          <span><strong>${unlocked}</strong> / ${all.length} unlocked</span>
        </div>
        <div class="collection-counts" data-collection-for="goetia"${goetia ? "" : " hidden"}>
          <span><strong>${slain}</strong> / ${GOETIC_BOSS_TOTAL} defeated</span>
          <span class="collection-bound-line">${collectionBoundLine()}</span>
        </div>
        <div class="collection-counts" data-collection-for="angels"${angels ? "" : " hidden"}>
          <span><strong>${angelsDefeated}</strong> / ${ARCHANGEL_KEYS.length} defeated</span>
          <span class="collection-bound-line">${collectionBoundLine()}</span>
        </div>
      </header>
      <div class="collection-panel" data-collection-panel="seals"${goetia || angels ? " hidden" : ""}>
        ${collectionFiltersHtml(all)}
        <div class="collection-legend">
          ${collectionSearchHtml("seals")}
          <span class="legend discovered" aria-hidden="true">discovered</span>
          <span class="legend undiscovered" aria-hidden="true">undiscovered</span>
          <span class="legend locked" aria-hidden="true">locked</span>
        </div>
        <div class="collection-body">${sections}${collectionEmptyHtml("seals")}</div>
      </div>
      <div class="collection-panel" data-collection-panel="goetia"${goetia ? "" : " hidden"}>
        <div class="collection-legend">
          ${collectionSearchHtml("goetia")}
          <span class="legend slain" aria-hidden="true">defeated</span>
          <span class="legend unslain" aria-hidden="true">not defeated</span>
          ${devButton()}
        </div>
        <div class="collection-body">${collectionDemonsHtml()}</div>
      </div>
      <div class="collection-panel" data-collection-panel="angels"${angels ? "" : " hidden"}>
        <div class="collection-legend">
          ${collectionSearchHtml("angels")}
          <span class="legend slain" aria-hidden="true">defeated</span>
          <span class="legend unslain" aria-hidden="true">not defeated</span>
          ${devButton()}
        </div>
        <div class="collection-body">${collectionArchangelsHtml()}</div>
      </div>
      <div class="collection-info" aria-live="polite"></div>
    </div>`;
}

function showCollectionInfo(button, pinned) {
  const screen = button.closest(".collection-screen");
  const info = screen?.querySelector(".collection-info");
  if (!info) return;
  const id = button.dataset.collectionSeal;
  const demon = button.dataset.collectionDemon;
  if (touchTooltipMode()) setShiftTooltipMore(false); // on the phone every SEAL opens short (More shows the rest)
  info.innerHTML = demon ? collectionDemonInfoHtml(demon, pinned) : collectionInfoHtml(id);
  info.className = `collection-info visible ${demon ? (isBossEntryDefeated(demon) ? "slain" : "unslain") : collectionSealState(id)}`;
  // a clicked, defeated demon's box holds the Bind button
  if (demon && pinned && isBossEntryDefeated(demon)) info.classList.add("interactive");
  screen.querySelectorAll(COLLECTION_SELECTED).forEach((el) => el.classList.remove("selected"));
  if (pinned) button.classList.add("selected");
  collectionInfoAnchor = button;
  positionCollectionInfo(info, button);
}

let collectionInfoAnchor = null;

// Shift shows the ELITE line, which changes the box height: keep it beside its SEAL and on screen
function repositionCollectionInfo() {
  const info = document.querySelector(".collection-screen .collection-info.visible");
  if (!info || !collectionInfoAnchor?.isConnected) return;
  positionCollectionInfo(info, collectionInfoAnchor);
}

function positionCollectionInfo(info, button) {
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
  if (info && !screen.querySelector(COLLECTION_SELECTED)) info.classList.remove("visible");
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
  document.querySelectorAll("[data-collection-search]").forEach((input) => {
    const screen = input.closest(".collection-screen");
    bindOn(input, "input", () => applyCollectionSearch(screen, input.dataset.collectionSearch, input.value));
    bindOn(input, "click", (event) => event.stopPropagation());
    // typing never reaches the game's keys; Esc clears the search first, then closes the collection
    bindOn(input, "keydown", (event) => {
      if (event.key === "Escape" && !input.value) {
        input.blur();
        return;
      }
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        input.value = "";
        applyCollectionSearch(screen, input.dataset.collectionSearch, "");
      } else if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
    });
  });
  document.querySelectorAll("[data-collection-search-clear]").forEach((button) => {
    bindOn(button, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const tab = button.dataset.collectionSearchClear;
      const screen = button.closest(".collection-screen");
      const input = screen?.querySelector(`[data-collection-search="${tab}"]`);
      if (input) input.value = "";
      applyCollectionSearch(screen, tab, "");
      input?.focus();
    });
  });
  document.querySelectorAll("[data-collection-dev-demons]").forEach((button) => {
    bindOn(button, "click", (event) => {
      event.stopPropagation();
      toggleDevAllDemons();
      const screen = button.closest(".collection-screen");
      const body = screen?.querySelector('[data-collection-panel="goetia"] .collection-body');
      if (body) body.innerHTML = collectionDemonsHtml();
      const angelBody = screen?.querySelector('[data-collection-panel="angels"] .collection-body');
      if (angelBody) angelBody.innerHTML = collectionArchangelsHtml();
      applyCollectionVisibility(screen);
      const count = screen?.querySelector('[data-collection-for="goetia"] strong');
      if (count) count.textContent = String(GOETIC_BOSS_KEYS.filter((key) => isDemonSlain(key)).length);
      const angelCount = screen?.querySelector('[data-collection-for="angels"] strong');
      if (angelCount) angelCount.textContent = String(ARCHANGEL_KEYS.filter((key) => isArchangelDefeated(key)).length);
      screen?.querySelectorAll("[data-collection-dev-demons]").forEach((other) => {
        other.classList.toggle("active", loadCollectionProgress().devAllDemons);
        other.textContent = loadCollectionProgress().devAllDemons ? "DEV: all unlocked" : "DEV: unlock all";
      });
      hideCollectionInfo(screen);
      bindCollectionEvents();
      refreshCollectionBinding(screen);
    });
  });
  document.querySelectorAll("[data-collection-tab]").forEach((button) => {
    bindOn(button, "click", (event) => {
      event.stopPropagation();
      applyCollectionTab(button.closest(".collection-screen"), button.dataset.collectionTab);
    });
  });
  document.querySelectorAll("[data-collection-seal], [data-collection-demon]").forEach((button) => {
    bindOn(button, "pointerenter", (event) => {
      // a clicked demon keeps its box (with Bind) while the mouse travels to it
      if (button.closest(".collection-screen")?.querySelector(".collection-demon.selected")) return;
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
  applyCollectionVisibility(screen);
  const info = screen?.querySelector(".collection-info");
  if (info) {
    bindOn(info, "click", (event) => {
      if (!info.classList.contains("interactive")) return;
      event.stopPropagation();
      const bind = event.target.closest?.("[data-collection-bind]");
      if (!bind) return;
      toggleBoundDemon(bind.dataset.collectionBind);
      // the pact sound from the story when a demon is bound; the SEAL ghost when it is let go
      playGameSfx(collectionBoundDemon() ? "introEvil" : "sealSellGhost");
      refreshCollectionBinding(screen);
    });
  }
  if (screen) {
    bindOn(screen, "click", () => {
      screen.querySelectorAll(COLLECTION_SELECTED).forEach((el) => el.classList.remove("selected"));
      hideCollectionInfo(screen);
    });
    screen.querySelectorAll(".collection-body").forEach((body) => {
      bindOn(body, "scroll", () => {
        screen.querySelectorAll(COLLECTION_SELECTED).forEach((el) => el.classList.remove("selected"));
        hideCollectionInfo(screen);
      });
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
