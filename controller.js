const STORAGE_ID = "dearthPvpPlayerId";
const STORAGE_NAME = "dearthPvpPlayerName";
const GUESS_SFX_SRC = "assets/audio/Guess.mp3";
const READY_SFX_SRC = "assets/audio/Ready.mp3";
const GUESS_SFX_VOLUME = 0.9;
const READY_SFX_VOLUME = 0.2;

let guessSfx = null;
let readySfx = null;

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
}

function playOneShot(audio) {
  if (!audio) return;
  audio.currentTime = 0;
  const playback = audio.play();
  if (playback && typeof playback.catch === "function") playback.catch(() => {});
}

function playGuessSfx() {
  ensureButtonSfx();
  playOneShot(guessSfx);
}

function playReadySfx() {
  ensureButtonSfx();
  playOneShot(readySfx);
}

const controllerState = {
  player: localStorage.getItem(STORAGE_ID)
    ? {
        id: localStorage.getItem(STORAGE_ID),
        name: localStorage.getItem(STORAGE_NAME) || "Player"
      }
    : null,
  room: null,
  message: "",
  draftName: "",
  draftGuess: "",
  draftActiveTargets: {},
  lastRound: null,
  lastStage: null,
  renderedKey: ""
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function playerActiveName(player) {
  if (!player?.activeChoiceId) return "";
  return player.activeOptions?.find((active) => active.id === player.activeChoiceId)?.name || player.activeChoiceId;
}

function activeCastText(player) {
  if (!player?.activeResolved || !player.activeChoiceId) return "";
  if (player.activeChoiceId === "skip") return "skipped Artifact use";
  return player.activeCast ? `${playerActiveName(player)} cast` : `${playerActiveName(player)} failed`;
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
    .map((entry) => `${sign}${entry.amount} health from ${entry.source}`)
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
    const response = await fetch("/api/room", { cache: "no-store" });
    controllerState.room = await response.json();
    if (controllerState.player && !remotePlayer()) {
      localStorage.removeItem(STORAGE_ID);
      localStorage.removeItem(STORAGE_NAME);
      controllerState.message = "The host reset the room. Join again.";
      controllerState.player = null;
    }
    const host = hostState();
    if (host) {
      const roundChanged = controllerState.lastRound !== host.round;
      const stageChanged = controllerState.lastStage !== host.stage;
      if ((roundChanged || stageChanged) && controllerState.lastRound !== null) {
        controllerState.message = "";
      }
      if (roundChanged) {
        controllerState.draftGuess = "";
        controllerState.draftActiveTargets = {};
      }
      controllerState.lastRound = host.round;
      controllerState.lastStage = host.stage;
    }
    render();
  } catch {
    controllerState.message = "Cannot reach the host.";
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
    controllerState.message = "Joined. Wait for the host.";
    await pollRoom();
  } catch (error) {
    controllerState.message = error.message;
    render(true);
  }
}

async function submitGuess() {
  const input = document.querySelector("#guessValue");
  const host = hostState();
  const guess = Math.ceil(Number(input?.value || controllerState.draftGuess));
  if (!host || !Number.isFinite(guess) || guess < 0 || guess > 100) {
    controllerState.message = "Enter a number from 0 to 100.";
    render(true);
    return;
  }
  playGuessSfx();
  try {
    await postJson("/api/player", {
      id: controllerState.player.id,
      guess,
      guessRound: host.round
    });
    controllerState.message = "Guess sent. You are ready.";
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
      activeRound: host.round
    });
    controllerState.message = `${active?.name || "Artifact"} sent.`;
    await pollRoom();
  } catch (error) {
    controllerState.message = error.message;
    render(true);
  }
}

