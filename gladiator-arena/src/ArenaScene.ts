import Phaser from "phaser";
import {
  ARENA_WORLD_LEFT,
  ARENA_WORLD_HEIGHT,
  ARENA_WORLD_TOP,
  ARENA_WORLD_WIDTH,
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
  DEFAULT_ENEMY_STAGE_X,
  DEFAULT_PLAYER_STAGE_X,
  DEFAULT_PLAYER_SCALE,
  DEFAULT_STAGE_ORIGIN_X,
  FIGHTER_BASE_Y,
} from "./arenaLayout";
import {
  ARENA_BACKGROUND_BACK_LAYER_ASSET_KEY,
  ARENA_BACKGROUND_BACK_LAYER_ASSET_URL,
  ARENA_BACKGROUND_GROUND_LAYER_ASSET_KEY,
  ARENA_BACKGROUND_GROUND_LAYER_ASSET_URL,
  ARENA_BACKGROUND_MID_LAYER_ASSET_KEY,
  ARENA_BACKGROUND_MID_LAYER_ASSET_URL,
  CITY_ARMORY_BACKGROUND_ASSET_KEY,
  CITY_ARMORY_BACKGROUND_ASSET_URL,
  CITY_BACKGROUND_ASSET_KEY,
  CITY_BACKGROUND_ASSET_URL,
  CITY_DAY_BACKGROUND_ASSET_KEY,
  CITY_DAY_BACKGROUND_ASSET_URL,
  CITY_CLOUD_ASSETS,
  CITY_WEAPON_SHOP_BACKGROUND_ASSET_KEY,
  CITY_WEAPON_SHOP_BACKGROUND_ASSET_URL,
  DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY,
  DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL,
  DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY,
  DAMAGE_ARMOR_BREAK_ICON_ASSET_URL,
  DAMAGE_BLOCK_ICON_ASSET_KEY,
  DAMAGE_BLOCK_ICON_ASSET_URL,
  DAMAGE_HIT_ICON_ASSET_KEY,
  DAMAGE_HIT_ICON_ASSET_URL,
  FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY,
  FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY,
  FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY,
  FIGHTER_BACK_WRIST_LIGHT_ASSET_KEY,
  FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_BACK_HAND_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY,
  FIGHTER_BREASTPLATE_CLOTH_ASSET_KEY,
  FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY,
  FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY,
  FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_WRIST_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY,
  FIGHTER_HELMET_LIGHT_ASSET_KEY,
  FIGHTER_HEAD_LIGHT_ASSET_KEY,
  FIGHTER_PAPER_DOLL_ASSETS,
  FIGHTER_TORSO_LIGHT_ASSET_KEY,
  FIGHTER_WEAPON_SWORD_01_ASSET_KEY,
  GAME_HEIGHT,
  GAME_WIDTH,
  getFighterTextureKey,
  PLAYER_AVATAR_FEET_Y_OFFSET,
} from "./assets";
import { getCameraTarget } from "./arenaCamera";
import type { CameraTarget, CameraViewport } from "./arenaCamera";
import { getBattleSafeArea } from "./battleSafeArea";
import { getFighterMaxArmor, getFighterMaxHp, getFighterMaxStamina, type ActionId, type CombatState, type FighterState } from "./combat";
import {
  createDefaultHeroEquipment,
  DEFAULT_ENEMY_VISUAL_PRESET,
  HERO_EQUIPMENT_SLOT_KEYS,
  type HeroEquipment,
  type HeroEquipmentSlotKey,
  type HeroItemId,
  type HeroWeaponClass,
  CLOTH_BREASTPLATE_ID,
} from "./hero";
import { AUTO_EQUIPMENT_ASSETS, AUTO_EQUIPMENT_ITEM_ASSET_KEYS, type EquipmentItemAssetKeys } from "./equipmentAssetRegistry";
import { GENERATED_EQUIPMENT_ASSETS, GENERATED_EQUIPMENT_ITEM_ASSET_KEYS, GENERATED_EQUIPMENT_ITEM_TUNING } from "./generated/equipmentItems.generated";
import {
  beginDebugUndoGroup,
  debugTuning,
  DEFAULT_BODY_ANIMATIONS,
  DEFAULT_EQUIPMENT,
  DEFAULT_EQUIPMENT_ITEM_TUNING,
  DEFAULT_FACE_PARTS,
  DEFAULT_RIG_PARTS,
  DEFAULT_SLASH_ARCS,
  defaultRigPartTuning,
  endDebugUndoGroup,
  RIG_PART_KEYS,
  subscribeDebugTuning,
  updateDebugTuning,
  type ArenaDebugTuning,
  type BodyAnimationKey,
  type BodyAnimationTuning,
  type DebugPopupPreviewKind,
  type EquipmentSlotKey,
  type EquipmentTuning,
  type FacePartTuning,
  type RigPartKey,
  type RigPartTuning,
  type SlashArcAttackKey,
  type SlashArcTuning,
} from "./debugTuning";
import { emitDebugCharacterEquipmentDelta, emitDebugCharacterEquipmentSelect } from "./debugCharacterEquipmentBridge";
import { getPlayerSettings, subscribePlayerSettings } from "./settingsMenu";
import { getShopHeroOffsetY, setShopHeroOffsetY, subscribeShopHeroOffset } from "./shopHeroOffset";
import { getStageLayout } from "./stageLayout";

type FighterPart = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  setAlpha: (alpha: number) => FighterPart;
  setVisible: (visible: boolean) => FighterPart;
  getWorldTransformMatrix: (
    tempMatrix?: Phaser.GameObjects.Components.TransformMatrix,
    parentMatrix?: Phaser.GameObjects.Components.TransformMatrix,
  ) => Phaser.GameObjects.Components.TransformMatrix;
};

type ShadowFilterTarget = FighterPart & {
  enableFilters?: () => ShadowFilterTarget;
  filters?: Phaser.Types.GameObjects.FiltersInternalExternal | null;
  setRenderFilters?: (value: boolean) => ShadowFilterTarget;
};

interface FighterVisual {
  body: FighterPart;
  head: FighterPart;
  eyeLeft: FighterPart;
  eyeRight: FighterPart;
  helmet: FighterPart;
  plume: FighterPart;
  sword: FighterPart;
  armFront: FighterPart;
  armBack: FighterPart;
  legFront: FighterPart;
  legBack: FighterPart;
  shadow: FighterPart;
  lowShadow: FighterPart;
  name: FighterPart;
  extraParts?: FighterPart[];
  movableParts?: FighterPart[];
  animatedParts?: FighterPart[];
  paperDollRig?: PaperDollRig;
  castsShadow: boolean;
  debugScale: number;
  bodyAnimationLockedUntil?: number;
  isShattered?: boolean;
  isShatterScheduled?: boolean;
}

type PaperDollPartKey = RigPartKey;
type AnimationRigPoseKey = "base" | "breath";
type AttackBodyAnimationKey = SlashArcAttackKey;
type PaperDollEquipmentAnchors = Partial<Record<PaperDollEquipmentSlotKey, FighterPart>>;
type PaperDollEquipmentLayerKey = "legs" | "torso" | "head" | "weapon" | "arms" | "weaponTop";
type PaperDollWeaponOverlayCrop = "mainTop" | "bowTop" | "bowBottom";

type PaperDollEquipmentLayers = Record<PaperDollEquipmentLayerKey, Phaser.GameObjects.Container>;

interface DebugRigPartDragState {
  partKeys: RigPartKey[];
  lastPointerX: number;
  lastPointerY: number;
}

interface DebugEquipmentDragState {
  slotKey: PaperDollEquipmentSlotKey;
  itemId: HeroItemId | "";
  lastPointerX: number;
  lastPointerY: number;
}

interface DebugInputEvent {
  stopPropagation: () => void;
}

interface CityShopHeroDragState {
  pointerId: number;
  lastScreenY: number;
}

type DebugRigPartPickHandler = (partKey: RigPartKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent) => void;
type DebugEquipmentPickHandler = (slotKey: PaperDollEquipmentSlotKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent) => void;

interface PaperDollRig {
  root: FighterPart;
  parts: Record<PaperDollPartKey, FighterPart>;
  equipment: PaperDollEquipment;
  equipmentAnchors: PaperDollEquipmentAnchors;
  equipmentState?: HeroEquipment;
  faceParts: PaperDollFaceParts;
  appearance: PaperDollAppearance;
  selectionHighlights?: Partial<Record<PaperDollPartKey, Phaser.GameObjects.Graphics>>;
  usesPlayerEquipment: boolean;
  shadow?: PaperDollShadowRig;
}

interface PaperDollShadowRig {
  root: FighterPart;
  parts: Record<PaperDollPartKey, FighterPart>;
  equipment: PaperDollEquipment;
  equipmentAnchors: PaperDollEquipmentAnchors;
  faceParts: PaperDollFaceParts;
}

interface PaperDollEquipment {
  weaponMain?: FighterPart;
  helmet?: FighterPart;
  breastplate?: FighterPart;
  backShoulderguard?: FighterPart;
  frontShoulderguard?: FighterPart;
  backWrist?: FighterPart;
  frontWrist?: FighterPart;
  backGlove?: FighterPart;
  frontGlove?: FighterPart;
  backGreave?: FighterPart;
  frontGreave?: FighterPart;
  backShinguard?: FighterPart;
  frontShinguard?: FighterPart;
  backBoot?: FighterPart;
  frontBoot?: FighterPart;
}

interface PaperDollFaceParts {
  eyeLeftCover?: FighterPart;
  eyeRightCover?: FighterPart;
  eyeLeft?: FighterPart;
  eyeRight?: FighterPart;
}

interface PaperDollAppearance {
  facing: 1 | -1;
  skin: number;
  skinDark: number;
  hair: number;
  muscle: number;
}

interface PaperDollFighterOptions {
  x: number;
  y: number;
  label: string;
  facing: 1 | -1;
  skin: number;
  skinDark: number;
  hair: number;
  muscle?: number;
  headAssetKey?: string;
  torsoAssetKey?: string;
  helmetAssetKey?: string;
  breastplateAssetKey?: string;
  backShoulderguardAssetKey?: string;
  frontShoulderguardAssetKey?: string;
  backWristAssetKey?: string;
  frontWristAssetKey?: string;
  backGloveAssetKey?: string;
  frontGloveAssetKey?: string;
  backGreaveAssetKey?: string;
  frontGreaveAssetKey?: string;
  backShinguardAssetKey?: string;
  frontShinguardAssetKey?: string;
  backBootAssetKey?: string;
  frontBootAssetKey?: string;
  bodyPartAssetKeys?: Partial<Record<PaperDollPartKey, string>>;
  weaponMainAssetKey?: string;
  equipment?: HeroEquipment;
  usesPlayerEquipment?: boolean;
  castsShadow?: boolean;
  enableSelectionHighlights?: boolean;
}

type PaperDollEquipmentSlotKey = HeroEquipmentSlotKey;

type PaperDollEquipmentAssetKeys = EquipmentItemAssetKeys;

type PaperDollEquipmentAssetKey = keyof PaperDollEquipmentAssetKeys;

