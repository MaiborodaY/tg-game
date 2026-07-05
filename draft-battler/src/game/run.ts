import {
  cloneBoardSlots,
  createBoardFromSlots,
  createDraftOptions,
  createEmptyBoardSlots,
  createEnemyBoardSlots,
  getBoardCapacityForRound,
  isCardAllowedInSlot,
} from "./draft";
import { resolveCombat } from "./combat";
import {
  MAX_RUN_ROUNDS,
  PLAYER_STARTING_HP,
  type BoardSlot,
  type CardId,
  type CombatResult,
  type RoundRecord,
  type RunState,
} from "./types";

export function createRun(seed: string): RunState {
  return {
    seed,
    round: 1,
    playerHp: PLAYER_STARTING_HP,
    status: "draft",
    draftOptions: createDraftOptions(seed, 1),
    draftRerollCount: 0,
    boardSlots: createEmptyBoardSlots(),
    enemyBoardSlots: createEmptyBoardSlots(),
    roundHistory: [],
  };
}

export function chooseDraftCards(state: RunState, boardSlots: readonly BoardSlot[]): RunState {
  assertStatus(state, "draft");

  return {
    ...state,
    status: "combat_ready",
    boardSlots: createBoardFromSlots(boardSlots, getBoardCapacityForRound(state.round)),
    enemyBoardSlots: createEnemyBoardSlots(state.seed, state.round),
  };
}

export function rerollDraftCards(state: RunState): RunState {
  assertStatus(state, "draft");

  const draftRerollCount = state.draftRerollCount + 1;

  return {
    ...state,
    draftRerollCount,
    draftOptions: createDraftOptions(state.seed, state.round, draftRerollCount),
  };
}

export function applyDraftSelectionToBoard(state: RunState, selection: readonly CardId[]): BoardSlot[] {
  assertStatus(state, "draft");

  const boardSlots = cloneBoardSlots(state.boardSlots);
  const capacity = getBoardCapacityForRound(state.round);
  const picks = selection.slice(0, 1);
  let replacementCursor = 0;

  picks.forEach((cardId) => {
    const upgradeSlot = boardSlots.find(
      (slot) =>
        slot.slotIndex < capacity &&
        slot.cardId === cardId &&
        slot.upgradeLevel === 0 &&
        isCardAllowedInSlot(cardId, slot.slotIndex),
    );
    if (upgradeSlot) {
      upgradeSlot.upgradeLevel = 1;
      return;
    }

    const emptySlot = boardSlots.find(
      (slot) => slot.slotIndex < capacity && slot.cardId === null && isCardAllowedInSlot(cardId, slot.slotIndex),
    );
    if (emptySlot) {
      emptySlot.cardId = cardId;
      emptySlot.upgradeLevel = 0;
      return;
    }

    const replacementSlots = boardSlots.filter((slot) => slot.slotIndex < capacity && isCardAllowedInSlot(cardId, slot.slotIndex));
    const targetSlot = replacementSlots[replacementCursor % replacementSlots.length];
    replacementCursor += 1;
    if (targetSlot) {
      targetSlot.cardId = cardId;
      targetSlot.upgradeLevel = 0;
    }
  });

  return boardSlots;
}

export function resolveRound(state: RunState): RunState {
  assertStatus(state, "combat_ready");

  const combatResult = resolveCombat(state.boardSlots, state.enemyBoardSlots, state.round);
  const nextHp = Math.max(0, state.playerHp - combatResult.hpLoss);
  const roundRecord = createRoundRecord(state, nextHp, combatResult);
  const finished = nextHp <= 0 || state.round >= MAX_RUN_ROUNDS;

  if (finished) {
    return {
      ...state,
      playerHp: nextHp,
      status: "finished",
      roundHistory: [...state.roundHistory, roundRecord],
    };
  }

  const nextRound = state.round + 1;

  return {
    ...state,
    round: nextRound,
    playerHp: nextHp,
    status: "draft",
    draftOptions: createDraftOptions(state.seed, nextRound),
    draftRerollCount: 0,
    boardSlots: cloneBoardSlots(state.boardSlots),
    enemyBoardSlots: createEmptyBoardSlots(),
    roundHistory: [...state.roundHistory, roundRecord],
  };
}

export function autoplayRun(seed: string, pickStrategy: (state: RunState) => readonly CardId[]): RunState {
  let state = createRun(seed);

  while (state.status !== "finished") {
    state = chooseDraftCards(state, applyDraftSelectionToBoard(state, pickStrategy(state)));
    state = resolveRound(state);
  }

  return state;
}

export function getLastCombatResult(state: RunState): CombatResult | undefined {
  return state.roundHistory[state.roundHistory.length - 1]?.combatResult;
}

function assertStatus(state: RunState, expectedStatus: RunState["status"]): void {
  if (state.status !== expectedStatus) {
    throw new Error(`Expected run status ${expectedStatus}, got ${state.status}.`);
  }
}

function createRoundRecord(state: RunState, playerHpAfter: number, combatResult: CombatResult): RoundRecord {
  return {
    round: state.round,
    playerHpBefore: state.playerHp,
    playerHpAfter,
    draftOptions: state.draftOptions.map((option) => ({ ...option })),
    draftRerollCount: state.draftRerollCount,
    playerSlots: cloneBoardSlots(state.boardSlots),
    enemySlots: cloneBoardSlots(state.enemyBoardSlots),
    combatResult,
  };
}
