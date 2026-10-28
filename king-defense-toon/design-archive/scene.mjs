import { UNIT_TYPE_BY_ID } from './units.mjs';

export const FIELD = Object.freeze({
  width: 390,
  height: 540,
  gridX: 50,
  gridY: 270,
  columns: 5,
  rows: 3,
  cellWidth: 58,
  cellHeight: 55,
  kingX: 195,
  kingFeet: 493,
});

const MAP_URL = new URL('./assets/battlefield-toon.png', import.meta.url).href;
const ATLAS_URL = new URL('./assets/units-toon-infantry-v3.png', import.meta.url).href;
const INK = '#233733';
const CREAM = '#fbf8ed';
const GOLD = '#f4cf64';

function roundedRect(context, x, y, width, height, radius = 6) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function loadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function cleanAtlas(image) {
  if (!image) return null;
  const scratch = document.createElement('canvas');
  scratch.width = image.naturalWidth ?? image.width;
  scratch.height = image.naturalHeight ?? image.height;
  const context = scratch.getContext('2d', { willReadFrequently: true });
  if (!context) return image;
  context.drawImage(image, 0, 0);
  try {
    const frame = context.getImageData(0, 0, scratch.width, scratch.height);
    const pixels = frame.data;
    // The generated atlas uses a dedicated magenta key; preserve all other colors.
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      if (red > 90 && blue > 90 && green < 100 && Math.min(red, blue) > green + 55) {
        pixels[offset + 3] = 0;
      }
    }
    context.putImageData(frame, 0, 0);
    return scratch;
  } catch {
    return image;
  }
}

function spriteBounds(image) {
  if (!image) return [];
  const scratch = document.createElement('canvas');
  scratch.width = image.naturalWidth ?? image.width;
  scratch.height = image.naturalHeight ?? image.height;
  const context = scratch.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(image, 0, 0);
  const cellWidth = scratch.width / 4;
  const cellHeight = scratch.height / 2;
  let pixels;
  try {
    pixels = context.getImageData(0, 0, scratch.width, scratch.height).data;
  } catch {
    return [];
  }
  const visited = new Uint8Array(scratch.width * scratch.height);
  return Array.from({ length: 8 }, (_, index) => {
    const startX = Math.floor((index % 4) * cellWidth);
    const startY = Math.floor(Math.floor(index / 4) * cellHeight);
    const endX = Math.floor(startX + cellWidth);
    const endY = Math.floor(startY + cellHeight);
    const queue = new Int32Array((endX - startX) * (endY - startY));
    let largest = null;
    let largestSize = 0;
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const start = y * scratch.width + x;
        if (visited[start] || pixels[start * 4 + 3] < 40) continue;
        let left = x;
        let right = x;
        let top = y;
        let bottom = y;
        let head = 0;
        let size = 1;
        queue[0] = start;
        visited[start] = 1;
        while (head < size) {
          const point = queue[head++];
          const pointX = point % scratch.width;
          const pointY = Math.floor(point / scratch.width);
          left = Math.min(left, pointX);
          right = Math.max(right, pointX);
          top = Math.min(top, pointY);
          bottom = Math.max(bottom, pointY);
          for (let nearY = Math.max(startY, pointY - 1); nearY <= Math.min(endY - 1, pointY + 1); nearY += 1) {
            for (let nearX = Math.max(startX, pointX - 1); nearX <= Math.min(endX - 1, pointX + 1); nearX += 1) {
              const next = nearY * scratch.width + nearX;
              if (visited[next] || pixels[next * 4 + 3] < 40) continue;
              visited[next] = 1;
              queue[size++] = next;
            }
          }
        }
        // A neighboring figure can cross the cell edge; only this cell's main figure defines its crop.
        if (size > largestSize) {
          largestSize = size;
          largest = { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
        }
      }
    }
    return largest;
  });
}

function createUnitImages(atlas, bounds) {
  const images = new Map();
  if (!atlas) return images;
  for (const [type, column] of Object.entries({ swordsman: 0, archer: 1, healer: 2, king: 3 })) {
    const sprite = bounds[column];
    if (!sprite) continue;
    const portrait = document.createElement('canvas');
    portrait.width = 128;
    portrait.height = 128;
    const context = portrait.getContext('2d');
    if (!context) continue;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    // Show the entire compact character, including the equipment that distinguishes its class.
    const portraitScale = Math.min(120 / sprite.width, 122 / sprite.height);
    const portraitWidth = sprite.width * portraitScale;
    const portraitHeight = sprite.height * portraitScale;
    context.drawImage(atlas, sprite.x, sprite.y, sprite.width, sprite.height,
      (128 - portraitWidth) / 2, 125 - portraitHeight, portraitWidth, portraitHeight);

    const art = document.createElement('canvas');
    art.width = 128;
    art.height = 160;
    const artContext = art.getContext('2d');
    if (!artContext) continue;
    artContext.imageSmoothingEnabled = true;
    artContext.imageSmoothingQuality = 'high';
    const scale = Math.min(116 / sprite.width, 148 / sprite.height);
    const width = sprite.width * scale;
    const height = sprite.height * scale;
    artContext.drawImage(atlas, sprite.x, sprite.y, sprite.width, sprite.height,
      (128 - width) / 2, 154 - height, width, height);
    images.set(type, { portrait: portrait.toDataURL('image/png'), art: art.toDataURL('image/png') });
  }
  return images;
}

