/* ---------- In-place screen updates ----------
   During a run the screen is patched instead of rebuilt: elements that did not
   change stay in the page (no image re-decode, no layout from scratch, running
   animations keep running). An element whose inline style changed is swapped
   for a fresh one, because inline styles carry the animation timing
   (hudPopAttrs, hitShakeAttrs, sealSummonAttrs) and those rely on a new element. */
const MORPH_LIVE_STYLE = /--ring-[a-z]+\s*:\s*[^;]*;?/g;
let lastRenderedMode = null;

function bindOn(element, type, handler, options) {
  const store = element.__dearthHandlers || (element.__dearthHandlers = {});
  if (store[type]) element.removeEventListener(type, store[type]);
  store[type] = handler;
  element.addEventListener(type, handler, options);
}

function morphStyleKey(element) {
  return (element.getAttribute("style") || "").replace(MORPH_LIVE_STYLE, "").replace(/\s+/g, "");
}

function morphSameNode(current, next) {
  if (current.nodeType !== next.nodeType) return false;
  if (current.nodeType !== 1) return true;
  if (current.nodeName !== next.nodeName) return false;
  if ((current.getAttribute("id") || "") !== (next.getAttribute("id") || "")) return false;
  if (current.getAttribute("data-morph-key") !== next.getAttribute("data-morph-key")) return false;
  if (morphStyleKey(current) !== morphStyleKey(next)) return false;
  if (current.nodeName === "IMG" && current.getAttribute("src") !== next.getAttribute("src")) return false;
  return true;
}

function morphAttributes(current, next) {
  const liveStyle = (current.getAttribute("style") || "").match(MORPH_LIVE_STYLE);
  for (const attr of Array.from(current.attributes)) {
    if (attr.name === "style") continue;
    if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
  }
  for (const attr of Array.from(next.attributes)) {
    if (attr.name === "style") continue;
    if (current.getAttribute(attr.name) !== attr.value) {
      if (current.nodeName === "INPUT" && attr.name === "value") current.value = attr.value;
      current.setAttribute(attr.name, attr.value);
    }
  }
  if (!liveStyle && !next.hasAttribute("style") && current.hasAttribute("style")) current.removeAttribute("style");
  if (current.nodeName === "INPUT") {
    if (!next.hasAttribute("value") && current.type !== "checkbox" && current.type !== "range" && current.value && document.activeElement !== current) current.value = "";
    if (current.type === "checkbox") current.checked = next.hasAttribute("checked");
    if (current.type === "range" && next.hasAttribute("value")) current.value = next.getAttribute("value");
  }
}

function morphNode(current, next) {
  if (current.nodeType !== 1) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }
  morphAttributes(current, next);
  morphChildren(current, next);
}

// nodes that live outside the render cycle (the moment cards): renders never touch or rebuild them
function isMorphKept(node) {
  return node?.nodeType === 1 && node.hasAttribute("data-morph-keep");
}

function morphChildren(current, next) {
  let a = current.firstChild;
  let b = next.firstChild;
  while (b) {
    const nextB = b.nextSibling;
    while (isMorphKept(a)) a = a.nextSibling;
    if (!a) {
      current.appendChild(b);
    } else if (morphSameNode(a, b)) {
      morphNode(a, b);
      a = a.nextSibling;
    } else {
      const nextA = a.nextSibling;
      current.replaceChild(b, a);
      a = nextA;
    }
    b = nextB;
  }
  while (a) {
    const nextA = a.nextSibling;
    if (!isMorphKept(a)) current.removeChild(a);
    a = nextA;
  }
}

function patchAppHtml(app, html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  morphChildren(app, template.content);
}

function render() {
  introGuardMode();
  updateFullscreenLayoutClass();
  const app = document.querySelector("#app");
  const className = `app ${state.mode === "pvp" ? "pvp-app" : ""} ${state.mode === "menu" ? "menu-app" : ""}`;
  const html = state.mode === "menu" ? renderMenuApp() : state.mode === "pvp" ? renderPvpApp() : renderArcadeApp();
  const canPatch = window.dearthDomMorph !== false && state.mode === "arcade" && lastRenderedMode === "arcade" && app.className === className && app.firstElementChild;
  if (app.className !== className) app.className = className;
  if (canPatch) patchAppHtml(app, html);
  else {
    app.innerHTML = html;
    // a full rebuild wipes the moment card; put a running one back
    if (state.mode === "arcade" && activeMoment && activeMoment.until > performance.now()) app.insertAdjacentHTML("beforeend", renderMoment());
  }
  lastRenderedMode = state.mode;
  bindEvents();
  afterRenderEffects();
  if (state.mode === "menu") initMenuBackdrop();
  focusGuessInputAfterRender();
  saveArcadeRun();
}

function focusGuessInputAfterRender() {
  if (!state.shouldFocusGuessInput) return;
  if (state.mode !== "arcade" || state.stage !== "guess" || state.pauseOpen || state.gameOver || state.pendingActive || state.mobileOfferingsOpen) return;
  const input = document.querySelector("#guessInput");
  if (!input || input.disabled || input.readOnly) {
    state.shouldFocusGuessInput = false;
    return;
  }
  const focus = () => {
    if (document.activeElement === input) {
      state.shouldFocusGuessInput = false;
      return;
    }
    input.focus({ preventScroll: true });
    input.select();
    state.shouldFocusGuessInput = false;
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(focus);
  } else {
    focus();
  }
}

function renderMenuApp() {
  const screen = state.menuScreen || "main";
  return `
    <main class="main-menu" aria-label="main menu">
      ${menuBackdropState.node ? `<div class="menu-backdrop-slot"></div>` : renderMenuBackdrop()}
      <section class="main-menu-panel menu-screen-${escapeAttr(screen)}">
        ${
          screen === "play"
            ? renderPlayMenu()
            : screen === "arcade-options"
              ? renderArcadeOptionsMenu()
            : screen === "arcade-runs"
              ? renderArcadeRunsMenu()
            : screen === "options"
              ? renderOptionsMenu()
              : screen === "sound"
                ? renderSoundOptionsMenu()
                : screen === "records"
                  ? renderRecordsMenu()
                  : screen === "quit"
                    ? renderQuitMenu()
                    : renderMainMenu()
        }
      </section>
    </main>
    ${renderMobileMenuSettingsOverlay()}
    ${screen === "main" ? `<div class="menu-version">v${escapeHtml(GAME_VERSION)} &middot; early build</div>` : ""}
    ${state.menuCollectionOpen ? renderCollectionScreen("menu") : ""}
    <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
  `;
}

function renderMainMenu() {
  return `
    <div class="main-menu-actions">
      <button class="menu-button" data-menu-action="play">Play</button>
      <button class="menu-button" data-menu-action="options">Options</button>
      <button class="menu-button" data-menu-action="quit">Quit</button>
    </div>
  `;
}

