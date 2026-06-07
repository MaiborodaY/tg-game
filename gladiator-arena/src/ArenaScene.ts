import Phaser from "phaser";
import {
  ARENA_WORLD_LEFT,
  ARENA_WORLD_WIDTH,
  DEFAULT_ENEMY_STAGE_X,
  DEFAULT_PLAYER_STAGE_X,
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
  FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY,
  FIGHTER_BACK_BOOT_LIGHT_ASSET_URL,
  FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY,
  FIGHTER_BACK_FOOT_LIGHT_ASSET_URL,
  FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY,
  FIGHTER_BACK_FOREARM_LIGHT_ASSET_URL,
  FIGHTER_BACK_GAUNTLET_LIGHT_ASSET_KEY,
  FIGHTER_BACK_GAUNTLET_LIGHT_ASSET_URL,
  FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_BACK_GREAVE_LIGHT_ASSET_URL,
  FIGHTER_BACK_HAND_LIGHT_ASSET_KEY,
  FIGHTER_BACK_HAND_LIGHT_ASSET_URL,
  FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_URL,
  FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_URL,
  FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY,
  FIGHTER_BREASTPLATE_LIGHT_ASSET_URL,
  FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHIN_LIGHT_ASSET_URL,
  FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY,
  FIGHTER_BACK_THIGH_LIGHT_ASSET_URL,
  FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY,
  FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_URL,
  FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_FOOT_LIGHT_ASSET_URL,
  FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_FOREARM_LIGHT_ASSET_URL,
  FIGHTER_FRONT_GAUNTLET_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_GAUNTLET_LIGHT_ASSET_URL,
  FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_BOOT_LIGHT_ASSET_URL,
  FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_GREAVE_LIGHT_ASSET_URL,
  FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_HAND_LIGHT_ASSET_URL,
  FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_URL,
  FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_URL,
  FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHIN_LIGHT_ASSET_URL,
  FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_THIGH_LIGHT_ASSET_URL,
  FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_URL,
  FIGHTER_HELMET_LIGHT_ASSET_KEY,
  FIGHTER_HELMET_LIGHT_ASSET_URL,
  FIGHTER_HEAD_LIGHT_ASSET_KEY,
  FIGHTER_HEAD_LIGHT_ASSET_URL,
  FIGHTER_TORSO_LIGHT_ASSET_KEY,
  FIGHTER_TORSO_LIGHT_ASSET_URL,
  FIGHTER_WEAPON_SWORD_01_ASSET_KEY,
  FIGHTER_WEAPON_SWORD_01_ASSET_URL,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_AVATAR_FEET_Y_OFFSET,
} from "./assets";
import { getCameraTarget } from "./arenaCamera";
import { getFighterMaxArmor, getFighterMaxHp, getFighterMaxStamina, type ActionId, type CombatState, type FighterState } from "./combat";
import {
  createDefaultHeroEquipment,
  DEFAULT_ENEMY_VISUAL_PRESET,
  HERO_EQUIPMENT_SLOT_KEYS,
  type HeroEquipment,
  type HeroEquipmentSlotKey,
  type HeroItemId,
} from "./hero";
import {
  beginDebugUndoGroup,
  debugTuning,
  DEFAULT_BODY_ANIMATIONS,
  DEFAULT_EQUIPMENT,
  DEFAULT_FACE_PARTS,
  DEFAULT_RIG_PARTS,
  DEFAULT_SLASH_ARCS,
  defaultRigPartTuning,
  endDebugUndoGroup,
  RIG_PART_KEYS,
  subscribeDebugTuning,
  updateDebugTuning,
  type BodyAnimationKey,
  type BodyAnimationTuning,
  type EquipmentSlotKey,
  type EquipmentTuning,
  type FacePartTuning,
  type RigPartKey,
  type RigPartTuning,
  type SlashArcAttackKey,
  type SlashArcTuning,
} from "./debugTuning";
import { arenaProfiler } from "./profiler";
import { getStageLayout } from "./stageLayout";

type FighterPart = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  setAlpha: (alpha: number) => FighterPart;
  setVisible: (visible: boolean) => FighterPart;
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
  name: FighterPart;
  extraParts?: FighterPart[];
  movableParts?: FighterPart[];
  animatedParts?: FighterPart[];
  paperDollRig?: PaperDollRig;
  debugScale: number;
  bodyAnimationLockedUntil?: number;
  isShattered?: boolean;
  isShatterScheduled?: boolean;
}

type PaperDollPartKey = RigPartKey;
type AnimationRigPoseKey = "base" | "breath";
type AttackBodyAnimationKey = SlashArcAttackKey;

interface DebugRigPartDragState {
  partKeys: RigPartKey[];
  lastPointerX: number;
  lastPointerY: number;
}

interface DebugInputEvent {
  stopPropagation: () => void;
}

type DebugRigPartPickHandler = (partKey: RigPartKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent) => void;

interface PaperDollRig {
  root: FighterPart;
  parts: Record<PaperDollPartKey, FighterPart>;
  equipment: PaperDollEquipment;
  equipmentState?: HeroEquipment;
  faceParts: PaperDollFaceParts;
  appearance: PaperDollAppearance;
  selectionHighlights: Record<PaperDollPartKey, Phaser.GameObjects.Graphics>;
  usesPlayerEquipment: boolean;
  shadow?: PaperDollShadowRig;
}

interface PaperDollShadowRig {
  root: FighterPart;
  parts: Record<PaperDollPartKey, FighterPart>;
  equipment: PaperDollEquipment;
  faceParts: PaperDollFaceParts;
}

interface PaperDollEquipment {
  weaponMain?: FighterPart;
  helmet?: FighterPart;
  breastplate?: FighterPart;
  backShoulderguard?: FighterPart;
  frontShoulderguard?: FighterPart;
  backGauntlet?: FighterPart;
  frontGauntlet?: FighterPart;
  backGreave?: FighterPart;
  frontGreave?: FighterPart;
  backShinguard?: FighterPart;
  frontShinguard?: FighterPart;
  backBoot?: FighterPart;
  frontBoot?: FighterPart;
}

interface PaperDollFaceParts {
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
  backGauntletAssetKey?: string;
  frontGauntletAssetKey?: string;
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
}

type PaperDollEquipmentSlotKey = HeroEquipmentSlotKey;

type PaperDollEquipmentAssetKeys = Pick<
  PaperDollFighterOptions,
  | "weaponMainAssetKey"
  | "helmetAssetKey"
  | "breastplateAssetKey"
  | "backShoulderguardAssetKey"
  | "frontShoulderguardAssetKey"
  | "backGauntletAssetKey"
  | "frontGauntletAssetKey"
  | "backGreaveAssetKey"
  | "frontGreaveAssetKey"
  | "backShinguardAssetKey"
  | "frontShinguardAssetKey"
  | "backBootAssetKey"
  | "frontBootAssetKey"
>;

