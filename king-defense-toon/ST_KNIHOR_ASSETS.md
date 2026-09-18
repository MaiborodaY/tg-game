# St. Knihor — asset pack

Status: integrated into the game as the first playable hero, replacing the king. The independent animation preview remains available for art review. Progression and combat rules are documented in `ST_KNIHOR_HERO.md`.

## Approved character

St. Knihor is the first paladin hero: a bald, clean-shaven Black man with dark brown skin, silver armor with restrained gold trim, a blue cape, a sun shield, and a one-handed hammer. His level-one design is deliberately close to ordinary infantry. His strength will come from progression and talents.

The approved concept is archived at `art/st-knihor/approved-concept.png`. Runtime assets are in `assets/st-knihor/`; source images are archived separately in `art/st-knihor/source/`.

## Animation contract

Three authored directions: front/down, side/right, and back/up. The renderer mirrors the side atlas when facing left. Each atlas contains 24 frames, four columns by six rows, in 128×128 cells (512×768 total).

| Row | Animation | Playback |
| --- | --- | --- |
| 0 | Idle | 3 frames/s, loop |
| 1 | Walk | 6 frames/s, loop |
| 2 | Hammer attack | 0.9 s, contact on third pose |
| 3 | Ability gesture | 1.2 s, release on third pose |
| 4 | Hit reaction | 0.32 s, stops on last pose |
| 5 | Fall | 0.8 s, remains in final fallen pose |

The frame anchor is (64, 110). Measured median standing body height is 82.5 atlas pixels; render at about 40 screen pixels, comparable with the current infantry. A shared 0.428 packing scale preserves raised weapons without clipping or resizing individual poses. Attack and cast durations can be supplied by the simulation. The contact pose follows the supplied impact time, not display frame rate.

`st-knihor-art.mjs` describes atlas URLs and geometry. `tiny-st-knihor.mjs` selects frames and directions without changing combat state.

## Lightweight skill effects

One 512×512 atlas contains four 4-frame sequences in 128×128 cells:

- Heal: one short gold/ivory pulse, 0.8 seconds.
- Armor: a thin blue/gold ground ring, one 1.2-second cycle.
- Hammer: a small rotating projectile, 0.6 seconds.
- Impact: a brief flash at the target, 0.4 seconds.

Effect functions return a finite lifetime; the consumer must remove expired effects. A persistent armor aura can reuse its ring sequence while the living hero's aura is active. Rendering uses ordinary Canvas image draws, without blur filters, lights, particle systems, or fullscreen flashes.

Combat applies damage and healing independently from rendering, revalidates the target at impact, and clears pending actions when the hero dies or a wave ends. The scene shares the same loaded atlases across both canvases. The static formation grid does not draw the hero or his aura.

## Review

Open `http://127.0.0.1:5187/hero-preview/` using the existing Vite dev server. It provides normal and enlarged views, all actions and directions, skill previews, playback speeds ×1/×2/×3, pause, and light/dark backgrounds. The page neither imports the combat scene nor changes saves.

Tests:

```powershell
node --test king-defense-toon/tests/st-knihor-art.test.mjs
$env:PLAYWRIGHT_MODULE = 'C:\Users\mrmay\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs'
node king-defense-toon/tests/st-knihor-art.browser.mjs
```

These checks cover the asset contract, frame bounds, contact timing, effect expiration, browser loading, rendering, controls, mobile layout, and save isolation. They are not a full battle-performance or game-balance test.

## Generation provenance

The five runtime images total **420,504 bytes (410.65 KiB)**: three body atlases, one effects atlas, and one portrait. WebP quality 92 preserves the prepared alpha channel exactly. Full-resolution source PNGs and the approved concept are archived for future art work; they are not imported by the game or the preview bundle.

Rebuild the runtime images from the archived sources:

```powershell
node king-defense-toon/scripts/prepare-st-knihor-art.mjs
```

`assets/st-knihor/provenance.json` records source/output hashes, frame boundaries, foot anchors, scale, file sizes, alpha verification, and color compression metrics. Packing checks cover nonempty frames, transparent gutters, unclipped opaque body pixels, and a 512 KiB runtime image budget.

Artwork was produced with the built-in `image_gen.imagegen` tool from the approved concept. Exact generation/edit prompts and source output filenames are recorded in `art/st-knihor/generation-prompts.json`. The preparation script mechanically crops, aligns, sizes, and encodes the generated source files for the runtime atlas contract; the source artwork remains archived.
