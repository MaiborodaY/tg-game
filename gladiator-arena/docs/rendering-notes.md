# Rendering Notes

## Phaser DPR baseline, 2026-06-25

Last confirmed arena diagnostics after the high-DPI Phaser canvas change and smooth rendering enabled.

| Metric | Value |
| --- | --- |
| `devicePixelRatio` | `2` |
| `rendererType` | `webgl` |
| `canvasBacking` | `722 x 1438` |
| `canvasCss` | `361 x 719` |
| `backingPerCssX` | `2` |
| `backingPerCssY` | `2` |
| `scale.widthHeight` | `722 x 1438` |
| `scale.gameSize` | `722 x 1438` |
| `scale.baseSize` | `722 x 1438` |
| `scale.displaySize` | `361 x 719` |
| `scale.parentSize` | `361 x 719` |
| `camera.viewport` | `722 x 1438` |
| `camera.zoom` | `1` |
| `rig.rootScale` | `0.16 x 0.16` |
| `rig.bounds` | `1190.27 x 1617.56` |
| `rig.boundsCssApprox` | `595.13 x 808.78` |
| `texture.head` | `head-dummy-01: 582 x 729` |
| `texture.torso` | `torso-dummy-01: 639 x 754` |
| `smoothRendering` | `true` |
| `lowEffects` | `false` |

The important render target is `backingPerCssX/Y = 2`: Phaser draws at 2x backing resolution while CSS stays at the phone-sized layout.
