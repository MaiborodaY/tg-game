import type { BattlefieldMap, MapDrawBounds } from './tiny-map.ts';

import { FIELD, ROYAL_PENINSULA, ROYAL_NECK } from './field.ts';
import { loadImage } from './asset-cache.ts';

const WIDTH = 390;
const ORIGINAL_HEIGHT = 540;
const HEIGHT = 445;
const BACKGROUND_COLOR = '#2c4a55';
const MAP_URL = new URL('./assets/web/forgotten-graveyard.webp', import.meta.url).href;

function makeUpperApproach(image: HTMLImageElement): HTMLCanvasElement {
  const layer = document.createElement('canvas');
  layer.width = WIDTH;
  layer.height = 96;
  // Preserve the existing Canvas 2D requirement without adding a different fallback.
  const context = layer.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, WIDTH, layer.height);
  const sourceScaleX = image.naturalWidth / WIDTH;
  const sourceScaleY = image.naturalHeight / ORIGINAL_HEIGHT;
  // Extend only bare earth and shore above the map, not mirrored trees or graves.
  context.save();
  context.beginPath();
  context.rect(36, 0, 320, layer.height);
  context.clip();
  for (let y = 0; y < layer.height; y += 64) {
    for (let x = 36; x < 356; x += 64) {
      context.drawImage(image, 142 * sourceScaleX, 188 * sourceScaleY,
        64 * sourceScaleX, 64 * sourceScaleY, x, y, 64, 64);
    }
  }
  context.fillStyle = '#30263866';
  context.fillRect(36, 0, 320, layer.height);
  context.restore();
  context.save();
  context.beginPath();
  context.moveTo(134, 0);
  context.lineTo(132, 28);
  context.lineTo(135, 58);
  context.lineTo(134, 96);
  context.lineTo(257, 96);
  context.lineTo(259, 66);
  context.lineTo(255, 31);
  context.lineTo(257, 0);
  context.closePath();
  context.clip();
  for (let y = 0; y < layer.height; y += 64) {
    for (let x = 130; x < 260; x += 64) {
      context.drawImage(image, 142 * sourceScaleX, 188 * sourceScaleY,
        64 * sourceScaleX, 64 * sourceScaleY, x, y, 64, 64);
    }
  }
  context.restore();
  for (const x of [33, 350]) {
    context.drawImage(image, x * sourceScaleX, 0, 8 * sourceScaleX,
      layer.height * sourceScaleY, x, 0, 8, layer.height);
  }
  return layer;
}

function makeRoyalGround(image: HTMLImageElement): { canvas: HTMLCanvasElement; x: number; y: number } {
  const { left, top, right, bottom } = ROYAL_PENINSULA;
  const layer = document.createElement('canvas');
  layer.width = ROYAL_NECK.right - left + 4;
  layer.height = bottom - top + 4;
  // Preserve the existing Canvas 2D requirement without adding a different fallback.
  const context = layer.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  context.translate(-left + 2, -top + 2);
  const shoreline = [
    [ROYAL_NECK.right, ROYAL_NECK.top], [right, ROYAL_NECK.top],
    [right, top + 6], [right - 4, top + 6], [right - 4, top + 2],
    [left + 5, top + 2], [left + 5, top], [left + 2, top],
    [left + 2, top + 7], [left, top + 7], [left, top + 36],
    [left + 2, top + 36], [left + 2, top + 52], [left, top + 52],
    [left, top + 83], [left + 2, top + 83], [left + 2, top + 106],
    [left, top + 106], [left, bottom - 5], [left + 4, bottom - 5],
    [left + 4, bottom], [right - 4, bottom], [right - 4, bottom - 4],
    [right, bottom - 4], [right, ROYAL_NECK.bottom],
    [ROYAL_NECK.right, ROYAL_NECK.bottom],
  ];
  const traceShoreline = () => {
    context.beginPath();
    shoreline.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
  };
  context.save();
  traceShoreline();
  context.closePath();
  context.clip();
  // Reuse the approved map's earth texture at its native scale instead of stretching the island.
  const sourceScaleX = image.naturalWidth / WIDTH;
  const sourceScaleY = image.naturalHeight / ORIGINAL_HEIGHT;
  for (let y = top; y < bottom; y += 64) {
    for (let x = left; x < ROYAL_NECK.right; x += 64) {
      context.drawImage(image, 142 * sourceScaleX, 188 * sourceScaleY,
        64 * sourceScaleX, 64 * sourceScaleY, x, y, 64, 64);
    }
  }
  context.restore();
  // Leave the mainland end open: this is the peninsula's only land connection.
  traceShoreline();
  context.strokeStyle = '#202d35';
  context.lineWidth = 3;
  context.stroke();
  context.strokeStyle = '#8b8578';
  context.lineWidth = 1;
  context.stroke();
  return { canvas: layer, x: left - 2, y: top - 2 };
}

export async function createGraveyardMap(): Promise<BattlefieldMap> {
  const image = await loadImage(MAP_URL);
  const royalGround = makeRoyalGround(image);
  const upperApproach = makeUpperApproach(image);
  const sourceScaleX = image.naturalWidth / WIDTH;
  const sourceScaleY = image.naturalHeight / ORIGINAL_HEIGHT;

  return {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    draw(context: CanvasRenderingContext2D, time = 0, bounds: MapDrawBounds = {}) {
      const seconds = Number.isFinite(time) ? time : 0;
      context.save();
      context.imageSmoothingEnabled = false;
      // A tall screen reveals more approach above the existing map, never the removed footer.
      const visibleTop = Math.min(0, Number.isFinite(bounds.top) ? bounds.top! : 0);
      for (let y = -upperApproach.height; y > visibleTop - upperApproach.height; y -= upperApproach.height) {
        context.drawImage(upperApproach, 0, y);
      }
      context.save();
      context.beginPath();
      context.rect(0, 0, WIDTH, HEIGHT);
      context.clip();
      context.drawImage(image, 0, 0, WIDTH, ORIGINAL_HEIGHT);
      context.restore();
      context.drawImage(royalGround.canvas, royalGround.x, royalGround.y);
      // The small crypt is a crop from the old footer; no extra downloaded texture is needed.
      const cryptWidth = 48;
      const cryptHeight = cryptWidth * 86 / 117;
      const cryptX = FIELD.kingX - cryptWidth / 2;
      const cryptY = ROYAL_PENINSULA.top + 14;
      context.drawImage(image, 9 * sourceScaleX, 451 * sourceScaleY,
        117 * sourceScaleX, 86 * sourceScaleY, cryptX, cryptY, cryptWidth, cryptHeight);
      context.fillStyle = '#ead7ff';
      for (const [index, x] of [cryptX + 5, cryptX + cryptWidth - 7].entries()) {
        context.globalAlpha = 0.1 + (Math.sin(seconds * 2.8 + index * 1.7) + 1) * 0.09;
        context.fillRect(x, cryptY + cryptHeight - 8, 1, 2);
      }
      context.restore();
    },
  };
}
