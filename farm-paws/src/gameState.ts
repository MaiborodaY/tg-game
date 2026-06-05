export type GamePhase = "idle" | "showing" | "input" | "success" | "failed";

export type SequenceStep = {
  cellIndex: number;
};

export type InputResult = "ignored" | "correct" | "mistake" | "roundComplete" | "failed";
export type InputStatus = "correct" | "wrong" | null;

export type GameState = {
  phase: GamePhase;
  round: number;
  score: number;
  bestScore: number;
  hp: number;
  maxHp: number;
  plotEmojis: string[];
  sequence: SequenceStep[];
  inputIndex: number;
  lastInputCell: number | null;
  lastInputStatus: InputStatus;
};

const CELL_COUNT = 9;
const START_HP = 3;
const FIRST_ROUND_LENGTH = 3;
const REPEAT_ALLOWED_ROUND = 7;
const BASE_SHOW_MS = 820;
const SHOW_SPEEDUP_PER_ROUND_MS = 42;
const MIN_SHOW_MS = 420;
const DEFAULT_PLOT_EMOJIS = ["🌱", "🌿", "🌾", "🥕", "🥬", "🥒", "🍅", "🌽", "🥔"];
const ROUND_PLOT_EMOJI_POOL = [
  "🌱",
  "🌿",
  "🌾",
  "🥕",
  "🥬",
  "🥒",
  "🍅",
  "🌽",
  "🥔",
  "🍓",
  "🥭",
  "🌶️",
  "🫑",
  "🍆",
  "🫘"
];

export function createInitialState(bestScore = 0): GameState {
  return {
    phase: "idle",
    round: 1,
    score: 0,
    bestScore: Math.max(0, Math.floor(bestScore)),
    hp: START_HP,
    maxHp: START_HP,
    plotEmojis: [...DEFAULT_PLOT_EMOJIS],
    sequence: [],
    inputIndex: 0,
    lastInputCell: null,
    lastInputStatus: null
  };
}

export function sequenceLengthForRound(round: number): number {
  return FIRST_ROUND_LENGTH + Math.max(0, Math.floor(round) - 1);
}

export function showDurationForRound(round: number): number {
  const duration = BASE_SHOW_MS - (Math.max(1, Math.floor(round)) - 1) * SHOW_SPEEDUP_PER_ROUND_MS;
  return Math.max(MIN_SHOW_MS, duration);
}

export function mockPetXpForScore(score: number): number {
  if (score <= 0) return 0;
  return Math.max(5, Math.round(score * 1.8));
}

export function createRoundSequence(round: number, random: () => number = Math.random): SequenceStep[] {
  const length = sequenceLengthForRound(round);
  const allowImmediateRepeat = round >= REPEAT_ALLOWED_ROUND;
  const sequence: SequenceStep[] = [];

  for (let index = 0; index < length; index += 1) {
    let cellIndex = randomIndex(CELL_COUNT, random);
    const previous = sequence[index - 1];
    if (!allowImmediateRepeat && previous) {
      while (cellIndex === previous.cellIndex) {
        cellIndex = randomIndex(CELL_COUNT, random);
      }
    }

    sequence.push({
      cellIndex
    });
  }

  return sequence;
}

export function createRoundPlotEmojis(random: () => number = Math.random): string[] {
  const bag = [...ROUND_PLOT_EMOJI_POOL];
  const plots: string[] = [];

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (bag.length < 1) {
      bag.push(...ROUND_PLOT_EMOJI_POOL);
    }
    const pickIndex = randomIndex(bag.length, random);
    const [emoji] = bag.splice(pickIndex, 1);
    plots.push(emoji || DEFAULT_PLOT_EMOJIS[index] || "🌱");
  }

  return plots;
}

export function defaultPlotEmojis(): string[] {
  return [...DEFAULT_PLOT_EMOJIS];
}

export function startGame(bestScore = 0, random: () => number = Math.random): GameState {
  return startRound({
    ...createInitialState(bestScore),
    phase: "showing"
  }, 1, random);
}

export function startNextRound(state: GameState, random: () => number = Math.random): GameState {
  return startRound({
    ...state,
    round: state.round + 1,
    phase: "showing",
    inputIndex: 0,
    lastInputCell: null,
    lastInputStatus: null
  }, state.round + 1, random);
}

export function markReadyForInput(state: GameState): GameState {
  if (state.phase !== "showing") return state;
  return {
    ...state,
    phase: "input",
    inputIndex: 0,
    lastInputCell: null,
    lastInputStatus: null
  };
}

export function handleCellInput(state: GameState, cellIndex: number): { state: GameState; result: InputResult } {
  if (state.phase !== "input") {
    return { state, result: "ignored" };
  }

  const expected = state.sequence[state.inputIndex];
  if (!expected || expected.cellIndex !== cellIndex) {
    const hp = Math.max(0, state.hp - 1);
    const mistakeState = {
      ...state,
      phase: hp <= 0 ? "failed" as const : "input" as const,
      hp,
      bestScore: Math.max(state.bestScore, state.score),
      lastInputCell: cellIndex,
      lastInputStatus: "wrong" as const
    };
    return { state: mistakeState, result: hp <= 0 ? "failed" : "mistake" };
  }

  const nextScore = state.score + 1;
  const nextInputIndex = state.inputIndex + 1;
  const roundComplete = nextInputIndex >= state.sequence.length;

  const nextState = {
    ...state,
    phase: roundComplete ? "success" as const : "input" as const,
    score: nextScore,
    bestScore: Math.max(state.bestScore, nextScore),
    inputIndex: nextInputIndex,
    lastInputCell: cellIndex,
    lastInputStatus: "correct" as const
  };

  return { state: nextState, result: roundComplete ? "roundComplete" : "correct" };
}

function startRound(state: GameState, round: number, random: () => number): GameState {
  return {
    ...state,
    phase: "showing",
    round,
    plotEmojis: createRoundPlotEmojis(random),
    sequence: createRoundSequence(round, random),
    inputIndex: 0,
    lastInputCell: null,
    lastInputStatus: null
  };
}

function randomIndex(length: number, random: () => number): number {
  return Math.max(0, Math.min(length - 1, Math.floor(random() * length)));
}
