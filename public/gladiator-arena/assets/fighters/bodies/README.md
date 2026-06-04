# Runtime fighter body assets

Drop the first exported body PNG here:

`body-light-01.png`

Expected runtime URL:

`/assets/fighters/bodies/body-light-01.png`

Asset requirements:

- Exact size: `512x512`.
- Aspect ratio: `1:1`.
- Transparent background.
- Feet-center pivot: `x=256`, `y=455`.
- No baked floor shadow.

The Phaser prototype has a safe fallback. If `body-light-01.png` is missing, the old code-drawn gladiator still appears.