type PaperDollEquipmentAssetKey = keyof PaperDollEquipmentAssetKeys;

interface HudVisual {
  hpFill: Phaser.GameObjects.Rectangle;
  armorFill: Phaser.GameObjects.Rectangle;
  staminaFill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface ArenaVisuals {
  player: FighterVisual;
  enemy: FighterVisual;
  playerHud: HudVisual;
  enemyHud: HudVisual;
}

const PAPER_DOLL_BASE_SCALE = 0.52;
const PAPER_DOLL_SHADOW_DEPTH = -1;
const PAPER_DOLL_SHADOW_COLOR = 0x120805;
const SLASH_ARC_DEPTH = 36;
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
const GAUNTLET_DISPLAY_HEIGHT = 58;
const GAUNTLET_LOCAL_X = 0;
const GAUNTLET_LOCAL_Y = 10;
const GAUNTLET_ORIGIN_X = 0.5;
const GAUNTLET_ORIGIN_Y = 0.5;
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
const CITY_HERO_VIEWER_WIDTH = 240;
const CITY_HERO_VIEWER_HEIGHT = 360;
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
  backGauntletAssetKey: FIGHTER_BACK_GAUNTLET_LIGHT_ASSET_KEY,
  frontGauntletAssetKey: FIGHTER_FRONT_GAUNTLET_LIGHT_ASSET_KEY,
  backGreaveAssetKey: FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY,
  frontGreaveAssetKey: FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY,
  backShinguardAssetKey: FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY,
  frontShinguardAssetKey: FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY,
  backBootAssetKey: FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY,
  frontBootAssetKey: FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY,
};

const PAPER_DOLL_EQUIPMENT_SLOT_KEYS = HERO_EQUIPMENT_SLOT_KEYS;

const PLAYER_EQUIPMENT_ASSET_KEY_BY_SLOT: Record<PaperDollEquipmentSlotKey, PaperDollEquipmentAssetKey> = {
  weaponMain: "weaponMainAssetKey",
  helmet: "helmetAssetKey",
  breastplate: "breastplateAssetKey",
  backShoulderguard: "backShoulderguardAssetKey",
  frontShoulderguard: "frontShoulderguardAssetKey",
  backGauntlet: "backGauntletAssetKey",
  frontGauntlet: "frontGauntletAssetKey",
  backGreave: "backGreaveAssetKey",
  frontGreave: "frontGreaveAssetKey",
  backShinguard: "backShinguardAssetKey",
  frontShinguard: "frontShinguardAssetKey",
  backBoot: "backBootAssetKey",
  frontBoot: "frontBootAssetKey",
};

const HERO_ITEM_EQUIPMENT_ASSET_KEYS: Partial<Record<HeroItemId, PaperDollEquipmentAssetKeys>> = {
  training_sword: { weaponMainAssetKey: FIGHTER_WEAPON_SWORD_01_ASSET_KEY },
  starter_helmet: { helmetAssetKey: FIGHTER_HELMET_LIGHT_ASSET_KEY },
  starter_breastplate: { breastplateAssetKey: FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY },
  starter_back_shoulderguard: { backShoulderguardAssetKey: FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY },
  starter_front_shoulderguard: { frontShoulderguardAssetKey: FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY },
  starter_back_gauntlet: { backGauntletAssetKey: FIGHTER_BACK_GAUNTLET_LIGHT_ASSET_KEY },
  starter_front_gauntlet: { frontGauntletAssetKey: FIGHTER_FRONT_GAUNTLET_LIGHT_ASSET_KEY },
  starter_back_greave: { backGreaveAssetKey: FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY },
  starter_front_greave: { frontGreaveAssetKey: FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY },
  starter_back_shinguard: { backShinguardAssetKey: FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY },
  starter_front_shinguard: { frontShinguardAssetKey: FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY },
  starter_back_boot: { backBootAssetKey: FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY },
  starter_front_boot: { frontBootAssetKey: FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY },
};

const PLAYER_EQUIPMENT_CHANGE_EVENT = "gladiator-player-equipment-change";

let readyCallback: ((scene: ArenaScene) => void) | undefined;
let activePlayerEquipment: HeroEquipment | undefined;

function part(gameObject: Phaser.GameObjects.GameObject): FighterPart {
  return gameObject as FighterPart;
}

function preloadArenaAssets(target: Phaser.Scene): void {
  target.load.image(ARENA_BACKGROUND_BACK_LAYER_ASSET_KEY, ARENA_BACKGROUND_BACK_LAYER_ASSET_URL);
  target.load.image(ARENA_BACKGROUND_MID_LAYER_ASSET_KEY, ARENA_BACKGROUND_MID_LAYER_ASSET_URL);
  target.load.image(ARENA_BACKGROUND_GROUND_LAYER_ASSET_KEY, ARENA_BACKGROUND_GROUND_LAYER_ASSET_URL);
}

function preloadPaperDollAssets(target: Phaser.Scene): void {
  target.load.image(FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY, FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY, FIGHTER_BACK_FOREARM_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_HAND_LIGHT_ASSET_KEY, FIGHTER_BACK_HAND_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_KEY, FIGHTER_BACK_SHOULDERGUARD_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_GAUNTLET_LIGHT_ASSET_KEY, FIGHTER_BACK_GAUNTLET_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY, FIGHTER_BACK_THIGH_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY, FIGHTER_BACK_SHIN_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY, FIGHTER_BACK_FOOT_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_GREAVE_LIGHT_ASSET_KEY, FIGHTER_BACK_GREAVE_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_KEY, FIGHTER_BACK_SHINGUARD_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_BOOT_LIGHT_ASSET_KEY, FIGHTER_BACK_BOOT_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY, FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY, FIGHTER_FRONT_FOREARM_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY, FIGHTER_FRONT_HAND_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_KEY, FIGHTER_FRONT_SHOULDERGUARD_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_GAUNTLET_LIGHT_ASSET_KEY, FIGHTER_FRONT_GAUNTLET_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY, FIGHTER_FRONT_THIGH_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY, FIGHTER_FRONT_SHIN_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY, FIGHTER_FRONT_FOOT_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_GREAVE_LIGHT_ASSET_KEY, FIGHTER_FRONT_GREAVE_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_KEY, FIGHTER_FRONT_SHINGUARD_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_BOOT_LIGHT_ASSET_KEY, FIGHTER_FRONT_BOOT_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_HEAD_LIGHT_ASSET_KEY, FIGHTER_HEAD_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_TORSO_LIGHT_ASSET_KEY, FIGHTER_TORSO_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_WEAPON_SWORD_01_ASSET_KEY, FIGHTER_WEAPON_SWORD_01_ASSET_URL);
  target.load.image(FIGHTER_HELMET_LIGHT_ASSET_KEY, FIGHTER_HELMET_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BREASTPLATE_LIGHT_ASSET_KEY, FIGHTER_BREASTPLATE_LIGHT_ASSET_URL);
}

