# Запросы генерации

Метод: встроенный `imagegen`. Исходные PNG сохранены без изменений. Облегчённые WebP и превью экспортированы через Sharp с уменьшением nearest-neighbor, без программной перерисовки и удаления фона.

## Утверждённый концепт

Референсы: [Проклятый латник](../../enemies/cursed-knight/cursed-knight-concept.webp) — стиль; [Двор Багрового замка](../../maps/crimson-courtyard/crimson-courtyard-780x1080-lite.webp) — окружение и палитра.

```text
Use case: stylized-concept.
Asset type: ONE full-body preview illustration of an UNDEAD MINI-BOSS for BroTD Infinity level three: THE LIVING FUNERAL ORGAN / ОЖИВШИЙ ОРГАН. Concept for approval, not an animation atlas.

Reference image1 (Cursed Knight) establishes the game's crisp chunky retro pixel-art style: stepped dark-navy outlines, readable broad 2-3-tone shading, slightly elevated three-quarter view and compact stylized proportions. Do not copy the knight or draw humanoid armor. Reference image2 (Crimson Courtyard) establishes the setting and faction palette: cool grey-violet paving, gothic ironwork, burgundy banners, dead red roses, small red lanterns.

Main subject: an old gothic CHURCH PIPE ORGAN that has become a self-playing walking undead creature. It has a broad squat dark mahogany wooden instrument body, a clearly visible horizontal keyboard of large aged-IVORY WHITE KEYS interspersed with shorter black keys, and a dramatic group of SEVEN large TARNISHED SILVER ORGAN PIPES rising directly from the wooden body. The three central pipes are tallest, four side pipes progressively shorter; slightly asymmetrical, dented, a little crooked and bent forward at their upper ends. The pipes have visible dark openings and simple broad collars, they must read as real musical organ pipes rather than castle towers, cannons or smokestacks. Tiny wine-red spirit light deep inside a few openings. Keep seven clear bold pipe silhouettes, not a forest of dozens of thin tubes.

The instrument's wooden casing is cracked, with one simple pointed gothic arch above the keyboard and a small tarnished brass BAT motif. A few broad iron braces hold it together. One visible compact burgundy leather BELLOWS on its side makes the old air mechanism tangible; in this pose it is half compressed. A short torn strip of burgundy altar cloth hangs from one corner. Restrained carving, no gold filigree, chandeliers, throne, skull piles or miniature church building.
The keyboard plays by itself: two or three keys are depressed and glow dim crimson along their edges. The keys are MUSICAL KEYS, not a monster's teeth. No cartoon eyes or face painted onto the instrument. No organist, humanoid torso, additional monster riding it or disembodied player hands.

Exactly FOUR short thick skeletal legs attach securely under the four lower corners of the instrument, two on each side. Ivory-grey bones, bent knees, wide three-clawed feet. Weight-bearing low posture, one front foot slightly raised for a lumbering step, other visible feet grounded; far rear leg may be partly occluded. No arms, extra legs, floating limbs or wheels. The organ is a bulky threatening mini-boss, around twice an ordinary unit's mass, with a distinct towering-pipes silhouette. Entire creature fits comfortably inside the frame, including ALL pipe tops and visible feet.

Pose and attack hint: organ faces three-quarter FRONT-RIGHT so keyboard, pipe mouths, one side bellows and legs are all intelligible. The tall pipes bow very slightly forward as if preparing a funeral chord. Show just TWO small restrained translucent wine-red sound ripples leaving the pipe openings toward the right, close to the instrument, with no giant aura. No floating music-note symbols, text, rainbow effects, beam, fire or large particle cloud. The design itself must remain clear and reproducible for later mobile sprites.

Square full-body character illustration, complete mini-boss occupying roughly75 percent of image height with generous safe margins around pipe tops, feet and ripples. Soft ground contact shadow. Background secondary: a quiet small section of the vampire castle courtyard, medium-light cool paving, low iron fence and weathered gothic stone pillar with a small crimson lantern, faded burgundy banner and a few dead roses at the outer edges. No other figures, vampires, bats, coffins or hero scale references.
Art direction: match charming dark-fantasy PIXEL ART with crisp stepped dark outlines, chunky readable clusters, a limited desaturated palette and simple 2-3-tone material shading. Dark plum-brown wood, cold tarnished grey metal, aged ivory bones and keys, restrained crimson glints. No photorealism, smooth 3D, painterly blur, metallic shine everywhere, noisy micro-detail or dense ornamental clutter.
One single concept image. No UI, name labels, captions, text, watermark, grid, comparison panels or extra views.
```


