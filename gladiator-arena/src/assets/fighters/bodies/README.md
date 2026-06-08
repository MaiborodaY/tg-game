# Fighter body assets

Keep the editable PNG source here:

`body-light-01.png`

The runtime asset is generated next to it and imported from `src/assets`:

`body-light-01.webp`

Asset requirements:

- Current source size: `768x768`.
- Aspect ratio: `1:1`.
- Transparent background.
- Feet-center pivot: `x=256`, `y=455`.
- No baked floor shadow.

Run `npm run gladiator:optimize-assets` from the repo root after changing the PNG source.
