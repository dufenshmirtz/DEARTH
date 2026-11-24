/* ---------- Translation (i18n) ----------
   Plan and decisions: Project doc claude/localization-plan.md.
   English is the game's internal language: ITEMS names, BOSS names and the log sentences that the code reads
   (damage sources, SEAL discovery, the READY animations) stay English for good. Text is translated only where
   it is shown, with t():
   - t("settings.reset"): a key of locales/en.js (short labels whose English word could mean two things);
   - t("Resume"), t("Gain {sin} SIN.", { sin }): the English text itself. The text tables (Satan, Jesus, Codex,
     missions...) and ITEMS stay where the designers write them, and are translated by their English text.
     Change the English and the old translation no longer matches: that text shows in English until retranslated
     (node scripts/i18n-report.js lists what each language still lacks).
   Locale files: src/game/locales/<code>.js, each one fills LOCALES[<code>] = { "key or English text": "translation" }.
   A value can also be a plural set, { one: "{count} SEAL", other: "{count} SEALS" }, picked by params.count
   (Intl.PluralRules: Chinese has only "other", Greek / German / Spanish / English have "one" and "other").
   A key ending in "Html" holds HTML (keep its tags); every other value is plain text and is escaped where shown.
   DEV: the "pseudo" language (Pause > DEV > Language) turns English into accented text 35% longer, so text that
   doesn't go through t() stays plain English and text that doesn't fit is easy to spot. */

const LOCALES = {};
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
  let letters = 0;
  const body = String(text).replace(/(\{\w+\}|<[^>]*>|&[#\w]+;)|([A-Za-z])/g, (match, keep, letter) => {
    if (keep) return keep;
    letters += 1;
    return PSEUDO_LETTERS[letter] || letter;
  });
  return `[${body}${"~".repeat(Math.ceil(letters * 0.35))}]`;
}

/* The text in the player's language (English if that language has no text for it yet).
   key: a key of locales/en.js, or the English text itself. params fill {name} placeholders;
   params.count also picks the plural form. */
function t(key, params) {
  let entry = translationEntry(key);
  if (entry === undefined) entry = key;
  if (entry && typeof entry === "object") {
    const count = params && params.count !== undefined ? params.count : 0;
    entry = entry[pluralCategory(count)] ?? entry.other ?? Object.values(entry)[0] ?? "";
  }
  const text = currentLanguageCode === PSEUDO_LANGUAGE.code ? pseudoTranslation(String(entry)) : String(entry);
  return fillTranslation(text, params);
}

// a language's name in that language (the Language setting shows each one as its speakers write it)
function languageName(code) {
  return languageInfo(code)?.name || code;
}
