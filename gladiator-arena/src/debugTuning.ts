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

export const BODY_ANIMATION_KEYS = ["idle", "walkCycle", "lunge"] as const;
export type BodyAnimationKey = (typeof BODY_ANIMATION_KEYS)[number];

export const FACE_PART_KEYS = ["eyeLeft", "eyeRight"] as const;
export type FacePartKey = (typeof FACE_PART_KEYS)[number];

export interface RigPartTuning {
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
}

export interface FacePartTuning {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

export interface BodyAnimationTuning {
  enabled: boolean;
  duration: number;
  base: Record<RigPartKey, RigPartTuning>;
  breath: Record<RigPartKey, RigPartTuning>;
  faceBase: Record<FacePartKey, FacePartTuning>;
  faceBreath: Record<FacePartKey, FacePartTuning>;
  activeParts: Record<RigPartKey, boolean>;
}

export type IdleAnimationTuning = BodyAnimationTuning;

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
  characterPreviewScale: number;
  characterPreviewFeetY: number;
  selectedRigPart: RigPartKey;
  rigParts: Record<RigPartKey, RigPartTuning>;
  faceParts: Record<FacePartKey, FacePartTuning>;
  selectedBodyAnimation: BodyAnimationKey;
  bodyAnimations: Record<BodyAnimationKey, BodyAnimationTuning>;
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

export const defaultFacePartTuning: FacePartTuning = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
};

