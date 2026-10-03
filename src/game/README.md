# Game Source Layout

`main.js` is the browser bundle that `app.html`, `index.html`, and `mobile.html` load.
Edit the ordered files in this folder, then run:

```sh
pnpm run build:game
```

The bundle order is defined in `scripts/build-game.js`. The split is intentionally classic
script code rather than ES modules so the game keeps the same global runtime behavior.

Use `00-audio-sfx-config.js` for global audio paths, UI Sfx volume, Artifact Sfx volume,
and per-sound start offsets.

Use `02-run-records.js` for run record aggregation and best-ever record persistence.
