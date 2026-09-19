# Goblin Cave menu art

Generated with the built-in imagegen tool, using the user's approved first
dungeon menu concept as the style and character reference. These illustrations
are for menu cards only; combat sprites and boss mechanics are unchanged.

`goblin-cave-covers-source.png` is one equal-column atlas (Chief, Bombardier,
King). Runtime `assets/dungeons/goblin-cave-covers.webp` is 1536 × 512 at quality
82; CSS selects each third. `cave-icon-source.png` is exported as a transparent
128 × 128 WebP at quality 85. Sources stay out of the runtime bundle.

## Covers prompt

Use case: precise-object-edit. Create a production game illustration atlas from the attached approved Goblin Cave menu. Input is the approved art and character identity reference. Output ONE horizontal strip of THREE exactly equal square panels, edge to edge, total aspect ratio 3:1, preferably 1536x512. No gaps, no frames, no text, no UI. Each square contains ONE illustrated boss in its cave, matching the corresponding left-hand artwork of the three cards in the reference as closely as possible, with full character silhouette visible and quiet navy cave scenery, small warm torch accents. Panel 1 left: green goblin chief with long nose, tusks, burgundy hood with bone clasp, small dark metal pauldron, leather belt, boots and wooden barrel-shaped club. Panel 2 center: green goblin bombardier with brass goggles, burgundy hood, holding a lit black bomb while riding his massive iron cannon on a wooden wheeled cart. Panel 3 right: crowned goblin king holding a sceptre, seated on a wooden throne between two burgundy banners on an enormous olive-green armored toad. Preserve the beautiful detailed stylized fantasy illustrations of the FIRST supplied approved menu, bold dark outlines, cel-like broad painted shading, muted palette, readable friendly villain shapes; do not reduce to coarse pixel sprites, do not create 3D renders or realism. Characters fill most of each square but with safe breathing room around head, feet, weapon and mount. Every panel has a full-bleed cave background. Do not include any lettering, reward icons or menu border. This single atlas will be displayed one square at a time in compact mobile menu cards.

## Cave icon prompt

Production mobile game UI icon, a single small cave entrance isolated on a truly transparent background, square canvas. Match the cave entrance in the supplied approved dungeon menu: squat arched pile of chunky dark blue-grey stone, deep navy opening, one tiny warm orange torch on each side inside, a few olive moss tufts at the base, no outer border. Detailed but readable fantasy game illustration with bold colored outlines, muted palette, cel shading, similar Tiny Swords UI. Center the complete entrance, filling 88 percent of canvas, no text, no extra scene, no shadow outside the base. This is a small 40-64 CSS pixel navigation icon, simple readable silhouette.
