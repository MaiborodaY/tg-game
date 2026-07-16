export const RUNNER_STEP_MS = 1000 / 60;
export const RUNNER_COUNTDOWN_MS = 3000;
export const RUNNER_BASE_SPEED = 190;
export const RUNNER_MAX_SPEED = 430;
export const RUNNER_SURVIVAL_SCORE_PER_SECOND = 10;
export const RUNNER_CROP_SCORE = 3;
export const RUNNER_FULL_PATTERN_BONUS = 10;
export const RUNNER_SHIELD_MIN_MS = 8000;
export const RUNNER_SHIELD_MAX_MS = 10000;
export const RUNNER_MAGNET_MS = 4000;
export const RUNNER_INVULNERABILITY_MS = 650;

export const RUNNER_ENCOUNTER_KINDS = [
  "crate_arc",
  "hay_steps",
  "puddle_hop",
  "crow_lane",
  "double_bales",
] as const;

export type RunnerPhase = "preview" | "countdown" | "running" | "paused" | "gameover";
export type RunnerObstacleKind = "crate" | "hay" | "puddle" | "crow";
export type RunnerPickupKind = "crop" | "shield" | "magnet";
export type RunnerEncounterKind = (typeof RUNNER_ENCOUNTER_KINDS)[number];
export type RunnerRandom = () => number;

export interface RunnerWorld {
  width: number;
  height: number;
  groundY: number;
}

export interface RunnerPlayer {
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  jumpsUsed: number;
  shieldRemainingMs: number;
  magnetRemainingMs: number;
  invulnerableRemainingMs: number;
}

export interface RunnerObstacle {
  id: number;
  kind: RunnerObstacleKind;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Distance between the bottom of the obstacle and the ground. */
  groundOffset: number;
}

export interface RunnerPickup {
  id: number;
  kind: RunnerPickupKind;
  x: number;
  y: number;
  radius: number;
  /** Crops in the same encounter share a pattern id. Power-ups use null. */
  patternId: number | null;
  /** Used by shield and magnet pickups; crops use 0. */
  durationMs: number;
}

export interface RunnerPatternProgress {
  id: number;
  total: number;
  collected: number;
  missed: boolean;
}

export interface RunnerState {
  phase: RunnerPhase;
  world: RunnerWorld;
  countdownRemainingMs: number;
  activeMs: number;
  score: number;
  distance: number;
  crops: number;
  combo: number;
  bestCombo: number;
  speed: number;
  player: RunnerPlayer;
  obstacles: RunnerObstacle[];
  pickups: RunnerPickup[];
  patterns: RunnerPatternProgress[];
  nextEncounterInMs: number;
  nextEntityId: number;
  nextPatternId: number;
  lastEncounter: RunnerEncounterKind | null;
}

const MIN_WORLD_WIDTH = 240;
const MIN_WORLD_HEIGHT = 320;
const GROUND_MARGIN = 72;
const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 32;
const GRAVITY = 2200;
const FIRST_JUMP_VELOCITY = -720;
const SECOND_JUMP_VELOCITY = -680;
export const RUNNER_MAGNET_RADIUS = 170;
const SPEED_RAMP_SECONDS = 70;
const SPEED_GROWTH_PER_SECOND = (RUNNER_MAX_SPEED - RUNNER_BASE_SPEED) / SPEED_RAMP_SECONDS;

interface ObstacleTemplate {
  kind: RunnerObstacleKind;
  dx: number;
  width: number;
  height: number;
  groundOffset?: number;
}

interface CropTemplate {
  dx: number;
  heightAboveGround: number;
}

interface EncounterTemplate {
  obstacles: readonly ObstacleTemplate[];
  crops: readonly CropTemplate[];
}

