import {
  ACTION_BUTTON_OFFSET_KEYS,
  ANIMATION_EDIT_MODES,
  BODY_ANIMATION_KEYS,
  CLASSIC_ACTION_WHEEL_MODES,
  DEFAULT_CLASSIC_ACTION_BUTTON_SLOTS,
  DEFAULT_BODY_ANIMATIONS,
  DEFAULT_EQUIPMENT,
  DEFAULT_EQUIPMENT_ITEM_TUNING,
  debugTuning,
  defaultDebugTuning,
  EQUIPMENT_SLOT_KEYS,
  DEFAULT_SLASH_ARCS,
  defaultFacePartTuning,
  FACE_PART_KEYS,
  isSlashArcAttackKey,
  resetDebugTuning,
  RIG_PART_KEYS,
  SLASH_ARC_ATTACK_KEYS,
  subscribeDebugTuning,
  undoDebugTuning,
  updateDebugTuning,
  type AnimationEditMode,
  type ArenaDebugTuning,
  type BodyAnimationKey,
  type BodyAnimationTuning,
  type ClassicActionButtonSlotTuning,
  type ClassicActionWheelMode,
  type ActionButtonOffsetKey,
  type EquipmentSlotKey,
  type EquipmentTuning,
  type FacePartKey,
  type FacePartTuning,
  type RigPartKey,
  type RigPartTuning,
  type SlashArcAttackKey,
  type SlashArcTuning,
} from "./debugTuning";
import {
  createDefaultHeroInventory,
  ALL_HERO_ITEM_IDS,
  HERO_EQUIPMENT_SLOT_KEYS,
  HERO_ITEM_CATALOG,
  type HeroEquipment,
  type HeroEquipmentSlotKey,
  type HeroInventoryEntry,
  type HeroItemDefinition,
  type HeroItemId,
} from "./hero";
import { AUTO_EQUIPMENT_ITEM_CATALOG, AUTO_EQUIPMENT_ITEM_IDS, AUTO_EQUIPMENT_ITEM_RECORDS } from "./equipmentAssetRegistry";
import { GENERATED_EQUIPMENT_ITEM_RECORDS, GENERATED_EQUIPMENT_ITEM_TUNING } from "./generated/equipmentItems.generated";
import { removePromotedEquipmentItem, saveProdAnimation, saveProdDefaults, savePromotedEquipmentItem } from "./prodDefaultsSaver";