interface HudVisual {
  hpFill: Phaser.GameObjects.Rectangle;
  armorFill: Phaser.GameObjects.Rectangle;
  staminaFill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface ArenaMidLayerShadeState {
  amount: number;
}

interface ArenaVisuals {
  player: FighterVisual;
  enemy: FighterVisual;
  playerHud: HudVisual;
  enemyHud: HudVisual;
}

interface ArenaLayers {
  back: Phaser.GameObjects.Container;
  mid: Phaser.GameObjects.Container;
  ground: Phaser.GameObjects.Container;
  actors: Phaser.GameObjects.Container;
  effects: Phaser.GameObjects.Container;
  midImage?: Phaser.GameObjects.Image;
  midShade: ArenaMidLayerShadeState;
  all: Phaser.GameObjects.Container[];
}

type ArenaLayerKey = "back" | "mid" | "ground" | "actors" | "effects";

interface ArenaLayerParallax {
  followX: number;
  followY: number;
  zoom: number;
  lookUpY: number;
}

interface ArenaLayerTransform {
  layer: Phaser.GameObjects.Container;
  x: number;
  y: number;
  scale: number;
}

type ArenaEntryTransitionState = "pending" | "running" | "done";

const ARENA_LAYER_PARALLAX: Record<ArenaLayerKey, ArenaLayerParallax> = {
  back: { followX: DEFAULT_ARENA_BACK_FOLLOW_X, followY: DEFAULT_ARENA_BACK_FOLLOW_Y, zoom: DEFAULT_ARENA_BACK_ZOOM, lookUpY: DEFAULT_ARENA_BACK_LOOK_UP_Y },
  mid: { followX: DEFAULT_ARENA_MID_FOLLOW_X, followY: DEFAULT_ARENA_MID_FOLLOW_Y, zoom: DEFAULT_ARENA_MID_ZOOM, lookUpY: DEFAULT_ARENA_MID_LOOK_UP_Y },
  ground: { followX: DEFAULT_ARENA_GROUND_FOLLOW_X, followY: DEFAULT_ARENA_GROUND_FOLLOW_Y, zoom: DEFAULT_ARENA_GROUND_ZOOM, lookUpY: DEFAULT_ARENA_GROUND_LOOK_UP_Y },
  actors: { followX: 1, followY: 1, zoom: 1, lookUpY: 0 },
  effects: { followX: 1, followY: 1, zoom: 1, lookUpY: 0 },
};

const ARENA_MID_LAYER_BASE_TINT = 0xb1a18f;
const ARENA_MID_LAYER_CLOSE_TINT = 0x6f5a49;
const ARENA_CAMERA_TWEEN_DURATION_MS = 560;
const ARENA_CAMERA_TWEEN_EASE = "Cubic.easeInOut";
const ARENA_ENTRY_TRANSITION_DURATION_MS = 850;
const ARENA_ENTRY_TRANSITION_EASE = "Cubic.easeInOut";
const ARENA_ENTRY_START_ZOOM_MULTIPLIER = 10;
const ARENA_ENTRY_START_CLOSENESS = 0.30;

const PAPER_DOLL_BASE_SCALE = 0.52;
const PAPER_DOLL_SHADOW_DEPTH = -1;
const PAPER_DOLL_SHADOW_COLOR = 0x120805;
const PAPER_DOLL_SHADOW_BLUR_QUALITY = 0;
const PAPER_DOLL_SHADOW_BLUR_STRENGTH = 0.75;
const PAPER_DOLL_SHADOW_BLUR_STEPS = 2;
const SLASH_ARC_DEPTH = 36;
const BLOCK_POPUP_SCREEN_SIZE = 88;
const DAMAGE_HIT_POPUP_SCREEN_SIZE = 112;
const DAMAGE_ARMOR_ABSORB_POPUP_SCREEN_SIZE = 108;
const DAMAGE_ARMOR_BREAK_POPUP_SCREEN_SIZE = 112;
const POPUP_PREVIEW_DAMAGE_AMOUNT = 10;
const POPUP_PREVIEW_ARMOR_ABSORB_AMOUNT = 7;
const POPUP_PREVIEW_SPACING_X = 54;
const paperDollShadowBlurFilters = new WeakMap<Phaser.GameObjects.GameObject, Phaser.Filters.Blur>();
const paperDollShadowBlurValues = new WeakMap<Phaser.GameObjects.GameObject, number>();
const paperDollLinkedEquipmentAnchors = new WeakMap<FighterPart, FighterPart[]>();
const paperDollLinkedEquipmentSlots = new WeakMap<FighterPart, FighterPart[]>();
const paperDollWeaponOverlayCrops = new WeakMap<FighterPart, PaperDollWeaponOverlayCrop>();
const DEFAULT_PAPER_DOLL_APPEARANCE: PaperDollAppearance = {
  facing: 1,
  skin: 0xefaa7b,
  skinDark: 0xd9854d,
  hair: 0x8b4a1f,
  muscle: 0x9b5a35,
};
const FIGHTER_MOVE_DURATION = 280;
const DEATH_SHATTER_DELAY = 260;
const HEAD_ASSET_DISPLAY_HEIGHT = 122;
const HEAD_ASSET_LOCAL_BOTTOM_Y = 14;
const HEAD_ASSET_ORIGIN_X = 312 / 623;
const HEAD_ASSET_ORIGIN_Y = 828 / 830;
const HEAD_FACE_EYE_Y = -41;
const HEAD_FACE_LEFT_EYE_X = -8.6;
const HEAD_FACE_RIGHT_EYE_X = 8.6;
const HEAD_FACE_EYE_WIDTH = 6.8;
const HEAD_FACE_EYE_HEIGHT = 14;
const HEAD_FACE_EYE_COVER_WIDTH = 18;
const HEAD_FACE_EYE_COVER_HEIGHT = 17;
const HEAD_FACE_EYE_WHITE = 0xfffbf2;
const HEAD_FACE_EYE_BLACK = 0x050201;
const TORSO_ASSET_DISPLAY_HEIGHT = 175;
const TORSO_ASSET_LOCAL_BOTTOM_Y = 8;
const TORSO_ASSET_ORIGIN_X = 626 / 1254;
const TORSO_ASSET_ORIGIN_Y = 998 / 1254;
const WEAPON_MAIN_DISPLAY_HEIGHT = 132;
const WEAPON_MAIN_ORIGIN_X = 0.5;
const WEAPON_MAIN_ORIGIN_Y = 0.9;
const WEAPON_MAIN_TOP_OVERLAY_CROP_RATIO = 0.66;
const WEAPON_BOW_TOP_OVERLAY_CROP_RATIO = 0.38;
const WEAPON_BOW_BOTTOM_OVERLAY_CROP_RATIO = 0.38;
const HELMET_DISPLAY_HEIGHT = 118;
const HELMET_LOCAL_X = 0;
const HELMET_LOCAL_Y = -64;
const HELMET_ORIGIN_X = 0.5;
const HELMET_ORIGIN_Y = 0.5;
const BREASTPLATE_DISPLAY_HEIGHT = 126;
const BREASTPLATE_LOCAL_X = 0;
const BREASTPLATE_LOCAL_Y = -56;
const BREASTPLATE_ORIGIN_X = 0.5;
const BREASTPLATE_ORIGIN_Y = 0.5;
const SHOULDERGUARD_DISPLAY_HEIGHT = 72;
const SHOULDERGUARD_LOCAL_X = 0;
const SHOULDERGUARD_LOCAL_Y = 16;
const SHOULDERGUARD_ORIGIN_X = 0.5;
const SHOULDERGUARD_ORIGIN_Y = 0.5;
const WRIST_DISPLAY_HEIGHT = 58;
const WRIST_LOCAL_X = 0;
const WRIST_LOCAL_Y = 10;
const WRIST_ORIGIN_X = 0.5;
const WRIST_ORIGIN_Y = 0.5;
const GLOVE_DISPLAY_HEIGHT = 54;
const GLOVE_LOCAL_X = 0;
const GLOVE_LOCAL_Y = 0;
const GLOVE_ORIGIN_X = 0.5;
const GLOVE_ORIGIN_Y = 0.5;
const GREAVE_DISPLAY_HEIGHT = 82;
const GREAVE_LOCAL_X = 0;
const GREAVE_LOCAL_Y = 26;
const GREAVE_ORIGIN_X = 0.5;
const GREAVE_ORIGIN_Y = 0.5;
const SHINGUARD_DISPLAY_HEIGHT = 76;
const SHINGUARD_LOCAL_X = 0;
const SHINGUARD_LOCAL_Y = 30;
const SHINGUARD_ORIGIN_X = 0.5;
const SHINGUARD_ORIGIN_Y = 0.5;
const BOOT_DISPLAY_HEIGHT = 42;
const BOOT_LOCAL_X = 14;
const BOOT_LOCAL_Y = 8;
const BOOT_ORIGIN_X = 0.5;
const BOOT_ORIGIN_Y = 0.5;
const ARMOR_PLACEHOLDER_FILL = 0x9aa4aa;
const ARMOR_PLACEHOLDER_DARK = 0x5f696e;
const ARMOR_PLACEHOLDER_HIGHLIGHT = 0xd7e0e4;
const ARMOR_PLACEHOLDER_OUTLINE = 0x24140d;
const DEBUG_CHARACTER_VIEWER_WIDTH = 430;
const DEBUG_CHARACTER_VIEWER_HEIGHT = 764;
const DEBUG_CHARACTER_CENTER_X = DEBUG_CHARACTER_VIEWER_WIDTH / 2;
const DEBUG_CHARACTER_FEET_Y = 690;
const SHOP_CHARACTER_PREVIEW_MARGIN_X = 22;
const SHOP_CHARACTER_PREVIEW_MARGIN_Y = 24;
const CITY_HERO_VIEWER_WIDTH = 240;
const CITY_HERO_VIEWER_HEIGHT = 360;
const CITY_HERO_SLOT_MIN_WIDTH = 150;
const CITY_HERO_SLOT_MAX_WIDTH = 190;
const CITY_HERO_SLOT_WIDTH_RATIO = 0.38;
const CITY_HERO_SLOT_BOTTOM = 82;
const CITY_HERO_CAMERA_VISUAL_WIDTH_RATIO = 0.62;
const CITY_CAMERA_DEFAULT_ZOOM = 1;
const CITY_CAMERA_ARMORY_ZOOM = 3.5;
const CITY_CAMERA_SHOP_MIN_ZOOM = 1.25;
const CITY_CAMERA_SHOP_MAX_SCREEN_HEIGHT_RATIO = 0.68;
const CITY_CAMERA_SHOP_MAX_SCREEN_WIDTH_RATIO = 0.78;
const CITY_CAMERA_SHOP_LOOK_UP_RATIO = 0.16;
const CITY_CAMERA_TWEEN_DURATION = 420;
const CITY_ARENA_TRANSITION_DURATION = 950;
const CITY_ARENA_TRANSITION_ZOOM = 2.7;
const CITY_ARENA_FOCUS_X_RATIO = 0.21;
const CITY_ARENA_FOCUS_Y_RATIO = 0;
const CITY_BACKGROUND_FADE_DURATION = 220;
const CITY_CAMERA_ARMORY_FOCUS_OFFSET_X = 24;
const CITY_CAMERA_ARMORY_FOCUS_OFFSET_Y = 15;
const CITY_ARMORY_HERO_LIFT_Y = 132;
const CITY_BACKGROUND_DEPTH = -30;
const CITY_CLOUD_DEPTH = CITY_BACKGROUND_DEPTH + 4;
const CITY_CLOUD_FADE_DURATION = 180;
const CITY_HERO_BODY_TINT = 0xf0b892;
const CITY_HERO_EQUIPMENT_TINT = 0xd3ad84;
const CITY_LIGHTING_TWEEN_DURATION = 260;
const HERO_PORTRAIT_VIEWER_SIZE = 112;
const HERO_PORTRAIT_CENTER_X = HERO_PORTRAIT_VIEWER_SIZE / 2;
const HERO_PORTRAIT_FEET_Y = 194;
const HERO_PORTRAIT_SCALE = 1.18;
const PAPER_DOLL_SELECTION_FILL = 0xffc857;
const PAPER_DOLL_SELECTION_STROKE = 0xfff1a8;

interface PaperDollPartAssetConfig {
  displayHeight: number;
  localX: number;
  localY: number;
  originX: number;
  originY: number;
}

interface PaperDollAssetLoadEntry {
  key: string;
  url: string;
}

const PAPER_DOLL_HEAD_ASSET_CONFIG: PaperDollPartAssetConfig = {
  displayHeight: HEAD_ASSET_DISPLAY_HEIGHT,
  localX: 0,
  localY: HEAD_ASSET_LOCAL_BOTTOM_Y,
  originX: HEAD_ASSET_ORIGIN_X,
  originY: HEAD_ASSET_ORIGIN_Y,
};

const PAPER_DOLL_TORSO_ASSET_CONFIG: PaperDollPartAssetConfig = {
  displayHeight: TORSO_ASSET_DISPLAY_HEIGHT,
  localX: 0,
  localY: TORSO_ASSET_LOCAL_BOTTOM_Y,
  originX: TORSO_ASSET_ORIGIN_X,
  originY: TORSO_ASSET_ORIGIN_Y,
};

const PAPER_DOLL_PART_ASSET_CONFIGS: Partial<Record<PaperDollPartKey, PaperDollPartAssetConfig>> = {
  backUpperArm: { displayHeight: 90, localX: 0, localY: -8, originX: 158 / 319, originY: 6 / 548 },
  backForearm: { displayHeight: 66, localX: 0, localY: -3, originX: 122 / 251, originY: 6 / 497 },
  backHand: { displayHeight: 68, localX: 0, localY: -3, originX: 630 / 1254, originY: 294 / 1254 },
  backThigh: { displayHeight: 78, localX: 0, localY: -9, originX: 158 / 319, originY: 6 / 548 },
  backShin: { displayHeight: 72, localX: 0, localY: -5, originX: 122 / 251, originY: 6 / 497 },
  backFoot: { displayHeight: 34, localX: -14, localY: 8, originX: 386 / 772, originY: 194 / 388 },
  frontUpperArm: { displayHeight: 90, localX: 0, localY: -8, originX: 160 / 322, originY: 6 / 546 },
  frontForearm: { displayHeight: 66, localX: 0, localY: -3, originX: 122 / 251, originY: 6 / 497 },
  frontHand: { displayHeight: 68, localX: 0, localY: -3, originX: 630 / 1254, originY: 294 / 1254 },
  frontThigh: { displayHeight: 78, localX: 0, localY: -9, originX: 160 / 322, originY: 6 / 546 },
  frontShin: { displayHeight: 72, localX: 0, localY: -5, originX: 122 / 251, originY: 6 / 497 },
  frontFoot: { displayHeight: 34, localX: 14, localY: 8, originX: 386 / 772, originY: 194 / 388 },
};

const DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS: Partial<Record<PaperDollPartKey, string>> = {
  backUpperArm: FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY,
  backForearm: FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY,
  backHand: FIGHTER_BACK_HAND_LIGHT_ASSET_KEY,
  backThigh: FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY,
  backShin: FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY,
  backFoot: FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY,
  frontUpperArm: FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY,
  frontForearm: FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY,
  frontHand: FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY,
  frontThigh: FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY,
  frontShin: FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY,
  frontFoot: FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY,
};

const DEFAULT_PLAYER_EQUIPMENT_ASSET_KEYS: PaperDollEquipmentAssetKeys = {
  weaponMainAssetKey: FIGHTER_WEAPON_SWORD_01_ASSET_KEY,
  helmetAssetKey: FIGHTER_HELMET_LIGHT_ASSET_KEY,
  breastplateAssetKey: FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY,
  backShoulderguardAssetKey: FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY,
  frontShoulderguardAssetKey: FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY,
  backWristAssetKey: FIGHTER_BACK_WRIST_LIGHT_ASSET_KEY,
  frontWristAssetKey: FIGHTER_FRONT_WRIST_LIGHT_ASSET_KEY,
  backGreaveAssetKey: FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY,
  frontGreaveAssetKey: FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY,
  backShinguardAssetKey: FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY,
  frontShinguardAssetKey: FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY,
  backBootAssetKey: FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY,
  frontBootAssetKey: FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY,
};

const PAPER_DOLL_EQUIPMENT_SLOT_KEYS = HERO_EQUIPMENT_SLOT_KEYS;
const PAPER_DOLL_DRAGGABLE_ARMOR_SLOT_KEYS = PAPER_DOLL_EQUIPMENT_SLOT_KEYS.filter((slotKey) => slotKey !== "weaponMain");

const PLAYER_EQUIPMENT_ASSET_KEY_BY_SLOT: Record<PaperDollEquipmentSlotKey, PaperDollEquipmentAssetKey> = {
  weaponMain: "weaponMainAssetKey",
  helmet: "helmetAssetKey",
  breastplate: "breastplateAssetKey",
  backShoulderguard: "backShoulderguardAssetKey",
  frontShoulderguard: "frontShoulderguardAssetKey",
  backWrist: "backWristAssetKey",
  frontWrist: "frontWristAssetKey",
  backGlove: "backGloveAssetKey",
  frontGlove: "frontGloveAssetKey",
  backGreave: "backGreaveAssetKey",
  frontGreave: "frontGreaveAssetKey",
  backShinguard: "backShinguardAssetKey",
  frontShinguard: "frontShinguardAssetKey",
  backBoot: "backBootAssetKey",
  frontBoot: "frontBootAssetKey",
};

const PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS: Record<PaperDollEquipmentSlotKey, PaperDollPartAssetConfig> = {
  weaponMain: {
    displayHeight: WEAPON_MAIN_DISPLAY_HEIGHT,
    localX: 0,
    localY: 0,
    originX: WEAPON_MAIN_ORIGIN_X,
    originY: WEAPON_MAIN_ORIGIN_Y,
  },
  helmet: {
    displayHeight: HELMET_DISPLAY_HEIGHT,
    localX: HELMET_LOCAL_X,
    localY: HELMET_LOCAL_Y,
    originX: HELMET_ORIGIN_X,
    originY: HELMET_ORIGIN_Y,
  },
  breastplate: {
    displayHeight: BREASTPLATE_DISPLAY_HEIGHT,
    localX: BREASTPLATE_LOCAL_X,
    localY: BREASTPLATE_LOCAL_Y,
    originX: BREASTPLATE_ORIGIN_X,
    originY: BREASTPLATE_ORIGIN_Y,
  },
  backShoulderguard: {
    displayHeight: SHOULDERGUARD_DISPLAY_HEIGHT,
    localX: SHOULDERGUARD_LOCAL_X,
    localY: SHOULDERGUARD_LOCAL_Y,
    originX: SHOULDERGUARD_ORIGIN_X,
    originY: SHOULDERGUARD_ORIGIN_Y,
  },
  frontShoulderguard: {
    displayHeight: SHOULDERGUARD_DISPLAY_HEIGHT,
    localX: SHOULDERGUARD_LOCAL_X,
    localY: SHOULDERGUARD_LOCAL_Y,
    originX: SHOULDERGUARD_ORIGIN_X,
    originY: SHOULDERGUARD_ORIGIN_Y,
  },
  backWrist: {
    displayHeight: WRIST_DISPLAY_HEIGHT,
    localX: WRIST_LOCAL_X,
    localY: WRIST_LOCAL_Y,
    originX: WRIST_ORIGIN_X,
    originY: WRIST_ORIGIN_Y,
  },
  frontWrist: {
    displayHeight: WRIST_DISPLAY_HEIGHT,
    localX: WRIST_LOCAL_X,
    localY: WRIST_LOCAL_Y,
    originX: WRIST_ORIGIN_X,
    originY: WRIST_ORIGIN_Y,
  },
  backGlove: {
    displayHeight: GLOVE_DISPLAY_HEIGHT,
    localX: GLOVE_LOCAL_X,
    localY: GLOVE_LOCAL_Y,
    originX: GLOVE_ORIGIN_X,
    originY: GLOVE_ORIGIN_Y,
  },
  frontGlove: {
    displayHeight: GLOVE_DISPLAY_HEIGHT,
    localX: GLOVE_LOCAL_X,
    localY: GLOVE_LOCAL_Y,
    originX: GLOVE_ORIGIN_X,
    originY: GLOVE_ORIGIN_Y,
  },
  backGreave: {
    displayHeight: GREAVE_DISPLAY_HEIGHT,
    localX: GREAVE_LOCAL_X,
    localY: GREAVE_LOCAL_Y,
    originX: GREAVE_ORIGIN_X,
    originY: GREAVE_ORIGIN_Y,
  },
  frontGreave: {
    displayHeight: GREAVE_DISPLAY_HEIGHT,
    localX: GREAVE_LOCAL_X,
    localY: GREAVE_LOCAL_Y,
    originX: GREAVE_ORIGIN_X,
    originY: GREAVE_ORIGIN_Y,
  },
  backShinguard: {
    displayHeight: SHINGUARD_DISPLAY_HEIGHT,
    localX: SHINGUARD_LOCAL_X,
    localY: SHINGUARD_LOCAL_Y,
    originX: SHINGUARD_ORIGIN_X,
    originY: SHINGUARD_ORIGIN_Y,
  },
  frontShinguard: {
    displayHeight: SHINGUARD_DISPLAY_HEIGHT,
    localX: SHINGUARD_LOCAL_X,
    localY: SHINGUARD_LOCAL_Y,
    originX: SHINGUARD_ORIGIN_X,
    originY: SHINGUARD_ORIGIN_Y,
  },
  backBoot: {
    displayHeight: BOOT_DISPLAY_HEIGHT,
    localX: -BOOT_LOCAL_X,
    localY: BOOT_LOCAL_Y,
    originX: BOOT_ORIGIN_X,
    originY: BOOT_ORIGIN_Y,
  },
  frontBoot: {
    displayHeight: BOOT_DISPLAY_HEIGHT,
    localX: BOOT_LOCAL_X,
    localY: BOOT_LOCAL_Y,
    originX: BOOT_ORIGIN_X,
    originY: BOOT_ORIGIN_Y,
  },
};
const PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS: Record<PaperDollEquipmentSlotKey, PaperDollPartKey> = {
  weaponMain: "backHand",
  helmet: "head",
  breastplate: "torso",
  backShoulderguard: "backUpperArm",
  frontShoulderguard: "frontUpperArm",
  backWrist: "backForearm",
  frontWrist: "frontForearm",
  backGlove: "backHand",
  frontGlove: "frontHand",
  backGreave: "backThigh",
  frontGreave: "frontThigh",
  backShinguard: "backShin",
  frontShinguard: "frontShin",
  backBoot: "backFoot",
  frontBoot: "frontFoot",
};
const paperDollEquipmentSlotConfigs = new WeakMap<FighterPart, PaperDollPartAssetConfig>();

const HERO_ITEM_EQUIPMENT_ASSET_KEYS: Partial<Record<HeroItemId, PaperDollEquipmentAssetKeys>> = {
  training_sword: { weaponMainAssetKey: FIGHTER_WEAPON_SWORD_01_ASSET_KEY },
  starter_helmet: { helmetAssetKey: FIGHTER_HELMET_LIGHT_ASSET_KEY },
  starter_breastplate: { breastplateAssetKey: FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY },
  [CLOTH_BREASTPLATE_ID]: { breastplateAssetKey: FIGHTER_BREASTPLATE_CLOTH_ASSET_KEY },
  starter_back_shoulderguard: { backShoulderguardAssetKey: FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY },
  starter_front_shoulderguard: { frontShoulderguardAssetKey: FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY },
  starter_back_wrist: { backWristAssetKey: FIGHTER_BACK_WRIST_LIGHT_ASSET_KEY },
  starter_front_wrist: { frontWristAssetKey: FIGHTER_FRONT_WRIST_LIGHT_ASSET_KEY },
  starter_back_greave: { backGreaveAssetKey: FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY },
  starter_front_greave: { frontGreaveAssetKey: FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY },
  starter_back_shinguard: { backShinguardAssetKey: FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY },
  starter_front_shinguard: { frontShinguardAssetKey: FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY },
  starter_back_boot: { backBootAssetKey: FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY },
  starter_front_boot: { frontBootAssetKey: FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY },
};

function getHeroItemEquipmentAssetKeys(itemId: HeroItemId): PaperDollEquipmentAssetKeys | undefined {
  return HERO_ITEM_EQUIPMENT_ASSET_KEYS[itemId] ?? GENERATED_EQUIPMENT_ITEM_ASSET_KEYS[itemId] ?? AUTO_EQUIPMENT_ITEM_ASSET_KEYS[itemId];
}

export type CityTimeOfDay = "night" | "day";

const PLAYER_EQUIPMENT_CHANGE_EVENT = "gladiator-player-equipment-change";
const CITY_TIME_OF_DAY_CHANGE_EVENT = "gladiator-city-time-of-day-change";

let readyCallback: ((scene: ArenaScene) => void) | undefined;
let cityReadyCallback: ((scene: CityHeroScene) => void) | undefined;
let activePlayerEquipment: HeroEquipment | undefined;
let activeCityTimeOfDay: CityTimeOfDay = "day";
let activePaperDollAssetsUseLowRes = false;
let arenaAssetPrewarmPromise: Promise<void> | undefined;
const arenaAssetPrewarmImages = new Set<HTMLImageElement>();

function part(gameObject: Phaser.GameObjects.GameObject): FighterPart {
  return gameObject as FighterPart;
}

function preloadArenaAssets(target: Phaser.Scene): void {
  target.load.image(ARENA_BACKGROUND_BACK_LAYER_ASSET_KEY, ARENA_BACKGROUND_BACK_LAYER_ASSET_URL);
  target.load.image(ARENA_BACKGROUND_MID_LAYER_ASSET_KEY, ARENA_BACKGROUND_MID_LAYER_ASSET_URL);
  target.load.image(ARENA_BACKGROUND_GROUND_LAYER_ASSET_KEY, ARENA_BACKGROUND_GROUND_LAYER_ASSET_URL);
  target.load.image(DAMAGE_BLOCK_ICON_ASSET_KEY, DAMAGE_BLOCK_ICON_ASSET_URL);
  target.load.image(DAMAGE_HIT_ICON_ASSET_KEY, DAMAGE_HIT_ICON_ASSET_URL);
  target.load.image(DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY, DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL);
  target.load.image(DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY, DAMAGE_ARMOR_BREAK_ICON_ASSET_URL);
}

export function prewarmArenaAssetsForBrowserCache(): Promise<void> {
  arenaAssetPrewarmPromise ??= Promise.all(getArenaAssetPrewarmUrls().map(prewarmImageUrl)).then(() => undefined);

  return arenaAssetPrewarmPromise;
}

function preloadCityAssets(target: Phaser.Scene): void {
  target.load.image(CITY_BACKGROUND_ASSET_KEY, CITY_BACKGROUND_ASSET_URL);
  target.load.image(CITY_DAY_BACKGROUND_ASSET_KEY, CITY_DAY_BACKGROUND_ASSET_URL);
  target.load.image(CITY_ARMORY_BACKGROUND_ASSET_KEY, CITY_ARMORY_BACKGROUND_ASSET_URL);
  target.load.image(CITY_WEAPON_SHOP_BACKGROUND_ASSET_KEY, CITY_WEAPON_SHOP_BACKGROUND_ASSET_URL);
  CITY_CLOUD_ASSETS.forEach((asset) => target.load.image(asset.key, asset.url));
}

function preloadPaperDollAssets(target: Phaser.Scene): void {
  activePaperDollAssetsUseLowRes = getPlayerSettings().lowEffects;
  const loadedAssetKeys = new Set<string>();

  getPaperDollAssetLoadEntries(activePaperDollAssetsUseLowRes).forEach((asset) => {
    const textureKey = asset.key;

    if (loadedAssetKeys.has(textureKey)) {
      return;
    }

    loadedAssetKeys.add(textureKey);
    target.load.image(textureKey, asset.url);
  });
}

function ensurePaperDollAssetResolution(
  target: Phaser.Scene,
  lowRes: boolean,
  fighters: Array<FighterVisual | undefined>,
  onSynced?: () => void,
): void {
  const missingAssets = getPaperDollAssetLoadEntries(lowRes).filter((asset) => !target.textures.exists(asset.key));
  const syncTextures = (): void => {
    activePaperDollAssetsUseLowRes = lowRes;
    fighters.forEach(syncFighterPaperDollTextureResolution);
    onSynced?.();
  };

  if (missingAssets.length === 0) {
    syncTextures();
    return;
  }

  target.load.once("complete", syncTextures);
  missingAssets.forEach((asset) => target.load.image(asset.key, asset.url));
  target.load.start();
}

function getPaperDollAssetLoadEntries(lowRes: boolean): PaperDollAssetLoadEntry[] {
  const entries = new Map<string, string>();

  [...FIGHTER_PAPER_DOLL_ASSETS, ...GENERATED_EQUIPMENT_ASSETS, ...AUTO_EQUIPMENT_ASSETS].forEach((asset) => {
    const key = getFighterTextureKey(asset.key, lowRes);
    const url = lowRes ? asset.lowUrl ?? asset.url : asset.url;

    entries.set(key, url);
  });

  return [...entries.entries()].map(([key, url]) => ({ key, url }));
}

function getArenaAssetPrewarmUrls(): string[] {
  return [
    ARENA_BACKGROUND_BACK_LAYER_ASSET_URL,
    ARENA_BACKGROUND_MID_LAYER_ASSET_URL,
    ARENA_BACKGROUND_GROUND_LAYER_ASSET_URL,
    DAMAGE_BLOCK_ICON_ASSET_URL,
    DAMAGE_HIT_ICON_ASSET_URL,
    DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL,
    DAMAGE_ARMOR_BREAK_ICON_ASSET_URL,
  ];
}

function prewarmImageUrl(url: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const image = new Image();
    const finish = () => {
      arenaAssetPrewarmImages.delete(image);
      resolve();
    };

    arenaAssetPrewarmImages.add(image);
    image.decoding = "async";
    image.loading = "eager";
    image.onload = finish;
    image.onerror = finish;
    image.src = url;
  });
}

function getActivePaperDollAssetKey(assetKey: string): string {
  return getFighterTextureKey(assetKey, activePaperDollAssetsUseLowRes);
}

function getActivePaperDollBodyPartAssetKeys(): Partial<Record<PaperDollPartKey, string>> {
  return Object.fromEntries(
    Object.entries(DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS).map(([partKey, assetKey]) => [partKey, getActivePaperDollAssetKey(assetKey)]),
  ) as Partial<Record<PaperDollPartKey, string>>;
}

function getActivePaperDollEquipmentAssetKeys<T extends Partial<PaperDollEquipmentAssetKeys>>(assetKeys: T): T {
  return Object.fromEntries(
    Object.entries(assetKeys).map(([slotKey, assetKey]) => [
      slotKey,
      typeof assetKey === "string" ? getActivePaperDollAssetKey(assetKey) : assetKey,
    ]),
  ) as T;
}

export function setPlayerEquipment(equipment: HeroEquipment): void {
  activePlayerEquipment = { ...equipment };
  notifyPlayerEquipmentChanged();
}

export function getCityTimeOfDay(): CityTimeOfDay {
  return activeCityTimeOfDay;
}

export function setCityTimeOfDay(timeOfDay: CityTimeOfDay): void {
  if (activeCityTimeOfDay === timeOfDay) {
    return;
  }

  activeCityTimeOfDay = timeOfDay;
  notifyCityTimeOfDayChanged();
}

function usePlayerEquipment(equipment: HeroEquipment | undefined): void {
  if (equipment) {
    setPlayerEquipment(equipment);
  }
}

function createPlayerEquipmentAssetKeys(equipment = activePlayerEquipment): PaperDollEquipmentAssetKeys {
  const defaultAssetKeys = getActivePaperDollEquipmentAssetKeys(DEFAULT_PLAYER_EQUIPMENT_ASSET_KEYS);

  if (!equipment) {
    return defaultAssetKeys;
  }

  return Object.values(equipment).reduce((assetKeys, itemId) => {
    if (!itemId) {
      return assetKeys;
    }

    const itemAssetKeys = getHeroItemEquipmentAssetKeys(itemId);

    return itemAssetKeys ? { ...assetKeys, ...getActivePaperDollEquipmentAssetKeys(itemAssetKeys) } : assetKeys;
  }, defaultAssetKeys);
}

function createPlayerEquipmentVisibility(equipment = activePlayerEquipment): Record<PaperDollEquipmentSlotKey, boolean> {
  if (!equipment) {
    return Object.fromEntries(PAPER_DOLL_EQUIPMENT_SLOT_KEYS.map((slotKey) => [slotKey, false])) as Record<PaperDollEquipmentSlotKey, boolean>;
  }

  return Object.fromEntries(
    PAPER_DOLL_EQUIPMENT_SLOT_KEYS.map((slotKey) => {
      const itemId = equipment[slotKey];
      const assetKey = PLAYER_EQUIPMENT_ASSET_KEY_BY_SLOT[slotKey];
      const hasVisualAsset = Boolean(itemId && getHeroItemEquipmentAssetKeys(itemId)?.[assetKey]);

      return [slotKey, hasVisualAsset];
    }),
  ) as Record<PaperDollEquipmentSlotKey, boolean>;
}

function notifyPlayerEquipmentChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(PLAYER_EQUIPMENT_CHANGE_EVENT));
}

function notifyCityTimeOfDayChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<CityTimeOfDay>(CITY_TIME_OF_DAY_CHANGE_EVENT, { detail: activeCityTimeOfDay }));
}

function subscribePlayerEquipmentChanges(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(PLAYER_EQUIPMENT_CHANGE_EVENT, callback);

  return () => window.removeEventListener(PLAYER_EQUIPMENT_CHANGE_EVENT, callback);
}

export function subscribeCityTimeOfDayChanges(callback: (timeOfDay: CityTimeOfDay) => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event) => callback(event instanceof CustomEvent ? (event.detail as CityTimeOfDay) : activeCityTimeOfDay);

  window.addEventListener(CITY_TIME_OF_DAY_CHANGE_EVENT, handler);

  return () => window.removeEventListener(CITY_TIME_OF_DAY_CHANGE_EVENT, handler);
}

export class ArenaScene extends Phaser.Scene {
  visuals?: ArenaVisuals;
  arenaLayers?: ArenaLayers;
  currentState?: CombatState;
  cameraFrameInitialized?: boolean;
  arenaEntryTransitionState: ArenaEntryTransitionState = "pending";
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;
  private unsubscribePlayerSettings?: () => void;

  constructor() {
    super("ArenaScene");
  }

  preload(): void {
    preloadArenaAssets(this);
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    syncArenaMainCamera(this);
    this.arenaLayers = createArenaLayers(this);
    drawArenaBackground(this, this.arenaLayers);
    this.visuals = buildVisuals(this);
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => {
      if (this.currentState) {
        renderScene(this, this.currentState);
      }
    });
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(() => syncFighterEquipmentVisibility(this.visuals?.player));
    this.unsubscribePlayerSettings = subscribePlayerSettings(() => {
      ensurePaperDollAssetResolution(this, getPlayerSettings().lowEffects, [this.visuals?.player, this.visuals?.enemy], () => {
        if (this.currentState) {
          renderScene(this, this.currentState);
        }
      });
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
      this.unsubscribePlayerSettings?.();
    });
    readyCallback?.(this);
  }

  update(time: number): void {
    const idle = getActiveBodyAnimation("idle");
    const animationAmount = getArenaAnimationAmount();

    if (!this.visuals || !idle.enabled || animationAmount <= 0) {
      return;
    }

    applyLoopingBodyAnimation(this.visuals.player, time, idle, animationAmount);
    applyLoopingBodyAnimation(this.visuals.enemy, time, idle, animationAmount);
  }

  sync(nextState: CombatState): Promise<void> {
    const previousState = this.currentState;

    this.currentState = nextState;

    if (!this.visuals) {
      return Promise.resolve();
    }

    const visuals = this.visuals;
    const actionAnimations: Promise<void>[] = [];

    syncEnemyVisualForState(this, visuals, previousState, nextState);
    resetDeathEffectsForLiveFighters(this, visuals, nextState);
    renderScene(this, nextState);

    const entryTransition = this.startArenaEntryTransition(nextState);

    if (entryTransition) {
      actionAnimations.push(entryTransition);
    }

    const lastPlayerAction = nextState.lastPlayerAction;
    const lastEnemyAction = nextState.lastEnemyAction;

    if (lastPlayerAction) {
      actionAnimations.push(animateAction(this, visuals.player, visuals.enemy, lastPlayerAction, "right", nextState.player.weaponClass));
    }

    if (lastEnemyAction) {
      actionAnimations.push(animateAction(this, visuals.enemy, visuals.player, lastEnemyAction, "left", nextState.enemy.weaponClass));
    }

    if (nextState.lastPlayerDamage > 0) {
      actionAnimations.push(playBodyAnimationOnce(this, visuals.enemy, getActiveBodyAnimation("hit")));
      showDamageResultPopupFromFighter(this, visuals.enemy, nextState.lastPlayerDamage, nextState.lastPlayerArmorAbsorbed, nextState.lastPlayerArmorBroken);
    } else if (nextState.lastPlayerBlocked) {
      actionAnimations.push(playBodyAnimationOnce(this, visuals.enemy, getActiveBodyAnimation("block")));
      showBlockPopupFromFighter(this, visuals.enemy);
    }

    if (nextState.lastEnemyDamage > 0) {
      actionAnimations.push(playBodyAnimationOnce(this, visuals.player, getActiveBodyAnimation("hit")));
      showDamageResultPopupFromFighter(this, visuals.player, nextState.lastEnemyDamage, nextState.lastEnemyArmorAbsorbed, nextState.lastEnemyArmorBroken);
    } else if (nextState.lastEnemyBlocked) {
      actionAnimations.push(playBodyAnimationOnce(this, visuals.player, getActiveBodyAnimation("block")));
      showBlockPopupFromFighter(this, visuals.player);
    }

    scheduleDeathEffects(this, nextState);

    return Promise.all(actionAnimations).then(() => undefined);
  }

  private startArenaEntryTransition(current: CombatState): Promise<void> | undefined {
    const layers = this.arenaLayers;

    if (this.arenaEntryTransitionState !== "pending") {
      return undefined;
    }

    if (isDebugTuningActive()) {
      this.arenaEntryTransitionState = "done";
      return undefined;
    }

    if (!layers) {
      return undefined;
    }

    this.arenaEntryTransitionState = "running";

    const debug = getActiveDebugTuning();
    const finalTarget = getCameraTarget(current, debug, getArenaViewport(this));
    const startTarget = getArenaEntryStartCameraTarget(finalTarget);

    killArenaTransformTweens(this, layers);
    applyArenaTransform(layers, startTarget, debug);

    return tweenArenaTransform(this, layers, finalTarget, ARENA_ENTRY_TRANSITION_DURATION_MS, ARENA_ENTRY_TRANSITION_EASE, debug)
      .then(() => {
        if (!this.currentState) {
          return;
        }

        const currentDebug = getActiveDebugTuning();
        applyArenaTransform(layers, getCameraTarget(this.currentState, currentDebug, getArenaViewport(this)), currentDebug);
      })
      .finally(() => {
        this.arenaEntryTransitionState = "done";
      });
  }

  previewSlashArc(actionId: SlashArcAttackKey, withBodyAnimation: boolean): void {
    if (!this.visuals) {
      return;
    }

    if (withBodyAnimation) {
      animateAction(this, this.visuals.player, this.visuals.enemy, actionId, "right");
      return;
    }

    showSlashArc(this, this.visuals.player, actionId, "right");
  }

  previewPopup(kind: DebugPopupPreviewKind): void {
    if (!this.visuals) {
      return;
    }

    showPopupPreviewFromFighter(this, this.visuals.enemy, kind);
  }
}

