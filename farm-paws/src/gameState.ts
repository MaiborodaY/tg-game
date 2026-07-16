export type GamePhase = "idle" | "showing" | "input" | "success" | "won" | "failed";
export type RoundMode = "normal" | "reverse" | "sprint" | "finale";

export type SequenceStep = {
  cellIndex: number;
};

export type InputResult = "ignored" | "correct" | "mistake" | "roundComplete" | "won" | "failed";
export type InputStatus = "correct" | "wrong" | null;

export type GameState = {
  phase: GamePhase;
  round: number;
  roundMode: RoundMode;
  score: number;
  bestScore: number;
  hp: number;
  maxHp: number;
  plotEmojis: string[];
  sequence: SequenceStep[];
  inputIndex: number;
  creditedStepsThisRound: number;
  lastInputCell: number | null;
  lastInputStatus: InputStatus;
  mistakesThisRound: number;
  perfectStreak: number;
  roundWasPerfect: boolean;
  heartRestored: boolean;
  scentAvailable: boolean;
};

type RoundConfig = {
  length: number;
  showMs: number;
  mode: RoundMode;
};

const CELL_COUNT = 9;
const START_HP = 3;
export const TOTAL_ROUNDS = 7;
const ROUND_CONFIGS: readonly RoundConfig[] = [
  { length: 3, showMs: 820, mode: "normal" },
  { length: 4, showMs: 760, mode: "normal" },
  { length: 4, showMs: 710, mode: "reverse" },
  { length: 5, showMs: 660, mode: "normal" },
  { length: 4, showMs: 440, mode: "sprint" },
  { length: 5, showMs: 580, mode: "reverse" },
  { length: 6, showMs: 520, mode: "finale" }
];
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
    roundMode: "normal",
    score: 0,
    bestScore: normalizedNonNegativeInteger(bestScore),
    hp: START_HP,
    maxHp: START_HP,
    plotEmojis: [...DEFAULT_PLOT_EMOJIS],
    sequence: [],
    inputIndex: 0,
    creditedStepsThisRound: 0,
    lastInputCell: null,
    lastInputStatus: null,
    mistakesThisRound: 0,
    perfectStreak: 0,
    roundWasPerfect: false,
    heartRestored: false,
    scentAvailable: true
  };
}

export function roundModeForRound(round: number): RoundMode {
  return roundConfigForRound(round).mode;
}

export function requiresRoundBriefing(mode: RoundMode): boolean {
  return mode === "reverse";
}

export function sequenceLengthForRound(round: number): number {
  return roundConfigForRound(round).length;
}

export function showDurationForRound(round: number): number {
  return roundConfigForRound(round).showMs;
}

export function mockPetXpForScore(score: number): number {
  if (score <= 0) return 0;
  return Math.max(5, Math.round(score * 1.8));
}

