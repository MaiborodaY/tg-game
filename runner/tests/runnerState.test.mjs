import assert from "node:assert/strict";
import test from "node:test";

import {
  RUNNER_BASE_SPEED,
  RUNNER_COUNTDOWN_MS,
  RUNNER_CROP_SCORE,
  RUNNER_ENCOUNTER_KINDS,
  RUNNER_FULL_PATTERN_BONUS,
  RUNNER_INVULNERABILITY_MS,
  RUNNER_MAGNET_MS,
  RUNNER_MAX_SPEED,
  RUNNER_SHIELD_MAX_MS,
  RUNNER_SHIELD_MIN_MS,
  RUNNER_STEP_MS,
  RUNNER_SURVIVAL_SCORE_PER_SECOND,
  createRunnerInitialState,
  jumpRunner,
  pauseRunner,
  resizeRunnerWorld,
  resumeRunner,
  startRunner,
  stepRunner,
} from "../src/runnerState.ts";

function runningState(width = 360, height = 640) {
  return {
    ...createRunnerInitialState(width, height),
    phase: "running",
    nextEncounterInMs: 1_000_000_000,
  };
}

function obstacleAtPlayer(state, id = 1) {
  return {
    id,
    kind: "crate",
    x: state.player.x,
    y: state.world.groundY - 30,
    width: 32,
    height: 30,
    groundOffset: 0,
  };
}

function pickupAtPlayer(state, overrides) {
  return {
    id: 1,
    kind: "crop",
    x: state.player.x + state.player.width / 2,
    y: state.player.y + state.player.height / 2,
    radius: 10,
    patternId: null,
    durationMs: 0,
    ...overrides,
  };
}

function runSteps(state, count, random = () => 0.5) {
  let next = state;
  for (let index = 0; index < count; index += 1) next = stepRunner(next, random);
  return next;
}

function simulateRenderFps(state, fps, seconds) {
  let next = state;
  let accumulator = 0;
  const frameMs = 1000 / fps;
  for (let frame = 0; frame < fps * seconds; frame += 1) {
    accumulator += frameMs;
    while (accumulator + 1e-9 >= RUNNER_STEP_MS) {
      next = stepRunner(next, () => 0.5);
      accumulator -= RUNNER_STEP_MS;
    }
  }
  return next;
}

test("initial state is a grounded preview with sanitized dimensions", () => {
  const state = createRunnerInitialState(100, Number.NaN);

  assert.equal(state.phase, "preview");
  assert.equal(state.world.width, 240);
  assert.equal(state.world.height, 640);
  assert.equal(state.player.y + state.player.height, state.world.groundY);
  assert.equal(state.speed, RUNNER_BASE_SPEED);
  assert.deepEqual(state.obstacles, []);
  assert.deepEqual(state.pickups, []);
});

test("start resets a run and countdown does not advance gameplay", () => {
  const dirty = {
    ...runningState(),
    score: 99,
    distance: 500,
    crops: 12,
    combo: 3,
  };
  let state = startRunner(dirty);

  assert.equal(state.phase, "countdown");
  assert.equal(state.countdownRemainingMs, RUNNER_COUNTDOWN_MS);
  assert.equal(state.score, 0);
  assert.equal(state.distance, 0);

  state = runSteps(state, Math.ceil(RUNNER_COUNTDOWN_MS / RUNNER_STEP_MS), () => 0.5);
  assert.equal(state.phase, "running");
  assert.equal(state.score, 0);
  assert.equal(state.distance, 0);

  state = stepRunner(state, () => 0.5);
  assert.ok(state.score > 0);
  assert.ok(state.distance > 0);
});

test("fixed-step accumulator produces identical simulation at 60 and 120 render FPS", () => {
  const initial = runningState();
  const at60 = simulateRenderFps(initial, 60, 5);
  const at120 = simulateRenderFps(initial, 120, 5);

  assert.deepEqual(at120, at60);
  assert.ok(Math.abs(at60.activeMs - 300 * RUNNER_STEP_MS) < 1e-9);
  assert.ok(Math.abs(at60.score - 5 * RUNNER_SURVIVAL_SCORE_PER_SECOND) < 1e-9);
});

test("the player has exactly two jumps and landing restores them", () => {
  const initial = runningState();
  const first = jumpRunner(initial);
  assert.equal(first.player.jumpsUsed, 1);
  assert.ok(first.player.vy < 0);

  const airborne = stepRunner(first, () => 0.5);
  const second = jumpRunner(airborne);
  assert.equal(second.player.jumpsUsed, 2);
  assert.ok(second.player.vy < 0);
  assert.strictEqual(jumpRunner(second), second);

  let landed = second;
  for (let index = 0; index < 240 && !landed.player.onGround; index += 1) {
    landed = stepRunner(landed, () => 0.5);
  }
  assert.equal(landed.player.onGround, true);
  assert.equal(landed.player.jumpsUsed, 0);
  assert.equal(landed.player.y + landed.player.height, landed.world.groundY);
});

