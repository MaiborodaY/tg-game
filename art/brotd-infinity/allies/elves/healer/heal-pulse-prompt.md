# Эффект лечения на союзнике

Инструмент: встроенный imagegen. Четыре фазы отдельного эффекта на прозрачном фоне. При нарезке каждому кадру задана собственная точка центра наземного кольца: генерация не выдержала одинаковую позицию внутри всех четырёх ячеек.

```text
Use case: stylized-concept.
Asset type: small TRANSPARENT game healing VFX sprite atlas, FOUR animation frames in a precisely equal TWO by TWO grid, square canvas. No character sprites.
Reference image is the approved compact elf healer: use ONLY its mint-green/ivory healing palette and simple low-resolution pixel language. Do not include the healer, staff, robe, scenery, terrain or any body parts.
Effect: a tiny restorative green ground pulse around an allied unit's feet, with a small pale healing sparkle and one or two leaf motes drifting upward. Gentle nature healing, no attack, no lightning, fire, weapon, explosion, ornate rune or large pillar of light.
Keep all frames on the SAME pixel grid and fixed ground origin at 50% of each cell width and 75% of its height. Ground oval stays at that exact origin in all four frames. Peak oval at most 55% of cell width and 14% of cell height. Leaves and sparkle rise no higher than 25% of cell height. At least 18% EMPTY TRANSPARENT gutters to all cell edges. Each effect entirely inside its own quadrant; no overlap, no cropped pixels.
Four DISTINCT sequential frames, read left-to-right then top-to-bottom:
1 top left — a tiny dim mint oval begins at the fixed ground origin, one small pale spark just above it.
2 top right — oval expands to medium size and brightens, one small green leaf rises and a tiny ivory plus-shaped healing sparkle appears above the ring.
3 bottom left — peak pulse, broad clean mint oval with an ivory accent segment, one small bright healing sparkle and TWO tiny green leaves floating above, all simple crisp pixel clusters.
4 bottom right — pulse dissipates: dim broken arc remains at the SAME ground origin, sparkle gone, just two small leaf motes continuing slightly higher. Fading with reduced alpha, not black paint.
Draw deliberately as tiny pixel-art game VFX, readable at roughly 32-40 pixels across. Flat hard-edged clusters, only 3-4 colors (deep green, mint, pale mint, ivory), no gradients or soft bloom, no photoreal texture. Transparent empty background with actual alpha, not solid black and not a checkerboard pattern. NO labels, frame lines, text, UI, unrelated symbols, additional rows, characters, ground shadows or scenery.
```
