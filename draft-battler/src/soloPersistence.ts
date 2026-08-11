import { CARD_DEFINITIONS } from "./game/cards";
import {
  createDraftOptions,
  isCardAllowedInSlot,
} from "./game/draft";
import { chooseDraftCards, createRun, resolveRound } from "./game/run";
import {
  BOARD_SLOT_COUNT,
  ENEMY_STARTING_HP,
  FREE_REROLLS_PER_ROUND,
  MAX_RUN_ROUNDS,
  MAX_UPGRADE_LEVEL,
  PLAYER_STARTING_HP,
  type BoardSlot,
  type CardId,
  type CombatWinner,
  type DraftOption,
  type RoundRecord,
  type RunState,
} from "./game/types";

// Bump this whenever persisted state or deterministic combat semantics become incompatible.
export const SOLO_RUN_SNAPSHOT_VERSION = 5;
export const SOLO_RUN_STORAGE_KEY = `draft-battler:solo-run:v${SOLO_RUN_SNAPSHOT_VERSION}`;
const LEGACY_SOLO_RUN_STORAGE_KEYS = [
  "draft-battler:solo-run:v1",
  "draft-battler:solo-run:v2",
  "draft-battler:solo-run:v3",
  "draft-battler:solo-run:v4",
] as const;

export type SoloRunCheckpoint = "draft" | "battle_result" | "finished";

export interface SoloRunSnapshotState {
  checkpoint: SoloRunCheckpoint;
  run: RunState;
  draftBoardSlots: BoardSlot[];
  cardPickedThisRound: boolean;
  lastRound: number;
}

export interface SoloRunSnapshot extends SoloRunSnapshotState {
  version: typeof SOLO_RUN_SNAPSHOT_VERSION;
  savedAt: number;
}

export interface SoloRunStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const VALID_CARD_IDS = new Set<CardId>(CARD_DEFINITIONS.map((card) => card.id));
const SNAPSHOT_KEYS = [
  "version",
  "savedAt",
  "checkpoint",
  "run",
  "draftBoardSlots",
  "cardPickedThisRound",
  "lastRound",
] as const;
const RUN_KEYS = [
  "seed",
  "round",
  "playerHp",
  "enemyHp",
  "status",
  "outcome",
  "draftOptions",
  "draftRerollCount",
  "boardSlots",
  "enemyBoardSlots",
  "roundHistory",
] as const;
const ROUND_RECORD_KEYS = [
  "round",
  "playerHpBefore",
  "playerHpAfter",
  "enemyHpBefore",
  "enemyHpAfter",
  "draftOptions",
  "draftRerollCount",
  "playerSlots",
  "enemySlots",
  "combatResult",
] as const;
const BOARD_SLOT_KEYS = ["slotIndex", "cardId", "upgradeLevel"] as const;

export function createSoloRunSnapshot(
  state: SoloRunSnapshotState,
  savedAt = Date.now(),
): SoloRunSnapshot | undefined {
  try {
    return readSnapshot({ ...state, version: SOLO_RUN_SNAPSHOT_VERSION, savedAt });
  } catch {
    return undefined;
  }
}

export function encodeSoloRunSnapshot(
  state: SoloRunSnapshotState,
  savedAt = Date.now(),
): string | undefined {
  const snapshot = createSoloRunSnapshot(state, savedAt);
  return snapshot ? JSON.stringify(snapshot) : undefined;
}

export function decodeSoloRunSnapshot(serialized: string): SoloRunSnapshot | undefined {
  try {
    return readSnapshot(JSON.parse(serialized) as unknown);
  } catch {
    return undefined;
  }
}

export function saveSoloRunSnapshot(
  storage: SoloRunStorage | null | undefined,
  state: SoloRunSnapshotState,
  savedAt = Date.now(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const serialized = encodeSoloRunSnapshot(state, savedAt);
    if (!serialized) {
      return false;
    }

    storage.setItem(SOLO_RUN_STORAGE_KEY, serialized);
    removeLegacySoloRunSnapshots(storage);
    return true;
  } catch {
    return false;
  }
}

export function loadSoloRunSnapshot(storage: SoloRunStorage | null | undefined): SoloRunSnapshot | undefined {
  if (!storage) {
    return undefined;
  }

  removeLegacySoloRunSnapshots(storage);

  let serialized: string | null;
  try {
    serialized = storage.getItem(SOLO_RUN_STORAGE_KEY);
  } catch {
    return undefined;
  }

  if (serialized === null) {
    return undefined;
  }

  const snapshot = decodeSoloRunSnapshot(serialized);
  if (!snapshot) {
    clearSoloRunSnapshot(storage);
  }

  return snapshot;
}

