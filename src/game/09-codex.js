/* ---------- The Faustian Codex: Satan's deal, written down by those who lost ----------
   A book kept between runs (in the collection storage, progress.codex). It drops the first time Satan turns you
   away in a real arcade run: any refusal of his (gibberish, things he never gives, a SEAL he won't hand over) or
   your NO to his price. Then the Collection gets a fourth tab, "Codex", holding the cover and chapter I
   (CODEX_FIRST_PAGES). Every new kind of answer you get from him after that (an offer of a kind you never had, a
   refusal you never heard, signing, refusing; his reactions to tricks don't count) tears in the next page, in the
   order of CODEX_PAGES, so the pages on tricks come last. Answers heard before you own the book don't count later.
   Marginalia: the first time a trick works for you, the words you used are scribbled beside its verse (white); the
   red scribbles are the previous owner's (note). The tricks themselves are in 09-satan-pact.js (SATAN_TRICKS): they
   work whether you own the book or not; the book only hints at them.

   WHAT IT SAYS: CODEX_PAGES. Edit freely; pages are found in this order. In a paragraph, *words* are written in the
   red of the rubrics. A verse { trick, title, text } is where that trick's marginalia goes.
   Testing: Pause > DEV > Whole Codex (devWholeCodex in the collection storage) shows every page until turned off. */

const CODEX_PAGES = [
  {
    kind: "cover",
    title: "The Faustian Codex",
    text: "being a true and terrible account of how one bargains with the Adversary, set down by those who bargained and lost, for those who will.",
    small: "found in the ashes where your deal burned",
    note: "he will say he wrote none of this. he is lying. he wrote the cover."
  },
  {
    title: "I. Of the Calling",
    paras: [
      "There is a parchment that waits at the edge of every life, just beneath the place where you would rest. Touch it and He comes.",
      "He comes to the fat and the starving alike, but the starving He hears sooner. When your SOUL runs thin the parchment warms, and smoulders, and calls.",
      "He will hear you once in each life. Not twice. *Never twice.*",
      "Say what you want plainly. He has no patience for the riddles of the living, only for His own. If He does not understand you He laughs, and the laugh is free. If He names a price and you refuse it, the door is shut until you die again.",
      "Should He deny you a servant of His, do not plead. Go and kill something crowned. His moods follow the blood of BOSSES."
    ]
  },
  {
    title: "II. Of What May Be Asked",
    paras: [
      "*Whatever the hand can carry.* Name the instrument and He fetches it, up to four of a kind if your hands have room. Ask for five and He calls you greedy.",
      "*A breath of SOUL,* never more than the fingers of one hand.",
      "*The red coin,* as much as you like. Past a score of it, He takes the difference out of you.",
      "*The end of another at your table,* so long as it wears no crown.",
      "*More hands in a single round.* Two more at the most.",
      "*A second waking,* for the day you fall. The price of that one is named at the graveside, never before."
    ]
  },
  {
    title: "II. (continued)",
    paras: [
      "*A sigil you bear, burning brighter.* He decides which. He usually decides yours.",
      "*A demon of the seventy-two, on a leash,* but only when every chamber of your seals stands open, and only if the demon consents. Those you have already put down are more willing. Those still hunting you are, as He says, busy.",
      "*His tokens,* for the gambler's machine, once He has errands for you.",
      "*His own sigil,* for nothing at all, to one who stands before Him with every chamber open and every chamber empty."
    ]
  },
  {
    title: "III. Of What He Will Not Give",
    paras: [
      "Feathers. They were never His.",
      "The seals the Lamb breaks. The Old Man's toys upstairs. The pentacles Solomon used to chain His own.",
      "Anything the Nazarene hands out on the other side of the table.",
      "Ask if you must. Asking costs only breath, and breath is the one thing down here that is still free."
    ]
  },
  {
    title: "IV. Of the Price",
    paras: [
      "Every price He names is a coin with two faces, and the faces change each time you look: your SOUL, your SIN, the shutters on His Offerings, the strength of the next crowned thing that comes for you.",
      "He trims nothing for pity. Pity is not in His stock.",
      "Wear many sigils of one craft and ask for another of it, and you pay half again. He knows what you are building. He is not building it for you.",
      "A price in SOUL will never kill you. He prefers His debtors breathing."
    ]
  },
  {
    title: "V. Of Deceiving the Deceiver",
    paras: [
      "He is old, and proud, and bored. All three can be used. None of them can be trusted.",
      { trick: "silver", title: "The Silver Tongue", text: "He fell from very high and has never stopped thinking about it. Call Him by the light He carried before the fall, or by the crown He wears now, and His bill grows lighter. Grovel too low and He smells it." },
      { trick: "clerk", title: "The Clerk's Tongue", text: "He was a lawyer long before He was a fiend. Word your wish the way notaries do, dry and binding and witnessed, and sometimes a whole clause falls out of the price." },
      { trick: "latin", title: "The Stolen Tongue", text: "The Church's old language was His before they took it. Ask in it, and He remembers being begged by bishops." }
    ]
  },
  {
    title: "V. (continued)",
    paras: [
      { trick: "name", title: "The Name", text: "A name is a leash, and He has worn many. The one the Doctor used is the tightest. Speak it, and He must give you what you asked for, not what He would prefer. But a leash pulls both ways." },
      { trick: "blood", title: "The Ink", text: "Ink fades. Promise to sign in what runs through your veins and He will believe you, every time. Belief is not free, and it buys nothing He was going to give you anyway." }
    ],
    note: "the doctor = ? ask the old man in the 3rd circle"
  },
  {
    title: "VI. Of What Must Never Be Said",
    paras: [
      "Never let the Name of the Other cross your lips in His presence, nor His Son's, nor any word you learned in church. The price climbs before you finish the sentence.",
      "Do not offer Him your soul. He laughs at paupers who try to pay Him in His own coin.",
      "Do not say please. Courtesy is the currency of the living. Down here it is counterfeit.",
      "And never use too many tricks at once. One sweet word opens a lock. *Three is a confession.*"
    ]
  },
  {
    kind: "fragment",
    title: "The last page",
    paras: [
      "…the one who owned this book before you signed in blood, in the old tongue, by the Doctor's name, with a courtier's bow and a notary's care.",
      "*He is still paying.*"
    ],
    small: "(the rest of the page is burnt away)"
  }
];

