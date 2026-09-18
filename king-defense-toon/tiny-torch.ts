import type { AnimationActor } from './animation-types.ts';

export const TINY_TORCH_LAYOUT = Object.freeze({ columns: 7, rows: 5 });

function loopFrame(time: number | undefined, count: number): number {
  return Math.floor(Math.max(0, Number.isFinite(time) ? time! : 0) * 10) % count;
}

export function tinyTorchFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead') return 0;
  if (actor?.action === 'walk') return 7 + loopFrame(actor.walkTime, 6);
  if (actor?.action !== 'attack') return loopFrame(time, 7);

  const facingX = actor.facingX ?? 0;
  const facingY = actor.facingY ?? 1;
  const row = Math.abs(facingX) > Math.abs(facingY) ? 2 : facingY < 0 ? 4 : 3;
  const progress = Math.max(0, Math.min(1,
    (actor.actionTime ?? 0) / Math.max(.01, actor.actionDuration ?? .7)));
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .45));
  // Local frame 3 carries the flame sweep; match its start to actual melee damage.
  const pose = progress < impact ? Math.min(2, Math.floor(progress / impact * 3))
    : 3 + Math.min(2, Math.floor((progress - impact) / (1 - impact) * 3));
  return row * 7 + pose;
}
