# Goblin archer and chief

Mode: built-in `image_gen` tool; one successful generation, no CLI/API fallback.

Asset: `goblin-specialists-v1.png` (1536 × 1024), four columns by two rows, matching `goblins-royale-wave-v1.png` as the style and camera reference. Magenta is removed by the existing runtime atlas key.

Source: `C:/Users/mrmay/.codex/generated_images/01a0a756-d57e-71d0-bc28-4dcb18d5a43d/exec-b8737616-f53d-48fd-be1e-8aa4c26e7f91.png`.

Top row: archer idle, walk, bow draw, release. Bottom row: chief idle, walk, hammer windup, downward strike. Bowman target height42, chief60, versus regular goblin42 and guard49. Render scale stays fixed across each class's poses. Feet anchors keep the chief's low hammer head from making him float.

The chief animation changes from windup to strike at the actor's engine-provided `impactFraction` (0.7). The amber marker tracks that same fraction on the single target. It is not an area attack. Chief HP is shown next to him, below the field's top controls.

Prompt:

> Use case: stylized-concept. Asset type: 4 columns by 2 rows game sprite atlas. INPUT IMAGE IS ONLY STYLE AND CAMERA REFERENCE; create TWO NEW ENEMIES in the exact same chunky, cute, polished dimensional toy-fantasy rendering. All eight figures isolated full-body with margins on perfectly UNIFORM PURE MAGENTA #FF00FF background, suitable for chromakey. Absolutely no shadows, gradient, scenery, text, grid lines or glow. Same camera: front three-quarter, slightly from above, facing viewer and a little left. TOP ROW all four cells: SAME slim GREEN GOBLIN ARCHER, long triangular ears, dark brown pointed leather cap with small RED feather, reddish-brown leather tunic and boots, visible quiver of arrows on back, WOODEN BOW held in LEFT HAND and arrow drawn with RIGHT HAND, NO SWORD, NO SHIELD. Top row left-to-right poses: (1) idle holding bow, (2) walking holding bow, (3) aiming drawn bow toward down-left with right hand drawing string beside cheek, (4) released arrow pose bow still in same left hand. BOTTOM ROW all four cells: SAME stockier GREEN GOBLIN CHIEF with very broad muscular torso, dark iron helmet with bronze crest, chunky steel shoulder plates, dark red tunic, broad brown belt, sturdy boots, one MASSIVE iron war hammer on long wooden handle gripped in BOTH HANDS, hammer head prominently visible, no shield. Bottom row left-to-right poses: (1) idle hammer at side, (2) walking with hammer, (3) big readable windup lifting hammer above shoulder ready to slam down, (4) powerful downward hammer slam follow-through with hammer head low in front. Keep each unit identity, size and equipment identical across its FOUR poses, and never mirror the hands. Chief should have strong broad silhouette unlike bowman but still same toy style. Figures centered within exactly eight separate equal grid cells, no overlaps. Flat true magenta background required.
