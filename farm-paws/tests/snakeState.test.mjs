import assert from "node:assert/strict";
import test from "node:test";
import {
  SNAKE_BOARD_SIZE,
  SNAKE_MAPS,
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
  assert.ok(state.greenFood);
  assert.equal(state.mapId, "garden");
  assert.ok(!state.snake.some((point) => point.x === state.food.x && point.y === state.food.y));
});

test("moves one cell without growing", () => {
  const state = startSnakeGame(0, () => 0);
  const next = advanceSnake(state, () => 0);
  assert.deepEqual(next.snake[0], { x: 9, y: 8 });
  assert.equal(next.snake.length, 3);
  assert.equal(next.score, 0);
});

test("the first direction can be left without reversing into the starting body", () => {
  const state = startSnakeGame(7, () => 0, "left");
  assert.equal(state.direction, "left");
  assert.equal(state.queuedDirection, "left");
  assert.deepEqual(state.snake, [{ x: 8, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 }]);
  const next = advanceSnake(state, () => 0);
  assert.equal(next.phase, "playing");
  assert.deepEqual(next.snake[0], { x: 7, y: 8 });
  assert.equal(next.bestScore, 7);
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
      if ((x === 0 && y === 0) || (x === target.x && y === target.y)
        || SNAKE_MAPS.garden.portals.some(p => p.x === x && p.y === y)) continue;
      snake.push({ x, y });
    }
  }
  const state = {
    ...startSnakeGame(0, () => 0),
    snake,
    food: target,
    greenFood: null,
    direction: "right",
    queuedDirection: "right"
  };
  const next = advanceSnake(state);
  assert.equal(next.phase, "won");
  assert.equal(next.snake.length, SNAKE_BOARD_SIZE ** 2 - 2);
  assert.equal(next.food, null);
  assert.equal(next.greenFood, null);
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

test("normal apples offer distinct gold and once-only scissors; pickups preserve their rules", () => {
  let state = startSnakeGame(0, () => 0);
  let firstGold;
  for (let apple = 1; apple <= 6; apple++) {
    state = advanceSnake({ ...state, food: { x: state.snake[0].x + 1, y: 8 } }, () => 0);
    assert.equal(state.score, apple);
    assert.equal(state.snake.length, 3 + apple);
    if (apple === 3) firstGold = state.goldFood;
  }
  assert.equal(state.normalApples, 6);
  assert.deepEqual({ x: state.goldFood.x, y: state.goldFood.y }, { x: 2, y: 0 });
  assert.ok(state.goldFood.remainingMs < firstGold.remainingMs, "the sixth apple does not refresh existing gold");
  assert.equal(state.scissors.remainingMs, 12_000);
  assert.equal(new Set([state.food, state.greenFood, state.goldFood, state.scissors].map(p => `${p.x}:${p.y}`)).size, 4);
  assert.ok([state.food, state.greenFood, state.goldFood, state.scissors].every(p => !state.snake.some(s => s.x === p.x && s.y === p.y)));

  state = queueSnakeDirection(state, "up");
  for (let i = 0; i < 8; i++) state = advanceSnake(state, () => 0);
  state = queueSnakeDirection(state, "left");
  for (let i = 0; i < 11; i++) state = advanceSnake(state, () => 0);
  assert.deepEqual(state.snake[0], { x: 3, y: 0 });
  assert.equal(state.scissors, null);
  assert.equal(state.snake.length, 6);
  assert.equal(state.score, 6);
  assert.equal(snakeTickDuration(state.score), snakeTickDuration(6));
  state = advanceSnake(state, () => 0);
  assert.equal(state.goldFood, null);
  assert.equal(state.score, 9);
  assert.equal(state.normalApples, 6);
  assert.equal(state.alternatingApples, 1);
  assert.equal(state.lastAppleColor, "red");
  assert.equal(state.pendingGrowth, 2);
  state = queueSnakeDirection(state, "down");
  state = advanceSnake(advanceSnake(state, () => 0), () => 0);
  assert.equal(state.snake.length, 9);
  assert.equal(state.pendingGrowth, 0);
  assert.equal(state.bestScore, 9);

  const shortSnake = advanceSnake({ ...startSnakeGame(), scissors: { x: 9, y: 8, remainingMs: 1000 } });
  assert.equal(shortSnake.snake.length, 3);
  assert.equal(shortSnake.score, 0);
});

