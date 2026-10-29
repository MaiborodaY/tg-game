export type SnakeDirection = "up" | "down" | "left" | "right";
export type SnakePhase = "idle" | "playing" | "paused" | "gameover" | "won";
export type SnakeMapId = "garden" | "courtyard" | "warehouse";

export type SnakePoint = {
  x: number;
  y: number;
};

export type SnakeBonus = SnakePoint & { remainingMs: number };

export type SnakeState = {
  phase: SnakePhase;
  mapId: SnakeMapId;
  snake: SnakePoint[];
  food: SnakePoint | null;
  greenFood: SnakePoint | null;
  goldFood: SnakeBonus | null;
  scissors: SnakeBonus | null;
  normalApples: number;
  lastAppleColor: "red" | "green" | null;
  alternatingApples: number;
  scissorsOffered: boolean;
  pendingGrowth: number;
  direction: SnakeDirection;
  queuedDirection: SnakeDirection;
  score: number;
  bestScore: number;
};

export const SNAKE_BOARD_SIZE = 16;
export const SNAKE_GOLD_LIFETIME_MS = 8_000;
export const SNAKE_SCISSORS_LIFETIME_MS = 12_000;
export const SNAKE_MAPS: Record<SnakeMapId, { obstacles: SnakePoint[]; portals: [SnakePoint, SnakePoint] }> = {
  garden: {
    obstacles: [],
    portals: [{ x: 2, y: 2 }, { x: 13, y: 13 }]
  },
  courtyard: {
    obstacles: Array.from({ length: 12 }, (_, index) => ({ x: 6 + index % 4, y: 3 + Math.floor(index / 4) })),
    portals: [{ x: 2, y: 12 }, { x: 13, y: 3 }]
  },
  warehouse: {
    obstacles: [4, 11].flatMap((y) => Array.from({ length: 12 }, (_, index) => ({ x: index + 2, y }))
      .filter(({ x }) => x !== 5 && x !== 10)),
    portals: [{ x: 2, y: 2 }, { x: 13, y: 13 }]
  }
};

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
  random: () => number = Math.random,
  direction: SnakeDirection = "right",
  mapId: SnakeMapId = "garden"
): SnakeState {
  const head = INITIAL_SNAKE[0];
  const vector = DIRECTION_VECTORS[direction];
  const snake = INITIAL_SNAKE.map((_, index) => ({
    x: head.x - vector.x * index,
    y: head.y - vector.y * index
  }));
  const food = createFood(snake, random, mapId);
  return {
    phase: "idle",
    mapId,
    snake,
    food,
    greenFood: createFood(snake, random, mapId, [food]),
    goldFood: null,
    scissors: null,
    normalApples: 0,
    lastAppleColor: null,
    alternatingApples: 0,
    scissorsOffered: false,
    pendingGrowth: 0,
    direction,
    queuedDirection: direction,
    score: 0,
    bestScore: normalizeScore(bestScore)
  };
}

