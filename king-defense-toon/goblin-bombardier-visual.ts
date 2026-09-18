import type { AnimationActor } from './animation-types.ts';
import type { SpriteEffectFrame } from './art-types.ts';
import type { PreparedAnimation } from './sprite-animation.ts';
import { loadImage } from './asset-cache.ts';
import { allyDeathOpacity } from './ally-animation.ts';
import { prepareAnimation, drawPreparedAnimation } from './sprite-animation.ts';
import { GOBLIN_BOMBARDIER_ASSETS, GOBLIN_BOMBARDIER_METADATA, GOBLIN_BOMBARDIER_FRAMES,
  GOBLIN_BOMBARDIER_MUZZLES, GOBLIN_BOMBARDIER_BODY_HEIGHT, GOBLIN_BOMBARDIER_RENDER_HEIGHT,
  CANNON_BOMB_FRAMES, CANNON_EXPLOSION_FRAMES } from './goblin-bombardier-art.ts';
import { goblinBombardierDirection, cannonBombFrame, cannonExplosionFrame } from './tiny-goblin-bombardier.ts';

export interface GoblinBombardierVisual {
  body: PreparedAnimation;
  bomb: HTMLImageElement;
  explosion: HTMLImageElement;
}
export type BombardierPose = AnimationActor & { visualScale?: number };

/** Load once for the owning scene, optionally using its existing retained image cache. */
export async function loadGoblinBombardierVisual(load: (url: string) => Promise<HTMLImageElement> = loadImage): Promise<GoblinBombardierVisual> {
  const [body, bomb, explosion] = await Promise.all([
    load(GOBLIN_BOMBARDIER_ASSETS.body), load(GOBLIN_BOMBARDIER_ASSETS.bomb), load(GOBLIN_BOMBARDIER_ASSETS.explosion),
  ]);
  return { body: prepareAnimation(body, GOBLIN_BOMBARDIER_METADATA), bomb, explosion };
}

export function drawGoblinBombardier(context: CanvasRenderingContext2D, art: GoblinBombardierVisual,
  actor: BombardierPose | null, x: number, feet: number, time = 0): void {
  const dead = actor?.action === 'dead' || actor?.action === 'death';
  const deathTime = Number.isFinite(actor?.deathTime) ? Math.max(0, actor!.deathTime!) : 0;
  context.save();
  if (dead) context.globalAlpha *= allyDeathOpacity({ action: 'dead', deathTime });
  // There is no destruction row: freeze the idle pose and use the existing unit fade.
  drawPreparedAnimation(context, art.body, actor, x, feet, time);
  context.restore();
}

/** Use the release pose even if a simulation step has already reached recovery. */
export function goblinBombardierMuzzle(actor: BombardierPose | null, x: number, feet: number) {
  const { row, flipX } = goblinBombardierDirection(actor);
  const frame = row === 3 ? 14 : 10;
  const anchor = GOBLIN_BOMBARDIER_FRAMES[frame].groundAnchor;
  const muzzle = GOBLIN_BOMBARDIER_MUZZLES[frame];
  const scale = GOBLIN_BOMBARDIER_RENDER_HEIGHT * (actor?.visualScale ?? 1) / GOBLIN_BOMBARDIER_BODY_HEIGHT;
  return { x: x + (muzzle.x - anchor.x) * scale * (flipX ? -1 : 1), y: feet + (muzzle.y - anchor.y) * scale };
}

function drawEffect(context: CanvasRenderingContext2D, image: HTMLImageElement, frame: SpriteEffectFrame,
  x: number, y: number, scale: number): void {
  const { rect, groundAnchor } = frame;
  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height,
    x - groundAnchor.x * scale, y - groundAnchor.y * scale, rect.width * scale, rect.height * scale);
  context.restore();
}

/** The caller supplies the live projectile position; stop drawing this on contact. */
export function drawCannonBomb(context: CanvasRenderingContext2D, art: GoblinBombardierVisual,
  elapsed: number, x: number, y: number, scale = .45): void {
  if (!Number.isFinite(elapsed) || elapsed < 0) return;
  drawEffect(context, art.bomb, CANNON_BOMB_FRAMES[cannonBombFrame(elapsed)], x, y, scale);
}

/** Returns false when the one-shot effect has ended and can be removed by its owner. */
export function drawCannonExplosion(context: CanvasRenderingContext2D, art: GoblinBombardierVisual,
  elapsed: number, x: number, y: number, scale = 1): boolean {
  const frame = cannonExplosionFrame(elapsed);
  if (frame < 0) return false;
  drawEffect(context, art.explosion, CANNON_EXPLOSION_FRAMES[frame], x, y, scale);
  return true;
}
