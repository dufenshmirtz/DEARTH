// t() comes from controller-i18n.js (the game's translation layer); without that file the phone stays in English
// eslint-disable-next-line no-var
var t = typeof t === "function" ? t : (text, params) => String(text).replace(/\{(\w+)\}/g, (match, name) => (params && name in params ? String(params[name]) : match));

const STORAGE_ID = "dearthPvpPlayerId";
const STORAGE_NAME = "dearthPvpPlayerName";
const GUESS_SFX_SRC = "assets/audio/Guess.mp3";
const READY_SFX_SRC = "assets/audio/Ready.mp3";
const CLOCK_TICK_SFX_SRCS = [
  "assets/audio/tickinclock_RdeIBkld.mp3",
  "assets/audio/tickinclock_N3shRVgw.mp3"
];
const GUESS_SFX_VOLUME = 0.9;
const READY_SFX_VOLUME = 0.2;
const CLOCK_TICK_SFX_VOLUME = 0.154;

let guessSfx = null;
let readySfx = null;
let clockTickSfx = [];
let nextClockTickIndex = 0;
const activeClockTickInstances = new Set();

function ensureButtonSfx() {
  if (!guessSfx) {
    guessSfx = new Audio(GUESS_SFX_SRC);
    guessSfx.preload = "auto";
    guessSfx.volume = GUESS_SFX_VOLUME;
  }
  if (!readySfx) {
    readySfx = new Audio(READY_SFX_SRC);
    readySfx.preload = "auto";
    readySfx.volume = READY_SFX_VOLUME;
  }
  CLOCK_TICK_SFX_SRCS.forEach((src, index) => {
    if (!clockTickSfx[index]) {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = CLOCK_TICK_SFX_VOLUME;
      try {
        audio.load();
      } catch (error) {}
      clockTickSfx[index] = audio;
    }
  });
}

function playOneShot(audio, startOffset = 0) {
  if (!audio) return;
  audio.currentTime = Math.max(0, startOffset);
  const playback = audio.play();
  if (playback && typeof playback.catch === "function") playback.catch(() => {});
}

function playClonedOneShot(audio, volume) {
  if (!audio) return;
  try {
    const instance = audio.cloneNode(true);
    instance.volume = volume;
    activeClockTickInstances.add(instance);
    const cleanup = () => activeClockTickInstances.delete(instance);
    instance.addEventListener("ended", cleanup, { once: true });
    instance.addEventListener("error", cleanup, { once: true });
    const playback = instance.play();
    if (playback && typeof playback.catch === "function") playback.catch(cleanup);
  } catch (error) {}
}

function playGuessSfx() {
  ensureButtonSfx();
  playOneShot(guessSfx);
}

function playReadySfx() {
  ensureButtonSfx();
  playOneShot(readySfx);
}

function playClockTickSfx() {
  ensureButtonSfx();
  const tickIndex = nextClockTickIndex % CLOCK_TICK_SFX_SRCS.length;
  nextClockTickIndex = (nextClockTickIndex + 1) % CLOCK_TICK_SFX_SRCS.length;
  playClonedOneShot(clockTickSfx[tickIndex], CLOCK_TICK_SFX_VOLUME);
}


const controllerState = {
  player: localStorage.getItem(STORAGE_ID)
    ? {
        id: localStorage.getItem(STORAGE_ID),
        name: localStorage.getItem(STORAGE_NAME) || "Player"
      }
    : null,
  room: null,
  // the server's clock when the room arrived, and ours then: the host's clock deadline is in the server's time
  serverNow: null,
  receivedAt: 0,
  message: "",
  draftName: "",
  draftGuess: "",
  draftActiveTargets: {},
  lastRound: null,
  lastStage: null,
  lastGame: null,
  renderedKey: "",
  lastCastSignal: null,
  rulesOpen: false
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function normalizeGameText(value) {
  return String(value ?? "")
    // HEALTH is called SOUL (old texts kept in saved runs still say HEALTH)
    .replace(/\bhealth\b/gi, "SOUL")
    .replace(/\bnon-bosses\b/gi, "non-boss DAMNED")
    .replace(/\bnon-boss\b/gi, "non-boss")
    .replace(/\bsinners\b/gi, "DAMNED")
    .replace(/\bsinner\b/gi, "DAMNED")
    .replace(/\bbots\b/gi, "DAMNED")
    .replace(/\bbot\b/gi, "DAMNED")
    .replace(/\bbosses\b/gi, (match, offset, text) => (text[offset - 1] === "-" ? "bosses" : "BOSSES"))
    .replace(/\bboss\b/gi, (match, offset, text) => (text[offset - 1] === "-" ? "boss" : "BOSS"))
    .replace(/\bartifacts\b/gi, "ARTIFACTS")
    .replace(/\bartifact\b/gi, "ARTIFACT")
    .replace(/\bseals\b/gi, "SEALS")
    .replace(/\bseal\b/gi, "SEAL");
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || "Request failed");
  return data;
}

