# Goblin healer

Approved artwork imported unchanged from
`art/brotd-infinity/level-01/enemies/goblin-healer` in the `codex/brotd-goblin-healer-assets` worktree.
Run `node king-defense-toon/scripts/prepare-goblin-healer-art.mjs <source-directory>` to reproduce the import and renderer geometry.

| Runtime image | Size | Bytes |
| --- | --- | ---: |
| `goblin-healer.webp` | 768 × 768, 16 frames | 185,496 |
| `heal-pulse.webp` | 256 × 256, 4 frames | 10,766 |

Image total: **196,262 bytes**. Original PNGs, concept art and preview GIF are not bundled.
SHA-256 provenance and prepared geometry are stored alongside the images. Geometry derives from the supplied explicit rectangles and boot/ground anchors, so raised potions, ears and staff are not cropped.

Body rows: four idle-right, four walk-right, four heal-right, four heal-down poses. Left-facing casts mirror the right poses; up-facing casts use the side view. The potion extends on local pose 2, synchronized to combat healing impact. The separate four-stage mint healing pulse plays once at the recipient's feet. No authored attack or death sequence exists: the weak fallback strike uses the idle body with the standard melee slash, and death uses the ordinary fade.

The supplied healer has one red-hood palette. It retains that authored appearance in later rounds; no painted color variants are substituted.
