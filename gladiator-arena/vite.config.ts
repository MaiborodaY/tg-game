import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import sharp from "sharp";
import { defineConfig, type Plugin } from "vite";

const arenaLayoutUrl = new URL("./src/arenaLayout.ts", import.meta.url);
const combatUrl = new URL("./src/combat.ts", import.meta.url);
const debugTuningUrl = new URL("./src/debugTuning.ts", import.meta.url);
const settingsMenuUrl = new URL("./src/settingsMenu.ts", import.meta.url);
const generatedEquipmentJsonUrl = new URL("./src/generated/equipmentItems.generated.json", import.meta.url);
const generatedEquipmentTsUrl = new URL("./src/generated/equipmentItems.generated.ts", import.meta.url);
const promotedEquipmentRuntimeWebpQuality = 86;
const promotedEquipmentLowWebpQuality = 76;
const promotedEquipmentLowMaxSide = 448;
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
  heroPortraitButtonX: "heroPortraitButtonX",
  heroPortraitButtonY: "heroPortraitButtonY",
  heroPortraitButtonScale: "heroPortraitButtonScale",
  shadowOffsetX: "shadowOffsetX",
  shadowOffsetY: "shadowOffsetY",
  shadowScaleX: "shadowScaleX",
  shadowScaleY: "shadowScaleY",
  shadowAlpha: "shadowAlpha",
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

const bodyAnimationKeys = ["idle", "walkCycle", "lunge", "light", "medium", "heavy", "taunt", "rest"] as const;
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
  item?: unknown;
  assetKeys?: unknown;
  asset?: unknown;
  equipmentTuning?: unknown;
}

interface GeneratedEquipmentJsonRecord {
  id: string;
  name: string;
  kind: "armor" | "weapon";
  armorCategory?: "leather" | "cloth" | "chain" | "plate";
  equipmentSlot: EquipmentSlotKey;
  armorHp?: number;
  damageBonus?: number;
  weaponClass?: "sword" | "axe" | "bow";
  assetKeys: Record<string, string>;
  equipmentTuning: RigPartTuning;
  asset: {
    key: string;
    sourcePath: string;
    lowSourcePath?: string;
  };
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
          const equipmentItemUpdates = pickEquipmentItemDefaultUpdates(payload);
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
          ]);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, {
            message: `Saved ${Object.keys(layoutUpdates).length} layout defaults, ${Object.keys(combatUpdates).length} combat defaults, ${Object.keys(debugTuningDefaultUpdates).length} debug defaults, ${Object.keys(playerSettingDefaultUpdates).length} player setting defaults, ${Object.keys(actionButtonOffsetUpdates).length} action button offsets, ${Object.keys(classicActionButtonSlotUpdates).length} classic action wheels, ${Object.keys(rigPartUpdates).length} rig defaults, ${Object.keys(facePartUpdates).length} face defaults, ${bodyAnimationUpdates.key} body animation, ${Object.keys(equipmentUpdates).length} equipment defaults, ${Object.keys(equipmentItemUpdates).length} equipment item defaults, and ${Object.keys(slashArcUpdates).length} slash effect defaults to prod.`,
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
          const promotedItem = await pickPromotedEquipmentItem(payload);
          const records = await readGeneratedEquipmentRecords();
          const nextRecords = upsertGeneratedEquipmentRecord(records, promotedItem);

          await writeGeneratedEquipmentRecords(nextRecords);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: `Promoted ${promotedItem.name}.`, updated: 1 });
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
          const removedItem = await removeGeneratedEquipmentItem(itemId);

          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, { message: `Removed ${removedItem.name}.`, updated: 1 });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : "Could not remove equipment item." });
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

export function pickEquipmentItemDefaultUpdates(payload: unknown): EquipmentItemUpdates {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with debug tuning values.");
  }

  const equipmentItems = (payload as { equipmentItems?: unknown }).equipmentItems;

  if (!equipmentItems || typeof equipmentItems !== "object" || Array.isArray(equipmentItems)) {
    throw new Error("Expected equipmentItems in debug tuning payload.");
  }

  return Object.fromEntries(
    Object.entries(equipmentItems).flatMap(([itemId, tuning]) => {
      if (!itemId.trim()) {
        return [];
      }

      return [[itemId, readLooseEquipmentTuning(tuning, itemId)]];
    }),
  );
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

