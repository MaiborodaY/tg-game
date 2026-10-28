# Генерация боевого единорога

После первой генерации выполнена [правка отступов](spacing-prompt.md). Выбранный PNG — результат этой правки.

Инструмент: встроенный imagegen. Основной референс — утверждённый бронированный боевой единорог `battle-unicorn-concept.png`. PNG выбранного атласа сохраняется без изменений; уменьшение nearest-neighbor, экспорт WebP и сборка превью выполняются механически через Sharp.

## Атлас

```text
Use case: identity-preserve.
Create a transparent production animation atlas from the approved ARMORED BATTLE UNICORN concept in image1 for the elven player army in BroTD Infinity. Preserve this mature, powerful battle design, NOT the earlier cute pony.

Deliver ONE square RGBA image with EXACTLY16 complete unicorn sprites in FOUR columns by FOUR rows, read left to right then top to bottom. Strict layout: every whole pose INCLUDING horn tip, mane, tail, armor and all hooves fits inside the CENTRAL 60% of its equal cell, with wide genuine transparent gutters ALL AROUND. Small sprites with generous empty margins are intentional. Do not fill the cells or let the horn cross into an adjacent frame. Same character scale in every cell. Remove forest, ground and all shadows completely. True alpha0 in every empty area, not black background or a drawn checkerboard. No labels or grid lines.

Lock identity across all frames: stocky ivory draft-warhorse body, thick powerful neck, deep chest, sturdy short legs with dark slate hooves, stern narrowed emerald eye, mature squared horse muzzle, two alert horse ears, ONE stout forward-projecting ivory spiral horn with a steel base. Same simple silver/steel forehead armor with a stern brow ridge, broad breastplate with green leaf gem, shoulder protection, short forest-green flank cloth with one silver leaf motif. Swept-back white/emerald mane in three or four broad angular tufts, matching strong tail. No rider, saddle, reins, extra horn, antlers, wings or magical effects. Exactly FOUR anatomically coherent equine legs and four hooves. Keep near and far pairs clear; natural partial occlusion is fine. No extra legs or legs detached from the body.
Preserve compact coarse-pixel game proportions, NOT realistic tall legs and NOT a giant baby head. Keep armor in large simple plates with little decoration.

ROW1 indices0-3 — IDLE RIGHT. Same slightly elevated three-quarter front-right view as reference. Four restrained breathing/weight/ear/mane variations. Stern head held battle-ready, horn forward/up. All supporting hooves grounded; no big displacement.
ROW2 indices4-7 — WALK RIGHT. Four distinct in-place walking poses with alternating fore/hind pairs: near forehoof forward with opposite hindhoof, passing step, opposite pair forward, other passing step. Small body bob, heavy controlled gait, not hopping. Armor follows body, mane and tail move subtly.
ROW3 indices8-11 — HORN ATTACK RIGHT. Same three-quarter right view:
8 braced ready;
9 anticipation: shifts weight onto rear legs, bends forelegs slightly and lowers thick neck, aligning the single horn toward screen right;
10 impact: SHORT FORCEFUL GROUNDED LUNGE, head thrusts forward/down, horn extends horizontally toward screen right, one forehoof steps forward while rear hooves support. Whole horn stays well inside padded cell. No big leap, not a kick, no gore;
11 recover toward the ready posture.
ROW4 indices12-15 — HORN ATTACK DOWN. Genuinely front-facing toward screen bottom, mildly elevated three-quarter frontal view with depth/foreshortening, NOT another side-facing row. Same four phases: 12 frontal ready,13 lower head/load rear legs,14 short thrust toward viewer/bottom,15 recover. The ONE horn emerges from the same center forehead and projects forward/down in perspective; do not turn it into an extra vertical horn. Keep eyes, armored head, chest and four-legged anatomy consistent. Tail remains contained behind/beside hindquarters.

Art style: authentic coarse fantasy pixel art matching the approved reference and Tiny Swords family. One consistent visible square pixel grid, bold stepped dark navy outlines, clean large pixel clusters, broad flat colors with2-3 shades per material. Designed like a roughly64x64 game creature and enlarged nearest-neighbor. No smooth painting under a pixel filter, fine fur, detailed muscles, many small armor plates, filigree, airbrushed gradients, realistic rendering, blur, glow or motion trails. Sixteen complete consistent battle unicorn poses only, isolated with wide transparent spacing.
```