export function cellAtPoint(x, y) {
  const col = Math.floor((x - FIELD.gridX) / FIELD.cellWidth);
  const row = Math.floor((y - FIELD.gridY) / FIELD.cellHeight);
  if (col < 0 || col >= FIELD.columns || row < 0 || row >= FIELD.rows) return null;
  return { col, row };
}

function drawFallbackMap(context) {
  context.fillStyle = '#94b877';
  context.fillRect(0, 0, FIELD.width, FIELD.height);
  context.fillStyle = '#bcbb82';
  context.fillRect(45, 0, 300, FIELD.height);
  context.fillStyle = '#d9c68f';
  context.fillRect(47, 0, 296, FIELD.height);
  context.fillStyle = '#e6d5a6';
  context.fillRect(73, 0, 244, FIELD.height);
}

function drawMap(context, map, viewportWidth = FIELD.width, viewportHeight = FIELD.height, offsetX = 0, offsetY = 0) {
  if (!map) {
    context.fillStyle = '#94b877';
    context.fillRect(-offsetX, -offsetY, viewportWidth, viewportHeight);
    drawFallbackMap(context);
    return;
  }
  // Cover the panel with one image scale. Keep the entrance at the top; crop scenery, never stretch it.
  const scale = Math.max(viewportWidth / map.naturalWidth, viewportHeight / map.naturalHeight);
  const width = map.naturalWidth * scale;
  const height = map.naturalHeight * scale;
  context.drawImage(map, (viewportWidth - width) / 2 - offsetX, -offsetY, width, height);
}

