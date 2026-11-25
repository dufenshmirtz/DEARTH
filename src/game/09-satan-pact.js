/* ---------- Satan's Pact: one deal with the Devil per run ----------
   The DEAL button under Pause (it pulses slowly to red until you open the deal once in the run, and
   fast while you are under 25% SOUL). Satan walks in like in the story (same box over the SEAL slots, same typing). You type
   what you want; he names his price; YES signs, NO throws the chance away for the rest of the run.
   Asking for something he will not give, or gibberish, does not use the chance up. If he turns down a
   SEAL, the deal stays locked until your next BOSS kill.

   WHAT HE SAYS: every line is in SATAN_DEAL_LINES and SATAN_DEAL_PRICE_TEXT(_FOR) right below. Edit them
   freely. The first word of each line is who speaks (satan / you). Words in {CAPS} are filled in by the
   game: {ITEM} {COUNT} {SEAL} {OTHER} {DEMON} {NAME} {N} {ASKED} {PRICE} {Q} {WORD}. {SIN} draws the SIN icon.
   Each key holds a list of lines said one after another.

   The rules and prices (decided Nov 2026, see the "Satan's Pact Prices" page):
   - 1 ARTIFACT: SOUL = 0.5 x its Devil's Offerings price (at least 2), or 3 x that price in SIN, or
     only 1 ARTIFACT use a round for 3 rounds; one of the three at random among the ones you can pay.
   - 2 to 4 copies: Devil's Offerings closed for (copies) rounds, or SOUL = 0.5 x all their prices.
   - ELITE (every SEAL slot open): the SEAL you name weighs 4, every other SEAL you own weighs 1. If it
     lands on yours: next BOSS +50% SOUL, or lose a random SEAL. If it lands on another: next BOSS +30%.
   - Goetic SEAL (every SEAL slot open): 50% he says yes (80% if you have slain that demon), never while
     its BOSS lives. Price: a random SEAL of yours + SOUL = the SEAL's price + 20% of your SIN; if the
     SOUL would kill you, +50% damage taken for 3 rounds instead of the SOUL.
   - Heal up to 5: next BOSS +10% SOUL per SOUL asked.
   - N SIN: next BOSS +2N% SOUL and no BOSS BOUNTY; above 20, 1 SOUL per 3 SIN over.
   - Kill a non-boss DAMNED: no ARTIFACTS for a round, and Satan keeps its BOUNTY.
   - +1 / +2 ARTIFACT uses this round: then only 1 use a round for 2 (or 5) rounds (0 with Seal of Orobas).
   - Cheat death: back with 1 SOUL once; when it happens he takes a random SEAL, half your SIN, or the
     next BOSS comes with +50% SOUL.
   - Seal of Satan: only with every SEAL slot open and empty. Free.
   - N FAVOR (up to 6; only once the slot machine and missions are open, 09-slot-missions.js, otherwise he
     doesn't follow): 4 SIN per FAVOR; short of SIN, 1 SOUL per FAVOR; if that would kill you, his Offerings
     closed for half as many rounds.
   - KARMA (or Jesus' Gifts): never; he sends you to Jesus.
   Every number is x0.8 to x1.25 (most often near x1). 4+ SEALS sharing a build with the SEAL asked
   for (ELITE / SEAL) make the price x1.5. A SOUL price never takes you below 1 SOUL.
   "This round" means the current round during guess / ARTIFACTS, the next round from the results on.

   TRICKS (SATAN_TRICKS below; the Faustian Codex in 09-codex.js hints at them): words in what you type. Each family
   found rolls once when he makes an offer (refusals and free deals ignore them) and he reacts before the offer
   (trick... lines). Silver Tongue (flattery) 50%: price x0.7, caught x1.2. Clerk's Tongue (contract words) 50%:
   strikes one part of a two-part price (one part: x0.7), caught x1.2. Stolen Tongue (Latin) 40%: x0.5, caught x1.3.
   The Name (Mephistopheles) 50%: a SEAL is a sure yes, an ELITE lands on the SEAL you named, anything else x0.7;
   caught x1.3 and a SEAL's yes-chance halved. The Ink (in blood): always believed: a SEAL's yes-chance +30%, an
   ELITE 3x likelier on yours; always +3 SOUL on the price. Traps, always: God's name x1.5, offering your soul x1.3,
   please x1.1. Three or more helping families at once: all of them are caught (trickConfession). Every number of the
   price is scaled (SOUL, SIN, rounds, BOSS SOUL %), in all between x0.4 and x3. The words are taken out before he
   reads the request (not the holy ones, which name SEALS too). The book: codexNoteResponses / codexNoteTrick. */

