import {
  DEFAULT_ACTION_ARC_RADIUS,
  DEFAULT_ACTION_ARC_ROTATION,
  DEFAULT_ACTION_BACK_ANGLE,
  DEFAULT_ACTION_BUTTON_SCALE,
  DEFAULT_ACTION_FORWARD_ANGLE,
  DEFAULT_ACTION_HEAVY_ANGLE,
  DEFAULT_ACTION_LIGHT_ANGLE,
  DEFAULT_ACTION_LUNGE_ANGLE,
  DEFAULT_ACTION_MEDIUM_ANGLE,
  DEFAULT_ACTION_REST_ANGLE,
  DEFAULT_ACTION_TAUNT_ANGLE,
  DEFAULT_ENEMY_SCALE,
  DEFAULT_ENEMY_STAGE_X,
  DEFAULT_ENEMY_STAGE_Y,
  DEFAULT_PLAYER_SCALE,
  DEFAULT_PLAYER_STAGE_X,
  DEFAULT_PLAYER_STAGE_Y,
  DEFAULT_STAGE_ORIGIN_X,
  DEFAULT_STAGE_ORIGIN_Y,
} from "./arenaLayout";

export const RIG_PART_KEYS = [
  "head",
  "torso",
  "backUpperArm",
  "backForearm",
  "backHand",
  "frontUpperArm",
  "frontForearm",
  "frontHand",
  "backThigh",
  "backShin",
  "backFoot",
  "frontThigh",
  "frontShin",
  "frontFoot",
] as const;

export type RigPartKey = (typeof RIG_PART_KEYS)[number];

export interface RigPartTuning {
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
}

export interface IdleAnimationTuning {
  enabled: boolean;
  duration: number;
  base: Record<RigPartKey, RigPartTuning>;
  breath: Record<RigPartKey, RigPartTuning>;
  activeParts: Record<RigPartKey, boolean>;
}

export interface ArenaDebugTuning {
  showGrid: boolean;
  gridStep: number;
  gridOpacity: number;
  originX: number;
  originY: number;
  playerStageX: number;
  playerStageY: number;
  enemyStageX: number;
  enemyStageY: number;
  playerScale: number;
  enemyScale: number;
  actionArcRotation: number;
  actionArcRadius: number;
  actionButtonScale: number;
  actionForwardArcAngle: number;
  actionBackArcAngle: number;
  actionLungeArcAngle: number;
  actionLightArcAngle: number;
  actionMediumArcAngle: number;
  actionHeavyArcAngle: number;
  actionTauntArcAngle: number;
  actionRestArcAngle: number;
  selectedRigPart: RigPartKey;
  rigParts: Record<RigPartKey, RigPartTuning>;
  idleAnimation: IdleAnimationTuning;
}

export const defaultRigPartTuning: RigPartTuning = {
  x: 0,
  y: 0,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
  flipX: false,
  flipY: false,
};

export const defaultDebugTuning: ArenaDebugTuning = {
  showGrid: true,
  gridStep: 40,
  gridOpacity: 0.22,
  originX: DEFAULT_STAGE_ORIGIN_X,
  originY: DEFAULT_STAGE_ORIGIN_Y,
  playerStageX: DEFAULT_PLAYER_STAGE_X,
  playerStageY: DEFAULT_PLAYER_STAGE_Y,
  enemyStageX: DEFAULT_ENEMY_STAGE_X,
  enemyStageY: DEFAULT_ENEMY_STAGE_Y,
  playerScale: DEFAULT_PLAYER_SCALE,
  enemyScale: DEFAULT_ENEMY_SCALE,
  actionArcRotation: DEFAULT_ACTION_ARC_ROTATION,
  actionArcRadius: DEFAULT_ACTION_ARC_RADIUS,
  actionButtonScale: DEFAULT_ACTION_BUTTON_SCALE,
  actionForwardArcAngle: DEFAULT_ACTION_FORWARD_ANGLE,
  actionBackArcAngle: DEFAULT_ACTION_BACK_ANGLE,
  actionLungeArcAngle: DEFAULT_ACTION_LUNGE_ANGLE,
  actionLightArcAngle: DEFAULT_ACTION_LIGHT_ANGLE,
  actionMediumArcAngle: DEFAULT_ACTION_MEDIUM_ANGLE,
  actionHeavyArcAngle: DEFAULT_ACTION_HEAVY_ANGLE,
  actionTauntArcAngle: DEFAULT_ACTION_TAUNT_ANGLE,
  actionRestArcAngle: DEFAULT_ACTION_REST_ANGLE,
  selectedRigPart: "torso",
  rigParts: createDefaultRigParts(),
  idleAnimation: createDefaultIdleAnimation(),
};

