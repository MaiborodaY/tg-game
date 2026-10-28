# Tiny Swords-style goblin chief

Custom generated artwork, not an original Pixel Frog asset. Created with built-in image generation, using the native red Torch sheet and our generated goblin archer as visual references. No CLI/API fallback.

Source: `tiny-goblin-chief-red-v1.png`, unchanged transparent 1254 x 1254 PNG. Runtime: `web/goblin-chief.webp`, lossless same-size export via `../scripts/prepare-goblin-art.mjs`. Original output: `C:/Users/mrmay/.codex/generated_images/01a0a042-20a3-70b1-8f12-d5a1c5bfb3a1/exec-267919bd-3ead-44cd-b59b-4fbe947e9f21.png`.

Hefty red goblin chief with leather harness, shoulder plate, tusks and a wooden club. Four idle, four walk, four side strikes and four down strikes. Body renders at 52 logical pixels; impact frame 2 begins at 0.98s, matching the existing chief damage.

The 4x4 source uses measured feet anchors and a fixed scale rather than automatic per-frame sizing. Chief rectangles isolate club poses that cross generated cell boundaries. No runtime alpha scanning. Left-facing poses mirror the side row; targets above use side-view attacks because the sheets do not contain back-view attacks. No death sequence was generated; existing fade remains.

HP, damage, rewards, spawn schedules and saves are unchanged. Both generated goblins replace the earlier specialist atlas in the runtime; the old source and export are retained for reference. Module/frame checks and production build are used for validation. In-battle/browser checking is deliberately omitted at the user's request; gameplay feedback is pending.

## Built-in generation prompt

Use case: stylized-concept.
Asset type: production transparent PNG sprite sheet for the Canvas2D mobile tower-defense game BroTD Infinity.
Image1 is ONLY a STYLE reference: the actual red Torch goblin from Pixel Frog Tiny Swords. Match his muted palette, chunky pixel clusters, green nose, enormous ears, dark blue-black outline, red cloth and small 2D game proportions. Image2 is our newly generated goblin ARCHER from that same faction, a second style and consistent-sheet reference. Create a NEW GOBLIN MINI-BOSS chief, NOT another archer. He must belong to the same army, be wider and 30percent taller than an ordinary goblin at gameplay size.
Character: hefty green goblin chief with a large angular green nose, two small ivory lower tusks, broad shoulders, pointed ears; torn dull burgundy hood with one small ivory bone pin, brown leather chest harness and a single simple grey iron shoulder plate. Red waist cloth, broad brown belt, short strong legs and dark boots. Bare green muscular forearms. ONE BIG WOODEN WAR CLUB with two dull iron bands, always held in his RIGHT hand. Left hand is empty, clenched. No bow, no quiver, no torch, no human identity, no gold crown, no shield. Tough and slightly comical. A clearly readable 52-pixel-tall game enemy, NOT a large illustration.
Style: true low-resolution 2D pixel game sprites with a small controlled palette and flat 2-3tone shading. Exact family resemblance to the supplied Tiny Swords goblins. No realistic skin, soft brushwork, glossy 3D, fine decorative detail or glow.
Output one square1024x1024 transparent sheet, STRICT FOUR equal columns by FOUR equal rows, sixteen 256x256 cells. Complete isolated character in each cell, same anatomy and body scale. Feet centered at localx128 and baseliney215 in every cell, hood-to-feetbodyheight140, club must remain entirely inside each cell with16pixel margins even when raised. Wide transparent gutters, no cell overlaps. NO cast shadows and NO environment.
ROW1: four subtle IDLE poses facing RIGHT, threequarter side view, club held low/diagonal, breathing with feet planted.
ROW2: four WALK RIGHT poses with genuinely alternating left/right steps, restrained torso sway, club carried, same ground level; no hopping.
ROW3: four ATTACK RIGHT frames:1 anticipation bending knees with club lifted halfway;2 full windup club raised OVERHEAD;3 strong DOWNWARD club smash in front of him toward RIGHT, club head near ground (this is IMPACT, localframe2);4 recover with club low. Same right hand and same club, left empty.
ROW4: four ATTACK DOWN frames facing viewer, aimed toward BOTTOM of sheet:1 anticipation;2 overhead windup;3 heavy DOWNWARD smash in front of body toward bottom, impact at localframe2;4 recover. Club in same anatomical right hand throughout.
Actual transparent alpha background, no checkerboard, white or colored background. No labels, text, numbers, UI, border, smoke, flashes, separate projectiles or big effects. Consistent grounded feet, sharp clean pixel silhouettes.
