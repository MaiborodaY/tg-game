# Boar

`boar/Boar.png` is an unchanged copy of the user-supplied native sprite sheet at
`C:/Unity/Unity Projects/Bro TD/Assets/Sprites/Enemies/Boar/Boar.png`.
The source Unity project is not modified. The runtime loads `web/boar.webp`, a lossless
export at the same resolution: 835,098 bytes instead of the PNG's 1,061,564 bytes.
Decoded alpha and all visible pixel colors match the original; no new artwork is generated.

The transparent PNG is 1448 x 1086, with four columns and three rows of 362px cells.
Frame names, ordering and playback rates were checked against `Boar.png.meta` and
the clips in `C:/Unity/Unity Projects/Bro TD/Assets/Animations/Enemies/Boar/`:

| Runtime frames | Unity sprites | Playback |
| --- | --- | --- |
| 0-3 | `Boar_Idle_00` through `03` | 4 fps, loop |
| 4-7 | `Boar_Run_00` through `03` | 8 fps, loop |
| 8-11 | `Boar_Attack_00` through `03`, clip `Attack_Down` | One attack cycle |

All poses face right. The renderer mirrors them when facing left. The sheet contains
one attack row only, so every attack direction uses that head-lowering/lunge sequence.
Attack pose 2 (runtime frame 10) begins at the combat impact fraction, default 0.5:
0.4 seconds into the base 0.8-second attack. The shared 0.85 combat pace extends these
to approximately 0.471 and 0.941 seconds. The animal does not receive the generic sword slash.
There is no death row; the existing enemy fade uses idle pose 0.

The source has no painted ground shadow; the scene supplies its usual small shadow.
Rendering uses nearest-neighbor sampling and a fixed 240px body scale for an approximately
40px-tall idle body. Per-pose hoof baselines compensate for unequal transparent padding;
the common horizontal origin matches the Unity slice center at local x=190.
The impact snout extends 3px beyond its nominal cell. Source rectangles preserve it and
exclude its fragment from the recovery pose without changing the PNG.

Validation uses module syntax and focused frame-selection checks. Browser battle checking
is deliberately left to the user.
