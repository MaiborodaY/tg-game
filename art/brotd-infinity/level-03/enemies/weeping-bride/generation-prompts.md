# Запросы генерации

Метод: встроенный `imagegen`. Исходные PNG сохранены без изменений. WebP и превью экспортированы через Sharp с уменьшением nearest-neighbor, без программной перерисовки и удаления фона.

## Атлас анимации

Референс: [утверждённый концепт](weeping-bride-concept.png). Результат сохранён как `weeping-bride-source.png`.

```text
Use case: stylized-concept / production sprite animation.
Asset type: ONE transparent RGBA animation atlas for THE WEEPING BRIDE, the approved ordinary ranged enemy of BroTD Infinity level3. Exactly16 complete full-body poses, 4columns by4rows.
Reference image1 is the approved character concept. Preserve this adult ghost bride's exact identity: pale blue-grey face and hands, black tear tracks, small rose-red eyes, dark hair, wilted burgundy rose wreath, long CHARCOAL BLACK bridal veil with muted wine-red lining, modest high-neck ivory wedding dress with a few broad ragged skirt and sleeve shapes, two small pale bare feet. One oval silver hand-mirror with cracked glass and a short handle is always held in the ANATOMICAL LEFT hand. The RIGHT hand is empty and casts magic. No skeletal face, staff, weapon changes, added jewelry, crown, armor or giant wings.

The bride wears an actual long bridal VEIL, not a hooded cloak. In idle and movement it drapes partly across the face and eyes are dimly visible beneath; during attack wind-up it parts, then the sorrowful face is visible at release, then it settles closed during recovery. Preserve all hair, dress and wreath design. Exactly2 arms,2 hands,2 feet. Hands must remain attached to the correct arms. Front-view row: LEFT hand holding mirror appears on VIEWER RIGHT; casting RIGHT hand on VIEWER LEFT. Never swap equipment.

Atlas layout is more important than filling space. Treat the canvas as 16 roomy equal square cells. Draw SMALL miniatures surrounded by LOTS of transparent space, no visible grid. The head-to-feet body should occupy only about FIFTY percent of each cell HEIGHT. Each COMPLETE pose, including fingertips, mirror and trailing veil, must stay within the central70percent of BOTH cell dimensions. Keep each character at the SAME BODY SCALE and consistent baseline within a row. The widest casting gesture determines the shared scale. Never enlarge idle figures to fill cells. No silhouette touches a cell boundary. Wide horizontal and vertical transparent gutters and outer margins.

Use the same slightly elevated three-quarter game camera as the reference, crisp stepped dark-navy pixel outlines, broad simple 2-3-tone clusters, readable light dress against black veil. Simplify folds and tiny details for mobile sprites. Body/clothing solid readable pixels, no mist and no giant translucent glow.

ROW1, frames0-3: IDLE RIGHT, four subtle loop poses facing screen RIGHT. Mirror held low in left hand, right hand relaxed forward, veil covers most of face, small hovering/breathing rise and fall, skirt and veil settle gently. Feet just visible.
ROW2, frames4-7: GLIDE RIGHT, four different slow advancing poses facing screen RIGHT. Alternate the small visible feet under the skirt, dress gently sways, veil trails to screen LEFT. Keep full dress hem inside cell. Mirror stays left-handed, right arm balances. No ground shadow or trailing ghost duplicates.
ROW3, frames8-11: CAST RIGHT, four consecutive poses facing screen RIGHT. Pose0 gathering: right hand draws near chest, veil mostly closed. Pose1 wind-up: right forearm lifted and palm opening forward, veil parts. Pose2 RELEASE: right arm extended toward screen RIGHT with open palm, face exposed, slight forward lean; mirror remains firmly in left hand. Pose3 recovery: right arm retracts, veil starts settling across face. No flying shards or detached particles in ANY frame: actual projectiles are separate assets, so show only the casting gesture.
ROW4, frames12-15: CAST DOWN, same four consecutive phases facing SCREEN DOWN/toward viewer, not sideways. Mirror held in anatomical left hand on viewer RIGHT, right arm on viewer LEFT reaches forward toward camera at release. Veil opens in wind-up and release and closes in recovery. Entire mirror, hands, veil and both feet stay inside frame.

Remove courtyard, floor and all mirror shards from the reference. Real alpha transparency everywhere outside the character and inside gaps between arms, dress, veil and mirror. NO background, painted checkerboard, shadow, aura, spell trails, detached glass shards, bonus projectile, text, labels, watermark, panels or crop marks.
One complete square transparent PNG atlas, exactly4rows and4columns,16 clearly separated miniatures.
```

## Отдельный зеркальный осколок

Референс: тот же утверждённый концепт, только внешний вид зеркальных осколков. Результат сохранён как `mirror-shard-source.png`; облегчённый вариант уменьшен до 128 × 128.

