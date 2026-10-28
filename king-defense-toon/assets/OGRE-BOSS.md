# Ogre final boss

User-supplied generated artwork for BroTD Infinity. This is custom art, not an original Pixel Frog asset. The final wave uses this ogre while earlier goblin chiefs keep their existing artwork.

Original PNG (retained outside the repository, never imported by the browser build):

`C:/Users/mrmay/.codex/generated_images/01a0acc1-805f-7613-b91e-155713b6863e/exec-4f004aee-1134-424f-8b8f-2206417dbc28.png`

- Source: transparent RGBA, 1254 x 1254, 1,146,415 bytes.
- Source SHA-256: `5b6da246eb84737c16cec76a1e3ee45bca4849b37e2cb52ddac751e529d9867d`.
- Runtime: `web/ogre-boss.webp`, 640 x 640, 239,754 bytes (234.1 KiB), 79.1% smaller than the source.
- Runtime SHA-256: `2ef8508910c86935c473515c7e3919c938b2fce496c0937499861c4f61ac888a`.
- Nominal decoded RGBA: 1,638,400 bytes (1.56 MiB), compared with 6,290,064 bytes for the full-size PNG. This is an image-data calculation, not a browser memory benchmark.

The offline exporter downsamples once with Lanczos3, then encodes the result using lossless WebP. Transparency is retained; no opaque background or runtime pixel processing is introduced. Compression is lossless relative to the resized atlas, not relative to the original high-resolution PNG.

All sixteen poses remain in four rows: idle, walk right, side strike, downward strike. Each row has four frames; the third frame of either strike is the impact pose. Whole 160 x 160 cells are isolated with transparent gutters. No extra attack sprites cross cell boundaries.

`../ogre-art.mjs` contains fixed scale and measured normalized feet/center anchors. The club reaches below the feet during a downward smash, so its bottom edge must not determine the ground anchor. The 190-source-pixel body height renders at 70 logical game pixels; the runtime atlas retains about 97 pixels of body detail. The inherited fade handles death because this supplied atlas has no death sequence.

Rebuild with the repository's existing Sharp dependency:

```powershell
node king-defense-toon/scripts/prepare-ogre-art.mjs
# On another machine, supply the downloaded original PNG as the first argument.
node king-defense-toon/scripts/prepare-ogre-art.mjs C:/art/ogre-source.png
```

Validation: source alpha/dimensions and all frame bounds inspected; the compact atlas and a static contact sheet were inspected at the intended body scale with a ground guide. No battle simulation or browser battle run was performed.
