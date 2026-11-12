"use strict";

// pnpm run playtest:zip: the playtest build (demo.html) as a zip for itch.io (Kind of project: HTML).
// demo.html goes in as index.html, with main.js, styles.css, assets/ and fonts/; dev-only files stay out.
// It also checks every asset path the game names: itch's servers care about capital letters, Windows does not.
// Output: dist/playtest/DEARTH-playtest-itch-<version>.zip

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { writeGameBundle } = require("./build-game");

const root = path.resolve(__dirname, "..");
const pkg = require(path.join(root, "package.json"));
const outDir = path.join(root, "dist", "playtest");
const outFile = path.join(outDir, `DEARTH-playtest-itch-${pkg.version}.zip`);

// dev-only material inside assets/ that the game never loads
const EXCLUDED_DIRS = ["assets/occult-ui-border-kit/demo", "assets/occult-ui-border-kit/source-prompts"];
const EXCLUDED_EXTENSIONS = [".md", ".txt"];

function walk(dir, list = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(rel)) walk(rel, list);
    } else if (entry.isFile() && !EXCLUDED_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      list.push(rel);
    }
  }
  return list;
}

// ---------- asset path check (exact case) ----------
function checkAssetPaths(files, sources) {
  const exact = new Set(files);
  const lower = new Map(files.map((file) => [file.toLowerCase(), file]));
  const pattern = /(?:assets|fonts)\/[^"'`()\s]+?\.(?:png|webp|jpe?g|svg|gif|mp3|ogg|wav|otf|ttf|woff2?)/gi;
  const wrongCase = new Map();
  const missing = new Set();
  for (const text of sources) {
    for (const match of text.matchAll(pattern)) {
      const ref = match[0];
      if (ref.includes("${")) continue;
      let file = ref;
      try { file = decodeURIComponent(ref); } catch (error) {}
      if (exact.has(file)) continue;
      const actual = lower.get(file.toLowerCase());
      if (actual) wrongCase.set(file, actual);
      else missing.add(file);
    }
  }
  return { wrongCase, missing };
}

// ---------- minimal zip writer (deflate, UTF-8 names, forward slashes) ----------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function writeZip(entries, target) {
  const fd = fs.openSync(target, "w");
  const central = [];
  let offset = 0;
  const { time, day } = dosDateTime(new Date());
  for (const { name, data } of entries) {
    const nameBuffer = Buffer.from(name, "utf8");
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const stored = deflated.length >= data.length;
    const body = stored ? data : deflated;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 file names
    local.writeUInt16LE(stored ? 0 : 8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    fs.writeSync(fd, local);
    fs.writeSync(fd, nameBuffer);
    fs.writeSync(fd, body);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0x0800, 8);
    header.writeUInt16LE(stored ? 0 : 8, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(day, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(body.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(nameBuffer.length, 28);
    header.writeUInt32LE(offset, 42);
    central.push(header, nameBuffer);
    offset += local.length + nameBuffer.length + body.length;
  }
  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeSync(fd, centralBuffer);
  fs.writeSync(fd, end);
  fs.closeSync(fd);
  return offset + centralBuffer.length + end.length;
}

// ---------- build ----------
writeGameBundle({ quiet: true }); // main.js and demo.html up to date

const assetFiles = [...walk("assets"), ...walk("fonts")];
// CSS comments mention files that are not loaded
const sources = ["main.js", "styles.css", "demo.html"].map((file) => fs.readFileSync(path.join(root, file), "utf8").replace(file.endsWith(".css") ? /\/\*[\s\S]*?\*\//g : /$^/, ""));
const { wrongCase, missing } = checkAssetPaths(assetFiles, sources);
if (missing.size) {
  console.warn(`Warning: ${missing.size} asset path(s) named in the game have no file (they will not load):`);
  [...missing].sort().forEach((file) => console.warn(`  ${file}`));
}
if (wrongCase.size) {
  console.error("These asset paths differ from the files only in capital letters; they work on Windows but break on itch.io:");
  wrongCase.forEach((actual, ref) => console.error(`  ${ref}  ->  file is ${actual}`));
  process.exit(1);
}

const entries = [
  { name: "index.html", data: fs.readFileSync(path.join(root, "demo.html")) },
  { name: "main.js", data: fs.readFileSync(path.join(root, "main.js")) },
  { name: "styles.css", data: fs.readFileSync(path.join(root, "styles.css")) },
  ...assetFiles.map((file) => ({ name: file, data: fs.readFileSync(path.join(root, file)) }))
];

if (entries.length > 1000) {
  console.error(`${entries.length} files: itch.io takes at most 1000 in an HTML zip.`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const unpacked = entries.reduce((sum, entry) => sum + entry.data.length, 0);
const size = writeZip(entries, outFile);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
console.log(`Built ${path.relative(root, outFile)}: ${entries.length} files, ${mb(size)} (${mb(unpacked)} unpacked)`);
