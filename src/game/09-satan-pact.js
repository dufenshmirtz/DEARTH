/* ---------- Satan's Pact: one deal with the Devil per run ----------
   The DEAL button under Pause (it pulses red while you are under 25% HEALTH, until you open the
   deal once). Satan walks in like in the story (same box over the SEAL slots, same typing). You type
   what you want; he names his price; YES signs, NO throws the chance away for the rest of the run.
   Asking for something he will not give, or gibberish, does not use the chance up. If he turns down a
   SEAL, the deal stays locked until your next BOSS kill.

   WHAT HE SAYS: every line is in SATAN_DEAL_LINES and SATAN_DEAL_PRICE_TEXT right below. Edit them
   freely. The first word of each line is who speaks (satan / you). Words in {CAPS} are filled in by the
   game: {ITEM} {COUNT} {SEAL} {OTHER} {DEMON} {NAME} {N} {ASKED} {PRICE} {Q}. {SIN} draws the SIN icon.
   Each key holds a list of lines said one after another.

   The rules and prices (decided Nov 2026, see the "Satan's Pact Prices" page):
   - 1 ARTIFACT: HEALTH = 0.5 x its Devil's Offerings price (at least 2), or 3 x that price in SIN, or
     only 1 ARTIFACT use a round for 3 rounds; one of the three at random among the ones you can pay.
   - 2 to 4 copies: Devil's Offerings closed for (copies) rounds, or HEALTH = 0.5 x all their prices.
   - ELITE (every SEAL slot open): the SEAL you name weighs 4, every other SEAL you own weighs 1. If it
     lands on yours: next BOSS +50% HEALTH, or lose a random SEAL. If it lands on another: next BOSS +30%.
   - Goetic SEAL (every SEAL slot open): 50% he says yes (80% if you have slain that demon), never while
     its BOSS lives. Price: a random SEAL of yours + HEALTH = the SEAL's price + 20% of your SIN; if the
     HEALTH would kill you, +50% damage taken for 3 rounds instead of the HEALTH.
   - Heal up to 5: next BOSS +10% HEALTH per HEALTH asked.
   - N SIN: next BOSS +2N% HEALTH and no BOSS BOUNTY; above 20, 1 HEALTH per 3 SIN over.
   - Kill a non-boss DAMNED: no ARTIFACTS for a round, and Satan keeps its BOUNTY.
   - +1 / +2 ARTIFACT uses this round: then only 1 use a round for 2 (or 5) rounds (0 with Seal of Orobas).
   - Cheat death: back with 1 HEALTH once; when it happens he takes a random SEAL, half your SIN, or the
     next BOSS comes with +50% HEALTH.
   - Seal of Satan: only with every SEAL slot open and empty. Free.
   Every number is x0.8 to x1.25 (most often near x1). 4+ SEALS sharing a build with the SEAL asked
   for (ELITE / SEAL) make the price x1.5. A HEALTH price never takes you below 1 HEALTH.
   "This round" means the current round during guess / ARTIFACTS, the next round from the results on. */

const SATAN_DEAL_LINES = {
  // first time you open the deal in a run
  open: [
    ["satan", "Well well, look who came crawling to me. Things not going so great down there, flesh puppet?"],
    ["satan", "I'm feeling generous today. One deal, just one, so make it count. Tell me what you want and I'll tell you what it costs."]
  ],
  // every time after that, until the deal is made
  openAgain: [["satan", "Back again? Spit it out, what do you want?"]],
  // the box under his line, where you type
  askPlaceholder: "Tell him what you want...",

  // asked for something he does not understand ({Q} is what you typed)
  gibberish: [["satan", "\"{Q}\"? What the hell is that supposed to mean? Speak clearly, I don't have all eternity. Well, I do, but still."]],
  // things he never gives
  angel: [["satan", "Feathers? You come to ME and ask for feathers? Go pray to your little Archangels, see how far that gets you."]],
  trinity: [["satan", "That one belongs to the big guy upstairs. Even I don't touch his toys."]],
  saturn: [["satan", "Solomon's pentacles? The trinkets he used to chain my demons? Ask me that again and I'll chain YOU."]],
  apocalypse: [["satan", "The SEALS of the end times are opened by the Lamb, not by me. Bah. Lambs."]],
  locked: [["satan", "That one isn't in my vault yet. Earn it first, then we talk."]],
  bound: [["satan", "You already have that demon on a leash, and for free. Greedy little thing, aren't you?"]],
  notDemon: [["satan", "That's not one of my demons. I only deal in what's mine."]],
  // SEAL or ELITE before every SEAL slot is open
  tooEarly: [["satan", "My demons don't serve nobodies. Open every SEAL slot you can, then come begging."]],
  sealOwned: [["satan", "You already carry {SEAL}. If you want it stronger, ask for an ELITE."]],
  eliteWhich: [["satan", "An ELITE on what? Name the SEAL, genius."]],
  eliteNotOwned: [["satan", "You can't make stronger something you don't even have."]],
  eliteCannot: [["satan", "{SEAL} can't get any stronger. Not even I can change that."]],
  demonBusy: [["satan", "{DEMON} is a little busy trying to kill you right now. Ask me later."]],
  // the 50% / 80% roll says no: the deal locks until the next BOSS kill
  sealRefused: [
    ["satan", "{DEMON} doesn't feel like serving you. Can't say I blame him."],
    ["satan", "Go kill another BOSS. Maybe I'll be in a better mood after that."]
  ],
  noRoomSeal: [["satan", "There's no room for another demon on you, and I'm not doing your tidying for you."]],
  handsFull: [["satan", "Your hands are full of junk already. Make some room before you ask for more."]],
  fullHealth: [["satan", "You're not even bleeding. Come back when it hurts."]],
  sinHowMuch: [["satan", "How much SIN{SIN}? Give me a number."]],
  killWho: [["satan", "Kill who? Give me a name."]],
  killBoss: [["satan", "BOSSES you deal with yourself. I only take the small fry."]],
  satanSealNotEmpty: [["satan", "My own SEAL? Ha! It doesn't share a home with other demons. Empty every slot, then ask me again."]],
  cheatDeathAlready: [["satan", "I already promised to drag you back once. Don't push your luck."]],

  // offers: the last line of an offer is followed by YES / NO
  artifact: [["satan", "{ITEM}? Cheap trinket. Fine, it's yours for {PRICE}."]],
  artifacts: [["satan", "{COUNT} of {ITEM}? Somebody's planning a party. That will be {PRICE}."]],
  artifactsCapped: [["satan", "Four. That's all I'll part with."]],
  elite: [["satan", "An ELITE on {SEAL}? Done. It'll cost you {PRICE}."]],
  eliteOther: [
    ["satan", "Hmm. My demons tell me it's {OTHER} that's ready to grow, not {SEAL}."],
    ["satan", "If you want it on {OTHER}, it's {PRICE}."]
  ],
  seal: [["satan", "{DEMON} agrees to serve you. For that, I take {PRICE}."]],
  heal: [["satan", "A little blood transfusion? {N} HEALTH, and in return {PRICE}."]],
  healTooMuch: [
    ["satan", "{ASKED} HEALTH? HAHAHA! You must be out of your mind."],
    ["satan", "I'll give you {N}, and you'll thank me for it. In return, {PRICE}."]
  ],
  sin: [["satan", "{N} SIN{SIN}, coming right up. In return, {PRICE}."]],
  sinCapped: [["satan", "That much would kill you, and a dead puppet pays nothing. {N} SIN{SIN} is all you can afford. In return, {PRICE}."]],
  kill: [["satan", "{NAME}? Never liked that one. Consider it done, but {PRICE}."]],
  uses: [["satan", "{N} more ARTIFACT use this round? Sure. Then {PRICE}."]],
  usesTwo: [["satan", "Two more ARTIFACT uses this round? Greedy. Then {PRICE}."]],
  usesTooMany: [["satan", "Two, or nothing. Don't get greedy with me."]],
  cheatDeath: [
    ["satan", "Cheating death, now that's my kind of deal. Next time you drop, I'll drag you back up."],
    ["satan", "The price? I'll pick it when you're lying on the floor."]
  ],
  satanSeal: [["satan", "My own SEAL, on an empty soul? You know what, I like you. No charge."]],
  // the question after every offer (said on the same line as the price)
  question: [["satan", "Do we have a deal, flesh puppet?"]],

  // after YES
  signed: [["satan", "Pleasure doing business with you."]],
  // after NO: the chance is gone for this run
  refused: [["satan", "Your loss. Don't come crawling back, you had your chance."]]
};

