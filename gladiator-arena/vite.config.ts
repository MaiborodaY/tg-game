import { readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";

const arenaLayoutUrl = new URL("./src/arenaLayout.ts", import.meta.url);
const combatUrl = new URL("./src/combat.ts", import.meta.url);
const debugTuningUrl = new URL("./src/debugTuning.ts", import.meta.url);

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
  DEFAULT_HUD_BOTTOM_OFFSET: "hudBottomOffset",
  DEFAULT_HUD_SIDE_INSET: "hudSideInset",
  DEFAULT_HUD_SCALE: "hudScale",
  DEFAULT_HUD_FLASK_GAP: "hudFlaskGap",
  DEFAULT_HUD_NAME_GAP: "hudNameGap",
  DEFAULT_HUD_SAFE_GAP_RATIO: "hudSafeGapRatio",
  DEFAULT_HUD_SAFE_MIN_GAP: "hudSafeMinGap",
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
  "backGauntlet",
  "frontGauntlet",
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
type SlashArcUpdates = Record<SlashArcAttackKey, SlashArcTuning>;
type ActionButtonOffsetUpdates = Record<ActionButtonOffsetKey, ActionButtonOffsetTuning>;

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
          const rigPartUpdates = pickRigPartDefaultUpdates(payload);
          const facePartUpdates = pickFacePartDefaultUpdates(payload);
          const equipmentUpdates = pickEquipmentDefaultUpdates(payload);
          const slashArcUpdates = pickSlashArcDefaultUpdates(payload);
          const actionButtonOffsetUpdates = pickActionButtonOffsetDefaultUpdates(payload);
          const [layoutSource, combatSource, debugTuningSource] = await Promise.all([
            readFile(arenaLayoutUrl, "utf8"),
            readFile(combatUrl, "utf8"),
            readFile(debugTuningUrl, "utf8"),
          ]);
          const nextLayoutSource = applyProdDefaultUpdates(layoutSource, layoutUpdates);
          const nextCombatSource = applyCombatDefaultUpdates(combatSource, combatUpdates);
          const nextDebugTuningSource = applyDebugTuningDefaultUpdates(
            applySlashArcDefaultUpdates(
              applyEquipmentDefaultUpdates(
                applyFacePartDefaultUpdates(
                  applyRigPartDefaultUpdates(applyActionButtonOffsetDefaultUpdates(debugTuningSource, actionButtonOffsetUpdates), rigPartUpdates),
                  facePartUpdates,
                ),
                equipmentUpdates,
              ),
              slashArcUpdates,
            ),
            debugTuningDefaultUpdates,
          );

          await Promise.all([
            writeFile(arenaLayoutUrl, nextLayoutSource, "utf8"),
            writeFile(combatUrl, nextCombatSource, "utf8"),
            writeFile(debugTuningUrl, nextDebugTuningSource, "utf8"),
          ]);
          server.ws.send({ type: "full-reload" });
          sendJson(response, 200, {
            message: `Saved ${Object.keys(layoutUpdates).length} layout defaults, ${Object.keys(combatUpdates).length} combat defaults, ${Object.keys(debugTuningDefaultUpdates).length} debug defaults, ${Object.keys(actionButtonOffsetUpdates).length} action button offsets, ${Object.keys(rigPartUpdates).length} rig defaults, ${Object.keys(facePartUpdates).length} face defaults, ${Object.keys(equipmentUpdates).length} equipment defaults, and ${Object.keys(slashArcUpdates).length} slash effect defaults to prod.`,
            updated:
              Object.keys(layoutUpdates).length +
              Object.keys(combatUpdates).length +
              Object.keys(debugTuningDefaultUpdates).length +
              Object.keys(actionButtonOffsetUpdates).length +
              Object.keys(rigPartUpdates).length +
              Object.keys(facePartUpdates).length +
              Object.keys(equipmentUpdates).length +
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

function readFiniteNumber(payload: Record<string, unknown>, fieldName: string): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric tuning value: ${String(fieldName)}.`);
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
