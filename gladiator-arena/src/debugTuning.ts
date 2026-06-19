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
export const BODY_ANIMATION_DEFAULT_VARIANT_ID = "default";
export const BODY_ANIMATION_WEAPON_CLASSES = ["sword", "axe", "bow", "mace", "spear", "shuriken"] as const;
export type BodyAnimationWeaponClass = (typeof BODY_ANIMATION_WEAPON_CLASSES)[number];

export const SLASH_ARC_ATTACK_KEYS = ["light", "medium", "heavy"] as const;
export type SlashArcAttackKey = (typeof SLASH_ARC_ATTACK_KEYS)[number];

export type DebugPopupPreviewKind = "all" | "damage" | "block" | "armorAbsorb" | "armorBreak";

export const ACTION_BUTTON_OFFSET_KEYS = ["forward", "back", "lunge", "light", "medium", "heavy", "switchWeapon", "shuriken", "taunt", "rest"] as const;
export type ActionButtonOffsetKey = (typeof ACTION_BUTTON_OFFSET_KEYS)[number];

export const CLASSIC_ACTION_WHEEL_MODES = ["distance", "clinch", "bowDistance"] as const;
export type ClassicActionWheelMode = (typeof CLASSIC_ACTION_WHEEL_MODES)[number];

export const CLASSIC_ACTION_WHEEL_BUTTONS: Record<ClassicActionWheelMode, ActionButtonOffsetKey[]> = {
  distance: ["forward", "lunge", "back", "switchWeapon", "shuriken", "taunt", "rest"],
  clinch: ["light", "medium", "heavy", "back", "shuriken", "taunt", "rest"],
  bowDistance: ["light", "medium", "heavy", "switchWeapon", "shuriken", "back", "taunt", "rest"],
};

export const ANIMATION_EDIT_MODES = ["poseA", "poseB", "keyframe", "preview"] as const;
export type AnimationEditMode = (typeof ANIMATION_EDIT_MODES)[number];

export const BODY_ANIMATION_KEYFRAME_EASINGS = ["linear", "easeInOut", "hold"] as const;
export type BodyAnimationKeyframeEasing = (typeof BODY_ANIMATION_KEYFRAME_EASINGS)[number];

export const ANIMATION_ROOT_TRANSFORM_MODES = ["rootOffset", "poseOffset"] as const;
export type AnimationRootTransformMode = (typeof ANIMATION_ROOT_TRANSFORM_MODES)[number];

export const CHARACTER_CANVAS_EDIT_MODES = ["parts", "bodyArt", "equipment", "face", "root"] as const;
export type CharacterCanvasEditMode = (typeof CHARACTER_CANVAS_EDIT_MODES)[number];

export const PAPER_DOLL_BODY_PRESETS = ["classic", "dummy-v2"] as const;
export type PaperDollBodyPreset = (typeof PAPER_DOLL_BODY_PRESETS)[number];
export const PAPER_DOLL_BODY_PRESET_OPTIONS: { value: PaperDollBodyPreset; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "dummy-v2", label: "Dummy V2" },
];

export const FACE_PART_KEYS = ["eyeLeft", "eyeRight"] as const;
export type FacePartKey = (typeof FACE_PART_KEYS)[number];

export const FACE_ASSET_LAYER_KEYS = ["pupilLeft", "pupilRight", "browLeft", "browRight"] as const;
export type FaceAssetLayerKey = (typeof FACE_ASSET_LAYER_KEYS)[number];

export const APPEARANCE_LAYER_KEYS = ["hair", "beard"] as const;
export type AppearanceLayerKey = (typeof APPEARANCE_LAYER_KEYS)[number];

export const EQUIPMENT_SLOT_KEYS = [
  "weaponMain",
  "weaponBow",
  "helmet",
  "breastplate",
  "backShoulderguard",
  "frontShoulderguard",
  "backWrist",
  "frontWrist",
  "backGlove",
  "frontGlove",
  "shield",
  "backGreave",
  "frontGreave",
  "backShinguard",
  "frontShinguard",
  "backBoot",
  "frontBoot",
] as const;
export type EquipmentSlotKey = (typeof EQUIPMENT_SLOT_KEYS)[number];

export const RIG_PART_ANGLE_MIN = -2160;
export const RIG_PART_ANGLE_MAX = 2160;

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

export interface FaceAssetLayerTuning {
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
}

export interface AppearanceLayerTuning {
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
}

export type BodyPartLayerTuning = RigPartTuning;

export type EquipmentTuning = RigPartTuning;

export interface BodyAnimationRootOffset {
  x: number;
  y: number;
}

export interface BodyAnimationKeyframe {
  id: string;
  time: number;
  easing: BodyAnimationKeyframeEasing;
  rigParts: Record<RigPartKey, RigPartTuning>;
  faceParts: Record<FacePartKey, FacePartTuning>;
  rootOffset: BodyAnimationRootOffset;
}

export interface BodyAnimationTuning {
  enabled: boolean;
  duration: number;
  variantId?: string;
  variantLabel?: string;
  variantWeight?: number;
  appliesToAllWeapons?: boolean;
  weaponClasses?: BodyAnimationWeaponClass[];
  selectedVariantId?: string;
  base: Record<RigPartKey, RigPartTuning>;
  breath: Record<RigPartKey, RigPartTuning>;
  faceBase: Record<FacePartKey, FacePartTuning>;
  faceBreath: Record<FacePartKey, FacePartTuning>;
  activeParts: Record<RigPartKey, boolean>;
  movementStartKeyframeId?: string;
  impactKeyframeId?: string;
  keyframes?: BodyAnimationKeyframe[];
  variants?: BodyAnimationTuning[];
}

export type IdleAnimationTuning = BodyAnimationTuning;

export interface BodyPresetTuning {
  rigParts: Record<RigPartKey, RigPartTuning>;
  bodyPartLayers: Record<RigPartKey, BodyPartLayerTuning>;
  faceParts: Record<FacePartKey, FacePartTuning>;
  faceAssetLayers: Record<FaceAssetLayerKey, FaceAssetLayerTuning>;
  appearanceLayers: Record<AppearanceLayerKey, AppearanceLayerTuning>;
  bodyAnimations: Record<BodyAnimationKey, BodyAnimationTuning>;
}

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
  debugTuningVersion: number;
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
  characterPreviewArmorGhosted: boolean;
  facePreviewScale: number;
  facePreviewFocusX: number;
  facePreviewFocusY: number;
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
  paperDollBodyPreset: PaperDollBodyPreset;
  bodyPresetTuning: Record<PaperDollBodyPreset, BodyPresetTuning>;
  selectedFaceAssetLayer: FaceAssetLayerKey;
  selectedAppearanceLayer: AppearanceLayerKey;
  faceAssetLayers: Record<FaceAssetLayerKey, FaceAssetLayerTuning>;
  appearanceLayers: Record<AppearanceLayerKey, AppearanceLayerTuning>;
  selectedRigPart: RigPartKey;
  selectedRigParts: RigPartKey[];
  rigParts: Record<RigPartKey, RigPartTuning>;
  faceParts: Record<FacePartKey, FacePartTuning>;
  equipment: Record<EquipmentSlotKey, EquipmentTuning>;
  equipmentItems: Record<string, EquipmentTuning>;
  animationEditMode: AnimationEditMode;
  animationPreviewProgress: number;
  animationPreviewPlaybackSpeed: number;
  animationPreviewRandomWeapon: boolean;
  animationPreviewWeaponItemId: string | null;
  animationEditorZoom: number;
  animationEditorOffsetX: number;
  animationEditorOffsetY: number;
  animationRootTransformMode: AnimationRootTransformMode;
  selectedAnimationKeyframeId: string;
  selectedBodyAnimation: BodyAnimationKey;
  selectedBodyAnimationVariantId: string;
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

export const defaultBodyPartLayerTuning: BodyPartLayerTuning = { ...defaultRigPartTuning };

export const defaultBodyAnimationRootOffset: BodyAnimationRootOffset = {
  x: 0,
  y: 0,
};

export const defaultFacePartTuning: FacePartTuning = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
};

export const defaultFaceAssetLayerTuning: FaceAssetLayerTuning = {
  x: 0,
  y: 0,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
};

export const defaultAppearanceLayerTuning: AppearanceLayerTuning = {
  x: 0,
  y: 0,
  angle: 0,
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
  switchWeapon: { x: 0, y: 0 },
  shuriken: { x: 0, y: 0 },
  taunt: { x: 23, y: -24 },
  rest: { x: 19, y: -29 },
};

export const defaultClassicActionButtonSlotTuning: ClassicActionButtonSlotTuning = {
  x: 0,
  y: 18,
  rotation: 0,
};

const CLASSIC_SWITCH_HIDDEN_Y_THRESHOLD = -20;

