import type {
  FarmPawsFinishPayload,
  FarmPawsFinishResult,
  FarmPawsRunSession
} from "./api";

export type StartTetrisAttempt = (localBestScore: number) => Promise<FarmPawsRunSession>;
export type FinishTetrisAttempt = (
  session: FarmPawsRunSession,
  payload: FarmPawsFinishPayload
) => Promise<FarmPawsFinishResult>;

export async function startTetrisAttempt(
  startRun: StartTetrisAttempt,
  localBestScore: number
): Promise<FarmPawsRunSession> {
  return startRun(normalizeNonNegativeInteger(localBestScore));
}

export async function finishTetrisAttempt(
  finishRun: FinishTetrisAttempt,
  session: FarmPawsRunSession,
  {
    lines,
    level,
    startedAt,
    finishedAt = Date.now()
  }: {
    lines: number;
    level: number;
    startedAt: number;
    finishedAt?: number;
  }
): Promise<FarmPawsFinishResult> {
  return finishRun(session, {
    score: normalizeNonNegativeInteger(lines),
    round: normalizeNonNegativeInteger(level),
    hpLeft: 0,
    durationMs: Math.max(
      0,
      normalizeNonNegativeInteger(finishedAt) - normalizeNonNegativeInteger(startedAt)
    )
  });
}

function normalizeNonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