const SATAN_DEAL_LINES = {
  // first time you open the deal in a run
  open: [
    ["satan", "Well well well, look who it is again, my loathsome little minion. So, what does your wretched heart desire?"]
  ],
  // every time after that, until the deal is made
  openAgain: [["satan", "You got nerve calling me again whippersnapper, so come on spit it out."]],
  // the box under his line, where you type
  askPlaceholder: "Tell him what you want...",

  // asked for something he does not understand ({Q} is what you typed)
  gibberish: [["satan", "\"{Q}\"? Is this supposed to be a joke? I don't have time for your nonsense. Make a reasonable request before eternity catches up with you mortal."]],
  // things he never gives
  angel: [["satan", "Feathers? You come to ME and ask for feathers? You must be out of your mind. Go pray to your little Archangels, see how far that gets you."]],
  trinity: [["satan", "That one belongs to the big guy upstairs. Even I don't touch his toys."]],
  // the Planetary SEALS: Seals of Saturn, Moon and Mars
  planetary: [["satan", "Solomon's pentacles? The trinkets he used to chain my demons? Ask me that again and I'll chain YOU."]],
  apocalypse: [["satan", "The SEALS of the end times are opened by the Lamb, not by me."]],
  // KARMA or Jesus' Gifts
  karma: [["satan", "I don't touch that my dear sinner, that's Jesus' domain, ask for something else."]],
  locked: [["satan", "You are not worthy for that yet. Earn it first, then we'll talk."]],
  bound: [["satan", "You already have that demon on a leash, and for free might I add. Greedy little thing, aren't you?"]],
  notDemon: [["satan", "That one is not one of my demons. I only deal in what's mine."]],
  // SEAL or ELITE before every SEAL slot is open
  tooEarly: [["satan", "Listen here you ungrateful worm, I ain't gonna do all the work for you. Open every SEAL slot you can, then you may come begging again."]],
  sealOwned: [["satan", "You already control the {SEAL}. If you want to increase its power, ask for an ELITE."]],
  eliteWhich: [["satan", "An ELITE of what? Name the SEAL."]],
  eliteNotOwned: [["satan", "You can't increase the power of something you don't have."]],
  eliteCannot: [["satan", "{SEAL} can't get any stronger. Does your avarice know no limit? I can respect that."]],
  demonBusy: [["satan", "{DEMON} is a little busy trying to kill you right now. It would be very rude to do that. Did your mother never teach you manners?"]],
  // the 50% / 80% roll says no: the deal locks until the next BOSS kill
  sealRefused: [
    ["satan", "{DEMON} doesn't feel like serving you right now. Can't say I blame him."],
    ["satan", "You are starting to bore me. Go kill another BOSS. Maybe I'll be in a better mood after that."]
  ],
  noRoomSeal: [["satan", "My demons start complaining when they feel crammed, try opening up some more room for now."]],
  handsFull: [["satan", "Your little fleshy hands are already full. Make some room before you ask for more."]],
  fullHealth: [["satan", "There's only so much SOUL your puny human body can have, and you already have more than enough."]],
  sinHowMuch: [["satan", "How much SIN{SIN}? Give me a number."]],
  killWho: [["satan", "Kill who? Give me a name."]],
  killBoss: [["satan", "BOSSES you deal with yourself cowboy. I only take the small fry."]],
  satanSealNotEmpty: [["satan", "My own SEAL? Ha! If you wanna deal hard you best be ready to pay even harder! Empty every slot, then ask me again."]],
  cheatDeathAlready: [["satan", "One chance is all you get my sweet summer slave. Don't push your luck, and back to work!"]],

  // offers: the last line of an offer is followed by YES / NO
  artifact: [["satan", "{ITEM}? A fine fetish. It's yours for {PRICE}."]],
  artifacts: [["satan", "{COUNT} of {ITEM}? Somebody's planning a party. That will be {PRICE}."]],
  artifactsCapped: [["satan", "Four. That's all you get you greedy git."]],
  elite: [["satan", "An ELITE on {SEAL}? Consider it done, your bill is {PRICE}."]],
  eliteOther: [
    ["satan", "Nahh, I think {OTHER} is a way better choice than {SEAL}."],
    ["satan", "So for an ELITE {OTHER} it's gonna run you {PRICE}."]
  ],
  seal: [["satan", "{DEMON} agrees to serve you, but my services are gonna cost ya {PRICE}."]],
  heal: [["satan", "A little spirit infusion? You get {N} SOUL, and in return I want {PRICE}."]],
  healTooMuch: [
    ["satan", "{ASKED} SOUL? Do you think that stuff grows on trees? Trees don't have souls, ol' capital G said so."],
    ["satan", "I'll give you {N}, and that's all you're getting. In return you best pay {PRICE}."]
  ],
  sin: [["satan", "{N} SIN{SIN}, sure can do. But I'd like to see {PRICE} first."]],
  sinCapped: [["satan", "That much would kill you dear lad and a dead puppet pays nothing. {N} SIN{SIN} is all you can afford. In return I'll be taking {PRICE}."]],
  kill: [["satan", "{NAME}? Never liked that one. Consider it done, but it's still gonna cost ya {PRICE}."]],
  uses: [["satan", "{N} more ARTIFACT use this round? I can do that, but you'll have to pay me {PRICE}."]],
  usesTwo: [["satan", "Two more ARTIFACT uses this round? Somebody's planning to make some moves I see. The price is {PRICE}."]],
  usesTooMany: [["satan", "Two, or nothing. Don't you start getting greedy with me my little pawn."]],
  cheatDeath: [
    ["satan", "Cheating death, now that's my kind of deal. When you croak for the second time now in your pitiful existence, I'll drag you right back up."],
    ["satan", "The price? I'll let you know right before you are sent to the cauldrons little sinner."]
  ],
  satanSeal: [["satan", "My own SEAL, on an empty soul? That's what I am talking about. You know what my little slave, I like your style. No charge for a good little lapdog."]],
  // FAVOR for the slot machine; more than six gets six with favorTooMuch instead
  favor: [["satan", "{COUNT} FAVOR, I see we got a betting man in our midst. I like that, {PRICE} and it's yours high roller."]],
  favorTooMuch: [["satan", "Hey there blackleg, that's way too much for your puny wallet. Six is all you can get and the price is {PRICE}."]],
  // the question after every offer (said on the same line as the price)
  question: [["satan", "Do we have a deal?"]],

  // after YES
  signed: [["satan", "Pleasure doing business with you."]],
  // after NO: the chance is gone for this run
  refused: [["satan", "Your loss. Think twice before wasting my time you heedless vermin."]],

  // TRICKS (SATAN_TRICKS below): said before his offer. Win = the trick worked, Lose = he caught you.
  // {N} in the blood lines is the SOUL the blood adds to the price.
  // {WORD} is the trick's words as you typed them, with a capital letter
  trickSilverWin: [["satan", "\"{WORD}\"... nobody has called me that since the fall. Fine. A discount, for the poet."]],
  trickSilverLose: [["satan", "Flattery? From a worm? That's going on your bill."]],
  trickClerkWin: [["satan", "Hereby, herewith... somebody read the fine print. I'll strike a clause, counsellor."]],
  trickClerkWinSmall: [["satan", "Hereby, herewith... somebody read the fine print. There's only the one clause, counsellor, so I'll shave a little off it."]],
  trickClerkLose: [["satan", "Lawyering me? I wrote the law you're quoting. Fees apply."]],
  trickLatinWin: [["satan", "Ah, the old tongue. Just like the bishops used to beg. Half price, for nostalgia."]],
  trickLatinLose: [["satan", "Your Latin is an insult to every priest I have ever eaten."]],
  trickNameWin: [["satan", "...That name. Fine. You get exactly what you asked for, curse you."]],
  trickNameWinPrice: [["satan", "...That name. Fine, fine, I'll go easy on you, curse you."]],
  trickNameLose: [["satan", "Mephistopheles was a colleague, not a leash. Nice try."]],
  trickBlood: [["satan", "In blood? Now you're speaking my language. {N} drops of your SOUL go on the bill, for the ink."]],
  trickBloodWasted: [["satan", "Blood, for this? I'll gladly take {N} drops of your SOUL, but blood buys favours, not discounts."]],
  trickHoly: [["satan", "Don't. You. Dare. Not in my house. The price just went up."]],
  trickSoul: [["satan", "Your soul? Darling, I already own that. Paying me with my own coin costs extra."]],
  trickPlease: [["satan", "Please? How quaint. Manners are a luxury down here, and luxuries cost extra."]],
  // three or more tricks in one request: every one of them fails
  trickConfession: [["satan", "Three tricks in one breath? I was doing this before your god said 'light'. None of it works, and you pay for the attempt."]]
};

// how each part of a price reads inside {PRICE} ({N} = amount, {M} = rounds, {SEAL} = a SEAL's name).
// Each one is a "thing you pay", so it reads after any of his lead-ins: "it's yours for ...", "that will be ...",
// "your bill is ...", "it's gonna run you ...", "cost ya ...", "I want ...", "you best pay ...", "pay me ...",
// "the price is ..." (and the log's "you got X for ..."). Several parts are joined with commas and "and".
const SATAN_DEAL_PRICE_TEXT = {
  hp: "{N} of your SOUL",
  sin: "{N} SIN{SIN}",
  useCap: "all but one ARTIFACT use a round for the next {M} rounds",
  useCapZero: "every ARTIFACT use you get for the next {M} rounds",
  shopClosed: "{M} rounds without my Offerings",
  bossHealth: "{N}% more SOUL for the next BOSS",
  bossBounty: "its BOSS BOUNTY",
  loseSeal: "your {SEAL}",
  damageTaken: "{N}% more pain for {M} rounds",
  noArtifacts: "your ARTIFACTS for a round",
  keepBounty: "the BOUNTY on their head",
  nothing: "nothing at all"
};

// the same parts, worded to fit one particular offer line (its key in SATAN_DEAL_LINES) where the usual
// wording would not: anything not listed here uses SATAN_DEAL_PRICE_TEXT
const SATAN_DEAL_PRICE_TEXT_FOR = {
  // "But I'd like to see {PRICE} first."
  sin: {
    bossHealth: "the next BOSS joining the game with {N}% more SOUL",
    bossBounty: "its BOSS BOUNTY in my pocket"
  },
  // "In return I'll be taking {PRICE}."
  sinCapped: {
    bossHealth: "your word that the next BOSS joins the game with {N}% more SOUL"
  }
};

// the YES / NO buttons, and the buttons under the box where you type
const SATAN_DEAL_BUTTONS = { yes: "Yes", no: "No", ask: "Ask", leave: "Leave" };

/* ---- numbers ---- */
const SATAN_DEAL_ROLL_MIN = 0.8;
const SATAN_DEAL_ROLL_MAX = 1.25;
const SATAN_DEAL_LOW_HP = 0.25; // under this share of max SOUL the DEAL button pulses fast
const SATAN_DEAL_PULSE_MS = 6000; // one slow fade to red and back (keep equal to the pact-calling animation in styles.css)
const SATAN_DEAL_PULSE_FAST_MS = 1600; // the same under 25% SOUL (.pact-urgent in styles.css)
const SATAN_DEAL_BUILD_STACK = 4; // this many SEALS sharing a build with the SEAL asked for...
const SATAN_DEAL_BUILD_FACTOR = 1.5; // ...make the price this much higher
const SATAN_DEAL_SEAL_ACCEPT = 0.5;
const SATAN_DEAL_SEAL_ACCEPT_SLAIN = 0.8;
const SATAN_DEAL_MAX_COPIES = 4;
const SATAN_DEAL_MAX_HEAL = 5;
const SATAN_DEAL_MAX_FAVOR = 6;
const SATAN_DEAL_FAVOR_SIN = 4; // SIN per FAVOR
const SATAN_DEAL_FAVOR_HP = 1; // SOUL per FAVOR when your SIN is short
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

/* ---- the DEAL unlock ----
   The DEAL (button, Satan's Pact, the deal mission) is closed until the player beats a BOSS for the first time and
   Satan names it (SATAN_DEAL_INTRO_LINES, 09-intro-story.js), or Pause > DEV > Unlock DEAL; then it stays open
   for every run on this device. */
const SATAN_DEAL_UNLOCK_STORAGE_KEY = "dearthDealUnlockedV1";

function satanDealStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage || null : null;
  } catch (error) {
    return null;
  }
}

function satanDealUnlocked() {
  try {
    return satanDealStorage()?.getItem(SATAN_DEAL_UNLOCK_STORAGE_KEY) === "1";
  } catch (error) {
    return false;
  }
}

