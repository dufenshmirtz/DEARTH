/* ---------- First-launch story: Jesus' judgement, the tutorial table, Satan's pact ----------
   Plays the first time the game is opened (and again from the main menu by clicking Jesus).
   1. Black screen, silence. After INTRO_BLACK_MS the bell tolls and the judgement dialogue starts
      (Jesus on the left, the sinner on the right, one text box in the middle).
   2. The game boots with the Devil's Offerings, ARTIFACTS and SEAL slots blacked out and no music.
   3. When round 2 is resolved, Satan's red text box opens where the offerings will be (desktop)
      or where the SEALS will be (mobile). After the pact the hidden parts burn back into place,
      the music starts and the run goes on as a normal, saved run.
   Text: each box types letter by letter up to the next punctuation (. , ! ? and runs like ?? ...),
   a click/tap anywhere continues; after the last part of a box the next click replaces it.
   The first word of every line below is the colour: white = Jesus, blue = you, red = Satan.
   {SIN} draws the SIN icon. Edit the lines freely; the chunks are worked out from the punctuation. */

const INTRO_SEEN_STORAGE_KEY = "dearthIntroSeenV1";
const INTRO_BLACK_MS = 5000; // silence before the bell
const INTRO_LETTER_MS = 34; // typing speed
const INTRO_PACT_DELAY_MS = 1100; // pause after round 2 resolves before Satan speaks
const INTRO_BOOT_REVEAL_MS = 1250; // the boot sound's power chord: the game switches on here
const INTRO_BURN_MS = 1900; // offerings / ARTIFACTS / SEALS burning back into place

const INTRO_JUDGEMENT_LINES = [
  ["white", "You died on ______ after _______"],
  ["white", "You are going to HELL."],
  ["blue", "Huh, what, no??"],
  ["blue", "This can't be true, wait what do you even mean there is an afterlife?"],
  ["white", "There is, you are in it, it is over, only eternal damnation awaits you."],
  ["blue", "Why?? No!! Who the hell even are you?"],
  ["white", "I am He, the One you know as Jesus."],
  ["blue", "What do you mean, after all of this Christianity was just right, every other God was bullshit and I'll be judged by your specific values. That's stupid I want the other afterlives."],
  ["white", "There are no other afterlives you insolent fool. Only Heaven and Hell, and there are no other Gods but me. You had your chance to follow my truth, now you shall face my punishment."],
  ["blue", "Hey hey I am sorry, I didn't mean it alright? Look I did make some mistakes, and I wasn't always the better person, but you can't forsake me like this!"],
  ["blue", "I am sure I went to church like, at least 4 times! And during one Easter I even fasted!"],
  ["white", "SILENCE. My word is final. And during the Easter of 2023 you fasted only because you had gotten food poisoning from eating 10 day old pizza."],
  ["blue", "Okay okay, but I can change. In middle school we learned that you always accept your children when they turn to you, prodigal son and all that. So please, just send me back and I promise I will do good this time."],
  ["blue", "One year from now I'll have a big ass beard, I'll stop taking drugs, I'll stop having sex and... and go work at a church. I'll even diddle kids if that's what you want, most of your favorite children seem to do that nowadays anyway."],
  ["blue", "Hey please, talk to me!"],
  ["blue", "Don't leave me hanging!"],
  ["blue", "God answer me! Big man! Father! Big daddy!!!"],
  ["white", "Shut. the. fuck. up. The next time you try to insult me or twist my word or whine, I'll make you wish you've never been created."],
  ["blue", "Okay got it whatever you want almighty, I just truly believe if you give me one last chance I'll make you proud, and maybe not face eternal torture."],
  ["blue", "If I knew you were real I would be going to church every day, having faith and doubt not, loving my neighbor, killing all the homosexuals, honoring my father and my mother, trusting in the lord with all my heart, throwing rocks at muslims..."],
  ["white", "So you want your second chance that bad?"],
  ["blue", "OH PLEASE, I will do literally anything and everything!"],
  ["white", "Listen here worm, I'll grant you your chance."],
  ["blue", "FUCK YEAH, ready to go home and be the best chr-"],
  ["white", "But you will have to earn it. Do you know how many ungrateful souls like you appear before me and beg like dogs to be forgiven? All of them. So be thankful for once you are even getting the chance to prove yourself before me."],
  ["white", "To go back all you have to do is defeat all other Damned in the game I've devised for all you heedless."],
  ["white", "You are all in the same situation and the only way out is to outsmart the others or be purged into the fires of the underworld."],
  ["white", "What you have to do is enter a number from 1 to 100, and be the closest to 0.8 of the average of all the guesses. Any deviation from the target will bring you closer to your doom."],
  ["white", "Be ready, the game is about to start."],
  ["blue", "Alright that's great and all, but how many enemies do I have to defeat again?"]
];

