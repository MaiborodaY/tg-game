# Druid talent art

Created with the built-in imagegen tool from the approved Forest Forge talent mockup. The browser draws the frame, connections, counters and buttons independently of the artwork.

- Background: `assets/talents/druid-grove.webp`, 768 × 1152.
- Icon atlas: `assets/talents/druid-icons.webp`, 1024 × 1024, four columns and four rows. Index order matches `DRUID_TALENTS` in `game.mjs`.

## Background prompt

Extract/reconstruct ONLY the dark green forest grove background illustration behind the talent icons in the reference. Asset for the same game, faithful exact art style and palette. Portrait 2:3. Full bleed illustration: large arching dark trees, foliage leaves framing sides, exposed roots flowing toward bottom, softly lit clearing in center. Desaturated deep teal forest greens, low contrast to support overlay UI. Remove ALL UI, icons, symbols, arrows, labels, numbers, borders, ranks, buttons, character, HUD, cream frame. Reconstruct the scenery where UI covered it. No text, no icon, no frame. Flat hand-painted cartoon with subtly textured brush shapes, same approved original scene. Standalone production background image.

## Icon atlas prompt

Production game UI icon atlas, square image 1024x1024. Reproduce the SIXTEEN talent illustrations from reference extremely faithfully as clean standalone icon tiles in EXACT 4 by 4 grid. Each tile precisely one quarter width and height. NO margins or gutters; each square tile full bleed solid deep dark forest green #163c30 background. No borders, no outer frames, no arrows, no labels, no text or rank numbers whatsoever. Within each square the illustration centered, fills about 78% width and 78% height with safe margins. Same bold charcoal outlines and vibrant chunky hand-painted cartoon forms as approved reference. All icons fully colored even those gray in reference. Left to right top to bottom: row1 open hand holding healing leaf with plus signs, healing herbs three leaves, leaf beside sand hourglass, red heart with brown roots; row2 green leaf with red healing cross, brown shield containing green leaf, white healing flower with green plus signs, oak bark shield; row3 golden leaf with small sword blessing, budding spring branch, crescent moon with leaf, glowing sap droplet; row4 thick layered oak bark, evergreen leafy sprout, luminous green heart with ivory wings, flowering grove/tree pink blossoms (ultimate). Exactly 16 even square tiles, with visible tile edge color consistent, suitable direct CSS spritesheet with background-size 400% 400%. No UI or scenery around grid.
