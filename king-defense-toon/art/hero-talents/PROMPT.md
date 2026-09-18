# Calm hero talents

Edited with the built-in image_gen tool from the original approved 18-icon atlas.
Generated source: `exec-56935ec5-1fcb-4aac-be97-36692abe14d7.png`.
The original artwork is preserved in Git history. Only the WebP export is loaded by the game.

The six-column, three-row arrangement and all talent IDs are unchanged. Full-tile rays
and bright bloom were removed; small lights, muted aura rings and restrained lightning
retain the magical theme. No CSS dimming/filter pass or extra animation is required.

Export: `node king-defense-toon/scripts/prepare-talent-art.mjs`.
The runtime atlas stays 768 × 384 (128px per icon) at WebP quality 84. It is 41,904 bytes,
down from 107,796 bytes (61.1% smaller), with the same decoded dimensions and one image request.

## Final edit prompt

Use case: precise-object-edit.
Edit target: the supplied original 6-column by 3-row atlas of 18 pixel-art fantasy hero talent icons. Produce ONE replacement atlas at exact 2:1 aspect ratio, ideally 2048x1024, exactly 6 equal square columns and 3 equal square rows. Every icon must remain in the exact same cell and depict the same recognizable subject, scale and orientation as in the input. No text, numbers, decorative frames, gaps, new icons or rearrangement.
Primary change: drastically reduce visual noise and excessive magical brightness across the whole set. These icons are all visible at once at just 40-60px in a mobile talent tree. Keep the original dark navy backgrounds, gold/steel/blue materials, clean stylized pixel clusters and fantasy identity, but make them calm, readable, matte. Remove ALL full-cell radial blue rays and nearly all golden starburst spokes and scattered sparkles. Replace these busy backgrounds with flat quiet dark desaturated navy. Reduce white-hot yellow/white cores, bloom and neon outlines by roughly 80 percent. Preserve clear subject silhouettes and midtone contrast: do not merely darken the entire image. Gold should look like warm muted brass, blue shields like muted royal blue, steel like medium cool silver. Small restrained rim highlights are fine. Magical accents should be compact and localized; no cell-spanning radiance.
Exact row-major cell subjects to preserve:
Row 1: (1) open healing hand, a small gentle amber light near the palm and no starburst behind it; (2) a simple warm golden sun disc with only a few short soft rays, not white-hot; (3) winged pocket watch with off-white wings; (4) steel shield with gold cross; (5) two modest four-point healing stars, one larger and one smaller, no needle-like long rays or sparkles; (6) three people silhouettes under a small subdued gold sun, no white corona.
Row 2: (1) quartered steel/brass shield with a thin quiet gold ring; (2) blue-and-gold shield; (3) one person silhouette with three thin muted ochre range rings, not glowing neon; (4) blue shield with gold heart; (5) three people under a muted blue translucent dome with a thin soft edge, no sparks, no white neon outlines; (6) a shield shaped like a castle battlement.
Row 3: (1) steel/brass warhammer angled up-right; (2) downward hammer hitting a small cracked patch of stone, only a very small amber contact accent, no explosive rays; (3) hammer and pocket watch; (4) downward hammer with a restrained short ground shockwave ring and few stones, no huge blast; (5) upright silver sword with brass hilt and one small warm highlight, no starburst; (6) large angled dark warhammer with only two small subdued ochre lightning marks, no glowing aura.
Consistency and constraints: preserve compact pixel-art object design and original cell arrangement. Keep all symbols legible, not muddy or faded. Uniform plain navy backgrounds across all cells. Shared palette and lighting. This is a quieter version of the same approved game artwork, not a redesign into flat vectors, photorealism or children's clipart. Biggest priority: drastically fewer luminous lines and no large white or neon glowing areas. Output only the finished atlas.