test("bonus lifetimes count movement only, expire harmlessly, and scissors do not respawn", () => {
  let state = {
    ...startSnakeGame(),
    normalApples: 6,
    scissorsOffered: true,
    goldFood: { x: 1, y: 0, remainingMs: 8000 },
    scissors: { x: 2, y: 0, remainingMs: 12000 }
  };
  const paused = pauseSnakeGame(state);
  assert.equal(advanceSnake(paused, Math.random, 100_000), paused);
  const idle = { ...state, phase: "idle" };
  assert.equal(advanceSnake(idle, Math.random, 100_000), idle);
  state = advanceSnake(resumeSnakeGame(paused), () => 0, 7999);
  assert.equal(state.goldFood.remainingMs, 1);
  assert.equal(state.scissors.remainingMs, 4001);
  state = advanceSnake(state, () => 0, 1);
  assert.equal(state.goldFood, null);
  state = advanceSnake(state, () => 0, 4000);
  assert.equal(state.scissors, null);
  assert.equal(state.score, 0);
  assert.equal(state.snake.length, 3);
  for (let i = 0; i < 3; i++) {
    state = advanceSnake({ ...state, food: { x: state.snake[0].x + 1, y: 8 } }, () => 0);
  }
  assert.equal(state.normalApples, 9);
  assert.ok(state.goldFood, "a later gold threshold works after expiration");
  assert.equal(state.scissors, null);
});

test("each fixed map reserves its obstacles and portals for every spawned object", () => {
  assert.deepEqual(SNAKE_MAPS.garden, { obstacles: [], portals: [{ x: 2, y: 2 }, { x: 13, y: 13 }] });
  assert.equal(SNAKE_MAPS.courtyard.obstacles.length, 12);
  assert.deepEqual(SNAKE_MAPS.courtyard.portals, [{ x: 2, y: 12 }, { x: 13, y: 3 }]);
  assert.equal(SNAKE_MAPS.warehouse.obstacles.length, 20);
  assert.ok(SNAKE_MAPS.warehouse.obstacles.every(p => [4, 11].includes(p.y) && p.x !== 5 && p.x !== 10));
  for (const mapId of Object.keys(SNAKE_MAPS)) {
    const initial = createSnakeInitialState(0, () => 0, "right", mapId);
    assert.equal(initial.mapId, mapId);
    assert.deepEqual(initial.snake[0], { x: 8, y: 8 });
    const state = advanceSnake({
      ...startSnakeGame(0, () => 0, "right", mapId),
      food: { x: 9, y: 8 }, normalApples: 5
    }, () => 0);
    const objects = [state.food, state.greenFood, state.goldFood, state.scissors];
    const reserved = [...state.snake, ...SNAKE_MAPS[mapId].obstacles, ...SNAKE_MAPS[mapId].portals];
    assert.ok(objects.every(Boolean));
    assert.equal(new Set(objects.map(p => `${p.x}:${p.y}`)).size, 4);
    assert.ok(objects.every(p => !reserved.some(r => r.x === p.x && r.y === p.y)));
  }
});

