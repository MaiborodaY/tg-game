# Правка отступов

В первом атласе рог в подготовке к удару соприкасался с хвостом следующего кадра. Через встроенный imagegen увеличены прозрачные промежутки при сохранении поз и дизайна. В пакете хранится исходник исправленного атласа.

```text
Use case: precise-object-edit.
Edit the attached 4x4 battle-unicorn animation atlas. Correct ONLY sprite spacing and completeness. Preserve all16 original poses, directions, proportions, character design, colors, armor, stern face, single horn, mane, tail and four-leg anatomy. Do not redesign the creature.

MANDATORY: SHRINK EVERY COMPLETE UNICORN uniformly to70% of its current size. Keep the same overall square canvas. Place each smaller full sprite centered in its OWN equal square cell in a strict4 columns by4 rows grid. Maintain the same creature scale across all16 cells. Every full silhouette including the longest forward horn, tail and extended hoof must have large genuinely transparent gutters all around. Aim for20% empty padding at each cell edge. Do not enlarge anything to fill freed space.

The current ROW3 COLUMN2 horn touches ROW3 COLUMN3 tail. Separate these two complete sprites; preserve the entire horn in cell2 and entire tail in cell3. They must have a broad transparent gap and no connecting pixels. Ensure outer left tails and right horn tips are complete and well inside the canvas rather than cropped. Both lowering-head attack frames still contain exactly ONE unicorn each.

Rows stay: four idle-right, four walk-right, four horn-attack-right (ready, anticipation, thrust, recover), four horn-attack-down/front (same phases). Keep all16 poses and their order. No extra poses, objects, ground shadow or motion effects. No grid lines, labels or background. Preserve REAL RGBA transparency. This is a surgical atlas spacing correction, not a new design.
```
