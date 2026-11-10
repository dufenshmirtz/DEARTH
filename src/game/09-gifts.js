"use strict";

/* ---------- Jesus' Gifts: KARMA packs ----------
   Main menu: click Jesus (or Options > Jesus' Gifts). Three gifts, each opens into one unlockable by its
   own odds (GIFT_PACKS, in %; a pack's odds are weights, so they need not add up to exactly 100):
     a kind is drawn by the odds, then one item of that kind at random. Ars Goetia: any of the 72 demons
     (it then counts as defeated in the Collection and can be bound); the other kinds are SEALS by
     Collection section (GIFT_KINDS).
   Owned (a defeated demon, an unlocked or never-locked SEAL): a duplicate, half the price back.
   The Planetary Seals, the Trinity and Anael are locked from the start and only gifts unlock them
   (GIFT_ONLY_SEAL_IDS in 09-collection.js); the other locked SEALS can also still be earned by their
   achievement. Opening: a face-down card rises out of the vessel and turns over (see startGiftOpening). */
const GIFT_PACKS = [
  { key: "myrrh", name: "Myrrh", price: 44, odds: { goetia: 57, planet: 25, archangel: 10, boss: 4, apocalypse: 2.001, trinity: 1.333, satan: 0.666 } },
  { key: "frankincense", name: "Frankincense", price: 88, odds: { goetia: 36, planet: 35, archangel: 15, boss: 8, apocalypse: 4.001, trinity: 1.333, satan: 0.666 } },
  { key: "gold", name: "Gold", price: 166, odds: { goetia: 5, planet: 40, archangel: 25, boss: 18, apocalypse: 10, trinity: 1.333, satan: 0.666 } }
];
// heat: how red the opening is for this kind, 0 (bone white) to 1 (blood red): the rarer, the redder
const GIFT_KINDS = [
  { key: "goetia", label: "Ars Goetia demon", heat: 0 },
  { key: "planet", label: "Planetary Seal", sections: ["saturn", "artifact", "poison"], heat: 0.12 },
  { key: "archangel", label: "Archangel Seal", sections: ["archangel"], heat: 0.3 },
  { key: "boss", label: "Boss Seal", sections: ["bosses"], heat: 0.5 },
  { key: "apocalypse", label: "Apocalypse Seal", sections: ["apocalypse"], heat: 0.7 },
  { key: "trinity", label: "Trinity Seal", sections: ["trinity"], heat: 0.85 },
  { key: "satan", label: "Seal of Satan", sections: ["satan"], heat: 1 }
];
const GIFT_HEAT_COLD = [233, 227, 214]; // bone white
const GIFT_HEAT_HOT = [220, 42, 47]; // the game's red

// the opening's colours for a kind: CSS custom properties, "r, g, b" so rgba() can use them
function giftHeatStyle(kindKey) {
  const heat = Math.max(0, Math.min(1, Number(giftKind(kindKey)?.heat) || 0));
  const mix = (amount) => GIFT_HEAT_COLD.map((cold, i) => Math.round(cold + (GIFT_HEAT_HOT[i] - cold) * amount)).join(", ");
  return `--heat: ${heat}; --heat-rgb: ${mix(heat)}; --heat-text-rgb: ${mix(Math.max(0, (heat - 0.4) / 0.6))}`;
}
const GIFT_REFUND_SHARE = 0.5;
const GIFT_RARE_ODDS = 5; // odds under this show in red
// ms: the gift's own card turns face down, travels to the centre, holds (one extra pulse per rarity step), then turns over
const GIFT_OPEN_TIMING = { turn: 440, move: 560, hold: 300, beat: 380, flip: 440 };

// rarer gifts hold longer: Ars Goetia and Planetary none, up to 3 extra pulses for Trinity and Satan
function giftOpenBeats(kindKey) {
  return Math.round(Math.max(0, Math.min(1, Number(giftKind(kindKey)?.heat) || 0)) * 3);
}

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
  if (!karmaCanPay(pack.price)) return { error: "karma" };
  const progress = loadCollectionProgress();
  // DEV infinite KARMA: free, and the real balance is left alone
  const free = karmaInfinite();
  if (!free) progress.karma = karmaBalance() - pack.price;
  const { kind, item } = rollGift(pack);
  const duplicate = giftAlreadyOwned(kind, item);
  const refund = duplicate ? giftRefund(pack) : 0;
  if (duplicate && !free) progress.karma += refund;
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
  render();
}

