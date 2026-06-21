import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import sharp from "sharp";
import { defineConfig, type Plugin } from "vite";

const arenaLayoutUrl = new URL("./src/arenaLayout.ts", import.meta.url);
const combatUrl = new URL("./src/combat.ts", import.meta.url);
const debugTuningUrl = new URL("./src/debugTuning.ts", import.meta.url);
const uiLayoutTuningUrl = new URL("./src/uiLayoutTuning.ts", import.meta.url);
const settingsMenuUrl = new URL("./src/settingsMenu.ts", import.meta.url);
const generatedEquipmentJsonUrl = new URL("./src/generated/equipmentItems.generated.json", import.meta.url);
const generatedEquipmentTsUrl = new URL("./src/generated/equipmentItems.generated.ts", import.meta.url);
const generatedArenaBossesJsonUrl = new URL("./src/generated/arenaBosses.generated.json", import.meta.url);
const generatedArenaBossesTsUrl = new URL("./src/generated/arenaBosses.generated.ts", import.meta.url);
const generatedArenaTiersJsonUrl = new URL("./src/generated/arenaTiers.generated.json", import.meta.url);
const generatedArenaTiersTsUrl = new URL("./src/generated/arenaTiers.generated.ts", import.meta.url);
const promotedEquipmentRuntimeWebpQuality = 86;
const promotedEquipmentLowWebpQuality = 76;
const promotedEquipmentLowMaxSide = 448;
const promotedEquipmentShopIconSize = 160;
const promotedEquipmentShopIconContentSize = 136;
const promotedEquipmentShopIconWebpQuality = 88;
const promotedEquipmentMaxArmorHp = 200;
const promotedEquipmentMaxDamageBonus = 100;
const promotedEquipmentMaxPrice = 2000;
const generatedEquipmentMaxArmorHp = 10000;
const generatedEquipmentMaxDamageBonus = 10000;
const generatedEquipmentMaxPrice = 100000;
const transparentBackground = { r: 0, g: 0, b: 0, alpha: 0 } as const;
const promotedEquipmentResizeRules = [
  { maxSide: 768, pattern: /^assets\/fighters\/armor\/helmet\// },
  { maxSide: 512, pattern: /^assets\/fighters\/armor\/arms\// },
  { maxSide: 512, pattern: /^assets\/fighters\/armor\/breastplate\// },
  { maxSide: 512, pattern: /^assets\/fighters\/armor\/legs\// },
  { maxSide: 512, pattern: /^assets\/fighters\/weapons\// },
] as const;

const prodDefaultFields = {
  DEFAULT_STAGE_ORIGIN_X: "originX",
  DEFAULT_STAGE_ORIGIN_Y: "originY",
  DEFAULT_PLAYER_STAGE_X: "playerStageX",
  DEFAULT_PLAYER_STAGE_Y: "playerStageY",
  DEFAULT_ENEMY_STAGE_X: "enemyStageX",
  DEFAULT_ENEMY_STAGE_Y: "enemyStageY",
  DEFAULT_PLAYER_SCALE: "playerScale",
  DEFAULT_ENEMY_SCALE: "enemyScale",
  DEFAULT_ACTION_ARC_ROTATION: "actionArcRotation",
  DEFAULT_ACTION_ARC_RADIUS: "actionArcRadius",
  DEFAULT_ACTION_ARC_OFFSET_X: "actionArcOffsetX",
  DEFAULT_ACTION_ARC_OFFSET_Y: "actionArcOffsetY",
  DEFAULT_ACTION_BUTTON_SCALE: "actionButtonScale",
  DEFAULT_ACTION_ICON_SCALE: "actionIconScale",
  DEFAULT_ACTION_ATTACK_ICON_SCALE: "actionAttackIconScale",
  DEFAULT_ACTION_LIGHT_ICON_SCALE: "actionLightIconScale",
  DEFAULT_ACTION_MEDIUM_ICON_SCALE: "actionMediumIconScale",
  DEFAULT_ACTION_HEAVY_ICON_SCALE: "actionHeavyIconScale",
  DEFAULT_ACTION_LIGHT_ICON_ROTATION: "actionLightIconRotation",
  DEFAULT_ACTION_MEDIUM_ICON_ROTATION: "actionMediumIconRotation",
  DEFAULT_ACTION_HEAVY_ICON_ROTATION: "actionHeavyIconRotation",
  DEFAULT_ACTION_LIGHT_ICON_BRIGHTNESS: "actionLightIconBrightness",
  DEFAULT_ACTION_MEDIUM_ICON_BRIGHTNESS: "actionMediumIconBrightness",
  DEFAULT_ACTION_HEAVY_ICON_BRIGHTNESS: "actionHeavyIconBrightness",
  DEFAULT_ACTION_TOKEN_RING_WIDTH: "actionTokenRingWidth",
  DEFAULT_ACTION_TOKEN_FACE_INSET: "actionTokenFaceInset",
  DEFAULT_ACTION_TOKEN_RIM_SHINE: "actionTokenRimShine",
  DEFAULT_ACTION_TOKEN_OUTER_SHINE: "actionTokenOuterShine",
  DEFAULT_ACTION_TOKEN_FACE_SHINE: "actionTokenFaceShine",
  DEFAULT_ACTION_TOKEN_INNER_SHINE: "actionTokenInnerShine",
  DEFAULT_ACTION_TOKEN_STRIPE_SHINE: "actionTokenStripeShine",
  DEFAULT_CLASSIC_HUD_OFFSET_X: "classicHudOffsetX",
  DEFAULT_CLASSIC_HUD_OFFSET_Y: "classicHudOffsetY",
  DEFAULT_CLASSIC_HUD_SCALE: "classicHudScale",
  DEFAULT_CLASSIC_HUD_SAFE_OFFSET: "classicHudSafeOffset",
  DEFAULT_HUD_BOTTOM_OFFSET: "hudBottomOffset",
  DEFAULT_HUD_SIDE_INSET: "hudSideInset",
  DEFAULT_HUD_SCALE: "hudScale",
  DEFAULT_HUD_FLASK_GAP: "hudFlaskGap",
  DEFAULT_HUD_NAME_GAP: "hudNameGap",
  DEFAULT_HUD_SAFE_GAP_RATIO: "hudSafeGapRatio",
  DEFAULT_HUD_SAFE_MIN_GAP: "hudSafeMinGap",
  DEFAULT_FIGHTER_HUD_GAP: "fighterHudGap",
  DEFAULT_CAMERA_FEET_SCREEN_Y: "cameraFeetScreenY",
  DEFAULT_CAMERA_CLOSE_FEET_SHIFT_Y: "cameraCloseFeetShiftY",
  DEFAULT_CAMERA_FEET_MIN_SCREEN_RATIO: "cameraFeetMinScreenRatio",
  DEFAULT_FORWARD_MOVE_DISTANCE: "forwardMoveDistance",
  DEFAULT_BACK_MOVE_DISTANCE: "backMoveDistance",
  DEFAULT_LUNGE_MOVE_DISTANCE: "lungeMoveDistance",
  DEFAULT_ACTION_FORWARD_ANGLE: "actionForwardArcAngle",
  DEFAULT_ACTION_BACK_ANGLE: "actionBackArcAngle",
  DEFAULT_ACTION_LUNGE_ANGLE: "actionLungeArcAngle",
  DEFAULT_ACTION_LIGHT_ANGLE: "actionLightArcAngle",
  DEFAULT_ACTION_MEDIUM_ANGLE: "actionMediumArcAngle",
  DEFAULT_ACTION_HEAVY_ANGLE: "actionHeavyArcAngle",
  DEFAULT_ACTION_TAUNT_ANGLE: "actionTauntArcAngle",
  DEFAULT_ACTION_REST_ANGLE: "actionRestArcAngle",
} as const;

type ProdDefaultConstant = keyof typeof prodDefaultFields;
type ProdDefaultPayload = Record<(typeof prodDefaultFields)[ProdDefaultConstant], unknown>;
type ProdDefaultUpdates = Record<ProdDefaultConstant, number>;

const combatDefaultFields = {
  DEFAULT_FORWARD_MOVE_DISTANCE: "forwardMoveDistance",
  DEFAULT_BACK_MOVE_DISTANCE: "backMoveDistance",
  DEFAULT_LUNGE_MOVE_DISTANCE: "lungeMoveDistance",
} as const;

type CombatDefaultConstant = keyof typeof combatDefaultFields;
type CombatDefaultPayload = Record<(typeof combatDefaultFields)[CombatDefaultConstant], unknown>;
type CombatDefaultUpdates = Record<CombatDefaultConstant, number>;

const debugTuningDefaultFields = {
  cityHeroX: "cityHeroX",
  cityHeroY: "cityHeroY",
  cityHeroScale: "cityHeroScale",
  armoryBackgroundOffsetX: "armoryBackgroundOffsetX",
  armoryBackgroundOffsetY: "armoryBackgroundOffsetY",
  armoryBackgroundScale: "armoryBackgroundScale",
  heroPortraitButtonX: "heroPortraitButtonX",
  heroPortraitButtonY: "heroPortraitButtonY",
  heroPortraitButtonScale: "heroPortraitButtonScale",
  shadowOffsetX: "shadowOffsetX",
  shadowOffsetY: "shadowOffsetY",
  shadowScaleX: "shadowScaleX",
  shadowScaleY: "shadowScaleY",
  shadowAlpha: "shadowAlpha",
  popupOffsetY: "popupOffsetY",
  damagePopupOffsetY: "damagePopupOffsetY",
  blockPopupOffsetY: "blockPopupOffsetY",
  popupScale: "popupScale",
  damagePopupScale: "damagePopupScale",
  blockPopupScale: "blockPopupScale",
  armorAbsorbPopupOffsetY: "armorAbsorbPopupOffsetY",
  armorBreakPopupOffsetY: "armorBreakPopupOffsetY",
  armorAbsorbPopupScale: "armorAbsorbPopupScale",
  armorBreakPopupScale: "armorBreakPopupScale",
  arenaTier1BackFollowX: "arenaTier1BackFollowX",
  arenaTier1BackFollowY: "arenaTier1BackFollowY",
  arenaTier1BackZoom: "arenaTier1BackZoom",
  arenaTier1BackLookUpY: "arenaTier1BackLookUpY",
  arenaTier1MidFollowX: "arenaTier1MidFollowX",
  arenaTier1MidFollowY: "arenaTier1MidFollowY",
  arenaTier1MidZoom: "arenaTier1MidZoom",
  arenaTier1MidLookUpY: "arenaTier1MidLookUpY",
  arenaTier1MidZoomDarken: "arenaTier1MidZoomDarken",
  arenaTier1GroundFollowX: "arenaTier1GroundFollowX",
  arenaTier1GroundFollowY: "arenaTier1GroundFollowY",
  arenaTier1GroundZoom: "arenaTier1GroundZoom",
  arenaTier1GroundLookUpY: "arenaTier1GroundLookUpY",
  arenaTier2BackFollowX: "arenaTier2BackFollowX",
  arenaTier2BackFollowY: "arenaTier2BackFollowY",
  arenaTier2BackZoom: "arenaTier2BackZoom",
  arenaTier2BackLookUpY: "arenaTier2BackLookUpY",
  arenaTier2MidFollowX: "arenaTier2MidFollowX",
  arenaTier2MidFollowY: "arenaTier2MidFollowY",
  arenaTier2MidZoom: "arenaTier2MidZoom",
  arenaTier2MidLookUpY: "arenaTier2MidLookUpY",
  arenaTier2MidZoomDarken: "arenaTier2MidZoomDarken",
  arenaTier2GroundFollowX: "arenaTier2GroundFollowX",
  arenaTier2GroundFollowY: "arenaTier2GroundFollowY",
  arenaTier2GroundZoom: "arenaTier2GroundZoom",
  arenaTier2GroundLookUpY: "arenaTier2GroundLookUpY",
  arenaTier2FrontFollowX: "arenaTier2FrontFollowX",
  arenaTier2FrontFollowY: "arenaTier2FrontFollowY",
  arenaTier2FrontZoom: "arenaTier2FrontZoom",
  arenaTier2FrontLookUpY: "arenaTier2FrontLookUpY",
  arenaTier2AmbientFollowX: "arenaTier2AmbientFollowX",
  arenaTier2AmbientFollowY: "arenaTier2AmbientFollowY",
  arenaTier2AmbientZoom: "arenaTier2AmbientZoom",
  arenaTier2AmbientLookUpY: "arenaTier2AmbientLookUpY",
  arenaTier2AmbientFarAlpha: "arenaTier2AmbientFarAlpha",
  arenaTier2AmbientNearAlpha: "arenaTier2AmbientNearAlpha",
  arenaTier1BackgroundBackX: "arenaTier1BackgroundBackX",
  arenaTier1BackgroundBackY: "arenaTier1BackgroundBackY",
  arenaTier1BackgroundBackScale: "arenaTier1BackgroundBackScale",
  arenaTier1BackgroundBackAlpha: "arenaTier1BackgroundBackAlpha",
  arenaTier1BackgroundMidX: "arenaTier1BackgroundMidX",
  arenaTier1BackgroundMidY: "arenaTier1BackgroundMidY",
  arenaTier1BackgroundMidScale: "arenaTier1BackgroundMidScale",
  arenaTier1BackgroundMidAlpha: "arenaTier1BackgroundMidAlpha",
  arenaTier1BackgroundGroundX: "arenaTier1BackgroundGroundX",
  arenaTier1BackgroundGroundY: "arenaTier1BackgroundGroundY",
  arenaTier1BackgroundGroundScale: "arenaTier1BackgroundGroundScale",
  arenaTier1BackgroundGroundAlpha: "arenaTier1BackgroundGroundAlpha",
  arenaTier2BackgroundBackX: "arenaTier2BackgroundBackX",
  arenaTier2BackgroundBackY: "arenaTier2BackgroundBackY",
  arenaTier2BackgroundBackScale: "arenaTier2BackgroundBackScale",
  arenaTier2BackgroundBackAlpha: "arenaTier2BackgroundBackAlpha",
  arenaTier2BackgroundMidX: "arenaTier2BackgroundMidX",
  arenaTier2BackgroundMidY: "arenaTier2BackgroundMidY",
  arenaTier2BackgroundMidScale: "arenaTier2BackgroundMidScale",
  arenaTier2BackgroundMidAlpha: "arenaTier2BackgroundMidAlpha",
  arenaTier2BackgroundGroundX: "arenaTier2BackgroundGroundX",
  arenaTier2BackgroundGroundY: "arenaTier2BackgroundGroundY",
  arenaTier2BackgroundGroundScale: "arenaTier2BackgroundGroundScale",
  arenaTier2BackgroundGroundAlpha: "arenaTier2BackgroundGroundAlpha",
  arenaTier2BackgroundFrontX: "arenaTier2BackgroundFrontX",
  arenaTier2BackgroundFrontY: "arenaTier2BackgroundFrontY",
  arenaTier2BackgroundFrontScale: "arenaTier2BackgroundFrontScale",
  arenaTier2BackgroundFrontAlpha: "arenaTier2BackgroundFrontAlpha",
  arenaTier2BackgroundAmbientX: "arenaTier2BackgroundAmbientX",
  arenaTier2BackgroundAmbientY: "arenaTier2BackgroundAmbientY",
  arenaTier2BackgroundAmbientScale: "arenaTier2BackgroundAmbientScale",
  arenaTier2BackgroundAmbientAlpha: "arenaTier2BackgroundAmbientAlpha",
} as const;

type DebugTuningDefaultField = keyof typeof debugTuningDefaultFields;
type DebugTuningDefaultPayload = Record<(typeof debugTuningDefaultFields)[DebugTuningDefaultField], unknown>;
type DebugTuningDefaultUpdates = Partial<Record<DebugTuningDefaultField, number>>
  & Partial<Record<DebugTuningBooleanDefaultField, boolean>>
  & { arenaBackgroundTiers?: ArenaBackgroundTierTuningPayload };

const debugTuningBooleanDefaultFields = {
  arenaTier1BackgroundBackVisible: "arenaTier1BackgroundBackVisible",
  arenaTier1BackgroundMidVisible: "arenaTier1BackgroundMidVisible",
  arenaTier1BackgroundGroundVisible: "arenaTier1BackgroundGroundVisible",
  arenaTier2BackgroundBackVisible: "arenaTier2BackgroundBackVisible",
  arenaTier2BackgroundMidVisible: "arenaTier2BackgroundMidVisible",
  arenaTier2BackgroundGroundVisible: "arenaTier2BackgroundGroundVisible",
  arenaTier2BackgroundFrontVisible: "arenaTier2BackgroundFrontVisible",
  arenaTier2BackgroundAmbientVisible: "arenaTier2BackgroundAmbientVisible",
} as const;

type DebugTuningBooleanDefaultField = keyof typeof debugTuningBooleanDefaultFields;
type DebugTuningBooleanDefaultPayload = Record<(typeof debugTuningBooleanDefaultFields)[DebugTuningBooleanDefaultField], unknown>;

type ArenaBackgroundLayerRole = "back" | "mid" | "ground" | "front" | "ambient";
type ArenaBackgroundLayerKey = string;
type ArenaBackgroundLayerTuningPayload = {
  layout: {
    x: number;
    y: number;
    scale: number;
    alpha: number;
    visible: boolean;
  };
  parallax: {
    followX: number;
    followY: number;
    zoom: number;
    lookUpY: number;
    zoomDarken?: number;
    farAlpha?: number;
    nearAlpha?: number;
  };
};
type ArenaBackgroundLayerTuningMapPayload = Partial<Record<ArenaBackgroundLayerKey, ArenaBackgroundLayerTuningPayload>>;
type ArenaBackgroundVariantTuningPayload = Record<string, ArenaBackgroundLayerTuningMapPayload>;
type ArenaBackgroundTierTuningPayloadEntry = {
  layers?: ArenaBackgroundLayerTuningMapPayload;
  variants?: ArenaBackgroundVariantTuningPayload;
};
type ArenaBackgroundTierTuningPayload = Record<string, ArenaBackgroundTierTuningPayloadEntry>;
type ArenaTierBackgroundDefaultUpdates = {
  tierId: number;
  variantId?: string;
  layers: ArenaBackgroundLayerTuningMapPayload;
};
type ArenaTierBackgroundLegacyField = DebugTuningDefaultField | DebugTuningBooleanDefaultField;
type ArenaTierBackgroundLegacyUpdates = Partial<Record<ArenaTierBackgroundLegacyField, number | boolean>>;

const playerSettingDefaultFields = {
  DEFAULT_PLAYER_HUD_MODE: "hudMode",
} as const;

type PlayerHudMode = "immersive" | "classic";
type PlayerSettingDefaultConstant = keyof typeof playerSettingDefaultFields;
type PlayerSettingDefaultPayload = Record<(typeof playerSettingDefaultFields)[PlayerSettingDefaultConstant], unknown>;
type PlayerSettingDefaultUpdates = Record<PlayerSettingDefaultConstant, PlayerHudMode>;

const rigPartKeys = [
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

type RigPartKey = (typeof rigPartKeys)[number];

const bodyPresetKeys = ["classic", "dummy-v2"] as const;
type BodyPresetKey = (typeof bodyPresetKeys)[number];

const facePartKeys = ["eyeLeft", "eyeRight"] as const;
type FacePartKey = (typeof facePartKeys)[number];

const faceAssetLayerKeys = ["pupilLeft", "pupilRight", "browLeft", "browRight"] as const;
type FaceAssetLayerKey = (typeof faceAssetLayerKeys)[number];

const appearanceLayerKeys = ["hair", "beard"] as const;
type AppearanceLayerKey = (typeof appearanceLayerKeys)[number];

const equipmentSlotKeys = [
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
type EquipmentSlotKey = (typeof equipmentSlotKeys)[number];

interface PromotedEquipmentMirrorSideConfig {
  slot: EquipmentSlotKey;
  assetKeyName: string;
  token: string;
  label: string;
  sideLabel: string;
}

interface PromotedEquipmentMirrorPairConfig {
  back: PromotedEquipmentMirrorSideConfig;
  front: PromotedEquipmentMirrorSideConfig;
}

interface PromotedEquipmentMirrorConfig {
  source: PromotedEquipmentMirrorSideConfig;
  target: PromotedEquipmentMirrorSideConfig;
}

interface EquipmentSetImportTargetConfig {
  targetPrefix: string;
  kind: GeneratedEquipmentJsonRecord["kind"];
  folder: string;
  slot: EquipmentSlotKey;
  assetKeyName: string;
  label: string;
}

interface EquipmentSetImportEntry {
  sourcePath: string;
  targetPrefix: string;
  targetSourcePath: string;
  lowSourcePath?: string;
  targetLowSourcePath?: string;
}

interface PromotedEquipmentSet {
  name: string;
  entries: EquipmentSetImportEntry[];
  rarity: NonNullable<GeneratedEquipmentJsonRecord["rarity"]>;
  availability: GeneratedEquipmentAvailability;
}

interface PromotedWeaponImportEntry {
  sourcePath: string;
  targetSourcePath: string;
  targetLowSourcePath: string;
  assetKey: string;
  name: string;
  rarity: NonNullable<GeneratedEquipmentJsonRecord["rarity"]>;
  weaponClass: NonNullable<GeneratedEquipmentJsonRecord["weaponClass"]>;
  damageBonus: number;
  price: number;
  availability: GeneratedEquipmentAvailability;
}

interface PromotedShieldImportEntry {
  sourcePath: string;
  targetSourcePath: string;
  targetLowSourcePath: string;
  assetKey: string;
  name: string;
  rarity: NonNullable<GeneratedEquipmentJsonRecord["rarity"]>;
  armorHp: number;
  price: number;
  availability: GeneratedEquipmentAvailability;
}

const promotedEquipmentMirrorPairs: readonly PromotedEquipmentMirrorPairConfig[] = [
  {
    back: { slot: "backShoulderguard", assetKeyName: "backShoulderguardAssetKey", token: "back-shoulderguard", label: "Back Shoulderguard", sideLabel: "Back" },
    front: { slot: "frontShoulderguard", assetKeyName: "frontShoulderguardAssetKey", token: "front-shoulderguard", label: "Front Shoulderguard", sideLabel: "Front" },
  },
  {
    back: { slot: "backWrist", assetKeyName: "backWristAssetKey", token: "back-wrist", label: "Back Wrist", sideLabel: "Back" },
    front: { slot: "frontWrist", assetKeyName: "frontWristAssetKey", token: "front-wrist", label: "Front Wrist", sideLabel: "Front" },
  },
  {
    back: { slot: "backGlove", assetKeyName: "backGloveAssetKey", token: "back-glove", label: "Back Glove", sideLabel: "Back" },
    front: { slot: "frontGlove", assetKeyName: "frontGloveAssetKey", token: "front-glove", label: "Front Glove", sideLabel: "Front" },
  },
  {
    back: { slot: "backGreave", assetKeyName: "backGreaveAssetKey", token: "back-greave", label: "Back Greave", sideLabel: "Back" },
    front: { slot: "frontGreave", assetKeyName: "frontGreaveAssetKey", token: "front-greave", label: "Front Greave", sideLabel: "Front" },
  },
  {
    back: { slot: "backShinguard", assetKeyName: "backShinguardAssetKey", token: "back-shinguard", label: "Back Shinguard", sideLabel: "Back" },
    front: { slot: "frontShinguard", assetKeyName: "frontShinguardAssetKey", token: "front-shinguard", label: "Front Shinguard", sideLabel: "Front" },
  },
  {
    back: { slot: "backBoot", assetKeyName: "backBootAssetKey", token: "back-boot", label: "Back Boot", sideLabel: "Back" },
    front: { slot: "frontBoot", assetKeyName: "frontBootAssetKey", token: "front-boot", label: "Front Boot", sideLabel: "Front" },
  },
] as const;

const equipmentSetImportTargetConfigs: readonly EquipmentSetImportTargetConfig[] = [
  { targetPrefix: "helmet", kind: "armor", folder: "assets/fighters/armor/helmet", slot: "helmet", assetKeyName: "helmetAssetKey", label: "Helmet" },
  {
    targetPrefix: "breastplate",
    kind: "armor",
    folder: "assets/fighters/armor/breastplate",
    slot: "breastplate",
    assetKeyName: "breastplateAssetKey",
    label: "Breastplate",
  },
  {
    targetPrefix: "back-shoulderguard",
    kind: "armor",
    folder: "assets/fighters/armor/arms",
    slot: "backShoulderguard",
    assetKeyName: "backShoulderguardAssetKey",
    label: "Back Shoulderguard",
  },
  {
    targetPrefix: "front-shoulderguard",
    kind: "armor",
    folder: "assets/fighters/armor/arms",
    slot: "frontShoulderguard",
    assetKeyName: "frontShoulderguardAssetKey",
    label: "Front Shoulderguard",
  },
  {
    targetPrefix: "back-wrist",
    kind: "armor",
    folder: "assets/fighters/armor/arms",
    slot: "backWrist",
    assetKeyName: "backWristAssetKey",
    label: "Back Wrist",
  },
  {
    targetPrefix: "front-wrist",
    kind: "armor",
    folder: "assets/fighters/armor/arms",
    slot: "frontWrist",
    assetKeyName: "frontWristAssetKey",
    label: "Front Wrist",
  },
  {
    targetPrefix: "back-glove",
    kind: "armor",
    folder: "assets/fighters/armor/arms",
    slot: "backGlove",
    assetKeyName: "backGloveAssetKey",
    label: "Back Glove",
  },
  {
    targetPrefix: "front-glove",
    kind: "armor",
    folder: "assets/fighters/armor/arms",
    slot: "frontGlove",
    assetKeyName: "frontGloveAssetKey",
    label: "Front Glove",
  },
  {
    targetPrefix: "back-greave",
    kind: "armor",
    folder: "assets/fighters/armor/legs",
    slot: "backGreave",
    assetKeyName: "backGreaveAssetKey",
    label: "Back Greave",
  },
  {
    targetPrefix: "front-greave",
    kind: "armor",
    folder: "assets/fighters/armor/legs",
    slot: "frontGreave",
    assetKeyName: "frontGreaveAssetKey",
    label: "Front Greave",
  },
  {
    targetPrefix: "back-shinguard",
    kind: "armor",
    folder: "assets/fighters/armor/legs",
    slot: "backShinguard",
    assetKeyName: "backShinguardAssetKey",
    label: "Back Shinguard",
  },
  {
    targetPrefix: "front-shinguard",
    kind: "armor",
    folder: "assets/fighters/armor/legs",
    slot: "frontShinguard",
    assetKeyName: "frontShinguardAssetKey",
    label: "Front Shinguard",
  },
  {
    targetPrefix: "back-boot",
    kind: "armor",
    folder: "assets/fighters/armor/legs",
    slot: "backBoot",
    assetKeyName: "backBootAssetKey",
    label: "Back Boot",
  },
  {
    targetPrefix: "front-boot",
    kind: "armor",
    folder: "assets/fighters/armor/legs",
    slot: "frontBoot",
    assetKeyName: "frontBootAssetKey",
    label: "Front Boot",
  },
  {
    targetPrefix: "weapon-sword",
    kind: "weapon",
    folder: "assets/fighters/weapons",
    slot: "weaponMain",
    assetKeyName: "weaponMainAssetKey",
    label: "Sword",
  },
  {
    targetPrefix: "weapon-axe",
    kind: "weapon",
    folder: "assets/fighters/weapons",
    slot: "weaponMain",
    assetKeyName: "weaponMainAssetKey",
    label: "Axe",
  },
  {
    targetPrefix: "weapon-bow",
    kind: "weapon",
    folder: "assets/fighters/weapons",
    slot: "weaponBow",
    assetKeyName: "weaponBowAssetKey",
    label: "Bow",
  },
  {
    targetPrefix: "weapon-mace",
    kind: "weapon",
    folder: "assets/fighters/weapons",
    slot: "weaponMain",
    assetKeyName: "weaponMainAssetKey",
    label: "Mace",
  },
  {
    targetPrefix: "weapon-spear",
    kind: "weapon",
    folder: "assets/fighters/weapons",
    slot: "weaponMain",
    assetKeyName: "weaponMainAssetKey",
    label: "Spear",
  },
  {
    targetPrefix: "weapon-shuriken",
    kind: "weapon",
    folder: "assets/fighters/weapons",
    slot: "weaponMain",
    assetKeyName: "weaponMainAssetKey",
    label: "Shuriken",
  },
];

const bodyAnimationKeys = [
  "idle",
  "walkCycle",
  "lunge",
  "light",
  "medium",
  "heavy",
  "bowShot",
  "hit",
  "block",
  "taunt",
  "rest",
  "scrollCast",
] as const;
type BodyAnimationKey = (typeof bodyAnimationKeys)[number];
const bodyAnimationDefaultVariantId = "default";
const bodyAnimationWeaponClasses = ["sword", "axe", "bow", "mace", "spear", "shuriken"] as const;
type BodyAnimationWeaponClass = (typeof bodyAnimationWeaponClasses)[number];

const bodyAnimationKeyframeEasings = ["linear", "easeInOut", "hold"] as const;
type BodyAnimationKeyframeEasing = (typeof bodyAnimationKeyframeEasings)[number];
const scrollCastPropAssetKeys = [
  "scroll-crack-armor-01",
  "scroll-fireball-01",
  "scroll-ward-01",
  "scroll-precise-strike-01",
  "scroll-double-strike-01",
  "scroll-poison-01",
] as const;
type ScrollCastPropAssetKey = (typeof scrollCastPropAssetKeys)[number];
const defaultScrollCastPropAssetKey: ScrollCastPropAssetKey = "scroll-crack-armor-01";

const slashArcAttackKeys = ["light", "medium", "heavy"] as const;
type SlashArcAttackKey = (typeof slashArcAttackKeys)[number];

const actionButtonOffsetKeys = ["forward", "back", "lunge", "light", "medium", "heavy", "switchWeapon", "shuriken", "scroll", "fireball", "ward", "preciseStrike", "doubleStrike", "poison", "taunt", "rest"] as const;
type ActionButtonOffsetKey = (typeof actionButtonOffsetKeys)[number];

const classicActionButtonSlotKeys = ["forward", "back", "lunge", "light", "medium", "heavy", "switchWeapon", "shuriken", "scroll", "fireball", "ward", "preciseStrike", "doubleStrike", "poison", "taunt", "rest"] as const;
type ClassicActionButtonSlotKey = (typeof classicActionButtonSlotKeys)[number];

const classicActionWheelModes = ["distance", "clinch", "bowDistance"] as const;
type ClassicActionWheelMode = (typeof classicActionWheelModes)[number];

const bodyAnimationDefaultConstants: Record<BodyAnimationKey, string> = {
  idle: "DEFAULT_IDLE_ANIMATION",
  walkCycle: "DEFAULT_WALK_CYCLE_ANIMATION",
  lunge: "DEFAULT_LUNGE_ANIMATION",
  light: "DEFAULT_LIGHT_ANIMATION",
  medium: "DEFAULT_MEDIUM_ANIMATION",
  heavy: "DEFAULT_HEAVY_ANIMATION",
  bowShot: "DEFAULT_BOW_SHOT_ANIMATION",
  hit: "DEFAULT_HIT_ANIMATION",
  block: "DEFAULT_BLOCK_ANIMATION",
  taunt: "DEFAULT_TAUNT_ANIMATION",
  rest: "DEFAULT_REST_ANIMATION",
  scrollCast: "DEFAULT_SCROLL_CAST_ANIMATION",
};

interface RigPartTuningPayload {
  x: unknown;
  y: unknown;
  angle: unknown;
  scaleX: unknown;
  scaleY: unknown;
  flipX: unknown;
  flipY: unknown;
}

interface FacePartTuningPayload {
  x: unknown;
  y: unknown;
  scaleX: unknown;
  scaleY: unknown;
}

interface FaceAssetLayerTuningPayload {
  x: unknown;
  y: unknown;
  angle: unknown;
  scaleX: unknown;
  scaleY: unknown;
}

interface AppearanceLayerTuningPayload {
  x: unknown;
  y: unknown;
  angle: unknown;
  scaleX: unknown;
  scaleY: unknown;
}

interface RigPartTuning {
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
}

interface FacePartTuning {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

interface FaceAssetLayerTuning {
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
}

interface AppearanceLayerTuning {
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
}

type RigPartUpdates = Record<RigPartKey, RigPartTuning>;
type BodyPartLayerUpdates = Record<BodyPresetKey, RigPartUpdates>;
type BodyPresetAnimationUpdates = Record<BodyPresetKey, Record<BodyAnimationKey, BodyAnimationUpdates>>;
type BodyPresetFacePartUpdates = Record<BodyPresetKey, FacePartUpdates>;
type BodyPresetFaceAssetLayerUpdates = Record<BodyPresetKey, FaceAssetLayerUpdates>;
type BodyPresetAppearanceLayerUpdates = Record<BodyPresetKey, AppearanceLayerUpdates>;
type FacePartUpdates = Record<FacePartKey, FacePartTuning>;
type FaceAssetLayerUpdates = Record<FaceAssetLayerKey, FaceAssetLayerTuning>;
type AppearanceLayerUpdates = Record<AppearanceLayerKey, AppearanceLayerTuning>;
type EquipmentUpdates = Record<EquipmentSlotKey, RigPartTuning>;
type EquipmentItemUpdates = Record<string, RigPartTuning>;
type SlashArcUpdates = Record<SlashArcAttackKey, SlashArcTuning>;
type WardShieldUpdates = WardShieldTuning;
type ActionButtonOffsetUpdates = Record<ActionButtonOffsetKey, ActionButtonOffsetTuning>;
type ClassicActionButtonSlotUpdates = Record<ClassicActionWheelMode, Record<ClassicActionButtonSlotKey, ClassicActionButtonSlotTuning>>;

interface SlashArcTuning {
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

interface WardShieldTuning {
  scale: number;
  offsetX: number;
  offsetY: number;
  alpha: number;
  fadeInMs: number;
  castDurationMs: number;
  absorbDurationMs: number;
  startScale: number;
  endScale: number;
}

interface ActionButtonOffsetTuning {
  x: number;
  y: number;
}

interface ClassicActionButtonSlotTuning {
  x: number;
  y: number;
  rotation: number;
}

interface BodyAnimationUpdates {
  key?: BodyAnimationKey;
  enabled: boolean;
  duration: number;
  variantId?: string;
  variantLabel?: string;
  variantWeight: number;
  appliesToAllWeapons: boolean;
  weaponClasses: BodyAnimationWeaponClass[];
  selectedVariantId?: string;
  base: RigPartUpdates;
  breath: RigPartUpdates;
  faceBase: FacePartUpdates;
  faceBreath: FacePartUpdates;
  activeParts: Record<RigPartKey, boolean>;
  movementStartKeyframeId?: string;
  impactKeyframeId?: string;
  keyframes: BodyAnimationKeyframeUpdates[];
  variants: BodyAnimationUpdates[];
}

interface BodyPresetSelectedAnimationUpdates {
  presetKey: BodyPresetKey;
  animation: BodyAnimationUpdates;
}

interface BodyAnimationKeyframeUpdates {
  id: string;
  time: number;
  easing: BodyAnimationKeyframeEasing;
  rigParts: RigPartUpdates;
  faceParts: FacePartUpdates;
  rootOffset: RootOffsetUpdates;
  weaponMirrorX?: boolean;
  weaponMirrorY?: boolean;
  castProp?: BodyAnimationCastPropUpdates;
}

interface BodyAnimationCastPropUpdates {
  visible: boolean;
  assetKey: ScrollCastPropAssetKey;
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
}

interface RootOffsetUpdates {
  x: number;
  y: number;
}

interface PromoteEquipmentItemPayload {
  name?: unknown;
  armorHp?: unknown;
  damageBonus?: unknown;
  price?: unknown;
  addToShop?: unknown;
  availability?: unknown;
  item?: unknown;
  assetKeys?: unknown;
  asset?: unknown;
  equipmentTuning?: unknown;
}

interface UpdateGeneratedShopItemPayload {
  itemIds?: unknown;
  rarity?: unknown;
  stat?: unknown;
  price?: unknown;
}

interface UpdateGeneratedBossItemPayload {
  itemIds?: unknown;
  stat?: unknown;
}

interface UpdateGeneratedEquipmentItemPayload {
  itemIds?: unknown;
  rarity?: unknown;
  stat?: unknown;
  price?: unknown;
  equipmentTuningByItemId?: unknown;
}

interface RenameEquipmentSetAssetsPayload {
  setName?: unknown;
  variant?: unknown;
  entries?: unknown;
}

interface PromoteEquipmentSetPayload extends RenameEquipmentSetAssetsPayload {
  rarity?: unknown;
  availability?: unknown;
}

interface PromoteWeaponImportsPayload {
  entries?: unknown;
}

interface PromoteShieldImportsPayload {
  entries?: unknown;
}

interface PromoteWeaponImportEntryPayload {
  sourcePath?: unknown;
  name?: unknown;
  rarity?: unknown;
  weaponClass?: unknown;
  damageBonus?: unknown;
  price?: unknown;
  availability?: unknown;
}

interface PromoteShieldImportEntryPayload {
  sourcePath?: unknown;
  name?: unknown;
  rarity?: unknown;
  armorHp?: unknown;
  price?: unknown;
  availability?: unknown;
}

interface RenameEquipmentSetAssetEntryPayload {
  sourcePath?: unknown;
  targetPrefix?: unknown;
}

interface GeneratedEquipmentJsonRecord {
  id: string;
  name: string;
  kind: "armor" | "weapon";
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythical" | "unique";
  armorCategory?: "leather" | "cloth" | "chain" | "plate";
  equipmentSet?: GeneratedEquipmentSetInfo;
  equipmentSlot: EquipmentSlotKey;
  armorHp?: number;
  damageBonus?: number;
  levelRequirement?: number;
  requirements?: Partial<Record<"strength" | "agility" | "vitality", number>>;
  weaponClass?: "sword" | "axe" | "bow" | "mace" | "spear" | "shuriken";
  assetKeys: Record<string, string>;
  equipmentTuning: RigPartTuning;
  asset: {
    key: string;
    sourcePath: string;
    lowSourcePath?: string;
  };
  availability?: GeneratedEquipmentAvailability;
  armoryProduct?: {
    id: string;
    name: string;
    price: number;
    itemIds: string[];
    categoryId: string;
  };
  weaponProduct?: {
    id: string;
    name: string;
    price: number;
    itemIds: string[];
    categoryId: string;
  };
}

interface GeneratedEquipmentAvailability {
  shop: boolean;
  enemyPool: boolean;
  bossUnique: boolean;
}

interface GeneratedEquipmentSetInfo {
  id: string;
  name: string;
  rank: number;
  grade?: "starter" | "low" | "mid" | "high" | "boss";
}

interface ArenaBossJsonRecord {
  id: string;
  tierId: number;
  name: string;
  baseStats: {
    strength: number;
    agility: number;
    vitality: number;
  };
  equipment: Partial<Record<EquipmentSlotKey, string>>;
  rewards: {
    win: {
      gold: number;
      xp: number;
    };
    loss: {
      gold: number;
      xp: number;
    };
  };
  lootTable: {
    id: string;
    itemIds: string[];
    chance: number;
    quantity: number;
  }[];
}

interface ArenaTierJsonRecord {
  id: number;
  name: string;
  unlockBossId?: string;
  opponents: ArenaTierOpponentJsonRecord[];
}

interface ArenaTierOpponentJsonRecord {
  id: string;
  difficultyId: "easy" | "medium" | "hard";
  baseStats?: ArenaBossJsonRecord["baseStats"];
  randomBaseStatPoints?: number;
  equipmentPools: ArenaTierEquipmentPoolJsonRecord[];
  rewards: ArenaBossJsonRecord["rewards"];
}

interface ArenaTierEquipmentPoolJsonRecord {
  itemRarities: NonNullable<GeneratedEquipmentJsonRecord["rarity"]>[];
  rollChance: number;
  weaponChance?: number;
  bowChance?: number;
  shieldChance?: number;
  shurikenChance?: number;
}

interface UiLayoutDefaultsUpdateResult {
  source: string;
  screenId: string;
  updated: number;
}

interface PromotedEquipmentItem {
  record: GeneratedEquipmentJsonRecord;
  mirrorPairFlipX: boolean;
}

export default defineConfig({
  plugins: [saveProdDefaultsPlugin()],
});

function saveProdDefaultsPlugin(): Plugin {
  return {
    name: "dust-arena-save-prod-defaults",
    configureServer(server) {
      server.middlewares.use("/__dust-arena/save-prod-defaults", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to save prod defaults." });
          return;
        }

        try {
          const payload = await readJson(request);
          const layoutUpdates = pickProdDefaultUpdates(payload);
          const combatUpdates = pickCombatDefaultUpdates(payload);
          const debugTuningDefaultUpdates = pickDebugTuningDefaultUpdates(payload);
          const playerSettingDefaultUpdates = pickPlayerSettingDefaultUpdates(payload);
          const rigPartUpdates = pickRigPartDefaultUpdates(payload);
          const bodyPartLayerUpdates = pickBodyPartLayerDefaultUpdates(payload);
          const bodyPresetAnimationUpdates = pickBodyPresetAnimationDefaultUpdates(payload);
          const bodyPresetFacePartUpdates = pickBodyPresetFacePartDefaultUpdates(payload);
          const bodyPresetFaceAssetLayerUpdates = pickBodyPresetFaceAssetLayerDefaultUpdates(payload);
          const bodyPresetAppearanceLayerUpdates = pickBodyPresetAppearanceLayerDefaultUpdates(payload);
          const facePartUpdates = pickFacePartDefaultUpdates(payload);
          const bodyAnimationUpdates = pickBodyAnimationUpdates(payload);
          const equipmentUpdates = pickEquipmentDefaultUpdates(payload);
          const generatedEquipmentRecords = await readGeneratedEquipmentRecords();
          const generatedEquipmentItemIds = new Set(generatedEquipmentRecords.map((record) => record.id));
          const equipmentItemUpdates = pickEquipmentItemDefaultUpdates(payload, generatedEquipmentItemIds);
          const generatedEquipmentItemUpdates = pickGeneratedEquipmentItemTuningUpdates(payload, generatedEquipmentItemIds);
          const nextGeneratedEquipmentRecords = applyGeneratedEquipmentItemTuningUpdates(
            generatedEquipmentRecords,
            generatedEquipmentItemUpdates,
          );
          const slashArcUpdates = pickSlashArcDefaultUpdates(payload);
          const wardShieldUpdates = pickWardShieldDefaultUpdates(payload);
          const actionButtonOffsetUpdates = pickActionButtonOffsetDefaultUpdates(payload);
          const classicActionButtonSlotUpdates = pickClassicActionButtonSlotDefaultUpdates(payload);
          const [layoutSource, combatSource, debugTuningSource, settingsMenuSource] = await Promise.all([
            readFile(arenaLayoutUrl, "utf8"),
            readFile(combatUrl, "utf8"),
            readFile(debugTuningUrl, "utf8"),
            readFile(settingsMenuUrl, "utf8"),
          ]);
          const nextLayoutSource = applyProdDefaultUpdates(layoutSource, layoutUpdates);
          const nextCombatSource = applyCombatDefaultUpdates(combatSource, combatUpdates);
          const nextSettingsMenuSource = applyPlayerSettingDefaultUpdates(settingsMenuSource, playerSettingDefaultUpdates);
          let nextDebugTuningSource = applyActionButtonOffsetDefaultUpdates(debugTuningSource, actionButtonOffsetUpdates);
          nextDebugTuningSource = applyClassicActionButtonSlotDefaultUpdates(nextDebugTuningSource, classicActionButtonSlotUpdates);
          nextDebugTuningSource = applyRigPartDefaultUpdates(nextDebugTuningSource, rigPartUpdates);
          nextDebugTuningSource = applyBodyPartLayerDefaultUpdates(
            nextDebugTuningSource,
            bodyPartLayerUpdates,
            bodyPresetAnimationUpdates,
            bodyPresetFacePartUpdates,
            bodyPresetFaceAssetLayerUpdates,
            bodyPresetAppearanceLayerUpdates,
          );
          nextDebugTuningSource = applyBodyAnimationDefaultUpdates(nextDebugTuningSource, bodyAnimationUpdates);
          nextDebugTuningSource = applyFacePartDefaultUpdates(nextDebugTuningSource, facePartUpdates);
          nextDebugTuningSource = applyEquipmentDefaultUpdates(nextDebugTuningSource, equipmentUpdates);
          nextDebugTuningSource = applyEquipmentItemDefaultUpdates(nextDebugTuningSource, equipmentItemUpdates);
          nextDebugTuningSource = applySlashArcDefaultUpdates(nextDebugTuningSource, slashArcUpdates);
          nextDebugTuningSource = applyWardShieldDefaultUpdates(nextDebugTuningSource, wardShieldUpdates);
          nextDebugTuningSource = applyDebugTuningDefaultUpdates(nextDebugTuningSource, debugTuningDefaultUpdates);

          await Promise.all([
            writeFile(arenaLayoutUrl, nextLayoutSource, "utf8"),
            writeFile(combatUrl, nextCombatSource, "utf8"),
            writeFile(debugTuningUrl, nextDebugTuningSource, "utf8"),
            writeFile(settingsMenuUrl, nextSettingsMenuSource, "utf8"),
            Object.keys(generatedEquipmentItemUpdates).length > 0
              ? writeGeneratedEquipmentRecords(nextGeneratedEquipmentRecords)
              : Promise.resolve(),
          ]);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, {
            message: `Saved ${Object.keys(layoutUpdates).length} layout defaults, ${Object.keys(combatUpdates).length} combat defaults, ${Object.keys(debugTuningDefaultUpdates).length} debug defaults, ${Object.keys(playerSettingDefaultUpdates).length} player setting defaults, ${Object.keys(actionButtonOffsetUpdates).length} action button offsets, ${Object.keys(classicActionButtonSlotUpdates).length} classic action wheels, ${Object.keys(rigPartUpdates).length} rig defaults, ${Object.keys(bodyPartLayerUpdates).length} body art presets, ${Object.keys(facePartUpdates).length} face defaults, ${bodyAnimationUpdates.key} body animation, ${Object.keys(equipmentUpdates).length} equipment defaults, ${Object.keys(equipmentItemUpdates).length} equipment item defaults, ${Object.keys(generatedEquipmentItemUpdates).length} generated equipment item defaults, ${Object.keys(slashArcUpdates).length} slash effect defaults, and ward shield defaults to prod.`,
            updated:
              Object.keys(layoutUpdates).length +
              Object.keys(combatUpdates).length +
              Object.keys(debugTuningDefaultUpdates).length +
              Object.keys(playerSettingDefaultUpdates).length +
              Object.keys(actionButtonOffsetUpdates).length +
              Object.keys(classicActionButtonSlotUpdates).length +
              Object.keys(rigPartUpdates).length +
              Object.keys(bodyPartLayerUpdates).length +
              Object.keys(facePartUpdates).length +
              1 +
              Object.keys(equipmentUpdates).length +
              Object.keys(equipmentItemUpdates).length +
              Object.keys(generatedEquipmentItemUpdates).length +
              Object.keys(slashArcUpdates).length +
              1,
          });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not save prod defaults." });
        }
      });

      server.middlewares.use("/__dust-arena/save-prod-vfx-defaults", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to save prod VFX defaults." });
          return;
        }

        try {
          const payload = await readJson(request);
          const slashArcUpdates = pickSlashArcDefaultUpdates(payload);
          const wardShieldUpdates = pickWardShieldDefaultUpdates(payload);
          const source = await readFile(debugTuningUrl, "utf8");
          let nextSource = applySlashArcDefaultUpdates(source, slashArcUpdates);

          nextSource = applyWardShieldDefaultUpdates(nextSource, wardShieldUpdates);

          await writeFile(debugTuningUrl, nextSource, "utf8");
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, {
            message: `Saved ${Object.keys(slashArcUpdates).length} slash effect defaults and ward shield defaults to prod.`,
            updated: Object.keys(slashArcUpdates).length + 1,
          });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not save prod VFX defaults." });
        }
      });

      server.middlewares.use("/__dust-arena/save-prod-animation", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to save prod animation." });
          return;
        }

        try {
          const payload = await readJson(request);
          const animationUpdates = pickActiveBodyPresetAnimationDefaultUpdates(payload);
          const source = await readFile(debugTuningUrl, "utf8");
          let nextSource = applyBodyAnimationDefaultUpdates(source, animationUpdates.animation);

          nextSource = applyBodyPresetAnimationDefaultUpdates(nextSource, animationUpdates);

          await writeFile(debugTuningUrl, nextSource, "utf8");
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: `Saved ${animationUpdates.presetKey} ${animationUpdates.animation.key} animation defaults to prod.`, updated: 1 });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not save prod animation." });
        }
      });

      server.middlewares.use("/__dust-arena/save-ui-layout-defaults", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to save UI layout defaults." });
          return;
        }

        try {
          const payload = await readJson(request);
          const source = await readFile(uiLayoutTuningUrl, "utf8");
          const update = applyUiLayoutDefaultUpdates(source, payload);

          await writeFile(uiLayoutTuningUrl, update.source, "utf8");
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: `Saved ${update.updated} ${update.screenId} UI layout defaults to prod.`, updated: update.updated });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not save UI layout defaults." });
        }
      });

      server.middlewares.use("/__dust-arena/promote-equipment-item", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to promote equipment items." });
          return;
        }

        try {
          const payload = await readJson(request);
          const promotion = await pickPromotedEquipmentItem(payload);
          const promotedItem = promotion.record;
          const records = await readGeneratedEquipmentRecords();
          const promotedRecords = await createPromotedEquipmentRecords(promotedItem, promotion.mirrorPairFlipX);
          await ensureGeneratedEquipmentShopIcons(promotedRecords);
          const nextRecords = upsertGeneratedEquipmentRecords(records, promotedRecords);

          await writeGeneratedEquipmentRecords(nextRecords);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: formatPromotedEquipmentMessage(promotedRecords), updated: promotedRecords.length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not promote equipment item." });
        }
      });

      server.middlewares.use("/__dust-arena/promote-equipment-set", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to promote equipment sets." });
          return;
        }

        try {
          const payload = await readJson(request);
          const promotion = await pickPromotedEquipmentSet(payload);
          const records = await readGeneratedEquipmentRecords();

          await renameEquipmentSetImportAssets(promotion.entries);
          const promotedRecords = await createPromotedEquipmentSetRecords(promotion, records);
          await ensureGeneratedEquipmentShopIcons(promotedRecords);
          const nextRecords = upsertGeneratedEquipmentRecords(records, promotedRecords);

          await writeGeneratedEquipmentRecords(nextRecords);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: formatPromotedEquipmentSetMessage(promotion, promotedRecords), updated: promotedRecords.length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not promote equipment set." });
        }
      });

      server.middlewares.use("/__dust-arena/promote-weapon-imports", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to promote weapon imports." });
          return;
        }

        try {
          const payload = await readJson(request);
          const entries = await pickPromotedWeaponImportEntries(payload);
          const records = await readGeneratedEquipmentRecords();

          await writePromotedWeaponImportAssets(entries);
          const promotedRecords = entries.map(createPromotedWeaponImportRecord);
          await ensureGeneratedEquipmentShopIcons(promotedRecords);
          const nextRecords = upsertGeneratedEquipmentRecords(records, promotedRecords);

          await writeGeneratedEquipmentRecords(nextRecords);
          await removePromotedWeaponImportSourceFiles(entries);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: formatPromotedWeaponImportsMessage(promotedRecords), updated: promotedRecords.length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not promote weapon imports." });
        }
      });

      server.middlewares.use("/__dust-arena/promote-shield-imports", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to promote shield imports." });
          return;
        }

        try {
          const payload = await readJson(request);
          const entries = await pickPromotedShieldImportEntries(payload);
          const records = await readGeneratedEquipmentRecords();

          await writePromotedShieldImportAssets(entries);
          const promotedRecords = entries.map(createPromotedShieldImportRecord);
          await ensureGeneratedEquipmentShopIcons(promotedRecords);
          const nextRecords = upsertGeneratedEquipmentRecords(records, promotedRecords);

          await writeGeneratedEquipmentRecords(nextRecords);
          await removePromotedShieldImportSourceFiles(entries);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: formatPromotedShieldImportsMessage(promotedRecords), updated: promotedRecords.length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not promote shield imports." });
        }
      });

      server.middlewares.use("/__dust-arena/remove-equipment-item", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to remove equipment items." });
          return;
        }

        try {
          const payload = await readJson(request);
          const itemId = pickGeneratedEquipmentRemovalId(payload);
          const removedItems = await removeGeneratedEquipmentItems(itemId);

          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: formatRemovedGeneratedEquipmentMessage(removedItems), updated: removedItems.length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not remove equipment item." });
        }
      });

      server.middlewares.use("/__dust-arena/rename-equipment-set-assets", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to rename equipment set assets." });
          return;
        }

        try {
          const payload = await readJson(request);
          const entries = await pickEquipmentSetImportEntries(payload);

          await renameEquipmentSetImportAssets(entries);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: formatEquipmentSetImportRenameMessage(entries), updated: entries.length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not rename equipment set assets." });
        }
      });

      server.middlewares.use("/__dust-arena/update-generated-shop-item", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to update generated shop items." });
          return;
        }

        try {
          const payload = await readJson(request);
          const update = pickGeneratedShopItemUpdate(payload);
          const updatedRecords = await updateGeneratedShopItems(update);

          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: formatUpdatedGeneratedShopItemMessage(updatedRecords), updated: updatedRecords.length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not update generated shop item." });
        }
      });

      server.middlewares.use("/__dust-arena/update-generated-boss-item", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to update generated boss items." });
          return;
        }

        try {
          const payload = await readJson(request);
          const update = pickGeneratedBossItemUpdate(payload);
          const updatedRecords = await updateGeneratedBossItem(update);

          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: formatUpdatedGeneratedBossItemMessage(updatedRecords), updated: updatedRecords.length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not update generated boss item." });
        }
      });

      server.middlewares.use("/__dust-arena/update-generated-equipment-item", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to update generated equipment items." });
          return;
        }

        try {
          const payload = await readJson(request);
          const update = pickGeneratedEquipmentItemUpdate(payload);
          const updatedRecords = await updateGeneratedEquipmentItem(update);

          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: formatUpdatedGeneratedEquipmentItemMessage(updatedRecords), updated: updatedRecords.length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not update generated equipment item." });
        }
      });

      server.middlewares.use("/__dust-arena/save-arena-boss", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to save arena bosses." });
          return;
        }

        try {
          const payload = await readJson(request);
          const boss = validateArenaBossRecord(payload);
          const records = await readGeneratedArenaBossRecords();
          const nextRecords = upsertGeneratedArenaBossRecords(records, boss);

          await writeGeneratedArenaBossRecords(nextRecords);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: `Saved arena boss ${boss.name}.`, updated: 1 });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not save arena boss." });
        }
      });

      server.middlewares.use("/__dust-arena/save-arena-tier", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to save arena tiers." });
          return;
        }

        try {
          const payload = await readJson(request);
          const tier = validateArenaTierRecord(payload);
          const records = await readGeneratedArenaTierRecords();
          const nextRecords = upsertGeneratedArenaTierRecords(records, tier);

          await writeGeneratedArenaTierRecords(nextRecords);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: `Saved arena tier ${tier.name}.`, updated: 1 });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not save arena tier." });
        }
      });

      server.middlewares.use("/__dust-arena/save-arena-tier-background", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to save arena tier background." });
          return;
        }

        try {
          const payload = await readJson(request);
          const updates = pickArenaTierBackgroundDefaultUpdates(payload);
          const source = await readFile(debugTuningUrl, "utf8");
          const nextSource = applyArenaTierBackgroundDefaultUpdates(source, updates);

          await writeFile(debugTuningUrl, nextSource, "utf8");
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: `Saved tier ${updates.tierId} background defaults to prod.`, updated: Object.keys(updates.layers).length });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not save arena tier background." });
        }
      });
    },
  };
}

