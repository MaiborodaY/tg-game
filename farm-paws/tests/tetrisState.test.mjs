import assert from "node:assert/strict";
import test from "node:test";
import {
  TETRIS_BASE_TICK_MS,
  TETRIS_BOARD_HEIGHT,
  TETRIS_BOARD_WIDTH,
  TETRIS_MIN_TICK_MS,
  TETROMINO_TYPES,
  advanceTetris,
  canPlaceTetrisPiece,
  createEmptyTetrisBoard,
  createTetrisInitialState,
  hardDropTetris,
  moveTetris,
  pauseTetrisGame,
  resumeTetrisGame,
  rotateTetris,
  softDropTetris,
  startTetrisGame,
  tetrisPieceCells,
  tetrisTickDuration
} from "../src/tetrisState.ts";

test("creates a 10x20 empty board and a complete deterministic seven-piece bag", () => {
  const first = createTetrisInitialState(7.9, sequenceRandom([0.1, 0.8, 0.2]));
  const second = createTetrisInitialState(7.9, sequenceRandom([0.1, 0.8, 0.2]));

  assert.deepEqual(first, second);
  assert.equal(first.phase, "idle");
  assert.equal(first.board.length, TETRIS_BOARD_HEIGHT);
  assert.ok(first.board.every((row) => row.length === TETRIS_BOARD_WIDTH));
  assert.ok(first.board.every((row) => row.every((cell) => cell === null)));
  assert.equal(first.bestScore, 7);
  assert.equal(first.score, 0);
  assert.equal(first.lines, 0);
  assert.equal(first.level, 1);

  const firstBag = [first.active.type, first.next, ...first.bag];
  assert.equal(firstBag.length, 7);
  assert.deepEqual([...firstBag].sort(), [...TETROMINO_TYPES].sort());
});

test("clamps invalid random values and still produces a valid seven-piece bag", () => {
  for (const randomValue of [-10, 1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const state = createTetrisInitialState(0, () => randomValue);
    const bag = [state.active.type, state.next, ...state.bag];
    assert.deepEqual([...bag].sort(), [...TETROMINO_TYPES].sort());
  }
});

test("moves and falls one cell without changing the score", () => {
  const state = withActive(startTetrisGame(0, () => 0), {
    type: "T",
    rotation: 0,
    x: 3,
    y: 0
  });
  const moved = moveTetris(state, -1);
  const fallen = advanceTetris(moved, () => 0);

  assert.equal(moved.active.x, 2);
  assert.equal(fallen.active.y, 1);
  assert.equal(fallen.score, 0);
  assert.equal(fallen.lines, 0);
});

test("rejects movement through walls and settled cells", () => {
  const state = withActive(startTetrisGame(0, () => 0), {
    type: "O",
    rotation: 0,
    x: -1,
    y: 0
  });
  assert.ok(canPlaceTetrisPiece(state.board, state.active));
  assert.equal(moveTetris(state, -1), state);

  const board = createEmptyTetrisBoard();
  board[0][0] = "J";
  const blocked = {
    ...state,
    board,
    active: { ...state.active, x: 0 }
  };
  assert.equal(moveTetris(blocked, -1), blocked);
});

test("defines four unique cells for every tetromino and restores it after four rotations", () => {
  for (const type of TETROMINO_TYPES) {
    let state = withActive(startTetrisGame(0, () => 0), {
      type,
      rotation: 0,
      x: 3,
      y: 5
    });
    const original = sortedCells(tetrisPieceCells(state.active));
    assert.equal(new Set(original).size, 4);

    for (let index = 0; index < 4; index += 1) state = rotateTetris(state);
    assert.deepEqual(sortedCells(tetrisPieceCells(state.active)), original);
  }
});

test("kicks an I piece away from the left and right walls during rotation", () => {
  const initial = startTetrisGame(0, () => 0);
  const left = withActive(initial, { type: "I", rotation: 1, x: -2, y: 3 });
  const leftRotated = rotateTetris(left);
  assert.equal(leftRotated.active.rotation, 2);
  assert.equal(leftRotated.active.x, 0);
  assert.ok(canPlaceTetrisPiece(leftRotated.board, leftRotated.active));

  const right = withActive(initial, { type: "I", rotation: 1, x: 7, y: 3 });
  const rightRotated = rotateTetris(right);
  assert.equal(rightRotated.active.rotation, 2);
  assert.equal(rightRotated.active.x, 6);
  assert.ok(canPlaceTetrisPiece(rightRotated.board, rightRotated.active));
});

test("leaves the state unchanged when every rotation kick is blocked", () => {
  const board = Array.from(
    { length: TETRIS_BOARD_HEIGHT },
    () => Array(TETRIS_BOARD_WIDTH).fill("J")
  );
  const state = withActive(startTetrisGame(0, () => 0), {
    type: "T",
    rotation: 0,
    x: 3,
    y: 6
  });
  for (const { x, y } of tetrisPieceCells(state.active)) board[y][x] = null;
  const blocked = { ...state, board };

  assert.ok(canPlaceTetrisPiece(blocked.board, blocked.active));
  assert.equal(rotateTetris(blocked), blocked);
});

test("hard drop locks a piece, spawns the preview and gives no drop points", () => {
  const state = withActive(startTetrisGame(0, () => 0), {
    type: "O",
    rotation: 0,
    x: 3,
    y: 0
  });
  const expectedActive = state.next;
  const next = hardDropTetris(state, () => 0);

  assert.equal(next.phase, "playing");
  assert.equal(next.active.type, expectedActive);
  assert.equal(next.score, 0);
  assert.equal(next.lines, 0);
  assert.equal(countLockedCells(next.board), 4);
});

test("score always equals total cleared lines for one through four line clears", () => {
  for (const expectedClears of [1, 2, 3, 4]) {
    const board = createEmptyTetrisBoard();
    for (let y = TETRIS_BOARD_HEIGHT - expectedClears; y < TETRIS_BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < TETRIS_BOARD_WIDTH - 1; x += 1) board[y][x] = "J";
    }
    const state = {
      ...withActive(startTetrisGame(0, () => 0), {
        type: "I",
        rotation: 1,
        x: 7,
        y: 0
      }),
      board
    };
    const next = hardDropTetris(state, () => 0);

    assert.equal(next.lastClear, expectedClears);
    assert.equal(next.lines, expectedClears);
    assert.equal(next.score, expectedClears);
    assert.equal(next.bestScore, expectedClears);
  }
});