// redraw just the Gifts screen: a full menu render rebuilds the page and would fade the screen in again
function refreshGiftsScreen() {
  const screen = document.querySelector(".gifts-screen");
  if (!screen || !giftsOpen()) {
    render();
    return;
  }
  const holder = document.createElement("div");
  holder.innerHTML = renderGiftsScreen().trim();
  const next = holder.firstElementChild;
  next.classList.add("settled");
  screen.replaceWith(next);
  bindGiftsEvents();
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
    return `<span class="gift-odds-row${odds < GIFT_RARE_ODDS ? " rare" : ""}"><img src="${escapeAttr(giftKindIcon(kind.key))}" alt="" draggable="false" /><span>${escapeHtml(kind.label)}</span><b>${text}%</b></span>`;
  }).join("");
  return `<span class="gift-odds">${rows}</span>`;
}

// three framed cards beside Jesus: the gift, its price and all its odds in view; click a card to open it
function renderGiftsScreen() {
  const balance = karmaBalance();
  const infinite = karmaInfinite();
  const cards = GIFT_PACKS.map((pack) => {
    const can = karmaCanPay(pack.price);
    return `
      <button type="button" class="gift-card gift-${pack.key}${can ? "" : " cant"}" data-gift-open="${pack.key}" aria-label="Open ${escapeAttr(pack.name)} for ${pack.price} KARMA"${can ? "" : ' aria-disabled="true"'}>
        <span class="gift-card-art">${giftVesselSvg(pack.key)}</span>
        <span class="gift-name">${escapeHtml(pack.name)}</span>
        <span class="gift-price${can ? "" : " cant"}">${formatNumber(pack.price)}${KARMA_MARK}</span>
        ${giftOddsHtml(pack)}
        ${can ? "" : `<span class="gift-card-open">You need ${formatNumber(pack.price - balance)}${KARMA_MARK} more</span>`}
      </button>`;
  }).join("");
  return `
    <div class="gifts-screen" role="dialog" aria-label="Jesus' Gifts">
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="giftRough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></defs></svg>
      <img class="gifts-jesus" src="assets/ui/jesus.png" alt="" draggable="false" />
      <button class="collection-back gifts-back" type="button" data-gifts-back>Back</button>
      <h1 class="gifts-title">Jesus' Gifts</h1>
      <div class="gifts-karma">${collectionKarmaLine()}<button type="button" class="collection-dev-button gifts-dev${infinite ? " active" : ""}" data-gifts-dev-karma data-tooltip="Testing: KARMA never runs out and gifts cost nothing; off again shows your real KARMA">${infinite ? "DEV: ∞ Karma on" : "DEV: ∞ Karma"}</button></div>
      <div class="gifts-cards">${cards}</div>
    </div>`;
}

/* ---- opening: the gift's card turns face down (a cross on its back), travels to the centre,
   holds, and turns over to show the drop ----
   Red from the start for rare drops (the cross and the frame take the kind's heat), and rarer
   drops hold longer. The moving card is position: fixed and placed in px from the clicked card
   to a hidden slot in the centre. Lives outside the render cycle (data-morph-keep). */
let giftOpening = null;

const GIFT_CARD_CROSS = '<svg class="gift-back-cross" viewBox="0 0 60 90" aria-hidden="true"><g filter="url(#giftRough)" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M30 8v74M12 30h36"/></g></svg>';

function placeGiftCard(card, rect) {
  if (!card || !rect) return;
  card.style.left = `${rect.left}px`;
  card.style.top = `${rect.top}px`;
  card.style.width = `${rect.width}px`;
  card.style.height = `${rect.height}px`;
}