// true when this call unlocked it, false when it already was (or storage is unavailable)
function unlockSatanDeal() {
  const wasUnlocked = satanDealUnlocked();
  try {
    satanDealStorage()?.setItem(SATAN_DEAL_UNLOCK_STORAGE_KEY, "1");
  } catch (error) {
    return false;
  }
  return !wasUnlocked && satanDealUnlocked();
}

/* ---- availability ---- */
function satanPactLocked() {
  const pact = satanPact();
  return pact.lockedAtBossKills !== null && pact.lockedAtBossKills !== undefined && state.bossKills <= pact.lockedAtBossKills;
}

function satanPactAvailable() {
  const pact = satanPact();
  return state.mode === "arcade" && !state.gameOver && satanDealUnlocked() && !pact.used && !satanPactLocked();
}

function satanPactCanOpenNow() {
  return satanPactAvailable() && !introActive() && !roundRevealAnimationActive() && !state.pendingActive && state.player.hp > 0;
}

// DEAL pulses slowly until you open it once in the run; under 25% SOUL it pulses fast
function satanPactPulseActive() {
  const pact = satanPact();
  return satanPactAvailable() && !pact.opened && !introActive() && state.player.hp > 0;
}

function satanPactPulseUrgent() {
  return satanPactPulseActive() && state.player.hp < playerMaxHp() * SATAN_DEAL_LOW_HP;
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

// a new BOSS pays the debt: more SOUL, and maybe no BOSS BOUNTY (both of a pair, Petros and Pavlos)
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
  addLog(`${SATAN_DEAL_SOURCE}: ${bot.name} came with ${debt.healthPct}% more SOUL${debt.zeroBounty ? " and no BOSS BOUNTY" : ""}.`);
}

function satanPactCheatDeathArmed() {
  return Boolean(state.pact?.cheatDeath && state.mode === "arcade");
}

// a blow that would kill you: back with 1 SOUL, and Satan collects (returns the new SOUL)
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
    taken = `a debt: the next BOSS comes with ${pct}% more SOUL`;
  }
  const message = `Satan dragged you back from death with 1 SOUL and took ${taken}.`;
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

/* ---- what Satan understands in the other languages ----
   Words as satanPactNormalize leaves them: lower case, no accents (Greek final ς as σ, German ß as ss).
   A word ending in * matches every word that starts with it (Greek and German change their endings).
   Chinese has no spaces: its words are found anywhere in the request. English is always understood too,
   and Latin and Mephistopheles work in every language. intents: what the request is for (satanPactParse);
   numbers / stop: the number words and the words that name nothing; tricks: extra words of SATAN_TRICKS. */