function formatRunStartedAt(timestamp) {
  const date = new Date(Number(timestamp) || Date.now());
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderPlayMenu() {
  return `
    <div class="main-menu-actions">
      <button class="menu-button" data-menu-action="arcade">Arcade</button>
      ${isNativeArcadeApp() ? "" : `<button class="menu-button" data-menu-action="pvp">PvP</button>`}
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
    </div>
  `;
}

function renderArcadeOptionsMenu() {
  const primaryButton = hasSavedArcadeRun()
    ? `<button class="menu-button" data-menu-action="continue-arcade">Continue</button>`
    : `<button class="menu-button" data-new-run="arcade-options">New Run</button>`;
  return `
    <div class="main-menu-actions">
      ${primaryButton}
      <button class="menu-button" data-menu-action="load-run">Load Run</button>
      <button class="menu-button secondary-menu-button" data-menu-action="${isNativeArcadeApp() ? "back" : "play"}">Back</button>
    </div>
  `;
}

function renderArcadeRunsMenu() {
  const savedSlots = readArcadeRunSlots();
  const emptyCount = Math.max(0, ARCADE_RUN_SLOT_COUNT - savedSlots.length);
  const pendingDeleteSlot = savedSlots.find((slot) => slot.slotId === state.pendingRunDeleteSlotId);
  const savedRows = savedSlots
    .map(
      (slot) => `
        <article class="run-slot-row">
          <button class="run-slot-button saved-run-slot" data-run-slot-id="${escapeAttr(slot.slotId)}">
            <span class="run-slot-label">Continue Run</span>
            <span class="run-slot-date">${escapeHtml(formatRunStartedAt(slot.startedAt))}</span>
          </button>
          <button
            class="run-remove-button"
            data-remove-run-slot-id="${escapeAttr(slot.slotId)}"
            data-tooltip="REMOVE RUN"
            aria-label="Remove run"
          >X</button>
        </article>
      `
    )
    .join("");
  const emptyRows = Array.from({ length: emptyCount }, (_, index) => {
    return `
      <button class="run-slot-button empty-run-slot" data-new-run="${index}">
        <span class="run-slot-label">New Run</span>
      </button>
    `;
  }).join("");
  return `
    <div class="run-menu">
      <div class="run-slot-list" aria-label="Saved runs">
        ${savedRows}${emptyRows}
      </div>
      ${
        pendingDeleteSlot
          ? `
            <div class="run-remove-confirm">
              <div>Are You Sure You Want To Remove This Run?</div>
              <div class="run-remove-confirm-date">${escapeHtml(formatRunStartedAt(pendingDeleteSlot.startedAt))}</div>
              <div class="run-remove-confirm-actions">
                <button class="small-button" data-confirm-remove-run="${escapeAttr(pendingDeleteSlot.slotId)}">Yes</button>
                <button class="small-button" data-cancel-remove-run>No</button>
              </div>
            </div>
          `
          : ""
      }
      <button class="menu-button secondary-menu-button" data-menu-action="arcade">Back</button>
    </div>
  `;
}

function renderOptionsMenu() {
  return `
    <div class="main-menu-actions">
      <button class="menu-button" data-menu-action="sound-options">Settings</button>
      <button class="menu-button" data-menu-action="records">Records</button>
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
    </div>
  `;
}

// phone: Settings opens as the same framed card as Pause > Settings, over the menu art
// (rendered outside the menu panel so it can cover the screen)
function renderMobileMenuSettingsOverlay() {
  if (state.menuScreen !== "sound" || !isMobileArcadeView()) return "";
  {
    return `
    <div class="overlay visible pause-overlay menu-settings-overlay">
      <section class="end-card pause-card pause-settings-card">
        <h1 class="end-title">Settings</h1>
        <div class="pause-sound-settings">${renderSettingsPanel("menu")}</div>
        <div class="pause-actions pause-back-row">
          <button class="primary-button" data-menu-action="options">Back</button>
        </div>
      </section>
    </div>
  `;
  }
}

function renderSoundOptionsMenu() {
  if (isMobileArcadeView()) return "";
  return `
    <div class="options-menu">
      ${renderSettingsPanel("menu")}
      <button class="menu-button secondary-menu-button" data-menu-action="options">Back</button>
    </div>
  `;
}

function recordValueText(record, { withName = false, prefix = "" } = {}) {
  const value = Math.max(0, Math.ceil(Number(record?.value) || 0));
  if (value <= 0) return "None";
  const label = withName && record?.name ? ` - ${record.name}` : "";
  return `${prefix}${formatNumber(value)}${label}`;
}

function renderRecordRow(label, value) {
  return `
    <div class="record-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderRecordsMenu() {
  const records = loadArcadeRecords();
  const rows = [
    renderRecordRow("Most Eliminations", recordValueText(records.mostEliminations)),
    renderRecordRow("Most Boss Eliminations", recordValueText(records.mostBossEliminations)),
    renderRecordRow("Most Overall Damage", recordValueText(records.mostOverallDamage)),
    renderRecordRow("Most Single Round Damage", recordValueText(records.mostSingleRoundDamage)),
    renderRecordRow("Highest Round Reached", recordValueText(records.highestRoundReached)),
    renderRecordRow("Most Pentakills In A Single Run", recordValueText(records.mostPentakills)),
    renderRecordRow("Most Overall Damage By One Seal", recordValueText(records.mostOverallSealDamage, { withName: true })),
    renderRecordRow("Most Damage By One Seal In A Round", recordValueText(records.mostRoundSealDamage, { withName: true })),
    renderRecordRow("Highest Elite Level Bought", recordValueText(records.highestEliteLevel, { withName: true, prefix: "ELITE " })),
    renderRecordRow("Most Played Seal", recordValueText(records.mostPlayedSeal, { withName: true })),
    renderRecordRow("Most Played Artifact", recordValueText(records.mostPlayedArtifact, { withName: true }))
  ].join("");
  return `
    <div class="records-menu">
      <h2 class="records-title">Records</h2>
      <div class="records-list">${rows}</div>
      <button class="menu-button secondary-menu-button" data-menu-action="options">Back</button>
    </div>
  `;
}

// ---------- Settings (main menu and Pause share it) ----------
const SETTINGS_TABS = [
  { key: "audio", label: "Audio" },
  { key: "display", label: "Display" },
  { key: "gameplay", label: "Gameplay" }
];

// settings picked from a short list with ‹ ›
const SETTING_CHOICES = {
  animSpeed: {
    label: "Animation speed",
    values: () => ANIM_SPEED_VALUES,
    get: () => animSpeed(),
    set: (value) => { state.display.animSpeed = value; },
    text: (value) => `x${value}`
  },
  outlineBoil: {
    label: "Outline animation",
    values: () => [0, 1, 2, 3],
    get: () => clamp(Math.round(Number(state.display.outlineBoil) || 0), 0, 3),
    set: (value) => { state.display.outlineBoil = value; },
    text: (value) => OUTLINE_BOIL_LABELS[value] || "Off"
  },
  screenShake: {
    label: "Screen shake",
    values: () => [0, 1, 2],
    get: () => (Number.isFinite(state.display.screenShake) ? state.display.screenShake : 2),
    set: (value) => { state.display.screenShake = value; },
    text: (value) => SCREEN_SHAKE_LABELS[value] || "Full"
  },
  flashes: {
    label: "Flashes",
    values: () => [1, 0],
    get: () => (state.display.flashes ? 1 : 0),
    set: (value) => { state.display.flashes = value; },
    text: (value) => FLASH_LABELS[value] || "Full"
  },
  textSize: {
    label: "Text size",
    values: () => [0, 1],
    get: () => (state.display.textSize ? 1 : 0),
    set: (value) => { state.display.textSize = value; },
    text: (value) => TEXT_SIZE_LABELS[value] || "Normal"
  },
  fullscreen: {
    label: "Window",
    values: () => [0, 1],
    get: () => (document.fullscreenElement ? 1 : 0),
    set: (value) => setFullscreen(Boolean(value)),
    text: (value) => (value ? "Fullscreen" : "Windowed")
  }
};

function fullscreenSupported() {
  return !isNativeArcadeApp() && Boolean(document.documentElement?.requestFullscreen);
}

function setFullscreen(on) {
  try {
    if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.()?.catch?.(() => {});
    else if (!on && document.fullscreenElement) document.exitFullscreen?.()?.catch?.(() => {});
  } catch (error) {}
}

function settingSliderRow(prefix, key, label) {
  const value = Math.round((Number(state.sound[key]) || 0) * 100);
  const id = `${prefix}-${key}`;
  return `
    <div class="sound-setting setting-row">
      <label for="${id}">${label}</label>
      <input id="${id}" class="sound-slider" data-sound-setting="${key}" type="range" min="0" max="100" step="1" value="${value}" />
      <strong data-sound-value="${key}">${value}%</strong>
    </div>
  `;
}

function settingToggleRow(prefix, key, label) {
  const id = `${prefix}-${key}`;
  return `
    <label class="sound-toggle setting-row setting-toggle-row" for="${id}">
      <span class="setting-label">${label}</span>
      <input id="${id}" data-sound-setting="${key}" type="checkbox" ${state.sound[key] ? "checked" : ""} />
    </label>
  `;
}

function settingChoiceRow(key) {
  const choice = SETTING_CHOICES[key];
  const value = choice.get();
  return `
    <div class="setting-row setting-choice-row">
      <span class="setting-label">${choice.label}</span>
      <div class="setting-choice">
        <button class="setting-arrow" data-setting-choice="${key}" data-step="-1" aria-label="Previous ${choice.label}">&lsaquo;</button>
        <strong data-setting-value="${key}">${escapeHtml(choice.text(value))}</strong>
        <button class="setting-arrow" data-setting-choice="${key}" data-step="1" aria-label="Next ${choice.label}">&rsaquo;</button>
      </div>
    </div>
  `;
}

function settingNote(text) {
  return `<div class="setting-note">${text}</div>`;
}

function renderSettingsPanel(prefix) {
  const tab = SETTINGS_TABS.some((entry) => entry.key === state.settingsTab) ? state.settingsTab : "audio";
  const tabs = SETTINGS_TABS.map(
    (entry) =>
      `<button class="settings-tab ${entry.key === tab ? "active" : ""}" data-settings-tab="${entry.key}" role="tab" aria-selected="${entry.key === tab}">${entry.label}</button>`
  ).join("");
  let rows = "";
  if (tab === "audio") {
    rows = [
      settingSliderRow(prefix, "masterVolume", "Master"),
      settingSliderRow(prefix, "musicVolume", "Music"),
      settingSliderRow(prefix, "sfxVolume", "Effects"),
      settingToggleRow(prefix, "muted", "Mute all"),
      settingToggleRow(prefix, "muteInBackground", "Mute in background")
    ].join("");
  } else if (tab === "display") {
    rows = [
      fullscreenSupported() ? settingChoiceRow("fullscreen") : "",
      settingChoiceRow("outlineBoil"),
      settingChoiceRow("screenShake"),
      settingChoiceRow("flashes"),
      settingChoiceRow("textSize")
    ].join("");
  } else {
    const controls = isNativeArcadeApp()
      ? ""
      : settingNote("<b>Enter</b> Guess, Ready, Next round &nbsp;·&nbsp; <b>Esc</b> Pause &nbsp;·&nbsp; <b>Shift</b> more on a tooltip");
    rows = [
      settingChoiceRow("animSpeed"),
      settingNote("Speeds up SEAL triggers and the READY reveal."),
      controls,
      prefix === "menu" ? `<button class="small-button settings-wide-button" data-settings-replay-story>Replay the story</button>` : ""
    ].join("");
  }
  return `
    <div class="settings-panel">
      <div class="settings-tabs" role="tablist">${tabs}</div>
      <div class="settings-rows" role="tabpanel">${rows}</div>
      <div class="settings-footer">
        <button class="small-button settings-reset-button" data-settings-reset>Reset to defaults</button>
      </div>
    </div>
  `;
}

function renderQuitMenu() {
  return `
    <div class="main-menu-actions">
      <div class="quit-copy">Close The Tab To Leave The Table.</div>
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
    </div>
  `;
}

function renderArcadeApp() {
  const mobileArcade = isMobileArcadeView();
  if (isNativeArcadeApp()) {
    const targetPicking = state.pendingActive?.mode === "bot";
    if (targetPicking) {
      return `
        <div class="native-arcade-frame target-picking">
          <main class="arena native-board-panel">
            ${renderTopbar()}
            ${renderBots()}
            ${renderOverlay()}
            ${renderPentakillPopup()}
          </main>
          ${renderNativeTargetPickPanel()}
        </div>
        ${renderPauseMenu()}
        <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
      `;
    }
    const playerGuessCritical = Boolean(state.roundState?.criticalHitKeys?.has("player"));
    return `
      <div class="native-arcade-frame">
        <main class="arena native-board-panel">
          ${renderTopbar()}
          ${renderBots()}
          ${renderOverlay()}
          ${renderPentakillPopup()}
        </main>
        <div class="native-seal-actions" aria-label="Menu controls">
          ${renderPauseButton()}
          ${renderMobileOfferingsButton()}
        </div>
        <section class="native-console-panel ${playerGuessCritical ? "critical-guess-panel" : ""}" aria-label="Player guess">
          ${renderConsole()}
        </section>
        ${renderNativeInputPanel()}
        ${renderPassives()}
      </div>
      ${renderMobileOfferingsBackdrop()}
      <aside class="side-panel ${mobileArcade && state.mobileOfferingsOpen ? "mobile-open" : ""}">
        ${renderMobileOfferingsHeader()}
        ${renderShop()}
        ${renderActives()}
      </aside>
      ${renderPauseMenu()}
      <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
    `;
  }
  return `
    <div class="play-column">
      <main class="arena">
        ${renderPauseButton()}
        ${renderMobileOfferingsButton()}
        ${renderTopbar()}
        ${renderBots()}
        ${renderConsole()}
        ${renderOverlay()}
        ${renderPauseMenu()}
        ${renderPentakillPopup()}
      </main>
      ${renderPassives()}
    </div>
    ${renderMobileOfferingsBackdrop()}
    <aside class="side-panel ${mobileArcade && state.mobileOfferingsOpen ? "mobile-open" : ""}">
      ${renderMobileOfferingsHeader()}
      ${renderShop()}
      ${renderActives()}
    </aside>
    <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
  `;
}

function isMobileArcadeView() {
  return document.body.classList.contains("mobile-arcade");
}

function closeMobileOfferingsForTargetPick() {
  if (isMobileArcadeView()) state.mobileOfferingsOpen = false;
}

function renderMobileOfferingsButton() {
  if (!isMobileArcadeView()) return "";
  return `<button class="mobile-offerings-button" id="mobileOfferingsToggle" aria-label="Open items">Items</button>`;
}

function renderMobileOfferingsHeader() {
  if (!isMobileArcadeView()) return "";
  const playerSin = Math.max(0, Math.ceil(Number(state.player.credits) || 0));
  return `
    <div class="mobile-offerings-header">
      <div class="shop-title-wrap">
        <div class="panel-title">Items</div>
      </div>
      <div class="mobile-offerings-sin">${formatNumber(playerSin)}${SIN_MARK}</div>
      <button class="small-button" id="mobileOfferingsClose">Close</button>
    </div>
  `;
}

function renderMobileOfferingsBackdrop() {
  if (!isMobileArcadeView()) return "";
  return `<div class="mobile-offerings-backdrop ${state.mobileOfferingsOpen ? "visible" : ""}" id="mobileOfferingsBackdrop"></div>`;
}

function renderPauseButton() {
  return `<button class="pause-button" id="pauseButton" aria-label="Pause">Pause</button>`;
}

function currentRoundRevealStep() {
  const animation = state.roundRevealAnimation;
  if (!animation?.active) return null;
  return animation.sequence?.[animation.stepIndex] || null;
}

function roundRevealEffectActive() {
  return state.roundRevealAnimation?.active && state.roundRevealAnimation.phase === "effect";
}

function roundRevealVisibleSealIds() {
  const animation = state.roundRevealAnimation;
  if (!animation?.active) return null;
  const visibleCount = Math.max(0, animation.stepIndex + (animation.phase === "effect" ? 1 : 0));
  return new Set((animation.sequence || []).slice(0, visibleCount).map((step) => step.id));
}

function roundRevealFilterSources(sources) {
  const visibleSealIds = roundRevealVisibleSealIds();
  if (!visibleSealIds) return sources || [];
  if (!visibleSealIds.size) return [];
  return (sources || []).filter((entry) => visibleSealIds.has(sealIdFromStatSource(entry?.source)));
}

function roundRevealSourceTotal(sources, { signed = false, damage = false } = {}) {
  return (sources || []).reduce((sum, entry) => {
    if (damage && entry?.kind === "saved") return sum;
    const raw = Number(entry?.amount || 0);
    if (!Number.isFinite(raw) || raw === 0) return sum;
    const amount = raw > 0 ? Math.ceil(raw) : -Math.ceil(Math.abs(raw));
    return sum + (signed ? amount : Math.abs(amount));
  }, 0);
}

function roundRevealBotSnapshot(bot) {
  return state.roundRevealAnimation?.before?.bots?.find((entry) => entry.id === bot?.id) || null;
}

function roundRevealBotDisplay(bot) {
  if (!roundRevealAnimationActive()) return null;
  const before = roundRevealBotSnapshot(bot);
  const damageSources = roundRevealFilterSources(bot.damageSources);
  const healSources = roundRevealFilterSources(bot.healSources);
  const sinSources = roundRevealFilterSources(bot.sinSources);
  const memorySources = roundRevealFilterSources(bot.memorySources);
  const damage = roundRevealSourceTotal(damageSources, { damage: true });
  const healing = roundRevealSourceTotal(healSources);
  const sin = roundRevealSourceTotal(sinSources, { signed: true });
  const memory = roundRevealSourceTotal(memorySources);
  const baseHp = Number.isFinite(before?.hp) ? before.hp : bot.hp;
  const displayHp = Math.max(0, Math.ceil(baseHp - damage + healing));
  return {
    hp: displayHp,
    maxHp: Number.isFinite(before?.maxHp) ? before.maxHp : bot.maxHp,
    eliminated: before ? Boolean(before.eliminated) || displayHp <= 0 : bot.eliminated || displayHp <= 0,
    damageTakenTotal: (before?.damageTakenTotal || 0) + damage,
    lastDamage: damage,
    lastHeal: healing,
    lastSinDelta: sin,
    lastMemoryDelta: memory,
    damageSources,
    healSources,
    sinSources,
    memorySources
  };
}

// personality as the card should show it: during the seal animation, a change waits for its SEAL's step
function displayedBotType(bot) {
  const changes = bot?.personalityChanges || [];
  if (!changes.length || !roundRevealAnimationActive()) return bot?.type;
  const visible = roundRevealVisibleSealIds() || new Set();
  const hidden = changes.find((change) => !visible.has(sealIdFromStatSource(change.source)));
  return hidden ? hidden.from : bot.type;
}

// what SEALs have done to a DAMNED so far this round, as far as the seal animation has shown it
function botSealEffectTotals(bot) {
  const display = roundRevealBotDisplay(bot);
  const fromSeal = (entry) => Boolean(sealIdFromStatSource(entry?.source));
  const sinSources = (display ? display.sinSources : bot.sinSources || []).filter(fromSeal);
  const memorySources = (display ? display.memorySources : bot.memorySources || []).filter(fromSeal);
  const lossSources = display ? roundRevealFilterSources(bot.memoryLossSources) : bot.memoryLossSources || [];
  const signed = sinSources.map((entry) => Number(entry?.amount || 0)).filter(Number.isFinite);
  return {
    bountyUp: signed.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0),
    bountyDown: signed.filter((amount) => amount < 0).reduce((sum, amount) => sum - amount, 0),
    memoryUp: roundRevealSourceTotal(memorySources),
    memoryDown: roundRevealSourceTotal(lossSources)
  };
}

function roundRevealPlayerDisplay() {
  if (!roundRevealAnimationActive()) {
    // BOUNTY from a KO that waits for READY is paid on screen after READY
    const pendingReward = deathsAwaitingReady().reward;
    return {
      hp: state.player.hp,
      credits: state.player.credits - pendingReward,
      lastDamage: state.playerLastDamage,
      lastHeal: state.playerLastHeal,
      lastCredits: Math.max(0, (state.playerLastCredits || 0) - pendingReward),
      damageSources: state.playerDamageSources,
      healSources: state.playerHealSources,
      creditSources: state.playerCreditSources
    };
  }
  const before = state.roundRevealAnimation.before?.player || {};
  const damageSources = roundRevealFilterSources(state.playerDamageSources);
  const healSources = roundRevealFilterSources(state.playerHealSources);
  const creditSources = roundRevealFilterSources(state.playerCreditSources);
  const damage = roundRevealSourceTotal(damageSources, { damage: true });
  const healing = roundRevealSourceTotal(healSources);
  const credits = roundRevealSourceTotal(creditSources);
  return {
    hp: Math.max(0, Math.ceil((before.hp ?? state.player.hp) - damage + healing)),
    credits: Math.ceil((before.credits ?? state.player.credits) + credits),
    lastDamage: damage,
    lastHeal: healing,
    lastCredits: credits,
    damageSources,
    healSources,
    creditSources
  };
}

function renderNativeInputPanel() {
  if (state.pendingActive?.mode === "bot") return renderNativeTargetPickPanel();
  return renderMobileNumpad();
}

function renderNativeTargetPickPanel() {
  const pendingText = renderPendingText();
  return `
    <section class="native-target-pick-panel" aria-label="Pick target">
      <div class="native-target-pick-title">Pick a DAMNED</div>
      <div class="native-target-pick-copy">${escapeHtml(normalizeGameText(pendingText))}</div>
      <button id="cancelPendingActive" class="small-button pending-cancel native-target-cancel">Cancel</button>
    </section>
  `;
}

function mobileNumpadEnabled() {
  return isNativeArcadeApp() && state.mode === "arcade" && state.stage === "guess" && !state.gameOver && !state.pauseOpen;
}

function renderMobileNumpad() {
  if (!isNativeArcadeApp() || state.pendingActive?.mode === "bot") return "";
  const numberDisabled = mobileNumpadEnabled() ? "" : "disabled";
  const { buttonText, disabled } = consoleActionState();
  const keys = [
    ["1", "1"],
    ["2", "2"],
    ["3", "3"],
    ["4", "4"],
    ["5", "5"],
    ["6", "6"],
    ["7", "7"],
    ["8", "8"],
    ["9", "9"],
    ["action", buttonText],
    ["0", "0"],
    ["backspace", "DEL"]
  ];
  return `
    <section class="mobile-numpad" aria-label="Number pad">
      ${keys
        .map(([key, label]) =>
          key === "action"
            ? `<button type="button" id="mainAction" class="mobile-numpad-key mobile-numpad-action" ${disabled}>${label}</button>`
            : `<button type="button" class="mobile-numpad-key" data-numpad-key="${key}" ${numberDisabled}>${label}</button>`
        )
        .join("")}
    </section>
  `;
}

function renderPauseMenu() {
  if (!state.pauseOpen) return "";
  const screen = state.pauseScreen || "main";
  if (screen === "collection") return renderCollectionScreen("pause");
  if (screen === "settings") {
    return `
    <div class="overlay visible pause-overlay">
      <section class="end-card pause-card pause-settings-card">
        <h1 class="end-title">Settings</h1>
        <div class="pause-sound-settings">
          ${renderSettingsPanel("pause")}
        </div>
        <div class="pause-actions pause-back-row">
          <button class="primary-button" data-pause-action="back">Back</button>
        </div>
      </section>
    </div>
  `;
  }
  return `
    <div class="overlay visible pause-overlay">
      <section class="end-card pause-card">
        ${state.mode === "arcade" ? `<button class="small-button pause-dev-button" data-pause-action="dev">DEV</button>` : ""}
        ${state.mode === "arcade" ? `<button class="small-button pause-unlock-button ${state.devUnlockAllSeals ? "active" : ""}" data-pause-action="unlock-all" ${state.devUnlockAllSeals ? "disabled" : ""} data-tooltip="Testing: every locked SEAL can be offered for the rest of this run">${state.devUnlockAllSeals ? "Unlocked" : "Unlock"}</button>` : ""}
        <h1 class="end-title">Paused</h1>
        <div class="pause-actions">
          <button class="primary-button" data-pause-action="resume">Resume</button>
          <button class="primary-button" data-pause-action="restart">Restart</button>
          <button class="primary-button" data-pause-action="collection">Collection</button>
          <button class="primary-button" data-pause-action="settings">Settings</button>
          <button class="primary-button" data-pause-action="menu">Main Menu</button>
        </div>
        ${state.pauseDevOpen && state.mode === "arcade" ? renderSelfStackingDevPanel() : ""}
      </section>
    </div>
  `;
}

function renderSelfStackingDevPanel() {
  const counts = selfStackingGameConditionCounts();
  const rows = Object.values(SELF_STACKING_SEAL_SPECS)
    .map((spec) => {
      const count = counts[spec.key] || 0;
      return `<div class="dev-counter-row"><span>${escapeHtml(spec.label)}</span><strong>${count}</strong></div>`;
    })
    .join("");
  return `
    <div class="pause-dev-panel">
      <h2>Self-stacking conditions this game</h2>
      ${rows}
      <div class="dev-counter-row muted"><span>Total ARTIFACTS used</span><strong>${Math.max(0, Math.floor(state.totalArtifactsUsed || 0))}</strong></div>
    </div>
  `;
}

// ---------- PvP host screen (desktop): same look as the arcade table ----------
// Players join and play from their phones; the host screen only shows the table and runs the flow.
const PVP_PHASE_NAMES = { lobby: "Lobby", guess: "Guess", active: "Artifacts", summary: "Results", ended: "Winner" };

function renderPvpApp() {
  return `
    <main class="arena pvp-arena pvp-stage-${escapeAttr(state.pvp.stage)} ${state.pvp.slots.length > 6 ? "pvp-many" : ""}">
      <header class="pvp-top">
        ${renderPvpTargetPanel()}
        ${renderPvpTopbar()}
        ${renderPauseButton()}
      </header>
      ${renderPvpSlots()}
      ${renderPvpConsole()}
      ${renderPauseMenu()}
    </main>
    <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
  `;
}

function renderPvpTopbar() {
  const pvp = state.pvp;
  const alive = pvpAliveParticipants().length;
  const seats = pvp.slots.length;
  const lobby = pvp.stage === "lobby";
  const joined = pvp.slots.filter(Boolean).length;
  return `
    <div class="stat-card pvp-stat">
      <span class="stat-label">Round</span>
      <span class="stat-value">${pvp.round || "-"}</span>
    </div>
    <div class="stat-card pvp-stat">
      <span class="stat-label">${lobby ? "Joined" : "Alive"}</span>
      <span class="stat-value">${lobby ? `${joined}/${seats}` : `${alive}/${seats}`}</span>
    </div>
    <div class="stat-card pvp-stat pvp-phase-stat">
      <span class="stat-label">Phase</span>
      <span class="stat-value">${PVP_PHASE_NAMES[pvp.stage] || ""}</span>
    </div>
  `;
}

function renderPvpTargetPanel() {
  const pvp = state.pvp;
  const shown = pvp.finalTarget !== null ? pvp.finalTarget : pvp.baseTarget;
  const moved = pvp.finalTarget !== null && pvp.baseTarget !== null && pvp.finalTarget !== pvp.baseTarget;
  const average = pvp.finalAverage !== null && pvp.finalAverage !== undefined ? pvp.finalAverage : pvp.tableAverage;
  const line = (label, value, extra = "") => `<div class="pvp-target-line ${extra}"><span>${label}</span><strong>${value}</strong></div>`;
  return `
    <section class="target-panel pvp-target" aria-label="Target">
      <span class="stat-label pvp-target-head">Target</span>
      <strong class="pvp-target-number">${shown !== null && shown !== undefined ? formatNumber(shown) : "?"}</strong>
      <div class="pvp-target-side">
        ${line("Previous", pvp.previousTarget !== null ? formatNumber(pvp.previousTarget) : "?")}
        ${line("Modifier", formatModifier(pvp.modifier))}
        ${average !== null && average !== undefined ? line("Average", formatNumber(average)) : ""}
        ${moved ? line("First", formatNumber(pvp.baseTarget), "pvp-target-first") : ""}
      </div>
    </section>
  `;
}

// one row up to 6 seats, two even rows for bigger tables
function pvpGridColumns() {
  const seats = state.pvp.slots.length;
  return seats <= 6 ? Math.max(1, seats) : Math.ceil(seats / 2);
}

function renderPvpSlots() {
  return `
    <section class="bot-grid pvp-grid" aria-label="Players" style="--pvp-cols: ${pvpGridColumns()}">
      ${state.pvp.slots.map((participant, slot) => renderPvpSlot(participant, slot)).join("")}
    </section>
  `;
}

function renderPvpSlot(participant, slot) {
  const lobby = state.pvp.stage === "lobby";
  if (!participant) {
    return `
      <article class="bot-card pvp-slot empty-pvp-slot">
        <div class="pvp-empty-seat">
          <div class="pvp-seat-number">${slot + 1}</div>
          <div class="bot-name">Open Seat</div>
          <div class="bot-type">Join from your phone</div>
          <div class="pvp-seat-note">A DAMNED takes it when the game starts</div>
        </div>
      </article>
    `;
  }
  const kickButton = lobby
    ? `<button class="small-button pvp-slot-remove" data-pvp-remove-slot="${slot}" aria-label="Remove ${escapeAttr(participant.name)}">Remove</button>`
    : "";
  const downClass = participant.eliminated ? "eliminated" : "";
  const damageTooltip = sourceTooltip(participant.damageSources, "damage");
  const damageBadge =
    participant.lastDamage > 0
      ? `<div class="damage-badge pvp-damage-badge" ${damageTooltip ? `data-tooltip="${escapeAttr(damageTooltip)}"` : ""}>-${participant.lastDamage}</div>`
      : "";
  const isGuessPhase = state.pvp.stage === "guess";
  const isDown = participant.eliminated || participant.hp <= 0;
  const allActivesReady = state.pvp.stage !== "active" || pvpAllActivesReady();
  const hasGuess = Number.isFinite(participant.guess);
  const guessText = isDown ? "X" : lobby ? "--" : isGuessPhase ? (hasGuess ? "Ready" : "...") : hasGuess ? participant.guess : "--";
  const guessLabel = isGuessPhase ? "Status" : "Guess";
  const pvpTargetForColor = state.pvp.finalTarget !== null ? state.pvp.finalTarget : state.pvp.baseTarget;
  const guessForColor = !isGuessPhase && !isDown && hasGuess ? participant.guess : null;
  const guessCloseness = guessClosenessAttrs(guessForColor, pvpTargetForColor, participant.critical);
  const criticalClass = participant.critical ? "critical-guess" : "";
  const guessClass = [criticalClass, guessCloseness.className, isGuessPhase && hasGuess ? "pvp-ready" : ""].filter(Boolean).join(" ");
  const active = participant.activeChoiceId ? pvpActiveById(participant.activeChoiceId) : null;
  const activeHidden = state.pvp.stage === "active" && participant.activeChoiceId && !allActivesReady;
  const activeResultVisible = participant.activeResolved && !activeHidden && !isDown && active && !active.skip;
  const activeClass = !activeResultVisible
    ? ""
    : participant.activeCast
      ? "cast-active pvp-artifact-hit"
      : participant.activeCast === false
        ? "pvp-artifact-failed"
        : "";
  const activeText = isDown
    ? "X"
    : activeHidden
      ? "Ready"
      : active
        ? active.name
        : participant.activeGuaranteeThisRound && state.pvp.stage === "active"
          ? "Guaranteed"
          : "--";
  const faceInner = isDown
    ? `<span class="ko-x">X</span>`
    : `<img class="bot-image" src="${escapeAttr(botImagePath(participant))}" alt="" loading="lazy" />`;
  const hpPercent = clamp((participant.hp / Math.max(1, participant.maxHp)) * 100, 0, 100);
  return `
    <article class="bot-card pvp-slot ${downClass}" style="--bot-color: ${participant.color || "var(--cyan)"}">
      <div class="bot-face">${faceInner}</div>
      <div class="bot-title">
        <div class="bot-name" title="${escapeAttr(participant.name)}">${escapeHtml(participant.name)}</div>
      </div>
      <div class="bot-type">${participant.human ? "Player" : "DAMNED"}</div>
      <div class="bot-stats">
        <div class="mini-stat">
          <span>${guessLabel}</span>
          <strong class="${guessClass}"${guessCloseness.style}>${guessText}</strong>
        </div>
        <div class="mini-stat">
          <span>ARTIFACT</span>
          <strong class="${activeClass}">${activeText}</strong>
        </div>
        <div class="mini-stat bot-health">
          ${damageBadge}
          <div class="bot-health-heading"><span>HEALTH ${participant.hp}/${participant.maxHp}</span></div>
          <div class="health-bar">
            <div class="health-fill" style="width: ${hpPercent}%"></div>
          </div>
        </div>
      </div>
      ${kickButton}
    </article>
  `;
}

function renderPvpConsole() {
  const pvp = state.pvp;
  if (pvp.stage === "lobby") return renderPvpLobbyConsole();
  if (pvp.stage === "guess") return renderPvpGuessConsole();
  if (pvp.stage === "active") return renderPvpActiveConsole();
  if (pvp.stage === "summary") return renderPvpSummaryConsole();
  return renderPvpEndedConsole();
}

function renderPvpConsoleFrame(title, subtitle, actions, body) {
  return `
    <section class="pvp-console">
      <div class="panel-header pvp-console-head">
        <div class="pvp-console-heading">
          <div class="panel-title">${title}</div>
          ${subtitle ? `<div class="panel-subtitle">${subtitle}</div>` : ""}
        </div>
        ${actions ? `<div class="pvp-console-actions">${actions}</div>` : ""}
      </div>
      <div class="pvp-console-body">${body}</div>
    </section>
  `;
}

function renderPvpLobbyConsole() {
  const joinUrl = pvpJoinUrl();
  const seats = state.pvp.slots.length;
  const joined = state.pvp.slots.filter(Boolean).length;
  const canAdd = seats < PVP_MAX_SLOT_COUNT;
  const canRemove = seats > 2 && state.pvp.slots.some((participant) => !participant);
  const body = `
    <div class="pvp-lobby">
      <div class="pvp-join">
        <span class="pvp-join-label">Join from your phone</span>
        <strong class="pvp-join-url">${escapeHtml(joinUrl)}</strong>
        <span class="pvp-join-note">Same Wi-Fi as this screen. Open the link and enter a name.</span>
      </div>
      <div class="pvp-seats" aria-label="Seats">
        <span class="pvp-seats-label">Seats</span>
        <button class="small-button pvp-seat-button" id="pvpRemoveSlot" aria-label="One seat less" ${canRemove ? "" : "disabled"}>&minus;</button>
        <strong class="pvp-seats-count">${seats}</strong>
        <button class="small-button pvp-seat-button" id="pvpAddSlot" aria-label="One seat more" ${canAdd ? "" : "disabled"}>+</button>
      </div>
    </div>
  `;
  return renderPvpConsoleFrame(
    "Lobby",
    `${joined} of ${seats} seats taken. Open seats are played by the DAMNED.`,
    `<button class="primary-button" id="pvpReadyLobby">Start</button>`,
    body
  );
}

function renderPvpPlayerChips(isReady, readyText, waitingText) {
  const players = pvpHumanParticipants();
  if (!players.length) return `<div class="pvp-chips-empty">Only the DAMNED are playing.</div>`;
  return `
    <div class="pvp-chips">
      ${players
        .map((participant) => {
          const ready = isReady(participant);
          return `<div class="pvp-chip ${ready ? "ready" : ""}"><span class="pvp-chip-name">${escapeHtml(participant.name)}</span><span class="pvp-chip-state">${ready ? readyText : waitingText}</span></div>`;
        })
        .join("")}
    </div>
  `;
}

function renderPvpGuessConsole() {
  const alive = pvpAliveParticipants();
  const readyCount = alive.filter((participant) => Number.isFinite(participant.guess)).length;
  return renderPvpConsoleFrame(
    "Guess",
    `${readyCount} of ${alive.length} have guessed. The TARGET is revealed when everyone is in.`,
    "",
    renderPvpPlayerChips((participant) => Number.isFinite(participant.guess), "Ready", "Guessing")
  );
}

function renderPvpActiveConsole() {
  const alive = pvpAliveParticipants();
  const readyCount = alive.filter((participant) => Boolean(participant.activeChoiceId)).length;
  const allReady = readyCount === alive.length;
  return renderPvpConsoleFrame(
    "Artifacts",
    allReady ? "Everyone has chosen." : `${readyCount} of ${alive.length} have chosen an ARTIFACT.`,
    "",
    renderPvpPlayerChips((participant) => Boolean(participant.activeChoiceId), allReady ? "Chosen" : "Ready", "Choosing")
  );
}

function renderPvpSummaryConsole() {
  return renderPvpConsoleFrame(
    `Round ${state.pvp.round}`,
    `Final TARGET ${formatNumber(state.pvp.finalTarget)}. The next round starts on its own.`,
    `<button class="primary-button" id="pvpNextRound">Next Round</button>`,
    `${renderPvpResults()}`
  );
}

function renderPvpEndedConsole() {
  return renderPvpConsoleFrame(
    "Winner",
    "",
    `<button class="primary-button" id="pvpRestart">Play Again</button>`,
    `<div class="pvp-winner">${escapeHtml(state.pvp.winner || "No one")}</div>${renderPvpResults()}`
  );
}

function renderPvpResults() {
  if (!state.pvp.activeResults.length) return "";
  return `<div class="pvp-results">${state.pvp.activeResults.map((result) => `<div>${escapeHtml(normalizeGameText(result))}</div>`).join("")}</div>`;
}

function renderPvpLog(limit = 8) {
  const entries = state.pvp.log.slice(0, limit);
  if (!entries.length) return "";
  return `<div class="pvp-log">${entries.map((entry) => `<div>${escapeHtml(normalizeGameText(entry))}</div>`).join("")}</div>`;
}

// ---------- HUD change tracking: animate only when a value actually changes ----------
// Renders rebuild the DOM, so CSS animations would replay on every render.
// We remember each value and when it last changed, and resume the animation
// with a negative delay instead of restarting it.
const hudChangeTracker = new Map();
const HEALTH_GHOST_DELAY_MS = 320;
const HEALTH_GHOST_DRAIN_MS = 520;
const HUD_POP_MS = 1100;

function trackHudChange(key, value) {
  const now = performance.now();
  const previous = hudChangeTracker.get(key);
  if (!previous) {
    hudChangeTracker.set(key, { value, from: value, changedAt: -Infinity });
    return { from: value, elapsed: Infinity };
  }
  if (value !== previous.value) {
    hudChangeTracker.set(key, { value, from: previous.value, changedAt: now });
    return { from: previous.value, elapsed: 0 };
  }
  // in game time: at x2 / x4 animation speed a change is "older" sooner (the CSS runs faster too)
  return { from: previous.from, elapsed: (now - previous.changedAt) * animSpeed() };
}

// red under-bar that shows the health just lost, then drains away
function healthGhostHtml(key, percent) {
  const change = trackHudChange(`hp:${key}`, Math.round(percent * 10) / 10);
  const total = HEALTH_GHOST_DELAY_MS + HEALTH_GHOST_DRAIN_MS;
  if (!(change.from > percent) || change.elapsed >= total) return "";
  const delay = Math.round(HEALTH_GHOST_DELAY_MS - change.elapsed);
  return `<div class="health-ghost" style="--ghost-from: ${change.from}%; --ghost-to: ${percent}%; animation-delay: ${delay}ms"></div>`;
}

// popup numbers pop in and rise into place once, when their value changes
function hudPopAttrs(key, value) {
  const change = trackHudChange(`pop:${key}`, `${state.round}:${value}`);
  if (change.elapsed >= HUD_POP_MS) return { className: "", style: "" };
  return { className: "hud-pop", style: ` style="--pop-delay: ${-Math.round(Math.min(change.elapsed, HUD_POP_MS))}ms"` };
}

// ---------- DAMNED cards: shake when hit, scaled by how big the hit was ----------
const HIT_SHAKE_MS = 420;

function hitShakeAttrs(key, value, maxHp, rising = false) {
  const change = trackHudChange(`shake:${key}`, value);
  if (change.elapsed >= HIT_SHAKE_MS) return { className: "", style: "", flash: "" };
  const lost = rising ? value - change.from : change.from - value;
  if (!(lost > 0)) return { className: "", style: "", flash: "" };
  const ratio = lost / Math.max(1, maxHp);
  const size = ratio >= 0.4 ? "hit-big" : ratio >= 0.15 ? "hit-mid" : "hit-small";
  const px = (2 + Math.min(10, Math.round(ratio * 10))).toFixed(0);
  const flash = size === "hit-small" ? "" : `<span class="hit-flash"></span>`;
  if (change.elapsed === 0) noteRenderHit(size === "hit-big" ? 3 : size === "hit-mid" ? 2 : 1);
  return { className: `hit-shake ${size}`, style: `; --shake-px: ${px}px; --shake-delay: ${-Math.round(change.elapsed)}ms`, flash };
}

// ---------- seals: a sold SEAL leaves like a ghost ----------
// The slot re-renders empty straight away; a copy of the sigil is left floating over it,
// which drifts up, blurs and thins out (two faint after-images peel away to the sides).
const SEAL_GHOST_MS = 1300;

function ghostSealOut(index) {
  try {
    const slot = document.querySelector(`[data-sell-passive="${index}"]`)?.closest(".passive-slot");
    const sigil = slot?.querySelector(".equipped-seal-sigil:not(.seal-fill-sigil)");
    if (!sigil) return;
    const rect = sigil.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const look = getComputedStyle(sigil);
    const ghost = document.createElement("div");
    ghost.className = `seal-ghost${motionReduced() ? " reduced" : ""}`;
    ghost.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
    ["main", "left", "right"].forEach((part) => {
      const copy = document.createElement("img");
      copy.src = sigil.currentSrc || sigil.src;
      copy.alt = "";
      copy.className = `seal-ghost-${part}`;
      copy.style.filter = look.filter === "none" ? "" : look.filter;
      copy.style.objectFit = look.objectFit;
      ghost.appendChild(copy);
    });
    document.body.appendChild(ghost);
    setTimeout(() => ghost.remove(), SEAL_GHOST_MS + 100);
  } catch (error) {}
}

// ---------- seals: purchase animation + Ignition ring geometry ----------
let lastEquippedSealIds = null;
const sealSummonedAt = new Map();
const SEAL_SUMMON_MS = 700;

// remembers which seals were equipped last render; a seal that wasn't there before was just bought
function sealSummonAttrs(id) {
  const at = sealSummonedAt.get(id);
  if (at === undefined) return { className: "", style: "" };
  const elapsed = (performance.now() - at) * animSpeed();
  if (elapsed >= SEAL_SUMMON_MS) return { className: "", style: "" };
  return { className: "seal-summoned", style: ` style="--summon-delay: ${-Math.round(elapsed)}ms"` };
}

function trackEquippedSeals(ids) {
  const now = performance.now();
  if (lastEquippedSealIds) {
    ids.forEach((id) => {
      if (!lastEquippedSealIds.has(id)) sealSummonedAt.set(id, now);
    });
  }
  lastEquippedSealIds = new Set(ids);
}

// the red ring and shockwave are sized from the sigil as drawn, so they sit on the seal's own circle in every layout
function syncSealRings() {
  document.querySelectorAll(".passive-slot.round-reveal-active, .passive-slot.round-reveal-effect, .passive-slot.seal-summoned").forEach((slot) => {
    const sigil = slot.querySelector(".equipped-seal-sigil");
    if (!sigil) return;
    const slotRect = slot.getBoundingClientRect();
    const sigilRect = sigil.getBoundingClientRect();
    const drawn = Math.min(sigil.offsetWidth || sigilRect.width, sigil.offsetHeight || sigilRect.height);
    if (!drawn) return;
    slot.style.setProperty("--ring-d", `${drawn}px`);
    slot.style.setProperty("--ring-x", `${(sigilRect.left + sigilRect.width / 2) - (slotRect.left + slotRect.width / 2)}px`);
    slot.style.setProperty("--ring-y", `${(sigilRect.top + sigilRect.height / 2) - (slotRect.top + slotRect.height / 2)}px`);
  });
}

// ==========================================================================
// Big moments and moment sounds.
// After every render the screen is compared with the previous one (what the
// player actually sees, including the step-by-step reveal) and the matching
// sound, title card, hit-stop and screen shake are fired once.
// ==========================================================================
const MOMENT_DURATIONS_MS = { critical: 1500, boss: 2000, finals: 3400, pentakill: 1900 };
let momentWatch = null;
let activeMoment = null;
let momentSeq = 0;
let momentClearTimer = null;
let renderHitTier = 0;
const quietSfxUntil = {};

function noteRenderHit(tier) {
  renderHitTier = Math.max(renderHitTier, tier);
}

function quietMomentSfx(key, ms = 500) {
  quietSfxUntil[key] = performance.now() + ms;
}

function momentSfx(key, delayMs = 0) {
  if ((quietSfxUntil[key] || 0) > performance.now()) return;
  if (delayMs > 0) setTimeout(() => playGameSfx(key), gameMs(delayMs));
  else playGameSfx(key);
}

function motionReduced() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function startMoment(kind, title, sub = "") {
  momentSeq += 1;
  // big moments speed up at most x2, so they can still be read
  const duration = Math.round((MOMENT_DURATIONS_MS[kind] || 1600) / Math.min(animSpeed(), 2));
  activeMoment = { id: momentSeq, kind, title, sub, duration, until: performance.now() + duration };
  // the card is put on screen straight away and lives outside the render cycle (data-morph-keep),
  // so later renders never rebuild it and its animation plays exactly once
  const app = document.querySelector("#app");
  if (app) {
    app.querySelectorAll(".moment-card").forEach((element) => element.remove());
    app.insertAdjacentHTML("beforeend", renderMoment());
  }
  clearTimeout(momentClearTimer);
  momentClearTimer = setTimeout(() => {
    activeMoment = null;
    document.querySelectorAll(".moment-card").forEach((element) => element.remove());
  }, duration);
}

function renderMoment() {
  const moment = activeMoment;
  if (!moment || moment.until <= performance.now()) return "";
  const figures =
    moment.kind === "finals"
      ? `<img class="moment-figure moment-figure-left" src="assets/ui/jesus.png" alt="" /><img class="moment-figure moment-figure-right" src="assets/ui/devil.png" alt="" />`
      : "";
  return `
    <div class="moment-card moment-${moment.kind}" style="--moment-ms: ${moment.duration || MOMENT_DURATIONS_MS[moment.kind] || 1600}ms" data-morph-keep data-morph-key="moment-${moment.id}" role="status" aria-live="assertive">
      ${figures}
      <div class="moment-text">
        <div class="moment-title">${escapeHtml(moment.title)}</div>
        ${moment.sub ? `<div class="moment-sub">${escapeHtml(moment.sub)}</div>` : ""}
      </div>
    </div>
  `;
}

// freeze every running animation for a beat, so a big hit lands
function hitStop(ms = 70) {
  if (motionReduced() || typeof document.getAnimations !== "function") return;
  const running = document.getAnimations().filter((animation) => animation.playState === "running");
  running.forEach((animation) => animation.pause());
  setTimeout(() => running.forEach((animation) => {
    try {
      if (animation.playState === "paused") animation.play();
    } catch (error) {}
  }), gameMs(ms));
}

function screenShake(px = 6, ms = 380) {
  if (motionReduced()) return;
  // Settings > Display > Screen shake: Off / Low / Full
  const shake = Number.isFinite(state.display?.screenShake) ? state.display.screenShake : 2;
  if (shake <= 0) return;
  px *= shake === 1 ? 0.45 : 1;
  ms = gameMs(ms);
  const app = document.querySelector("#app");
  if (!app?.animate) return;
  const k = [0, -1, 0.8, -0.6, 0.45, -0.3, 0.15, 0];
  app.animate(
    k.map((f, index) => ({ transform: `translate(${(f * px).toFixed(1)}px, ${((index % 2 ? 0.5 : -0.5) * f * px).toFixed(1)}px)` })),
    { duration: ms, easing: "ease-out" }
  );
}

// Who CRITs this round, for colouring the numbers. Once READY resolves the round it is the real
// result; before that, everyone whose guess already sits inside their CRITICAL window around the
// revealed TARGET (the random +1 bonus chance can't be known in advance, so it isn't counted).
function criticalKeysForDisplay(round = state.roundState) {
  if (!round) return new Set();
  if (round.penaltiesApplied || round.criticalHitKeys?.size) return round.criticalHitKeys || new Set();
  if (state.stage !== "active" || state.mode === "pvp") return new Set();
  const held = targetHeldBySealAnimation(round);
  const integer = held ? held.target : Number.isFinite(round.criticalInteger) ? round.criticalInteger : round.target;
  if (!Number.isFinite(integer)) return new Set();
  const keys = new Set();
  try {
    getParticipants().forEach((participant) => {
      if (Number.isFinite(participant.guess) && Math.abs(participant.guess - integer) <= participant.window) keys.add(participant.key);
    });
  } catch (error) {}
  return keys;
}

function readMomentSnapshot() {
  const round = state.roundState;
  const revealing = roundRevealAnimationActive();
  const shown = roundRevealPlayerDisplay();
  return {
    round: state.round,
    eliminations: state.eliminations - deathsAwaitingReady().count,
    target: round && round.target !== null && round.target !== undefined ? shownTargetValue(round) : null,
    playerCritical: Boolean(round?.criticalHitKeys?.has("player")),
    anyCritical: Boolean(round?.criticalHitKeys?.size),
    bosses: state.bots.filter((bot) => bot.isBoss && !bot.eliminated && bot.hp > 0).map((bot) => ({ id: bot.id, name: bot.name, twinOrder: bot.uniqueKey === "pavlos" ? 1 : 0 })),
    finals: Boolean(state.finalBossPhase),
    downIds: Array.from(document.querySelectorAll(".bot-card.eliminated")).map((card) => card.dataset.botId),
    downBossIds: Array.from(document.querySelectorAll(".bot-card.boss.eliminated")).map((card) => card.dataset.botId),
    hp: Number(shown.hp) || 0,
    credits: Number(shown.credits) || 0,
    pentakill: Boolean(round?.pentakillPopup) && !revealing,
    gameOver: Boolean(state.gameOver) && !revealing,
    sealed: shopDisabledBySatan(),
    effects: state.bots.filter((bot) => !bot.eliminated && !bot.isBoss).map((bot) => ({ id: bot.id, type: displayedBotType(bot), ...botSealEffectTotals(bot) }))
  };
}

function watchMoments() {
  const now = readMomentSnapshot();
  const before = momentWatch;
  momentWatch = now;
  const hitTier = renderHitTier;
  renderHitTier = 0;
  // first frame of a run (new game, loaded save): just remember what is on screen
  if (!before || now.round < before.round || now.eliminations < before.eliminations) return;

  // sounds in the same frame are spaced out: TARGET first, then the hits, the KO, the SIN
  let beat = 0;
  if (before.target === null && now.target !== null) {
    beat = 260;
    momentSfx("targetLand");
  } else if (before.target !== null && now.target !== null && now.target !== before.target && now.round === before.round) {
    // a SEAL moved the TARGET (Seal of Dantre at the end of its animation)
    beat = 260;
    momentSfx("targetLand");
  }
  // CRITICAL is decided when READY is pressed (the TARGET is already on screen by then)
  if (now.playerCritical && !before.playerCritical) {
    beat = Math.max(beat, 260);
    momentSfx("critical");
    momentSfx("criticalBell");
    startMoment("critical", "Critical", "You named the TARGET");
    hitStop(80);
    screenShake(9, 420);
  } else if (now.anyCritical && !before.anyCritical) {
    beat = Math.max(beat, 260);
    momentSfx("critical");
    screenShake(5, 320);
  }

  const newDowns = now.downIds.filter((id) => !before.downIds.includes(id));
  const newBossDowns = now.downBossIds.filter((id) => !before.downBossIds.includes(id));
  const lostHp = before.hp - now.hp;
  const playerTier = lostHp > 0 ? (lostHp >= playerMaxHp() * 0.25 ? 3 : lostHp >= playerMaxHp() * 0.1 ? 2 : 1) : 0;
  const tier = Math.max(hitTier, playerTier);
  if (newBossDowns.length) {
    momentSfx("hitBig", beat);
    momentSfx("ko", beat + 90);
    setTimeout(() => {
      hitStop(75);
      screenShake(8, 400);
    }, beat);
    beat += 90;
  } else if (newDowns.length) {
    momentSfx(tier >= 3 ? "hitBig" : "hitMid", beat);
    momentSfx("ko", beat + 80);
    beat += 80;
  } else if (tier) {
    momentSfx(tier >= 3 ? "hitBig" : tier === 2 ? "hitMid" : "hitSmall", beat);
  }
  if (playerTier >= 3) screenShake(6, 340);

  // what SEALs do to the DAMNED: one sound per kind per frame, just after the hits
  const effectBeat = beat ? beat + 140 : 0;
  const played = new Set();
  now.effects.forEach((after) => {
    const prior = before.effects?.find((entry) => entry.id === after.id);
    if (!prior) return;
    if (after.bountyUp > prior.bountyUp) played.add("bountyUp");
    if (after.bountyDown > prior.bountyDown) played.add("bountyDown");
    if (after.memoryUp > prior.memoryUp) played.add("memoryUp");
    if (after.memoryDown > prior.memoryDown) played.add("memoryDown");
    if (after.type && prior.type && after.type !== prior.type) played.add("personalityChange");
  });
  ["bountyUp", "bountyDown", "memoryUp", "memoryDown", "personalityChange"].forEach((key, index) => {
    if (played.has(key)) momentSfx(key, effectBeat + index * 40);
  });

  if (now.hp > before.hp && !now.gameOver) momentSfx("heal", beat);
  if (now.credits > before.credits) momentSfx("sinGain", tier || newDowns.length ? beat + 380 : beat);

  if (!before.pentakill && now.pentakill) {
    startMoment("pentakill", "Pentakill", "+5 HEALTH   +8 SIN");
    playPentakillSfx();
    hitStop(80);
    screenShake(10, 460);
  }

  if (!before.finals && now.finals) {
    momentSfx("finalBosses");
    if (now.sealed) momentSfx("shopSealed", 1500);
    startMoment("finals", "Judgement", "Jesus and Satan take the table");
    screenShake(5, 600);
  } else if (!now.finals) {
    // bosses that come together (Petros and Pavlos) arrive in one card
    const arrived = now.bosses
      .filter((boss) => !before.bosses.some((old) => old.id === boss.id))
      .sort((left, right) => (left.twinOrder || 0) - (right.twinOrder || 0));
    if (arrived.length) {
      momentSfx("bossArrive");
      const names = arrived.map((boss) => boss.name);
      const title = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
      startMoment("boss", title, names.length > 1 ? "take their seats at the table" : "takes a seat at the table");
      screenShake(4, 500);
    }
  }

  if (!before.gameOver && now.gameOver) momentSfx("gameOver");
}

// ==========================================================================
// Seal trigger: the seal's lines turn red from the centre out while the seal
// grows, then it slams down (CSS keyframes on the slot); at the moment it hits,
// a small shockwave rolls out and the screen gives a short jolt.
// ==========================================================================
const SEAL_SLAM_AT_MS = 710;
let lastSealSlamKey = "";

function sealSlamEffects(slot) {
  const sigil = slot?.querySelector(".equipped-seal-sigil");
  if (!sigil || !slot.isConnected) return;
  const rect = sigil.getBoundingClientRect();
  const diameter = Math.min(rect.width, rect.height);
  if (!diameter) return;
  playGameSfx("sealSlam");
  if (!motionReduced()) screenShake(Math.max(3, diameter / 32), 260);
  const fx = document.createElement("div");
  fx.className = "seal-slam-fx";
  fx.style.cssText = `left:${rect.left + rect.width / 2}px;top:${rect.top + rect.height / 2}px;--fx-d:${diameter * 0.92}px`;
  fx.innerHTML = `<span class="slam-wave"></span><span class="slam-wave slam-wave-red"></span>`;
  document.body.appendChild(fx);
  setTimeout(() => fx.remove(), gameMs(800));
}

function watchSealTrigger() {
  const animation = state.roundRevealAnimation;
  if (!animation?.active || animation.phase !== "seal") return;
  const key = `${state.round}:${animation.stepIndex}:${currentRoundRevealStep()?.id || ""}`;
  if (key === lastSealSlamKey) return;
  lastSealSlamKey = key;
  setTimeout(() => {
    const slot = document.querySelector(".passive-slot.round-reveal-active:not(.suppressed)");
    if (slot) sealSlamEffects(slot);
  }, gameMs(SEAL_SLAM_AT_MS));
}

function afterRenderEffects() {
  if (state.mode !== "arcade") {
    lastEquippedSealIds = null;
    momentWatch = null;
    return;
  }
  syncSealRings();
  watchSealTrigger();
  watchMoments();
  introAfterRender();
  collectionAfterRender();
}

function renderTopbar() {
  const playerDisplay = roundRevealPlayerDisplay();
  const playerDamageTooltip = sourceTooltip(playerDisplay.damageSources, "damage");
  const playerHealTooltip = sourceTooltip(playerDisplay.healSources, "heal");
  const playerCreditTooltip = sourceTooltip(playerDisplay.creditSources, "credits");
  const playerDamagePop = hudPopAttrs("player-damage", playerDisplay.lastDamage);
  const playerHealPop = hudPopAttrs("player-heal", playerDisplay.lastHeal);
  const playerCreditPop = hudPopAttrs("player-credit", playerDisplay.lastCredits);
  const playerDamageBadge =
    playerDisplay.lastDamage > 0
      ? `<div class="player-damage-badge ${playerDamagePop.className}"${playerDamagePop.style} ${playerDamageTooltip ? `data-tooltip="${escapeAttr(playerDamageTooltip)}"` : ""}>-${playerDisplay.lastDamage}</div>`
      : "";
  const playerHealBadge =
    playerDisplay.lastHeal > 0
      ? `<div class="player-heal-badge ${playerHealPop.className}"${playerHealPop.style} ${playerHealTooltip ? `data-tooltip="${escapeAttr(playerHealTooltip)}"` : ""}>+${playerDisplay.lastHeal}</div>`
      : "";
  const playerCreditBadge =
    playerDisplay.lastCredits > 0
      ? `<div class="player-credit-badge ${playerCreditPop.className}"${playerCreditPop.style} ${playerCreditTooltip ? `data-tooltip="${escapeAttr(playerCreditTooltip)}"` : ""}>+${playerDisplay.lastCredits}${SIN_MARK}</div>`
      : "";
  const maxHp = playerMaxHp();
  const healthPercent = maxHp > 0 ? clamp((playerDisplay.hp / maxHp) * 100, 0, 100) : 0;
  const playtestButtonClass = playtestMoneyModeActive() ? "active" : "";
  const skipTitle = state.finalBossPhase
    ? "Final phase is already active"
    : activeGoeticBoss() || state.goeticBossKills > 0
      ? "Skip to Jesus and Satan"
      : "Skip past the eight special bosses";
  const arcadeLocked = arcadeActionLocked();
  return `
    <section class="topbar" aria-label="Run status">
      ${renderTargetPanel()}
      <div class="stat-card health-wrap">
        ${playerDamageBadge}
        ${playerHealBadge}
        <div class="health-row">
          <span class="stat-label">Health</span>
          <strong>${playerDisplay.hp}/${maxHp}</strong>
        </div>
        <div class="health-bar">
          ${healthGhostHtml("player", healthPercent)}
          <div class="health-fill" style="width: ${healthPercent}%"></div>
        </div>
      </div>
      <div class="stat-card round-wrap">
        <div class="round-kos-grid">
          <div class="round-kos-cell">
            <span class="stat-label">Round</span>
            <span class="stat-value">${state.round}</span>
          </div>
          <div class="round-kos-cell">
            <span class="stat-label">KOs / BOSS</span>
            <span class="stat-value">${state.eliminations - deathsAwaitingReady().count}/${state.bossKills}</span>
          </div>
        </div>
      </div>
      <div class="stat-card credit-wrap">
        ${playerCreditBadge}
        <span class="stat-label">SIN${SIN_MARK}</span>
        <span class="stat-value">${playerDisplay.credits}</span>
      </div>
      <div class="dev-quick" aria-label="Test controls">
        <button class="small-button round-skip-button" id="skipProgression" title="${escapeAttr(normalizeGameText(skipTitle))}" ${state.finalBossPhase || arcadeLocked ? "disabled" : ""}>SKIP</button>
        <button class="small-button ${playtestButtonClass}" id="playtestMoney" ${arcadeLocked ? "disabled" : ""}>INF</button>
      </div>
    </section>
  `;
}

// While a seal acting at reveal (Seal of Dantre) fills and slams, the TARGET it is about to move is
// still shown; the new TARGET appears when its animation ends.
function targetHeldBySealAnimation(round = state.roundState) {
  const held = round?.targetBeforeRevealSeals;
  const animation = state.roundRevealAnimation;
  if (!held || !animation?.active || round.penaltiesApplied || animation.phase !== "seal") return null;
  return held;
}

function shownTargetValue(round = state.roundState) {
  const held = targetHeldBySealAnimation(round);
  return held ? held.target : round?.target ?? null;
}

function renderTargetPanel() {
  const round = state.roundState;
  const held = targetHeldBySealAnimation(round);
  const target = round && round.target !== null ? formatNumber(held ? held.target : round.target) : "?";
  const previousTarget = state.previousTarget !== null ? formatNumber(state.previousTarget) : "?";
  const avg = round && round.tableAverage !== null ? formatNumber(round.tableAverage) : "average";
  const modifier = round ? formatModifier(round.targetModifier) : formatModifier(BASE_TARGET_MODIFIER);
  const offset = round ? (held ? held.offset : round.targetOffset) : 0;
  const calcAverage = `<span class="target-calc-average">${escapeHtml(avg)}</span>`;
  const calculation =
    round && round.target !== null
      ? `${calcAverage} x ${modifier} ${offset >= 0 ? "+" : "-"} ${Math.abs(offset)} = ${target}`
      : `${calcAverage} x ${modifier} ${offset >= 0 ? "+" : "-"} ${Math.abs(offset)}`;

  // One box: TARGET on top, the number beneath it, Previous / Modifier (and the calc) on the right
  return `
    <section class="target-panel target-combined" aria-label="Target">
      <span class="stat-label target-head">Target</span>
      <strong class="target-big">${target}</strong>
      <div class="target-side">
        <div class="target-line target-previous">Previous: <strong>${previousTarget}</strong></div>
        <div class="target-line target-modifier">Modifier: <strong>${modifier}</strong></div>
        <div class="target-calc-line">Calc: ${calculation}</div>
      </div>
    </section>
  `;
}

// ---------- personality glyphs: one small chalk mark per DAMNED type (replaces the emoji flags) ----------
const PERSONALITY_GLYPHS = {
  Anchor: '<circle cx="12" cy="4.2" r="1.7"/><path d="M12 6v14.5M7.6 9.2h8.8M4.6 13.4c.4 4.3 3.4 7.2 7.4 7.3 4-.1 7-3 7.4-7.3M4.6 13.4l-1.3 1.5M19.4 13.4l1.3 1.5"/>',
  Analyst: '<path d="M12 2.8 21.4 19.6H2.6Z"/><path d="M7.4 14.4c2.6-3.1 6.6-3.1 9.2 0-2.6 3.1-6.6 3.1-9.2 0Z"/><circle cx="12" cy="14.4" r="1.15"/>',
  Follower: '<path d="M3.5 6.2 9.6 12l-6.1 5.8M10.6 6.2l6.1 5.8-6.1 5.8"/><path d="M19.2 9.4v5.2"/>',
  Stubborn: '<path d="M12 21v-8.6M12 12.4C10.2 6 3 5.7 3 10.6c0 2.9 3.7 3.2 4.1.4M12 12.4C13.8 6 21 5.7 21 10.6c0 2.9-3.7 3.2-4.1.4"/><path d="M8.6 21h6.8"/>',
  Drifter: '<path d="M2.6 9.2c2.3-3 4.5-3 6.6 0s4.4 3 6.6 0 4.3-3 5.6-1.4M2.6 15.6c2.3-3 4.5-3 6.6 0s4.4 3 6.6 0 4.3-3 5.6-1.4"/>',
  Caller: '<path d="M3.4 10v4.2h3.4l5.4 4.4V5.6L6.8 10Z"/><path d="M15.3 9c1.6 1.7 1.6 4.3 0 6M18.2 6.4c3.1 3.2 3.1 8 0 11.2"/>'
};

// SIN is shown as its mark after the value ("4" + mark) everywhere except in sentences
const SIN_MARK = `<span class="sin-mark" role="img" aria-label="SIN"></span>`;

function sinValueHtml(text) {
  return `${escapeHtml(String(text).replace(/\s*SIN$/, ""))}${SIN_MARK}`;
}

// bosses: an inverted pentagram instead of a personality mark; hovering it explains the boss
const BOSS_GLYPH_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12.4" r="9.6"/><path d="M12 21.9 6.4 4.7 20.9 15.3H3.1L17.6 4.7Z"/></svg>`;

function bossAbilityText(bot) {
  if (bot.finalKey) return (FINAL_BOSS_SPECS[bot.finalKey]?.descriptions || []).join(" ");
  return botPassiveDescription(bot) || "No special ability.";
}

function glyphTooltipHtml(title, label, body, note = "", extraHtml = "") {
  return `
    <div class="tooltip-heading">
      <div class="tooltip-title">${escapeHtml(title)}</div>
      <div class="tooltip-shift-hint">${escapeHtml(label)}</div>
    </div>
    <div class="tooltip-body">${descriptionHtml(body)}</div>
    ${extraHtml}
    ${note ? `<div class="tooltip-glyph-note">${escapeHtml(note)}</div>` : ""}
  `;
}

// the ability a twin stole, as its own block under the twin's rules
function bossStolenTooltipHtml(borrowed) {
  return `
    <div class="tooltip-stolen">
      <div class="tooltip-stolen-title">Stolen from ${escapeHtml(borrowed.name)}</div>
      <div class="tooltip-body">${descriptionHtml(borrowed.text)}</div>
    </div>
  `;
}

// top centre of a twin's card: whose ability it stole (hover for what it does)
function bossStolenTagHtml(bot) {
  const borrowed = bossBorrowedPower(bot);
  if (!borrowed) return "";
  const tooltip = glyphTooltipHtml(`${bot.name} stole ${borrowed.name}'s power`, "STOLEN", borrowed.text);
  return `<div class="boss-stolen-tag" data-tooltip-html="${escapeAttr(tooltip)}"><span>Stole</span> ${escapeHtml(borrowed.name)}</div>`;
}

// late-game (Goetic) bosses are titled by their ability; the named bosses by their name
function bossTooltipTitle(bot) {
  if (bot.finalKey || bot.uniqueKey || !bot.passiveKeys?.length) return bot.name;
  return bot.passiveKeys.map((key) => botPassiveKeyName(key)).join(" + ");
}

function bossGlyphHtml(bot) {
  const borrowed = bot.finalKey ? null : bossBorrowedPower(bot);
  const tooltip = glyphTooltipHtml(
    bossTooltipTitle(bot),
    "BOSS",
    bossAbilityText(bot),
    "No personality: always plays the best guess it can work out.",
    borrowed ? bossStolenTooltipHtml(borrowed) : ""
  );
  return `<span class="bot-glyph boss-glyph" data-tooltip-html="${escapeAttr(tooltip)}">${BOSS_GLYPH_SVG}</span>`;
}

// a DAMNED that was given an ability (Pyros's gift) shows a diamond; hovering it names the ability
const GIFT_GLYPH_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2.6 19.2 12 12 21.4 4.8 12Z"/><path d="M12 7.4 15.6 12 12 16.6 8.4 12Z" fill="currentColor" stroke="none" opacity="0.55"/></svg>`;

function giftGlyphHtml(bot) {
  const keys = [...(bot.passiveKeys || []), bot.buffPassiveKey].filter(Boolean);
  if (!keys.length) return "";
  const title = keys.map((key) => botPassiveKeyName(key)).join(" + ");
  const body = keys.map((key) => botPassiveKeyDescription(key)).filter(Boolean).join(" ");
  const label = bot.buffPassiveKey ? "PYROS'S GIFT" : "ABILITY";
  const tooltip = glyphTooltipHtml(title, label, body);
  return `<span class="bot-glyph gift-glyph" data-tooltip-html="${escapeAttr(tooltip)}">${GIFT_GLYPH_SVG}</span>`;
}

// what each personality does, in plain words (see planBotGuess)
const PERSONALITY_HINTS = {
  Anchor: "Has a favourite number and likes to play around it.",
  Analyst: "Reads the trend and the way the TARGET is moving.",
  Follower: "Has noticed your success and takes your guesses seriously.",
  Stubborn: "Sticks to their instinct, no matter what.",
  Drifter: "Likes to take chances. Hard to predict.",
  Caller: "Keeps a close eye on what the other DAMNED are guessing."
};

function personalityGlyphHtml(type) {
  const paths = PERSONALITY_GLYPHS[type];
  if (!paths) return "";
  const tooltip = glyphTooltipHtml(type, "PERSONALITY", PERSONALITY_HINTS[type] || "");
  return `<span class="bot-glyph" data-tooltip-html="${escapeAttr(tooltip)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}

function renderBots() {
  const pendingPick = state.pendingActive && state.pendingActive.mode === "bot";
  return `
    <section class="bot-grid ${pendingPick ? "picking" : ""} ${state.finalBossPhase ? "final-boss-grid" : ""}" aria-label="DAMNED">
      ${state.bots.map((bot) => renderBot(bot, pendingPick)).join("")}
    </section>
  `;
}

function renderBot(bot, pendingPick) {
  const round = state.roundState;
  const display = roundRevealBotDisplay(bot);
  const submitted = round?.botSubmittedGuesses.get(bot.id);
  const effective = round?.botEffectiveGuesses.get(bot.id);
  const displayHp = display?.hp ?? bot.hp;
  const displayMaxHp = display?.maxHp ?? bot.maxHp;
  // fell before READY: HEALTH reads 0, the KO (X, sound, notice) comes after READY
  const deathAwaitsReady = !display && botDeathAwaitsReady(bot);
  const isDown = display ? display.eliminated : (bot.eliminated || bot.hp <= 0) && !deathAwaitsReady;
  const revealed = Number.isFinite(effective)
    ? formatNumber(effective)
    : state.stage !== "guess"
      ? "--"
      : bot.revealedByPassive
        ? bot.plannedGuess
        : "--";
  const rawNote =
    state.stage !== "guess" && submitted !== effective ? `Raw ${submitted}` : bot.revealedByPassive ? "Revealed" : "Guess";
  const memoryText = bot.memory.length ? `${bot.memory.length} ${bot.memory.length === 1 ? "round" : "rounds"}` : "No memory";
  const pickClass = pendingPick ? "pickable" : "";
  const freshClass = bot.fresh ? "fresh" : "";
  const bossClass = bot.isBoss ? "boss" : "";
  const diffMarkedClass = bot.diffMarkedByPlayer && !isDown ? "diff-marked" : "";
  const downClass = isDown ? "eliminated" : "";
  const deathCauseClass = bot.deathCause && isDown ? `death-${bot.deathCause}` : "";
  const faceClass = bot.isBoss ? "boss-face" : "";
  const passiveSummary = botPassiveSummary(bot);
  const hasVisiblePassive = passiveSummary && passiveSummary !== "No Seal";
  // a DAMNED's gifted ability (Pyros) lives in the diamond mark, not in the personality line
  const typeLabel = bot.isBoss ? "Boss" : normalizeGameText(displayedBotType(bot));
  const passiveDescription = "";
  const removed = round?.removedBotIds.has(bot.id) ? "Jammed" : rawNote;
  const isConfirmedCritical = Boolean(round?.criticalHitKeys?.has(`bot-${bot.id}`));
  const isCriticalGuess = isConfirmedCritical || criticalKeysForDisplay(round).has(`bot-${bot.id}`);
  // before READY only the number turns red; the full CRITICAL look comes once it is decided
  const criticalGuessClass = isConfirmedCritical ? "critical-guess" : isCriticalGuess ? "critical-pending" : "";
  const criticalGuessLabelClass = isConfirmedCritical ? "critical-guess-label" : "";
  const guessCloseness = guessClosenessAttrs(effective, shownTargetValue(round), isCriticalGuess);
  const guessClass = [criticalGuessClass, guessCloseness.className].filter(Boolean).join(" ");
  const botDamageSources = display?.damageSources ?? bot.damageSources;
  const botHealSources = display?.healSources ?? bot.healSources;
  const botSinSources = display?.sinSources ?? bot.sinSources;
  const botMemorySources = display?.memorySources ?? bot.memorySources;
  const botLastDamage = display?.lastDamage ?? bot.lastDamage;
  const botLastHeal = display?.lastHeal ?? bot.lastHeal;
  const botLastSinDelta = display?.lastSinDelta ?? bot.lastSinDelta;
  const botLastMemoryDelta = display?.lastMemoryDelta ?? bot.lastMemoryDelta;
  const damageTooltip = sourceTooltip(botDamageSources, "damage");
  const healTooltip = sourceTooltip(botHealSources, "heal");
  const sinTooltip = sourceTooltip(botSinSources, "signed-credits");
  const memoryTooltip = sourceTooltip(botMemorySources, "memory");
  const botPops = {
    damage: hudPopAttrs(`bot-${bot.id}-damage`, botLastDamage),
    heal: hudPopAttrs(`bot-${bot.id}-heal`, botLastHeal),
    sin: hudPopAttrs(`bot-${bot.id}-sin`, botLastSinDelta),
    memory: hudPopAttrs(`bot-${bot.id}-memory`, botLastMemoryDelta)
  };
  const damageBadge =
    botLastDamage > 0 && state.stage !== "guess"
      ? `<div class="damage-badge ${botPops.damage.className}"${botPops.damage.style} ${damageTooltip ? `data-tooltip="${escapeAttr(damageTooltip)}"` : ""}>-${botLastDamage}</div>`
      : "";
  const healBadge =
    botLastHeal > 0 && state.stage !== "guess"
      ? `<div class="heal-badge ${botPops.heal.className}"${botPops.heal.style} ${healTooltip ? `data-tooltip="${escapeAttr(healTooltip)}"` : ""}>+${botLastHeal}</div>`
      : "";
  const sinBadge =
    botLastSinDelta && !bot.immortal
      ? `<div class="bounty-badge ${botPops.sin.className}"${botPops.sin.style} ${sinTooltip ? `data-tooltip="${escapeAttr(sinTooltip)}"` : ""}>${botLastSinDelta > 0 ? "+" : ""}${botLastSinDelta}</div>`
      : "";
  const memoryBadge =
    botLastMemoryDelta > 0
      ? `<div class="memory-badge ${botPops.memory.className}"${botPops.memory.style} ${memoryTooltip ? `data-tooltip="${escapeAttr(memoryTooltip)}"` : ""}>+${botLastMemoryDelta}</div>`
      : "";
  const poisonStackBadge =
    (bot.poisonCounters || 0) > 0
      ? `<span class="poison-stack-label ${damageBadge ? "has-damage-badge" : ""}">Poison ${bot.poisonCounters}</span>`
      : "";
  const deathBadgeClass = bot.deathCause === "contract" ? "contract-badge" : "";
  const deathBadge = isDown && bot.deathNotice ? `<div class="death-badge ${deathBadgeClass}">${bot.deathNotice}</div>` : "";
  const markBadge = bot.markedByPlayer && !isDown ? `<div class="mark-badge">MARKED</div>` : "";
  const rewardLabel = botSinDisplay(bot);
  const flagHtml = bot.isBoss ? bossGlyphHtml(bot) : `${hasVisiblePassive ? giftGlyphHtml(bot) : ""}${personalityGlyphHtml(displayedBotType(bot))}`;
  const safeDisplayMaxHp = Math.max(1, displayMaxHp || 1);
  const displayDamageTaken = display?.damageTakenTotal ?? (bot.damageTakenTotal || 0);
  const healthLabel = bot.immortal ? `Damage ${displayDamageTaken}` : `HEALTH ${displayHp}/${displayMaxHp}`;
  const healthPercent = bot.immortal ? 100 : clamp((displayHp / safeDisplayMaxHp) * 100, 0, 100);
  const identitySwapBlocked = state.pendingActive?.id === "a7" && bot.isBoss;
  const shieldBlocked = pendingPick && botHasPassive(bot, "shield");
  const pickDisabled = isDown || bot.eliminated || identitySwapBlocked || shieldBlocked;
  const pickButton = pendingPick
    ? `<button class="pick-button" data-pick-bot="${bot.id}" ${pickDisabled ? "disabled" : ""}>${isDown || bot.eliminated ? "Down" : identitySwapBlocked ? "BOSS" : shieldBlocked ? "SEAL" : "Pick"}</button>`
    : "";
  const tooltipAttr = passiveDescription ? ` data-tooltip="${escapeAttr(passiveDescription)}"` : "";
  const hit = bot.immortal
    ? hitShakeAttrs(`bot-${bot.id}`, displayDamageTaken, Math.max(100, displayMaxHp || 100), true)
    : hitShakeAttrs(`bot-${bot.id}`, displayHp, safeDisplayMaxHp);
  const faceInner = isDown
    ? bot.deathCause === "contract"
      ? `<span class="contract-mark">PC</span>`
      : `<span class="ko-x">X</span>`
    : `<img class="bot-image" src="${escapeAttr(botImagePath(bot))}" alt="" loading="lazy" />`;

  return `
    <article class="bot-card ${pickClass} ${freshClass} ${bossClass} ${diffMarkedClass} ${downClass} ${deathCauseClass} ${hit.className}" data-bot-id="${bot.id}" style="--bot-color: ${bot.color}${hit.style}"${tooltipAttr}>
      ${hit.flash}
      ${deathBadge}
      ${markBadge}
      ${bot.isBoss && !isDown ? bossStolenTagHtml(bot) : ""}
      <div class="bot-face ${faceClass}">${faceInner}</div>
      <div class="bot-title">
        ${flagHtml}
        <div class="bot-name" title="${escapeAttr(normalizeGameText(`${bot.name} (${bot.country})`))}">${bot.name}</div>
        <div class="bot-reward" title="SIN">${sinValueHtml(rewardLabel)}</div>
        ${sinBadge}
      </div>
      <div class="bot-type ${bot.isBoss ? "boss-type" : ""}" title="${typeLabel}">${typeLabel}</div>
      <div class="bot-stats">
        <div class="mini-stat">
          <span class="${criticalGuessLabelClass}">${removed}</span>
          <strong class="${guessClass}"${guessCloseness.style}>${revealed}</strong>
        </div>
        <div class="mini-stat memory-stat">
          ${memoryBadge}
          <span>Memory</span>
          <strong>${memoryText}</strong>
        </div>
        <div class="mini-stat bot-health">
          ${damageBadge}
          ${healBadge}
          <div class="bot-health-heading">
            <span>${healthLabel}</span>
            ${poisonStackBadge}
          </div>
          <div class="health-bar">
            ${healthGhostHtml(`bot-${bot.id}`, healthPercent)}
            <div class="health-fill" style="width: ${healthPercent}%"></div>
          </div>
        </div>
      </div>
      ${pickButton}
    </article>
  `;
}

function consoleActionState() {
  const round = state.roundState;
  let buttonText = "Guess";
  let hint = "";
  let disabled = "";
  let inputDisabled = "";
  const maxGuess = playerGuessLimit();

  if (roundRevealAnimationActive()) {
    const step = currentRoundRevealStep();
    buttonText = "Skip";
    inputDisabled = "disabled";
    hint = step
      ? roundRevealEffectActive()
        ? `${step.name} resolves.`
        : `${step.name} is triggering.`
      : "Revealing SEAL effects.";
  } else if (state.stage === "active") {
    buttonText = "Ready";
    inputDisabled = "disabled";
    disabled = state.pendingActive ? "disabled" : "";
    hint = `${round.activeUses}/${activeUseLimit()} ARTIFACTS used. Ready applies penalties.`;
  } else if (state.stage === "summary") {
    buttonText = "Next Round";
    inputDisabled = "disabled";
    hint = shopDisabledBySatan()
      ? "Penalties are locked in. Satan has sealed Devil's Offerings."
      : "Penalties are locked in. Devil's Offerings is still available before you advance.";
  } else if (state.stage === "ended") {
    buttonText = "Restart";
    inputDisabled = "disabled";
    hint = state.inspectingGameOver ? "Game over inspection. Hover damage, healing, SIN, and memory bubbles to inspect the round." : "Run ended.";
  } else {
    hint = `Pick a number between 0 and ${maxGuess}`;
  }

  return { buttonText, disabled, hint, inputDisabled, maxGuess, round };
}

function renderConsole() {
  const { buttonText, disabled, hint, inputDisabled, maxGuess, round } = consoleActionState();
  const value = round?.playerSubmittedGuess ?? "";
  const playerCriticalConfirmed = Boolean(round?.criticalHitKeys?.has("player"));
  const playerCritical = playerCriticalConfirmed || criticalKeysForDisplay(round).has("player");
  const playerCloseness = guessClosenessAttrs(round?.playerEffectiveGuess, shownTargetValue(round), playerCritical);
  // about to CRIT: just the number in red; after READY the line and the button turn red too
  const criticalInputClass = playerCriticalConfirmed ? "critical-guess" : playerCritical ? "critical-pending" : "";
  const inputClass = ["guess-input", criticalInputClass, playerCloseness.className].filter(Boolean).join(" ");
  const nativeInputType = isNativeArcadeApp() ? "text" : "number";
  const nativeInputLock = isNativeArcadeApp()
    ? 'readonly inputmode="none" autocomplete="off" autocorrect="off" spellcheck="false" aria-readonly="true"'
    : "";
  const pendingText = renderPendingText();
  const nativeTargetPick = isNativeArcadeApp() && state.pendingActive?.mode === "bot";
  const pendingCancel = state.pendingActive && !nativeTargetPick ? `<button id="cancelPendingActive" class="small-button pending-cancel">Cancel</button>` : "";

  return `
    <section class="center-console" aria-label="Player action">
      ${hint ? `<div class="console-hint">${escapeHtml(normalizeGameText(hint))}</div>` : ""}
      <div class="console-row">
        <input
          id="guessInput"
          class="${inputClass}"
          type="${nativeInputType}"
          min="0"
          max="${maxGuess}"
          step="1"
          placeholder=" "
          value="${value}"
          ${playerCloseness.style.trim()}
          ${nativeInputLock}
          ${inputDisabled}
        />
        ${isNativeArcadeApp() ? "" : `<button id="mainAction" class="primary-button" ${disabled}>${buttonText}</button>`}
      </div>
      <div class="pending-panel ${state.pendingActive ? "visible" : ""}">
        <span>${escapeHtml(normalizeGameText(pendingText))}</span>
        ${pendingCancel}
      </div>
    </section>
  `;
}

function renderPendingText() {
  if (!state.pendingActive) return "";
  const item = pendingArtifactItem();
  if (!item) return "";
  if (state.pendingActive.id === "a6") return `${item.name} adds ${artifactValue(20)} to the TARGET.`;
  if (state.pendingActive.id === "a14") return `${item.name} reduces the TARGET by ${artifactValue(10)}.`;
  if (state.pendingActive.id === "a15") {
    const extra = sacrificialDaggerExtraDamage("p70");
    return `${item.name}: pick a target. non-boss DAMNED take ${artifactPercentValue(20)}%, BOSSES take ${artifactPercentValue(sacrificialDaggerBossPercent())}%${extra ? `, plus ${extra} from Seal of Amy` : ""}.`;
  }
  if (state.pendingActive.id === "a25") return `${item.name}: pick DAMNED to reveal next round and give +3 BOUNTY.`;
  if (state.pendingActive.id === "a26" && state.pendingActive.step === "give") return `${item.name}: pick DAMNED to receive the drained BOUNTY.`;
  if (state.pendingActive.id === "a26") return `${item.name}: pick DAMNED to drain up to ${artifactValue(5)} BOUNTY.`;
  if (state.pendingActive.id === "a28") {
    const value = artifactValue(6);
    return `${item.name}: pick a DAMNED to gain +${value} MEMORY, +${value} SIN, and heal ${artifactPercentValue(6)}% max HEALTH.`;
  }
  if (state.pendingActive.id === "a11" && state.pendingActive.step === "heal") {
    return `${item.name}: pick a different non-boss DAMNED to overheal ${artifactPercentValue(30)}% max HEALTH and copy the first's ability.`;
  }
  return `${item.name}: pick a DAMNED card to resolve it.`;
}

function setGuessInputValue(value) {
  const input = document.querySelector("#guessInput");
  if (!input) return;
  input.value = value;
}

function handleMobileNumpadKey(key) {
  if (!mobileNumpadEnabled()) return;
  const input = document.querySelector("#guessInput");
  if (!input) return;

  const current = String(input.value || "");
  if (key === "clear") {
    setGuessInputValue("");
    return;
  }
  if (key === "backspace") {
    setGuessInputValue(current.slice(0, -1));
    return;
  }
  if (!/^\d$/.test(key)) return;

  const maxGuess = playerGuessLimit();
  const next = current === "0" ? key : `${current}${key}`;
  const parsed = Number(next);
  if (!Number.isFinite(parsed) || parsed > maxGuess || next.length > String(maxGuess).length) return;
  setGuessInputValue(next);
}

function renderShop() {
  const locked = shopDisabledBySatan();
  const actionsLocked = arcadeActionLocked();
  const eliteChance = Math.round(eliteShopChance() * 100);
  return `
    <section class="panel shop-panel ${locked ? "shop-locked" : ""}" aria-label="Devil's Offerings">
      <div class="panel-header">
        <div class="shop-title-wrap">
          <div class="panel-title">Devil's Offerings</div>
          <div class="elite-chance-label">${eliteChance}% ELITE</div>
        </div>
        <div class="reroll-control">
          <button class="small-button reroll-button" id="rerollShop" ${locked || actionsLocked ? "disabled" : ""}>Reroll <span class="reroll-cost">${currentRerollCost()}${SIN_MARK}</span></button>
        </div>
      </div>
      <div class="shop-slots">
        ${locked ? `<div class="shop-lock-message"><img class="shop-lock-sigil" src="assets/seals/satan/lucifer-wide.png" alt="" /><span>Satan has sealed Devil's Offerings.</span></div>` : state.shop.map((slot, index) => renderShopSlot(slot, index)).join("")}
      </div>
    </section>
  `;
}

function renderShopSlot(slot, index) {
  if (!slot || slot.sold || (slot.item?.type === "passive" && REMOVED_PASSIVE_IDS.has(slot.item.id))) {
    return `<div class="item-card"><div class="empty-state">Sold out until reroll</div></div>`;
  }

  const item = slot.item;
  const cost = shopPrice(item);
  const passiveCopies = item.type === "passive" ? directPassiveStack(item.id) : 0;
  const ownedSelfStackingSeal = item.type === "passive" && isSelfStackingSeal(item.id) && passiveCopies > 0;
  const full =
    item.type === "passive"
      ? passiveCopies === 0 && !hasSealSlotRoomFor(item)
      : state.player.actives.length >= activeInventoryLimit();
  const disabled = arcadeActionLocked() || shopDisabledBySatan() || !canSpendCredits(cost) || full || ownedSelfStackingSeal ? "disabled" : "";
  const buttonText = ownedSelfStackingSeal ? "Owned" : passiveCopies ? `Upgrade ${cost}${SIN_MARK}` : full ? "Full" : `Buy ${cost}${SIN_MARK}`;
  const previewItem = ownedSelfStackingSeal ? passiveEntry(item.id) || item : passiveCopies ? { ...item, stack: passiveCopies + 1 } : item;
  const displayName = passiveCopies ? passiveDisplayName(previewItem) : item.name;
  const description = itemDescription(previewItem);
  const itemImage =
    item.type === "passive" ? renderSealSigil(previewItem, "shop-seal-sigil") : renderArtifactIcon(previewItem, "shop-artifact-icon");
  const imageClass = itemImage ? `has-item-icon ${item.type === "passive" ? "has-seal-sigil" : "has-artifact-icon"}` : "";
  const kindLabel = item.type === "passive" ? (SATAN_SEAL_IDS.has(item.id) ? "SATAN SEAL" : "SEAL") : "ARTIFACT";

  return `
    <article class="item-card ${item.type} ${imageClass} ${passiveCopies && !ownedSelfStackingSeal ? "elite-offer" : ""} ${SATAN_SEAL_IDS.has(item.id) ? "satan-offer" : ""}" data-tooltip="${escapeAttr(description)}">
      ${itemImage}
      <div class="item-top">
        <div>
          <div class="item-name">${displayName}</div>
        </div>
        <span class="item-kind">${kindLabel}</span>
      </div>
      <div class="item-actions one">
        <button class="small-button shop-buy-button" data-buy="${index}" ${disabled}>${buttonText}</button>
      </div>
    </article>
  `;
}

function renderActives() {
  normalizeActiveCarouselIndex();
  const count = state.player.actives.length;
  const limit = activeInventoryLimit();
  const subtitle = count >= limit ? `${count}/${limit} FULL` : `${count}/${limit}`;
  const readyClass = state.player.actives.some((item, index) => canUseActive(index)) && !state.pendingActive ? "artifact-panel-ready" : "";
  const activeCards = count
    ? state.player.actives.map((item, index) => renderActiveItem(item, index)).join("")
    : `<div class="empty-state">No ARTIFACTS</div>`;

  return `
    <section class="panel active-panel ${readyClass}" aria-label="ARTIFACTS">
      <div class="panel-header">
        <div>
          <div class="panel-title">ARTIFACTS</div>
          <div class="panel-subtitle">${subtitle}</div>
        </div>
      </div>
      <div class="active-list scroll-active-list">${activeCards}</div>
    </section>
  `;
}

function artifactStateClass(index, actionLocked) {
  if (canUseActive(index) && !actionLocked) return "artifact-ready";
  if (state.stage === "active" && state.roundState && !state.roundState.penaltiesApplied) return "artifact-spent";
  return "artifact-waiting";
}

function renderActiveItem(item, index) {
  const actionLocked = Boolean(state.pendingActive);
  const useDisabled = canUseActive(index) && !actionLocked ? "" : "disabled";
  const sellDisabled = actionLocked || arcadeActionLocked() ? "disabled" : "";
  const sale = activeSellValue(item);
  const description = itemDescription(item);
  const itemImage = renderArtifactIcon(item, "inventory-artifact-icon");
  const memoryLine =
    item.id === "a18" ? `<div class="artifact-memory-line">Last: ${escapeHtml(lastUsedArtifactName())}</div>` : "";
  return `
    <article class="item-card active ${itemImage ? "has-item-icon has-artifact-icon" : ""} ${artifactStateClass(index, actionLocked)}" data-tooltip="${escapeAttr(description)}">
      ${itemImage}
      <div class="item-top">
        <div>
          <div class="item-name">${item.name}</div>
          ${memoryLine}
          <div class="price">Sell ${sale}${SIN_MARK}</div>
        </div>
        <span class="item-kind">ARTIFACT</span>
      </div>
      <div class="item-actions">
        <button class="small-button" data-use-active="${index}" ${useDisabled}>Use</button>
        <button class="small-button sell-button" data-sell-active="${index}" ${sellDisabled}>Sell</button>
      </div>
    </article>
  `;
}

function renderPassives() {
  pruneRemovedPassives();
  const slots = [];
  const limit = passiveLimit();
  let occupiedSlots = 0;
  if (state.mode === "arcade") {
    trackEquippedSeals(state.player.passives.filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id)).map((item) => item.id));
  }
  state.player.passives.forEach((item, index) => {
    if (!item || REMOVED_PASSIVE_IDS.has(item.id) || occupiedSlots >= limit) return;
    const slotCost = sealSlotCost(item);
    occupiedSlots += slotCost;
    const sale = Math.floor((item.price * (item.stack || 1)) / 2) + (item.saleBonus || 0);
    const displayName = passiveDisplayName(item);
    const description = itemDescription(item);
    const disabledNotice = sealSuppressionNotice(item.id);
    const tooltip = renderSealTooltipHtml(item, displayName, description, disabledNotice, sale);
    const revealStep = currentRoundRevealStep();
    const revealClass =
      revealStep?.id === item.id ? (roundRevealEffectActive() ? "round-reveal-effect" : "round-reveal-active") : "";
    // a SEAL lights up only once its trigger has been shown, which is after READY
    // (or in the reveal-time Dev SEAL animation); after READY anything new lights up straight away
    const round = state.roundState;
    const triggerShown = Boolean(round?.penaltiesApplied || round?.animatedPassiveIds?.has(item.id));
    const triggeredClass = roundRevealAnimationActive()
      ? revealStep?.id === item.id
        ? "triggered"
        : ""
      : round?.triggeredPassiveIds?.has(item.id) && triggerShown
        ? "triggered"
        : "";
    const suppressedClass = isSealSuppressed(item.id) ? "suppressed" : "";
    const counterBadge = item.id === "p39" ? `<div class="passive-counter">Stacks ${item.counter || 0}</div>` : "";
    const sealImage =
      renderSealSigil(item, "equipped-seal-sigil") +
      (revealClass && !SATAN_SEAL_IDS.has(item.id) ? renderSealSigil(item, "equipped-seal-sigil seal-fill-sigil") : "");
    const sellDisabled = arcadeActionLocked() ? "disabled" : "";
    const wideClass = slotCost > 1 ? "wide-seal-slot" : "";
    const summon = sealSummonAttrs(item.id);
    slots.push(`
      <article class="passive-slot ${wideClass} ${triggeredClass} ${revealClass} ${suppressedClass} ${summon.className}"${summon.style} data-tooltip-html="${escapeAttr(tooltip)}">
        ${sealImage}
        ${counterBadge}
        <button class="small-button sell-button seal-sell-button" data-sell-passive="${index}" aria-label="Sell ${escapeAttr(displayName)}" ${sellDisabled}>Sell</button>
      </article>
    `);
  });
  const emptyCount = Math.max(0, limit - occupiedSlots);
  for (let index = 0; index < emptyCount; index += 1) {
    slots.push(`
      <div class="passive-slot empty" data-tooltip="Empty SEAL slot" aria-label="Empty SEAL slot">
        <img class="empty-seal-slot-image" src="assets/ui/empty-seal-slot-x.png" alt="" />
      </div>
    `);
  }

  return `<footer class="passive-bar" aria-label="SEALS">${slots.join("")}</footer>`;
}

function renderOverlay() {
  if (roundRevealAnimationActive()) return `<div class="overlay"></div>`;
  if (!state.gameOver || state.inspectingGameOver) return `<div class="overlay"></div>`;
  const stats = ensureRunStats();
  const bestSeal = stats.maxSealRoundDamage?.value > 0 ? `${stats.maxSealRoundDamage.name} (${formatNumber(stats.maxSealRoundDamage.value)})` : "None";
  const statRow = (label, value) => `<div class="end-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
  return `
    <div class="overlay visible game-over-overlay">
      <img class="end-figure end-figure-left" src="${FINAL_BOSS_JESUS_SRC}" alt="" />
      <img class="end-figure end-figure-right" src="${FINAL_BOSS_SATAN_SRC}" alt="" />
      <section class="end-card game-over-card">
        <h1 class="end-title">Game Over</h1>
        <p class="end-copy">Welcome to Hell...</p>
        <div class="end-stats">
          ${statRow("Round", state.round)}
          ${statRow("KOs", formatNumber(state.eliminations))}
          ${statRow("Bosses", formatNumber(state.bossKills))}
          ${statRow("Pentakills", formatNumber(stats.pentakills || 0))}
          ${statRow("Damage dealt", formatNumber(stats.overallDamage || 0))}
          ${statRow("Best round damage", formatNumber(stats.singleRoundDamage || 0))}
          <div class="end-stat end-stat-wide"><span>Strongest SEAL in one round</span><strong>${escapeHtml(bestSeal)}</strong></div>
        </div>
        ${renderNewRecordsHtml()}
        <div class="end-actions">
          <button class="primary-button" id="inspectGame">Inspect</button>
          <button class="primary-button end-restart" id="restartGame">Restart</button>
        </div>
      </section>
    </div>
  `;
}

// records this run broke, under the run's stats on the death card
function renderNewRecordsHtml() {
  const broken = newRecordsThisRun();
  if (!broken.length) return "";
  const rows = broken
    .map((record) => {
      const format = (number) => (record.key === "highestEliteLevel" ? `ELITE ${number}` : formatNumber(number));
      const value = format(record.value);
      const name = record.name ? ` <em>${escapeHtml(record.name)}</em>` : "";
      return `<div class="new-record-row"><span>${escapeHtml(record.label)}${name}</span><strong>${escapeHtml(value)}</strong><small>was ${escapeHtml(format(record.previous))}</small></div>`;
    })
    .join("");
  return `
    <div class="new-records">
      <div class="new-records-title">New record${broken.length > 1 ? "s" : ""}</div>
      ${rows}
    </div>
  `;
}

// PENTAKILL is now a full-screen moment (see startMoment in watchMoments)
function renderPentakillPopup() {
  return "";
}

function showMainMenu(screen = "main") {
  saveArcadeRun();
  pvpClearAutoTimer();
  pvpStopHostPolling();
  clearNativeArcadeResumeOnForeground();
  state.mode = "menu";
  state.menuScreen = screen;
  state.pendingRunDeleteSlotId = null;
  state.pauseOpen = false;
  state.mobileOfferingsOpen = false;
  render();
}

function requestRunRemoval(slotId) {
  state.pendingRunDeleteSlotId = slotId || null;
  render();
}

function cancelRunRemoval() {
  state.pendingRunDeleteSlotId = null;
  render();
}

function confirmRunRemoval(slotId) {
  removeArcadeRunSlot(slotId);
  if (state.currentRunSlotId === slotId) state.currentRunSlotId = null;
  state.pendingRunDeleteSlotId = null;
  render();
}

function handleMenuAction(action) {
  resumeSoundtrack();
  if (action === "play") {
    // on the phone app there is no PvP, so Play skips the Arcade / PvP choice
    state.menuScreen = isNativeArcadeApp() ? "arcade-options" : "play";
    state.pendingRunDeleteSlotId = null;
    render();
    return;
  }
  if (action === "options") {
    state.menuScreen = "options";
    render();
    return;
  }
  if (action === "sound-options") {
    state.menuScreen = "sound";
    render();
    return;
  }
  if (action === "records") {
    state.menuScreen = "records";
    render();
    return;
  }
  if (action === "back") {
    state.menuScreen = "main";
    state.pendingRunDeleteSlotId = null;
    render();
    return;
  }
  if (action === "arcade") {
    state.menuScreen = "arcade-options";
    state.pendingRunDeleteSlotId = null;
    render();
    return;
  }
  if (action === "load-run") {
    state.menuScreen = "arcade-runs";
    state.pendingRunDeleteSlotId = null;
    render();
    return;
  }
  if (action === "continue-arcade") {
    if (loadArcadeRun()) {
      resumeSoundtrack();
      render();
    } else {
      startGame();
    }
    return;
  }
  if (action === "pvp") {
    requestPvpMode();
    return;
  }
  if (action === "quit") {
    state.menuScreen = "quit";
    render();
    window.close();
  }
}

function updateSettingChoice(key, step) {
  const choice = SETTING_CHOICES[key];
  if (!choice) return;
  const values = choice.values();
  const index = values.indexOf(choice.get());
  const next = values[(Math.max(0, index) + step + values.length) % values.length];
  choice.set(next);
  if (key !== "fullscreen") {
    saveDisplaySettings();
    applyDisplaySettings();
  }
  render();
}

function resetSettings() {
  const prefersReducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  state.sound.masterVolume = 1;
  state.sound.musicVolume = SOUNDTRACK_VOLUME;
  state.sound.sfxVolume = 1;
  state.sound.muted = false;
  state.sound.muteInBackground = true;
  state.display.outlineBoil = prefersReducedMotion ? 0 : 2;
  state.display.animSpeed = 1;
  state.display.screenShake = prefersReducedMotion ? 0 : 2;
  state.display.flashes = 1;
  state.display.textSize = 0;
  saveSoundSettings();
  applySoundSettings();
  saveDisplaySettings();
  applyDisplaySettings();
  render();
}

function updateDisplaySetting(key, value) {
  if (!(key in state.display)) return;
  if (key === "outlineBoil") state.display.outlineBoil = clamp(Math.round(Number(value) || 0), 0, 3);
  saveDisplaySettings();
  applyDisplaySettings();
  document.querySelectorAll(`[data-display-value="${key}"]`).forEach((label) => {
    label.textContent = OUTLINE_BOIL_LABELS[state.display.outlineBoil] || "Off";
  });
  document.querySelectorAll(`[data-display-setting="${key}"]`).forEach((control) => {
    if (Number(control.value) !== state.display.outlineBoil) control.value = String(state.display.outlineBoil);
  });
}

function updateSoundSetting(key, value, renderAfter = true) {
  if (typeof state.sound[key] === "boolean") {
    state.sound[key] = Boolean(value);
  } else if (key in state.sound) {
    state.sound[key] = clamp(Number(value) / 100, 0, 1);
  }
  saveSoundSettings();
  applySoundSettings();
  if (renderAfter) render();
}

function handlePauseAction(action) {
  if (action === "settings" || action === "collection") {
    state.pauseScreen = action;
    render();
    return;
  }
  if (action === "back") {
    state.pauseScreen = "main";
    render();
    return;
  }
  if (action === "unlock-all") {
    // testing only: locked SEALS can be offered for the rest of this run (nothing is saved to the collection)
    state.devUnlockAllSeals = true;
    addLog("Testing: all SEALS unlocked for this run.");
    render();
    return;
  }
  if (action === "dev") {
    state.pauseDevOpen = !state.pauseDevOpen;
    render();
    return;
  }
  if (action === "resume") {
    state.pauseOpen = false;
    state.pauseScreen = "main";
    if (state.mode === "pvp") pvpSetHostPaused(false);
    render();
    return;
  }
  if (action === "restart") {
    if (state.mode === "pvp") restartPvpMode();
    else startGame();
    return;
  }
  if (action === "pvp") {
    requestPvpMode();
    return;
  }
  if (action === "arcade") {
    switchToArcadeMode();
    return;
  }
  if (action === "menu") {
    showMainMenu();
  }
}

/* ---------- Animated main menu: rotating background + glitching title ---------- */
// Layout is in artwork pixels (1672x941), scaled like background-size: cover.
const MENU_ART_W = 1672;
const MENU_ART_H = 941;
const MENU_BG_PIVOT = { x: 837, y: 312 }; // centre of the circle behind the title
const MENU_BG_COVER = 780; // radius around the pivot that menu-bg-spin.jpg fully covers
const MENU_BG_SPIN_MS = 240000;
// node: the live backdrop (background, doorway, figures, logo). It is built once and moved into each
// re-rendered menu so clicking buttons never reloads or restarts it.
const menuBackdropState = { startedAt: 0, resizeBound: false, glitchStarted: false, node: null };
// fixed dark doorway behind the buttons (art pixels): matches .menu-door in styles.css
const MENU_DOOR = { cx: 696 + 283 / 2, top: 476, solidTop: 55, solidBottom: 388 };

function menuReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// slow embers drifting up through the menu art (positions picked once, the backdrop node is reused)
function renderMenuEmbers() {
  const embers = Array.from({ length: 22 }, (_, index) => {
    const x = Math.round(80 + Math.random() * 1510);
    const size = (1.6 + Math.random() * 2.6).toFixed(1);
    const duration = (9 + Math.random() * 10).toFixed(1);
    const delay = (-Math.random() * 19).toFixed(1);
    const drift = Math.round(-60 + Math.random() * 120);
    const red = index % 4 === 0 ? " ember-red" : "";
    return `<span class="menu-ember${red}" style="left:${x}px;--ember-size:${size}px;--ember-drift:${drift}px;animation-duration:${duration}s;animation-delay:${delay}s"></span>`;
  }).join("");
  return `<div class="menu-embers">${embers}</div>`;
}

function renderMenuBackdrop() {
  return `
      <div class="menu-backdrop" aria-hidden="true">
        <svg width="0" height="0" style="position:absolute">
          <filter id="menuGlitchRed" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.86 0 0 0 0  0.1 0 0 0 0  0.12 0 0 0 0  0 0 0 1 0"/></filter>
          <filter id="menuGlitchCyan" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.91 0 0 0 0  0.89 0 0 0 0  0.84 0 0 0 0  0 0 0 0.75 0"/></filter>
        </svg>
        <div class="menu-stage">
          <div class="menu-bg-spin"><img class="menu-bg-img" src="assets/ui/menu/menu-bg-spin.jpg" alt=""></div>
          <img class="menu-door" src="assets/ui/menu/menu-door.webp" alt="">
          <div class="menu-logo-glow"></div>
          ${renderMenuFigure("jesus")}
          ${renderMenuFigure("satan")}
          ${renderMenuEmbers()}
          <div class="menu-logo">
            <img class="logo-base" src="assets/ui/menu/menu-logo.webp" alt="">
            <img class="logo-red" src="assets/ui/menu/menu-logo.webp" alt="">
            <img class="logo-cyan" src="assets/ui/menu/menu-logo.webp" alt="">
            <img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt=""><img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt=""><img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt="">
            <img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt=""><img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt=""><img class="logo-slice" src="assets/ui/menu/menu-logo.webp" alt="">
          </div>
        </div>
      </div>`;
}

function initMenuBackdrop() {
  if (!menuBackdropState.startedAt) menuBackdropState.startedAt = Date.now();
  const slot = document.querySelector(".menu-backdrop-slot");
  if (slot && menuBackdropState.node) slot.replaceWith(menuBackdropState.node);
  else menuBackdropState.node = document.querySelector(".menu-backdrop");
  // keep the rotation continuous when the menu re-renders (switching screens)
  const spinImg = document.querySelector(".menu-bg-img");
  if (spinImg) {
    const elapsed = (Date.now() - menuBackdropState.startedAt) % MENU_BG_SPIN_MS;
    spinImg.style.animationDelay = `-${elapsed}ms`;
  }
  // CSS animations restart when the backdrop is moved into the new menu, so resume them where they were
  const crown = document.querySelector(".menu-fig .fig-crown-shimmer");
  if (crown) crown.style.animationDelay = `-${(Date.now() - menuBackdropState.startedAt) % 7500}ms`;
  layoutMenuBackdrop();
  initMenuFigures(menuReducedMotion());
  bindMenuFigureTriggers();
  if (!menuBackdropState.resizeBound) {
    menuBackdropState.resizeBound = true;
    window.addEventListener("resize", layoutMenuBackdrop);
    // button heights change once the menu font has loaded
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutMenuBackdrop);
  }
  if (!menuBackdropState.glitchStarted && !menuReducedMotion()) {
    menuBackdropState.glitchStarted = true;
    setTimeout(menuLogoGlitchBurst, 1400);
  }
}