export const DEFAULT_RIG_PARTS: Record<RigPartKey, RigPartTuning> = {
  head: { x: 0, y: -3, angle: 2, scaleX: 0.95, scaleY: 0.95, flipX: false, flipY: false },
  torso: { x: 0, y: -14, angle: 0, scaleX: 0.98, scaleY: 0.98, flipX: false, flipY: false },
  backUpperArm: { x: -10, y: -3, angle: 0, scaleX: 1.02, scaleY: 1.02, flipX: false, flipY: false },
  backForearm: { x: -1, y: 11, angle: -5, scaleX: 1.41, scaleY: 0.99, flipX: false, flipY: false },
  backHand: { x: 23, y: 5, angle: -28, scaleX: 1.18, scaleY: 0.99, flipX: false, flipY: false },
  frontUpperArm: { x: 10, y: 0, angle: 0, scaleX: 1.07, scaleY: 1.07, flipX: true, flipY: false },
  frontForearm: { x: -1, y: 14, angle: 6, scaleX: 1.41, scaleY: 0.99, flipX: true, flipY: false },
  frontHand: { x: -25, y: 5, angle: 34, scaleX: 1.14, scaleY: 0.95, flipX: true, flipY: false },
  backThigh: { x: 4, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
  backShin: { x: 7, y: 34, angle: 0, scaleX: 0.88, scaleY: 1, flipX: true, flipY: false },
  backFoot: { x: -17, y: 69, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
  frontThigh: { x: -4, y: 0, angle: -8, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  frontShin: { x: 1, y: 30, angle: 10, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  frontFoot: { x: -18, y: 67, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
};

export const DEFAULT_FACE_PARTS: Record<FacePartKey, FacePartTuning> = {
  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
};

export const DEFAULT_IDLE_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 2400,
  base: {
    head: { x: -1, y: -10, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.95, scaleY: 0.95, flipX: false, flipY: false },
    backUpperArm: { x: -10, y: -3, angle: 0, scaleX: 0.95, scaleY: 0.95, flipX: false, flipY: false },
    backForearm: { x: -1, y: 11, angle: 1, scaleX: 1.41, scaleY: 0.99, flipX: false, flipY: false },
    backHand: { x: 17, y: 4, angle: -28, scaleX: 1.18, scaleY: 0.99, flipX: false, flipY: false },
    frontUpperArm: { x: 10, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontForearm: { x: -1, y: 14, angle: 0, scaleX: 1.41, scaleY: 0.99, flipX: true, flipY: false },
    frontHand: { x: -18, y: 3, angle: 19, scaleX: 1.14, scaleY: 0.95, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backShin: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backFoot: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontThigh: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: 0, y: -3, angle: 2, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    torso: { x: 0, y: -8, angle: 0, scaleX: 0.95, scaleY: 0.95, flipX: false, flipY: false },
    backUpperArm: { x: -10, y: -3, angle: 0, scaleX: 1.02, scaleY: 1.02, flipX: false, flipY: false },
    backForearm: { x: -1, y: 11, angle: -5, scaleX: 1.41, scaleY: 0.99, flipX: false, flipY: false },
    backHand: { x: 23, y: 5, angle: -28, scaleX: 1.18, scaleY: 0.99, flipX: false, flipY: false },
    frontUpperArm: { x: 10, y: 0, angle: 0, scaleX: 1.07, scaleY: 1.07, flipX: true, flipY: false },
    frontForearm: { x: -1, y: 14, angle: 6, scaleX: 1.41, scaleY: 0.99, flipX: true, flipY: false },
    frontHand: { x: -25, y: 5, angle: 34, scaleX: 1.14, scaleY: 0.95, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backShin: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backFoot: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontThigh: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  activeParts: {
    head: true,
    torso: true,
    backUpperArm: true,
    backForearm: true,
    backHand: true,
    frontUpperArm: true,
    frontForearm: true,
    frontHand: true,
    backThigh: false,
    backShin: false,
    backFoot: false,
    frontThigh: false,
    frontShin: false,
    frontFoot: false,
  },
};

export const DEFAULT_WALK_CYCLE_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 380,
  base: {
    head: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    torso: { x: 0, y: 0, angle: 0, scaleX: 0.95, scaleY: 0.95, flipX: false, flipY: false },
    backUpperArm: { x: -10, y: -3, angle: 0, scaleX: 1.02, scaleY: 1.02, flipX: false, flipY: false },
    backForearm: { x: -1, y: 11, angle: -5, scaleX: 1.41, scaleY: 0.99, flipX: false, flipY: false },
    backHand: { x: 23, y: 5, angle: -21, scaleX: 1.14, scaleY: 0.95, flipX: false, flipY: false },
    frontUpperArm: { x: 10, y: 0, angle: 0, scaleX: 1.07, scaleY: 1.07, flipX: true, flipY: false },
    frontForearm: { x: -1, y: 14, angle: 6, scaleX: 1.41, scaleY: 0.99, flipX: true, flipY: false },
    frontHand: { x: -25, y: 5, angle: 34, scaleX: 1.14, scaleY: 0.95, flipX: true, flipY: false },
    backThigh: { x: 4, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 7, y: 34, angle: 0, scaleX: 0.88, scaleY: 1, flipX: true, flipY: false },
    backFoot: { x: -17, y: 69, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -4, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -6, y: 30, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -13, y: 67, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: 5, y: -1, angle: 8, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    torso: { x: -5, y: 0, angle: 5, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backUpperArm: { x: -10, y: -3, angle: 8, scaleX: 1.02, scaleY: 1.02, flipX: false, flipY: false },
    backForearm: { x: -10, y: 10, angle: -11, scaleX: 1.41, scaleY: 0.99, flipX: false, flipY: false },
    backHand: { x: 21, y: 3, angle: -34, scaleX: 1.14, scaleY: 0.95, flipX: false, flipY: false },
    frontUpperArm: { x: 10, y: 0, angle: 7, scaleX: 1.07, scaleY: 1.07, flipX: true, flipY: false },
    frontForearm: { x: -10, y: 18, angle: 11, scaleX: 1.41, scaleY: 0.99, flipX: true, flipY: false },
    frontHand: { x: -40, y: 10, angle: 44, scaleX: 1.14, scaleY: 0.95, flipX: true, flipY: false },
    backThigh: { x: 4, y: 0, angle: 8, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -3, y: 29, angle: 15, scaleX: 0.88, scaleY: 1, flipX: true, flipY: false },
    backFoot: { x: -42, y: 62, angle: -2, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -1, y: 0, angle: -18, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 14, y: 25, angle: 5, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 1, y: 64, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: 1.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 12, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  activeParts: {
    head: true,
    torso: true,
    backUpperArm: true,
    backForearm: true,
    backHand: true,
    frontUpperArm: true,
    frontForearm: true,
    frontHand: true,
    backThigh: true,
    backShin: true,
    backFoot: true,
    frontThigh: true,
    frontShin: true,
    frontFoot: true,
  },
};

export const DEFAULT_LUNGE_ANIMATION: BodyAnimationTuning = createDefaultLungeAnimation();

export const DEFAULT_BODY_ANIMATIONS: Record<BodyAnimationKey, BodyAnimationTuning> = {
  idle: DEFAULT_IDLE_ANIMATION,
  walkCycle: DEFAULT_WALK_CYCLE_ANIMATION,
  lunge: DEFAULT_LUNGE_ANIMATION,
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
  characterPreviewScale: 1.8,
  characterPreviewFeetY: 700,
  selectedRigPart: "torso",
  rigParts: cloneRigParts(DEFAULT_RIG_PARTS),
  faceParts: cloneFaceParts(DEFAULT_FACE_PARTS),
  selectedBodyAnimation: "idle",
  bodyAnimations: cloneBodyAnimations(DEFAULT_BODY_ANIMATIONS),
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
  const legacyIdleAnimation = (input as { idleAnimation?: unknown }).idleAnimation;

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
    characterPreviewScale: clampNumber(input.characterPreviewScale, 1, 2.6, defaultDebugTuning.characterPreviewScale),
    characterPreviewFeetY: clampNumber(input.characterPreviewFeetY, 560, 740, defaultDebugTuning.characterPreviewFeetY),
    selectedRigPart: isRigPartKey(input.selectedRigPart) ? input.selectedRigPart : defaultDebugTuning.selectedRigPart,
    rigParts: normalizeRigParts(input.rigParts, DEFAULT_RIG_PARTS),
    faceParts: normalizeFaceParts(input.faceParts, DEFAULT_FACE_PARTS),
    selectedBodyAnimation: isBodyAnimationKey(input.selectedBodyAnimation) ? input.selectedBodyAnimation : defaultDebugTuning.selectedBodyAnimation,
    bodyAnimations: normalizeBodyAnimations(input.bodyAnimations, legacyIdleAnimation),
  };
}

function createDefaultRigParts(): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...defaultRigPartTuning }])) as Record<RigPartKey, RigPartTuning>;
}

function cloneRigParts(source: Record<RigPartKey, RigPartTuning>): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<RigPartKey, RigPartTuning>;
}

function cloneFaceParts(source: Record<FacePartKey, FacePartTuning>): Record<FacePartKey, FacePartTuning> {
  return Object.fromEntries(FACE_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<FacePartKey, FacePartTuning>;
}

function cloneBodyAnimations(source: Record<BodyAnimationKey, BodyAnimationTuning>): Record<BodyAnimationKey, BodyAnimationTuning> {
  return Object.fromEntries(BODY_ANIMATION_KEYS.map((key) => [key, cloneBodyAnimation(source[key])])) as Record<BodyAnimationKey, BodyAnimationTuning>;
}

function cloneBodyAnimation(source: BodyAnimationTuning): BodyAnimationTuning {
  return {
    enabled: source.enabled,
    duration: source.duration,
    base: cloneRigParts(source.base),
    breath: cloneRigParts(source.breath),
    faceBase: cloneFaceParts(source.faceBase),
    faceBreath: cloneFaceParts(source.faceBreath),
    activeParts: cloneIdleActiveParts(source.activeParts),
  };
}

function cloneIdleAnimation(source: BodyAnimationTuning): BodyAnimationTuning {
  return cloneBodyAnimation(source);
}

function cloneIdleActiveParts(source: Record<RigPartKey, boolean>): Record<RigPartKey, boolean> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, source[key]])) as Record<RigPartKey, boolean>;
}

function createDefaultIdleActiveParts(): Record<RigPartKey, boolean> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, true])) as Record<RigPartKey, boolean>;
}

