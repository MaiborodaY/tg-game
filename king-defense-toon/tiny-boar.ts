import type { AnimationActor } from './animation-types.ts';

export const TINY_BOAR_LAYOUT = Object.freeze({ columns: 4, rows: 3 });

function loopFrame(time: number | undefined, fps: number): number {
  return Math.floor(Math.max(0, Number.isFinite(time) ? time! : 0) * fps) % 4;
}

export function tinyBoarFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead') return 0;
  if (actor?.action === 'walk') return 4 + loopFrame(actor.walkTime, 8);
  if (actor?.action !== 'attack') return loopFrame(time, 4);

  const duration = Math.max(.01, actor.actionDuration ?? .8);
  const elapsed = Math.max(0, actor.actionTime ?? 0);
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .5));
  const impactTime = duration * impact;
  // The sole attack row lowers the head, then lunges; pose 2 starts with melee damage.
  const pose = elapsed < impactTime ? (elapsed < impactTime / 2 ? 0 : 1)
    : elapsed < duration * ((1 + impact) / 2) ? 2 : 3;
  return 8 + pose;
}
