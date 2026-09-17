# First goblin wave art

Mode: built-in `image_gen` tool. No CLI/API fallback.

Final asset: `goblins-royale-wave-v1.png`, 1536 × 1024, four columns and two rows. Runtime removes the magenta key. The original guard atlas and map are unchanged.

Final source: `C:/Users/mrmay/.codex/generated_images/01a0a756-d57e-71d0-bc28-4dcb18d5a43d/exec-46aea9eb-155b-4bca-b01a-31085c7d9477.png`.

Poses, in row order: idle, left step, right step, attack windup, downward strike, recovery, hit reaction, defeated. Frame scale derives from the idle body so a raised sword never shrinks the goblin. Melee always uses the same right weapon hand.

Generation prompt:

> Create a polished mobile tower defense production sprite sheet. Eight poses of exactly the same short green goblin, arranged in an EXACT 4 columns by 2 rows equally spaced grid. All isolated full-body on perfectly solid saturated #FF00FF magenta background. No text, labels, grid lines, shadows, scenery, particles. Style: chunky cute dimensional 3D toy fantasy with rounded forms, smooth subtle highlights, expressive face, readable solid silhouette like premium mobile strategy games. Camera front three-quarter seen slightly from above; figure faces viewer slightly left so he advances DOWN the game screen. Goblin has wide triangular ears, big nose, determined face, GREEN skin, dark reddish-brown ragged tunic, brown belt and boots, short steel cleaver ALWAYS in anatomical RIGHT hand, small round wooden buckler ALWAYS on LEFT arm. Never mirror pose or change costume. Each figure wholly within its own identical cell with large clear margin. Row 1 left-to-right: standing idle, walk left boot forward/right back, walk right boot forward/left back, windup right cleaver arm up over shoulder. Row 2 left-to-right: DOWNWARD cleaver strike follow-through, recovery guard stance, hit reaction leaning back, defeated slumped seated pose. Exactly same model, proportions, camera and scale each cell. Smooth rounded 3D animation look, not pixel art, not line drawing. Flat uniform true pure magenta background for easy color-key extraction.

Background correction prompt, applied with the generated sheet as the edit target:

> Use case: background-extraction. EDIT TARGET is the provided 4 by 2 goblin sprite atlas. CHANGE ONLY THE BACKGROUND: remove ALL background color, gradient, glow and ground shadows around the 8 goblins and replace with perfectly UNIFORM PURE MAGENTA #FF00FF. Every pixel outside the goblin bodies/equipment must be exactly solid magenta. Keep the eight goblins, cleavers, shields, boots, all poses, framing, grid arrangement, size and exact camera angle identical. No new elements. The current brown/green background makes it unusable as game sprites. Do not change the creatures, only make a clean flat magenta backdrop for chromakey.

The first reference-based generation failed with a network error. The successful generation's initial background was unsuitable, so the built-in edit removed it before the atlas was copied into this project.
