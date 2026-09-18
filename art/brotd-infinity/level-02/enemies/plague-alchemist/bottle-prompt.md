# Летящая бутылка

Встроенный imagegen. Референс: [утверждённый концепт](plague-alchemist-concept.webp). Технический экспорт и превью выполнены через Sharp.

```text
Use case: stylized-concept. Transparent RGBA projectile sheet, exactly FOUR small POISON BOTTLE sprites in a 2 by 2 grid.
Reference is the approved Plague Alchemist; reproduce ONLY the small throwing bottle in his raised hand, not his backpack, not the character.
One round glass flask with short narrow neck, brown cork, a thin pale ivory glass rim and acid YELLOW-GREEN liquid with two large bubbles. Very simple chunky pixel art, dark stepped outline, 2 or3 discrete tones, no smooth rendering, no extra straps, labels or medical symbols. Designed to read as a small poison bottle at 20-28 pixels on screen.
Four frames of the SAME bottle tumbling clockwise: upper-left neck points UP, upper-right neck RIGHT, lower-left neck DOWN, lower-right neck LEFT. Same proportions and design in all frames; only rotation changes. Center the round flask BODY (not the whole silhouette including neck) at the same relative point in every cell. Leave broad transparent padding for the protruding neck in all orientations. Bottle occupies at most60% of each equal square cell.
Square sheet, exact2x2 layout. No rider, alchemist, background, ground, cast shadow, trails, splash, shattered glass, text, extra specks or grid. Genuine alpha transparency.
```