// third item: what happens on the click after the line ("evil": the pact sound before the next line)
const INTRO_PACT_LINES = [
  ["red", "Looking kinda rough there guy, a few more of these and you'll be going down below where the sun don't shine no more."],
  ["blue", "Who in the lord's name are you. I am a Christian now, fighting for my right to be a good little Jesus child. Are you one of the players?"],
  ["red", "Hey hey no reason to bring the big guy's name in here. I am here to help you. Think of me as your only chance of actually doing anything meaningful in this here place."],
  ["red", "Our goals happen to align this fine time. You want all the other wretches to be eliminated and I want more meat for the grinder, the faster the better!"],
  ["red", "So listen here, I got you a little offer. I will give you a little bit of an edge against all the other sinners here, and in exchange I want their SIN{SIN}. The more decadent they were the more valuable they are."],
  ["blue", "Wait a second, red eyes, twisting horns, pointy tail! You're Satan! No way I am trusting you after what the holy trio said to me. He was angry enough before, if he finds out I've been dealing with the devil it's over for me."],
  ["red", "No need to get defensive here you little flesh puppet! Me and Jesus are cool, I am sure he will turn the other cheek. It's not like he even cares what happens in here..."],
  ["blue", "Wait what do you mean?"],
  ["red", "Anyways, if you would like to be torn away slowly from your mistakes in this \"game\", while toiling over all the immoral acts you happily committed while alive you are free to do so. I'll find some other scum in here soon enough."],
  ["blue", "No no, wait please! I need to get back. What's the deal?"],
  ["red", "Okay listen here and listen well. You eliminate the other sinners and in exchange I'll give you the strength of my demons in the form of their SEALS. They will help you passively and the better you do the stronger you become."],
  ["red", "Also I humbly accept rituals to my name, so I would recommend using occult ARTIFACTS right after all the guesses have been revealed, whenever need be."],
  ["blue", "Okay I get it, so I get the demons' power, I use the artifacts and after I defeat some other souls I go free, right?"],
  ["red", "Yea yea definitely, or whatever the other guy promised you."],
  ["blue", "Okay okay, I accept. Anything to get me out of this mess.", "evil"],
  ["red", "Great. And just beware, you are not the first I've given this opportunity to. There's give or take about 8 others like you that have been playing this game for quite some time."],
  ["red", "Wishing you all the best, and I'll be seeing you soon enough..."]
];

const INTRO_SPEAKER_BY_COLOR = { white: "jesus", blue: "sinner", red: "satan" };

// phase: off | black | judgement | booting | tutorial | pact | reveal
const introState = {
  phase: "off",
  timers: [],
  typeTimer: null,
  layer: null,
  box: null,
  lines: null,
  lineIndex: -1,
  glyphs: [],
  ends: [],
  chunk: 0,
  shown: 0,
  typing: false,
  waiting: false,
  pactTimer: null,
  keyBound: false
};

/* ---- flags used by the rest of the game ---- */
function shouldPlayIntroOnLaunch() {
  try {
    return window.localStorage?.getItem(INTRO_SEEN_STORAGE_KEY) !== "1";
  } catch (error) {
    return false;
  }
}

function markIntroSeen() {
  try {
    window.localStorage?.setItem(INTRO_SEEN_STORAGE_KEY, "1");
  } catch (error) {}
}

function introActive() {
  return introState.phase !== "off";
}

function introHoldsMusic() {
  return introActive();
}

function introBlocksRunSave() {
  return ["black", "judgement", "booting", "tutorial", "pact"].includes(introState.phase);
}

function introCapturesInput() {
  return ["black", "judgement", "booting", "pact"].includes(introState.phase);
}