function renderHeader() {
  const host = hostState();
  const player = hostPlayer();
  const castText = activeCastText(player);
  const damageTooltip = sourceTooltip(player?.damageSources, "damage");
  const damageBadge =
    player?.lastDamage > 0
      ? `<span class="phone-damage-badge" title="${escapeAttr(damageTooltip)}">-${player.lastDamage}</span>`
      : "";
  return `
    <section class="panel">
      <h1>DEARTH PvP</h1>
      <p class="muted">${escapeHtml(controllerState.player?.name || "Phone controller")}</p>
      <div class="stat-row">
        <div class="stat"><span>Previous</span><strong>${host?.previousTarget ?? "?"}</strong></div>
        <div class="stat health-stat">${damageBadge}<span>Health</span><strong>${player ? player.hp : "-"}</strong></div>
        <div class="stat"><span>Modifier</span><strong>${host ? Number(host.modifier).toFixed(1) : "-"}</strong></div>
        <div class="stat"><span>Target</span><strong>${host?.finalTarget ?? host?.baseTarget ?? "?"}</strong></div>
      </div>
      ${host?.waitForHost ? `<p class="warning">Host wait is on.</p>` : ""}
      ${player?.activeGuaranteeThisRound ? `<p class="cast">Skip bonus ready: your Artifact will cast for sure.</p>` : ""}
      ${player?.activeGuaranteeNextRound ? `<p class="cast">Skip bonus armed for next round.</p>` : ""}
      ${castText ? `<p class="${player.activeCast ? "active-cast" : "muted"}">${escapeHtml(castText)}</p>` : ""}
      ${controllerState.message ? `<p class="cast">${escapeHtml(controllerState.message)}</p>` : ""}
    </section>
  `;
}

function renderJoin() {
  return `
    <section class="panel">
      <h1>DEARTH PvP</h1>
      <p class="muted">Enter your name to take one of the five table slots.</p>
      <input id="joinName" type="text" maxlength="16" placeholder="Your name" value="${escapeAttr(controllerState.draftName)}" />
      <button id="joinButton">Join</button>
      ${controllerState.message ? `<p class="warning">${escapeHtml(controllerState.message)}</p>` : ""}
    </section>
  `;
}

