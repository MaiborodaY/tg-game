import type { AnimationActor } from './animation-types.ts';

export const TINY_KING_LAYOUT = Object.freeze({ columns: 4, rows: 4 });

export function tinyKingFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead') return 0;
  if (actor?.action !== 'attack' && actor?.action !== 'shoot') {
    // Keep the last facing between swings instead of snapping back to the side-facing portrait.
    if (actor && Math.abs(actor.facingY ?? 0) >= Math.abs(actor.facingX ?? 0)) {
      return (actor.facingY ?? -1) < 0 ? 8 : 12;
    }
    return Math.floor(Math.max(0, Number.isFinite(time) ? time! : 0) * 4) % 4;
  }

  const facingX = actor.facingX ?? 0;
  const facingY = actor.facingY ?? -1;
  const row = Math.abs(facingX) > Math.abs(facingY) ? 1 : facingY < 0 ? 2 : 3;
  const progress = Math.max(0, Math.min(1,
    (actor.actionTime ?? 0) / Math.max(.01, actor.actionDuration ?? .7)));
  const impact = Math.max(.01, Math.min(.99, actor.impactFraction ?? .45));
  // The same gesture releases a royal bolt; pose 2 matches the strike or projectile release.
  const pose = progress < impact ? (progress < impact / 2 ? 0 : 1)
    : progress < (1 + impact) / 2 ? 2 : 3;
  return row * 4 + pose;
}
