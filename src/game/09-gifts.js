"use strict";

/* ---------- Jesus' Gifts: KARMA packs ----------
   Main menu: click Jesus (or Options > Jesus' Gifts). Three gifts, each opens into one unlockable by its
   own odds (GIFT_PACKS, in %; a pack's odds are weights, so they need not add up to exactly 100):
     a kind is drawn by the odds, then one item of that kind at random. Ars Goetia: any of the 72 demons
     (it then counts as defeated in the Collection and can be bound); the other kinds are SEALS by
     Collection section (GIFT_KINDS).
   Already yours (a defeated demon, an unlocked or never-locked SEAL): a duplicate, half the price back.
   The Planetary Seals, the Trinity and Anael are locked from the start and only gifts unlock them
   (GIFT_ONLY_SEAL_IDS in 09-collection.js); the other locked SEALS can also still be earned by their
   achievement. Opening: the vessel catches fire, burns to smoke, the sigil forms in the smoke. */
const GIFT_PACKS = [
  { key: "myrrh", name: "Myrrh", price: 44, odds: { goetia: 57, planet: 25, archangel: 10, boss: 4, apocalypse: 2.001, trinity: 1.333, satan: 0.666 } },
  { key: "frankincense", name: "Frankincense", price: 88, odds: { goetia: 36, planet: 35, archangel: 15, boss: 8, apocalypse: 4.001, trinity: 1.333, satan: 0.666 } },
  { key: "gold", name: "Gold", price: 166, odds: { goetia: 5, planet: 40, archangel: 25, boss: 18, apocalypse: 10, trinity: 1.333, satan: 0.666 } }
];
const GIFT_KINDS = [
  { key: "goetia", label: "Ars Goetia demon" },
  { key: "planet", label: "Planetary Seal", sections: ["saturn", "artifact", "poison"] },
  { key: "archangel", label: "Archangel Seal", sections: ["archangel"] },
  { key: "boss", label: "Boss Seal", sections: ["bosses"] },
  { key: "apocalypse", label: "Apocalypse Seal", sections: ["apocalypse"] },
  { key: "trinity", label: "Trinity Seal", sections: ["trinity"] },
  { key: "satan", label: "Seal of Satan", sections: ["satan"] }
];
const GIFT_REFUND_SHARE = 0.5;
const GIFT_RARE_ODDS = 5; // odds under this show in red
const GIFT_OPEN_TIMING = { burn: 900, smoke: 1000 }; // ms: the vessel burns, then the smoke thickens before the reveal

function giftPack(key) {
  return GIFT_PACKS.find((pack) => pack.key === key) || null;
}

function giftKind(key) {
  return GIFT_KINDS.find((kind) => kind.key === key) || null;
}

// what one kind can give: demon keys, or SEAL ids
function giftKindItems(kindKey) {
  if (kindKey === "goetia") return GOETIC_BOSS_KEYS.slice();
  const kind = giftKind(kindKey);
  if (!kind) return [];
  return COLLECTION_SECTIONS.filter((section) => kind.sections.includes(section.key))
    .flatMap((section) => section.ids || [])
    .filter((id) => ITEMS[id] && !REMOVED_PASSIVE_IDS.has(id));
}

function giftRefund(pack) {
  return Math.floor((pack?.price || 0) * GIFT_REFUND_SHARE);
}

// a kind by the pack's odds, then one of its items
function rollGift(pack) {
  const entries = GIFT_KINDS.map((kind) => [kind.key, Math.max(0, Number(pack.odds[kind.key]) || 0)]).filter(([key, weight]) => weight > 0 && giftKindItems(key).length);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  let kindKey = entries[entries.length - 1][0];
  for (const [key, weight] of entries) {
    if (roll < weight) { kindKey = key; break; }
    roll -= weight;
  }
  const items = giftKindItems(kindKey);
  const item = items[Math.min(items.length - 1, Math.floor(Math.random() * items.length))];
  return { kind: kindKey, item };
}

function giftAlreadyOwned(kindKey, item) {
  const progress = loadCollectionProgress();
  if (kindKey === "goetia") return progress.slain.includes(item);
  return !SEAL_UNLOCKS[item] || progress.unlocked.includes(item);
}

// buy and open a gift: pays, draws, unlocks or refunds. Returns what came out, or { error }.
function openGift(packKey) {
  const pack = giftPack(packKey);
  if (!pack) return { error: "unknown" };
  if (karmaBalance() < pack.price) return { error: "karma" };
  const progress = loadCollectionProgress();
  progress.karma = karmaBalance() - pack.price;
  const { kind, item } = rollGift(pack);
  const duplicate = giftAlreadyOwned(kind, item);
  const refund = duplicate ? giftRefund(pack) : 0;
  if (duplicate) progress.karma += refund;
  else if (kind === "goetia") progress.slain.push(item);
  else progress.unlocked.push(item);
  saveCollectionProgress();
  const spec = kind === "goetia" ? GOETIC_BOSS_BY_KEY[item] : null;
  return {
    pack: pack.key,
    kind,
    item,
    duplicate,
    refund,
    name: spec ? spec.name : ITEMS[item]?.name || item,
    image: spec ? demonThumbPath(spec) : sealSigilPath(item)
  };
}

