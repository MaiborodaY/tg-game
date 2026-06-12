import {
  DEFAULT_ACTION_ARC_OFFSET_X,
  DEFAULT_ACTION_ARC_OFFSET_Y,
  DEFAULT_ACTION_ARC_RADIUS,
  DEFAULT_ACTION_ARC_ROTATION,
  DEFAULT_ACTION_ATTACK_ICON_SCALE,
  DEFAULT_ACTION_BACK_ANGLE,
  DEFAULT_ACTION_BUTTON_SCALE,
  DEFAULT_ARENA_BACK_FOLLOW_X,
  DEFAULT_ARENA_BACK_FOLLOW_Y,
  DEFAULT_ARENA_BACK_LOOK_UP_Y,
  DEFAULT_ARENA_BACK_ZOOM,
  DEFAULT_ARENA_GROUND_FOLLOW_X,
  DEFAULT_ARENA_GROUND_FOLLOW_Y,
  DEFAULT_ARENA_GROUND_LOOK_UP_Y,
  DEFAULT_ARENA_GROUND_ZOOM,
  DEFAULT_ARENA_MID_FOLLOW_X,
  DEFAULT_ARENA_MID_FOLLOW_Y,
  DEFAULT_ARENA_MID_LOOK_UP_Y,
  DEFAULT_ARENA_MID_ZOOM,
  DEFAULT_ARENA_MID_ZOOM_DARKEN,
  DEFAULT_BACK_MOVE_DISTANCE,
  DEFAULT_CAMERA_CLOSE_FEET_SHIFT_Y,
  DEFAULT_CAMERA_FEET_MIN_SCREEN_RATIO,
  DEFAULT_CAMERA_FEET_SCREEN_Y,
  DEFAULT_ACTION_FORWARD_ANGLE,
  DEFAULT_ACTION_HEAVY_ANGLE,
  DEFAULT_ACTION_HEAVY_ICON_BRIGHTNESS,
  DEFAULT_ACTION_HEAVY_ICON_ROTATION,
  DEFAULT_ACTION_HEAVY_ICON_SCALE,
  DEFAULT_ACTION_ICON_SCALE,
  DEFAULT_ACTION_LIGHT_ANGLE,
  DEFAULT_ACTION_LIGHT_ICON_BRIGHTNESS,
  DEFAULT_ACTION_LIGHT_ICON_ROTATION,
  DEFAULT_ACTION_LIGHT_ICON_SCALE,
  DEFAULT_ACTION_LUNGE_ANGLE,
  DEFAULT_ACTION_MEDIUM_ANGLE,
  DEFAULT_ACTION_MEDIUM_ICON_BRIGHTNESS,
  DEFAULT_ACTION_MEDIUM_ICON_ROTATION,
  DEFAULT_ACTION_MEDIUM_ICON_SCALE,
  DEFAULT_ACTION_REST_ANGLE,
  DEFAULT_ACTION_TAUNT_ANGLE,
  DEFAULT_ACTION_TOKEN_FACE_INSET,
  DEFAULT_ACTION_TOKEN_FACE_SHINE,
  DEFAULT_ACTION_TOKEN_INNER_SHINE,
  DEFAULT_ACTION_TOKEN_OUTER_SHINE,
  DEFAULT_ACTION_TOKEN_RING_WIDTH,
  DEFAULT_ACTION_TOKEN_RIM_SHINE,
  DEFAULT_ACTION_TOKEN_STRIPE_SHINE,
  DEFAULT_CLASSIC_HUD_OFFSET_X,
  DEFAULT_CLASSIC_HUD_OFFSET_Y,
  DEFAULT_CLASSIC_HUD_SAFE_OFFSET,
  DEFAULT_CLASSIC_HUD_SCALE,
  DEFAULT_ENEMY_SCALE,
  DEFAULT_ENEMY_STAGE_X,
  DEFAULT_ENEMY_STAGE_Y,
  DEFAULT_FIGHTER_HUD_GAP,
  DEFAULT_FORWARD_MOVE_DISTANCE,
  DEFAULT_HUD_BOTTOM_OFFSET,
  DEFAULT_HUD_FLASK_GAP,
  DEFAULT_HUD_NAME_GAP,
  DEFAULT_HUD_SAFE_GAP_RATIO,
  DEFAULT_HUD_SAFE_MIN_GAP,
  DEFAULT_HUD_SCALE,
  DEFAULT_HUD_SIDE_INSET,
  DEFAULT_LUNGE_MOVE_DISTANCE,
  DEFAULT_PLAYER_SCALE,
  DEFAULT_PLAYER_STAGE_X,
  DEFAULT_PLAYER_STAGE_Y,
  DEFAULT_STAGE_ORIGIN_X,
  DEFAULT_STAGE_ORIGIN_Y,
} from "./arenaLayout";
import { DEFAULT_PLAYER_HUD_MODE, type PlayerHudMode } from "./settingsMenu";

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

export const BODY_ANIMATION_KEYS = ["idle", "walkCycle", "lunge", "light", "medium", "heavy", "bowShot", "hit", "block", "taunt", "rest"] as const;
export type BodyAnimationKey = (typeof BODY_ANIMATION_KEYS)[number];

export const SLASH_ARC_ATTACK_KEYS = ["light", "medium", "heavy"] as const;
export type SlashArcAttackKey = (typeof SLASH_ARC_ATTACK_KEYS)[number];

export type DebugPopupPreviewKind = "all" | "damage" | "block" | "armorAbsorb" | "armorBreak";

export const ACTION_BUTTON_OFFSET_KEYS = ["forward", "back", "lunge", "light", "medium", "heavy", "taunt", "rest"] as const;
export type ActionButtonOffsetKey = (typeof ACTION_BUTTON_OFFSET_KEYS)[number];

export const CLASSIC_ACTION_WHEEL_MODES = ["distance", "clinch", "bowDistance"] as const;
export type ClassicActionWheelMode = (typeof CLASSIC_ACTION_WHEEL_MODES)[number];

export const CLASSIC_ACTION_WHEEL_BUTTONS: Record<ClassicActionWheelMode, ActionButtonOffsetKey[]> = {
  distance: ["forward", "lunge", "back", "taunt", "rest"],
  clinch: ["light", "medium", "heavy", "back", "taunt", "rest"],
  bowDistance: ["light", "medium", "heavy", "back", "taunt", "rest"],
};

export const ANIMATION_EDIT_MODES = ["poseA", "poseB", "preview"] as const;
export type AnimationEditMode = (typeof ANIMATION_EDIT_MODES)[number];

export const CHARACTER_CANVAS_EDIT_MODES = ["parts", "equipment"] as const;
export type CharacterCanvasEditMode = (typeof CHARACTER_CANVAS_EDIT_MODES)[number];

export const FACE_PART_KEYS = ["eyeLeft", "eyeRight"] as const;
export type FacePartKey = (typeof FACE_PART_KEYS)[number];

export const EQUIPMENT_SLOT_KEYS = [
  "weaponMain",
  "helmet",
  "breastplate",
  "backShoulderguard",
  "frontShoulderguard",
  "backWrist",
  "frontWrist",
  "backGlove",
  "frontGlove",
  "backGreave",
  "frontGreave",
  "backShinguard",
  "frontShinguard",
  "backBoot",
  "frontBoot",
] as const;
export type EquipmentSlotKey = (typeof EQUIPMENT_SLOT_KEYS)[number];

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

export type EquipmentTuning = RigPartTuning;

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

export interface SlashArcTuning {
  radius: number;
  width: number;
  color: number;
  alpha: number;
  duration: number;
  offsetX: number;
  offsetY: number;
  startAngle: number;
  endAngle: number;
  angle: number;
  sweep: number;
}

export interface ActionButtonOffsetTuning {
  x: number;
  y: number;
}