const ENCOUNTER_TEMPLATES: Record<RunnerEncounterKind, EncounterTemplate> = {
  crate_arc: {
    obstacles: [{ kind: "crate", dx: 145, width: 36, height: 44 }],
    crops: [
      { dx: 45, heightAboveGround: 48 },
      { dx: 90, heightAboveGround: 78 },
      { dx: 135, heightAboveGround: 108 },
      { dx: 180, heightAboveGround: 78 },
      { dx: 225, heightAboveGround: 48 },
    ],
  },
  hay_steps: {
    obstacles: [
      { kind: "hay", dx: 120, width: 48, height: 31 },
      { kind: "hay", dx: 250, width: 48, height: 31 },
    ],
    crops: [
      { dx: 45, heightAboveGround: 45 },
      { dx: 105, heightAboveGround: 78 },
      { dx: 170, heightAboveGround: 105 },
      { dx: 235, heightAboveGround: 78 },
      { dx: 305, heightAboveGround: 45 },
    ],
  },
  puddle_hop: {
    obstacles: [{ kind: "puddle", dx: 130, width: 70, height: 12 }],
    crops: [
      { dx: 45, heightAboveGround: 44 },
      { dx: 90, heightAboveGround: 70 },
      { dx: 140, heightAboveGround: 94 },
      { dx: 190, heightAboveGround: 70 },
      { dx: 240, heightAboveGround: 44 },
    ],
  },
  crow_lane: {
    obstacles: [{ kind: "crow", dx: 155, width: 40, height: 26, groundOffset: 76 }],
    crops: [
      { dx: 45, heightAboveGround: 38 },
      { dx: 90, heightAboveGround: 38 },
      { dx: 135, heightAboveGround: 38 },
      { dx: 210, heightAboveGround: 38 },
      { dx: 260, heightAboveGround: 38 },
    ],
  },
  double_bales: {
    obstacles: [
      { kind: "hay", dx: 115, width: 46, height: 30 },
      { kind: "hay", dx: 205, width: 46, height: 30 },
    ],
    crops: [
      { dx: 45, heightAboveGround: 46 },
      { dx: 100, heightAboveGround: 82 },
      { dx: 160, heightAboveGround: 112 },
      { dx: 220, heightAboveGround: 82 },
      { dx: 280, heightAboveGround: 46 },
    ],
  },
};

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function createWorld(width: number, height: number): RunnerWorld {
  const safeWidth = Math.max(MIN_WORLD_WIDTH, Math.round(finiteOr(width, 360)));
  const safeHeight = Math.max(MIN_WORLD_HEIGHT, Math.round(finiteOr(height, 640)));
  return { width: safeWidth, height: safeHeight, groundY: safeHeight - GROUND_MARGIN };
}

function playerX(world: RunnerWorld): number {
  return Math.min(60, world.width * 0.16);
}

function createPlayer(world: RunnerWorld): RunnerPlayer {
  return {
    x: playerX(world),
    y: world.groundY - PLAYER_HEIGHT,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    onGround: true,
    jumpsUsed: 0,
    shieldRemainingMs: 0,
    magnetRemainingMs: 0,
    invulnerableRemainingMs: 0,
  };
}

export function createRunnerInitialState(width = 360, height = 640): RunnerState {
  const world = createWorld(width, height);
  return {
    phase: "preview",
    world,
    countdownRemainingMs: 0,
    activeMs: 0,
    score: 0,
    distance: 0,
    crops: 0,
    combo: 0,
    bestCombo: 0,
    speed: RUNNER_BASE_SPEED,
    player: createPlayer(world),
    obstacles: [],
    pickups: [],
    patterns: [],
    nextEncounterInMs: 900,
    nextEntityId: 1,
    nextPatternId: 1,
    lastEncounter: null,
  };
}

export function resizeRunnerWorld(state: RunnerState, width: number, height: number): RunnerState {
  const world = createWorld(width, height);
  if (world.width === state.world.width && world.height === state.world.height) return state;

  const newPlayerX = playerX(world);
  const xShift = newPlayerX - state.player.x;
  const feetAboveGround = state.world.groundY - (state.player.y + state.player.height);
  const player = {
    ...state.player,
    x: newPlayerX,
    y: world.groundY - state.player.height - feetAboveGround,
  };

  return {
    ...state,
    world,
    player,
    obstacles: state.obstacles.map((obstacle) => ({
      ...obstacle,
      x: obstacle.x + xShift,
      y: world.groundY - obstacle.height - obstacle.groundOffset,
    })),
    pickups: state.pickups.map((pickup) => ({
      ...pickup,
      x: pickup.x + xShift,
      y: pickup.y + (world.groundY - state.world.groundY),
    })),
    patterns: state.patterns.map((pattern) => ({ ...pattern })),
  };
}

export function startRunner(state: RunnerState): RunnerState {
  const fresh = createRunnerInitialState(state.world.width, state.world.height);
  return {
    ...fresh,
    phase: "countdown",
    countdownRemainingMs: RUNNER_COUNTDOWN_MS,
  };
}

