# Tiny Swords-style goblin archer

Custom generated artwork, not an original Pixel Frog asset. Created with built-in image generation, using the native red Torch sheet and the native blue archer as visual references. No CLI/API fallback.

Source: `tiny-goblin-archer-red-v1.png`, unchanged transparent 1254 x 1254 PNG. Runtime: `web/goblin-archer.webp`, lossless same-size export via `../scripts/prepare-goblin-art.mjs`. Original output: `C:/Users/mrmay/.codex/generated_images/01a0a042-20a3-70b1-8f12-d5a1c5bfb3a1/exec-2db8d2db-f293-4259-9777-de92f7741e1c.png`.

Red goblin archer with a wooden bow and quiver. Four idle, four walk, four side shots and four down shots. Body renders at 40 logical pixels; release frame 2 follows the engine impact time.

The 4x4 source uses measured feet anchors and a fixed scale rather than automatic per-frame sizing. Chief rectangles isolate club poses that cross generated cell boundaries. No runtime alpha scanning. Left-facing poses mirror the side row; targets above use side-view attacks because the sheets do not contain back-view attacks. No death sequence was generated; existing fade remains.

HP, damage, rewards, spawn schedules and saves are unchanged. Both generated goblins replace the earlier specialist atlas in the runtime; the old source and export are retained for reference. Module/frame checks and production build are used for validation. In-battle/browser checking is deliberately omitted at the user's request; gameplay feedback is pending.

## Built-in generation prompt

Use case: stylized-concept.
Asset type: production transparent PNG animation sprite sheet for the Canvas2D mobile game BroTD Infinity.
References: image1 is the ACTUAL red Torch goblin from Pixel Frog Tiny Swords, the exact character design, palette, proportions, pixel cluster size, pointed red hood, green skin, dark outline to match. Image2 is the ACTUAL blue Tiny Swords archer sheet, ONLY a reference for bow aiming, walking and small native game sprite proportions. Do NOT copy its human identity or blue uniform.
Create ONE green GOBLIN ARCHER belonging to exactly the same faction as the Torch goblin. Same small squat torso, enormous pointed ears sticking out of a soft dull burgundy pointed hood, funny long green nose, short legs and dark brown shoes. Dull red wrap tunic, simple brown belt and wrist wraps. A clearly visible curved WOODEN BOW held in his LEFT hand, RIGHT hand draws the string, simple brown quiver with two ivory arrow tips on back. NO torch, flame, sword, axe, armor, human face, giant muscles or shield.
Artwork must be authentic small 2D GAME PIXEL ART, as if authored in a roughly 48x48 or 64x64 pixel area and enlarged with nearest-neighbor, chunky discrete pixel clusters, very limited colors, flat few-tone shadows and dark blue-black outline, matching Tiny Swords reference sprites. NOT a glossy render, illustration, fine painterly texture or realistic surface. All poses same anatomy, head size, clothing and bow. Small grumpy expression, readable game silhouette.
Sheet layout: EXACTLY FOUR equal columns by FOUR equal rows, square 1024x1024 canvas, sixteen separate 256x256 cells. One complete full-body pose centered in each cell. Every character has consistent body HEIGHT about128 pixels from hood top to feet, centered at localx128; feet on localy200 baseline in EVERY CELL, no frame touching any adjacent cell, wide transparent gutters. All bows/arrows/hands entirely within own cell.
ROW1 cells1-4: FOUR subtle idle poses facing RIGHT and a little toward viewer; bow lowered forward, right hand resting near waist. Just tiny breathing movement, both feet planted. NO mirrored poses.
ROW2 cells1-4: FOUR looping WALK RIGHT poses with restrained alternating leg stride: left foot forward, passing pose, right foot forward, passing pose. Same trunk height, slight knee bend, genuinely alternate legs rather than hopping, bow carried low in left hand, no aim during walking.
ROW3 cells1-4: FOUR SHOOT RIGHT poses aimed horizontally to the RIGHT: 1 raise bow and nock arrow; 2 draw bowstring to cheek while left arm extends right; 3 RELEASE arrow with string relaxed and right hand following back near cheek; 4 lower bow/recovery. Arrow only nocked in1and2, no detached projectile outside sprite. Same hands throughout.
ROW4 cells1-4: FOUR SHOOT DOWN poses aimed toward BOTTOM of sheet, front view slightly above: 1 nock/raise; 2 draw taut bowstring back; 3 RELEASE toward viewer/bottom, right hand follows back; 4 recover/lower. Recognizably the SAME goblin, no back view in this row.
Require ACTUAL TRANSPARENT background with alpha. No white, checkerboard or colored background, no scenery, no cell outlines, no labels, no text, no numbers, no FX, no shadows. Crisp fully visible silhouettes and CONSISTENT GROUNDED FEET.
