"use strict";

// Small seeded random generator (sfc32). Its whole state is four numbers, so a run can be saved,
// copied for a look-ahead and restored without touching the real game's dice.
function hashSeed(text) {
  let h = 1779033703 ^ String(text).length;
  for (let i = 0; i < String(text).length; i += 1) {
    h = Math.imul(h ^ String(text).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const out = [];
  for (let i = 0; i < 4; i += 1) {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    out.push(h >>> 0);
  }
  return out;
}

function createRng(seed) {
  let [a, b, c, d] = hashSeed(seed);
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  next.getState = () => [a, b, c, d];
  next.setState = (s) => { [a, b, c, d] = s; };
  next.int = (min, max) => Math.floor(next() * (max - min + 1)) + min;
  next.normal = () => {
    const u = Math.max(1e-9, next());
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return next;
}

module.exports = { createRng, hashSeed };
