# Fighter body assets

Keep the editable PNG source outside the runtime asset tree:

`gladiator-arena/art-source/png/assets/fighters/bodies/body-light-01.png`

The runtime asset is generated into `src/assets`:

`gladiator-arena/src/assets/fighters/bodies/body-light-01.webp`

Asset requirements:

- Current source size: `768x768`.
- Aspect ratio: `1:1`.
- Transparent background.
- Feet-center pivot: `x=256`, `y=455`.
- No baked floor shadow.

Run `npm run gladiator:optimize-assets` from the repo root after changing the PNG source.
