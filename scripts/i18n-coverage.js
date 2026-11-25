"use strict";

/* What is not translatable yet: renders every screen (as the text snapshot does) in the DEV Pseudo language
   and lists the visible text that is still plain English, i.e. text that does not go through t().
   node scripts/i18n-coverage.js              all screens, desktop
   node scripts/i18n-coverage.js native       the phone app layout (or: mobile)
   node scripts/i18n-coverage.js desktop menu only screens whose name contains "menu"
   Names (DAMNED, BOSSES), numbers and language names are not counted. */

const { screenTexts } = require("./text-snapshot");

const layout = process.argv[2] || "desktop";
const only = process.argv[3] || "";
const screens = screenTexts(layout, "pseudo");

// a line is translated when every run of letters sits inside a pseudo [ ... ] block.
// data-tooltip text is translated when the tooltip opens (descriptionHtml), so it is not counted here.
function untranslatedPart(line) {
  if (line.startsWith("[data-tooltip] ")) return "";
  const text = line.replace(/^\[(?:title|aria-label|placeholder|alt|data-label)\] /, "");
  let rest = "";
  let depth = 0;
  for (const char of text) {
    if (char === "[") depth += 1;
    else if (char === "]") depth = Math.max(0, depth - 1);
    else if (!depth) rest += char;
  }
  rest = rest.replace(/&\w+;|&#\d+;/g, " ");
  // DAMNED names (Hana-87), numbers, roman numerals and single letters are not text to translate
  rest = rest.replace(/\b[A-Z][a-z]+-\d+\b/g, " ").replace(/\b[IVXLC]+\b/g, " ");
  return /[A-Za-z]{2,}/.test(rest) ? rest.replace(/\s+/g, " ").trim() : "";
}

const seen = new Map();
let total = 0;
for (const [screen, lines] of Object.entries(screens)) {
  if (only && !screen.includes(only)) continue;
  if (screen.endsWith(".pause.dev")) continue; // the DEV panel is for testing and stays English
  const left = Array.from(new Set(lines.map(untranslatedPart).filter(Boolean)));
  const fresh = left.filter((part) => !seen.has(part));
  left.forEach((part) => seen.set(part, (seen.get(part) || 0) + 1));
  total += fresh.length;
  if (fresh.length) console.log(`\n${screen} (${fresh.length} new)\n  ${fresh.join("\n  ")}`);
}
console.log(`\n${total} different texts still in plain English (${layout}${only ? `, ${only}` : ""}).`);
