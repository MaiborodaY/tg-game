# Правки атласа

Инструмент: встроенный imagegen. Правки выполнялись по предыдущему сгенерированному атласу; все промежуточные изображения остались в каталоге генераций. В пакете хранится только выбранный исходник.

## Исправление отступов

```text
Use case: precise-object-edit.
Edit target: input image 1, our 16-frame elven panther-rider animation atlas. Preserve the EXACT approved character design, art style, colours, mount anatomy, saddle, clothing, face, braid, all 16 poses and their row-major order. Keep true RGBA transparency.

Required layout correction: SHRINK EVERY COMPLETE SPRITE UNIFORMLY TO 70% of its current scale, including sword, tail, rider and all paws. Center the resulting smaller sprite inside its own equal square cell in a strict 4 by 4 grid, with broad genuinely transparent gaps. Keep the same overall square canvas. Each whole pose must fit comfortably inside the central 70% of its cell with empty margins ALL AROUND. The long extended sabre in row3 column3, forward paws and raised blade of row4 column2 MUST NOT enter adjacent cells. Large empty transparent padding is intentional and necessary. Do not fill the newly freed space. No drawn grid, background, shadow or labels.

One animation consistency correction: in ROW3 COLUMN2 and ROW4 COLUMN2 (wind-up frames) ensure the SAME arm holds the sabre as in their preceding ready frames; the opposite arm must remain holding reins close to the saddle. The blade arm may lift overhead but cannot swap sides or exchange props with the rein arm. Preserve a readable windup, one sabre, two arms, mounted seat and continuous action. All other pose details unchanged.

Rows remain idle right / walk right / attack right / attack toward viewer. Four frames each. Exactly16 sprites. No new elements, no redesign, no extra limbs, no background. This is a surgical atlas spacing and hand-continuity correction.
```

## Попытка сохранить руку при высоком замахе

```text
Use case: precise-object-edit.
Edit target: the attached transparent 4x4 elven panther rider atlas. Correct ONLY the two wind-up sprites: row3 column2 and row4 column2 (1-based row/column). All other14 sprites MUST stay exactly the same. Preserve canvas size, large transparent margins, exact sprite scale, all pixels of the panthers and all other costume/design details.

The elf is LEFT-HANDED: in the ready sprites, the sabre hand and arm are on the VIEWER'S RIGHT and the reins hand rests low on the VIEWER'S LEFT. The two windups incorrectly swap these roles. Redraw those TWO upper-body windup poses as follows: keep the reins hand LOW on the VIEWER'S LEFT of her torso, holding reins at the saddle, exactly as in their preceding ready sprites. Raise her sword forearm on the VIEWER'S RIGHT of her torso and bring the sabre VERTICALLY UP beside the RIGHT edge of her head, slight tilt toward upper right. This sword arm must visibly connect to the VIEWER-RIGHT shoulder as in the preceding ready frame. DO NOT raise any hand, arm or blade on the viewer-left of her head. There must be NO sword on the viewer-left. Blade stays wholly inside its cell with the existing broad padding. One sword, two arms total, two natural hands. Keep both arms on their original sides, do not cross them over the face or chest. No over-the-left-shoulder windup. Simply lift the existing viewer-right sword arm straight upwards on that same side, while viewer-left hand continues holding the reins low.
For row3 col2 keep the mount facing right; row4 col2 keep mount facing viewer. Preserve seated rider, braid, facial identity, expression, colours, chunky crisp outlines. Preserve all16 sprites and genuine RGBA transparency. No resizing, no new objects, no ground shadow, no grid, no text.
```
