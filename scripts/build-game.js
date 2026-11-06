"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "src", "game");
const outputFile = path.join(root, "main.js");
// demo.html: index.html with the playtest build on (PLAYTEST_BUILD, 09-playtest-feedback.js)
const indexFile = path.join(root, "index.html");
const demoFile = path.join(root, "demo.html");
const PLAYTEST_FLAG_SCRIPT = "<script>window.DEARTH_PLAYTEST_BUILD = true;</script>";

const SOURCE_FILES = [
  "00-audio-loudness.js",
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
  "09-intro-story.js",
  "09-collection.js",
  "09-gifts.js",
  "09-satan-pact.js",
  "09-playtest-feedback.js",
  "10-events-bootstrap.js",
];

function readGameBundle() {
  return SOURCE_FILES.map((file) => fs.readFileSync(path.join(sourceDir, file), "utf8")).join("");
}

function readDemoHtml() {
  const index = fs.readFileSync(indexFile, "utf8");
  const mainScript = '<script src="main.js"></script>';
  if (!index.includes(mainScript)) throw new Error('index.html has no <script src="main.js"></script> for demo.html');
  return index.replace(mainScript, `${PLAYTEST_FLAG_SCRIPT}\r\n    ${mainScript}`);
}

function writeGameBundle({ quiet = false } = {}) {
  const bundle = readGameBundle();
  fs.writeFileSync(outputFile, bundle);
  fs.writeFileSync(demoFile, readDemoHtml());
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
  const demo = fs.existsSync(demoFile) ? fs.readFileSync(demoFile, "utf8") : "";
  if (demo !== readDemoHtml()) {
    console.error(`${path.relative(root, demoFile)} is stale. Run "pnpm run build:game".`);
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
