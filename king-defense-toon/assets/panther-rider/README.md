# Panther rider runtime art

Source: `art/brotd-infinity/allies/elves/panther-rider/panther-rider-768-lite.webp` and its `panther-rider-768.frames.json`. The original files are untouched.

Four rows: idle right, walk right, side attack, down attack. Each has four poses; pose 2 is the impact. Upward attacks use the side row, west mirrors horizontally, and death uses the normal fade. Explicit crop rectangles and foot anchors retain the entire rider, sword, mount and tail.

Body reference: 108 source pixels rendered at 54.05 game pixels (47 × 1.15). Formation is static and uses the same scale. The original green palette covers levels 1–49, purple 50–99, red 100–249, gold 250–499 and black 500+. Palette generation changes only green cloth inside the rider bounds; the panther, skin, hair and weapon pixels and all alpha values are preserved. Palette sheets are lossless WebP.

All five menu portraits use the newer `glaive-v2/panther-glaive-rider-512-lite.webp` idle pose at 96 × 96 pixels. The base portrait is in `../recruitment/panther-rider.webp`; the four recolored portraits are beside these atlases. Menu palettes preserve the same level bands, but do not change the battle atlas or introduce thrown-glaive combat. See `../recruitment/README.md` for the portrait export contract.

Recreate atlases and portraits: `node king-defense-toon/scripts/prepare-panther-rider-art.mjs`.
Recreate portraits only: `node king-defense-toon/scripts/export-recruitment-portraits.mjs`.

| Palette | Atlas bytes | Portrait bytes | Atlas cloth pixels changed |
| --- | ---: | ---: | ---: |
| green | 104334 | 8388 | 0 |
| purple | 293156 | 8604 | 9616 |
| red | 290262 | 8374 | 9616 |
| gold | 292484 | 8504 | 9616 |
| black | 286702 | 8270 | 9616 |