function layoutMenuBackdrop() {
  const backdrop = document.querySelector(".menu-backdrop");
  const stage = backdrop?.querySelector(".menu-stage");
  if (!backdrop || !stage) return;
  const vw = backdrop.clientWidth || window.innerWidth;
  const vh = backdrop.clientHeight || window.innerHeight;
  const s = Math.max(vw / MENU_ART_W, vh / MENU_ART_H);
  const ox = (vw - MENU_ART_W * s) / 2;
  const oy = (vh - MENU_ART_H * s) / 2;
  stage.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
  // smallest zoom that keeps the visible screen covered at every angle of the spin
  const x0 = Math.max(0, -ox / s);
  const y0 = Math.max(0, -oy / s);
  const x1 = Math.min(MENU_ART_W, (vw - ox) / s);
  const y1 = Math.min(MENU_ART_H, (vh - oy) / s);
  let far = 0;
  for (const x of [x0, x1]) {
    for (const y of [y0, y1]) far = Math.max(far, Math.hypot(x - MENU_BG_PIVOT.x, y - MENU_BG_PIVOT.y));
  }
  const zoom = Math.max(1, (far + 2) / MENU_BG_COVER);
  const spin = stage.querySelector(".menu-bg-spin");
  if (spin) spin.style.transform = `scale(${zoom.toFixed(4)})`;
  // centre the menu buttons inside the solid part of the fixed dark doorway
  const panel = document.querySelector(".main-menu-panel");
  const menu = document.querySelector(".main-menu");
  if (panel && menu) {
    const doorX = ox + MENU_DOOR.cx * s;
    const doorMid = oy + (MENU_DOOR.top + (MENU_DOOR.solidTop + MENU_DOOR.solidBottom) / 2) * s;
    const h = panel.offsetHeight;
    const top = Math.max(8, Math.min(doorMid - h / 2, vh - h - 12));
    panel.classList.add("door-anchored");
    panel.style.left = `${doorX}px`;
    panel.style.top = `${top}px`;
  }
}

