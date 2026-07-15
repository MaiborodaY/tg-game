import assert from "node:assert/strict";
import test from "node:test";
import {
  SNAKE_BOARD_SIZE,
  advanceSnake,
  createSnakeInitialState,
  pauseSnakeGame,
  queueSnakeDirection,
  resumeSnakeGame,
  snakeTickDuration,
  startSnakeGame
} from "../src/snakeState.ts";

test("starts with a three-cell snake and keeps the saved record", () => {
  const state = startSnakeGame(7, () => 0);
  assert.equal(state.phase, "playing");
  assert.equal(state.snake.length, 3);
  assert.equal(state.bestScore, 7);
  assert.ok(state.food);
  assert.ok(!state.snake.some((point) => point.x === state.food.x && point.y === state.food.y));
});

test("moves one cell without growing", () => {
  const state = startSnakeGame(0, () => 0);
  const next = advanceSnake(state, () => 0);
  assert.deepEqual(next.snake[0], { x: 9, y: 8 });
  assert.equal(next.snake.length, 3);
  assert.equal(next.score, 0);
});

test("eats food, grows and updates the record", () => {
  const state = {
    ...startSnakeGame(0, () => 0),
    food: { x: 9, y: 8 }
  };
  const next = advanceSnake(state, () => 0);
  assert.equal(next.snake.length, 4);
  assert.equal(next.score, 1);
  assert.equal(next.bestScore, 1);
  assert.ok(next.food);
  assert.ok(!next.snake.some((point) => point.x === next.food.x && point.y === next.food.y));
});

test("rejects reversing and more than one queued turn per tick", () => {
  const state = startSnakeGame(0, () => 0);
  assert.equal(queueSnakeDirection(state, "left"), state);

  const turned = queueSnakeDirection(state, "up");
  assert.equal(turned.queuedDirection, "up");
  assert.equal(queueSnakeDirection(turned, "left"), turned);
});

test("ends the game on a wall collision", () => {
  const state = {
    ...startSnakeGame(0, () => 0),
    snake: [{ x: SNAKE_BOARD_SIZE - 1, y: 4 }],
    direction: "right",
    queuedDirection: "right"
  };
  assert.equal(advanceSnake(state).phase, "gameover");
});

test("ends the game on a body collision", () => {
  const state = {
    ...startSnakeGame(0, () => 0),
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 }
    ],
    direction: "up",
    queuedDirection: "left",
    food: { x: 8, y: 8 }
  };
  assert.equal(advanceSnake(state).phase, "gameover");
});

test("allows moving into the tail cell when the tail moves away", () => {
  const state = {
    ...startSnakeGame(0, () => 0),
    snake: [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
      { x: 0, y: 1 }
    ],
    direction: "up",
    queuedDirection: "left",
    food: { x: 8, y: 8 }
  };
  const next = advanceSnake(state);
  assert.equal(next.phase, "playing");
  assert.deepEqual(next.snake[0], { x: 0, y: 1 });
});

test("wins after filling the last free cell", () => {
  const target = { x: 1, y: 0 };
  const snake = [{ x: 0, y: 0 }];
  for (let y = 0; y < SNAKE_BOARD_SIZE; y += 1) {
    for (let x = 0; x < SNAKE_BOARD_SIZE; x += 1) {
      if ((x === 0 && y === 0) || (x === target.x && y === target.y)) continue;
      snake.push({ x, y });
    }
  }
  const state = {
    ...startSnakeGame(0, () => 0),
    snake,
    food: target,
    direction: "right",
    queuedDirection: "right"
  };
  const next = advanceSnake(state);
  assert.equal(next.phase, "won");
  assert.equal(next.snake.length, SNAKE_BOARD_SIZE ** 2);
  assert.equal(next.food, null);
});

test("pauses, resumes and never catches up hidden ticks", () => {
  const playing = startSnakeGame(0, () => 0);
  const paused = pauseSnakeGame(playing);
  assert.equal(paused.phase, "paused");
  assert.equal(advanceSnake(paused), paused);
  assert.equal(resumeSnakeGame(paused).phase, "playing");
});

test("clamps speed and random values at their boundaries", () => {
  assert.equal(snakeTickDuration(0), 155);
  assert.equal(snakeTickDuration(10_000), 78);
  const state = createSnakeInitialState(0, () => 1);
  assert.ok(state.food);
  assert.ok(state.food.x >= 0 && state.food.x < SNAKE_BOARD_SIZE);
  assert.ok(state.food.y >= 0 && state.food.y < SNAKE_BOARD_SIZE);
});