// the tutorial table cannot kill you before Satan has had his say
function introPlayerHpFloor() {
  return introState.phase === "tutorial" || introState.phase === "pact" ? 1 : 0;
}

// leaving the run (menu, PvP) during the story ends the story
function introGuardMode() {
  if (["tutorial", "pact", "reveal"].includes(introState.phase) && state.mode !== "arcade") introAbort();
}

/* ---- timers & teardown ---- */
function introLater(fn, ms) {
  const id = setTimeout(() => {
    introState.timers = introState.timers.filter((timer) => timer !== id);
    fn();
  }, ms);
  introState.timers.push(id);
  return id;
}

function introClearTimers() {
  introState.timers.forEach(clearTimeout);
  introState.timers = [];
  clearInterval(introState.typeTimer);
  introState.typeTimer = null;
  clearTimeout(introState.pactTimer);
  introState.pactTimer = null;
}

function introRemoveLayers() {
  document.querySelectorAll(".intro-layer, .intro-pact-layer, .intro-burn-canvas, .menu-jesus-flash").forEach((node) => node.remove());
  document.body.classList.remove("intro-tutorial", "intro-crt-on", "intro-running");
  introState.layer = null;
  introState.box = null;
}

function introAbort() {
  if (!introActive()) return;
  introClearTimers();
  introRemoveLayers();
  introState.phase = "off";
  markIntroSeen();
  playSoundtrack();
}

/* ---- sound ---- */
// plays a GAME_SFX sound and reports whether the browser let it play (autoplay rules)
function introPlaySfx(key) {
  const config = GAME_SFX[key];
  const pool = ensureGameSfx(key);
  if (!config || !pool.length || state.sound.muted) return Promise.resolve(true);
  try {
    const instance = pool[Math.floor(Math.random() * pool.length)].cloneNode(true);
    instance.volume = sfxVolume(config.volume ?? 0.4);
    if (config.rate || config.pitch) {
      instance.preservesPitch = false;
      instance.playbackRate = (config.rate || 1) * (1 + (Math.random() * 2 - 1) * (config.pitch || 0));
    }
    activeOneShotSfxInstances.add(instance);
    const cleanup = () => activeOneShotSfxInstances.delete(instance);
    instance.addEventListener("ended", cleanup, { once: true });
    const attempt = instance.play();
    if (!attempt || typeof attempt.then !== "function") return Promise.resolve(true);
    return attempt.then(() => true).catch((error) => {
      cleanup();
      return !(error && error.name === "NotAllowedError");
    });
  } catch (error) {
    return Promise.resolve(true);
  }
}

// pencil scratch on every letter: Web Audio when it can (no lag at typing speed), plain audio otherwise
const introPencil = { ctx: null, buffers: null, loading: false };

function introLoadPencil() {
  if (introPencil.loading || introPencil.buffers) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || typeof fetch !== "function" || location.protocol === "file:") return;
  introPencil.loading = true;
  try {
    introPencil.ctx = new AudioCtx();
  } catch (error) {
    return;
  }
  Promise.all(
    GAME_SFX.introPencil.srcs.map((src) =>
      fetch(src)
        .then((response) => response.arrayBuffer())
        .then((data) => new Promise((resolve, reject) => introPencil.ctx.decodeAudioData(data, resolve, reject)))
    )
  )
    .then((buffers) => {
      introPencil.buffers = buffers;
    })
    .catch(() => {});
}

function introWakePencil() {
  if (introPencil.ctx && introPencil.ctx.state === "suspended") introPencil.ctx.resume().catch(() => {});
}

function introPencilTick() {
  if (state.sound.muted) return;
  const { ctx, buffers } = introPencil;
  if (ctx && buffers && ctx.state === "running") {
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffers[Math.floor(Math.random() * buffers.length)];
      source.playbackRate.value = 1 + (Math.random() * 2 - 1) * (GAME_SFX.introPencil.pitch || 0);
      const gain = ctx.createGain();
      gain.gain.value = sfxVolume(GAME_SFX.introPencil.volume ?? 0.1);
      source.connect(gain).connect(ctx.destination);
      source.start();
      return;
    } catch (error) {}
  }
  playGameSfx("introPencil");
}

