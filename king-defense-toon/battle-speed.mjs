// All speed choices scale movement, attacks and spawning on the same battle clock.
export const BASE_BATTLE_SPEED = 0.85;
export const BATTLE_SPEEDS = Object.freeze([1, 2, 3]);

export function nextBattleSpeed(speed) {
  return BATTLE_SPEEDS[(BATTLE_SPEEDS.indexOf(speed) + 1) % BATTLE_SPEEDS.length];
}

export function battleFrameDelta(realDelta, speed = 1) {
  if (!Number.isFinite(realDelta) || realDelta <= 0) return 0;
  return Math.min(realDelta, .1) * BASE_BATTLE_SPEED * (BATTLE_SPEEDS.includes(speed) ? speed : 1);
}