export function createRoundSequence(round: number, random: () => number = Math.random): SequenceStep[] {
  const length = sequenceLengthForRound(round);
  const sequence: SequenceStep[] = [];

  for (let index = 0; index < length; index += 1) {
    let cellIndex = randomIndex(CELL_COUNT, random);
    const previous = sequence[index - 1];

    // A deterministic fallback avoids both visually ambiguous double flashes and
    // an infinite loop when a mocked or broken RNG always returns the same value.
    if (previous && cellIndex === previous.cellIndex) {
      const offset = 1 + randomIndex(CELL_COUNT - 1, random);
      cellIndex = (previous.cellIndex + offset) % CELL_COUNT;
    }

    sequence.push({ cellIndex });
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
  if (state.phase !== "success" || state.round >= TOTAL_ROUNDS) return state;
  return startRound(state, state.round + 1, random);
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

export function useScentHint(state: GameState): GameState {
  if (state.phase !== "input" || !state.scentAvailable) return state;
  return {
    ...state,
    phase: "showing",
    inputIndex: 0,
    lastInputCell: null,
    lastInputStatus: null,
    scentAvailable: false
  };
}

export function handleCellInput(state: GameState, cellIndex: number): { state: GameState; result: InputResult } {
  if (state.phase !== "input" || !isCellIndex(cellIndex)) {
    return { state, result: "ignored" };
  }

  const expectedIndex = state.roundMode === "reverse"
    ? state.sequence.length - state.inputIndex - 1
    : state.inputIndex;
  const expected = state.sequence[expectedIndex];
  if (!expected || expected.cellIndex !== cellIndex) {
    const hp = Math.max(0, state.hp - 1);
    const mistakeState = {
      ...state,
      phase: hp <= 0 ? "failed" as const : "input" as const,
      hp,
      bestScore: Math.max(state.bestScore, state.score),
      lastInputCell: cellIndex,
      lastInputStatus: "wrong" as const,
      mistakesThisRound: state.mistakesThisRound + 1,
      perfectStreak: 0,
      roundWasPerfect: false,
      heartRestored: false
    };
    return { state: mistakeState, result: hp <= 0 ? "failed" : "mistake" };
  }

  const nextInputIndex = state.inputIndex + 1;
  const stepAwardsScore = nextInputIndex > state.creditedStepsThisRound;
  const nextScore = state.score + (stepAwardsScore ? 1 : 0);
  const creditedStepsThisRound = Math.max(state.creditedStepsThisRound, nextInputIndex);
  const roundComplete = nextInputIndex >= state.sequence.length;
  if (!roundComplete) {
    return {
      state: {
        ...state,
        score: nextScore,
        bestScore: Math.max(state.bestScore, nextScore),
        inputIndex: nextInputIndex,
        creditedStepsThisRound,
        lastInputCell: cellIndex,
        lastInputStatus: "correct"
      },
      result: "correct"
    };
  }

  const roundWasPerfect = state.mistakesThisRound === 0;
  const completedPerfectStreak = roundWasPerfect ? state.perfectStreak + 1 : 0;
  const earnedHeart = completedPerfectStreak >= 2 && state.hp < state.maxHp;
  const heartRestored = earnedHeart;
  const hp = earnedHeart ? Math.min(state.maxHp, state.hp + 1) : state.hp;
  const perfectStreak = completedPerfectStreak >= 2 ? 0 : completedPerfectStreak;
  const won = state.round >= TOTAL_ROUNDS;
  const nextState: GameState = {
    ...state,
    phase: won ? "won" : "success",
    score: nextScore,
    bestScore: Math.max(state.bestScore, nextScore),
    hp,
    inputIndex: nextInputIndex,
    creditedStepsThisRound,
    lastInputCell: cellIndex,
    lastInputStatus: "correct",
    perfectStreak,
    roundWasPerfect,
    heartRestored
  };

  return { state: nextState, result: won ? "won" : "roundComplete" };
}

function startRound(state: GameState, round: number, random: () => number): GameState {
  const normalizedRound = Math.max(1, Math.min(TOTAL_ROUNDS, Math.floor(round)));
  return {
    ...state,
    phase: "showing",
    round: normalizedRound,
    roundMode: roundModeForRound(normalizedRound),
    plotEmojis: createRoundPlotEmojis(random),
    sequence: createRoundSequence(normalizedRound, random),
    inputIndex: 0,
    creditedStepsThisRound: 0,
    lastInputCell: null,
    lastInputStatus: null,
    mistakesThisRound: 0,
    roundWasPerfect: false,
    heartRestored: false
  };
}

function roundConfigForRound(round: number): RoundConfig {
  const safeRound = Number.isFinite(round) ? Math.floor(round) : 1;
  const index = Math.max(0, Math.min(TOTAL_ROUNDS - 1, safeRound - 1));
  return ROUND_CONFIGS[index] || ROUND_CONFIGS[0];
}

function randomIndex(length: number, random: () => number): number {
  if (length <= 1) return 0;
  const sample = random();
  if (!Number.isFinite(sample)) return 0;
  return Math.max(0, Math.min(length - 1, Math.floor(sample * length)));
}

function normalizedNonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function isCellIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < CELL_COUNT;
}
