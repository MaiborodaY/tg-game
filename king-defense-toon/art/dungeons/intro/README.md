# Goblin Cave entry cinematic

Approved direction: a five-second moonlit, rainy procession into the cave.
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
- `tunnel.png`: archived, unused continuation beyond the cave mouth. Wet slate floor,
  monumental arches, stalactites, burgundy banners and warm torchlight, without
  characters or text. Referenced the approved storyboard and exterior background.
- `render.js`: deterministic offline composition: depth-sorted crowd, four-frame
  movement cycles, toad hop, a continuous camera approach, torch flicker, wet reflections,
  two-depth rain and final fade. Source alpha bounds normalize the sprite feet.

Prompts asked for true transparency, constant per-row identity and pivots,
chunky navy outlines, burgundy cloth and green skin, cold moon rim and warm
torch accents. The empty background retained the reference's setting; sprite
prompts explicitly prohibited front-facing leaders, scenery, shadows and text.
Generated PNGs remain intact; extraction/composition happens during export.

The new interior source was generated on 2026-09-19 as
`exec-64bc8542-92d7-4c60-9482-5dff8ccd6fb9.png`. Its prompt requested a vertical
9:16 low camera behind the procession, strong central perspective, a second
monumental arch and distant hall, near braziers and banners, cold moonlight from
behind the camera and warm light inside. It excluded creatures, exterior sky,
moon, falling rain, logos and UI so the existing identities could be composed
unchanged over it.

## Five-second edit and branding

- 0–1.4s: establish the moonlit mountain and move closer to the three leaders.
- 1.4–3.3s: follow the Chief, Bombardier and mounted King in a sustained closer
  view. Their complete silhouettes stay within the frame; smaller ranks flank them.
- 3.3–4.76s: smoothly overtake the leaders and enter the same cave mouth, keeping
  the environment and crowd positions continuous. There is no interior cut.
- 4.76–5s: brief fade into the gameplay scene, retaining the cave music.

This is an offline layered animation, not footage from a video-generation model.
The camera path and procession are authored for five seconds; the video is not
retimed after encoding. The archived interior image is not loaded by the exporter.
The game's WoC mark stays bottom left, opposite bottom-right Skip. It is an
independent noninteractive WebP overlay, so viewport cropping never cuts the mark
and future rebranding does not require another movie encode. Provenance and
export instructions are in `../../branding/README.md`.

## Repeatable export

From the repository root, with Playwright/Edge and FFmpeg with libx264 available:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\path\to\playwright\index.mjs'
$env:FFMPEG_PATH = 'C:\path\to\ffmpeg.exe'
node king-defense-toon/scripts/export-dungeon-intro.mjs
```

Set `BROWSER_CHANNEL` if using a different installed Chromium channel. PNG
frames go to ignored `.tmp/dungeon-intro/frames/`. The movie export is
`assets/dungeons/goblin-cave-intro.mp4`: 5 seconds, 120 frames at 24fps,
480 × 854, H.264/yuv420p, CRF 33, faststart, no audio track: 684,596 bytes
(about 669 KiB), versus 1,210,676 bytes for the previous cut.
Source layers remain outside the runtime asset graph. For this continuous edit,
480px CRF 31/33 and 432px CRF 30/32 were compared at 390 CSS pixels. CRF 33
retains the bosses' readable silhouettes, crown, banners, cannon and club while
sacrificing some fine stone/rain texture. The 432px option saved only another
65 KiB and softened the outlines, so the original dimensions are retained.

The video has no runtime particle systems or character rendering. The existing
single music player supplies the cave track across intro and battle. A Vite
content-hashed URL uses the existing immutable asset cache; the intro receives
its `src` only after catalogue opening (or direct replay), never at app startup.
Playback/failure/reduced-motion and lifecycle behavior are covered separately
by `tests/dungeon-intro.test.mjs` and `tests/dungeons.browser.mjs`.