export function jumpRunner(state: RunnerState): RunnerState {
  if (state.phase !== "running" || state.player.jumpsUsed >= 2) return state;
  const firstJump = state.player.jumpsUsed === 0;
  return {
    ...state,
    player: {
      ...state.player,
      vy: firstJump ? FIRST_JUMP_VELOCITY : SECOND_JUMP_VELOCITY,
      onGround: false,
      jumpsUsed: state.player.jumpsUsed + 1,
    },
  };
}

export function pauseRunner(state: RunnerState): RunnerState {
  return state.phase === "running" ? { ...state, phase: "paused" } : state;
}

export function resumeRunner(state: RunnerState): RunnerState {
  return state.phase === "paused" ? { ...state, phase: "running" } : state;
}

function safeRandom(random: RunnerRandom): number {
  let value: number;
  try {
    value = random();
  } catch {
    value = 0.5;
  }
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(0.999999999, value));
}

function decrementStepTimer(value: number): number {
  const remaining = value - RUNNER_STEP_MS;
  return remaining <= 0.000001 ? 0 : remaining;
}

function movePlayer(player: RunnerPlayer, groundY: number, dt: number): RunnerPlayer {
  if (player.onGround && player.vy === 0) return { ...player, y: groundY - player.height };

  const vy = player.vy + GRAVITY * dt;
  const y = player.y + vy * dt;
  if (y + player.height >= groundY) {
    return { ...player, y: groundY - player.height, vy: 0, onGround: true, jumpsUsed: 0 };
  }
  return { ...player, y, vy, onGround: false };
}

function circleTouchesPlayer(pickup: RunnerPickup, player: RunnerPlayer): boolean {
  const closestX = Math.max(player.x, Math.min(pickup.x, player.x + player.width));
  const closestY = Math.max(player.y, Math.min(pickup.y, player.y + player.height));
  const dx = pickup.x - closestX;
  const dy = pickup.y - closestY;
  return dx * dx + dy * dy <= pickup.radius * pickup.radius;
}

function withinMagnet(pickup: RunnerPickup, player: RunnerPlayer): boolean {
  const dx = pickup.x - (player.x + player.width / 2);
  const dy = pickup.y - (player.y + player.height / 2);
  return dx * dx + dy * dy <= RUNNER_MAGNET_RADIUS * RUNNER_MAGNET_RADIUS;
}

function obstacleTouchesPlayer(obstacle: RunnerObstacle, player: RunnerPlayer): boolean {
  const insetX = 3;
  const insetY = 2;
  return (
    player.x + insetX < obstacle.x + obstacle.width &&
    player.x + player.width - insetX > obstacle.x &&
    player.y + insetY < obstacle.y + obstacle.height &&
    player.y + player.height > obstacle.y
  );
}

interface PickupResult {
  player: RunnerPlayer;
  pickups: RunnerPickup[];
  patterns: RunnerPatternProgress[];
  score: number;
  crops: number;
  combo: number;
  bestCombo: number;
}