test("pause freezes the engine and resume continues it", () => {
  const running = runningState();
  const paused = pauseRunner(running);

  assert.equal(paused.phase, "paused");
  assert.strictEqual(stepRunner(paused), paused);
  const resumed = resumeRunner(paused);
  assert.equal(resumed.phase, "running");
  assert.ok(stepRunner(resumed).activeMs > resumed.activeMs);
});

test("resize preserves positions relative to ground without mutating input", () => {
  const initial = runningState();
  const state = {
    ...initial,
    player: { ...initial.player, y: initial.player.y - 40, onGround: false },
    obstacles: [{ ...obstacleAtPlayer(initial), x: 250, groundOffset: 15 }],
    pickups: [pickupAtPlayer(initial, { x: 280, y: initial.world.groundY - 100 })],
  };
  const snapshot = globalThis.structuredClone(state);
  const resized = resizeRunnerWorld(state, 520, 760);

  assert.deepEqual(state, snapshot);
  assert.notStrictEqual(resized, state);
  assert.equal(
    resized.world.groundY - (resized.player.y + resized.player.height),
    state.world.groundY - (state.player.y + state.player.height),
  );
  assert.equal(
    resized.obstacles[0].y,
    resized.world.groundY - resized.obstacles[0].height - resized.obstacles[0].groundOffset,
  );
  assert.equal(
    resized.world.groundY - resized.pickups[0].y,
    state.world.groundY - state.pickups[0].y,
  );
});

test("an unprotected collision ends the run", () => {
  const state = runningState();
  const result = stepRunner({ ...state, obstacles: [obstacleAtPlayer(state)] }, () => 0.5);

  assert.equal(result.phase, "gameover");
});

test("shield absorbs one hit and invulnerability handles overlapping hitboxes", () => {
  const state = runningState();
  const shield = pickupAtPlayer(state, {
    kind: "shield",
    durationMs: 9000,
  });
  const obstacles = [obstacleAtPlayer(state, 10), obstacleAtPlayer(state, 11)];
  const protectedState = stepRunner({ ...state, pickups: [shield], obstacles }, () => 0.5);

  assert.equal(protectedState.phase, "running");
  assert.equal(protectedState.player.shieldRemainingMs, 0);
  assert.equal(protectedState.player.invulnerableRemainingMs, RUNNER_INVULNERABILITY_MS);
  assert.deepEqual(protectedState.obstacles, []);

  const nextObstacle = obstacleAtPlayer(protectedState, 12);
  const vulnerable = {
    ...protectedState,
    player: { ...protectedState.player, invulnerableRemainingMs: RUNNER_STEP_MS / 2 },
    obstacles: [nextObstacle],
  };
  assert.equal(stepRunner(vulnerable, () => 0.5).phase, "gameover");
});

test("magnet lasts four seconds and collects nearby crops", () => {
  const state = runningState();
  const magnet = pickupAtPlayer(state, { id: 1, kind: "magnet", durationMs: RUNNER_MAGNET_MS });
  const crop = pickupAtPlayer(state, {
    id: 2,
    x: state.player.x + state.player.width / 2 + 120,
  });
  const result = stepRunner({ ...state, pickups: [magnet, crop] }, () => 0.5);

  assert.equal(result.player.magnetRemainingMs, RUNNER_MAGNET_MS);
  assert.equal(result.crops, 1);
  assert.equal(result.pickups.length, 0);

  const expired = runSteps(result, Math.ceil(RUNNER_MAGNET_MS / RUNNER_STEP_MS), () => 0.5);
  assert.equal(expired.player.magnetRemainingMs, 0);
});

test("crop and full-pattern scoring stays moderate and updates combo", () => {
  const state = runningState();
  const first = pickupAtPlayer(state, { id: 1, patternId: 7 });
  const second = pickupAtPlayer(state, { id: 2, patternId: 7 });
  const result = stepRunner(
    {
      ...state,
      pickups: [first, second],
      patterns: [{ id: 7, total: 2, collected: 0, missed: false }],
    },
    () => 0.5,
  );

  const survivalForStep = RUNNER_SURVIVAL_SCORE_PER_SECOND * (RUNNER_STEP_MS / 1000);
  assert.ok(
    Math.abs(
      result.score - (survivalForStep + 2 * RUNNER_CROP_SCORE + RUNNER_FULL_PATTERN_BONUS),
    ) < 1e-9,
  );
  assert.equal(result.crops, 2);
  assert.equal(result.combo, 1);
  assert.equal(result.bestCombo, 1);
  assert.deepEqual(result.patterns, []);
});