function normalizeRigParts(input: unknown, fallbackParts = createDefaultRigParts()): Record<RigPartKey, RigPartTuning> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<RigPartKey, Partial<RigPartTuning>>>) : {};

  return Object.fromEntries(
    RIG_PART_KEYS.map((key) => {
      const part = source[key] ?? {};
      const fallback = fallbackParts[key] ?? defaultRigPartTuning;

      return [
        key,
        {
          x: clampNumber(part.x, -120, 120, fallback.x),
          y: clampNumber(part.y, -120, 120, fallback.y),
          angle: clampNumber(part.angle, -180, 180, fallback.angle),
          scaleX: clampNumber(part.scaleX, 0.1, 3, fallback.scaleX),
          scaleY: clampNumber(part.scaleY, 0.1, 3, fallback.scaleY),
          flipX: typeof part.flipX === "boolean" ? part.flipX : fallback.flipX,
          flipY: typeof part.flipY === "boolean" ? part.flipY : fallback.flipY,
        },
      ];
    }),
  ) as Record<RigPartKey, RigPartTuning>;
}

function normalizeFaceParts(input: unknown, fallbackParts = DEFAULT_FACE_PARTS): Record<FacePartKey, FacePartTuning> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<FacePartKey, Partial<FacePartTuning>>>) : {};

  return Object.fromEntries(
    FACE_PART_KEYS.map((key) => {
      const part = source[key] ?? {};
      const fallback = fallbackParts[key] ?? defaultFacePartTuning;

      return [
        key,
        {
          x: clampNumber(part.x, -40, 40, fallback.x),
          y: clampNumber(part.y, -40, 40, fallback.y),
          scaleX: clampNumber(part.scaleX, 0.1, 3, fallback.scaleX),
          scaleY: clampNumber(part.scaleY, 0.1, 3, fallback.scaleY),
        },
      ];
    }),
  ) as Record<FacePartKey, FacePartTuning>;
}

