# King's Guard animation atlases v1

Status: **GENERATED — all three PNGs are saved in this assets directory.** Twelve distinct full-character poses per class have been visually inspected. Runtime registration and map-background verification belong to the renderer integration; measured offsets and source-rectangle exceptions are recorded below.

Date: 2026-09-16. Generator: built-in imagegen, brand-new image mode. No CLI/API fallback and no graphics postprocessing were used. Files were copied byte-for-byte from the tool's generated-image directory; originals remain intact.

The selected character/model reference was inspected at original resolution before writing the prompts:
`C:\TG_bot\tg-game\.worktrees\pixel-chronicle\king-defense-toon\assets\units-royale-guard-v2.png`.

Reference-assisted generation failed at the built-in `images/edits` endpoint. The final successful requests instead used self-contained text descriptions, with neither `referenced_image_paths` nor `num_last_images_to_include`. The detailed outfit, materials, rear camera, and character identity descriptions were derived from the approved reference.

## Final assets and original source paths

All final PNGs are **1448 × 1086**, RGBA with actual transparency. The logical grid is 4 columns × 3 rows, with **362 × 362** cells. The tool returned these dimensions instead of the requested 1536 × 1152. Empty corner pixels have RGBA(0,0,0,0); do not assume an opaque magenta backing. Preserve alpha.

- `assets/warrior-animation-v1.png` — original `C:\Users\mrmay\.codex\generated_images\01a0a54f-e3f9-7d33-b1de-c65a94f044bb\exec-b70c0b36-14f7-4ee7-88e2-bc1b06905735.png`.
- `assets/archer-animation-v1.png` — original `C:\Users\mrmay\.codex\generated_images\01a0a54f-e3f9-7d33-b1de-c65a94f044bb\exec-e3f6a8d5-92d1-4f60-bb54-ef9579c58b24.png`.
- `assets/healer-animation-v1.png` — original `C:\Users\mrmay\.codex\generated_images\01a0a54f-e3f9-7d33-b1de-c65a94f044bb\exec-996133a2-2c9c-400f-81be-51a5baebc181.png`.

## Frame map and observed action timing

All indices are zero-based in row-major order.

| Index | Row | Column | Warrior | Archer | Healer |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | Idle | Idle | Idle |
| 1 | 0 | 1 | First contact step | First contact step | First contact step |
| 2 | 0 | 2 | Passing step | Passing step | Passing step |
| 3 | 0 | 3 | Opposite contact step | Opposite contact step | Opposite contact step |
| 4 | 1 | 0 | Opposite passing step | Opposite passing step | Opposite passing step |
| 5 | 1 | 1 | Draw sword back, low | Lift bow and prepare | Gather/crouch |
| 6 | 1 | 2 | Sword raised overhead | Fully draw bowstring | Raise staff and left hand |
| 7 | 1 | 3 | High forward extension, still before downward strike | Release bowstring | Forward healing cast |
| 8 | 2 | 0 | Downward slash / low follow-through — actual impact frame | Bow follow-through | Staff/hand return |
| 9 | 2 | 1 | Return to ready | Lower bow | Settle to idle |
| 10 | 2 | 2 | Hurt recoil | Hurt recoil | Hurt recoil |
| 11 | 2 | 3 | Collapsed | Collapsed | Collapsed |

The submitted prompts requested impact at frame7 for all classes. The **observed warrior downstroke is frame8**, so its runtime attack sequence should use anticipation5→6→7, impact8, then recovery9→0. Archer/healer impact remains frame7.

The four walk poses visibly change the legs and bent knees; action poses articulate the arms and held equipment. These are generated alternate poses, not rotations or cutout sections of a static idle sprite.

## Registration metadata

Source coordinates below are cell-local. Baselines use the last row containing at least five pixels with alpha>=224; stray isolated or translucent edge pixels are excluded. The archer/healer frame2 baselines specifically exclude the next row's raised weapon tips. Natural pose changes include some body lowering; use a fixed body scale with per-frame ground registration instead of rescaling every full image bound.

| Class | Idle body top | Idle foot baseline | Standing body height for fixed scale |
| --- | --- | --- | --- |
| Warrior | 41 | 331 | 290 |
| Archer | 34 | 340 | 306 |
| Healer | 49 | 334 | 285 |