export function applyProdDefaultUpdates(source: string, updates: ProdDefaultUpdates): string {
  return Object.entries(updates).reduce((nextSource, [constantName, value]) => {
    const pattern = new RegExp(`export const ${constantName} = [-]?[0-9]+(?:\\.[0-9]+)?;`);

    if (!pattern.test(nextSource)) {
      throw new Error(`Could not find ${constantName} in arenaLayout.ts.`);
    }

    return nextSource.replace(pattern, `export const ${constantName} = ${formatNumber(value)};`);
  }, source);
}

export function pickProdDefaultUpdates(payload: unknown): ProdDefaultUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  return Object.fromEntries(
    Object.entries(prodDefaultFields).map(([constantName, fieldName]) => [constantName, readFiniteNumber(payload as ProdDefaultPayload, fieldName)]),
  ) as ProdDefaultUpdates;
}

export function applyCombatDefaultUpdates(source: string, updates: CombatDefaultUpdates): string {
  return Object.entries(updates).reduce((nextSource, [constantName, value]) => {
    const pattern = new RegExp(`export const ${constantName} = [-]?[0-9]+(?:\\.[0-9]+)?;`);

    if (!pattern.test(nextSource)) {
      throw new Error(`Could not find ${constantName} in combat.ts.`);
    }

    return nextSource.replace(pattern, `export const ${constantName} = ${formatNumber(value)};`);
  }, source);
}

export function pickCombatDefaultUpdates(payload: unknown): CombatDefaultUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  return Object.fromEntries(
    Object.entries(combatDefaultFields).map(([constantName, fieldName]) => [constantName, readFiniteNumber(payload as CombatDefaultPayload, fieldName)]),
  ) as CombatDefaultUpdates;
}

export function applyDebugTuningDefaultUpdates(source: string, updates: DebugTuningDefaultUpdates): string {
  return Object.entries(updates).reduce((nextSource, [fieldName, value]) => {
    if (fieldName === "arenaBackgroundTiers") {
      return replaceDefaultArenaBackgroundTiers(nextSource, value);
    }

    const pattern = new RegExp(`(\\n\\s*${fieldName}: )[^,\\n]+(,)`);

    if (!pattern.test(nextSource)) {
      throw new Error(`Could not find defaultDebugTuning.${fieldName} in debugTuning.ts.`);
    }

    return nextSource.replace(pattern, `$1${typeof value === "boolean" ? value : formatNumber(value as number)}$2`);
  }, source);
}

export function applyArenaTierBackgroundDefaultUpdates(source: string, updates: ArenaTierBackgroundDefaultUpdates): string {
  const sourceWithLegacyUpdates = Object.entries(createLegacyArenaTierBackgroundDefaultUpdates(updates)).reduce((nextSource, [fieldName, value]) => {
    const pattern = new RegExp(`(\\n\\s*${fieldName}: )[^,\\n]+(,)`);

    if (!pattern.test(nextSource)) {
      throw new Error(`Could not find defaultDebugTuning.${fieldName} in debugTuning.ts.`);
    }

    return nextSource.replace(pattern, `$1${typeof value === "boolean" ? value : formatNumber(value)}$2`);
  }, source);
  const dynamicLayerUpdates = createDynamicArenaTierBackgroundDefaultUpdates(updates);

  if (Object.keys(dynamicLayerUpdates).length === 0) {
    return sourceWithLegacyUpdates;
  }

  const existingTiers = readDefaultArenaBackgroundTierTuningsFromSource(sourceWithLegacyUpdates);
  const tierKey = String(updates.tierId);
  const existingTier = existingTiers[tierKey] ?? {};
  const variantId = normalizeArenaBackgroundVariantId(updates.variantId);
  const nextTier = isDefaultArenaBackgroundVariantId(variantId)
    ? {
        ...existingTier,
        layers: {
          ...existingTier.layers,
          ...dynamicLayerUpdates,
        },
      }
    : {
        ...existingTier,
        variants: {
          ...existingTier.variants,
          [variantId]: {
            ...existingTier.variants?.[variantId],
            ...dynamicLayerUpdates,
          },
        },
      };

  return replaceDefaultArenaBackgroundTiers(sourceWithLegacyUpdates, {
    ...existingTiers,
    [tierKey]: nextTier,
  });
}

export function applyUiLayoutDefaultUpdates(source: string, payload: unknown): UiLayoutDefaultsUpdateResult {
  const screenId = readUiLayoutScreenId(payload);
  const values = readUiLayoutValues(payload);
  const existingValues = readUiLayoutDefaultValuesFromSource(source);
  const nextValues = { ...existingValues };
  let updated = 0;

  for (const [key, value] of Object.entries(values)) {
    if (!key.startsWith(`${screenId}.`)) {
      continue;
    }

    nextValues[key] = value;
    updated += 1;
  }

  if (updated === 0) {
    throw new Error(`No ${screenId} UI layout values to save.`);
  }

  return {
    source: replaceUiLayoutDefaultValues(source, nextValues),
    screenId,
    updated,
  };
}

