# Panther rider runtime art

Source: `art/brotd-infinity/allies/elves/panther-rider/panther-rider-768-lite.webp` and its `panther-rider-768.frames.json`. The original files are untouched.

Four rows: idle right, walk right, side attack, down attack. Each has four poses; pose 2 is the impact. Upward attacks use the side row, west mirrors horizontally, and death uses the normal fade. Explicit crop rectangles and foot anchors retain the entire rider, sword, mount and tail.

Body reference: 108 source pixels rendered at 47 game pixels. Formation is static and uses the same scale. The original green palette covers levels 1–49, purple 50–99, red 100–249, gold 250–499 and black 500+. Palette generation changes only green cloth inside the rider bounds; the panther, skin, hair and weapon pixels and all alpha values are preserved. Palette sheets are lossless WebP. Base menu art reuses the existing recruitment portrait.

Recreate: `node king-defense-toon/scripts/prepare-panther-rider-art.mjs`.

| Palette | Atlas bytes | Extra portrait bytes | Cloth pixels changed |
| --- | ---: | ---: | ---: |
| green | 104334 | 0 | 0 |
| purple | 293156 | 18538 | 9616 |
| red | 290262 | 18358 | 9616 |
| gold | 292484 | 18560 | 9616 |
| black | 286702 | 18146 | 9616 |