export function setPlayerEquipment(equipment: HeroEquipment): void {
  activePlayerEquipment = { ...equipment };
  notifyPlayerEquipmentChanged();
}

function usePlayerEquipment(equipment: HeroEquipment | undefined): void {
  if (equipment) {
    setPlayerEquipment(equipment);
  }
}

function createPlayerEquipmentAssetKeys(equipment = activePlayerEquipment): PaperDollEquipmentAssetKeys {
  const defaultAssetKeys = { ...DEFAULT_PLAYER_EQUIPMENT_ASSET_KEYS };

  if (!equipment) {
    return defaultAssetKeys;
  }

  return Object.values(equipment).reduce((assetKeys, itemId) => {
    if (!itemId) {
      return assetKeys;
    }

    const itemAssetKeys = HERO_ITEM_EQUIPMENT_ASSET_KEYS[itemId];

    return itemAssetKeys ? { ...assetKeys, ...itemAssetKeys } : assetKeys;
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
      const hasVisualAsset = Boolean(itemId && HERO_ITEM_EQUIPMENT_ASSET_KEYS[itemId]?.[assetKey]);

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

function subscribePlayerEquipmentChanges(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(PLAYER_EQUIPMENT_CHANGE_EVENT, callback);

  return () => window.removeEventListener(PLAYER_EQUIPMENT_CHANGE_EVENT, callback);
}

export class ArenaScene extends Phaser.Scene {
  visuals?: ArenaVisuals;
  currentState?: CombatState;
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;

  constructor() {
    super("ArenaScene");
  }

  preload(): void {
    preloadArenaAssets(this);
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.cameras.main.setBounds(ARENA_WORLD_LEFT, 0, ARENA_WORLD_WIDTH, GAME_HEIGHT);
    drawArenaBackground(this);
    this.visuals = buildVisuals(this);
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => {
      if (this.currentState) {
        renderScene(this, this.currentState);
      }
    });
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(() => syncFighterEquipmentVisibility(this.visuals?.player));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
    });
    readyCallback?.(this);
  }

  update(time: number): void {
    const idle = getActiveBodyAnimation("idle");

    if (!this.visuals || !idle.enabled) {
      return;
    }

    applyLoopingBodyAnimation(this.visuals.player, time, idle);
    applyLoopingBodyAnimation(this.visuals.enemy, time, idle);
  }

  sync(nextState: CombatState): void {
    const previousState = this.currentState;

    this.currentState = nextState;

    if (!this.visuals) {
      return;
    }

    const visuals = this.visuals;

    arenaProfiler.measure("arena.enemyVisual", () => syncEnemyVisualForState(this, visuals, previousState, nextState));
    arenaProfiler.measure("arena.deathReset", () => resetDeathEffectsForLiveFighters(this, visuals, nextState));
    arenaProfiler.measure("arena.renderScene", () => renderScene(this, nextState));

    const lastPlayerAction = nextState.lastPlayerAction;
    const lastEnemyAction = nextState.lastEnemyAction;

    if (lastPlayerAction) {
      arenaProfiler.measure("arena.playerAnim", () => animateAction(this, visuals.player, visuals.enemy, lastPlayerAction, "right"));
    }

    if (lastEnemyAction) {
      arenaProfiler.measure("arena.enemyAnim", () => animateAction(this, visuals.enemy, visuals.player, lastEnemyAction, "left"));
    }

    if (nextState.lastPlayerDamage > 0) {
      arenaProfiler.measure("arena.playerDamageFx", () => {
        showDamagePopup(this, visuals.enemy.body.x, visuals.enemy.body.y - 128, nextState.lastPlayerDamage);
        shakeFighter(this, visuals.enemy);
      });
    } else if (nextState.lastPlayerBlocked) {
      arenaProfiler.measure("arena.playerBlockFx", () => showFloatingText(this, visuals.enemy.body.x, visuals.enemy.body.y - 128, "BLOCK", "#dfe9ff"));
    }

    if (nextState.lastEnemyDamage > 0) {
      arenaProfiler.measure("arena.enemyDamageFx", () => {
        showDamagePopup(this, visuals.player.body.x, visuals.player.body.y - 128, nextState.lastEnemyDamage);
        shakeFighter(this, visuals.player);
      });
    } else if (nextState.lastEnemyBlocked) {
      arenaProfiler.measure("arena.enemyBlockFx", () => showFloatingText(this, visuals.player.body.x, visuals.player.body.y - 128, "BLOCK", "#dfe9ff"));
    }

    arenaProfiler.measure("arena.deathSchedule", () => scheduleDeathEffects(this, nextState));
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

}

export function launchArena(onReady: (scene: ArenaScene) => void, _onAction: (actionId: ActionId) => void, playerEquipment?: HeroEquipment): void {
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
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: ArenaScene,
  };

  new Phaser.Game(config);
}

class CityHeroScene extends Phaser.Scene {
  private fighter?: FighterVisual;
  private groundShadow?: Phaser.GameObjects.Ellipse;
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;

  constructor() {
    super("CityHeroScene");
  }

  preload(): void {
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.groundShadow = this.add.ellipse(debugTuning.cityHeroX, debugTuning.cityHeroY + 8, 104, 20, 0x2a190f, 0.28);
    this.fighter = createPaperDollFighter(
      this,
      { ...createPlayerPaperDollOptions(debugTuning.cityHeroX, debugTuning.cityHeroY - PLAYER_AVATAR_FEET_Y_OFFSET), castsShadow: false },
    );
    this.fighter.name.setVisible(false);
    this.sync();
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => this.sync());
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(() => this.sync());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
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

    applyPaperDollRigTuning(this.fighter, debugTuning.cityHeroScale, debugTuning.cityHeroY, debugTuning.cityHeroX);
    this.groundShadow?.setPosition(debugTuning.cityHeroX, debugTuning.cityHeroY + 8);
    this.groundShadow?.setScale(debugTuning.cityHeroScale, debugTuning.cityHeroScale);
  }
}

export function mountCityHeroPreview(parent: HTMLElement, playerEquipment?: HeroEquipment): () => void {
  usePlayerEquipment(playerEquipment);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: CITY_HERO_VIEWER_WIDTH,
    height: CITY_HERO_VIEWER_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: CityHeroScene,
  });

  return () => game.destroy(true);
}

class HeroPortraitScene extends Phaser.Scene {
  private fighter?: FighterVisual;
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;

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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
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

class DebugCharacterScene extends Phaser.Scene {
  private fighter?: FighterVisual;
  private dragState?: DebugRigPartDragState;
  private unsubscribeDebugTuning?: () => void;
  private unsubscribePlayerEquipment?: () => void;

  constructor() {
    super("DebugCharacterScene");
  }