function hostState() {
  return controllerState.room?.hostState || null;
}

function remotePlayer() {
  if (!controllerState.player || !controllerState.room) return null;
  return controllerState.room.players.find((player) => player.id === controllerState.player.id) || null;
}

function hostPlayer() {
  const host = hostState();
  if (!controllerState.player || !host) return null;
  return host.players.find((player) => player?.id === controllerState.player.id) || null;
}

function aliveTargets() {
  const host = hostState();
  if (!host) return [];
  return host.players.filter((player) => player && !player.eliminated && player.id !== controllerState.player?.id);
}

function activeIconHtml(active, className = "artifact-icon") {
  if (!active?.icon) return "";
  return `<img class="${className}" src="${escapeAttr(encodeURI(active.icon))}" alt="" />`;
}

function playerActiveOption(player) {
  if (!player?.activeChoiceId) return null;
  return player.activeOptions?.find((active) => active.id === player.activeChoiceId) || null;
}

function playerActiveName(player) {
  if (!player?.activeChoiceId) return "";
  return player.activeOptions?.find((active) => active.id === player.activeChoiceId)?.name || player.activeChoiceId;
}

// this phone already sent its guess / ARTIFACT for this round of this game
function guessSent(host = hostState(), remote = remotePlayer()) {
  return Boolean(host && remote && remote.guessGame === host.game && remote.guessRound === host.round && Number.isFinite(remote.guess));
}

function activeSent(host = hostState(), remote = remotePlayer()) {
  return Boolean(host && remote && remote.activeGame === host.game && remote.activeRound === host.round && remote.activeChoiceId);
}

function myGuess() {
  const host = hostState();
  const remote = remotePlayer();
  if (!host || host.stage === "lobby") return null;
  if (guessSent(host, remote)) return remote.guess;
  const player = hostPlayer();
  return Number.isFinite(player?.guess) ? player.guess : null;
}

// seconds left on the host's clock, or null when there is none
function clockSecondsLeft() {
  const host = hostState();
  if (!host || (host.stage !== "guess" && host.stage !== "active")) return null;
  if (Number.isFinite(host.phaseRemaining)) return Math.ceil(host.phaseRemaining / 1000);
  if (!Number.isFinite(host.phaseDeadline) || !Number.isFinite(controllerState.serverNow)) return null;
  const serverNow = controllerState.serverNow + (Date.now() - controllerState.receivedAt);
  return Math.max(0, Math.ceil((host.phaseDeadline - serverNow) / 1000));
}

function renderCastBanner(player) {
  if (!player?.activeResolved || !player.activeChoiceId) return "";
  if (player.activeChoiceId === "skip") {
    if (player.activeTimedOut) return `<div class="cast-banner cast-banner-skip"><strong>${t("TOO SLOW")}</strong><span>${t("No ARTIFACT this round.")}</span></div>`;
    return `<div class="cast-banner cast-banner-skip"><strong>${t("ARTIFACT SKIPPED")}</strong><span>${t("Your next ARTIFACT casts for sure.")}</span></div>`;
  }
  const name = escapeHtml(t(playerActiveName(player)));
  const icon = activeIconHtml(playerActiveOption(player), "artifact-icon banner-icon");
  return player.activeCast
    ? `<div class="cast-banner cast-banner-success">${icon}<strong>${t("ARTIFACT TRIGGERED")}</strong><span>${name}</span></div>`
    : `<div class="cast-banner cast-banner-fail">${icon}<strong>${t("ARTIFACT FAILED")}</strong><span>${name}</span></div>`;
}