// the cover's sigil, "The Horned Cross" (picked on the "DEARTH Codex Sigil" page; clean lines, red accents):
// a horned head on an inverted cross, an eye held in a crescent, Goetic circles at the ends; the pupil is blood red
const CODEX_SIGIL = `<svg class="codex-sigil" viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="60" cy="60" r="54" stroke-width="3.2"/><circle cx="60" cy="60" r="48" stroke-width="1.1"/>
  <circle cx="60" cy="34" r="5"/><path d="M60 39 V96"/>
  <path class="codex-sigil-solid" d="M55.5 32.5 C47 31 42 25 42 15 C46 23 50 25.5 56.5 27.5 Z"/>
  <path class="codex-sigil-solid" d="M64.5 32.5 C73 31 78 25 78 15 C74 23 70 25.5 63.5 27.5 Z"/>
  <path d="M46 80 H74"/><circle cx="42.5" cy="80" r="3"/><circle cx="77.5" cy="80" r="3"/><circle cx="60" cy="99.5" r="3"/>
  <path d="M34 50 Q60 74 86 50"/><circle cx="31" cy="48.5" r="2.6"/><circle cx="89" cy="48.5" r="2.6"/>
  <circle cx="60" cy="56" r="6"/><circle class="codex-sigil-eye" cx="60" cy="56" r="2"/>
  <path d="M26 72 l6 -2 M94 72 l-6 -2 M38 26 l4 4 M82 26 l-4 4" stroke-width="1.6"/></g></svg>`;

