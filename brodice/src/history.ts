import { isDieFace, isRollTarget, type DieFace, type RollTarget } from "./dice.ts";

export const HISTORY_STORAGE_KEY = "brodice.roll-history.v1";
export const HISTORY_LIMIT = 20;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type RollRecord = Readonly<{
  version: 1;
  id: string;
  createdAt: number;
  target: RollTarget;
  faces: readonly DieFace[];
}>;

export function createRollRecord(
  faces: readonly DieFace[],
  target: RollTarget,
  createdAt = Date.now(),
): RollRecord {
  if (faces.length < 1 || faces.length > 100 || !faces.every(isDieFace)) {
    throw new Error("A roll must contain between 1 and 100 valid d6 results.");
  }
  if (!isRollTarget(target)) throw new Error("Invalid success target.");
  if (!Number.isSafeInteger(createdAt) || createdAt <= 0) throw new Error("Invalid roll timestamp.");

  const stableFaces = Object.freeze([...faces]);
  return Object.freeze({
    version: 1,
    id: `${createdAt.toString(36)}-${hashFaces(stableFaces)}`,
    createdAt,
    target,
    faces: stableFaces,
  });
}

export function loadHistory(storage: StorageLike | null): readonly RollRecord[] {
  if (!storage) return Object.freeze([]);
  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return Object.freeze([]);
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Object.freeze([]);

    const records = parsed
      .map(parseRollRecord)
      .filter((record): record is RollRecord => record !== null)
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, HISTORY_LIMIT);
    return Object.freeze(records);
  } catch {
    return Object.freeze([]);
  }
}

export function prependHistory(
  storage: StorageLike | null,
  record: RollRecord,
  current: readonly RollRecord[] = loadHistory(storage),
): readonly RollRecord[] {
  const next = Object.freeze([
    record,
    ...current.filter((candidate) => candidate.id !== record.id),
  ].slice(0, HISTORY_LIMIT));
  persistHistory(storage, next);
  return next;
}

export function clearHistory(storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(HISTORY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function persistHistory(storage: StorageLike | null, records: readonly RollRecord[]): boolean {
  if (!storage) return false;
  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records.slice(0, HISTORY_LIMIT)));
    return true;
  } catch {
    return false;
  }
}

export function parseRollRecord(value: unknown): RollRecord | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RollRecord>;
  if (candidate.version !== 1 || !Array.isArray(candidate.faces) || !isRollTarget(candidate.target)) return null;
  if (!Number.isSafeInteger(candidate.createdAt) || Number(candidate.createdAt) <= 0) return null;
  if (candidate.faces.length < 1 || candidate.faces.length > 100 || !candidate.faces.every(isDieFace)) return null;

  try {
    return createRollRecord(candidate.faces as DieFace[], candidate.target, Number(candidate.createdAt));
  } catch {
    return null;
  }
}

function hashFaces(faces: readonly DieFace[]): string {
  let hash = 2_166_136_261;
  for (const face of faces) {
    hash ^= face;
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}