interface DebugPanelOptions {
  heroEquipment?: HeroEquipment;
  heroInventory?: HeroInventoryEntry[];
  onHeroEquipmentChange?: (equipment: HeroEquipment) => void;
  onPreviewSlashArc?: (actionId: SlashArcAttackKey, withBodyAnimation: boolean) => void;
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
type CharacterPreviewControlKey = "characterPreviewScale" | "characterPreviewFeetX" | "characterPreviewFeetY";
type FaceNumericControlKey = keyof FacePartTuning;
type EquipmentNumericControlKey = "x" | "y" | "angle" | "scaleX" | "scaleY";
type EquipmentToggleControlKey = "flipX" | "flipY";
type SlashArcNumericControlKey = Exclude<keyof SlashArcTuning, "color">;
type RigNudgeAction = "left" | "right" | "up" | "down" | "rotateLeft" | "rotateRight" | "scaleDown" | "scaleUp";
type RigLimbKey = "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
type AnimationRigPoseKey = "base" | "breath";
type AnimationFacePoseKey = "faceBase" | "faceBreath";

interface DebugControlGroup {
  title: string;
  controls: DebugControlConfig[];
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

interface CharacterPreviewControlConfig {
  key: CharacterPreviewControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface FaceNumericControlConfig {
  key: FaceNumericControlKey;
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
  taunt: "Taunt",
  rest: "Rest",
};

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
    title: "Fighter shadow",
    controls: [
      { type: "range", key: "shadowOffsetX", label: "Shadow X", min: -240, max: 240, step: 1, resetValue: defaultDebugTuning.shadowOffsetX },
      { type: "range", key: "shadowOffsetY", label: "Shadow Y", min: -240, max: 240, step: 1, resetValue: defaultDebugTuning.shadowOffsetY },
      { type: "range", key: "shadowScaleX", label: "Shadow scale X", min: -4, max: 4, step: 0.01, resetValue: defaultDebugTuning.shadowScaleX },
      { type: "range", key: "shadowScaleY", label: "Shadow scale Y", min: -1, max: 1, step: 0.01, resetValue: defaultDebugTuning.shadowScaleY },
      { type: "range", key: "shadowAlpha", label: "Shadow alpha", min: 0, max: 1, step: 0.01, resetValue: defaultDebugTuning.shadowAlpha },
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
];

const rigNumericControls: RigNumericControlConfig[] = [
  { key: "x", label: "x", min: -480, max: 480, step: 1 },
  { key: "y", label: "y", min: -480, max: 480, step: 1 },
  { key: "angle", label: "angle", min: -180, max: 180, step: 1 },
  { key: "scaleX", label: "scaleX", min: 0.1, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.1, max: 3, step: 0.01 },
];

const rigToggleControls: RigToggleControlConfig[] = [
  { key: "flipX", label: "mirror X" },
  { key: "flipY", label: "mirror Y" },
];

const characterPreviewControls: CharacterPreviewControlConfig[] = [
  { key: "characterPreviewScale", label: "zoom", min: 1, max: 2.6, step: 0.01 },
  { key: "characterPreviewFeetX", label: "feet X", min: 0, max: 430, step: 1 },
  { key: "characterPreviewFeetY", label: "feet Y", min: 560, max: 740, step: 1 },
];

const faceNumericControls: FaceNumericControlConfig[] = [
  { key: "x", label: "x", min: -40, max: 40, step: 0.5 },
  { key: "y", label: "y", min: -40, max: 40, step: 0.5 },
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

let activeNudgeStep = 5;
let activeEquipmentSlot: EquipmentSlotKey = "weaponMain";
let activeEquipmentItemId: HeroItemId | "" = "";
let isDebugUndoShortcutMounted = false;
let debugHeroEquipment: HeroEquipment | undefined;
let debugHeroInventory: HeroInventoryEntry[] = createDefaultHeroInventory();
let notifyHeroEquipmentChange: ((equipment: HeroEquipment) => void) | undefined;
let previewSlashArc: ((actionId: SlashArcAttackKey, withBodyAnimation: boolean) => void) | undefined;
let isSlashPreviewLoopRunning = false;
let slashPreviewTimer: number | undefined;

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
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="city" aria-pressed="false">City</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="arena" aria-pressed="false">Arena</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="hud" aria-pressed="false">HUD</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="effects" aria-pressed="false">Effects</button>
    </nav>
    <details class="debug-rig-panel" open>
      <summary>Rig editor</summary>
      <div class="debug-rig-editor">
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
    <details class="debug-hero-equipment-panel" open>
      <summary>Hero equipment</summary>
      <div class="debug-hero-equipment"></div>
    </details>
    <details class="debug-item-equipment-panel" open>
      <summary>Item equipment</summary>
      <div class="debug-item-equipment">
        <label class="debug-rig-editor__part">
          <span>Slot</span>
          <select class="debug-item-equipment__select"></select>
        </label>
        <label class="debug-rig-editor__part">
          <span>Item</span>
          <select class="debug-item-equipment__item-select"></select>
        </label>
        <div class="debug-item-equipment__controls"></div>
        <div class="debug-rig-editor__actions">
          <button class="debug-panel__reset debug-item-equipment__reset" type="button">Reset selected</button>
        </div>
      </div>
    </details>
    <details class="debug-auto-equipment-panel" open>
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
        <label class="debug-panel__row debug-rig-editor__row">
          <span class="debug-auto-equipment__stat-label">Armor HP</span>
          <input class="debug-panel__range" type="range" min="0" max="10" step="1" value="1" data-auto-equipment-armor />
          <input class="debug-panel__number" type="number" min="0" max="10" step="1" value="1" data-auto-equipment-armor-number />
        </label>
        <label class="debug-panel__row debug-rig-editor__row">
          <span>Price</span>
          <input class="debug-panel__range" type="range" min="0" max="250" step="1" value="0" data-auto-equipment-price />
          <input class="debug-panel__number" type="number" min="0" max="250" step="1" value="0" data-auto-equipment-price-number />
        </label>
        <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
          <span class="debug-auto-equipment__shop-label">Armory</span>
          <input class="debug-auto-equipment__shop" type="checkbox" checked />
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
        <p class="debug-auto-equipment__status" aria-live="polite"></p>
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
    <details class="debug-effects-panel" open>
      <summary>Effects</summary>
      <div class="debug-effects">
        <fieldset class="debug-effects__group">
          <legend>Slash arc</legend>
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
        </fieldset>
      </div>
    </details>
    <div class="debug-panel__prod-actions">
      <button class="debug-panel__reset debug-panel__save-prod" type="button">Save as prod defaults</button>
      <button class="debug-panel__reset debug-panel__save-prod-animation" type="button">Save animation as prod</button>
      <button class="debug-panel__reset debug-panel__reset-all" type="button">Reset all tuning</button>
      <p class="debug-panel__status" aria-live="polite"></p>
    </div>
  `;

  const body = panel.querySelector<HTMLElement>(".debug-panel__body");
  const hudBody = panel.querySelector<HTMLElement>(".debug-panel__hud-body");
  const classicSlotsBody = panel.querySelector<HTMLElement>(".debug-classic-slots");
  const cityBody = panel.querySelector<HTMLElement>(".debug-panel__city-body");
  const effectsBody = panel.querySelector<HTMLElement>(".debug-effects");
  const rigEditor = panel.querySelector<HTMLElement>(".debug-rig-editor");
  const heroEquipmentBody = panel.querySelector<HTMLElement>(".debug-hero-equipment");
  const itemEquipmentBody = panel.querySelector<HTMLElement>(".debug-item-equipment");
  const autoEquipmentBody = panel.querySelector<HTMLElement>(".debug-auto-equipment");
  const saveButton = panel.querySelector<HTMLButtonElement>(".debug-panel__save-prod");
  const saveAnimationButton = panel.querySelector<HTMLButtonElement>(".debug-panel__save-prod-animation");
  const resetButton = panel.querySelector<HTMLButtonElement>(".debug-panel__reset-all");
  const status = panel.querySelector<HTMLElement>(".debug-panel__status");

  if (
    !body ||
    !hudBody ||
    !classicSlotsBody ||
    !cityBody ||
    !effectsBody ||
    !rigEditor ||
    !heroEquipmentBody ||
    !itemEquipmentBody ||
    !autoEquipmentBody ||
    !saveButton ||
    !saveAnimationButton ||
    !resetButton ||
    !status
  ) {
    return;
  }

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
  const nudgeToolbar = createNudgeToolbar();
  const previewTools = createPreviewTools(previewToolbar, nudgeToolbar);
  const previewColumn = document.querySelector<HTMLElement>(".debug-preview-column");

  if (previewColumn) {
    previewColumn.prepend(previewTools);
  } else {
    previewTools.classList.add("debug-preview-tools--inline");
    rigEditor.prepend(previewTools);
  }

  mountPreviewToolbar(previewToolbar);
  mountRigEditor(rigEditor);
  mountEffectsEditor(effectsBody);
  mountHeroEquipmentEditor(heroEquipmentBody);
  mountItemEquipmentEditor(itemEquipmentBody);
  mountAutoEquipmentEditor(autoEquipmentBody);
  mountNudgeToolbar(nudgeToolbar);
  mountModeTabs(panel);

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

  saveAnimationButton.addEventListener("click", async () => {
    saveAnimationButton.disabled = true;
    status.textContent = `Saving prod ${debugTuning.selectedBodyAnimation}...`;

    try {
      status.textContent = await saveProdAnimation(debugTuning);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not save prod animation.";
    } finally {
      saveAnimationButton.disabled = false;
    }
  });

  resetButton.addEventListener("click", () => {
    resetDebugTuning();
    syncDebugTools(panel);
  });

  root.append(panel);
  mountDebugGrid();
  mountDebugUndoShortcut();
  subscribeDebugTuning(() => syncDebugTools(panel));
  syncDebugTools(panel);
}

function configureHeroEquipmentDebug(options: DebugPanelOptions): void {
  debugHeroEquipment = options.heroEquipment ? { ...options.heroEquipment } : undefined;
  debugHeroInventory = options.heroInventory ? cloneHeroInventory(options.heroInventory) : createDefaultHeroInventory();
  notifyHeroEquipmentChange = options.onHeroEquipmentChange;
  previewSlashArc = options.onPreviewSlashArc;
}

function cloneHeroInventory(source: readonly HeroInventoryEntry[]): HeroInventoryEntry[] {
  return source.map((entry) => ({ ...entry }));
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

function createNudgeToolbar(): HTMLElement {
  const toolbar = document.createElement("aside");
  toolbar.className = "debug-nudge-toolbar";
  toolbar.setAttribute("aria-label", "Rig nudge controls");
  toolbar.innerHTML = `
    <fieldset class="debug-nudge-toolbar__group">
      <legend>Nudge</legend>
      <div class="debug-nudge-toolbar__steps" role="group" aria-label="Nudge step">
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-step="1">1</button>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-step="5">5</button>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-step="10">10</button>
      </div>
      <div class="debug-nudge-toolbar__grid" role="group" aria-label="Nudge selected part position">
        <span class="debug-nudge-toolbar__empty"></span>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-action="up">&uarr;</button>
        <span class="debug-nudge-toolbar__empty"></span>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-action="left">&larr;</button>
        <span class="debug-nudge-toolbar__center"></span>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-action="right">&rarr;</button>
        <span class="debug-nudge-toolbar__empty"></span>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-action="down">&darr;</button>
        <span class="debug-nudge-toolbar__empty"></span>
      </div>
      <div class="debug-nudge-toolbar__actions">
        <button class="debug-panel__reset" type="button" data-nudge-action="rotateLeft">Rot -</button>
        <button class="debug-panel__reset" type="button" data-nudge-action="rotateRight">Rot +</button>
      </div>
      <div class="debug-nudge-toolbar__actions">
        <button class="debug-panel__reset" type="button" data-nudge-action="scaleDown">Scl -</button>
        <button class="debug-panel__reset" type="button" data-nudge-action="scaleUp">Scl +</button>
      </div>
    </fieldset>
  `;

  return toolbar;
}

function mountNudgeToolbar(toolbar: HTMLElement): void {
  toolbar.querySelectorAll<HTMLButtonElement>("button[data-nudge-step]").forEach((button) => {
    button.addEventListener("click", () => {
      activeNudgeStep = Number(button.dataset.nudgeStep) || activeNudgeStep;
      syncNudgeControls();
    });
  });

  toolbar.querySelectorAll<HTMLButtonElement>("button[data-nudge-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.nudgeAction;

      if (isRigNudgeAction(action)) {
        nudgeSelectedRigPart(action);
      }
    });
  });
}

type DebugMode = "character" | "city" | "arena" | "hud" | "effects";

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
  document.body.classList.toggle("debug-mode-city", mode === "city");
  document.body.classList.toggle("debug-mode-arena", mode === "arena");
  document.body.classList.toggle("debug-mode-hud", mode === "hud");
  document.body.classList.toggle("debug-mode-effects", mode === "effects");
}

function getDebugModeFromValue(value: string | undefined): DebugMode {
  if (value === "city" || value === "arena" || value === "hud" || value === "effects") {
    return value;
  }

  return "character";
}

function createControlGroup(group: DebugControlGroup): HTMLElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "debug-panel__group";

  const legend = document.createElement("legend");
  legend.textContent = group.title;
  fieldset.append(legend);

  for (const control of group.controls) {
    fieldset.append(createControl(control));
  }

  return fieldset;
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
    <fieldset class="debug-panel__group debug-classic-slots__group">
      <legend>Classic button slots</legend>
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
        <select class="debug-panel__number" data-classic-slot-action>
          ${ACTION_BUTTON_OFFSET_KEYS.map((actionId) => `<option value="${actionId}">${actionButtonLabels[actionId]}</option>`).join("")}
        </select>
        <span></span>
        <span></span>
      </label>
      ${createClassicSlotNumberRow("x", "Slot X", -240, 240, 1)}
      ${createClassicSlotNumberRow("y", "Slot Y", -180, 80, 1)}
      ${createClassicSlotNumberRow("rotation", "Rotate", -180, 180, 1)}
      <button class="debug-panel__reset debug-classic-slots__reset" type="button">Reset selected slot</button>
    </fieldset>
  `;

  const modeSelect = root.querySelector<HTMLSelectElement>("[data-classic-slot-mode]");
  const actionSelect = root.querySelector<HTMLSelectElement>("[data-classic-slot-action]");
  const reset = root.querySelector<HTMLButtonElement>(".debug-classic-slots__reset");

  modeSelect?.addEventListener("change", () => {
    if (isClassicActionWheelMode(modeSelect.value)) {
      updateDebugTuning({ selectedClassicActionWheelMode: modeSelect.value });
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

function mountHeroEquipmentEditor(root: HTMLElement): void {
  root.innerHTML = "";

  HERO_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    root.append(createHeroEquipmentRow(slotKey));
  });
}

function createHeroEquipmentRow(slotKey: HeroEquipmentSlotKey): HTMLElement {
  const row = document.createElement("div");
  row.className = "debug-hero-equipment__row";

  const slot = document.createElement("span");
  slot.className = "debug-hero-equipment__slot";
  slot.textContent = slotKey;

  const select = document.createElement("select");
  select.className = "debug-hero-equipment__select";
  select.dataset.heroEquipmentSlot = slotKey;

  const item = document.createElement("span");
  item.className = "debug-hero-equipment__item";
  item.dataset.heroEquipmentItem = slotKey;

  select.addEventListener("change", () => {
    updateHeroEquipmentSlot(slotKey, getHeroEquipmentSelectItemId(select.value));
  });

  row.append(slot, select, item);

  return row;
}

function mountItemEquipmentEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-item-equipment__select");
  const itemSelect = editor.querySelector<HTMLSelectElement>(".debug-item-equipment__item-select");
  const controls = editor.querySelector<HTMLElement>(".debug-item-equipment__controls");
  const reset = editor.querySelector<HTMLButtonElement>(".debug-item-equipment__reset");

  if (!select || !itemSelect || !controls || !reset) {
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

  select.addEventListener("change", () => {
    if (isEquipmentSlotKey(select.value)) {
      activeEquipmentSlot = select.value;
      activeEquipmentItemId = "";
      const panel = editor.closest(".debug-panel") as HTMLElement | null;

      syncEquipmentEditor(panel ?? editor);
    }
  });

  itemSelect.addEventListener("change", () => {
    const definition = getDebugHeroItemDefinition(itemSelect.value);

    activeEquipmentItemId = definition?.id ?? "";

    if (definition && isEquipmentSlotKey(definition.equipmentSlot)) {
      activeEquipmentSlot = definition.equipmentSlot;
      updateHeroEquipmentSlot(definition.equipmentSlot, definition.id);
    }

    const panel = editor.closest(".debug-panel") as HTMLElement | null;

    syncEquipmentEditor(panel ?? editor);
  });

  reset.addEventListener("click", () => {
    resetActiveEquipmentTuning();
  });
}

function mountAutoEquipmentEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__select");
  const nameInput = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__name");
  const statLabel = editor.querySelector<HTMLElement>(".debug-auto-equipment__stat-label");
  const armorRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor]");
  const armorNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor-number]");
  const priceRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price]");
  const priceNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price-number]");
  const addToShop = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__shop");
  const shopLabel = editor.querySelector<HTMLElement>(".debug-auto-equipment__shop-label");
  const transformControls = editor.querySelector<HTMLElement>(".debug-auto-equipment__transform-controls");
  const resetTransform = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__reset-transform");
  const preview = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__preview");
  const promote = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__promote");
  const generatedSelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__generated-select");
  const removeGenerated = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__remove");
  const status = editor.querySelector<HTMLElement>(".debug-auto-equipment__status");