function menuLogoGlitchBurst() {
  const logo = document.querySelector(".menu-logo");
  const schedule = () => setTimeout(menuLogoGlitchBurst, 2600 + Math.random() * 4400);
  if (!logo || document.hidden) {
    schedule();
    return;
  }
  const base = logo.querySelector(".logo-base");
  const red = logo.querySelector(".logo-red");
  const cyan = logo.querySelector(".logo-cyan");
  const slices = [...logo.querySelectorAll(".logo-slice")];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const reset = () => {
    logo.style.opacity = "";
    for (const el of [base, red, cyan, ...slices]) if (el) el.style.cssText = "";
  };
  const frame = (strength) => {
    const cuts = [0, ...Array.from({ length: slices.length - 1 }, () => rnd(4, 96)).sort((a, b) => a - b), 100];
    slices.forEach((el, i) => {
      const shift = Math.random() < 0.45 ? rnd(-1, 1) * rnd(6, 34) * strength : 0;
      el.style.clipPath = `inset(${cuts[i]}% 0 ${100 - cuts[i + 1]}% 0)`;
      el.style.transform = `translateX(${shift.toFixed(1)}px)`;
      el.style.opacity = "1";
    });
    base.style.opacity = "0";
    const dx = rnd(3, 11) * strength;
    const dy = rnd(-2, 2) * strength;
    red.style.opacity = String(rnd(0.45, 0.85));
    red.style.transform = `translate(${-dx}px, ${dy}px)`;
    cyan.style.opacity = String(rnd(0.45, 0.85));
    cyan.style.transform = `translate(${dx}px, ${-dy}px)`;
    logo.style.opacity = Math.random() < 0.15 ? String(rnd(0.35, 0.7)) : "";
  };
  const strength = Math.random() < 0.25 ? 1.6 : 1;
  const frames = Math.round(rnd(4, 9) * strength);
  let n = 0;
  const step = () => {
    if (!logo.isConnected) {
      schedule();
      return;
    }
    if (n++ < frames) {
      if (Math.random() < 0.2) reset();
      else frame(strength);
      setTimeout(step, rnd(35, 85));
    } else {
      reset();
      schedule();
    }
  };
  step();
}