The healer's body top is the first opaque blue hood pixel, excluding the taller staff. The warrior top is its helmet and the archer top is its hair. For a 49px on-screen standing body, use approximately 49/bodyHeight as each atlas's fixed scale; equipment must not change that scale.

```json
{
  "warrior": {
    "cellWidth": 362,
    "cellHeight": 362,
    "bodyHeight": 290,
    "footBaselines": [
      331,
      330,
      327,
      331,
      327,
      330,
      332,
      335,
      325,
      322,
      322,
      304
    ]
  },
  "archer": {
    "cellWidth": 362,
    "cellHeight": 362,
    "bodyHeight": 306,
    "footBaselines": [
      340,
      335,
      336,
      340,
      337,
      337,
      337,
      333,
      335,
      339,
      330,
      315
    ]
  },
  "healer": {
    "cellWidth": 362,
    "cellHeight": 362,
    "bodyHeight": 285,
    "footBaselines": [
      334,
      333,
      334,
      339,
      333,
      331,
      334,
      341,
      329,
      331,
      325,
      286
    ]
  }
}
```

For normal cells, source x=(index%4)*362 and source y=floor(index/4)*362. A static horizontal cell center prevents weapon extension from changing the actor's position.

## Source-rectangle exceptions

The generator slightly exceeded two cells' upper weapon margin. There is clean empty space between these tips and the previous row's feet; the characters do not overlap. A strict equal-cell crop would cut these tips and mistakenly attach them to frame2.

- Archer: frame6's opaque upper bow tip begins at global y360, two pixels above its nominal y362 row. Semi-transparent edge pixels extend slightly farther. For frames5/6/7, a source rectangle starting at global y346 with height378 preserves the entire bow. Crop upper-row frames1/2/3 at height348; their actual solid boots end no lower than y341.
- Healer: frame6's opaque raised staff begins at global y347, fifteen pixels above y362. Use global y340 and height384 for frame6, while frame2 uses source height342. Frame2's solid boots end at y334, leaving a clean gap before the staff tip.
- For an expanded rectangle, convert the listed baseline to rectangle-local coordinates with `listedBaseline + nominalCellY - actualSourceY`. For example, healer frame6 becomes334+362-340=356.

These exceptions are source sampling metadata; the PNGs themselves were not clipped, painted over, rescaled, or altered.

## Visual checks and limitations

- All sheets keep a rear three-quarter view toward the upper right, a consistent model within each sheet, blue guard outfits, and recognizable steel/leather materials.
- Warrior sword stays in the right hand and shield in the left. The generated archer consistently holds the bow on the right and draws with the left, matching the rear model reference but differing from the submitted left-hand-bow wording. Do not mirror individual frames. The healer keeps her staff in the right hand and uses the left for healing gestures.
- The healer remains a dark-skinned human woman in a blue hood/robe; the archer remains a brown-haired bearded human male; the warrior retains a closed steel helmet.
- Some faint white/colored alpha fringes and isolated speckles remain from the generator's background removal. For example, 44 near-white pixels above the warrior's opaque idle helmet have a maximum alpha of 159, so this sample fringe is translucent, not a fully opaque white outline. Check the final 49px sprites on the forest map. The source files were preserved without destructive cleanup.
- The requested exact body registration was not perfectly followed; use the measured baselines above. Death poses intentionally occupy less vertical space at the same fixed body scale.

## Generation history

Three reference-assisted built-in requests and one identical warrior retry failed:

```text
image generation failed: network error: error sending request for url (https://chatgpt.com/backend-api/codex/images/edits)
```

One brand-new warrior request without an image attachment succeeded. The archer and healer then succeeded as two separate brand-new built-in calls. Exact successful prompts follow.

## Exact successful prompts

### warrior-animation-v1.png