  if (
    !select ||
    !nameInput ||
    !statLabel ||
    !armorRange ||
    !armorNumber ||
    !priceRange ||
    !priceNumber ||
    !addToShop ||
    !shopLabel ||
    !transformControls ||
    !resetTransform ||
    !preview ||
    !promote ||
    !generatedSelect ||
    !removeGenerated ||
    !status
  ) {
    return;
  }

  AUTO_EQUIPMENT_ITEM_RECORDS.forEach((record) => {
    const option = document.createElement("option");

    option.value = record.item.id;
    option.textContent = record.item.name;
    select.append(option);
  });

  GENERATED_EQUIPMENT_ITEM_RECORDS.forEach((record) => {
    const option = document.createElement("option");

    option.value = record.item.id;
    option.textContent = record.item.name;
    generatedSelect.append(option);
  });

  equipmentNumericControls.forEach((control) => transformControls.append(createEquipmentRangeControl(control)));
  equipmentToggleControls.forEach((control) => transformControls.append(createEquipmentToggleControl(control)));
  syncAutoEquipmentStatInputs(editor);

  syncAutoEquipmentEditor(editor);

  select.addEventListener("change", () => {
    syncAutoEquipmentStatInputs(editor);
    previewSelectedAutoEquipment(editor);
    syncAutoEquipmentEditor(editor);
  });

