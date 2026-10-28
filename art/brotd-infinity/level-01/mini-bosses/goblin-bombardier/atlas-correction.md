# Исправление отступов атласа

Встроенный imagegen. В первом атласе вспышка выстрела подходила к соседнему кадру слишком близко: проверка дала отступ всего 1 пиксель при размере 768. Эта попытка не включена в итоговый комплект.

Выбранный исправленный источник: `exec-79d6be77-12aa-4aad-8857-17fea831eec8.png`.

```text
Use case: precise-object-edit. This is a TRANSPARENT 4x4 goblin bombardier battle atlas with sixteen complete poses. Preserve the approved character, cannon, cart, red hood, goggles, bombs, animation sequence, colors, pixel style and actual transparency.

The firing flash in row3 column3 is too close to the next sprite: there is almost no safe cutting gap. Fix PACKING AND PADDING ONLY across the entire atlas.
Keep exactly FOUR equal columns by FOUR equal rows, same canvas size. Make ALL sixteen complete sprites uniformly 80 PERCENT OF THEIR CURRENT DRAWN SIZE. This means both goblin and cannon/cart, all wheels, bombs, muzzle flash and smoke scale together; do not shrink just one part. Put each smaller complete sprite comfortably centered in its own equal cell. Align wheel bottoms at a consistent baseline near local y=85% of cell height. Keep muzzle flash and smoke inside the same cell with at least 10% completely transparent margin. The widest silhouette in the firing row must have a clear empty gap before the following recovery pose.
Keep the flash compact, attached directly to the muzzle and no larger than the muzzle diameter; remove stray detached sparks between cells. Do not change animation poses or hand occupancy: row3 and row4 pose0 have one bomb in hand; pose1/2/3 have empty hands on cart and retain two strapped spare bombs. Keep the wheel spoke variations in roll row2.
Every part of every unit must remain complete. Do not crop, mirror, redesign, add poses, fill the background, add shadows, checkerboard or grid lines. This is a narrow uniform-size-and-safe-gutters correction of this exact atlas.
```
