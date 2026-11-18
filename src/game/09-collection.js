/* ---------- SEAL collection and unlockable SEALS ----------
   Some SEALS start locked: they never appear in the Devil's Offerings until their achievement is met
   once, and then stay unlocked forever (localStorage COLLECTION_STORAGE_KEY).
   A SEAL is "discovered" the first time it triggers in a run.
   The collection (Options > Collection or clicking Satan in the main menu, or Pause > Collection) shows every SEAL that can be
   bought: locked (dark, hover shows the achievement), unlocked but undiscovered (white),
   discovered (red).

   To lock another SEAL or change an achievement, edit SEAL_UNLOCKS below. Each entry is one of:
     stat:  lifetime counter across all runs           (COLLECTION_STAT_LABELS lists them)
     best:  best value reached at any one moment / run  (COLLECTION_BEST_LABELS lists them)
     flag:  something that happened at least once       (COLLECTION_FLAG_LABELS lists them)
     value: a function reading progress kept elsewhere (demons, Archangels, discoveries, Records)
   with `goal` for stat/best/value. A new kind of achievement needs its counter recorded below
   (search for collectionBump / collectionRaise / collectionFlag). The texts are the designer's own
   wording; descriptionHtml puts the keywords (SIN, SOUL, DAMNED...) in the game's style. Every locked
   SEAL can also come from one of Jesus' Gifts. */

const COLLECTION_STORAGE_KEY = "dearthCollectionV2";
const COLLECTION_OLD_STORAGE_KEYS = ["dearthCollectionV1"]; // discovered SEALS are carried over

const SEAL_UNLOCKS = {
  // Apocalypse Seals
  p74: { best: "eliteLevel", goal: 6, text: "Get a seal to Elite level 6" }, // White Horse
  p75: { flag: "beatUnder30", text: "Beat the game in under 30 rounds" }, // Red Horse
  p76: { flag: "fullHealthBossKill", text: "Eliminate a Boss that was at max SOUL" }, // Black Horse
  p77: { best: "critStreak", goal: 8, text: "Score 8 critical hits in a row" }, // Pale Horse
  p78: { best: "highestTarget", goal: 160, text: "Have the round target be 160 or above" }, // Souls of Martyrs
  p79: { best: "sinHeld", goal: 666, text: "Have 666 sin" }, // Creation Uncreated
  p80: { best: "pentakillStreak", goal: 3, text: "Score 3 Pentakills in a row" }, // Silence in Heaven
  // Boss Seals
  p121: { flag: "zilonBuyouts", text: "Buy out three entire shops while Zilon is active in one game" },
  p122: { flag: "sixEliteSeals", text: "Get six seals that are all level 1 elite or more" }, // Kalha
  p123: { stat: "pyrosBossKills", goal: 8, text: "Defeat 8 Bosses other than Pyros that have been granted a PYROS-TECH ability in total" },
  p124: { best: "noKoStreak", goal: 8, text: "Don't get a KO for 8 consecutive rounds" }, // Padma
  p125: { best: "bossesAtOnce", goal: 5, text: "Have 5 bosses active at the same time" }, // Petros-Pavlos
  p126: { flag: "serafimNoSteal", text: "Have Serafim steal 0 sin from you when he is first summoned" },
  p127: { flag: "threonArtifacts", text: "Use 4 artifacts in two consecutive rounds successfully while Threon is active" },
  p128: { flag: "dantrePentakill", text: "Score 1 Pentakill while Dantre is active" },
  // Seal of Satan
  p111: { flag: "beatNoSealBought", text: "Beat the game without buying a seal" },
  // the Archangel Seals
  p99: { flag: "oneHealth", text: "Have exactly 1 SOUL" }, // Michael
  p98: { stat: "gamesBeaten", goal: 8, text: "Beat the game 8 times (defeat the 8 bosses)" }, // Gabriel
  p109: { best: "critStreak", goal: 3, text: "Score 3 critical hits in a row" }, // Samael
  p101: { flag: "fullHealthKill", text: "Be at 100 SOUL and eliminate a Damned" }, // Raphael
  p100: { best: "roundGained", goal: 66, text: "Gain 66 sin in one round" }, // Sachiel
  p103: { flag: "beatNoPaidReroll", text: "Beat the game without using sin to reroll Devil's Offerings" }, // Anael
  p102: { stat: "gamesBeaten", goal: 24, text: "Beat the game 24 times (beat the 8 bosses)" }, // Cassiel
  // Trinity Seals
  p131: { value: () => collectionRealSlainCount(), goal: GOETIC_BOSS_TOTAL, text: "Unlock all Demons" }, // Father
  p132: { flag: "goldGift", text: "Buy a Gold Jesus gift" }, // Son
  p133: { value: () => collectionRealArchangelCount(), goal: ARCHANGEL_BOSS_SPECS.length, text: "Unlock all Archangels" }, // Holy Spirit
  // Seals of Saturn
  p97: { flag: "memoryKill66", text: "Eliminate a Damned with 66 memory" }, // 1st
  p93: { best: "bountyHeld", goal: 40, text: "Have a single Damned reach 40 bounty or more" }, // 2nd
  p92: { best: "runKarma", goal: 30, text: "Get 30 karma in one run" }, // 3rd
  p95: { best: "revealedAtOnce", goal: 4, text: "Have 4 revealed Damned at the same time" }, // 4th
  p110: { flag: "bountyMemory25", text: "Have a non-boss Damned with more than 25 bounty and more than 25 memory" }, // 5th
  p94: { best: "roundBuys", goal: 8, text: "Buy 8 items (seals or artifacts) in one round" }, // 6th
  p96: { best: "stubbornRoundKills", goal: 5, text: "Eliminate 5 Stubborn Damned in a single round" }, // 7th
  // Seals of Moon (the Pentacles of the Moon)
  p70: { stat: "eliminations", goal: 666, text: "Eliminate in total 666 Damned" }, // 1st
  p135: { stat: "goeticKills", goal: 66, text: "Eliminate in total 66 demons (end game bosses)" }, // 2nd
  p136: { value: () => collectionLifetimeDeals(), goal: 66, text: "Complete 66 Deals" }, // 3rd
  p137: { stat: "rerolls", goal: 666, text: "Reroll the Devil's Offerings 666 times" }, // 4th
  p138: { value: () => collectionLifetimeArtifactUses(), goal: 666, text: "Use a total of 666 artifacts" }, // 5th
  p139: { stat: "yannisKills", goal: 8, text: "Eliminate in total 8 Damned named Yannis" }, // 6th
  // Seals of Mars (the Pentacles of Mars)
  p140: { flag: "targetBelowZero", text: "Have the round target be below 0" }, // 1st
  p141: { value: () => collectionRealArchangelCount(), goal: 1, text: "Defeat an Archangel" }, // 2nd
  p142: { value: () => collectionDiscoveredCount(), goal: 66, text: "Discover 66 unique seals" }, // 3rd
  p143: { flag: "twoBossesNoSealBought", text: "Beat the first two bosses without buying a seal" }, // 4th
  p144: { best: "roundSpent", goal: 160, text: "Spend 160 sin in one round" }, // 5th
  p145: { flag: "beatAbove50", text: "Beat the game without falling below 50 SOUL" }, // 6th
  p146: { value: () => collectionDiscoveredCount(), goal: 100, text: "Discover 100 unique seals" } // 7th
};

