import type { AnimationActor } from './animation-types.ts';

const loop = (time: number | undefined, fps: number) => Math.floor(Math.max(0, Number.isFinite(time) ? time! : 0) * fps) % 4;

export function elfArcherFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead') return 0;
  if (actor?.action === 'walk') return 4 + loop(actor.walkTime, 8);
  if (actor?.action !== 'shoot') return loop(time, 4);
  const down = (actor.facingY ?? 0) > 0 && (actor.facingY ?? 0) >= Math.abs(actor.facingX ?? 0);
  const duration = Math.max(.01, actor.actionDuration ?? .7);
  const elapsed = Math.max(0, actor.actionTime ?? 0);
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .5));
  const release = duration * impact;
  // The bow is empty from pose 2, exactly when combat releases its single arrow.
  const pose = elapsed < release ? elapsed < release / 2 ? 0 : 1
    : elapsed < duration * ((1 + impact) / 2) ? 2 : 3;
  return (down ? 12 : 8) + pose;
}