function createLegacyArenaTierBackgroundDefaultUpdates(updates: ArenaTierBackgroundDefaultUpdates): ArenaTierBackgroundLegacyUpdates {
  const result: ArenaTierBackgroundLegacyUpdates = {};

  if (!isDefaultArenaBackgroundVariantId(updates.variantId)) {
    return result;
  }

  Object.entries(updates.layers).forEach(([layer, tuning]) => {
    if (!tuning) {
      return;
    }

    (["x", "y", "scale", "alpha", "visible"] as const).forEach((field) => {
      const key = getLegacyArenaTierBackgroundLayoutDefaultField(updates.tierId, layer as ArenaBackgroundLayerKey, field);
      const value = tuning.layout[field];

      if (key) {
        result[key] = value;
      }
    });

    (["followX", "followY", "zoom", "lookUpY", "zoomDarken", "farAlpha", "nearAlpha"] as const).forEach((field) => {
      const key = getLegacyArenaTierBackgroundParallaxDefaultField(updates.tierId, layer as ArenaBackgroundLayerKey, field);
      const value = tuning.parallax[field];

      if (key && typeof value === "number" && Number.isFinite(value)) {
        result[key] = value;
      }
    });
  });

  return result;
}

function createDynamicArenaTierBackgroundDefaultUpdates(updates: ArenaTierBackgroundDefaultUpdates): ArenaBackgroundLayerTuningMapPayload {
  const result: ArenaBackgroundLayerTuningMapPayload = {};

  Object.entries(updates.layers).forEach(([layer, tuning]) => {
    if (!tuning) {
      return;
    }

    const layerKey = layer as ArenaBackgroundLayerKey;

    if (isDefaultArenaBackgroundVariantId(updates.variantId) && !usesDynamicArenaTierBackgroundDefaultUpdates(updates.tierId, layerKey)) {
      return;
    }

    result[layerKey] = {
      layout: tuning.layout,
      parallax: tuning.parallax,
    };
  });

  return result;
}

function normalizeArenaBackgroundVariantId(value: unknown): string {
  const variantId = typeof value === "string" ? value.trim().slice(0, 80) : "";

  return variantId || "default";
}

function isDefaultArenaBackgroundVariantId(value: unknown): boolean {
  return normalizeArenaBackgroundVariantId(value) === "default";
}

function usesDynamicArenaTierBackgroundDefaultUpdates(tierId: number, layer: ArenaBackgroundLayerKey): boolean {
  return !getLegacyArenaTierBackgroundLayoutDefaultPrefix(tierId, layer)
    && !getLegacyArenaTierBackgroundParallaxDefaultPrefix(tierId, layer);
}

function getLegacyArenaTierBackgroundLayoutDefaultField(
  tierId: number,
  layer: ArenaBackgroundLayerKey,
  field: keyof ArenaBackgroundLayerTuningPayload["layout"],
): ArenaTierBackgroundLegacyField | undefined {
  const prefix = getLegacyArenaTierBackgroundLayoutDefaultPrefix(tierId, layer);

  if (!prefix) {
    return undefined;
  }

  const suffix = field === "scale" ? "Scale" : field === "alpha" ? "Alpha" : field === "visible" ? "Visible" : field.toUpperCase();
  const key = `${prefix}${suffix}`;

  return key in debugTuningDefaultFields || key in debugTuningBooleanDefaultFields ? key as ArenaTierBackgroundLegacyField : undefined;
}

function getLegacyArenaTierBackgroundParallaxDefaultField(
  tierId: number,
  layer: ArenaBackgroundLayerKey,
  field: keyof ArenaBackgroundLayerTuningPayload["parallax"],
): DebugTuningDefaultField | undefined {
  const prefix = getLegacyArenaTierBackgroundParallaxDefaultPrefix(tierId, layer);

  if (!prefix) {
    return undefined;
  }

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
  const key = `${prefix}${suffix}`;

  return key in debugTuningDefaultFields ? key as DebugTuningDefaultField : undefined;
}

function isBaseArenaBackgroundLayer(layer: ArenaBackgroundLayerKey): boolean {
  return layer === getArenaBackgroundLayerRole(layer);
}

function getArenaBackgroundLayerRole(layer: ArenaBackgroundLayerKey): ArenaBackgroundLayerRole {
  const match = /^(back|mid|ground|front|ambient)(?:-\d+)?$/u.exec(layer);

  return match ? match[1] as ArenaBackgroundLayerRole : "ground";
}

function isArenaBackgroundLayerKey(value: string): value is ArenaBackgroundLayerKey {
  return /^(back|mid|ground|front|ambient)(?:-\d+)?$/u.test(value);
}

function getLegacyArenaTierBackgroundLayoutDefaultPrefix(tierId: number, layer: ArenaBackgroundLayerKey): string | undefined {
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

  if (tierId === 2) {
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

  return undefined;
}

function getLegacyArenaTierBackgroundParallaxDefaultPrefix(tierId: number, layer: ArenaBackgroundLayerKey): string | undefined {
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

  if (tierId === 2) {
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

  return undefined;
}

function replaceDefaultArenaBackgroundTiers(source: string, value: ArenaBackgroundTierTuningPayload): string {
  const pattern = /(export const defaultDebugTuning: ArenaDebugTuning = \{[\s\S]*?\n\s*arenaBackgroundTiers: )[\s\S]*?(\n\s*arenaTier1BackFollowX: )/u;

  if (!pattern.test(source)) {
    throw new Error("Could not find defaultDebugTuning.arenaBackgroundTiers in debugTuning.ts.");
  }

  return source.replace(pattern, `$1${formatJsonLikeObject(value)},$2`);
}

function readDefaultArenaBackgroundTierTuningsFromSource(source: string): ArenaBackgroundTierTuningPayload {
  const match = source.match(/export const defaultDebugTuning: ArenaDebugTuning = \{[\s\S]*?\n\s*arenaBackgroundTiers: ([\s\S]*?),\n\s*arenaTier1BackFollowX: /u);

  if (!match?.[1]) {
    throw new Error("Could not find defaultDebugTuning.arenaBackgroundTiers in debugTuning.ts.");
  }

  try {
    return readArenaBackgroundTierTunings(JSON.parse(match[1]));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid arenaBackgroundTiers JSON.";

    throw new Error(`Could not parse defaultDebugTuning.arenaBackgroundTiers: ${message}`);
  }
}

export function pickDebugTuningDefaultUpdates(payload: unknown): DebugTuningDefaultUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const numericUpdates = Object.fromEntries(
    Object.entries(debugTuningDefaultFields).map(([fieldName, payloadField]) => [
      fieldName,
      readFiniteNumber(payload as DebugTuningDefaultPayload, payloadField),
    ]),
  ) as Record<DebugTuningDefaultField, number>;
  const booleanUpdates = Object.fromEntries(
    Object.entries(debugTuningBooleanDefaultFields).map(([fieldName, payloadField]) => [
      fieldName,
      readBoolean(payload as DebugTuningBooleanDefaultPayload, payloadField),
    ]),
  ) as Record<DebugTuningBooleanDefaultField, boolean>;

  return {
    ...numericUpdates,
    ...booleanUpdates,
    arenaBackgroundTiers: readArenaBackgroundTierTunings((payload as { arenaBackgroundTiers?: unknown }).arenaBackgroundTiers),
  };
}

export function pickArenaTierBackgroundDefaultUpdates(payload: unknown): ArenaTierBackgroundDefaultUpdates {
  const input = readPlainObject(payload, "arena tier background values");
  const tierId = Math.max(1, Math.round(readFinitePayloadNumber(input.tierId, "arena tier background tierId")));
  const variantId = normalizeArenaBackgroundVariantId(input.variantId);
  const layersInput = readPlainObject(input.layers, "arena tier background layers");
  const layers: ArenaTierBackgroundDefaultUpdates["layers"] = {};

  Object.entries(layersInput).forEach(([layer, layerInput]) => {
    if (!isArenaBackgroundLayerKey(layer)) {
      return;
    }

    layers[layer] = readArenaBackgroundLayerTuning(layerInput, `${tierId}.${layer}`, layer);
  });

  if (Object.keys(layers).length === 0) {
    throw new Error("Expected at least one arena tier background layer.");
  }

  return { tierId, variantId, layers };
}

export function applyPlayerSettingDefaultUpdates(source: string, updates: PlayerSettingDefaultUpdates): string {
  return Object.entries(updates).reduce((nextSource, [constantName, value]) => {
    const pattern = new RegExp(`export const ${constantName}: PlayerHudMode = "(?:immersive|classic)";`);

    if (!pattern.test(nextSource)) {
      throw new Error(`Could not find ${constantName} in settingsMenu.ts.`);
    }

    return nextSource.replace(pattern, `export const ${constantName}: PlayerHudMode = "${value}";`);
  }, source);
}

export function pickPlayerSettingDefaultUpdates(payload: unknown): PlayerSettingDefaultUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  return Object.fromEntries(
    Object.entries(playerSettingDefaultFields).map(([constantName, payloadField]) => [
      constantName,
      readPlayerHudMode(payload as PlayerSettingDefaultPayload, payloadField),
    ]),
  ) as PlayerSettingDefaultUpdates;
}

export function applyRigPartDefaultUpdates(source: string, updates: RigPartUpdates): string {
  const pattern = /export const DEFAULT_RIG_PARTS: Record<RigPartKey, RigPartTuning> = (?:createDefaultRigParts\(\)|\{[\s\S]*?\});/;

  if (!pattern.test(source)) {
    throw new Error("Could not find DEFAULT_RIG_PARTS in debugTuning.ts.");
  }

  return source.replace(pattern, formatRigPartDefaults(updates));
}

export function pickRigPartDefaultUpdates(payload: unknown): RigPartUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const rigParts = (payload as { rigParts?: unknown }).rigParts;

  if (!rigParts || typeof rigParts !== "object" || Array.isArray(rigParts)) {
    throw new Error("Expected rigParts in debug tuning payload.");
  }

  return Object.fromEntries(rigPartKeys.map((key) => [key, readRigPartTuning(rigParts, key)])) as RigPartUpdates;
}

export function applyBodyPartLayerDefaultUpdates(
  source: string,
  updates: BodyPartLayerUpdates,
  bodyAnimationUpdates: BodyPresetAnimationUpdates,
  bodyPresetFacePartUpdates: BodyPresetFacePartUpdates,
  bodyPresetFaceAssetLayerUpdates: BodyPresetFaceAssetLayerUpdates,
  bodyPresetAppearanceLayerUpdates: BodyPresetAppearanceLayerUpdates,
): string {
  const pattern = /export const DEFAULT_BODY_PRESET_TUNING: Record<PaperDollBodyPreset, BodyPresetTuning> = \{[\s\S]*?\n\};/;

  if (!pattern.test(source)) {
    throw new Error("Could not find DEFAULT_BODY_PRESET_TUNING in debugTuning.ts.");
  }

  return source.replace(
    pattern,
    formatBodyPresetTuningDefaults(
      updates,
      bodyAnimationUpdates,
      bodyPresetFacePartUpdates,
      bodyPresetFaceAssetLayerUpdates,
      bodyPresetAppearanceLayerUpdates,
    ),
  );
}

export function pickBodyPartLayerDefaultUpdates(payload: unknown): BodyPartLayerUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const bodyPresetTuning = (payload as { bodyPresetTuning?: unknown }).bodyPresetTuning;

  if (!bodyPresetTuning || typeof bodyPresetTuning !== "object" || Array.isArray(bodyPresetTuning)) {
    throw new Error("Expected bodyPresetTuning in debug tuning payload.");
  }

  return Object.fromEntries(
    bodyPresetKeys.map((presetKey) => {
      const presetTuning = (bodyPresetTuning as Partial<Record<BodyPresetKey, { bodyPartLayers?: unknown }>>)[presetKey];

      if (!presetTuning || typeof presetTuning !== "object" || Array.isArray(presetTuning)) {
        throw new Error(`Expected ${presetKey} body preset tuning in debug tuning payload.`);
      }

      const bodyPartLayers = presetTuning.bodyPartLayers;

      if (!bodyPartLayers || typeof bodyPartLayers !== "object" || Array.isArray(bodyPartLayers)) {
        throw new Error(`Expected ${presetKey} bodyPartLayers in debug tuning payload.`);
      }

      return [presetKey, Object.fromEntries(rigPartKeys.map((key) => [key, readRigPartTuning(bodyPartLayers, key)]))];
    }),
  ) as BodyPartLayerUpdates;
}

export function pickBodyPresetAnimationDefaultUpdates(payload: unknown): BodyPresetAnimationUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const bodyPresetTuning = readBodyPresetTuningPayload(payload);

  return Object.fromEntries(
    bodyPresetKeys.map((presetKey) => {
      const bodyAnimations = readBodyPresetAnimationMap(bodyPresetTuning, presetKey);

      return [presetKey, Object.fromEntries(bodyAnimationKeys.map((key) => [key, readBodyAnimationUpdate(bodyAnimations, key)]))];
    }),
  ) as BodyPresetAnimationUpdates;
}

export function pickBodyPresetFacePartDefaultUpdates(payload: unknown): BodyPresetFacePartUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const bodyPresetTuning = readBodyPresetTuningPayload(payload);

  return Object.fromEntries(
    bodyPresetKeys.map((presetKey) => {
      const faceParts = readBodyPresetFacePartMap(bodyPresetTuning, presetKey);

      return [presetKey, Object.fromEntries(facePartKeys.map((key) => [key, readFacePartTuning(faceParts, key)]))];
    }),
  ) as BodyPresetFacePartUpdates;
}

export function pickBodyPresetFaceAssetLayerDefaultUpdates(payload: unknown): BodyPresetFaceAssetLayerUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const bodyPresetTuning = readBodyPresetTuningPayload(payload);

  return Object.fromEntries(
    bodyPresetKeys.map((presetKey) => {
      const faceAssetLayers = readBodyPresetFaceAssetLayerMap(bodyPresetTuning, presetKey);

      return [presetKey, Object.fromEntries(faceAssetLayerKeys.map((key) => [key, readFaceAssetLayerTuning(faceAssetLayers, key)]))];
    }),
  ) as BodyPresetFaceAssetLayerUpdates;
}

export function pickBodyPresetAppearanceLayerDefaultUpdates(payload: unknown): BodyPresetAppearanceLayerUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const bodyPresetTuning = readBodyPresetTuningPayload(payload);

  return Object.fromEntries(
    bodyPresetKeys.map((presetKey) => {
      const appearanceLayers = readBodyPresetAppearanceLayerMap(bodyPresetTuning, presetKey);

      return [presetKey, Object.fromEntries(appearanceLayerKeys.map((key) => [key, readAppearanceLayerTuning(appearanceLayers, key)]))];
    }),
  ) as BodyPresetAppearanceLayerUpdates;
}

export function applyFacePartDefaultUpdates(source: string, updates: FacePartUpdates): string {
  const pattern = /export const DEFAULT_FACE_PARTS: Record<FacePartKey, FacePartTuning> = (?:\{[\s\S]*?\});/;

  if (!pattern.test(source)) {
    throw new Error("Could not find DEFAULT_FACE_PARTS in debugTuning.ts.");
  }

  return source.replace(pattern, formatFacePartDefaults(updates));
}

export function pickFacePartDefaultUpdates(payload: unknown): FacePartUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const faceParts = readActiveFacePartMap(payload);

  return Object.fromEntries(facePartKeys.map((key) => [key, readFacePartTuning(faceParts, key)])) as FacePartUpdates;
}

export function applyEquipmentDefaultUpdates(source: string, updates: EquipmentUpdates): string {
  const pattern = /export const DEFAULT_EQUIPMENT: Record<EquipmentSlotKey, EquipmentTuning> = (?:\{[\s\S]*?\});/;

  if (!pattern.test(source)) {
    throw new Error("Could not find DEFAULT_EQUIPMENT in debugTuning.ts.");
  }

  return source.replace(pattern, formatEquipmentDefaults(updates));
}

export function pickEquipmentDefaultUpdates(payload: unknown): EquipmentUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const equipment = (payload as { equipment?: unknown }).equipment;

  if (!equipment || typeof equipment !== "object" || Array.isArray(equipment)) {
    throw new Error("Expected equipment in debug tuning payload.");
  }

  return Object.fromEntries(equipmentSlotKeys.map((key) => [key, readEquipmentTuning(equipment, key)])) as EquipmentUpdates;
}

export function applyEquipmentItemDefaultUpdates(source: string, updates: EquipmentItemUpdates): string {
  const pattern = /export const DEFAULT_EQUIPMENT_ITEM_TUNING: Record<string, EquipmentTuning> = (?:\{[\s\S]*?\});/;

  if (!pattern.test(source)) {
    throw new Error("Could not find DEFAULT_EQUIPMENT_ITEM_TUNING in debugTuning.ts.");
  }

  return source.replace(pattern, formatEquipmentItemDefaults(updates));
}

export function pickEquipmentItemDefaultUpdates(payload: unknown, excludedItemIds: ReadonlySet<string> = new Set()): EquipmentItemUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const equipmentItems = (payload as { equipmentItems?: unknown }).equipmentItems;

  if (!equipmentItems || typeof equipmentItems !== "object" || Array.isArray(equipmentItems)) {
    throw new Error("Expected equipmentItems in debug tuning payload.");
  }

  return Object.fromEntries(
    Object.entries(equipmentItems).flatMap(([itemId, tuning]) => {
      if (!itemId.trim() || excludedItemIds.has(itemId)) {
        return [];
      }

      return [[itemId, readLooseEquipmentTuning(tuning, itemId)]];
    }),
  );
}

export function pickGeneratedEquipmentItemTuningUpdates(
  payload: unknown,
  generatedEquipmentItemIds: ReadonlySet<string>,
): EquipmentItemUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const equipmentItems = (payload as { equipmentItems?: unknown }).equipmentItems;

  if (!equipmentItems || typeof equipmentItems !== "object" || Array.isArray(equipmentItems)) {
    throw new Error("Expected equipmentItems in debug tuning payload.");
  }

  return Object.fromEntries(
    Object.entries(equipmentItems).flatMap(([itemId, tuning]) => {
      if (!itemId.trim() || !generatedEquipmentItemIds.has(itemId)) {
        return [];
      }

      return [[itemId, readLooseEquipmentTuning(tuning, itemId)]];
    }),
  );
}

function applyGeneratedEquipmentItemTuningUpdates(
  records: GeneratedEquipmentJsonRecord[],
  updates: EquipmentItemUpdates,
): GeneratedEquipmentJsonRecord[] {
  return records.map((record) => {
    const equipmentTuning = updates[record.id];

    return equipmentTuning ? { ...record, equipmentTuning } : record;
  });
}

export function applySlashArcDefaultUpdates(source: string, updates: SlashArcUpdates): string {
  const pattern = /export const DEFAULT_SLASH_ARCS: Record<SlashArcAttackKey, SlashArcTuning> = (?:\{[\s\S]*?\});/;

  if (!pattern.test(source)) {
    throw new Error("Could not find DEFAULT_SLASH_ARCS in debugTuning.ts.");
  }

  return source.replace(pattern, formatSlashArcDefaults(updates));
}

export function pickSlashArcDefaultUpdates(payload: unknown): SlashArcUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const slashArcs = (payload as { slashArcs?: unknown }).slashArcs;

  if (!slashArcs || typeof slashArcs !== "object" || Array.isArray(slashArcs)) {
    throw new Error("Expected slashArcs in debug tuning payload.");
  }

  return Object.fromEntries(slashArcAttackKeys.map((key) => [key, readSlashArcTuning(slashArcs, key)])) as SlashArcUpdates;
}

export function applyWardShieldDefaultUpdates(source: string, updates: WardShieldUpdates): string {
  const pattern = /export const DEFAULT_WARD_SHIELD_TUNING: WardShieldTuning = (?:\{[\s\S]*?\});/;

  if (!pattern.test(source)) {
    throw new Error("Could not find DEFAULT_WARD_SHIELD_TUNING in debugTuning.ts.");
  }

  return source.replace(pattern, formatWardShieldDefault(updates));
}

export function pickWardShieldDefaultUpdates(payload: unknown): WardShieldUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const wardShield = (payload as { wardShield?: unknown }).wardShield;

  if (!wardShield || typeof wardShield !== "object" || Array.isArray(wardShield)) {
    throw new Error("Expected wardShield in debug tuning payload.");
  }

  return readWardShieldTuning(wardShield);
}

export function applyActionButtonOffsetDefaultUpdates(source: string, updates: ActionButtonOffsetUpdates): string {
  const pattern =
    /export const DEFAULT_ACTION_BUTTON_OFFSETS: Record<ActionButtonOffsetKey, ActionButtonOffsetTuning> = (?:createDefaultActionButtonOffsets\(\)|\{[\s\S]*?\});/;

  if (!pattern.test(source)) {
    throw new Error("Could not find DEFAULT_ACTION_BUTTON_OFFSETS in debugTuning.ts.");
  }

  return source.replace(pattern, formatActionButtonOffsetDefaults(updates));
}

export function pickActionButtonOffsetDefaultUpdates(payload: unknown): ActionButtonOffsetUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const offsets = (payload as { actionButtonOffsets?: unknown }).actionButtonOffsets;

  if (!offsets || typeof offsets !== "object" || Array.isArray(offsets)) {
    throw new Error("Expected actionButtonOffsets in debug tuning payload.");
  }

  return Object.fromEntries(actionButtonOffsetKeys.map((key) => [key, readActionButtonOffsetTuning(offsets, key)])) as ActionButtonOffsetUpdates;
}

export function applyClassicActionButtonSlotDefaultUpdates(source: string, updates: ClassicActionButtonSlotUpdates): string {
  const pattern =
    /export const DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS: Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>> = \{[\s\S]*?\n\};/;

  if (!pattern.test(source)) {
    throw new Error("Could not find DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS in debugTuning.ts.");
  }

  return source.replace(pattern, formatClassicActionButtonSlotDefaults(updates));
}

export function pickClassicActionButtonSlotDefaultUpdates(payload: unknown): ClassicActionButtonSlotUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const slots = (payload as { classicActionButtonSlots?: unknown }).classicActionButtonSlots;

  if (!slots || typeof slots !== "object" || Array.isArray(slots)) {
    throw new Error("Expected classicActionButtonSlots in debug tuning payload.");
  }

  return Object.fromEntries(
    classicActionWheelModes.map((mode) => [mode, readClassicActionButtonSlotModeTuning(slots, mode)]),
  ) as ClassicActionButtonSlotUpdates;
}

export function applyBodyAnimationDefaultUpdates(source: string, updates: BodyAnimationUpdates): string {
  const constantName = bodyAnimationDefaultConstants[updates.key];
  const pattern = new RegExp(`export const ${constantName}: BodyAnimationTuning = (?:createDefault[A-Za-z]+Animation\\(\\);|\\{[\\s\\S]*?\\r?\\n\\};)`);

  if (!pattern.test(source)) {
    throw new Error(`Could not find ${constantName} in debugTuning.ts.`);
  }

  return source.replace(pattern, formatBodyAnimationDefaults(constantName, updates));
}

export function applyBodyPresetAnimationDefaultUpdates(source: string, updates: BodyPresetSelectedAnimationUpdates): string {
  const declarationPattern = /export const DEFAULT_BODY_PRESET_TUNING: Record<PaperDollBodyPreset, BodyPresetTuning> = \{/;
  const declarationMatch = declarationPattern.exec(source);

  if (!declarationMatch) {
    throw new Error("Could not find DEFAULT_BODY_PRESET_TUNING in debugTuning.ts.");
  }

  const rootStart = declarationMatch.index + declarationMatch[0].lastIndexOf("{");
  const rootEnd = findMatchingObjectBrace(source, rootStart);
  const presetProperty = findObjectPropertyObject(source, rootStart, rootEnd, updates.presetKey, "body preset");
  const bodyAnimationsProperty = findObjectPropertyObject(
    source,
    presetProperty.valueStart,
    presetProperty.valueEnd,
    "bodyAnimations",
    `${updates.presetKey} bodyAnimations`,
  );
  const animationProperty = findObjectPropertyObject(
    source,
    bodyAnimationsProperty.valueStart,
    bodyAnimationsProperty.valueEnd,
    updates.animation.key,
    `${updates.presetKey} ${updates.animation.key} animation`,
  );
  const formattedAnimation = formatBodyAnimationObject(updates.animation, animationProperty.indent);

  return `${source.slice(0, animationProperty.valueStart)}${formattedAnimation}${source.slice(animationProperty.valueEnd + 1)}`;
}

export function pickActiveBodyPresetAnimationDefaultUpdates(payload: unknown): BodyPresetSelectedAnimationUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  return {
    presetKey: readBodyPresetKey((payload as { paperDollBodyPreset?: unknown }).paperDollBodyPreset),
    animation: pickBodyAnimationUpdates(payload),
  };
}

export function pickBodyAnimationUpdates(payload: unknown): BodyAnimationUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const selectedBodyAnimation = (payload as { selectedBodyAnimation?: unknown }).selectedBodyAnimation;

  if (!isBodyAnimationKey(selectedBodyAnimation)) {
    throw new Error("Expected selectedBodyAnimation in debug tuning payload.");
  }

  const bodyAnimations = readActiveBodyAnimationMap(payload);

  return readBodyAnimationUpdate(bodyAnimations, selectedBodyAnimation);
}

function readActiveBodyAnimationMap(payload: object): Partial<Record<BodyAnimationKey, unknown>> {
  const presetKey = readBodyPresetKey((payload as { paperDollBodyPreset?: unknown }).paperDollBodyPreset);
  const bodyPresetTuning = (payload as { bodyPresetTuning?: unknown }).bodyPresetTuning;

  if (bodyPresetTuning && typeof bodyPresetTuning === "object" && !Array.isArray(bodyPresetTuning)) {
    return readBodyPresetAnimationMap(bodyPresetTuning, presetKey);
  }

  const bodyAnimations = (payload as { bodyAnimations?: unknown }).bodyAnimations;

  if (!bodyAnimations || typeof bodyAnimations !== "object" || Array.isArray(bodyAnimations)) {
    throw new Error("Expected bodyAnimations in debug tuning payload.");
  }

  return bodyAnimations as Partial<Record<BodyAnimationKey, unknown>>;
}

function readActiveFacePartMap(payload: object): Partial<Record<FacePartKey, unknown>> {
  const presetKey = readBodyPresetKey((payload as { paperDollBodyPreset?: unknown }).paperDollBodyPreset);
  const bodyPresetTuning = (payload as { bodyPresetTuning?: unknown }).bodyPresetTuning;

  if (bodyPresetTuning && typeof bodyPresetTuning === "object" && !Array.isArray(bodyPresetTuning)) {
    return readBodyPresetFacePartMap(bodyPresetTuning, presetKey);
  }

  const faceParts = (payload as { faceParts?: unknown }).faceParts;

  if (!faceParts || typeof faceParts !== "object" || Array.isArray(faceParts)) {
    throw new Error("Expected faceParts in debug tuning payload.");
  }

  return faceParts as Partial<Record<FacePartKey, unknown>>;
}

function readBodyPresetTuningPayload(
  payload: unknown,
): Partial<
  Record<
    BodyPresetKey,
    { bodyAnimations?: unknown; bodyPartLayers?: unknown; faceParts?: unknown; faceAssetLayers?: unknown; appearanceLayers?: unknown }
  >
> {
  const bodyPresetTuning = (payload as { bodyPresetTuning?: unknown }).bodyPresetTuning;

  if (!bodyPresetTuning || typeof bodyPresetTuning !== "object" || Array.isArray(bodyPresetTuning)) {
    throw new Error("Expected bodyPresetTuning in debug tuning payload.");
  }

  return bodyPresetTuning as Partial<
    Record<
      BodyPresetKey,
      { bodyAnimations?: unknown; bodyPartLayers?: unknown; faceParts?: unknown; faceAssetLayers?: unknown; appearanceLayers?: unknown }
    >
  >;
}

function readBodyPresetAnimationMap(
  bodyPresetTuning: Partial<Record<BodyPresetKey, { bodyAnimations?: unknown }>>,
  presetKey: BodyPresetKey,
): Partial<Record<BodyAnimationKey, unknown>> {
  const presetTuning = bodyPresetTuning[presetKey];

  if (!presetTuning || typeof presetTuning !== "object" || Array.isArray(presetTuning)) {
    throw new Error(`Expected ${presetKey} body preset tuning in debug tuning payload.`);
  }

  const bodyAnimations = presetTuning.bodyAnimations;

  if (!bodyAnimations || typeof bodyAnimations !== "object" || Array.isArray(bodyAnimations)) {
    throw new Error(`Expected ${presetKey} bodyAnimations in debug tuning payload.`);
  }

  return bodyAnimations as Partial<Record<BodyAnimationKey, unknown>>;
}

function readBodyPresetFacePartMap(
  bodyPresetTuning: Partial<Record<BodyPresetKey, { faceParts?: unknown }>>,
  presetKey: BodyPresetKey,
): Partial<Record<FacePartKey, unknown>> {
  const presetTuning = bodyPresetTuning[presetKey];

  if (!presetTuning || typeof presetTuning !== "object" || Array.isArray(presetTuning)) {
    throw new Error(`Expected ${presetKey} body preset tuning in debug tuning payload.`);
  }

  const faceParts = presetTuning.faceParts;

  if (!faceParts || typeof faceParts !== "object" || Array.isArray(faceParts)) {
    throw new Error(`Expected ${presetKey} faceParts in debug tuning payload.`);
  }

  return faceParts as Partial<Record<FacePartKey, unknown>>;
}

function readBodyPresetFaceAssetLayerMap(
  bodyPresetTuning: Partial<Record<BodyPresetKey, { faceAssetLayers?: unknown }>>,
  presetKey: BodyPresetKey,
): Partial<Record<FaceAssetLayerKey, unknown>> {
  const presetTuning = bodyPresetTuning[presetKey];

  if (!presetTuning || typeof presetTuning !== "object" || Array.isArray(presetTuning)) {
    throw new Error(`Expected ${presetKey} body preset tuning in debug tuning payload.`);
  }

  const faceAssetLayers = presetTuning.faceAssetLayers;

  if (!faceAssetLayers || typeof faceAssetLayers !== "object" || Array.isArray(faceAssetLayers)) {
    throw new Error(`Expected ${presetKey} faceAssetLayers in debug tuning payload.`);
  }

  return faceAssetLayers as Partial<Record<FaceAssetLayerKey, unknown>>;
}

