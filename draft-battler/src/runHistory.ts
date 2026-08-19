import {
  ENEMY_STARTING_HP,
  MAX_RUN_ROUNDS,
  PLAYER_STARTING_HP,
  type BotDifficulty,
  type CombatWinner,
} from "./game/types";
import type { RunSource } from "./dailyChallenge";

export const SOLO_RUN_HISTORY_VERSION = 1;
export const SOLO_RUN_HISTORY_LIMIT = 10;
export const SOLO_RUN_HISTORY_STORAGE_KEY = `draft-battler:solo-run-history:v${SOLO_RUN_HISTORY_VERSION}`;
export const SOLO_RUN_HISTORY_OUTBOX_STORAGE_KEY = `draft-battler:solo-run-history-outbox:v${SOLO_RUN_HISTORY_VERSION}`;

export interface SoloRunSummary {
  readonly id: string;
  readonly seed: string;
  readonly botDifficulty: BotDifficulty;
  readonly outcome: CombatWinner;
  readonly round: number;
  readonly playerHp: number;
  readonly enemyHp: number;
  /** Unix time in milliseconds. */
  readonly completedAt: number;
  readonly source: RunSource;
  readonly dailyDateKey: string | null;
  readonly rulesetVersion: string;
}

export interface RunHistoryStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StoredSoloRunHistory {
  version: typeof SOLO_RUN_HISTORY_VERSION;
  summaries: SoloRunSummary[];
}

const HISTORY_KEYS = ["version", "summaries"] as const;
const SUMMARY_KEYS = [
  "id",
  "seed",
  "botDifficulty",
  "outcome",
  "round",
  "playerHp",
  "enemyHp",
  "completedAt",
  "source",
  "dailyDateKey",
  "rulesetVersion",
] as const;
const MAX_ID_LENGTH = 160;
const MAX_SEED_LENGTH = 256;
const MAX_RULESET_VERSION_LENGTH = 80;
const MAX_DATE_TIMESTAMP = 8_640_000_000_000_000;
const UTC_DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export function encodeSoloRunHistory(summaries: readonly SoloRunSummary[]): string | undefined {
  const normalized = normalizeSummaries(summaries);
  if (!normalized) {
    return undefined;
  }

  return JSON.stringify({
    version: SOLO_RUN_HISTORY_VERSION,
    summaries: normalized,
  } satisfies StoredSoloRunHistory);
}

export function decodeSoloRunHistory(serialized: string): readonly SoloRunSummary[] | undefined {
  try {
    const history = readExactRecord(JSON.parse(serialized) as unknown, HISTORY_KEYS);
    if (
      !history
      || history.version !== SOLO_RUN_HISTORY_VERSION
      || !Array.isArray(history.summaries)
      || history.summaries.length > SOLO_RUN_HISTORY_LIMIT
    ) {
      return undefined;
    }

    const summaries: SoloRunSummary[] = [];
    const ids = new Set<string>();
    for (const value of history.summaries) {
      const summary = readSummary(value);
      if (!summary || ids.has(summary.id)) {
        return undefined;
      }

      ids.add(summary.id);
      summaries.push(summary);
    }

    if (!isNewestFirst(summaries)) {
      return undefined;
    }

    return freezeSummaries(summaries);
  } catch {
    return undefined;
  }
}

export function loadSoloRunHistory(
  storage: RunHistoryStorageLike | null | undefined,
): readonly SoloRunSummary[] {
  if (!storage) {
    return freezeSummaries([]);
  }

  try {
    const serialized = storage.getItem(SOLO_RUN_HISTORY_STORAGE_KEY);
    if (serialized === null) {
      return freezeSummaries([]);
    }

    return decodeSoloRunHistory(serialized) ?? freezeSummaries([]);
  } catch {
    return freezeSummaries([]);
  }
}