  preload(): void {
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    drawDebugCharacterBackdrop(this);
    this.fighter = createPaperDollFighter(this, { ...createPlayerPaperDollOptions(DEBUG_CHARACTER_CENTER_X, 0), castsShadow: false });
    this.fighter.name.setVisible(false);
    enableDebugPaperDollPartPicking(this.fighter.paperDollRig, (partKey, pointer, event) => this.beginRigPartDrag(partKey, pointer, event));
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => this.handlePreviewPointerDown(pointer, gameObjects));
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.dragRigPart(pointer));
    this.input.on("pointerup", () => this.endRigPartDrag());
    this.input.on("pointerupoutside", () => this.endRigPartDrag());
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      this.rotateSelectedRigPartsWithWheel(deltaY);
    });
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => this.sync());
    this.unsubscribePlayerEquipment = subscribePlayerEquipmentChanges(() => this.sync());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeDebugTuning?.();
      this.unsubscribePlayerEquipment?.();
    });
    this.sync();
  }

  update(time: number): void {
    const animation = getSelectedDebugBodyAnimation();

    if (!this.fighter) {
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

    applyPaperDollRigTuning(this.fighter, debugTuning.characterPreviewScale, debugTuning.characterPreviewFeetY, debugTuning.characterPreviewFeetX);
    applySelectedDebugAnimationEditPose(this.fighter);
    syncPaperDollSelectionHighlight(this.fighter.paperDollRig, debugTuning.selectedRigParts);
  }

  private beginRigPartDrag(partKey: RigPartKey, pointer: Phaser.Input.Pointer, event?: DebugInputEvent): void {
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

  private handlePreviewPointerDown(pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]): void {
    if (gameObjects.length > 0) {
      return;
    }

    if (typeof pointer.leftButtonDown === "function" && !pointer.leftButtonDown()) {
      return;
    }

    updateDebugTuning({ selectedRigParts: [] }, { undoable: false });
    this.endRigPartDrag();
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

  private endRigPartDrag(): void {
    this.dragState = undefined;
    endDebugUndoGroup();
  }

  private rotateSelectedRigPartsWithWheel(deltaY: number): void {
    if (deltaY === 0 || debugTuning.selectedRigParts.length === 0) {
      return;
    }

    updateRigPartsWithInteractiveDelta(debugTuning.selectedRigParts, {
      angle: deltaY > 0 ? 3 : -3,
    });
  }
}

export function mountDebugCharacterViewer(parent: HTMLElement, playerEquipment?: HeroEquipment): () => void {
  usePlayerEquipment(playerEquipment);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DEBUG_CHARACTER_VIEWER_WIDTH,
    height: DEBUG_CHARACTER_VIEWER_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: DebugCharacterScene,
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

function drawArenaBackground(target: Phaser.Scene): void {
  const layers = [
    { key: ARENA_BACKGROUND_BACK_LAYER_ASSET_KEY, depth: -30 },
    { key: ARENA_BACKGROUND_MID_LAYER_ASSET_KEY, depth: -20 },
    { key: ARENA_BACKGROUND_GROUND_LAYER_ASSET_KEY, depth: -10 },
  ] as const;

  layers.forEach((layer) => {
    if (!target.textures.exists(layer.key)) {
      target.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
      return;
    }

    target.add.image(0, 0, layer.key).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(layer.depth);
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
    headAssetKey: FIGHTER_HEAD_LIGHT_ASSET_KEY,
    torsoAssetKey: FIGHTER_TORSO_LIGHT_ASSET_KEY,
    ...equipmentAssetKeys,
    usesPlayerEquipment: true,
    bodyPartAssetKeys: DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS,
  };
}

function createEnemyPaperDollOptions(x: number, y: number, enemy?: FighterState): PaperDollFighterOptions {
  const preset = enemy?.visualPreset ?? DEFAULT_ENEMY_VISUAL_PRESET;
  const equipment = enemy?.equipment ? { ...enemy.equipment } : createDefaultHeroEquipment();
  const assetOptions = preset.usesDefaultBodyAssets
    ? {
        headAssetKey: FIGHTER_HEAD_LIGHT_ASSET_KEY,
        torsoAssetKey: FIGHTER_TORSO_LIGHT_ASSET_KEY,
        bodyPartAssetKeys: DEFAULT_PAPER_DOLL_BODY_PART_ASSET_KEYS,
      }
    : {};

  return {
    x,
    y,
    label: enemy?.name.toUpperCase() ?? "GRUMBUS",
    facing: -1,
    skin: preset.skin,
    skinDark: preset.skinDark,
    hair: preset.hair,
    muscle: preset.muscle,
    ...createPlayerEquipmentAssetKeys(equipment),
    ...assetOptions,
    equipment,
  };
}

function buildVisuals(target: ArenaScene): ArenaVisuals {
  const player = createPaperDollFighter(target, createPlayerPaperDollOptions(DEFAULT_STAGE_ORIGIN_X + DEFAULT_PLAYER_STAGE_X, FIGHTER_BASE_Y));
  const enemy = createPaperDollFighter(target, createEnemyPaperDollOptions(DEFAULT_STAGE_ORIGIN_X + DEFAULT_ENEMY_STAGE_X, FIGHTER_BASE_Y));
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

function createPaperDollFighter(target: Phaser.Scene, options: PaperDollFighterOptions): FighterVisual {
  const appearance: PaperDollAppearance = {
    facing: options.facing,
    skin: options.skin,
    skinDark: options.skinDark,
    hair: options.hair,
    muscle: options.muscle ?? DEFAULT_PAPER_DOLL_APPEARANCE.muscle,
  };
  const initialFeetY = options.y + PLAYER_AVATAR_FEET_Y_OFFSET;
  const shadowRig = createPaperDollShadowRig(target, options, appearance, initialFeetY, options.castsShadow !== false);
  const rootContainer = target.add.container(options.x, initialFeetY);
  const root = part(rootContainer);
  const parts = {} as Record<PaperDollPartKey, FighterPart>;
  const equipment: PaperDollEquipment = {};
  const faceParts: PaperDollFaceParts = {};
  const selectionHighlights = {} as Record<PaperDollPartKey, Phaser.GameObjects.Graphics>;

  PAPER_DOLL_PART_ORDER.forEach((key) => {
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const partContainer = target.add.container(pivot.x, pivot.y);

    addPaperDollPartVisual(target, partContainer, key, appearance, options, equipment, faceParts);
    selectionHighlights[key] = addPaperDollPartSelectionHighlight(target, partContainer, key);
    rootContainer.add(partContainer);
    parts[key] = part(partContainer);
  });

  root.scaleX = PAPER_DOLL_BASE_SCALE * appearance.facing;
  root.scaleY = PAPER_DOLL_BASE_SCALE;
  const paperDollRig: PaperDollRig = {
    root,
    parts,
    equipment,
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
    name,
    movableParts: [shadowRig.root, root, name],
    animatedParts: [root],
    paperDollRig,
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
  const faceParts: PaperDollFaceParts = {};
  const shadowAppearance: PaperDollAppearance = {
    ...appearance,
    skin: PAPER_DOLL_SHADOW_COLOR,
    skinDark: PAPER_DOLL_SHADOW_COLOR,
    hair: PAPER_DOLL_SHADOW_COLOR,
    muscle: PAPER_DOLL_SHADOW_COLOR,
  };

  PAPER_DOLL_PART_ORDER.forEach((key) => {
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const partContainer = target.add.container(pivot.x, pivot.y);

    addPaperDollPartVisual(target, partContainer, key, shadowAppearance, options, equipment, faceParts);
    tintPaperDollShadowObject(partContainer);
    shadowRootContainer.add(partContainer);
    parts[key] = part(partContainer);
  });

  shadowRoot.scaleX = PAPER_DOLL_BASE_SCALE * appearance.facing * debugTuning.shadowScaleX;
  shadowRoot.scaleY = PAPER_DOLL_BASE_SCALE * debugTuning.shadowScaleY;

  return { root: shadowRoot, parts, equipment, faceParts };
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
  fighter.shadow.x = centerX + debugTuning.shadowOffsetX * scale;
  fighter.shadow.y = feetY + debugTuning.shadowOffsetY * scale;
  fighter.shadow.scaleX = PAPER_DOLL_BASE_SCALE * scale * (fighter.paperDollRig?.appearance.facing ?? 1) * debugTuning.shadowScaleX;
  fighter.shadow.scaleY = PAPER_DOLL_BASE_SCALE * scale * debugTuning.shadowScaleY;
  fighter.shadow.angle = 0;
  fighter.shadow.setAlpha(debugTuning.shadowAlpha);
}

function applyRigPartDebugTuning(rig: PaperDollRig): void {
  const activeDebugTuning = getActiveDebugTuning();
  const rigParts = activeDebugTuning?.rigParts;
  const faceParts = activeDebugTuning?.faceParts ?? DEFAULT_FACE_PARTS;
  const equipment = activeDebugTuning?.equipment ?? DEFAULT_EQUIPMENT;

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

  applyFacePartTransform(rig.faceParts.eyeLeft, HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeLeft);
  applyFacePartTransform(rig.faceParts.eyeRight, HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeRight);
  applyFacePartTransform(rig.shadow?.faceParts.eyeLeft, HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeLeft);
  applyFacePartTransform(rig.shadow?.faceParts.eyeRight, HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeRight);
  applyPaperDollEquipmentTuning(rig.equipment, equipment);
  if (rig.shadow) {
    applyPaperDollEquipmentTuning(rig.shadow.equipment, equipment);
  }
}

function applyPaperDollEquipmentTuning(equipmentParts: PaperDollEquipment, equipment: Record<EquipmentSlotKey, EquipmentTuning>): void {
  applyEquipmentTransform(equipmentParts.weaponMain, equipment.weaponMain);
  applyEquipmentTransform(equipmentParts.helmet, equipment.helmet);
  applyEquipmentTransform(equipmentParts.breastplate, equipment.breastplate);
  applyEquipmentTransform(equipmentParts.backShoulderguard, equipment.backShoulderguard);
  applyEquipmentTransform(equipmentParts.frontShoulderguard, equipment.frontShoulderguard);
  applyEquipmentTransform(equipmentParts.backGauntlet, equipment.backGauntlet);
  applyEquipmentTransform(equipmentParts.frontGauntlet, equipment.frontGauntlet);
  applyEquipmentTransform(equipmentParts.backGreave, equipment.backGreave);
  applyEquipmentTransform(equipmentParts.frontGreave, equipment.frontGreave);
  applyEquipmentTransform(equipmentParts.backShinguard, equipment.backShinguard);
  applyEquipmentTransform(equipmentParts.frontShinguard, equipment.frontShinguard);
  applyEquipmentTransform(equipmentParts.backBoot, equipment.backBoot);
  applyEquipmentTransform(equipmentParts.frontBoot, equipment.frontBoot);
}

function syncFighterEquipmentVisibility(fighter: FighterVisual | undefined): void {
  syncPaperDollEquipmentVisibility(fighter?.paperDollRig);
}

function syncPaperDollEquipmentVisibility(rig: PaperDollRig | undefined): void {
  if (!rig) {
    return;
  }

  const visibility = rig.usesPlayerEquipment
    ? createPlayerEquipmentVisibility()
    : rig.equipmentState
      ? createPlayerEquipmentVisibility(rig.equipmentState)
      : undefined;

  if (!visibility) {
    return;
  }

  PAPER_DOLL_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    rig.equipment[slotKey]?.setVisible(visibility[slotKey]);
    rig.shadow?.equipment[slotKey]?.setVisible(visibility[slotKey]);
  });
}

function applyLoopingBodyAnimation(fighter: FighterVisual, time: number, animation: BodyAnimationTuning): void {
  if (fighter.isShattered) {
    return;
  }

  if ((fighter.bodyAnimationLockedUntil ?? 0) > time) {
    return;
  }

  applyBodyAnimation(fighter, time, animation);
}

function applyBodyAnimation(fighter: FighterVisual, time: number, animation: BodyAnimationTuning): void {
  const duration = Math.max(1, animation.duration);
  const phase = (time % duration) / duration;
  const blend = 0.5 - Math.cos(phase * Math.PI * 2) * 0.5;

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
      event?.stopPropagation();

      if (onPick) {
        onPick(key, pointer, event);
      } else {
        updateDebugTuning({ selectedRigPart: key, selectedRigParts: [key] }, { undoable: false });
      }
    });
  });
}

