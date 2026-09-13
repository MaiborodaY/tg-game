# Companion talent art

Created with the built-in imagegen tool from the approved Forest Forge talent mockup. The browser draws the frame, connections, counters and buttons independently of the artwork.

- Background: `assets/talents/druid-grove.webp`, 768 × 1152.
- Icon atlas: `assets/talents/druid-icons.webp`, 1024 × 1024, four columns and four rows. Index order matches `DRUID_TALENTS` in `game.mjs`.

## Background prompt

Extract/reconstruct ONLY the dark green forest grove background illustration behind the talent icons in the reference. Asset for the same game, faithful exact art style and palette. Portrait 2:3. Full bleed illustration: large arching dark trees, foliage leaves framing sides, exposed roots flowing toward bottom, softly lit clearing in center. Desaturated deep teal forest greens, low contrast to support overlay UI. Remove ALL UI, icons, symbols, arrows, labels, numbers, borders, ranks, buttons, character, HUD, cream frame. Reconstruct the scenery where UI covered it. No text, no icon, no frame. Flat hand-painted cartoon with subtly textured brush shapes, same approved original scene. Standalone production background image.

## Icon atlas prompt

Production game UI icon atlas, square image 1024x1024. Reproduce the SIXTEEN talent illustrations from reference extremely faithfully as clean standalone icon tiles in EXACT 4 by 4 grid. Each tile precisely one quarter width and height. NO margins or gutters; each square tile full bleed solid deep dark forest green #163c30 background. No borders, no outer frames, no arrows, no labels, no text or rank numbers whatsoever. Within each square the illustration centered, fills about 78% width and 78% height with safe margins. Same bold charcoal outlines and vibrant chunky hand-painted cartoon forms as approved reference. All icons fully colored even those gray in reference. Left to right top to bottom: row1 open hand holding healing leaf with plus signs, healing herbs three leaves, leaf beside sand hourglass, red heart with brown roots; row2 green leaf with red healing cross, brown shield containing green leaf, white healing flower with green plus signs, oak bark shield; row3 golden leaf with small sword blessing, budding spring branch, crescent moon with leaf, glowing sap droplet; row4 thick layered oak bark, evergreen leafy sprout, luminous green heart with ivory wings, flowering grove/tree pink blossoms (ultimate). Exactly 16 even square tiles, with visible tile edge color consistent, suitable direct CSS spritesheet with background-size 400% 400%. No UI or scenery around grid.

## Archer icons

Swift String uses the approved standalone `assets/talents/archer-swift-string.webp` (512 × 512, WebP quality 92), generated with built-in imagegen from `exec-87f11ee2-c39b-4332-a84e-41d1d4df2531.png`. True Shot uses atlas cell 2, the original Swift String bow. The standalone icon overrides both the tree node and detail preview.

Swift String edit prompt: Edit the three ivory and pale-gold wind strokes into a swift arrow inside a rotated whirlwind. Reorient the whirlwind axis horizontally left to right. Insert one wooden arrow through its center, pointing right, with a visible silver triangular arrowhead and white fletching. Wind arcs wrap around the shaft with front/back overlaps. Keep the chunky dark outlines and painted cartoon style, a compact silhouette readable at 40px, safe margins and a deep forest green background. No text, UI, glow or extra arrows.

Created with the built-in imagegen tool, then normalized to 1024 × 1024 WebP (quality 92). Final asset: `assets/talents/archer-icons.webp`. Index order matches `ARCHER_TALENTS`. The tree reuses the existing grove background.

Approved mockup source: `exec-fa59658a-7e67-461e-837a-5ce9d1d1bea0.png`.
Atlas source: `exec-3b2977b5-3654-4d6e-bfec-a0958733ef9d.png`.
Final corrected source: `exec-22fb8579-db9f-41bc-a8e4-2956696d1f04.png`.
Sources were generated under `C:/Users/Waldiris/.codex/generated_images/01a090b0-4ec2-7902-b960-a05abd44f255/`.