const COLLECTION_STAT_LABELS = {
  eliminations: "DAMNED eliminated",
  yannisKills: "Yannis eliminated",
  goeticKills: "Goetic BOSSES eliminated",
  gamesBeaten: "games beaten",
  pyrosBossKills: "PYROS-TECH BOSSES defeated",
  rerolls: "Devil's Offerings rerolls"
};

const COLLECTION_BEST_LABELS = {
  roundSpent: "most SIN spent in a round",
  roundGained: "most SIN gained in a round (sales not counted)",
  sinHeld: "most SIN held",
  critStreak: "CRITICALS in a row",
  pentakillStreak: "PENTAKILLS in a row",
  noKoStreak: "rounds in a row without a KO",
  bossesAtOnce: "BOSSES active at once",
  eliteLevel: "highest ELITE level",
  highestTarget: "highest TARGET",
  bountyHeld: "most BOUNTY on one DAMNED",
  runKarma: "most KARMA in one run",
  revealedAtOnce: "DAMNED revealed at once",
  roundBuys: "most items bought in a round",
  stubbornRoundKills: "STUBBORN DAMNED eliminated in a round"
};

const COLLECTION_FLAG_LABELS = {
  oneHealth: "had exactly 1 SOUL",
  fullHealthBossKill: "one-shot a full-SOUL BOSS",
  fullHealthKill: "eliminated at 100 SOUL",
  dantrePentakill: "PENTAKILL with Dantre active",
  zilonBuyouts: "3 buyouts with Zilon active",
  serafimNoSteal: "Serafim stole nothing",
  threonArtifacts: "4 working ARTIFACTS over two rounds with Threon active",
  sixEliteSeals: "six ELITE SEALS",
  beatUnder30: "beat the game in under 30 rounds",
  beatNoSealBought: "beat the game without buying a SEAL",
  beatNoPaidReroll: "beat the game without paying for a reroll",
  beatAbove50: "beat the game without falling below 50 SOUL",
  twoBossesNoSealBought: "beat the first two BOSSES without buying a SEAL",
  goldGift: "opened a Gold gift",
  memoryKill66: "eliminated a DAMNED with 66 MEMORY",
  bountyMemory25: "a non-boss DAMNED with over 25 BOUNTY and 25 MEMORY",
  targetBelowZero: "a TARGET below 0"
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
  { key: "saturn", title: "Seals of Saturn", ids: ["p97", "p93", "p92", "p95", "p110", "p94", "p96"] },
  // the Pentacles of the Moon: each strengthens one ARTIFACT and doubles its weight in the Devil's Offerings
  { key: "artifact", title: "Seals of Moon", ids: ["p70", "p135", "p136", "p137", "p138", "p139"] },
  // the Pentacles of Mars: they give the DAMNED POISON, which deals damage at the end of every round
  { key: "poison", title: "Seals of Mars", ids: POISON_SEAL_IDS.slice() }
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
  { key: "poison", label: "Poison" },
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
  p46: ["reveal"], // Barbatos
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
  p134: ["general"], // Amy (a random Goetic SEAL each round)
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
  p109: ["personality"], // Samael
  // Artifact SEALS (Pentacles of the Moon)
  p70: ["artifact"], // 1st: Sacrificial Dagger
  p135: ["artifact", "bounty"], // 2nd: Funeral Coin spreads BOUNTY
  p136: ["artifact", "memory"], // 3rd: Inverted Cross pushes by MEMORY
  p137: ["artifact", "critical"], // 4th: Cursed Chalice adds CRITICAL damage
  p138: ["artifact", "reveal"], // 5th: Mummified Lamb hits revealed DAMNED
  p139: ["artifact", "personality"], // 6th: Vial of Blood makes STUBBORN
  // Poison SEALS (Pentacles of Mars)
  p140: ["poison"], // 1st: POISON by max SOUL
  p141: ["poison", "memory"], // 2nd: POISON by MEMORY
  p142: ["poison", "critical"], // 3rd: CRITICAL poisons everyone, POISON spreads on death
  p143: ["poison", "reveal"], // 4th: revealed DAMNED get POISON
  p144: ["poison", "bounty"], // 5th: BOUNTY gains give POISON
  p145: ["poison", "personality"], // 6th: STUBBORN DAMNED get POISON
  p146: ["poison"] // 7th: the most POISONED take damage and spread it
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
    // testing only (DEV button on Jesus' Gifts): KARMA never runs out while it is on
    devInfiniteKarma: false,
    // the Faustian Codex (09-codex.js): found or not, its pages, the answers heard, the margins
    codex: codexFresh(),
    // testing only (Pause > DEV > Whole Codex, or the Codex tab's DEV button): every page shows
    devWholeCodex: false,
    // KARMA, the currency kept between runs (see the KARMA section at the end of this file)
    karma: 0,
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
      progress.devInfiniteKarma = saved.devInfiniteKarma === true;
      progress.devWholeCodex = saved.devWholeCodex === true;
      progress.codex = normalizeCodex(saved.codex);
      if (Array.isArray(saved.archangels)) progress.archangels = saved.archangels.filter((key) => typeof key === "string" && ARCHANGEL_BY_KEY[key]);
      if (typeof saved.boundDemon === "string" && (GOETIC_BOSS_BY_KEY[saved.boundDemon] || ARCHANGEL_BY_KEY[saved.boundDemon])) progress.boundDemon = saved.boundDemon;
      if (saved.flags && typeof saved.flags === "object") progress.flags = { ...saved.flags };
      progress.karma = Math.max(0, Math.floor(Number(saved.karma) || 0));
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
      // the Seal of Pyros once took one PYROS-TECH BOSS (old flag); now it takes 8, and that one counts
      if (progress.flags.pyrosGiftBossKill && !progress.stats.pyrosBossKills) progress.stats.pyrosBossKills = 1;
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
  if (state.devUnlockAllSeals && !PLAYTEST_BUILD && state.mode !== "menu") return true;
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
  if (typeof rule.value === "function") return { value: Math.max(0, Math.floor(Number(rule.value(progress)) || 0)), goal: rule.goal };
  return null;
}