// how each part of a price reads inside {PRICE} ({N} = amount, {M} = rounds, {SEAL} = a SEAL's name)
const SATAN_DEAL_PRICE_TEXT = {
  hp: "{N} of your HEALTH",
  sin: "{N} SIN{SIN}",
  useCap: "only one ARTIFACT a round for the next {M} rounds",
  useCapZero: "no ARTIFACTS at all for the next {M} rounds",
  shopClosed: "my Offerings closed to you for {M} rounds",
  bossHealth: "the next BOSS walks in with {N}% more HEALTH",
  bossBounty: "its BOSS BOUNTY goes to me",
  loseSeal: "your {SEAL}",
  damageTaken: "{N}% more pain for {M} rounds",
  noArtifacts: "no ARTIFACTS for a round",
  keepBounty: "its BOUNTY goes to me",
  nothing: "nothing at all"
};

// the YES / NO buttons, and the buttons under the box where you type
const SATAN_DEAL_BUTTONS = { yes: "Yes", no: "No", ask: "Ask", leave: "Leave" };

/* ---- numbers ---- */
const SATAN_DEAL_ROLL_MIN = 0.8;
const SATAN_DEAL_ROLL_MAX = 1.25;
const SATAN_DEAL_LOW_HP = 0.25; // the Pause button pulses under this share of max HEALTH
const SATAN_DEAL_BUILD_STACK = 4; // this many SEALS sharing a build with the SEAL asked for...
const SATAN_DEAL_BUILD_FACTOR = 1.5; // ...make the price this much higher
const SATAN_DEAL_SEAL_ACCEPT = 0.5;
const SATAN_DEAL_SEAL_ACCEPT_SLAIN = 0.8;
const SATAN_DEAL_MAX_COPIES = 4;
const SATAN_DEAL_MAX_HEAL = 5;
const SATAN_DEAL_SOURCE = "Satan's Pact";

function satanPactFresh() {
  return {
    used: false, // signed or refused: the chance is gone
    outcome: null, // "signed" | "refused"
    request: "", // what was signed, for the records
    opened: false, // opened at least once (stops the pulse)
    lockedAtBossKills: null, // a refused SEAL: locked until state.bossKills goes past this
    offer: null, // the offer waiting for YES / NO (kept in the save)
    useBonus: null, // { round, n }
    useCaps: [], // [{ from, to, cap }]
    shopClosed: null, // { from, to }
    damageTaken: null, // { from, to, pct }
    bossDebt: null, // { healthPct, zeroBounty, pairGroupId }
    cheatDeath: false
  };
}

function satanPact() {
  if (!state.pact || typeof state.pact !== "object") state.pact = satanPactFresh();
  return state.pact;
}

/* ---- availability ---- */
function satanPactLocked() {
  const pact = satanPact();
  return pact.lockedAtBossKills !== null && pact.lockedAtBossKills !== undefined && state.bossKills <= pact.lockedAtBossKills;
}

function satanPactAvailable() {
  const pact = satanPact();
  return state.mode === "arcade" && !state.gameOver && !pact.used && !satanPactLocked();
}

function satanPactCanOpenNow() {
  return satanPactAvailable() && !introActive() && !roundRevealAnimationActive() && !state.pendingActive && state.player.hp > 0;
}

function satanPactPulseActive() {
  const pact = satanPact();
  return satanPactAvailable() && !pact.opened && !introActive() && state.player.hp > 0 && state.player.hp < playerMaxHp() * SATAN_DEAL_LOW_HP;
}

// the round "this round" means: the current one before READY, the next one from the results on
function satanPactEffectRound() {
  return ["guess", "active"].includes(state.stage) ? state.round : state.round + 1;
}

function satanPactRoll() {
  // triangular: most rolls land near x1, the ends are rare
  const lo = SATAN_DEAL_ROLL_MIN;
  const hi = SATAN_DEAL_ROLL_MAX;
  const mode = 1;
  const u = Math.random();
  const c = (mode - lo) / (hi - lo);
  return u < c ? lo + Math.sqrt(u * (hi - lo) * (mode - lo)) : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mode));
}