  syncLinkedNumberInputs(armorRange, armorNumber, 0, 10);
  syncLinkedNumberInputs(priceRange, priceNumber, 0, 250);

  preview.addEventListener("click", () => {
    const record = getSelectedAutoEquipmentRecord(select.value);

    if (!record) {
      status.textContent = "No auto equipment asset selected.";
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
      status.textContent = await savePromotedEquipmentItem({
        name: nameInput.value.trim() || record.item.name.replace(/\s+\(Auto\)$/u, ""),
        armorHp: clampNumber(Number(armorNumber.value), 0, 10),
        damageBonus: clampNumber(Number(armorNumber.value), 0, 10),
        price: clampNumber(Number(priceNumber.value), 0, 250),
        addToShop: addToShop.checked,
        item: record.item,
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
    const record = getSelectedGeneratedEquipmentRecord(generatedSelect.value);

    if (!record) {
      status.textContent = "No generated item selected.";
      return;
    }

    if (!window.confirm(`Remove ${record.item.name}? This deletes the generated item and its asset files.`)) {
      return;
    }

    removeGenerated.disabled = true;
    status.textContent = "Removing generated item...";

    try {
      status.textContent = await removePromotedEquipmentItem(record.item.id);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not remove generated equipment.";
    } finally {
      removeGenerated.disabled = false;
    }
  });
}

function mountRigEditor(editor: HTMLElement): void {
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
  const animationModeButtons = [...editor.querySelectorAll<HTMLButtonElement>("button[data-animation-edit-mode]")];
  const copyPoseAToB = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-pose-a-to-b");
  const animationEnabled = editor.querySelector<HTMLInputElement>("input[data-animation-enabled]");
  const animationDuration = editor.querySelector<HTMLInputElement>("input[data-animation-duration]");
  const animationDurationNumber = editor.querySelector<HTMLInputElement>("input[data-animation-duration-number]");
  const animationParts = editor.querySelector<HTMLElement>("[data-animation-parts]");
  const idleAllParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-all");
  const idleNoParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-none");

  if (
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

  select.addEventListener("change", () => {
    const selectedRigPart = select.value as RigPartKey;

    updateDebugTuning({ selectedRigPart, selectedRigParts: [selectedRigPart] }, { undoable: false });
  });

  reset.addEventListener("click", () => {
    resetSelectedRigPart();
  });

  resetAllParts.addEventListener("click", () => {
    resetAllRigParts();
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
    const rigParts = getEditableRigParts();

    if (!oppositePart || !rigParts) {
      return;
    }

    updateRigPartTuning(selectedPart, { ...rigParts[oppositePart] });
  });

  animationSelect.addEventListener("change", () => {
    updateDebugTuning({
      selectedBodyAnimation: isBodyAnimationKey(animationSelect.value) ? animationSelect.value : "idle",
    }, { undoable: false });
  });

  animationModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.animationEditMode;

      if (isAnimationEditMode(mode)) {
        updateDebugTuning({ animationEditMode: mode }, { undoable: false });
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

function mountEffectsEditor(editor: HTMLElement): void {
  const slashSelect = editor.querySelector<HTMLSelectElement>(".debug-effects__slash-select");
  const slashControls = editor.querySelector<HTMLElement>(".debug-effects__slash-controls");
  const start = editor.querySelector<HTMLButtonElement>(".debug-effects__start");
  const stop = editor.querySelector<HTMLButtonElement>(".debug-effects__stop");
  const resetSlash = editor.querySelector<HTMLButtonElement>(".debug-effects__reset-slash");

  if (!slashSelect || !slashControls || !start || !stop || !resetSlash) {
    return;
  }

  SLASH_ARC_ATTACK_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    slashSelect.append(option);
  });

  slashArcNumericControls.forEach((control) => slashControls.append(createSlashArcRangeControl(control)));

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
  const animation = debugTuning.bodyAnimations[actionId] ?? DEFAULT_BODY_ANIMATIONS[actionId];

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
        rotateRigLimb(limbKey, activeNudgeStep * direction);
      }
    });
  });

  return row;
}

