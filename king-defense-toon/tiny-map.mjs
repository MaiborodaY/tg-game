import { FIELD, BATTLE_VIEW, ROYAL_PENINSULA, ROYAL_NECK } from './field.mjs';

const WIDTH = FIELD.width;
const HEIGHT = FIELD.height;
const TILE = 32;
const ORIGIN = { x: 3, y: -4 };
const WATER_COLOR = '#47aba9';

const ASSETS = {
  ground: new URL('./assets/tiny-map/ground.png', import.meta.url).href,
  water: new URL('./assets/tiny-map/water.png', import.meta.url).href,
  tree: new URL('./assets/tiny-map/tree.png', import.meta.url).href,
  castle: new URL('./assets/tiny-map/castle-blue.png', import.meta.url).href,
  rock: new URL('./assets/tiny-map/rock.png', import.meta.url).href,
  bush: new URL('./assets/tiny-map/bush.png', import.meta.url).href,
  mushroom: new URL('./assets/tiny-map/mushroom.png', import.meta.url).href,
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load Tiny Swords map asset: ${url}`));
    image.src = url;
  });
}

function makeLayer() {
  const canvas = document.createElement('canvas');
  canvas.width = BATTLE_VIEW.width;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.translate(-BATTLE_VIEW.x, 0);
  return { canvas, context };
}

function onLand(col, row) {
  if (row < -1 || row > 17) return false;
  const inset = row < 5 ? 1 : 0;
  return col >= inset && col < 12 - inset;
}

function onRoad(col, row) {
  if (row < -1 || row > 17) return false;
  const inset = row < 3 ? 4 : row < 4 ? 3 : row < 6 ? 2 : row < 14 ? 1 : 3;
  return col >= inset && col < 12 - inset;
}

// The source pack's 64px terrain cells stay intact; 32px placement matches the warrior's half scale.
function drawTerrain(context, ground, hasTile, sourceX = 0) {
  for (let row = -1; row <= 17; row += 1) {
    for (let col = 0; col < 12; col += 1) {
      if (!hasTile(col, row)) continue;
      const left = hasTile(col - 1, row);
      const right = hasTile(col + 1, row);
      const above = hasTile(col, row - 1);
      const below = hasTile(col, row + 1);
      const sx = !left ? 0 : !right ? 2 : 1;
      const sy = !above ? 0 : !below ? 2 : 1;
      context.drawImage(ground, sourceX + sx * 64, sy * 64, 64, 64,
        ORIGIN.x + col * TILE, ORIGIN.y + row * TILE, TILE, TILE);
    }
  }
}

function decoration(context, image, x, y, scale = 0.5) {
  context.drawImage(image, Math.round(x), Math.round(y),
    Math.round(image.naturalWidth * scale), Math.round(image.naturalHeight * scale));
}

function grassPatch(context, ground, bounds) {
  const edge = 12;
  const widths = [edge, bounds.right - bounds.left - edge * 2, edge];
  const heights = [edge, bounds.bottom - bounds.top - edge * 2, edge];
  let y = bounds.top;
  for (let row = 0; row < 3; row += 1) {
    let x = bounds.left;
    for (let col = 0; col < 3; col += 1) {
      // Repeat the interior texture; only the small coastal caps use nine-slice scaling.
      for (let dy = 0; dy < heights[row]; dy += row === 1 ? TILE : heights[row]) {
        const h = Math.min(row === 1 ? TILE : heights[row], heights[row] - dy);
        for (let dx = 0; dx < widths[col]; dx += col === 1 ? TILE : widths[col]) {
          const w = Math.min(col === 1 ? TILE : widths[col], widths[col] - dx);
          context.drawImage(ground, col * 64, row * 64, col === 1 ? w * 2 : 64,
            row === 1 ? h * 2 : 64, x + dx, y + dy, w, h);
        }
      }
      x += widths[col];
    }
    y += heights[row];
  }
}

const TREES = [
  { x: 19, y: 62, scale: 0.5, phase: 0 },
  { x: 287, y: 34, scale: 0.5, phase: 1.7 },
  { x: 7, y: 171, scale: 0.375, phase: 0.8 },
  { x: 333, y: 251, scale: 0.375, phase: 2.5 },
];

/** A lightweight Tiny Swords battlefield. Coordinates and deployment cells remain gameplay-owned. */
export async function createTinyMap() {
  const assets = Object.fromEntries(await Promise.all(
    Object.entries(ASSETS).map(async ([key, url]) => [key, await loadImage(url)]),
  ));
  const sea = makeLayer();
  sea.context.fillStyle = WATER_COLOR;
  sea.context.fillRect(BATTLE_VIEW.x, 0, BATTLE_VIEW.width, HEIGHT);
  for (let y = 0; y < HEIGHT; y += 32) {
    for (let x = BATTLE_VIEW.x; x < BATTLE_VIEW.x + BATTLE_VIEW.width; x += 32) {
      sea.context.drawImage(assets.water, x, y, 32, 32);
    }
  }

  const terrain = makeLayer();
  drawTerrain(terrain.context, assets.ground, onLand);
  const road = makeLayer();
  drawTerrain(road.context, assets.ground, onRoad, 320);
  // Calm the repeating sand highlights while retaining the source tiles' native pixel edge masks.
  road.context.globalCompositeOperation = 'source-atop';
  road.context.fillStyle = 'rgba(223, 203, 154, 0.52)';
  road.context.fillRect(0, 0, WIDTH, HEIGHT);
  terrain.context.drawImage(road.canvas, BATTLE_VIEW.x, 0);

  const approach = document.createElement('canvas');
  approach.width = BATTLE_VIEW.width;
  approach.height = TILE;
  approach.getContext('2d').drawImage(terrain.canvas, 0, 0, BATTLE_VIEW.width, TILE,
    0, 0, BATTLE_VIEW.width, TILE);

  // Keep every deployment cell and the central king lane clear of scenery.
  for (const [x, y] of [[91, 23], [304, 149], [37, 156], [342, 396], [12, 348]]) {
    decoration(terrain.context, assets.bush, x, y);
  }
  for (const [x, y] of [[83, 104], [303, 202], [1, 271], [350, 326], [82, 490]]) {
    decoration(terrain.context, assets.rock, x, y);
  }
  for (const [x, y] of [[48, 142], [324, 122], [23, 319], [352, 429]]) {
    decoration(terrain.context, assets.mushroom, x, y);
  }
  grassPatch(terrain.context, assets.ground, ROYAL_PENINSULA);
  grassPatch(terrain.context, assets.ground, { ...ROYAL_NECK, left: -12 });
  // Open just this coast segment. The rest of the water channel stays unobstructed.
  terrain.context.drawImage(assets.ground, 64, 64, 64, 32, -16, 400, 52, 16);
  decoration(terrain.context, assets.castle, -58, 304, 0.1875);

  return {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: WATER_COLOR,
    draw(context, time = 0, bounds = {}) {
      const seconds = Number.isFinite(time) ? time : 0;
      context.save();
      context.imageSmoothingEnabled = false;
      context.drawImage(sea.canvas, BATTLE_VIEW.x, 0);
      // Tall phones extend the existing approach above the map, never the removed footer.
      for (let y = -TILE; y >= Math.floor((bounds.top ?? 0) / TILE) * TILE; y -= TILE) {
        context.drawImage(approach, BATTLE_VIEW.x, y);
      }
      // Sparse two-pixel glints remain in the exposed water and drift much slower than unit motion.
      context.fillStyle = '#a2d7ca';
      for (const [index, [x, y]] of [[8, 37], [19, 96], [9, 143], [364, 59], [376, 125]].entries()) {
        const drift = Math.round(Math.sin(seconds * 0.35 + index * 1.6) * 3);
        context.globalAlpha = 0.18 + (Math.sin(seconds * 0.7 + index) + 1) * 0.07;
        context.fillRect(x + drift, y, 6, 1);
        context.fillRect(x + 3 + drift, y + 3, 3, 1);
      }
      context.globalAlpha = 1;
      context.drawImage(terrain.canvas, BATTLE_VIEW.x, 0);
      for (const tree of TREES) {
        const frame = Math.floor((seconds + tree.phase) * 4) % 6;
        const size = Math.round(192 * tree.scale);
        context.drawImage(assets.tree, (frame % 4) * 192, Math.floor(frame / 4) * 192,
          192, 192, tree.x, tree.y, size, size);
      }
      context.restore();
    },
  };
}