export const DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS: Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>> = {
  distance: createClassicActionButtonSlots({
    forward: { x: 60, y: -185, rotation: -10 },
    back: { x: -60, y: -185, rotation: -12 },
    lunge: { x: 0, y: -200, rotation: 10 },
    light: { x: 70, y: 18, rotation: 0 },
    medium: { x: 0, y: 18, rotation: 0 },
    heavy: { x: 0, y: 18, rotation: 0 },
    switchWeapon: { x: -145, y: -200, rotation: -14 },
    shuriken: { x: 100, y: -148, rotation: 12 },
    taunt: { x: 30, y: -120, rotation: 0 },
    rest: { x: -30, y: -120, rotation: 12 },
  }),
  clinch: createClassicActionButtonSlots({
    forward: { x: 0, y: 26, rotation: 0 },
    back: { x: -145, y: -135, rotation: -12 },
    lunge: { x: 20, y: 18, rotation: 0 },
    light: { x: -60, y: -185, rotation: 0 },
    medium: { x: 0, y: -200, rotation: 0 },
    heavy: { x: 60, y: -185, rotation: 0 },
    switchWeapon: { x: -120, y: -92, rotation: -18 },
    shuriken: { x: 100, y: -148, rotation: 12 },
    taunt: { x: 30, y: -120, rotation: 0 },
    rest: { x: -30, y: -120, rotation: 12 },
  }),
  bowDistance: createClassicActionButtonSlots({
    forward: { x: -40, y: -52, rotation: -6 },
    back: { x: -145, y: -135, rotation: -14 },
    lunge: { x: 0, y: 18, rotation: 0 },
    light: { x: -60, y: -185, rotation: -14 },
    medium: { x: 0, y: -200, rotation: 0 },
    heavy: { x: 60, y: -185, rotation: 14 },
    switchWeapon: { x: -145, y: -200, rotation: 0 },
    shuriken: { x: 95, y: -118, rotation: 10 },
    taunt: { x: 30, y: -130, rotation: 5 },
    rest: { x: -30, y: -130, rotation: -5 },
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

export const DEFAULT_FACE_ASSET_LAYERS: Record<FaceAssetLayerKey, FaceAssetLayerTuning> = {
  pupilLeft: { x: -20, y: -44, angle: 0, scaleX: 1, scaleY: 1 },
  pupilRight: { x: 20, y: -44, angle: 0, scaleX: 1, scaleY: 1 },
  browLeft: { x: -18, y: -63, angle: -7, scaleX: 0.32, scaleY: 0.32 },
  browRight: { x: 18, y: -63, angle: 7, scaleX: 0.32, scaleY: 0.32 },
};

export const DEFAULT_APPEARANCE_LAYERS: Record<AppearanceLayerKey, AppearanceLayerTuning> = {
  hair: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1 },
  beard: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1 },
};

export const DEFAULT_BODY_PART_LAYERS: Record<RigPartKey, BodyPartLayerTuning> = createDefaultBodyPartLayers();

export const DEFAULT_EQUIPMENT: Record<EquipmentSlotKey, EquipmentTuning> = {
  weaponMain: { x: 3, y: 35, angle: 55, scaleX: 0.6, scaleY: 0.49, flipX: false, flipY: false },
  weaponBow: { x: 3, y: 35, angle: 55, scaleX: 0.6, scaleY: 0.49, flipX: false, flipY: false },
  helmet: { x: -1, y: 6, angle: 0, scaleX: 0.84, scaleY: 0.94, flipX: false, flipY: false },
  breastplate: { x: 0, y: 13, angle: 0, scaleX: 1.04, scaleY: 1.49, flipX: false, flipY: false },
  backShoulderguard: { x: 6, y: 1, angle: 9, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  frontShoulderguard: { x: 8, y: -3, angle: 13, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  backWrist: { x: -1, y: -3, angle: -4, scaleX: 1.26, scaleY: 1.1, flipX: true, flipY: false },
  frontWrist: { x: 0, y: -3, angle: 14, scaleX: 1.5, scaleY: 1.11, flipX: true, flipY: false },
  backGlove: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  frontGlove: { x: -2, y: 0, angle: 0, scaleX: 1.07, scaleY: 1, flipX: false, flipY: false },
  shield: { x: 12, y: 14, angle: -8, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  backGreave: { x: -3, y: 0, angle: -8, scaleX: 1.6, scaleY: 1, flipX: false, flipY: false },
  frontGreave: { x: -6, y: 3, angle: -11, scaleX: 1.6, scaleY: 1, flipX: false, flipY: false },
  backShinguard: { x: -3, y: -3, angle: 4, scaleX: 1.5, scaleY: 1, flipX: false, flipY: false },
  frontShinguard: { x: -6, y: -3, angle: 0, scaleX: 1.5, scaleY: 1, flipX: false, flipY: false },
  backBoot: { x: 1, y: -1, angle: 0, scaleX: 1.42, scaleY: 1, flipX: false, flipY: false },
  frontBoot: { x: 1, y: 0, angle: 0, scaleX: 0.88, scaleY: 1, flipX: false, flipY: false },
};

export const DEFAULT_EQUIPMENT_ITEM_TUNING: Record<string, EquipmentTuning> = {
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
  "auto_equipment_breastplate_leather_01": { x: 0, y: 30, angle: 0, scaleX: 1.17, scaleY: 1.32, flipX: false, flipY: false },
  "auto_equipment_weapon_bow_01": { x: -73, y: -3, angle: 90, scaleX: 1.3, scaleY: 1.3, flipX: false, flipY: false },
  "auto_equipment_back_wrist_cloth_01": { x: -1.251, y: 21.408, angle: 4, scaleX: 1.77, scaleY: 1.18, flipX: false, flipY: false },
  "training_sword": { x: 3, y: 35, angle: 55, scaleX: 0.5, scaleY: 0.5, flipX: false, flipY: false },
  "auto_equipment_back_glove_leather_03": { x: 0, y: 14, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  "leather_back_greave_01": { x: -6, y: 15.657, angle: -17, scaleX: 2.1, scaleY: 1.13, flipX: true, flipY: false },
  "auto_equipment_back_greave_leather_01": { x: 0, y: 11, angle: -1, scaleX: 1.65, scaleY: 1, flipX: false, flipY: false },
  "auto_equipment_back_greave_cloth_01": { x: -5, y: 15.781, angle: -15, scaleX: 1.85, scaleY: 1.18, flipX: true, flipY: false },
  "auto_equipment_back_shinguard_cloth_01": { x: 0, y: 0, angle: 0, scaleX: 1.35, scaleY: 1, flipX: true, flipY: false },
  "auto_equipment_back_boot_cloth_01": { x: 2, y: -4, angle: 0, scaleX: 0.93, scaleY: 1.05, flipX: false, flipY: false },
  "auto_equipment_breastplate_druid_01": { x: 0, y: 54, angle: 0, scaleX: 1.12, scaleY: 1.55, flipX: false, flipY: false },
  "auto_equipment_helmet_druid_01": { x: 0, y: 57, angle: 0, scaleX: 1.51, scaleY: 1.74, flipX: false, flipY: false },
  "auto_equipment_back_shoulderguard_druid_01": { x: 14, y: 7, angle: 47, scaleX: 2.76, scaleY: 1.66, flipX: true, flipY: false },
  "auto_equipment_back_glove_druid_01": { x: 0, y: 14, angle: 0, scaleX: 1.16, scaleY: 1.27, flipX: false, flipY: false },
  "auto_equipment_back_greave_druid_01": { x: -4, y: 11, angle: -8, scaleX: 1.57, scaleY: 1.18, flipX: true, flipY: false },
  "auto_equipment_back_wrist_druid_01": { x: 0, y: 21, angle: -11, scaleX: 1.27, scaleY: 1.1, flipX: true, flipY: false },
  "auto_equipment_back_shinguard_druid_01": { x: 0, y: 0, angle: 4, scaleX: 1.59, scaleY: 1, flipX: false, flipY: false },
  "auto_equipment_back_boot_druid_01": { x: 12, y: -6, angle: 0, scaleX: 1.92, scaleY: 1.72, flipX: false, flipY: false },
  "auto_equipment_helmet_wood_boss_01": { x: 0, y: 25, angle: 0, scaleX: 1.16, scaleY: 1.12, flipX: false, flipY: false },
  "auto_equipment_helmet_sand_01": { x: 1, y: 36, angle: 0, scaleX: 1.05, scaleY: 1.22, flipX: false, flipY: false },
  "auto_equipment_breastplate_sand_01": { x: 0, y: 61, angle: 0, scaleX: 1.64, scaleY: 1.77, flipX: false, flipY: false },
  "auto_equipment_back_shoulderguard_sand_01": { x: 3, y: 18, angle: 1, scaleX: 1.6, scaleY: 1.48, flipX: false, flipY: false },
  "auto_equipment_back_wrist_sand_01": { x: -2, y: 14, angle: -3, scaleX: 1.55, scaleY: 1.51, flipX: false, flipY: false },
  "auto_equipment_back_glove_sand_01": { x: 0, y: 15, angle: 0, scaleX: 1.13, scaleY: 1.1, flipX: false, flipY: false },
  "auto_equipment_back_greave_sand_01": { x: -6, y: 0, angle: -4, scaleX: 1.29, scaleY: 1.29, flipX: false, flipY: false },
  "auto_equipment_weapon_shuriken_01": { x: -11, y: 29, angle: 91, scaleX: 0.35, scaleY: 0.35, flipX: false, flipY: false },
  "auto_equipment_weapon_mace_wood_boss_01": { x: -14, y: 7, angle: 116, scaleX: 1.87, scaleY: 2.03, flipX: false, flipY: false },
  "auto_equipment_breastplate_wood_boss_01": { x: 0, y: 61, angle: 0, scaleX: 1.46, scaleY: 1.61, flipX: false, flipY: false },
  "auto_equipment_back_greave_wood_boss_01": { x: -3, y: 4, angle: -2, scaleX: 1.53, scaleY: 1.27, flipX: false, flipY: false },
  "auto_equipment_back_shoulderguard_wood_boss_01": { x: 11, y: 7, angle: 59, scaleX: 1.53, scaleY: 1.2, flipX: true, flipY: false },
  "auto_equipment_back_wrist_wood_boss_01": { x: 1, y: -4, angle: -3, scaleX: 1.53, scaleY: 1.66, flipX: true, flipY: false },
  "auto_equipment_back_glove_wood_boss_01": { x: 0, y: 11, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  "auto_equipment_back_shinguard_wood_boss_01": { x: 0.233, y: -16.256, angle: 4, scaleX: 1.4, scaleY: 1.27, flipX: false, flipY: false },
  "auto_equipment_back_boot_wood_boss_01": { x: 5, y: -4, angle: 0, scaleX: 1.31, scaleY: 1.38, flipX: false, flipY: false },
  "auto_equipment_back_shinguard_sand_01": { x: -1, y: -1, angle: -2, scaleX: 1.1, scaleY: 1.1, flipX: false, flipY: false },
  "auto_equipment_back_boot_sand_01": { x: 4, y: -2, angle: 0, scaleX: 1.29, scaleY: 1.16, flipX: false, flipY: false },
  "auto_equipment_helmet_rust_champion_01": { x: -1, y: 29, angle: 0, scaleX: 0.97, scaleY: 1.16, flipX: false, flipY: false },
  "auto_equipment_back_boot_rust_champion_01": { x: 15.254, y: -5.479, angle: 0, scaleX: 1.92, scaleY: 1.49, flipX: false, flipY: false },
  "auto_equipment_back_glove_rust_champion_01": { x: 0, y: 11, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  "auto_equipment_back_greave_rust_champion_01": { x: -3.313, y: 8.876, angle: -10, scaleX: 1.1, scaleY: 1.01, flipX: false, flipY: false },
  "auto_equipment_back_shinguard_rust_champion_01": { x: 3, y: 0, angle: 3, scaleX: 1.1, scaleY: 1, flipX: false, flipY: false },
  "auto_equipment_back_shoulderguard_rust_champion_01": { x: 10, y: 10, angle: 48, scaleX: 1.45, scaleY: 1.4, flipX: true, flipY: false },
  "auto_equipment_back_wrist_rust_champion_01": { x: 0.507, y: -1.269, angle: -7, scaleX: 1.57, scaleY: 1.61, flipX: true, flipY: false },
  "auto_equipment_breastplate_rust_champion_01": { x: 0.28, y: 57, angle: 0, scaleX: 1.38, scaleY: 1.61, flipX: false, flipY: false },
  "auto_equipment_back_boot_executioner_01": { x: 8, y: -1, angle: 0, scaleX: 1.59, scaleY: 1.38, flipX: false, flipY: false },
  "auto_equipment_back_glove_executioner_01": { x: 0, y: 11, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  "auto_equipment_back_greave_executioner_01": { x: -3.141, y: 14.053, angle: -14, scaleX: 1.31, scaleY: 1.07, flipX: false, flipY: false },
  "auto_equipment_back_shinguard_executioner_01": { x: 2.546, y: -1.364, angle: 6, scaleX: 1.05, scaleY: 1.16, flipX: false, flipY: false },
  "auto_equipment_back_shoulderguard_executioner_01": { x: 5.627, y: 7.646, angle: -6, scaleX: 1.8, scaleY: 1.6, flipX: false, flipY: false },
  "auto_equipment_back_wrist_executioner_01": { x: 1.498, y: 17.491, angle: -13, scaleX: 1.26, scaleY: 1.1, flipX: true, flipY: false },
  "auto_equipment_breastplate_executioner_01": { x: 1.426, y: 57.191, angle: 0, scaleX: 1.42, scaleY: 1.75, flipX: false, flipY: false },
  "auto_equipment_helmet_executioner_01": { x: 0.073, y: 39.696, angle: 0, scaleX: 1.2, scaleY: 1.25, flipX: false, flipY: false },
  "auto_equipment_back_boot_stormguard_01": { x: 9.001, y: -2.367, angle: 0, scaleX: 1.64, scaleY: 1.61, flipX: false, flipY: false },
  "auto_equipment_back_glove_stormguard_01": { x: -1.504, y: 14.158, angle: 3, scaleX: 1.23, scaleY: 1.2, flipX: false, flipY: false },
  "auto_equipment_back_greave_stormguard_01": { x: 2.821, y: 8.136, angle: -2, scaleX: 1.29, scaleY: 1.14, flipX: false, flipY: false },
  "auto_equipment_back_shinguard_stormguard_01": { x: 1.111, y: -2.93, angle: 1, scaleX: 1.4, scaleY: 1, flipX: false, flipY: false },
  "auto_equipment_back_glove_mercenary_01": { x: 0, y: 11, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  "generated_equipment_weapon_sword_norm_axe": { x: -9, y: 28, angle: 90, scaleX: 0.95, scaleY: 0.95, flipX: true, flipY: false },
  "generated_equipment_weapon_sword_uncommon_axe_1": { x: 0, y: 44, angle: 71, scaleX: 0.9, scaleY: 0.8, flipX: false, flipY: false },
  "generated_equipment_weapon_sword_uncommon_mace_5": { x: 0, y: 41, angle: 88, scaleX: 1.05, scaleY: 1.05, flipX: false, flipY: false },
  "generated_equipment_shield_common_01": { x: 0, y: 57, angle: -4, scaleX: 2.15, scaleY: 1.6, flipX: false, flipY: false },
  "generated_equipment_shield_common_02": { x: 0, y: 63, angle: 0, scaleX: 1.4, scaleY: 1.4, flipX: true, flipY: false },
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
    backThigh: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: 2, y: 33, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -19, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
  duration: 1500,
  variantId: "default",
  variantLabel: "default",
  variantWeight: 1,
  appliesToAllWeapons: true,
  selectedVariantId: "lunge2",
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
    head: { x: 104.828, y: 286.773, angle: 74.171, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: -8.164, y: 167.671, angle: 85.958, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: 96.995, y: 189.311, angle: -66.876, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    backForearm: { x: 183.627, y: 148.216, angle: -66.671, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    backHand: { x: 244.457, y: 124.864, angle: -65.745, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
    frontUpperArm: { x: 21.595, y: 309.956, angle: -37.416, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 56.547, y: 302.781, angle: -35.411, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: 78.941, y: 301.287, angle: -33.208, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
    backThigh: { x: -11.135, y: 152.511, angle: 91.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backShin: { x: -80.557, y: 118.59, angle: 80.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
    backFoot: { x: -162.362, y: 114.823, angle: 136.195, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontThigh: { x: -52.859, y: 184.082, angle: 52.559, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -112.481, y: 197.973, angle: 43.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -161.546, y: 208.209, angle: 41.166, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
  movementStartKeyframeId: "key-215",
  impactKeyframeId: "key-555",
  keyframes: [
    {
      id: "pose-a",
      time: 0,
      easing: "easeInOut",
      rigParts: {
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
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 0, y: 0 },
    },
    {
      id: "key-145",
      time: 164,
      easing: "easeInOut",
      rigParts: {
        head: { x: 85.949, y: 38.637, angle: 18.572, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 39.208, y: 28.451, angle: 23.748, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 58.902, y: 21.998, angle: 32.748, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 33.711, y: 15.459, angle: 9.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 41.574, y: 20.396, angle: 3.748, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
        frontUpperArm: { x: 83.515, y: 65.602, angle: 8.748, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 60.702, y: 74.235, angle: 29.748, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 14.78, y: 65.222, angle: 22.87, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 33.86, y: 46.066, angle: 26.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: 7.172, y: 73.11, angle: 30.748, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: 3.371, y: 104.071, angle: 22.762, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: 34.737, y: 56.165, angle: 2.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 25.761, y: 85.2, angle: 32.748, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -14.429, y: 106.049, angle: -0.55, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 0.133, y: 0.057 },
    },
    {
      id: "key-215",
      time: 316,
      easing: "easeInOut",
      rigParts: {
        head: { x: 101.785, y: 55.482, angle: 25.978, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 42.876, y: 35.128, angle: 29.445, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 72.859, y: 26.757, angle: 38.445, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 42.006, y: 15.99, angle: 15.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 43.4, y: 20.857, angle: 9.445, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
        frontUpperArm: { x: 92.698, y: 81.2, angle: 14.445, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 62.587, y: 88.767, angle: 35.445, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 9.215, y: 73.75, angle: 37.112, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 35.297, y: 49.631, angle: 32.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: 2.264, y: 73.166, angle: 36.445, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -17.239, y: 111.057, angle: 57.513, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: 34.97, y: 64.754, angle: 8.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 18.915, y: 94.713, angle: 38.445, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -28.013, y: 110.062, angle: -1.689, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: -3.162, y: 0 },
    },
    {
      id: "key-265",
      time: 443,
      easing: "easeInOut",
      rigParts: {
        head: { x: 127.281, y: -63.24, angle: 19.329, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 64.026, y: -90.488, angle: 30.97, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 89.96, y: -94.071, angle: -80.629, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 178.157, y: -154.94, angle: -80.875, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 245.725, y: -194.005, angle: -80.049, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
        frontUpperArm: { x: 100.949, y: -27.789, angle: -90.462, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 151.807, y: -100.973, angle: -70.408, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 196.351, y: -132.612, angle: -38.784, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 65.305, y: -78.777, angle: 36.245, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: 31.355, y: -52.715, angle: 25.536, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: 11.376, y: 3.461, angle: 80.842, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: 46.259, y: -67.36, angle: 24.279, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 12.083, y: -35.384, angle: 33.955, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -33.401, y: -10.433, angle: 65.918, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 3.008, y: 0 },
    },
    {
      id: "key-555",
      time: 627,
      easing: "easeInOut",
      rigParts: {
        head: { x: 142.795, y: 71.361, angle: 44.172, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 45.888, y: 8.5, angle: 55.959, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 105.54, y: 9.023, angle: -96.877, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 194.529, y: -71.092, angle: -96.672, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 266.338, y: -126.769, angle: -95.746, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
        frontUpperArm: { x: 89.042, y: 108.206, angle: -67.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 146.216, y: 68.307, angle: -65.412, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 194.059, y: 44.777, angle: -63.209, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 42.084, y: 8.552, angle: 61.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -15.194, y: 11.796, angle: 50.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -70.485, y: 48.515, angle: 106.197, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: 15.037, y: 31.756, angle: 49.56, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -46.377, y: 45.169, angle: 58.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -112.762, y: 48.648, angle: 92.168, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 2.911, y: 1.253 },
    },
    {
      id: "pose-b",
      time: 750,
      easing: "easeInOut",
      rigParts: {
        head: { x: 104.828, y: 286.773, angle: 74.171, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: -8.164, y: 167.671, angle: 85.958, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 96.995, y: 189.311, angle: -66.876, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 183.627, y: 148.216, angle: -66.671, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 244.457, y: 124.864, angle: -65.745, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
        frontUpperArm: { x: 21.595, y: 309.956, angle: -37.416, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 56.547, y: 302.781, angle: -35.411, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 78.941, y: 301.287, angle: -33.208, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: -11.135, y: 152.511, angle: 91.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -80.557, y: 118.59, angle: 80.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -162.362, y: 114.823, angle: 136.195, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: -52.859, y: 184.082, angle: 52.559, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -112.481, y: 197.973, angle: 43.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -161.546, y: 208.209, angle: 41.166, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 0, y: 0 },
    },
    {
      id: "key-555-2",
      time: 930,
      easing: "easeInOut",
      rigParts: {
        head: { x: 88.771, y: 281.966, angle: 74.172, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: -24.222, y: 162.863, angle: 85.959, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 77.174, y: 184.503, angle: -84.877, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 167.688, y: 120.102, angle: -84.672, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 237.16, y: 78.012, angle: -83.746, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
        frontUpperArm: { x: 5.537, y: 305.15, angle: -82.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 66.747, y: 245.715, angle: -80.412, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 122.195, y: 207.007, angle: -78.209, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: -27.193, y: 147.702, angle: 91.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -96.616, y: 113.781, angle: 80.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -178.421, y: 110.014, angle: 136.197, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: -68.917, y: 179.274, angle: 79.56, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -148.614, y: 158.092, angle: 88.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -225.282, y: 126.991, angle: 122.168, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: -2.459, y: 0 },
    },
    {
      id: "key-691",
      time: 1011,
      easing: "easeInOut",
      rigParts: {
        head: { x: 88.771, y: 281.966, angle: 74.172, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: -24.222, y: 162.863, angle: 85.959, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 77.174, y: 184.503, angle: -84.877, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 167.688, y: 120.102, angle: -84.672, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 237.16, y: 78.012, angle: -83.746, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
        frontUpperArm: { x: 5.537, y: 305.15, angle: -82.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 66.747, y: 245.715, angle: -80.412, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 122.195, y: 207.007, angle: -78.209, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: -27.193, y: 147.702, angle: 91.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -96.616, y: 113.781, angle: 80.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -178.421, y: 110.014, angle: 136.197, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: -68.917, y: 179.274, angle: 79.56, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -148.614, y: 158.092, angle: 88.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -225.282, y: 126.991, angle: 122.168, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: -2.459, y: 0 },
    },
    {
      id: "key-643",
      time: 1117,
      easing: "easeInOut",
      rigParts: {
        head: { x: 78.977, y: 251.213, angle: 74.544, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: -33.968, y: 132.293, angle: 85.908, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 67.355, y: 153.923, angle: -83.44, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 156.623, y: 90.665, angle: -83.327, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 224.866, y: 49.332, angle: -82.371, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
        frontUpperArm: { x: -3.962, y: 274.381, angle: -80.982, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 55.967, y: 215.896, angle: -78.333, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 109.578, y: 177.186, angle: -76.118, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: -36.937, y: 117.15, angle: 70.218, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -100.043, y: 104.563, angle: 53.241, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -136.645, y: 133.388, angle: 55.116, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: -78.636, y: 147.45, angle: 28.004, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -114.027, y: 178.178, angle: 73.029, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -190.286, y: 165.388, angle: 69.293, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: -0.545, y: 0.356 },
    },
    {
      id: "key-681",
      time: 1256,
      easing: "easeInOut",
      rigParts: {
        head: { x: 89.753, y: 178.136, angle: 98.303, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: -20.119, y: 70.983, angle: 82.634, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 76.504, y: 91.903, angle: 8.406, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 86.116, y: 101.778, angle: 2.642, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 75.736, y: 108.807, angle: 5.526, scaleX: 1.129, scaleY: 1.063, flipX: true, flipY: false },
        frontUpperArm: { x: 25.65, y: 200.367, angle: 10.771, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 3.653, y: 202.531, angle: 54.583, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -60.166, y: 163.706, angle: 57.551, scaleX: 1.112, scaleY: 1.047, flipX: true, flipY: false },
        backThigh: { x: -22.975, y: 56.951, angle: 87.742, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -89.596, y: 25.618, angle: 77.221, scaleX: 0.944, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -169.05, y: 23.428, angle: 130.929, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: -63.095, y: 87.301, angle: 43.482, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -117.241, y: 101.996, angle: 37.386, scaleX: 0.964, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -167.376, y: 121.168, angle: 0.442, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: -0.015, y: 1.942 },
    },
    {
      id: "key-734",
      time: 1381,
      easing: "easeInOut",
      rigParts: {
        head: { x: 83.412, y: 134.997, angle: 98.109, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: -26.485, y: 27.749, angle: 82.661, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 83.977, y: 56.19, angle: 7.656, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 92.984, y: 60.457, angle: 1.94, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 83.246, y: 64.587, angle: 4.809, scaleX: 1.129, scaleY: 1.063, flipX: true, flipY: false },
        frontUpperArm: { x: 19.155, y: 157.236, angle: 10.022, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: -2.173, y: 158.905, angle: 53.498, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -65.034, y: 120.081, angle: 56.46, scaleX: 1.112, scaleY: 1.047, flipX: true, flipY: false },
        backThigh: { x: -29.342, y: 13.707, angle: 84.77, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -94.731, y: -5.12, angle: 62.246, scaleX: 0.944, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -154.129, y: 21.487, angle: 82.971, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: -69.475, y: 44.067, angle: 43.772, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -123.827, y: 58.475, angle: 37.799, scaleX: 0.964, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -174.175, y: 77.242, angle: 1.42, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: -3.08, y: 1.94 },
    },
  ],
  variants: [
{
      enabled: true,
      duration: 800,
      variantId: "lunge2",
      variantLabel: "lunge2",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["axe"],
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
        head: { x: 112.982, y: 49.401, angle: 40.853, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 41.811, y: 12.169, angle: 37.521, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 75.067, y: 21.783, angle: -126.294, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 146.305, y: -86.202, angle: -84.274, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 218.243, y: -137.423, angle: -75.189, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
        frontUpperArm: { x: 79.536, y: 84.588, angle: -66.275, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 133.707, y: 45.769, angle: -46.6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 167.357, y: 37.502, angle: -38.485, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 42.024, y: 20.743, angle: 57.804, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -11.415, y: 25.796, angle: 77.044, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -79.147, y: 35.118, angle: 102.462, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: 20.66, y: 35.048, angle: -2.115, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 19.912, y: 71.96, angle: 13.484, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -7.113, y: 108.181, angle: 69.706, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      movementStartKeyframeId: "key-215",
      impactKeyframeId: "key-743",
      keyframes: [
        {
          id: "pose-a",
          time: 0,
          easing: "easeInOut",
          rigParts: {
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
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-145",
          time: 72,
          easing: "easeInOut",
          rigParts: {
            head: { x: 87.035, y: 45.137, angle: 30.572, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 39.208, y: 28.451, angle: 23.748, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 58.902, y: 21.998, angle: 32.748, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 33.711, y: 15.459, angle: 9.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 41.574, y: 20.396, angle: 3.748, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 83.515, y: 65.602, angle: 8.748, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 60.702, y: 74.235, angle: 29.748, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 14.78, y: 65.222, angle: 22.87, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 33.86, y: 46.066, angle: 26.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 7.172, y: 73.11, angle: 30.748, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: 3.371, y: 104.071, angle: 22.762, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 34.737, y: 56.165, angle: 2.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 25.761, y: 85.2, angle: 32.748, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -14.429, y: 106.049, angle: -0.55, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0.133, y: 0.057 },
        },
        {
          id: "key-215",
          time: 149.091,
          easing: "easeInOut",
          rigParts: {
            head: { x: 101.785, y: 55.482, angle: 25.978, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 42.876, y: 35.128, angle: 29.445, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 72.859, y: 26.757, angle: 38.445, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 42.006, y: 15.99, angle: 15.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 43.4, y: 20.857, angle: 9.445, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 92.698, y: 81.2, angle: 14.445, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 62.587, y: 88.767, angle: 35.445, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 9.215, y: 73.75, angle: 37.112, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 35.297, y: 49.631, angle: 32.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 2.264, y: 73.166, angle: 36.445, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -17.239, y: 111.057, angle: 57.513, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 34.97, y: 64.754, angle: 8.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 18.915, y: 94.713, angle: 38.445, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -28.013, y: 110.062, angle: -1.689, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -3.162, y: 0 },
        },
        {
          id: "key-309",
          time: 258.824,
          easing: "easeInOut",
          rigParts: {
            head: { x: 41.19, y: -182.437, angle: 18.403, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 22.096, y: -192.498, angle: 6.008, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 7.623, y: -179.602, angle: -105.053, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 90.27, y: -271.385, angle: -105.401, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 163.388, y: -348.888, angle: -89.672, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 37.539, y: -160.493, angle: -114.949, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 78.535, y: -260.255, angle: -94.891, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 129.92, y: -315.683, angle: -63.401, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 33.028, y: -172.412, angle: 44.126, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -7.522, y: -154.082, angle: 66.335, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -60.961, y: -132.55, angle: 82.662, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 15.992, y: -175.126, angle: -0.747, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 14.046, y: -137.83, angle: 41.873, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -42.53, y: -122.878, angle: 40.661, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 2.981, y: 0 },
        },
        {
          id: "key-353",
          time: 331.294,
          easing: "easeInOut",
          rigParts: {
            head: { x: 14.776, y: -100.417, angle: 23.936, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -14.328, y: -112.055, angle: 14.575, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -14.04, y: -91.996, angle: -180, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -8.893, y: -229.284, angle: -180, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -3.77, y: -353.519, angle: -180, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 8.616, y: -69.801, angle: -107.056, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 54.382, y: -160.639, angle: -88.877, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 105.804, y: -209.516, angle: -60.309, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: -6.7, y: -94.724, angle: 37.983, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -40.657, y: -75.274, angle: 60.334, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -68.787, y: -61.249, angle: 31.873, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: -24.368, y: -92.654, angle: -36.926, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 13.898, y: -71.33, angle: -0.24, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 3.661, y: -29.974, angle: 34.729, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 2.998, y: 0.13 },
        },
        {
          id: "pose-b",
          time: 400,
          easing: "easeInOut",
          rigParts: {
            head: { x: 112.982, y: 49.401, angle: 40.853, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 41.811, y: 12.169, angle: 37.521, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 75.067, y: 21.783, angle: -126.294, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 146.305, y: -86.202, angle: -84.274, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 218.243, y: -137.423, angle: -75.189, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 79.536, y: 84.588, angle: -66.275, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 133.707, y: 45.769, angle: -46.6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 167.357, y: 37.502, angle: -38.485, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 42.024, y: 20.743, angle: 57.804, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -11.415, y: 25.796, angle: 77.044, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -79.147, y: 35.118, angle: 102.462, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 20.66, y: 35.048, angle: -2.115, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 19.912, y: 71.96, angle: 13.484, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -7.113, y: 108.181, angle: 69.706, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-743",
          time: 464.941,
          easing: "easeInOut",
          rigParts: {
            head: { x: 138.783, y: 80.452, angle: 24.925, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 65.448, y: 45.784, angle: 38.485, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 108.634, y: 39.29, angle: -38.759, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 175.155, y: 34.987, angle: -25.159, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 206.216, y: 34.106, angle: -10.935, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 110.771, y: 116.357, angle: -53.829, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 154.176, y: 91.564, angle: -21.491, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 161.96, y: 96.876, angle: -13.606, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 60.222, y: 54.338, angle: 50.11, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 11.949, y: 64.786, angle: 61.715, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -37.587, y: 85.575, angle: 84.955, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 47.703, y: 73.258, angle: 8.184, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 33.452, y: 105.296, angle: 30.997, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -7.445, y: 127.22, angle: 38.95, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -0.092, y: 0.117 },
        },
        {
          id: "key-757",
          time: 592,
          easing: "linear",
          rigParts: {
            head: { x: 132.349, y: 120.48, angle: 51.286, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 48.339, y: 70, angle: 46.723, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 107.451, y: 70.646, angle: -27.159, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 161.318, y: 67.615, angle: -22.624, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 192.468, y: 70.386, angle: -13.41, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 101.711, y: 152.852, angle: -39.073, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 134.632, y: 140.672, angle: -4.314, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 123.187, y: 143.429, angle: 4.232, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 43.745, y: 76.602, angle: 38.211, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 6.197, y: 91.679, angle: 47.933, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -26.165, y: 130.683, angle: 70.635, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 39.383, y: 80.202, angle: 0.726, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 32.898, y: 109.942, angle: 56.685, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -20.496, y: 116.533, angle: 9.955, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -0.852, y: 0.088 },
        },
        {
          id: "key-560",
          time: 709.647,
          easing: "easeInOut",
          rigParts: {
            head: { x: 92.338, y: 53.354, angle: 10.978, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 33.429, y: 33, angle: 29.445, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 63.412, y: 24.629, angle: 38.445, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 32.56, y: 13.861, angle: 15.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 33.953, y: 18.729, angle: 9.445, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 83.251, y: 79.072, angle: 14.445, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 53.141, y: 86.638, angle: 35.445, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -0.231, y: 71.622, angle: 37.112, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 25.85, y: 47.502, angle: 32.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -7.183, y: 71.038, angle: 36.445, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -26.686, y: 108.929, angle: 57.513, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 25.523, y: 62.625, angle: 8.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 9.468, y: 92.584, angle: 38.445, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -37.46, y: 107.933, angle: -1.689, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -3.162, y: 0 },
        },
      ],
    }
  ],
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
  variantId: "default",
  variantLabel: "default",
  variantWeight: 1,
  appliesToAllWeapons: true,
  selectedVariantId: "medium2",
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
  keyframes: [
    {
      id: "pose-a",
      time: 0,
      easing: "easeInOut",
      rigParts: {
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
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 0, y: 0 },
    },
    {
      id: "pose-b",
      time: 250,
      easing: "easeInOut",
      rigParts: {
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
      faceParts: {
        eyeLeft: { x: 1.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 14.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 0, y: 0 },
    },
  ],
  variants: [
{
      enabled: true,
      duration: 500,
      variantId: "medium2",
      variantLabel: "medium2",
      variantWeight: 1,
      appliesToAllWeapons: true,
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
        head: { x: 31.107, y: -4.698, angle: 23.341, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 8.785, y: -15.949, angle: 11.67, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 6.308, y: -10.025, angle: -49.599, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 76.83, y: -21.466, angle: -51.517, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 141.747, y: -53.488, angle: -54.176, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
        frontUpperArm: { x: 44.451, y: -2.229, angle: -11.67, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 48.344, y: 6.796, angle: -11.753, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 44.965, y: 12.099, angle: -7.258, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
        backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: -0.25, y: 0, angle: -2.588, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 0.269, y: 33.112, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -9.687, y: 72.114, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      keyframes: [
        {
          id: "pose-a",
          time: 0,
          easing: "easeInOut",
          rigParts: {
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
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-500",
          time: 108,
          easing: "easeInOut",
          rigParts: {
            head: { x: -24.219, y: -4.561, angle: -15, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -4.015, y: -15.002, angle: -12, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -29.026, y: 6.035, angle: 51, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -76.238, y: -16.031, angle: 49, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: -108.307, y: -25.832, angle: 35, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: 6.944, y: -24.027, angle: -12, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 11.25, y: -15.029, angle: -12, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 11.158, y: -10.536, angle: -8, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -0.25, y: 0, angle: -15, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 14.817, y: 27.992, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 5.81, y: 65.992, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-296",
          time: 148,
          easing: "easeInOut",
          rigParts: {
            head: { x: -42.286, y: -2.556, angle: -27, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -7.026, y: -16.004, angle: -18, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -31.033, y: 15.054, angle: 51, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -73.227, y: -9.017, angle: 49, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: -108.307, y: -25.832, angle: 35, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: -6.104, y: -28.035, angle: -12, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -1.798, y: -22.044, angle: -12, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -4.901, y: -14.544, angle: -8, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: 2.761, y: 0, angle: -24, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 30.876, y: 29.996, angle: -12, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 31.906, y: 67.996, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "pose-b",
          time: 250,
          easing: "easeInOut",
          rigParts: {
            head: { x: 31.107, y: -4.698, angle: 23.341, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 8.785, y: -15.949, angle: 11.67, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 6.308, y: -10.025, angle: -49.599, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 76.83, y: -21.466, angle: -51.517, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 141.747, y: -53.488, angle: -54.176, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: 44.451, y: -2.229, angle: -11.67, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 48.344, y: 6.796, angle: -11.753, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 44.965, y: 12.099, angle: -7.258, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -0.25, y: 0, angle: -2.588, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 0.269, y: 33.112, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -9.687, y: 72.114, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
      ],
    }
  ],
};
export const DEFAULT_HEAVY_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 600,
  variantId: "default",
  variantLabel: "default",
  variantWeight: 1,
  appliesToAllWeapons: true,
  selectedVariantId: "heavy2",
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
  keyframes: [
    {
      id: "pose-a",
      time: 0,
      easing: "easeInOut",
      rigParts: {
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
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 0, y: 0 },
    },
    {
      id: "pose-b",
      time: 300,
      easing: "easeInOut",
      rigParts: {
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
      faceParts: {
        eyeLeft: { x: 2.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 15, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 0, y: 0 },
    },
  ],
  variants: [
{
      enabled: true,
      duration: 1000,
      variantId: "heavy2",
      variantLabel: "heavy2",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["axe"],
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
        head: { x: -110.539, y: 10.471, angle: -45, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: -54.201, y: -15.002, angle: -30, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: -100.29, y: 31.66, angle: 12, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: -104.342, y: 41.231, angle: 16, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: -111.626, y: 43.243, angle: 8.048, scaleX: 1.1, scaleY: 0.9, flipX: true, flipY: false },
        frontUpperArm: { x: -89.413, y: -19.017, angle: -102, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: -30.906, y: -104.214, angle: -102, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 28.222, y: -166.86, angle: -101, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
        backThigh: { x: -39.145, y: 15.031, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: -33.134, y: 45.025, angle: -32, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: -35.38, y: -7.015, angle: -60.417, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 19.351, y: -14.648, angle: -18.738, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: 32.414, y: 22.856, angle: -6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      impactKeyframeId: "key-758-2",
      keyframes: [
        {
          id: "pose-a",
          time: 0,
          easing: "easeInOut",
          rigParts: {
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
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-537",
          time: 302,
          easing: "easeInOut",
          rigParts: {
            head: { x: -109.133, y: 10.215, angle: -44.427, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -53.511, y: -14.989, angle: -29.618, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -97.286, y: 40.547, angle: 95.656, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -158.482, y: -27.956, angle: 90.694, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -217.209, y: -101.577, angle: 102.701, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
            frontUpperArm: { x: -87.994, y: -18.915, angle: -100.701, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -30.369, y: -102.9, angle: -100.739, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 27.838, y: -164.767, angle: -99.472, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -38.647, y: 14.84, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -32.674, y: 44.872, angle: -31.58, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -34.933, y: -6.925, angle: -41.465, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 11.614, y: 8.256, angle: -23.694, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 29.387, y: 43.288, angle: -5.924, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-572",
          time: 371,
          easing: "easeInOut",
          rigParts: {
            head: { x: -38.32, y: -2.092, angle: -10.792, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -39.698, y: -9.965, angle: -2.195, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -57.496, y: 16.906, angle: 136.29, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -96.771, y: -100.17, angle: 131.413, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -129.352, y: -211.168, angle: 148.792, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
            frontUpperArm: { x: -33.226, y: 9.257, angle: -84.263, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 25.547, y: -54.241, angle: -84.343, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 80.843, y: -98.858, angle: -82.78, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -38.095, y: 14.628, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -32.164, y: 44.702, angle: -31.114, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -30.097, y: 15.924, angle: -25.873, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 0.551, y: 44.345, angle: -17.356, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 10.375, y: 80.503, angle: -2.839, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-516",
          time: 430,
          easing: "easeInOut",
          rigParts: {
            head: { x: -15.485, y: 3.902, angle: 12.731, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -39.201, y: -10.015, angle: 12.716, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -32.662, y: 8.44, angle: 153.721, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -51.162, y: -120.38, angle: 148.918, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -67.436, y: -240.56, angle: 165.754, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
            frontUpperArm: { x: -14.243, y: 24.222, angle: -72.578, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 41.395, y: -25.117, angle: -72.695, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 91.423, y: -58.562, angle: -70.876, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -37.618, y: 14.445, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -31.724, y: 44.556, angle: -30.713, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -36.574, y: 15.577, angle: -35.993, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -3.538, y: 38.87, angle: -5.938, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -2.92, y: 74.477, angle: -0.64, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-652",
          time: 491,
          easing: "easeInOut",
          rigParts: {
            head: { x: 4.118, y: 8.744, angle: 24.718, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -37.814, y: -10.156, angle: 21.272, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -22.442, y: 4.476, angle: 180, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -14.024, y: -135.83, angle: 180, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 2.945, y: -260.7, angle: 180, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
            frontUpperArm: { x: -5.578, y: 29.116, angle: -65.718, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 46.796, y: -12.779, angle: -65.937, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 92.806, y: -40.803, angle: -63.404, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -36.286, y: 13.933, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -30.495, y: 44.147, angle: -29.59, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -38.202, y: 8.941, angle: -29.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -6.065, y: 29.4, angle: -13.52, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -0.971, y: 67.346, angle: 0.256, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "pose-b",
          time: 500,
          easing: "easeInOut",
          rigParts: {
            head: { x: -110.539, y: 10.471, angle: -45, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -54.201, y: -15.002, angle: -30, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -100.29, y: 31.66, angle: 12, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -104.342, y: 41.231, angle: 16, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: -111.626, y: 43.243, angle: 8.048, scaleX: 1.1, scaleY: 0.9, flipX: true, flipY: false },
            frontUpperArm: { x: -89.413, y: -19.017, angle: -102, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -30.906, y: -104.214, angle: -102, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 28.222, y: -166.86, angle: -101, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -39.145, y: 15.031, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -33.134, y: 45.025, angle: -32, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -35.38, y: -7.015, angle: -60.417, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 19.351, y: -14.648, angle: -18.738, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 32.414, y: 22.856, angle: -6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-758",
          time: 545,
          easing: "easeInOut",
          rigParts: {
            head: { x: 47.806, y: 39.595, angle: 45.34, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -37.814, y: -10.156, angle: 47.785, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 29.77, y: -4.034, angle: 180, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 40.917, y: -144.068, angle: 180, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 59.079, y: -266.538, angle: 195, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
            frontUpperArm: { x: 19.995, y: 73.797, angle: -65.718, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 72.369, y: 31.901, angle: -65.937, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 118.379, y: 3.877, angle: -63.404, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -56.903, y: -9.9, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -56.537, y: 31.147, angle: 9.41, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -80.946, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -58.044, y: 5.381, angle: -17.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -34.665, y: 42.478, angle: -13.52, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -27.052, y: 77.522, angle: 0.256, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-590",
          time: 593,
          easing: "easeInOut",
          rigParts: {
            head: { x: 47.802, y: 39.59, angle: 45.335, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -37.808, y: -10.157, angle: 47.78, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 18.233, y: -4.067, angle: 222.368, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 79.99, y: -126.732, angle: 222.506, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 136.943, y: -223.249, angle: 234.746, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
            frontUpperArm: { x: 19.993, y: 73.77, angle: -65.598, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 72.295, y: 32.02, angle: -65.83, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 118.217, y: 4.105, angle: -63.33, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -56.907, y: -9.886, angle: 0.164, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -56.719, y: 31.056, angle: 9.465, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -81.203, y: 69.892, angle: -0.025, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -58.038, y: 5.452, angle: -17.989, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -34.657, y: 42.483, angle: -13.519, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -27.056, y: 77.513, angle: 0.256, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-731",
          time: 641,
          easing: "easeInOut",
          rigParts: {
            head: { x: 47.288, y: 38.919, angle: 44.635, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -37.047, y: -10.234, angle: 47.092, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 20.373, y: -8.701, angle: 232.529, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 92.001, y: -121.568, angle: 252.305, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 162.918, y: -189.168, angle: 271.534, scaleX: 1.259, scaleY: 1.059, flipX: true, flipY: false },
            frontUpperArm: { x: 19.666, y: 70.006, angle: -48.587, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 61.871, y: 48.814, angle: -50.618, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 95.254, y: 36.541, angle: -52.957, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -57.438, y: -7.87, angle: 23.362, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -82.486, y: 18.245, angle: 17.26, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -117.694, y: 54.564, angle: -3.594, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -57.159, y: 15.569, angle: -25.921, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -33.47, y: 43.189, angle: -13.247, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -27.625, y: 76.266, angle: 0.251, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-758-2",
          time: 701,
          easing: "easeInOut",
          rigParts: {
            head: { x: 46.941, y: 38.466, angle: 44.163, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -36.535, y: -10.286, angle: 46.628, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 14.083, y: -11.825, angle: 267.69, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 102.617, y: -83.285, angle: 270.654, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 171.309, y: -130.747, angle: 272.705, scaleX: 1.298, scaleY: 1.098, flipX: true, flipY: false },
            frontUpperArm: { x: 19.446, y: 67.469, angle: -37.121, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 54.845, y: 60.135, angle: -40.364, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 79.775, y: 58.404, angle: -45.964, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -57.796, y: -6.511, angle: 39, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -99.855, y: 9.608, angle: 22.514, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -142.291, y: 44.232, angle: -6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -56.566, y: 22.389, angle: -31.269, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -28.369, y: 43.664, angle: -13.063, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -23.707, y: 76.857, angle: 0.247, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-933",
          time: 773,
          easing: "easeInOut",
          rigParts: {
            head: { x: -110.539, y: 10.471, angle: -45, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -54.201, y: -15.002, angle: -30, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -100.29, y: 33.092, angle: 27, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -124.417, y: 34.073, angle: 25, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: -141.429, y: 35.295, angle: 14, scaleX: 1.1, scaleY: 0.9, flipX: true, flipY: false },
            frontUpperArm: { x: -89.413, y: -19.017, angle: -102, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -30.906, y: -104.214, angle: -102, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 28.222, y: -166.86, angle: -101, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -39.145, y: 15.031, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -33.134, y: 45.025, angle: -32, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -35.38, y: -7.015, angle: -42, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 11.806, y: 7.95, angle: -24, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 29.899, y: 42.944, angle: -6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
      ],
    }
  ],
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
  duration: 1000,
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

export const DEFAULT_BODY_PRESET_TUNING: Record<PaperDollBodyPreset, BodyPresetTuning> = {
  classic: {
    rigParts: cloneRigParts(DEFAULT_RIG_PARTS),
    bodyPartLayers: {
      head: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      torso: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      backUpperArm: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      backForearm: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      backHand: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      frontUpperArm: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      frontForearm: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      frontHand: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      backThigh: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      backShin: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      backFoot: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      frontThigh: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      frontShin: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      frontFoot: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    },
    faceParts: {
      eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    },
    faceAssetLayers: {
      pupilLeft: { x: -20, y: -44, angle: 0, scaleX: 1, scaleY: 1 },
      pupilRight: { x: 20, y: -44, angle: 0, scaleX: 1, scaleY: 1 },
      browLeft: { x: -18, y: -63, angle: -7, scaleX: 0.32, scaleY: 0.32 },
      browRight: { x: 18, y: -63, angle: 7, scaleX: 0.32, scaleY: 0.32 },
    },
    appearanceLayers: {
      hair: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1 },
      beard: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1 },
    },
    bodyAnimations: {
      idle: {
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
          backThigh: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
          backShin: { x: 2, y: 33, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
          backFoot: { x: -19, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
          frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      },
      walkCycle: {
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
      },
      lunge: {
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
      },
      light: {
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
      },
      medium: {
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
      },
      heavy: {
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
      },
      bowShot: {
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
      },
      hit: {
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
      },
      block: {
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
      },
      taunt: {
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
      },
      rest: {
        enabled: true,
        duration: 1000,
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
      },
    },
  },
  "dummy-v2": {
    rigParts: cloneRigParts(DEFAULT_RIG_PARTS),
    bodyPartLayers: {
      head: { x: 0, y: 0, angle: 0, scaleX: 0.9, scaleY: 0.97, flipX: false, flipY: false },
      torso: { x: 0, y: 10, angle: 0, scaleX: 1, scaleY: 1.07, flipX: false, flipY: false },
      backUpperArm: { x: 0, y: 0, angle: 0, scaleX: 0.94, scaleY: 1, flipX: false, flipY: false },
      backForearm: { x: 0.763, y: -2.21, angle: 2, scaleX: 1.08, scaleY: 1.07, flipX: false, flipY: false },
      backHand: { x: -2.889, y: 7.332, angle: -9, scaleX: 0.44, scaleY: 0.43, flipX: true, flipY: false },
      frontUpperArm: { x: 0, y: 0, angle: 0, scaleX: 0.94, scaleY: 1, flipX: false, flipY: false },
      frontForearm: { x: 0.763, y: -2.21, angle: 2, scaleX: 1.08, scaleY: 1.07, flipX: false, flipY: false },
      frontHand: { x: -2.889, y: 7.332, angle: -9, scaleX: 0.44, scaleY: 0.43, flipX: true, flipY: false },
      backThigh: { x: -6, y: -6, angle: -5, scaleX: 0.97, scaleY: 1.13, flipX: false, flipY: false },
      backShin: { x: -0.392, y: -1.202, angle: -1, scaleX: 1.06, scaleY: 1.08, flipX: false, flipY: false },
      backFoot: { x: -1.25, y: 1.562, angle: 0, scaleX: 0.78, scaleY: 0.73, flipX: true, flipY: false },
      frontThigh: { x: -6, y: -6, angle: -5, scaleX: 0.97, scaleY: 1.13, flipX: false, flipY: false },
      frontShin: { x: -0.392, y: -1.202, angle: -1, scaleX: 1.06, scaleY: 1.08, flipX: false, flipY: false },
      frontFoot: { x: -0.502, y: 2.302, angle: 0, scaleX: 0.78, scaleY: 0.73, flipX: true, flipY: false },
    },
    faceParts: {
      eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
    },
    faceAssetLayers: {
      pupilLeft: { x: -14, y: -43.5, angle: 0, scaleX: 1, scaleY: 1 },
      pupilRight: { x: 14, y: -44, angle: 0, scaleX: 1, scaleY: 1 },
      browLeft: { x: -14, y: -55.5, angle: -7, scaleX: 0.3, scaleY: 0.4 },
      browRight: { x: 15, y: -55.5, angle: 7, scaleX: 0.3, scaleY: 0.4 },
    },
    appearanceLayers: {
      hair: { x: 0, y: -7, angle: 0, scaleX: 1, scaleY: 0.97 },
      beard: { x: 0, y: 10.5, angle: 0, scaleX: 0.9, scaleY: 1 },
    },
    bodyAnimations: {
      idle: {
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
          backThigh: { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
          backShin: { x: 2, y: 33, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
          backFoot: { x: -19, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
          frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      },
      walkCycle: {
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
      },
      lunge: {
        enabled: true,
        duration: 1500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "lunge2",
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
          head: { x: 104.828, y: 286.773, angle: 74.171, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
          torso: { x: -8.164, y: 167.671, angle: 85.958, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
          backUpperArm: { x: 96.995, y: 189.311, angle: -66.876, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
          backForearm: { x: 183.627, y: 148.216, angle: -66.671, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
          backHand: { x: 244.457, y: 124.864, angle: -65.745, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
          frontUpperArm: { x: 21.595, y: 309.956, angle: -37.416, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
          frontForearm: { x: 56.547, y: 302.781, angle: -35.411, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
          frontHand: { x: 78.941, y: 301.287, angle: -33.208, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
          backThigh: { x: -11.135, y: 152.511, angle: 91.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          backShin: { x: -80.557, y: 118.59, angle: 80.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
          backFoot: { x: -162.362, y: 114.823, angle: 136.195, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          frontThigh: { x: -52.859, y: 184.082, angle: 52.559, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          frontShin: { x: -112.481, y: 197.973, angle: 43.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
          frontFoot: { x: -161.546, y: 208.209, angle: 41.166, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
        movementStartKeyframeId: "key-215",
        impactKeyframeId: "key-555",
        keyframes: [
          {
            id: "pose-a",
            time: 0,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "key-145",
            time: 164,
            easing: "easeInOut",
            rigParts: {
              head: { x: 85.949, y: 38.637, angle: 18.572, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 39.208, y: 28.451, angle: 23.748, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 58.902, y: 21.998, angle: 32.748, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 33.711, y: 15.459, angle: 9.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 41.574, y: 20.396, angle: 3.748, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
              frontUpperArm: { x: 83.515, y: 65.602, angle: 8.748, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 60.702, y: 74.235, angle: 29.748, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 14.78, y: 65.222, angle: 22.87, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 33.86, y: 46.066, angle: 26.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: 7.172, y: 73.11, angle: 30.748, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: 3.371, y: 104.071, angle: 22.762, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: 34.737, y: 56.165, angle: 2.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 25.761, y: 85.2, angle: 32.748, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -14.429, y: 106.049, angle: -0.55, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0.133, y: 0.057 },
          },
          {
            id: "key-215",
            time: 316,
            easing: "easeInOut",
            rigParts: {
              head: { x: 101.785, y: 55.482, angle: 25.978, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 42.876, y: 35.128, angle: 29.445, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 72.859, y: 26.757, angle: 38.445, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 42.006, y: 15.99, angle: 15.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 43.4, y: 20.857, angle: 9.445, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
              frontUpperArm: { x: 92.698, y: 81.2, angle: 14.445, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 62.587, y: 88.767, angle: 35.445, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 9.215, y: 73.75, angle: 37.112, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 35.297, y: 49.631, angle: 32.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: 2.264, y: 73.166, angle: 36.445, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -17.239, y: 111.057, angle: 57.513, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: 34.97, y: 64.754, angle: 8.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 18.915, y: 94.713, angle: 38.445, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -28.013, y: 110.062, angle: -1.689, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: -3.162, y: 0 },
          },
          {
            id: "key-265",
            time: 443,
            easing: "easeInOut",
            rigParts: {
              head: { x: 127.281, y: -63.24, angle: 19.329, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 64.026, y: -90.488, angle: 30.97, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 89.96, y: -94.071, angle: -80.629, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 178.157, y: -154.94, angle: -80.875, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 245.725, y: -194.005, angle: -80.049, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
              frontUpperArm: { x: 100.949, y: -27.789, angle: -90.462, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 151.807, y: -100.973, angle: -70.408, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 196.351, y: -132.612, angle: -38.784, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 65.305, y: -78.777, angle: 36.245, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: 31.355, y: -52.715, angle: 25.536, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: 11.376, y: 3.461, angle: 80.842, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: 46.259, y: -67.36, angle: 24.279, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 12.083, y: -35.384, angle: 33.955, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -33.401, y: -10.433, angle: 65.918, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 3.008, y: 0 },
          },
          {
            id: "key-555",
            time: 627,
            easing: "easeInOut",
            rigParts: {
              head: { x: 142.795, y: 71.361, angle: 44.172, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 45.888, y: 8.5, angle: 55.959, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 105.54, y: 9.023, angle: -96.877, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 194.529, y: -71.092, angle: -96.672, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 266.338, y: -126.769, angle: -95.746, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
              frontUpperArm: { x: 89.042, y: 108.206, angle: -67.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 146.216, y: 68.307, angle: -65.412, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 194.059, y: 44.777, angle: -63.209, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 42.084, y: 8.552, angle: 61.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -15.194, y: 11.796, angle: 50.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -70.485, y: 48.515, angle: 106.197, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: 15.037, y: 31.756, angle: 49.56, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -46.377, y: 45.169, angle: 58.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -112.762, y: 48.648, angle: 92.168, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 2.911, y: 1.253 },
          },
          {
            id: "pose-b",
            time: 750,
            easing: "easeInOut",
            rigParts: {
              head: { x: 104.828, y: 286.773, angle: 74.171, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: -8.164, y: 167.671, angle: 85.958, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 96.995, y: 189.311, angle: -66.876, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 183.627, y: 148.216, angle: -66.671, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 244.457, y: 124.864, angle: -65.745, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
              frontUpperArm: { x: 21.595, y: 309.956, angle: -37.416, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 56.547, y: 302.781, angle: -35.411, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 78.941, y: 301.287, angle: -33.208, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: -11.135, y: 152.511, angle: 91.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -80.557, y: 118.59, angle: 80.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -162.362, y: 114.823, angle: 136.195, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: -52.859, y: 184.082, angle: 52.559, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -112.481, y: 197.973, angle: 43.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -161.546, y: 208.209, angle: 41.166, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "key-555-2",
            time: 930,
            easing: "easeInOut",
            rigParts: {
              head: { x: 88.771, y: 281.966, angle: 74.172, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: -24.222, y: 162.863, angle: 85.959, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 77.174, y: 184.503, angle: -84.877, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 167.688, y: 120.102, angle: -84.672, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 237.16, y: 78.012, angle: -83.746, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
              frontUpperArm: { x: 5.537, y: 305.15, angle: -82.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 66.747, y: 245.715, angle: -80.412, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 122.195, y: 207.007, angle: -78.209, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: -27.193, y: 147.702, angle: 91.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -96.616, y: 113.781, angle: 80.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -178.421, y: 110.014, angle: 136.197, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: -68.917, y: 179.274, angle: 79.56, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -148.614, y: 158.092, angle: 88.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -225.282, y: 126.991, angle: 122.168, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: -2.459, y: 0 },
          },
          {
            id: "key-691",
            time: 1011,
            easing: "easeInOut",
            rigParts: {
              head: { x: 88.771, y: 281.966, angle: 74.172, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: -24.222, y: 162.863, angle: 85.959, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 77.174, y: 184.503, angle: -84.877, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 167.688, y: 120.102, angle: -84.672, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 237.16, y: 78.012, angle: -83.746, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
              frontUpperArm: { x: 5.537, y: 305.15, angle: -82.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 66.747, y: 245.715, angle: -80.412, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 122.195, y: 207.007, angle: -78.209, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: -27.193, y: 147.702, angle: 91.272, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -96.616, y: 113.781, angle: 80.288, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -178.421, y: 110.014, angle: 136.197, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: -68.917, y: 179.274, angle: 79.56, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -148.614, y: 158.092, angle: 88.821, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -225.282, y: 126.991, angle: 122.168, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: -2.459, y: 0 },
          },
          {
            id: "key-643",
            time: 1117,
            easing: "easeInOut",
            rigParts: {
              head: { x: 78.977, y: 251.213, angle: 74.544, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: -33.968, y: 132.293, angle: 85.908, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 67.355, y: 153.923, angle: -83.44, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 156.623, y: 90.665, angle: -83.327, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 224.866, y: 49.332, angle: -82.371, scaleX: 1.13, scaleY: 1.07, flipX: true, flipY: false },
              frontUpperArm: { x: -3.962, y: 274.381, angle: -80.982, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 55.967, y: 215.896, angle: -78.333, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 109.578, y: 177.186, angle: -76.118, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: -36.937, y: 117.15, angle: 70.218, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -100.043, y: 104.563, angle: 53.241, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -136.645, y: 133.388, angle: 55.116, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: -78.636, y: 147.45, angle: 28.004, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -114.027, y: 178.178, angle: 73.029, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -190.286, y: 165.388, angle: 69.293, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: -0.545, y: 0.356 },
          },
          {
            id: "key-681",
            time: 1256,
            easing: "easeInOut",
            rigParts: {
              head: { x: 89.753, y: 178.136, angle: 98.303, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: -20.119, y: 70.983, angle: 82.634, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 76.504, y: 91.903, angle: 8.406, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 86.116, y: 101.778, angle: 2.642, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 75.736, y: 108.807, angle: 5.526, scaleX: 1.129, scaleY: 1.063, flipX: true, flipY: false },
              frontUpperArm: { x: 25.65, y: 200.367, angle: 10.771, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 3.653, y: 202.531, angle: 54.583, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -60.166, y: 163.706, angle: 57.551, scaleX: 1.112, scaleY: 1.047, flipX: true, flipY: false },
              backThigh: { x: -22.975, y: 56.951, angle: 87.742, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -89.596, y: 25.618, angle: 77.221, scaleX: 0.944, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -169.05, y: 23.428, angle: 130.929, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: -63.095, y: 87.301, angle: 43.482, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -117.241, y: 101.996, angle: 37.386, scaleX: 0.964, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -167.376, y: 121.168, angle: 0.442, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: -0.015, y: 1.942 },
          },
          {
            id: "key-734",
            time: 1381,
            easing: "easeInOut",
            rigParts: {
              head: { x: 83.412, y: 134.997, angle: 98.109, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: -26.485, y: 27.749, angle: 82.661, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 83.977, y: 56.19, angle: 7.656, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 92.984, y: 60.457, angle: 1.94, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 83.246, y: 64.587, angle: 4.809, scaleX: 1.129, scaleY: 1.063, flipX: true, flipY: false },
              frontUpperArm: { x: 19.155, y: 157.236, angle: 10.022, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: -2.173, y: 158.905, angle: 53.498, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -65.034, y: 120.081, angle: 56.46, scaleX: 1.112, scaleY: 1.047, flipX: true, flipY: false },
              backThigh: { x: -29.342, y: 13.707, angle: 84.77, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -94.731, y: -5.12, angle: 62.246, scaleX: 0.944, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -154.129, y: 21.487, angle: 82.971, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: -69.475, y: 44.067, angle: 43.772, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -123.827, y: 58.475, angle: 37.799, scaleX: 0.964, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -174.175, y: 77.242, angle: 1.42, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: -3.08, y: 1.94 },
          },
        ],
        variants: [
{
            enabled: true,
            duration: 800,
            variantId: "lunge2",
            variantLabel: "lunge2",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["axe"],
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
              head: { x: 112.982, y: 49.401, angle: 40.853, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 41.811, y: 12.169, angle: 37.521, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 75.067, y: 21.783, angle: -126.294, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 146.305, y: -86.202, angle: -84.274, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 218.243, y: -137.423, angle: -75.189, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
              frontUpperArm: { x: 79.536, y: 84.588, angle: -66.275, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 133.707, y: 45.769, angle: -46.6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 167.357, y: 37.502, angle: -38.485, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 42.024, y: 20.743, angle: 57.804, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -11.415, y: 25.796, angle: 77.044, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -79.147, y: 35.118, angle: 102.462, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: 20.66, y: 35.048, angle: -2.115, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 19.912, y: 71.96, angle: 13.484, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -7.113, y: 108.181, angle: 69.706, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
            movementStartKeyframeId: "key-215",
            impactKeyframeId: "key-743",
            keyframes: [
              {
                id: "pose-a",
                time: 0,
                easing: "easeInOut",
                rigParts: {
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
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-145",
                time: 72,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 87.035, y: 45.137, angle: 30.572, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 39.208, y: 28.451, angle: 23.748, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 58.902, y: 21.998, angle: 32.748, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 33.711, y: 15.459, angle: 9.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 41.574, y: 20.396, angle: 3.748, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 83.515, y: 65.602, angle: 8.748, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 60.702, y: 74.235, angle: 29.748, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 14.78, y: 65.222, angle: 22.87, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 33.86, y: 46.066, angle: 26.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 7.172, y: 73.11, angle: 30.748, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: 3.371, y: 104.071, angle: 22.762, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 34.737, y: 56.165, angle: 2.748, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 25.761, y: 85.2, angle: 32.748, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -14.429, y: 106.049, angle: -0.55, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0.133, y: 0.057 },
              },
              {
                id: "key-215",
                time: 149.091,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 101.785, y: 55.482, angle: 25.978, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 42.876, y: 35.128, angle: 29.445, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 72.859, y: 26.757, angle: 38.445, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 42.006, y: 15.99, angle: 15.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 43.4, y: 20.857, angle: 9.445, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 92.698, y: 81.2, angle: 14.445, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 62.587, y: 88.767, angle: 35.445, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 9.215, y: 73.75, angle: 37.112, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 35.297, y: 49.631, angle: 32.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 2.264, y: 73.166, angle: 36.445, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -17.239, y: 111.057, angle: 57.513, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 34.97, y: 64.754, angle: 8.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 18.915, y: 94.713, angle: 38.445, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -28.013, y: 110.062, angle: -1.689, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -3.162, y: 0 },
              },
              {
                id: "key-309",
                time: 258.824,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 41.19, y: -182.437, angle: 18.403, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 22.096, y: -192.498, angle: 6.008, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 7.623, y: -179.602, angle: -105.053, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 90.27, y: -271.385, angle: -105.401, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 163.388, y: -348.888, angle: -89.672, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 37.539, y: -160.493, angle: -114.949, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 78.535, y: -260.255, angle: -94.891, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 129.92, y: -315.683, angle: -63.401, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 33.028, y: -172.412, angle: 44.126, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -7.522, y: -154.082, angle: 66.335, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -60.961, y: -132.55, angle: 82.662, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 15.992, y: -175.126, angle: -0.747, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 14.046, y: -137.83, angle: 41.873, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -42.53, y: -122.878, angle: 40.661, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 2.981, y: 0 },
              },
              {
                id: "key-353",
                time: 331.294,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 14.776, y: -100.417, angle: 23.936, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -14.328, y: -112.055, angle: 14.575, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -14.04, y: -91.996, angle: -180, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -8.893, y: -229.284, angle: -180, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -3.77, y: -353.519, angle: -180, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 8.616, y: -69.801, angle: -107.056, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 54.382, y: -160.639, angle: -88.877, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 105.804, y: -209.516, angle: -60.309, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: -6.7, y: -94.724, angle: 37.983, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -40.657, y: -75.274, angle: 60.334, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -68.787, y: -61.249, angle: 31.873, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: -24.368, y: -92.654, angle: -36.926, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 13.898, y: -71.33, angle: -0.24, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 3.661, y: -29.974, angle: 34.729, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 2.998, y: 0.13 },
              },
              {
                id: "pose-b",
                time: 400,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 112.982, y: 49.401, angle: 40.853, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 41.811, y: 12.169, angle: 37.521, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 75.067, y: 21.783, angle: -126.294, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 146.305, y: -86.202, angle: -84.274, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 218.243, y: -137.423, angle: -75.189, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 79.536, y: 84.588, angle: -66.275, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 133.707, y: 45.769, angle: -46.6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 167.357, y: 37.502, angle: -38.485, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 42.024, y: 20.743, angle: 57.804, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -11.415, y: 25.796, angle: 77.044, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -79.147, y: 35.118, angle: 102.462, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 20.66, y: 35.048, angle: -2.115, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 19.912, y: 71.96, angle: 13.484, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -7.113, y: 108.181, angle: 69.706, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-743",
                time: 464.941,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 138.783, y: 80.452, angle: 24.925, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 65.448, y: 45.784, angle: 38.485, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 108.634, y: 39.29, angle: -38.759, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 175.155, y: 34.987, angle: -25.159, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 206.216, y: 34.106, angle: -10.935, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 110.771, y: 116.357, angle: -53.829, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 154.176, y: 91.564, angle: -21.491, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 161.96, y: 96.876, angle: -13.606, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 60.222, y: 54.338, angle: 50.11, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 11.949, y: 64.786, angle: 61.715, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -37.587, y: 85.575, angle: 84.955, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 47.703, y: 73.258, angle: 8.184, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 33.452, y: 105.296, angle: 30.997, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -7.445, y: 127.22, angle: 38.95, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -0.092, y: 0.117 },
              },
              {
                id: "key-757",
                time: 592,
                easing: "linear",
                rigParts: {
                  head: { x: 132.349, y: 120.48, angle: 51.286, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 48.339, y: 70, angle: 46.723, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 107.451, y: 70.646, angle: -27.159, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 161.318, y: 67.615, angle: -22.624, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 192.468, y: 70.386, angle: -13.41, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 101.711, y: 152.852, angle: -39.073, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 134.632, y: 140.672, angle: -4.314, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 123.187, y: 143.429, angle: 4.232, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 43.745, y: 76.602, angle: 38.211, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 6.197, y: 91.679, angle: 47.933, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -26.165, y: 130.683, angle: 70.635, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 39.383, y: 80.202, angle: 0.726, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 32.898, y: 109.942, angle: 56.685, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -20.496, y: 116.533, angle: 9.955, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -0.852, y: 0.088 },
              },
              {
                id: "key-560",
                time: 709.647,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 92.338, y: 53.354, angle: 10.978, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 33.429, y: 33, angle: 29.445, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 63.412, y: 24.629, angle: 38.445, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 32.56, y: 13.861, angle: 15.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 33.953, y: 18.729, angle: 9.445, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 83.251, y: 79.072, angle: 14.445, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 53.141, y: 86.638, angle: 35.445, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -0.231, y: 71.622, angle: 37.112, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 25.85, y: 47.502, angle: 32.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -7.183, y: 71.038, angle: 36.445, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -26.686, y: 108.929, angle: 57.513, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 25.523, y: 62.625, angle: 8.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 9.468, y: 92.584, angle: 38.445, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -37.46, y: 107.933, angle: -1.689, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -3.162, y: 0 },
              },
            ],
          }
        ],
      },
      light: {
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
      },
      medium: {
        enabled: true,
        duration: 500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "medium2",
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
        keyframes: [
          {
            id: "pose-a",
            time: 0,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "pose-b",
            time: 250,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: 1.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 14.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
        variants: [
{
            enabled: true,
            duration: 500,
            variantId: "medium2",
            variantLabel: "medium2",
            variantWeight: 1,
            appliesToAllWeapons: true,
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
              head: { x: 31.107, y: -4.698, angle: 23.341, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 8.785, y: -15.949, angle: 11.67, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 6.308, y: -10.025, angle: -49.599, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 76.83, y: -21.466, angle: -51.517, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 141.747, y: -53.488, angle: -54.176, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
              frontUpperArm: { x: 44.451, y: -2.229, angle: -11.67, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 48.344, y: 6.796, angle: -11.753, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 44.965, y: 12.099, angle: -7.258, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
              backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: -0.25, y: 0, angle: -2.588, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 0.269, y: 33.112, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -9.687, y: 72.114, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
            keyframes: [
              {
                id: "pose-a",
                time: 0,
                easing: "easeInOut",
                rigParts: {
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
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-500",
                time: 108,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -24.219, y: -4.561, angle: -15, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -4.015, y: -15.002, angle: -12, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -29.026, y: 6.035, angle: 51, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -76.238, y: -16.031, angle: 49, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: -108.307, y: -25.832, angle: 35, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: 6.944, y: -24.027, angle: -12, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 11.25, y: -15.029, angle: -12, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 11.158, y: -10.536, angle: -8, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -0.25, y: 0, angle: -15, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 14.817, y: 27.992, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 5.81, y: 65.992, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-296",
                time: 148,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -42.286, y: -2.556, angle: -27, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -7.026, y: -16.004, angle: -18, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -31.033, y: 15.054, angle: 51, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -73.227, y: -9.017, angle: 49, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: -108.307, y: -25.832, angle: 35, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: -6.104, y: -28.035, angle: -12, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -1.798, y: -22.044, angle: -12, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -4.901, y: -14.544, angle: -8, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: 2.761, y: 0, angle: -24, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 30.876, y: 29.996, angle: -12, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 31.906, y: 67.996, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "pose-b",
                time: 250,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 31.107, y: -4.698, angle: 23.341, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 8.785, y: -15.949, angle: 11.67, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 6.308, y: -10.025, angle: -49.599, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 76.83, y: -21.466, angle: -51.517, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 141.747, y: -53.488, angle: -54.176, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: 44.451, y: -2.229, angle: -11.67, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 48.344, y: 6.796, angle: -11.753, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 44.965, y: 12.099, angle: -7.258, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -0.25, y: 0, angle: -2.588, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 0.269, y: 33.112, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -9.687, y: 72.114, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
            ],
          }
        ],
      },
      heavy: {
        enabled: true,
        duration: 600,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "heavy2",
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
        keyframes: [
          {
            id: "pose-a",
            time: 0,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "pose-b",
            time: 300,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: 2.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 15, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
        variants: [
{
            enabled: true,
            duration: 1000,
            variantId: "heavy2",
            variantLabel: "heavy2",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["axe"],
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
              head: { x: -110.539, y: 10.471, angle: -45, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: -54.201, y: -15.002, angle: -30, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: -100.29, y: 31.66, angle: 12, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: -104.342, y: 41.231, angle: 16, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: -111.626, y: 43.243, angle: 8.048, scaleX: 1.1, scaleY: 0.9, flipX: true, flipY: false },
              frontUpperArm: { x: -89.413, y: -19.017, angle: -102, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: -30.906, y: -104.214, angle: -102, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 28.222, y: -166.86, angle: -101, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
              backThigh: { x: -39.145, y: 15.031, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: -33.134, y: 45.025, angle: -32, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: -35.38, y: -7.015, angle: -60.417, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 19.351, y: -14.648, angle: -18.738, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: 32.414, y: 22.856, angle: -6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
            impactKeyframeId: "key-758-2",
            keyframes: [
              {
                id: "pose-a",
                time: 0,
                easing: "easeInOut",
                rigParts: {
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
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-537",
                time: 302,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -109.133, y: 10.215, angle: -44.427, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -53.511, y: -14.989, angle: -29.618, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -97.286, y: 40.547, angle: 95.656, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -158.482, y: -27.956, angle: 90.694, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -217.209, y: -101.577, angle: 102.701, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
                  frontUpperArm: { x: -87.994, y: -18.915, angle: -100.701, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -30.369, y: -102.9, angle: -100.739, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 27.838, y: -164.767, angle: -99.472, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -38.647, y: 14.84, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -32.674, y: 44.872, angle: -31.58, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -34.933, y: -6.925, angle: -41.465, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 11.614, y: 8.256, angle: -23.694, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 29.387, y: 43.288, angle: -5.924, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-572",
                time: 371,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -38.32, y: -2.092, angle: -10.792, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -39.698, y: -9.965, angle: -2.195, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -57.496, y: 16.906, angle: 136.29, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -96.771, y: -100.17, angle: 131.413, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -129.352, y: -211.168, angle: 148.792, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
                  frontUpperArm: { x: -33.226, y: 9.257, angle: -84.263, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 25.547, y: -54.241, angle: -84.343, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 80.843, y: -98.858, angle: -82.78, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -38.095, y: 14.628, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -32.164, y: 44.702, angle: -31.114, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -30.097, y: 15.924, angle: -25.873, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 0.551, y: 44.345, angle: -17.356, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 10.375, y: 80.503, angle: -2.839, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-516",
                time: 430,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -15.485, y: 3.902, angle: 12.731, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -39.201, y: -10.015, angle: 12.716, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -32.662, y: 8.44, angle: 153.721, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -51.162, y: -120.38, angle: 148.918, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -67.436, y: -240.56, angle: 165.754, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
                  frontUpperArm: { x: -14.243, y: 24.222, angle: -72.578, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 41.395, y: -25.117, angle: -72.695, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 91.423, y: -58.562, angle: -70.876, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -37.618, y: 14.445, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -31.724, y: 44.556, angle: -30.713, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -36.574, y: 15.577, angle: -35.993, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -3.538, y: 38.87, angle: -5.938, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -2.92, y: 74.477, angle: -0.64, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-652",
                time: 491,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 4.118, y: 8.744, angle: 24.718, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -37.814, y: -10.156, angle: 21.272, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -22.442, y: 4.476, angle: 180, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -14.024, y: -135.83, angle: 180, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 2.945, y: -260.7, angle: 180, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
                  frontUpperArm: { x: -5.578, y: 29.116, angle: -65.718, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 46.796, y: -12.779, angle: -65.937, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 92.806, y: -40.803, angle: -63.404, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -36.286, y: 13.933, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -30.495, y: 44.147, angle: -29.59, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -38.202, y: 8.941, angle: -29.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -6.065, y: 29.4, angle: -13.52, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -0.971, y: 67.346, angle: 0.256, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "pose-b",
                time: 500,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -110.539, y: 10.471, angle: -45, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -54.201, y: -15.002, angle: -30, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -100.29, y: 31.66, angle: 12, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -104.342, y: 41.231, angle: 16, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: -111.626, y: 43.243, angle: 8.048, scaleX: 1.1, scaleY: 0.9, flipX: true, flipY: false },
                  frontUpperArm: { x: -89.413, y: -19.017, angle: -102, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -30.906, y: -104.214, angle: -102, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 28.222, y: -166.86, angle: -101, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -39.145, y: 15.031, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -33.134, y: 45.025, angle: -32, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -35.38, y: -7.015, angle: -60.417, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 19.351, y: -14.648, angle: -18.738, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 32.414, y: 22.856, angle: -6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-758",
                time: 545,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 47.806, y: 39.595, angle: 45.34, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -37.814, y: -10.156, angle: 47.785, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 29.77, y: -4.034, angle: 180, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 40.917, y: -144.068, angle: 180, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 59.079, y: -266.538, angle: 195, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
                  frontUpperArm: { x: 19.995, y: 73.797, angle: -65.718, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 72.369, y: 31.901, angle: -65.937, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 118.379, y: 3.877, angle: -63.404, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -56.903, y: -9.9, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -56.537, y: 31.147, angle: 9.41, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -80.946, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -58.044, y: 5.381, angle: -17.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -34.665, y: 42.478, angle: -13.52, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -27.052, y: 77.522, angle: 0.256, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-590",
                time: 593,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 47.802, y: 39.59, angle: 45.335, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -37.808, y: -10.157, angle: 47.78, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 18.233, y: -4.067, angle: 222.368, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 79.99, y: -126.732, angle: 222.506, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 136.943, y: -223.249, angle: 234.746, scaleX: 1.2, scaleY: 1, flipX: true, flipY: false },
                  frontUpperArm: { x: 19.993, y: 73.77, angle: -65.598, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 72.295, y: 32.02, angle: -65.83, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 118.217, y: 4.105, angle: -63.33, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -56.907, y: -9.886, angle: 0.164, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -56.719, y: 31.056, angle: 9.465, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -81.203, y: 69.892, angle: -0.025, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -58.038, y: 5.452, angle: -17.989, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -34.657, y: 42.483, angle: -13.519, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -27.056, y: 77.513, angle: 0.256, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-731",
                time: 641,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 47.288, y: 38.919, angle: 44.635, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -37.047, y: -10.234, angle: 47.092, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 20.373, y: -8.701, angle: 232.529, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 92.001, y: -121.568, angle: 252.305, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 162.918, y: -189.168, angle: 271.534, scaleX: 1.259, scaleY: 1.059, flipX: true, flipY: false },
                  frontUpperArm: { x: 19.666, y: 70.006, angle: -48.587, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 61.871, y: 48.814, angle: -50.618, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 95.254, y: 36.541, angle: -52.957, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -57.438, y: -7.87, angle: 23.362, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -82.486, y: 18.245, angle: 17.26, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -117.694, y: 54.564, angle: -3.594, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -57.159, y: 15.569, angle: -25.921, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -33.47, y: 43.189, angle: -13.247, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -27.625, y: 76.266, angle: 0.251, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-758-2",
                time: 701,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 46.941, y: 38.466, angle: 44.163, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -36.535, y: -10.286, angle: 46.628, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 14.083, y: -11.825, angle: 267.69, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 102.617, y: -83.285, angle: 270.654, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 171.309, y: -130.747, angle: 272.705, scaleX: 1.298, scaleY: 1.098, flipX: true, flipY: false },
                  frontUpperArm: { x: 19.446, y: 67.469, angle: -37.121, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 54.845, y: 60.135, angle: -40.364, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 79.775, y: 58.404, angle: -45.964, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -57.796, y: -6.511, angle: 39, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -99.855, y: 9.608, angle: 22.514, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -142.291, y: 44.232, angle: -6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -56.566, y: 22.389, angle: -31.269, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -28.369, y: 43.664, angle: -13.063, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -23.707, y: 76.857, angle: 0.247, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-933",
                time: 773,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -110.539, y: 10.471, angle: -45, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -54.201, y: -15.002, angle: -30, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -100.29, y: 33.092, angle: 27, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -124.417, y: 34.073, angle: 25, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: -141.429, y: 35.295, angle: 14, scaleX: 1.1, scaleY: 0.9, flipX: true, flipY: false },
                  frontUpperArm: { x: -89.413, y: -19.017, angle: -102, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -30.906, y: -104.214, angle: -102, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 28.222, y: -166.86, angle: -101, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -39.145, y: 15.031, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -33.134, y: 45.025, angle: -32, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -35.38, y: -7.015, angle: -42, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 11.806, y: 7.95, angle: -24, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 29.899, y: 42.944, angle: -6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
            ],
          }
        ],
      },
      bowShot: {
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
      },
      hit: {
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
      },
      block: {
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
      },
      taunt: {
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
      },
      rest: {
        enabled: true,
        duration: 1000,
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
      },
    },
  },
};

export const DEBUG_TUNING_STORAGE_VERSION = 2;

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
  debugTuningVersion: DEBUG_TUNING_STORAGE_VERSION,
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
  characterPreviewArmorGhosted: false,
  facePreviewScale: 4.2,
  facePreviewFocusX: 215,
  facePreviewFocusY: 300,
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
  paperDollBodyPreset: "dummy-v2",
  bodyPresetTuning: cloneBodyPresetTunings(DEFAULT_BODY_PRESET_TUNING),
  selectedFaceAssetLayer: "pupilLeft",
  selectedAppearanceLayer: "hair",
  faceAssetLayers: cloneFaceAssetLayers(DEFAULT_FACE_ASSET_LAYERS),
  appearanceLayers: cloneAppearanceLayers(DEFAULT_APPEARANCE_LAYERS),
  selectedRigPart: "torso",
  selectedRigParts: ["torso"],
  rigParts: cloneRigParts(DEFAULT_RIG_PARTS),
  faceParts: cloneFaceParts(DEFAULT_FACE_PARTS),
  equipment: cloneEquipment(DEFAULT_EQUIPMENT),
  equipmentItems: cloneEquipmentItems(DEFAULT_EQUIPMENT_ITEM_TUNING),
  animationEditMode: "poseA",
  animationPreviewProgress: 0,
  animationPreviewPlaybackSpeed: 1,
  animationPreviewRandomWeapon: false,
  animationPreviewWeaponItemId: null,
  animationEditorZoom: 1,
  animationEditorOffsetX: 0,
  animationEditorOffsetY: 0,
  animationRootTransformMode: "rootOffset",
  selectedAnimationKeyframeId: "pose-a",
  selectedBodyAnimation: "idle",
  selectedBodyAnimationVariantId: BODY_ANIMATION_DEFAULT_VARIANT_ID,
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
  persist?: boolean;
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
  if (options.persist !== false) {
    saveDebugTuning(debugTuning);
  }
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
  const inputVersion = getDebugTuningStorageVersion(input.debugTuningVersion);
  const shouldResetClassicBodyPreset = inputVersion < 1;
  const shouldRepairAnimationVariantDefaultWrites = inputVersion === 1;
  const selectedRigPart = isRigPartKey(input.selectedRigPart) ? input.selectedRigPart : defaultDebugTuning.selectedRigPart;
  const selectedFaceAssetLayer = isFaceAssetLayerKey(input.selectedFaceAssetLayer)
    ? input.selectedFaceAssetLayer
    : defaultDebugTuning.selectedFaceAssetLayer;
  const selectedAppearanceLayer = isAppearanceLayerKey(input.selectedAppearanceLayer)
    ? input.selectedAppearanceLayer
    : defaultDebugTuning.selectedAppearanceLayer;
  const paperDollBodyPreset = isPaperDollBodyPreset(input.paperDollBodyPreset) ? input.paperDollBodyPreset : defaultDebugTuning.paperDollBodyPreset;
  const legacyBodyPresetTuning: BodyPresetTuning = {
    rigParts: normalizeRigParts(input.rigParts, DEFAULT_RIG_PARTS),
    bodyPartLayers: normalizeBodyPartLayers((input as { bodyPartLayers?: unknown }).bodyPartLayers, DEFAULT_BODY_PART_LAYERS),
    faceParts: normalizeFaceParts(input.faceParts, DEFAULT_FACE_PARTS),
    faceAssetLayers: normalizeFaceAssetLayers(input.faceAssetLayers, DEFAULT_FACE_ASSET_LAYERS),
    appearanceLayers: normalizeAppearanceLayers((input as { appearanceLayers?: unknown }).appearanceLayers, DEFAULT_APPEARANCE_LAYERS),
    bodyAnimations: normalizeBodyAnimations(input.bodyAnimations, legacyIdleAnimation, DEFAULT_BODY_ANIMATIONS, {
      resetDefaultSlots: shouldRepairAnimationVariantDefaultWrites,
    }),
  };

  const selectedBodyAnimation = isBodyAnimationKey(input.selectedBodyAnimation) ? input.selectedBodyAnimation : defaultDebugTuning.selectedBodyAnimation;
  const bodyAnimations = legacyBodyPresetTuning.bodyAnimations;
  const bodyPresetTuning = normalizeBodyPresetTunings(
    input.bodyPresetTuning,
    paperDollBodyPreset,
    legacyBodyPresetTuning,
    shouldResetClassicBodyPreset,
    shouldRepairAnimationVariantDefaultWrites,
  );
  const selectedBodyPresetTuning = bodyPresetTuning[paperDollBodyPreset] ?? legacyBodyPresetTuning;
  const selectedBodyPresetAnimation = selectedBodyPresetTuning.bodyAnimations[selectedBodyAnimation] ?? bodyAnimations[selectedBodyAnimation];
  const selectedBodyAnimationVariantId = normalizeSelectedBodyAnimationVariantId(input.selectedBodyAnimationVariantId, selectedBodyPresetAnimation);
  const selectedBodyAnimationVariant =
    selectedBodyAnimationVariantId === BODY_ANIMATION_DEFAULT_VARIANT_ID
      ? selectedBodyPresetAnimation
      : selectedBodyPresetAnimation.variants?.find((variant) => variant.variantId === selectedBodyAnimationVariantId) ?? selectedBodyPresetAnimation;

  return {
    debugTuningVersion: DEBUG_TUNING_STORAGE_VERSION,
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
    characterPreviewArmorGhosted: typeof input.characterPreviewArmorGhosted === "boolean"
      ? input.characterPreviewArmorGhosted
      : defaultDebugTuning.characterPreviewArmorGhosted,
    facePreviewScale: clampNumber(input.facePreviewScale, 2, 7, defaultDebugTuning.facePreviewScale),
    facePreviewFocusX: clampNumber(input.facePreviewFocusX, 0, 430, defaultDebugTuning.facePreviewFocusX),
    facePreviewFocusY: clampNumber(input.facePreviewFocusY, 80, 560, defaultDebugTuning.facePreviewFocusY),
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
    paperDollBodyPreset,
    bodyPresetTuning,
    selectedFaceAssetLayer,
    selectedAppearanceLayer,
    faceAssetLayers: legacyBodyPresetTuning.faceAssetLayers,
    appearanceLayers: legacyBodyPresetTuning.appearanceLayers,
    selectedRigPart,
    selectedRigParts: normalizeSelectedRigParts(input.selectedRigParts, selectedRigPart),
    rigParts: legacyBodyPresetTuning.rigParts,
    faceParts: legacyBodyPresetTuning.faceParts,
    equipment: normalizeEquipment(input.equipment, DEFAULT_EQUIPMENT),
    equipmentItems: normalizeEquipmentItems(input.equipmentItems, DEFAULT_EQUIPMENT_ITEM_TUNING),
    animationEditMode: isAnimationEditMode(input.animationEditMode) ? input.animationEditMode : defaultDebugTuning.animationEditMode,
    animationPreviewProgress: clampNumber(input.animationPreviewProgress, 0, 1, defaultDebugTuning.animationPreviewProgress),
    animationPreviewPlaybackSpeed: clampNumber(input.animationPreviewPlaybackSpeed, 0.25, 2, defaultDebugTuning.animationPreviewPlaybackSpeed),
    animationPreviewRandomWeapon: typeof input.animationPreviewRandomWeapon === "boolean"
      ? input.animationPreviewRandomWeapon
      : defaultDebugTuning.animationPreviewRandomWeapon,
    animationPreviewWeaponItemId: typeof input.animationPreviewWeaponItemId === "string" && input.animationPreviewWeaponItemId.trim()
      ? input.animationPreviewWeaponItemId.trim()
      : defaultDebugTuning.animationPreviewWeaponItemId,
    animationEditorZoom: clampNumber(input.animationEditorZoom, 0.5, 2.4, defaultDebugTuning.animationEditorZoom),
    animationEditorOffsetX: clampNumber(input.animationEditorOffsetX, -420, 420, defaultDebugTuning.animationEditorOffsetX),
    animationEditorOffsetY: clampNumber(input.animationEditorOffsetY, -420, 420, defaultDebugTuning.animationEditorOffsetY),
    animationRootTransformMode: isAnimationRootTransformMode(input.animationRootTransformMode)
      ? input.animationRootTransformMode
      : defaultDebugTuning.animationRootTransformMode,
    selectedAnimationKeyframeId: normalizeSelectedAnimationKeyframeId(input.selectedAnimationKeyframeId, selectedBodyAnimationVariant),
    selectedBodyAnimation,
    selectedBodyAnimationVariantId,
    bodyAnimations,
    selectedSlashArc: isSlashArcAttackKey(input.selectedSlashArc) ? input.selectedSlashArc : defaultDebugTuning.selectedSlashArc,
    slashArcs: normalizeSlashArcs(input.slashArcs),
  };
}

function createDefaultRigParts(): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...defaultRigPartTuning }])) as Record<RigPartKey, RigPartTuning>;
}

function createDefaultBodyPartLayers(): Record<RigPartKey, BodyPartLayerTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...defaultBodyPartLayerTuning }])) as Record<RigPartKey, BodyPartLayerTuning>;
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

function cloneFaceAssetLayers(source: Record<FaceAssetLayerKey, FaceAssetLayerTuning>): Record<FaceAssetLayerKey, FaceAssetLayerTuning> {
  return Object.fromEntries(FACE_ASSET_LAYER_KEYS.map((key) => [key, { ...source[key] }])) as Record<FaceAssetLayerKey, FaceAssetLayerTuning>;
}

function cloneAppearanceLayers(source: Record<AppearanceLayerKey, AppearanceLayerTuning>): Record<AppearanceLayerKey, AppearanceLayerTuning> {
  return Object.fromEntries(APPEARANCE_LAYER_KEYS.map((key) => [key, { ...source[key] }])) as Record<AppearanceLayerKey, AppearanceLayerTuning>;
}

function cloneBodyPartLayers(source: Record<RigPartKey, BodyPartLayerTuning>): Record<RigPartKey, BodyPartLayerTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<RigPartKey, BodyPartLayerTuning>;
}

function cloneBodyPresetTunings(source: Record<PaperDollBodyPreset, BodyPresetTuning>): Record<PaperDollBodyPreset, BodyPresetTuning> {
  return Object.fromEntries(PAPER_DOLL_BODY_PRESETS.map((key) => [key, cloneBodyPresetTuning(source[key])])) as Record<
    PaperDollBodyPreset,
    BodyPresetTuning
  >;
}

function cloneBodyPresetTuning(source: BodyPresetTuning): BodyPresetTuning {
  return {
    rigParts: cloneRigParts(source.rigParts),
    bodyPartLayers: cloneBodyPartLayers(source.bodyPartLayers),
    faceParts: cloneFaceParts(source.faceParts),
    faceAssetLayers: cloneFaceAssetLayers(source.faceAssetLayers),
    appearanceLayers: cloneAppearanceLayers(source.appearanceLayers),
    bodyAnimations: cloneBodyAnimations(source.bodyAnimations),
  };
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
  const base = cloneRigParts(source.base);
  const breath = cloneRigParts(source.breath);
  const faceBase = cloneFaceParts(source.faceBase);
  const faceBreath = cloneFaceParts(source.faceBreath);
  const variants = (source.variants ?? []).map(cloneBodyAnimationVariant);

  return {
    enabled: source.enabled,
    duration: source.duration,
    variantId: source.variantId ?? BODY_ANIMATION_DEFAULT_VARIANT_ID,
    variantLabel: source.variantLabel ?? source.variantId ?? BODY_ANIMATION_DEFAULT_VARIANT_ID,
    variantWeight: source.variantWeight ?? 1,
    appliesToAllWeapons: source.appliesToAllWeapons ?? true,
    weaponClasses: cloneBodyAnimationWeaponClasses(source.weaponClasses),
    selectedVariantId: normalizeBodyAnimationSelectedVariantId(source.selectedVariantId, variants),
    base,
    breath,
    faceBase,
    faceBreath,
    activeParts: cloneIdleActiveParts(source.activeParts),
    movementStartKeyframeId: source.movementStartKeyframeId,
    impactKeyframeId: source.impactKeyframeId,
    keyframes: cloneBodyAnimationKeyframes(source.keyframes, { duration: source.duration, base, breath, faceBase, faceBreath }),
    variants,
  };
}

function cloneBodyAnimationVariant(source: BodyAnimationTuning): BodyAnimationTuning {
  const clone = cloneBodyAnimation({ ...source, variants: [] });

  return { ...clone, variants: [] };
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
    bodyPresetTuning: cloneBodyPresetTunings(source.bodyPresetTuning),
    rigParts: cloneRigParts(source.rigParts),
    faceParts: cloneFaceParts(source.faceParts),
    faceAssetLayers: cloneFaceAssetLayers(source.faceAssetLayers),
    appearanceLayers: cloneAppearanceLayers(source.appearanceLayers),
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
            const nextSlot = {
              x: clampNumber(slot.x, -240, 240, fallback.x),
              y: clampNumber(slot.y, -320, 80, fallback.y),
              rotation: clampNumber(slot.rotation, -180, 180, fallback.rotation),
            };

            return [
              key,
              key === "switchWeapon" && nextSlot.y > CLASSIC_SWITCH_HIDDEN_Y_THRESHOLD ? { ...fallback } : nextSlot,
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
          angle: clampNumber(part.angle, RIG_PART_ANGLE_MIN, RIG_PART_ANGLE_MAX, fallback.angle),
          scaleX: clampNumber(part.scaleX, 0.1, 3, fallback.scaleX),
          scaleY: clampNumber(part.scaleY, 0.1, 3, fallback.scaleY),
          flipX: typeof part.flipX === "boolean" ? part.flipX : fallback.flipX,
          flipY: typeof part.flipY === "boolean" ? part.flipY : fallback.flipY,
        },
      ];
    }),
  ) as Record<RigPartKey, RigPartTuning>;
}

function normalizeBodyPartLayers(input: unknown, fallbackLayers = DEFAULT_BODY_PART_LAYERS): Record<RigPartKey, BodyPartLayerTuning> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<RigPartKey, Partial<BodyPartLayerTuning>>>) : {};

  return Object.fromEntries(
    RIG_PART_KEYS.map((key) => {
      const layer = source[key] ?? {};
      const fallback = fallbackLayers[key] ?? defaultBodyPartLayerTuning;

      return [
        key,
        {
          x: clampNumber(layer.x, -480, 480, fallback.x),
          y: clampNumber(layer.y, -480, 480, fallback.y),
          angle: clampNumber(layer.angle, -180, 180, fallback.angle),
          scaleX: clampNumber(layer.scaleX, 0.1, 3, fallback.scaleX),
          scaleY: clampNumber(layer.scaleY, 0.1, 3, fallback.scaleY),
          flipX: typeof layer.flipX === "boolean" ? layer.flipX : fallback.flipX,
          flipY: typeof layer.flipY === "boolean" ? layer.flipY : fallback.flipY,
        },
      ];
    }),
  ) as Record<RigPartKey, BodyPartLayerTuning>;
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

function normalizeFaceAssetLayers(
  input: unknown,
  fallbackLayers = DEFAULT_FACE_ASSET_LAYERS,
): Record<FaceAssetLayerKey, FaceAssetLayerTuning> {
  const source =
    typeof input === "object" && input !== null ? (input as Partial<Record<FaceAssetLayerKey, Partial<FaceAssetLayerTuning>>>) : {};

  return Object.fromEntries(
    FACE_ASSET_LAYER_KEYS.map((key) => {
      const layer = source[key] ?? {};
      const fallback = fallbackLayers[key] ?? defaultFaceAssetLayerTuning;

      return [
        key,
        {
          x: clampNumber(layer.x, -80, 80, fallback.x),
          y: clampNumber(layer.y, -120, 40, fallback.y),
          angle: clampNumber(layer.angle, -180, 180, fallback.angle),
          scaleX: clampNumber(layer.scaleX, 0.1, 3, fallback.scaleX),
          scaleY: clampNumber(layer.scaleY, 0.1, 3, fallback.scaleY),
        },
      ];
    }),
  ) as Record<FaceAssetLayerKey, FaceAssetLayerTuning>;
}

function normalizeAppearanceLayers(
  input: unknown,
  fallbackLayers = DEFAULT_APPEARANCE_LAYERS,
): Record<AppearanceLayerKey, AppearanceLayerTuning> {
  const source =
    typeof input === "object" && input !== null ? (input as Partial<Record<AppearanceLayerKey, Partial<AppearanceLayerTuning>>>) : {};

  return Object.fromEntries(
    APPEARANCE_LAYER_KEYS.map((key) => {
      const layer = source[key] ?? {};
      const fallback = fallbackLayers[key] ?? defaultAppearanceLayerTuning;

      return [
        key,
        {
          x: clampNumber(layer.x, -160, 160, fallback.x),
          y: clampNumber(layer.y, -160, 160, fallback.y),
          angle: clampNumber(layer.angle, -180, 180, fallback.angle),
          scaleX: clampNumber(layer.scaleX, 0.1, 3, fallback.scaleX),
          scaleY: clampNumber(layer.scaleY, 0.1, 3, fallback.scaleY),
        },
      ];
    }),
  ) as Record<AppearanceLayerKey, AppearanceLayerTuning>;
}

function normalizeBodyPresetTunings(
  input: unknown,
  activePreset: PaperDollBodyPreset,
  legacyTuning: BodyPresetTuning,
  resetClassic: boolean,
  resetBodyAnimationDefaultSlots = false,
): Record<PaperDollBodyPreset, BodyPresetTuning> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<PaperDollBodyPreset, Partial<BodyPresetTuning>>>) : {};

  return Object.fromEntries(
    PAPER_DOLL_BODY_PRESETS.map((presetKey) => {
      const presetInput = source[presetKey];
      if (resetClassic && presetKey === "classic") {
        return [presetKey, cloneBodyPresetTuning(DEFAULT_BODY_PRESET_TUNING.classic)];
      }

      const fallback = presetInput
        ? DEFAULT_BODY_PRESET_TUNING[presetKey]
        : presetKey === activePreset
          ? legacyTuning
          : DEFAULT_BODY_PRESET_TUNING[presetKey];

      return [presetKey, normalizeBodyPresetTuning(presetInput, fallback, resetBodyAnimationDefaultSlots)];
    }),
  ) as Record<PaperDollBodyPreset, BodyPresetTuning>;
}

function normalizeBodyPresetTuning(input: unknown, fallback: BodyPresetTuning, resetBodyAnimationDefaultSlots = false): BodyPresetTuning {
  const source = typeof input === "object" && input !== null ? (input as Partial<BodyPresetTuning>) : {};
  const bodyAnimations = normalizeBodyAnimations(source.bodyAnimations, undefined, fallback.bodyAnimations, {
    resetDefaultSlots: resetBodyAnimationDefaultSlots,
  });

  return {
    rigParts: normalizeRigParts(source.rigParts, fallback.rigParts),
    bodyPartLayers: normalizeBodyPartLayers(source.bodyPartLayers, fallback.bodyPartLayers),
    faceParts: normalizeFaceParts(source.faceParts, fallback.faceParts),
    faceAssetLayers: normalizeFaceAssetLayers(source.faceAssetLayers, fallback.faceAssetLayers),
    appearanceLayers: normalizeAppearanceLayers(source.appearanceLayers, fallback.appearanceLayers),
    bodyAnimations,
  };
}

function getDebugTuningStorageVersion(value: unknown): number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0 ? value : 0;
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

function normalizeBodyAnimations(
  input: unknown,
  legacyIdleAnimation?: unknown,
  fallbackAnimations = DEFAULT_BODY_ANIMATIONS,
  options: { resetDefaultSlots?: boolean } = {},
): Record<BodyAnimationKey, BodyAnimationTuning> {
  const source = typeof input === "object" && input !== null ? (input as Partial<Record<BodyAnimationKey, unknown>>) : {};

  const animations = Object.fromEntries(
    BODY_ANIMATION_KEYS.map((key) => {
      const fallback = fallbackAnimations[key] ?? DEFAULT_BODY_ANIMATIONS[key];
      const candidate = source[key] ?? (key === "idle" ? legacyIdleAnimation : undefined);

      return [key, normalizeBodyAnimation(candidate, fallback)];
    }),
  ) as Record<BodyAnimationKey, BodyAnimationTuning>;

  return options.resetDefaultSlots ? restoreBodyAnimationDefaultSlots(animations, fallbackAnimations) : animations;
}

function restoreBodyAnimationDefaultSlots(
  animations: Record<BodyAnimationKey, BodyAnimationTuning>,
  fallbackAnimations = DEFAULT_BODY_ANIMATIONS,
): Record<BodyAnimationKey, BodyAnimationTuning> {
  return Object.fromEntries(
    BODY_ANIMATION_KEYS.map((key) => {
      const current = animations[key];
      const fallback = fallbackAnimations[key] ?? DEFAULT_BODY_ANIMATIONS[key];
      const variants = (current.variants && current.variants.length > 0 ? current.variants : fallback.variants ?? []).map(cloneBodyAnimationVariant);

      return [
        key,
        {
          ...cloneBodyAnimation(fallback),
          variants,
          selectedVariantId: normalizeBodyAnimationSelectedVariantId(current.selectedVariantId, variants),
        },
      ];
    }),
  ) as Record<BodyAnimationKey, BodyAnimationTuning>;
}

function normalizeBodyAnimation(input: unknown, fallback = DEFAULT_IDLE_ANIMATION): BodyAnimationTuning {
  const source = typeof input === "object" && input !== null ? (input as Partial<BodyAnimationTuning>) : {};
  const enabled = typeof source.enabled === "boolean" ? source.enabled : fallback.enabled;
  const duration = clampNumber(source.duration, 240, 2400, fallback.duration);
  const variantId = normalizeBodyAnimationVariantId(source.variantId, fallback.variantId ?? BODY_ANIMATION_DEFAULT_VARIANT_ID);
  const base = normalizeRigParts(source.base, fallback.base);
  const breath = normalizeRigParts(source.breath, fallback.breath);
  const faceBase = normalizeFaceParts(source.faceBase, fallback.faceBase);
  const faceBreath = normalizeFaceParts(source.faceBreath, fallback.faceBreath);
  const keyframes = normalizeBodyAnimationKeyframes(source.keyframes, { duration, base, breath, faceBase, faceBreath }, fallback.keyframes);
  const variants = normalizeBodyAnimationVariants(source.variants, fallback.variants);

  return {
    enabled,
    duration,
    variantId,
    variantLabel: normalizeBodyAnimationVariantLabel(source.variantLabel, fallback.variantLabel ?? variantId),
    variantWeight: normalizeBodyAnimationVariantWeight(source.variantWeight, fallback.variantWeight),
    appliesToAllWeapons: typeof source.appliesToAllWeapons === "boolean" ? source.appliesToAllWeapons : fallback.appliesToAllWeapons ?? true,
    weaponClasses: normalizeBodyAnimationWeaponClasses(source.weaponClasses, fallback.weaponClasses),
    selectedVariantId: normalizeBodyAnimationSelectedVariantId(source.selectedVariantId ?? fallback.selectedVariantId, variants),
    base,
    breath,
    faceBase,
    faceBreath,
    activeParts: normalizeIdleActiveParts(source.activeParts, fallback.activeParts),
    movementStartKeyframeId: normalizeBodyAnimationTimelineKeyframeId(
      source.movementStartKeyframeId ?? (source as { startKeyframeId?: string }).startKeyframeId,
      keyframes,
      fallback.movementStartKeyframeId,
    ),
    impactKeyframeId: normalizeBodyAnimationImpactKeyframeId(source.impactKeyframeId, keyframes, fallback.impactKeyframeId),
    keyframes,
    variants,
  };
}

function normalizeBodyAnimationVariant(input: unknown, fallback = DEFAULT_IDLE_ANIMATION, usedIds = new Set<string>()): BodyAnimationTuning {
  const source = typeof input === "object" && input !== null ? (input as Partial<BodyAnimationTuning>) : {};
  const normalized = normalizeBodyAnimation({ ...source, variants: [], selectedVariantId: undefined }, { ...fallback, variants: [], selectedVariantId: undefined });
  const fallbackId = fallback.variantId && fallback.variantId !== BODY_ANIMATION_DEFAULT_VARIANT_ID ? fallback.variantId : "variant";
  const variantId = uniquifyBodyAnimationVariantId(normalizeBodyAnimationVariantId(source.variantId, fallbackId), usedIds);

  return {
    ...normalized,
    variantId,
    variantLabel: normalizeBodyAnimationVariantLabel(source.variantLabel, fallback.variantLabel ?? variantId),
    selectedVariantId: undefined,
    variants: [],
  };
}

function normalizeBodyAnimationVariants(input: unknown, fallback: readonly BodyAnimationTuning[] | undefined): BodyAnimationTuning[] {
  const source = Array.isArray(input) ? input : fallback;

  if (!source) {
    return [];
  }

  const usedIds = new Set([BODY_ANIMATION_DEFAULT_VARIANT_ID]);

  return source.flatMap((variant, index) => {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
      return [];
    }

    const fallbackVariant = fallback?.[index] ?? DEFAULT_IDLE_ANIMATION;

    return [normalizeBodyAnimationVariant(variant, fallbackVariant, usedIds)];
  });
}

type LegacyBodyAnimationPoses = Pick<BodyAnimationTuning, "duration" | "base" | "breath" | "faceBase" | "faceBreath">;

function cloneBodyAnimationKeyframes(source: readonly BodyAnimationKeyframe[] | undefined, legacyPoses: LegacyBodyAnimationPoses): BodyAnimationKeyframe[] {
  return normalizeBodyAnimationKeyframes(source, legacyPoses);
}

function normalizeBodyAnimationKeyframes(
  input: unknown,
  legacyPoses: LegacyBodyAnimationPoses,
  fallback?: readonly BodyAnimationKeyframe[],
): BodyAnimationKeyframe[] {
  const legacyKeyframes = createLegacyBodyAnimationKeyframes(legacyPoses);
  const fallbackSource = Array.isArray(fallback) && fallback.length > 0 ? fallback : undefined;
  const source = Array.isArray(input) && input.length > 0 ? input : fallbackSource;
  const poseA = normalizeBodyAnimationAnchorKeyframe("pose-a", legacyKeyframes[0], source, fallbackSource, legacyPoses.duration);
  const poseB = normalizeBodyAnimationAnchorKeyframe("pose-b", legacyKeyframes[1], source, fallbackSource, legacyPoses.duration);
  const normalized = source
    ? source.flatMap((keyframe, index) => {
        const fallbackKeyframe = fallbackSource?.[index] ?? legacyKeyframes[Math.min(index, legacyKeyframes.length - 1)];

        return [normalizeBodyAnimationKeyframe(keyframe, fallbackKeyframe, legacyPoses.duration)];
      })
    : [];
  const usedIds = new Set(["pose-a", "pose-b"]);
  const extraKeyframes = normalized
    .filter((keyframe) => keyframe.id !== "pose-a" && keyframe.id !== "pose-b")
    .map((keyframe) => uniquifyBodyAnimationKeyframeId(keyframe, usedIds));

  return [poseA, poseB, ...extraKeyframes].sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
}

function createLegacyBodyAnimationKeyframes(legacyPoses: LegacyBodyAnimationPoses): [BodyAnimationKeyframe, BodyAnimationKeyframe] {
  const duration = Math.max(1, legacyPoses.duration);

  return [
    {
      id: "pose-a",
      time: 0,
      easing: "easeInOut",
      rigParts: cloneRigParts(legacyPoses.base),
      faceParts: cloneFaceParts(legacyPoses.faceBase),
      rootOffset: { ...defaultBodyAnimationRootOffset },
    },
    {
      id: "pose-b",
      time: duration / 2,
      easing: "easeInOut",
      rigParts: cloneRigParts(legacyPoses.breath),
      faceParts: cloneFaceParts(legacyPoses.faceBreath),
      rootOffset: { ...defaultBodyAnimationRootOffset },
    },
  ];
}

function normalizeBodyAnimationAnchorKeyframe(
  id: "pose-a" | "pose-b",
  legacyKeyframe: BodyAnimationKeyframe,
  source: readonly unknown[] | undefined,
  fallback: readonly BodyAnimationKeyframe[] | undefined,
  duration: number,
): BodyAnimationKeyframe {
  const sourceKeyframe = source?.find((keyframe) => isBodyAnimationKeyframeWithId(keyframe, id));
  const fallbackKeyframe = fallback?.find((keyframe) => keyframe.id === id);
  const normalized = normalizeBodyAnimationKeyframe(sourceKeyframe ?? fallbackKeyframe, legacyKeyframe, duration);

  return {
    ...legacyKeyframe,
    time: id === "pose-a" ? 0 : normalized.time,
    easing: normalized.easing,
    rootOffset: normalizeBodyAnimationRootOffset(normalized.rootOffset, legacyKeyframe.rootOffset),
  };
}

function normalizeBodyAnimationKeyframe(input: unknown, fallback: BodyAnimationKeyframe, duration: number): BodyAnimationKeyframe {
  const source = typeof input === "object" && input !== null && !Array.isArray(input) ? (input as Partial<BodyAnimationKeyframe>) : {};

  return {
    id: sanitizeBodyAnimationKeyframeId(source.id, fallback.id),
    time: clampNumber(source.time, 0, Math.max(1, duration), fallback.time),
    easing: isBodyAnimationKeyframeEasing(source.easing) ? source.easing : fallback.easing,
    rigParts: normalizeRigParts(source.rigParts, fallback.rigParts),
    faceParts: normalizeFaceParts(source.faceParts, fallback.faceParts),
    rootOffset: normalizeBodyAnimationRootOffset(source.rootOffset, fallback.rootOffset),
  };
}

function isBodyAnimationKeyframeWithId(input: unknown, id: "pose-a" | "pose-b"): boolean {
  return typeof input === "object" && input !== null && !Array.isArray(input) && (input as Partial<BodyAnimationKeyframe>).id === id;
}

function normalizeBodyAnimationRootOffset(input: unknown, fallback = defaultBodyAnimationRootOffset): BodyAnimationRootOffset {
  const source = typeof input === "object" && input !== null && !Array.isArray(input) ? (input as Partial<BodyAnimationRootOffset>) : {};

  return {
    x: clampNumber(source.x, -480, 480, fallback.x),
    y: clampNumber(source.y, -480, 480, fallback.y),
  };
}

function normalizeBodyAnimationImpactKeyframeId(
  input: unknown,
  keyframes: readonly BodyAnimationKeyframe[],
  fallback: string | undefined,
): string | undefined {
  return normalizeBodyAnimationTimelineKeyframeId(input, keyframes, fallback);
}

function normalizeBodyAnimationTimelineKeyframeId(
  input: unknown,
  keyframes: readonly BodyAnimationKeyframe[],
  fallback: string | undefined,
): string | undefined {
  const requestedId = typeof input === "string" ? input : fallback;

  if (requestedId && keyframes.some((keyframe) => keyframe.id === requestedId)) {
    return requestedId;
  }

  return undefined;
}

function normalizeSelectedAnimationKeyframeId(input: unknown, animation: BodyAnimationTuning | undefined): string {
  const keyframes = animation?.keyframes ?? [];
  const requestedId = typeof input === "string" ? input : defaultDebugTuning.selectedAnimationKeyframeId;

  if (keyframes.some((keyframe) => keyframe.id === requestedId)) {
    return requestedId;
  }

  return keyframes[0]?.id ?? defaultDebugTuning.selectedAnimationKeyframeId;
}

function normalizeSelectedBodyAnimationVariantId(input: unknown, animation: BodyAnimationTuning | undefined): string {
  const requestedId = typeof input === "string" ? input : animation?.selectedVariantId ?? BODY_ANIMATION_DEFAULT_VARIANT_ID;

  if (requestedId === BODY_ANIMATION_DEFAULT_VARIANT_ID) {
    return BODY_ANIMATION_DEFAULT_VARIANT_ID;
  }

  if (animation?.variants?.some((variant) => variant.variantId === requestedId)) {
    return requestedId;
  }

  return animation?.selectedVariantId ?? BODY_ANIMATION_DEFAULT_VARIANT_ID;
}

function normalizeBodyAnimationSelectedVariantId(input: unknown, variants: readonly BodyAnimationTuning[]): string {
  const requestedId = typeof input === "string" ? input : BODY_ANIMATION_DEFAULT_VARIANT_ID;

  if (requestedId === BODY_ANIMATION_DEFAULT_VARIANT_ID || variants.some((variant) => variant.variantId === requestedId)) {
    return requestedId;
  }

  return BODY_ANIMATION_DEFAULT_VARIANT_ID;
}

function normalizeBodyAnimationVariantId(input: unknown, fallback: string): string {
  const id = typeof input === "string" ? input.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 48) : "";
  const fallbackId = fallback.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 48);

  return id || fallbackId || BODY_ANIMATION_DEFAULT_VARIANT_ID;
}

function normalizeBodyAnimationVariantLabel(input: unknown, fallback: string): string {
  const label = typeof input === "string" ? input.trim().slice(0, 48) : "";

  return label || fallback || BODY_ANIMATION_DEFAULT_VARIANT_ID;
}

function normalizeBodyAnimationVariantWeight(input: unknown, fallback = 1): number {
  return Math.round(clampNumber(input, 0, 20, fallback || 1) * 100) / 100;
}

function cloneBodyAnimationWeaponClasses(input: readonly BodyAnimationWeaponClass[] | undefined): BodyAnimationWeaponClass[] {
  return normalizeBodyAnimationWeaponClasses(input);
}

function normalizeBodyAnimationWeaponClasses(input: unknown, fallback: readonly BodyAnimationWeaponClass[] | undefined = []): BodyAnimationWeaponClass[] {
  const source = Array.isArray(input) ? input : fallback;
  const classes: BodyAnimationWeaponClass[] = [];

  source.forEach((value) => {
    if (isBodyAnimationWeaponClass(value) && !classes.includes(value)) {
      classes.push(value);
    }
  });

  return classes;
}

function uniquifyBodyAnimationVariantId(id: string, usedIds: Set<string>): string {
  let nextId = id === BODY_ANIMATION_DEFAULT_VARIANT_ID ? "variant" : id;
  let suffix = 2;

  while (usedIds.has(nextId)) {
    nextId = `${id}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(nextId);

  return nextId;
}

function sanitizeBodyAnimationKeyframeId(value: unknown, fallback: string): string {
  const id = typeof value === "string" ? value.trim().slice(0, 48) : "";

  return id.length > 0 ? id : fallback;
}

function uniquifyBodyAnimationKeyframeId(keyframe: BodyAnimationKeyframe, usedIds: Set<string>): BodyAnimationKeyframe {
  let id = keyframe.id;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${keyframe.id}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);

  return id === keyframe.id ? keyframe : { ...keyframe, id };
}

function isBodyAnimationKeyframeEasing(value: unknown): value is BodyAnimationKeyframeEasing {
  return typeof value === "string" && BODY_ANIMATION_KEYFRAME_EASINGS.includes(value as BodyAnimationKeyframeEasing);
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

function isFaceAssetLayerKey(value: unknown): value is FaceAssetLayerKey {
  return typeof value === "string" && FACE_ASSET_LAYER_KEYS.includes(value as FaceAssetLayerKey);
}

function isAppearanceLayerKey(value: unknown): value is AppearanceLayerKey {
  return typeof value === "string" && APPEARANCE_LAYER_KEYS.includes(value as AppearanceLayerKey);
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

function isBodyAnimationWeaponClass(value: unknown): value is BodyAnimationWeaponClass {
  return typeof value === "string" && BODY_ANIMATION_WEAPON_CLASSES.includes(value as BodyAnimationWeaponClass);
}

export function isSlashArcAttackKey(value: unknown): value is SlashArcAttackKey {
  return typeof value === "string" && SLASH_ARC_ATTACK_KEYS.includes(value as SlashArcAttackKey);
}

function isAnimationEditMode(value: unknown): value is AnimationEditMode {
  return typeof value === "string" && ANIMATION_EDIT_MODES.includes(value as AnimationEditMode);
}

function isAnimationRootTransformMode(value: unknown): value is AnimationRootTransformMode {
  return typeof value === "string" && ANIMATION_ROOT_TRANSFORM_MODES.includes(value as AnimationRootTransformMode);
}

function isCharacterCanvasEditMode(value: unknown): value is CharacterCanvasEditMode {
  return typeof value === "string" && CHARACTER_CANVAS_EDIT_MODES.includes(value as CharacterCanvasEditMode);
}

function isPaperDollBodyPreset(value: unknown): value is PaperDollBodyPreset {
  return typeof value === "string" && PAPER_DOLL_BODY_PRESETS.includes(value as PaperDollBodyPreset);
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