/* ---- text: glyphs and punctuation chunks ---- */
function introGlyphs(text) {
  const glyphs = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text.startsWith("{SIN}", i)) {
      glyphs.push("{SIN}");
      i += 4;
    } else {
      glyphs.push(text[i]);
    }
  }
  return glyphs;
}

const INTRO_PUNCTUATION = new Set([".", ",", "!", "?"]);

// a chunk ends after a run of . , ! ? (so "??", "!!" and "..." stay together); not inside numbers like 0.8
function introChunkEnds(glyphs) {
  const ends = [];
  for (let i = 0; i < glyphs.length; i += 1) {
    if (!INTRO_PUNCTUATION.has(glyphs[i])) continue;
    const next = glyphs[i + 1];
    if (next !== undefined && INTRO_PUNCTUATION.has(next)) continue;
    if (next !== undefined && /[0-9]/.test(next)) continue;
    let end = i + 1;
    if (next === "\"" || next === "'") end += 1; // keep a closing quote with its punctuation
    if (end < glyphs.length) ends.push(end);
  }
  ends.push(glyphs.length);
  return ends.filter((end, index) => index === 0 || end > ends[index - 1]);
}

function introGlyphHtml(glyph) {
  return glyph === "{SIN}" ? SIN_MARK : escapeHtml(glyph);
}

function introDrawText() {
  const text = introState.box?.querySelector(".intro-text");
  if (!text) return;
  const { glyphs, shown } = introState;
  const ink = glyphs.slice(0, Math.max(0, shown - 1)).map(introGlyphHtml).join("");
  const fresh = shown > 0 ? `<span class="intro-fresh">${introGlyphHtml(glyphs[shown - 1])}</span>` : "";
  const ghost = glyphs.slice(shown).map(introGlyphHtml).join("");
  text.innerHTML = `${ink}${fresh}<span class="intro-ghost">${ghost}</span>`;
}

// shrink the font until the whole box text fits (the ghost keeps the full text in the layout)
function introFitText() {
  const box = introState.box;
  const text = box?.querySelector(".intro-text");
  if (!text) return;
  text.style.fontSize = "";
  const max = parseFloat(getComputedStyle(text).fontSize) || 24;
  let size = max;
  while (size > 9 && text.scrollHeight > text.clientHeight + 1) {
    size -= 1;
    text.style.fontSize = `${size}px`;
  }
}

function introSetWaiting(waiting) {
  introState.waiting = waiting;
  introState.box?.classList.toggle("intro-waiting", waiting);
}

function introShowLine(index) {
  const [color, text] = introState.lines[index];
  introState.lineIndex = index;
  introState.glyphs = introGlyphs(text);
  introState.ends = introChunkEnds(introState.glyphs);
  introState.chunk = 0;
  introState.shown = 0;
  const box = introState.box;
  box.classList.remove("intro-color-white", "intro-color-blue", "intro-color-red", "intro-box-hush");
  box.classList.add(`intro-color-${color}`);
  const speaker = INTRO_SPEAKER_BY_COLOR[color] || "";
  if (introState.layer) introState.layer.dataset.speaker = speaker;
  introDrawText();
  introFitText();
  introTypeTo(introState.ends[0]);
}

function introTypeTo(end) {
  clearInterval(introState.typeTimer);
  introSetWaiting(false);
  introState.typing = true;
  const step = () => {
    if (introState.shown >= end) {
      clearInterval(introState.typeTimer);
      introState.typeTimer = null;
      introState.typing = false;
      introSetWaiting(true);
      return;
    }
    introState.shown += 1;
    const glyph = introState.glyphs[introState.shown - 1];
    // spaces are skipped over at once and make no sound
    while (introState.shown < end && /\s/.test(glyph) && /\s/.test(introState.glyphs[introState.shown])) introState.shown += 1;
    if (!/\s/.test(glyph)) introPencilTick();
    introDrawText();
  };
  step();
  introState.typeTimer = setInterval(step, INTRO_LETTER_MS);
}