/* ---- effects the rest of the game asks about ---- */
function satanPactUseLimit(base) {
  const pact = state.pact;
  if (!pact || state.mode !== "arcade") return base;
  const round = state.round;
  let limit = base;
  if (pact.useBonus && pact.useBonus.round === round) limit += pact.useBonus.n;
  (pact.useCaps || []).forEach((cap) => {
    if (round >= cap.from && round <= cap.to) limit = Math.min(limit, cap.cap);
  });
  return Math.max(0, limit);
}

function satanPactShopClosed() {
  const closed = state.pact?.shopClosed;
  return Boolean(closed && state.mode === "arcade" && state.round >= closed.from && state.round <= closed.to);
}

function satanPactDamageTakenMultiplier() {
  const curse = state.pact?.damageTaken;
  if (!curse || state.mode !== "arcade" || state.round < curse.from || state.round > curse.to) return 1;
  return 1 + curse.pct / 100;
}

// a new BOSS pays the debt: more HEALTH, and maybe no BOSS BOUNTY (both of a pair, Petros and Pavlos)
function satanPactApplyBossDebt(bot) {
  const pact = state.pact;
  const debt = pact?.bossDebt;
  if (!debt || !bot?.isBoss || bot.immortal || state.mode !== "arcade") return;
  if (debt.pairGroupId && bot.pairGroupId !== debt.pairGroupId) {
    pact.bossDebt = null;
    return satanPactApplyBossDebt(bot);
  }
  const factor = 1 + Math.max(0, debt.healthPct || 0) / 100;
  bot.maxHp = Math.ceil(bot.maxHp * factor);
  bot.hp = bot.maxHp;
  if (debt.zeroBounty) bot.bossBountyFactor = 0;
  if (bot.pairGroupId && !debt.pairGroupId) {
    debt.pairGroupId = bot.pairGroupId; // the twin spawns right after and pays too
  } else {
    pact.bossDebt = null;
  }
  addLog(`${SATAN_DEAL_SOURCE}: ${bot.name} came with ${debt.healthPct}% more HEALTH${debt.zeroBounty ? " and no BOSS BOUNTY" : ""}.`);
}

function satanPactCheatDeathArmed() {
  return Boolean(state.pact?.cheatDeath && state.mode === "arcade");
}

// a blow that would kill you: back with 1 HEALTH, and Satan collects (returns the new HEALTH)
function satanPactCheatDeath() {
  const pact = satanPact();
  pact.cheatDeath = false;
  const options = [];
  const seals = satanPactOwnedSeals();
  if (seals.length) options.push("seal");
  if (Math.ceil(state.player.credits || 0) > 0) options.push("sin");
  options.push("boss");
  const pick = options[Math.floor(Math.random() * options.length)];
  let taken = "";
  if (pick === "seal") {
    const seal = seals[Math.floor(Math.random() * seals.length)];
    satanPactRemoveSeal(seal);
    taken = `your ${seal.name}`;
  } else if (pick === "sin") {
    const before = Math.max(0, Math.ceil(state.player.credits || 0));
    const lost = Math.ceil(before * 0.5);
    state.player.credits = before - lost;
    taken = `${lost} SIN`;
  } else {
    const pct = Math.round(50 * satanPactRoll());
    pact.bossDebt = { healthPct: pct, zeroBounty: false, pairGroupId: null };
    taken = `a debt: the next BOSS comes with ${pct}% more HEALTH`;
  }
  const message = `Satan dragged you back from death with 1 HEALTH and took ${taken}.`;
  if (state.roundState) addRoundEvent(message);
  addLog(message);
  return 1;
}

/* ---- your SEALS ---- */
function satanPactOwnedSeals() {
  return (state.player.passives || []).filter((item) => item && !REMOVED_PASSIVE_IDS.has(item.id));
}

function satanPactRemoveSeal(seal) {
  const index = state.player.passives.indexOf(seal);
  if (index >= 0) state.player.passives.splice(index, 1);
  refreshMimicTarget();
}

function satanPactBuildFactor(sealId, owned = satanPactOwnedSeals()) {
  const tags = (SEAL_BUILD_TAGS[sealId] || []).filter((tag) => tag !== "general");
  const strongest = tags.reduce((best, tag) => Math.max(best, owned.filter((item) => (SEAL_BUILD_TAGS[item.id] || []).includes(tag)).length), 0);
  return strongest >= SATAN_DEAL_BUILD_STACK ? SATAN_DEAL_BUILD_FACTOR : 1;
}

function satanPactAllSlotsOpen() {
  return passiveLimit() >= MAX_PASSIVE_LIMIT;
}

const SATAN_PACT_GOETIC_IDS = new Set(GOETIC_BOSS_SPECS.map((spec) => spec.passiveId));

function satanPactDemonForSeal(id) {
  return GOETIC_BOSS_SPECS.find((spec) => spec.passiveId === id) || null;
}

/* ---- reading what you typed ---- */
const SATAN_PACT_STOP_WORDS = new Set(["seal", "seals", "of", "the", "a", "an", "i", "want", "give", "me", "my", "your", "please", "some", "for", "to", "and", "dr", "dee", "dees", "with", "can", "get", "have", "need", "would", "like", "on", "x", "more", "copies", "copy"]);
const SATAN_PACT_NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2, pair: 2 };

function satanPactNormalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function satanPactNumber(normalized) {
  const digits = normalized.match(/\b(\d{1,4})\b/);
  if (digits) return Number(digits[1]);
  for (const word of normalized.split(" ")) if (SATAN_PACT_NUMBER_WORDS[word]) return SATAN_PACT_NUMBER_WORDS[word];
  return null;
}

function satanPactDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

function satanPactSimilarity(a, b) {
  const strip = (word) => (word.length > 4 && word.endsWith("es") ? word.slice(0, -2) : word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word);
  const x = strip(a);
  const y = strip(b);
  return 1 - satanPactDistance(x, y) / Math.max(x.length, y.length, 1);
}

function satanPactWords(normalized) {
  return normalized.split(" ").filter((word) => word.length >= 3 && !SATAN_PACT_STOP_WORDS.has(word) && !SATAN_PACT_NUMBER_WORDS[word] && !/^\d+$/.test(word));
}