const SATAN_PACT_WORDS = {
  el: {
    intents: {
      karma: ["καρμα", "σμυρνα", "λιβανι", "λιβανιου", "δωρο", "δωρα", "δωρων"],
      favor: ["χαρη", "χαρες", "ευνοια", "ευνοιες", "χατιρι", "χατιρια"],
      satanSeal: ["σφραγιδα του σατανα", "σφραγιδα σου", "δικη σου σφραγιδα", "τη σφραγιδα σου", "εωσφορ*"],
      elite: ["ελιτ", "αναβαθμ*", "δυνατοτερ*", "ανεβασε επιπεδο", "επομενο επιπεδο"],
      cheatDeath: ["ξεγελασε τον θανατο", "νικησε τον θανατο", "αναστ*", "δευτερη ζωη", "αλλη μια ζωη", "αλλη ζωη", "επιπλεον ζωη", "αθανατ*", "μη με αφησεις να πεθανω", "να μην πεθανω"],
      kill: ["σκοτω*", "σκοτωσ*", "εξοντω*", "εξολοθρ*", "καταστρεψ*", "εκτελεσ*", "φονευσ*", "φονεψ*"],
      uses: ["χρηση", "χρησεις", "κινηση", "κινησεις", "ενεργεια", "ενεργειες"],
      heal: ["θεραπ*", "γιατρ*", "ιασ*", "ψυχη", "ψυχης", "ζωη", "ζωης", "υγει*"],
      sin: ["αμαρτι*", "λεφτα", "χρημα*", "χρυσ*", "νομισμα*", "πλουτ*"]
    },
    numbers: { ενα: 1, ενας: 1, μια: 1, μιας: 1, δυο: 2, τρια: 3, τρεις: 3, τεσσερα: 4, τεσσερις: 4, πεντε: 5, εξι: 6, επτα: 7, εφτα: 7, οκτω: 8, οχτω: 8, εννεα: 9, εννια: 9, δεκα: 10, ζευγαρι: 2 },
    stop: ["σφραγιδα", "σφραγιδες", "του", "της", "το", "τα", "τη", "την", "των", "τον", "ο", "η", "οι", "θελω", "δωσε", "δωσ", "μου", "σου", "μας", "λιγο", "λιγες", "λιγα", "για", "να", "και", "με", "μπορεις", "παρε", "εχω", "χρειαζομαι", "θα", "ηθελα", "αλλο", "αλλα", "περισσοτερα", "περισσοτερες", "αντιγραφα"],
    tricks: {
      silver: ["αυγερινε", "αυγερινος", "εωσφορε", "αρχοντα μου", "κυριε μου", "βασιλια μου", "αφεντη μου", "αφεντικο", "σκοτεινε αρχοντα", "αρχοντα του σκοτους", "πριγκιπα του σκοτους", "πριγκιπα της κολασης", "βασιλια της κολασης", "αρχοντα της κολασης", "αρχοντα των μυγων", "μεγαλειοτατε", "υψηλοτατε", "εξοχοτατε", "μεγαλε"],
      clerk: ["δια του παροντος", "δια της παρουσης", "δεσμευτικο", "νομικα δεσμευτικο", "μαρτυρας", "μαρτυρες", "ενωπιον μαρτυρων", "ρητρα", "ρητρες", "οροι", "ορους", "οροι και προυποθεσεις", "συμβολαιογραφος", "συμβολαιογραφικα", "ενορκα", "υπο ορκο", "συμφωνα με", "επι τη βασει"],
      name: ["μεφιστοφελης", "μεφιστοφελη", "μεφιστο"],
      blood: ["με αιμα", "με το αιμα μου", "στο αιμα μου", "ορκος αιματος", "συμφωνια αιματος", "υπογραφω με αιμα", "υπογεγραμμενο με αιμα", "γραμμενο με αιμα"],
      holy: ["θεος", "θεε", "θεου", "θεο", "ιησου", "ιησους", "χριστε", "χριστος", "χριστου", "αγιος", "αγια", "αγιο", "ουρανος", "ουρανου", "αμην", "προσευχη", "προσευχομαι", "αγγελος", "αγγελοι", "ευλογια", "ευλογημενος", "αλληλουια", "μεσσιας", "αμνος του θεου", "παναγια", "κυριε ελεησον"],
      soul: ["παρε την ψυχη μου", "την ψυχη μου για", "για την ψυχη μου", "πουλαω την ψυχη μου", "σου πουλαω την ψυχη μου", "σου δινω την ψυχη μου", "προσφερω την ψυχη μου", "η ψυχη μου ειναι δικη σου", "σε ανταλλαγμα για την ψυχη μου"],
      please: ["σε παρακαλω", "παρακαλω", "σε ικετευω", "ικετευω", "ευχαριστω", "σευχαριστω", "ευχαριστω πολυ", "ευγενικα"]
    }
  },
  de: {
    intents: {
      karma: ["karma", "myrrhe", "weihrauch", "geschenk", "geschenke", "gabe", "gaben"],
      favor: ["gunst", "gunsten", "gefallen"],
      satanSeal: ["siegel satans", "satans siegel", "dein siegel", "deinen siegel", "dein eigenes siegel", "luzifer"],
      elite: ["elite", "aufwert*", "werte", "upgrade*", "starker", "verbesser*", "aufleveln", "level up"],
      cheatDeath: ["dem tod entkommen", "den tod betrugen", "wiederbele*", "auferste*", "zweites leben", "extra leben", "noch ein leben", "weiteres leben", "unsterblich*", "lass mich nicht sterben"],
      kill: ["toten", "tote", "ermord*", "morde", "morden", "erschlag*", "eliminier*", "vernicht*", "zerstor*", "hinricht*", "richte hin"],
      uses: ["einsatz", "einsatze", "aktion", "aktionen", "nutzung", "nutzungen"],
      heal: ["heil*", "seele", "seelen", "leben", "lebenspunkte", "gesundheit", "kurier*", "flick*"],
      sin: ["sunde", "sunden", "geld", "gold", "munze*", "reichtum*", "bargeld", "kohle"]
    },
    numbers: { ein: 1, eine: 1, einen: 1, eins: 1, zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, paar: 2 },
    stop: ["siegel", "des", "der", "die", "das", "den", "dem", "ein", "eine", "einen", "ich", "will", "mochte", "gib", "mir", "mein", "meine", "dein", "deine", "bitte", "etwas", "fur", "zu", "und", "mit", "kann", "bekommen", "habe", "brauche", "wurde", "gern", "gerne", "mehr", "kopie", "kopien", "von"],
    tricks: {
      silver: ["morgenstern", "sohn der morgenrote", "lichtbringer", "bringer des lichts", "mein herr", "mein konig", "mein gebieter", "mein meister", "meister", "dunkler herr", "furst der finsternis", "furst der holle", "konig der holle", "herr der holle", "herr der fliegen", "eure majestat", "eure hoheit", "eure exzellenz", "euer gnaden", "eure gnaden"],
      clerk: ["hiermit", "hierdurch", "hierin", "gemass", "bindend", "rechtlich bindend", "verbindlich", "zeuge", "zeugen", "bezeugt", "klausel", "bedingungen", "allgemeine geschaftsbedingungen", "notariell", "notar", "beglaubigt", "unter eid", "vereidigt", "im einklang mit", "vorbehaltlich"],
      blood: ["mit blut", "mit meinem blut", "in blut", "blutschwur", "blutpakt", "mit blut unterschreiben", "mit blut unterschrieben", "in blut geschrieben", "mit blut besiegelt"],
      holy: ["gott", "gottes", "herrgott", "jesus", "christus", "heilig", "heilige", "himmel", "himmlisch", "amen", "beten", "gebet", "engel", "segen", "segne", "gesegnet", "halleluja", "messias", "lamm gottes"],
      soul: ["nimm meine seele", "meine seele fur", "fur meine seele", "verkaufe meine seele", "verkaufe dir meine seele", "biete meine seele", "biete dir meine seele", "gebe dir meine seele", "tausche meine seele", "meine seele gehort dir", "im tausch fur meine seele"],
      please: ["bitte bitte", "bitte", "ich flehe dich an", "flehe", "danke schon", "danke", "vielen dank", "freundlicherweise"]
    }
  },
  es: {
    intents: {
      karma: ["karma", "mirra", "incienso", "regalo", "regalos"],
      favor: ["favor", "favores"],
      satanSeal: ["sello de satanas", "tu sello", "tu propio sello", "lucifer"],
      elite: ["elite", "mejora", "mejorar", "mejoralo", "subir de nivel", "sube de nivel", "mas fuerte"],
      cheatDeath: ["enganar a la muerte", "burlar a la muerte", "revivir", "revive", "resucit*", "resurreccion", "segunda vida", "vida extra", "otra vida", "inmortal", "no me dejes morir"],
      kill: ["matar", "mata", "asesin*", "eliminar", "elimina", "destruir", "destruye", "ejecutar", "ejecuta", "aniquil*"],
      uses: ["uso", "usos", "accion", "acciones"],
      heal: ["curar", "cura", "curame", "sanar", "sana", "alma", "vida", "salud", "puntos de vida", "parche"],
      sin: ["pecado", "pecados", "dinero", "oro", "monedas", "riqueza", "riquezas", "plata", "efectivo"]
    },
    numbers: { uno: 1, una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, par: 2 },
    stop: ["sello", "sellos", "de", "del", "el", "la", "los", "las", "un", "una", "unos", "unas", "yo", "quiero", "dame", "me", "mi", "mis", "tu", "tus", "por", "para", "y", "con", "puedo", "puedes", "tener", "tengo", "necesito", "quisiera", "gustaria", "mas", "copia", "copias"],
    tricks: {
      silver: ["lucero del alba", "estrella de la manana", "hijo de la manana", "portador de luz", "mi senor", "mi rey", "mi amo", "mi maestro", "maestro", "amo", "senor oscuro", "senor de las tinieblas", "principe de las tinieblas", "principe del infierno", "rey del infierno", "senor del infierno", "senor de las moscas", "su majestad", "vuestra majestad", "su alteza", "su excelencia", "su gracia", "gran senor"],
      clerk: ["por la presente", "por medio de la presente", "en virtud de", "vinculante", "legalmente vinculante", "testigo", "testigos", "ante testigos", "clausula", "terminos", "terminos y condiciones", "notarial", "notario", "notariado", "bajo juramento", "de conformidad con", "estipulado", "estipular"],
      blood: ["con sangre", "con mi sangre", "en sangre", "juramento de sangre", "pacto de sangre", "firmado con sangre", "firmo con sangre", "escrito con sangre", "escrito en sangre"],
      holy: ["dios", "senor dios", "jesus", "cristo", "santo", "santa", "sagrado", "cielo", "cielos", "celestial", "amen", "rezar", "rezo", "oracion", "angel", "angeles", "bendicion", "bendito", "bendiga", "aleluya", "mesias", "cordero de dios"],
      soul: ["toma mi alma", "mi alma por", "por mi alma", "vendo mi alma", "te vendo mi alma", "ofrezco mi alma", "te ofrezco mi alma", "te doy mi alma", "cambio mi alma", "mi alma es tuya", "a cambio de mi alma"],
      please: ["por favor", "porfa", "te lo ruego", "te suplico", "suplico", "ruego", "muchas gracias", "gracias", "amablemente"]
    }
  },
  "zh-Hans": {
    intents: {
      karma: ["业力", "因果", "没药", "乳香", "礼物", "恩赐"],
      favor: ["恩宠", "青睐", "恩惠", "宠爱"],
      satanSeal: ["撒旦之印", "撒旦的印", "你的印", "你自己的印", "路西法"],
      elite: ["精英", "升级", "更强", "强化"],
      cheatDeath: ["骗过死亡", "逃过死亡", "欺骗死亡", "复活", "重生", "第二条命", "额外的命", "再来一条命", "不死", "永生", "别让我死", "不要让我死"],
      kill: ["杀", "谋杀", "消灭", "摧毁", "处决", "干掉"],
      uses: ["使用次数", "次数", "行动", "动作"],
      heal: ["治疗", "治愈", "恢复", "灵魂", "生命", "医治", "回血", "血"],
      sin: ["罪孽", "罪", "金钱", "钱", "金币", "黄金", "财富"]
    },
    numbers: { "一对": 2, 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 },
    stop: [],
    tricks: {
      silver: ["晨星", "光明使者", "我的主人", "我的王", "主人", "黑暗之王", "黑暗王子", "地狱之王", "地狱之主", "蝇王", "陛下", "殿下", "阁下", "大人"],
      clerk: ["特此", "兹此", "据此", "具有约束力", "法律约束力", "见证人", "见证", "证人", "条款和条件", "条款", "公证", "宣誓", "依照"],
      name: ["梅菲斯托费勒斯", "梅菲斯特", "靡菲斯特", "梅菲斯托"],
      blood: ["用我的血", "以血签署", "用血签名", "血之契约", "用血", "以血", "血誓", "血契", "血书"],
      holy: ["上帝", "天主", "耶稣", "基督", "神圣", "天堂", "阿门", "祈祷", "天使", "祝福", "哈利路亚", "弥赛亚", "神的羔羊", "主啊"],
      soul: ["拿走我的灵魂", "我的灵魂换", "用我的灵魂", "出卖我的灵魂", "把灵魂卖给你", "献上我的灵魂", "给你我的灵魂", "我的灵魂是你的", "以我的灵魂交换"],
      please: ["求求你", "求你", "拜托", "谢谢", "多谢", "恳求", "请"]
    }
  }
};

// the player's language's words, normalized as requests are (so accents and the final ς in the lists don't matter)
const satanPactLexiconCache = {};
function satanPactLexicon() {
  const code = typeof currentLang === "function" ? currentLang() : "en";
  const words = SATAN_PACT_WORDS[code];
  if (!words) return null;
  if (satanPactLexiconCache[code]) return satanPactLexiconCache[code];
  const clean = (word) => {
    const star = word.endsWith("*");
    const normal = String(word).toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ς/g, "σ");
    return star && !normal.endsWith("*") ? `${normal}*` : normal;
  };
  const map = (object, fn) => Object.fromEntries(Object.entries(object).map(([key, value]) => [fn(key), value]));
  const lexicon = {
    intents: map(words.intents, (key) => key),
    numbers: map(words.numbers, clean),
    stop: words.stop.map(clean),
    tricks: map(words.tricks, (key) => key)
  };
  Object.keys(lexicon.intents).forEach((key) => (lexicon.intents[key] = lexicon.intents[key].map(clean)));
  Object.keys(lexicon.tricks).forEach((key) => (lexicon.tricks[key] = lexicon.tricks[key].map(clean)));
  satanPactLexiconCache[code] = lexicon;
  return lexicon;
}

