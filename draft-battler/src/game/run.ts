import {
  advanceEnemyBoardSlots,
  cloneBoardSlots,
  createBoardFromSlots,
  createDraftOptions,
  createEmptyBoardSlots,
  getBoardCapacityForRound,
} from "./draft";
import { resolveCombat } from "./combat";
import { applyDraftPlacement, classifyDraftPlacement } from "./placement";
import {
  ENEMY_STARTING_HP,
  FREE_REROLLS_PER_ROUND,
  MAX_RUN_ROUNDS,
  PLAYER_STARTING_HP,
  type BoardSlot,
  type BotDifficulty,
  type CardId,
  type CombatResult,
  type RoundRecord,
  type RunState,
} from "./types";

export function createRun(seed: string, botDifficulty: BotDifficulty = "standard"): RunState {
  return {
    seed,
    botDifficulty,
    round: 1,
    playerHp: PLAYER_STARTING_HP,
    enemyHp: ENEMY_STARTING_HP,
    outcome: null,
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
    enemyBoardSlots: advanceEnemyBoardSlots(
      state.seed,
      state.round,
      state.enemyBoardSlots,
      state.botDifficulty,
    ).boardSlots,
  };
}

export function rerollDraftCards(state: RunState): RunState {
  assertStatus(state, "draft");

  if (!canRerollDraftCards(state)) {
    throw new Error("The free reroll for this round has already been used.");
  }

  const draftRerollCount = state.draftRerollCount + 1;

  return {
    ...state,
    draftRerollCount,
    draftOptions: createDraftOptions(state.seed, state.round, draftRerollCount),
  };
}

export function canRerollDraftCards(state: RunState): boolean {
  return state.status === "draft" && state.draftRerollCount < FREE_REROLLS_PER_ROUND;
}

export function applyDraftSelectionToBoard(state: RunState, selection: readonly CardId[]): BoardSlot[] {
  assertStatus(state, "draft");

  let boardSlots = cloneBoardSlots(state.boardSlots);
  const capacity = getBoardCapacityForRound(state.round);
  const picks = selection.slice(0, 1);

  picks.forEach((cardId) => {
    const placements = boardSlots
      .filter((slot) => slot.slotIndex < capacity)
      .map((slot) => classifyDraftPlacement(boardSlots, cardId, slot.slotIndex));
    const placement = placements.find((candidate) => candidate.kind === "upgrade")
      ?? placements.find((candidate) => candidate.kind === "place")
      ?? placements.find((candidate) => candidate.kind === "replace");
    if (!placement) {
      return;
    }

    const result = applyDraftPlacement(boardSlots, cardId, placement.targetSlotIndex, { allowReplacement: true });
    boardSlots = result.applied ? result.boardSlots : boardSlots;
  });

  return boardSlots;
}

export function resolveRound(state: RunState): RunState {
  assertStatus(state, "combat_ready");

  const combatResult = resolveCombat(state.boardSlots, state.enemyBoardSlots, state.round);
  const nextPlayerHp = Math.max(0, state.playerHp - combatResult.playerCastleDamage);
  const nextEnemyHp = Math.max(0, state.enemyHp - combatResult.enemyCastleDamage);
  const outcome = getTerminalRunOutcome(nextPlayerHp, nextEnemyHp, state.round);
  const roundRecord = createRoundRecord(state, nextPlayerHp, nextEnemyHp, combatResult);
  const finished = outcome !== null;

  if (finished) {
    return {
      ...state,
      playerHp: nextPlayerHp,
      enemyHp: nextEnemyHp,
      outcome,
      status: "finished",
      roundHistory: [...state.roundHistory, roundRecord],
    };
  }

  const nextRound = state.round + 1;

  return {
    ...state,
    round: nextRound,
    playerHp: nextPlayerHp,
    enemyHp: nextEnemyHp,
    outcome: null,
    status: "draft",
    draftOptions: createDraftOptions(state.seed, nextRound),
    draftRerollCount: 0,
    boardSlots: cloneBoardSlots(state.boardSlots),
    enemyBoardSlots: cloneBoardSlots(state.enemyBoardSlots),
    roundHistory: [...state.roundHistory, roundRecord],
  };
}

export function autoplayRun(
  seed: string,
  pickStrategy: (state: RunState) => readonly CardId[],
  botDifficulty: BotDifficulty = "standard",
): RunState {
  let state = createRun(seed, botDifficulty);

  while (state.status !== "finished") {
    state = chooseDraftCards(state, applyDraftSelectionToBoard(state, pickStrategy(state)));
    state = resolveRound(state);
  }

  return state;
}

export function getLastCombatResult(state: RunState): CombatResult | undefined {
  return state.roundHistory[state.roundHistory.length - 1]?.combatResult;
}

export function getTerminalRunOutcome(
  playerHp: number,
  enemyHp: number,
  round: number,
): RunState["outcome"] {
  if (playerHp <= 0 || enemyHp <= 0) {
    if (playerHp <= 0 && enemyHp <= 0) {
      return "draw";
    }

    return playerHp <= 0 ? "enemy" : "player";
  }

  if (round < MAX_RUN_ROUNDS) {
    return null;
  }

  if (playerHp === enemyHp) {
    return "draw";
  }

  return playerHp > enemyHp ? "player" : "enemy";
}

function assertStatus(state: RunState, expectedStatus: RunState["status"]): void {
  if (state.status !== expectedStatus) {
    throw new Error(`Expected run status ${expectedStatus}, got ${state.status}.`);
  }
}

function createRoundRecord(
  state: RunState,
  playerHpAfter: number,
  enemyHpAfter: number,
  combatResult: CombatResult,
): RoundRecord {
  return {
    round: state.round,
    playerHpBefore: state.playerHp,
    playerHpAfter,
    enemyHpBefore: state.enemyHp,
    enemyHpAfter,
    draftOptions: state.draftOptions.map((option) => ({ ...option })),
    draftRerollCount: state.draftRerollCount,
    playerSlots: cloneBoardSlots(state.boardSlots),
    enemySlots: cloneBoardSlots(state.enemyBoardSlots),
    combatResult,
  };
}
