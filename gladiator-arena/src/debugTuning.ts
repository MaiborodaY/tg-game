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

export const BODY_ANIMATION_KEYS = ["idle", "walkCycle", "lunge", "light", "medium", "heavy"] as const;
export type BodyAnimationKey = (typeof BODY_ANIMATION_KEYS)[number];

export const ANIMATION_EDIT_MODES = ["poseA", "poseB", "preview"] as const;
export type AnimationEditMode = (typeof ANIMATION_EDIT_MODES)[number];

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
  characterPreviewFeetX: number;
  characterPreviewFeetY: number;
  selectedRigPart: RigPartKey;
  selectedRigParts: RigPartKey[];
  rigParts: Record<RigPartKey, RigPartTuning>;
  faceParts: Record<FacePartKey, FacePartTuning>;
  animationEditMode: AnimationEditMode;
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
  head: { x: 104, y: 24.867, angle: 32, scaleX: 0.95, scaleY: 0.95, flipX: false, flipY: false },
  torso: { x: 49, y: -0.87, angle: 30, scaleX: 0.98, scaleY: 0.98, flipX: false, flipY: false },
  backUpperArm: { x: 88.601, y: -4.983, angle: 45, scaleX: 1.02, scaleY: 1.02, flipX: false, flipY: false },
  backForearm: { x: 43.497, y: -18.364, angle: 57, scaleX: 1.41, scaleY: 0.99, flipX: false, flipY: false },
  backHand: { x: 9, y: -34, angle: 44, scaleX: 1.18, scaleY: 0.99, flipX: false, flipY: false },
  frontUpperArm: { x: 92.899, y: 50.615, angle: -84, scaleX: 1.07, scaleY: 1.07, flipX: true, flipY: false },
  frontForearm: { x: 165, y: -11, angle: -91, scaleX: 1.41, scaleY: 0.99, flipX: true, flipY: false },
  frontHand: { x: 213, y: -59, angle: -79, scaleX: 1.14, scaleY: 0.95, flipX: true, flipY: false },
  backThigh: { x: 45.813, y: -0.05, angle: 42, scaleX: 1.12, scaleY: 1.13, flipX: true, flipY: false },
  backShin: { x: 1.407, y: 13.449, angle: 55, scaleX: 1.06, scaleY: 1.12, flipX: true, flipY: false },
  backFoot: { x: -75, y: 36, angle: -16, scaleX: 1.15, scaleY: 1.05, flipX: true, flipY: false },
  frontThigh: { x: 32.187, y: 20.95, angle: 34, scaleX: 1.1, scaleY: 1.07, flipX: false, flipY: false },
  frontShin: { x: -13, y: 47, angle: 40, scaleX: 1.1, scaleY: 1.1, flipX: false, flipY: false },
  frontFoot: { x: -68, y: 69.962, angle: 72, scaleX: 1.06, scaleY: 1.06, flipX: false, flipY: false },
};

export const DEFAULT_FACE_PARTS: Record<FacePartKey, FacePartTuning> = {
  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
};

export const DEFAULT_IDLE_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 1430,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -3.786, angle: -25, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -1.89, y: -2.519, angle: 19, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -10.25, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: -0.13, y: -11.571, angle: 3, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -18, angle: 0, scaleX: 0.98, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -13, angle: -2, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -9.379, y: -2.871, angle: -1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 8.721, y: -6.045, angle: -27, scaleX: 1.09, scaleY: 0.89, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -13, angle: 2, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 8.63, y: -2.897, angle: -1, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -7.546, y: -4.701, angle: 21, scaleX: 1.16, scaleY: 0.96, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -10.25, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
    backThigh: true,
    backShin: true,
    backFoot: true,
    frontThigh: true,
    frontShin: true,
    frontFoot: true,
  },
};

export const DEFAULT_WALK_CYCLE_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 420,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -3.786, angle: -25, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -1.89, y: -2.519, angle: 19, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -10.25, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: -0.13, y: -9.571, angle: 9, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.98, scaleY: 0.91, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 20, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -37.35, y: -7.233, angle: 9, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: -28.666, y: -10.012, angle: -5, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 10, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: -1.088, y: -3.62, angle: 19, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -34.026, y: -11.706, angle: 29, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 10, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -8.533, y: 26.963, angle: -1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -24.771, y: 72.088, angle: -20, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: -24, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 23.754, y: 23.864, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 14.504, y: 60.385, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: 1, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 13, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
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