export function clearSoloRunSnapshot(storage: SoloRunStorage | null | undefined): boolean {
  if (!storage) {
    return false;
  }

  let cleared = true;
  for (const key of [SOLO_RUN_STORAGE_KEY, ...LEGACY_SOLO_RUN_STORAGE_KEYS]) {
    try {
      storage.removeItem(key);
    } catch {
      cleared = false;
    }
  }

  return cleared;
}

function removeLegacySoloRunSnapshots(storage: SoloRunStorage): void {
  for (const key of LEGACY_SOLO_RUN_STORAGE_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      // Legacy cleanup is best-effort and must not block a valid current save or load.
    }
  }
}

function readSnapshot(value: unknown): SoloRunSnapshot | undefined {
  const snapshot = readExactRecord(value, SNAPSHOT_KEYS);
  if (!snapshot || snapshot.version !== SOLO_RUN_SNAPSHOT_VERSION) {
    return undefined;
  }

  const savedAt = readInteger(snapshot.savedAt, 0, Number.MAX_SAFE_INTEGER);
  const checkpoint = readCheckpoint(snapshot.checkpoint);
  const run = readRunState(snapshot.run);
  const draftBoardSlots = readBoardSlots(snapshot.draftBoardSlots);
  const cardPickedThisRound = readBoolean(snapshot.cardPickedThisRound);
  const lastRound = readInteger(snapshot.lastRound, 1, MAX_RUN_ROUNDS);

  if (
    savedAt === undefined ||
    !checkpoint ||
    !run ||
    !draftBoardSlots ||
    cardPickedThisRound === undefined ||
    lastRound === undefined ||
    !hasValidCheckpointState(checkpoint, run, draftBoardSlots, cardPickedThisRound, lastRound)
  ) {
    return undefined;
  }

  return {
    version: SOLO_RUN_SNAPSHOT_VERSION,
    savedAt,
    checkpoint,
    run,
    draftBoardSlots,
    cardPickedThisRound,
    lastRound,
  };
}

function readRunState(value: unknown): RunState | undefined {
  const run = readExactRecord(value, RUN_KEYS);
  if (!run) {
    return undefined;
  }

  const seed = readString(run.seed, 1, 256);
  const round = readInteger(run.round, 1, MAX_RUN_ROUNDS);
  const playerHp = readInteger(run.playerHp, 0, PLAYER_STARTING_HP);
  const enemyHp = readInteger(run.enemyHp, 0, ENEMY_STARTING_HP);
  const status = run.status === "draft" || run.status === "finished" ? run.status : undefined;
  const outcome = readCombatWinnerOrNull(run.outcome);
  const draftRerollCount = readInteger(run.draftRerollCount, 0, FREE_REROLLS_PER_ROUND);
  const boardSlots = readBoardSlots(run.boardSlots);
  const enemyBoardSlots = readBoardSlots(run.enemyBoardSlots);

  if (
    !seed ||
    round === undefined ||
    playerHp === undefined ||
    enemyHp === undefined ||
    !status ||
    outcome === undefined ||
    draftRerollCount === undefined ||
    !boardSlots ||
    !enemyBoardSlots
  ) {
    return undefined;
  }

  const draftOptions = readExpectedDraftOptions(run.draftOptions, seed, round, draftRerollCount);
  const expectedHistoryLength = status === "finished" ? round : round - 1;
  const replay = readRoundHistory(run.roundHistory, seed, expectedHistoryLength);
  if (!draftOptions || !replay) {
    return undefined;
  }

  const normalizedRun: RunState = {
    seed,
    round,
    playerHp,
    enemyHp,
    status,
    outcome,
    draftOptions,
    draftRerollCount,
    boardSlots,
    enemyBoardSlots,
    roundHistory: replay.records,
  };

  const expectedRun = replay.run.status === "draft"
    ? { ...replay.run, draftOptions, draftRerollCount }
    : replay.run;

  return stableEqual(normalizedRun, expectedRun) ? normalizedRun : undefined;
}

interface ReplayedRoundHistory {
  records: RoundRecord[];
  run: RunState;
}

