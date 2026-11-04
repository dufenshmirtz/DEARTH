# DEARTH balance bot

A bot that plays arcade runs like a good human trying to beat the 8 BOSSES (then keeps going into endless),
records every decision and outcome, and builds a balance report. Dev tool only: nothing here ships in a game build.

## Commands

| Command | What it does |
|---|---|
| `pnpm run bot -- --runs 300` | Plays a batch in the background (all CPU cores but one). Results in `bot-runs/<date>_<tag>/` |
| `start_bot_lab.bat` (double-click, repo root) | Same as `pnpm run bot:lab`, no command line needed |
| `pnpm run bot:lab` | Opens Bot Lab in the browser (http://localhost:5178): Start button, reports, alarms, run logs, compare |
| `pnpm run bot:tune` | Updates the bot's experience (what each SEAL / ARTIFACT is worth) from the batches in `bot-runs/` |
| `node --test scripts/bot/test-bot.js` | Checks the bot plays fair and its look-aheads leave the game untouched |

Batch options: `--build bounty|memory|reveal|critical|personality|artifact` (default: even rotation),
`--tag name`, `--main-only` (stop each run at the main-game win), `--seeds name` (same name = same runs),
`--force-seal p31` (start every run holding that SEAL), `--workers N`, `--max-rounds N` (safety cap, default 1000).

**Coverage** (`--coverage --per-seal 30`, or "Coverage" in Bot Lab's Start form): every SEAL is played the same number
of times on the same seeds, each run starting with that SEAL (it is never sold) and builds rotating evenly. Each SEAL is
compared with the average SEAL on the same seeds, so luck cancels out; the Coverage tab lists nerf and buff candidates
(only when the difference is bigger than its range and at least 0.25 BOSSES) and the same for builds. About
`105 SEALS x runs per SEAL` runs in total; a batch stopped early stays even. `bot:tune` uses Coverage results first.

**Combine Coverage batches** (button above the batch list in Bot Lab): pick several Coverage batches, e.g. from several
PCs, and read them as one Coverage table. Only batches played on the same game, bot and experience can be mixed; the
same game played twice (same seed set, seed and SEAL) counts once; only seeds every SEAL has played are used. Each batch
keeps a small `coverage-rows.json` cache so combining is quick after the first time. When copying batches between PCs,
two folders with the same name are different batches: rename one (e.g. `..._v`) instead of overwriting.

**Stop and Continue**: Stop keeps every finished run. A stopped batch shows a Continue button in Bot Lab
(or `pnpm run bot -- --continue <batch folder name>`): it plays only the missing runs, on the same seeds and settings,
so the result is identical to a batch that was never stopped (a run cut off by Stop is simply played again). Continue is
blocked if the game code, the bot's play code/settings or its experience changed since the batch started, so a batch can
never mix runs played under different rules. Only the number of workers may change.

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
- **Experience** (`tune.js`): a SEAL's worth mixes what it did itself (damage, healing, SIN valued at what it was worth
  when it came in, capped at 4x a typical SEAL) with whether runs holding it beat more BOSSES than runs still alive at
  the round it arrived. The second part counts more as more runs hold the SEAL; measurements are only half-trusted
  after 200 rounds, and a SEAL never drops below a quarter of its price-based estimate.
- **Run plan** (`player.js`): one build per run, BOSS prep after 7 KOs, SIN kept for new SEAL slots.

## Reading the report

Bot Lab shows ranges next to win rates and averages: the real number is most likely inside them, and two batches,
builds or SEALS only really differ when their ranges don't overlap. Compare pairs runs by seed when two batches share a
seed set. SEALS are compared with runs still alive at the round they usually arrive ("BOSSES vs expected", with a
"Beyond luck?" column). Deaths with 2+ BOSSES alive count for that group. The Late game tab covers everything after the
8 BOSSES: endless depth, what ends it, and every Goetic BOSS by name with the SEAL it blocks.

Every number that shapes this is in `config.js` (points scale, risk, shop habits). Each batch saves the config it used.

## Files

`game-vm.js` + `vm-helpers.js` load `src/game` into a Node VM (no screen, no sound) with seeded dice, and press the same
functions the buttons do. `run.js` runs batches in worker threads, `report.js` builds `summary.json` and the alarms,
`lab-server.js` + `lab/bot-lab.html` are Bot Lab, `data/experience.json` is written by `bot:tune`.
