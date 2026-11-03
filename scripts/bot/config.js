"use strict";

// Every number that shapes how the bot plays, in one place, so we can tune it together.
// Change a value here and the next batch plays with it (each batch stores the config it used).
module.exports = {
  // ---- points: how the bot compares different results ----
  points: {
    hp: 1, // 1 HP lost costs 1 point while HEALTH is high...
    hpLow: 2, // ...rising smoothly to 2 points per HP at the safe-mode line
    sin: 0.7, // 1 SIN gained, up to a working bank of...
    sinComfort: 40, // ...this much SIN
    sinPile: 0.35, // SIN beyond that bank is worth less (spend it)
    sinAbove150: 0.2, // SIN past 150 is nearly worthless (prices double)
    killProgress: 3, // a whole DAMNED's HEALTH taken away = 3 points (its BOUNTY comes in as SIN)
    bossPercent: 0.5, // 1% of a BOSS's max HEALTH
    bossKillBonus: 20, // beating a BOSS (on top of the damage)
    bountyOnLivingDamned: 0.35, // 1 BOUNTY added to a DAMNED we may kill later
    death: 1000
  },

  // ---- guessing ----
  guess: {
    samples: 300, // imagined tables per round (fast estimate)
    refineCandidates: 4, // best guesses re-checked on a copy of the game with every SEAL rule
    refineSamples: 10,
    noise: 2, // human error on the final number: up to +/-2
    critHuntChance: 0.25, // go for CRITICAL when at least this likely...
    critHuntBonus: 2, // ...worth this many extra points
    safeHp: 30, // below this HEALTH: play safe (avoid the worst guess)
    safeHpBossPrep: 40,
    safeRiskAversion: 0.5, // in safe mode, how much a risky guess is punished
    wildGuessChance: 0.08 // chance any DAMNED does something unexpected
  },

  // ---- ARTIFACTS ----
  artifacts: {
    keepFactor: 1, // keeping an ARTIFACT is worth its price x this
    talismanKeepFactor: 1.8, // Dark Talisman is saved for a round that really hurts
    daggerHoardFactor: 3, // Sacrificial Dagger kept for BOSSES while none is alive...
    daggerBossFactor: 0.5, // ...and used freely once one is
    buildItemFactor: 1.5, // ARTIFACTS that trigger our SEALS or fit the build
    simSamples: 2, // copies per option when a SEAL or BOSS rolls dice
    pairCandidates: 6, // best single uses tried in pairs
    confirmTop: 5, // the best few options are checked again...
    confirmSamples: 8, // ...with this many more copies (dice make one look noisy)
    minGain: 0.5, // use only when it beats keeping by at least this
    priorWorthFactor: 1, // before any tuning: an ARTIFACT bought for later is worth its price x this
    buyMargin: 1.5 // buy one for later only when worth - cost beats this
  },

  // ---- shop ----
  shop: {
    savingShops: 3, // the first rounds: skip unless something is clearly good
    savingMinScore: 6, // "clearly good" during the saving rounds
    badGuessDamage: 12, // average damage over recent rounds that counts as "guessing badly"
    reserve: 3, // SIN kept back after the saving rounds
    sinCap: 150, // prices double above this
    horizonRounds: 30, // a SEAL is judged on the next N rounds at most
    buildBonus: 0.6, // on-build SEALS are worth this much more (x1.6)
    offBuildPenalty: 0.35, // off-build SEALS are worth this much less
    exploreChance: 0.1, // 1 in 10 SEAL choices: try a SEAL rated low, so every SEAL gets data
    sellMargin: 4, // replace a SEAL only when the new one is this many points better
    rerollMinValue: 4, // keep rerolling while a find is expected to be worth this
    maxRerolls: 6,
    pileMaxRerolls: 10, // with more SIN than the working bank
    richMaxRerolls: 15, // above 150 SIN: keep rerolling to spend it (looking for ELITE upgrades)
    priorPointsPerPrice: 0.12 // before any tuning: a SEAL earns price x this points per round
  },

  // ---- run plan ----
  plan: {
    bossPrepKills: 7, // KOs since the last BOSS when boss prep starts (bosses come after 8-12)
    slotSaveSin: 8 // SIN kept before the 2nd/4th/6th BOSS for the new SEAL slot
  },

  run: {
    maxRounds: 1000 // safety cap per run
  }
};
