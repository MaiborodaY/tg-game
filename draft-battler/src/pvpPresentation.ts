export type PvpPresentationMode = "menu" | "draft" | "battle" | "finished";

export interface PvpBattleIdentity {
  matchId: string;
  round: number;
}

export function isSamePresentedPvpBattle(
  mode: PvpPresentationMode,
  previousMatch: PvpBattleIdentity | undefined,
  incomingMatch: PvpBattleIdentity,
): boolean {
  return (mode === "battle" || mode === "finished")
    && previousMatch?.matchId === incomingMatch.matchId
    && previousMatch.round === incomingMatch.round;
}