function syncPaperDollSelectionHighlight(rig: PaperDollRig | undefined, highlightedParts: readonly RigPartKey[]): void {
  if (!rig) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    rig.selectionHighlights[key].setVisible(highlightedParts.includes(key));
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

function addPaperDollPartSelectionHighlight(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  key: PaperDollPartKey,
): Phaser.GameObjects.Graphics {
  const highlight = target.add.graphics();

  drawPaperDollPartSelectionHighlight(highlight, key);
  highlight.setVisible(false);
  partContainer.add(highlight);

  return highlight;
}

function drawPaperDollPartSelectionHighlight(graphics: Phaser.GameObjects.Graphics, key: PaperDollPartKey): void {
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
  appearance: PaperDollAppearance,
  options: PaperDollFighterOptions,
  equipment: PaperDollEquipment,
  faceParts: PaperDollFaceParts,
): void {
  if (key === "head" && options.headAssetKey && target.textures.exists(options.headAssetKey)) {
    const image = target.add.image(0, HEAD_ASSET_LOCAL_BOTTOM_Y, options.headAssetKey);
    image.setOrigin(HEAD_ASSET_ORIGIN_X, HEAD_ASSET_ORIGIN_Y);
    image.displayHeight = HEAD_ASSET_DISPLAY_HEIGHT;
    image.scaleX = image.scaleY;
    partContainer.add(image);
    addPaperDollHelmetVisual(target, partContainer, options.helmetAssetKey, equipment);
    addPaperDollFaceOverlay(target, partContainer, faceParts, true);
    return;
  }

  if (key === "torso" && options.torsoAssetKey && target.textures.exists(options.torsoAssetKey)) {
    const image = target.add.image(0, TORSO_ASSET_LOCAL_BOTTOM_Y, options.torsoAssetKey);
    image.setOrigin(TORSO_ASSET_ORIGIN_X, TORSO_ASSET_ORIGIN_Y);
    image.displayHeight = TORSO_ASSET_DISPLAY_HEIGHT;
    image.scaleX = image.scaleY;
    partContainer.add(image);
    addPaperDollBreastplateVisual(target, partContainer, options.breastplateAssetKey, equipment);
    return;
  }

  const assetKey = options.bodyPartAssetKeys?.[key];
  const assetConfig = PAPER_DOLL_PART_ASSET_CONFIGS[key];

  if (key === "backHand" && options.weaponMainAssetKey && target.textures.exists(options.weaponMainAssetKey)) {
    addPaperDollWeaponVisual(target, partContainer, options.weaponMainAssetKey, equipment);
  }

  if (assetKey && assetConfig && target.textures.exists(assetKey)) {
    const image = target.add.image(assetConfig.localX, assetConfig.localY, assetKey);
    image.setOrigin(assetConfig.originX, assetConfig.originY);
    image.displayHeight = assetConfig.displayHeight;
    image.scaleX = image.scaleY;
    partContainer.add(image);
    addPaperDollArmArmorVisual(target, partContainer, key, options, equipment);
    addPaperDollLegArmorVisual(target, partContainer, key, options, equipment);
    return;
  }

  const graphics = target.add.graphics();
  drawPaperDollPart(graphics, key, appearance);
  partContainer.add(graphics);
  addPaperDollArmArmorVisual(target, partContainer, key, options, equipment);
  addPaperDollLegArmorVisual(target, partContainer, key, options, equipment);

  if (key === "torso") {
    addPaperDollBreastplateVisual(target, partContainer, options.breastplateAssetKey, equipment);
  }

  if (key === "head") {
    addPaperDollHelmetVisual(target, partContainer, options.helmetAssetKey, equipment);
    addPaperDollFaceOverlay(target, partContainer, faceParts, false);
  }
}

function addPaperDollWeaponVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  assetKey: string,
  equipment: PaperDollEquipment,
): void {
  const weaponContainer = target.add.container(0, 0);
  const image = target.add.image(0, 0, assetKey);

  image.setOrigin(WEAPON_MAIN_ORIGIN_X, WEAPON_MAIN_ORIGIN_Y);
  image.displayHeight = WEAPON_MAIN_DISPLAY_HEIGHT;
  image.scaleX = image.scaleY;
  weaponContainer.add(image);
  partContainer.add(weaponContainer);
  equipment.weaponMain = part(weaponContainer);
}

function addPaperDollHelmetVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  assetKey: string | undefined,
  equipment: PaperDollEquipment,
): void {
  const helmetContainer = target.add.container(0, 0);

  if (assetKey && target.textures.exists(assetKey)) {
    const image = target.add.image(HELMET_LOCAL_X, HELMET_LOCAL_Y, assetKey);

    image.setOrigin(HELMET_ORIGIN_X, HELMET_ORIGIN_Y);
    image.displayHeight = HELMET_DISPLAY_HEIGHT;
    image.scaleX = image.scaleY;
    helmetContainer.add(image);
  } else {
    const graphics = target.add.graphics();

    drawArmorHelmetPlaceholder(graphics);
    helmetContainer.add(graphics);
  }

  partContainer.add(helmetContainer);
  equipment.helmet = part(helmetContainer);
}

function addPaperDollBreastplateVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  assetKey: string | undefined,
  equipment: PaperDollEquipment,
): void {
  const breastplateContainer = target.add.container(0, 0);

  if (assetKey && target.textures.exists(assetKey)) {
    const image = target.add.image(BREASTPLATE_LOCAL_X, BREASTPLATE_LOCAL_Y, assetKey);

    image.setOrigin(BREASTPLATE_ORIGIN_X, BREASTPLATE_ORIGIN_Y);
    image.displayHeight = BREASTPLATE_DISPLAY_HEIGHT;
    image.scaleX = image.scaleY;
    breastplateContainer.add(image);
  } else {
    const graphics = target.add.graphics();

    drawArmorBreastplatePlaceholder(graphics);
    breastplateContainer.add(graphics);
  }

  partContainer.add(breastplateContainer);
  equipment.breastplate = part(breastplateContainer);
}

function addPaperDollArmArmorVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  key: PaperDollPartKey,
  options: PaperDollFighterOptions,
  equipment: PaperDollEquipment,
): void {
  if (key === "backUpperArm") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.backShoulderguardAssetKey, "backShoulderguard", equipment, {
      displayHeight: SHOULDERGUARD_DISPLAY_HEIGHT,
      localX: SHOULDERGUARD_LOCAL_X,
      localY: SHOULDERGUARD_LOCAL_Y,
      originX: SHOULDERGUARD_ORIGIN_X,
      originY: SHOULDERGUARD_ORIGIN_Y,
    });
    return;
  }

  if (key === "frontUpperArm") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.frontShoulderguardAssetKey, "frontShoulderguard", equipment, {
      displayHeight: SHOULDERGUARD_DISPLAY_HEIGHT,
      localX: SHOULDERGUARD_LOCAL_X,
      localY: SHOULDERGUARD_LOCAL_Y,
      originX: SHOULDERGUARD_ORIGIN_X,
      originY: SHOULDERGUARD_ORIGIN_Y,
    });
    return;
  }

  if (key === "backHand") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.backGauntletAssetKey, "backGauntlet", equipment, {
      displayHeight: GAUNTLET_DISPLAY_HEIGHT,
      localX: GAUNTLET_LOCAL_X,
      localY: GAUNTLET_LOCAL_Y,
      originX: GAUNTLET_ORIGIN_X,
      originY: GAUNTLET_ORIGIN_Y,
    });
    return;
  }

  if (key === "frontHand") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.frontGauntletAssetKey, "frontGauntlet", equipment, {
      displayHeight: GAUNTLET_DISPLAY_HEIGHT,
      localX: GAUNTLET_LOCAL_X,
      localY: GAUNTLET_LOCAL_Y,
      originX: GAUNTLET_ORIGIN_X,
      originY: GAUNTLET_ORIGIN_Y,
    });
  }
}

function addPaperDollLegArmorVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  key: PaperDollPartKey,
  options: PaperDollFighterOptions,
  equipment: PaperDollEquipment,
): void {
  if (key === "backThigh") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.backGreaveAssetKey, "backGreave", equipment, {
      displayHeight: GREAVE_DISPLAY_HEIGHT,
      localX: GREAVE_LOCAL_X,
      localY: GREAVE_LOCAL_Y,
      originX: GREAVE_ORIGIN_X,
      originY: GREAVE_ORIGIN_Y,
    });
    return;
  }

  if (key === "frontThigh") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.frontGreaveAssetKey, "frontGreave", equipment, {
      displayHeight: GREAVE_DISPLAY_HEIGHT,
      localX: GREAVE_LOCAL_X,
      localY: GREAVE_LOCAL_Y,
      originX: GREAVE_ORIGIN_X,
      originY: GREAVE_ORIGIN_Y,
    });
    return;
  }

  if (key === "backShin") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.backShinguardAssetKey, "backShinguard", equipment, {
      displayHeight: SHINGUARD_DISPLAY_HEIGHT,
      localX: SHINGUARD_LOCAL_X,
      localY: SHINGUARD_LOCAL_Y,
      originX: SHINGUARD_ORIGIN_X,
      originY: SHINGUARD_ORIGIN_Y,
    });
    return;
  }

  if (key === "frontShin") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.frontShinguardAssetKey, "frontShinguard", equipment, {
      displayHeight: SHINGUARD_DISPLAY_HEIGHT,
      localX: SHINGUARD_LOCAL_X,
      localY: SHINGUARD_LOCAL_Y,
      originX: SHINGUARD_ORIGIN_X,
      originY: SHINGUARD_ORIGIN_Y,
    });
    return;
  }

  if (key === "backFoot") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.backBootAssetKey, "backBoot", equipment, {
      displayHeight: BOOT_DISPLAY_HEIGHT,
      localX: -BOOT_LOCAL_X,
      localY: BOOT_LOCAL_Y,
      originX: BOOT_ORIGIN_X,
      originY: BOOT_ORIGIN_Y,
    });
    return;
  }

  if (key === "frontFoot") {
    addPaperDollEquipmentImageVisual(target, partContainer, options.frontBootAssetKey, "frontBoot", equipment, {
      displayHeight: BOOT_DISPLAY_HEIGHT,
      localX: BOOT_LOCAL_X,
      localY: BOOT_LOCAL_Y,
      originX: BOOT_ORIGIN_X,
      originY: BOOT_ORIGIN_Y,
    });
  }
}

function addPaperDollEquipmentImageVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  assetKey: string | undefined,
  slotKey: keyof PaperDollEquipment,
  equipment: PaperDollEquipment,
  config: PaperDollPartAssetConfig,
): void {
  if (!assetKey || !target.textures.exists(assetKey)) {
    return;
  }

  const armorContainer = target.add.container(0, 0);
  const image = target.add.image(config.localX, config.localY, assetKey);

  image.setOrigin(config.originX, config.originY);
  image.displayHeight = config.displayHeight;
  image.scaleX = image.scaleY;
  armorContainer.add(image);
  partContainer.add(armorContainer);
  equipment[slotKey] = part(armorContainer);
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
  }

  const eyeLeft = target.add.ellipse(HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_WIDTH, HEAD_FACE_EYE_HEIGHT, HEAD_FACE_EYE_BLACK);
  const eyeRight = target.add.ellipse(HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_WIDTH, HEAD_FACE_EYE_HEIGHT, HEAD_FACE_EYE_BLACK);

  partContainer.add([eyeLeft, eyeRight]);
  faceParts.eyeLeft = part(eyeLeft);
  faceParts.eyeRight = part(eyeRight);
}