const storageKey = "dust-arena-debug-tuning";
const listeners = new Set<() => void>();

export const debugTuning: ArenaDebugTuning = loadDebugTuning();

export function updateDebugTuning(patch: Partial<ArenaDebugTuning>): void {
  Object.assign(debugTuning, normalizeDebugTuning({ ...debugTuning, ...patch }));
  saveDebugTuning(debugTuning);
  listeners.forEach((listener) => listener());
  dispatchDebugTuningChange();
}

export function resetDebugTuning(): void {
  updateDebugTuning(defaultDebugTuning);
}

export function subscribeDebugTuning(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function normalizeDebugTuning(input: Partial<ArenaDebugTuning>): ArenaDebugTuning {
  return {
    showGrid: typeof input.showGrid === "boolean" ? input.showGrid : defaultDebugTuning.showGrid,
    gridStep: clampNumber(input.gridStep, 10, 100, defaultDebugTuning.gridStep),
    gridOpacity: clampNumber(input.gridOpacity, 0.1, 1, defaultDebugTuning.gridOpacity),
    originX: clampNumber(input.originX, 0, 430, defaultDebugTuning.originX),
    originY: clampNumber(input.originY, 0, 764, defaultDebugTuning.originY),
    playerStageX: clampNumber(input.playerStageX, -600, 600, defaultDebugTuning.playerStageX),
    playerStageY: clampNumber(input.playerStageY, -500, 500, defaultDebugTuning.playerStageY),
    enemyStageX: clampNumber(input.enemyStageX, -600, 600, defaultDebugTuning.enemyStageX),
    enemyStageY: clampNumber(input.enemyStageY, -500, 500, defaultDebugTuning.enemyStageY),
    playerScale: clampNumber(input.playerScale, 0.1, 6, defaultDebugTuning.playerScale),
    enemyScale: clampNumber(input.enemyScale, 0.1, 6, defaultDebugTuning.enemyScale),
    actionArcRotation: clampNumber(input.actionArcRotation, -180, 180, defaultDebugTuning.actionArcRotation),
    actionArcRadius: clampNumber(input.actionArcRadius, 24, 150, defaultDebugTuning.actionArcRadius),
    actionButtonScale: clampNumber(input.actionButtonScale, 0.5, 2, defaultDebugTuning.actionButtonScale),
    actionForwardArcAngle: clampNumber(input.actionForwardArcAngle, -180, 180, defaultDebugTuning.actionForwardArcAngle),
    actionBackArcAngle: clampNumber(input.actionBackArcAngle, -180, 180, defaultDebugTuning.actionBackArcAngle),
    actionLungeArcAngle: clampNumber(input.actionLungeArcAngle, -180, 180, defaultDebugTuning.actionLungeArcAngle),
    actionLightArcAngle: clampNumber(input.actionLightArcAngle, -180, 180, defaultDebugTuning.actionLightArcAngle),
    actionMediumArcAngle: clampNumber(input.actionMediumArcAngle, -180, 180, defaultDebugTuning.actionMediumArcAngle),
    actionHeavyArcAngle: clampNumber(input.actionHeavyArcAngle, -180, 180, defaultDebugTuning.actionHeavyArcAngle),
    actionTauntArcAngle: clampNumber(input.actionTauntArcAngle, -180, 180, defaultDebugTuning.actionTauntArcAngle),
    actionRestArcAngle: clampNumber(input.actionRestArcAngle, -180, 180, defaultDebugTuning.actionRestArcAngle),
    selectedRigPart: isRigPartKey(input.selectedRigPart) ? input.selectedRigPart : defaultDebugTuning.selectedRigPart,
    rigParts: normalizeRigParts(input.rigParts),
    idleAnimation: normalizeIdleAnimation(input.idleAnimation),
  };
}

function createDefaultRigParts(): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...defaultRigPartTuning }])) as Record<RigPartKey, RigPartTuning>;
}