// click / tap / Enter / Space
function introAdvance() {
  if (!["judgement", "pact"].includes(introState.phase) || !introState.box) return;
  introWakePencil();
  if (introState.typing) {
    // finish the current part at once
    introState.shown = introState.ends[introState.chunk];
    clearInterval(introState.typeTimer);
    introState.typeTimer = null;
    introState.typing = false;
    introDrawText();
    introSetWaiting(true);
    return;
  }
  if (!introState.waiting) return;
  if (introState.chunk < introState.ends.length - 1) {
    introState.chunk += 1;
    introTypeTo(introState.ends[introState.chunk]);
    return;
  }
  const after = introState.lines[introState.lineIndex][2];
  const next = introState.lineIndex + 1;
  if (after === "evil") {
    introPactEvil(next);
    return;
  }
  if (next < introState.lines.length) {
    introShowLine(next);
    return;
  }
  if (introState.phase === "judgement") introBootGame();
  else introSealPact();
}

function introBindKeys() {
  if (introState.keyBound) return;
  introState.keyBound = true;
  window.addEventListener("resize", () => {
    if (introState.phase === "pact") introPlacePactBox();
    else if (introState.phase === "judgement") introFitText();
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (!introCapturesInput()) return;
      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        event.stopPropagation();
        if (introState.phase === "black" && introState.layer?.classList.contains("intro-needs-tap")) introState.layer.click();
        else introAdvance();
      } else if (event.key === "Tab") {
        event.preventDefault();
      }
    },
    true
  );
}

function introBoxHtml(kind) {
  return `
    <div class="intro-box intro-box-${kind}" role="dialog" aria-live="polite">
      <div class="intro-text"></div>
      <span class="intro-next" aria-hidden="true"></span>
    </div>`;
}

/* ---- 1. judgement ---- */
function startIntroSequence(options = {}) {
  introClearTimers();
  introRemoveLayers();
  introBindKeys();
  introLoadPencil();
  if (soundtrackAudio) pauseAudioElement(soundtrackAudio);
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur?.();
  state.mobileOfferingsOpen = false;
  introState.phase = "black";
  introState.lines = INTRO_JUDGEMENT_LINES;
  introState.lineIndex = -1;
  const layer = document.createElement("div");
  layer.className = "intro-layer";
  layer.innerHTML = `
    <img class="intro-portrait intro-portrait-jesus" src="assets/ui/intro/intro-jesus.webp" alt="" draggable="false" />
    <img class="intro-portrait intro-portrait-sinner" src="assets/ui/intro/intro-sinner.webp" alt="" draggable="false" />
    ${introBoxHtml("judgement")}
    <div class="intro-tap-hint" aria-hidden="true">${"ontouchstart" in window ? "tap" : "click"}</div>`;
  layer.addEventListener("click", () => {
    if (layer.classList.contains("intro-needs-tap")) {
      layer.classList.remove("intro-needs-tap");
      introWakePencil();
      introPlaySfx("introBell");
      introBeginJudgement();
      return;
    }
    introAdvance();
  });
  if (options.fromMenu) layer.classList.add("intro-from-flash");
  document.body.appendChild(layer);
  document.body.classList.add("intro-running");
  introState.layer = layer;
  introState.box = layer.querySelector(".intro-box");
  introLater(introRingBell, INTRO_BLACK_MS);
}

function introRingBell() {
  if (introState.phase !== "black") return;
  introPlaySfx("introBell").then((played) => {
    if (introState.phase !== "black") return;
    // the browser kept the page silent: wait for one click so the bell is heard
    if (!played) introState.layer.classList.add("intro-needs-tap");
    else introBeginJudgement();
  });
}

function introBeginJudgement() {
  introState.phase = "judgement";
  introState.layer.classList.add("intro-lit");
  introShowLine(0);
}

/* ---- 2. the tutorial table ---- */
function introBootGame() {
  introState.phase = "booting";
  introSetWaiting(false);
  introState.layer.classList.add("intro-shutting");
  introPlaySfx("introBoot");
  introLater(() => {
    introState.phase = "tutorial";
    document.body.classList.add("intro-tutorial", "intro-crt-on");
    startGame({ intro: true });
    introState.layer?.remove();
    introState.layer = null;
    introState.box = null;
    introLater(() => document.body.classList.remove("intro-crt-on"), 1100);
  }, INTRO_BOOT_REVEAL_MS);
}