// value rules (SEAL_UNLOCKS): progress the Collection or the Records already keep. The DEV "unlock all"
// demons button and DEV infinite KARMA never count.
function collectionRealSlainCount() {
  return new Set(loadCollectionProgress().slain.filter((key) => GOETIC_BOSS_BY_KEY[key])).size;
}

function collectionRealArchangelCount() {
  return new Set(loadCollectionProgress().archangels.filter((key) => ARCHANGEL_BY_KEY[key])).size;
}

function collectionDiscoveredCount() {
  const ids = new Set(collectibleSealIds());
  return new Set(loadCollectionProgress().discovered.filter((id) => ids.has(id))).size;
}

// lifetime ARTIFACT uses and deals signed come from the Records (02-run-records.js), so they include past runs
function collectionLifetimeArtifactUses() {
  if (typeof loadLifetimeRecords !== "function") return 0;
  return Object.values(loadLifetimeRecords().artifactUses || {}).reduce((sum, count) => sum + Math.max(0, Number(count) || 0), 0);
}

function collectionLifetimeDeals() {
  return typeof loadLifetimeRecords === "function" ? Math.max(0, Math.floor(Number(loadLifetimeRecords().pacts) || 0)) : 0;
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
  const defaults = {
    uniqueKills: [], beaten: false, zilonBuyouts: 0, buyoutCounted: false, critStreak: 0, pentakillStreak: 0, noKoStreak: 0, roundSpent: 0, roundProcessed: 0, sealRound: null, beatenRound: 0, karma: 0, karmaRolled: 0,
    // false for a run saved before the counters below existed: the "without ..." achievements wait for a new run
    fromStart: true,
    sealsBought: 0, // SEALS taken from the Devil's Offerings (free ones and ELITE copies too)
    paidRerolls: 0, // rerolls that cost SIN
    fellBelow50: false,
    roundGained: 0, // SIN gained this round, sales left out
    roundBuys: 0, // SEALS and ARTIFACTS bought this round
    stubbornKills: 0, // STUBBORN DAMNED eliminated this round
    threonUses: {} // ARTIFACTS that worked while Threon was alive, by round (this round and the one before)
  };
  if (!state.collectionRun || typeof state.collectionRun !== "object") state.collectionRun = defaults;
  else {
    if (!("fromStart" in state.collectionRun)) state.collectionRun.fromStart = false;
    Object.keys(defaults).forEach((key) => { if (!(key in state.collectionRun)) state.collectionRun[key] = defaults[key]; });
  }
  return state.collectionRun;
}