function drawPaperDollPart(graphics: Phaser.GameObjects.Graphics, key: PaperDollPartKey, appearance: PaperDollAppearance): void {
  const skin = appearance.skin;
  const skinDark = appearance.skinDark;
  const outline = 0x35180d;
  const muscle = appearance.muscle;
  const hair = appearance.hair;
  const isBack = key.startsWith("back");
  const side = key.startsWith("front") ? 1 : -1;
  const limbFill = isBack ? skinDark : skin;

  graphics.clear();

  if (key === "torso") {
    drawDollPolygon(
      graphics,
      [
        { x: -39, y: -106 },
        { x: 39, y: -106 },
        { x: 31, y: -25 },
        { x: 17, y: 8 },
        { x: -17, y: 8 },
        { x: -31, y: -25 },
      ],
      skin,
      outline,
      1,
      1,
      5,
    );
    drawDollLine(graphics, 0, -94, 0, -3, muscle, 1, 3, 0.7);
    drawDollEllipse(graphics, -14, -68, 25, 16, 0, 0x000000, muscle, 1, 0, 3, 0.7);
    drawDollEllipse(graphics, 14, -68, 25, 16, 0, 0x000000, muscle, 1, 0, 3, 0.7);
    drawDollEllipse(graphics, -8, -28, 16, 12, 0, 0x000000, muscle, 1, 0, 3, 0.7);
    drawDollEllipse(graphics, 8, -28, 16, 12, 0, 0x000000, muscle, 1, 0, 3, 0.7);
    return;
  }

  if (key === "head") {
    drawDollEllipse(graphics, 0, 0, 26, 28, 0, skin, outline, 1, 1, 4);
    drawDollEllipse(graphics, -42, -33, 23, 32, 0, skin, outline, 1, 1, 4);
    drawDollEllipse(graphics, 42, -33, 23, 32, 0, skin, outline, 1, 1, 4);
    drawDollEllipse(graphics, 0, -39, 78, 86, 0, skin, outline, 1, 1, 5);
    drawDollPolygon(
      graphics,
      [
        { x: -37, y: -46 },
        { x: -26, y: -77 },
        { x: 8, y: -87 },
        { x: 36, y: -64 },
        { x: 37, y: -42 },
        { x: 22, y: -53 },
        { x: -8, y: -57 },
        { x: -37, y: -38 },
      ],
      hair,
      outline,
      1,
      1,
      5,
    );
    drawDollPolygon(
      graphics,
      [
        { x: -12, y: -72 },
        { x: -2, y: -102 },
        { x: 15, y: -77 },
        { x: 4, y: -66 },
      ],
      hair,
      outline,
      1,
      1,
      4,
    );
    drawDollSmile(graphics, 0, -26, 12, outline, 1);
    return;
  }

  if (key.endsWith("UpperArm")) {
    drawDollEllipse(graphics, 8 * side, 35, 31, 86, -0.18 * side, limbFill, outline, 1, 1, 4);
    return;
  }

  if (key.endsWith("Forearm")) {
    drawDollEllipse(graphics, 5 * side, 29, 27, 64, -0.06 * side, limbFill, outline, 1, 1, 4);
    return;
  }

  if (key.endsWith("Hand")) {
    drawDollEllipse(graphics, 4 * side, 12, 30, 30, 0, limbFill, outline, 1, 1, 4);
    return;
  }

  if (key.endsWith("Thigh")) {
    drawDollEllipse(graphics, 3 * side, 25, 30, 72, -0.05 * side, limbFill, outline, 1, 1, 4);
    return;
  }

  if (key.endsWith("Shin")) {
    drawDollEllipse(graphics, 4 * side, 28, 27, 70, 0.04 * side, limbFill, outline, 1, 1, 4);
    return;
  }

  drawDollEllipse(graphics, 14 * side, 8, 50, 22, -0.08 * side, limbFill, outline, 1, 1, 4);
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

function drawDollSmile(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, color: number, scale: number): void {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= 10; i += 1) {
    const angle = 0.1 * Math.PI + (0.8 * Math.PI * i) / 10;
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
    });
  }

  graphics.lineStyle(Math.max(1, 3 * scale), color, 1);
  graphics.beginPath();
  graphics.moveTo(points[0].x * scale, points[0].y * scale);

  for (const point of points.slice(1)) {
    graphics.lineTo(point.x * scale, point.y * scale);
  }

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
    target.tweens.killTweensOf(Object.values(rig.parts));
  }

  setFighterAlpha(fighter, 1);
  fighter.shadow.setVisible(true);
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
  target.tweens.killTweensOf([rig.root, ...Object.values(rig.parts)]);
  setFighterAlpha(fighter, 1);
  createDust(target, rig.root.x, rig.root.y - 6);

  const rootDirection = Math.sign(rig.root.scaleX) || 1;
  const localBlastDirection = worldDirection / rootDirection;

  RIG_PART_KEYS.forEach((key, index) => {
    const part = rig.parts[key];
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

    target.tweens.add({
      targets: part,
      x: startX + scatterX * 0.42,
      y: liftY,
      angle: startAngle + spin * 0.28,
      duration: liftDuration,
      delay,
      ease: "Quad.easeOut",
    });

    target.tweens.add({
      targets: part,
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
    part.setAlpha(part === fighter.shadow ? alpha * debugTuning.shadowAlpha : alpha);
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

function updateCamera(target: Phaser.Scene, current: CombatState): void {
  const camera = target.cameras.main;
  const cameraTarget = getCameraTarget(current, getActiveDebugTuning());
  const shouldSnap = isDebugTuningActive();

  target.tweens.killTweensOf(camera);

  if (shouldSnap) {
    camera.setScroll(cameraTarget.scrollX, cameraTarget.scrollY);
    camera.setZoom(cameraTarget.zoom);
    return;
  }

  target.tweens.add({
    targets: camera,
    scrollX: cameraTarget.scrollX,
    scrollY: cameraTarget.scrollY,
    zoom: cameraTarget.zoom,
    duration: 320,
    ease: "Sine.easeInOut",
  });
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
    fighter.name,
    ...(fighter.extraParts ?? []),
  ] as FighterPart[];
}

function playBodyAnimationOnce(target: Phaser.Scene, fighter: FighterVisual, animation: BodyAnimationTuning): void {
  const rig = fighter.paperDollRig;

  if (!rig || !animation.enabled) {
    return;
  }

  const duration = Math.max(1, animation.duration);
  const lockedUntil = target.time.now + duration;

  fighter.bodyAnimationLockedUntil = lockedUntil;
  target.tweens.killTweensOf(Object.values(rig.parts));
  applyBodyAnimationBlend(fighter, animation, 0);

  target.tweens.addCounter({
    from: 0,
    to: 1,
    duration: Math.max(1, duration / 2),
    yoyo: true,
    ease: "Sine.easeInOut",
    onUpdate: (tween) => {
      applyBodyAnimationBlend(fighter, animation, tween.getValue());
    },
    onComplete: () => {
      if (fighter.bodyAnimationLockedUntil === lockedUntil) {
        fighter.bodyAnimationLockedUntil = 0;
      }
    },
  });
}

function animateAction(
  target: Phaser.Scene,
  actor: FighterVisual,
  _opponent: FighterVisual,
  actionId: ActionId,
  direction: "left" | "right",
): void {
  const sign = direction === "right" ? 1 : -1;

  if (actionId === "forward" || actionId === "back") {
    playBodyAnimationOnce(target, actor, getActiveBodyAnimation("walkCycle"));
    showFloatingText(target, actor.body.x, actor.body.y - 120, actionId === "forward" ? "STEP" : "BACK", "#ffe7a4");
    return;
  }

  if (actionId === "lunge") {
    playBodyAnimationOnce(target, actor, getActiveBodyAnimation("lunge"));
    return;
  }

  if (actionId === "taunt") {
    playBodyAnimationOnce(target, actor, getActiveBodyAnimation("taunt"));
    return;
  }

  if (actionId === "rest") {
    playBodyAnimationOnce(target, actor, getActiveBodyAnimation("rest"));
    return;
  }

  if (isAttackBodyAnimationKey(actionId)) {
    playBodyAnimationOnce(target, actor, getActiveBodyAnimation(actionId));
    showSlashArc(target, actor, actionId, direction);
  }

  target.tweens.add({
    targets: actor.sword,
    angle: actor.sword.angle - 32 * sign,
    duration: 110,
    yoyo: true,
    ease: "Back.easeOut",
  });
}

function isAttackBodyAnimationKey(actionId: ActionId): actionId is AttackBodyAnimationKey {
  return actionId === "light" || actionId === "medium" || actionId === "heavy";
}

function showSlashArc(target: Phaser.Scene, actor: FighterVisual, actionId: AttackBodyAnimationKey, direction: "left" | "right"): void {
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

function shakeFighter(target: Phaser.Scene, fighter: FighterVisual): void {
  const parts = getAnimatedFighterParts(fighter);

  target.tweens.add({
    targets: parts,
    x: "+=10",
    duration: 45,
    yoyo: true,
    repeat: 3,
    ease: "Stepped",
  });
}

function showFloatingText(target: Phaser.Scene, x: number, y: number, text: string, color: string): void {
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

  target.tweens.add({
    targets: label,
    y: y - 48,
    alpha: 0,
    duration: 720,
    ease: "Quad.easeOut",
    onComplete: () => label.destroy(),
  });
}

function getAnimatedFighterParts(fighter: FighterVisual): FighterPart[] {
  if (fighter.animatedParts) {
    return fighter.animatedParts;
  }

  return getFighterParts(fighter).filter((part) => part !== fighter.shadow && part !== fighter.name);
}

function showDamagePopup(target: Phaser.Scene, x: number, y: number, amount: number): void {
  const popup = target.add.container(x, y).setDepth(40);
  const shadow = target.add.graphics();
  const burst = target.add.graphics();
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

  drawDamageBurst(shadow, 4, 5, 0x35180d, 0.92);
  drawDamageBurst(burst, 0, 0, 0xd52b1f, 1);
  popup.add([shadow, burst, label]);
  popup.setScale(0.58);
  popup.setAngle(-4);

  target.tweens.add({
    targets: popup,
    scale: 1,
    duration: 130,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popup,
    y: y - 34,
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
  for (let i = 0; i < 7; i += 1) {
    const dot = target.add.circle(x + Math.random() * 36 - 18, y + Math.random() * 16, 5 + Math.random() * 7, 0xf0bd72, 0.72);
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