function introPactReady() {
  return (
    introState.phase === "tutorial" &&
    state.mode === "arcade" &&
    state.round >= 2 &&
    state.stage === "summary" &&
    !state.pauseOpen &&
    !roundRevealAnimationActive() &&
    !(activeMoment && activeMoment.until > performance.now())
  );
}

function introAfterRender() {
  if (introState.phase === "pact") introPlacePactBox();
  if (introState.phase !== "tutorial" || introState.pactTimer) return;
  if (state.round >= 2 && state.stage === "summary") {
    const check = () => {
      introState.pactTimer = null;
      if (introState.phase !== "tutorial") return;
      if (introPactReady()) introStartPact();
      else if (state.mode === "arcade" && state.stage === "summary") introState.pactTimer = setTimeout(check, 400);
    };
    introState.pactTimer = setTimeout(check, INTRO_PACT_DELAY_MS);
  }
}

/* ---- 3. Satan's pact ---- */
function introPactAnchor() {
  return isMobileArcadeView() ? document.querySelector(".passive-bar") : document.querySelector(".shop-panel");
}

function introPlacePactBox() {
  const box = introState.box;
  const anchor = introPactAnchor();
  if (!box || !anchor || !box.classList.contains("intro-box-pact")) return;
  const rect = anchor.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  box.style.left = `${rect.left}px`;
  box.style.top = `${rect.top}px`;
  box.style.width = `${rect.width}px`;
  box.style.height = `${rect.height}px`;
  introFitText();
}

function introStartPact() {
  introState.phase = "pact";
  introState.lines = INTRO_PACT_LINES;
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur?.();
  const floatingTooltip = document.querySelector("#floatingTooltip");
  if (floatingTooltip) floatingTooltip.classList.remove("visible");
  const layer = document.createElement("div");
  layer.className = "intro-pact-layer";
  layer.innerHTML = introBoxHtml("pact");
  layer.addEventListener("click", introAdvance);
  document.body.appendChild(layer);
  introState.layer = layer;
  introState.box = layer.querySelector(".intro-box");
  introPlacePactBox();
  introShowLine(0);
}

function introPactEvil(nextIndex) {
  introSetWaiting(false);
  introState.box.classList.add("intro-box-hush");
  introState.glyphs = [];
  introState.shown = 0;
  introDrawText();
  introState.waiting = false;
  introPlaySfx("introEvil");
  introState.box.classList.add("intro-box-pulse");
  introLater(() => {
    if (introState.phase !== "pact") return;
    introState.box.classList.remove("intro-box-pulse");
    introShowLine(nextIndex);
  }, 2000);
}

function introSealPact() {
  introSetWaiting(false);
  introState.phase = "reveal";
  introPlaySfx("introLaugh");
  introState.box.classList.add("intro-box-leave");
  introLater(() => {
    introState.layer?.remove();
    introState.layer = null;
    introState.box = null;
    introBurnIn();
  }, 1300);
}

// the hidden panels come back like a burnt sheet played backwards: a ragged glowing edge
// sweeps across a black cover that turns to nothing, leaving the panel in its place
function introBurnTargets() {
  const targets = [document.querySelector(".passive-bar")];
  if (isMobileArcadeView()) targets.push(document.querySelector(".mobile-offerings-button"));
  else targets.push(document.querySelector(".side-panel"));
  return targets.filter(Boolean);
}

function introBurnIn() {
  const targets = introBurnTargets();
  const covers = targets.map((element) => introMakeBurnCover(element)).filter(Boolean);
  document.body.classList.remove("intro-tutorial");
  introPlaySfx("introBurn");
  const start = performance.now();
  const frame = (now) => {
    if (introState.phase !== "reveal") return;
    const progress = Math.min(1, (now - start) / INTRO_BURN_MS);
    covers.forEach((cover) => introDrawBurn(cover, progress, now));
    if (progress < 1) requestAnimationFrame(frame);
    else introFinish();
  };
  if (!covers.length) {
    introFinish();
    return;
  }
  requestAnimationFrame(frame);
}