function readBodyPresetAppearanceLayerMap(
  bodyPresetTuning: Partial<Record<BodyPresetKey, { appearanceLayers?: unknown }>>,
  presetKey: BodyPresetKey,
): Partial<Record<AppearanceLayerKey, unknown>> {
  const presetTuning = bodyPresetTuning[presetKey];

  if (!presetTuning || typeof presetTuning !== "object" || Array.isArray(presetTuning)) {
    throw new Error(`Expected ${presetKey} body preset tuning in debug tuning payload.`);
  }

  const appearanceLayers = presetTuning.appearanceLayers;

  if (!appearanceLayers || typeof appearanceLayers !== "object" || Array.isArray(appearanceLayers)) {
    throw new Error(`Expected ${presetKey} appearanceLayers in debug tuning payload.`);
  }

  return appearanceLayers as Partial<Record<AppearanceLayerKey, unknown>>;
}

function readBodyAnimationUpdate(bodyAnimations: Partial<Record<BodyAnimationKey, unknown>>, key: BodyAnimationKey): BodyAnimationUpdates {
  const bodyAnimation = bodyAnimations[key];

  if (!bodyAnimation || typeof bodyAnimation !== "object" || Array.isArray(bodyAnimation)) {
    throw new Error(`Expected ${key} animation in debug tuning payload.`);
  }

  const animation = bodyAnimation as {
    enabled?: unknown;
    duration?: unknown;
    base?: unknown;
    breath?: unknown;
    faceBase?: unknown;
    faceBreath?: unknown;
    activeParts?: unknown;
    variantId?: unknown;
    variantLabel?: unknown;
    variantWeight?: unknown;
    appliesToAllWeapons?: unknown;
    weaponClasses?: unknown;
    selectedVariantId?: unknown;
    movementStartKeyframeId?: unknown;
    startKeyframeId?: unknown;
    impactKeyframeId?: unknown;
    keyframes?: unknown;
    variants?: unknown;
  };

  if (typeof animation.enabled !== "boolean") {
    throw new Error("Invalid body animation value: enabled.");
  }

  if (typeof animation.duration !== "number" || !Number.isFinite(animation.duration)) {
    throw new Error("Invalid body animation value: duration.");
  }

  const duration = Math.max(240, Math.min(2400, animation.duration));
  const base = readRigPartRecord(animation.base, "base");
  const breath = readRigPartRecord(animation.breath, "breath");
  const faceBase = readFacePartRecord(animation.faceBase, "faceBase");
  const faceBreath = readFacePartRecord(animation.faceBreath, "faceBreath");
  const keyframes = readBodyAnimationKeyframes(animation.keyframes, { duration, base, breath, faceBase, faceBreath });
  const variants = readBodyAnimationVariants(animation.variants);

  return {
    key,
    enabled: animation.enabled,
    duration,
    variantId: readBodyAnimationVariantId(animation.variantId, bodyAnimationDefaultVariantId),
    variantLabel: readBodyAnimationVariantLabel(animation.variantLabel, bodyAnimationDefaultVariantId),
    variantWeight: readBodyAnimationVariantWeight(animation.variantWeight),
    appliesToAllWeapons: typeof animation.appliesToAllWeapons === "boolean" ? animation.appliesToAllWeapons : true,
    weaponClasses: readBodyAnimationWeaponClasses(animation.weaponClasses),
    selectedVariantId: readBodyAnimationSelectedVariantId(animation.selectedVariantId, variants),
    base,
    breath,
    faceBase,
    faceBreath,
    activeParts: readBodyAnimationActiveParts(animation.activeParts),
    movementStartKeyframeId: readBodyAnimationTimelineKeyframeId(
      animation.movementStartKeyframeId ?? animation.startKeyframeId,
      keyframes,
      "movement start",
    ),
    impactKeyframeId: readBodyAnimationImpactKeyframeId(animation.impactKeyframeId, keyframes),
    keyframes,
    variants,
  };
}

function readBodyAnimationVariants(input: unknown): BodyAnimationUpdates[] {
  if (input === undefined) {
    return [];
  }

  if (!Array.isArray(input)) {
    throw new Error("Expected body animation variants.");
  }

  const usedIds = new Set([bodyAnimationDefaultVariantId]);

  return input.flatMap((variant, index) => {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
      return [];
    }

    const update = readBodyAnimationUpdate({ idle: variant }, "idle");
    const rawVariant = variant as { variantId?: unknown; variantLabel?: unknown };
    const variantId = uniquifyBodyAnimationVariantId(readBodyAnimationVariantId(rawVariant.variantId, `variant-${index + 1}`), usedIds);

    return [
      {
        ...update,
        key: undefined,
        variantId,
        variantLabel: readBodyAnimationVariantLabel(rawVariant.variantLabel, variantId),
        selectedVariantId: undefined,
        variants: [],
      },
    ];
  });
}

function readBodyAnimationVariantId(input: unknown, fallback: string): string {
  const raw = typeof input === "string" ? input : fallback;
  const id = raw.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 48);

  return id || fallback;
}

function readBodyAnimationVariantLabel(input: unknown, fallback: string): string {
  const label = typeof input === "string" ? input.trim().slice(0, 48) : "";

  return label || fallback;
}

function readBodyAnimationVariantWeight(input: unknown): number {
  const value = typeof input === "number" && Number.isFinite(input) ? input : 1;

  return Math.round(Math.max(0, Math.min(20, value)) * 100) / 100;
}

function readBodyAnimationWeaponClasses(input: unknown): BodyAnimationWeaponClass[] {
  const source = Array.isArray(input) ? input : [];
  const classes: BodyAnimationWeaponClass[] = [];

  source.forEach((value) => {
    if (isBodyAnimationWeaponClass(value) && !classes.includes(value)) {
      classes.push(value);
    }
  });

  return classes;
}

function readBodyAnimationSelectedVariantId(input: unknown, variants: readonly BodyAnimationUpdates[]): string | undefined {
  const requestedId = typeof input === "string" ? input : undefined;

  if (!requestedId || requestedId === bodyAnimationDefaultVariantId) {
    return requestedId;
  }

  return variants.some((variant) => variant.variantId === requestedId) ? requestedId : undefined;
}