// best name match among ids; returns { id, score } or null
function satanPactMatchName(normalized, ids, nameOf = (id) => ITEMS[id]?.name || "") {
  const queryWords = satanPactWords(normalized);
  let best = null;
  ids.forEach((id) => {
    const full = satanPactNormalize(nameOf(id));
    if (!full) return;
    const keyWords = satanPactWords(full);
    if (!keyWords.length) return;
    let score = 0;
    if (normalized.includes(full) || (keyWords.length > 1 && normalized.includes(keyWords.join(" ")))) score = 100;
    else {
      let hits = 0;
      let top = 0;
      keyWords.forEach((keyWord) => {
        const sim = queryWords.reduce((max, word) => Math.max(max, satanPactSimilarity(keyWord, word)), 0);
        // short words must be spelled right ("heal" is not "head"); longer ones forgive a typo or two
        const needed = keyWord.length <= 4 ? 1 : 0.75;
        if (sim >= needed) {
          hits += 1;
          top = Math.max(top, sim);
        }
      });
      if (hits) score = 50 * top + 25 * (hits / keyWords.length);
    }
    if (score >= 50 && (!best || score > best.score)) best = { id, score };
  });
  return best;
}

function satanPactRequestableArtifactIds() {
  return ACTIVE_IDS.filter((id) => !RESERVED_ARTIFACT_IDS.includes(id) && ITEMS[id]);
}

// every SEAL with a distinct name, Goetic first so a shared name means the demon's SEAL
function satanPactNamedSealIds() {
  const ids = Object.keys(ITEMS).filter((id) => ITEMS[id]?.type === "passive" && !REMOVED_PASSIVE_IDS.has(id));
  ids.sort((a, b) => (SATAN_PACT_GOETIC_IDS.has(b) ? 1 : 0) - (SATAN_PACT_GOETIC_IDS.has(a) ? 1 : 0));
  const seen = new Set();
  return ids.filter((id) => {
    const name = ITEMS[id].name;
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

function satanPactSealSection(id) {
  const section = COLLECTION_SECTIONS.find((entry) => entry.ids && entry.ids.includes(id));
  return section ? section.key : "player";
}

/* What you asked for. Returns { intent, ... } (never decides the price). */
function satanPactParse(text) {
  const normalized = satanPactNormalize(text);
  const number = satanPactNumber(normalized);
  if (!normalized) return { intent: "gibberish" };
  if (/\b(seal of satan|satans seal|your own seal|your seal|lucifer)\b/.test(normalized)) return { intent: "satanSeal" };
  const sealMatch = satanPactMatchName(normalized, satanPactNamedSealIds());
  if (/\b(elite|upgrade|stronger|level up)\b/.test(normalized)) {
    const owned = satanPactOwnedSeals().map((item) => item.id);
    const ownedMatch = satanPactMatchName(normalized, owned);
    return { intent: "elite", sealId: ownedMatch?.id || sealMatch?.id || null };
  }
  if (/\b(cheat death|revive|resurrect|second life|extra life|another life|undying|immortal|dont let me die|resurrection)\b/.test(normalized)) return { intent: "cheatDeath" };
  if (/\b(kill|murder|slay|eliminate|destroy|execute)\b/.test(normalized)) {
    const living = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated);
    const named = satanPactMatchName(normalized, living.map((bot) => bot.id), (id) => living.find((bot) => bot.id === id)?.name || "");
    return { intent: "kill", botId: named ? named.id : null };
  }
  const artifactMatch = satanPactMatchName(normalized, satanPactRequestableArtifactIds());
  if (artifactMatch && (!sealMatch || artifactMatch.score >= sealMatch.score)) {
    return { intent: "artifact", id: artifactMatch.id, count: number && number > 1 ? number : 1 };
  }
  if (sealMatch) return { intent: "seal", id: sealMatch.id };
  if (/\b(use|uses|action|actions)\b/.test(normalized)) return { intent: "uses", n: number || 1 };
  if (/\b(heal|healing|health|hp|cure|life|patch)\b/.test(normalized)) return { intent: "heal", n: number };
  if (/\b(sin|sins|money|cash|gold|coins|riches|wealth)\b/.test(normalized)) return { intent: "sin", n: number };
  return { intent: "gibberish" };
}

/* ---- prices ---- */
function satanPactFill(text, vars = {}) {
  return String(text).replace(/\{([A-Z]+)\}/g, (whole, key) => (key === "SIN" ? whole : vars[key] !== undefined ? String(vars[key]) : whole));
}

function satanPactPartText(part) {
  const t = SATAN_DEAL_PRICE_TEXT;
  switch (part.type) {
    case "hp":
      return satanPactFill(t.hp, { N: part.n });
    case "sin":
      return satanPactFill(t.sin, { N: part.n });
    case "useCap":
      return satanPactFill(part.cap === 0 ? t.useCapZero : t.useCap, { M: part.rounds });
    case "shopClosed":
      return satanPactFill(t.shopClosed, { M: part.rounds });
    case "bossHealth":
      return satanPactFill(t.bossHealth, { N: part.pct }) + (part.zeroBounty ? `, and ${t.bossBounty}` : "");
    case "loseSeal":
      return satanPactFill(t.loseSeal, { SEAL: ITEMS[part.id]?.name || "SEAL" });
    case "damageTaken":
      return satanPactFill(t.damageTaken, { N: part.pct, M: part.rounds });
    case "noArtifacts":
      return t.noArtifacts;
    case "keepBounty":
      return t.keepBounty;
    default:
      return "";
  }
}

function satanPactPriceText(parts) {
  const texts = parts.map(satanPactPartText).filter(Boolean);
  if (!texts.length) return SATAN_DEAL_PRICE_TEXT.nothing;
  if (texts.length === 1) return texts[0];
  return `${texts.slice(0, -1).join(", ")} and ${texts[texts.length - 1]}`;
}

function satanPactRandomOf(options) {
  return options[Math.floor(Math.random() * options.length)];
}

// a random SEAL of yours, never the one named in except
function satanPactRandomSealToLose(exceptUid = null) {
  const seals = satanPactOwnedSeals().filter((item) => item.uid !== exceptUid || !exceptUid);
  return seals.length ? satanPactRandomOf(seals) : null;
}

function satanPactArtifactRoom() {
  return Math.max(0, activeInventoryLimit() - state.player.actives.length);
}

function satanPactBaseUseLimitWithoutPact() {
  return hasPassive("p24") ? 1 : ACTIVE_USES_PER_ROUND + baseEditionBonus("p126");
}

function satanPactArtifactOffer(id, askedCount) {
  const room = satanPactArtifactRoom();
  if (room <= 0) return { refuse: "handsFull" };
  const capped = askedCount > SATAN_DEAL_MAX_COPIES;
  const count = Math.max(1, Math.min(askedCount, SATAN_DEAL_MAX_COPIES, room));
  const item = ITEMS[id];
  const unit = Math.max(1, shopPrice({ ...item }));
  const from = satanPactEffectRound();
  const hp = state.player.hp;
  const options = [];
  if (count === 1) {
    const hpCost = Math.max(2, Math.round(0.5 * unit * satanPactRoll()));
    if (hp - hpCost >= 1) options.push([{ type: "hp", n: hpCost }]);
    const sinCost = Math.max(1, Math.round(3 * unit * satanPactRoll()));
    if (Math.ceil(state.player.credits || 0) >= sinCost) options.push([{ type: "sin", n: sinCost }]);
    const rounds = Math.max(1, Math.round(3 * satanPactRoll()));
    const cap = satanPactBaseUseLimitWithoutPact() > 1 ? 1 : 0;
    options.push([{ type: "useCap", cap, from, to: from + rounds - 1, rounds }]);
  } else {
    const rounds = Math.max(1, Math.round(count * satanPactRoll()));
    options.push([{ type: "shopClosed", from, to: from + rounds - 1, rounds }]);
    const hpCost = Math.max(2, Math.round(0.5 * unit * count * satanPactRoll()));
    if (hp - hpCost >= 1) options.push([{ type: "hp", n: hpCost }]);
  }
  const price = satanPactRandomOf(options);
  const vars = { ITEM: item.name, COUNT: count };
  const lines = [...(capped ? SATAN_DEAL_LINES.artifactsCapped : []), ...(count === 1 ? SATAN_DEAL_LINES.artifact : SATAN_DEAL_LINES.artifacts)];
  return { gain: { type: "artifact", id, count }, price, lines, vars, request: count === 1 ? item.name : `${count}x ${item.name}` };
}

function satanPactEliteOffer(sealId) {
  if (!satanPactAllSlotsOpen()) return { refuse: "tooEarly" };
  if (!sealId) return { refuse: "eliteWhich" };
  const owned = satanPactOwnedSeals();
  const requested = owned.find((item) => item.id === sealId);
  if (!requested) return { refuse: "eliteNotOwned" };
  if (isNonUpgradableSeal(sealId)) return { refuse: "eliteCannot", vars: { SEAL: ITEMS[sealId].name } };
  const pool = owned.filter((item) => !isNonUpgradableSeal(item.id));
  const weights = pool.map((item) => (item === requested ? 4 : 1));
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  let target = pool[pool.length - 1];
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) {
      target = pool[i];
      break;
    }
  }
  const factor = satanPactBuildFactor(target.id, owned);
  const vars = { SEAL: ITEMS[sealId].name, OTHER: ITEMS[target.id].name };
  if (target === requested) {
    const options = [[{ type: "bossHealth", pct: Math.round(50 * satanPactRoll() * factor) }]];
    const lose = satanPactRandomSealToLose(target.uid);
    if (lose) options.push([{ type: "loseSeal", id: lose.id, uid: lose.uid }]);
    return { gain: { type: "elite", id: target.id, uid: target.uid }, price: satanPactRandomOf(options), lines: SATAN_DEAL_LINES.elite, vars, request: `ELITE ${ITEMS[target.id].name}` };
  }
  return {
    gain: { type: "elite", id: target.id, uid: target.uid },
    price: [{ type: "bossHealth", pct: Math.round(30 * satanPactRoll() * factor) }],
    lines: SATAN_DEAL_LINES.eliteOther,
    vars,
    request: `ELITE ${ITEMS[target.id].name}`
  };
}

