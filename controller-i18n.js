/* ---------- Translation (i18n) ----------
   Plan and decisions: Project doc claude/localization-plan.md.
   English is the game's internal language: ITEMS names, BOSS names and the log sentences that the code reads
   (damage sources, SEAL discovery, the READY animations) stay English for good. Text is translated only where
   it is shown, with t():
   - t("settings.reset"): a key of locales/en.js (short labels whose English word could mean two things);
   - t("Resume"), t("Gain {sin} SIN.", { sin }): the English text itself. The text tables (Satan, Jesus, Codex,
     missions...) and ITEMS stay where the designers write them, and are translated by their English text.
   - t(englishBuiltByTheCode): text the code already built in English, numbers and names inside (SEAL texts,
     the log, tooltips). A language file can hold it as a pattern, "Gain {sin} SIN whenever this happens.":
     t() finds the pattern that fits, translates the names it captured (item names, the ELITE prefix) and
     keeps the numbers. Longer text is translated line by line and sentence by sentence, so one sentence
     without a translation shows in English and the rest is still translated.
     descriptionHtml() (every SEAL / ARTIFACT text, tooltip and log line on screen) does this by itself.
   Change the English and the old translation no longer matches: that text shows in English until it is
   translated again (node scripts/i18n-report.js <code> lists what a language still lacks).
   Locale files: src/game/locales/<code>.js, each one fills LOCALES[<code>] = { "key or English text": "translation" }.
   A value can also be a plural set, { one: "{count} SEAL", other: "{count} SEALS" }, picked by params.count
   (Intl.PluralRules: Chinese has only "other", Greek / German / Spanish / English have "one" and "other").
   A key ending in "Html" holds HTML (keep its tags); every other value is plain text and is escaped where shown.
   DEV: the "pseudo" language (Pause > DEV > Language) turns English into accented text 35% longer, so text that
   doesn't go through t() stays plain English and text that doesn't fit is easy to spot. */

const LOCALES = {};
// extra forms of the game's keywords a language uses (cases, plurals), so they get the keyword style too:
// LOCALE_KEYWORDS.el = ["ΑΜΑΡΤΙΕΣ", ...] in locales/el.js (the plain translations of SIN, SOUL... are found already)
const LOCALE_KEYWORDS = {};
// ready: offered in Settings > Display > Language. Not ready: only in Pause > DEV (testing a translation in progress).
const LANGUAGES = [
  { code: "en", name: "English", htmlLang: "en", ready: true },
  { code: "el", name: "Ελληνικά", htmlLang: "el", ready: false },
  { code: "de", name: "Deutsch", htmlLang: "de", ready: false },
  { code: "es", name: "Español", htmlLang: "es", ready: false },
  { code: "zh-Hans", name: "简体中文", htmlLang: "zh-Hans", ready: false }
];
const PSEUDO_LANGUAGE = { code: "pseudo", name: "Pseudo (testing)", htmlLang: "en", ready: false };
const LANGUAGE_STORAGE_KEY = "dearthLanguageV1";
let currentLanguageCode = "en";
const pluralRulesCache = {};

function languageInfo(code) {
  return LANGUAGES.find((entry) => entry.code === code) || (code === PSEUDO_LANGUAGE.code ? PSEUDO_LANGUAGE : null);
}

function currentLang() {
  return currentLanguageCode;
}

// the languages a player can pick in Settings: the ready ones, plus the current one if a test put it there
function settingsLanguageCodes() {
  const codes = LANGUAGES.filter((entry) => entry.ready).map((entry) => entry.code);
  if (!codes.includes(currentLanguageCode)) codes.push(currentLanguageCode);
  return codes;
}

function testingLanguageCodes() {
  return [...LANGUAGES.map((entry) => entry.code), PSEUDO_LANGUAGE.code];
}