export function launchArena(onReady: (scene: ArenaScene) => void, _onAction: (actionId: ActionId) => void, playerEquipment?: HeroEquipment): () => void {
  void _onAction;
  usePlayerEquipment(playerEquipment);
  readyCallback = onReady;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "game",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
    scene: ArenaScene,
  };

  const game = new Phaser.Game(config);

  return () => {
    readyCallback = undefined;
    game.destroy(true);
  };
}

type CityCameraMode = "default" | "armory" | "weaponShop" | "arena";

interface CityHeroLayout {
  feetX: number;
  feetY: number;
  scale: number;
}

interface CityCloud {
  image: Phaser.GameObjects.Image;
  speed: number;
  xRatio: number;
  yRatio: number;
  scaleRatio: number;
  alpha: number;
  direction: 1 | -1;
  initialized: boolean;
}

export interface CitySceneApi {
  focusDefault: (instant?: boolean) => void;
  focusArmory: (instant?: boolean) => void;
  focusWeaponShop: (instant?: boolean) => void;
  focusArenaTransition: () => Promise<void>;
  destroy: () => void;
}

function getCityDefaultBackgroundAssetKey(timeOfDay = activeCityTimeOfDay): string {
  return timeOfDay === "day" ? CITY_DAY_BACKGROUND_ASSET_KEY : CITY_BACKGROUND_ASSET_KEY;
}

function getCityLightingAmount(timeOfDay = activeCityTimeOfDay): number {
  return timeOfDay === "day" ? 0 : 1;
}

class CityHeroScene extends Phaser.Scene {
  private background?: Phaser.GameObjects.Image;
  private backgroundNext?: Phaser.GameObjects.Image;
  private backgroundFadeTween?: Phaser.Tweens.Tween;
  private clouds: CityCloud[] = [];
  private cloudsAlphaTween?: Phaser.Tweens.Tween;
  private fighter?: FighterVisual;
  private heroCamera?: Phaser.Cameras.Scene2D.Camera;
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;
  private unsubscribePlayerSettings?: () => void;
  private unsubscribeShopHeroOffset?: () => void;
  private unsubscribeCityTimeOfDay?: () => void;
  private cameraMode: CityCameraMode = "default";
  private backgroundAssetKey = getCityDefaultBackgroundAssetKey();
  private cityCloudVisibility = 1;
  private cityLightingAmount = getCityLightingAmount();
  private cityLightingTween?: Phaser.Tweens.Tween;
  private cityHeroLiftProgress = 0;
  private cityHeroLiftTween?: Phaser.Tweens.Tween;
  private shopHeroDragState?: CityShopHeroDragState;

  constructor() {
    super("CityHeroScene");
  }

  preload(): void {
    preloadCityAssets(this);
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.heroCamera = this.cameras.add(0, 0, this.sceneWidth, this.sceneHeight, false, "CityHeroCamera");
    this.heroCamera.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.backgroundAssetKey = getCityDefaultBackgroundAssetKey();
    this.cityLightingAmount = getCityLightingAmount();
    this.background = this.add.image(0, 0, this.backgroundAssetKey).setOrigin(0.5).setDepth(CITY_BACKGROUND_DEPTH);
    this.backgroundNext = this.add.image(0, 0, this.backgroundAssetKey).setOrigin(0.5).setDepth(CITY_BACKGROUND_DEPTH + 1).setAlpha(0).setVisible(false);
    this.clouds = this.createCityClouds();
    this.fighter = createPaperDollFighter(
      this,
      { ...createPlayerPaperDollOptions(0, -PLAYER_AVATAR_FEET_Y_OFFSET), castsShadow: true },
    );
    this.fighter.name.setVisible(false);
    enableCityShopHeroDrag(this.fighter.paperDollRig, (pointer, event) => this.beginShopHeroDrag(pointer, event));
    applyCityHeroLighting(this.fighter, this.cityLightingAmount);
    this.syncCameraLayers();
    this.sync();
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => this.sync());
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(() => this.sync());
    this.unsubscribePlayerSettings = subscribePlayerSettings(() => {
      ensurePaperDollAssetResolution(this, getPlayerSettings().lowEffects, [this.fighter], () => {
        if (this.fighter) {
          applyCityHeroLighting(this.fighter, this.cityLightingAmount);
        }
        this.sync();
      });
    });
    this.unsubscribeShopHeroOffset = subscribeShopHeroOffset(() => this.syncCamera(true));
    this.unsubscribeCityTimeOfDay = subscribeCityTimeOfDayChanges((timeOfDay) => this.syncTimeOfDay(timeOfDay));
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.dragShopHero(pointer));
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.endShopHeroDrag(pointer));
    this.input.on("pointerupoutside", (pointer: Phaser.Input.Pointer) => this.endShopHeroDrag(pointer));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cityHeroLiftTween?.remove();
      this.backgroundFadeTween?.remove();
      this.cloudsAlphaTween?.remove();
      this.cityLightingTween?.remove();
      this.heroCamera = undefined;
      this.shopHeroDragState = undefined;
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
      this.unsubscribePlayerSettings?.();
      this.unsubscribeShopHeroOffset?.();
      this.unsubscribeCityTimeOfDay?.();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
    cityReadyCallback?.(this);
  }

  update(time: number, delta: number): void {
    this.updateCityClouds(delta);

    const idle = getActiveBodyAnimation("idle");

    if (!this.fighter || !idle.enabled) {
      return;
    }

    applyBodyAnimation(this.fighter, time, idle);
  }

  focusDefault(instant = false): void {
    this.cameraMode = "default";
    this.endShopHeroDrag();
    this.resetBackgroundCamera();
    this.getHeroCamera().setAlpha(1);
    this.setCityHeroShadowEnabled(true);
    this.transitionBackgroundTo(getCityDefaultBackgroundAssetKey(), instant);
    this.transitionCityCloudsTo(1, instant);
    this.tweenHeroLiftTo(0, instant);
    this.syncCamera(instant, 0);
  }

  focusArmory(instant = false): void {
    this.cameraMode = "armory";
    this.setCityHeroShadowEnabled(false);
    this.transitionBackgroundTo(CITY_ARMORY_BACKGROUND_ASSET_KEY, instant);
    this.transitionCityCloudsTo(0, instant);
    this.tweenHeroLiftTo(1, instant);
    this.syncCamera(instant, 1);
  }

  focusWeaponShop(instant = false): void {
    this.cameraMode = "weaponShop";
    this.setCityHeroShadowEnabled(false);
    this.transitionBackgroundTo(CITY_WEAPON_SHOP_BACKGROUND_ASSET_KEY, instant);
    this.transitionCityCloudsTo(0, instant);
    this.tweenHeroLiftTo(1, instant);
    this.syncCamera(instant, 1);
  }

  focusArenaTransition(): Promise<void> {
    this.cameraMode = "arena";
    this.endShopHeroDrag();
    this.cityHeroLiftTween?.remove();
    this.cityHeroLiftTween = undefined;
    this.setCityHeroShadowEnabled(false);
    this.transitionBackgroundTo(getCityDefaultBackgroundAssetKey(), true);
    this.transitionCityCloudsTo(0);

    return this.tweenArenaCameraToColiseum();
  }

  private sync(): void {
    const fighter = this.fighter;

    if (!fighter) {
      return;
    }

    this.syncBackground();
    this.syncCityClouds();
    this.syncCameraViewports();
    this.syncFighterLayout();
    applyCityHeroLighting(fighter, this.cityLightingAmount);
    this.syncCamera(true);
  }

  private syncTimeOfDay(timeOfDay: CityTimeOfDay, instant = false): void {
    if (this.cameraMode === "default" || this.cameraMode === "arena") {
      this.transitionBackgroundTo(getCityDefaultBackgroundAssetKey(timeOfDay), instant);
    }
    this.transitionCityLightingTo(getCityLightingAmount(timeOfDay), instant);
  }

  private transitionCityLightingTo(amount: number, instant = false): void {
    this.cityLightingTween?.remove();
    this.cityLightingTween = undefined;

    if (instant || !this.fighter) {
      this.cityLightingAmount = amount;
      if (this.fighter) {
        applyCityHeroLighting(this.fighter, this.cityLightingAmount);
      }
      return;
    }

    if (Math.abs(this.cityLightingAmount - amount) < 0.01) {
      this.cityLightingAmount = amount;
      applyCityHeroLighting(this.fighter, this.cityLightingAmount);
      return;
    }

    this.cityLightingTween = this.tweens.add({
      targets: this,
      cityLightingAmount: amount,
      duration: CITY_LIGHTING_TWEEN_DURATION,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        if (this.fighter) {
          applyCityHeroLighting(this.fighter, this.cityLightingAmount);
        }
      },
      onComplete: () => {
        this.cityLightingAmount = amount;
        this.cityLightingTween = undefined;
        if (this.fighter) {
          applyCityHeroLighting(this.fighter, this.cityLightingAmount);
        }
      },
    });
  }

  private syncFighterLayout(): void {
    if (!this.fighter) {
      return;
    }
    const layout = this.getHeroLayout();

    applyPaperDollRigTuning(this.fighter, layout.scale, layout.feetY, layout.feetX);
  }

  private setCityHeroShadowEnabled(enabled: boolean): void {
    if (!this.fighter) {
      return;
    }

    this.fighter.castsShadow = enabled;
    syncFighterShadowVisibility(this.fighter, 1);
  }

  private handleResize(): void {
    this.sync();
  }

  private syncBackground(): void {
    if (!this.background) {
      return;
    }

    if (!this.backgroundFadeTween && this.background.texture.key !== this.backgroundAssetKey) {
      this.background.setTexture(this.backgroundAssetKey);
    }

    this.syncBackgroundImage(this.background, this.backgroundAssetKey);
    if (this.backgroundNext?.visible) {
      this.syncBackgroundImage(this.backgroundNext, this.backgroundNext.texture.key);
    }
  }

  private transitionBackgroundTo(assetKey: string, instant = false): void {
    if (instant) {
      this.backgroundFadeTween?.remove();
      this.backgroundFadeTween = undefined;
      this.backgroundAssetKey = assetKey;
      this.background?.setTexture(assetKey).setAlpha(1).setVisible(true);
      this.backgroundNext?.setVisible(false).setAlpha(0);
      this.syncBackground();
      return;
    }

    if (assetKey === this.backgroundAssetKey) {
      this.backgroundFadeTween?.remove();
      this.backgroundFadeTween = undefined;
      this.backgroundNext?.setVisible(false).setAlpha(0);
      this.background?.setTexture(assetKey).setAlpha(1);
      this.syncBackground();
      return;
    }

    if (!this.background || !this.backgroundNext) {
      this.backgroundAssetKey = assetKey;
      this.syncBackground();
      return;
    }

    this.backgroundFadeTween?.remove();
    this.backgroundFadeTween = undefined;
    this.background.setTexture(this.backgroundAssetKey).setAlpha(1).setVisible(true);
    this.backgroundNext.setTexture(assetKey).setAlpha(0).setVisible(true);
    this.syncBackgroundImage(this.background, this.backgroundAssetKey);
    this.syncBackgroundImage(this.backgroundNext, assetKey);

    this.backgroundFadeTween = this.tweens.add({
      targets: this.backgroundNext,
      alpha: 1,
      duration: CITY_BACKGROUND_FADE_DURATION,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.backgroundAssetKey = assetKey;
        this.background?.setTexture(assetKey).setAlpha(1).setVisible(true);
        this.backgroundNext?.setVisible(false).setAlpha(0);
        this.backgroundFadeTween = undefined;
        this.syncBackground();
      },
    });
  }

  private syncBackgroundImage(background: Phaser.GameObjects.Image, assetKey: string): void {
    const texture = this.textures.get(assetKey);
    const source = texture.getSourceImage() as { width?: number; height?: number };
    const sourceWidth = source.width || this.sceneWidth;
    const sourceHeight = source.height || this.sceneHeight;
    const scale = Math.max(this.sceneWidth / sourceWidth, this.sceneHeight / sourceHeight);

    background.setPosition(this.sceneWidth / 2, this.sceneHeight / 2);
    background.setScale(scale);
  }

  private createCityClouds(): CityCloud[] {
    const presets: Array<Omit<CityCloud, "image" | "initialized">> = [
      { speed: 5.2, xRatio: 0.18, yRatio: 0.11, scaleRatio: 0.55, alpha: 0.42, direction: 1 },
      { speed: 3.4, xRatio: 0.72, yRatio: 0.18, scaleRatio: 0.72, alpha: 0.34, direction: -1 },
      { speed: 4.1, xRatio: 0.42, yRatio: 0.27, scaleRatio: 0.48, alpha: 0.28, direction: 1 },
      { speed: 2.8, xRatio: 0.95, yRatio: 0.22, scaleRatio: 0.64, alpha: 0.24, direction: -1 },
    ];

    return CITY_CLOUD_ASSETS.map((asset, index) => {
      const preset = presets[index % presets.length]!;
      const image = this.add.image(0, 0, asset.key).setOrigin(0.5).setDepth(CITY_CLOUD_DEPTH + index).setAlpha(preset.alpha);

      return { ...preset, image, initialized: false };
    });
  }

  private syncCityClouds(): void {
    const width = this.sceneWidth;
    const height = this.sceneHeight;

    this.clouds.forEach((cloud) => {
      const source = cloud.image.texture.getSourceImage() as { width?: number; height?: number };
      const sourceWidth = source.width || 1;
      const targetWidth = width * cloud.scaleRatio;

      cloud.image.setScale(targetWidth / sourceWidth);
      cloud.image.y = height * cloud.yRatio;
      if (!cloud.initialized) {
        cloud.image.x = width * cloud.xRatio;
        cloud.initialized = true;
      }
    });
    this.applyCityCloudVisibility();
  }

  private updateCityClouds(delta: number): void {
    if (this.clouds.length === 0) {
      return;
    }

    const deltaSeconds = Math.min(0.05, delta / 1000);
    const width = this.sceneWidth;

    this.clouds.forEach((cloud) => {
      const halfWidth = cloud.image.displayWidth / 2;
      const padding = Math.max(18, width * 0.08);

      cloud.image.x += cloud.speed * cloud.direction * deltaSeconds;
      if (cloud.direction > 0 && cloud.image.x - halfWidth > width + padding) {
        cloud.image.x = -halfWidth - padding;
      } else if (cloud.direction < 0 && cloud.image.x + halfWidth < -padding) {
        cloud.image.x = width + halfWidth + padding;
      }
    });
  }

  private transitionCityCloudsTo(visibility: number, instant = false): void {
    if (instant) {
      this.cloudsAlphaTween?.remove();
      this.cloudsAlphaTween = undefined;
      this.cityCloudVisibility = visibility;
      if (visibility > 0) {
        this.clouds.forEach((cloud) => cloud.image.setVisible(true));
      }
      this.applyCityCloudVisibility();
      return;
    }

    if (Math.abs(this.cityCloudVisibility - visibility) < 0.01) {
      this.cityCloudVisibility = visibility;
      this.applyCityCloudVisibility();
      return;
    }

    if (visibility > 0) {
      this.clouds.forEach((cloud) => cloud.image.setVisible(true));
    }
    this.cloudsAlphaTween?.remove();
    this.cloudsAlphaTween = this.tweens.add({
      targets: this,
      cityCloudVisibility: visibility,
      duration: CITY_CLOUD_FADE_DURATION,
      ease: "Sine.easeInOut",
      onUpdate: () => this.applyCityCloudVisibility(),
      onComplete: () => {
        this.cityCloudVisibility = visibility;
        this.cloudsAlphaTween = undefined;
        this.applyCityCloudVisibility();
      },
    });
  }

  private applyCityCloudVisibility(): void {
    this.clouds.forEach((cloud) => {
      const alpha = cloud.alpha * this.cityCloudVisibility;

      cloud.image.setAlpha(alpha);
      cloud.image.setVisible(alpha > 0.01);
    });
  }

  private syncCameraLayers(): void {
    if (!this.background || !this.backgroundNext || !this.fighter || !this.heroCamera) {
      return;
    }

    this.cameras.main.ignore(getFighterParts(this.fighter) as unknown as Phaser.GameObjects.GameObject[]);
    this.heroCamera.ignore([this.background, this.backgroundNext, ...this.clouds.map((cloud) => cloud.image)]);
  }

  private syncCameraViewports(): void {
    const width = this.sceneWidth;
    const height = this.sceneHeight;
    const backgroundCamera = this.cameras.main;
    const heroCamera = this.getHeroCamera();

    backgroundCamera.setViewport(0, 0, width, height);
    backgroundCamera.setBounds(0, 0, width, height);
    backgroundCamera.setZoom(CITY_CAMERA_DEFAULT_ZOOM);
    backgroundCamera.centerOn(width / 2, height / 2);

    heroCamera.setViewport(0, 0, width, height);
    heroCamera.setBounds(0, 0, width, height);
  }

  private tweenHeroLiftTo(progress: number, instant = false): void {
    this.cityHeroLiftTween?.remove();

    if (instant) {
      this.cityHeroLiftProgress = progress;
      this.cityHeroLiftTween = undefined;
      this.syncFighterLayout();
      return;
    }

    this.cityHeroLiftTween = this.tweens.add({
      targets: this,
      cityHeroLiftProgress: progress,
      duration: CITY_CAMERA_TWEEN_DURATION,
      ease: "Sine.easeInOut",
      onUpdate: () => this.syncFighterLayout(),
      onComplete: () => {
        this.cityHeroLiftProgress = progress;
        this.cityHeroLiftTween = undefined;
        this.syncFighterLayout();
      },
    });
  }

  private syncCamera(instant: boolean, targetLiftProgress = this.cityHeroLiftProgress): void {
    const camera = this.getHeroCamera();
    const duration = instant ? 0 : CITY_CAMERA_TWEEN_DURATION;
    const layout = this.getHeroLayout(targetLiftProgress);

    if (this.cameraMode === "arena") {
      return;
    }

    if (this.cameraMode !== "default") {
      const shopZoom = this.getShopCameraZoom(layout);
      const shopOffsetY = getShopHeroOffsetY();
      const targetX = layout.feetX + CITY_CAMERA_ARMORY_FOCUS_OFFSET_X * Math.max(0.7, layout.scale);
      const targetY =
        layout.feetY -
        CITY_CAMERA_ARMORY_FOCUS_OFFSET_Y * Math.max(0.7, layout.scale) -
        CITY_HERO_VIEWER_HEIGHT * layout.scale * CITY_CAMERA_SHOP_LOOK_UP_RATIO -
        shopOffsetY / shopZoom;

      if (instant) {
        camera.setZoom(shopZoom);
        camera.centerOn(targetX, targetY);
        return;
      }

      camera.pan(targetX, targetY, duration, "Cubic.easeOut");
      camera.zoomTo(shopZoom, duration, "Cubic.easeOut");
      return;
    }

    if (instant) {
      camera.setZoom(CITY_CAMERA_DEFAULT_ZOOM);
      camera.centerOn(this.sceneWidth / 2, this.sceneHeight / 2);
      return;
    }

    camera.pan(this.sceneWidth / 2, this.sceneHeight / 2, duration, "Sine.easeInOut");
    camera.zoomTo(CITY_CAMERA_DEFAULT_ZOOM, duration, "Sine.easeInOut");
  }

  private getHeroCamera(): Phaser.Cameras.Scene2D.Camera {
    return this.heroCamera ?? this.cameras.main;
  }

  private resetBackgroundCamera(): void {
    const camera = this.cameras.main;

    this.tweens.killTweensOf(camera);
    camera.setZoom(CITY_CAMERA_DEFAULT_ZOOM);
    camera.centerOn(this.sceneWidth / 2, this.sceneHeight / 2);
  }

  private tweenArenaCameraToColiseum(): Promise<void> {
    const camera = this.cameras.main;
    const focusX = this.sceneWidth * CITY_ARENA_FOCUS_X_RATIO;
    const focusY = this.sceneHeight * CITY_ARENA_FOCUS_Y_RATIO;
    const zoom = CITY_ARENA_TRANSITION_ZOOM;
    const targetScrollX = focusX - this.sceneWidth / (2 * zoom);
    const targetScrollY = focusY - this.sceneHeight / (2 * zoom);

    this.tweens.killTweensOf(camera);
    this.tweens.killTweensOf(this.getHeroCamera());
    this.getHeroCamera().setAlpha(1);

    return new Promise((resolve) => {
      this.tweens.add({
        targets: camera,
        zoom,
        scrollX: targetScrollX,
        scrollY: targetScrollY,
        duration: CITY_ARENA_TRANSITION_DURATION,
        ease: "Cubic.easeInOut",
        onComplete: () => resolve(),
      });
      this.tweens.add({
        targets: this.getHeroCamera(),
        alpha: 0.18,
        duration: CITY_ARENA_TRANSITION_DURATION,
        ease: "Sine.easeInOut",
      });
    });
  }

  private beginShopHeroDrag(pointer: Phaser.Input.Pointer, event?: DebugInputEvent): void {
    if (this.cameraMode === "default" || !isPrimaryPointerDown(pointer)) {
      return;
    }

    event?.stopPropagation();
    this.shopHeroDragState = {
      pointerId: getPointerId(pointer),
      lastScreenY: pointer.y,
    };
  }

  private dragShopHero(pointer: Phaser.Input.Pointer): void {
    if (!this.shopHeroDragState || this.cameraMode === "default" || getPointerId(pointer) !== this.shopHeroDragState.pointerId) {
      return;
    }

    const deltaY = pointer.y - this.shopHeroDragState.lastScreenY;

    if (Math.abs(deltaY) < 0.1) {
      return;
    }

    setShopHeroOffsetY(getShopHeroOffsetY() + deltaY);
    this.shopHeroDragState.lastScreenY = pointer.y;
  }

  private endShopHeroDrag(pointer?: Phaser.Input.Pointer): void {
    if (pointer && this.shopHeroDragState && getPointerId(pointer) !== this.shopHeroDragState.pointerId) {
      return;
    }

    this.shopHeroDragState = undefined;
  }

  private getShopCameraZoom(layout: CityHeroLayout): number {
    const visualHeight = Math.max(1, CITY_HERO_VIEWER_HEIGHT * layout.scale);
    const visualWidth = Math.max(1, CITY_HERO_VIEWER_WIDTH * CITY_HERO_CAMERA_VISUAL_WIDTH_RATIO * layout.scale);
    const heightZoomLimit = (this.sceneHeight * CITY_CAMERA_SHOP_MAX_SCREEN_HEIGHT_RATIO) / visualHeight;
    const widthZoomLimit = (this.sceneWidth * CITY_CAMERA_SHOP_MAX_SCREEN_WIDTH_RATIO) / visualWidth;

    return clampNumber(
      Math.min(CITY_CAMERA_ARMORY_ZOOM, heightZoomLimit, widthZoomLimit),
      CITY_CAMERA_SHOP_MIN_ZOOM,
      CITY_CAMERA_ARMORY_ZOOM,
    );
  }

  private getHeroLayout(liftProgress = this.cityHeroLiftProgress): CityHeroLayout {
    const slotWidth = clampNumber(this.sceneWidth * CITY_HERO_SLOT_WIDTH_RATIO, CITY_HERO_SLOT_MIN_WIDTH, CITY_HERO_SLOT_MAX_WIDTH);
    const slotScale = slotWidth / CITY_HERO_VIEWER_WIDTH;
    const slotHeight = CITY_HERO_VIEWER_HEIGHT * slotScale;
    const slotBottom = Math.max(CITY_HERO_SLOT_BOTTOM, this.sceneHeight * 0.09);
    const slotLeft = this.sceneWidth / 2 - slotWidth / 2;
    const slotTop = this.sceneHeight - slotBottom - slotHeight;

    return {
      feetX: slotLeft + debugTuning.cityHeroX * slotScale,
      feetY: slotTop + debugTuning.cityHeroY * slotScale - CITY_ARMORY_HERO_LIFT_Y * liftProgress,
      scale: debugTuning.cityHeroScale * slotScale,
    };
  }

  private get sceneWidth(): number {
    return Math.max(1, this.scale.width || GAME_WIDTH);
  }

  private get sceneHeight(): number {
    return Math.max(1, this.scale.height || GAME_HEIGHT);
  }
}