/* ---------- Menu figures: cloth drift, tail, claw, crown, hover (all slow and subtle) ---------- */
// Coordinates in each figure's padded frame (pixels of its base image).
const MENU_FIGURES = {
  jesus: {
    side: "left",
    stage: { left: -34, top: 62, width: 836, srcW: 866 },
    files: ["base", "cloth", "head", "crown"],
    meta: {"W": 898, "H": 1229, "pad": 16, "head": {"x": 343, "y": 16, "w": 228, "h": 214}, "head_pivot": [425, 190], "eyes": [[462, 113, 16, 8]], "crown_y": 88, "crown": {"x": 364, "y": 16, "w": 205, "h": 88}},
    leanDeg: 0.4,
    feet: [420, 1150],
    clothAmp: 1.3,
  },
  satan: {
    side: "right",
    stage: { left: 1006, top: 78, width: 716, srcW: 747 },
    files: ["base", "cloth", "head", "claw", "tailA", "tailB"],
    meta: {"W": 779, "H": 1206, "pad": 16, "head": {"x": 222, "y": 16, "w": 247, "h": 229}, "claw": {"x": 271, "y": 216, "w": 115, "h": 128}, "tailA": {"x": 500, "y": 600, "w": 44, "h": 169}, "tailB": {"x": 528, "y": 754, "w": 115, "h": 172}, "head_pivot": [350, 205], "claw_pivot": [282, 312], "tailA_pivot": [500, 600], "tailB_pivot": [519, 745], "eyes": [[323, 106, 15, 10], [303, 143, 16, 11]]},
    leanDeg: -0.4,
    feet: [330, 1130],
    clothAmp: 1.1,
  },
};