function createCharacterPreviewRangeControl(control: CharacterPreviewControlConfig): HTMLElement {
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
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateActiveEquipmentTuning({ [control.key]: clampEquipmentNumericValue(control.key, Number(range.value)) } as Partial<EquipmentTuning>);
  });

  number?.addEventListener("input", () => {
    updateActiveEquipmentTuning({ [control.key]: clampEquipmentNumericValue(control.key, Number(number.value)) } as Partial<EquipmentTuning>);
  });

  return row;
}

function createEquipmentToggleControl(control: EquipmentToggleControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-panel__row--toggle debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input type="checkbox" data-equipment-toggle-key="${control.key}" />
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    updateActiveEquipmentTuning({ [control.key]: input.checked } as Partial<EquipmentTuning>);
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
    ...(DEFAULT_EQUIPMENT_ITEM_TUNING[itemId] ?? GENERATED_EQUIPMENT_ITEM_TUNING[itemId] ?? DEFAULT_EQUIPMENT[slotKey]),
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
  const actionId = debugTuning.selectedClassicActionButton;
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

function updateHeroEquipmentSlot(slotKey: HeroEquipmentSlotKey, itemId: HeroItemId | null): void {
  if (!debugHeroEquipment) {
    return;
  }

  const nextEquipment: HeroEquipment = {
    ...debugHeroEquipment,
    [slotKey]: itemId,
  };

  debugHeroEquipment = nextEquipment;
  notifyHeroEquipmentChange?.({ ...nextEquipment });

  const panel = document.querySelector<HTMLElement>(".debug-panel");

  if (panel) {
    syncHeroEquipmentEditor(panel);
  }
}

function updateRigNumericTuning(key: RigNumericControlKey, value: number): void {
  updateRigPartTuning(debugTuning.selectedRigPart, { [key]: clampRigNumericValue(key, value) } as Partial<RigPartTuning>);
}

function updateRigToggleTuning(key: RigToggleControlKey, value: boolean): void {
  updateRigPartTuning(debugTuning.selectedRigPart, { [key]: value } as Partial<RigPartTuning>);
}

function nudgeSelectedRigPart(action: RigNudgeAction): void {
  const step = activeNudgeStep;

  if (action === "left") {
    updateSelectedRigPart((current) => ({ x: clampRigNumericValue("x", current.x - step) }));
    return;
  }

  if (action === "right") {
    updateSelectedRigPart((current) => ({ x: clampRigNumericValue("x", current.x + step) }));
    return;
  }

  if (action === "up") {
    updateSelectedRigPart((current) => ({ y: clampRigNumericValue("y", current.y - step) }));
    return;
  }

  if (action === "down") {
    updateSelectedRigPart((current) => ({ y: clampRigNumericValue("y", current.y + step) }));
    return;
  }

  if (action === "rotateLeft") {
    updateSelectedRigPart((current) => ({ angle: clampRigNumericValue("angle", current.angle - step) }));
    return;
  }

  if (action === "rotateRight") {
    updateSelectedRigPart((current) => ({ angle: clampRigNumericValue("angle", current.angle + step) }));
    return;
  }

  const scaleDelta = step / 100;

  if (action === "scaleDown") {
    updateSelectedRigPart((current) => ({
      scaleX: clampRigNumericValue("scaleX", current.scaleX - scaleDelta),
      scaleY: clampRigNumericValue("scaleY", current.scaleY - scaleDelta),
    }));
    return;
  }

  updateSelectedRigPart((current) => ({
    scaleX: clampRigNumericValue("scaleX", current.scaleX + scaleDelta),
    scaleY: clampRigNumericValue("scaleY", current.scaleY + scaleDelta),
  }));
}

function updateSelectedRigPart(getPatch: (current: RigPartTuning, partKey: RigPartKey) => Partial<RigPartTuning>): void {
  const rigParts = getEditableRigParts();

  if (!rigParts) {
    return;
  }

  const nextRigParts = { ...rigParts };

  getSelectedRigPartsForBulkAction().forEach((partKey) => {
    const current = rigParts[partKey];

    nextRigParts[partKey] = {
      ...current,
      ...getPatch(current, partKey),
    };
  });

  updateEditableRigParts(nextRigParts);
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

function getEditableRigParts(): Record<RigPartKey, RigPartTuning> | undefined {
  const poseKey = getActiveAnimationRigPoseKey();

  if (!poseKey) {
    return undefined;
  }

  return getSelectedBodyAnimation()[poseKey];
}

function getEditableFaceParts(): Record<FacePartKey, FacePartTuning> | undefined {
  const poseKey = getActiveAnimationFacePoseKey();

  if (!poseKey) {
    return undefined;
  }

  return getSelectedBodyAnimation()[poseKey];
}

function updateEditableRigParts(nextRigParts: Record<RigPartKey, RigPartTuning>): void {
  const poseKey = getActiveAnimationRigPoseKey();

  if (!poseKey) {
    return;
  }

  updateSelectedBodyAnimation({ [poseKey]: nextRigParts } as Partial<BodyAnimationTuning>);
}

function updateEditableFaceParts(nextFaceParts: Record<FacePartKey, FacePartTuning>): void {
  const poseKey = getActiveAnimationFacePoseKey();

  if (!poseKey) {
    return;
  }

  updateSelectedBodyAnimation({ [poseKey]: nextFaceParts } as Partial<BodyAnimationTuning>);
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

function isRigNudgeAction(value: string | undefined): value is RigNudgeAction {
  return (
    value === "left" ||
    value === "right" ||
    value === "up" ||
    value === "down" ||
    value === "rotateLeft" ||
    value === "rotateRight" ||
    value === "scaleDown" ||
    value === "scaleUp"
  );
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

function isEquipmentSlotKey(value: string | undefined): value is EquipmentSlotKey {
  return typeof value === "string" && EQUIPMENT_SLOT_KEYS.includes(value as EquipmentSlotKey);
}

function isHeroEquipmentSlotKey(value: string | undefined): value is HeroEquipmentSlotKey {
  return typeof value === "string" && HERO_EQUIPMENT_SLOT_KEYS.includes(value as HeroEquipmentSlotKey);
}

function isHeroItemId(value: string | undefined): value is HeroItemId {
  return typeof value === "string" && Boolean(getDebugHeroItemDefinition(value));
}

function getHeroEquipmentSelectItemId(value: string): HeroItemId | null {
  return isHeroItemId(value) ? value : null;
}

function getInventoryItemIdsForSlot(slotKey: HeroEquipmentSlotKey): HeroItemId[] {
  const itemIds = getDebugItemIdsForSlot(slotKey);
  const inventoryItemIds = debugHeroInventory.flatMap((entry) => {
    if (entry.quantity <= 0 || !isHeroItemId(entry.itemId)) {
      return [];
    }

    return getDebugHeroItemDefinition(entry.itemId)?.equipmentSlot === slotKey ? [entry.itemId] : [];
  });

  itemIds.push(...inventoryItemIds);
  const equippedItemId = debugHeroEquipment?.[slotKey];

  if (equippedItemId && getDebugHeroItemDefinition(equippedItemId)?.equipmentSlot === slotKey) {
    itemIds.push(equippedItemId);
  }

  return [...new Set(itemIds)];
}

function getDebugItemIdsForSlot(slotKey: EquipmentSlotKey): HeroItemId[] {
  return [...ALL_HERO_ITEM_IDS, ...AUTO_EQUIPMENT_ITEM_IDS].filter((itemId) => getDebugHeroItemDefinition(itemId)?.equipmentSlot === slotKey);
}

function getDebugHeroItemDefinition(itemId: string | null | undefined): HeroItemDefinition | undefined {
  if (!itemId) {
    return undefined;
  }

  return HERO_ITEM_CATALOG[itemId] ?? AUTO_EQUIPMENT_ITEM_CATALOG[itemId];
}

function getInventoryItemQuantity(itemId: HeroItemId): number {
  return debugHeroInventory.reduce((quantity, entry) => (entry.itemId === itemId ? quantity + entry.quantity : quantity), 0);
}

function clampRigNumericValue(key: RigNumericControlKey, value: number): number {
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

function clampEquipmentNumericValue(key: EquipmentNumericControlKey, value: number): number {
  if (key === "angle") {
    return clampNumber(value, -180, 180);
  }

  if (key === "scaleX" || key === "scaleY") {
    return clampNumber(value, 0.1, 3);
  }

  return clampNumber(value, -240, 240);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

  updateSelectedBodyAnimation({
    breath: cloneRigParts(animation.base),
    faceBreath: cloneFaceParts(animation.faceBase),
  });
}

function cloneRigParts(source: Record<RigPartKey, RigPartTuning>): Record<RigPartKey, RigPartTuning> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<RigPartKey, RigPartTuning>;
}

function cloneFaceParts(source: Record<FacePartKey, FacePartTuning>): Record<FacePartKey, FacePartTuning> {
  return Object.fromEntries(FACE_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<FacePartKey, FacePartTuning>;
}

function updateSelectedBodyAnimation(patch: Partial<BodyAnimationTuning>): void {
  const key = debugTuning.selectedBodyAnimation;
  const animation = getSelectedBodyAnimation();

  updateDebugTuning({
    bodyAnimations: {
      ...debugTuning.bodyAnimations,
      [key]: {
        ...animation,
        ...patch,
      },
    },
  });
}

function getSelectedBodyAnimation(): BodyAnimationTuning {
  return debugTuning.bodyAnimations[debugTuning.selectedBodyAnimation] ?? debugTuning.bodyAnimations.idle;
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
  syncRigEditor(panel);
  syncFaceEditor(panel);
  syncEquipmentEditor(panel);
  syncEffectsEditor(panel);
  syncClassicActionButtonEditor(panel);
  syncHeroEquipmentEditor(panel);
  syncAnimationEditor(panel);
  syncNudgeControls();
  syncGrid();
}

function syncHeroEquipmentEditor(panel: HTMLElement): void {
  const fieldset = panel.querySelector<HTMLElement>(".debug-hero-equipment-panel");

  if (fieldset) {
    fieldset.hidden = !debugHeroEquipment;
  }

  if (!debugHeroEquipment) {
    return;
  }

  panel.querySelectorAll<HTMLSelectElement>("select[data-hero-equipment-slot]").forEach((select) => {
    const slotKey = select.dataset.heroEquipmentSlot;

    if (!isHeroEquipmentSlotKey(slotKey)) {
      return;
    }

    const currentItemId = debugHeroEquipment?.[slotKey] ?? null;
    const inventoryItemIds = getInventoryItemIdsForSlot(slotKey);

    select.replaceChildren(createHeroEquipmentOption("", "empty"));

    inventoryItemIds.forEach((itemId) => {
      const definition = getDebugHeroItemDefinition(itemId);

      if (!definition) {
        return;
      }

      const quantity = getInventoryItemQuantity(itemId);
      const label = quantity > 1 ? `${definition.name} x${quantity}` : definition.name;

      select.append(createHeroEquipmentOption(itemId, label));
    });

    select.value = currentItemId ?? "";
    select.disabled = inventoryItemIds.length === 0 && !currentItemId;
  });

  panel.querySelectorAll<HTMLElement>("[data-hero-equipment-item]").forEach((item) => {
    const slotKey = item.dataset.heroEquipmentItem;

    if (!isHeroEquipmentSlotKey(slotKey)) {
      return;
    }

    const itemId = debugHeroEquipment?.[slotKey];
    const definition = getDebugHeroItemDefinition(itemId);

    item.textContent = definition ? definition.id : "empty";
  });
}

function syncAutoEquipmentEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__select");
  const nameInput = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__name");
  const statLabel = editor.querySelector<HTMLElement>(".debug-auto-equipment__stat-label");
  const armorRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor]");
  const armorNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor-number]");
  const priceRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price]");
  const priceNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-price-number]");
  const addToShop = editor.querySelector<HTMLInputElement>(".debug-auto-equipment__shop");
  const shopLabel = editor.querySelector<HTMLElement>(".debug-auto-equipment__shop-label");
  const buttons = editor.querySelectorAll<HTMLButtonElement>(".debug-auto-equipment__preview, .debug-auto-equipment__promote");
  const generatedSelect = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__generated-select");
  const removeGenerated = editor.querySelector<HTMLButtonElement>(".debug-auto-equipment__remove");
  const status = editor.querySelector<HTMLElement>(".debug-auto-equipment__status");
  const record = getSelectedAutoEquipmentRecord(select?.value);
  const isAvailable = Boolean(record);
  const hasGeneratedItems = GENERATED_EQUIPMENT_ITEM_RECORDS.length > 0;

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

  if (statLabel) {
    statLabel.textContent = record?.item.kind === "weapon" ? "Damage" : "Armor HP";
  }

  if (shopLabel) {
    shopLabel.textContent = record?.item.kind === "weapon" ? "Weapon shop" : "Armory";
  }

  [armorRange, armorNumber, priceRange, priceNumber, addToShop].forEach((input) => {
    if (input) {
      input.disabled = !isAvailable;
    }
  });

  buttons.forEach((button) => {
    button.disabled = !isAvailable;
  });

  if (generatedSelect) {
    generatedSelect.disabled = !hasGeneratedItems;
  }

  if (removeGenerated) {
    removeGenerated.disabled = !hasGeneratedItems;
  }

  if (status) {
    status.textContent = isAvailable ? `${record?.asset.sourcePath ?? ""}` : "No unpromoted equipment assets found.";
  }
}