export function mountCityHeroPreview(parent: HTMLElement, playerEquipment?: HeroEquipment): CitySceneApi {
  usePlayerEquipment(playerEquipment);
  let scene: CityHeroScene | undefined;
  let pendingCameraMode: CityCameraMode = "default";

  const readyCallbackForGame = (readyScene: CityHeroScene) => {
    scene = readyScene;
    if (pendingCameraMode === "armory") {
      readyScene.focusArmory();
      return;
    }

    if (pendingCameraMode === "weaponShop") {
      readyScene.focusWeaponShop();
      return;
    }

    readyScene.focusDefault();
  };
  cityReadyCallback = readyCallbackForGame;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(1, parent.clientWidth || GAME_WIDTH),
    height: Math.max(1, parent.clientHeight || GAME_HEIGHT),
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
    scene: CityHeroScene,
  });

  return {
    focusDefault: (instant = false) => {
      pendingCameraMode = "default";
      scene?.focusDefault(instant);
    },
    focusArmory: (instant = false) => {
      pendingCameraMode = "armory";
      scene?.focusArmory(instant);
    },
    focusWeaponShop: (instant = false) => {
      pendingCameraMode = "weaponShop";
      scene?.focusWeaponShop(instant);
    },
    focusArenaTransition: () => scene?.focusArenaTransition() ?? Promise.resolve(),
    destroy: () => {
      if (cityReadyCallback === readyCallbackForGame) {
        cityReadyCallback = undefined;
      }
      scene = undefined;
      game.destroy(true);
    },
  };
}

class HeroPortraitScene extends Phaser.Scene {
  private fighter?: FighterVisual;
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;
  private unsubscribePlayerSettings?: () => void;

  constructor() {
    super("HeroPortraitScene");
  }

  preload(): void {
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.fighter = createPaperDollFighter(this, { ...createPlayerPaperDollOptions(HERO_PORTRAIT_CENTER_X, 0), castsShadow: false });
    this.fighter.name.setVisible(false);
    this.sync();
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => this.sync());
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(() => this.sync());
    this.unsubscribePlayerSettings = subscribePlayerSettings(() => {
      ensurePaperDollAssetResolution(this, getPlayerSettings().lowEffects, [this.fighter], () => this.sync());
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
      this.unsubscribePlayerSettings?.();
    });
  }

  update(time: number): void {
    const idle = getActiveBodyAnimation("idle");

    if (!this.fighter || !idle.enabled) {
      return;
    }

    applyBodyAnimation(this.fighter, time, idle);
  }

  private sync(): void {
    if (!this.fighter) {
      return;
    }

    applyPaperDollRigTuning(this.fighter, HERO_PORTRAIT_SCALE, HERO_PORTRAIT_FEET_Y, HERO_PORTRAIT_CENTER_X);
  }
}

export function mountHeroPortraitPreview(parent: HTMLElement, playerEquipment?: HeroEquipment): () => void {
  usePlayerEquipment(playerEquipment);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: HERO_PORTRAIT_VIEWER_SIZE,
    height: HERO_PORTRAIT_VIEWER_SIZE,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: HeroPortraitScene,
  });

  return () => game.destroy(true);
}

interface DebugCharacterViewerOptions {
  mode?: "debug" | "shop";
}

class DebugCharacterScene extends Phaser.Scene {
  private fighter?: FighterVisual;
  private dragState?: DebugRigPartDragState;
  private equipmentDragState?: DebugEquipmentDragState;
  private selectedEquipment?: Pick<DebugEquipmentDragState, "slotKey" | "itemId">;
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;
  private unsubscribePlayerSettings?: () => void;
  private readonly viewerMode: NonNullable<DebugCharacterViewerOptions["mode"]>;

  constructor(viewerMode: NonNullable<DebugCharacterViewerOptions["mode"]> = "debug") {
    super(`DebugCharacterScene-${viewerMode}`);
    this.viewerMode = viewerMode;
  }

  preload(): void {
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    if (this.viewerMode === "debug") {
      drawDebugCharacterBackdrop(this);
    }
    this.fighter = createPaperDollFighter(this, {
      ...createPlayerPaperDollOptions(DEBUG_CHARACTER_CENTER_X, 0),
      castsShadow: false,
      enableSelectionHighlights: this.viewerMode === "debug",
    });
    this.fighter.name.setVisible(false);
    if (this.viewerMode === "debug") {
      enableDebugPaperDollEquipmentPicking(this.fighter.paperDollRig, (slotKey, pointer, event) => this.beginEquipmentDrag(slotKey, pointer, event));
      enableDebugPaperDollPartPicking(this.fighter.paperDollRig, (partKey, pointer, event) => this.beginRigPartDrag(partKey, pointer, event));
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) =>
        this.handlePreviewPointerDown(pointer, gameObjects),
      );
      this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
        this.dragRigPart(pointer);
        this.dragEquipment(pointer);
      });
      this.input.on("pointerup", () => this.endDrag());
      this.input.on("pointerupoutside", () => this.endDrag());
      this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
        this.rotateSelectedWithWheel(deltaY);
      });
    }
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => this.sync());
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(() => this.sync());
    this.unsubscribePlayerSettings = subscribePlayerSettings(() => {
      ensurePaperDollAssetResolution(this, getPlayerSettings().lowEffects, [this.fighter], () => this.sync());
    });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
      this.unsubscribePlayerSettings?.();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
    this.sync();
  }

  update(time: number): void {
    const animation = getSelectedDebugBodyAnimation();

    if (!this.fighter) {
      return;
    }

    if (this.viewerMode === "shop") {
      const idle = getActiveBodyAnimation("idle");

      if (idle.enabled) {
        applyBodyAnimation(this.fighter, time, idle);
      }

      return;
    }

    if (debugTuning.animationEditMode === "preview") {
      if (animation.enabled) {
        applyBodyAnimation(this.fighter, time, animation);
      }

      return;
    }

    applySelectedDebugAnimationEditPose(this.fighter);
  }

  private sync(): void {
    if (!this.fighter) {
      return;
    }

    if (this.viewerMode === "shop") {
      const layout = this.getShopCharacterLayout();

      applyPaperDollRigTuning(this.fighter, layout.scale, layout.feetY, layout.feetX);
      return;
    }

    applyPaperDollRigTuning(this.fighter, debugTuning.characterPreviewScale, debugTuning.characterPreviewFeetY, debugTuning.characterPreviewFeetX);
    applySelectedDebugAnimationEditPose(this.fighter);
    syncPaperDollSelectionHighlight(
      this.fighter.paperDollRig,
      debugTuning.characterCanvasEditMode === "parts" ? debugTuning.selectedRigParts : [],
    );
  }

  private getShopCharacterLayout(): CityHeroLayout {
    const width = Math.max(1, this.scale.width || DEBUG_CHARACTER_VIEWER_WIDTH);
    const height = Math.max(1, this.scale.height || DEBUG_CHARACTER_VIEWER_HEIGHT);
    const visualHeightAtScaleOne = CITY_HERO_VIEWER_HEIGHT * PAPER_DOLL_BASE_SCALE;
    const visualWidthAtScaleOne = CITY_HERO_VIEWER_WIDTH * CITY_HERO_CAMERA_VISUAL_WIDTH_RATIO * PAPER_DOLL_BASE_SCALE;
    const heightScaleLimit = Math.max(0.1, height - SHOP_CHARACTER_PREVIEW_MARGIN_Y * 2) / visualHeightAtScaleOne;
    const widthScaleLimit = Math.max(0.1, width - SHOP_CHARACTER_PREVIEW_MARGIN_X * 2) / visualWidthAtScaleOne;
    const scale = clampNumber(Math.min(debugTuning.characterPreviewScale, heightScaleLimit, widthScaleLimit), 0.75, debugTuning.characterPreviewScale);

    return {
      feetX: width / 2,
      feetY: height - SHOP_CHARACTER_PREVIEW_MARGIN_Y,
      scale,
    };
  }

  private handleResize(): void {
    this.sync();
  }

  private beginRigPartDrag(partKey: RigPartKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent): void {
    if (debugTuning.characterCanvasEditMode !== "parts") {
      return;
    }

    if (typeof pointer.leftButtonDown === "function" && !pointer.leftButtonDown()) {
      return;
    }

    event?.stopPropagation();
    const selectedRigParts = getNextDebugRigPartSelection(partKey, isMultiSelectPointer(pointer));
    const selectedRigPart = selectedRigParts.includes(partKey) ? partKey : selectedRigParts[0] ?? partKey;

    updateDebugTuning({ selectedRigPart, selectedRigParts }, { undoable: false });

    if (!selectedRigParts.includes(partKey)) {
      this.endRigPartDrag();
      return;
    }

    beginDebugUndoGroup();

    this.dragState = {
      partKeys: selectedRigParts,
      lastPointerX: pointer.worldX,
      lastPointerY: pointer.worldY,
    };
  }

  private beginEquipmentDrag(slotKey: PaperDollEquipmentSlotKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent): void {
    if (debugTuning.characterCanvasEditMode !== "equipment") {
      return;
    }

    if (!isPrimaryPointerDown(pointer) || !this.isEquipmentSlotVisible(slotKey)) {
      return;
    }

    event?.stopPropagation();
    const itemId = this.getEquipmentItemId(slotKey);

    updateDebugTuning({ selectedRigParts: [] }, { undoable: false });
    this.selectedEquipment = { slotKey, itemId };
    emitDebugCharacterEquipmentSelect(this.selectedEquipment);
    beginDebugUndoGroup();

    this.equipmentDragState = {
      slotKey,
      itemId,
      lastPointerX: pointer.worldX,
      lastPointerY: pointer.worldY,
    };
  }

  private handlePreviewPointerDown(pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]): void {
    if (gameObjects.length > 0) {
      return;
    }

    if (typeof pointer.leftButtonDown === "function" && !pointer.leftButtonDown()) {
      return;
    }

    updateDebugTuning({ selectedRigParts: [] }, { undoable: false });
    this.endDrag();
  }

  private dragRigPart(pointer: Phaser.Input.Pointer): void {
    if (!this.dragState || !this.fighter?.paperDollRig) {
      return;
    }

    if (!pointer.isDown) {
      this.endRigPartDrag();
      return;
    }

    const pointerX = pointer.worldX;
    const pointerY = pointer.worldY;
    const deltaX = pointerX - this.dragState.lastPointerX;
    const deltaY = pointerY - this.dragState.lastPointerY;

    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      return;
    }

    const root = this.fighter.paperDollRig.root;
    const scaleX = root.scaleX === 0 ? 1 : root.scaleX;
    const scaleY = root.scaleY === 0 ? 1 : root.scaleY;

    updateRigPartsWithInteractiveDelta(this.dragState.partKeys, {
      x: deltaX / scaleX,
      y: deltaY / scaleY,
    });

    this.dragState.lastPointerX = pointerX;
    this.dragState.lastPointerY = pointerY;
  }

  private dragEquipment(pointer: Phaser.Input.Pointer): void {
    if (!this.equipmentDragState || !this.fighter?.paperDollRig) {
      return;
    }

    if (!pointer.isDown) {
      this.endEquipmentDrag();
      return;
    }

    const pointerX = pointer.worldX;
    const pointerY = pointer.worldY;
    const deltaX = pointerX - this.equipmentDragState.lastPointerX;
    const deltaY = pointerY - this.equipmentDragState.lastPointerY;

    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      return;
    }

    const root = this.fighter.paperDollRig.root;
    const scaleX = root.scaleX === 0 ? 1 : root.scaleX;
    const scaleY = root.scaleY === 0 ? 1 : root.scaleY;

    emitDebugCharacterEquipmentDelta(this.equipmentDragState, {
      x: deltaX / scaleX,
      y: deltaY / scaleY,
    });

    this.equipmentDragState.lastPointerX = pointerX;
    this.equipmentDragState.lastPointerY = pointerY;
  }

  private endRigPartDrag(): void {
    this.dragState = undefined;
    endDebugUndoGroup();
  }

  private endEquipmentDrag(): void {
    this.equipmentDragState = undefined;
    endDebugUndoGroup();
  }

  private endDrag(): void {
    this.endRigPartDrag();
    this.endEquipmentDrag();
  }

  private rotateSelectedWithWheel(deltaY: number): void {
    if (debugTuning.characterCanvasEditMode === "equipment") {
      this.rotateSelectedEquipmentWithWheel(deltaY);
      return;
    }

    this.rotateSelectedRigPartsWithWheel(deltaY);
  }

  private rotateSelectedRigPartsWithWheel(deltaY: number): void {
    if (deltaY === 0 || debugTuning.selectedRigParts.length === 0) {
      return;
    }

    updateRigPartsWithInteractiveDelta(debugTuning.selectedRigParts, {
      angle: deltaY > 0 ? 3 : -3,
    });
  }

  private rotateSelectedEquipmentWithWheel(deltaY: number): void {
    if (deltaY === 0 || !this.selectedEquipment) {
      return;
    }

    emitDebugCharacterEquipmentDelta(this.selectedEquipment, {
      angle: deltaY > 0 ? 3 : -3,
    });
  }

  private getEquipmentItemId(slotKey: PaperDollEquipmentSlotKey): HeroItemId | "" {
    const rig = this.fighter?.paperDollRig;
    const equipment = rig?.usesPlayerEquipment ? activePlayerEquipment : rig?.equipmentState;

    return equipment?.[slotKey] ?? "";
  }

  private isEquipmentSlotVisible(slotKey: PaperDollEquipmentSlotKey): boolean {
    const slot = this.fighter?.paperDollRig?.equipment[slotKey];

    return Boolean(slot && isPaperDollEquipmentSlotVisible(slot));
  }
}

export function mountDebugCharacterViewer(parent: HTMLElement, playerEquipment?: HeroEquipment, options: DebugCharacterViewerOptions = {}): () => void {
  usePlayerEquipment(playerEquipment);
  const viewerMode = options.mode ?? "debug";
  const isShopMode = viewerMode === "shop";

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: isShopMode ? Math.max(1, parent.clientWidth || DEBUG_CHARACTER_VIEWER_WIDTH) : DEBUG_CHARACTER_VIEWER_WIDTH,
    height: isShopMode ? Math.max(1, parent.clientHeight || DEBUG_CHARACTER_VIEWER_HEIGHT) : DEBUG_CHARACTER_VIEWER_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    scale: {
      mode: isShopMode ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
      autoCenter: isShopMode ? Phaser.Scale.NO_CENTER : Phaser.Scale.CENTER_BOTH,
    },
    scene: new DebugCharacterScene(viewerMode),
  });

  return () => game.destroy(true);
}

function drawDebugCharacterBackdrop(target: Phaser.Scene): void {
  const g = target.add.graphics();

  g.fillStyle(0x4e7774, 1);
  g.fillRect(0, 0, DEBUG_CHARACTER_VIEWER_WIDTH, DEBUG_CHARACTER_VIEWER_HEIGHT);
  g.fillStyle(0x6f8b66, 1);
  g.fillRect(0, DEBUG_CHARACTER_FEET_Y - 34, DEBUG_CHARACTER_VIEWER_WIDTH, DEBUG_CHARACTER_VIEWER_HEIGHT - DEBUG_CHARACTER_FEET_Y + 34);
  g.lineStyle(2, 0x35180d, 0.18);
  g.beginPath();
  g.moveTo(0, DEBUG_CHARACTER_FEET_Y - 34);
  g.lineTo(DEBUG_CHARACTER_VIEWER_WIDTH, DEBUG_CHARACTER_FEET_Y - 34);
  g.strokePath();
  g.fillStyle(0x35180d, 0.22);
  g.fillEllipse(DEBUG_CHARACTER_CENTER_X, DEBUG_CHARACTER_FEET_Y + 11, 180, 24);
}

function createArenaLayers(target: Phaser.Scene): ArenaLayers {
  const back = target.add.container(0, 0).setDepth(-30);
  const ground = target.add.container(0, 0).setDepth(-25);
  const mid = target.add.container(0, 0).setDepth(-20);
  const actors = target.add.container(0, 0).setDepth(10);
  const effects = target.add.container(0, 0).setDepth(40);
  const midShade = { amount: 0 };

  return { back, mid, ground, actors, effects, midShade, all: [back, mid, ground, actors, effects] };
}

function drawArenaBackground(target: Phaser.Scene, layers: ArenaLayers): void {
  const layerConfigs = [
    { key: ARENA_BACKGROUND_BACK_LAYER_ASSET_KEY, layer: layers.back },
    { key: ARENA_BACKGROUND_MID_LAYER_ASSET_KEY, layer: layers.mid, tint: ARENA_MID_LAYER_BASE_TINT },
    { key: ARENA_BACKGROUND_GROUND_LAYER_ASSET_KEY, layer: layers.ground },
  ] as const;

  layerConfigs.forEach((config) => {
    if (!target.textures.exists(config.key)) {
      target.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
      return;
    }

    const image = target.add
      .image(ARENA_WORLD_LEFT, ARENA_WORLD_TOP, config.key)
      .setOrigin(0, 0)
      .setDisplaySize(ARENA_WORLD_WIDTH, ARENA_WORLD_HEIGHT);

    if ("tint" in config) {
      image.setTint(config.tint);
    }

    if (config.key === ARENA_BACKGROUND_MID_LAYER_ASSET_KEY) {
      layers.midImage = image;
      syncArenaMidLayerTint(layers);
    }

    config.layer.add(image);
  });
}

function createPlayerPaperDollOptions(x: number, y: number, equipment = activePlayerEquipment): PaperDollFighterOptions {
  const equipmentAssetKeys = createPlayerEquipmentAssetKeys(equipment);

  return {
    x,
    y,
    label: "BORSHEMIR",
    facing: 1,
    skin: 0xefaa7b,
    skinDark: 0xd9854d,
    hair: 0x8b4a1f,
    headAssetKey: getActivePaperDollAssetKey(FIGHTER_HEAD_LIGHT_ASSET_KEY),
    torsoAssetKey: getActivePaperDollAssetKey(FIGHTER_TORSO_LIGHT_ASSET_KEY),
    ...equipmentAssetKeys,
    usesPlayerEquipment: true,
    bodyPartAssetKeys: getActivePaperDollBodyPartAssetKeys(),
  };
}

function createEnemyPaperDollOptions(x: number, y: number, enemy?: FighterState): PaperDollFighterOptions {
  const preset = enemy?.visualPreset ?? DEFAULT_ENEMY_VISUAL_PRESET;
  const equipment = enemy?.equipment ? { ...enemy.equipment } : createDefaultHeroEquipment();

  return {
    x,
    y,
    label: enemy?.name.toUpperCase() ?? "GRUMBUS",
    facing: -1,
    skin: preset.skin,
    skinDark: preset.skinDark,
    hair: preset.hair,
    muscle: preset.muscle,
    headAssetKey: getActivePaperDollAssetKey(FIGHTER_HEAD_LIGHT_ASSET_KEY),
    torsoAssetKey: getActivePaperDollAssetKey(FIGHTER_TORSO_LIGHT_ASSET_KEY),
    bodyPartAssetKeys: getActivePaperDollBodyPartAssetKeys(),
    ...createPlayerEquipmentAssetKeys(equipment),
    equipment,
  };
}

function buildVisuals(target: ArenaScene): ArenaVisuals {
  const player = createPaperDollFighter(target, createPlayerPaperDollOptions(DEFAULT_STAGE_ORIGIN_X + DEFAULT_PLAYER_STAGE_X, FIGHTER_BASE_Y), target.arenaLayers?.actors);
  const enemy = createPaperDollFighter(target, createEnemyPaperDollOptions(DEFAULT_STAGE_ORIGIN_X + DEFAULT_ENEMY_STAGE_X, FIGHTER_BASE_Y), target.arenaLayers?.actors);
  const playerHud = createHud(target, 30, 46, "BORSHEMIR");
  const enemyHud = createHud(target, 680, 46, "GRUMBUS");
  return { player, enemy, playerHud, enemyHud };
}

function createHud(target: Phaser.Scene, x: number, y: number, label: string): HudVisual {
  const panel = target.add.rectangle(x + 150, y + 46, 300, 96, 0xf1dca2).setStrokeStyle(4, 0x35180d);
  const hpTrack = target.add.rectangle(x + 150, y + 25, 230, 18, 0x35180d);
  const armorTrack = target.add.rectangle(x + 150, y + 51, 230, 18, 0x35180d);
  const staminaTrack = target.add.rectangle(x + 150, y + 77, 230, 18, 0x35180d);
  const hpFill = target.add.rectangle(x + 35, y + 25, 226, 14, 0xc32a2a).setOrigin(0, 0.5);
  const armorFill = target.add.rectangle(x + 35, y + 51, 226, 14, 0x6e879c).setOrigin(0, 0.5);
  const staminaFill = target.add.rectangle(x + 35, y + 77, 226, 14, 0x43b5ab).setOrigin(0, 0.5);
  const text = target.add
    .text(x + 150, y + 108, "", {
      color: "#35180d",
      fontFamily: "Georgia",
      fontSize: "16px",
      fontStyle: "900",
    })
    .setOrigin(0.5);

  const name = target.add
    .text(x + 150, y - 4, label, {
      color: "#35180d",
      fontFamily: "Georgia",
      fontSize: "22px",
      fontStyle: "900",
    })
    .setOrigin(0.5);

  [panel, hpTrack, armorTrack, staminaTrack, hpFill, armorFill, staminaFill, text, name].forEach((part) => part.setVisible(false));

  return { hpFill, armorFill, staminaFill, label: text };
}

function createPaperDollFighter(target: Phaser.Scene, options: PaperDollFighterOptions, parentLayer?: Phaser.GameObjects.Container): FighterVisual {
  const appearance: PaperDollAppearance = {
    facing: options.facing,
    skin: options.skin,
    skinDark: options.skinDark,
    hair: options.hair,
    muscle: options.muscle ?? DEFAULT_PAPER_DOLL_APPEARANCE.muscle,
  };
  const initialFeetY = options.y + PLAYER_AVATAR_FEET_Y_OFFSET;
  const castsShadow = options.castsShadow !== false;
  const shadowRig = createPaperDollShadowRig(target, options, appearance, initialFeetY, castsShadow);
  const lowShadow = part(
    target.add
      .ellipse(options.x, initialFeetY + 8, 68, 18, 0x35180d, 0.22)
      .setDepth(PAPER_DOLL_SHADOW_DEPTH)
      .setVisible(false),
  );
  const rootContainer = target.add.container(options.x, initialFeetY);
  const root = part(rootContainer);
  const parts = {} as Record<PaperDollPartKey, FighterPart>;
  const equipment: PaperDollEquipment = {};
  const equipmentAnchors: PaperDollEquipmentAnchors = {};
  const equipmentLayers = createPaperDollEquipmentLayers(target);
  const faceParts: PaperDollFaceParts = {};
  const selectionHighlights = options.enableSelectionHighlights
    ? ({} as Record<PaperDollPartKey, Phaser.GameObjects.Graphics>)
    : undefined;

  PAPER_DOLL_PART_ORDER.forEach((key) => {
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const partContainer = target.add.container(pivot.x, pivot.y);

    addPaperDollPartVisual(target, partContainer, key, options, equipment, equipmentLayers, equipmentAnchors, faceParts);
    if (selectionHighlights) {
      selectionHighlights[key] = addRigPartSelectionHighlight(target, partContainer, key);
    }
    rootContainer.add(partContainer);
    addPaperDollEquipmentLayersAfterPart(rootContainer, key, equipmentLayers);
    parts[key] = part(partContainer);
  });

  root.scaleX = PAPER_DOLL_BASE_SCALE * appearance.facing;
  root.scaleY = PAPER_DOLL_BASE_SCALE;
  const paperDollRig: PaperDollRig = {
    root,
    parts,
    equipment,
    equipmentAnchors,
    equipmentState: options.equipment ? { ...options.equipment } : undefined,
    faceParts,
    appearance,
    selectionHighlights,
    usesPlayerEquipment: Boolean(options.usesPlayerEquipment),
    shadow: shadowRig,
  };

  syncPaperDollEquipmentVisibility(paperDollRig);

  const name = part(
    target.add
      .text(options.x, initialFeetY + 30 * PAPER_DOLL_BASE_SCALE, options.label, {
        color: "#35180d",
        fontFamily: "Georgia",
        fontSize: "19px",
        fontStyle: "900",
      })
      .setOrigin(0.5),
  );
  name.setVisible(false);
  parentLayer?.add([shadowRig.root, lowShadow, root, name]);

  return {
    body: root,
    head: parts.head,
    eyeLeft: faceParts.eyeLeft ?? parts.head,
    eyeRight: faceParts.eyeRight ?? parts.head,
    helmet: parts.head,
    plume: parts.head,
    sword: parts.frontHand,
    armFront: parts.frontUpperArm,
    armBack: parts.backUpperArm,
    legFront: parts.frontThigh,
    legBack: parts.backThigh,
    shadow: shadowRig.root,
    lowShadow,
    name,
    movableParts: [shadowRig.root, lowShadow, root, name],
    animatedParts: [root],
    paperDollRig,
    castsShadow,
    debugScale: 1,
  };
}

