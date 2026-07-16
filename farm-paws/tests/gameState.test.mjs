import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import * as gameState from "../src/gameState.ts";

const ROUND_LENGTHS = [3, 4, 4, 5, 4, 5, 6];
const ROUND_MODES = [
  "normal",
  "normal",
  "reverse",
  "normal",
  "sprint",
  "reverse",
  "finale"
];

test("uses the finite seven-round length curve", () => {
  assert.deepEqual(
    ROUND_LENGTHS.map((_, index) => gameState.sequenceLengthForRound(index + 1)),
    ROUND_LENGTHS
  );
});

test("assigns the target mode and sequence length to every round", () => {
  const random = seededRandom(17);
  let state = gameState.startGame(0, random);

  for (let index = 0; index < ROUND_LENGTHS.length; index += 1) {
    assert.equal(state.round, index + 1);
    assert.equal(state.roundMode, ROUND_MODES[index]);
    assert.equal(state.sequence.length, ROUND_LENGTHS[index]);

    if (index < ROUND_LENGTHS.length - 1) {
      state = gameState.startNextRound({ ...state, phase: "success" }, random);
    }
  }
});

test("requires an explicit briefing before every reverse field", () => {
  assert.equal(gameState.requiresRoundBriefing("reverse"), true);
  for (const mode of ["normal", "sprint", "finale"]) {
    assert.equal(gameState.requiresRoundBriefing(mode), false);
  }
});

test("reverse rounds expect the displayed sequence in reverse order", () => {
  let state = {
    ...gameState.markReadyForInput(gameState.startGame(0, seededRandom(3))),
    round: 3,
    roundMode: "reverse",
    sequence: [
      { cellIndex: 0 },
      { cellIndex: 1 },
      { cellIndex: 2 },
      { cellIndex: 3 }
    ],
    inputIndex: 0
  };

  for (const [index, cellIndex] of [3, 2, 1, 0].entries()) {
    const response = gameState.handleCellInput(state, cellIndex);
    assert.equal(response.result, index === 3 ? "roundComplete" : "correct");
    assert.equal(response.state.score, index + 1);
    state = response.state;
  }

  assert.equal(state.phase, "success");
  assert.equal(state.hp, 3);
});

test("mistakes remove one heart without awarding score or skipping progress", () => {
  let state = gameState.markReadyForInput(gameState.startGame(10, seededRandom(9)));
  const firstCell = state.sequence[0].cellIndex;
  const first = gameState.handleCellInput(state, firstCell);
  assert.equal(first.result, "correct");
  assert.equal(first.state.score, 1);
  assert.equal(first.state.bestScore, 10);

  state = first.state;
  const expectedCell = state.sequence[state.inputIndex].cellIndex;
  const wrongCell = (expectedCell + 1) % 9;
  const mistake = gameState.handleCellInput(state, wrongCell);
  assert.equal(mistake.result, "mistake");
  assert.equal(mistake.state.hp, 2);
  assert.equal(mistake.state.score, 1);
  assert.equal(mistake.state.bestScore, 10);
  assert.equal(mistake.state.inputIndex, 1);

  state = mistake.state;
  while (state.phase === "input") {
    const expected = state.sequence[state.inputIndex].cellIndex;
    state = gameState.handleCellInput(state, expected).state;
  }
  assert.equal(state.phase, "success");
  assert.equal(state.hp, 2);
  assert.equal(state.score, ROUND_LENGTHS[0]);
  assert.equal(state.bestScore, 10);
});

test("the last heart ends the run and a failed input never increases score", () => {
  const ready = gameState.markReadyForInput(gameState.startGame(0, seededRandom(11)));
  const state = { ...ready, hp: 1 };
  const expectedCell = state.sequence[0].cellIndex;
  const response = gameState.handleCellInput(state, (expectedCell + 1) % 9);

  assert.equal(response.result, "failed");
  assert.equal(response.state.phase, "failed");
  assert.equal(response.state.hp, 0);
  assert.equal(response.state.score, 0);
  assert.equal(response.state.inputIndex, 0);
});

