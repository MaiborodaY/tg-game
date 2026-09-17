# Volumetric toy-fantasy art

The map `battlefield-royale-v1.png` remains current. The character atlas below is retained as history and has been superseded by `units-royale-guard-v2.png`; see [ROYAL-GUARD-V2.md](ROYAL-GUARD-V2.md) for the shared infantry-inspired outfits and current character prompt.

Created with the built-in image_gen tool. Existing original characters and map supplied layout and identity references. New rendering follows the user's requested Clash Royale-inspired volumetric cartoon direction. There are no imported Supercell game assets.

## Runtime assets

- `units-royale-v1.png` — 1536×1024, four columns by two rows. Columns: closed-helmet infantryman, human male archer, dark-skinned human healer, king. Top row front three-quarter for cards, bottom rear three-quarter for the battlefield. The existing runtime removes solid magenta.
- `battlefield-royale-v1.png` — 1024×1536, quiet sculpted forest clearing and enemy entrance above. Rendered proportionally with top-anchored cropping.

The current formation save and all mechanics are unchanged. Older image files remain in assets. Pre-change scene, index and CSS snapshots are in `../design-archive/` for restoring the former flat style; these are source backups, not a separate runnable preview.

## Exact character prompt

Use case: style-transfer.
Edit target: attached 1536x1024 unit atlas. Transform its flat outlined 2D illustrations into polished STYLIZED 3D CARTOON GAME CHARACTERS in the visual spirit of Clash Royale: chunky, sculpted, volumetric, appealing toy-like fantasy figures with strong silhouettes, simplified hand-painted materials, large heads/hands/boots/weapons, soft bevels, clear light and shade. The attached image is a reference for character identities, equipment, poses, exact layout, and background key — NOT the flat ink rendering style.
RENDERING: tangible rounded three-dimensional forms, soft directional upper-left key light, ambient occlusion only within each character's forms, broad controlled highlights on steel, subtle satin fabric, clean shadow planes. Strong depth. Eliminate drawn black contour strokes and internal comic line art; silhouettes separated by material value and edge shading. NO pixel art, no 2D cel outlined sticker look, no photoreal texture, no gritty realism, no neon, no excessive shiny plastic. Polished mobile 3D pre-render sprites, not an illustration with a tiny gradient.
Preserve four original character types, order and color identities:
Column1 HUMAN INFANTRYMAN: broad plain closed steel helmet with lowered faceplate and dark narrow horizontal eye slit, no face visible, no hair or plume; steel shoulders and gauntlets, chainmail at neck, blue surcoat, brown belt and boots, chunky steel sword in right hand, round blue shield in left hand. Mass and armor volume should read at tiny size.
Column2 HUMAN MALE ARCHER: adult man, short brown hair, strong brow, small round HUMAN ears, short brown beard, olive tunic and hood resting behind neck, brown leather vest/bracers/boots, wooden bow and quiver. NO female character, no braid, no long hair, no elf ears. Keep adult male face.
Column3 HUMAN HEALER: dark brown skin, dark curly hair, cream hooded robe with teal trim and gold clasp, staff with a round green orb, belt pouch. Human rounded ears, compassionate face.
Column4 KING: stocky human man, gold crown, brown beard, burgundy tunic, blue cape and cream fur collar, boots and gold belt. King recognizably royal.
STRICT ATLAS LAYOUT: four equal384px columns × two equal512px rows. Exactly eight full figures. Top row front three-quarter view, bottom row same exact figures and equipment from rear three-quarter facing upscreen. Entire figure INCLUDING sword/bow/staff/crown/cape and feet fully inside each cell with clear margin, no overlap. Keep3-to3.5-head-tall proportions. Similar height across figures, royal king slightly broader.
BACKGROUND: keep perfectly FLAT SOLID PURE MAGENTA #FF00FF RGB255,0,255 everywhere around and between characters AND in gaps in bow/arms. No ground plane, no shadows outside silhouette, no checkerboard, no transparency simulation. No colored lighting spill on magenta. This flat key will be removed by the game.
Output1536x1024. No text, labels, logos, borders, UI or extra objects.

## Exact background prompt

Use case: style-transfer.
Edit target: attached portrait game background,1024x1536. Transform the outlined flat 2D forest clearing into a polished stylized 3D cartoon game arena environment in the visual spirit of Clash Royale. Preserve the existing top-to-bottom formation layout: stone arch enemy entrance at TOP CENTER, wide unobstructed ground in center and lower80%, scenery at FAR SIDE EDGES, room for a king at BOTTOM CENTER. The reference provides COMPOSITION ONLY; replace its flat ink drawing language completely.
Art direction: beautiful chunky sculpted 3D diorama, soft rounded bevels, hand-painted simplified materials, pleasing substantial volume, broad soft directional shadows upper-left light, clean game-ready terrain. Soft lush grass clumps, round layered conifer trees with sculpted foliage, smooth light grey boulders, thick beveled pale limestone arch at top with moss, small blue pennants at far edges. Make the arch and trees feel like miniature solid game objects rather than outlined drawings. NO black ink outlines.
Palette: sunlit muted meadow greens, pale warm stone/sandy ground, blue pennant accents, warm creamy stone highlights and cool soft shadows. Background quieter and lower contrast than character sprites. NOT neon saturated, not photorealistic, no intricate textures. Keep terrain very simple and readable on a phone.
Camera: consistent orthographic top-down with slight three-quarter tilt approximately60degrees down; NO horizon or sky, NO perspective shrinking distant ground, NO diagonal diamond board. Portrait1024x1536.
Spatial constraints: a broad open pale sandstone/packed-earth clearing from top arch to bottom, occupying at least80% width from y350 down. Most of middle/lower clearing nearly uniform with only a few tiny sparse pebble flecks. It must fit a future5column×3row grid. Do NOT draw any grid, paving cracks suggesting cells, characters, towers, units, paths split into lanes, big foreground props, bridges or game UI. Bottom center is EMPTY for king. Top arch completely visible with small clearance from image edge. Scenery is sparse and stays near outer10%of left/right. Avoid excessive flowers/grass texture, glowing magic, sparkles, heavy effects. No logo, text, watermark or frame. Just an attractive volumetric game background.
