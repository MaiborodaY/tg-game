# Генерация атласа

Последующие правки: [отступы и высокий замах](atlas-corrections.md), [короткая подготовка к удару](final-pose-prompts.md), [фронтальный удар](front-strike-prompt.md). Выбранный исходник — результат последней правки.

Инструмент: встроенный imagegen. Исходник выбранного атласа сохраняется без перерисовки; уменьшение nearest-neighbor и экспорт WebP выполняются механически через Sharp.

## Первый атлас

Референс: утверждённый `panther-rider-concept.png`.

```text
Use case: stylized-concept.
Asset type: production animation sprite atlas for the allied ELVEN PANTHER RIDER in BroTD Infinity, a mobile pixel-art game.
Input image 1 is the APPROVED CHARACTER DESIGN REFERENCE. Preserve the exact rider, mount, costume, face, hair, palette, proportions and charming chunky pixel rendering. Remove all reference scenery by generating a truly transparent RGBA background, not a drawn checkerboard.

Deliver ONE square transparent atlas: EXACTLY 16 complete mounted character sprites in a strict 4 columns x 4 rows layout, ordered left to right, then top to bottom. All four rows use the SAME character size. Very important layout: every whole mounted sprite including sabre, braid, tail and paws fits inside the CENTRAL 65% of its own cell, with at least 17% genuinely empty transparent padding at every cell edge. DO NOT maximize sprite size; LARGE transparent gutters are required. No part crosses cell borders. No grid lines, text, labels, numbers, ground shadow, contact shadow, scenery, decorations or other units.

Lock design: adult elf woman with pale face, long pointed ears, large teal eyes, thick silver-white braid, small silver/green brow band (not a crown). Emerald-green leather/cloth armour over ivory sleeves, modest silver shoulder/forearm guards, green short cape, brown gloves and riding boots, dark leggings. Exactly two arms and two legs, seated naturally astride the same small brown saddle on the panther in EVERY frame. One hand grips ONE curved silver sabre, opposite hand holds simple leather reins. Preserve visual handedness from the concept consistently when turning. Green saddle blanket with pale cream/gold trim and leaf clasp.
Panther: the SAME big powerful blue-black feline with chunky navy/blue-violet highlights, broad feline head, rounded cat ears, emerald eyes, modest natural fangs, long curling tail. Exactly FOUR anatomically plausible feline legs with clear near/far leg pairs; far legs can be partly hidden. No extra limbs, additional tail, mane, wings or hooves. The mount remains much wider than the rider.

Rows:
ROW 1 frames 0-3: IDLE RIGHT. Same slightly elevated three-quarter view facing right as the concept. Four restrained breathing frames: settled pose; chest rises slightly; tiny head/ear and tail tip adjustment; settles back toward frame0. Sabre held ready, saddle and paws grounded, no large displacement.
ROW 2 frames 4-7: WALK RIGHT. Same right-facing three-quarter view. Four distinct in-place prowling walk keyframes: near forepaw steps forward with opposite rear paw; weight passes; opposite forepaw steps forward; weight passes returning toward start. Natural cat walk, small rider vertical bob, consistent saddle attachment. The whole unit stays centered, never leaps.
ROW 3 frames 8-11: MELEE SABRE ATTACK RIGHT. Same right-facing view. Frame8 ready. Frame9 clear windup, blade lifted diagonally back while panther crouches slightly. Frame10 ONE decisive forward/down sabre cut, blade extended forward/right but comfortably INSIDE padded cell; rider leans modestly, panther does a SHORT grounded lunge with ONE front paw extended. Frame11 recovers toward ready. No huge magical arc or separate projectile; show readable blade positions.
ROW 4 frames 12-15: MELEE SABRE ATTACK DOWN, genuinely facing toward viewer / screen bottom in a slightly elevated front three-quarter view; preserve same anatomy and side holding the sabre. Frame12 front ready. Frame13 raises sabre for windup. Frame14 downward/forward cut, short grounded cat lunge. Frame15 recovery. The full tail stays visible beside/behind the mount and contained in the cell. DO NOT merely repeat the side-facing row.

Style: clean readable fantasy pixel art, dark stepped outlines, broad compact pixel clusters, few-tone shading, crisp blocky edges. Same level of detail and visual identity as approved reference, simplified only enough for animation consistency. No smooth painted rendering, 3D lighting, tiny noisy texture, blur or antialiasing halo. All sprites isolated on REAL transparency. Do not include the forest background. Exactly 16 mounted units and no extra elements.
```