export const DEFAULT_LUNGE_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 700,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -3.786, angle: -25, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -2.973, y: -3.587, angle: 19, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -10.25, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: 185.759, y: 97.602, angle: 60, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 84.87, y: 35, angle: 60, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: 152.841, y: 29.7, angle: -102, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    backForearm: { x: 240.314, y: -56.094, angle: -104, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 304.652, y: -137.066, angle: -115, scaleX: 1.1, scaleY: 0.9, flipX: true, flipY: false },
    frontUpperArm: { x: 154.911, y: 140.792, angle: -85, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 214.996, y: 78.095, angle: -91, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: 268.459, y: 27.093, angle: -66, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 80.05, y: 17.349, angle: 99, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 23.105, y: -30.428, angle: 61, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -42.239, y: -49.867, angle: 39, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: 54.925, y: 60.434, angle: 60, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -5.483, y: 56.762, angle: 75, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -80.708, y: 39.034, angle: 96, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: 1, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 14, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
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

export const DEFAULT_LIGHT_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 240,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -3.786, angle: -25, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -1.89, y: -2.519, angle: 19, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -10.25, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: 18.572, y: -8.766, angle: 5, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 8.541, y: -13.627, angle: 5, scaleX: 0.95, scaleY: 0.91, flipX: false, flipY: false },
    backUpperArm: { x: -3.849, y: 3.77, angle: -55, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: 69.72, y: -14.116, angle: -54, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 128.386, y: -49.581, angle: -80, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 38.399, y: -4.608, angle: 15, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 8.093, y: 3.936, angle: 12, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -19.94, y: -1.423, angle: 34, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 6.893, y: -2.858, angle: 13, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -3.38, y: 26.59, angle: 2, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -25.23, y: 59.615, angle: 1, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: 6.454, y: 2.454, angle: 13, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -11.717, y: 33.911, angle: 16, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -35.996, y: 63.999, angle: 19, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: 2, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 15, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
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
export const DEFAULT_MEDIUM_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 240,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -3.786, angle: -25, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -1.89, y: -2.519, angle: 19, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -10.25, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: -2.11, y: 42.167, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: -1.98, y: 35.595, angle: 3, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -19.03, y: 49.523, angle: -45, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: 41.46, y: 44.881, angle: -119, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 93.21, y: -52.595, angle: -133, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 15.07, y: 46.595, angle: -57, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 64.71, y: 16.571, angle: -66, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: 109.979, y: -15.209, angle: -44, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 4.95, y: 36.119, angle: 39, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -25.71, y: 44.714, angle: -5, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -37.81, y: 76.833, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -6.19, y: 31.238, angle: -33, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 23.48, y: 46.643, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 16.48, y: 76.833, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: 1.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 14.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
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
export const DEFAULT_HEAVY_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 420,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -3.786, angle: -25, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -1.89, y: -2.519, angle: 19, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -10.25, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: -2.11, y: -158.927, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: -1.98, y: -163.356, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -23.98, y: -160.356, angle: -30, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: 19.68, y: -155.237, angle: -119, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 70.44, y: -249.784, angle: -136, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 14.08, y: -153.522, angle: -36, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 46.89, y: -162.07, angle: -54, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: 85.23, y: -179.208, angle: -32, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: -1.98, y: -149.356, angle: 42, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -42.54, y: -143.689, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -55.63, y: -93.022, angle: -36, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -1.24, y: -149.356, angle: -57, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 52.19, y: -152.498, angle: -63, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 105.579, y: -151.593, angle: -27, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: 2.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 15, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
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

export const DEFAULT_BODY_ANIMATIONS: Record<BodyAnimationKey, BodyAnimationTuning> = {
  idle: DEFAULT_IDLE_ANIMATION,
  walkCycle: DEFAULT_WALK_CYCLE_ANIMATION,
  lunge: DEFAULT_LUNGE_ANIMATION,
  light: DEFAULT_LIGHT_ANIMATION,
  medium: DEFAULT_MEDIUM_ANIMATION,
  heavy: DEFAULT_HEAVY_ANIMATION,
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
  characterPreviewFeetX: 215,
  characterPreviewFeetY: 700,
  selectedRigPart: "torso",
  selectedRigParts: ["torso"],
  rigParts: cloneRigParts(DEFAULT_RIG_PARTS),
  faceParts: cloneFaceParts(DEFAULT_FACE_PARTS),
  animationEditMode: "poseA",
  selectedBodyAnimation: "idle",
  bodyAnimations: cloneBodyAnimations(DEFAULT_BODY_ANIMATIONS),
};

const storageKey = "dust-arena-debug-tuning";
const debugUndoLimit = 50;
const listeners = new Set<() => void>();
const debugUndoStack: ArenaDebugTuning[] = [];
let activeDebugUndoGroupSnapshot: ArenaDebugTuning | undefined;

interface DebugTuningUpdateOptions {
  undoable?: boolean;
}

export const debugTuning: ArenaDebugTuning = loadDebugTuning();

export function updateDebugTuning(patch: Partial<ArenaDebugTuning>, options: DebugTuningUpdateOptions = {}): void {
  const nextDebugTuning = normalizeDebugTuning({ ...debugTuning, ...patch });

  if (options.undoable !== false && !activeDebugUndoGroupSnapshot && !areDebugTuningsEqual(debugTuning, nextDebugTuning)) {
    pushDebugUndoSnapshot(cloneDebugTuning(debugTuning));
  }

  Object.assign(debugTuning, nextDebugTuning);
  saveDebugTuning(debugTuning);
  listeners.forEach((listener) => listener());
  dispatchDebugTuningChange();
}

export function resetDebugTuning(): void {
  updateDebugTuning(defaultDebugTuning);
}

export function beginDebugUndoGroup(): void {
  activeDebugUndoGroupSnapshot ??= cloneDebugTuning(debugTuning);
}

export function endDebugUndoGroup(): void {
  if (!activeDebugUndoGroupSnapshot) {
    return;
  }

  const snapshot = activeDebugUndoGroupSnapshot;
  activeDebugUndoGroupSnapshot = undefined;

  if (!areDebugTuningsEqual(snapshot, debugTuning)) {
    pushDebugUndoSnapshot(snapshot);
  }
}

export function undoDebugTuning(): boolean {
  if (activeDebugUndoGroupSnapshot) {
    const snapshot = activeDebugUndoGroupSnapshot;
    activeDebugUndoGroupSnapshot = undefined;

    if (!areDebugTuningsEqual(snapshot, debugTuning)) {
      restoreDebugTuningSnapshot(snapshot);
      return true;
    }
  }

  const snapshot = debugUndoStack.pop();

  if (!snapshot) {
    return false;
  }

  restoreDebugTuningSnapshot(snapshot);
  return true;
}

export function subscribeDebugTuning(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function normalizeDebugTuning(input: Partial<ArenaDebugTuning>): ArenaDebugTuning {
  const legacyIdleAnimation = (input as { idleAnimation?: unknown }).idleAnimation;
  const selectedRigPart = isRigPartKey(input.selectedRigPart) ? input.selectedRigPart : defaultDebugTuning.selectedRigPart;

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
    characterPreviewFeetX: clampNumber(input.characterPreviewFeetX, 0, 430, defaultDebugTuning.characterPreviewFeetX),
    characterPreviewFeetY: clampNumber(input.characterPreviewFeetY, 560, 740, defaultDebugTuning.characterPreviewFeetY),
    selectedRigPart,
    selectedRigParts: normalizeSelectedRigParts(input.selectedRigParts, selectedRigPart),
    rigParts: normalizeRigParts(input.rigParts, DEFAULT_RIG_PARTS),
    faceParts: normalizeFaceParts(input.faceParts, DEFAULT_FACE_PARTS),
    animationEditMode: isAnimationEditMode(input.animationEditMode) ? input.animationEditMode : defaultDebugTuning.animationEditMode,
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

function cloneDebugTuning(source: ArenaDebugTuning): ArenaDebugTuning {
  return {
    ...source,
    selectedRigParts: [...source.selectedRigParts],
    rigParts: cloneRigParts(source.rigParts),
    faceParts: cloneFaceParts(source.faceParts),
    bodyAnimations: cloneBodyAnimations(source.bodyAnimations),
  };
}

function pushDebugUndoSnapshot(snapshot: ArenaDebugTuning): void {
  const previousSnapshot = debugUndoStack[debugUndoStack.length - 1];

  if (previousSnapshot && areDebugTuningsEqual(previousSnapshot, snapshot)) {
    return;
  }

  debugUndoStack.push(cloneDebugTuning(snapshot));

  if (debugUndoStack.length > debugUndoLimit) {
    debugUndoStack.shift();
  }
}

function restoreDebugTuningSnapshot(snapshot: ArenaDebugTuning): void {
  Object.assign(debugTuning, cloneDebugTuning(snapshot));
  saveDebugTuning(debugTuning);
  listeners.forEach((listener) => listener());
  dispatchDebugTuningChange();
}

function areDebugTuningsEqual(left: ArenaDebugTuning, right: ArenaDebugTuning): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeSelectedRigParts(input: unknown, fallback: RigPartKey): RigPartKey[] {
  if (!Array.isArray(input)) {
    return [fallback];
  }

  const selectedParts: RigPartKey[] = [];

  input.forEach((value) => {
    if (isRigPartKey(value) && !selectedParts.includes(value)) {
      selectedParts.push(value);
    }
  });

  return selectedParts;
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
          x: clampNumber(part.x, -480, 480, fallback.x),
          y: clampNumber(part.y, -480, 480, fallback.y),
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

function createDefaultLightAnimation(): BodyAnimationTuning {
  return createDefaultAttackAnimation(260, 0.62);
}

function createDefaultMediumAnimation(): BodyAnimationTuning {
  return createDefaultAttackAnimation(320, 0.9);
}

function createDefaultHeavyAnimation(): BodyAnimationTuning {
  return createDefaultAttackAnimation(420, 1.18);
}

function createDefaultAttackAnimation(duration: number, power: number): BodyAnimationTuning {
  const base = cloneRigParts(DEFAULT_RIG_PARTS);
  const breath = cloneRigParts(DEFAULT_RIG_PARTS);
  const faceBase = cloneFaceParts(DEFAULT_FACE_PARTS);
  const faceBreath = cloneFaceParts(DEFAULT_FACE_PARTS);

  breath.head.x += 6 * power;
  breath.head.y -= 2 * power;
  breath.head.angle += 6 * power;
  breath.torso.x += 8 * power;
  breath.torso.y -= 4 * power;
  breath.torso.angle += 9 * power;
  breath.frontUpperArm.x += 8 * power;
  breath.frontUpperArm.y -= 8 * power;
  breath.frontUpperArm.angle -= 32 * power;
  breath.frontForearm.x += 24 * power;
  breath.frontForearm.y -= 6 * power;
  breath.frontForearm.angle -= 42 * power;
  breath.frontHand.x += 42 * power;
  breath.frontHand.y -= 12 * power;
  breath.frontHand.angle -= 34 * power;
  breath.backUpperArm.x -= 5 * power;
  breath.backUpperArm.y += 2 * power;
  breath.backUpperArm.angle += 12 * power;
  breath.backForearm.x -= 8 * power;
  breath.backForearm.y += 3 * power;
  breath.backForearm.angle -= 12 * power;
  breath.backHand.x -= 10 * power;
  breath.backHand.angle -= 8 * power;
  breath.frontThigh.x += 4 * power;
  breath.frontThigh.angle -= 5 * power;
  breath.backThigh.x -= 3 * power;
  breath.backThigh.angle += 4 * power;
  faceBreath.eyeLeft.x += 4 * power;
  faceBreath.eyeRight.x += 4 * power;

  return {
    enabled: true,
    duration,
    base,
    breath,
    faceBase,
    faceBreath,
    activeParts: createUpperBodyAttackActiveParts(),
  };
}

function createUpperBodyAttackActiveParts(): Record<RigPartKey, boolean> {
  return {
    head: true,
    torso: true,
    backUpperArm: true,
    backForearm: true,
    backHand: true,
    frontUpperArm: true,
    frontForearm: true,
    frontHand: true,
    backThigh: true,
    backShin: false,
    backFoot: false,
    frontThigh: true,
    frontShin: false,
    frontFoot: false,
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

function isAnimationEditMode(value: unknown): value is AnimationEditMode {
  return typeof value === "string" && ANIMATION_EDIT_MODES.includes(value as AnimationEditMode);
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
