import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import sharp from "sharp";
import { defineConfig, type Plugin } from "vite";

const arenaLayoutUrl = new URL("./src/arenaLayout.ts", import.meta.url);
const combatUrl = new URL("./src/combat.ts", import.meta.url);
const debugTuningUrl = new URL("./src/debugTuning.ts", import.meta.url);
const settingsMenuUrl = new URL("./src/settingsMenu.ts", import.meta.url);
const generatedEquipmentJsonUrl = new URL("./src/generated/equipmentItems.generated.json", import.meta.url);
const generatedEquipmentTsUrl = new URL("./src/generated/equipmentItems.generated.ts", import.meta.url);
const generatedArenaBossesJsonUrl = new URL("./src/generated/arenaBosses.generated.json", import.meta.url);
const generatedArenaBossesTsUrl = new URL("./src/generated/arenaBosses.generated.ts", import.meta.url);
const promotedEquipmentRuntimeWebpQuality = 86;
const promotedEquipmentLowWebpQuality = 76;
const promotedEquipmentLowMaxSide = 448;
const promotedEquipmentShopIconSize = 160;
const promotedEquipmentShopIconContentSize = 136;
const promotedEquipmentShopIconWebpQuality = 88;
const promotedEquipmentMaxArmorHp = 200;
const promotedEquipmentMaxDamageBonus = 100;
const promotedEquipmentMaxPrice = 2000;
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
  DEFAULT_ARENA_BACK_FOLLOW_X: "arenaBackFollowX",
  DEFAULT_ARENA_BACK_FOLLOW_Y: "arenaBackFollowY",
  DEFAULT_ARENA_BACK_ZOOM: "arenaBackZoom",
  DEFAULT_ARENA_BACK_LOOK_UP_Y: "arenaBackLookUpY",
  DEFAULT_ARENA_MID_FOLLOW_X: "arenaMidFollowX",
  DEFAULT_ARENA_MID_FOLLOW_Y: "arenaMidFollowY",
  DEFAULT_ARENA_MID_ZOOM: "arenaMidZoom",
  DEFAULT_ARENA_MID_LOOK_UP_Y: "arenaMidLookUpY",
  DEFAULT_ARENA_MID_ZOOM_DARKEN: "arenaMidZoomDarken",
  DEFAULT_ARENA_GROUND_FOLLOW_X: "arenaGroundFollowX",
  DEFAULT_ARENA_GROUND_FOLLOW_Y: "arenaGroundFollowY",
  DEFAULT_ARENA_GROUND_ZOOM: "arenaGroundZoom",
  DEFAULT_ARENA_GROUND_LOOK_UP_Y: "arenaGroundLookUpY",
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
} as const;

type DebugTuningDefaultField = keyof typeof debugTuningDefaultFields;
type DebugTuningDefaultPayload = Record<(typeof debugTuningDefaultFields)[DebugTuningDefaultField], unknown>;
type DebugTuningDefaultUpdates = Record<DebugTuningDefaultField, number>;

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

const facePartKeys = ["eyeLeft", "eyeRight"] as const;
type FacePartKey = (typeof facePartKeys)[number];

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

const bodyAnimationKeys = ["idle", "walkCycle", "lunge", "light", "medium", "heavy", "bowShot", "hit", "block", "taunt", "rest"] as const;
type BodyAnimationKey = (typeof bodyAnimationKeys)[number];

const slashArcAttackKeys = ["light", "medium", "heavy"] as const;
type SlashArcAttackKey = (typeof slashArcAttackKeys)[number];

const actionButtonOffsetKeys = ["forward", "back", "lunge", "light", "medium", "heavy", "taunt", "rest"] as const;
type ActionButtonOffsetKey = (typeof actionButtonOffsetKeys)[number];

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

type RigPartUpdates = Record<RigPartKey, RigPartTuning>;
type FacePartUpdates = Record<FacePartKey, FacePartTuning>;
type EquipmentUpdates = Record<EquipmentSlotKey, RigPartTuning>;
type EquipmentItemUpdates = Record<string, RigPartTuning>;
type SlashArcUpdates = Record<SlashArcAttackKey, SlashArcTuning>;
type ActionButtonOffsetUpdates = Record<ActionButtonOffsetKey, ActionButtonOffsetTuning>;
type ClassicActionButtonSlotUpdates = Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>>;

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
  key: BodyAnimationKey;
  enabled: boolean;
  duration: number;
  base: RigPartUpdates;
  breath: RigPartUpdates;
  faceBase: FacePartUpdates;
  faceBreath: FacePartUpdates;
  activeParts: Record<RigPartKey, boolean>;
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

