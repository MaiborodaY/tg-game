import type { AnimationMetadata, SpriteRect, SpriteRectTuple } from './art-types.ts';
import type { Point } from './field.ts';
import { plagueAlchemistFrame, plagueAlchemistThrowRow } from './plague-alchemist-animation.ts';

export const PLAGUE_ALCHEMIST_IMAGE_URL = new URL('./assets/plague-alchemist/plague-alchemist-512-lite.webp', import.meta.url).href;
// Keep even this small atlas out of the initial JS payload; the wave asset plan loads it on demand.
export const POISON_BOTTLE_IMAGE_URL = new URL('./assets/plague-alchemist/poison-bottle-128-lite.webp?no-inline', import.meta.url).href;
export const POISON_IMPACT_IMAGE_URL = new URL('./assets/plague-alchemist/poison-impact-128-lite.webp', import.meta.url).href;
export const PLAGUE_ALCHEMIST_BODY_HEIGHT = 104;
export const PLAGUE_ALCHEMIST_RENDER_HEIGHT = 40;

interface CharacterFrame { rect: SpriteRect; footAnchor: Point; projectileAnchor?: Point }
interface PoisonFrame { rect: SpriteRect; centerAnchor: Point }
const rect = ([x, y, width, height]: SpriteRectTuple): SpriteRect => ({ x, y, width, height });
const characterFrame = (bounds: SpriteRectTuple, x: number, y: number, projectileAnchor?: Point): CharacterFrame =>
  ({ rect: rect(bounds), footAnchor: { x, y }, ...(projectileAnchor ? { projectileAnchor } : {}) });

// Exact irregular crops and frame-local anchors from the approved 512px source JSON.
export const PLAGUE_ALCHEMIST_FRAMES: readonly CharacterFrame[] = Object.freeze([
  characterFrame([0, 0, 134, 130], 74, 122),
  characterFrame([134, 0, 124, 130], 62, 122),
  characterFrame([258, 0, 127, 130], 61, 122),
  characterFrame([385, 0, 127, 130], 61, 122),
  characterFrame([0, 130, 140, 124], 76, 114),
  characterFrame([140, 130, 123, 124], 56, 113),
  characterFrame([263, 130, 127, 124], 59, 114),
  characterFrame([390, 130, 122, 124], 61, 114),
  characterFrame([0, 254, 136, 124], 74, 114),
  characterFrame([136, 254, 122, 124], 60, 114),
  characterFrame([258, 254, 134, 124], 64, 114, { x: 128, y: 64 }),
  characterFrame([392, 254, 120, 124], 56, 114),
  characterFrame([0, 378, 132, 134], 74, 112),
  characterFrame([132, 378, 123, 134], 58, 113),
  characterFrame([255, 378, 132, 134], 68, 113, { x: 118, y: 58 }),
  characterFrame([387, 378, 125, 134], 61, 113),
]);
const effectFrames = (anchors: readonly (readonly [number, number])[]): readonly PoisonFrame[] => anchors.map(([x, y], index) =>
  ({ rect: { x: index % 2 * 64, y: Math.floor(index / 2) * 64, width: 64, height: 64 }, centerAnchor: { x, y } }));
export const POISON_BOTTLE_FRAMES = effectFrames([[35, 42], [26, 39], [34, 27], [33, 32]]);
export const POISON_IMPACT_FRAMES = effectFrames([[35, 43], [26, 45], [36, 37], [28, 37]]);

export const PLAGUE_ALCHEMIST_METADATA: AnimationMetadata = Object.freeze({
  layout: { columns: 4, rows: 4 }, pixelArt: true, fullCells: true, bakedShadow: false,
  renderHeight: PLAGUE_ALCHEMIST_RENDER_HEIGHT, bodyHeight: PLAGUE_ALCHEMIST_BODY_HEIGHT / 128, horizontalFacing: true,
  baselines: PLAGUE_ALCHEMIST_FRAMES.map(({ rect, footAnchor }, index) => (rect.y + footAnchor.y - Math.floor(index / 4) * 128) / 128),
  centers: PLAGUE_ALCHEMIST_FRAMES.map(({ rect, footAnchor }, index) => (rect.x + footAnchor.x - index % 4 * 128) / 128),
  sourceRects: Object.fromEntries(PLAGUE_ALCHEMIST_FRAMES.map(({ rect }, index) => [index, rect])),
  frameFor: plagueAlchemistFrame,
});

/** Convert the authored release hand to the same world/render scale as its caster. */
export function plagueAlchemistReleasePoint(feet: Point, target: Point, renderScale = 1): Point {
  const dx = target.x - feet.x, dy = target.y - feet.y, distance = Math.max(1, Math.hypot(dx, dy));
  const frame = PLAGUE_ALCHEMIST_FRAMES[plagueAlchemistThrowRow(dx, dy) * 4 + 2];
  const scale = PLAGUE_ALCHEMIST_RENDER_HEIGHT / PLAGUE_ALCHEMIST_BODY_HEIGHT * renderScale;
  const flip = dx / distance < -.15 ? -1 : 1;
  return { x: feet.x + (frame.projectileAnchor!.x - frame.footAnchor.x) * scale * flip,
    y: feet.y + (frame.projectileAnchor!.y - frame.footAnchor.y) * scale };
}
