# Elven Archer runtime art

Exact base copy: `art/brotd-infinity/allies/elves/archer/elf-archer-512-lite.webp`. Geometry comes from its 16 explicit rectangles and frame-local foot anchors in `elf-archer-512.frames.json`.

Rows are idle right, walk right, shoot right and shoot down. Release pose 2 (frames 10/14) has no nocked arrow; the existing ordinary arrow effect starts then. West mirrors side poses and upward fire uses the side row. Death uses the normal allied fade. Formation uses a stationary idle frame.

The 102px idle body reference renders at 38 game pixels, matching the human archer. HP offset is 42px. Level palettes: green 1–49, purple 50–99, red 100–249, gold 250–499, black 500+. Technical recoloring affects green/teal cloth below the head only. Skin, hair, wooden bow, arrow, silhouettes and alpha remain unchanged. Recolored atlases use lossless WebP; only the needed sheet loads. Base menu art reuses `../recruitment/elf-archer.webp`; other menu variants are 96×96 portraits, separate from the battle sheets.

Recreate: `node king-defense-toon/scripts/prepare-elf-archer-art.mjs`.

| Palette | Atlas bytes | Rank portrait bytes | Cloth pixels changed |
| --- | ---: | ---: | ---: |
| green | 106266 | 0 | 0 |
| purple | 291204 | 10500 | 9265 |
| red | 289218 | 10386 | 9265 |
| gold | 291082 | 10512 | 9265 |
| black | 286414 | 10196 | 9265 |
