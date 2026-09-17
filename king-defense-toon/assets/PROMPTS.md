# Cartoon guard assets — flat-style history

Current volumetric artwork is documented in [ROYAL-TOY-V1.md](ROYAL-TOY-V1.md). The files below are retained from the previous flat cartoon direction.

Built-in image_gen was used for the map and character atlas, with the user's two BroForge screenshots as style references only. The formation game layout and mechanics are unchanged. Runtime assets are stored here; no runtime asset depends on the generation cache.

- `battlefield-toon.png`: flat outlined forest clearing, enemy approach at the top.
- `units-toon-infantry-v3.png`: previous flat atlas with a human male archer and an infantry swordsman wearing a closed, face-covering helmet; [revision prompt](INFANTRY-ARCHER-V3.md). Four columns (swordsman, archer, healer, king), front row and rear three-quarter row. Solid magenta is removed at load time. Earlier artwork `units-toon.png` and `units-toon-human-v2.png` is retained, with the [previous human archer revision prompt](ARCHER-HUMAN-V2.md). A first generation produced a baked checkerboard instead of alpha; a targeted edit replaced it with a chroma-key background.
- `LilitaOne-Regular.ttf`: reused from the existing Minotaur Raid prototype; bundled OFL license at `../public/LilitaOne-OFL.txt`.

## Map prompt

Use case: stylized-concept.
Asset type: actual 2D mobile formation-game background, portrait 1024x1536.
Input images: both attached images are STYLE REFERENCES ONLY. Reproduce their simple readable hand-drawn mobile RPG illustration language, NOT their interface or side-scrolling layout.
Primary request: a quiet sunlit forest clearing for a top-to-bottom defence game. The enemy entrance is at the TOP and the player's king stands at the BOTTOM. No characters yet. A broad pale warm sandy clearing occupies 80% of image width across the middle and bottom; leave this space EMPTY and calm for a five-column formation grid drawn later in code.
Style: flat cartoon digital ink art, bold dark charcoal-green outlines, rounded friendly proportions, restrained soft pastel fills, only one simple cel-shadow per object. Similar simplicity and line quality to BroForge screenshots. NOT pixel art, NOT painterly, NOT angular dark comic, NOT realistic, no lighting gradients, no texture noise.
Palette: calm sage-green meadow #a7c087, warm pale sand #e6d2a5, subdued teal-green pines, charcoal outlines #263a36, pale grey stones. Clear pale ground to contrast with dark outlines of units later.
Composition: top-down with slight 3/4 tilt, consistent scale across whole map, no sky or horizon. Small ruined round stone arch at top center provides enemy entry. Few small rounded pines, mossy stones, bushes near far left/right edges only. Two tiny blue pennants along bottom edges, no text. Small pebbles and grass tufts sparse. All edges simple and clean, open negative space down the entire middle. Bottom center EMPTY for king.
Constraints: ONLY background. No characters, unit silhouettes, UI, text, game grid, cards, frames, numbers, health bars, weapons, logo or watermark. Keep total detail low like the reference game background. Broad empty playable space, no large foreground objects.

## Character atlas prompt

Use case: stylized-concept.
Asset type: production 2D character sprite atlas, 1536x1024 landscape. Four columns by two rows, EIGHT clearly separate complete figures.
Input images: attached BroForge screenshots are STYLE references, especially small companions characters in the first image. Match their charming hand-drawn outlined cartoon RPG art, NOT their interface or exact characters.
Layout STRICT: each of 4 columns is 384px wide and each of 2 rows is 512px tall. Center one complete full-body figure inside EACH cell. Leave generous completely empty margin at least 40px on all sides INSIDE each cell. No weapon/cloak/hat may extend into adjacent cell. All figures including weapons fully visible. Same relative size. Transparent background with real alpha, no floor shadows and no checkerboard pattern.
Characters in order left-to-right:
1 SWORDSMAN: sturdy young male knight, visible face and brown moustache under rounded silver helmet with small red plume, steel shoulder plates, blue tunic, tan belt, boots, short broad steel sword in right hand and compact round blue shield in left. Readable separate legs, shield and weapon.
2 ARCHER: nimble red-haired female ranger with long tied-back ponytail, pointed ears optional, green tunic, brown boots and gloves, leather quiver, simple curved wooden bow. Expressive confident face.
3 HEALER: dark-skinned female human healer, cream robe with teal edging, dark curly hair and small cream hood, wooden staff with rounded sage-green gem, pouch belt, friendly focused face. Robe silhouette distinct.
4 KING: stocky middle-aged king, warm face, brown beard, large gold three-point crown, burgundy royal tunic with cream fur collar, blue cape, boots, sheathed sword and gold buckle. Crown clearly identifies him.
Top row: front three-quarter views facing slightly right, show face and equipment, for recruitment menu.
Bottom row: SAME EXACT FOUR characters in SAME column order, but rear three-quarter views looking UP THE SCREEN toward arriving enemies. Clearly show matching back of helmet, hair, quiver, cape. Same equipment, no swapping characters.
Art direction: compact about 3 to 3.5 heads tall, slightly oversized expressive heads, sturdy readable hands and boots. Thick consistent dark green-charcoal contours and fine internal ink lines only where equipment needs them. Rounded forms and simple flat cel shading. Soft natural palette, red hair/blue tunic/teal robe/royal red readable class accents. Small-scale game sprites, not a concept painting. Do NOT make elongated realistic bodies, no dramatic muscles. NOT pixel art, NOT gritty angular comic, NOT 3D, no gradients, no glows, no busy ornament.
Constraints: real transparent background, no text, labels, numerals, borders, UI, watermarks or shadows. Entire heads, sword, shield, bow, staff, capes, feet inside their respective cells, equally sized front/rear pair.

## Final background correction

Edit target: the attached 1536x1024 sprite atlas.
Precise-object-edit: replace ONLY the gray-and-white CHECKERBOARD background with a perfectly flat solid pure magenta RGB(255,0,255), hex #FF00FF chroma-key background. This is a production game asset whose engine removes magenta. No checkerboard, no transparency simulation, no gray squares, no gradients or shadow on the background. All space around AND between and inside openings of bows/arms/weapons must be magenta.
Keep all EIGHT cartoon characters EXACTLY unchanged in design, color, equipment, pose, position, size, proportions, detail, faces, outlines. Preserve original1536x1024 resolution and4column2row arrangement. Do not add anything, no text/borders/labels. Flat solid #FF00FF only replaces existing checkerboard; NOTHING ELSE changes.
