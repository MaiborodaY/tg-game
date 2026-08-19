export const CASTLE_ASSAULT_APPROACH_MS = 300;
export const CASTLE_ASSAULT_HIT_STAGGER_MS = 35;
export const CASTLE_ASSAULT_LUNGE_MS = 70;
export const CASTLE_ASSAULT_FADE_MS = 110;
export const CASTLE_ASSAULT_FLASH_MS = 180;

export interface CastleAssaultHitPlan {
  attackerId: string;
  delayMs: number;
  remainingHpAfterHit?: number;
}

/** Preserves battlefield order while tightly overlapping the attackers' hit animations. */
export function createCastleAssaultPlan(
  attackerIds: readonly string[],
  damage: number,
  remainingHp: number,
): CastleAssaultHitPlan[] {
  const hitCount = Math.min(attackerIds.length, Math.max(0, Math.trunc(damage)));
  const finalHp = Math.max(0, Math.trunc(remainingHp));
  const startingHp = finalHp + hitCount;

  return attackerIds.map((attackerId, index) => ({
    attackerId,
    delayMs: index * CASTLE_ASSAULT_HIT_STAGGER_MS,
    remainingHpAfterHit: index < hitCount ? startingHp - index - 1 : undefined,
  }));
}

/** Total assault presentation time before the timeline's generic battle-finish delay. */
export function getCastleAssaultDurationMs(attackerCount: number): number {
  if (attackerCount <= 0) {
    return 0;
  }

  const lastHitDelay = (Math.trunc(attackerCount) - 1) * CASTLE_ASSAULT_HIT_STAGGER_MS;
  const hitEffectDuration = CASTLE_ASSAULT_LUNGE_MS * 2 + Math.max(CASTLE_ASSAULT_FLASH_MS, CASTLE_ASSAULT_FADE_MS);

  return CASTLE_ASSAULT_APPROACH_MS + lastHitDelay + hitEffectDuration;
}
