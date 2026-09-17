# Направление фронтального удара

Последняя правка сохраняет саблю в той же руке, что и в ожидании: клинок проходит сбоку от головы пантеры.

```text
Use case: precise-object-edit.
Edit target: the transparent 4x4 atlas in input image1. Correct ONE CELL ONLY: BOTTOM ROW, THIRD COLUMN (row4 col3). All other15 complete sprites must remain unchanged. No resizing or moving cells. Preserve transparent margins and exact character identity and style.

In the bottom row third column, the sword is accidentally in the wrong hand. Replace that rider's upper-body pose using the same arm assignment as bottom row FIRST column:
- VIEWER-LEFT arm remains low, bent with the brown-gloved hand gripping reins beside the saddle. This arm must NOT hold the sabre.
- VIEWER-RIGHT shoulder, arm and hand hold the sabre. Bring THIS VIEWER-RIGHT forearm forward and DOWN in a clear strike beside the RIGHT side of the panther's head. Keep the whole sword hand, hilt and blade to the RIGHT of the rider's and panther's facial centerline. The curved blade points down-right, its tip approximately level with the top of the panther's front paw and comfortably inside the padded cell.
- No sword or sword hand over the CENTER or LEFT side of the panther's forehead. Do not cross the arms. Keep the dark panther's face fully visible.
- Keep the rider leaning slightly forward for the attack, with exactly two arms. Preserve the panther lunge and all of its body pixels.

This is a SIDE-OF-HEAD downward cut with the viewer-RIGHT arm, not a cross-body cut. Use the immediately preceding bottom-row second sprite as the source of correct arm and hand positions; lower only its viewer-right sword forearm to create the strike. Preserve full elf face, silver braid, emerald costume, saddle, palette and all15 other cells. Real RGBA transparency, no labels, no extra objects.
```
