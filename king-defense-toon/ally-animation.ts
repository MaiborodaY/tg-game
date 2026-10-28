import type { AnimationActor, AllyAnimationActor, AllyAnimationFrames } from './animation-types.ts';

export const ALLY_ATLAS_LAYOUT = Object.freeze({ columns: 4, rows: 3 });

export function allyAnimationFrame(actor: null | undefined, frames?: AllyAnimationFrames): number;
export function allyAnimationFrame(actor: AllyAnimationActor | null | undefined, frames?: AllyAnimationFrames): number | undefined;
// Legacy array indexing can miss a frame for invalid numeric clocks; keep that
// behavior visible to callers instead of silently normalizing it during migration.
export function allyAnimationFrame(actor: AllyAnimationActor | null | undefined, frames: AllyAnimationFrames = {}): number | undefined {
  const idle = frames.idle ?? 0;
  if (!actor) return idle;
  if (actor.action === 'dead') return actor.deathTime < 0.12 ? 10 : 11;
  const acting = ['attack', 'shoot', 'heal'].includes(actor.action);
  if (actor.hitTime > 0.08 && !acting) return 10;
  const walk = frames.walk ?? [1, 2, 3, 4];
  if (actor.action === 'walk') return walk[Math.floor((actor.walkTime ?? 0) * 8) % walk.length];
  if (!acting) return idle;

  const progress = Math.max(0, Math.min(1, actor.actionTime / Math.max(0.01, actor.actionDuration)));
  const impact = actor.impactFraction ?? 0.45;
  // The release/strike frame changes at the exact time the engine applies its effect.
  const anticipation = frames.anticipation ?? [5, 6];
  if (progress < impact) return anticipation[Math.min(anticipation.length - 1, Math.floor(progress / impact * anticipation.length))];
  if (progress < impact + (1 - impact) * 0.3) return frames.impact ?? 7;
  const recovery = frames.recovery ?? [8, 9];
  const recoveryProgress = (progress - impact - (1 - impact) * 0.3) / ((1 - impact) * 0.7);
  return recovery[Math.min(recovery.length - 1, Math.floor(recoveryProgress * recovery.length))];
}

export function allyDeathOpacity(actor: (AnimationActor & { deathTime: number }) | null | undefined): number {
  if (actor?.action !== 'dead') return 1;
  return 1 - Math.max(0, Math.min(1, (actor.deathTime - 0.22) / 0.7));
}
