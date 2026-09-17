# Tiny Swords blue monk

These are unchanged PNG files by Pixel Frog, copied from the user's local Tiny Swords Free Pack. This pack contains the blue Monk with a healing animation; the nearby Update 010 pack used for the warrior does not contain this unit. No generated or recolored replacement was used.

Local source directory:

`C:/Unity/Unity Projects/AssetsUnity/BroTD Assets/v2/Tiny Swords (Free Pack)/Tiny Swords (Free Pack)/Units/Blue Units/Monk/`

Author's pack page: https://pixelfrog-assets.itch.io/tiny-swords

| File | PNG dimensions | Cell | Local frame indices | Source animation tag |
| --- | --- | --- | --- | --- |
| Idle.png | 1152 x 192 | 192 x 192 | 0-5 | Idle, source frames 0-5 |
| Run.png | 768 x 192 | 192 x 192 | 0-3 | Run, source frames 6-9 |
| Heal.png | 2112 x 192 | 192 x 192 | 0-10 | Heal, source frames 10-20 |
| Heal_Effect.png | 2112 x 192 | 192 x 192 | 0-10 | Heal Effect, source frames 21-31 |

All strips have one row. Tags and 100 ms frame durations were read directly from the local source `Units/Units (aseprite in Blue only)/Monk.aseprite` (192 x 192 cells, 32 total frames). The Aseprite file remains in the original collection.

## Anchoring and healing motion

The runtime uses one fixed origin for every animation: x=96, y=128, aligned with the warrior and archer's ground anchor at half native scale. The visible bottommost pixel is y=133, slightly below the anchor. Do not center each frame by its opaque bounds: the arms and sparkles widen during healing. The standing body occupies approximately 69 px vertically, with idle opaque bounds x=67..124, y=65..133. Walking keeps the same origin and the built-in leg motion.

Heal frame 0 is folded hands; frame 1 opens the arms; frame 2 starts visible healing sparkles; frames 3-6 extend both arms and build the glow; frames 7-9 wind down; frame 10 returns to the idle pose. The separate Heal_Effect strip can be drawn on the healing recipient and contains no monk body. The casting pose is not an attack animation.

The game currently loads Idle, Run and Heal. Heal_Effect is retained as an optional source asset; the existing healing trail remains in use with its origin aligned to the monk's hands.

## Copy integrity (SHA256)

Source and destination hashes were checked after copying. The PNGs were not altered.

```text
Idle.png        A72CC63BE3151C3AF61E8F8C86129B8A0C563C8731E04AE89A27E616BB6CB962
Run.png         F7CDCEF69AD17E9677BBF0B288B416CFD86AE0231F625A16C10000EC8EA375E6
Heal.png        6620F483DCDE826628E1754B57445B2FA4C36C077BAC3FA1C6B3D828E55FBDE5
Heal_Effect.png 2635DD7445D573E878B578ECCE858484B4D2889268819EC35657CF416F8AAF33
```
