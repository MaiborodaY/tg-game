import {
  ACTION_BUTTON_OFFSET_KEYS,
  ANIMATION_EDIT_MODES,
  ANIMATION_ROOT_TRANSFORM_MODES,
  APPEARANCE_LAYER_KEYS,
  BODY_ANIMATION_DEFAULT_VARIANT_ID,
  BODY_ANIMATION_KEYS,
  BODY_ANIMATION_KEYFRAME_EASINGS,
  BODY_ANIMATION_WEAPON_CLASSES,
  CHARACTER_CANVAS_EDIT_MODES,
  CLASSIC_ACTION_WHEEL_BUTTONS,
  CLASSIC_ACTION_WHEEL_MODES,
  DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS,
  DEFAULT_BODY_ANIMATIONS,
  DEFAULT_BODY_PRESET_TUNING,
  DEFAULT_EQUIPMENT,
  DEFAULT_EQUIPMENT_ITEM_TUNING,
  debugTuning,
  defaultBodyAnimationCastProp,
  defaultBodyAnimationRootOffset,
  defaultBodyPartLayerTuning,
  defaultDebugTuning,
  defaultRigPartTuning,
  EQUIPMENT_SLOT_KEYS,
  FACE_ASSET_LAYER_KEYS,
  DEFAULT_SLASH_ARCS,
  defaultFacePartTuning,
  FACE_PART_KEYS,
  createDefaultArenaBackgroundLayerTuning,
  getDynamicArenaBackgroundLayerTuning,
  getArenaBackgroundLayerRole,
  isArenaBackgroundEditLayer,
  isSlashArcAttackKey,
  PAPER_DOLL_BODY_PRESET_OPTIONS,
  RIG_PART_ANGLE_MAX,
  RIG_PART_ANGLE_MIN,
  RIG_PART_KEYS,
  SLASH_ARC_ATTACK_KEYS,
  subscribeDebugTuning,
  undoDebugTuning,
  updateDebugTuning,
  type AnimationEditMode,
  type AnimationRootTransformMode,
  type ArenaBackgroundEditLayer,
  type ArenaBackgroundLayerRole,
  type ArenaBackgroundLayerTuning,
  type AppearanceLayerKey,
  type AppearanceLayerTuning,
  type ArenaDebugTuning,
  type BodyPartLayerTuning,
  type BodyAnimationCastPropTuning,
  type BodyAnimationKeyframe,
  type BodyAnimationKeyframeEasing,
  type BodyAnimationKey,
  type BodyAnimationRootOffset,
  type BodyAnimationTuning,
  type BodyAnimationWeaponClass,
  type BodyPresetTuning,
  type CharacterCanvasEditMode,
  type ClassicActionButtonSlotTuning,
  type ClassicActionWheelMode,
  type DebugPopupPreviewKind,
  type ActionButtonOffsetKey,
  type EquipmentSlotKey,
  type EquipmentTuning,
  type FaceAssetLayerKey,
  type FaceAssetLayerTuning,
  type FacePartKey,
  type FacePartTuning,
  type RigPartKey,
  type RigPartTuning,
  type SlashArcAttackKey,
  type SlashArcTuning,
} from "./debugTuning";
import {
  subscribeDebugCharacterEquipmentDelta,
  subscribeDebugCharacterEquipmentSelect,
  type DebugCharacterEquipmentDelta,
  type DebugCharacterEquipmentSelection,
} from "./debugCharacterEquipmentBridge";
import {
  createDefaultHeroEquipment,
  ARENA_BOSSES,
  ARENA_DIFFICULTY_IDS,
  ARENA_TIER_CONFIGS,
  ALL_HERO_ITEM_IDS,
  ENEMY_SHURIKEN_ROLL_CHANCE,
  HERO_EQUIPMENT_SLOT_KEYS,
  HERO_ITEM_CATALOG,
  getHeroItemWeaponClass,
  type ArenaDifficultyId,
  type ArenaGeneratedEquipmentPool,
  type ArenaBossDefinition,
  type ArenaTierConfig,
  type ArenaTierOpponentDefinition,
  type HeroEquipment,
  type HeroEquipmentSlotKey,
  type HeroItemDefinition,
  type HeroItemId,
  type HeroItemRarity,
  type HeroWeaponClass,
} from "./hero";
import {
  DEFAULT_ARENA_BACKGROUND_VARIANT_ID,
  getArenaBackgroundLayerAssetKeysForTier,
  getArenaBackgroundVariantIdsForTier,
  type ArenaBackgroundVariantId,
} from "./assets";
import {
  AUTO_EQUIPMENT_ITEM_CATALOG,
  AUTO_EQUIPMENT_ITEM_RECORDS,
  AUTO_EQUIPMENT_SET_IMPORT_ASSETS,
  getEquipmentSetImportAssetUrl,
  resolveEquipmentAssetUrl,
  type EquipmentSetImportAsset,
} from "./equipmentAssetRegistry";
import { GENERATED_EQUIPMENT_ITEM_RECORDS, GENERATED_EQUIPMENT_ITEM_TUNING } from "./generated/equipmentItems.generated";
import {
  removePromotedEquipmentItem,
  renameEquipmentSetAssets,
  saveArenaBoss,
  saveArenaTierBackground,
  saveArenaTier,
  saveGeneratedEquipmentItem,
  saveProdAnimation,
  saveProdDefaults,
  saveUiLayoutProdDefaults,
  savePromotedEquipmentItem,
  savePromotedEquipmentSet,
  savePromotedShieldImports,
  savePromotedWeaponImports,
  type ArenaTierBackgroundPayload,
} from "./prodDefaultsSaver";
import {
  UI_LAYOUT_SCREENS,
  UI_LAYOUT_VIEWPORTS,
  applyUiLayoutTuning,
  clearUiLayoutTuningStorage,
  getUiLayoutBlock,
  getUiLayoutControlValue,
  getUiLayoutScreen,
  resetUiLayoutBlock,
  resetUiLayoutControlValue,
  resetUiLayoutScreen,
  selectUiLayoutTuning,
  subscribeUiLayoutTuning,
  syncUiLayoutTargetHighlight,
  uiLayoutTuning,
  updateUiLayoutControlValue,
  type UiLayoutBlockConfig,
  type UiLayoutControlConfig,
  type UiLayoutScreenConfig,
  type UiLayoutViewport,
} from "./uiLayoutTuning";
import {
  DEFAULT_SCROLL_CAST_PROP_ASSET_KEY,
  SCROLL_CAST_PROP_ASSET_KEYS,
  type ScrollCastPropAssetKey,
} from "./scrollCastPropAssets";

interface DebugPanelOptions {
  heroEquipment?: HeroEquipment;
  onHeroEquipmentChange?: (equipment: HeroEquipment) => void;
  onRestartArenaTierPreview?: (tierId: number, backgroundVariantId?: ArenaBackgroundVariantId) => void;
  onPreviewSlashArc?: (actionId: SlashArcAttackKey, withBodyAnimation: boolean) => void;
  onPreviewPopup?: (kind: DebugPopupPreviewKind) => void;
}

interface DebugRangeControlConfig {
  type: "range";
  key: keyof ArenaDebugTuning;
  label: string;
  min: number;
  max: number;
  step: number;
  resetValue: number;
}

interface DebugToggleControlConfig {
  type: "toggle";
  key: keyof ArenaDebugTuning;
  label: string;
  resetValue: boolean;
}

interface DebugSelectControlConfig {
  type: "select";
  key: keyof ArenaDebugTuning;
  label: string;
  options: { value: string; label: string }[];
  resetValue: string;
}

type DebugControlConfig = DebugRangeControlConfig | DebugToggleControlConfig | DebugSelectControlConfig;
type RigNumericControlKey = "x" | "y" | "angle" | "scaleX" | "scaleY";
type RigToggleControlKey = "flipX" | "flipY";
type AnimationCastPropNumericControlKey = "x" | "y" | "angle" | "scaleX" | "scaleY";
type AnimationCastPropToggleControlKey = "flipX" | "flipY";
type CharacterPreviewControlKey =
  | "characterPreviewScale"
  | "characterPreviewFeetX"
  | "characterPreviewFeetY"
  | "facePreviewScale"
  | "facePreviewFocusX"
  | "facePreviewFocusY";
type AnimationEditorViewControlKey = "animationEditorZoom" | "animationEditorOffsetX" | "animationEditorOffsetY";
type CharacterPreviewControlMode = "body" | "face";
type FaceNumericControlKey = keyof FacePartTuning;
type FaceAssetLayerNumericControlKey = keyof FaceAssetLayerTuning;
type AppearanceLayerNumericControlKey = keyof AppearanceLayerTuning;
type EquipmentNumericControlKey = "x" | "y" | "angle" | "scaleX" | "scaleY";
type EquipmentToggleControlKey = "flipX" | "flipY";
type EquipmentControlKey = EquipmentNumericControlKey | EquipmentToggleControlKey;
type DebugItemEquipmentTypeFilter = "all" | HeroWeaponClass | NonNullable<HeroItemDefinition["armorCategory"]>;
type DebugItemEquipmentRarityFilter = "all" | HeroItemRarity;
type SlashArcNumericControlKey = Exclude<keyof SlashArcTuning, "color">;
type ArenaBackgroundEditTierId = number;
type ArenaBackgroundLayoutField = "x" | "y" | "scale" | "alpha" | "visible";
type ArenaParallaxLayerKey = ArenaBackgroundEditLayer;
type ArenaParallaxField = "followX" | "followY" | "zoom" | "lookUpY" | "zoomDarken" | "farAlpha" | "nearAlpha";
type ArenaBackgroundLayerTuningPatch = {
  layout?: Partial<ArenaBackgroundLayerTuning["layout"]>;
  parallax?: Partial<ArenaBackgroundLayerTuning["parallax"]>;
};
type RigLimbKey = "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
type AnimationRigPoseKey = "base" | "breath";
type AnimationFacePoseKey = "faceBase" | "faceBreath";
type DebugGeneratedShopItemRecord = (typeof GENERATED_EQUIPMENT_ITEM_RECORDS)[number];

interface DebugControlGroup {
  title: string;
  controls: DebugControlConfig[];
}

interface ArenaParallaxControlConfig {
  role: ArenaBackgroundLayerRole;
  field: ArenaParallaxField;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface RigNumericControlConfig {
  key: RigNumericControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface RigToggleControlConfig {
  key: RigToggleControlKey;
  label: string;
}

interface AnimationCastPropNumericControlConfig {
  key: AnimationCastPropNumericControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface AnimationCastPropToggleControlConfig {
  key: AnimationCastPropToggleControlKey;
  label: string;
}

interface CharacterPreviewControlConfig {
  key: CharacterPreviewControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
  mode: CharacterPreviewControlMode;
}

interface FaceNumericControlConfig {
  key: FaceNumericControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface FaceAssetLayerNumericControlConfig {
  key: FaceAssetLayerNumericControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface AppearanceLayerNumericControlConfig {
  key: AppearanceLayerNumericControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface EquipmentNumericControlConfig {
  key: EquipmentNumericControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface EquipmentToggleControlConfig {
  key: EquipmentToggleControlKey;
  label: string;
}

interface SlashArcNumericControlConfig {
  key: SlashArcNumericControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface RigLimbRotateConfig {
  key: RigLimbKey;
  label: string;
  anchor: RigPartKey;
  parts: RigPartKey[];
}

interface DebugShopItemPairConfig {
  backSlot: HeroEquipmentSlotKey;
  frontSlot: HeroEquipmentSlotKey;
  token: string;
  label: string;
}

interface DebugGeneratedShopProduct {
  id: string;
  name: string;
  itemIds: HeroItemId[];
  kind: HeroItemDefinition["kind"];
  rarity: HeroItemRarity;
  stat: number;
  price: number;
}

interface DebugGeneratedBossItem {
  id: string;
  name: string;
  itemIds: HeroItemId[];
  slotKeys: HeroEquipmentSlotKey[];
  kind: HeroItemDefinition["kind"];
  rarity: HeroItemRarity;
  stat: number;
}

interface DebugItemEquipmentValueContext {
  itemIds: HeroItemId[];
  kind?: HeroItemDefinition["kind"];
  rarity?: HeroItemRarity;
  stat?: number;
  price?: number;
  idsText: string;
  statusText: string;
  canEditRarity: boolean;
  canEditStat: boolean;
  canEditPrice: boolean;
  canSave: boolean;
}

interface DebugRemovableGeneratedEquipmentItem {
  id: string;
  name: string;
  itemIds: HeroItemId[];
  rarity: HeroItemRarity;
}

interface DebugEquipmentSetImportSlotConfig {
  id: string;
  label: string;
  targetPrefix: string;
  kind: HeroItemDefinition["kind"];
}

interface DebugWeaponImportEntry {
  sourcePath: string;
  name: string;
  rarity: HeroItemRarity;
  weaponClass: HeroWeaponClass;
  damageBonus: number;
  price: number;
  availability: {
    shop: boolean;
    enemyPool: boolean;
    bossUnique: boolean;
  };
}

interface DebugShieldImportEntry {
  sourcePath: string;
  name: string;
  rarity: HeroItemRarity;
  armorHp: number;
  price: number;
  availability: {
    shop: boolean;
    enemyPool: boolean;
    bossUnique: boolean;
  };
}

interface DebugBossEquipmentControlConfig {
  id: string;
  label: string;
  slotKeys: HeroEquipmentSlotKey[];
}

interface DebugArenaTierDifficultyDefaults {
  gold: number;
  xp: number;
  randomBaseStatPoints: number;
  equipmentPools: ArenaGeneratedEquipmentPool[];
}

type ArenaTierPoolChanceKey = "rollChance" | "weaponChance" | "bowChance" | "shieldChance" | "shurikenChance";
type DebugArenaTierIconKey =
  | "strength"
  | "agility"
  | "vitality"
  | "random-points"
  | "armor"
  | "weapon"
  | "bow"
  | "shield"
  | "shuriken";

const DEBUG_ARENA_TIER_POOL_CHANCE_FIELDS: readonly { key: ArenaTierPoolChanceKey; label: string; icon: DebugArenaTierIconKey }[] = [
  { key: "rollChance", label: "Armor", icon: "armor" },
  { key: "weaponChance", label: "Weapon", icon: "weapon" },
  { key: "bowChance", label: "Bow", icon: "bow" },
  { key: "shieldChance", label: "Shield", icon: "shield" },
  { key: "shurikenChance", label: "Shuriken", icon: "shuriken" },
];

type ClassicSlotNumericKey = keyof ClassicActionButtonSlotTuning;

const classicWheelModeLabels: Record<ClassicActionWheelMode, string> = {
  distance: "Distance",
  clinch: "Clinch",
  bowDistance: "Bow distance",
};

const actionButtonLabels: Record<ActionButtonOffsetKey, string> = {
  forward: "Forward",
  back: "Back",
  lunge: "Lunge",
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
  switchWeapon: "Swap",
  shuriken: "Shuriken",
  scroll: "Scroll",
  fireball: "Fireball",
  ward: "Ward",
  preciseStrike: "Precise strike",
  doubleStrike: "Double strike",
  poison: "Poison",
  taunt: "Taunt",
  rest: "Rest",
};

const bowDistanceActionButtonLabels: Partial<Record<ActionButtonOffsetKey, string>> = {
  light: "Quick shot",
  medium: "Aimed shot",
  heavy: "Power shot",
  switchWeapon: "Swap",
  shuriken: "Shuriken",
  scroll: "Scroll",
  fireball: "Fireball",
  ward: "Ward",
  preciseStrike: "Precise strike",
  doubleStrike: "Double strike",
};

const AUTO_EQUIPMENT_STAT_MIN = 0;
const AUTO_EQUIPMENT_ARMOR_MAX = 200;
const AUTO_EQUIPMENT_DAMAGE_MAX = 100;
const AUTO_EQUIPMENT_PRICE_MAX = 2000;
const AUTO_EQUIPMENT_RARITIES: readonly HeroItemRarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythical", "unique"];
const AUTO_EQUIPMENT_RARITY_LABELS: Record<HeroItemRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythical: "Mythical",
  unique: "Unique",
};
const DEBUG_WEAPON_IMPORT_CLASSES: readonly HeroWeaponClass[] = ["sword", "axe", "bow", "mace", "spear", "shuriken"];
const DEBUG_WEAPON_IMPORT_CLASS_LABELS: Record<HeroWeaponClass, string> = {
  sword: "Sword",
  axe: "Axe",
  bow: "Bow",
  mace: "Mace",
  spear: "Spear",
  shuriken: "Shuriken",
};
const DEBUG_ITEM_EQUIPMENT_ARMOR_CATEGORY_LABELS: Record<NonNullable<HeroItemDefinition["armorCategory"]>, string> = {
  cloth: "Cloth",
  leather: "Leather",
  chain: "Chain",
  plate: "Plate",
};
const DEBUG_EQUIPMENT_SET_IMPORT_SLOT_CONFIGS: readonly DebugEquipmentSetImportSlotConfig[] = [
  { id: "helmet", label: "Helmet", targetPrefix: "helmet", kind: "armor" },
  { id: "breastplate", label: "Breastplate", targetPrefix: "breastplate", kind: "armor" },
  { id: "backShoulderguard", label: "Back shoulderguard", targetPrefix: "back-shoulderguard", kind: "armor" },
  { id: "backWrist", label: "Back wrist", targetPrefix: "back-wrist", kind: "armor" },
  { id: "backGlove", label: "Back glove", targetPrefix: "back-glove", kind: "armor" },
  { id: "backGreave", label: "Back greave", targetPrefix: "back-greave", kind: "armor" },
  { id: "backShinguard", label: "Back shinguard", targetPrefix: "back-shinguard", kind: "armor" },
  { id: "backBoot", label: "Back boot", targetPrefix: "back-boot", kind: "armor" },
  { id: "weaponSword", label: "Weapon sword", targetPrefix: "weapon-sword", kind: "weapon" },
  { id: "weaponAxe", label: "Weapon axe", targetPrefix: "weapon-axe", kind: "weapon" },
  { id: "weaponBow", label: "Weapon bow", targetPrefix: "weapon-bow", kind: "weapon" },
  { id: "weaponMace", label: "Weapon mace", targetPrefix: "weapon-mace", kind: "weapon" },
  { id: "weaponSpear", label: "Weapon spear", targetPrefix: "weapon-spear", kind: "weapon" },
  { id: "weaponShuriken", label: "Weapon shuriken", targetPrefix: "weapon-shuriken", kind: "weapon" },
];
const DEBUG_SHOP_ITEM_PAIR_CONFIGS: readonly DebugShopItemPairConfig[] = [
  { backSlot: "backShoulderguard", frontSlot: "frontShoulderguard", token: "shoulderguard", label: "Shoulderguard" },
  { backSlot: "backWrist", frontSlot: "frontWrist", token: "wrist", label: "Wrist" },
  { backSlot: "backGlove", frontSlot: "frontGlove", token: "glove", label: "Glove" },
  { backSlot: "backGreave", frontSlot: "frontGreave", token: "greave", label: "Greave" },
  { backSlot: "backShinguard", frontSlot: "frontShinguard", token: "shinguard", label: "Shinguard" },
  { backSlot: "backBoot", frontSlot: "frontBoot", token: "boot", label: "Boot" },
];
const DEBUG_SHOP_ITEM_RARITY_RANKS: Record<HeroItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
  unique: 6,
};
const DEBUG_BOSS_STAT_MAX = 200;
const DEBUG_BOSS_TIER_MAX = 50;
const DEBUG_BOSS_REWARD_MAX = 100000;
const DEBUG_BOSS_LOOT_CHANCE_STEP = 0.01;
const DEBUG_ARENA_TIER_RARITIES: readonly HeroItemRarity[] = AUTO_EQUIPMENT_RARITIES.filter((rarity) => rarity !== "unique");
const DEBUG_ARENA_TIER_DIFFICULTY_LABELS: Record<ArenaDifficultyId, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};
const DEBUG_BOSS_EQUIPMENT_SLOT_LABELS: Record<HeroEquipmentSlotKey, string> = {
  weaponMain: "Weapon",
  weaponBow: "Bow",
  helmet: "Helmet",
  breastplate: "Body",
  backShoulderguard: "Back shoulder",
  frontShoulderguard: "Front shoulder",
  backWrist: "Back wrist",
  frontWrist: "Front wrist",
  backGlove: "Back glove",
  frontGlove: "Front glove",
  shield: "Shield",
  backGreave: "Back greave",
  frontGreave: "Front greave",
  backShinguard: "Back shin",
  frontShinguard: "Front shin",
  backBoot: "Back boot",
  frontBoot: "Front boot",
};

const ARENA_PARALLAX_CONTROLS: readonly ArenaParallaxControlConfig[] = [
  { role: "back", field: "followX", label: "Follow X", min: -0.5, max: 1.5, step: 0.01 },
  { role: "back", field: "followY", label: "Follow Y", min: -0.5, max: 1.5, step: 0.01 },
  { role: "back", field: "zoom", label: "Zoom", min: 0, max: 1.5, step: 0.01 },
  { role: "back", field: "lookUpY", label: "Look up", min: -240, max: 240, step: 1 },
  { role: "mid", field: "followX", label: "Follow X", min: -0.5, max: 1.5, step: 0.01 },
  { role: "mid", field: "followY", label: "Follow Y", min: -0.5, max: 1.5, step: 0.01 },
  { role: "mid", field: "zoom", label: "Zoom", min: 0, max: 1.5, step: 0.01 },
  { role: "mid", field: "lookUpY", label: "Look up", min: -240, max: 240, step: 1 },
  { role: "mid", field: "zoomDarken", label: "Darken", min: 0, max: 1, step: 0.01 },
  { role: "ground", field: "followX", label: "Follow X", min: -0.5, max: 1.5, step: 0.01 },
  { role: "ground", field: "followY", label: "Follow Y", min: -0.5, max: 1.5, step: 0.01 },
  { role: "ground", field: "zoom", label: "Zoom", min: 0, max: 1.5, step: 0.01 },
  { role: "ground", field: "lookUpY", label: "Look up", min: -240, max: 240, step: 1 },
  { role: "front", field: "followX", label: "Follow X", min: -0.5, max: 1.5, step: 0.01 },
  { role: "front", field: "followY", label: "Follow Y", min: -0.5, max: 1.5, step: 0.01 },
  { role: "front", field: "zoom", label: "Zoom", min: 0, max: 1.5, step: 0.01 },
  { role: "front", field: "lookUpY", label: "Look up", min: -240, max: 240, step: 1 },
  { role: "ambient", field: "followX", label: "Follow X", min: -0.5, max: 1.5, step: 0.01 },
  { role: "ambient", field: "followY", label: "Follow Y", min: -0.5, max: 1.5, step: 0.01 },
  { role: "ambient", field: "zoom", label: "Zoom", min: 0, max: 1.5, step: 0.01 },
  { role: "ambient", field: "lookUpY", label: "Look up", min: -240, max: 240, step: 1 },
  { role: "ambient", field: "farAlpha", label: "Far alpha", min: 0, max: 1, step: 0.01 },
  { role: "ambient", field: "nearAlpha", label: "Near alpha", min: 0, max: 1, step: 0.01 },
];
let arenaParallaxEditorLayer: ArenaParallaxLayerKey = "back";

function formatPaperDollBodyPresetOptions(): string {
  return PAPER_DOLL_BODY_PRESET_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join("");
}

const controlGroups: DebugControlGroup[] = [
  {
    title: "Grid",
    controls: [
      { type: "toggle", key: "showGrid", label: "Show grid", resetValue: defaultDebugTuning.showGrid },
      { type: "range", key: "gridStep", label: "Grid step", min: 10, max: 100, step: 1, resetValue: defaultDebugTuning.gridStep },
      { type: "range", key: "gridOpacity", label: "Grid alpha", min: 0.1, max: 1, step: 0.05, resetValue: defaultDebugTuning.gridOpacity },
    ],
  },
  {
    title: "Origin",
    controls: [
      { type: "range", key: "originX", label: "Origin X", min: 0, max: 430, step: 1, resetValue: defaultDebugTuning.originX },
      { type: "range", key: "originY", label: "Origin Y", min: 0, max: 764, step: 1, resetValue: defaultDebugTuning.originY },
    ],
  },
  {
    title: "Fighters from origin",
    controls: [
      { type: "range", key: "playerStageX", label: "Player X", min: -600, max: 600, step: 1, resetValue: defaultDebugTuning.playerStageX },
      { type: "range", key: "playerStageY", label: "Player Y", min: -500, max: 500, step: 1, resetValue: defaultDebugTuning.playerStageY },
      { type: "range", key: "enemyStageX", label: "Enemy X", min: -600, max: 600, step: 1, resetValue: defaultDebugTuning.enemyStageX },
      { type: "range", key: "enemyStageY", label: "Enemy Y", min: -500, max: 500, step: 1, resetValue: defaultDebugTuning.enemyStageY },
      { type: "range", key: "playerScale", label: "Player scale", min: 0.1, max: 6, step: 0.01, resetValue: defaultDebugTuning.playerScale },
      { type: "range", key: "enemyScale", label: "Enemy scale", min: 0.1, max: 6, step: 0.01, resetValue: defaultDebugTuning.enemyScale },
    ],
  },
  {
    title: "Camera framing",
    controls: [
      { type: "range", key: "cameraFeetScreenY", label: "Feet Y", min: 260, max: 720, step: 1, resetValue: defaultDebugTuning.cameraFeetScreenY },
      { type: "range", key: "cameraCloseFeetShiftY", label: "Close shift", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.cameraCloseFeetShiftY },
      { type: "range", key: "cameraFeetMinScreenRatio", label: "Min ratio", min: 0.35, max: 0.75, step: 0.01, resetValue: defaultDebugTuning.cameraFeetMinScreenRatio },
    ],
  },
  {
    title: "Fighter shadow",
    controls: [
      { type: "range", key: "shadowOffsetX", label: "Shadow X", min: -240, max: 240, step: 1, resetValue: defaultDebugTuning.shadowOffsetX },
      { type: "range", key: "shadowOffsetY", label: "Shadow Y", min: -240, max: 240, step: 1, resetValue: defaultDebugTuning.shadowOffsetY },
      { type: "range", key: "shadowScaleX", label: "Shadow scale X", min: -4, max: 4, step: 0.01, resetValue: defaultDebugTuning.shadowScaleX },
      { type: "range", key: "shadowScaleY", label: "Shadow scale Y", min: -1, max: 1, step: 0.01, resetValue: defaultDebugTuning.shadowScaleY },
      { type: "range", key: "shadowAlpha", label: "Shadow alpha", min: 0, max: 1, step: 0.01, resetValue: defaultDebugTuning.shadowAlpha },
      { type: "range", key: "shadowBlur", label: "Shadow blur", min: 0, max: 6, step: 0.1, resetValue: defaultDebugTuning.shadowBlur },
    ],
  },
  {
    title: "Action arc",
    controls: [
      { type: "toggle", key: "actionArcEditMode", label: "Edit arc", resetValue: defaultDebugTuning.actionArcEditMode },
      { type: "range", key: "actionArcRotation", label: "Arc rotation", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionArcRotation },
      { type: "range", key: "actionArcRadius", label: "Arc radius", min: 24, max: 150, step: 1, resetValue: defaultDebugTuning.actionArcRadius },
      { type: "range", key: "actionArcOffsetX", label: "Arc X", min: -320, max: 320, step: 1, resetValue: defaultDebugTuning.actionArcOffsetX },
      { type: "range", key: "actionArcOffsetY", label: "Arc Y", min: -320, max: 320, step: 1, resetValue: defaultDebugTuning.actionArcOffsetY },
      { type: "range", key: "actionButtonScale", label: "Button scale", min: 0.5, max: 2, step: 0.01, resetValue: defaultDebugTuning.actionButtonScale },
      { type: "range", key: "actionIconScale", label: "Icon scale", min: 0.5, max: 2, step: 0.01, resetValue: defaultDebugTuning.actionIconScale },
      { type: "range", key: "actionAttackIconScale", label: "Attack icon", min: 0.5, max: 2, step: 0.01, resetValue: defaultDebugTuning.actionAttackIconScale },
      { type: "range", key: "actionTokenRingWidth", label: "Ring width", min: 0, max: 6, step: 0.05, resetValue: defaultDebugTuning.actionTokenRingWidth },
      { type: "range", key: "actionTokenFaceInset", label: "Face inset", min: 0, max: 10, step: 0.25, resetValue: defaultDebugTuning.actionTokenFaceInset },
      { type: "range", key: "actionTokenRimShine", label: "Rim shine", min: 0, max: 0.6, step: 0.01, resetValue: defaultDebugTuning.actionTokenRimShine },
      { type: "range", key: "actionTokenOuterShine", label: "Outer shine", min: 0, max: 0.6, step: 0.01, resetValue: defaultDebugTuning.actionTokenOuterShine },
      { type: "range", key: "actionTokenFaceShine", label: "Face shine", min: 0, max: 0.6, step: 0.01, resetValue: defaultDebugTuning.actionTokenFaceShine },
      { type: "range", key: "actionTokenInnerShine", label: "Inner shine", min: 0, max: 0.6, step: 0.01, resetValue: defaultDebugTuning.actionTokenInnerShine },
      { type: "range", key: "actionTokenStripeShine", label: "Stripe shine", min: 0, max: 0.6, step: 0.01, resetValue: defaultDebugTuning.actionTokenStripeShine },
    ],
  },
  {
    title: "Attack icons",
    controls: [
      { type: "range", key: "actionLightIconScale", label: "Light scale", min: 0.5, max: 2, step: 0.01, resetValue: defaultDebugTuning.actionLightIconScale },
      { type: "range", key: "actionLightIconRotation", label: "Light rotate", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionLightIconRotation },
      { type: "range", key: "actionLightIconBrightness", label: "Light bright", min: 0.35, max: 1.8, step: 0.01, resetValue: defaultDebugTuning.actionLightIconBrightness },
      { type: "range", key: "actionMediumIconScale", label: "Medium scale", min: 0.5, max: 2, step: 0.01, resetValue: defaultDebugTuning.actionMediumIconScale },
      { type: "range", key: "actionMediumIconRotation", label: "Medium rotate", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionMediumIconRotation },
      { type: "range", key: "actionMediumIconBrightness", label: "Medium bright", min: 0.35, max: 1.8, step: 0.01, resetValue: defaultDebugTuning.actionMediumIconBrightness },
      { type: "range", key: "actionHeavyIconScale", label: "Heavy scale", min: 0.5, max: 2, step: 0.01, resetValue: defaultDebugTuning.actionHeavyIconScale },
      { type: "range", key: "actionHeavyIconRotation", label: "Heavy rotate", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionHeavyIconRotation },
      { type: "range", key: "actionHeavyIconBrightness", label: "Heavy bright", min: 0.35, max: 1.8, step: 0.01, resetValue: defaultDebugTuning.actionHeavyIconBrightness },
    ],
  },
  {
    title: "Combat movement",
    controls: [
      { type: "range", key: "forwardMoveDistance", label: "FWD distance", min: 0.1, max: 4, step: 0.1, resetValue: defaultDebugTuning.forwardMoveDistance },
      { type: "range", key: "backMoveDistance", label: "BACK distance", min: 0.1, max: 4, step: 0.1, resetValue: defaultDebugTuning.backMoveDistance },
      { type: "range", key: "lungeMoveDistance", label: "LUNGE distance", min: 0.1, max: 4, step: 0.1, resetValue: defaultDebugTuning.lungeMoveDistance },
    ],
  },
  {
    title: "Action button angles",
    controls: [
      { type: "range", key: "actionForwardArcAngle", label: "FWD angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionForwardArcAngle },
      { type: "range", key: "actionBackArcAngle", label: "BACK angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionBackArcAngle },
      { type: "range", key: "actionLungeArcAngle", label: "LUNGE angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionLungeArcAngle },
      { type: "range", key: "actionLightArcAngle", label: "WEAK angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionLightArcAngle },
      { type: "range", key: "actionMediumArcAngle", label: "MED angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionMediumArcAngle },
      { type: "range", key: "actionHeavyArcAngle", label: "STRONG angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionHeavyArcAngle },
      { type: "range", key: "actionTauntArcAngle", label: "TAUNT angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionTauntArcAngle },
      { type: "range", key: "actionRestArcAngle", label: "REST angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionRestArcAngle },
    ],
  },
];

const popupControlGroup: DebugControlGroup = {
  title: "Popups",
  controls: [
    { type: "range", key: "popupOffsetY", label: "Popup Y", min: -160, max: 160, step: 1, resetValue: defaultDebugTuning.popupOffsetY },
    { type: "range", key: "damagePopupOffsetY", label: "Damage Y", min: -160, max: 160, step: 1, resetValue: defaultDebugTuning.damagePopupOffsetY },
    { type: "range", key: "blockPopupOffsetY", label: "Block Y", min: -160, max: 160, step: 1, resetValue: defaultDebugTuning.blockPopupOffsetY },
    { type: "range", key: "popupScale", label: "Popup scale", min: 0.25, max: 2, step: 0.01, resetValue: defaultDebugTuning.popupScale },
    { type: "range", key: "damagePopupScale", label: "Damage scale", min: 0.25, max: 2, step: 0.01, resetValue: defaultDebugTuning.damagePopupScale },
    { type: "range", key: "blockPopupScale", label: "Block scale", min: 0.25, max: 2, step: 0.01, resetValue: defaultDebugTuning.blockPopupScale },
    { type: "range", key: "armorAbsorbPopupOffsetY", label: "Armor absorb Y", min: -160, max: 160, step: 1, resetValue: defaultDebugTuning.armorAbsorbPopupOffsetY },
    { type: "range", key: "armorBreakPopupOffsetY", label: "Armor break Y", min: -160, max: 160, step: 1, resetValue: defaultDebugTuning.armorBreakPopupOffsetY },
    { type: "range", key: "armorAbsorbPopupScale", label: "Armor absorb scale", min: 0.25, max: 2, step: 0.01, resetValue: defaultDebugTuning.armorAbsorbPopupScale },
    { type: "range", key: "armorBreakPopupScale", label: "Armor break scale", min: 0.25, max: 2, step: 0.01, resetValue: defaultDebugTuning.armorBreakPopupScale },
  ],
};

const popupPreviewKindByKey: Partial<Record<keyof ArenaDebugTuning, DebugPopupPreviewKind>> = {
  popupOffsetY: "all",
  popupScale: "all",
  damagePopupOffsetY: "damage",
  damagePopupScale: "damage",
  blockPopupOffsetY: "block",
  blockPopupScale: "block",
  armorAbsorbPopupOffsetY: "armorAbsorb",
  armorAbsorbPopupScale: "armorAbsorb",
  armorBreakPopupOffsetY: "armorBreak",
  armorBreakPopupScale: "armorBreak",
};

const hudControlGroups: DebugControlGroup[] = [
  {
    title: "Immersive flask HUD",
    controls: [
      {
        type: "select",
        key: "hudMode",
        label: "Mode",
        options: [
          { value: "immersive", label: "Immersive" },
          { value: "classic", label: "Classic" },
        ],
        resetValue: defaultDebugTuning.hudMode,
      },
      { type: "toggle", key: "hudEditMode", label: "Edit flasks", resetValue: defaultDebugTuning.hudEditMode },
      { type: "range", key: "hudBottomOffset", label: "Bottom", min: -96, max: 96, step: 1, resetValue: defaultDebugTuning.hudBottomOffset },
      { type: "range", key: "hudSideInset", label: "Side inset", min: 0, max: 64, step: 1, resetValue: defaultDebugTuning.hudSideInset },
      { type: "range", key: "hudScale", label: "Scale", min: 0.7, max: 1.25, step: 0.01, resetValue: defaultDebugTuning.hudScale },
      { type: "range", key: "hudFlaskGap", label: "Flask gap", min: 0, max: 18, step: 1, resetValue: defaultDebugTuning.hudFlaskGap },
      { type: "range", key: "hudNameGap", label: "Name gap", min: -12, max: 24, step: 1, resetValue: defaultDebugTuning.hudNameGap },
      { type: "range", key: "hudSafeGapRatio", label: "Safe ratio", min: 0, max: 0.5, step: 0.01, resetValue: defaultDebugTuning.hudSafeGapRatio },
      { type: "range", key: "hudSafeMinGap", label: "Safe min", min: 0, max: 80, step: 1, resetValue: defaultDebugTuning.hudSafeMinGap },
      { type: "range", key: "fighterHudGap", label: "Fighter gap", min: 0, max: 120, step: 1, resetValue: defaultDebugTuning.fighterHudGap },
    ],
  },
  {
    title: "Classic action wheel",
    controls: [
      { type: "toggle", key: "classicHudEditMode", label: "Edit wheel", resetValue: defaultDebugTuning.classicHudEditMode },
      { type: "range", key: "classicHudOffsetX", label: "Wheel X", min: -240, max: 240, step: 1, resetValue: defaultDebugTuning.classicHudOffsetX },
      { type: "range", key: "classicHudOffsetY", label: "Wheel Y", min: -160, max: 160, step: 1, resetValue: defaultDebugTuning.classicHudOffsetY },
      { type: "range", key: "classicHudScale", label: "Wheel scale", min: 0.6, max: 1.6, step: 0.01, resetValue: defaultDebugTuning.classicHudScale },
      { type: "range", key: "classicHudSafeOffset", label: "Safe offset", min: 0, max: 280, step: 1, resetValue: defaultDebugTuning.classicHudSafeOffset },
    ],
  },
];

const cityControlGroups: DebugControlGroup[] = [
  {
    title: "City hero",
    controls: [
      { type: "range", key: "cityHeroX", label: "Hero X", min: 0, max: 240, step: 1, resetValue: defaultDebugTuning.cityHeroX },
      { type: "range", key: "cityHeroY", label: "Hero Y", min: 0, max: 360, step: 1, resetValue: defaultDebugTuning.cityHeroY },
      { type: "range", key: "cityHeroScale", label: "Hero scale", min: 0.4, max: 1.6, step: 0.01, resetValue: defaultDebugTuning.cityHeroScale },
    ],
  },
  {
    title: "Armory background",
    controls: [
      {
        type: "range",
        key: "armoryBackgroundOffsetX",
        label: "Offset X",
        min: -240,
        max: 240,
        step: 1,
        resetValue: defaultDebugTuning.armoryBackgroundOffsetX,
      },
      {
        type: "range",
        key: "armoryBackgroundOffsetY",
        label: "Offset Y",
        min: -240,
        max: 240,
        step: 1,
        resetValue: defaultDebugTuning.armoryBackgroundOffsetY,
      },
      {
        type: "range",
        key: "armoryBackgroundScale",
        label: "Scale",
        min: 1,
        max: 1.6,
        step: 0.01,
        resetValue: defaultDebugTuning.armoryBackgroundScale,
      },
    ],
  },
];

const rigNumericControls: RigNumericControlConfig[] = [
  { key: "x", label: "x", min: -480, max: 480, step: 1 },
  { key: "y", label: "y", min: -480, max: 480, step: 1 },
  { key: "angle", label: "angle", min: RIG_PART_ANGLE_MIN, max: RIG_PART_ANGLE_MAX, step: 1 },
  { key: "scaleX", label: "scaleX", min: 0.1, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.1, max: 3, step: 0.01 },
];

const rigToggleControls: RigToggleControlConfig[] = [
  { key: "flipX", label: "mirror X" },
  { key: "flipY", label: "mirror Y" },
];

const animationCastPropNumericControls: AnimationCastPropNumericControlConfig[] = [
  { key: "x", label: "x", min: -480, max: 480, step: 1 },
  { key: "y", label: "y", min: -480, max: 480, step: 1 },
  { key: "angle", label: "angle", min: RIG_PART_ANGLE_MIN, max: RIG_PART_ANGLE_MAX, step: 1 },
  { key: "scaleX", label: "scaleX", min: 0.05, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.05, max: 3, step: 0.01 },
];

const animationCastPropToggleControls: AnimationCastPropToggleControlConfig[] = [
  { key: "flipX", label: "mirror X" },
  { key: "flipY", label: "mirror Y" },
];

const characterPreviewControls: CharacterPreviewControlConfig[] = [
  { key: "characterPreviewScale", label: "zoom", min: 1, max: 2.6, step: 0.01, mode: "body" },
  { key: "characterPreviewFeetX", label: "feet X", min: 0, max: 430, step: 1, mode: "body" },
  { key: "characterPreviewFeetY", label: "feet Y", min: 560, max: 740, step: 1, mode: "body" },
  { key: "facePreviewScale", label: "face zoom", min: 2, max: 7, step: 0.01, mode: "face" },
  { key: "facePreviewFocusX", label: "face X", min: 0, max: 430, step: 1, mode: "face" },
  { key: "facePreviewFocusY", label: "face Y", min: 80, max: 560, step: 1, mode: "face" },
];

const animationEditorViewControls: (DebugRangeControlConfig & { key: AnimationEditorViewControlKey })[] = [
  {
    type: "range",
    key: "animationEditorZoom",
    label: "zoom",
    min: 0.5,
    max: 2.4,
    step: 0.01,
    resetValue: defaultDebugTuning.animationEditorZoom,
  },
  {
    type: "range",
    key: "animationEditorOffsetX",
    label: "pan X",
    min: -420,
    max: 420,
    step: 1,
    resetValue: defaultDebugTuning.animationEditorOffsetX,
  },
  {
    type: "range",
    key: "animationEditorOffsetY",
    label: "pan Y",
    min: -420,
    max: 420,
    step: 1,
    resetValue: defaultDebugTuning.animationEditorOffsetY,
  },
];

const faceNumericControls: FaceNumericControlConfig[] = [
  { key: "x", label: "x", min: -40, max: 40, step: 0.5 },
  { key: "y", label: "y", min: -40, max: 40, step: 0.5 },
  { key: "scaleX", label: "scaleX", min: 0.1, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.1, max: 3, step: 0.01 },
];

const faceAssetLayerNumericControls: FaceAssetLayerNumericControlConfig[] = [
  { key: "x", label: "x", min: -80, max: 80, step: 0.5 },
  { key: "y", label: "y", min: -120, max: 40, step: 0.5 },
  { key: "angle", label: "angle", min: -180, max: 180, step: 1 },
  { key: "scaleX", label: "scaleX", min: 0.1, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.1, max: 3, step: 0.01 },
];

const appearanceLayerNumericControls: AppearanceLayerNumericControlConfig[] = [
  { key: "x", label: "x", min: -160, max: 160, step: 0.5 },
  { key: "y", label: "y", min: -160, max: 160, step: 0.5 },
  { key: "angle", label: "angle", min: -180, max: 180, step: 1 },
  { key: "scaleX", label: "scaleX", min: 0.1, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.1, max: 3, step: 0.01 },
];

const equipmentNumericControls: EquipmentNumericControlConfig[] = [
  { key: "x", label: "x", min: -240, max: 240, step: 1 },
  { key: "y", label: "y", min: -240, max: 240, step: 1 },
  { key: "angle", label: "angle", min: -180, max: 180, step: 1 },
  { key: "scaleX", label: "scaleX", min: 0.1, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.1, max: 3, step: 0.01 },
];

const equipmentToggleControls: EquipmentToggleControlConfig[] = [
  { key: "flipX", label: "mirror X" },
  { key: "flipY", label: "mirror Y" },
];

const slashArcNumericControls: SlashArcNumericControlConfig[] = [
  { key: "radius", label: "radius", min: 1, max: 140, step: 1 },
  { key: "width", label: "width", min: 1, max: 24, step: 1 },
  { key: "alpha", label: "alpha", min: 0.1, max: 1, step: 0.01 },
  { key: "duration", label: "duration", min: 30, max: 1000, step: 10 },
  { key: "offsetX", label: "offset X", min: -240, max: 240, step: 1 },
  { key: "offsetY", label: "offset Y", min: -240, max: 240, step: 1 },
  { key: "startAngle", label: "start", min: -6.28, max: 6.28, step: 0.01 },
  { key: "endAngle", label: "end", min: -6.28, max: 6.28, step: 0.01 },
  { key: "angle", label: "angle", min: -180, max: 180, step: 1 },
  { key: "sweep", label: "sweep", min: -180, max: 180, step: 1 },
];

const rigLimbRotateConfigs: RigLimbRotateConfig[] = [
  { key: "leftArm", label: "Left arm", anchor: "backUpperArm", parts: ["backUpperArm", "backForearm", "backHand"] },
  { key: "rightArm", label: "Right arm", anchor: "frontUpperArm", parts: ["frontUpperArm", "frontForearm", "frontHand"] },
  { key: "leftLeg", label: "Left leg", anchor: "backThigh", parts: ["backThigh", "backShin", "backFoot"] },
  { key: "rightLeg", label: "Right leg", anchor: "frontThigh", parts: ["frontThigh", "frontShin", "frontFoot"] },
];

const rigPartRootPivots: Record<RigPartKey, { x: number; y: number }> = {
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

const ANIMATION_WORKBENCH_ROOT_SELECT_VALUE = "root";
const RIG_LIMB_ROTATE_STEP_DEGREES = 5;

let activeEquipmentSlot: EquipmentSlotKey = "weaponMain";
let activeEquipmentItemId: HeroItemId | "" = "";
let activeEquipmentTypeFilter: DebugItemEquipmentTypeFilter = "all";
let activeEquipmentRarityFilter: DebugItemEquipmentRarityFilter = "all";
let debugArenaBosses: ArenaBossDefinition[] = ARENA_BOSSES.map(cloneArenaBossDefinition);
let debugArenaTiers: ArenaTierConfig[] = ARENA_TIER_CONFIGS.map(cloneArenaTierConfig);
let isDebugUndoShortcutMounted = false;
let isCharacterCanvasEquipmentBridgeMounted = false;
let debugHeroEquipment: HeroEquipment | undefined;
let notifyHeroEquipmentChange: ((equipment: HeroEquipment) => void) | undefined;
let previewSlashArc: ((actionId: SlashArcAttackKey, withBodyAnimation: boolean) => void) | undefined;
let previewPopup: ((kind: DebugPopupPreviewKind) => void) | undefined;
let isSlashPreviewLoopRunning = false;
let slashPreviewTimer: number | undefined;
let animationWorkbenchPlaybackFrame: number | undefined;
let animationWorkbenchPlaybackPreviousTime = 0;
let animationWorkbenchPlaybackReturnMode: AnimationEditMode | undefined;

const ANIMATION_WORKBENCH_PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.5, 2] as const;
const ANIMATION_WORKBENCH_MELEE_WEAPON_CLASSES: BodyAnimationWeaponClass[] = ["sword", "axe", "mace", "spear"];
const ANIMATION_WORKBENCH_WEAPON_SLOT_KEYS = ["weaponMain", "weaponBow"] as const;

const oppositeRigPartMap: Partial<Record<RigPartKey, RigPartKey>> = {
  backUpperArm: "frontUpperArm",
  frontUpperArm: "backUpperArm",
  backForearm: "frontForearm",
  frontForearm: "backForearm",
  backHand: "frontHand",
  frontHand: "backHand",
  backThigh: "frontThigh",
  frontThigh: "backThigh",
  backShin: "frontShin",
  frontShin: "backShin",
  backFoot: "frontFoot",
  frontFoot: "backFoot",
};

export function mountDebugPanel(root: HTMLElement, options: DebugPanelOptions = {}): void {
  configureHeroEquipmentDebug(options);

  if (document.querySelector(".debug-panel")) {
    return;
  }

  const panel = document.createElement("section");
  panel.className = "debug-panel";
  panel.innerHTML = `
    <nav class="debug-panel__mode-tabs" aria-label="Debug mode">
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="character" aria-pressed="true">Character</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="animation" aria-pressed="false">Animation</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="city" aria-pressed="false">City</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="arena" aria-pressed="false">Arena</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="hud" aria-pressed="false">HUD</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="ui" aria-pressed="false">UI</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="effects" aria-pressed="false">Effects</button>
    </nav>
    <details class="debug-rig-panel">
      <summary>Rig editor</summary>
      <div class="debug-rig-editor">
        <label class="debug-rig-editor__part">
          <span>Body preset</span>
          <select class="debug-rig-editor__body-preset" data-debug-select-key="paperDollBodyPreset">${formatPaperDollBodyPresetOptions()}</select>
        </label>
        <button class="debug-panel__reset debug-rig-editor__copy-classic-to-dummy" type="button">Copy Classic Rig to Dummy V2</button>
        <fieldset class="debug-rig-editor__canvas-mode">
          <legend>Canvas edit</legend>
          <div class="debug-rig-editor__canvas-mode-options" role="group" aria-label="Character canvas edit mode">
            <button class="debug-panel__reset" type="button" data-character-canvas-edit-mode="parts">Parts</button>
            <button class="debug-panel__reset" type="button" data-character-canvas-edit-mode="bodyArt">Body Art</button>
            <button class="debug-panel__reset" type="button" data-character-canvas-edit-mode="equipment">Equipment</button>
            <button class="debug-panel__reset" type="button" data-character-canvas-edit-mode="face">Face</button>
          </div>
        </fieldset>
        <label class="debug-rig-editor__part">
          <span>Part</span>
          <select class="debug-rig-editor__select"></select>
        </label>
        <div class="debug-rig-editor__controls"></div>
        <div class="debug-rig-editor__actions">
          <button class="debug-panel__reset debug-rig-editor__copy-opposite" type="button">Copy opposite</button>
          <button class="debug-panel__reset debug-rig-editor__reset" type="button">Reset selected</button>
        </div>
        <button class="debug-panel__reset debug-rig-editor__reset-all-parts" type="button">Reset all parts</button>
        <button class="debug-panel__reset debug-rig-editor__reset-animation-to-idle" type="button">Reset A+B to idle</button>
        <fieldset class="debug-rig-editor__limbs">
          <legend>Limb rotate</legend>
          <div class="debug-rig-editor__limb-grid"></div>
        </fieldset>
        <fieldset class="debug-rig-editor__face" hidden>
          <legend>Head face</legend>
          <div class="debug-rig-editor__face-controls"></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__face-reset" type="button">Reset eyes</button>
          </div>
        </fieldset>
        <fieldset class="debug-rig-editor__idle">
          <legend>Animation</legend>
          <label class="debug-rig-editor__part">
            <span>Animation</span>
            <select class="debug-rig-editor__animation-select"></select>
          </label>
          <fieldset class="debug-rig-editor__animation-mode">
            <legend>Edit mode</legend>
            <div class="debug-rig-editor__animation-mode-options" role="group" aria-label="Animation edit mode">
              <button class="debug-panel__reset" type="button" data-animation-edit-mode="poseA">Pose A</button>
              <button class="debug-panel__reset" type="button" data-animation-edit-mode="poseB">Pose B</button>
              <button class="debug-panel__reset" type="button" data-animation-edit-mode="preview">Preview</button>
            </div>
            <button class="debug-panel__reset debug-rig-editor__copy-pose-a-to-b" type="button">Copy A -&gt; B</button>
          </fieldset>
          <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
            <span>Enabled</span>
            <input type="checkbox" data-animation-enabled />
          </label>
          <label class="debug-panel__row debug-rig-editor__row">
            <span>duration</span>
            <input class="debug-panel__range" type="range" min="240" max="2400" step="10" data-animation-duration />
            <input class="debug-panel__number" type="number" min="240" max="2400" step="10" data-animation-duration-number />
          </label>
          <div class="debug-rig-editor__idle-parts" data-animation-parts></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__idle-all" type="button">All parts</button>
            <button class="debug-panel__reset debug-rig-editor__idle-none" type="button">No parts</button>
          </div>
        </fieldset>
      </div>
    </details>
    <details class="debug-face-panel">
      <summary>Face editor</summary>
      <div class="debug-face-editor">
        <label class="debug-rig-editor__part">
          <span>Layer</span>
          <select class="debug-face-editor__select"></select>
        </label>
        <div class="debug-face-editor__controls"></div>
        <fieldset class="debug-face-appearance-editor">
          <legend>Appearance</legend>
          <label class="debug-rig-editor__part">
            <span>Layer</span>
            <select class="debug-face-appearance-editor__select"></select>
          </label>
          <div class="debug-face-appearance-editor__controls"></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-face-appearance-editor__reset" type="button">Reset selected</button>
            <button class="debug-panel__reset debug-face-appearance-editor__reset-all" type="button">Reset all appearance</button>
          </div>
        </fieldset>
        <div class="debug-rig-editor__actions">
          <button class="debug-panel__reset debug-face-editor__reset" type="button">Reset selected</button>
          <button class="debug-panel__reset debug-face-editor__reset-all" type="button">Reset all face</button>
        </div>
      </div>
    </details>
    <details class="debug-item-equipment-panel">
      <summary>Item equipment</summary>
      <div class="debug-item-equipment">
        <label class="debug-rig-editor__part">
          <span>Slot</span>
          <select class="debug-item-equipment__select"></select>
        </label>
        <div class="debug-item-equipment__filters">
          <label class="debug-rig-editor__part">
            <span>Type</span>
            <select class="debug-item-equipment__type-filter"></select>
          </label>
          <label class="debug-rig-editor__part">
            <span>Rarity</span>
            <select class="debug-item-equipment__rarity-filter"></select>
          </label>
        </div>
        <div class="debug-item-equipment__picker" role="listbox" aria-label="Item equipment"></div>
        <p class="debug-item-equipment__empty" aria-live="polite"></p>
        <div class="debug-item-equipment__controls"></div>
        <fieldset class="debug-item-equipment__values">
          <legend>Item values</legend>
          <label class="debug-rig-editor__part debug-item-equipment__value-rarity-row">
            <span>Rarity</span>
            <select class="debug-item-equipment__value-rarity debug-rarity-select">${formatAutoEquipmentRarityOptions()}</select>
          </label>
          <label class="debug-panel__row debug-rig-editor__row debug-item-equipment__value-stat-row">
            <span class="debug-item-equipment__value-stat-label">Armor HP</span>
            <input class="debug-panel__range" type="range" min="${AUTO_EQUIPMENT_STAT_MIN}" max="${AUTO_EQUIPMENT_ARMOR_MAX}" step="1" value="0" data-item-equipment-stat />
            <input class="debug-panel__number" type="number" min="${AUTO_EQUIPMENT_STAT_MIN}" max="${AUTO_EQUIPMENT_ARMOR_MAX}" step="1" value="0" data-item-equipment-stat-number />
          </label>
          <label class="debug-panel__row debug-rig-editor__row debug-item-equipment__value-price-row">
            <span>Price</span>
            <input class="debug-panel__range" type="range" min="0" max="${AUTO_EQUIPMENT_PRICE_MAX}" step="1" value="0" data-item-equipment-price />
            <input class="debug-panel__number" type="number" min="0" max="${AUTO_EQUIPMENT_PRICE_MAX}" step="1" value="0" data-item-equipment-price-number />
          </label>
          <p class="debug-item-equipment__value-ids"></p>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-item-equipment__save" type="button">Save item</button>
          </div>
          <p class="debug-item-equipment__value-status" aria-live="polite"></p>
        </fieldset>
        <div class="debug-rig-editor__actions">
          <button class="debug-panel__reset debug-item-equipment__reset" type="button">Reset selected</button>
        </div>
      </div>
    </details>
    <details class="debug-auto-equipment-panel">
      <summary>Auto equipment</summary>
      <div class="debug-auto-equipment">
        <label class="debug-rig-editor__part">
          <span>Asset</span>
          <select class="debug-auto-equipment__select"></select>
        </label>
        <label class="debug-rig-editor__part">
          <span>Name</span>
          <input class="debug-auto-equipment__name" type="text" />
        </label>
        <label class="debug-rig-editor__part">
          <span>Rarity</span>
          <select class="debug-auto-equipment__rarity debug-rarity-select">${formatAutoEquipmentRarityOptions()}</select>
        </label>
        <label class="debug-panel__row debug-rig-editor__row">
          <span class="debug-auto-equipment__stat-label">Armor HP</span>
          <input class="debug-panel__range" type="range" min="${AUTO_EQUIPMENT_STAT_MIN}" max="${AUTO_EQUIPMENT_ARMOR_MAX}" step="1" value="1" data-auto-equipment-armor />
          <input class="debug-panel__number" type="number" min="${AUTO_EQUIPMENT_STAT_MIN}" max="${AUTO_EQUIPMENT_ARMOR_MAX}" step="1" value="1" data-auto-equipment-armor-number />
        </label>
        <label class="debug-panel__row debug-rig-editor__row">
          <span>Price</span>
          <input class="debug-panel__range" type="range" min="0" max="${AUTO_EQUIPMENT_PRICE_MAX}" step="1" value="0" data-auto-equipment-price />
          <input class="debug-panel__number" type="number" min="0" max="${AUTO_EQUIPMENT_PRICE_MAX}" step="1" value="0" data-auto-equipment-price-number />
        </label>
        <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
          <span class="debug-auto-equipment__shop-label">Armory</span>
          <input class="debug-auto-equipment__shop" type="checkbox" checked />
        </label>
        <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
          <span>Enemy pool</span>
          <input class="debug-auto-equipment__enemy-pool" type="checkbox" />
        </label>
        <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
          <span>Boss unique</span>
          <input class="debug-auto-equipment__boss-unique" type="checkbox" />
        </label>
        <fieldset class="debug-auto-equipment__transform">
          <legend>Transform</legend>
          <div class="debug-auto-equipment__transform-controls"></div>
          <button class="debug-panel__reset debug-auto-equipment__reset-transform" type="button">Reset transform</button>
        </fieldset>
        <div class="debug-rig-editor__actions">
          <button class="debug-panel__reset debug-auto-equipment__preview" type="button">Preview</button>
          <button class="debug-panel__reset debug-auto-equipment__promote" type="button">Promote</button>
        </div>
        <fieldset class="debug-auto-equipment__generated">
          <legend>Generated</legend>
          <label class="debug-rig-editor__part">
            <span>Item</span>
            <select class="debug-auto-equipment__generated-select"></select>
          </label>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-auto-equipment__remove" type="button">Remove generated</button>
          </div>
        </fieldset>
        <fieldset class="debug-auto-equipment__set-importer">
          <legend>Set importer</legend>
          <label class="debug-rig-editor__part">
            <span>Set</span>
            <input class="debug-auto-equipment__set-name" type="text" placeholder="Wood Boss" />
          </label>
          <label class="debug-rig-editor__part">
            <span>Variant</span>
            <input class="debug-auto-equipment__set-variant" type="text" value="01" />
          </label>
          <label class="debug-rig-editor__part">
            <span>Rarity</span>
            <select class="debug-auto-equipment__set-rarity debug-rarity-select">${formatAutoEquipmentRarityOptions()}</select>
          </label>
          <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
            <span>Shop</span>
            <input class="debug-auto-equipment__set-shop" type="checkbox" checked />
          </label>
          <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
            <span>Enemy pool</span>
            <input class="debug-auto-equipment__set-enemy-pool" type="checkbox" />
          </label>
          <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
            <span>Boss unique</span>
            <input class="debug-auto-equipment__set-boss-unique" type="checkbox" />
          </label>
          <div class="debug-auto-equipment__set-assets"></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-auto-equipment__set-rename" type="button">Rename selected set assets</button>
            <button class="debug-panel__reset debug-auto-equipment__set-promote" type="button">Promote full set</button>
          </div>
        </fieldset>
        <fieldset class="debug-auto-equipment__weapon-importer">
          <legend>Weapon importer</legend>
          <div class="debug-auto-equipment__weapon-assets"></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-auto-equipment__weapon-promote" type="button">Promote selected weapons</button>
          </div>
        </fieldset>
        <fieldset class="debug-auto-equipment__shield-importer">
          <legend>Shield importer</legend>
          <div class="debug-auto-equipment__shield-assets"></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-auto-equipment__shield-promote" type="button">Promote selected shields</button>
          </div>
        </fieldset>
        <p class="debug-auto-equipment__status" aria-live="polite"></p>
      </div>
    </details>
    <details class="debug-tier-editor-panel">
      <summary>Arena tiers</summary>
      <div class="debug-tier-editor">
        <div class="debug-boss-editor__boss-row">
          <label class="debug-rig-editor__part debug-boss-editor__boss-select">
            <span>Tier</span>
            <select class="debug-tier-editor__select"></select>
          </label>
          <button class="debug-panel__reset debug-tier-editor__new" type="button">New</button>
        </div>
        <label class="debug-rig-editor__part">
          <span>ID</span>
          <input class="debug-tier-editor__id" type="number" min="1" max="${DEBUG_BOSS_TIER_MAX}" step="1" />
        </label>
        <label class="debug-rig-editor__part">
          <span>Name</span>
          <input class="debug-tier-editor__name" type="text" />
        </label>
        <label class="debug-rig-editor__part">
          <span>Unlock after boss</span>
          <select class="debug-tier-editor__unlock"></select>
        </label>
        <p class="debug-tier-editor__bosses"></p>
        <div class="debug-tier-editor__difficulties">
          ${ARENA_DIFFICULTY_IDS.map(formatArenaTierDifficultyEditor).join("")}
        </div>
        <div class="debug-boss-editor__actions">
          <button class="debug-panel__reset debug-tier-editor__save" type="button">Save tier</button>
        </div>
        <p class="debug-tier-editor__status" aria-live="polite"></p>
      </div>
    </details>
    <details class="debug-boss-editor-panel">
      <summary>Boss editor</summary>
      <div class="debug-boss-editor">
        <div class="debug-boss-editor__boss-row">
          <label class="debug-rig-editor__part debug-boss-editor__boss-select">
            <span>Boss</span>
            <select class="debug-boss-editor__select"></select>
          </label>
          <button class="debug-panel__reset debug-boss-editor__new" type="button">New</button>
        </div>
        <label class="debug-rig-editor__part">
          <span>ID</span>
          <input class="debug-boss-editor__id" type="text" />
        </label>
        <label class="debug-rig-editor__part">
          <span>Name</span>
          <input class="debug-boss-editor__name" type="text" />
        </label>
        <label class="debug-panel__row debug-rig-editor__row">
          <span>Tier</span>
          <input class="debug-panel__range" type="range" min="1" max="${DEBUG_BOSS_TIER_MAX}" step="1" value="1" data-boss-tier />
          <input class="debug-panel__number" type="number" min="1" max="${DEBUG_BOSS_TIER_MAX}" step="1" value="1" data-boss-tier-number />
        </label>
        <fieldset class="debug-boss-editor__stats">
          <legend>Stats</legend>
          ${formatBossEditorNumberRow("STR", "strength", 0, DEBUG_BOSS_STAT_MAX)}
          ${formatBossEditorNumberRow("AGI", "agility", 0, DEBUG_BOSS_STAT_MAX)}
          ${formatBossEditorNumberRow("VIT", "vitality", 0, DEBUG_BOSS_STAT_MAX)}
        </fieldset>
        <fieldset class="debug-boss-editor__equipment">
          <legend>Equipment</legend>
          <div class="debug-boss-editor__equipment-controls"></div>
        </fieldset>
        <fieldset class="debug-boss-editor__rewards">
          <legend>Rewards</legend>
          ${formatBossEditorNumberRow("Win gold", "win-gold", 0, DEBUG_BOSS_REWARD_MAX)}
          ${formatBossEditorNumberRow("Win XP", "win-xp", 0, DEBUG_BOSS_REWARD_MAX)}
          ${formatBossEditorNumberRow("Loss gold", "loss-gold", 0, DEBUG_BOSS_REWARD_MAX)}
          ${formatBossEditorNumberRow("Loss XP", "loss-xp", 0, DEBUG_BOSS_REWARD_MAX)}
        </fieldset>
        <label class="debug-panel__row debug-rig-editor__row">
          <span>Loot chance</span>
          <input class="debug-panel__range" type="range" min="0" max="1" step="${DEBUG_BOSS_LOOT_CHANCE_STEP}" value="1" data-boss-loot-chance />
          <input class="debug-panel__number" type="number" min="0" max="1" step="${DEBUG_BOSS_LOOT_CHANCE_STEP}" value="1" data-boss-loot-chance-number />
        </label>
        <p class="debug-boss-editor__loot"></p>
        <div class="debug-boss-editor__actions">
          <button class="debug-panel__reset debug-boss-editor__preview" type="button">Preview</button>
          <button class="debug-panel__reset debug-boss-editor__save" type="button">Save boss</button>
        </div>
        <p class="debug-boss-editor__status" aria-live="polite"></p>
      </div>
    </details>
    <details class="debug-arena-panel">
      <summary>Arena tuning</summary>
      <div class="debug-panel__body"></div>
    </details>
    <details class="debug-hud-panel" open>
      <summary>HUD tuning</summary>
      <div class="debug-panel__hud-body"></div>
      <div class="debug-classic-slots"></div>
    </details>
    <details class="debug-city-panel" open>
      <summary>City tuning</summary>
      <div class="debug-panel__city-body"></div>
    </details>
    <details class="debug-ui-layout-panel" open>
      <summary>UI layout tuner</summary>
      <div class="debug-ui-layout"></div>
    </details>
    <details class="debug-effects-panel" open>
      <summary>Effects</summary>
      <div class="debug-effects">
        <details class="debug-panel__group debug-effects__group">
          <summary>Slash arc</summary>
          <label class="debug-rig-editor__part">
            <span>Attack</span>
            <select class="debug-effects__slash-select"></select>
          </label>
          <div class="debug-effects__slash-controls"></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-effects__start" type="button">Start</button>
            <button class="debug-panel__reset debug-effects__stop" type="button">Stop</button>
          </div>
          <button class="debug-panel__reset debug-effects__reset-slash" type="button">Reset slash</button>
        </details>
        <div class="debug-effects__popup-controls"></div>
      </div>
    </details>
    <div class="debug-panel__prod-actions">
      <button class="debug-panel__reset debug-panel__save-prod" type="button">Save as prod defaults</button>
      <p class="debug-panel__status" aria-live="polite"></p>
    </div>
  `;

  const body = panel.querySelector<HTMLElement>(".debug-panel__body");
  const hudBody = panel.querySelector<HTMLElement>(".debug-panel__hud-body");
  const classicSlotsBody = panel.querySelector<HTMLElement>(".debug-classic-slots");
  const cityBody = panel.querySelector<HTMLElement>(".debug-panel__city-body");
  const uiLayoutBody = panel.querySelector<HTMLElement>(".debug-ui-layout");
  const effectsBody = panel.querySelector<HTMLElement>(".debug-effects");
  const rigEditor = panel.querySelector<HTMLElement>(".debug-rig-editor");
  const facePanel = panel.querySelector<HTMLDetailsElement>(".debug-face-panel");
  const faceAssetEditor = panel.querySelector<HTMLElement>(".debug-face-editor");
  const itemEquipmentBody = panel.querySelector<HTMLElement>(".debug-item-equipment");
  const autoEquipmentBody = panel.querySelector<HTMLElement>(".debug-auto-equipment");
  const tierEditorBody = panel.querySelector<HTMLElement>(".debug-tier-editor");
  const bossEditorBody = panel.querySelector<HTMLElement>(".debug-boss-editor");
  const saveButton = panel.querySelector<HTMLButtonElement>(".debug-panel__save-prod");
  const status = panel.querySelector<HTMLElement>(".debug-panel__status");

  if (
    !body ||
    !hudBody ||
    !classicSlotsBody ||
    !cityBody ||
    !uiLayoutBody ||
    !effectsBody ||
    !rigEditor ||
    !facePanel ||
    !faceAssetEditor ||
    !itemEquipmentBody ||
    !autoEquipmentBody ||
    !tierEditorBody ||
    !bossEditorBody ||
    !saveButton ||
    !status
  ) {
    return;
  }

  body.parentElement?.before(createArenaBackgroundEditor(options.onRestartArenaTierPreview));

  for (const group of controlGroups) {
    body.append(createControlGroup(group));
  }

  for (const group of hudControlGroups) {
    hudBody.append(createControlGroup(group));
  }

  mountClassicActionButtonEditor(classicSlotsBody);

  for (const group of cityControlGroups) {
    cityBody.append(createControlGroup(group));
  }

  cityBody.append(createHeroPortraitButtonReset());

  const previewToolbar = createPreviewToolbar();
  const previewTools = createPreviewTools(previewToolbar);
  const previewColumn = document.querySelector<HTMLElement>(".debug-preview-column");
  const characterShell = document.querySelector<HTMLElement>("#debugCharacterShell");

  if (previewColumn) {
    previewColumn.prepend(previewTools);
  } else {
    previewTools.classList.add("debug-preview-tools--inline");
    rigEditor.prepend(previewTools);
  }

  characterShell?.append(createCharacterPreviewArmorToggle());

  mountPreviewToolbar(previewToolbar);
  mountRigEditor(rigEditor);
  mountAnimationWorkbench();
  mountFaceAssetEditor(faceAssetEditor);
  mountEffectsEditor(effectsBody);
  mountUiLayoutEditor(uiLayoutBody);
  mountItemEquipmentEditor(itemEquipmentBody);
  mountAutoEquipmentEditor(autoEquipmentBody);
  mountArenaTierEditor(tierEditorBody);
  mountBossEditor(bossEditorBody);
  mountCharacterCanvasEquipmentBridge(panel);
  mountModeTabs(panel);

  facePanel.addEventListener("toggle", () => {
    if (facePanel.open) {
      updateDebugTuning({ characterCanvasEditMode: "face" }, { undoable: false });
    }
  });

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    status.textContent = "Saving prod defaults...";

    try {
      status.textContent = await saveProdDefaults(debugTuning);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not save prod defaults.";
    } finally {
      saveButton.disabled = false;
    }
  });

  root.append(panel);
  mountDebugGrid();
  mountDebugUndoShortcut();
  subscribeDebugTuning(() => syncDebugTools(panel));
  syncDebugTools(panel);
}

function configureHeroEquipmentDebug(options: DebugPanelOptions): void {
  debugHeroEquipment = options.heroEquipment ? { ...options.heroEquipment } : undefined;
  notifyHeroEquipmentChange = options.onHeroEquipmentChange;
  previewSlashArc = options.onPreviewSlashArc;
  previewPopup = options.onPreviewPopup;
}

function mountUiLayoutEditor(root: HTMLElement): void {
  root.innerHTML = `
    <label class="debug-rig-editor__part">
      <span>Screen</span>
      <select class="debug-ui-layout__screen"></select>
    </label>
    <label class="debug-rig-editor__part">
      <span>Block</span>
      <select class="debug-ui-layout__block"></select>
    </label>
    <label class="debug-rig-editor__part">
      <span>Viewport</span>
      <select class="debug-ui-layout__viewport"></select>
    </label>
    <div class="debug-ui-layout__controls"></div>
    <div class="debug-rig-editor__actions">
      <button class="debug-panel__reset debug-ui-layout__reset-block" type="button">Reset block</button>
      <button class="debug-panel__reset debug-ui-layout__reset-screen" type="button">Reset screen</button>
    </div>
    <button class="debug-panel__reset debug-ui-layout__save-screen" type="button">Save current screen UI as prod</button>
    <p class="debug-ui-layout__status" aria-live="polite"></p>
  `;

  const screenSelect = root.querySelector<HTMLSelectElement>(".debug-ui-layout__screen");
  const blockSelect = root.querySelector<HTMLSelectElement>(".debug-ui-layout__block");
  const viewportSelect = root.querySelector<HTMLSelectElement>(".debug-ui-layout__viewport");
  const controls = root.querySelector<HTMLElement>(".debug-ui-layout__controls");
  const resetBlock = root.querySelector<HTMLButtonElement>(".debug-ui-layout__reset-block");
  const resetScreen = root.querySelector<HTMLButtonElement>(".debug-ui-layout__reset-screen");
  const saveScreen = root.querySelector<HTMLButtonElement>(".debug-ui-layout__save-screen");
  const status = root.querySelector<HTMLElement>(".debug-ui-layout__status");

  if (!screenSelect || !blockSelect || !viewportSelect || !controls || !resetBlock || !resetScreen || !saveScreen || !status) {
    return;
  }

  screenSelect.innerHTML = UI_LAYOUT_SCREENS.map((screen) => `<option value="${screen.id}">${screen.label}</option>`).join("");
  viewportSelect.innerHTML = UI_LAYOUT_VIEWPORTS.map((viewport) => `<option value="${viewport}">${viewport}</option>`).join("");

  screenSelect.addEventListener("change", () => {
    const screen = getUiLayoutScreen(screenSelect.value);
    selectUiLayoutTuning({ selectedScreenId: screen.id, selectedBlockId: screen.blocks[0]?.id ?? uiLayoutTuning.selectedBlockId });
  });

  blockSelect.addEventListener("change", () => {
    selectUiLayoutTuning({ selectedBlockId: blockSelect.value });
  });

  viewportSelect.addEventListener("change", () => {
    selectUiLayoutTuning({ selectedViewport: normalizeUiLayoutViewport(viewportSelect.value) });
  });

  resetBlock.addEventListener("click", () => {
    resetUiLayoutBlock(uiLayoutTuning.selectedScreenId, uiLayoutTuning.selectedBlockId, uiLayoutTuning.selectedViewport);
    status.textContent = `Reset ${getUiLayoutBlock().label} ${uiLayoutTuning.selectedViewport}.`;
  });

  resetScreen.addEventListener("click", () => {
    resetUiLayoutScreen(uiLayoutTuning.selectedScreenId, uiLayoutTuning.selectedViewport);
    status.textContent = `Reset ${getUiLayoutScreen().label} ${uiLayoutTuning.selectedViewport}.`;
  });

  saveScreen.addEventListener("click", async () => {
    saveScreen.disabled = true;
    status.textContent = "Saving UI layout defaults...";

    try {
      status.textContent = await saveUiLayoutProdDefaults(uiLayoutTuning.selectedScreenId, uiLayoutTuning);
      clearUiLayoutTuningStorage();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not save UI layout defaults.";
    } finally {
      saveScreen.disabled = false;
    }
  });

  const sync = () => {
    const screen = getUiLayoutScreen();
    const block = getUiLayoutBlock(screen.id);

    screenSelect.value = screen.id;
    blockSelect.innerHTML = screen.blocks.map((candidate) => `<option value="${candidate.id}">${candidate.label}</option>`).join("");
    blockSelect.value = block.id;
    viewportSelect.value = uiLayoutTuning.selectedViewport;
    controls.replaceChildren(...block.controls.map((control) => createUiLayoutControlRow(screen, block, control, uiLayoutTuning.selectedViewport)));
    applyUiLayoutTuning();
    syncUiLayoutTargetHighlight();
  };

  subscribeUiLayoutTuning(sync);
  sync();
}

function createUiLayoutControlRow(
  screen: UiLayoutScreenConfig,
  block: UiLayoutBlockConfig,
  control: UiLayoutControlConfig,
  viewport: UiLayoutViewport,
): HTMLElement {
  const row = document.createElement("label");
  const value = getUiLayoutControlValue(screen.id, block.id, control, viewport);

  row.className = "debug-panel__row debug-ui-layout__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input class="debug-panel__range" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" />
    <input class="debug-panel__number" type="number" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" />
    <button class="debug-panel__control-reset" type="button">Reset</button>
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");
  const reset = row.querySelector<HTMLButtonElement>(".debug-panel__control-reset");

  range?.addEventListener("input", () => {
    updateUiLayoutControlValue(screen.id, block.id, control, viewport, Number(range.value));
  });

  number?.addEventListener("input", () => {
    updateUiLayoutControlValue(screen.id, block.id, control, viewport, Number(number.value));
  });

  reset?.addEventListener("click", (event) => {
    event.preventDefault();
    resetUiLayoutControlValue(screen.id, block.id, control, viewport);
  });

  return row;
}

function normalizeUiLayoutViewport(value: string): UiLayoutViewport {
  return UI_LAYOUT_VIEWPORTS.includes(value as UiLayoutViewport) ? value as UiLayoutViewport : "desktop";
}

function createHeroPortraitButtonReset(): HTMLButtonElement {
  const button = document.createElement("button");

  button.className = "debug-panel__reset debug-panel__reset--city";
  button.type = "button";
  button.textContent = "Reset";
  button.addEventListener("click", () => {
    updateDebugTuning({
      heroPortraitButtonX: defaultDebugTuning.heroPortraitButtonX,
      heroPortraitButtonY: defaultDebugTuning.heroPortraitButtonY,
      heroPortraitButtonScale: defaultDebugTuning.heroPortraitButtonScale,
    });
  });

  return button;
}

function createPreviewTools(...items: HTMLElement[]): HTMLElement {
  const tools = document.createElement("div");
  tools.className = "debug-preview-tools";
  tools.append(...items);

  return tools;
}

function createCharacterPreviewArmorToggle(): HTMLElement {
  const label = document.createElement("label");

  label.className = "debug-character-viewer__armor-toggle";
  label.innerHTML = `
    <input type="checkbox" data-debug-key="characterPreviewArmorGhosted" />
    <span>Ghost armor</span>
  `;

  const input = label.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    updateDebugTuning({ characterPreviewArmorGhosted: input.checked });
  });

  return label;
}

function mountDebugUndoShortcut(): void {
  if (isDebugUndoShortcutMounted) {
    return;
  }

  isDebugUndoShortcutMounted = true;

  document.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.key.toLowerCase() !== "z") {
      return;
    }

    if (isEditableUndoTarget(event.target)) {
      return;
    }

    if (undoDebugTuning()) {
      event.preventDefault();
    }
  });
}

function isEditableUndoTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable || target instanceof HTMLTextAreaElement) {
    return true;
  }

  if (!(target instanceof HTMLInputElement)) {
    return false;
  }

  return ["email", "number", "password", "search", "tel", "text", "url"].includes(target.type);
}

function createPreviewToolbar(): HTMLElement {
  const toolbar = document.createElement("aside");
  toolbar.className = "debug-preview-toolbar";
  toolbar.setAttribute("aria-label", "Rig preview controls");
  toolbar.innerHTML = `
    <fieldset class="debug-preview-toolbar__group">
      <legend>Preview</legend>
      <div class="debug-preview-toolbar__controls"></div>
      <div class="debug-preview-toolbar__actions">
        <button class="debug-panel__reset debug-preview-toolbar__rotate-left" type="button">Rot doll -</button>
        <button class="debug-panel__reset debug-preview-toolbar__rotate-right" type="button">Rot doll +</button>
      </div>
    </fieldset>
  `;

  return toolbar;
}

function mountPreviewToolbar(toolbar: HTMLElement): void {
  const controls = toolbar.querySelector<HTMLElement>(".debug-preview-toolbar__controls");
  const rotateLeft = toolbar.querySelector<HTMLButtonElement>(".debug-preview-toolbar__rotate-left");
  const rotateRight = toolbar.querySelector<HTMLButtonElement>(".debug-preview-toolbar__rotate-right");

  if (!controls || !rotateLeft || !rotateRight) {
    return;
  }

  characterPreviewControls.forEach((control) => controls.append(createCharacterPreviewRangeControl(control)));

  rotateLeft.addEventListener("click", () => {
    rotatePaperDoll(-5);
  });

  rotateRight.addEventListener("click", () => {
    rotatePaperDoll(5);
  });
}

function mountCharacterCanvasEquipmentBridge(panel: HTMLElement): void {
  if (isCharacterCanvasEquipmentBridgeMounted) {
    return;
  }

  isCharacterCanvasEquipmentBridgeMounted = true;

  subscribeDebugCharacterEquipmentSelect((selection) => {
    selectCharacterCanvasEquipment(selection);
    syncEquipmentEditor(panel);
  });

  subscribeDebugCharacterEquipmentDelta((selection, delta) => {
    selectCharacterCanvasEquipment(selection);
    updateCharacterCanvasEquipmentDelta(delta);
    syncEquipmentEditor(panel);
  });
}

type DebugMode = "character" | "animation" | "city" | "arena" | "hud" | "ui" | "effects";

function mountModeTabs(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLButtonElement>("button[data-debug-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = getDebugModeFromValue(button.dataset.debugMode);

      setDebugMode(mode);
      syncModeTabs(panel);
    });
  });

  syncModeTabs(panel);
}

function setDebugMode(mode: DebugMode): void {
  document.body.classList.toggle("debug-mode-character", mode === "character");
  document.body.classList.toggle("debug-mode-animation", mode === "animation");
  document.body.classList.toggle("debug-mode-city", mode === "city");
  document.body.classList.toggle("debug-mode-arena", mode === "arena");
  document.body.classList.toggle("debug-mode-hud", mode === "hud");
  document.body.classList.toggle("debug-mode-ui", mode === "ui");
  document.body.classList.toggle("debug-mode-effects", mode === "effects");
  applyUiLayoutTuning();
  window.requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
}

function getDebugModeFromValue(value: string | undefined): DebugMode {
  if (value === "animation" || value === "city" || value === "arena" || value === "hud" || value === "ui" || value === "effects") {
    return value;
  }

  return "character";
}

function createControlGroup(group: DebugControlGroup): HTMLElement {
  const details = document.createElement("details");
  const body = document.createElement("div");

  details.className = "debug-panel__group";
  body.className = "debug-panel__group-body";

  const summary = document.createElement("summary");
  summary.textContent = group.title;
  details.append(summary);

  for (const control of group.controls) {
    body.append(createControl(control));
  }

  details.append(body);

  return details;
}

function createArenaBackgroundEditor(onRestartArenaTierPreview?: (tierId: number, backgroundVariantId?: ArenaBackgroundVariantId) => void): HTMLElement {
  const details = document.createElement("details");

  details.className = "debug-arena-panel debug-parallax-editor debug-arena-bg-editor";
  details.open = true;
  details.innerHTML = `
    <summary>Arena background</summary>
    <div class="debug-parallax-editor__section debug-parallax-editor__section--tier">
      <div class="debug-parallax-editor__subhead">Tier</div>
      <label class="debug-panel__row">
        <span>Preview tier</span>
        <input class="debug-panel__number" type="number" min="1" max="${DEBUG_BOSS_TIER_MAX}" step="1" data-arena-bg-preview-tier />
        <button class="debug-panel__control-reset debug-parallax-editor__restart-tier" type="button">Fight</button>
        <span></span>
      </label>
      <label class="debug-panel__row">
        <span>Variant</span>
        <select class="debug-panel__number" data-arena-bg-preview-variant>
          ${getArenaBackgroundVariantOptionsForTier(getArenaBackgroundEditTierId()).map((variantId) => `<option value="${variantId}">${formatArenaBackgroundVariantLabel(variantId)}</option>`).join("")}
        </select>
        <span></span>
        <span></span>
      </label>
      <div class="debug-rig-editor__actions">
        <button class="debug-panel__reset debug-panel__save-prod debug-arena-bg-editor__save-tier-background" type="button">Save tier BG as prod</button>
        <button class="debug-panel__reset debug-arena-bg-editor__reset-tier" type="button">Reset current tier BG</button>
      </div>
    </div>
    <div class="debug-parallax-editor__section">
      <div class="debug-parallax-editor__subhead">Layer layout</div>
      <label class="debug-panel__row debug-panel__row--toggle">
        <span>Drag selected</span>
        <input type="checkbox" data-debug-key="arenaBackgroundEditMode" />
        <span></span>
        <span></span>
      </label>
      <label class="debug-panel__row">
        <span>Layer</span>
        <select class="debug-panel__number" data-debug-select-key="arenaBackgroundEditLayer">
          ${getArenaBackgroundEditLayersForTier(getArenaBackgroundEditTierId()).map((layer) => `<option value="${layer}">${formatArenaBackgroundLayerLabel(layer)}</option>`).join("")}
        </select>
        <span></span>
        <span></span>
      </label>
      <label class="debug-panel__row debug-panel__row--toggle">
        <span>Visible</span>
        <input type="checkbox" data-arena-bg-field="visible" />
        <span></span>
        <span></span>
      </label>
      ${createArenaBackgroundNumberRow("x", "X", -640, 640, 1)}
      ${createArenaBackgroundNumberRow("y", "Y", -900, 900, 1)}
      ${createArenaBackgroundNumberRow("scale", "Scale", 0.25, 2.5, 0.01)}
      ${createArenaBackgroundNumberRow("alpha", "Alpha", 0, 1, 0.01)}
      <div class="debug-rig-editor__actions">
        <button class="debug-panel__reset debug-arena-bg-editor__reset-layer" type="button">Reset layer</button>
      </div>
    </div>
    <div class="debug-parallax-editor__section">
      <div class="debug-parallax-editor__subhead">Camera parallax</div>
      <label class="debug-panel__row">
        <span>Parallax layer</span>
        <select class="debug-panel__number" data-arena-parallax-layer-select>
          ${getArenaParallaxLayersForTier(getArenaBackgroundEditTierId()).map((layer) => `<option value="${layer}">${formatArenaParallaxLayerLabel(layer)}</option>`).join("")}
        </select>
        <span></span>
        <span></span>
      </label>
      <div class="debug-panel__group-body debug-parallax-editor__camera-controls">
        ${ARENA_PARALLAX_CONTROLS.map(createArenaParallaxNumberRow).join("")}
      </div>
    </div>
    <p class="debug-parallax-editor__status" aria-live="polite"></p>
  `;

  const status = details.querySelector<HTMLElement>(".debug-parallax-editor__status");
  const previewTier = details.querySelector<HTMLInputElement>("[data-arena-bg-preview-tier]");
  const variantSelect = details.querySelector<HTMLSelectElement>("[data-arena-bg-preview-variant]");
  const layerSelect = details.querySelector<HTMLSelectElement>('select[data-debug-select-key="arenaBackgroundEditLayer"]');
  const parallaxLayerSelect = details.querySelector<HTMLSelectElement>("[data-arena-parallax-layer-select]");
  const restartTier = details.querySelector<HTMLButtonElement>(".debug-parallax-editor__restart-tier");
  const saveTierBackground = details.querySelector<HTMLButtonElement>(".debug-arena-bg-editor__save-tier-background");

  const initialTierId = getArenaBackgroundEditTierId();
  const initialVariantId = getArenaBackgroundEditVariantIdForTier(initialTierId);

  if (debugTuning.arenaBackgroundPreviewVariant !== initialVariantId) {
    updateDebugTuning({ arenaBackgroundPreviewVariant: initialVariantId }, { undoable: false });
  }

  if (!getArenaBackgroundEditLayersForTier(initialTierId, initialVariantId).includes(debugTuning.arenaBackgroundEditLayer)) {
    updateDebugTuning({ arenaBackgroundEditLayer: getSelectedArenaBackgroundEditLayerForTier(initialTierId, initialVariantId) }, { undoable: false });
  }

  previewTier?.addEventListener("input", () => {
    const tierId = Math.round(clampFiniteNumber(Number(previewTier.value), 1, DEBUG_BOSS_TIER_MAX));
    const editTierId = getArenaBackgroundEditTierIdFromPreviewTier(tierId);
    const variantId = resolveArenaBackgroundPreviewVariantForTier(editTierId);

    updateDebugTuning({
      arenaBackgroundPreviewTier: tierId,
      arenaBackgroundPreviewVariant: variantId,
      arenaBackgroundEditLayer: getSelectedArenaBackgroundEditLayerForTier(editTierId, variantId),
    }, { undoable: false });
  });
  variantSelect?.addEventListener("change", () => {
    const tierId = getArenaBackgroundEditTierId();
    const variantId = resolveArenaBackgroundPreviewVariantForTier(tierId, variantSelect.value);

    updateDebugTuning({
      arenaBackgroundPreviewVariant: variantId,
      arenaBackgroundEditLayer: getSelectedArenaBackgroundEditLayerForTier(tierId, variantId),
    }, { undoable: false });
  });
  layerSelect?.addEventListener("change", () => {
    if (getArenaBackgroundEditLayersForTier(getArenaBackgroundEditTierId()).includes(layerSelect.value as ArenaBackgroundEditLayer)) {
      updateDebugTuning({ arenaBackgroundEditLayer: layerSelect.value as ArenaBackgroundEditLayer }, { undoable: false });
    }
  });
  parallaxLayerSelect?.addEventListener("change", () => {
    const layer = parallaxLayerSelect.value;

    if (isArenaParallaxLayer(layer) && getArenaParallaxLayersForTier(getArenaBackgroundEditTierId()).includes(layer)) {
      arenaParallaxEditorLayer = layer;
      syncArenaBackgroundParallaxValues(details);
      syncArenaBackgroundParallaxControls(details);
    }
  });
  restartTier?.addEventListener("click", () => {
    const tierId = Math.round(clampFiniteNumber(Number(previewTier?.value || debugTuning.arenaBackgroundPreviewTier), 1, DEBUG_BOSS_TIER_MAX));
    const editTierId = getArenaBackgroundEditTierIdFromPreviewTier(tierId);
    const variantId = resolveArenaBackgroundPreviewVariantForTier(editTierId, variantSelect?.value);

    updateDebugTuning({ arenaBackgroundPreviewTier: tierId, arenaBackgroundPreviewVariant: variantId });
    onRestartArenaTierPreview?.(tierId, variantId);
    if (status) {
      status.textContent = onRestartArenaTierPreview
        ? `Preview fight restarted on tier ${tierId}, ${formatArenaBackgroundVariantLabel(variantId)}.`
        : "Debug fight restart is not mounted.";
    }
  });
  if (restartTier) {
    restartTier.disabled = !onRestartArenaTierPreview;
  }
  saveTierBackground?.addEventListener("click", async () => {
    const tierId = getArenaBackgroundEditTierId();

    saveTierBackground.disabled = true;
    if (status) {
      status.textContent = `Saving tier ${tierId} background to prod...`;
    }

    try {
      const message = await saveArenaTierBackground(createArenaTierBackgroundPayload(tierId));

      if (status) {
        status.textContent = message;
      }
    } catch (error) {
      if (status) {
        status.textContent = error instanceof Error ? error.message : "Could not save arena tier background.";
      }
    } finally {
      saveTierBackground.disabled = false;
    }
  });

  details.querySelectorAll<HTMLInputElement>("[data-arena-bg-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const layer = getSelectedArenaBackgroundEditLayer();
      const field = input.dataset.arenaBgField;

      if (isArenaBackgroundLayoutField(field) && isArenaBackgroundLayoutFieldSupported(layer, field)) {
        updateSelectedArenaBackgroundLayer(field, input.type === "checkbox" ? input.checked : Number(input.value));
      }
    });
  });
  details.querySelectorAll<HTMLInputElement>("[data-arena-parallax-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const layer = getSelectedArenaParallaxLayer();
      const field = input.dataset.arenaParallaxField;

      if (isArenaParallaxField(field) && isArenaParallaxFieldSupported(layer, field)) {
        updateArenaParallaxValue(getArenaBackgroundEditTierId(), layer, field, Number(input.value));
      }
    });
  });
  details.querySelectorAll<HTMLButtonElement>("[data-arena-parallax-reset-field]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const layer = getSelectedArenaParallaxLayer();
      const field = button.dataset.arenaParallaxResetField;

      if (isArenaParallaxField(field) && isArenaParallaxFieldSupported(layer, field)) {
        resetArenaParallaxValue(getArenaBackgroundEditTierId(), layer, field);
      }
    });
  });

  details.querySelector<HTMLButtonElement>(".debug-arena-bg-editor__reset-layer")?.addEventListener("click", () => {
    updateDebugTuning(getArenaBackgroundLayerResetPatch(getArenaBackgroundEditTierId(), getSelectedArenaBackgroundEditLayer()));
  });
  details.querySelector<HTMLButtonElement>(".debug-arena-bg-editor__reset-tier")?.addEventListener("click", () => {
    updateDebugTuning(getArenaBackgroundTierResetPatch());
  });

  return details;
}

function createArenaTierBackgroundPayload(tierId: ArenaBackgroundEditTierId): ArenaTierBackgroundPayload {
  const variantId = getArenaBackgroundEditVariantIdForTier(tierId);

  return {
    tierId,
    variantId,
    layers: Object.fromEntries(
      getArenaBackgroundEditLayersForTier(tierId, variantId).map((layer) => [layer, createArenaTierBackgroundLayerPayload(tierId, layer, variantId)]),
    ) as ArenaTierBackgroundPayload["layers"],
  };
}

function createArenaTierBackgroundLayerPayload(
  tierId: ArenaBackgroundEditTierId,
  layer: ArenaBackgroundEditLayer,
  variantId = getArenaBackgroundEditVariantIdForTier(tierId),
): ArenaBackgroundLayerTuning {
  const parallax: ArenaBackgroundLayerTuning["parallax"] = {
    followX: getArenaParallaxValue(tierId, layer, "followX", variantId),
    followY: getArenaParallaxValue(tierId, layer, "followY", variantId),
    zoom: getArenaParallaxValue(tierId, layer, "zoom", variantId),
    lookUpY: getArenaParallaxValue(tierId, layer, "lookUpY", variantId),
  };

  if (isArenaParallaxFieldSupported(layer, "zoomDarken")) {
    parallax.zoomDarken = getArenaParallaxValue(tierId, layer, "zoomDarken", variantId);
  }

  if (isArenaParallaxFieldSupported(layer, "farAlpha")) {
    parallax.farAlpha = getArenaParallaxValue(tierId, layer, "farAlpha", variantId);
    parallax.nearAlpha = getArenaParallaxValue(tierId, layer, "nearAlpha", variantId);
  }

  return {
    layout: {
      x: Number(getArenaBackgroundLayerLayoutValue(tierId, layer, "x", variantId)),
      y: Number(getArenaBackgroundLayerLayoutValue(tierId, layer, "y", variantId)),
      scale: Number(getArenaBackgroundLayerLayoutValue(tierId, layer, "scale", variantId)),
      alpha: Number(getArenaBackgroundLayerLayoutValue(tierId, layer, "alpha", variantId)),
      visible: Boolean(getArenaBackgroundLayerLayoutValue(tierId, layer, "visible", variantId)),
    },
    parallax,
  };
}

function createArenaBackgroundNumberRow(field: Exclude<ArenaBackgroundLayoutField, "visible">, label: string, min: number, max: number, step: number): string {
  return `
    <label class="debug-panel__row" data-arena-bg-layout-row="${field}">
      <span>${label}</span>
      <input class="debug-panel__range" type="range" min="${min}" max="${max}" step="${step}" data-arena-bg-field="${field}" />
      <input class="debug-panel__number" type="number" min="${min}" max="${max}" step="${step}" data-arena-bg-field="${field}" />
      <span></span>
    </label>
  `;
}

function createArenaParallaxNumberRow(control: ArenaParallaxControlConfig): string {
  return `
    <label class="debug-panel__row" data-arena-parallax-row="${control.role}">
      <span>${control.label}</span>
      <input class="debug-panel__range" type="range" min="${control.min}" max="${control.max}" step="${control.step}" data-arena-parallax-field="${control.field}" />
      <input class="debug-panel__number" type="number" min="${control.min}" max="${control.max}" step="${control.step}" data-arena-parallax-field="${control.field}" />
      <button class="debug-panel__control-reset" type="button" data-arena-parallax-reset-field="${control.field}">Reset</button>
    </label>
  `;
}

function updateSelectedArenaBackgroundLayer(field: ArenaBackgroundLayoutField, value: number | boolean): void {
  const tierId = getArenaBackgroundEditTierId();
  const layer = getSelectedArenaBackgroundEditLayer();
  const variantId = getArenaBackgroundEditVariantIdForTier(tierId);

  if (usesDynamicArenaBackgroundLayerTuning(tierId, layer, variantId)) {
    updateDebugTuning(getDynamicArenaBackgroundLayerPatch(tierId, layer, {
      layout: { [field]: value } as Partial<ArenaBackgroundLayerTuning["layout"]>,
    }, variantId));
    return;
  }

  const key = getArenaBackgroundLayerTuningKey(getArenaBackgroundEditTierId(), getSelectedArenaBackgroundEditLayer(), field);

  updateDebugTuning({ [key]: value } as Partial<ArenaDebugTuning>);
}

function getArenaBackgroundLayerResetPatch(
  tierId: ArenaBackgroundEditTierId,
  layer: ArenaBackgroundEditLayer,
  variantId = getArenaBackgroundEditVariantIdForTier(tierId),
): Partial<ArenaDebugTuning> {
  if (usesDynamicArenaBackgroundLayerTuning(tierId, layer, variantId)) {
    return getDynamicArenaBackgroundLayerPatch(tierId, layer, createDefaultArenaBackgroundLayerTuning(layer), variantId);
  }

  const patch: Partial<ArenaDebugTuning> = {};

  (["x", "y", "scale", "alpha", "visible"] as const).forEach((field) => {
    const key = getArenaBackgroundLayerTuningKey(tierId, layer, field);

    patch[key] = defaultDebugTuning[key] as never;
  });

  return patch;
}

function getArenaBackgroundTierResetPatch(): Partial<ArenaDebugTuning> {
  const tierId = getArenaBackgroundEditTierId();
  const variantId = getArenaBackgroundEditVariantIdForTier(tierId);

  return getArenaBackgroundEditLayersForTier(tierId, variantId).reduce<Partial<ArenaDebugTuning>>((patch, layer) => ({ ...patch, ...getArenaBackgroundLayerResetPatch(tierId, layer, variantId) }), {});
}

function getArenaBackgroundLayerTuningKey(tierId: ArenaBackgroundEditTierId, layer: ArenaBackgroundEditLayer, field: ArenaBackgroundLayoutField): keyof ArenaDebugTuning {
  const prefix = getArenaBackgroundLayerTuningPrefix(tierId, layer);
  const suffix = field === "scale" ? "Scale" : field === "alpha" ? "Alpha" : field === "visible" ? "Visible" : field.toUpperCase();

  if (!prefix) {
    throw new Error(`Arena background layer ${layer} does not use legacy layout tuning.`);
  }

  return `${prefix}${suffix}` as keyof ArenaDebugTuning;
}

function getArenaBackgroundLayerLayoutValue(
  tierId: ArenaBackgroundEditTierId,
  layer: ArenaBackgroundEditLayer,
  field: ArenaBackgroundLayoutField,
  variantId = getArenaBackgroundEditVariantIdForTier(tierId),
): number | boolean {
  if (!isArenaBackgroundLayoutFieldSupported(layer, field)) {
    return field === "alpha" ? 1 : false;
  }

  if (usesDynamicArenaBackgroundLayerTuning(tierId, layer, variantId)) {
    return getDynamicArenaBackgroundLayerTuning(debugTuning, tierId, layer, variantId).layout[field];
  }

  return debugTuning[getArenaBackgroundLayerTuningKey(tierId, layer, field)] as number | boolean;
}

function getDynamicArenaBackgroundLayerPatch(
  tierId: ArenaBackgroundEditTierId,
  layer: ArenaBackgroundEditLayer,
  patch: ArenaBackgroundLayerTuningPatch,
  variantId = getArenaBackgroundEditVariantIdForTier(tierId),
): Partial<ArenaDebugTuning> {
  const current = getDynamicArenaBackgroundLayerTuning(debugTuning, tierId, layer, variantId);
  const nextLayer = {
    layout: { ...current.layout, ...patch.layout },
    parallax: { ...current.parallax, ...patch.parallax },
  };
  const tierKey = String(tierId);
  const tierTuning = debugTuning.arenaBackgroundTiers[tierKey] ?? {};

  if (variantId !== DEFAULT_ARENA_BACKGROUND_VARIANT_ID) {
    return {
      arenaBackgroundTiers: {
        ...debugTuning.arenaBackgroundTiers,
        [tierKey]: {
          ...tierTuning,
          variants: {
            ...tierTuning.variants,
            [variantId]: {
              ...tierTuning.variants?.[variantId],
              [layer]: nextLayer,
            },
          },
        },
      },
    };
  }

  return {
    arenaBackgroundTiers: {
      ...debugTuning.arenaBackgroundTiers,
      [tierKey]: {
        ...tierTuning,
        layers: {
          ...tierTuning.layers,
          [layer]: nextLayer,
        },
      },
    },
  };
}

function usesDynamicArenaBackgroundLayerTuning(
  tierId: ArenaBackgroundEditTierId,
  layer: ArenaBackgroundEditLayer,
  variantId = getArenaBackgroundEditVariantIdForTier(tierId),
): boolean {
  return variantId !== DEFAULT_ARENA_BACKGROUND_VARIANT_ID || tierId > 2 || !getArenaBackgroundLayerTuningPrefix(tierId, layer);
}

function usesDynamicArenaParallaxTuning(
  tierId: ArenaBackgroundEditTierId,
  layer: ArenaParallaxLayerKey,
  variantId = getArenaBackgroundEditVariantIdForTier(tierId),
): boolean {
  return variantId !== DEFAULT_ARENA_BACKGROUND_VARIANT_ID || tierId > 2 || !getArenaParallaxTuningPrefix(tierId, layer);
}

function isBaseArenaBackgroundLayer(layer: ArenaBackgroundEditLayer): boolean {
  return layer === getArenaBackgroundLayerRole(layer);
}

function getArenaBackgroundLayerTuningPrefix(tierId: ArenaBackgroundEditTierId, layer: ArenaBackgroundEditLayer):
  | "arenaTier1BackgroundBack"
  | "arenaTier1BackgroundMid"
  | "arenaTier1BackgroundGround"
  | "arenaTier2BackgroundBack"
  | "arenaTier2BackgroundMid"
  | "arenaTier2BackgroundGround"
  | "arenaTier2BackgroundFront"
  | "arenaTier2BackgroundAmbient"
  | undefined {
  if (!isBaseArenaBackgroundLayer(layer)) {
    return undefined;
  }

  const role = getArenaBackgroundLayerRole(layer);

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

function formatArenaBackgroundLayerLabel(layer: ArenaBackgroundEditLayer): string {
  const role = getArenaBackgroundLayerRole(layer);
  const instance = getArenaBackgroundLayerInstance(layer);
  const suffix = instance > 1 ? ` ${instance}` : "";

  switch (role) {
    case "back":
      return `Back${suffix}`;
    case "mid":
      return `Mid${suffix}`;
    case "ground":
      return `Ground${suffix}`;
    case "front":
      return `Front${suffix}`;
    case "ambient":
      return `Ambient${suffix}`;
  }
}

function getArenaBackgroundLayerInstance(layer: ArenaBackgroundEditLayer): number {
  const match = /-(\d+)$/u.exec(layer);

  return match ? Math.max(1, Number(match[1])) : 1;
}

function formatArenaParallaxLayerLabel(layer: ArenaParallaxLayerKey): string {
  return formatArenaBackgroundLayerLabel(layer);
}

function isArenaBackgroundLayoutField(value: string | undefined): value is ArenaBackgroundLayoutField {
  return value === "x" || value === "y" || value === "scale" || value === "alpha" || value === "visible";
}

function isArenaBackgroundLayoutFieldSupported(layer: ArenaBackgroundEditLayer, field: ArenaBackgroundLayoutField): boolean {
  return field !== "alpha" || getArenaBackgroundLayerRole(layer) !== "ambient";
}

function getSelectedArenaBackgroundEditLayer(): ArenaBackgroundEditLayer {
  return getSelectedArenaBackgroundEditLayerForTier(getArenaBackgroundEditTierId());
}

function getSelectedArenaBackgroundEditLayerForTier(
  tierId: ArenaBackgroundEditTierId,
  variantId = getArenaBackgroundEditVariantIdForTier(tierId),
): ArenaBackgroundEditLayer {
  const layers = getArenaBackgroundEditLayersForTier(tierId, variantId);

  return layers.includes(debugTuning.arenaBackgroundEditLayer) ? debugTuning.arenaBackgroundEditLayer : layers[0] ?? "ground";
}

function getArenaBackgroundEditLayersForTier(
  tierId: ArenaBackgroundEditTierId,
  variantId = getArenaBackgroundEditVariantIdForTier(tierId),
): readonly ArenaBackgroundEditLayer[] {
  return getArenaBackgroundLayerAssetKeysForTier(tierId, variantId);
}

function getArenaBackgroundEditVariantId(): ArenaBackgroundVariantId {
  return getArenaBackgroundEditVariantIdForTier(getArenaBackgroundEditTierId());
}

function getArenaBackgroundEditVariantIdForTier(tierId: ArenaBackgroundEditTierId): ArenaBackgroundVariantId {
  return resolveArenaBackgroundPreviewVariantForTier(tierId);
}

function getArenaBackgroundVariantOptionsForTier(tierId: ArenaBackgroundEditTierId): readonly ArenaBackgroundVariantId[] {
  return getArenaBackgroundVariantIdsForTier(tierId);
}

function resolveArenaBackgroundPreviewVariantForTier(
  tierId: ArenaBackgroundEditTierId,
  variantId = debugTuning.arenaBackgroundPreviewVariant,
): ArenaBackgroundVariantId {
  const variants = getArenaBackgroundVariantOptionsForTier(tierId);

  return variants.includes(variantId) ? variantId : variants[0] ?? DEFAULT_ARENA_BACKGROUND_VARIANT_ID;
}

function formatArenaBackgroundVariantLabel(variantId: ArenaBackgroundVariantId): string {
  return variantId === DEFAULT_ARENA_BACKGROUND_VARIANT_ID ? "Default" : variantId;
}

function getSelectedArenaParallaxLayer(): ArenaParallaxLayerKey {
  return getSelectedArenaParallaxLayerForTier(getArenaBackgroundEditTierId());
}

function getSelectedArenaParallaxLayerForTier(tierId: ArenaBackgroundEditTierId): ArenaParallaxLayerKey {
  const layers = getArenaParallaxLayersForTier(tierId);

  return layers.includes(arenaParallaxEditorLayer) ? arenaParallaxEditorLayer : layers[0] ?? "back";
}

function getArenaParallaxLayersForTier(tierId: ArenaBackgroundEditTierId): readonly ArenaParallaxLayerKey[] {
  return getArenaBackgroundEditLayersForTier(tierId);
}

function getArenaBackgroundEditTierId(): ArenaBackgroundEditTierId {
  return getArenaBackgroundEditTierIdFromPreviewTier(debugTuning.arenaBackgroundPreviewTier);
}

function getArenaBackgroundEditTierIdFromPreviewTier(tierId: number): ArenaBackgroundEditTierId {
  return Math.max(1, Math.round(tierId));
}

function getArenaParallaxTuningKey(tierId: ArenaBackgroundEditTierId, layer: ArenaParallaxLayerKey, field: ArenaParallaxField): keyof ArenaDebugTuning {
  const prefix = getArenaParallaxTuningPrefix(tierId, layer);
  const suffix = field === "followX"
    ? "FollowX"
    : field === "followY"
      ? "FollowY"
      : field === "zoom"
        ? "Zoom"
        : field === "lookUpY"
          ? "LookUpY"
          : field === "farAlpha"
            ? "FarAlpha"
            : field === "nearAlpha"
              ? "NearAlpha"
              : "ZoomDarken";

  if (!prefix) {
    throw new Error(`Arena parallax layer ${layer} does not use legacy parallax tuning.`);
  }

  return `${prefix}${suffix}` as keyof ArenaDebugTuning;
}

function getArenaParallaxValue(
  tierId: ArenaBackgroundEditTierId,
  layer: ArenaParallaxLayerKey,
  field: ArenaParallaxField,
  variantId = getArenaBackgroundEditVariantIdForTier(tierId),
): number {
  if (usesDynamicArenaParallaxTuning(tierId, layer, variantId)) {
    const value = getDynamicArenaBackgroundLayerTuning(debugTuning, tierId, layer, variantId).parallax[field];

    return typeof value === "number" ? value : createDefaultArenaBackgroundLayerTuning(layer).parallax[field] ?? 1;
  }

  return debugTuning[getArenaParallaxTuningKey(tierId, layer, field)] as number;
}

function updateArenaParallaxValue(tierId: ArenaBackgroundEditTierId, layer: ArenaParallaxLayerKey, field: ArenaParallaxField, value: number): void {
  const variantId = getArenaBackgroundEditVariantIdForTier(tierId);

  if (usesDynamicArenaParallaxTuning(tierId, layer, variantId)) {
    updateDebugTuning(getDynamicArenaBackgroundLayerPatch(tierId, layer, {
      parallax: { [field]: value } as Partial<ArenaBackgroundLayerTuning["parallax"]>,
    }, variantId));
    return;
  }

  updateDebugTuning({ [getArenaParallaxTuningKey(tierId, layer, field)]: value } as Partial<ArenaDebugTuning>);
}

function resetArenaParallaxValue(tierId: ArenaBackgroundEditTierId, layer: ArenaParallaxLayerKey, field: ArenaParallaxField): void {
  const variantId = getArenaBackgroundEditVariantIdForTier(tierId);

  if (usesDynamicArenaParallaxTuning(tierId, layer, variantId)) {
    updateDebugTuning(getDynamicArenaBackgroundLayerPatch(tierId, layer, {
      parallax: { [field]: createDefaultArenaBackgroundLayerTuning(layer).parallax[field] ?? 1 } as Partial<ArenaBackgroundLayerTuning["parallax"]>,
    }, variantId));
    return;
  }

  const key = getArenaParallaxTuningKey(tierId, layer, field);

  updateDebugTuning({ [key]: defaultDebugTuning[key] } as Partial<ArenaDebugTuning>);
}

function getArenaParallaxTuningPrefix(tierId: ArenaBackgroundEditTierId, layer: ArenaParallaxLayerKey):
  | "arenaTier1Back"
  | "arenaTier1Mid"
  | "arenaTier1Ground"
  | "arenaTier2Back"
  | "arenaTier2Mid"
  | "arenaTier2Ground"
  | "arenaTier2Front"
  | "arenaTier2Ambient"
  | undefined {
  if (!isBaseArenaBackgroundLayer(layer)) {
    return undefined;
  }

  const role = getArenaBackgroundLayerRole(layer);

  if (tierId === 1) {
    switch (role) {
      case "back":
        return "arenaTier1Back";
      case "mid":
        return "arenaTier1Mid";
      case "ground":
        return "arenaTier1Ground";
      case "front":
      case "ambient":
        return undefined;
    }
  }

  switch (role) {
    case "back":
      return "arenaTier2Back";
    case "mid":
      return "arenaTier2Mid";
    case "ground":
      return "arenaTier2Ground";
    case "front":
      return "arenaTier2Front";
    case "ambient":
      return "arenaTier2Ambient";
  }
}

function isArenaParallaxLayer(value: string | undefined): value is ArenaParallaxLayerKey {
  return isArenaBackgroundEditLayer(value);
}

function isArenaParallaxField(value: string | undefined): value is ArenaParallaxField {
  return value === "followX" || value === "followY" || value === "zoom" || value === "lookUpY" || value === "zoomDarken" || value === "farAlpha" || value === "nearAlpha";
}

function isArenaParallaxFieldSupported(layer: ArenaParallaxLayerKey, field: ArenaParallaxField): boolean {
  const role = getArenaBackgroundLayerRole(layer);

  if (field === "zoomDarken") {
    return role === "mid";
  }

  if (field === "farAlpha" || field === "nearAlpha") {
    return role === "ambient";
  }

  return true;
}

function createControl(control: DebugControlConfig): HTMLElement {
  if (control.type === "toggle") {
    return createToggleControl(control);
  }

  if (control.type === "select") {
    return createSelectControl(control);
  }

  return createRangeControl(control);
}

function createToggleControl(control: DebugToggleControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-panel__row--toggle";
  row.innerHTML = `
    <span>${control.label}</span>
    <input type="checkbox" data-debug-key="${control.key}" />
    <button class="debug-panel__control-reset" type="button" data-debug-reset-key="${control.key}" data-debug-reset-value="${control.resetValue}">Reset</button>
  `;

  const input = row.querySelector<HTMLInputElement>("input");
  const reset = row.querySelector<HTMLButtonElement>(".debug-panel__control-reset");

  input?.addEventListener("change", () => {
    updateDebugTuning({ [control.key]: input.checked });
  });

  reset?.addEventListener("click", (event) => {
    event.preventDefault();
    updateDebugTuning({ [control.key]: control.resetValue });
  });

  return row;
}

function createRangeControl(control: DebugRangeControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      value="${defaultDebugTuning[control.key]}"
      data-debug-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      value="${defaultDebugTuning[control.key]}"
      data-debug-number-key="${control.key}"
    />
    <button class="debug-panel__control-reset" type="button" data-debug-reset-key="${control.key}" data-debug-reset-value="${control.resetValue}">Reset</button>
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");
  const reset = row.querySelector<HTMLButtonElement>(".debug-panel__control-reset");

  range?.addEventListener("input", () => {
    updateDebugTuning({ [control.key]: Number(range.value) });
  });

  number?.addEventListener("input", () => {
    updateDebugTuning({ [control.key]: Number(number.value) });
  });

  reset?.addEventListener("click", (event) => {
    event.preventDefault();
    updateDebugTuning({ [control.key]: control.resetValue });
  });

  return row;
}

function createSelectControl(control: DebugSelectControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <select class="debug-panel__number" data-debug-select-key="${control.key}">
      ${control.options.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
    </select>
    <button class="debug-panel__control-reset" type="button" data-debug-reset-key="${control.key}" data-debug-reset-value="${control.resetValue}">Reset</button>
  `;

  const select = row.querySelector<HTMLSelectElement>("select");
  const reset = row.querySelector<HTMLButtonElement>(".debug-panel__control-reset");

  select?.addEventListener("change", () => {
    updateDebugTuning({ [control.key]: select.value } as Partial<ArenaDebugTuning>);
  });

  reset?.addEventListener("click", (event) => {
    event.preventDefault();
    updateDebugTuning({ [control.key]: control.resetValue } as Partial<ArenaDebugTuning>);
  });

  return row;
}

function mountClassicActionButtonEditor(root: HTMLElement): void {
  root.innerHTML = `
    <details class="debug-panel__group debug-classic-slots__group">
      <summary>Classic button slots</summary>
      <label class="debug-panel__row">
        <span>Wheel</span>
        <select class="debug-panel__number" data-classic-slot-mode>
          ${CLASSIC_ACTION_WHEEL_MODES.map((mode) => `<option value="${mode}">${classicWheelModeLabels[mode]}</option>`).join("")}
        </select>
        <span></span>
        <span></span>
      </label>
      <label class="debug-panel__row">
        <span>Button</span>
        <select class="debug-panel__number" data-classic-slot-action></select>
        <span></span>
        <span></span>
      </label>
      ${createClassicSlotNumberRow("x", "Slot X", -240, 240, 1)}
      ${createClassicSlotNumberRow("y", "Slot Y", -320, 80, 1)}
      ${createClassicSlotNumberRow("rotation", "Rotate", -180, 180, 1)}
      <button class="debug-panel__reset debug-classic-slots__reset" type="button">Reset selected slot</button>
    </details>
  `;

  const modeSelect = root.querySelector<HTMLSelectElement>("[data-classic-slot-mode]");
  const actionSelect = root.querySelector<HTMLSelectElement>("[data-classic-slot-action]");
  const reset = root.querySelector<HTMLButtonElement>(".debug-classic-slots__reset");

  modeSelect?.addEventListener("change", () => {
    if (isClassicActionWheelMode(modeSelect.value)) {
      const mode = modeSelect.value;
      const actionId = getClassicWheelActionButton(mode, debugTuning.selectedClassicActionButton);

      updateDebugTuning({ selectedClassicActionWheelMode: mode, selectedClassicActionButton: actionId });
    }
  });

  actionSelect?.addEventListener("change", () => {
    if (isActionButtonOffsetKey(actionSelect.value)) {
      updateDebugTuning({ selectedClassicActionButton: actionSelect.value });
    }
  });

  root.querySelectorAll<HTMLInputElement>("[data-classic-slot-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const field = input.dataset.classicSlotField;

      if (!isClassicSlotNumericKey(field)) {
        return;
      }

      updateSelectedClassicActionButtonSlot({ [field]: Number(input.value) });
    });
  });

  reset?.addEventListener("click", () => {
    const mode = debugTuning.selectedClassicActionWheelMode;
    const actionId = debugTuning.selectedClassicActionButton;
    const defaultSlot = DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS[mode][actionId];

    updateSelectedClassicActionButtonSlot(defaultSlot);
  });
}

function createClassicSlotNumberRow(field: ClassicSlotNumericKey, label: string, min: number, max: number, step: number): string {
  return `
    <label class="debug-panel__row">
      <span>${label}</span>
      <input class="debug-panel__range" type="range" min="${min}" max="${max}" step="${step}" data-classic-slot-field="${field}" />
      <input class="debug-panel__number" type="number" min="${min}" max="${max}" step="${step}" data-classic-slot-field="${field}" />
      <span></span>
    </label>
  `;
}

function mountItemEquipmentEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-item-equipment__select");
  const typeFilter = editor.querySelector<HTMLSelectElement>(".debug-item-equipment__type-filter");
  const rarityFilter = editor.querySelector<HTMLSelectElement>(".debug-item-equipment__rarity-filter");
  const picker = editor.querySelector<HTMLElement>(".debug-item-equipment__picker");
  const controls = editor.querySelector<HTMLElement>(".debug-item-equipment__controls");
  const valueRarity = editor.querySelector<HTMLSelectElement>(".debug-item-equipment__value-rarity");
  const valueStatRange = editor.querySelector<HTMLInputElement>("input[data-item-equipment-stat]");
  const valueStatNumber = editor.querySelector<HTMLInputElement>("input[data-item-equipment-stat-number]");
  const valuePriceRange = editor.querySelector<HTMLInputElement>("input[data-item-equipment-price]");
  const valuePriceNumber = editor.querySelector<HTMLInputElement>("input[data-item-equipment-price-number]");
  const save = editor.querySelector<HTMLButtonElement>(".debug-item-equipment__save");
  const valueStatus = editor.querySelector<HTMLElement>(".debug-item-equipment__value-status");
  const reset = editor.querySelector<HTMLButtonElement>(".debug-item-equipment__reset");

  if (
    !select ||
    !typeFilter ||
    !rarityFilter ||
    !picker ||
    !controls ||
    !valueRarity ||
    !valueStatRange ||
    !valueStatNumber ||
    !valuePriceRange ||
    !valuePriceNumber ||
    !save ||
    !valueStatus ||
    !reset
  ) {
    return;
  }

  EQUIPMENT_SLOT_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    select.append(option);
  });

  equipmentNumericControls.forEach((control) => controls.append(createEquipmentRangeControl(control)));
  equipmentToggleControls.forEach((control) => controls.append(createEquipmentToggleControl(control)));
  syncLinkedNumberInputs(valueStatRange, valueStatNumber, AUTO_EQUIPMENT_STAT_MIN, AUTO_EQUIPMENT_ARMOR_MAX);
  syncLinkedNumberInputs(valuePriceRange, valuePriceNumber, 0, AUTO_EQUIPMENT_PRICE_MAX);

  select.addEventListener("change", () => {
    if (isEquipmentSlotKey(select.value)) {
      activeEquipmentSlot = select.value;
      activeEquipmentItemId = "";
      activeEquipmentTypeFilter = "all";
      activeEquipmentRarityFilter = "all";
      const panel = editor.closest(".debug-panel") as HTMLElement | null;

      syncEquipmentEditor(panel ?? editor);
    }
  });

  typeFilter.addEventListener("change", () => {
    activeEquipmentTypeFilter = getDebugItemEquipmentTypeFilter(typeFilter.value);
    const panel = editor.closest(".debug-panel") as HTMLElement | null;

    syncEquipmentEditor(panel ?? editor);
  });

  rarityFilter.addEventListener("change", () => {
    activeEquipmentRarityFilter = getDebugItemEquipmentRarityFilter(rarityFilter.value);
    const panel = editor.closest(".debug-panel") as HTMLElement | null;

    syncEquipmentEditor(panel ?? editor);
  });

  valueRarity.addEventListener("change", () => {
    setDebugRarityDataset(valueRarity, getDebugItemRarity(valueRarity.value, "common"));
  });

  picker.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("[data-item-equipment-item]");

    if (!button) {
      return;
    }

    const definition = getDebugHeroItemDefinition(button.dataset.itemEquipmentItem);

    activeEquipmentItemId = definition?.id ?? "";

    if (definition && isEquipmentSlotKey(definition.equipmentSlot)) {
      activeEquipmentSlot = definition.equipmentSlot;
      updateHeroEquipmentItemWithPair(definition.id, definition.equipmentSlot);
    }

    const panel = editor.closest(".debug-panel") as HTMLElement | null;

    syncEquipmentEditor(panel ?? editor);
  });

  reset.addEventListener("click", () => {
    resetActiveEquipmentTuning();
  });

  save.addEventListener("click", async () => {
    const context = getActiveItemEquipmentValueContext();

    if (!context.canSave || !activeEquipmentItemId) {
      valueStatus.textContent = "Select a generated item to save.";
      return;
    }

    save.disabled = true;
    valueStatus.textContent = "Saving item...";

    try {
      valueStatus.textContent = await saveGeneratedEquipmentItem({
        itemIds: context.itemIds,
        ...(context.canEditRarity ? { rarity: getDebugItemRarity(valueRarity.value, context.rarity ?? "common") } : {}),
        ...(context.canEditStat ? { stat: clampNumber(Number(valueStatNumber.value), AUTO_EQUIPMENT_STAT_MIN, getItemEquipmentValueStatMax(context)) } : {}),
        ...(context.canEditPrice ? { price: clampNumber(Number(valuePriceNumber.value), 0, AUTO_EQUIPMENT_PRICE_MAX) } : {}),
        equipmentTuningByItemId: {
          [activeEquipmentItemId]: getCurrentEquipmentItemTuning(activeEquipmentItemId, activeEquipmentSlot),
        },
      });
    } catch (error) {
      valueStatus.textContent = error instanceof Error ? error.message : "Could not save generated item.";
    } finally {
      save.disabled = !getActiveItemEquipmentValueContext().canSave;
    }
  });
}

function mountAutoEquipmentEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__select");
  const nameInput = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__name");
  const raritySelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__rarity");
  const statLabel = editor.querySelector<HTMLElement>(".debug-auto-equipment__stat-label");
  const armorRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor]");
  const armorNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor-number]");
  const priceRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price]");
  const priceNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price-number]");
  const addToShop = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__shop");
  const enemyPool = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__enemy-pool");
  const bossUnique = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__boss-unique");
  const shopLabel = editor.querySelector<HTMLElement>(".debug-auto-equipment__shop-label");
  const transformControls = editor.querySelector<HTMLElement>(".debug-auto-equipment__transform-controls");
  const resetTransform = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__reset-transform");
  const preview = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__preview");
  const promote = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__promote");
  const generatedSelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__generated-select");
  const removeGenerated = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__remove");
  const setNameInput = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__set-name");
  const setVariantInput = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__set-variant");
  const setRaritySelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__set-rarity");
  const setShop = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__set-shop");
  const setEnemyPool = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__set-enemy-pool");
  const setBossUnique = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__set-boss-unique");
  const setAssets = editor.querySelector<HTMLElement>(".debug-auto-equipment__set-assets");
  const setRename = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__set-rename");
  const setPromote = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__set-promote");
  const weaponAssets = editor.querySelector<HTMLElement>(".debug-auto-equipment__weapon-assets");
  const weaponPromote = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__weapon-promote");
  const shieldAssets = editor.querySelector<HTMLElement>(".debug-auto-equipment__shield-assets");
  const shieldPromote = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__shield-promote");
  const status = editor.querySelector<HTMLElement>(".debug-auto-equipment__status");

  if (
    !select ||
    !nameInput ||
    !raritySelect ||
    !statLabel ||
    !armorRange ||
    !armorNumber ||
    !priceRange ||
    !priceNumber ||
    !addToShop ||
    !enemyPool ||
    !bossUnique ||
    !shopLabel ||
    !transformControls ||
    !resetTransform ||
    !preview ||
    !promote ||
    !generatedSelect ||
    !removeGenerated ||
    !setNameInput ||
    !setVariantInput ||
    !setRaritySelect ||
    !setShop ||
    !setEnemyPool ||
    !setBossUnique ||
    !setAssets ||
    !setRename ||
    !setPromote ||
    !weaponAssets ||
    !weaponPromote ||
    !shieldAssets ||
    !shieldPromote ||
    !status
  ) {
    return;
  }

  select.append(createHeroEquipmentOption("", "fallback"));

  AUTO_EQUIPMENT_ITEM_RECORDS.forEach((record) => {
    const option = document.createElement("option");

    option.value = record.item.id;
    option.textContent = record.item.name;
    select.append(option);
  });

  const generatedItems = getRemovableGeneratedEquipmentItems();

  generatedItems.forEach((item) => {
    generatedSelect.append(createRemovableGeneratedEquipmentOption(item));
  });

  equipmentNumericControls.forEach((control) => transformControls.append(createEquipmentRangeControl(control)));
  equipmentToggleControls.forEach((control) => transformControls.append(createEquipmentToggleControl(control)));
  renderEquipmentSetImportAssets(setAssets);
  renderWeaponImportAssets(weaponAssets);
  renderShieldImportAssets(shieldAssets);
  syncAutoEquipmentStatInputs(editor);

  syncAutoEquipmentEditor(editor);

  const autoEquipmentPanel = editor.closest<HTMLDetailsElement>(".debug-auto-equipment-panel");

  autoEquipmentPanel?.addEventListener("toggle", () => {
    if (autoEquipmentPanel.open && !getSelectedAutoEquipmentRecord(select.value)) {
      previewAutoEquipmentFallback();
    }
  });

  select.addEventListener("change", () => {
    syncAutoEquipmentStatInputs(editor);
    previewSelectedAutoEquipment(editor);
    syncAutoEquipmentEditor(editor);
  });

  generatedSelect.addEventListener("change", () => {
    syncAutoEquipmentEditor(editor);
  });

  raritySelect.addEventListener("change", () => {
    setDebugRarityDataset(raritySelect, getDebugItemRarity(raritySelect.value, "common"));
  });

  bossUnique.addEventListener("change", () => {
    syncAutoEquipmentAvailabilityControls(editor);
  });

  addToShop.addEventListener("change", () => {
    syncAutoEquipmentAvailabilityControls(editor);
  });

  setRaritySelect.addEventListener("change", () => {
    setDebugRarityDataset(setRaritySelect, getDebugItemRarity(setRaritySelect.value, "common"));
  });

  setBossUnique.addEventListener("change", () => {
    syncEquipmentSetImportAvailabilityControls(editor);
  });

  setShop.addEventListener("change", () => {
    syncEquipmentSetImportAvailabilityControls(editor);
  });

  syncLinkedNumberInputs(armorRange, armorNumber, AUTO_EQUIPMENT_STAT_MIN, AUTO_EQUIPMENT_ARMOR_MAX);
  syncLinkedNumberInputs(priceRange, priceNumber, 0, AUTO_EQUIPMENT_PRICE_MAX);

  preview.addEventListener("click", () => {
    const record = getSelectedAutoEquipmentRecord(select.value);

    if (!record) {
      previewAutoEquipmentFallback();
      status.textContent = "Using fallback preview.";
      return;
    }

    previewAutoEquipmentRecord(record);
    status.textContent = `Previewing ${record.item.name}.`;
  });

  resetTransform.addEventListener("click", () => {
    const record = getSelectedAutoEquipmentRecord(select.value);

    if (!record || !isEquipmentSlotKey(record.item.equipmentSlot)) {
      return;
    }

    activeEquipmentSlot = record.item.equipmentSlot;
    activeEquipmentItemId = record.item.id;
    resetEquipmentItemTuning(record.item.id, record.item.equipmentSlot);
    const panel = editor.closest(".debug-panel") as HTMLElement | null;

    syncEquipmentEditor(panel ?? editor);
  });

  promote.addEventListener("click", async () => {
    const record = getSelectedAutoEquipmentRecord(select.value);

    if (!record) {
      status.textContent = "No auto equipment asset selected.";
      return;
    }

    promote.disabled = true;
    status.textContent = "Promoting item...";

    try {
      const statValue = clampNumber(Number(armorNumber.value), AUTO_EQUIPMENT_STAT_MIN, getAutoEquipmentStatMax(record));

      status.textContent = await savePromotedEquipmentItem({
        name: nameInput.value.trim() || record.item.name.replace(/\s+\(Auto\)$/u, ""),
        armorHp: statValue,
        damageBonus: statValue,
        price: clampNumber(Number(priceNumber.value), 0, AUTO_EQUIPMENT_PRICE_MAX),
        addToShop: addToShop.checked,
        availability: {
          shop: addToShop.checked && !bossUnique.checked,
          enemyPool: enemyPool.checked && !bossUnique.checked,
          bossUnique: bossUnique.checked,
        },
        item: {
          ...record.item,
          rarity: bossUnique.checked ? "unique" : getSelectedAutoEquipmentRarity(raritySelect.value, record),
        },
        assetKeys: record.assetKeys,
        asset: record.asset,
        equipmentTuning: getCurrentEquipmentItemTuning(record.item.id, record.item.equipmentSlot),
      });
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not promote equipment.";
    } finally {
      promote.disabled = false;
    }
  });

  removeGenerated.addEventListener("click", async () => {
    const item = getSelectedRemovableGeneratedEquipmentItem(generatedItems, generatedSelect.value);

    if (!item) {
      status.textContent = "No generated item selected.";
      return;
    }

    if (!window.confirm(`Remove ${item.name}? This deletes the generated item and its asset files.`)) {
      return;
    }

    removeGenerated.disabled = true;
    status.textContent = item.itemIds.length > 1 ? "Removing generated item pair..." : "Removing generated item...";

    try {
      status.textContent = await removePromotedEquipmentItem(item.itemIds[0]!);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not remove generated equipment.";
    } finally {
      removeGenerated.disabled = false;
    }
  });

  setRename.addEventListener("click", async () => {
    const entries = getSelectedEquipmentSetImportEntries(setAssets);

    if (!setNameInput.value.trim()) {
      status.textContent = "Set name is required.";
      return;
    }

    if (entries.length === 0) {
      status.textContent = "Select at least one raw set asset.";
      return;
    }

    setRename.disabled = true;
    status.textContent = "Renaming set assets...";

    try {
      status.textContent = await renameEquipmentSetAssets({
        setName: setNameInput.value.trim(),
        variant: setVariantInput.value.trim() || "01",
        entries,
      });
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not rename set assets.";
    } finally {
      setRename.disabled = false;
    }
  });

  setPromote.addEventListener("click", async () => {
    const entries = getSelectedEquipmentSetImportEntries(setAssets);

    if (!setNameInput.value.trim()) {
      status.textContent = "Set name is required.";
      return;
    }

    if (entries.length === 0) {
      status.textContent = "Select at least one raw set asset.";
      return;
    }

    setRename.disabled = true;
    setPromote.disabled = true;
    status.textContent = "Promoting full set...";

    try {
      status.textContent = await savePromotedEquipmentSet({
        setName: setNameInput.value.trim(),
        variant: setVariantInput.value.trim() || "01",
        rarity: setBossUnique.checked ? "unique" : getDebugItemRarity(setRaritySelect.value, "common"),
        availability: {
          shop: setShop.checked && !setBossUnique.checked,
          enemyPool: setEnemyPool.checked && !setBossUnique.checked,
          bossUnique: setBossUnique.checked,
        },
        entries,
      });
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not promote equipment set.";
    } finally {
      setRename.disabled = getEquipmentSetImportAssets().length === 0;
      setPromote.disabled = getEquipmentSetImportAssets().length === 0;
    }
  });

  weaponPromote.addEventListener("click", async () => {
    const entries = getSelectedWeaponImportEntries(weaponAssets);

    if (entries.length === 0) {
      status.textContent = "Select at least one raw weapon asset.";
      return;
    }

    weaponPromote.disabled = true;
    status.textContent = entries.length === 1 ? "Promoting weapon..." : `Promoting ${entries.length} weapons...`;

    try {
      status.textContent = await savePromotedWeaponImports({ entries });
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not promote weapon imports.";
    } finally {
      weaponPromote.disabled = getWeaponImportAssets().length === 0;
    }
  });

  shieldPromote.addEventListener("click", async () => {
    const entries = getSelectedShieldImportEntries(shieldAssets);

    if (entries.length === 0) {
      status.textContent = "Select at least one raw shield asset.";
      return;
    }

    shieldPromote.disabled = true;
    status.textContent = entries.length === 1 ? "Promoting shield..." : `Promoting ${entries.length} shields...`;

    try {
      status.textContent = await savePromotedShieldImports({ entries });
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not promote shield imports.";
    } finally {
      shieldPromote.disabled = getShieldImportAssets().length === 0;
    }
  });
}

function mountArenaTierEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-tier-editor__select");
  const createNew = editor.querySelector<HTMLButtonElement>(".debug-tier-editor__new");
  const save = editor.querySelector<HTMLButtonElement>(".debug-tier-editor__save");
  const unlockSelect = editor.querySelector<HTMLSelectElement>(".debug-tier-editor__unlock");
  const status = editor.querySelector<HTMLElement>(".debug-tier-editor__status");

  if (!select || !createNew || !save || !unlockSelect || !status) {
    return;
  }

  syncArenaTierSelectOptions(select, debugArenaTiers[0]?.id);
  applyArenaTierToEditor(editor, getSelectedArenaTier(Number(select.value)) ?? createDefaultArenaTierDraft());

  select.addEventListener("change", () => {
    applyArenaTierToEditor(editor, getSelectedArenaTier(Number(select.value)) ?? createDefaultArenaTierDraft());
  });

  createNew.addEventListener("click", () => {
    const draft = createDefaultArenaTierDraft();

    applyArenaTierToEditor(editor, draft);
    select.value = "";
    status.textContent = "New arena tier draft.";
  });

  editor.querySelector<HTMLInputElement>(".debug-tier-editor__id")?.addEventListener("input", () => {
    syncArenaTierBossSummary(editor);
  });

  save.addEventListener("click", async () => {
    const tier = readArenaTierEditorDraft(editor);

    save.disabled = true;
    status.textContent = "Saving arena tier...";

    try {
      status.textContent = await saveArenaTier(tier);
      debugArenaTiers = upsertDebugArenaTier(debugArenaTiers, tier);
      syncArenaTierSelectOptions(select, tier.id);
      applyArenaTierToEditor(editor, tier);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not save arena tier.";
    } finally {
      save.disabled = false;
    }
  });
}

function mountBossEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-boss-editor__select");
  const createNew = editor.querySelector<HTMLButtonElement>(".debug-boss-editor__new");
  const preview = editor.querySelector<HTMLButtonElement>(".debug-boss-editor__preview");
  const save = editor.querySelector<HTMLButtonElement>(".debug-boss-editor__save");
  const equipmentControls = editor.querySelector<HTMLElement>(".debug-boss-editor__equipment-controls");
  const status = editor.querySelector<HTMLElement>(".debug-boss-editor__status");
  const tierRange = editor.querySelector<HTMLInputElement>("input[data-boss-tier]");
  const tierNumber = editor.querySelector<HTMLInputElement>("input[data-boss-tier-number]");
  const lootChanceRange = editor.querySelector<HTMLInputElement>("input[data-boss-loot-chance]");
  const lootChanceNumber = editor.querySelector<HTMLInputElement>("input[data-boss-loot-chance-number]");

  if (!select || !createNew || !preview || !save || !equipmentControls || !status || !tierRange || !tierNumber || !lootChanceRange || !lootChanceNumber) {
    return;
  }

  getBossEquipmentControlConfigs().forEach((control) => {
    equipmentControls.append(createBossEquipmentControl(control));
  });

  syncBossSelectOptions(select, debugArenaBosses[0]?.id);
  syncLinkedNumberInputs(tierRange, tierNumber, 1, DEBUG_BOSS_TIER_MAX);
  syncLinkedNumberInputs(lootChanceRange, lootChanceNumber, 0, 1);
  editor.querySelectorAll<HTMLInputElement>("input[data-boss-field]").forEach((range) => {
    const field = range.dataset.bossField;
    const number = field ? editor.querySelector<HTMLInputElement>(`input[data-boss-number-field="${field}"]`) : null;
    const max = field?.includes("gold") || field?.includes("xp") ? DEBUG_BOSS_REWARD_MAX : DEBUG_BOSS_STAT_MAX;

    if (number) {
      syncLinkedNumberInputs(range, number, 0, max);
    }
  });

  applyBossToEditor(editor, getSelectedArenaBoss(select.value) ?? createDefaultArenaBossDraft());

  select.addEventListener("change", () => {
    applyBossToEditor(editor, getSelectedArenaBoss(select.value) ?? createDefaultArenaBossDraft());
    previewBossFromEditor(editor);
  });

  createNew.addEventListener("click", () => {
    applyBossToEditor(editor, createDefaultArenaBossDraft());
    select.value = "";
    status.textContent = "New boss draft.";
    previewBossFromEditor(editor);
  });

  editor.querySelectorAll<HTMLSelectElement>("select[data-boss-equipment-slots]").forEach((equipmentSelect) => {
    equipmentSelect.addEventListener("change", () => {
      syncBossLootSummary(editor);
      previewBossFromEditor(editor);
    });
  });

  preview.addEventListener("click", () => {
    previewBossFromEditor(editor);
    status.textContent = `Previewing ${readBossEditorDraft(editor).name}.`;
  });

  save.addEventListener("click", async () => {
    const boss = readBossEditorDraft(editor);

    save.disabled = true;
    status.textContent = "Saving boss...";

    try {
      status.textContent = await saveArenaBoss(boss);
      debugArenaBosses = upsertDebugArenaBoss(debugArenaBosses, boss);
      syncBossSelectOptions(select, boss.id);
      applyBossToEditor(editor, boss);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not save boss.";
    } finally {
      save.disabled = false;
    }
  });
}

function mountRigEditor(editor: HTMLElement): void {
  const bodyPresetSelect = editor.querySelector<HTMLSelectElement>(".debug-rig-editor__body-preset");
  const copyClassicToDummy = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-classic-to-dummy");
  const select = editor.querySelector<HTMLSelectElement>(".debug-rig-editor__select");
  const controls = editor.querySelector<HTMLElement>(".debug-rig-editor__controls");
  const limbGrid = editor.querySelector<HTMLElement>(".debug-rig-editor__limb-grid");
  const faceControls = editor.querySelector<HTMLElement>(".debug-rig-editor__face-controls");
  const copyOpposite = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-opposite");
  const reset = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__reset");
  const resetAllParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__reset-all-parts");
  const resetAnimationToIdle = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__reset-animation-to-idle");
  const resetFace = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__face-reset");
  const animationSelect = editor.querySelector<HTMLSelectElement>(".debug-rig-editor__animation-select");
  const characterCanvasModeButtons = [...editor.querySelectorAll<HTMLButtonElement>("button[data-character-canvas-edit-mode]")];
  const animationModeButtons = [...editor.querySelectorAll<HTMLButtonElement>("button[data-animation-edit-mode]")];
  const copyPoseAToB = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-pose-a-to-b");
  const animationEnabled = editor.querySelector<HTMLInputElement>("input[data-animation-enabled]");
  const animationDuration = editor.querySelector<HTMLInputElement>("input[data-animation-duration]");
  const animationDurationNumber = editor.querySelector<HTMLInputElement>("input[data-animation-duration-number]");
  const animationParts = editor.querySelector<HTMLElement>("[data-animation-parts]");
  const idleAllParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-all");
  const idleNoParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-none");

  if (
    !bodyPresetSelect ||
    !copyClassicToDummy ||
    !select ||
    !controls ||
    !limbGrid ||
    !faceControls ||
    !copyOpposite ||
    !reset ||
    !resetAllParts ||
    !resetAnimationToIdle ||
    !resetFace ||
    !animationSelect ||
    characterCanvasModeButtons.length === 0 ||
    animationModeButtons.length === 0 ||
    !copyPoseAToB ||
    !animationEnabled ||
    !animationDuration ||
    !animationDurationNumber ||
    !animationParts ||
    !idleAllParts ||
    !idleNoParts
  ) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    select.append(option);
  });

  BODY_ANIMATION_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    animationSelect.append(option);
  });

  rigNumericControls.forEach((control) => controls.append(createRigRangeControl(control)));
  rigToggleControls.forEach((control) => controls.append(createRigToggleControl(control)));
  rigLimbRotateConfigs.forEach((config) => limbGrid.append(createLimbRotateControl(config)));
  FACE_PART_KEYS.forEach((key) => faceControls.append(createFacePartEditor(key)));
  RIG_PART_KEYS.forEach((key) => animationParts.append(createAnimationPartToggle(key)));

  bodyPresetSelect.addEventListener("change", () => {
    updateDebugTuning({ paperDollBodyPreset: bodyPresetSelect.value as ArenaDebugTuning["paperDollBodyPreset"] }, { undoable: false });
  });

  copyClassicToDummy.addEventListener("click", () => {
    copyClassicRigToDummyV2();
  });

  select.addEventListener("change", () => {
    const selectedRigPart = select.value as RigPartKey;

    updateDebugTuning({ selectedRigPart, selectedRigParts: [selectedRigPart] }, { undoable: false });
  });

  characterCanvasModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.characterCanvasEditMode;

      if (isCharacterCanvasEditMode(mode)) {
        updateDebugTuning({ characterCanvasEditMode: mode }, { undoable: false });
      }
    });
  });

  reset.addEventListener("click", () => {
    resetSelectedCharacterPart();
  });

  resetAllParts.addEventListener("click", () => {
    resetAllCharacterParts();
  });

  resetAnimationToIdle.addEventListener("click", () => {
    resetSelectedAnimationToIdle();
  });

  resetFace.addEventListener("click", () => {
    resetFaceParts();
  });

  copyOpposite.addEventListener("click", () => {
    const selectedPart = debugTuning.selectedRigPart;
    const oppositePart = oppositeRigPartMap[selectedPart];

    if (!oppositePart) {
      return;
    }

    if (isBodyArtCanvasMode()) {
      const bodyPartLayers = getEditableBodyPartLayers();

      updateBodyPartLayerTuning(selectedPart, { ...bodyPartLayers[oppositePart] });
      return;
    }

    const rigParts = getEditableRigParts();

    if (rigParts) {
      updateRigPartTuning(selectedPart, { ...rigParts[oppositePart] });
    }
  });

  animationSelect.addEventListener("change", () => {
    updateDebugTuning({
      selectedBodyAnimation: isBodyAnimationKey(animationSelect.value) ? animationSelect.value : "idle",
      selectedBodyAnimationVariantId: BODY_ANIMATION_DEFAULT_VARIANT_ID,
    }, { undoable: false });
  });

  animationModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.animationEditMode;

      if (isAnimationEditMode(mode)) {
        updateDebugTuning({ animationEditMode: mode, selectedAnimationKeyframeId: getAnimationModeKeyframeId(mode) }, { undoable: false });
      }
    });
  });

  copyPoseAToB.addEventListener("click", () => {
    copyAnimationPoseAToB();
  });

  animationEnabled.addEventListener("change", () => {
    updateSelectedBodyAnimation({ enabled: animationEnabled.checked });
  });

  animationDuration.addEventListener("input", () => {
    updateSelectedBodyAnimation({ duration: Number(animationDuration.value) });
  });

  animationDurationNumber.addEventListener("input", () => {
    updateSelectedBodyAnimation({ duration: Number(animationDurationNumber.value) });
  });

  idleAllParts.addEventListener("click", () => {
    updateSelectedBodyAnimation({ activeParts: createAnimationActiveParts(true) });
  });

  idleNoParts.addEventListener("click", () => {
    updateSelectedBodyAnimation({ activeParts: createAnimationActiveParts(false) });
  });

}

function mountAnimationWorkbench(): void {
  const editor = document.querySelector<HTMLElement>("#debugAnimationEditor");

  if (!editor || editor.dataset.animationWorkbenchMounted === "true") {
    return;
  }

  const animationSelect = editor.querySelector<HTMLSelectElement>("[data-animation-workbench-select]");
  const variantSelect = editor.querySelector<HTMLSelectElement>("[data-animation-workbench-variant-select]");
  const newVariant = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-variant-new]");
  const duplicateVariant = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-variant-duplicate]");
  const deleteVariant = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-variant-delete]");
  const variantWeight = editor.querySelector<HTMLInputElement>("[data-animation-workbench-variant-weight]");
  const variantAllWeapons = editor.querySelector<HTMLInputElement>("[data-animation-workbench-variant-all-weapons]");
  const variantWeapons = editor.querySelector<HTMLElement>("[data-animation-workbench-variant-weapons]");
  const animationModeButtons = [...editor.querySelectorAll<HTMLButtonElement>("button[data-animation-edit-mode]")];
  const viewControls = editor.querySelector<HTMLElement>("[data-animation-workbench-view-controls]");
  const resetPose = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-reset-pose]");
  const applyPoseButtons = [...editor.querySelectorAll<HTMLButtonElement>("[data-animation-workbench-apply-to-pose]")];
  const resetView = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-reset-view]");
  const partSelect = editor.querySelector<HTMLSelectElement>("[data-animation-workbench-part-select]");
  const rootTransformMode = editor.querySelector<HTMLElement>("[data-animation-workbench-root-transform-mode]");
  const rootTransformModeButtons = [
    ...editor.querySelectorAll<HTMLButtonElement>("[data-animation-workbench-root-transform-mode-option]"),
  ];
  const rigControls = editor.querySelector<HTMLElement>("[data-animation-workbench-rig-controls]");
  const resetPart = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-reset-part]");
  const limbGrid = editor.querySelector<HTMLElement>("[data-animation-workbench-limbs]");
  const animationEnabled = editor.querySelector<HTMLInputElement>("[data-animation-workbench-enabled]");
  const animationDuration = editor.querySelector<HTMLInputElement>("[data-animation-workbench-duration]");
  const copyPoseAToB = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-copy-a-to-b]");
  const saveAnimationProd = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-save-prod]");
  const saveAnimationStatus = editor.querySelector<HTMLElement>("[data-animation-workbench-save-status]");
  const weaponMirrorX = editor.querySelector<HTMLInputElement>("[data-animation-workbench-weapon-mirror-x]");
  const weaponMirrorY = editor.querySelector<HTMLInputElement>("[data-animation-workbench-weapon-mirror-y]");
  const castPropPanel = editor.querySelector<HTMLElement>("[data-animation-workbench-cast-prop-panel]");
  const castPropVisible = editor.querySelector<HTMLInputElement>("[data-animation-workbench-cast-prop-visible]");
  const castPropAsset = editor.querySelector<HTMLSelectElement>("[data-animation-workbench-cast-prop-asset]");
  const castPropControls = editor.querySelector<HTMLElement>("[data-animation-workbench-cast-prop-controls]");
  const animationParts = editor.querySelector<HTMLElement>("[data-animation-workbench-parts]");
  const play = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-play]");
  const playbackSpeed = editor.querySelector<HTMLSelectElement>("[data-animation-workbench-speed]");
  const randomWeapon = editor.querySelector<HTMLInputElement>("[data-animation-workbench-random-weapon]");
  const weaponDrag = editor.querySelector<HTMLInputElement>("[data-animation-workbench-weapon-drag]");
  const resetWeapon = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-reset-weapon]");
  const progress = editor.querySelector<HTMLInputElement>("[data-animation-workbench-progress]");
  const keyframes = editor.querySelector<HTMLElement>("[data-animation-workbench-keyframes]");
  const easing = editor.querySelector<HTMLSelectElement>("[data-animation-workbench-easing]");
  const addKeyframe = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-add-keyframe]");
  const duplicateKeyframe = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-duplicate-keyframe]");
  const setStartKeyframe = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-set-start]");
  const setImpactKeyframe = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-set-impact]");
  const deleteKeyframe = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-delete-keyframe]");
  const fullResetAnimation = editor.querySelector<HTMLButtonElement>("[data-animation-workbench-full-reset]");

  if (
    !animationSelect ||
    !variantSelect ||
    !newVariant ||
    !duplicateVariant ||
    !deleteVariant ||
    !variantWeight ||
    !variantAllWeapons ||
    !variantWeapons ||
    animationModeButtons.length === 0 ||
    !viewControls ||
    !resetPose ||
    applyPoseButtons.length === 0 ||
    !resetView ||
    !partSelect ||
    !rootTransformMode ||
    rootTransformModeButtons.length === 0 ||
    !rigControls ||
    !resetPart ||
    !limbGrid ||
    !animationEnabled ||
    !animationDuration ||
    !copyPoseAToB ||
    !saveAnimationProd ||
    !saveAnimationStatus ||
    !weaponMirrorX ||
    !weaponMirrorY ||
    !castPropPanel ||
    !castPropVisible ||
    !castPropAsset ||
    !castPropControls ||
    !animationParts ||
    !play ||
    !playbackSpeed ||
    !randomWeapon ||
    !weaponDrag ||
    !resetWeapon ||
    !progress ||
    !keyframes ||
    !easing ||
    !addKeyframe ||
    !duplicateKeyframe ||
    !setStartKeyframe ||
    !setImpactKeyframe ||
    !deleteKeyframe ||
    !fullResetAnimation
  ) {
    return;
  }

  editor.dataset.animationWorkbenchMounted = "true";

  animationEditorViewControls.forEach((control) => viewControls.append(createRangeControl(control)));
  BODY_ANIMATION_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    animationSelect.append(option);
  });
  BODY_ANIMATION_WEAPON_CLASSES.forEach((weaponClass) => variantWeapons.append(createAnimationVariantWeaponToggle(weaponClass)));
  BODY_ANIMATION_KEYFRAME_EASINGS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    easing.append(option);
  });

  const rootOption = document.createElement("option");
  rootOption.value = ANIMATION_WORKBENCH_ROOT_SELECT_VALUE;
  rootOption.textContent = "Doll / Root";
  partSelect.append(rootOption);

  RIG_PART_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    partSelect.append(option);
  });

  rigNumericControls.forEach((control) => rigControls.append(createRigRangeControl(control)));
  rigToggleControls.forEach((control) => rigControls.append(createRigToggleControl(control)));
  SCROLL_CAST_PROP_ASSET_KEYS.forEach((key) => {
    const option = document.createElement("option");

    option.value = key;
    option.textContent = formatScrollCastPropAssetLabel(key);
    castPropAsset.append(option);
  });
  animationCastPropNumericControls.forEach((control) => castPropControls.append(createAnimationCastPropRangeControl(control)));
  animationCastPropToggleControls.forEach((control) => castPropControls.append(createAnimationCastPropToggleControl(control)));
  rigLimbRotateConfigs.forEach((config) => limbGrid.append(createLimbRotateControl(config)));
  RIG_PART_KEYS.forEach((key) => animationParts.append(createAnimationPartToggle(key)));

  animationSelect.addEventListener("change", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    updateDebugTuning({
      characterCanvasEditMode: "parts",
      selectedBodyAnimation: isBodyAnimationKey(animationSelect.value) ? animationSelect.value : "idle",
      selectedBodyAnimationVariantId: BODY_ANIMATION_DEFAULT_VARIANT_ID,
    }, { undoable: false });
  });

  variantSelect.addEventListener("change", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    selectBodyAnimationVariant(variantSelect.value);
  });

  newVariant.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    createBodyAnimationVariant();
  });

  duplicateVariant.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    duplicateSelectedBodyAnimationVariant();
  });

  deleteVariant.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    deleteSelectedBodyAnimationVariant();
  });

  variantWeight.addEventListener("input", () => {
    updateSelectedBodyAnimationVariantMeta({ variantWeight: Number(variantWeight.value) });
  });

  variantAllWeapons.addEventListener("change", () => {
    updateSelectedBodyAnimationVariantMeta({ appliesToAllWeapons: variantAllWeapons.checked });
  });

  animationModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.animationEditMode;

      stopAnimationWorkbenchPlayback({ restoreEditMode: false });
      if (isAnimationEditMode(mode)) {
        updateDebugTuning(
          {
            animationEditMode: mode,
            characterCanvasEditMode: "parts",
            selectedAnimationKeyframeId: getAnimationModeKeyframeId(mode),
          },
          { undoable: false },
        );
      }
    });
  });

  resetPose.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    resetSelectedAnimationPoseToDefault();
  });

  applyPoseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetPoseId = button.dataset.animationWorkbenchApplyToPose;

      stopAnimationWorkbenchPlayback({ restoreEditMode: false });
      if (targetPoseId === "pose-a" || targetPoseId === "pose-b") {
        applySelectedAnimationKeyframeToPose(targetPoseId);
      }
    });
  });

  resetView.addEventListener("click", () => {
    updateDebugTuning({
      animationEditorZoom: defaultDebugTuning.animationEditorZoom,
      animationEditorOffsetX: defaultDebugTuning.animationEditorOffsetX,
      animationEditorOffsetY: defaultDebugTuning.animationEditorOffsetY,
    });
  });

  editor.querySelectorAll<HTMLButtonElement>("[data-animation-workbench-rotate-doll]").forEach((button) => {
    button.addEventListener("click", () => {
      rotatePaperDoll(Number(button.dataset.animationWorkbenchRotateDoll) || 0);
    });
  });

  partSelect.addEventListener("change", () => {
    if (partSelect.value === ANIMATION_WORKBENCH_ROOT_SELECT_VALUE) {
      updateDebugTuning({
        characterCanvasEditMode: "root",
        selectedRigParts: [],
      }, { undoable: false });
      return;
    }

    const selectedRigPart = partSelect.value as RigPartKey;

    updateDebugTuning({
      characterCanvasEditMode: "parts",
      selectedRigPart,
      selectedRigParts: [selectedRigPart],
    }, { undoable: false });
  });

  rootTransformModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.animationWorkbenchRootTransformModeOption;

      if (isAnimationRootTransformMode(mode)) {
        updateDebugTuning({ animationRootTransformMode: mode }, { undoable: false });
      }
    });
  });

  resetPart.addEventListener("click", () => {
    resetSelectedRigPart();
  });

  animationEnabled.addEventListener("change", () => {
    updateSelectedBodyAnimation({ enabled: animationEnabled.checked });
  });

  animationDuration.addEventListener("input", () => {
    updateSelectedBodyAnimation({ duration: Number(animationDuration.value) });
  });

  copyPoseAToB.addEventListener("click", () => {
    copyAnimationPoseAToB();
  });

  saveAnimationProd.addEventListener("click", async () => {
    saveAnimationProd.disabled = true;
    saveAnimationStatus.textContent = `Saving prod ${debugTuning.selectedBodyAnimation}...`;

    try {
      saveAnimationStatus.textContent = await saveProdAnimation(debugTuning);
    } catch (error) {
      saveAnimationStatus.textContent = error instanceof Error ? error.message : "Could not save prod animation.";
    } finally {
      saveAnimationProd.disabled = false;
    }
  });

  weaponMirrorX.addEventListener("change", () => {
    updateSelectedAnimationKeyframe({ weaponMirrorX: weaponMirrorX.checked });
  });

  weaponMirrorY.addEventListener("change", () => {
    updateSelectedAnimationKeyframe({ weaponMirrorY: weaponMirrorY.checked });
  });

  castPropVisible.addEventListener("change", () => {
    updateSelectedAnimationCastProp({ visible: castPropVisible.checked });
  });

  castPropAsset.addEventListener("change", () => {
    updateSelectedAnimationCastProp({ assetKey: isScrollCastPropAssetKey(castPropAsset.value) ? castPropAsset.value : DEFAULT_SCROLL_CAST_PROP_ASSET_KEY });
  });

  progress.addEventListener("input", () => {
    beginAnimationWorkbenchScrub();
    setAnimationWorkbenchProgress(Number(progress.value) / 1000);
  });
  progress.addEventListener("pointerdown", () => {
    beginAnimationWorkbenchScrub();
  });

  let suppressKeyframeClick = false;
  keyframes.addEventListener("pointerdown", (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button[data-animation-keyframe-id]");
    const keyframeId = button?.dataset.animationKeyframeId;

    if (!keyframeId || !isMovableAnimationKeyframe(keyframeId)) {
      return;
    }

    const startClientX = event.clientX;
    let isDragging = false;

    event.preventDefault();
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    selectAnimationKeyframe(keyframeId);

    const moveSelectedKeyframe = (clientX: number): void => {
      moveAnimationKeyframeToRailPointer(keyframeId, keyframes, clientX);
    };
    const handlePointerMove = (moveEvent: PointerEvent): void => {
      if (!isDragging && Math.abs(moveEvent.clientX - startClientX) < 2) {
        return;
      }

      isDragging = true;
      suppressKeyframeClick = true;
      moveEvent.preventDefault();
      moveSelectedKeyframe(moveEvent.clientX);
    };
    const stopDragging = (): void => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);

      if (isDragging) {
        window.setTimeout(() => {
          suppressKeyframeClick = false;
        }, 0);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
  });

  keyframes.addEventListener("click", (event) => {
    if (suppressKeyframeClick) {
      event.preventDefault();
      suppressKeyframeClick = false;
      return;
    }

    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button[data-animation-keyframe-id]");
    const keyframeId = button?.dataset.animationKeyframeId ?? getAnimationKeyframeIdAtRailPointer(keyframes, event);

    if (!keyframeId) {
      return;
    }

    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    selectAnimationKeyframe(keyframeId);
  });

  easing.addEventListener("change", () => {
    updateAnimationWorkbenchEasing(easing.value as BodyAnimationKeyframeEasing);
  });

  addKeyframe.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    addAnimationKeyframeAtProgress();
  });

  duplicateKeyframe.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    duplicateSelectedAnimationKeyframeAtProgress();
  });

  setStartKeyframe.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    setSelectedAnimationStartKeyframe();
  });

  setImpactKeyframe.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    setSelectedAnimationImpactKeyframe();
  });

  deleteKeyframe.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    deleteSelectedAnimationKeyframe();
  });

  fullResetAnimation.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    resetSelectedBodyAnimationFull();
  });

  play.addEventListener("click", () => {
    toggleAnimationWorkbenchPlayback();
  });

  playbackSpeed.addEventListener("change", () => {
    updateDebugTuning({ animationPreviewPlaybackSpeed: getAnimationWorkbenchPlaybackSpeed(playbackSpeed.value) }, { undoable: false });
  });

  randomWeapon.addEventListener("change", () => {
    updateDebugTuning(
      {
        animationPreviewRandomWeapon: randomWeapon.checked,
        animationPreviewWeaponItemId: randomWeapon.checked ? debugTuning.animationPreviewWeaponItemId : null,
      },
      { undoable: false },
    );
  });

  weaponDrag.addEventListener("change", () => {
    updateDebugTuning({ animationWeaponDragEnabled: weaponDrag.checked }, { undoable: false });
  });

  resetWeapon.addEventListener("click", () => {
    stopAnimationWorkbenchPlayback({ restoreEditMode: false });
    resetAnimationWorkbenchPreviewWeaponTuning();
  });

  editor.querySelectorAll<HTMLButtonElement>("[data-animation-workbench-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      stopAnimationWorkbenchPlayback({ restoreEditMode: false });
      setAnimationWorkbenchProgress(Number(button.dataset.animationWorkbenchJump));
    });
  });
}

function toggleAnimationWorkbenchPlayback(): void {
  if (animationWorkbenchPlaybackFrame !== undefined) {
    stopAnimationWorkbenchPlayback();
    return;
  }

  startAnimationWorkbenchPlayback();
}

function startAnimationWorkbenchPlayback(): void {
  if (animationWorkbenchPlaybackFrame !== undefined) {
    return;
  }

  refreshAnimationWorkbenchPreviewWeapon();
  animationWorkbenchPlaybackReturnMode = getAnimationWorkbenchReturnMode();
  animationWorkbenchPlaybackPreviousTime = window.performance.now();
  animationWorkbenchPlaybackFrame = window.requestAnimationFrame(tickAnimationWorkbenchPlayback);
}

function tickAnimationWorkbenchPlayback(time: number): void {
  const elapsed = Math.max(0, time - animationWorkbenchPlaybackPreviousTime);
  const animation = getSelectedBodyAnimation();
  const duration = Math.max(1, animation.duration);
  const speed = clampAnimationWorkbenchPlaybackSpeed(debugTuning.animationPreviewPlaybackSpeed);
  const nextProgress = (debugTuning.animationPreviewProgress + (elapsed * speed) / duration) % 1;

  animationWorkbenchPlaybackPreviousTime = time;
  updateDebugTuning(
    {
      animationEditMode: "preview",
      animationPreviewProgress: nextProgress,
      characterCanvasEditMode: getAnimationWorkbenchCanvasEditMode(),
    },
    { undoable: false, persist: false },
  );

  animationWorkbenchPlaybackFrame = window.requestAnimationFrame(tickAnimationWorkbenchPlayback);
}

function refreshAnimationWorkbenchPreviewWeapon(): void {
  if (!debugTuning.animationPreviewRandomWeapon) {
    return;
  }

  updateDebugTuning(
    { animationPreviewWeaponItemId: pickRandomAnimationWorkbenchPreviewWeaponItemId() },
    { undoable: false, persist: false },
  );
}

function pickRandomAnimationWorkbenchPreviewWeaponItemId(): HeroItemId | null {
  const animation = getSelectedBodyAnimation();
  const weaponClasses = getAnimationWorkbenchPreviewWeaponClasses(animation);
  const candidates = Object.values(HERO_ITEM_CATALOG).filter((item) => {
    if (item.kind !== "weapon" || (item.equipmentSlot !== "weaponMain" && item.equipmentSlot !== "weaponBow")) {
      return false;
    }

    const weaponClass = getHeroItemWeaponClass(item);

    return BODY_ANIMATION_WEAPON_CLASSES.includes(weaponClass as BodyAnimationWeaponClass) && weaponClasses.includes(weaponClass as BodyAnimationWeaponClass);
  });
  const candidate = candidates[Math.floor(Math.random() * candidates.length)];

  return candidate?.id ?? null;
}

function resetAnimationWorkbenchPreviewWeaponTuning(): void {
  const targets = getAnimationWorkbenchPreviewWeaponTuningTargets();

  if (targets.length === 0) {
    return;
  }

  const equipment = { ...debugTuning.equipment };
  const equipmentItems = { ...debugTuning.equipmentItems };

  targets.forEach(({ slotKey, itemId }) => {
    if (itemId) {
      equipmentItems[itemId] = {
        ...(GENERATED_EQUIPMENT_ITEM_TUNING[itemId] ?? DEFAULT_EQUIPMENT_ITEM_TUNING[itemId] ?? DEFAULT_EQUIPMENT[slotKey]),
      };
      return;
    }

    equipment[slotKey] = { ...DEFAULT_EQUIPMENT[slotKey] };
  });

  updateDebugTuning({ equipment, equipmentItems });
}

function getAnimationWorkbenchPreviewWeaponTuningTargets(): { slotKey: EquipmentSlotKey; itemId: HeroItemId | "" }[] {
  const equipment = getAnimationWorkbenchPreviewEquipment();

  return getAnimationWorkbenchVisibleWeaponSlots(equipment).flatMap((slotKey) => {
    const itemId = equipment[slotKey];
    const definition = getDebugHeroItemDefinition(itemId);

    if (itemId && definition?.equipmentSlot === slotKey) {
      return [{ slotKey, itemId }];
    }

    return [];
  });
}

function getAnimationWorkbenchVisibleWeaponSlots(equipment: HeroEquipment): typeof ANIMATION_WORKBENCH_WEAPON_SLOT_KEYS[number][] {
  const bowActive = debugTuning.selectedBodyAnimation === "bowShot" || !equipment.weaponMain;

  return ANIMATION_WORKBENCH_WEAPON_SLOT_KEYS.filter((slotKey) => {
    if (slotKey === "weaponMain") {
      return Boolean(equipment.weaponMain) && (!bowActive || !equipment.weaponBow);
    }

    return bowActive && Boolean(equipment.weaponBow);
  });
}

function getAnimationWorkbenchPreviewEquipment(): HeroEquipment {
  const baseEquipment = debugHeroEquipment ? { ...debugHeroEquipment } : createDefaultHeroEquipment();
  const itemId = debugTuning.animationPreviewWeaponItemId;

  if (!debugTuning.animationPreviewRandomWeapon || !itemId) {
    return baseEquipment;
  }

  const item = getDebugHeroItemDefinition(itemId);

  if (!item || item.kind !== "weapon" || (item.equipmentSlot !== "weaponMain" && item.equipmentSlot !== "weaponBow")) {
    return baseEquipment;
  }

  return {
    ...baseEquipment,
    [item.equipmentSlot]: itemId,
    ...(item.equipmentSlot === "weaponBow" ? { weaponMain: null } : {}),
  };
}

function getAnimationWorkbenchPreviewWeaponClasses(animation: BodyAnimationTuning): BodyAnimationWeaponClass[] {
  if (!(animation.appliesToAllWeapons ?? true)) {
    const specificClasses = (animation.weaponClasses ?? []).filter((weaponClass) => BODY_ANIMATION_WEAPON_CLASSES.includes(weaponClass));

    if (specificClasses.length > 0) {
      return specificClasses;
    }
  }

  return debugTuning.selectedBodyAnimation === "bowShot" ? ["bow"] : ANIMATION_WORKBENCH_MELEE_WEAPON_CLASSES;
}

function getAnimationWorkbenchPlaybackSpeed(value: string): number {
  return clampAnimationWorkbenchPlaybackSpeed(Number(value));
}

function clampAnimationWorkbenchPlaybackSpeed(value: number): number {
  const finiteValue = Number.isFinite(value) ? value : defaultDebugTuning.animationPreviewPlaybackSpeed;
  const clampedValue = clampNumber(finiteValue, 0.25, 2);

  return ANIMATION_WORKBENCH_PLAYBACK_SPEEDS.reduce((closest, option) =>
    Math.abs(option - clampedValue) < Math.abs(closest - clampedValue) ? option : closest,
  );
}

function stopAnimationWorkbenchPlayback(options: { restoreEditMode?: boolean } = {}): void {
  if (animationWorkbenchPlaybackFrame === undefined) {
    return;
  }

  window.cancelAnimationFrame(animationWorkbenchPlaybackFrame);
  animationWorkbenchPlaybackFrame = undefined;

  if (options.restoreEditMode ?? true) {
    restoreAnimationWorkbenchEditMode();
  } else {
    animationWorkbenchPlaybackReturnMode = undefined;
  }
}

function restoreAnimationWorkbenchEditMode(returnMode: AnimationEditMode = animationWorkbenchPlaybackReturnMode ?? "keyframe"): void {
  animationWorkbenchPlaybackReturnMode = undefined;
  if (debugTuning.animationEditMode === returnMode) {
    return;
  }

  updateDebugTuning(
    {
      animationEditMode: returnMode,
      characterCanvasEditMode: getAnimationWorkbenchCanvasEditMode(),
      selectedAnimationKeyframeId: getAnimationModeKeyframeId(returnMode),
    },
    { undoable: false },
  );
}

function beginAnimationWorkbenchScrub(): void {
  stopAnimationWorkbenchPlayback({ restoreEditMode: false });
}

function getAnimationWorkbenchReturnMode(): AnimationEditMode {
  return debugTuning.animationEditMode === "preview" ? "keyframe" : debugTuning.animationEditMode;
}

function setAnimationWorkbenchProgress(progress: number): void {
  updateDebugTuning(
    {
      animationEditMode: "preview",
      animationPreviewProgress: clampNumber(progress, 0, 1),
      characterCanvasEditMode: getAnimationWorkbenchCanvasEditMode(),
    },
    { undoable: false },
  );
}

function getAnimationWorkbenchCanvasEditMode(): CharacterCanvasEditMode {
  return debugTuning.characterCanvasEditMode === "root" ? "root" : "parts";
}

function getAnimationModeKeyframeId(mode: AnimationEditMode): string {
  if (mode === "poseB") {
    return "pose-b";
  }

  if (mode === "poseA") {
    return "pose-a";
  }

  return debugTuning.selectedAnimationKeyframeId;
}

function selectAnimationKeyframe(keyframeId: string): void {
  const animation = getSelectedBodyAnimation();
  const keyframe = getAnimationKeyframes(animation).find((candidate) => candidate.id === keyframeId) ?? getAnimationKeyframes(animation)[0];
  const duration = Math.max(1, animation.duration);

  if (!keyframe) {
    return;
  }

  updateDebugTuning(
    {
      animationEditMode: "keyframe",
      animationPreviewProgress: clampNumber(keyframe.time / duration, 0, 1),
      characterCanvasEditMode: getAnimationWorkbenchCanvasEditMode(),
      selectedAnimationKeyframeId: keyframe.id,
    },
    { undoable: false },
  );
}

function addAnimationKeyframeAtProgress(): void {
  const animation = getSelectedBodyAnimation();
  const duration = Math.max(1, animation.duration);
  const time = Math.round(clampNumber(debugTuning.animationPreviewProgress, 0, 1) * duration);
  const keyframes = getAnimationKeyframes(animation);
  const sourceKeyframe = getSelectedAnimationKeyframe(animation) ?? keyframes[0];

  if (!sourceKeyframe) {
    return;
  }

  const id = createUniqueAnimationKeyframeId(keyframes, `key-${Math.round((time / duration) * 1000)}`);
  const sampledPose = sampleAnimationKeyframePose(animation, debugTuning.animationPreviewProgress);
  const nextKeyframe: BodyAnimationKeyframe = {
    id,
    time,
    easing: "easeInOut",
    rigParts: cloneRigParts(sampledPose?.rigParts ?? sourceKeyframe.rigParts),
    faceParts: cloneFaceParts(sampledPose?.faceParts ?? sourceKeyframe.faceParts),
    rootOffset: cloneBodyAnimationRootOffset(sampledPose?.rootOffset ?? sourceKeyframe.rootOffset),
    weaponMirrorX: sampledPose?.weaponMirrorX ?? sourceKeyframe.weaponMirrorX,
    weaponMirrorY: sampledPose?.weaponMirrorY ?? sourceKeyframe.weaponMirrorY,
    castProp: cloneBodyAnimationCastProp(sampledPose?.castProp ?? sourceKeyframe.castProp),
  };

  updateSelectedBodyAnimation(
    {
      keyframes: [...keyframes, nextKeyframe].sort(compareAnimationKeyframes),
    },
    {
      animationEditMode: "keyframe",
      selectedAnimationKeyframeId: id,
    },
  );
}

function duplicateSelectedAnimationKeyframeAtProgress(): void {
  const animation = getSelectedBodyAnimation();
  const duration = Math.max(1, animation.duration);
  const time = Math.round(clampNumber(debugTuning.animationPreviewProgress, 0, 1) * duration);
  const keyframes = getAnimationKeyframes(animation);
  const selectedKeyframe = getSelectedAnimationKeyframe(animation);

  if (!selectedKeyframe) {
    return;
  }

  const existingKeyframe = keyframes.find((keyframe) => !isProtectedAnimationKeyframe(keyframe.id) && Math.round(keyframe.time) === time);
  const nextKeyframe: BodyAnimationKeyframe = {
    ...(existingKeyframe ?? selectedKeyframe),
    id: existingKeyframe?.id ?? createUniqueAnimationKeyframeId(keyframes, `key-${Math.round((time / duration) * 1000)}`),
    time,
    easing: selectedKeyframe.easing,
    rigParts: cloneRigParts(selectedKeyframe.rigParts),
    faceParts: cloneFaceParts(selectedKeyframe.faceParts),
    rootOffset: cloneBodyAnimationRootOffset(selectedKeyframe.rootOffset),
    weaponMirrorX: selectedKeyframe.weaponMirrorX,
    weaponMirrorY: selectedKeyframe.weaponMirrorY,
    castProp: cloneBodyAnimationCastProp(selectedKeyframe.castProp),
  };

  updateSelectedBodyAnimation(
    {
      keyframes: (existingKeyframe
        ? keyframes.map((keyframe) => (keyframe.id === nextKeyframe.id ? nextKeyframe : keyframe))
        : [...keyframes, nextKeyframe]
      ).sort(compareAnimationKeyframes),
    },
    {
      animationEditMode: "keyframe",
      animationPreviewProgress: clampNumber(time / duration, 0, 1),
      selectedAnimationKeyframeId: nextKeyframe.id,
    },
  );
}

function setSelectedAnimationImpactKeyframe(): void {
  const animation = getSelectedBodyAnimation();
  const selectedKeyframe = getSelectedAnimationKeyframe(animation);

  if (!selectedKeyframe) {
    return;
  }

  updateSelectedBodyAnimation(
    {
      impactKeyframeId: selectedKeyframe.id,
    },
    {
      animationEditMode: "keyframe",
      animationPreviewProgress: clampNumber(selectedKeyframe.time / Math.max(1, animation.duration), 0, 1),
      selectedAnimationKeyframeId: selectedKeyframe.id,
    },
  );
}

function setSelectedAnimationStartKeyframe(): void {
  const animation = getSelectedBodyAnimation();
  const selectedKeyframe = getSelectedAnimationKeyframe(animation);

  if (!selectedKeyframe) {
    return;
  }

  updateSelectedBodyAnimation(
    {
      movementStartKeyframeId: selectedKeyframe.id,
    },
    {
      animationEditMode: "keyframe",
      animationPreviewProgress: clampNumber(selectedKeyframe.time / Math.max(1, animation.duration), 0, 1),
      selectedAnimationKeyframeId: selectedKeyframe.id,
    },
  );
}

function updateAnimationPreviewKeyframe(
  patch: Partial<Pick<BodyAnimationKeyframe, "rigParts" | "faceParts" | "rootOffset" | "weaponMirrorX" | "weaponMirrorY" | "castProp">>,
): void {
  const animation = getSelectedBodyAnimation();
  const duration = Math.max(1, animation.duration);
  const time = Math.round(clampNumber(debugTuning.animationPreviewProgress, 0, 1) * duration);
  const keyframes = getAnimationKeyframes(animation);
  const sampledPose = getAnimationPreviewPose();
  const sourceKeyframe = getSelectedAnimationKeyframe(animation) ?? keyframes[0];
  const sourcePose = sampledPose ?? sourceKeyframe;

  if (!sourcePose) {
    return;
  }

  const existingKeyframe = keyframes.find((keyframe) => Math.round(keyframe.time) === time);
  const targetKeyframe: BodyAnimationKeyframe = existingKeyframe ?? {
    id: createUniqueAnimationKeyframeId(keyframes, `key-${Math.round((time / duration) * 1000)}`),
    time,
    easing: "easeInOut",
    rigParts: cloneRigParts(sourcePose.rigParts),
    faceParts: cloneFaceParts(sourcePose.faceParts),
    rootOffset: cloneBodyAnimationRootOffset(sourcePose.rootOffset),
    weaponMirrorX: sourcePose.weaponMirrorX,
    weaponMirrorY: sourcePose.weaponMirrorY,
    castProp: cloneBodyAnimationCastProp(sourcePose.castProp),
  };
  const nextKeyframe: BodyAnimationKeyframe = {
    ...targetKeyframe,
    ...patch,
    id: targetKeyframe.id,
  };
  const nextKeyframes = (existingKeyframe
    ? keyframes.map((keyframe) => (keyframe.id === nextKeyframe.id ? nextKeyframe : keyframe))
    : [...keyframes, nextKeyframe]
  ).sort(compareAnimationKeyframes);
  const animationPatch: Partial<BodyAnimationTuning> = { keyframes: nextKeyframes };

  if (nextKeyframe.id === "pose-a") {
    if (patch.rigParts) {
      animationPatch.base = cloneRigParts(patch.rigParts);
    }
    if (patch.faceParts) {
      animationPatch.faceBase = cloneFaceParts(patch.faceParts);
    }
  }

  if (nextKeyframe.id === "pose-b") {
    if (patch.rigParts) {
      animationPatch.breath = cloneRigParts(patch.rigParts);
    }
    if (patch.faceParts) {
      animationPatch.faceBreath = cloneFaceParts(patch.faceParts);
    }
  }

  updateSelectedBodyAnimation(animationPatch, {
    animationEditMode: "keyframe",
    selectedAnimationKeyframeId: nextKeyframe.id,
  });
}

function moveAnimationKeyframeToRailPointer(keyframeId: string, rail: HTMLElement, clientX: number): void {
  const bounds = rail.getBoundingClientRect();

  if (bounds.width <= 0) {
    return;
  }

  moveAnimationKeyframeToProgress(keyframeId, (clientX - bounds.left) / bounds.width);
}

function moveAnimationKeyframeToProgress(keyframeId: string, progress: number): void {
  const animation = getSelectedBodyAnimation();
  const keyframe = getAnimationKeyframes(animation).find((candidate) => candidate.id === keyframeId);

  if (!keyframe || !isMovableAnimationKeyframe(keyframe.id)) {
    return;
  }

  const duration = Math.max(1, animation.duration);
  const nextTime = Math.round(clampNumber(progress, 0, 1) * duration);

  updateAnimationKeyframeById(
    keyframe.id,
    { time: nextTime },
    {
      animationEditMode: "keyframe",
      animationPreviewProgress: clampNumber(nextTime / duration, 0, 1),
      selectedAnimationKeyframeId: keyframe.id,
    },
  );
}

function deleteSelectedAnimationKeyframe(): void {
  const animation = getSelectedBodyAnimation();
  const selectedKeyframe = getSelectedAnimationKeyframe(animation);
  const targetKeyframe = selectedKeyframe && !isProtectedAnimationKeyframe(selectedKeyframe.id)
    ? selectedKeyframe
    : findEditableAnimationKeyframeAtProgress(animation, debugTuning.animationPreviewProgress);

  if (!targetKeyframe) {
    return;
  }

  const duration = Math.max(1, animation.duration);
  const nextAnimationPatch: Partial<BodyAnimationTuning> = {
    keyframes: getAnimationKeyframes(animation).filter((keyframe) => keyframe.id !== targetKeyframe.id),
  };

  if (animation.impactKeyframeId === targetKeyframe.id) {
    nextAnimationPatch.impactKeyframeId = undefined;
  }

  if (animation.movementStartKeyframeId === targetKeyframe.id) {
    nextAnimationPatch.movementStartKeyframeId = undefined;
  }

  updateSelectedBodyAnimation(
    nextAnimationPatch,
    {
      animationEditMode: "preview",
      animationPreviewProgress: clampNumber(targetKeyframe.time / duration, 0, 1),
      selectedAnimationKeyframeId: "pose-a",
    },
  );
}

function resetSelectedBodyAnimationFull(): void {
  if (!window.confirm("Full reset current animation variant? This deletes custom keys and resets Pose A/B.")) {
    return;
  }

  const animation = getSelectedBodyAnimation();
  const duration = Math.max(1, animation.duration);
  const neutralParts = getNeutralRigPartDefaults();
  const neutralFaceParts = getNeutralFacePartDefaults();
  const poseA = createNeutralAnimationAnchorKeyframe("pose-a", 0, neutralParts, neutralFaceParts);
  const poseB = createNeutralAnimationAnchorKeyframe("pose-b", duration / 2, neutralParts, neutralFaceParts);

  updateSelectedBodyAnimation(
    {
      base: cloneRigParts(neutralParts),
      breath: cloneRigParts(neutralParts),
      faceBase: cloneFaceParts(neutralFaceParts),
      faceBreath: cloneFaceParts(neutralFaceParts),
      activeParts: createAnimationActiveParts(true),
      movementStartKeyframeId: undefined,
      impactKeyframeId: undefined,
      keyframes: [poseA, poseB],
    },
    {
      animationEditMode: "keyframe",
      animationPreviewProgress: 0,
      characterCanvasEditMode: getAnimationWorkbenchCanvasEditMode(),
      selectedAnimationKeyframeId: "pose-a",
    },
  );
}

function createNeutralAnimationAnchorKeyframe(
  id: "pose-a" | "pose-b",
  time: number,
  rigParts: Record<RigPartKey, RigPartTuning>,
  faceParts: Record<FacePartKey, FacePartTuning>,
): BodyAnimationKeyframe {
  return {
    id,
    time,
    easing: "easeInOut",
    rigParts: cloneRigParts(rigParts),
    faceParts: cloneFaceParts(faceParts),
    rootOffset: { ...defaultBodyAnimationRootOffset },
  };
}

function resetSelectedAnimationPoseToDefault(): void {
  const poseId = getResettableAnimationPoseId();

  if (!poseId) {
    return;
  }

  const animation = getSelectedBodyAnimation();
  const defaultAnimation = DEFAULT_BODY_ANIMATIONS[debugTuning.selectedBodyAnimation] ?? DEFAULT_BODY_ANIMATIONS.idle;
  const defaultKeyframe = getAnimationKeyframes(defaultAnimation).find((keyframe) => keyframe.id === poseId);
  const currentKeyframe = getAnimationKeyframes(animation).find((keyframe) => keyframe.id === poseId);

  if (!defaultKeyframe) {
    return;
  }

  const duration = Math.max(1, animation.duration);
  const time = currentKeyframe?.time ?? (poseId === "pose-a" ? 0 : duration / 2);

  updateAnimationKeyframeById(
    poseId,
    {
      rigParts: cloneRigParts(defaultKeyframe.rigParts),
      faceParts: cloneFaceParts(defaultKeyframe.faceParts),
      rootOffset: cloneBodyAnimationRootOffset(defaultKeyframe.rootOffset),
      weaponMirrorX: defaultKeyframe.weaponMirrorX,
      weaponMirrorY: defaultKeyframe.weaponMirrorY,
      castProp: cloneBodyAnimationCastProp(defaultKeyframe.castProp),
    },
    {
      animationEditMode: poseId === "pose-a" ? "poseA" : "poseB",
      animationPreviewProgress: clampNumber(time / duration, 0, 1),
      selectedAnimationKeyframeId: poseId,
    },
  );
}

function applySelectedAnimationKeyframeToPose(targetPoseId: "pose-a" | "pose-b"): void {
  const animation = getSelectedBodyAnimation();
  const sourceKeyframe = getSelectedAnimationKeyframe(animation);
  const targetKeyframe = getAnimationKeyframes(animation).find((keyframe) => keyframe.id === targetPoseId);

  if (!sourceKeyframe || !targetKeyframe) {
    return;
  }

  const duration = Math.max(1, animation.duration);

  updateAnimationKeyframeById(
    targetPoseId,
    {
      rigParts: cloneRigParts(sourceKeyframe.rigParts),
      faceParts: cloneFaceParts(sourceKeyframe.faceParts),
      rootOffset: cloneBodyAnimationRootOffset(sourceKeyframe.rootOffset),
      weaponMirrorX: sourceKeyframe.weaponMirrorX,
      weaponMirrorY: sourceKeyframe.weaponMirrorY,
      castProp: cloneBodyAnimationCastProp(sourceKeyframe.castProp),
    },
    {
      animationEditMode: targetPoseId === "pose-a" ? "poseA" : "poseB",
      animationPreviewProgress: clampNumber(targetKeyframe.time / duration, 0, 1),
      selectedAnimationKeyframeId: targetPoseId,
    },
  );
}

function getResettableAnimationPoseId(): "pose-a" | "pose-b" | undefined {
  if (debugTuning.animationEditMode === "poseA") {
    return "pose-a";
  }

  if (debugTuning.animationEditMode === "poseB") {
    return "pose-b";
  }

  if (debugTuning.animationEditMode !== "keyframe") {
    return undefined;
  }

  const selectedKeyframe = getSelectedAnimationKeyframe();

  if (selectedKeyframe?.id === "pose-a" || selectedKeyframe?.id === "pose-b") {
    return selectedKeyframe.id;
  }

  return undefined;
}

function updateAnimationWorkbenchEasing(easing: BodyAnimationKeyframeEasing): void {
  const animation = getSelectedBodyAnimation();
  const selectedKeyframe = getSelectedAnimationKeyframe(animation);
  const targetKeyframe = getAnimationWorkbenchEasingKeyframe(animation, selectedKeyframe);

  if (!targetKeyframe) {
    return;
  }

  const duration = Math.max(1, animation.duration);

  updateAnimationKeyframeById(
    targetKeyframe.id,
    { easing },
    {
      animationEditMode: "keyframe",
      animationPreviewProgress: clampNumber(targetKeyframe.time / duration, 0, 1),
      selectedAnimationKeyframeId: targetKeyframe.id,
    },
  );
}

function updateSelectedAnimationKeyframe(patch: Partial<BodyAnimationKeyframe>): void {
  const animation = getSelectedBodyAnimation();
  const selectedKeyframe = getSelectedAnimationKeyframe(animation);

  if (!selectedKeyframe) {
    return;
  }

  updateAnimationKeyframeById(selectedKeyframe.id, patch);
}

function updateSelectedAnimationCastProp(patch: Partial<BodyAnimationCastPropTuning>): void {
  if (debugTuning.selectedBodyAnimation !== "scrollCast") {
    return;
  }

  const current = getEditableAnimationCastProp();
  const nextCastProp: BodyAnimationCastPropTuning = {
    ...defaultBodyAnimationCastProp,
    ...(current ?? {}),
    ...patch,
    assetKey: isScrollCastPropAssetKey(patch.assetKey ?? current?.assetKey)
      ? (patch.assetKey ?? current?.assetKey ?? DEFAULT_SCROLL_CAST_PROP_ASSET_KEY)
      : DEFAULT_SCROLL_CAST_PROP_ASSET_KEY,
  };

  if (debugTuning.animationEditMode === "preview") {
    updateAnimationPreviewKeyframe({ castProp: nextCastProp });
    return;
  }

  const keyframe = getActiveAnimationRootKeyframe();

  if (!keyframe) {
    return;
  }

  updateAnimationKeyframeById(keyframe.id, { castProp: nextCastProp });
}

function updateAnimationKeyframeById(
  keyframeId: string,
  patch: Partial<BodyAnimationKeyframe>,
  debugPatch: Partial<ArenaDebugTuning> = {},
): void {
  const animation = getSelectedBodyAnimation();
  const selectedKeyframe = getAnimationKeyframes(animation).find((keyframe) => keyframe.id === keyframeId);

  if (!selectedKeyframe) {
    return;
  }

  const nextKeyframe = {
    ...selectedKeyframe,
    ...patch,
    id: selectedKeyframe.id,
  };
  const nextKeyframes = getAnimationKeyframes(animation)
    .map((keyframe) => (keyframe.id === selectedKeyframe.id ? nextKeyframe : keyframe))
    .sort(compareAnimationKeyframes);
  const animationPatch: Partial<BodyAnimationTuning> = { keyframes: nextKeyframes };

  if (selectedKeyframe.id === "pose-a") {
    if (patch.rigParts) {
      animationPatch.base = cloneRigParts(patch.rigParts);
    }
    if (patch.faceParts) {
      animationPatch.faceBase = cloneFaceParts(patch.faceParts);
    }
  }

  if (selectedKeyframe.id === "pose-b") {
    if (patch.rigParts) {
      animationPatch.breath = cloneRigParts(patch.rigParts);
    }
    if (patch.faceParts) {
      animationPatch.faceBreath = cloneFaceParts(patch.faceParts);
    }
  }

  updateSelectedBodyAnimation(animationPatch, debugPatch);
}

function getAnimationKeyframes(animation: BodyAnimationTuning): BodyAnimationKeyframe[] {
  if (animation.keyframes && animation.keyframes.length > 0) {
    return animation.keyframes.map(cloneBodyAnimationKeyframe).sort(compareAnimationKeyframes);
  }

  return [
    {
      id: "pose-a",
      time: 0,
      easing: "easeInOut",
      rigParts: cloneRigParts(animation.base),
      faceParts: cloneFaceParts(animation.faceBase),
      rootOffset: { ...defaultBodyAnimationRootOffset },
    },
    {
      id: "pose-b",
      time: Math.max(1, animation.duration) / 2,
      easing: "easeInOut",
      rigParts: cloneRigParts(animation.breath),
      faceParts: cloneFaceParts(animation.faceBreath),
      rootOffset: { ...defaultBodyAnimationRootOffset },
    },
  ];
}

function getSelectedAnimationKeyframe(animation = getSelectedBodyAnimation()): BodyAnimationKeyframe | undefined {
  const keyframes = getAnimationKeyframes(animation);

  return keyframes.find((keyframe) => keyframe.id === debugTuning.selectedAnimationKeyframeId) ?? keyframes[0];
}

function getAnimationKeyframeIdAtRailPointer(rail: HTMLElement, event: MouseEvent): string | undefined {
  const bounds = rail.getBoundingClientRect();

  if (bounds.width <= 0) {
    return undefined;
  }

  const progress = clampNumber((event.clientX - bounds.left) / bounds.width, 0, 1);

  return findAnimationKeyframeAtProgress(getSelectedBodyAnimation(), progress, { preferCustom: true })?.id;
}

function findEditableAnimationKeyframeAtProgress(animation: BodyAnimationTuning, progress: number): BodyAnimationKeyframe | undefined {
  return findAnimationKeyframeAtProgress(animation, progress, { deletableOnly: true, preferCustom: true });
}

function getAnimationWorkbenchEasingKeyframe(
  animation: BodyAnimationTuning,
  selectedKeyframe: BodyAnimationKeyframe | undefined,
): BodyAnimationKeyframe | undefined {
  if (selectedKeyframe && !isProtectedAnimationKeyframe(selectedKeyframe.id)) {
    return selectedKeyframe;
  }

  return findEditableAnimationKeyframeAtProgress(animation, debugTuning.animationPreviewProgress);
}

function findAnimationKeyframeAtProgress(
  animation: BodyAnimationTuning,
  progress: number,
  options: { deletableOnly?: boolean; preferCustom?: boolean } = {},
): BodyAnimationKeyframe | undefined {
  const duration = Math.max(1, animation.duration);
  const targetTime = Math.round(clampNumber(progress, 0, 1) * duration);
  const maxTimeDistance = Math.max(8, duration * 0.025);
  const candidates = getAnimationKeyframes(animation)
    .filter((keyframe) => !options.deletableOnly || !isProtectedAnimationKeyframe(keyframe.id))
    .map((keyframe) => ({
      keyframe,
      distance: Math.abs(Math.round(keyframe.time) - targetTime),
      customRank: options.preferCustom && !isProtectedAnimationKeyframe(keyframe.id) ? 0 : 1,
    }))
    .filter((candidate) => candidate.distance <= maxTimeDistance)
    .sort((a, b) => a.distance - b.distance || a.customRank - b.customRank || a.keyframe.id.localeCompare(b.keyframe.id));

  return candidates[0]?.keyframe;
}

function getAnimationPreviewPose(): Pick<BodyAnimationKeyframe, "rigParts" | "faceParts" | "rootOffset" | "weaponMirrorX" | "weaponMirrorY" | "castProp"> | undefined {
  return sampleAnimationKeyframePose(getSelectedBodyAnimation(), debugTuning.animationPreviewProgress);
}

function sampleAnimationKeyframePose(
  animation: BodyAnimationTuning,
  progress: number,
): Pick<BodyAnimationKeyframe, "rigParts" | "faceParts" | "rootOffset" | "weaponMirrorX" | "weaponMirrorY" | "castProp"> | undefined {
  const keyframes = getAnimationKeyframes(animation);
  const firstKeyframe = keyframes[0];
  const duration = Math.max(1, animation.duration);

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

    return interpolateAnimationKeyframes(from, to, getAnimationKeyframeSegmentBlend(from, timelineTime - from.time, to.time - from.time));
  }

  const lastKeyframe = keyframes[keyframes.length - 1];

  if (!lastKeyframe) {
    return undefined;
  }

  const wrappedTimelineTime = timelineTime < firstKeyframe.time ? timelineTime + duration : timelineTime;
  const wrappedDuration = firstKeyframe.time + duration - lastKeyframe.time;

  return interpolateAnimationKeyframes(lastKeyframe, firstKeyframe, getAnimationKeyframeSegmentBlend(lastKeyframe, wrappedTimelineTime - lastKeyframe.time, wrappedDuration));
}

function getAnimationKeyframeSegmentBlend(keyframe: BodyAnimationKeyframe, elapsed: number, duration: number): number {
  if (keyframe.easing === "hold") {
    return 0;
  }

  const linearBlend = clampNumber(duration <= 0 ? 0 : elapsed / duration, 0, 1);

  if (keyframe.easing === "linear") {
    return linearBlend;
  }

  return 0.5 - Math.cos(linearBlend * Math.PI) * 0.5;
}

function interpolateAnimationKeyframes(
  from: BodyAnimationKeyframe,
  to: BodyAnimationKeyframe,
  blend: number,
): Pick<BodyAnimationKeyframe, "rigParts" | "faceParts" | "rootOffset" | "weaponMirrorX" | "weaponMirrorY" | "castProp"> {
  return {
    rigParts: Object.fromEntries(
      RIG_PART_KEYS.map((key) => [
        key,
        interpolateRigPartTuning(from.rigParts[key] ?? defaultRigPartTuning, to.rigParts[key] ?? defaultRigPartTuning, blend),
      ]),
    ) as Record<RigPartKey, RigPartTuning>,
    faceParts: Object.fromEntries(
      FACE_PART_KEYS.map((key) => [key, interpolateFacePartTuning(from.faceParts[key] ?? defaultFacePartTuning, to.faceParts[key] ?? defaultFacePartTuning, blend)]),
    ) as Record<FacePartKey, FacePartTuning>,
    rootOffset: interpolateBodyAnimationRootOffset(from.rootOffset ?? defaultBodyAnimationRootOffset, to.rootOffset ?? defaultBodyAnimationRootOffset, blend),
    weaponMirrorX: blend < 0.5 ? from.weaponMirrorX : to.weaponMirrorX,
    weaponMirrorY: blend < 0.5 ? from.weaponMirrorY : to.weaponMirrorY,
    castProp: interpolateBodyAnimationCastProp(from.castProp, to.castProp, blend),
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

function cloneBodyAnimationKeyframe(keyframe: BodyAnimationKeyframe): BodyAnimationKeyframe {
  return {
    ...keyframe,
    rigParts: cloneRigParts(keyframe.rigParts),
    faceParts: cloneFaceParts(keyframe.faceParts),
    rootOffset: cloneBodyAnimationRootOffset(keyframe.rootOffset),
    castProp: cloneBodyAnimationCastProp(keyframe.castProp),
  };
}

function compareAnimationKeyframes(a: BodyAnimationKeyframe, b: BodyAnimationKeyframe): number {
  return a.time - b.time || a.id.localeCompare(b.id);
}

function createUniqueAnimationKeyframeId(keyframes: readonly BodyAnimationKeyframe[], prefix: string): string {
  const usedIds = new Set(keyframes.map((keyframe) => keyframe.id));
  let id = sanitizeAnimationKeyframeId(prefix);
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${sanitizeAnimationKeyframeId(prefix)}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function sanitizeAnimationKeyframeId(value: string): string {
  const id = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

  return id || "key";
}

function isProtectedAnimationKeyframe(keyframeId: string): boolean {
  return keyframeId === "pose-a" || keyframeId === "pose-b";
}

function isMovableAnimationKeyframe(keyframeId: string): boolean {
  return keyframeId !== "pose-a";
}

function mountFaceAssetEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-face-editor__select");
  const controls = editor.querySelector<HTMLElement>(".debug-face-editor__controls");
  const reset = editor.querySelector<HTMLButtonElement>(".debug-face-editor__reset");
  const resetAll = editor.querySelector<HTMLButtonElement>(".debug-face-editor__reset-all");
  const appearanceSelect = editor.querySelector<HTMLSelectElement>(".debug-face-appearance-editor__select");
  const appearanceControls = editor.querySelector<HTMLElement>(".debug-face-appearance-editor__controls");
  const appearanceReset = editor.querySelector<HTMLButtonElement>(".debug-face-appearance-editor__reset");
  const appearanceResetAll = editor.querySelector<HTMLButtonElement>(".debug-face-appearance-editor__reset-all");

  if (!select || !controls || !reset || !resetAll || !appearanceSelect || !appearanceControls || !appearanceReset || !appearanceResetAll) {
    return;
  }

  FACE_ASSET_LAYER_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    select.append(option);
  });

  faceAssetLayerNumericControls.forEach((control) => controls.append(createFaceAssetLayerRangeControl(control)));
  APPEARANCE_LAYER_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    appearanceSelect.append(option);
  });
  appearanceLayerNumericControls.forEach((control) => appearanceControls.append(createAppearanceLayerRangeControl(control)));

  select.addEventListener("change", () => {
    if (isFaceAssetLayerKey(select.value)) {
      updateDebugTuning({ selectedFaceAssetLayer: select.value }, { undoable: false });
    }
  });

  appearanceSelect.addEventListener("change", () => {
    if (isAppearanceLayerKey(appearanceSelect.value)) {
      updateDebugTuning({ selectedAppearanceLayer: appearanceSelect.value }, { undoable: false });
    }
  });

  reset.addEventListener("click", () => {
    resetSelectedFaceAssetLayer();
  });

  resetAll.addEventListener("click", () => {
    resetAllFaceAssetLayers();
  });

  appearanceReset.addEventListener("click", () => {
    resetSelectedAppearanceLayer();
  });

  appearanceResetAll.addEventListener("click", () => {
    resetAllAppearanceLayers();
  });
}

function mountEffectsEditor(editor: HTMLElement): void {
  const slashSelect = editor.querySelector<HTMLSelectElement>(".debug-effects__slash-select");
  const slashControls = editor.querySelector<HTMLElement>(".debug-effects__slash-controls");
  const popupControls = editor.querySelector<HTMLElement>(".debug-effects__popup-controls");
  const start = editor.querySelector<HTMLButtonElement>(".debug-effects__start");
  const stop = editor.querySelector<HTMLButtonElement>(".debug-effects__stop");
  const resetSlash = editor.querySelector<HTMLButtonElement>(".debug-effects__reset-slash");

  if (!slashSelect || !slashControls || !popupControls || !start || !stop || !resetSlash) {
    return;
  }

  SLASH_ARC_ATTACK_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    slashSelect.append(option);
  });

  slashArcNumericControls.forEach((control) => slashControls.append(createSlashArcRangeControl(control)));
  const popupGroup = createControlGroup(popupControlGroup);
  popupControls.append(popupGroup);
  mountPopupPreviewTriggers(popupGroup);

  slashSelect.addEventListener("change", () => {
    if (isSlashArcAttackKey(slashSelect.value)) {
      updateDebugTuning({ selectedSlashArc: slashSelect.value }, { undoable: false });
    }
  });

  start.addEventListener("click", () => {
    startSlashPreviewLoop();
  });

  stop.addEventListener("click", () => {
    stopSlashPreviewLoop();
  });

  resetSlash.addEventListener("click", () => {
    resetSelectedSlashArc();
  });
}

function mountPopupPreviewTriggers(root: HTMLElement): void {
  root.querySelectorAll<HTMLInputElement>("[data-debug-key], [data-debug-number-key]").forEach((input) => {
    input.addEventListener("input", () => {
      previewPopupForTuningKey(getDebugTuningKeyFromControl(input));
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-debug-reset-key]").forEach((button) => {
    button.addEventListener("click", () => {
      previewPopupForTuningKey(getDebugTuningKeyFromControl(button));
    });
  });
}

function getDebugTuningKeyFromControl(element: HTMLElement): keyof ArenaDebugTuning | undefined {
  const key = element.dataset.debugKey ?? element.dataset.debugNumberKey ?? element.dataset.debugResetKey;

  return key as keyof ArenaDebugTuning | undefined;
}

function previewPopupForTuningKey(key: keyof ArenaDebugTuning | undefined): void {
  const kind = key ? popupPreviewKindByKey[key] : undefined;

  if (!kind) {
    return;
  }

  previewPopup?.(kind);
}

function startSlashPreviewLoop(): void {
  if (isSlashPreviewLoopRunning) {
    return;
  }

  isSlashPreviewLoopRunning = true;
  runSlashPreviewLoop();
  syncSlashPreviewButtons();
}

function stopSlashPreviewLoop(): void {
  isSlashPreviewLoopRunning = false;

  if (slashPreviewTimer !== undefined) {
    window.clearTimeout(slashPreviewTimer);
    slashPreviewTimer = undefined;
  }

  syncSlashPreviewButtons();
}

function runSlashPreviewLoop(): void {
  if (!isSlashPreviewLoopRunning) {
    return;
  }

  const actionId = debugTuning.selectedSlashArc;
  const arc = debugTuning.slashArcs[actionId] ?? DEFAULT_SLASH_ARCS[actionId];
  const animation = getActiveBodyPresetTuning().bodyAnimations[actionId] ?? DEFAULT_BODY_ANIMATIONS[actionId];

  previewSlashArc?.(actionId, true);

  slashPreviewTimer = window.setTimeout(
    () => runSlashPreviewLoop(),
    Math.max(animation.duration, arc.duration, 120) + 140,
  );
}

function syncSlashPreviewButtons(): void {
  const panel = document.querySelector<HTMLElement>(".debug-panel");

  if (panel) {
    syncEffectsEditor(panel);
  }
}

function createRigRangeControl(control: RigNumericControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-rig-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-rig-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateRigNumericTuning(control.key, Number(range.value));
  });

  number?.addEventListener("input", () => {
    updateRigNumericTuning(control.key, Number(number.value));
  });

  return row;
}

function createSlashArcRangeControl(control: SlashArcNumericControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-slash-arc-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-slash-arc-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateSelectedSlashArc({ [control.key]: Number(range.value) } as Partial<SlashArcTuning>);
  });

  number?.addEventListener("input", () => {
    updateSelectedSlashArc({ [control.key]: Number(number.value) } as Partial<SlashArcTuning>);
  });

  return row;
}

function createRigToggleControl(control: RigToggleControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-panel__row--toggle debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input type="checkbox" data-rig-toggle-key="${control.key}" />
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    updateRigToggleTuning(control.key, input.checked);
  });

  return row;
}

function createAnimationCastPropRangeControl(control: AnimationCastPropNumericControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-animation-cast-prop-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-animation-cast-prop-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateSelectedAnimationCastProp({ [control.key]: clampAnimationCastPropNumericValue(control.key, Number(range.value)) } as Partial<BodyAnimationCastPropTuning>);
  });

  number?.addEventListener("input", () => {
    updateSelectedAnimationCastProp({ [control.key]: clampAnimationCastPropNumericValue(control.key, Number(number.value)) } as Partial<BodyAnimationCastPropTuning>);
  });

  return row;
}

function createAnimationCastPropToggleControl(control: AnimationCastPropToggleControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-panel__row--toggle debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input type="checkbox" data-animation-cast-prop-toggle-key="${control.key}" />
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    updateSelectedAnimationCastProp({ [control.key]: input.checked } as Partial<BodyAnimationCastPropTuning>);
  });

  return row;
}

function createLimbRotateControl(config: RigLimbRotateConfig): HTMLElement {
  const row = document.createElement("div");
  row.className = "debug-rig-editor__limb-row";
  row.innerHTML = `
    <span>${config.label}</span>
    <button class="debug-panel__reset" type="button" data-limb-rotate="${config.key}" data-limb-direction="-1">-</button>
    <button class="debug-panel__reset" type="button" data-limb-rotate="${config.key}" data-limb-direction="1">+</button>
  `;

  row.querySelectorAll<HTMLButtonElement>("button[data-limb-rotate]").forEach((button) => {
    button.addEventListener("click", () => {
      const limbKey = button.dataset.limbRotate;
      const direction = button.dataset.limbDirection === "-1" ? -1 : 1;

      if (isRigLimbKey(limbKey)) {
        rotateRigLimb(limbKey, RIG_LIMB_ROTATE_STEP_DEGREES * direction);
      }
    });
  });

  return row;
}

function createCharacterPreviewRangeControl(control: CharacterPreviewControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-rig-editor__row";
  row.dataset.characterPreviewMode = control.mode;
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-debug-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-debug-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateDebugTuning({ [control.key]: Number(range.value) });
  });

  number?.addEventListener("input", () => {
    updateDebugTuning({ [control.key]: Number(number.value) });
  });

  return row;
}

function createAnimationPartToggle(partKey: RigPartKey): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-rig-editor__idle-part";
  row.innerHTML = `
    <input type="checkbox" data-animation-part-key="${partKey}" />
    <span>${partKey}</span>
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    updateAnimationActivePart(partKey, input.checked);
  });

  return row;
}

function createAnimationVariantWeaponToggle(weaponClass: BodyAnimationWeaponClass): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-animation-editor__weapon-toggle";
  row.innerHTML = `
    <input type="checkbox" data-animation-variant-weapon="${weaponClass}" />
    <span>${weaponClass}</span>
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    const animation = getSelectedBodyAnimation();
    const weaponClasses = new Set(animation.weaponClasses ?? []);

    if (input.checked) {
      weaponClasses.add(weaponClass);
    } else {
      weaponClasses.delete(weaponClass);
    }

    updateSelectedBodyAnimationVariantMeta({ weaponClasses: [...weaponClasses] });
  });

  return row;
}

function createFacePartEditor(partKey: FacePartKey): HTMLElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "debug-rig-editor__face-part";
  fieldset.innerHTML = `<legend>${partKey}</legend>`;

  faceNumericControls.forEach((control) => {
    fieldset.append(createFaceRangeControl(partKey, control));
  });

  return fieldset;
}

function createFaceRangeControl(partKey: FacePartKey, control: FaceNumericControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-face-part="${partKey}"
      data-face-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-face-part="${partKey}"
      data-face-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateFacePartTuning(partKey, control.key, Number(range.value));
  });

  number?.addEventListener("input", () => {
    updateFacePartTuning(partKey, control.key, Number(number.value));
  });

  return row;
}

function createFaceAssetLayerRangeControl(control: FaceAssetLayerNumericControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-face-asset-layer-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-face-asset-layer-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateFaceAssetLayerTuning(debugTuning.selectedFaceAssetLayer, control.key, Number(range.value));
  });

  number?.addEventListener("input", () => {
    updateFaceAssetLayerTuning(debugTuning.selectedFaceAssetLayer, control.key, Number(number.value));
  });

  return row;
}

function createAppearanceLayerRangeControl(control: AppearanceLayerNumericControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-appearance-layer-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-appearance-layer-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateAppearanceLayerTuning(debugTuning.selectedAppearanceLayer, control.key, Number(range.value));
  });

  number?.addEventListener("input", () => {
    updateAppearanceLayerTuning(debugTuning.selectedAppearanceLayer, control.key, Number(number.value));
  });

  return row;
}

function createEquipmentRangeControl(control: EquipmentNumericControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-equipment-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-equipment-number-key="${control.key}"
    />
    <button
      class="debug-panel__control-reset debug-item-equipment__copy"
      type="button"
      data-equipment-copy-key="${control.key}"
    >Copy</button>
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");
  const copy = row.querySelector<HTMLButtonElement>(".debug-item-equipment__copy");

  range?.addEventListener("input", () => {
    updateActiveEquipmentTuning({ [control.key]: clampEquipmentNumericValue(control.key, Number(range.value)) } as Partial<EquipmentTuning>);
  });

  number?.addEventListener("input", () => {
    updateActiveEquipmentTuning({ [control.key]: clampEquipmentNumericValue(control.key, Number(number.value)) } as Partial<EquipmentTuning>);
  });

  copy?.addEventListener("click", (event) => {
    event.preventDefault();
    copyPairedEquipmentTuningToActiveItem(control.key);
  });

  return row;
}

function createEquipmentToggleControl(control: EquipmentToggleControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-panel__row--toggle debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input type="checkbox" data-equipment-toggle-key="${control.key}" />
    <button
      class="debug-panel__control-reset debug-item-equipment__copy"
      type="button"
      data-equipment-copy-key="${control.key}"
    >Copy</button>
  `;

  const input = row.querySelector<HTMLInputElement>("input");
  const copy = row.querySelector<HTMLButtonElement>(".debug-item-equipment__copy");

  input?.addEventListener("change", () => {
    updateActiveEquipmentTuning({ [control.key]: input.checked } as Partial<EquipmentTuning>);
  });

  copy?.addEventListener("click", (event) => {
    event.preventDefault();
    copyPairedEquipmentTuningToActiveItem(control.key);
  });

  return row;
}

function updateRigPartTuning(partKey: RigPartKey, patch: Partial<RigPartTuning>): void {
  const rigParts = getEditableRigParts();

  if (!rigParts) {
    return;
  }

  updateEditableRigParts({
    ...rigParts,
    [partKey]: {
      ...rigParts[partKey],
      ...patch,
    },
  });
}

function updateBodyPartLayerTuning(partKey: RigPartKey, patch: Partial<BodyPartLayerTuning>): void {
  const bodyPartLayers = getEditableBodyPartLayers();

  updateEditableBodyPartLayers({
    ...bodyPartLayers,
    [partKey]: {
      ...bodyPartLayers[partKey],
      ...patch,
    },
  });
}

function updateFacePartTuning(partKey: FacePartKey, key: FaceNumericControlKey, value: number): void {
  const faceParts = getEditableFaceParts();

  if (!faceParts) {
    return;
  }

  updateEditableFaceParts({
    ...faceParts,
    [partKey]: {
      ...faceParts[partKey],
      [key]: clampFaceNumericValue(key, value),
    },
  });
}

function resetFaceParts(): void {
  updateEditableFaceParts(Object.fromEntries(FACE_PART_KEYS.map((key) => [key, { ...defaultFacePartTuning }])) as Record<FacePartKey, FacePartTuning>);
}

function updateFaceAssetLayerTuning(partKey: FaceAssetLayerKey, key: FaceAssetLayerNumericControlKey, value: number): void {
  const faceAssetLayers = getActiveBodyPresetTuning().faceAssetLayers;

  updateActiveBodyPresetTuning({
    faceAssetLayers: {
      ...faceAssetLayers,
      [partKey]: {
        ...faceAssetLayers[partKey],
        [key]: clampFaceAssetLayerNumericValue(key, value),
      },
    },
  });
}

function updateAppearanceLayerTuning(partKey: AppearanceLayerKey, key: AppearanceLayerNumericControlKey, value: number): void {
  const appearanceLayers = getActiveBodyPresetTuning().appearanceLayers;

  updateActiveBodyPresetTuning({
    appearanceLayers: {
      ...appearanceLayers,
      [partKey]: {
        ...appearanceLayers[partKey],
        [key]: clampAppearanceLayerNumericValue(key, value),
      },
    },
  });
}

function resetSelectedFaceAssetLayer(): void {
  const presetDefaults = DEFAULT_BODY_PRESET_TUNING[debugTuning.paperDollBodyPreset] ?? DEFAULT_BODY_PRESET_TUNING.classic;

  updateActiveBodyPresetTuning({
    faceAssetLayers: {
      ...getActiveBodyPresetTuning().faceAssetLayers,
      [debugTuning.selectedFaceAssetLayer]: { ...presetDefaults.faceAssetLayers[debugTuning.selectedFaceAssetLayer] },
    },
  });
}

function resetAllFaceAssetLayers(): void {
  const presetDefaults = DEFAULT_BODY_PRESET_TUNING[debugTuning.paperDollBodyPreset] ?? DEFAULT_BODY_PRESET_TUNING.classic;

  updateActiveBodyPresetTuning({
    faceAssetLayers: Object.fromEntries(FACE_ASSET_LAYER_KEYS.map((key) => [key, { ...presetDefaults.faceAssetLayers[key] }])) as Record<
      FaceAssetLayerKey,
      FaceAssetLayerTuning
    >,
  });
}

function resetSelectedAppearanceLayer(): void {
  const presetDefaults = DEFAULT_BODY_PRESET_TUNING[debugTuning.paperDollBodyPreset] ?? DEFAULT_BODY_PRESET_TUNING.classic;

  updateActiveBodyPresetTuning({
    appearanceLayers: {
      ...getActiveBodyPresetTuning().appearanceLayers,
      [debugTuning.selectedAppearanceLayer]: { ...presetDefaults.appearanceLayers[debugTuning.selectedAppearanceLayer] },
    },
  });
}

function resetAllAppearanceLayers(): void {
  const presetDefaults = DEFAULT_BODY_PRESET_TUNING[debugTuning.paperDollBodyPreset] ?? DEFAULT_BODY_PRESET_TUNING.classic;

  updateActiveBodyPresetTuning({
    appearanceLayers: Object.fromEntries(APPEARANCE_LAYER_KEYS.map((key) => [key, { ...presetDefaults.appearanceLayers[key] }])) as Record<
      AppearanceLayerKey,
      AppearanceLayerTuning
    >,
  });
}

function updateEquipmentSlot(slotKey: EquipmentSlotKey, patch: Partial<EquipmentTuning>): void {
  const current = debugTuning.equipment[slotKey] ?? DEFAULT_EQUIPMENT[slotKey];

  updateDebugTuning({
    equipment: {
      ...debugTuning.equipment,
      [slotKey]: {
        ...current,
        ...patch,
      },
    },
  });
}

function updateActiveEquipmentTuning(patch: Partial<EquipmentTuning>): void {
  if (activeEquipmentItemId) {
    updateEquipmentItemTuning(activeEquipmentItemId, activeEquipmentSlot, patch);
    return;
  }

  updateEquipmentSlot(activeEquipmentSlot, patch);
}

function copyPairedEquipmentTuningToActiveItem(key: EquipmentControlKey): void {
  const pairItem = getActiveEquipmentPairItem();

  if (!activeEquipmentItemId || !pairItem) {
    return;
  }

  const source = getCurrentEquipmentItemTuning(pairItem.itemId, pairItem.slotKey);

  updateEquipmentItemTuning(activeEquipmentItemId, activeEquipmentSlot, {
    [key]: source[key],
  } as Partial<EquipmentTuning>);
}

function getActiveEquipmentPairItem(): { itemId: HeroItemId; slotKey: EquipmentSlotKey; name: string } | undefined {
  if (!activeEquipmentItemId) {
    return undefined;
  }

  return getGeneratedEquipmentPairItem(activeEquipmentItemId);
}

function getGeneratedEquipmentPairItem(itemId: HeroItemId): { itemId: HeroItemId; slotKey: EquipmentSlotKey; name: string } | undefined {
  const record = getSelectedGeneratedEquipmentRecord(itemId);

  if (!record || record.item.kind !== "armor" || !isEquipmentSlotKey(record.item.equipmentSlot)) {
    return undefined;
  }

  const pairConfig = getDebugShopItemPairConfig(record.item.equipmentSlot);

  if (!pairConfig) {
    return undefined;
  }

  const counterpart = findDebugShopItemPair(record, GENERATED_EQUIPMENT_ITEM_RECORDS, pairConfig, new Set());

  if (!counterpart || !isEquipmentSlotKey(counterpart.item.equipmentSlot)) {
    return undefined;
  }

  return {
    itemId: counterpart.item.id,
    slotKey: counterpart.item.equipmentSlot,
    name: counterpart.item.name,
  };
}

function selectCharacterCanvasEquipment(selection: DebugCharacterEquipmentSelection): void {
  activeEquipmentSlot = selection.slotKey;
  const definition = getDebugHeroItemDefinition(selection.itemId);

  activeEquipmentItemId = definition?.equipmentSlot === selection.slotKey ? definition.id : "";
}

function updateCharacterCanvasEquipmentDelta(delta: DebugCharacterEquipmentDelta): void {
  const current = activeEquipmentItemId
    ? getCurrentEquipmentItemTuning(activeEquipmentItemId, activeEquipmentSlot)
    : getCurrentEquipmentSlotTuning(activeEquipmentSlot);
  const patch: Partial<EquipmentTuning> = {};

  if (delta.x !== undefined) {
    patch.x = clampEquipmentNumericValue("x", current.x + delta.x);
  }

  if (delta.y !== undefined) {
    patch.y = clampEquipmentNumericValue("y", current.y + delta.y);
  }

  if (delta.angle !== undefined) {
    patch.angle = clampEquipmentNumericValue("angle", current.angle + delta.angle);
  }

  updateActiveEquipmentTuning(patch);
}

function updateEquipmentItemTuning(itemId: HeroItemId, slotKey: EquipmentSlotKey, patch: Partial<EquipmentTuning>): void {
  const current = getCurrentEquipmentItemTuning(itemId, slotKey);

  updateDebugTuning({
    equipmentItems: {
      ...debugTuning.equipmentItems,
      [itemId]: {
        ...current,
        ...patch,
      },
    },
  });
}

function resetEquipmentSlot(slotKey: EquipmentSlotKey): void {
  updateEquipmentSlot(slotKey, { ...DEFAULT_EQUIPMENT[slotKey] });
}

function resetActiveEquipmentTuning(): void {
  if (activeEquipmentItemId) {
    resetEquipmentItemTuning(activeEquipmentItemId, activeEquipmentSlot);
    return;
  }

  resetEquipmentSlot(activeEquipmentSlot);
}

function resetEquipmentItemTuning(itemId: HeroItemId, slotKey: EquipmentSlotKey): void {
  updateEquipmentItemTuning(itemId, slotKey, {
    ...(GENERATED_EQUIPMENT_ITEM_TUNING[itemId] ?? DEFAULT_EQUIPMENT_ITEM_TUNING[itemId] ?? DEFAULT_EQUIPMENT[slotKey]),
  });
}

function updateSelectedSlashArc(patch: Partial<SlashArcTuning>): void {
  const key = debugTuning.selectedSlashArc;
  const current = debugTuning.slashArcs[key] ?? DEFAULT_SLASH_ARCS[key];

  updateDebugTuning({
    slashArcs: {
      ...debugTuning.slashArcs,
      [key]: {
        ...current,
        ...patch,
      },
    },
  });
}

function resetSelectedSlashArc(): void {
  const key = debugTuning.selectedSlashArc;

  updateDebugTuning({
    slashArcs: {
      ...debugTuning.slashArcs,
      [key]: { ...DEFAULT_SLASH_ARCS[key] },
    },
  });
}

function updateSelectedClassicActionButtonSlot(patch: Partial<ClassicActionButtonSlotTuning>): void {
  const mode = debugTuning.selectedClassicActionWheelMode;
  const actionId = getClassicWheelActionButton(mode, debugTuning.selectedClassicActionButton);
  const currentModeSlots = debugTuning.classicActionButtonSlots[mode];
  const currentSlot = currentModeSlots[actionId];

  updateDebugTuning({
    classicActionButtonSlots: {
      ...debugTuning.classicActionButtonSlots,
      [mode]: {
        ...currentModeSlots,
        [actionId]: {
          ...currentSlot,
          ...patch,
        },
      },
    },
  });
}

function getClassicWheelActionButtons(mode: ClassicActionWheelMode): ActionButtonOffsetKey[] {
  return CLASSIC_ACTION_WHEEL_BUTTONS[mode] ?? ACTION_BUTTON_OFFSET_KEYS;
}

function getClassicWheelActionButton(mode: ClassicActionWheelMode, actionId: ActionButtonOffsetKey): ActionButtonOffsetKey {
  const actions = getClassicWheelActionButtons(mode);

  return actions.includes(actionId) ? actionId : actions[0];
}

function getClassicActionButtonLabel(mode: ClassicActionWheelMode, actionId: ActionButtonOffsetKey): string {
  if (mode === "bowDistance") {
    return bowDistanceActionButtonLabels[actionId] ?? actionButtonLabels[actionId];
  }

  return actionButtonLabels[actionId];
}

function syncClassicActionSelectOptions(select: HTMLSelectElement, mode: ClassicActionWheelMode, selectedActionId: ActionButtonOffsetKey): void {
  const actionIds = getClassicWheelActionButtons(mode);
  const currentValues = Array.from(select.options).map((option) => option.value);
  const shouldRebuild = currentValues.length !== actionIds.length || actionIds.some((actionId, index) => currentValues[index] !== actionId);

  if (shouldRebuild) {
    select.replaceChildren(
      ...actionIds.map((actionId) => {
        const option = document.createElement("option");

        option.value = actionId;
        option.textContent = getClassicActionButtonLabel(mode, actionId);
        return option;
      }),
    );
  }

  select.value = selectedActionId;
}

function updateHeroEquipmentItemWithPair(itemId: HeroItemId, slotKey: HeroEquipmentSlotKey): void {
  if (!debugHeroEquipment) {
    return;
  }

  const pairItem = getGeneratedEquipmentPairItem(itemId);

  updateHeroEquipment({
    ...debugHeroEquipment,
    [slotKey]: itemId,
    ...(pairItem ? { [pairItem.slotKey]: pairItem.itemId } : {}),
  });
}

function updateHeroEquipment(nextEquipment: HeroEquipment): void {
  debugHeroEquipment = nextEquipment;
  notifyHeroEquipmentChange?.({ ...nextEquipment });

  const panel = document.querySelector<HTMLElement>(".debug-panel");

  if (panel) {
    syncEquipmentEditor(panel);
  }
}

function updateRigNumericTuning(key: RigNumericControlKey, value: number): void {
  if (isRootCanvasMode()) {
    if (key === "x" || key === "y") {
      if (isRootPoseTransformMode()) {
        updateSelectedPoseOffset({ [key]: clampRigNumericValue(key, value) });
      } else {
        updateSelectedRootOffset({ [key]: clampRigNumericValue(key, value) });
      }
    }
    return;
  }

  if (isBodyArtCanvasMode()) {
    updateBodyPartLayerTuning(debugTuning.selectedRigPart, { [key]: clampBodyPartLayerNumericValue(key, value) } as Partial<BodyPartLayerTuning>);
    return;
  }

  updateRigPartTuning(debugTuning.selectedRigPart, { [key]: clampRigNumericValue(key, value) } as Partial<RigPartTuning>);
}

function updateRigToggleTuning(key: RigToggleControlKey, value: boolean): void {
  if (isRootCanvasMode()) {
    return;
  }

  if (isBodyArtCanvasMode()) {
    updateBodyPartLayerTuning(debugTuning.selectedRigPart, { [key]: value } as Partial<BodyPartLayerTuning>);
    return;
  }

  updateRigPartTuning(debugTuning.selectedRigPart, { [key]: value } as Partial<RigPartTuning>);
}

function updateSelectedRootOffset(patch: Partial<BodyAnimationRootOffset>): void {
  const rootOffset = getEditableRootOffset();

  if (!rootOffset) {
    return;
  }

  updateEditableRootOffset({
    x: clampRigNumericValue("x", patch.x ?? rootOffset.x),
    y: clampRigNumericValue("y", patch.y ?? rootOffset.y),
  });
}

function updateSelectedPoseOffset(patch: Partial<Pick<RigPartTuning, "x" | "y">>): void {
  const currentOffset = getEditablePoseOffset();

  if (!currentOffset) {
    return;
  }

  shiftEditableAnimationPose({
    x: (patch.x ?? currentOffset.x) - currentOffset.x,
    y: (patch.y ?? currentOffset.y) - currentOffset.y,
  });
}

function getEditablePoseOffset(): Pick<RigPartTuning, "x" | "y"> | undefined {
  return getEditableRigParts()?.torso;
}

function shiftEditableAnimationPose(delta: { x: number; y: number }): void {
  if (Math.abs(delta.x) < 0.001 && Math.abs(delta.y) < 0.001) {
    return;
  }

  const rigParts = getEditableRigParts();
  const faceParts = getEditableFaceParts();

  if (!rigParts || !faceParts) {
    return;
  }

  updateEditableAnimationPoseParts(shiftRigParts(rigParts, delta), cloneFaceParts(faceParts));
}

function rotatePaperDoll(degrees: number): void {
  const rigParts = getEditableRigParts();

  if (!rigParts) {
    return;
  }

  const radians = (degrees * Math.PI) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  const nextRigParts = { ...rigParts };

  RIG_PART_KEYS.forEach((partKey) => {
    const current = rigParts[partKey];
    const pivot = rigPartRootPivots[partKey];
    const localX = pivot.x + current.x;
    const localY = pivot.y + current.y;
    const rotatedX = localX * cos - localY * sin;
    const rotatedY = localX * sin + localY * cos;

    nextRigParts[partKey] = {
      ...current,
      x: clampRigNumericValue("x", rotatedX - pivot.x),
      y: clampRigNumericValue("y", rotatedY - pivot.y),
      angle: clampRigNumericValue("angle", current.angle + degrees),
    };
  });

  updateEditableRigParts(nextRigParts);
}

function rotateRigLimb(limbKey: RigLimbKey, degrees: number): void {
  const config = rigLimbRotateConfigs.find((item) => item.key === limbKey);
  const rigParts = getEditableRigParts();

  if (!config || !rigParts) {
    return;
  }

  const radians = (degrees * Math.PI) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  const anchorPivot = rigPartRootPivots[config.anchor];
  const anchorTuning = rigParts[config.anchor];
  const originX = anchorPivot.x + anchorTuning.x;
  const originY = anchorPivot.y + anchorTuning.y;
  const nextRigParts = { ...rigParts };

  config.parts.forEach((partKey) => {
    const current = rigParts[partKey];
    const pivot = rigPartRootPivots[partKey];
    const localX = pivot.x + current.x;
    const localY = pivot.y + current.y;
    const offsetX = localX - originX;
    const offsetY = localY - originY;
    const rotatedX = originX + offsetX * cos - offsetY * sin;
    const rotatedY = originY + offsetX * sin + offsetY * cos;

    nextRigParts[partKey] = {
      ...current,
      x: clampRigNumericValue("x", rotatedX - pivot.x),
      y: clampRigNumericValue("y", rotatedY - pivot.y),
      angle: clampRigNumericValue("angle", current.angle + degrees),
    };
  });

  updateEditableRigParts(nextRigParts);
}

function resetSelectedRigPart(): void {
  if (isRootCanvasMode()) {
    if (isRootPoseTransformMode()) {
      updateSelectedPoseOffset({ x: 0, y: 0 });
    } else {
      updateEditableRootOffset({ ...defaultBodyAnimationRootOffset });
    }
    return;
  }

  const neutralParts = getNeutralRigPartDefaults();
  const rigParts = getEditableRigParts();

  if (!rigParts) {
    return;
  }

  const nextRigParts = { ...rigParts };

  getSelectedRigPartsForBulkAction().forEach((partKey) => {
    nextRigParts[partKey] = { ...neutralParts[partKey] };
  });

  updateEditableRigParts(nextRigParts);
}

function resetAllRigParts(): void {
  updateEditableRigParts(getNeutralRigPartDefaults());
}

function resetSelectedCharacterPart(): void {
  if (isBodyArtCanvasMode()) {
    resetSelectedBodyPartLayer();
    return;
  }

  resetSelectedRigPart();
}

function resetAllCharacterParts(): void {
  if (isBodyArtCanvasMode()) {
    resetAllBodyPartLayers();
    return;
  }

  resetAllRigParts();
}

function resetSelectedBodyPartLayer(): void {
  const neutralLayers = getNeutralBodyPartLayerDefaults();
  const bodyPartLayers = getEditableBodyPartLayers();
  const nextBodyPartLayers = { ...bodyPartLayers };

  getSelectedRigPartsForBulkAction().forEach((partKey) => {
    nextBodyPartLayers[partKey] = { ...neutralLayers[partKey] };
  });

  updateEditableBodyPartLayers(nextBodyPartLayers);
}

function resetAllBodyPartLayers(): void {
  updateEditableBodyPartLayers(getNeutralBodyPartLayerDefaults());
}

function resetSelectedAnimationToIdle(): void {
  const neutralParts = getNeutralRigPartDefaults();
  const neutralFaceParts = getNeutralFacePartDefaults();

  updateSelectedBodyAnimation({
    base: cloneRigParts(neutralParts),
    breath: cloneRigParts(neutralParts),
    faceBase: cloneFaceParts(neutralFaceParts),
    faceBreath: cloneFaceParts(neutralFaceParts),
    activeParts: createAnimationActiveParts(true),
  });
}

function getNeutralRigPartDefaults(): Record<RigPartKey, RigPartTuning> {
  const neutralParts = DEFAULT_BODY_ANIMATIONS.idle.base;

  return Object.fromEntries(RIG_PART_KEYS.map((partKey) => [partKey, { ...neutralParts[partKey] }])) as Record<RigPartKey, RigPartTuning>;
}

function getNeutralFacePartDefaults(): Record<FacePartKey, FacePartTuning> {
  const neutralFaceParts = DEFAULT_BODY_ANIMATIONS.idle.faceBase;

  return cloneFaceParts(neutralFaceParts);
}

function getNeutralBodyPartLayerDefaults(): Record<RigPartKey, BodyPartLayerTuning> {
  const presetDefaults = DEFAULT_BODY_PRESET_TUNING[debugTuning.paperDollBodyPreset] ?? DEFAULT_BODY_PRESET_TUNING.classic;

  return Object.fromEntries(
    RIG_PART_KEYS.map((partKey) => [partKey, { ...(presetDefaults.bodyPartLayers[partKey] ?? defaultBodyPartLayerTuning) }]),
  ) as Record<RigPartKey, BodyPartLayerTuning>;
}

function getEditableRigParts(): Record<RigPartKey, RigPartTuning> | undefined {
  if (debugTuning.animationEditMode === "keyframe") {
    return getSelectedAnimationKeyframe()?.rigParts;
  }

  if (debugTuning.animationEditMode === "preview") {
    return getAnimationPreviewPose()?.rigParts;
  }

  const poseKey = getActiveAnimationRigPoseKey();

  if (!poseKey) {
    return undefined;
  }

  return getSelectedBodyAnimation()[poseKey];
}

function getEditableBodyPartLayers(): Record<RigPartKey, BodyPartLayerTuning> {
  return getActiveBodyPresetTuning().bodyPartLayers;
}

function getEditableFaceParts(): Record<FacePartKey, FacePartTuning> | undefined {
  if (debugTuning.animationEditMode === "keyframe") {
    return getSelectedAnimationKeyframe()?.faceParts;
  }

  if (debugTuning.animationEditMode === "preview") {
    return getAnimationPreviewPose()?.faceParts;
  }

  const poseKey = getActiveAnimationFacePoseKey();

  if (!poseKey) {
    return undefined;
  }

  return getSelectedBodyAnimation()[poseKey];
}

function getEditableRootOffset(): BodyAnimationRootOffset | undefined {
  if (debugTuning.animationEditMode === "preview") {
    return getAnimationPreviewPose()?.rootOffset;
  }

  const keyframe = getActiveAnimationRootKeyframe();

  return keyframe?.rootOffset;
}

function getEditableAnimationCastProp(): BodyAnimationCastPropTuning | undefined {
  if (debugTuning.selectedBodyAnimation !== "scrollCast") {
    return undefined;
  }

  if (debugTuning.animationEditMode === "preview") {
    return getAnimationPreviewPose()?.castProp ?? defaultBodyAnimationCastProp;
  }

  const keyframe = getActiveAnimationRootKeyframe();

  return keyframe?.castProp ?? defaultBodyAnimationCastProp;
}

function getActiveAnimationRootKeyframe(): BodyAnimationKeyframe | undefined {
  const animation = getSelectedBodyAnimation();
  const keyframes = getAnimationKeyframes(animation);

  if (debugTuning.animationEditMode === "poseA") {
    return keyframes.find((keyframe) => keyframe.id === "pose-a");
  }

  if (debugTuning.animationEditMode === "poseB") {
    return keyframes.find((keyframe) => keyframe.id === "pose-b");
  }

  if (debugTuning.animationEditMode === "keyframe") {
    return getSelectedAnimationKeyframe(animation);
  }

  return undefined;
}

function updateEditableRootOffset(nextRootOffset: BodyAnimationRootOffset): void {
  if (debugTuning.animationEditMode === "preview") {
    updateAnimationPreviewKeyframe({ rootOffset: nextRootOffset });
    return;
  }

  const keyframe = getActiveAnimationRootKeyframe();

  if (!keyframe) {
    return;
  }

  updateAnimationKeyframeById(keyframe.id, { rootOffset: nextRootOffset });
}

function updateEditableRigParts(nextRigParts: Record<RigPartKey, RigPartTuning>): void {
  if (debugTuning.animationEditMode === "keyframe") {
    updateSelectedAnimationKeyframe({ rigParts: nextRigParts });
    return;
  }

  if (debugTuning.animationEditMode === "preview") {
    updateAnimationPreviewKeyframe({ rigParts: nextRigParts });
    return;
  }

  const poseKey = getActiveAnimationRigPoseKey();

  if (!poseKey) {
    return;
  }

  updateSelectedBodyAnimation({ [poseKey]: nextRigParts } as Partial<BodyAnimationTuning>);
}

function updateEditableBodyPartLayers(nextBodyPartLayers: Record<RigPartKey, BodyPartLayerTuning>): void {
  updateActiveBodyPresetTuning({ bodyPartLayers: nextBodyPartLayers });
}

function updateEditableFaceParts(nextFaceParts: Record<FacePartKey, FacePartTuning>): void {
  if (debugTuning.animationEditMode === "keyframe") {
    updateSelectedAnimationKeyframe({ faceParts: nextFaceParts });
    return;
  }

  if (debugTuning.animationEditMode === "preview") {
    updateAnimationPreviewKeyframe({ faceParts: nextFaceParts });
    return;
  }

  const poseKey = getActiveAnimationFacePoseKey();

  if (!poseKey) {
    return;
  }

  updateSelectedBodyAnimation({ [poseKey]: nextFaceParts } as Partial<BodyAnimationTuning>);
}

function updateEditableAnimationPoseParts(
  nextRigParts: Record<RigPartKey, RigPartTuning>,
  nextFaceParts: Record<FacePartKey, FacePartTuning>,
): void {
  if (debugTuning.animationEditMode === "keyframe") {
    updateSelectedAnimationKeyframe({ rigParts: nextRigParts, faceParts: nextFaceParts });
    return;
  }

  if (debugTuning.animationEditMode === "preview") {
    updateAnimationPreviewKeyframe({ rigParts: nextRigParts, faceParts: nextFaceParts });
    return;
  }

  const rigPoseKey = getActiveAnimationRigPoseKey();
  const facePoseKey = getActiveAnimationFacePoseKey();

  if (!rigPoseKey || !facePoseKey) {
    return;
  }

  updateSelectedBodyAnimation({
    [rigPoseKey]: nextRigParts,
    [facePoseKey]: nextFaceParts,
  } as Partial<BodyAnimationTuning>);
}

function createRootRigTuning(rootOffset: BodyAnimationRootOffset | undefined): RigPartTuning {
  return {
    ...defaultRigPartTuning,
    x: rootOffset?.x ?? defaultBodyAnimationRootOffset.x,
    y: rootOffset?.y ?? defaultBodyAnimationRootOffset.y,
  };
}

function createPoseOffsetRigTuning(poseOffset: Pick<RigPartTuning, "x" | "y"> | undefined): RigPartTuning {
  return {
    ...defaultRigPartTuning,
    x: poseOffset?.x ?? defaultRigPartTuning.x,
    y: poseOffset?.y ?? defaultRigPartTuning.y,
  };
}

function getActiveAnimationRigPoseKey(): AnimationRigPoseKey | undefined {
  if (debugTuning.animationEditMode === "poseA") {
    return "base";
  }

  if (debugTuning.animationEditMode === "poseB") {
    return "breath";
  }

  return undefined;
}

function getActiveAnimationFacePoseKey(): AnimationFacePoseKey | undefined {
  if (debugTuning.animationEditMode === "poseA") {
    return "faceBase";
  }

  if (debugTuning.animationEditMode === "poseB") {
    return "faceBreath";
  }

  return undefined;
}

function isRigLimbKey(value: string | undefined): value is RigLimbKey {
  return rigLimbRotateConfigs.some((config) => config.key === value);
}

function isBodyAnimationKey(value: string): value is BodyAnimationKey {
  return BODY_ANIMATION_KEYS.includes(value as BodyAnimationKey);
}

function isAnimationEditMode(value: string | undefined): value is AnimationEditMode {
  return typeof value === "string" && ANIMATION_EDIT_MODES.includes(value as AnimationEditMode);
}

function isCharacterCanvasEditMode(value: string | undefined): value is CharacterCanvasEditMode {
  return typeof value === "string" && CHARACTER_CANVAS_EDIT_MODES.includes(value as CharacterCanvasEditMode);
}

function isBodyArtCanvasMode(): boolean {
  return debugTuning.characterCanvasEditMode === "bodyArt";
}

function isRootCanvasMode(): boolean {
  return debugTuning.characterCanvasEditMode === "root";
}

function isRootPoseTransformMode(): boolean {
  return debugTuning.animationRootTransformMode === "poseOffset";
}

function isAnimationRootTransformMode(value: string | undefined): value is AnimationRootTransformMode {
  return typeof value === "string" && ANIMATION_ROOT_TRANSFORM_MODES.includes(value as AnimationRootTransformMode);
}

function isActionButtonOffsetKey(value: unknown): value is ActionButtonOffsetKey {
  return typeof value === "string" && ACTION_BUTTON_OFFSET_KEYS.includes(value as ActionButtonOffsetKey);
}

function isClassicActionWheelMode(value: unknown): value is ClassicActionWheelMode {
  return typeof value === "string" && CLASSIC_ACTION_WHEEL_MODES.includes(value as ClassicActionWheelMode);
}

function isClassicSlotNumericKey(value: unknown): value is ClassicSlotNumericKey {
  return value === "x" || value === "y" || value === "rotation";
}

function isFacePartKey(value: string | undefined): value is FacePartKey {
  return typeof value === "string" && FACE_PART_KEYS.includes(value as FacePartKey);
}

function isFaceAssetLayerKey(value: string | undefined): value is FaceAssetLayerKey {
  return typeof value === "string" && FACE_ASSET_LAYER_KEYS.includes(value as FaceAssetLayerKey);
}

function isAppearanceLayerKey(value: string | undefined): value is AppearanceLayerKey {
  return typeof value === "string" && APPEARANCE_LAYER_KEYS.includes(value as AppearanceLayerKey);
}

function isEquipmentSlotKey(value: string | undefined): value is EquipmentSlotKey {
  return typeof value === "string" && EQUIPMENT_SLOT_KEYS.includes(value as EquipmentSlotKey);
}

function isHeroEquipmentSlotKey(value: string | undefined): value is HeroEquipmentSlotKey {
  return typeof value === "string" && HERO_EQUIPMENT_SLOT_KEYS.includes(value as HeroEquipmentSlotKey);
}

function getDebugItemIdsForSlot(slotKey: EquipmentSlotKey): HeroItemId[] {
  return [...new Set(ALL_HERO_ITEM_IDS)].filter((itemId) => getDebugHeroItemDefinition(itemId)?.equipmentSlot === slotKey);
}

function compareDebugItemEquipmentOptions(leftItemId: HeroItemId, rightItemId: HeroItemId): number {
  const leftDefinition = getDebugHeroItemDefinition(leftItemId);
  const rightDefinition = getDebugHeroItemDefinition(rightItemId);
  const leftRarity = leftDefinition ? getHeroItemDefinitionRarity(leftDefinition) : "common";
  const rightRarity = rightDefinition ? getHeroItemDefinitionRarity(rightDefinition) : "common";
  const rarityOrder = DEBUG_SHOP_ITEM_RARITY_RANKS[leftRarity] - DEBUG_SHOP_ITEM_RARITY_RANKS[rightRarity];

  if (rarityOrder !== 0) {
    return rarityOrder;
  }

  return (leftDefinition?.name ?? leftItemId).localeCompare(rightDefinition?.name ?? rightItemId);
}

function syncDebugItemEquipmentTypeFilter(select: HTMLSelectElement, slotKey: EquipmentSlotKey): void {
  const options = getDebugItemEquipmentTypeFilterOptions(slotKey);

  if (!options.some((option) => option.value === activeEquipmentTypeFilter)) {
    activeEquipmentTypeFilter = "all";
  }

  select.replaceChildren(...options.map((option) => createDebugItemEquipmentFilterOption(option.value, option.label)));
  select.value = activeEquipmentTypeFilter;
}

function syncDebugItemEquipmentRarityFilter(select: HTMLSelectElement, slotKey: EquipmentSlotKey): void {
  const rarities = getDebugItemEquipmentRarityFilterOptions(slotKey);

  if (activeEquipmentRarityFilter !== "all" && !rarities.includes(activeEquipmentRarityFilter)) {
    activeEquipmentRarityFilter = "all";
  }

  select.replaceChildren(
    createDebugItemEquipmentFilterOption("all", "All rarity"),
    ...rarities.map((rarity) => createDebugItemEquipmentFilterOption(rarity, AUTO_EQUIPMENT_RARITY_LABELS[rarity])),
  );
  select.value = activeEquipmentRarityFilter;
}

function createDebugItemEquipmentFilterOption(value: string, label: string): HTMLOptionElement {
  const option = document.createElement("option");

  option.value = value;
  option.textContent = label;

  return option;
}

function getDebugItemEquipmentTypeFilterOptions(slotKey: EquipmentSlotKey): { value: DebugItemEquipmentTypeFilter; label: string }[] {
  const values = new Set<DebugItemEquipmentTypeFilter>();

  getDebugItemIdsForSlot(slotKey).forEach((itemId) => {
    const type = getDebugItemEquipmentType(getDebugHeroItemDefinition(itemId));

    if (type) {
      values.add(type);
    }
  });

  return [
    { value: "all", label: "All types" },
    ...[...values]
      .sort(compareDebugItemEquipmentTypeFilters)
      .map((value) => ({ value, label: formatDebugItemEquipmentType(value) })),
  ];
}

function getDebugItemEquipmentRarityFilterOptions(slotKey: EquipmentSlotKey): HeroItemRarity[] {
  const rarities = new Set<HeroItemRarity>();

  getDebugItemIdsForSlot(slotKey).forEach((itemId) => {
    const definition = getDebugHeroItemDefinition(itemId);

    if (definition) {
      rarities.add(getHeroItemDefinitionRarity(definition));
    }
  });

  return [...rarities].sort((left, right) => DEBUG_SHOP_ITEM_RARITY_RANKS[left] - DEBUG_SHOP_ITEM_RARITY_RANKS[right]);
}

function getFilteredDebugItemEquipmentIds(slotKey: EquipmentSlotKey): HeroItemId[] {
  return getDebugItemIdsForSlot(slotKey)
    .filter((itemId) => {
      const definition = getDebugHeroItemDefinition(itemId);

      if (!definition) {
        return false;
      }

      const itemType = getDebugItemEquipmentType(definition);
      const rarity = getHeroItemDefinitionRarity(definition);

      return (
        (activeEquipmentTypeFilter === "all" || itemType === activeEquipmentTypeFilter) &&
        (activeEquipmentRarityFilter === "all" || rarity === activeEquipmentRarityFilter)
      );
    })
    .sort(compareDebugItemEquipmentOptions);
}

function createDebugItemEquipmentOption(itemId: HeroItemId | "", definition: HeroItemDefinition | undefined, isSelected: boolean): HTMLButtonElement {
  const option = document.createElement("button");

  option.type = "button";
  option.className = "debug-item-equipment__option";
  option.dataset.itemEquipmentItem = itemId;
  option.setAttribute("role", "option");
  option.setAttribute("aria-selected", isSelected ? "true" : "false");

  if (!definition) {
    option.classList.add("debug-item-equipment__option--fallback");
    option.append(createDebugItemEquipmentIcon(undefined), createDebugItemEquipmentText("slot fallback", [createDebugItemEquipmentBadge("fallback", "fallback")]));
    return option;
  }

  const rarity = getHeroItemDefinitionRarity(definition);
  const itemType = getDebugItemEquipmentType(definition);
  const stat = getDebugItemEquipmentStat(definition);
  const badges = [
    createDebugItemEquipmentBadge(rarity, "rarity"),
    ...(itemType ? [createDebugItemEquipmentBadge(formatDebugItemEquipmentType(itemType), "type")] : []),
    ...(stat ? [createDebugItemEquipmentBadge(stat, "stat")] : []),
    ...getDebugItemEquipmentAvailabilityBadges(definition.id),
    ...getDebugItemEquipmentWarningBadges(definition),
  ];

  option.classList.add(`debug-item-equipment__option--rarity-${rarity}`);

  if (getDebugItemEquipmentWarnings(definition).length > 0) {
    option.classList.add("debug-item-equipment__option--warning");
  }

  option.append(createDebugItemEquipmentIcon(definition.id), createDebugItemEquipmentText(definition.name, badges));

  return option;
}

function createDebugItemEquipmentIcon(itemId: HeroItemId | undefined): HTMLElement {
  const icon = document.createElement("span");

  icon.className = "debug-item-equipment__icon";

  if (!itemId) {
    icon.textContent = "-";
    return icon;
  }

  const image = document.createElement("img");

  image.alt = "";
  image.dataset.itemEquipmentItem = itemId;
  icon.append(image);
  void loadDebugItemEquipmentIcon(itemId, image);

  return icon;
}

async function loadDebugItemEquipmentIcon(itemId: HeroItemId, image: HTMLImageElement): Promise<void> {
  const record = getSelectedGeneratedEquipmentRecord(itemId) ?? getSelectedAutoEquipmentRecord(itemId);
  const url = record ? await resolveEquipmentAssetUrl(record.asset.sourcePath) : undefined;

  if (!url || !image.isConnected || image.dataset.itemEquipmentItem !== itemId) {
    return;
  }

  image.src = url;
}

function createDebugItemEquipmentText(name: string, badges: HTMLElement[]): HTMLElement {
  const body = document.createElement("span");
  const title = document.createElement("span");
  const badgeRow = document.createElement("span");

  body.className = "debug-item-equipment__option-body";
  title.className = "debug-item-equipment__option-name";
  title.textContent = name;
  badgeRow.className = "debug-item-equipment__badges";
  badgeRow.append(...badges);
  body.append(title, badgeRow);

  return body;
}

function createDebugItemEquipmentBadge(text: string, kind: string): HTMLElement {
  const badge = document.createElement("span");

  badge.className = `debug-item-equipment__badge debug-item-equipment__badge--${kind}`;
  badge.textContent = text;

  return badge;
}

function getDebugItemEquipmentAvailabilityBadges(itemId: HeroItemId): HTMLElement[] {
  const record = getSelectedGeneratedEquipmentRecord(itemId);

  if (!record) {
    return getSelectedAutoEquipmentRecord(itemId) ? [] : [createDebugItemEquipmentBadge("asset?", "warning")];
  }

  return [
    ...(record.availability?.shop ? [createDebugItemEquipmentBadge("shop", "availability")] : []),
    ...(record.availability?.enemyPool ? [createDebugItemEquipmentBadge("enemy", "availability")] : []),
    ...(record.availability?.bossUnique ? [createDebugItemEquipmentBadge("boss", "availability")] : []),
  ];
}

function getDebugItemEquipmentWarningBadges(definition: HeroItemDefinition): HTMLElement[] {
  return getDebugItemEquipmentWarnings(definition).map((warning) => createDebugItemEquipmentBadge(warning, "warning"));
}

function getDebugItemEquipmentWarnings(definition: HeroItemDefinition): string[] {
  const expectedType = getExpectedDebugItemEquipmentType(definition);
  const actualType = getDebugItemEquipmentType(definition);

  return expectedType && actualType && expectedType !== actualType ? [`check ${expectedType}`] : [];
}

function getExpectedDebugItemEquipmentType(definition: HeroItemDefinition): DebugItemEquipmentTypeFilter | undefined {
  const text = `${definition.id} ${definition.name}`.toLowerCase();
  const typeHints: readonly DebugItemEquipmentTypeFilter[] = [
    "shuriken",
    "mace",
    "axe",
    "bow",
    "spear",
    "sword",
    "leather",
    "cloth",
    "chain",
    "plate",
  ];

  return typeHints.find((type) => text.includes(type));
}

function getDebugItemEquipmentType(definition: HeroItemDefinition | undefined): DebugItemEquipmentTypeFilter | undefined {
  if (!definition) {
    return undefined;
  }

  return definition.kind === "weapon" ? definition.weaponClass : definition.armorCategory;
}

function getDebugItemEquipmentStat(definition: HeroItemDefinition): string {
  if (definition.kind === "weapon") {
    return `DMG ${definition.damageBonus ?? 0}`;
  }

  return `AR ${definition.armorHp ?? 0}`;
}

function formatDebugItemEquipmentType(type: DebugItemEquipmentTypeFilter): string {
  if (type === "all") {
    return "All types";
  }

  return DEBUG_WEAPON_IMPORT_CLASSES.includes(type as HeroWeaponClass)
    ? DEBUG_WEAPON_IMPORT_CLASS_LABELS[type as HeroWeaponClass]
    : DEBUG_ITEM_EQUIPMENT_ARMOR_CATEGORY_LABELS[type as NonNullable<HeroItemDefinition["armorCategory"]>];
}

function compareDebugItemEquipmentTypeFilters(left: DebugItemEquipmentTypeFilter, right: DebugItemEquipmentTypeFilter): number {
  const order: readonly DebugItemEquipmentTypeFilter[] = ["sword", "axe", "mace", "spear", "bow", "shuriken", "cloth", "leather", "chain", "plate"];

  return order.indexOf(left) - order.indexOf(right);
}

function getDebugHeroItemDefinition(itemId: string | null | undefined): HeroItemDefinition | undefined {
  if (!itemId) {
    return undefined;
  }

  return (
    HERO_ITEM_CATALOG[itemId] ??
    AUTO_EQUIPMENT_ITEM_CATALOG[itemId] ??
    GENERATED_EQUIPMENT_ITEM_RECORDS.find((record) => record.item.id === itemId)?.item
  );
}

function getHeroItemDefinitionRarity(definition: HeroItemDefinition): HeroItemRarity {
  return definition.rarity ?? "common";
}

function clampRigNumericValue(key: RigNumericControlKey, value: number): number {
  if (key === "angle") {
    return clampNumber(value, RIG_PART_ANGLE_MIN, RIG_PART_ANGLE_MAX);
  }

  if (key === "scaleX" || key === "scaleY") {
    return clampNumber(value, 0.1, 3);
  }

  return clampNumber(value, -480, 480);
}

function clampBodyPartLayerNumericValue(key: RigNumericControlKey, value: number): number {
  if (key === "angle") {
    return clampNumber(value, -180, 180);
  }

  if (key === "scaleX" || key === "scaleY") {
    return clampNumber(value, 0.1, 3);
  }

  return clampNumber(value, -480, 480);
}

function clampFaceNumericValue(key: FaceNumericControlKey, value: number): number {
  if (key === "scaleX" || key === "scaleY") {
    return clampNumber(value, 0.1, 3);
  }

  return clampNumber(value, -40, 40);
}

function clampFaceAssetLayerNumericValue(key: FaceAssetLayerNumericControlKey, value: number): number {
  if (key === "angle") {
    return clampNumber(value, -180, 180);
  }

  if (key === "scaleX" || key === "scaleY") {
    return clampNumber(value, 0.1, 3);
  }

  if (key === "y") {
    return clampNumber(value, -120, 40);
  }

  return clampNumber(value, -80, 80);
}

function clampAppearanceLayerNumericValue(key: AppearanceLayerNumericControlKey, value: number): number {
  if (key === "angle") {
    return clampNumber(value, -180, 180);
  }

  if (key === "scaleX" || key === "scaleY") {
    return clampNumber(value, 0.1, 3);
  }

  return clampNumber(value, -160, 160);
}

function clampEquipmentNumericValue(key: EquipmentNumericControlKey, value: number): number {
  if (key === "angle") {
    return clampNumber(value, -180, 180);
  }

  if (key === "scaleX" || key === "scaleY") {
    return clampNumber(value, 0.1, 3);
  }

  return clampNumber(value, -240, 240);
}

function clampAnimationCastPropNumericValue(key: AnimationCastPropNumericControlKey, value: number): number {
  const control = getAnimationCastPropNumericControlConfig(key);

  return clampNumber(value, control.min, control.max);
}

function getAnimationCastPropNumericControlConfig(key: AnimationCastPropNumericControlKey): AnimationCastPropNumericControlConfig {
  return animationCastPropNumericControls.find((control) => control.key === key) ?? { key, label: key, min: -480, max: 480, step: 1 };
}

function formatScrollCastPropAssetLabel(key: ScrollCastPropAssetKey): string {
  return key.replace(/^scroll-/u, "").replace(/-01$/u, "").replace(/-/gu, " ");
}

function isScrollCastPropAssetKey(value: unknown): value is ScrollCastPropAssetKey {
  return typeof value === "string" && SCROLL_CAST_PROP_ASSET_KEYS.includes(value as ScrollCastPropAssetKey);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, blend: number): number {
  return from + (to - from) * blend;
}

function updateAnimationActivePart(partKey: RigPartKey, enabled: boolean): void {
  const animation = getSelectedBodyAnimation();

  updateSelectedBodyAnimation({
    activeParts: {
      ...animation.activeParts,
      [partKey]: enabled,
    },
  });
}

function copyAnimationPoseAToB(): void {
  const animation = getSelectedBodyAnimation();
  const poseA = getAnimationKeyframes(animation).find((keyframe) => keyframe.id === "pose-a");

  updateAnimationKeyframeById("pose-b", {
    rigParts: cloneRigParts(poseA?.rigParts ?? animation.base),
    faceParts: cloneFaceParts(poseA?.faceParts ?? animation.faceBase),
    rootOffset: cloneBodyAnimationRootOffset(poseA?.rootOffset),
    weaponMirrorX: poseA?.weaponMirrorX,
    weaponMirrorY: poseA?.weaponMirrorY,
    castProp: cloneBodyAnimationCastProp(poseA?.castProp),
  });
}

function copyClassicRigToDummyV2(): void {
  if (!window.confirm("Copy Classic rig parts and body animations to Dummy V2? Body Art, face assets, and equipment tuning will stay unchanged.")) {
    return;
  }

  const classicTuning = debugTuning.bodyPresetTuning.classic ?? DEFAULT_BODY_PRESET_TUNING.classic;
  const dummyTuning = debugTuning.bodyPresetTuning["dummy-v2"] ?? DEFAULT_BODY_PRESET_TUNING["dummy-v2"];

  updateDebugTuning({
    bodyPresetTuning: {
      ...debugTuning.bodyPresetTuning,
      "dummy-v2": {
        ...dummyTuning,
        rigParts: cloneRigParts(classicTuning.rigParts),
        bodyAnimations: cloneBodyAnimations(classicTuning.bodyAnimations),
      },
    },
  });
}

function cloneRigParts(source: Record<RigPartKey, RigPartTuning>): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<RigPartKey, RigPartTuning>;
}

function cloneFaceParts(source: Record<FacePartKey, FacePartTuning>): Record<FacePartKey, FacePartTuning> {
  return Object.fromEntries(FACE_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<FacePartKey, FacePartTuning>;
}

function cloneBodyAnimationRootOffset(source: BodyAnimationRootOffset | undefined): BodyAnimationRootOffset {
  return { ...(source ?? defaultBodyAnimationRootOffset) };
}

function cloneBodyAnimationCastProp(source: BodyAnimationCastPropTuning | undefined): BodyAnimationCastPropTuning | undefined {
  return source ? { ...source } : undefined;
}

function shiftRigParts(source: Record<RigPartKey, RigPartTuning>, delta: { x: number; y: number }): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(
    RIG_PART_KEYS.map((key) => [
      key,
      {
        ...source[key],
        x: clampRigNumericValue("x", (source[key]?.x ?? defaultRigPartTuning.x) + delta.x),
        y: clampRigNumericValue("y", (source[key]?.y ?? defaultRigPartTuning.y) + delta.y),
      },
    ]),
  ) as Record<RigPartKey, RigPartTuning>;
}

function cloneBodyAnimations(source: Record<BodyAnimationKey, BodyAnimationTuning>): Record<BodyAnimationKey, BodyAnimationTuning> {
  return Object.fromEntries(BODY_ANIMATION_KEYS.map((key) => [key, cloneBodyAnimation(source[key])])) as Record<
    BodyAnimationKey,
    BodyAnimationTuning
  >;
}

function cloneBodyAnimation(source: BodyAnimationTuning): BodyAnimationTuning {
  return {
    ...source,
    base: cloneRigParts(source.base),
    breath: cloneRigParts(source.breath),
    faceBase: cloneFaceParts(source.faceBase),
    faceBreath: cloneFaceParts(source.faceBreath),
    activeParts: { ...source.activeParts },
    weaponClasses: [...(source.weaponClasses ?? [])],
    variants: source.variants?.map((variant) => ({
      ...cloneBodyAnimation(variant),
      variants: [],
      selectedVariantId: undefined,
    })),
    keyframes: source.keyframes?.map((keyframe) => ({
      ...keyframe,
      rigParts: cloneRigParts(keyframe.rigParts),
      faceParts: cloneFaceParts(keyframe.faceParts),
      rootOffset: cloneBodyAnimationRootOffset(keyframe.rootOffset),
      castProp: cloneBodyAnimationCastProp(keyframe.castProp),
    })),
  };
}

function getActiveBodyPresetTuning(): BodyPresetTuning {
  return debugTuning.bodyPresetTuning[debugTuning.paperDollBodyPreset] ?? DEFAULT_BODY_PRESET_TUNING[debugTuning.paperDollBodyPreset] ?? DEFAULT_BODY_PRESET_TUNING.classic;
}

function updateActiveBodyPresetTuning(patch: Partial<BodyPresetTuning>): void {
  const presetKey = debugTuning.paperDollBodyPreset;
  const current = getActiveBodyPresetTuning();

  updateDebugTuning({
    bodyPresetTuning: {
      ...debugTuning.bodyPresetTuning,
      [presetKey]: {
        ...current,
        ...patch,
      },
    },
  });
}

function updateSelectedBodyAnimation(patch: Partial<BodyAnimationTuning>, debugPatch: Partial<ArenaDebugTuning> = {}): void {
  const key = debugTuning.selectedBodyAnimation;
  const selectedVariantId = debugTuning.selectedBodyAnimationVariantId;
  const presetKey = debugTuning.paperDollBodyPreset;
  const current = getActiveBodyPresetTuning();
  const slot = current.bodyAnimations[key] ?? DEFAULT_BODY_ANIMATIONS[key];
  const nextAnimation =
    selectedVariantId === BODY_ANIMATION_DEFAULT_VARIANT_ID
      ? applyBodyAnimationPatch(slot, patch)
      : {
          ...slot,
          variants: (slot.variants ?? []).map((variant) =>
            variant.variantId === selectedVariantId
              ? applyBodyAnimationPatch(variant, {
                  ...patch,
                  variantId: variant.variantId,
                })
              : variant,
          ),
        };

  updateDebugTuning({
    ...debugPatch,
    bodyPresetTuning: {
      ...debugTuning.bodyPresetTuning,
      [presetKey]: {
        ...current,
        bodyAnimations: {
          ...current.bodyAnimations,
          [key]: nextAnimation,
        },
      },
    },
  });
}

function applyBodyAnimationPatch(source: BodyAnimationTuning, patch: Partial<BodyAnimationTuning>): BodyAnimationTuning {
  const nextPatch = { ...patch };

  if (typeof patch.duration === "number" && Number.isFinite(patch.duration) && patch.keyframes === undefined) {
    const nextDuration = clampNumber(patch.duration, 240, 2400);

    nextPatch.duration = nextDuration;
    nextPatch.keyframes = scaleBodyAnimationKeyframeTimes(source.keyframes, source.duration, nextDuration);
  }

  return {
    ...source,
    ...nextPatch,
  };
}

function scaleBodyAnimationKeyframeTimes(
  keyframes: readonly BodyAnimationKeyframe[] | undefined,
  oldDuration: number,
  newDuration: number,
): BodyAnimationKeyframe[] | undefined {
  if (!keyframes || keyframes.length === 0 || oldDuration <= 0 || oldDuration === newDuration) {
    return keyframes ? [...keyframes] : undefined;
  }

  const scale = newDuration / oldDuration;

  return keyframes.map((keyframe) => ({
    ...keyframe,
    time: keyframe.id === "pose-a" ? 0 : clampNumber(keyframe.time * scale, 0, newDuration),
  }));
}

function getSelectedBodyAnimation(): BodyAnimationTuning {
  return getBodyAnimationVariant(getSelectedBodyAnimationSlot(), debugTuning.selectedBodyAnimationVariantId);
}

function getSelectedBodyAnimationSlot(): BodyAnimationTuning {
  const animations = getActiveBodyPresetTuning().bodyAnimations;

  return animations[debugTuning.selectedBodyAnimation] ?? animations.idle;
}

function getBodyAnimationVariant(slot: BodyAnimationTuning, variantId: string): BodyAnimationTuning {
  if (variantId === BODY_ANIMATION_DEFAULT_VARIANT_ID) {
    return slot;
  }

  return slot.variants?.find((variant) => variant.variantId === variantId) ?? slot;
}

function getBodyAnimationVariantOptions(slot: BodyAnimationTuning): BodyAnimationTuning[] {
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

function selectBodyAnimationVariant(variantId: string): void {
  const slot = getSelectedBodyAnimationSlot();
  const normalizedVariantId = getBodyAnimationVariantOptions(slot).some((variant) => variant.variantId === variantId)
    ? variantId
    : BODY_ANIMATION_DEFAULT_VARIANT_ID;
  const animation = getBodyAnimationVariant(slot, normalizedVariantId);

  updateDebugTuning(
    {
      selectedBodyAnimationVariantId: normalizedVariantId,
      selectedAnimationKeyframeId: normalizeAnimationKeyframeSelection(animation, debugTuning.selectedAnimationKeyframeId),
      animationEditMode: "keyframe",
    },
    { undoable: false },
  );
}

function createBodyAnimationVariant(): void {
  const slot = getSelectedBodyAnimationSlot();
  const source = getBodyAnimationVariant(slot, debugTuning.selectedBodyAnimationVariantId);
  const variantId = createUniqueBodyAnimationVariantId(slot, `${debugTuning.selectedBodyAnimation}${(slot.variants?.length ?? 0) + 2}`);
  const variant = createBodyAnimationVariantFromSource(source, variantId);

  updateBodyAnimationSlot({
    ...slot,
    selectedVariantId: variantId,
    variants: [...(slot.variants ?? []), variant],
  }, {
    selectedBodyAnimationVariantId: variantId,
    selectedAnimationKeyframeId: normalizeAnimationKeyframeSelection(variant, debugTuning.selectedAnimationKeyframeId),
    animationEditMode: "keyframe",
  });
}

function duplicateSelectedBodyAnimationVariant(): void {
  createBodyAnimationVariant();
}

function deleteSelectedBodyAnimationVariant(): void {
  const selectedVariantId = debugTuning.selectedBodyAnimationVariantId;

  if (selectedVariantId === BODY_ANIMATION_DEFAULT_VARIANT_ID) {
    return;
  }

  const slot = getSelectedBodyAnimationSlot();

  updateBodyAnimationSlot({
    ...slot,
    selectedVariantId: BODY_ANIMATION_DEFAULT_VARIANT_ID,
    variants: (slot.variants ?? []).filter((variant) => variant.variantId !== selectedVariantId),
  }, {
    selectedBodyAnimationVariantId: BODY_ANIMATION_DEFAULT_VARIANT_ID,
    selectedAnimationKeyframeId: normalizeAnimationKeyframeSelection(slot, debugTuning.selectedAnimationKeyframeId),
    animationEditMode: "keyframe",
  });
}

function updateSelectedBodyAnimationVariantMeta(patch: Pick<
  Partial<BodyAnimationTuning>,
  "variantWeight" | "appliesToAllWeapons" | "weaponClasses"
>): void {
  updateSelectedBodyAnimation(patch);
}

function updateBodyAnimationSlot(slot: BodyAnimationTuning, debugPatch: Partial<ArenaDebugTuning>): void {
  const key = debugTuning.selectedBodyAnimation;
  const presetKey = debugTuning.paperDollBodyPreset;
  const current = getActiveBodyPresetTuning();

  updateDebugTuning({
    ...debugPatch,
    bodyPresetTuning: {
      ...debugTuning.bodyPresetTuning,
      [presetKey]: {
        ...current,
        bodyAnimations: {
          ...current.bodyAnimations,
          [key]: slot,
        },
      },
    },
  });
}

function createBodyAnimationVariantFromSource(source: BodyAnimationTuning, variantId: string): BodyAnimationTuning {
  return {
    ...cloneBodyAnimation(source),
    variantId,
    variantLabel: variantId,
    variantWeight: source.variantWeight ?? 1,
    appliesToAllWeapons: source.appliesToAllWeapons ?? true,
    weaponClasses: [...(source.weaponClasses ?? [])],
    selectedVariantId: undefined,
    variants: [],
  };
}

function createUniqueBodyAnimationVariantId(slot: BodyAnimationTuning, prefix: string): string {
  const usedIds = new Set(getBodyAnimationVariantOptions(slot).map((variant) => variant.variantId ?? BODY_ANIMATION_DEFAULT_VARIANT_ID));
  let candidate = sanitizeBodyAnimationVariantId(prefix);
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${sanitizeBodyAnimationVariantId(prefix)}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function sanitizeBodyAnimationVariantId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 48) || "variant";
}

function normalizeAnimationKeyframeSelection(animation: BodyAnimationTuning, requestedId: string): string {
  const keyframes = animation.keyframes ?? [];

  return keyframes.some((keyframe) => keyframe.id === requestedId) ? requestedId : keyframes[0]?.id ?? "pose-a";
}

function createAnimationActiveParts(enabled: boolean): Record<RigPartKey, boolean> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, enabled])) as Record<RigPartKey, boolean>;
}

function getSelectedRigPartsForBulkAction(): RigPartKey[] {
  return debugTuning.selectedRigParts.length > 0 ? debugTuning.selectedRigParts : [debugTuning.selectedRigPart];
}

function mountDebugGrid(): void {
  const battleScreen = document.querySelector<HTMLElement>(".battle-screen");

  if (!battleScreen || battleScreen.querySelector(".debug-grid")) {
    return;
  }

  const grid = document.createElement("div");
  grid.className = "debug-grid";
  grid.setAttribute("aria-hidden", "true");
  grid.innerHTML = `
    <div class="debug-grid__center-x"></div>
    <div class="debug-grid__center-y"></div>
    <div class="debug-grid__origin">0,0</div>
  `;
  battleScreen.append(grid);
}

function syncDebugTools(panel: HTMLElement): void {
  syncModeTabs(panel);
  syncInputs();
  syncPreviewToolbar(panel);
  syncRigEditor(panel);
  syncFaceEditor(panel);
  syncFaceAssetEditor(panel);
  syncEquipmentEditor(panel);
  syncArenaBackgroundEditor(panel);
  syncEffectsEditor(panel);
  syncClassicActionButtonEditor(panel);
  syncBossEditor(panel);
  syncAnimationEditor(panel);
  syncGrid();
}

function syncArenaBackgroundEditor(panel: HTMLElement): void {
  const editor = panel.querySelector<HTMLElement>(".debug-arena-bg-editor");

  if (!editor) {
    return;
  }
  const selectedLayer = getSelectedArenaBackgroundEditLayer();
  const selectedVariantId = getArenaBackgroundEditVariantId();

  const previewTier = editor.querySelector<HTMLInputElement>("[data-arena-bg-preview-tier]");
  if (previewTier) {
    previewTier.value = `${debugTuning.arenaBackgroundPreviewTier}`;
  }

  const variantSelect = editor.querySelector<HTMLSelectElement>("[data-arena-bg-preview-variant]");
  if (variantSelect) {
    syncArenaBackgroundVariantSelectOptions(variantSelect, getArenaBackgroundEditTierId());
    variantSelect.value = selectedVariantId;
  }

  const layerSelect = editor.querySelector<HTMLSelectElement>('select[data-debug-select-key="arenaBackgroundEditLayer"]');
  if (layerSelect) {
    syncArenaBackgroundLayerSelectOptions(layerSelect, getArenaBackgroundEditTierId(), selectedVariantId);
    layerSelect.value = selectedLayer;
  }

  editor.querySelectorAll<HTMLElement>("[data-arena-bg-layout-row]").forEach((row) => {
    const field = row.dataset.arenaBgLayoutRow;

    row.hidden = isArenaBackgroundLayoutField(field) && !isArenaBackgroundLayoutFieldSupported(selectedLayer, field);
  });

  editor.querySelectorAll<HTMLInputElement>("[data-arena-bg-field]").forEach((input) => {
    const field = input.dataset.arenaBgField;

    if (!isArenaBackgroundLayoutField(field)) {
      return;
    }

    const value = getArenaBackgroundLayerLayoutValue(getArenaBackgroundEditTierId(), selectedLayer, field);

    if (input.type === "checkbox") {
      input.checked = Boolean(value);
      return;
    }

    input.value = formatDebugNumberInputValue(typeof value === "number" ? value : Number(value));
  });

  syncArenaBackgroundParallaxValues(editor);
  syncArenaBackgroundParallaxControls(editor);

  const resetTier = editor.querySelector<HTMLButtonElement>(".debug-arena-bg-editor__reset-tier");
  if (resetTier) {
    resetTier.textContent = `Reset tier ${getArenaBackgroundEditTierId()} BG`;
  }
}

function syncArenaBackgroundParallaxValues(editor: HTMLElement): void {
  const layer = getSelectedArenaParallaxLayer();

  editor.querySelectorAll<HTMLInputElement>("[data-arena-parallax-field]").forEach((input) => {
    const field = input.dataset.arenaParallaxField;

    if (!isArenaParallaxField(field) || !isArenaParallaxFieldSupported(layer, field)) {
      return;
    }

    input.value = formatDebugNumberInputValue(getArenaParallaxValue(getArenaBackgroundEditTierId(), layer, field));
  });
}

function syncArenaBackgroundParallaxControls(editor: HTMLElement): void {
  const selectedLayer = getSelectedArenaParallaxLayer();
  const select = editor.querySelector<HTMLSelectElement>("[data-arena-parallax-layer-select]");
  arenaParallaxEditorLayer = selectedLayer;

  if (select) {
    syncArenaParallaxLayerSelectOptions(select, getArenaBackgroundEditTierId());
    select.value = selectedLayer;
  }

  editor.querySelectorAll<HTMLElement>("[data-arena-parallax-row]").forEach((row) => {
    row.hidden = row.dataset.arenaParallaxRow !== getArenaBackgroundLayerRole(selectedLayer);
  });
}

function syncArenaBackgroundVariantSelectOptions(select: HTMLSelectElement, tierId: ArenaBackgroundEditTierId): void {
  const variants = getArenaBackgroundVariantOptionsForTier(tierId);
  const signature = variants.join("|");

  if (select.dataset.arenaBgVariantSignature === signature) {
    return;
  }

  select.innerHTML = variants.map((variantId) => `<option value="${variantId}">${formatArenaBackgroundVariantLabel(variantId)}</option>`).join("");
  select.dataset.arenaBgVariantSignature = signature;
}

function syncArenaBackgroundLayerSelectOptions(select: HTMLSelectElement, tierId: ArenaBackgroundEditTierId, variantId = getArenaBackgroundEditVariantIdForTier(tierId)): void {
  const layers = getArenaBackgroundEditLayersForTier(tierId, variantId);
  const signature = `${variantId}:${layers.join("|")}`;

  if (select.dataset.arenaBgLayerSignature === signature) {
    return;
  }

  select.innerHTML = layers.map((layer) => `<option value="${layer}">${formatArenaBackgroundLayerLabel(layer)}</option>`).join("");
  select.dataset.arenaBgLayerSignature = signature;
}

function syncArenaParallaxLayerSelectOptions(select: HTMLSelectElement, tierId: ArenaBackgroundEditTierId): void {
  const layers = getArenaParallaxLayersForTier(tierId);
  const signature = layers.join("|");

  if (select.dataset.arenaParallaxLayerSignature === signature) {
    return;
  }

  select.innerHTML = layers.map((layer) => `<option value="${layer}">${formatArenaParallaxLayerLabel(layer)}</option>`).join("");
  select.dataset.arenaParallaxLayerSignature = signature;
}

function formatDebugNumberInputValue(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return Number.isInteger(safeValue) ? `${safeValue}` : safeValue.toFixed(2);
}

function syncPreviewToolbar(panel: HTMLElement): void {
  const activeMode: CharacterPreviewControlMode = debugTuning.characterCanvasEditMode === "face" ? "face" : "body";

  panel.querySelectorAll<HTMLElement>("[data-character-preview-mode]").forEach((row) => {
    row.hidden = row.dataset.characterPreviewMode !== activeMode;
  });
}

function syncAutoEquipmentEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__select");
  const nameInput = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__name");
  const raritySelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__rarity");
  const statLabel = editor.querySelector<HTMLElement>(".debug-auto-equipment__stat-label");
  const armorRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor]");
  const armorNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor-number]");
  const priceRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price]");
  const priceNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price-number]");
  const addToShop = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__shop");
  const enemyPool = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__enemy-pool");
  const bossUnique = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__boss-unique");
  const shopLabel = editor.querySelector<HTMLElement>(".debug-auto-equipment__shop-label");
  const buttons = editor.querySelectorAll<HTMLButtonElement>(".debug-auto-equipment__preview, .debug-auto-equipment__promote");
  const generatedSelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__generated-select");
  const removeGenerated = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__remove");
  const setRaritySelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__set-rarity");
  const setRename = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__set-rename");
  const setPromote = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__set-promote");
  const weaponPromote = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__weapon-promote");
  const shieldPromote = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__shield-promote");
  const status = editor.querySelector<HTMLElement>(".debug-auto-equipment__status");
  const record = getSelectedAutoEquipmentRecord(select?.value);
  const isAvailable = Boolean(record);
  const removableGeneratedItems = getRemovableGeneratedEquipmentItems();
  const selectedGeneratedItem = getSelectedRemovableGeneratedEquipmentItem(removableGeneratedItems, generatedSelect?.value);
  const hasGeneratedItems = removableGeneratedItems.length > 0;

  if (record && isEquipmentSlotKey(record.item.equipmentSlot)) {
    activeEquipmentSlot = record.item.equipmentSlot;
    activeEquipmentItemId = record.item.id;
    const panel = editor.closest(".debug-panel") as HTMLElement | null;

    syncEquipmentEditor(panel ?? editor);
  }

  if (select) {
    select.disabled = AUTO_EQUIPMENT_ITEM_RECORDS.length === 0;
  }

  if (nameInput) {
    nameInput.value = record?.item.name.replace(/\s+\(Auto\)$/u, "") ?? "";
    nameInput.disabled = !isAvailable;
  }

  if (raritySelect) {
    const rarity = getDefaultAutoEquipmentRarity(record);

    raritySelect.value = rarity;
    raritySelect.disabled = !isAvailable;
    setDebugRarityDataset(raritySelect, isAvailable ? rarity : undefined);
  }

  if (statLabel) {
    statLabel.textContent = record?.item.kind === "weapon" ? "Damage" : "Armor HP";
  }

  if (armorRange && armorNumber) {
    setLinkedNumberInputBounds(armorRange, armorNumber, AUTO_EQUIPMENT_STAT_MIN, getAutoEquipmentStatMax(record));
  }

  if (priceRange && priceNumber) {
    setLinkedNumberInputBounds(priceRange, priceNumber, 0, AUTO_EQUIPMENT_PRICE_MAX);
  }

  if (shopLabel) {
    shopLabel.textContent = record?.item.kind === "weapon" ? "Weapon shop" : "Armory";
  }

  if (addToShop) {
    addToShop.checked = isAvailable;
  }

  if (enemyPool) {
    enemyPool.checked = false;
  }

  if (bossUnique) {
    bossUnique.checked = false;
  }

  [armorRange, armorNumber, addToShop, enemyPool, bossUnique].forEach((input) => {
    if (input) {
      input.disabled = !isAvailable;
    }
  });

  syncAutoEquipmentAvailabilityControls(editor);

  buttons.forEach((button) => {
    button.disabled = !isAvailable;
  });

  if (generatedSelect) {
    generatedSelect.disabled = !hasGeneratedItems;
    setDebugRarityDataset(generatedSelect, selectedGeneratedItem?.rarity);
  }

  if (removeGenerated) {
    removeGenerated.disabled = !hasGeneratedItems;
  }

  if (setRaritySelect) {
    setRaritySelect.value = getDebugItemRarity(setRaritySelect.value, "common");
    setDebugRarityDataset(setRaritySelect, setRaritySelect.value as HeroItemRarity);
  }

  syncEquipmentSetImportAvailabilityControls(editor);

  if (setRename) {
    setRename.disabled = getEquipmentSetImportAssets().length === 0;
  }

  if (setPromote) {
    setPromote.disabled = getEquipmentSetImportAssets().length === 0;
  }

  if (weaponPromote) {
    weaponPromote.disabled = getWeaponImportAssets().length === 0;
  }

  if (shieldPromote) {
    shieldPromote.disabled = getShieldImportAssets().length === 0;
  }

  if (status) {
    status.textContent = isAvailable
      ? `${record?.asset.sourcePath ?? ""}`
      : AUTO_EQUIPMENT_ITEM_RECORDS.length === 0
        ? "No unpromoted equipment assets found."
        : "Using fallback preview.";
  }
}

function syncEquipmentSetImportAvailabilityControls(editor: HTMLElement): void {
  const raritySelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__set-rarity");
  const setShop = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__set-shop");
  const setEnemyPool = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__set-enemy-pool");
  const setBossUnique = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__set-boss-unique");
  const hasRawAssets = getEquipmentSetImportAssets().length > 0;
  const isBossUnique = setBossUnique?.checked === true;

  if (isBossUnique && raritySelect) {
    raritySelect.value = "unique";
    setDebugRarityDataset(raritySelect, "unique");
  } else if (raritySelect) {
    setDebugRarityDataset(raritySelect, getDebugItemRarity(raritySelect.value, "common"));
  }

  if (raritySelect) {
    raritySelect.disabled = !hasRawAssets || isBossUnique;
  }

  if (setShop) {
    setShop.disabled = !hasRawAssets || isBossUnique;
  }

  if (setEnemyPool) {
    setEnemyPool.disabled = !hasRawAssets || isBossUnique;
  }

  if (setBossUnique) {
    setBossUnique.disabled = !hasRawAssets;
  }
}

function syncAutoEquipmentAvailabilityControls(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__select");
  const raritySelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__rarity");
  const priceRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price]");
  const priceNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price-number]");
  const addToShop = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__shop");
  const enemyPool = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__enemy-pool");
  const bossUnique = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__boss-unique");
  const isAvailable = Boolean(getSelectedAutoEquipmentRecord(select?.value));
  const isBossUnique = bossUnique?.checked === true;
  const isShopItem = addToShop?.checked === true && !isBossUnique;

  if (isBossUnique && raritySelect) {
    raritySelect.value = "unique";
    setDebugRarityDataset(raritySelect, "unique");
  } else if (raritySelect) {
    setDebugRarityDataset(raritySelect, getDebugItemRarity(raritySelect.value, "common"));
  }

  if (raritySelect) {
    raritySelect.disabled = !isAvailable || isBossUnique;
  }

  if (addToShop) {
    addToShop.disabled = !isAvailable || isBossUnique;
  }

  if (enemyPool) {
    enemyPool.disabled = !isAvailable || isBossUnique;
  }

  if (priceRange && priceNumber) {
    priceRange.disabled = !isAvailable || !isShopItem;
    priceNumber.disabled = !isAvailable || !isShopItem;

    if (!isShopItem) {
      priceRange.value = "0";
      priceNumber.value = "0";
    }
  }
}

function syncBossEditor(panel: HTMLElement): void {
  const editor = panel.querySelector<HTMLElement>(".debug-boss-editor");

  if (!editor) {
    return;
  }

  syncBossLootSummary(editor);
}

function formatArenaTierDifficultyEditor(difficultyId: ArenaDifficultyId): string {
  return `
    <fieldset class="debug-tier-editor__difficulty" data-tier-difficulty="${difficultyId}">
      <legend>${DEBUG_ARENA_TIER_DIFFICULTY_LABELS[difficultyId]}</legend>
      <label class="debug-rig-editor__part">
        <span>Opponent ID</span>
        <input class="debug-tier-editor__opponent-id" type="text" />
      </label>
      <label class="debug-panel__toggle">
        <input class="debug-tier-editor__fixed-stats" type="checkbox" />
        <span>Fixed stats</span>
      </label>
      <div class="debug-tier-editor__stats">
        ${formatArenaTierNumberInput("STR", "stat", "strength", 0, DEBUG_BOSS_STAT_MAX, 1, "strength")}
        ${formatArenaTierNumberInput("AGI", "stat", "agility", 0, DEBUG_BOSS_STAT_MAX, 1, "agility")}
        ${formatArenaTierNumberInput("VIT", "stat", "vitality", 0, DEBUG_BOSS_STAT_MAX, 1, "vitality")}
        ${formatArenaTierNumberInput("Random points", "random-points", "", 0, DEBUG_BOSS_STAT_MAX, 1, "random-points")}
      </div>
      <div class="debug-tier-editor__rewards">
        ${formatArenaTierNumberInput("Win gold", "reward", "win-gold", 0, DEBUG_BOSS_REWARD_MAX, 1)}
        ${formatArenaTierNumberInput("Win XP", "reward", "win-xp", 0, DEBUG_BOSS_REWARD_MAX, 1)}
        ${formatArenaTierNumberInput("Loss gold", "reward", "loss-gold", 0, DEBUG_BOSS_REWARD_MAX, 1)}
        ${formatArenaTierNumberInput("Loss XP", "reward", "loss-xp", 0, DEBUG_BOSS_REWARD_MAX, 1)}
      </div>
      <div class="debug-tier-editor__pools">
        <span class="debug-tier-editor__pool-title">Equipment roll chances by rarity</span>
        ${formatArenaTierEquipmentPoolGrid()}
      </div>
    </fieldset>
  `;
}

function formatArenaTierEquipmentPoolGrid(): string {
  return `
    <div class="debug-tier-editor__pool-grid">
      <span class="debug-tier-editor__pool-header debug-tier-editor__pool-header--rarity">Rarity</span>
      ${DEBUG_ARENA_TIER_POOL_CHANCE_FIELDS.map(
        (field) => `<span class="debug-tier-editor__pool-header">${formatArenaTierIcon(field.icon)}<span>${field.label}</span></span>`,
      ).join("")}
      ${DEBUG_ARENA_TIER_RARITIES.map((rarity) => formatArenaTierEquipmentPoolRow(rarity)).join("")}
    </div>
  `;
}

function formatArenaTierEquipmentPoolRow(rarity: HeroItemRarity): string {
  return `
    <span class="debug-tier-editor__pool-rarity debug-tier-editor__pool-rarity--${rarity}" data-tier-pool-rarity="${rarity}">${AUTO_EQUIPMENT_RARITY_LABELS[rarity]}</span>
    ${DEBUG_ARENA_TIER_POOL_CHANCE_FIELDS.map((field) => formatArenaTierPoolChanceInput(rarity, field)).join("")}
  `;
}

function formatArenaTierPoolChanceInput(rarity: HeroItemRarity, field: (typeof DEBUG_ARENA_TIER_POOL_CHANCE_FIELDS)[number]): string {
  const label = `${AUTO_EQUIPMENT_RARITY_LABELS[rarity]} ${field.label}`;

  return `
    <label class="debug-tier-editor__pool-cell debug-tier-editor__pool-cell--${rarity}">
      <input class="debug-panel__number debug-tier-editor__pool-input" type="number" min="0" max="1" step="0.01" value="0" aria-label="${label}" data-tier-pool-chance="${getArenaTierPoolChanceKey(rarity, field.key)}" />
    </label>
  `;
}

function formatArenaTierIcon(icon: DebugArenaTierIconKey): string {
  return `<span class="debug-tier-editor__icon debug-tier-editor__icon--${icon}" aria-hidden="true"></span>`;
}

function formatArenaTierFieldLabel(label: string, icon?: DebugArenaTierIconKey): string {
  return `
    <span class="debug-tier-editor__field-label">
      ${icon ? formatArenaTierIcon(icon) : ""}
      <span class="debug-tier-editor__field-label-text">${label}</span>
    </span>
  `;
}

function formatArenaTierNumberInput(
  label: string,
  kind: "stat" | "random-points" | "reward",
  key: string,
  min: number,
  max: number,
  step: number,
  icon?: DebugArenaTierIconKey,
): string {
  const dataAttribute =
    kind === "stat"
      ? `data-tier-stat="${key}"`
      : kind === "reward"
        ? `data-tier-reward="${key}"`
        : "data-tier-random-points";

  return `
    <label class="debug-panel__row debug-rig-editor__row">
      ${formatArenaTierFieldLabel(label, icon)}
      <input class="debug-panel__number" type="number" min="${min}" max="${max}" step="${step}" value="${min}" ${dataAttribute} />
    </label>
  `;
}

function syncArenaTierSelectOptions(select: HTMLSelectElement, selectedTierId: number | undefined): void {
  select.replaceChildren(createHeroEquipmentOption("", "new tier"));

  debugArenaTiers.forEach((tier) => {
    select.append(createHeroEquipmentOption(`${tier.id}`, `${tier.id} | ${tier.name}`));
  });

  select.value = selectedTierId && debugArenaTiers.some((tier) => tier.id === selectedTierId) ? `${selectedTierId}` : "";
}

function syncArenaTierUnlockOptions(select: HTMLSelectElement, selectedBossId: string | undefined): void {
  select.replaceChildren(createHeroEquipmentOption("", "always unlocked"));

  debugArenaBosses.forEach((boss) => {
    select.append(createHeroEquipmentOption(boss.id, `${boss.tierId} | ${boss.name}`));
  });

  select.value = selectedBossId && debugArenaBosses.some((boss) => boss.id === selectedBossId) ? selectedBossId : "";
}

function applyArenaTierToEditor(editor: HTMLElement, tier: ArenaTierConfig): void {
  const idInput = editor.querySelector<HTMLInputElement>(".debug-tier-editor__id");
  const nameInput = editor.querySelector<HTMLInputElement>(".debug-tier-editor__name");
  const unlockSelect = editor.querySelector<HTMLSelectElement>(".debug-tier-editor__unlock");

  if (idInput) {
    idInput.value = `${tier.id}`;
  }

  if (nameInput) {
    nameInput.value = tier.name;
  }

  if (unlockSelect) {
    syncArenaTierUnlockOptions(unlockSelect, tier.unlockBossId);
  }

  ARENA_DIFFICULTY_IDS.forEach((difficultyId) => {
    applyArenaTierOpponentToEditor(
      editor,
      difficultyId,
      tier.opponents.find((opponent) => opponent.difficultyId === difficultyId) ?? createDefaultArenaTierOpponentDraft(tier.id, difficultyId),
    );
  });

  syncArenaTierBossSummary(editor);
}

function applyArenaTierOpponentToEditor(editor: HTMLElement, difficultyId: ArenaDifficultyId, opponent: ArenaTierOpponentDefinition): void {
  const fieldset = getArenaTierDifficultyFieldset(editor, difficultyId);

  if (!fieldset) {
    return;
  }

  const idInput = fieldset.querySelector<HTMLInputElement>(".debug-tier-editor__opponent-id");
  const fixedStatsInput = fieldset.querySelector<HTMLInputElement>(".debug-tier-editor__fixed-stats");
  const baseStats = opponent.baseStats ?? { strength: 0, agility: 0, vitality: 0 };

  if (idInput) {
    idInput.value = opponent.id;
  }

  if (fixedStatsInput) {
    fixedStatsInput.checked = Boolean(opponent.baseStats);
  }

  setArenaTierNumberInput(fieldset, `[data-tier-stat="strength"]`, baseStats.strength);
  setArenaTierNumberInput(fieldset, `[data-tier-stat="agility"]`, baseStats.agility);
  setArenaTierNumberInput(fieldset, `[data-tier-stat="vitality"]`, baseStats.vitality);
  setArenaTierNumberInput(fieldset, "[data-tier-random-points]", opponent.randomBaseStatPoints ?? 0);
  setArenaTierNumberInput(fieldset, `[data-tier-reward="win-gold"]`, opponent.rewards.win.gold);
  setArenaTierNumberInput(fieldset, `[data-tier-reward="win-xp"]`, opponent.rewards.win.xp);
  setArenaTierNumberInput(fieldset, `[data-tier-reward="loss-gold"]`, opponent.rewards.loss.gold);
  setArenaTierNumberInput(fieldset, `[data-tier-reward="loss-xp"]`, opponent.rewards.loss.xp);

  DEBUG_ARENA_TIER_RARITIES.forEach((rarity) => {
    const pool = opponent.equipmentPools.find((candidate) => candidate.itemRarities.includes(rarity));

    setArenaTierPoolChanceInput(fieldset, rarity, "rollChance", pool?.rollChance ?? 0);
    setArenaTierPoolChanceInput(fieldset, rarity, "weaponChance", pool ? (pool.weaponChance ?? pool.rollChance) : 0);
    setArenaTierPoolChanceInput(fieldset, rarity, "bowChance", pool ? (pool.bowChance ?? pool.rollChance) : 0);
    setArenaTierPoolChanceInput(fieldset, rarity, "shieldChance", pool ? (pool.shieldChance ?? pool.rollChance) : 0);
    setArenaTierPoolChanceInput(fieldset, rarity, "shurikenChance", pool ? (pool.shurikenChance ?? ENEMY_SHURIKEN_ROLL_CHANCE) : 0);
  });
}

function readArenaTierEditorDraft(editor: HTMLElement): ArenaTierConfig {
  const idInput = editor.querySelector<HTMLInputElement>(".debug-tier-editor__id");
  const nameInput = editor.querySelector<HTMLInputElement>(".debug-tier-editor__name");
  const unlockSelect = editor.querySelector<HTMLSelectElement>(".debug-tier-editor__unlock");
  const id = Math.round(clampFiniteNumber(readEditorNumber(idInput, 1), 1, DEBUG_BOSS_TIER_MAX));
  const name = nameInput?.value.trim() || `Dust Arena ${id}`;
  const unlockBossId = unlockSelect?.value.trim() || undefined;

  return {
    id,
    name,
    ...(unlockBossId ? { unlockBossId } : {}),
    opponents: ARENA_DIFFICULTY_IDS.map((difficultyId) => readArenaTierOpponentDraft(editor, id, difficultyId)),
  };
}

function readArenaTierOpponentDraft(editor: HTMLElement, tierId: number, difficultyId: ArenaDifficultyId): ArenaTierOpponentDefinition {
  const fieldset = getArenaTierDifficultyFieldset(editor, difficultyId);
  const fixedStatsInput = fieldset?.querySelector<HTMLInputElement>(".debug-tier-editor__fixed-stats");
  const idInput = fieldset?.querySelector<HTMLInputElement>(".debug-tier-editor__opponent-id");
  const fixedStats = fixedStatsInput?.checked === true;
  const baseStats = {
    strength: readArenaTierInteger(fieldset, `[data-tier-stat="strength"]`, 0, DEBUG_BOSS_STAT_MAX),
    agility: readArenaTierInteger(fieldset, `[data-tier-stat="agility"]`, 0, DEBUG_BOSS_STAT_MAX),
    vitality: readArenaTierInteger(fieldset, `[data-tier-stat="vitality"]`, 0, DEBUG_BOSS_STAT_MAX),
  };
  const randomBaseStatPoints = readArenaTierInteger(fieldset, "[data-tier-random-points]", 0, DEBUG_BOSS_STAT_MAX);

  return {
    id: normalizeDebugIdentifier(idInput?.value || `tier_${tierId}_${difficultyId}`),
    difficultyId,
    ...(fixedStats ? { baseStats } : randomBaseStatPoints > 0 ? { randomBaseStatPoints } : {}),
    equipmentPools: readArenaTierEquipmentPools(fieldset),
    rewards: {
      win: {
        gold: readArenaTierInteger(fieldset, `[data-tier-reward="win-gold"]`, 0, DEBUG_BOSS_REWARD_MAX),
        xp: readArenaTierInteger(fieldset, `[data-tier-reward="win-xp"]`, 0, DEBUG_BOSS_REWARD_MAX),
      },
      loss: {
        gold: readArenaTierInteger(fieldset, `[data-tier-reward="loss-gold"]`, 0, DEBUG_BOSS_REWARD_MAX),
        xp: readArenaTierInteger(fieldset, `[data-tier-reward="loss-xp"]`, 0, DEBUG_BOSS_REWARD_MAX),
      },
    },
  };
}

function readArenaTierEquipmentPools(fieldset: HTMLElement | undefined): ArenaGeneratedEquipmentPool[] {
  if (!fieldset) {
    return [];
  }

  return DEBUG_ARENA_TIER_RARITIES.flatMap((rarity) => {
    const rollChance = readArenaTierPoolChance(fieldset, rarity, "rollChance");
    const weaponChance = readArenaTierPoolChance(fieldset, rarity, "weaponChance");
    const bowChance = readArenaTierPoolChance(fieldset, rarity, "bowChance");
    const shieldChance = readArenaTierPoolChance(fieldset, rarity, "shieldChance");
    const shurikenChance = readArenaTierPoolChance(fieldset, rarity, "shurikenChance");
    const nonShurikenChance = Math.max(rollChance, weaponChance, bowChance, shieldChance);

    if (Math.max(rollChance, weaponChance, bowChance, shieldChance, shurikenChance) <= 0) {
      return [];
    }

    return [
      {
        itemRarities: [rarity],
        rollChance,
        ...(weaponChance !== rollChance ? { weaponChance } : {}),
        ...(bowChance !== rollChance ? { bowChance } : {}),
        ...(shieldChance !== rollChance ? { shieldChance } : {}),
        ...(shurikenChance !== ENEMY_SHURIKEN_ROLL_CHANCE || nonShurikenChance <= 0 ? { shurikenChance } : {}),
      },
    ];
  });
}

function syncArenaTierBossSummary(editor: HTMLElement): void {
  const summary = editor.querySelector<HTMLElement>(".debug-tier-editor__bosses");
  const tierId = Math.round(clampFiniteNumber(readEditorNumber(editor.querySelector<HTMLInputElement>(".debug-tier-editor__id"), 1), 1, DEBUG_BOSS_TIER_MAX));
  const bosses = debugArenaBosses.filter((boss) => boss.tierId === tierId);

  if (summary) {
    summary.textContent = bosses.length > 0 ? `Bosses: ${bosses.map((boss) => boss.name).join(", ")}` : "Bosses: none for this tier.";
  }
}

function getArenaTierDifficultyFieldset(editor: HTMLElement, difficultyId: ArenaDifficultyId): HTMLElement | undefined {
  return editor.querySelector<HTMLElement>(`[data-tier-difficulty="${difficultyId}"]`) ?? undefined;
}

function setArenaTierNumberInput(root: HTMLElement, selector: string, value: number): void {
  const input = root.querySelector<HTMLInputElement>(selector);

  if (input) {
    input.value = `${value}`;
  }
}

function setArenaTierPoolChanceInput(root: HTMLElement, rarity: HeroItemRarity, key: ArenaTierPoolChanceKey, value: number): void {
  setArenaTierNumberInput(root, getArenaTierPoolChanceSelector(rarity, key), value);
}

function readArenaTierPoolChance(root: HTMLElement | undefined, rarity: HeroItemRarity, key: ArenaTierPoolChanceKey): number {
  return readArenaTierNumber(root, getArenaTierPoolChanceSelector(rarity, key), 0, 1);
}

function getArenaTierPoolChanceSelector(rarity: HeroItemRarity, key: ArenaTierPoolChanceKey): string {
  return `[data-tier-pool-chance="${getArenaTierPoolChanceKey(rarity, key)}"]`;
}

function getArenaTierPoolChanceKey(rarity: HeroItemRarity, key: ArenaTierPoolChanceKey): string {
  return `${rarity}:${key}`;
}

function readArenaTierInteger(root: HTMLElement | undefined, selector: string, min: number, max: number): number {
  return Math.round(readArenaTierNumber(root, selector, min, max));
}

function readArenaTierNumber(root: HTMLElement | undefined, selector: string, min: number, max: number): number {
  return clampFiniteNumber(readEditorNumber(root?.querySelector<HTMLInputElement>(selector), min), min, max);
}

function readEditorNumber(input: HTMLInputElement | null | undefined, fallback: number): number {
  const value = Number(input?.value);

  return Number.isFinite(value) ? value : fallback;
}

function clampFiniteNumber(value: number, min: number, max: number): number {
  return clampNumber(Number.isFinite(value) ? value : min, min, max);
}

function getSelectedArenaTier(tierId: number | undefined): ArenaTierConfig | undefined {
  return debugArenaTiers.find((tier) => tier.id === tierId);
}

function createDefaultArenaTierDraft(): ArenaTierConfig {
  const nextId = Math.min(DEBUG_BOSS_TIER_MAX, Math.max(1, ...debugArenaTiers.map((tier) => tier.id)) + 1);
  const unlockBossId = debugArenaBosses.find((boss) => boss.tierId === nextId - 1)?.id;

  return {
    id: nextId,
    name: `Dust Arena ${nextId}`,
    ...(unlockBossId ? { unlockBossId } : {}),
    opponents: ARENA_DIFFICULTY_IDS.map((difficultyId) => createDefaultArenaTierOpponentDraft(nextId, difficultyId)),
  };
}

function createDefaultArenaTierOpponentDraft(tierId: number, difficultyId: ArenaDifficultyId): ArenaTierOpponentDefinition {
  const defaults = getDefaultArenaTierDifficultyDefaults(tierId, difficultyId);

  return {
    id: `dust_arena_${tierId}_${difficultyId}`,
    difficultyId,
    randomBaseStatPoints: defaults.randomBaseStatPoints,
    equipmentPools: defaults.equipmentPools,
    rewards: {
      win: {
        gold: defaults.gold,
        xp: defaults.xp,
      },
      loss: { gold: 1, xp: 1 },
    },
  };
}

function getDefaultArenaTierDifficultyDefaults(tierId: number, difficultyId: ArenaDifficultyId): DebugArenaTierDifficultyDefaults {
  if (tierId === 2) {
    if (difficultyId === "easy") {
      return {
        gold: 25,
        xp: 15,
        randomBaseStatPoints: 3,
        equipmentPools: [{ itemRarities: ["common"], rollChance: 0.75 }, { itemRarities: ["uncommon"], rollChance: 0.1 }],
      };
    }

    if (difficultyId === "medium") {
      return {
        gold: 35,
        xp: 22,
        randomBaseStatPoints: 6,
        equipmentPools: [{ itemRarities: ["common"], rollChance: 0.85 }, { itemRarities: ["uncommon"], rollChance: 0.35 }],
      };
    }

    return {
      gold: 50,
      xp: 32,
      randomBaseStatPoints: 9,
      equipmentPools: [{ itemRarities: ["common"], rollChance: 0.95 }, { itemRarities: ["uncommon"], rollChance: 0.65 }],
    };
  }

  const tierScale = Math.max(1, tierId);
  const difficultyScale = difficultyId === "easy" ? 1 : difficultyId === "medium" ? 2 : 3;
  const equipmentPools: ArenaGeneratedEquipmentPool[] = [
    { itemRarities: ["common" as HeroItemRarity], rollChance: Math.min(1, 0.55 + tierScale * 0.08 + difficultyScale * 0.05) },
    { itemRarities: ["uncommon" as HeroItemRarity], rollChance: Math.min(1, Math.max(0, (tierScale - 1) * 0.2 + (difficultyScale - 1) * 0.1)) },
  ].filter((pool) => pool.rollChance > 0);

  return {
    gold: 10 * tierScale + 5 * difficultyScale,
    xp: 6 * tierScale + 4 * difficultyScale,
    randomBaseStatPoints: Math.max(0, (tierScale - 1) * 3 + (difficultyScale - 1) * 3),
    equipmentPools,
  };
}

function cloneArenaTierConfig(tier: ArenaTierConfig): ArenaTierConfig {
  return {
    ...tier,
    opponents: tier.opponents.map((opponent) => ({
      ...opponent,
      ...(opponent.baseStats ? { baseStats: { ...opponent.baseStats } } : {}),
      equipmentPools: opponent.equipmentPools.map((pool) => ({
        ...pool,
        itemRarities: [...pool.itemRarities],
      })),
      rewards: {
        win: { ...opponent.rewards.win },
        loss: { ...opponent.rewards.loss },
      },
    })),
  };
}

function upsertDebugArenaTier(tiers: ArenaTierConfig[], tier: ArenaTierConfig): ArenaTierConfig[] {
  return [...tiers.filter((candidate) => candidate.id !== tier.id), cloneArenaTierConfig(tier)].sort((left, right) => left.id - right.id);
}

function formatBossEditorNumberRow(label: string, field: string, min: number, max: number): string {
  return `
    <label class="debug-panel__row debug-rig-editor__row">
      <span>${label}</span>
      <input class="debug-panel__range" type="range" min="${min}" max="${max}" step="1" value="${min}" data-boss-field="${field}" />
      <input class="debug-panel__number" type="number" min="${min}" max="${max}" step="1" value="${min}" data-boss-number-field="${field}" />
    </label>
  `;
}

function createBossEquipmentControl(control: DebugBossEquipmentControlConfig): HTMLElement {
  const label = document.createElement("label");
  const name = document.createElement("span");
  const select = document.createElement("select");

  label.className = "debug-rig-editor__part debug-boss-editor__equipment-row";
  name.textContent = control.label;
  select.dataset.bossEquipmentSlots = control.slotKeys.join("+");
  select.append(createHeroEquipmentOption("", "empty"));

  getBossEquipmentProductsForSlots(control.slotKeys).forEach((product) => {
    select.append(createBossEquipmentProductOption(product));
  });

  label.append(name, select);
  return label;
}

function syncBossSelectOptions(select: HTMLSelectElement, selectedBossId: string | undefined): void {
  select.replaceChildren(createHeroEquipmentOption("", "new boss"));

  debugArenaBosses.forEach((boss) => {
    select.append(createHeroEquipmentOption(boss.id, `${boss.tierId} | ${boss.name}`));
  });

  select.value = selectedBossId && debugArenaBosses.some((boss) => boss.id === selectedBossId) ? selectedBossId : "";
}

function applyBossToEditor(editor: HTMLElement, boss: ArenaBossDefinition): void {
  const idInput = editor.querySelector<HTMLInputElement>(".debug-boss-editor__id");
  const nameInput = editor.querySelector<HTMLInputElement>(".debug-boss-editor__name");

  if (idInput) {
    idInput.value = boss.id;
  }

  if (nameInput) {
    nameInput.value = boss.name;
  }

  setBossEditorLinkedValue(editor, "tier", boss.tierId);
  setBossEditorLinkedValue(editor, "strength", boss.baseStats.strength);
  setBossEditorLinkedValue(editor, "agility", boss.baseStats.agility);
  setBossEditorLinkedValue(editor, "vitality", boss.baseStats.vitality);
  setBossEditorLinkedValue(editor, "win-gold", boss.rewards.win.gold);
  setBossEditorLinkedValue(editor, "win-xp", boss.rewards.win.xp);
  setBossEditorLinkedValue(editor, "loss-gold", boss.rewards.loss.gold);
  setBossEditorLinkedValue(editor, "loss-xp", boss.rewards.loss.xp);
  setBossEditorLinkedValue(editor, "loot-chance", boss.lootTable[0]?.chance ?? 1);

  editor.querySelectorAll<HTMLSelectElement>("select[data-boss-equipment-slots]").forEach((select) => {
    const slotKeys = getBossEquipmentSelectSlotKeys(select);
    const product = getSelectedBossEquipmentProductForEquipment(slotKeys, boss.equipment);

    select.value = product?.id ?? "";
  });

  syncBossLootSummary(editor);
}

function readBossEditorDraft(editor: HTMLElement): ArenaBossDefinition {
  const idInput = editor.querySelector<HTMLInputElement>(".debug-boss-editor__id");
  const nameInput = editor.querySelector<HTMLInputElement>(".debug-boss-editor__name");
  const name = nameInput?.value.trim() || "Arena Boss";
  const id = normalizeDebugIdentifier(idInput?.value || name);
  const equipment = readBossEditorEquipment(editor);
  const lootChance = clampNumber(getBossEditorLinkedValue(editor, "loot-chance"), 0, 1);

  return {
    id,
    tierId: Math.round(clampNumber(getBossEditorLinkedValue(editor, "tier"), 1, DEBUG_BOSS_TIER_MAX)),
    name,
    baseStats: {
      strength: Math.round(clampNumber(getBossEditorLinkedValue(editor, "strength"), 0, DEBUG_BOSS_STAT_MAX)),
      agility: Math.round(clampNumber(getBossEditorLinkedValue(editor, "agility"), 0, DEBUG_BOSS_STAT_MAX)),
      vitality: Math.round(clampNumber(getBossEditorLinkedValue(editor, "vitality"), 0, DEBUG_BOSS_STAT_MAX)),
    },
    equipment,
    rewards: {
      win: {
        gold: Math.round(clampNumber(getBossEditorLinkedValue(editor, "win-gold"), 0, DEBUG_BOSS_REWARD_MAX)),
        xp: Math.round(clampNumber(getBossEditorLinkedValue(editor, "win-xp"), 0, DEBUG_BOSS_REWARD_MAX)),
      },
      loss: {
        gold: Math.round(clampNumber(getBossEditorLinkedValue(editor, "loss-gold"), 0, DEBUG_BOSS_REWARD_MAX)),
        xp: Math.round(clampNumber(getBossEditorLinkedValue(editor, "loss-xp"), 0, DEBUG_BOSS_REWARD_MAX)),
      },
    },
    lootTable: createBossEditorLootTable(id, equipment, lootChance),
  };
}

function readBossEditorEquipment(editor: HTMLElement): ArenaBossDefinition["equipment"] {
  const equipment: Partial<Record<HeroEquipmentSlotKey, HeroItemId>> = {};

  editor.querySelectorAll<HTMLSelectElement>("select[data-boss-equipment-slots]").forEach((select) => {
    const slotKeys = getBossEquipmentSelectSlotKeys(select);
    const product = getSelectedBossEquipmentProductForSlots(slotKeys, select.value);

    if (!product) {
      return;
    }

    product.itemIds.forEach((itemId) => {
      const item = getDebugHeroItemDefinition(itemId);

      if (item && isHeroEquipmentSlotKey(item.equipmentSlot) && slotKeys.includes(item.equipmentSlot) && isBossUniqueItem(item.id)) {
        equipment[item.equipmentSlot] = item.id;
      }
    });
  });

  return equipment;
}

function createBossEditorLootTable(
  bossId: string,
  equipment: ArenaBossDefinition["equipment"],
  lootChance: number,
): ArenaBossDefinition["lootTable"] {
  const products = getBossEquipmentProductsForEquipment(equipment);

  return products.map((product) => ({
    id: `${bossId}_${normalizeDebugIdentifier(product.id)}_drop`,
    itemIds: [...product.itemIds],
    chance: lootChance,
    quantity: 1,
  }));
}

function previewBossFromEditor(editor: HTMLElement): void {
  const boss = readBossEditorDraft(editor);
  const previewEquipment = createDefaultHeroEquipment();

  Object.entries(boss.equipment).forEach(([slotKey, itemId]) => {
    if (isHeroEquipmentSlotKey(slotKey) && itemId) {
      previewEquipment[slotKey] = itemId;
    }
  });

  updateHeroEquipment(previewEquipment);
}

function syncBossLootSummary(editor: HTMLElement): void {
  const loot = editor.querySelector<HTMLElement>(".debug-boss-editor__loot");

  if (!loot) {
    return;
  }

  const boss = readBossEditorDraft(editor);

  loot.textContent =
    boss.lootTable.length > 0
      ? `Drops: ${boss.lootTable.map((entry) => `${entry.itemIds.join(" + ")} @ ${Math.round(entry.chance * 100)}%`).join(", ")}`
      : "Drops: none";
}

function setBossEditorLinkedValue(editor: HTMLElement, field: string, value: number): void {
  const range =
    field === "tier"
      ? editor.querySelector<HTMLInputElement>("input[data-boss-tier]")
      : field === "loot-chance"
        ? editor.querySelector<HTMLInputElement>("input[data-boss-loot-chance]")
        : editor.querySelector<HTMLInputElement>(`input[data-boss-field="${field}"]`);
  const number =
    field === "tier"
      ? editor.querySelector<HTMLInputElement>("input[data-boss-tier-number]")
      : field === "loot-chance"
        ? editor.querySelector<HTMLInputElement>("input[data-boss-loot-chance-number]")
        : editor.querySelector<HTMLInputElement>(`input[data-boss-number-field="${field}"]`);

  if (range) {
    range.value = `${value}`;
  }

  if (number) {
    number.value = `${value}`;
  }
}

function getBossEditorLinkedValue(editor: HTMLElement, field: string): number {
  const input =
    field === "tier"
      ? editor.querySelector<HTMLInputElement>("input[data-boss-tier-number]")
      : field === "loot-chance"
        ? editor.querySelector<HTMLInputElement>("input[data-boss-loot-chance-number]")
        : editor.querySelector<HTMLInputElement>(`input[data-boss-number-field="${field}"]`);
  const value = Number(input?.value);

  return Number.isFinite(value) ? value : 0;
}

function getSelectedArenaBoss(bossId: string | undefined): ArenaBossDefinition | undefined {
  return debugArenaBosses.find((boss) => boss.id === bossId);
}

function createDefaultArenaBossDraft(): ArenaBossDefinition {
  const nextIndex = debugArenaBosses.length + 1;

  return {
    id: `arena_boss_${nextIndex}`,
    tierId: 1,
    name: `Arena Boss ${nextIndex}`,
    baseStats: {
      strength: 0,
      agility: 0,
      vitality: 0,
    },
    equipment: {},
    rewards: {
      win: { gold: 15, xp: 15 },
      loss: { gold: 1, xp: 2 },
    },
    lootTable: [],
  };
}

function cloneArenaBossDefinition(boss: ArenaBossDefinition): ArenaBossDefinition {
  return {
    ...boss,
    baseStats: { ...boss.baseStats },
    equipment: { ...boss.equipment },
    rewards: {
      win: { ...boss.rewards.win },
      loss: { ...boss.rewards.loss },
    },
    lootTable: boss.lootTable.map((entry) => ({
      ...entry,
      itemIds: [...entry.itemIds],
    })),
  };
}

function upsertDebugArenaBoss(bosses: ArenaBossDefinition[], boss: ArenaBossDefinition): ArenaBossDefinition[] {
  return [...bosses.filter((candidate) => candidate.id !== boss.id), cloneArenaBossDefinition(boss)].sort(
    (left, right) => left.tierId - right.tierId || left.id.localeCompare(right.id),
  );
}

function getBossEquipmentControlConfigs(): DebugBossEquipmentControlConfig[] {
  const usedSlots = new Set<HeroEquipmentSlotKey>();

  return HERO_EQUIPMENT_SLOT_KEYS.flatMap((slotKey) => {
    if (usedSlots.has(slotKey)) {
      return [];
    }

    const pairConfig = getDebugShopItemPairConfig(slotKey);

    if (pairConfig) {
      const slotKeys = [pairConfig.backSlot, pairConfig.frontSlot];

      slotKeys.forEach((pairedSlotKey) => usedSlots.add(pairedSlotKey));

      return [{
        id: `${pairConfig.backSlot}+${pairConfig.frontSlot}`,
        label: pairConfig.label,
        slotKeys,
      }];
    }

    usedSlots.add(slotKey);

    return [{
      id: slotKey,
      label: formatBossEquipmentSlotLabel(slotKey),
      slotKeys: [slotKey],
    }];
  });
}

function getBossEquipmentSelectSlotKeys(select: HTMLSelectElement): HeroEquipmentSlotKey[] {
  return (select.dataset.bossEquipmentSlots ?? "")
    .split("+")
    .filter((slotKey): slotKey is HeroEquipmentSlotKey => isHeroEquipmentSlotKey(slotKey));
}

function getBossEquipmentProductsForSlots(slotKeys: readonly HeroEquipmentSlotKey[]): DebugGeneratedBossItem[] {
  const slotKeySet = new Set(slotKeys);

  return getGeneratedBossItems().filter((product) => product.slotKeys.some((slotKey) => slotKeySet.has(slotKey)));
}

function getSelectedBossEquipmentProductForSlots(
  slotKeys: readonly HeroEquipmentSlotKey[],
  productId: string | undefined,
): DebugGeneratedBossItem | undefined {
  return getBossEquipmentProductsForSlots(slotKeys).find((product) => product.id === productId);
}

function getSelectedBossEquipmentProductForEquipment(
  slotKeys: readonly HeroEquipmentSlotKey[],
  equipment: ArenaBossDefinition["equipment"],
): DebugGeneratedBossItem | undefined {
  const selectedItemIds = new Set(slotKeys.flatMap((slotKey) => equipment[slotKey] ? [equipment[slotKey]!] : []));
  const products = getBossEquipmentProductsForSlots(slotKeys);

  return products.find((product) => product.itemIds.every((itemId) => selectedItemIds.has(itemId))) ??
    products.find((product) => product.itemIds.some((itemId) => selectedItemIds.has(itemId)));
}

function getBossEquipmentProductsForEquipment(equipment: ArenaBossDefinition["equipment"]): DebugGeneratedBossItem[] {
  const selectedItemIds = new Set(Object.values(equipment).filter((itemId): itemId is HeroItemId => Boolean(itemId)));
  const usedItemIds = new Set<HeroItemId>();

  return getGeneratedBossItems().filter((product) => {
    const isSelected = product.itemIds.some((itemId) => selectedItemIds.has(itemId));

    if (!isSelected || product.itemIds.some((itemId) => usedItemIds.has(itemId))) {
      return false;
    }

    product.itemIds.forEach((itemId) => usedItemIds.add(itemId));
    return true;
  });
}

function isBossUniqueItem(itemId: HeroItemId): boolean {
  const record = GENERATED_EQUIPMENT_ITEM_RECORDS.find((candidate) => candidate.item.id === itemId);

  return Boolean(record && (record.availability?.bossUnique || record.item.rarity === "unique"));
}

function formatBossEquipmentSlotLabel(slotKey: HeroEquipmentSlotKey): string {
  return DEBUG_BOSS_EQUIPMENT_SLOT_LABELS[slotKey];
}

function normalizeDebugIdentifier(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "arena_boss";
}

function getWeaponImportAssets(): EquipmentSetImportAsset[] {
  return AUTO_EQUIPMENT_SET_IMPORT_ASSETS.filter((asset) => asset.kind === "weapon");
}

function getShieldImportAssets(): EquipmentSetImportAsset[] {
  return AUTO_EQUIPMENT_SET_IMPORT_ASSETS.filter((asset) => asset.kind === "armor" && asset.key.startsWith("shield-"));
}

function getEquipmentSetImportAssets(): EquipmentSetImportAsset[] {
  const shieldImportSourcePaths = new Set(getShieldImportAssets().map((asset) => asset.sourcePath));

  return AUTO_EQUIPMENT_SET_IMPORT_ASSETS.filter((asset) => !shieldImportSourcePaths.has(asset.sourcePath));
}

function renderWeaponImportAssets(host: HTMLElement): void {
  host.replaceChildren();

  const assets = getWeaponImportAssets();

  if (assets.length === 0) {
    const empty = document.createElement("p");

    empty.className = "debug-auto-equipment__set-empty";
    empty.textContent = "No raw weapon assets in assets/equipment-import/weapons.";
    host.append(empty);
    return;
  }

  assets.forEach((asset) => {
    host.append(createWeaponImportAssetRow(asset));
  });
}

function createWeaponImportAssetRow(asset: EquipmentSetImportAsset): HTMLElement {
  const row = document.createElement("div");
  const preview = document.createElement("button");
  const fields = document.createElement("div");
  const selected = document.createElement("input");
  const nameInput = document.createElement("input");
  const classSelect = document.createElement("select");
  const raritySelect = document.createElement("select");
  const damageInput = document.createElement("input");
  const priceInput = document.createElement("input");
  const shopInput = document.createElement("input");
  const enemyPoolInput = document.createElement("input");
  const bossUniqueInput = document.createElement("input");

  row.className = "debug-auto-equipment__weapon-asset";
  row.dataset.weaponImportSourcePath = asset.sourcePath;

  preview.type = "button";
  preview.className = "debug-auto-equipment__set-preview";
  preview.setAttribute("aria-label", "Preview weapon import asset");
  preview.setAttribute("aria-pressed", "false");
  void getEquipmentSetImportAssetUrl(asset).then((url) => {
    if (url) {
      preview.style.backgroundImage = `url("${url}")`;
    }
  });
  preview.addEventListener("click", () => {
    showEquipmentSetImportAssetPreview(asset, preview);
  });

  selected.type = "checkbox";
  selected.className = "debug-auto-equipment__weapon-selected";
  selected.checked = true;

  nameInput.type = "text";
  nameInput.className = "debug-auto-equipment__weapon-name";
  nameInput.value = formatWeaponImportDefaultName(asset);

  classSelect.className = "debug-auto-equipment__weapon-class";
  DEBUG_WEAPON_IMPORT_CLASSES.forEach((weaponClass) => {
    classSelect.append(createHeroEquipmentOption(weaponClass, DEBUG_WEAPON_IMPORT_CLASS_LABELS[weaponClass]));
  });
  classSelect.value = getDefaultWeaponImportClass(asset);

  raritySelect.className = "debug-auto-equipment__weapon-rarity debug-rarity-select";
  raritySelect.innerHTML = formatAutoEquipmentRarityOptions();
  raritySelect.value = "common";
  setDebugRarityDataset(raritySelect, "common");

  damageInput.type = "number";
  damageInput.className = "debug-auto-equipment__weapon-damage";
  damageInput.min = `${AUTO_EQUIPMENT_STAT_MIN}`;
  damageInput.max = `${AUTO_EQUIPMENT_DAMAGE_MAX}`;
  damageInput.step = "1";
  damageInput.value = "1";

  priceInput.type = "number";
  priceInput.className = "debug-auto-equipment__weapon-price";
  priceInput.min = "0";
  priceInput.max = `${AUTO_EQUIPMENT_PRICE_MAX}`;
  priceInput.step = "1";
  priceInput.value = "0";

  shopInput.type = "checkbox";
  shopInput.className = "debug-auto-equipment__weapon-shop";
  shopInput.checked = true;

  enemyPoolInput.type = "checkbox";
  enemyPoolInput.className = "debug-auto-equipment__weapon-enemy-pool";

  bossUniqueInput.type = "checkbox";
  bossUniqueInput.className = "debug-auto-equipment__weapon-boss-unique";

  fields.className = "debug-auto-equipment__weapon-fields";
  fields.append(
    createWeaponImportCheckboxField("Use", selected, "debug-auto-equipment__weapon-field--check"),
    createWeaponImportField("Name", nameInput, "debug-auto-equipment__weapon-field--name"),
    createWeaponImportField("Type", classSelect),
    createWeaponImportField("Rarity", raritySelect),
    createWeaponImportField("Damage", damageInput),
    createWeaponImportField("Price", priceInput),
    createWeaponImportCheckboxField("Shop", shopInput),
    createWeaponImportCheckboxField("Enemy", enemyPoolInput),
    createWeaponImportCheckboxField("Boss", bossUniqueInput),
  );

  const syncRow = (): void => {
    syncWeaponImportRowAvailability(row);
  };

  selected.addEventListener("change", syncRow);
  raritySelect.addEventListener("change", syncRow);
  shopInput.addEventListener("change", syncRow);
  bossUniqueInput.addEventListener("change", syncRow);
  syncRow();

  row.append(preview, fields);
  return row;
}

function createWeaponImportField(labelText: string, control: HTMLElement, className = ""): HTMLLabelElement {
  const label = document.createElement("label");
  const text = document.createElement("span");

  label.className = `debug-auto-equipment__weapon-field${className ? ` ${className}` : ""}`;
  text.textContent = labelText;
  label.append(text, control);

  return label;
}

function createWeaponImportCheckboxField(labelText: string, control: HTMLInputElement, className = ""): HTMLLabelElement {
  const label = createWeaponImportField(labelText, control, className);

  label.classList.add("debug-auto-equipment__weapon-field--toggle");
  return label;
}

function syncWeaponImportRowAvailability(row: HTMLElement): void {
  const selected = row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-selected");
  const raritySelect = row.querySelector<HTMLSelectElement>(".debug-auto-equipment__weapon-rarity");
  const priceInput = row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-price");
  const shopInput = row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-shop");
  const enemyPoolInput = row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-enemy-pool");
  const bossUniqueInput = row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-boss-unique");
  const isSelected = selected?.checked === true;
  const isBossUnique = bossUniqueInput?.checked === true;
  const isShopItem = shopInput?.checked === true && !isBossUnique;

  if (isBossUnique && raritySelect) {
    raritySelect.value = "unique";
    setDebugRarityDataset(raritySelect, "unique");
  } else if (raritySelect) {
    setDebugRarityDataset(raritySelect, getDebugItemRarity(raritySelect.value, "common"));
  }

  if (raritySelect) {
    raritySelect.disabled = !isSelected || isBossUnique;
  }

  if (shopInput) {
    shopInput.disabled = !isSelected || isBossUnique;
  }

  if (enemyPoolInput) {
    enemyPoolInput.disabled = !isSelected || isBossUnique;
  }

  if (bossUniqueInput) {
    bossUniqueInput.disabled = !isSelected;
  }

  if (priceInput) {
    priceInput.disabled = !isSelected || !isShopItem;

    if (!isShopItem) {
      priceInput.value = "0";
    }
  }
}

function getSelectedWeaponImportEntries(host: HTMLElement): DebugWeaponImportEntry[] {
  return Array.from(host.querySelectorAll<HTMLElement>("[data-weapon-import-source-path]")).flatMap((row) => {
    const selected = row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-selected");
    const sourcePath = row.dataset.weaponImportSourcePath;

    if (!selected?.checked || !sourcePath) {
      return [];
    }

    const name = row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-name")?.value.trim() ?? "";
    const weaponClass = getDebugWeaponImportClass(row.querySelector<HTMLSelectElement>(".debug-auto-equipment__weapon-class")?.value);
    const rarity = getDebugItemRarity(row.querySelector<HTMLSelectElement>(".debug-auto-equipment__weapon-rarity")?.value ?? "", "common");
    const damageBonus = getWeaponImportInteger(row, ".debug-auto-equipment__weapon-damage", AUTO_EQUIPMENT_STAT_MIN, AUTO_EQUIPMENT_DAMAGE_MAX);
    const bossUnique = row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-boss-unique")?.checked === true;
    const shop = row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-shop")?.checked === true && !bossUnique;
    const price = shop ? getWeaponImportInteger(row, ".debug-auto-equipment__weapon-price", 0, AUTO_EQUIPMENT_PRICE_MAX) : 0;

    return [
      {
        sourcePath,
        name: name || formatWeaponImportDefaultName({ key: sourcePath, sourcePath }),
        rarity: bossUnique ? "unique" : rarity,
        weaponClass,
        damageBonus,
        price,
        availability: {
          shop,
          enemyPool: row.querySelector<HTMLInputElement>(".debug-auto-equipment__weapon-enemy-pool")?.checked === true && !bossUnique,
          bossUnique,
        },
      },
    ];
  });
}

function renderShieldImportAssets(host: HTMLElement): void {
  host.replaceChildren();

  const assets = getShieldImportAssets();

  if (assets.length === 0) {
    const empty = document.createElement("p");

    empty.className = "debug-auto-equipment__set-empty";
    empty.textContent = "No raw shield assets in assets/equipment-import/armor.";
    host.append(empty);
    return;
  }

  assets.forEach((asset) => {
    host.append(createShieldImportAssetRow(asset));
  });
}

function createShieldImportAssetRow(asset: EquipmentSetImportAsset): HTMLElement {
  const row = document.createElement("div");
  const preview = document.createElement("button");
  const fields = document.createElement("div");
  const selected = document.createElement("input");
  const nameInput = document.createElement("input");
  const raritySelect = document.createElement("select");
  const armorInput = document.createElement("input");
  const priceInput = document.createElement("input");
  const shopInput = document.createElement("input");
  const enemyPoolInput = document.createElement("input");
  const bossUniqueInput = document.createElement("input");

  row.className = "debug-auto-equipment__weapon-asset debug-auto-equipment__shield-asset";
  row.dataset.shieldImportSourcePath = asset.sourcePath;

  preview.type = "button";
  preview.className = "debug-auto-equipment__set-preview";
  preview.setAttribute("aria-label", "Preview shield import asset");
  preview.setAttribute("aria-pressed", "false");
  void getEquipmentSetImportAssetUrl(asset).then((url) => {
    if (url) {
      preview.style.backgroundImage = `url("${url}")`;
    }
  });
  preview.addEventListener("click", () => {
    showEquipmentSetImportAssetPreview(asset, preview);
  });

  selected.type = "checkbox";
  selected.className = "debug-auto-equipment__shield-selected";
  selected.checked = true;

  nameInput.type = "text";
  nameInput.className = "debug-auto-equipment__shield-name";
  nameInput.value = formatShieldImportDefaultName(asset);

  raritySelect.className = "debug-auto-equipment__shield-rarity debug-rarity-select";
  raritySelect.innerHTML = formatAutoEquipmentRarityOptions();
  raritySelect.value = "common";
  setDebugRarityDataset(raritySelect, "common");

  armorInput.type = "number";
  armorInput.className = "debug-auto-equipment__shield-armor";
  armorInput.min = `${AUTO_EQUIPMENT_STAT_MIN}`;
  armorInput.max = `${AUTO_EQUIPMENT_ARMOR_MAX}`;
  armorInput.step = "1";
  armorInput.value = "1";

  priceInput.type = "number";
  priceInput.className = "debug-auto-equipment__shield-price";
  priceInput.min = "0";
  priceInput.max = `${AUTO_EQUIPMENT_PRICE_MAX}`;
  priceInput.step = "1";
  priceInput.value = "0";

  shopInput.type = "checkbox";
  shopInput.className = "debug-auto-equipment__shield-shop";
  shopInput.checked = true;

  enemyPoolInput.type = "checkbox";
  enemyPoolInput.className = "debug-auto-equipment__shield-enemy-pool";

  bossUniqueInput.type = "checkbox";
  bossUniqueInput.className = "debug-auto-equipment__shield-boss-unique";

  fields.className = "debug-auto-equipment__weapon-fields debug-auto-equipment__shield-fields";
  fields.append(
    createWeaponImportCheckboxField("Use", selected, "debug-auto-equipment__weapon-field--check"),
    createWeaponImportField("Name", nameInput, "debug-auto-equipment__weapon-field--name"),
    createWeaponImportField("Rarity", raritySelect),
    createWeaponImportField("Armor", armorInput),
    createWeaponImportField("Price", priceInput),
    createWeaponImportCheckboxField("Shop", shopInput),
    createWeaponImportCheckboxField("Enemy", enemyPoolInput),
    createWeaponImportCheckboxField("Boss", bossUniqueInput),
  );

  const syncRow = (): void => {
    syncShieldImportRowAvailability(row);
  };

  selected.addEventListener("change", syncRow);
  raritySelect.addEventListener("change", syncRow);
  shopInput.addEventListener("change", syncRow);
  bossUniqueInput.addEventListener("change", syncRow);
  syncRow();

  row.append(preview, fields);
  return row;
}

function syncShieldImportRowAvailability(row: HTMLElement): void {
  const selected = row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-selected");
  const raritySelect = row.querySelector<HTMLSelectElement>(".debug-auto-equipment__shield-rarity");
  const priceInput = row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-price");
  const shopInput = row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-shop");
  const enemyPoolInput = row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-enemy-pool");
  const bossUniqueInput = row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-boss-unique");
  const isSelected = selected?.checked === true;
  const isBossUnique = bossUniqueInput?.checked === true;
  const isShopItem = shopInput?.checked === true && !isBossUnique;

  if (isBossUnique && raritySelect) {
    raritySelect.value = "unique";
    setDebugRarityDataset(raritySelect, "unique");
  } else if (raritySelect) {
    setDebugRarityDataset(raritySelect, getDebugItemRarity(raritySelect.value, "common"));
  }

  if (raritySelect) {
    raritySelect.disabled = !isSelected || isBossUnique;
  }

  if (shopInput) {
    shopInput.disabled = !isSelected || isBossUnique;
  }

  if (enemyPoolInput) {
    enemyPoolInput.disabled = !isSelected || isBossUnique;
  }

  if (bossUniqueInput) {
    bossUniqueInput.disabled = !isSelected;
  }

  if (priceInput) {
    priceInput.disabled = !isSelected || !isShopItem;

    if (!isShopItem) {
      priceInput.value = "0";
    }
  }
}

function getSelectedShieldImportEntries(host: HTMLElement): DebugShieldImportEntry[] {
  return Array.from(host.querySelectorAll<HTMLElement>("[data-shield-import-source-path]")).flatMap((row) => {
    const selected = row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-selected");
    const sourcePath = row.dataset.shieldImportSourcePath;

    if (!selected?.checked || !sourcePath) {
      return [];
    }

    const name = row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-name")?.value.trim() ?? "";
    const rarity = getDebugItemRarity(row.querySelector<HTMLSelectElement>(".debug-auto-equipment__shield-rarity")?.value ?? "", "common");
    const armorHp = getWeaponImportInteger(row, ".debug-auto-equipment__shield-armor", AUTO_EQUIPMENT_STAT_MIN, AUTO_EQUIPMENT_ARMOR_MAX);
    const bossUnique = row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-boss-unique")?.checked === true;
    const shop = row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-shop")?.checked === true && !bossUnique;
    const price = shop ? getWeaponImportInteger(row, ".debug-auto-equipment__shield-price", 0, AUTO_EQUIPMENT_PRICE_MAX) : 0;

    return [
      {
        sourcePath,
        name: name || formatShieldImportDefaultName({ key: sourcePath, sourcePath }),
        rarity: bossUnique ? "unique" : rarity,
        armorHp,
        price,
        availability: {
          shop,
          enemyPool: row.querySelector<HTMLInputElement>(".debug-auto-equipment__shield-enemy-pool")?.checked === true && !bossUnique,
          bossUnique,
        },
      },
    ];
  });
}

function getWeaponImportInteger(row: HTMLElement, selector: string, min: number, max: number): number {
  const value = Number(row.querySelector<HTMLInputElement>(selector)?.value ?? min);
  const integer = Number.isFinite(value) ? Math.floor(value) : min;

  return clampNumber(integer, min, max);
}

function getDebugWeaponImportClass(value: string | undefined): HeroWeaponClass {
  return DEBUG_WEAPON_IMPORT_CLASSES.includes(value as HeroWeaponClass) ? (value as HeroWeaponClass) : "sword";
}

function getDefaultWeaponImportClass(asset: EquipmentSetImportAsset): HeroWeaponClass {
  const text = `${asset.key} ${asset.sourcePath}`.toLowerCase();

  if (text.includes("bow")) {
    return "bow";
  }

  if (text.includes("shuriken")) {
    return "shuriken";
  }

  if (text.includes("axe")) {
    return "axe";
  }

  if (text.includes("mace")) {
    return "mace";
  }

  if (text.includes("spear")) {
    return "spear";
  }

  return "sword";
}

function formatWeaponImportDefaultName(asset: Pick<EquipmentSetImportAsset, "key" | "sourcePath">): string {
  const sourceKey = asset.key || asset.sourcePath.split("/").at(-1)?.replace(/\.(?:png|webp)$/i, "") || "weapon";
  const normalized = sourceKey
    .replace(/^weapon-(?:sword|axe|bow|mace|spear|shuriken)-?/i, "")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

  return normalized || "Weapon";
}

function formatShieldImportDefaultName(asset: Pick<EquipmentSetImportAsset, "key" | "sourcePath">): string {
  const sourceKey = asset.key.includes("/")
    ? (asset.sourcePath.split("/").at(-1)?.replace(/\.(?:png|webp)$/i, "") ?? "shield")
    : asset.key || asset.sourcePath.split("/").at(-1)?.replace(/\.(?:png|webp)$/i, "") || "shield";
  const normalized = sourceKey
    .replace(/^shield-?/i, "")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

  return normalized ? `${normalized} Shield` : "Shield";
}

function renderEquipmentSetImportAssets(host: HTMLElement): void {
  host.replaceChildren();

  const assets = getEquipmentSetImportAssets();

  if (assets.length === 0) {
    const empty = document.createElement("p");

    empty.className = "debug-auto-equipment__set-empty";
    empty.textContent = "No raw set assets in assets/equipment-import.";
    host.append(empty);
    return;
  }

  assets.forEach((asset) => {
    host.append(createEquipmentSetImportAssetRow(asset));
  });
}

function createEquipmentSetImportAssetRow(asset: EquipmentSetImportAsset): HTMLElement {
  const row = document.createElement("div");
  const preview = document.createElement("button");
  const source = document.createElement("span");
  const select = document.createElement("select");

  row.className = "debug-auto-equipment__set-asset";
  row.dataset.setImportSourcePath = asset.sourcePath;

  preview.type = "button";
  preview.className = "debug-auto-equipment__set-preview";
  preview.setAttribute("aria-label", "Preview import asset");
  preview.setAttribute("aria-pressed", "false");
  void getEquipmentSetImportAssetUrl(asset).then((url) => {
    if (url) {
      preview.style.backgroundImage = `url("${url}")`;
    }
  });
  preview.addEventListener("click", () => {
    showEquipmentSetImportAssetPreview(asset, preview);
  });

  source.className = "debug-auto-equipment__set-source";
  source.textContent = asset.sourcePath;
  source.title = asset.sourcePath;

  select.className = "debug-auto-equipment__set-slot";
  select.append(createHeroEquipmentOption("", "skip"));
  DEBUG_EQUIPMENT_SET_IMPORT_SLOT_CONFIGS.filter((config) => config.kind === asset.kind).forEach((config) => {
    select.append(createHeroEquipmentOption(config.targetPrefix, config.label));
  });

  row.append(preview, source, select);
  return row;
}

function showEquipmentSetImportAssetPreview(asset: EquipmentSetImportAsset, trigger: HTMLButtonElement): void {
  const previewHost = document.querySelector<HTMLElement>("#debugSetImportPreview");
  const previewImage = previewHost?.querySelector<HTMLImageElement>(".debug-set-import-preview__image");

  if (!previewHost || !previewImage) {
    return;
  }

  document.querySelectorAll<HTMLButtonElement>(".debug-auto-equipment__set-preview--selected").forEach((button) => {
    button.classList.remove("debug-auto-equipment__set-preview--selected");
    button.setAttribute("aria-pressed", "false");
  });

  void getEquipmentSetImportAssetUrl(asset).then((url) => {
    if (!url) {
      return;
    }

    trigger.classList.add("debug-auto-equipment__set-preview--selected");
    trigger.setAttribute("aria-pressed", "true");
    previewImage.src = url;
    previewHost.hidden = false;
  });
}

function getSelectedEquipmentSetImportEntries(host: HTMLElement): { sourcePath: string; targetPrefix: string }[] {
  return Array.from(host.querySelectorAll<HTMLElement>("[data-set-import-source-path]")).flatMap((row) => {
    const sourcePath = row.dataset.setImportSourcePath;
    const targetPrefix = row.querySelector<HTMLSelectElement>(".debug-auto-equipment__set-slot")?.value;

    if (!sourcePath || !targetPrefix) {
      return [];
    }

    return [{ sourcePath, targetPrefix }];
  });
}

function syncAutoEquipmentStatInputs(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__select");
  const armorRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor]");
  const armorNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor-number]");
  const record = getSelectedAutoEquipmentRecord(select?.value);

  if (!armorRange || !armorNumber) {
    return;
  }

  if (!record) {
    armorRange.value = "0";
    armorNumber.value = "0";
    return;
  }

  const value = record.item.kind === "weapon" ? (record.item.damageBonus ?? 1) : (record.item.armorHp ?? 1);

  armorRange.value = `${value}`;
  armorNumber.value = `${value}`;
}

function formatAutoEquipmentRarityOptions(): string {
  return AUTO_EQUIPMENT_RARITIES.map((rarity) => `<option value="${rarity}">${AUTO_EQUIPMENT_RARITY_LABELS[rarity]}</option>`).join("");
}

function getSelectedAutoEquipmentRarity(value: string, record: (typeof AUTO_EQUIPMENT_ITEM_RECORDS)[number]): HeroItemRarity {
  return getDebugItemRarity(value, getDefaultAutoEquipmentRarity(record));
}

function getDebugItemRarity(value: string, fallback: HeroItemRarity): HeroItemRarity {
  return AUTO_EQUIPMENT_RARITIES.includes(value as HeroItemRarity) ? (value as HeroItemRarity) : fallback;
}

function getDebugItemEquipmentRarityFilter(value: string): DebugItemEquipmentRarityFilter {
  return value === "all" || AUTO_EQUIPMENT_RARITIES.includes(value as HeroItemRarity) ? (value as DebugItemEquipmentRarityFilter) : "all";
}

function getDebugItemEquipmentTypeFilter(value: string): DebugItemEquipmentTypeFilter {
  const armorCategories = Object.keys(DEBUG_ITEM_EQUIPMENT_ARMOR_CATEGORY_LABELS);

  return value === "all" || DEBUG_WEAPON_IMPORT_CLASSES.includes(value as HeroWeaponClass) || armorCategories.includes(value)
    ? (value as DebugItemEquipmentTypeFilter)
    : "all";
}

function getDefaultAutoEquipmentRarity(record: (typeof AUTO_EQUIPMENT_ITEM_RECORDS)[number] | undefined): HeroItemRarity {
  if (record?.item.rarity) {
    return record.item.rarity;
  }

  if (record?.item.kind === "armor" && record.item.armorCategory === "chain") {
    return "rare";
  }

  if (record?.item.kind === "armor" && record.item.armorCategory === "leather") {
    return "uncommon";
  }

  if (record?.item.kind === "weapon" && record.item.weaponClass === "axe") {
    return "epic";
  }

  return "common";
}

function getGeneratedBossItems(): DebugGeneratedBossItem[] {
  const records = GENERATED_EQUIPMENT_ITEM_RECORDS.filter((record) => isBossUniqueItem(record.item.id));
  const usedItemIds = new Set<HeroItemId>();
  const items: DebugGeneratedBossItem[] = [];

  records.forEach((record) => {
    if (usedItemIds.has(record.item.id)) {
      return;
    }

    const pairConfig = record.item.kind === "armor" ? getDebugShopItemPairConfig(record.item.equipmentSlot) : undefined;
    const counterpart = pairConfig ? findDebugShopItemPair(record, records, pairConfig, usedItemIds) : undefined;

    if (pairConfig && counterpart) {
      items.push(createDebugGeneratedBossPairItem(record, counterpart, pairConfig));
      usedItemIds.add(record.item.id);
      usedItemIds.add(counterpart.item.id);
      return;
    }

    items.push(createDebugGeneratedBossItem(record));
    usedItemIds.add(record.item.id);
  });

  return items.sort(compareDebugGeneratedBossItems);
}

function createBossEquipmentProductOption(product: DebugGeneratedBossItem): HTMLOptionElement {
  const option = createHeroEquipmentOption(product.id, formatGeneratedBossItemOption(product));

  option.className = `debug-rarity-option debug-rarity-option--${product.rarity}`;
  option.dataset.rarity = product.rarity;

  return option;
}

function formatGeneratedBossItemOption(item: DebugGeneratedBossItem): string {
  const statLabel = item.kind === "weapon" ? "DMG" : "AR";

  return `${AUTO_EQUIPMENT_RARITY_LABELS[item.rarity]} | ${item.name} | ${statLabel} ${item.stat}`;
}

function compareDebugGeneratedBossItems(left: DebugGeneratedBossItem, right: DebugGeneratedBossItem): number {
  return DEBUG_SHOP_ITEM_RARITY_RANKS[left.rarity] - DEBUG_SHOP_ITEM_RARITY_RANKS[right.rarity] || left.name.localeCompare(right.name);
}

function createDebugGeneratedBossItem(record: DebugGeneratedShopItemRecord): DebugGeneratedBossItem {
  return {
    id: record.item.id,
    name: record.item.name,
    itemIds: [record.item.id],
    slotKeys: [record.item.equipmentSlot],
    kind: record.item.kind,
    rarity: record.item.rarity ?? "unique",
    stat: getGeneratedShopRecordStat(record),
  };
}

function createDebugGeneratedBossPairItem(
  record: DebugGeneratedShopItemRecord,
  counterpart: DebugGeneratedShopItemRecord,
  pairConfig: DebugShopItemPairConfig,
): DebugGeneratedBossItem {
  const backRecord = record.item.equipmentSlot === pairConfig.backSlot ? record : counterpart;
  const frontRecord = record.item.equipmentSlot === pairConfig.frontSlot ? record : counterpart;

  return {
    id: `${backRecord.item.id}+${frontRecord.item.id}`,
    name: getDebugShopItemPairName(backRecord, pairConfig),
    itemIds: [backRecord.item.id, frontRecord.item.id],
    slotKeys: [pairConfig.backSlot, pairConfig.frontSlot],
    kind: "armor",
    rarity: getHighestDebugShopItemRarity([backRecord, frontRecord]),
    stat: Math.max(getGeneratedShopRecordStat(backRecord), getGeneratedShopRecordStat(frontRecord)),
  };
}

function getGeneratedShopProducts(): DebugGeneratedShopProduct[] {
  const records = GENERATED_EQUIPMENT_ITEM_RECORDS.filter((record) => record.armoryProduct || record.weaponProduct);
  const usedItemIds = new Set<HeroItemId>();
  const products: DebugGeneratedShopProduct[] = [];

  records.forEach((record) => {
    if (usedItemIds.has(record.item.id)) {
      return;
    }

    const pairConfig = record.item.kind === "armor" ? getDebugShopItemPairConfig(record.item.equipmentSlot) : undefined;
    const counterpart = pairConfig ? findDebugShopItemPair(record, records, pairConfig, usedItemIds) : undefined;

    if (pairConfig && counterpart) {
      products.push(createDebugGeneratedShopPairProduct(record, counterpart, pairConfig));
      usedItemIds.add(record.item.id);
      usedItemIds.add(counterpart.item.id);
      return;
    }

    products.push(createDebugGeneratedShopProduct(record));
    usedItemIds.add(record.item.id);
  });

  return products.sort(compareDebugGeneratedShopProducts);
}

function setDebugRarityDataset(element: HTMLElement, rarity: HeroItemRarity | undefined): void {
  if (rarity) {
    element.dataset.rarity = rarity;
    return;
  }

  delete element.dataset.rarity;
}

function createDebugGeneratedShopProduct(record: DebugGeneratedShopItemRecord): DebugGeneratedShopProduct {
  return {
    id: record.item.id,
    name: record.item.name,
    itemIds: [record.item.id],
    kind: record.item.kind,
    rarity: record.item.rarity ?? "common",
    stat: getGeneratedShopRecordStat(record),
    price: getGeneratedShopRecordPrice(record),
  };
}

function createDebugGeneratedShopPairProduct(
  record: DebugGeneratedShopItemRecord,
  counterpart: DebugGeneratedShopItemRecord,
  pairConfig: DebugShopItemPairConfig,
): DebugGeneratedShopProduct {
  const backRecord = record.item.equipmentSlot === pairConfig.backSlot ? record : counterpart;
  const frontRecord = record.item.equipmentSlot === pairConfig.frontSlot ? record : counterpart;

  return {
    id: `${backRecord.item.id}+${frontRecord.item.id}`,
    name: getDebugShopItemPairName(backRecord, pairConfig),
    itemIds: [backRecord.item.id, frontRecord.item.id],
    kind: "armor",
    rarity: getHighestDebugShopItemRarity([backRecord, frontRecord]),
    stat: Math.max(getGeneratedShopRecordStat(backRecord), getGeneratedShopRecordStat(frontRecord)),
    price: Math.max(getGeneratedShopRecordPrice(backRecord), getGeneratedShopRecordPrice(frontRecord)),
  };
}

function findDebugShopItemPair(
  record: DebugGeneratedShopItemRecord,
  records: readonly DebugGeneratedShopItemRecord[],
  pairConfig: DebugShopItemPairConfig,
  usedItemIds: ReadonlySet<HeroItemId>,
): DebugGeneratedShopItemRecord | undefined {
  const pairKey = getDebugShopItemPairKey(record, pairConfig);
  const targetSlot = record.item.equipmentSlot === pairConfig.backSlot ? pairConfig.frontSlot : pairConfig.backSlot;

  return records.find(
    (candidate) =>
      candidate.item.id !== record.item.id &&
      !usedItemIds.has(candidate.item.id) &&
      candidate.item.kind === "armor" &&
      candidate.item.equipmentSlot === targetSlot &&
      getDebugShopItemPairKey(candidate, pairConfig) === pairKey,
  );
}

function getDebugShopItemPairConfig(slotKey: HeroEquipmentSlotKey): DebugShopItemPairConfig | undefined {
  return DEBUG_SHOP_ITEM_PAIR_CONFIGS.find((config) => config.backSlot === slotKey || config.frontSlot === slotKey);
}

function getDebugShopItemPairKey(record: DebugGeneratedShopItemRecord, pairConfig: DebugShopItemPairConfig): string {
  return normalizeDebugShopItemPairText(record.asset.key.replace(/-/g, " "), pairConfig);
}

function getDebugShopItemPairName(record: DebugGeneratedShopItemRecord, pairConfig: DebugShopItemPairConfig): string {
  return formatDebugShopItemPairText(record.item.name, pairConfig);
}

function formatDebugShopItemPairText(value: string, pairConfig: DebugShopItemPairConfig): string {
  const token = escapeDebugRegExp(pairConfig.token);

  return value
    .replace(new RegExp(`\\b(?:back|front)\\s+${token}\\b`, "giu"), pairConfig.label)
    .replace(new RegExp(`\\b${token}\\s+(?:back|front)\\b`, "giu"), pairConfig.label)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDebugShopItemPairText(value: string, pairConfig: DebugShopItemPairConfig): string {
  return formatDebugShopItemPairText(value, pairConfig).toLowerCase();
}

function escapeDebugRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getHighestDebugShopItemRarity(records: readonly DebugGeneratedShopItemRecord[]): HeroItemRarity {
  return records.reduce<HeroItemRarity>((highestRarity, record) => {
    const rarity = record.item.rarity ?? "common";

    return DEBUG_SHOP_ITEM_RARITY_RANKS[rarity] > DEBUG_SHOP_ITEM_RARITY_RANKS[highestRarity] ? rarity : highestRarity;
  }, "common");
}

function getGeneratedShopRecordStat(record: DebugGeneratedShopItemRecord): number {
  return record.item.kind === "weapon" ? (record.item.damageBonus ?? 0) : (record.item.armorHp ?? 0);
}

function getGeneratedShopRecordPrice(record: DebugGeneratedShopItemRecord): number {
  return record.armoryProduct?.price ?? record.weaponProduct?.price ?? 0;
}

function compareDebugGeneratedShopProducts(left: DebugGeneratedShopProduct, right: DebugGeneratedShopProduct): number {
  return DEBUG_SHOP_ITEM_RARITY_RANKS[left.rarity] - DEBUG_SHOP_ITEM_RARITY_RANKS[right.rarity] || left.name.localeCompare(right.name);
}

function getAutoEquipmentStatMax(record: (typeof AUTO_EQUIPMENT_ITEM_RECORDS)[number] | undefined): number {
  return record?.item.kind === "weapon" ? AUTO_EQUIPMENT_DAMAGE_MAX : AUTO_EQUIPMENT_ARMOR_MAX;
}

function previewSelectedAutoEquipment(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__select");
  const record = getSelectedAutoEquipmentRecord(select?.value);

  if (!record) {
    previewAutoEquipmentFallback();
    return;
  }

  previewAutoEquipmentRecord(record);
}

function previewAutoEquipmentRecord(record: (typeof AUTO_EQUIPMENT_ITEM_RECORDS)[number]): void {
  if (isEquipmentSlotKey(record.item.equipmentSlot)) {
    activeEquipmentSlot = record.item.equipmentSlot;
    activeEquipmentItemId = record.item.id;
  }

  const previewEquipment = createDefaultHeroEquipment();

  previewEquipment[record.item.equipmentSlot] = record.item.id;
  updateHeroEquipment(previewEquipment);
}

function previewAutoEquipmentFallback(): void {
  activeEquipmentItemId = "";
  updateHeroEquipment(createDefaultHeroEquipment());
}

function getSelectedAutoEquipmentRecord(itemId: string | undefined): (typeof AUTO_EQUIPMENT_ITEM_RECORDS)[number] | undefined {
  return AUTO_EQUIPMENT_ITEM_RECORDS.find((record) => record.item.id === itemId);
}

function getSelectedGeneratedEquipmentRecord(itemId: string | undefined): (typeof GENERATED_EQUIPMENT_ITEM_RECORDS)[number] | undefined {
  return GENERATED_EQUIPMENT_ITEM_RECORDS.find((record) => record.item.id === itemId);
}

function getRemovableGeneratedEquipmentRecords(): (typeof GENERATED_EQUIPMENT_ITEM_RECORDS)[number][] {
  return [...GENERATED_EQUIPMENT_ITEM_RECORDS];
}

function getRemovableGeneratedEquipmentItems(): DebugRemovableGeneratedEquipmentItem[] {
  const records = getRemovableGeneratedEquipmentRecords();
  const usedItemIds = new Set<HeroItemId>();
  const items: DebugRemovableGeneratedEquipmentItem[] = [];

  records.forEach((record) => {
    if (usedItemIds.has(record.item.id)) {
      return;
    }

    const pairConfig = record.item.kind === "armor" ? getDebugShopItemPairConfig(record.item.equipmentSlot) : undefined;
    const counterpart = pairConfig ? findDebugShopItemPair(record, records, pairConfig, usedItemIds) : undefined;

    if (pairConfig && counterpart) {
      items.push(createDebugRemovableGeneratedEquipmentPairItem(record, counterpart, pairConfig));
      usedItemIds.add(record.item.id);
      usedItemIds.add(counterpart.item.id);
      return;
    }

    items.push(createDebugRemovableGeneratedEquipmentItem(record));
    usedItemIds.add(record.item.id);
  });

  return items.sort(compareDebugRemovableGeneratedEquipmentItems);
}

function getSelectedRemovableGeneratedEquipmentItem(
  items: readonly DebugRemovableGeneratedEquipmentItem[],
  itemId: string | undefined,
): DebugRemovableGeneratedEquipmentItem | undefined {
  return items.find((item) => item.id === itemId);
}

function createRemovableGeneratedEquipmentOption(item: DebugRemovableGeneratedEquipmentItem): HTMLOptionElement {
  const option = createHeroEquipmentOption(item.id, item.name, item.rarity);

  option.className = `debug-rarity-option debug-rarity-option--${item.rarity}`;
  option.dataset.rarity = item.rarity;

  return option;
}

function createDebugRemovableGeneratedEquipmentItem(record: DebugGeneratedShopItemRecord): DebugRemovableGeneratedEquipmentItem {
  return {
    id: record.item.id,
    name: record.item.name,
    itemIds: [record.item.id],
    rarity: record.item.rarity ?? "common",
  };
}

function createDebugRemovableGeneratedEquipmentPairItem(
  record: DebugGeneratedShopItemRecord,
  counterpart: DebugGeneratedShopItemRecord,
  pairConfig: DebugShopItemPairConfig,
): DebugRemovableGeneratedEquipmentItem {
  const backRecord = record.item.equipmentSlot === pairConfig.backSlot ? record : counterpart;
  const frontRecord = record.item.equipmentSlot === pairConfig.frontSlot ? record : counterpart;

  return {
    id: `${backRecord.item.id}+${frontRecord.item.id}`,
    name: getDebugShopItemPairName(backRecord, pairConfig),
    itemIds: [backRecord.item.id, frontRecord.item.id],
    rarity: getHighestDebugShopItemRarity([backRecord, frontRecord]),
  };
}

function compareDebugRemovableGeneratedEquipmentItems(
  left: DebugRemovableGeneratedEquipmentItem,
  right: DebugRemovableGeneratedEquipmentItem,
): number {
  return DEBUG_SHOP_ITEM_RARITY_RANKS[left.rarity] - DEBUG_SHOP_ITEM_RARITY_RANKS[right.rarity] || left.name.localeCompare(right.name);
}

function getCurrentEquipmentSlotTuning(slotKey: EquipmentSlotKey): EquipmentTuning {
  return { ...(debugTuning.equipment[slotKey] ?? DEFAULT_EQUIPMENT[slotKey]) };
}

function getCurrentEquipmentItemTuning(itemId: HeroItemId, slotKey: EquipmentSlotKey): EquipmentTuning {
  return {
    ...(
      debugTuning.equipmentItems[itemId] ??
      GENERATED_EQUIPMENT_ITEM_TUNING[itemId] ??
      DEFAULT_EQUIPMENT_ITEM_TUNING[itemId] ??
      debugTuning.equipment[slotKey] ??
      DEFAULT_EQUIPMENT[slotKey]
    ),
  };
}

function syncItemEquipmentValueEditor(panel: HTMLElement): void {
  const valueRarityRow = panel.querySelector<HTMLElement>(".debug-item-equipment__value-rarity-row");
  const valueRarity = panel.querySelector<HTMLSelectElement>(".debug-item-equipment__value-rarity");
  const statRow = panel.querySelector<HTMLElement>(".debug-item-equipment__value-stat-row");
  const statLabel = panel.querySelector<HTMLElement>(".debug-item-equipment__value-stat-label");
  const statRange = panel.querySelector<HTMLInputElement>("input[data-item-equipment-stat]");
  const statNumber = panel.querySelector<HTMLInputElement>("input[data-item-equipment-stat-number]");
  const priceRow = panel.querySelector<HTMLElement>(".debug-item-equipment__value-price-row");
  const priceRange = panel.querySelector<HTMLInputElement>("input[data-item-equipment-price]");
  const priceNumber = panel.querySelector<HTMLInputElement>("input[data-item-equipment-price-number]");
  const ids = panel.querySelector<HTMLElement>(".debug-item-equipment__value-ids");
  const save = panel.querySelector<HTMLButtonElement>(".debug-item-equipment__save");
  const status = panel.querySelector<HTMLElement>(".debug-item-equipment__value-status");
  const context = getActiveItemEquipmentValueContext();

  if (valueRarityRow) {
    valueRarityRow.hidden = !context.canEditRarity;
  }

  if (valueRarity) {
    const rarity = context.rarity ?? "common";

    valueRarity.value = rarity;
    valueRarity.disabled = !context.canEditRarity;
    setDebugRarityDataset(valueRarity, context.canEditRarity ? rarity : undefined);
  }

  if (statRow) {
    statRow.hidden = !context.canEditStat;
  }

  if (statLabel) {
    statLabel.textContent = context.kind === "weapon" ? "Damage" : "Armor HP";
  }

  if (statRange && statNumber) {
    const maxStat = getItemEquipmentValueStatMax(context);

    setLinkedNumberInputBounds(statRange, statNumber, AUTO_EQUIPMENT_STAT_MIN, maxStat);
    statRange.value = `${context.stat ?? 0}`;
    statNumber.value = `${context.stat ?? 0}`;
    statRange.disabled = !context.canEditStat;
    statNumber.disabled = !context.canEditStat;
  }

  if (priceRow) {
    priceRow.hidden = !context.canEditPrice;
  }

  if (priceRange && priceNumber) {
    setLinkedNumberInputBounds(priceRange, priceNumber, 0, AUTO_EQUIPMENT_PRICE_MAX);
    priceRange.value = `${context.price ?? 0}`;
    priceNumber.value = `${context.price ?? 0}`;
    priceRange.disabled = !context.canEditPrice;
    priceNumber.disabled = !context.canEditPrice;
  }

  if (ids) {
    ids.textContent = context.idsText;
  }

  if (save) {
    save.disabled = !context.canSave;
  }

  if (status) {
    status.textContent = context.statusText;
  }
}

function getItemEquipmentValueStatMax(context: DebugItemEquipmentValueContext): number {
  return context.kind === "weapon" ? AUTO_EQUIPMENT_DAMAGE_MAX : AUTO_EQUIPMENT_ARMOR_MAX;
}

function getActiveItemEquipmentValueContext(): DebugItemEquipmentValueContext {
  const itemId = activeEquipmentItemId;

  if (!itemId) {
    return createEmptyItemEquipmentValueContext("Select a generated item.");
  }

  const record = getSelectedGeneratedEquipmentRecord(itemId);

  if (!record) {
    return createEmptyItemEquipmentValueContext("Selected item is not generated.");
  }

  if (getGeneratedEquipmentPairRole(record) === "front") {
    return {
      itemIds: [record.item.id],
      kind: record.item.kind,
      rarity: getHeroItemDefinitionRarity(record.item),
      idsText: record.item.id,
      statusText: "Front pair item: transform only. Select the back item for armor and price.",
      canEditRarity: false,
      canEditStat: false,
      canEditPrice: false,
      canSave: true,
    };
  }

  const shopProduct = getGeneratedShopProductForItem(itemId);

  if (shopProduct) {
    return {
      itemIds: shopProduct.itemIds,
      kind: shopProduct.kind,
      rarity: shopProduct.rarity,
      stat: shopProduct.stat,
      price: shopProduct.price,
      idsText: shopProduct.itemIds.join(" + "),
      statusText: shopProduct.itemIds.length === 2 ? "Shop pair: values save through the back item." : "Shop item.",
      canEditRarity: true,
      canEditStat: true,
      canEditPrice: true,
      canSave: true,
    };
  }

  const bossItem = getGeneratedBossItemForItem(itemId);

  if (bossItem) {
    return {
      itemIds: bossItem.itemIds,
      kind: bossItem.kind,
      rarity: bossItem.rarity,
      stat: bossItem.stat,
      idsText: bossItem.itemIds.join(" + "),
      statusText: bossItem.itemIds.length === 2 ? "Boss pair: armor saves through the back item." : "Boss item.",
      canEditRarity: false,
      canEditStat: true,
      canEditPrice: false,
      canSave: true,
    };
  }

  return {
    itemIds: [record.item.id],
    kind: record.item.kind,
    rarity: getHeroItemDefinitionRarity(record.item),
    idsText: record.item.id,
    statusText: "Generated item: transform only.",
    canEditRarity: false,
    canEditStat: false,
    canEditPrice: false,
    canSave: true,
  };
}

function createEmptyItemEquipmentValueContext(statusText: string): DebugItemEquipmentValueContext {
  return {
    itemIds: [],
    idsText: "No generated item selected.",
    statusText,
    canEditRarity: false,
    canEditStat: false,
    canEditPrice: false,
    canSave: false,
  };
}

function getGeneratedShopProductForItem(itemId: HeroItemId): DebugGeneratedShopProduct | undefined {
  return getGeneratedShopProducts().find((product) => product.itemIds.includes(itemId));
}

function getGeneratedBossItemForItem(itemId: HeroItemId): DebugGeneratedBossItem | undefined {
  return getGeneratedBossItems().find((item) => item.itemIds.includes(itemId));
}

function getGeneratedEquipmentPairRole(record: DebugGeneratedShopItemRecord): "back" | "front" | undefined {
  if (record.item.kind !== "armor" || !isEquipmentSlotKey(record.item.equipmentSlot)) {
    return undefined;
  }

  const pairConfig = getDebugShopItemPairConfig(record.item.equipmentSlot);

  if (!pairConfig) {
    return undefined;
  }

  return record.item.equipmentSlot === pairConfig.frontSlot ? "front" : "back";
}

function syncLinkedNumberInputs(range: HTMLInputElement, number: HTMLInputElement, min: number, max: number): void {
  setLinkedNumberInputBounds(range, number, min, max);

  const syncFromRange = (): void => {
    const value = clampNumber(Number(range.value), getInputMin(range), getInputMax(range));

    range.value = `${value}`;
    number.value = `${value}`;
  };
  const syncFromNumber = (): void => {
    const value = clampNumber(Number(number.value), getInputMin(number), getInputMax(number));

    range.value = `${value}`;
    number.value = `${value}`;
  };

  range.addEventListener("input", syncFromRange);
  number.addEventListener("input", syncFromNumber);
}

function setLinkedNumberInputBounds(range: HTMLInputElement, number: HTMLInputElement, min: number, max: number): void {
  range.min = `${min}`;
  number.min = `${min}`;
  range.max = `${max}`;
  number.max = `${max}`;

  const value = clampNumber(Number(number.value), min, max);

  range.value = `${value}`;
  number.value = `${value}`;
}

function getInputMin(input: HTMLInputElement): number {
  const min = Number(input.min);

  return Number.isFinite(min) ? min : 0;
}

function getInputMax(input: HTMLInputElement): number {
  const max = Number(input.max);

  return Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER;
}

function createHeroEquipmentOption(value: string, label: string, rarity?: HeroItemRarity): HTMLOptionElement {
  const option = document.createElement("option");

  option.value = value;
  option.textContent = label;

  if (rarity) {
    option.className = `debug-rarity-option debug-rarity-option--${rarity}`;
    option.dataset.rarity = rarity;
  }

  return option;
}

function syncModeTabs(panel: HTMLElement): void {
  const mode: DebugMode = document.body.classList.contains("debug-mode-arena")
    ? "arena"
    : document.body.classList.contains("debug-mode-hud")
      ? "hud"
      : document.body.classList.contains("debug-mode-animation")
        ? "animation"
        : document.body.classList.contains("debug-mode-city")
          ? "city"
          : document.body.classList.contains("debug-mode-ui")
            ? "ui"
            : document.body.classList.contains("debug-mode-effects")
              ? "effects"
              : "character";

  panel.querySelectorAll<HTMLButtonElement>("button[data-debug-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", `${button.dataset.debugMode === mode}`);
  });
}

function syncInputs(): void {
  document.querySelectorAll<HTMLInputElement>("input[data-debug-key]").forEach((input) => {
    const key = input.dataset.debugKey as keyof ArenaDebugTuning;
    const value = debugTuning[key];

    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = `${value}`;
    }
  });

  document.querySelectorAll<HTMLInputElement>("input[data-debug-number-key]").forEach((input) => {
    const key = input.dataset.debugNumberKey as keyof ArenaDebugTuning;
    const value = debugTuning[key];

    input.value = typeof value === "number" && !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });

  document.querySelectorAll<HTMLSelectElement>("select[data-debug-select-key]").forEach((select) => {
    const key = select.dataset.debugSelectKey as keyof ArenaDebugTuning;

    select.value = `${debugTuning[key]}`;
  });
}

function syncClassicActionButtonEditor(panel: HTMLElement): void {
  const modeSelect = panel.querySelector<HTMLSelectElement>("[data-classic-slot-mode]");
  const actionSelect = panel.querySelector<HTMLSelectElement>("[data-classic-slot-action]");
  const mode = debugTuning.selectedClassicActionWheelMode;
  const actionId = getClassicWheelActionButton(mode, debugTuning.selectedClassicActionButton);
  const slot = debugTuning.classicActionButtonSlots[mode][actionId];

  if (modeSelect) {
    modeSelect.value = mode;
  }

  if (actionSelect) {
    syncClassicActionSelectOptions(actionSelect, mode, actionId);
  }

  if (actionId !== debugTuning.selectedClassicActionButton) {
    updateDebugTuning({ selectedClassicActionButton: actionId });
    return;
  }

  panel.querySelectorAll<HTMLInputElement>("[data-classic-slot-field]").forEach((input) => {
    const field = input.dataset.classicSlotField;

    if (!isClassicSlotNumericKey(field)) {
      return;
    }

    input.value = `${slot[field]}`;
  });
}

function syncRigEditor(panel: HTMLElement): void {
  const select = panel.querySelector<HTMLSelectElement>(".debug-rig-editor__select");
  const workbenchSelect = document.querySelector<HTMLSelectElement>("[data-animation-workbench-part-select]");
  const rootTransformMode = document.querySelector<HTMLElement>("[data-animation-workbench-root-transform-mode]");
  const copyOpposite = panel.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-opposite");
  const reset = panel.querySelector<HTMLButtonElement>(".debug-rig-editor__reset");
  const workbenchReset = document.querySelector<HTMLButtonElement>("[data-animation-workbench-reset-part]");
  const selectedPart = debugTuning.selectedRigPart;
  const isRootMode = isRootCanvasMode();
  const isBodyArtMode = isBodyArtCanvasMode();
  const rigParts = getEditableRigParts();
  const bodyPartLayers = getEditableBodyPartLayers();
  const rootOffset = getEditableRootOffset();
  const poseOffset = getEditablePoseOffset();
  const isRootPoseMode = isRootMode && isRootPoseTransformMode();
  const isEditable = isRootMode ? (isRootPoseMode ? Boolean(poseOffset) : Boolean(rootOffset)) : isBodyArtMode || Boolean(rigParts);
  const selectedTuning = isRootMode
    ? isRootPoseMode
      ? createPoseOffsetRigTuning(poseOffset)
      : createRootRigTuning(rootOffset)
    : isBodyArtMode
    ? bodyPartLayers[selectedPart]
    : (rigParts ?? getActiveBodyPresetTuning().rigParts)[selectedPart];

  if (!select || !selectedTuning) {
    return;
  }

  select.value = selectedPart;

  if (workbenchSelect) {
    workbenchSelect.value = isRootMode ? ANIMATION_WORKBENCH_ROOT_SELECT_VALUE : selectedPart;
  }

  if (reset) {
    reset.disabled = !isEditable;
    reset.textContent = isRootMode ? (isRootPoseMode ? "Reset pose XY" : "Reset root") : isBodyArtMode ? "Reset art" : "Reset selected";
  }

  if (workbenchReset) {
    workbenchReset.disabled = !isEditable;
  }

  if (rootTransformMode) {
    rootTransformMode.hidden = !isRootMode;
    rootTransformMode.querySelectorAll<HTMLButtonElement>("[data-animation-workbench-root-transform-mode-option]").forEach((button) => {
      button.setAttribute("aria-pressed", `${button.dataset.animationWorkbenchRootTransformModeOption === debugTuning.animationRootTransformMode}`);
    });
  }

  if (copyOpposite) {
    const oppositePart = oppositeRigPartMap[selectedPart];

    copyOpposite.disabled = isRootMode || !oppositePart || !isEditable;
    copyOpposite.textContent = isRootMode ? "No opposite" : oppositePart ? `Copy ${oppositePart}` : "No opposite";
  }

  panel.querySelectorAll<HTMLButtonElement>("button[data-character-canvas-edit-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", `${button.dataset.characterCanvasEditMode === debugTuning.characterCanvasEditMode}`);
  });

  document.querySelectorAll<HTMLInputElement>("input[data-rig-key]").forEach((input) => {
    const key = input.dataset.rigKey as RigNumericControlKey;
    const control = getActiveRigNumericControlConfig(key);

    input.min = `${control.min}`;
    input.max = `${control.max}`;
    input.step = `${control.step}`;
    input.value = `${selectedTuning[key]}`;
    input.disabled = !isEditable || (isRootMode && key !== "x" && key !== "y");
  });

  document.querySelectorAll<HTMLInputElement>("input[data-rig-number-key]").forEach((input) => {
    const key = input.dataset.rigNumberKey as RigNumericControlKey;
    const value = selectedTuning[key];
    const control = getActiveRigNumericControlConfig(key);

    input.min = `${control.min}`;
    input.max = `${control.max}`;
    input.step = `${control.step}`;
    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
    input.disabled = !isEditable || (isRootMode && key !== "x" && key !== "y");
  });

  document.querySelectorAll<HTMLInputElement>("input[data-rig-toggle-key]").forEach((input) => {
    const key = input.dataset.rigToggleKey as RigToggleControlKey;

    input.checked = selectedTuning[key];
    input.disabled = !isEditable || isRootMode;
  });
}

function getActiveRigNumericControlConfig(key: RigNumericControlKey): RigNumericControlConfig {
  const control = rigNumericControls.find((item) => item.key === key) ?? { key, label: key, min: -480, max: 480, step: 1 };

  if (key === "angle" && isBodyArtCanvasMode()) {
    return { ...control, min: -180, max: 180 };
  }

  return control;
}

function syncFaceEditor(panel: HTMLElement): void {
  const faceEditor = panel.querySelector<HTMLElement>(".debug-rig-editor__face");
  const faceParts = getEditableFaceParts();
  const isEditable = Boolean(faceParts);

  if (faceEditor) {
    faceEditor.hidden = debugTuning.characterCanvasEditMode !== "parts" || debugTuning.selectedRigPart !== "head";
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-face-key]").forEach((input) => {
    const partKey = input.dataset.facePart;
    const key = input.dataset.faceKey as FaceNumericControlKey;

    if (!isFacePartKey(partKey)) {
      return;
    }

    input.value = `${(faceParts ?? getActiveBodyPresetTuning().faceParts)[partKey][key]}`;
    input.disabled = !isEditable;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-face-number-key]").forEach((input) => {
    const partKey = input.dataset.facePart;
    const key = input.dataset.faceNumberKey as FaceNumericControlKey;

    if (!isFacePartKey(partKey)) {
      return;
    }

    const value = (faceParts ?? getActiveBodyPresetTuning().faceParts)[partKey][key];
    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
    input.disabled = !isEditable;
  });
}

function syncFaceAssetEditor(panel: HTMLElement): void {
  const select = panel.querySelector<HTMLSelectElement>(".debug-face-editor__select");
  const appearanceSelect = panel.querySelector<HTMLSelectElement>(".debug-face-appearance-editor__select");
  const selectedLayer = debugTuning.selectedFaceAssetLayer;
  const selectedAppearanceLayer = debugTuning.selectedAppearanceLayer;
  const selectedTuning = getActiveBodyPresetTuning().faceAssetLayers[selectedLayer];
  const selectedAppearanceTuning = getActiveBodyPresetTuning().appearanceLayers[selectedAppearanceLayer];

  if (!select || !appearanceSelect || !selectedTuning || !selectedAppearanceTuning) {
    return;
  }

  select.value = selectedLayer;
  appearanceSelect.value = selectedAppearanceLayer;

  panel.querySelectorAll<HTMLInputElement>("input[data-face-asset-layer-key]").forEach((input) => {
    const key = input.dataset.faceAssetLayerKey as FaceAssetLayerNumericControlKey;

    input.value = `${selectedTuning[key]}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-face-asset-layer-number-key]").forEach((input) => {
    const key = input.dataset.faceAssetLayerNumberKey as FaceAssetLayerNumericControlKey;
    const value = selectedTuning[key];

    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-appearance-layer-key]").forEach((input) => {
    const key = input.dataset.appearanceLayerKey as AppearanceLayerNumericControlKey;

    input.value = `${selectedAppearanceTuning[key]}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-appearance-layer-number-key]").forEach((input) => {
    const key = input.dataset.appearanceLayerNumberKey as AppearanceLayerNumericControlKey;
    const value = selectedAppearanceTuning[key];

    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });
}

function syncEquipmentEditor(panel: HTMLElement): void {
  const equipmentSelect = panel.querySelector<HTMLSelectElement>(".debug-item-equipment__select");
  const typeFilter = panel.querySelector<HTMLSelectElement>(".debug-item-equipment__type-filter");
  const rarityFilter = panel.querySelector<HTMLSelectElement>(".debug-item-equipment__rarity-filter");
  const picker = panel.querySelector<HTMLElement>(".debug-item-equipment__picker");
  const empty = panel.querySelector<HTMLElement>(".debug-item-equipment__empty");
  const activeItemDefinition = getDebugHeroItemDefinition(activeEquipmentItemId);

  if (activeItemDefinition?.equipmentSlot !== activeEquipmentSlot) {
    activeEquipmentItemId = "";
  }

  const selectedEquipment = activeEquipmentItemId
    ? getCurrentEquipmentItemTuning(activeEquipmentItemId, activeEquipmentSlot)
    : getCurrentEquipmentSlotTuning(activeEquipmentSlot);
  const pairItem = getActiveEquipmentPairItem();

  if (equipmentSelect) {
    equipmentSelect.value = activeEquipmentSlot;
  }

  if (typeFilter) {
    syncDebugItemEquipmentTypeFilter(typeFilter, activeEquipmentSlot);
  }

  if (rarityFilter) {
    syncDebugItemEquipmentRarityFilter(rarityFilter, activeEquipmentSlot);
  }

  if (picker) {
    const itemIds = getFilteredDebugItemEquipmentIds(activeEquipmentSlot);
    const fallbackOption = createDebugItemEquipmentOption("", undefined, activeEquipmentItemId === "");
    const itemOptions = itemIds.map((itemId) => createDebugItemEquipmentOption(itemId, getDebugHeroItemDefinition(itemId), itemId === activeEquipmentItemId));

    picker.replaceChildren(fallbackOption, ...itemOptions);
    picker.dataset.selectedItem = activeEquipmentItemId;
  }

  if (empty) {
    const itemCount = getFilteredDebugItemEquipmentIds(activeEquipmentSlot).length;

    empty.textContent = itemCount === 0 ? "No items match current filters." : `${itemCount} items`;
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-equipment-key]").forEach((input) => {
    const key = input.dataset.equipmentKey as EquipmentNumericControlKey;

    input.value = `${selectedEquipment[key]}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-equipment-number-key]").forEach((input) => {
    const key = input.dataset.equipmentNumberKey as EquipmentNumericControlKey;
    const value = selectedEquipment[key];

    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-equipment-toggle-key]").forEach((input) => {
    const key = input.dataset.equipmentToggleKey as EquipmentToggleControlKey;

    input.checked = Boolean(selectedEquipment[key]);
  });

  panel.querySelectorAll<HTMLButtonElement>("button[data-equipment-copy-key]").forEach((button) => {
    button.disabled = !pairItem;
    button.title = pairItem ? `Copy from ${pairItem.name}` : "Select paired generated armor";
  });

  syncItemEquipmentValueEditor(panel);
}

function syncEffectsEditor(panel: HTMLElement): void {
  const slashSelect = panel.querySelector<HTMLSelectElement>(".debug-effects__slash-select");
  const start = panel.querySelector<HTMLButtonElement>(".debug-effects__start");
  const stop = panel.querySelector<HTMLButtonElement>(".debug-effects__stop");
  const selectedSlashArc = debugTuning.slashArcs[debugTuning.selectedSlashArc] ?? DEFAULT_SLASH_ARCS[debugTuning.selectedSlashArc];
  const canPreview = Boolean(previewSlashArc);

  if (slashSelect) {
    slashSelect.value = debugTuning.selectedSlashArc;
  }

  if (start) {
    start.disabled = !canPreview || isSlashPreviewLoopRunning;
    start.textContent = isSlashPreviewLoopRunning ? "Running" : "Start";
  }

  if (stop) {
    stop.disabled = !isSlashPreviewLoopRunning;
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-slash-arc-key]").forEach((input) => {
    const key = input.dataset.slashArcKey as SlashArcNumericControlKey;

    input.value = `${selectedSlashArc[key]}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-slash-arc-number-key]").forEach((input) => {
    const key = input.dataset.slashArcNumberKey as SlashArcNumericControlKey;
    const value = selectedSlashArc[key];

    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });
}

function syncAnimationEditor(panel: HTMLElement): void {
  const animation = getSelectedBodyAnimation();
  const animationSlot = getSelectedBodyAnimationSlot();
  const animationSelect = panel.querySelector<HTMLSelectElement>(".debug-rig-editor__animation-select");
  const workbenchAnimationSelect = document.querySelector<HTMLSelectElement>("[data-animation-workbench-select]");
  const workbenchVariantSelect = document.querySelector<HTMLSelectElement>("[data-animation-workbench-variant-select]");
  const newVariant = document.querySelector<HTMLButtonElement>("[data-animation-workbench-variant-new]");
  const duplicateVariant = document.querySelector<HTMLButtonElement>("[data-animation-workbench-variant-duplicate]");
  const deleteVariant = document.querySelector<HTMLButtonElement>("[data-animation-workbench-variant-delete]");
  const variantWeight = document.querySelector<HTMLInputElement>("[data-animation-workbench-variant-weight]");
  const variantAllWeapons = document.querySelector<HTMLInputElement>("[data-animation-workbench-variant-all-weapons]");
  const enabled = panel.querySelector<HTMLInputElement>("input[data-animation-enabled]");
  const workbenchEnabled = document.querySelector<HTMLInputElement>("[data-animation-workbench-enabled]");
  const duration = panel.querySelector<HTMLInputElement>("input[data-animation-duration]");
  const durationNumber = panel.querySelector<HTMLInputElement>("input[data-animation-duration-number]");
  const workbenchDuration = document.querySelector<HTMLInputElement>("[data-animation-workbench-duration]");
  const workbenchProgress = document.querySelector<HTMLInputElement>("[data-animation-workbench-progress]");
  const workbenchTime = document.querySelector<HTMLOutputElement>("[data-animation-workbench-time]");
  const workbenchPlay = document.querySelector<HTMLButtonElement>("[data-animation-workbench-play]");
  const workbenchPlaybackSpeed = document.querySelector<HTMLSelectElement>("[data-animation-workbench-speed]");
  const workbenchRandomWeapon = document.querySelector<HTMLInputElement>("[data-animation-workbench-random-weapon]");
  const workbenchWeaponDrag = document.querySelector<HTMLInputElement>("[data-animation-workbench-weapon-drag]");
  const workbenchResetWeapon = document.querySelector<HTMLButtonElement>("[data-animation-workbench-reset-weapon]");
  const workbenchWeaponMirrorX = document.querySelector<HTMLInputElement>("[data-animation-workbench-weapon-mirror-x]");
  const workbenchWeaponMirrorY = document.querySelector<HTMLInputElement>("[data-animation-workbench-weapon-mirror-y]");
  const workbenchCastPropPanel = document.querySelector<HTMLElement>("[data-animation-workbench-cast-prop-panel]");
  const workbenchCastPropVisible = document.querySelector<HTMLInputElement>("[data-animation-workbench-cast-prop-visible]");
  const workbenchCastPropAsset = document.querySelector<HTMLSelectElement>("[data-animation-workbench-cast-prop-asset]");
  const workbenchKeyframes = document.querySelector<HTMLElement>("[data-animation-workbench-keyframes]");
  const workbenchSelectedKey = document.querySelector<HTMLOutputElement>("[data-animation-workbench-selected-key]");
  const workbenchEasing = document.querySelector<HTMLSelectElement>("[data-animation-workbench-easing]");
  const resetPose = document.querySelector<HTMLButtonElement>("[data-animation-workbench-reset-pose]");
  const applyPoseButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-animation-workbench-apply-to-pose]")];
  const setStartKeyframe = document.querySelector<HTMLButtonElement>("[data-animation-workbench-set-start]");
  const setImpactKeyframe = document.querySelector<HTMLButtonElement>("[data-animation-workbench-set-impact]");
  const deleteKeyframe = document.querySelector<HTMLButtonElement>("[data-animation-workbench-delete-keyframe]");

  if (animationSelect) {
    animationSelect.value = debugTuning.selectedBodyAnimation;
  }

  if (workbenchAnimationSelect) {
    workbenchAnimationSelect.value = debugTuning.selectedBodyAnimation;
  }

  if (workbenchVariantSelect) {
    const options = getBodyAnimationVariantOptions(animationSlot);
    const selectedVariantId = options.some((variant) => variant.variantId === debugTuning.selectedBodyAnimationVariantId)
      ? debugTuning.selectedBodyAnimationVariantId
      : BODY_ANIMATION_DEFAULT_VARIANT_ID;

    workbenchVariantSelect.replaceChildren(
      ...options.map((variant) => {
        const option = document.createElement("option");
        const variantId = variant.variantId ?? BODY_ANIMATION_DEFAULT_VARIANT_ID;

        option.value = variantId;
        option.textContent = variant.variantLabel ?? variantId;

        return option;
      }),
    );
    workbenchVariantSelect.value = selectedVariantId;
  }

  if (newVariant) {
    newVariant.disabled = false;
  }

  if (duplicateVariant) {
    duplicateVariant.disabled = false;
  }

  if (deleteVariant) {
    deleteVariant.disabled = debugTuning.selectedBodyAnimationVariantId === BODY_ANIMATION_DEFAULT_VARIANT_ID;
  }

  if (variantWeight) {
    variantWeight.value = `${animation.variantWeight ?? 1}`;
  }

  if (variantAllWeapons) {
    variantAllWeapons.checked = animation.appliesToAllWeapons ?? true;
  }

  document.querySelectorAll<HTMLInputElement>("input[data-animation-variant-weapon]").forEach((input) => {
    const weaponClass = input.dataset.animationVariantWeapon as BodyAnimationWeaponClass;
    const allWeapons = animation.appliesToAllWeapons ?? true;

    input.checked = (animation.weaponClasses ?? []).includes(weaponClass);
    input.disabled = allWeapons;
  });

  if (enabled) {
    enabled.checked = animation.enabled;
  }

  if (workbenchEnabled) {
    workbenchEnabled.checked = animation.enabled;
  }

  if (duration) {
    duration.value = `${animation.duration}`;
  }

  if (durationNumber) {
    durationNumber.value = `${animation.duration}`;
  }

  if (workbenchDuration) {
    workbenchDuration.value = `${animation.duration}`;
  }

  if (workbenchProgress) {
    workbenchProgress.value = `${Math.round(debugTuning.animationPreviewProgress * 1000)}`;
  }

  if (workbenchTime) {
    const playheadMs = Math.round(debugTuning.animationPreviewProgress * animation.duration);

    workbenchTime.value = `${playheadMs} ms / ${animation.duration} ms`;
  }

  if (workbenchPlay) {
    const isPlaying = animationWorkbenchPlaybackFrame !== undefined;

    workbenchPlay.textContent = isPlaying ? "Pause" : "Play";
    workbenchPlay.setAttribute("aria-pressed", `${isPlaying}`);
  }

  if (workbenchPlaybackSpeed) {
    workbenchPlaybackSpeed.value = `${clampAnimationWorkbenchPlaybackSpeed(debugTuning.animationPreviewPlaybackSpeed)}`;
  }

  if (workbenchRandomWeapon) {
    workbenchRandomWeapon.checked = debugTuning.animationPreviewRandomWeapon;
  }

  if (workbenchWeaponDrag) {
    workbenchWeaponDrag.checked = debugTuning.animationWeaponDragEnabled;
  }

  if (workbenchResetWeapon) {
    workbenchResetWeapon.disabled = getAnimationWorkbenchPreviewWeaponTuningTargets().length === 0;
  }

  syncAnimationWorkbenchKeyframes(
    animation,
    workbenchKeyframes,
    workbenchSelectedKey,
    workbenchEasing,
    resetPose,
    applyPoseButtons,
    setStartKeyframe,
    setImpactKeyframe,
    deleteKeyframe,
    workbenchWeaponMirrorX,
    workbenchWeaponMirrorY,
  );
  syncAnimationWorkbenchCastProp(workbenchCastPropPanel, workbenchCastPropVisible, workbenchCastPropAsset);

  document.querySelectorAll<HTMLButtonElement>("button[data-animation-edit-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", `${button.dataset.animationEditMode === debugTuning.animationEditMode}`);
  });

  document.querySelectorAll<HTMLInputElement>("input[data-animation-part-key]").forEach((input) => {
    const partKey = input.dataset.animationPartKey as RigPartKey;

    input.checked = animation.activeParts[partKey];
  });
}

function syncAnimationWorkbenchKeyframes(
  animation: BodyAnimationTuning,
  keyframesRail: HTMLElement | null,
  selectedKeyOutput: HTMLOutputElement | null,
  easing: HTMLSelectElement | null,
  resetPose: HTMLButtonElement | null,
  applyPoseButtons: HTMLButtonElement[],
  setStartKeyframe: HTMLButtonElement | null,
  setImpactKeyframe: HTMLButtonElement | null,
  deleteKeyframe: HTMLButtonElement | null,
  weaponMirrorX: HTMLInputElement | null,
  weaponMirrorY: HTMLInputElement | null,
): void {
  const keyframes = getAnimationKeyframes(animation);
  const selectedKeyframe = getSelectedAnimationKeyframe(animation);
  const startKeyframe = getAnimationStartKeyframe(animation);
  const impactKeyframe = getAnimationImpactKeyframe(animation);
  const duration = Math.max(1, animation.duration);

  if (keyframesRail) {
    const startMarker = document.createElement("span");
    const impactMarker = document.createElement("span");
    const startProgress = startKeyframe ? clampNumber(startKeyframe.time / duration, 0, 1) : undefined;
    const impactProgress = impactKeyframe ? clampNumber(impactKeyframe.time / duration, 0, 1) : undefined;

    startMarker.className = "debug-animation-editor__start-marker";
    startMarker.style.left = `${(startProgress ?? 0) * 100}%`;
    startMarker.title = startKeyframe
      ? `Move start ${formatAnimationKeyframeLabel(startKeyframe)} ${Math.round(startKeyframe.time)} ms`
      : "Move start not set";
    startMarker.setAttribute("aria-hidden", "true");
    startMarker.hidden = !startKeyframe;

    impactMarker.className = "debug-animation-editor__impact-marker";
    impactMarker.style.left = `${(impactProgress ?? 0) * 100}%`;
    impactMarker.title = impactKeyframe
      ? `Impact ${formatAnimationKeyframeLabel(impactKeyframe)} ${Math.round(impactKeyframe.time)} ms`
      : "Impact not set";
    impactMarker.setAttribute("aria-hidden", "true");
    impactMarker.hidden = !impactKeyframe;

    keyframesRail.replaceChildren(
      startMarker,
      impactMarker,
      ...keyframes.map((keyframe) => {
        const button = document.createElement("button");
        const progress = clampNumber(keyframe.time / duration, 0, 1);
        const isStartKeyframe = keyframe.id === startKeyframe?.id;
        const isImpactKeyframe = keyframe.id === impactKeyframe?.id;

        button.type = "button";
        button.className = `debug-animation-editor__keyframe${
          isProtectedAnimationKeyframe(keyframe.id) ? " debug-animation-editor__keyframe--anchor" : " debug-animation-editor__keyframe--custom"
        }${isMovableAnimationKeyframe(keyframe.id) ? " debug-animation-editor__keyframe--draggable" : ""}${
          isStartKeyframe ? " debug-animation-editor__keyframe--start" : ""
        }${isImpactKeyframe ? " debug-animation-editor__keyframe--impact" : ""}`;
        button.dataset.animationKeyframeId = keyframe.id;
        button.style.left = `${progress * 100}%`;
        button.textContent = keyframe.id === "pose-a" ? "A" : keyframe.id === "pose-b" ? "B" : isImpactKeyframe ? "!" : isStartKeyframe ? "S" : "";
        button.title = `${keyframe.id} ${Math.round(progress * 100)}%${isStartKeyframe ? " move start" : ""}${isImpactKeyframe ? " impact" : ""}`;
        button.setAttribute("aria-label", button.title);
        button.setAttribute("aria-pressed", `${keyframe.id === selectedKeyframe?.id}`);

        return button;
      }),
    );
  }

  if (selectedKeyOutput) {
    const startText = startKeyframe ? ` | Move start: ${formatAnimationKeyframeLabel(startKeyframe)} ${Math.round(startKeyframe.time)} ms` : " | Move start: unset";
    const impactText = impactKeyframe ? ` | Impact: ${formatAnimationKeyframeLabel(impactKeyframe)} ${Math.round(impactKeyframe.time)} ms` : " | Impact: unset";

    selectedKeyOutput.value = selectedKeyframe
      ? `Selected: ${formatAnimationKeyframeLabel(selectedKeyframe)} | ${Math.round(selectedKeyframe.time)} ms | ${selectedKeyframe.easing}${startText}${impactText}`
      : `Selected: none${startText}${impactText}`;
  }

  if (easing) {
    const easingKeyframe = getAnimationWorkbenchEasingKeyframe(animation, selectedKeyframe);

    easing.value = easingKeyframe?.easing ?? selectedKeyframe?.easing ?? "easeInOut";
    easing.disabled = !easingKeyframe;
  }

  if (resetPose) {
    const poseId = getResettableAnimationPoseId();

    resetPose.disabled = !poseId;
    resetPose.textContent = poseId === "pose-a" ? "Reset Pose A" : poseId === "pose-b" ? "Reset Pose B" : "Reset Pose";
  }

  applyPoseButtons.forEach((button) => {
    const targetPoseId = button.dataset.animationWorkbenchApplyToPose;
    const isTargetPose = targetPoseId === "pose-a" || targetPoseId === "pose-b";

    button.disabled = !selectedKeyframe || debugTuning.animationEditMode === "preview" || !isTargetPose || selectedKeyframe.id === targetPoseId;
  });

  if (setStartKeyframe) {
    setStartKeyframe.disabled = !selectedKeyframe || debugTuning.animationEditMode === "preview" || selectedKeyframe.id === startKeyframe?.id;
  }

  if (setImpactKeyframe) {
    setImpactKeyframe.disabled = !selectedKeyframe || debugTuning.animationEditMode === "preview" || selectedKeyframe.id === impactKeyframe?.id;
  }

  if (deleteKeyframe) {
    deleteKeyframe.disabled = (!selectedKeyframe || isProtectedAnimationKeyframe(selectedKeyframe.id))
      && !findEditableAnimationKeyframeAtProgress(animation, debugTuning.animationPreviewProgress);
  }

  if (weaponMirrorX) {
    weaponMirrorX.checked = selectedKeyframe?.weaponMirrorX ?? false;
    weaponMirrorX.disabled = !selectedKeyframe || debugTuning.animationEditMode === "preview";
  }

  if (weaponMirrorY) {
    weaponMirrorY.checked = selectedKeyframe?.weaponMirrorY ?? false;
    weaponMirrorY.disabled = !selectedKeyframe || debugTuning.animationEditMode === "preview";
  }
}

function syncAnimationWorkbenchCastProp(
  panel: HTMLElement | null,
  visibleInput: HTMLInputElement | null,
  assetSelect: HTMLSelectElement | null,
): void {
  const castProp = getEditableAnimationCastProp();
  const canEdit = Boolean(castProp);

  if (panel) {
    panel.hidden = debugTuning.selectedBodyAnimation !== "scrollCast";
  }

  if (visibleInput) {
    visibleInput.checked = castProp?.visible ?? false;
    visibleInput.disabled = !canEdit;
  }

  if (assetSelect) {
    assetSelect.value = castProp?.assetKey ?? DEFAULT_SCROLL_CAST_PROP_ASSET_KEY;
    assetSelect.disabled = !canEdit;
  }

  document.querySelectorAll<HTMLInputElement>("input[data-animation-cast-prop-key]").forEach((input) => {
    const key = input.dataset.animationCastPropKey as AnimationCastPropNumericControlKey;
    const value = castProp?.[key] ?? defaultBodyAnimationCastProp[key];
    const control = getAnimationCastPropNumericControlConfig(key);

    input.min = `${control.min}`;
    input.max = `${control.max}`;
    input.step = `${control.step}`;
    input.value = `${value}`;
    input.disabled = !canEdit;
  });

  document.querySelectorAll<HTMLInputElement>("input[data-animation-cast-prop-number-key]").forEach((input) => {
    const key = input.dataset.animationCastPropNumberKey as AnimationCastPropNumericControlKey;
    const value = castProp?.[key] ?? defaultBodyAnimationCastProp[key];
    const control = getAnimationCastPropNumericControlConfig(key);

    input.min = `${control.min}`;
    input.max = `${control.max}`;
    input.step = `${control.step}`;
    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
    input.disabled = !canEdit;
  });

  document.querySelectorAll<HTMLInputElement>("input[data-animation-cast-prop-toggle-key]").forEach((input) => {
    const key = input.dataset.animationCastPropToggleKey as AnimationCastPropToggleControlKey;

    input.checked = castProp?.[key] ?? defaultBodyAnimationCastProp[key];
    input.disabled = !canEdit;
  });
}

function getAnimationImpactKeyframe(animation: BodyAnimationTuning): BodyAnimationKeyframe | undefined {
  const impactKeyframeId = animation.impactKeyframeId;

  if (!impactKeyframeId) {
    return undefined;
  }

  return getAnimationKeyframes(animation).find((keyframe) => keyframe.id === impactKeyframeId);
}

function getAnimationStartKeyframe(animation: BodyAnimationTuning): BodyAnimationKeyframe | undefined {
  const startKeyframeId = animation.movementStartKeyframeId;

  if (!startKeyframeId) {
    return undefined;
  }

  return getAnimationKeyframes(animation).find((keyframe) => keyframe.id === startKeyframeId);
}

function formatAnimationKeyframeLabel(keyframe: BodyAnimationKeyframe): string {
  if (keyframe.id === "pose-a") {
    return "Pose A";
  }

  if (keyframe.id === "pose-b") {
    return "Pose B";
  }

  return keyframe.id;
}

function syncGrid(): void {
  const grid = document.querySelector<HTMLElement>(".debug-grid");

  if (!grid) {
    return;
  }

  grid.hidden = !debugTuning.showGrid;
  grid.style.setProperty("--debug-grid-step", `${debugTuning.gridStep}px`);
  grid.style.setProperty("--debug-grid-opacity", `${debugTuning.gridOpacity}`);
  grid.style.setProperty("--debug-origin-x", `${debugTuning.originX}px`);
  grid.style.setProperty("--debug-origin-y", `${debugTuning.originY}px`);
}