const CODEX_FIRST_PAGES = 2; // the cover and chapter I come with the book
const CODEX_TORN_TEXT = "This page has not been found yet.";

// the book's mark (toasts): a closed book with an inverted cross, drawn in the text colour
const CODEX_MARK = `<svg class="codex-mark" viewBox="0 0 30 34" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M4 3 H24 V31 H6 C4 31 3 30 3 28 V5 C3 4 3.5 3 4 3 Z"/><path d="M7 3 V31"/><path d="M15 9 V22 M11 18 H19"/><path d="M24 31 L27 33 V5 L24 3"/></g></svg>`;

/* ---- the book's state (lifetime) ---- */
function codexFresh() {
  return { owned: false, pages: 0, read: 0, seen: [], margins: {} };
}

// a saved book, cleaned (loadCollectionProgress)
function normalizeCodex(saved) {
  const codex = codexFresh();
  if (!saved || typeof saved !== "object") return codex;
  codex.owned = saved.owned === true;
  codex.pages = Math.max(0, Math.min(CODEX_PAGES.length, Math.floor(Number(saved.pages) || 0)));
  codex.read = Math.max(0, Math.min(CODEX_PAGES.length, Math.floor(Number(saved.read) || 0)));
  if (Array.isArray(saved.seen)) codex.seen = saved.seen.filter((key) => typeof key === "string").slice(0, 200);
  if (saved.margins && typeof saved.margins === "object") {
    Object.entries(saved.margins).forEach(([id, word]) => {
      if (typeof word === "string" && word) codex.margins[id] = word.slice(0, 40);
    });
  }
  return codex;
}

function codexState() {
  const progress = loadCollectionProgress();
  if (!progress.codex || typeof progress.codex !== "object") progress.codex = codexFresh();
  return progress.codex;
}

function codexDevWhole() {
  // the playtest build (demo.html) has no DEV panel, so the flag left on in index.html counts as off
  return !PLAYTEST_BUILD && loadCollectionProgress().devWholeCodex === true;
}

function toggleDevWholeCodex() {
  if (PLAYTEST_BUILD) return false;
  const progress = loadCollectionProgress();
  progress.devWholeCodex = !progress.devWholeCodex;
  saveCollectionProgress();
  return progress.devWholeCodex;
}

function codexOwned() {
  return codexDevWhole() || codexState().owned;
}

function codexPagesFound() {
  return codexDevWhole() ? CODEX_PAGES.length : Math.min(CODEX_PAGES.length, codexState().owned ? codexState().pages : 0);
}

function codexHasUnread() {
  return !codexDevWhole() && codexState().owned && codexPagesFound() > (codexState().read || 0);
}

function codexPageTitle(index) {
  const page = CODEX_PAGES[index];
  return page?.title || "";
}

/* ---- what Satan's deal tells the book (09-satan-pact.js) ---- */
// keys: the kinds of answer he just gave (SATAN_DEAL_LINES keys); turnedAway: he refused you or you said NO
function codexNoteResponses(keys, turnedAway) {
  if (!collectionCounts()) return;
  const codex = codexState();
  const fresh = (keys || []).filter((key) => typeof key === "string" && key && !codex.seen.includes(key));
  fresh.forEach((key) => codex.seen.push(key));
  if (!codex.owned) {
    if (turnedAway) codexObtain();
  } else {
    fresh.forEach(() => codexTearPage());
  }
  saveCollectionProgress();
}

function codexObtain() {
  const codex = codexState();
  if (codex.owned) return;
  codex.owned = true;
  codex.pages = Math.max(codex.pages, CODEX_FIRST_PAGES);
  addLog("Something was left in the ashes: the Faustian Codex. It is in your Collection.");
  collectionToastQueue.push({ kind: "codex", first: true });
  showNextCollectionToast();
}

function codexTearPage() {
  const codex = codexState();
  if (codex.pages >= CODEX_PAGES.length) return;
  codex.pages += 1;
  const title = codexPageTitle(codex.pages - 1);
  addLog(`A page of the Faustian Codex: ${title}.`);
  collectionToastQueue.push({ kind: "codex", title });
  showNextCollectionToast();
}