function syncAutoEquipmentStatInputs(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__select");
  const armorRange = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor]");
  const armorNumber = editor.querySelector<HTMLInputElement>("input[data-auto-equipment-armor-number]");
  const record = getSelectedAutoEquipmentRecord(select?.value);

  if (!armorRange || !armorNumber || !record) {
    return;
  }

  const value = record.item.kind === "weapon" ? (record.item.damageBonus ?? 1) : (record.item.armorHp ?? 1);

  armorRange.value = `${value}`;
  armorNumber.value = `${value}`;
}

function previewSelectedAutoEquipment(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-auto-equipment__select");
  const record = getSelectedAutoEquipmentRecord(select?.value);

  if (record) {
    previewAutoEquipmentRecord(record);
  }
}

function previewAutoEquipmentRecord(record: (typeof AUTO_EQUIPMENT_ITEM_RECORDS)[number]): void {
  if (isEquipmentSlotKey(record.item.equipmentSlot)) {
    activeEquipmentSlot = record.item.equipmentSlot;
    activeEquipmentItemId = record.item.id;
  }

  updateHeroEquipmentSlot(record.item.equipmentSlot, record.item.id);
}

function getSelectedAutoEquipmentRecord(itemId: string | undefined): (typeof AUTO_EQUIPMENT_ITEM_RECORDS)[number] | undefined {
  return AUTO_EQUIPMENT_ITEM_RECORDS.find((record) => record.item.id === itemId);
}