function createDefaultIdleActiveParts(): Record<RigPartKey, boolean> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, true])) as Record<RigPartKey, boolean>;
}

function normalizeRigParts(input: unknown): Record<RigPartKey, RigPartTuning> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<RigPartKey, Partial<RigPartTuning>>>) : {};

  return Object.fromEntries(
    RIG_PART_KEYS.map((key) => {
      const part = source[key] ?? {};

      return [
        key,
        {
          x: clampNumber(part.x, -120, 120, defaultRigPartTuning.x),
          y: clampNumber(part.y, -120, 120, defaultRigPartTuning.y),
          angle: clampNumber(part.angle, -180, 180, defaultRigPartTuning.angle),
          scaleX: clampNumber(part.scaleX, 0.1, 3, defaultRigPartTuning.scaleX),
          scaleY: clampNumber(part.scaleY, 0.1, 3, defaultRigPartTuning.scaleY),
          flipX: typeof part.flipX === "boolean" ? part.flipX : defaultRigPartTuning.flipX,
          flipY: typeof part.flipY === "boolean" ? part.flipY : defaultRigPartTuning.flipY,
        },
      ];
    }),
  ) as Record<RigPartKey, RigPartTuning>;
}

function createDefaultIdleAnimation(): IdleAnimationTuning {
  const base = createDefaultRigParts();
  const breath = createDefaultRigParts();

  breath.torso.y = -4;
  breath.head.y = -2;
  breath.backUpperArm.angle = -2;
  breath.frontUpperArm.angle = 2;
  breath.backForearm.angle = -1;
  breath.frontForearm.angle = 1;

  return {
    enabled: false,
    duration: 900,
    base,
    breath,
    activeParts: createDefaultIdleActiveParts(),
  };
}

function normalizeIdleAnimation(input: unknown): IdleAnimationTuning {
  const source = typeof input === "object" && input !== null ? (input as Partial<IdleAnimationTuning>) : {};

  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : defaultDebugTuning.idleAnimation.enabled,
    duration: clampNumber(source.duration, 240, 2400, defaultDebugTuning.idleAnimation.duration),
    base: normalizeRigParts(source.base),
    breath: normalizeRigParts(source.breath),
    activeParts: normalizeIdleActiveParts(source.activeParts),
  };
}

function normalizeIdleActiveParts(input: unknown): Record<RigPartKey, boolean> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<RigPartKey, boolean>>) : {};

  return Object.fromEntries(
    RIG_PART_KEYS.map((key) => [key, typeof source[key] === "boolean" ? source[key] : true]),
  ) as Record<RigPartKey, boolean>;
}

function isRigPartKey(value: unknown): value is RigPartKey {
  return typeof value === "string" && RIG_PART_KEYS.includes(value as RigPartKey);
}

function loadDebugTuning(): ArenaDebugTuning {
  if (typeof window === "undefined") {
    return { ...defaultDebugTuning };
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return { ...defaultDebugTuning };
  }

  try {
    return normalizeDebugTuning(JSON.parse(raw) as Partial<ArenaDebugTuning>);
  } catch {
    return { ...defaultDebugTuning };
  }
}

function saveDebugTuning(nextTuning: ArenaDebugTuning): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(nextTuning));
}

function dispatchDebugTuningChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("arena-debug-tuning-change"));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, value));
}
