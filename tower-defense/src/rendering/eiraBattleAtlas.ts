export const EIRA_BATTLE_ATLAS_SPEC = Object.freeze({
  textureKey: "hero-eira-battle-atlas",
  textureWidth: 512,
  textureHeight: 192,
  frameWidth: 128,
  frameHeight: 192,
  frameCount: 4,
  displayHeight: 62,
  maxBytes: 96 * 1_024,
});

export const EIRA_BATTLE_FRAMES = Object.freeze({
  idleA: 0,
  idleB: 1,
  attackDraw: 2,
  attackRelease: 3,
});

export type EiraFacing = -1 | 1;

export function selectEiraFacing(fromX: number, targetX: number, current: EiraFacing): EiraFacing {
  if (!Number.isFinite(fromX) || !Number.isFinite(targetX) || fromX === targetX) return current;
  return targetX < fromX ? -1 : 1;
}

export function selectEiraBattleFrame(_elapsedMs: number, attackProgress: number): number {
  const safeAttack = Number.isFinite(attackProgress)
    ? Math.max(0, Math.min(1, attackProgress))
    : 0;
  if (safeAttack > 0) {
    return safeAttack < 0.52
      ? EIRA_BATTLE_FRAMES.attackDraw
      : EIRA_BATTLE_FRAMES.attackRelease;
  }

  return EIRA_BATTLE_FRAMES.idleA;
}