function resolvePickups(
  pickups: RunnerPickup[],
  patterns: RunnerPatternProgress[],
  player: RunnerPlayer,
  score: number,
  crops: number,
  combo: number,
  bestCombo: number,
): PickupResult {
  let nextPlayer = player;
  let nextPatterns = patterns;
  let nextScore = score;
  let nextCrops = crops;
  let nextCombo = combo;
  let nextBestCombo = bestCombo;
  const remaining: RunnerPickup[] = [];

  for (const pickup of pickups) {
    const collected =
      circleTouchesPlayer(pickup, nextPlayer) ||
      (pickup.kind === "crop" && nextPlayer.magnetRemainingMs > 0 && withinMagnet(pickup, nextPlayer));

    if (!collected) {
      if (pickup.x + pickup.radius < 0) {
        if (pickup.kind === "crop" && pickup.patternId !== null) {
          nextCombo = 0;
          nextPatterns = nextPatterns.map((pattern) =>
            pattern.id === pickup.patternId ? { ...pattern, missed: true } : pattern,
          );
        }
      } else {
        remaining.push(pickup);
      }
      continue;
    }

    if (pickup.kind === "shield") {
      nextPlayer = {
        ...nextPlayer,
        shieldRemainingMs: Math.max(
          RUNNER_SHIELD_MIN_MS,
          Math.min(RUNNER_SHIELD_MAX_MS, pickup.durationMs),
        ),
      };
      continue;
    }

    if (pickup.kind === "magnet") {
      nextPlayer = { ...nextPlayer, magnetRemainingMs: RUNNER_MAGNET_MS };
      continue;
    }

    nextCrops += 1;
    nextScore += RUNNER_CROP_SCORE;
    if (pickup.patternId === null) continue;

    const pattern = nextPatterns.find((candidate) => candidate.id === pickup.patternId);
    if (!pattern) continue;
    const collectedInPattern = pattern.collected + 1;
    if (!pattern.missed && collectedInPattern >= pattern.total) {
      nextScore += RUNNER_FULL_PATTERN_BONUS;
      nextCombo += 1;
      nextBestCombo = Math.max(nextBestCombo, nextCombo);
      nextPatterns = nextPatterns.filter((candidate) => candidate.id !== pattern.id);
    } else {
      nextPatterns = nextPatterns.map((candidate) =>
        candidate.id === pattern.id ? { ...candidate, collected: collectedInPattern } : candidate,
      );
    }
  }

  const livePatternIds = new Set(
    remaining
      .filter((pickup) => pickup.kind === "crop" && pickup.patternId !== null)
      .map((pickup) => pickup.patternId as number),
  );
  nextPatterns = nextPatterns.filter((pattern) => livePatternIds.has(pattern.id));

  return {
    player: nextPlayer,
    pickups: remaining,
    patterns: nextPatterns,
    score: nextScore,
    crops: nextCrops,
    combo: nextCombo,
    bestCombo: nextBestCombo,
  };
}

interface CollisionResult {
  player: RunnerPlayer;
  obstacles: RunnerObstacle[];
  hit: boolean;
}

function resolveObstacles(obstacles: RunnerObstacle[], player: RunnerPlayer): CollisionResult {
  let nextPlayer = player;
  const remaining: RunnerObstacle[] = [];

  for (const obstacle of obstacles) {
    if (obstacle.x + obstacle.width < 0) continue;
    if (!obstacleTouchesPlayer(obstacle, nextPlayer)) {
      remaining.push(obstacle);
      continue;
    }

    if (nextPlayer.invulnerableRemainingMs > 0) continue;
    if (nextPlayer.shieldRemainingMs > 0) {
      nextPlayer = {
        ...nextPlayer,
        shieldRemainingMs: 0,
        invulnerableRemainingMs: RUNNER_INVULNERABILITY_MS,
      };
      continue;
    }
    return { player: nextPlayer, obstacles: remaining.concat(obstacle), hit: true };
  }

  return { player: nextPlayer, obstacles: remaining, hit: false };
}

interface SpawnResult {
  obstacles: RunnerObstacle[];
  pickups: RunnerPickup[];
  patterns: RunnerPatternProgress[];
  nextEntityId: number;
  nextPatternId: number;
  encounter: RunnerEncounterKind;
}

function spawnEncounter(state: RunnerState, random: RunnerRandom): SpawnResult {
  const kindIndex = Math.floor(safeRandom(random) * RUNNER_ENCOUNTER_KINDS.length);
  const encounter = RUNNER_ENCOUNTER_KINDS[kindIndex] ?? RUNNER_ENCOUNTER_KINDS[0];
  const template = ENCOUNTER_TEMPLATES[encounter];
  const originX = state.world.width + 40;
  let entityId = state.nextEntityId;
  const patternId = state.nextPatternId;

  const obstacles = template.obstacles.map((item): RunnerObstacle => {
    const groundOffset = item.groundOffset ?? 0;
    return {
      id: entityId++,
      kind: item.kind,
      x: originX + item.dx,
      y: state.world.groundY - item.height - groundOffset,
      width: item.width,
      height: item.height,
      groundOffset,
    };
  });

  const pickups = template.crops.map((item): RunnerPickup => ({
    id: entityId++,
    kind: "crop",
    x: originX + item.dx,
    y: state.world.groundY - item.heightAboveGround,
    radius: 9,
    patternId,
    durationMs: 0,
  }));

  const powerupRoll = safeRandom(random);
  if (powerupRoll < 0.07 && state.player.shieldRemainingMs <= 0) {
    pickups.push({
      id: entityId++,
      kind: "shield",
      x: originX + 330,
      y: state.world.groundY - 58,
      radius: 12,
      patternId: null,
      durationMs:
        RUNNER_SHIELD_MIN_MS + safeRandom(random) * (RUNNER_SHIELD_MAX_MS - RUNNER_SHIELD_MIN_MS),
    });
  } else if (powerupRoll < 0.15) {
    pickups.push({
      id: entityId++,
      kind: "magnet",
      x: originX + 330,
      y: state.world.groundY - 58,
      radius: 12,
      patternId: null,
      durationMs: RUNNER_MAGNET_MS,
    });
  }

  return {
    obstacles,
    pickups,
    patterns: [{ id: patternId, total: template.crops.length, collected: 0, missed: false }],
    nextEntityId: entityId,
    nextPatternId: patternId + 1,
    encounter,
  };
}

