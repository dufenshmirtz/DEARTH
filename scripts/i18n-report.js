"use strict";

/* What a language still lacks, as a worklist for the translation.
   node scripts/i18n-report.js el            summary, and the untranslated text into i18n-work/el.todo.json
   node scripts/i18n-report.js el --list     also prints every untranslated text
   The English that reaches the screen is gathered by running the game as the text snapshot does
   (every text passed to t() is recorded), plus the dialogue and the price texts of Satan's deal,
   which only show in the browser. Texts that differ only in their numbers are grouped as one
   pattern ("Gain {n1} SIN whenever this happens."): translate the pattern once, keeping every {n1}, {n2}...
   (in any order). "ELITE {level} {name}" covers the ELITE prefix of every SEAL name.
   The worklist is { "English": "" }; fill in the translations and move them into src/game/locales/<code>.js. */

const fs = require("node:fs");
const path = require("node:path");
const { createGame, screenTexts } = require("./text-snapshot");

const code = process.argv[2];
if (!code) {
  console.error("Usage: node scripts/i18n-report.js <language code: el, de, es, zh-Hans> [--list]");
  process.exit(1);
}
const list = process.argv.includes("--list");

// record every English text passed to t() while the game renders its screens and plays the simulated runs
function shownEnglish() {
  const seen = new Set();
  const original = require("./text-snapshot");
  const record = (game) => {
    game.run(`
      globalThis.__shown = globalThis.__shown || new Set();
      const __t = t;
      t = (key, params) => { __shown.add(key); return __t(key, params); };
    `);
    return () => JSON.parse(game.run("JSON.stringify([...__shown])")).forEach((text) => seen.add(text));
  };
  // screens: the snapshot's scenes with t() recorded
  for (const layout of ["desktop", "mobile", "native"]) {
    const game = createGame(1, layout);
    const collect = record(game);
    original.screenTextsOn(game, layout);
    collect();
  }
  // every SEAL / ARTIFACT text at every ELITE level, as the tooltips show them
  const game = createGame(1);
  const collect = record(game);
  game.run(`Object.keys(ITEMS).forEach((id) => {
    const stacks = ITEMS[id].type === "passive" ? [1, 2, 3, 4, 5, 6] : [1];
    stacks.forEach((stack) => {
      const item = { ...ITEMS[id], stack, uid: id + "-report" };
      try {
        descriptionHtml(itemDescription(item));
        t(ITEMS[id].type === "passive" ? passiveDisplayName(item) : item.name);
        if (ITEMS[id].type === "passive") renderSealTooltipHtml(item, passiveDisplayName(item), itemDescription(item), "", null);
      } catch (error) {}
    });
  });`);
  // the story, Jesus' and Satan's lines, the deal's lines and price texts (browser-only scenes)
  game.run(`
    const __lines = (value) => {
      if (typeof value === "string") { __shown.add(value); return; }
      if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "string" && typeof value[1] === "string" && INTRO_SPEAKERS.includes(value[0])) { __shown.add(value[1]); return; }
      if (value && typeof value === "object") Object.values(value).forEach(__lines);
    };
    [INTRO_JUDGEMENT_LINES, JESUS_GUIDE_LINES, JESUS_REVEAL_LINES, INTRO_PACT_LINES, SATAN_LESSON_LINES, SATAN_DEAL_INTRO_LINES,
     SATAN_FIRST_VICTORY_LINES, SATAN_VICTORY_LINES, FINAL_JUDGEMENT_LINES, SATAN_TIGHTWAD_LINES, SATAN_TIGHTWAD_AGAIN_LINES,
     SATAN_DEAL_LINES, SATAN_DEAL_PRICE_TEXT, SATAN_DEAL_PRICE_TEXT_FOR, SATAN_DEAL_BUTTONS, CODEX_TORN_TEXT].forEach(__lines);
    MISSIONS.forEach((mission) => { if (typeof mission.text === "string") __shown.add(mission.text); });
  `);
  collect();
  return seen;
}

// long text is translated line by line and sentence by sentence (as t() does), so report it that way
function pieces(text) {
  return String(text)
    .split("\n")
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((piece) => piece.trim())
    .filter((piece) => /[A-Za-z]{2,}/.test(piece.replace(/<[^>]*>|&\w+;/g, " ")));
}

const shown = shownEnglish();
const game = createGame(1);
game.run(`setLanguage(${JSON.stringify(code)})`);
const isTranslated = (text) =>
  JSON.parse(game.run(`(() => { const text = ${JSON.stringify(text)}; return JSON.stringify(t(text) !== text || LOCALES[${JSON.stringify(code)}]?.[text] === text); })()`));

const english = new Set();
for (const text of shown) {
  if (typeof text !== "string") continue;
  if (game.run(`LOCALES.en[${JSON.stringify(text)}] !== undefined`)) {
    english.add(text);
    continue;
  }
  if (isTranslated(text)) continue;
  pieces(text).forEach((piece) => english.add(piece));
}
// group texts that differ only in their numbers
const groups = new Map();
for (const text of english) {
  if (game.run(`LOCALES.en[${JSON.stringify(text)}] !== undefined`)) {
    groups.set(text, [text]);
    continue;
  }
  if (isTranslated(text)) continue;
  // the ELITE prefix of a SEAL name is one pattern for every SEAL (the name itself is its own text)
  const elite = text.match(/^ELITE [IVXLC]+ (.+)$/);
  if (elite) {
    groups.set("ELITE {level} {name}", ["ELITE {level} {name}"]);
    if (!isTranslated(elite[1])) groups.set(elite[1], [elite[1]]);
    continue;
  }
  let number = 0;
  const pattern = text.replace(/\d+(?:\.\d+)?/g, () => `{n${(number += 1)}}`);
  if (!groups.has(pattern)) groups.set(pattern, []);
  groups.get(pattern).push(text);
}
const todo = {};
for (const [pattern, texts] of [...groups.entries()].sort()) {
  const key = texts.length > 1 || /\{n\d+\}/.test(pattern) ? pattern : texts[0];
  if (game.run(`LOCALES[${JSON.stringify(code)}]?.[${JSON.stringify(key)}] !== undefined`)) continue;
  todo[key] = "";
}
const out = path.join(__dirname, "..", "i18n-work", `${code}.todo.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(todo, null, 1)}\n`);
const words = Object.keys(todo).join(" ").split(/\s+/).filter(Boolean).length;
if (list) console.log(Object.keys(todo).join("\n"));
console.log(`${code}: ${Object.keys(todo).length} texts still to translate (about ${words} English words). Worklist: ${path.relative(process.cwd(), out)}`);