interface GeneratedEquipmentJsonRecord {
  id: string;
  name: string;
  kind: "armor" | "weapon";
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythical" | "unique";
  armorCategory?: "leather" | "cloth" | "chain" | "plate";
  equipmentSlot: EquipmentSlotKey;
  armorHp?: number;
  damageBonus?: number;
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
          const nextDebugTuningSource = applyDebugTuningDefaultUpdates(
            applySlashArcDefaultUpdates(
              applyEquipmentItemDefaultUpdates(
                applyEquipmentDefaultUpdates(
                  applyFacePartDefaultUpdates(
                    applyBodyAnimationDefaultUpdates(
                    applyRigPartDefaultUpdates(
                      applyClassicActionButtonSlotDefaultUpdates(
                        applyActionButtonOffsetDefaultUpdates(debugTuningSource, actionButtonOffsetUpdates),
                        classicActionButtonSlotUpdates,
                      ),
                      rigPartUpdates,
                    ),
                      bodyAnimationUpdates,
                    ),
                    facePartUpdates,
                  ),
                  equipmentUpdates,
                ),
                equipmentItemUpdates,
              ),
              slashArcUpdates,
            ),
            debugTuningDefaultUpdates,
          );

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
            message: `Saved ${Object.keys(layoutUpdates).length} layout defaults, ${Object.keys(combatUpdates).length} combat defaults, ${Object.keys(debugTuningDefaultUpdates).length} debug defaults, ${Object.keys(playerSettingDefaultUpdates).length} player setting defaults, ${Object.keys(actionButtonOffsetUpdates).length} action button offsets, ${Object.keys(classicActionButtonSlotUpdates).length} classic action wheels, ${Object.keys(rigPartUpdates).length} rig defaults, ${Object.keys(facePartUpdates).length} face defaults, ${bodyAnimationUpdates.key} body animation, ${Object.keys(equipmentUpdates).length} equipment defaults, ${Object.keys(equipmentItemUpdates).length} equipment item defaults, ${Object.keys(generatedEquipmentItemUpdates).length} generated equipment item defaults, and ${Object.keys(slashArcUpdates).length} slash effect defaults to prod.`,
            updated:
              Object.keys(layoutUpdates).length +
              Object.keys(combatUpdates).length +
              Object.keys(debugTuningDefaultUpdates).length +
              Object.keys(playerSettingDefaultUpdates).length +
              Object.keys(actionButtonOffsetUpdates).length +
              Object.keys(classicActionButtonSlotUpdates).length +
              Object.keys(rigPartUpdates).length +
              Object.keys(facePartUpdates).length +
              1 +
              Object.keys(equipmentUpdates).length +
              Object.keys(equipmentItemUpdates).length +
              Object.keys(generatedEquipmentItemUpdates).length +
              Object.keys(slashArcUpdates).length,
          });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not save prod defaults." });
        }
      });

      server.middlewares.use("/__dust-arena/save-prod-animation", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { message: "Use POST to save prod animation." });
          return;
        }

        try {
          const payload = await readJson(request);
          const animationUpdates = pickBodyAnimationUpdates(payload);
          const source = await readFile(debugTuningUrl, "utf8");
          const nextSource = applyBodyAnimationDefaultUpdates(source, animationUpdates);

          await writeFile(debugTuningUrl, nextSource, "utf8");
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: `Saved ${animationUpdates.key} animation defaults to prod.`, updated: 1 });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not save prod animation." });
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
    const pattern = new RegExp(`(\\n\\s*${fieldName}: )[-0-9.]+(,)`);

    if (!pattern.test(nextSource)) {
      throw new Error(`Could not find defaultDebugTuning.${fieldName} in debugTuning.ts.`);
    }

    return nextSource.replace(pattern, `$1${formatNumber(value)}$2`);
  }, source);
}