function satanPactSealOffer(id) {
  const section = satanPactSealSection(id);
  if (SELF_STACKING_SEAL_IDS.has(id) || section === "archangel") return { refuse: "angel" };
  if (section === "trinity") return { refuse: "trinity" };
  if (section === "saturn") return { refuse: "saturn" };
  if (section === "apocalypse") return { refuse: "apocalypse" };
  if (section === "satan") return satanPactSatanSealOffer();
  if (!SATAN_PACT_GOETIC_IDS.has(id)) return { refuse: "notDemon" };
  if (isSealLocked(id)) return { refuse: "locked" };
  if (isBoundDemonSeal(id)) return { refuse: "bound" };
  if (!satanPactAllSlotsOpen()) return { refuse: "tooEarly" };
  const demon = satanPactDemonForSeal(id);
  const vars = { SEAL: ITEMS[id].name, DEMON: demon?.name || ITEMS[id].name };
  if (directPassiveStack(id)) return { refuse: "sealOwned", vars };
  if (suppressingBossForSeal(id)) return { refuse: "demonBusy", vars };
  const owned = satanPactOwnedSeals();
  const lose = satanPactRandomSealToLose();
  const slotsAfter = ownedSealSlotCount() - (lose ? sealSlotCost(lose) : 0) + sealSlotCost(id);
  if (slotsAfter > passiveLimit()) return { refuse: "noRoomSeal", vars };
  const acceptChance = demon && isDemonSlain(demon.key) ? SATAN_DEAL_SEAL_ACCEPT_SLAIN : SATAN_DEAL_SEAL_ACCEPT;
  if (Math.random() >= acceptChance) return { refuse: "sealRefused", vars, lock: true };
  const factor = satanPactBuildFactor(id, owned);
  const price = [];
  if (lose) price.push({ type: "loseSeal", id: lose.id, uid: lose.uid });
  const hpCost = Math.max(1, Math.round(ITEMS[id].price * satanPactRoll() * factor));
  if (state.player.hp - hpCost >= 1) price.push({ type: "hp", n: hpCost });
  else {
    const from = satanPactEffectRound();
    const rounds = Math.max(1, Math.round(3 * satanPactRoll() * factor));
    price.push({ type: "damageTaken", pct: 50, from, to: from + rounds - 1, rounds });
  }
  const sinCost = Math.round(0.2 * Math.max(0, Math.ceil(state.player.credits || 0)) * satanPactRoll() * factor);
  if (sinCost > 0) price.push({ type: "sin", n: Math.min(sinCost, Math.ceil(state.player.credits || 0)) });
  return { gain: { type: "seal", id }, price, lines: SATAN_DEAL_LINES.seal, vars, request: ITEMS[id].name };
}

