function render() {
  updateFullscreenLayoutClass();
  const app = document.querySelector("#app");
  app.className = `app ${state.mode === "pvp" ? "pvp-app" : ""} ${state.mode === "menu" ? "menu-app" : ""}`;
  app.innerHTML = state.mode === "menu" ? renderMenuApp() : state.mode === "pvp" ? renderPvpApp() : renderArcadeApp();
  bindEvents();
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
      <section class="main-menu-panel">
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
      <button class="menu-button secondary-menu-button" data-menu-action="play">Back</button>
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
      <button class="menu-button" data-menu-action="sound-options">Sound Settings</button>
      <button class="menu-button" data-menu-action="records">Records</button>
      <button class="menu-button secondary-menu-button" data-menu-action="back">Back</button>
    </div>
  `;
}

function renderSoundOptionsMenu() {
  return `
    <div class="options-menu">
      ${renderSoundSettings("menu")}
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
      <div class="records-list">${rows}</div>
      <button class="menu-button secondary-menu-button" data-menu-action="options">Back</button>
    </div>
  `;
}

function renderSoundSettings(prefix) {
  const musicValue = Math.round(state.sound.musicVolume * 100);
  const sfxValue = Math.round(state.sound.sfxVolume * 100);
  const musicId = `${prefix}MusicVolume`;
  const sfxId = `${prefix}SfxVolume`;
  const muteId = `${prefix}SoundMuted`;
  return `
      <div class="sound-setting">
        <label for="${musicId}">Music</label>
        <input id="${musicId}" class="sound-slider" data-sound-setting="musicVolume" type="range" min="0" max="100" step="1" value="${musicValue}" />
        <strong data-sound-value="musicVolume">${musicValue}%</strong>
      </div>
      <div class="sound-setting">
        <label for="${sfxId}">Sfx</label>
        <input id="${sfxId}" class="sound-slider" data-sound-setting="sfxVolume" type="range" min="0" max="100" step="1" value="${sfxValue}" />
        <strong data-sound-value="sfxVolume">${sfxValue}%</strong>
      </div>
      <label class="sound-toggle">
        <input id="${muteId}" data-sound-setting="muted" type="checkbox" ${state.sound.muted ? "checked" : ""} />
        <span>Mute Sound</span>
      </label>
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
  if (isNativeArcadeApp() && state.pauseOpen) {
    return `
      <main class="pause-scene" aria-label="Paused game">
        ${renderPauseMenu()}
      </main>
      <div id="floatingTooltip" class="floating-tooltip" role="tooltip"></div>
    `;
  }
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
  return `<button class="mobile-offerings-button" id="mobileOfferingsToggle" aria-label="Open Devil's Offerings">Offerings</button>`;
}

