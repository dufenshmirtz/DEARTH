# DEARTH balance bot

A bot that plays arcade runs like a good human trying to beat the 8 BOSSES (then keeps going into endless),
records every decision and outcome, and builds a balance report. Dev tool only: nothing here ships in a game build.

## Commands

| Command | What it does |
|---|---|
| `pnpm run bot -- --runs 300` | Plays a batch in the background (all CPU cores but one). Results in `bot-runs/<date>_<tag>/` |
| `pnpm run bot:lab` | Opens Bot Lab in the browser (http://localhost:5178): Start button, reports, alarms, run logs, compare |
| `pnpm run bot:tune` | Updates the bot's experience (what each SEAL / ARTIFACT is worth) from the batches in `bot-runs/` |
| `node --test scripts/bot/test-bot.js` | Checks the bot plays fair and its look-aheads leave the game untouched |

Batch options: `--build bounty|memory|reveal|critical|personality|artifact` (default: even rotation),
`--tag name`, `--main-only` (stop each run at the main-game win), `--seeds name` (same name = same runs),
`--force-seal p31` (start every run holding that SEAL), `--workers N`, `--max-rounds N` (safety cap, default 1000).

A/B test a change: run `--seeds ab1 --tag before`, change the game, run `--seeds ab1 --tag after`,
then open one batch in Bot Lab > Compare and pick the other.

## How it plays

- **Sees only the screen** (`observe.js`): cards, revealed guesses, past rounds, its SEALS/ARTIFACTS, the shop.
  Never the DAMNED's planned guesses, the dice, or Threon's hidden modifier.
- **Guess** (`predict.js`, `guess.js`): predicts each DAMNED from its personality and history, learns during the run,
  imagines the table 300 times, scores every guess on damage, worst-guess risk, CRITICAL and kills, then re-checks the
  best few on copies of the game (where every SEAL rule applies) with the hidden guesses replaced by its own estimates.
  Plays safe at low HEALTH; adds up to +/-2 human error.
- **ARTIFACTS** (`artifacts.js`): after the TARGET is revealed, tries every use (one or two, owned or bought on the
  spot, every target) on copies of the round and uses the best one if it beats keeping the ARTIFACTS.
  Daggers are kept for BOSSES.
- **Shop** (`shop.js`): saves for the first 3 shops, then spends. SEAL worth = experience (or price before tuning)
  x build fit; ELITE, swaps, rerolls and a 1-in-10 trial buy so every SEAL gets data.
- **Run plan** (`player.js`): one build per run, BOSS prep after 7 KOs, SIN kept for new SEAL slots.

Every number that shapes this is in `config.js` (points scale, risk, shop habits). Each batch saves the config it used.

## Files

`game-vm.js` + `vm-helpers.js` load `src/game` into a Node VM (no screen, no sound) with seeded dice, and press the same
functions the buttons do. `run.js` runs batches in worker threads, `report.js` builds `summary.json` and the alarms,
`lab-server.js` + `lab/bot-lab.html` are Bot Lab, `data/experience.json` is written by `bot:tune`.
