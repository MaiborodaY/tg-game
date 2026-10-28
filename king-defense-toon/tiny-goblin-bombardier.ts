import type { AnimationActor } from './animation-types.ts';

export const TINY_GOBLIN_BOMBARDIER_LAYOUT = Object.freeze({ columns: 4, rows: 4 });
export const CANNON_EXPLOSION_DURATION = .4;

function finite(value: number | undefined, fallback = 0): number {
  return Number.isFinite(value) ? value! : fallback;
}

export function goblinBombardierDirection(actor: AnimationActor | null | undefined) {
  const x = finite(actor?.facingX);
  const y = finite(actor?.facingY, 1);
  // No rear-view artwork exists: upward shots use the side row, like the goblin archer.
  return { row: y > 0 && y >= Math.abs(x) ? 3 : 2, flipX: x < -.15 };
}

export function goblinBombardierShotTiming(actor: AnimationActor | null | undefined) {
  // Preview defaults only; battle supplies its own duration and impactFraction.
  const duration = Math.max(.01, finite(actor?.actionDuration, 1.4));
  const impact = Math.max(.01, Math.min(.99, finite(actor?.impactFraction, .55)));
  return { releaseTime: duration * impact, recoveryTime: duration * ((1 + impact) / 2) };
}

export function tinyGoblinBombardierFrame(actor: AnimationActor | null | undefined, time = 0): number {
  if (actor?.action === 'dead' || actor?.action === 'death') return 0;
  if (actor?.action === 'walk') return 4 + Math.floor(Math.max(0, finite(actor.walkTime)) * 6) % 4;
  if (actor?.action !== 'shoot') return Math.floor(Math.max(0, finite(time)) * 4) % 4;
  const { releaseTime, recoveryTime } = goblinBombardierShotTiming(actor);
  const elapsed = Math.max(0, finite(actor.actionTime));
  const pose = elapsed < releaseTime ? (elapsed < releaseTime / 2 ? 0 : 1)
    : elapsed < recoveryTime ? 2 : 3;
  return goblinBombardierDirection(actor).row * 4 + pose;
}

/** Call once per simulation step with the previous clock of this same shot, not per render. */
export function goblinBombardierReleased(actor: AnimationActor, previousActionTime: number): boolean {
  if (actor.action !== 'shoot' || !Number.isFinite(previousActionTime) || !Number.isFinite(actor.actionTime)) return false;
  const { releaseTime } = goblinBombardierShotTiming(actor);
  // Crossing the release boundary also handles a step that skips the visible release pose.
  return previousActionTime < releaseTime && actor.actionTime! >= releaseTime;
}

export function cannonBombFrame(elapsed: number): number {
  return Math.floor(Math.max(0, finite(elapsed)) * 12) % 4;
}

/** -1 means hidden, including after completion; the blast must never wrap back to frame 0. */
export function cannonExplosionFrame(elapsed: number): number {
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= CANNON_EXPLOSION_DURATION) return -1;
  return Math.min(3, Math.floor(elapsed / CANNON_EXPLOSION_DURATION * 4));
}
