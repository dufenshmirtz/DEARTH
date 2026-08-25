# ÆNAO

ÆNAO is an in-development browser game built around occult arcade strategy: a target-guessing battle loop, escalating roguelike item synergies, and a local PvP mode where phones can join as controllers.

The project began as a rapid prototype and is being shaped into a portfolio-ready game. It is playable, but still under active development. Balance, UX, content, architecture, and asset licensing notes may change before a formal release.

## Current Build

- Single-player roguelike run against procedurally selected opponents.
- Seal and Artifact economy with stacking effects, critical hits, boss passives, and round events.
- Local PvP host screen with phone/controller clients over a small Node HTTP server.
- Responsive mobile arcade view for smaller screens.
- Custom visual/audio asset set for the current occult table aesthetic.

## Running Locally

Install Node.js 18 or newer, then run:

```bash
npm start
```

The server prints the desktop host URL and any LAN phone URLs it detects.

- Desktop host: `http://localhost:5177`
- Phone controller: `http://<your-lan-ip>:5177/controller.html`
- Mobile view: `http://localhost:5177/mobile.html`

For single-player-only inspection, `index.html` can also be opened directly in a browser. PvP and phone controller sync require the server.

## Scripts

```bash
npm run check
```

Runs syntax checks for the browser game, phone controller, and local server scripts.

## Project Structure

- `index.html`, `main.js`, `styles.css` - main playable browser game.
- `mobile.html` - mobile-first game entry.
- `controller.html`, `controller.js` - phone controller client for local PvP.
- `server.js` - zero-dependency local HTTP/API server for PvP state sync.
- `assets/` - game art, UI, and audio assets.
- `fonts/` - bundled display font used by the game UI.
- `ITEMS.txt` - working design catalog for Seals and Artifacts.

## Development Roadmap

- Refine PvP room flow, reconnection behavior, and lobby state clarity.
- Continue balancing Seal/Artifact effects and boss progression.
- Split game systems into smaller modules as the prototype stabilizes.
- Add automated browser smoke tests for core single-player and PvP flows.
- Finalize asset credits and release packaging.

## Status And License

ÆNAO is public for portfolio and development review. It is not a finished commercial release.

No open-source license is currently granted. Source code and original assets are all rights reserved unless a future license is added. Third-party assets remain the property of their respective owners and are included here only as part of the in-development prototype pending a final asset audit.
