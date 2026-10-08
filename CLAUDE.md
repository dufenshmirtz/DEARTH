# DEARTH (ΝΤΕΡΘ) — notes for Claude

Indie occult arcade roguelike made by three friends. Repo owner: dufenshmirtz (https://github.com/dufenshmirtz/DEARTH).
Claude helps with everything: code, gameplay/balance, UI, graphics, animations.
Both "DEARTH" and the Greek "ΝΤΕΡΘ" are part of the branding.
Release targets: Steam/desktop and Android/iOS equally. Web is only the dev/runtime layer, not a goal.

## Working rules
- Never commit to `main` directly. Create a feature branch (`feature/...`, `fix/...`, `balance/...`, `docs/...`), commit there, open a PR.
- Do not touch uncommitted changes you did not make. Check `git status` first and ask before modifying files that already have local edits.
- Edit game logic in `src/game/*.js`, never `main.js` directly. Then run `pnpm run build:game` to regenerate `main.js`.
- Run `pnpm run check` before committing (verifies `main.js` matches `src/game` and syntax-checks the scripts).
- When a SEAL or ARTIFACT changes in code, update `ITEMS.txt` to match (it is a hand-maintained catalog).
- Shell is Windows (PowerShell / cmd). Use `pnpm`.

## Running
- `pnpm start` (or `start_pvp_server.bat`) → server on http://localhost:5177
  - Phone controller: `http://<lan-ip>:5177/controller.html`; mobile view: `/mobile.html`
- `index.html` can be opened directly for single-player only.
- Mobile: `pnpm run mobile:android` / `mobile:ios` (builds `native-www/` then `cap sync`). Android needs JDK 21 + SDK 36 (portable copy in `.android-toolchain/`, git-ignored). See README.md and MOBILE_BUILD.md.

## Code layout
- `src/game/` — ordered classic scripts (shared globals, no ES modules), concatenated by `scripts/build-game.js` in this order:
  - `00-audio-sfx-config.js` audio paths/volumes
  - `00-config-data-state.js` constants, ITEMS (seals p*, artifacts a*), bosses, bot archetypes, global `state`
  - `01-persistence-audio.js` save slots, records storage, audio playback
  - `02-run-records.js` run stats / best records
  - `02-rules-scaling.js` helpers, seal scaling (ELITE), HP/price scaling, MEMORY/BOUNTY rules
  - `03-descriptions-ui-stats.js` descriptions, boss passives, tooltips, shop price/tax
  - `04-damage-bots-core.js` damage/heal pipeline, bots, personalities, boss passive grants
  - `05-setup-shop-round-start.js` run setup, shop rolls, round start, bot guess AI, TARGET calc, reveal animation
  - `06-round-resolution.js` penalties, CRITICAL, eliminations, end-of-round seals, boss progression
  - `07-shop-artifacts.js` buying/selling, artifact use & targeting
  - `08-pvp.js` local PvP mode (host side)
  - `09-rendering.js` all DOM rendering
  - `10-events-bootstrap.js` event binding, startup
- `styles.css` — all styling. `controller.html/js` — phone controller. `server.js` — zero-dependency Node HTTP/API server for PvP.
- `assets/` (artifacts, audio, bots, seals, ui), `fonts/`.
- `android/`, `ios/` — Capacitor 8 projects (app id `com.aenao.dearth`), arcade-only, landscape.

## Game rules in brief
- Each round the player + 5 DAMNED guess 0–100. TARGET = ceil(weighted average × modifier + offset); modifier 0.8 by default (final bosses 0.666, unique bosses override).
- Damage = |guess − TARGET|; worst guess +10; CRITICAL (exact TARGET, window widened by seals) hits everyone else for 10% max HP.
- Stages: guess → active (≤2 ARTIFACTS) → reveal/resolution → summary → Devil's Offerings shop.
- Currency SIN; DAMNED carry BOUNTY (SIN paid on death) and MEMORY (past rounds, drives AI). Personalities: Anchor, Analyst, Follower, Stubborn, Drifter, Caller.
- Player: 100 HP, 8 starting SIN, 3 seal slots (max 6). ELITE seal levels usually ×1.5 damage.
- Bosses every 8 kills: 8 unique bosses (Zilon, Dantre, Pyros, Threon, Kalha, Serafim, Padma, Petros+Pavlos) → Goetic demon bosses → final bosses Jesus and Satan (infinite HP) → endless.
- PvP: up to 12 players, phones as controllers, simplified artifact set, modifier rerolls 0.7–1.2 every 3 rounds.

## Licensing
No open-source license; all rights reserved. Third-party asset audit pending before release.