function maybeVibrateCastResult() {
  const player = hostPlayer();
  const host = hostState();
  if (!player?.activeResolved || !player.activeChoiceId || player.activeChoiceId === "skip" || !host) return;
  const key = `${host.game}:${host.round}:${player.activeCast ? "cast" : "fail"}`;
  if (controllerState.lastCastSignal === key) return;
  controllerState.lastCastSignal = key;
  vibrate(player.activeCast ? [80, 60, 80] : 250);
}

function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (error) {}
}

function activeCastText(player) {
  if (!player?.activeResolved || !player.activeChoiceId) return "";
  if (player.activeChoiceId === "skip") return t(player.activeTimedOut ? "ran out of time" : "skipped ARTIFACT use");
  return player.activeCast ? t("{name} cast", { name: t(playerActiveName(player)) }) : t("{name} failed", { name: t(playerActiveName(player)) });
}

function mergeSourceEntries(sources) {
  const merged = new Map();
  (sources || []).forEach((entry) => {
    const amount = Math.max(0, Math.ceil(entry.amount || 0));
    if (amount <= 0) return;
    const source = entry.source || "Unknown";
    merged.set(source, (merged.get(source) || 0) + amount);
  });
  return Array.from(merged, ([source, amount]) => ({ source, amount }));
}

function sourceTooltip(sources, kind = "damage") {
  const sign = kind === "heal" ? "+" : "-";
  return mergeSourceEntries(sources)
    .map((entry) => t(normalizeGameText(`${sign}${entry.amount} SOUL from ${entry.source}`)))
    .join("\n");
}

function allActivesSubmitted(host) {
  return Boolean(
    host?.players
      ?.filter((player) => player && !player.eliminated)
      .every((player) => player.activeSubmitted || player.activeChoiceId)
  );
}

async function pollRoom() {
  try {
    const id = controllerState.player?.id;
    const response = await fetch(`/api/room${id ? `?id=${encodeURIComponent(id)}` : ""}`, { cache: "no-store" });
    controllerState.room = await response.json();
    controllerState.serverNow = Number(controllerState.room?.serverNow) || null;
    controllerState.receivedAt = Date.now();
    // the phone shows its text in the host's language (controller-i18n.js)
    const hostLanguage = controllerState.room?.hostState?.lang;
    if (hostLanguage && typeof setLanguage === "function" && hostLanguage !== currentLang()) setLanguage(hostLanguage);
    if (controllerState.player && !remotePlayer()) {
      localStorage.removeItem(STORAGE_ID);
      localStorage.removeItem(STORAGE_NAME);
      controllerState.message = "The table was reset. Join again.";
      controllerState.player = null;
    }
    const host = hostState();
    if (host) {
      const roundChanged = controllerState.lastRound !== host.round || controllerState.lastGame !== host.game;
      const stageChanged = controllerState.lastStage !== host.stage;
      if ((roundChanged || stageChanged) && controllerState.lastRound !== null) {
        controllerState.message = "";
        // a short buzz when it is this phone's turn to guess
        if (host.stage === "guess" && hostPlayer() && !hostPlayer().eliminated) vibrate(40);
      }
      if (roundChanged) {
        controllerState.draftGuess = "";
        controllerState.draftActiveTargets = {};
      }
      controllerState.lastRound = host.round;
      controllerState.lastGame = host.game;
      controllerState.lastStage = host.stage;
    }
    maybeVibrateCastResult();
    render();
  } catch {
    controllerState.message = "Cannot reach the host. Same Wi-Fi?";
    render(true);
  }
}

async function joinRoom() {
  const input = document.querySelector("#joinName");
  try {
    const data = await postJson("/api/join", { name: input?.value || controllerState.draftName });
    controllerState.player = data.player;
    localStorage.setItem(STORAGE_ID, data.player.id);
    localStorage.setItem(STORAGE_NAME, data.player.name);
    controllerState.message = "";
    await pollRoom();
  } catch (error) {
    controllerState.message = error.message;
    render(true);
  }
}