function createDefaultIdleAnimation(): BodyAnimationTuning {
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
    faceBase: cloneFaceParts(DEFAULT_FACE_PARTS),
    faceBreath: cloneFaceParts(DEFAULT_FACE_PARTS),
    activeParts: createDefaultIdleActiveParts(),
  };
}

function createDefaultWalkCycleAnimation(): BodyAnimationTuning {
  const base = cloneRigParts(DEFAULT_RIG_PARTS);
  const breath = cloneRigParts(DEFAULT_RIG_PARTS);

  breath.torso.y -= 3;
  breath.torso.angle = 2;
  breath.head.y -= 2;
  breath.backUpperArm.angle -= 7;
  breath.backForearm.angle += 7;
  breath.backHand.x += 4;
  breath.frontUpperArm.angle += 7;
  breath.frontForearm.angle -= 7;
  breath.frontHand.x -= 4;
  breath.backThigh.angle += 8;
  breath.backShin.angle -= 10;
  breath.backFoot.x += 6;
  breath.frontThigh.angle -= 8;
  breath.frontShin.angle += 10;
  breath.frontFoot.x -= 6;

  return {
    enabled: false,
    duration: 620,
    base,
    breath,
    faceBase: cloneFaceParts(DEFAULT_FACE_PARTS),
    faceBreath: cloneFaceParts(DEFAULT_FACE_PARTS),
    activeParts: createDefaultIdleActiveParts(),
  };
}