function createPaperDollShadowRig(
  target: Phaser.Scene,
  options: PaperDollFighterOptions,
  appearance: PaperDollAppearance,
  initialFeetY: number,
  visible: boolean,
): PaperDollShadowRig {
  const shadowRootContainer = target.add
    .container(options.x, initialFeetY)
    .setDepth(PAPER_DOLL_SHADOW_DEPTH)
    .setAlpha(debugTuning.shadowAlpha)
    .setVisible(visible);
  const shadowRoot = part(shadowRootContainer);
  const parts = {} as Record<PaperDollPartKey, FighterPart>;
  const equipment: PaperDollEquipment = {};
  const equipmentAnchors: PaperDollEquipmentAnchors = {};
  const equipmentLayers = createPaperDollEquipmentLayers(target);
  const faceParts: PaperDollFaceParts = {};

  PAPER_DOLL_PART_ORDER.forEach((key) => {
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const partContainer = target.add.container(pivot.x, pivot.y);

    addPaperDollPartVisual(target, partContainer, key, options, equipment, equipmentLayers, equipmentAnchors, faceParts);
    tintPaperDollShadowObject(partContainer);
    shadowRootContainer.add(partContainer);
    addPaperDollEquipmentLayersAfterPart(shadowRootContainer, key, equipmentLayers);
    parts[key] = part(partContainer);
  });

  tintPaperDollEquipmentLayers(equipmentLayers);
  shadowRoot.scaleX = PAPER_DOLL_BASE_SCALE * appearance.facing * debugTuning.shadowScaleX;
  shadowRoot.scaleY = PAPER_DOLL_BASE_SCALE * debugTuning.shadowScaleY;
  applyPaperDollShadowBlur(shadowRoot);

  return { root: shadowRoot, parts, equipment, equipmentAnchors, faceParts };
}

function createPaperDollEquipmentLayers(target: Phaser.Scene): PaperDollEquipmentLayers {
  return {
    legs: target.add.container(0, 0),
    torso: target.add.container(0, 0),
    head: target.add.container(0, 0),
    weapon: target.add.container(0, 0),
    arms: target.add.container(0, 0),
    weaponTop: target.add.container(0, 0),
  };
}

function addPaperDollEquipmentLayersAfterPart(
  rootContainer: Phaser.GameObjects.Container,
  partKey: PaperDollPartKey,
  layers: PaperDollEquipmentLayers,
): void {
  if (partKey === "frontFoot") {
    rootContainer.add(layers.legs);
    return;
  }

  if (partKey === "torso") {
    rootContainer.add(layers.torso);
    return;
  }

  if (partKey === "head") {
    rootContainer.add(layers.head);
    return;
  }

  if (partKey === "frontForearm") {
    rootContainer.add(layers.weapon);
    return;
  }

  if (partKey === "frontHand") {
    rootContainer.add(layers.arms);
    rootContainer.add(layers.weaponTop);
  }
}

function getPaperDollEquipmentLayer(layers: PaperDollEquipmentLayers, slotKey: PaperDollEquipmentSlotKey): Phaser.GameObjects.Container {
  if (slotKey === "weaponMain") {
    return layers.weapon;
  }

  if (slotKey === "helmet") {
    return layers.head;
  }

  if (slotKey === "breastplate") {
    return layers.torso;
  }

  if (
    slotKey === "backGreave" ||
    slotKey === "frontGreave" ||
    slotKey === "backShinguard" ||
    slotKey === "frontShinguard" ||
    slotKey === "backBoot" ||
    slotKey === "frontBoot"
  ) {
    return layers.legs;
  }

  return layers.arms;
}

function tintPaperDollEquipmentLayers(layers: PaperDollEquipmentLayers): void {
  Object.values(layers).forEach((layer) => tintPaperDollShadowObject(layer));
}

function linkPaperDollEquipmentAnchor(primary: FighterPart | undefined, linked: FighterPart): void {
  if (!primary) {
    return;
  }

  const linkedAnchors = paperDollLinkedEquipmentAnchors.get(primary) ?? [];

  linkedAnchors.push(linked);
  paperDollLinkedEquipmentAnchors.set(primary, linkedAnchors);
}

function linkPaperDollEquipmentSlot(primary: FighterPart | undefined, linked: FighterPart): void {
  if (!primary) {
    return;
  }

  const linkedSlots = paperDollLinkedEquipmentSlots.get(primary) ?? [];

  linkedSlots.push(linked);
  paperDollLinkedEquipmentSlots.set(primary, linkedSlots);
}

function getLinkedPaperDollEquipmentSlots(slot: FighterPart | undefined): FighterPart[] {
  return slot ? (paperDollLinkedEquipmentSlots.get(slot) ?? []) : [];
}

function tintPaperDollShadowObject(gameObject: Phaser.GameObjects.GameObject): void {
  const tintable = gameObject as Phaser.GameObjects.GameObject & { setTint?: (color: number) => unknown };
  const shape = gameObject as Phaser.GameObjects.GameObject & {
    setFillStyle?: (color: number, alpha?: number) => unknown;
    setStrokeStyle?: (lineWidth: number, color: number, alpha?: number) => unknown;
  };

  tintable.setTint?.(PAPER_DOLL_SHADOW_COLOR);
  shape.setFillStyle?.(PAPER_DOLL_SHADOW_COLOR, 1);
  shape.setStrokeStyle?.(0, PAPER_DOLL_SHADOW_COLOR, 0);

  if (gameObject instanceof Phaser.GameObjects.Container) {
    gameObject.list.forEach((child) => tintPaperDollShadowObject(child));
  }
}

function applyPaperDollShadowBlur(shadowRoot: FighterPart): void {
  const blur = Math.max(0, debugTuning.shadowBlur);
  const previousBlur = paperDollShadowBlurValues.get(shadowRoot);

  if (previousBlur === blur) {
    return;
  }

  const target = shadowRoot as ShadowFilterTarget;
  const currentFilter = paperDollShadowBlurFilters.get(shadowRoot);

  paperDollShadowBlurValues.set(shadowRoot, blur);

  if (blur <= 0) {
    const filters = target.filters?.internal;

    if (currentFilter && filters) {
      filters.remove(currentFilter, true);
    } else {
      currentFilter?.destroy();
    }

    paperDollShadowBlurFilters.delete(shadowRoot);
    target.setRenderFilters?.(false);
    return;
  }

  if (!target.enableFilters) {
    return;
  }

  target.enableFilters();
  const filters = target.filters?.internal;

  if (!filters) {
    return;
  }

  target.setRenderFilters?.(true);

  if (currentFilter) {
    currentFilter.quality = PAPER_DOLL_SHADOW_BLUR_QUALITY;
    currentFilter.x = blur;
    currentFilter.y = blur * 0.7;
    currentFilter.strength = PAPER_DOLL_SHADOW_BLUR_STRENGTH;
    currentFilter.color = PAPER_DOLL_SHADOW_COLOR;
    currentFilter.steps = PAPER_DOLL_SHADOW_BLUR_STEPS;
    return;
  }

  const nextFilter = filters.addBlur(
    PAPER_DOLL_SHADOW_BLUR_QUALITY,
    blur,
    blur * 0.7,
    PAPER_DOLL_SHADOW_BLUR_STRENGTH,
    PAPER_DOLL_SHADOW_COLOR,
    PAPER_DOLL_SHADOW_BLUR_STEPS,
  );

  paperDollShadowBlurFilters.set(shadowRoot, nextFilter);
}

function applyCityHeroLighting(fighter: FighterVisual, amount = getCityLightingAmount()): void {
  const rig = fighter.paperDollRig;

  if (!rig) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    tintPaperDollImages(rig.parts[key], CITY_HERO_BODY_TINT, amount);
  });

  PAPER_DOLL_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    tintPaperDollImages(rig.equipment[slotKey], CITY_HERO_EQUIPMENT_TINT, amount);
  });
}

function tintPaperDollImages(gameObject: Phaser.GameObjects.GameObject | undefined, tint: number, amount: number): void {
  if (!gameObject) {
    return;
  }

  if (gameObject instanceof Phaser.GameObjects.Image || gameObject instanceof Phaser.GameObjects.Sprite) {
    gameObject.setTint(mixColor(0xffffff, tint, clampNumber(amount, 0, 1)));
  }

  if (gameObject instanceof Phaser.GameObjects.Container) {
    gameObject.list.forEach((child) => tintPaperDollImages(child, tint, amount));
  }
}

const PAPER_DOLL_PART_ORDER: PaperDollPartKey[] = [
  "backThigh",
  "frontThigh",
  "backShin",
  "frontShin",
  "backFoot",
  "frontFoot",
  "torso",
  "head",
  "backUpperArm",
  "frontUpperArm",
  "backForearm",
  "frontForearm",
  "backHand",
  "frontHand",
];

const PAPER_DOLL_PART_PIVOTS: Record<PaperDollPartKey, { x: number; y: number }> = {
  head: { x: 0, y: -205 },
  torso: { x: 0, y: -84 },
  backUpperArm: { x: -43, y: -180 },
  backForearm: { x: -58, y: -115 },
  backHand: { x: -64, y: -55 },
  frontUpperArm: { x: 43, y: -180 },
  frontForearm: { x: 58, y: -115 },
  frontHand: { x: 64, y: -55 },
  backThigh: { x: -25, y: -78 },
  backShin: { x: -31, y: -40 },
  backFoot: { x: -38, y: -7 },
  frontThigh: { x: 25, y: -78 },
  frontShin: { x: 31, y: -40 },
  frontFoot: { x: 38, y: -7 },
};

const PAPER_DOLL_PART_HIT_AREAS: Record<PaperDollPartKey, Phaser.Geom.Rectangle> = {
  head: new Phaser.Geom.Rectangle(-50, -112, 100, 128),
  torso: new Phaser.Geom.Rectangle(-48, -112, 96, 126),
  backUpperArm: new Phaser.Geom.Rectangle(-28, -14, 56, 104),
  backForearm: new Phaser.Geom.Rectangle(-26, -12, 52, 84),
  backHand: new Phaser.Geom.Rectangle(-28, -22, 56, 64),
  frontUpperArm: new Phaser.Geom.Rectangle(-28, -14, 56, 104),
  frontForearm: new Phaser.Geom.Rectangle(-26, -12, 52, 84),
  frontHand: new Phaser.Geom.Rectangle(-28, -22, 56, 64),
  backThigh: new Phaser.Geom.Rectangle(-28, -16, 56, 100),
  backShin: new Phaser.Geom.Rectangle(-26, -12, 52, 92),
  backFoot: new Phaser.Geom.Rectangle(-56, -18, 86, 52),
  frontThigh: new Phaser.Geom.Rectangle(-28, -16, 56, 100),
  frontShin: new Phaser.Geom.Rectangle(-26, -12, 52, 92),
  frontFoot: new Phaser.Geom.Rectangle(-30, -18, 86, 52),
};

function applyPaperDollRigTuning(fighter: FighterVisual, scale: number, feetY: number, centerX = fighter.body.x): void {
  const rig = fighter.paperDollRig;

  if (!rig) {
    return;
  }

  rig.root.x = centerX;
  rig.root.y = feetY;
  rig.root.scaleX = PAPER_DOLL_BASE_SCALE * scale * rig.appearance.facing;
  rig.root.scaleY = PAPER_DOLL_BASE_SCALE * scale;
  applyRigPartDebugTuning(rig);
  syncPaperDollEquipmentVisibility(rig);
  applyPaperDollShadowTuning(fighter, scale, feetY, centerX);
  fighter.name.x = centerX;
  fighter.name.y = feetY + 30 * PAPER_DOLL_BASE_SCALE * scale;
  fighter.debugScale = scale;
}

function applyPaperDollShadowTuning(fighter: FighterVisual, scale: number, feetY: number, centerX: number): void {
  const shadowMode = getArenaShadowMode();
  const highShadowVisible = fighter.castsShadow && shadowMode === "high" && !fighter.isShattered;
  const lowShadowVisible = fighter.castsShadow && shadowMode === "low" && !fighter.isShattered;
  const lowShadowScale = Math.max(0.62, scale / DEFAULT_PLAYER_SCALE);

  fighter.shadow.x = centerX + debugTuning.shadowOffsetX * scale;
  fighter.shadow.y = feetY + debugTuning.shadowOffsetY * scale;
  fighter.shadow.scaleX = PAPER_DOLL_BASE_SCALE * scale * (fighter.paperDollRig?.appearance.facing ?? 1) * debugTuning.shadowScaleX;
  fighter.shadow.scaleY = PAPER_DOLL_BASE_SCALE * scale * debugTuning.shadowScaleY;
  fighter.shadow.angle = 0;
  fighter.shadow.setVisible(highShadowVisible);
  fighter.shadow.setAlpha(highShadowVisible ? debugTuning.shadowAlpha : 0);
  applyPaperDollShadowBlur(fighter.shadow);
  fighter.lowShadow.x = centerX + debugTuning.shadowOffsetX * scale;
  fighter.lowShadow.y = feetY + 9 * scale;
  fighter.lowShadow.scaleX = lowShadowScale * 0.95;
  fighter.lowShadow.scaleY = lowShadowScale * 0.72;
  fighter.lowShadow.angle = 0;
  fighter.lowShadow.setVisible(lowShadowVisible);
  fighter.lowShadow.setAlpha(lowShadowVisible ? 0.26 : 0);
}

function applyRigPartDebugTuning(rig: PaperDollRig): void {
  const activeDebugTuning = getActiveDebugTuning();
  const rigParts = activeDebugTuning?.rigParts;
  const faceParts = activeDebugTuning?.faceParts ?? DEFAULT_FACE_PARTS;
  const equipment = activeDebugTuning?.equipment ?? DEFAULT_EQUIPMENT;
  const equipmentItems = activeDebugTuning?.equipmentItems ?? DEFAULT_EQUIPMENT_ITEM_TUNING;
  const equipmentState = rig.usesPlayerEquipment ? activePlayerEquipment : rig.equipmentState;

  RIG_PART_KEYS.forEach((key) => {
    const part = rig.parts[key];
    const shadowPart = rig.shadow?.parts[key];
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const tuning = rigParts?.[key] ?? DEFAULT_RIG_PARTS[key] ?? defaultRigPartTuning;

    applyRigPartTransform(part, pivot, tuning);
    if (shadowPart) {
      applyRigPartTransform(shadowPart, pivot, tuning);
    }
  });

  syncPaperDollEquipmentAnchors(rig);
  if (rig.shadow) {
    syncPaperDollEquipmentAnchors(rig.shadow);
  }

  applyFacePartTransform(rig.faceParts.eyeLeft, HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeLeft);
  applyFacePartTransform(rig.faceParts.eyeRight, HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeRight);
  applyFacePartTransform(rig.shadow?.faceParts.eyeLeft, HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeLeft);
  applyFacePartTransform(rig.shadow?.faceParts.eyeRight, HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeRight);
  applyPaperDollEquipmentTuning(rig.equipment, equipment, equipmentItems, equipmentState);
  if (rig.shadow) {
    applyPaperDollEquipmentTuning(rig.shadow.equipment, equipment, equipmentItems, equipmentState);
  }
}