function readRoundHistory(value: unknown, seed: string, expectedLength: number): ReplayedRoundHistory | undefined {
  if (!Array.isArray(value) || value.length !== expectedLength) {
    return undefined;
  }

  const history: RoundRecord[] = [];
  let replayedRun = createRun(seed);

  for (let index = 0; index < value.length; index += 1) {
    const replay = readRoundRecord(value[index], replayedRun, history);
    if (!replay) {
      return undefined;
    }

    history.push(replay.record);
    replayedRun = replay.run;
  }

  return { records: history, run: replayedRun };
}

interface ReplayedRound {
  record: RoundRecord;
  run: RunState;
}

function readRoundRecord(
  value: unknown,
  draftRun: RunState,
  history: readonly RoundRecord[],
): ReplayedRound | undefined {
  const record = readExactRecord(value, ROUND_RECORD_KEYS);
  if (!record || draftRun.status !== "draft" || record.round !== draftRun.round) {
    return undefined;
  }

  const draftRerollCount = readInteger(record.draftRerollCount, 0, FREE_REROLLS_PER_ROUND);
  const playerSlots = readBoardSlots(record.playerSlots);
  const enemySlots = readBoardSlots(record.enemySlots);
  const playerHpBefore = readInteger(record.playerHpBefore, 0, PLAYER_STARTING_HP);
  const playerHpAfter = readInteger(record.playerHpAfter, 0, PLAYER_STARTING_HP);
  const enemyHpBefore = readInteger(record.enemyHpBefore, 0, ENEMY_STARTING_HP);
  const enemyHpAfter = readInteger(record.enemyHpAfter, 0, ENEMY_STARTING_HP);
  if (
    draftRerollCount === undefined ||
    !playerSlots ||
    !enemySlots ||
    playerHpBefore === undefined ||
    playerHpAfter === undefined ||
    enemyHpBefore === undefined ||
    enemyHpAfter === undefined
  ) {
    return undefined;
  }

  const draftOptions = readExpectedDraftOptions(
    record.draftOptions,
    draftRun.seed,
    draftRun.round,
    draftRerollCount,
  );
  if (!draftOptions || !isValidRoundPlayerBoard(draftRun.boardSlots, playerSlots, draftOptions)) {
    return undefined;
  }

  const preparedDraftRun: RunState = {
    ...draftRun,
    draftOptions,
    draftRerollCount,
    roundHistory: [...history],
  };
  const combatReadyRun = chooseDraftCards(preparedDraftRun, playerSlots);
  if (!stableEqual(combatReadyRun.enemyBoardSlots, enemySlots)) {
    return undefined;
  }

  const resolvedRun = resolveRound(combatReadyRun);
  const expectedRecord = resolvedRun.roundHistory.at(-1);
  if (!expectedRecord || !stableEqual(record, expectedRecord)) {
    return undefined;
  }

  return { record: expectedRecord, run: resolvedRun };
}

function readExpectedDraftOptions(
  value: unknown,
  seed: string,
  round: number,
  rerollCount: number,
): DraftOption[] | undefined {
  const expected = createDraftOptions(seed, round, rerollCount);
  return stableEqual(value, expected) ? expected.map((option) => ({ ...option })) : undefined;
}

function readBoardSlots(value: unknown): BoardSlot[] | undefined {
  if (!Array.isArray(value) || value.length !== BOARD_SLOT_COUNT) {
    return undefined;
  }

  const slots: BoardSlot[] = [];
  const usedIndices = new Set<number>();

  for (const candidate of value) {
    const slot = readExactRecord(candidate, BOARD_SLOT_KEYS);
    if (!slot) {
      return undefined;
    }

    const slotIndex = readInteger(slot.slotIndex, 0, BOARD_SLOT_COUNT - 1);
    const cardId = slot.cardId === null ? null : readCardId(slot.cardId);
    const upgradeLevel = readInteger(slot.upgradeLevel, 0, MAX_UPGRADE_LEVEL);
    if (
      slotIndex === undefined ||
      cardId === undefined ||
      upgradeLevel === undefined ||
      usedIndices.has(slotIndex) ||
      (cardId === null && upgradeLevel !== 0) ||
      (cardId !== null && !isCardAllowedInSlot(cardId, slotIndex))
    ) {
      return undefined;
    }

    usedIndices.add(slotIndex);
    slots.push({ slotIndex, cardId, upgradeLevel: upgradeLevel as BoardSlot["upgradeLevel"] });
  }

  return slots.sort((left, right) => left.slotIndex - right.slotIndex);
}