```text
Use case: stylized-concept.
Asset type: production animation sprite atlas for the existing King's Guard mobile game.
Primary request: create a polished volumetric 3D toy fantasy sprite animation sheet with the exact character appearance described below. Create actual successive articulated animation poses, not twelve clones, rotations, cropped parts, or different character designs.
Layout: one PNG exactly 1536 by 1152 pixels, 4 equal columns and 3 equal rows; each invisible cell is 384 by 384 pixels. Exactly twelve full-body instances of ONE character, one per cell, row-major. No visible grid, text, numbering, labels, extra people, scenery, or props outside the held equipment. Every cell has ample empty margins around all weapons. No clipping or crossing a cell boundary.
Camera and direction: a FIXED orthographic rear three-quarter game camera slightly above the character; the character faces AWAY from the viewer diagonally toward the TOP RIGHT of the screen (north-northeast). The BACK is dominant and only a narrow right facial profile may show. SAME camera, facing direction, lighting, model, costume, body scale and handedness in all twelve frames, including the attack. Never switch to front view or mirror a frame.
Registration: standing body from helmet/head to soles about 238 pixels high in each cell; hips centered on the cell x=192, flat ground/foot contact baseline y=330. Keep body center and baseline registered across walking and action frames; only natural limb motion and very small body bob. The death pose falls to this same ground baseline. Full tall weapon always contained within its own cell with generous top and side clearance.
Rendering: polished Clash Royale-like volumetric 3D toy fantasy style: chunky rounded geometry, rich blue guard uniform, realistic-looking stylized metal and leather highlights, clean strong silhouette, soft self-shading ON the character. The BACKGROUND must be a completely flat opaque solid chroma-key RGB(255,0,255), #FF00FF, covering every empty pixel. Absolutely no ground or cast shadow, colored halo, glow spilling into the background, gradient, checkerboard or environment. No motion-blur, speed lines, smoke or detached spell effects.
Animation sheet order (index starting from 0):
Row1 col1 [0]: neutral alert idle.
Row1 col2 [1]: WALK left boot forward planted and right leg extended back, clear long left contact step.
Row1 col3 [2]: WALK left boot supports the body; right boot lifted, right knee bent passing forward under the body.
Row1 col4 [3]: WALK right boot forward planted and left leg extended back, clear opposite right contact step.
Row2 col1 [4]: WALK right boot supports the body; left boot lifted, left knee bent passing forward under the body.
Row2 col2 [5]: ACTION anticipation first pose described below.
Row2 col3 [6]: ACTION anticipation second pose described below.
Row2 col4 [7]: ACTION impact/release pose described below.
Row3 col1 [8]: ACTION recovery first pose described below.
Row3 col2 [9]: ACTION recovery second pose returning toward idle.
Row3 col3 [10]: brief hurt recoil with knees bent and torso recoiling, equipment retained.
Row3 col4 [11]: defeated collapsed body lying on its side/back at the same cell ground baseline, full figure and equipment contained, same scale.
Walk poses MUST visibly alternate the actual left and right legs with bent knees and lifting feet, and animate arms naturally while retaining the equipment. Do not draw the same standing legs five times. Attack poses MUST form an unmistakable anticipation, impact, and recovery sequence.
Character: royal guard infantry swordsman. Closed rounded steel helmet with narrow dark visor and vertical breathing slots, no visible face, silver rounded pauldrons, chainmail sleeves, BLUE tabard with thin IVORY-WHITE trim, brown crossed leather strap/belt, steel knee plates, brown boots. Straight broad steel sword with gold guard stays in the anatomical RIGHT hand; the ROUND BLUE SHIELD with silver rim/boss stays in the anatomical LEFT hand throughout every frame. Never replace helmet, shield, colors or sword hand.
Action: one clear upward-targeted sword slash while standing in the same rear camera. [5] bend knees slightly, draw sword hand back beside right hip, shield forward. [6] lift the right arm and sword high over the right shoulder with blade pointing backward/up, maximal windup; left shield remains forward. [7] slash sword forward and down toward the upper-right target, right arm extended, torso twisting slightly but back still visible. [8] low diagonal sword follow-through across front of the body, weight on front leg. [9] bring sword back to ready stance, shield still in left hand. Each of these five poses must be visibly different, especially the sword angle and elbow articulation. This is a sprite animation sheet, not a character lineup.
```

### archer-animation-v1.png