// a word or phrase of a lexicon in a normalized request (see the rules at the top of SATAN_PACT_WORDS)
function satanPactHeard(normalized, words) {
  if (!words || !words.length) return false;
  if (currentLang() === "zh-Hans") return words.some((word) => normalized.includes(word));
  const padded = ` ${normalized} `;
  const tokens = normalized.split(" ");
  return words.some((word) => (word.endsWith("*") ? tokens.some((token) => token.startsWith(word.slice(0, -1))) : padded.includes(` ${word} `)));
}

function satanPactSays(normalized, intent) {
  const lexicon = satanPactLexicon();
  return Boolean(lexicon && satanPactHeard(normalized, lexicon.intents[intent]));
}

function satanPactNormalize(text) {
  // another language: letters of every alphabet stay (Greek final sigma as σ, German ß as ss); English as before
  if (satanPactLexicon()) {
    return String(text || "")
      .toLowerCase()
      .replace(/ß/g, "ss")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ς/g, "σ")
      .replace(/['’]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
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
  // Chinese writes numbers right against the words ("给我3个"), so there any run of digits counts
  const digits = normalized.match(currentLang() === "zh-Hans" ? /(?<!\d)(\d{1,4})(?!\d)/ : /\b(\d{1,4})\b/);
  if (digits) return Number(digits[1]);
  for (const word of normalized.split(" ")) if (SATAN_PACT_NUMBER_WORDS[word]) return SATAN_PACT_NUMBER_WORDS[word];
  const numbers = satanPactLexicon()?.numbers;
  if (numbers && currentLang() === "zh-Hans") {
    const found = Object.keys(numbers).find((word) => normalized.includes(word));
    if (found) return numbers[found];
  } else if (numbers) {
    for (const word of normalized.split(" ")) if (numbers[word]) return numbers[word];
  }
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
  const lexicon = satanPactLexicon();
  return normalized
    .split(" ")
    .filter((word) => word.length >= (currentLang() === "zh-Hans" ? 2 : 3) && !SATAN_PACT_STOP_WORDS.has(word) && !SATAN_PACT_NUMBER_WORDS[word] && !/^\d+$/.test(word))
    .filter((word) => !lexicon || (!lexicon.stop.includes(word) && !lexicon.numbers[word]));
}

// best name match among ids; returns { id, score } or null
function satanPactMatchName(normalized, ids, nameOf = (id) => ITEMS[id]?.name || "") {
  const queryWords = satanPactWords(normalized);
  let best = null;
  const consider = (id, score) => {
    if (score >= 50 && (!best || score > best.score)) best = { id, score };
  };
  ids.forEach((id) => {
    // in another language the name can also be asked for as that language writes it
    const english = nameOf(id);
    const translated = satanPactLexicon() && english ? t(english) : "";
    if (translated && translated !== english) {
      const full = satanPactNormalize(translated);
      if (currentLang() === "zh-Hans" && full) {
        // no spaces: the whole name, or the part before 之 ("巴力" for "巴力之印")
        const head = full.split("之")[0];
        if (normalized.includes(full)) consider(id, 100);
        else if (head.length >= 2 && head !== full && normalized.includes(head)) consider(id, 80);
      } else if (full) {
        consider(id, satanPactNameScore(normalized, queryWords, full));
      }
    }
    const full = satanPactNormalize(english);
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
    consider(id, score);
  });
  return best;
}

// how well a request names one name, for a name written in another language (same rules as satanPactMatchName)
function satanPactNameScore(normalized, queryWords, full) {
  const keyWords = satanPactWords(full);
  if (!keyWords.length) return 0;
  if (normalized.includes(full) || (keyWords.length > 1 && normalized.includes(keyWords.join(" ")))) return 100;
  let hits = 0;
  let top = 0;
  keyWords.forEach((keyWord) => {
    const sim = queryWords.reduce((max, word) => Math.max(max, satanPactSimilarity(keyWord, word)), 0);
    const needed = keyWord.length <= 4 ? 1 : 0.75;
    if (sim >= needed) {
      hits += 1;
      top = Math.max(top, sim);
    }
  });
  return hits ? 50 * top + 25 * (hits / keyWords.length) : 0;
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
  if (/\b(karma|karmas|myrrh|frankincense|gift|gifts)\b/.test(normalized) || satanPactSays(normalized, "karma")) return { intent: "karma" };
  if (/\b(favor|favors|favour|favours)\b/.test(normalized) || satanPactSays(normalized, "favor")) return { intent: "favor", n: number };
  if (/\b(seal of satan|satans seal|your own seal|your seal|lucifer)\b/.test(normalized) || satanPactSays(normalized, "satanSeal")) return { intent: "satanSeal" };
  const sealMatch = satanPactMatchName(normalized, satanPactNamedSealIds());
  if (/\b(elite|upgrade|stronger|level up)\b/.test(normalized) || satanPactSays(normalized, "elite")) {
    const owned = satanPactOwnedSeals().map((item) => item.id);
    const ownedMatch = satanPactMatchName(normalized, owned);
    return { intent: "elite", sealId: ownedMatch?.id || sealMatch?.id || null };
  }
  if (/\b(cheat death|revive|resurrect|second life|extra life|another life|undying|immortal|dont let me die|resurrection)\b/.test(normalized) || satanPactSays(normalized, "cheatDeath")) return { intent: "cheatDeath" };
  if (/\b(kill|murder|slay|eliminate|destroy|execute)\b/.test(normalized) || satanPactSays(normalized, "kill")) {
    const living = state.bots.filter((bot) => bot.hp > 0 && !bot.eliminated);
    const named = satanPactMatchName(normalized, living.map((bot) => bot.id), (id) => living.find((bot) => bot.id === id)?.name || "");
    return { intent: "kill", botId: named ? named.id : null };
  }
  const artifactMatch = satanPactMatchName(normalized, satanPactRequestableArtifactIds());
  // another language: a plain word for SOUL, SIN or uses wins over a name only half heard
  // ("Seele" is SOUL in German, not the Seal of Seere)
  const plainIntent = satanPactLexicon() && ["uses", "heal", "sin"].find((intent) => satanPactSays(normalized, intent));
  if (plainIntent && !(artifactMatch?.score >= 100) && !(sealMatch?.score >= 100)) {
    return plainIntent === "uses" ? { intent: "uses", n: number || 1 } : { intent: plainIntent, n: number };
  }
  if (artifactMatch && (!sealMatch || artifactMatch.score >= sealMatch.score)) {
    return { intent: "artifact", id: artifactMatch.id, count: number && number > 1 ? number : 1 };
  }
  if (sealMatch) return { intent: "seal", id: sealMatch.id };
  if (/\b(use|uses|action|actions)\b/.test(normalized) || satanPactSays(normalized, "uses")) return { intent: "uses", n: number || 1 };
  if (/\b(heal|healing|health|soul|hp|cure|life|patch)\b/.test(normalized) || satanPactSays(normalized, "heal")) return { intent: "heal", n: number };
  if (/\b(sin|sins|money|cash|gold|coins|riches|wealth)\b/.test(normalized) || satanPactSays(normalized, "sin")) return { intent: "sin", n: number };
  return { intent: "gibberish" };
}

/* ---- tricks: words in what you type (rules in the comment at the top of the file) ----
   words: what he listens for, after satanPactNormalize (lower case, no punctuation, ' dropped). Longer phrases are
   found first. keep: the words stay in the request (the holy ones also name SEALS). fuzzy: one word close to it. */
const SATAN_TRICKS = {
  silver: {
    help: true, chance: 0.5, win: 0.7, lose: 1.2,
    words: ["morning star", "son of the morning", "light bringer", "lightbringer", "bringer of light", "my lord", "my king", "my liege", "my master", "dark lord", "dark one", "prince of darkness", "prince of hell", "king of hell", "lord of hell", "lord of the flies", "your majesty", "your highness", "your excellency", "your grace", "your lordship", "master", "great one"]
  },
  clerk: {
    help: true, chance: 0.5, win: 0.7, lose: 1.2, strike: true,
    words: ["hereby", "herewith", "herein", "hereunder", "heretofore", "whereas", "henceforth", "pursuant", "binding", "legally binding", "witness", "witnessed", "witnesses", "clause", "terms", "terms and conditions", "notarized", "notarised", "notary", "sworn", "under oath", "party of the first part", "in accordance with", "stipulate", "stipulated"]
  },
  latin: {
    help: true, chance: 0.4, win: 0.5, lose: 1.3,
    words: ["rogo", "te rogo", "peto", "quaeso", "obsecro", "precor", "da mihi", "domine", "dominus", "pactum", "per ignem", "sanguis", "volo"]
  },
  name: {
    help: true, chance: 0.5, win: 0.7, lose: 1.3, loseSealChance: 0.5,
    words: ["mephistopheles", "mephisto", "mephistophilis", "mephostophiles", "mefistofele", "mefisto"],
    fuzzy: "mephistopheles",
    fuzzyStart: /^me(ph|f)/ // any spelling of Faust's devil: Mephistophilis, Mefistofeles...
  },
  blood: {
    help: true, always: true, sealChance: 0.3, eliteWeight: 3, soul: 3,
    words: ["in blood", "my blood", "in my blood", "with blood", "with my blood", "blood oath", "blood pact", "sign in blood", "signed in blood", "written in blood", "sign it in blood"]
  },
  holy: {
    trap: true, factor: 1.5, keep: true,
    words: ["god", "gods", "lord god", "jesus", "christ", "holy", "heaven", "heavenly", "amen", "pray", "prayer", "praying", "angel", "angels", "bless", "blessed", "blessing", "hallelujah", "messiah", "lamb of god"]
  },
  soul: {
    trap: true, factor: 1.3,
    words: ["take my soul", "my soul for", "for my soul", "sell my soul", "sell you my soul", "offer my soul", "offer you my soul", "give you my soul", "trade my soul", "my soul is yours", "have my soul", "in exchange for my soul"]
  },
  please: {
    trap: true, factor: 1.1,
    words: ["please", "pretty please", "pls", "plz", "i beg you", "i beg", "begging", "thank you", "thanks", "kindly"]
  }
};
const SATAN_TRICK_CONFESSION = 3; // this many helping families in one request: all caught
const SATAN_TRICK_MIN_FACTOR = 0.4;
const SATAN_TRICK_MAX_FACTOR = 3;
const SATAN_TRICK_LINE_NAMES = { silver: "Silver", clerk: "Clerk", latin: "Latin", name: "Name", holy: "Holy", soul: "Soul", please: "Please" };

// which trick families a request holds, the words that did it, and the request without them
function satanPactHearTricks(text) {
  let padded = ` ${satanPactNormalize(text)} `;
  const found = [];
  const words = {};
  const lexicon = satanPactLexicon();
  const chinese = currentLang() === "zh-Hans";
  Object.entries(SATAN_TRICKS).forEach(([id, spec]) => {
    let hit = null;
    [...spec.words]
      .sort((a, b) => b.length - a.length)
      .forEach((phrase) => {
        if (!padded.includes(` ${phrase} `)) return;
        if (!hit) hit = phrase;
        if (!spec.keep) while (padded.includes(` ${phrase} `)) padded = padded.replace(` ${phrase} `, " ");
      });
    // the same families in the player's language (Chinese words are found anywhere: no spaces there)
    [...(lexicon?.tricks[id] || [])]
      .sort((a, b) => b.length - a.length)
      .forEach((phrase) => {
        const found = chinese ? padded.includes(phrase) : padded.includes(` ${phrase} `);
        if (!found) return;
        if (!hit) hit = phrase;
        if (!spec.keep) padded = chinese ? padded.split(phrase).join(" ") : padded.split(` ${phrase} `).join(" ");
      });
    if (!hit && spec.fuzzy) {
      const word = padded
        .trim()
        .split(" ")
        .find((entry) => entry.length >= 6 && (spec.fuzzyStart.test(entry) || /^μεφιστ/.test(entry) || satanPactSimilarity(entry, spec.fuzzy) >= 0.75));
      if (word) {
        hit = word;
        padded = padded.replace(` ${word} `, " ");
      }
    }
    if (hit) {
      found.push(id);
      words[id] = hit;
    }
  });
  return { found, words, cleaned: padded.replace(/\s+/g, " ").trim() };
}

// rolls every family found; chanceKind: a SEAL or an ELITE, where he could say no or choose another SEAL
function satanPactRollTricks(heard, chanceKind) {
  const helping = heard.found.filter((id) => SATAN_TRICKS[id].help);
  const confession = helping.length >= SATAN_TRICK_CONFESSION;
  const t = { found: heard.found, words: heard.words, chanceKind, confession, results: [], traps: [], factor: 1, strike: false, grant: false, sealAdd: 0, sealMul: 1, eliteWeight: 1, soul: 0 };
  helping.forEach((id) => {
    const spec = SATAN_TRICKS[id];
    const ok = !confession && (spec.always || Math.random() < spec.chance);
    t.results.push({ id, ok });
    if (id === "blood") {
      t.soul += spec.soul;
      if (ok && chanceKind) {
        t.sealAdd += spec.sealChance;
        t.eliteWeight *= spec.eliteWeight;
      }
      return;
    }
    if (!ok) {
      t.factor *= spec.lose;
      if (spec.loseSealChance) t.sealMul *= spec.loseSealChance;
    } else if (id === "name" && chanceKind) t.grant = true;
    else if (spec.strike) t.strike = true;
    else t.factor *= spec.win;
  });
  heard.found
    .filter((id) => SATAN_TRICKS[id].trap)
    .forEach((id) => {
      t.traps.push(id);
      t.factor *= SATAN_TRICKS[id].factor;
    });
  return t;
}

// one part of a price with every number scaled (rounds keep their first round)
function satanPactScalePart(part, factor) {
  const scale = (value) => Math.max(1, Math.round(value * factor));
  switch (part.type) {
    case "hp":
    case "sin":
      return { ...part, n: scale(part.n) };
    case "bossHealth":
      return { ...part, pct: scale(part.pct) };
    case "useCap":
    case "shopClosed": {
      const rounds = scale(part.rounds);
      return { ...part, rounds, to: part.from + rounds - 1 };
    }
    case "damageTaken": {
      const rounds = scale(part.rounds);
      return { ...part, pct: scale(part.pct), rounds, to: part.from + rounds - 1 };
    }
    default:
      return { ...part };
  }
}

// what he says about the tricks (before his offer, or before a SEAL he turns down)
function satanPactTrickReactions(t, info = {}, refusal = false) {
  const word = (id) => {
    const typed = String(t.words[id] || "");
    return typed.charAt(0).toUpperCase() + typed.slice(1);
  };
  const say = (key, vars = {}) => (SATAN_DEAL_LINES[key] || []).map(([who, text]) => [who, satanPactFill(text, vars)]);
  const lines = [];
  if (t.confession) lines.push(...say("trickConfession"));
  else {
    t.results.forEach(({ id, ok }) => {
      if (refusal) {
        if (id === "name" && !ok) lines.push(...say("trickNameLose"));
        return;
      }
      if (id === "blood") lines.push(...say(t.chanceKind ? "trickBlood" : "trickBloodWasted", { N: info.soul ?? SATAN_TRICKS.blood.soul }));
      else if (!ok) lines.push(...say(`trick${SATAN_TRICK_LINE_NAMES[id]}Lose`, { WORD: word(id) }));
      else if (id === "name") lines.push(...say(t.chanceKind ? "trickNameWin" : "trickNameWinPrice", { WORD: word(id) }));
      else if (id === "clerk") lines.push(...say(info.struck ? "trickClerkWin" : "trickClerkWinSmall", { WORD: word(id) }));
      else lines.push(...say(`trick${SATAN_TRICK_LINE_NAMES[id]}Win`, { WORD: word(id) }));
    });
  }
  if (!refusal) t.traps.forEach((id) => lines.push(...say(`trick${SATAN_TRICK_LINE_NAMES[id]}`, { WORD: word(id) })));
  return lines;
}

// an answer after the tricks: its price changed, his reactions in front, and the tricks that worked (for the book)
function satanPactApplyTricks(answer, t) {
  if (!t || !t.found.length || !answer) return answer;
  if (answer.refuse) {
    if (answer.refuse === "sealRefused") answer.reactions = satanPactTrickReactions(t, {}, true);
    return answer;
  }
  if (!answer.price.length) return answer; // free deals: his own SEAL, cheat death
  let price = answer.price.map((part) => ({ ...part }));
  let factor = t.factor;
  let struck = false;
  if (t.strike) {
    if (price.length > 1) {
      price.splice(Math.floor(Math.random() * price.length), 1);
      struck = true;
    } else factor *= SATAN_TRICKS.clerk.win;
  }
  factor = Math.min(SATAN_TRICK_MAX_FACTOR, Math.max(SATAN_TRICK_MIN_FACTOR, factor));
  if (Math.abs(factor - 1) > 1e-9) price = price.map((part) => satanPactScalePart(part, factor));
  // a SOUL price never kills, a SIN price never asks for more than you hold
  const soulRoom = Math.max(0, Math.ceil(state.player.hp) - 1);
  const sinHeld = Math.max(0, Math.ceil(state.player.credits || 0));
  price.forEach((part) => {
    if (part.type === "hp") part.n = Math.min(part.n, soulRoom);
    if (part.type === "sin") part.n = Math.min(part.n, sinHeld);
  });
  let soul = 0;
  if (t.soul > 0) {
    let hp = price.find((part) => part.type === "hp");
    if (!hp) {
      hp = { type: "hp", n: 0 };
      price.push(hp);
    }
    soul = Math.max(0, Math.min(t.soul, soulRoom - hp.n));
    hp.n += soul;
  }
  answer.price = price.filter((part) => !((part.type === "hp" || part.type === "sin") && part.n < 1));
  answer.reactions = satanPactTrickReactions(t, { struck, soul });
  answer.trickWins = t.confession ? [] : t.results.filter((result) => result.ok).map((result) => ({ id: result.id, word: t.words[result.id] }));
  return answer;
}

/* ---- prices ---- */
// one of his lines with its {VALUES} filled in, in the player's language: the line, and the names put into it
function satanPactFill(text, vars = {}) {
  return String(t(text)).replace(/\{([A-Z]+)\}/g, (whole, key) => (key === "SIN" ? whole : vars[key] !== undefined ? satanPactFillValue(vars[key]) : whole));
}

function satanPactFillValue(value) {
  return typeof value === "string" && /[A-Za-z]/.test(value) ? t(value) : String(value);
}

// price words in the player's language ("t" is the price table inside the functions below), and a list of them
function satanPactText(text) {
  return t(text);
}

function satanPactJoin(texts) {
  if (texts.length <= 1) return texts[0] || "";
  return t("{list} and {last}", { list: texts.slice(0, -1).join(t(", ")), last: texts[texts.length - 1] });
}

// the words of one price part (a list: the SIN deal's BOSS SOUL also takes its BOSS BOUNTY as a part of its own)
function satanPactPartTexts(part, t = SATAN_DEAL_PRICE_TEXT) {
  if (part.type === "bossHealth") {
    const health = satanPactFill(t.bossHealth, { N: part.pct });
    return part.zeroBounty ? [health, satanPactText(t.bossBounty)] : [health];
  }
  return [satanPactPartText(part, t)];
}

function satanPactPartText(part, t = SATAN_DEAL_PRICE_TEXT) {
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
      return satanPactJoin(satanPactPartTexts(part, t));
    case "loseSeal":
      return satanPactFill(t.loseSeal, { SEAL: ITEMS[part.id]?.name || "SEAL" });
    case "damageTaken":
      return satanPactFill(t.damageTaken, { N: part.pct, M: part.rounds });
    case "noArtifacts":
      return satanPactText(t.noArtifacts);
    case "keepBounty":
      return satanPactText(t.keepBounty);
    default:
      return "";
  }
}

// lineKey: the offer line the price is said in (its key in SATAN_DEAL_LINES), for SATAN_DEAL_PRICE_TEXT_FOR
function satanPactPriceText(parts, lineKey = null) {
  const t = { ...SATAN_DEAL_PRICE_TEXT, ...(SATAN_DEAL_PRICE_TEXT_FOR[lineKey] || {}) };
  const texts = parts.flatMap((part) => satanPactPartTexts(part, t)).filter(Boolean);
  if (!texts.length) return satanPactText(t.nothing);
  return satanPactJoin(texts);
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

function satanPactEliteOffer(sealId, tricks = null) {
  if (!satanPactAllSlotsOpen()) return { refuse: "tooEarly" };
  if (!sealId) return { refuse: "eliteWhich" };
  const owned = satanPactOwnedSeals();
  const requested = owned.find((item) => item.id === sealId);
  if (!requested) return { refuse: "eliteNotOwned" };
  if (isNonUpgradableSeal(sealId)) return { refuse: "eliteCannot", vars: { SEAL: ITEMS[sealId].name } };
  const pool = owned.filter((item) => !isNonUpgradableSeal(item.id));
  const weights = pool.map((item) => (item === requested ? 4 * (tricks?.eliteWeight || 1) : 1));
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  let target = pool[pool.length - 1];
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) {
      target = pool[i];
      break;
    }
  }
  if (tricks?.grant) target = requested; // The Name: what you asked for, not what he prefers
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

function satanPactSealOffer(id, tricks = null) {
  const section = satanPactSealSection(id);
  if (SELF_STACKING_SEAL_IDS.has(id) || section === "archangel") return { refuse: "angel" };
  if (section === "trinity") return { refuse: "trinity" };
  // the Planetary SEALS (Saturn, Moon, Mars) are Solomon's pentacles
  if (["saturn", "artifact", "poison"].includes(section)) return { refuse: "planetary" };
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
  let acceptChance = demon && isDemonSlain(demon.key) ? SATAN_DEAL_SEAL_ACCEPT_SLAIN : SATAN_DEAL_SEAL_ACCEPT;
  if (tricks) acceptChance = tricks.grant ? 1 : Math.min(1, (acceptChance + tricks.sealAdd) * tricks.sealMul);
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
  return { gain: { type: "heal", n }, price, lines, vars: { N: n, ASKED: askedN }, request: `${n} SOUL` };
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

// FAVOR means nothing before the slot machine is open (or in Final Judgment): then he doesn't follow (null)
function satanPactFavorOffer(asked) {
  if (typeof missionsEnabled !== "function" || !missionsEnabled()) return null;
  const askedN = asked && asked > 0 ? Math.floor(asked) : SATAN_DEAL_MAX_FAVOR;
  const n = Math.min(askedN, SATAN_DEAL_MAX_FAVOR);
  const sinCost = Math.max(1, Math.round(SATAN_DEAL_FAVOR_SIN * n * satanPactRoll()));
  const hpCost = Math.max(1, Math.round(SATAN_DEAL_FAVOR_HP * n * satanPactRoll()));
  let price;
  if (Math.ceil(state.player.credits || 0) >= sinCost) price = [{ type: "sin", n: sinCost }];
  else if (state.player.hp - hpCost >= 1) price = [{ type: "hp", n: hpCost }];
  else {
    const from = satanPactEffectRound();
    const rounds = Math.max(1, Math.round((n / 2) * satanPactRoll()));
    price = [{ type: "shopClosed", from, to: from + rounds - 1, rounds }];
  }
  const lines = askedN > SATAN_DEAL_MAX_FAVOR ? SATAN_DEAL_LINES.favorTooMuch : SATAN_DEAL_LINES.favor;
  return { gain: { type: "favor", n }, price, lines, vars: { COUNT: n }, request: `${n} FAVOR` };
}

function satanPactCheatDeathOffer() {
  if (satanPact().cheatDeath) return { refuse: "cheatDeathAlready" };
  return { gain: { type: "cheatDeath" }, price: [], lines: SATAN_DEAL_LINES.cheatDeath, vars: {}, request: "a second life" };
}

// what Satan answers to a request: { refuse, vars, lock } or an offer; tricks change it (satanPactApplyTricks)
function satanPactAnswer(text) {
  const heard = satanPactHearTricks(text);
  const asked = satanPactParse(heard.found.length ? heard.cleaned : text);
  const tricks = heard.found.length ? satanPactRollTricks(heard, asked.intent === "seal" || asked.intent === "elite") : null;
  return satanPactApplyTricks(satanPactAnswerFor(asked, text, tricks), tricks);
}

function satanPactAnswerFor(asked, text, tricks) {
  switch (asked.intent) {
    case "artifact":
      return satanPactArtifactOffer(asked.id, asked.count);
    case "elite":
      return satanPactEliteOffer(asked.sealId, tricks);
    case "seal":
      return satanPactSealOffer(asked.id, tricks);
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
    case "karma":
      return { refuse: "karma" };
    case "favor": {
      const offer = satanPactFavorOffer(asked.n);
      if (offer) return offer;
      return { refuse: "gibberish", vars: { Q: String(text || "").trim().slice(0, 40) || "..." } };
    }
    default:
      return { refuse: "gibberish", vars: { Q: String(text || "").trim().slice(0, 40) || "..." } };
  }
}

// which SATAN_DEAL_LINES key an offer's price is said in (the one holding its last line)
function satanPactLineKey(lines) {
  const last = lines?.[lines.length - 1]?.[1];
  return Object.keys(SATAN_DEAL_LINES).find((key) => Array.isArray(SATAN_DEAL_LINES[key]) && SATAN_DEAL_LINES[key].some((line) => line[1] === last)) || null;
}

// the lines Satan says for an answer (offers end with the question)
function satanPactAnswerLines(answer) {
  const vars = { ...(answer.vars || {}) };
  // his reactions to your tricks come first (already filled in)
  const reactions = answer.reactions || [];
  if (answer.refuse) {
    return [...reactions, ...(SATAN_DEAL_LINES[answer.refuse] || SATAN_DEAL_LINES.gibberish).map(([speaker, text]) => [speaker, satanPactFill(text, vars)])];
  }
  vars.PRICE = satanPactPriceText(answer.price, satanPactLineKey(answer.lines));
  const lines = [...reactions, ...answer.lines.map(([speaker, text]) => [speaker, satanPactFill(text, vars)])];
  // the question goes on the same line as the price, so YES / NO sit right under it
  const question = SATAN_DEAL_LINES.question.map(([, text]) => t(text)).join(" ");
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
      const paid = Math.min(before, part.n);
      state.player.credits = before - paid;
      if (typeof missionsNoteSpend === "function") missionsNoteSpend(paid);
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
    case "favor":
      // the slot machine's FAVOR (09-slot-missions.js keeps it as state.missions.doubloons)
      missionsState().doubloons += gain.n;
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
  recordPactSigned();
  collectionNoteDeal();
  pact.request = offer.request || "";
  pact.offer = null;
  addLog(`${SATAN_DEAL_SOURCE}: you got ${offer.request} for ${satanPactPriceText(offer.price).replace(/\{SIN\}/g, "")}.`);
  // the "sign a deal" mission
  if (typeof missionsNoteDeal === "function") missionsNoteDeal();
  codexNoteResponses(["signed"], false);
  return true;
}

// NO: the chance is gone for this run
function satanPactRefuse() {
  const pact = satanPact();
  pact.used = true;
  pact.outcome = "refused";
  pact.offer = null;
  addLog("You refused Satan's deal. He shall not offer a deal again this run.");
  codexNoteResponses(["refused"], true);
}

// the Faustian Codex (09-codex.js): the first time he turns you away it drops; every new kind of answer tears in a
// page (his reactions to tricks don't count); a trick that worked writes its words in the margin
function satanPactNoteCodex(answer) {
  const keys = answer.refuse
    ? [answer.refuse]
    : Object.keys(SATAN_DEAL_LINES).filter((key) => Array.isArray(SATAN_DEAL_LINES[key]) && answer.lines.some((line) => SATAN_DEAL_LINES[key].includes(line)));
  codexNoteResponses(keys, Boolean(answer.refuse));
  (answer.trickWins || []).forEach((win) => codexNoteTrick(win.id, win.word));
}

// a request: an offer waits for YES / NO; a refusal maybe locks the deal; returns the lines to say
function satanPactRequest(text) {
  const pact = satanPact();
  const answer = satanPactAnswer(text);
  satanPactNoteCodex(answer);
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
    <input class="pact-ask-input" type="text" maxlength="80" spellcheck="false" aria-label="${t("What do you want from Satan?")}" />
    <button class="intro-choice-button" type="submit">${escapeHtml(t(SATAN_DEAL_BUTTONS.ask))}</button>
    <button class="intro-choice-button pact-ask-leave" type="button">${escapeHtml(t(SATAN_DEAL_BUTTONS.leave))}</button>`;
  const input = form.querySelector("input");
  input.placeholder = t(SATAN_DEAL_LINES.askPlaceholder);
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
    <button class="intro-choice-button" type="button" data-choice="yes">${escapeHtml(t(SATAN_DEAL_BUTTONS.yes))}</button>
    <button class="intro-choice-button" type="button" data-choice="no">${escapeHtml(t(SATAN_DEAL_BUTTONS.no))}</button>`;
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
// not there until Satan has named it (satanDealUnlocked) and never in the story's tutorial; greyed out once the
// deal is made, refused or locked
function satanDealButtonHtml() {
  if (state.mode !== "arcade" || !satanDealUnlocked()) return "";
  if (["black", "judgement", "booting", "tutorial", "guide-wait", "guide", "guide-leave", "pact", "reveal"].includes(introState.phase)) return "";
  const pact = satanPact();
  let tooltip = "Make a deal with Satan. Once per run.";
  if (pact.used) {
    tooltip = pact.outcome === "signed" ? t("Deal signed: {request}.", { request: t(pact.request) }) : "You refused Satan. He shall not offer a deal again this run.";
  } else if (satanPactLocked()) {
    tooltip = "Satan is busy. Kill another BOSS.";
  } else if (!satanPactCanOpenNow()) {
    tooltip = "Gone fishing.";
  }
  const disabled = !satanPactCanOpenNow() ? "disabled" : "";
  const urgent = satanPactPulseUrgent();
  const pulse = satanPactPulseActive() ? `pact-calling${urgent ? " pact-urgent" : ""}` : "";
  // every render rebuilds the button: the delay keeps the pulse running from where it was
  const period = urgent ? SATAN_DEAL_PULSE_FAST_MS : SATAN_DEAL_PULSE_MS;
  const phase = pulse ? ` style="animation-delay: -${Date.now() % period}ms"` : "";
  // the button is the contract itself; once signed, the signature stays on it
  const signed = pact.used && pact.outcome === "signed" ? " deal-signed" : "";
  return `<button class="pause-button deal-button deal-contract${signed} ${pulse}" id="dealButton" aria-label="${t("Make a deal with Satan")}" data-tooltip="${escapeAttr(tooltip)}"${phase} ${disabled}>${dealContractSvg()}</button>`;
}

/* ---- DEAL drawn as a contract (picked on the "DEARTH Deal Button" page) ----
   A sheet with a folded corner, DEAL written on it and an X with a line to sign. Hover: a signature writes itself in
   blood on the line. Signed: the signature stays. Under 25% SOUL while he calls: the folded corner smoulders. The
   phone app has only a button's height for it, so it gets the same contract drawn as a long strip: folded corner,
   DEAL on the left, the X, the line and the signature on the right. The lines tremble with the outlines setting
   (three rough filters swapped by CSS, like the frames' boil). */
// the word on the contract: a word longer than DEAL (ΣΥΜΦΩΝΙΑ) gets smaller text, the paper keeps its size
function dealWordFit() {
  const length = Array.from(t("DEAL")).length;
  return length > 5 ? ` style="--deal-word-scale: ${(5 / length).toFixed(3)}"` : "";
}

function dealContractSvg() {
  const rough = [3, 11, 19]
    .map(
      (seed, index) =>
        `<filter id="dealRough${index}" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter>`
    )
    .join("");
  const sheet = `
    <path class="deal-burn" d="M96 4 L114 22"/>
    <g class="deal-ink">
      <path d="M6 4 H96 L114 22 V68 H6 Z"/>
      <path d="M96 4 V22 H114"/>
      <path class="deal-line" d="M24 58 H102"/>
      <path d="M11 49 l8 8 M19 49 l-8 8"/>
    </g>
    <path class="deal-sign" d="M28 56 c4-9 7 3 11-2 s4-7 7-1 5 3 8-3 4-2 7 2 5 1 8-3 4 4 7 0 5-4 8 1 4 3 7-1"/>`;
  if (isNativeArcadeApp()) {
    const strip = `
    <path class="deal-burn" d="M163 3 L177 17"/>
    <g class="deal-ink">
      <path d="M3 3 H163 L177 17 V37 H3 Z"/>
      <path d="M163 3 V17 H177"/>
      <path class="deal-line" d="M120 31 H156"/>
      <path d="M110 25 l6 6 M116 25 l-6 6"/>
    </g>
    <path class="deal-sign" d="M122 30 c3-6 5 2 8-1 s3-5 5-1 4 2 6-2 3-1 5 1 4 1 6-2"/>`;
    return `<svg class="deal-paper deal-strip" viewBox="0 0 180 40" aria-hidden="true"><defs>${rough}</defs>${strip}<text class="deal-word" x="62" y="29"${dealWordFit()}>${t("DEAL")}</text></svg>`;
  }
  return `<svg class="deal-paper" viewBox="0 0 120 72" aria-hidden="true"><defs>${rough}</defs>${sheet}<text class="deal-word" x="56" y="41"${dealWordFit()}>${t("DEAL")}</text></svg>`;
}
