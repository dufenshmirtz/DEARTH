"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "src", "game");
const outputFile = path.join(root, "main.js");

const SOURCE_FILES = [
  "00-audio-sfx-config.js",
  "00-config-data-state.js",
  "01-persistence-audio.js",
  "02-run-records.js",
  "02-rules-scaling.js",
  "03-descriptions-ui-stats.js",
  "04-damage-bots-core.js",
  "05-setup-shop-round-start.js",
  "06-round-resolution.js",
  "07-shop-artifacts.js",
  "08-pvp.js",
  "09-rendering.js",
  "10-events-bootstrap.js",
];

function readGameBundle() {
  return SOURCE_FILES.map((file) => fs.readFileSync(path.join(sourceDir, file), "utf8")).join("");
}

function writeGameBundle({ quiet = false } = {}) {
  const bundle = readGameBundle();
  fs.writeFileSync(outputFile, bundle);
  if (!quiet) {
    console.log(`Built ${path.relative(root, outputFile)} from ${path.relative(root, sourceDir)}`);
  }
  return bundle;
}

function verifyGameBundle() {
  const expected = readGameBundle();
  const actual = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (actual !== expected) {
    console.error(`${path.relative(root, outputFile)} is stale. Run "pnpm run build:game".`);
    return false;
  }
  return true;
}

if (require.main === module) {
  if (process.argv.includes("--verify")) {
    if (!verifyGameBundle()) {
      process.exit(1);
    }
    console.log("Game bundle is current.");
  } else {
    writeGameBundle();
  }
}

module.exports = {
  SOURCE_FILES,
  readGameBundle,
  writeGameBundle,
  verifyGameBundle,
};