test("the one-use scent replay never awards the same route steps twice", () => {
  let state = gameState.markReadyForInput(gameState.startGame(0, seededRandom(13)));
  for (const step of state.sequence.slice(0, 2)) {
    state = gameState.handleCellInput(state, step.cellIndex).state;
  }
  assert.equal(state.score, 2);

  state = gameState.useScentHint(state);
  assert.equal(state.phase, "showing");
  assert.equal(state.inputIndex, 0);
  assert.equal(state.scentAvailable, false);
  assert.equal(gameState.useScentHint(state), state);

  state = gameState.markReadyForInput(state);
  for (const step of state.sequence) {
    state = gameState.handleCellInput(state, step.cellIndex).state;
  }
  assert.equal(state.phase, "success");
  assert.equal(state.score, 3);
});

test("two perfect fields restore one heart without exceeding the maximum", () => {
  let state = gameState.markReadyForInput(gameState.startGame(0, seededRandom(15)));
  state = { ...state, hp: 2, perfectStreak: 1 };

  for (const step of state.sequence) {
    state = gameState.handleCellInput(state, step.cellIndex).state;
  }

  assert.equal(state.phase, "success");
  assert.equal(state.hp, 3);
  assert.equal(state.heartRestored, true);
  assert.equal(state.perfectStreak, 0);
  assert.equal(state.roundWasPerfect, true);
});

test("a perfect run wins after round seven with 31 score and cannot enter round eight", () => {
  const random = seededRandom(23);
  let state = gameState.startGame(4, random);
  let expectedScore = 0;

  for (let roundIndex = 0; roundIndex < ROUND_LENGTHS.length; roundIndex += 1) {
    assert.equal(state.round, roundIndex + 1);
    assert.equal(state.roundMode, ROUND_MODES[roundIndex]);
    assert.equal(state.sequence.length, ROUND_LENGTHS[roundIndex]);
    state = gameState.markReadyForInput(state);

    const inputSteps = state.roundMode === "reverse"
      ? [...state.sequence].reverse()
      : state.sequence;
    for (const [stepIndex, step] of inputSteps.entries()) {
      const response = gameState.handleCellInput(state, step.cellIndex);
      expectedScore += 1;
      assert.equal(response.state.score, expectedScore);
      assert.equal(response.state.hp, 3);

      const finalStep = stepIndex === inputSteps.length - 1;
      const finalRound = roundIndex === ROUND_LENGTHS.length - 1;
      assert.equal(
        response.result,
        finalStep ? (finalRound ? "won" : "roundComplete") : "correct"
      );
      state = response.state;
    }

    if (roundIndex < ROUND_LENGTHS.length - 1) {
      assert.equal(state.phase, "success");
      state = gameState.startNextRound(state, random);
    }
  }

  assert.equal(expectedScore, 31);
  assert.equal(state.score, 31);
  assert.equal(state.bestScore, 31);
  assert.equal(state.hp, 3);
  assert.equal(state.round, 7);
  assert.equal(state.phase, "won");

  const afterWin = gameState.startNextRound(state, random);
  assert.equal(afterWin, state);
  assert.equal(afterWin.round, 7);
  assert.equal(afterWin.phase, "won");
});

test("constant RNG terminates and returns valid sequences for every round", () => {
  const moduleUrl = new URL("../src/gameState.ts", import.meta.url).href;
  const script = `
    import { createRoundSequence } from ${JSON.stringify(moduleUrl)};
    const lengths = ${JSON.stringify(ROUND_LENGTHS)};
    for (let round = 1; round <= lengths.length; round += 1) {
      const sequence = createRoundSequence(round, () => 0);
      if (sequence.length !== lengths[round - 1]) process.exit(2);
      if (sequence.some(({ cellIndex }) => !Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8)) {
        process.exit(3);
      }
    }
  `;
  const child = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", script],
    { encoding: "utf8", timeout: 1_500 }
  );

  assert.equal(
    child.error,
    undefined,
    child.error?.code === "ETIMEDOUT"
      ? "createRoundSequence did not terminate with a constant RNG"
      : child.error?.message
  );
  assert.equal(child.status, 0, child.stderr || `child exited with ${child.status}`);
});

function seededRandom(initialSeed) {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (Math.imul(1_664_525, seed) + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };
}