function uniquifyBodyAnimationVariantId(id: string, usedIds: Set<string>): string {
  let nextId = id === bodyAnimationDefaultVariantId ? "variant" : id;
  let suffix = 2;

  while (usedIds.has(nextId)) {
    nextId = `${id}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(nextId);

  return nextId;
}

export async function pickPromotedEquipmentItem(payload: unknown): Promise<PromotedEquipmentItem> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with equipment promotion values.");
  }

  const promotion = payload as PromoteEquipmentItemPayload;
  const item = readPlainObject(promotion.item, "item");
  const asset = readPlainObject(promotion.asset, "asset");
  const assetKeys = readStringRecord(promotion.assetKeys, "assetKeys");
  const kind = readGeneratedEquipmentKind(item.kind);
  const equipmentSlot = readEquipmentSlot(item.equipmentSlot);
  const sourceEquipmentTuning = readPromotedEquipmentTuning(promotion.equipmentTuning);
  const mirrorPairFlipX = sourceEquipmentTuning.flipX;
  const equipmentTuning = { ...sourceEquipmentTuning, flipX: false };
  const assetKey = readNonEmptyString(asset.key, "asset.key");
  const sourcePath = readAssetSourcePath(asset.sourcePath, getEquipmentAssetSourcePrefix(kind), "asset.sourcePath", [".png", ".webp"]);
  const lowSourcePath =
    typeof asset.lowSourcePath === "string" && asset.lowSourcePath.trim()
      ? readAssetSourcePath(asset.lowSourcePath, getEquipmentAssetLowSourcePrefix(kind), "asset.lowSourcePath")
      : undefined;
  const armorCategory = kind === "armor" ? readArmorCategory(item.armorCategory) : undefined;
  const name = readNonEmptyString(promotion.name, "name").slice(0, 80);
  const armorHp =
    kind === "armor" ? Math.max(0, Math.min(promotedEquipmentMaxArmorHp, Math.floor(readFinitePayloadNumber(promotion.armorHp, "armorHp")))) : undefined;
  const damageBonus =
    kind === "weapon"
      ? Math.max(0, Math.min(promotedEquipmentMaxDamageBonus, Math.floor(readFinitePayloadNumber(promotion.damageBonus, "damageBonus"))))
      : undefined;
  const weaponClass = kind === "weapon" ? readWeaponClass(item.weaponClass, getWeaponClassFromText(`${assetKey} ${name}`)) : undefined;
  const availability = readPromotedEquipmentAvailability(promotion.availability, promotion.addToShop === true);
  const rarity = availability.bossUnique ? "unique" : readItemRarity(item.rarity, getDefaultGeneratedItemRarity(kind, armorCategory, weaponClass));
  const price = availability.shop ? Math.max(0, Math.min(promotedEquipmentMaxPrice, Math.floor(readFinitePayloadNumber(promotion.price, "price")))) : 0;
  const categoryId = getArmoryCategoryId(equipmentSlot);
  const id = `generated_equipment_${toIdentifier(assetKey)}`;

  validateGeneratedEquipmentSlot(kind, equipmentSlot);

  if (!Object.values(assetKeys).includes(assetKey)) {
    throw new Error("Promoted item assetKeys must reference asset.key.");
  }

  const promotedAssetPaths = await preparePromotedEquipmentAsset(sourcePath, lowSourcePath);

  return {
    mirrorPairFlipX,
    record: {
      id,
      name,
      kind,
      rarity,
      ...(armorCategory ? { armorCategory } : {}),
      ...(armorHp !== undefined ? { armorHp } : {}),
      ...(damageBonus !== undefined ? { damageBonus } : {}),
      ...(weaponClass ? { weaponClass } : {}),
      equipmentSlot,
      assetKeys,
      equipmentTuning,
      asset: {
        key: assetKey,
        sourcePath: promotedAssetPaths.sourcePath,
        ...(promotedAssetPaths.lowSourcePath ? { lowSourcePath: promotedAssetPaths.lowSourcePath } : {}),
      },
      availability,
      ...(availability.shop && kind === "armor" && categoryId
        ? {
            armoryProduct: {
              id,
              name,
              price,
              itemIds: [id],
              categoryId,
            },
          }
        : {}),
      ...(availability.shop && kind === "weapon"
        ? {
            weaponProduct: {
              id,
              name,
              price,
              itemIds: [id],
              categoryId: getWeaponCategoryId(assetKey, name, weaponClass),
            },
          }
        : {}),
    },
  };
}

async function pickPromotedEquipmentSet(payload: unknown): Promise<PromotedEquipmentSet> {
  const input = readPlainObject(payload, "equipment set promotion") as PromoteEquipmentSetPayload;
  const name = readNonEmptyString(input.setName, "setName").slice(0, 80);
  const entries = await pickEquipmentSetImportEntries(input);
  const availability = readPromotedEquipmentAvailability(input.availability, false);
  const rarity = availability.bossUnique ? "unique" : readItemRarity(input.rarity, "common");

  return {
    name,
    entries,
    rarity,
    availability,
  };
}

async function pickPromotedWeaponImportEntries(payload: unknown): Promise<PromotedWeaponImportEntry[]> {
  const input = readPlainObject(payload, "weapon import promotion") as PromoteWeaponImportsPayload;

  if (!Array.isArray(input.entries) || input.entries.length === 0) {
    throw new Error("Select at least one weapon import asset.");
  }

  const sourcePaths = new Set<string>();
  const targetPaths = new Set<string>();
  const assetKeys = new Set<string>();
  const entries: PromotedWeaponImportEntry[] = [];

  for (const rawEntry of input.entries) {
    const raw = readPlainObject(rawEntry, "weapon import entry") as PromoteWeaponImportEntryPayload;
    const sourcePath = readWeaponImportSourcePath(raw.sourcePath);
    const name = readNonEmptyString(raw.name, "weapon import name").slice(0, 80);
    const weaponClass = readWeaponClass(raw.weaponClass, getWeaponClassFromText(`${sourcePath} ${name}`));
    const assetKey = getWeaponImportAssetKey(name, weaponClass);
    const targetSourcePath = `assets/fighters/weapons/${assetKey}.webp`;
    const targetLowSourcePath = targetSourcePath.replace(/^assets\//, "assets-low/");
    const availability = readPromotedEquipmentAvailability(raw.availability, true);
    const rarity = availability.bossUnique ? "unique" : readItemRarity(raw.rarity, getDefaultGeneratedItemRarity("weapon", undefined, weaponClass));
    const damageBonus = Math.max(0, Math.min(promotedEquipmentMaxDamageBonus, Math.floor(readFinitePayloadNumber(raw.damageBonus, "weapon import damageBonus"))));
    const price = availability.shop ? Math.max(0, Math.min(promotedEquipmentMaxPrice, Math.floor(readFinitePayloadNumber(raw.price, "weapon import price")))) : 0;

    if (sourcePaths.has(sourcePath)) {
      throw new Error(`Duplicate weapon import source asset: ${sourcePath}.`);
    }

    if (targetPaths.has(targetSourcePath)) {
      throw new Error(`Duplicate weapon import target asset: ${targetSourcePath}.`);
    }

    if (assetKeys.has(assetKey)) {
      throw new Error(`Duplicate weapon import asset key: ${assetKey}.`);
    }

    await assertWeaponImportPathsAvailable(sourcePath, targetSourcePath, targetLowSourcePath);

    sourcePaths.add(sourcePath);
    targetPaths.add(targetSourcePath);
    assetKeys.add(assetKey);
    entries.push({
      sourcePath,
      targetSourcePath,
      targetLowSourcePath,
      assetKey,
      name,
      rarity,
      weaponClass,
      damageBonus,
      price,
      availability,
    });
  }

  return entries;
}

function createPromotedWeaponImportRecord(entry: PromotedWeaponImportEntry): GeneratedEquipmentJsonRecord {
  const id = `generated_equipment_${toIdentifier(entry.assetKey)}`;
  const equipmentSlot: EquipmentSlotKey = entry.weaponClass === "bow" ? "weaponBow" : "weaponMain";
  const assetKeyName = entry.weaponClass === "bow" ? "weaponBowAssetKey" : "weaponMainAssetKey";

  validateGeneratedEquipmentSlot("weapon", equipmentSlot);

  return {
    id,
    name: entry.name,
    kind: "weapon",
    rarity: entry.rarity,
    damageBonus: entry.damageBonus,
    weaponClass: entry.weaponClass,
    equipmentSlot,
    assetKeys: { [assetKeyName]: entry.assetKey },
    equipmentTuning: createDefaultPromotedWeaponTuning(),
    asset: {
      key: entry.assetKey,
      sourcePath: entry.targetSourcePath,
      lowSourcePath: entry.targetLowSourcePath,
    },
    availability: entry.availability,
    ...(entry.availability.shop
      ? {
          weaponProduct: {
            id,
            name: entry.name,
            price: entry.price,
            itemIds: [id],
            categoryId: getWeaponCategoryId(entry.assetKey, entry.name, entry.weaponClass),
          },
        }
      : {}),
  };
}

async function pickPromotedShieldImportEntries(payload: unknown): Promise<PromotedShieldImportEntry[]> {
  const input = readPlainObject(payload, "shield import promotion") as PromoteShieldImportsPayload;

  if (!Array.isArray(input.entries) || input.entries.length === 0) {
    throw new Error("Select at least one shield import asset.");
  }

  const sourcePaths = new Set<string>();
  const targetPaths = new Set<string>();
  const assetKeys = new Set<string>();
  const entries: PromotedShieldImportEntry[] = [];

  for (const rawEntry of input.entries) {
    const raw = readPlainObject(rawEntry, "shield import entry") as PromoteShieldImportEntryPayload;
    const sourcePath = readShieldImportSourcePath(raw.sourcePath);
    const assetKey = getAssetKeyFromSourcePath(sourcePath);
    const name = readNonEmptyString(raw.name, "shield import name").slice(0, 80);
    const targetSourcePath = `assets/fighters/armor/arms/${assetKey}.webp`;
    const targetLowSourcePath = targetSourcePath.replace(/^assets\//, "assets-low/");
    const availability = readPromotedEquipmentAvailability(raw.availability, true);
    const rarity = availability.bossUnique ? "unique" : readItemRarity(raw.rarity, getDefaultGeneratedItemRarity("armor", getArmorCategoryFromAssetKey(assetKey), undefined));
    const armorHp = Math.max(0, Math.min(promotedEquipmentMaxArmorHp, Math.floor(readFinitePayloadNumber(raw.armorHp, "shield import armorHp"))));
    const price = availability.shop ? Math.max(0, Math.min(promotedEquipmentMaxPrice, Math.floor(readFinitePayloadNumber(raw.price, "shield import price")))) : 0;

    if (sourcePaths.has(sourcePath)) {
      throw new Error(`Duplicate shield import source asset: ${sourcePath}.`);
    }

    if (targetPaths.has(targetSourcePath)) {
      throw new Error(`Duplicate shield import target asset: ${targetSourcePath}.`);
    }

    if (assetKeys.has(assetKey)) {
      throw new Error(`Duplicate shield import asset key: ${assetKey}.`);
    }

    await assertEquipmentImportPathsAvailable(sourcePath, targetSourcePath, targetLowSourcePath);

    sourcePaths.add(sourcePath);
    targetPaths.add(targetSourcePath);
    assetKeys.add(assetKey);
    entries.push({
      sourcePath,
      targetSourcePath,
      targetLowSourcePath,
      assetKey,
      name,
      rarity,
      armorHp,
      price,
      availability,
    });
  }

  return entries;
}

function createPromotedShieldImportRecord(entry: PromotedShieldImportEntry): GeneratedEquipmentJsonRecord {
  const id = `generated_equipment_${toIdentifier(entry.assetKey)}`;
  const categoryId = getArmoryCategoryId("shield");
  const armorCategory = getArmorCategoryFromAssetKey(entry.assetKey);

  validateGeneratedEquipmentSlot("armor", "shield");

  return {
    id,
    name: entry.name,
    kind: "armor",
    rarity: entry.rarity,
    ...(armorCategory ? { armorCategory } : {}),
    armorHp: entry.armorHp,
    equipmentSlot: "shield",
    assetKeys: { shieldAssetKey: entry.assetKey },
    equipmentTuning: createDefaultPromotedEquipmentTuning(),
    asset: {
      key: entry.assetKey,
      sourcePath: entry.targetSourcePath,
      lowSourcePath: entry.targetLowSourcePath,
    },
    availability: entry.availability,
    ...(entry.availability.shop && categoryId
      ? {
          armoryProduct: {
            id,
            name: entry.name,
            price: entry.price,
            itemIds: [id],
            categoryId,
          },
        }
      : {}),
  };
}

async function assertWeaponImportPathsAvailable(sourcePath: string, targetSourcePath: string, targetLowSourcePath: string): Promise<void> {
  await assertEquipmentImportPathsAvailable(sourcePath, targetSourcePath, targetLowSourcePath);
}

async function assertEquipmentImportPathsAvailable(sourcePath: string, targetSourcePath: string, targetLowSourcePath: string): Promise<void> {
  if (!(await projectSourceFileExists(sourcePath))) {
    throw new Error(`Source asset does not exist: ${sourcePath}.`);
  }

  if (await projectSourceFileExists(targetSourcePath)) {
    throw new Error(`Target asset already exists: ${targetSourcePath}.`);
  }

  if (await projectSourceFileExists(targetLowSourcePath)) {
    throw new Error(`Target low asset already exists: ${targetLowSourcePath}.`);
  }
}

async function writePromotedWeaponImportAssets(entries: readonly PromotedWeaponImportEntry[]): Promise<void> {
  for (const entry of entries) {
    await writePromotedWeaponImportAsset(entry.sourcePath, entry.targetSourcePath, entry.targetLowSourcePath);
  }
}

async function writePromotedWeaponImportAsset(sourcePath: string, targetSourcePath: string, targetLowSourcePath: string): Promise<void> {
  await writePromotedImportAsset(sourcePath, targetSourcePath, targetLowSourcePath);
}

async function writePromotedShieldImportAssets(entries: readonly PromotedShieldImportEntry[]): Promise<void> {
  for (const entry of entries) {
    await writePromotedImportAsset(entry.sourcePath, entry.targetSourcePath, entry.targetLowSourcePath);
  }
}

async function writePromotedImportAsset(sourcePath: string, targetSourcePath: string, targetLowSourcePath: string): Promise<void> {
  const source = await readFile(getProjectSourceUrl(sourcePath));
  const runtime = await createEquipmentWebp(source, getPromotedEquipmentRuntimeMaxSide(targetSourcePath), promotedEquipmentRuntimeWebpQuality);
  const low = await createEquipmentWebp(runtime, promotedEquipmentLowMaxSide, promotedEquipmentLowWebpQuality);
  const targetUrl = getProjectSourceUrl(targetSourcePath);
  const targetLowUrl = getProjectSourceUrl(targetLowSourcePath);

  await Promise.all([mkdir(new URL(".", targetUrl), { recursive: true }), mkdir(new URL(".", targetLowUrl), { recursive: true })]);
  await Promise.all([writeFile(targetUrl, runtime), writeFile(targetLowUrl, low)]);
}

async function removePromotedWeaponImportSourceFiles(entries: readonly PromotedWeaponImportEntry[]): Promise<void> {
  await removePromotedImportSourceFiles(entries);
}

async function removePromotedShieldImportSourceFiles(entries: readonly PromotedShieldImportEntry[]): Promise<void> {
  await removePromotedImportSourceFiles(entries);
}

async function removePromotedImportSourceFiles(entries: readonly { sourcePath: string }[]): Promise<void> {
  const sourcePaths = new Set(
    entries.flatMap((entry) => [
      entry.sourcePath,
      getEquipmentSetImportAlternateSourcePath(entry.sourcePath),
      getEquipmentSetImportLowSourcePath(entry.sourcePath),
      getEquipmentSetImportAlternateSourcePath(getEquipmentSetImportLowSourcePath(entry.sourcePath)),
    ]),
  );

  await Promise.all([...sourcePaths].map((sourcePath) => rm(getProjectSourceUrl(sourcePath), { force: true })));
}

async function createPromotedEquipmentSetRecords(
  promotion: PromotedEquipmentSet,
  existingRecords: readonly GeneratedEquipmentJsonRecord[],
): Promise<GeneratedEquipmentJsonRecord[]> {
  const records: GeneratedEquipmentJsonRecord[] = [];
  const equipmentSet = createPromotedEquipmentSetInfo(promotion, existingRecords);

  for (const entry of promotion.entries) {
    const record = await createPromotedEquipmentSetRecord(entry, promotion, equipmentSet);

    records.push(...(await createPromotedEquipmentRecords(record, true)));
  }

  return records;
}

function createPromotedEquipmentSetInfo(
  promotion: PromotedEquipmentSet,
  existingRecords: readonly GeneratedEquipmentJsonRecord[],
): GeneratedEquipmentSetInfo | undefined {
  const hasArmorEntry = promotion.entries.some((entry) => getEquipmentSetImportTargetConfig(entry.targetPrefix).kind === "armor");

  if (!hasArmorEntry) {
    return undefined;
  }

  const id = toIdentifier(promotion.name);
  const existingSet = existingRecords.find((record) => record.equipmentSet?.id === id)?.equipmentSet;

  if (existingSet) {
    return existingSet;
  }

  const nextRank = existingRecords.reduce((maxRank, record) => Math.max(maxRank, record.equipmentSet?.rank ?? -1), -1) + 1;

  return {
    id,
    name: promotion.name,
    rank: nextRank,
    ...(promotion.availability.bossUnique ? { grade: "boss" } : {}),
  };
}

async function createPromotedEquipmentSetRecord(
  entry: EquipmentSetImportEntry,
  promotion: PromotedEquipmentSet,
  equipmentSet: GeneratedEquipmentSetInfo | undefined,
): Promise<GeneratedEquipmentJsonRecord> {
  const config = getEquipmentSetImportTargetConfig(entry.targetPrefix);
  const assetKey = getAssetKeyFromSourcePath(entry.targetSourcePath);
  const id = `generated_equipment_${toIdentifier(assetKey)}`;
  const name = formatPromotedEquipmentSetItemName(config, assetKey);
  const promotedAssetPaths = await preparePromotedEquipmentAsset(entry.targetSourcePath, entry.targetLowSourcePath);
  const assetKeys = { [config.assetKeyName]: assetKey };
  const categoryId = getArmoryCategoryId(config.slot);
  const armorCategory = config.kind === "armor" ? getArmorCategoryFromAssetKey(assetKey) : undefined;
  const weaponClass = config.kind === "weapon" ? getWeaponClassFromText(`${assetKey} ${config.label}`) : undefined;

  validateGeneratedEquipmentSlot(config.kind, config.slot);

  return {
    id,
    name,
    kind: config.kind,
    rarity: promotion.rarity,
    ...(armorCategory ? { armorCategory } : {}),
    ...(config.kind === "armor" && equipmentSet ? { equipmentSet } : {}),
    ...(config.kind === "armor" ? { armorHp: 1 } : { damageBonus: 1 }),
    ...(weaponClass ? { weaponClass } : {}),
    equipmentSlot: config.slot,
    assetKeys,
    equipmentTuning: config.kind === "weapon" ? createDefaultPromotedWeaponTuning() : createDefaultPromotedEquipmentTuning(),
    asset: {
      key: assetKey,
      sourcePath: promotedAssetPaths.sourcePath,
      ...(promotedAssetPaths.lowSourcePath ? { lowSourcePath: promotedAssetPaths.lowSourcePath } : {}),
    },
    availability: promotion.availability,
    ...(promotion.availability.shop && config.kind === "armor" && categoryId
      ? {
          armoryProduct: {
            id,
            name,
            price: 0,
            itemIds: [id],
            categoryId,
          },
        }
      : {}),
    ...(promotion.availability.shop && config.kind === "weapon"
      ? {
          weaponProduct: {
            id,
            name,
            price: 0,
            itemIds: [id],
            categoryId: getWeaponCategoryId(assetKey, name, weaponClass),
          },
        }
      : {}),
  };
}

async function createPromotedEquipmentRecords(
  promotedItem: GeneratedEquipmentJsonRecord,
  mirrorPairFlipX: boolean,
): Promise<GeneratedEquipmentJsonRecord[]> {
  const mirroredItem = await createMirroredPromotedEquipmentRecord(promotedItem, mirrorPairFlipX);

  return mirroredItem ? [promotedItem, mirroredItem] : [promotedItem];
}

async function createMirroredPromotedEquipmentRecord(
  promotedItem: GeneratedEquipmentJsonRecord,
  mirrorPairFlipX: boolean,
): Promise<GeneratedEquipmentJsonRecord | undefined> {
  if (promotedItem.kind !== "armor") {
    return undefined;
  }

  const mirrorConfig = getPromotedEquipmentMirrorConfig(promotedItem.equipmentSlot);

  if (!mirrorConfig) {
    return undefined;
  }

  if (promotedItem.assetKeys[mirrorConfig.source.assetKeyName] !== promotedItem.asset.key) {
    throw new Error(`Promoted paired item must use ${mirrorConfig.source.assetKeyName}.`);
  }

  const mirrorAssetKey = replacePromotedEquipmentMirrorToken(
    promotedItem.asset.key,
    mirrorConfig.source.token,
    mirrorConfig.target.token,
    "asset.key",
  );
  const mirrorSourcePath = replacePromotedEquipmentMirrorToken(
    promotedItem.asset.sourcePath,
    mirrorConfig.source.token,
    mirrorConfig.target.token,
    "asset.sourcePath",
  );
  const mirrorLowSourcePath = promotedItem.asset.lowSourcePath
    ? replacePromotedEquipmentMirrorToken(promotedItem.asset.lowSourcePath, mirrorConfig.source.token, mirrorConfig.target.token, "asset.lowSourcePath")
    : undefined;
  const mirrorId = `generated_equipment_${toIdentifier(mirrorAssetKey)}`;

  const mirrorName = formatPromotedEquipmentMirrorName(promotedItem.name, mirrorConfig);
  const categoryId = getArmoryCategoryId(mirrorConfig.target.slot) ?? promotedItem.armoryProduct?.categoryId;
  const mirroredItem: GeneratedEquipmentJsonRecord = {
    id: mirrorId,
    name: mirrorName,
    kind: "armor",
    ...(promotedItem.rarity ? { rarity: promotedItem.rarity } : {}),
    ...(promotedItem.armorCategory ? { armorCategory: promotedItem.armorCategory } : {}),
    ...(promotedItem.equipmentSet ? { equipmentSet: promotedItem.equipmentSet } : {}),
    ...(promotedItem.armorHp !== undefined ? { armorHp: 0 } : {}),
    equipmentSlot: mirrorConfig.target.slot,
    assetKeys: { [mirrorConfig.target.assetKeyName]: mirrorAssetKey },
    equipmentTuning: mirrorPromotedEquipmentTuning(promotedItem.equipmentTuning),
    asset: {
      key: mirrorAssetKey,
      sourcePath: mirrorSourcePath,
      ...(mirrorLowSourcePath ? { lowSourcePath: mirrorLowSourcePath } : {}),
    },
    ...(promotedItem.availability ? { availability: promotedItem.availability } : {}),
    ...(promotedItem.armoryProduct && categoryId
      ? {
          armoryProduct: {
            id: mirrorId,
            name: mirrorName,
            price: promotedItem.armoryProduct.price,
            itemIds: [mirrorId],
            categoryId,
          },
        }
      : {}),
  };

  await ensureMirroredPromotedEquipmentAssets(promotedItem, mirroredItem, mirrorPairFlipX);

  return mirroredItem;
}

function getPromotedEquipmentMirrorConfig(equipmentSlot: EquipmentSlotKey): PromotedEquipmentMirrorConfig | undefined {
  for (const pair of promotedEquipmentMirrorPairs) {
    if (pair.back.slot === equipmentSlot) {
      return { source: pair.back, target: pair.front };
    }

    if (pair.front.slot === equipmentSlot) {
      return { source: pair.front, target: pair.back };
    }
  }

  return undefined;
}

function replacePromotedEquipmentMirrorToken(value: string, sourceToken: string, targetToken: string, label: string): string {
  const mirroredValue = value.replace(sourceToken, targetToken);

  if (mirroredValue === value) {
    throw new Error(`Could not mirror promoted equipment ${label}: expected ${sourceToken}.`);
  }

  return mirroredValue;
}

function tryReplacePromotedEquipmentMirrorToken(value: string, sourceToken: string, targetToken: string): string | undefined {
  return value.includes(sourceToken) ? value.replace(sourceToken, targetToken) : undefined;
}

function formatPromotedEquipmentMirrorName(name: string, mirrorConfig: PromotedEquipmentMirrorConfig): string {
  const labelPattern = new RegExp(`\\b${escapeRegExp(mirrorConfig.source.label)}\\b`, "i");

  if (labelPattern.test(name)) {
    return name.replace(labelPattern, mirrorConfig.target.label);
  }

  const sidePattern = new RegExp(`\\b${escapeRegExp(mirrorConfig.source.sideLabel)}\\b`, "i");

  if (sidePattern.test(name)) {
    return name.replace(sidePattern, mirrorConfig.target.sideLabel);
  }

  return `${name} ${mirrorConfig.target.sideLabel}`;
}

function mirrorPromotedEquipmentTuning(tuning: RigPartTuning): RigPartTuning {
  return {
    ...tuning,
    x: -tuning.x,
    angle: -tuning.angle,
    flipX: false,
  };
}

async function ensureMirroredPromotedEquipmentAssets(
  promotedItem: GeneratedEquipmentJsonRecord,
  mirroredItem: GeneratedEquipmentJsonRecord,
  mirrorPairFlipX: boolean,
): Promise<void> {
  await writeMirroredPromotedEquipmentWebpAsset(
    promotedItem.asset.sourcePath,
    mirroredItem.asset.sourcePath,
    promotedEquipmentRuntimeWebpQuality,
    mirrorPairFlipX,
  );

  if (!promotedItem.asset.lowSourcePath || !mirroredItem.asset.lowSourcePath) {
    return;
  }

  await writeMirroredPromotedEquipmentWebpAsset(
    promotedItem.asset.lowSourcePath,
    mirroredItem.asset.lowSourcePath,
    promotedEquipmentLowWebpQuality,
    mirrorPairFlipX,
  );
}

async function writeMirroredPromotedEquipmentWebpAsset(
  sourcePath: string,
  targetPath: string,
  quality: number,
  mirrorPairFlipX: boolean,
): Promise<void> {
  if (!mirrorPairFlipX) {
    await copyPromotedEquipmentWebpAsset(sourcePath, targetPath);
    return;
  }

  await writeFlippedPromotedEquipmentWebpAsset(sourcePath, targetPath, quality);
}

async function writeFlippedPromotedEquipmentWebpAsset(sourcePath: string, targetPath: string, quality: number): Promise<void> {
  const source = await readFile(getProjectSourceUrl(sourcePath));
  const targetUrl = getProjectSourceUrl(targetPath);
  const mirrored = await sharp(source)
    .flop()
    .webp({
      alphaQuality: 100,
      effort: 6,
      quality,
      smartSubsample: true,
    })
    .toBuffer();

  await mkdir(new URL(".", targetUrl), { recursive: true });
  await writeFile(targetUrl, mirrored);
}

async function copyPromotedEquipmentWebpAsset(sourcePath: string, targetPath: string): Promise<void> {
  const targetUrl = getProjectSourceUrl(targetPath);

  await mkdir(new URL(".", targetUrl), { recursive: true });
  await copyFile(getProjectSourceUrl(sourcePath), targetUrl);
}

async function writeResizedPromotedEquipmentLowAsset(sourcePath: string, targetPath: string): Promise<void> {
  const source = await readFile(getProjectSourceUrl(sourcePath));
  const targetUrl = getProjectSourceUrl(targetPath);
  const low = await createEquipmentWebp(source, promotedEquipmentLowMaxSide, promotedEquipmentLowWebpQuality);

  await mkdir(new URL(".", targetUrl), { recursive: true });
  await writeFile(targetUrl, low);
}

async function ensureGeneratedEquipmentShopIcons(records: GeneratedEquipmentJsonRecord[]): Promise<void> {
  await Promise.all(records.map((record) => writeGeneratedEquipmentShopIcon(record)));
}

async function writeGeneratedEquipmentShopIcon(record: GeneratedEquipmentJsonRecord): Promise<void> {
  const source = await readFile(getProjectSourceUrl(record.asset.sourcePath));
  const icon = await createEquipmentShopIconWebp(source);
  const targetUrl = getProjectSourceUrl(getGeneratedEquipmentShopIconPath(record.asset.key));

  await mkdir(new URL(".", targetUrl), { recursive: true });
  await writeFile(targetUrl, icon);
}

async function createEquipmentShopIconWebp(input: Buffer): Promise<Buffer> {
  const bounds = await getVisibleAlphaBounds(input);
  const trimmed = bounds ? sharp(input).ensureAlpha().extract(bounds) : sharp(input).ensureAlpha();
  const content = await trimmed
    .resize({
      fit: "inside",
      height: promotedEquipmentShopIconContentSize,
      width: promotedEquipmentShopIconContentSize,
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();
  const metadata = await sharp(content).metadata();
  const width = metadata.width ?? promotedEquipmentShopIconContentSize;
  const height = metadata.height ?? promotedEquipmentShopIconContentSize;
  const left = Math.max(0, Math.floor((promotedEquipmentShopIconSize - width) / 2));
  const top = Math.max(0, Math.floor((promotedEquipmentShopIconSize - height) / 2));
  const right = Math.max(0, promotedEquipmentShopIconSize - width - left);
  const bottom = Math.max(0, promotedEquipmentShopIconSize - height - top);

  return sharp(content)
    .extend({
      background: transparentBackground,
      bottom,
      left,
      right,
      top,
    })
    .webp({
      alphaQuality: 100,
      effort: 6,
      quality: promotedEquipmentShopIconWebpQuality,
      smartSubsample: true,
    })
    .toBuffer();
}

async function getVisibleAlphaBounds(input: Buffer): Promise<{ left: number; top: number; width: number; height: number } | undefined> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];

      if (alpha === undefined || alpha <= 8) {
        continue;
      }

      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  return right >= left && bottom >= top
    ? {
        height: bottom - top + 1,
        left,
        top,
        width: right - left + 1,
      }
    : undefined;
}

async function projectSourceFileExists(sourcePath: string): Promise<boolean> {
  try {
    await readFile(getProjectSourceUrl(sourcePath));
    return true;
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ENOENT");
}

function formatPromotedEquipmentMessage(promotedRecords: GeneratedEquipmentJsonRecord[]): string {
  const [promotedItem, ...generatedItems] = promotedRecords;

  if (!promotedItem) {
    return "Promoted equipment item.";
  }

  if (generatedItems.length === 0) {
    return `Promoted ${promotedItem.name}.`;
  }

  return `Promoted ${promotedItem.name} and generated ${generatedItems.map((item) => item.name).join(", ")}.`;
}

interface GeneratedShopItemUpdate {
  itemIds: string[];
  rarity: NonNullable<GeneratedEquipmentJsonRecord["rarity"]>;
  stat: number;
  price: number;
}

function pickGeneratedShopItemUpdate(payload: unknown): GeneratedShopItemUpdate {
  const update = readPlainObject(payload, "generated shop item update") as UpdateGeneratedShopItemPayload;
  const itemIds = readNonEmptyStringArray(update.itemIds, "generated shop item ids");
  const rarity = readItemRarity(update.rarity);
  const stat = Math.max(0, Math.floor(readFinitePayloadNumber(update.stat, "generated shop item stat")));
  const price = Math.max(0, Math.min(promotedEquipmentMaxPrice, Math.floor(readFinitePayloadNumber(update.price, "generated shop item price"))));

  return {
    itemIds,
    rarity,
    stat,
    price,
  };
}

async function updateGeneratedShopItems(update: GeneratedShopItemUpdate): Promise<GeneratedEquipmentJsonRecord[]> {
  const records = await readGeneratedEquipmentRecords();
  const targetRecords = update.itemIds.map((itemId) => {
    const record = records.find((candidate) => candidate.id === itemId);

    if (!record) {
      throw new Error(`Generated shop item not found: ${itemId}.`);
    }

    if (!record.armoryProduct && !record.weaponProduct) {
      throw new Error("Only generated shop items can be edited.");
    }

    return record;
  });
  const kind = targetRecords[0]?.kind;

  if (!kind || !targetRecords.every((record) => record.kind === kind)) {
    throw new Error("Generated shop item edit cannot mix armor and weapons.");
  }

  const maxStat = kind === "weapon" ? promotedEquipmentMaxDamageBonus : promotedEquipmentMaxArmorHp;
  const clampedStat = Math.max(0, Math.min(maxStat, update.stat));
  const targetIds = new Set(targetRecords.map((record) => record.id));
  let targetIndex = 0;
  const nextRecords = records.map((record) => {
    if (!targetIds.has(record.id)) {
      return record;
    }

    const nextRecord = updateGeneratedShopItemRecord(record, update, clampedStat, targetIndex);

    targetIndex += 1;

    return nextRecord;
  });

  await writeGeneratedEquipmentRecords(nextRecords);

  return nextRecords.filter((record) => targetIds.has(record.id));
}

function updateGeneratedShopItemRecord(
  record: GeneratedEquipmentJsonRecord,
  update: GeneratedShopItemUpdate,
  clampedStat: number,
  targetIndex: number,
): GeneratedEquipmentJsonRecord {
  const itemStat = record.kind === "armor" && targetIndex > 0 ? 0 : clampedStat;

  return {
    ...record,
    rarity: update.rarity,
    ...(record.kind === "armor" ? { armorHp: itemStat } : { damageBonus: itemStat }),
    ...(record.armoryProduct ? { armoryProduct: { ...record.armoryProduct, price: update.price } } : {}),
    ...(record.weaponProduct ? { weaponProduct: { ...record.weaponProduct, price: update.price } } : {}),
  };
}

function formatUpdatedGeneratedShopItemMessage(updatedRecords: GeneratedEquipmentJsonRecord[]): string {
  if (updatedRecords.length === 0) {
    return "Updated generated shop item.";
  }

  if (updatedRecords.length === 1) {
    return `Updated ${updatedRecords[0]!.name}.`;
  }

  return `Updated ${updatedRecords.length} linked generated shop items.`;
}

interface GeneratedBossItemUpdate {
  itemIds: string[];
  stat: number;
}

function pickGeneratedBossItemUpdate(payload: unknown): GeneratedBossItemUpdate {
  const update = readPlainObject(payload, "generated boss item update") as UpdateGeneratedBossItemPayload;
  const itemIds = readNonEmptyStringArray(update.itemIds, "generated boss item ids");
  const stat = Math.max(0, Math.floor(readFinitePayloadNumber(update.stat, "generated boss item stat")));

  return {
    itemIds,
    stat,
  };
}

async function updateGeneratedBossItem(update: GeneratedBossItemUpdate): Promise<GeneratedEquipmentJsonRecord[]> {
  const records = await readGeneratedEquipmentRecords();
  const targetRecords = update.itemIds.map((itemId) => {
    const record = records.find((candidate) => candidate.id === itemId);

    if (!record) {
      throw new Error(`Generated boss item not found: ${itemId}.`);
    }

    if (!isGeneratedBossItemRecord(record)) {
      throw new Error("Only generated boss items can be edited.");
    }

    return record;
  });
  const kind = targetRecords[0]?.kind;

  if (!kind || !targetRecords.every((record) => record.kind === kind)) {
    throw new Error("Generated boss item edit cannot mix armor and weapons.");
  }

  const maxStat = kind === "weapon" ? promotedEquipmentMaxDamageBonus : promotedEquipmentMaxArmorHp;
  const clampedStat = Math.max(0, Math.min(maxStat, update.stat));
  const targetIds = new Set(targetRecords.map((record) => record.id));
  let targetIndex = 0;
  const nextRecords = records.map((record) => {
    if (!targetIds.has(record.id)) {
      return record;
    }

    const nextRecord = updateGeneratedBossItemRecord(record, clampedStat, targetIndex);

    targetIndex += 1;

    return nextRecord;
  });

  await writeGeneratedEquipmentRecords(nextRecords);

  return nextRecords.filter((record) => targetIds.has(record.id));
}

function isGeneratedBossItemRecord(record: GeneratedEquipmentJsonRecord): boolean {
  return record.availability?.bossUnique === true || record.rarity === "unique";
}

function updateGeneratedBossItemRecord(
  record: GeneratedEquipmentJsonRecord,
  clampedStat: number,
  targetIndex: number,
): GeneratedEquipmentJsonRecord {
  const itemStat = record.kind === "armor" && targetIndex > 0 ? 0 : clampedStat;

  return {
    ...record,
    ...(record.kind === "armor" ? { armorHp: itemStat } : { damageBonus: itemStat }),
  };
}

function formatUpdatedGeneratedBossItemMessage(updatedRecords: GeneratedEquipmentJsonRecord[]): string {
  if (updatedRecords.length === 0) {
    return "Updated generated boss item.";
  }

  if (updatedRecords.length === 1) {
    return `Updated ${updatedRecords[0]!.name}.`;
  }

  return `Updated ${updatedRecords.length} linked generated boss items.`;
}

interface GeneratedEquipmentItemUpdate {
  itemIds: string[];
  rarity?: NonNullable<GeneratedEquipmentJsonRecord["rarity"]>;
  stat?: number;
  price?: number;
  equipmentTuningByItemId: Record<string, RigPartTuning>;
}

function pickGeneratedEquipmentItemUpdate(payload: unknown): GeneratedEquipmentItemUpdate {
  const update = readPlainObject(payload, "generated equipment item update") as UpdateGeneratedEquipmentItemPayload;
  const itemIds = readNonEmptyStringArray(update.itemIds, "generated equipment item ids");
  const rarity = update.rarity === undefined ? undefined : readItemRarity(update.rarity);
  const stat = update.stat === undefined ? undefined : Math.max(0, Math.floor(readFinitePayloadNumber(update.stat, "generated equipment item stat")));
  const price =
    update.price === undefined
      ? undefined
      : Math.max(0, Math.min(promotedEquipmentMaxPrice, Math.floor(readFinitePayloadNumber(update.price, "generated equipment item price"))));
  const equipmentTuningByItemId = readGeneratedEquipmentItemTuningPatch(update.equipmentTuningByItemId);

  return {
    itemIds,
    ...(rarity ? { rarity } : {}),
    ...(stat !== undefined ? { stat } : {}),
    ...(price !== undefined ? { price } : {}),
    equipmentTuningByItemId,
  };
}

function readGeneratedEquipmentItemTuningPatch(input: unknown): Record<string, RigPartTuning> {
  if (input === undefined || input === null || input === "") {
    return {};
  }

  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Expected generated equipment item tuning map.");
  }

  return Object.fromEntries(
    Object.entries(input).flatMap(([itemId, tuning]) => {
      if (!itemId.trim()) {
        return [];
      }

      return [[itemId, readLooseEquipmentTuning(tuning, itemId)]];
    }),
  );
}

async function updateGeneratedEquipmentItem(update: GeneratedEquipmentItemUpdate): Promise<GeneratedEquipmentJsonRecord[]> {
  const records = await readGeneratedEquipmentRecords();
  const targetIds = new Set(update.itemIds);
  const tuningIds = new Set(Object.keys(update.equipmentTuningByItemId));
  const touchedIds = new Set([...targetIds, ...tuningIds]);
  const targetRecords = update.itemIds.map((itemId) => {
    const record = records.find((candidate) => candidate.id === itemId);

    if (!record) {
      throw new Error(`Generated equipment item not found: ${itemId}.`);
    }

    return record;
  });

  tuningIds.forEach((itemId) => {
    if (!records.some((record) => record.id === itemId)) {
      throw new Error(`Generated equipment item not found: ${itemId}.`);
    }
  });

  const shouldUpdateStat = update.stat !== undefined;
  const kind = targetRecords[0]?.kind;
  const maxStat = kind === "weapon" ? promotedEquipmentMaxDamageBonus : promotedEquipmentMaxArmorHp;
  const clampedStat = shouldUpdateStat ? Math.max(0, Math.min(maxStat, update.stat ?? 0)) : undefined;

  if (shouldUpdateStat && (!kind || !targetRecords.every((record) => record.kind === kind))) {
    throw new Error("Generated equipment item edit cannot mix armor and weapons.");
  }

  const nextRecords = records.map((record) => {
    if (!touchedIds.has(record.id)) {
      return record;
    }

    const targetIndex = update.itemIds.indexOf(record.id);
    const tuning = update.equipmentTuningByItemId[record.id];

    return updateGeneratedEquipmentItemRecord(record, update, clampedStat, targetIndex, tuning);
  });

  await writeGeneratedEquipmentRecords(nextRecords);

  return nextRecords.filter((record) => touchedIds.has(record.id));
}

function updateGeneratedEquipmentItemRecord(
  record: GeneratedEquipmentJsonRecord,
  update: GeneratedEquipmentItemUpdate,
  clampedStat: number | undefined,
  targetIndex: number,
  equipmentTuning: RigPartTuning | undefined,
): GeneratedEquipmentJsonRecord {
  const itemStat = record.kind === "armor" && targetIndex > 0 ? 0 : clampedStat;

  return {
    ...record,
    ...(update.rarity && targetIndex >= 0 ? { rarity: update.rarity } : {}),
    ...(itemStat !== undefined && record.kind === "armor" ? { armorHp: itemStat } : {}),
    ...(itemStat !== undefined && record.kind === "weapon" ? { damageBonus: itemStat } : {}),
    ...(update.price !== undefined && record.armoryProduct ? { armoryProduct: { ...record.armoryProduct, price: update.price } } : {}),
    ...(update.price !== undefined && record.weaponProduct ? { weaponProduct: { ...record.weaponProduct, price: update.price } } : {}),
    ...(equipmentTuning ? { equipmentTuning } : {}),
  };
}

function formatUpdatedGeneratedEquipmentItemMessage(updatedRecords: GeneratedEquipmentJsonRecord[]): string {
  if (updatedRecords.length === 0) {
    return "Updated generated equipment item.";
  }

  if (updatedRecords.length === 1) {
    return `Saved ${updatedRecords[0]!.name}.`;
  }

  return `Saved ${updatedRecords.length} linked generated equipment items.`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readUiLayoutScreenId(payload: unknown): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with UI layout defaults.");
  }

  const screenId = (payload as { screenId?: unknown }).screenId;

  if (screenId === "magicShop") {
    return screenId;
  }

  throw new Error("Only magicShop UI layout defaults can be saved right now.");
}

function readUiLayoutValues(payload: unknown): Record<string, number> {
  const tuning = (payload as { tuning?: unknown }).tuning;

  if (!tuning || typeof tuning !== "object" || Array.isArray(tuning)) {
    throw new Error("Expected a UI layout tuning object.");
  }

  const rawValues = (tuning as { values?: unknown }).values;

  if (!rawValues || typeof rawValues !== "object" || Array.isArray(rawValues)) {
    throw new Error("Expected UI layout tuning values.");
  }

  return Object.fromEntries(
    Object.entries(rawValues).flatMap(([key, value]) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return [];
      }

      return [[key, value]];
    }),
  );
}

function readUiLayoutDefaultValuesFromSource(source: string): Record<string, number> {
  const valuesSource = readUiLayoutDefaultValuesSource(source);
  const values: Record<string, number> = {};
  const entryPattern = /"([^"]+)":\s*(-?[0-9]+(?:\.[0-9]+)?),?/gu;
  let match: RegExpExecArray | null;

  while ((match = entryPattern.exec(valuesSource))) {
    values[match[1]!] = Number(match[2]);
  }

  if (Object.keys(values).length === 0) {
    throw new Error("Could not read DEFAULT_UI_LAYOUT_TUNING.values.");
  }

  return values;
}

function replaceUiLayoutDefaultValues(source: string, values: Record<string, number>): string {
  const valuesSource = readUiLayoutDefaultValuesSource(source);

  return source.replace(valuesSource, formatUiLayoutDefaultValues(values));
}

function readUiLayoutDefaultValuesSource(source: string): string {
  const valuesStart = source.indexOf("  values: {");

  if (valuesStart < 0) {
    throw new Error("Could not find DEFAULT_UI_LAYOUT_TUNING.values.");
  }

  const openBraceIndex = source.indexOf("{", valuesStart);
  const closeBraceIndex = findMatchingObjectBrace(source, openBraceIndex);

  return source.slice(openBraceIndex, closeBraceIndex + 1);
}

function formatUiLayoutDefaultValues(values: Record<string, number>): string {
  const entries = Object.entries(values)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `    "${key}": ${formatNumber(value)},`);

  return `{\n${entries.join("\n")}\n  }`;
}

function findMatchingObjectBrace(source: string, openBraceIndex: number): number {
  if (source[openBraceIndex] !== "{") {
    throw new Error("Expected an opening object brace.");
  }

  let depth = 0;
  let quote: string | undefined;
  let escaped = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error("Could not find matching object brace.");
}

function findObjectPropertyObject(
  source: string,
  objectStart: number,
  objectEnd: number,
  propertyKey: string,
  label: string,
): { valueStart: number; valueEnd: number; indent: string } {
  const propertyPattern = new RegExp(`\\n(\\s*)${escapeRegExp(formatObjectKey(propertyKey))}:\\s*\\{`, "m");
  const objectSource = source.slice(objectStart + 1, objectEnd);
  const propertyMatch = propertyPattern.exec(objectSource);

  if (!propertyMatch) {
    throw new Error(`Could not find ${label} in debugTuning.ts.`);
  }

  const matchStart = objectStart + 1 + propertyMatch.index;
  const valueStart = matchStart + propertyMatch[0].lastIndexOf("{");

  return {
    valueStart,
    valueEnd: findMatchingObjectBrace(source, valueStart),
    indent: propertyMatch[1] ?? "",
  };
}

function pickGeneratedEquipmentRemovalId(payload: unknown): string {
  const removal = readPlainObject(payload, "equipment removal values");
  return readNonEmptyString(removal.itemId, "itemId");
}

async function readGeneratedArenaBossRecords(): Promise<ArenaBossJsonRecord[]> {
  try {
    const source = await readFile(generatedArenaBossesJsonUrl, "utf8");
    const records = JSON.parse(source) as unknown;

    if (!Array.isArray(records)) {
      throw new Error("Generated arena bosses JSON must contain an array.");
    }

    return records.map((record) => validateArenaBossRecord(record));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function readGeneratedArenaTierRecords(): Promise<ArenaTierJsonRecord[]> {
  try {
    const source = await readFile(generatedArenaTiersJsonUrl, "utf8");
    const records = JSON.parse(source) as unknown;

    if (!Array.isArray(records)) {
      throw new Error("Generated arena tiers JSON must contain an array.");
    }

    return records.map((record) => validateArenaTierRecord(record));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function upsertGeneratedArenaTierRecords(records: ArenaTierJsonRecord[], tier: ArenaTierJsonRecord): ArenaTierJsonRecord[] {
  return [...records.filter((record) => record.id !== tier.id), tier].sort((left, right) => left.id - right.id);
}

async function writeGeneratedArenaTierRecords(records: ArenaTierJsonRecord[]): Promise<void> {
  const sortedRecords = [...records].sort((left, right) => left.id - right.id);

  await writeFile(generatedArenaTiersJsonUrl, `${JSON.stringify(sortedRecords, null, 2)}\n`, "utf8");
  await writeFile(generatedArenaTiersTsUrl, formatGeneratedArenaTiersSource(sortedRecords), "utf8");
}

function formatGeneratedArenaTiersSource(records: ArenaTierJsonRecord[]): string {
  const rows = records.map(formatGeneratedArenaTierRecord).join(",\n");

  return `import type { ArenaTierConfig } from "../arenaOpponents";

export const GENERATED_ARENA_TIERS: readonly ArenaTierConfig[] = [${rows ? `\n${rows}\n` : ""}];
`;
}

function formatGeneratedArenaTierRecord(record: ArenaTierJsonRecord): string {
  const opponentRows = record.opponents.map(formatGeneratedArenaTierOpponentRecord);

  return [
    "  {",
    `    id: ${record.id},`,
    `    name: ${JSON.stringify(record.name)},`,
    ...(record.unlockBossId ? [`    unlockBossId: ${JSON.stringify(record.unlockBossId)},`] : []),
    "    opponents: [",
    ...opponentRows,
    "    ],",
    "  }",
  ].join("\n");
}

function formatGeneratedArenaTierOpponentRecord(record: ArenaTierOpponentJsonRecord): string {
  return [
    "      {",
    `        id: ${JSON.stringify(record.id)},`,
    `        difficultyId: ${JSON.stringify(record.difficultyId)},`,
    ...(record.baseStats ? [`        baseStats: ${JSON.stringify(record.baseStats)},`] : []),
    ...(record.randomBaseStatPoints !== undefined ? [`        randomBaseStatPoints: ${record.randomBaseStatPoints},`] : []),
    `        equipmentPools: ${JSON.stringify(record.equipmentPools)},`,
    `        rewards: ${JSON.stringify(record.rewards)},`,
    "      },",
  ].join("\n");
}

function upsertGeneratedArenaBossRecords(records: ArenaBossJsonRecord[], boss: ArenaBossJsonRecord): ArenaBossJsonRecord[] {
  return [...records.filter((record) => record.id !== boss.id), boss].sort((left, right) => left.tierId - right.tierId || left.id.localeCompare(right.id));
}

async function writeGeneratedArenaBossRecords(records: ArenaBossJsonRecord[]): Promise<void> {
  const sortedRecords = [...records].sort((left, right) => left.tierId - right.tierId || left.id.localeCompare(right.id));

  await writeFile(generatedArenaBossesJsonUrl, `${JSON.stringify(sortedRecords, null, 2)}\n`, "utf8");
  await writeFile(generatedArenaBossesTsUrl, formatGeneratedArenaBossesSource(sortedRecords), "utf8");
}

function formatGeneratedArenaBossesSource(records: ArenaBossJsonRecord[]): string {
  const rows = records.map(formatGeneratedArenaBossRecord).join(",\n");

  return `import type { ArenaBossDefinition } from "../arenaOpponents";

export const GENERATED_ARENA_BOSSES: readonly ArenaBossDefinition[] = [${rows ? `\n${rows}\n` : ""}];
`;
}

function formatGeneratedArenaBossRecord(record: ArenaBossJsonRecord): string {
  const lootRows = record.lootTable.map((entry) => `      ${JSON.stringify(entry)},`);

  return [
    "  {",
    `    id: ${JSON.stringify(record.id)},`,
    `    tierId: ${record.tierId},`,
    `    name: ${JSON.stringify(record.name)},`,
    `    baseStats: ${JSON.stringify(record.baseStats)},`,
    `    equipment: ${JSON.stringify(record.equipment)},`,
    `    rewards: ${JSON.stringify(record.rewards)},`,
    "    lootTable: [",
    ...lootRows,
    "    ],",
    "  }",
  ].join("\n");
}

async function readGeneratedEquipmentRecords(): Promise<GeneratedEquipmentJsonRecord[]> {
  try {
    const source = await readFile(generatedEquipmentJsonUrl, "utf8");
    const records = JSON.parse(source) as unknown;

    if (!Array.isArray(records)) {
      throw new Error("Generated equipment JSON must contain an array.");
    }

    return records.map((record) => validateGeneratedEquipmentRecord(record));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function upsertGeneratedEquipmentRecords(
  records: GeneratedEquipmentJsonRecord[],
  nextRecords: GeneratedEquipmentJsonRecord[],
): GeneratedEquipmentJsonRecord[] {
  const nextIds = new Set(nextRecords.map((record) => record.id));
  const nextSourcePaths = new Set(nextRecords.map((record) => record.asset.sourcePath));

  return [
    ...records.filter((record) => !nextIds.has(record.id) && !nextSourcePaths.has(record.asset.sourcePath)),
    ...nextRecords,
  ].sort((left, right) => left.id.localeCompare(right.id));
}

async function removeGeneratedEquipmentItems(itemId: string): Promise<GeneratedEquipmentJsonRecord[]> {
  const records = await readGeneratedEquipmentRecords();
  const removedRecord = records.find((record) => record.id === itemId);

  if (!removedRecord) {
    throw new Error("Generated equipment item not found.");
  }

  const removedRecords = getLinkedGeneratedEquipmentRemovalRecords(records, removedRecord);
  const removedIds = new Set(removedRecords.map((record) => record.id));
  const nextRecords = records.filter((record) => !removedIds.has(record.id));

  await writeGeneratedEquipmentRecords(nextRecords);
  await removeGeneratedEquipmentAssetFiles(removedRecords, nextRecords);

  return removedRecords;
}

function getLinkedGeneratedEquipmentRemovalRecords(
  records: GeneratedEquipmentJsonRecord[],
  removedRecord: GeneratedEquipmentJsonRecord,
): GeneratedEquipmentJsonRecord[] {
  const linkedRecords = [removedRecord];
  const counterpart = findGeneratedEquipmentMirrorCounterpart(records, removedRecord);

  if (counterpart) {
    linkedRecords.push(counterpart);
  }

  return linkedRecords;
}

function findGeneratedEquipmentMirrorCounterpart(
  records: GeneratedEquipmentJsonRecord[],
  removedRecord: GeneratedEquipmentJsonRecord,
): GeneratedEquipmentJsonRecord | undefined {
  if (removedRecord.kind !== "armor") {
    return undefined;
  }

  const mirrorConfig = getPromotedEquipmentMirrorConfig(removedRecord.equipmentSlot);

  if (!mirrorConfig) {
    return undefined;
  }

  const mirrorAssetKey = tryReplacePromotedEquipmentMirrorToken(removedRecord.asset.key, mirrorConfig.source.token, mirrorConfig.target.token);
  const mirrorSourcePath = tryReplacePromotedEquipmentMirrorToken(removedRecord.asset.sourcePath, mirrorConfig.source.token, mirrorConfig.target.token);

  if (!mirrorAssetKey && !mirrorSourcePath) {
    return undefined;
  }

  return records.find((record) => {
    return (
      record.id !== removedRecord.id &&
      record.kind === "armor" &&
      record.equipmentSlot === mirrorConfig.target.slot &&
      ((mirrorAssetKey !== undefined && record.asset.key === mirrorAssetKey) ||
        (mirrorSourcePath !== undefined && record.asset.sourcePath === mirrorSourcePath))
    );
  });
}

async function removeGeneratedEquipmentAssetFiles(
  removedRecords: GeneratedEquipmentJsonRecord[],
  remainingRecords: GeneratedEquipmentJsonRecord[],
): Promise<void> {
  const stillReferencedPaths = new Set(remainingRecords.flatMap((record) => getGeneratedEquipmentAssetRemovalPaths(record)));
  const removalPaths = [...new Set(removedRecords.flatMap((record) => getGeneratedEquipmentAssetRemovalPaths(record, stillReferencedPaths)))];

  await Promise.all(removalPaths.map((sourcePath) => rm(getProjectSourceUrl(sourcePath), { force: true })));
}

function formatRemovedGeneratedEquipmentMessage(removedRecords: GeneratedEquipmentJsonRecord[]): string {
  if (removedRecords.length === 0) {
    return "Removed generated equipment.";
  }

  if (removedRecords.length === 1) {
    return `Removed ${removedRecords[0]!.name}.`;
  }

  return `Removed ${removedRecords.length} linked generated equipment items.`;
}

function formatPromotedEquipmentSetMessage(promotion: PromotedEquipmentSet, promotedRecords: readonly GeneratedEquipmentJsonRecord[]): string {
  return `Promoted ${promotion.name} set with ${promotedRecords.length} generated equipment items.`;
}

function formatPromotedWeaponImportsMessage(promotedRecords: readonly GeneratedEquipmentJsonRecord[]): string {
  if (promotedRecords.length === 0) {
    return "Promoted weapon imports.";
  }

  if (promotedRecords.length === 1) {
    return `Promoted ${promotedRecords[0]!.name}.`;
  }

  return `Promoted ${promotedRecords.length} weapon imports.`;
}

function formatPromotedShieldImportsMessage(promotedRecords: readonly GeneratedEquipmentJsonRecord[]): string {
  if (promotedRecords.length === 0) {
    return "Promoted shield imports.";
  }

  if (promotedRecords.length === 1) {
    return `Promoted ${promotedRecords[0]!.name}.`;
  }

  return `Promoted ${promotedRecords.length} shield imports.`;
}

async function pickEquipmentSetImportEntries(payload: unknown): Promise<EquipmentSetImportEntry[]> {
  const input = readPlainObject(payload, "equipment set asset rename") as RenameEquipmentSetAssetsPayload;
  const setSlug = readKebabIdentifier(input.setName, "setName");
  const variantSlug =
    typeof input.variant === "string" && input.variant.trim() ? readKebabIdentifier(input.variant, "variant") : "01";

  if (!Array.isArray(input.entries) || input.entries.length === 0) {
    throw new Error("Select at least one equipment set asset.");
  }

  const sourcePaths = new Set<string>();
  const targetPaths = new Set<string>();
  const targetAssetKeys = new Set<string>();
  const entries: EquipmentSetImportEntry[] = [];

  for (const rawEntry of input.entries) {
    const raw = readPlainObject(rawEntry, "equipment set asset entry") as RenameEquipmentSetAssetEntryPayload;
    const sourcePath = readEquipmentSetImportSourcePath(raw.sourcePath);
    const sourceKind = getEquipmentSetImportSourceKind(sourcePath);
    const targetConfig = readEquipmentSetImportTargetConfig(raw.targetPrefix, sourceKind);
    const targetSourcePath = getEquipmentSetImportTargetSourcePath(sourcePath, targetConfig, setSlug, variantSlug);
    const targetAssetKey = targetSourcePath.replace(/\.(?:png|webp)$/i, "");
    const lowSourcePath = getEquipmentSetImportLowSourcePath(sourcePath);
    const targetLowSourcePath = (await projectSourceFileExists(lowSourcePath))
      ? getEquipmentSetImportLowSourcePath(targetSourcePath)
      : undefined;

    if (sourcePaths.has(sourcePath)) {
      throw new Error(`Duplicate equipment set source asset: ${sourcePath}.`);
    }

    if (targetPaths.has(targetSourcePath)) {
      throw new Error(`Duplicate equipment set target asset: ${targetSourcePath}.`);
    }

    if (targetAssetKeys.has(targetAssetKey)) {
      throw new Error(`Duplicate equipment set target asset key: ${targetAssetKey}.`);
    }

    sourcePaths.add(sourcePath);
    targetPaths.add(targetSourcePath);
    targetAssetKeys.add(targetAssetKey);

    await assertEquipmentSetImportPathsAvailable(sourcePath, targetSourcePath, lowSourcePath, targetLowSourcePath);

    entries.push({
      sourcePath,
      targetPrefix: targetConfig.targetPrefix,
      targetSourcePath,
      ...(targetLowSourcePath ? { lowSourcePath, targetLowSourcePath } : {}),
    });
  }

  return entries;
}

async function assertEquipmentSetImportPathsAvailable(
  sourcePath: string,
  targetSourcePath: string,
  lowSourcePath: string,
  targetLowSourcePath: string | undefined,
): Promise<void> {
  if (!(await projectSourceFileExists(sourcePath))) {
    throw new Error(`Source asset does not exist: ${sourcePath}.`);
  }

  const siblingTargetSourcePath = getEquipmentSetImportAlternateSourcePath(targetSourcePath);

  if (sourcePath !== targetSourcePath && (await projectSourceFileExists(targetSourcePath))) {
    throw new Error(`Target asset already exists: ${targetSourcePath}.`);
  }

  if (sourcePath !== siblingTargetSourcePath && (await projectSourceFileExists(siblingTargetSourcePath))) {
    throw new Error(`Target asset already exists: ${siblingTargetSourcePath}.`);
  }

  if (targetLowSourcePath && lowSourcePath !== targetLowSourcePath && (await projectSourceFileExists(targetLowSourcePath))) {
    throw new Error(`Target low asset already exists: ${targetLowSourcePath}.`);
  }
}

async function renameEquipmentSetImportAssets(entries: readonly EquipmentSetImportEntry[]): Promise<void> {
  for (const entry of entries) {
    await renameProjectSourceFile(entry.sourcePath, entry.targetSourcePath);

    if (entry.lowSourcePath && entry.targetLowSourcePath) {
      await renameProjectSourceFile(entry.lowSourcePath, entry.targetLowSourcePath);
    }
  }
}

async function renameProjectSourceFile(sourcePath: string, targetPath: string): Promise<void> {
  if (sourcePath === targetPath) {
    return;
  }

  const targetUrl = getProjectSourceUrl(targetPath);

  await mkdir(new URL(".", targetUrl), { recursive: true });
  await rename(getProjectSourceUrl(sourcePath), targetUrl);
}

function readEquipmentSetImportSourcePath(value: unknown): string {
  const sourcePath = readNonEmptyString(value, "equipment set source asset").replace(/\\/g, "/").replace(/^\.\//, "");
  const isEquipmentImportSourcePath = sourcePath.startsWith("assets/equipment-import/armor/") || sourcePath.startsWith("assets/equipment-import/weapons/");
  const hasSupportedExtension = sourcePath.endsWith(".png") || sourcePath.endsWith(".webp");

  if (sourcePath.includes("..") || !isEquipmentImportSourcePath || !hasSupportedExtension) {
    throw new Error("Invalid equipment set source asset.");
  }

  return sourcePath;
}

function readWeaponImportSourcePath(value: unknown): string {
  const sourcePath = readNonEmptyString(value, "weapon import source asset").replace(/\\/g, "/").replace(/^\.\//, "");
  const hasSupportedExtension = sourcePath.endsWith(".png") || sourcePath.endsWith(".webp");

  if (sourcePath.includes("..") || !sourcePath.startsWith("assets/equipment-import/weapons/") || !hasSupportedExtension) {
    throw new Error("Invalid weapon import source asset.");
  }

  return sourcePath;
}

function readShieldImportSourcePath(value: unknown): string {
  const sourcePath = readNonEmptyString(value, "shield import source asset").replace(/\\/g, "/").replace(/^\.\//, "");
  const hasSupportedExtension = sourcePath.endsWith(".png") || sourcePath.endsWith(".webp");
  const assetKey = sourcePath.split("/").at(-1)?.replace(/\.(?:png|webp)$/i, "") ?? "";

  if (sourcePath.includes("..") || !sourcePath.startsWith("assets/equipment-import/armor/") || !hasSupportedExtension || !assetKey.startsWith("shield-")) {
    throw new Error("Invalid shield import source asset.");
  }

  return sourcePath;
}

function readEquipmentSetImportTargetConfig(value: unknown, sourceKind: GeneratedEquipmentJsonRecord["kind"]): EquipmentSetImportTargetConfig {
  const targetPrefix = readNonEmptyString(value, "equipment set target prefix");
  const config = equipmentSetImportTargetConfigs.find((candidate) => candidate.targetPrefix === targetPrefix);

  if (!config || config.kind !== sourceKind) {
    throw new Error("Invalid equipment set target prefix.");
  }

  return config;
}

function getEquipmentSetImportTargetConfig(targetPrefix: string): EquipmentSetImportTargetConfig {
  const config = equipmentSetImportTargetConfigs.find((candidate) => candidate.targetPrefix === targetPrefix);

  if (!config) {
    throw new Error("Invalid equipment set target prefix.");
  }

  return config;
}

function getEquipmentSetImportTargetSourcePath(
  sourcePath: string,
  targetConfig: EquipmentSetImportTargetConfig,
  setSlug: string,
  variantSlug: string,
): string {
  const extension = sourcePath.endsWith(".png") ? ".png" : ".webp";

  return `${targetConfig.folder}/${targetConfig.targetPrefix}-${setSlug}-${variantSlug}${extension}`;
}

function getWeaponImportAssetKey(name: string, weaponClass: NonNullable<GeneratedEquipmentJsonRecord["weaponClass"]>): string {
  const nameSlug = readKebabIdentifier(name, "weapon import name");
  const classPrefix = `weapon-${weaponClass}`;

  return nameSlug.startsWith(classPrefix) ? nameSlug : `${classPrefix}-${nameSlug}`;
}

function getEquipmentSetImportLowSourcePath(sourcePath: string): string {
  return sourcePath.replace(/^assets\//, "assets-low/").replace(/\.(?:png|webp)$/i, ".webp");
}

function getEquipmentSetImportAlternateSourcePath(sourcePath: string): string {
  return sourcePath.endsWith(".png") ? sourcePath.replace(/\.png$/i, ".webp") : sourcePath.replace(/\.webp$/i, ".png");
}

function getEquipmentSetImportSourceKind(sourcePath: string): GeneratedEquipmentJsonRecord["kind"] {
  return sourcePath.startsWith("assets/equipment-import/weapons/") ? "weapon" : "armor";
}

function getAssetKeyFromSourcePath(sourcePath: string): string {
  const assetKey = sourcePath.split("/").at(-1)?.replace(/\.(?:png|webp)$/i, "");

  if (!assetKey) {
    throw new Error(`Could not read asset key from ${sourcePath}.`);
  }

  return assetKey;
}

function formatPromotedEquipmentSetItemName(config: EquipmentSetImportTargetConfig, assetKey: string): string {
  const suffix = assetKey.startsWith(`${config.targetPrefix}-`) ? assetKey.slice(config.targetPrefix.length + 1) : assetKey;
  const setName = suffix
    .split("-")
    .filter(Boolean)
    .map(formatGeneratedEquipmentNamePart)
    .join(" ");

  return `${setName || "Generated"} ${config.label}`.trim();
}

function formatGeneratedEquipmentNamePart(part: string): string {
  const displayPart = part === "light" ? "leather" : part;

  return displayPart ? `${displayPart[0]?.toUpperCase() ?? ""}${displayPart.slice(1)}` : "";
}

function getArmorCategoryFromAssetKey(assetKey: string): GeneratedEquipmentJsonRecord["armorCategory"] | undefined {
  const tokens = assetKey.toLowerCase().split(/[^a-z0-9]+/);

  if (tokens.includes("light")) {
    return "leather";
  }

  if (tokens.includes("leather")) {
    return "leather";
  }

  if (tokens.includes("cloth")) {
    return "cloth";
  }

  if (tokens.includes("chain")) {
    return "chain";
  }

  if (tokens.includes("plate")) {
    return "plate";
  }

  return undefined;
}

function createDefaultPromotedEquipmentTuning(): RigPartTuning {
  return {
    x: 0,
    y: 0,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    flipX: false,
    flipY: false,
  };
}

function createDefaultPromotedWeaponTuning(): RigPartTuning {
  return {
    ...createDefaultPromotedEquipmentTuning(),
    y: 16,
    angle: 90,
  };
}

function formatEquipmentSetImportRenameMessage(entries: readonly EquipmentSetImportEntry[]): string {
  return entries.length === 1 ? "Renamed 1 equipment set asset." : `Renamed ${entries.length} equipment set assets.`;
}

function getGeneratedEquipmentAssetRemovalPaths(
  record: GeneratedEquipmentJsonRecord,
  ignoredPaths: ReadonlySet<string> = new Set(),
): string[] {
  const candidates = [
    record.asset.sourcePath,
    record.asset.lowSourcePath,
    getGeneratedEquipmentSourcePngPath(record.asset.sourcePath),
    getGeneratedEquipmentShopIconPath(record.asset.key),
  ];
  const uniquePaths = new Set(
    candidates.flatMap((sourcePath) => {
      if (!sourcePath) {
        return [];
      }

      const removalPath = readGeneratedAssetRemovalPath(sourcePath);

      return ignoredPaths.has(removalPath) ? [] : [removalPath];
    }),
  );

  return [...uniquePaths];
}

function getGeneratedEquipmentSourcePngPath(sourcePath: string): string | undefined {
  const canHaveSourcePng = sourcePath.startsWith("assets/fighters/armor/") || sourcePath.startsWith("assets/fighters/weapons/");

  return canHaveSourcePng && sourcePath.endsWith(".webp") ? sourcePath.replace(/\.webp$/i, ".png") : undefined;
}

function getGeneratedEquipmentShopIconPath(assetKey: string): string {
  return `assets/shop-icons/${assetKey}.webp`;
}

async function preparePromotedEquipmentAsset(
  sourcePath: string,
  lowSourcePath: string | undefined,
): Promise<{ sourcePath: string; lowSourcePath?: string }> {
  if (sourcePath.endsWith(".png")) {
    return convertPromotedEquipmentPngAsset(sourcePath);
  }

  return {
    sourcePath,
    ...(lowSourcePath ? { lowSourcePath } : {}),
  };
}

async function convertPromotedEquipmentPngAsset(sourcePath: string): Promise<{ sourcePath: string; lowSourcePath: string }> {
  const runtimeSourcePath = sourcePath.replace(/\.png$/i, ".webp");
  const lowSourcePath = sourcePath.replace(/^assets\//, "assets-low/").replace(/\.png$/i, ".webp");
  const sourceUrl = getProjectSourceUrl(sourcePath);
  const runtimeUrl = getProjectSourceUrl(runtimeSourcePath);
  const lowUrl = getProjectSourceUrl(lowSourcePath);
  const source = await readFile(sourceUrl);
  const runtime = await createEquipmentWebp(source, getPromotedEquipmentRuntimeMaxSide(sourcePath), promotedEquipmentRuntimeWebpQuality);
  const low = await createEquipmentWebp(runtime, promotedEquipmentLowMaxSide, promotedEquipmentLowWebpQuality);

  await Promise.all([mkdir(new URL(".", runtimeUrl), { recursive: true }), mkdir(new URL(".", lowUrl), { recursive: true })]);
  await Promise.all([writeFile(runtimeUrl, runtime), writeFile(lowUrl, low)]);

  return {
    sourcePath: runtimeSourcePath,
    lowSourcePath,
  };
}

async function createEquipmentWebp(input: Buffer, maxSide: number, quality: number): Promise<Buffer> {
  return sharp(input)
    .resize({
      fit: "inside",
      height: maxSide,
      width: maxSide,
      withoutEnlargement: true,
    })
    .webp({
      alphaQuality: 100,
      effort: 6,
      quality,
      smartSubsample: true,
    })
    .toBuffer();
}

function getPromotedEquipmentRuntimeMaxSide(sourcePath: string): number {
  return promotedEquipmentResizeRules.find((rule) => rule.pattern.test(sourcePath))?.maxSide ?? 512;
}

function getProjectSourceUrl(sourcePath: string): URL {
  return new URL(`./src/${sourcePath}`, import.meta.url);
}

async function writeGeneratedEquipmentRecords(records: GeneratedEquipmentJsonRecord[]): Promise<void> {
  await mkdir(new URL("./src/generated/", import.meta.url), { recursive: true });
  await Promise.all([
    writeFile(generatedEquipmentJsonUrl, `${JSON.stringify(records, null, 2)}\n`, "utf8"),
    writeFile(generatedEquipmentTsUrl, formatGeneratedEquipmentSource(records), "utf8"),
  ]);
}

function formatGeneratedEquipmentSource(records: GeneratedEquipmentJsonRecord[]): string {
  const rows = records.map(formatGeneratedEquipmentRecord).join(",\n");

  return `import type { EquipmentAssetDefinition, EquipmentItemAssetKeys } from "../equipmentAssetRegistry";
import type { EquipmentTuning } from "../debugTuning";
import type { HeroItemDefinition, HeroItemId } from "../hero";

export interface GeneratedArmoryProduct {
  id: string;
  name: string;
  price: number;
  itemIds: HeroItemId[];
  categoryId: string;
}

export interface GeneratedWeaponProduct {
  id: string;
  name: string;
  price: number;
  itemIds: HeroItemId[];
  categoryId: string;
}

export interface GeneratedEquipmentAvailability {
  shop: boolean;
  enemyPool: boolean;
  bossUnique: boolean;
}

export interface GeneratedEquipmentItemRecord {
  item: HeroItemDefinition;
  assetKeys: EquipmentItemAssetKeys;
  equipmentTuning?: EquipmentTuning;
  asset: EquipmentAssetDefinition;
  availability?: GeneratedEquipmentAvailability;
  armoryProduct?: GeneratedArmoryProduct;
  weaponProduct?: GeneratedWeaponProduct;
}

export const GENERATED_EQUIPMENT_ITEM_RECORDS: readonly GeneratedEquipmentItemRecord[] = [${rows ? `\n${rows}\n` : ""}];

export const GENERATED_EQUIPMENT_ITEM_IDS = GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => record.item.id);

export const GENERATED_EQUIPMENT_ITEM_CATALOG = Object.fromEntries(
  GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => [record.item.id, record.item]),
) as Record<HeroItemId, HeroItemDefinition>;

export const GENERATED_EQUIPMENT_ITEM_ASSET_KEYS = Object.fromEntries(
  GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => [record.item.id, record.assetKeys]),
) as Partial<Record<HeroItemId, EquipmentItemAssetKeys>>;

