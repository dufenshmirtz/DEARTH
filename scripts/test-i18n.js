"use strict";

// Translation layer (src/game/00-i18n.js) and the locale files (src/game/locales/*.js)
const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame } = require("./text-snapshot");

const placeholders = (value) =>
  Array.from(new Set((typeof value === "object" ? Object.values(value).join(" ") : String(value)).match(/\{\w+\}/g) || [])).sort().join(",");

test("t() gives English, fills {params}, picks plurals and shows a missing key as the key", () => {
  const { run, context } = createGame(1);
  context.__assert = assert;
  run(`
    LOCALES.en["test.hello"] = "Hello {name}";
    LOCALES.en["test.seals"] = { one: "{count} SEAL", other: "{count} SEALS" };
    __assert.equal(t("test.hello", { name: "Bael" }), "Hello Bael");
    __assert.equal(t("test.seals", { count: 1 }), "1 SEAL");
    __assert.equal(t("test.seals", { count: 3 }), "3 SEALS");
    __assert.equal(t("test.nope"), "test.nope");
    __assert.equal(t("settings.reset"), "Reset to defaults");
  `);
});

test("another language falls back to English for a key it lacks, and uses its own plural rules", () => {
  const { run, context } = createGame(1);
  context.__assert = assert;
  run(`
    LOCALES.en["test.seals"] = { one: "{count} SEAL", other: "{count} SEALS" };
    LOCALES["zh-Hans"]["test.seals"] = { other: "{count} 印" };
    LOCALES.el["settings.reset"] = "Επαναφορά";
    setLanguage("el");
    __assert.equal(t("settings.reset"), "Επαναφορά");
    __assert.equal(t("settings.master"), "Master");
    __assert.equal(document.documentElement.lang !== undefined, true);
    setLanguage("zh-Hans");
    __assert.equal(t("test.seals", { count: 1 }), "1 印");
    setLanguage("nonsense");
    __assert.equal(currentLang(), "zh-Hans");
  `);
});

test("the pseudo language changes letters but keeps {params}, HTML tags and entities", () => {
  const { run, context } = createGame(1);
  context.__assert = assert;
  run(`
    setLanguage("pseudo");
    const text = t("settings.previous", { setting: "Flashes" });
    __assert.match(text, /^\\[Þŕéṽîôûŝ Flashes~+\\]$/);
    const html = t("settings.controlsHtml");
    __assert.ok(html.includes("<b>") && html.includes("&nbsp;"));
    __assert.ok(!/[A-Za-z]{3}/.test(html.replace(/<[^>]*>|&\\w+;/g, "")));
  `);
});

test("the system language is used on first launch only when the game is ready in it", () => {
  const { run, context } = createGame(1);
  context.__assert = assert;
  run(`
    navigator.languages = ["el-GR", "en-US"];
    __assert.equal(languageFromSystem(), "en");
    LANGUAGES.find((entry) => entry.code === "el").ready = true;
    __assert.equal(languageFromSystem(), "el");
    navigator.languages = ["zh-TW"];
    LANGUAGES.find((entry) => entry.code === "zh-Hans").ready = true;
    __assert.equal(languageFromSystem(), "zh-Hans");
    navigator.languages = ["fr-FR"];
    __assert.equal(languageFromSystem(), "en");
  `);
});

test("every language has only keys English has, with the same {placeholders}", () => {
  const { run } = createGame(1);
  const locales = JSON.parse(run("JSON.stringify(LOCALES)"));
  const english = locales.en;
  assert.ok(Object.keys(english).length > 0);
  for (const [code, entries] of Object.entries(locales)) {
    if (code === "en") continue;
    for (const [key, value] of Object.entries(entries)) {
      assert.ok(key in english, `${code}: "${key}" is not an English key`);
      assert.equal(placeholders(value), placeholders(english[key]), `${code}: "${key}" has other {placeholders} than English`);
      assert.equal(typeof value === "object", typeof english[key] === "object", `${code}: "${key}" must be a plural set exactly when English is`);
    }
  }
});

test("Settings in the pseudo language: every text goes through t()", () => {
  const { run } = createGame(1);
  run(`setLanguage("pseudo")`);
  for (const tab of ["audio", "display", "gameplay"]) {
    const html = run(`state.settingsTab = "${tab}"; renderSettingsPanel("menu")`);
    const visible = html
      .replace(/<[^>]*>/g, "\n")
      .split("\n")
      .map((line) => line.replace(/&\w+;|&#\d+;/g, "").trim())
      .filter((line) => /[A-Za-z]/.test(line));
    // language names stay as each language writes itself
    const names = JSON.parse(run("JSON.stringify(testingLanguageCodes().map(languageName))"));
    const plain = visible.filter((line) => !/^\[/.test(line) && !/^x\d$/.test(line) && !names.includes(line));
    assert.deepEqual(plain, [], `untranslated text in Settings > ${tab}`);
  }
});
