import type { FarmPawsRunSession } from "./api";
import type { GamePhase } from "./gameState";

export type FarmBackDecision = "blocked" | "confirm-run" | "confirm-unsaved" | "leave";

type FarmBackContext = {
  mode: FarmPawsRunSession["mode"];
  phase: GamePhase;
  isStartingRun: boolean;
  finishPending: boolean;
  hasUnsavedServerResult: boolean;
};

export function farmBackDecision(context: FarmBackContext): FarmBackDecision {
  if (context.isStartingRun || context.finishPending) return "blocked";
  if (context.mode === "server" && context.hasUnsavedServerResult) return "confirm-unsaved";

  const activeServerRun = context.mode === "server"
    && (context.phase === "showing" || context.phase === "input" || context.phase === "success");
  return activeServerRun ? "confirm-run" : "leave";
}