function applyPaperDollEquipmentTuning(
  equipmentParts: PaperDollEquipment,
  equipment: Record<EquipmentSlotKey, EquipmentTuning>,
  equipmentItems: Record<string, EquipmentTuning>,
  equipmentState?: HeroEquipment,
): void {
  applyEquipmentTransform(equipmentParts.weaponMain, getEquipmentTransformTuning("weaponMain", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.helmet, getEquipmentTransformTuning("helmet", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.breastplate, getEquipmentTransformTuning("breastplate", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.backShoulderguard, getEquipmentTransformTuning("backShoulderguard", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.frontShoulderguard, getEquipmentTransformTuning("frontShoulderguard", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.backWrist, getEquipmentTransformTuning("backWrist", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.frontWrist, getEquipmentTransformTuning("frontWrist", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.backGlove, getEquipmentTransformTuning("backGlove", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.frontGlove, getEquipmentTransformTuning("frontGlove", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.backGreave, getEquipmentTransformTuning("backGreave", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.frontGreave, getEquipmentTransformTuning("frontGreave", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.backShinguard, getEquipmentTransformTuning("backShinguard", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.frontShinguard, getEquipmentTransformTuning("frontShinguard", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.backBoot, getEquipmentTransformTuning("backBoot", equipment, equipmentItems, equipmentState));
  applyEquipmentTransform(equipmentParts.frontBoot, getEquipmentTransformTuning("frontBoot", equipment, equipmentItems, equipmentState));
}

function getEquipmentTransformTuning(
  slotKey: EquipmentSlotKey,
  equipment: Record<EquipmentSlotKey, EquipmentTuning>,
  equipmentItems: Record<string, EquipmentTuning>,
  equipmentState?: HeroEquipment,
): EquipmentTuning {
  const itemId = equipmentState?.[slotKey];

  return (itemId ? equipmentItems[itemId] ?? GENERATED_EQUIPMENT_ITEM_TUNING[itemId] : undefined) ?? equipment[slotKey];
}

function syncFighterEquipmentVisibility(fighter: FighterVisual | undefined): void {
  syncPaperDollEquipmentVisibility(fighter?.paperDollRig);
}

function syncFighterPaperDollTextureResolution(fighter: FighterVisual | undefined): void {
  const rig = fighter?.paperDollRig;

  if (!rig) {
    return;
  }

  syncPaperDollBodyPartVisuals(rig.parts);
  if (rig.shadow) {
    syncPaperDollBodyPartVisuals(rig.shadow.parts);
  }
  syncPaperDollEquipmentVisibility(rig);
  if (rig.shadow) {
    tintPaperDollShadowObject(rig.shadow.root);
  }
}

function syncPaperDollBodyPartVisuals(parts: Record<PaperDollPartKey, FighterPart>): void {
  syncPaperDollBodyPartImage(parts.head, getActivePaperDollAssetKey(FIGHTER_HEAD_LIGHT_ASSET_KEY), PAPER_DOLL_HEAD_ASSET_CONFIG);
  syncPaperDollBodyPartImage(parts.torso, getActivePaperDollAssetKey(FIGHTER_TORSO_LIGHT_ASSET_KEY), PAPER_DOLL_TORSO_ASSET_CONFIG);

  Object.entries(DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS).forEach(([partKey, assetKey]) => {
    const config = PAPER_DOLL_PART_ASSET_CONFIGS[partKey as PaperDollPartKey];

    if (assetKey && config) {
      syncPaperDollBodyPartImage(parts[partKey as PaperDollPartKey], getActivePaperDollAssetKey(assetKey), config);
    }
  });
}

function syncPaperDollBodyPartImage(part: FighterPart | undefined, textureKey: string, config: PaperDollPartAssetConfig): void {
  if (!part) {
    return;
  }

  const partContainer = part as Phaser.GameObjects.Container;
  const image = partContainer.list.find((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image);

  if (!image || !partContainer.scene.textures.exists(textureKey)) {
    return;
  }

  if (image.texture.key !== textureKey) {
    image.setTexture(textureKey);
  }

  applyPaperDollPartImageConfig(image, config);
}

function syncPaperDollEquipmentVisibility(rig: PaperDollRig | undefined): void {
  if (!rig) {
    return;
  }

  syncPaperDollEquipmentVisuals(rig);
  if (rig.shadow) {
    tintPaperDollShadowObject(rig.shadow.root);
  }

  const visibility = rig.usesPlayerEquipment
    ? createPlayerEquipmentVisibility()
    : rig.equipmentState
      ? createPlayerEquipmentVisibility(rig.equipmentState)
      : undefined;

  if (!visibility) {
    syncPaperDollShadowSilhouette(rig.shadow);
    return;
  }

  PAPER_DOLL_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    setPaperDollEquipmentSlotVisible(rig.equipment[slotKey], visibility[slotKey]);
  });
  syncPaperDollShadowSilhouette(rig.shadow, visibility);
}

function syncPaperDollShadowSilhouette(
  shadow: PaperDollShadowRig | undefined,
  visibility?: Record<PaperDollEquipmentSlotKey, boolean>,
): void {
  if (!shadow) {
    return;
  }

  Object.values(shadow.faceParts).forEach((facePart) => facePart?.setVisible(false));
  PAPER_DOLL_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    const slotVisible = slotKey === "weaponMain" && Boolean(visibility?.[slotKey]);

    shadow.equipment[slotKey]?.setVisible(slotVisible);
    getLinkedPaperDollEquipmentSlots(shadow.equipment[slotKey]).forEach((slot) => slot.setVisible(false));
  });
}

function setPaperDollEquipmentSlotVisible(slot: FighterPart | undefined, visible: boolean): void {
  slot?.setVisible(visible);
  getLinkedPaperDollEquipmentSlots(slot).forEach((linkedSlot) => linkedSlot.setVisible(visible && isPaperDollWeaponOverlayVisible(linkedSlot)));
}

function syncPaperDollEquipmentVisuals(rig: PaperDollRig): void {
  const equipmentState = rig.usesPlayerEquipment ? activePlayerEquipment : rig.equipmentState;
  if (!equipmentState) {
    return;
  }

  const equipmentAssetKeys = createPlayerEquipmentAssetKeys(equipmentState);
  PAPER_DOLL_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    const textureKey = equipmentAssetKeys[PLAYER_EQUIPMENT_ASSET_KEY_BY_SLOT[slotKey]];
    syncPaperDollEquipmentSlot(rig.equipment[slotKey], slotKey, textureKey);
    syncPaperDollEquipmentSlot(rig.shadow?.equipment[slotKey], slotKey, textureKey);
  });
}

function syncPaperDollEquipmentSlot(slot: FighterPart | undefined, slotKey: PaperDollEquipmentSlotKey, textureKey: string | undefined): void {
  if (!slot || !textureKey) {
    return;
  }

  syncSinglePaperDollEquipmentSlot(slot, slotKey, textureKey);
  getLinkedPaperDollEquipmentSlots(slot).forEach((linkedSlot) => {
    const image = syncSinglePaperDollEquipmentSlot(linkedSlot, slotKey, textureKey);

    if (slotKey === "weaponMain" && image) {
      applyPaperDollWeaponTopOverlayCrop(image, getPaperDollWeaponOverlayCrop(linkedSlot, textureKey));
      linkedSlot.setVisible(isPaperDollEquipmentSlotVisible(slot) && isPaperDollWeaponOverlayVisible(linkedSlot));
    }
  });
}

function syncSinglePaperDollEquipmentSlot(
  slot: FighterPart,
  slotKey: PaperDollEquipmentSlotKey,
  textureKey: string,
): Phaser.GameObjects.Image | undefined {
  if (!textureKey) {
    return undefined;
  }

  const slotContainer = slot as Phaser.GameObjects.Container;
  const config = paperDollEquipmentSlotConfigs.get(slot) ?? PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS[slotKey];
  let image = getPaperDollEquipmentSlotImage(slot);

  if (!slotContainer.scene.textures.exists(textureKey)) {
    return undefined;
  }

  if (!image) {
    image = createPaperDollEquipmentImage(slotContainer.scene, textureKey, config);
    slotContainer.add(image);
    return image;
  }

  if (image.texture.key !== textureKey) {
    image.setTexture(textureKey);
  }

  applyPaperDollEquipmentImageConfig(image, config);

  return image;
}

function applyLoopingBodyAnimation(fighter: FighterVisual, time: number, animation: BodyAnimationTuning, amount = 1): void {
  if (fighter.isShattered) {
    return;
  }

  if ((fighter.bodyAnimationLockedUntil ?? 0) > time) {
    return;
  }

  applyBodyAnimation(fighter, time, animation, amount);
}

function applyBodyAnimation(fighter: FighterVisual, time: number, animation: BodyAnimationTuning, amount = 1): void {
  const duration = Math.max(1, animation.duration);
  const phase = (time % duration) / duration;
  const blend = (0.5 - Math.cos(phase * Math.PI * 2) * 0.5) * amount;

  applyBodyAnimationBlend(fighter, animation, blend);
}

function applyBodyAnimationBlend(fighter: FighterVisual, animation: BodyAnimationTuning, blend: number): void {
  if (fighter.isShattered) {
    return;
  }

  const rig = fighter.paperDollRig;

  if (!rig) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    if (!animation.activeParts[key]) {
      return;
    }

    const part = rig.parts[key];
    const shadowPart = rig.shadow?.parts[key];
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const tuning = interpolateRigPartTuning(animation.base[key] ?? defaultRigPartTuning, animation.breath[key] ?? defaultRigPartTuning, blend);

    applyRigPartTransform(part, pivot, tuning);
    if (shadowPart) {
      applyRigPartTransform(shadowPart, pivot, tuning);
    }
  });

  syncPaperDollEquipmentAnchors(rig);
  if (rig.shadow) {
    syncPaperDollEquipmentAnchors(rig.shadow);
  }

  const eyeLeft = interpolateFacePartTuning(animation.faceBase.eyeLeft, animation.faceBreath.eyeLeft, blend);
  const eyeRight = interpolateFacePartTuning(animation.faceBase.eyeRight, animation.faceBreath.eyeRight, blend);

  applyFacePartTransform(rig.faceParts.eyeLeft, HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, eyeLeft);
  applyFacePartTransform(rig.faceParts.eyeRight, HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, eyeRight);
  applyFacePartTransform(rig.shadow?.faceParts.eyeLeft, HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, eyeLeft);
  applyFacePartTransform(rig.shadow?.faceParts.eyeRight, HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, eyeRight);
}

function interpolateRigPartTuning(from: RigPartTuning, to: RigPartTuning, blend: number): RigPartTuning {
  return {
    x: lerp(from.x, to.x, blend),
    y: lerp(from.y, to.y, blend),
    angle: lerp(from.angle, to.angle, blend),
    scaleX: lerp(from.scaleX, to.scaleX, blend),
    scaleY: lerp(from.scaleY, to.scaleY, blend),
    flipX: blend < 0.5 ? from.flipX : to.flipX,
    flipY: blend < 0.5 ? from.flipY : to.flipY,
  };
}

function interpolateFacePartTuning(from: FacePartTuning, to: FacePartTuning, blend: number): FacePartTuning {
  return {
    x: lerp(from.x, to.x, blend),
    y: lerp(from.y, to.y, blend),
    scaleX: lerp(from.scaleX, to.scaleX, blend),
    scaleY: lerp(from.scaleY, to.scaleY, blend),
  };
}

function applyRigPartTransform(part: FighterPart, pivot: { x: number; y: number }, tuning: RigPartTuning): void {
  part.x = pivot.x + tuning.x;
  part.y = pivot.y + tuning.y;
  part.angle = tuning.angle;
  part.scaleX = tuning.scaleX * (tuning.flipX ? -1 : 1);
  part.scaleY = tuning.scaleY * (tuning.flipY ? -1 : 1);
}

function syncPaperDollEquipmentAnchors(rig: Pick<PaperDollRig, "parts" | "equipmentAnchors">): void {
  PAPER_DOLL_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    const anchor = rig.equipmentAnchors[slotKey];

    if (!anchor) {
      return;
    }

    syncPaperDollEquipmentAnchor(anchor, rig.parts[PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS[slotKey]]);
    paperDollLinkedEquipmentAnchors
      .get(anchor)
      ?.forEach((linkedAnchor) => syncPaperDollEquipmentAnchor(linkedAnchor, rig.parts[PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS[slotKey]]));
  });
}

function syncPaperDollEquipmentAnchor(anchor: FighterPart, sourcePart: FighterPart): void {
  anchor.x = sourcePart.x;
  anchor.y = sourcePart.y;
  anchor.angle = sourcePart.angle;
  anchor.scaleX = sourcePart.scaleX;
  anchor.scaleY = sourcePart.scaleY;
}

function getPaperDollEquipmentAnchorParts(rig: Pick<PaperDollRig, "equipmentAnchors">): FighterPart[] {
  return Object.values(rig.equipmentAnchors).flatMap((anchor) => (anchor ? [anchor, ...(paperDollLinkedEquipmentAnchors.get(anchor) ?? [])] : []));
}

function getPaperDollEquipmentAnchorsForPart(rig: Pick<PaperDollRig, "equipmentAnchors">, partKey: PaperDollPartKey): FighterPart[] {
  return PAPER_DOLL_EQUIPMENT_SLOT_KEYS.flatMap((slotKey) => {
    const anchor = rig.equipmentAnchors[slotKey];

    return anchor && PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS[slotKey] === partKey ? [anchor, ...(paperDollLinkedEquipmentAnchors.get(anchor) ?? [])] : [];
  });
}

function applyFacePartTransform(part: FighterPart | undefined, baseX: number, baseY: number, tuning: FacePartTuning): void {
  if (!part) {
    return;
  }

  part.x = baseX + tuning.x;
  part.y = baseY + tuning.y;
  part.scaleX = tuning.scaleX;
  part.scaleY = tuning.scaleY;
}

function applyEquipmentTransform(part: FighterPart | undefined, tuning: EquipmentTuning): void {
  if (!part) {
    return;
  }

  applySingleEquipmentTransform(part, tuning);
  getLinkedPaperDollEquipmentSlots(part).forEach((linkedPart) => applySingleEquipmentTransform(linkedPart, tuning));
}

function applySingleEquipmentTransform(part: FighterPart, tuning: EquipmentTuning): void {
  part.x = tuning.x;
  part.y = tuning.y;
  part.angle = tuning.angle;
  part.scaleX = tuning.scaleX * (tuning.flipX ? -1 : 1);
  part.scaleY = tuning.scaleY * (tuning.flipY ? -1 : 1);
}

function enableDebugPaperDollPartPicking(rig: PaperDollRig | undefined, onPick?: DebugRigPartPickHandler): void {
  if (!rig) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    const partContainer = rig.parts[key] as Phaser.GameObjects.Container;

    partContainer.setInteractive(PAPER_DOLL_PART_HIT_AREAS[key], Phaser.Geom.Rectangle.Contains);

    if (partContainer.input) {
      partContainer.input.cursor = "pointer";
    }

    partContainer.on("pointerdown", (pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: DebugInputEvent) => {
      if (onPick) {
        onPick(key, pointer, event);
      } else {
        event?.stopPropagation();
        updateDebugTuning({ selectedRigPart: key, selectedRigParts: [key] }, { undoable: false });
      }
    });
  });
}

function enableDebugPaperDollEquipmentPicking(rig: PaperDollRig | undefined, onPick: DebugEquipmentPickHandler): void {
  if (!rig) {
    return;
  }

  PAPER_DOLL_DRAGGABLE_ARMOR_SLOT_KEYS.forEach((slotKey) => {
    const slot = rig.equipment[slotKey];

    if (!slot) {
      return;
    }

    const slotContainer = slot as Phaser.GameObjects.Container;

    slotContainer.setInteractive(createPaperDollEquipmentHitArea(slot, slotKey), Phaser.Geom.Rectangle.Contains);

    if (slotContainer.input) {
      slotContainer.input.cursor = "move";
    }

    slotContainer.on("pointerdown", (pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: DebugInputEvent) => {
      onPick(slotKey, pointer, event);
    });
  });
}

function createPaperDollEquipmentHitArea(slot: FighterPart, slotKey: PaperDollEquipmentSlotKey): Phaser.Geom.Rectangle {
  const image = getPaperDollEquipmentSlotImage(slot);
  const padding = 8;

  if (image) {
    const width = Math.max(18, Math.abs(image.displayWidth) + padding * 2);
    const height = Math.max(18, Math.abs(image.displayHeight) + padding * 2);

    return new Phaser.Geom.Rectangle(
      image.x - image.displayWidth * image.originX - padding,
      image.y - image.displayHeight * image.originY - padding,
      width,
      height,
    );
  }

  const config = PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS[slotKey];
  const width = Math.max(18, config.displayHeight * 0.8);
  const height = Math.max(18, config.displayHeight);

  return new Phaser.Geom.Rectangle(config.localX - width * config.originX, config.localY - height * config.originY, width, height);
}

function enableCityShopHeroDrag(rig: PaperDollRig | undefined, onDragStart: (pointer: Phaser.Input.Pointer, event?: DebugInputEvent) => void): void {
  if (!rig) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    const partContainer = rig.parts[key] as Phaser.GameObjects.Container;

    partContainer.setInteractive(PAPER_DOLL_PART_HIT_AREAS[key], Phaser.Geom.Rectangle.Contains);

    if (partContainer.input) {
      partContainer.input.cursor = "ns-resize";
    }

    partContainer.on("pointerdown", (pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: DebugInputEvent) => {
      onDragStart(pointer, event);
    });
  });
}

function syncPaperDollSelectionHighlight(rig: PaperDollRig | undefined, highlightedParts: readonly RigPartKey[]): void {
  if (!rig?.selectionHighlights) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    rig.selectionHighlights?.[key]?.setVisible(highlightedParts.includes(key));
  });
}

function getNextDebugRigPartSelection(partKey: RigPartKey, shouldToggle: boolean): RigPartKey[] {
  if (!shouldToggle) {
    return [partKey];
  }

  const selectedParts = debugTuning.selectedRigParts.includes(partKey)
    ? debugTuning.selectedRigParts.filter((selectedPart) => selectedPart !== partKey)
    : [...debugTuning.selectedRigParts, partKey];

  return selectedParts;
}

function isMultiSelectPointer(pointer: Phaser.Input.Pointer): boolean {
  const event = (pointer as Phaser.Input.Pointer & { event?: { ctrlKey?: boolean; metaKey?: boolean } }).event;

  return Boolean(event?.ctrlKey || event?.metaKey);
}

function isPrimaryPointerDown(pointer: Phaser.Input.Pointer): boolean {
  const event = (pointer as Phaser.Input.Pointer & { event?: { pointerType?: string } }).event;

  if (event?.pointerType === "touch" || event?.pointerType === "pen") {
    return true;
  }

  return typeof pointer.leftButtonDown === "function" ? pointer.leftButtonDown() : true;
}

function getPointerId(pointer: Phaser.Input.Pointer): number {
  const pointerWithIds = pointer as Phaser.Input.Pointer & { id?: number; pointerId?: number };

  return pointerWithIds.pointerId ?? pointerWithIds.id ?? 0;
}

function updateRigPartsWithInteractiveDelta(partKeys: readonly RigPartKey[], delta: Partial<Pick<RigPartTuning, "x" | "y" | "angle">>): void {
  const poseKey = getActiveDebugAnimationRigPoseKey();

  if (partKeys.length === 0 || !poseKey) {
    return;
  }

  const animationKey = debugTuning.selectedBodyAnimation;
  const animation = debugTuning.bodyAnimations[animationKey];

  if (!animation) {
    return;
  }

  const nextPose = { ...animation[poseKey] };

  partKeys.forEach((partKey) => {
    nextPose[partKey] = applyRigPartInteractiveDelta(animation[poseKey][partKey] ?? defaultRigPartTuning, delta);
  });

  updateDebugTuning({
    bodyAnimations: {
      ...debugTuning.bodyAnimations,
      [animationKey]: {
        ...animation,
        [poseKey]: nextPose,
      },
    },
  });
}

function getActiveDebugAnimationRigPoseKey(): AnimationRigPoseKey | undefined {
  if (debugTuning.animationEditMode === "poseA") {
    return "base";
  }

  if (debugTuning.animationEditMode === "poseB") {
    return "breath";
  }

  return undefined;
}

function applySelectedDebugAnimationEditPose(fighter: FighterVisual): void {
  const poseKey = getActiveDebugAnimationRigPoseKey();

  if (!poseKey) {
    return;
  }

  applyBodyAnimationBlend(fighter, getSelectedDebugBodyAnimation(), poseKey === "base" ? 0 : 1);
}

function applyRigPartInteractiveDelta(part: RigPartTuning, delta: Partial<Pick<RigPartTuning, "x" | "y" | "angle">>): RigPartTuning {
  return {
    ...part,
    x: delta.x === undefined ? part.x : clampNumber(part.x + delta.x, -480, 480),
    y: delta.y === undefined ? part.y : clampNumber(part.y + delta.y, -480, 480),
    angle: delta.angle === undefined ? part.angle : clampNumber(part.angle + delta.angle, -180, 180),
  };
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, blend: number): number {
  return from + (to - from) * blend;
}

function addRigPartSelectionHighlight(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  key: PaperDollPartKey,
): Phaser.GameObjects.Graphics {
  const highlight = target.add.graphics();

  drawRigPartSelectionHighlight(highlight, key);
  highlight.setVisible(false);
  partContainer.add(highlight);

  return highlight;
}

function drawRigPartSelectionHighlight(graphics: Phaser.GameObjects.Graphics, key: PaperDollPartKey): void {
  const fill = PAPER_DOLL_SELECTION_FILL;
  const stroke = PAPER_DOLL_SELECTION_STROKE;
  const fillAlpha = 0.18;
  const strokeAlpha = 0.9;
  const strokeWidth = 5;
  const side = key.startsWith("front") ? 1 : -1;

  graphics.clear();

  if (key === "torso") {
    drawDollPolygon(
      graphics,
      [
        { x: -41, y: -108 },
        { x: 41, y: -108 },
        { x: 34, y: -25 },
        { x: 19, y: 11 },
        { x: -19, y: 11 },
        { x: -34, y: -25 },
      ],
      fill,
      stroke,
      1,
      fillAlpha,
      strokeWidth,
      strokeAlpha,
    );
    return;
  }

  if (key === "head") {
    drawDollEllipse(graphics, -42, -33, 26, 35, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    drawDollEllipse(graphics, 42, -33, 26, 35, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    drawDollEllipse(graphics, 0, -39, 84, 92, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    drawDollEllipse(graphics, 0, 0, 30, 32, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("UpperArm")) {
    drawDollEllipse(graphics, 8 * side, 35, 36, 92, -0.18 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("Forearm")) {
    drawDollEllipse(graphics, 5 * side, 29, 32, 70, -0.06 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("Hand")) {
    drawDollEllipse(graphics, 4 * side, 12, 36, 36, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("Thigh")) {
    drawDollEllipse(graphics, 3 * side, 25, 36, 78, -0.05 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("Shin")) {
    drawDollEllipse(graphics, 4 * side, 28, 33, 76, 0.04 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  drawDollEllipse(graphics, 14 * side, 8, 56, 28, -0.08 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
}

function addPaperDollPartVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  key: PaperDollPartKey,
  options: PaperDollFighterOptions,
  equipment: PaperDollEquipment,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
  faceParts: PaperDollFaceParts,
): void {
  if (key === "head" && options.headAssetKey && target.textures.exists(options.headAssetKey)) {
    const image = target.add.image(0, HEAD_ASSET_LOCAL_BOTTOM_Y, options.headAssetKey);
    applyPaperDollPartImageConfig(image, PAPER_DOLL_HEAD_ASSET_CONFIG);
    partContainer.add(image);
    addPaperDollHelmetVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.helmetAssetKey, equipment);
    addPaperDollFaceOverlay(target, partContainer, faceParts, true);
    return;
  }

  if (key === "torso" && options.torsoAssetKey && target.textures.exists(options.torsoAssetKey)) {
    const image = target.add.image(0, TORSO_ASSET_LOCAL_BOTTOM_Y, options.torsoAssetKey);
    applyPaperDollPartImageConfig(image, PAPER_DOLL_TORSO_ASSET_CONFIG);
    partContainer.add(image);
    addPaperDollBreastplateVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.breastplateAssetKey, equipment);
    return;
  }

  const assetKey = options.bodyPartAssetKeys?.[key];
  const assetConfig = PAPER_DOLL_PART_ASSET_CONFIGS[key];

  if (key === "backHand" && options.weaponMainAssetKey && target.textures.exists(options.weaponMainAssetKey)) {
    addPaperDollWeaponVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.weaponMainAssetKey, equipment);
  }

  if (assetKey && assetConfig && target.textures.exists(assetKey)) {
    const image = target.add.image(assetConfig.localX, assetConfig.localY, assetKey);
    applyPaperDollPartImageConfig(image, assetConfig);
    partContainer.add(image);
    addPaperDollArmArmorVisual(target, partContainer, key, options, equipment, equipmentLayers, equipmentAnchors);
    addPaperDollLegArmorVisual(target, partContainer, key, options, equipment, equipmentLayers, equipmentAnchors);
    return;
  }

}

function addPaperDollWeaponVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
  assetKey: string,
  equipment: PaperDollEquipment,
): void {
  const weaponContainer = createPaperDollAnchoredEquipmentContainer(target, partContainer, equipmentLayers, equipmentAnchors, "weaponMain");
  const weaponSlot = part(weaponContainer);
  const image = createPaperDollEquipmentImage(target, assetKey, PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS.weaponMain);

  weaponContainer.add(image);
  addPaperDollWeaponTopOverlay(target, partContainer, equipmentLayers, equipmentAnchors, weaponSlot, assetKey, "mainTop");
  addPaperDollWeaponTopOverlay(target, partContainer, equipmentLayers, equipmentAnchors, weaponSlot, assetKey, "bowBottom");
  registerPaperDollEquipmentSlot(weaponContainer, equipment, "weaponMain", PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS.weaponMain);
}

function addPaperDollWeaponTopOverlay(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
  weaponSlot: FighterPart,
  assetKey: string,
  crop: PaperDollWeaponOverlayCrop,
): void {
  const topContainer = createPaperDollAnchoredEquipmentContainer(target, partContainer, equipmentLayers, equipmentAnchors, "weaponMain", {
    layer: equipmentLayers.weaponTop,
    linkToAnchor: equipmentAnchors.weaponMain,
    linkToSlot: weaponSlot,
    registerAnchor: false,
  });
  const topSlot = part(topContainer);
  const topImage = createPaperDollEquipmentImage(target, assetKey, PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS.weaponMain);
  const effectiveCrop = isPaperDollBowWeaponAssetKey(assetKey) && crop === "mainTop" ? "bowTop" : crop;

  paperDollWeaponOverlayCrops.set(topSlot, effectiveCrop);
  applyPaperDollWeaponTopOverlayCrop(topImage, effectiveCrop);
  topContainer.add(topImage);
  paperDollEquipmentSlotConfigs.set(topSlot, PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS.weaponMain);
  topSlot.setVisible(isPaperDollWeaponOverlayVisible(topSlot));
}

function addPaperDollHelmetVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
  assetKey: string | undefined,
  equipment: PaperDollEquipment,
): void {
  const helmetContainer = createPaperDollAnchoredEquipmentContainer(target, partContainer, equipmentLayers, equipmentAnchors, "helmet");
  const config = PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS.helmet;

  if (assetKey && target.textures.exists(assetKey)) {
    helmetContainer.add(createPaperDollEquipmentImage(target, assetKey, config));
  } else {
    const graphics = target.add.graphics();

    drawArmorHelmetPlaceholder(graphics);
    helmetContainer.add(graphics);
  }

  registerPaperDollEquipmentSlot(helmetContainer, equipment, "helmet", config);
}

function addPaperDollBreastplateVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
  assetKey: string | undefined,
  equipment: PaperDollEquipment,
): void {
  const breastplateContainer = createPaperDollAnchoredEquipmentContainer(target, partContainer, equipmentLayers, equipmentAnchors, "breastplate");
  const config = PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS.breastplate;

  if (assetKey && target.textures.exists(assetKey)) {
    breastplateContainer.add(createPaperDollEquipmentImage(target, assetKey, config));
  } else {
    const graphics = target.add.graphics();

    drawArmorBreastplatePlaceholder(graphics);
    breastplateContainer.add(graphics);
  }

  registerPaperDollEquipmentSlot(breastplateContainer, equipment, "breastplate", config);
}

function addPaperDollArmArmorVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  key: PaperDollPartKey,
  options: PaperDollFighterOptions,
  equipment: PaperDollEquipment,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
): void {
  if (key === "backUpperArm") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.backShoulderguardAssetKey, "backShoulderguard", equipment);
    return;
  }

  if (key === "frontUpperArm") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.frontShoulderguardAssetKey, "frontShoulderguard", equipment);
    return;
  }

  if (key === "backForearm") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.backWristAssetKey, "backWrist", equipment);
    return;
  }

  if (key === "frontForearm") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.frontWristAssetKey, "frontWrist", equipment);
    return;
  }

  if (key === "backHand") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.backGloveAssetKey, "backGlove", equipment);
    return;
  }

  if (key === "frontHand") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.frontGloveAssetKey, "frontGlove", equipment);
  }
}

function addPaperDollLegArmorVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  key: PaperDollPartKey,
  options: PaperDollFighterOptions,
  equipment: PaperDollEquipment,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
): void {
  if (key === "backThigh") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.backGreaveAssetKey, "backGreave", equipment);
    return;
  }

  if (key === "frontThigh") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.frontGreaveAssetKey, "frontGreave", equipment);
    return;
  }

  if (key === "backShin") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.backShinguardAssetKey, "backShinguard", equipment);
    return;
  }

  if (key === "frontShin") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.frontShinguardAssetKey, "frontShinguard", equipment);
    return;
  }

  if (key === "backFoot") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.backBootAssetKey, "backBoot", equipment);
    return;
  }

  if (key === "frontFoot") {
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.frontBootAssetKey, "frontBoot", equipment);
  }
}

function addPaperDollEquipmentImageVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
  assetKey: string | undefined,
  slotKey: PaperDollEquipmentSlotKey,
  equipment: PaperDollEquipment,
): void {
  const armorContainer = createPaperDollAnchoredEquipmentContainer(target, partContainer, equipmentLayers, equipmentAnchors, slotKey);
  const config = PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS[slotKey];

  if (assetKey && target.textures.exists(assetKey)) {
    armorContainer.add(createPaperDollEquipmentImage(target, assetKey, config));
  }

  registerPaperDollEquipmentSlot(armorContainer, equipment, slotKey, config);
}

function createPaperDollAnchoredEquipmentContainer(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
  slotKey: PaperDollEquipmentSlotKey,
  options: {
    layer?: Phaser.GameObjects.Container;
    linkToAnchor?: FighterPart;
    linkToSlot?: FighterPart;
    registerAnchor?: boolean;
  } = {},
): Phaser.GameObjects.Container {
  const anchorContainer = target.add.container(0, 0);
  const equipmentContainer = target.add.container(0, 0);
  const anchor = part(anchorContainer);
  const equipmentLayer = options.layer ?? getPaperDollEquipmentLayer(equipmentLayers, slotKey);

  syncPaperDollEquipmentAnchor(anchor, part(partContainer));
  anchorContainer.add(equipmentContainer);
  equipmentLayer.add(anchorContainer);
  if (options.registerAnchor !== false) {
    equipmentAnchors[slotKey] = anchor;
  }
  linkPaperDollEquipmentAnchor(options.linkToAnchor, anchor);
  linkPaperDollEquipmentSlot(options.linkToSlot, part(equipmentContainer));

  return equipmentContainer;
}

function createPaperDollEquipmentImage(target: Phaser.Scene, assetKey: string, config: PaperDollPartAssetConfig): Phaser.GameObjects.Image {
  const image = target.add.image(config.localX, config.localY, assetKey);

  applyPaperDollEquipmentImageConfig(image, config);

  return image;
}

function getPaperDollWeaponOverlayCrop(slot: FighterPart, textureKey: string): PaperDollWeaponOverlayCrop {
  const crop = paperDollWeaponOverlayCrops.get(slot) ?? "mainTop";

  return isPaperDollBowWeaponAssetKey(textureKey) && crop === "mainTop" ? "bowTop" : crop;
}

function isPaperDollWeaponOverlayVisible(slot: FighterPart): boolean {
  const crop = paperDollWeaponOverlayCrops.get(slot);

  if (crop !== "bowBottom") {
    return true;
  }

  const image = getPaperDollEquipmentSlotImage(slot);

  return Boolean(image && isPaperDollBowWeaponAssetKey(image.texture.key));
}

