# Исправления непрерывности анимации

Встроенный imagegen. В первом атласе замах менял руку, а передние кадры меняли сторону колбы за спиной. Исправление:

```text
Use case: precise-object-edit.
Edit the attached transparent 4x4 Plague Alchemist sprite sheet. Fix ONLY four inconsistent sprites: ROW3 COLUMN2, and ROW4 COLUMNS2,3,4 (one-based positions). Keep every other sprite, the entire grid layout, scale, alpha transparency, mask, proportions, colors and wide gutters unchanged.

The canonical handedness and equipment positions are visible in ROW3 COLUMN1 and ROW4 COLUMN1:
- The THROWING HAND is on VIEWER-RIGHT.
- The OTHER HAND is on VIEWER-LEFT, low on the chest harness.
- The big BACKPACK FLASK sits behind VIEWER-LEFT shoulder.
- The single spare BELT BOTTLE hangs on VIEWER-LEFT hip.
These four facts must hold in ALL 16 sprites. NEVER mirror the character. Do not change sides during an animation.

ROW3 COLUMN2: current raised bottle is on the wrong side and hides the backpack. Rebuild this pose from ROW3 COLUMN1, keeping backpack behind viewer-left shoulder and left harness hand exactly like that ready pose. The VIEWER-RIGHT bottle hand makes only a SMALL UPWARD WIND-UP, holding the small bottle vertically beside the RIGHT EDGE of the mask/head. No overhead arc, no arm on the left, no reaching across the face. Just lift the correct existing hand and bottle slightly on the same right side. Keep backpack and spare bottle visible.

ROW4 COLUMN2: start from ROW4 COLUMN1 front ready pose. Keep big backpack on LEFT, spare belt bottle on LEFT, harness hand on LEFT. Raise the existing RIGHT hand and small bottle a little higher on the RIGHT SIDE of his head. Same modest wind-up, no overhead/left arm.
ROW4 COLUMN3: same front-facing body and LEFT-side backpack as ROW4 COLUMN1; extend the RIGHT arm forward/outward on VIEWER-RIGHT with OPEN EMPTY hand. LEFT hand still grips chest harness. Spare bottle stays visible at LEFT hip. No thrown bottle floating in the cell.
ROW4 COLUMN4: same front-facing body, backpack on LEFT and spare bottle on LEFT; RIGHT hand stays EMPTY and lowers in follow-through. LEFT hand remains on harness. Restore the spare belt bottle if missing.

Preserve two arms only, same backpack bottle size and same feet as the neighboring front poses. The only bottle absent in release/recovery is the handheld projectile. Keep all 16 complete sprites, exact 4x4 layout, safe transparent gaps, and actual alpha background. No ground, shadows, text, trails or particles. This is an animation continuity correction, NOT a redesign.
```

## Second correction — restore front release/recovery equipment

Selected output: `exec-65585584-4982-479a-abc4-1b5eb6785ac5.png`, preserved as `plague-alchemist-source.png`.

The preceding correction fixed side windup and front windup but left inconsistent backpack size and the wrong recovery arm in the last row. This second edit restores those two poses.

```text
Use case: precise-object-edit. Attached image is a transparent 16-frame Plague Alchemist atlas, 4x4.
Change ONLY the last two sprites, ROW4 COLUMN3 and ROW4 COLUMN4. Preserve all other fourteen sprites, layout, dimensions, scale, colors and true transparency.

Both corrected sprites MUST keep the SAME COMPLETE EQUIPMENT and torso orientation as ROW4 COLUMN1, the front ready pose:
- full-size backpack flask with cork behind the VIEWER-LEFT shoulder, same height and width as in row4 column1,
- a spare small bottle at VIEWER-LEFT hip,
- VIEWER-LEFT gray hand gripping the chest harness,
- the throwing arm is on VIEWER-RIGHT.
Do not mirror, remove, shrink or hide the backpack. The big backpack must be clearly visible outside the left outline of the hood in both new sprites. Its cork must reach the same height as in row4 col1.

ROW4 COLUMN3: preserve its current open throwing hand extended on VIEWER-RIGHT. Restore the big backpack to the exact full size and position of row4 column1. Other hand holds harness at viewer-left; spare bottle at left hip remains.
ROW4 COLUMN4: redraw this last front sprite FROM ROW4 COLUMN1, preserving backpack flask, spare belt bottle and LEFT harness hand. Remove ONLY the small bottle from the RIGHT throwing hand, and lower that EMPTY RIGHT hand slightly to shoulder/chest height on VIEWER-RIGHT as a recovery pose. No left-side casting hand. Do not use the mirrored old last pose. It must visibly have a big backpack on the LEFT, a spare bottle on the LEFT, a harness hand on the LEFT, and an empty lowered casting hand on the RIGHT. Two arms total.

This is a narrow restoration of missing equipment and correct hand side in two frames. No flying bottle, particles, ground, text or background. Preserve all safe transparent padding and the complete 4x4 sheet.
```
