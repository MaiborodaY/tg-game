# Запросы генерации

Метод: встроенный `imagegen`. Исходные PNG сохранены без изменений. WebP и превью экспортируются через Sharp, без программной перерисовки.

## Атлас: первый запрос

Референс: [утверждённый концепт](crypt-king-concept.png). Первый результат потребовал увеличения промежутков между кадрами; он не используется как готовый атлас.

```text
Use case: stylized-concept / production sprite animation.
Asset type: transparent RGBA sprite atlas for BroTD Infinity, exactly 16 full-body poses in a 4-column by 4-row grid.
Reference image 1: APPROVED CRYPT KING concept, character identity and pixel-art style reference only. Remove the entire graveyard background and ground shadow.

Recreate this exact boss in every pose: colossal hunched ash-blue-grey royal revenant with massively broad torso, huge arms, short powerful legs, bare feet, bald stern heavy-jawed fleshy face, tiny violet eyes, small broken bronze crown, ivory old linen bandages, ragged dark-plum mantle and waistcloth, bronze skull belt buckle. A huge upright cracked grey STONE SARCOPHAGUS is tightly chained to his BACK, behind the shoulders, its peaked top above the head, simple skull carving and restrained violet crack. It stays attached and tilts with the torso. One gigantic hollow bronze funeral BELL with chipped flared rim and violet crack is held by its TOP LOOP in his anatomical RIGHT hand. The opposite hand is a huge EMPTY fist. In the frontal row the bell is on viewer LEFT. No hands swapping equipment. No extra limbs, no replacing bell with hammer or mace.

Style: readable charming dark fantasy game pixel art, crisp stepped dark navy outline, broad pixel clusters and simple 2-3-tone shading. Simplify the concept's tiny surface decoration to fit small mobile sprites. Preserve the thick creature, large bell, coffin and crown silhouette. No painted backdrop, no gradients in background, no labels or text.

Layout: one square atlas, exactly 4 equal columns and 4 equal rows, read left to right, top to bottom. Each of the 16 frames contains exactly one COMPLETE Crypt King including the ENTIRE coffin, crown, both feet, arms and bell. Give very generous transparent gutters. Center each pose in its cell. Same body size and proportions in all frames; the largest action silhouette must fit within the central 80 percent of its cell width and height. All rows share the same pixel scale. Feet on a consistent row baseline except natural walk bob. Never cross a cell boundary or overlap another character. No visible grid lines.

ROW 1 — IDLE RIGHT: four subtle loop poses, three-quarter side view facing screen RIGHT. Bell hanging low from right hand, left empty fist forward. Calm heavy breathing: neutral, small rise, neutral, small dip. Heavy coffin settles with shoulders.
ROW 2 — WALK RIGHT: four clearly DIFFERENT sequential heavy lumbering walk poses facing screen RIGHT, legs alternate: right foot forward/left back, passing pose, left foot forward/right back, passing pose. Slight torso bob and bell swing while keeping exact anatomy.
ROW 3 — BELL SLAM RIGHT: four clear sequential attack poses facing screen RIGHT. Frame 1 anticipates/crouches with bell low. Frame 2 raises the bell in the right hand up and forward in a big readable wind-up, enough room for the full bell. Frame 3 is IMPACT: the bell's flared rim hits near the ground ahead toward screen RIGHT, torso lunges and right arm extended down/forward; bell still firmly grasped by its top loop. Frame 4 recoils and begins lifting bell back. Empty left fist balances the weight. Keep coffin chained to back and complete.
ROW 4 — BELL SLAM DOWN: four sequential attack poses FACING CAMERA/screen DOWN with feet visible, same attack: anticipation, bell raised at viewer LEFT in right hand, IMPACT with bell slammed down forward at viewer LEFT, recovery. Preserve the anatomical right hand on viewer LEFT throughout. No hand swap or pose mirroring between frames.

No detached weapon, no separate effects, no shockwave, no dust, no debris, no shadow puddle. Real alpha transparency in all negative space including gaps between legs, arms, bell and body. No checkerboard painted into pixels, no colored background. Entire grid with generous outer margins. Export one transparent square PNG sprite sheet, not an illustration, no extra reference panels.
```

## Атлас: увеличение отступов — итоговый результат

Референс: первый сгенерированный атлас. Этот запрос уменьшил позы внутри ячеек; итоговый PNG сохранён как `crypt-king-source.png`.