export const GENERATED_EQUIPMENT_ITEM_TUNING = Object.fromEntries(
  GENERATED_EQUIPMENT_ITEM_RECORDS.flatMap((record) => (record.equipmentTuning ? [[record.item.id, record.equipmentTuning]] : [])),
) as Partial<Record<HeroItemId, EquipmentTuning>>;

export const GENERATED_EQUIPMENT_ASSETS = GENERATED_EQUIPMENT_ITEM_RECORDS.map((record) => record.asset);

export const GENERATED_ARMORY_PRODUCTS = GENERATED_EQUIPMENT_ITEM_RECORDS.flatMap((record) =>
  record.armoryProduct ? [record.armoryProduct] : [],
);

export const GENERATED_WEAPON_PRODUCTS = GENERATED_EQUIPMENT_ITEM_RECORDS.flatMap((record) =>
  record.weaponProduct ? [record.weaponProduct] : [],
);
`;
}

function formatGeneratedEquipmentRecord(record: GeneratedEquipmentJsonRecord): string {
  const item = {
    id: record.id,
    name: record.name,
    kind: record.kind,
    ...(record.rarity ? { rarity: record.rarity } : {}),
    ...(record.armorCategory ? { armorCategory: record.armorCategory } : {}),
    ...(record.equipmentSet ? { equipmentSet: record.equipmentSet } : {}),
    equipmentSlot: record.equipmentSlot,
    ...(record.armorHp !== undefined ? { armorHp: record.armorHp } : {}),
    ...(record.damageBonus !== undefined ? { damageBonus: record.damageBonus } : {}),
    ...(record.requirements ? { requirements: record.requirements } : {}),
    ...(record.weaponClass ? { weaponClass: record.weaponClass } : {}),
    ...(record.levelRequirement !== undefined ? { levelRequirement: record.levelRequirement } : {}),
  };

  return [
    "  {",
    `    item: ${JSON.stringify(item)},`,
    `    assetKeys: ${JSON.stringify(record.assetKeys)},`,
    `    equipmentTuning: ${JSON.stringify(record.equipmentTuning)},`,
    "    asset: {",
    `      key: ${JSON.stringify(record.asset.key)},`,
    `      sourcePath: ${JSON.stringify(record.asset.sourcePath)},`,
    ...(record.asset.lowSourcePath ? [`      lowSourcePath: ${JSON.stringify(record.asset.lowSourcePath)},`] : []),
    "    },",
    ...(record.availability ? [`    availability: ${JSON.stringify(record.availability)},`] : []),
    ...(record.armoryProduct ? [`    armoryProduct: ${JSON.stringify(record.armoryProduct)},`] : []),
    ...(record.weaponProduct ? [`    weaponProduct: ${JSON.stringify(record.weaponProduct)},`] : []),
    "  }",
  ].join("\n");
}

function validateArenaBossRecord(input: unknown): ArenaBossJsonRecord {
  const record = readPlainObject(input, "arena boss record");
  const id = readArenaBossId(record.id);
  const name = readNonEmptyString(record.name, "arena boss name").slice(0, 80);
  const tierId = readClampedInteger(record.tierId, "arena boss tier", 1, 50);
  const baseStats = validateArenaBossBaseStats(record.baseStats);
  const equipment = validateArenaBossEquipment(record.equipment);
  const rewards = validateArenaBossRewards(record.rewards);
  const lootTable = validateArenaBossLootTable(record.lootTable, id);

  return {
    id,
    tierId,
    name,
    baseStats,
    equipment,
    rewards,
    lootTable,
  };
}

function validateArenaTierRecord(input: unknown): ArenaTierJsonRecord {
  const record = readPlainObject(input, "arena tier record");
  const id = readClampedInteger(record.id, "arena tier id", 1, 50);
  const name = readNonEmptyString(record.name, "arena tier name").slice(0, 80);
  const unlockBossId = record.unlockBossId === undefined || record.unlockBossId === null || record.unlockBossId === "" ? undefined : readArenaBossId(record.unlockBossId);

  if (!Array.isArray(record.opponents) || record.opponents.length === 0) {
    throw new Error("Arena tier must define at least one opponent.");
  }

  return {
    id,
    name,
    ...(unlockBossId ? { unlockBossId } : {}),
    opponents: record.opponents.map((opponent) => validateArenaTierOpponentRecord(opponent, id)).sort(compareArenaTierOpponentRecords),
  };
}

function validateArenaTierOpponentRecord(input: unknown, tierId: number): ArenaTierOpponentJsonRecord {
  const record = readPlainObject(input, "arena tier opponent");
  const difficultyId = readArenaDifficultyId(record.difficultyId);
  const baseStats = record.baseStats === undefined || record.baseStats === null || record.baseStats === "" ? undefined : validateArenaBossBaseStats(record.baseStats);
  const randomBaseStatPoints =
    record.randomBaseStatPoints === undefined || record.randomBaseStatPoints === null || record.randomBaseStatPoints === ""
      ? undefined
      : readClampedInteger(record.randomBaseStatPoints, "arena tier random stat points", 0, 200);

  return {
    id: readArenaOpponentId(record.id, tierId, difficultyId),
    difficultyId,
    ...(baseStats ? { baseStats } : {}),
    ...(randomBaseStatPoints !== undefined && randomBaseStatPoints > 0 ? { randomBaseStatPoints } : {}),
    equipmentPools: validateArenaTierEquipmentPools(record.equipmentPools),
    rewards: validateArenaBossRewards(record.rewards),
  };
}

function validateArenaTierEquipmentPools(input: unknown): ArenaTierEquipmentPoolJsonRecord[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(validateArenaTierEquipmentPool).filter((pool) => pool.itemRarities.length > 0 && hasArenaTierEquipmentPoolRollChance(pool));
}

function validateArenaTierEquipmentPool(input: unknown): ArenaTierEquipmentPoolJsonRecord {
  const pool = readPlainObject(input, "arena tier equipment pool");
  const itemRarities = readNonEmptyStringArray(pool.itemRarities, "arena tier equipment pool rarities").map((rarity) => readItemRarity(rarity));
  const weaponChance = readOptionalArenaTierRollChance(pool.weaponChance, "arena tier equipment weapon chance");
  const bowChance = readOptionalArenaTierRollChance(pool.bowChance, "arena tier equipment bow chance");
  const shieldChance = readOptionalArenaTierRollChance(pool.shieldChance, "arena tier equipment shield chance");
  const shurikenChance = readOptionalArenaTierRollChance(pool.shurikenChance, "arena tier equipment shuriken chance");

  return {
    itemRarities,
    rollChance: readArenaTierRollChance(pool.rollChance, "arena tier equipment roll chance"),
    ...(weaponChance !== undefined ? { weaponChance } : {}),
    ...(bowChance !== undefined ? { bowChance } : {}),
    ...(shieldChance !== undefined ? { shieldChance } : {}),
    ...(shurikenChance !== undefined ? { shurikenChance } : {}),
  };
}

function hasArenaTierEquipmentPoolRollChance(pool: ArenaTierEquipmentPoolJsonRecord): boolean {
  return Math.max(pool.rollChance, pool.weaponChance ?? 0, pool.bowChance ?? 0, pool.shieldChance ?? 0, pool.shurikenChance ?? 0) > 0;
}

function readOptionalArenaTierRollChance(value: unknown, label: string): number | undefined {
  return value === undefined || value === null || value === "" ? undefined : readArenaTierRollChance(value, label);
}

function readArenaTierRollChance(value: unknown, label: string): number {
  return Math.max(0, Math.min(1, readFinitePayloadNumber(value, label)));
}

function readArenaDifficultyId(value: unknown): ArenaTierOpponentJsonRecord["difficultyId"] {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }

  throw new Error("Invalid arena difficulty id.");
}

function readArenaOpponentId(value: unknown, tierId: number, difficultyId: ArenaTierOpponentJsonRecord["difficultyId"]): string {
  const id = readNonEmptyString(value, "arena tier opponent id").toLowerCase();

  if (!/^[a-z0-9_]+$/.test(id)) {
    throw new Error("Arena opponent id must use lowercase letters, numbers, and underscores.");
  }

  return id || `tier_${tierId}_${difficultyId}`;
}

function compareArenaTierOpponentRecords(left: ArenaTierOpponentJsonRecord, right: ArenaTierOpponentJsonRecord): number {
  return getArenaDifficultySortIndex(left.difficultyId) - getArenaDifficultySortIndex(right.difficultyId) || left.id.localeCompare(right.id);
}

function getArenaDifficultySortIndex(difficultyId: ArenaTierOpponentJsonRecord["difficultyId"]): number {
  return difficultyId === "easy" ? 0 : difficultyId === "medium" ? 1 : 2;
}

function validateArenaBossBaseStats(input: unknown): ArenaBossJsonRecord["baseStats"] {
  const stats = readPlainObject(input, "arena boss stats");

  return {
    strength: readClampedInteger(stats.strength, "arena boss strength", 0, 200),
    agility: readClampedInteger(stats.agility, "arena boss agility", 0, 200),
    vitality: readClampedInteger(stats.vitality, "arena boss vitality", 0, 200),
  };
}

function validateArenaBossEquipment(input: unknown): ArenaBossJsonRecord["equipment"] {
  if (input === undefined || input === null || input === "") {
    return {};
  }

  const equipment = readPlainObject(input, "arena boss equipment");

  return Object.fromEntries(
    Object.entries(equipment).flatMap(([slotKey, itemId]) => {
      if (!equipmentSlotKeys.includes(slotKey as EquipmentSlotKey)) {
        throw new Error(`Invalid arena boss equipment slot: ${slotKey}.`);
      }

      if (itemId === undefined || itemId === null || itemId === "") {
        return [];
      }

      return [[slotKey, readNonEmptyString(itemId, `arena boss equipment.${slotKey}`)]];
    }),
  ) as ArenaBossJsonRecord["equipment"];
}

function validateArenaBossRewards(input: unknown): ArenaBossJsonRecord["rewards"] {
  const rewards = readPlainObject(input, "arena boss rewards");

  return {
    win: validateArenaBossReward(rewards.win, "arena boss win reward"),
    loss: validateArenaBossReward(rewards.loss, "arena boss loss reward"),
  };
}

function validateArenaBossReward(input: unknown, label: string): ArenaBossJsonRecord["rewards"]["win"] {
  const reward = readPlainObject(input, label);

  return {
    gold: readClampedInteger(reward.gold, `${label}.gold`, 0, 100000),
    xp: readClampedInteger(reward.xp, `${label}.xp`, 0, 100000),
  };
}

function validateArenaBossLootTable(input: unknown, bossId: string): ArenaBossJsonRecord["lootTable"] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((entry, index) => validateArenaBossLootEntry(entry, `${bossId}_loot_${index}`))
    .filter((entry) => entry.itemIds.length > 0);
}

function validateArenaBossLootEntry(input: unknown, fallbackId: string): ArenaBossJsonRecord["lootTable"][number] {
  const entry = readPlainObject(input, "arena boss loot entry");
  const chance = Math.max(0, Math.min(1, readFinitePayloadNumber(entry.chance, "arena boss loot chance")));

  return {
    id: typeof entry.id === "string" && entry.id.trim() ? readArenaLootId(entry.id) : fallbackId,
    itemIds: readNonEmptyStringArray(entry.itemIds, "arena boss loot item ids"),
    chance,
    quantity: readClampedInteger(entry.quantity, "arena boss loot quantity", 1, 999),
  };
}

function readArenaBossId(value: unknown): string {
  const id = readNonEmptyString(value, "arena boss id").toLowerCase();

  if (!/^[a-z0-9_]+$/.test(id)) {
    throw new Error("Arena boss id must use lowercase letters, numbers, and underscores.");
  }

  return id;
}

function readArenaLootId(value: unknown): string {
  const id = readNonEmptyString(value, "arena boss loot id").toLowerCase();

  if (!/^[a-z0-9_]+$/.test(id)) {
    throw new Error("Arena boss loot id must use lowercase letters, numbers, and underscores.");
  }

  return id;
}

function validateGeneratedEquipmentRecord(input: unknown): GeneratedEquipmentJsonRecord {
  const record = readPlainObject(input, "generated equipment record");
  const asset = readPlainObject(record.asset, "generated equipment asset");
  const equipmentSlot = readEquipmentSlot(record.equipmentSlot);
  const id = readNonEmptyString(record.id, "generated equipment id");
  const name = readNonEmptyString(record.name, "generated equipment name");
  const kind = readGeneratedEquipmentKind(record.kind);
  const armorHp =
    kind === "armor"
      ? Math.max(0, Math.min(generatedEquipmentMaxArmorHp, Math.floor(readFinitePayloadNumber(record.armorHp, "generated equipment armorHp"))))
      : undefined;
  const damageBonus =
    kind === "weapon"
      ? Math.max(
          0,
          Math.min(generatedEquipmentMaxDamageBonus, Math.floor(readFinitePayloadNumber(record.damageBonus, "generated equipment damageBonus"))),
        )
      : undefined;
  const assetKeys = readStringRecord(record.assetKeys, "generated equipment assetKeys");
  const equipmentTuning = readPromotedEquipmentTuning(record.equipmentTuning);
  const assetKey = readNonEmptyString(asset.key, "generated equipment asset.key");
  const sourcePath = readAssetSourcePath(asset.sourcePath, getEquipmentAssetSourcePrefix(kind), "generated equipment asset.sourcePath");
  const lowSourcePath =
    typeof asset.lowSourcePath === "string" && asset.lowSourcePath.trim()
      ? readAssetSourcePath(asset.lowSourcePath, getEquipmentAssetLowSourcePrefix(kind), "generated equipment asset.lowSourcePath")
      : undefined;
  const armorCategory = kind === "armor" ? readArmorCategory(record.armorCategory) : undefined;
  const weaponClass = kind === "weapon" ? readWeaponClass(record.weaponClass, getWeaponClassFromText(`${assetKey} ${name}`)) : undefined;
  const rarity = readItemRarity(record.rarity, getDefaultGeneratedItemRarity(kind, armorCategory, weaponClass));
  const requirements = validateGeneratedEquipmentRequirements(record.requirements);
  const levelRequirement = validateGeneratedEquipmentLevelRequirement(record.levelRequirement);
  const equipmentSet = kind === "armor" ? validateGeneratedEquipmentSetInfo(record.equipmentSet) : undefined;
  const availability = readGeneratedEquipmentAvailability(record.availability, {
    shop: Boolean(record.armoryProduct || record.weaponProduct),
    enemyPool: true,
    bossUnique: false,
  });

  validateGeneratedEquipmentSlot(kind, equipmentSlot);

  const armoryProduct = availability.shop && record.armoryProduct ? validateGeneratedArmoryProduct(record.armoryProduct, id, name) : undefined;
  const weaponProduct = availability.shop && record.weaponProduct ? validateGeneratedWeaponProduct(record.weaponProduct, id, name) : undefined;

  return {
    id,
    name,
    kind,
    rarity,
    ...(armorCategory ? { armorCategory } : {}),
    ...(equipmentSet ? { equipmentSet } : {}),
    ...(armorHp !== undefined ? { armorHp } : {}),
    ...(damageBonus !== undefined ? { damageBonus } : {}),
    ...(requirements ? { requirements } : {}),
    ...(weaponClass ? { weaponClass } : {}),
    ...(levelRequirement !== undefined ? { levelRequirement } : {}),
    equipmentSlot,
    assetKeys,
    equipmentTuning,
    asset: {
      key: assetKey,
      sourcePath,
      ...(lowSourcePath ? { lowSourcePath } : {}),
    },
    availability,
    ...(armoryProduct ? { armoryProduct } : {}),
    ...(weaponProduct ? { weaponProduct } : {}),
  };
}

function validateGeneratedEquipmentLevelRequirement(input: unknown): number | undefined {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }

  return readClampedInteger(input, "generated equipment levelRequirement", 1, 100);
}

function validateGeneratedEquipmentSetInfo(input: unknown): GeneratedEquipmentSetInfo | undefined {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }

  const source = readPlainObject(input, "generated equipment set");
  const grade = source.grade === undefined ? undefined : readGeneratedEquipmentSetGrade(source.grade);

  return {
    id: readNonEmptyString(source.id, "generated equipment set.id"),
    name: readNonEmptyString(source.name, "generated equipment set.name"),
    rank: Math.max(0, Math.floor(readFinitePayloadNumber(source.rank, "generated equipment set.rank"))),
    ...(grade ? { grade } : {}),
  };
}

function readGeneratedEquipmentSetGrade(value: unknown): NonNullable<GeneratedEquipmentSetInfo["grade"]> {
  if (value === "starter" || value === "low" || value === "mid" || value === "high" || value === "boss") {
    return value;
  }

  throw new Error("Invalid generated equipment set grade.");
}

function validateGeneratedEquipmentRequirements(input: unknown): GeneratedEquipmentJsonRecord["requirements"] {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }

  const source = readPlainObject(input, "generated equipment requirements");
  const requirements = {
    strength: readOptionalRequirementValue(source.strength, "generated equipment requirements.strength"),
    agility: readOptionalRequirementValue(source.agility, "generated equipment requirements.agility"),
    vitality: readOptionalRequirementValue(source.vitality, "generated equipment requirements.vitality"),
  };
  const entries = Object.entries(requirements).filter(([, value]) => value !== undefined);

  return entries.length > 0 ? Object.fromEntries(entries) as GeneratedEquipmentJsonRecord["requirements"] : undefined;
}

function readOptionalRequirementValue(value: unknown, label: string): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return Math.max(0, Math.min(200, Math.floor(readFinitePayloadNumber(value, label))));
}

function validateGeneratedArmoryProduct(input: unknown, itemId: string, itemName: string): GeneratedEquipmentJsonRecord["armoryProduct"] {
  const product = readPlainObject(input, "generated armory product");
  const price = Math.max(0, Math.min(generatedEquipmentMaxPrice, Math.floor(readFinitePayloadNumber(product.price, "generated armory product price"))));
  const categoryId = readNonEmptyString(product.categoryId, "generated armory product categoryId");

  return {
    id: readNonEmptyString(product.id, "generated armory product id"),
    name: readNonEmptyString(product.name, "generated armory product name") || itemName,
    price,
    itemIds: [itemId],
    categoryId,
  };
}

function validateGeneratedWeaponProduct(input: unknown, itemId: string, itemName: string): GeneratedEquipmentJsonRecord["weaponProduct"] {
  const product = readPlainObject(input, "generated weapon product");
  const price = Math.max(0, Math.min(generatedEquipmentMaxPrice, Math.floor(readFinitePayloadNumber(product.price, "generated weapon product price"))));
  const categoryId = readNonEmptyString(product.categoryId, "generated weapon product categoryId");

  return {
    id: readNonEmptyString(product.id, "generated weapon product id"),
    name: readNonEmptyString(product.name, "generated weapon product name") || itemName,
    price,
    itemIds: [itemId],
    categoryId,
  };
}

function readFiniteNumber(payload: Record<string, unknown>, fieldName: string): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric tuning value: ${String(fieldName)}.`);
  }

  return value;
}

