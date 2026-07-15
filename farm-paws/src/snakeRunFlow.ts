import type {
  FarmPawsFinishPayload,
  FarmPawsFinishResult,
  FarmPawsRunSession
} from "./api";

export type StartSnakeAttempt = (localBestScore: number) => Promise<FarmPawsRunSession>;
export type FinishSnakeAttempt = (
  session: FarmPawsRunSession,
  payload: FarmPawsFinishPayload
) => Promise<FarmPawsFinishResult>;

export async function startSnakeAttempt(
  startRun: StartSnakeAttempt,
  localBestScore: number
): Promise<FarmPawsRunSession> {
  return startRun(normalizeScore(localBestScore));
}

export async function finishSnakeAttempt(
  finishRun: FinishSnakeAttempt,
  session: FarmPawsRunSession,
  {
    score,
    startedAt,
    finishedAt = Date.now()
  }: {
    score: number;
    startedAt: number;
    finishedAt?: number;
  }
): Promise<FarmPawsFinishResult> {
  const normalizedScore = normalizeScore(score);
  return finishRun(session, {
    score: normalizedScore,
    round: 0,
    hpLeft: 0,
    durationMs: Math.max(0, normalizeTimestamp(finishedAt) - normalizeTimestamp(startedAt))
  });
}

function normalizeScore(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function normalizeTimestamp(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