// first launch: the system's language, if the game is ready in it (Traditional Chinese readers get Simplified)
function languageFromSystem() {
  const wanted = typeof navigator !== "undefined" ? [...(navigator.languages || []), navigator.language] : [];
  for (const tag of wanted) {
    const lower = String(tag || "").toLowerCase();
    const code = lower.startsWith("zh") ? "zh-Hans" : lower.split("-")[0];
    const info = languageInfo(code);
    if (info && info.ready) return code;
  }
  return "en";
}

function loadLanguageSetting() {
  let saved = null;
  try {
    saved = window.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {}
  currentLanguageCode = saved && languageInfo(saved) ? saved : languageFromSystem();
  applyLanguage();
}

function setLanguage(code) {
  if (!languageInfo(code)) return;
  currentLanguageCode = code;
  try {
    window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch (error) {}
  applyLanguage();
}

// <html lang>: CSS text-transform: uppercase drops the Greek accents only when the page says it is Greek
function applyLanguage() {
  if (typeof document === "undefined" || !document.documentElement) return;
  document.documentElement.lang = languageInfo(currentLanguageCode)?.htmlLang || "en";
}

function translationEntry(key) {
  const own = currentLanguageCode !== "en" ? LOCALES[currentLanguageCode]?.[key] : undefined;
  if (own !== undefined && own !== "") return own;
  return LOCALES.en?.[key];
}

function pluralCategory(count) {
  const lang = currentLanguageCode === PSEUDO_LANGUAGE.code ? "en" : currentLanguageCode;
  try {
    pluralRulesCache[lang] = pluralRulesCache[lang] || new Intl.PluralRules(lang);
    return pluralRulesCache[lang].select(Number(count) || 0);
  } catch (error) {
    return Number(count) === 1 ? "one" : "other";
  }
}

function fillTranslation(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match));
}

const PSEUDO_LETTERS = {
  a: "à", b: "ƀ", c: "ç", d: "ð", e: "é", f: "ƒ", g: "ĝ", h: "ĥ", i: "î", j: "ĵ", k: "ķ", l: "ł", m: "ɱ", n: "ñ", o: "ô", p: "þ", q: "ǫ", r: "ŕ", s: "ŝ", t: "ţ", u: "û", v: "ṽ", w: "ŵ", x: "ẋ", y: "ý", z: "ž",
  A: "À", B: "Ɓ", C: "Ç", D: "Ð", E: "É", F: "Ƒ", G: "Ĝ", H: "Ĥ", I: "Î", J: "Ĵ", K: "Ķ", L: "Ł", M: "Ṁ", N: "Ñ", O: "Ô", P: "Þ", Q: "Ǫ", R: "Ŕ", S: "Ŝ", T: "Ţ", U: "Û", V: "Ṽ", W: "Ŵ", X: "Ẋ", Y: "Ý", Z: "Ž"
};