function menuFigureSrc(name, file) {
  return `assets/ui/menu/${name}-${file}${file === "cloth" ? ".png" : ".webp"}`;
}

function renderMenuFigure(name) {
  const f = MENU_FIGURES[name];
  const m = f.meta;
  const P = m.pad;
  const k = f.stage.width / f.stage.srcW;
  const part = (key, cls = key) => m[key]
    ? `<img class="fig-part fig-${cls}" src="${menuFigureSrc(name, key)}" alt="" style="left:${m[key].x}px;top:${m[key].y}px;width:${m[key].w}px;height:${m[key].h}px">`
    : "";
  const origin = (p) => `transform-origin:${p[0] + P}px ${p[1] + P}px`;
  const tail = m.tailA ? `
      <div class="fig-group fig-tailA-group" style="${origin(m.tailA_pivot)}">
        ${part("tailA")}
        <div class="fig-group fig-tailB-group" style="${origin(m.tailB_pivot)}">${part("tailB")}</div>
      </div>` : "";
  const claw = m.claw ? `<div class="fig-group fig-claw-group" style="${origin(m.claw_pivot)}">${part("claw")}</div>` : "";
  const crown = m.crown ? part("crown", "crown-shimmer") : "";
  // eyes that light up while the pointer is on the figure (Jesus yellow, Satan red; see bindMenuFigureTriggers)
  const eyeBox = `left:${m.head.x}px;top:${m.head.y}px;width:${m.head.w}px;height:${m.head.h}px`;
  // Satan's eyes also get a soft bloom layer that breathes while they glow
  const eyes = `<img class="fig-part fig-eyes" src="assets/ui/menu/${name}-eyes.webp" alt="" style="${eyeBox}">` +
    (name === "satan" ? `<img class="fig-part fig-eyes-bloom" src="assets/ui/menu/${name}-eyes.webp" alt="" style="${eyeBox}">` : "");
  return `
    <div class="menu-fig menu-fig-${name}" data-fig="${name}"
         style="left:${f.stage.left - P * k}px;top:${f.stage.top - P * k}px;width:${m.W}px;height:${m.H}px;transform:scale(${k})">
      <div class="fig-lean" style="transform-origin:${f.feet[0] + P}px ${f.feet[1] + P}px">
        <div class="fig-live">
          <img class="fig-base-img" src="${menuFigureSrc(name, "base")}" alt="">
          <canvas class="fig-cloth" width="${m.W}" height="${m.H}"></canvas>
          ${tail}
          ${claw}
          <div class="fig-group fig-head-group" style="${origin(m.head_pivot)}">
            ${part("head")}
            ${eyes}
            ${crown}
          </div>
        </div>
      </div>
    </div>`;
}