```text
Use case: stylized-concept.
Asset type: production animation sprite atlas for the existing King's Guard mobile game.
Primary request: create a polished volumetric 3D toy fantasy sprite animation sheet with the exact character appearance described below. Create actual successive articulated animation poses, not twelve clones, rotations, cropped parts, or different character designs.
Layout: one PNG exactly 1536 by 1152 pixels, 4 equal columns and 3 equal rows; each invisible cell is 384 by 384 pixels. Exactly twelve full-body instances of ONE character, one per cell, row-major. No visible grid, text, numbering, labels, extra people, scenery, or props outside the held equipment. Every cell has ample empty margins around all weapons. No clipping or crossing a cell boundary.
Camera and direction: a FIXED orthographic rear three-quarter game camera slightly above the character; the character faces AWAY from the viewer diagonally toward the TOP RIGHT of the screen (north-northeast). The BACK is dominant and only a narrow right facial profile may show. SAME camera, facing direction, lighting, model, costume, body scale and handedness in all twelve frames, including the attack. Never switch to front view or mirror a frame.
Registration: standing body from helmet/head to soles about 238 pixels high in each cell; hips centered on the cell x=192, flat ground/foot contact baseline y=330. Keep body center and baseline registered across walking and action frames; only natural limb motion and very small body bob. The death pose falls to this same ground baseline. Full tall weapon always contained within its own cell with generous top and side clearance.
Rendering: polished Clash Royale-like volumetric 3D toy fantasy style: chunky rounded geometry, rich blue guard uniform, realistic-looking stylized metal and leather highlights, clean strong silhouette, soft self-shading ON the character. The BACKGROUND must be a completely flat opaque solid chroma-key RGB(255,0,255), #FF00FF, covering every empty pixel. Absolutely no ground or cast shadow, colored halo, glow spilling into the background, gradient, checkerboard or environment. No motion-blur, speed lines, smoke or detached spell effects.
Animation sheet order (index starting from 0):
Row1 col1 [0]: neutral alert idle.
Row1 col2 [1]: WALK left boot forward planted and right leg extended back, clear long left contact step.
Row1 col3 [2]: WALK left boot supports the body; right boot lifted, right knee bent passing forward under the body.
Row1 col4 [3]: WALK right boot forward planted and left leg extended back, clear opposite right contact step.
Row2 col1 [4]: WALK right boot supports the body; left boot lifted, left knee bent passing forward under the body.
Row2 col2 [5]: ACTION anticipation first pose described below.
Row2 col3 [6]: ACTION anticipation second pose described below.
Row2 col4 [7]: ACTION impact/release pose described below.
Row3 col1 [8]: ACTION recovery first pose described below.
Row3 col2 [9]: ACTION recovery second pose returning toward idle.
Row3 col3 [10]: brief hurt recoil with knees bent and torso recoiling, equipment retained.
Row3 col4 [11]: defeated collapsed body lying on its side/back at the same cell ground baseline, full figure and equipment contained, same scale.
Walk poses MUST visibly alternate the actual left and right legs with bent knees and lifting feet, and animate arms naturally while retaining the equipment. Do not draw the same standing legs five times. Attack poses MUST form an unmistakable anticipation, impact, and recovery sequence.
Character: royal guard brown-haired bearded HUMAN MALE archer. Thick tousled brown hair, brown beard, human ears, no helmet. BLUE guard tunic/tabard with thin IVORY-WHITE trim, steel shoulder plates, short chainmail sleeves, leather bracers/belt, brown boots. Brown quiver containing ivory-fletched arrows across the back, curved wooden bow. Keep his exact stocky toy proportions, blue uniform, beard and quiver. Decide handedness once and keep it anatomically consistent across the whole animation: bow in anatomical LEFT hand, string drawn by RIGHT hand. Do NOT swap or mirror hands in any cell.
Action: one readable bow shot aimed away toward upper-right. [5] left arm lifts bow toward target while right hand brings one arrow from quiver toward string. [6] arrow nocked, left bow arm straight forward, right elbow pulled far backward, string fully drawn to cheek; bow is visibly bent under tension. [7] release: arrow has just left, right fingers open near cheek with relaxed wrist, bow arm still extended, string now forward. [8] brief follow-through with bow arm held then beginning to lower, right hand relaxed near shoulder. [9] lower bow to idle carrying pose, right hand moves down toward side. Absolutely do not show all action frames merely carrying the bow vertically. Bow silhouette, drawing arm, bent bow and release must visibly articulate between frames; include only the held/nocked arrow, no detached projectile outside the character. This is a sprite animation sheet, not a character lineup.
```

### healer-animation-v1.png