export function saveSoloRunHistory(
  storage: RunHistoryStorageLike | null | undefined,
  summaries: readonly SoloRunSummary[],
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const serialized = encodeSoloRunHistory(summaries);
    if (!serialized) {
      return false;
    }

    storage.setItem(SOLO_RUN_HISTORY_STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function recordSoloRunSummary(
  storage: RunHistoryStorageLike | null | undefined,
  value: SoloRunSummary,
): boolean {
  if (!storage) {
    return false;
  }

  const summary = readSummary(value);
  if (!summary) {
    return false;
  }

  let existing: readonly SoloRunSummary[];
  try {
    const serialized = storage.getItem(SOLO_RUN_HISTORY_STORAGE_KEY);
    if (serialized === null) {
      existing = [];
    } else {
      // A malformed document is never partially trusted; a valid completion replaces it.
      existing = decodeSoloRunHistory(serialized) ?? [];
    }
  } catch {
    return false;
  }

  const sameId = existing.find((item) => item.id === summary.id);
  if (sameId) {
    return summariesEqual(sameId, summary);
  }

  return saveSoloRunHistory(storage, [summary, ...existing]);
}

export function queueSoloRunSummary(
  storage: RunHistoryStorageLike | null | undefined,
  value: SoloRunSummary,
): boolean {
  if (!storage) {
    return false;
  }

  const summary = readSummary(value);
  if (!summary) {
    return false;
  }

  try {
    const serialized = storage.getItem(SOLO_RUN_HISTORY_OUTBOX_STORAGE_KEY);
    const pending = serialized === null ? [] : decodeSoloRunHistory(serialized);
    if (!pending) {
      return false;
    }

    const sameId = pending.find((item) => item.id === summary.id);
    if (sameId) {
      return summariesEqual(sameId, summary);
    }

    const next = encodeSoloRunHistory([summary, ...pending]);
    if (!next) {
      return false;
    }
    storage.setItem(SOLO_RUN_HISTORY_OUTBOX_STORAGE_KEY, next);
    return true;
  } catch {
    return false;
  }
}

export function flushQueuedSoloRunSummaries(
  storage: RunHistoryStorageLike | null | undefined,
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const serialized = storage.getItem(SOLO_RUN_HISTORY_OUTBOX_STORAGE_KEY);
    if (serialized === null) {
      return true;
    }

    const pending = decodeSoloRunHistory(serialized);
    if (!pending) {
      return false;
    }

    for (const summary of [...pending].reverse()) {
      if (!recordSoloRunSummary(storage, summary)) {
        return false;
      }
    }

    storage.removeItem(SOLO_RUN_HISTORY_OUTBOX_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function clearSoloRunHistory(storage: RunHistoryStorageLike | null | undefined): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(SOLO_RUN_HISTORY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function normalizeSummaries(values: readonly SoloRunSummary[]): SoloRunSummary[] | undefined {
  const parsed: SoloRunSummary[] = [];
  for (const value of values) {
    const summary = readSummary(value);
    if (!summary) {
      return undefined;
    }
    parsed.push(summary);
  }

  parsed.sort(compareNewestFirst);
  const normalized: SoloRunSummary[] = [];
  const ids = new Map<string, SoloRunSummary>();
  for (const summary of parsed) {
    const sameId = ids.get(summary.id);
    if (sameId) {
      if (!summariesEqual(sameId, summary)) {
        return undefined;
      }
      continue;
    }

    ids.set(summary.id, summary);
    normalized.push(summary);
  }

  return normalized.slice(0, SOLO_RUN_HISTORY_LIMIT);
}

function readSummary(value: unknown): SoloRunSummary | undefined {
  const summary = readExactRecord(value, SUMMARY_KEYS);
  if (!summary) {
    return undefined;
  }

  const id = readBoundedString(summary.id, MAX_ID_LENGTH);
  const seed = readBoundedString(summary.seed, MAX_SEED_LENGTH);
  const botDifficulty = readBotDifficulty(summary.botDifficulty);
  const outcome = readOutcome(summary.outcome);
  const round = readInteger(summary.round, 1, MAX_RUN_ROUNDS);
  const playerHp = readInteger(summary.playerHp, 0, PLAYER_STARTING_HP);
  const enemyHp = readInteger(summary.enemyHp, 0, ENEMY_STARTING_HP);
  const completedAt = readInteger(summary.completedAt, 1, MAX_DATE_TIMESTAMP);
  const source = readSource(summary.source);
  const dailyDateKey = summary.dailyDateKey === null ? null : readUtcDateKey(summary.dailyDateKey);
  const rulesetVersion = readBoundedString(summary.rulesetVersion, MAX_RULESET_VERSION_LENGTH);
  if (
    id === undefined
    || seed === undefined
    || botDifficulty === undefined
    || outcome === undefined
    || round === undefined
    || playerHp === undefined
    || enemyHp === undefined
    || completedAt === undefined
    || source === undefined
    || dailyDateKey === undefined
    || rulesetVersion === undefined
    || (source === "daily" ? dailyDateKey === null : dailyDateKey !== null)
  ) {
    return undefined;
  }

  return {
    id,
    seed,
    botDifficulty,
    outcome,
    round,
    playerHp,
    enemyHp,
    completedAt,
    source,
    dailyDateKey,
    rulesetVersion,
  };
}

function readExactRecord<const TKeys extends readonly string[]>(
  value: unknown,
  keys: TKeys,
): Record<TKeys[number], unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record);
  if (actualKeys.length !== keys.length || keys.some((key) => !Object.hasOwn(record, key))) {
    return undefined;
  }

  return record as Record<TKeys[number], unknown>;
}

function readBoundedString(value: unknown, maxLength: number): string | undefined {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength
    ? value
    : undefined;
}

function readInteger(value: unknown, minimum: number, maximum: number): number | undefined {
  return Number.isSafeInteger(value) && (value as number) >= minimum && (value as number) <= maximum
    ? value as number
    : undefined;
}

function readBotDifficulty(value: unknown): BotDifficulty | undefined {
  return value === "standard" || value === "strong" ? value : undefined;
}

function readOutcome(value: unknown): CombatWinner | undefined {
  return value === "player" || value === "enemy" || value === "draw" ? value : undefined;
}

function readSource(value: unknown): RunSource | undefined {
  return value === "standard" || value === "daily" ? value : undefined;
}

function readUtcDateKey(value: unknown): string | undefined {
  if (typeof value !== "string" || !UTC_DATE_KEY_PATTERN.test(value)) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

function compareNewestFirst(left: SoloRunSummary, right: SoloRunSummary): number {
  if (left.completedAt !== right.completedAt) {
    return right.completedAt - left.completedAt;
  }
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function isNewestFirst(summaries: readonly SoloRunSummary[]): boolean {
  return summaries.every((summary, index) => (
    index === 0 || compareNewestFirst(summaries[index - 1], summary) <= 0
  ));
}

function getCompletionKey(summary: SoloRunSummary): string {
  return JSON.stringify([
    summary.seed,
    summary.botDifficulty,
    summary.outcome,
    summary.round,
    summary.playerHp,
    summary.enemyHp,
    summary.completedAt,
    summary.source,
    summary.dailyDateKey,
    summary.rulesetVersion,
  ]);
}

function summariesEqual(left: SoloRunSummary, right: SoloRunSummary): boolean {
  return left.id === right.id && getCompletionKey(left) === getCompletionKey(right);
}

function freezeSummaries(summaries: readonly SoloRunSummary[]): readonly SoloRunSummary[] {
  return Object.freeze(summaries.map((summary) => Object.freeze({ ...summary })));
}