function satanPactSatanSealOffer() {
  if (!satanPactAllSlotsOpen()) return { refuse: "tooEarly" };
  if (satanPactOwnedSeals().length) return { refuse: "satanSealNotEmpty" };
  return { gain: { type: "seal", id: "p111" }, price: [], lines: SATAN_DEAL_LINES.satanSeal, vars: {}, request: ITEMS.p111.name };
}

function satanPactHealOffer(asked) {
  if (state.player.hp >= playerMaxHp()) return { refuse: "fullHealth" };
  const askedN = asked && asked > 0 ? asked : SATAN_DEAL_MAX_HEAL;
  const n = Math.min(askedN, SATAN_DEAL_MAX_HEAL);
  const price = [{ type: "bossHealth", pct: Math.max(1, Math.round(10 * n * satanPactRoll())) }];
  const lines = askedN > SATAN_DEAL_MAX_HEAL ? SATAN_DEAL_LINES.healTooMuch : SATAN_DEAL_LINES.heal;
  return { gain: { type: "heal", n }, price, lines, vars: { N: n, ASKED: askedN }, request: `${n} HEALTH` };
}

function satanPactSinOffer(asked) {
  if (!asked || asked <= 0) return { refuse: "sinHowMuch" };
  let n = Math.floor(asked);
  const pctRoll = satanPactRoll();
  const hpRoll = satanPactRoll();
  const hpCostFor = (amount) => (amount > 20 ? Math.max(1, Math.round(Math.ceil((amount - 20) / 3) * hpRoll)) : 0);
  let capped = false;
  while (n > 20 && state.player.hp - hpCostFor(n) < 1) {
    n -= 1;
    capped = true;
  }
  const price = [{ type: "bossHealth", pct: Math.max(1, Math.round(2 * n * pctRoll)), zeroBounty: true }];
  const hpCost = hpCostFor(n);
  if (hpCost > 0) price.push({ type: "hp", n: hpCost });
  return { gain: { type: "gainSin", n }, price, lines: capped ? SATAN_DEAL_LINES.sinCapped : SATAN_DEAL_LINES.sin, vars: { N: n }, request: `${n} SIN` };
}

function satanPactKillOffer(botId) {
  if (!botId) return { refuse: "killWho" };
  const bot = state.bots.find((entry) => entry.id === botId);
  if (!bot || bot.hp <= 0 || bot.eliminated) return { refuse: "killWho" };
  if (bot.isBoss || bot.immortal) return { refuse: "killBoss" };
  const round = satanPactEffectRound();
  return {
    gain: { type: "kill", botId },
    price: [{ type: "noArtifacts", round }, { type: "keepBounty" }],
    lines: SATAN_DEAL_LINES.kill,
    vars: { NAME: bot.name },
    request: `the death of ${bot.name}`
  };
}

function satanPactUsesOffer(asked) {
  const tooMany = asked > 2;
  const n = Math.max(1, Math.min(2, asked || 1));
  const round = satanPactEffectRound();
  const rounds = Math.max(1, Math.round((n === 1 ? 2 : 5) * satanPactRoll()));
  const cap = satanPactBaseUseLimitWithoutPact() > 1 ? 1 : 0;
  const lines = [...(tooMany ? SATAN_DEAL_LINES.usesTooMany : []), ...(n === 1 ? SATAN_DEAL_LINES.uses : SATAN_DEAL_LINES.usesTwo)];
  return {
    gain: { type: "useBonus", n, round },
    price: [{ type: "useCap", cap, from: round + 1, to: round + rounds, rounds }],
    lines,
    vars: { N: n },
    request: `+${n} ARTIFACT use${n === 1 ? "" : "s"}`
  };
}

function satanPactCheatDeathOffer() {
  if (satanPact().cheatDeath) return { refuse: "cheatDeathAlready" };
  return { gain: { type: "cheatDeath" }, price: [], lines: SATAN_DEAL_LINES.cheatDeath, vars: {}, request: "a second life" };
}

// what Satan answers to a request: { refuse, vars, lock } or an offer
function satanPactAnswer(text) {
  const asked = satanPactParse(text);
  switch (asked.intent) {
    case "artifact":
      return satanPactArtifactOffer(asked.id, asked.count);
    case "elite":
      return satanPactEliteOffer(asked.sealId);
    case "seal":
      return satanPactSealOffer(asked.id);
    case "satanSeal":
      return satanPactSatanSealOffer();
    case "heal":
      return satanPactHealOffer(asked.n);
    case "sin":
      return satanPactSinOffer(asked.n);
    case "kill":
      return satanPactKillOffer(asked.botId);
    case "uses":
      return satanPactUsesOffer(asked.n);
    case "cheatDeath":
      return satanPactCheatDeathOffer();
    default:
      return { refuse: "gibberish", vars: { Q: String(text || "").trim().slice(0, 40) || "..." } };
  }
}

// the lines Satan says for an answer (offers end with the question)
function satanPactAnswerLines(answer) {
  const vars = { ...(answer.vars || {}) };
  if (answer.refuse) {
    return (SATAN_DEAL_LINES[answer.refuse] || SATAN_DEAL_LINES.gibberish).map(([speaker, text]) => [speaker, satanPactFill(text, vars)]);
  }
  vars.PRICE = satanPactPriceText(answer.price);
  const lines = answer.lines.map(([speaker, text]) => [speaker, satanPactFill(text, vars)]);
  // the question goes on the same line as the price, so YES / NO sit right under it
  const question = SATAN_DEAL_LINES.question.map(([, text]) => text).join(" ");
  const last = lines[lines.length - 1];
  lines[lines.length - 1] = [last[0], `${last[1]} ${question}`];
  return lines;
}

