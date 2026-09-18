import type { AnimationActor } from './animation-types.ts';

export const TINY_GOBLIN_HEALER_LAYOUT = Object.freeze({ columns: 4, rows: 4 });

function loopFrame(time: number | undefined, fps: number): number {
  return Math.floor(Math.max(0, Number.isFinite(time) ? time! : 0) * fps) % 4;
}

export function tinyGoblinHealerFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead') return 0;
  if (actor?.action === 'walk') return 4 + loopFrame(actor.walkTime, 6);
  if (actor?.action !== 'heal') return loopFrame(time, 4);
  const facingX = actor.facingX ?? 0;
  const facingY = actor.facingY ?? 1;
  const row = facingY > 0 && facingY >= Math.abs(facingX) ? 3 : 2;
  const duration = Math.max(.01, actor.actionDuration ?? 1);
  const elapsed = Math.max(0, actor.actionTime ?? 0);
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .5));
  const impactTime = duration * impact;
  // Pose 2 extends the potion: show it on exactly the tick that healing is applied.
  const pose = elapsed < impactTime ? (elapsed < impactTime / 2 ? 0 : 1)
    : elapsed < duration * ((1 + impact) / 2) ? 2 : 3;
  return row * 4 + pose;
}

export function goblinHealPulseFrame(progress = 0): number {
  return Math.min(3, Math.max(0, Math.floor((Number.isFinite(progress) ? progress : 0) * 4)));
}