```text
Use case: stylized-concept.
Asset type: production animation sprite atlas for the existing King's Guard mobile game.
Primary request: create a polished volumetric 3D toy fantasy sprite animation sheet with the exact character appearance described below. Create actual successive articulated animation poses, not twelve clones, rotations, cropped parts, or different character designs.
Layout: one PNG exactly 1536 by 1152 pixels, 4 equal columns and 3 equal rows; each invisible cell is 384 by 384 pixels. Exactly twelve full-body instances of ONE character, one per cell, row-major. No visible grid, text, numbering, labels, extra people, scenery, or props outside the held equipment. Every cell has ample empty margins around all weapons. No clipping or crossing a cell boundary.
Camera and direction: a FIXED orthographic rear three-quarter game camera slightly above the character; the character faces AWAY from the viewer diagonally toward the TOP RIGHT of the screen (north-northeast). The BACK is dominant and only a narrow right facial profile may show. SAME camera, facing direction, lighting, model, costume, body scale and handedness in all twelve frames, including the attack. Never switch to front view or mirror a frame.
Registration: standing body from helmet/head to soles about 238 pixels high in each cell; hips centered on the cell x=192, flat ground/foot contact baseline y=330. Keep body center and baseline registered across walking and action frames; only natural limb motion and very small body bob. The death pose falls to this same ground baseline. Full tall weapon always contained within its own cell with generous top and side clearance.
Rendering: polished Clash Royale-like volumetric 3D toy fantasy style: chunky rounded geometry, rich blue guard uniform, realistic-looking stylized metal and leather highlights, clean strong silhouette, soft self-shading ON the character. The BACKGROUND must be a completely flat opaque solid chroma-key RGB(255,0,255), #FF00FF, covering every empty pixel. Absolutely no ground or cast shadow, colored halo, glow spilling into the background, gradient, checkerboard or environment. No motion-blur, speed lines, smoke or detached spell effects.
Animation sheet order (index starting from 0):
Row1 col1 [0]: neutral alert idle.
Row1 col2 [1]: WALK left boot forward planted and right leg extended back, clear long left contact step.
Row1 col3 [2]: WALK left boot supports the body; right boot lifted, right knee bent passing forward under the body.
Row1 col4 [3]: WALK right boot forward planted and left leg extended back, clear opposite right contact step.
Row2 col1 [4]: WALK right boot supports the body; left boot lifted, left knee bent passing forward under the body.
Row2 col2 [5]: ACTION anticipation first pose described below.
Row2 col3 [6]: ACTION anticipation second pose described below.
Row2 col4 [7]: ACTION impact/release pose described below.
Row3 col1 [8]: ACTION recovery first pose described below.
Row3 col2 [9]: ACTION recovery second pose returning toward idle.
Row3 col3 [10]: brief hurt recoil with knees bent and torso recoiling, equipment retained.
Row3 col4 [11]: defeated collapsed body lying on its side/back at the same cell ground baseline, full figure and equipment contained, same scale.
Walk poses MUST visibly alternate the actual left and right legs with bent knees and lifting feet, and animate arms naturally while retaining the equipment. Do not draw the same standing legs five times. Attack poses MUST form an unmistakable anticipation, impact, and recovery sequence.
Character: royal guard DARK-SKINNED HUMAN WOMAN priestess. Medium-dark brown skin, human face/ears, curly dark brown/black hair visible below a royal BLUE hood. Long BLUE robe with THIN IVORY-WHITE edging, silver steel shoulder pauldrons and small silver circular collar clasp, brown belt/pouch and brown boots. No beard, no animal ears, no elves, no redesign into a male or pale character. Retain her exact compact toy model and clothing. Brown wood staff topped by a large polished GREEN orb cradled in curved branches. Staff always in anatomical RIGHT hand; free LEFT hand performs blessing gestures.
Action: a deliberate healing cast toward allies away toward upper-right, with real arm and staff animation. [5] knees and shoulders lower slightly, free left hand draws inward toward chest, right hand tips staff close to body. [6] raise staff well above shoulder level and extend free left forearm upward, a clear broad preparation silhouette. [7] cast/impact: free left palm extends decisively forward toward ally, right arm thrusts staff upward-forward; green orb has a brighter internal highlight but NO glow outside its solid surface. [8] lower left arm partway and return staff gradually toward upright, visibly distinct from impact. [9] settle staff into normal grounded upright carrying position, left hand returns near side. Robe should allow clearly distinct alternating boots and bent knees beneath the hem in the four walk frames; animate the robe folds for each step instead of hiding every foot. This is a sprite animation sheet, not a character lineup.
```