function drawFallbackUnit(context, type, x, feet, isKing) {
  context.strokeStyle = INK;
  context.lineWidth = 2;
  context.lineJoin = 'round';
  context.fillStyle = isKing ? '#bd655b' : UNIT_TYPE_BY_ID[type]?.color ?? '#88b4c1';
  roundedRect(context, x - 12, feet - 30, 24, 28, 8);
  context.fill();
  context.stroke();
  context.fillStyle = CREAM;
  context.beginPath();
  context.ellipse(x, feet - 36, 11, 12, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = INK;
  roundedRect(context, x - 11, feet - 5, 9, 6, 2);
  context.fill();
  roundedRect(context, x + 2, feet - 5, 9, 6, 2);
  context.fill();
}

function drawUnit(context, atlas, bounds, type, x, feet, isKing = false) {
  context.save();
  context.fillStyle = '#50684138';
  context.beginPath();
  context.ellipse(x, feet, 14, 3, 0, 0, Math.PI * 2);
  context.fill();
  const column = isKing ? 3 : UNIT_TYPE_BY_ID[type]?.spriteColumn ?? 0;
  const sprite = bounds[column + 4];
  if (atlas && sprite) {
    // Trim transparent padding so every generated atlas cell has the same visual scale.
    const targetHeight = isKing ? 53 : 49;
    const scale = Math.min(targetHeight / sprite.height, 53 / sprite.width);
    const width = sprite.width * scale;
    const height = sprite.height * scale;
    context.drawImage(atlas, sprite.x, sprite.y, sprite.width, sprite.height,
      x - width / 2, feet - height, width, height);
  } else {
    drawFallbackUnit(context, type, x, feet, isKing);
  }
  context.restore();
}

function drawKing(context, atlas, bounds, selected) {
  const x = FIELD.kingX;
  const feet = FIELD.kingFeet;
  if (selected) {
    context.fillStyle = '#fff2bc50';
    roundedRect(context, x - 29, feet - 56, 58, 62, 10);
    context.fill();
    context.strokeStyle = '#6d8e55';
    context.lineWidth = 2;
    context.stroke();
  }
  drawUnit(context, atlas, bounds, 'king', x, feet, true);
  roundedRect(context, x - 41, feet + 8, 82, 24, 7);
  context.fillStyle = INK;
  context.fill();
  context.fillStyle = GOLD;
  context.beginPath();
  context.moveTo(x - 33, feet + 21);
  context.lineTo(x - 35, feet + 12);
  context.lineTo(x - 30, feet + 16);
  context.lineTo(x - 27, feet + 11);
  context.lineTo(x - 24, feet + 16);
  context.lineTo(x - 19, feet + 12);
  context.lineTo(x - 21, feet + 21);
  context.closePath();
  context.fill();
  context.fillStyle = '#91c96b';
  roundedRect(context, x - 35, feet + 25, 70, 3, 1.5);
  context.fill();
  context.font = '11px "Lilita One", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = CREAM;
  context.fillText('120 / 120', x + 8, feet + 17.5);
}

export async function createScene(canvas, { onCell = () => {}, onKing = () => {} } = {}) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  const [map, sourceAtlas] = await Promise.all([loadImage(MAP_URL), loadImage(ATLAS_URL)]);
  const atlas = cleanAtlas(sourceAtlas);
  const bounds = spriteBounds(atlas);
  const unitImages = createUnitImages(atlas, bounds);
  let destroyed = false;
  let state = { units: [], selectedId: null, placementType: null };

  function viewportFor(rect) {
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    return {
      scale,
      x: (rect.width - FIELD.width * scale) / 2,
      y: (rect.height - FIELD.height * scale) / 2,
    };
  }

  function draw() {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round((rect.width || FIELD.width) * dpr));
    const height = Math.max(1, Math.round((rect.height || FIELD.height) * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const viewport = viewportFor(rect);
    if (!viewport.scale) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    // One scale keeps terrain, formation cells, sprites and their labels in the same proportions.
    context.setTransform(viewport.scale * dpr, 0, 0, viewport.scale * dpr,
      viewport.x * dpr, viewport.y * dpr);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    drawMap(context, map, rect.width / viewport.scale, rect.height / viewport.scale,
      viewport.x / viewport.scale, viewport.y / viewport.scale);
    const occupied = new Map(state.units.map((unit) => [`${unit.col}:${unit.row}`, unit]));
    for (let row = 0; row < FIELD.rows; row += 1) {
      for (let col = 0; col < FIELD.columns; col += 1) {
        const unit = occupied.get(`${col}:${row}`);
        const x = FIELD.gridX + col * FIELD.cellWidth + 2;
        const y = FIELD.gridY + row * FIELD.cellHeight + 2;
        const width = FIELD.cellWidth - 4;
        const height = FIELD.cellHeight - 4;
        const selected = unit && unit.id === state.selectedId;
        const available = !unit && state.placementType;
        context.fillStyle = selected ? '#fff0b977' : available ? '#e6f2ce66' : '#e5e8c829';
        roundedRect(context, x, y, width, height, 7);
        context.fill();
        context.strokeStyle = selected ? '#5e8f4e' : available ? '#719156' : '#63845680';
        context.lineWidth = selected ? 2.2 : 1;
        context.setLineDash(available ? [3, 3] : []);
        context.stroke();
        context.setLineDash([]);
        if (unit) {
          const centerX = FIELD.gridX + col * FIELD.cellWidth + FIELD.cellWidth / 2;
          const feet = FIELD.gridY + (row + 1) * FIELD.cellHeight - 5;
          drawUnit(context, atlas, bounds, unit.type, centerX, feet);
          const maxHp = unit.maxHp ?? Math.round((UNIT_TYPE_BY_ID[unit.type]?.hp ?? 1) * (1 + ((unit.level ?? 1) - 1) * 0.25));
          const health = Math.max(0, Math.min(1, (unit.hp ?? maxHp) / Math.max(1, maxHp)));
          context.fillStyle = INK;
          roundedRect(context, centerX - 14, feet - 53, 28, 4, 1.5);
          context.fill();
          context.fillStyle = '#91c96b';
          context.fillRect(centerX - 13, feet - 52, 26 * health, 2);
          context.fillStyle = CREAM;
          context.strokeStyle = INK;
          context.lineWidth = 1;
          context.beginPath();
          context.arc(x + width - 6, y + height - 6, 6, 0, Math.PI * 2);
          context.fill();
          context.stroke();
          context.font = '9px "Lilita One", sans-serif';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillStyle = INK;
          context.fillText(String(unit.level ?? 1), x + width - 6, y + height - 5.5);
        }
      }
    }
    drawKing(context, atlas, bounds, state.selectedId === 'king');
  }

  function onClick(event) {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const viewport = viewportFor(rect);
    // Invert the same centered, uniform transform used to draw the field.
    const x = (event.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (event.clientY - rect.top - viewport.y) / viewport.scale;
    const cell = cellAtPoint(x, y);
    if (cell) onCell(cell);
    else if (Math.abs(x - FIELD.kingX) <= 32 && y >= FIELD.kingFeet - 59 && y <= FIELD.kingFeet + 32) onKing();
  }

  canvas.addEventListener('click', onClick);
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(draw);
  resizeObserver?.observe(canvas);
  window.addEventListener('resize', draw);
  draw();
  document.fonts?.ready.then(draw);
  return {
    getPortrait(type) {
      return unitImages.get(type)?.portrait ?? null;
    },
    getUnitArt(type) {
      return unitImages.get(type)?.art ?? null;
    },
    render(nextState) {
      if (destroyed) return;
      state = { ...state, ...nextState, units: nextState.units ?? state.units };
      draw();
    },
    destroy() {
      destroyed = true;
      resizeObserver?.disconnect();
      window.removeEventListener('resize', draw);
      canvas.removeEventListener('click', onClick);
    },
  };
}