function hasValidCheckpointState(
  checkpoint: SoloRunCheckpoint,
  run: RunState,
  draftBoardSlots: BoardSlot[],
  cardPickedThisRound: boolean,
  lastRound: number,
): boolean {
  if (checkpoint === "draft") {
    return run.status === "draft" &&
      lastRound === Math.max(1, run.round - 1) &&
      isValidDraftBoard(run, draftBoardSlots, cardPickedThisRound);
  }

  if (cardPickedThisRound || !stableEqual(draftBoardSlots, run.boardSlots)) {
    return false;
  }

  if (checkpoint === "battle_result") {
    return run.status === "draft" && run.round >= 2 && lastRound === run.round - 1;
  }

  return run.status === "finished" && lastRound === run.round;
}

function isValidDraftBoard(run: RunState, draftBoardSlots: BoardSlot[], cardPickedThisRound: boolean): boolean {
  if (!cardPickedThisRound) {
    return stableEqual(getBoardUnitMultiset(draftBoardSlots), getBoardUnitMultiset(run.boardSlots));
  }

  return run.draftOptions.some((option) => isValidPickedBoard(run.boardSlots, draftBoardSlots, option.cardId));
}

function isValidRoundPlayerBoard(
  before: readonly BoardSlot[],
  after: readonly BoardSlot[],
  options: readonly DraftOption[],
): boolean {
  if (stableEqual(getBoardUnitMultiset(before), getBoardUnitMultiset(after))) {
    return true;
  }

  return options.some((option) => isValidPickedBoard(before, after, option.cardId));
}

function isValidPickedBoard(before: readonly BoardSlot[], after: readonly BoardSlot[], pickedCardId: CardId): boolean {
  const beforeUnits = getBoardUnitMultiset(before);
  const afterUnits = getBoardUnitMultiset(after);
  const upgradeKey = getBoardUnitKey(pickedCardId, 0);
  const upgradeIndex = beforeUnits.indexOf(upgradeKey);

  if (upgradeIndex >= 0) {
    const expected = [...beforeUnits];
    expected.splice(upgradeIndex, 1);
    expected.push(getBoardUnitKey(pickedCardId, 1));
    return stableEqual(expected.sort(), afterUnits);
  }

  if (beforeUnits.length < BOARD_SLOT_COUNT) {
    return stableEqual([...beforeUnits, getBoardUnitKey(pickedCardId, 0)].sort(), afterUnits);
  }

  return beforeUnits.some((_, replacedIndex) => {
    const expected = beforeUnits.filter((__, index) => index !== replacedIndex);
    expected.push(getBoardUnitKey(pickedCardId, 0));
    return stableEqual(expected.sort(), afterUnits);
  });
}

function getBoardUnitMultiset(slots: readonly BoardSlot[]): string[] {
  return slots
    .flatMap((slot) => (slot.cardId ? [getBoardUnitKey(slot.cardId, slot.upgradeLevel)] : []))
    .sort();
}

function getBoardUnitKey(cardId: CardId, upgradeLevel: BoardSlot["upgradeLevel"]): string {
  return `${cardId}:${upgradeLevel}`;
}

function readCheckpoint(value: unknown): SoloRunCheckpoint | undefined {
  return value === "draft" || value === "battle_result" || value === "finished" ? value : undefined;
}

function readCombatWinnerOrNull(value: unknown): CombatWinner | null | undefined {
  return value === null || value === "player" || value === "enemy" || value === "draw" ? value : undefined;
}

function readCardId(value: unknown): CardId | undefined {
  return typeof value === "string" && VALID_CARD_IDS.has(value as CardId) ? value as CardId : undefined;
}

function readString(value: unknown, minLength: number, maxLength: number): string | undefined {
  return typeof value === "string" && value.length >= minLength && value.length <= maxLength ? value : undefined;
}

function readInteger(value: unknown, minimum: number, maximum: number): number | undefined {
  return Number.isSafeInteger(value) && Number(value) >= minimum && Number(value) <= maximum ? Number(value) : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readExactRecord<const Keys extends readonly string[]>(
  value: unknown,
  allowedKeys: Keys,
): Record<Keys[number], unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expectedKeys = [...allowedKeys].sort();
  return stableEqual(keys, expectedKeys) ? record as Record<Keys[number], unknown> : undefined;
}

function stableEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(toCanonicalJson(left)) === JSON.stringify(toCanonicalJson(right));
}

function toCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toCanonicalJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, toCanonicalJson(entry)]),
    );
  }

  return value;
}