test("preserves the order of non-cleared rows", () => {
  const board = createEmptyTetrisBoard();
  board[17][0] = "J";
  board[19][1] = "L";
  for (let x = 0; x < TETRIS_BOARD_WIDTH - 1; x += 1) board[18][x] = "S";

  const state = {
    ...withActive(startTetrisGame(0, () => 0), {
      type: "I",
      rotation: 1,
      x: 7,
      y: 0
    }),
    board
  };
  const next = hardDropTetris(state, () => 0);

  assert.equal(next.lastClear, 1);
  assert.equal(next.board[18][0], "J");
  assert.equal(next.board[19][1], "L");
});

test("changes level every ten lines while keeping score equal to lines", () => {
  const board = createEmptyTetrisBoard();
  for (let x = 0; x < 6; x += 1) board[19][x] = "Z";
  const state = {
    ...withActive(startTetrisGame(4, () => 0), {
      type: "I",
      rotation: 0,
      x: 6,
      y: 0
    }),
    board,
    lines: 9,
    score: 9,
    level: 1
  };
  const next = hardDropTetris(state, () => 0);

  assert.equal(next.lines, 10);
  assert.equal(next.score, 10);
  assert.equal(next.bestScore, 10);
  assert.equal(next.level, 2);
});

test("soft drop has no score bonus", () => {
  const state = startTetrisGame(0, () => 0);
  const next = softDropTetris(state, () => 0);
  assert.equal(next.active.y, state.active.y + 1);
  assert.equal(next.score, state.score);
});

test("drop interval decreases by level and is clamped", () => {
  assert.equal(tetrisTickDuration(1), TETRIS_BASE_TICK_MS);
  assert.ok(tetrisTickDuration(2) < tetrisTickDuration(1));
  assert.ok(tetrisTickDuration(10) < tetrisTickDuration(2));
  assert.equal(tetrisTickDuration(10_000), TETRIS_MIN_TICK_MS);
  assert.equal(tetrisTickDuration(Number.NaN), TETRIS_BASE_TICK_MS);
});

test("ends the game when the next piece cannot spawn", () => {
  const board = createEmptyTetrisBoard();
  board[0][4] = "J";
  const state = {
    ...withActive(startTetrisGame(0, () => 0), {
      type: "O",
      rotation: 0,
      x: -1,
      y: 18
    }),
    board,
    next: "T"
  };
  const next = advanceTetris(state, () => 0);

  assert.equal(next.phase, "gameover");
  assert.equal(next.active.type, "T");
});

test("ends the game instead of locking cells above the board", () => {
  const board = createEmptyTetrisBoard();
  for (let x = 3; x < 7; x += 1) board[0][x] = "L";
  const state = {
    ...withActive(startTetrisGame(0, () => 0), {
      type: "I",
      rotation: 0,
      x: 3,
      y: -2
    }),
    board
  };
  const snapshot = globalThis.structuredClone(board);
  const next = advanceTetris(state, () => 0);

  assert.equal(next.phase, "gameover");
  assert.deepEqual(next.board, snapshot);
});

test("pause blocks every game action and resume continues", () => {
  const playing = startTetrisGame(0, () => 0);
  const paused = pauseTetrisGame(playing);

  assert.equal(paused.phase, "paused");
  assert.equal(moveTetris(paused, -1), paused);
  assert.equal(rotateTetris(paused), paused);
  assert.equal(advanceTetris(paused), paused);
  assert.equal(softDropTetris(paused), paused);
  assert.equal(hardDropTetris(paused), paused);
  assert.equal(resumeTetrisGame(paused).phase, "playing");
});

test("game-over state ignores controls", () => {
  const state = { ...startTetrisGame(0, () => 0), phase: "gameover" };
  assert.equal(moveTetris(state, 1), state);
  assert.equal(rotateTetris(state), state);
  assert.equal(advanceTetris(state), state);
  assert.equal(hardDropTetris(state), state);
});

test("game operations do not mutate the input state or board", () => {
  const state = startTetrisGame(0, sequenceRandom([0.2, 0.5, 0.9]));
  const snapshot = globalThis.structuredClone(state);
  const next = hardDropTetris(state, () => 0.3);

  assert.deepEqual(state, snapshot);
  assert.notEqual(next, state);
  assert.notEqual(next.board, state.board);
  for (let index = 0; index < state.board.length; index += 1) {
    assert.notEqual(next.board[index], state.board[index]);
  }
});

function withActive(state, active) {
  return { ...state, active };
}

function countLockedCells(board) {
  return board.reduce(
    (total, row) => total + row.filter((cell) => cell !== null).length,
    0
  );
}

function sortedCells(cells) {
  return cells.map(({ x, y }) => `${x}:${y}`).sort();
}

function sequenceRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
}