export function pickDebugTuningDefaultUpdates(payload: unknown): DebugTuningDefaultUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  return Object.fromEntries(
    Object.entries(debugTuningDefaultFields).map(([fieldName, payloadField]) => [
      fieldName,
      readFiniteNumber(payload as DebugTuningDefaultPayload, payloadField),
    ]),
  ) as DebugTuningDefaultUpdates;
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

  const faceParts = (payload as { faceParts?: unknown }).faceParts;

  if (!faceParts || typeof faceParts !== "object" || Array.isArray(faceParts)) {
    throw new Error("Expected faceParts in debug tuning payload.");
  }

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

export function pickBodyAnimationUpdates(payload: unknown): BodyAnimationUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const selectedBodyAnimation = (payload as { selectedBodyAnimation?: unknown }).selectedBodyAnimation;
  const bodyAnimations = (payload as { bodyAnimations?: unknown }).bodyAnimations;

  if (!isBodyAnimationKey(selectedBodyAnimation)) {
    throw new Error("Expected selectedBodyAnimation in debug tuning payload.");
  }

  if (!bodyAnimations || typeof bodyAnimations !== "object" || Array.isArray(bodyAnimations)) {
    throw new Error("Expected bodyAnimations in debug tuning payload.");
  }

  const bodyAnimation = (bodyAnimations as Partial<Record<BodyAnimationKey, unknown>>)[selectedBodyAnimation];

  if (!bodyAnimation || typeof bodyAnimation !== "object" || Array.isArray(bodyAnimation)) {
    throw new Error(`Expected ${selectedBodyAnimation} animation in debug tuning payload.`);
  }

  const animation = bodyAnimation as { enabled?: unknown; duration?: unknown; base?: unknown; breath?: unknown; faceBase?: unknown; faceBreath?: unknown; activeParts?: unknown };

  if (typeof animation.enabled !== "boolean") {
    throw new Error("Invalid body animation value: enabled.");
  }

  if (typeof animation.duration !== "number" || !Number.isFinite(animation.duration)) {
    throw new Error("Invalid body animation value: duration.");
  }

  return {
    key: selectedBodyAnimation,
    enabled: animation.enabled,
    duration: Math.max(240, Math.min(2400, animation.duration)),
    base: readRigPartRecord(animation.base, "base"),
    breath: readRigPartRecord(animation.breath, "breath"),
    faceBase: readFacePartRecord(animation.faceBase, "faceBase"),
    faceBreath: readFacePartRecord(animation.faceBreath, "faceBreath"),
    activeParts: readBodyAnimationActiveParts(animation.activeParts),
  };
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    equipmentSlot: record.equipmentSlot,
    ...(record.armorHp !== undefined ? { armorHp: record.armorHp } : {}),
    ...(record.damageBonus !== undefined ? { damageBonus: record.damageBonus } : {}),
    ...(record.requirements ? { requirements: record.requirements } : {}),
    ...(record.weaponClass ? { weaponClass: record.weaponClass } : {}),
  };

  return [
    "  {",
    `    item: ${JSON.stringify(item)},`,
    `    assetKeys: ${JSON.stringify(record.assetKeys)},`,
    `    equipmentTuning: ${JSON.stringify(record.equipmentTuning)},`,
    "    asset: {",
    `      key: ${JSON.stringify(record.asset.key)},`,
    `      url: new URL(${JSON.stringify(`../${record.asset.sourcePath}`)}, import.meta.url).href,`,
    ...(record.asset.lowSourcePath ? [`      lowUrl: new URL(${JSON.stringify(`../${record.asset.lowSourcePath}`)}, import.meta.url).href,`] : []),
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
      ? Math.max(0, Math.min(promotedEquipmentMaxArmorHp, Math.floor(readFinitePayloadNumber(record.armorHp, "generated equipment armorHp"))))
      : undefined;
  const damageBonus =
    kind === "weapon"
      ? Math.max(
          0,
          Math.min(promotedEquipmentMaxDamageBonus, Math.floor(readFinitePayloadNumber(record.damageBonus, "generated equipment damageBonus"))),
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
    ...(armorHp !== undefined ? { armorHp } : {}),
    ...(damageBonus !== undefined ? { damageBonus } : {}),
    ...(requirements ? { requirements } : {}),
    ...(weaponClass ? { weaponClass } : {}),
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
  const price = Math.max(0, Math.min(promotedEquipmentMaxPrice, Math.floor(readFinitePayloadNumber(product.price, "generated armory product price"))));
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
  const price = Math.max(0, Math.min(promotedEquipmentMaxPrice, Math.floor(readFinitePayloadNumber(product.price, "generated weapon product price"))));
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

function formatRigPartDefaults(updates: RigPartUpdates): string {
  const rows = rigPartKeys.map((key) => {
    const part = updates[key];

    return `  ${key}: { x: ${formatNumber(part.x)}, y: ${formatNumber(part.y)}, angle: ${formatNumber(part.angle)}, scaleX: ${formatNumber(part.scaleX)}, scaleY: ${formatNumber(part.scaleY)}, flipX: ${part.flipX}, flipY: ${part.flipY} },`;
  });

  return `export const DEFAULT_RIG_PARTS: Record<RigPartKey, RigPartTuning> = {\n${rows.join("\n")}\n};`;
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

function formatActionButtonOffsetDefaults(updates: ActionButtonOffsetUpdates): string {
  const rows = actionButtonOffsetKeys.map((key) => {
    const offset = updates[key];

    return `  ${key}: { x: ${formatNumber(offset.x)}, y: ${formatNumber(offset.y)} },`;
  });

  return `export const DEFAULT_ACTION_BUTTON_OFFSETS: Record<ActionButtonOffsetKey, ActionButtonOffsetTuning> = {\n${rows.join("\n")}\n};`;
}

function formatClassicActionButtonSlotDefaults(updates: ClassicActionButtonSlotUpdates): string {
  const rows = classicActionWheelModes.map((mode) => {
    const slots = actionButtonOffsetKeys
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
    "};",
  ].join("\n");
}

function formatRigPartRows(updates: RigPartUpdates): string {
  return rigPartKeys
    .map((key) => {
      const part = updates[key];

      return `    ${key}: { x: ${formatNumber(part.x)}, y: ${formatNumber(part.y)}, angle: ${formatNumber(part.angle)}, scaleX: ${formatNumber(part.scaleX)}, scaleY: ${formatNumber(part.scaleY)}, flipX: ${part.flipX}, flipY: ${part.flipY} },`;
    })
    .join("\n");
}

function formatBodyAnimationActivePartRows(updates: Record<RigPartKey, boolean>): string {
  return rigPartKeys.map((key) => `    ${key}: ${updates[key]},`).join("\n");
}

function formatFacePartRows(updates: FacePartUpdates): string {
  return facePartKeys
    .map((key) => {
      const part = updates[key];

      return `    ${key}: { x: ${formatNumber(part.x)}, y: ${formatNumber(part.y)}, scaleX: ${formatNumber(part.scaleX)}, scaleY: ${formatNumber(part.scaleY)} },`;
    })
    .join("\n");
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

function readClassicActionButtonSlotModeTuning(slots: object, mode: ClassicActionWheelMode): Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning> {
  const modeSlots = (slots as Partial<Record<ClassicActionWheelMode, unknown>>)[mode];

  if (!modeSlots || typeof modeSlots !== "object" || Array.isArray(modeSlots)) {
    throw new Error(`Invalid classic action wheel slots: ${mode}.`);
  }

  return Object.fromEntries(
    actionButtonOffsetKeys.map((key) => [key, readClassicActionButtonSlotTuning(modeSlots, mode, key)]),
  ) as Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>;
}

function readClassicActionButtonSlotTuning(slots: object, mode: ClassicActionWheelMode, key: ActionButtonOffsetKey): ClassicActionButtonSlotTuning {
  const slot = (slots as Partial<Record<ActionButtonOffsetKey, unknown>>)[key];

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

function readFiniteSlashArcNumber(payload: Partial<Record<keyof SlashArcTuning, unknown>>, arcKey: SlashArcAttackKey, fieldName: keyof SlashArcTuning): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid slash arc tuning value: ${arcKey}.${fieldName}.`);
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

  if (slotKey === "backWrist" || slotKey === "frontWrist" || slotKey === "backGlove" || slotKey === "frontGlove") {
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