## Атлас: первая генерация

Референс: утверждённый `living-organ-concept.png`.

```text
Use case: stylized-concept / production sprite animation.
Asset type: ONE transparent RGBA atlas for the approved LIVING FUNERAL ORGAN mini-boss in BroTD Infinity level3. Exactly SIXTEEN complete full-body poses in FOUR columns and FOUR rows.

Reference image1 is the approved character identity. Recreate this exact walking church organ in every frame: broad dark mahogany instrument case, iron braces, ivory-and-black keyboard, simple gothic wooden arch with small bronze bat emblem, short ragged burgundy cloth hanging below keyboard, one burgundy leather bellows on the side, FOUR short jointed ivory-grey skeletal legs with clawed feet, and exactly SEVEN tall tarnished silver organ pipes rising directly from the case. Tallest central pipe, progressively shorter flanking pipes, crooked open tops and simple collars. Pipes, keyboard, bellows, legs and all fittings must retain their counts, relative size, and structure between poses. No human player, face, arms, extra legs, wheels, floating or detached parts, giant skull, crown or new decorations.

Art style: match the reference's crisp chunky fantasy pixel art with stepped dark navy outlines, controlled broad clusters, simple2-3tone shading and restrained burgundy/red highlights. Simplify tiny wood grain and rivets for a mobile sprite. Keep all components clearly legible. No realistic texture or smooth3D.

LAYOUT PRIORITY: one square canvas,4equal columns x4equal rows. Draw SMALL sprites with LOTS of transparent space. EACH complete silhouette from highest pipe to lowest claw and from bellows to opposite foot must fit within the CENTRAL65percent of its own cell width AND height, even during attack. Same body and pipe scale across all sixteen frames, never enlarge idle poses to fill cells. Center each sprite within its cell. Generous transparent horizontal and vertical gutters; no pipe, foot or cloth crosses a cell border, touches a neighbor, or is cropped. Baselines consistent within each row except tiny natural walking bob. No visible grid.

ROW1 frames0-3, IDLE RIGHT: four subtly distinct loop poses, elevated three-quarter front-right view so keyboard and side bellows are both visible. Feet planted, instrument body gently settles, bellows opens/closes a little, one or two dim red keys change. Pipes remain attached with very small movement only.
ROW2 frames4-7, WALK RIGHT: four sequential lumbering quadruped steps facing screen RIGHT. Alternate pairs of bony legs, different lifted/front versus supporting/rear feet, natural small case bob; the seven pipes tilt together slightly with the entire case. Do not duplicate the same step four times. Keep full body, bellows, pipes and feet intact.
ROW3 frames8-11, ATTACK RIGHT: same three-quarter right camera. Pose0 ready crouch, bellows partly compressed. Pose1 anticipation: bellows visibly EXPANDED, case leans back slightly, keys begin crimson glow. Pose2 RELEASE: bellows visibly COMPRESSED, case rocks forward and pipes lean forward together a little, keys brightest crimson and dim crimson inner pipe openings. Pose3 recoil/recovery: settles toward idle, glow decreases, bellows relaxes. Musical shockwave is a SEPARATE image: draw NO emitted wave, smoke, ribbons, particles or projectiles in this sheet.
ROW4 frames12-15, ATTACK DOWN: same four phases, now the keyboard directly faces the viewer/screen DOWN. All seven pipes and four leg attachments remain coherent; far legs may be partly occluded. Expanded bellows wind-up, compressed bellows at release, then settle. No duplicate side-view row. Entire silhouette fits safely in each frame.

Remove courtyard, floor, shadow and the red wisps from the reference. True alpha transparency in all negative space, including between legs and between separate pipe tops. Character itself remains clearly shaded and solid. NO painted checkerboard, opaque background, cast shadow, aura, soundwave, labels, text, watermark, extra panels, loose props or bonus frames.
Output one square transparent PNG atlas with16 distinct poses,4rows,4columns and wide gutters.
```

