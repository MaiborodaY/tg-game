export const TETRIS_BOARD_WIDTH = 10;
export const TETRIS_BOARD_HEIGHT = 20;
export const TETRIS_BASE_TICK_MS = 800;
export const TETRIS_MIN_TICK_MS = 90;

const TETRIS_LINE_CLEAR_SCORES = [0, 1, 3, 5, 8] as const;

export const TETROMINO_TYPES = ["I", "J", "L", "O", "S", "T", "Z"] as const;

export type TetrominoType = typeof TETROMINO_TYPES[number];
export type TetrisPhase = "idle" | "playing" | "paused" | "gameover";
export type TetrisRotation = 0 | 1 | 2 | 3;
export type TetrisLineClear = 0 | 1 | 2 | 3 | 4;
export type TetrisCell = TetrominoType | null;
export type TetrisBoard = TetrisCell[][];

export type TetrisPoint = {
  readonly x: number;
  readonly y: number;
};

export type TetrisPiece = {
  readonly type: TetrominoType;
  readonly rotation: TetrisRotation;
  readonly x: number;
  readonly y: number;
};

export type TetrisState = {
  phase: TetrisPhase;
  board: TetrisBoard;
  active: TetrisPiece;
  next: TetrominoType;
  bag: TetrominoType[];
  score: number;
  bestScore: number;
  lines: number;
  level: number;
  lastClear: TetrisLineClear;
};

type RotationShape = readonly TetrisPoint[];
type TetrominoRotations = readonly [RotationShape, RotationShape, RotationShape, RotationShape];

const TETROMINO_ROTATIONS: Record<TetrominoType, TetrominoRotations> = {
  I: [
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }]
  ],
  J: [
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }]
  ],
  L: [
    [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }]
  ],
  O: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }]
  ],
  S: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }]
  ],
  T: [
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }]
  ],
  Z: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }]
  ]
};

const WALL_KICKS: readonly TetrisPoint[] = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: -1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 0, y: -2 }
];

const SPAWN_X = 3;
const SPAWN_Y = 0;

export function createEmptyTetrisBoard(): TetrisBoard {
  return Array.from(
    { length: TETRIS_BOARD_HEIGHT },
    () => Array<TetrisCell>(TETRIS_BOARD_WIDTH).fill(null)
  );
}

export function createTetrisInitialState(
  bestScore = 0,
  random: () => number = Math.random
): TetrisState {
  const first = drawTetromino([], random);
  const second = drawTetromino(first.bag, random);

  return {
    phase: "idle",
    board: createEmptyTetrisBoard(),
    active: spawnPiece(first.type),
    next: second.type,
    bag: second.bag,
    score: 0,
    bestScore: normalizeNonnegativeInteger(bestScore),
    lines: 0,
    level: 1,
    lastClear: 0
  };
}

export function startTetrisGame(
  bestScore = 0,
  random: () => number = Math.random
): TetrisState {
  return {
    ...createTetrisInitialState(bestScore, random),
    phase: "playing"
  };
}

export function tetrisPieceCells(piece: TetrisPiece): TetrisPoint[] {
  return TETROMINO_ROTATIONS[piece.type][piece.rotation].map((point) => ({
    x: piece.x + point.x,
    y: piece.y + point.y
  }));
}

export function canPlaceTetrisPiece(board: TetrisBoard, piece: TetrisPiece): boolean {
  return tetrisPieceCells(piece).every(({ x, y }) => {
    if (x < 0 || x >= TETRIS_BOARD_WIDTH || y >= TETRIS_BOARD_HEIGHT) return false;
    if (y < 0) return true;
    return board[y]?.[x] === null;
  });
}

export function moveTetris(state: TetrisState, dx: -1 | 1): TetrisState {
  if (state.phase !== "playing") return state;
  const active = { ...state.active, x: state.active.x + dx };
  return canPlaceTetrisPiece(state.board, active) ? { ...state, active, lastClear: 0 } : state;
}

export function rotateTetris(
  state: TetrisState,
  direction: -1 | 1 = 1
): TetrisState {
  if (state.phase !== "playing" || state.active.type === "O") return state;

  const rotation = nextRotation(state.active.rotation, direction);
  for (const kick of WALL_KICKS) {
    const active: TetrisPiece = {
      ...state.active,
      rotation,
      x: state.active.x + kick.x,
      y: state.active.y + kick.y
    };
    if (canPlaceTetrisPiece(state.board, active)) {
      return { ...state, active, lastClear: 0 };
    }
  }

  return state;
}