function encounterDelay(speed: number, random: RunnerRandom): number {
  const progress = Math.max(0, Math.min(1, (speed - RUNNER_BASE_SPEED) / (RUNNER_MAX_SPEED - RUNNER_BASE_SPEED)));
  const minimum = 1450 - progress * 450;
  const spread = 450 - progress * 50;
  return minimum + safeRandom(random) * spread;
}

/** Advance exactly one fixed simulation step. The renderer owns the real-time accumulator. */
export function stepRunner(state: RunnerState, random: RunnerRandom = Math.random): RunnerState {
  if (state.phase === "preview" || state.phase === "paused" || state.phase === "gameover") return state;

  if (state.phase === "countdown") {
    const countdownRemainingMs = Math.max(0, state.countdownRemainingMs - RUNNER_STEP_MS);
    return {
      ...state,
      phase: countdownRemainingMs <= 0.000001 ? "running" : "countdown",
      countdownRemainingMs,
    };
  }

  const dt = RUNNER_STEP_MS / 1000;
  const speed = Math.min(RUNNER_MAX_SPEED, state.speed + SPEED_GROWTH_PER_SECOND * dt);
  const travel = ((state.speed + speed) / 2) * dt;
  let player: RunnerPlayer = {
    ...state.player,
    shieldRemainingMs: decrementStepTimer(state.player.shieldRemainingMs),
    magnetRemainingMs: decrementStepTimer(state.player.magnetRemainingMs),
    invulnerableRemainingMs: decrementStepTimer(state.player.invulnerableRemainingMs),
  };
  player = movePlayer(player, state.world.groundY, dt);

  const movedPickups = state.pickups.map((pickup) => ({ ...pickup, x: pickup.x - travel }));
  const movedObstacles = state.obstacles.map((obstacle) => ({ ...obstacle, x: obstacle.x - travel }));
  const pickupResult = resolvePickups(
    movedPickups,
    state.patterns.map((pattern) => ({ ...pattern })),
    player,
    state.score + RUNNER_SURVIVAL_SCORE_PER_SECOND * dt,
    state.crops,
    state.combo,
    state.bestCombo,
  );
  const collisionResult = resolveObstacles(movedObstacles, pickupResult.player);

  let nextEncounterInMs = state.nextEncounterInMs - RUNNER_STEP_MS;
  let obstacles = collisionResult.obstacles;
  let pickups = pickupResult.pickups;
  let patterns = pickupResult.patterns;
  let nextEntityId = state.nextEntityId;
  let nextPatternId = state.nextPatternId;
  let lastEncounter = state.lastEncounter;

  if (!collisionResult.hit && nextEncounterInMs <= 0) {
    const spawned = spawnEncounter(
      {
        ...state,
        speed,
        player: collisionResult.player,
        obstacles,
        pickups,
        patterns,
      },
      random,
    );
    obstacles = obstacles.concat(spawned.obstacles);
    pickups = pickups.concat(spawned.pickups);
    patterns = patterns.concat(spawned.patterns);
    nextEntityId = spawned.nextEntityId;
    nextPatternId = spawned.nextPatternId;
    lastEncounter = spawned.encounter;
    nextEncounterInMs += encounterDelay(speed, random);
  }

  return {
    ...state,
    phase: collisionResult.hit ? "gameover" : "running",
    activeMs: state.activeMs + RUNNER_STEP_MS,
    score: pickupResult.score,
    distance: state.distance + travel,
    crops: pickupResult.crops,
    combo: pickupResult.combo,
    bestCombo: pickupResult.bestCombo,
    speed,
    player: collisionResult.player,
    obstacles,
    pickups,
    patterns,
    nextEncounterInMs,
    nextEntityId,
    nextPatternId,
    lastEncounter,
  };
}