export async function pickPromotedEquipmentItem(payload: unknown): Promise<GeneratedEquipmentJsonRecord> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Expected a JSON object with equipment promotion values.");
  }

  const promotion = payload as PromoteEquipmentItemPayload;
  const item = readPlainObject(promotion.item, "item");
  const asset = readPlainObject(promotion.asset, "asset");
  const assetKeys = readStringRecord(promotion.assetKeys, "assetKeys");
  const kind = readGeneratedEquipmentKind(item.kind);
  const equipmentSlot = readEquipmentSlot(item.equipmentSlot);
  const equipmentTuning = readPromotedEquipmentTuning(promotion.equipmentTuning);
  const assetKey = readNonEmptyString(asset.key, "asset.key");
  const sourcePath = readAssetSourcePath(asset.sourcePath, getEquipmentAssetSourcePrefix(kind), "asset.sourcePath", [".png", ".webp"]);
  const lowSourcePath =
    typeof asset.lowSourcePath === "string" && asset.lowSourcePath.trim()
      ? readAssetSourcePath(asset.lowSourcePath, getEquipmentAssetLowSourcePrefix(kind), "asset.lowSourcePath")
      : undefined;
  const armorCategory = kind === "armor" ? readArmorCategory(item.armorCategory) : undefined;
  const name = readNonEmptyString(promotion.name, "name").slice(0, 80);
  const armorHp = kind === "armor" ? Math.max(0, Math.min(10, Math.floor(readFinitePayloadNumber(promotion.armorHp, "armorHp")))) : undefined;
  const damageBonus =
    kind === "weapon" ? Math.max(0, Math.min(10, Math.floor(readFinitePayloadNumber(promotion.damageBonus, "damageBonus")))) : undefined;
  const weaponClass = kind === "weapon" ? readWeaponClass(item.weaponClass, getWeaponClassFromText(`${assetKey} ${name}`)) : undefined;
  const price = Math.max(0, Math.min(250, Math.floor(readFinitePayloadNumber(promotion.price, "price"))));
  const addToShop = promotion.addToShop === true;
  const categoryId = getArmoryCategoryId(equipmentSlot);
  const id = `generated_equipment_${toIdentifier(assetKey)}`;

  validateGeneratedEquipmentSlot(kind, equipmentSlot);

  if (!Object.values(assetKeys).includes(assetKey)) {
    throw new Error("Promoted item assetKeys must reference asset.key.");
  }

  const promotedAssetPaths = sourcePath.endsWith(".png")
    ? await convertPromotedEquipmentPngAsset(sourcePath)
    : {
        sourcePath,
        ...(lowSourcePath ? { lowSourcePath } : {}),
      };

  return {
    id,
    name,
    kind,
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
    ...(addToShop && kind === "armor" && categoryId
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
    ...(addToShop && kind === "weapon"
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
  };
}

function pickGeneratedEquipmentRemovalId(payload: unknown): string {
  const removal = readPlainObject(payload, "equipment removal values");
  const itemId = readNonEmptyString(removal.itemId, "itemId");

  if (!itemId.startsWith("generated_equipment_")) {
    throw new Error("Only generated equipment items can be removed.");
  }

  return itemId;
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

function upsertGeneratedEquipmentRecord(records: GeneratedEquipmentJsonRecord[], nextRecord: GeneratedEquipmentJsonRecord): GeneratedEquipmentJsonRecord[] {
  return [
    ...records.filter((record) => record.id !== nextRecord.id && record.asset.sourcePath !== nextRecord.asset.sourcePath),
    nextRecord,
  ].sort((left, right) => left.id.localeCompare(right.id));
}

async function removeGeneratedEquipmentItem(itemId: string): Promise<GeneratedEquipmentJsonRecord> {
  const records = await readGeneratedEquipmentRecords();
  const removedRecord = records.find((record) => record.id === itemId);

  if (!removedRecord) {
    throw new Error("Generated equipment item not found.");
  }

  const nextRecords = records.filter((record) => record.id !== itemId);

  await writeGeneratedEquipmentRecords(nextRecords);
  await removeGeneratedEquipmentAssetFiles(removedRecord, nextRecords);

  return removedRecord;
}

async function removeGeneratedEquipmentAssetFiles(
  removedRecord: GeneratedEquipmentJsonRecord,
  remainingRecords: GeneratedEquipmentJsonRecord[],
): Promise<void> {
  const stillReferencedPaths = new Set(remainingRecords.flatMap((record) => getGeneratedEquipmentAssetRemovalPaths(record)));
  const removalPaths = getGeneratedEquipmentAssetRemovalPaths(removedRecord, stillReferencedPaths);

  await Promise.all(removalPaths.map((sourcePath) => rm(getProjectSourceUrl(sourcePath), { force: true })));
}

function getGeneratedEquipmentAssetRemovalPaths(
  record: GeneratedEquipmentJsonRecord,
  ignoredPaths: ReadonlySet<string> = new Set(),
): string[] {
  const candidates = [record.asset.sourcePath, record.asset.lowSourcePath, getGeneratedEquipmentSourcePngPath(record.asset.sourcePath)];
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

export interface GeneratedEquipmentItemRecord {
  item: HeroItemDefinition;
  assetKeys: EquipmentItemAssetKeys;
  equipmentTuning?: EquipmentTuning;
  asset: EquipmentAssetDefinition;
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
    ...(record.armorCategory ? { armorCategory: record.armorCategory } : {}),
    equipmentSlot: record.equipmentSlot,
    ...(record.armorHp !== undefined ? { armorHp: record.armorHp } : {}),
    ...(record.damageBonus !== undefined ? { damageBonus: record.damageBonus } : {}),
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
    ...(record.armoryProduct ? [`    armoryProduct: ${JSON.stringify(record.armoryProduct)},`] : []),
    ...(record.weaponProduct ? [`    weaponProduct: ${JSON.stringify(record.weaponProduct)},`] : []),
    "  }",
  ].join("\n");
}

function validateGeneratedEquipmentRecord(input: unknown): GeneratedEquipmentJsonRecord {
  const record = readPlainObject(input, "generated equipment record");
  const asset = readPlainObject(record.asset, "generated equipment asset");
  const equipmentSlot = readEquipmentSlot(record.equipmentSlot);
  const id = readNonEmptyString(record.id, "generated equipment id");
  const name = readNonEmptyString(record.name, "generated equipment name");
  const kind = readGeneratedEquipmentKind(record.kind);
  const armorHp =
    kind === "armor" ? Math.max(0, Math.min(10, Math.floor(readFinitePayloadNumber(record.armorHp, "generated equipment armorHp")))) : undefined;
  const damageBonus =
    kind === "weapon"
      ? Math.max(0, Math.min(10, Math.floor(readFinitePayloadNumber(record.damageBonus, "generated equipment damageBonus"))))
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

  validateGeneratedEquipmentSlot(kind, equipmentSlot);

  return {
    id,
    name,
    kind,
    ...(armorCategory ? { armorCategory } : {}),
    ...(armorHp !== undefined ? { armorHp } : {}),
    ...(damageBonus !== undefined ? { damageBonus } : {}),
    ...(weaponClass ? { weaponClass } : {}),
    equipmentSlot,
    assetKeys,
    equipmentTuning,
    asset: {
      key: assetKey,
      sourcePath,
      ...(lowSourcePath ? { lowSourcePath } : {}),
    },
    ...(record.armoryProduct ? { armoryProduct: validateGeneratedArmoryProduct(record.armoryProduct, id, name) } : {}),
    ...(record.weaponProduct ? { weaponProduct: validateGeneratedWeaponProduct(record.weaponProduct, id, name) } : {}),
  };
}

function validateGeneratedArmoryProduct(input: unknown, itemId: string, itemName: string): GeneratedEquipmentJsonRecord["armoryProduct"] {
  const product = readPlainObject(input, "generated armory product");
  const price = Math.max(0, Math.min(250, Math.floor(readFinitePayloadNumber(product.price, "generated armory product price"))));
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
  const price = Math.max(0, Math.min(250, Math.floor(readFinitePayloadNumber(product.price, "generated weapon product price"))));
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

function readFinitePayloadNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric value: ${label}.`);
  }

  return value;
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

function readWeaponClass(
  value: unknown,
  fallback: NonNullable<GeneratedEquipmentJsonRecord["weaponClass"]> = "sword",
): NonNullable<GeneratedEquipmentJsonRecord["weaponClass"]> {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (value === "sword" || value === "axe" || value === "bow") {
    return value;
  }

  throw new Error("Invalid weapon class.");
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
    sourcePath.startsWith("assets-low/fighters/weapons/");
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
  if (kind === "weapon" && equipmentSlot !== "weaponMain") {
    throw new Error("Promoted weapon item must use weaponMain slot.");
  }

  if (kind === "armor" && equipmentSlot === "weaponMain") {
    throw new Error("Promoted armor item cannot use weaponMain slot.");
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

  return "swords";
}

function getWeaponClassFromText(value: string): NonNullable<GeneratedEquipmentJsonRecord["weaponClass"]> {
  const text = value.toLowerCase();

  if (text.includes("bow")) {
    return "bow";
  }

  if (text.includes("axe")) {
    return "axe";
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
