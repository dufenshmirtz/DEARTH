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
    for (const key of Object.keys(LOCALES.el)) delete LOCALES.el[key]; // these tests bring their own Greek
    resetTranslationCaches();
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
    LANGUAGES.forEach((entry) => { entry.ready = entry.code === "en"; }); // a language not ready yet is never picked
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

test("every translation keeps the {placeholders} of its English, and adds no quotes or tags", () => {
  const { run } = createGame(1);
  const locales = JSON.parse(run("JSON.stringify(LOCALES)"));
  const english = locales.en;
  assert.ok(Object.keys(english).length > 0);
  for (const [code, entries] of Object.entries(locales)) {
    if (code === "en") continue;
    for (const [key, value] of Object.entries(entries)) {
      // a key of locales/en.js, or English text itself (its own placeholders)
      const source = key in english ? english[key] : key;
      assert.equal(placeholders(value), placeholders(source), `${code}: "${key}" has other {placeholders} than English`);
      if (key in english) assert.equal(typeof value === "object", typeof source === "object", `${code}: "${key}" must be a plural set exactly when English is`);
      // translations go into HTML as they are: no character that HTML or an attribute would read differently
      for (const char of ['"', "<", ">"]) {
        const text = typeof value === "object" ? Object.values(value).join(" ") : value;
        const sourceText = typeof source === "object" ? Object.values(source).join(" ") : source;
        if (!sourceText.includes(char)) assert.ok(!text.includes(char), `${code}: "${key}" adds ${char}`);
      }
    }
  }
});

test("English the code built is translated by patterns, line by line and sentence by sentence", () => {
  const { run, context } = createGame(1);
  context.__assert = assert;
  run(`
    for (const key of Object.keys(LOCALES.el)) delete LOCALES.el[key]; // these tests bring their own Greek
    resetTranslationCaches();
    LOCALES.el["Gain {sin} SIN whenever this happens."] = "Κέρδισε {sin} SIN κάθε φορά.";
    LOCALES.el["Seal of Bael"] = "Σφραγίδα του Βάαλ";
    LOCALES.el["ELITE {level} {name}"] = "ΕΛΙΤ {level} {name}";
    LOCALES.el["-{amount} SOUL from {source}"] = "-{amount} ΨΥΧΗ από {source}";
    LOCALES.el["Run ended."] = "Τέλος.";
    setLanguage("el");
    __assert.equal(t("Gain 15 SIN whenever this happens."), "Κέρδισε 15 SIN κάθε φορά.");
    __assert.equal(t("ELITE III Seal of Bael"), "ΕΛΙΤ III Σφραγίδα του Βάαλ");
    __assert.equal(t("-12 SOUL from Seal of Bael"), "-12 ΨΥΧΗ από Σφραγίδα του Βάαλ");
    __assert.equal(t("-4 SOUL from Hana-87\\nRun ended."), "-4 ΨΥΧΗ από Hana-87\\nΤέλος.");
    __assert.equal(t("Run ended. Not translated yet."), "Τέλος. Not translated yet.");
    setLanguage("en");
    __assert.equal(t("Gain 15 SIN whenever this happens."), "Gain 15 SIN whenever this happens.");
  `);
});

test("descriptionHtml shows SEAL texts in the player's language", () => {
  const { run, context } = createGame(1);
  context.__assert = assert;
  run(`
    const english = itemDescription({ ...ITEMS.p1, stack: 1 });
    LOCALES.el[english] = "Μεταφρασμένο κείμενο.";
    setLanguage("el");
    __assert.equal(descriptionHtml(english), "Μεταφρασμένο κείμενο.");
  `);
});