// the main BOSSES beaten this run (Petros and Pavlos are one BOSS, beaten once both have fallen)
function collectionMainBossesBeaten(run = collectionRun()) {
  return UNIQUE_BOSS_KEYS.filter((key) => run.uniqueKills.includes(key) && (key !== "petros" || run.uniqueKills.includes("pavlos"))).length;
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
  const run = collectionRun();
  run.roundSpent = 0;
  run.roundGained = 0;
  run.roundBuys = 0;
  run.stubbornKills = 0;
  // BOSSES at full SOUL when the round starts: knocking one out this round counts as a one-shot
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

// SIN that came in, sales left out (gainCreditsFromSourceEntries): the Seal of Sachiel's 66 in one round
function collectionNoteSinEarned(amount) {
  if (!collectionCounts() || !(amount > 0)) return;
  const run = collectionRun();
  run.roundGained += Math.floor(amount);
  collectionRaise("roundGained", run.roundGained);
}

// the player's SOUL right after it changed (damagePlayer) and after every render
function collectionNotePlayerHp() {
  if (!collectionCounts()) return;
  const hp = state.player.hp;
  if (hp === 1) collectionFlag("oneHealth");
  if (hp < 50) collectionRun().fellBelow50 = true;
}

function collectionNoteElimination(bot) {
  if (bot?.isBoss && bot.goeticKey) collectionSlayDemon(bot.goeticKey);
  if (bot?.isBoss && bot.archangelKey) collectionDefeatArchangel(bot.archangelKey);
  if (!collectionCounts() || !bot) return;
  collectionBump("eliminations");
  if (/^Yannis\b/i.test(bot.name || "")) collectionBump("yannisKills");
  if (state.player.hp >= 100) collectionFlag("fullHealthKill");
  if ((bot.memory || []).length >= 66) collectionFlag("memoryKill66");
  if (personalityTypes(bot).includes("Stubborn")) {
    const run = collectionRun();
    run.stubbornKills += 1;
    collectionRaise("stubbornRoundKills", run.stubbornKills);
  }
  if (!bot.isBoss) return;
  if (bot.goeticKey) collectionBump("goeticKills");
  if (bot.fullHealthAtRoundStart) collectionFlag("fullHealthBossKill");
  if (bot.pyrosGifted && bot.uniqueKey !== "pyros") collectionBump("pyrosBossKills");
  if (bot.uniqueKey) {
    const run = collectionRun();
    if (!run.uniqueKills.includes(bot.uniqueKey)) run.uniqueKills.push(bot.uniqueKey);
    if (run.fromStart !== false && !run.sealsBought && collectionMainBossesBeaten(run) >= 2) collectionFlag("twoBossesNoSealBought");
    // beating the game = all 8 unique BOSSES defeated in one run (Petros and Pavlos both)
    const needed = [...UNIQUE_BOSS_KEYS, "pavlos"];
    if (!run.beaten && needed.every((key) => run.uniqueKills.includes(key))) {
      run.beaten = true;
      run.beatenRound = state.round;
      collectionBump("gamesBeaten");
      collectionNoteSealWins();
      if (state.round < 30) collectionFlag("beatUnder30");
      if (run.fromStart !== false) {
        if (!run.sealsBought) collectionFlag("beatNoSealBought");
        if (!run.paidRerolls) collectionFlag("beatNoPaidReroll");
        if (!run.fellBelow50 && state.player.hp >= 50) collectionFlag("beatAbove50");
      }
      karmaGain(KARMA_GAME_BEATEN, "Beating the game");
    }
  }
  collectionNoteKarmaDrop(bot);
}

function collectionNotePentakill() {
  if (!collectionCounts()) return;
  if (state.roundState) state.roundState.collectionPentakill = true;
  if (collectionBossPresent("dantre")) collectionFlag("dantrePentakill");
}

// an ARTIFACT was used (consumeActive); useActive marks the round when Threon made it malfunction
function collectionNoteArtifactUse(item = null) {
  const malfunctioned = Boolean(state.roundState?.artifactMalfunctioned);
  if (state.roundState) state.roundState.artifactMalfunctioned = false;
  if (!collectionCounts() || !state.roundState || item?.devTemporary) return;
  collectionDirty = true; // the lifetime count lives in the Records (collectionLifetimeArtifactUses)
  if (malfunctioned || !collectionBossPresent("threon", true)) return;
  // Seal of Threon: 4 ARTIFACTS that worked over this round and the one before, with Threon alive
  const run = collectionRun();
  const uses = run.threonUses && typeof run.threonUses === "object" ? run.threonUses : {};
  const now = (Number(uses[state.round]) || 0) + 1;
  const before = Number(uses[state.round - 1]) || 0;
  run.threonUses = { [state.round - 1]: before, [state.round]: now };
  if (now + before >= 4) collectionFlag("threonArtifacts");
}

// kind: "seal" (a new SEAL, an ELITE copy or the bound demon's free one) or "artifact"
function collectionNoteShopBuy(kind = "") {
  if (!collectionCounts()) return;
  const run = collectionRun();
  run.roundBuys += 1;
  collectionRaise("roundBuys", run.roundBuys);
  if (kind === "seal") run.sealsBought += 1;
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

// a reroll the player asked for (not the new round's): every one counts toward the 666; one that took SIN
// breaks "Beat the game without using sin to reroll" (Seal of Anael)
function collectionNotePlayerReroll(sinUsed = 0) {
  if (!collectionCounts()) return;
  collectionBump("rerolls");
  if (sinUsed > 0) collectionRun().paidRerolls += 1;
}

// a deal was signed (the lifetime count lives in the Records: collectionLifetimeDeals)
function collectionNoteDeal() {
  if (collectionCounts()) collectionDirty = true;
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
  collectionDirty = true; // "Discover 66 / 100 unique seals"
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
  return Boolean(GOETIC_BOSS_BY_KEY[key]) && ((progress.devAllDemons && !PLAYTEST_BUILD) || progress.slain.includes(key));
}

// DEV (testing): every demon counts as defeated, so any of them can be bound; off again shows the real progress
function toggleDevAllDemons() {
  const progress = loadCollectionProgress();
  progress.devAllDemons = !progress.devAllDemons;
  saveCollectionProgress();
}

function isArchangelDefeated(key) {
  const progress = loadCollectionProgress();
  return Boolean(ARCHANGEL_BY_KEY[key]) && ((progress.devAllDemons && !PLAYTEST_BUILD) || progress.archangels.includes(key));
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
  collectionDirty = true; // "Defeat an Archangel", "Unlock all Archangels"
  saveCollectionProgress();
}

function collectionSlayDemon(key) {
  if (state.mode !== "arcade" || !GOETIC_BOSS_BY_KEY[key]) return;
  const progress = loadCollectionProgress();
  if (progress.slain.includes(key)) return;
  progress.slain.push(key);
  collectionDirty = true; // "Unlock all Demons"
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
      <div class="collection-info-note">Not discovered yet: slay this BOSS in a run, or find it in one of Jesus' Gifts.</div>`;
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
  collectionTab = ["goetia", "angels"].includes(tab) || (tab === "codex" && codexOwned()) ? tab : "seals";
  if (collectionTab === "codex") codexOpenAtUnread();
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
  if (collectionTab === "codex") codexRefresh(screen);
}

const COLLECTION_SELECTED = ".collection-seal.selected, .collection-demon.selected";

// after every render of a run: moment checks, end-of-round streaks, then unlock what is earned
function collectionAfterRender() {
  if (!collectionCounts()) return;
  recordsNoteSlots();
  const run = collectionRun();
  collectionNotePlayerHp();
  collectionRaise("sinHeld", state.player.credits);
  if (typeof revealedDamnedCount === "function") collectionRaise("revealedAtOnce", revealedDamnedCount());
  const living = (state.bots || []).filter((bot) => bot && !bot.eliminated && !bot.immortal && bot.hp > 0);
  const bountyOf = (bot) => Math.max(0, Math.ceil(botRegularBounty(bot) || 0));
  collectionRaise("bountyHeld", Math.max(0, ...living.map(bountyOf)));
  if (living.some((bot) => !bot.isBoss && bountyOf(bot) > 25 && (bot.memory || []).length > 25)) collectionFlag("bountyMemory25");
  collectionRaise("bossesAtOnce", (state.bots || []).filter((bot) => bot?.isBoss && !bot.eliminated && bot.hp > 0).length);
  collectionRaise("eliteLevel", Math.max(0, ...(state.player.passives || []).map((item) => (item?.stack || 1) - 1)));
  collectionNoteSealElite();
  const eliteSeals = (state.player.passives || []).filter((item) => item && (item.stack || 1) >= 2).length;
  if (eliteSeals >= 6) collectionFlag("sixEliteSeals");
  const round = state.roundState;
  // the round's TARGET once it is final (READY pressed and the reveal over)
  if (round?.penaltiesApplied && !roundRevealAnimationActive() && Number.isFinite(round.target)) {
    collectionRaise("highestTarget", round.target);
    if (round.target < 0) collectionFlag("targetBelowZero");
  }
  // once per round, when it is resolved
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
  if (typeof document === "undefined" || typeof document.createElement !== "function") return; // headless (tests)
  const id = collectionToastQueue.shift();
  collectionToastBusy = true;
  const toast = document.createElement("div");
  toast.className = "collection-toast";
  toast.setAttribute("role", "status");
  // a KARMA drop ({ kind: "karma" }) or a SEAL whose achievement was met (its id)
  const item = id && typeof id === "object" ? id : null;
  toast.innerHTML = item?.kind === "codex"
    ? `
    <span class="collection-toast-codex" aria-hidden="true">${CODEX_MARK}</span>
    <span class="collection-toast-text">
      <span class="collection-toast-kicker">${item.first ? "Something was left in the ashes" : "A page of the Codex"}</span>
      <span class="collection-toast-name">${escapeHtml(item.first ? "The Faustian Codex" : item.title || "")}</span>
    </span>`
    : item?.kind === "karma"
    ? `
    <span class="collection-toast-karma" aria-hidden="true">+${escapeHtml(String(item.karma))}${KARMA_MARK}</span>
    <span class="collection-toast-text">
      <span class="collection-toast-kicker">Karma</span>
      <span class="collection-toast-name">${escapeHtml(item.source || "")}</span>
    </span>`
    : `
    <img class="collection-toast-sigil" src="${escapeAttr(sealSigilPath(id))}" alt="" />
    <span class="collection-toast-text">
      <span class="collection-toast-kicker">Seal unlocked</span>
      <span class="collection-toast-name">${escapeHtml(ITEMS[id]?.name || "Seal")}</span>
    </span>`;
  document.body.appendChild(toast);
  playGameSfx(item?.kind === "codex" ? (item.first ? "karmaUnlock" : "codexNewPage") : item?.kind === "karma" ? "karmaGain" : "sealUnlock");
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

function collectionInfoHtml(id, pinned = false) {
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
      ${progressText}
      ${rule.gift ? "" : `<div class="collection-info-note">Or find it in one of Jesus' Gifts.</div>`}`;
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
  if (collectionTab === "codex" && !codexOwned()) collectionTab = "seals";
  const goetia = collectionTab === "goetia";
  const angels = collectionTab === "angels";
  const codex = collectionTab === "codex";
  if (codex) codexOpenAtUnread();
  const angelsDefeated = ARCHANGEL_KEYS.filter((key) => isArchangelDefeated(key)).length;
  // no DEV button in the playtest build
  const devButton = () =>
    PLAYTEST_BUILD ? "" : `<button type="button" class="collection-dev-button${loadCollectionProgress().devAllDemons ? " active" : ""}" data-collection-dev-demons data-tooltip="Testing: every demon and Archangel counts as defeated, so any of them can be bound">${loadCollectionProgress().devAllDemons ? "DEV: all unlocked" : "DEV: unlock all"}</button>`;
  const tabs = [
    { key: "seals", label: "Seals" },
    { key: "goetia", label: "Ars Goetia" },
    { key: "angels", label: "Archangels" },
    // the Faustian Codex: no tab at all until the book is found (09-codex.js)
    ...(codexOwned() ? [{ key: "codex", label: "Codex" }] : [])
  ].map((tab) => {
    const active = tab.key === collectionTab;
    const unread = tab.key === "codex" && codexHasUnread() ? " has-new" : "";
    return `<button class="collection-tab${active ? " active" : ""}${unread}" type="button" role="tab" data-collection-tab="${tab.key}" aria-selected="${active}">${escapeHtml(tab.label)}</button>`;
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
        <div class="collection-counts" data-collection-for="seals"${goetia || angels || codex ? " hidden" : ""}>
          <span><strong>${discovered}</strong> / ${all.length} discovered</span>
          <span><strong data-collection-count="unlocked">${unlocked}</strong> / ${all.length} unlocked</span>
        </div>
        <div class="collection-counts" data-collection-for="goetia"${goetia ? "" : " hidden"}>
          <span><strong data-collection-count="slain">${slain}</strong> / ${GOETIC_BOSS_TOTAL} defeated</span>
          <span class="collection-bound-line">${collectionBoundLine()}</span>
        </div>
        <div class="collection-counts" data-collection-for="angels"${angels ? "" : " hidden"}>
          <span><strong>${angelsDefeated}</strong> / ${ARCHANGEL_KEYS.length} defeated</span>
          <span class="collection-bound-line">${collectionBoundLine()}</span>
        </div>
        ${codexOwned() ? `<div class="collection-counts" data-collection-for="codex"${codex ? "" : " hidden"}>${codexCountsHtml()}</div>` : ""}
      </header>
      <div class="collection-panel" data-collection-panel="seals"${goetia || angels || codex ? " hidden" : ""}>
        ${collectionFiltersHtml(all)}
        <div class="collection-legend">
          ${collectionSearchHtml("seals")}
          ${collectionKarmaLine()}
          <span class="legend discovered" aria-hidden="true">discovered</span>
          <span class="legend undiscovered" aria-hidden="true">undiscovered</span>
          <span class="legend locked" aria-hidden="true">locked</span>
        </div>
        <div class="collection-body">${sections}${collectionEmptyHtml("seals")}</div>
      </div>
      <div class="collection-panel" data-collection-panel="goetia"${goetia ? "" : " hidden"}>
        <div class="collection-legend">
          ${collectionSearchHtml("goetia")}
          ${collectionKarmaLine()}
          <span class="legend slain" aria-hidden="true">defeated</span>
          <span class="legend unslain" aria-hidden="true">not defeated</span>
          ${devButton()}
        </div>
        <div class="collection-body">${collectionDemonsHtml()}</div>
      </div>
      <div class="collection-panel" data-collection-panel="angels"${angels ? "" : " hidden"}>
        <div class="collection-legend">
          ${collectionSearchHtml("angels")}
          ${collectionKarmaLine()}
          <span class="legend slain" aria-hidden="true">defeated</span>
          <span class="legend unslain" aria-hidden="true">not defeated</span>
          ${devButton()}
        </div>
        <div class="collection-body">${collectionArchangelsHtml()}</div>
      </div>
      ${
        codexOwned()
          ? `<div class="collection-panel codex-panel" data-collection-panel="codex"${codex ? "" : " hidden"}>
        ${codexLegendHtml()}
        <div class="collection-body codex-body">${codexBookHtml()}</div>
      </div>`
          : ""
      }
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
  info.innerHTML = demon ? collectionDemonInfoHtml(demon, pinned) : collectionInfoHtml(id, pinned);
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
  bindCodexEvents(screen);
  if (collectionTab === "codex") codexMarkRead();
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

/* ---------- KARMA: the currency kept between runs ----------
   Earned in real arcade runs (collectionCounts), kept in the collection progress (progress.karma):
     beating the game (the 8 main BOSSES)            +KARMA_GAME_BEATEN
     the nth main BOSS beaten in a run (n = 1..8)    1 KARMA at n x KARMA_MAIN_BOSS_STEP (Petros and Pavlos
                                                     are one BOSS: it rolls when both are down)
     a Goetic demon (or YOU in its place)            1 KARMA at KARMA_GOETIC_CHANCE
     an Archangel (or YOU in its place)              KARMA_ARCHANGEL_AMOUNT at KARMA_ARCHANGEL_CHANCE
     Honorable Death: dying after defeating          +KARMA_HONORABLE_DEATH
     KARMA_HONORABLE_DEATH_BOSSES or more BOSSES
   Spent on Jesus' Gifts (09-gifts.js). */
const KARMA_GAME_BEATEN = 8;
const KARMA_MAIN_BOSS_STEP = 0.1;
const KARMA_GOETIC_CHANCE = 0.9;
const KARMA_ARCHANGEL_CHANCE = 1;
const KARMA_ARCHANGEL_AMOUNT = 3;
const KARMA_HONORABLE_DEATH = 1;
const KARMA_HONORABLE_DEATH_BOSSES = 4; // any BOSSES: main ones (the twins are one), demons, Archangels

// KARMA's mark (the Spiral of Return, --karma-spiral in styles.css), drawn after a number like the SIN coin
const KARMA_MARK = `<span class="karma-mark" role="img" aria-label="KARMA"></span>`;

function karmaBalance() {
  return Math.max(0, Math.floor(Number(loadCollectionProgress().karma) || 0));
}

// DEV (testing): infinite KARMA; gifts cost nothing and the real balance is kept for when it is off
function karmaInfinite() {
  // the playtest build (demo.html) has no DEV button, so a flag left on in index.html counts as off
  return !PLAYTEST_BUILD && loadCollectionProgress().devInfiniteKarma === true;
}

function karmaCanPay(price) {
  return karmaInfinite() || karmaBalance() >= price;
}

function toggleDevInfiniteKarma() {
  if (PLAYTEST_BUILD) return;
  const progress = loadCollectionProgress();
  progress.devInfiniteKarma = !progress.devInfiniteKarma;
  saveCollectionProgress();
}

function karmaGain(amount, source) {
  const gained = Math.max(0, Math.floor(Number(amount) || 0));
  if (!gained || !collectionCounts()) return 0;
  const progress = loadCollectionProgress();
  progress.karma = karmaBalance() + gained;
  const run = collectionRun();
  run.karma = (run.karma || 0) + gained;
  collectionRaise("runKarma", run.karma);
  saveCollectionProgress();
  addLog(`${source}: +${gained} KARMA.`);
  collectionToastQueue.push({ kind: "karma", karma: gained, source });
  showNextCollectionToast();
  return gained;
}

function karmaRoll(chance, source, amount = 1) {
  if (!collectionCounts() || !(chance > 0)) return 0;
  return Math.random() < chance ? karmaGain(amount, source) : 0;
}

// a BOSS fell (from collectionNoteElimination, real runs only)
function collectionNoteKarmaDrop(bot) {
  if (!bot?.isBoss) return;
  if (bot.uniqueKey) {
    const run = collectionRun();
    const beaten = uniqueBossesBeatenThisRun();
    if (beaten <= (run.karmaRolled || 0)) return;
    run.karmaRolled = beaten;
    karmaRoll(beaten * KARMA_MAIN_BOSS_STEP, bot.uniqueKey === "pavlos" || bot.uniqueKey === "petros" ? "Petros and Pavlos" : bot.name || "BOSS");
    return;
  }
  const angel = bot.archangelKey || (bot.shadowOf && ARCHANGEL_BY_KEY[bot.shadowOf]);
  if (angel) karmaRoll(KARMA_ARCHANGEL_CHANCE, bot.name || "Archangel", KARMA_ARCHANGEL_AMOUNT);
  else if (bot.goeticKey || bot.shadowOf) karmaRoll(KARMA_GOETIC_CHANCE, bot.name || "Demon");
}

// Honorable Death: the run ends in death after defeating KARMA_HONORABLE_DEATH_BOSSES or more BOSSES (from finishGameOverRound)
function collectionNoteHonorableDeath() {
  if (!collectionCounts()) return 0;
  const run = collectionRun();
  if (run.honorableDeath || (Number(state.bossKills) || 0) < KARMA_HONORABLE_DEATH_BOSSES) return 0;
  run.honorableDeath = true;
  return karmaGain(KARMA_HONORABLE_DEATH, "Honorable Death");
}

function collectionKarmaLine() {
  // the big counter at the right end of the search row, on every tab
  return `<div class="collection-karma-line" data-tooltip="KARMA: earned by beating BOSSES and the game, and by an Honorable Death (dying after 4 BOSSES); spent on Jesus' Gifts"><span class="collection-karma-word">Karma</span><strong>${karmaInfinite() ? "∞" : formatNumber(karmaBalance())}</strong>${KARMA_MARK}</div>`;
}
