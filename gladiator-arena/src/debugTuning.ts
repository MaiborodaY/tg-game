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
export const SPEAR_ATTACK_BODY_ANIMATION_VARIANT_ID = "spearattack";
const SPEAR_ATTACK_BODY_ANIMATION_KEYS: BodyAnimationKey[] = ["light", "medium", "heavy"];
export const BODY_ANIMATION_WEAPON_CLASSES = ["sword", "axe", "bow", "mace", "spear", "shuriken"] as const;
export type BodyAnimationWeaponClass = (typeof BODY_ANIMATION_WEAPON_CLASSES)[number];

interface SpearAttackBodyAnimationSyncOptions {
  overwriteExisting?: boolean;
}

export const SLASH_ARC_ATTACK_KEYS = ["light", "medium", "heavy"] as const;
export type SlashArcAttackKey = (typeof SLASH_ARC_ATTACK_KEYS)[number];

export type DebugPopupPreviewKind = "all" | "damage" | "block" | "armorAbsorb" | "armorBreak";

export const ACTION_BUTTON_OFFSET_KEYS = ["forward", "back", "lunge", "light", "medium", "heavy", "switchWeapon", "shuriken", "scroll", "fireball", "ward", "preciseStrike", "doubleStrike", "poison", "taunt", "rest"] as const;
export type ActionButtonOffsetKey = (typeof ACTION_BUTTON_OFFSET_KEYS)[number];

export const CLASSIC_ACTION_WHEEL_MODES = ["distance", "clinch", "bowDistance"] as const;
export type ClassicActionWheelMode = (typeof CLASSIC_ACTION_WHEEL_MODES)[number];

