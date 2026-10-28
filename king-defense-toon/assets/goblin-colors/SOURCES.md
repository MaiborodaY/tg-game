# Native Torch goblin colors

Pixel Frog's authored Tiny Swords Blue, Purple and Yellow Torch sheets, converted
to lossless WebP from the user's collection. No recoloring, resizing, cropping or
new artwork is performed. The existing red PNG remains the fourth palette.

Source directory: `C:/Unity/Unity Projects/Bro TD/Assets/Sprites/Tiny Swords2/Tiny Swords (Update 010)/Factions/Goblins/Troops/Torch`.
Each source is `<Color>/Torch_<Color>.png` under this directory.

All variants are 1344 × 960 (seven columns and five rows of 192 × 192 cells).
The preparation script verifies their alpha channels against the existing red
sheet and checks every visible RGBA pixel after encoding. RGB under completely
transparent pixels may be discarded by WebP; alpha is always compared exactly.
Existing anchors, silhouettes, attack frames and animation timing are retained.

Campaign palettes follow the allied order: rounds 1–5 Blue, 6–10 Purple,
11–15 Red and 16–20 Yellow. These assets cover the native Torch goblin only;
the custom archer, chief, boar, ogre and Level 2 undead artwork is unchanged.

Recreate with `node king-defense-toon/scripts/prepare-goblin-colors.mjs`
from the worktree root. Source files are never modified.

| Runtime file | Source PNG bytes | WebP bytes | Source PNG SHA-256 | WebP SHA-256 |
| --- | ---: | ---: | --- | --- |
| torch-blue.webp | 58099 | 21056 | 8be105dfb696767a447402258eeb1d8a95ee89b444fce83a003e7b654933f448 | 34a041e8362ca8b1db28a1dc66cecc80c46b821f804352a44550d302830c564c |
| torch-purple.webp | 58015 | 21034 | 9f19a5a789ad5df29b37ef60e6c3111b0c4118e89515e337ffb44052e6a2691a | 67cae3b79c3b446c353dc2b41b9ecee7e0defe756c27b0e904e777261733b313 |
| torch-yellow.webp | 57947 | 21070 | 5d57fa095feb61270cf84bfbd5d3fb3bc6493be9bef7dda4a7ea233803d33768 | bd0c3e240bc17807c2425718bd6afc57be3f86730c3ee39df9c7c10769924ccc |

Total additional runtime art: **63160 bytes**.