/* ---- YES: pay and receive ---- */
function satanPactPay(part) {
  const pact = satanPact();
  switch (part.type) {
    case "hp": {
      const cost = Math.max(0, Math.min(part.n, state.player.hp - 1));
      state.player.hp -= cost;
      if (cost > 0) {
        state.playerLastDamage = (state.playerLastDamage || 0) + cost;
        recordPlayerDamageSource(cost, SATAN_DEAL_SOURCE);
      }
      break;
    }
    case "sin": {
      const before = Math.max(0, Math.ceil(state.player.credits || 0));
      state.player.credits = before - Math.min(before, part.n);
      break;
    }
    case "useCap":
      pact.useCaps.push({ from: part.from, to: part.to, cap: part.cap });
      break;
    case "noArtifacts":
      pact.useCaps.push({ from: part.round, to: part.round, cap: 0 });
      break;
    case "shopClosed":
      pact.shopClosed = { from: part.from, to: part.to };
      syncShopSlotCount();
      break;
    case "bossHealth":
      pact.bossDebt = { healthPct: part.pct, zeroBounty: Boolean(part.zeroBounty), pairGroupId: null };
      break;
    case "loseSeal": {
      const seal = state.player.passives.find((item) => item.uid === part.uid) || state.player.passives.find((item) => item.id === part.id);
      if (seal) satanPactRemoveSeal(seal);
      break;
    }
    case "damageTaken":
      pact.damageTaken = { from: part.from, to: part.to, pct: part.pct };
      break;
    default:
      break;
  }
}

function satanPactReceive(gain) {
  const pact = satanPact();
  switch (gain.type) {
    case "artifact":
      for (let i = 0; i < gain.count && state.player.actives.length < activeInventoryLimit(); i += 1) {
        state.player.actives.push(freeActiveCopy(gain.id));
      }
      state.activeCarouselIndex = Math.max(0, state.player.actives.length - 1);
      break;
    case "elite": {
      const seal = state.player.passives.find((item) => item.uid === gain.uid) || state.player.passives.find((item) => item.id === gain.id);
      if (seal) {
        seal.stack = (seal.stack || 1) + 1;
        seal.freeStacks = (seal.freeStacks || 0) + 1;
        recordEliteLevelBought(seal.id, seal.stack);
      }
      break;
    }
    case "seal": {
      const seal = itemCopy(gain.id);
      seal.freeStacks = 1;
      state.player.passives.push(seal);
      refreshMimicTarget();
      recordPlayedSeal(gain.id);
      break;
    }
    case "heal": {
      const before = state.player.hp;
      state.player.hp = Math.min(playerMaxHp(), state.player.hp + gain.n);
      const healed = state.player.hp - before;
      if (healed > 0) {
        state.playerLastHeal = (state.playerLastHeal || 0) + healed;
        recordPlayerHealSource(healed, SATAN_DEAL_SOURCE);
      }
      break;
    }
    case "gainSin":
      gainCredits(gain.n, false, SATAN_DEAL_SOURCE);
      break;
    case "kill": {
      const bot = state.bots.find((entry) => entry.id === gain.botId);
      if (bot && bot.hp > 0 && !bot.eliminated && !bot.isBoss) {
        bot.lastDamage = (bot.lastDamage || 0) + bot.hp;
        bot.hp = 0;
        bot.skipEliminationReward = true;
        bot.deathCause = "satan";
        bot.deathNotice = "SATAN";
        if (state.roundState) {
          state.roundState.roundEvents.push(`Satan took ${bot.name}. Its BOUNTY is his.`);
          resolveEliminatedBots([bot]);
        }
      }
      break;
    }
    case "useBonus":
      pact.useBonus = { round: gain.round, n: gain.n };
      break;
    case "cheatDeath":
      pact.cheatDeath = true;
      break;
    default:
      break;
  }
}

// YES: pay everything, then receive; the chance is used
function satanPactSign() {
  const pact = satanPact();
  const offer = pact.offer;
  if (!offer) return false;
  offer.price.forEach(satanPactPay);
  satanPactReceive(offer.gain);
  pact.used = true;
  pact.outcome = "signed";
  pact.request = offer.request || "";
  pact.offer = null;
  addLog(`${SATAN_DEAL_SOURCE}: you got ${offer.request} for ${satanPactPriceText(offer.price).replace(/\{SIN\}/g, "")}.`);
  return true;
}

// NO: the chance is gone for this run
function satanPactRefuse() {
  const pact = satanPact();
  pact.used = true;
  pact.outcome = "refused";
  pact.offer = null;
  addLog("You refused Satan's deal. He will not offer again this run.");
}

// a request: an offer waits for YES / NO; a refusal maybe locks the deal; returns the lines to say
function satanPactRequest(text) {
  const pact = satanPact();
  const answer = satanPactAnswer(text);
  if (!answer.refuse) {
    pact.offer = { gain: answer.gain, price: answer.price, request: answer.request, lines: satanPactAnswerLines(answer) };
    return { lines: pact.offer.lines, next: "offer" };
  }
  if (answer.lock) {
    pact.lockedAtBossKills = state.bossKills;
    return { lines: satanPactAnswerLines(answer), next: "leave" };
  }
  return { lines: satanPactAnswerLines(answer), next: "ask" };
}

/* ---- the scene (uses the story's Satan box: 09-intro-story.js) ---- */
const satanDealScene = { next: "ask" };

function openSatanDeal() {
  if (!satanPactCanOpenNow()) return;
  const pact = satanPact();
  state.pauseOpen = false;
  state.pauseScreen = "main";
  render();
  let lines;
  if (pact.offer) {
    lines = pact.offer.lines;
    satanDealScene.next = "offer";
  } else {
    lines = pact.opened ? SATAN_DEAL_LINES.openAgain : SATAN_DEAL_LINES.open;
    satanDealScene.next = "ask";
  }
  pact.opened = true;
  saveArcadeRun();
  satanOpenScene("deal", lines, "satan-deal-layer");
}

// the last part of his last line is down: show what comes next (the box to type in, or YES / NO)
function satanDealAfterTalk() {
  const box = introState.box;
  if (introState.phase !== "deal" || !box || box.classList.contains("intro-choosing")) return;
  if (satanDealScene.next === "ask") satanDealShowAsk();
  else if (satanDealScene.next === "offer") satanDealShowChoice();
}

