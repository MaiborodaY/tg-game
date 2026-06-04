# Fighter asset template

This folder contains the source guide for modular gladiator paper-doll assets.

Use `fighter-template.svg` as the alignment reference when drawing or generating parts.

Rules:

- Canvas size: `512x512`.
- Pivot: feet-center at `x=256`, `y=455`.
- Keep every exported part on the same `512x512` transparent canvas.
- Do not crop individual layers.
- Do not move the body between layers.
- Do not bake shadows into equipment layers.
- Keep outlines and lighting consistent between parts.

Recommended layer order:

1. `body`
2. `legs`
3. `boots`
4. `torso`
5. `arms`
6. `head`
7. `hair`
8. `helmet`
9. `weapon`
10. `shield`

First test pack:

- `body-light-01.png`
- `head-basic-01.png`
- `hair-brown-messy-01.png`
- `helmet-roman-red-01.png`
- `torso-leather-01.png`
- `legs-cloth-01.png`
- `boots-leather-01.png`
- `weapon-short-sword-01.png`
- `shield-round-wood-01.png`

The template itself is not a runtime asset. It is a ruler for creating aligned PNG layers.
