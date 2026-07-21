import type { FinalResult } from "./reward.ts";

export type PendingOutcome = "gameover" | "victory";
export type PendingResult = Readonly<{
  version: 1;
  outcome: PendingOutcome;
  score: number;
  durationMs: number;
}>;

export type PendingStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function savePendingResult(
  storage: PendingStorage | null,
  runId: string | null,
  outcome: PendingOutcome,
  result: FinalResult,
): boolean {
  if (!storage || !runId) return false;
  try {
    storage.setItem(pendingKey(runId), JSON.stringify({
      version: 1,
      outcome,
      score: result.score,
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
): PendingResult | null {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(pendingKey(runId)) || "null") as unknown;
    if (!isRecord(value) || value.version !== 1) return null;
    if (value.outcome !== "gameover" && value.outcome !== "victory") return null;
    if (!Number.isFinite(value.score) || !Number.isFinite(value.durationMs)) return null;
    return Object.freeze({
      version: 1,
      outcome: value.outcome,
      score: Math.max(0, Math.min(maxScore, Math.floor(value.score as number))),
      durationMs: Math.max(0, Math.floor(value.durationMs as number)),
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