export function advanceTetris(
  state: TetrisState,
  random: () => number = Math.random
): TetrisState {
  if (state.phase !== "playing") return state;
  const active = { ...state.active, y: state.active.y + 1 };
  return canPlaceTetrisPiece(state.board, active)
    ? { ...state, active, lastClear: 0 }
    : lockActivePiece(state, random);
}

export function softDropTetris(
  state: TetrisState,
  random: () => number = Math.random
): TetrisState {
  return advanceTetris(state, random);
}

export function hardDropTetris(
  state: TetrisState,
  random: () => number = Math.random
): TetrisState {
  if (state.phase !== "playing") return state;

  let active = state.active;
  while (true) {
    const next = { ...active, y: active.y + 1 };
    if (!canPlaceTetrisPiece(state.board, next)) break;
    active = next;
  }

  return lockActivePiece({ ...state, active }, random);
}

export function pauseTetrisGame(state: TetrisState): TetrisState {
  return state.phase === "playing" ? { ...state, phase: "paused" } : state;
}

export function resumeTetrisGame(state: TetrisState): TetrisState {
  return state.phase === "paused" ? { ...state, phase: "playing" } : state;
}

export function tetrisTickDuration(level: number): number {
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  return Math.max(
    TETRIS_MIN_TICK_MS,
    Math.round(TETRIS_BASE_TICK_MS * (0.82 ** (safeLevel - 1)))
  );
}

export function tetrisLineClearScore(cleared: number): number {
  const safeCleared = Number.isFinite(cleared)
    ? Math.max(0, Math.min(4, Math.floor(cleared)))
    : 0;
  return TETRIS_LINE_CLEAR_SCORES[safeCleared];
}

function lockActivePiece(state: TetrisState, random: () => number): TetrisState {
  const cells = tetrisPieceCells(state.active);
  if (!canPlaceTetrisPiece(state.board, state.active) || cells.some(({ y }) => y < 0)) {
    return { ...state, phase: "gameover", lastClear: 0 };
  }

  const lockedBoard = state.board.map((row) => [...row]);
  for (const { x, y } of cells) {
    lockedBoard[y][x] = state.active.type;
  }

  const { board, cleared } = clearCompletedLines(lockedBoard);
  const lines = state.lines + cleared;
  const score = state.score + tetrisLineClearScore(cleared);
  const drawn = drawTetromino(state.bag, random);
  const active = spawnPiece(state.next);

  return {
    ...state,
    phase: canPlaceTetrisPiece(board, active) ? "playing" : "gameover",
    board,
    active,
    next: drawn.type,
    bag: drawn.bag,
    score,
    bestScore: Math.max(state.bestScore, score),
    lines,
    level: Math.floor(lines / 10) + 1,
    lastClear: Math.min(4, cleared) as TetrisLineClear
  };
}

function clearCompletedLines(board: TetrisBoard): { board: TetrisBoard; cleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const cleared = TETRIS_BOARD_HEIGHT - remaining.length;
  const emptyRows = Array.from(
    { length: cleared },
    () => Array<TetrisCell>(TETRIS_BOARD_WIDTH).fill(null)
  );
  return {
    board: [...emptyRows, ...remaining.map((row) => [...row])],
    cleared
  };
}

function spawnPiece(type: TetrominoType): TetrisPiece {
  return { type, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
}

function drawTetromino(
  bag: TetrominoType[],
  random: () => number
): { type: TetrominoType; bag: TetrominoType[] } {
  const available = bag.length > 0 ? [...bag] : shuffledBag(random);
  const [type, ...remaining] = available;
  return { type, bag: remaining };
}

function shuffledBag(random: () => number): TetrominoType[] {
  const bag = [...TETROMINO_TYPES];
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const randomValue = random();
    const safeRandom = Number.isFinite(randomValue)
      ? Math.max(0, Math.min(0.999999999999, randomValue))
      : 0;
    const target = Math.floor(safeRandom * (index + 1));
    [bag[index], bag[target]] = [bag[target], bag[index]];
  }
  return bag;
}

function nextRotation(rotation: TetrisRotation, direction: -1 | 1): TetrisRotation {
  return ((rotation + direction + 4) % 4) as TetrisRotation;
}

function normalizeNonnegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