// a click after the last line
function satanDealEndOfLines() {
  if (satanDealScene.next === "leave") satanLeaveScene("deal");
  else satanDealAfterTalk();
}

function satanDealShowAsk() {
  const box = introState.box;
  introSetWaiting(false);
  box.classList.add("intro-choosing");
  const form = document.createElement("form");
  form.className = "intro-choice pact-ask";
  form.setAttribute("autocomplete", "off");
  form.innerHTML = `
    <input class="pact-ask-input" type="text" maxlength="80" spellcheck="false" aria-label="What do you want from Satan?" />
    <button class="intro-choice-button" type="submit">${escapeHtml(SATAN_DEAL_BUTTONS.ask)}</button>
    <button class="intro-choice-button pact-ask-leave" type="button">${escapeHtml(SATAN_DEAL_BUTTONS.leave)}</button>`;
  const input = form.querySelector("input");
  input.placeholder = SATAN_DEAL_LINES.askPlaceholder;
  form.addEventListener("click", (event) => event.stopPropagation());
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    satanDealAsk(input.value);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      satanDealLeaveUnused();
    }
  });
  form.querySelector(".pact-ask-leave").addEventListener("click", satanDealLeaveUnused);
  box.appendChild(form);
  introFitText();
  setTimeout(() => input.focus(), 30);
}

function satanDealClearControls() {
  const box = introState.box;
  box?.querySelector(".intro-choice")?.remove();
  box?.classList.remove("intro-choosing");
}

function satanDealAsk(text) {
  if (introState.phase !== "deal") return;
  if (!String(text || "").trim()) return;
  satanDealClearControls();
  const result = satanPactRequest(text);
  satanDealScene.next = result.next;
  saveArcadeRun();
  introState.lines = result.lines;
  introShowLine(0);
}

function satanDealShowChoice() {
  const box = introState.box;
  introSetWaiting(false);
  box.classList.add("intro-choosing");
  const choice = document.createElement("div");
  choice.className = "intro-choice";
  choice.innerHTML = `
    <button class="intro-choice-button" type="button" data-choice="yes">${escapeHtml(SATAN_DEAL_BUTTONS.yes)}</button>
    <button class="intro-choice-button" type="button" data-choice="no">${escapeHtml(SATAN_DEAL_BUTTONS.no)}</button>`;
  choice.addEventListener("click", (event) => {
    event.stopPropagation();
    const button = event.target.closest("[data-choice]");
    if (button) satanDealChoose(button.dataset.choice === "yes");
  });
  box.appendChild(choice);
  introFitText();
}

function satanDealChoose(yes) {
  const box = introState.box;
  if (introState.phase !== "deal" || !box?.classList.contains("intro-choosing") || !satanPact().offer) return;
  satanDealClearControls();
  if (!yes) {
    satanPactRefuse();
    saveArcadeRun();
    render();
    satanDealScene.next = "leave";
    introState.lines = SATAN_DEAL_LINES.refused;
    introShowLine(0);
    return;
  }
  satanPactSign();
  satanDealScene.next = "leave";
  if (state.player.hp <= 0) finishGameOverRound();
  saveArcadeRun();
  // the pact sound and the red pulse, as when the story's pact was sealed
  box.classList.add("intro-box-hush", "intro-box-pulse");
  introState.glyphs = [];
  introState.shown = 0;
  introDrawText();
  introPlaySfx("introEvil");
  render();
  introLater(() => {
    if (introState.phase !== "deal") return;
    introState.box?.classList.remove("intro-box-pulse", "intro-box-hush");
    satanDealScene.next = "leave";
    introState.lines = SATAN_DEAL_LINES.signed;
    introShowLine(0);
  }, 2000);
}

// Leave / Esc while typing: he goes, the chance stays
function satanDealLeaveUnused() {
  if (introState.phase !== "deal") return;
  satanDealClearControls();
  satanLeaveScene("deal");
}

// skip: straight to the end of what he is saying (an offer to its YES / NO)
function satanDealSkip() {
  if (introState.box?.classList.contains("intro-choosing")) {
    if (satanDealScene.next === "ask") satanDealLeaveUnused();
    return;
  }
  if (satanDealScene.next === "leave") {
    satanLeaveScene("deal");
    return;
  }
  const last = introState.lines.length - 1;
  if (introState.lineIndex !== last) introShowLine(last);
  clearInterval(introState.typeTimer);
  introState.typeTimer = null;
  introState.typing = false;
  introState.chunk = introState.ends.length - 1;
  introState.shown = introState.glyphs.length;
  introDrawText();
  introPartTyped();
}

// on a short screen (the phone) the SEAL slots are too small for a conversation: the box grows upward
function satanDealBoxRect(rect) {
  if (!rect || typeof window === "undefined" || window.innerHeight >= 600) return rect;
  const bottom = rect.top + rect.height;
  const height = Math.max(rect.height, Math.round(window.innerHeight * 0.5));
  const width = Math.max(rect.width, Math.round(window.innerWidth * 0.55));
  return { left: rect.left, top: Math.max(4, bottom - height), width: Math.min(width, window.innerWidth - rect.left - 4), height: Math.min(height, bottom - 4) };
}

/* ---- the DEAL button, under the Pause button ---- */
// hidden in the story's tutorial; greyed out once the deal is made, refused or locked
function satanDealButtonHtml() {
  if (state.mode !== "arcade") return "";
  if (["black", "judgement", "booting", "tutorial", "pact", "reveal"].includes(introState.phase)) return "";
  const pact = satanPact();
  let tooltip = "Make a deal with Satan. Once per run.";
  if (pact.used) {
    tooltip = pact.outcome === "signed" ? `Deal signed: ${pact.request}.` : "You refused Satan. He will not offer again this run.";
  } else if (satanPactLocked()) {
    tooltip = "Satan is not listening. Kill another BOSS.";
  } else if (!satanPactCanOpenNow()) {
    tooltip = "Not right now.";
  }
  const disabled = !satanPactCanOpenNow() ? "disabled" : "";
  const pulse = satanPactPulseActive() ? "pact-calling" : "";
  return `<button class="pause-button deal-button ${pulse}" id="dealButton" aria-label="Make a deal with Satan" data-tooltip="${escapeAttr(tooltip)}" ${disabled}>DEAL</button>`;
}