### Atlas prompt

Production game UI icon atlas. Recreate the sixteen archer talent illustrations from the approved reference in EXACT 4 by 4 grid, equal square cells, full bleed 1024x1024. No margins or gutters. Each cell has a uniform deep dark forest green background #163c30. NO borders, frames, badges, numbers, text, UI connections or outside scenery. Icons centered and occupy 78% of each cell, with generous safe margins. Preserve the approved Forest Forge bold charcoal outlines, clean chunky hand painted cartoon fantasy art and bright steel, warm wood and golden arrow trails. All icons fully colored (even those gray in reference). Row1 left to right: wooden bow with single arrow; sharp polished steel arrowhead; taut bowstring and three speed streaks; keen green eye in golden crosshair. Row2: two parallel gold arrows; arrow piercing red bullseye; a rain of four downward arrows; one huge horizontal glowing arrow piercing three dark goblin silhouettes. Row3: arrow hitting skull; cracked red marked target; small sand hourglass with a brown feather; dense shower of golden arrows. Row4: heavy thick arrow shaft with broad steel head; leather quiver full of arrows; eagle head with fierce golden eye; a rapid luminous stream of arrows. Exact four columns and four rows suitable CSS background-size 400% 400%. These are standalone assets for same game, use reference icons faithfully. No portrait or letters.

### Readability correction prompt

Edit this 4x4 talent icon atlas precisely. Change ONLY the TOP ROW THIRD CELL (bow with confusing green streaks). Replace that illustration with a clean easily readable wooden bow held vertically, taut string drawn back with ONE single nocked arrow pointing right, simple recognizable silhouette, no green glow, no streaks, no multiple arrows. Keep its uniform deep green background. Match bold dark outlines and cartoon painted style of rest of atlas. ALL OTHER FIFTEEN CELLS UNCHANGED. Preserve exact square atlas layout, equal 4 columns and 4 rows, no gutters no text no borders.

## Turtle talent tree — 2026-09-14
Approved mockup: exec-37dee924-249f-4405-86c5-3205e0491771.png. Built-in image_gen used for two assets, no CLI.
Background source: C:/Users/Waldiris/.codex/generated_images/01a090b0-4ec2-7902-b960-a05abd44f255/exec-ec37ccd7-505f-4439-9b1f-8fc64b567c25.png
Prompt: Recreate the reference talent-tree pond as a full-bleed painted dark teal mossy forest pond, lily pads, reeds, rocks, roots and upper-right waterfall. No UI, icons, text or characters. Quiet center.
Atlas source: C:/Users/Waldiris/.codex/generated_images/01a090b0-4ec2-7902-b960-a05abd44f255/exec-215d9b1a-bf2f-4945-a774-8f5f5aa79b3c.png
Prompt: Exactly 4x4 equal cells, no gutters, borders or text; dark evergreen background. Cartoon painted turtle icons matching the approved mockup. Row-major: shell, shell heart, layered plates, healing sprout, spiky shell, cracked red shell, banner, shell slam, resting healing turtle, heavy impact, healing plus shell, stun stars, hourglass shell, fortress shell, shockwave shell, decorative footprint.
Outputs: assets/talents/turtle-pond.webp (640x880), assets/talents/turtle-icons.webp (1024x1024). Atlas cell 15 is spare; the agreed tree has 15 talents.

## Archer autumn background — 2026-09-14
Built-in image_gen. Source: C:/Users/Waldiris/.codex/generated_images/01a090b0-4ec2-7902-b960-a05abd44f255/exec-2c86c700-7775-452f-8c41-64ea58aa6c1c.png
Prompt: Portrait hand-painted cartoon fantasy autumn hunting trail; tall trees, copper-gold foliage at edges, roots and mossy stones, mist and distant wooden ranger lookout. Quiet dark olive-teal center for readable talent icons. No characters, UI, icons, text or borders.
Output: assets/talents/archer-autumn.webp, 640x880 WebP.
