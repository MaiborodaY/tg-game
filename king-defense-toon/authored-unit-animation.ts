import type { AnimationActor } from './animation-types.ts';

interface FourPoseOptions {
  action: 'shoot' | 'heal';
  duration: number;
  walkFps?: number;
}
const loop = (time: number | undefined, fps: number) => Math.floor(Math.max(0, Number.isFinite(time) ? time! : 0) * fps) % 4;

/** Shared authored elf layout: idle, walk, side action, down action; release on pose 2. */
export function authoredUnitFrame(actor: AnimationActor | null | undefined, time: number, options: FourPoseOptions): number {
  if (actor?.action === 'dead') return 0;
  if (actor?.action === 'walk') return 4 + loop(actor.walkTime, options.walkFps ?? 8);
  if (actor?.action !== options.action) return loop(time, 4);
  const down = (actor.facingY ?? 0) > 0 && (actor.facingY ?? 0) >= Math.abs(actor.facingX ?? 0);
  const duration = Math.max(.01, actor.actionDuration ?? options.duration);
  const elapsed = Math.max(0, actor.actionTime ?? 0);
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .5));
  const release = duration * impact;
  const pose = elapsed < release ? elapsed < release / 2 ? 0 : 1
    : elapsed < duration * ((1 + impact) / 2) ? 2 : 3;
  return (down ? 12 : 8) + pose;
}
