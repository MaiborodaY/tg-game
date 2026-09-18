# Recruitment portraits

Three static portraits exported from the approved elf sprite atlases. These files
are menu illustrations only; they do not add battle units or animations.

| Portrait | Source under `art/brotd-infinity/allies/elves/` |
| --- | --- |
| `panther-rider.webp` | `panther-rider/panther-rider-768-lite.webp` |
| `elf-archer.webp` | `archer/elf-archer-512-lite.webp` |
| `unicorn.webp` | `battle-unicorn/battle-unicorn-512-lite.webp` |

Each portrait uses frame 0 (`idle-right`, pose 0), with the exact rectangle from
the corresponding `.frames.json`. Margins are trimmed by alpha above 1/255 with
one source pixel retained around the silhouette; this excludes almost invisible
export noise while preserving the character, weapon and proportions. The image is fitted
inside 88 × 88 pixels with nearest-neighbor sampling and no enlargement, then
centered on a transparent 96 × 96 canvas with at least 4 pixels of padding.
Output is near-lossless WebP at quality 85 with full-quality alpha. Source artwork remains unchanged.

Regenerate from the repository root:

```sh
node king-defense-toon/scripts/export-recruitment-portraits.mjs
```

The script validates source dimensions and frame bounds, nonempty portraits,
96 × 96 output, transparent padding and a combined limit of 30 KB. It prints each
file's byte size. Asset provenance and the original imagegen prompts remain in
the source directories. No elf healer artwork was present in the source catalog
when these portraits were exported.