export const CLASSIC_ACTION_WHEEL_BUTTONS: Record<ClassicActionWheelMode, ActionButtonOffsetKey[]> = {
  distance: ["forward", "lunge", "back", "switchWeapon", "shuriken", "scroll", "fireball", "ward", "preciseStrike", "doubleStrike", "poison", "taunt", "rest"],
  clinch: ["light", "medium", "heavy", "back", "shuriken", "scroll", "fireball", "ward", "preciseStrike", "doubleStrike", "poison", "taunt", "rest"],
  bowDistance: ["light", "medium", "heavy", "switchWeapon", "shuriken", "scroll", "fireball", "ward", "preciseStrike", "doubleStrike", "poison", "back", "taunt", "rest"],
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
export const ARENA_BACKGROUND_LAYER_ROLES = ["back", "mid", "ground", "front", "ambient"] as const;
export const ARENA_BACKGROUND_EDIT_LAYERS = ARENA_BACKGROUND_LAYER_ROLES;

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
  weaponMirrorX?: boolean;
  weaponMirrorY?: boolean;
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

export type ArenaBackgroundLayerRole = (typeof ARENA_BACKGROUND_LAYER_ROLES)[number];
export type ArenaBackgroundEditLayer = string;

export interface ArenaBackgroundLayerLayoutTuning {
  x: number;
  y: number;
  scale: number;
  alpha: number;
  visible: boolean;
}

export interface ArenaBackgroundLayerParallaxTuning {
  followX: number;
  followY: number;
  zoom: number;
  lookUpY: number;
  zoomDarken?: number;
  farAlpha?: number;
  nearAlpha?: number;
}

export interface ArenaBackgroundLayerTuning {
  layout: ArenaBackgroundLayerLayoutTuning;
  parallax: ArenaBackgroundLayerParallaxTuning;
}

export type ArenaBackgroundVariantTuningMap = Record<string, Partial<Record<ArenaBackgroundEditLayer, ArenaBackgroundLayerTuning>>>;

export interface ArenaBackgroundTierTuning {
  layers?: Partial<Record<ArenaBackgroundEditLayer, ArenaBackgroundLayerTuning>>;
  variants?: ArenaBackgroundVariantTuningMap;
  [legacyLayer: string]: unknown;
}

export type ArenaBackgroundTierTuningMap = Record<string, ArenaBackgroundTierTuning>;

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
  arenaBackgroundPreviewTier: number;
  arenaBackgroundPreviewVariant: string;
  arenaBackgroundEditMode: boolean;
  arenaBackgroundEditLayer: ArenaBackgroundEditLayer;
  arenaBackgroundTiers: ArenaBackgroundTierTuningMap;
  arenaTier1BackFollowX: number;
  arenaTier1BackFollowY: number;
  arenaTier1BackZoom: number;
  arenaTier1BackLookUpY: number;
  arenaTier1MidFollowX: number;
  arenaTier1MidFollowY: number;
  arenaTier1MidZoom: number;
  arenaTier1MidLookUpY: number;
  arenaTier1MidZoomDarken: number;
  arenaTier1GroundFollowX: number;
  arenaTier1GroundFollowY: number;
  arenaTier1GroundZoom: number;
  arenaTier1GroundLookUpY: number;
  arenaTier2BackFollowX: number;
  arenaTier2BackFollowY: number;
  arenaTier2BackZoom: number;
  arenaTier2BackLookUpY: number;
  arenaTier2MidFollowX: number;
  arenaTier2MidFollowY: number;
  arenaTier2MidZoom: number;
  arenaTier2MidLookUpY: number;
  arenaTier2MidZoomDarken: number;
  arenaTier2GroundFollowX: number;
  arenaTier2GroundFollowY: number;
  arenaTier2GroundZoom: number;
  arenaTier2GroundLookUpY: number;
  arenaTier2FrontFollowX: number;
  arenaTier2FrontFollowY: number;
  arenaTier2FrontZoom: number;
  arenaTier2FrontLookUpY: number;
  arenaTier2AmbientFollowX: number;
  arenaTier2AmbientFollowY: number;
  arenaTier2AmbientZoom: number;
  arenaTier2AmbientLookUpY: number;
  arenaTier2AmbientFarAlpha: number;
  arenaTier2AmbientNearAlpha: number;
  arenaTier1BackgroundBackX: number;
  arenaTier1BackgroundBackY: number;
  arenaTier1BackgroundBackScale: number;
  arenaTier1BackgroundBackAlpha: number;
  arenaTier1BackgroundBackVisible: boolean;
  arenaTier1BackgroundMidX: number;
  arenaTier1BackgroundMidY: number;
  arenaTier1BackgroundMidScale: number;
  arenaTier1BackgroundMidAlpha: number;
  arenaTier1BackgroundMidVisible: boolean;
  arenaTier1BackgroundGroundX: number;
  arenaTier1BackgroundGroundY: number;
  arenaTier1BackgroundGroundScale: number;
  arenaTier1BackgroundGroundAlpha: number;
  arenaTier1BackgroundGroundVisible: boolean;
  arenaTier2BackgroundBackX: number;
  arenaTier2BackgroundBackY: number;
  arenaTier2BackgroundBackScale: number;
  arenaTier2BackgroundBackAlpha: number;
  arenaTier2BackgroundBackVisible: boolean;
  arenaTier2BackgroundMidX: number;
  arenaTier2BackgroundMidY: number;
  arenaTier2BackgroundMidScale: number;
  arenaTier2BackgroundMidAlpha: number;
  arenaTier2BackgroundMidVisible: boolean;
  arenaTier2BackgroundGroundX: number;
  arenaTier2BackgroundGroundY: number;
  arenaTier2BackgroundGroundScale: number;
  arenaTier2BackgroundGroundAlpha: number;
  arenaTier2BackgroundGroundVisible: boolean;
  arenaTier2BackgroundFrontX: number;
  arenaTier2BackgroundFrontY: number;
  arenaTier2BackgroundFrontScale: number;
  arenaTier2BackgroundFrontAlpha: number;
  arenaTier2BackgroundFrontVisible: boolean;
  arenaTier2BackgroundAmbientX: number;
  arenaTier2BackgroundAmbientY: number;
  arenaTier2BackgroundAmbientScale: number;
  arenaTier2BackgroundAmbientAlpha: number;
  arenaTier2BackgroundAmbientVisible: boolean;
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
  animationWeaponDragEnabled: boolean;
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
  scroll: { x: 0, y: 0 },
  fireball: { x: 0, y: 0 },
  ward: { x: 0, y: 0 },
  preciseStrike: { x: 0, y: 0 },
  doubleStrike: { x: 0, y: 0 },
  poison: { x: 0, y: 0 },
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
    scroll: { x: 132, y: -92, rotation: 14 },
    fireball: { x: 0, y: -164, rotation: 0 },
    ward: { x: -132, y: -92, rotation: -14 },
    preciseStrike: { x: 0, y: -180, rotation: 0 },
    doubleStrike: { x: 0, y: -148, rotation: 0 },
    poison: { x: 132, y: -128, rotation: 12 },
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
    scroll: { x: 132, y: -92, rotation: 14 },
    fireball: { x: 0, y: -164, rotation: 0 },
    ward: { x: -132, y: -92, rotation: -14 },
    preciseStrike: { x: 0, y: -180, rotation: 0 },
    doubleStrike: { x: 0, y: -148, rotation: 0 },
    poison: { x: 132, y: -128, rotation: 12 },
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
    scroll: { x: 132, y: -92, rotation: 12 },
    fireball: { x: 0, y: -112, rotation: 0 },
    ward: { x: -132, y: -92, rotation: -12 },
    preciseStrike: { x: 0, y: -128, rotation: 0 },
    doubleStrike: { x: 0, y: -148, rotation: 0 },
    poison: { x: 132, y: -128, rotation: 12 },
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
  weaponMain: { x: 16.755, y: -89.271, angle: 55, scaleX: 0.6, scaleY: 0.49, flipX: false, flipY: false },
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
  selectedVariantId: "lunge4",
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
      duration: 1000,
      variantId: "lunge2",
      variantLabel: "lunge2",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["axe", "mace"],
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
        head: { x: 84.246, y: 32.146, angle: 30.853, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 28.703, y: 6, angle: 27.521, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 47.106, y: 18.619, angle: -136.294, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 110.025, y: -98.48, angle: -94.274, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 182.486, y: -161.284, angle: -85.189, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
        frontUpperArm: { x: 61.106, y: 64.759, angle: -76.275, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 118.773, y: 13.531, angle: -56.6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 160.803, y: -2.407, angle: -48.485, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 31.823, y: 18.657, angle: 47.804, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -13.237, y: 33.377, angle: 67.044, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -72.484, y: 55.034, angle: 92.462, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: 12.507, y: 27.771, angle: -12.115, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 24.688, y: 62.634, angle: 3.484, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: 9.988, y: 101.28, angle: 59.706, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
          time: 90,
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
          time: 186.364,
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
          time: 261,
          easing: "easeInOut",
          rigParts: {
            head: { x: -85.97, y: -163.377, angle: -6.597, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -56.39, y: -175.763, angle: -18.992, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -100.6, y: -130.792, angle: -130.053, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -35.61, y: -248.654, angle: -130.401, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 23.823, y: -352.883, angle: -114.672, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -73.468, y: -162.461, angle: -139.949, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -52.41, y: -282.631, angle: -119.891, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -4.469, y: -362.739, angle: -88.401, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: -33.115, y: -152.176, angle: 19.126, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -45.498, y: -119.45, angle: 41.335, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -70.229, y: -77.485, angle: 57.662, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: -54.387, y: -168.566, angle: -25.747, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -24.892, y: -140.038, angle: 16.873, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -56.558, y: -108.627, angle: 15.661, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 2.981, y: 0 },
        },
        {
          id: "key-353",
          time: 369,
          easing: "easeInOut",
          rigParts: {
            head: { x: -61.952, y: -103.121, angle: -1.064, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -42.111, y: -112.705, angle: -10.425, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -69.915, y: -67.481, angle: -205, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -94.395, y: -193.832, angle: -205, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -116.337, y: -311.678, angle: -205, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -48.059, y: -93.285, angle: -132.056, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -18.906, y: -207.383, angle: -113.877, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 31.837, y: -281.57, angle: -85.309, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: -22.995, y: -90.219, angle: 12.983, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -28.929, y: -59.265, angle: 35.334, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -33.894, y: -34.799, angle: 6.873, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: -42.818, y: -102.007, angle: -61.926, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 16.373, y: -104.948, angle: -25.24, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 37.863, y: -69.192, angle: 9.729, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 2.998, y: 0.13 },
        },
        {
          id: "pose-b",
          time: 500,
          easing: "easeInOut",
          rigParts: {
            head: { x: 84.246, y: 32.146, angle: 30.853, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 28.703, y: 6, angle: 27.521, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 47.106, y: 18.619, angle: -136.294, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 110.025, y: -98.48, angle: -94.274, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 182.486, y: -161.284, angle: -85.189, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 61.106, y: 64.759, angle: -76.275, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 118.773, y: 13.531, angle: -56.6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 160.803, y: -2.407, angle: -48.485, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.823, y: 18.657, angle: 47.804, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -13.237, y: 33.377, angle: 67.044, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -72.484, y: 55.034, angle: 92.462, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 12.507, y: 27.771, angle: -12.115, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 24.688, y: 62.634, angle: 3.484, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 9.988, y: 101.28, angle: 59.706, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 2.99, y: 0.235 },
        },
        {
          id: "key-743",
          time: 546,
          easing: "easeInOut",
          rigParts: {
            head: { x: 115.047, y: 58.244, angle: 14.925, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 57.818, y: 35, angle: 28.485, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 83.203, y: 30.031, angle: -48.759, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 159.481, y: 15.859, angle: -35.159, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 200.427, y: 9.728, angle: -20.935, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 97.383, y: 90.622, angle: -63.829, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 146.883, y: 55.076, angle: -31.491, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 165.799, y: 57.003, angle: -23.606, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 55.578, y: 48.581, angle: 40.11, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 16.543, y: 67.718, angle: 51.715, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -22.794, y: 97.507, angle: 74.955, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 45.775, y: 60.706, angle: -1.816, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 43.811, y: 93.112, angle: 20.997, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 12.966, y: 120.088, angle: 28.95, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -0.092, y: 0.117 },
        },
        {
          id: "key-757",
          time: 587,
          easing: "linear",
          rigParts: {
            head: { x: 115.661, y: 98.782, angle: 41.286, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 45.173, y: 61.819, angle: 36.723, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 87.483, y: 61.116, angle: -37.159, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 151.52, y: 50.393, angle: -32.624, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 193.188, y: 47.845, angle: -23.41, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 94.799, y: 128.136, angle: -49.073, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 136.163, y: 106.832, angle: -14.314, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 135.699, y: 109.581, angle: -5.768, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 43.218, y: 73.368, angle: 28.211, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 15.547, y: 95.201, angle: 37.933, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -3.713, y: 139.946, angle: 60.635, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 38.787, y: 68.988, angle: -9.274, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 44.073, y: 97.784, angle: 46.685, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -1.741, y: 111.83, angle: -0.045, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -0.852, y: 0.088 },
        },
        {
          id: "key-560",
          time: 887.059,
          easing: "easeInOut",
          rigParts: {
            head: { x: 78.77, y: 45.883, angle: 5.978, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 28.857, y: 30.281, angle: 24.445, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 49.793, y: 23.441, angle: 33.445, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 23.842, y: 16.463, angle: 10.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 30.906, y: 21.486, angle: 4.445, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 73.974, y: 68.452, angle: 9.445, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 50.246, y: 77.06, angle: 30.445, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 0.975, y: 66, angle: 32.112, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 23.189, y: 47.544, angle: 27.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -4.333, y: 74.247, angle: 31.445, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -17.556, y: 114.179, angle: 52.513, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 23.991, y: 58.28, angle: 3.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 13.897, y: 88.857, angle: 33.445, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -28.665, y: 107.502, angle: -6.689, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -3.162, y: 0 },
        },
      ],
    },
{
      enabled: true,
      duration: 700,
      variantId: "lunge3",
      variantLabel: "lunge3",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["spear"],
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
        head: { x: 110.02, y: 83.25, angle: 50.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 89.148, y: 41.129, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 67.526, y: 27.979, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 73.59, y: 30.628, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
        frontUpperArm: { x: 106.301, y: 105.571, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 44.023, y: 95.014, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -21.792, y: 51.072, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 23.653, y: 60.913, angle: -38.265, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: 74.148, y: 77.804, angle: -8.443, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: 119.234, y: 100.421, angle: -11.637, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: 28.069, y: 74.13, angle: 36.916, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -16.165, y: 93.253, angle: 71.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -91.929, y: 80.804, angle: 82.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      movementStartKeyframeId: "key-263",
      impactKeyframeId: "key-927",
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
          time: 64,
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
          time: 127,
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
          id: "key-263",
          time: 208,
          easing: "easeInOut",
          rigParts: {
            head: { x: 102.024, y: 73.656, angle: 29.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 27.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 59.198, y: 29.029, angle: -23.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.649, y: 57.715, angle: 37.067, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -4.244, y: 76.735, angle: 39.89, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -28.642, y: 111.353, angle: 63.695, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.069, y: 74.13, angle: 11.911, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 8.591, y: 102.827, angle: 38.867, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -38.505, y: 117.774, angle: 1.678, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "key-408",
          time: 241,
          easing: "easeInOut",
          rigParts: {
            head: { x: 108.421, y: 83.25, angle: 47.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 59.198, y: 29.029, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.649, y: 57.715, angle: 54.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -19.495, y: 61.276, angle: 84.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -70.03, y: 63.399, angle: 81.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.069, y: 74.13, angle: -41.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 66.111, y: 82.829, angle: -9.794, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 67.052, y: 119.362, angle: 10.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "key-433",
          time: 289,
          easing: "easeInOut",
          rigParts: {
            head: { x: 111.619, y: 83.25, angle: 29.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 59.198, y: 29.029, angle: -35.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.649, y: 57.715, angle: 45.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -12.29, y: 69.703, angle: 123.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -70.812, y: 20.942, angle: 108.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 12.989, y: 74.13, angle: -11.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 20.183, y: 106.589, angle: 50.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -41.766, y: 115.961, angle: 4.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "pose-b",
          time: 352.8,
          easing: "easeInOut",
          rigParts: {
            head: { x: 110.02, y: 83.25, angle: 50.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 89.148, y: 41.129, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 67.526, y: 27.979, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 73.59, y: 30.628, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 106.301, y: 105.571, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 44.023, y: 95.014, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -21.792, y: 51.072, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 23.653, y: 60.913, angle: -38.265, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 74.148, y: 77.804, angle: -8.443, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: 119.234, y: 100.421, angle: -11.637, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.069, y: 74.13, angle: 36.916, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -16.165, y: 93.253, angle: 71.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -91.929, y: 80.804, angle: 82.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "key-563",
          time: 387,
          easing: "easeInOut",
          rigParts: {
            head: { x: 102.024, y: 73.656, angle: 44.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 33.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 81.152, y: 45.926, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 59.53, y: 32.776, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 65.595, y: 35.426, angle: -35.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 107.9, y: 111.968, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 45.622, y: 101.41, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -20.192, y: 57.469, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.649, y: 57.715, angle: 6.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 31.677, y: 94.858, angle: 57.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -7.663, y: 122.568, angle: 60.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.069, y: 74.13, angle: -41.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 66.111, y: 82.829, angle: -36.794, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 99.035, y: 109.767, angle: -13.983, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "key-860",
          time: 535,
          easing: "easeInOut",
          rigParts: {
            head: { x: 101.825, y: 73.493, angle: 25.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.79, y: 45.426, angle: 31.715, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 56.616, y: 40.553, angle: -2.088, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 74.626, y: 36.706, angle: -25.326, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 112.43, y: 19.646, angle: -29.774, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 93.405, y: 100.534, angle: 43.82, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 33.667, y: 86.825, angle: 63.283, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -28.778, y: 41.852, angle: 65.032, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.587, y: 57.602, angle: 27.943, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 6.491, y: 82.058, angle: 45.087, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -22.36, y: 114.619, angle: 62.577, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.014, y: 73.986, angle: -3.928, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 25.734, y: 96.72, angle: 16.211, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 2.597, y: 115.291, angle: -2.999, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.908, y: 0 },
        },
        {
          id: "key-927",
          time: 630,
          easing: "easeInOut",
          rigParts: {
            head: { x: 94.101, y: 73.005, angle: 16.911, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 37.068, y: 42.789, angle: 29.449, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 51.927, y: 43.241, angle: -16.48, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 84.893, y: 50.396, angle: -39.5, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 138.042, y: 26.913, angle: -28.611, scaleX: 1.129, scaleY: 1.062, flipX: false, flipY: false },
            frontUpperArm: { x: 84.396, y: 89.421, angle: 31.195, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 34.664, y: 87.703, angle: 49.662, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -25.505, y: 56.687, angle: 52.309, scaleX: 1.113, scaleY: 1.046, flipX: true, flipY: false },
            backThigh: { x: 30.185, y: 55.046, angle: 35.353, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -3.909, y: 74.713, angle: 38.091, scaleX: 0.945, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -28.15, y: 109.44, angle: 60.75, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 26.759, y: 70.702, angle: 11.36, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 8.043, y: 99.551, angle: 37.07, scaleX: 0.964, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -37.199, y: 115.564, angle: 1.601, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.779, y: 0 },
        },
      ],
    },
{
      enabled: true,
      duration: 700,
      variantId: "lunge4",
      variantLabel: "lunge4",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["sword"],
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
        head: { x: 110.02, y: 83.25, angle: 50.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 89.148, y: 41.129, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 67.526, y: 27.979, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 73.59, y: 30.628, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
        frontUpperArm: { x: 106.301, y: 105.571, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 44.023, y: 95.014, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -21.792, y: 51.072, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 23.653, y: 60.913, angle: -38.265, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: 74.148, y: 77.804, angle: -8.443, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: 119.234, y: 100.421, angle: -11.637, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: 28.069, y: 74.13, angle: 36.916, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -16.165, y: 93.253, angle: 71.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -91.929, y: 80.804, angle: 82.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      movementStartKeyframeId: "key-263",
      impactKeyframeId: "key-927",
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
          time: 64,
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
          time: 127,
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
          id: "key-263",
          time: 208,
          easing: "easeInOut",
          rigParts: {
            head: { x: 102.024, y: 73.656, angle: 29.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 27.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 59.198, y: 29.029, angle: -23.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.649, y: 57.715, angle: 37.067, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -4.244, y: 76.735, angle: 39.89, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -28.642, y: 111.353, angle: 63.695, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.069, y: 74.13, angle: 11.911, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 8.591, y: 102.827, angle: 38.867, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -38.505, y: 117.774, angle: 1.678, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "key-408",
          time: 241,
          easing: "easeInOut",
          rigParts: {
            head: { x: 108.421, y: 83.25, angle: 47.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 59.198, y: 29.029, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.649, y: 57.715, angle: 54.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -19.495, y: 61.276, angle: 84.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -70.03, y: 63.399, angle: 81.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.069, y: 74.13, angle: -41.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 66.111, y: 82.829, angle: -9.794, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 67.052, y: 119.362, angle: 10.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "key-433",
          time: 289,
          easing: "easeInOut",
          rigParts: {
            head: { x: 111.619, y: 83.25, angle: 29.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 59.198, y: 29.029, angle: -35.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.649, y: 57.715, angle: 45.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -12.29, y: 69.703, angle: 123.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -70.812, y: 20.942, angle: 108.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 12.989, y: 74.13, angle: -11.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 20.183, y: 106.589, angle: 50.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -41.766, y: 115.961, angle: 4.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "pose-b",
          time: 352.8,
          easing: "easeInOut",
          rigParts: {
            head: { x: 110.02, y: 83.25, angle: 50.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 89.148, y: 41.129, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 67.526, y: 27.979, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 73.59, y: 30.628, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 106.301, y: 105.571, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 44.023, y: 95.014, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -21.792, y: 51.072, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 23.653, y: 60.913, angle: -38.265, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 74.148, y: 77.804, angle: -8.443, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: 119.234, y: 100.421, angle: -11.637, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.069, y: 74.13, angle: 36.916, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -16.165, y: 93.253, angle: 71.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -91.929, y: 80.804, angle: 82.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "key-563",
          time: 387,
          easing: "easeInOut",
          rigParts: {
            head: { x: 102.024, y: 73.656, angle: 44.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.866, y: 45.543, angle: 33.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 81.152, y: 45.926, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 59.53, y: 32.776, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 65.595, y: 35.426, angle: -35.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 107.9, y: 111.968, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 45.622, y: 101.41, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -20.192, y: 57.469, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.649, y: 57.715, angle: 6.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 31.677, y: 94.858, angle: 57.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -7.663, y: 122.568, angle: 60.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.069, y: 74.13, angle: -41.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 66.111, y: 82.829, angle: -36.794, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 99.035, y: 109.767, angle: -13.983, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.914, y: 0 },
        },
        {
          id: "key-860",
          time: 535,
          easing: "easeInOut",
          rigParts: {
            head: { x: 101.825, y: 73.493, angle: 25.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 38.79, y: 45.426, angle: 31.715, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 56.616, y: 40.553, angle: -2.088, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 74.626, y: 36.706, angle: -25.326, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 112.43, y: 19.646, angle: -29.774, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 93.405, y: 100.534, angle: 43.82, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 33.667, y: 86.825, angle: 63.283, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -28.778, y: 41.852, angle: 65.032, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 31.587, y: 57.602, angle: 27.943, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: 6.491, y: 82.058, angle: 45.087, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -22.36, y: 114.619, angle: 62.577, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 28.014, y: 73.986, angle: -3.928, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 25.734, y: 96.72, angle: 16.211, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 2.597, y: 115.291, angle: -2.999, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.908, y: 0 },
        },
        {
          id: "key-927",
          time: 630,
          easing: "easeInOut",
          rigParts: {
            head: { x: 94.101, y: 73.005, angle: 16.911, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 37.068, y: 42.789, angle: 29.449, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 51.927, y: 43.241, angle: -16.48, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 84.893, y: 50.396, angle: -39.5, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 138.042, y: 26.913, angle: -28.611, scaleX: 1.129, scaleY: 1.062, flipX: false, flipY: false },
            frontUpperArm: { x: 84.396, y: 89.421, angle: 31.195, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 34.664, y: 87.703, angle: 49.662, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -25.505, y: 56.687, angle: 52.309, scaleX: 1.113, scaleY: 1.046, flipX: true, flipY: false },
            backThigh: { x: 30.185, y: 55.046, angle: 35.353, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -3.909, y: 74.713, angle: 38.091, scaleX: 0.945, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -28.15, y: 109.44, angle: 60.75, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: 26.759, y: 70.702, angle: 11.36, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 8.043, y: 99.551, angle: 37.07, scaleX: 0.964, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -37.199, y: 115.564, angle: 1.601, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: -2.779, y: 0 },
        },
        {
          id: "key-1000",
          time: 700,
          easing: "easeInOut",
          rigParts: {
            head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 4.11, y: -3.786, angle: -4, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
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
      ],
    }
  ],
};

export const DEFAULT_LIGHT_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 500,
  variantId: "default",
  variantLabel: "default",
  variantWeight: 1,
  appliesToAllWeapons: true,
  selectedVariantId: "spearattack",
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
    head: { x: 20.443, y: -3.52, angle: 24, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
    torso: { x: 0, y: -14, angle: 9, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
    backUpperArm: { x: -11.984, y: 2.441, angle: -45.78, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
    backForearm: { x: 56.382, y: -8.893, angle: -62.225, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
    backHand: { x: 126.18, y: -50.973, angle: -67.918, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
    frontUpperArm: { x: 32.891, y: -1.319, angle: 15, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
    frontForearm: { x: 2.585, y: 7.226, angle: 12, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontHand: { x: -25.447, y: 1.866, angle: 34, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
    backThigh: { x: 0, y: 0, angle: 21, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
    backShin: { x: -18.961, y: 28.026, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
    backFoot: { x: -38.475, y: 63.413, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
    frontThigh: { x: 0.96, y: 0, angle: 6, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontShin: { x: -8.163, y: 37.981, angle: 21, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
    frontFoot: { x: -43.157, y: 69.541, angle: 3, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      id: "pose-b",
      time: 250,
      easing: "easeInOut",
      rigParts: {
        head: { x: 20.443, y: -3.52, angle: 24, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 0, y: -14, angle: 9, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: -11.984, y: 2.441, angle: -45.78, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 56.382, y: -8.893, angle: -62.225, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 126.18, y: -50.973, angle: -67.918, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
        frontUpperArm: { x: 32.891, y: -1.319, angle: 15, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 2.585, y: 7.226, angle: 12, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -25.447, y: 1.866, angle: 34, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
        backThigh: { x: 0, y: 0, angle: 21, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: -18.961, y: 28.026, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -38.475, y: 63.413, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: 0.96, y: 0, angle: 6, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -8.163, y: 37.981, angle: 21, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -43.157, y: 69.541, angle: 3, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 0, y: 0 },
    },
  ],
  variants: [
{
      enabled: true,
      duration: 500,
      variantId: "spearattack",
      variantLabel: "spearattack",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["spear"],
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
        head: { x: 20.241, y: -3.58, angle: 23.764, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 0, y: -14, angle: 8.912, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: -13.281, y: -8.476, angle: -24.555, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 32.332, y: -4.382, angle: -55.681, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 99.678, y: -39.729, angle: -7.842, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
        frontUpperArm: { x: 32.784, y: -1.414, angle: -5.922, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 31.873, y: 7.405, angle: 53.459, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -31.788, y: -23.253, angle: 66.547, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
        backThigh: { x: 0, y: 0, angle: 20.794, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: -18.746, y: 28.075, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -38.274, y: 63.478, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: 0.948, y: 0, angle: 5.941, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -8.115, y: 37.922, angle: 20.794, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -42.834, y: 69.546, angle: 2.971, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
          id: "pose-b",
          time: 250,
          easing: "easeInOut",
          rigParts: {
            head: { x: 20.241, y: -3.58, angle: 23.764, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 0, y: -14, angle: 8.912, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -13.281, y: -8.476, angle: -24.555, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 32.332, y: -4.382, angle: -55.681, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 99.678, y: -39.729, angle: -7.842, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: 32.784, y: -1.414, angle: -5.922, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 31.873, y: 7.405, angle: 53.459, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -31.788, y: -23.253, angle: 66.547, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 20.794, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -18.746, y: 28.075, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -38.274, y: 63.478, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: 0.948, y: 0, angle: 5.941, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -8.115, y: 37.922, angle: 20.794, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -42.834, y: 69.546, angle: 2.971, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
export const DEFAULT_MEDIUM_ANIMATION: BodyAnimationTuning = {
  enabled: true,
  duration: 500,
  variantId: "default",
  variantLabel: "default",
  variantWeight: 1,
  appliesToAllWeapons: true,
  selectedVariantId: "medium4",
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
    },
{
      enabled: true,
      duration: 500,
      variantId: "medium4",
      variantLabel: "medium4",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["sword"],
      base: {
        head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 4.11, y: -3.786, angle: -25, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
        frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -2.89, y: -2, angle: 19, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -10.25, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      breath: {
        head: { x: 5.059, y: 41.154, angle: 12, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: -1.896, y: 33.493, angle: 2.873, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: -26.613, y: 57.212, angle: -63.203, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 55.949, y: 30.67, angle: -70.822, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 130.55, y: -18.984, angle: -28.381, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
        frontUpperArm: { x: 11.597, y: 47.407, angle: -71.822, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 67.863, y: 0.283, angle: 42.051, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 7.693, y: -19.096, angle: 52, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 4.74, y: 34.588, angle: 37.347, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: -24.493, y: 44.218, angle: -4.746, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -36.971, y: 76.543, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: -5.938, y: 29.914, angle: -31.601, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 22.347, y: 46.022, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: 15.347, y: 76.543, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
      },
      faceBase: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      faceBreath: {
        eyeLeft: { x: 1.203, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 14.034, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
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
            frontHand: { x: -2.89, y: -2, angle: 19, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
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
          id: "key-360",
          time: 153,
          easing: "easeInOut",
          rigParts: {
            head: { x: -1.632, y: 29.665, angle: -9, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -1.502, y: 23.61, angle: 2.275, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -26.587, y: 42.084, angle: -35.051, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 23.136, y: 39.009, angle: -43.876, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 79.029, y: 17.771, angle: -27.678, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: 18.43, y: 23.123, angle: -2.876, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 12.199, y: 24.277, angle: 32.677, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -34.658, y: 8.722, angle: 42.133, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 3.754, y: 27.391, angle: 29.576, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -18.772, y: 41.883, angle: -3.55, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -33.025, y: 75.182, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -4.755, y: 23.689, angle: -25.026, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 17.021, y: 43.105, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 10.021, y: 75.182, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -0.192, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 11.842, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "pose-b",
          time: 257,
          easing: "easeInOut",
          rigParts: {
            head: { x: 5.059, y: 41.154, angle: 12, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -1.896, y: 33.493, angle: 2.873, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -26.613, y: 57.212, angle: -63.203, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 55.949, y: 30.67, angle: -70.822, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 130.55, y: -18.984, angle: -28.381, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: 11.597, y: 47.407, angle: -71.822, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 67.863, y: 0.283, angle: 42.051, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 7.693, y: -19.096, angle: 52, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 4.74, y: 34.588, angle: 37.347, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -24.493, y: 44.218, angle: -4.746, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -36.971, y: 76.543, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -5.938, y: 29.914, angle: -31.601, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 22.347, y: 46.022, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 15.347, y: 76.543, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: 1.203, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 14.034, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
      ],
    },
{
      enabled: true,
      duration: 500,
      variantId: "spearattack",
      variantLabel: "spearattack",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["spear"],
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
        head: { x: 20.377, y: -3.54, angle: 23.923, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 0, y: -14, angle: 8.971, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: -13.222, y: -8.459, angle: -24.72, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 32.629, y: -4.404, angle: -56.061, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 100.318, y: -39.97, angle: -28.868, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
        frontUpperArm: { x: 32.857, y: -1.35, angle: -5.962, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 32.011, y: 7.462, angle: 53.837, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -31.988, y: -23.392, angle: 66.866, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
        backThigh: { x: 0, y: 0, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: -18.891, y: 28.042, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -38.41, y: 63.434, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: 0.956, y: 0, angle: 5.981, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -8.147, y: 37.962, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -43.052, y: 69.543, angle: 2.99, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
          id: "pose-b",
          time: 250,
          easing: "easeInOut",
          rigParts: {
            head: { x: 20.377, y: -3.54, angle: 23.923, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 0, y: -14, angle: 8.971, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -13.222, y: -8.459, angle: -24.72, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 32.629, y: -4.404, angle: -56.061, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 100.318, y: -39.97, angle: -28.868, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: 32.857, y: -1.35, angle: -5.962, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 32.011, y: 7.462, angle: 53.837, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -31.988, y: -23.392, angle: 66.866, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -18.891, y: 28.042, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -38.41, y: 63.434, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: 0.956, y: 0, angle: 5.981, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -8.147, y: 37.962, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -43.052, y: 69.543, angle: 2.99, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
  selectedVariantId: "heavy4",
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
        head: { x: 71.602, y: 24.928, angle: 18.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 4.655, y: -3.119, angle: 33.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: 31.507, y: 7.673, angle: 213.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        backForearm: { x: 84.603, y: -116.295, angle: 235.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backHand: { x: 147.177, y: -207.804, angle: 247.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
        frontUpperArm: { x: 57.918, y: 54.656, angle: -5.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 54.48, y: 60.344, angle: 12.529, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: 23.442, y: 58.503, angle: 13.529, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 0, y: -1.433, angle: 53.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: -56.601, y: 2.926, angle: 43, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -119.067, y: 24.533, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: -19.486, y: 4.149, angle: -20.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 0.874, y: 27.29, angle: 24.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -35.565, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-197",
          time: 135,
          easing: "easeInOut",
          rigParts: {
            head: { x: -50.906, y: -3.67, angle: -27, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -12.649, y: -13.887, angle: -21, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -50.34, y: 25.584, angle: 30, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -77.17, y: 23.036, angle: 31, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: -91.915, y: 19.186, angle: 10, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -22.872, y: -27.522, angle: -36, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 9.65, y: -34.344, angle: -39, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 31.744, y: -41.827, angle: -17, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 18, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -15.713, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -37.982, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -4.973, y: 1.18, angle: -57, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 47.006, y: -2.391, angle: -3, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 44.279, y: 37.789, angle: 15, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-256",
          time: 277,
          easing: "easeInOut",
          rigParts: {
            head: { x: -81.605, y: 18.751, angle: -41.998, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -22.095, y: -5.626, angle: -32.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -65.689, y: 48.004, angle: 32.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -85.761, y: 49.486, angle: 24.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -112.707, y: 44.261, angle: 39.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -63.017, y: -10.999, angle: -107.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -10.363, y: -103.215, angle: -89.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 46.988, y: -151.282, angle: -88.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -4.973, y: 1.18, angle: -56.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 47.003, y: -2.39, angle: -20.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 63.169, y: 35.431, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-273",
          time: 415,
          easing: "easeInOut",
          rigParts: {
            head: { x: -73.561, y: 17.411, angle: -33.483, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -22.095, y: -5.626, angle: -29.592, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -62.338, y: 50.683, angle: 60.247, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -102.071, y: 23.387, angle: 67.574, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -160.531, y: -19.03, angle: 110.386, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -50.112, y: -2.401, angle: -104.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 5.08, y: -86.671, angle: -86.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 61.72, y: -131.438, angle: -85.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: -9.066, y: 11.649, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -24.778, y: 35.931, angle: -11, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -34.236, y: 65.165, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -4.973, y: 1.18, angle: -65.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 57.364, y: -7.567, angle: -14.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 65.76, y: 28.959, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-357",
          time: 432,
          easing: "easeInOut",
          rigParts: {
            head: { x: -67.435, y: 16.39, angle: -26.998, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -22.095, y: -5.626, angle: -26.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -59.785, y: 52.724, angle: 80.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -114.493, y: 3.511, angle: 99.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -170.546, y: -71.53, angle: 111.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -50.112, y: 0.465, angle: -107.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 2.542, y: -91.751, angle: -89.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 59.893, y: -139.818, angle: -88.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -18.91, y: 29.46, angle: 10, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -49.967, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -4.973, y: 1.18, angle: -56.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 47.003, y: -2.39, angle: -20.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 63.169, y: 35.431, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-342",
          time: 450,
          easing: "easeInOut",
          rigParts: {
            head: { x: -32.684, y: 5.264, angle: 3.002, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -12.648, y: -9.167, angle: -11.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -40.892, y: 32.662, angle: 98.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -97.066, y: -38.865, angle: 117.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -144.639, y: -133.061, angle: 153.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -28.857, y: 0.465, angle: -77.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 28.341, y: -54.278, angle: -59.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 71.238, y: -72.268, angle: -58.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -7.335, y: 4.72, angle: -50.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 40.725, y: 7.022, angle: -14.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 49.362, y: 46.876, angle: 6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-408",
          time: 467,
          easing: "easeInOut",
          rigParts: {
            head: { x: -16.152, y: 2.903, angle: 18.002, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -12.648, y: -9.167, angle: -2.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -20.817, y: 23.221, angle: 143.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -48.592, y: -99.04, angle: 165.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -51.842, y: -220.776, angle: 189.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -9.964, y: 2.825, angle: -47.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 32.433, y: -17.193, angle: -29.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 47.774, y: -16.362, angle: -28.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -15.601, y: 10.621, angle: -44.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 26.776, y: 18.229, angle: -8.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 27.711, y: 59.319, angle: 12, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-478",
          time: 482,
          easing: "easeInOut",
          rigParts: {
            head: { x: 41.814, y: 13.279, angle: 39.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 4.655, y: -5.708, angle: 18.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 22.441, y: 15.439, angle: 165.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 19.111, y: -117.329, angle: 187.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 39.55, y: -240.455, angle: 199.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 41.081, y: 31.358, angle: -26.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 62.208, y: 28.208, angle: -8.471, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 53.675, y: 31.476, angle: -7.471, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: -1.433, angle: 44.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -50.125, y: 9.398, angle: 28, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -95.754, y: 47.831, angle: -24, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -15.601, y: 10.621, angle: -44.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 26.776, y: 18.229, angle: 0.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 16.24, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "pose-b",
          time: 499,
          easing: "easeInOut",
          rigParts: {
            head: { x: 71.602, y: 24.928, angle: 18.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 4.655, y: -3.119, angle: 33.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 31.507, y: 7.673, angle: 213.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 84.603, y: -116.295, angle: 235.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 147.177, y: -207.804, angle: 247.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 57.918, y: 54.656, angle: -5.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 54.48, y: 60.344, angle: 12.529, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 23.442, y: 58.503, angle: 13.529, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: -1.433, angle: 53.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -56.601, y: 2.926, angle: 43, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -119.067, y: 24.533, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -19.486, y: 4.149, angle: -20.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 0.874, y: 27.29, angle: 24.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -35.565, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-536",
          time: 519,
          easing: "easeInOut",
          rigParts: {
            head: { x: 108.387, y: 59.141, angle: 72.431, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 15.722, y: 5.774, angle: 54.496, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 69.882, y: 10.789, angle: 303.209, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 152.685, y: -17.597, angle: 304.286, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 213.123, y: -35.59, angle: 343.187, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 85.431, y: 69.993, angle: 45.343, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 21.171, y: 58.239, angle: 75.3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -48.065, y: -0.144, angle: 85.267, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: -1.433, angle: 33.076, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -31.576, y: 16.513, angle: 19.087, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -70.123, y: 44.89, angle: -0.011, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -15.615, y: 10.597, angle: -44.91, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 26.682, y: 18.263, angle: 0.088, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 16.051, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-618",
          time: 696,
          easing: "easeInOut",
          rigParts: {
            head: { x: 71.602, y: 24.928, angle: 18.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 4.655, y: -3.119, angle: 33.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 31.507, y: 7.673, angle: 213.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 84.603, y: -116.295, angle: 235.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 147.177, y: -207.804, angle: 247.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 57.918, y: 54.656, angle: -5.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 54.48, y: 60.344, angle: 12.529, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 23.442, y: 58.503, angle: 13.529, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: -1.433, angle: 53.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -56.601, y: 2.926, angle: 43, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -119.067, y: 24.533, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -19.486, y: 4.149, angle: -20.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 0.874, y: 27.29, angle: 24.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -35.565, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-659",
          time: 719,
          easing: "easeInOut",
          rigParts: {
            head: { x: 41.814, y: 13.279, angle: 39.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 4.655, y: -5.708, angle: 18.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 22.441, y: 15.439, angle: 165.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: 19.111, y: -117.329, angle: 187.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: 39.55, y: -240.455, angle: 199.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: 41.081, y: 31.358, angle: -26.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 62.208, y: 28.208, angle: -8.471, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 53.675, y: 31.476, angle: -7.471, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: -1.433, angle: 44.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -50.125, y: 9.398, angle: 28, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -95.754, y: 47.831, angle: -24, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -15.601, y: 10.621, angle: -44.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 26.776, y: 18.229, angle: 0.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 16.24, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-707",
          time: 741,
          easing: "easeInOut",
          rigParts: {
            head: { x: -16.152, y: 2.903, angle: 18.002, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -12.648, y: -9.167, angle: -2.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -20.817, y: 23.221, angle: 143.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -48.592, y: -99.04, angle: 165.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -51.842, y: -220.776, angle: 189.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -9.964, y: 2.825, angle: -47.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 32.433, y: -17.193, angle: -29.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 47.774, y: -16.362, angle: -28.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -15.601, y: 10.621, angle: -44.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 26.776, y: 18.229, angle: -8.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 27.711, y: 59.319, angle: 12, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-802",
          time: 763,
          easing: "easeInOut",
          rigParts: {
            head: { x: -32.684, y: 5.264, angle: 3.002, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -12.648, y: -9.167, angle: -11.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -40.892, y: 32.662, angle: 98.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -97.066, y: -38.865, angle: 117.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -144.639, y: -133.061, angle: 153.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -28.857, y: 0.465, angle: -77.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 28.341, y: -54.278, angle: -59.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 71.238, y: -72.268, angle: -58.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -7.335, y: 4.72, angle: -50.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 40.725, y: 7.022, angle: -14.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 49.362, y: 46.876, angle: 6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-856",
          time: 787,
          easing: "easeInOut",
          rigParts: {
            head: { x: -67.435, y: 16.39, angle: -26.998, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -22.095, y: -5.626, angle: -26.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -59.785, y: 52.724, angle: 80.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -114.493, y: 3.511, angle: 99.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -170.546, y: -71.53, angle: 111.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -50.112, y: 0.465, angle: -107.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 2.542, y: -91.751, angle: -89.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 59.893, y: -139.818, angle: -88.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -18.91, y: 29.46, angle: 10, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -49.967, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -4.973, y: 1.18, angle: -56.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 47.003, y: -2.39, angle: -20.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 63.169, y: 35.431, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-912",
          time: 809,
          easing: "easeInOut",
          rigParts: {
            head: { x: -73.561, y: 17.411, angle: -33.483, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -22.095, y: -5.626, angle: -29.592, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -62.338, y: 50.683, angle: 60.247, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -102.071, y: 23.387, angle: 67.574, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -160.531, y: -19.03, angle: 110.386, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -50.112, y: -2.401, angle: -104.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 5.08, y: -86.671, angle: -86.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 61.72, y: -131.438, angle: -85.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: -9.066, y: 11.649, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -24.778, y: 35.931, angle: -11, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -34.236, y: 65.165, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -4.973, y: 1.18, angle: -65.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 57.364, y: -7.567, angle: -14.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 65.76, y: 28.959, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-958",
          time: 828,
          easing: "easeInOut",
          rigParts: {
            head: { x: -81.605, y: 18.751, angle: -41.998, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -22.095, y: -5.626, angle: -32.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -65.689, y: 48.004, angle: 32.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            backForearm: { x: -85.761, y: 49.486, angle: 24.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backHand: { x: -112.707, y: 44.261, angle: 39.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -63.017, y: -10.999, angle: -107.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -10.363, y: -103.215, angle: -89.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: 46.988, y: -151.282, angle: -88.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -4.973, y: 1.18, angle: -56.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 47.003, y: -2.39, angle: -20.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: 63.169, y: 35.431, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
      ],
    },
{
      enabled: true,
      duration: 1200,
      variantId: "heavy4",
      variantLabel: "heavy4",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["sword"],
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
        head: { x: -73.334, y: -212.745, angle: -35.831, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: -40.475, y: -228.827, angle: -18.561, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: -88.031, y: -184.22, angle: -66.951, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: -7.531, y: -215.345, angle: -65.951, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 65.314, y: -256.087, angle: -30.59, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
        frontUpperArm: { x: -59.25, y: -238.241, angle: -47.702, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: -24.718, y: -262.843, angle: 15.657, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -55.657, y: -265.206, angle: 8.241, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
        backThigh: { x: -26.05, y: -196.57, angle: 12.298, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        backShin: { x: -32.405, y: -165.023, angle: 54.283, scaleX: 1.05, scaleY: 0.96, flipX: false, flipY: false },
        backFoot: { x: -85.578, y: -128.057, angle: 94.815, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        frontThigh: { x: -35.405, y: -210.213, angle: -33.907, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -0.439, y: -189.528, angle: 24.376, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -32.658, y: -157.803, angle: 60.681, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      impactKeyframeId: "pose-b",
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
          id: "key-362",
          time: 354,
          easing: "easeInOut",
          rigParts: {
            head: { x: -4.432, y: 87.874, angle: 21, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -79.616, y: 43.374, angle: 45, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -17.078, y: 38.536, angle: 75, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -75.817, y: -11.883, angle: 76, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: -135.37, y: -44.443, angle: 113, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: -25.595, y: 117.911, angle: -3, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -33.119, y: 128.541, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -49.599, y: 131.38, angle: 4, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -97.659, y: 44.462, angle: 30, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -119.617, y: 59.027, angle: -41, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -102.84, y: 77.687, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: -96.824, y: 49.884, angle: -42, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -56.545, y: 52.57, angle: 24, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -93.151, y: 79.974, angle: 6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-352",
          time: 484.5,
          easing: "easeInOut",
          rigParts: {
            head: { x: 14.732, y: 119.876, angle: 83.547, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -78.88, y: 50.969, angle: 58.705, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 13.931, y: 49.504, angle: 73.381, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -43.324, y: 0.39, angle: 74.381, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: -101.243, y: -31.528, angle: 110.021, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: -14.198, y: 159.25, angle: 26.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -59.28, y: 165.341, angle: 29.806, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -105.974, y: 151.238, angle: 37.324, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -76.892, y: 45.465, angle: 26.417, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -97.329, y: 69.261, angle: 65.575, scaleX: 1.05, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -152.075, y: 88.317, angle: 82.187, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: -94.739, y: 48.807, angle: -41.093, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -58.406, y: 60.151, angle: 23.482, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -94.373, y: 93.802, angle: 41.87, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "pose-b",
          time: 600,
          easing: "easeInOut",
          rigParts: {
            head: { x: -73.334, y: -212.745, angle: -35.831, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -40.475, y: -228.827, angle: -18.561, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -88.031, y: -184.22, angle: -66.951, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -7.531, y: -215.345, angle: -65.951, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 65.314, y: -256.087, angle: -30.59, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: -59.25, y: -238.241, angle: -47.702, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -24.718, y: -262.843, angle: 15.657, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -55.657, y: -265.206, angle: 8.241, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -26.05, y: -196.57, angle: 12.298, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -32.405, y: -165.023, angle: 54.283, scaleX: 1.05, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -85.578, y: -128.057, angle: 94.815, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: -35.405, y: -210.213, angle: -33.907, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -0.439, y: -189.528, angle: 24.376, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -32.658, y: -157.803, angle: 60.681, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "key-712",
          time: 909,
          easing: "easeInOut",
          rigParts: {
            head: { x: 14.732, y: 119.876, angle: 83.547, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: -78.88, y: 50.969, angle: 58.705, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: 13.931, y: 49.504, angle: 73.381, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -43.324, y: 0.39, angle: 74.381, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: -101.243, y: -31.528, angle: 110.021, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: -14.198, y: 159.25, angle: 26.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: -59.28, y: 165.341, angle: 29.806, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -105.974, y: 151.238, angle: 37.324, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: -76.892, y: 45.465, angle: 26.417, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            backShin: { x: -97.329, y: 69.261, angle: 65.575, scaleX: 1.05, scaleY: 0.96, flipX: false, flipY: false },
            backFoot: { x: -152.075, y: 88.317, angle: 82.187, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            frontThigh: { x: -94.739, y: 48.807, angle: -41.093, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -58.406, y: 60.151, angle: 23.482, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -94.373, y: 93.802, angle: 41.87, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          },
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
      ],
    },
{
      enabled: true,
      duration: 500,
      variantId: "spearattack",
      variantLabel: "spearattack",
      variantWeight: 1,
      appliesToAllWeapons: false,
      weaponClasses: ["spear"],
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
        head: { x: 20.377, y: -3.54, angle: 23.923, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 0, y: -14, angle: 8.971, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: -13.222, y: -8.459, angle: -24.72, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: 32.629, y: -4.404, angle: -56.061, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: 100.318, y: -39.97, angle: -28.868, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
        frontUpperArm: { x: 32.857, y: -1.35, angle: -5.962, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 32.011, y: 7.462, angle: 53.837, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -31.988, y: -23.392, angle: 66.866, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
        backThigh: { x: 0, y: 0, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: -18.891, y: 28.042, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -38.41, y: 63.434, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: 0.956, y: 0, angle: 5.981, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: -8.147, y: 37.962, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -43.052, y: 69.543, angle: 2.99, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
          id: "key-492",
          time: 246,
          easing: "easeInOut",
          rigParts: {
            head: { x: 20.361, y: -3.544, angle: 23.904, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 0, y: -14, angle: 8.964, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -13.229, y: -8.461, angle: -24.7, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 32.594, y: -4.402, angle: -56.015, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 97.88, y: -39.941, angle: -52.864, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: 32.848, y: -1.357, angle: -5.957, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 31.994, y: 7.455, angle: 53.792, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -31.964, y: -23.375, angle: 66.828, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 20.916, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -18.874, y: 28.046, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -38.394, y: 63.439, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: 0.955, y: 0, angle: 5.976, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -8.143, y: 37.957, angle: 20.916, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -43.026, y: 69.543, angle: 2.988, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
            head: { x: 20.377, y: -3.54, angle: 23.923, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 0, y: -14, angle: 8.971, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -13.222, y: -8.459, angle: -24.72, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: 32.629, y: -4.404, angle: -56.061, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: 100.318, y: -39.97, angle: -28.868, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
            frontUpperArm: { x: 32.857, y: -1.35, angle: -5.962, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 32.011, y: 7.462, angle: 53.837, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -31.988, y: -23.392, angle: 66.866, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
            backThigh: { x: 0, y: 0, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: -18.891, y: 28.042, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -38.41, y: 63.434, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: 0.956, y: 0, angle: 5.981, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: -8.147, y: 37.962, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -43.052, y: 69.543, angle: 2.99, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
  variantId: "default",
  variantLabel: "default",
  variantWeight: 1,
  appliesToAllWeapons: true,
  selectedVariantId: "hit2",
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
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
        eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
      },
      rootOffset: { x: 0, y: 0 },
    },
    {
      id: "pose-b",
      time: 200,
      easing: "easeInOut",
      rigParts: {
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
      faceParts: {
        eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.37, scaleY: 0.87 },
        eyeRight: { x: 3.5, y: -2, scaleX: 1.66, scaleY: 0.19 },
      },
      rootOffset: { x: 0, y: 0 },
    },
  ],
  variants: [
{
      enabled: true,
      duration: 400,
      variantId: "hit2",
      variantLabel: "hit2",
      variantWeight: 1,
      appliesToAllWeapons: true,
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
        head: { x: -31.992, y: 0.131, angle: -36.08, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
        torso: { x: 0, y: -14, angle: -16.248, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
        backUpperArm: { x: -37.988, y: 15.631, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
        backForearm: { x: -27.988, y: 25.631, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
        backHand: { x: -9.747, y: 31.023, angle: 13, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
        frontUpperArm: { x: -0.384, y: -23.783, angle: -18.956, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
        frontForearm: { x: 12.873, y: -19.654, angle: 8.044, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontHand: { x: -10.034, y: -20.378, angle: 23.168, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
        backThigh: { x: 13.857, y: 5.326, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
        backShin: { x: 15.857, y: 38.326, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
        backFoot: { x: -5.143, y: 75.326, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
        frontThigh: { x: 9.343, y: -1.065, angle: -2.708, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
        frontShin: { x: 9.748, y: 32.332, angle: 2.708, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
        frontFoot: { x: -3.636, y: 70.879, angle: -16.248, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
          faceParts: {
            eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
          },
          rootOffset: { x: 0, y: 0 },
        },
        {
          id: "pose-b",
          time: 200,
          easing: "easeInOut",
          rigParts: {
            head: { x: -31.992, y: 0.131, angle: -36.08, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
            torso: { x: 0, y: -14, angle: -16.248, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
            backUpperArm: { x: -37.988, y: 15.631, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
            backForearm: { x: -27.988, y: 25.631, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            backHand: { x: -9.747, y: 31.023, angle: 13, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
            frontUpperArm: { x: -0.384, y: -23.783, angle: -18.956, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
            frontForearm: { x: 12.873, y: -19.654, angle: 8.044, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontHand: { x: -10.034, y: -20.378, angle: 23.168, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
            backThigh: { x: 13.857, y: 5.326, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
            backShin: { x: 15.857, y: 38.326, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
            backFoot: { x: -5.143, y: 75.326, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
            frontThigh: { x: 9.343, y: -1.065, angle: -2.708, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
            frontShin: { x: 9.748, y: 32.332, angle: 2.708, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
            frontFoot: { x: -3.636, y: 70.879, angle: -16.248, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "pose-b",
            time: 1000,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      walkCycle: {
        enabled: true,
        duration: 420,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            time: 210,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: 1, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 13, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      lunge: {
        enabled: true,
        duration: 400,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            id: "pose-b",
            time: 200,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: 2, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 13.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      light: {
        enabled: true,
        duration: 500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            faceParts: {
              eyeLeft: { x: 2, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 15, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      medium: {
        enabled: true,
        duration: 500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
      },
      heavy: {
        enabled: true,
        duration: 700,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            time: 350,
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
      },
      bowShot: {
        enabled: true,
        duration: 500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            faceParts: {
              eyeLeft: { x: 0, y: -1, scaleX: 1.73, scaleY: 0.36 },
              eyeRight: { x: 12.5, y: -2, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      hit: {
        enabled: true,
        duration: 400,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "pose-b",
            time: 200,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.37, scaleY: 0.87 },
              eyeRight: { x: 3.5, y: -2, scaleX: 1.66, scaleY: 0.19 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      block: {
        enabled: true,
        duration: 500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            faceParts: {
              eyeLeft: { x: -1, y: -1.5, scaleX: 1.3, scaleY: 0.7 },
              eyeRight: { x: 12, y: -1.5, scaleX: 1.3, scaleY: 0.7 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      taunt: {
        enabled: true,
        duration: 600,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
              eyeLeft: { x: -3, y: 0, scaleX: 1.26, scaleY: 1 },
              eyeRight: { x: 2, y: 0, scaleX: 1.34, scaleY: 1 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "pose-b",
            time: 300,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: 1, y: 0.5, scaleX: 1.26, scaleY: 1 },
              eyeRight: { x: -3.5, y: 0, scaleX: 1.34, scaleY: 1 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      rest: {
        enabled: true,
        duration: 1000,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            time: 500,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -2, scaleX: 1.81, scaleY: 0.31 },
              eyeRight: { x: 4, y: -2.5, scaleX: 2.12, scaleY: 0.26 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
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
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "pose-b",
            time: 1000,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      walkCycle: {
        enabled: true,
        duration: 420,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            time: 210,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: 1, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 13, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      lunge: {
        enabled: true,
        duration: 1500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "lunge4",
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
            duration: 1000,
            variantId: "lunge2",
            variantLabel: "lunge2",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["axe", "mace"],
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
              head: { x: 84.246, y: 32.146, angle: 30.853, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 28.703, y: 6, angle: 27.521, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 47.106, y: 18.619, angle: -136.294, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 110.025, y: -98.48, angle: -94.274, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 182.486, y: -161.284, angle: -85.189, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
              frontUpperArm: { x: 61.106, y: 64.759, angle: -76.275, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 118.773, y: 13.531, angle: -56.6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 160.803, y: -2.407, angle: -48.485, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 31.823, y: 18.657, angle: 47.804, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -13.237, y: 33.377, angle: 67.044, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -72.484, y: 55.034, angle: 92.462, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: 12.507, y: 27.771, angle: -12.115, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 24.688, y: 62.634, angle: 3.484, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: 9.988, y: 101.28, angle: 59.706, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
                time: 90,
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
                time: 186.364,
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
                time: 261,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -85.97, y: -163.377, angle: -6.597, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -56.39, y: -175.763, angle: -18.992, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -100.6, y: -130.792, angle: -130.053, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -35.61, y: -248.654, angle: -130.401, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 23.823, y: -352.883, angle: -114.672, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -73.468, y: -162.461, angle: -139.949, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -52.41, y: -282.631, angle: -119.891, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -4.469, y: -362.739, angle: -88.401, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: -33.115, y: -152.176, angle: 19.126, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -45.498, y: -119.45, angle: 41.335, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -70.229, y: -77.485, angle: 57.662, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: -54.387, y: -168.566, angle: -25.747, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -24.892, y: -140.038, angle: 16.873, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -56.558, y: -108.627, angle: 15.661, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 2.981, y: 0 },
              },
              {
                id: "key-353",
                time: 369,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -61.952, y: -103.121, angle: -1.064, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -42.111, y: -112.705, angle: -10.425, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -69.915, y: -67.481, angle: -205, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -94.395, y: -193.832, angle: -205, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -116.337, y: -311.678, angle: -205, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -48.059, y: -93.285, angle: -132.056, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -18.906, y: -207.383, angle: -113.877, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 31.837, y: -281.57, angle: -85.309, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: -22.995, y: -90.219, angle: 12.983, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -28.929, y: -59.265, angle: 35.334, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -33.894, y: -34.799, angle: 6.873, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: -42.818, y: -102.007, angle: -61.926, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 16.373, y: -104.948, angle: -25.24, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 37.863, y: -69.192, angle: 9.729, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 2.998, y: 0.13 },
              },
              {
                id: "pose-b",
                time: 500,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 84.246, y: 32.146, angle: 30.853, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 28.703, y: 6, angle: 27.521, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 47.106, y: 18.619, angle: -136.294, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 110.025, y: -98.48, angle: -94.274, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 182.486, y: -161.284, angle: -85.189, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 61.106, y: 64.759, angle: -76.275, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 118.773, y: 13.531, angle: -56.6, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 160.803, y: -2.407, angle: -48.485, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.823, y: 18.657, angle: 47.804, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -13.237, y: 33.377, angle: 67.044, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -72.484, y: 55.034, angle: 92.462, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 12.507, y: 27.771, angle: -12.115, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 24.688, y: 62.634, angle: 3.484, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 9.988, y: 101.28, angle: 59.706, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 2.99, y: 0.235 },
              },
              {
                id: "key-743",
                time: 546,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 115.047, y: 58.244, angle: 14.925, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 57.818, y: 35, angle: 28.485, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 83.203, y: 30.031, angle: -48.759, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 159.481, y: 15.859, angle: -35.159, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 200.427, y: 9.728, angle: -20.935, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 97.383, y: 90.622, angle: -63.829, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 146.883, y: 55.076, angle: -31.491, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 165.799, y: 57.003, angle: -23.606, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 55.578, y: 48.581, angle: 40.11, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 16.543, y: 67.718, angle: 51.715, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -22.794, y: 97.507, angle: 74.955, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 45.775, y: 60.706, angle: -1.816, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 43.811, y: 93.112, angle: 20.997, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 12.966, y: 120.088, angle: 28.95, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -0.092, y: 0.117 },
              },
              {
                id: "key-757",
                time: 587,
                easing: "linear",
                rigParts: {
                  head: { x: 115.661, y: 98.782, angle: 41.286, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 45.173, y: 61.819, angle: 36.723, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 87.483, y: 61.116, angle: -37.159, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 151.52, y: 50.393, angle: -32.624, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 193.188, y: 47.845, angle: -23.41, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 94.799, y: 128.136, angle: -49.073, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 136.163, y: 106.832, angle: -14.314, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 135.699, y: 109.581, angle: -5.768, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 43.218, y: 73.368, angle: 28.211, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 15.547, y: 95.201, angle: 37.933, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -3.713, y: 139.946, angle: 60.635, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 38.787, y: 68.988, angle: -9.274, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 44.073, y: 97.784, angle: 46.685, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -1.741, y: 111.83, angle: -0.045, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -0.852, y: 0.088 },
              },
              {
                id: "key-560",
                time: 887.059,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 78.77, y: 45.883, angle: 5.978, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 28.857, y: 30.281, angle: 24.445, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 49.793, y: 23.441, angle: 33.445, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 23.842, y: 16.463, angle: 10.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 30.906, y: 21.486, angle: 4.445, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 73.974, y: 68.452, angle: 9.445, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 50.246, y: 77.06, angle: 30.445, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 0.975, y: 66, angle: 32.112, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 23.189, y: 47.544, angle: 27.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -4.333, y: 74.247, angle: 31.445, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -17.556, y: 114.179, angle: 52.513, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 23.991, y: 58.28, angle: 3.445, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 13.897, y: 88.857, angle: 33.445, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -28.665, y: 107.502, angle: -6.689, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -3.162, y: 0 },
              },
            ],
          },
{
            enabled: true,
            duration: 700,
            variantId: "lunge3",
            variantLabel: "lunge3",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["spear"],
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
              head: { x: 110.02, y: 83.25, angle: 50.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 89.148, y: 41.129, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 67.526, y: 27.979, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 73.59, y: 30.628, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
              frontUpperArm: { x: 106.301, y: 105.571, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 44.023, y: 95.014, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -21.792, y: 51.072, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 23.653, y: 60.913, angle: -38.265, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: 74.148, y: 77.804, angle: -8.443, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: 119.234, y: 100.421, angle: -11.637, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: 28.069, y: 74.13, angle: 36.916, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -16.165, y: 93.253, angle: 71.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -91.929, y: 80.804, angle: 82.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
            movementStartKeyframeId: "key-263",
            impactKeyframeId: "key-927",
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
                time: 64,
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
                time: 127,
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
                id: "key-263",
                time: 208,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 102.024, y: 73.656, angle: 29.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 27.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 59.198, y: 29.029, angle: -23.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.649, y: 57.715, angle: 37.067, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -4.244, y: 76.735, angle: 39.89, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -28.642, y: 111.353, angle: 63.695, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.069, y: 74.13, angle: 11.911, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 8.591, y: 102.827, angle: 38.867, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -38.505, y: 117.774, angle: 1.678, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "key-408",
                time: 241,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 108.421, y: 83.25, angle: 47.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 59.198, y: 29.029, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.649, y: 57.715, angle: 54.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -19.495, y: 61.276, angle: 84.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -70.03, y: 63.399, angle: 81.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.069, y: 74.13, angle: -41.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 66.111, y: 82.829, angle: -9.794, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 67.052, y: 119.362, angle: 10.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "key-433",
                time: 289,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 111.619, y: 83.25, angle: 29.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 59.198, y: 29.029, angle: -35.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.649, y: 57.715, angle: 45.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -12.29, y: 69.703, angle: 123.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -70.812, y: 20.942, angle: 108.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 12.989, y: 74.13, angle: -11.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 20.183, y: 106.589, angle: 50.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -41.766, y: 115.961, angle: 4.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "pose-b",
                time: 352.8,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 110.02, y: 83.25, angle: 50.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 89.148, y: 41.129, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 67.526, y: 27.979, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 73.59, y: 30.628, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 106.301, y: 105.571, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 44.023, y: 95.014, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -21.792, y: 51.072, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 23.653, y: 60.913, angle: -38.265, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 74.148, y: 77.804, angle: -8.443, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: 119.234, y: 100.421, angle: -11.637, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.069, y: 74.13, angle: 36.916, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -16.165, y: 93.253, angle: 71.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -91.929, y: 80.804, angle: 82.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "key-563",
                time: 387,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 102.024, y: 73.656, angle: 44.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 33.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 81.152, y: 45.926, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 59.53, y: 32.776, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 65.595, y: 35.426, angle: -35.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 107.9, y: 111.968, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 45.622, y: 101.41, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -20.192, y: 57.469, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.649, y: 57.715, angle: 6.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 31.677, y: 94.858, angle: 57.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -7.663, y: 122.568, angle: 60.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.069, y: 74.13, angle: -41.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 66.111, y: 82.829, angle: -36.794, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 99.035, y: 109.767, angle: -13.983, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "key-860",
                time: 535,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 101.825, y: 73.493, angle: 25.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.79, y: 45.426, angle: 31.715, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 56.616, y: 40.553, angle: -2.088, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 74.626, y: 36.706, angle: -25.326, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 112.43, y: 19.646, angle: -29.774, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 93.405, y: 100.534, angle: 43.82, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 33.667, y: 86.825, angle: 63.283, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -28.778, y: 41.852, angle: 65.032, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.587, y: 57.602, angle: 27.943, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 6.491, y: 82.058, angle: 45.087, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -22.36, y: 114.619, angle: 62.577, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.014, y: 73.986, angle: -3.928, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 25.734, y: 96.72, angle: 16.211, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 2.597, y: 115.291, angle: -2.999, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.908, y: 0 },
              },
              {
                id: "key-927",
                time: 630,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 94.101, y: 73.005, angle: 16.911, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 37.068, y: 42.789, angle: 29.449, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 51.927, y: 43.241, angle: -16.48, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 84.893, y: 50.396, angle: -39.5, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 138.042, y: 26.913, angle: -28.611, scaleX: 1.129, scaleY: 1.062, flipX: false, flipY: false },
                  frontUpperArm: { x: 84.396, y: 89.421, angle: 31.195, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 34.664, y: 87.703, angle: 49.662, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -25.505, y: 56.687, angle: 52.309, scaleX: 1.113, scaleY: 1.046, flipX: true, flipY: false },
                  backThigh: { x: 30.185, y: 55.046, angle: 35.353, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -3.909, y: 74.713, angle: 38.091, scaleX: 0.945, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -28.15, y: 109.44, angle: 60.75, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 26.759, y: 70.702, angle: 11.36, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 8.043, y: 99.551, angle: 37.07, scaleX: 0.964, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -37.199, y: 115.564, angle: 1.601, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.779, y: 0 },
              },
            ],
          },
{
            enabled: true,
            duration: 700,
            variantId: "lunge4",
            variantLabel: "lunge4",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["sword"],
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
              head: { x: 110.02, y: 83.25, angle: 50.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 89.148, y: 41.129, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 67.526, y: 27.979, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 73.59, y: 30.628, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
              frontUpperArm: { x: 106.301, y: 105.571, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 44.023, y: 95.014, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -21.792, y: 51.072, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 23.653, y: 60.913, angle: -38.265, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: 74.148, y: 77.804, angle: -8.443, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: 119.234, y: 100.421, angle: -11.637, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: 28.069, y: 74.13, angle: 36.916, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -16.165, y: 93.253, angle: 71.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -91.929, y: 80.804, angle: 82.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
            movementStartKeyframeId: "key-263",
            impactKeyframeId: "key-927",
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
                time: 64,
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
                time: 127,
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
                id: "key-263",
                time: 208,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 102.024, y: 73.656, angle: 29.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 27.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 59.198, y: 29.029, angle: -23.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.649, y: 57.715, angle: 37.067, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -4.244, y: 76.735, angle: 39.89, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -28.642, y: 111.353, angle: 63.695, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.069, y: 74.13, angle: 11.911, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 8.591, y: 102.827, angle: 38.867, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -38.505, y: 117.774, angle: 1.678, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "key-408",
                time: 241,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 108.421, y: 83.25, angle: 47.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 59.198, y: 29.029, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.649, y: 57.715, angle: 54.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -19.495, y: 61.276, angle: 84.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -70.03, y: 63.399, angle: 81.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.069, y: 74.13, angle: -41.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 66.111, y: 82.829, angle: -9.794, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 67.052, y: 119.362, angle: 10.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "key-433",
                time: 289,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 111.619, y: 83.25, angle: 29.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 74.755, y: 39.53, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 53.134, y: 26.38, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 59.198, y: 29.029, angle: -35.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 87.111, y: 99.174, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 24.834, y: 88.617, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -40.981, y: 44.676, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.649, y: 57.715, angle: 45.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -12.29, y: 69.703, angle: 123.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -70.812, y: 20.942, angle: 108.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 12.989, y: 74.13, angle: -11.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 20.183, y: 106.589, angle: 50.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -41.766, y: 115.961, angle: 4.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "pose-b",
                time: 352.8,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 110.02, y: 83.25, angle: 50.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 39.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 89.148, y: 41.129, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 67.526, y: 27.979, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 73.59, y: 30.628, angle: -29.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 106.301, y: 105.571, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 44.023, y: 95.014, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -21.792, y: 51.072, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 23.653, y: 60.913, angle: -38.265, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 74.148, y: 77.804, angle: -8.443, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: 119.234, y: 100.421, angle: -11.637, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.069, y: 74.13, angle: 36.916, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -16.165, y: 93.253, angle: 71.206, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -91.929, y: 80.804, angle: 82.017, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "key-563",
                time: 387,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 102.024, y: 73.656, angle: 44.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.866, y: 45.543, angle: 33.885, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 81.152, y: 45.926, angle: 30.169, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 59.53, y: 32.776, angle: 8.993, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 65.595, y: 35.426, angle: -35.463, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 107.9, y: 111.968, angle: 43.37, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 45.622, y: 101.41, angle: 62.878, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -20.192, y: 57.469, angle: 64.587, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.649, y: 57.715, angle: 6.735, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 31.677, y: 94.858, angle: 57.557, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -7.663, y: 122.568, angle: 60.363, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.069, y: 74.13, angle: -41.084, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 66.111, y: 82.829, angle: -36.794, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 99.035, y: 109.767, angle: -13.983, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.914, y: 0 },
              },
              {
                id: "key-860",
                time: 535,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 101.825, y: 73.493, angle: 25.765, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 38.79, y: 45.426, angle: 31.715, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 56.616, y: 40.553, angle: -2.088, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 74.626, y: 36.706, angle: -25.326, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 112.43, y: 19.646, angle: -29.774, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 93.405, y: 100.534, angle: 43.82, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 33.667, y: 86.825, angle: 63.283, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -28.778, y: 41.852, angle: 65.032, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 31.587, y: 57.602, angle: 27.943, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: 6.491, y: 82.058, angle: 45.087, scaleX: 0.94, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -22.36, y: 114.619, angle: 62.577, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 28.014, y: 73.986, angle: -3.928, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 25.734, y: 96.72, angle: 16.211, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 2.597, y: 115.291, angle: -2.999, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.908, y: 0 },
              },
              {
                id: "key-927",
                time: 630,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 94.101, y: 73.005, angle: 16.911, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 37.068, y: 42.789, angle: 29.449, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 51.927, y: 43.241, angle: -16.48, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 84.893, y: 50.396, angle: -39.5, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 138.042, y: 26.913, angle: -28.611, scaleX: 1.129, scaleY: 1.062, flipX: false, flipY: false },
                  frontUpperArm: { x: 84.396, y: 89.421, angle: 31.195, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 34.664, y: 87.703, angle: 49.662, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -25.505, y: 56.687, angle: 52.309, scaleX: 1.113, scaleY: 1.046, flipX: true, flipY: false },
                  backThigh: { x: 30.185, y: 55.046, angle: 35.353, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -3.909, y: 74.713, angle: 38.091, scaleX: 0.945, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -28.15, y: 109.44, angle: 60.75, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: 26.759, y: 70.702, angle: 11.36, scaleX: 1.002, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 8.043, y: 99.551, angle: 37.07, scaleX: 0.964, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -37.199, y: 115.564, angle: 1.601, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: -2.779, y: 0 },
              },
              {
                id: "key-1000",
                time: 700,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 4.11, y: -3.786, angle: -4, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
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
            ],
          }
        ],
      },
      light: {
        enabled: true,
        duration: 500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "spearattack",
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
          head: { x: 20.443, y: -3.52, angle: 24, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
          torso: { x: 0, y: -14, angle: 9, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
          backUpperArm: { x: -11.984, y: 2.441, angle: -45.78, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
          backForearm: { x: 56.382, y: -8.893, angle: -62.225, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
          backHand: { x: 126.18, y: -50.973, angle: -67.918, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
          frontUpperArm: { x: 32.891, y: -1.319, angle: 15, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
          frontForearm: { x: 2.585, y: 7.226, angle: 12, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
          frontHand: { x: -25.447, y: 1.866, angle: 34, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
          backThigh: { x: 0, y: 0, angle: 21, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
          backShin: { x: -18.961, y: 28.026, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
          backFoot: { x: -38.475, y: 63.413, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
          frontThigh: { x: 0.96, y: 0, angle: 6, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
          frontShin: { x: -8.163, y: 37.981, angle: 21, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
          frontFoot: { x: -43.157, y: 69.541, angle: 3, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
            id: "pose-b",
            time: 250,
            easing: "easeInOut",
            rigParts: {
              head: { x: 20.443, y: -3.52, angle: 24, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 0, y: -14, angle: 9, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: -11.984, y: 2.441, angle: -45.78, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 56.382, y: -8.893, angle: -62.225, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 126.18, y: -50.973, angle: -67.918, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
              frontUpperArm: { x: 32.891, y: -1.319, angle: 15, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 2.585, y: 7.226, angle: 12, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -25.447, y: 1.866, angle: 34, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
              backThigh: { x: 0, y: 0, angle: 21, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: -18.961, y: 28.026, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -38.475, y: 63.413, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: 0.96, y: 0, angle: 6, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -8.163, y: 37.981, angle: 21, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -43.157, y: 69.541, angle: 3, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
        variants: [
{
            enabled: true,
            duration: 500,
            variantId: "spearattack",
            variantLabel: "spearattack",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["spear"],
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
              head: { x: 20.241, y: -3.58, angle: 23.764, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 0, y: -14, angle: 8.912, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: -13.281, y: -8.476, angle: -24.555, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 32.332, y: -4.382, angle: -55.681, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 99.678, y: -39.729, angle: -7.842, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
              frontUpperArm: { x: 32.784, y: -1.414, angle: -5.922, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 31.873, y: 7.405, angle: 53.459, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -31.788, y: -23.253, angle: 66.547, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
              backThigh: { x: 0, y: 0, angle: 20.794, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: -18.746, y: 28.075, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -38.274, y: 63.478, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: 0.948, y: 0, angle: 5.941, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -8.115, y: 37.922, angle: 20.794, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -42.834, y: 69.546, angle: 2.971, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
                id: "pose-b",
                time: 250,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 20.241, y: -3.58, angle: 23.764, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 0, y: -14, angle: 8.912, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -13.281, y: -8.476, angle: -24.555, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 32.332, y: -4.382, angle: -55.681, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 99.678, y: -39.729, angle: -7.842, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: 32.784, y: -1.414, angle: -5.922, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 31.873, y: 7.405, angle: 53.459, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -31.788, y: -23.253, angle: 66.547, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 20.794, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -18.746, y: 28.075, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -38.274, y: 63.478, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: 0.948, y: 0, angle: 5.941, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -8.115, y: 37.922, angle: 20.794, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -42.834, y: 69.546, angle: 2.971, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      medium: {
        enabled: true,
        duration: 500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "medium4",
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
          },
{
            enabled: true,
            duration: 500,
            variantId: "medium4",
            variantLabel: "medium4",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["sword"],
            base: {
              head: { x: -0.13, y: -9.571, angle: 0, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 0, y: -14, angle: 0, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: -22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: -12, y: -1, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 4.11, y: -3.786, angle: -25, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
              frontUpperArm: { x: 22, y: -11, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 11.25, y: -1, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -2.89, y: -2, angle: 19, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 0, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: 3, y: 33, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -18.01, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: -0.25, y: 0, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -3.25, y: 32, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -10.25, y: 70, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            breath: {
              head: { x: 5.059, y: 41.154, angle: 12, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: -1.896, y: 33.493, angle: 2.873, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: -26.613, y: 57.212, angle: -63.203, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 55.949, y: 30.67, angle: -70.822, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 130.55, y: -18.984, angle: -28.381, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
              frontUpperArm: { x: 11.597, y: 47.407, angle: -71.822, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 66.682, y: 1.463, angle: 42.051, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 7.693, y: -19.096, angle: 52, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 4.74, y: 34.588, angle: 37.347, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: -24.493, y: 44.218, angle: -4.746, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -36.971, y: 76.543, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: -5.938, y: 29.914, angle: -31.601, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 22.347, y: 46.022, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: 15.347, y: 76.543, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
            },
            faceBase: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            faceBreath: {
              eyeLeft: { x: 1.203, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 14.034, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
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
                  frontHand: { x: -2.89, y: -2, angle: 19, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
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
                id: "key-360",
                time: 153,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -1.632, y: 29.665, angle: -9, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -1.502, y: 23.61, angle: 2.275, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -26.587, y: 42.084, angle: -35.051, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 23.136, y: 39.009, angle: -43.876, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 79.029, y: 17.771, angle: -27.678, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: 18.43, y: 23.123, angle: -2.876, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 12.199, y: 24.277, angle: 32.677, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -34.658, y: 8.722, angle: 42.133, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 3.754, y: 27.391, angle: 29.576, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -18.772, y: 41.883, angle: -3.55, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -33.025, y: 75.182, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -4.755, y: 23.689, angle: -25.026, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 17.021, y: 43.105, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 10.021, y: 75.182, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -0.192, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 11.842, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "pose-b",
                time: 257,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 5.059, y: 41.154, angle: 12, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -1.896, y: 33.493, angle: 2.873, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -26.613, y: 57.212, angle: -63.203, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 55.949, y: 30.67, angle: -70.822, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 130.55, y: -18.984, angle: -28.381, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: 11.597, y: 47.407, angle: -71.822, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 66.682, y: 1.463, angle: 42.051, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 7.693, y: -19.096, angle: 52, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 4.74, y: 34.588, angle: 37.347, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -24.493, y: 44.218, angle: -4.746, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -36.971, y: 76.543, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -5.938, y: 29.914, angle: -31.601, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 22.347, y: 46.022, angle: 0, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 15.347, y: 76.543, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: 1.203, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 14.034, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
            ],
          },
{
            enabled: true,
            duration: 500,
            variantId: "spearattack",
            variantLabel: "spearattack",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["spear"],
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
              head: { x: 20.377, y: -3.54, angle: 23.923, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 0, y: -14, angle: 8.971, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: -13.222, y: -8.459, angle: -24.72, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 32.629, y: -4.404, angle: -56.061, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 100.318, y: -39.97, angle: -28.868, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
              frontUpperArm: { x: 32.857, y: -1.35, angle: -5.962, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 32.011, y: 7.462, angle: 53.837, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -31.988, y: -23.392, angle: 66.866, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
              backThigh: { x: 0, y: 0, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: -18.891, y: 28.042, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -38.41, y: 63.434, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: 0.956, y: 0, angle: 5.981, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -8.147, y: 37.962, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -43.052, y: 69.543, angle: 2.99, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
                id: "pose-b",
                time: 250,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 20.377, y: -3.54, angle: 23.923, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 0, y: -14, angle: 8.971, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -13.222, y: -8.459, angle: -24.72, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 32.629, y: -4.404, angle: -56.061, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 100.318, y: -39.97, angle: -28.868, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: 32.857, y: -1.35, angle: -5.962, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 32.011, y: 7.462, angle: 53.837, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -31.988, y: -23.392, angle: 66.866, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -18.891, y: 28.042, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -38.41, y: 63.434, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: 0.956, y: 0, angle: 5.981, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -8.147, y: 37.962, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -43.052, y: 69.543, angle: 2.99, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
        selectedVariantId: "heavy4",
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
              head: { x: 71.602, y: 24.928, angle: 18.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 4.655, y: -3.119, angle: 33.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: 31.507, y: 7.673, angle: 213.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              backForearm: { x: 84.603, y: -116.295, angle: 235.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backHand: { x: 147.177, y: -207.804, angle: 247.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
              frontUpperArm: { x: 57.918, y: 54.656, angle: -5.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 54.48, y: 60.344, angle: 12.529, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: 23.442, y: 58.503, angle: 13.529, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 0, y: -1.433, angle: 53.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: -56.601, y: 2.926, angle: 43, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -119.067, y: 24.533, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: -19.486, y: 4.149, angle: -20.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 0.874, y: 27.29, angle: 24.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -35.565, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-197",
                time: 135,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -50.906, y: -3.67, angle: -27, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -12.649, y: -13.887, angle: -21, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -50.34, y: 25.584, angle: 30, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -77.17, y: 23.036, angle: 31, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: -91.915, y: 19.186, angle: 10, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -22.872, y: -27.522, angle: -36, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 9.65, y: -34.344, angle: -39, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 31.744, y: -41.827, angle: -17, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 18, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -15.713, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -37.982, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -4.973, y: 1.18, angle: -57, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 47.006, y: -2.391, angle: -3, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 44.279, y: 37.789, angle: 15, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-256",
                time: 277,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -81.605, y: 18.751, angle: -41.998, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -22.095, y: -5.626, angle: -32.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -65.689, y: 48.004, angle: 32.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -85.761, y: 49.486, angle: 24.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -112.707, y: 44.261, angle: 39.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -63.017, y: -10.999, angle: -107.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -10.363, y: -103.215, angle: -89.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 46.988, y: -151.282, angle: -88.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -4.973, y: 1.18, angle: -56.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 47.003, y: -2.39, angle: -20.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 63.169, y: 35.431, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-273",
                time: 415,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -73.561, y: 17.411, angle: -33.483, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -22.095, y: -5.626, angle: -29.592, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -62.338, y: 50.683, angle: 60.247, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -102.071, y: 23.387, angle: 67.574, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -160.531, y: -19.03, angle: 110.386, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -50.112, y: -2.401, angle: -104.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 5.08, y: -86.671, angle: -86.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 61.72, y: -131.438, angle: -85.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: -9.066, y: 11.649, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -24.778, y: 35.931, angle: -11, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -34.236, y: 65.165, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -4.973, y: 1.18, angle: -65.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 57.364, y: -7.567, angle: -14.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 65.76, y: 28.959, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-357",
                time: 432,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -67.435, y: 16.39, angle: -26.998, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -22.095, y: -5.626, angle: -26.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -59.785, y: 52.724, angle: 80.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -114.493, y: 3.511, angle: 99.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -170.546, y: -71.53, angle: 111.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -50.112, y: 0.465, angle: -107.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 2.542, y: -91.751, angle: -89.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 59.893, y: -139.818, angle: -88.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -18.91, y: 29.46, angle: 10, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -49.967, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -4.973, y: 1.18, angle: -56.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 47.003, y: -2.39, angle: -20.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 63.169, y: 35.431, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-342",
                time: 450,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -32.684, y: 5.264, angle: 3.002, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -12.648, y: -9.167, angle: -11.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -40.892, y: 32.662, angle: 98.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -97.066, y: -38.865, angle: 117.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -144.639, y: -133.061, angle: 153.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -28.857, y: 0.465, angle: -77.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 28.341, y: -54.278, angle: -59.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 71.238, y: -72.268, angle: -58.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -7.335, y: 4.72, angle: -50.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 40.725, y: 7.022, angle: -14.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 49.362, y: 46.876, angle: 6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-408",
                time: 467,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -16.152, y: 2.903, angle: 18.002, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -12.648, y: -9.167, angle: -2.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -20.817, y: 23.221, angle: 143.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -48.592, y: -99.04, angle: 165.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -51.842, y: -220.776, angle: 189.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -9.964, y: 2.825, angle: -47.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 32.433, y: -17.193, angle: -29.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 47.774, y: -16.362, angle: -28.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -15.601, y: 10.621, angle: -44.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 26.776, y: 18.229, angle: -8.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 27.711, y: 59.319, angle: 12, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-478",
                time: 482,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 41.814, y: 13.279, angle: 39.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 4.655, y: -5.708, angle: 18.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 22.441, y: 15.439, angle: 165.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 19.111, y: -117.329, angle: 187.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 39.55, y: -240.455, angle: 199.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 41.081, y: 31.358, angle: -26.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 62.208, y: 28.208, angle: -8.471, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 53.675, y: 31.476, angle: -7.471, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: -1.433, angle: 44.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -50.125, y: 9.398, angle: 28, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -95.754, y: 47.831, angle: -24, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -15.601, y: 10.621, angle: -44.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 26.776, y: 18.229, angle: 0.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 16.24, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "pose-b",
                time: 499,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 71.602, y: 24.928, angle: 18.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 4.655, y: -3.119, angle: 33.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 31.507, y: 7.673, angle: 213.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 84.603, y: -116.295, angle: 235.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 147.177, y: -207.804, angle: 247.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 57.918, y: 54.656, angle: -5.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 54.48, y: 60.344, angle: 12.529, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 23.442, y: 58.503, angle: 13.529, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: -1.433, angle: 53.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -56.601, y: 2.926, angle: 43, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -119.067, y: 24.533, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -19.486, y: 4.149, angle: -20.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 0.874, y: 27.29, angle: 24.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -35.565, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-536",
                time: 519,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 108.387, y: 59.141, angle: 72.431, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 15.722, y: 5.774, angle: 54.496, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 69.882, y: 10.789, angle: 303.209, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 152.685, y: -17.597, angle: 304.286, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 213.123, y: -35.59, angle: 343.187, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 85.431, y: 69.993, angle: 45.343, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 21.171, y: 58.239, angle: 75.3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -48.065, y: -0.144, angle: 85.267, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: -1.433, angle: 33.076, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -31.576, y: 16.513, angle: 19.087, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -70.123, y: 44.89, angle: -0.011, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -15.615, y: 10.597, angle: -44.91, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 26.682, y: 18.263, angle: 0.088, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 16.051, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-618",
                time: 696,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 71.602, y: 24.928, angle: 18.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 4.655, y: -3.119, angle: 33.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 31.507, y: 7.673, angle: 213.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 84.603, y: -116.295, angle: 235.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 147.177, y: -207.804, angle: 247.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 57.918, y: 54.656, angle: -5.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 54.48, y: 60.344, angle: 12.529, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 23.442, y: 58.503, angle: 13.529, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: -1.433, angle: 53.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -56.601, y: 2.926, angle: 43, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -119.067, y: 24.533, angle: -3, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -19.486, y: 4.149, angle: -20.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 0.874, y: 27.29, angle: 24.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -35.565, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-659",
                time: 719,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 41.814, y: 13.279, angle: 39.529, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 4.655, y: -5.708, angle: 18.529, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 22.441, y: 15.439, angle: 165.526, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: 19.111, y: -117.329, angle: 187.526, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: 39.55, y: -240.455, angle: 199.526, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: 41.081, y: 31.358, angle: -26.471, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 62.208, y: 28.208, angle: -8.471, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 53.675, y: 31.476, angle: -7.471, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: -1.433, angle: 44.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -50.125, y: 9.398, angle: 28, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -95.754, y: 47.831, angle: -24, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -15.601, y: 10.621, angle: -44.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 26.776, y: 18.229, angle: 0.001, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 16.24, y: 57.886, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-707",
                time: 741,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -16.152, y: 2.903, angle: 18.002, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -12.648, y: -9.167, angle: -2.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -20.817, y: 23.221, angle: 143.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -48.592, y: -99.04, angle: 165.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -51.842, y: -220.776, angle: 189.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -9.964, y: 2.825, angle: -47.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 32.433, y: -17.193, angle: -29.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 47.774, y: -16.362, angle: -28.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -15.601, y: 10.621, angle: -44.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 26.776, y: 18.229, angle: -8.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 27.711, y: 59.319, angle: 12, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-802",
                time: 763,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -32.684, y: 5.264, angle: 3.002, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -12.648, y: -9.167, angle: -11.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -40.892, y: 32.662, angle: 98.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -97.066, y: -38.865, angle: 117.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -144.639, y: -133.061, angle: 153.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -28.857, y: 0.465, angle: -77.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 28.341, y: -54.278, angle: -59.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 71.238, y: -72.268, angle: -58.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -7.335, y: 4.72, angle: -50.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 40.725, y: 7.022, angle: -14.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 49.362, y: 46.876, angle: 6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-856",
                time: 787,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -67.435, y: 16.39, angle: -26.998, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -22.095, y: -5.626, angle: -26.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -59.785, y: 52.724, angle: 80.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -114.493, y: 3.511, angle: 99.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -170.546, y: -71.53, angle: 111.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -50.112, y: 0.465, angle: -107.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 2.542, y: -91.751, angle: -89.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 59.893, y: -139.818, angle: -88.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -18.91, y: 29.46, angle: 10, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -49.967, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -4.973, y: 1.18, angle: -56.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 47.003, y: -2.39, angle: -20.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 63.169, y: 35.431, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-912",
                time: 809,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -73.561, y: 17.411, angle: -33.483, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -22.095, y: -5.626, angle: -29.592, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -62.338, y: 50.683, angle: 60.247, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -102.071, y: 23.387, angle: 67.574, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -160.531, y: -19.03, angle: 110.386, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -50.112, y: -2.401, angle: -104.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 5.08, y: -86.671, angle: -86.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 61.72, y: -131.438, angle: -85.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: -9.066, y: 11.649, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -24.778, y: 35.931, angle: -11, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -34.236, y: 65.165, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -4.973, y: 1.18, angle: -65.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 57.364, y: -7.567, angle: -14.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 65.76, y: 28.959, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-958",
                time: 828,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -81.605, y: 18.751, angle: -41.998, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -22.095, y: -5.626, angle: -32.998, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -65.689, y: 48.004, angle: 32.999, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  backForearm: { x: -85.761, y: 49.486, angle: 24.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backHand: { x: -112.707, y: 44.261, angle: 39.999, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -63.017, y: -10.999, angle: -107.998, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -10.363, y: -103.215, angle: -89.998, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: 46.988, y: -151.282, angle: -88.998, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 17.999, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -15.712, y: 29.46, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -35.531, y: 66.46, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -4.973, y: 1.18, angle: -56.997, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 47.003, y: -2.39, angle: -20.999, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: 63.169, y: 35.431, angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
            ],
          },
{
            enabled: true,
            duration: 1200,
            variantId: "heavy4",
            variantLabel: "heavy4",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["sword"],
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
              head: { x: -73.334, y: -212.745, angle: -35.831, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: -40.475, y: -228.827, angle: -18.561, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: -88.031, y: -184.22, angle: -66.951, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: -7.531, y: -215.345, angle: -65.951, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 65.314, y: -256.087, angle: -30.59, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
              frontUpperArm: { x: -59.25, y: -238.241, angle: -47.702, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: -24.718, y: -262.843, angle: 15.657, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -55.657, y: -265.206, angle: 8.241, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
              backThigh: { x: -26.05, y: -196.57, angle: 12.298, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              backShin: { x: -32.405, y: -165.023, angle: 54.283, scaleX: 1.05, scaleY: 0.96, flipX: false, flipY: false },
              backFoot: { x: -85.578, y: -128.057, angle: 94.815, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              frontThigh: { x: -35.405, y: -210.213, angle: -33.907, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -0.439, y: -189.528, angle: 24.376, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -32.658, y: -157.803, angle: 60.681, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
            impactKeyframeId: "pose-b",
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
                id: "key-362",
                time: 354,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -4.432, y: 87.874, angle: 21, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -79.616, y: 43.374, angle: 45, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -17.078, y: 38.536, angle: 75, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -75.817, y: -11.883, angle: 76, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: -135.37, y: -44.443, angle: 113, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: -25.595, y: 117.911, angle: -3, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -33.119, y: 128.541, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -49.599, y: 131.38, angle: 4, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -97.659, y: 44.462, angle: 30, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -119.617, y: 59.027, angle: -41, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -102.84, y: 77.687, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: -96.824, y: 49.884, angle: -42, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -56.545, y: 52.57, angle: 24, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -93.151, y: 79.974, angle: 6, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-352",
                time: 484.5,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 14.732, y: 119.876, angle: 83.547, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -78.88, y: 50.969, angle: 58.705, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 13.931, y: 49.504, angle: 73.381, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -43.324, y: 0.39, angle: 74.381, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: -101.243, y: -31.528, angle: 110.021, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: -14.198, y: 159.25, angle: 26.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -59.28, y: 165.341, angle: 29.806, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -105.974, y: 151.238, angle: 37.324, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -76.892, y: 45.465, angle: 26.417, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -97.329, y: 69.261, angle: 65.575, scaleX: 1.05, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -152.075, y: 88.317, angle: 82.187, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: -94.739, y: 48.807, angle: -41.093, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -58.406, y: 60.151, angle: 23.482, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -94.373, y: 93.802, angle: 41.87, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "pose-b",
                time: 600,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -73.334, y: -212.745, angle: -35.831, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -40.475, y: -228.827, angle: -18.561, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -88.031, y: -184.22, angle: -66.951, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -7.531, y: -215.345, angle: -65.951, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 65.314, y: -256.087, angle: -30.59, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: -59.25, y: -238.241, angle: -47.702, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -24.718, y: -262.843, angle: 15.657, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -55.657, y: -265.206, angle: 8.241, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -26.05, y: -196.57, angle: 12.298, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -32.405, y: -165.023, angle: 54.283, scaleX: 1.05, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -85.578, y: -128.057, angle: 94.815, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: -35.405, y: -210.213, angle: -33.907, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -0.439, y: -189.528, angle: 24.376, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -32.658, y: -157.803, angle: 60.681, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "key-712",
                time: 909,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 14.732, y: 119.876, angle: 83.547, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: -78.88, y: 50.969, angle: 58.705, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: 13.931, y: 49.504, angle: 73.381, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -43.324, y: 0.39, angle: 74.381, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: -101.243, y: -31.528, angle: 110.021, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: -14.198, y: 159.25, angle: 26.417, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: -59.28, y: 165.341, angle: 29.806, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -105.974, y: 151.238, angle: 37.324, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: -76.892, y: 45.465, angle: 26.417, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  backShin: { x: -97.329, y: 69.261, angle: 65.575, scaleX: 1.05, scaleY: 0.96, flipX: false, flipY: false },
                  backFoot: { x: -152.075, y: 88.317, angle: 82.187, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  frontThigh: { x: -94.739, y: 48.807, angle: -41.093, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -58.406, y: 60.151, angle: 23.482, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -94.373, y: 93.802, angle: 41.87, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                },
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
            ],
          },
{
            enabled: true,
            duration: 500,
            variantId: "spearattack",
            variantLabel: "spearattack",
            variantWeight: 1,
            appliesToAllWeapons: false,
            weaponClasses: ["spear"],
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
              head: { x: 20.377, y: -3.54, angle: 23.923, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 0, y: -14, angle: 8.971, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: -13.222, y: -8.459, angle: -24.72, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: 32.629, y: -4.404, angle: -56.061, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: 100.318, y: -39.97, angle: -28.868, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
              frontUpperArm: { x: 32.857, y: -1.35, angle: -5.962, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 32.011, y: 7.462, angle: 53.837, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -31.988, y: -23.392, angle: 66.866, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
              backThigh: { x: 0, y: 0, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: -18.891, y: 28.042, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -38.41, y: 63.434, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: 0.956, y: 0, angle: 5.981, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: -8.147, y: 37.962, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -43.052, y: 69.543, angle: 2.99, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
                id: "key-492",
                time: 246,
                easing: "easeInOut",
                rigParts: {
                  head: { x: 20.361, y: -3.544, angle: 23.904, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 0, y: -14, angle: 8.964, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -13.229, y: -8.461, angle: -24.7, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 32.594, y: -4.402, angle: -56.015, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 97.88, y: -39.941, angle: -52.864, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: 32.848, y: -1.357, angle: -5.957, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 31.994, y: 7.455, angle: 53.792, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -31.964, y: -23.375, angle: 66.828, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 20.916, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -18.874, y: 28.046, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -38.394, y: 63.439, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: 0.955, y: 0, angle: 5.976, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -8.143, y: 37.957, angle: 20.916, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -43.026, y: 69.543, angle: 2.988, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
                  head: { x: 20.377, y: -3.54, angle: 23.923, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 0, y: -14, angle: 8.971, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -13.222, y: -8.459, angle: -24.72, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: 32.629, y: -4.404, angle: -56.061, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: 100.318, y: -39.97, angle: -28.868, scaleX: 1.1, scaleY: 0.9, flipX: false, flipY: false },
                  frontUpperArm: { x: 32.857, y: -1.35, angle: -5.962, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 32.011, y: 7.462, angle: 53.837, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -31.988, y: -23.392, angle: 66.866, scaleX: 1.17, scaleY: 0.97, flipX: true, flipY: false },
                  backThigh: { x: 0, y: 0, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: -18.891, y: 28.042, angle: 1, scaleX: 1.05, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -38.41, y: 63.434, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: 0.956, y: 0, angle: 5.981, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: -8.147, y: 37.962, angle: 20.933, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -43.052, y: 69.543, angle: 2.99, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            faceParts: {
              eyeLeft: { x: 0, y: -1, scaleX: 1.73, scaleY: 0.36 },
              eyeRight: { x: 12.5, y: -2, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      hit: {
        enabled: true,
        duration: 400,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "hit2",
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
              eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "pose-b",
            time: 200,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.37, scaleY: 0.87 },
              eyeRight: { x: 3.5, y: -2, scaleX: 1.66, scaleY: 0.19 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
        variants: [
{
            enabled: true,
            duration: 400,
            variantId: "hit2",
            variantLabel: "hit2",
            variantWeight: 1,
            appliesToAllWeapons: true,
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
              head: { x: -31.992, y: 0.131, angle: -36.08, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
              torso: { x: 0, y: -14, angle: -16.248, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
              backUpperArm: { x: -37.988, y: 15.631, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
              backForearm: { x: -27.988, y: 25.631, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
              backHand: { x: -9.747, y: 31.023, angle: 13, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
              frontUpperArm: { x: -0.384, y: -23.783, angle: -18.956, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
              frontForearm: { x: 12.873, y: -19.654, angle: 8.044, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontHand: { x: -10.034, y: -20.378, angle: 23.168, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
              backThigh: { x: 13.857, y: 5.326, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
              backShin: { x: 15.857, y: 38.326, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
              backFoot: { x: -5.143, y: 75.326, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
              frontThigh: { x: 9.343, y: -1.065, angle: -2.708, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
              frontShin: { x: 9.748, y: 32.332, angle: 2.708, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
              frontFoot: { x: -3.636, y: 70.879, angle: -16.248, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
                faceParts: {
                  eyeLeft: { x: -5.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                  eyeRight: { x: 3.5, y: -1.5, scaleX: 1.3, scaleY: 0.97 },
                },
                rootOffset: { x: 0, y: 0 },
              },
              {
                id: "pose-b",
                time: 200,
                easing: "easeInOut",
                rigParts: {
                  head: { x: -31.992, y: 0.131, angle: -36.08, scaleX: 0.98, scaleY: 0.83, flipX: false, flipY: false },
                  torso: { x: 0, y: -14, angle: -16.248, scaleX: 0.93, scaleY: 0.89, flipX: false, flipY: false },
                  backUpperArm: { x: -37.988, y: 15.631, angle: 0, scaleX: 0.8, scaleY: 0.9, flipX: false, flipY: false },
                  backForearm: { x: -27.988, y: 25.631, angle: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
                  backHand: { x: -9.747, y: 31.023, angle: 13, scaleX: 1.13, scaleY: 1.07, flipX: false, flipY: false },
                  frontUpperArm: { x: -0.384, y: -23.783, angle: -18.956, scaleX: 0.8, scaleY: 0.9, flipX: true, flipY: false },
                  frontForearm: { x: 12.873, y: -19.654, angle: 8.044, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontHand: { x: -10.034, y: -20.378, angle: 23.168, scaleX: 1.11, scaleY: 1.05, flipX: true, flipY: false },
                  backThigh: { x: 13.857, y: 5.326, angle: 0, scaleX: 1.05, scaleY: 1, flipX: true, flipY: false },
                  backShin: { x: 15.857, y: 38.326, angle: 1, scaleX: 0.94, scaleY: 0.96, flipX: true, flipY: false },
                  backFoot: { x: -5.143, y: 75.326, angle: 0, scaleX: 1, scaleY: 1, flipX: true, flipY: false },
                  frontThigh: { x: 9.343, y: -1.065, angle: -2.708, scaleX: 1.05, scaleY: 1, flipX: false, flipY: false },
                  frontShin: { x: 9.748, y: 32.332, angle: 2.708, scaleX: 0.96, scaleY: 1, flipX: false, flipY: false },
                  frontFoot: { x: -3.636, y: 70.879, angle: -16.248, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
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
      block: {
        enabled: true,
        duration: 500,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            faceParts: {
              eyeLeft: { x: -1, y: -1.5, scaleX: 1.3, scaleY: 0.7 },
              eyeRight: { x: 12, y: -1.5, scaleX: 1.3, scaleY: 0.7 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      taunt: {
        enabled: true,
        duration: 600,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
              eyeLeft: { x: -3, y: 0, scaleX: 1.26, scaleY: 1 },
              eyeRight: { x: 2, y: 0, scaleX: 1.34, scaleY: 1 },
            },
            rootOffset: { x: 0, y: 0 },
          },
          {
            id: "pose-b",
            time: 300,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: 1, y: 0.5, scaleX: 1.26, scaleY: 1 },
              eyeRight: { x: -3.5, y: 0, scaleX: 1.34, scaleY: 1 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
      rest: {
        enabled: true,
        duration: 1000,
        variantId: "default",
        variantLabel: "default",
        variantWeight: 1,
        appliesToAllWeapons: true,
        selectedVariantId: "default",
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
            time: 500,
            easing: "easeInOut",
            rigParts: {
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
            faceParts: {
              eyeLeft: { x: -5.5, y: -2, scaleX: 1.81, scaleY: 0.31 },
              eyeRight: { x: 4, y: -2.5, scaleX: 2.12, scaleY: 0.26 },
            },
            rootOffset: { x: 0, y: 0 },
          },
        ],
      },
    },
  },
};

function applySpearAttackBodyAnimationDefaults(): void {
  syncSpearAttackBodyAnimationVariants(DEFAULT_BODY_ANIMATIONS);
  Object.values(DEFAULT_BODY_PRESET_TUNING).forEach((presetTuning) => {
    syncSpearAttackBodyAnimationVariants(presetTuning.bodyAnimations);
  });
}

function syncSpearAttackBodyAnimationVariants(
  bodyAnimations: Record<BodyAnimationKey, BodyAnimationTuning>,
  options: SpearAttackBodyAnimationSyncOptions = {},
): void {
  const sourceVariant = bodyAnimations.light.variants?.find(
    (variant) => variant.variantId === SPEAR_ATTACK_BODY_ANIMATION_VARIANT_ID,
  );

  if (!sourceVariant) {
    return;
  }

  SPEAR_ATTACK_BODY_ANIMATION_KEYS.forEach((key) => {
    const animation = bodyAnimations[key];
    const existingSpearAttackVariant = animation.variants?.find((variant) => variant.variantId === SPEAR_ATTACK_BODY_ANIMATION_VARIANT_ID);
    const spearAttackVariant =
      existingSpearAttackVariant && !options.overwriteExisting
        ? cloneExistingSpearAttackBodyAnimationVariant(existingSpearAttackVariant)
        : cloneSpearAttackBodyAnimationVariant(sourceVariant);
    const variants = (animation.variants ?? []).filter((variant) => !isSpearSpecificAttackBodyAnimationVariant(variant));

    variants.push(spearAttackVariant);
    animation.variants = variants;
    animation.selectedVariantId = normalizeBodyAnimationSelectedVariantId(animation.selectedVariantId, variants);
  });
}

function isSpearSpecificAttackBodyAnimationVariant(variant: BodyAnimationTuning): boolean {
  if (variant.variantId === SPEAR_ATTACK_BODY_ANIMATION_VARIANT_ID) {
    return true;
  }

  return (variant.appliesToAllWeapons ?? true) === false && (variant.weaponClasses ?? []).includes("spear");
}

function cloneSpearAttackBodyAnimationVariant(source: BodyAnimationTuning): BodyAnimationTuning {
  return {
    ...cloneBodyAnimationVariant(source),
    variantId: SPEAR_ATTACK_BODY_ANIMATION_VARIANT_ID,
    variantLabel: SPEAR_ATTACK_BODY_ANIMATION_VARIANT_ID,
    appliesToAllWeapons: false,
    weaponClasses: ["spear"],
    selectedVariantId: undefined,
    variants: [],
  };
}

function cloneExistingSpearAttackBodyAnimationVariant(source: BodyAnimationTuning): BodyAnimationTuning {
  return {
    ...cloneBodyAnimationVariant(source),
    variantId: SPEAR_ATTACK_BODY_ANIMATION_VARIANT_ID,
    appliesToAllWeapons: false,
    weaponClasses: ["spear"],
    selectedVariantId: undefined,
    variants: [],
  };
}

applySpearAttackBodyAnimationDefaults();

export const DEBUG_TUNING_STORAGE_VERSION = 3;

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

const DEFAULT_DYNAMIC_ARENA_BACKGROUND_LAYERS: Record<ArenaBackgroundLayerRole, ArenaBackgroundLayerTuning> = {
  back: {
    layout: { x: 0, y: 0, scale: 1, alpha: 1, visible: true },
    parallax: { followX: 0.2, followY: -0.12, zoom: 0.39, lookUpY: 240 },
  },
  mid: {
    layout: { x: 0, y: 0, scale: 1, alpha: 1, visible: true },
    parallax: { followX: -0.5, followY: 0.68, zoom: 0.2, lookUpY: 132, zoomDarken: 1 },
  },
  ground: {
    layout: { x: 0, y: 0, scale: 1, alpha: 1, visible: true },
    parallax: { followX: 0.37, followY: 0.47, zoom: 0.74, lookUpY: 13 },
  },
  front: {
    layout: { x: 0, y: 0, scale: 1, alpha: 1, visible: true },
    parallax: { followX: 0.35, followY: 0.47, zoom: 0.34, lookUpY: 33 },
  },
  ambient: {
    layout: { x: 0, y: 0, scale: 1, alpha: 1, visible: true },
    parallax: { followX: 0.37, followY: 0.48, zoom: 0.5, lookUpY: -16, farAlpha: 1, nearAlpha: 1 },
  },
};

export function createDefaultArenaBackgroundLayerTuning(layer: ArenaBackgroundEditLayer): ArenaBackgroundLayerTuning {
  const fallback = DEFAULT_DYNAMIC_ARENA_BACKGROUND_LAYERS[getArenaBackgroundLayerRole(layer)];

  return {
    layout: { ...fallback.layout },
    parallax: { ...fallback.parallax },
  };
}

export function getDynamicArenaBackgroundLayerTuning(
  tuning: ArenaDebugTuning,
  tierId: number,
  layer: ArenaBackgroundEditLayer,
  variantId = "default",
): ArenaBackgroundLayerTuning {
  const stored = getStoredArenaBackgroundLayerTuning(tuning.arenaBackgroundTiers[String(Math.max(1, Math.round(tierId)))], layer, variantId);
  const fallback = createDefaultArenaBackgroundLayerTuning(layer);
  const role = getArenaBackgroundLayerRole(layer);

  return {
    layout: {
      x: clampNumber(stored?.layout?.x, -640, 640, fallback.layout.x),
      y: clampNumber(stored?.layout?.y, -900, 900, fallback.layout.y),
      scale: clampNumber(stored?.layout?.scale, 0.25, 2.5, fallback.layout.scale),
      alpha: clampNumber(stored?.layout?.alpha, 0, 1, fallback.layout.alpha),
      visible: typeof stored?.layout?.visible === "boolean" ? stored.layout.visible : fallback.layout.visible,
    },
    parallax: {
      followX: clampNumber(stored?.parallax?.followX, -0.5, 1.5, fallback.parallax.followX),
      followY: clampNumber(stored?.parallax?.followY, -0.5, 1.5, fallback.parallax.followY),
      zoom: clampNumber(stored?.parallax?.zoom, 0, 1.5, fallback.parallax.zoom),
      lookUpY: clampNumber(stored?.parallax?.lookUpY, -240, 240, fallback.parallax.lookUpY),
      ...(role === "mid" ? { zoomDarken: clampNumber(stored?.parallax?.zoomDarken, 0, 1, fallback.parallax.zoomDarken ?? 1) } : {}),
      ...(role === "ambient"
        ? {
            farAlpha: clampNumber(stored?.parallax?.farAlpha, 0, 1, fallback.parallax.farAlpha ?? 1),
            nearAlpha: clampNumber(stored?.parallax?.nearAlpha, 0, 1, fallback.parallax.nearAlpha ?? 1),
          }
        : {}),
    },
  };
}

function getStoredArenaBackgroundLayerTuning(
  tierTuning: ArenaBackgroundTierTuning | undefined,
  layer: ArenaBackgroundEditLayer,
  variantId: string,
): ArenaBackgroundLayerTuning | undefined {
  if (!tierTuning) {
    return undefined;
  }

  const normalizedVariantId = normalizeArenaBackgroundVariantId(variantId);
  const variantLayer = normalizedVariantId === "default" ? undefined : tierTuning.variants?.[normalizedVariantId]?.[layer];
  const defaultLayer = tierTuning.layers?.[layer] ?? tierTuning.variants?.default?.[layer];
  const legacyLayer = isArenaBackgroundLayerTuning(tierTuning[layer]) ? tierTuning[layer] : undefined;

  return variantLayer ?? defaultLayer ?? legacyLayer;
}

function normalizeArenaBackgroundTierTunings(input: unknown): ArenaBackgroundTierTuningMap {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const normalized: ArenaBackgroundTierTuningMap = {};

  Object.entries(input as Record<string, unknown>).forEach(([tierKey, tierInput]) => {
    const tierId = Math.round(Number(tierKey));

    if (!Number.isInteger(tierId) || tierId < 1 || !tierInput || typeof tierInput !== "object" || Array.isArray(tierInput)) {
      return;
    }

    const tierTuning: ArenaBackgroundTierTuning = {};
    const layers = normalizeArenaBackgroundLayerTuningMap((tierInput as ArenaBackgroundTierTuning).layers);
    const variants = normalizeArenaBackgroundVariantTunings((tierInput as ArenaBackgroundTierTuning).variants);

    Object.entries(tierInput as Record<string, unknown>).forEach(([layer, layerInput]) => {
      if (layer === "layers" || layer === "variants" || !isArenaBackgroundEditLayer(layer)) {
        return;
      }

      layers[layer] = normalizeArenaBackgroundLayerTuning(layerInput, layer);
    });

    if (Object.keys(layers).length > 0) {
      tierTuning.layers = layers;
    }

    if (Object.keys(variants).length > 0) {
      tierTuning.variants = variants;
    }

    if (tierTuning.layers || tierTuning.variants) {
      normalized[tierId] = tierTuning;
    }
  });

  return normalized;
}

function normalizeArenaBackgroundLayerTuningMap(input: unknown): Partial<Record<ArenaBackgroundEditLayer, ArenaBackgroundLayerTuning>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const normalized: Partial<Record<ArenaBackgroundEditLayer, ArenaBackgroundLayerTuning>> = {};

  Object.entries(input as Record<string, unknown>).forEach(([layer, layerInput]) => {
    if (isArenaBackgroundEditLayer(layer)) {
      normalized[layer] = normalizeArenaBackgroundLayerTuning(layerInput, layer);
    }
  });

  return normalized;
}

function normalizeArenaBackgroundVariantTunings(input: unknown): ArenaBackgroundVariantTuningMap {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const normalized: ArenaBackgroundVariantTuningMap = {};

  Object.entries(input as Record<string, unknown>).forEach(([variantId, variantInput]) => {
    const normalizedVariantId = normalizeArenaBackgroundVariantId(variantId);
    const layers = normalizeArenaBackgroundLayerTuningMap(variantInput);

    if (normalizedVariantId && Object.keys(layers).length > 0) {
      normalized[normalizedVariantId] = layers;
    }
  });

  return normalized;
}

function normalizeArenaBackgroundVariantId(input: unknown): string {
  const value = typeof input === "string" ? input.trim().slice(0, 80) : "";

  return value || "default";
}

function normalizeArenaBackgroundLayerTuning(input: unknown, layer: ArenaBackgroundEditLayer): ArenaBackgroundLayerTuning {
  const fallback = createDefaultArenaBackgroundLayerTuning(layer);
  const role = getArenaBackgroundLayerRole(layer);

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fallback;
  }

  const stored = input as Partial<ArenaBackgroundLayerTuning>;

  return {
    layout: {
      x: clampNumber(stored.layout?.x, -640, 640, fallback.layout.x),
      y: clampNumber(stored.layout?.y, -900, 900, fallback.layout.y),
      scale: clampNumber(stored.layout?.scale, 0.25, 2.5, fallback.layout.scale),
      alpha: clampNumber(stored.layout?.alpha, 0, 1, fallback.layout.alpha),
      visible: typeof stored.layout?.visible === "boolean" ? stored.layout.visible : fallback.layout.visible,
    },
    parallax: {
      followX: clampNumber(stored.parallax?.followX, -0.5, 1.5, fallback.parallax.followX),
      followY: clampNumber(stored.parallax?.followY, -0.5, 1.5, fallback.parallax.followY),
      zoom: clampNumber(stored.parallax?.zoom, 0, 1.5, fallback.parallax.zoom),
      lookUpY: clampNumber(stored.parallax?.lookUpY, -240, 240, fallback.parallax.lookUpY),
      ...(role === "mid" ? { zoomDarken: clampNumber(stored.parallax?.zoomDarken, 0, 1, fallback.parallax.zoomDarken ?? 1) } : {}),
      ...(role === "ambient"
        ? {
            farAlpha: clampNumber(stored.parallax?.farAlpha, 0, 1, fallback.parallax.farAlpha ?? 1),
            nearAlpha: clampNumber(stored.parallax?.nearAlpha, 0, 1, fallback.parallax.nearAlpha ?? 1),
          }
        : {}),
    },
  };
}

function isArenaBackgroundLayerTuning(input: unknown): input is ArenaBackgroundLayerTuning {
  return !!input && typeof input === "object" && !Array.isArray(input) && "layout" in input && "parallax" in input;
}

interface ArenaTier1VariantMigrationResult {
  input: Partial<ArenaDebugTuning>;
  arenaBackgroundTiers: ArenaBackgroundTierTuningMap;
}

const LEGACY_TIER_1_VARIANT_MIGRATION_ID = "variant-2";

function migrateLegacyArenaTier1BackgroundVariantTuning(
  input: Partial<ArenaDebugTuning>,
  arenaBackgroundTiers: ArenaBackgroundTierTuningMap,
  selectedVariantId: string,
  shouldMigrate: boolean,
): ArenaTier1VariantMigrationResult {
  if (!shouldMigrate || !hasLegacyArenaTier1BackgroundVariantChanges(input)) {
    return { input, arenaBackgroundTiers };
  }

  const variantId = selectedVariantId === "default" ? LEGACY_TIER_1_VARIANT_MIGRATION_ID : selectedVariantId;
  const tierKey = "1";
  const tierTuning = arenaBackgroundTiers[tierKey] ?? {};
  const migratedLayers = createLegacyArenaTier1BackgroundVariantTuning(input);

  return {
    input: resetLegacyArenaTier1BackgroundTuning(input),
    arenaBackgroundTiers: {
      ...arenaBackgroundTiers,
      [tierKey]: {
        ...tierTuning,
        variants: {
          ...tierTuning.variants,
          [variantId]: {
            ...migratedLayers,
            ...tierTuning.variants?.[variantId],
          },
        },
      },
    },
  };
}

function mergeArenaBackgroundTierTunings(
  defaults: ArenaBackgroundTierTuningMap,
  overrides: ArenaBackgroundTierTuningMap,
): ArenaBackgroundTierTuningMap {
  const result: ArenaBackgroundTierTuningMap = {};
  const tierKeys = new Set([...Object.keys(defaults), ...Object.keys(overrides)]);

  tierKeys.forEach((tierKey) => {
    const defaultTier = defaults[tierKey] ?? {};
    const overrideTier = overrides[tierKey] ?? {};
    const layers = {
      ...defaultTier.layers,
      ...overrideTier.layers,
    };
    const variants = mergeArenaBackgroundVariantTunings(defaultTier.variants ?? {}, overrideTier.variants ?? {});
    const tierTuning: ArenaBackgroundTierTuning = {};

    if (Object.keys(layers).length > 0) {
      tierTuning.layers = layers;
    }

    if (Object.keys(variants).length > 0) {
      tierTuning.variants = variants;
    }

    if (tierTuning.layers || tierTuning.variants) {
      result[tierKey] = tierTuning;
    }
  });

  return result;
}

function mergeArenaBackgroundVariantTunings(
  defaults: ArenaBackgroundVariantTuningMap,
  overrides: ArenaBackgroundVariantTuningMap,
): ArenaBackgroundVariantTuningMap {
  const result: ArenaBackgroundVariantTuningMap = {};
  const variantIds = new Set([...Object.keys(defaults), ...Object.keys(overrides)]);

  variantIds.forEach((variantId) => {
    const layers = {
      ...defaults[variantId],
      ...overrides[variantId],
    };

    if (Object.keys(layers).length > 0) {
      result[variantId] = layers;
    }
  });

  return result;
}

function hasLegacyArenaTier1BackgroundVariantChanges(input: Partial<ArenaDebugTuning>): boolean {
  const current = createLegacyArenaTier1BackgroundVariantTuning(input);
  const fallback = createLegacyArenaTier1BackgroundVariantTuning(defaultDebugTuning);

  return !areArenaBackgroundLayerTuningsEqual(current.back, fallback.back)
    || !areArenaBackgroundLayerTuningsEqual(current.ground, fallback.ground);
}

function createLegacyArenaTier1BackgroundVariantTuning(
  input: Partial<ArenaDebugTuning>,
): Required<Pick<Record<ArenaBackgroundEditLayer, ArenaBackgroundLayerTuning>, "back" | "ground">> {
  return {
    back: {
      layout: {
        x: clampNumber(input.arenaTier1BackgroundBackX, -640, 640, defaultDebugTuning.arenaTier1BackgroundBackX),
        y: clampNumber(input.arenaTier1BackgroundBackY, -900, 900, defaultDebugTuning.arenaTier1BackgroundBackY),
        scale: clampNumber(input.arenaTier1BackgroundBackScale, 0.25, 2.5, defaultDebugTuning.arenaTier1BackgroundBackScale),
        alpha: clampNumber(input.arenaTier1BackgroundBackAlpha, 0, 1, defaultDebugTuning.arenaTier1BackgroundBackAlpha),
        visible: typeof input.arenaTier1BackgroundBackVisible === "boolean" ? input.arenaTier1BackgroundBackVisible : defaultDebugTuning.arenaTier1BackgroundBackVisible,
      },
      parallax: {
        followX: clampNumber(input.arenaTier1BackFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier1BackFollowX),
        followY: clampNumber(input.arenaTier1BackFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier1BackFollowY),
        zoom: clampNumber(input.arenaTier1BackZoom, 0, 1.5, defaultDebugTuning.arenaTier1BackZoom),
        lookUpY: clampNumber(input.arenaTier1BackLookUpY, -240, 240, defaultDebugTuning.arenaTier1BackLookUpY),
      },
    },
    ground: {
      layout: {
        x: clampNumber(input.arenaTier1BackgroundGroundX, -640, 640, defaultDebugTuning.arenaTier1BackgroundGroundX),
        y: clampNumber(input.arenaTier1BackgroundGroundY, -900, 900, defaultDebugTuning.arenaTier1BackgroundGroundY),
        scale: clampNumber(input.arenaTier1BackgroundGroundScale, 0.25, 2.5, defaultDebugTuning.arenaTier1BackgroundGroundScale),
        alpha: clampNumber(input.arenaTier1BackgroundGroundAlpha, 0, 1, defaultDebugTuning.arenaTier1BackgroundGroundAlpha),
        visible: typeof input.arenaTier1BackgroundGroundVisible === "boolean" ? input.arenaTier1BackgroundGroundVisible : defaultDebugTuning.arenaTier1BackgroundGroundVisible,
      },
      parallax: {
        followX: clampNumber(input.arenaTier1GroundFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier1GroundFollowX),
        followY: clampNumber(input.arenaTier1GroundFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier1GroundFollowY),
        zoom: clampNumber(input.arenaTier1GroundZoom, 0, 1.5, defaultDebugTuning.arenaTier1GroundZoom),
        lookUpY: clampNumber(input.arenaTier1GroundLookUpY, -240, 240, defaultDebugTuning.arenaTier1GroundLookUpY),
      },
    },
  };
}

function resetLegacyArenaTier1BackgroundTuning(input: Partial<ArenaDebugTuning>): Partial<ArenaDebugTuning> {
  return {
    ...input,
    arenaTier1BackFollowX: defaultDebugTuning.arenaTier1BackFollowX,
    arenaTier1BackFollowY: defaultDebugTuning.arenaTier1BackFollowY,
    arenaTier1BackZoom: defaultDebugTuning.arenaTier1BackZoom,
    arenaTier1BackLookUpY: defaultDebugTuning.arenaTier1BackLookUpY,
    arenaTier1GroundFollowX: defaultDebugTuning.arenaTier1GroundFollowX,
    arenaTier1GroundFollowY: defaultDebugTuning.arenaTier1GroundFollowY,
    arenaTier1GroundZoom: defaultDebugTuning.arenaTier1GroundZoom,
    arenaTier1GroundLookUpY: defaultDebugTuning.arenaTier1GroundLookUpY,
    arenaTier1BackgroundBackX: defaultDebugTuning.arenaTier1BackgroundBackX,
    arenaTier1BackgroundBackY: defaultDebugTuning.arenaTier1BackgroundBackY,
    arenaTier1BackgroundBackScale: defaultDebugTuning.arenaTier1BackgroundBackScale,
    arenaTier1BackgroundBackAlpha: defaultDebugTuning.arenaTier1BackgroundBackAlpha,
    arenaTier1BackgroundBackVisible: defaultDebugTuning.arenaTier1BackgroundBackVisible,
    arenaTier1BackgroundGroundX: defaultDebugTuning.arenaTier1BackgroundGroundX,
    arenaTier1BackgroundGroundY: defaultDebugTuning.arenaTier1BackgroundGroundY,
    arenaTier1BackgroundGroundScale: defaultDebugTuning.arenaTier1BackgroundGroundScale,
    arenaTier1BackgroundGroundAlpha: defaultDebugTuning.arenaTier1BackgroundGroundAlpha,
    arenaTier1BackgroundGroundVisible: defaultDebugTuning.arenaTier1BackgroundGroundVisible,
  };
}

function areArenaBackgroundLayerTuningsEqual(first: ArenaBackgroundLayerTuning, second: ArenaBackgroundLayerTuning): boolean {
  return areNumbersClose(first.layout.x, second.layout.x)
    && areNumbersClose(first.layout.y, second.layout.y)
    && areNumbersClose(first.layout.scale, second.layout.scale)
    && areNumbersClose(first.layout.alpha, second.layout.alpha)
    && first.layout.visible === second.layout.visible
    && areNumbersClose(first.parallax.followX, second.parallax.followX)
    && areNumbersClose(first.parallax.followY, second.parallax.followY)
    && areNumbersClose(first.parallax.zoom, second.parallax.zoom)
    && areNumbersClose(first.parallax.lookUpY, second.parallax.lookUpY)
    && areOptionalNumbersClose(first.parallax.zoomDarken, second.parallax.zoomDarken)
    && areOptionalNumbersClose(first.parallax.farAlpha, second.parallax.farAlpha)
    && areOptionalNumbersClose(first.parallax.nearAlpha, second.parallax.nearAlpha);
}

function areNumbersClose(first: number, second: number): boolean {
  return Math.abs(first - second) <= 0.0001;
}

function areOptionalNumbersClose(first: number | undefined, second: number | undefined): boolean {
  return first === undefined && second === undefined
    ? true
    : first !== undefined && second !== undefined && areNumbersClose(first, second);
}

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
  arenaBackgroundPreviewTier: 2,
  arenaBackgroundPreviewVariant: "default",
  arenaBackgroundEditMode: false,
  arenaBackgroundEditLayer: "ground",
  arenaBackgroundTiers: {
    "1": {
      "variants": {
        "variant-2": {
          "back": {
            "layout": {
              "x": 0,
              "y": 7,
              "scale": 0.6,
              "alpha": 1,
              "visible": true
            },
            "parallax": {
              "followX": 0.2,
              "followY": -0.2,
              "zoom": 0.6,
              "lookUpY": -55
            }
          },
          "ground": {
            "layout": {
              "x": 0,
              "y": 5,
              "scale": 0.63,
              "alpha": 1,
              "visible": true
            },
            "parallax": {
              "followX": 0.2,
              "followY": 0.3,
              "zoom": 0.65,
              "lookUpY": 7
            }
          }
        }
      }
    },
    "2": {
      "layers": {
        "ambient-2": {
          "layout": {
            "x": 0,
            "y": 0,
            "scale": 0.86,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0,
            "followY": 0,
            "zoom": 0,
            "lookUpY": 0,
            "farAlpha": 0,
            "nearAlpha": 0.5
          }
        }
      }
    },
    "3": {
      "layers": {
        "back": {
          "layout": {
            "x": 0,
            "y": -125,
            "scale": 0.53,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.2,
            "followY": -0.1,
            "zoom": 0.3,
            "lookUpY": -19
          }
        },
        "ground": {
          "layout": {
            "x": 0,
            "y": -158,
            "scale": 1,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.4,
            "followY": 0.45,
            "zoom": 0.7,
            "lookUpY": 13
          }
        },
        "front": {
          "layout": {
            "x": 0,
            "y": -50,
            "scale": 0.49,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.3,
            "followY": 0.3,
            "zoom": 0.45,
            "lookUpY": 0
          }
        },
        "ambient": {
          "layout": {
            "x": 0,
            "y": 0,
            "scale": 0.57,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.37,
            "followY": 0.48,
            "zoom": 0.5,
            "lookUpY": -16,
            "farAlpha": 0.4,
            "nearAlpha": 0.6
          }
        }
      }
    },
    "4": {
      "layers": {
        "back": {
          "layout": {
            "x": 0,
            "y": -40,
            "scale": 0.5,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.2,
            "followY": -0.12,
            "zoom": 0.15,
            "lookUpY": 40
          }
        },
        "back-2": {
          "layout": {
            "x": 0,
            "y": -16,
            "scale": 0.5,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.2,
            "followY": -0.12,
            "zoom": 0.2,
            "lookUpY": 45
          }
        },
        "ground": {
          "layout": {
            "x": 0,
            "y": -100,
            "scale": 0.8,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.25,
            "followY": 0.3,
            "zoom": 0.4,
            "lookUpY": -10
          }
        },
        "ambient": {
          "layout": {
            "x": 0,
            "y": 37,
            "scale": 0.5,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.37,
            "followY": 0.48,
            "zoom": 0.5,
            "lookUpY": -16,
            "farAlpha": 0.1,
            "nearAlpha": 0.3
          }
        }
      }
    },
    "5": {
      "layers": {
        "back": {
          "layout": {
            "x": 0,
            "y": -30,
            "scale": 0.5,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.25,
            "followY": 0.2,
            "zoom": 0.4,
            "lookUpY": -35
          }
        },
        "ground": {
          "layout": {
            "x": 0,
            "y": -85,
            "scale": 0.8,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.1,
            "followY": 0.05,
            "zoom": 0.3,
            "lookUpY": -45
          }
        }
      }
    },
    "6": {
      "layers": {
        "back": {
          "layout": {
            "x": 0,
            "y": -60,
            "scale": 0.52,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.1,
            "followY": 0.05,
            "zoom": 0.12,
            "lookUpY": -10
          }
        },
        "ground": {
          "layout": {
            "x": 0,
            "y": -48,
            "scale": 0.7,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.2,
            "followY": 0.2,
            "zoom": 0.35,
            "lookUpY": -20
          }
        }
      },
      "variants": {
        "variant-2": {
          "back": {
            "layout": {
              "x": 0,
              "y": -60,
              "scale": 0.52,
              "alpha": 1,
              "visible": true
            },
            "parallax": {
              "followX": 0.1,
              "followY": 0.05,
              "zoom": 0.12,
              "lookUpY": -10
            }
          },
          "ground": {
            "layout": {
              "x": 0,
              "y": -48,
              "scale": 0.7,
              "alpha": 1,
              "visible": true
            },
            "parallax": {
              "followX": 0.2,
              "followY": 0.2,
              "zoom": 0.35,
              "lookUpY": -20
            }
          }
        }
      }
    },
    "7": {
      "layers": {
        "back": {
          "layout": {
            "x": 0,
            "y": 40,
            "scale": 0.55,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.08,
            "followY": 0.06,
            "zoom": 0.05,
            "lookUpY": -4
          }
        },
        "ground": {
          "layout": {
            "x": 0,
            "y": 79,
            "scale": 0.67,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.37,
            "followY": 0.54,
            "zoom": 0.74,
            "lookUpY": 13
          }
        },
        "ambient": {
          "layout": {
            "x": 0,
            "y": 0,
            "scale": 0.51,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.37,
            "followY": 0.48,
            "zoom": 0.5,
            "lookUpY": -16,
            "farAlpha": 0,
            "nearAlpha": 0.6
          }
        }
      }
    },
    "8": {
      "layers": {
        "back": {
          "layout": {
            "x": 0,
            "y": 0,
            "scale": 0.52,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.03,
            "followY": -0.2,
            "zoom": 0.1,
            "lookUpY": 32
          }
        },
        "mid": {
          "layout": {
            "x": 0,
            "y": -101,
            "scale": 0.54,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.2,
            "followY": 0.2,
            "zoom": 0.37,
            "lookUpY": -21,
            "zoomDarken": 0
          }
        },
        "ground": {
          "layout": {
            "x": 0,
            "y": -249,
            "scale": 1,
            "alpha": 1,
            "visible": true
          },
          "parallax": {
            "followX": 0.3,
            "followY": 0.3,
            "zoom": 0.55,
            "lookUpY": -58
          }
        }
      }
    }
  },
  arenaTier1BackFollowX: 0.2,
  arenaTier1BackFollowY: -0.12,
  arenaTier1BackZoom: 0.39,
  arenaTier1BackLookUpY: 240,
  arenaTier1MidFollowX: -0.5,
  arenaTier1MidFollowY: 0.68,
  arenaTier1MidZoom: 0.2,
  arenaTier1MidLookUpY: 132,
  arenaTier1MidZoomDarken: 1,
  arenaTier1GroundFollowX: 0.37,
  arenaTier1GroundFollowY: 0.47,
  arenaTier1GroundZoom: 0.74,
  arenaTier1GroundLookUpY: 13,
  arenaTier2BackFollowX: 0.1,
  arenaTier2BackFollowY: -0.1,
  arenaTier2BackZoom: 0.05,
  arenaTier2BackLookUpY: -40,
  arenaTier2MidFollowX: -0.5,
  arenaTier2MidFollowY: 0.68,
  arenaTier2MidZoom: 0.2,
  arenaTier2MidLookUpY: 132,
  arenaTier2MidZoomDarken: 1,
  arenaTier2GroundFollowX: 0.3,
  arenaTier2GroundFollowY: 0.35,
  arenaTier2GroundZoom: 0.3,
  arenaTier2GroundLookUpY: 13,
  arenaTier2FrontFollowX: 0.3,
  arenaTier2FrontFollowY: 0.3,
  arenaTier2FrontZoom: 0.15,
  arenaTier2FrontLookUpY: 10,
  arenaTier2AmbientFollowX: 0.2,
  arenaTier2AmbientFollowY: 0.01,
  arenaTier2AmbientZoom: 0.2,
  arenaTier2AmbientLookUpY: -15,
  arenaTier2AmbientFarAlpha: 0,
  arenaTier2AmbientNearAlpha: 0.66,
  arenaTier1BackgroundBackX: 0,
  arenaTier1BackgroundBackY: 0,
  arenaTier1BackgroundBackScale: 1,
  arenaTier1BackgroundBackAlpha: 1,
  arenaTier1BackgroundBackVisible: true,
  arenaTier1BackgroundMidX: 0,
  arenaTier1BackgroundMidY: 0,
  arenaTier1BackgroundMidScale: 1,
  arenaTier1BackgroundMidAlpha: 1,
  arenaTier1BackgroundMidVisible: true,
  arenaTier1BackgroundGroundX: 0,
  arenaTier1BackgroundGroundY: 0,
  arenaTier1BackgroundGroundScale: 1,
  arenaTier1BackgroundGroundAlpha: 1,
  arenaTier1BackgroundGroundVisible: true,
  arenaTier2BackgroundBackX: 0,
  arenaTier2BackgroundBackY: -28,
  arenaTier2BackgroundBackScale: 0.51,
  arenaTier2BackgroundBackAlpha: 1,
  arenaTier2BackgroundBackVisible: true,
  arenaTier2BackgroundMidX: 0,
  arenaTier2BackgroundMidY: 0,
  arenaTier2BackgroundMidScale: 1,
  arenaTier2BackgroundMidAlpha: 1,
  arenaTier2BackgroundMidVisible: true,
  arenaTier2BackgroundGroundX: 0,
  arenaTier2BackgroundGroundY: -196,
  arenaTier2BackgroundGroundScale: 1,
  arenaTier2BackgroundGroundAlpha: 1,
  arenaTier2BackgroundGroundVisible: true,
  arenaTier2BackgroundFrontX: 0,
  arenaTier2BackgroundFrontY: -65,
  arenaTier2BackgroundFrontScale: 0.5,
  arenaTier2BackgroundFrontAlpha: 1,
  arenaTier2BackgroundFrontVisible: true,
  arenaTier2BackgroundAmbientX: 0,
  arenaTier2BackgroundAmbientY: -16,
  arenaTier2BackgroundAmbientScale: 0.55,
  arenaTier2BackgroundAmbientAlpha: 1,
  arenaTier2BackgroundAmbientVisible: true,
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
  animationWeaponDragEnabled: false,
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
  const arenaBackgroundPreviewVariant = normalizeDebugString(input.arenaBackgroundPreviewVariant, defaultDebugTuning.arenaBackgroundPreviewVariant, 80);
  const normalizedArenaBackgroundTierOverrides = normalizeArenaBackgroundTierTunings(input.arenaBackgroundTiers);
  const arenaTier1VariantMigration = migrateLegacyArenaTier1BackgroundVariantTuning(
    input,
    normalizedArenaBackgroundTierOverrides,
    arenaBackgroundPreviewVariant,
    inputVersion < 3,
  );
  const arenaInput = arenaTier1VariantMigration.input;
  const arenaBackgroundTiers = mergeArenaBackgroundTierTunings(
    normalizeArenaBackgroundTierTunings(defaultDebugTuning.arenaBackgroundTiers),
    arenaTier1VariantMigration.arenaBackgroundTiers,
  );

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
    arenaBackgroundPreviewTier: Math.round(clampNumber(input.arenaBackgroundPreviewTier, 1, 50, defaultDebugTuning.arenaBackgroundPreviewTier)),
    arenaBackgroundPreviewVariant,
    arenaBackgroundEditMode: typeof input.arenaBackgroundEditMode === "boolean" ? input.arenaBackgroundEditMode : defaultDebugTuning.arenaBackgroundEditMode,
    arenaBackgroundEditLayer: isArenaBackgroundEditLayer(input.arenaBackgroundEditLayer)
      ? input.arenaBackgroundEditLayer
      : defaultDebugTuning.arenaBackgroundEditLayer,
    arenaBackgroundTiers,
    arenaTier1BackFollowX: clampNumber(arenaInput.arenaTier1BackFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier1BackFollowX),
    arenaTier1BackFollowY: clampNumber(arenaInput.arenaTier1BackFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier1BackFollowY),
    arenaTier1BackZoom: clampNumber(arenaInput.arenaTier1BackZoom, 0, 1.5, defaultDebugTuning.arenaTier1BackZoom),
    arenaTier1BackLookUpY: clampNumber(arenaInput.arenaTier1BackLookUpY, -240, 240, defaultDebugTuning.arenaTier1BackLookUpY),
    arenaTier1MidFollowX: clampNumber(input.arenaTier1MidFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier1MidFollowX),
    arenaTier1MidFollowY: clampNumber(input.arenaTier1MidFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier1MidFollowY),
    arenaTier1MidZoom: clampNumber(input.arenaTier1MidZoom, 0, 1.5, defaultDebugTuning.arenaTier1MidZoom),
    arenaTier1MidLookUpY: clampNumber(input.arenaTier1MidLookUpY, -240, 240, defaultDebugTuning.arenaTier1MidLookUpY),
    arenaTier1MidZoomDarken: clampNumber(input.arenaTier1MidZoomDarken, 0, 1, defaultDebugTuning.arenaTier1MidZoomDarken),
    arenaTier1GroundFollowX: clampNumber(arenaInput.arenaTier1GroundFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier1GroundFollowX),
    arenaTier1GroundFollowY: clampNumber(arenaInput.arenaTier1GroundFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier1GroundFollowY),
    arenaTier1GroundZoom: clampNumber(arenaInput.arenaTier1GroundZoom, 0, 1.5, defaultDebugTuning.arenaTier1GroundZoom),
    arenaTier1GroundLookUpY: clampNumber(arenaInput.arenaTier1GroundLookUpY, -240, 240, defaultDebugTuning.arenaTier1GroundLookUpY),
    arenaTier2BackFollowX: clampNumber(input.arenaTier2BackFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier2BackFollowX),
    arenaTier2BackFollowY: clampNumber(input.arenaTier2BackFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier2BackFollowY),
    arenaTier2BackZoom: clampNumber(input.arenaTier2BackZoom, 0, 1.5, defaultDebugTuning.arenaTier2BackZoom),
    arenaTier2BackLookUpY: clampNumber(input.arenaTier2BackLookUpY, -240, 240, defaultDebugTuning.arenaTier2BackLookUpY),
    arenaTier2MidFollowX: clampNumber(input.arenaTier2MidFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier2MidFollowX),
    arenaTier2MidFollowY: clampNumber(input.arenaTier2MidFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier2MidFollowY),
    arenaTier2MidZoom: clampNumber(input.arenaTier2MidZoom, 0, 1.5, defaultDebugTuning.arenaTier2MidZoom),
    arenaTier2MidLookUpY: clampNumber(input.arenaTier2MidLookUpY, -240, 240, defaultDebugTuning.arenaTier2MidLookUpY),
    arenaTier2MidZoomDarken: clampNumber(input.arenaTier2MidZoomDarken, 0, 1, defaultDebugTuning.arenaTier2MidZoomDarken),
    arenaTier2GroundFollowX: clampNumber(input.arenaTier2GroundFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier2GroundFollowX),
    arenaTier2GroundFollowY: clampNumber(input.arenaTier2GroundFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier2GroundFollowY),
    arenaTier2GroundZoom: clampNumber(input.arenaTier2GroundZoom, 0, 1.5, defaultDebugTuning.arenaTier2GroundZoom),
    arenaTier2GroundLookUpY: clampNumber(input.arenaTier2GroundLookUpY, -240, 240, defaultDebugTuning.arenaTier2GroundLookUpY),
    arenaTier2FrontFollowX: clampNumber(input.arenaTier2FrontFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier2FrontFollowX),
    arenaTier2FrontFollowY: clampNumber(input.arenaTier2FrontFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier2FrontFollowY),
    arenaTier2FrontZoom: clampNumber(input.arenaTier2FrontZoom, 0, 1.5, defaultDebugTuning.arenaTier2FrontZoom),
    arenaTier2FrontLookUpY: clampNumber(input.arenaTier2FrontLookUpY, -240, 240, defaultDebugTuning.arenaTier2FrontLookUpY),
    arenaTier2AmbientFollowX: clampNumber(input.arenaTier2AmbientFollowX, -0.5, 1.5, defaultDebugTuning.arenaTier2AmbientFollowX),
    arenaTier2AmbientFollowY: clampNumber(input.arenaTier2AmbientFollowY, -0.5, 1.5, defaultDebugTuning.arenaTier2AmbientFollowY),
    arenaTier2AmbientZoom: clampNumber(input.arenaTier2AmbientZoom, 0, 1.5, defaultDebugTuning.arenaTier2AmbientZoom),
    arenaTier2AmbientLookUpY: clampNumber(input.arenaTier2AmbientLookUpY, -240, 240, defaultDebugTuning.arenaTier2AmbientLookUpY),
    arenaTier2AmbientFarAlpha: clampNumber(input.arenaTier2AmbientFarAlpha, 0, 1, defaultDebugTuning.arenaTier2AmbientFarAlpha),
    arenaTier2AmbientNearAlpha: clampNumber(input.arenaTier2AmbientNearAlpha, 0, 1, defaultDebugTuning.arenaTier2AmbientNearAlpha),
    arenaTier1BackgroundBackX: clampNumber(arenaInput.arenaTier1BackgroundBackX, -640, 640, defaultDebugTuning.arenaTier1BackgroundBackX),
    arenaTier1BackgroundBackY: clampNumber(arenaInput.arenaTier1BackgroundBackY, -900, 900, defaultDebugTuning.arenaTier1BackgroundBackY),
    arenaTier1BackgroundBackScale: clampNumber(arenaInput.arenaTier1BackgroundBackScale, 0.25, 2.5, defaultDebugTuning.arenaTier1BackgroundBackScale),
    arenaTier1BackgroundBackAlpha: clampNumber(arenaInput.arenaTier1BackgroundBackAlpha, 0, 1, defaultDebugTuning.arenaTier1BackgroundBackAlpha),
    arenaTier1BackgroundBackVisible: typeof arenaInput.arenaTier1BackgroundBackVisible === "boolean" ? arenaInput.arenaTier1BackgroundBackVisible : defaultDebugTuning.arenaTier1BackgroundBackVisible,
    arenaTier1BackgroundMidX: clampNumber(input.arenaTier1BackgroundMidX, -640, 640, defaultDebugTuning.arenaTier1BackgroundMidX),
    arenaTier1BackgroundMidY: clampNumber(input.arenaTier1BackgroundMidY, -900, 900, defaultDebugTuning.arenaTier1BackgroundMidY),
    arenaTier1BackgroundMidScale: clampNumber(input.arenaTier1BackgroundMidScale, 0.25, 2.5, defaultDebugTuning.arenaTier1BackgroundMidScale),
    arenaTier1BackgroundMidAlpha: clampNumber(input.arenaTier1BackgroundMidAlpha, 0, 1, defaultDebugTuning.arenaTier1BackgroundMidAlpha),
    arenaTier1BackgroundMidVisible: typeof input.arenaTier1BackgroundMidVisible === "boolean" ? input.arenaTier1BackgroundMidVisible : defaultDebugTuning.arenaTier1BackgroundMidVisible,
    arenaTier1BackgroundGroundX: clampNumber(arenaInput.arenaTier1BackgroundGroundX, -640, 640, defaultDebugTuning.arenaTier1BackgroundGroundX),
    arenaTier1BackgroundGroundY: clampNumber(arenaInput.arenaTier1BackgroundGroundY, -900, 900, defaultDebugTuning.arenaTier1BackgroundGroundY),
    arenaTier1BackgroundGroundScale: clampNumber(arenaInput.arenaTier1BackgroundGroundScale, 0.25, 2.5, defaultDebugTuning.arenaTier1BackgroundGroundScale),
    arenaTier1BackgroundGroundAlpha: clampNumber(arenaInput.arenaTier1BackgroundGroundAlpha, 0, 1, defaultDebugTuning.arenaTier1BackgroundGroundAlpha),
    arenaTier1BackgroundGroundVisible: typeof arenaInput.arenaTier1BackgroundGroundVisible === "boolean" ? arenaInput.arenaTier1BackgroundGroundVisible : defaultDebugTuning.arenaTier1BackgroundGroundVisible,
    arenaTier2BackgroundBackX: clampNumber(input.arenaTier2BackgroundBackX, -640, 640, defaultDebugTuning.arenaTier2BackgroundBackX),
    arenaTier2BackgroundBackY: clampNumber(input.arenaTier2BackgroundBackY, -900, 900, defaultDebugTuning.arenaTier2BackgroundBackY),
    arenaTier2BackgroundBackScale: clampNumber(input.arenaTier2BackgroundBackScale, 0.25, 2.5, defaultDebugTuning.arenaTier2BackgroundBackScale),
    arenaTier2BackgroundBackAlpha: clampNumber(input.arenaTier2BackgroundBackAlpha, 0, 1, defaultDebugTuning.arenaTier2BackgroundBackAlpha),
    arenaTier2BackgroundBackVisible: typeof input.arenaTier2BackgroundBackVisible === "boolean" ? input.arenaTier2BackgroundBackVisible : defaultDebugTuning.arenaTier2BackgroundBackVisible,
    arenaTier2BackgroundMidX: clampNumber(input.arenaTier2BackgroundMidX, -640, 640, defaultDebugTuning.arenaTier2BackgroundMidX),
    arenaTier2BackgroundMidY: clampNumber(input.arenaTier2BackgroundMidY, -900, 900, defaultDebugTuning.arenaTier2BackgroundMidY),
    arenaTier2BackgroundMidScale: clampNumber(input.arenaTier2BackgroundMidScale, 0.25, 2.5, defaultDebugTuning.arenaTier2BackgroundMidScale),
    arenaTier2BackgroundMidAlpha: clampNumber(input.arenaTier2BackgroundMidAlpha, 0, 1, defaultDebugTuning.arenaTier2BackgroundMidAlpha),
    arenaTier2BackgroundMidVisible: typeof input.arenaTier2BackgroundMidVisible === "boolean" ? input.arenaTier2BackgroundMidVisible : defaultDebugTuning.arenaTier2BackgroundMidVisible,
    arenaTier2BackgroundGroundX: clampNumber(input.arenaTier2BackgroundGroundX, -640, 640, defaultDebugTuning.arenaTier2BackgroundGroundX),
    arenaTier2BackgroundGroundY: clampNumber(input.arenaTier2BackgroundGroundY, -900, 900, defaultDebugTuning.arenaTier2BackgroundGroundY),
    arenaTier2BackgroundGroundScale: clampNumber(input.arenaTier2BackgroundGroundScale, 0.25, 2.5, defaultDebugTuning.arenaTier2BackgroundGroundScale),
    arenaTier2BackgroundGroundAlpha: clampNumber(input.arenaTier2BackgroundGroundAlpha, 0, 1, defaultDebugTuning.arenaTier2BackgroundGroundAlpha),
    arenaTier2BackgroundGroundVisible: typeof input.arenaTier2BackgroundGroundVisible === "boolean" ? input.arenaTier2BackgroundGroundVisible : defaultDebugTuning.arenaTier2BackgroundGroundVisible,
    arenaTier2BackgroundFrontX: clampNumber(input.arenaTier2BackgroundFrontX, -640, 640, defaultDebugTuning.arenaTier2BackgroundFrontX),
    arenaTier2BackgroundFrontY: clampNumber(input.arenaTier2BackgroundFrontY, -900, 900, defaultDebugTuning.arenaTier2BackgroundFrontY),
    arenaTier2BackgroundFrontScale: clampNumber(input.arenaTier2BackgroundFrontScale, 0.25, 2.5, defaultDebugTuning.arenaTier2BackgroundFrontScale),
    arenaTier2BackgroundFrontAlpha: clampNumber(input.arenaTier2BackgroundFrontAlpha, 0, 1, defaultDebugTuning.arenaTier2BackgroundFrontAlpha),
    arenaTier2BackgroundFrontVisible: typeof input.arenaTier2BackgroundFrontVisible === "boolean" ? input.arenaTier2BackgroundFrontVisible : defaultDebugTuning.arenaTier2BackgroundFrontVisible,
    arenaTier2BackgroundAmbientX: clampNumber(input.arenaTier2BackgroundAmbientX, -640, 640, defaultDebugTuning.arenaTier2BackgroundAmbientX),
    arenaTier2BackgroundAmbientY: clampNumber(input.arenaTier2BackgroundAmbientY, -900, 900, defaultDebugTuning.arenaTier2BackgroundAmbientY),
    arenaTier2BackgroundAmbientScale: clampNumber(input.arenaTier2BackgroundAmbientScale, 0.25, 2.5, defaultDebugTuning.arenaTier2BackgroundAmbientScale),
    arenaTier2BackgroundAmbientAlpha: clampNumber(input.arenaTier2BackgroundAmbientAlpha, 0, 1, defaultDebugTuning.arenaTier2BackgroundAmbientAlpha),
    arenaTier2BackgroundAmbientVisible: typeof input.arenaTier2BackgroundAmbientVisible === "boolean" ? input.arenaTier2BackgroundAmbientVisible : defaultDebugTuning.arenaTier2BackgroundAmbientVisible,
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
    animationWeaponDragEnabled: typeof input.animationWeaponDragEnabled === "boolean"
      ? input.animationWeaponDragEnabled
      : defaultDebugTuning.animationWeaponDragEnabled,
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

  const normalizedAnimations = options.resetDefaultSlots ? restoreBodyAnimationDefaultSlots(animations, fallbackAnimations) : animations;

  syncSpearAttackBodyAnimationVariants(normalizedAnimations);

  return normalizedAnimations;
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
    weaponMirrorX: normalized.weaponMirrorX,
    weaponMirrorY: normalized.weaponMirrorY,
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
    weaponMirrorX: typeof source.weaponMirrorX === "boolean" ? source.weaponMirrorX : fallback.weaponMirrorX,
    weaponMirrorY: typeof source.weaponMirrorY === "boolean" ? source.weaponMirrorY : fallback.weaponMirrorY,
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

function normalizeDebugString(input: unknown, fallback: string, maxLength: number): string {
  const value = typeof input === "string" ? input.trim().slice(0, maxLength) : "";

  return value || fallback;
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

export function getArenaBackgroundLayerRole(layer: ArenaBackgroundEditLayer): ArenaBackgroundLayerRole {
  const match = /^(back|mid|ground|front|ambient)(?:-\d+)?$/u.exec(layer);

  return match ? match[1] as ArenaBackgroundLayerRole : "ground";
}

export function isArenaBackgroundEditLayer(value: unknown): value is ArenaBackgroundEditLayer {
  return typeof value === "string" && /^(back|mid|ground|front|ambient)(?:-\d+)?$/u.test(value);
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
