# Попадание яда

Встроенный imagegen. Референс: [утверждённый концепт](plague-alchemist-concept.webp). Технический экспорт и превью выполнены через Sharp.

```text
Use case: stylized-concept. Transparent RGBA 4-frame POISON IMPACT animation sheet for a small 2D pixel-art strategy game.
The reference Plague Alchemist shows the palette: ACID YELLOW-GREEN poison from his bottles, dark olive shadows and a few pale yellow highlights. Generate ONLY the effect, no bottle or character.
Exactly FOUR frames in a 2 by2 grid, read row-major: frame0 small sharp liquid splat at impact, frame1 a wider splat with a few large round toxic bubbles at its peak, frame2 smaller cloudy poison puff and two bubbles rising, frame3 fading residue and one small bubble. This is a brief ONE-SHOT hit effect, not a persistent ground puddle or an enormous explosion.
Small, simple, crisp low-resolution pixel-art clusters with sparse details. A few large drops and bubbles, no dozens of particles. The same impact ORIGIN is at the center of every cell; all phases expand and fade around that point. Entire effect stays within the central60% of each equal square cell. Large empty alpha gutters. Few shades and partial alpha for the final fading phase.
No skull icons, healing crosses, leaves, flowers, smoke column, lightning, fire, red blood, broken glass, ground, shadow, background, borders, labels or text. Real alpha transparency, exactly four effect frames on one square sheet.
```
