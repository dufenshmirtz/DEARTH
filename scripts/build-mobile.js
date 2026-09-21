"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "native-www");

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dest);
    } else if (entry.isFile()) {
      copyFile(src, dest);
    }
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

copyFile(path.join(root, "app.html"), path.join(outDir, "index.html"));
copyFile(path.join(root, "main.js"), path.join(outDir, "main.js"));
copyFile(path.join(root, "styles.css"), path.join(outDir, "styles.css"));
copyDir(path.join(root, "assets"), path.join(outDir, "assets"));
copyDir(path.join(root, "fonts"), path.join(outDir, "fonts"));

console.log(`Built mobile Arcade bundle at ${path.relative(root, outDir)}`);
