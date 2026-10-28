import type { AnimationActor } from './animation-types.ts';

export const TINY_GOBLIN_ARCHER_LAYOUT = Object.freeze({ columns: 4, rows: 4 });

function loopFrame(time: number | undefined, fps: number): number {
  return Math.floor(Math.max(0, Number.isFinite(time) ? time! : 0) * fps) % 4;
}

export function tinyGoblinArcherFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead') return 0;
  if (actor?.action === 'walk') return 4 + loopFrame(actor.walkTime, 10);
  if (actor?.action !== 'shoot') return loopFrame(time, 4);

  const facingX = actor.facingX ?? 0;
  const facingY = actor.facingY ?? 1;
  // The atlas has side and down shots; use the side view for targets above the archer.
  const row = facingY > 0 && facingY >= Math.abs(facingX) ? 3 : 2;
  const duration = Math.max(.01, actor.actionDuration ?? .8);
  const elapsed = Math.max(0, actor.actionTime ?? 0);
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .45));
  const releaseTime = duration * impact;
  // Local frame 2 releases the bow at the same instant combat creates the projectile.
  const pose = elapsed < releaseTime ? (elapsed < releaseTime / 2 ? 0 : 1)
    : elapsed < duration * ((1 + impact) / 2) ? 2 : 3;
  return row * 4 + pose;
}
