# Goblin Cave menu art

The user restored the second, simpler pixel-art menu variant on 2026-09-19.
`game-style-menu-reference.png` preserves that exact earlier imagegen output
(`exec-4b149e73-3ca6-40c0-a711-217ccaedb42a.png`, generated 2026-09-19 00:06 UTC).
The three existing illustrations were mechanically extracted, not regenerated.
These illustrations are for menu cards only; combat sprites, the cave map,
navigation icon and boss mechanics are unchanged.

`goblin-cave-covers-source.png` is one equal-column atlas (Chief, Bombardier,
King). Runtime `assets/dungeons/goblin-cave-covers.webp` is 1152 × 384 at quality
90 (effort 6); CSS selects each third. `cave-icon-source.png` is exported as a transparent
128 × 128 WebP at quality 85. Sources stay out of the runtime bundle.

## Restored artwork export

Sharp extracts these rectangles from the 941 × 1672 reference (left, top, width,
height): Chief `(61, 360, 372, 334)`, Bombardier `(61, 759, 372, 361)`, King
`(61, 1177, 372, 364)`. Each is resized with nearest-neighbour to fit within
384 × 384, keeping its aspect ratio with `#1c2b3a` padding. Composite the three
panels left-to-right, save the source PNG, then encode WebP as above. The inset
crops exclude the old menu frame and labels. No runtime scripts or image requests
are added; the shared atlas retains the existing loading path.

The original style-edit direction was to preserve the first mockup's layout and
boss identities while matching Tiny Swords: compact proportions, deliberate pixel
clusters, broad solid shading, simplified burgundy goblins and quiet slate caves.
The Chief retains his banded wooden club; the Bombardier has goggles, bomb and
cannon cart; the King sits on a throne on the armoured toad with red banners.

## Previous detailed covers prompt (superseded)

Use case: precise-object-edit. Create a production game illustration atlas from the attached approved Goblin Cave menu. Input is the approved art and character identity reference. Output ONE horizontal strip of THREE exactly equal square panels, edge to edge, total aspect ratio 3:1, preferably 1536x512. No gaps, no frames, no text, no UI. Each square contains ONE illustrated boss in its cave, matching the corresponding left-hand artwork of the three cards in the reference as closely as possible, with full character silhouette visible and quiet navy cave scenery, small warm torch accents. Panel 1 left: green goblin chief with long nose, tusks, burgundy hood with bone clasp, small dark metal pauldron, leather belt, boots and wooden barrel-shaped club. Panel 2 center: green goblin bombardier with brass goggles, burgundy hood, holding a lit black bomb while riding his massive iron cannon on a wooden wheeled cart. Panel 3 right: crowned goblin king holding a sceptre, seated on a wooden throne between two burgundy banners on an enormous olive-green armored toad. Preserve the beautiful detailed stylized fantasy illustrations of the FIRST supplied approved menu, bold dark outlines, cel-like broad painted shading, muted palette, readable friendly villain shapes; do not reduce to coarse pixel sprites, do not create 3D renders or realism. Characters fill most of each square but with safe breathing room around head, feet, weapon and mount. Every panel has a full-bleed cave background. Do not include any lettering, reward icons or menu border. This single atlas will be displayed one square at a time in compact mobile menu cards.

## Cave icon prompt

Production mobile game UI icon, a single small cave entrance isolated on a truly transparent background, square canvas. Match the cave entrance in the supplied approved dungeon menu: squat arched pile of chunky dark blue-grey stone, deep navy opening, one tiny warm orange torch on each side inside, a few olive moss tufts at the base, no outer border. Detailed but readable fantasy game illustration with bold colored outlines, muted palette, cel shading, similar Tiny Swords UI. Center the complete entrance, filling 88 percent of canvas, no text, no extra scene, no shadow outside the base. This is a small 40-64 CSS pixel navigation icon, simple readable silhouette.
