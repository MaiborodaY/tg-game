import Phaser from "phaser";
import {
  ARENA_WORLD_LEFT,
  ARENA_WORLD_HEIGHT,
  ARENA_WORLD_TOP,
  ARENA_WORLD_WIDTH,
  DEFAULT_ENEMY_STAGE_X,
  DEFAULT_PLAYER_STAGE_X,
  DEFAULT_PLAYER_SCALE,
  DEFAULT_STAGE_ORIGIN_X,
  FIGHTER_BASE_Y,
} from "./arenaLayout";
import {
  ARROW_ICON_ASSET_KEY,
  ARROW_ICON_ASSET_URL,
  ARENA_BACKGROUND_LAYER_ASSETS,
  DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
  type ArenaBackgroundLayerAssetKey,
  type ArenaBackgroundLayerRole,
  type ArenaBackgroundVariantId,
  CITY_ARMORY_BACKGROUND_ASSET_KEY,
  CITY_BACKGROUND_ASSET_KEY,
  CITY_BACKGROUND_ASSET_URL,
  CITY_DAY_BACKGROUND_ASSET_KEY,
  CITY_DAY_BACKGROUND_ASSET_URL,
  CITY_CLOUD_ASSETS,
  CITY_SHOP_BACKGROUND_ASSET_KEY,
  CITY_SHOP_BACKGROUND_ASSET_URL,
  CITY_WEAPON_SHOP_BACKGROUND_ASSET_KEY,
  DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY,
  DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL,
  DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY,
  DAMAGE_ARMOR_BREAK_ICON_ASSET_URL,
  DAMAGE_BLOCK_ICON_ASSET_KEY,
  DAMAGE_BLOCK_ICON_ASSET_URL,
  DAMAGE_HIT_ICON_ASSET_KEY,
  DAMAGE_HIT_ICON_ASSET_URL,
  FIGHTER_BACK_BOOT_LEATHER_ASSET_KEY,
  FIGHTER_BACK_FOOT_DUMMY_ASSET_KEY,
  FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY,
  FIGHTER_BACK_FOREARM_DUMMY_ASSET_KEY,
  FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY,
  FIGHTER_BACK_WRIST_LEATHER_ASSET_KEY,
  FIGHTER_BACK_GREAVE_LEATHER_ASSET_KEY,
  FIGHTER_BACK_HAND_DUMMY_ASSET_KEY,
  FIGHTER_BACK_HAND_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHOULDERGUARD_LEATHER_ASSET_KEY,
  FIGHTER_BACK_SHINGUARD_LEATHER_ASSET_KEY,
  FIGHTER_BREASTPLATE_LEATHER_ASSET_KEY,
  FIGHTER_BACK_SHIN_DUMMY_ASSET_KEY,
  FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY,
  FIGHTER_BACK_THIGH_DUMMY_ASSET_KEY,
  FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY,
  FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_KEY,
  FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY,
  FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_KEY,
  FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_KEY,
  FIGHTER_FACE_DUMMY_PUPIL_LEFT_ASSET_KEY,
  FIGHTER_FACE_DUMMY_PUPIL_RIGHT_ASSET_KEY,
  FIGHTER_FRONT_FOOT_DUMMY_ASSET_KEY,
  FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_FOREARM_DUMMY_ASSET_KEY,
  FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_WRIST_LEATHER_ASSET_KEY,
  FIGHTER_FRONT_BOOT_LEATHER_ASSET_KEY,
  FIGHTER_FRONT_GREAVE_LEATHER_ASSET_KEY,
  FIGHTER_FRONT_HAND_DUMMY_ASSET_KEY,
  FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHOULDERGUARD_LEATHER_ASSET_KEY,
  FIGHTER_FRONT_SHINGUARD_LEATHER_ASSET_KEY,
  FIGHTER_FRONT_SHIN_DUMMY_ASSET_KEY,
  FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_THIGH_DUMMY_ASSET_KEY,
  FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_UPPER_ARM_DUMMY_ASSET_KEY,
  FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY,
  FIGHTER_HELMET_LEATHER_ASSET_KEY,
  FIGHTER_HEAD_DUMMY_ASSET_KEY,
  FIGHTER_HEAD_LIGHT_ASSET_KEY,
  FIGHTER_PAPER_DOLL_ASSETS,
  FIGHTER_TORSO_DUMMY_ASSET_KEY,
  FIGHTER_TORSO_LIGHT_ASSET_KEY,
  FIREBALL_PROJECTILE_ASSET_KEY,
  FIREBALL_PROJECTILE_ASSET_URL,
  FIGHTER_WEAPON_SWORD_01_ASSET_KEY,
  GAME_HEIGHT,
  GAME_WIDTH,
  getFighterTextureKey,
  PLAYER_AVATAR_FEET_Y_OFFSET,
  REST_HEALTH_ICON_ASSET_KEY,
  REST_HEALTH_ICON_ASSET_URL,
  REST_STAMINA_ICON_ASSET_KEY,
  REST_STAMINA_ICON_ASSET_URL,
  REST_ZZZ_ICON_ASSET_KEY,
  REST_ZZZ_ICON_ASSET_URL,
  DEFAULT_SCROLL_CAST_PROP_ASSET_KEY,
  SCROLL_CAST_PROP_ASSETS,
  SHURIKEN_PROJECTILE_ASSET_KEY,
  SHURIKEN_PROJECTILE_ASSET_URL,
  type ScrollCastPropAssetKey,
  WARD_SHIELD_EFFECT_ASSET_KEY,
  WARD_SHIELD_EFFECT_ASSET_URL,
} from "./assets";
import { getCameraTarget } from "./arenaCamera";
import type { CameraTarget, CameraViewport } from "./arenaCamera";
import { getBattleSafeArea } from "./battleSafeArea";
import {
  getFighterMaxArmor,
  getFighterMaxHp,
  getFighterMaxStamina,
  getBowShotsRemaining,
  isBowFighter,
  isRangedWeaponClass,
  type ActionId,
  type CombatActionTrace,
  type CombatArmorSlotState,
  type CombatHitResult,
  type CombatState,
  type FighterState,
} from "./combat";
import {
  createDefaultHeroAppearance,
  createDefaultHeroEquipment,
  DEFAULT_ENEMY_VISUAL_PRESET,
  ALL_HERO_ITEM_IDS,
  getHeroEquipmentBowWeaponClass,
  getHeroEquipmentWeaponClass,
  getHeroWeaponSharpeningLevel,
  HERO_EQUIPMENT_SLOT_KEYS,
  HERO_ITEM_CATALOG,
  type HeroAppearance,
  type HeroEquipment,
  type HeroEquipmentSlotKey,
  type HeroItemDefinition,
  type HeroItemId,
  type HeroItemRarity,
  type HeroWeaponClass,
  type HeroWeaponEnchantments,
} from "./hero";
import {
  getHeroAppearanceAsset,
  getHeroAppearanceAssetKeys,
  HERO_APPEARANCE_ASSETS,
  resolveHeroAppearanceAssetUrl,
} from "./appearanceAssetRegistry";
import {
  AUTO_EQUIPMENT_ASSETS,
  AUTO_EQUIPMENT_ITEM_ASSET_KEYS,
  AUTO_EQUIPMENT_ITEM_RECORDS,
  resolveEquipmentAssetUrl,
  type EquipmentItemAssetKeys,
} from "./equipmentAssetRegistry";
import {
  GENERATED_EQUIPMENT_ASSETS,
  GENERATED_EQUIPMENT_ITEM_ASSET_KEYS,
  GENERATED_EQUIPMENT_ITEM_RECORDS,
  GENERATED_EQUIPMENT_ITEM_TUNING,
} from "./generated/equipmentItems.generated";
import { getTelegramWebAppPlatform } from "./telegram";
import {
  beginDebugUndoGroup,
  debugTuning,
  BODY_ANIMATION_DEFAULT_VARIANT_ID,
  DEFAULT_BODY_ANIMATIONS,
  BODY_ANIMATION_WEAPON_CLASSES,
  DEFAULT_BODY_PRESET_TUNING,
  DEFAULT_APPEARANCE_LAYERS,
  DEFAULT_EQUIPMENT,
  DEFAULT_EQUIPMENT_ITEM_TUNING,
  DEFAULT_FACE_PARTS,
  DEFAULT_RIG_PARTS,
  DEFAULT_SLASH_ARCS,
  DEFAULT_WARD_SHIELD_TUNING,
  APPEARANCE_LAYER_KEYS,
  defaultBodyAnimationCastProp,
  defaultBodyAnimationRootOffset,
  defaultRigPartTuning,
  endDebugUndoGroup,
  FACE_ASSET_LAYER_KEYS,
  FACE_PART_KEYS,
  getDynamicArenaBackgroundLayerTuning,
  getArenaBackgroundLayerRole,
  RIG_PART_ANGLE_MAX,
  RIG_PART_ANGLE_MIN,
  RIG_PART_KEYS,
  subscribeDebugTuning,
  updateDebugTuning,
  type ArenaBackgroundEditLayer,
  type ArenaBackgroundLayerTuning,
  type ArenaDebugTuning,
  type AppearanceLayerKey,
  type AppearanceLayerTuning,
  type BodyAnimationKeyframe,
  type BodyAnimationKey,
  type BodyAnimationCastPropTuning,
  type BodyAnimationRootOffset,
  type BodyAnimationTuning,
  type BodyAnimationWeaponClass,
  type BodyPresetTuning,
  type DebugPopupPreviewKind,
  type EquipmentSlotKey,
  type EquipmentTuning,
  type FaceAssetLayerKey,
  type FaceAssetLayerTuning,
  type FacePartKey,
  type FacePartTuning,
  type PaperDollBodyPreset,
  type RigPartKey,
  type RigPartTuning,
  type SlashArcAttackKey,
  type SlashArcTuning,
  type WardShieldTuning,
  type WeaponEnchantGlowTuning,
} from "./debugTuning";
import { emitDebugCharacterEquipmentDelta, emitDebugCharacterEquipmentSelect } from "./debugCharacterEquipmentBridge";
import { getPlayerSettings, subscribePlayerSettings, type PlayerSettings, type PlayerSettingsChangeDetail } from "./settingsMenu";
import { getStageLayout } from "./stageLayout";

type FighterPart = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  visible: boolean;
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

type RenderFilterTarget = Phaser.GameObjects.GameObject & {
  enableFilters?: () => RenderFilterTarget;
  filters?: Phaser.Types.GameObjects.FiltersInternalExternal | null;
  setRenderFilters?: (value: boolean) => RenderFilterTarget;
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
  arrowCounter?: FighterArrowCounterVisual;
  extraParts?: FighterPart[];
  movableParts?: FighterPart[];
  animatedParts?: FighterPart[];
  paperDollRig?: PaperDollRig;
  castsShadow: boolean;
  debugScale: number;
  bodyIdleAnimationKey?: BodyAnimationKey;
  bodyIdleAnimationStartedAt?: number;
  bodyAnimationLockedUntil?: number;
  scrollCastPropAssetKey?: ScrollCastPropAssetKey;
  restZzzNextSpawnAt?: number;
  restZzzSpawnIndex?: number;
  isShattered?: boolean;
  isShatterScheduled?: boolean;
  isDeathEffectQueued?: boolean;
  deathEffectToken?: number;
}

interface FighterArrowCounterVisual {
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Image;
  text: Phaser.GameObjects.Text;
  baseScale: number;
}

type PaperDollPartKey = RigPartKey;
type AnimationRigPoseKey = "base" | "breath";
type AttackBodyAnimationKey = SlashArcAttackKey;
type PaperDollEquipmentAnchors = Partial<Record<PaperDollEquipmentSlotKey, FighterPart>>;
type PaperDollEquipmentLayerKey = "legs" | "torso" | "head" | "weapon" | "arms" | "weaponTop";
type PaperDollWeaponOverlayCrop = "mainTop" | "bowTop" | "bowBottom";
type PaperDollAppearanceLayerKey = AppearanceLayerKey;

type PaperDollEquipmentLayers = Record<PaperDollEquipmentLayerKey, Phaser.GameObjects.Container>;

interface DebugRigPartDragState {
  partKeys: RigPartKey[];
  lastPointerX: number;
  lastPointerY: number;
}

interface DebugCanvasPanState {
  lastPointerX: number;
  lastPointerY: number;
}

interface DebugAnimationRootDragState {
  lastPointerX: number;
  lastPointerY: number;
}

interface DebugEquipmentDragState {
  slotKey: PaperDollEquipmentSlotKey;
  itemId: HeroItemId | "";
  lastPointerLocalX: number;
  lastPointerLocalY: number;
}

interface DebugAnimationWeaponDragState {
  slotKey: PaperDollEquipmentSlotKey;
  itemId: HeroItemId | "";
  lastPointerLocalX: number;
  lastPointerLocalY: number;
}

interface PaperDollAnimationRootBase {
  rootX: number;
  rootY: number;
  shadowX: number;
  shadowY: number;
  lowShadowX: number;
  lowShadowY: number;
  nameX: number;
  nameY: number;
  worldOffsetX: number;
  worldOffsetY: number;
}

interface DebugAnimationFloorGuide {
  graphics: Phaser.GameObjects.Graphics;
  floorLabel: Phaser.GameObjects.Text;
  rootLabel: Phaser.GameObjects.Text;
}

interface DebugInputEvent {
  stopPropagation: () => void;
}

type DebugRigPartPickHandler = (partKey: RigPartKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent) => void;
type DebugEquipmentPickHandler = (slotKey: PaperDollEquipmentSlotKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent) => void;
type DebugAnimationWeaponPickHandler = (slotKey: PaperDollEquipmentSlotKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent) => void;

interface PaperDollRig {
  root: FighterPart;
  parts: Record<PaperDollPartKey, FighterPart>;
  bodyPresetKey?: PaperDollBodyPreset;
  headAssetKey?: string;
  torsoAssetKey?: string;
  bodyPartAssetKeys?: Partial<Record<PaperDollPartKey, string>>;
  faceOverlayMode?: PaperDollFaceOverlayMode;
  faceAssetKeys?: Partial<Record<FaceAssetLayerKey, string>>;
  faceAssetLayers: PaperDollFaceAssetLayers;
  appearanceAssetKeys?: Partial<Record<PaperDollAppearanceLayerKey, string>>;
  appearanceLayers: PaperDollAppearanceLayers;
  appearanceState?: HeroAppearance;
  equipment: PaperDollEquipment;
  equipmentAnchors: PaperDollEquipmentAnchors;
  equipmentState?: HeroEquipment;
  weaponEnchantmentsState?: HeroWeaponEnchantments;
  faceParts: PaperDollFaceParts;
  appearance: PaperDollAppearance;
  castProp?: FighterPart;
  selectionHighlights?: Partial<Record<PaperDollPartKey, Phaser.GameObjects.Graphics>>;
  usesPlayerEquipment: boolean;
  shadow?: PaperDollShadowRig;
}

interface PaperDollShadowRig {
  root: FighterPart;
  parts: Record<PaperDollPartKey, FighterPart>;
  bodyPresetKey?: PaperDollBodyPreset;
  headAssetKey?: string;
  torsoAssetKey?: string;
  bodyPartAssetKeys?: Partial<Record<PaperDollPartKey, string>>;
  faceOverlayMode?: PaperDollFaceOverlayMode;
  faceAssetKeys?: Partial<Record<FaceAssetLayerKey, string>>;
  faceAssetLayers: PaperDollFaceAssetLayers;
  appearanceAssetKeys?: Partial<Record<PaperDollAppearanceLayerKey, string>>;
  appearanceLayers: PaperDollAppearanceLayers;
  equipment: PaperDollEquipment;
  equipmentAnchors: PaperDollEquipmentAnchors;
  faceParts: PaperDollFaceParts;
}

interface PaperDollEquipment {
  weaponMain?: FighterPart;
  weaponBow?: FighterPart;
  helmet?: FighterPart;
  breastplate?: FighterPart;
  backShoulderguard?: FighterPart;
  frontShoulderguard?: FighterPart;
  backWrist?: FighterPart;
  frontWrist?: FighterPart;
  backGlove?: FighterPart;
  frontGlove?: FighterPart;
  shield?: FighterPart;
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

type PaperDollFaceAssetLayers = Partial<Record<FaceAssetLayerKey, FighterPart>>;
type PaperDollAppearanceLayers = Partial<Record<PaperDollAppearanceLayerKey, FighterPart>>;

interface PaperDollAppearance {
  facing: 1 | -1;
  skin: number;
  skinDark: number;
  hair: number;
  muscle: number;
}

type PaperDollFaceOverlayMode = "classic" | "none";

interface PaperDollFighterOptions {
  x: number;
  y: number;
  label: string;
  facing: 1 | -1;
  skin: number;
  skinDark: number;
  hair: number;
  muscle?: number;
  bodyPresetKey?: PaperDollBodyPreset;
  headAssetKey?: string;
  torsoAssetKey?: string;
  faceOverlayMode?: PaperDollFaceOverlayMode;
  faceAssetKeys?: Partial<Record<FaceAssetLayerKey, string>>;
  helmetAssetKey?: string;
  breastplateAssetKey?: string;
  backShoulderguardAssetKey?: string;
  frontShoulderguardAssetKey?: string;
  backWristAssetKey?: string;
  frontWristAssetKey?: string;
  backGloveAssetKey?: string;
  frontGloveAssetKey?: string;
  shieldAssetKey?: string;
  backGreaveAssetKey?: string;
  frontGreaveAssetKey?: string;
  backShinguardAssetKey?: string;
  frontShinguardAssetKey?: string;
  backBootAssetKey?: string;
  frontBootAssetKey?: string;
  bodyPartAssetKeys?: Partial<Record<PaperDollPartKey, string>>;
  weaponMainAssetKey?: string;
  weaponBowAssetKey?: string;
  weaponEnchantments?: HeroWeaponEnchantments;
  appearanceAssetKeys?: Partial<Record<PaperDollAppearanceLayerKey, string>>;
  appearance?: HeroAppearance;
  equipment?: HeroEquipment;
  usesPlayerEquipment?: boolean;
  castsShadow?: boolean;
  enableSelectionHighlights?: boolean;
}

type PaperDollEquipmentSlotKey = HeroEquipmentSlotKey;
type PaperDollWeaponSlotKey = Extract<PaperDollEquipmentSlotKey, "weaponMain" | "weaponBow">;

type PaperDollEquipmentAssetKeys = EquipmentItemAssetKeys;

type PaperDollEquipmentAssetKey = keyof PaperDollEquipmentAssetKeys;

interface HudVisual {
  hpFill: Phaser.GameObjects.Rectangle;
  armorFill: Phaser.GameObjects.Rectangle;
  staminaFill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface ArenaIconTextPopupVisual {
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
}

interface ArenaDamageBurstPopupVisual {
  container: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Graphics;
  burst: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
}

interface ArenaTextPopupVisual {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
}

interface ArenaRestRecoveryPopupVisual {
  container: Phaser.GameObjects.Container;
  healthRow: Phaser.GameObjects.Container;
  healthIcon: Phaser.GameObjects.Image;
  healthLabel: Phaser.GameObjects.Text;
  staminaRow: Phaser.GameObjects.Container;
  staminaIcon: Phaser.GameObjects.Image;
  staminaLabel: Phaser.GameObjects.Text;
}

interface ArenaEffectPools {
  floatingLabels: Phaser.GameObjects.Text[];
  slashArcs: Phaser.GameObjects.Graphics[];
  blockIcons: Phaser.GameObjects.Image[];
  armorAbsorbPopups: ArenaIconTextPopupVisual[];
  armorBreakPopups: ArenaIconTextPopupVisual[];
  damageIconPopups: ArenaIconTextPopupVisual[];
  poisonDamagePopups: ArenaIconTextPopupVisual[];
  damageBurstPopups: ArenaDamageBurstPopupVisual[];
  damageTextPopups: ArenaTextPopupVisual[];
  restRecoveryPopups: ArenaRestRecoveryPopupVisual[];
  restZzzIcons: Phaser.GameObjects.Image[];
  projectiles: Phaser.GameObjects.Image[];
  wardShields: Phaser.GameObjects.Image[];
  dustDots: Phaser.GameObjects.Arc[];
}

interface ActionAnimationHandle {
  done: Promise<void>;
  impact?: Promise<void>;
  impacts?: Promise<void>[];
  speedUp?: (multiplier: number) => void;
}

interface MeleeActionTiming {
  impactProgress: number;
  weaponSwingProgress: number;
  weaponAngle: number;
}

interface ScrollCastActionTiming {
  propAssetKey: ScrollCastPropAssetKey;
  doneDelayMs: number;
  impactDelayMs: number;
  impactProgress: number;
}

interface ActionAnimationOptions {
  loopRestAfterComplete?: boolean;
  variantSeed?: string;
}

interface BodyAnimationOnceOptions {
  loopAfterComplete?: BodyAnimationKey;
  speedMultiplier?: number;
}

interface BodyAnimationOnceHandle {
  done: Promise<void>;
  speedUp: (multiplier: number) => void;
}

interface ProjectileAnimationHandle {
  done: Promise<void>;
  impact: Promise<void>;
}

interface ArenaMidLayerShadeState {
  amount: number;
}

interface ArenaVisuals {
  player: FighterVisual;
  helper?: FighterVisual;
  enemy: FighterVisual;
  playerHud: HudVisual;
  enemyHud: HudVisual;
}

interface ArenaPreparedVisualState {
  previousState?: CombatState;
  playerSettings: PlayerSettings;
  visuals: ArenaVisuals;
}

interface ArenaSyncOptions {
  hudState?: CombatState;
  onImpact?: () => void;
}

function getCombatActionAnimationSequence(
  traces: readonly CombatActionTrace[],
  fallbackAction: ActionId | undefined,
  fallbackDefender: CombatActionTrace["defender"],
): CombatActionTrace[] {
  if (traces.length > 0) {
    return [...traces];
  }

  return fallbackAction ? [{ actionId: fallbackAction, defender: fallbackDefender }] : [];
}

function getCombatActionDefenderVisual(visuals: ArenaVisuals, trace: CombatActionTrace, fallback: FighterVisual): FighterVisual {
  if (trace.defender === "enemy") {
    return visuals.enemy;
  }

  if (trace.defender === "helper") {
    return visuals.helper ?? fallback;
  }

  return visuals.player;
}

type ArenaBackgroundLayerKey = ArenaBackgroundLayerAssetKey;

interface ArenaLayers {
  back: Phaser.GameObjects.Container;
  mid: Phaser.GameObjects.Container;
  ground: Phaser.GameObjects.Container;
  front: Phaser.GameObjects.Container;
  ambient: Phaser.GameObjects.Container;
  actors: Phaser.GameObjects.Container;
  effects: Phaser.GameObjects.Container;
  midImages: Set<Phaser.GameObjects.Image>;
  backgroundImages: Partial<Record<ArenaBackgroundLayerKey, Phaser.GameObjects.Image>>;
  backgroundLayerContainers: Partial<Record<ArenaBackgroundLayerKey, Phaser.GameObjects.Container>>;
  backgroundLayerRoles: Partial<Record<ArenaBackgroundLayerKey, ArenaBackgroundLayerRole>>;
  backgroundLayerIds: ArenaBackgroundLayerKey[];
  backgroundTierId?: number;
  backgroundVariantId?: ArenaBackgroundVariantId;
  backgroundViewportKey?: string;
  midShade: ArenaMidLayerShadeState;
  all: Phaser.GameObjects.Container[];
}

type ArenaSceneLayerKey = "actors" | "effects";

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
  alphaImage?: Phaser.GameObjects.Image;
  alpha?: number;
}

type ArenaEntryTransitionState = "pending" | "running" | "done";

const ARENA_LAYER_PARALLAX: Record<ArenaSceneLayerKey, ArenaLayerParallax> = {
  actors: { followX: 1, followY: 1, zoom: 1, lookUpY: 0 },
  effects: { followX: 1, followY: 1, zoom: 1, lookUpY: 0 },
};

const ARENA_BACKGROUND_ROLE_DEPTHS: Record<ArenaBackgroundLayerRole, number> = {
  back: -30,
  ground: -25,
  mid: -20,
  front: -15,
  ambient: -12,
};

const ARENA_BACKGROUND_VIEWPORT_COVER_OVERSCAN = 1.02;
const ARENA_BACKGROUND_VIEWPORT_COVER_START_SCALE = 1.12;
const ARENA_BACKGROUND_VIEWPORT_COVER_MAX_SCALE = 1.35;

const ARENA_BACKGROUND_ROLE_COVER_ANCHOR_Y: Record<ArenaBackgroundLayerRole, number> = {
  back: 0.5,
  ground: 0.78,
  mid: 0.55,
  front: 0.78,
  ambient: 0.5,
};

const ARENA_MID_LAYER_BASE_TINT = 0xb1a18f;
const ARENA_MID_LAYER_CLOSE_TINT = 0x6f5a49;

interface ArenaBackgroundLayerConfig {
  layer: ArenaBackgroundLayerKey;
  role: ArenaBackgroundLayerRole;
  order: number;
  key: string;
  url: string;
  shadeWithCamera?: boolean;
}

interface ArenaBackgroundLayerLayout {
  x: number;
  y: number;
  scale: number;
  alpha: number;
  visible: boolean;
}

interface ArenaBackgroundLayerDragState {
  tierId: ArenaBackgroundTuningTierId;
  variantId: ArenaBackgroundVariantId;
  layerKey: ArenaBackgroundEditLayer;
  lastPointerX: number;
  lastPointerY: number;
}

type ArenaBackgroundTuningTierId = number;

interface ArenaBackgroundAssetSet {
  tierId: number;
  variantId: ArenaBackgroundVariantId;
  layers: ArenaBackgroundLayerConfig[];
}

type ArenaBackgroundPreloadEncounter = CombatState["encounter"];

const ARENA_BACKGROUND_ASSET_SETS: readonly ArenaBackgroundAssetSet[] = createArenaBackgroundAssetSets();

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
const PAPER_DOLL_LOW_SHADOW_MIN_SCALE = 0.72;
const FIGHTER_ARROW_COUNTER_LOCAL_Y = -366;
const FIGHTER_ARROW_COUNTER_SCALE_MIN = 0.86;
const FIGHTER_ARROW_COUNTER_SCALE_MULTIPLIER = 1.2;
const SLASH_ARC_DEPTH = 36;
const BLOCK_POPUP_SCREEN_SIZE = 88;
const DAMAGE_HIT_POPUP_SCREEN_SIZE = 112;
const DAMAGE_ARMOR_ABSORB_POPUP_SCREEN_SIZE = 108;
const DAMAGE_ARMOR_BREAK_POPUP_SCREEN_SIZE = 112;
const POISON_DAMAGE_POPUP_ICON_ASSET_KEY = "scroll-poison-01";
const POISON_DAMAGE_POPUP_ICON_SCREEN_SIZE = 42;
const REST_RECOVERY_POPUP_ICON_SCREEN_SIZE = 34;
const REST_BODY_ANIMATION_SPEED_MULTIPLIER = 1;
const REST_ZZZ_ICON_SCREEN_SIZE = 40;
const REST_ZZZ_SPAWN_INTERVAL_MS = 1000;
const REST_ZZZ_LIFETIME_MS = 2000;
const REST_ZZZ_HEAD_OFFSET_Y = -62;
const REST_ZZZ_LIFT_Y = 40;
const REST_ZZZ_SIDE_OFFSETS = [-11, 8, -4, 13];
const REST_ZZZ_DRIFT_X = [11, -9, 7, -12];
const ARROW_PROJECTILE_SCREEN_SIZE = 36;
const SHURIKEN_PROJECTILE_SCREEN_SIZE = 20;
const FIREBALL_PROJECTILE_START_SCREEN_SIZE = 14;
const FIREBALL_PROJECTILE_END_SCREEN_SIZE = 58;
const PROJECTILE_FLIGHT_DURATION_MS = 280;
const FIREBALL_PROJECTILE_FLIGHT_DURATION_MS = PROJECTILE_FLIGHT_DURATION_MS;
const PROJECTILE_IMPACT_LEAD_MS = 45;
const ARROW_PROJECTILE_ANGLE_OFFSET = 45;
const PROJECTILE_START_LOCAL_X = 90;
const PROJECTILE_START_LOCAL_Y = -205;
const PROJECTILE_TARGET_LOCAL_X = 44;
const PROJECTILE_TARGET_LOCAL_Y = -250;
const WARD_SHIELD_EFFECT_DEPTH = 35;
const WARD_SHIELD_BASE_SCREEN_HEIGHT = 315;
const WARD_SHIELD_MIN_SCALE_MULTIPLIER = 0.76;
const WARD_SHIELD_MAX_SCALE_MULTIPLIER = 1.12;
const WARD_SHIELD_CENTER_Y_RATIO = 0.44;
const MELEE_ACTION_TIMINGS: Record<AttackBodyAnimationKey, MeleeActionTiming> = {
  light: { impactProgress: 0.45, weaponSwingProgress: 0.45, weaponAngle: 28 },
  medium: { impactProgress: 0.48, weaponSwingProgress: 0.48, weaponAngle: 32 },
  heavy: { impactProgress: 0.52, weaponSwingProgress: 0.52, weaponAngle: 38 },
};
const SCROLL_CAST_ACTION_TIMINGS: Partial<Record<ActionId, ScrollCastActionTiming>> = {
  scroll: { propAssetKey: "scroll-crack-armor-01", doneDelayMs: 260, impactDelayMs: 120, impactProgress: 120 / 260 },
  ward: { propAssetKey: "scroll-ward-01", doneDelayMs: 260, impactDelayMs: 120, impactProgress: 120 / 260 },
  preciseStrike: { propAssetKey: "scroll-precise-strike-01", doneDelayMs: 260, impactDelayMs: 120, impactProgress: 120 / 260 },
  doubleStrike: { propAssetKey: "scroll-double-strike-01", doneDelayMs: 260, impactDelayMs: 120, impactProgress: 120 / 260 },
  poison: { propAssetKey: "scroll-poison-01", doneDelayMs: 260, impactDelayMs: 120, impactProgress: 120 / 260 },
  fireball: { propAssetKey: "scroll-fireball-01", doneDelayMs: 320, impactDelayMs: 170, impactProgress: 170 / 320 },
};
const LUNGE_ACTION_IMPACT_PROGRESS = 0.58;
const DAMAGING_LUNGE_AFTER_IMPACT_TIME_SCALE = 1.6;
const MOVEMENT_START_DUST_COUNT = 8;
const MOVEMENT_START_DUST_DELAY_EPSILON_MS = 8;
const POPUP_PREVIEW_DAMAGE_AMOUNT = 10;
const POPUP_PREVIEW_ARMOR_ABSORB_AMOUNT = 7;
const POPUP_PREVIEW_SPACING_X = 54;
const paperDollShadowBlurFilters = new WeakMap<Phaser.GameObjects.GameObject, Phaser.Filters.Blur>();
const paperDollShadowBlurValues = new WeakMap<Phaser.GameObjects.GameObject, number>();
const paperDollLinkedEquipmentAnchors = new WeakMap<FighterPart, FighterPart[]>();
const paperDollLinkedEquipmentSlots = new WeakMap<FighterPart, FighterPart[]>();
const paperDollWeaponOverlayCrops = new WeakMap<FighterPart, PaperDollWeaponOverlayCrop>();
const paperDollEquipmentSlotImageStates = new WeakMap<FighterPart, PaperDollEquipmentSlotImageState>();
const paperDollEquipmentTransformStates = new WeakMap<FighterPart, PaperDollEquipmentTransformState>();
const paperDollWeaponGlowImages = new WeakMap<FighterPart, Phaser.GameObjects.Image>();
const paperDollWeaponGlowBlurFilters = new WeakMap<Phaser.GameObjects.Image, Phaser.Filters.Blur>();
const paperDollAnimationRootBases = new WeakMap<FighterVisual, PaperDollAnimationRootBase>();
const paperDollEquipmentLayerOrders = new WeakMap<Phaser.GameObjects.GameObject, number>();
const DEFAULT_PAPER_DOLL_APPEARANCE: PaperDollAppearance = {
  facing: 1,
  skin: 0xefaa7b,
  skinDark: 0xd9854d,
  hair: 0x8b4a1f,
  muscle: 0x9b5a35,
};
const FIGHTER_MOVE_DURATION = 280;
const DEATH_SHATTER_DELAY = 260;
const DEATH_SHATTER_AFTER_IMPACT_DELAY = 200;
const DEATH_SHATTER_RESULT_SETTLE_DELAY = 520;
const DEATH_REMAINS_FADE_DURATION = 180;
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
const FACE_ASSET_PUPIL_DISPLAY_HEIGHT = 13;
const FACE_ASSET_BROW_DISPLAY_HEIGHT = 18;
const APPEARANCE_HAIR_DISPLAY_HEIGHT = 92;
const APPEARANCE_BEARD_DISPLAY_HEIGHT = 54;
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
const CITY_PROFILE_PREVIEW_FALLBACK_LOGICAL_SCALE = 1.32;
const CITY_PROFILE_PREVIEW_MIN_LOGICAL_SCALE = 0.9;
const CITY_PROFILE_PREVIEW_MAX_LOGICAL_SCALE = 1.42;
const CITY_PROFILE_PREVIEW_FIT_PADDING_RATIO = 0.9;
const CITY_HERO_CAMERA_VISUAL_WIDTH_RATIO = 0.62;
const CITY_CAMERA_DEFAULT_ZOOM = 1;
const CITY_CAMERA_ARMORY_ZOOM = 3.75;
const CITY_CAMERA_SHOP_MIN_ZOOM = 1.25;
const CITY_CAMERA_SHOP_MAX_AVAILABLE_HEIGHT_RATIO = 0.9;
const CITY_CAMERA_SHOP_MAX_SCREEN_WIDTH_RATIO = 0.78;
const CITY_CAMERA_SHOP_TOP_PADDING = 22;
const CITY_CAMERA_SHOP_MENU_GAP = 20;
const CITY_CAMERA_SHOP_FALLBACK_MENU_TOP_RATIO = 0.72;
const CITY_CAMERA_TWEEN_DURATION = 420;
const CITY_ARENA_TRANSITION_DURATION = 950;
const CITY_ARENA_TRANSITION_ZOOM = 2.7;
const CITY_ARENA_FOCUS_X_RATIO = 0.21;
const CITY_ARENA_FOCUS_Y_RATIO = 0;
const CITY_BACKGROUND_FADE_DURATION = 220;
const CITY_CAMERA_ARMORY_FOCUS_OFFSET_X = 0;
const CITY_CAMERA_ARMORY_FOCUS_OFFSET_Y = 15;
const CITY_ARMORY_HERO_LIFT_Y = 132;
const CITY_BACKGROUND_DEPTH = -30;
const CITY_CLOUD_DEPTH = CITY_BACKGROUND_DEPTH + 4;
const CITY_SHOP_BACKGROUND_TINT = 0x8b7464;
const CITY_CLOUD_FADE_DURATION = 180;
const CITY_HERO_BODY_TINT = 0xf0b892;
const CITY_HERO_EQUIPMENT_TINT = 0xd3ad84;
const CITY_LIGHTING_TWEEN_DURATION = 260;
const WEAPON_ENCHANTMENT_GLOW_BLUR_QUALITY = 0;
const WEAPON_ENCHANTMENT_GLOW_BLUR_STEPS = 2;
const HERO_PORTRAIT_VIEWER_SIZE = 112;
const HERO_PORTRAIT_CENTER_X = HERO_PORTRAIT_VIEWER_SIZE / 2;
const HERO_PORTRAIT_FEET_Y = 194;
const HERO_PORTRAIT_SCALE = 1.18;
const HERO_PORTRAIT_HIDDEN_PART_KEYS: PaperDollPartKey[] = ["backThigh", "frontThigh", "backShin", "frontShin", "backFoot", "frontFoot"];
const HERO_PORTRAIT_HIDDEN_EQUIPMENT_SLOT_KEYS: PaperDollEquipmentSlotKey[] = [
  "backGreave",
  "frontGreave",
  "backShinguard",
  "frontShinguard",
  "backBoot",
  "frontBoot",
];
const HERO_PORTRAIT_SNAPSHOT_EQUIPMENT_SLOT_KEYS: HeroEquipmentSlotKey[] = [
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
];
const PAPER_DOLL_SELECTION_FILL = 0xffc857;
const PAPER_DOLL_SELECTION_STROKE = 0xfff1a8;

interface PaperDollPartAssetConfig {
  displayHeight: number;
  localX: number;
  localY: number;
  originX: number;
  originY: number;
}

interface PaperDollEquipmentSlotImageState extends PaperDollPartAssetConfig {
  textureKey: string;
}

interface PaperDollEquipmentTransformState {
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
}

interface PaperDollAssetLoadEntry {
  key: string;
  url: string;
}

interface PaperDollAssetDefinition {
  key: string;
  url?: string;
  lowUrl?: string;
  sourcePath?: string;
  lowSourcePath?: string;
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

const PAPER_DOLL_FACE_ASSET_CONFIGS: Record<FaceAssetLayerKey, PaperDollPartAssetConfig> = {
  pupilLeft: { displayHeight: FACE_ASSET_PUPIL_DISPLAY_HEIGHT, localX: 0, localY: 0, originX: 0.5, originY: 0.5 },
  pupilRight: { displayHeight: FACE_ASSET_PUPIL_DISPLAY_HEIGHT, localX: 0, localY: 0, originX: 0.5, originY: 0.5 },
  browLeft: { displayHeight: FACE_ASSET_BROW_DISPLAY_HEIGHT, localX: 0, localY: 0, originX: 0.5, originY: 0.5 },
  browRight: { displayHeight: FACE_ASSET_BROW_DISPLAY_HEIGHT, localX: 0, localY: 0, originX: 0.5, originY: 0.5 },
};

const PAPER_DOLL_APPEARANCE_ASSET_CONFIGS: Record<PaperDollAppearanceLayerKey, PaperDollPartAssetConfig> = {
  hair: { displayHeight: APPEARANCE_HAIR_DISPLAY_HEIGHT, localX: 0, localY: -70, originX: 0.5, originY: 0.5 },
  beard: { displayHeight: APPEARANCE_BEARD_DISPLAY_HEIGHT, localX: 0, localY: -28, originX: 0.5, originY: 0.5 },
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

const DUMMY_PAPER_DOLL_ARM_ASSET_KEYS: Partial<Record<PaperDollPartKey, string>> = {
  backUpperArm: FIGHTER_BACK_UPPER_ARM_DUMMY_ASSET_KEY,
  backForearm: FIGHTER_BACK_FOREARM_DUMMY_ASSET_KEY,
  backHand: FIGHTER_BACK_HAND_DUMMY_ASSET_KEY,
  frontUpperArm: FIGHTER_FRONT_UPPER_ARM_DUMMY_ASSET_KEY,
  frontForearm: FIGHTER_FRONT_FOREARM_DUMMY_ASSET_KEY,
  frontHand: FIGHTER_FRONT_HAND_DUMMY_ASSET_KEY,
};

const DUMMY_PAPER_DOLL_LEG_ASSET_KEYS: Partial<Record<PaperDollPartKey, string>> = {
  backThigh: FIGHTER_BACK_THIGH_DUMMY_ASSET_KEY,
  backShin: FIGHTER_BACK_SHIN_DUMMY_ASSET_KEY,
  backFoot: FIGHTER_BACK_FOOT_DUMMY_ASSET_KEY,
  frontThigh: FIGHTER_FRONT_THIGH_DUMMY_ASSET_KEY,
  frontShin: FIGHTER_FRONT_SHIN_DUMMY_ASSET_KEY,
  frontFoot: FIGHTER_FRONT_FOOT_DUMMY_ASSET_KEY,
};

interface PaperDollBodyPresetDefinition {
  headAssetKey: string;
  torsoAssetKey: string;
  bodyPartAssetKeys: Partial<Record<PaperDollPartKey, string>>;
  faceOverlayMode: PaperDollFaceOverlayMode;
  faceAssetKeys?: Partial<Record<FaceAssetLayerKey, string>>;
}

const PAPER_DOLL_BODY_PRESETS: Record<PaperDollBodyPreset, PaperDollBodyPresetDefinition> = {
  classic: {
    headAssetKey: FIGHTER_HEAD_LIGHT_ASSET_KEY,
    torsoAssetKey: FIGHTER_TORSO_LIGHT_ASSET_KEY,
    bodyPartAssetKeys: DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS,
    faceOverlayMode: "classic",
  },
  "dummy-v2": {
    headAssetKey: FIGHTER_HEAD_DUMMY_ASSET_KEY,
    torsoAssetKey: FIGHTER_TORSO_DUMMY_ASSET_KEY,
    bodyPartAssetKeys: {
      ...DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS,
      ...DUMMY_PAPER_DOLL_ARM_ASSET_KEYS,
      ...DUMMY_PAPER_DOLL_LEG_ASSET_KEYS,
    },
    faceOverlayMode: "none",
    faceAssetKeys: {
      pupilLeft: FIGHTER_FACE_DUMMY_PUPIL_LEFT_ASSET_KEY,
      pupilRight: FIGHTER_FACE_DUMMY_PUPIL_RIGHT_ASSET_KEY,
      browLeft: FIGHTER_FACE_DUMMY_BROW_LEFT_ASSET_KEY,
      browRight: FIGHTER_FACE_DUMMY_BROW_RIGHT_ASSET_KEY,
    },
  },
};

const DEFAULT_PLAYER_EQUIPMENT_ASSET_KEYS: PaperDollEquipmentAssetKeys = {
  weaponMainAssetKey: FIGHTER_WEAPON_SWORD_01_ASSET_KEY,
  helmetAssetKey: FIGHTER_HELMET_LEATHER_ASSET_KEY,
  breastplateAssetKey: FIGHTER_BREASTPLATE_LEATHER_ASSET_KEY,
  backShoulderguardAssetKey: FIGHTER_BACK_SHOULDERGUARD_LEATHER_ASSET_KEY,
  frontShoulderguardAssetKey: FIGHTER_FRONT_SHOULDERGUARD_LEATHER_ASSET_KEY,
  backWristAssetKey: FIGHTER_BACK_WRIST_LEATHER_ASSET_KEY,
  frontWristAssetKey: FIGHTER_FRONT_WRIST_LEATHER_ASSET_KEY,
  backGreaveAssetKey: FIGHTER_BACK_GREAVE_LEATHER_ASSET_KEY,
  frontGreaveAssetKey: FIGHTER_FRONT_GREAVE_LEATHER_ASSET_KEY,
  backShinguardAssetKey: FIGHTER_BACK_SHINGUARD_LEATHER_ASSET_KEY,
  frontShinguardAssetKey: FIGHTER_FRONT_SHINGUARD_LEATHER_ASSET_KEY,
  backBootAssetKey: FIGHTER_BACK_BOOT_LEATHER_ASSET_KEY,
  frontBootAssetKey: FIGHTER_FRONT_BOOT_LEATHER_ASSET_KEY,
};

const PAPER_DOLL_EQUIPMENT_SLOT_KEYS = HERO_EQUIPMENT_SLOT_KEYS;
const PAPER_DOLL_DRAGGABLE_ARMOR_SLOT_KEYS = PAPER_DOLL_EQUIPMENT_SLOT_KEYS.filter((slotKey) => !isPaperDollWeaponSlot(slotKey));
const PAPER_DOLL_DRAGGABLE_WEAPON_SLOT_KEYS: PaperDollEquipmentSlotKey[] = ["weaponMain", "weaponBow"];
const DEBUG_CHARACTER_GHOST_ARMOR_ALPHA = 0.32;

const PLAYER_EQUIPMENT_ASSET_KEY_BY_SLOT: Record<PaperDollEquipmentSlotKey, PaperDollEquipmentAssetKey> = {
  weaponMain: "weaponMainAssetKey",
  weaponBow: "weaponBowAssetKey",
  helmet: "helmetAssetKey",
  breastplate: "breastplateAssetKey",
  backShoulderguard: "backShoulderguardAssetKey",
  frontShoulderguard: "frontShoulderguardAssetKey",
  backWrist: "backWristAssetKey",
  frontWrist: "frontWristAssetKey",
  backGlove: "backGloveAssetKey",
  frontGlove: "frontGloveAssetKey",
  shield: "shieldAssetKey",
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
  weaponBow: {
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
  shield: {
    displayHeight: 72,
    localX: 0,
    localY: 0,
    originX: 0.5,
    originY: 0.5,
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
  weaponBow: "backHand",
  helmet: "head",
  breastplate: "torso",
  backShoulderguard: "backUpperArm",
  frontShoulderguard: "frontUpperArm",
  backWrist: "backForearm",
  frontWrist: "frontForearm",
  backGlove: "backHand",
  frontGlove: "frontHand",
  shield: "frontForearm",
  backGreave: "backThigh",
  frontGreave: "frontThigh",
  backShinguard: "backShin",
  frontShinguard: "frontShin",
  backBoot: "backFoot",
  frontBoot: "frontFoot",
};
const PAPER_DOLL_EQUIPMENT_LAYER_ORDER: Partial<Record<PaperDollEquipmentSlotKey, number>> = {
  backBoot: 10,
  frontBoot: 10,
  backShinguard: 20,
  frontShinguard: 20,
  backGlove: 30,
  frontGlove: 30,
  shield: 40,
};
const paperDollEquipmentSlotConfigs = new WeakMap<FighterPart, PaperDollPartAssetConfig>();

function getHeroItemEquipmentAssetKeys(itemId: HeroItemId): PaperDollEquipmentAssetKeys | undefined {
  return GENERATED_EQUIPMENT_ITEM_ASSET_KEYS[itemId] ?? AUTO_EQUIPMENT_ITEM_ASSET_KEYS[itemId];
}

export type CityTimeOfDay = "night" | "day";

const PLAYER_EQUIPMENT_CHANGE_EVENT = "gladiator-player-equipment-change";
const PLAYER_WEAPON_ENCHANTMENTS_CHANGE_EVENT = "gladiator-player-weapon-enchantments-change";
const PLAYER_APPEARANCE_CHANGE_EVENT = "gladiator-player-appearance-change";
const PLAYER_BODY_SCALE_CHANGE_EVENT = "gladiator-player-body-scale-change";
const CITY_TIME_OF_DAY_CHANGE_EVENT = "gladiator-city-time-of-day-change";

interface PlayerEquipmentChangeDetail {
  changedSlots?: readonly PaperDollEquipmentSlotKey[];
}

let readyCallback: ((scene: ArenaScene) => void) | undefined;
let cityReadyCallback: ((scene: CityHeroScene) => void) | undefined;
let debugAnimationScene: DebugCharacterScene | undefined;
let activePlayerEquipment: HeroEquipment | undefined;
let activePlayerWeaponEnchantments: HeroWeaponEnchantments = {};
let activePlayerAppearance: HeroAppearance = createDefaultHeroAppearance();
let activePlayerBodyScaleBonus = 0;
let activeCityTimeOfDay: CityTimeOfDay = "day";
let activePaperDollAssetsUseLowRes = false;
const arenaAssetPrewarmPromises = new Map<string, Promise<void>>();
let cityAssetPrewarmPromise: Promise<void> | undefined;
const assetPrewarmImages = new Set<HTMLImageElement>();
const arenaEffectPoolsByScene = new WeakMap<Phaser.Scene, ArenaEffectPools>();
const paperDollAssetLoadPromisesByScene = new WeakMap<Phaser.Scene, Map<string, Promise<void>>>();

const PAPER_DOLL_ASSETS_BY_KEY = createPaperDollAssetsByKey();
const PHASER_SMOOTH_RENDER_CONFIG: Phaser.Types.Core.RenderConfig = {
  antialias: true,
  antialiasGL: true,
  powerPreference: "low-power",
  roundPixels: true,
};
const PHASER_SHARP_RENDER_CONFIG: Phaser.Types.Core.RenderConfig = {
  antialias: false,
  antialiasGL: false,
  powerPreference: "low-power",
  roundPixels: true,
};
const PHASER_THIRTY_FPS_CONFIG: Phaser.Types.Core.FPSConfig = {
  target: 30,
};
const PHASER_SIXTY_FPS_CONFIG: Phaser.Types.Core.FPSConfig = {
  target: 60,
};

function getPlayerPhaserFpsConfig(): Phaser.Types.Core.FPSConfig {
  return getPlayerSettings().renderFps === 60 ? PHASER_SIXTY_FPS_CONFIG : PHASER_THIRTY_FPS_CONFIG;
}

function getPlayerPhaserRenderConfig(): Phaser.Types.Core.RenderConfig {
  return getPlayerSettings().smoothRendering ? PHASER_SMOOTH_RENDER_CONFIG : PHASER_SHARP_RENDER_CONFIG;
}

function didPlayerLowEffectsChange(detail: PlayerSettingsChangeDetail): boolean {
  return detail.previousSettings.lowEffects !== detail.nextSettings.lowEffects;
}

const CITY_PHASER_MAX_DEVICE_PIXEL_RATIO = 2;
const ARENA_PHASER_MAX_DEVICE_PIXEL_RATIO = 2;
const TELEGRAM_DESKTOP_PHASER_DEVICE_PIXEL_RATIO = 2;
const WEBGL_RECOVERY_OVERLAY_ID = "webglRecoveryOverlay";
const WEBGL_RECOVERY_REPORT_STORAGE_KEY = "dust-arena-webgl-crash-report";

interface WebglActivitySnapshot {
  action: string;
  screen?: string;
  shop?: string;
  itemIds?: readonly string[];
  price?: number;
  heroLevel?: number;
  heroGold?: number;
  purchaseBurstCount?: number;
  productCount?: number;
  itemCount?: number;
  at: string;
}

interface WebglRecoveryReport {
  version: 1;
  at: string;
  source: string;
  statusMessage?: string;
  href: string;
  userAgent: string;
  visibilityState: DocumentVisibilityState;
  window: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  canvas?: {
    width: number;
    height: number;
    clientWidth: number;
    clientHeight: number;
  };
  renderer: {
    type: string;
    actualFps?: number;
  };
  activity?: WebglActivitySnapshot;
}

let latestWebglActivity: WebglActivitySnapshot | undefined;

export function recordWebglActivity(activity: Omit<WebglActivitySnapshot, "at">): void {
  latestWebglActivity = {
    ...activity,
    at: new Date().toISOString(),
  };
}

interface PhaserGameSize {
  width: number;
  height: number;
  pixelRatio: number;
}

function bindWebglRecoveryOverlay(game: Phaser.Game, source: string): void {
  const bindCanvas = () => {
    const canvas = game.canvas;

    if (!canvas) {
      return;
    }

    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      const report = createWebglRecoveryReport(game, source, event);

      persistWebglRecoveryReport(report);
      showWebglRecoveryOverlay(report);
    }, { once: true });
  };

  if (game.canvas) {
    bindCanvas();
    return;
  }

  window.requestAnimationFrame(bindCanvas);
}

function createWebglRecoveryReport(game: Phaser.Game, source: string, event: Event): WebglRecoveryReport {
  const canvas = game.canvas;

  return {
    version: 1,
    at: new Date().toISOString(),
    source,
    statusMessage: getWebglContextStatusMessage(event),
    href: window.location.href,
    userAgent: window.navigator.userAgent,
    visibilityState: document.visibilityState,
    window: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    canvas: canvas
      ? {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight,
        }
      : undefined,
    renderer: {
      type: getPhaserRendererType(game),
      actualFps: Number.isFinite(game.loop.actualFps) ? Math.round(game.loop.actualFps) : undefined,
    },
    activity: latestWebglActivity,
  };
}

function getWebglContextStatusMessage(event: Event): string | undefined {
  const statusMessage = (event as WebGLContextEvent).statusMessage;

  return typeof statusMessage === "string" && statusMessage.trim() ? statusMessage : undefined;
}

function getPhaserRendererType(game: Phaser.Game): string {
  const renderer = game.renderer as { type?: number | string };

  if (renderer.type === Phaser.WEBGL) {
    return "webgl";
  }

  if (renderer.type === Phaser.CANVAS) {
    return "canvas";
  }

  return typeof renderer.type === "string" ? renderer.type : "unknown";
}

function persistWebglRecoveryReport(report: WebglRecoveryReport): void {
  try {
    window.localStorage.setItem(WEBGL_RECOVERY_REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch {
    // Embedded browsers can block storage; the recovery overlay is still useful.
  }
}

function showWebglRecoveryOverlay(report: WebglRecoveryReport): void {
  const existing = document.getElementById(WEBGL_RECOVERY_OVERLAY_ID) as HTMLElement | null;
  const overlay = existing ?? createWebglRecoveryOverlay();

  syncWebglRecoveryOverlayReport(overlay, report);
  overlay.hidden = false;
  document.body.classList.add("webgl-recovery-active");
  overlay.querySelector<HTMLButtonElement>(".webgl-recovery-overlay__button")?.focus({ preventScroll: true });
}

function createWebglRecoveryOverlay(): HTMLElement {
  const overlay = document.createElement("section");
  const panel = document.createElement("div");
  const title = document.createElement("strong");
  const text = document.createElement("p");
  const report = document.createElement("pre");
  const copyButton = document.createElement("button");
  const button = document.createElement("button");

  overlay.id = WEBGL_RECOVERY_OVERLAY_ID;
  overlay.className = "webgl-recovery-overlay";
  overlay.hidden = true;
  overlay.setAttribute("role", "alertdialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "webglRecoveryTitle");
  panel.className = "webgl-recovery-overlay__panel";
  title.id = "webglRecoveryTitle";
  title.className = "webgl-recovery-overlay__title";
  title.textContent = "TOO MUCH GLORY";
  text.className = "webgl-recovery-overlay__text";
  text.textContent = "The graphics need a quick reset.";
  report.className = "webgl-recovery-overlay__report";
  report.setAttribute("aria-label", "Crash report");
  copyButton.className = "webgl-recovery-overlay__copy";
  copyButton.type = "button";
  copyButton.textContent = "COPY REPORT";
  copyButton.addEventListener("click", () => {
    void copyWebglRecoveryReport(overlay, copyButton);
  });
  button.className = "webgl-recovery-overlay__button";
  button.type = "button";
  button.textContent = "RELOAD GAME";
  button.addEventListener("click", () => window.location.reload());
  panel.append(title, text, report, copyButton, button);
  overlay.append(panel);
  document.body.append(overlay);

  return overlay;
}

function syncWebglRecoveryOverlayReport(overlay: HTMLElement, report: WebglRecoveryReport): void {
  overlay.dataset.webglRecoveryReport = JSON.stringify(report);
  const reportNode = overlay.querySelector<HTMLElement>(".webgl-recovery-overlay__report");

  if (!reportNode) {
    return;
  }

  reportNode.textContent = formatWebglRecoveryReport(report);
}

function formatWebglRecoveryReport(report: WebglRecoveryReport): string {
  const activity = report.activity;
  const lines = [
    `SOURCE: ${report.source}`,
    `ACTION: ${activity?.action ?? "unknown"}`,
    `SHOP: ${activity?.shop ?? "-"}`,
    `BURST: ${activity?.purchaseBurstCount ?? "-"}`,
    `ITEMS: ${activity?.itemIds?.join(",") ?? "-"}`,
    `FPS: ${report.renderer.actualFps ?? "-"}`,
    `CANVAS: ${report.canvas ? `${report.canvas.width}x${report.canvas.height}` : "-"}`,
    `DPR: ${report.window.devicePixelRatio}`,
    `TIME: ${report.at}`,
  ];

  return lines.join("\n");
}

async function copyWebglRecoveryReport(overlay: HTMLElement, button: HTMLButtonElement): Promise<void> {
  const report = overlay.dataset.webglRecoveryReport;

  if (!report) {
    return;
  }

  try {
    await window.navigator.clipboard?.writeText(report);
    button.textContent = "COPIED";
  } catch {
    button.textContent = "COPY FAILED";
  }

  window.setTimeout(() => {
    button.textContent = "COPY REPORT";
  }, 1600);
}

interface CityCanvasProjection {
  parentRect: DOMRect;
  pixelRatio: number;
  cssScale: number;
  offsetX: number;
  offsetY: number;
}

interface PhaserScenePixelRatioCache {
  sceneWidth: number;
  sceneHeight: number;
  displayWidth: number;
  displayHeight: number;
  pixelRatio: number;
}

const phaserScenePixelRatioCache = new WeakMap<Phaser.Scene, PhaserScenePixelRatioCache>();
const arenaMainCameraViewportCache = new WeakMap<Phaser.Scene, { width: number; height: number }>();

function getPhaserDevicePixelRatio(maxDevicePixelRatio: number): number {
  if (typeof window === "undefined") {
    return 1;
  }

  const ratio = Number(window.devicePixelRatio);

  const browserPixelRatio = Number.isFinite(ratio) && ratio > 1 ? ratio : 1;

  return Math.min(maxDevicePixelRatio, Math.max(getTelegramDesktopPhaserDevicePixelRatio(), browserPixelRatio));
}

function getTelegramDesktopPhaserDevicePixelRatio(): number {
  return getTelegramWebAppPlatform().toLowerCase() === "tdesktop" ? TELEGRAM_DESKTOP_PHASER_DEVICE_PIXEL_RATIO : 1;
}

export function getCityEffectivePhaserDevicePixelRatio(): number {
  return getPhaserDevicePixelRatio(CITY_PHASER_MAX_DEVICE_PIXEL_RATIO);
}

function getPhaserGameSize(parent: HTMLElement | null, maxDevicePixelRatio: number): PhaserGameSize {
  const pixelRatio = getPhaserDevicePixelRatio(maxDevicePixelRatio);
  const logicalWidth = Math.max(1, parent?.clientWidth || GAME_WIDTH);
  const logicalHeight = Math.max(1, parent?.clientHeight || GAME_HEIGHT);

  return {
    width: Math.max(1, Math.round(logicalWidth * pixelRatio)),
    height: Math.max(1, Math.round(logicalHeight * pixelRatio)),
    pixelRatio,
  };
}

function getFixedPhaserGameSize(logicalWidth: number, logicalHeight: number, maxDevicePixelRatio: number): PhaserGameSize {
  const pixelRatio = getPhaserDevicePixelRatio(maxDevicePixelRatio);

  return {
    width: Math.max(1, Math.round(logicalWidth * pixelRatio)),
    height: Math.max(1, Math.round(logicalHeight * pixelRatio)),
    pixelRatio,
  };
}

function getPhaserScenePixelRatio(scene: Phaser.Scene, maxDevicePixelRatio: number): number {
  const sceneWidth = Math.max(1, scene.scale.width || scene.game.canvas.width || GAME_WIDTH);
  const sceneHeight = Math.max(1, scene.scale.height || scene.game.canvas.height || GAME_HEIGHT);
  const displayWidth = getPositivePhaserDimension(scene.scale.displaySize?.width, sceneWidth);
  const displayHeight = getPositivePhaserDimension(scene.scale.displaySize?.height, sceneHeight);
  const cached = phaserScenePixelRatioCache.get(scene);

  if (
    cached &&
    cached.sceneWidth === sceneWidth &&
    cached.sceneHeight === sceneHeight &&
    cached.displayWidth === displayWidth &&
    cached.displayHeight === displayHeight
  ) {
    return cached.pixelRatio;
  }

  const ratioX = sceneWidth / displayWidth;
  const ratioY = sceneHeight / displayHeight;
  const ratio = Math.max(ratioX, ratioY);
  const pixelRatio = Number.isFinite(ratio) && ratio > 1 ? Math.min(maxDevicePixelRatio, ratio) : 1;

  phaserScenePixelRatioCache.set(scene, { sceneWidth, sceneHeight, displayWidth, displayHeight, pixelRatio });

  return pixelRatio;
}

function getPositivePhaserDimension(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function getArenaPhaserGameSize(parent: HTMLElement | null): PhaserGameSize {
  return getPhaserGameSize(parent, ARENA_PHASER_MAX_DEVICE_PIXEL_RATIO);
}

function getArenaScenePixelRatio(scene: Phaser.Scene): number {
  return getPhaserScenePixelRatio(scene, ARENA_PHASER_MAX_DEVICE_PIXEL_RATIO);
}

function getCityPhaserGameSize(): PhaserGameSize {
  return getFixedPhaserGameSize(GAME_WIDTH, GAME_HEIGHT, CITY_PHASER_MAX_DEVICE_PIXEL_RATIO);
}

function getFixedPhaserScenePixelRatio(
  scene: Phaser.Scene,
  logicalWidth: number,
  logicalHeight: number,
  maxDevicePixelRatio: number,
): number {
  const sceneWidth = Math.max(1, scene.scale.width || scene.game.canvas.width || logicalWidth);
  const sceneHeight = Math.max(1, scene.scale.height || scene.game.canvas.height || logicalHeight);
  const ratioX = sceneWidth / Math.max(1, logicalWidth);
  const ratioY = sceneHeight / Math.max(1, logicalHeight);
  const ratio = Math.min(ratioX, ratioY);

  return Number.isFinite(ratio) && ratio > 1 ? Math.min(maxDevicePixelRatio, ratio) : 1;
}

function getCityCanvasProjection(parent: HTMLElement, pixelRatio: number): CityCanvasProjection {
  const parentRect = parent.getBoundingClientRect();
  const parentWidth = Math.max(1, parentRect.width || parent.clientWidth || GAME_WIDTH);
  const parentHeight = Math.max(1, parentRect.height || parent.clientHeight || GAME_HEIGHT);
  const cssScale = Math.max(parentWidth / GAME_WIDTH, parentHeight / GAME_HEIGHT);
  const displayWidth = GAME_WIDTH * cssScale;
  const displayHeight = GAME_HEIGHT * cssScale;

  return {
    parentRect,
    pixelRatio,
    cssScale,
    offsetX: (parentWidth - displayWidth) / 2,
    offsetY: (parentHeight - displayHeight) / 2,
  };
}

function projectCityLocalX(value: number, projection: CityCanvasProjection): number {
  return ((value - projection.offsetX) / projection.cssScale) * projection.pixelRatio;
}

function projectCityLocalY(value: number, projection: CityCanvasProjection): number {
  return ((value - projection.offsetY) / projection.cssScale) * projection.pixelRatio;
}

function projectCityLength(value: number, projection: CityCanvasProjection): number {
  return (value / projection.cssScale) * projection.pixelRatio;
}

function scaleCityDomY(value: number | undefined, parent: HTMLElement, pixelRatio: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return projectCityLocalY(value, getCityCanvasProjection(parent, pixelRatio));
}

function scaleCityProfilePreviewLayout(
  layout: CityProfilePreviewLayout | undefined,
  parent: HTMLElement,
  pixelRatio: number,
): CityProfilePreviewLayout | undefined {
  if (!layout) {
    return undefined;
  }

  const projection = getCityCanvasProjection(parent, pixelRatio);

  return {
    centerX: projectCityLocalX(layout.centerX - projection.parentRect.left, projection),
    visualBottomY: projectCityLocalY(layout.visualBottomY - projection.parentRect.top, projection),
    fitTopY: typeof layout.fitTopY === "number" && Number.isFinite(layout.fitTopY)
      ? projectCityLocalY(layout.fitTopY - projection.parentRect.top, projection)
      : undefined,
    fitWidth: typeof layout.fitWidth === "number" && Number.isFinite(layout.fitWidth)
      ? projectCityLength(layout.fitWidth, projection)
      : undefined,
    scale: layout.scale,
  };
}

function areCityProfilePreviewLayoutsEqual(left: CityProfilePreviewLayout | undefined, right: CityProfilePreviewLayout | undefined): boolean {
  if (!left || !right) {
    return left === right;
  }

  return left.centerX === right.centerX
    && left.visualBottomY === right.visualBottomY
    && left.fitTopY === right.fitTopY
    && left.fitWidth === right.fitWidth
    && left.scale === right.scale;
}

function getCityScenePixelRatio(scene: Phaser.Scene): number {
  return getFixedPhaserScenePixelRatio(scene, GAME_WIDTH, GAME_HEIGHT, CITY_PHASER_MAX_DEVICE_PIXEL_RATIO);
}

function part(gameObject: Phaser.GameObjects.GameObject): FighterPart {
  return gameObject as FighterPart;
}

function getArenaBackgroundLayerConfigs(encounter?: ArenaBackgroundPreloadEncounter): ArenaBackgroundLayerConfig[] {
  if (!encounter) {
    return ARENA_BACKGROUND_ASSET_SETS.flatMap((assetSet) => assetSet.layers);
  }

  return getArenaBackgroundAssetSetForEncounter(encounter).layers;
}

function preloadArenaAssets(target: Phaser.Scene, encounter?: ArenaBackgroundPreloadEncounter): void {
  getArenaBackgroundLayerConfigs(encounter).forEach((asset) => target.load.image(asset.key, asset.url));
  target.load.image(DAMAGE_BLOCK_ICON_ASSET_KEY, DAMAGE_BLOCK_ICON_ASSET_URL);
  target.load.image(DAMAGE_HIT_ICON_ASSET_KEY, DAMAGE_HIT_ICON_ASSET_URL);
  target.load.image(DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY, DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL);
  target.load.image(DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY, DAMAGE_ARMOR_BREAK_ICON_ASSET_URL);
  target.load.image(REST_ZZZ_ICON_ASSET_KEY, REST_ZZZ_ICON_ASSET_URL);
  target.load.image(ARROW_ICON_ASSET_KEY, ARROW_ICON_ASSET_URL);
  target.load.image(SHURIKEN_PROJECTILE_ASSET_KEY, SHURIKEN_PROJECTILE_ASSET_URL);
  target.load.image(FIREBALL_PROJECTILE_ASSET_KEY, FIREBALL_PROJECTILE_ASSET_URL);
  target.load.image(WARD_SHIELD_EFFECT_ASSET_KEY, WARD_SHIELD_EFFECT_ASSET_URL);
  target.load.image(REST_HEALTH_ICON_ASSET_KEY, REST_HEALTH_ICON_ASSET_URL);
  target.load.image(REST_STAMINA_ICON_ASSET_KEY, REST_STAMINA_ICON_ASSET_URL);
  preloadScrollCastPropAssets(target);
}

function getArenaAssetPrewarmKey(encounter?: ArenaBackgroundPreloadEncounter): string {
  if (!encounter) {
    return "all";
  }

  const assetSet = getArenaBackgroundAssetSetForEncounter(encounter);

  return getArenaBackgroundAssetSetKey(assetSet.tierId, assetSet.variantId);
}

export function prewarmArenaAssetsForBrowserCache(encounter?: ArenaBackgroundPreloadEncounter): Promise<void> {
  const prewarmKey = getArenaAssetPrewarmKey(encounter);
  const existingPromise = arenaAssetPrewarmPromises.get(prewarmKey);

  if (existingPromise) {
    return existingPromise;
  }

  const prewarmPromise = Promise.all([...new Set(getArenaAssetPrewarmUrls(encounter))].map(prewarmImageUrl)).then(() => undefined);

  arenaAssetPrewarmPromises.set(prewarmKey, prewarmPromise);

  return prewarmPromise;
}

export function prewarmCityAssetsForBrowserCache(): Promise<void> {
  cityAssetPrewarmPromise ??= getCityAssetPrewarmUrls()
    .then((urls) => Promise.all([...new Set(urls)].map(prewarmImageUrl)))
    .then(() => undefined);

  return cityAssetPrewarmPromise;
}

function preloadCityAssets(target: Phaser.Scene): void {
  target.load.image(CITY_BACKGROUND_ASSET_KEY, CITY_BACKGROUND_ASSET_URL);
  target.load.image(CITY_DAY_BACKGROUND_ASSET_KEY, CITY_DAY_BACKGROUND_ASSET_URL);
  target.load.image(CITY_SHOP_BACKGROUND_ASSET_KEY, CITY_SHOP_BACKGROUND_ASSET_URL);
  CITY_CLOUD_ASSETS.forEach((asset) => target.load.image(asset.key, asset.url));
}

function preloadPaperDollAssets(target: Phaser.Scene, equipmentStates: readonly (HeroEquipment | undefined)[] = [activePlayerEquipment]): void {
  activePaperDollAssetsUseLowRes = getPlayerSettings().lowEffects;
  const loadedAssetKeys = new Set<string>();

  preloadScrollCastPropAssets(target);

  getSyncPaperDollAssetLoadEntriesForEquipmentStates(activePaperDollAssetsUseLowRes, equipmentStates, [activePlayerAppearance]).forEach((asset) => {
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
  const syncTextures = (): void => {
    activePaperDollAssetsUseLowRes = lowRes;
    fighters.forEach(syncFighterPaperDollTextureResolution);
    onSynced?.();
  };

  void getPaperDollAssetLoadEntriesForEquipmentStates(lowRes, fighters.map(getFighterPaperDollEquipmentState), fighters.map(getFighterPaperDollAppearanceState))
    .then((loadEntries) => ensurePaperDollAssetEntriesLoaded(target, loadEntries))
    .then(syncTextures);
}

function createPaperDollAssetsByKey(): ReadonlyMap<string, PaperDollAssetDefinition> {
  const assetsByKey = new Map<string, PaperDollAssetDefinition>();

  ([...FIGHTER_PAPER_DOLL_ASSETS, ...HERO_APPEARANCE_ASSETS, ...GENERATED_EQUIPMENT_ASSETS, ...AUTO_EQUIPMENT_ASSETS] as readonly PaperDollAssetDefinition[]).forEach((asset) => {
    if (!assetsByKey.has(asset.key)) {
      assetsByKey.set(asset.key, asset);
    }
  });

  return assetsByKey;
}

function getPaperDollAssetLoadEntriesForEquipmentStates(
  lowRes: boolean,
  equipmentStates: readonly (HeroEquipment | undefined)[] = [],
  appearanceStates: readonly (HeroAppearance | undefined)[] = [],
): Promise<PaperDollAssetLoadEntry[]> {
  return getPaperDollAssetLoadEntriesForKeys(lowRes, getPaperDollAssetKeysForEquipmentStates(equipmentStates, appearanceStates));
}

function getSyncPaperDollAssetLoadEntriesForEquipmentStates(
  lowRes: boolean,
  equipmentStates: readonly (HeroEquipment | undefined)[] = [],
  appearanceStates: readonly (HeroAppearance | undefined)[] = [],
): PaperDollAssetLoadEntry[] {
  const entries = new Map<string, string>();

  for (const assetKey of getPaperDollAssetKeysForEquipmentStates(equipmentStates, appearanceStates)) {
    const asset = PAPER_DOLL_ASSETS_BY_KEY.get(assetKey);

    if (!asset?.url) {
      continue;
    }

    const key = getFighterTextureKey(asset.key, lowRes);
    const url = lowRes ? asset.lowUrl ?? asset.url : asset.url;

    entries.set(key, url);
  }

  return [...entries.entries()].map(([key, url]) => ({ key, url }));
}

async function getPaperDollAssetLoadEntriesForKeys(lowRes: boolean, assetKeys: Iterable<string>): Promise<PaperDollAssetLoadEntry[]> {
  const entries = new Map<string, string>();

  for (const assetKey of assetKeys) {
    const asset = PAPER_DOLL_ASSETS_BY_KEY.get(assetKey);

    if (!asset) {
      continue;
    }

    const key = getFighterTextureKey(asset.key, lowRes);
    const url = await resolvePaperDollAssetUrl(asset, lowRes);

    if (url) {
      entries.set(key, url);
    }
  }

  return [...entries.entries()].map(([key, url]) => ({ key, url }));
}

async function resolvePaperDollAssetUrl(asset: PaperDollAssetDefinition, lowRes: boolean): Promise<string | undefined> {
  if (lowRes) {
    if (asset.lowUrl) {
      return asset.lowUrl;
    }

    if (asset.lowSourcePath) {
      return (await resolvePaperDollSourceAssetUrl(asset.lowSourcePath)) ?? asset.url ?? (asset.sourcePath ? resolvePaperDollSourceAssetUrl(asset.sourcePath) : undefined);
    }
  }

  return asset.url ?? (asset.sourcePath ? resolvePaperDollSourceAssetUrl(asset.sourcePath) : undefined);
}

function resolvePaperDollSourceAssetUrl(sourcePath: string): Promise<string | undefined> {
  if (sourcePath.startsWith("assets/fighters/appearance/")) {
    return resolveHeroAppearanceAssetUrl(sourcePath);
  }

  return resolveEquipmentAssetUrl(sourcePath);
}

function getPaperDollAssetKeysForEquipmentStates(
  equipmentStates: readonly (HeroEquipment | undefined)[],
  appearanceStates: readonly (HeroAppearance | undefined)[] = [],
): string[] {
  const assetKeys = new Set<string>();

  FIGHTER_PAPER_DOLL_ASSETS.forEach((asset) => assetKeys.add(asset.key));
  appearanceStates.forEach((appearance) => {
    getHeroAppearanceAssetKeys(appearance).forEach((assetKey) => assetKeys.add(assetKey));
  });
  equipmentStates.forEach((equipment) => {
    Object.values(getPlayerEquipmentAssetKeys(equipment)).forEach((assetKey) => {
      if (typeof assetKey === "string") {
        assetKeys.add(assetKey);
      }
    });
  });

  return [...assetKeys];
}

function getFighterPaperDollEquipmentState(fighter: FighterVisual | undefined): HeroEquipment | undefined {
  const rig = fighter?.paperDollRig;

  if (!rig) {
    return undefined;
  }

  return rig.usesPlayerEquipment ? activePlayerEquipment : rig.equipmentState;
}

function getFighterPaperDollAppearanceState(fighter: FighterVisual | undefined): HeroAppearance | undefined {
  const rig = fighter?.paperDollRig;

  if (!rig) {
    return undefined;
  }

  return rig.usesPlayerEquipment ? activePlayerAppearance : rig.appearanceState;
}

function ensurePaperDollEquipmentAssetsLoaded(
  target: Phaser.Scene,
  equipmentStates: readonly (HeroEquipment | undefined)[],
): Promise<void> {
  const lowRes = getPlayerSettings().lowEffects;
  const assetKeys = new Set<string>();

  equipmentStates.forEach((equipment) => {
    Object.values(getPlayerEquipmentAssetKeys(equipment)).forEach((assetKey) => {
      if (typeof assetKey === "string") {
        assetKeys.add(assetKey);
      }
    });
  });

  return getPaperDollAssetLoadEntriesForKeys(lowRes, assetKeys).then((entries) => ensurePaperDollAssetEntriesLoaded(target, entries));
}

function ensurePaperDollAppearanceAssetsLoaded(
  target: Phaser.Scene,
  appearanceStates: readonly (HeroAppearance | undefined)[],
): Promise<void> {
  const lowRes = getPlayerSettings().lowEffects;
  const assetKeys = new Set<string>();

  appearanceStates.forEach((appearance) => {
    getHeroAppearanceAssetKeys(appearance).forEach((assetKey) => assetKeys.add(assetKey));
  });

  return getPaperDollAssetLoadEntriesForKeys(lowRes, assetKeys).then((entries) => ensurePaperDollAssetEntriesLoaded(target, entries));
}

function ensurePaperDollItemAssetsLoaded(target: Phaser.Scene, itemIds: readonly HeroItemId[]): Promise<void> {
  const lowRes = getPlayerSettings().lowEffects;
  const assetKeys = new Set<string>();

  itemIds.forEach((itemId) => {
    const itemAssetKeys = getHeroItemEquipmentAssetKeys(itemId);

    if (!itemAssetKeys) {
      return;
    }

    Object.values(itemAssetKeys).forEach((assetKey) => {
      if (typeof assetKey === "string") {
        assetKeys.add(assetKey);
      }
    });
  });

  return getPaperDollAssetLoadEntriesForKeys(lowRes, assetKeys).then((entries) => ensurePaperDollAssetEntriesLoaded(target, entries));
}

function ensurePaperDollAssetEntriesLoaded(target: Phaser.Scene, entries: readonly PaperDollAssetLoadEntry[]): Promise<void> {
  const missingEntries = entries.filter((entry) => !target.textures.exists(entry.key));

  if (missingEntries.length === 0) {
    return Promise.resolve();
  }

  const pendingLoads = getPendingPaperDollAssetLoads(target);
  const entriesToQueue: PaperDollAssetLoadEntry[] = [];
  const promises: Promise<void>[] = [];

  missingEntries.forEach((entry) => {
    const pendingLoad = pendingLoads.get(entry.key);

    if (pendingLoad) {
      promises.push(pendingLoad);
      return;
    }

    entriesToQueue.push(entry);
  });

  if (entriesToQueue.length > 0) {
    const queuedLoad = new Promise<void>((resolve) => {
      const finish = () => {
        entriesToQueue.forEach((entry) => pendingLoads.delete(entry.key));
        resolve();
      };

      target.load.once(Phaser.Loader.Events.COMPLETE, finish);
      entriesToQueue.forEach((entry) => target.load.image(entry.key, entry.url));
      if (!target.load.isLoading()) {
        target.load.start();
      }
    });

    entriesToQueue.forEach((entry) => pendingLoads.set(entry.key, queuedLoad));
    promises.push(queuedLoad);
  }

  return Promise.all(promises).then(() => undefined);
}

function getPendingPaperDollAssetLoads(target: Phaser.Scene): Map<string, Promise<void>> {
  let pendingLoads = paperDollAssetLoadPromisesByScene.get(target);

  if (!pendingLoads) {
    pendingLoads = new Map();
    paperDollAssetLoadPromisesByScene.set(target, pendingLoads);
  }

  return pendingLoads;
}

function getArenaAssetPrewarmUrls(encounter?: ArenaBackgroundPreloadEncounter): string[] {
  return [
    ...getArenaBackgroundLayerConfigs(encounter).map((asset) => asset.url),
    DAMAGE_BLOCK_ICON_ASSET_URL,
    DAMAGE_HIT_ICON_ASSET_URL,
    DAMAGE_ARMOR_ABSORB_ICON_ASSET_URL,
    DAMAGE_ARMOR_BREAK_ICON_ASSET_URL,
    REST_ZZZ_ICON_ASSET_URL,
    ARROW_ICON_ASSET_URL,
    SHURIKEN_PROJECTILE_ASSET_URL,
    FIREBALL_PROJECTILE_ASSET_URL,
    WARD_SHIELD_EFFECT_ASSET_URL,
    REST_HEALTH_ICON_ASSET_URL,
    REST_STAMINA_ICON_ASSET_URL,
    ...SCROLL_CAST_PROP_ASSETS.map((asset) => asset.url),
  ];
}

async function getCityAssetPrewarmUrls(): Promise<string[]> {
  const paperDollUrls = await getPaperDollAssetLoadEntriesForEquipmentStates(getPlayerSettings().lowEffects, [activePlayerEquipment], [activePlayerAppearance]);

  return [
    CITY_BACKGROUND_ASSET_URL,
    CITY_DAY_BACKGROUND_ASSET_URL,
    CITY_SHOP_BACKGROUND_ASSET_URL,
    ...CITY_CLOUD_ASSETS.map((asset) => asset.url),
    ...paperDollUrls.map((asset) => asset.url),
  ];
}

function prewarmImageUrl(url: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const image = new Image();
    const finish = () => {
      assetPrewarmImages.delete(image);
      resolve();
    };

    assetPrewarmImages.add(image);
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

function getPaperDollBodyPreset(preset: PaperDollBodyPreset): PaperDollBodyPresetDefinition {
  return PAPER_DOLL_BODY_PRESETS[preset] ?? PAPER_DOLL_BODY_PRESETS.classic;
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
  if (activePlayerEquipment && areHeroEquipmentStatesEqual(activePlayerEquipment, equipment)) {
    return;
  }

  const changedSlots = activePlayerEquipment ? getChangedHeroEquipmentSlots(activePlayerEquipment, equipment) : undefined;

  activePlayerEquipment = { ...equipment };
  notifyPlayerEquipmentChanged(changedSlots);
}

export function setPlayerWeaponEnchantments(enchantments: HeroWeaponEnchantments | undefined): void {
  const nextEnchantments = { ...(enchantments ?? {}) };

  if (areHeroWeaponEnchantmentsEqual(activePlayerWeaponEnchantments, nextEnchantments)) {
    return;
  }

  activePlayerWeaponEnchantments = nextEnchantments;
  notifyPlayerWeaponEnchantmentsChanged();
}

export function setPlayerAppearance(appearance: HeroAppearance): void {
  if (areHeroAppearanceStatesEqual(activePlayerAppearance, appearance)) {
    return;
  }

  activePlayerAppearance = { ...appearance };
  notifyPlayerAppearanceChanged();
}

export function setPlayerBodyScaleBonus(bodyScaleBonus: number): void {
  const nextBodyScaleBonus = Math.max(0, Number.isFinite(bodyScaleBonus) ? bodyScaleBonus : 0);

  if (Math.abs(activePlayerBodyScaleBonus - nextBodyScaleBonus) < 0.001) {
    return;
  }

  activePlayerBodyScaleBonus = nextBodyScaleBonus;
  notifyPlayerBodyScaleChanged();
}

function getCityPlayerBodyScaleMultiplier(liftProgress: number): number {
  return 1 + activePlayerBodyScaleBonus * clampNumber(1 - liftProgress, 0, 1);
}

function areHeroEquipmentStatesEqual(left: HeroEquipment, right: HeroEquipment): boolean {
  return HERO_EQUIPMENT_SLOT_KEYS.every((slotKey) => (left[slotKey] ?? null) === (right[slotKey] ?? null));
}

function areHeroWeaponEnchantmentsEqual(left: HeroWeaponEnchantments, right: HeroWeaponEnchantments): boolean {
  const itemIds = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const itemId of itemIds) {
    if ((left[itemId]?.level ?? 0) !== (right[itemId]?.level ?? 0)) {
      return false;
    }
  }

  return true;
}

function getChangedHeroEquipmentSlots(left: HeroEquipment, right: HeroEquipment): PaperDollEquipmentSlotKey[] {
  return PAPER_DOLL_EQUIPMENT_SLOT_KEYS.filter((slotKey) => (left[slotKey] ?? null) !== (right[slotKey] ?? null));
}

function areHeroAppearanceStatesEqual(left: HeroAppearance | undefined, right: HeroAppearance | undefined): boolean {
  return (left?.hairId ?? null) === (right?.hairId ?? null) && (left?.beardId ?? null) === (right?.beardId ?? null);
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

function usePlayerAppearance(appearance: HeroAppearance | undefined): void {
  if (appearance) {
    setPlayerAppearance(appearance);
  }
}

function getPlayerEquipmentAssetKeys(equipment = activePlayerEquipment): PaperDollEquipmentAssetKeys {
  const defaultAssetKeys = { ...DEFAULT_PLAYER_EQUIPMENT_ASSET_KEYS };

  if (!equipment) {
    return defaultAssetKeys;
  }

  return Object.values(equipment).reduce((assetKeys, itemId) => {
    if (!itemId) {
      return assetKeys;
    }

    const itemAssetKeys = getHeroItemEquipmentAssetKeys(itemId);

    return itemAssetKeys ? { ...assetKeys, ...itemAssetKeys } : assetKeys;
  }, defaultAssetKeys);
}

function createPlayerEquipmentAssetKeys(equipment = activePlayerEquipment): PaperDollEquipmentAssetKeys {
  return getActivePaperDollEquipmentAssetKeys(getPlayerEquipmentAssetKeys(equipment));
}

function createPlayerAppearanceAssetKeys(
  appearance = activePlayerAppearance,
  bodyPresetKey: PaperDollBodyPreset = debugTuning.paperDollBodyPreset,
): Partial<Record<PaperDollAppearanceLayerKey, string>> {
  if (!shouldUsePaperDollAppearanceAssets(bodyPresetKey)) {
    return {};
  }

  const hairAsset = getHeroAppearanceAsset(appearance?.hairId);
  const beardAsset = getHeroAppearanceAsset(appearance?.beardId);

  return {
    ...(hairAsset ? { hair: hairAsset.key } : {}),
    ...(beardAsset ? { beard: beardAsset.key } : {}),
  };
}

function shouldUsePaperDollAppearanceAssets(bodyPresetKey: PaperDollBodyPreset | undefined): boolean {
  return (bodyPresetKey ?? debugTuning.paperDollBodyPreset) === "dummy-v2";
}

function getPlayerEquipmentSlotAssetKey(equipment: HeroEquipment, slotKey: PaperDollEquipmentSlotKey): string | undefined {
  const assetKey = PLAYER_EQUIPMENT_ASSET_KEY_BY_SLOT[slotKey];
  const itemId = equipment[slotKey];
  const itemAssetKeys = itemId ? getHeroItemEquipmentAssetKeys(itemId) : undefined;
  const textureKey = itemAssetKeys?.[assetKey] ?? DEFAULT_PLAYER_EQUIPMENT_ASSET_KEYS[assetKey];

  return typeof textureKey === "string" ? getActivePaperDollAssetKey(textureKey) : undefined;
}

function getHeroItemEquipmentTextureKeys(itemId: HeroItemId): string[] {
  const itemAssetKeys = getHeroItemEquipmentAssetKeys(itemId);

  if (!itemAssetKeys) {
    return [];
  }

  return Object.values(getActivePaperDollEquipmentAssetKeys(itemAssetKeys))
    .filter((textureKey): textureKey is string => typeof textureKey === "string");
}

function createPlayerEquipmentVisibility(
  equipment = activePlayerEquipment,
  preferredWeaponSlot?: PaperDollWeaponSlotKey,
): Record<PaperDollEquipmentSlotKey, boolean> {
  if (!equipment) {
    return Object.fromEntries(PAPER_DOLL_EQUIPMENT_SLOT_KEYS.map((slotKey) => [slotKey, false])) as Record<PaperDollEquipmentSlotKey, boolean>;
  }

  const hasPreferredBowVisualAsset = Boolean(
    preferredWeaponSlot === "weaponBow" && equipment.weaponBow && getHeroItemEquipmentAssetKeys(equipment.weaponBow)?.weaponBowAssetKey,
  );

  return Object.fromEntries(
    PAPER_DOLL_EQUIPMENT_SLOT_KEYS.map((slotKey) => {
      const itemId = equipment[slotKey];
      const assetKey = PLAYER_EQUIPMENT_ASSET_KEY_BY_SLOT[slotKey];
      const hasVisualAsset = Boolean(itemId && getHeroItemEquipmentAssetKeys(itemId)?.[assetKey]);
      const isInactiveMainWeapon = slotKey === "weaponMain" && hasPreferredBowVisualAsset;
      const isInactiveAuxiliaryBow = slotKey === "weaponBow" && preferredWeaponSlot !== "weaponBow" && Boolean(equipment.weaponMain);

      return [slotKey, hasVisualAsset && !isInactiveMainWeapon && !isInactiveAuxiliaryBow];
    }),
  ) as Record<PaperDollEquipmentSlotKey, boolean>;
}

function notifyPlayerEquipmentChanged(changedSlots?: readonly PaperDollEquipmentSlotKey[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<PlayerEquipmentChangeDetail>(PLAYER_EQUIPMENT_CHANGE_EVENT, { detail: { changedSlots } }));
}

function notifyPlayerWeaponEnchantmentsChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(PLAYER_WEAPON_ENCHANTMENTS_CHANGE_EVENT));
}

function notifyPlayerAppearanceChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<HeroAppearance>(PLAYER_APPEARANCE_CHANGE_EVENT, { detail: { ...activePlayerAppearance } }));
}

function notifyPlayerBodyScaleChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(PLAYER_BODY_SCALE_CHANGE_EVENT));
}

function notifyCityTimeOfDayChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<CityTimeOfDay>(CITY_TIME_OF_DAY_CHANGE_EVENT, { detail: activeCityTimeOfDay }));
}

function subscribePlayerEquipmentChanges(callback: (detail: PlayerEquipmentChangeDetail) => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event): void => {
    callback(event instanceof CustomEvent ? ((event as CustomEvent<PlayerEquipmentChangeDetail>).detail ?? {}) : {});
  };

  window.addEventListener(PLAYER_EQUIPMENT_CHANGE_EVENT, listener);

  return () => window.removeEventListener(PLAYER_EQUIPMENT_CHANGE_EVENT, listener);
}

function subscribePlayerWeaponEnchantmentsChanges(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(PLAYER_WEAPON_ENCHANTMENTS_CHANGE_EVENT, callback);

  return () => window.removeEventListener(PLAYER_WEAPON_ENCHANTMENTS_CHANGE_EVENT, callback);
}

function subscribePlayerAppearanceChanges(callback: (appearance: HeroAppearance) => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event): void => {
    callback(event instanceof CustomEvent ? ((event as CustomEvent<HeroAppearance>).detail ?? activePlayerAppearance) : activePlayerAppearance);
  };

  window.addEventListener(PLAYER_APPEARANCE_CHANGE_EVENT, listener);

  return () => window.removeEventListener(PLAYER_APPEARANCE_CHANGE_EVENT, listener);
}

function subscribePlayerBodyScaleChanges(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(PLAYER_BODY_SCALE_CHANGE_EVENT, callback);

  return () => window.removeEventListener(PLAYER_BODY_SCALE_CHANGE_EVENT, callback);
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
  private syncToken = 0;
  private renderOnlyToken = 0;
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;
  private unsubscribePlayerAppearance?: () => void;
  private unsubscribePlayerSettings?: () => void;
  private arenaBackgroundLayerDragState?: ArenaBackgroundLayerDragState;

  constructor(private readonly initialEncounter?: ArenaBackgroundPreloadEncounter) {
    super("ArenaScene");
  }

  preload(): void {
    preloadArenaAssets(this, this.initialEncounter);
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    syncArenaMainCamera(this);
    this.arenaLayers = createArenaLayers(this);
    drawArenaBackground(this, this.arenaLayers, this.initialEncounter);
    this.visuals = buildVisuals(this);
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => {
      syncFighterBodyPreset(this.visuals?.player);
      syncFighterBodyPreset(this.visuals?.helper);
      syncFighterBodyPreset(this.visuals?.enemy);
      if (this.currentState) {
        renderScene(this, this.currentState);
      }
    });
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(({ changedSlots }) =>
      syncFighterEquipmentVisibility(this.visuals?.player, changedSlots),
    );
    this.unsubscribePlayerAppearance = subscribePlayerAppearanceChanges((appearance) => {
      void ensurePaperDollAppearanceAssetsLoaded(this, [appearance]).then(() => syncPaperDollAppearanceState(this.visuals?.player.paperDollRig, appearance));
    });
    this.unsubscribePlayerSettings = subscribePlayerSettings((detail) => {
      if (!didPlayerLowEffectsChange(detail)) {
        return;
      }

      ensurePaperDollAssetResolution(this, getPlayerSettings().lowEffects, [this.visuals?.player, this.visuals?.helper, this.visuals?.enemy], () => {
        if (this.currentState) {
          renderScene(this, this.currentState);
        }
      });
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.beginArenaBackgroundLayerDrag(pointer));
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.dragArenaBackgroundLayer(pointer));
    this.input.on("pointerup", () => this.endArenaBackgroundLayerDrag());
    this.input.on("pointerupoutside", () => this.endArenaBackgroundLayerDrag());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
      this.unsubscribePlayerAppearance?.();
      this.unsubscribePlayerSettings?.();
      this.input.off("pointerdown");
      this.input.off("pointermove");
      this.input.off("pointerup");
      this.input.off("pointerupoutside");
    });
    readyCallback?.(this);
  }

  update(time: number): void {
    const playerSettings = getPlayerSettings();

    applyFighterArrowCountersSceneScale(this);

    const animationAmount = getArenaAnimationAmount();

    if (!this.visuals || animationAmount <= 0) {
      return;
    }

    applyLoopingBodyAnimation(this.visuals.player, time, getFighterBodyIdleAnimation(this.visuals.player), animationAmount);
    if (this.visuals.helper) {
      applyLoopingBodyAnimation(this.visuals.helper, time, getFighterBodyIdleAnimation(this.visuals.helper), animationAmount);
    }
    applyLoopingBodyAnimation(this.visuals.enemy, time, getFighterBodyIdleAnimation(this.visuals.enemy), animationAmount);
    if (areArenaVfxEnabled(playerSettings)) {
      if (this.visuals.helper) {
        updateRestZzzEffects(this, this.visuals.helper, time);
      }
      updateRestZzzEffects(this, this.visuals.enemy, time);
    }
  }

  private beginArenaBackgroundLayerDrag(pointer: Phaser.Input.Pointer): void {
    if (!debugTuning.arenaBackgroundEditMode || !this.arenaLayers || !this.currentState || !isPrimaryPointerDown(pointer)) {
      return;
    }

    const assetSet = getArenaBackgroundAssetSetForEncounter(this.currentState.encounter);
    const tierId = getArenaBackgroundTuningTierId(assetSet.tierId);

    beginDebugUndoGroup();
    this.arenaBackgroundLayerDragState = {
      tierId,
      variantId: assetSet.variantId,
      layerKey: getEditableArenaBackgroundLayer(tierId, debugTuning.arenaBackgroundEditLayer, assetSet.variantId),
      lastPointerX: pointer.worldX,
      lastPointerY: pointer.worldY,
    };
  }

  private dragArenaBackgroundLayer(pointer: Phaser.Input.Pointer): void {
    const dragState = this.arenaBackgroundLayerDragState;

    if (!dragState || !this.arenaLayers) {
      return;
    }

    if (!isPrimaryPointerDown(pointer)) {
      this.endArenaBackgroundLayerDrag();
      return;
    }

    const layerContainer = this.arenaLayers.backgroundLayerContainers[dragState.layerKey];

    if (!layerContainer) {
      this.endArenaBackgroundLayerDrag();
      return;
    }
    const layerScale = Math.max(0.001, Math.abs(layerContainer.scaleX || 1));
    const deltaX = (pointer.worldX - dragState.lastPointerX) / layerScale;
    const deltaY = (pointer.worldY - dragState.lastPointerY) / layerScale;
    const layout = getArenaBackgroundLayerLayoutForTier(dragState.tierId, dragState.layerKey, debugTuning, dragState.variantId);

    updateArenaBackgroundLayerLayout(dragState.tierId, dragState.layerKey, {
      x: layout.x + deltaX,
      y: layout.y + deltaY,
    }, dragState.variantId);

    dragState.lastPointerX = pointer.worldX;
    dragState.lastPointerY = pointer.worldY;
  }

  private endArenaBackgroundLayerDrag(): void {
    if (!this.arenaBackgroundLayerDragState) {
      return;
    }

    this.arenaBackgroundLayerDragState = undefined;
    endDebugUndoGroup();
  }

  async prepareEntry(nextState: CombatState): Promise<void> {
    await this.prepareStateVisuals(nextState, { animateActions: false });
    if (!this.visuals) {
      return;
    }

    resetFighterBodyIdleAnimation(this.visuals.player, this.time.now);
    if (this.visuals.helper) {
      resetFighterBodyIdleAnimation(this.visuals.helper, this.time.now);
    }
    resetFighterBodyIdleAnimation(this.visuals.enemy, this.time.now);
  }

  async renderState(nextState: CombatState): Promise<void> {
    await this.prepareStateVisuals(nextState, { animateActions: false });
  }

  async sync(nextState: CombatState, options: ArenaSyncOptions = {}): Promise<void> {
    const playerRemovedArmorSprites = this.visuals
      ? createRemovedArmorSlotSprites(this, this.visuals.enemy, nextState.lastPlayerRemovedArmorSlots)
      : [];
    const helperRemovedArmorSprites = this.visuals
      ? createRemovedArmorSlotSprites(this, this.visuals.enemy, nextState.lastHelperRemovedArmorSlots)
      : [];
    const enemyDamageTargetVisual = nextState.lastEnemyTarget === "helper" ? this.visuals?.helper : this.visuals?.player;
    const enemyRemovedArmorSprites = this.visuals
      ? createRemovedArmorSlotSprites(this, enemyDamageTargetVisual ?? this.visuals.player, nextState.lastEnemyRemovedArmorSlots)
      : [];
    const prepared = await this.prepareStateVisuals(nextState, { animateActions: true, hudState: options.hudState });

    if (!prepared) {
      playerRemovedArmorSprites.forEach((sprite) => sprite.destroy());
      helperRemovedArmorSprites.forEach((sprite) => sprite.destroy());
      enemyRemovedArmorSprites.forEach((sprite) => sprite.destroy());
      return;
    }

    const { previousState, playerSettings, visuals } = prepared;
    const enemyDefenderVisual = nextState.lastEnemyTarget === "helper" && visuals.helper ? visuals.helper : visuals.player;
    const actionAnimations: Promise<void>[] = [];
    const lastPlayerAction = nextState.lastPlayerAction;
    const lastHelperAction = nextState.lastHelperAction;
    const lastEnemyAction = nextState.lastEnemyAction;
    const playerActionSequence = getCombatActionAnimationSequence(nextState.lastPlayerActions ?? [], lastPlayerAction, "enemy");
    const helperActionSequence = getCombatActionAnimationSequence(nextState.lastHelperActions ?? [], lastHelperAction, "enemy");
    const enemyActionSequence = getCombatActionAnimationSequence(nextState.lastEnemyActions ?? [], lastEnemyAction, nextState.lastEnemyTarget ?? "player");
    let playerActionAnimation: ActionAnimationHandle | undefined;
    let helperActionAnimation: ActionAnimationHandle | undefined;
    let enemyActionAnimation: ActionAnimationHandle | undefined;

    if (lastPlayerAction && playerActionSequence.length > 0) {
      playerActionAnimation = animateCombatActionSequence(
        this,
        visuals.player,
        playerActionSequence,
        (trace) => getCombatActionDefenderVisual(visuals, trace, visuals.enemy),
        "right",
        getFighterBodyAnimationWeaponClass(nextState.player),
        playerSettings,
        { loopRestAfterComplete: false, variantSeed: getBodyAnimationVariantSeed(nextState, "player") },
        nextState.lastPlayerDoubleStrikeRepeat,
      );
      actionAnimations.push(playerActionAnimation.done);
      if (lastPlayerAction === "rest") {
        showRestRecoveryPopupFromFighter(this, visuals.player, previousState?.player, nextState.player);
      }
    }

    if (lastHelperAction && helperActionSequence.length > 0 && visuals.helper && nextState.helper) {
      helperActionAnimation = animateCombatActionSequence(
        this,
        visuals.helper,
        helperActionSequence,
        (trace) => getCombatActionDefenderVisual(visuals, trace, visuals.enemy),
        "right",
        getFighterBodyAnimationWeaponClass(nextState.helper),
        playerSettings,
        { loopRestAfterComplete: false, variantSeed: getBodyAnimationVariantSeed(nextState, "helper") },
        nextState.lastHelperDoubleStrikeRepeat,
      );
      actionAnimations.push(helperActionAnimation.done);
      if (lastHelperAction === "rest") {
        showRestRecoveryPopupFromFighter(this, visuals.helper, previousState?.helper, nextState.helper);
      }
    }

    if (lastEnemyAction && enemyActionSequence.length > 0) {
      enemyActionAnimation = animateCombatActionSequence(
        this,
        visuals.enemy,
        enemyActionSequence,
        (trace) => getCombatActionDefenderVisual(visuals, trace, enemyDefenderVisual),
        "left",
        getFighterBodyAnimationWeaponClass(nextState.enemy),
        playerSettings,
        { variantSeed: getBodyAnimationVariantSeed(nextState, "enemy") },
        nextState.lastEnemyDoubleStrikeRepeat,
      );
      actionAnimations.push(enemyActionAnimation.done);
      if (lastEnemyAction === "rest") {
        showRestRecoveryPopupFromFighter(this, visuals.enemy, previousState?.enemy, nextState.enemy);
      }
    }

    const playerResultDelay = playerActionAnimation?.impact;
    const helperResultDelay = helperActionAnimation?.impact;
    const enemyResultDelay = enemyActionAnimation?.impact;
    const playerResultDelays = playerActionAnimation?.impacts ?? (playerResultDelay ? [playerResultDelay] : undefined);
    const helperResultDelays = helperActionAnimation?.impacts ?? (helperResultDelay ? [helperResultDelay] : undefined);
    const enemyResultDelays = enemyActionAnimation?.impacts ?? (enemyResultDelay ? [enemyResultDelay] : undefined);
    const hudImpactDelay = getStateHudImpactDelay(nextState, playerResultDelay, helperResultDelay, enemyResultDelay);

    queueRemovedArmorSlotFlyOff(this, actionAnimations, playerRemovedArmorSprites, playerResultDelay, 1);
    queueRemovedArmorSlotFlyOff(this, actionAnimations, helperRemovedArmorSprites, helperResultDelay, 1);
    queueRemovedArmorSlotFlyOff(this, actionAnimations, enemyRemovedArmorSprites, enemyResultDelay, -1);

    if (options.hudState && options.hudState !== nextState) {
      void (hudImpactDelay ?? Promise.resolve()).then(() => {
        if (this.currentState !== nextState) {
          return;
        }

        setArenaHudForState(this, nextState);
        options.onImpact?.();
      });
    }

    speedUpDamagingLungeAfterImpact(playerActionAnimation, lastPlayerAction, nextState.lastPlayerDamage);
    speedUpDamagingLungeAfterImpact(helperActionAnimation, lastHelperAction, nextState.lastHelperDamage);
    speedUpDamagingLungeAfterImpact(enemyActionAnimation, lastEnemyAction, nextState.lastEnemyDamage);

    if (nextState.lastPlayerPoisonDamage > 0) {
      queueCombatResultAnimation(actionAnimations, undefined, () =>
        playPoisonDamageAnimation(this, visuals.enemy, nextState.lastPlayerPoisonDamage),
      );
    }

    if (nextState.lastEnemyPoisonDamage > 0) {
      queueCombatResultAnimation(actionAnimations, undefined, () =>
        playPoisonDamageAnimation(this, visuals.player, nextState.lastEnemyPoisonDamage),
      );
    }

    const queuedPlayerHitResults = queueCombatHitResultAnimations(
      this,
      actionAnimations,
      visuals.enemy,
      nextState.lastPlayerHitResults,
      playerResultDelays,
      playerSettings,
    );
    if (!queuedPlayerHitResults && nextState.lastPlayerDamage > 0) {
      queueCombatResultAnimation(actionAnimations, playerResultDelay, () => {
        showDamageResultPopupFromFighter(
          this,
          visuals.enemy,
          nextState.lastPlayerDamage,
          nextState.lastPlayerArmorAbsorbed,
          nextState.lastPlayerArmorBroken,
          playerSettings,
        );

        return playBodyAnimationOnce(this, visuals.enemy, getActiveBodyAnimation("hit", visuals.enemy.paperDollRig?.bodyPresetKey));
      });
    } else if (!queuedPlayerHitResults && nextState.lastPlayerWardAbsorbed) {
      queueCombatResultAnimation(actionAnimations, playerResultDelay, () => {
        showWardAbsorbPopupFromFighter(this, visuals.enemy);

        return playBodyAnimationOnce(this, visuals.enemy, getActiveBodyAnimation("block", visuals.enemy.paperDollRig?.bodyPresetKey));
      });
    } else if (!queuedPlayerHitResults && nextState.lastPlayerBlocked) {
      queueCombatResultAnimation(actionAnimations, playerResultDelay, () => {
        showBlockPopupFromFighter(this, visuals.enemy);

        return playBodyAnimationOnce(this, visuals.enemy, getActiveBodyAnimation("block", visuals.enemy.paperDollRig?.bodyPresetKey));
      });
    }

    const queuedHelperHitResults = queueCombatHitResultAnimations(
      this,
      actionAnimations,
      visuals.enemy,
      nextState.lastHelperHitResults,
      helperResultDelays,
      playerSettings,
    );
    if (!queuedHelperHitResults && nextState.lastHelperDamage > 0) {
      queueCombatResultAnimation(actionAnimations, helperResultDelay, () => {
        showDamageResultPopupFromFighter(
          this,
          visuals.enemy,
          nextState.lastHelperDamage,
          nextState.lastHelperArmorAbsorbed,
          nextState.lastHelperArmorBroken,
          playerSettings,
        );

        return playBodyAnimationOnce(this, visuals.enemy, getActiveBodyAnimation("hit", visuals.enemy.paperDollRig?.bodyPresetKey));
      });
    } else if (!queuedHelperHitResults && nextState.lastHelperWardAbsorbed) {
      queueCombatResultAnimation(actionAnimations, helperResultDelay, () => {
        showWardAbsorbPopupFromFighter(this, visuals.enemy);

        return playBodyAnimationOnce(this, visuals.enemy, getActiveBodyAnimation("block", visuals.enemy.paperDollRig?.bodyPresetKey));
      });
    } else if (!queuedHelperHitResults && nextState.lastHelperBlocked) {
      queueCombatResultAnimation(actionAnimations, helperResultDelay, () => {
        showBlockPopupFromFighter(this, visuals.enemy);

        return playBodyAnimationOnce(this, visuals.enemy, getActiveBodyAnimation("block", visuals.enemy.paperDollRig?.bodyPresetKey));
      });
    }

    const queuedEnemyHitResults = queueCombatHitResultAnimations(
      this,
      actionAnimations,
      enemyDefenderVisual,
      nextState.lastEnemyHitResults,
      enemyResultDelays,
      playerSettings,
    );
    if (!queuedEnemyHitResults && nextState.lastEnemyDamage > 0) {
      queueCombatResultAnimation(actionAnimations, enemyResultDelay, () => {
        showDamageResultPopupFromFighter(
          this,
          enemyDefenderVisual,
          nextState.lastEnemyDamage,
          nextState.lastEnemyArmorAbsorbed,
          nextState.lastEnemyArmorBroken,
          playerSettings,
        );

        return playBodyAnimationOnce(this, enemyDefenderVisual, getActiveBodyAnimation("hit", enemyDefenderVisual.paperDollRig?.bodyPresetKey));
      });
    } else if (!queuedEnemyHitResults && nextState.lastEnemyWardAbsorbed) {
      queueCombatResultAnimation(actionAnimations, enemyResultDelay, () => {
        showWardAbsorbPopupFromFighter(this, enemyDefenderVisual);

        return playBodyAnimationOnce(this, enemyDefenderVisual, getActiveBodyAnimation("block", enemyDefenderVisual.paperDollRig?.bodyPresetKey));
      });
    } else if (!queuedEnemyHitResults && nextState.lastEnemyBlocked) {
      queueCombatResultAnimation(actionAnimations, enemyResultDelay, () => {
        showBlockPopupFromFighter(this, enemyDefenderVisual);

        return playBodyAnimationOnce(this, enemyDefenderVisual, getActiveBodyAnimation("block", enemyDefenderVisual.paperDollRig?.bodyPresetKey));
      });
    }

    queueDeathEffects(this, actionAnimations, nextState, playerResultDelay, helperResultDelay, enemyResultDelay);

    return Promise.all(actionAnimations).then(() => {
      resetActiveTurnBodyIdleAnimation(visuals, previousState, nextState, this.time.now);
    });
  }

  async playEntryTransition(current = this.currentState): Promise<void> {
    if (!current) {
      return;
    }

    await this.startArenaEntryTransition(current);
  }

  private async prepareStateVisuals(
    nextState: CombatState,
    options: { animateActions: boolean; hudState?: CombatState },
  ): Promise<ArenaPreparedVisualState | undefined> {
    const previousState = this.currentState;
    const syncToken = options.animateActions ? this.syncToken + 1 : this.syncToken;
    const renderOnlyToken = this.renderOnlyToken + 1;

    if (options.animateActions) {
      this.syncToken = syncToken;
    }
    this.renderOnlyToken = renderOnlyToken;
    this.currentState = nextState;

    if (!this.visuals) {
      return;
    }

    await Promise.all([
      ensurePaperDollEquipmentAssetsLoaded(this, [nextState.player.equipment, nextState.helper?.equipment, nextState.enemy.equipment]),
      ensurePaperDollAppearanceAssetsLoaded(this, [nextState.player.appearance, nextState.helper?.appearance, nextState.enemy.appearance]),
    ]);
    if (options.animateActions ? syncToken !== this.syncToken : renderOnlyToken !== this.renderOnlyToken) {
      return;
    }

    const playerSettings = getPlayerSettings();
    const visuals = this.visuals;

    syncHelperVisualForState(this, visuals, previousState, nextState);
    syncEnemyVisualForState(this, visuals, previousState, nextState);
    resetDeathEffectsForLiveFighters(this, visuals, nextState);
    renderScene(this, nextState, playerSettings, options.hudState);

    return { previousState, playerSettings, visuals };
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
    applyArenaTransform(this, layers, startTarget, debug);

    return tweenArenaTransform(this, layers, finalTarget, ARENA_ENTRY_TRANSITION_DURATION_MS, ARENA_ENTRY_TRANSITION_EASE, debug)
      .then(() => {
        if (!this.currentState) {
          return;
        }

        const currentDebug = getActiveDebugTuning();
        applyArenaTransform(this, layers, getCameraTarget(this.currentState, currentDebug, getArenaViewport(this)), currentDebug);
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
      animateAction(this, this.visuals.player, this.visuals.enemy, actionId, "right", undefined, getPlayerSettings());
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

export function launchArena(
  onReady: (scene: ArenaScene) => void,
  _onAction: (actionId: ActionId) => void,
  playerEquipment?: HeroEquipment,
  playerAppearance?: HeroAppearance,
  initialEncounter?: ArenaBackgroundPreloadEncounter,
): () => void {
  void _onAction;
  usePlayerEquipment(playerEquipment);
  usePlayerAppearance(playerAppearance);
  readyCallback = onReady;

  const parent = document.getElementById("game");
  const arenaGameSize = getArenaPhaserGameSize(parent);
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parent ?? "game",
    width: arenaGameSize.width,
    height: arenaGameSize.height,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    fps: getPlayerPhaserFpsConfig(),
    render: getPlayerPhaserRenderConfig(),
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    scene: new ArenaScene(initialEncounter),
  };

  const game = new Phaser.Game(config);
  bindWebglRecoveryOverlay(game, "arena");

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
  logicalScale: number;
}

export interface CityProfilePreviewLayout {
  centerX: number;
  visualBottomY: number;
  fitTopY?: number;
  fitWidth?: number;
  scale?: number;
}

interface CityShopCameraViewport {
  topY: number;
  bottomY: number;
  centerY: number;
  height: number;
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
  ready: Promise<void>;
  focusDefault: (instant?: boolean) => void;
  focusArmory: (instant?: boolean) => void;
  focusWeaponShop: (instant?: boolean) => void;
  setProfilePreview: (layout?: CityProfilePreviewLayout) => void;
  setShopMenuTop: (menuTopY?: number) => void;
  previewEquipment: (equipment: HeroEquipment) => void;
  prewarmEquipmentItem: (itemId: HeroItemId) => void;
  clearEquipmentPreview: () => void;
  focusArenaTransition: () => Promise<void>;
  suspend: () => void;
  resume: () => void;
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
  private unsubscribePlayerWeaponEnchantments?: () => void;
  private unsubscribePlayerAppearance?: () => void;
  private unsubscribePlayerBodyScale?: () => void;
  private unsubscribePlayerSettings?: () => void;
  private unsubscribeCityTimeOfDay?: () => void;
  private cameraMode: CityCameraMode = "default";
  private backgroundAssetKey = getCityDefaultBackgroundAssetKey();
  private cityCloudVisibility = 1;
  private cityLightingAmount = getCityLightingAmount();
  private cityLightingTween?: Phaser.Tweens.Tween;
  private cityHeroLiftProgress = 0;
  private cityHeroLiftTween?: Phaser.Tweens.Tween;
  private profilePreviewLayout?: CityProfilePreviewLayout;
  private shopMenuTopY?: number;
  private previewEquipment?: HeroEquipment;
  private equipmentSyncToken = 0;
  private appearanceSyncToken = 0;
  private equipmentTexturePrewarmImage?: Phaser.GameObjects.Image;

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
    applyCityHeroLighting(this.fighter, this.cityLightingAmount);
    this.syncCameraLayers();
    this.sync();
    this.syncPlayerEquipment();
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => this.sync());
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(({ changedSlots }) => {
      this.previewEquipment = undefined;
      this.syncPlayerEquipment(changedSlots);
    });
    this.unsubscribePlayerWeaponEnchantments = subscribePlayerWeaponEnchantmentsChanges(() => {
      syncPaperDollWeaponEnchantments(this.fighter?.paperDollRig, ["weaponMain"], this.getDisplayedEquipment());
    });
    this.unsubscribePlayerAppearance = subscribePlayerAppearanceChanges((appearance) => this.syncPlayerAppearance(appearance));
    this.unsubscribePlayerBodyScale = subscribePlayerBodyScaleChanges(() => this.syncFighterLayout());
    this.unsubscribePlayerSettings = subscribePlayerSettings((detail) => {
      if (!didPlayerLowEffectsChange(detail)) {
        return;
      }

      ensurePaperDollAssetResolution(this, getPlayerSettings().lowEffects, [this.fighter], () => {
        if (this.fighter) {
          applyCityHeroLighting(this.fighter, this.cityLightingAmount);
        }
        this.sync();
      });
    });
    this.unsubscribeCityTimeOfDay = subscribeCityTimeOfDayChanges((timeOfDay) => this.syncTimeOfDay(timeOfDay));
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cityHeroLiftTween?.remove();
      this.backgroundFadeTween?.remove();
      this.cloudsAlphaTween?.remove();
      this.cityLightingTween?.remove();
      this.heroCamera = undefined;
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
      this.unsubscribePlayerWeaponEnchantments?.();
      this.unsubscribePlayerAppearance?.();
      this.unsubscribePlayerBodyScale?.();
      this.unsubscribePlayerSettings?.();
      this.unsubscribeCityTimeOfDay?.();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
    cityReadyCallback?.(this);
  }

  update(time: number, delta: number): void {
    this.updateCityClouds(delta);

    const idle = getActiveBodyAnimation("idle", this.fighter?.paperDollRig?.bodyPresetKey);

    if (!this.fighter || !idle.enabled) {
      return;
    }

    applyBodyAnimation(this.fighter, time, idle);
    this.syncProfilePreviewVisualBottom();
  }

  focusDefault(instant = false): void {
    this.cameraMode = "default";
    this.cameras.main.setAlpha(1);
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
    this.cameras.main.setAlpha(1);
    this.setCityHeroShadowEnabled(false);
    this.transitionBackgroundTo(CITY_ARMORY_BACKGROUND_ASSET_KEY, instant);
    this.transitionCityCloudsTo(0, instant);
    this.tweenHeroLiftTo(1, instant);
    this.syncCamera(instant, 1);
  }

  setShopMenuTop(menuTopY?: number): void {
    const nextMenuTopY =
      typeof menuTopY === "number" && Number.isFinite(menuTopY)
        ? clampNumber(menuTopY, this.toScenePixels(CITY_CAMERA_SHOP_TOP_PADDING) + 1, this.sceneHeight)
        : undefined;

    if (this.shopMenuTopY === nextMenuTopY) {
      return;
    }

    this.shopMenuTopY = nextMenuTopY;

    if (this.cameraMode !== "default" && this.cameraMode !== "arena") {
      this.syncCamera(true);
    }
  }

  focusWeaponShop(instant = false): void {
    this.cameraMode = "weaponShop";
    this.cameras.main.setAlpha(1);
    this.setCityHeroShadowEnabled(false);
    this.transitionBackgroundTo(CITY_WEAPON_SHOP_BACKGROUND_ASSET_KEY, instant);
    this.transitionCityCloudsTo(0, instant);
    this.tweenHeroLiftTo(1, instant);
    this.syncCamera(instant, 1);
  }

  previewPlayerEquipment(equipment: HeroEquipment): void {
    const changedSlots = getChangedHeroEquipmentSlots(this.getDisplayedEquipment(), equipment);

    if (changedSlots.length === 0) {
      return;
    }

    this.previewEquipment = { ...equipment };
    this.syncPlayerEquipment(changedSlots);
  }

  prewarmPlayerEquipmentItem(itemId: HeroItemId): void {
    void ensurePaperDollItemAssetsLoaded(this, [itemId]).then(() => {
      const textureKey = getHeroItemEquipmentTextureKeys(itemId).find((key) => this.textures.exists(key));

      if (!textureKey) {
        return;
      }

      const image = this.equipmentTexturePrewarmImage ?? this.createEquipmentTexturePrewarmImage(textureKey);

      if (image.texture.key !== textureKey) {
        image.setTexture(textureKey);
      }
      image.setVisible(true);
    });
  }

  clearPlayerEquipmentPreview(): void {
    if (!this.previewEquipment || !activePlayerEquipment) {
      this.previewEquipment = undefined;
      return;
    }

    const changedSlots = getChangedHeroEquipmentSlots(this.previewEquipment, activePlayerEquipment);

    this.previewEquipment = undefined;
    if (changedSlots.length > 0) {
      this.syncPlayerEquipment(changedSlots);
    }
  }

  setProfilePreview(layout?: CityProfilePreviewLayout): void {
    if (areCityProfilePreviewLayoutsEqual(this.profilePreviewLayout, layout)) {
      return;
    }

    this.profilePreviewLayout = layout;
    this.cameras.main.setAlpha(layout ? 0 : 1);
    this.setCityHeroShadowEnabled(!layout && this.cameraMode === "default");
    this.syncFighterLayout();
  }

  focusArenaTransition(): Promise<void> {
    this.cameraMode = "arena";
    this.profilePreviewLayout = undefined;
    this.cameras.main.setAlpha(1);
    this.cityHeroLiftTween?.remove();
    this.cityHeroLiftTween = undefined;
    this.cityHeroLiftProgress = 0;
    this.syncFighterLayout();
    this.freezeHeroCameraForArenaTransition();
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
    syncFighterBodyPreset(fighter);
    this.syncCameraViewports();
    this.syncFighterLayout();
    applyCityHeroLighting(fighter, this.cityLightingAmount);
    this.syncCamera(true);
  }

  private syncPlayerEquipment(changedSlots?: readonly PaperDollEquipmentSlotKey[]): void {
    const equipment = this.getDisplayedEquipment();
    const syncToken = this.equipmentSyncToken + 1;

    this.equipmentSyncToken = syncToken;
    void ensurePaperDollEquipmentAssetsLoaded(this, [equipment]).then(() => {
      if (syncToken !== this.equipmentSyncToken) {
        return;
      }

      syncPaperDollEquipmentState(this.fighter?.paperDollRig, changedSlots, this.previewEquipment);
      if (this.fighter) {
        applyCityHeroLighting(this.fighter, this.cityLightingAmount, changedSlots);
      }
    });
  }

  private syncPlayerAppearance(appearance = activePlayerAppearance): void {
    const syncToken = this.appearanceSyncToken + 1;

    this.appearanceSyncToken = syncToken;
    void ensurePaperDollAppearanceAssetsLoaded(this, [appearance]).then(() => {
      if (syncToken !== this.appearanceSyncToken) {
        return;
      }

      syncPaperDollAppearanceState(this.fighter?.paperDollRig, appearance);
      if (this.fighter) {
        applyCityHeroLighting(this.fighter, this.cityLightingAmount);
      }
    });
  }

  private createEquipmentTexturePrewarmImage(textureKey: string): Phaser.GameObjects.Image {
    const image = this.add.image(1, 1, textureKey)
      .setOrigin(0.5)
      .setAlpha(0.001)
      .setScale(0.001)
      .setDepth(Number.MIN_SAFE_INTEGER)
      .setScrollFactor(0);

    this.cameras.main.ignore(image);
    this.equipmentTexturePrewarmImage = image;

    return image;
  }

  private getDisplayedEquipment(): HeroEquipment {
    return this.previewEquipment ?? activePlayerEquipment ?? createDefaultHeroEquipment();
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
    if (this.profilePreviewLayout) {
      this.syncProfilePreviewLayout();
      return;
    }

    const layout = this.getHeroLayout();

    applyPaperDollRigTuning(this.fighter, layout.scale, layout.feetY, layout.feetX);
    this.syncProfilePreviewVisualBottom();
  }

  private syncProfilePreviewLayout(): void {
    if (!this.fighter || !this.profilePreviewLayout) {
      return;
    }

    const baseScale = getCityPlayerBodyScaleMultiplier(0) * this.scenePixelRatio;
    const layout = {
      feetX: this.profilePreviewLayout.centerX,
      feetY: this.profilePreviewLayout.visualBottomY,
      scale: baseScale,
    };

    applyPaperDollRigTuning(this.fighter, layout.scale, layout.feetY, layout.feetX);

    const fittedScale = this.getProfilePreviewFittedScale(baseScale);

    if (Math.abs(fittedScale - layout.scale) >= 0.01) {
      applyPaperDollRigTuning(this.fighter, fittedScale, layout.feetY, layout.feetX);
    }

    this.syncProfilePreviewVisualBottom();
  }

  private getProfilePreviewFittedScale(baseScale: number): number {
    if (!this.fighter || !this.profilePreviewLayout) {
      return baseScale;
    }

    const bodyScaleMultiplier = getCityPlayerBodyScaleMultiplier(0);
    const minScale = CITY_PROFILE_PREVIEW_MIN_LOGICAL_SCALE * bodyScaleMultiplier * this.scenePixelRatio;
    const maxScale = (this.profilePreviewLayout.scale ?? CITY_PROFILE_PREVIEW_MAX_LOGICAL_SCALE) * bodyScaleMultiplier * this.scenePixelRatio;
    const fallbackScale = (this.profilePreviewLayout.scale ?? CITY_PROFILE_PREVIEW_FALLBACK_LOGICAL_SCALE) * bodyScaleMultiplier * this.scenePixelRatio;
    const fitBounds = getCityProfilePreviewFitBounds(this.fighter);
    const scaleFactors: number[] = [];

    if (!fitBounds) {
      return clampNumber(fallbackScale, minScale, maxScale);
    }

    if (typeof this.profilePreviewLayout.fitTopY === "number" && Number.isFinite(this.profilePreviewLayout.fitTopY)) {
      const fitHeight = this.profilePreviewLayout.visualBottomY - this.profilePreviewLayout.fitTopY;

      if (fitHeight > 1 && fitBounds.height > 1) {
        scaleFactors.push(fitHeight / fitBounds.height);
      }
    }

    if (typeof this.profilePreviewLayout.fitWidth === "number" && Number.isFinite(this.profilePreviewLayout.fitWidth) && this.profilePreviewLayout.fitWidth > 1 && fitBounds.width > 1) {
      scaleFactors.push(this.profilePreviewLayout.fitWidth / fitBounds.width);
    }

    if (scaleFactors.length === 0) {
      return clampNumber(fallbackScale, minScale, maxScale);
    }

    return clampNumber(
      baseScale * Math.min(...scaleFactors) * CITY_PROFILE_PREVIEW_FIT_PADDING_RATIO,
      minScale,
      maxScale,
    );
  }

  private syncProfilePreviewVisualBottom(): void {
    if (!this.fighter || !this.profilePreviewLayout) {
      return;
    }

    alignCityProfilePreviewVisualBottom(this.fighter, this.profilePreviewLayout.visualBottomY);
  }

  private setCityHeroShadowEnabled(enabled: boolean): void {
    if (!this.fighter) {
      return;
    }

    const wasHighShadowVisible = this.fighter.shadow.visible;

    this.fighter.castsShadow = enabled;
    syncFighterShadowVisibility(this.fighter, 1);
    if (!wasHighShadowVisible && this.fighter.shadow.visible) {
      syncPaperDollEquipmentState(this.fighter.paperDollRig);
    }
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
    const transform = getCityBackgroundTransform(assetKey);
    const scale = Math.max(this.sceneWidth / sourceWidth, this.sceneHeight / sourceHeight) * transform.scale;

    background.setPosition(this.sceneWidth / 2 + transform.offsetX, this.sceneHeight / 2 + transform.offsetY);
    background.setScale(scale);
    background.setTint(getCityBackgroundTint(assetKey));
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
    if (this.clouds.length === 0 || this.cityCloudVisibility <= 0.01) {
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

    this.cameras.main.ignore(getFighterCameraIgnoreTargets(this.fighter));
    this.heroCamera.ignore([
      this.background,
      this.backgroundNext,
      ...this.clouds.map((cloud) => cloud.image),
    ]);
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
      const viewport = this.getShopCameraViewport();
      const heroBounds = this.getShopHeroWorldBounds(layout);
      const shopZoom = this.getShopCameraZoom(heroBounds, viewport);
      const offsetScale = Math.max(0.7, layout.logicalScale);
      const targetX = layout.feetX + this.toScenePixels(CITY_CAMERA_ARMORY_FOCUS_OFFSET_X * offsetScale);
      const heroCenterY = heroBounds.centerY - this.toScenePixels(CITY_CAMERA_ARMORY_FOCUS_OFFSET_Y * offsetScale);
      const targetY = heroCenterY + (this.sceneHeight / 2 - viewport.centerY) / shopZoom;

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

  private getShopCameraViewport(): CityShopCameraViewport {
    const topY = this.toScenePixels(CITY_CAMERA_SHOP_TOP_PADDING);
    const menuTopY = this.shopMenuTopY ?? this.sceneHeight * CITY_CAMERA_SHOP_FALLBACK_MENU_TOP_RATIO;
    const menuGap = this.toScenePixels(CITY_CAMERA_SHOP_MENU_GAP);
    const bottomY = clampNumber(menuTopY - menuGap, topY + 1, this.sceneHeight - menuGap);
    const height = Math.max(1, bottomY - topY);

    return {
      topY,
      bottomY,
      centerY: topY + height / 2,
      height,
    };
  }

  private getShopHeroWorldBounds(layout: CityHeroLayout): Phaser.Geom.Rectangle {
    const rigRoot = this.fighter?.paperDollRig?.root as Phaser.GameObjects.Container | undefined;
    const rigBounds = rigRoot?.getBounds();

    if (rigBounds && Number.isFinite(rigBounds.width) && Number.isFinite(rigBounds.height) && rigBounds.width > 1 && rigBounds.height > 1) {
      return rigBounds;
    }

    const width = CITY_HERO_VIEWER_WIDTH * CITY_HERO_CAMERA_VISUAL_WIDTH_RATIO * layout.scale;
    const height = CITY_HERO_VIEWER_HEIGHT * layout.scale;

    return new Phaser.Geom.Rectangle(layout.feetX - width / 2, layout.feetY - height, width, height);
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

  private freezeHeroCameraForArenaTransition(): void {
    const heroCamera = this.getHeroCamera();

    this.tweens.killTweensOf(heroCamera);
    heroCamera.setAlpha(1);
    heroCamera.setZoom(CITY_CAMERA_DEFAULT_ZOOM);
    heroCamera.centerOn(this.sceneWidth / 2, this.sceneHeight / 2);
  }

  private tweenArenaCameraToColiseum(): Promise<void> {
    const camera = this.cameras.main;
    const focusX = this.sceneWidth * CITY_ARENA_FOCUS_X_RATIO;
    const focusY = this.sceneHeight * CITY_ARENA_FOCUS_Y_RATIO;
    const zoom = CITY_ARENA_TRANSITION_ZOOM;
    const targetScrollX = focusX - this.sceneWidth / (2 * zoom);
    const targetScrollY = focusY - this.sceneHeight / (2 * zoom);

    this.tweens.killTweensOf(camera);

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
    });
  }

  private getShopCameraZoom(heroBounds: Phaser.Geom.Rectangle, viewport: CityShopCameraViewport): number {
    const visualHeight = Math.max(1, heroBounds.height);
    const visualWidth = Math.max(1, heroBounds.width);
    const heightZoomLimit = (viewport.height * CITY_CAMERA_SHOP_MAX_AVAILABLE_HEIGHT_RATIO) / visualHeight;
    const widthZoomLimit = (this.sceneWidth * CITY_CAMERA_SHOP_MAX_SCREEN_WIDTH_RATIO) / visualWidth;

    return clampNumber(
      Math.min(CITY_CAMERA_ARMORY_ZOOM, heightZoomLimit, widthZoomLimit),
      CITY_CAMERA_SHOP_MIN_ZOOM,
      CITY_CAMERA_ARMORY_ZOOM,
    );
  }

  private getHeroLayout(liftProgress = this.cityHeroLiftProgress): CityHeroLayout {
    const pixelRatio = this.scenePixelRatio;
    const logicalWidth = this.logicalSceneWidth;
    const logicalHeight = this.logicalSceneHeight;

    if (this.profilePreviewLayout) {
      const logicalScale = (this.profilePreviewLayout.scale ?? CITY_PROFILE_PREVIEW_FALLBACK_LOGICAL_SCALE) * getCityPlayerBodyScaleMultiplier(0);

      return {
        feetX: this.profilePreviewLayout.centerX,
        feetY: this.profilePreviewLayout.visualBottomY,
        scale: logicalScale * pixelRatio,
        logicalScale,
      };
    }

    const slotWidth = clampNumber(logicalWidth * CITY_HERO_SLOT_WIDTH_RATIO, CITY_HERO_SLOT_MIN_WIDTH, CITY_HERO_SLOT_MAX_WIDTH);
    const slotScale = slotWidth / CITY_HERO_VIEWER_WIDTH;
    const slotHeight = CITY_HERO_VIEWER_HEIGHT * slotScale;
    const slotBottom = Math.max(CITY_HERO_SLOT_BOTTOM, logicalHeight * 0.09);
    const slotLeft = logicalWidth / 2 - slotWidth / 2;
    const slotTop = logicalHeight - slotBottom - slotHeight;
    const logicalScale = debugTuning.cityHeroScale * slotScale * getCityPlayerBodyScaleMultiplier(liftProgress);

    return {
      feetX: (slotLeft + debugTuning.cityHeroX * slotScale) * pixelRatio,
      feetY: (slotTop + debugTuning.cityHeroY * slotScale - CITY_ARMORY_HERO_LIFT_Y * liftProgress) * pixelRatio,
      scale: logicalScale * pixelRatio,
      logicalScale,
    };
  }

  private get scenePixelRatio(): number {
    return getCityScenePixelRatio(this);
  }

  private get logicalSceneWidth(): number {
    return this.sceneWidth / this.scenePixelRatio;
  }

  private get logicalSceneHeight(): number {
    return this.sceneHeight / this.scenePixelRatio;
  }

  private toScenePixels(value: number): number {
    return value * this.scenePixelRatio;
  }

  private get sceneWidth(): number {
    return Math.max(1, this.scale.width || GAME_WIDTH);
  }

  private get sceneHeight(): number {
    return Math.max(1, this.scale.height || GAME_HEIGHT);
  }
}

function getCityBackgroundTransform(assetKey: string): { offsetX: number; offsetY: number; scale: number } {
  if (assetKey === CITY_ARMORY_BACKGROUND_ASSET_KEY) {
    return {
      offsetX: debugTuning.armoryBackgroundOffsetX,
      offsetY: debugTuning.armoryBackgroundOffsetY,
      scale: debugTuning.armoryBackgroundScale,
    };
  }

  return {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  };
}

function getCityBackgroundTint(assetKey: string): number {
  return assetKey === CITY_ARMORY_BACKGROUND_ASSET_KEY || assetKey === CITY_WEAPON_SHOP_BACKGROUND_ASSET_KEY ? CITY_SHOP_BACKGROUND_TINT : 0xffffff;
}

export function mountCityHeroPreview(parent: HTMLElement, playerEquipment?: HeroEquipment, playerAppearance?: HeroAppearance): CitySceneApi {
  usePlayerEquipment(playerEquipment);
  usePlayerAppearance(playerAppearance);
  let scene: CityHeroScene | undefined;
  let pendingCameraMode: CityCameraMode = "default";
  let pendingProfilePreviewLayout: CityProfilePreviewLayout | undefined;
  let pendingShopMenuTopY: number | undefined;
  const cityGameSize = getCityPhaserGameSize();
  let isSuspended = false;
  let isDestroyed = false;
  let resolveReady: () => void = () => undefined;
  let isReady = false;
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  const resolveReadyOnce = () => {
    if (isReady) {
      return;
    }

    isReady = true;
    resolveReady();
  };

  const readyCallbackForGame = (readyScene: CityHeroScene) => {
    scene = readyScene;
    readyScene.setShopMenuTop(scaleCityDomY(pendingShopMenuTopY, parent, cityGameSize.pixelRatio));
    resolveReadyOnce();
    if (isSuspended) {
      game.loop.sleep();
      return;
    }
    if (pendingCameraMode === "armory") {
      readyScene.focusArmory();
      return;
    }

    if (pendingCameraMode === "weaponShop") {
      readyScene.focusWeaponShop();
      return;
    }

    readyScene.focusDefault();
    readyScene.setProfilePreview(scaleCityProfilePreviewLayout(pendingProfilePreviewLayout, parent, cityGameSize.pixelRatio));
  };
  cityReadyCallback = readyCallbackForGame;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: cityGameSize.width,
    height: cityGameSize.height,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    fps: getPlayerPhaserFpsConfig(),
    render: getPlayerPhaserRenderConfig(),
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    scene: CityHeroScene,
  });
  bindWebglRecoveryOverlay(game, "city");

  return {
    ready,
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
    setProfilePreview: (layout?: CityProfilePreviewLayout) => {
      pendingProfilePreviewLayout = layout;
      scene?.setProfilePreview(scaleCityProfilePreviewLayout(layout, parent, cityGameSize.pixelRatio));
    },
    setShopMenuTop: (menuTopY?: number) => {
      pendingShopMenuTopY = menuTopY;
      scene?.setShopMenuTop(scaleCityDomY(menuTopY, parent, cityGameSize.pixelRatio));
    },
    previewEquipment: (equipment: HeroEquipment) => {
      scene?.previewPlayerEquipment(equipment);
    },
    prewarmEquipmentItem: (itemId: HeroItemId) => {
      scene?.prewarmPlayerEquipmentItem(itemId);
    },
    clearEquipmentPreview: () => {
      scene?.clearPlayerEquipmentPreview();
    },
    focusArenaTransition: () => scene?.focusArenaTransition() ?? Promise.resolve(),
    suspend: () => {
      if (isDestroyed || isSuspended) {
        return;
      }

      isSuspended = true;
      game.loop.sleep();
    },
    resume: () => {
      if (isDestroyed) {
        return;
      }

      isSuspended = false;
      pendingCameraMode = "default";
      game.loop.wake();
      scene?.clearPlayerEquipmentPreview();
      scene?.focusDefault(true);
      scene?.scale.refresh();
    },
    destroy: () => {
      isDestroyed = true;
      if (cityReadyCallback === readyCallbackForGame) {
        cityReadyCallback = undefined;
      }
      scene = undefined;
      resolveReadyOnce();
      game.destroy(true);
    },
  };
}

interface CanvasPortraitTransform {
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
}

interface CanvasPortraitImageTuning extends CanvasPortraitTransform {
  flipX?: boolean;
  flipY?: boolean;
}

type CanvasPortraitEquipmentLayer = "legs" | "torso" | "head" | "weapon" | "arms";

const canvasPortraitImageCache = new Map<string, Promise<HTMLImageElement | undefined>>();
const canvasPortraitDefaultImageTuning: CanvasPortraitImageTuning = {
  x: 0,
  y: 0,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
};

async function renderHeroPortraitCanvasSnapshot(
  equipmentOverride: HeroEquipment | undefined,
  appearanceOverride: HeroAppearance,
): Promise<string | undefined> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return undefined;
  }

  const equipment = equipmentOverride ? { ...equipmentOverride } : activePlayerEquipment;
  const appearance = { ...appearanceOverride };
  const bodyPresetKey = debugTuning.paperDollBodyPreset;
  const bodyPreset = getPaperDollBodyPreset(bodyPresetKey);
  const lowRes = getPlayerSettings().lowEffects;
  const rootTransform: CanvasPortraitTransform = {
    x: HERO_PORTRAIT_CENTER_X,
    y: HERO_PORTRAIT_FEET_Y,
    angle: 0,
    scaleX: PAPER_DOLL_BASE_SCALE * HERO_PORTRAIT_SCALE,
    scaleY: PAPER_DOLL_BASE_SCALE * HERO_PORTRAIT_SCALE,
  };
  const equipmentVisibility = createPlayerEquipmentVisibility(
    equipment,
    getPreferredPaperDollWeaponSlot(PAPER_DOLL_EQUIPMENT_SLOT_KEYS, equipment),
  );

  canvas.width = HERO_PORTRAIT_VIEWER_SIZE;
  canvas.height = HERO_PORTRAIT_VIEWER_SIZE;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;

  const drawBodyPart = async (partKey: PaperDollPartKey): Promise<void> => {
    if (HERO_PORTRAIT_HIDDEN_PART_KEYS.includes(partKey)) {
      return;
    }

    const assetKey = getCanvasPortraitBodyPartAssetKey(partKey, bodyPreset);
    const config = getCanvasPortraitBodyPartConfig(partKey);

    if (!assetKey || !config) {
      return;
    }

    await drawCanvasPortraitAsset(
      context,
      assetKey,
      lowRes,
      [rootTransform, getCanvasPortraitPartTransform(partKey, bodyPresetKey)],
      config,
      getCanvasPortraitBodyPartImageTuning(partKey, bodyPresetKey),
    );

    if (partKey === "head") {
      await drawCanvasPortraitHeadLayers(context, lowRes, rootTransform, bodyPresetKey, bodyPreset, appearance);
    }
  };

  const drawEquipmentLayer = async (layer: CanvasPortraitEquipmentLayer): Promise<void> => {
    const slotKeys = PAPER_DOLL_EQUIPMENT_SLOT_KEYS
      .filter((slotKey) => getCanvasPortraitEquipmentLayer(slotKey) === layer)
      .filter((slotKey) => !HERO_PORTRAIT_HIDDEN_EQUIPMENT_SLOT_KEYS.includes(slotKey))
      .filter((slotKey) => equipmentVisibility[slotKey])
      .sort((left, right) => (PAPER_DOLL_EQUIPMENT_LAYER_ORDER[left] ?? 0) - (PAPER_DOLL_EQUIPMENT_LAYER_ORDER[right] ?? 0)
        || PAPER_DOLL_EQUIPMENT_SLOT_KEYS.indexOf(left) - PAPER_DOLL_EQUIPMENT_SLOT_KEYS.indexOf(right));

    for (const slotKey of slotKeys) {
      await drawCanvasPortraitEquipmentSlot(context, slotKey, lowRes, rootTransform, bodyPresetKey, equipment);
    }
  };

  for (const partKey of PAPER_DOLL_PART_ORDER) {
    await drawBodyPart(partKey);
    if (partKey === "frontFoot") {
      await drawEquipmentLayer("legs");
    } else if (partKey === "torso") {
      await drawEquipmentLayer("torso");
    } else if (partKey === "head") {
      await drawEquipmentLayer("head");
    } else if (partKey === "frontForearm") {
      await drawEquipmentLayer("weapon");
    } else if (partKey === "frontHand") {
      await drawEquipmentLayer("arms");
    }
  }

  return canvas.toDataURL("image/png");
}

function getCanvasPortraitBodyPartAssetKey(partKey: PaperDollPartKey, bodyPreset: PaperDollBodyPresetDefinition): string | undefined {
  if (partKey === "head") {
    return bodyPreset.headAssetKey;
  }

  if (partKey === "torso") {
    return bodyPreset.torsoAssetKey;
  }

  return bodyPreset.bodyPartAssetKeys[partKey] ?? DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS[partKey];
}

function getCanvasPortraitBodyPartConfig(partKey: PaperDollPartKey): PaperDollPartAssetConfig | undefined {
  if (partKey === "head") {
    return PAPER_DOLL_HEAD_ASSET_CONFIG;
  }

  if (partKey === "torso") {
    return PAPER_DOLL_TORSO_ASSET_CONFIG;
  }

  return PAPER_DOLL_PART_ASSET_CONFIGS[partKey];
}

function getCanvasPortraitPartTransform(partKey: PaperDollPartKey, bodyPresetKey: PaperDollBodyPreset): CanvasPortraitTransform {
  const pivot = PAPER_DOLL_PART_PIVOTS[partKey];
  const animation = getActiveBodyAnimation("idle", bodyPresetKey);
  const debugRigParts = getActiveDebugTuning() ? getDebugBodyPresetTuning(bodyPresetKey).rigParts : undefined;
  const tuning = animation.enabled && animation.activeParts[partKey]
    ? animation.base[partKey] ?? defaultRigPartTuning
    : debugRigParts?.[partKey] ?? DEFAULT_RIG_PARTS[partKey] ?? defaultRigPartTuning;

  return {
    x: pivot.x + tuning.x,
    y: pivot.y + tuning.y,
    angle: tuning.angle,
    scaleX: tuning.scaleX * (tuning.flipX ? -1 : 1),
    scaleY: tuning.scaleY * (tuning.flipY ? -1 : 1),
  };
}

function getCanvasPortraitBodyPartImageTuning(partKey: PaperDollPartKey, bodyPresetKey: PaperDollBodyPreset): CanvasPortraitImageTuning {
  const tuning = getBodyPresetTuning(bodyPresetKey).bodyPartLayers[partKey] ?? defaultRigPartTuning;

  return {
    x: tuning.x,
    y: tuning.y,
    angle: tuning.angle,
    scaleX: tuning.scaleX,
    scaleY: tuning.scaleY,
    flipX: tuning.flipX,
    flipY: tuning.flipY,
  };
}

async function drawCanvasPortraitHeadLayers(
  context: CanvasRenderingContext2D,
  lowRes: boolean,
  rootTransform: CanvasPortraitTransform,
  bodyPresetKey: PaperDollBodyPreset,
  bodyPreset: PaperDollBodyPresetDefinition,
  appearance: HeroAppearance,
): Promise<void> {
  const headTransform = getCanvasPortraitPartTransform("head", bodyPresetKey);

  for (const layerKey of FACE_ASSET_LAYER_KEYS) {
    const assetKey = bodyPreset.faceAssetKeys?.[layerKey];
    const tuning = getDebugBodyPresetTuning(bodyPresetKey).faceAssetLayers[layerKey];

    if (assetKey && tuning) {
      await drawCanvasPortraitAsset(context, assetKey, lowRes, [rootTransform, headTransform, canvasTransformFromLayerTuning(tuning)], PAPER_DOLL_FACE_ASSET_CONFIGS[layerKey]);
    }
  }

  if (!shouldUsePaperDollAppearanceAssets(bodyPresetKey)) {
    return;
  }

  const appearanceAssetKeys = createPlayerAppearanceAssetKeys(appearance, bodyPresetKey);
  const appearanceLayerTuning = getDebugBodyPresetTuning(bodyPresetKey).appearanceLayers;

  for (const layerKey of APPEARANCE_LAYER_KEYS) {
    const assetKey = appearanceAssetKeys[layerKey];
    const tuning = appearanceLayerTuning[layerKey] ?? DEFAULT_APPEARANCE_LAYERS[layerKey];

    if (assetKey && tuning) {
      await drawCanvasPortraitAsset(context, assetKey, lowRes, [rootTransform, headTransform, canvasTransformFromLayerTuning(tuning)], PAPER_DOLL_APPEARANCE_ASSET_CONFIGS[layerKey]);
    }
  }
}

async function drawCanvasPortraitEquipmentSlot(
  context: CanvasRenderingContext2D,
  slotKey: PaperDollEquipmentSlotKey,
  lowRes: boolean,
  rootTransform: CanvasPortraitTransform,
  bodyPresetKey: PaperDollBodyPreset,
  equipment: HeroEquipment | undefined,
): Promise<void> {
  if (!equipment) {
    return;
  }

  const assetKey = getCanvasPortraitEquipmentSlotAssetKey(equipment, slotKey);
  const anchorPartKey = PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS[slotKey];

  if (!assetKey || HERO_PORTRAIT_HIDDEN_PART_KEYS.includes(anchorPartKey)) {
    return;
  }

  await drawCanvasPortraitAsset(
    context,
    assetKey,
    lowRes,
    [
      rootTransform,
      getCanvasPortraitPartTransform(anchorPartKey, bodyPresetKey),
      canvasTransformFromLayerTuning(getEquipmentTransformTuning(slotKey, DEFAULT_EQUIPMENT, DEFAULT_EQUIPMENT_ITEM_TUNING, equipment)),
    ],
    PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS[slotKey],
  );
}

function getCanvasPortraitEquipmentSlotAssetKey(equipment: HeroEquipment, slotKey: PaperDollEquipmentSlotKey): string | undefined {
  const assetKey = PLAYER_EQUIPMENT_ASSET_KEY_BY_SLOT[slotKey];
  const itemId = equipment[slotKey];
  const itemAssetKeys = itemId ? getHeroItemEquipmentAssetKeys(itemId) : undefined;
  const textureKey = itemAssetKeys?.[assetKey] ?? DEFAULT_PLAYER_EQUIPMENT_ASSET_KEYS[assetKey];

  return typeof textureKey === "string" ? textureKey : undefined;
}

function getCanvasPortraitEquipmentLayer(slotKey: PaperDollEquipmentSlotKey): CanvasPortraitEquipmentLayer {
  if (isPaperDollWeaponSlot(slotKey)) {
    return "weapon";
  }

  if (slotKey === "helmet") {
    return "head";
  }

  if (slotKey === "breastplate") {
    return "torso";
  }

  if (
    slotKey === "backGreave" ||
    slotKey === "frontGreave" ||
    slotKey === "backShinguard" ||
    slotKey === "frontShinguard" ||
    slotKey === "backBoot" ||
    slotKey === "frontBoot"
  ) {
    return "legs";
  }

  return "arms";
}

async function drawCanvasPortraitAsset(
  context: CanvasRenderingContext2D,
  assetKey: string,
  lowRes: boolean,
  transforms: readonly CanvasPortraitTransform[],
  config: PaperDollPartAssetConfig,
  imageTuning: CanvasPortraitImageTuning = canvasPortraitDefaultImageTuning,
): Promise<void> {
  const image = await loadCanvasPortraitImage(assetKey, lowRes);
  const imageWidth = image?.naturalWidth || image?.width || 0;
  const imageHeight = image?.naturalHeight || image?.height || 0;

  if (!image || imageWidth <= 0 || imageHeight <= 0) {
    return;
  }

  const scale = config.displayHeight / imageHeight;

  context.save();
  transforms.forEach((transform) => applyCanvasPortraitTransform(context, transform));
  context.translate(config.localX + imageTuning.x, config.localY + imageTuning.y);
  context.rotate(degreesToRadians(imageTuning.angle));
  context.scale(
    scale * imageTuning.scaleX * (imageTuning.flipX ? -1 : 1),
    scale * imageTuning.scaleY * (imageTuning.flipY ? -1 : 1),
  );
  context.drawImage(image, -config.originX * imageWidth, -config.originY * imageHeight, imageWidth, imageHeight);
  context.restore();
}

function applyCanvasPortraitTransform(context: CanvasRenderingContext2D, transform: CanvasPortraitTransform): void {
  context.translate(transform.x, transform.y);
  context.rotate(degreesToRadians(transform.angle));
  context.scale(transform.scaleX, transform.scaleY);
}

function canvasTransformFromLayerTuning(tuning: CanvasPortraitImageTuning): CanvasPortraitTransform {
  return {
    x: tuning.x,
    y: tuning.y,
    angle: tuning.angle,
    scaleX: tuning.scaleX * (tuning.flipX ? -1 : 1),
    scaleY: tuning.scaleY * (tuning.flipY ? -1 : 1),
  };
}

function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function loadCanvasPortraitImage(assetKey: string, lowRes: boolean): Promise<HTMLImageElement | undefined> {
  const cacheKey = `${lowRes ? "low" : "high"}:${assetKey}`;
  const cached = canvasPortraitImageCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const promise = resolveCanvasPortraitAssetUrl(assetKey, lowRes).then((url) => {
    if (!url) {
      return undefined;
    }

    return loadCanvasPortraitImageUrl(url);
  });

  canvasPortraitImageCache.set(cacheKey, promise);
  return promise;
}

async function resolveCanvasPortraitAssetUrl(assetKey: string, lowRes: boolean): Promise<string | undefined> {
  const asset = PAPER_DOLL_ASSETS_BY_KEY.get(assetKey);

  return asset ? resolvePaperDollAssetUrl(asset, lowRes) : undefined;
}

function loadCanvasPortraitImageUrl(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    const finish = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0 ? image : undefined);

    image.decoding = "async";
    image.loading = "eager";
    image.onload = finish;
    image.onerror = () => resolve(undefined);
    image.src = url;
    const decode = image.decode?.();

    if (decode) {
      void decode.then(finish, () => undefined);
    }
  });
}

function getHeroPortraitSnapshotKey(equipment: HeroEquipment | undefined, appearance: HeroAppearance | undefined, lowEffects = getPlayerSettings().lowEffects): string {
  const equipmentKey = HERO_PORTRAIT_SNAPSHOT_EQUIPMENT_SLOT_KEYS.map((slotKey) => `${slotKey}:${equipment?.[slotKey] ?? ""}`).join("|");
  const appearanceKey = `hair:${appearance?.hairId ?? ""}|beard:${appearance?.beardId ?? ""}`;

  return `${equipmentKey}|${appearanceKey}|low:${lowEffects ? 1 : 0}`;
}

function getAnimationPreviewEquipmentKey(equipment: HeroEquipment | undefined): string {
  return HERO_EQUIPMENT_SLOT_KEYS.map((slotKey) => `${slotKey}:${equipment?.[slotKey] ?? ""}`).join("|");
}

function createAnimationPreviewCombatFighterState(equipment: HeroEquipment): FighterState {
  const mainWeaponClass = getHeroEquipmentWeaponClass(equipment);
  const bowWeaponClass = getHeroEquipmentBowWeaponClass(equipment);
  const weaponClass = getAnimationPreviewCombatWeaponClass(equipment, mainWeaponClass, bowWeaponClass);
  const hasBow = bowWeaponClass === "bow";

  return {
    name: "BORSHEMIR",
    hp: 1,
    maxHp: 1,
    armor: 0,
    maxArmor: 0,
    stamina: 1,
    maxStamina: 1,
    damageBonus: 0,
    movementDistanceBonus: 0,
    bodyScaleBonus: 0,
    clinchRangeBonus: 0,
    restHpRestoreBonus: 0,
    restStaminaRestoreBonus: 0,
    weaponClass,
    mainWeaponClass,
    bowWeaponClass,
    bowShotsRemaining: hasBow ? 1 : 0,
    bowMaxShots: hasBow ? 1 : 0,
    equipment,
  };
}

function createDebugWeaponEnchantGlowPreviewFighterState(equipment: HeroEquipment): FighterState {
  const mainWeaponClass = getHeroEquipmentWeaponClass(equipment);

  return {
    ...createAnimationPreviewCombatFighterState(equipment),
    weaponClass: mainWeaponClass,
    mainWeaponClass,
    bowWeaponClass: undefined,
    bowShotsRemaining: 0,
    bowMaxShots: 0,
    weaponEnchantments: createDebugWeaponEnchantGlowPreviewEnchantments(equipment),
  };
}

function createDebugWeaponEnchantGlowPreviewEnchantments(equipment: HeroEquipment | undefined): HeroWeaponEnchantments {
  const itemId = equipment?.weaponMain;

  return itemId ? { [itemId]: { level: 1 } } : {};
}

function createDebugWeaponEnchantGlowPreviewEquipment(): HeroEquipment {
  const equipment = createDefaultHeroEquipment();
  const itemId = getDebugWeaponEnchantGlowPreviewWeaponItemId();

  if (itemId) {
    equipment.weaponMain = itemId;
  }

  return equipment;
}

function getDebugWeaponEnchantGlowPreviewWeaponItemId(): HeroItemId | undefined {
  const selectedItemId = debugTuning.weaponEnchantGlowPreviewWeaponItemId;

  if (isDebugWeaponEnchantGlowPreviewWeaponItemId(selectedItemId)) {
    return selectedItemId;
  }

  return getDebugWeaponEnchantGlowPreviewWeaponItemIds()[0];
}

function isDebugWeaponEnchantGlowPreviewWeaponItemId(itemId: unknown): itemId is HeroItemId {
  if (typeof itemId !== "string") {
    return false;
  }

  const item = getDebugWeaponEnchantGlowPreviewItemDefinition(itemId);

  return Boolean(
    item &&
      item.kind === "weapon" &&
      item.equipmentSlot === "weaponMain" &&
      item.weaponClass !== "bow" &&
      item.weaponClass !== "shuriken" &&
      isDebugWeaponEnchantGlowPreviewRarityAllowed(item),
  );
}

const DEBUG_WEAPON_ENCHANT_GLOW_PREVIEW_RARITIES: ReadonlySet<HeroItemRarity> = new Set(["epic", "legendary", "mythical", "unique"]);

function isDebugWeaponEnchantGlowPreviewRarityAllowed(item: HeroItemDefinition): boolean {
  return DEBUG_WEAPON_ENCHANT_GLOW_PREVIEW_RARITIES.has(item.rarity ?? "common");
}

function getDebugWeaponEnchantGlowPreviewWeaponItemIds(): HeroItemId[] {
  const itemIds = [
    ...ALL_HERO_ITEM_IDS,
    ...AUTO_EQUIPMENT_ITEM_RECORDS.map((record) => record.item.id),
    ...GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => record.item.id),
  ];

  return [...new Set(itemIds)].filter(isDebugWeaponEnchantGlowPreviewWeaponItemId).sort(compareDebugWeaponEnchantGlowPreviewWeapons);
}

function getDebugWeaponEnchantGlowPreviewItemDefinition(itemId: HeroItemId): HeroItemDefinition | undefined {
  return (
    HERO_ITEM_CATALOG[itemId] ??
    AUTO_EQUIPMENT_ITEM_RECORDS.find((record) => record.item.id === itemId)?.item ??
    GENERATED_EQUIPMENT_ITEM_RECORDS.find((record) => record.item.id === itemId)?.item
  );
}

function compareDebugWeaponEnchantGlowPreviewWeapons(leftItemId: HeroItemId, rightItemId: HeroItemId): number {
  const left = getDebugWeaponEnchantGlowPreviewItemDefinition(leftItemId);
  const right = getDebugWeaponEnchantGlowPreviewItemDefinition(rightItemId);
  const leftClass = left?.weaponClass ?? "";
  const rightClass = right?.weaponClass ?? "";

  return (
    leftClass.localeCompare(rightClass) ||
    (left?.name ?? leftItemId).localeCompare(right?.name ?? rightItemId) ||
    leftItemId.localeCompare(rightItemId)
  );
}

function getDebugWeaponEnchantGlowPreviewTuningKey(): string {
  const itemId = getDebugWeaponEnchantGlowPreviewWeaponItemId() ?? "";
  const element = debugTuning.selectedWeaponEnchantGlowElement;
  const tuning = debugTuning.weaponEnchantGlow[element];

  return [
    itemId,
    element,
    tuning.color,
    tuning.alpha,
    tuning.scale,
    tuning.blur,
    tuning.blurStrength,
    tuning.offsetX,
    tuning.offsetY,
    tuning.originX,
    tuning.originY,
    tuning.blendMode,
    tuning.layer,
  ].join("|");
}

function getAnimationPreviewCombatWeaponClass(
  equipment: HeroEquipment,
  mainWeaponClass: HeroWeaponClass,
  bowWeaponClass: HeroWeaponClass | undefined,
): HeroWeaponClass {
  if (bowWeaponClass === "bow" && (debugTuning.selectedBodyAnimation === "bowShot" || !equipment.weaponMain)) {
    return "bow";
  }

  return mainWeaponClass;
}

export interface HeroPortraitPreviewApi {
  setEquipment: (equipment: HeroEquipment) => void;
  setAppearance: (appearance: HeroAppearance) => void;
  destroy: () => void;
}

interface HeroPortraitPreviewOptions {
  mirrorParents?: readonly HTMLElement[];
}

function createHeroPortraitSnapshotImage(parent: HTMLElement): HTMLImageElement {
  const snapshotImage = document.createElement("img");

  snapshotImage.className = "city-menu__portrait-snapshot";
  snapshotImage.alt = "";
  snapshotImage.draggable = false;
  snapshotImage.hidden = true;
  snapshotImage.setAttribute("aria-hidden", "true");
  parent.append(snapshotImage);

  return snapshotImage;
}

export function mountHeroPortraitPreview(
  parent: HTMLElement,
  playerEquipment?: HeroEquipment,
  playerAppearance: HeroAppearance = activePlayerAppearance,
  options: HeroPortraitPreviewOptions = {},
): HeroPortraitPreviewApi {
  usePlayerEquipment(playerEquipment);
  usePlayerAppearance(playerAppearance);
  let pendingEquipment = playerEquipment ? { ...playerEquipment } : undefined;
  let pendingAppearance = { ...playerAppearance };
  let lastSnapshotKey: string | undefined;
  let snapshotToken = 0;
  let destroyed = false;
  const mirrorParents = (options.mirrorParents ?? []).filter((mirrorParent) => mirrorParent !== parent);
  const snapshotTargets = [parent, ...mirrorParents].map((targetParent) => ({
    parent: targetParent,
    image: createHeroPortraitSnapshotImage(targetParent),
  }));

  const refreshSnapshot = (equipment = pendingEquipment, appearance = pendingAppearance, force = false) => {
    if (destroyed) {
      return;
    }

    const snapshotKey = getHeroPortraitSnapshotKey(equipment, appearance, getPlayerSettings().lowEffects);

    if (!force && snapshotKey === lastSnapshotKey) {
      return;
    }

    const token = snapshotToken + 1;
    snapshotToken = token;
    void renderHeroPortraitCanvasSnapshot(equipment, appearance).then((src) => {
      window.requestAnimationFrame(() => {
        if (destroyed || token !== snapshotToken) {
          return;
        }
        if (!src) {
          return;
        }

        lastSnapshotKey = snapshotKey;
        snapshotTargets.forEach((target) => {
          target.image.src = src;
          target.image.hidden = false;
          target.parent.classList.add("city-menu__portrait--static");
        });
      });
    });
  };
  const unsubscribePlayerSettings = subscribePlayerSettings((detail) => {
    if (didPlayerLowEffectsChange(detail)) {
      refreshSnapshot(pendingEquipment, pendingAppearance, true);
    }
  });

  refreshSnapshot();

  return {
    setEquipment: (equipment) => {
      const nextEquipment = { ...equipment };
      const nextSnapshotKey = getHeroPortraitSnapshotKey(nextEquipment, pendingAppearance, getPlayerSettings().lowEffects);

      pendingEquipment = nextEquipment;

      if (nextSnapshotKey === lastSnapshotKey) {
        return;
      }

      refreshSnapshot(nextEquipment, pendingAppearance);
    },
    setAppearance: (appearance) => {
      const nextAppearance = { ...appearance };
      const nextSnapshotKey = getHeroPortraitSnapshotKey(pendingEquipment, nextAppearance, getPlayerSettings().lowEffects);

      pendingAppearance = nextAppearance;

      if (nextSnapshotKey === lastSnapshotKey) {
        return;
      }

      refreshSnapshot(pendingEquipment, nextAppearance);
    },
    destroy: () => {
      destroyed = true;
      snapshotToken += 1;
      unsubscribePlayerSettings();
      snapshotTargets.forEach((target) => {
        target.image.remove();
        target.parent.classList.remove("city-menu__portrait--static");
      });
    },
  };
}

interface DebugCharacterViewerOptions {
  mode?: "debug" | "shop" | "animation" | "enchantGlow";
}

export function previewDebugAnimationWardShield(): void {
  debugAnimationScene?.previewWardShield();
}

class DebugCharacterScene extends Phaser.Scene {
  private fighter?: FighterVisual;
  private dragState?: DebugRigPartDragState;
  private canvasPanState?: DebugCanvasPanState;
  private rootDragState?: DebugAnimationRootDragState;
  private animationWeaponDragState?: DebugAnimationWeaponDragState;
  private animationFloorGuide?: DebugAnimationFloorGuide;
  private equipmentDragState?: DebugEquipmentDragState;
  private selectedEquipment?: Pick<DebugEquipmentDragState, "slotKey" | "itemId">;
  private animationPreviewEquipmentKey = "";
  private weaponEnchantGlowPreviewTuningKey = "";
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;
  private unsubscribePlayerSettings?: () => void;
  private equipmentSyncToken = 0;
  private readonly viewerMode: NonNullable<DebugCharacterViewerOptions["mode"]>;

  constructor(viewerMode: NonNullable<DebugCharacterViewerOptions["mode"]> = "debug") {
    super(`DebugCharacterScene-${viewerMode}`);
    this.viewerMode = viewerMode;
  }

  preload(): void {
    preloadPaperDollAssets(this);
    if (this.viewerMode === "animation") {
      this.load.image(WARD_SHIELD_EFFECT_ASSET_KEY, WARD_SHIELD_EFFECT_ASSET_URL);
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    if (this.viewerMode === "animation") {
      debugAnimationScene = this;
    }
    if (this.viewerMode === "debug" || this.viewerMode === "enchantGlow") {
      drawDebugCharacterBackdrop(this);
    }
    const previewEquipment = this.getPreviewEquipment();
    this.fighter = createPaperDollFighter(this, {
      ...(
        this.viewerMode === "enchantGlow"
          ? createPlayerPaperDollOptions(DEBUG_CHARACTER_CENTER_X, 0, previewEquipment, activePlayerAppearance, {
              weaponEnchantments: createDebugWeaponEnchantGlowPreviewEnchantments(previewEquipment),
              usesPlayerEquipment: false,
            })
          : createPlayerPaperDollOptions(DEBUG_CHARACTER_CENTER_X, 0, previewEquipment)
      ),
      castsShadow: false,
      enableSelectionHighlights: this.viewerMode !== "shop" && this.viewerMode !== "enchantGlow",
    });
    this.fighter.name.setVisible(false);
    if (this.viewerMode !== "shop" && this.viewerMode !== "enchantGlow") {
      if (this.viewerMode === "animation") {
        enableDebugPaperDollAnimationWeaponPicking(this.fighter.paperDollRig, (slotKey, pointer, event) => this.beginAnimationWeaponDrag(slotKey, pointer, event));
      }
      enableDebugPaperDollEquipmentPicking(this.fighter.paperDollRig, (slotKey, pointer, event) => this.beginEquipmentDrag(slotKey, pointer, event));
      enableDebugPaperDollPartPicking(this.fighter.paperDollRig, (partKey, pointer, event) => this.beginRigPartDrag(partKey, pointer, event));
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) =>
        this.handlePreviewPointerDown(pointer, gameObjects),
      );
      this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
        this.dragAnimationCanvas(pointer);
        this.dragAnimationRoot(pointer);
        this.dragAnimationWeapon(pointer);
        this.dragRigPart(pointer);
        this.dragEquipment(pointer);
      });
      this.input.on("pointerup", () => this.endDrag());
      this.input.on("pointerupoutside", () => this.endDrag());
      this.input.on("wheel", (pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
        this.handlePreviewWheel(pointer, deltaY);
      });
    }
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => this.sync());
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(({ changedSlots }) => this.syncPlayerEquipment(changedSlots));
    this.unsubscribePlayerSettings = subscribePlayerSettings((detail) => {
      if (!didPlayerLowEffectsChange(detail)) {
        return;
      }

      ensurePaperDollAssetResolution(this, getPlayerSettings().lowEffects, [this.fighter], () => this.sync());
    });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
      this.unsubscribePlayerSettings?.();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      if (debugAnimationScene === this) {
        debugAnimationScene = undefined;
      }
    });
    this.sync();
    this.syncPlayerEquipment();
  }

  previewWardShield(): void {
    if (this.viewerMode !== "animation" || !this.fighter) {
      return;
    }

    void playWardShieldEffect(this, this.fighter, "cast", { force: true });
  }

  update(time: number): void {
    const animation = getSelectedDebugBodyAnimation();

    if (!this.fighter) {
      return;
    }

    if (this.viewerMode === "shop" || this.viewerMode === "enchantGlow") {
      const idle = getActiveBodyAnimation("idle", this.fighter.paperDollRig?.bodyPresetKey);

      if (idle.enabled) {
        applyBodyAnimation(this.fighter, time, idle);
      }

      if (this.viewerMode === "enchantGlow") {
        this.syncWeaponEnchantGlowTuningIfNeeded();
      }

      return;
    }

    if (debugTuning.animationEditMode === "preview") {
      if (animation.enabled) {
        if (this.viewerMode === "animation") {
          applyBodyAnimationAtProgress(this.fighter, animation, debugTuning.animationPreviewProgress);
          this.syncAnimationFloorGuide();
        } else {
          applyBodyAnimation(this.fighter, time, animation);
        }
      }

      return;
    }

    applySelectedDebugAnimationEditPose(this.fighter);
    this.syncAnimationFloorGuide();
  }

  private sync(): void {
    if (!this.fighter) {
      return;
    }

    syncFighterBodyPreset(this.fighter);
    this.syncPreviewEquipment();
    if (this.viewerMode === "shop") {
      const layout = this.getShopCharacterLayout();

      applyPaperDollRigTuning(this.fighter, layout.scale, layout.feetY, layout.feetX);
      return;
    }

    const layout = this.getDebugCharacterLayout();

    applyPaperDollRigTuning(this.fighter, layout.scale, layout.feetY, layout.feetX);
    if (this.viewerMode === "enchantGlow") {
      this.syncWeaponEnchantGlowPreview();
      return;
    }

    this.syncAnimationPreviewCombatEquipment();
    this.syncPreviewArmorAlpha();
    if (this.viewerMode === "animation" && debugTuning.animationEditMode === "preview") {
      const animation = getSelectedDebugBodyAnimation();

      if (animation.enabled) {
        applyBodyAnimationAtProgress(this.fighter, animation, debugTuning.animationPreviewProgress);
      }
    } else {
      applySelectedDebugAnimationEditPose(this.fighter);
    }
    this.syncAnimationFloorGuide(layout);
    syncPaperDollSelectionHighlight(
      this.fighter.paperDollRig,
      debugTuning.characterCanvasEditMode === "parts" || debugTuning.characterCanvasEditMode === "bodyArt" ? debugTuning.selectedRigParts : [],
    );
    this.syncAnimationWeaponDragPicking();
  }

  private syncPlayerEquipment(changedSlots?: readonly PaperDollEquipmentSlotKey[]): void {
    const syncToken = this.equipmentSyncToken + 1;
    const equipment = this.getPreviewEquipment();

    this.equipmentSyncToken = syncToken;
    void ensurePaperDollEquipmentAssetsLoaded(this, [equipment]).then(() => {
      if (syncToken !== this.equipmentSyncToken) {
        return;
      }

      this.syncLoadedPlayerEquipment(changedSlots);
    });
  }

  private syncLoadedPlayerEquipment(changedSlots?: readonly PaperDollEquipmentSlotKey[]): void {
    const equipment = this.getPreviewEquipment();

    if (this.viewerMode === "shop") {
      syncPaperDollEquipmentState(this.fighter?.paperDollRig, changedSlots, equipment);
      return;
    }

    if (this.viewerMode === "animation") {
      this.animationPreviewEquipmentKey = "";
      this.syncPreviewEquipment(changedSlots);
      return;
    }

    if (this.viewerMode === "enchantGlow") {
      this.animationPreviewEquipmentKey = "";
      this.syncPreviewEquipment(changedSlots);
      return;
    }

    this.sync();
    syncPaperDollEquipmentState(this.fighter?.paperDollRig, changedSlots, equipment);
    this.syncPreviewArmorAlpha();
  }

  private syncPreviewEquipment(slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS): void {
    if (this.viewerMode !== "animation" && this.viewerMode !== "enchantGlow") {
      return;
    }

    const equipment = this.getPreviewEquipment();
    const equipmentKey = getAnimationPreviewEquipmentKey(equipment);

    if (equipmentKey === this.animationPreviewEquipmentKey) {
      return;
    }

    const syncToken = this.equipmentSyncToken + 1;

    this.animationPreviewEquipmentKey = equipmentKey;
    this.equipmentSyncToken = syncToken;
    void ensurePaperDollEquipmentAssetsLoaded(this, [equipment]).then(() => {
      if (syncToken !== this.equipmentSyncToken) {
        return;
      }

      if (this.viewerMode === "enchantGlow") {
        this.syncWeaponEnchantGlowPreview(slotKeys);
        return;
      }

      this.syncAnimationPreviewCombatEquipment(slotKeys);
    });
  }

  private syncAnimationPreviewCombatEquipment(slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS): void {
    if (this.viewerMode !== "animation" || !this.fighter) {
      return;
    }

    const equipment = this.getPreviewEquipment() ?? createDefaultHeroEquipment();

    syncFighterCombatEquipment(this.fighter, createAnimationPreviewCombatFighterState(equipment), slotKeys);
    applyCurrentDebugAnimationWeaponPose(this.fighter);
    this.syncAnimationWeaponDragPicking();
  }

  private syncWeaponEnchantGlowPreview(slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS): void {
    if (this.viewerMode !== "enchantGlow" || !this.fighter) {
      return;
    }

    const equipment = this.getPreviewEquipment() ?? createDefaultHeroEquipment();

    syncFighterCombatEquipment(this.fighter, createDebugWeaponEnchantGlowPreviewFighterState(equipment), slotKeys);
    this.weaponEnchantGlowPreviewTuningKey = getDebugWeaponEnchantGlowPreviewTuningKey();
  }

  private syncWeaponEnchantGlowTuningIfNeeded(): void {
    if (this.viewerMode !== "enchantGlow" || !this.fighter) {
      return;
    }

    const tuningKey = getDebugWeaponEnchantGlowPreviewTuningKey();

    if (tuningKey === this.weaponEnchantGlowPreviewTuningKey) {
      return;
    }

    const equipment = this.getPreviewEquipment() ?? createDefaultHeroEquipment();
    const equipmentKey = getAnimationPreviewEquipmentKey(equipment);

    if (equipmentKey !== this.animationPreviewEquipmentKey) {
      this.syncPreviewEquipment(["weaponMain"]);
      return;
    }

    this.weaponEnchantGlowPreviewTuningKey = tuningKey;
    syncPaperDollWeaponEnchantments(this.fighter.paperDollRig, ["weaponMain"], equipment, createDebugWeaponEnchantGlowPreviewEnchantments(equipment));
  }

  private syncAnimationWeaponDragPicking(): void {
    if (this.viewerMode !== "animation") {
      return;
    }

    syncDebugPaperDollAnimationWeaponPicking(this.fighter?.paperDollRig, debugTuning.animationWeaponDragEnabled);
  }

  private getPreviewEquipment(): HeroEquipment | undefined {
    if (this.viewerMode === "enchantGlow") {
      return createDebugWeaponEnchantGlowPreviewEquipment();
    }

    if (this.viewerMode !== "animation") {
      return activePlayerEquipment;
    }

    const baseEquipment = activePlayerEquipment ?? createDefaultHeroEquipment();
    const itemId = debugTuning.animationPreviewWeaponItemId;

    if (!debugTuning.animationPreviewRandomWeapon || !itemId) {
      return baseEquipment;
    }

    const item = HERO_ITEM_CATALOG[itemId];

    if (!item || item.kind !== "weapon" || (item.equipmentSlot !== "weaponMain" && item.equipmentSlot !== "weaponBow")) {
      return baseEquipment;
    }

    return {
      ...baseEquipment,
      [item.equipmentSlot]: itemId,
    };
  }

  private getDebugCharacterLayout(): CityHeroLayout {
    if (this.viewerMode === "animation") {
      return this.getAnimationCharacterLayout();
    }

    if (debugTuning.characterCanvasEditMode === "face") {
      return this.getFaceCharacterLayout();
    }

    return {
      feetX: debugTuning.characterPreviewFeetX,
      feetY: debugTuning.characterPreviewFeetY,
      scale: debugTuning.characterPreviewScale,
      logicalScale: debugTuning.characterPreviewScale,
    };
  }

  private getAnimationCharacterLayout(): CityHeroLayout {
    const width = Math.max(1, this.scale.width || DEBUG_CHARACTER_VIEWER_WIDTH);
    const height = Math.max(1, this.scale.height || DEBUG_CHARACTER_VIEWER_HEIGHT);
    const visualHeightAtScaleOne = CITY_HERO_VIEWER_HEIGHT * PAPER_DOLL_BASE_SCALE;
    const visualWidthAtScaleOne = CITY_HERO_VIEWER_WIDTH * CITY_HERO_CAMERA_VISUAL_WIDTH_RATIO * PAPER_DOLL_BASE_SCALE;
    const heightScaleLimit = Math.max(0.1, height - 72) / visualHeightAtScaleOne;
    const widthScaleLimit = Math.max(0.1, width - 72) / visualWidthAtScaleOne;
    const scale = clampNumber(Math.min(2.4, heightScaleLimit, widthScaleLimit), 0.75, 2.4) * debugTuning.animationEditorZoom;

    return {
      feetX: width / 2 + debugTuning.animationEditorOffsetX,
      feetY: height - 34 + debugTuning.animationEditorOffsetY,
      scale,
      logicalScale: scale,
    };
  }

  private getAnimationFloorGuide(): DebugAnimationFloorGuide {
    if (this.animationFloorGuide) {
      return this.animationFloorGuide;
    }

    const graphics = this.add.graphics().setDepth(80);
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      color: "#fff2be",
      fontFamily: "Georgia",
      fontSize: "13px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 3,
    };
    const floorLabel = this.add.text(0, 0, "game floor", textStyle).setDepth(81);
    const rootLabel = this.add.text(0, 0, "root 0,0", textStyle).setDepth(81);

    this.animationFloorGuide = { graphics, floorLabel, rootLabel };

    return this.animationFloorGuide;
  }

  private syncAnimationFloorGuide(layout = this.viewerMode === "animation" ? this.getAnimationCharacterLayout() : undefined): void {
    const guide = this.animationFloorGuide ?? (this.viewerMode === "animation" ? this.getAnimationFloorGuide() : undefined);

    if (this.viewerMode !== "animation" || !guide || !layout) {
      if (guide) {
        guide.graphics.setVisible(false);
        guide.floorLabel.setVisible(false);
        guide.rootLabel.setVisible(false);
      }
      return;
    }

    const width = Math.max(1, this.scale.width || DEBUG_CHARACTER_VIEWER_WIDTH);
    const height = Math.max(1, this.scale.height || DEBUG_CHARACTER_VIEWER_HEIGHT);
    const floorX = layout.feetX;
    const floorY = layout.feetY;
    const root = this.fighter?.paperDollRig?.root;
    const rootX = root?.x ?? floorX;
    const rootY = root?.y ?? floorY;
    const rootScaleX = !root || root.scaleX === 0 ? 1 : root.scaleX;
    const rootScaleY = !root || root.scaleY === 0 ? 1 : root.scaleY;
    const rootOffsetX = Math.round((rootX - floorX) / rootScaleX);
    const rootOffsetY = Math.round((rootY - floorY) / rootScaleY);
    const floorLabelText = floorY < 0 ? "game floor above" : floorY > height ? "game floor below" : "game floor";

    guide.graphics
      .clear()
      .lineStyle(5, 0x35180d, 0.34)
      .beginPath()
      .moveTo(16, floorY)
      .lineTo(width - 16, floorY)
      .strokePath()
      .lineStyle(2, 0xffd36a, 0.82)
      .beginPath()
      .moveTo(16, floorY)
      .lineTo(width - 16, floorY)
      .strokePath()
      .lineStyle(2, 0x9ff8ff, 0.72)
      .beginPath()
      .moveTo(floorX, floorY)
      .lineTo(rootX, rootY)
      .strokePath()
      .fillStyle(0xffd36a, 0.96)
      .fillCircle(floorX, floorY, 4)
      .lineStyle(2, 0x35180d, 0.72)
      .strokeCircle(floorX, floorY, 4)
      .fillStyle(0x9ff8ff, 0.96)
      .fillCircle(rootX, rootY, 6)
      .lineStyle(2, 0x35180d, 0.8)
      .strokeCircle(rootX, rootY, 6);

    guide.graphics.setVisible(true);
    guide.floorLabel.setText(floorLabelText).setPosition(24, clampNumber(floorY - 24, 6, height - 22)).setVisible(true);
    guide.rootLabel
      .setText(`root ${rootOffsetX},${rootOffsetY}`)
      .setPosition(clampNumber(rootX + 10, 6, width - 94), clampNumber(rootY - 22, 6, height - 22))
      .setVisible(true);
  }

  private getFaceCharacterLayout(): CityHeroLayout {
    const rig = this.fighter?.paperDollRig;
    const scale = debugTuning.facePreviewScale;
    const presetTuning = getDebugBodyPresetTuning(rig?.bodyPresetKey);
    const headTuning = presetTuning.rigParts.head ?? DEFAULT_RIG_PARTS.head ?? defaultRigPartTuning;
    const headPivot = PAPER_DOLL_PART_PIVOTS.head;
    const focusLocalX = headPivot.x + headTuning.x;
    const focusLocalY = headPivot.y + headTuning.y + HEAD_FACE_EYE_Y;
    const rootScaleX = PAPER_DOLL_BASE_SCALE * scale * (rig?.appearance.facing ?? 1);
    const rootScaleY = PAPER_DOLL_BASE_SCALE * scale;

    return {
      feetX: debugTuning.facePreviewFocusX - focusLocalX * rootScaleX,
      feetY: debugTuning.facePreviewFocusY - focusLocalY * rootScaleY,
      scale,
      logicalScale: scale,
    };
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
      logicalScale: scale,
    };
  }

  private handleResize(): void {
    this.sync();
  }

  private syncPreviewArmorAlpha(): void {
    if (this.viewerMode !== "debug") {
      return;
    }

    syncPaperDollArmorAlpha(
      this.fighter?.paperDollRig,
      debugTuning.characterPreviewArmorGhosted ? DEBUG_CHARACTER_GHOST_ARMOR_ALPHA : 1,
    );
  }

  private beginRigPartDrag(partKey: RigPartKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent): void {
    if (this.viewerMode === "animation" && isAnimationCanvasPanPointer(pointer)) {
      event?.stopPropagation();
      this.beginAnimationCanvasPan(pointer);
      return;
    }

    if (debugTuning.characterCanvasEditMode !== "parts" && debugTuning.characterCanvasEditMode !== "bodyArt") {
      if (this.viewerMode === "animation" && debugTuning.characterCanvasEditMode === "root" && isPrimaryPointerDown(pointer)) {
        event?.stopPropagation();
        this.beginAnimationRootDrag(pointer);
      }
      return;
    }

    if (typeof pointer.leftButtonDown === "function" && !pointer.leftButtonDown()) {
      return;
    }

    event?.stopPropagation();
    const selectedRigParts = isRigPartGroupSelectPointer(pointer)
      ? getDebugRigPartSelectionGroup(partKey)
      : getNextDebugRigPartSelection(partKey, isMultiSelectPointer(pointer));
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

    const localPointer = this.getEquipmentDragPointerLocalPoint(slotKey, pointer);

    if (!localPointer) {
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
      lastPointerLocalX: localPointer.x,
      lastPointerLocalY: localPointer.y,
    };
  }

  private handlePreviewPointerDown(pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]): void {
    if (this.viewerMode === "animation" && isAnimationCanvasPanPointer(pointer)) {
      this.beginAnimationCanvasPan(pointer);
      return;
    }

    if (gameObjects.length > 0) {
      return;
    }

    if (typeof pointer.leftButtonDown === "function" && !pointer.leftButtonDown()) {
      return;
    }

    updateDebugTuning({ selectedRigParts: [] }, { undoable: false });
    this.endDrag();
  }

  private beginAnimationWeaponDrag(slotKey: PaperDollEquipmentSlotKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent): void {
    if (this.viewerMode === "animation" && isAnimationCanvasPanPointer(pointer)) {
      event?.stopPropagation();
      this.beginAnimationCanvasPan(pointer);
      return;
    }

    if (this.viewerMode !== "animation" || !debugTuning.animationWeaponDragEnabled) {
      return;
    }

    if (!isPrimaryPointerDown(pointer) || !this.isEquipmentSlotVisible(slotKey)) {
      return;
    }

    const localPointer = this.getEquipmentDragPointerLocalPoint(slotKey, pointer);

    if (!localPointer) {
      return;
    }

    event?.stopPropagation();
    this.endRigPartDrag();
    this.endAnimationRootDrag();
    this.endAnimationCanvasPan();
    this.endEquipmentDrag();
    updateDebugTuning({ selectedRigParts: [] }, { undoable: false });
    const itemId = this.getEquipmentItemId(slotKey);

    emitDebugCharacterEquipmentSelect({ slotKey, itemId });
    beginDebugUndoGroup();
    this.animationWeaponDragState = {
      slotKey,
      itemId,
      lastPointerLocalX: localPointer.x,
      lastPointerLocalY: localPointer.y,
    };
  }

  private beginAnimationCanvasPan(pointer: Phaser.Input.Pointer): void {
    this.endRigPartDrag();
    this.endAnimationRootDrag();
    this.endAnimationWeaponDrag();
    this.endEquipmentDrag();
    this.canvasPanState = {
      lastPointerX: pointer.worldX,
      lastPointerY: pointer.worldY,
    };
  }

  private dragAnimationCanvas(pointer: Phaser.Input.Pointer): void {
    if (!this.canvasPanState) {
      return;
    }

    if (!pointer.isDown || !isAnimationCanvasPanPointer(pointer)) {
      this.endAnimationCanvasPan();
      return;
    }

    const pointerX = pointer.worldX;
    const pointerY = pointer.worldY;
    const deltaX = pointerX - this.canvasPanState.lastPointerX;
    const deltaY = pointerY - this.canvasPanState.lastPointerY;

    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      return;
    }

    updateDebugTuning(
      {
        animationEditorOffsetX: debugTuning.animationEditorOffsetX + deltaX,
        animationEditorOffsetY: debugTuning.animationEditorOffsetY + deltaY,
      },
      { undoable: false },
    );

    this.canvasPanState.lastPointerX = pointerX;
    this.canvasPanState.lastPointerY = pointerY;
  }

  private beginAnimationRootDrag(pointer: Phaser.Input.Pointer): void {
    this.endRigPartDrag();
    this.endEquipmentDrag();
    this.endAnimationCanvasPan();
    beginDebugUndoGroup();
    this.rootDragState = {
      lastPointerX: pointer.worldX,
      lastPointerY: pointer.worldY,
    };
  }

  private dragAnimationRoot(pointer: Phaser.Input.Pointer): void {
    if (!this.rootDragState || !this.fighter?.paperDollRig) {
      return;
    }

    if (!pointer.isDown) {
      this.endAnimationRootDrag();
      return;
    }

    const pointerX = pointer.worldX;
    const pointerY = pointer.worldY;
    const worldDeltaX = pointerX - this.rootDragState.lastPointerX;
    const worldDeltaY = pointerY - this.rootDragState.lastPointerY;

    if (Math.abs(worldDeltaX) < 0.1 && Math.abs(worldDeltaY) < 0.1) {
      return;
    }

    const root = this.fighter.paperDollRig.root;
    const scaleX = root.scaleX === 0 ? 1 : root.scaleX;
    const scaleY = root.scaleY === 0 ? 1 : root.scaleY;

    updateAnimationRootOffsetWithInteractiveDelta({
      x: worldDeltaX / scaleX,
      y: worldDeltaY / scaleY,
    });

    this.rootDragState.lastPointerX = pointerX;
    this.rootDragState.lastPointerY = pointerY;
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
    const worldDeltaX = pointerX - this.dragState.lastPointerX;
    const worldDeltaY = pointerY - this.dragState.lastPointerY;

    if (Math.abs(worldDeltaX) < 0.1 && Math.abs(worldDeltaY) < 0.1) {
      return;
    }

    if (debugTuning.characterCanvasEditMode === "bodyArt") {
      updateBodyPartLayersWithInteractivePointerDelta(
        this.fighter.paperDollRig,
        this.dragState.partKeys,
        { x: this.dragState.lastPointerX, y: this.dragState.lastPointerY },
        { x: pointerX, y: pointerY },
      );

      this.dragState.lastPointerX = pointerX;
      this.dragState.lastPointerY = pointerY;
      return;
    }

    const root = this.fighter.paperDollRig.root;
    const scaleX = root.scaleX === 0 ? 1 : root.scaleX;
    const scaleY = root.scaleY === 0 ? 1 : root.scaleY;

    updateRigPartsWithInteractiveDelta(this.dragState.partKeys, {
      x: worldDeltaX / scaleX,
      y: worldDeltaY / scaleY,
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

    const localPointer = this.getEquipmentDragPointerLocalPoint(this.equipmentDragState.slotKey, pointer);

    if (!localPointer) {
      this.endEquipmentDrag();
      return;
    }

    const deltaX = localPointer.x - this.equipmentDragState.lastPointerLocalX;
    const deltaY = localPointer.y - this.equipmentDragState.lastPointerLocalY;

    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      return;
    }

    emitDebugCharacterEquipmentDelta(this.equipmentDragState, {
      x: deltaX,
      y: deltaY,
    });

    this.equipmentDragState.lastPointerLocalX = localPointer.x;
    this.equipmentDragState.lastPointerLocalY = localPointer.y;
  }

  private endRigPartDrag(): void {
    this.dragState = undefined;
    endDebugUndoGroup();
  }

  private dragAnimationWeapon(pointer: Phaser.Input.Pointer): void {
    if (!this.animationWeaponDragState || !this.fighter?.paperDollRig) {
      return;
    }

    if (!pointer.isDown || !debugTuning.animationWeaponDragEnabled) {
      this.endAnimationWeaponDrag();
      return;
    }

    const localPointer = this.getEquipmentDragPointerLocalPoint(this.animationWeaponDragState.slotKey, pointer);

    if (!localPointer) {
      this.endAnimationWeaponDrag();
      return;
    }

    const deltaX = localPointer.x - this.animationWeaponDragState.lastPointerLocalX;
    const deltaY = localPointer.y - this.animationWeaponDragState.lastPointerLocalY;

    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      return;
    }

    emitDebugCharacterEquipmentDelta(this.animationWeaponDragState, {
      x: deltaX,
      y: deltaY,
    });
    this.animationWeaponDragState.lastPointerLocalX = localPointer.x;
    this.animationWeaponDragState.lastPointerLocalY = localPointer.y;
  }

  private endAnimationRootDrag(): void {
    this.rootDragState = undefined;
    endDebugUndoGroup();
  }

  private endAnimationWeaponDrag(): void {
    this.animationWeaponDragState = undefined;
    endDebugUndoGroup();
  }

  private endEquipmentDrag(): void {
    this.equipmentDragState = undefined;
    endDebugUndoGroup();
  }

  private endAnimationCanvasPan(): void {
    this.canvasPanState = undefined;
  }

  private endDrag(): void {
    this.endRigPartDrag();
    this.endAnimationRootDrag();
    this.endAnimationWeaponDrag();
    this.endEquipmentDrag();
    this.endAnimationCanvasPan();
  }

  private handlePreviewWheel(pointer: Phaser.Input.Pointer, deltaY: number): void {
    if (this.viewerMode === "animation" && isAnimationCanvasZoomWheel(pointer)) {
      updateDebugTuning(
        {
          animationEditorZoom: debugTuning.animationEditorZoom + (deltaY > 0 ? -0.06 : 0.06),
        },
        { undoable: false },
      );
      return;
    }

    this.rotateSelectedWithWheel(deltaY);
  }

  private rotateSelectedWithWheel(deltaY: number): void {
    if (debugTuning.characterCanvasEditMode === "root") {
      return;
    }

    if (debugTuning.characterCanvasEditMode === "equipment") {
      this.rotateSelectedEquipmentWithWheel(deltaY);
      return;
    }

    if (debugTuning.characterCanvasEditMode === "bodyArt") {
      this.rotateSelectedBodyArtWithWheel(deltaY);
      return;
    }

    this.rotateSelectedRigPartsWithWheel(deltaY);
  }

  private rotateSelectedBodyArtWithWheel(deltaY: number): void {
    if (deltaY === 0 || debugTuning.selectedRigParts.length === 0) {
      return;
    }

    updateBodyPartLayersWithInteractiveDelta(debugTuning.selectedRigParts, {
      angle: deltaY > 0 ? 3 : -3,
    });
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
    const equipment = this.viewerMode === "animation"
      ? this.getPreviewEquipment()
      : rig?.usesPlayerEquipment
        ? activePlayerEquipment
        : rig?.equipmentState;

    return equipment?.[slotKey] ?? "";
  }

  private isEquipmentSlotVisible(slotKey: PaperDollEquipmentSlotKey): boolean {
    const slot = this.fighter?.paperDollRig?.equipment[slotKey];

    return Boolean(slot && isPaperDollEquipmentSlotVisible(slot));
  }

  private getEquipmentDragPointerLocalPoint(
    slotKey: PaperDollEquipmentSlotKey,
    pointer: Phaser.Input.Pointer,
  ): { x: number; y: number } | undefined {
    const slot = this.fighter?.paperDollRig?.equipment[slotKey];

    if (!slot) {
      return undefined;
    }

    return getPaperDollEquipmentDragLocalPoint(slot, pointer.worldX, pointer.worldY);
  }

}

export function mountDebugCharacterViewer(parent: HTMLElement, playerEquipment?: HeroEquipment, options: DebugCharacterViewerOptions = {}): () => void {
  usePlayerEquipment(playerEquipment);
  const viewerMode = options.mode ?? "debug";
  const isResponsiveMode = viewerMode === "shop" || viewerMode === "animation";

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: isResponsiveMode ? Math.max(1, parent.clientWidth || DEBUG_CHARACTER_VIEWER_WIDTH) : DEBUG_CHARACTER_VIEWER_WIDTH,
    height: isResponsiveMode ? Math.max(1, parent.clientHeight || DEBUG_CHARACTER_VIEWER_HEIGHT) : DEBUG_CHARACTER_VIEWER_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    fps: getPlayerPhaserFpsConfig(),
    render: getPlayerPhaserRenderConfig(),
    scale: {
      mode: isResponsiveMode ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
      autoCenter: isResponsiveMode ? Phaser.Scale.NO_CENTER : Phaser.Scale.CENTER_BOTH,
    },
    scene: new DebugCharacterScene(viewerMode),
  });
  bindWebglRecoveryOverlay(game, `debug-${viewerMode}`);

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
  const front = target.add.container(0, 0).setDepth(-15);
  const ambient = target.add.container(0, 0).setDepth(-12);
  const actors = target.add.container(0, 0).setDepth(10);
  const effects = target.add.container(0, 0).setDepth(40);
  const midShade = { amount: 0 };
  const midImages = new Set<Phaser.GameObjects.Image>();
  const backgroundImages: ArenaLayers["backgroundImages"] = {};
  const backgroundLayerContainers: ArenaLayers["backgroundLayerContainers"] = {};
  const backgroundLayerRoles: ArenaLayers["backgroundLayerRoles"] = {};
  const backgroundLayerIds: ArenaLayers["backgroundLayerIds"] = [];

  return { back, mid, ground, front, ambient, actors, effects, midShade, midImages, backgroundImages, backgroundLayerContainers, backgroundLayerRoles, backgroundLayerIds, all: [actors, effects] };
}

function drawArenaBackground(target: Phaser.Scene, layers: ArenaLayers, encounter?: ArenaBackgroundPreloadEncounter): void {
  syncArenaBackgroundAssetSet(target, layers, getArenaBackgroundAssetSetForEncounter(encounter));
}

function syncArenaBackgroundForState(target: Phaser.Scene, layers: ArenaLayers, current: CombatState): void {
  const assetSet = getArenaBackgroundAssetSetForEncounter(current.encounter);
  const viewportKey = getArenaBackgroundViewportKey(target);

  if (!isDebugTuningActive() && layers.backgroundTierId === assetSet.tierId && layers.backgroundVariantId === assetSet.variantId && layers.backgroundViewportKey === viewportKey) {
    return;
  }

  syncArenaBackgroundAssetSet(target, layers, assetSet, current);
}

function getArenaBackgroundAssetSetForEncounter(encounter?: CombatState["encounter"]): ArenaBackgroundAssetSet {
  return getArenaBackgroundAssetSetForTier(encounter?.tierId, encounter?.backgroundVariantId);
}

function getArenaBackgroundAssetSetForTier(tierId?: number, variantId?: ArenaBackgroundVariantId): ArenaBackgroundAssetSet {
  const tierAssetSets = ARENA_BACKGROUND_ASSET_SETS.filter((assetSet) => assetSet.tierId === tierId);

  return (
    tierAssetSets.find((assetSet) => variantId && assetSet.variantId === variantId) ??
    tierAssetSets[0] ??
    ARENA_BACKGROUND_ASSET_SETS[0]
  );
}

function getArenaBackgroundTuningTierId(tierId?: number): ArenaBackgroundTuningTierId {
  return Math.max(1, Math.round(tierId ?? 1));
}

function syncArenaBackgroundAssetSet(target: Phaser.Scene, layers: ArenaLayers, assetSet: ArenaBackgroundAssetSet, current?: CombatState): void {
  const activeLayerIds = new Set(assetSet.layers.map((layer) => layer.layer));

  Object.entries(layers.backgroundImages).forEach(([layerKey, image]) => {
    if (!activeLayerIds.has(layerKey)) {
      image?.setVisible(false);
      layers.backgroundLayerContainers[layerKey]?.setVisible(false);
      layers.midImages.delete(image as Phaser.GameObjects.Image);
    }
  });
  assetSet.layers.forEach((config, index) => {
    syncArenaBackgroundLayer(target, layers, config, index, assetSet.tierId, assetSet.variantId, current);
  });
  layers.backgroundLayerIds = assetSet.layers.map((layer) => layer.layer);
  layers.all = [...layers.backgroundLayerIds.map((layerKey) => layers.backgroundLayerContainers[layerKey]).filter((container): container is Phaser.GameObjects.Container => !!container), layers.actors, layers.effects];
  layers.backgroundTierId = assetSet.tierId;
  layers.backgroundVariantId = assetSet.variantId;
  layers.backgroundViewportKey = getArenaBackgroundViewportKey(target);
}

function createArenaBackgroundAssetSets(): ArenaBackgroundAssetSet[] {
  const byTierAndVariant = new Map<string, ArenaBackgroundAssetSet>();

  ARENA_BACKGROUND_LAYER_ASSETS.forEach((asset) => {
    const key = getArenaBackgroundAssetSetKey(asset.tierId, asset.variantId);
    const assetSet = byTierAndVariant.get(key) ?? { tierId: asset.tierId, variantId: asset.variantId, layers: [] };

    assetSet.layers.push({
      layer: asset.layer,
      role: asset.role,
      order: asset.order,
      key: asset.key,
      url: asset.url,
      shadeWithCamera: asset.shadeWithCamera,
    });
    byTierAndVariant.set(key, assetSet);
  });

  return Array.from(byTierAndVariant.values())
    .map((assetSet) => ({ ...assetSet, layers: [...assetSet.layers].sort((a, b) => a.order - b.order || a.layer.localeCompare(b.layer)) }))
    .sort((a, b) => a.tierId - b.tierId || a.variantId.localeCompare(b.variantId));
}

function getArenaBackgroundAssetSetKey(tierId: number, variantId: ArenaBackgroundVariantId): string {
  return `${tierId}:${variantId}`;
}

function syncArenaBackgroundLayer(
  target: Phaser.Scene,
  layers: ArenaLayers,
  config: ArenaBackgroundLayerConfig,
  index: number,
  tierId: number,
  variantId: ArenaBackgroundVariantId,
  current?: CombatState,
): void {
  const layerKey = config.layer;
  const currentImage = layers.backgroundImages[layerKey];
  const isTierChange = layers.backgroundTierId !== tierId;

  if (!target.textures.exists(config.key)) {
    currentImage?.setVisible(false);
    layers.backgroundLayerContainers[layerKey]?.setVisible(false);
    target.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    return;
  }

  let image = currentImage;
  let container = layers.backgroundLayerContainers[layerKey];
  const isNewImage = !image;
  const isTextureChange = !!image && image.texture.key !== config.key;

  if (!image) {
    image = target.add.image(ARENA_WORLD_LEFT, ARENA_WORLD_TOP, config.key).setOrigin(0, 0);
    layers.backgroundImages[layerKey] = image;
  }
  if (!container) {
    container = target.add.container(0, 0);
    layers.backgroundLayerContainers[layerKey] = container;
    container.add(image);
  } else if (image.parentContainer !== container) {
    container.add(image);
  }
  container
    .setDepth(ARENA_BACKGROUND_ROLE_DEPTHS[config.role] + index / 100)
    .setVisible(true);
  layers.backgroundLayerRoles[layerKey] = config.role;

  image.setTexture(config.key);

  const layout = getArenaBackgroundLayerLayoutForTier(getArenaBackgroundTuningTierId(tierId), layerKey, debugTuning, variantId);

  if (isArenaBackgroundLayerCameraAlphaManaged(layerKey) && (isNewImage || isTextureChange || isTierChange)) {
    image.setAlpha(getArenaBackgroundLayerImmediateAlpha(target, layerKey, tierId, variantId, current));
  }

  applyArenaBackgroundLayerLayout(target, image, layout, config.role, { applyAlpha: !isArenaBackgroundLayerCameraAlphaManaged(layerKey) });

  if (config.shadeWithCamera) {
    layers.midImages.add(image);
    syncArenaMidLayerTint(layers);
    return;
  }

  layers.midImages.delete(image);

  image.clearTint();
}

function applyArenaBackgroundLayerLayout(
  target: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  layout: ArenaBackgroundLayerLayout,
  role: ArenaBackgroundLayerRole,
  options: { applyAlpha?: boolean } = {},
): void {
  const coverScale = getArenaBackgroundViewportCoverScale(getArenaViewport(target));
  const baseWidth = ARENA_WORLD_WIDTH * layout.scale;
  const baseHeight = ARENA_WORLD_HEIGHT * layout.scale;
  const width = baseWidth * coverScale;
  const height = baseHeight * coverScale;
  const layoutExtraWidth = baseWidth - ARENA_WORLD_WIDTH;
  const layoutExtraHeight = baseHeight - ARENA_WORLD_HEIGHT;
  const coverExtraWidth = width - baseWidth;
  const coverExtraHeight = height - baseHeight;
  const coverAnchorY = ARENA_BACKGROUND_ROLE_COVER_ANCHOR_Y[role];

  image
    .setPosition(
      ARENA_WORLD_LEFT + layout.x - layoutExtraWidth / 2 - coverExtraWidth / 2,
      ARENA_WORLD_TOP + layout.y - layoutExtraHeight / 2 - coverExtraHeight * coverAnchorY,
    )
    .setDisplaySize(width, height);

  if (options.applyAlpha ?? true) {
    image.setAlpha(layout.alpha);
  }

  image.setVisible(layout.visible);
}

function getArenaBackgroundViewportKey(target: Phaser.Scene): string {
  const viewport = getArenaViewport(target);

  return `${Math.round(viewport.width)}:${Math.round(viewport.height)}`;
}

function getArenaBackgroundViewportCoverScale(viewport: CameraViewport): number {
  const designAspect = GAME_WIDTH / GAME_HEIGHT;
  const viewportAspect = viewport.width / viewport.height;

  if (!Number.isFinite(viewportAspect) || viewportAspect >= designAspect) {
    return 1;
  }

  const rawCoverScale = designAspect / viewportAspect;

  if (!Number.isFinite(rawCoverScale) || rawCoverScale <= ARENA_BACKGROUND_VIEWPORT_COVER_START_SCALE) {
    return 1;
  }

  return clampNumber(rawCoverScale * ARENA_BACKGROUND_VIEWPORT_COVER_OVERSCAN, 1, ARENA_BACKGROUND_VIEWPORT_COVER_MAX_SCALE);
}

function getArenaBackgroundLayerLayoutForTier(
  tierId: ArenaBackgroundTuningTierId,
  layerKey: ArenaBackgroundEditLayer,
  tuning: ArenaDebugTuning,
  variantId = DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
): ArenaBackgroundLayerLayout {
  const normalizeLayout = (layout: ArenaBackgroundLayerLayout): ArenaBackgroundLayerLayout => (
    isArenaBackgroundLayerCameraAlphaManaged(layerKey) ? { ...layout, alpha: 1 } : layout
  );

  if (usesDynamicArenaBackgroundLayerTuning(tierId, layerKey, variantId)) {
    return normalizeLayout(getDynamicArenaBackgroundLayerTuning(tuning, tierId, layerKey, variantId).layout);
  }

  const keyPrefix = getArenaBackgroundLayerTuningPrefix(tierId, layerKey);

  if (!keyPrefix) {
    return normalizeLayout(getDynamicArenaBackgroundLayerTuning(tuning, tierId, layerKey, variantId).layout);
  }

  return normalizeLayout({
    x: tuning[`${keyPrefix}X`],
    y: tuning[`${keyPrefix}Y`],
    scale: tuning[`${keyPrefix}Scale`],
    alpha: tuning[`${keyPrefix}Alpha`],
    visible: tuning[`${keyPrefix}Visible`],
  });
}

function preloadScrollCastPropAssets(target: Phaser.Scene): void {
  SCROLL_CAST_PROP_ASSETS.forEach((asset) => target.load.image(asset.key, asset.url));
}

function getEditableArenaBackgroundLayer(
  tierId: ArenaBackgroundTuningTierId,
  layerKey: ArenaBackgroundEditLayer,
  variantId = DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
): ArenaBackgroundEditLayer {
  const layers = getArenaBackgroundLayerKeysForTier(tierId, variantId);

  return layers.includes(layerKey) ? layerKey : layers[0] ?? "ground";
}

function updateArenaBackgroundLayerLayout(
  tierId: ArenaBackgroundTuningTierId,
  layerKey: ArenaBackgroundEditLayer,
  patch: Partial<ArenaBackgroundLayerLayout>,
  variantId = DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
): void {
  if (usesDynamicArenaBackgroundLayerTuning(tierId, layerKey, variantId)) {
    const current = getDynamicArenaBackgroundLayerTuning(debugTuning, tierId, layerKey, variantId);
    const tierKey = String(tierId);
    const tierTuning = debugTuning.arenaBackgroundTiers[tierKey] ?? {};
    const nextLayer = {
      ...current,
      layout: { ...current.layout, ...patch },
    };

    if (variantId !== DEFAULT_ARENA_BACKGROUND_VARIANT_ID) {
      updateDebugTuning({
        arenaBackgroundTiers: {
          ...debugTuning.arenaBackgroundTiers,
          [tierKey]: {
            ...tierTuning,
            variants: {
              ...tierTuning.variants,
              [variantId]: {
                ...tierTuning.variants?.[variantId],
                [layerKey]: nextLayer,
              },
            },
          },
        },
      });
      return;
    }

    updateDebugTuning({
      arenaBackgroundTiers: {
        ...debugTuning.arenaBackgroundTiers,
        [tierKey]: {
          ...tierTuning,
          layers: {
            ...tierTuning.layers,
            [layerKey]: nextLayer,
          },
        },
      },
    });
    return;
  }

  const keyPrefix = getArenaBackgroundLayerTuningPrefix(tierId, layerKey);
  const nextPatch: Record<string, number | boolean> = {};

  if (!keyPrefix) {
    return;
  }

  if (typeof patch.x === "number") {
    nextPatch[`${keyPrefix}X`] = patch.x;
  }

  if (typeof patch.y === "number") {
    nextPatch[`${keyPrefix}Y`] = patch.y;
  }

  if (typeof patch.scale === "number") {
    nextPatch[`${keyPrefix}Scale`] = patch.scale;
  }

  if (typeof patch.alpha === "number") {
    nextPatch[`${keyPrefix}Alpha`] = patch.alpha;
  }

  if (typeof patch.visible === "boolean") {
    nextPatch[`${keyPrefix}Visible`] = patch.visible;
  }

  updateDebugTuning(nextPatch as Partial<ArenaDebugTuning>);
}

function getArenaBackgroundLayerKeysForTier(tierId: ArenaBackgroundTuningTierId, variantId = DEFAULT_ARENA_BACKGROUND_VARIANT_ID): ArenaBackgroundEditLayer[] {
  const assetSet = getArenaBackgroundAssetSetForTier(tierId, variantId);
  const layers = assetSet.layers.map((layer) => layer.layer);

  return layers.length > 0 ? layers : ["ground"];
}

function usesDynamicArenaBackgroundLayerTuning(
  tierId: ArenaBackgroundTuningTierId,
  layerKey: ArenaBackgroundEditLayer,
  variantId = DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
): boolean {
  return variantId !== DEFAULT_ARENA_BACKGROUND_VARIANT_ID || tierId > 2 || !getArenaBackgroundLayerTuningPrefix(tierId, layerKey);
}

function isBaseArenaBackgroundLayer(layerKey: ArenaBackgroundEditLayer): boolean {
  return layerKey === getArenaBackgroundLayerRole(layerKey);
}

function getArenaBackgroundLayerTuningPrefix(tierId: ArenaBackgroundTuningTierId, layerKey: ArenaBackgroundEditLayer):
  | "arenaTier1BackgroundBack"
  | "arenaTier1BackgroundMid"
  | "arenaTier1BackgroundGround"
  | "arenaTier2BackgroundBack"
  | "arenaTier2BackgroundMid"
  | "arenaTier2BackgroundGround"
  | "arenaTier2BackgroundFront"
  | "arenaTier2BackgroundAmbient"
  | undefined {
  if (!isBaseArenaBackgroundLayer(layerKey)) {
    return undefined;
  }

  const role = getArenaBackgroundLayerRole(layerKey);

  if (tierId === 1) {
    switch (role) {
      case "back":
        return "arenaTier1BackgroundBack";
      case "mid":
        return "arenaTier1BackgroundMid";
      case "ground":
        return "arenaTier1BackgroundGround";
      case "front":
      case "ambient":
        return undefined;
    }
  }

  switch (role) {
    case "back":
      return "arenaTier2BackgroundBack";
    case "mid":
      return "arenaTier2BackgroundMid";
    case "ground":
      return "arenaTier2BackgroundGround";
    case "front":
      return "arenaTier2BackgroundFront";
    case "ambient":
      return "arenaTier2BackgroundAmbient";
  }
}

interface PlayerPaperDollOptionOverrides {
  weaponEnchantments?: HeroWeaponEnchantments;
  usesPlayerEquipment?: boolean;
}

function createPlayerPaperDollOptions(
  x: number,
  y: number,
  equipment = activePlayerEquipment,
  appearance = activePlayerAppearance,
  overrides: PlayerPaperDollOptionOverrides = {},
): PaperDollFighterOptions {
  const bodyPresetKey = debugTuning.paperDollBodyPreset;
  const bodyPreset = getPaperDollBodyPreset(bodyPresetKey);
  const equipmentAssetKeys = createPlayerEquipmentAssetKeys(equipment);
  const appearanceAssetKeys = createPlayerAppearanceAssetKeys(appearance, bodyPresetKey);

  return {
    x,
    y,
    label: "BORSHEMIR",
    facing: 1,
    skin: 0xefaa7b,
    skinDark: 0xd9854d,
    hair: 0x8b4a1f,
    bodyPresetKey,
    headAssetKey: bodyPreset.headAssetKey,
    torsoAssetKey: bodyPreset.torsoAssetKey,
    faceOverlayMode: bodyPreset.faceOverlayMode,
    faceAssetKeys: bodyPreset.faceAssetKeys,
    appearance: { ...appearance },
    appearanceAssetKeys,
    ...equipmentAssetKeys,
    equipment: equipment ? { ...equipment } : undefined,
    weaponEnchantments: overrides.weaponEnchantments ?? { ...activePlayerWeaponEnchantments },
    usesPlayerEquipment: overrides.usesPlayerEquipment ?? true,
    bodyPartAssetKeys: bodyPreset.bodyPartAssetKeys,
  };
}

function createEnemyPaperDollOptions(x: number, y: number, enemy?: FighterState): PaperDollFighterOptions {
  const preset = enemy?.visualPreset ?? DEFAULT_ENEMY_VISUAL_PRESET;
  const equipment = enemy?.equipment ? { ...enemy.equipment } : createDefaultHeroEquipment();
  const bodyPresetKey = debugTuning.paperDollBodyPreset;
  const bodyPreset = getPaperDollBodyPreset(bodyPresetKey);
  const appearance = enemy?.appearance ? { ...enemy.appearance } : undefined;
  const appearanceAssetKeys = appearance ? createPlayerAppearanceAssetKeys(appearance, bodyPresetKey) : undefined;

  return {
    x,
    y,
    label: enemy?.name.toUpperCase() ?? "GRUMBUS",
    facing: -1,
    skin: preset.skin,
    skinDark: preset.skinDark,
    hair: preset.hair,
    muscle: preset.muscle,
    bodyPresetKey,
    headAssetKey: bodyPreset.headAssetKey,
    torsoAssetKey: bodyPreset.torsoAssetKey,
    faceOverlayMode: bodyPreset.faceOverlayMode,
    faceAssetKeys: bodyPreset.faceAssetKeys,
    ...(appearance ? { appearance, appearanceAssetKeys } : {}),
    bodyPartAssetKeys: bodyPreset.bodyPartAssetKeys,
    ...createPlayerEquipmentAssetKeys(equipment),
    equipment,
    weaponEnchantments: enemy?.weaponEnchantments ? { ...enemy.weaponEnchantments } : undefined,
  };
}

function createHelperPaperDollOptions(x: number, y: number, helper: FighterState): PaperDollFighterOptions {
  return {
    ...createEnemyPaperDollOptions(x, y, helper),
    facing: 1,
  };
}

function buildVisuals(target: ArenaScene): ArenaVisuals {
  const player = createPaperDollFighter(target, createPlayerPaperDollOptions(DEFAULT_STAGE_ORIGIN_X + DEFAULT_PLAYER_STAGE_X, FIGHTER_BASE_Y), target.arenaLayers?.actors);
  const enemy = createPaperDollFighter(target, createEnemyPaperDollOptions(DEFAULT_STAGE_ORIGIN_X + DEFAULT_ENEMY_STAGE_X, FIGHTER_BASE_Y), target.arenaLayers?.actors);
  const playerHud = createHud(target, 30, 46, "BORSHEMIR");
  const enemyHud = createHud(target, 680, 46, "GRUMBUS");

  attachFighterArrowCounter(target, player);
  attachFighterArrowCounter(target, enemy);

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

function attachFighterArrowCounter(target: ArenaScene, fighter: FighterVisual): void {
  const counter = createFighterArrowCounter(target);
  const counterPart = part(counter.container);

  fighter.arrowCounter = counter;
  fighter.movableParts = [...(fighter.movableParts ?? []), counterPart];
  target.arenaLayers?.actors.add(counter.container);
}

function createFighterArrowCounter(target: Phaser.Scene): FighterArrowCounterVisual {
  const container = target.add.container(0, 0).setVisible(false).setDepth(24);
  const icon = target.add.image(-7, 0, ARROW_ICON_ASSET_KEY).setDisplaySize(18, 18);
  const text = target.add
    .text(4, 0, "0", {
      color: "#ffe6a0",
      fontFamily: "Georgia",
      fontSize: "15px",
      fontStyle: "900",
      stroke: "#2a1207",
      strokeThickness: 2,
    })
    .setOrigin(0, 0.5);

  container.add([icon, text]);

  return { container, icon, text, baseScale: 1 };
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
  const lowShadow = createPaperDollLowShadow(target, options.x, initialFeetY + debugTuning.lowShadowOffsetY);
  const rootContainer = target.add.container(options.x, initialFeetY);
  const root = part(rootContainer);
  const parts = {} as Record<PaperDollPartKey, FighterPart>;
  const equipment: PaperDollEquipment = {};
  const equipmentAnchors: PaperDollEquipmentAnchors = {};
  const equipmentLayers = createPaperDollEquipmentLayers(target);
  const faceParts: PaperDollFaceParts = {};
  const faceAssetLayers: PaperDollFaceAssetLayers = {};
  const appearanceLayers: PaperDollAppearanceLayers = {};
  const selectionHighlights = options.enableSelectionHighlights
    ? ({} as Record<PaperDollPartKey, Phaser.GameObjects.Graphics>)
    : undefined;

  PAPER_DOLL_PART_ORDER.forEach((key) => {
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const partContainer = target.add.container(pivot.x, pivot.y);

    addPaperDollPartVisual(target, partContainer, key, options, equipment, equipmentLayers, equipmentAnchors, faceParts, faceAssetLayers, appearanceLayers);
    if (selectionHighlights) {
      selectionHighlights[key] = addRigPartSelectionHighlight(target, partContainer, key);
    }
    rootContainer.add(partContainer);
    addPaperDollEquipmentLayersAfterPart(rootContainer, key, equipmentLayers);
    parts[key] = part(partContainer);
  });
  ensurePaperDollEquipmentSlots(target, parts, equipmentLayers, equipmentAnchors, equipment);

  const castProp = part(target.add.image(0, 0, DEFAULT_SCROLL_CAST_PROP_ASSET_KEY).setOrigin(0.5).setVisible(false));

  rootContainer.add(castProp);
  root.scaleX = PAPER_DOLL_BASE_SCALE * appearance.facing;
  root.scaleY = PAPER_DOLL_BASE_SCALE;
  const paperDollRig: PaperDollRig = {
    root,
    parts,
    bodyPresetKey: options.bodyPresetKey,
    headAssetKey: options.headAssetKey,
    torsoAssetKey: options.torsoAssetKey,
    bodyPartAssetKeys: options.bodyPartAssetKeys,
    faceOverlayMode: options.faceOverlayMode,
    faceAssetKeys: options.faceAssetKeys,
    faceAssetLayers,
    appearanceAssetKeys: options.appearanceAssetKeys,
    appearanceLayers,
    appearanceState: options.appearance ? { ...options.appearance } : undefined,
    equipment,
    equipmentAnchors,
    equipmentState: options.equipment ? { ...options.equipment } : undefined,
    weaponEnchantmentsState: options.weaponEnchantments ? { ...options.weaponEnchantments } : undefined,
    faceParts,
    appearance,
    castProp,
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
    bodyIdleAnimationKey: "idle",
    bodyIdleAnimationStartedAt: target.time.now,
  };
}

function createPaperDollLowShadow(target: Phaser.Scene, x: number, y: number): FighterPart {
  return part(target.add.ellipse(x, y, 94, 25, PAPER_DOLL_SHADOW_COLOR, 1).setDepth(PAPER_DOLL_SHADOW_DEPTH).setVisible(false));
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
  const faceAssetLayers: PaperDollFaceAssetLayers = {};
  const appearanceLayers: PaperDollAppearanceLayers = {};

  PAPER_DOLL_PART_ORDER.forEach((key) => {
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const partContainer = target.add.container(pivot.x, pivot.y);

    addPaperDollPartVisual(target, partContainer, key, options, equipment, equipmentLayers, equipmentAnchors, faceParts, faceAssetLayers, appearanceLayers);
    tintPaperDollShadowObject(partContainer);
    shadowRootContainer.add(partContainer);
    addPaperDollEquipmentLayersAfterPart(shadowRootContainer, key, equipmentLayers);
    parts[key] = part(partContainer);
  });
  ensurePaperDollEquipmentSlots(target, parts, equipmentLayers, equipmentAnchors, equipment);

  tintPaperDollEquipmentLayers(equipmentLayers);
  shadowRoot.scaleX = PAPER_DOLL_BASE_SCALE * appearance.facing * debugTuning.shadowScaleX;
  shadowRoot.scaleY = PAPER_DOLL_BASE_SCALE * debugTuning.shadowScaleY;
  applyPaperDollShadowBlur(shadowRoot);

  return {
    root: shadowRoot,
    parts,
    bodyPresetKey: options.bodyPresetKey,
    headAssetKey: options.headAssetKey,
    torsoAssetKey: options.torsoAssetKey,
    bodyPartAssetKeys: options.bodyPartAssetKeys,
    faceOverlayMode: options.faceOverlayMode,
    faceAssetKeys: options.faceAssetKeys,
    faceAssetLayers,
    appearanceAssetKeys: options.appearanceAssetKeys,
    appearanceLayers,
    equipment,
    equipmentAnchors,
    faceParts,
  };
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
  if (isPaperDollWeaponSlot(slotKey)) {
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

function applyCityHeroLighting(
  fighter: FighterVisual,
  amount = getCityLightingAmount(),
  equipmentSlotKeys?: readonly PaperDollEquipmentSlotKey[],
): void {
  const rig = fighter.paperDollRig;

  if (!rig) {
    return;
  }

  if (equipmentSlotKeys) {
    equipmentSlotKeys.forEach((slotKey) => {
      tintPaperDollImages(rig.equipment[slotKey], CITY_HERO_EQUIPMENT_TINT, amount);
    });
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

const DEBUG_RIG_PART_SELECTION_GROUPS: readonly (readonly RigPartKey[])[] = [
  ["backUpperArm", "backForearm", "backHand"],
  ["frontUpperArm", "frontForearm", "frontHand"],
  ["backThigh", "backShin", "backFoot"],
  ["frontThigh", "frontShin", "frontFoot"],
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
const CITY_PROFILE_PREVIEW_VISUAL_BOTTOM_PART_KEYS: readonly PaperDollPartKey[] = ["backFoot", "frontFoot"];
const CITY_PROFILE_PREVIEW_VISUAL_BOTTOM_EQUIPMENT_SLOT_KEYS: readonly PaperDollEquipmentSlotKey[] = ["backBoot", "frontBoot"];
const CITY_PROFILE_PREVIEW_FIT_IGNORED_EQUIPMENT_SLOT_KEYS = new Set<PaperDollEquipmentSlotKey>(["weaponMain", "weaponBow", "shield"]);

type FighterPartWithBounds = FighterPart & {
  getBounds?: () => Phaser.Geom.Rectangle;
};

function applyPaperDollRigTuning(
  fighter: FighterVisual,
  scale: number,
  feetY: number,
  centerX = fighter.body.x,
  playerSettings = getPlayerSettings(),
): void {
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
  applyPaperDollShadowTuning(fighter, scale, feetY, centerX, getEffectiveArenaShadowMode(playerSettings));
  fighter.name.x = centerX;
  fighter.name.y = feetY + 30 * PAPER_DOLL_BASE_SCALE * scale;
  fighter.debugScale = scale;
  rememberPaperDollAnimationRootBase(fighter);
}

function alignCityProfilePreviewVisualBottom(fighter: FighterVisual, visualBottomY: number): void {
  const visualBottom = getCityProfilePreviewVisualBottom(fighter);

  if (typeof visualBottom !== "number") {
    return;
  }

  const deltaY = visualBottomY - visualBottom;

  if (Math.abs(deltaY) < 0.01) {
    return;
  }

  fighter.body.y += deltaY;
  fighter.shadow.y += deltaY;
  fighter.lowShadow.y += deltaY;
  fighter.name.y += deltaY;
  rememberPaperDollAnimationRootBase(fighter);
}

function getCityProfilePreviewVisualBottom(fighter: FighterVisual): number | undefined {
  const rig = fighter.paperDollRig;

  if (!rig) {
    return undefined;
  }

  const candidates: (FighterPart | undefined)[] = [
    ...CITY_PROFILE_PREVIEW_VISUAL_BOTTOM_PART_KEYS.map((partKey) => rig.parts[partKey]),
    ...CITY_PROFILE_PREVIEW_VISUAL_BOTTOM_EQUIPMENT_SLOT_KEYS.map((slotKey) => rig.equipment[slotKey]),
  ];
  let visualBottom: number | undefined;

  for (const candidate of candidates) {
    const bounds = getFighterPartWorldBounds(candidate);

    if (!bounds) {
      continue;
    }

    visualBottom = Math.max(visualBottom ?? bounds.bottom, bounds.bottom);
  }

  return visualBottom;
}

function getCityProfilePreviewFitBounds(fighter: FighterVisual): Phaser.Geom.Rectangle | undefined {
  const rig = fighter.paperDollRig;

  if (!rig) {
    return undefined;
  }

  const candidates: (FighterPart | undefined)[] = [
    ...Object.values(rig.parts),
    ...PAPER_DOLL_EQUIPMENT_SLOT_KEYS
      .filter((slotKey) => !CITY_PROFILE_PREVIEW_FIT_IGNORED_EQUIPMENT_SLOT_KEYS.has(slotKey))
      .map((slotKey) => rig.equipment[slotKey]),
  ];
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const bounds = getFighterPartWorldBounds(candidate);

    if (!bounds) {
      continue;
    }

    left = Math.min(left, bounds.left);
    top = Math.min(top, bounds.top);
    right = Math.max(right, bounds.right);
    bottom = Math.max(bottom, bounds.bottom);
  }

  if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(right) || !Number.isFinite(bottom)) {
    return undefined;
  }

  return new Phaser.Geom.Rectangle(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}

function getFighterPartWorldBounds(partObject: FighterPart | undefined): Phaser.Geom.Rectangle | undefined {
  if (!partObject?.visible) {
    return undefined;
  }

  const getBounds = (partObject as FighterPartWithBounds).getBounds;

  if (typeof getBounds !== "function") {
    return undefined;
  }

  const bounds = getBounds.call(partObject);

  if (!Number.isFinite(bounds.bottom) || bounds.width <= 1 || bounds.height <= 1) {
    return undefined;
  }

  return bounds;
}

function applyPaperDollShadowTuning(
  fighter: FighterVisual,
  scale: number,
  feetY: number,
  centerX: number,
  shadowMode = getArenaShadowMode(),
): void {
  const highShadowVisible = fighter.castsShadow && shadowMode === "high" && !fighter.isShattered;
  const lowShadowVisible = fighter.castsShadow && shadowMode === "low" && !fighter.isShattered;
  const lowShadowScale = Math.max(PAPER_DOLL_LOW_SHADOW_MIN_SCALE, scale / DEFAULT_PLAYER_SCALE);
  const wasHighShadowVisible = fighter.shadow.visible;

  fighter.shadow.x = centerX + debugTuning.shadowOffsetX * scale;
  fighter.shadow.y = feetY + debugTuning.shadowOffsetY * scale;
  fighter.shadow.scaleX = PAPER_DOLL_BASE_SCALE * scale * (fighter.paperDollRig?.appearance.facing ?? 1) * debugTuning.shadowScaleX;
  fighter.shadow.scaleY = PAPER_DOLL_BASE_SCALE * scale * debugTuning.shadowScaleY;
  fighter.shadow.angle = 0;
  fighter.shadow.setVisible(highShadowVisible);
  fighter.shadow.setAlpha(highShadowVisible ? debugTuning.shadowAlpha : 0);
  applyPaperDollShadowBlur(fighter.shadow);
  if (highShadowVisible && !wasHighShadowVisible) {
    syncPaperDollEquipmentState(fighter.paperDollRig);
  }
  fighter.lowShadow.x = centerX + debugTuning.lowShadowOffsetX * scale;
  fighter.lowShadow.y = feetY + debugTuning.lowShadowOffsetY * scale;
  fighter.lowShadow.scaleX = lowShadowScale * debugTuning.lowShadowScaleX;
  fighter.lowShadow.scaleY = lowShadowScale * debugTuning.lowShadowScaleY;
  fighter.lowShadow.angle = 0;
  fighter.lowShadow.setVisible(lowShadowVisible);
  fighter.lowShadow.setAlpha(lowShadowVisible ? debugTuning.lowShadowAlpha : 0);
}

function applyRigPartDebugTuning(rig: PaperDollRig): void {
  const activeDebugTuning = getActiveDebugTuning();
  const presetTuning = activeDebugTuning ? getDebugBodyPresetTuning(rig.bodyPresetKey) : undefined;
  const rigParts = presetTuning?.rigParts;
  const faceParts = presetTuning?.faceParts ?? DEFAULT_FACE_PARTS;

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
  applyPaperDollEquipmentStateTuning(rig);
}

function syncPaperDollEquipmentState(
  rig: PaperDollRig | undefined,
  slotKeys?: readonly PaperDollEquipmentSlotKey[],
  equipmentOverride?: HeroEquipment,
): void {
  if (!rig) {
    return;
  }

  applyPaperDollEquipmentStateTuning(rig, slotKeys, equipmentOverride);
  syncPaperDollEquipmentVisibility(rig, slotKeys, equipmentOverride);
}

function syncPaperDollAppearanceState(rig: PaperDollRig | undefined, appearanceOverride?: HeroAppearance): void {
  if (!rig) {
    return;
  }

  const appearance = appearanceOverride ?? (rig.usesPlayerEquipment ? activePlayerAppearance : rig.appearanceState) ?? createDefaultHeroAppearance();
  const appearanceAssetKeys = createPlayerAppearanceAssetKeys(appearance, rig.bodyPresetKey);

  rig.appearanceState = { ...appearance };
  rig.appearanceAssetKeys = appearanceAssetKeys;
  syncPaperDollAppearanceLayers(rig.appearanceLayers, rig.parts.head, appearanceAssetKeys, rig.bodyPresetKey);

  if (rig.shadow) {
    rig.shadow.appearanceAssetKeys = appearanceAssetKeys;
    syncPaperDollAppearanceLayers(rig.shadow.appearanceLayers, rig.shadow.parts.head, appearanceAssetKeys, rig.shadow.bodyPresetKey);
    tintPaperDollShadowObject(rig.shadow.root);
  }
}

function isPaperDollWeaponSlot(slotKey: PaperDollEquipmentSlotKey): boolean {
  return slotKey === "weaponMain" || slotKey === "weaponBow";
}

function applyPaperDollEquipmentStateTuning(
  rig: PaperDollRig,
  slotKeys?: readonly PaperDollEquipmentSlotKey[],
  equipmentOverride?: HeroEquipment,
): void {
  const activeDebugTuning = getActiveDebugTuning();
  const equipment = activeDebugTuning?.equipment ?? DEFAULT_EQUIPMENT;
  const equipmentItems = activeDebugTuning?.equipmentItems ?? DEFAULT_EQUIPMENT_ITEM_TUNING;
  const equipmentState = equipmentOverride ?? (rig.usesPlayerEquipment ? activePlayerEquipment : rig.equipmentState);

  applyPaperDollEquipmentTuning(rig.equipment, equipment, equipmentItems, equipmentState, slotKeys);
  const shadow = rig.shadow;

  if (shadow && shouldSyncPaperDollShadowEquipment(rig)) {
    applyPaperDollEquipmentTuning(shadow.equipment, equipment, equipmentItems, equipmentState, slotKeys);
  }
}

function applyPaperDollEquipmentTuning(
  equipmentParts: PaperDollEquipment,
  equipment: Record<EquipmentSlotKey, EquipmentTuning>,
  equipmentItems: Record<string, EquipmentTuning>,
  equipmentState?: HeroEquipment,
  slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS,
): void {
  slotKeys.forEach((slotKey) => {
    applyEquipmentTransform(equipmentParts[slotKey], getEquipmentTransformTuning(slotKey, equipment, equipmentItems, equipmentState));
  });
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

function syncFighterEquipmentVisibility(fighter: FighterVisual | undefined, slotKeys?: readonly PaperDollEquipmentSlotKey[]): void {
  syncPaperDollEquipmentVisibility(fighter?.paperDollRig, slotKeys);
}

function syncFighterPaperDollTextureResolution(fighter: FighterVisual | undefined): void {
  const rig = fighter?.paperDollRig;

  if (!rig) {
    return;
  }

  syncPaperDollBodyPartVisuals(rig);
  syncPaperDollFaceAssetLayers(rig.faceAssetLayers, rig.parts.head, rig.faceAssetKeys, rig.bodyPresetKey);
  syncPaperDollAppearanceLayers(rig.appearanceLayers, rig.parts.head, rig.appearanceAssetKeys, rig.bodyPresetKey);
  if (rig.shadow) {
    syncPaperDollBodyPartVisuals(rig.shadow);
    syncPaperDollFaceAssetLayers(rig.shadow.faceAssetLayers, rig.shadow.parts.head, rig.shadow.faceAssetKeys, rig.shadow.bodyPresetKey);
    syncPaperDollAppearanceLayers(rig.shadow.appearanceLayers, rig.shadow.parts.head, rig.shadow.appearanceAssetKeys, rig.shadow.bodyPresetKey);
  }
  syncPaperDollEquipmentVisibility(rig);
  if (rig.shadow) {
    tintPaperDollShadowObject(rig.shadow.root);
  }
}

function syncFighterBodyPreset(fighter: FighterVisual | undefined, presetKey: PaperDollBodyPreset = debugTuning.paperDollBodyPreset): void {
  const rig = fighter?.paperDollRig;

  if (!rig) {
    return;
  }

  const preset = getPaperDollBodyPreset(presetKey);

  syncPaperDollRigBodyPreset(rig, presetKey, preset);
  if (rig.shadow) {
    syncPaperDollRigBodyPreset(rig.shadow, presetKey, preset);
    tintPaperDollShadowObject(rig.shadow.root);
  }
}

function syncPaperDollRigBodyPreset(
  rig: Pick<
    PaperDollRig,
    | "parts"
    | "bodyPresetKey"
    | "headAssetKey"
    | "torsoAssetKey"
    | "bodyPartAssetKeys"
    | "faceOverlayMode"
    | "faceParts"
    | "faceAssetKeys"
    | "faceAssetLayers"
    | "appearanceAssetKeys"
    | "appearanceLayers"
  >,
  presetKey: PaperDollBodyPreset,
  preset: PaperDollBodyPresetDefinition,
): void {
  rig.bodyPresetKey = presetKey;
  rig.headAssetKey = preset.headAssetKey;
  rig.torsoAssetKey = preset.torsoAssetKey;
  rig.bodyPartAssetKeys = preset.bodyPartAssetKeys;
  rig.faceOverlayMode = preset.faceOverlayMode;
  rig.faceAssetKeys = preset.faceAssetKeys;
  syncPaperDollBodyPartVisuals(rig);
  syncPaperDollFaceOverlayVisibility(rig.faceParts, preset.faceOverlayMode !== "none");
  syncPaperDollFaceAssetLayers(rig.faceAssetLayers, rig.parts.head, preset.faceAssetKeys, presetKey);
  syncPaperDollAppearanceLayers(rig.appearanceLayers, rig.parts.head, rig.appearanceAssetKeys, presetKey);
}

function syncPaperDollBodyPartVisuals(rig: Pick<PaperDollRig, "parts" | "bodyPresetKey" | "headAssetKey" | "torsoAssetKey" | "bodyPartAssetKeys">): void {
  if (rig.headAssetKey) {
    syncPaperDollBodyPartImage(rig.parts.head, getActivePaperDollAssetKey(rig.headAssetKey), PAPER_DOLL_HEAD_ASSET_CONFIG, "head", rig.bodyPresetKey);
  }

  if (rig.torsoAssetKey) {
    syncPaperDollBodyPartImage(rig.parts.torso, getActivePaperDollAssetKey(rig.torsoAssetKey), PAPER_DOLL_TORSO_ASSET_CONFIG, "torso", rig.bodyPresetKey);
  }

  Object.entries(rig.bodyPartAssetKeys ?? DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS).forEach(([partKey, assetKey]) => {
    const config = PAPER_DOLL_PART_ASSET_CONFIGS[partKey as PaperDollPartKey];

    if (assetKey && config) {
      syncPaperDollBodyPartImage(
        rig.parts[partKey as PaperDollPartKey],
        getActivePaperDollAssetKey(assetKey),
        config,
        partKey as PaperDollPartKey,
        rig.bodyPresetKey,
      );
    }
  });
}

function syncPaperDollBodyPartImage(
  part: FighterPart | undefined,
  textureKey: string,
  config: PaperDollPartAssetConfig,
  partKey: PaperDollPartKey,
  bodyPresetKey?: PaperDollBodyPreset,
): void {
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

  applyPaperDollBodyPartImageConfig(image, config, partKey, bodyPresetKey);
}

function syncPaperDollFaceOverlayVisibility(faceParts: PaperDollFaceParts, visible: boolean): void {
  Object.values(faceParts).forEach((facePart) => setFighterPartVisible(facePart, visible));
}

function addPaperDollFaceAssetLayers(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  faceAssetLayers: PaperDollFaceAssetLayers,
  faceAssetKeys?: Partial<Record<FaceAssetLayerKey, string>>,
  bodyPresetKey?: PaperDollBodyPreset,
): void {
  syncPaperDollFaceAssetLayers(faceAssetLayers, part(partContainer), faceAssetKeys, bodyPresetKey, target);
}

function syncPaperDollFaceAssetLayers(
  faceAssetLayers: PaperDollFaceAssetLayers,
  headPart: FighterPart | undefined,
  faceAssetKeys?: Partial<Record<FaceAssetLayerKey, string>>,
  bodyPresetKey?: PaperDollBodyPreset,
  fallbackScene?: Phaser.Scene,
): void {
  const headContainer = headPart instanceof Phaser.GameObjects.Container ? headPart : undefined;

  if (!headContainer) {
    return;
  }

  const scene = fallbackScene ?? headContainer.scene;

  FACE_ASSET_LAYER_KEYS.forEach((layerKey) => {
    const assetKey = faceAssetKeys?.[layerKey];
    const layer = ensurePaperDollFaceAssetLayer(scene, headContainer, faceAssetLayers, layerKey);

    if (!assetKey) {
      setFighterPartVisible(layer, false);
      return;
    }

    const textureKey = getActivePaperDollAssetKey(assetKey);

    if (!scene.textures.exists(textureKey)) {
      setFighterPartVisible(layer, false);
      return;
    }

    syncPaperDollFaceAssetLayerImage(layer, textureKey, layerKey);
    applyFaceAssetLayerTransform(layer, getDebugBodyPresetTuning(bodyPresetKey).faceAssetLayers[layerKey]);
    setFighterPartVisible(layer, true);
  });
}

function ensurePaperDollFaceAssetLayer(
  target: Phaser.Scene,
  headContainer: Phaser.GameObjects.Container,
  faceAssetLayers: PaperDollFaceAssetLayers,
  layerKey: FaceAssetLayerKey,
): FighterPart {
  const existing = faceAssetLayers[layerKey];

  if (existing) {
    return existing;
  }

  const layerContainer = target.add.container(0, 0);
  const textureKey = getActivePaperDollAssetKey(PAPER_DOLL_BODY_PRESETS["dummy-v2"].faceAssetKeys?.[layerKey] ?? "");
  const image = target.add.image(0, 0, target.textures.exists(textureKey) ? textureKey : "__MISSING");

  applyPaperDollPartImageConfig(image, PAPER_DOLL_FACE_ASSET_CONFIGS[layerKey]);
  layerContainer.add(image);
  headContainer.add(layerContainer);

  const layer = part(layerContainer);

  faceAssetLayers[layerKey] = layer;
  return layer;
}

function syncPaperDollFaceAssetLayerImage(layer: FighterPart, textureKey: string, layerKey: FaceAssetLayerKey): void {
  const layerContainer = layer as Phaser.GameObjects.Container;
  const image = layerContainer.list.find((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image);

  if (!image) {
    return;
  }

  if (image.texture.key !== textureKey) {
    image.setTexture(textureKey);
  }

  applyPaperDollPartImageConfig(image, PAPER_DOLL_FACE_ASSET_CONFIGS[layerKey]);
}

function addPaperDollAppearanceLayers(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  appearanceLayers: PaperDollAppearanceLayers,
  appearanceAssetKeys?: Partial<Record<PaperDollAppearanceLayerKey, string>>,
  bodyPresetKey: PaperDollBodyPreset = debugTuning.paperDollBodyPreset,
): void {
  syncPaperDollAppearanceLayers(appearanceLayers, part(partContainer), appearanceAssetKeys, bodyPresetKey, target);
}

function syncPaperDollAppearanceLayers(
  appearanceLayers: PaperDollAppearanceLayers,
  headPart: FighterPart | undefined,
  appearanceAssetKeys?: Partial<Record<PaperDollAppearanceLayerKey, string>>,
  bodyPresetKey: PaperDollBodyPreset = debugTuning.paperDollBodyPreset,
  fallbackScene?: Phaser.Scene,
): void {
  const headContainer = headPart instanceof Phaser.GameObjects.Container ? headPart : undefined;

  if (!headContainer) {
    return;
  }

  const scene = fallbackScene ?? headContainer.scene;

  if (!shouldUsePaperDollAppearanceAssets(bodyPresetKey)) {
    Object.values(appearanceLayers).forEach((layer) => setFighterPartVisible(layer, false));
    return;
  }

  const appearanceLayerTuning = getDebugBodyPresetTuning(bodyPresetKey).appearanceLayers;

  APPEARANCE_LAYER_KEYS.forEach((layerKey) => {
    const assetKey = appearanceAssetKeys?.[layerKey];
    const layer = ensurePaperDollAppearanceLayer(scene, headContainer, appearanceLayers, layerKey);

    if (!assetKey) {
      setFighterPartVisible(layer, false);
      return;
    }

    const textureKey = getActivePaperDollAssetKey(assetKey);

    if (!scene.textures.exists(textureKey)) {
      setFighterPartVisible(layer, false);
      return;
    }

    syncPaperDollAppearanceLayerImage(layer, textureKey, layerKey);
    applyAppearanceLayerTransform(layer, appearanceLayerTuning[layerKey] ?? DEFAULT_APPEARANCE_LAYERS[layerKey]);
    setFighterPartVisible(layer, true);
  });
}

function ensurePaperDollAppearanceLayer(
  target: Phaser.Scene,
  headContainer: Phaser.GameObjects.Container,
  appearanceLayers: PaperDollAppearanceLayers,
  layerKey: PaperDollAppearanceLayerKey,
): FighterPart {
  const existing = appearanceLayers[layerKey];

  if (existing) {
    return existing;
  }

  const layerContainer = target.add.container(0, 0);
  const image = target.add.image(0, 0, "__MISSING");

  applyPaperDollPartImageConfig(image, PAPER_DOLL_APPEARANCE_ASSET_CONFIGS[layerKey]);
  layerContainer.add(image);
  headContainer.add(layerContainer);

  const layer = part(layerContainer);

  appearanceLayers[layerKey] = layer;
  return layer;
}

function syncPaperDollAppearanceLayerImage(layer: FighterPart, textureKey: string, layerKey: PaperDollAppearanceLayerKey): void {
  const layerContainer = layer as Phaser.GameObjects.Container;
  const image = layerContainer.list.find((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image);

  if (!image) {
    return;
  }

  if (image.texture.key !== textureKey) {
    image.setTexture(textureKey);
  }

  applyPaperDollPartImageConfig(image, PAPER_DOLL_APPEARANCE_ASSET_CONFIGS[layerKey]);
}

function applyAppearanceLayerTransform(layer: FighterPart, tuning: AppearanceLayerTuning): void {
  layer.x = tuning.x;
  layer.y = tuning.y;
  layer.angle = tuning.angle;
  layer.scaleX = tuning.scaleX;
  layer.scaleY = tuning.scaleY;
}

function applyFaceAssetLayerTransform(layer: FighterPart, tuning: FaceAssetLayerTuning): void {
  layer.x = tuning.x;
  layer.y = tuning.y;
  layer.angle = tuning.angle;
  layer.scaleX = tuning.scaleX;
  layer.scaleY = tuning.scaleY;
}

function syncPaperDollEquipmentVisibility(
  rig: PaperDollRig | undefined,
  slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS,
  equipmentOverride?: HeroEquipment,
): void {
  if (!rig) {
    return;
  }

  const shouldSyncShadowEquipment = shouldSyncPaperDollShadowEquipment(rig);

  syncPaperDollEquipmentVisuals(rig, slotKeys, equipmentOverride);
  const shadow = rig.shadow;
  const preferredWeaponSlot = getPreferredPaperDollWeaponSlot(slotKeys, equipmentOverride);
  const visibilitySlotKeys = getPaperDollEquipmentVisibilitySlotKeys(slotKeys, preferredWeaponSlot);

  if (shouldSyncShadowEquipment && shadow) {
    tintPaperDollShadowObject(shadow.root);
  }

  const visibility = equipmentOverride
    ? createPlayerEquipmentVisibility(equipmentOverride, preferredWeaponSlot)
    : rig.usesPlayerEquipment
      ? createPlayerEquipmentVisibility()
      : rig.equipmentState
        ? createPlayerEquipmentVisibility(rig.equipmentState)
        : undefined;

  if (!visibility) {
    if (shouldSyncShadowEquipment) {
      syncPaperDollShadowSilhouette(rig.shadow);
    }
    return;
  }

  visibilitySlotKeys.forEach((slotKey) => {
    setPaperDollEquipmentSlotVisible(rig.equipment[slotKey], visibility[slotKey]);
  });
  if (shouldSyncShadowEquipment) {
    syncPaperDollShadowSilhouette(shadow, visibility, visibilitySlotKeys);
  }
  syncPaperDollWeaponEnchantments(rig, visibilitySlotKeys, equipmentOverride);
}

function syncPaperDollWeaponEnchantments(
  rig: PaperDollRig | undefined,
  slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS,
  equipmentOverride?: HeroEquipment,
  enchantmentsOverride?: HeroWeaponEnchantments,
): void {
  if (!rig) {
    return;
  }

  const equipment = equipmentOverride ?? (rig.usesPlayerEquipment ? activePlayerEquipment : rig.equipmentState);
  const enchantments = enchantmentsOverride ?? (rig.usesPlayerEquipment ? activePlayerWeaponEnchantments : rig.weaponEnchantmentsState);

  if (!equipment) {
    return;
  }

  slotKeys.forEach((slotKey) => {
    if (slotKey !== "weaponMain") {
      return;
    }

    syncPaperDollWeaponSlotGlow(rig.equipment[slotKey], slotKey, equipment, enchantments);
    getLinkedPaperDollEquipmentSlots(rig.equipment[slotKey]).forEach((linkedSlot) => {
      syncPaperDollWeaponSlotGlow(linkedSlot, slotKey, equipment, enchantments);
    });
  });
}

function syncPaperDollWeaponSlotGlow(
  slot: FighterPart | undefined,
  slotKey: PaperDollEquipmentSlotKey,
  equipment: HeroEquipment,
  enchantments?: HeroWeaponEnchantments,
): void {
  if (!slot || slotKey !== "weaponMain") {
    return;
  }

  const itemId = equipment[slotKey];
  const sharpeningLevel = getHeroWeaponSharpeningLevel(enchantments, itemId);
  const image = getPaperDollEquipmentSlotImage(slot);
  const glow = getOrCreatePaperDollWeaponGlowImage(slot, image);

  if (!image || !glow || sharpeningLevel <= 0) {
    glow?.setVisible(false);
    return;
  }

  const textureKey = image.texture.key;
  const tuning = getWeaponEnchantGlowTuning();

  if (glow.texture.key !== textureKey || glow.frame.name !== image.frame.name) {
    glow.setTexture(textureKey, image.frame.name);
  }
  glow.setPosition(image.x + tuning.offsetX, image.y + tuning.offsetY);
  glow.setOrigin(tuning.originX, tuning.originY);
  glow.setScale(image.scaleX * tuning.scale, image.scaleY * tuning.scale);
  glow.setAngle(image.angle);
  glow.setTint(tuning.color);
  glow.setAlpha(tuning.alpha);
  glow.setBlendMode(getWeaponEnchantGlowBlendMode(tuning));
  syncPaperDollWeaponGlowLayer(slot as Phaser.GameObjects.Container, glow, tuning.layer);
  applyPaperDollWeaponGlowBlur(glow, tuning);
  if (paperDollWeaponOverlayCrops.has(slot)) {
    applyPaperDollWeaponTopOverlayCrop(glow, getPaperDollWeaponOverlayCrop(slot, textureKey));
  }
  glow.setVisible(true);
}

function getWeaponEnchantGlowTuning(): WeaponEnchantGlowTuning {
  return debugTuning.weaponEnchantGlow[debugTuning.selectedWeaponEnchantGlowElement];
}

function getWeaponEnchantGlowBlendMode(tuning: WeaponEnchantGlowTuning): number {
  return tuning.blendMode === "normal" ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD;
}

function syncPaperDollWeaponGlowLayer(
  slotContainer: Phaser.GameObjects.Container,
  glow: Phaser.GameObjects.Image,
  layer: WeaponEnchantGlowTuning["layer"],
): void {
  if (layer === "behind") {
    slotContainer.sendToBack(glow);
    return;
  }

  slotContainer.bringToTop(glow);
}

function applyPaperDollWeaponGlowBlur(glow: Phaser.GameObjects.Image, tuning: WeaponEnchantGlowTuning): void {
  const target = glow as RenderFilterTarget;
  const currentFilter = paperDollWeaponGlowBlurFilters.get(glow);

  if (tuning.blur <= 0 || tuning.blurStrength <= 0) {
    const filters = target.filters?.internal;

    if (currentFilter && filters) {
      filters.remove(currentFilter, true);
    } else {
      currentFilter?.destroy();
    }

    paperDollWeaponGlowBlurFilters.delete(glow);
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
    currentFilter.quality = WEAPON_ENCHANTMENT_GLOW_BLUR_QUALITY;
    currentFilter.x = tuning.blur;
    currentFilter.y = tuning.blur;
    currentFilter.strength = tuning.blurStrength;
    currentFilter.color = tuning.color;
    currentFilter.steps = WEAPON_ENCHANTMENT_GLOW_BLUR_STEPS;
    return;
  }

  const nextFilter = filters.addBlur(
    WEAPON_ENCHANTMENT_GLOW_BLUR_QUALITY,
    tuning.blur,
    tuning.blur,
    tuning.blurStrength,
    tuning.color,
    WEAPON_ENCHANTMENT_GLOW_BLUR_STEPS,
  );

  paperDollWeaponGlowBlurFilters.set(glow, nextFilter);
}

function getOrCreatePaperDollWeaponGlowImage(
  slot: FighterPart,
  sourceImage: Phaser.GameObjects.Image | undefined,
): Phaser.GameObjects.Image | undefined {
  let glow = paperDollWeaponGlowImages.get(slot);

  if (glow || !sourceImage) {
    return glow;
  }

  const slotContainer = slot as Phaser.GameObjects.Container;

  glow = slotContainer.scene.add.image(sourceImage.x, sourceImage.y, sourceImage.texture.key, sourceImage.frame.name);
  glow.setOrigin(sourceImage.originX, sourceImage.originY);
  glow.setVisible(false);
  slotContainer.add(glow);
  paperDollWeaponGlowImages.set(slot, glow);

  return glow;
}

function getPreferredPaperDollWeaponSlot(
  slotKeys: readonly PaperDollEquipmentSlotKey[],
  equipmentOverride?: HeroEquipment,
): PaperDollWeaponSlotKey | undefined {
  if (!equipmentOverride) {
    return undefined;
  }

  if (slotKeys.includes("weaponBow") && equipmentOverride.weaponBow) {
    return "weaponBow";
  }

  if (slotKeys.includes("weaponMain") && equipmentOverride.weaponMain) {
    return "weaponMain";
  }

  return undefined;
}

function getPaperDollEquipmentVisibilitySlotKeys(
  slotKeys: readonly PaperDollEquipmentSlotKey[],
  preferredWeaponSlot?: PaperDollWeaponSlotKey,
): readonly PaperDollEquipmentSlotKey[] {
  if (!preferredWeaponSlot && !slotKeys.some(isPaperDollWeaponSlot)) {
    return slotKeys;
  }

  return [...new Set<PaperDollEquipmentSlotKey>([...slotKeys, "weaponMain", "weaponBow"])];
}

function shouldSyncPaperDollShadowEquipment(rig: PaperDollRig): boolean {
  return Boolean(rig.shadow?.root.visible);
}

function syncPaperDollShadowSilhouette(
  shadow: PaperDollShadowRig | undefined,
  visibility?: Record<PaperDollEquipmentSlotKey, boolean>,
  slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS,
): void {
  if (!shadow) {
    return;
  }

  Object.values(shadow.faceParts).forEach((facePart) => setFighterPartVisible(facePart, false));
  Object.values(shadow.faceAssetLayers).forEach((faceLayer) => setFighterPartVisible(faceLayer, false));
  slotKeys.forEach((slotKey) => {
    const slotVisible = isPaperDollWeaponSlot(slotKey) && Boolean(visibility?.[slotKey]);

    setFighterPartVisible(shadow.equipment[slotKey], slotVisible);
    getLinkedPaperDollEquipmentSlots(shadow.equipment[slotKey]).forEach((slot) => setFighterPartVisible(slot, false));
  });
}

function setPaperDollEquipmentSlotVisible(slot: FighterPart | undefined, visible: boolean): void {
  setFighterPartVisible(slot, visible);
  getLinkedPaperDollEquipmentSlots(slot).forEach((linkedSlot) => setFighterPartVisible(linkedSlot, visible && isPaperDollWeaponOverlayVisible(linkedSlot)));
}

function syncPaperDollArmorAlpha(rig: PaperDollRig | undefined, alpha: number): void {
  if (!rig) {
    return;
  }

  PAPER_DOLL_DRAGGABLE_ARMOR_SLOT_KEYS.forEach((slotKey) => setPaperDollEquipmentSlotAlpha(rig.equipment[slotKey], alpha));
}

function setPaperDollEquipmentSlotAlpha(slot: FighterPart | undefined, alpha: number): void {
  slot?.setAlpha(alpha);
  getLinkedPaperDollEquipmentSlots(slot).forEach((linkedSlot) => linkedSlot.setAlpha(alpha));
}

function setFighterPartVisible(part: FighterPart | undefined, visible: boolean): void {
  if (part && part.visible !== visible) {
    part.setVisible(visible);
  }
}

function syncPaperDollEquipmentVisuals(
  rig: PaperDollRig,
  slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS,
  equipmentOverride?: HeroEquipment,
): void {
  const equipmentState = equipmentOverride ?? (rig.usesPlayerEquipment ? activePlayerEquipment : rig.equipmentState);
  if (!equipmentState) {
    return;
  }

  const shouldSyncShadowEquipment = shouldSyncPaperDollShadowEquipment(rig);

  slotKeys.forEach((slotKey) => {
    const textureKey = getPlayerEquipmentSlotAssetKey(equipmentState, slotKey);

    syncPaperDollEquipmentSlot(rig.equipment[slotKey], slotKey, textureKey);
    if (shouldSyncShadowEquipment) {
      syncPaperDollEquipmentSlot(rig.shadow?.equipment[slotKey], slotKey, textureKey);
    }
  });
}

function syncPaperDollEquipmentSlot(slot: FighterPart | undefined, slotKey: PaperDollEquipmentSlotKey, textureKey: string | undefined): void {
  if (!slot || !textureKey) {
    return;
  }

  syncSinglePaperDollEquipmentSlot(slot, slotKey, textureKey);
  getLinkedPaperDollEquipmentSlots(slot).forEach((linkedSlot) => {
    const image = syncSinglePaperDollEquipmentSlot(linkedSlot, slotKey, textureKey);

    if (isPaperDollWeaponSlot(slotKey) && image) {
      applyPaperDollWeaponTopOverlayCrop(image, getPaperDollWeaponOverlayCrop(linkedSlot, textureKey));
      setFighterPartVisible(linkedSlot, isPaperDollEquipmentSlotVisible(slot) && isPaperDollWeaponOverlayVisible(linkedSlot));
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

  const slotContainer = getPaperDollEquipmentSlotContainer(slot);
  if (!slotContainer) {
    return undefined;
  }

  const config = paperDollEquipmentSlotConfigs.get(slot) ?? PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS[slotKey];
  let image = getPaperDollEquipmentSlotImage(slot);

  if (!slotContainer.scene.textures.exists(textureKey)) {
    return undefined;
  }

  const nextState = createPaperDollEquipmentSlotImageState(textureKey, config);
  const previousState = paperDollEquipmentSlotImageStates.get(slot);

  if (image && previousState && image.texture.key === textureKey && arePaperDollEquipmentSlotImageStatesEqual(previousState, nextState)) {
    return image;
  }

  if (!image) {
    image = createPaperDollEquipmentImage(slotContainer.scene, textureKey, config);
    slotContainer.add(image);
    paperDollEquipmentSlotImageStates.set(slot, nextState);
    return image;
  }

  if (image.texture.key !== textureKey) {
    image.setTexture(textureKey);
  }

  applyPaperDollEquipmentImageConfig(image, config);
  paperDollEquipmentSlotImageStates.set(slot, nextState);

  return image;
}

function createPaperDollEquipmentSlotImageState(textureKey: string, config: PaperDollPartAssetConfig): PaperDollEquipmentSlotImageState {
  return {
    textureKey,
    displayHeight: config.displayHeight,
    localX: config.localX,
    localY: config.localY,
    originX: config.originX,
    originY: config.originY,
  };
}

function arePaperDollEquipmentSlotImageStatesEqual(
  previousState: PaperDollEquipmentSlotImageState,
  nextState: PaperDollEquipmentSlotImageState,
): boolean {
  return previousState.textureKey === nextState.textureKey
    && previousState.displayHeight === nextState.displayHeight
    && previousState.localX === nextState.localX
    && previousState.localY === nextState.localY
    && previousState.originX === nextState.originX
    && previousState.originY === nextState.originY;
}

function getFighterBodyIdleAnimation(fighter: FighterVisual): BodyAnimationTuning {
  return getActiveBodyAnimation(fighter.bodyIdleAnimationKey ?? "idle", fighter.paperDollRig?.bodyPresetKey);
}

function resetFighterBodyIdleAnimation(fighter: FighterVisual, startedAt = 0): void {
  setFighterBodyIdleAnimation(fighter, "idle", startedAt);
}

function resetActiveTurnBodyIdleAnimation(
  visuals: ArenaVisuals,
  previousState: CombatState | undefined,
  currentState: CombatState,
  startedAt = 0,
): void {
  if (currentState.result !== "playing" || previousState?.activeTurn === currentState.activeTurn) {
    return;
  }

  if (currentState.activeTurn === "player") {
    [visuals.helper, visuals.enemy].forEach((fighter) => {
      if (fighter?.bodyIdleAnimationKey === "rest") {
        resetFighterBodyIdleAnimation(fighter, startedAt);
      }
    });
    return;
  }

  if (visuals.player.bodyIdleAnimationKey === "rest") {
    resetFighterBodyIdleAnimation(visuals.player, startedAt);
  }
}

function setFighterBodyIdleAnimation(fighter: FighterVisual, animationKey: BodyAnimationKey, startedAt = 0): void {
  fighter.bodyIdleAnimationKey = animationKey;
  fighter.bodyIdleAnimationStartedAt = startedAt;
  fighter.restZzzNextSpawnAt = animationKey === "rest" ? startedAt : undefined;
  fighter.restZzzSpawnIndex = 0;
}

function applyLoopingBodyAnimation(fighter: FighterVisual, time: number, animation: BodyAnimationTuning, amount = 1): void {
  if (fighter.isShattered) {
    return;
  }

  if (!animation.enabled) {
    return;
  }

  if ((fighter.bodyAnimationLockedUntil ?? 0) > time) {
    return;
  }

  applyBodyAnimation(fighter, time - (fighter.bodyIdleAnimationStartedAt ?? 0), animation, amount);
}

function applyBodyAnimation(fighter: FighterVisual, time: number, animation: BodyAnimationTuning, amount = 1): void {
  const duration = Math.max(1, animation.duration);
  const phase = (time % duration) / duration;

  applyBodyAnimationAtProgress(fighter, animation, phase, amount);
}

function applyBodyAnimationAtProgress(fighter: FighterVisual, animation: BodyAnimationTuning, progress: number, amount = 1): void {
  if (applyBodyAnimationKeyframesAtProgress(fighter, animation, progress, amount)) {
    return;
  }

  applyBodyAnimationBlend(fighter, animation, getBodyAnimationYoyoBlend(progress, amount));
}

function getBodyAnimationYoyoBlend(progress: number, amount = 1): number {
  const phase = ((progress % 1) + 1) % 1;

  return (0.5 - Math.cos(phase * Math.PI * 2) * 0.5) * amount;
}

function applyBodyAnimationBlend(fighter: FighterVisual, animation: BodyAnimationTuning, blend: number): void {
  applyBodyAnimationPoseBlend(fighter, animation, animation.base, animation.breath, animation.faceBase, animation.faceBreath, blend);
  applyBodyAnimationRootOffset(fighter, defaultBodyAnimationRootOffset);
  applyBodyAnimationWeaponMirrors(fighter, false, false);
  applyBodyAnimationCastProp(fighter);
}

function applyBodyAnimationKeyframesAtProgress(fighter: FighterVisual, animation: BodyAnimationTuning, progress: number, amount: number): boolean {
  const keyframes = getBodyAnimationTimelineKeyframes(animation);

  if (!keyframes) {
    return false;
  }

  const baseKeyframe = keyframes[0];
  const sampledPose = sampleBodyAnimationKeyframePose(keyframes, Math.max(1, animation.duration), progress);

  if (!baseKeyframe || !sampledPose) {
    return false;
  }

  applyBodyAnimationPoseBlend(fighter, animation, baseKeyframe.rigParts, sampledPose.rigParts, baseKeyframe.faceParts, sampledPose.faceParts, amount);
  applyBodyAnimationRootOffsetBlend(fighter, baseKeyframe.rootOffset, sampledPose.rootOffset, amount);
  applyBodyAnimationWeaponMirrors(fighter, sampledPose.weaponMirrorX ?? false, sampledPose.weaponMirrorY ?? false);
  applyBodyAnimationCastProp(fighter, sampledPose.castProp);

  return true;
}

function getBodyAnimationTimelineKeyframes(animation: BodyAnimationTuning): BodyAnimationKeyframe[] | undefined {
  const duration = Math.max(1, animation.duration);
  const keyframes = animation.keyframes;

  if (!keyframes || keyframes.length < 2) {
    return undefined;
  }

  return keyframes
    .map((keyframe) => ({
      ...keyframe,
      time: clampNumber(Number.isFinite(keyframe.time) ? keyframe.time : 0, 0, duration),
    }))
    .sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
}

interface SampledBodyAnimationPose {
  rigParts: Record<RigPartKey, RigPartTuning>;
  faceParts: Record<FacePartKey, FacePartTuning>;
  rootOffset: BodyAnimationRootOffset;
  weaponMirrorX?: boolean;
  weaponMirrorY?: boolean;
  castProp?: BodyAnimationCastPropTuning;
}

function sampleBodyAnimationKeyframePose(
  keyframes: readonly BodyAnimationKeyframe[],
  duration: number,
  progress: number,
): SampledBodyAnimationPose | undefined {
  const firstKeyframe = keyframes[0];

  if (!firstKeyframe) {
    return undefined;
  }

  const timelineTime = (((progress % 1) + 1) % 1) * duration;

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const from = keyframes[index];
    const to = keyframes[index + 1];

    if (!from || !to || timelineTime < from.time || timelineTime > to.time) {
      continue;
    }

    return interpolateBodyAnimationKeyframes(from, to, getBodyAnimationKeyframeSegmentBlend(from, timelineTime - from.time, to.time - from.time));
  }

  const lastKeyframe = keyframes[keyframes.length - 1];

  if (!lastKeyframe) {
    return undefined;
  }

  const wrappedTimelineTime = timelineTime < firstKeyframe.time ? timelineTime + duration : timelineTime;
  const wrappedDuration = firstKeyframe.time + duration - lastKeyframe.time;

  return interpolateBodyAnimationKeyframes(
    lastKeyframe,
    firstKeyframe,
    getBodyAnimationKeyframeSegmentBlend(lastKeyframe, wrappedTimelineTime - lastKeyframe.time, wrappedDuration),
  );
}

function getBodyAnimationKeyframeSegmentBlend(keyframe: BodyAnimationKeyframe, elapsed: number, duration: number): number {
  if (keyframe.easing === "hold") {
    return 0;
  }

  const linearBlend = clampNumber(duration <= 0 ? 0 : elapsed / duration, 0, 1);

  if (keyframe.easing === "linear") {
    return linearBlend;
  }

  return 0.5 - Math.cos(linearBlend * Math.PI) * 0.5;
}

function interpolateBodyAnimationKeyframes(from: BodyAnimationKeyframe, to: BodyAnimationKeyframe, blend: number): SampledBodyAnimationPose {
  return {
    rigParts: Object.fromEntries(
      RIG_PART_KEYS.map((key) => [
        key,
        interpolateRigPartTuning(from.rigParts[key] ?? defaultRigPartTuning, to.rigParts[key] ?? defaultRigPartTuning, blend),
      ]),
    ) as Record<RigPartKey, RigPartTuning>,
    faceParts: {
      eyeLeft: interpolateFacePartTuning(from.faceParts.eyeLeft ?? DEFAULT_FACE_PARTS.eyeLeft, to.faceParts.eyeLeft ?? DEFAULT_FACE_PARTS.eyeLeft, blend),
      eyeRight: interpolateFacePartTuning(from.faceParts.eyeRight ?? DEFAULT_FACE_PARTS.eyeRight, to.faceParts.eyeRight ?? DEFAULT_FACE_PARTS.eyeRight, blend),
    },
    rootOffset: interpolateBodyAnimationRootOffset(from.rootOffset ?? defaultBodyAnimationRootOffset, to.rootOffset ?? defaultBodyAnimationRootOffset, blend),
    weaponMirrorX: blend < 0.5 ? from.weaponMirrorX : to.weaponMirrorX,
    weaponMirrorY: blend < 0.5 ? from.weaponMirrorY : to.weaponMirrorY,
    castProp: interpolateBodyAnimationCastProp(from.castProp, to.castProp, blend),
  };
}

function interpolateBodyAnimationCastProp(
  from: BodyAnimationCastPropTuning | undefined,
  to: BodyAnimationCastPropTuning | undefined,
  blend: number,
): BodyAnimationCastPropTuning | undefined {
  if (!from && !to) {
    return undefined;
  }

  const fromProp = from ?? defaultBodyAnimationCastProp;
  const toProp = to ?? defaultBodyAnimationCastProp;
  const pickedProp = blend < 0.5 ? fromProp : toProp;

  return {
    visible: pickedProp.visible,
    assetKey: pickedProp.assetKey,
    x: lerp(fromProp.x, toProp.x, blend),
    y: lerp(fromProp.y, toProp.y, blend),
    angle: lerp(fromProp.angle, toProp.angle, blend),
    scaleX: lerp(fromProp.scaleX, toProp.scaleX, blend),
    scaleY: lerp(fromProp.scaleY, toProp.scaleY, blend),
    flipX: pickedProp.flipX,
    flipY: pickedProp.flipY,
  };
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

function interpolateBodyAnimationRootOffset(from: BodyAnimationRootOffset, to: BodyAnimationRootOffset, blend: number): BodyAnimationRootOffset {
  return {
    x: lerp(from.x, to.x, blend),
    y: lerp(from.y, to.y, blend),
  };
}

function applyBodyAnimationPoseBlend(
  fighter: FighterVisual,
  animation: BodyAnimationTuning,
  fromRigParts: Record<RigPartKey, RigPartTuning>,
  toRigParts: Record<RigPartKey, RigPartTuning>,
  fromFaceParts: Record<"eyeLeft" | "eyeRight", FacePartTuning>,
  toFaceParts: Record<"eyeLeft" | "eyeRight", FacePartTuning>,
  blend: number,
): void {
  if (fighter.isShattered) {
    return;
  }

  const rig = fighter.paperDollRig;

  if (!rig) {
    return;
  }

  for (const key of RIG_PART_KEYS) {
    if (!animation.activeParts[key]) {
      continue;
    }

    const part = rig.parts[key];
    const shadowPart = rig.shadow?.parts[key];
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const base = fromRigParts[key] ?? defaultRigPartTuning;
    const breath = toRigParts[key] ?? defaultRigPartTuning;

    applyRigPartTransformBlend(part, pivot, base, breath, blend);
    if (shadowPart) {
      applyRigPartTransformBlend(shadowPart, pivot, base, breath, blend);
    }
  }

  syncPaperDollEquipmentAnchors(rig);
  if (rig.shadow) {
    syncPaperDollEquipmentAnchors(rig.shadow);
  }

  applyFacePartTransformBlend(
    rig.faceParts.eyeLeft,
    HEAD_FACE_LEFT_EYE_X,
    HEAD_FACE_EYE_Y,
    fromFaceParts.eyeLeft,
    toFaceParts.eyeLeft,
    blend,
  );
  applyFacePartTransformBlend(
    rig.faceParts.eyeRight,
    HEAD_FACE_RIGHT_EYE_X,
    HEAD_FACE_EYE_Y,
    fromFaceParts.eyeRight,
    toFaceParts.eyeRight,
    blend,
  );
  applyFacePartTransformBlend(
    rig.shadow?.faceParts.eyeLeft,
    HEAD_FACE_LEFT_EYE_X,
    HEAD_FACE_EYE_Y,
    fromFaceParts.eyeLeft,
    toFaceParts.eyeLeft,
    blend,
  );
  applyFacePartTransformBlend(
    rig.shadow?.faceParts.eyeRight,
    HEAD_FACE_RIGHT_EYE_X,
    HEAD_FACE_EYE_Y,
    fromFaceParts.eyeRight,
    toFaceParts.eyeRight,
    blend,
  );
}

function rememberPaperDollAnimationRootBase(fighter: FighterVisual): void {
  paperDollAnimationRootBases.set(fighter, {
    rootX: fighter.body.x,
    rootY: fighter.body.y,
    shadowX: fighter.shadow.x,
    shadowY: fighter.shadow.y,
    lowShadowX: fighter.lowShadow.x,
    lowShadowY: fighter.lowShadow.y,
    nameX: fighter.name.x,
    nameY: fighter.name.y,
    worldOffsetX: 0,
    worldOffsetY: 0,
  });
}

function getPaperDollAnimationRootBase(fighter: FighterVisual): PaperDollAnimationRootBase {
  const base = paperDollAnimationRootBases.get(fighter);

  if (base) {
    return base;
  }

  rememberPaperDollAnimationRootBase(fighter);

  return paperDollAnimationRootBases.get(fighter) ?? {
    rootX: fighter.body.x,
    rootY: fighter.body.y,
    shadowX: fighter.shadow.x,
    shadowY: fighter.shadow.y,
    lowShadowX: fighter.lowShadow.x,
    lowShadowY: fighter.lowShadow.y,
    nameX: fighter.name.x,
    nameY: fighter.name.y,
    worldOffsetX: 0,
    worldOffsetY: 0,
  };
}

function applyBodyAnimationRootOffsetBlend(
  fighter: FighterVisual,
  from: BodyAnimationRootOffset | undefined,
  to: BodyAnimationRootOffset | undefined,
  blend: number,
): void {
  applyBodyAnimationRootOffset(
    fighter,
    interpolateBodyAnimationRootOffset(from ?? defaultBodyAnimationRootOffset, to ?? defaultBodyAnimationRootOffset, blend),
  );
}

function applyBodyAnimationRootOffset(fighter: FighterVisual, rootOffset: BodyAnimationRootOffset): void {
  const rig = fighter.paperDollRig;

  if (!rig) {
    return;
  }

  const base = getPaperDollAnimationRootBase(fighter);
  const scaleX = rig.root.scaleX === 0 ? 1 : rig.root.scaleX;
  const scaleY = rig.root.scaleY === 0 ? 1 : rig.root.scaleY;
  const worldOffsetX = rootOffset.x * scaleX;
  const worldOffsetY = rootOffset.y * scaleY;

  base.rootX = fighter.body.x - base.worldOffsetX;
  base.rootY = fighter.body.y - base.worldOffsetY;
  base.shadowX = fighter.shadow.x - base.worldOffsetX;
  base.shadowY = fighter.shadow.y - base.worldOffsetY;
  base.lowShadowX = fighter.lowShadow.x - base.worldOffsetX;
  base.lowShadowY = fighter.lowShadow.y - base.worldOffsetY;
  base.nameX = fighter.name.x - base.worldOffsetX;
  base.nameY = fighter.name.y - base.worldOffsetY;
  base.worldOffsetX = worldOffsetX;
  base.worldOffsetY = worldOffsetY;

  rig.root.x = base.rootX + worldOffsetX;
  rig.root.y = base.rootY + worldOffsetY;
  fighter.shadow.x = base.shadowX + worldOffsetX;
  fighter.shadow.y = base.shadowY + worldOffsetY;
  fighter.lowShadow.x = base.lowShadowX + worldOffsetX;
  fighter.lowShadow.y = base.lowShadowY + worldOffsetY;
  fighter.name.x = base.nameX + worldOffsetX;
  fighter.name.y = base.nameY + worldOffsetY;
}

function applyBodyAnimationCastProp(fighter: FighterVisual, tuning?: BodyAnimationCastPropTuning): void {
  const prop = fighter.paperDollRig?.castProp;

  if (!prop) {
    return;
  }

  if (!tuning?.visible) {
    setFighterPartVisible(prop, false);
    return;
  }

  const textureKey = fighter.scrollCastPropAssetKey ?? tuning.assetKey ?? DEFAULT_SCROLL_CAST_PROP_ASSET_KEY;

  if (!prop.scene.textures.exists(textureKey)) {
    setFighterPartVisible(prop, false);
    return;
  }

  if (prop instanceof Phaser.GameObjects.Image && prop.texture.key !== textureKey) {
    prop.setTexture(textureKey);
  }

  prop.x = tuning.x;
  prop.y = tuning.y;
  prop.angle = tuning.angle;
  prop.scaleX = tuning.scaleX * (tuning.flipX ? -1 : 1);
  prop.scaleY = tuning.scaleY * (tuning.flipY ? -1 : 1);
  setFighterPartVisible(prop, true);
}

function applyRigPartTransform(part: FighterPart, pivot: { x: number; y: number }, tuning: RigPartTuning): void {
  part.x = pivot.x + tuning.x;
  part.y = pivot.y + tuning.y;
  part.angle = tuning.angle;
  part.scaleX = tuning.scaleX * (tuning.flipX ? -1 : 1);
  part.scaleY = tuning.scaleY * (tuning.flipY ? -1 : 1);
}

function applyRigPartTransformBlend(part: FighterPart, pivot: { x: number; y: number }, from: RigPartTuning, to: RigPartTuning, blend: number): void {
  const flipX = blend < 0.5 ? from.flipX : to.flipX;
  const flipY = blend < 0.5 ? from.flipY : to.flipY;

  part.x = pivot.x + lerp(from.x, to.x, blend);
  part.y = pivot.y + lerp(from.y, to.y, blend);
  part.angle = lerp(from.angle, to.angle, blend);
  part.scaleX = lerp(from.scaleX, to.scaleX, blend) * (flipX ? -1 : 1);
  part.scaleY = lerp(from.scaleY, to.scaleY, blend) * (flipY ? -1 : 1);
}

function syncPaperDollEquipmentAnchors(rig: Pick<PaperDollRig, "parts" | "equipmentAnchors">): void {
  for (const slotKey of PAPER_DOLL_EQUIPMENT_SLOT_KEYS) {
    const anchor = rig.equipmentAnchors[slotKey];

    if (!anchor) {
      continue;
    }

    syncPaperDollEquipmentAnchor(anchor, rig.parts[PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS[slotKey]]);
    const linkedAnchors = paperDollLinkedEquipmentAnchors.get(anchor);

    if (!linkedAnchors) {
      continue;
    }

    const sourcePart = rig.parts[PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS[slotKey]];

    for (const linkedAnchor of linkedAnchors) {
      syncPaperDollEquipmentAnchor(linkedAnchor, sourcePart);
    }
  }
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

function applyFacePartTransformBlend(
  part: FighterPart | undefined,
  baseX: number,
  baseY: number,
  from: FacePartTuning,
  to: FacePartTuning,
  blend: number,
): void {
  if (!part) {
    return;
  }

  part.x = baseX + lerp(from.x, to.x, blend);
  part.y = baseY + lerp(from.y, to.y, blend);
  part.scaleX = lerp(from.scaleX, to.scaleX, blend);
  part.scaleY = lerp(from.scaleY, to.scaleY, blend);
}

function applyEquipmentTransform(part: FighterPart | undefined, tuning: EquipmentTuning): void {
  if (!part) {
    return;
  }

  applySingleEquipmentTransform(part, tuning);
  getLinkedPaperDollEquipmentSlots(part).forEach((linkedPart) => applySingleEquipmentTransform(linkedPart, tuning));
}

function applySingleEquipmentTransform(part: FighterPart, tuning: EquipmentTuning): void {
  const nextState = createPaperDollEquipmentTransformState(tuning);
  const previousState = paperDollEquipmentTransformStates.get(part);

  if (previousState && arePaperDollEquipmentTransformStatesEqual(previousState, nextState)) {
    if (
      part.x === nextState.x
      && part.y === nextState.y
      && part.angle === nextState.angle
      && part.scaleX === nextState.scaleX
      && part.scaleY === nextState.scaleY
    ) {
      return;
    }
  }

  part.x = nextState.x;
  part.y = nextState.y;
  part.angle = nextState.angle;
  part.scaleX = nextState.scaleX;
  part.scaleY = nextState.scaleY;
  paperDollEquipmentTransformStates.set(part, nextState);
}

function applyBodyAnimationWeaponMirrors(fighter: FighterVisual, mirrorX: boolean, mirrorY: boolean): void {
  const rig = fighter.paperDollRig;

  if (!rig) {
    return;
  }

  applyPaperDollWeaponMirror(rig.equipment.weaponMain, mirrorX, mirrorY);
  applyPaperDollWeaponMirror(rig.equipment.weaponBow, mirrorX, mirrorY);
  if (rig.shadow) {
    applyPaperDollWeaponMirror(rig.shadow.equipment.weaponMain, mirrorX, mirrorY);
    applyPaperDollWeaponMirror(rig.shadow.equipment.weaponBow, mirrorX, mirrorY);
  }
}

function applyPaperDollWeaponMirror(slot: FighterPart | undefined, mirrorX: boolean, mirrorY: boolean): void {
  if (!slot) {
    return;
  }

  applyPaperDollWeaponImageMirror(slot, mirrorX, mirrorY);
  getLinkedPaperDollEquipmentSlots(slot).forEach((linkedSlot) => applyPaperDollWeaponImageMirror(linkedSlot, mirrorX, mirrorY));
}

function applyPaperDollWeaponImageMirror(slot: FighterPart, mirrorX: boolean, mirrorY: boolean): void {
  const image = getPaperDollEquipmentSlotImage(slot);

  if (!image) {
    return;
  }

  const config = paperDollEquipmentSlotConfigs.get(slot);

  if (config) {
    image.x = config.localX;
    image.y = config.localY;
  }

  image.scaleX = Math.abs(image.scaleX) * (mirrorX ? -1 : 1);
  image.scaleY = Math.abs(image.scaleY) * (mirrorY ? -1 : 1);
}

function createPaperDollEquipmentTransformState(tuning: EquipmentTuning): PaperDollEquipmentTransformState {
  return {
    x: tuning.x,
    y: tuning.y,
    angle: tuning.angle,
    scaleX: tuning.scaleX * (tuning.flipX ? -1 : 1),
    scaleY: tuning.scaleY * (tuning.flipY ? -1 : 1),
  };
}

function arePaperDollEquipmentTransformStatesEqual(
  previousState: PaperDollEquipmentTransformState,
  nextState: PaperDollEquipmentTransformState,
): boolean {
  return previousState.x === nextState.x
    && previousState.y === nextState.y
    && previousState.angle === nextState.angle
    && previousState.scaleX === nextState.scaleX
    && previousState.scaleY === nextState.scaleY;
}

function getPaperDollEquipmentDragLocalPoint(slot: FighterPart, worldX: number, worldY: number): { x: number; y: number } {
  const parent = getPaperDollEquipmentSlotParent(slot);

  if (!parent) {
    return { x: worldX, y: worldY };
  }

  const localPoint = parent.getWorldTransformMatrix().applyInverse(worldX, worldY);

  return { x: localPoint.x, y: localPoint.y };
}

function getPaperDollEquipmentSlotParent(slot: FighterPart): FighterPart | undefined {
  const parentContainer = (slot as Phaser.GameObjects.GameObject & { parentContainer?: Phaser.GameObjects.Container | null }).parentContainer;

  return parentContainer ? part(parentContainer) : undefined;
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

function enableDebugPaperDollAnimationWeaponPicking(rig: PaperDollRig | undefined, onPick: DebugAnimationWeaponPickHandler): void {
  if (!rig) {
    return;
  }

  PAPER_DOLL_DRAGGABLE_WEAPON_SLOT_KEYS.forEach((slotKey) => {
    getPaperDollAnimationWeaponPickTargets(rig, slotKey).forEach((slot) => {
      const slotContainer = slot as Phaser.GameObjects.Container;

      slotContainer.on("pointerdown", (pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: DebugInputEvent) => {
        onPick(slotKey, pointer, event);
      });
    });
  });
}

function syncDebugPaperDollAnimationWeaponPicking(rig: PaperDollRig | undefined, enabled: boolean): void {
  if (!rig) {
    return;
  }

  PAPER_DOLL_DRAGGABLE_WEAPON_SLOT_KEYS.forEach((slotKey) => {
    const primarySlot = rig.equipment[slotKey];
    const isPrimarySlotVisible = Boolean(primarySlot && isPaperDollEquipmentSlotVisible(primarySlot));

    getPaperDollAnimationWeaponPickTargets(rig, slotKey).forEach((slot) => {
      syncDebugPaperDollAnimationWeaponPickTarget(
        slot,
        slotKey,
        enabled && isPrimarySlotVisible && isPaperDollEquipmentSlotVisible(slot),
      );
    });
  });
}

function getPaperDollAnimationWeaponPickTargets(rig: PaperDollRig, slotKey: PaperDollEquipmentSlotKey): FighterPart[] {
  const slot = rig.equipment[slotKey];

  return slot ? [slot, ...getLinkedPaperDollEquipmentSlots(slot)] : [];
}

function syncDebugPaperDollAnimationWeaponPickTarget(slot: FighterPart, slotKey: PaperDollEquipmentSlotKey, enabled: boolean): void {
  const slotContainer = slot as Phaser.GameObjects.Container;

  if (!enabled) {
    if (slotContainer.input) {
      slotContainer.removeInteractive();
    }
    return;
  }

  slotContainer.setInteractive(createPaperDollEquipmentHitArea(slot, slotKey), Phaser.Geom.Rectangle.Contains);

  if (slotContainer.input) {
    slotContainer.input.cursor = "move";
  }
}

function createPaperDollEquipmentHitArea(slot: FighterPart, slotKey: PaperDollEquipmentSlotKey): Phaser.Geom.Rectangle {
  const image = getPaperDollEquipmentSlotImage(slot);
  const padding = 8;

  if (image) {
    const displayWidth = Math.abs(image.displayWidth);
    const displayHeight = Math.abs(image.displayHeight);
    const width = Math.max(18, displayWidth + padding * 2);
    const height = Math.max(18, displayHeight + padding * 2);
    const imageLeft = image.scaleX < 0
      ? image.x - displayWidth * (1 - image.originX)
      : image.x - displayWidth * image.originX;
    const imageTop = image.scaleY < 0
      ? image.y - displayHeight * (1 - image.originY)
      : image.y - displayHeight * image.originY;

    return new Phaser.Geom.Rectangle(imageLeft - padding, imageTop - padding, width, height);
  }

  const config = PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS[slotKey];
  const width = Math.max(18, config.displayHeight * 0.8);
  const height = Math.max(18, config.displayHeight);

  return new Phaser.Geom.Rectangle(config.localX - width * config.originX, config.localY - height * config.originY, width, height);
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

function getDebugRigPartSelectionGroup(partKey: RigPartKey): RigPartKey[] {
  const group = DEBUG_RIG_PART_SELECTION_GROUPS.find((partGroup) => partGroup.includes(partKey));

  return group ? [...group] : [partKey];
}

function isRigPartGroupSelectPointer(pointer: Phaser.Input.Pointer): boolean {
  const event = (pointer as Phaser.Input.Pointer & { event?: { altKey?: boolean } }).event;

  return Boolean(event?.altKey);
}

function isMultiSelectPointer(pointer: Phaser.Input.Pointer): boolean {
  const event = (pointer as Phaser.Input.Pointer & { event?: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } }).event;

  return Boolean(event?.ctrlKey || event?.metaKey || event?.shiftKey);
}

function isAnimationCanvasZoomWheel(pointer: Phaser.Input.Pointer): boolean {
  const event = (pointer as Phaser.Input.Pointer & { event?: { ctrlKey?: boolean; metaKey?: boolean } }).event;

  return Boolean(event?.ctrlKey || event?.metaKey);
}

function isAnimationCanvasPanPointer(pointer: Phaser.Input.Pointer): boolean {
  const event = (pointer as Phaser.Input.Pointer & { event?: { ctrlKey?: boolean; metaKey?: boolean } }).event;

  return Boolean(event?.ctrlKey || event?.metaKey) && isPrimaryPointerDown(pointer);
}

function isPrimaryPointerDown(pointer: Phaser.Input.Pointer): boolean {
  const event = (pointer as Phaser.Input.Pointer & { event?: { pointerType?: string } }).event;

  if (event?.pointerType === "touch" || event?.pointerType === "pen") {
    return true;
  }

  return typeof pointer.leftButtonDown === "function" ? pointer.leftButtonDown() : true;
}

function updateAnimationRootOffsetWithInteractiveDelta(delta: Partial<BodyAnimationRootOffset>): void {
  if (debugTuning.animationRootTransformMode === "poseOffset") {
    updateAnimationPoseOffsetWithInteractiveDelta(delta);
    return;
  }

  const selectedAnimation = getSelectedDebugBodyAnimationTarget();

  if (!selectedAnimation) {
    return;
  }

  const animation = selectedAnimation.animation;
  const target = getDebugAnimationKeyframeUpdateTarget(animation);

  if (!target) {
    return;
  }

  const currentRootOffset = target.keyframe.rootOffset ?? defaultBodyAnimationRootOffset;
  const nextKeyframe: BodyAnimationKeyframe = {
    ...target.keyframe,
    rootOffset: {
      x: clampNumber(currentRootOffset.x + (delta.x ?? 0), -480, 480),
      y: clampNumber(currentRootOffset.y + (delta.y ?? 0), -480, 480),
    },
  };
  const nextAnimation: BodyAnimationTuning = {
    ...animation,
    keyframes: (target.exists
      ? target.keyframes.map((keyframe) => (keyframe.id === nextKeyframe.id ? nextKeyframe : keyframe))
      : [...target.keyframes, nextKeyframe]
    ).sort(compareDebugAnimationKeyframes),
  };

  updateSelectedDebugBodyAnimation(nextAnimation, {
    animationEditMode: "keyframe",
    selectedAnimationKeyframeId: nextKeyframe.id,
  });
}

function updateAnimationPoseOffsetWithInteractiveDelta(delta: Partial<BodyAnimationRootOffset>): void {
  const shift = { x: delta.x ?? 0, y: delta.y ?? 0 };

  if (Math.abs(shift.x) < 0.001 && Math.abs(shift.y) < 0.001) {
    return;
  }

  const selectedAnimation = getSelectedDebugBodyAnimationTarget();

  if (!selectedAnimation) {
    return;
  }

  const animation = selectedAnimation.animation;
  const target = getDebugAnimationKeyframeUpdateTarget(animation);

  if (!target) {
    return;
  }

  const nextRigParts = shiftDebugRigParts(target.keyframe.rigParts, shift);
  const nextKeyframe: BodyAnimationKeyframe = {
    ...target.keyframe,
    rigParts: nextRigParts,
  };
  const nextAnimation: BodyAnimationTuning = {
    ...animation,
    keyframes: (target.exists
      ? target.keyframes.map((keyframe) => (keyframe.id === nextKeyframe.id ? nextKeyframe : keyframe))
      : [...target.keyframes, nextKeyframe]
    ).sort(compareDebugAnimationKeyframes),
  };

  if (nextKeyframe.id === "pose-a") {
    nextAnimation.base = nextRigParts;
  }

  if (nextKeyframe.id === "pose-b") {
    nextAnimation.breath = nextRigParts;
  }

  updateSelectedDebugBodyAnimation(nextAnimation, {
    animationEditMode: "keyframe",
    selectedAnimationKeyframeId: nextKeyframe.id,
  });
}

function updateRigPartsWithInteractiveDelta(partKeys: readonly RigPartKey[], delta: Partial<Pick<RigPartTuning, "x" | "y" | "angle">>): void {
  const poseKey = getActiveDebugAnimationRigPoseKey();

  if (partKeys.length === 0) {
    return;
  }

  if (!poseKey) {
    updateSelectedDebugAnimationKeyframeRigPartsWithInteractiveDelta(partKeys, delta);
    return;
  }

  const selectedAnimation = getSelectedDebugBodyAnimationTarget();

  if (!selectedAnimation) {
    return;
  }

  const animation = selectedAnimation.animation;
  const nextPose = { ...animation[poseKey] };
  const rotatedPose = getPivotRotatedDebugRigParts(animation[poseKey], partKeys, delta);

  if (rotatedPose) {
    Object.assign(nextPose, rotatedPose);
  } else {
    partKeys.forEach((partKey) => {
      nextPose[partKey] = applyRigPartInteractiveDelta(animation[poseKey][partKey] ?? defaultRigPartTuning, delta);
    });
  }

  updateSelectedDebugBodyAnimation({
    ...animation,
    [poseKey]: nextPose,
  });
}

function updateSelectedDebugAnimationKeyframeRigPartsWithInteractiveDelta(
  partKeys: readonly RigPartKey[],
  delta: Partial<Pick<RigPartTuning, "x" | "y" | "angle">>,
): void {
  if (debugTuning.animationEditMode !== "keyframe" && debugTuning.animationEditMode !== "preview") {
    return;
  }

  const selectedAnimation = getSelectedDebugBodyAnimationTarget();

  if (!selectedAnimation) {
    return;
  }

  const animation = selectedAnimation.animation;
  const target = getDebugAnimationKeyframeUpdateTarget(animation);

  if (!target) {
    return;
  }

  const nextRigParts = { ...target.keyframe.rigParts };
  const rotatedRigParts = getPivotRotatedDebugRigParts(target.keyframe.rigParts, partKeys, delta);

  if (rotatedRigParts) {
    Object.assign(nextRigParts, rotatedRigParts);
  } else {
    partKeys.forEach((partKey) => {
      nextRigParts[partKey] = applyRigPartInteractiveDelta(target.keyframe.rigParts[partKey] ?? defaultRigPartTuning, delta);
    });
  }

  const nextKeyframe: BodyAnimationKeyframe = { ...target.keyframe, rigParts: nextRigParts };
  const nextAnimation: BodyAnimationTuning = {
    ...animation,
    keyframes: (target.exists
      ? target.keyframes.map((keyframe) => (keyframe.id === nextKeyframe.id ? nextKeyframe : keyframe))
      : [...target.keyframes, nextKeyframe]
    ).sort(compareDebugAnimationKeyframes),
  };

  if (nextKeyframe.id === "pose-a") {
    nextAnimation.base = nextRigParts;
  }

  if (nextKeyframe.id === "pose-b") {
    nextAnimation.breath = nextRigParts;
  }

  updateSelectedDebugBodyAnimation(nextAnimation, {
    animationEditMode: "keyframe",
    selectedAnimationKeyframeId: nextKeyframe.id,
  });
}

function getPivotRotatedDebugRigParts(
  sourceParts: Record<RigPartKey, RigPartTuning>,
  partKeys: readonly RigPartKey[],
  delta: Partial<Pick<RigPartTuning, "x" | "y" | "angle">>,
): Partial<Record<RigPartKey, RigPartTuning>> | undefined {
  if (delta.angle === undefined || delta.x !== undefined || delta.y !== undefined) {
    return undefined;
  }

  const group = getMatchingDebugRigPartSelectionGroup(partKeys);

  if (!group) {
    return undefined;
  }

  return rotateDebugRigPartGroupAroundAnchor(sourceParts, group, delta.angle);
}

function getMatchingDebugRigPartSelectionGroup(partKeys: readonly RigPartKey[]): readonly RigPartKey[] | undefined {
  return DEBUG_RIG_PART_SELECTION_GROUPS.find(
    (partGroup) => partGroup.length === partKeys.length && partGroup.every((partKey) => partKeys.includes(partKey)),
  );
}

function rotateDebugRigPartGroupAroundAnchor(
  sourceParts: Record<RigPartKey, RigPartTuning>,
  partKeys: readonly RigPartKey[],
  degrees: number,
): Partial<Record<RigPartKey, RigPartTuning>> {
  const anchorKey = partKeys[0];
  const radians = (degrees * Math.PI) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  const anchorPivot = PAPER_DOLL_PART_PIVOTS[anchorKey];
  const anchorTuning = sourceParts[anchorKey] ?? defaultRigPartTuning;
  const originX = anchorPivot.x + anchorTuning.x;
  const originY = anchorPivot.y + anchorTuning.y;
  const nextParts: Partial<Record<RigPartKey, RigPartTuning>> = {};

  partKeys.forEach((partKey) => {
    const current = sourceParts[partKey] ?? defaultRigPartTuning;
    const pivot = PAPER_DOLL_PART_PIVOTS[partKey];
    const localX = pivot.x + current.x;
    const localY = pivot.y + current.y;
    const offsetX = localX - originX;
    const offsetY = localY - originY;
    const rotatedX = originX + offsetX * cos - offsetY * sin;
    const rotatedY = originY + offsetX * sin + offsetY * cos;

    nextParts[partKey] = {
      ...current,
      x: clampNumber(rotatedX - pivot.x, -480, 480),
      y: clampNumber(rotatedY - pivot.y, -480, 480),
      angle: clampNumber(current.angle + degrees, RIG_PART_ANGLE_MIN, RIG_PART_ANGLE_MAX),
    };
  });

  return nextParts;
}

function getDebugAnimationKeyframeUpdateTarget(animation: BodyAnimationTuning): { keyframes: BodyAnimationKeyframe[]; keyframe: BodyAnimationKeyframe; exists: boolean } | undefined {
  const keyframes = getDebugAnimationEditKeyframes(animation);

  if (debugTuning.animationEditMode === "poseA" || debugTuning.animationEditMode === "poseB") {
    const targetId = debugTuning.animationEditMode === "poseA" ? "pose-a" : "pose-b";
    const keyframe = keyframes.find((candidate) => candidate.id === targetId);

    return keyframe ? { keyframes, keyframe, exists: true } : undefined;
  }

  if (debugTuning.animationEditMode === "keyframe") {
    const keyframe = keyframes.find((candidate) => candidate.id === debugTuning.selectedAnimationKeyframeId) ?? keyframes[0];

    return keyframe ? { keyframes, keyframe, exists: true } : undefined;
  }

  const duration = Math.max(1, animation.duration);
  const time = Math.round(clampNumber(debugTuning.animationPreviewProgress, 0, 1) * duration);
  const existingKeyframe = keyframes.find((keyframe) => Math.round(keyframe.time) === time);

  if (existingKeyframe) {
    return { keyframes, keyframe: existingKeyframe, exists: true };
  }

  const sampledPose = sampleDebugAnimationPreviewPose(animation);
  const sourceKeyframe = keyframes[0];
  const sourcePose = sampledPose ?? sourceKeyframe;

  if (!sourcePose) {
    return undefined;
  }

  return {
    keyframes,
    keyframe: {
      id: createUniqueDebugAnimationKeyframeId(keyframes, `key-${Math.round((time / duration) * 1000)}`),
      time,
      easing: "easeInOut",
      rigParts: cloneDebugRigParts(sourcePose.rigParts),
      faceParts: cloneDebugFaceParts(sourcePose.faceParts),
      rootOffset: cloneDebugBodyAnimationRootOffset(sourcePose.rootOffset),
      weaponMirrorX: sourcePose.weaponMirrorX,
      weaponMirrorY: sourcePose.weaponMirrorY,
      castProp: cloneDebugBodyAnimationCastProp(sourcePose.castProp),
    },
    exists: false,
  };
}

function sampleDebugAnimationPreviewPose(animation: BodyAnimationTuning): SampledBodyAnimationPose | undefined {
  const keyframes = getDebugAnimationEditKeyframes(animation);

  return sampleBodyAnimationKeyframePose(keyframes, Math.max(1, animation.duration), debugTuning.animationPreviewProgress);
}

function getDebugAnimationEditKeyframes(animation: BodyAnimationTuning): BodyAnimationKeyframe[] {
  if (animation.keyframes && animation.keyframes.length > 0) {
    return animation.keyframes.map(cloneDebugAnimationKeyframe).sort(compareDebugAnimationKeyframes);
  }

  return [
    {
      id: "pose-a",
      time: 0,
      easing: "easeInOut",
      rigParts: cloneDebugRigParts(animation.base),
      faceParts: cloneDebugFaceParts(animation.faceBase),
      rootOffset: { ...defaultBodyAnimationRootOffset },
    },
    {
      id: "pose-b",
      time: Math.max(1, animation.duration) / 2,
      easing: "easeInOut",
      rigParts: cloneDebugRigParts(animation.breath),
      faceParts: cloneDebugFaceParts(animation.faceBreath),
      rootOffset: { ...defaultBodyAnimationRootOffset },
    },
  ];
}

function cloneDebugAnimationKeyframe(keyframe: BodyAnimationKeyframe): BodyAnimationKeyframe {
  return {
    ...keyframe,
    rigParts: cloneDebugRigParts(keyframe.rigParts),
    faceParts: cloneDebugFaceParts(keyframe.faceParts),
    rootOffset: cloneDebugBodyAnimationRootOffset(keyframe.rootOffset),
    castProp: cloneDebugBodyAnimationCastProp(keyframe.castProp),
  };
}

function cloneDebugRigParts(source: Record<RigPartKey, RigPartTuning>): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...(source[key] ?? defaultRigPartTuning) }])) as Record<RigPartKey, RigPartTuning>;
}

function shiftDebugRigParts(source: Record<RigPartKey, RigPartTuning>, delta: { x: number; y: number }): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(
    RIG_PART_KEYS.map((key) => [
      key,
      {
        ...(source[key] ?? defaultRigPartTuning),
        x: clampNumber((source[key]?.x ?? defaultRigPartTuning.x) + delta.x, -480, 480),
        y: clampNumber((source[key]?.y ?? defaultRigPartTuning.y) + delta.y, -480, 480),
      },
    ]),
  ) as Record<RigPartKey, RigPartTuning>;
}

function cloneDebugFaceParts(source: Record<FacePartKey, FacePartTuning>): Record<FacePartKey, FacePartTuning> {
  return Object.fromEntries(FACE_PART_KEYS.map((key) => [key, { ...(source[key] ?? DEFAULT_FACE_PARTS[key]) }])) as Record<FacePartKey, FacePartTuning>;
}

function cloneDebugBodyAnimationRootOffset(source: BodyAnimationRootOffset | undefined): BodyAnimationRootOffset {
  return { ...(source ?? defaultBodyAnimationRootOffset) };
}

function cloneDebugBodyAnimationCastProp(source: BodyAnimationCastPropTuning | undefined): BodyAnimationCastPropTuning | undefined {
  return source ? { ...source } : undefined;
}

function compareDebugAnimationKeyframes(a: BodyAnimationKeyframe, b: BodyAnimationKeyframe): number {
  return a.time - b.time || a.id.localeCompare(b.id);
}

function createUniqueDebugAnimationKeyframeId(keyframes: readonly BodyAnimationKeyframe[], prefix: string): string {
  const usedIds = new Set(keyframes.map((keyframe) => keyframe.id));
  let id = sanitizeDebugAnimationKeyframeId(prefix);
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${sanitizeDebugAnimationKeyframeId(prefix)}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function sanitizeDebugAnimationKeyframeId(value: string): string {
  const id = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

  return id || "key";
}

function updateBodyPartLayersWithInteractivePointerDelta(
  rig: Pick<PaperDollRig, "parts">,
  partKeys: readonly RigPartKey[],
  previousWorldPoint: { x: number; y: number },
  nextWorldPoint: { x: number; y: number },
): void {
  const deltas: Partial<Record<RigPartKey, Partial<Pick<RigPartTuning, "x" | "y">>>> = {};

  partKeys.forEach((partKey) => {
    const part = rig.parts[partKey];

    if (!part) {
      return;
    }

    const previousLocalPoint = getPaperDollBodyPartDragLocalPoint(part, previousWorldPoint.x, previousWorldPoint.y);
    const nextLocalPoint = getPaperDollBodyPartDragLocalPoint(part, nextWorldPoint.x, nextWorldPoint.y);
    const deltaX = nextLocalPoint.x - previousLocalPoint.x;
    const deltaY = nextLocalPoint.y - previousLocalPoint.y;

    if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) {
      return;
    }

    deltas[partKey] = { x: deltaX, y: deltaY };
  });

  updateBodyPartLayersWithInteractiveDeltas(deltas);
}

function updateBodyPartLayersWithInteractiveDelta(
  partKeys: readonly RigPartKey[],
  delta: Partial<Pick<RigPartTuning, "x" | "y" | "angle">>,
): void {
  updateBodyPartLayersWithInteractiveDeltas(
    Object.fromEntries(partKeys.map((partKey) => [partKey, delta])) as Partial<
      Record<RigPartKey, Partial<Pick<RigPartTuning, "x" | "y" | "angle">>>
    >,
  );
}

function updateBodyPartLayersWithInteractiveDeltas(
  deltas: Partial<Record<RigPartKey, Partial<Pick<RigPartTuning, "x" | "y" | "angle">>>>,
): void {
  const presetKey = debugTuning.paperDollBodyPreset;
  const presetTuning = getDebugBodyPresetTuning(presetKey);
  const nextBodyPartLayers = { ...presetTuning.bodyPartLayers };
  let hasDelta = false;

  RIG_PART_KEYS.forEach((partKey) => {
    const delta = deltas[partKey];

    if (!delta) {
      return;
    }

    hasDelta = true;
    nextBodyPartLayers[partKey] = applyRigPartInteractiveDelta(nextBodyPartLayers[partKey] ?? defaultRigPartTuning, delta, -180, 180);
  });

  if (!hasDelta) {
    return;
  }

  updateDebugTuning({
    bodyPresetTuning: {
      ...debugTuning.bodyPresetTuning,
      [presetKey]: {
        ...presetTuning,
        bodyPartLayers: nextBodyPartLayers,
      },
    },
  });
}

function getPaperDollBodyPartDragLocalPoint(part: FighterPart, worldX: number, worldY: number): { x: number; y: number } {
  const localPoint = part.getWorldTransformMatrix().applyInverse(worldX, worldY);

  return { x: localPoint.x, y: localPoint.y };
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
  const animation = getSelectedDebugBodyAnimation();

  if (debugTuning.animationEditMode === "keyframe") {
    const selectedKeyframe = getSelectedDebugAnimationKeyframe(animation);

    if (!selectedKeyframe) {
      return;
    }

    applyBodyAnimationPoseBlend(fighter, animation, animation.base, selectedKeyframe.rigParts, animation.faceBase, selectedKeyframe.faceParts, 1);
    applyBodyAnimationRootOffset(fighter, selectedKeyframe.rootOffset ?? defaultBodyAnimationRootOffset);
    applyBodyAnimationWeaponMirrors(
      fighter,
      selectedKeyframe.weaponMirrorX ?? false,
      selectedKeyframe.weaponMirrorY ?? false,
    );
    applyBodyAnimationCastProp(fighter, selectedKeyframe.castProp);
    return;
  }

  const poseKey = getActiveDebugAnimationRigPoseKey();

  if (!poseKey) {
    return;
  }

  applyBodyAnimationBlend(fighter, animation, poseKey === "base" ? 0 : 1);
  const keyframe = getDebugAnimationEditKeyframes(animation).find((candidate) => candidate.id === (poseKey === "base" ? "pose-a" : "pose-b"));

  applyBodyAnimationRootOffset(fighter, keyframe?.rootOffset ?? defaultBodyAnimationRootOffset);
  applyBodyAnimationWeaponMirrors(
    fighter,
    keyframe?.weaponMirrorX ?? false,
    keyframe?.weaponMirrorY ?? false,
  );
  applyBodyAnimationCastProp(fighter, keyframe?.castProp);
}

function applyCurrentDebugAnimationWeaponPose(fighter: FighterVisual): void {
  const animation = getSelectedDebugBodyAnimation();

  if (!animation) {
    applyBodyAnimationWeaponMirrors(fighter, false, false);
    return;
  }

  if (debugTuning.animationEditMode === "preview" && animation.enabled) {
    const sampledPose = sampleDebugAnimationPreviewPose(animation);

    applyBodyAnimationWeaponMirrors(
      fighter,
      sampledPose?.weaponMirrorX ?? false,
      sampledPose?.weaponMirrorY ?? false,
    );
    return;
  }

  if (debugTuning.animationEditMode === "keyframe") {
    const selectedKeyframe = getSelectedDebugAnimationKeyframe(animation);

    applyBodyAnimationWeaponMirrors(
      fighter,
      selectedKeyframe?.weaponMirrorX ?? false,
      selectedKeyframe?.weaponMirrorY ?? false,
    );
    return;
  }

  const poseKey = getActiveDebugAnimationRigPoseKey();
  const keyframe = poseKey
    ? getDebugAnimationEditKeyframes(animation).find((candidate) => candidate.id === (poseKey === "base" ? "pose-a" : "pose-b"))
    : undefined;

  applyBodyAnimationWeaponMirrors(
    fighter,
    keyframe?.weaponMirrorX ?? false,
    keyframe?.weaponMirrorY ?? false,
  );
}

function getSelectedDebugAnimationKeyframe(animation: BodyAnimationTuning | undefined): BodyAnimationKeyframe | undefined {
  const keyframes = animation?.keyframes;

  if (!keyframes || keyframes.length === 0) {
    return undefined;
  }

  return keyframes.find((keyframe) => keyframe.id === debugTuning.selectedAnimationKeyframeId) ?? keyframes[0];
}

function applyRigPartInteractiveDelta(
  part: RigPartTuning,
  delta: Partial<Pick<RigPartTuning, "x" | "y" | "angle">>,
  angleMin = RIG_PART_ANGLE_MIN,
  angleMax = RIG_PART_ANGLE_MAX,
): RigPartTuning {
  return {
    ...part,
    x: delta.x === undefined ? part.x : clampNumber(part.x + delta.x, -480, 480),
    y: delta.y === undefined ? part.y : clampNumber(part.y + delta.y, -480, 480),
    angle: delta.angle === undefined ? part.angle : clampNumber(part.angle + delta.angle, angleMin, angleMax),
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
  faceAssetLayers: PaperDollFaceAssetLayers,
  appearanceLayers: PaperDollAppearanceLayers,
): void {
  const headTextureKey = options.headAssetKey ? getActivePaperDollAssetKey(options.headAssetKey) : undefined;
  if (key === "head" && headTextureKey && target.textures.exists(headTextureKey)) {
    const image = target.add.image(0, HEAD_ASSET_LOCAL_BOTTOM_Y, headTextureKey);
    applyPaperDollBodyPartImageConfig(image, PAPER_DOLL_HEAD_ASSET_CONFIG, key, options.bodyPresetKey);
    partContainer.add(image);
    addPaperDollHelmetVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.helmetAssetKey, equipment);
    addPaperDollFaceOverlay(target, partContainer, faceParts, true);
    syncPaperDollFaceOverlayVisibility(faceParts, options.faceOverlayMode !== "none");
    addPaperDollFaceAssetLayers(target, partContainer, faceAssetLayers, options.faceAssetKeys, options.bodyPresetKey);
    addPaperDollAppearanceLayers(target, partContainer, appearanceLayers, options.appearanceAssetKeys, options.bodyPresetKey);
    return;
  }

  const torsoTextureKey = options.torsoAssetKey ? getActivePaperDollAssetKey(options.torsoAssetKey) : undefined;
  if (key === "torso" && torsoTextureKey && target.textures.exists(torsoTextureKey)) {
    const image = target.add.image(0, TORSO_ASSET_LOCAL_BOTTOM_Y, torsoTextureKey);
    applyPaperDollBodyPartImageConfig(image, PAPER_DOLL_TORSO_ASSET_CONFIG, key, options.bodyPresetKey);
    partContainer.add(image);
    addPaperDollBreastplateVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.breastplateAssetKey, equipment);
    return;
  }

  const assetKey = options.bodyPartAssetKeys?.[key];
  const textureKey = assetKey ? getActivePaperDollAssetKey(assetKey) : undefined;
  const assetConfig = PAPER_DOLL_PART_ASSET_CONFIGS[key];

  if (key === "backHand") {
    addPaperDollWeaponVisual(target, partContainer, equipmentLayers, equipmentAnchors, "weaponMain", options.weaponMainAssetKey, equipment);
    addPaperDollWeaponVisual(target, partContainer, equipmentLayers, equipmentAnchors, "weaponBow", options.weaponBowAssetKey, equipment);
  }

  if (textureKey && assetConfig && target.textures.exists(textureKey)) {
    const image = target.add.image(assetConfig.localX, assetConfig.localY, textureKey);
    applyPaperDollBodyPartImageConfig(image, assetConfig, key, options.bodyPresetKey);
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
  slotKey: PaperDollEquipmentSlotKey,
  assetKey: string | undefined,
  equipment: PaperDollEquipment,
): void {
  const weaponContainer = createPaperDollAnchoredEquipmentContainer(target, partContainer, equipmentLayers, equipmentAnchors, slotKey);
  const weaponSlot = part(weaponContainer);
  const config = PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS[slotKey];

  if (assetKey && target.textures.exists(assetKey)) {
    const image = createPaperDollEquipmentImage(target, assetKey, config);
    weaponContainer.add(image);
  }
  addPaperDollWeaponTopOverlay(target, partContainer, equipmentLayers, equipmentAnchors, slotKey, weaponSlot, assetKey, "mainTop");
  addPaperDollWeaponTopOverlay(target, partContainer, equipmentLayers, equipmentAnchors, slotKey, weaponSlot, assetKey, "bowBottom");
  registerPaperDollEquipmentSlot(weaponContainer, equipment, slotKey, config);
}

function addPaperDollWeaponTopOverlay(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
  slotKey: PaperDollEquipmentSlotKey,
  weaponSlot: FighterPart,
  assetKey: string | undefined,
  crop: PaperDollWeaponOverlayCrop,
): void {
  const topContainer = createPaperDollAnchoredEquipmentContainer(target, partContainer, equipmentLayers, equipmentAnchors, slotKey, {
    layer: equipmentLayers.weaponTop,
    linkToAnchor: equipmentAnchors[slotKey],
    linkToSlot: weaponSlot,
    registerAnchor: false,
  });
  const topSlot = part(topContainer);
  const config = PAPER_DOLL_EQUIPMENT_SLOT_CONFIGS[slotKey];
  const effectiveCrop = assetKey && isPaperDollBowWeaponAssetKey(assetKey) && crop === "mainTop" ? "bowTop" : crop;

  paperDollWeaponOverlayCrops.set(topSlot, effectiveCrop);
  if (assetKey && target.textures.exists(assetKey)) {
    const topImage = createPaperDollEquipmentImage(target, assetKey, config);
    applyPaperDollWeaponTopOverlayCrop(topImage, effectiveCrop);
    topContainer.add(topImage);
  }
  paperDollEquipmentSlotConfigs.set(topSlot, config);
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
  } else if (!assetKey) {
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
  } else if (!assetKey) {
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
    addPaperDollEquipmentImageVisual(target, partContainer, equipmentLayers, equipmentAnchors, options.shieldAssetKey, "shield", equipment);
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

function ensurePaperDollEquipmentSlots(
  target: Phaser.Scene,
  parts: Record<PaperDollPartKey, FighterPart>,
  equipmentLayers: PaperDollEquipmentLayers,
  equipmentAnchors: PaperDollEquipmentAnchors,
  equipment: PaperDollEquipment,
): void {
  PAPER_DOLL_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    if (equipment[slotKey]) {
      return;
    }

    const anchorPartKey = PAPER_DOLL_EQUIPMENT_ANCHOR_PARTS[slotKey];
    const anchorPart = parts[anchorPartKey];

    if (!(anchorPart instanceof Phaser.GameObjects.Container)) {
      return;
    }

    if (slotKey === "weaponMain" || slotKey === "weaponBow") {
      addPaperDollWeaponVisual(target, anchorPart, equipmentLayers, equipmentAnchors, slotKey, undefined, equipment);
      return;
    }

    if (slotKey === "helmet") {
      addPaperDollHelmetVisual(target, anchorPart, equipmentLayers, equipmentAnchors, undefined, equipment);
      return;
    }

    if (slotKey === "breastplate") {
      addPaperDollBreastplateVisual(target, anchorPart, equipmentLayers, equipmentAnchors, undefined, equipment);
      return;
    }

    addPaperDollEquipmentImageVisual(target, anchorPart, equipmentLayers, equipmentAnchors, undefined, slotKey, equipment);
  });
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
  sortPaperDollEquipmentLayer(equipmentLayer, anchorContainer, slotKey);
  if (options.registerAnchor !== false) {
    equipmentAnchors[slotKey] = anchor;
  }
  linkPaperDollEquipmentAnchor(options.linkToAnchor, anchor);
  linkPaperDollEquipmentSlot(options.linkToSlot, part(equipmentContainer));

  return equipmentContainer;
}

function sortPaperDollEquipmentLayer(
  equipmentLayer: Phaser.GameObjects.Container,
  anchorContainer: Phaser.GameObjects.Container,
  slotKey: PaperDollEquipmentSlotKey,
): void {
  paperDollEquipmentLayerOrders.set(anchorContainer, PAPER_DOLL_EQUIPMENT_LAYER_ORDER[slotKey] ?? 0);
  equipmentLayer.sort("paperDollEquipmentLayerOrder", (left: Phaser.GameObjects.GameObject, right: Phaser.GameObjects.GameObject) => {
    return (paperDollEquipmentLayerOrders.get(left) ?? 0) - (paperDollEquipmentLayerOrders.get(right) ?? 0);
  });
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
  const slotContainer = getPaperDollEquipmentSlotContainer(slot);
  if (!slotContainer) {
    return undefined;
  }

  return slotContainer.list.find((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image);
}

function getPaperDollEquipmentSlotContainer(slot: FighterPart | undefined): Phaser.GameObjects.Container | undefined {
  if (!(slot instanceof Phaser.GameObjects.Container) || !slot.scene?.textures) {
    return undefined;
  }

  return slot;
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

function applyPaperDollBodyPartImageConfig(
  image: Phaser.GameObjects.Image,
  config: PaperDollPartAssetConfig,
  partKey: PaperDollPartKey,
  bodyPresetKey?: PaperDollBodyPreset,
): void {
  const tuning = getBodyPresetTuning(bodyPresetKey).bodyPartLayers[partKey] ?? defaultRigPartTuning;

  applyPaperDollPartImageConfig(image, config);
  image.x += tuning.x;
  image.y += tuning.y;
  image.angle = tuning.angle;
  image.scaleX *= tuning.scaleX * (tuning.flipX ? -1 : 1);
  image.scaleY *= tuning.scaleY * (tuning.flipY ? -1 : 1);
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

function renderScene(target: ArenaScene, current: CombatState, playerSettings = getPlayerSettings(), hudState = current): void {
  if (!target.visuals) {
    return;
  }

  if (target.arenaLayers) {
    syncArenaBackgroundForState(target, target.arenaLayers, current);
  }

  positionFightersForState(target, target.visuals, current, playerSettings);
  const shadowMode = getEffectiveArenaShadowMode(playerSettings);
  syncFighterCombatEquipment(target.visuals.player, current.player);
  if (target.visuals.helper && current.helper) {
    syncFighterCombatEquipment(target.visuals.helper, current.helper);
  }
  syncFighterCombatEquipment(target.visuals.enemy, current.enemy);
  syncFighterCombatAppearance(target.visuals.player, current.player);
  if (target.visuals.helper && current.helper) {
    syncFighterCombatAppearance(target.visuals.helper, current.helper);
  }
  syncFighterCombatAppearance(target.visuals.enemy, current.enemy);
  updateCamera(target, current);
  applyFighterArrowCountersSceneScale(target);
  setArenaHudForState(target, hudState);
  setFighterArrowCounter(target.visuals.player, current.player);
  if (target.visuals.helper && current.helper) {
    setFighterArrowCounter(target.visuals.helper, current.helper);
  }
  setFighterArrowCounter(target.visuals.enemy, current.enemy);

  if (!target.visuals.player.isShattered) {
    setFighterAlpha(target.visuals.player, 1, shadowMode);
  }

  if (target.visuals.helper && current.helper && !target.visuals.helper.isShattered) {
    setFighterAlpha(target.visuals.helper, current.helper.hp > 0 ? 1 : 0.35, shadowMode);
  }

  if (!target.visuals.enemy.isShattered) {
    setFighterAlpha(target.visuals.enemy, 1, shadowMode);
  }
}

function setArenaHudForState(target: ArenaScene, current: CombatState): void {
  if (!target.visuals) {
    return;
  }

  setHud(target.visuals.playerHud, current.player);
  setHud(target.visuals.enemyHud, current.enemy);
}

function getStateHudImpactDelay(
  current: CombatState,
  playerResultDelay: Promise<void> | undefined,
  helperResultDelay: Promise<void> | undefined,
  enemyResultDelay: Promise<void> | undefined,
): Promise<void> | undefined {
  if (current.lastPlayerDamage > 0) {
    return playerResultDelay;
  }

  if (current.lastHelperDamage > 0) {
    return helperResultDelay;
  }

  if (current.lastEnemyDamage > 0) {
    return enemyResultDelay;
  }

  return undefined;
}

function syncFighterCombatEquipment(
  fighter: FighterVisual,
  state: FighterState,
  slotKeys: readonly PaperDollEquipmentSlotKey[] = PAPER_DOLL_EQUIPMENT_SLOT_KEYS,
): void {
  const rig = fighter.paperDollRig;
  const equipment = state.equipment;

  if (!rig || !equipment) {
    return;
  }

  rig.equipmentState = equipment;
  rig.weaponEnchantmentsState = state.weaponEnchantments ? { ...state.weaponEnchantments } : undefined;
  syncPaperDollEquipmentState(rig, slotKeys, equipment);
  syncPaperDollWeaponEnchantments(rig, slotKeys, equipment, state.weaponEnchantments);
  syncFighterCombatWeaponVisibility(rig, state);
  if (rig.shadow) {
    syncFighterCombatWeaponVisibility(rig.shadow, state);
  }
}

function syncFighterCombatAppearance(fighter: FighterVisual, state: FighterState): void {
  const rig = fighter.paperDollRig;

  if (!rig || !state.appearance) {
    return;
  }

  syncPaperDollAppearanceState(rig, state.appearance);
}

function syncFighterCombatWeaponVisibility(rig: Pick<PaperDollRig, "equipment"> | Pick<PaperDollShadowRig, "equipment">, state: FighterState): void {
  const equipment = state.equipment;

  if (!equipment) {
    return;
  }

  const bowActive = isBowFighter(state);
  const hasMainWeapon = Boolean(equipment.weaponMain);
  const hasBowWeapon = Boolean(equipment.weaponBow);
  const hasBowVisual = Boolean(rig.equipment.weaponBow && getPaperDollEquipmentSlotImage(rig.equipment.weaponBow));

  setPaperDollEquipmentSlotVisible(rig.equipment.weaponMain, hasMainWeapon && (!bowActive || !hasBowVisual));
  setPaperDollEquipmentSlotVisible(rig.equipment.weaponBow, bowActive && (hasBowWeapon || hasBowVisual));
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

  if (current.helper && current.helper.hp > 0 && visuals.helper) {
    resetFighterShatter(target, visuals.helper);
  }
}

function syncHelperVisualForState(
  target: ArenaScene,
  visuals: ArenaVisuals,
  previous: CombatState | undefined,
  current: CombatState,
): void {
  if (!current.helper) {
    if (visuals.helper) {
      destroyFighterVisual(target, visuals.helper);
      visuals.helper = undefined;
    }
    return;
  }

  const previousLoadoutKey = previous?.helper ? getFighterLoadoutKey(previous.helper) : undefined;
  const currentLoadoutKey = getFighterLoadoutKey(current.helper);

  if (visuals.helper && previousLoadoutKey === currentLoadoutKey) {
    return;
  }

  if (visuals.helper) {
    destroyFighterVisual(target, visuals.helper);
  }

  visuals.helper = createPaperDollFighter(
    target,
    createHelperPaperDollOptions(DEFAULT_STAGE_ORIGIN_X + DEFAULT_PLAYER_STAGE_X, FIGHTER_BASE_Y, current.helper),
    target.arenaLayers?.actors,
  );
  attachFighterArrowCounter(target, visuals.helper);
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
  attachFighterArrowCounter(target, visuals.enemy);
}

function getFighterLoadoutKey(fighter: FighterState): string {
  return JSON.stringify({
    name: fighter.name,
    visualPreset: fighter.visualPreset ?? null,
    appearance: fighter.appearance ?? null,
    equipment: fighter.equipment ?? null,
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

function createRemovedArmorSlotSprites(
  target: Phaser.Scene,
  fighter: FighterVisual,
  removedSlots: readonly CombatArmorSlotState[] | undefined,
): Phaser.GameObjects.Image[] {
  if (!removedSlots?.length) {
    return [];
  }

  return removedSlots.flatMap((removedSlot) => {
    const sourceSlot = fighter.paperDollRig?.equipment[removedSlot.slotKey];
    const sourceImage = sourceSlot ? getPaperDollEquipmentSlotImage(sourceSlot) : undefined;

    if (!sourceImage || !target.textures.exists(sourceImage.texture.key)) {
      return [];
    }

    const transform = getArenaEffectImageTransform(target, sourceImage);
    const sprite = target.add.image(transform.x, transform.y, sourceImage.texture.key, sourceImage.frame.name);

    sprite.setOrigin(sourceImage.originX, sourceImage.originY);
    sprite.setScale(transform.scaleX, transform.scaleY);
    sprite.setAngle(transform.angle);
    sprite.setAlpha(0.98);
    addToArenaEffectsLayer(target, sprite);

    return [sprite];
  });
}

function getArenaEffectImageTransform(
  target: Phaser.Scene,
  image: Phaser.GameObjects.Image,
): { x: number; y: number; scaleX: number; scaleY: number; angle: number } {
  const matrix = image.getWorldTransformMatrix();
  const worldX = matrix.getX(0, 0);
  const worldY = matrix.getY(0, 0);
  const xAxisX = matrix.getX(1, 0) - worldX;
  const xAxisY = matrix.getY(1, 0) - worldY;
  const yAxisX = matrix.getX(0, 1) - worldX;
  const yAxisY = matrix.getY(0, 1) - worldY;
  const effectsLayer = getArenaEffectsLayer(target);
  const localPoint = effectsLayer ? effectsLayer.getWorldTransformMatrix().applyInverse(worldX, worldY) : { x: worldX, y: worldY };
  const layerScale = getArenaEffectsLayerScale(target);
  const scaleX = Math.max(0.001, Math.hypot(xAxisX, xAxisY));
  const determinant = xAxisX * yAxisY - xAxisY * yAxisX;
  const scaleY = determinant / scaleX;

  return {
    x: localPoint.x,
    y: localPoint.y,
    scaleX: scaleX / layerScale,
    scaleY: scaleY / layerScale,
    angle: Phaser.Math.RadToDeg(Math.atan2(xAxisY, xAxisX)),
  };
}

function queueRemovedArmorSlotFlyOff(
  target: Phaser.Scene,
  actionAnimations: Promise<void>[],
  sprites: readonly Phaser.GameObjects.Image[],
  impactDelay: Promise<void> | undefined,
  worldDirection: -1 | 1,
): void {
  if (sprites.length <= 0) {
    return;
  }

  queueCombatResultAnimation(actionAnimations, impactDelay, () => {
    return Promise.all(sprites.map((sprite, index) => animateRemovedArmorSlotFlyOff(target, sprite, worldDirection, index, sprites.length))).then(
      () => undefined,
    );
  });
}

function animateRemovedArmorSlotFlyOff(
  target: Phaser.Scene,
  sprite: Phaser.GameObjects.Image,
  worldDirection: -1 | 1,
  index = 0,
  count = 1,
): Promise<void> {
  const layerScale = getArenaEffectsLayerScale(target);
  const spreadIndex = index - (count - 1) / 2;

  return new Promise((resolve) => {
    target.tweens.add({
      targets: sprite,
      x: sprite.x + (worldDirection * (58 + Math.abs(spreadIndex) * 18)) / layerScale,
      y: sprite.y - (74 - spreadIndex * 18) / layerScale,
      angle: sprite.angle + worldDirection * (95 + spreadIndex * 24),
      alpha: 0,
      scaleX: sprite.scaleX * 0.78,
      scaleY: sprite.scaleY * 0.78,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => {
        sprite.destroy();
        resolve();
      },
    });
  });
}

function queueDeathEffects(
  target: ArenaScene,
  actionAnimations: Promise<void>[],
  current: CombatState,
  playerResultDelay: Promise<void> | undefined,
  helperResultDelay: Promise<void> | undefined,
  enemyResultDelay: Promise<void> | undefined,
): void {
  if (!target.visuals) {
    return;
  }

  if (current.helper && current.helper.hp <= 0 && target.visuals.helper) {
    queueFighterDeathEffect(target, actionAnimations, target.visuals.helper, -1, enemyResultDelay, {
      blocksTurn: current.result !== "playing",
      fadeRemainsAfterSettle: true,
    });
  }

  if (current.result === "playing") {
    return;
  }

  if (current.player.hp <= 0) {
    queueFighterDeathEffect(target, actionAnimations, target.visuals.player, -1, enemyResultDelay);
  }

  if (current.enemy.hp <= 0) {
    queueFighterDeathEffect(target, actionAnimations, target.visuals.enemy, 1, helperResultDelay ?? playerResultDelay);
  }
}

interface FighterDeathEffectOptions {
  blocksTurn?: boolean;
  fadeRemainsAfterSettle?: boolean;
}

function queueFighterDeathEffect(
  target: ArenaScene,
  actionAnimations: Promise<void>[],
  fighter: FighterVisual,
  worldDirection: -1 | 1,
  impactDelay: Promise<void> | undefined,
  options: FighterDeathEffectOptions = {},
): void {
  if (fighter.isDeathEffectQueued || fighter.isShattered || fighter.isShatterScheduled) {
    return;
  }

  fighter.isDeathEffectQueued = true;
  const deathEffectToken = (fighter.deathEffectToken ?? 0) + 1;
  fighter.deathEffectToken = deathEffectToken;

  const delay = impactDelay
    ? impactDelay.then(() => createSceneDelay(target, DEATH_SHATTER_AFTER_IMPACT_DELAY))
    : createSceneDelay(target, DEATH_SHATTER_DELAY);

  const effect = delay.then(() => {
    if (fighter.deathEffectToken !== deathEffectToken || !fighter.isDeathEffectQueued) {
      return;
    }

    fighter.isDeathEffectQueued = false;
    scheduleFighterShatter(target, fighter, worldDirection, 0);

    return createSceneDelay(target, DEATH_SHATTER_RESULT_SETTLE_DELAY).then(() => {
      if (options.fadeRemainsAfterSettle) {
        fadeOutFighterRemains(target, fighter);
      }
    });
  });

  if (options.blocksTurn === false) {
    void effect;
    return;
  }

  actionAnimations.push(effect);
}

function scheduleFighterShatter(target: ArenaScene, fighter: FighterVisual, worldDirection: -1 | 1, delayMs = DEATH_SHATTER_DELAY): void {
  if (fighter.isShattered || fighter.isShatterScheduled) {
    return;
  }

  fighter.isShatterScheduled = true;
  target.time.delayedCall(delayMs, () => {
    if (!fighter.isShatterScheduled || fighter.isShattered) {
      return;
    }

    fighter.isShatterScheduled = false;
    shatterFighter(target, fighter, worldDirection);
  });
}

function fadeOutFighterRemains(target: Phaser.Scene, fighter: FighterVisual): void {
  target.tweens.add({
    targets: getFighterParts(fighter),
    alpha: 0,
    duration: DEATH_REMAINS_FADE_DURATION,
    ease: "Sine.easeOut",
  });
}

function resetFighterShatter(target: Phaser.Scene, fighter: FighterVisual): void {
  if (!fighter.isShattered && !fighter.isShatterScheduled && !fighter.isDeathEffectQueued) {
    return;
  }

  fighter.isShattered = false;
  fighter.isShatterScheduled = false;
  fighter.isDeathEffectQueued = false;
  fighter.deathEffectToken = (fighter.deathEffectToken ?? 0) + 1;
  fighter.bodyAnimationLockedUntil = 0;
  resetFighterBodyIdleAnimation(fighter, target.time.now);

  const rig = fighter.paperDollRig;

  target.tweens.killTweensOf(getFighterParts(fighter));

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
  fighter.arrowCounter?.container.setVisible(false);
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
  const hpWidth = 226 * (fighter.hp / maxHp);
  const armorWidth = maxArmor > 0 ? 226 * (fighter.armor / maxArmor) : 0;
  const staminaWidth = 226 * (fighter.stamina / maxStamina);

  setDisplayWidthIfChanged(hud.hpFill, hpWidth);
  setDisplayWidthIfChanged(hud.armorFill, armorWidth);
  setDisplayWidthIfChanged(hud.staminaFill, staminaWidth);
  setPhaserTextIfChanged(hud.label, `HP ${fighter.hp}/${maxHp}  ARM ${fighter.armor}/${maxArmor}  STA ${fighter.stamina}/${maxStamina}`);
}

function setFighterArrowCounter(fighter: FighterVisual, state: FighterState): void {
  const counter = fighter.arrowCounter;

  if (!counter) {
    return;
  }

  const visible = state.hp > 0 && isBowFighter(state);

  counter.container.setVisible(visible);

  if (!visible) {
    return;
  }

  setPhaserTextIfChanged(counter.text, `${getBowShotsRemaining(state)}`);
}

function setFighterAlpha(fighter: FighterVisual, alpha: number, shadowMode = getArenaShadowMode()): void {
  getFighterParts(fighter).forEach((part) => {
    if (part === fighter.shadow) {
      const shadowVisible = fighter.castsShadow && shadowMode === "high" && !fighter.isShattered;

      part.setVisible(shadowVisible);
      part.setAlpha(shadowVisible ? alpha * debugTuning.shadowAlpha : 0);
      return;
    }

    if (part === fighter.lowShadow) {
      const shadowVisible = fighter.castsShadow && shadowMode === "low" && !fighter.isShattered;

      part.setVisible(shadowVisible);
      part.setAlpha(shadowVisible ? alpha * debugTuning.lowShadowAlpha : 0);
      return;
    }

    part.setAlpha(alpha);
  });
}

const DUO_PLAYER_STAGE_OFFSET_Y = 16;
const DUO_HELPER_STAGE_OFFSET_Y = -16;
const DUO_HELPER_SCALE_MULTIPLIER = 0.88;

function positionFightersForState(target: Phaser.Scene, visuals: ArenaVisuals, current: CombatState, playerSettings = getPlayerSettings()): void {
  const layout = getStageLayout(current, getActiveDebugTuning());
  const shouldSnap = isDebugTuningActive();
  const isDuoBoss = Boolean(current.helper && visuals.helper);
  const playerMovementDelayMs = shouldSnap
    ? 0
    : getBodyAnimationMovementStartDelayMs(
      current.lastPlayerAction,
      visuals.player,
      getFighterBodyAnimationWeaponClass(current.player),
      getBodyAnimationVariantSeed(current, "player"),
    );
  const helperMovementDelayMs = shouldSnap || !visuals.helper || !current.helper
    ? 0
    : getBodyAnimationMovementStartDelayMs(
      current.lastHelperAction,
      visuals.helper,
      getFighterBodyAnimationWeaponClass(current.helper),
      getBodyAnimationVariantSeed(current, "helper"),
    );
  const enemyMovementDelayMs = shouldSnap
    ? 0
    : getBodyAnimationMovementStartDelayMs(
      current.lastEnemyAction,
      visuals.enemy,
      getFighterBodyAnimationWeaponClass(current.enemy),
      getBodyAnimationVariantSeed(current, "enemy"),
    );
  const shouldShowPlayerMovementStartDust = isAxeLungeMovementStartDustAction(current.lastPlayerAction, current.player.weaponClass);
  const shouldShowHelperMovementStartDust = isAxeLungeMovementStartDustAction(current.lastHelperAction, current.helper?.weaponClass);
  const shouldShowEnemyMovementStartDust = isAxeLungeMovementStartDustAction(current.lastEnemyAction, current.enemy.weaponClass);

  if (!visuals.player.isShattered) {
    positionFighterForLayout(
      target,
      visuals.player,
      snapArenaPixel(layout.playerX),
      layout.playerScale * getFighterBodyScaleMultiplier(current.player),
      snapArenaPixel(layout.playerY + (isDuoBoss ? DUO_PLAYER_STAGE_OFFSET_Y : 0)),
      shouldSnap,
      playerSettings,
      playerMovementDelayMs,
      shouldShowPlayerMovementStartDust,
    );
  }

  if (visuals.helper && current.helper && !visuals.helper.isShattered) {
    positionFighterForLayout(
      target,
      visuals.helper,
      snapArenaPixel(layout.helperX),
      layout.playerScale * DUO_HELPER_SCALE_MULTIPLIER * getFighterBodyScaleMultiplier(current.helper),
      snapArenaPixel(layout.helperY + DUO_HELPER_STAGE_OFFSET_Y),
      shouldSnap,
      playerSettings,
      helperMovementDelayMs,
      shouldShowHelperMovementStartDust,
    );
  }

  if (!visuals.enemy.isShattered) {
    positionFighterForLayout(
      target,
      visuals.enemy,
      snapArenaPixel(layout.enemyX),
      layout.enemyScale * getFighterBodyScaleMultiplier(current.enemy),
      snapArenaPixel(layout.enemyY),
      shouldSnap,
      playerSettings,
      enemyMovementDelayMs,
      shouldShowEnemyMovementStartDust,
    );
  }

  syncDuoFighterRenderOrder(target, visuals, current);
}

function syncDuoFighterRenderOrder(target: Phaser.Scene, visuals: ArenaVisuals, current: CombatState): void {
  const arenaLayers = (target as Partial<ArenaScene>).arenaLayers;

  if (!current.helper || !visuals.helper || !arenaLayers) {
    return;
  }

  moveFighterVisualBelow(arenaLayers.actors, visuals.helper, visuals.player);
}

function moveFighterVisualBelow(
  layer: Phaser.GameObjects.Container,
  lower: FighterVisual,
  upper: FighterVisual,
): void {
  moveLayerChildBelow(layer, lower.shadow, upper.shadow);
  moveLayerChildBelow(layer, lower.lowShadow, upper.lowShadow);
  moveLayerChildBelow(layer, lower.body, upper.body);
  moveLayerChildBelow(layer, lower.name, upper.name);

  if (lower.arrowCounter && upper.arrowCounter) {
    moveLayerChildBelow(layer, lower.arrowCounter.container, upper.arrowCounter.container);
  }
}

function moveLayerChildBelow(
  layer: Phaser.GameObjects.Container,
  child: Phaser.GameObjects.GameObject,
  anchor: Phaser.GameObjects.GameObject,
): void {
  if (child === anchor || !layer.exists(child) || !layer.exists(anchor)) {
    return;
  }

  layer.moveBelow(child, anchor);
}

function getFighterBodyScaleMultiplier(fighter: FighterState): number {
  return 1 + Math.max(0, fighter.bodyScaleBonus ?? 0);
}

function positionFighterForLayout(
  target: Phaser.Scene,
  fighter: FighterVisual,
  x: number,
  scale: number,
  feetY: number,
  shouldSnap: boolean,
  playerSettings = getPlayerSettings(),
  movementDelayMs = 0,
  shouldShowMovementStartDust = false,
): void {
  const startX = fighter.body.x;
  const movementDeltaX = x - startX;

  if (shouldSnap) {
    setFighterXImmediate(fighter, x);
  } else {
    setFighterX(target, fighter, x, movementDelayMs);
    if (shouldShowMovementStartDust) {
      scheduleMovementStartDustBurst(target, startX, feetY, movementDeltaX, movementDelayMs, playerSettings);
    }
  }

  applyFighterTuning(fighter, scale, feetY, playerSettings);
}

function isAxeLungeMovementStartDustAction(actionId: ActionId | undefined, weaponClass: HeroWeaponClass | undefined): boolean {
  return actionId === "lunge" && weaponClass === "axe";
}

function scheduleMovementStartDustBurst(
  target: Phaser.Scene,
  x: number,
  feetY: number,
  movementDeltaX: number,
  movementDelayMs: number,
  playerSettings = getPlayerSettings(),
): void {
  if (!areArenaVfxEnabled(playerSettings) || Math.abs(movementDeltaX) < 0.5) {
    return;
  }

  const delay = Math.max(0, Math.round(movementDelayMs));
  const direction = movementDeltaX > 0 ? -1 : 1;
  const spawn = () => createMovementStartDustBurst(target, x, feetY - 8, direction);

  if (delay <= MOVEMENT_START_DUST_DELAY_EPSILON_MS) {
    spawn();
    return;
  }

  target.time.delayedCall(delay, spawn);
}

function getBodyAnimationMovementStartDelayMs(
  actionId: ActionId | undefined,
  fighter: FighterVisual,
  weaponClass: HeroWeaponClass | undefined,
  variantSeed: string,
): number {
  const animationKey = getMovementBodyAnimationKey(actionId);

  if (!animationKey) {
    return 0;
  }

  const animation = pickActiveBodyAnimationVariant(animationKey, fighter.paperDollRig?.bodyPresetKey, weaponClass, variantSeed);

  if (!animation.enabled) {
    return 0;
  }

  const movementStartKeyframe = getBodyAnimationMovementStartKeyframe(animation);

  if (!movementStartKeyframe) {
    return 0;
  }

  return Math.max(0, Math.round(clampNumber(movementStartKeyframe.time, 0, Math.max(1, animation.duration))));
}

function getMovementBodyAnimationKey(actionId: ActionId | undefined): BodyAnimationKey | undefined {
  if (actionId === "forward" || actionId === "back") {
    return "walkCycle";
  }

  if (actionId === "lunge") {
    return "lunge";
  }

  return undefined;
}

function getBodyAnimationVariantSeed(state: CombatState, owner: "player" | "helper" | "enemy"): string {
  const actionId = owner === "player" ? state.lastPlayerAction : owner === "helper" ? state.lastHelperAction : state.lastEnemyAction;
  const damage = owner === "player" ? state.lastPlayerDamage : owner === "helper" ? state.lastHelperDamage : state.lastEnemyDamage;
  const blocked = owner === "player" ? state.lastPlayerBlocked : owner === "helper" ? state.lastHelperBlocked : state.lastEnemyBlocked;
  const fighter = owner === "player" ? state.player : owner === "helper" ? state.helper : state.enemy;

  return [
    owner,
    state.round,
    actionId ?? "none",
    fighter?.weaponClass ?? "none",
    state.playerPosition,
    state.enemyPosition,
    state.distance,
    damage,
    blocked ? 1 : 0,
  ].join(":");
}

function getFighterBodyAnimationWeaponClass(fighter: FighterState): HeroWeaponClass | undefined {
  const activeWeaponClass = fighter.weaponClass;

  if (activeWeaponClass === "bow") {
    return activeWeaponClass;
  }

  return fighter.equipment?.weaponMain ? activeWeaponClass : undefined;
}

function applyFighterTuning(fighter: FighterVisual, scale: number, feetY: number, playerSettings = getPlayerSettings()): void {
  if (fighter.paperDollRig) {
    applyPaperDollRigTuning(fighter, scale, feetY, fighter.body.x, playerSettings);
  }

  applyFighterArrowCounterTuning(fighter, scale, feetY);
}

function applyFighterArrowCounterTuning(fighter: FighterVisual, scale: number, feetY: number): void {
  const counter = fighter.arrowCounter;

  if (!counter) {
    return;
  }

  counter.baseScale = Math.max(FIGHTER_ARROW_COUNTER_SCALE_MIN, scale / DEFAULT_PLAYER_SCALE) * FIGHTER_ARROW_COUNTER_SCALE_MULTIPLIER;

  counter.container.x = fighter.body.x;
  counter.container.y = feetY + FIGHTER_ARROW_COUNTER_LOCAL_Y * PAPER_DOLL_BASE_SCALE * scale;
  setGameObjectScaleIfChanged(counter.container, counter.baseScale);
}

function applyFighterArrowCounterSceneScale(target: ArenaScene, fighter: FighterVisual): void {
  const counter = fighter.arrowCounter;

  if (!counter) {
    return;
  }

  const sceneScale = Math.max(0.001, Math.abs(target.arenaLayers?.actors.scaleX ?? 1));

  setGameObjectScaleIfChanged(counter.container, counter.baseScale / sceneScale);
}

function setDisplayWidthIfChanged(target: { displayWidth: number }, width: number): void {
  if (target.displayWidth !== width) {
    target.displayWidth = width;
  }
}

function setPhaserTextIfChanged(target: Phaser.GameObjects.Text, text: string): void {
  if (target.text !== text) {
    target.setText(text);
  }
}

function setGameObjectScaleIfChanged(target: Phaser.GameObjects.Components.Transform, scale: number): void {
  if (target.scaleX !== scale || target.scaleY !== scale) {
    target.setScale(scale);
  }
}

function applyFighterArrowCountersSceneScale(target: ArenaScene): void {
  const visuals = target.visuals;

  if (!visuals) {
    return;
  }

  applyFighterArrowCounterSceneScale(target, visuals.player);
  if (visuals.helper) {
    applyFighterArrowCounterSceneScale(target, visuals.helper);
  }
  applyFighterArrowCounterSceneScale(target, visuals.enemy);
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
    applyArenaTransform(target, layers, cameraTarget, debug);
    return;
  }

  getArenaLayerTransforms(layers, cameraTarget, debug, getArenaScenePixelRatio(target)).forEach((transform) => {
    target.tweens.add({
      targets: transform.layer,
      x: transform.x,
      y: transform.y,
      scaleX: transform.scale,
      scaleY: transform.scale,
      duration: ARENA_CAMERA_TWEEN_DURATION_MS,
      ease: ARENA_CAMERA_TWEEN_EASE,
    });
    if (transform.alphaImage && typeof transform.alpha === "number") {
      target.tweens.add({
        targets: transform.alphaImage,
        alpha: transform.alpha,
        duration: ARENA_CAMERA_TWEEN_DURATION_MS,
        ease: ARENA_CAMERA_TWEEN_EASE,
      });
    }
  });
  target.tweens.add({
    targets: layers.midShade,
    amount: getArenaMidLayerShade(cameraTarget, debug, layers.backgroundTierId, layers.backgroundVariantId),
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
  const transforms = getArenaLayerTransforms(layers, cameraTarget, tuning, getArenaScenePixelRatio(target));

  if (transforms.length <= 0) {
    setArenaMidLayerShade(layers, getArenaMidLayerShade(cameraTarget, tuning, layers.backgroundTierId, layers.backgroundVariantId));
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
      amount: getArenaMidLayerShade(cameraTarget, tuning, layers.backgroundTierId, layers.backgroundVariantId),
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
      if (transform.alphaImage && typeof transform.alpha === "number") {
        remainingTweens += 1;
        target.tweens.add({
          targets: transform.alphaImage,
          alpha: transform.alpha,
          duration,
          ease,
          onComplete: () => {
            completeTween();
          },
        });
      }
    });
  });
}

function applyArenaTransform(target: Phaser.Scene, layers: ArenaLayers, cameraTarget: ReturnType<typeof getCameraTarget>, tuning?: ArenaDebugTuning): void {
  getArenaLayerTransforms(layers, cameraTarget, tuning, getArenaScenePixelRatio(target)).forEach((transform) => {
    transform.layer.setPosition(transform.x, transform.y);
    transform.layer.setScale(transform.scale);
    transform.alphaImage?.setAlpha(transform.alpha ?? transform.alphaImage.alpha);
  });
  setArenaMidLayerShade(layers, getArenaMidLayerShade(cameraTarget, tuning, layers.backgroundTierId, layers.backgroundVariantId));
}

function getArenaLayerTransforms(
  layers: ArenaLayers,
  cameraTarget: ReturnType<typeof getCameraTarget>,
  tuning?: ArenaDebugTuning,
  renderPixelRatio = 1,
): ArenaLayerTransform[] {
  const source = tuning ?? debugTuning;
  const tierId = getArenaBackgroundTuningTierId(layers.backgroundTierId);
  const variantId = layers.backgroundVariantId ?? DEFAULT_ARENA_BACKGROUND_VARIANT_ID;
  const backgroundTransforms: ArenaLayerTransform[] = [];

  layers.backgroundLayerIds.forEach((layerKey) => {
    const layer = layers.backgroundLayerContainers[layerKey];
    const image = layers.backgroundImages[layerKey];

    if (!layer || !image) {
      return;
    }

    const tuningLayer = getArenaBackgroundLayerTuningForTier(source, tierId, layerKey, variantId);
    const transform = clampArenaBackgroundLayerTransformToViewport(
      getArenaLayerTransform(layer, cameraTarget, tuningLayer.parallax),
      image,
      cameraTarget,
    );

    backgroundTransforms.push({
      ...transform,
      alphaImage: image,
      alpha: getArenaBackgroundLayerCameraAlpha(layerKey, tuningLayer, cameraTarget),
    });
  });

  return [
    ...backgroundTransforms,
    getArenaLayerTransform(layers.actors, cameraTarget, ARENA_LAYER_PARALLAX.actors, true),
    getArenaLayerTransform(layers.effects, cameraTarget, ARENA_LAYER_PARALLAX.effects, true),
  ].map((transform) => scaleArenaLayerTransformForRender(transform, renderPixelRatio));
}

function scaleArenaLayerTransformForRender(transform: ArenaLayerTransform, renderPixelRatio: number): ArenaLayerTransform {
  if (!Number.isFinite(renderPixelRatio) || renderPixelRatio <= 1) {
    return transform;
  }

  return {
    ...transform,
    x: transform.x * renderPixelRatio,
    y: transform.y * renderPixelRatio,
    scale: transform.scale * renderPixelRatio,
  };
}

function getArenaBackgroundLayerTuningForTier(
  source: ArenaDebugTuning,
  tierId: ArenaBackgroundTuningTierId,
  layerKey: ArenaBackgroundLayerKey,
  variantId = DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
): ArenaBackgroundLayerTuning {
  if (usesDynamicArenaBackgroundLayerTuning(tierId, layerKey, variantId)) {
    return getDynamicArenaBackgroundLayerTuning(source, tierId, layerKey, variantId);
  }

  return {
    layout: getArenaBackgroundLayerLayoutForTier(tierId, layerKey, source, variantId),
    parallax: getArenaBackgroundLayerParallaxForTier(source, tierId, layerKey),
  };
}

function getArenaBackgroundLayerParallaxForTier(source: ArenaDebugTuning, tierId: ArenaBackgroundTuningTierId, layerKey: ArenaBackgroundLayerKey): ArenaBackgroundLayerTuning["parallax"] {
  const role = getArenaBackgroundLayerRole(layerKey);

  if (tierId === 1) {
    switch (role) {
      case "back":
        return { followX: source.arenaTier1BackFollowX, followY: source.arenaTier1BackFollowY, zoom: source.arenaTier1BackZoom, lookUpY: source.arenaTier1BackLookUpY };
      case "mid":
        return { followX: source.arenaTier1MidFollowX, followY: source.arenaTier1MidFollowY, zoom: source.arenaTier1MidZoom, lookUpY: source.arenaTier1MidLookUpY, zoomDarken: source.arenaTier1MidZoomDarken };
      case "ground":
      case "front":
      case "ambient":
        return { followX: source.arenaTier1GroundFollowX, followY: source.arenaTier1GroundFollowY, zoom: source.arenaTier1GroundZoom, lookUpY: source.arenaTier1GroundLookUpY };
    }
  }

  switch (role) {
    case "back":
      return { followX: source.arenaTier2BackFollowX, followY: source.arenaTier2BackFollowY, zoom: source.arenaTier2BackZoom, lookUpY: source.arenaTier2BackLookUpY };
    case "mid":
      return { followX: source.arenaTier2MidFollowX, followY: source.arenaTier2MidFollowY, zoom: source.arenaTier2MidZoom, lookUpY: source.arenaTier2MidLookUpY, zoomDarken: source.arenaTier2MidZoomDarken };
    case "ground":
      return { followX: source.arenaTier2GroundFollowX, followY: source.arenaTier2GroundFollowY, zoom: source.arenaTier2GroundZoom, lookUpY: source.arenaTier2GroundLookUpY };
    case "front":
      return { followX: source.arenaTier2FrontFollowX, followY: source.arenaTier2FrontFollowY, zoom: source.arenaTier2FrontZoom, lookUpY: source.arenaTier2FrontLookUpY };
    case "ambient":
      return {
        followX: source.arenaTier2AmbientFollowX,
        followY: source.arenaTier2AmbientFollowY,
        zoom: source.arenaTier2AmbientZoom,
        lookUpY: source.arenaTier2AmbientLookUpY,
        farAlpha: source.arenaTier2AmbientFarAlpha,
        nearAlpha: source.arenaTier2AmbientNearAlpha,
      };
  }
}

function getArenaBackgroundLayerImmediateAlpha(
  target: Phaser.Scene,
  layerKey: ArenaBackgroundLayerKey,
  tierId: ArenaBackgroundTuningTierId,
  variantId: ArenaBackgroundVariantId,
  current?: CombatState,
): number {
  const tuningLayer = getArenaBackgroundLayerTuningForTier(debugTuning, getArenaBackgroundTuningTierId(tierId), layerKey, variantId);

  if (!isArenaBackgroundLayerCameraAlphaManaged(layerKey)) {
    return tuningLayer.layout.alpha;
  }

  if (!current) {
    return clamp01(tuningLayer.parallax.farAlpha ?? 1);
  }

  return getArenaBackgroundLayerCameraAlpha(layerKey, tuningLayer, getCameraTarget(current, getActiveDebugTuning(), getArenaViewport(target)));
}

function getArenaBackgroundLayerCameraAlpha(layerKey: ArenaBackgroundLayerKey, tuning: ArenaBackgroundLayerTuning, cameraTarget: CameraTarget): number {
  if (!isArenaBackgroundLayerCameraAlphaManaged(layerKey)) {
    return tuning.layout.alpha;
  }

  const farAlpha = clamp01(tuning.parallax.farAlpha ?? 1);
  const nearAlpha = clamp01(tuning.parallax.nearAlpha ?? 1);
  const cameraAlpha = farAlpha + (nearAlpha - farAlpha) * smoothStep(clamp01(cameraTarget.closeness));

  return clamp01(cameraAlpha);
}

function isArenaBackgroundLayerCameraAlphaManaged(layerKey: ArenaBackgroundEditLayer): boolean {
  return getArenaBackgroundLayerRole(layerKey) === "ambient";
}

function getArenaLayerTransform(
  layer: Phaser.GameObjects.Container,
  cameraTarget: ReturnType<typeof getCameraTarget>,
  parallax: ArenaLayerParallax,
  snapPosition = false,
): ArenaLayerTransform {
  const scale = 1 + (cameraTarget.zoom - 1) * parallax.zoom;
  const centerX = GAME_WIDTH / 2 + (cameraTarget.centerX - GAME_WIDTH / 2) * parallax.followX;
  const centerY = GAME_HEIGHT / 2 + (cameraTarget.centerY - GAME_HEIGHT / 2) * parallax.followY;
  const x = cameraTarget.viewportWidth / 2 - centerX * scale;
  const y = cameraTarget.viewportHeight / 2 - centerY * scale + cameraTarget.closeness * parallax.lookUpY;

  return {
    layer,
    x: snapPosition ? snapArenaPixel(x) : x,
    y: snapPosition ? snapArenaPixel(y) : y,
    scale,
  };
}

function clampArenaBackgroundLayerTransformToViewport(
  transform: ArenaLayerTransform,
  image: Phaser.GameObjects.Image,
  cameraTarget: ReturnType<typeof getCameraTarget>,
): ArenaLayerTransform {
  const screenWidth = image.displayWidth * transform.scale;

  if (!Number.isFinite(screenWidth) || screenWidth <= cameraTarget.viewportWidth) {
    return transform;
  }

  const left = transform.x + image.x * transform.scale;
  const right = left + screenWidth;
  let x = transform.x;

  if (left > 0) {
    x -= left;
  } else if (right < cameraTarget.viewportWidth) {
    x += cameraTarget.viewportWidth - right;
  }

  return x === transform.x ? transform : { ...transform, x };
}

function snapArenaPixel(value: number): number {
  return Math.round(value);
}

function killArenaTransformTweens(target: Phaser.Scene, layers: ArenaLayers): void {
  const backgroundImages = Object.values(layers.backgroundImages).filter((image): image is Phaser.GameObjects.Image => !!image);

  target.tweens.killTweensOf([...layers.all, ...backgroundImages, layers.midShade]);
}

function setArenaMidLayerShade(layers: ArenaLayers, amount: number): void {
  layers.midShade.amount = clamp01(amount);
  syncArenaMidLayerTint(layers);
}

function syncArenaMidLayerTint(layers: ArenaLayers): void {
  const tint = mixColor(ARENA_MID_LAYER_BASE_TINT, ARENA_MID_LAYER_CLOSE_TINT, layers.midShade.amount);

  layers.midImages.forEach((image) => image.setTint(tint));
}

function getArenaMidLayerShade(
  cameraTarget: CameraTarget,
  tuning?: ArenaDebugTuning,
  tierId?: number,
  variantId = DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
): number {
  const source = tuning ?? debugTuning;
  const scopedTierId = getArenaBackgroundTuningTierId(tierId);
  const maxDarken = clamp01(variantId !== DEFAULT_ARENA_BACKGROUND_VARIANT_ID || scopedTierId > 2
    ? getDynamicArenaBackgroundLayerTuning(source, scopedTierId, "mid", variantId).parallax.zoomDarken ?? 1
    : scopedTierId === 2
      ? source.arenaTier2MidZoomDarken
      : source.arenaTier1MidZoomDarken);

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
  const pixelRatio = getArenaScenePixelRatio(target);
  const width = Math.max(1, target.scale.width || GAME_WIDTH * pixelRatio);
  const height = Math.max(1, target.scale.height || GAME_HEIGHT * pixelRatio);
  const camera = target.cameras.main;
  const cached = arenaMainCameraViewportCache.get(target);

  if (!cached || cached.width !== width || cached.height !== height) {
    camera.setViewport(0, 0, width, height);
    camera.setBounds(0, 0, width, height);
    arenaMainCameraViewportCache.set(target, { width, height });
  }

  if (camera.scrollX !== 0 || camera.scrollY !== 0) {
    camera.setScroll(0, 0);
  }

  if (camera.zoom !== 1) {
    camera.setZoom(1);
  }
}

function getArenaViewport(target: Phaser.Scene): CameraViewport {
  const pixelRatio = getArenaScenePixelRatio(target);
  const height = Math.max(1, (target.scale.height || GAME_HEIGHT * pixelRatio) / pixelRatio);

  return {
    width: Math.max(1, (target.scale.width || GAME_WIDTH * pixelRatio) / pixelRatio),
    height,
    safeBottom: getBattleSafeArea(undefined, height).bottom,
  };
}

function getActiveDebugTuning(): typeof debugTuning | undefined {
  return isDebugTuningActive() ? debugTuning : undefined;
}

function getBodyPresetTuning(presetKey: PaperDollBodyPreset | undefined = debugTuning.paperDollBodyPreset): BodyPresetTuning {
  const key = presetKey ?? debugTuning.paperDollBodyPreset;
  const fallback = DEFAULT_BODY_PRESET_TUNING[key] ?? DEFAULT_BODY_PRESET_TUNING.classic;

  if (!isDebugTuningActive()) {
    return fallback;
  }

  return debugTuning.bodyPresetTuning[key] ?? fallback;
}

function getDebugBodyPresetTuning(presetKey: PaperDollBodyPreset | undefined = debugTuning.paperDollBodyPreset): BodyPresetTuning {
  const key = presetKey ?? debugTuning.paperDollBodyPreset;

  return debugTuning.bodyPresetTuning[key] ?? DEFAULT_BODY_PRESET_TUNING[key] ?? DEFAULT_BODY_PRESET_TUNING.classic;
}

function isDebugTuningActive(): boolean {
  return typeof document !== "undefined" && document.body.classList.contains("debug-active");
}

function getActiveBodyAnimation(key: BodyAnimationKey, presetKey: PaperDollBodyPreset | undefined = debugTuning.paperDollBodyPreset): BodyAnimationTuning {
  if (isDebugTuningActive()) {
    return getDebugBodyPresetTuning(presetKey).bodyAnimations[key] ?? DEFAULT_BODY_ANIMATIONS[key];
  }

  return getBodyPresetTuning(presetKey).bodyAnimations[key] ?? DEFAULT_BODY_ANIMATIONS[key];
}

function pickActiveBodyAnimationVariant(
  key: BodyAnimationKey,
  presetKey: PaperDollBodyPreset | undefined,
  weaponClass: HeroWeaponClass | undefined,
  seed: string,
): BodyAnimationTuning {
  const slot = getActiveBodyAnimation(key, presetKey);
  const enabledVariants = getBodyAnimationRuntimeVariants(slot).filter((variant) => variant.enabled);
  const weaponSpecificCandidates = enabledVariants.filter((variant) => isBodyAnimationVariantSpecificToWeapon(variant, weaponClass));
  const genericCandidates =
    weaponSpecificCandidates.length > 0 ? weaponSpecificCandidates : enabledVariants.filter((variant) => doesBodyAnimationVariantMatchWeapon(variant, weaponClass));

  if (genericCandidates.length === 0) {
    return slot;
  }

  return pickWeightedBodyAnimationVariant(genericCandidates, `${key}:${weaponClass ?? "none"}:${seed}`);
}

function getBodyAnimationRuntimeVariants(slot: BodyAnimationTuning): BodyAnimationTuning[] {
  return [
    {
      ...slot,
      variantId: BODY_ANIMATION_DEFAULT_VARIANT_ID,
      variantLabel: slot.variantLabel ?? BODY_ANIMATION_DEFAULT_VARIANT_ID,
      variantWeight: slot.variantWeight ?? 1,
      appliesToAllWeapons: slot.appliesToAllWeapons ?? true,
      weaponClasses: slot.weaponClasses ?? [],
      variants: [],
    },
    ...(slot.variants ?? []),
  ];
}

function doesBodyAnimationVariantMatchWeapon(animation: BodyAnimationTuning, weaponClass: HeroWeaponClass | undefined): boolean {
  if (animation.appliesToAllWeapons ?? true) {
    return true;
  }

  if (!weaponClass || !isBodyAnimationWeaponClass(weaponClass)) {
    return false;
  }

  return (animation.weaponClasses ?? []).includes(weaponClass);
}

function isBodyAnimationVariantSpecificToWeapon(animation: BodyAnimationTuning, weaponClass: HeroWeaponClass | undefined): boolean {
  if (animation.appliesToAllWeapons ?? true) {
    return false;
  }

  if (!weaponClass || !isBodyAnimationWeaponClass(weaponClass)) {
    return false;
  }

  return (animation.weaponClasses ?? []).includes(weaponClass);
}

function pickWeightedBodyAnimationVariant(candidates: BodyAnimationTuning[], seed: string): BodyAnimationTuning {
  const weightedCandidates = candidates.map((animation) => ({
    animation,
    weight: Math.max(0, animation.variantWeight ?? 1),
  }));
  const totalWeight = weightedCandidates.reduce((total, candidate) => total + candidate.weight, 0);

  if (totalWeight <= 0) {
    return candidates[0] ?? DEFAULT_BODY_ANIMATIONS.idle;
  }

  let roll = hashStringToUnit(seed) * totalWeight;

  for (const candidate of weightedCandidates) {
    roll -= candidate.weight;
    if (roll <= 0) {
      return candidate.animation;
    }
  }

  return weightedCandidates[weightedCandidates.length - 1]?.animation ?? candidates[0] ?? DEFAULT_BODY_ANIMATIONS.idle;
}

function hashStringToUnit(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 0xffffffff;
}

function isBodyAnimationWeaponClass(value: unknown): value is BodyAnimationWeaponClass {
  return typeof value === "string" && BODY_ANIMATION_WEAPON_CLASSES.includes(value as BodyAnimationWeaponClass);
}

function getActiveSlashArc(key: SlashArcAttackKey): SlashArcTuning {
  if (isDebugTuningActive()) {
    return debugTuning.slashArcs[key] ?? DEFAULT_SLASH_ARCS[key];
  }

  return DEFAULT_SLASH_ARCS[key];
}

function getActiveWardShieldTuning(): WardShieldTuning {
  if (isDebugTuningActive()) {
    return debugTuning.wardShield ?? DEFAULT_WARD_SHIELD_TUNING;
  }

  return DEFAULT_WARD_SHIELD_TUNING;
}

function getSelectedDebugBodyAnimation(): BodyAnimationTuning {
  return getSelectedDebugBodyAnimationTarget()?.animation ?? DEFAULT_BODY_ANIMATIONS[debugTuning.selectedBodyAnimation];
}

function getSelectedDebugBodyAnimationTarget():
  | {
      animationKey: BodyAnimationKey;
      presetKey: PaperDollBodyPreset;
      presetTuning: BodyPresetTuning;
      slot: BodyAnimationTuning;
      animation: BodyAnimationTuning;
      variantId: string;
    }
  | undefined {
  const animationKey = debugTuning.selectedBodyAnimation;
  const presetKey = debugTuning.paperDollBodyPreset;
  const presetTuning = getDebugBodyPresetTuning(presetKey);
  const slot = presetTuning.bodyAnimations[animationKey] ?? DEFAULT_BODY_ANIMATIONS[animationKey];

  if (debugTuning.selectedBodyAnimationVariantId === BODY_ANIMATION_DEFAULT_VARIANT_ID) {
    return {
      animationKey,
      presetKey,
      presetTuning,
      slot,
      animation: slot,
      variantId: BODY_ANIMATION_DEFAULT_VARIANT_ID,
    };
  }

  const variant = slot.variants?.find((candidate) => candidate.variantId === debugTuning.selectedBodyAnimationVariantId);

  return {
    animationKey,
    presetKey,
    presetTuning,
    slot,
    animation: variant ?? slot,
    variantId: variant?.variantId ?? BODY_ANIMATION_DEFAULT_VARIANT_ID,
  };
}

function updateSelectedDebugBodyAnimation(nextAnimation: BodyAnimationTuning, debugPatch: Partial<ArenaDebugTuning> = {}): void {
  const selectedAnimation = getSelectedDebugBodyAnimationTarget();

  if (!selectedAnimation) {
    return;
  }

  const nextSlot =
    selectedAnimation.variantId === BODY_ANIMATION_DEFAULT_VARIANT_ID
      ? nextAnimation
      : {
          ...selectedAnimation.slot,
          variants: (selectedAnimation.slot.variants ?? []).map((variant) =>
            variant.variantId === selectedAnimation.variantId
              ? {
                  ...nextAnimation,
                  variantId: variant.variantId,
                }
              : variant,
          ),
        };

  updateDebugTuning({
    ...debugPatch,
    bodyPresetTuning: {
      ...debugTuning.bodyPresetTuning,
      [selectedAnimation.presetKey]: {
        ...selectedAnimation.presetTuning,
        bodyAnimations: {
          ...selectedAnimation.presetTuning.bodyAnimations,
          [selectedAnimation.animationKey]: nextSlot,
        },
      },
    },
  });
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

function setFighterX(target: Phaser.Scene, fighter: FighterVisual, nextX: number, movementDelayMs = 0): void {
  const delta = nextX - fighter.body.x;

  if (Math.abs(delta) < 0.5) {
    return;
  }

  const delay = Math.max(0, Math.round(movementDelayMs));

  getFighterParts(fighter).forEach((part) => {
    target.tweens.add({
      targets: part,
      x: part.x + delta,
      duration: FIGHTER_MOVE_DURATION,
      delay,
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

function getFighterCameraIgnoreTargets(fighter: FighterVisual): Phaser.GameObjects.GameObject[] {
  const targets = new Set<Phaser.GameObjects.GameObject>();
  const addTarget = (target: Phaser.GameObjects.GameObject | undefined): void => {
    if (!target || targets.has(target)) {
      return;
    }

    targets.add(target);

    if (target instanceof Phaser.GameObjects.Container) {
      target.list.forEach((child) => addTarget(child as Phaser.GameObjects.GameObject));
    }
  };
  const addPaperDollRig = (rig: PaperDollRig | PaperDollShadowRig | undefined): void => {
    if (!rig) {
      return;
    }

    addTarget(rig.root as unknown as Phaser.GameObjects.GameObject);
    Object.values(rig.parts).forEach((part) => addTarget(part as unknown as Phaser.GameObjects.GameObject));
    Object.values(rig.equipment).forEach((part) => addTarget(part as unknown as Phaser.GameObjects.GameObject));
    Object.values(rig.equipmentAnchors).forEach((part) => addTarget(part as unknown as Phaser.GameObjects.GameObject));
    Object.values(rig.faceParts).forEach((part) => addTarget(part as unknown as Phaser.GameObjects.GameObject));

    if ("selectionHighlights" in rig) {
      Object.values(rig.selectionHighlights ?? {}).forEach((part) => addTarget(part));
    }
  };

  getFighterParts(fighter).forEach((part) => addTarget(part as unknown as Phaser.GameObjects.GameObject));
  addPaperDollRig(fighter.paperDollRig);
  addPaperDollRig(fighter.paperDollRig?.shadow);

  return [...targets];
}

function playBodyAnimationOnce(
  target: Phaser.Scene,
  fighter: FighterVisual,
  animation: BodyAnimationTuning,
  options: BodyAnimationOnceOptions = {},
): Promise<void> {
  return playBodyAnimationOnceHandle(target, fighter, animation, options).done;
}

function playBodyAnimationOnceHandle(
  target: Phaser.Scene,
  fighter: FighterVisual,
  animation: BodyAnimationTuning,
  options: BodyAnimationOnceOptions = {},
): BodyAnimationOnceHandle {
  const rig = fighter.paperDollRig;
  const animationAmount = getArenaAnimationAmount();

  resetFighterBodyIdleAnimation(fighter, target.time.now);

  if (!rig || !animation.enabled || animationAmount <= 0) {
    return {
      done: Promise.resolve(),
      speedUp: () => undefined,
    };
  }

  const speedMultiplier = options.speedMultiplier && options.speedMultiplier > 0 ? options.speedMultiplier : 1;
  const hasKeyframes = Boolean(getBodyAnimationTimelineKeyframes(animation));
  const duration = Math.max(1, animation.duration / speedMultiplier);
  const tweenDuration = Math.max(1, duration / 2);
  const fallbackDelay = duration + 60;
  const lockedUntil = target.time.now + fallbackDelay;

  fighter.bodyAnimationLockedUntil = lockedUntil;
  target.tweens.killTweensOf([...Object.values(rig.parts), ...getPaperDollEquipmentAnchorParts(rig), ...(rig.castProp ? [rig.castProp] : [])]);
  if (hasKeyframes) {
    applyBodyAnimationAtProgress(fighter, animation, 0, animationAmount);
  } else {
    applyBodyAnimationBlend(fighter, animation, 0);
  }

  let speedUp: BodyAnimationOnceHandle["speedUp"] = () => undefined;
  const done = new Promise<void>((resolve) => {
    let isResolved = false;
    const finish = (): void => {
      if (isResolved) {
        return;
      }

      isResolved = true;
      if (fighter.bodyAnimationLockedUntil === lockedUntil) {
        applyBodyAnimationBlend(fighter, animation, 0);
        fighter.bodyAnimationLockedUntil = 0;
        if (options.loopAfterComplete) {
          setFighterBodyIdleAnimation(fighter, options.loopAfterComplete, target.time.now);
        }
      }
      resolve();
    };

    target.time.delayedCall(fallbackDelay, finish);
    if (hasKeyframes) {
      const tween = target.tweens.addCounter({
        from: 0,
        to: 1,
        duration,
        yoyo: false,
        ease: "Linear",
        onUpdate: (tween) => {
          if (isResolved) {
            return;
          }

          applyBodyAnimationAtProgress(fighter, animation, tween.getValue() ?? 0, animationAmount);
        },
        onComplete: finish,
      });
      speedUp = (multiplier: number): void => {
        if (isResolved) {
          return;
        }

        tween.setTimeScale(Math.max(1, multiplier));
      };

      return;
    }

    const tween = target.tweens.addCounter({
      from: 0,
      to: animationAmount,
      duration: tweenDuration,
      yoyo: true,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        if (isResolved) {
          return;
        }

        applyBodyAnimationBlend(fighter, animation, tween.getValue() ?? 0);
      },
      onComplete: finish,
    });
    speedUp = (multiplier: number): void => {
      if (isResolved) {
        return;
      }

      tween.setTimeScale(Math.max(1, multiplier));
    };
  });

  return {
    done,
    speedUp: (multiplier: number) => speedUp(multiplier),
  };
}

function speedUpDamagingLungeAfterImpact(actionAnimation: ActionAnimationHandle | undefined, actionId: ActionId | undefined, damage: number): void {
  if (actionId !== "lunge" || damage <= 0 || !actionAnimation?.speedUp) {
    return;
  }

  const impact = actionAnimation.impact ?? Promise.resolve();

  void impact.then(() => actionAnimation.speedUp?.(DAMAGING_LUNGE_AFTER_IMPACT_TIME_SCALE));
}

function animateActionSequence(
  target: Phaser.Scene,
  actor: FighterVisual,
  defender: FighterVisual,
  actionId: ActionId,
  direction: "left" | "right",
  weaponClass?: HeroWeaponClass,
  playerSettings = getPlayerSettings(),
  options: ActionAnimationOptions = {},
  repeat = false,
): ActionAnimationHandle {
  const firstAnimation = animateAction(target, actor, defender, actionId, direction, weaponClass, playerSettings, options);

  if (!repeat || !isDoubleStrikeAnimationAction(actionId)) {
    return firstAnimation;
  }

  let secondAnimationPromise: Promise<ActionAnimationHandle> | undefined;
  const getSecondAnimation = (): Promise<ActionAnimationHandle> => {
    secondAnimationPromise ??= firstAnimation.done.then(() =>
      animateAction(target, actor, defender, actionId, direction, weaponClass, playerSettings, {
        ...options,
        variantSeed: `${options.variantSeed ?? actionId}:double`,
      }),
    );

    return secondAnimationPromise;
  };

  const firstImpact = firstAnimation.impact ?? firstAnimation.done;
  const secondImpact = getSecondAnimation().then((secondAnimation) => secondAnimation.impact ?? secondAnimation.done);

  return {
    done: getSecondAnimation().then((secondAnimation) => secondAnimation.done),
    impact: secondImpact,
    impacts: [firstImpact, secondImpact],
  };
}

function animateCombatActionSequence(
  target: Phaser.Scene,
  actor: FighterVisual,
  traces: readonly CombatActionTrace[],
  getDefender: (trace: CombatActionTrace) => FighterVisual,
  direction: "left" | "right",
  weaponClass?: HeroWeaponClass,
  playerSettings = getPlayerSettings(),
  options: ActionAnimationOptions = {},
  repeat = false,
): ActionAnimationHandle {
  const [firstTrace, ...remainingTraces] = traces;

  if (!firstTrace) {
    return { done: Promise.resolve() };
  }

  if (remainingTraces.length === 0) {
    return animateActionSequence(target, actor, getDefender(firstTrace), firstTrace.actionId, direction, weaponClass, playerSettings, options, repeat);
  }

  let finalAnimationPromise: Promise<ActionAnimationHandle> | undefined;
  const firstAnimation = animateActionSequence(
    target,
    actor,
    getDefender(firstTrace),
    firstTrace.actionId,
    direction,
    weaponClass,
    playerSettings,
    {
      ...options,
      variantSeed: `${options.variantSeed ?? firstTrace.actionId}:0:${firstTrace.actionId}`,
    },
  );

  const getFinalAnimation = (): Promise<ActionAnimationHandle> => {
    finalAnimationPromise ??= firstAnimation.done.then(() =>
      animateCombatActionSequence(
        target,
        actor,
        remainingTraces,
        getDefender,
        direction,
        weaponClass,
        playerSettings,
        {
          ...options,
          variantSeed: `${options.variantSeed ?? firstTrace.actionId}:${traces.length - remainingTraces.length}:${remainingTraces[0]?.actionId ?? firstTrace.actionId}`,
        },
        repeat,
      ),
    );

    return finalAnimationPromise;
  };

  return {
    done: getFinalAnimation().then((finalAnimation) => finalAnimation.done),
    impact: getFinalAnimation().then((finalAnimation) => finalAnimation.impact ?? finalAnimation.done),
    impacts: [
      getFinalAnimation().then((finalAnimation) => finalAnimation.impacts?.[0] ?? finalAnimation.impact ?? finalAnimation.done),
      getFinalAnimation().then((finalAnimation) => finalAnimation.impacts?.[1] ?? finalAnimation.impacts?.[0] ?? finalAnimation.impact ?? finalAnimation.done),
    ],
    speedUp: (multiplier) => {
      void getFinalAnimation().then((finalAnimation) => finalAnimation.speedUp?.(multiplier));
    },
  };
}

function isDoubleStrikeAnimationAction(actionId: ActionId): boolean {
  return actionId === "light" || actionId === "medium" || actionId === "heavy";
}

function animateAction(
  target: Phaser.Scene,
  actor: FighterVisual,
  defender: FighterVisual,
  actionId: ActionId,
  direction: "left" | "right",
  weaponClass?: HeroWeaponClass,
  playerSettings = getPlayerSettings(),
  options: ActionAnimationOptions = {},
): ActionAnimationHandle {
  const sign = direction === "right" ? 1 : -1;
  const animationAmount = getArenaAnimationAmount();
  const variantSeed = options.variantSeed ?? `${actionId}:${direction}:${weaponClass ?? "none"}`;

  if (actionId === "forward" || actionId === "back") {
    const actionAnimation = playBodyAnimationOnce(
      target,
      actor,
      pickActiveBodyAnimationVariant("walkCycle", actor.paperDollRig?.bodyPresetKey, weaponClass, variantSeed),
    );

    return { done: actionAnimation };
  }

  if (actionId === "lunge") {
    const animation = pickActiveBodyAnimationVariant("lunge", actor.paperDollRig?.bodyPresetKey, weaponClass, variantSeed);
    const bodyAnimation = playBodyAnimationOnceHandle(target, actor, animation);

    return {
      done: bodyAnimation.done,
      impact: createSceneDelay(target, getBodyAnimationImpactDelayMs(animation, LUNGE_ACTION_IMPACT_PROGRESS)),
      speedUp: bodyAnimation.speedUp,
    };
  }

  if (actionId === "taunt") {
    return { done: playBodyAnimationOnce(target, actor, getActiveBodyAnimation("taunt", actor.paperDollRig?.bodyPresetKey)) };
  }

  if (actionId === "rest") {
    return {
      done: playBodyAnimationOnce(target, actor, getActiveBodyAnimation("rest", actor.paperDollRig?.bodyPresetKey), {
        ...((options.loopRestAfterComplete ?? true) ? { loopAfterComplete: "rest" } : {}),
        speedMultiplier: REST_BODY_ANIMATION_SPEED_MULTIPLIER,
      }),
    };
  }

  if (actionId === "switchWeapon") {
    resetFighterBodyIdleAnimation(actor, target.time.now);
    showFloatingText(target, actor.body.x, actor.body.y - 120, "MELEE", "#ffe7a4");
    return { done: Promise.resolve() };
  }

  const scrollCastTiming = SCROLL_CAST_ACTION_TIMINGS[actionId];
  if (scrollCastTiming) {
    return animateScrollCastAction(target, actor, defender, direction, actionId, weaponClass, variantSeed, scrollCastTiming);
  }

  if (actionId === "shuriken") {
    const bodyAnimation = playBodyAnimationOnce(
      target,
      actor,
      pickActiveBodyAnimationVariant("bowShot", actor.paperDollRig?.bodyPresetKey, "shuriken", variantSeed),
    );
    const projectileAnimation = playProjectile(target, actor, defender, actionId, direction);

    return {
      done: Promise.all([bodyAnimation, projectileAnimation.done]).then(() => undefined),
      impact: projectileAnimation.impact,
    };
  }

  const actionAnimations: Promise<void>[] = [];
  let impact: Promise<void> | undefined;

  if (isAttackBodyAnimationKey(actionId)) {
    const isRangedWeapon = isRangedWeaponClass(weaponClass);
    const bodyAnimationKey: BodyAnimationKey = isRangedWeapon ? "bowShot" : actionId;
    const bodyAnimation = pickActiveBodyAnimationVariant(bodyAnimationKey, actor.paperDollRig?.bodyPresetKey, weaponClass, variantSeed);

    actionAnimations.push(playBodyAnimationOnce(target, actor, bodyAnimation));
    if (isRangedWeapon) {
      const projectileAnimation = playProjectile(target, actor, defender, actionId, direction);

      actionAnimations.push(projectileAnimation.done);
      impact = projectileAnimation.impact;
    } else {
      const timeline = getMeleeActionTimeline(actionId, bodyAnimation);

      impact = createSceneDelay(target, timeline.impactDelayMs);
      actionAnimations.push(impact);
      actionAnimations.push(playWeaponSwing(target, actor, sign, animationAmount, timeline));
      if (areArenaVfxEnabled(playerSettings)) {
        void impact.then(() => showSlashArc(target, actor, actionId, direction, playerSettings));
      }
    }
  }

  return {
    done: Promise.all(actionAnimations).then(() => undefined),
    impact,
  };
}

function animateScrollCastAction(
  target: Phaser.Scene,
  actor: FighterVisual,
  defender: FighterVisual,
  direction: "left" | "right",
  actionId: ActionId,
  weaponClass: HeroWeaponClass | undefined,
  variantSeed: string,
  timing: ScrollCastActionTiming,
): ActionAnimationHandle {
  const animation = pickActiveBodyAnimationVariant("scrollCast", actor.paperDollRig?.bodyPresetKey, weaponClass, variantSeed);

  if (!actor.paperDollRig || !animation.enabled || getArenaAnimationAmount() <= 0) {
    resetFighterBodyIdleAnimation(actor, target.time.now);

    return {
      done: createSceneDelay(target, timing.doneDelayMs),
      impact: createSceneDelay(target, timing.impactDelayMs),
    };
  }

  const previousScrollCastPropAssetKey = actor.scrollCastPropAssetKey;

  actor.scrollCastPropAssetKey = timing.propAssetKey;
  const bodyAnimation = playBodyAnimationOnceHandle(target, actor, animation);
  void bodyAnimation.done.finally(() => {
    if (actor.scrollCastPropAssetKey === timing.propAssetKey) {
      actor.scrollCastPropAssetKey = previousScrollCastPropAssetKey;
    }
  });
  const impactDelayMs = getBodyAnimationImpactKeyframe(animation)
    ? getBodyAnimationImpactDelayMs(animation, timing.impactProgress)
    : timing.impactDelayMs;
  const projectileAnimation = actionId === "fireball"
    ? playFireballProjectileFromScroll(target, actor, defender, direction, impactDelayMs)
    : undefined;
  const impact = projectileAnimation?.impact ?? createSceneDelay(target, impactDelayMs);
  if (actionId === "ward") {
    void impact.then(() => playWardShieldEffect(target, actor, "cast"));
  }

  return {
    done: Promise.all([bodyAnimation.done, projectileAnimation?.done ?? Promise.resolve()]).then(() => undefined),
    impact,
    speedUp: bodyAnimation.speedUp,
  };
}

function getMeleeActionTimeline(actionId: AttackBodyAnimationKey, animation: BodyAnimationTuning): {
  impactDelayMs: number;
  weaponSwingDurationMs: number;
  weaponAngle: number;
} {
  const timing = MELEE_ACTION_TIMINGS[actionId];
  const duration = Math.max(1, animation.duration);

  return {
    impactDelayMs: getBodyAnimationImpactDelayMs(animation, timing.impactProgress),
    weaponSwingDurationMs: Math.max(1, Math.round(duration * timing.weaponSwingProgress)),
    weaponAngle: timing.weaponAngle,
  };
}

function getBodyAnimationImpactDelayMs(animation: BodyAnimationTuning, impactProgress: number): number {
  const duration = Math.max(1, animation.duration);
  const impactKeyframe = getBodyAnimationImpactKeyframe(animation);

  if (impactKeyframe) {
    return Math.max(1, Math.round(clampNumber(impactKeyframe.time, 0, duration)));
  }

  return Math.max(1, Math.round(duration * impactProgress));
}

function getBodyAnimationImpactKeyframe(animation: BodyAnimationTuning): BodyAnimationKeyframe | undefined {
  const impactKeyframeId = animation.impactKeyframeId;

  if (!impactKeyframeId) {
    return undefined;
  }

  return getBodyAnimationTimelineKeyframes(animation)?.find((keyframe) => keyframe.id === impactKeyframeId);
}

function getBodyAnimationMovementStartKeyframe(animation: BodyAnimationTuning): BodyAnimationKeyframe | undefined {
  const startKeyframeId = animation.movementStartKeyframeId;

  if (!startKeyframeId) {
    return undefined;
  }

  return getBodyAnimationTimelineKeyframes(animation)?.find((keyframe) => keyframe.id === startKeyframeId);
}

function playWeaponSwing(
  target: Phaser.Scene,
  actor: FighterVisual,
  sign: number,
  animationAmount: number,
  timing: ReturnType<typeof getMeleeActionTimeline>,
): Promise<void> {
  if (animationAmount <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    target.tweens.add({
      targets: actor.sword,
      angle: actor.sword.angle - timing.weaponAngle * sign * animationAmount,
      duration: timing.weaponSwingDurationMs,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => resolve(),
    });
  });
}

function createSceneDelay(target: Phaser.Scene, durationMs: number): Promise<void> {
  if (durationMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    target.time.delayedCall(durationMs, () => resolve());
  });
}

function isAttackBodyAnimationKey(actionId: ActionId): actionId is AttackBodyAnimationKey {
  return actionId === "light" || actionId === "medium" || actionId === "heavy";
}

function queueCombatResultAnimation(
  actionAnimations: Promise<void>[],
  delay: Promise<void> | undefined,
  animateResult: () => Promise<void>,
): void {
  actionAnimations.push(delay ? delay.then(animateResult) : animateResult());
}

function queueCombatHitResultAnimations(
  target: Phaser.Scene,
  actionAnimations: Promise<void>[],
  defender: FighterVisual,
  hitResults: readonly CombatHitResult[] | undefined,
  delays: readonly (Promise<void> | undefined)[] | undefined,
  playerSettings: PlayerSettings,
): boolean {
  if (!hitResults?.length) {
    return false;
  }

  hitResults.forEach((hitResult, index) => {
    queueCombatResultAnimation(actionAnimations, getCombatHitResultDelay(delays, index), () =>
      playCombatHitResultAnimation(target, defender, hitResult, playerSettings),
    );
  });

  return true;
}

function getCombatHitResultDelay(
  delays: readonly (Promise<void> | undefined)[] | undefined,
  index: number,
): Promise<void> | undefined {
  if (!delays?.length) {
    return undefined;
  }

  return delays[index] ?? delays[delays.length - 1];
}

function playCombatHitResultAnimation(
  target: Phaser.Scene,
  defender: FighterVisual,
  hitResult: CombatHitResult,
  playerSettings: PlayerSettings,
): Promise<void> {
  if (hitResult.damage > 0) {
    showDamageResultPopupFromFighter(
      target,
      defender,
      hitResult.damage,
      hitResult.armorAbsorbed,
      hitResult.armorBroken,
      playerSettings,
    );

    return playBodyAnimationOnce(target, defender, getActiveBodyAnimation("hit", defender.paperDollRig?.bodyPresetKey));
  }

  if (hitResult.wardAbsorbed) {
    showWardAbsorbPopupFromFighter(target, defender);

    return playBodyAnimationOnce(target, defender, getActiveBodyAnimation("block", defender.paperDollRig?.bodyPresetKey));
  }

  if (hitResult.blocked) {
    showBlockPopupFromFighter(target, defender);

    return playBodyAnimationOnce(target, defender, getActiveBodyAnimation("block", defender.paperDollRig?.bodyPresetKey));
  }

  return Promise.resolve();
}

function playPoisonDamageAnimation(target: Phaser.Scene, defender: FighterVisual, damage: number): Promise<void> {
  const point = getFighterHeadPopupPoint(target, defender, getDamagePopupHeadOffsetY());

  showPoisonDamagePopup(target, point.x, point.y, damage);

  return createSceneDelay(target, 320);
}

function playProjectile(
  target: Phaser.Scene,
  actor: FighterVisual,
  defender: FighterVisual,
  actionId: ActionId,
  direction: "left" | "right",
): ProjectileAnimationHandle {
  const textureKey = getProjectileTextureKey(actionId);

  if (!target.textures.exists(textureKey)) {
    const done = Promise.resolve();

    return { done, impact: done };
  }

  const sign = direction === "right" ? 1 : -1;
  const start = getFighterProjectilePoint(target, actor, PROJECTILE_START_LOCAL_X * sign, PROJECTILE_START_LOCAL_Y);
  const end = getFighterProjectilePoint(target, defender, -PROJECTILE_TARGET_LOCAL_X * sign, PROJECTILE_TARGET_LOCAL_Y);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const flightAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const isShuriken = actionId === "shuriken";
  const source = target.textures.get(textureKey).getSourceImage() as { width?: number } | undefined;
  const sourceWidth = Math.max(1, source?.width ?? 256);
  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const screenSize = isShuriken ? SHURIKEN_PROJECTILE_SCREEN_SIZE : ARROW_PROJECTILE_SCREEN_SIZE;
  const projectileScale = (screenSize / sourceWidth) * fixedScreenScale;
  const startAngle = isShuriken ? 0 : flightAngle + ARROW_PROJECTILE_ANGLE_OFFSET;
  const endAngle = isShuriken ? 720 * sign : startAngle;
  const projectile = acquireProjectile(target, textureKey);

  projectile.setPosition(start.x, start.y);
  projectile.setDepth(38);
  projectile.setScale(projectileScale);
  projectile.setAngle(startAngle);

  let impactResolved = false;
  let resolveImpact: () => void = () => undefined;
  const impact = new Promise<void>((resolve) => {
    resolveImpact = resolve;
  });
  const resolveImpactOnce = (): void => {
    if (impactResolved) {
      return;
    }

    impactResolved = true;
    resolveImpact();
  };
  const impactDelayMs = Math.max(0, PROJECTILE_FLIGHT_DURATION_MS - PROJECTILE_IMPACT_LEAD_MS);
  const done = new Promise<void>((resolve) => {
    target.time.delayedCall(impactDelayMs, resolveImpactOnce);
    target.tweens.add({
      targets: projectile,
      x: end.x,
      y: end.y,
      angle: endAngle,
      duration: PROJECTILE_FLIGHT_DURATION_MS,
      ease: "Sine.easeInOut",
      onComplete: () => {
        resolveImpactOnce();
        releaseProjectile(target, projectile);
        resolve();
      },
    });
  });

  return { done, impact };
}

function playFireballProjectileFromScroll(
  target: Phaser.Scene,
  actor: FighterVisual,
  defender: FighterVisual,
  direction: "left" | "right",
  castImpactDelayMs: number,
): ProjectileAnimationHandle {
  const launchDelayMs = Math.max(0, castImpactDelayMs);

  if (!target.textures.exists(FIREBALL_PROJECTILE_ASSET_KEY)) {
    const done = createSceneDelay(target, launchDelayMs);

    return { done, impact: done };
  }

  const sign = direction === "right" ? 1 : -1;
  const hitDelayMs = launchDelayMs + FIREBALL_PROJECTILE_FLIGHT_DURATION_MS;
  let impactResolved = false;
  let resolveImpact: () => void = () => undefined;
  const impact = new Promise<void>((resolve) => {
    resolveImpact = resolve;
  });
  const resolveImpactOnce = (): void => {
    if (impactResolved) {
      return;
    }

    impactResolved = true;
    resolveImpact();
  };
  const done = new Promise<void>((resolve) => {
    target.time.delayedCall(launchDelayMs, () => {
      const start = getFighterScrollCastProjectilePoint(target, actor, sign);
      const end = getFighterProjectilePoint(target, defender, -PROJECTILE_TARGET_LOCAL_X * sign, PROJECTILE_TARGET_LOCAL_Y);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const flightAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const source = target.textures.get(FIREBALL_PROJECTILE_ASSET_KEY).getSourceImage() as { width?: number } | undefined;
      const sourceWidth = Math.max(1, source?.width ?? 128);
      const fixedScreenScale = 1 / getArenaEffectsLayerScale(target);
      const startScale = (FIREBALL_PROJECTILE_START_SCREEN_SIZE / sourceWidth) * fixedScreenScale;
      const endScale = (FIREBALL_PROJECTILE_END_SCREEN_SIZE / sourceWidth) * fixedScreenScale;
      const projectile = acquireProjectile(target, FIREBALL_PROJECTILE_ASSET_KEY);

      projectile.setPosition(start.x, start.y);
      projectile.setDepth(39);
      projectile.setScale(startScale);
      projectile.setAngle(flightAngle);
      projectile.setBlendMode(Phaser.BlendModes.ADD);
      target.tweens.add({
        targets: projectile,
        x: end.x,
        y: end.y,
        scaleX: endScale,
        scaleY: endScale,
        duration: FIREBALL_PROJECTILE_FLIGHT_DURATION_MS,
        ease: "Sine.easeInOut",
        onComplete: () => {
          resolveImpactOnce();
          releaseProjectile(target, projectile);
          resolve();
        },
      });
    });
    target.time.delayedCall(hitDelayMs, resolveImpactOnce);
  });

  return { done, impact };
}

function getProjectileTextureKey(actionId: ActionId): string {
  return actionId === "shuriken" ? SHURIKEN_PROJECTILE_ASSET_KEY : ARROW_ICON_ASSET_KEY;
}

function getFighterScrollCastProjectilePoint(target: Phaser.Scene, fighter: FighterVisual, sign: -1 | 1): { x: number; y: number } {
  const castProp = fighter.paperDollRig?.castProp;

  if (!castProp) {
    return getFighterProjectilePoint(target, fighter, PROJECTILE_START_LOCAL_X * sign, PROJECTILE_START_LOCAL_Y);
  }

  const matrix = castProp.getWorldTransformMatrix();
  const worldX = matrix.getX(0, 0);
  const worldY = matrix.getY(0, 0);
  const effectsLayer = getArenaEffectsLayer(target);

  if (!effectsLayer) {
    return { x: worldX, y: worldY };
  }

  const localPoint = effectsLayer.getWorldTransformMatrix().applyInverse(worldX, worldY);

  return { x: localPoint.x, y: localPoint.y };
}

function getFighterProjectilePoint(target: Phaser.Scene, fighter: FighterVisual, localOffsetX: number, localOffsetY: number): { x: number; y: number } {
  const bodyMatrix = fighter.body.getWorldTransformMatrix();
  const worldX = bodyMatrix.getX(0, 0);
  const worldY = bodyMatrix.getY(0, 0);
  const effectsLayer = getArenaEffectsLayer(target);
  const scale = PAPER_DOLL_BASE_SCALE * Math.max(0.1, fighter.debugScale);
  const offsetX = localOffsetX * scale;
  const offsetY = localOffsetY * scale;

  if (!effectsLayer) {
    return { x: worldX + offsetX, y: worldY + offsetY };
  }

  const localPoint = effectsLayer.getWorldTransformMatrix().applyInverse(worldX, worldY);

  return { x: localPoint.x + offsetX, y: localPoint.y + offsetY };
}

function getArenaEffectPools(target: Phaser.Scene): ArenaEffectPools {
  let pools = arenaEffectPoolsByScene.get(target);

  if (!pools) {
    pools = {
      floatingLabels: [],
      slashArcs: [],
      blockIcons: [],
      armorAbsorbPopups: [],
      armorBreakPopups: [],
      damageIconPopups: [],
      poisonDamagePopups: [],
      damageBurstPopups: [],
      damageTextPopups: [],
      restRecoveryPopups: [],
      restZzzIcons: [],
      projectiles: [],
      wardShields: [],
      dustDots: [],
    };
    arenaEffectPoolsByScene.set(target, pools);
  }

  return pools;
}

function acquireProjectile(target: Phaser.Scene, textureKey: string): Phaser.GameObjects.Image {
  const pool = getArenaEffectPools(target).projectiles;
  const projectile = pool.pop() ?? createPooledProjectile(target, textureKey);

  target.tweens.killTweensOf(projectile);
  projectile.setTexture(textureKey);
  projectile.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);

  return projectile;
}

function createPooledProjectile(target: Phaser.Scene, textureKey: string): Phaser.GameObjects.Image {
  const projectile = target.add.image(0, 0, textureKey).setOrigin(0.5).setActive(false).setVisible(false);

  addToArenaEffectsLayer(target, projectile);

  return projectile;
}

function releaseProjectile(target: Phaser.Scene, projectile: Phaser.GameObjects.Image): void {
  projectile.setActive(false).setVisible(false).setAlpha(1).setBlendMode(Phaser.BlendModes.NORMAL);
  getArenaEffectPools(target).projectiles.push(projectile);
}

function acquireWardShield(target: Phaser.Scene): Phaser.GameObjects.Image {
  const pool = getArenaEffectPools(target).wardShields;
  const shield = pool.pop() ?? createPooledWardShield(target);

  target.tweens.killTweensOf(shield);
  shield.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);

  return shield;
}

function createPooledWardShield(target: Phaser.Scene): Phaser.GameObjects.Image {
  const shield = target.add
    .image(0, 0, WARD_SHIELD_EFFECT_ASSET_KEY)
    .setOrigin(0.5)
    .setActive(false)
    .setVisible(false);

  addToArenaEffectsLayer(target, shield);

  return shield;
}

function releaseWardShield(target: Phaser.Scene, shield: Phaser.GameObjects.Image): void {
  shield.setActive(false).setVisible(false).setAlpha(1).setBlendMode(Phaser.BlendModes.NORMAL);
  getArenaEffectPools(target).wardShields.push(shield);
}

function acquireFloatingTextLabel(target: Phaser.Scene): Phaser.GameObjects.Text {
  const pool = getArenaEffectPools(target).floatingLabels;
  const label = pool.pop() ?? createFloatingTextLabel(target);

  target.tweens.killTweensOf(label);
  label.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);

  return label;
}

function createFloatingTextLabel(target: Phaser.Scene): Phaser.GameObjects.Text {
  const label = target.add
    .text(0, 0, "", {
      color: "#ffe7a4",
      fontFamily: "Georgia",
      fontSize: "24px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setActive(false)
    .setVisible(false);

  addToArenaEffectsLayer(target, label);

  return label;
}

function releaseFloatingTextLabel(target: Phaser.Scene, label: Phaser.GameObjects.Text): void {
  label.setActive(false).setVisible(false).setAlpha(1);
  getArenaEffectPools(target).floatingLabels.push(label);
}

function acquireSlashArc(target: Phaser.Scene): Phaser.GameObjects.Graphics {
  const pool = getArenaEffectPools(target).slashArcs;
  const slash = pool.pop() ?? createPooledSlashArc(target);

  target.tweens.killTweensOf(slash);
  slash.clear();
  slash.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);

  return slash;
}

function createPooledSlashArc(target: Phaser.Scene): Phaser.GameObjects.Graphics {
  const slash = target.add.graphics().setActive(false).setVisible(false);

  addToArenaEffectsLayer(target, slash);

  return slash;
}

function releaseSlashArc(target: Phaser.Scene, slash: Phaser.GameObjects.Graphics): void {
  slash.clear();
  slash.setActive(false).setVisible(false).setAlpha(1);
  getArenaEffectPools(target).slashArcs.push(slash);
}

function acquireBlockPopupIcon(target: Phaser.Scene): Phaser.GameObjects.Image {
  const pool = getArenaEffectPools(target).blockIcons;
  const icon = pool.pop() ?? createPooledBlockPopupIcon(target);

  target.tweens.killTweensOf(icon);
  icon.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);

  return icon;
}

function createPooledBlockPopupIcon(target: Phaser.Scene): Phaser.GameObjects.Image {
  const icon = target.add
    .image(0, 0, DAMAGE_BLOCK_ICON_ASSET_KEY)
    .setOrigin(0.5)
    .setActive(false)
    .setVisible(false);

  addToArenaEffectsLayer(target, icon);

  return icon;
}

function releaseBlockPopupIcon(target: Phaser.Scene, icon: Phaser.GameObjects.Image): void {
  icon.setActive(false).setVisible(false).setAlpha(1);
  getArenaEffectPools(target).blockIcons.push(icon);
}

function acquireArmorAbsorbPopup(target: Phaser.Scene): ArenaIconTextPopupVisual {
  const pool = getArenaEffectPools(target).armorAbsorbPopups;
  const popup = pool.pop() ?? createIconTextPopup(target, DAMAGE_ARMOR_ABSORB_ICON_ASSET_KEY, -10, {
    color: "#f7fbff",
    fontFamily: "Georgia",
    fontSize: "28px",
    fontStyle: "900",
    stroke: "#1b3040",
    strokeThickness: 5,
  });

  resetIconTextPopup(target, popup);

  return popup;
}

function releaseArmorAbsorbPopup(target: Phaser.Scene, popup: ArenaIconTextPopupVisual): void {
  releaseIconTextPopup(target, popup, getArenaEffectPools(target).armorAbsorbPopups);
}

function acquireArmorBreakPopup(target: Phaser.Scene): ArenaIconTextPopupVisual {
  const pool = getArenaEffectPools(target).armorBreakPopups;
  const popup = pool.pop() ?? createIconTextPopup(target, DAMAGE_ARMOR_BREAK_ICON_ASSET_KEY, -8, {
    color: "#fff4cf",
    fontFamily: "Georgia",
    fontSize: "30px",
    fontStyle: "900",
    stroke: "#35180d",
    strokeThickness: 5,
  });

  resetIconTextPopup(target, popup);

  return popup;
}

function releaseArmorBreakPopup(target: Phaser.Scene, popup: ArenaIconTextPopupVisual): void {
  releaseIconTextPopup(target, popup, getArenaEffectPools(target).armorBreakPopups);
}

function acquireDamageIconPopup(target: Phaser.Scene): ArenaIconTextPopupVisual {
  const pool = getArenaEffectPools(target).damageIconPopups;
  const popup = pool.pop() ?? createIconTextPopup(target, DAMAGE_HIT_ICON_ASSET_KEY, -2, {
    color: "#fff4cf",
    fontFamily: "Georgia",
    fontSize: "30px",
    fontStyle: "900",
    stroke: "#35180d",
    strokeThickness: 5,
  });

  resetIconTextPopup(target, popup);

  return popup;
}

function releaseDamageIconPopup(target: Phaser.Scene, popup: ArenaIconTextPopupVisual): void {
  releaseIconTextPopup(target, popup, getArenaEffectPools(target).damageIconPopups);
}

function acquirePoisonDamagePopup(target: Phaser.Scene): ArenaIconTextPopupVisual {
  const pool = getArenaEffectPools(target).poisonDamagePopups;
  const popup = pool.pop() ?? createIconTextPopup(target, POISON_DAMAGE_POPUP_ICON_ASSET_KEY, -6, {
    color: "#efffc7",
    fontFamily: "Georgia",
    fontSize: "30px",
    fontStyle: "900",
    stroke: "#243b17",
    strokeThickness: 5,
  });

  resetIconTextPopup(target, popup);

  return popup;
}

function releasePoisonDamagePopup(target: Phaser.Scene, popup: ArenaIconTextPopupVisual): void {
  releaseIconTextPopup(target, popup, getArenaEffectPools(target).poisonDamagePopups);
}

function acquireDamageTextPopup(target: Phaser.Scene): ArenaTextPopupVisual {
  const pool = getArenaEffectPools(target).damageTextPopups;
  const popup = pool.pop() ?? createDamageTextPopup(target);

  target.tweens.killTweensOf(popup.container);
  popup.container.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);

  return popup;
}

function createDamageTextPopup(target: Phaser.Scene): ArenaTextPopupVisual {
  const container = target.add.container(0, 0).setDepth(40).setActive(false).setVisible(false);
  const label = target.add
    .text(0, -2, "", {
      color: "#fff4cf",
      fontFamily: "Georgia",
      fontSize: "30px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 5,
    })
    .setOrigin(0.5);

  container.add(label);
  addToArenaEffectsLayer(target, container);

  return { container, label };
}

function releaseDamageTextPopup(target: Phaser.Scene, popup: ArenaTextPopupVisual): void {
  popup.container.setActive(false).setVisible(false).setAlpha(1);
  getArenaEffectPools(target).damageTextPopups.push(popup);
}

function acquireRestRecoveryPopup(target: Phaser.Scene): ArenaRestRecoveryPopupVisual {
  const pool = getArenaEffectPools(target).restRecoveryPopups;
  const popup = pool.pop() ?? createRestRecoveryPopup(target);

  target.tweens.killTweensOf(popup.container);
  popup.container.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);
  popup.healthRow.setVisible(true);
  popup.staminaRow.setVisible(true);

  return popup;
}

function createRestRecoveryPopup(target: Phaser.Scene): ArenaRestRecoveryPopupVisual {
  const container = target.add.container(0, 0).setDepth(40).setActive(false).setVisible(false);
  const healthRow = createRestRecoveryPopupRow(target, REST_HEALTH_ICON_ASSET_KEY, "#ffe2b3", "#5a160f");
  const staminaRow = createRestRecoveryPopupRow(target, REST_STAMINA_ICON_ASSET_KEY, "#b7fbff", "#10333b");

  container.add([healthRow.row, staminaRow.row]);
  addToArenaEffectsLayer(target, container);

  return {
    container,
    healthRow: healthRow.row,
    healthIcon: healthRow.icon,
    healthLabel: healthRow.label,
    staminaRow: staminaRow.row,
    staminaIcon: staminaRow.icon,
    staminaLabel: staminaRow.label,
  };
}

function createRestRecoveryPopupRow(
  target: Phaser.Scene,
  iconKey: string,
  color: string,
  stroke: string,
): { row: Phaser.GameObjects.Container; icon: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text } {
  const row = target.add.container(0, 0);
  const icon = target.add.image(-16, 0, iconKey).setOrigin(0.5);
  const label = target.add
    .text(5, 0, "", {
      color,
      fontFamily: "Georgia",
      fontSize: "30px",
      fontStyle: "900",
      stroke,
      strokeThickness: 5,
    })
    .setOrigin(0, 0.5);

  row.add([icon, label]);

  return { row, icon, label };
}

function releaseRestRecoveryPopup(target: Phaser.Scene, popup: ArenaRestRecoveryPopupVisual): void {
  popup.container.setActive(false).setVisible(false).setAlpha(1);
  popup.healthRow.setVisible(false);
  popup.staminaRow.setVisible(false);
  getArenaEffectPools(target).restRecoveryPopups.push(popup);
}

function acquireRestZzzIcon(target: Phaser.Scene): Phaser.GameObjects.Image {
  const pool = getArenaEffectPools(target).restZzzIcons;
  const icon = pool.pop() ?? createRestZzzIcon(target);

  target.tweens.killTweensOf(icon);
  icon.setTexture(REST_ZZZ_ICON_ASSET_KEY);
  icon.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);

  return icon;
}

function createRestZzzIcon(target: Phaser.Scene): Phaser.GameObjects.Image {
  const icon = target.add.image(0, 0, REST_ZZZ_ICON_ASSET_KEY).setOrigin(0.5).setActive(false).setVisible(false);

  addToArenaEffectsLayer(target, icon);

  return icon;
}

function releaseRestZzzIcon(target: Phaser.Scene, icon: Phaser.GameObjects.Image): void {
  icon.setActive(false).setVisible(false).setAlpha(1).setAngle(0).setScale(1);
  getArenaEffectPools(target).restZzzIcons.push(icon);
}

function createIconTextPopup(
  target: Phaser.Scene,
  textureKey: string,
  labelY: number,
  labelStyle: Phaser.Types.GameObjects.Text.TextStyle,
): ArenaIconTextPopupVisual {
  const container = target.add.container(0, 0).setDepth(40).setActive(false).setVisible(false);
  const icon = target.add.image(0, 0, textureKey).setOrigin(0.5);
  const label = target.add.text(0, labelY, "", labelStyle).setOrigin(0.5);

  container.add([icon, label]);
  addToArenaEffectsLayer(target, container);

  return { container, icon, label };
}

function resetIconTextPopup(target: Phaser.Scene, popup: ArenaIconTextPopupVisual): void {
  target.tweens.killTweensOf(popup.container);
  popup.container.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);
}

function releaseIconTextPopup(
  target: Phaser.Scene,
  popup: ArenaIconTextPopupVisual,
  pool: ArenaIconTextPopupVisual[],
): void {
  popup.container.setActive(false).setVisible(false).setAlpha(1);
  pool.push(popup);
}

function acquireDamageBurstPopup(target: Phaser.Scene): ArenaDamageBurstPopupVisual {
  const pool = getArenaEffectPools(target).damageBurstPopups;
  const popup = pool.pop() ?? createDamageBurstPopup(target);

  target.tweens.killTweensOf(popup.container);
  popup.container.setActive(true).setVisible(true).setAlpha(1).setAngle(0).setScale(1);

  return popup;
}

function createDamageBurstPopup(target: Phaser.Scene): ArenaDamageBurstPopupVisual {
  const container = target.add.container(0, 0).setDepth(40).setActive(false).setVisible(false);
  const shadow = target.add.graphics();
  const burst = target.add.graphics();
  const label = target.add
    .text(0, -2, "", {
      color: "#fff4cf",
      fontFamily: "Georgia",
      fontSize: "30px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 5,
    })
    .setOrigin(0.5);

  drawDamageBurst(shadow, 4, 5, 0x35180d, 0.92);
  drawDamageBurst(burst, 0, 0, 0xd52b1f, 1);
  container.add([shadow, burst, label]);
  addToArenaEffectsLayer(target, container);

  return { container, shadow, burst, label };
}

function releaseDamageBurstPopup(target: Phaser.Scene, popup: ArenaDamageBurstPopupVisual): void {
  popup.container.setActive(false).setVisible(false).setAlpha(1);
  getArenaEffectPools(target).damageBurstPopups.push(popup);
}

function acquireDustDot(target: Phaser.Scene): Phaser.GameObjects.Arc {
  const pool = getArenaEffectPools(target).dustDots;
  const dot = pool.pop() ?? createPooledDustDot(target);

  target.tweens.killTweensOf(dot);
  dot.setActive(true).setVisible(true).setAlpha(0.72).setScale(1);

  return dot;
}

function createPooledDustDot(target: Phaser.Scene): Phaser.GameObjects.Arc {
  const dot = target.add.circle(0, 0, 1, 0xf0bd72, 0.72).setActive(false).setVisible(false);

  addToArenaEffectsLayer(target, dot);

  return dot;
}

function releaseDustDot(target: Phaser.Scene, dot: Phaser.GameObjects.Arc): void {
  dot.setActive(false).setVisible(false).setAlpha(0.72);
  getArenaEffectPools(target).dustDots.push(dot);
}

function showSlashArc(
  target: Phaser.Scene,
  actor: FighterVisual,
  actionId: AttackBodyAnimationKey,
  direction: "left" | "right",
  playerSettings = getPlayerSettings(),
): void {
  if (!areArenaVfxEnabled(playerSettings)) {
    return;
  }

  const config = getActiveSlashArc(actionId);
  const sign = direction === "right" ? 1 : -1;
  const visualScale = Math.max(0.65, Math.min(1.45, actor.debugScale / 0.3));
  const x = actor.body.x + sign * config.offsetX * visualScale;
  const y = actor.body.y + config.offsetY * visualScale;
  const slash = acquireSlashArc(target);

  slash.setPosition(x, y);
  slash.setDepth(SLASH_ARC_DEPTH);
  slash.setAlpha(config.alpha);
  slash.setBlendMode(Phaser.BlendModes.ADD);
  slash.setAngle(config.angle * sign);
  slash.setScale(sign * 0.82 * visualScale, 0.82 * visualScale);

  drawSlashArc(slash, config);

  target.tweens.add({
    targets: slash,
    alpha: 0,
    scaleX: sign * 1.22 * visualScale,
    scaleY: 1.22 * visualScale,
    angle: slash.angle + config.sweep * sign,
    duration: config.duration,
    ease: "Quad.easeOut",
    onComplete: () => releaseSlashArc(target, slash),
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

function playWardShieldEffect(
  target: Phaser.Scene,
  fighter: FighterVisual,
  phase: "cast" | "absorb" = "cast",
  options: { force?: boolean } = {},
): Promise<void> {
  if ((!options.force && !areArenaVfxEnabled()) || !target.textures.exists(WARD_SHIELD_EFFECT_ASSET_KEY)) {
    return Promise.resolve();
  }

  const config = getActiveWardShieldTuning();
  const durationMs = phase === "absorb" ? config.absorbDurationMs : config.castDurationMs;
  const source = target.textures.get(WARD_SHIELD_EFFECT_ASSET_KEY).getSourceImage() as { height?: number } | undefined;
  const sourceHeight = Math.max(1, source?.height ?? 320);
  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const displayHeight = getWardShieldDisplayHeight(fighter, config);
  const shieldScale = (displayHeight / sourceHeight) * fixedScreenScale;
  const point = getFighterWardShieldEffectPoint(target, fighter, displayHeight, config);
  const shield = acquireWardShield(target);
  const fadeInMs = Math.min(config.fadeInMs, Math.max(1, durationMs - 1));
  const fadeOutDurationMs = Math.max(1, durationMs - fadeInMs);

  shield.setPosition(point.x, point.y);
  shield.setDepth(WARD_SHIELD_EFFECT_DEPTH);
  shield.setScale(shieldScale * config.startScale);
  shield.setAlpha(0);
  shield.setBlendMode(Phaser.BlendModes.ADD);

  return new Promise<void>((resolve) => {
    target.tweens.add({
      targets: shield,
      alpha: config.alpha,
      scaleX: shieldScale,
      scaleY: shieldScale,
      duration: fadeInMs,
      ease: "Quad.easeOut",
    });
    target.time.delayedCall(fadeInMs, () => {
      target.tweens.add({
        targets: shield,
        alpha: 0,
        scaleX: shieldScale * config.endScale,
        scaleY: shieldScale * config.endScale,
        duration: fadeOutDurationMs,
        ease: "Sine.easeOut",
        onComplete: () => {
          releaseWardShield(target, shield);
          resolve();
        },
      });
    });
  });
}

function getWardShieldDisplayHeight(fighter: FighterVisual, config: WardShieldTuning): number {
  const scaleMultiplier = clampNumber(fighter.debugScale, WARD_SHIELD_MIN_SCALE_MULTIPLIER, WARD_SHIELD_MAX_SCALE_MULTIPLIER);

  return WARD_SHIELD_BASE_SCREEN_HEIGHT * config.scale * scaleMultiplier;
}

function getFighterWardShieldEffectPoint(
  target: Phaser.Scene,
  fighter: FighterVisual,
  displayHeight: number,
  config: WardShieldTuning,
): { x: number; y: number } {
  const bodyMatrix = fighter.body.getWorldTransformMatrix();
  const worldX = bodyMatrix.getX(0, 0);
  const worldY = bodyMatrix.getY(0, 0);
  const effectsLayer = getArenaEffectsLayer(target);
  const layerScale = getArenaEffectsLayerScale(target);
  const centerOffsetY = (displayHeight * WARD_SHIELD_CENTER_Y_RATIO) / layerScale;
  const offsetX = config.offsetX / layerScale;
  const offsetY = config.offsetY / layerScale;

  if (!effectsLayer) {
    return { x: worldX + offsetX, y: worldY - centerOffsetY + offsetY };
  }

  const localPoint = effectsLayer.getWorldTransformMatrix().applyInverse(worldX, worldY);

  return { x: localPoint.x + offsetX, y: localPoint.y - centerOffsetY + offsetY };
}

function showFloatingText(target: Phaser.Scene, x: number, y: number, text: string, color: string): void {
  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const liftY = 48 / layerScale;
  const label = acquireFloatingTextLabel(target);

  label.setPosition(x, y);
  setPhaserTextIfChanged(label, text);
  label.setColor(color);
  label.setScale(fixedScreenScale);
  target.tweens.add({
    targets: label,
    y: y - liftY,
    alpha: 0,
    duration: 720,
    ease: "Quad.easeOut",
    onComplete: () => releaseFloatingTextLabel(target, label),
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

function showWardAbsorbPopupFromFighter(target: Phaser.Scene, fighter: FighterVisual): void {
  void playWardShieldEffect(target, fighter, "absorb");
}

function showDamagePopupFromFighter(
  target: Phaser.Scene,
  fighter: FighterVisual,
  amount: number,
  screenOffsetX = 0,
  playerSettings = getPlayerSettings(),
): void {
  if (amount <= 0) {
    return;
  }

  const point = getFighterHeadPopupPoint(target, fighter, getDamagePopupHeadOffsetY());

  showDamagePopup(target, getPopupXWithScreenOffset(target, point.x, screenOffsetX), point.y, amount, playerSettings);
}

function showDamageResultPopupFromFighter(
  target: Phaser.Scene,
  fighter: FighterVisual,
  totalDamage: number,
  armorAbsorbed: number,
  armorBroken: boolean,
  playerSettings = getPlayerSettings(),
): void {
  if (armorBroken) {
    showArmorBreakPopupFromFighter(target, fighter, totalDamage);
    return;
  }

  if (armorAbsorbed > 0) {
    showArmorAbsorbPopupFromFighter(target, fighter, armorAbsorbed);
    return;
  }

  showDamagePopupFromFighter(target, fighter, getHealthPopupDamage(totalDamage, armorAbsorbed), 0, playerSettings);
}

function showArmorAbsorbPopupFromFighter(target: Phaser.Scene, fighter: FighterVisual, amount: number, screenOffsetX = 0): void {
  const point = getFighterHeadPopupPoint(target, fighter, getArmorAbsorbPopupHeadOffsetY());

  showArmorAbsorbPopup(target, getPopupXWithScreenOffset(target, point.x, screenOffsetX), point.y, amount);
}

function showArmorBreakPopupFromFighter(target: Phaser.Scene, fighter: FighterVisual, amount: number, screenOffsetX = 0): void {
  const point = getFighterHeadPopupPoint(target, fighter, getArmorBreakPopupHeadOffsetY());

  showArmorBreakPopup(target, getPopupXWithScreenOffset(target, point.x, screenOffsetX), point.y, amount);
}

function showRestRecoveryPopupFromFighter(
  target: Phaser.Scene,
  fighter: FighterVisual,
  previous: FighterState | undefined,
  current: FighterState,
): void {
  if (!previous) {
    return;
  }

  const healthGain = Math.max(0, current.hp - previous.hp);
  const staminaGain = Math.max(0, current.stamina - previous.stamina);

  if (healthGain <= 0 && staminaGain <= 0) {
    return;
  }

  const point = getFighterHeadPopupPoint(target, fighter, getRestRecoveryPopupHeadOffsetY());

  showRestRecoveryPopup(target, point.x, point.y, healthGain, staminaGain);
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

function getRestRecoveryPopupHeadOffsetY(): number {
  return getDamagePopupHeadOffsetY() - 18;
}

function updateRestZzzEffects(target: Phaser.Scene, fighter: FighterVisual, time: number): void {
  if (fighter.isShattered || fighter.bodyIdleAnimationKey !== "rest" || (fighter.bodyAnimationLockedUntil ?? 0) > time) {
    return;
  }

  if (!target.textures.exists(REST_ZZZ_ICON_ASSET_KEY)) {
    return;
  }

  if (fighter.restZzzNextSpawnAt === undefined || time >= fighter.restZzzNextSpawnAt) {
    showRestZzzIconFromFighter(target, fighter, fighter.restZzzSpawnIndex ?? 0);
    fighter.restZzzSpawnIndex = (fighter.restZzzSpawnIndex ?? 0) + 1;
    fighter.restZzzNextSpawnAt = time + REST_ZZZ_SPAWN_INTERVAL_MS;
  }
}

function showRestZzzIconFromFighter(target: Phaser.Scene, fighter: FighterVisual, spawnIndex: number): void {
  const source = target.textures.get(REST_ZZZ_ICON_ASSET_KEY).getSourceImage() as { width?: number } | undefined;
  const sourceWidth = Math.max(1, source?.width ?? 128);
  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const iconScale = (REST_ZZZ_ICON_SCREEN_SIZE / sourceWidth) * fixedScreenScale;
  const offsetX = (REST_ZZZ_SIDE_OFFSETS[spawnIndex % REST_ZZZ_SIDE_OFFSETS.length] ?? 0) / layerScale;
  const driftX = (REST_ZZZ_DRIFT_X[spawnIndex % REST_ZZZ_DRIFT_X.length] ?? 0) / layerScale;
  const liftY = REST_ZZZ_LIFT_Y / layerScale;
  const point = getFighterHeadPopupPoint(target, fighter, REST_ZZZ_HEAD_OFFSET_Y);
  const icon = acquireRestZzzIcon(target);

  icon.setPosition(point.x + offsetX, point.y);
  icon.setDepth(39);
  icon.setScale(iconScale * 0.72);
  icon.setAlpha(0.92);

  target.tweens.add({
    targets: icon,
    x: point.x + offsetX + driftX,
    y: point.y - liftY,
    alpha: 0,
    scale: iconScale,
    duration: REST_ZZZ_LIFETIME_MS,
    ease: "Sine.easeOut",
    onComplete: () => releaseRestZzzIcon(target, icon),
  });
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
  const icon = acquireBlockPopupIcon(target);

  icon.setPosition(x, y);
  icon.setDepth(40);
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
    onComplete: () => releaseBlockPopupIcon(target, icon),
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
  const popup = acquireArmorAbsorbPopup(target);

  popup.container.setPosition(x, y).setDepth(40);
  setPhaserTextIfChanged(popup.label, `${amount}`);
  popup.icon.setScale(DAMAGE_ARMOR_ABSORB_POPUP_SCREEN_SIZE / sourceWidth);
  popup.container.setScale(startScale);
  popup.container.setAngle(-3);

  target.tweens.add({
    targets: popup.container,
    scale: endScale,
    angle: 2,
    duration: 140,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popup.container,
    y: y - liftY,
    alpha: 0,
    duration: 700,
    delay: 180,
    ease: "Quad.easeIn",
    onComplete: () => releaseArmorAbsorbPopup(target, popup),
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
  const popup = acquireArmorBreakPopup(target);

  popup.container.setPosition(x, y).setDepth(40);
  setPhaserTextIfChanged(popup.label, `${amount}`);
  popup.icon.setScale(DAMAGE_ARMOR_BREAK_POPUP_SCREEN_SIZE / sourceWidth);
  popup.container.setScale(startScale);
  popup.container.setAngle(-6);

  target.tweens.add({
    targets: popup.container,
    scale: endScale,
    angle: 3,
    duration: 150,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popup.container,
    y: y - liftY,
    alpha: 0,
    duration: 760,
    delay: 180,
    ease: "Quad.easeOut",
    onComplete: () => releaseArmorBreakPopup(target, popup),
  });
}

function showPoisonDamagePopup(target: Phaser.Scene, x: number, y: number, amount: number): void {
  if (!target.textures.exists(POISON_DAMAGE_POPUP_ICON_ASSET_KEY)) {
    return;
  }

  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const popupScale = getDamagePopupScale();
  const liftY = 36 / layerScale;
  const source = target.textures.get(POISON_DAMAGE_POPUP_ICON_ASSET_KEY).getSourceImage() as { width?: number } | undefined;
  const sourceWidth = Math.max(1, source?.width ?? 256);
  const endScale = fixedScreenScale * popupScale;
  const startScale = endScale * 0.74;
  const popup = acquirePoisonDamagePopup(target);

  popup.container.setPosition(x, y).setDepth(40);
  setPhaserTextIfChanged(popup.label, `${amount}`);
  popup.icon.setScale(POISON_DAMAGE_POPUP_ICON_SCREEN_SIZE / sourceWidth);
  popup.container.setScale(startScale);
  popup.container.setAngle(-4);

  target.tweens.add({
    targets: popup.container,
    scale: endScale,
    angle: 2,
    duration: 140,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popup.container,
    y: y - liftY,
    alpha: 0,
    duration: 700,
    delay: 180,
    ease: "Quad.easeOut",
    onComplete: () => releasePoisonDamagePopup(target, popup),
  });
}

function showRestRecoveryPopup(target: Phaser.Scene, x: number, y: number, healthGain: number, staminaGain: number): void {
  const hasHealth = healthGain > 0 && target.textures.exists(REST_HEALTH_ICON_ASSET_KEY);
  const hasStamina = staminaGain > 0 && target.textures.exists(REST_STAMINA_ICON_ASSET_KEY);

  if (!hasHealth && !hasStamina) {
    return;
  }

  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const popupScale = debugTuning.popupScale;
  const endScale = fixedScreenScale * popupScale;
  const startScale = endScale * 0.76;
  const liftY = 40 / layerScale;
  const popup = acquireRestRecoveryPopup(target);
  const hasBothRows = hasHealth && hasStamina;

  popup.container.setPosition(x, y).setDepth(40);
  popup.container.setScale(startScale);
  popup.container.setAngle(0);

  setRestRecoveryPopupRow(
    target,
    popup.healthRow,
    popup.healthIcon,
    popup.healthLabel,
    REST_HEALTH_ICON_ASSET_KEY,
    hasHealth ? healthGain : 0,
    hasBothRows ? -17 : 0,
  );
  setRestRecoveryPopupRow(
    target,
    popup.staminaRow,
    popup.staminaIcon,
    popup.staminaLabel,
    REST_STAMINA_ICON_ASSET_KEY,
    hasStamina ? staminaGain : 0,
    hasBothRows ? 17 : 0,
  );

  target.tweens.add({
    targets: popup.container,
    scale: endScale,
    duration: 130,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popup.container,
    y: y - liftY,
    alpha: 0,
    duration: 700,
    delay: 220,
    ease: "Quad.easeOut",
    onComplete: () => releaseRestRecoveryPopup(target, popup),
  });
}

function setRestRecoveryPopupRow(
  target: Phaser.Scene,
  row: Phaser.GameObjects.Container,
  icon: Phaser.GameObjects.Image,
  label: Phaser.GameObjects.Text,
  iconKey: string,
  amount: number,
  y: number,
): void {
  row.setVisible(amount > 0);

  if (amount <= 0) {
    return;
  }

  const source = target.textures.get(iconKey).getSourceImage() as { width?: number } | undefined;
  const sourceWidth = Math.max(1, source?.width ?? 256);

  row.setY(y);
  icon.setScale(REST_RECOVERY_POPUP_ICON_SCREEN_SIZE / sourceWidth);
  setPhaserTextIfChanged(label, `+${amount}`);
}

function showDamagePopup(target: Phaser.Scene, x: number, y: number, amount: number, playerSettings = getPlayerSettings()): void {
  const useBurst = areArenaVfxEnabled(playerSettings);
  const layerScale = getArenaEffectsLayerScale(target);
  const fixedScreenScale = 1 / layerScale;
  const popupScale = getDamagePopupScale();
  const startScale = (useBurst ? 0.58 : 0.9) * fixedScreenScale * popupScale;
  const endScale = fixedScreenScale * popupScale;
  const liftY = 34 / layerScale;
  let popupContainer: Phaser.GameObjects.Container;
  let releasePopup: () => void;

  if (useBurst && target.textures.exists(DAMAGE_HIT_ICON_ASSET_KEY)) {
    const source = target.textures.get(DAMAGE_HIT_ICON_ASSET_KEY).getSourceImage() as { width?: number } | undefined;
    const sourceWidth = Math.max(1, source?.width ?? 256);
    const popup = acquireDamageIconPopup(target);

    setPhaserTextIfChanged(popup.label, `${amount}`);
    popup.icon.setScale(DAMAGE_HIT_POPUP_SCREEN_SIZE / sourceWidth);
    popupContainer = popup.container;
    releasePopup = () => releaseDamageIconPopup(target, popup);
  } else if (useBurst) {
    const popup = acquireDamageBurstPopup(target);

    setPhaserTextIfChanged(popup.label, `${amount}`);
    popupContainer = popup.container;
    releasePopup = () => releaseDamageBurstPopup(target, popup);
  } else {
    const popup = acquireDamageTextPopup(target);

    setPhaserTextIfChanged(popup.label, `${amount}`);
    popupContainer = popup.container;
    releasePopup = () => releaseDamageTextPopup(target, popup);
  }

  popupContainer.setPosition(x, y).setDepth(40);
  popupContainer.setScale(startScale);
  popupContainer.setAngle(useBurst ? -4 : 0);

  target.tweens.add({
    targets: popupContainer,
    scale: endScale,
    duration: 130,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popupContainer,
    y: y - liftY,
    alpha: 0,
    duration: 680,
    delay: 180,
    ease: "Quad.easeIn",
    onComplete: releasePopup,
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
    const radius = 5 + Math.random() * 7;
    const dot = acquireDustDot(target);

    dot.setPosition(x + Math.random() * 36 - 18, y + Math.random() * 16);
    dot.setRadius(radius);
    dot.setFillStyle(0xf0bd72, 0.72);

    target.tweens.add({
      targets: dot,
      x: dot.x + Math.random() * 64 - 32,
      y: dot.y - 26 - Math.random() * 24,
      alpha: 0,
      duration: 480 + Math.random() * 180,
      onComplete: () => releaseDustDot(target, dot),
    });
  }
}

function createMovementStartDustBurst(target: Phaser.Scene, x: number, y: number, direction: -1 | 1): void {
  if (!areArenaVfxEnabled()) {
    return;
  }

  for (let i = 0; i < MOVEMENT_START_DUST_COUNT; i += 1) {
    const radius = 3 + Math.random() * 5;
    const dot = acquireDustDot(target);
    const startX = x + Math.random() * 28 - 14;
    const startY = y + Math.random() * 8 - 3;
    const driftX = direction * (24 + Math.random() * 42) + (Math.random() * 12 - 6);
    const driftY = -8 - Math.random() * 18;

    dot.setPosition(startX, startY);
    dot.setRadius(radius);
    dot.setFillStyle(0xf0bd72, 0.66);
    dot.setScale(1, 0.58 + Math.random() * 0.32);

    target.tweens.add({
      targets: dot,
      x: startX + driftX,
      y: startY + driftY,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 0.22,
      duration: 180 + Math.random() * 120,
      ease: "Quad.easeOut",
      onComplete: () => releaseDustDot(target, dot),
    });
  }
}

function getArenaAnimationAmount(): number {
  return 1;
}

function areArenaVfxEnabled(playerSettings = getPlayerSettings()): boolean {
  return playerSettings.vfxEnabled;
}

function getEffectiveArenaShadowMode(playerSettings = getPlayerSettings()): PlayerSettings["shadowMode"] {
  return isDebugTuningActive() ? debugTuning.shadowPreviewMode : playerSettings.shadowMode;
}

function getArenaShadowMode(): PlayerSettings["shadowMode"] {
  return getEffectiveArenaShadowMode();
}

function syncFighterShadowVisibility(fighter: FighterVisual, alpha: number): void {
  const shadowMode = getArenaShadowMode();
  const highShadowVisible = fighter.castsShadow && shadowMode === "high" && !fighter.isShattered;
  const lowShadowVisible = fighter.castsShadow && shadowMode === "low" && !fighter.isShattered;

  fighter.shadow.setVisible(highShadowVisible);
  fighter.shadow.setAlpha(highShadowVisible ? alpha * debugTuning.shadowAlpha : 0);
  fighter.lowShadow.setVisible(lowShadowVisible);
  fighter.lowShadow.setAlpha(lowShadowVisible ? alpha * debugTuning.lowShadowAlpha : 0);
}
