import type { AnimationActor } from './animation-types.ts';

export const TINY_WARRIOR_LAYOUT = Object.freeze({ columns: 6, rows: 8 });

function loopFrame(time: number): number {
  return ((Math.floor((Number.isFinite(time) ? time! : 0) * 10) % 6) + 6) % 6;
}

export function tinyWarriorFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead' || (actor?.hitTime! > 0.08 && actor?.action !== 'attack')) return 0;
  if (actor?.action === 'walk') return 6 + loopFrame(actor.walkTime ?? 0);
  if (actor?.action !== 'attack') return loopFrame(time);

  const facingX = actor.facingX ?? 0;
  const facingY = actor.facingY ?? -1;
  const directionStart = Math.abs(facingX) > Math.abs(facingY) ? 12 : facingY < 0 ? 36 : 24;
  const variant = Math.abs(Math.trunc(actor.attackCount ?? 0)) % 2;
  const rowStart = directionStart + variant * 6;
  const progress = Math.max(0, Math.min(1, (actor.actionTime ?? 0) / Math.max(0.01, actor.actionDuration ?? 0.6)));
  const impact = Math.max(0.01, Math.min(0.99, actor.impactFraction ?? 0.45));

  // Each six-frame strike reaches frame 3 exactly when combat applies damage.
  if (progress < impact) return rowStart + Math.min(2, Math.floor(progress / impact * 3));
  return rowStart + 3 + Math.min(2, Math.floor((progress - impact) / (1 - impact) * 3));
}