test("missing a crop resets combo and does not award a pattern bonus", () => {
  const state = runningState();
  const missed = pickupAtPlayer(state, { x: -20, patternId: 3 });
  const result = stepRunner(
    {
      ...state,
      combo: 4,
      bestCombo: 4,
      pickups: [missed],
      patterns: [{ id: 3, total: 1, collected: 0, missed: false }],
    },
    () => 0.5,
  );

  assert.equal(result.combo, 0);
  assert.equal(result.bestCombo, 4);
  assert.equal(result.crops, 0);
  assert.deepEqual(result.patterns, []);
});

test("encounter director can produce every finite, off-screen safe template", () => {
  for (let index = 0; index < RUNNER_ENCOUNTER_KINDS.length; index += 1) {
    const values = [(index + 0.25) / RUNNER_ENCOUNTER_KINDS.length, 0.5, 0.5];
    const random = () => values.shift() ?? 0.5;
    const result = stepRunner({ ...runningState(), nextEncounterInMs: 0 }, random);

    assert.equal(result.lastEncounter, RUNNER_ENCOUNTER_KINDS[index]);
    assert.ok(result.obstacles.length >= 1);
    assert.equal(result.pickups.filter((pickup) => pickup.kind === "crop").length, 5);
    assert.equal(result.patterns.length, 1);
    assert.ok(result.obstacles.every((obstacle) => obstacle.x > result.world.width));
    assert.ok(result.pickups.every((pickup) => Number.isFinite(pickup.x) && Number.isFinite(pickup.y)));
    const ids = [...result.obstacles, ...result.pickups].map((entity) => entity.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test("spawned shields have an 8–10 second duration", () => {
  const values = [0, 0.01, 0.75, 0.5];
  const result = stepRunner(
    { ...runningState(), nextEncounterInMs: 0 },
    () => values.shift() ?? 0.5,
  );
  const shield = result.pickups.find((pickup) => pickup.kind === "shield");

  assert.ok(shield);
  assert.ok(shield.durationMs >= RUNNER_SHIELD_MIN_MS);
  assert.ok(shield.durationMs <= RUNNER_SHIELD_MAX_MS);
});

test("the crow lane can be fully collected at maximum speed by staying low", () => {
  const randomValues = [0.65, 0.5, 0.5];
  const spawned = stepRunner(
    { ...runningState(), speed: RUNNER_MAX_SPEED, nextEncounterInMs: 0 },
    () => randomValues.shift() ?? 0.5,
  );
  const result = runSteps(
    { ...spawned, nextEncounterInMs: 1_000_000_000 },
    150,
    () => 0.5,
  );

  assert.equal(spawned.lastEncounter, "crow_lane");
  assert.equal(result.phase, "running");
  assert.equal(result.crops, 5);
  assert.equal(result.combo, 1);
});

test("step is immutable, including nested arrays and objects", () => {
  const initial = runningState();
  const state = {
    ...initial,
    pickups: [pickupAtPlayer(initial, { x: 300 })],
    obstacles: [{ ...obstacleAtPlayer(initial), x: 330 }],
    patterns: [{ id: 2, total: 1, collected: 0, missed: false }],
  };
  const snapshot = globalThis.structuredClone(state);
  const result = stepRunner(state, () => 0.5);

  assert.deepEqual(state, snapshot);
  assert.notStrictEqual(result, state);
  assert.notStrictEqual(result.player, state.player);
  assert.notStrictEqual(result.pickups, state.pickups);
  assert.notStrictEqual(result.obstacles, state.obstacles);
  assert.notStrictEqual(result.patterns, state.patterns);
});

test("a long run remains finite, bounded, and reaches its speed cap", () => {
  const result = runSteps(runningState(), 60 * 100, () => 0.5);

  assert.equal(result.phase, "running");
  assert.equal(result.speed, RUNNER_MAX_SPEED);
  assert.ok(Number.isFinite(result.distance));
  assert.ok(Number.isFinite(result.score));
  assert.ok(Math.abs(result.score - 100 * RUNNER_SURVIVAL_SCORE_PER_SECOND) < 1e-7);
  assert.deepEqual(result.obstacles, []);
  assert.deepEqual(result.pickups, []);
  assert.deepEqual(result.patterns, []);
});

test("invalid and constant random sources cannot create invalid entities or hang", () => {
  const invalid = stepRunner({ ...runningState(), nextEncounterInMs: 0 }, () => Number.NaN);
  assert.ok(invalid.lastEncounter);
  assert.ok(invalid.nextEncounterInMs > 0);
  assert.ok(
    [...invalid.obstacles, ...invalid.pickups].every((entity) =>
      Object.values(entity).every((value) => typeof value !== "number" || Number.isFinite(value)),
    ),
  );

  const constant = stepRunner({ ...runningState(), nextEncounterInMs: 0 }, () => 0);
  assert.equal(constant.lastEncounter, RUNNER_ENCOUNTER_KINDS[0]);
  assert.ok(constant.nextEncounterInMs > 0);
});