test("the glossary terms and their other forms are styled as keywords", () => {
  const { run, context } = createGame(1);
  context.__assert = assert;
  run(`
    const styled = (html) => Array.from(html.matchAll(/<span class="tooltip-keyword">([^<]*)<\\/span>/g), (m) => m[1]);
    setLanguage("el");
    __assert.equal(t("SIN"), "ΑΜΑΡΤΙΑ");
    __assert.deepEqual(styled(descriptionHtml("Οι ΚΑΤΑΔΙΚΑΣΜΕΝΟΙ χάνουν 3 ΑΜΑΡΤΙΕΣ και το ΦΟΡΤΙΟ τους.")), ["ΚΑΤΑΔΙΚΑΣΜΕΝΟΙ", "ΑΜΑΡΤΙΕΣ", "ΦΟΡΤΙΟ"]);
    setLanguage("de");
    __assert.deepEqual(styled(descriptionHtml("Alle VERURTEILTEN verlieren 3 SÜNDEN.")), ["VERURTEILTEN", "SÜNDEN"]);
    setLanguage("es");
    __assert.deepEqual(styled(descriptionHtml("Cada CONDENADO pierde 3 PECADOS.")), ["CONDENADO", "PECADOS"]);
    setLanguage("zh-Hans");
    __assert.deepEqual(styled(descriptionHtml("每个罪人失去3罪孽。巴力之印。")), ["罪人", "罪孽"]);
  `);
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

test("the Chinese font files hold every Chinese character the game uses", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const root = path.resolve(__dirname, "..");
  const inFonts = new Set(fs.readFileSync(path.join(root, "fonts/i18n/zh-chars.txt"), "utf8").trim());
  const cjk = /[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]/;
  for (const file of ["src/game/locales/zh-Hans.js", "src/game/00-i18n.js", "src/game/09-satan-pact.js"]) {
    const missing = [...new Set(fs.readFileSync(path.join(root, file), "utf8"))].filter((char) => cjk.test(char) && !inFonts.has(char));
    assert.deepEqual(missing, [], `${file} uses Chinese characters the fonts lack: run python scripts/subset-fonts.py`);
  }
});

// Satan's Pact in every language: what each request asks for (the tricks are heard first, as in satanPactAnswer)
const PACT_REQUESTS = {
  el: [
    ["θέλω να με θεραπεύσεις 20", "heal", { n: 20 }],
    ["δώσε μου 30 αμαρτίες", "sin", { n: 30 }],
    ["αναβάθμισε τη σφραγίδα", "elite"],
    ["θέλω μια δεύτερη ζωή", "cheatDeath"],
    ["δώσε μου τη σφραγίδα σου", "satanSeal"],
    ["θέλω δύο χρήσεις", "uses", { n: 2 }],
    ["δώσε μου χάρη", "favor"],
    ["κάρμα", "karma"],
    ["θέλω τη σφραγίδα του Βάαλ", "seal", { id: "p16" }],
    ["άρχοντά μου, δώσε μου λεφτά σε παρακαλώ", "sin", {}, ["silver", "please"]],
    ["Μεφιστοφελή, με το αίμα μου, θέλω ψυχή", "heal", {}, ["name", "blood"]]
  ],
  de: [
    ["heile mich um 20", "heal", { n: 20 }],
    ["gib mir 30 Sünden", "sin", { n: 30 }],
    ["werte das Siegel auf", "elite"],
    ["ich will ein zweites Leben", "cheatDeath"],
    ["gib mir dein Siegel", "satanSeal"],
    ["zwei Aktionen", "uses", { n: 2 }],
    ["Karma", "karma"],
    ["Mephisto, Seele", "heal", {}, ["name"]],
    ["mein Herr, gib mir Geld, bitte", "sin", {}, ["silver", "please"]]
  ],
  es: [
    ["cúrame 20", "heal", { n: 20 }],
    ["dame 30 pecados", "sin", { n: 30 }],
    ["mejora el sello", "elite"],
    ["quiero otra vida", "cheatDeath"],
    ["dame tu sello", "satanSeal"],
    ["dos acciones", "uses", { n: 2 }],
    ["un favor", "favor"],
    ["mi señor, dame dinero por favor", "sin", {}, ["silver", "please"]],
    ["con mi sangre, diez pecados", "sin", { n: 10 }, ["blood"]]
  ],
  "zh-Hans": [
    ["给我治疗20", "heal", { n: 20 }],
    ["给我30罪孽", "sin", { n: 30 }],
    ["升级印记", "elite"],
    ["我想要第二条命", "cheatDeath"],
    ["给我撒旦之印", "satanSeal"],
    ["两次行动", "uses", { n: 2 }],
    ["业力", "karma"],
    ["给我巴力", "seal", { id: "p16" }],
    ["我的主人，请给我钱", "sin", {}, ["silver", "please"]],
    ["梅菲斯特，用我的血，十个罪孽", "sin", { n: 10 }, ["name", "blood"]]
  ]
};

test("Satan's Pact understands requests in every language, and English in all of them", () => {
  const { run } = createGame(1);
  run(`startGame(); LOCALES.el["Seal of Bael"] = "Σφραγίδα του Βάαλ"; LOCALES["zh-Hans"]["Seal of Bael"] = "巴力之印";`);
  const ask = (text) => JSON.parse(run(`(() => { const heard = satanPactHearTricks(${JSON.stringify(text)}); return JSON.stringify({ tricks: heard.found, ...satanPactParse(heard.cleaned) }); })()`));
  for (const [code, requests] of Object.entries(PACT_REQUESTS)) {
    run(`setLanguage(${JSON.stringify(code)})`);
    for (const [text, intent, fields = {}, tricks = []] of requests) {
      const answer = ask(text);
      assert.equal(answer.intent, intent, `${code}: "${text}"`);
      for (const [key, value] of Object.entries(fields)) assert.equal(answer[key], value, `${code}: "${text}" ${key}`);
      for (const trick of tricks) assert.ok(answer.tricks.includes(trick), `${code}: "${text}" should hear ${trick}`);
    }
    // English still works in every language
    assert.equal(ask("heal me 20").intent, "heal");
    assert.equal(ask("give me the seal of bael").id, "p16");
    const bot = run("state.bots[0].name");
    assert.equal(ask(code === "zh-Hans" ? `杀了${bot}` : code === "el" ? `σκότωσε τον ${bot}` : code === "de" ? `töte ${bot}` : `mata a ${bot}`).botId, run("state.bots[0].id"));
  }
});
