# Level two undead runtime artwork

The three ordinary level-two enemies use the approved artwork committed in main at
`864b83a66bd90be2015dc72c58930d1d86d23b4d`. Their source collection and generation
prompts are in [art/brotd-infinity/level-02](../../art/brotd-infinity/level-02/README.md).
The declined skeleton axeman concept is unused.

## Runtime copies

Each `assets/web/<name>.webp` is a byte-identical copy of its canonical
`art/brotd-infinity/level-02/enemies/<name>/<name>-768-lite.webp` export. All three are
transparent 768 x 768 atlases, quality 90 WebP after the source artwork's existing
nearest-neighbor reduction. This integration performs no additional conversion.
Original PNGs, lossless review variants and opaque previews are not runtime imports.

| File stem | Runtime bytes | SHA-256 |
| --- | ---: | --- |
| skeleton-footman | 139,900 | `71c4f9fc981f9934f116eaab7312099d852ed04466105b74c3693fb5b19ee190` |
| skeleton-archer | 191,040 | `e98eeb059aa0078d3b9ac177049c535c2d54f304612413b4498f398ced66eab4` |
| ghoul | 145,084 | `fe94c99894170d4fa2f91e120b5325244f047d36e013333329d4890baaf4bf1a` |

Combined image payload: **476,024 bytes** (464.9 KiB), plus small embedded metadata.
The three decoded RGBA images nominally occupy 6.75 MiB; this is a pixel-data
calculation, not a browser memory measurement. The existing shared scene asset
promise loads and decodes each atlas once for the formation and battle canvases.
The renderer does no pixel readback, tinting, cropping export or image generation.

## Geometry and playback

[undead-art.mjs](../undead-art.mjs) embeds every supplied `*.frames.json` rectangle
without alteration. The atlas is nominally four columns and four rows, but the
explicit crop boundaries retain the raised sword, full-draw arrows and reaching
claws that extend past equal-grid boundaries. Anchor coordinates remain relative
to the nominal 192px cells so adjusted crop origins do not move the body.

All sheets contain four idle, four walk, four side-action and four down-action
poses. Melee uses the existing four-pose side/down attack timing; the archer uses
the existing four-pose shooting timing. Local pose 2 begins at the actor's combat
impact fraction. Side poses mirror for left-facing movement; upward targets use
the side-action row, since no upward-action art is supplied. Ghoul walk playback
uses 8 fps, matching the boar walk cadence. Death uses the existing fade because
these sheets contain no death animation.

Measured feet and body-center anchors exclude projecting weapons and claws.
Each ordinary enemy renders at 40 logical pixels of body height, matching its
first-level role: skeleton/goblin, skeleton archer/goblin archer, and ghoul/boar.
If an atlas fails to load, its corresponding first-level animation remains visible.

Validation: all three runtime files match their canonical exports byte for byte;
alpha, dimensions and all 48 crop rectangles were checked. Every pose was inspected
on a static contact sheet with a ground guide at twice the intended display size.
Static frame checks confirmed side/down impact and release positions against the
existing actor timing fields. Scene and metadata module syntax checks passed.
No battle simulation or browser battle run was performed, and no test files were added.