```text
Use case: precise-object-edit / sprite sheet layout correction.
Edit reference image 1, an existing transparent 4 by 4 sprite atlas. KEEP ALL 16 existing Crypt King poses and their identities, colors, equipment, camera views, pixel style, row order and attack choreography. No redesign or new poses.
The ONLY change: make each of the 16 complete sprite silhouettes SMALLER by a uniform factor of 0.72 in both dimensions, and center each entire scaled pose inside its own equal square grid cell, leaving wide transparent gutters on ALL four sides. Keep the same square canvas and 4 columns / 4 rows. All sprites retain the same consistent body scale relative to one another.
Every pose including outstretched bell, sarcophagus, hands, crown, and both feet must sit comfortably INSIDE its own cell. Especially row 3 column 3: the entire bell at the end of the outstretched right arm must be inside that cell, with a wide empty gap before row 3 column 4. No clipping, intersections, overlapping bounding boxes, or pixels on cell borders. Do not add empty rows or change the total number of frames: exactly 16 characters.
Preserve that the anatomical RIGHT hand grips the bell in all 16 poses and LEFT hand is empty. Preserve all coffin chains and full-body proportions. The frontal attack in row4 has bell on viewer LEFT. Preserve first row idle, second row walking, third row attack right, fourth row attack down.
Keep real alpha transparency in all empty areas; no opaque background or painted checkerboard, no ground shadows, no effects, no annotations, no visible grid lines, no labels. Crisp stepped pixel clusters, sharp outlines, no blur. One complete square transparent PNG atlas with much more generous spacing than the reference.
```

## Утверждённый концепт

Референсы: [концепт гуля](../../concepts/ghoul-v1.png) — стиль и камера; [карта кладбища](../../maps/forgotten-graveyard/forgotten-graveyard-source.png) — окружение.

```text
Use case: stylized-concept / character variation.
Asset type: ONE preview concept illustration for the FINAL BOSS of level two of BroTD Infinity. Not an animation atlas.
Input image 1 is the character-illustration edit target and pixel-art style reference: the existing ghoul. Replace its creature completely with a new unique final boss called THE CRYPT KING. Preserve the square full-body character-presentation framing, slightly elevated three-quarter game camera, crisp chunky dark-navy stepped outlines and restrained pixel clusters of this illustration.
Input image 2 is the APPROVED UNDEAD MAP, used only for the background setting and environment colors. Adapt the scene behind the boss to its pale dusty grey-brown cemetery earth, dead trees, crooked iron fence, small gravestones, cobwebs, muted plum vegetation and dim violet spirit lights. Do not copy the entire long portrait map into this square illustration. A simple close section of this graveyard, secondary to the character, with no interface.
Primary subject: a gigantic hunched royal revenant, the ancient buried ruler risen as a heavy grave colossus. Enormously broad stooped shoulders and chest, thick barrel-shaped torso, heavy muscular short legs, gigantic forearms and broad hands. Ashen desaturated blue-grey mummified flesh with a few large old-ivory linen wraps, no exposed viscera or realistic gore. Its face is stern and ancient with a heavy rectangular jaw, dark recessed eyes glowing pale violet, a small broken tarnished bronze crown embedded crookedly on its bald head. The face is fleshy and mummified, not a bare skeleton skull and not the smiling ordinary ghoul's face. A torn deep-plum royal funeral mantle and waistcloth, simple broad shapes. No full suit of knight armor.
Two unmistakable signature forms make the boss distinct and readable at small mobile scale:
1) A massive upright stone SARCOPHAGUS carried and tightly chained against its back, rising visibly above and behind its shoulders. Rectangular coffin-shaped slab with a peaked top, cracked grey stone, restrained simple carving and one broad violet-lit crack. Its weight explains the stoop. Thick short iron bindings wrap over the shoulders and around the coffin; the attachment must be physically clear. No miniature castle, towers or many fiddly ornaments.
2) A huge old FUNERAL BELL as a blunt weapon in its anatomical RIGHT hand, visibly grasped by the bell's sturdy top loop, hanging low at its side toward viewer LEFT. The bell is nearly the size of its torso, dull bronze with a chipped flared rim, a deep visible crack and a restrained violet glow inside. A recognisable hollow bell, not a hammer, cup, shield, flail or spiked mace. Its other hand is empty, hanging forward as a heavy clenched fist on viewer RIGHT.
Exactly one complete creature with two arms, two legs, one carried sarcophagus and one bell. Wide grounded stance, threatening final-boss presence. More than twice ordinary troop mass; scale conveyed by architecture and small gravestones in the surroundings. All feet, crown, sarcophagus top and the full bell are comfortably inside the frame with margins. Three-quarter frontal pose slightly facing right, ready to advance slowly. Soft ground contact shadow.
Match the game's charming stylized retro fantasy pixel art, simplified 2-3-tone shading, chunky shapes and limited palette. Make it imposing through its weight and unusual silhouette, not excessive surface ornament. Avoid photorealism, painterly softness, smooth vector rendering, neon bloom, noisy details, flowing particle clouds, UI, captions, text, watermarks, grids, extra figures or comparisons. Preview illustration only.
```
