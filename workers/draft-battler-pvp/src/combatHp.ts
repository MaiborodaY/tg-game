import type { CombatResult } from "../../../draft-battler/src/game";

export interface MatchCastleDamage {
  hostHpLoss: number;
  guestHpLoss: number;
}

export function getMatchCastleDamage(
  combat: Pick<CombatResult, "playerCastleDamage" | "enemyCastleDamage">,
): MatchCastleDamage {
  return {
    hostHpLoss: combat.playerCastleDamage,
    guestHpLoss: combat.enemyCastleDamage,
  };
}