async function submitGuess() {
  const input = document.querySelector("#guessValue");
  const host = hostState();
  const rawGuess = (input ? input.value : controllerState.draftGuess || "").trim();
  const guess = Math.ceil(Number(rawGuess));
  if (!host || !rawGuess || !Number.isFinite(guess) || guess < 0 || guess > 100) {
    controllerState.message = "Enter a number from 0 to 100.";
    render(true);
    return;
  }
  playGuessSfx();
  try {
    await postJson("/api/player", {
      id: controllerState.player.id,
      guess,
      guessGame: host.game,
      guessRound: host.round
    });
    controllerState.message = "";
    controllerState.draftGuess = "";
    await pollRoom();
  } catch (error) {
    controllerState.message = error.message;
    render(true);
  }
}

async function submitActive(activeId) {
  const host = hostState();
  const active = hostPlayer()?.activeOptions.find((option) => option.id === activeId);
  const select = document.querySelector(`#target-${activeId}`);
  const targetId = select?.value || controllerState.draftActiveTargets[activeId] || null;
  if (active?.needsTarget && !targetId) {
    controllerState.message = "Choose a target first.";
    render(true);
    return;
  }
  playReadySfx();
  try {
    await postJson("/api/player", {
      id: controllerState.player.id,
      activeChoiceId: activeId,
      activeTargetId: targetId,
      activeGame: host.game,
      activeRound: host.round
    });
    controllerState.message = "";
    await pollRoom();
  } catch (error) {
    controllerState.message = error.message;
    render(true);
  }
}

// every win buys a face: a random Goetic BOSS, or an Archangel after enough wins
async function rerollFace(kind) {
  const remote = remotePlayer();
  if (!remote) return;
  try {
    await postJson("/api/player", {
      id: controllerState.player.id,
      rerollSeq: (remote.rerollSeq || 0) + 1,
      rerollKind: kind
    });
    await pollRoom();
  } catch (error) {
    controllerState.message = error.message;
    render(true);
  }
}

const WINS_MARK = `<svg class="wins-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12.4" r="9.6"/><path d="M12 21.9 6.4 4.7 20.9 15.3H3.1L17.6 4.7Z"/></svg>`;

function renderHeader() {
  const host = hostState();
  const player = hostPlayer();
  const guess = myGuess();
  const damageTooltip = sourceTooltip(player?.damageSources, "damage");
  const damageBadge =
    player?.lastDamage > 0
      ? `<span class="phone-damage-badge" title="${escapeAttr(damageTooltip)}">-${player.lastDamage}</span>`
      : "";
  const clock = clockSecondsLeft();
  const face = player?.image ? `<img class="phone-face" src="${escapeAttr(encodeURI(player.image))}" alt="" />` : "";
  const wins = player?.wins ? `<span class="phone-wins">${WINS_MARK}${player.wins}</span>` : "";
  return `
    <section class="panel">
      <div class="phone-title-row">
        ${face}
        <div class="phone-title">
          <h1>${escapeHtml(controllerState.player?.name || t("DEARTH PvP"))}</h1>
          ${wins}
        </div>
        <button class="rules-link" data-rules="open">${t("Rules")}</button>
      </div>
      <div class="stat-row">
        <div class="stat"><span>${t("Previous")}</span><strong>${host?.previousTarget ?? "?"}</strong></div>
        <div class="stat health-stat">${damageBadge}<span>${t("SOUL")}</span><strong>${player ? player.hp : "-"}</strong></div>
        <div class="stat"><span>${t("Modifier")}</span><strong>${host ? Number(host.modifier).toFixed(1) : "-"}</strong></div>
        <div class="stat"><span>${t("TARGET")}</span><strong>${host?.finalTarget ?? host?.baseTarget ?? "?"}</strong></div>
        <div class="stat guess-stat"><span>${t("Your Guess")}</span><strong>${guess ?? "-"}</strong></div>
        ${clock !== null ? `<div class="stat clock-stat ${clock <= 5 ? "clock-low" : ""}"><span>${t("Clock")}</span><strong data-phone-clock>${clock}</strong></div>` : ""}
      </div>
      ${host?.stage === "ended" ? "" : renderCastBanner(player)}
      ${host?.waitForHost ? `<p class="warning">${t("The host paused the game.")}</p>` : ""}
      ${player?.activeGuaranteeThisRound && host?.stage === "active" ? `<p class="cast">${t("Skip bonus ready: your ARTIFACT will cast for sure.")}</p>` : ""}
      ${player?.activeGuaranteeNextRound && host?.stage !== "ended" ? `<p class="cast">${t("Skip bonus armed for next round.")}</p>` : ""}
      ${controllerState.message ? `<p class="cast">${escapeHtml(t(normalizeGameText(controllerState.message)))}</p>` : ""}
    </section>
  `;
}