function isPaperDollEquipmentSlotVisible(slot: FighterPart): boolean {
  return ((slot as Phaser.GameObjects.GameObject & { visible?: boolean }).visible) ?? true;
}

function getPaperDollEquipmentSlotImage(slot: FighterPart): Phaser.GameObjects.Image | undefined {
  const slotContainer = slot as Phaser.GameObjects.Container;

  return slotContainer.list.find((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image);
}

function applyPaperDollWeaponTopOverlayCrop(image: Phaser.GameObjects.Image, crop: PaperDollWeaponOverlayCrop): void {
  const width = image.frame.cutWidth;
  const frameHeight = image.frame.cutHeight;

  if (crop === "bowTop") {
    const height = Math.max(1, Math.round(frameHeight * WEAPON_BOW_TOP_OVERLAY_CROP_RATIO));

    image.setCrop(0, 0, width, height);
    return;
  }

  if (crop === "bowBottom") {
    const y = Math.min(frameHeight - 1, Math.round(frameHeight * (1 - WEAPON_BOW_BOTTOM_OVERLAY_CROP_RATIO)));

    image.setCrop(0, y, width, frameHeight - y);
    return;
  }

  image.setCrop(0, 0, width, Math.max(1, Math.round(frameHeight * WEAPON_MAIN_TOP_OVERLAY_CROP_RATIO)));
}

function isPaperDollBowWeaponAssetKey(assetKey: string): boolean {
  return assetKey.includes("weapon-bow");
}

function applyPaperDollEquipmentImageConfig(image: Phaser.GameObjects.Image, config: PaperDollPartAssetConfig): void {
  applyPaperDollPartImageConfig(image, config);
}

function applyPaperDollPartImageConfig(image: Phaser.GameObjects.Image, config: PaperDollPartAssetConfig): void {
  image.x = config.localX;
  image.y = config.localY;
  image.setOrigin(config.originX, config.originY);
  image.displayHeight = config.displayHeight;
  image.scaleX = image.scaleY;
}

function registerPaperDollEquipmentSlot(
  container: Phaser.GameObjects.Container,
  equipment: PaperDollEquipment,
  slotKey: PaperDollEquipmentSlotKey,
  config: PaperDollPartAssetConfig,
): void {
  const slot = part(container);

  equipment[slotKey] = slot;
  paperDollEquipmentSlotConfigs.set(slot, config);
}

function drawArmorHelmetPlaceholder(graphics: Phaser.GameObjects.Graphics): void {
  graphics.clear();
  drawDollPolygon(
    graphics,
    [
      { x: -42, y: -40 },
      { x: -36, y: -67 },
      { x: -15, y: -89 },
      { x: 14, y: -89 },
      { x: 36, y: -67 },
      { x: 42, y: -40 },
      { x: 26, y: -51 },
      { x: 0, y: -56 },
      { x: -26, y: -51 },
    ],
    ARMOR_PLACEHOLDER_FILL,
    ARMOR_PLACEHOLDER_OUTLINE,
    1,
    0.92,
    4,
  );
  drawDollLine(graphics, -32, -50, 32, -50, ARMOR_PLACEHOLDER_DARK, 1, 4, 0.75);
  drawDollLine(graphics, -13, -82, 9, -86, ARMOR_PLACEHOLDER_HIGHLIGHT, 1, 3, 0.65);
}

function drawArmorBreastplatePlaceholder(graphics: Phaser.GameObjects.Graphics): void {
  graphics.clear();
  drawDollPolygon(
    graphics,
    [
      { x: -39, y: -103 },
      { x: 39, y: -103 },
      { x: 34, y: -55 },
      { x: 18, y: -14 },
      { x: 0, y: 7 },
      { x: -18, y: -14 },
      { x: -34, y: -55 },
    ],
    ARMOR_PLACEHOLDER_FILL,
    ARMOR_PLACEHOLDER_OUTLINE,
    1,
    0.9,
    4,
  );
  drawDollLine(graphics, 0, -96, 0, -5, ARMOR_PLACEHOLDER_DARK, 1, 3, 0.65);
  drawDollLine(graphics, -29, -72, 29, -72, ARMOR_PLACEHOLDER_DARK, 1, 3, 0.55);
  drawDollLine(graphics, -24, -91, -8, -97, ARMOR_PLACEHOLDER_HIGHLIGHT, 1, 3, 0.65);
}

function addPaperDollFaceOverlay(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  faceParts: PaperDollFaceParts,
  shouldCoverBakedEyes: boolean,
): void {
  if (shouldCoverBakedEyes) {
    const leftCover = target.add.ellipse(HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_COVER_WIDTH, HEAD_FACE_EYE_COVER_HEIGHT, HEAD_FACE_EYE_WHITE);
    const rightCover = target.add.ellipse(HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_COVER_WIDTH, HEAD_FACE_EYE_COVER_HEIGHT, HEAD_FACE_EYE_WHITE);

    partContainer.add([leftCover, rightCover]);
    faceParts.eyeLeftCover = part(leftCover);
    faceParts.eyeRightCover = part(rightCover);
  }

  const eyeLeft = target.add.ellipse(HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_WIDTH, HEAD_FACE_EYE_HEIGHT, HEAD_FACE_EYE_BLACK);
  const eyeRight = target.add.ellipse(HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_WIDTH, HEAD_FACE_EYE_HEIGHT, HEAD_FACE_EYE_BLACK);

  partContainer.add([eyeLeft, eyeRight]);
  faceParts.eyeLeft = part(eyeLeft);
  faceParts.eyeRight = part(eyeRight);
}

function drawDollEllipse(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  fill: number,
  outline: number,
  scale: number,
  fillAlpha = 1,
  strokeWidth = 4,
  strokeAlpha = 1,
): void {
  const points = createEllipsePoints(x, y, width / 2, height / 2, rotation, 28);
  drawDollPolygon(graphics, points, fill, outline, scale, fillAlpha, strokeWidth, strokeAlpha);
}

function drawDollPolygon(
  graphics: Phaser.GameObjects.Graphics,
  points: { x: number; y: number }[],
  fill: number,
  outline: number,
  scale: number,
  fillAlpha = 1,
  strokeWidth = 4,
  strokeAlpha = 1,
): void {
  if (points.length === 0) {
    return;
  }

  graphics.fillStyle(fill, fillAlpha);
  graphics.lineStyle(Math.max(1, strokeWidth * scale), outline, strokeAlpha);
  graphics.beginPath();
  graphics.moveTo(points[0].x * scale, points[0].y * scale);

  for (const point of points.slice(1)) {
    graphics.lineTo(point.x * scale, point.y * scale);
  }

  graphics.closePath();

  if (fillAlpha > 0) {
    graphics.fillPath();
  }

  if (strokeWidth > 0 && strokeAlpha > 0) {
    graphics.strokePath();
  }
}

function drawDollLine(
  graphics: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: number,
  scale: number,
  width: number,
  alpha = 1,
): void {
  graphics.lineStyle(Math.max(1, width * scale), color, alpha);
  graphics.beginPath();
  graphics.moveTo(x1 * scale, y1 * scale);
  graphics.lineTo(x2 * scale, y2 * scale);
  graphics.strokePath();
}

function createEllipsePoints(
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
  segments: number,
): { x: number; y: number }[] {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < segments; i += 1) {
    const angle = (Math.PI * 2 * i) / segments;
    const localX = Math.cos(angle) * radiusX;
    const localY = Math.sin(angle) * radiusY;

    points.push({
      x: x + localX * cos - localY * sin,
      y: y + localX * sin + localY * cos,
    });
  }

  return points;
}

function renderScene(target: ArenaScene, current: CombatState): void {
  if (!target.visuals) {
    return;
  }

  positionFightersForState(target, target.visuals, current);
  updateCamera(target, current);
  setHud(target.visuals.playerHud, current.player);
  setHud(target.visuals.enemyHud, current.enemy);

  if (!target.visuals.player.isShattered) {
    setFighterAlpha(target.visuals.player, 1);
  }

  if (!target.visuals.enemy.isShattered) {
    setFighterAlpha(target.visuals.enemy, 1);
  }
}

function resetDeathEffectsForLiveFighters(target: ArenaScene, visuals: ArenaVisuals, current: CombatState): void {
  if (current.result !== "playing") {
    return;
  }

  if (current.player.hp > 0) {
    resetFighterShatter(target, visuals.player);
  }

  if (current.enemy.hp > 0) {
    resetFighterShatter(target, visuals.enemy);
  }
}

function syncEnemyVisualForState(
  target: ArenaScene,
  visuals: ArenaVisuals,
  previous: CombatState | undefined,
  current: CombatState,
): void {
  const previousLoadoutKey = previous ? getFighterLoadoutKey(previous.enemy) : undefined;
  const currentLoadoutKey = getFighterLoadoutKey(current.enemy);

  if (previousLoadoutKey === currentLoadoutKey) {
    return;
  }

  destroyFighterVisual(target, visuals.enemy);
  visuals.enemy = createPaperDollFighter(
    target,
    createEnemyPaperDollOptions(DEFAULT_STAGE_ORIGIN_X + DEFAULT_ENEMY_STAGE_X, FIGHTER_BASE_Y, current.enemy),
    target.arenaLayers?.actors,
  );
}

function getFighterLoadoutKey(fighter: FighterState): string {
  return JSON.stringify({
    equipment: fighter.equipment ?? null,
    visualPreset: fighter.visualPreset ?? null,
  });
}

function destroyFighterVisual(target: Phaser.Scene, fighter: FighterVisual): void {
  const parts = getFighterParts(fighter);

  fighter.isShatterScheduled = false;
  fighter.isShattered = true;
  target.tweens.killTweensOf(parts);
  parts.forEach((part) => part.destroy());
}

function getArenaEffectsLayer(target: Phaser.Scene): Phaser.GameObjects.Container | undefined {
  return (target as Partial<ArenaScene>).arenaLayers?.effects;
}

function addToArenaEffectsLayer(target: Phaser.Scene, gameObject: Phaser.GameObjects.GameObject): void {
  getArenaEffectsLayer(target)?.add(gameObject);
}

function getArenaEffectsLayerScale(target: Phaser.Scene): number {
  return Math.max(0.001, Math.abs(getArenaEffectsLayer(target)?.scaleX ?? 1));
}

function scheduleDeathEffects(target: ArenaScene, current: CombatState): void {
  if (!target.visuals || current.result === "playing") {
    return;
  }

  if (current.player.hp <= 0) {
    scheduleFighterShatter(target, target.visuals.player, -1);
  }

  if (current.enemy.hp <= 0) {
    scheduleFighterShatter(target, target.visuals.enemy, 1);
  }
}

function scheduleFighterShatter(target: ArenaScene, fighter: FighterVisual, worldDirection: -1 | 1): void {
  if (fighter.isShattered || fighter.isShatterScheduled) {
    return;
  }

  fighter.isShatterScheduled = true;
  target.time.delayedCall(DEATH_SHATTER_DELAY, () => {
    if (!fighter.isShatterScheduled || fighter.isShattered) {
      return;
    }

    fighter.isShatterScheduled = false;
    shatterFighter(target, fighter, worldDirection);
  });
}

function resetFighterShatter(target: Phaser.Scene, fighter: FighterVisual): void {
  if (!fighter.isShattered && !fighter.isShatterScheduled) {
    return;
  }

  fighter.isShattered = false;
  fighter.isShatterScheduled = false;
  fighter.bodyAnimationLockedUntil = 0;

  const rig = fighter.paperDollRig;

  if (rig) {
    target.tweens.killTweensOf([...Object.values(rig.parts), ...getPaperDollEquipmentAnchorParts(rig)]);
  }

  setFighterAlpha(fighter, 1);
  syncFighterShadowVisibility(fighter, 1);
}

function shatterFighter(target: Phaser.Scene, fighter: FighterVisual, worldDirection: -1 | 1): void {
  const rig = fighter.paperDollRig;

  if (!rig) {
    setFighterAlpha(fighter, 0.35);
    return;
  }

  fighter.isShattered = true;
  fighter.bodyAnimationLockedUntil = Number.POSITIVE_INFINITY;
  fighter.name.setVisible(false);
  fighter.shadow.setVisible(false);
  fighter.lowShadow.setVisible(false);
  target.tweens.killTweensOf([rig.root, ...Object.values(rig.parts), ...getPaperDollEquipmentAnchorParts(rig)]);
  setFighterAlpha(fighter, 1);
  createDust(target, rig.root.x, rig.root.y - 6);

  const rootDirection = Math.sign(rig.root.scaleX) || 1;
  const localBlastDirection = worldDirection / rootDirection;

  RIG_PART_KEYS.forEach((key, index) => {
    const part = rig.parts[key];
    const anchors = getPaperDollEquipmentAnchorsForPart(rig, key);
    const targets = [part, ...anchors];
    const startX = part.x;
    const startY = part.y;
    const startAngle = part.angle;
    const side = key.startsWith("front") ? 1 : key.startsWith("back") ? -1 : 0;
    const delay = index * 9 + Math.random() * 22;
    const liftDuration = 120 + Math.random() * 70;
    const scatterX = localBlastDirection * (44 + Math.random() * 104) + side * (18 + Math.random() * 42);
    const liftY = startY - (34 + Math.random() * 64);
    const landingY = 54 + Math.random() * 78 + (key.endsWith("Foot") ? 22 : 0);
    const spin = (90 + Math.random() * 250) * (Math.random() < 0.5 ? -1 : 1);

    part.setVisible(true);
    anchors.forEach((anchor) => anchor.setVisible(true));

    target.tweens.add({
      targets,
      x: startX + scatterX * 0.42,
      y: liftY,
      angle: startAngle + spin * 0.28,
      duration: liftDuration,
      delay,
      ease: "Quad.easeOut",
    });

    target.tweens.add({
      targets,
      x: startX + scatterX,
      y: landingY,
      angle: startAngle + spin,
      duration: 480 + Math.random() * 180,
      delay: delay + liftDuration,
      ease: "Bounce.easeOut",
    });
  });
}

function setHud(hud: HudVisual, fighter: FighterState): void {
  const maxHp = getFighterMaxHp(fighter);
  const maxArmor = getFighterMaxArmor(fighter);
  const maxStamina = getFighterMaxStamina(fighter);

  hud.hpFill.displayWidth = 226 * (fighter.hp / maxHp);
  hud.armorFill.displayWidth = maxArmor > 0 ? 226 * (fighter.armor / maxArmor) : 0;
  hud.staminaFill.displayWidth = 226 * (fighter.stamina / maxStamina);
  hud.label.setText(`HP ${fighter.hp}/${maxHp}  ARM ${fighter.armor}/${maxArmor}  STA ${fighter.stamina}/${maxStamina}`);
}

function setFighterAlpha(fighter: FighterVisual, alpha: number): void {
  getFighterParts(fighter).forEach((part) => {
    if (part === fighter.shadow) {
      const shadowVisible = fighter.castsShadow && getArenaShadowMode() === "high" && !fighter.isShattered;

      part.setVisible(shadowVisible);
      part.setAlpha(shadowVisible ? alpha * debugTuning.shadowAlpha : 0);
      return;
    }

    if (part === fighter.lowShadow) {
      const shadowVisible = fighter.castsShadow && getArenaShadowMode() === "low" && !fighter.isShattered;

      part.setVisible(shadowVisible);
      part.setAlpha(shadowVisible ? alpha * 0.26 : 0);
      return;
    }

    part.setAlpha(alpha);
  });
}

function positionFightersForState(target: Phaser.Scene, visuals: ArenaVisuals, current: CombatState): void {
  const layout = getStageLayout(current, getActiveDebugTuning());
  const shouldSnap = isDebugTuningActive();

  if (!visuals.player.isShattered) {
    positionFighterForLayout(target, visuals.player, layout.playerX, layout.playerScale, layout.playerY, shouldSnap);
  }

  if (!visuals.enemy.isShattered) {
    positionFighterForLayout(target, visuals.enemy, layout.enemyX, layout.enemyScale, layout.enemyY, shouldSnap);
  }
}

function positionFighterForLayout(
  target: Phaser.Scene,
  fighter: FighterVisual,
  x: number,
  scale: number,
  feetY: number,
  shouldSnap: boolean,
): void {
  if (shouldSnap) {
    setFighterXImmediate(fighter, x);
  } else {
    setFighterX(target, fighter, x);
  }

  applyFighterTuning(fighter, scale, feetY);
}

function applyFighterTuning(fighter: FighterVisual, scale: number, feetY: number): void {
  if (fighter.paperDollRig) {
    applyPaperDollRigTuning(fighter, scale, feetY);
  }
}

function updateCamera(target: ArenaScene, current: CombatState): void {
  const shouldSnap = isDebugTuningActive();
  const isPendingEnemyResponse = current.result === "playing" && current.activeTurn === "enemy";
  const layers = target.arenaLayers;

  if (!layers) {
    return;
  }

  syncArenaMainCamera(target);

  if (target.arenaEntryTransitionState === "running") {
    return;
  }

  if (isPendingEnemyResponse && target.cameraFrameInitialized) {
    killArenaTransformTweens(target, layers);
    return;
  }

  const debug = getActiveDebugTuning();
  const cameraTarget = getCameraTarget(current, debug, getArenaViewport(target));

  target.cameraFrameInitialized = true;
  killArenaTransformTweens(target, layers);

  if (shouldSnap) {
    applyArenaTransform(layers, cameraTarget, debug);
    return;
  }

  getArenaLayerTransforms(layers, cameraTarget, debug).forEach((transform) => {
    target.tweens.add({
      targets: transform.layer,
      x: transform.x,
      y: transform.y,
      scaleX: transform.scale,
      scaleY: transform.scale,
      duration: ARENA_CAMERA_TWEEN_DURATION_MS,
      ease: ARENA_CAMERA_TWEEN_EASE,
    });
  });
  target.tweens.add({
    targets: layers.midShade,
    amount: getArenaMidLayerShade(cameraTarget, debug),
    duration: ARENA_CAMERA_TWEEN_DURATION_MS,
    ease: ARENA_CAMERA_TWEEN_EASE,
    onUpdate: () => {
      syncArenaMidLayerTint(layers);
    },
    onComplete: () => {
      syncArenaMidLayerTint(layers);
    },
  });
}

function getArenaEntryStartCameraTarget(cameraTarget: CameraTarget): CameraTarget {
  const zoom = cameraTarget.zoom * ARENA_ENTRY_START_ZOOM_MULTIPLIER;

  return {
    ...cameraTarget,
    zoom,
    closeness: Math.max(cameraTarget.closeness, ARENA_ENTRY_START_CLOSENESS),
    scrollX: cameraTarget.centerX - cameraTarget.viewportWidth / (2 * zoom),
    scrollY: cameraTarget.centerY - cameraTarget.viewportHeight / (2 * zoom),
  };
}

function tweenArenaTransform(
  target: ArenaScene,
  layers: ArenaLayers,
  cameraTarget: CameraTarget,
  duration: number,
  ease: string,
  tuning?: ArenaDebugTuning,
): Promise<void> {
  const transforms = getArenaLayerTransforms(layers, cameraTarget, tuning);

  if (transforms.length <= 0) {
    setArenaMidLayerShade(layers, getArenaMidLayerShade(cameraTarget, tuning));
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let remainingTweens = transforms.length + 1;
    let resolved = false;

    function finish(): void {
      if (resolved) {
        return;
      }

      resolved = true;
      target.events.off(Phaser.Scenes.Events.SHUTDOWN, finish);
      resolve();
    }

    function completeTween(): void {
      remainingTweens -= 1;

      if (remainingTweens <= 0) {
        finish();
      }
    }

    target.events.once(Phaser.Scenes.Events.SHUTDOWN, finish);

    target.tweens.add({
      targets: layers.midShade,
      amount: getArenaMidLayerShade(cameraTarget, tuning),
      duration,
      ease,
      onUpdate: () => {
        syncArenaMidLayerTint(layers);
      },
      onComplete: () => {
        syncArenaMidLayerTint(layers);
        completeTween();
      },
    });

    transforms.forEach((transform) => {
      target.tweens.add({
        targets: transform.layer,
        x: transform.x,
        y: transform.y,
        scaleX: transform.scale,
        scaleY: transform.scale,
        duration,
        ease,
        onComplete: () => {
          completeTween();
        },
      });
    });
  });
}

function applyArenaTransform(layers: ArenaLayers, cameraTarget: ReturnType<typeof getCameraTarget>, tuning?: ArenaDebugTuning): void {
  getArenaLayerTransforms(layers, cameraTarget, tuning).forEach((transform) => {
    transform.layer.setPosition(transform.x, transform.y);
    transform.layer.setScale(transform.scale);
  });
  setArenaMidLayerShade(layers, getArenaMidLayerShade(cameraTarget, tuning));
}

function getArenaLayerTransforms(layers: ArenaLayers, cameraTarget: ReturnType<typeof getCameraTarget>, tuning?: ArenaDebugTuning): ArenaLayerTransform[] {
  const parallax = getArenaLayerParallax(tuning);

  return [
    getArenaLayerTransform(layers.back, cameraTarget, parallax.back),
    getArenaLayerTransform(layers.mid, cameraTarget, parallax.mid),
    getArenaLayerTransform(layers.ground, cameraTarget, parallax.ground),
    getArenaLayerTransform(layers.actors, cameraTarget, parallax.actors),
    getArenaLayerTransform(layers.effects, cameraTarget, parallax.effects),
  ];
}

function getArenaLayerParallax(tuning?: ArenaDebugTuning): Record<ArenaLayerKey, ArenaLayerParallax> {
  return {
    back: {
      followX: tuning?.arenaBackFollowX ?? ARENA_LAYER_PARALLAX.back.followX,
      followY: tuning?.arenaBackFollowY ?? ARENA_LAYER_PARALLAX.back.followY,
      zoom: tuning?.arenaBackZoom ?? ARENA_LAYER_PARALLAX.back.zoom,
      lookUpY: tuning?.arenaBackLookUpY ?? ARENA_LAYER_PARALLAX.back.lookUpY,
    },
    mid: {
      followX: tuning?.arenaMidFollowX ?? ARENA_LAYER_PARALLAX.mid.followX,
      followY: tuning?.arenaMidFollowY ?? ARENA_LAYER_PARALLAX.mid.followY,
      zoom: tuning?.arenaMidZoom ?? ARENA_LAYER_PARALLAX.mid.zoom,
      lookUpY: tuning?.arenaMidLookUpY ?? ARENA_LAYER_PARALLAX.mid.lookUpY,
    },
    ground: {
      followX: tuning?.arenaGroundFollowX ?? ARENA_LAYER_PARALLAX.ground.followX,
      followY: tuning?.arenaGroundFollowY ?? ARENA_LAYER_PARALLAX.ground.followY,
      zoom: tuning?.arenaGroundZoom ?? ARENA_LAYER_PARALLAX.ground.zoom,
      lookUpY: tuning?.arenaGroundLookUpY ?? ARENA_LAYER_PARALLAX.ground.lookUpY,
    },
    actors: ARENA_LAYER_PARALLAX.actors,
    effects: ARENA_LAYER_PARALLAX.effects,
  };
}

function getArenaLayerTransform(
  layer: Phaser.GameObjects.Container,
  cameraTarget: ReturnType<typeof getCameraTarget>,
  parallax: ArenaLayerParallax,
): ArenaLayerTransform {
  const scale = 1 + (cameraTarget.zoom - 1) * parallax.zoom;
  const centerX = GAME_WIDTH / 2 + (cameraTarget.centerX - GAME_WIDTH / 2) * parallax.followX;
  const centerY = GAME_HEIGHT / 2 + (cameraTarget.centerY - GAME_HEIGHT / 2) * parallax.followY;

  return {
    layer,
    x: cameraTarget.viewportWidth / 2 - centerX * scale,
    y: cameraTarget.viewportHeight / 2 - centerY * scale + cameraTarget.closeness * parallax.lookUpY,
    scale,
  };
}

function killArenaTransformTweens(target: Phaser.Scene, layers: ArenaLayers): void {
  target.tweens.killTweensOf([...layers.all, layers.midShade]);
}

function setArenaMidLayerShade(layers: ArenaLayers, amount: number): void {
  layers.midShade.amount = clamp01(amount);
  syncArenaMidLayerTint(layers);
}

function syncArenaMidLayerTint(layers: ArenaLayers): void {
  layers.midImage?.setTint(mixColor(ARENA_MID_LAYER_BASE_TINT, ARENA_MID_LAYER_CLOSE_TINT, layers.midShade.amount));
}