```text
Use case: stylized-concept / game projectile asset.
Create ONE isolated MIRROR SHARD projectile for the Weeping Bride from reference image1. Reference is used only for the appearance of the three reflective broken-mirror shards beside her casting hand. Do NOT draw the bride or her hand mirror, character, clothing or courtyard.

Design a single flat, irregular elongated triangular shard of broken mirrored glass, flying horizontally toward screen RIGHT. The sharpest point is the RIGHTMOST point; broader chipped trailing edge is on the LEFT. Approximately 3:1 width-to-height silhouette. A bold crisp dark-navy stepped pixel outline, a thin bright ivory highlight along one long edge, two or three simple flat silver-blue reflective facets and ONE small restrained deep burgundy reflection. It must read as a FLAT jagged piece of looking-glass, not a 3D gemstone, ice crystal, knife, arrow, rocket or magic flame. No handle, no fletching, no aura, no sparks, no trail or shadow. One unbroken silhouette, no other shards.

Match the reference's charming clean fantasy PIXEL ART, chunky readable clusters and limited colors, simplified enough to remain clear after reduction to a 32-64pixel projectile. Preserve strong contour contrast. Pointing exactly RIGHT with no diagonal tilt, centered in a square canvas, shard covers about70percent of canvas width and25percent of height with generous transparent padding. True transparent alpha background, including any negative space. No text, labels, watermark, grid, reference panels, checkerboard or colored backdrop. Output ONE square transparent PNG containing only this one horizontal projectile.
```

## Утверждённый концепт

Референсы: [Проклятый латник](../cursed-knight/cursed-knight-concept.webp) — стиль; [Двор Багрового замка](../../maps/crimson-courtyard/crimson-courtyard-780x1080-lite.webp) — окружение и палитра.

```text
Use case: stylized-concept.
Asset type: ONE full-body preview illustration of THE WEEPING BRIDE, a new ordinary RANGED UNDEAD ENEMY for level three of BroTD Infinity. This is a character design for approval, not a sprite atlas.

Reference image1 is the approved Cursed Knight: use ONLY its clean chunky fantasy-game pixel-art language, stepped dark-navy outlines, broad 2-3-tone pixel clusters, slightly elevated three-quarter camera and readable compact proportions. Completely different character, no armor or sword. Reference image2 is the approved Crimson Courtyard: use a quiet small section as the background and its desaturated blue-grey stone, dark plum shadows and burgundy accents.

Main character: an ADULT ghost bride in a decayed, modest old wedding dress. A haunting slender feminine silhouette with a large readable head and hands, stylized game proportions about3 to3.5 heads tall. Cool pale blue-grey skin, gaunt adult face, mournful expression, two black tear tracks below small dim rose-red eyes, dark ash hair. The dress is aged ivory and muted cold-grey, fitted high-neck bodice, long torn sleeves and an asymmetrical ankle-length skirt made of a few broad ragged fabric shapes. No exposed cleavage, no glamorous fashion posing, no gore or exposed organs. Her dress floats slightly at the hem, with two small pale feet just visible above the ground and a soft contact shadow below.

Two strong design signatures:
1. A LONG CHARCOAL-BLACK WEDDING VEIL with dark plum edges, attached to a simple wreath of wilted burgundy roses. It normally conceals her face, but in this ATTACK PREPARATION pose the veil parts and drifts backward, revealing her sorrowful face. It forms two clean trailing pointed fabric shapes behind her shoulders, fully inside the frame, not giant wings or a royal cape. No crown.
2. SHATTERED MIRROR MAGIC as her ranged weapon. Her anatomical LEFT hand, on viewer RIGHT, holds a small broken oval silver hand-mirror at waist/chest height; the tarnished frame has a short handle and obvious missing sections of glass. Her anatomical RIGHT hand, on viewer LEFT, reaches forward with open fingers. Exactly THREE large angular mirrored-glass shards hover just in front of that palm, aligned loosely toward the target to show they are about to be fired. The shards are unmistakably reflective flat silver-blue GLASS with crisp white facets and thin dark edges, not icicles, crystals, knives or flame projectiles. A tiny restrained muted red reflection within each shard ties them to the vampire faction; no broad magical glow or particle cloud. Keep shards separated and legible, with no translucent trail hiding the hand.

Pose: three-quarter body view facing slightly screen RIGHT; shoulders tilted, one arm forward casting, the other holding the broken hand-mirror. Exactly two arms and two hands, coherent wrists and fingers. Slim ordinary troop, no gigantic boss proportions. Threatening sadness rather than a scream. The pale dress and face contrast strongly against the black veil. All parts of the veil, entire dress, feet, mirror handle and all3 shards comfortably within generous margins. Character occupies about70 percent of square frame height.
Background: subdued corner of the vampire castle courtyard with cool medium-light worn stone paving, short iron fence, gothic side pillar and a faded burgundy banner, a few dead roses near the edges. Background is secondary, no full map layout, no other characters, ghosts, bats or skeletons. Feet and silhouette remain clear, no mist blanket.
Match charming dark-fantasy retro PIXEL ART: crisp stepped outlines, readable chunky clusters, limited desaturated palette and broad shadows, simple animation-friendly shapes. Avoid painterly smoothing, realistic adult anatomy, photorealism, smooth3D rendering, excessive lace or tiny ornaments, noisy textures, neon bloom, decorative UI.
One square full-body illustration. No text, name labels, watermarks, sprite grid, comparison panels or extra views.
```