function renderJoin() {
  return `
    <section class="panel">
      <h1>${t("DEARTH PvP")}</h1>
      <p class="muted">${t("Enter your name to take a seat at the table.")}</p>
      <input id="joinName" type="text" maxlength="16" placeholder="${t("Your name")}" value="${escapeAttr(controllerState.draftName)}" />
      <button id="joinButton">${t("Join")}</button>
      ${controllerState.message ? `<p class="warning">${escapeHtml(t(controllerState.message))}</p>` : ""}
    </section>
    <section class="panel"><button class="secondary" data-rules="open">${t("Rules")}</button></section>
  `;
}

// faces bought with wins: shown between games and between rounds
function renderFacePanel() {
  const host = hostState();
  const player = hostPlayer();
  if (!host || !player || !(player.rerolls > 0)) return "";
  const archangel = player.wins >= (host.archangelWins || 8);
  return `
    <section class="panel">
      <h2>${t("A new face")}</h2>
      <p class="muted">${t("Every win buys a reroll of your face. Rerolls left: {count}", { count: player.rerolls })}</p>
      <button class="reroll-button" data-reroll="goetic">${t("Roll a demon")}</button>
      ${archangel ? `<button class="reroll-button" data-reroll="archangel">${t("Roll an Archangel")}</button>` : `<p class="muted">${t("{count} wins open the Archangels.", { count: host.archangelWins || 8 })}</p>`}
    </section>
  `;
}

function renderLobby() {
  const player = hostPlayer();
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>${t("Lobby")}</h2>
      <p class="muted">${t(player ? "You have a seat. The game begins when the host presses Start." : "Taking your seat at the table...")}</p>
    </section>
    ${renderFacePanel()}
  `;
}

function renderGuess() {
  const host = hostState();
  const submitted = guessSent(host);
  const readyText = host.waitForHost ? t("Ready.") : t("Ready. Guesses reveal automatically when everyone is ready.");
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>${t("Guess Phase")}</h2>
      <p class="muted">${submitted ? readyText : t("Submit a whole number from 0 to 100.")}</p>
      <input id="guessValue" type="number" inputmode="numeric" min="0" max="100" value="${submitted ? "" : escapeAttr(controllerState.draftGuess)}" ${submitted ? "disabled" : ""} />
      <button id="guessButton" ${submitted ? "disabled" : ""}>${t(submitted ? "Ready" : "Send Guess")}</button>
    </section>
  `;
}

function renderActiveChoice(active, submitted) {
  const targets = aliveTargets();
  const player = hostPlayer();
  const selected = player?.activeChoiceId === active.id;
  const castClass = selected && player?.activeCast ? "active-cast" : "";
  const targetValue = controllerState.draftActiveTargets[active.id] || player?.activeTargetId || "";
  const targetSelect = active.needsTarget
    ? `
      <select id="target-${active.id}" ${submitted ? "disabled" : ""}>
        <option value="">${t("target")}</option>
        ${targets
          .map((target) => {
            const guess = Number.isFinite(target.guess) ? ` - ${t("Guess {guess}", { guess: target.guess })}` : "";
            return `<option value="${target.id}" ${targetValue === target.id ? "selected" : ""}>${escapeHtml(target.name)}${guess}</option>`;
          })
          .join("")}
      </select>
    `
    : "";
  return `
    <div class="choice ${selected ? "selected-choice" : ""} ${castClass}">
      <div class="choice-head">
        ${activeIconHtml(active)}
        <div>
          <h2>${escapeHtml(t(active.name))}</h2>
          <p class="muted">${escapeHtml(t(normalizeGameText(active.description)))}</p>
        </div>
      </div>
      ${targetSelect}
      <button class="activeButton" data-active-id="${escapeAttr(active.id)}" ${submitted ? "disabled" : ""}>${t("Choose")}</button>
    </div>
  `;
}