function getArenaMidLayerShade(cameraTarget: CameraTarget, tuning?: ArenaDebugTuning): number {
  const maxDarken = clamp01(tuning?.arenaMidZoomDarken ?? DEFAULT_ARENA_MID_ZOOM_DARKEN);

  return smoothStep(clamp01(cameraTarget.closeness)) * maxDarken;
}

function mixColor(from: number, to: number, amount: number): number {
  const ratio = clamp01(amount);
  const fromR = (from >> 16) & 0xff;
  const fromG = (from >> 8) & 0xff;
  const fromB = from & 0xff;
  const toR = (to >> 16) & 0xff;
  const toG = (to >> 8) & 0xff;
  const toB = to & 0xff;
  const r = Math.round(fromR + (toR - fromR) * ratio);
  const g = Math.round(fromG + (toG - fromG) * ratio);
  const b = Math.round(fromB + (toB - fromB) * ratio);

  return (r << 16) | (g << 8) | b;
}

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function syncArenaMainCamera(target: Phaser.Scene): void {
  const viewport = getArenaViewport(target);

  target.cameras.main.setViewport(0, 0, viewport.width, viewport.height);
  target.cameras.main.setBounds(0, 0, viewport.width, viewport.height);
  target.cameras.main.setScroll(0, 0);
  target.cameras.main.setZoom(1);
}

function getArenaViewport(target: Phaser.Scene): CameraViewport {
  const height = Math.max(1, target.scale.height || GAME_HEIGHT);

  return {
    width: Math.max(1, target.scale.width || GAME_WIDTH),
    height,
    safeBottom: getBattleSafeArea(undefined, height).bottom,
  };
}

function getActiveDebugTuning(): typeof debugTuning | undefined {
  return isDebugTuningActive() ? debugTuning : undefined;
}

function isDebugTuningActive(): boolean {
  return typeof document !== "undefined" && document.body.classList.contains("debug-active");
}

function getActiveBodyAnimation(key: BodyAnimationKey): BodyAnimationTuning {
  if (isDebugTuningActive()) {
    return debugTuning.bodyAnimations[key] ?? DEFAULT_BODY_ANIMATIONS[key];
  }

  return DEFAULT_BODY_ANIMATIONS[key];
}

function getActiveSlashArc(key: SlashArcAttackKey): SlashArcTuning {
  if (isDebugTuningActive()) {
    return debugTuning.slashArcs[key] ?? DEFAULT_SLASH_ARCS[key];
  }

  return DEFAULT_SLASH_ARCS[key];
}

function getSelectedDebugBodyAnimation(): BodyAnimationTuning {
  return debugTuning.bodyAnimations[debugTuning.selectedBodyAnimation] ?? DEFAULT_BODY_ANIMATIONS[debugTuning.selectedBodyAnimation];
}

function setFighterXImmediate(fighter: FighterVisual, nextX: number): void {
  const delta = nextX - fighter.body.x;

  if (Math.abs(delta) < 0.5) {
    return;
  }

  getFighterParts(fighter).forEach((part) => {
    part.x += delta;
  });
}

function setFighterX(target: Phaser.Scene, fighter: FighterVisual, nextX: number): void {
  const delta = nextX - fighter.body.x;

  if (Math.abs(delta) < 0.5) {
    return;
  }

  getFighterParts(fighter).forEach((part) => {
    target.tweens.add({
      targets: part,
      x: part.x + delta,
      duration: FIGHTER_MOVE_DURATION,
      ease: "Sine.easeInOut",
    });
  });
}
function getFighterParts(fighter: FighterVisual): FighterPart[] {
  if (fighter.movableParts) {
    return [...fighter.movableParts];
  }

  return [
    fighter.body,
    fighter.head,
    fighter.eyeLeft,
    fighter.eyeRight,
    fighter.helmet,
    fighter.plume,
    fighter.sword,
    fighter.armFront,
    fighter.armBack,
    fighter.legFront,
    fighter.legBack,
    fighter.shadow,
    fighter.lowShadow,
    fighter.name,
    ...(fighter.extraParts ?? []),
  ] as FighterPart[];
}

function playBodyAnimationOnce(target: Phaser.Scene, fighter: FighterVisual, animation: BodyAnimationTuning): Promise<void> {
  const rig = fighter.paperDollRig;
  const animationAmount = getArenaAnimationAmount();

  if (!rig || !animation.enabled || animationAmount <= 0) {
    return Promise.resolve();
  }

  const duration = Math.max(1, animation.duration);
  const lockedUntil = target.time.now + duration;

  fighter.bodyAnimationLockedUntil = lockedUntil;
  target.tweens.killTweensOf([...Object.values(rig.parts), ...getPaperDollEquipmentAnchorParts(rig)]);
  applyBodyAnimationBlend(fighter, animation, 0);

  return new Promise((resolve) => {
    let isResolved = false;
    const finish = (): void => {
      if (isResolved) {
        return;
      }

      isResolved = true;
      if (fighter.bodyAnimationLockedUntil === lockedUntil) {
        fighter.bodyAnimationLockedUntil = 0;
      }
      resolve();
    };

    target.time.delayedCall(duration + 60, finish);
    target.tweens.addCounter({
      from: 0,
      to: animationAmount,
      duration: Math.max(1, duration / 2),
      yoyo: true,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        applyBodyAnimationBlend(fighter, animation, tween.getValue());
      },
      onComplete: finish,
    });
  });
}

function animateAction(
  target: Phaser.Scene,
  actor: FighterVisual,
  _opponent: FighterVisual,
  actionId: ActionId,
  direction: "left" | "right",
  weaponClass?: HeroWeaponClass,
): Promise<void> {
  const sign = direction === "right" ? 1 : -1;
  const animationAmount = getArenaAnimationAmount();

  if (actionId === "forward" || actionId === "back") {
    const actionAnimation = playBodyAnimationOnce(target, actor, getActiveBodyAnimation("walkCycle"));

    showFloatingText(target, actor.body.x, actor.body.y - 120, actionId === "forward" ? "STEP" : "BACK", "#ffe7a4");
    return actionAnimation;
  }

  if (actionId === "lunge") {
    return playBodyAnimationOnce(target, actor, getActiveBodyAnimation("lunge"));
  }

  if (actionId === "taunt") {
    return playBodyAnimationOnce(target, actor, getActiveBodyAnimation("taunt"));
  }

  if (actionId === "rest") {
    return playBodyAnimationOnce(target, actor, getActiveBodyAnimation("rest"));
  }

  const actionAnimations: Promise<void>[] = [];

  if (isAttackBodyAnimationKey(actionId)) {
    const bodyAnimationKey: BodyAnimationKey = weaponClass === "bow" ? "bowShot" : actionId;

    actionAnimations.push(playBodyAnimationOnce(target, actor, getActiveBodyAnimation(bodyAnimationKey)));
    if (weaponClass !== "bow" && areArenaVfxEnabled()) {
      showSlashArc(target, actor, actionId, direction);
    }
  }

  if (animationAmount > 0 && weaponClass !== "bow") {
    actionAnimations.push(
      new Promise((resolve) => {
        target.tweens.add({
          targets: actor.sword,
          angle: actor.sword.angle - 32 * sign * animationAmount,
          duration: 110,
          yoyo: true,
          ease: "Back.easeOut",
          onComplete: () => resolve(),
        });
      }),
    );
  }

  return Promise.all(actionAnimations).then(() => undefined);
}

function isAttackBodyAnimationKey(actionId: ActionId): actionId is AttackBodyAnimationKey {
  return actionId === "light" || actionId === "medium" || actionId === "heavy";
}

function showSlashArc(target: Phaser.Scene, actor: FighterVisual, actionId: AttackBodyAnimationKey, direction: "left" | "right"): void {
  if (!areArenaVfxEnabled()) {
    return;
  }

  const config = getActiveSlashArc(actionId);
  const sign = direction === "right" ? 1 : -1;
  const visualScale = Math.max(0.65, Math.min(1.45, actor.debugScale / 0.3));
  const x = actor.body.x + sign * config.offsetX * visualScale;
  const y = actor.body.y + config.offsetY * visualScale;
  const slash = target.add.graphics();

  slash.setPosition(x, y);
  slash.setDepth(SLASH_ARC_DEPTH);
  slash.setAlpha(config.alpha);
  slash.setBlendMode(Phaser.BlendModes.ADD);
  slash.setAngle(config.angle * sign);
  slash.setScale(sign * 0.82 * visualScale, 0.82 * visualScale);

  drawSlashArc(slash, config);
  addToArenaEffectsLayer(target, slash);

  target.tweens.add({
    targets: slash,
    alpha: 0,
    scaleX: sign * 1.22 * visualScale,
    scaleY: 1.22 * visualScale,
    angle: slash.angle + config.sweep * sign,
    duration: config.duration,
    ease: "Quad.easeOut",
    onComplete: () => slash.destroy(),
  });
}

function drawSlashArc(graphics: Phaser.GameObjects.Graphics, config: SlashArcTuning): void {
  graphics.lineStyle(config.width + 4, 0x35180d, 0.46);
  graphics.beginPath();
  graphics.arc(0, 0, config.radius + 2, config.startAngle, config.endAngle);
  graphics.strokePath();

  graphics.lineStyle(config.width, config.color, 0.92);
  graphics.beginPath();
  graphics.arc(0, 0, config.radius, config.startAngle, config.endAngle);
  graphics.strokePath();

  graphics.lineStyle(Math.max(2, config.width * 0.34), 0xfff8dc, 0.84);
  graphics.beginPath();
  graphics.arc(0, 0, Math.max(1, config.radius - config.width * 0.55), config.startAngle + 0.08, config.endAngle - 0.08);
  graphics.strokePath();
}

function showFloatingText(target: Phaser.Scene, x: number, y: number, text: string, color: string): void {
  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const liftY = 48 / layerScale;
  const label = target.add
    .text(x, y, text, {
      color,
      fontFamily: "Georgia",
      fontSize: "24px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 4,
    })
    .setOrigin(0.5);

  addToArenaEffectsLayer(target, label);
  label.setScale(fixedScreenScale);
  target.tweens.add({
    targets: label,
    y: y - liftY,
    alpha: 0,
    duration: 720,
    ease: "Quad.easeOut",
    onComplete: () => label.destroy(),
  });
}

function showPopupPreviewFromFighter(target: Phaser.Scene, fighter: FighterVisual, kind: DebugPopupPreviewKind): void {
  if (kind === "all") {
    showDamagePopupFromFighter(target, fighter, POPUP_PREVIEW_DAMAGE_AMOUNT, -POPUP_PREVIEW_SPACING_X * 1.5);
    showArmorAbsorbPopupFromFighter(target, fighter, POPUP_PREVIEW_ARMOR_ABSORB_AMOUNT, -POPUP_PREVIEW_SPACING_X * 0.5);
    showArmorBreakPopupFromFighter(target, fighter, POPUP_PREVIEW_DAMAGE_AMOUNT, POPUP_PREVIEW_SPACING_X * 0.5);
    showBlockPopupFromFighter(target, fighter, POPUP_PREVIEW_SPACING_X * 1.5);
    return;
  }

  if (kind === "damage") {
    showDamagePopupFromFighter(target, fighter, POPUP_PREVIEW_DAMAGE_AMOUNT);
    return;
  }

  if (kind === "block") {
    showBlockPopupFromFighter(target, fighter);
    return;
  }

  if (kind === "armorAbsorb") {
    showArmorAbsorbPopupFromFighter(target, fighter, POPUP_PREVIEW_ARMOR_ABSORB_AMOUNT);
    return;
  }

  showArmorBreakPopupFromFighter(target, fighter, POPUP_PREVIEW_DAMAGE_AMOUNT);
}

function showBlockPopupFromFighter(target: Phaser.Scene, fighter: FighterVisual, screenOffsetX = 0): void {
  const point = getFighterHeadPopupPoint(target, fighter, getBlockPopupHeadOffsetY());

  showBlockPopup(target, getPopupXWithScreenOffset(target, point.x, screenOffsetX), point.y);
}

function showDamagePopupFromFighter(target: Phaser.Scene, fighter: FighterVisual, amount: number, screenOffsetX = 0): void {
  if (amount <= 0) {
    return;
  }

  const point = getFighterHeadPopupPoint(target, fighter, getDamagePopupHeadOffsetY());

  showDamagePopup(target, getPopupXWithScreenOffset(target, point.x, screenOffsetX), point.y, amount);
}

function showDamageResultPopupFromFighter(
  target: Phaser.Scene,
  fighter: FighterVisual,
  totalDamage: number,
  armorAbsorbed: number,
  armorBroken: boolean,
): void {
  if (armorBroken) {
    showArmorBreakPopupFromFighter(target, fighter, totalDamage);
    return;
  }

  if (armorAbsorbed > 0) {
    showArmorAbsorbPopupFromFighter(target, fighter, armorAbsorbed);
    return;
  }

  showDamagePopupFromFighter(target, fighter, getHealthPopupDamage(totalDamage, armorAbsorbed));
}

function showArmorAbsorbPopupFromFighter(target: Phaser.Scene, fighter: FighterVisual, amount: number, screenOffsetX = 0): void {
  const point = getFighterHeadPopupPoint(target, fighter, getArmorAbsorbPopupHeadOffsetY());

  showArmorAbsorbPopup(target, getPopupXWithScreenOffset(target, point.x, screenOffsetX), point.y, amount);
}

function showArmorBreakPopupFromFighter(target: Phaser.Scene, fighter: FighterVisual, amount: number, screenOffsetX = 0): void {
  const point = getFighterHeadPopupPoint(target, fighter, getArmorBreakPopupHeadOffsetY());

  showArmorBreakPopup(target, getPopupXWithScreenOffset(target, point.x, screenOffsetX), point.y, amount);
}

function getPopupXWithScreenOffset(target: Phaser.Scene, x: number, screenOffsetX: number): number {
  return x + screenOffsetX / getArenaEffectsLayerScale(target);
}

function getHealthPopupDamage(totalDamage: number, armorAbsorbed: number): number {
  return Math.max(0, totalDamage - armorAbsorbed);
}

function getDamagePopupHeadOffsetY(): number {
  return debugTuning.popupOffsetY + debugTuning.damagePopupOffsetY;
}

function getBlockPopupHeadOffsetY(): number {
  return debugTuning.popupOffsetY + debugTuning.blockPopupOffsetY;
}

function getArmorAbsorbPopupHeadOffsetY(): number {
  return debugTuning.popupOffsetY + debugTuning.armorAbsorbPopupOffsetY;
}

function getArmorBreakPopupHeadOffsetY(): number {
  return debugTuning.popupOffsetY + debugTuning.armorBreakPopupOffsetY;
}

function getDamagePopupScale(): number {
  return debugTuning.popupScale * debugTuning.damagePopupScale;
}

function getBlockPopupScale(): number {
  return debugTuning.popupScale * debugTuning.blockPopupScale;
}

function getArmorAbsorbPopupScale(): number {
  return debugTuning.popupScale * debugTuning.armorAbsorbPopupScale;
}

function getArmorBreakPopupScale(): number {
  return debugTuning.popupScale * debugTuning.armorBreakPopupScale;
}

function getFighterHeadPopupPoint(target: Phaser.Scene, fighter: FighterVisual, offsetY: number): { x: number; y: number } {
  const headMatrix = fighter.head.getWorldTransformMatrix();
  const worldX = headMatrix.getX(0, 0);
  const worldY = headMatrix.getY(0, 0);
  const effectsLayer = getArenaEffectsLayer(target);

  if (!effectsLayer) {
    return { x: worldX, y: worldY + offsetY };
  }

  const localPoint = effectsLayer.getWorldTransformMatrix().applyInverse(worldX, worldY);
  const layerScale = getArenaEffectsLayerScale(target);

  return { x: localPoint.x, y: localPoint.y + offsetY / layerScale };
}

function showBlockPopup(target: Phaser.Scene, x: number, y: number): void {
  if (!target.textures.exists(DAMAGE_BLOCK_ICON_ASSET_KEY)) {
    return;
  }

  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const popupScale = getBlockPopupScale();
  const liftY = 42 / layerScale;
  const source = target.textures.get(DAMAGE_BLOCK_ICON_ASSET_KEY).getSourceImage() as { width?: number } | undefined;
  const sourceWidth = Math.max(1, source?.width ?? 256);
  const endScale = (BLOCK_POPUP_SCREEN_SIZE / sourceWidth) * fixedScreenScale * popupScale;
  const startScale = endScale * 0.72;
  const icon = target.add.image(x, y, DAMAGE_BLOCK_ICON_ASSET_KEY).setOrigin(0.5).setDepth(40);

  addToArenaEffectsLayer(target, icon);
  icon.setScale(startScale);
  icon.setAngle(-5);

  target.tweens.add({
    targets: icon,
    scale: endScale,
    angle: 2,
    duration: 140,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: icon,
    y: y - liftY,
    alpha: 0,
    duration: 720,
    delay: 160,
    ease: "Quad.easeOut",
    onComplete: () => icon.destroy(),
  });
}

function showArmorAbsorbPopup(target: Phaser.Scene, x: number, y: number, amount: number): void {
  if (!target.textures.exists(DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY)) {
    return;
  }

  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const popupScale = getArmorAbsorbPopupScale();
  const source = target.textures.get(DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY).getSourceImage() as { width?: number } | undefined;
  const sourceWidth = Math.max(1, source?.width ?? 256);
  const endScale = fixedScreenScale * popupScale;
  const startScale = endScale * 0.72;
  const liftY = 36 / layerScale;
  const popup = target.add.container(x, y).setDepth(40);
  const icon = target.add.image(0, 0, DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY).setOrigin(0.5);
  const label = target.add
    .text(0, -10, `${amount}`, {
      color: "#f7fbff",
      fontFamily: "Georgia",
      fontSize: "28px",
      fontStyle: "900",
      stroke: "#1b3040",
      strokeThickness: 5,
    })
    .setOrigin(0.5);

  icon.setScale(DAMAGE_ARMOR_ABSORB_POPUP_SCREEN_SIZE / sourceWidth);
  popup.add([icon, label]);
  addToArenaEffectsLayer(target, popup);
  popup.setScale(startScale);
  popup.setAngle(-3);

  target.tweens.add({
    targets: popup,
    scale: endScale,
    angle: 2,
    duration: 140,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popup,
    y: y - liftY,
    alpha: 0,
    duration: 700,
    delay: 180,
    ease: "Quad.easeIn",
    onComplete: () => popup.destroy(),
  });
}

function showArmorBreakPopup(target: Phaser.Scene, x: number, y: number, amount: number): void {
  if (!target.textures.exists(DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY)) {
    return;
  }

  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const popupScale = getArmorBreakPopupScale();
  const liftY = 44 / layerScale;
  const source = target.textures.get(DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY).getSourceImage() as { width?: number } | undefined;
  const sourceWidth = Math.max(1, source?.width ?? 256);
  const endScale = fixedScreenScale * popupScale;
  const startScale = endScale * 0.7;
  const popup = target.add.container(x, y).setDepth(40);
  const icon = target.add.image(0, 0, DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY).setOrigin(0.5);
  const label = target.add
    .text(0, -8, `${amount}`, {
      color: "#fff4cf",
      fontFamily: "Georgia",
      fontSize: "30px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 5,
    })
    .setOrigin(0.5);

  icon.setScale(DAMAGE_ARMOR_BREAK_POPUP_SCREEN_SIZE / sourceWidth);
  popup.add([icon, label]);
  addToArenaEffectsLayer(target, popup);
  popup.setScale(startScale);
  popup.setAngle(-6);

  target.tweens.add({
    targets: popup,
    scale: endScale,
    angle: 3,
    duration: 150,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popup,
    y: y - liftY,
    alpha: 0,
    duration: 760,
    delay: 180,
    ease: "Quad.easeOut",
    onComplete: () => popup.destroy(),
  });
}

function showDamagePopup(target: Phaser.Scene, x: number, y: number, amount: number): void {
  const useBurst = areArenaVfxEnabled();
  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const popupScale = getDamagePopupScale();
  const startScale = (useBurst ? 0.58 : 0.9) * fixedScreenScale * popupScale;
  const endScale = fixedScreenScale * popupScale;
  const liftY = 34 / layerScale;
  const popup = target.add.container(x, y).setDepth(40);
  const label = target.add
    .text(0, -2, `${amount}`, {
      color: "#fff4cf",
      fontFamily: "Georgia",
      fontSize: "30px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 5,
    })
    .setOrigin(0.5);

  if (useBurst && target.textures.exists(DAMAGE_HIT_ICON_ASSET_KEY)) {
    const source = target.textures.get(DAMAGE_HIT_ICON_ASSET_KEY).getSourceImage() as { width?: number } | undefined;
    const sourceWidth = Math.max(1, source?.width ?? 256);
    const icon = target.add.image(0, 0, DAMAGE_HIT_ICON_ASSET_KEY).setOrigin(0.5);

    icon.setScale(DAMAGE_HIT_POPUP_SCREEN_SIZE / sourceWidth);
    popup.add([icon, label]);
  } else if (useBurst) {
    const shadow = target.add.graphics();
    const burst = target.add.graphics();

    drawDamageBurst(shadow, 4, 5, 0x35180d, 0.92);
    drawDamageBurst(burst, 0, 0, 0xd52b1f, 1);
    popup.add([shadow, burst, label]);
  } else {
    popup.add(label);
  }

  addToArenaEffectsLayer(target, popup);
  popup.setScale(startScale);
  popup.setAngle(useBurst ? -4 : 0);

  target.tweens.add({
    targets: popup,
    scale: endScale,
    duration: 130,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popup,
    y: y - liftY,
    alpha: 0,
    duration: 680,
    delay: 180,
    ease: "Quad.easeIn",
    onComplete: () => popup.destroy(),
  });
}

function drawDamageBurst(graphics: Phaser.GameObjects.Graphics, offsetX: number, offsetY: number, color: number, alpha: number): void {
  const points = [
    { x: -34, y: -8 },
    { x: -48, y: -24 },
    { x: -24, y: -23 },
    { x: -19, y: -42 },
    { x: -4, y: -27 },
    { x: 12, y: -44 },
    { x: 15, y: -24 },
    { x: 42, y: -28 },
    { x: 28, y: -7 },
    { x: 46, y: 7 },
    { x: 24, y: 14 },
    { x: 24, y: 36 },
    { x: 4, y: 23 },
    { x: -11, y: 40 },
    { x: -15, y: 19 },
    { x: -42, y: 24 },
    { x: -29, y: 6 },
  ];

  graphics.fillStyle(color, alpha);
  graphics.lineStyle(3, 0x35180d, color === 0x35180d ? 0 : 0.86);
  graphics.beginPath();
  graphics.moveTo(points[0].x + offsetX, points[0].y + offsetY);

  for (const point of points.slice(1)) {
    graphics.lineTo(point.x + offsetX, point.y + offsetY);
  }

  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
}

function createDust(target: Phaser.Scene, x: number, y: number): void {
  if (!areArenaVfxEnabled()) {
    return;
  }

  for (let i = 0; i < 7; i += 1) {
    const dot = target.add.circle(x + Math.random() * 36 - 18, y + Math.random() * 16, 5 + Math.random() * 7, 0xf0bd72, 0.72);
    addToArenaEffectsLayer(target, dot);

    target.tweens.add({
      targets: dot,
      x: dot.x + Math.random() * 64 - 32,
      y: dot.y - 26 - Math.random() * 24,
      alpha: 0,
      duration: 480 + Math.random() * 180,
      onComplete: () => dot.destroy(),
    });
  }
}

function getArenaAnimationAmount(): number {
  const { animationMode } = getPlayerSettings();

  if (animationMode === "off") {
    return 0;
  }

  return animationMode === "half" ? 0.5 : 1;
}

function areArenaVfxEnabled(): boolean {
  return getPlayerSettings().vfxEnabled;
}

function getArenaShadowMode(): ReturnType<typeof getPlayerSettings>["shadowMode"] {
  return getPlayerSettings().shadowMode;
}

function syncFighterShadowVisibility(fighter: FighterVisual, alpha: number): void {
  const shadowMode = getArenaShadowMode();
  const highShadowVisible = fighter.castsShadow && shadowMode === "high" && !fighter.isShattered;
  const lowShadowVisible = fighter.castsShadow && shadowMode === "low" && !fighter.isShattered;

  fighter.shadow.setVisible(highShadowVisible);
  fighter.shadow.setAlpha(highShadowVisible ? alpha * debugTuning.shadowAlpha : 0);
  fighter.lowShadow.setVisible(lowShadowVisible);
  fighter.lowShadow.setAlpha(lowShadowVisible ? alpha * 0.26 : 0);
}
