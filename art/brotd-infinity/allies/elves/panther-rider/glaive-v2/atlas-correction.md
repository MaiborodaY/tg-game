# Исправление руки в момент броска

Первый атлас менял руку в боковом кадре выпуска. Выбран исправленный вариант встроенного imagegen; остальные позы сохранены визуально. Побайтового совпадения остальных кадров генератор не гарантирует.

```text
Use case: precise-object-edit.
Edit target: attached transparent 4x4 sprite sheet of the elf glaive rider on a dark panther.
Correct ONLY ROW 3 COLUMN 3 (one-based row and column, frame index 10), the side-facing throw RELEASE pose. Preserve the other fifteen sprites, their placements, size, complete mount shapes, all clothing, faces, colors and transparent gutters. Keep real alpha transparency and exactly the same square 4x4 layout.

The release currently incorrectly uses the reins arm: it extends the arm connected to the VIEWER-RIGHT silver shoulder pad. This swaps arms from the wind-up sprite immediately to its left. Fix anatomical continuity:
- The WEAPON ARM is the rider's arm rooted at the VIEWER-LEFT shoulder, the same one holding the glaive in row3 col1 and col2.
- In the corrected release, that viewer-left weapon shoulder has its arm sweep FORWARD ACROSS THE LOWER CHEST, BELOW her chin and below her face, finishing with a clearly OPEN EMPTY palm reaching toward the RIGHT. Show the forearm visibly connected across the torso to the correct viewer-left upper arm; a compact cross-body throwing follow-through.
- Her OTHER arm, rooted at the VIEWER-RIGHT silver shoulder pad, stays BENT DOWN with its brown gloved hand clearly HOLDING THE REINS LOW at the saddle, exactly like the ready and wind-up frames.
- Thus one empty casting hand pointing right, one low hand holding reins. Two arms only. No arm emerging from the wrong shoulder. Do not cover the face.
- No weapon anywhere in this corrected release cell, no detached projectile, no trail.
Keep the mount facing right, its paws, tail and entire anatomy unchanged. Keep the rider seated and proportioned as before.

No other creative changes. No new objects, no text, no background, no shadows, no grid. Preserve all transparent margins. This is one hand-continuity correction, not a redesign.
```
