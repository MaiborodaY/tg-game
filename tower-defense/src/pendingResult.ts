import type { FinalResult } from "./reward.ts";
import { isHeroId } from "./game/heroes.ts";
import type { HeroId } from "./game/types.ts";

export type PendingOutcome = "gameover" | "victory" | "retired";
export type PendingRunSummary = Readonly<{
  lives: number;
  kills: number;
  towers: number;
  heroId: HeroId;
}>;
export type PendingResult = Readonly<{
  version: 2;
  outcome: PendingOutcome;
  score: number;
  waves: number;
  durationMs: number;
  summary?: PendingRunSummary;
}>;

export type PendingStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function savePendingResult(
  storage: PendingStorage | null,
  runId: string | null,
  outcome: PendingOutcome,
  result: FinalResult,
  completedWaves: number,
  summary?: PendingRunSummary,
  runRevision: number | null = null,
): boolean {
  if (!storage || !runId) return false;
  try {
    const validSummary = sanitizePendingRunSummary(summary);
    storage.setItem(pendingKey(runId, runRevision), JSON.stringify({
      version: 2,
      outcome,
      score: result.score,
      waves: completedWaves,
      durationMs: result.durationMs,
      ...(validSummary ? { summary: validSummary } : {}),
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
  runRevision: number | null = null,
): PendingResult | null {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(pendingKey(runId, runRevision)) || "null") as unknown;
    if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) return null;
    if (value.outcome !== "gameover" && value.outcome !== "victory" && value.outcome !== "retired") return null;
    if (!Number.isFinite(value.score) || !Number.isFinite(value.durationMs)) return null;
    if (value.version === 2 && !Number.isFinite(value.waves)) return null;
    const score = clampInteger(value.score as number, maxScore);
    const waves = value.version === 2
      ? clampInteger(value.waves as number, maxWaves)
      : Math.min(maxWaves, score);
    const summary = sanitizePendingRunSummary(value.summary);
    return Object.freeze({
      version: 2,
      outcome: value.outcome,
      score,
      waves,
      durationMs: clampInteger(value.durationMs as number, Number.MAX_SAFE_INTEGER),
      ...(summary ? { summary } : {}),
    });
  } catch {
    return null;
  }
}

export function removePendingResult(
  storage: PendingStorage | null,
  runId: string | null,
  runRevision: number | null = null,
): void {
  if (!storage || !runId) return;
  try {
    storage.removeItem(pendingKey(runId, runRevision));
  } catch {
    // Storage failures keep the confirmed server result authoritative.
  }
}

export function pendingKey(runId: string, runRevision: number | null = null): string {
  return Number.isSafeInteger(runRevision) && (runRevision ?? 0) > 0
    ? `td-pending-finish-v2:${runId}:rev:${runRevision}`
    : `td-pending-finish-v1:${runId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampInteger(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function sanitizePendingRunSummary(value: unknown): PendingRunSummary | null {
  if (!isRecord(value) || !isHeroId(value.heroId)) return null;
  if (!isNonNegativeSafeInteger(value.lives)) return null;
  if (!isNonNegativeSafeInteger(value.kills)) return null;
  if (!isNonNegativeSafeInteger(value.towers)) return null;
  return Object.freeze({
    lives: value.lives,
    kills: value.kills,
    towers: value.towers,
    heroId: value.heroId,
  });
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