function renderActive() {
  const host = hostState();
  const player = hostPlayer();
  const submitted = activeSent(host);
  const allReady = allActivesSubmitted(host);
  if (!player) return renderLobby();
  if (submitted && !allReady) {
    return `
      ${renderHeader()}
      <section class="panel">
        <h2>${t("ARTIFACT Phase")}</h2>
        <p class="muted">${t(host.waitForHost ? "Ready." : "Ready. ARTIFACTS resolve automatically when everyone is ready.")}</p>
        <button disabled>${t("Ready")}</button>
      </section>
    `;
  }
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>${t("ARTIFACT Phase")}</h2>
      <p class="muted">${t(host.waitForHost ? "Choose one ARTIFACT." : "Choose one ARTIFACT. The phase resolves automatically when everyone chooses.")}</p>
      ${player.activeOptions.map((active) => renderActiveChoice(active, submitted)).join("")}
      ${submitted ? `<p class="cast">${t("Choice sent. Watch the host screen to see if it casts.")}</p>` : ""}
    </section>
  `;
}

function renderReveal() {
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>${t("Reveal")}</h2>
      <p class="muted">${t("The ARTIFACTS answer one by one. Watch the table.")}</p>
    </section>
  `;
}

function renderResults() {
  const host = hostState();
  const results = host?.activeResults || [];
  const ended = host?.stage === "ended";
  const castRows = (host?.players || [])
    .filter((player) => player?.activeResolved && player.activeChoiceId)
    .map((player) => `<div class="${player.activeCast ? "active-cast" : ""}">${escapeHtml(player.name)}: ${escapeHtml(activeCastText(player))}</div>`)
    .join("");
  const won = ended && (host.winners || []).includes(controllerState.player?.id);
  const winner = ended
    ? `
      <div class="winner-block ${won ? "you-won" : ""}">
        <strong>${escapeHtml(won ? t("You won") : t("Winner: {name}", { name: host.winner }))}</strong>
        ${host.winReason?.text ? `<span>${escapeHtml(t(host.winReason.text, host.winReason.params || {}))}</span>` : ""}
      </div>
    `
    : `<p class="muted">${t(host?.waitForHost ? "Waiting for the next round." : "Next round starts automatically after 10 seconds.")}</p>`;
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>${t(ended ? "Game Over" : "Round Summary")}</h2>
      ${winner}
      ${ended ? `<p class="muted">${t("The host can start the next game with Play Again.")}</p>` : ""}
      <div class="results">
        ${castRows}
        ${results.map((result) => `<div>${escapeHtml(t(normalizeGameText(result)))}</div>`).join("")}
      </div>
    </section>
    ${renderFacePanel()}
  `;
}

function renderEliminated() {
  const host = hostState();
  if (host?.stage === "ended") return renderResults();
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>${t("Eliminated")}</h2>
      <p class="muted">${t("You are out. Watch the table: the last soul standing wins.")}</p>
    </section>
  `;
}

// the commandments, on one tablet
function renderRules() {
  const rules = hostState()?.rules || [];
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return `
    <section class="rules-layer">
      <div class="tablet">
        <h2>${t("The Commandments of the Table")}</h2>
        ${rules.length ? `<ol>${rules.map((line, index) => `<li><span class="numeral">${numerals[index] || index + 1}</span><span>${escapeHtml(t(normalizeGameText(line)))}</span></li>`).join("")}</ol>` : `<p class="muted">${t("Waiting for the host...")}</p>`}
        <button data-rules="close">${t("Close")}</button>
      </div>
    </section>
  `;
}

