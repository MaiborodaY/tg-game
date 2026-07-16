import type { FarmPawsRunSession } from "./api";
import type { GamePhase } from "./gameState";

export type FarmBackDecision = "blocked" | "confirm-run" | "confirm-unsaved" | "leave";

export function shouldEnableFarmClosingConfirmation({
  mode,
  phase,
  finishSucceeded,
  isStartingRun,
  hasTelegramInitData
}: {
  mode: FarmPawsRunSession["mode"];
  phase: GamePhase;
  finishSucceeded: boolean;
  isStartingRun: boolean;
  hasTelegramInitData: boolean;
}): boolean {
  if (isStartingRun && hasTelegramInitData) return true;
  return mode === "server" && phase !== "idle" && !finishSucceeded;
}

type FarmBackContext = {
  mode: FarmPawsRunSession["mode"];
  phase: GamePhase;
  isStartingRun: boolean;
  finishPending: boolean;
  hasUnsavedServerResult: boolean;
};

export function farmBackDecision(context: FarmBackContext): FarmBackDecision {
  if (context.isStartingRun || context.finishPending) return "blocked";

  const terminalServerResult = context.mode === "server"
    && (context.phase === "won" || context.phase === "failed");
  if (terminalServerResult && context.hasUnsavedServerResult) return "confirm-unsaved";

  const activeServerRun = context.mode === "server"
    && (
      context.phase === "showing"
      || context.phase === "input"
      || context.phase === "success"
      || context.phase === "choice"
    );
  return activeServerRun ? "confirm-run" : "leave";
}
