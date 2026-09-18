# Recruitment portraits

Four static portraits exported from the approved elf sprite atlases, plus four
rank palettes for Panther Rider in `../panther-rider/*-art.webp`. These files
are menu illustrations only; they do not add battle units or animations.

| Portrait | Source under `art/brotd-infinity/allies/elves/` |
| --- | --- |
| `panther-rider.webp` | `panther-rider/glaive-v2/panther-glaive-rider-512-lite.webp` |
| `elf-archer.webp` | `archer/elf-archer-512-lite.webp` |
| `elf-healer.webp` | `healer/elf-healer-512-lite.webp` |
| `unicorn.webp` | `battle-unicorn/battle-unicorn-512-lite.webp` |

Each portrait uses frame 0 (`idle-right`, pose 0), with the exact rectangle from
the corresponding `.frames.json`. Margins are trimmed by alpha above 1/255 with
one source pixel retained around the silhouette; this excludes almost invisible
export noise while preserving the character, weapon and proportions. The image is fitted
inside 88 × 88 pixels with nearest-neighbor sampling and no enlargement, then
centered on a transparent 96 × 96 canvas with at least 4 pixels of padding.
Output is near-lossless WebP at quality 85 with full-quality alpha. Source artwork remains unchanged.

The Rider's menu model uses the new silver-haired glaive design. Green cloth
changes to purple / red / gold / black at levels 50 / 100 / 250 / 500. The tint
mask excludes the face, glaive, panther and its eyes; palette generation preserves
source alpha and all non-clothing pixels. The live battle now uses this same
glaive model; its atlas, hand anchors and separate projectile are prepared by
`prepare-panther-rider-art.mjs`. This menu-only exporter does not alter combat.

Regenerate from the repository root:

```sh
node king-defense-toon/scripts/export-recruitment-portraits.mjs
```

The script validates source dimensions and frame bounds, nonempty portraits,
96 × 96 output, transparent padding and a combined limit of 80 KB for all eight
portraits (currently 69,192 bytes). It prints each
file's byte size. Asset provenance and the original imagegen prompts remain in
the source directories. Healer and Archer remain Coming soon, and Unicorn remains
Locked; their artwork does not enable them in recruitment rolls or combat.
