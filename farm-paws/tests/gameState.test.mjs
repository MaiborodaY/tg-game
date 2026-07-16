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

test("uses the configured seven-round base curve", () => {
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

test("base failure preserves earned score but a failed input adds nothing", () => {
  let state = gameState.markReadyForInput(gameState.startGame(0, seededRandom(11)));
  state = gameState.handleCellInput(state, state.sequence[0].cellIndex).state;
  assert.equal(state.score, 1);

  state = { ...state, hp: 1 };
  const expectedCell = state.sequence[state.inputIndex].cellIndex;
  const response = gameState.handleCellInput(state, (expectedCell + 1) % 9);

  assert.equal(response.result, "failed");
  assert.equal(response.state.phase, "failed");
  assert.equal(response.state.hp, 0);
  assert.equal(response.state.score, 1);
  assert.equal(response.state.bestScore, 1);
  assert.equal(response.state.securedScore, 0);
  assert.equal(response.state.inputIndex, 1);
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

test("a perfect base run reaches a secured choice at 31 score", () => {
  const random = seededRandom(23);
  let state = gameState.startGame(4, random);
  let expectedScore = 0;
  let lastResult = null;

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
        finalStep ? (finalRound ? "choice" : "roundComplete") : "correct"
      );
      lastResult = response.result;
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
  assert.equal(state.phase, "choice");
  assert.equal(state.securedScore, 31);
  assert.equal(lastResult, "choice");

  assert.equal(gameState.startNextRound(state, random), state);

  const cashedOut = gameState.cashOutRun(state);
  assert.equal(cashedOut.phase, "won");
  assert.equal(cashedOut.score, 31);
  assert.equal(cashedOut.securedScore, 31);
  assert.equal(cashedOut.bestScore, 31);
  assert.equal(gameState.cashOutRun(cashedOut), cashedOut);
});

test("bonus curve caps its length, cycles modes, and keeps sprint visibly faster", () => {
  const expected = [
    { round: 8, length: 7, mode: "normal", showMs: 500 },
    { round: 9, length: 8, mode: "reverse", showMs: 475 },
    { round: 10, length: 9, mode: "sprint", showMs: 360 },
    { round: 11, length: 9, mode: "normal", showMs: 425 },
    { round: 12, length: 9, mode: "reverse", showMs: 400 },
    { round: 13, length: 9, mode: "sprint", showMs: 300 },
    { round: 50, length: 9, mode: "normal", showMs: 400 }
  ];

  for (const config of expected) {
    assert.equal(gameState.sequenceLengthForRound(config.round), config.length);
    assert.equal(gameState.roundModeForRound(config.round), config.mode);
    assert.equal(gameState.showDurationForRound(config.round), config.showMs);
  }
});

test("all completed bonus fields remain provisional until cash out", () => {
  const random = seededRandom(31);
  let state = reachBaseChoice(0, random);
  assert.equal(state.score, 31);
  assert.equal(state.bestScore, 31);

  state = gameState.startBonusRound(state, random);
  assert.equal(state.round, 8);
  assert.equal(state.phase, "showing");
  assert.equal(state.securedScore, 31);

  ({ state } = completeRound(state));
  assert.equal(state.phase, "choice");
  assert.equal(state.score, 38);
  assert.equal(state.securedScore, 31);
  assert.equal(state.bestScore, 31);
  assert.equal(gameState.startNextRound(state, random), state);

  const cashedOut = gameState.cashOutRun(state);
  assert.equal(cashedOut.phase, "won");
  assert.equal(cashedOut.score, 38);
  assert.equal(cashedOut.securedScore, 38);
  assert.equal(cashedOut.bestScore, 38);
});

test("losing any bonus field burns the entire provisional bonus", () => {
  const random = seededRandom(37);
  let state = reachBaseChoice(0, random);
  state = gameState.startBonusRound(state, random);
  ({ state } = completeRound(state));
  assert.equal(state.score, 38);
  assert.equal(state.bestScore, 31);

  state = gameState.startBonusRound(state, random);
  state = gameState.markReadyForInput(state);
  const firstExpected = inputStepsForState(state)[0].cellIndex;
  state = gameState.handleCellInput(state, firstExpected).state;
  assert.equal(state.score, 39);
  assert.equal(state.bestScore, 31);

  state = { ...state, hp: 1 };
  const nextExpected = inputStepsForState(state)[state.inputIndex].cellIndex;
  const failure = gameState.handleCellInput(state, (nextExpected + 1) % 9);
  assert.equal(failure.result, "failed");
  assert.equal(failure.state.phase, "failed");
  assert.equal(failure.state.hp, 0);
  assert.equal(failure.state.score, 31);
  assert.equal(failure.state.securedScore, 31);
  assert.equal(failure.state.bestScore, 31);
});

test("bonus mode can continue through round 50 without raising best before cash out", () => {
  const random = seededRandom(41);
  let state = reachBaseChoice(0, random);

  for (let round = 8; round <= 50; round += 1) {
    state = gameState.startBonusRound(state, random);
    assert.equal(state.round, round);
    assert.equal(state.phase, "showing");
    const completed = completeRound(state);
    assert.equal(completed.result, "choice");
    state = completed.state;
    assert.equal(state.phase, "choice");
    assert.equal(state.securedScore, 31);
    assert.equal(state.bestScore, 31);
  }

  assert.equal(state.round, 50);
  assert.equal(state.sequence.length, 9);
  assert.equal(state.roundMode, "normal");
  assert.equal(state.score, 415);

  const cashedOut = gameState.cashOutRun(state);
  assert.equal(cashedOut.phase, "won");
  assert.equal(cashedOut.score, 415);
  assert.equal(cashedOut.bestScore, 415);
});

test("cash out never lowers an existing best score", () => {
  const random = seededRandom(43);
  let state = reachBaseChoice(500, random);
  state = gameState.startBonusRound(state, random);
  ({ state } = completeRound(state));

  assert.equal(state.score, 38);
  assert.equal(state.bestScore, 500);
  assert.equal(gameState.cashOutRun(state).bestScore, 500);
});

test("constant RNG terminates and returns valid sequences for every round", () => {
  const moduleUrl = new URL("../src/gameState.ts", import.meta.url).href;
  const script = `
    import { createRoundSequence } from ${JSON.stringify(moduleUrl)};
    const baseLengths = ${JSON.stringify(ROUND_LENGTHS)};
    for (let round = 1; round <= 50; round += 1) {
      const sequence = createRoundSequence(round, () => 0);
      const expectedLength = round <= baseLengths.length
        ? baseLengths[round - 1]
        : Math.min(9, round - 1);
      if (sequence.length !== expectedLength) process.exit(2);
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

function inputStepsForState(state) {
  return state.roundMode === "reverse"
    ? [...state.sequence].reverse()
    : state.sequence;
}

function completeRound(initialState) {
  let state = gameState.markReadyForInput(initialState);
  let result = "ignored";
  for (const step of inputStepsForState(state)) {
    const response = gameState.handleCellInput(state, step.cellIndex);
    state = response.state;
    result = response.result;
  }
  return { state, result };
}

function reachBaseChoice(bestScore, random) {
  let state = gameState.startGame(bestScore, random);
  for (let round = 1; round <= ROUND_LENGTHS.length; round += 1) {
    ({ state } = completeRound(state));
    if (round < ROUND_LENGTHS.length) {
      state = gameState.startNextRound(state, random);
    }
  }
  return state;
}