function readBoolean(payload: Record<string, unknown>, fieldName: string): boolean {
  const value = payload[fieldName];

  if (typeof value !== "boolean") {
    throw new Error(`Invalid boolean tuning value: ${String(fieldName)}.`);
  }

  return value;
}

function readArenaBackgroundTierTunings(input: unknown): ArenaBackgroundTierTuningPayload {
  if (input === undefined) {
    return {};
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid arena background tier tuning object.");
  }

  const result: ArenaBackgroundTierTuningPayload = {};

  Object.entries(input as Record<string, unknown>).forEach(([tierKey, tierInput]) => {
    const tierId = Math.round(Number(tierKey));

    if (!Number.isInteger(tierId) || tierId < 1) {
      throw new Error(`Invalid arena background tier id: ${tierKey}.`);
    }

    if (!tierInput || typeof tierInput !== "object" || Array.isArray(tierInput)) {
      throw new Error(`Invalid arena background tier ${tierKey}.`);
    }

    const layers = readArenaBackgroundLayerTuningMap((tierInput as ArenaBackgroundTierTuningPayloadEntry).layers, `${tierKey}.layers`);
    const variants = readArenaBackgroundVariantTunings((tierInput as ArenaBackgroundTierTuningPayloadEntry).variants, `${tierKey}.variants`);

    Object.entries(tierInput as Record<string, unknown>).forEach(([layer, layerInput]) => {
      if (layer !== "layers" && layer !== "variants" && isArenaBackgroundLayerKey(layer)) {
        layers[layer] = readArenaBackgroundLayerTuning(layerInput, `${tierKey}.${layer}`, layer);
      }
    });

    if (Object.keys(layers).length > 0 || Object.keys(variants).length > 0) {
      result[tierId] = {
        ...(Object.keys(layers).length > 0 ? { layers } : {}),
        ...(Object.keys(variants).length > 0 ? { variants } : {}),
      };
    }
  });

  return result;
}

function readArenaBackgroundLayerTuningMap(input: unknown, label: string): ArenaBackgroundLayerTuningMapPayload {
  if (input === undefined) {
    return {};
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Invalid arena background layer tuning map: ${label}.`);
  }

  const result: ArenaBackgroundLayerTuningMapPayload = {};

  Object.entries(input as Record<string, unknown>).forEach(([layer, layerInput]) => {
    if (isArenaBackgroundLayerKey(layer)) {
      result[layer] = readArenaBackgroundLayerTuning(layerInput, `${label}.${layer}`, layer);
    }
  });

  return result;
}

function readArenaBackgroundVariantTunings(input: unknown, label: string): ArenaBackgroundVariantTuningPayload {
  if (input === undefined) {
    return {};
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Invalid arena background variant tuning map: ${label}.`);
  }

  const result: ArenaBackgroundVariantTuningPayload = {};

  Object.entries(input as Record<string, unknown>).forEach(([variantId, variantInput]) => {
    const normalizedVariantId = normalizeArenaBackgroundVariantId(variantId);
    const layers = readArenaBackgroundLayerTuningMap(variantInput, `${label}.${normalizedVariantId}`);

    if (Object.keys(layers).length > 0) {
      result[normalizedVariantId] = layers;
    }
  });

  return result;
}

function readArenaBackgroundLayerTuning(input: unknown, label: string, layerKey: ArenaBackgroundLayerKey): ArenaBackgroundLayerTuningPayload {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Invalid arena background layer tuning: ${label}.`);
  }

  const layer = input as { layout?: unknown; parallax?: unknown };
  const layout = readPlainObject(layer.layout, `${label}.layout`);
  const parallax = readPlainObject(layer.parallax, `${label}.parallax`);
  const tuning = {
    layout: {
      x: readFinitePayloadNumber(layout.x, `${label}.layout.x`),
      y: readFinitePayloadNumber(layout.y, `${label}.layout.y`),
      scale: readFinitePayloadNumber(layout.scale, `${label}.layout.scale`),
      alpha: getArenaBackgroundLayerRole(layerKey) === "ambient" ? 1 : readFinitePayloadNumber(layout.alpha, `${label}.layout.alpha`),
      visible: readBoolean(layout as Record<string, unknown>, "visible"),
    },
    parallax: {
      followX: readFinitePayloadNumber(parallax.followX, `${label}.parallax.followX`),
      followY: readFinitePayloadNumber(parallax.followY, `${label}.parallax.followY`),
      zoom: readFinitePayloadNumber(parallax.zoom, `${label}.parallax.zoom`),
      lookUpY: readFinitePayloadNumber(parallax.lookUpY, `${label}.parallax.lookUpY`),
      ...(parallax.zoomDarken === undefined ? {} : { zoomDarken: readFinitePayloadNumber(parallax.zoomDarken, `${label}.parallax.zoomDarken`) }),
      ...(parallax.farAlpha === undefined ? {} : { farAlpha: readFinitePayloadNumber(parallax.farAlpha, `${label}.parallax.farAlpha`) }),
      ...(parallax.nearAlpha === undefined ? {} : { nearAlpha: readFinitePayloadNumber(parallax.nearAlpha, `${label}.parallax.nearAlpha`) }),
    },
  };

  return tuning;
}

function readPlayerHudMode(payload: Record<string, unknown>, fieldName: string): PlayerHudMode {
  const value = payload[fieldName];

  if (value !== "immersive" && value !== "classic") {
    throw new Error(`Invalid HUD mode tuning value: ${String(fieldName)}.`);
  }

  return value;
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;

  return `${rounded}`;
}

function formatJsonLikeObject(value: unknown): string {
  return JSON.stringify(value, (_key, nestedValue: unknown) => {
    if (typeof nestedValue === "number" && Number.isFinite(nestedValue)) {
      return Math.round(nestedValue * 1000) / 1000;
    }

    return nestedValue;
  }, 2).replace(/\n/gu, "\n  ");
}

function formatRigPartDefaults(updates: RigPartUpdates): string {
  const rows = rigPartKeys.map((key) => {
    const part = updates[key];

    return `  ${key}: { x: ${formatNumber(part.x)}, y: ${formatNumber(part.y)}, angle: ${formatNumber(part.angle)}, scaleX: ${formatNumber(part.scaleX)}, scaleY: ${formatNumber(part.scaleY)}, flipX: ${part.flipX}, flipY: ${part.flipY} },`;
  });

  return `export const DEFAULT_RIG_PARTS: Record<RigPartKey, RigPartTuning> = {\n${rows.join("\n")}\n};`;
}

function formatBodyPresetTuningDefaults(
  updates: BodyPartLayerUpdates,
  bodyAnimationUpdates: BodyPresetAnimationUpdates,
  bodyPresetFacePartUpdates: BodyPresetFacePartUpdates,
  bodyPresetFaceAssetLayerUpdates: BodyPresetFaceAssetLayerUpdates,
  bodyPresetAppearanceLayerUpdates: BodyPresetAppearanceLayerUpdates,
): string {
  const rows = bodyPresetKeys.map((presetKey) => {
    const key = formatObjectKey(presetKey);

    return [
      `  ${key}: {`,
      "    rigParts: cloneRigParts(DEFAULT_RIG_PARTS),",
      `    bodyPartLayers: ${formatBodyPartLayerObject(updates[presetKey], "    ")},`,
      `    faceParts: ${formatFacePartObject(bodyPresetFacePartUpdates[presetKey], "    ")},`,
      `    faceAssetLayers: ${formatFaceAssetLayerObject(bodyPresetFaceAssetLayerUpdates[presetKey], "    ")},`,
      `    appearanceLayers: ${formatAppearanceLayerObject(bodyPresetAppearanceLayerUpdates[presetKey], "    ")},`,
      `    bodyAnimations: ${formatBodyAnimationMap(bodyAnimationUpdates[presetKey], "    ")},`,
      "  },",
    ].join("\n");
  });

  return `export const DEFAULT_BODY_PRESET_TUNING: Record<PaperDollBodyPreset, BodyPresetTuning> = {\n${rows.join("\n")}\n};`;
}

function formatBodyAnimationMap(updates: Record<BodyAnimationKey, BodyAnimationUpdates>, indent: string): string {
  const rows = bodyAnimationKeys.map((key) => `${indent}  ${key}: ${formatBodyAnimationObject(updates[key], `${indent}  `)},`);

  return `{\n${rows.join("\n")}\n${indent}}`;
}

function formatBodyPartLayerObject(updates: RigPartUpdates, indent: string): string {
  const rows = rigPartKeys.map((key) => {
    const part = updates[key];

    return `${indent}  ${key}: { x: ${formatNumber(part.x)}, y: ${formatNumber(part.y)}, angle: ${formatNumber(part.angle)}, scaleX: ${formatNumber(part.scaleX)}, scaleY: ${formatNumber(part.scaleY)}, flipX: ${part.flipX}, flipY: ${part.flipY} },`;
  });

  return `{\n${rows.join("\n")}\n${indent}}`;
}

function formatFacePartObject(updates: FacePartUpdates, indent: string): string {
  const rows = facePartKeys.map((key) => {
    const part = updates[key];

    return `${indent}  ${key}: { x: ${formatNumber(part.x)}, y: ${formatNumber(part.y)}, scaleX: ${formatNumber(part.scaleX)}, scaleY: ${formatNumber(part.scaleY)} },`;
  });

  return `{\n${rows.join("\n")}\n${indent}}`;
}

function formatFaceAssetLayerObject(updates: FaceAssetLayerUpdates, indent: string): string {
  const rows = faceAssetLayerKeys.map((key) => {
    const layer = updates[key];

    return `${indent}  ${key}: { x: ${formatNumber(layer.x)}, y: ${formatNumber(layer.y)}, angle: ${formatNumber(layer.angle)}, scaleX: ${formatNumber(layer.scaleX)}, scaleY: ${formatNumber(layer.scaleY)} },`;
  });

  return `{\n${rows.join("\n")}\n${indent}}`;
}

function formatAppearanceLayerObject(updates: AppearanceLayerUpdates, indent: string): string {
  const rows = appearanceLayerKeys.map((key) => {
    const layer = updates[key];

    return `${indent}  ${key}: { x: ${formatNumber(layer.x)}, y: ${formatNumber(layer.y)}, angle: ${formatNumber(layer.angle)}, scaleX: ${formatNumber(layer.scaleX)}, scaleY: ${formatNumber(layer.scaleY)} },`;
  });

  return `{\n${rows.join("\n")}\n${indent}}`;
}

function formatObjectKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

function formatFacePartDefaults(updates: FacePartUpdates): string {
  const rows = facePartKeys.map((key) => {
    const part = updates[key];

    return `  ${key}: { x: ${formatNumber(part.x)}, y: ${formatNumber(part.y)}, scaleX: ${formatNumber(part.scaleX)}, scaleY: ${formatNumber(part.scaleY)} },`;
  });

  return `export const DEFAULT_FACE_PARTS: Record<FacePartKey, FacePartTuning> = {\n${rows.join("\n")}\n};`;
}

function formatEquipmentDefaults(updates: EquipmentUpdates): string {
  const rows = equipmentSlotKeys.map((key) => {
    const item = updates[key];

    return `  ${key}: { x: ${formatNumber(item.x)}, y: ${formatNumber(item.y)}, angle: ${formatNumber(item.angle)}, scaleX: ${formatNumber(item.scaleX)}, scaleY: ${formatNumber(item.scaleY)}, flipX: ${item.flipX}, flipY: ${item.flipY} },`;
  });

  return `export const DEFAULT_EQUIPMENT: Record<EquipmentSlotKey, EquipmentTuning> = {\n${rows.join("\n")}\n};`;
}

function formatEquipmentItemDefaults(updates: EquipmentItemUpdates): string {
  const rows = Object.entries(updates).map(([itemId, item]) => {
    return `  ${JSON.stringify(itemId)}: { x: ${formatNumber(item.x)}, y: ${formatNumber(item.y)}, angle: ${formatNumber(item.angle)}, scaleX: ${formatNumber(item.scaleX)}, scaleY: ${formatNumber(item.scaleY)}, flipX: ${item.flipX}, flipY: ${item.flipY} },`;
  });

  return `export const DEFAULT_EQUIPMENT_ITEM_TUNING: Record<string, EquipmentTuning> = {\n${rows.join("\n")}\n};`;
}

function formatSlashArcDefaults(updates: SlashArcUpdates): string {
  const rows = slashArcAttackKeys.map((key) => {
    const arc = updates[key];

    return [
      `  ${key}: {`,
      `    radius: ${formatNumber(arc.radius)},`,
      `    width: ${formatNumber(arc.width)},`,
      `    color: ${formatHexColor(arc.color)},`,
      `    alpha: ${formatNumber(arc.alpha)},`,
      `    duration: ${formatNumber(arc.duration)},`,
      `    offsetX: ${formatNumber(arc.offsetX)},`,
      `    offsetY: ${formatNumber(arc.offsetY)},`,
      `    startAngle: ${formatNumber(arc.startAngle)},`,
      `    endAngle: ${formatNumber(arc.endAngle)},`,
      `    angle: ${formatNumber(arc.angle)},`,
      `    sweep: ${formatNumber(arc.sweep)},`,
      "  },",
    ].join("\n");
  });

  return `export const DEFAULT_SLASH_ARCS: Record<SlashArcAttackKey, SlashArcTuning> = {\n${rows.join("\n")}\n};`;
}

function formatWardShieldDefault(updates: WardShieldUpdates): string {
  return [
    "export const DEFAULT_WARD_SHIELD_TUNING: WardShieldTuning = {",
    `  scale: ${formatNumber(updates.scale)},`,
    `  offsetX: ${formatNumber(updates.offsetX)},`,
    `  offsetY: ${formatNumber(updates.offsetY)},`,
    `  alpha: ${formatNumber(updates.alpha)},`,
    `  fadeInMs: ${formatNumber(updates.fadeInMs)},`,
    `  castDurationMs: ${formatNumber(updates.castDurationMs)},`,
    `  absorbDurationMs: ${formatNumber(updates.absorbDurationMs)},`,
    `  startScale: ${formatNumber(updates.startScale)},`,
    `  endScale: ${formatNumber(updates.endScale)},`,
    "};",
  ].join("\n");
}

function formatActionButtonOffsetDefaults(updates: ActionButtonOffsetUpdates): string {
  const rows = actionButtonOffsetKeys.map((key) => {
    const offset = updates[key];

    return `  ${key}: { x: ${formatNumber(offset.x)}, y: ${formatNumber(offset.y)} },`;
  });

  return `export const DEFAULT_ACTION_BUTTON_OFFSETS: Record<ActionButtonOffsetKey, ActionButtonOffsetTuning> = {\n${rows.join("\n")}\n};`;
}

function formatClassicActionButtonSlotDefaults(updates: ClassicActionButtonSlotUpdates): string {
  const rows = classicActionWheelModes.map((mode) => {
    const slots = classicActionButtonSlotKeys
      .map((key) => {
        const slot = updates[mode][key];

        return `    ${key}: { x: ${formatNumber(slot.x)}, y: ${formatNumber(slot.y)}, rotation: ${formatNumber(slot.rotation)} },`;
      })
      .join("\n");

    return [`  ${mode}: createClassicActionButtonSlots({`, slots, "  }),"].join("\n");
  });

  return `export const DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS: Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>> = {\n${rows.join("\n")}\n};`;
}

function formatHexColor(value: number): string {
  return `0x${Math.round(value).toString(16).padStart(6, "0")}`;
}

function formatBodyAnimationDefaults(constantName: string, updates: BodyAnimationUpdates): string {
  return [
    `export const ${constantName}: BodyAnimationTuning = {`,
    `  enabled: ${updates.enabled},`,
    `  duration: ${formatNumber(updates.duration)},`,
    ...formatBodyAnimationVariantMetaRows(updates, "  "),
    "  base: {",
    formatRigPartRows(updates.base),
    "  },",
    "  breath: {",
    formatRigPartRows(updates.breath),
    "  },",
    "  faceBase: {",
    formatFacePartRows(updates.faceBase),
    "  },",
    "  faceBreath: {",
    formatFacePartRows(updates.faceBreath),
    "  },",
    "  activeParts: {",
    formatBodyAnimationActivePartRows(updates.activeParts),
    "  },",
    ...formatBodyAnimationMovementStartKeyframeIdRows(updates.movementStartKeyframeId, "  "),
    ...formatBodyAnimationImpactKeyframeIdRows(updates.impactKeyframeId, "  "),
    "  keyframes: [",
    formatBodyAnimationKeyframeRows(updates.keyframes),
    "  ],",
    ...formatBodyAnimationVariantRows(updates.variants, "  "),
    "};",
  ].join("\n");
}

function formatBodyAnimationObject(updates: BodyAnimationUpdates, indent: string): string {
  const propertyIndent = `${indent}  `;
  const nestedEntryIndent = `${indent}    `;

  return [
    "{",
    `${propertyIndent}enabled: ${updates.enabled},`,
    `${propertyIndent}duration: ${formatNumber(updates.duration)},`,
    ...formatBodyAnimationVariantMetaRows(updates, propertyIndent),
    `${propertyIndent}base: {`,
    formatRigPartRows(updates.base, nestedEntryIndent),
    `${propertyIndent}},`,
    `${propertyIndent}breath: {`,
    formatRigPartRows(updates.breath, nestedEntryIndent),
    `${propertyIndent}},`,
    `${propertyIndent}faceBase: {`,
    formatFacePartRows(updates.faceBase, nestedEntryIndent),
    `${propertyIndent}},`,
    `${propertyIndent}faceBreath: {`,
    formatFacePartRows(updates.faceBreath, nestedEntryIndent),
    `${propertyIndent}},`,
    `${propertyIndent}activeParts: {`,
    formatBodyAnimationActivePartRows(updates.activeParts, nestedEntryIndent),
    `${propertyIndent}},`,
    ...formatBodyAnimationMovementStartKeyframeIdRows(updates.movementStartKeyframeId, propertyIndent),
    ...formatBodyAnimationImpactKeyframeIdRows(updates.impactKeyframeId, propertyIndent),
    `${propertyIndent}keyframes: [`,
    formatBodyAnimationKeyframeRows(updates.keyframes, nestedEntryIndent),
    `${propertyIndent}],`,
    ...formatBodyAnimationVariantRows(updates.variants, propertyIndent),
    `${indent}}`,
  ].join("\n");
}

function formatBodyAnimationVariantMetaRows(updates: BodyAnimationUpdates, indent: string): string[] {
  return [
    ...(updates.variantId ? [`${indent}variantId: ${JSON.stringify(updates.variantId)},`] : []),
    ...(updates.variantLabel ? [`${indent}variantLabel: ${JSON.stringify(updates.variantLabel)},`] : []),
    `${indent}variantWeight: ${formatNumber(updates.variantWeight)},`,
    `${indent}appliesToAllWeapons: ${updates.appliesToAllWeapons},`,
    ...(updates.weaponClasses.length > 0
      ? [`${indent}weaponClasses: [${updates.weaponClasses.map((weaponClass) => JSON.stringify(weaponClass)).join(", ")}],`]
      : []),
    ...(updates.selectedVariantId ? [`${indent}selectedVariantId: ${JSON.stringify(updates.selectedVariantId)},`] : []),
  ];
}

function formatBodyAnimationVariantRows(updates: readonly BodyAnimationUpdates[], indent: string): string[] {
  if (updates.length === 0) {
    return [];
  }

  return [
    `${indent}variants: [`,
    updates.map((variant) => formatBodyAnimationObject(variant, `${indent}  `)).join(",\n"),
    `${indent}],`,
  ];
}

function formatRigPartRows(updates: RigPartUpdates, indent = "    "): string {
  return rigPartKeys
    .map((key) => {
      const part = updates[key];

      return `${indent}${key}: { x: ${formatNumber(part.x)}, y: ${formatNumber(part.y)}, angle: ${formatNumber(part.angle)}, scaleX: ${formatNumber(part.scaleX)}, scaleY: ${formatNumber(part.scaleY)}, flipX: ${part.flipX}, flipY: ${part.flipY} },`;
    })
    .join("\n");
}

function formatBodyAnimationActivePartRows(updates: Record<RigPartKey, boolean>, indent = "    "): string {
  return rigPartKeys.map((key) => `${indent}${key}: ${updates[key]},`).join("\n");
}

function formatBodyAnimationImpactKeyframeIdRows(impactKeyframeId: string | undefined, indent: string): string[] {
  return impactKeyframeId ? [`${indent}impactKeyframeId: ${JSON.stringify(impactKeyframeId)},`] : [];
}

function formatBodyAnimationMovementStartKeyframeIdRows(movementStartKeyframeId: string | undefined, indent: string): string[] {
  return movementStartKeyframeId ? [`${indent}movementStartKeyframeId: ${JSON.stringify(movementStartKeyframeId)},`] : [];
}

function formatFacePartRows(updates: FacePartUpdates, indent = "    "): string {
  return facePartKeys
    .map((key) => {
      const part = updates[key];

      return `${indent}${key}: { x: ${formatNumber(part.x)}, y: ${formatNumber(part.y)}, scaleX: ${formatNumber(part.scaleX)}, scaleY: ${formatNumber(part.scaleY)} },`;
    })
    .join("\n");
}

function formatBodyAnimationKeyframeRows(updates: readonly BodyAnimationKeyframeUpdates[], indent = "    "): string {
  const propertyIndent = `${indent}  `;
  const nestedEntryIndent = `${indent}    `;

  return updates
    .map((keyframe) =>
      [
        `${indent}{`,
        `${propertyIndent}id: ${JSON.stringify(keyframe.id)},`,
        `${propertyIndent}time: ${formatNumber(keyframe.time)},`,
        `${propertyIndent}easing: ${JSON.stringify(keyframe.easing)},`,
        `${propertyIndent}rigParts: {`,
        formatRigPartRows(keyframe.rigParts, nestedEntryIndent),
        `${propertyIndent}},`,
        `${propertyIndent}faceParts: {`,
        formatFacePartRows(keyframe.faceParts, nestedEntryIndent),
        `${propertyIndent}},`,
        `${propertyIndent}rootOffset: { x: ${formatNumber(keyframe.rootOffset.x)}, y: ${formatNumber(keyframe.rootOffset.y)} },`,
        keyframe.weaponMirrorX ? `${propertyIndent}weaponMirrorX: true,` : "",
        keyframe.weaponMirrorY ? `${propertyIndent}weaponMirrorY: true,` : "",
        formatBodyAnimationCastPropRow(keyframe.castProp, propertyIndent),
        `${indent}},`,
      ].filter(Boolean).join("\n"),
    )
    .join("\n");
}

function formatBodyAnimationCastPropRow(castProp: BodyAnimationCastPropUpdates | undefined, indent: string): string {
  if (!castProp) {
    return "";
  }

  return `${indent}castProp: { visible: ${castProp.visible}, assetKey: ${JSON.stringify(castProp.assetKey)}, x: ${formatNumber(castProp.x)}, y: ${formatNumber(castProp.y)}, angle: ${formatNumber(castProp.angle)}, scaleX: ${formatNumber(castProp.scaleX)}, scaleY: ${formatNumber(castProp.scaleY)}, flipX: ${castProp.flipX}, flipY: ${castProp.flipY} },`;
}

function readBodyAnimationKeyframes(
  input: unknown,
  legacyPoses: Pick<BodyAnimationUpdates, "duration" | "base" | "breath" | "faceBase" | "faceBreath">,
): BodyAnimationKeyframeUpdates[] {
  const legacyKeyframes = createLegacyBodyAnimationKeyframes(legacyPoses);

  if (input === undefined) {
    return legacyKeyframes;
  }

  if (!Array.isArray(input)) {
    throw new Error("Expected body animation keyframes.");
  }

  if (input.length === 0) {
    return legacyKeyframes;
  }

  const sourceKeyframes = input.map((keyframe, index) => readBodyAnimationKeyframe(keyframe, index, legacyPoses.duration));
  const poseA = readBodyAnimationAnchorKeyframe("pose-a", legacyKeyframes[0], sourceKeyframes);
  const poseB = readBodyAnimationAnchorKeyframe("pose-b", legacyKeyframes[1], sourceKeyframes);
  const usedIds = new Set(["pose-a", "pose-b"]);
  const extraKeyframes = sourceKeyframes
    .filter((keyframe) => keyframe.id !== "pose-a" && keyframe.id !== "pose-b")
    .map((keyframe) => uniquifyBodyAnimationKeyframeId(keyframe, usedIds));

  return [poseA, poseB, ...extraKeyframes].sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
}

function readBodyAnimationAnchorKeyframe(
  id: "pose-a" | "pose-b",
  legacyKeyframe: BodyAnimationKeyframeUpdates,
  sourceKeyframes: readonly BodyAnimationKeyframeUpdates[],
): BodyAnimationKeyframeUpdates {
  const sourceKeyframe = sourceKeyframes.find((keyframe) => keyframe.id === id);

  if (!sourceKeyframe) {
    return legacyKeyframe;
  }

  return {
    ...legacyKeyframe,
    time: id === "pose-a" ? 0 : sourceKeyframe.time,
    easing: sourceKeyframe.easing,
    rootOffset: sourceKeyframe.rootOffset,
    weaponMirrorX: sourceKeyframe.weaponMirrorX,
    weaponMirrorY: sourceKeyframe.weaponMirrorY,
    castProp: sourceKeyframe.castProp,
  };
}

function createLegacyBodyAnimationKeyframes(
  legacyPoses: Pick<BodyAnimationUpdates, "duration" | "base" | "breath" | "faceBase" | "faceBreath">,
): [BodyAnimationKeyframeUpdates, BodyAnimationKeyframeUpdates] {
  return [
    {
      id: "pose-a",
      time: 0,
      easing: "easeInOut",
      rigParts: cloneRigPartUpdates(legacyPoses.base),
      faceParts: cloneFacePartUpdates(legacyPoses.faceBase),
      rootOffset: { x: 0, y: 0 },
    },
    {
      id: "pose-b",
      time: legacyPoses.duration / 2,
      easing: "easeInOut",
      rigParts: cloneRigPartUpdates(legacyPoses.breath),
      faceParts: cloneFacePartUpdates(legacyPoses.faceBreath),
      rootOffset: { x: 0, y: 0 },
    },
  ];
}

function readBodyAnimationKeyframe(input: unknown, index: number, duration: number): BodyAnimationKeyframeUpdates {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Invalid body animation keyframe: ${index}.`);
  }

  const keyframe = input as {
    id?: unknown;
    time?: unknown;
    easing?: unknown;
    rigParts?: unknown;
    faceParts?: unknown;
    rootOffset?: unknown;
    weaponMirrorX?: unknown;
    weaponMirrorY?: unknown;
    castProp?: unknown;
  };
  const id = typeof keyframe.id === "string" ? keyframe.id.trim().slice(0, 48) : "";

  if (!id) {
    throw new Error(`Invalid body animation keyframe id: ${index}.`);
  }

  if (typeof keyframe.time !== "number" || !Number.isFinite(keyframe.time)) {
    throw new Error(`Invalid body animation keyframe time: ${id}.`);
  }

  if (!isBodyAnimationKeyframeEasing(keyframe.easing)) {
    throw new Error(`Invalid body animation keyframe easing: ${id}.`);
  }

  return {
    id,
    time: Math.max(0, Math.min(duration, keyframe.time)),
    easing: keyframe.easing,
    rigParts: readRigPartRecord(keyframe.rigParts, `${id} rigParts`),
    faceParts: readFacePartRecord(keyframe.faceParts, `${id} faceParts`),
    rootOffset: readRootOffset(keyframe.rootOffset),
    weaponMirrorX: keyframe.weaponMirrorX === true ? true : undefined,
    weaponMirrorY: keyframe.weaponMirrorY === true ? true : undefined,
    castProp: readBodyAnimationCastProp(keyframe.castProp),
  };
}

function readBodyAnimationCastProp(input: unknown): BodyAnimationCastPropUpdates | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      visible: false,
      assetKey: defaultScrollCastPropAssetKey,
      x: 18,
      y: -116,
      angle: -12,
      scaleX: 0.46,
      scaleY: 0.46,
      flipX: false,
      flipY: false,
    };
  }

  const prop = input as Partial<BodyAnimationCastPropUpdates>;

  return {
    visible: prop.visible === true,
    assetKey: isScrollCastPropAssetKey(prop.assetKey) ? prop.assetKey : defaultScrollCastPropAssetKey,
    x: readClampedNumber(prop.x, -480, 480, 18),
    y: readClampedNumber(prop.y, -480, 480, -116),
    angle: readClampedNumber(prop.angle, -2160, 2160, -12),
    scaleX: readClampedNumber(prop.scaleX, 0.05, 3, 0.46),
    scaleY: readClampedNumber(prop.scaleY, 0.05, 3, 0.46),
    flipX: prop.flipX === true,
    flipY: prop.flipY === true,
  };
}

