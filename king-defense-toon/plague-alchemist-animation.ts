import type { AnimationActor } from './animation-types.ts';

const loop = (time: number | undefined, fps: number) => Math.floor(Math.max(0, Number.isFinite(time) ? time! : 0) * fps) % 4;

export function plagueAlchemistThrowRow(facingX = 0, facingY = 1): 2 | 3 {
  return facingY > 0 && facingY >= Math.abs(facingX) ? 3 : 2;
}

export function plagueAlchemistFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead') return 0;
  if (actor?.action === 'walk') return 4 + loop(actor.walkTime, 8);
  if (actor?.action !== 'shoot') return loop(time, 4);
  const row = plagueAlchemistThrowRow(actor.facingX, actor.facingY);
  const duration = Math.max(.01, actor.actionDuration ?? .8);
  const elapsed = Math.max(0, actor.actionTime ?? 0);
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .5));
  const release = duration * impact;
  // Pose 2 has an empty hand exactly when combat creates the separate bottle.
  const pose = elapsed < release ? elapsed < release / 2 ? 0 : 1
    : elapsed < duration * ((1 + impact) / 2) ? 2 : 3;
  return row * 4 + pose;
}

export function poisonBottleFrame(age: number): number { return loop(age, 12); }
export function poisonImpactFrame(progress: number): number {
  return Math.min(3, Math.floor(Math.max(0, Number.isFinite(progress) ? progress : 0) * 4));
}