function renderMain() {
  if (controllerState.rulesOpen) return renderRules();
  if (!controllerState.player) return renderJoin();
  const host = hostState();
  if (!host || !hostPlayer()) return renderLobby();
  if (hostPlayer()?.eliminated) return renderEliminated();
  if (host.stage === "lobby") return renderLobby();
  if (host.stage === "guess") return renderGuess();
  if (host.stage === "active") return renderActive();
  if (host.stage === "reveal") return renderReveal();
  return renderResults();
}

function bindEvents() {
  document.querySelector("#joinName")?.addEventListener("input", (event) => {
    controllerState.draftName = event.target.value;
  });
  document.querySelector("#joinButton")?.addEventListener("click", joinRoom);
  document.querySelector("#joinName")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") joinRoom();
  });
  document.querySelector("#guessValue")?.addEventListener("input", (event) => {
    controllerState.draftGuess = event.target.value;
  });
  document.querySelectorAll("select[id^='target-']").forEach((select) => {
    select.addEventListener("change", (event) => {
      controllerState.draftActiveTargets[select.id.replace("target-", "")] = event.target.value;
    });
  });
  document.querySelector("#guessButton")?.addEventListener("click", submitGuess);
  document.querySelector("#guessValue")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitGuess();
  });
  document.querySelectorAll(".activeButton").forEach((button) => {
    button.addEventListener("click", () => submitActive(button.dataset.activeId));
  });
  document.querySelectorAll("[data-reroll]").forEach((button) => {
    button.addEventListener("click", () => rerollFace(button.dataset.reroll));
  });
  document.querySelectorAll("[data-rules]").forEach((button) => {
    button.addEventListener("click", () => {
      controllerState.rulesOpen = button.dataset.rules === "open";
      render(true);
    });
  });
}

function render(force = false) {
  const nextKey = renderKey();
  // nothing shown changed: keep the page (and the keyboard, while typing) as it is
  if (!force && controllerState.renderedKey === nextKey) return;
  const focusedId = document.activeElement?.id;
  document.querySelector("#controller").innerHTML = renderMain();
  controllerState.renderedKey = nextKey;
  bindEvents();
  if (focusedId === "guessValue" || focusedId === "joinName") {
    const input = document.getElementById(focusedId);
    if (input && !input.disabled) {
      input.focus();
      try {
        input.setSelectionRange(input.value.length, input.value.length);
      } catch (error) {}
    }
  }
}

// the screen is rebuilt only when something shown on it changed (keeps the keyboard up while typing)
function renderKey() {
  const host = hostState();
  const player = hostPlayer();
  const remote = remotePlayer();
  return JSON.stringify([
    controllerState.player?.id || "join",
    controllerState.rulesOpen,
    controllerState.message,
    host?.lang,
    host?.game,
    host?.stage || "offline",
    host?.round || 0,
    host?.waitForHost,
    host?.previousTarget,
    host?.modifier,
    host?.baseTarget,
    host?.finalTarget,
    host?.winner,
    host?.winReason,
    Boolean(host?.phaseDeadline || host?.phaseRemaining),
    host?.rules?.length || 0,
    host?.activeResults?.length || 0,
    host?.players?.filter(Boolean).map((other) => [other.id, other.eliminated, other.activeResolved, other.activeCast, other.guess]),
    player,
    guessSent(host, remote),
    activeSent(host, remote),
    allActivesSubmitted(host)
  ]);
}

// the clock counts down between polls without rebuilding the screen
function tickPhoneClock() {
  const left = clockSecondsLeft();
  document.querySelectorAll("[data-phone-clock]").forEach((element) => {
    if (left === null) return;
    element.textContent = String(left);
    element.closest(".clock-stat")?.classList.toggle("clock-low", left <= 5);
  });
}

document.addEventListener(
  "click",
  (event) => {
    const button = event.target?.closest?.("button");
    if (!button || button.disabled) return;
    playClockTickSfx();
  },
  true
);

render(true);
pollRoom();
setInterval(pollRoom, 800);
setInterval(tickPhoneClock, 250);