function readClampedNumber(input: unknown, min: number, max: number, fallback: number): number {
  return Math.max(min, Math.min(max, typeof input === "number" && Number.isFinite(input) ? input : fallback));
}

function readRootOffset(input: unknown): RootOffsetUpdates {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { x: 0, y: 0 };
  }

  const offset = input as Partial<RootOffsetUpdates>;

  return {
    x: Math.max(-480, Math.min(480, typeof offset.x === "number" && Number.isFinite(offset.x) ? offset.x : 0)),
    y: Math.max(-480, Math.min(480, typeof offset.y === "number" && Number.isFinite(offset.y) ? offset.y : 0)),
  };
}

function readBodyAnimationImpactKeyframeId(input: unknown, keyframes: readonly BodyAnimationKeyframeUpdates[]): string | undefined {
  return readBodyAnimationTimelineKeyframeId(input, keyframes, "impact");
}

function readBodyAnimationTimelineKeyframeId(
  input: unknown,
  keyframes: readonly BodyAnimationKeyframeUpdates[],
  label: string,
): string | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (typeof input !== "string") {
    throw new Error(`Invalid body animation ${label} keyframe.`);
  }

  const keyframeId = input.trim().slice(0, 48);

  if (!keyframeId) {
    return undefined;
  }

  if (!keyframes.some((keyframe) => keyframe.id === keyframeId)) {
    throw new Error(`Body animation ${label} keyframe does not exist: ${keyframeId}.`);
  }

  return keyframeId;
}

function cloneRigPartUpdates(updates: RigPartUpdates): RigPartUpdates {
  return Object.fromEntries(rigPartKeys.map((key) => [key, { ...updates[key] }])) as RigPartUpdates;
}

function cloneFacePartUpdates(updates: FacePartUpdates): FacePartUpdates {
  return Object.fromEntries(facePartKeys.map((key) => [key, { ...updates[key] }])) as FacePartUpdates;
}

function uniquifyBodyAnimationKeyframeId(keyframe: BodyAnimationKeyframeUpdates, usedIds: Set<string>): BodyAnimationKeyframeUpdates {
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
  return typeof value === "string" && bodyAnimationKeyframeEasings.includes(value as BodyAnimationKeyframeEasing);
}

function isScrollCastPropAssetKey(value: unknown): value is ScrollCastPropAssetKey {
  return typeof value === "string" && scrollCastPropAssetKeys.includes(value as ScrollCastPropAssetKey);
}

function isBodyAnimationWeaponClass(value: unknown): value is BodyAnimationWeaponClass {
  return typeof value === "string" && bodyAnimationWeaponClasses.includes(value as BodyAnimationWeaponClass);
}

function readRigPartRecord(input: unknown, label: string): RigPartUpdates {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Expected body animation ${label} rig parts.`);
  }

  return Object.fromEntries(rigPartKeys.map((key) => [key, readRigPartTuning(input, key)])) as RigPartUpdates;
}

function readFacePartRecord(input: unknown, label: string): FacePartUpdates {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Expected body animation ${label} face parts.`);
  }

  return Object.fromEntries(facePartKeys.map((key) => [key, readFacePartTuning(input, key)])) as FacePartUpdates;
}

function readBodyAnimationActiveParts(input: unknown): Record<RigPartKey, boolean> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Expected body animation activeParts.");
  }

  const activeParts = input as Partial<Record<RigPartKey, unknown>>;

  return Object.fromEntries(
    rigPartKeys.map((key) => {
      const value = activeParts[key];

      if (typeof value !== "boolean") {
        throw new Error(`Invalid body animation active part value: ${key}.`);
      }

      return [key, value];
    }),
  ) as Record<RigPartKey, boolean>;
}

function isBodyAnimationKey(value: unknown): value is BodyAnimationKey {
  return typeof value === "string" && bodyAnimationKeys.includes(value as BodyAnimationKey);
}

function readBodyPresetKey(value: unknown): BodyPresetKey {
  if (typeof value === "string" && bodyPresetKeys.includes(value as BodyPresetKey)) {
    return value as BodyPresetKey;
  }

  throw new Error("Expected paperDollBodyPreset in debug tuning payload.");
}

function readRigPartTuning(rigParts: object, key: RigPartKey): RigPartTuning {
  const part = (rigParts as Partial<Record<RigPartKey, unknown>>)[key];

  if (!part || typeof part !== "object" || Array.isArray(part)) {
    throw new Error(`Invalid rig part tuning value: ${key}.`);
  }

  const tuning = part as Partial<RigPartTuningPayload>;

  return {
    x: readFiniteRigPartNumber(tuning, key, "x"),
    y: readFiniteRigPartNumber(tuning, key, "y"),
    angle: readFiniteRigPartNumber(tuning, key, "angle"),
    scaleX: readFiniteRigPartNumber(tuning, key, "scaleX"),
    scaleY: readFiniteRigPartNumber(tuning, key, "scaleY"),
    flipX: readRigPartBoolean(tuning, key, "flipX"),
    flipY: readRigPartBoolean(tuning, key, "flipY"),
  };
}

function readFacePartTuning(faceParts: object, key: FacePartKey): FacePartTuning {
  const part = (faceParts as Partial<Record<FacePartKey, unknown>>)[key];

  if (!part || typeof part !== "object" || Array.isArray(part)) {
    throw new Error(`Invalid face part tuning value: ${key}.`);
  }

  const tuning = part as Partial<FacePartTuningPayload>;

  return {
    x: readFiniteFacePartNumber(tuning, key, "x"),
    y: readFiniteFacePartNumber(tuning, key, "y"),
    scaleX: readFiniteFacePartNumber(tuning, key, "scaleX"),
    scaleY: readFiniteFacePartNumber(tuning, key, "scaleY"),
  };
}

function readFaceAssetLayerTuning(faceAssetLayers: object, key: FaceAssetLayerKey): FaceAssetLayerTuning {
  const layer = (faceAssetLayers as Partial<Record<FaceAssetLayerKey, unknown>>)[key];

  if (!layer || typeof layer !== "object" || Array.isArray(layer)) {
    throw new Error(`Invalid face asset layer tuning value: ${key}.`);
  }

  const tuning = layer as Partial<FaceAssetLayerTuningPayload>;

  return {
    x: readFiniteFaceAssetLayerNumber(tuning, key, "x"),
    y: readFiniteFaceAssetLayerNumber(tuning, key, "y"),
    angle: readFiniteFaceAssetLayerNumber(tuning, key, "angle"),
    scaleX: readFiniteFaceAssetLayerNumber(tuning, key, "scaleX"),
    scaleY: readFiniteFaceAssetLayerNumber(tuning, key, "scaleY"),
  };
}

function readAppearanceLayerTuning(appearanceLayers: object, key: AppearanceLayerKey): AppearanceLayerTuning {
  const layer = (appearanceLayers as Partial<Record<AppearanceLayerKey, unknown>>)[key];

  if (!layer || typeof layer !== "object" || Array.isArray(layer)) {
    throw new Error(`Invalid appearance layer tuning value: ${key}.`);
  }

  const tuning = layer as Partial<AppearanceLayerTuningPayload>;

  return {
    x: readFiniteAppearanceLayerNumber(tuning, key, "x"),
    y: readFiniteAppearanceLayerNumber(tuning, key, "y"),
    angle: readFiniteAppearanceLayerNumber(tuning, key, "angle"),
    scaleX: readFiniteAppearanceLayerNumber(tuning, key, "scaleX"),
    scaleY: readFiniteAppearanceLayerNumber(tuning, key, "scaleY"),
  };
}

function readEquipmentTuning(equipment: object, key: EquipmentSlotKey): RigPartTuning {
  const item = (equipment as Partial<Record<EquipmentSlotKey, unknown>>)[key];

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`Invalid equipment tuning value: ${key}.`);
  }

  const tuning = item as Partial<RigPartTuningPayload>;

  return {
    x: readFiniteRigPartNumber(tuning, key, "x"),
    y: readFiniteRigPartNumber(tuning, key, "y"),
    angle: readFiniteRigPartNumber(tuning, key, "angle"),
    scaleX: readFiniteRigPartNumber(tuning, key, "scaleX"),
    scaleY: readFiniteRigPartNumber(tuning, key, "scaleY"),
    flipX: readRigPartBoolean(tuning, key, "flipX"),
    flipY: readRigPartBoolean(tuning, key, "flipY"),
  };
}

function readLooseEquipmentTuning(input: unknown, label: string): RigPartTuning {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`Invalid equipment item tuning value: ${label}.`);
  }

  return readClampedEquipmentTuning(input as Partial<RigPartTuningPayload>, label);
}

function readPromotedEquipmentTuning(input: unknown): RigPartTuning {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Expected promoted equipment tuning.");
  }

  return readClampedEquipmentTuning(input as Partial<RigPartTuningPayload>, "promotedEquipment");
}

function readClampedEquipmentTuning(tuning: Partial<RigPartTuningPayload>, label: string): RigPartTuning {
  return {
    x: Math.max(-240, Math.min(240, readFiniteRigPartNumber(tuning, label, "x"))),
    y: Math.max(-240, Math.min(240, readFiniteRigPartNumber(tuning, label, "y"))),
    angle: Math.max(-180, Math.min(180, readFiniteRigPartNumber(tuning, label, "angle"))),
    scaleX: Math.max(0.1, Math.min(3, readFiniteRigPartNumber(tuning, label, "scaleX"))),
    scaleY: Math.max(0.1, Math.min(3, readFiniteRigPartNumber(tuning, label, "scaleY"))),
    flipX: readRigPartBoolean(tuning, label, "flipX"),
    flipY: readRigPartBoolean(tuning, label, "flipY"),
  };
}

function readActionButtonOffsetTuning(offsets: object, key: ActionButtonOffsetKey): ActionButtonOffsetTuning {
  const offset = (offsets as Partial<Record<ActionButtonOffsetKey, unknown>>)[key];

  if (!offset || typeof offset !== "object" || Array.isArray(offset)) {
    throw new Error(`Invalid action button offset value: ${key}.`);
  }

  const tuning = offset as Partial<ActionButtonOffsetTuning>;

  return {
    x: readFiniteActionButtonOffsetNumber(tuning, key, "x"),
    y: readFiniteActionButtonOffsetNumber(tuning, key, "y"),
  };
}

function readClassicActionButtonSlotModeTuning(slots: object, mode: ClassicActionWheelMode): Record<ClassicActionButtonSlotKey, ClassicActionButtonSlotTuning> {
  const modeSlots = (slots as Partial<Record<ClassicActionWheelMode, unknown>>)[mode];

  if (!modeSlots || typeof modeSlots !== "object" || Array.isArray(modeSlots)) {
    throw new Error(`Invalid classic action wheel slots: ${mode}.`);
  }

  return Object.fromEntries(
    classicActionButtonSlotKeys.map((key) => [key, readClassicActionButtonSlotTuning(modeSlots, mode, key)]),
  ) as Record<ClassicActionButtonSlotKey, ClassicActionButtonSlotTuning>;
}

function readClassicActionButtonSlotTuning(slots: object, mode: ClassicActionWheelMode, key: ClassicActionButtonSlotKey): ClassicActionButtonSlotTuning {
  const slot = (slots as Partial<Record<ClassicActionButtonSlotKey, unknown>>)[key];

  if (!slot || typeof slot !== "object" || Array.isArray(slot)) {
    throw new Error(`Invalid classic action button slot value: ${mode}.${key}.`);
  }

  const tuning = slot as Partial<ClassicActionButtonSlotTuning>;
  const label = `${mode}.${key}`;

  return {
    x: readFiniteClassicActionButtonSlotNumber(tuning, label, "x"),
    y: readFiniteClassicActionButtonSlotNumber(tuning, label, "y"),
    rotation: readFiniteClassicActionButtonSlotNumber(tuning, label, "rotation"),
  };
}

function readSlashArcTuning(slashArcs: object, key: SlashArcAttackKey): SlashArcTuning {
  const arc = (slashArcs as Partial<Record<SlashArcAttackKey, unknown>>)[key];

  if (!arc || typeof arc !== "object" || Array.isArray(arc)) {
    throw new Error(`Invalid slash arc tuning value: ${key}.`);
  }

  const tuning = arc as Partial<Record<keyof SlashArcTuning, unknown>>;

  return {
    radius: readFiniteSlashArcNumber(tuning, key, "radius"),
    width: readFiniteSlashArcNumber(tuning, key, "width"),
    color: readFiniteSlashArcNumber(tuning, key, "color"),
    alpha: readFiniteSlashArcNumber(tuning, key, "alpha"),
    duration: readFiniteSlashArcNumber(tuning, key, "duration"),
    offsetX: readFiniteSlashArcNumber(tuning, key, "offsetX"),
    offsetY: readFiniteSlashArcNumber(tuning, key, "offsetY"),
    startAngle: readFiniteSlashArcNumber(tuning, key, "startAngle"),
    endAngle: readFiniteSlashArcNumber(tuning, key, "endAngle"),
    angle: readFiniteSlashArcNumber(tuning, key, "angle"),
    sweep: readFiniteSlashArcNumber(tuning, key, "sweep"),
  };
}

function readWardShieldTuning(wardShield: object): WardShieldTuning {
  const tuning = wardShield as Partial<Record<keyof WardShieldTuning, unknown>>;

  return {
    scale: readFiniteWardShieldNumber(tuning, "scale"),
    offsetX: readFiniteWardShieldNumber(tuning, "offsetX"),
    offsetY: readFiniteWardShieldNumber(tuning, "offsetY"),
    alpha: readFiniteWardShieldNumber(tuning, "alpha"),
    fadeInMs: readFiniteWardShieldNumber(tuning, "fadeInMs"),
    castDurationMs: readFiniteWardShieldNumber(tuning, "castDurationMs"),
    absorbDurationMs: readFiniteWardShieldNumber(tuning, "absorbDurationMs"),
    startScale: readFiniteWardShieldNumber(tuning, "startScale"),
    endScale: readFiniteWardShieldNumber(tuning, "endScale"),
  };
}

function readFiniteRigPartNumber(payload: Partial<RigPartTuningPayload>, partKey: string, fieldName: keyof RigPartTuning): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid rig part tuning value: ${partKey}.${fieldName}.`);
  }

  return value;
}

function readFiniteActionButtonOffsetNumber(
  payload: Partial<ActionButtonOffsetTuning>,
  buttonKey: ActionButtonOffsetKey,
  fieldName: keyof ActionButtonOffsetTuning,
): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid action button offset value: ${buttonKey}.${fieldName}.`);
  }

  return value;
}

function readFiniteClassicActionButtonSlotNumber(
  payload: Partial<ClassicActionButtonSlotTuning>,
  label: string,
  fieldName: keyof ClassicActionButtonSlotTuning,
): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid classic action button slot ${label}.${fieldName}.`);
  }

  return value;
}

function readFiniteFacePartNumber(payload: Partial<FacePartTuningPayload>, partKey: FacePartKey, fieldName: keyof FacePartTuning): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid face part tuning value: ${partKey}.${fieldName}.`);
  }

  return value;
}

function readFiniteFaceAssetLayerNumber(
  payload: Partial<FaceAssetLayerTuningPayload>,
  layerKey: FaceAssetLayerKey,
  fieldName: keyof FaceAssetLayerTuning,
): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid face asset layer tuning value: ${layerKey}.${fieldName}.`);
  }

  return value;
}

function readFiniteAppearanceLayerNumber(
  payload: Partial<AppearanceLayerTuningPayload>,
  layerKey: AppearanceLayerKey,
  fieldName: keyof AppearanceLayerTuning,
): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid appearance layer tuning value: ${layerKey}.${fieldName}.`);
  }

  return value;
}

function readFiniteSlashArcNumber(payload: Partial<Record<keyof SlashArcTuning, unknown>>, arcKey: SlashArcAttackKey, fieldName: keyof SlashArcTuning): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid slash arc tuning value: ${arcKey}.${fieldName}.`);
  }

  return value;
}

function readFiniteWardShieldNumber(payload: Partial<Record<keyof WardShieldTuning, unknown>>, fieldName: keyof WardShieldTuning): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ward shield tuning value: ${fieldName}.`);
  }

  return value;
}

function readRigPartBoolean(payload: Partial<RigPartTuningPayload>, partKey: string, fieldName: keyof RigPartTuning): boolean {
  const value = payload[fieldName];

  if (typeof value !== "boolean") {
    throw new Error(`Invalid rig part tuning value: ${partKey}.${fieldName}.`);
  }

  return value;
}

function readPlainObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Expected ${label}.`);
  }

  return value as Record<string, unknown>;
}

function readStringRecord(value: unknown, label: string): Record<string, string> {
  const record = readPlainObject(value, label);

  return Object.fromEntries(
    Object.entries(record).map(([key, recordValue]) => {
      if (typeof recordValue !== "string" || !recordValue.trim()) {
        throw new Error(`Invalid ${label}.${key}.`);
      }

      return [key, recordValue.trim()];
    }),
  );
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid ${label}.`);
  }

  return value.trim();
}

function readNonEmptyStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Invalid ${label}.`);
  }

  return [
    ...new Set(
      value.map((entry, index) => {
        return readNonEmptyString(entry, `${label}.${index}`);
      }),
    ),
  ];
}

function readFinitePayloadNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric value: ${label}.`);
  }

  return value;
}

function readClampedInteger(value: unknown, label: string, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(readFinitePayloadNumber(value, label))));
}

function readEquipmentSlot(value: unknown): EquipmentSlotKey {
  if (typeof value !== "string" || !equipmentSlotKeys.includes(value as EquipmentSlotKey)) {
    throw new Error("Invalid equipment slot.");
  }

  return value as EquipmentSlotKey;
}

function readGeneratedEquipmentKind(value: unknown): GeneratedEquipmentJsonRecord["kind"] {
  if (value === "armor" || value === "weapon") {
    return value;
  }

  throw new Error("Generated equipment kind must be armor or weapon.");
}

function readArmorCategory(value: unknown): GeneratedEquipmentJsonRecord["armorCategory"] | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "leather" || value === "cloth" || value === "chain" || value === "plate") {
    return value;
  }

  throw new Error("Invalid armor category.");
}

function readPromotedEquipmentAvailability(value: unknown, legacyShopFallback: boolean): GeneratedEquipmentAvailability {
  const fallback: GeneratedEquipmentAvailability = {
    shop: legacyShopFallback,
    enemyPool: false,
    bossUnique: false,
  };

  return readGeneratedEquipmentAvailability(value, fallback);
}

function readGeneratedEquipmentAvailability(value: unknown, fallback: GeneratedEquipmentAvailability): GeneratedEquipmentAvailability {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const availability = readPlainObject(value, "generated equipment availability");
  const bossUnique = readBooleanWithFallback(availability.bossUnique, fallback.bossUnique);

  if (bossUnique) {
    return {
      shop: false,
      enemyPool: false,
      bossUnique: true,
    };
  }

  return {
    shop: readBooleanWithFallback(availability.shop, fallback.shop),
    enemyPool: readBooleanWithFallback(availability.enemyPool, fallback.enemyPool),
    bossUnique: false,
  };
}

function readBooleanWithFallback(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readItemRarity(
  value: unknown,
  fallback: NonNullable<GeneratedEquipmentJsonRecord["rarity"]> = "common",
): NonNullable<GeneratedEquipmentJsonRecord["rarity"]> {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (
    value === "common" ||
    value === "uncommon" ||
    value === "rare" ||
    value === "epic" ||
    value === "legendary" ||
    value === "mythical" ||
    value === "unique"
  ) {
    return value;
  }

  throw new Error("Invalid item rarity.");
}

function readWeaponClass(
  value: unknown,
  fallback: NonNullable<GeneratedEquipmentJsonRecord["weaponClass"]> = "sword",
): NonNullable<GeneratedEquipmentJsonRecord["weaponClass"]> {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (value === "sword" || value === "axe" || value === "bow" || value === "mace" || value === "spear" || value === "shuriken") {
    return value;
  }

  throw new Error("Invalid weapon class.");
}

function getDefaultGeneratedItemRarity(
  kind: GeneratedEquipmentJsonRecord["kind"],
  armorCategory: GeneratedEquipmentJsonRecord["armorCategory"],
  weaponClass: GeneratedEquipmentJsonRecord["weaponClass"],
): NonNullable<GeneratedEquipmentJsonRecord["rarity"]> {
  if (kind === "armor" && armorCategory === "chain") {
    return "rare";
  }

  if (kind === "weapon" && weaponClass === "axe") {
    return "epic";
  }

  return "common";
}

function readAssetSourcePath(value: unknown, expectedPrefix: string, label: string, allowedExtensions = [".webp"]): string {
  const sourcePath = readNonEmptyString(value, label).replace(/\\/g, "/").replace(/^\.\//, "");
  const hasAllowedExtension = allowedExtensions.some((extension) => sourcePath.endsWith(extension));

  if (sourcePath.includes("..") || !sourcePath.startsWith(expectedPrefix) || !hasAllowedExtension) {
    throw new Error(`Invalid ${label}.`);
  }

  return sourcePath;
}

function readGeneratedAssetRemovalPath(value: unknown): string {
  const sourcePath = readNonEmptyString(value, "generated equipment asset removal path").replace(/\\/g, "/").replace(/^\.\//, "");
  const isEquipmentSourcePath =
    sourcePath.startsWith("assets/fighters/armor/") ||
    sourcePath.startsWith("assets-low/fighters/armor/") ||
    sourcePath.startsWith("assets/fighters/weapons/") ||
    sourcePath.startsWith("assets-low/fighters/weapons/") ||
    sourcePath.startsWith("assets/shop-icons/");
  const hasSupportedExtension = sourcePath.endsWith(".png") || sourcePath.endsWith(".webp");

  if (sourcePath.includes("..") || !isEquipmentSourcePath || !hasSupportedExtension) {
    throw new Error("Invalid generated equipment asset removal path.");
  }

  return sourcePath;
}

function getEquipmentAssetSourcePrefix(kind: GeneratedEquipmentJsonRecord["kind"]): string {
  return kind === "weapon" ? "assets/fighters/weapons/" : "assets/fighters/armor/";
}

function getEquipmentAssetLowSourcePrefix(kind: GeneratedEquipmentJsonRecord["kind"]): string {
  return kind === "weapon" ? "assets-low/fighters/weapons/" : "assets-low/fighters/armor/";
}

function validateGeneratedEquipmentSlot(kind: GeneratedEquipmentJsonRecord["kind"], equipmentSlot: EquipmentSlotKey): void {
  if (kind === "weapon" && equipmentSlot !== "weaponMain" && equipmentSlot !== "weaponBow") {
    throw new Error("Promoted weapon item must use weaponMain or weaponBow slot.");
  }

  if (kind === "armor" && (equipmentSlot === "weaponMain" || equipmentSlot === "weaponBow")) {
    throw new Error("Promoted armor item cannot use weapon slots.");
  }
}

function getArmoryCategoryId(slotKey: EquipmentSlotKey): string | undefined {
  if (slotKey === "helmet") {
    return "head";
  }

  if (slotKey === "breastplate") {
    return "chest";
  }

  if (slotKey === "backShoulderguard" || slotKey === "frontShoulderguard") {
    return "shoulders";
  }

  if (slotKey === "backWrist" || slotKey === "frontWrist" || slotKey === "backGlove" || slotKey === "frontGlove" || slotKey === "shield") {
    return "arms";
  }

  if (slotKey === "backGreave" || slotKey === "frontGreave" || slotKey === "backShinguard" || slotKey === "frontShinguard") {
    return "legs";
  }

  if (slotKey === "backBoot" || slotKey === "frontBoot") {
    return "legs";
  }

  return undefined;
}

function getWeaponCategoryId(assetKey: string, name: string, weaponClass = getWeaponClassFromText(`${assetKey} ${name}`)): string {
  if (weaponClass === "axe") {
    return "axes";
  }

  if (weaponClass === "bow") {
    return "bows";
  }

  if (weaponClass === "shuriken") {
    return "shurikens";
  }

  if (weaponClass === "mace") {
    return "maces";
  }

  if (weaponClass === "spear") {
    return "spears";
  }

  return "swords";
}

function getWeaponClassFromText(value: string): NonNullable<GeneratedEquipmentJsonRecord["weaponClass"]> {
  const text = value.toLowerCase();

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

function readKebabIdentifier(value: unknown, label: string): string {
  const identifier = readNonEmptyString(value, label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!identifier) {
    throw new Error(`Invalid ${label}.`);
  }

  return identifier;
}

function toIdentifier(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function readJson(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown);
      } catch {
        reject(new Error("Invalid JSON payload."));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, payload: object): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(payload));
}