/* ---- runtime ---- */
const menuFigState = { started: false, rigs: {}, raf: 0, last: 0, hoverBound: false };
const figRnd = (a, b) => a + Math.random() * (b - a);
const figEase = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

function initMenuFigures(reduceMotion) {
  for (const name of Object.keys(MENU_FIGURES)) {
    const el = document.querySelector(`.menu-fig-${name}`);
    if (!el) continue;
    const prev = menuFigState.rigs[name];
    if (prev && prev.el === el) continue; // same live figure moved into the new menu: keep it as is
    // free the WebGL context of the figure from the previous render
    if (prev && prev.gl && prev.el !== el) {
      const lose = prev.gl.gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    }
    const rig = {
      name, el, cfg: MENU_FIGURES[name],
      lean: el.querySelector(".fig-lean"),
      live: el.querySelector(".fig-live"),
      head: el.querySelector(".fig-head-group"),
      claw: el.querySelector(".fig-claw-group"),
      tailA: el.querySelector(".fig-tailA-group"),
      tailB: el.querySelector(".fig-tailB-group"),
      // keep timers/state across menu re-renders
      flick: prev ? prev.flick : { start: -1 },
      curl: prev ? prev.curl : { start: -1 },
    };
    rig.gl = reduceMotion ? null : setupClothGL(rig);
    if (!rig.gl) el.querySelector(".fig-cloth").style.display = "none";
    else el.querySelector(".fig-base-img").style.visibility = "hidden";
    menuFigState.rigs[name] = rig;
  }
  bindMenuFigureHover();
  if (reduceMotion) return;
  if (!menuFigState.raf) menuFigState.raf = requestAnimationFrame(menuFigureFrame);
  if (menuFigState.started) return;
  menuFigState.started = true;
  scheduleFig("flick", () => { menuFigState.rigs.satan && (menuFigState.rigs.satan.flick.start = performance.now() / 1000); }, 14000, 26000);
  scheduleFig("curl", () => { menuFigState.rigs.satan && (menuFigState.rigs.satan.curl.start = performance.now() / 1000); }, 11000, 20000);
}