## Исправление отступов атласа

Референс: первый сгенерированный атлас. В финальный комплект вошла исправленная версия с большим запасом между кадрами; проверены все 16 прямоугольников.

```text
Precise atlas layout correction of the attached living funeral organ sprite sheet. Preserve exactly the same 16 sprites, poses, their order, materials, seven attached silver organ pipes, mahogany wooden body, keyboard, burgundy bellows, four skeletal legs, bat emblem and pixel-art game style. Do not redesign anything. The current sheet has insufficient vertical space between the feet of one row and the pipe tops of the next row. Correct ONLY the spacing: use a square TRANSPARENT canvas with a perfectly regular 4 by 4 grid of equal invisible cells; shrink every complete sprite uniformly to 72% of its current size, then center it in its own cell. All sprites must be the same scale; front-view bottom row also same scale. Leave very wide completely transparent gutters on ALL sides of EVERY sprite, at least 12% of cell dimension before any pipe, leg, claw or body part. All seven pipes must remain attached and completely visible, all feet completely inside each cell. Keep exactly four columns and four rows, with the original idle-right, walk-right, attack-right, attack-front rows and four different poses per row. Preserve attack anticipation and the brighter red keys and compressed bellows in column 3 release poses. No labels, no grid lines, no frames, no shadows, no background, no glow particles, no soundwave attached. Output real alpha transparency. This is a professional 16-frame sprite atlas layout repair, not a new illustration.
```

## Звуковая волна

Референс: утверждённый `living-organ-concept.png`.

```text
Use case: stylized-concept / game projectile effect.
Asset type: ONE isolated directional SOUND WAVE projectile for the Living Funeral Organ in reference image1. Use the reference ONLY for its restrained burgundy/crimson spirit-magic color and chunky pixel-art style. Do not draw the organ, its pipes, character, background, notes or instruments.

Design a compact group of THREE nested curved sound-wave ridges traveling toward SCREEN RIGHT. Each ridge is a simple right-bulging arc shaped like a closing parenthesis ); the convex/front face points RIGHT and the open side faces LEFT. Arrange the three ridges left-to-right, smallest at the left trailing end, largest at the right leading end, clearly separated by transparent gaps. Together they form ONE readable traveling wave packet, not a full ring or explosion. Keep clean directional silhouette and balanced vertical alignment.
Palette: subdued deep burgundy outer stepped pixels, crimson midtone and restrained pale rose central highlights; luminous semi-transparent edge pixels allowed but no huge blurry glow. No orange/yellow fire, purple smoke, solid circle, blade, rune, music-note glyph or decorative symbol.
Art style: clean controlled PIXEL ART, crisp stepped curves and broad 2-3tone color clusters. It must read after reduction to32-64pixels; avoid tiny fragments and noisy detail.
One square canvas with real alpha transparency. The entire wave packet fits within the central65percent of width and height, centered with generous transparent borders. Forward direction exactly horizontal RIGHT. No motion trail outside the packet, ground shadow, opaque background, checkerboard, text, UI, watermark, grids, multiple stages or character. Output one transparent square PNG containing only the3 curved soundwave ridges.
```