test("entering either portal transfers once, preserves direction, and checks the exit body", () => {
  const initial = startSnakeGame(0, () => 0);
  const state = { ...initial, snake: [{ x: 1, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 3 }] };
  const transferred = advanceSnake(state, () => 0);
  assert.deepEqual(transferred.snake[0], { x: 13, y: 13 });
  assert.equal(transferred.direction, "right");
  assert.equal(transferred.phase, "playing");
  assert.deepEqual(advanceSnake(transferred, () => 0).snake[0], { x: 14, y: 13 });
  assert.deepEqual(advanceSnake({ ...state, snake: [{ x: 12, y: 13 }, { x: 11, y: 13 }, { x: 10, y: 13 }] }).snake[0], { x: 2, y: 2 });
  assert.equal(advanceSnake({ ...state, snake: [state.snake[0], { x: 13, y: 13 }, { x: 13, y: 14 }] }).phase, "gameover");
  const tailAtExit = { ...state, snake: [state.snake[0], { x: 13, y: 14 }, { x: 13, y: 13 }] };
  assert.equal(advanceSnake(tailAtExit).phase, "playing");
  assert.equal(advanceSnake({ ...tailAtExit, pendingGrowth: 1 }).phase, "gameover");
});

test("map obstacles end the run while warehouse passages stay open", () => {
  const courtyard = startSnakeGame(0, () => 0, "up", "courtyard");
  assert.equal(advanceSnake({ ...courtyard, snake: [{ x: 8, y: 6 }, { x: 8, y: 7 }, { x: 8, y: 8 }] }).phase, "gameover");
  const warehouse = startSnakeGame(0, () => 0, "up", "warehouse");
  assert.equal(advanceSnake({ ...warehouse, snake: [{ x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 }] }).phase, "gameover");
  assert.equal(advanceSnake({ ...warehouse, snake: [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }] }).phase, "playing");
});

test("alternating colors reward every third apple without extra growth and repeated color resets the chain", () => {
  let state = startSnakeGame(0, () => 0);
  const colors = ["red", "green", "red", "green", "red", "green", "green"];
  const scores = [1, 2, 4, 5, 6, 8, 9];
  const chains = [1, 2, 3, 4, 5, 6, 1];
  for (let index = 0; index < colors.length; index++) {
    const key = colors[index] === "red" ? "food" : "greenFood";
    state = advanceSnake({ ...state, [key]: { x: state.snake[0].x + 1, y: 8 } }, () => 0);
    assert.equal(state.score, scores[index]);
    assert.equal(state.alternatingApples, chains[index]);
    assert.equal(state.lastAppleColor, colors[index]);
    assert.equal(state.snake.length, 4 + index);
    assert.equal(state.normalApples, index + 1);
    assert.ok(state.food && state.greenFood);
  }
  assert.ok(state.goldFood);
  assert.ok(state.scissors);
  const gold = advanceSnake({
    ...queueSnakeDirection(state, "down"), goldFood: { x: 15, y: 9, remainingMs: 1000 }
  });
  assert.equal(gold.score, 12);
  assert.equal(gold.alternatingApples, 1);
  assert.equal(gold.lastAppleColor, "green");
  assert.equal(gold.normalApples, 7);
});

test("the final ordinary apple takes priority over bonuses when little room remains", () => {
  const free = [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }];
  const snake = [{ x: 0, y: 0 }];
  for (let y = 0; y < SNAKE_BOARD_SIZE; y++) {
    for (let x = 0; x < SNAKE_BOARD_SIZE; x++) {
      if ((x === 0 && y === 0) || [...free, ...SNAKE_MAPS.garden.portals].some(p => p.x === x && p.y === y)) continue;
      snake.push({ x, y });
    }
  }
  const next = advanceSnake({
    ...startSnakeGame(0, () => 0), snake,
    food: free[0], greenFood: null,
    goldFood: { ...free[1], remainingMs: 1000 },
    scissors: { ...free[2], remainingMs: 1000 }
  }, () => 0);
  assert.equal(next.phase, "playing");
  assert.deepEqual(next.food, free[1]);
  assert.deepEqual(next.greenFood, free[2]);
  assert.equal(next.goldFood, null);
  assert.equal(next.scissors, null);
});
