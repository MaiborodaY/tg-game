import type {
  FarmPawsFinishPayload,
  FarmPawsFinishResult,
  FarmPawsRunSession
} from "./api";
import type { InputResult } from "./gameState";

export type FinishFarmAttempt = (
  session: FarmPawsRunSession,
  payload: FarmPawsFinishPayload
) => Promise<FarmPawsFinishResult>;

export function isTerminalFarmResult(result: InputResult): boolean {
  return result === "won" || result === "failed";
}

export async function finishFarmAttempt(
  finishRun: FinishFarmAttempt,
  session: FarmPawsRunSession,
  {
    score,
    round,
    hpLeft,
    startedAt,
    finishedAt = Date.now()
  }: {
    score: number;
    round: number;
    hpLeft: number;
    startedAt: number;
    finishedAt?: number;
  }
): Promise<FarmPawsFinishResult> {
  return finishRun(session, {
    score: normalizeNonNegativeInteger(score),
    round: normalizeNonNegativeInteger(round),
    hpLeft: Math.min(3, normalizeNonNegativeInteger(hpLeft)),
    durationMs: Math.max(
      0,
      normalizeNonNegativeInteger(finishedAt) - normalizeNonNegativeInteger(startedAt)
    )
  });
}

function normalizeNonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