function renderMobileOfferingsHeader() {
  if (!isMobileArcadeView()) return "";
  const playerSin = Math.max(0, Math.ceil(Number(state.player.credits) || 0));
  return `
    <div class="mobile-offerings-header">
      <div class="shop-title-wrap">
        <div class="panel-title">Devil's Offerings</div>
        <div class="elite-chance-label">${Math.round(eliteShopChance() * 100)}% ELITE</div>
      </div>
      <div class="mobile-offerings-sin">${formatNumber(playerSin)} SIN</div>
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

function roundRevealPlayerDisplay() {
  if (!roundRevealAnimationActive()) {
    return {
      hp: state.player.hp,
      credits: state.player.credits,
      lastDamage: state.playerLastDamage,
      lastHeal: state.playerLastHeal,
      lastCredits: state.playerLastCredits,
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
  const modeButton = state.mode === "pvp" ? "Arcade" : "PvP";
  const modeAction = state.mode === "pvp" ? "arcade" : "pvp";
  const modeSwitchButton = isNativeArcadeApp()
    ? ""
    : `<button class="primary-button" data-pause-action="${modeAction}">${modeButton}</button>`;
  return `
    <div class="overlay visible pause-overlay">
      <section class="end-card pause-card">
        <button class="small-button pause-dev-button" data-pause-action="dev">DEV</button>
        <h1 class="end-title">Paused</h1>
        <div class="pause-actions">
          <button class="primary-button" data-pause-action="resume">Resume</button>
          <button class="primary-button" data-pause-action="restart">Restart</button>
          ${modeSwitchButton}
          <button class="primary-button" data-pause-action="menu">Main Menu</button>
        </div>
        <div class="pause-sound-settings">
          ${renderSoundSettings("pause")}
        </div>
        ${state.pauseDevOpen ? renderSelfStackingDevPanel() : ""}
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

function renderPvpApp() {
  return `
    <main class="arena pvp-arena">
      ${renderPauseButton()}
      ${renderPvpTopbar()}
      ${renderPvpTargetPanel()}
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
  const slots = pvp.slots.length;
  return `
    <section class="topbar pvp-topbar" aria-label="PvP status">
      <div class="stat-card">
        <span class="stat-label">Mode</span>
        <span class="stat-value">PvP</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Round</span>
        <span class="stat-value">${pvp.round || "-"}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">${pvp.stage === "lobby" ? "Seats" : "Alive"}</span>
        <span class="stat-value">${pvp.stage === "lobby" ? slots : `${alive}/${slots}`}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Stage</span>
        <span class="stat-value">${pvp.stage}</span>
      </div>
    </section>
  `;
}

function renderPvpTargetPanel() {
  const pvp = state.pvp;
  const shownTarget = pvp.finalTarget !== null ? pvp.finalTarget : pvp.baseTarget !== null ? pvp.baseTarget : "?";
  const previous = pvp.previousTarget !== null ? pvp.previousTarget : "?";
  const base = pvp.baseTarget !== null ? pvp.baseTarget : "?";
  const final = pvp.finalTarget !== null ? pvp.finalTarget : "?";
  return `
    <section class="target-panel pvp-target-panel" aria-label="PvP target">
      <div class="target-value">
        <span class="stat-label">Target</span>
        <strong>${shownTarget}</strong>
      </div>
      <div class="target-detail">
        <div class="target-line target-previous">Previous: <strong>${previous}</strong></div>
        <div class="target-line target-modifier">Modifier: <strong>${pvp.modifier.toFixed(1)}</strong></div>
        <div>First: ${base}</div>
        <div>Final: ${final}</div>
      </div>
    </section>
  `;
}

function renderPvpSlots() {
  return `
    <section class="bot-grid pvp-grid" aria-label="PvP slots">
      ${state.pvp.slots.map((participant, slot) => renderPvpSlot(participant, slot)).join("")}
    </section>
  `;
}

function renderPvpSlot(participant, slot) {
  const canEditLobby = state.pvp.stage === "lobby";
  const removeButton = canEditLobby
    ? `<button class="small-button pvp-slot-remove" data-pvp-remove-slot="${slot}">${participant ? "Remove" : "Remove Slot"}</button>`
    : "";
  if (!participant) {
    return `
      <article class="bot-card pvp-slot empty-pvp-slot">
        <div class="bot-face empty-face"><span class="bot-mouth"></span></div>
        <div class="bot-title"><div class="bot-name">Empty Slot ${slot + 1}</div></div>
        <div class="bot-type">Waiting for phone player</div>
        <div class="empty-state">Becomes DAMNED when Ready is pressed</div>
        ${removeButton}
      </article>
    `;
  }
  const downClass = participant.eliminated ? "eliminated" : "";
  const damageTooltip = sourceTooltip(participant.damageSources, "damage");
  const damageBadge =
    participant.lastDamage > 0
      ? `<div class="damage-badge pvp-damage-badge" ${damageTooltip ? `data-tooltip="${escapeAttr(damageTooltip)}"` : ""}>-${participant.lastDamage}</div>`
      : "";
  const isGuessPhase = state.pvp.stage === "guess";
  const isDown = participant.eliminated || participant.hp <= 0;
  const allActivesReady = state.pvp.stage !== "active" || pvpAllActivesReady();
  const guessText = isDown
    ? "X"
    : isGuessPhase
      ? Number.isFinite(participant.guess)
        ? "Ready"
        : "--"
      : Number.isFinite(participant.guess)
        ? participant.guess
        : "--";
  const guessLabel = isGuessPhase ? "Status" : "First Guess";
  const pvpTargetForColor = state.pvp.finalTarget !== null ? state.pvp.finalTarget : state.pvp.baseTarget;
  const guessForColor = !isGuessPhase && !isDown && Number.isFinite(participant.guess) ? participant.guess : null;
  const guessCloseness = guessClosenessAttrs(guessForColor, pvpTargetForColor, participant.critical);
  const criticalClass = participant.critical ? "critical-guess" : "";
  const guessClass = [criticalClass, guessCloseness.className].filter(Boolean).join(" ");
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
  return `
    <article class="bot-card pvp-slot ${downClass}" style="--bot-color: ${participant.color || "var(--cyan)"}">
      <div class="bot-face">${faceInner}</div>
      <div class="bot-title">
        <div class="bot-name" title="${escapeAttr(participant.name)}">${participant.name}</div>
      </div>
      <div class="bot-type">${participant.human ? "Phone Player" : "DAMNED"}</div>
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
          <span>Health ${participant.hp}/${participant.maxHp}</span>
          <div class="health-bar">
            <div class="health-fill" style="width: ${(participant.hp / participant.maxHp) * 100}%"></div>
          </div>
        </div>
      </div>
      ${removeButton}
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

function renderPvpLobbyConsole() {
  const joinUrl = pvpJoinUrl();
  const slotCount = state.pvp.slots.length;
  const addSlotDisabled = slotCount >= PVP_MAX_SLOT_COUNT ? "disabled" : "";
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">PvP Lobby</div>
          <div class="panel-subtitle">${slotCount} slots. Phone URL: ${escapeHtml(joinUrl)}</div>
        </div>
      </div>
      <div class="pvp-console-body">
        <div class="console-row">
          <input id="pvpLocalName" class="guess-input pvp-name-input" type="text" maxlength="16" placeholder="Local test name" />
          <button class="primary-button" id="pvpAddLocal">Add</button>
        </div>
        <div class="pvp-lobby-actions">
          <button class="small-button" id="pvpAddSlot" ${addSlotDisabled}>Add Slot</button>
          <button class="primary-button" id="pvpReadyLobby">Ready</button>
        </div>
        ${renderPvpLog()}
      </div>
    </section>
  `;
}

function renderPvpGuessConsole() {
  const humans = pvpHumanParticipants();
  const aliveCount = pvpAliveParticipants().length;
  const readyCount = pvpAliveParticipants().filter((participant) => Number.isFinite(participant.guess)).length;
  const allReady = readyCount === aliveCount;
  const autoText = state.pvp.waitForHost
    ? "Waiting for host signal."
    : allReady
      ? "Auto-revealing now."
      : "Auto-reveals when everyone is ready.";
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Guess Phase</div>
          <div class="panel-subtitle">${readyCount}/${aliveCount} ready. ${autoText}</div>
        </div>
        ${renderPvpPhaseActions(`<button class="primary-button" id="pvpRevealTarget" ${allReady ? "" : "disabled"}>Reveal</button>`)}
      </div>
      <div class="pvp-console-body pvp-local-controls">
        ${humans
          .map(
            (participant) => {
              const ready = Number.isFinite(participant.guess);
              if (participant.remoteId || ready) {
                return `
                  <div class="pvp-local-row pvp-ready-row">
                    <span>${participant.name}</span>
                    <strong class="${ready ? "good" : "warning"}">${ready ? "Ready" : "Waiting"}</strong>
                    <span></span>
                  </div>
                `;
              }
              return `
                <div class="pvp-local-row">
                  <span>${participant.name}</span>
                  <input class="guess-input pvp-small-input" id="pvpGuess-${participant.slot}" type="number" min="0" max="100" />
                  <button class="small-button" data-pvp-save-guess="${participant.slot}">Lock</button>
                </div>
              `;
            }
          )
          .join("")}
        ${renderPvpLog()}
      </div>
    </section>
  `;
}

function renderPvpActiveConsole() {
  const humans = pvpHumanParticipants();
  const targets = pvpAliveParticipants();
  const alive = pvpAliveParticipants();
  const readyCount = alive.filter((participant) => Boolean(participant.activeChoiceId)).length;
  const allReady = readyCount === alive.length;
  const autoText = state.pvp.waitForHost
    ? "Waiting for host signal."
    : allReady
      ? "Auto-ready now."
      : "Auto-readies when everyone chooses.";
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Artifact Phase</div>
          <div class="panel-subtitle">${readyCount}/${alive.length} ready. ${autoText}</div>
        </div>
        ${renderPvpPhaseActions(`<button class="primary-button" id="pvpResolveActives" ${allReady ? "" : "disabled"}>Ready</button>`)}
      </div>
      <div class="pvp-console-body">
        ${humans
          .map((participant) => renderPvpActiveControl(participant, targets, allReady))
          .join("")}
        ${renderPvpLog()}
      </div>
    </section>
  `;
}

function renderPvpActiveControl(participant, targets, allReady) {
  const ready = Boolean(participant.activeChoiceId);
  if (allReady) {
    return `
      <div class="pvp-local-row pvp-ready-row">
        <span>${participant.name}</span>
        <strong>${pvpActiveChoiceLabel(participant)}</strong>
        <span></span>
      </div>
    `;
  }
  if (participant.remoteId || ready) {
    return `
      <div class="pvp-local-row pvp-ready-row">
        <span>${participant.name}</span>
        <strong class="${ready ? "good" : "warning"}">${ready ? "Ready" : "Waiting"}</strong>
        <span></span>
      </div>
    `;
  }
  return `
    <div class="pvp-choice-block">
      <strong>${participant.name}</strong>
      <div class="pvp-active-options">
        ${pvpSelectableActives(participant).map((active) => renderPvpActiveOption(participant, active, targets)).join("")}
      </div>
    </div>
  `;
}

function pvpActiveChoiceLabel(participant) {
  const active = participant.activeChoiceId ? pvpActiveById(participant.activeChoiceId) : null;
  if (!active) return "--";
  if (!participant.activeTargetId) return active.name;
  const target = state.pvp.slots.find((candidate) => candidate?.id === participant.activeTargetId);
  return target ? `${active.name}: ${target.name}` : active.name;
}

function renderPvpActiveOption(participant, active, targets) {
  const selected = participant.activeChoiceId === active.id ? "selected" : "";
  const cast = selected && participant.activeCast ? "cast" : "";
  const targetSelect = active.needsTarget
    ? `
      <select class="pvp-target-select" data-pvp-target-for="${participant.slot}-${active.id}">
        <option value="">target</option>
        ${targets
          .filter((target) => target.id !== participant.id)
          .map((target) => {
            const guess = Number.isFinite(target.guess) ? ` - Guess ${target.guess}` : "";
            return `<option value="${target.id}" ${participant.activeTargetId === target.id ? "selected" : ""}>${target.name}${guess}</option>`;
          })
          .join("")}
      </select>
    `
    : "";
  return `
    <div class="pvp-active-option ${selected} ${cast}" data-tooltip="${escapeAttr(active.description)}">
      <button class="small-button" data-pvp-active-choice="${participant.slot}:${active.id}">${active.name}</button>
      ${targetSelect}
    </div>
  `;
}

function renderPvpSummaryConsole() {
  const autoText = state.pvp.waitForHost ? "Waiting for host signal." : "Next round starts automatically after 10 seconds.";
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Round ${state.pvp.round} Summary</div>
          <div class="panel-subtitle">Final target ${state.pvp.finalTarget}. ${autoText}</div>
        </div>
        ${renderPvpPhaseActions(`<button class="primary-button" id="pvpNextRound">Next Round</button>`)}
      </div>
      <div class="pvp-console-body">${renderPvpResults()}${renderPvpLog()}</div>
    </section>
  `;
}

function renderPvpPhaseActions(actionHtml) {
  const waitClass = state.pvp.waitForHost ? "active" : "";
  const waitText = state.pvp.waitForHost ? "Wait On" : "Wait";
  return `
    <div class="pvp-phase-actions">
      <button class="small-button wait-button ${waitClass}" id="pvpWaitToggle">${waitText}</button>
      ${actionHtml}
    </div>
  `;
}

function renderPvpEndedConsole() {
  return `
    <section class="pvp-console panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Winner</div>
          <div class="panel-subtitle">${state.pvp.winner || "No one"}</div>
        </div>
        <button class="primary-button" id="pvpRestart">Restart</button>
      </div>
      <div class="pvp-console-body">${renderPvpResults()}${renderPvpLog()}</div>
    </section>
  `;
}

function renderPvpResults() {
  if (!state.pvp.activeResults.length) return "";
  return `<div class="pvp-results">${state.pvp.activeResults.map((result) => `<div>${escapeHtml(normalizeGameText(result))}</div>`).join("")}</div>`;
}

function renderPvpLog() {
  if (!state.pvp.log.length) return "";
  return `<div class="pvp-log">${state.pvp.log.map((entry) => `<div>${escapeHtml(normalizeGameText(entry))}</div>`).join("")}</div>`;
}

function renderTopbar() {
  const playerDisplay = roundRevealPlayerDisplay();
  const playerDamageTooltip = sourceTooltip(playerDisplay.damageSources, "damage");
  const playerHealTooltip = sourceTooltip(playerDisplay.healSources, "heal");
  const playerCreditTooltip = sourceTooltip(playerDisplay.creditSources, "credits");
  const playerDamageBadge =
    playerDisplay.lastDamage > 0
      ? `<div class="player-damage-badge" ${playerDamageTooltip ? `data-tooltip="${escapeAttr(playerDamageTooltip)}"` : ""}>-${playerDisplay.lastDamage}</div>`
      : "";
  const playerHealBadge =
    playerDisplay.lastHeal > 0
      ? `<div class="player-heal-badge" ${playerHealTooltip ? `data-tooltip="${escapeAttr(playerHealTooltip)}"` : ""}>+${playerDisplay.lastHeal}</div>`
      : "";
  const playerCreditBadge =
    playerDisplay.lastCredits > 0
      ? `<div class="player-credit-badge" ${playerCreditTooltip ? `data-tooltip="${escapeAttr(playerCreditTooltip)}"` : ""}>+${playerDisplay.lastCredits} SIN</div>`
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
          <div class="health-fill" style="width: ${healthPercent}%"></div>
        </div>
      </div>
      <div class="stat-card round-wrap">
        <span class="stat-label">Round</span>
        <span class="stat-value">${state.round}</span>
        <button class="small-button round-skip-button" id="skipProgression" title="${escapeAttr(normalizeGameText(skipTitle))}" ${state.finalBossPhase || arcadeLocked ? "disabled" : ""}>SKIP</button>
      </div>
      <div class="stat-card">
        <span class="stat-label">KOs / BOSS</span>
        <span class="stat-value">${state.eliminations}/${state.bossKills}</span>
      </div>
      <div class="stat-card credit-wrap">
        ${playerCreditBadge}
        <span class="stat-label">SIN</span>
        <span class="stat-value">${playerDisplay.credits}</span>
        <button class="small-button ${playtestButtonClass}" id="playtestMoney" ${arcadeLocked ? "disabled" : ""}>INF</button>
      </div>
    </section>
  `;
}

function renderTargetPanel() {
  const round = state.roundState;
  const target = round && round.target !== null ? formatNumber(round.target) : "?";
  const previousTarget = state.previousTarget !== null ? formatNumber(state.previousTarget) : "?";
  const avg = round && round.tableAverage !== null ? formatNumber(round.tableAverage) : "average";
  const modifier = round ? formatModifier(round.targetModifier) : formatModifier(BASE_TARGET_MODIFIER);
  const offset = round ? round.targetOffset : 0;
  const calcAverage = `<span class="target-calc-average">${escapeHtml(avg)}</span>`;
  const calculation =
    round && round.target !== null
      ? `${calcAverage} x ${modifier} ${offset >= 0 ? "+" : "-"} ${Math.abs(offset)} = ${target}`
      : `${calcAverage} x ${modifier} ${offset >= 0 ? "+" : "-"} ${Math.abs(offset)}`;

  return `
    <section class="target-panel" aria-label="Target">
      <div class="target-value">
        <span class="stat-label">Target</span>
        <strong>${target}</strong>
      </div>
      <div class="target-detail">
        <div class="target-line target-previous">Previous: <strong>${previousTarget}</strong></div>
        <div class="target-line target-modifier">Modifier: <strong>${modifier}</strong></div>
        <div class="target-calc-line">Calc: ${calculation}</div>
      </div>
    </section>
  `;
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
  const isDown = display ? display.eliminated : bot.eliminated || bot.hp <= 0;
  const revealed = Number.isFinite(effective)
    ? formatNumber(effective)
    : state.stage !== "guess"
      ? "--"
      : bot.revealedByPassive
        ? bot.plannedGuess
        : "--";
  const rawNote =
    state.stage !== "guess" && submitted !== effective ? `Raw ${submitted}` : bot.revealedByPassive ? "Revealed" : "Guess";
  const memoryText = bot.memory.length ? `${bot.memory.length} rounds` : "No memory";
  const pickClass = pendingPick ? "pickable" : "";
  const freshClass = bot.fresh ? "fresh" : "";
  const bossClass = bot.isBoss ? "boss" : "";
  const diffMarkedClass = bot.diffMarkedByPlayer && !isDown ? "diff-marked" : "";
  const downClass = isDown ? "eliminated" : "";
  const deathCauseClass = bot.deathCause ? `death-${bot.deathCause}` : "";
  const faceClass = bot.isBoss ? "boss-face" : "";
  const passiveSummary = botPassiveSummary(bot);
  const hasVisiblePassive = passiveSummary && passiveSummary !== "No Seal";
  const typeLabel = normalizeGameText(hasVisiblePassive ? `${bot.isBoss ? "BOSS" : bot.type}: ${passiveSummary}` : bot.type);
  const passiveDescription = hasVisiblePassive ? botPassiveDescription(bot) : "";
  const removed = round?.removedBotIds.has(bot.id) ? "Jammed" : rawNote;
  const isCriticalGuess = round?.criticalHitKeys?.has(`bot-${bot.id}`);
  const criticalGuessClass = isCriticalGuess ? "critical-guess" : "";
  const criticalGuessLabelClass = isCriticalGuess ? "critical-guess-label" : "";
  const guessCloseness = guessClosenessAttrs(effective, round?.target, isCriticalGuess);
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
  const damageBadge =
    botLastDamage > 0 && state.stage !== "guess"
      ? `<div class="damage-badge" ${damageTooltip ? `data-tooltip="${escapeAttr(damageTooltip)}"` : ""}>-${botLastDamage}</div>`
      : "";
  const healBadge =
    botLastHeal > 0 && state.stage !== "guess"
      ? `<div class="heal-badge" ${healTooltip ? `data-tooltip="${escapeAttr(healTooltip)}"` : ""}>+${botLastHeal}</div>`
      : "";
  const sinBadge =
    botLastSinDelta && !bot.immortal
      ? `<div class="bounty-badge" ${sinTooltip ? `data-tooltip="${escapeAttr(sinTooltip)}"` : ""}>${botLastSinDelta > 0 ? "+" : ""}${botLastSinDelta} SIN</div>`
      : "";
  const memoryBadge =
    botLastMemoryDelta > 0
      ? `<div class="memory-badge" ${memoryTooltip ? `data-tooltip="${escapeAttr(memoryTooltip)}"` : ""}>+${botLastMemoryDelta}</div>`
      : "";
  const poisonStackBadge =
    (bot.poisonCounters || 0) > 0
      ? `<span class="poison-stack-label ${damageBadge ? "has-damage-badge" : ""}">Poison ${bot.poisonCounters}</span>`
      : "";
  const deathBadgeClass = bot.deathCause === "contract" ? "contract-badge" : "";
  const deathBadge = isDown && bot.deathNotice ? `<div class="death-badge ${deathBadgeClass}">${bot.deathNotice}</div>` : "";
  const markBadge = bot.markedByPlayer && !isDown ? `<div class="mark-badge">MARKED</div>` : "";
  const rewardLabel = botSinDisplay(bot);
  const flagHtml = bot.isBoss
    ? ""
    : `<span class="bot-flag" aria-label="${escapeAttr(bot.country)}" title="${escapeAttr(bot.country)}">${bot.flag}</span>`;
  const safeDisplayMaxHp = Math.max(1, displayMaxHp || 1);
  const displayDamageTaken = display?.damageTakenTotal ?? (bot.damageTakenTotal || 0);
  const healthLabel = bot.immortal ? `Damage ${displayDamageTaken}` : `HEALTH ${displayHp}/${displayMaxHp}`;
  const healthPercent = bot.immortal ? 100 : clamp((displayHp / safeDisplayMaxHp) * 100, 0, 100);
  const identitySwapBlocked = state.pendingActive?.id === "a7" && bot.isBoss;
  const shieldBlocked = pendingPick && botHasPassive(bot, "shield");
  const pickDisabled = isDown || identitySwapBlocked || shieldBlocked;
  const pickButton = pendingPick
    ? `<button class="pick-button" data-pick-bot="${bot.id}" ${pickDisabled ? "disabled" : ""}>${isDown ? "Down" : identitySwapBlocked ? "BOSS" : shieldBlocked ? "SEAL" : "Pick"}</button>`
    : "";
  const tooltipAttr = passiveDescription ? ` data-tooltip="${escapeAttr(passiveDescription)}"` : "";
  const faceInner = isDown
    ? bot.deathCause === "contract"
      ? `<span class="contract-mark">PC</span>`
      : `<span class="ko-x">X</span>`
    : `<img class="bot-image" src="${escapeAttr(botImagePath(bot))}" alt="" loading="lazy" />`;

  return `
    <article class="bot-card ${pickClass} ${freshClass} ${bossClass} ${diffMarkedClass} ${downClass} ${deathCauseClass}" style="--bot-color: ${bot.color}"${tooltipAttr}>
      ${deathBadge}
      ${markBadge}
      <div class="bot-face ${faceClass}">${faceInner}</div>
      <div class="bot-title">
        ${flagHtml}
        <div class="bot-name" title="${escapeAttr(normalizeGameText(`${bot.name} (${bot.country})`))}">${bot.name}</div>
        <div class="bot-reward" title="SIN">${rewardLabel}</div>
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
  const playerCritical = round?.criticalHitKeys?.has("player");
  const playerCloseness = guessClosenessAttrs(round?.playerEffectiveGuess, round?.target, playerCritical);
  const criticalInputClass = playerCritical ? "critical-guess" : "";
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
          <span class="reroll-cost">${currentRerollCost()} SIN</span>
          <button class="small-button" id="rerollShop" ${locked || actionsLocked ? "disabled" : ""}>Reroll</button>
        </div>
      </div>
      <div class="shop-slots">
        ${locked ? `<div class="shop-lock-message">Satan has sealed Devil's Offerings.</div>` : state.shop.map((slot, index) => renderShopSlot(slot, index)).join("")}
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
  const buttonText = ownedSelfStackingSeal ? "Owned" : passiveCopies ? `Upgrade ${cost} SIN` : full ? "Full" : `Buy ${cost} SIN`;
  const previewItem = ownedSelfStackingSeal ? passiveEntry(item.id) || item : passiveCopies ? { ...item, stack: passiveCopies + 1 } : item;
  const displayName = passiveCopies ? passiveDisplayName(previewItem) : item.name;
  const description = itemDescription(previewItem);
  const itemImage =
    item.type === "passive" ? renderSealSigil(previewItem, "shop-seal-sigil") : renderArtifactIcon(previewItem, "shop-artifact-icon");
  const imageClass = itemImage ? `has-item-icon ${item.type === "passive" ? "has-seal-sigil" : "has-artifact-icon"}` : "";
  const kindLabel = item.type === "passive" ? (SATAN_SEAL_IDS.has(item.id) ? "SATAN SEAL" : "SEAL") : "ARTIFACT";

  return `
    <article class="item-card ${item.type} ${imageClass}" data-tooltip="${escapeAttr(description)}">
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
    <article class="item-card active ${itemImage ? "has-item-icon has-artifact-icon" : ""}" data-tooltip="${escapeAttr(description)}">
      ${itemImage}
      <div class="item-top">
        <div>
          <div class="item-name">${item.name}</div>
          ${memoryLine}
          <div class="price">Sell ${sale} SIN</div>
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
    const triggeredClass = roundRevealAnimationActive()
      ? revealStep?.id === item.id
        ? "triggered"
        : ""
      : state.roundState?.triggeredPassiveIds?.has(item.id)
        ? "triggered"
        : "";
    const suppressedClass = isSealSuppressed(item.id) ? "suppressed" : "";
    const counterBadge = item.id === "p39" ? `<div class="passive-counter">Stacks ${item.counter || 0}</div>` : "";
    const sealImage = renderSealSigil(item, "equipped-seal-sigil");
    const sellDisabled = arcadeActionLocked() ? "disabled" : "";
    const wideClass = slotCost > 1 ? "wide-seal-slot" : "";
    slots.push(`
      <article class="passive-slot ${wideClass} ${triggeredClass} ${revealClass} ${suppressedClass}" data-tooltip-html="${escapeAttr(tooltip)}">
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
  return `
    <div class="overlay visible">
      <section class="end-card">
        <h1 class="end-title">Game Over</h1>
        <p class="end-copy">You reached round ${state.round} with ${state.eliminations} eliminations.</p>
        <div class="end-actions">
          <button class="primary-button" id="inspectGame">Inspect</button>
          <button class="primary-button" id="restartGame">Restart</button>
        </div>
      </section>
    </div>
  `;
}

function renderPentakillPopup() {
  if (!state.roundState?.pentakillPopup) return "";
  return `<div class="pentakill-popup" aria-live="polite">PENTAKILL</div>`;
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
    state.menuScreen = "play";
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

function updateSoundSetting(key, value, renderAfter = true) {
  if (key === "muted") {
    state.sound.muted = Boolean(value);
  } else if (key in state.sound) {
    state.sound[key] = clamp(Number(value) / 100, 0, 1);
  }
  saveSoundSettings();
  applySoundSettings();
  if (renderAfter) render();
}

function handlePauseAction(action) {
  if (action === "dev") {
    state.pauseDevOpen = !state.pauseDevOpen;
    render();
    return;
  }
  if (action === "resume") {
    state.pauseOpen = false;
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

function renderMenuBackdrop() {
  return `
      <div class="menu-backdrop" aria-hidden="true">
        <svg width="0" height="0" style="position:absolute">
          <filter id="menuGlitchRed" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
          <filter id="menuGlitchCyan" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter>
        </svg>
        <div class="menu-stage">
          <div class="menu-bg-spin"><img class="menu-bg-img" src="assets/ui/menu/menu-bg-spin.jpg" alt=""></div>
          <img class="menu-door" src="assets/ui/menu/menu-door.webp" alt="">
          ${renderMenuFigure("jesus")}
          ${renderMenuFigure("satan")}
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