function scheduleFig(kind, fn, min, max) {
  const loop = () => {
    if (!document.hidden && document.querySelector(".menu-fig")) fn();
    setTimeout(loop, figRnd(min, max));
  };
  setTimeout(loop, figRnd(min * 0.4, max * 0.6));
}

function menuFigureFrame(now) {
  const t = now / 1000;
  let any = false;
  for (const rig of Object.values(menuFigState.rigs)) {
    if (!rig.el.isConnected) continue;
    any = true;
    if (rig.gl) drawCloth(rig, t);
    if (rig.tailA) {
      const fp = t - rig.flick.start;
      const flick = rig.flick.start > 0 && fp < 5 ? Math.sin(fp * 2.6) * Math.exp(-fp * 0.9) * 6 : 0;
      rig.tailA.style.transform = `rotate(${(1.1 * Math.sin(t * 0.3) + flick * 0.25).toFixed(2)}deg)`;
      rig.tailB.style.transform = `rotate(${(2.4 * Math.sin(t * 0.3 - 1.1) + flick).toFixed(2)}deg)`;
    }
    if (rig.claw) {
      const cp = t - rig.curl.start;
      let c = 0;
      if (rig.curl.start > 0 && cp < 7.5) c = cp < 2.2 ? figEase(cp / 2.2) : cp < 3.6 ? 1 : 1 - figEase((cp - 3.6) / 3.9);
      const idle = Math.sin(t * 0.45) * 0.35;
      rig.claw.style.transform = `rotate(${(-3 * c + idle).toFixed(2)}deg) scale(${(1 - 0.015 * c).toFixed(3)}, ${(1 - 0.025 * c).toFixed(3)})`;
    }
  }
  // stop animating once the menu is gone; initMenuFigures restarts it
  menuFigState.raf = any ? requestAnimationFrame(menuFigureFrame) : 0;
}


function bindMenuFigureHover() {
  if (menuFigState.hoverBound) return;
  menuFigState.hoverBound = true;
  const set = (btn) => {
    const action = btn ? (btn.dataset.menuAction || btn.dataset.go || "") : "";
    for (const rig of Object.values(menuFigState.rigs)) {
      if (!rig.el.isConnected) continue;
      rig.el.classList.toggle("leaning", !!btn);
      rig.el.classList.toggle("favored", (rig.name === "jesus" && action === "play") || (rig.name === "satan" && action === "quit"));
    }
  };
  document.addEventListener("pointerover", (e) => {
    const btn = e.target.closest && e.target.closest(".main-menu .menu-button");
    set(btn);
  });
  document.addEventListener("focusin", (e) => {
    const btn = e.target.closest && e.target.closest(".main-menu .menu-button");
    set(btn);
  });
}

/* ---- cloth & hair drift (WebGL displacement, weighted so face/hands/feet never move) ---- */
function setupClothGL(rig) {
  const canvas = rig.el.querySelector(".fig-cloth");
  let gl;
  try { gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }); } catch (e) { gl = null; }
  if (!gl) return null;
  const vs = `attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position = vec4(p,0.,1.); }`;
  const fs = `precision mediump float; varying vec2 uv; uniform sampler2D tex; uniform sampler2D wt; uniform vec2 size; uniform float t; uniform float amp;
    void main(){
      vec2 px = uv * size;
      float w = texture2D(wt, uv).r;
      float sway = sin(px.y * 0.035 + t * 1.5 + sin(px.x * 0.012 + t * 0.4) * 1.5);
      float flutter = sin(px.y * 0.11 - t * 3.1 + px.x * 0.02) * 0.35;
      vec2 off = w * vec2((sway + flutter) * amp, sin(px.x * 0.05 + t * 1.2) * amp * 0.35);
      gl_FragColor = texture2D(tex, (px + off) / size);
    }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const state = { gl, prog, ready: 0, uT: gl.getUniformLocation(prog, "t"), amp: rig.cfg.clothAmp };
  gl.uniform2f(gl.getUniformLocation(prog, "size"), canvas.width, canvas.height);
  gl.uniform1f(gl.getUniformLocation(prog, "amp"), rig.cfg.clothAmp);
  const load = (file, unit, uniform) => {
    const img = new Image();
    img.onload = () => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      } catch (err) {
        // e.g. game opened straight from disk (file://): fall back to the still drawing
        state.failed = true;
        canvas.style.display = "none";
        const still = rig.el.querySelector(".fig-base-img");
        if (still) still.style.visibility = "";
        return;
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.useProgram(prog); gl.uniform1i(gl.getUniformLocation(prog, uniform), unit);
      state.ready++;
    };
    img.src = menuFigureSrc(rig.name, file);
  };
  load("base", 0, "tex");
  load("cloth", 1, "wt");
  return state;
}

function drawCloth(rig, t) {
  const s = rig.gl;
  if (s.failed || s.ready < 2) return;
  const gl = s.gl;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(s.uT, (t + (rig.name === "satan" ? 17.3 : 0)) * 0.4);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