// a trick worked for the first time: its words go in the margin (kept even before the book is found)
function codexNoteTrick(id, word) {
  if (!collectionCounts() || !id || !word) return;
  const codex = codexState();
  if (codex.margins[id]) return;
  codex.margins[id] = String(word).slice(0, 40);
  saveCollectionProgress();
}

/* ---- the Codex tab in the Collection (09-collection.js) ---- */
let codexPageIndex = 0; // the first page of the spread on show

// two pages side by side on a wide screen, one on the phone
function codexPerView() {
  if (typeof window === "undefined" || typeof document === "undefined" || !document.body) return 2;
  const phone = document.body.classList.contains("native-arcade") || document.body.classList.contains("mobile-arcade");
  return !phone && window.innerWidth >= 900 ? 2 : 1;
}

function codexAlign(index, per = codexPerView()) {
  const clamped = Math.max(0, Math.min(CODEX_PAGES.length - 1, index));
  return clamped - (clamped % per);
}

// the Codex tab opens on the first page you haven't read yet
function codexOpenAtUnread() {
  const read = codexDevWhole() ? 0 : codexState().read || 0;
  codexPageIndex = codexAlign(codexHasUnread() ? read : codexPageIndex);
}

function codexMarkRead() {
  if (codexDevWhole() || !codexState().owned) return;
  const codex = codexState();
  const shown = Math.min(codexPagesFound(), codexPageIndex + codexPerView());
  if (shown > (codex.read || 0)) {
    codex.read = shown;
    saveCollectionProgress();
  }
}

function codexRich(text) {
  return escapeHtml(text).replace(/\*(.+?)\*/g, '<span class="codex-rub">$1</span>');
}

