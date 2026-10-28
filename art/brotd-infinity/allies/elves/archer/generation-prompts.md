# Промпты спрайтов лучницы

Инструмент: встроенный imagegen. Основной референс — последний утверждённый компактный концепт `elf-archer-concept.png`; дополнительный стилевой референс — настоящий игровой `assets/web/archer-art.png`. Исходник PNG сохраняется без изменений. Уменьшение nearest-neighbor, экспорт WebP и сборка превью выполняются механически через Sharp.

## Атлас

```text
Use case: identity-preserve.
Create the production character sprite atlas for the allied ELF ARCHER of BroTD Infinity from image1, the APPROVED SHORT COMPACT elf concept. Image2 is the actual in-game human archer, a supporting reference for low-resolution pixel rendering and compact proportions ONLY; do not copy its helmet or blue costume.

CRITICAL: preserve the APPROVED shortened anatomy: head with hair almost half of standing height, short broad torso, VERY SHORT sturdy legs and chunky boots, simple short arms, compact adult game miniature. Do not revert to the earlier tall elegant illustration. Same female elf in ALL frames: pointed ears, green eyes, pale blonde high ponytail in a few broad pixel masses, green tunic with TWO cream-edged leaf hem panels, short green cape, brown belt/gloves/boots, one silver/green leaf clasp and brown quiver. No extra detail or realistic anatomy. Keep the same head and body size across all16 frames.

ONE square image with EXACTLY16 separate sprites in FOUR columns by FOUR rows, in row-major order. True RGBA transparency, alpha0 in all empty areas. Remove the complete scenery and ground shadow. Each complete sprite including ponytail, bow tips, fingers, quiver and any nocked arrow occupies only the CENTRAL 60% of its equal square cell. Leave broad empty transparent padding ALL AROUND, at least15% even during full draw. Do NOT maximize sprite size. No sprite crosses a cell boundary. No grid, labels, numbers, checkerboard, background, shadows or extra objects.

Weapon: one compact pale wooden recurve bow with simple small green leaf ends. Always held in her ANATOMICAL LEFT hand; right hand draws the string. In the approved three-quarter right view the bow arm extends to VIEWER RIGHT and draw hand is nearer VIEWER LEFT cheek. Preserve handedness consistently, never swap bow and string hands. Exactly two arms, two hands and two feet.
Nocked-arrow frames have ONE straight arrow through the grip and ONE bowstring stretched from the top bow tip to the drawing fingers and back to the bottom tip. Release and recovery frames have NO nocked arrow: the arrow has already left and is handled separately by the game, do not draw a flying projectile anywhere on this atlas.

Row1 indices0-3, IDLE RIGHT: four small breathing/pony-tail/cape variations, right-facing elevated three-quarter view. Both feet grounded, bow held low upright in the left hand on screen right, right hand relaxed near torso. No nocked arrow in this row.
Row2 indices4-7, WALK RIGHT: four distinct steps in place, alternating left and right short boot forward with two passing poses. Natural small vertical bob, no floating or hopping. Bow carried upright low in the same left hand, no nocked arrow. Keep feet easy to anchor.
Row3 indices8-11, SHOOT RIGHT, same three-quarter view:
8 raise the bow and nock ONE arrow, partial draw;
9 full draw, right hand near cheek, arrow aimed screen RIGHT;
10 RELEASE: right drawing hand follows back near the cheek, string rebounds straight between bow tips, bow stays forward in left hand, NO arrow on bow and no detached arrow;
11 RECOVER: bow lowered slightly, drawing hand relaxes, NO nocked arrow.
Row4 indices12-15, SHOOT DOWN: genuinely frontal slightly top-down game view, facing viewer / bottom of image, not another sideways row. Same left bow hand (viewer right) and right drawing hand (viewer left), with natural foreshortening toward screen bottom. Poses12 nock,13 full draw,14 release with NO arrow,15 lower/recover with NO arrow. The bow should aim into the foreground/down, not across the screen. Preserve clear face and correct two-arm anatomy. Bow and string stay attached and physically readable.

Match game pixel art: consistent coarse pixel grid, bold stepped navy contour, large clean clusters, flat fills and only2-3 shades per material. Each sprite should look designed at around48-64 pixels high and enlarged nearest-neighbor. NO smooth painting, fine texture, gradients, airbrushing, realistic proportions, long legs, tiny ornament, glow, blur or antialiasing halo. Do not add detail during generation. Sixteen complete consistent compact elf archer poses only, generously separated on real transparency.
```
