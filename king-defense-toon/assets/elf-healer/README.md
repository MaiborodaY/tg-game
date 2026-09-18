# Elven Healer runtime art

Prepared from the approved files in `art/brotd-infinity/allies/elves/healer/`.
Regenerate with `node king-defense-toon/scripts/prepare-elf-healer-art.mjs`.

The original 512px lite atlas is copied unchanged for the first palette. Four
lossless variants recolor only the lower green robe, preserving the hood, skin,
staff, crystal and alpha. Their 96px menu portraits use the same crop pipeline as
the other elves; the initial portrait reuses `assets/recruitment/elf-healer.webp`.

`elf-healer-art.ts` retains each authored rectangle and frame-pixel foot anchor.
Use the side row for right/up, mirror for left, and the down row for down-facing
heals. Pose 2 matches the actual healing impact. Death uses the shared static fade.

The copied 128px pulse has four non-looping frames with separate ground anchors.
It draws briefly at the healed recipient's feet and is a separate, optional asset,
not embedded in startup JavaScript. Source PNGs, previews and larger atlases stay
outside the shipped game.