function introNoise(width, height, seed) {
  // value noise, 3 octaves
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const field = new Float32Array(width * height);
  [
    [3, 0.18],
    [8, 0.32],
    [20, 0.32],
    [46, 0.18]
  ].forEach(([cell, weight]) => {
    const gw = Math.ceil(width / cell) + 2;
    const gh = Math.ceil(height / cell) + 2;
    const grid = Array.from({ length: gw * gh }, rand);
    for (let y = 0; y < height; y += 1) {
      const gy = y / cell;
      const y0 = Math.floor(gy);
      const fy = gy - y0;
      const sy = fy * fy * (3 - 2 * fy);
      for (let x = 0; x < width; x += 1) {
        const gx = x / cell;
        const x0 = Math.floor(gx);
        const fx = gx - x0;
        const sx = fx * fx * (3 - 2 * fx);
        const a = grid[y0 * gw + x0];
        const b = grid[y0 * gw + x0 + 1];
        const c = grid[(y0 + 1) * gw + x0];
        const d = grid[(y0 + 1) * gw + x0 + 1];
        field[y * width + x] += weight * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
      }
    }
  });
  return field;
}

function introMakeBurnCover(element) {
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const margin = 14;
  const scale = 0.5;
  const canvas = document.createElement("canvas");
  canvas.className = "intro-burn-canvas";
  const width = Math.max(4, Math.round((rect.width + margin * 2) * scale));
  const height = Math.max(4, Math.round((rect.height + margin * 2) * scale));
  canvas.width = width;
  canvas.height = height;
  canvas.style.left = `${rect.left - margin}px`;
  canvas.style.top = `${rect.top - margin}px`;
  canvas.style.width = `${rect.width + margin * 2}px`;
  canvas.style.height = `${rect.height + margin * 2}px`;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return null;
  }
  // the burn starts from a point low in the panel and spreads, ragged, to the far edges
  const noise = introNoise(width, height, 1 + Math.floor(Math.random() * 100000));
  const ox = width * (0.3 + Math.random() * 0.4);
  const oy = height * (0.55 + Math.random() * 0.35);
  const far = Math.max(Math.hypot(ox, oy), Math.hypot(width - ox, oy), Math.hypot(ox, height - oy), Math.hypot(width - ox, height - oy));
  const field = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      field[i] = 0.6 * (Math.hypot(x - ox, y - oy) / far) + 0.4 * noise[i];
    }
  }
  const image = ctx.createImageData(width, height);
  return { canvas, ctx, image, field, width, height };
}

function introDrawBurn(cover, progress, now) {
  const { ctx, image, field } = cover;
  const data = image.data;
  const eased = 1 - Math.pow(1 - progress, 1.6);
  const band = 0.03;
  const front = -band + eased * (1.05 + band * 2);
  const flicker = 0.85 + 0.15 * Math.sin(now / 37);
  for (let i = 0; i < field.length; i += 1) {
    const u = (field[i] - front) / band; // <0 burnt away, 0..1 glowing edge, >1 still covered
    const p = i * 4;
    if (u < 0) {
      data[p + 3] = 0;
      continue;
    }
    if (u >= 1.6) {
      data[p] = 0;
      data[p + 1] = 0;
      data[p + 2] = 0;
      data[p + 3] = 255;
      continue;
    }
    let r;
    let g;
    let b;
    let a = 255;
    if (u < 0.22) {
      // hottest rim
      const k = u / 0.22;
      r = 255;
      g = 236 - 70 * k;
      b = 170 - 120 * k;
      a = Math.round(255 * (0.55 + 0.45 * k));
    } else if (u < 1) {
      const k = (u - 0.22) / 0.78;
      r = 255 - 130 * k;
      g = 166 - 150 * k;
      b = 50 - 45 * k;
    } else {
      // charred, cooling into the black cover
      const k = (u - 1) / 0.6;
      r = 125 * (1 - k) + 6 * k;
      g = 16 * (1 - k);
      b = 5 * (1 - k);
    }
    data[p] = r * flicker;
    data[p + 1] = g * flicker;
    data[p + 2] = b;
    data[p + 3] = a;
  }
  ctx.putImageData(image, 0, 0);
}

function introFinish() {
  document.querySelectorAll(".intro-burn-canvas").forEach((node) => node.remove());
  document.body.classList.remove("intro-running");
  introClearTimers();
  introState.phase = "off";
  markIntroSeen();
  playSoundtrack();
  saveArcadeRun();
}

