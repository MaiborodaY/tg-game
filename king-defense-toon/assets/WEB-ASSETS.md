# Browser asset preparation

Run from the worktree root after changing source artwork:

```powershell
node king-defense-toon/scripts/prepare-web-assets.mjs
node king-defense-toon/scripts/prepare-goblin-art.mjs
node ../../node_modules/vite/bin/vite.js build king-defense-toon --config king-defense-toon/vite.config.mjs
```

The exporter uses the repository's existing `sharp` dependency. It creates ten files in `assets/web/` and the URL/bounds manifest `asset-web.mjs`. Original PNG sources and previous artwork are retained.

| Asset | Before, bytes | After, bytes |
| --- | ---: | ---: |
| King atlas | 946,114 | 730,996 |
| Enemy specialist atlas | 1,932,495 | 809,314 |
| Obsolete allied atlas loaded at startup | 1,861,402 | 0 |
| Eight prepared portrait/art images | generated at startup | 64,074 |
| Production assets directory, including JS/CSS/font/map | 5,167,972 | 2,032,867 |

The last row compares the production build before and after this change: 60.7% fewer bytes, before HTTP compression. Small portrait PNGs are inlined by Vite into JS; the directory total already includes them. This is a build-size comparison, not a measured network transfer or startup timing.

King and specialist sheets retain their dimensions (1254×1254 and 1536×1024), frame rectangles, anchors and timings. WebP is lossless. The specialists' former magenta background removal runs once in the exporter. Decoded visible RGBA equality and all eight component bounds are asserted; hidden RGB beneath zero alpha is immaterial. Running the exporter twice produced identical file hashes. Native Tiny Swords PNG sheets are unchanged.

The four units' portraits and selected art use the former first-frame component crop, placement and nearest-neighbor sampling. `scene.mjs` now uses the exported images and rectangle metadata directly: no atlas pixel readback, background removal, component searches or portrait PNG encoding on startup. Missing sheets still fall back to the simple canvas figures.

Lossless compression reduces download size, not the decoded memory of a same-size image. Removing the unused 1536×1024 allied atlas avoids approximately 6 MiB of nominal RGBA image data, plus its former processing buffers; actual browser RAM and FPS were not profiled.

Validation: production build and module syntax passed; the generated assets were inspected at 390×844 in the separate localhost preview. Recruitment portraits and selected-unit art loaded, the battle rendered enemies and completed, and the browser reported no errors. The real 127.0.0.1 formation and progress were not modified. No new test suite was added for this MVP.

## Red goblin specialists, 2026-09-16

Custom matching archer and chief atlases are exported losslessly by `prepare-goblin-art.mjs`: archer 900,961 -> 724,922 bytes; chief 1,289,563 -> 1,019,814 bytes. Both retain their 1254 x 1254 dimensions and exact visible RGBA. The earlier 809,314-byte specialist sheet is retained locally but no longer referenced by the runtime manifest or included in new builds. Source rectangles and feet anchors are prepared metadata; no runtime scanning is added. Historical size totals above precede these new characters. Battle checks were omitted at the user's request.

## Native upgrade colors

`prepare-rank-assets.mjs` copies the pack's Purple/Red/Yellow Warrior, Archer and Monk
animation sheets and makes small first-frame menu crops. These extra images are cached
once during scene creation; rendering selects an existing atlas by level. No per-frame
color filter, canvas recoloring or pixel readback is used. The native Blue sheets remain
level 1. See [ranks/SOURCES.md](ranks/SOURCES.md) for the byte-identical copy hashes.
The historical build and RAM totals above predate these additional palettes.

## Ogre final boss, 2026-09-17

The supplied 1,146,415-byte 1254 x 1254 PNG is exported once to a transparent
640 x 640 WebP (239,754 bytes, 79.1% smaller). All 16 frames remain, with normalized
feet anchors and no runtime image processing. Lossless WebP preserves the resized
pixels; downsampling is the intentional resolution reduction. At 70 logical pixels
of body height the atlas retains about 97 source pixels per body. Nominal decoded
RGBA falls from 6.00 to 1.56 MiB. Only the compact export is imported by the build;
the full PNG stays outside the repository. See [OGRE-BOSS.md](OGRE-BOSS.md).

## Forgotten Graveyard map and bosses, 2026-09-17

Approved Level 2 runtime WebPs are copied byte-for-byte from the `art/` catalog: map 159,242 bytes (780 × 1080), Crypt Spider 205,530 bytes (768 × 768), Crypt King 127,576 bytes (768 × 768). Combined additional image payload: **492,348 bytes**. Only these compact files enter the bundle; source PNGs, concept art, previews, alternate map size and lossless masters stay outside it. Boss frame rectangles and anchors are prepared metadata; both canvases share decoded images. See [GRAVEYARD.md](GRAVEYARD.md).
