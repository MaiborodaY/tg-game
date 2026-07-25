import type { FinalResult } from "./reward.ts";

export type PendingOutcome = "gameover" | "victory";
export type PendingResult = Readonly<{
  version: 2;
  outcome: PendingOutcome;
  score: number;
  waves: number;
  durationMs: number;
}>;

export type PendingStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function savePendingResult(
  storage: PendingStorage | null,
  runId: string | null,
  outcome: PendingOutcome,
  result: FinalResult,
  completedWaves: number,
): boolean {
  if (!storage || !runId) return false;
  try {
    storage.setItem(pendingKey(runId), JSON.stringify({
      version: 2,
      outcome,
      score: result.score,
      waves: completedWaves,
      durationMs: result.durationMs,
    }));
    return true;
  } catch {
    return false;
  }
}

export function loadPendingResult(
  storage: PendingStorage | null,
  runId: string,
  maxScore: number,
  maxWaves: number,
): PendingResult | null {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(pendingKey(runId)) || "null") as unknown;
    if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) return null;
    if (value.outcome !== "gameover" && value.outcome !== "victory") return null;
    if (!Number.isFinite(value.score) || !Number.isFinite(value.durationMs)) return null;
    if (value.version === 2 && !Number.isFinite(value.waves)) return null;
    const score = clampInteger(value.score as number, maxScore);
    const waves = value.version === 2
      ? clampInteger(value.waves as number, maxWaves)
      : Math.min(maxWaves, score);
    return Object.freeze({
      version: 2,
      outcome: value.outcome,
      score,
      waves,
      durationMs: clampInteger(value.durationMs as number, Number.MAX_SAFE_INTEGER),
    });
  } catch {
    return null;
  }
}

export function removePendingResult(storage: PendingStorage | null, runId: string | null): void {
  if (!storage || !runId) return;
  try {
    storage.removeItem(pendingKey(runId));
  } catch {
    // Storage failures keep the confirmed server result authoritative.
  }
}

export function pendingKey(runId: string): string {
  return `td-pending-finish-v1:${runId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampInteger(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.floor(value)));
}