/* ---------- Main menu: Jesus' eyes turn yellow on hover; a click replays the story ---------- */
// Silhouette of the menu Jesus for hit testing: one [left, right] span per 32 px row of his frame (0 = none).
const MENU_JESUS_HIT = {
  cell: 32,
  spans: [
    [414, 500], [374, 543], [378, 558], [371, 545], [359, 541], [321, 527], [292, 498], [283, 437], [273, 429], [285, 437],
    [282, 447], [280, 452], [272, 459], [263, 476], [259, 498], [269, 495], [267, 503], [253, 507], [243, 515], [241, 522],
    [240, 523], [296, 495], [281, 494], [277, 494], [289, 499], [360, 500], [352, 502], [338, 506], [320, 511], [213, 461],
    [210, 560], [209, 560], [180, 560], [174, 560], [180, 560], [180, 560], [178, 560], [169, 560], 0
  ]
};
const menuJesusState = { bound: false, triggering: false };

function menuJesusHit(clientX, clientY, target) {
  if (state.mode !== "menu" || introActive() || menuJesusState.triggering) return false;
  if (target?.closest?.(".main-menu-panel, .menu-version, button, input, a")) return false;
  const fig = document.querySelector(".menu-fig-jesus");
  if (!fig) return false;
  const rect = fig.getBoundingClientRect();
  const meta = MENU_FIGURES.jesus.meta;
  const fx = ((clientX - rect.left) / rect.width) * meta.W;
  const fy = ((clientY - rect.top) / rect.height) * meta.H;
  if (fx < 0 || fy < 0 || fx > meta.W || fy > meta.H) return false;
  const span = MENU_JESUS_HIT.spans[Math.floor(fy / MENU_JESUS_HIT.cell)];
  return Boolean(span && fx >= span[0] && fx <= span[1]);
}

function setMenuJesusLit(lit) {
  const fig = document.querySelector(".menu-fig-jesus");
  if (fig) fig.classList.toggle("eyes-lit", lit);
  document.querySelector(".main-menu")?.classList.toggle("jesus-hover", lit);
}

function bindMenuJesusTrigger() {
  if (menuJesusState.bound) return;
  menuJesusState.bound = true;
  document.addEventListener("pointermove", (event) => {
    if (state.mode !== "menu" || menuJesusState.triggering) return;
    setMenuJesusLit(menuJesusHit(event.clientX, event.clientY, event.target));
  });
  document.addEventListener("pointerdown", (event) => {
    if (menuJesusHit(event.clientX, event.clientY, event.target)) setMenuJesusLit(true);
  });
  document.addEventListener("click", (event) => {
    if (!menuJesusHit(event.clientX, event.clientY, event.target)) return;
    event.preventDefault();
    triggerMenuJesus();
  });
}

function triggerMenuJesus() {
  const fig = document.querySelector(".menu-fig-jesus");
  if (!fig) return;
  menuJesusState.triggering = true;
  setMenuJesusLit(true);
  fig.classList.add("eyes-flare");
  playGameSfx("menuJesusFlash");
  if (soundtrackAudio) duckMusic(1200);
  // white flash bursting out of his eye, then black
  const eye = fig.querySelector(".fig-eyes");
  const eyeRect = eye ? eye.getBoundingClientRect() : fig.getBoundingClientRect();
  const meta = MENU_FIGURES.jesus.meta;
  const ex = eye ? eyeRect.left + (eyeRect.width * 138) / meta.head.w : eyeRect.left + eyeRect.width / 2;
  const ey = eye ? eyeRect.top + (eyeRect.height * 107) / meta.head.h : eyeRect.top + eyeRect.height * 0.1;
  const flash = document.createElement("div");
  flash.className = "menu-jesus-flash";
  flash.style.setProperty("--flash-x", `${Math.round(ex)}px`);
  flash.style.setProperty("--flash-y", `${Math.round(ey)}px`);
  document.body.appendChild(flash);
  setTimeout(() => {
    startIntroSequence({ fromMenu: true });
    // keep the flash above the black story layer while it fades
    document.body.appendChild(flash);
    flash.classList.add("fading");
    setTimeout(() => flash.remove(), 1400);
    fig.classList.remove("eyes-flare");
    setMenuJesusLit(false);
    menuJesusState.triggering = false;
  }, 520);
}