/* ---- the screen ---- */
function giftsOpen() {
  return state.mode === "menu" && Boolean(state.menuGiftsOpen);
}

function openGiftsFromMenu() {
  if (state.mode !== "menu") return;
  state.menuGiftsOpen = true;
  if (!giftPack(state.giftsSelected)) state.giftsSelected = "myrrh";
  render();
}

function closeGifts() {
  state.menuGiftsOpen = false;
  render();
}

// the three vessels the Magi carried, in the game's hand-drawn white line
const GIFT_VESSEL_PATHS = {
  myrrh: ["M42 14h16M44 14v12M56 14v12M44 26c-14 6-17 24-15 44 2 20 10 32 21 32s19-12 21-32c2-20-1-38-15-44", ["M33 52h34M31 70h38", 1.6], ["M50 104v7M47 112c2 2 4 2 6 0", 1.8]],
  frankincense: [["M50 2v14M50 16L30 50M50 16l20 34", 1.6], "M30 50c0-15 40-15 40 0zM26 54h48c0 18-11 28-24 28S26 72 26 54zM42 82l-5 12h26l-5-12", ["M44 44c-7-7 7-11 0-19M57 42c7-7-7-11 0-19", 1.6], ["M38 47h2M48 45h2M58 47h2", 3]],
  gold: ["M14 62h72v40H14zM14 62c0-22 72-22 72 0", "M50 38v18M43 46h14", ["M45 78h10v12H45zM14 72h72", 1.8], ["M20 108a5 3 0 1 0 10 0a5 3 0 1 0-10 0M78 106a5 3 0 1 0 10 0a5 3 0 1 0-10 0M84 100a4 2.5 0 1 0 8 0a4 2.5 0 1 0-8 0", 1.6]]
};

