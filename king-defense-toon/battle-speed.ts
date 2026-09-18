export type BattleSpeed = 1.5 | 2 | 3;

// All speed choices scale movement, attacks and spawning on the same battle clock.
export const BASE_BATTLE_SPEED = 0.85;
export const BATTLE_SPEEDS = Object.freeze([1.5, 2, 3] as const);
export const DEFAULT_BATTLE_SPEED = BATTLE_SPEEDS[0];
const speedChoices: readonly number[] = BATTLE_SPEEDS;

export function nextBattleSpeed(speed: number): BattleSpeed {
  const index = (speedChoices.indexOf(speed) + 1) % BATTLE_SPEEDS.length;
  // indexOf returns -1 or a tuple index, so the wrapped index is always in bounds.
  return BATTLE_SPEEDS[index]!;
}

export function battleFrameDelta(realDelta: number, speed: number = DEFAULT_BATTLE_SPEED): number {
  if (!Number.isFinite(realDelta) || realDelta <= 0) return 0;
  return Math.min(realDelta, .1) * BASE_BATTLE_SPEED * (speedChoices.includes(speed) ? speed : DEFAULT_BATTLE_SPEED);
}