function renderLobby() {
  const player = hostPlayer();
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>Lobby</h2>
      <p class="muted">${player ? "You have a slot. Wait for the host to press Ready." : "Waiting for the host to import your phone slot."}</p>
    </section>
  `;
}

function renderGuess() {
  const host = hostState();
  const remote = remotePlayer();
  const submitted = remote?.guessRound === host.round && Number.isFinite(remote.guess);
  const readyText = host.waitForHost
    ? "Ready. Waiting for the host to reveal."
    : "Ready. Guesses reveal automatically when everyone is ready.";
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>Guess Phase</h2>
      <p class="muted">${submitted ? readyText : "Submit a whole number from 0 to 100."}</p>
      <input id="guessValue" type="number" min="0" max="100" value="${submitted ? "" : escapeAttr(controllerState.draftGuess)}" ${submitted ? "disabled" : ""} />
      <button id="guessButton" ${submitted ? "disabled" : ""}>${submitted ? "Ready" : "Send Guess"}</button>
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
        <option value="">Target</option>
        ${targets
          .map((target) => {
            const guess = Number.isFinite(target.guess) ? ` - Guess ${target.guess}` : "";
            return `<option value="${target.id}" ${targetValue === target.id ? "selected" : ""}>${escapeHtml(target.name)}${guess}</option>`;
          })
          .join("")}
      </select>
    `
    : "";
  return `
    <div class="choice ${selected ? "selected-choice" : ""} ${castClass}">
      <h2>${escapeHtml(active.name)}</h2>
      <p class="muted">${escapeHtml(active.description)}</p>
      ${targetSelect}
      <button class="activeButton" data-active-id="${escapeAttr(active.id)}" ${submitted ? "disabled" : ""}>Choose</button>
    </div>
  `;
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function renderActive() {
  const host = hostState();
  const player = hostPlayer();
  const remote = remotePlayer();
  const submitted = remote?.activeRound === host.round && Boolean(remote.activeChoiceId);
  const allReady = allActivesSubmitted(host);
  if (!player) return renderLobby();
  if (submitted && !allReady) {
    return `
      ${renderHeader()}
      <section class="panel">
        <h2>Artifact Phase</h2>
        <p class="muted">${host.waitForHost ? "Ready. Waiting for the host." : "Ready. Artifacts resolve automatically when everyone is ready."}</p>
        <button disabled>Ready</button>
      </section>
    `;
  }
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>Artifact Phase</h2>
      <p class="muted">${host.waitForHost ? "Choose one Artifact. The host will resolve when ready." : "Choose one Artifact. The phase resolves automatically when everyone chooses."}</p>
      ${player.activeOptions.map((active) => renderActiveChoice(active, submitted)).join("")}
      ${submitted ? `<p class="cast">Choice sent. Watch the host screen to see if it casts.</p>` : ""}
    </section>
  `;
}

function renderResults() {
  const host = hostState();
  const results = host?.activeResults || [];
  const castRows = (host?.players || [])
    .filter((player) => player?.activeResolved && player.activeChoiceId)
    .map((player) => `<div class="${player.activeCast ? "active-cast" : ""}">${escapeHtml(player.name)}: ${escapeHtml(activeCastText(player))}</div>`)
    .join("");
  return `
    ${renderHeader()}
    <section class="panel">
      <h2>${host?.stage === "ended" ? "Game Over" : "Round Summary"}</h2>
      ${host?.winner ? `<p class="cast">Winner: ${escapeHtml(host.winner)}</p>` : `<p class="muted">${host?.waitForHost ? "Waiting for host signal." : "Next round starts automatically after 10 seconds."}</p>`}
      <div class="results">
        ${castRows}
        ${results.map((result) => `<div>${escapeHtml(result)}</div>`).join("")}
      </div>
    </section>
  `;
}

function renderMain() {
  if (!controllerState.player) return renderJoin();
  const host = hostState();
  if (!host || !hostPlayer()) return renderLobby();
  if (hostPlayer()?.eliminated) return `${renderHeader()}<section class="panel"><h2>Eliminated</h2><p class="muted">You are out. Last player standing wins.</p></section>`;
  if (host.stage === "lobby") return renderLobby();
  if (host.stage === "guess") return renderGuess();
  if (host.stage === "active") return renderActive();
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
}

function render(force = false) {
  const nextKey = renderKey();
  if (!force && controllerState.renderedKey === nextKey && isTypingDraft()) return;
  document.querySelector("#controller").innerHTML = renderMain();
  controllerState.renderedKey = nextKey;
  bindEvents();
}

function renderKey() {
  const host = hostState();
  const hostPlayerState = hostPlayer();
  const remote = remotePlayer();
  const submittedGuess = host?.stage === "guess" && remote?.guessRound === host.round && Number.isFinite(remote.guess);
  const submittedActive = host?.stage === "active" && remote?.activeRound === host.round && Boolean(remote.activeChoiceId);
  return [
    controllerState.player?.id || "join",
    host?.stage || "offline",
    host?.round || 0,
    hostPlayerState?.hp ?? "-",
    hostPlayerState?.lastDamage || 0,
    hostPlayerState?.damageSources?.map((entry) => `${entry.amount}:${entry.source}`).join(",") || "",
    hostPlayerState?.eliminated ? "out" : "in",
    hostPlayerState?.activeGuaranteeThisRound ? "guaranteed-now" : "normal-cast",
    hostPlayerState?.activeGuaranteeNextRound ? "guaranteed-next" : "no-next-guarantee",
    submittedGuess ? "guess-ready" : "guess-open",
    submittedActive ? "active-ready" : "active-open",
    allActivesSubmitted(host) ? "all-active-ready" : "active-waiting",
    hostPlayerState?.activeCast === true ? "cast" : hostPlayerState?.activeCast === false ? "failed" : "pending",
    host?.waitForHost ? "wait" : "auto",
    host?.players?.filter(Boolean).length || 0,
    hostPlayerState?.activeOptions?.map((active) => active.id).join(",") || "",
    controllerState.message
  ].join("|");
}

function isTypingDraft() {
  const id = document.activeElement?.id;
  return id === "joinName" || id === "guessValue" || id?.startsWith("target-");
}

render(true);
pollRoom();
setInterval(pollRoom, 800);
