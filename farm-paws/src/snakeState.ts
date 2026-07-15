export type SnakeDirection = "up" | "down" | "left" | "right";
export type SnakePhase = "idle" | "playing" | "paused" | "gameover" | "won";

export type SnakePoint = {
  x: number;
  y: number;
};

export type SnakeState = {
  phase: SnakePhase;
  snake: SnakePoint[];
  food: SnakePoint | null;
  direction: SnakeDirection;
  queuedDirection: SnakeDirection;
  score: number;
  bestScore: number;
};

export const SNAKE_BOARD_SIZE = 16;

const INITIAL_SNAKE: SnakePoint[] = [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 }
];

const DIRECTION_VECTORS: Record<SnakeDirection, SnakePoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITE_DIRECTIONS: Record<SnakeDirection, SnakeDirection> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

export function createSnakeInitialState(
  bestScore = 0,
  random: () => number = Math.random
): SnakeState {
  const snake = cloneSnake(INITIAL_SNAKE);
  return {
    phase: "idle",
    snake,
    food: createFood(snake, random),
    direction: "right",
    queuedDirection: "right",
    score: 0,
    bestScore: normalizeScore(bestScore)
  };
}

export function startSnakeGame(
  bestScore = 0,
  random: () => number = Math.random
): SnakeState {
  return {
    ...createSnakeInitialState(bestScore, random),
    phase: "playing"
  };
}

export function queueSnakeDirection(state: SnakeState, direction: SnakeDirection): SnakeState {
  if (state.phase !== "playing") return state;
  if (state.queuedDirection !== state.direction) return state;
  if (OPPOSITE_DIRECTIONS[state.direction] === direction) return state;

  return {
    ...state,
    queuedDirection: direction
  };
}

export function advanceSnake(
  state: SnakeState,
  random: () => number = Math.random
): SnakeState {
  if (state.phase !== "playing") return state;

  const direction = state.queuedDirection;
  const vector = DIRECTION_VECTORS[direction];
  const head = state.snake[0];
  const nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y
  };
  const ateFood = Boolean(state.food && samePoint(nextHead, state.food));
  const collisionBody = ateFood ? state.snake : state.snake.slice(0, -1);

  if (isOutsideBoard(nextHead) || collisionBody.some((point) => samePoint(point, nextHead))) {
    return {
      ...state,
      phase: "gameover",
      direction,
      queuedDirection: direction
    };
  }

  const snake = [nextHead, ...state.snake];
  if (!ateFood) snake.pop();

  if (!ateFood) {
    return {
      ...state,
      snake,
      direction,
      queuedDirection: direction
    };
  }

  const score = state.score + 1;
  const food = createFood(snake, random);
  return {
    ...state,
    phase: food ? "playing" : "won",
    snake,
    food,
    direction,
    queuedDirection: direction,
    score,
    bestScore: Math.max(state.bestScore, score)
  };
}

export function pauseSnakeGame(state: SnakeState): SnakeState {
  return state.phase === "playing" ? { ...state, phase: "paused" } : state;
}

export function resumeSnakeGame(state: SnakeState): SnakeState {
  return state.phase === "paused" ? { ...state, phase: "playing" } : state;
}

export function snakeTickDuration(score: number): number {
  return Math.max(78, 155 - Math.floor(normalizeScore(score) / 4) * 8);
}

function createFood(snake: SnakePoint[], random: () => number): SnakePoint | null {
  const occupied = new Set(snake.map(pointKey));
  const freeCells: SnakePoint[] = [];

  for (let y = 0; y < SNAKE_BOARD_SIZE; y += 1) {
    for (let x = 0; x < SNAKE_BOARD_SIZE; x += 1) {
      if (!occupied.has(`${x}:${y}`)) freeCells.push({ x, y });
    }
  }

  if (freeCells.length < 1) return null;
  const randomValue = random();
  const safeRandom = Number.isFinite(randomValue)
    ? Math.max(0, Math.min(0.999999999999, randomValue))
    : 0;
  return freeCells[Math.floor(safeRandom * freeCells.length)] || freeCells[0];
}

function isOutsideBoard(point: SnakePoint): boolean {
  return point.x < 0
    || point.y < 0
    || point.x >= SNAKE_BOARD_SIZE
    || point.y >= SNAKE_BOARD_SIZE;
}

function samePoint(left: SnakePoint, right: SnakePoint): boolean {
  return left.x === right.x && left.y === right.y;
}

function pointKey(point: SnakePoint): string {
  return `${point.x}:${point.y}`;
}

function cloneSnake(snake: SnakePoint[]): SnakePoint[] {
  return snake.map((point) => ({ ...point }));
}

function normalizeScore(score: number): number {
  return Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
}
