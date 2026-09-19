# Goblin Cave entry cinematic

Approved direction: a three-second moonlit, rainy procession into the cave.
No title or loading text. Preserve Chief with his club, Bombardier on his cannon
cart, and crowned King on an armoured toad with two burgundy banners.
`storyboard.png` is the approved three-panel reference. The dramatic, detailed
environment is an explicit exception for this intro, not a replacement for the
game's compact unit/cover style.

## Generated source layers

Created with the built-in image-generation tool on 2026-09-19, using the approved
storyboard as reference and checking the existing goblin and boss art first.
These sources are authoring files; none are imported by the game bundle.

- `background.png`: 941 × 1672. Empty wet mountain road, moon and cave, burgundy
  banners and torches. Characters and falling rain were removed by imagegen so
  their independent movement could be composed offline.
- `runners.png`: 1774 × 887 transparent 4 × 2 sheet. Top: four running frames of a
  burgundy-hooded goblin. Bottom: four running frames of the club Chief. Rear
  three-quarter view, heading away and to the upper right.
- `leaders.png`: same transparent grid. Top: Bombardier/cannon cart, rotating
  wheels and rider bob. Bottom: four toad hop poses with the King and banners.
- `render.js`: deterministic offline composition: depth-sorted crowd, four-frame
  movement cycles, toad hop, camera approach, torch flicker, wet reflections,
  two-depth rain and final fade. Source alpha bounds normalize the sprite feet.

Prompts asked for true transparency, constant per-row identity and pivots,
chunky navy outlines, burgundy cloth and green skin, cold moon rim and warm
torch accents. The empty background retained the reference's setting; sprite
prompts explicitly prohibited front-facing leaders, scenery, shadows and text.
Generated PNGs remain intact; extraction/composition happens during export.

## Repeatable export

From the repository root, with Playwright/Edge and FFmpeg with libx264 available:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\path\to\playwright\index.mjs'
$env:FFMPEG_PATH = 'C:\path\to\ffmpeg.exe'
node king-defense-toon/scripts/export-dungeon-intro.mjs
```

Set `BROWSER_CHANNEL` if using a different installed Chromium channel. PNG
frames go to ignored `.tmp/dungeon-intro/frames/`. Only
`assets/dungeons/goblin-cave-intro.mp4` ships: 3 seconds, 72 frames at 24fps,
480 × 854, H.264/yuv420p, CRF 28, faststart, no audio track. Current file: 801,946
bytes (about 783 KiB). CRF 23 and 30 were compared at mobile size; 28 keeps more
definition than the smaller encode without the 1.6 MB original export.

The video has no runtime particle systems or character rendering. The existing
single music player supplies the cave track across intro and battle. A Vite
content-hashed URL uses the existing immutable asset cache; the intro receives
its `src` only after catalogue opening (or direct replay), never at app startup.
Playback/failure/reduced-motion and lifecycle behavior are covered separately
by `tests/dungeon-intro.test.mjs` and `tests/dungeons.browser.mjs`.