export function startSnakeGame(
  bestScore = 0,
  random: () => number = Math.random,
  direction: SnakeDirection = "right",
  mapId: SnakeMapId = "garden"
): SnakeState {
  return {
    ...createSnakeInitialState(bestScore, random, direction, mapId),
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
  random: () => number = Math.random,
  activeMs = snakeTickDuration(state.score)
): SnakeState {
  if (state.phase !== "playing") return state;

  // Only movement ticks spend bonus time; idle, pause and background never catch up.
  let goldFood = advanceBonus(state.goldFood, activeMs);
  let scissors = advanceBonus(state.scissors, activeMs);
  const direction = state.queuedDirection;
  const vector = DIRECTION_VECTORS[direction];
  const head = state.snake[0];
  let nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y
  };
  const map = SNAKE_MAPS[state.mapId];
  const portalIndex = map.portals.findIndex((point) => samePoint(point, nextHead));
  // Resolve only the entered cell, so standing on the exit never sends the head back.
  if (portalIndex !== -1) nextHead = { ...map.portals[1 - portalIndex] };
  const appleColor = state.food && samePoint(nextHead, state.food) ? "red"
    : state.greenFood && samePoint(nextHead, state.greenFood) ? "green" : null;
  const ateFood = appleColor !== null;
  const ateGold = Boolean(goldFood && samePoint(nextHead, goldFood));
  const tookScissors = Boolean(scissors && samePoint(nextHead, scissors));
  const growth = state.pendingGrowth + (ateFood ? 1 : ateGold ? 3 : 0);
  const collisionBody = growth > 0 ? state.snake : state.snake.slice(0, -1);

  if (isOutsideBoard(nextHead)
    || map.obstacles.some((point) => samePoint(point, nextHead))
    || collisionBody.some((point) => samePoint(point, nextHead))) {
    return {
      ...state,
      goldFood,
      scissors,
      phase: "gameover",
      direction,
      queuedDirection: direction
    };
  }

  const snake = [nextHead, ...state.snake];
  if (growth === 0) snake.pop();
  if (tookScissors) {
    snake.splice(Math.max(3, snake.length - 3));
    scissors = null;
  }

  const alternatingApples = ateFood
    ? (state.lastAppleColor !== null && state.lastAppleColor !== appleColor ? state.alternatingApples + 1 : 1)
    : state.alternatingApples;
  const comboScore = ateFood && alternatingApples % 3 === 0 ? 1 : 0;
  const score = state.score + (ateFood ? 1 + comboScore : ateGold ? 3 : 0);
  const normalApples = state.normalApples + (ateFood ? 1 : 0);
  if (ateGold) goldFood = null;
  let food = appleColor === "red" ? null : state.food;
  let greenFood = appleColor === "green" ? null : state.greenFood;
  if (!food) food = createFood(snake, random, state.mapId, [greenFood, goldFood, scissors]);
  if (!greenFood) greenFood = createFood(snake, random, state.mapId, [food, goldFood, scissors]);
  if (!food && !greenFood) {
    // Keep an ordinary apple available before spending the last free cells on bonuses.
    goldFood = null;
    scissors = null;
    food = createFood(snake, random, state.mapId);
    greenFood = createFood(snake, random, state.mapId, [food]);
  }
  if (ateFood && normalApples % 3 === 0 && !goldFood && (food || greenFood)) {
    const point = createFood(snake, random, state.mapId, [food, greenFood, scissors]);
    if (point) goldFood = { ...point, remainingMs: SNAKE_GOLD_LIFETIME_MS };
  }
  const offerScissors = ateFood && normalApples === 6 && !state.scissorsOffered;
  if (offerScissors && (food || greenFood)) {
    const point = createFood(snake, random, state.mapId, [food, greenFood, goldFood]);
    if (point) scissors = { ...point, remainingMs: SNAKE_SCISSORS_LIFETIME_MS };
  }
  return {
    ...state,
    phase: food || greenFood ? "playing" : "won",
    snake,
    food,
    greenFood,
    goldFood,
    scissors,
    normalApples,
    lastAppleColor: appleColor ?? state.lastAppleColor,
    alternatingApples,
    scissorsOffered: state.scissorsOffered || offerScissors,
    pendingGrowth: Math.max(0, growth - 1),
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

function advanceBonus(bonus: SnakeBonus | null, activeMs: number): SnakeBonus | null {
  if (!bonus || bonus.remainingMs <= activeMs) return null;
  return { ...bonus, remainingMs: bonus.remainingMs - activeMs };
}

function createFood(
  snake: SnakePoint[],
  random: () => number,
  mapId: SnakeMapId,
  reserved: (SnakePoint | null)[] = []
): SnakePoint | null {
  const map = SNAKE_MAPS[mapId];
  const occupied = new Set([
    ...snake, ...map.obstacles, ...map.portals,
    ...reserved.filter((point): point is SnakePoint => point !== null)
  ].map(pointKey));
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

function normalizeScore(score: number): number {
  return Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
}
