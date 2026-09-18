# Атлас наездницы с глефой

Встроенный imagegen. Референсы: [утверждённый концепт](panther-glaive-rider-concept.png) и атлас [эльфийского лекаря](../../healer/elf-healer-768-lite-preview.png). Художественная генерация выполнена imagegen; технический экспорт — Sharp.

```text
Use case: stylized-concept.
Asset type: production transparent RGBA animation atlas, 16 sprites in a strict 4 by 4 grid.
Reference image 1 is the EXACT approved female elf moon-glaive panther rider to animate. Reference image 2 is the approved healer sprite atlas, for compact game-sprite simplification and large clear pixel clusters only; DO NOT include the healer.

Make one square sprite sheet with EXACTLY 16 complete mounted rider poses, four rows and four columns, on genuine transparent alpha. The complete rider, weapon when held, panther, tail, ears and all paws must fit within the central 72% of EACH cell, with broad transparent empty gutters on all four sides. No labels, grid lines, ground, shadow, scenery, UI, particles or loose projectiles. All 16 poses use the same sprite scale, same mount size, same rider anatomy, same silver-white hair and short braid, emerald short cloak and armor, silver round shoulder pads, silver crescent forehead band, brown reins, green saddle cloth, dark navy panther with green eyes and tiny ivory fangs. Compact battle unit, big head, tiny simple face, discrete dark pixel eyes, thick stepped dark outlines, sparse flat pixel clusters, 3 or 4 shades per material. Do not add detailed fur, filigree or photorealistic textures.

The rider uses ONE three-bladed silver crescent throwing glaive with a brown circular central grip and small emerald center, matching reference 1. It is not a sword, axe, shield or polearm. Her weapon hand is on VIEWER-LEFT in the reference; the other hand stays low at the reins on VIEWER-RIGHT. Keep these roles consistent in EVERY pose. The weapon arm remains connected to that same shoulder. Never switch hands, never cross the arm over the face, no third arms. The rider remains seated, panther stays grounded.

Exact row-major animations:
ROW 1, IDLE RIGHT: four subtly different relaxed mounted poses, elevated three-quarter view facing right and slightly toward viewer. Glaive held beside her shoulder in her weapon hand. Mild breathing, one blink, very small tail movement. Do not change weapon silhouette.
ROW 2, WALK RIGHT: four distinct grounded walking foot placements in the SAME right-facing three-quarter view, alternately forward/rear paws, restrained body bob and tail sway. Glaive held in the same weapon hand beside shoulder. Feet never exceed the safe cell area.
ROW 3, THROW RIGHT: four successive THROWING phases in the SAME right-facing three-quarter view. COLUMN 1: ready with glaive beside shoulder. COLUMN 2: small compact backward wind-up of that SAME weapon arm, glaive still visibly gripped, opposite hand on reins. COLUMN 3: release, that weapon forearm extends slightly forward at shoulder height, hand OPEN AND EMPTY, glaive has left her hand and is completely ABSENT from this sprite. COLUMN 4: follow-through and recovery, the SAME hand lowered slightly and EMPTY, other hand still on reins. Do NOT draw a flying glaive, trail or any detached item inside columns 3 or 4.
ROW 4, THROW DOWN: same four throwing phases, but panther and rider face mostly toward the viewer in a frontal elevated game view. Glaive stays in VIEWER-LEFT weapon hand for ready and wind-up in columns 1 and 2. COLUMN 3 release: open EMPTY same hand and no glaive anywhere in the cell. COLUMN 4 follow-through: same hand EMPTY and no glaive anywhere. The reins hand stays on VIEWER-RIGHT. The mount has one normal feline face with two small fangs, never extra faces or duplicated legs.

The separate rotating projectile will be supplied as another asset, so do not include ANY floating glaives or particles in this character sheet. Ready/idle/walk show exactly one held glaive, release/recovery show NO glaive.
Exactly four rows and four columns, wide empty transparent margins, no clipped weapon, no neighboring-cell overlap, no scenery, no contact shadow, no text. This is a real transparent-background sprite asset, not a drawing of a sprite sheet on paper.
```
