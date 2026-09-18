export type BattleSpeed = 1 | 2 | 3;

// All speed choices scale movement, attacks and spawning on the same battle clock.
// The former x1.5 pace is now the base; labels are multiples of this same pace.
export const BASE_BATTLE_SPEED = 0.85 * 1.5;
export const BATTLE_SPEEDS = Object.freeze([1, 2, 3] as const);
export const DEFAULT_BATTLE_SPEED = BATTLE_SPEEDS[0];
export const MAX_REAL_FRAME_DELTA = .1;
// The engine's catch-up limit must accept a whole capped frame even at x3.
export const MAX_BATTLE_FRAME_DELTA = MAX_REAL_FRAME_DELTA * BASE_BATTLE_SPEED * BATTLE_SPEEDS[BATTLE_SPEEDS.length - 1]!;
const speedChoices: readonly number[] = BATTLE_SPEEDS;

export function nextBattleSpeed(speed: number): BattleSpeed {
  const index = (speedChoices.indexOf(speed) + 1) % BATTLE_SPEEDS.length;
  // indexOf returns -1 or a tuple index, so the wrapped index is always in bounds.
  return BATTLE_SPEEDS[index]!;
}

export function battleFrameDelta(realDelta: number, speed: number = DEFAULT_BATTLE_SPEED): number {
  if (!Number.isFinite(realDelta) || realDelta <= 0) return 0;
  return Math.min(realDelta, MAX_REAL_FRAME_DELTA) * BASE_BATTLE_SPEED * (speedChoices.includes(speed) ? speed : DEFAULT_BATTLE_SPEED);
}
