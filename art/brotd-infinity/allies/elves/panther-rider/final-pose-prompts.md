## Сдержанная подготовка к удару

Высокий замах заменён короткой подготовительной позой: рука с саблей сохраняет положение, пантера приседает перед выпадом.

```text
Use case: precise-object-edit.
This is an exact cell-replacement edit to an existing transparent 4x4 sprite atlas. Keep all unaffected cells unchanged, keep original transparent padding, size and character design.

CHANGE TWO CELLS ONLY:
1) In row3 column2, DELETE the rider's existing raised-arm upper body. Replace it with the upper body of the rider FROM ROW3 COLUMN1, retaining that source pose's original two arms and hands: sabre held forward at the RIGHT side of the image, reins held low at LEFT. Copy that upper body faithfully. The panther underneath can stay slightly crouched. This is a low anticipation pose, NOT an overhead windup. The sword stays forward/right just like row3column1, nowhere near the left edge of the head.
2) In row4 column2, DELETE the rider's existing raised-arm upper body. Replace it with the upper body FROM ROW4 COLUMN1, retaining that source pose's original two arms, hands and sabre on the RIGHT side of the image; opposite hand holding reins LOW at the LEFT of the torso. The panther can remain crouched. Again, a LOW ready/anticipation pose, NOT a raised-arm pose.

There must be NO raised arm or sword to the LEFT of the head in either edited cell. No overhead sword at all. Both edited riders should now resemble their directly preceding ready sprites. Exact original arm and hand positions are more important than pose variation. This intentionally changes the windups to restrained low ready poses to maintain visual continuity. Preserve the mount, seat attachment and all original transparent margins.
Leave all other14 cells as they are. One 4x4 atlas, 16sprites, true transparency, no text, no grid, no new elements.
```