function codexRoman(n) {
  const table = [[10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let out = "";
  let left = n;
  table.forEach(([value, mark]) => {
    while (left >= value) {
      out += mark;
      left -= value;
    }
  });
  return out;
}

function codexLeafHtml(index) {
  const page = CODEX_PAGES[index];
  if (!page) return `<article class="codex-leaf codex-empty" aria-hidden="true"></article>`;
  const folio = index === 0 ? "" : `<span class="codex-folio-num">${codexRoman(index + 1)}</span>`;
  if (index >= codexPagesFound()) {
    return `<article class="codex-leaf codex-torn"><div class="codex-scrap" aria-hidden="true"></div><p class="codex-torn-text">${escapeHtml(CODEX_TORN_TEXT)}</p>${folio}</article>`;
  }
  const note = page.note ? `<p class="codex-note">${escapeHtml(page.note)}</p>` : "";
  if (page.kind === "cover") {
    return `
      <article class="codex-leaf codex-cover">
        ${CODEX_SIGIL}
        <h3 class="codex-cover-title">${escapeHtml(page.title)}</h3>
        <p class="codex-cover-text">${escapeHtml(page.text)}</p>
        <p class="codex-small">${escapeHtml(page.small)}</p>
        ${note}
      </article>`;
  }
  const margins = codexState().margins || {};
  const paras = (page.paras || [])
    .map((para) => {
      if (typeof para === "string") return `<p class="codex-p">${codexRich(para)}</p>`;
      const word = margins[para.trick];
      const scribble = word ? `<span class="codex-scribble">“${escapeHtml(word)}” ✓</span>` : "";
      return `<div class="codex-verse">${scribble}<h4 class="codex-verse-title">${escapeHtml(para.title)}</h4><p class="codex-p">${codexRich(para.text)}</p></div>`;
    })
    .join("");
  const small = page.small ? `<p class="codex-small">${escapeHtml(page.small)}</p>` : "";
  if (page.kind === "fragment") {
    return `<article class="codex-leaf codex-fragment"><div class="codex-fragment-text">${paras}${small}</div>${folio}</article>`;
  }
  return `<article class="codex-leaf"><h3 class="codex-title">${escapeHtml(page.title)}</h3><div class="codex-text">${paras}</div>${note}${folio}</article>`;
}

function codexBookHtml() {
  const per = codexPerView();
  codexPageIndex = codexAlign(codexPageIndex, per);
  const last = Math.min(CODEX_PAGES.length, codexPageIndex + per);
  const folio = per === 2 && last - codexPageIndex === 2 ? `${codexPageIndex + 1}–${last}` : `${codexPageIndex + 1}`;
  const leaves = [];
  for (let i = codexPageIndex; i < codexPageIndex + per; i += 1) leaves.push(codexLeafHtml(i));
  return `
    <div class="codex-book" style="--codex-per: ${per}">
      <div class="codex-spread">${leaves.join("")}</div>
      <nav class="codex-nav" aria-label="Pages">
        <button type="button" class="codex-turn" data-codex-turn="-1"${codexPageIndex <= 0 ? " disabled" : ""}>Previous</button>
        <span class="codex-folio">${per === 2 ? "pages" : "page"} ${folio} of ${CODEX_PAGES.length}</span>
        <button type="button" class="codex-turn" data-codex-turn="1"${last >= CODEX_PAGES.length ? " disabled" : ""}>Next</button>
      </nav>
    </div>`;
}

// the panel's legend row: the KARMA counter as on every tab, and the DEV switch
function codexLegendHtml() {
  const on = codexDevWhole();
  return `
    <div class="collection-legend codex-legend">
      ${collectionKarmaLine()}
      ${PLAYTEST_BUILD ? "" : `<button type="button" class="collection-dev-button${on ? " active" : ""}" data-collection-dev-codex data-tooltip="Testing: every page of the Codex shows, found or not">${on ? "DEV: whole Codex" : "DEV: found pages"}</button>`}
    </div>`;
}

function codexCountsHtml() {
  return `<span><strong>${codexPagesFound()}</strong> / ${CODEX_PAGES.length} pages</span>`;
}

// turns the pages in place (no full render, so the screen doesn't play its entrance again)
function codexTurn(screen, dir) {
  const per = codexPerView();
  const next = codexAlign(codexPageIndex + dir * per, per);
  if (next === codexPageIndex) return;
  codexPageIndex = next;
  codexRefresh(screen);
  playGameSfx("codexPage");
}

function codexRefresh(screen) {
  const body = screen?.querySelector('[data-collection-panel="codex"] .collection-body');
  if (body) {
    body.innerHTML = codexBookHtml();
    body.scrollTop = 0;
  }
  codexMarkRead();
  const tab = screen?.querySelector('[data-collection-tab="codex"]');
  if (tab) tab.classList.toggle("has-new", codexHasUnread());
  bindCodexEvents(screen);
}

function bindCodexEvents(screen) {
  const panel = screen?.querySelector('[data-collection-panel="codex"]');
  if (!panel) return;
  bindOn(panel, "click", (event) => {
    const turn = event.target.closest?.("[data-codex-turn]");
    if (turn && !turn.disabled) {
      event.stopPropagation();
      codexTurn(screen, Number(turn.dataset.codexTurn) || 1);
      return;
    }
    const dev = event.target.closest?.("[data-collection-dev-codex]");
    if (dev) {
      event.stopPropagation();
      const on = toggleDevWholeCodex();
      dev.classList.toggle("active", on);
      dev.textContent = on ? "DEV: whole Codex" : "DEV: found pages";
      const count = screen.querySelector('[data-collection-for="codex"] strong');
      if (count) count.textContent = String(codexPagesFound());
      codexRefresh(screen);
    }
  });
}

// ← → turn the pages while the Codex tab is open
document.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key) || typeof collectionOpen !== "function" || !collectionOpen()) return;
  if (collectionTab !== "codex" || event.target?.closest?.("input, textarea")) return;
  const screen = document.querySelector(".collection-screen");
  if (!screen) return;
  event.preventDefault();
  codexTurn(screen, event.key === "ArrowRight" ? 1 : -1);
});