function getSelectedGeneratedEquipmentRecord(itemId: string | undefined): (typeof GENERATED_EQUIPMENT_ITEM_RECORDS)[number] | undefined {
  return GENERATED_EQUIPMENT_ITEM_RECORDS.find((record) => record.item.id === itemId);
}

function getCurrentEquipmentSlotTuning(slotKey: EquipmentSlotKey): EquipmentTuning {
  return { ...(debugTuning.equipment[slotKey] ?? DEFAULT_EQUIPMENT[slotKey]) };
}

function getCurrentEquipmentItemTuning(itemId: HeroItemId, slotKey: EquipmentSlotKey): EquipmentTuning {
  return {
    ...(
      debugTuning.equipmentItems[itemId] ??
      DEFAULT_EQUIPMENT_ITEM_TUNING[itemId] ??
      GENERATED_EQUIPMENT_ITEM_TUNING[itemId] ??
      debugTuning.equipment[slotKey] ??
      DEFAULT_EQUIPMENT[slotKey]
    ),
  };
}

function syncLinkedNumberInputs(range: HTMLInputElement, number: HTMLInputElement, min: number, max: number): void {
  const syncFromRange = (): void => {
    const value = clampNumber(Number(range.value), min, max);

    range.value = `${value}`;
    number.value = `${value}`;
  };
  const syncFromNumber = (): void => {
    const value = clampNumber(Number(number.value), min, max);

    range.value = `${value}`;
    number.value = `${value}`;
  };

  range.addEventListener("input", syncFromRange);
  number.addEventListener("input", syncFromNumber);
}

