/* ---------- Playtest feedback: a "Give feedback" button that opens the Google Form with the run filled in ----------
   Off unless PLAYTEST_BUILD is true; never in the native app. Entry ids are the form's, do not change them.
   demo.html (generated from index.html by build:game) turns it on; index.html leaves it off. */
const PLAYTEST_BUILD = typeof window !== "undefined" && window.DEARTH_PLAYTEST_BUILD === true;
const PLAYTEST_BUILD_LABEL = "Playtest v0.1";

const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScvqSDkife1ZxrytslkvzvLpXUdwJnC0wWgYh9KlA5LR9P05g/viewform";

const FEEDBACK_FIELDS = {
  testerId:    "entry.376189267",   // Tester ID
  build:       "entry.1955652171",  // Έκδοση Build
  result:      "entry.1259790914",  // Αποτέλεσμα run
  round:       "entry.1289594716",  // Γύρος που έφτασε το run
  seals:       "entry.324056541",   // Seals bought
  artifacts:   "entry.1858571614",  // Artifacts bought and used
  bosses:      "entry.447387122",   // Bosses Defeated
  totalRounds: "entry.420559722"    // Total rounds/runs
};

const FEEDBACK_RESULT = {
  win:  "Νίκη",
  loss: "Ήττα",
  quit: "Σταμάτησε στη μέση"
};

const FEEDBACK_NONE = "Κανένα";

const TESTER_ID_KEY = "dearthPlaytestTesterId";

// Created once per device/browser, then reused for every form.
function getPlaytestTesterId() {
  try {
    let id = localStorage.getItem(TESTER_ID_KEY);
    if (!id) {
      id = "T-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem(TESTER_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return "unknown";
  }
}

// runData = {
//   result:       FEEDBACK_RESULT.win | .loss | .quit
//   round:        number
//   seals:        ["Satan", "Agares", ...]
//   artifactUses: { "Artifact name": timesUsed, ... }
//   bosses:       ["Threon", "Padma", ...]
//   totalRounds:  number (rounds across all runs on this device)
// }
function buildFeedbackUrl(runData) {
  const {
    result = "",
    round = "",
    seals = [],
    artifactUses = {},
    bosses = [],
    totalRounds = ""
  } = runData || {};

  const artifacts = Object.entries(artifactUses)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} ×${count}`)
    .join(", ");

  // an empty answer would stop a required field (and the Next button) on the form
  const orNone = (text) => (String(text).trim() ? String(text) : FEEDBACK_NONE);
  const params = new URLSearchParams({ usp: "pp_url" });
  params.set(FEEDBACK_FIELDS.build, PLAYTEST_BUILD_LABEL);
  params.set(FEEDBACK_FIELDS.testerId, getPlaytestTesterId());
  params.set(FEEDBACK_FIELDS.result, result);
  params.set(FEEDBACK_FIELDS.round, String(round));
  params.set(FEEDBACK_FIELDS.seals, orNone(seals.join(", ")));
  params.set(FEEDBACK_FIELDS.artifacts, orNone(artifacts));
  params.set(FEEDBACK_FIELDS.bosses, orNone(bosses.join(", ")));
  params.set(FEEDBACK_FIELDS.totalRounds, String(totalRounds));

  return FEEDBACK_FORM_URL + "?" + params.toString();
}

function openPlaytestFeedback(runData) {
  window.open(buildFeedbackUrl(runData), "_blank");
}

/* ---------- Playtest hooks: counters, the run's data for the form, the button ---------- */
const PLAYTEST_TOTAL_ROUNDS_KEY = "dearthPlaytestTotalRoundsV1";

// PC/browser only: the native app never shows the button
function playtestFeedbackAvailable() {
  return PLAYTEST_BUILD === true && !isNativeArcadeApp();
}

function playtestTotalRounds() {
  try {
    return Math.max(0, Math.floor(Number(localStorage.getItem(PLAYTEST_TOTAL_ROUNDS_KEY)) || 0));
  } catch (e) {
    return 0;
  }
}

// one more round played on this device (called once per round at READY, the death round included)
function playtestNoteRoundPlayed() {
  if (!playtestFeedbackAvailable() || state.mode !== "arcade") return;
  try {
    localStorage.setItem(PLAYTEST_TOTAL_ROUNDS_KEY, String(playtestTotalRounds() + 1));
  } catch (e) {}
}

// recording only: the names of the BOSSES slain this run (reset in startGame)
function playtestRecordBossDefeated(bot) {
  if (state.mode !== "arcade" || !bot || !bot.isBoss) return;
  if (!Array.isArray(state.bossesDefeated)) state.bossesDefeated = [];
  state.bossesDefeated.push(bot.name);
}

// a run always ends at Game Over; beating the unique BOSSES (the main game) counts as a win
function playtestRunResult() {
  return state.bossKills >= UNIQUE_BOSS_KEYS.length ? FEEDBACK_RESULT.win : FEEDBACK_RESULT.loss;
}

function playtestRunData(result) {
  const stats = ensureRunStats();
  const itemName = (id) => (ITEMS[id] && ITEMS[id].name) || id;
  const seals = Object.entries(stats.sealPlays || {})
    .filter(([, count]) => Number(count) > 0)
    .map(([id, count]) => (Number(count) > 1 ? `${itemName(id)} ×${count}` : itemName(id)));
  const artifactUses = {};
  Object.entries(stats.artifactPlays || {}).forEach(([id, count]) => {
    if (!(Number(count) > 0)) return;
    const name = itemName(id);
    artifactUses[name] = (artifactUses[name] || 0) + Number(count);
  });
  return {
    result,
    round: state.round,
    seals,
    artifactUses,
    bosses: Array.isArray(state.bossesDefeated) ? state.bossesDefeated.slice() : [],
    totalRounds: playtestTotalRounds()
  };
}

function openPlaytestFeedbackFromRun(quit = false) {
  if (!playtestFeedbackAvailable()) return;
  openPlaytestFeedback(playtestRunData(quit ? FEEDBACK_RESULT.quit : playtestRunResult()));
}

function renderPlaytestFeedbackButton(where) {
  if (!playtestFeedbackAvailable()) return "";
  if (where === "pause") return `<button class="primary-button" data-pause-action="feedback">Give feedback</button>`;
  return `<button class="primary-button end-feedback" id="playtestFeedback">Give feedback</button>`;
}
