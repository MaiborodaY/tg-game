export type BattleSpeed = 1 | 2 | 3;

// All speed choices scale movement, attacks and spawning on the same battle clock.
export const BASE_BATTLE_SPEED = 0.85;
export const BATTLE_SPEEDS = Object.freeze([1, 2, 3] as const);
const speedChoices: readonly number[] = BATTLE_SPEEDS;

export function nextBattleSpeed(speed: number): BattleSpeed {
  const index = (speedChoices.indexOf(speed) + 1) % BATTLE_SPEEDS.length;
  // indexOf returns -1 or a tuple index, so the wrapped index is always in bounds.
  return BATTLE_SPEEDS[index]!;
}

export function battleFrameDelta(realDelta: number, speed: number = 1): number {
  if (!Number.isFinite(realDelta) || realDelta <= 0) return 0;
  return Math.min(realDelta, .1) * BASE_BATTLE_SPEED * (speedChoices.includes(speed) ? speed : 1);
}