function createHeroEquipmentOption(value: string, label: string): HTMLOptionElement {
  const option = document.createElement("option");

  option.value = value;
  option.textContent = label;

  return option;
}

function syncModeTabs(panel: HTMLElement): void {
  const mode: DebugMode = document.body.classList.contains("debug-mode-arena")
    ? "arena"
    : document.body.classList.contains("debug-mode-hud")
      ? "hud"
      : document.body.classList.contains("debug-mode-city")
        ? "city"
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
  const slot = debugTuning.classicActionButtonSlots[debugTuning.selectedClassicActionWheelMode][debugTuning.selectedClassicActionButton];

  if (modeSelect) {
    modeSelect.value = debugTuning.selectedClassicActionWheelMode;
  }

  if (actionSelect) {
    actionSelect.value = debugTuning.selectedClassicActionButton;
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
  const copyOpposite = panel.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-opposite");
  const reset = panel.querySelector<HTMLButtonElement>(".debug-rig-editor__reset");
  const selectedPart = debugTuning.selectedRigPart;
  const rigParts = getEditableRigParts();
  const isEditable = Boolean(rigParts);
  const selectedTuning = (rigParts ?? debugTuning.rigParts)[selectedPart];

  if (!select || !selectedTuning) {
    return;
  }

  select.value = selectedPart;

  if (reset) {
    reset.disabled = !isEditable;
    reset.textContent = "Reset selected";
  }

  if (copyOpposite) {
    const oppositePart = oppositeRigPartMap[selectedPart];

    copyOpposite.disabled = !oppositePart || !isEditable;
    copyOpposite.textContent = oppositePart ? `Copy ${oppositePart}` : "No opposite";
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-rig-key]").forEach((input) => {
    const key = input.dataset.rigKey as RigNumericControlKey;

    input.value = `${selectedTuning[key]}`;
    input.disabled = !isEditable;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-rig-number-key]").forEach((input) => {
    const key = input.dataset.rigNumberKey as RigNumericControlKey;
    const value = selectedTuning[key];

    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
    input.disabled = !isEditable;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-rig-toggle-key]").forEach((input) => {
    const key = input.dataset.rigToggleKey as RigToggleControlKey;

    input.checked = selectedTuning[key];
    input.disabled = !isEditable;
  });
}

function syncFaceEditor(panel: HTMLElement): void {
  const faceEditor = panel.querySelector<HTMLElement>(".debug-rig-editor__face");
  const faceParts = getEditableFaceParts();
  const isEditable = Boolean(faceParts);

  if (faceEditor) {
    faceEditor.hidden = debugTuning.selectedRigPart !== "head";
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-face-key]").forEach((input) => {
    const partKey = input.dataset.facePart;
    const key = input.dataset.faceKey as FaceNumericControlKey;

    if (!isFacePartKey(partKey)) {
      return;
    }

    input.value = `${(faceParts ?? debugTuning.faceParts)[partKey][key]}`;
    input.disabled = !isEditable;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-face-number-key]").forEach((input) => {
    const partKey = input.dataset.facePart;
    const key = input.dataset.faceNumberKey as FaceNumericControlKey;

    if (!isFacePartKey(partKey)) {
      return;
    }

    const value = (faceParts ?? debugTuning.faceParts)[partKey][key];
    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
    input.disabled = !isEditable;
  });
}

function syncEquipmentEditor(panel: HTMLElement): void {
  const equipmentSelect = panel.querySelector<HTMLSelectElement>(".debug-item-equipment__select");
  const itemSelect = panel.querySelector<HTMLSelectElement>(".debug-item-equipment__item-select");
  const activeItemDefinition = getDebugHeroItemDefinition(activeEquipmentItemId);

  if (activeItemDefinition?.equipmentSlot !== activeEquipmentSlot) {
    activeEquipmentItemId = "";
  }

  const selectedEquipment = activeEquipmentItemId
    ? getCurrentEquipmentItemTuning(activeEquipmentItemId, activeEquipmentSlot)
    : getCurrentEquipmentSlotTuning(activeEquipmentSlot);

  if (equipmentSelect) {
    equipmentSelect.value = activeEquipmentSlot;
  }

  if (itemSelect) {
    itemSelect.replaceChildren(createHeroEquipmentOption("", "slot fallback"));

    getDebugItemIdsForSlot(activeEquipmentSlot).forEach((itemId) => {
      const definition = getDebugHeroItemDefinition(itemId);

      if (!definition) {
        return;
      }

      itemSelect.append(createHeroEquipmentOption(itemId, definition.name));
    });

    itemSelect.value = activeEquipmentItemId;
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
  const animationSelect = panel.querySelector<HTMLSelectElement>(".debug-rig-editor__animation-select");
  const enabled = panel.querySelector<HTMLInputElement>("input[data-animation-enabled]");
  const duration = panel.querySelector<HTMLInputElement>("input[data-animation-duration]");
  const durationNumber = panel.querySelector<HTMLInputElement>("input[data-animation-duration-number]");

  if (animationSelect) {
    animationSelect.value = debugTuning.selectedBodyAnimation;
  }

  if (enabled) {
    enabled.checked = animation.enabled;
  }

  if (duration) {
    duration.value = `${animation.duration}`;
  }

  if (durationNumber) {
    durationNumber.value = `${animation.duration}`;
  }

  document.querySelectorAll<HTMLButtonElement>("button[data-animation-edit-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", `${button.dataset.animationEditMode === debugTuning.animationEditMode}`);
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-animation-part-key]").forEach((input) => {
    const partKey = input.dataset.animationPartKey as RigPartKey;

    input.checked = animation.activeParts[partKey];
  });
}

function syncNudgeControls(): void {
  document.querySelectorAll<HTMLButtonElement>("button[data-nudge-step]").forEach((button) => {
    button.setAttribute("aria-pressed", `${Number(button.dataset.nudgeStep) === activeNudgeStep}`);
  });
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