// accented and 35% longer; {params}, HTML tags and entities are left alone
function pseudoTranslation(text) {
  if (!/[A-Za-z]/.test(String(text))) return String(text);
  let letters = 0;
  const body = String(text).replace(/(\{\w+\}|<[^>]*>|&[#\w]+;)|([A-Za-z])/g, (match, keep, letter) => {
    if (keep) return keep;
    letters += 1;
    return PSEUDO_LETTERS[letter] || letter;
  });
  return `[${body}${"~".repeat(Math.ceil(letters * 0.35))}]`;
}

/* The text in the player's language (English if that language has no text for it yet).
   key: a key of locales/en.js, or the English text itself (with {placeholders} when params are given,
   or as the code built it, numbers and names inside). params fill {name} placeholders; params.count
   also picks the plural form. */
function t(key, params) {
  if (currentLanguageCode === "en" && !params && LOCALES.en?.[key] === undefined) return key;
  let entry = translationEntry(key);
  if (entry === undefined) {
    // English the code built: a pattern of this language, or line by line, sentence by sentence
    if (!params && typeof key === "string" && currentLanguageCode !== "en") return translateBuiltText(key);
    entry = key;
  }
  if (entry && typeof entry === "object") {
    const count = params && params.count !== undefined ? params.count : 0;
    entry = entry[pluralCategory(count)] ?? entry.other ?? Object.values(entry)[0] ?? "";
  }
  const text = currentLanguageCode === PSEUDO_LANGUAGE.code ? pseudoTranslation(String(entry)) : String(entry);
  return fillTranslation(text, params);
}

// ---- English built by the code (numbers and names inside) ----
const translationPatternCache = {};
const builtTextCache = {};
const BUILT_TEXT_CACHE_LIMIT = 4000;

// a language's patterns: its entries with {placeholders}, longest fixed text first (the most specific wins)
function translationPatterns(code) {
  if (translationPatternCache[code]) return translationPatternCache[code];
  const patterns = Object.keys(LOCALES[code] || {})
    .filter((key) => /\{\w+\}/.test(key) && typeof LOCALES[code][key] === "string")
    .map((key) => {
      const names = [];
      const source = key
        .split(/(\{\w+\})/)
        .map((part) => {
          const name = part.match(/^\{(\w+)\}$/);
          if (!name) return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          names.push(name[1]);
          return "(.+?)";
        })
        .join("");
      return { key, names, regex: new RegExp(`^${source}$`), fixed: key.replace(/\{\w+\}/g, "").length };
    })
    .sort((a, b) => b.fixed - a.fixed);
  translationPatternCache[code] = patterns;
  return patterns;
}

// one piece of text: an exact entry, or a pattern whose captured names are translated in turn (numbers stay)
function translateBuiltPiece(text, depth) {
  const code = currentLanguageCode;
  const own = LOCALES[code]?.[text];
  if (typeof own === "string" && own !== "") return own;
  if (code === PSEUDO_LANGUAGE.code) return pseudoTranslation(text);
  for (const pattern of translationPatterns(code)) {
    const match = text.match(pattern.regex);
    if (!match) continue;
    const params = {};
    pattern.names.forEach((name, index) => {
      const value = match[index + 1];
      params[name] = depth < 2 && /[A-Za-z]/.test(value) ? translateBuiltPiece(value, depth + 1) ?? value : value;
    });
    return fillTranslation(LOCALES[code][pattern.key], params);
  }
  return null;
}

function translateBuiltText(text) {
  const code = currentLanguageCode;
  const cache = (builtTextCache[code] = builtTextCache[code] || new Map());
  if (cache.has(text)) return cache.get(text);
  let result = translateBuiltPiece(text, 0);
  if (result === null) {
    // line by line, then sentence by sentence; what has no translation stays English
    const joiner = code === "zh-Hans" ? "" : " ";
    result = String(text)
      .split("\n")
      .map((line) => {
        const whole = translateBuiltPiece(line, 0);
        if (whole !== null) return whole;
        return line
          .split(/(?<=[.!?])\s+/)
          .map((sentence) => translateBuiltPiece(sentence, 0) ?? sentence)
          .join(joiner);
      })
      .join("\n");
  }
  if (cache.size > BUILT_TEXT_CACHE_LIMIT) cache.clear();
  cache.set(text, result);
  return result;
}

// a language file changed (DEV, tests): forget the compiled patterns and the cached text
function resetTranslationCaches() {
  Object.keys(translationPatternCache).forEach((key) => delete translationPatternCache[key]);
  Object.keys(builtTextCache).forEach((key) => delete builtTextCache[key]);
  if (typeof translatedKeywordPatterns !== "undefined") Object.keys(translatedKeywordPatterns).forEach((key) => delete translatedKeywordPatterns[key]);
}

// a language's name in that language (the Language setting shows each one as its speakers write it)
function languageName(code) {
  return languageInfo(code)?.name || code;
}
/* English: the source text every other language is translated from (see 00-i18n.js).
   Keys are grouped by screen. Write {name} for a value the code fills in, and keep the same {names} in every language. */
LOCALES.en = {
  // ---- Settings (main menu Options > Settings, Pause > Settings) ----
  "settings.tab.audio": "Audio",
  "settings.tab.display": "Display",
  "settings.tab.gameplay": "Gameplay",
  "settings.master": "Master",
  "settings.music": "Music",
  "settings.effects": "Effects",
  "settings.muteAll": "Mute all",
  "settings.muteInBackground": "Mute in background",
  "settings.language": "Language",
  "settings.window": "Window",
  "settings.window.0": "Windowed",
  "settings.window.1": "Fullscreen",
  "settings.outlineBoil": "Outline animation",
  "settings.outlineBoil.0": "Off",
  "settings.outlineBoil.1": "Slow",
  "settings.outlineBoil.2": "Normal",
  "settings.outlineBoil.3": "Fast",
  "settings.screenShake": "Screen shake",
  "settings.screenShake.0": "Off",
  "settings.screenShake.1": "Low",
  "settings.screenShake.2": "Full",
  "settings.flashes": "Flashes",
  "settings.flashes.0": "Reduced",
  "settings.flashes.1": "Full",
  "settings.textSize": "Text size",
  "settings.textSize.0": "Normal",
  "settings.textSize.1": "Large",
  "settings.guideText": "Guide text",
  "settings.guideText.0": "Hidden",
  "settings.guideText.1": "Shown",
  "settings.slotMachine": "Slot machine",
  "settings.slotMachine.0": "Default",
  "settings.slotMachine.1": "Fancy",
  "settings.animSpeed": "Animation speed",
  "settings.animSpeed.value": "x{value}",
  "settings.animSpeedNote": "Speeds up SEAL triggers and the READY reveal.",
  "settings.controlsHtml": "<b>Enter</b> Guess, Ready, Next round &nbsp;·&nbsp; <b>Esc</b> Pause &nbsp;·&nbsp; <b>Shift</b> more on a tooltip",
  "settings.previous": "Previous {setting}",
  "settings.next": "Next {setting}",
  "settings.replayStory": "Replay the story",
  "settings.reset": "Reset to defaults"
};
/* Greek (Ελληνικά). Same keys as locales/en.js; a key left out shows the English text.
   Turn the language on for players with ready: true in LANGUAGES (00-i18n.js) once it is complete and checked. */
LOCALES["el"] = {
  // the game's terms: see locales/GLOSSARY.md before changing one
  "SIN": "ΑΜΑΡΤΙΑ",
  "SOUL": "ΨΥΧΗ",
  "DAMNED": "ΚΑΤΑΔΙΚΑΣΜΕΝΟΙ",
  "SEAL": "ΣΦΡΑΓΙΔΑ",
  "SEALS": "ΣΦΡΑΓΙΔΕΣ",
  "ARTIFACT": "ΚΕΙΜΗΛΙΟ",
  "ARTIFACTS": "ΚΕΙΜΗΛΙΑ",
  "BOSS": "BOSS",
  "BOSSES": "BOSS",
  "ELITE": "ΕΛΙΤ",
  "CRITICAL": "CRITICAL",
  "TARGET": "ΣΤΟΧΟΣ",
  "MEMORY": "ΜΝΗΜΗ",
  "BOUNTY": "ΦΟΡΤΙΟ",
  "POISON": "ΔΗΛΗΤΗΡΙΟ",
  "KARMA": "ΚΑΡΜΑ",
  "FAVOR": "ΕΥΝΟΙΑ",
  "KO": "KO",
  "KOS": "KO",
  "MASSACRE": "ΜΑΚΕΛΕΙΟ",
  "Massacre": "Μακελειό",
  "Massacres": "Μακελειά",
  "Devil's Offerings": "Προσφορές του Διαβόλου",
  "Satan's bet": "Το στοίχημα του Σατανά",
  "Jesus' Gifts": "Τα Δώρα του Ιησού",
  "DEAL": "ΣΥΜΦΩΝΙΑ",
  "Satan's Pact": "Η Συμφωνία του Σατανά",
  "Modifier": "Συντελεστής",
  "Reroll": "Reroll",
  "Anchor": "Αγκυρωμένος",
  "Analyst": "Αναλυτής",
  "Follower": "Ακόλουθος",
  "Stubborn": "Πεισματάρης",
  "Drifter": "Τυχοδιώκτης",
  "Caller": "Παρατηρητής",
  "STUBBORN": "ΠΕΙΣΜΑΤΑΡΗΣ",
  "STUBBORN BOSS": "ΠΕΙΣΜΑΤΑΡΗΣ BOSS"
};
// other forms of the terms, styled as keywords in texts (descriptionHtml)
LOCALE_KEYWORDS["el"] = ["ΑΜΑΡΤΙΑΣ", "ΑΜΑΡΤΙΕΣ", "ΑΜΑΡΤΙΩΝ", "ΨΥΧΗΣ", "ΨΥΧΕΣ", "ΨΥΧΩΝ", "ΚΑΤΑΔΙΚΑΣΜΕΝΟΣ", "ΚΑΤΑΔΙΚΑΣΜΕΝΟΥ", "ΚΑΤΑΔΙΚΑΣΜΕΝΟ", "ΚΑΤΑΔΙΚΑΣΜΕΝΩΝ", "ΚΑΤΑΔΙΚΑΣΜΕΝΟΥΣ", "ΚΑΤΑΔΙΚΑΣΜΕΝΗ", "ΚΑΤΑΔΙΚΑΣΜΕΝΗΣ", "ΣΦΡΑΓΙΔΑΣ", "ΣΦΡΑΓΙΔΩΝ", "ΚΕΙΜΗΛΙΟΥ", "ΚΕΙΜΗΛΙΩΝ", "ΣΤΟΧΟΥ", "ΣΤΟΧΟ", "ΜΝΗΜΗΣ", "ΜΝΗΜΕΣ", "ΦΟΡΤΙΟΥ", "ΦΟΡΤΙΑ", "ΦΟΡΤΙΩΝ", "ΔΗΛΗΤΗΡΙΟΥ", "ΔΗΛΗΤΗΡΙΑ", "ΕΥΝΟΙΑΣ", "ΜΑΚΕΛΕΙΟΥ", "ΜΑΚΕΛΕΙΑ"];
/* German (Deutsch). Same keys as locales/en.js; a key left out shows the English text.
   Turn the language on for players with ready: true in LANGUAGES (00-i18n.js) once it is complete and checked. */
LOCALES["de"] = {
  // the game's terms: see locales/GLOSSARY.md before changing one
  "SIN": "SÜNDE",
  "SOUL": "SEELE",
  "DAMNED": "VERURTEILTE",
  "SEAL": "SIEGEL",
  "SEALS": "SIEGEL",
  "ARTIFACT": "ARTEFAKT",
  "ARTIFACTS": "ARTEFAKTE",
  "BOSS": "BOSS",
  "BOSSES": "BOSSE",
  "ELITE": "ELITE",
  "CRITICAL": "CRITICAL",
  "TARGET": "ZIEL",
  "MEMORY": "GEDÄCHTNIS",
  "BOUNTY": "LADUNG",
  "POISON": "GIFT",
  "KARMA": "KARMA",
  "FAVOR": "GUNST",
  "KO": "KO",
  "KOS": "KOS",
  "MASSACRE": "MASSAKER",
  "Massacre": "Massaker",
  "Massacres": "Massaker",
  "Devil's Offerings": "Teufelsgaben",
  "Satan's bet": "Satans Wette",
  "Jesus' Gifts": "Jesu Gaben",
  "DEAL": "PAKT",
  "Satan's Pact": "Satans Pakt",
  "Modifier": "Modifikator",
  "Reroll": "Reroll",
  "Anchor": "Verankert",
  "Analyst": "Analytiker",
  "Follower": "Mitläufer",
  "Stubborn": "Stur",
  "Drifter": "Glücksritter",
  "Caller": "Beobachter",
  "STUBBORN": "STUR",
  "STUBBORN BOSS": "STURER BOSS"
};
// other forms of the terms, styled as keywords in texts (descriptionHtml)
LOCALE_KEYWORDS["de"] = ["SÜNDEN", "SEELEN", "VERURTEILTEN", "VERURTEILTER", "VERURTEILTEM", "SIEGELS", "ARTEFAKTEN", "ARTEFAKTS", "BOSSEN", "BOSSES", "ZIELS", "ZIELE", "LADUNGEN", "GIFTS", "STURE", "STUREN", "STURER"];
/* Spanish (Español). Same keys as locales/en.js; a key left out shows the English text.
   Turn the language on for players with ready: true in LANGUAGES (00-i18n.js) once it is complete and checked. */
LOCALES["es"] = {
  // the game's terms: see locales/GLOSSARY.md before changing one
  "SIN": "PECADO",
  "SOUL": "ALMA",
  "DAMNED": "CONDENADOS",
  "SEAL": "SELLO",
  "SEALS": "SELLOS",
  "ARTIFACT": "ARTEFACTO",
  "ARTIFACTS": "ARTEFACTOS",
  "BOSS": "BOSS",
  "BOSSES": "BOSSES",
  "ELITE": "ÉLITE",
  "CRITICAL": "CRITICAL",
  "TARGET": "OBJETIVO",
  "MEMORY": "MEMORIA",
  "BOUNTY": "CARGA",
  "POISON": "VENENO",
  "KARMA": "KARMA",
  "FAVOR": "FAVOR",
  "KO": "KO",
  "KOS": "KOS",
  "MASSACRE": "MASACRE",
  "Massacre": "Masacre",
  "Massacres": "Masacres",
  "Devil's Offerings": "Ofrendas del Diablo",
  "Satan's bet": "La apuesta de Satanás",
  "Jesus' Gifts": "Dones de Jesús",
  "DEAL": "PACTO",
  "Satan's Pact": "El Pacto de Satanás",
  "Modifier": "Modificador",
  "Reroll": "Reroll",
  "Anchor": "Anclado",
  "Analyst": "Analista",
  "Follower": "Seguidor",
  "Stubborn": "Terco",
  "Drifter": "Aventurero",
  "Caller": "Observador",
  "STUBBORN": "TERCO",
  "STUBBORN BOSS": "BOSS TERCO"
};
// other forms of the terms, styled as keywords in texts (descriptionHtml)
LOCALE_KEYWORDS["es"] = ["PECADOS", "ALMAS", "CONDENADO", "CONDENADA", "CONDENADAS", "OBJETIVOS", "MEMORIAS", "CARGAS", "VENENOS", "MASACRES", "TERCOS", "TERCA"];
/* Simplified Chinese (简体中文). Same keys as locales/en.js; a key left out shows the English text.
   Turn the language on for players with ready: true in LANGUAGES (00-i18n.js) once it is complete and checked. */
LOCALES["zh-Hans"] = {
  // the game's terms: see locales/GLOSSARY.md before changing one
  "SIN": "罪孽",
  "SOUL": "灵魂",
  "DAMNED": "罪人",
  "SEAL": "印记",
  "SEALS": "印记",
  "ARTIFACT": "法器",
  "ARTIFACTS": "法器",
  "BOSS": "BOSS",
  "BOSSES": "BOSS",
  "ELITE": "精英",
  "CRITICAL": "CRITICAL",
  "TARGET": "目标",
  "MEMORY": "记忆",
  "BOUNTY": "负担",
  "POISON": "毒素",
  "KARMA": "业力",
  "FAVOR": "青睐",
  "KO": "KO",
  "KOS": "KO",
  "MASSACRE": "屠杀",
  "Massacre": "屠杀",
  "Massacres": "屠杀",
  "Devil's Offerings": "恶魔献礼",
  "Satan's bet": "撒旦的赌约",
  "Jesus' Gifts": "耶稣的恩赐",
  "DEAL": "契约",
  "Satan's Pact": "撒旦的契约",
  "Modifier": "修正值",
  "Reroll": "Reroll",
  "Anchor": "锚定者",
  "Analyst": "分析者",
  "Follower": "跟随者",
  "Stubborn": "固执者",
  "Drifter": "投机者",
  "Caller": "观察者",
  "STUBBORN": "固执者",
  "STUBBORN BOSS": "固执的BOSS"
};