function giftVesselSvg(key) {
  const paths = (GIFT_VESSEL_PATHS[key] || [])
    .map((entry) => {
      const [d, width] = Array.isArray(entry) ? entry : [entry, 2.6];
      return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join("");
  return `<svg class="gift-vessel" viewBox="0 -4 100 120" aria-hidden="true"><g filter="url(#giftRough)">${paths}</g></svg>`;
}

function giftKindIcon(kindKey) {
  if (kindKey === "goetia") return demonThumbPath(GOETIC_BOSS_SPECS[0]);
  return sealSigilPath(giftKindItems(kindKey)[0]);
}

function giftOddsHtml(pack) {
  const rows = GIFT_KINDS.map((kind) => {
    const odds = Number(pack.odds[kind.key]) || 0;
    const text = Number.isInteger(odds) ? String(odds) : String(+odds.toFixed(3));
    return `<div class="gift-odds-row${odds < GIFT_RARE_ODDS ? " rare" : ""}"><img src="${escapeAttr(giftKindIcon(kind.key))}" alt="" draggable="false" /><span>${escapeHtml(kind.label)}</span><b>${text}%</b></div>`;
  }).join("");
  return `<div class="gift-odds-title">${escapeHtml(pack.name)}</div>${rows}<div class="gift-odds-note">Already yours: ${formatNumber(giftRefund(pack))}${KARMA_MARK} back</div>`;
}

function renderGiftsScreen() {
  const selected = giftPack(state.giftsSelected) || GIFT_PACKS[0];
  const balance = karmaBalance();
  const gifts = GIFT_PACKS.map((pack) => {
    const can = balance >= pack.price;
    return `
      <button type="button" class="gift-pick gift-${pack.key}${pack.key === selected.key ? " selected" : ""}" data-gift-pick="${pack.key}" aria-pressed="${pack.key === selected.key}">
        ${giftVesselSvg(pack.key)}
        <span class="gift-name">${escapeHtml(pack.name)}</span>
        <span class="gift-price${can ? "" : " cant"}">${formatNumber(pack.price)}${KARMA_MARK}</span>
      </button>`;
  }).join("");
  const canOpen = balance >= selected.price;
  return `
    <div class="gifts-screen" role="dialog" aria-label="Jesus' Gifts">
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="giftRough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></defs></svg>
      <img class="gifts-jesus" src="assets/ui/jesus.png" alt="" draggable="false" />
      <button class="collection-back gifts-back" type="button" data-gifts-back>Back</button>
      <h1 class="gifts-title">Jesus' Gifts</h1>
      <div class="gifts-karma">${collectionKarmaLine()}</div>
      <div class="gifts-table">
        <div class="gifts-row">${gifts}</div>
        <div class="gifts-divider"></div>
      </div>
      <div class="gifts-odds">${giftOddsHtml(selected)}</div>
      <button type="button" class="collection-bind-button gifts-open" data-gift-open${canOpen ? "" : " disabled"}>Open · ${formatNumber(selected.price)}${KARMA_MARK}</button>
      ${canOpen ? "" : `<div class="gifts-short">You need ${formatNumber(selected.price - balance)}${KARMA_MARK} more</div>`}
    </div>`;
}

/* ---- opening: burn, smoke, the sigil in the smoke ----
   Lives outside the render cycle (data-morph-keep) so renders never restart it. */
let giftOpening = null;

function startGiftOpening(packKey) {
  if (giftOpening) return;
  const screen = document.querySelector(".gifts-screen");
  const result = openGift(packKey);
  if (result.error) return;
  const pack = giftPack(packKey);
  const kind = giftKind(result.kind);
  const overlay = document.createElement("div");
  overlay.className = "gift-opening phase-burn";
  overlay.setAttribute("data-morph-keep", "");
  overlay.setAttribute("role", "status");
  overlay.innerHTML = `
    <div class="gift-opening-vessel">${giftVesselSvg(pack.key)}</div>
    <div class="gift-smoke s1"></div><div class="gift-smoke s2"></div><div class="gift-smoke s3"></div><div class="gift-smoke s4"></div>
    <div class="gift-reveal">
      <span class="gift-reveal-kind">${escapeHtml(kind?.label || "")}</span>
      <img class="gift-reveal-art${result.kind === "goetia" ? " demon" : ""}" src="${escapeAttr(result.image)}" alt="" draggable="false" />
      <span class="gift-reveal-name">${escapeHtml(result.name)}</span>
      <span class="gift-reveal-status${result.duplicate ? " dup" : ""}">${result.duplicate ? `Already yours · +${formatNumber(result.refund)}${KARMA_MARK}` : "Unlocked"}</span>
      <div class="gift-reveal-actions">
        <button type="button" class="collection-bind-button" data-gift-again${karmaBalance() >= pack.price ? "" : " disabled"}>Again · ${formatNumber(pack.price)}${KARMA_MARK}</button>
        <button type="button" class="collection-bind-button" data-gift-continue>Continue</button>
      </div>
    </div>`;
  (screen || document.body).appendChild(overlay);
  screen?.querySelectorAll(".collection-karma-line").forEach((line) => { line.outerHTML = collectionKarmaLine(); });
  giftOpening = { overlay, pack: pack.key, timers: [] };
  playGameSfx("introBurn");
  giftOpening.timers.push(setTimeout(() => overlay.classList.replace("phase-burn", "phase-smoke"), GIFT_OPEN_TIMING.burn));
  giftOpening.timers.push(setTimeout(() => {
    overlay.classList.replace("phase-smoke", "phase-reveal");
    playGameSfx(result.duplicate ? "sell" : "karmaUnlock");
  }, GIFT_OPEN_TIMING.burn + GIFT_OPEN_TIMING.smoke));
  overlay.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!overlay.classList.contains("phase-reveal")) return;
    if (event.target.closest("[data-gift-again]")) {
      const again = giftOpening?.pack;
      endGiftOpening(false);
      if (again) startGiftOpening(again);
      return;
    }
    if (event.target.closest("[data-gift-continue]")) endGiftOpening(true);
  });
}

function endGiftOpening(rerender) {
  if (!giftOpening) return;
  giftOpening.timers.forEach(clearTimeout);
  giftOpening.overlay.remove();
  giftOpening = null;
  if (rerender) render();
}

function bindGiftsEvents() {
  document.querySelectorAll("[data-gifts-back]").forEach((button) => bindOn(button, "click", () => closeGifts()));
  document.querySelectorAll("[data-gift-pick]").forEach((button) => {
    bindOn(button, "click", () => {
      if (giftOpening) return;
      state.giftsSelected = button.dataset.giftPick;
      render();
    });
  });
  document.querySelectorAll("[data-gift-open]").forEach((button) => {
    bindOn(button, "click", () => {
      if (button.disabled || giftOpening) return;
      startGiftOpening(state.giftsSelected || "myrrh");
    });
  });
}

// Esc: leaves the opening, then the screen
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !giftsOpen()) return;
  event.preventDefault();
  if (giftOpening) {
    if (giftOpening.overlay.classList.contains("phase-reveal")) endGiftOpening(true);
    return;
  }
  closeGifts();
});
