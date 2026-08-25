# Occult UI Border Kit

Thin, transparent, hand-painted UI borders designed to match the supplied occult stickman artwork and the black interface in the supplied game screenshot.

## Quick setup

1. Copy this entire folder into the game project.
2. Link `occult-borders.css` after the game's existing CSS.
3. Add the appropriate class to an existing element. The pseudo-elements do not intercept mouse input.

```html
<link rel="stylesheet" href="occult-ui-border-kit/occult-borders.css">

<section class="main-arena occult-frame">...</section>
<article class="player-card occult-card">...</article>
<article class="player-card occult-frantic">...</article>
<button class="guess-button occult-button">Guess</button>
<div class="health-track occult-progress"><div class="health-fill"></div></div>
```

## Mapping for the supplied screen

| Existing UI area | Recommended class |
| --- | --- |
| Main arena, Devil's Offerings, Artifacts, bottom seal inventory | `occult-frame` |
| Character cards, offering entries, Round/KOs/Sin/Health/Target boxes | `occult-card` |
| Selected card, active target, dangerous or clickable card | `occult-frantic` |
| Guess, Buy, Seal, Reroll, Pause buttons | `occult-button` |
| Health and progress tracks | `occult-progress` |
| Seals and circular portraits | `occult-circle` |
| Section separators | `occult-divider-h` or `occult-divider-v` |

Use `occult-variant-b` and `occult-variant-c` on neighboring dividers to avoid visible repetition.

## Visual balance

- Keep large frames around 50–55% opacity.
- Keep repeated cards around 60–68% opacity.
- Reserve the frantic border and full-white hover state for interactions or danger.
- Do not put the frantic version on every nested stat box; the interface becomes noisy and the important elements stop standing out.
- The files are deliberately larger than their display size. Let the browser downscale them for a thin 1–3 px painted result.

Override a single element like this:

```css
.important-card {
  --occult-border-opacity: 0.9;
  --occult-border-inset: -6px;
}
```

## Files

- `border-outer.png`: restrained large-container frame.
- `border-card.png`: ordinary repeated-card frame.
- `border-frantic.png`: stronger interactive/selected frame.
- `button-frame.png`: long button overlay.
- `progress-frame.png`: health/progress outline.
- `circle-frame.png`: seal or portrait ring.
- `divider-horizontal-*.png` and `divider-vertical-*.png`: three divider orientations/variations.
- `preview.png`: black-background contact sheet.
- `demo/index.html`: working integration example.

All PNG assets have genuine alpha transparency. No black background is stored in the asset files.
