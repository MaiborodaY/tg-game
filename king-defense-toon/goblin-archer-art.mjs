export const GOBLIN_ARCHER_IMAGE_URL = new URL('./assets/web/goblin-archer.webp', import.meta.url).href;

// Measured on the 1254px source: anchor to shoes, not the bow or downward arrow.
const cell = 1254 / 4;
export const GOBLIN_ARCHER_GEOMETRY = Object.freeze({
  bodyHeight: 180 / cell,
  baselines: [267, 267, 267, 267, 271, 271, 271, 271, 270, 270, 270, 270, 235.5, 235.5, 235.5, 235.5].map(y => y / cell),
  centers: [152, 163, 152, 159, 158, 159, 155, 158, 155, 157, 160, 157, 156, 160, 161, 158].map(x => x / cell),
});