function startGiftOpening(packKey) {
  if (giftOpening) return;
  const screen = document.querySelector(".gifts-screen");
  const result = openGift(packKey);
  if (result.error) {
    screen?.querySelectorAll(".gift-opening").forEach((leftover) => leftover.remove());
    return;
  }
  const pack = giftPack(packKey);
  const kind = giftKind(result.kind);
  const beats = giftOpenBeats(result.kind);
  const source = screen?.querySelector(`.gift-card[data-gift-open="${pack.key}"]`);
  const again = Boolean(screen?.querySelector(".gift-opening"));
  const overlay = document.createElement("div");
  overlay.className = `gift-opening${again ? " again" : ""}`;
  overlay.setAttribute("style", `${giftHeatStyle(result.kind)}; --beats: ${beats}; --beat: ${GIFT_OPEN_TIMING.beat}ms`);
  overlay.setAttribute("data-morph-keep", "");
  overlay.setAttribute("role", "status");
  overlay.innerHTML = `
    <div class="gift-flip">
      <div class="gift-flip-slot"></div>
      <div class="gift-reveal-actions">
        <button type="button" class="collection-bind-button" data-gift-again${karmaCanPay(pack.price) ? "" : " disabled"}>Again · ${formatNumber(pack.price)}${KARMA_MARK}</button>
        <button type="button" class="collection-bind-button" data-gift-continue>Continue</button>
      </div>
    </div>
    <div class="gift-flip-card">
      <div class="gift-face gift-shop-face"></div>
      <div class="gift-face gift-back">${GIFT_CARD_CROSS}</div>
      <div class="gift-face gift-front">
        <span class="gift-reveal-kind">${escapeHtml(kind?.label || "")}</span>
        <img class="gift-reveal-art${result.kind === "goetia" ? " demon" : ""}" src="${escapeAttr(result.image)}" alt="" draggable="false" />
        <span class="gift-reveal-name">${escapeHtml(result.name)}</span>
        <span class="gift-reveal-status${result.duplicate ? " dup" : ""}">${result.duplicate ? `Owned · +${formatNumber(result.refund)}${KARMA_MARK}` : "Unlocked"}</span>
      </div>
    </div>`;
  // Again: the new opening takes over from the old one without fading the screen in again
  screen?.querySelectorAll(".gift-opening").forEach((old) => old.remove());
  (screen || document.body).appendChild(overlay);
  screen?.querySelectorAll(".collection-karma-line").forEach((line) => { line.outerHTML = collectionKarmaLine(); });
  const card = overlay.querySelector(".gift-flip-card");
  const slot = overlay.querySelector(".gift-flip-slot");
  const toCentre = () => placeGiftCard(card, slot.getBoundingClientRect());
  const onResize = () => { if (!overlay.classList.contains("phase-turn")) toCentre(); };
  window.addEventListener("resize", onResize);
  giftOpening = { overlay, pack: pack.key, timers: [], source, onResize };
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const set = (phase) => {
    overlay.classList.remove("phase-turn", "phase-move", "phase-hold", "phase-flip", "phase-reveal");
    overlay.classList.add(phase);
  };
  const reveal = () => {
    set("phase-reveal");
    playGameSfx(result.duplicate ? "sell" : "karmaUnlock");
  };
  const at = (ms, fn) => giftOpening.timers.push(setTimeout(fn, ms));
  const hold = GIFT_OPEN_TIMING.hold + beats * GIFT_OPEN_TIMING.beat;
  if (reduced) {
    toCentre();
    reveal();
  } else if (source) {
    // the card you clicked turns over where it stands, then travels to the centre
    const clone = source.cloneNode(true);
    clone.removeAttribute("data-gift-open");
    clone.setAttribute("tabindex", "-1");
    clone.setAttribute("aria-hidden", "true");
    overlay.querySelector(".gift-shop-face").appendChild(clone);
    placeGiftCard(card, source.getBoundingClientRect());
    source.classList.add("gift-card-away");
    set("phase-turn");
    playGameSfx("introBurn");
    at(GIFT_OPEN_TIMING.turn, () => { set("phase-move"); toCentre(); });
    at(GIFT_OPEN_TIMING.turn + GIFT_OPEN_TIMING.move, () => set("phase-hold"));
    at(GIFT_OPEN_TIMING.turn + GIFT_OPEN_TIMING.move + hold, () => set("phase-flip"));
    at(GIFT_OPEN_TIMING.turn + GIFT_OPEN_TIMING.move + hold + GIFT_OPEN_TIMING.flip, reveal);
  } else {
    toCentre();
    set("phase-hold");
    playGameSfx("introBurn");
    at(hold, () => set("phase-flip"));
    at(hold + GIFT_OPEN_TIMING.flip, reveal);
  }
  overlay.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!overlay.classList.contains("phase-reveal")) return;
    if (event.target.closest("[data-gift-again]")) {
      const next = giftOpening?.pack;
      endGiftOpening(false, true);
      if (next) startGiftOpening(next);
      return;
    }
    if (event.target.closest("[data-gift-continue]")) endGiftOpening(true);
  });
}

// keepOverlay: Again leaves the dark overlay up until the next opening replaces it
function endGiftOpening(rerender, keepOverlay = false) {
  if (!giftOpening) return;
  giftOpening.timers.forEach(clearTimeout);
  window.removeEventListener("resize", giftOpening.onResize);
  giftOpening.source?.classList.remove("gift-card-away");
  if (!keepOverlay) giftOpening.overlay.remove();
  giftOpening = null;
  if (rerender) refreshGiftsScreen();
}

function bindGiftsEvents() {
  document.querySelectorAll("[data-gifts-back]").forEach((button) => bindOn(button, "click", () => closeGifts()));
  document.querySelectorAll("[data-gift-open]").forEach((button) => {
    bindOn(button, "click", () => {
      if (giftOpening || !karmaCanPay(giftPack(button.dataset.giftOpen)?.price ?? Infinity)) return;
      startGiftOpening(button.dataset.giftOpen);
    });
  });
  document.querySelectorAll("[data-gifts-dev-karma]").forEach((button) => {
    bindOn(button, "click", () => {
      if (giftOpening) return;
      toggleDevInfiniteKarma();
      refreshGiftsScreen();
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