export interface ClassicActionButtonSlotTuning {
  x: number;
  y: number;
  rotation: number;
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
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowScaleX: number;
  shadowScaleY: number;
  shadowAlpha: number;
  shadowBlur: number;
  cameraFeetScreenY: number;
  cameraCloseFeetShiftY: number;
  cameraFeetMinScreenRatio: number;
  arenaBackFollowX: number;
  arenaBackFollowY: number;
  arenaBackZoom: number;
  arenaBackLookUpY: number;
  arenaMidFollowX: number;
  arenaMidFollowY: number;
  arenaMidZoom: number;
  arenaMidLookUpY: number;
  arenaMidZoomDarken: number;
  arenaGroundFollowX: number;
  arenaGroundFollowY: number;
  arenaGroundZoom: number;
  arenaGroundLookUpY: number;
  actionArcEditMode: boolean;
  actionArcRotation: number;
  actionArcRadius: number;
  actionArcOffsetX: number;
  actionArcOffsetY: number;
  actionButtonScale: number;
  actionIconScale: number;
  actionAttackIconScale: number;
  actionLightIconScale: number;
  actionMediumIconScale: number;
  actionHeavyIconScale: number;
  actionLightIconRotation: number;
  actionMediumIconRotation: number;
  actionHeavyIconRotation: number;
  actionLightIconBrightness: number;
  actionMediumIconBrightness: number;
  actionHeavyIconBrightness: number;
  actionTokenRingWidth: number;
  actionTokenFaceInset: number;
  actionTokenRimShine: number;
  actionTokenOuterShine: number;
  actionTokenFaceShine: number;
  actionTokenInnerShine: number;
  actionTokenStripeShine: number;
  actionButtonOffsets: Record<ActionButtonOffsetKey, ActionButtonOffsetTuning>;
  selectedClassicActionWheelMode: ClassicActionWheelMode;
  selectedClassicActionButton: ActionButtonOffsetKey;
  classicActionButtonSlots: Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>>;
  classicHudEditMode: boolean;
  classicHudOffsetX: number;
  classicHudOffsetY: number;
  classicHudScale: number;
  classicHudSafeOffset: number;
  hudMode: PlayerHudMode;
  hudEditMode: boolean;
  hudBottomOffset: number;
  hudSideInset: number;
  hudScale: number;
  hudFlaskGap: number;
  hudNameGap: number;
  hudSafeGapRatio: number;
  hudSafeMinGap: number;
  fighterHudGap: number;
  forwardMoveDistance: number;
  backMoveDistance: number;
  lungeMoveDistance: number;
  actionForwardArcAngle: number;
  actionBackArcAngle: number;
  actionLungeArcAngle: number;
  actionLightArcAngle: number;
  actionMediumArcAngle: number;
  actionHeavyArcAngle: number;
  actionTauntArcAngle: number;
  actionRestArcAngle: number;
  popupOffsetY: number;
  damagePopupOffsetY: number;
  blockPopupOffsetY: number;
  popupScale: number;
  damagePopupScale: number;
  blockPopupScale: number;
  armorAbsorbPopupOffsetY: number;
  armorBreakPopupOffsetY: number;
  armorAbsorbPopupScale: number;
  armorBreakPopupScale: number;
  characterPreviewScale: number;
  characterPreviewFeetX: number;
  characterPreviewFeetY: number;
  cityHeroX: number;
  cityHeroY: number;
  cityHeroScale: number;
  armoryBackgroundOffsetX: number;
  armoryBackgroundOffsetY: number;
  armoryBackgroundScale: number;
  heroPortraitButtonX: number;
  heroPortraitButtonY: number;
  heroPortraitButtonScale: number;
  characterCanvasEditMode: CharacterCanvasEditMode;
  selectedRigPart: RigPartKey;
  selectedRigParts: RigPartKey[];
  rigParts: Record<RigPartKey, RigPartTuning>;
  faceParts: Record<FacePartKey, FacePartTuning>;
  equipment: Record<EquipmentSlotKey, EquipmentTuning>;
  equipmentItems: Record<string, EquipmentTuning>;
  animationEditMode: AnimationEditMode;
  selectedBodyAnimation: BodyAnimationKey;
  bodyAnimations: Record<BodyAnimationKey, BodyAnimationTuning>;
  selectedSlashArc: SlashArcAttackKey;
  slashArcs: Record<SlashArcAttackKey, SlashArcTuning>;
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

export const defaultActionButtonOffsetTuning: ActionButtonOffsetTuning = {
  x: 0,
  y: 0,
};

export const DEFAULT_ACTION_BUTTON_OFFSETS: Record<ActionButtonOffsetKey, ActionButtonOffsetTuning> = {
  forward: { x: -51, y: -45 },
  back: { x: 54, y: -38 },
  lunge: { x: -19.375, y: -26.803 },
  light: { x: 0, y: 0 },
  medium: { x: -14, y: 8 },
  heavy: { x: 0, y: 18 },
  taunt: { x: 23, y: -24 },
  rest: { x: 19, y: -29 },
};

export const defaultClassicActionButtonSlotTuning: ClassicActionButtonSlotTuning = {
  x: 0,
  y: 18,
  rotation: 0,
};

export const DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS: Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>> = {
  distance: createClassicActionButtonSlots({
    forward: { x: 60, y: -185, rotation: -10 },
    back: { x: -60, y: -185, rotation: -12 },
    lunge: { x: 0, y: -200, rotation: 10 },
    light: { x: 70, y: 18, rotation: 0 },
    medium: { x: 0, y: 18, rotation: 0 },
    heavy: { x: 0, y: 18, rotation: 0 },
    taunt: { x: 30, y: -130, rotation: 0 },
    rest: { x: -30, y: -130, rotation: 12 },
  }),
  clinch: createClassicActionButtonSlots({
    forward: { x: 0, y: 26, rotation: 0 },
    back: { x: -145, y: -135, rotation: -12 },
    lunge: { x: 20, y: 18, rotation: 0 },
    light: { x: -60, y: -185, rotation: 0 },
    medium: { x: 0, y: -200, rotation: 0 },
    heavy: { x: 60, y: -185, rotation: 0 },
    taunt: { x: 30, y: -130, rotation: 0 },
    rest: { x: -30, y: -130, rotation: 12 },
  }),
  bowDistance: createClassicActionButtonSlots({
    forward: { x: -40, y: -52, rotation: -6 },
    back: { x: -145, y: -135, rotation: -14 },
    lunge: { x: 0, y: 18, rotation: 0 },
    light: { x: -60, y: -185, rotation: -14 },
    medium: { x: 0, y: -200, rotation: 0 },
    heavy: { x: 60, y: -185, rotation: 14 },
    taunt: { x: 30, y: -130, rotation: 6 },
    rest: { x: -30, y: -130, rotation: 14 },
  }),
};

export const DEFAULT_RIG_PARTS: Record<RigPartKey, RigPartTuning> = {
  head: { x: -1, y: -10, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  torso: { x: 0, y: -14, angle: 0, scaleX: 0.95, scaleY: 0.95, flipX: false, flipY: false },
  backUpperArm: { x: -21.55, y: -15.473, angle: 0, scaleX: 0.8, scaleY: 1, flipX: false, flipY: false },
  backForearm: { x: -12.088, y: 2.421, angle: 1, scaleX: 1.19, scaleY: 1, flipX: false, flipY: false },
  backHand: { x: 2.429, y: 1.79, angle: -28, scaleX: 1.18, scaleY: 0.99, flipX: false, flipY: false },
  frontUpperArm: { x: 23.45, y: -15.473, angle: 0, scaleX: 0.8, scaleY: 1, flipX: true, flipY: false },
  frontForearm: { x: 12.45, y: 1.948, angle: 0, scaleX: 1.19, scaleY: 1, flipX: true, flipY: false },
  frontHand: { x: -6.791, y: 1.895, angle: 19, scaleX: 1.14, scaleY: 0.95, flipX: true, flipY: false },
  backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.3, scaleY: 1, flipX: true, flipY: false },
  backShin: { x: 3.121, y: 30.79, angle: 1, scaleX: 1.26, scaleY: 0.96, flipX: true, flipY: false },
  backFoot: { x: -21.879, y: 67.79, angle: 0, scaleX: 1.15, scaleY: 1, flipX: true, flipY: false },
  frontThigh: { x: 1.121, y: -6.631, angle: 0, scaleX: 1.3, scaleY: 1, flipX: false, flipY: false },
  frontShin: { x: 0.121, y: 25.369, angle: 0, scaleX: 1.3, scaleY: 1, flipX: false, flipY: false },
  frontFoot: { x: -7.879, y: 61.369, angle: 0, scaleX: 1.15, scaleY: 1, flipX: false, flipY: false },
};

export const DEFAULT_FACE_PARTS: Record<FacePartKey, FacePartTuning> = {
  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
};

export const DEFAULT_EQUIPMENT: Record<EquipmentSlotKey, EquipmentTuning> = {
  weaponMain: { x: 3, y: 35, angle: 55, scaleX: 0.6, scaleY: 0.49, flipX: false, flipY: false },
  helmet: { x: -1, y: 6, angle: 0, scaleX: 0.77, scaleY: 0.94, flipX: false, flipY: false },
  breastplate: { x: 0, y: 30, angle: 0, scaleX: 1.04, scaleY: 1.31, flipX: false, flipY: false },
  backShoulderguard: { x: 6, y: 1, angle: 9, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  frontShoulderguard: { x: 8, y: -3, angle: 13, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  backWrist: { x: 0, y: -3, angle: -4, scaleX: 1.26, scaleY: 1.1, flipX: true, flipY: false },
  frontWrist: { x: 0, y: -3, angle: 14, scaleX: 1.5, scaleY: 1.1, flipX: true, flipY: false },
  backGlove: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  frontGlove: { x: 0, y: 0, angle: 0, scaleX: 1.19, scaleY: 1, flipX: false, flipY: false },
  backGreave: { x: -3, y: 0, angle: -8, scaleX: 1.6, scaleY: 1, flipX: false, flipY: false },
  frontGreave: { x: -6, y: 3, angle: -11, scaleX: 1.6, scaleY: 1, flipX: false, flipY: false },
  backShinguard: { x: -3, y: -3, angle: 4, scaleX: 1.5, scaleY: 1, flipX: false, flipY: false },
  frontShinguard: { x: -6, y: -3, angle: 0, scaleX: 1.5, scaleY: 1, flipX: false, flipY: false },
  backBoot: { x: 1, y: -1, angle: 0, scaleX: 0.93, scaleY: 1, flipX: false, flipY: false },
  frontBoot: { x: 1, y: 0, angle: 0, scaleX: 0.88, scaleY: 1, flipX: false, flipY: false },
};

export const DEFAULT_EQUIPMENT_ITEM_TUNING: Record<string, EquipmentTuning> = {
  "cloth_breastplate_01": { x: 0, y: 47, angle: 0, scaleX: 1.26, scaleY: 1.53, flipX: false, flipY: false },
  "auto_equipment_helmet_cloth_01": { x: -1, y: 21, angle: 0, scaleX: 1.12, scaleY: 1.12, flipX: false, flipY: false },
  "auto_equipment_front_glove_chainmail_03": { x: -3, y: 9, angle: 5, scaleX: 0.75, scaleY: 0.9, flipX: false, flipY: false },
  "auto_equipment_breastplate_chainmail_01": { x: 0, y: 43, angle: 0, scaleX: 1.16, scaleY: 1.55, flipX: false, flipY: false },
  "auto_equipment_helmet_chainmail_01": { x: -1, y: 47, angle: 0, scaleX: 1.25, scaleY: 1.36, flipX: false, flipY: false },
  "auto_equipment_front_shoulderguard_01": { x: 7, y: 36, angle: 11, scaleX: 3, scaleY: 1.87, flipX: false, flipY: false },
  "auto_equipment_front_shoulderguard_cloth_light_01": { x: -3, y: 22, angle: -5, scaleX: 2.24, scaleY: 1.84, flipX: true, flipY: false },
  "auto_equipment_front_shoulderguard_cloth_01": { x: 0, y: 47, angle: 7, scaleX: 1.98, scaleY: 1.23, flipX: false, flipY: false },
  "auto_equipment_back_shoulderguard_cloth_01": { x: 0, y: 47, angle: 7, scaleX: 1.98, scaleY: 1.23, flipX: false, flipY: false },
  "auto_equipment_front_glove_cloth_01": { x: 0, y: 13, angle: 0, scaleX: 0.6, scaleY: 0.6, flipX: false, flipY: false },
  "auto_equipment_back_glove_cloth_01": { x: 0, y: 13, angle: 0, scaleX: 0.6, scaleY: 0.6, flipX: false, flipY: false },
  "auto_equipment_helmet_cloth_02": { x: -1, y: 25, angle: 0, scaleX: 1.07, scaleY: 1.13, flipX: false, flipY: false },
  "auto_equipment_weapon_axe_01": { x: -9, y: 13, angle: 110, scaleX: 1.25, scaleY: 1.51, flipX: false, flipY: false },
  "weapon_sword_01": { x: 3, y: 35, angle: 55, scaleX: 0.5, scaleY: 0.5, flipX: false, flipY: false },
  "auto_equipment_breastplate_leather_01": { x: 0, y: 30, angle: 0, scaleX: 1.17, scaleY: 1.32, flipX: false, flipY: false },
  "auto_equipment_weapon_bow_01": { x: -73, y: -3, angle: 90, scaleX: 1.3, scaleY: 1.3, flipX: false, flipY: false },
  "generated_equipment_helmet_chainmail_01": { x: -0.75, y: 53.219, angle: 0, scaleX: 1.19, scaleY: 1.32, flipX: false, flipY: false },
  "generated_equipment_breastplate_chainmail_01": { x: 0, y: 82, angle: 0, scaleX: 1.68, scaleY: 1.76, flipX: false, flipY: false },
  "generated_equipment_back_shoulderguard_chainmail_01": { x: 0, y: 13, angle: 0, scaleX: 1.5, scaleY: 1.4, flipX: false, flipY: false },
  "generated_equipment_front_shoulderguard_chainmail_01": { x: 0, y: 13, angle: 0, scaleX: 1.5, scaleY: 1.4, flipX: false, flipY: false },
  "generated_equipment_back_wrist_chainmail_01": { x: 0, y: 16, angle: 2, scaleX: 1.5, scaleY: 1.1, flipX: false, flipY: false },
  "generated_equipment_back_glove_chainmail_03": { x: 0, y: 16, angle: 0, scaleX: 1.45, scaleY: 1.5, flipX: false, flipY: false },
  "generated_equipment_front_wrist_chainmail_01": { x: 0, y: 19, angle: 0, scaleX: 1.5, scaleY: 1.1, flipX: false, flipY: false },
  "generated_equipment_front_glove_chainmail_03": { x: 0, y: 13, angle: 7, scaleX: 1.45, scaleY: 1.5, flipX: false, flipY: false },
  "generated_equipment_back_greave_chainmail_01": { x: 0, y: 13, angle: -7, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  "generated_equipment_front_greave_chainmail_01": { x: 0, y: 13, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  "generated_equipment_back_shinguard_chainmail_01": { x: 0, y: 9, angle: -2, scaleX: 1.13, scaleY: 1, flipX: true, flipY: false },
  "generated_equipment_front_shinguard_chainmail_01": { x: 0, y: 9, angle: 0, scaleX: 1.13, scaleY: 0.96, flipX: false, flipY: false },
  "generated_equipment_back_boot_chainmail_01": { x: -25, y: 3, angle: 0, scaleX: 0.83, scaleY: 0.8, flipX: true, flipY: false },
  "generated_equipment_front_boot_chainmail_01": { x: 3, y: 3, angle: 0, scaleX: 0.83, scaleY: 0.8, flipX: false, flipY: false },
  "generated_equipment_front_shoulderguard_cloth_01": { x: 0, y: 47, angle: 7, scaleX: 1.98, scaleY: 1.23, flipX: false, flipY: false },
  "generated_equipment_back_shoulderguard_cloth_01": { x: 0, y: 47, angle: 7, scaleX: 1.98, scaleY: 1.23, flipX: false, flipY: false },
  "auto_equipment_back_wrist_cloth_01": { x: -1.251, y: 21.408, angle: 4, scaleX: 1.77, scaleY: 1.18, flipX: false, flipY: false },
  "generated_equipment_front_wrist_cloth_01": { x: -1.251, y: 21.408, angle: 4, scaleX: 1.77, scaleY: 1.18, flipX: false, flipY: false },
  "training_sword": { x: 3, y: 35, angle: 55, scaleX: 0.5, scaleY: 0.5, flipX: false, flipY: false },
  "auto_equipment_back_glove_leather_03": { x: 0, y: 14, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  "generated_equipment_front_glove_leather_03": { x: 0, y: 14, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
  "generated_equipment_front_glove_cloth_01": { x: 0, y: 13, angle: 0, scaleX: 0.6, scaleY: 0.6, flipX: false, flipY: false },
  "leather_back_shoulderguard_01": { x: 0, y: 16, angle: -2, scaleX: 1.8, scaleY: 1.45, flipX: false, flipY: false },
  "leather_front_shoulderguard_01": { x: 0, y: 16, angle: 0, scaleX: 1.8, scaleY: 1.45, flipX: true, flipY: false },
  "leather_back_wrist_01": { x: 0, y: 13, angle: -1, scaleX: 1.55, scaleY: 1.4, flipX: true, flipY: false },
  "leather_front_wrist_01": { x: 0, y: 8, angle: 0, scaleX: 1.55, scaleY: 1.43, flipX: false, flipY: false },
};

export const DEFAULT_IDLE_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 2000,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -2, angle: -20, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -2.89, y: -2, angle: 19, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 2, y: 33, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -19, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -12, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: -0.13, y: -11.571, angle: 3, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -18, angle: 0, scaleX: 0.98, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -13, angle: -2, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -9.379, y: -2.871, angle: -1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 8.721, y: -6.045, angle: -21, scaleX: 1.12, scaleY: 1.05, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -13, angle: 2, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 8.63, y: -2.897, angle: -1, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -7.546, y: -2, angle: 21, scaleX: 1.12, scaleY: 1.05, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 3, y: 33, angle: 1, scaleX: 0.93, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -19, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 0.93, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -12, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
  duration: 400,
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
    head: { x: 25.61, y: -1.762, angle: 18, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 12, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -16.06, y: -2.952, angle: -40, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: 45.299, y: -5.333, angle: -39, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 98.79, y: -27.027, angle: -56, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 16.898, y: 13.821, angle: -39, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    frontForearm: { x: 38.673, y: 11.247, angle: -117, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontHand: { x: 80.019, y: -83.172, angle: -149, scaleX: 1.17, scaleY: 0.97, flipX: false, flipY: false },
    backThigh: { x: 0, y: 0, angle: 42, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -37.506, y: 8.592, angle: 4, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -56.056, y: 58.519, angle: -33, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: -39, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 36.266, y: 11.053, angle: 24, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 3.256, y: 35.623, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: 2, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 13.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
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
  duration: 500,
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
  duration: 500,
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
    backHand: { x: 94.2, y: -51.619, angle: -94, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 15.07, y: 46.595, angle: -57, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 64.71, y: 16.571, angle: -66, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: 110.969, y: -9.352, angle: -44, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
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
  duration: 500,
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

export const DEFAULT_TAUNT_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 600,
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
    head: { x: 5.634, y: -36.096, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 1.921, y: -43.367, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -31.841, angle: -30, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: 27.39, y: -29.42, angle: -32, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 73.283, y: -46.416, angle: -22, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 9.159, y: -25.811, angle: -102, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 67.65, y: -111.506, angle: -105, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: 120.899, y: -174.668, angle: -74, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 5.764, y: -24.631, angle: 36, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -31.157, y: -5.869, angle: 40, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -87.802, y: 32.996, angle: -33, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -1.211, y: -17.999, angle: -39, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 40.944, y: -3.051, angle: -39, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 75.255, y: 24.528, angle: 21, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -3, y: 0, scaleX: 1.26, scaleY: 1 },
    eyeRight: { x: 2, y: 0, scaleX: 1.34, scaleY: 1 },
  },
  faceBreath: {
    eyeLeft: { x: 1, y: 0.5, scaleX: 1.26, scaleY: 1 },
    eyeRight: { x: -3.5, y: 0, scaleX: 1.34, scaleY: 1 },
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
export const DEFAULT_REST_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 860,
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
    head: { x: -0.13, y: -9.571, angle: 18, scaleX: 1.03, scaleY: 0.88, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.98, scaleY: 0.94, flipX: false, flipY: false },
    backUpperArm: { x: -22.99, y: -11.976, angle: -6, scaleX: 0.85, scaleY: 0.95, flipX: false, flipY: false },
    backForearm: { x: -4.08, y: -1, angle: 1, scaleX: 1.05, scaleY: 1.05, flipX: false, flipY: false },
    backHand: { x: 13.02, y: 0.119, angle: -25, scaleX: 1.15, scaleY: 0.95, flipX: false, flipY: false },
    frontUpperArm: { x: 24.97, y: -8.071, angle: 15, scaleX: 0.85, scaleY: 0.95, flipX: true, flipY: false },
    frontForearm: { x: -4.59, y: 0.952, angle: -3, scaleX: 1.05, scaleY: 1.05, flipX: true, flipY: false },
    frontHand: { x: -15.75, y: 1.386, angle: 19, scaleX: 1.22, scaleY: 1.02, flipX: true, flipY: false },
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
    eyeLeft: { x: -5.5, y: -2, scaleX: 1.81, scaleY: 0.31 },
    eyeRight: { x: 4, y: -2.5, scaleX: 2.12, scaleY: 0.26 },
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

export const DEFAULT_BOW_SHOT_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 500,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -2, angle: -20, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -2.89, y: -2, angle: 19, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 2, y: 33, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -19, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -12, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: -62.578, y: 61.479, angle: -24, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: -19.215, y: 49.471, angle: -21, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -68.115, y: 100.785, angle: -66, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: 17.783, y: 70.997, angle: -74, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 84.812, y: 16.947, angle: -95, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
    frontUpperArm: { x: -33.723, y: 33.524, angle: -54, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 13.171, y: 9.421, angle: -30, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: 28.814, y: 3.684, angle: 43, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
    backThigh: { x: -5.764, y: 54.945, angle: 42, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -43.155, y: 61.42, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -65.115, y: 98.42, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -11.779, y: 61.576, angle: -30, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 20.768, y: 83.156, angle: -30, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 46.605, y: 112.63, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: 0, y: -1, scaleX: 1.73, scaleY: 0.36 },
    eyeRight: { x: 12.5, y: -2, scaleX: 1.3, scaleY: 0.97 },
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
export const DEFAULT_HIT_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 400,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -2, angle: -20, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -2.89, y: -2, angle: 19, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 2, y: 33, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -19, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -12, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: 20.653, y: 13.954, angle: 35, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: -4.157, y: 1.999, angle: 13, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -16.353, y: -3.211, angle: 1, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -5.471, y: 5.895, angle: -7, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 22.128, y: 7.789, angle: -14, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
    frontUpperArm: { x: 41.293, y: 30.893, angle: 2, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 28.779, y: 40.946, angle: -2, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: 13.757, y: 41.893, angle: 19, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
    backThigh: { x: -3.039, y: 13.263, angle: 7, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -6.647, y: 39.631, angle: -14, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -11.314, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -11.936, y: 5.684, angle: 7, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -22.465, y: 38.631, angle: 0, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -30.254, y: 72.842, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.37, scaleY: 0.87 },
    eyeRight: { x: 3.5, y: -2, scaleX: 1.66, scaleY: 0.19 },
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

export const DEFAULT_BLOCK_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 500,
  base: {
    head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 4.11, y: -2, angle: -20, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
    frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -2.89, y: -2, angle: 19, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 2, y: 33, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -19, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -12, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  breath: {
    head: { x: -21.423, y: -3.098, angle: 5, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: -3, y: -16, angle: -11, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -36.607, y: 17.998, angle: -76, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: 49.84, y: -23.526, angle: -58, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 115.615, y: -61.262, angle: -76, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
    frontUpperArm: { x: 14.471, y: -15.211, angle: -28, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 39.915, y: -19.947, angle: 19, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: 5.128, y: -27.369, angle: 36, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
    backThigh: { x: -2, y: 0, angle: 21, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -24.901, y: 27.316, angle: 22, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -68.958, y: 61.474, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -9.936, y: 2.842, angle: -33, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: 21.729, y: 19.685, angle: -3, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: 16.822, y: 59.579, angle: 12, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  },
  faceBase: {
    eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
  },
  faceBreath: {
    eyeLeft: { x: -1, y: -1.5, scaleX: 1.3, scaleY: 0.7 },
    eyeRight: { x: 12, y: -1.5, scaleX: 1.3, scaleY: 0.7 },
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
  bowShot: DEFAULT_BOW_SHOT_ANIMATION,
  hit: DEFAULT_HIT_ANIMATION,
  block: DEFAULT_BLOCK_ANIMATION,
  taunt: DEFAULT_TAUNT_ANIMATION,
  rest: DEFAULT_REST_ANIMATION,
};

export const DEFAULT_SLASH_ARCS: Record<SlashArcAttackKey, SlashArcTuning> = {
  light: {
    radius: 17,
    width: 2,
    color: 0xfff3c7,
    alpha: 1,
    duration: 130,
    offsetX: 1,
    offsetY: -14,
    startAngle: -1.2,
    endAngle: 1.05,
    angle: 83,
    sweep: -116,
  },
  medium: {
    radius: 20,
    width: 3,
    color: 0xffcf62,
    alpha: 0.95,
    duration: 165,
    offsetX: 0,
    offsetY: -18,
    startAngle: -1.28,
    endAngle: 1.12,
    angle: -40,
    sweep: 43,
  },
  heavy: {
    radius: 25,
    width: 10,
    color: 0xff6048,
    alpha: 1,
    duration: 210,
    offsetX: 0,
    offsetY: -36,
    startAngle: -1.36,
    endAngle: 1.22,
    angle: -16,
    sweep: 105,
  },
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
  shadowOffsetX: 0,
  shadowOffsetY: 66,
  shadowScaleX: 1.08,
  shadowScaleY: -0.49,
  shadowAlpha: 0.8,
  shadowBlur: 1.2,
  cameraFeetScreenY: DEFAULT_CAMERA_FEET_SCREEN_Y,
  cameraCloseFeetShiftY: DEFAULT_CAMERA_CLOSE_FEET_SHIFT_Y,
  cameraFeetMinScreenRatio: DEFAULT_CAMERA_FEET_MIN_SCREEN_RATIO,
  arenaBackFollowX: DEFAULT_ARENA_BACK_FOLLOW_X,
  arenaBackFollowY: DEFAULT_ARENA_BACK_FOLLOW_Y,
  arenaBackZoom: DEFAULT_ARENA_BACK_ZOOM,
  arenaBackLookUpY: DEFAULT_ARENA_BACK_LOOK_UP_Y,
  arenaMidFollowX: DEFAULT_ARENA_MID_FOLLOW_X,
  arenaMidFollowY: DEFAULT_ARENA_MID_FOLLOW_Y,
  arenaMidZoom: DEFAULT_ARENA_MID_ZOOM,
  arenaMidLookUpY: DEFAULT_ARENA_MID_LOOK_UP_Y,
  arenaMidZoomDarken: DEFAULT_ARENA_MID_ZOOM_DARKEN,
  arenaGroundFollowX: DEFAULT_ARENA_GROUND_FOLLOW_X,
  arenaGroundFollowY: DEFAULT_ARENA_GROUND_FOLLOW_Y,
  arenaGroundZoom: DEFAULT_ARENA_GROUND_ZOOM,
  arenaGroundLookUpY: DEFAULT_ARENA_GROUND_LOOK_UP_Y,
  actionArcEditMode: false,
  actionArcRotation: DEFAULT_ACTION_ARC_ROTATION,
  actionArcRadius: DEFAULT_ACTION_ARC_RADIUS,
  actionArcOffsetX: DEFAULT_ACTION_ARC_OFFSET_X,
  actionArcOffsetY: DEFAULT_ACTION_ARC_OFFSET_Y,
  actionButtonScale: DEFAULT_ACTION_BUTTON_SCALE,
  actionIconScale: DEFAULT_ACTION_ICON_SCALE,
  actionAttackIconScale: DEFAULT_ACTION_ATTACK_ICON_SCALE,
  actionLightIconScale: DEFAULT_ACTION_LIGHT_ICON_SCALE,
  actionMediumIconScale: DEFAULT_ACTION_MEDIUM_ICON_SCALE,
  actionHeavyIconScale: DEFAULT_ACTION_HEAVY_ICON_SCALE,
  actionLightIconRotation: DEFAULT_ACTION_LIGHT_ICON_ROTATION,
  actionMediumIconRotation: DEFAULT_ACTION_MEDIUM_ICON_ROTATION,
  actionHeavyIconRotation: DEFAULT_ACTION_HEAVY_ICON_ROTATION,
  actionLightIconBrightness: DEFAULT_ACTION_LIGHT_ICON_BRIGHTNESS,
  actionMediumIconBrightness: DEFAULT_ACTION_MEDIUM_ICON_BRIGHTNESS,
  actionHeavyIconBrightness: DEFAULT_ACTION_HEAVY_ICON_BRIGHTNESS,
  actionTokenRingWidth: DEFAULT_ACTION_TOKEN_RING_WIDTH,
  actionTokenFaceInset: DEFAULT_ACTION_TOKEN_FACE_INSET,
  actionTokenRimShine: DEFAULT_ACTION_TOKEN_RIM_SHINE,
  actionTokenOuterShine: DEFAULT_ACTION_TOKEN_OUTER_SHINE,
  actionTokenFaceShine: DEFAULT_ACTION_TOKEN_FACE_SHINE,
  actionTokenInnerShine: DEFAULT_ACTION_TOKEN_INNER_SHINE,
  actionTokenStripeShine: DEFAULT_ACTION_TOKEN_STRIPE_SHINE,
  actionButtonOffsets: cloneActionButtonOffsets(DEFAULT_ACTION_BUTTON_OFFSETS),
  selectedClassicActionWheelMode: "distance",
  selectedClassicActionButton: "forward",
  classicActionButtonSlots: cloneClassicActionButtonSlots(DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS),
  classicHudEditMode: false,
  classicHudOffsetX: DEFAULT_CLASSIC_HUD_OFFSET_X,
  classicHudOffsetY: DEFAULT_CLASSIC_HUD_OFFSET_Y,
  classicHudScale: DEFAULT_CLASSIC_HUD_SCALE,
  classicHudSafeOffset: DEFAULT_CLASSIC_HUD_SAFE_OFFSET,
  hudMode: DEFAULT_PLAYER_HUD_MODE,
  hudEditMode: false,
  hudBottomOffset: DEFAULT_HUD_BOTTOM_OFFSET,
  hudSideInset: DEFAULT_HUD_SIDE_INSET,
  hudScale: DEFAULT_HUD_SCALE,
  hudFlaskGap: DEFAULT_HUD_FLASK_GAP,
  hudNameGap: DEFAULT_HUD_NAME_GAP,
  hudSafeGapRatio: DEFAULT_HUD_SAFE_GAP_RATIO,
  hudSafeMinGap: DEFAULT_HUD_SAFE_MIN_GAP,
  fighterHudGap: DEFAULT_FIGHTER_HUD_GAP,
  forwardMoveDistance: DEFAULT_FORWARD_MOVE_DISTANCE,
  backMoveDistance: DEFAULT_BACK_MOVE_DISTANCE,
  lungeMoveDistance: DEFAULT_LUNGE_MOVE_DISTANCE,
  actionForwardArcAngle: DEFAULT_ACTION_FORWARD_ANGLE,
  actionBackArcAngle: DEFAULT_ACTION_BACK_ANGLE,
  actionLungeArcAngle: DEFAULT_ACTION_LUNGE_ANGLE,
  actionLightArcAngle: DEFAULT_ACTION_LIGHT_ANGLE,
  actionMediumArcAngle: DEFAULT_ACTION_MEDIUM_ANGLE,
  actionHeavyArcAngle: DEFAULT_ACTION_HEAVY_ANGLE,
  actionTauntArcAngle: DEFAULT_ACTION_TAUNT_ANGLE,
  actionRestArcAngle: DEFAULT_ACTION_REST_ANGLE,
  popupOffsetY: 3,
  damagePopupOffsetY: -50,
  blockPopupOffsetY: -50,
  popupScale: 1,
  damagePopupScale: 0.85,
  blockPopupScale: 0.7,
  armorAbsorbPopupOffsetY: -40,
  armorBreakPopupOffsetY: 0,
  armorAbsorbPopupScale: 0.65,
  armorBreakPopupScale: 1,
  characterPreviewScale: 1.8,
  characterPreviewFeetX: 215,
  characterPreviewFeetY: 700,
  cityHeroX: 100,
  cityHeroY: 200,
  cityHeroScale: 1.6,
  armoryBackgroundOffsetX: 0,
  armoryBackgroundOffsetY: 0,
  armoryBackgroundScale: 1,
  heroPortraitButtonX: 5,
  heroPortraitButtonY: 3,
  heroPortraitButtonScale: 1.2,
  characterCanvasEditMode: "parts",
  selectedRigPart: "torso",
  selectedRigParts: ["torso"],
  rigParts: cloneRigParts(DEFAULT_RIG_PARTS),
  faceParts: cloneFaceParts(DEFAULT_FACE_PARTS),
  equipment: cloneEquipment(DEFAULT_EQUIPMENT),
  equipmentItems: cloneEquipmentItems(DEFAULT_EQUIPMENT_ITEM_TUNING),
  animationEditMode: "poseA",
  selectedBodyAnimation: "idle",
  bodyAnimations: cloneBodyAnimations(DEFAULT_BODY_ANIMATIONS),
  selectedSlashArc: "light",
  slashArcs: cloneSlashArcs(DEFAULT_SLASH_ARCS),
};

const storageKey = "dust-arena-debug-tuning";
const debugUndoLimit = 50;
const listeners = new Set<() => void>();
const debugUndoStack: ArenaDebugTuning[] = [];
let activeDebugUndoGroupSnapshot: ArenaDebugTuning | undefined;
let shouldPersistDebugTuning = false;

interface DebugTuningUpdateOptions {
  undoable?: boolean;
}

export const debugTuning: ArenaDebugTuning = cloneDebugTuning(defaultDebugTuning);

export function hydrateDebugTuningFromStorage(): void {
  Object.assign(debugTuning, loadDebugTuning());
  debugUndoStack.length = 0;
  activeDebugUndoGroupSnapshot = undefined;
  shouldPersistDebugTuning = true;
}

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
    shadowOffsetX: clampNumber(input.shadowOffsetX, -240, 240, defaultDebugTuning.shadowOffsetX),
    shadowOffsetY: clampNumber(input.shadowOffsetY, -240, 240, defaultDebugTuning.shadowOffsetY),
    shadowScaleX: clampNumber(input.shadowScaleX, -4, 4, defaultDebugTuning.shadowScaleX),
    shadowScaleY: clampNumber(input.shadowScaleY, -1, 1, defaultDebugTuning.shadowScaleY),
    shadowAlpha: clampNumber(input.shadowAlpha, 0, 1, defaultDebugTuning.shadowAlpha),
    shadowBlur: clampNumber(input.shadowBlur, 0, 6, defaultDebugTuning.shadowBlur),
    cameraFeetScreenY: clampNumber(input.cameraFeetScreenY, 260, 720, defaultDebugTuning.cameraFeetScreenY),
    cameraCloseFeetShiftY: clampNumber(input.cameraCloseFeetShiftY, -180, 180, defaultDebugTuning.cameraCloseFeetShiftY),
    cameraFeetMinScreenRatio: clampNumber(input.cameraFeetMinScreenRatio, 0.35, 0.75, defaultDebugTuning.cameraFeetMinScreenRatio),
    arenaBackFollowX: clampNumber(input.arenaBackFollowX, -0.5, 1.5, defaultDebugTuning.arenaBackFollowX),
    arenaBackFollowY: clampNumber(input.arenaBackFollowY, -0.5, 1.5, defaultDebugTuning.arenaBackFollowY),
    arenaBackZoom: clampNumber(input.arenaBackZoom, 0, 1.5, defaultDebugTuning.arenaBackZoom),
    arenaBackLookUpY: clampNumber(input.arenaBackLookUpY, -240, 240, defaultDebugTuning.arenaBackLookUpY),
    arenaMidFollowX: clampNumber(input.arenaMidFollowX, -0.5, 1.5, defaultDebugTuning.arenaMidFollowX),
    arenaMidFollowY: clampNumber(input.arenaMidFollowY, -0.5, 1.5, defaultDebugTuning.arenaMidFollowY),
    arenaMidZoom: clampNumber(input.arenaMidZoom, 0, 1.5, defaultDebugTuning.arenaMidZoom),
    arenaMidLookUpY: clampNumber(input.arenaMidLookUpY, -240, 240, defaultDebugTuning.arenaMidLookUpY),
    arenaMidZoomDarken: clampNumber(input.arenaMidZoomDarken, 0, 1, defaultDebugTuning.arenaMidZoomDarken),
    arenaGroundFollowX: clampNumber(input.arenaGroundFollowX, -0.5, 1.5, defaultDebugTuning.arenaGroundFollowX),
    arenaGroundFollowY: clampNumber(input.arenaGroundFollowY, -0.5, 1.5, defaultDebugTuning.arenaGroundFollowY),
    arenaGroundZoom: clampNumber(input.arenaGroundZoom, 0, 1.5, defaultDebugTuning.arenaGroundZoom),
    arenaGroundLookUpY: clampNumber(input.arenaGroundLookUpY, -240, 240, defaultDebugTuning.arenaGroundLookUpY),
    actionArcEditMode: typeof input.actionArcEditMode === "boolean" ? input.actionArcEditMode : defaultDebugTuning.actionArcEditMode,
    actionArcRotation: clampNumber(input.actionArcRotation, -180, 180, defaultDebugTuning.actionArcRotation),
    actionArcRadius: clampNumber(input.actionArcRadius, 24, 150, defaultDebugTuning.actionArcRadius),
    actionArcOffsetX: clampNumber(input.actionArcOffsetX, -320, 320, defaultDebugTuning.actionArcOffsetX),
    actionArcOffsetY: clampNumber(input.actionArcOffsetY, -320, 320, defaultDebugTuning.actionArcOffsetY),
    actionButtonScale: clampNumber(input.actionButtonScale, 0.5, 2, defaultDebugTuning.actionButtonScale),
    actionIconScale: clampNumber(input.actionIconScale, 0.5, 2, defaultDebugTuning.actionIconScale),
    actionAttackIconScale: clampNumber(input.actionAttackIconScale, 0.5, 2, defaultDebugTuning.actionAttackIconScale),
    actionLightIconScale: clampNumber(input.actionLightIconScale, 0.5, 2, defaultDebugTuning.actionLightIconScale),
    actionMediumIconScale: clampNumber(input.actionMediumIconScale, 0.5, 2, defaultDebugTuning.actionMediumIconScale),
    actionHeavyIconScale: clampNumber(input.actionHeavyIconScale, 0.5, 2, defaultDebugTuning.actionHeavyIconScale),
    actionLightIconRotation: clampNumber(input.actionLightIconRotation, -180, 180, defaultDebugTuning.actionLightIconRotation),
    actionMediumIconRotation: clampNumber(input.actionMediumIconRotation, -180, 180, defaultDebugTuning.actionMediumIconRotation),
    actionHeavyIconRotation: clampNumber(input.actionHeavyIconRotation, -180, 180, defaultDebugTuning.actionHeavyIconRotation),
    actionLightIconBrightness: clampNumber(input.actionLightIconBrightness, 0.35, 1.8, defaultDebugTuning.actionLightIconBrightness),
    actionMediumIconBrightness: clampNumber(input.actionMediumIconBrightness, 0.35, 1.8, defaultDebugTuning.actionMediumIconBrightness),
    actionHeavyIconBrightness: clampNumber(input.actionHeavyIconBrightness, 0.35, 1.8, defaultDebugTuning.actionHeavyIconBrightness),
    actionTokenRingWidth: clampNumber(input.actionTokenRingWidth, 0, 6, defaultDebugTuning.actionTokenRingWidth),
    actionTokenFaceInset: clampNumber(input.actionTokenFaceInset, 0, 10, defaultDebugTuning.actionTokenFaceInset),
    actionTokenRimShine: clampNumber(input.actionTokenRimShine, 0, 0.6, defaultDebugTuning.actionTokenRimShine),
    actionTokenOuterShine: clampNumber(input.actionTokenOuterShine, 0, 0.6, defaultDebugTuning.actionTokenOuterShine),
    actionTokenFaceShine: clampNumber(input.actionTokenFaceShine, 0, 0.6, defaultDebugTuning.actionTokenFaceShine),
    actionTokenInnerShine: clampNumber(input.actionTokenInnerShine, 0, 0.6, defaultDebugTuning.actionTokenInnerShine),
    actionTokenStripeShine: clampNumber(input.actionTokenStripeShine, 0, 0.6, defaultDebugTuning.actionTokenStripeShine),
    actionButtonOffsets: normalizeActionButtonOffsets(input.actionButtonOffsets),
    selectedClassicActionWheelMode: isClassicActionWheelMode(input.selectedClassicActionWheelMode)
      ? input.selectedClassicActionWheelMode
      : defaultDebugTuning.selectedClassicActionWheelMode,
    selectedClassicActionButton: isActionButtonOffsetKey(input.selectedClassicActionButton)
      ? input.selectedClassicActionButton
      : defaultDebugTuning.selectedClassicActionButton,
    classicActionButtonSlots: normalizeClassicActionButtonSlots(input.classicActionButtonSlots),
    classicHudEditMode: typeof input.classicHudEditMode === "boolean" ? input.classicHudEditMode : defaultDebugTuning.classicHudEditMode,
    classicHudOffsetX: clampNumber(input.classicHudOffsetX, -240, 240, defaultDebugTuning.classicHudOffsetX),
    classicHudOffsetY: clampNumber(input.classicHudOffsetY, -160, 160, defaultDebugTuning.classicHudOffsetY),
    classicHudScale: clampNumber(input.classicHudScale, 0.6, 1.6, defaultDebugTuning.classicHudScale),
    classicHudSafeOffset: clampNumber(input.classicHudSafeOffset, 0, 280, defaultDebugTuning.classicHudSafeOffset),
    hudMode: isDebugHudMode(input.hudMode) ? input.hudMode : defaultDebugTuning.hudMode,
    hudEditMode: typeof input.hudEditMode === "boolean" ? input.hudEditMode : defaultDebugTuning.hudEditMode,
    hudBottomOffset: clampNumber(input.hudBottomOffset, -96, 96, defaultDebugTuning.hudBottomOffset),
    hudSideInset: clampNumber(input.hudSideInset, 0, 64, defaultDebugTuning.hudSideInset),
    hudScale: clampNumber(input.hudScale, 0.7, 1.25, defaultDebugTuning.hudScale),
    hudFlaskGap: clampNumber(input.hudFlaskGap, 0, 18, defaultDebugTuning.hudFlaskGap),
    hudNameGap: clampNumber(input.hudNameGap, -12, 24, defaultDebugTuning.hudNameGap),
    hudSafeGapRatio: clampNumber(input.hudSafeGapRatio, 0, 0.5, defaultDebugTuning.hudSafeGapRatio),
    hudSafeMinGap: clampNumber(input.hudSafeMinGap, 0, 80, defaultDebugTuning.hudSafeMinGap),
    fighterHudGap: clampNumber(input.fighterHudGap, 0, 120, defaultDebugTuning.fighterHudGap),
    forwardMoveDistance: clampNumber(input.forwardMoveDistance, 0.1, 4, defaultDebugTuning.forwardMoveDistance),
    backMoveDistance: clampNumber(input.backMoveDistance, 0.1, 4, defaultDebugTuning.backMoveDistance),
    lungeMoveDistance: clampNumber(input.lungeMoveDistance, 0.1, 4, defaultDebugTuning.lungeMoveDistance),
    actionForwardArcAngle: clampNumber(input.actionForwardArcAngle, -180, 180, defaultDebugTuning.actionForwardArcAngle),
    actionBackArcAngle: clampNumber(input.actionBackArcAngle, -180, 180, defaultDebugTuning.actionBackArcAngle),
    actionLungeArcAngle: clampNumber(input.actionLungeArcAngle, -180, 180, defaultDebugTuning.actionLungeArcAngle),
    actionLightArcAngle: clampNumber(input.actionLightArcAngle, -180, 180, defaultDebugTuning.actionLightArcAngle),
    actionMediumArcAngle: clampNumber(input.actionMediumArcAngle, -180, 180, defaultDebugTuning.actionMediumArcAngle),
    actionHeavyArcAngle: clampNumber(input.actionHeavyArcAngle, -180, 180, defaultDebugTuning.actionHeavyArcAngle),
    actionTauntArcAngle: clampNumber(input.actionTauntArcAngle, -180, 180, defaultDebugTuning.actionTauntArcAngle),
    actionRestArcAngle: clampNumber(input.actionRestArcAngle, -180, 180, defaultDebugTuning.actionRestArcAngle),
    popupOffsetY: clampNumber(input.popupOffsetY, -160, 160, defaultDebugTuning.popupOffsetY),
    damagePopupOffsetY: clampNumber(input.damagePopupOffsetY, -160, 160, defaultDebugTuning.damagePopupOffsetY),
    blockPopupOffsetY: clampNumber(input.blockPopupOffsetY, -160, 160, defaultDebugTuning.blockPopupOffsetY),
    popupScale: clampNumber(input.popupScale, 0.25, 2, defaultDebugTuning.popupScale),
    damagePopupScale: clampNumber(input.damagePopupScale, 0.25, 2, defaultDebugTuning.damagePopupScale),
    blockPopupScale: clampNumber(input.blockPopupScale, 0.25, 2, defaultDebugTuning.blockPopupScale),
    armorAbsorbPopupOffsetY: clampNumber(input.armorAbsorbPopupOffsetY, -160, 160, defaultDebugTuning.armorAbsorbPopupOffsetY),
    armorBreakPopupOffsetY: clampNumber(input.armorBreakPopupOffsetY, -160, 160, defaultDebugTuning.armorBreakPopupOffsetY),
    armorAbsorbPopupScale: clampNumber(input.armorAbsorbPopupScale, 0.25, 2, defaultDebugTuning.armorAbsorbPopupScale),
    armorBreakPopupScale: clampNumber(input.armorBreakPopupScale, 0.25, 2, defaultDebugTuning.armorBreakPopupScale),
    characterPreviewScale: clampNumber(input.characterPreviewScale, 1, 2.6, defaultDebugTuning.characterPreviewScale),
    characterPreviewFeetX: clampNumber(input.characterPreviewFeetX, 0, 430, defaultDebugTuning.characterPreviewFeetX),
    characterPreviewFeetY: clampNumber(input.characterPreviewFeetY, 560, 740, defaultDebugTuning.characterPreviewFeetY),
    cityHeroX: clampNumber(input.cityHeroX, 0, 240, defaultDebugTuning.cityHeroX),
    cityHeroY: clampNumber(input.cityHeroY, 0, 360, defaultDebugTuning.cityHeroY),
    cityHeroScale: clampNumber(input.cityHeroScale, 0.4, 1.6, defaultDebugTuning.cityHeroScale),
    armoryBackgroundOffsetX: clampNumber(input.armoryBackgroundOffsetX, -240, 240, defaultDebugTuning.armoryBackgroundOffsetX),
    armoryBackgroundOffsetY: clampNumber(input.armoryBackgroundOffsetY, -240, 240, defaultDebugTuning.armoryBackgroundOffsetY),
    armoryBackgroundScale: clampNumber(input.armoryBackgroundScale, 1, 1.6, defaultDebugTuning.armoryBackgroundScale),
    heroPortraitButtonX: clampNumber(input.heroPortraitButtonX, 0, 430, defaultDebugTuning.heroPortraitButtonX),
    heroPortraitButtonY: clampNumber(input.heroPortraitButtonY, 0, 764, defaultDebugTuning.heroPortraitButtonY),
    heroPortraitButtonScale: clampNumber(input.heroPortraitButtonScale, 0.5, 1.8, defaultDebugTuning.heroPortraitButtonScale),
    characterCanvasEditMode: isCharacterCanvasEditMode(input.characterCanvasEditMode)
      ? input.characterCanvasEditMode
      : defaultDebugTuning.characterCanvasEditMode,
    selectedRigPart,
    selectedRigParts: normalizeSelectedRigParts(input.selectedRigParts, selectedRigPart),
    rigParts: normalizeRigParts(input.rigParts, DEFAULT_RIG_PARTS),
    faceParts: normalizeFaceParts(input.faceParts, DEFAULT_FACE_PARTS),
    equipment: normalizeEquipment(input.equipment, DEFAULT_EQUIPMENT),
    equipmentItems: normalizeEquipmentItems(input.equipmentItems, DEFAULT_EQUIPMENT_ITEM_TUNING),
    animationEditMode: isAnimationEditMode(input.animationEditMode) ? input.animationEditMode : defaultDebugTuning.animationEditMode,
    selectedBodyAnimation: isBodyAnimationKey(input.selectedBodyAnimation) ? input.selectedBodyAnimation : defaultDebugTuning.selectedBodyAnimation,
    bodyAnimations: normalizeBodyAnimations(input.bodyAnimations, legacyIdleAnimation),
    selectedSlashArc: isSlashArcAttackKey(input.selectedSlashArc) ? input.selectedSlashArc : defaultDebugTuning.selectedSlashArc,
    slashArcs: normalizeSlashArcs(input.slashArcs),
  };
}

function createDefaultRigParts(): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...defaultRigPartTuning }])) as Record<RigPartKey, RigPartTuning>;
}

function createClassicActionButtonSlots(
  overrides: Partial<Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>>,
): Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning> {
  return Object.fromEntries(
    ACTION_BUTTON_OFFSET_KEYS.map((key) => [key, { ...defaultClassicActionButtonSlotTuning, ...(overrides[key] ?? {}) }]),
  ) as Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>;
}

function cloneActionButtonOffsets(source: Record<ActionButtonOffsetKey, ActionButtonOffsetTuning>): Record<ActionButtonOffsetKey, ActionButtonOffsetTuning> {
  return Object.fromEntries(ACTION_BUTTON_OFFSET_KEYS.map((key) => [key, { ...source[key] }])) as Record<
    ActionButtonOffsetKey,
    ActionButtonOffsetTuning
  >;
}

function cloneClassicActionButtonSlots(
  source: Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>>,
): Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>> {
  return Object.fromEntries(
    CLASSIC_ACTION_WHEEL_MODES.map((mode) => [
      mode,
      Object.fromEntries(ACTION_BUTTON_OFFSET_KEYS.map((key) => [key, { ...source[mode][key] }])) as Record<
        ActionButtonOffsetKey,
        ClassicActionButtonSlotTuning
      >,
    ]),
  ) as Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>>;
}

function cloneRigParts(source: Record<RigPartKey, RigPartTuning>): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<RigPartKey, RigPartTuning>;
}

function cloneFaceParts(source: Record<FacePartKey, FacePartTuning>): Record<FacePartKey, FacePartTuning> {
  return Object.fromEntries(FACE_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<FacePartKey, FacePartTuning>;
}

function cloneEquipment(source: Record<EquipmentSlotKey, EquipmentTuning>): Record<EquipmentSlotKey, EquipmentTuning> {
  return Object.fromEntries(EQUIPMENT_SLOT_KEYS.map((key) => [key, { ...source[key] }])) as Record<EquipmentSlotKey, EquipmentTuning>;
}

function cloneEquipmentItems(source: Record<string, EquipmentTuning>): Record<string, EquipmentTuning> {
  return Object.fromEntries(Object.entries(source).map(([itemId, tuning]) => [itemId, { ...tuning }]));
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

function cloneSlashArcs(source: Record<SlashArcAttackKey, SlashArcTuning>): Record<SlashArcAttackKey, SlashArcTuning> {
  return Object.fromEntries(SLASH_ARC_ATTACK_KEYS.map((key) => [key, { ...source[key] }])) as Record<SlashArcAttackKey, SlashArcTuning>;
}

function cloneDebugTuning(source: ArenaDebugTuning): ArenaDebugTuning {
  return {
    ...source,
    selectedRigParts: [...source.selectedRigParts],
    actionButtonOffsets: cloneActionButtonOffsets(source.actionButtonOffsets),
    classicActionButtonSlots: cloneClassicActionButtonSlots(source.classicActionButtonSlots),
    rigParts: cloneRigParts(source.rigParts),
    faceParts: cloneFaceParts(source.faceParts),
    equipment: cloneEquipment(source.equipment),
    equipmentItems: cloneEquipmentItems(source.equipmentItems),
    bodyAnimations: cloneBodyAnimations(source.bodyAnimations),
    slashArcs: cloneSlashArcs(source.slashArcs),
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

function normalizeActionButtonOffsets(
  input: unknown,
  fallbackOffsets = DEFAULT_ACTION_BUTTON_OFFSETS,
): Record<ActionButtonOffsetKey, ActionButtonOffsetTuning> {
  const source =
    typeof input === "object" && input !== null ? (input as Partial<Record<ActionButtonOffsetKey, Partial<ActionButtonOffsetTuning>>>) : {};

  return Object.fromEntries(
    ACTION_BUTTON_OFFSET_KEYS.map((key) => {
      const offset = source[key] ?? {};
      const fallback = fallbackOffsets[key] ?? defaultActionButtonOffsetTuning;

      return [
        key,
        {
          x: clampNumber(offset.x, -320, 320, fallback.x),
          y: clampNumber(offset.y, -320, 320, fallback.y),
        },
      ];
    }),
  ) as Record<ActionButtonOffsetKey, ActionButtonOffsetTuning>;
}

function normalizeClassicActionButtonSlots(
  input: unknown,
  fallbackSlots = DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS,
): Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>> {
  const source =
    typeof input === "object" && input !== null
      ? (input as Partial<Record<ClassicActionWheelMode, Partial<Record<ActionButtonOffsetKey, Partial<ClassicActionButtonSlotTuning>>>>>)
      : {};

  return Object.fromEntries(
    CLASSIC_ACTION_WHEEL_MODES.map((mode) => {
      const modeSlots = typeof source[mode] === "object" && source[mode] !== null ? source[mode] : {};

      return [
        mode,
        Object.fromEntries(
          ACTION_BUTTON_OFFSET_KEYS.map((key) => {
            const slot = modeSlots[key] ?? {};
            const fallback = fallbackSlots[mode]?.[key] ?? defaultClassicActionButtonSlotTuning;

            return [
              key,
              {
                x: clampNumber(slot.x, -240, 240, fallback.x),
                y: clampNumber(slot.y, -320, 80, fallback.y),
                rotation: clampNumber(slot.rotation, -180, 180, fallback.rotation),
              },
            ];
          }),
        ) as Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>,
      ];
    }),
  ) as Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>>;
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

function normalizeEquipment(input: unknown, fallbackEquipment = DEFAULT_EQUIPMENT): Record<EquipmentSlotKey, EquipmentTuning> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<EquipmentSlotKey, Partial<EquipmentTuning>>>) : {};

  return Object.fromEntries(
    EQUIPMENT_SLOT_KEYS.map((key) => {
      const part = source[key] ?? {};
      const fallback = fallbackEquipment[key] ?? defaultRigPartTuning;

      return [key, normalizeEquipmentTuning(part, fallback)];
    }),
  ) as Record<EquipmentSlotKey, EquipmentTuning>;
}

function normalizeEquipmentItems(input: unknown, fallbackItems = DEFAULT_EQUIPMENT_ITEM_TUNING): Record<string, EquipmentTuning> {
  const source = typeof input === "object" && input !== null ? (input as Record<string, Partial<EquipmentTuning>>) : {};
  const itemIds = [...new Set([...Object.keys(fallbackItems), ...Object.keys(source)])];

  return Object.fromEntries(
    itemIds.flatMap((itemId) => {
      if (!itemId) {
        return [];
      }

      const part = source[itemId] ?? {};
      const fallback = fallbackItems[itemId] ?? defaultRigPartTuning;

      return [[itemId, normalizeEquipmentTuning(part, fallback)]];
    }),
  );
}

function normalizeEquipmentTuning(part: Partial<EquipmentTuning>, fallback: EquipmentTuning): EquipmentTuning {
  return {
    x: clampNumber(part.x, -240, 240, fallback.x),
    y: clampNumber(part.y, -240, 240, fallback.y),
    angle: clampNumber(part.angle, -180, 180, fallback.angle),
    scaleX: clampNumber(part.scaleX, 0.1, 3, fallback.scaleX),
    scaleY: clampNumber(part.scaleY, 0.1, 3, fallback.scaleY),
    flipX: typeof part.flipX === "boolean" ? part.flipX : fallback.flipX,
    flipY: typeof part.flipY === "boolean" ? part.flipY : fallback.flipY,
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

function normalizeSlashArcs(input: unknown): Record<SlashArcAttackKey, SlashArcTuning> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<SlashArcAttackKey, unknown>>) : {};

  return Object.fromEntries(
    SLASH_ARC_ATTACK_KEYS.map((key) => [key, normalizeSlashArc(source[key], DEFAULT_SLASH_ARCS[key])]),
  ) as Record<SlashArcAttackKey, SlashArcTuning>;
}

function normalizeSlashArc(input: unknown, fallback: SlashArcTuning): SlashArcTuning {
  const source = typeof input === "object" && input !== null ? (input as Partial<SlashArcTuning>) : {};

  return {
    radius: clampNumber(source.radius, 1, 140, fallback.radius),
    width: clampNumber(source.width, 1, 24, fallback.width),
    color: Math.round(clampNumber(source.color, 0, 0xffffff, fallback.color)),
    alpha: clampNumber(source.alpha, 0.1, 1, fallback.alpha),
    duration: clampNumber(source.duration, 30, 1000, fallback.duration),
    offsetX: clampNumber(source.offsetX, -240, 240, fallback.offsetX),
    offsetY: clampNumber(source.offsetY, -240, 240, fallback.offsetY),
    startAngle: clampNumber(source.startAngle, -6.28, 6.28, fallback.startAngle),
    endAngle: clampNumber(source.endAngle, -6.28, 6.28, fallback.endAngle),
    angle: clampNumber(source.angle, -180, 180, fallback.angle),
    sweep: clampNumber(source.sweep, -180, 180, fallback.sweep),
  };
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

function isActionButtonOffsetKey(value: unknown): value is ActionButtonOffsetKey {
  return typeof value === "string" && ACTION_BUTTON_OFFSET_KEYS.includes(value as ActionButtonOffsetKey);
}

function isClassicActionWheelMode(value: unknown): value is ClassicActionWheelMode {
  return typeof value === "string" && CLASSIC_ACTION_WHEEL_MODES.includes(value as ClassicActionWheelMode);
}

function isBodyAnimationKey(value: unknown): value is BodyAnimationKey {
  return typeof value === "string" && BODY_ANIMATION_KEYS.includes(value as BodyAnimationKey);
}

export function isSlashArcAttackKey(value: unknown): value is SlashArcAttackKey {
  return typeof value === "string" && SLASH_ARC_ATTACK_KEYS.includes(value as SlashArcAttackKey);
}

function isAnimationEditMode(value: unknown): value is AnimationEditMode {
  return typeof value === "string" && ANIMATION_EDIT_MODES.includes(value as AnimationEditMode);
}

function isCharacterCanvasEditMode(value: unknown): value is CharacterCanvasEditMode {
  return typeof value === "string" && CHARACTER_CANVAS_EDIT_MODES.includes(value as CharacterCanvasEditMode);
}

function isDebugHudMode(value: unknown): value is PlayerHudMode {
  return value === "immersive" || value === "classic";
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
  if (!shouldPersistDebugTuning || typeof window === "undefined") {
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
