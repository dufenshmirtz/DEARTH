"use strict";

// The English text the game produces must stay exactly as recorded in scripts/text-snapshot.en.json.
// After a change you meant to make (new text, balance), refresh it: pnpm run text:update
const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { buildSnapshot, stableJson, snapshotDifferences, SNAPSHOT_FILE } = require("./text-snapshot");

test("English text matches the snapshot", () => {
  const expected = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
  const actual = JSON.parse(stableJson(buildSnapshot()));
  const differences = snapshotDifferences(expected, actual);
  assert.equal(differences.length, 0, `English text changed:\n${differences.join("\n")}`);
});