function createDefaultLungeAnimation(): BodyAnimationTuning {
  const base = cloneRigParts(DEFAULT_RIG_PARTS);
  const breath = cloneRigParts(DEFAULT_RIG_PARTS);
  const faceBase = cloneFaceParts(DEFAULT_FACE_PARTS);
  const faceBreath = cloneFaceParts(DEFAULT_FACE_PARTS);

  breath.head.x += 8;
  breath.head.y -= 5;
  breath.head.angle = 8;
  breath.torso.x += 8;
  breath.torso.y -= 7;
  breath.torso.angle = 11;
  breath.frontUpperArm.x += 5;
  breath.frontUpperArm.y -= 6;
  breath.frontUpperArm.angle = -20;
  breath.frontForearm.x += 22;
  breath.frontForearm.y -= 4;
  breath.frontForearm.angle = -28;
  breath.frontHand.x += 38;
  breath.frontHand.y -= 8;
  breath.frontHand.angle = -16;
  breath.backUpperArm.x -= 8;
  breath.backUpperArm.y += 1;
  breath.backUpperArm.angle = 16;
  breath.backForearm.x -= 12;
  breath.backForearm.y += 3;
  breath.backForearm.angle = -18;
  breath.backHand.x -= 14;
  breath.backHand.y += 2;
  breath.backHand.angle = -38;
  breath.frontThigh.x += 16;
  breath.frontThigh.y -= 2;
  breath.frontThigh.angle = -30;
  breath.frontShin.x += 28;
  breath.frontShin.y -= 7;
  breath.frontShin.angle = 18;
  breath.frontFoot.x += 35;
  breath.frontFoot.y -= 5;
  breath.frontFoot.angle = 4;
  breath.backThigh.x -= 12;
  breath.backThigh.y += 2;
  breath.backThigh.angle = 18;
  breath.backShin.x -= 14;
  breath.backShin.y += 1;
  breath.backShin.angle = -18;
  breath.backFoot.x -= 18;
  breath.backFoot.y += 1;
  breath.backFoot.angle = -8;
  faceBreath.eyeLeft.x += 7;
  faceBreath.eyeRight.x += 7;

  return {
    enabled: true,
    duration: 320,
    base,
    breath,
    faceBase,
    faceBreath,
    activeParts: createDefaultIdleActiveParts(),
  };
}

function normalizeBodyAnimations(input: unknown, legacyIdleAnimation?: unknown): Record<BodyAnimationKey, BodyAnimationTuning> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<BodyAnimationKey, unknown>>) : {};

  return Object.fromEntries(
    BODY_ANIMATION_KEYS.map((key) => {
      const fallback = DEFAULT_BODY_ANIMATIONS[key];
      const candidate = source[key] ?? (key === "idle" ? legacyIdleAnimation : undefined);

      return [key, normalizeBodyAnimation(candidate, fallback)];
    }),
  ) as Record<BodyAnimationKey, BodyAnimationTuning>;
}

function normalizeBodyAnimation(input: unknown, fallback = DEFAULT_IDLE_ANIMATION): BodyAnimationTuning {
  const source = typeof input === "object" && input !== null ? (input as Partial<BodyAnimationTuning>) : {};

  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : fallback.enabled,
    duration: clampNumber(source.duration, 240, 2400, fallback.duration),
    base: normalizeRigParts(source.base, fallback.base),
    breath: normalizeRigParts(source.breath, fallback.breath),
    faceBase: normalizeFaceParts(source.faceBase, fallback.faceBase),
    faceBreath: normalizeFaceParts(source.faceBreath, fallback.faceBreath),
    activeParts: normalizeIdleActiveParts(source.activeParts, fallback.activeParts),
  };
}

function normalizeIdleAnimation(input: unknown, fallback = DEFAULT_IDLE_ANIMATION): BodyAnimationTuning {
  return normalizeBodyAnimation(input, fallback);
}

function normalizeIdleActiveParts(input: unknown, fallback = createDefaultIdleActiveParts()): Record<RigPartKey, boolean> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<RigPartKey, boolean>>) : {};

  return Object.fromEntries(
    RIG_PART_KEYS.map((key) => [key, typeof source[key] === "boolean" ? source[key] : fallback[key]]),
  ) as Record<RigPartKey, boolean>;
}

function isRigPartKey(value: unknown): value is RigPartKey {
  return typeof value === "string" && RIG_PART_KEYS.includes(value as RigPartKey);
}

function isBodyAnimationKey(value: unknown): value is BodyAnimationKey {
  return typeof value === "string" && BODY_ANIMATION_KEYS.includes(value as BodyAnimationKey);
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
