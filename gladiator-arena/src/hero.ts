import {
  BATTLE_LOSS_REWARD,
  BATTLE_WIN_REWARD,
  DEFAULT_ARENA_DIFFICULTY_ID,
  DEFAULT_ARENA_TIER_ID,
  getArenaBossesForTier as resolveArenaBossesForTier,
  getArenaBossDefinition as resolveArenaBossDefinition,
  getArenaRandomOpponentDefinition as resolveArenaRandomOpponentDefinition,
  getArenaRandomOpponentsForTier as resolveArenaRandomOpponentsForTier,
  getArenaTierDefinition as resolveArenaTierDefinition,
  getArenaTierDefinitions as resolveArenaTierDefinitions,
} from "./arenaOpponents";
import { RANDOM_ARENA_OPPONENT_NAMES } from "./arenaOpponentNames";
import type {
  ArenaDifficultyId,
  ArenaBossDefinition,
  ArenaGeneratedEquipmentPool,
  ArenaLootTableEntry,
  ArenaOpponentRewards,
  ArenaRandomOpponentDefinition,
  ArenaTierDefinition,
} from "./arenaOpponents";
import {
  BOW_SHOTS_PER_BATTLE,
  FIREBALL_SCROLL_DAMAGE,
  POISON_SCROLL_DAMAGE,
  freshState,
  MAX_HP,
  MAX_STAMINA,
  type CombatArmorSlotState,
  type CombatState,
  type FighterState,
} from "./combat";
import { GENERATED_EQUIPMENT_ITEM_CATALOG, GENERATED_EQUIPMENT_ITEM_IDS, GENERATED_EQUIPMENT_ITEM_RECORDS, GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";

export {
  ARENA_DIFFICULTY_IDS,
  ARENA_BOSSES,
  ARENA_RANDOM_OPPONENTS,
  ARENA_TIER_CONFIGS,
  ARENA_TIERS,
  BATTLE_LOSS_REWARD,
  BATTLE_WIN_REWARD,
  DEFAULT_ARENA_DIFFICULTY_ID,
  DEFAULT_ARENA_TIER_ID,
  getArenaBossDefinition,
  getArenaBossesForTier,
  getArenaRandomOpponentDefinition,
  getArenaRandomOpponentsForTier,
  getArenaRandomOpponentsForTierAndDifficulty,
  getArenaTierConfig,
  getArenaTierDefinition,
  getArenaTierDefinitions,
} from "./arenaOpponents";
export type {
  ArenaDifficultyId,
  ArenaBossDefinition,
  ArenaBossId,
  ArenaTierConfig,
  ArenaTierOpponentDefinition,
  ArenaGeneratedEquipmentPool,
  ArenaLootTableEntry,
  ArenaOpponentId,
  ArenaOpponentRewards,
  ArenaRandomOpponentDefinition,
  ArenaTierDefinition,
} from "./arenaOpponents";

export type HeroWeaponClass = "sword" | "axe" | "bow" | "mace" | "spear" | "shuriken";

export interface HeroState {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: number;
  gold: number;
  totalWins?: number;
  arenaWinQuest?: HeroArenaWinQuest;
  arenaEnergy?: HeroArenaEnergy;
  arenaBossVictoryLedger?: HeroArenaBossVictoryLedger;
  bowShotCapacity?: number;
  scrollCapacity?: number;
  skillPointResetCount?: number;
  baseStats: HeroBaseStats;
  appearance: HeroAppearance;
  equipment: HeroEquipment;
  weaponEnchantments: HeroWeaponEnchantments;
  scrollUpgrades?: HeroScrollUpgrades;
  inventory: HeroInventoryEntry[];
  unlockedShopRarities: HeroItemRarity[];
  defeatedArenaBossIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HeroBaseStats {
  strength: number;
  agility: number;
  vitality: number;
}

export interface HeroArenaEnergy {
  current: number;
  max: number;
  dayKey: string;
}

export interface HeroArenaWinQuest {
  wins: number;
  claimed: boolean;
  lastOpenedDayKey?: string;
}

export interface HeroArenaWinQuestStatus {
  wins: number;
  goal: number;
  claimed: boolean;
  ready: boolean;
  openedToday: boolean;
  rewards: {
    arenaEnergy: number;
    gold: number;
  };
}

export interface HeroArenaBossVictoryLedger {
  dayKey: string;
  tierIds: number[];
}

export interface HeroAppearance {
  hairId: string | null;
  beardId: string | null;
}

export type HeroAppearanceSlotKey = "hair" | "beard";

export const HERO_APPEARANCE_SLOT_KEYS: readonly HeroAppearanceSlotKey[] = ["hair", "beard"];

export const DEFAULT_HERO_APPEARANCE: HeroAppearance = {
  hairId: "hair-01",
  beardId: "beard-short-01",
};

export const HERO_ATTRIBUTE_KEYS = ["strength", "agility", "vitality"] as const;
export type HeroAttributeKey = (typeof HERO_ATTRIBUTE_KEYS)[number];

export type HeroItemRequirementCheck =
  | {
      kind: "attribute";
      attribute: HeroAttributeKey;
      required: number;
      current: number;
    }
  | {
      kind: "level";
      required: number;
      current: number;
    };

export interface HeroStats {
  maxHp: number;
  maxArmor: number;
  maxStamina: number;
  damageBonus: number;
  weaponDamageBonus: number;
  meleeDamagePercentBonus: number;
  maceArmorDamagePercentBonus: number;
  spearMeleeDamagePercentBonus: number;
  spearLungeDamagePercentBonus: number;
  spearClinchRangeBonus: number;
  spearLungeMoveBonus: number;
  movementDistanceBonus: number;
  bodyScaleBonus: number;
  clinchRangeBonus: number;
  restHpRestoreBonus: number;
  restStaminaRestoreBonus: number;
}

export const HERO_EQUIPMENT_SLOT_KEYS = [
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

export type HeroEquipmentSlotKey = (typeof HERO_EQUIPMENT_SLOT_KEYS)[number];
export type HeroItemId = string;
export type HeroItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythical" | "unique";
export type HeroEquipment = Record<HeroEquipmentSlotKey, HeroItemId | null>;
export type HeroEquipmentSetGrade = "starter" | "low" | "mid" | "high" | "boss";

export interface HeroWeaponSharpening {
  level: number;
}

export type HeroWeaponSharpenings = Partial<Record<HeroItemId, HeroWeaponSharpening>>;
export type HeroWeaponEnchantment = HeroWeaponSharpening;
export type HeroWeaponEnchantments = HeroWeaponSharpenings;

export const HERO_ITEM_RARITIES: readonly HeroItemRarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythical", "unique"];
export const HERO_WEAPON_SHARPENING_ENABLED = false;
export const HERO_WEAPON_SHARPENING_MAX_LEVEL = 10;
export const HERO_WEAPON_SHARPENING_BASE_PRICE_RATIO = 0.1;
export const HERO_WEAPON_SHARPENING_PRICE_RATIO_PER_LEVEL = 0.05;
export const HERO_ARENA_ENERGY_MAX = 10;
export const HERO_ARENA_WIN_QUEST_GOAL = 5;
export const HERO_ARENA_WIN_QUEST_ENERGY_REWARD = 5;
export const HERO_ARENA_WIN_QUEST_GOLD_REWARD = 20;
export const HERO_SKILL_POINT_RESET_BASE_PRICE = 50;
export const HERO_SKILL_POINT_RESET_PRICE_STEP = 25;
const HERO_SPEAR_CLINCH_RANGE_BONUS_BY_RARITY: Readonly<Record<HeroItemRarity, number>> = {
  common: 0.2,
  uncommon: 0.25,
  rare: 0.3,
  epic: 0.35,
  legendary: 0.4,
  mythical: 0.45,
  unique: 0.4,
};
const HERO_SPEAR_LUNGE_MOVE_BONUS_BY_RARITY: Readonly<Record<HeroItemRarity, number>> = {
  common: 0.1,
  uncommon: 0.15,
  rare: 0.2,
  epic: 0.25,
  legendary: 0.3,
  mythical: 0.35,
  unique: 0.3,
};
const RANDOM_ENEMY_EQUIPMENT_DROP_CHANCES_BY_DIFFICULTY: Record<ArenaDifficultyId, number> = {
  easy: 0.05,
  medium: 0.08,
  hard: 0.12,
};
const RANDOM_ENEMY_EQUIPMENT_DROP_CHANCE_MULTIPLIERS_BY_TIER: Readonly<Partial<Record<number, number>>> = {
  1: 2,
};
const RANDOM_ENEMY_EQUIPMENT_LOOT_ENTRY_CHANCE = 1;
type RandomEnemyEquipmentDropRarityWeights = Partial<Record<HeroItemRarity, number>>;
const RANDOM_ENEMY_EQUIPMENT_DROP_RARITY_WEIGHTS_BY_TIER: Readonly<Record<number, RandomEnemyEquipmentDropRarityWeights>> = {
  1: { common: 85, uncommon: 15 },
  2: { common: 50, uncommon: 45, rare: 5 },
  3: { uncommon: 55, rare: 40, epic: 5 },
  4: { uncommon: 15, rare: 60, epic: 25 },
  5: { rare: 25, epic: 65, legendary: 10 },
  6: { rare: 10, epic: 65, legendary: 23, mythical: 2 },
  7: { epic: 35, legendary: 60, mythical: 5 },
  8: { epic: 20, legendary: 70, mythical: 10 },
  9: { epic: 10, legendary: 70, mythical: 20 },
  10: { legendary: 65, mythical: 35 },
};
const HERO_WEAPON_SHARPENING_ALLOWED_RARITIES: ReadonlySet<HeroItemRarity> = new Set(["epic", "legendary", "mythical", "unique"]);

interface PairedArmorSlotConfig {
  backSlot: HeroEquipmentSlotKey;
  frontSlot: HeroEquipmentSlotKey;
  token: string;
}

const PAIRED_ARMOR_SLOT_CONFIGS: readonly PairedArmorSlotConfig[] = [
  { backSlot: "backShoulderguard", frontSlot: "frontShoulderguard", token: "shoulderguard" },
  { backSlot: "backWrist", frontSlot: "frontWrist", token: "wrist" },
  { backSlot: "backGlove", frontSlot: "frontGlove", token: "glove" },
  { backSlot: "backGreave", frontSlot: "frontGreave", token: "greave" },
  { backSlot: "backShinguard", frontSlot: "frontShinguard", token: "shinguard" },
  { backSlot: "backBoot", frontSlot: "frontBoot", token: "boot" },
];

export interface HeroEquipmentSetInfo {
  id: string;
  name: string;
  rank: number;
  grade?: HeroEquipmentSetGrade;
}

export interface HeroEquipmentSetBonusDefinition {
  pieces: number;
  label: string;
  statBonuses?: Partial<HeroBaseStats>;
  maceArmorDamagePercentBonus?: number;
}

export interface HeroEquipmentSetBonusGroup {
  id: string;
  label: string;
  bonuses: readonly HeroEquipmentSetBonusDefinition[];
}

export interface HeroEquipmentSetBonusSummary {
  id: string;
  label: string;
  equippedPieces: number;
  bonuses: readonly (HeroEquipmentSetBonusDefinition & { active: boolean })[];
}

export interface HeroItemDefinition {
  id: HeroItemId;
  name: string;
  kind: "weapon" | "armor" | "scroll";
  rarity?: HeroItemRarity;
  weaponClass?: HeroWeaponClass;
  armorCategory?: "leather" | "cloth" | "chain" | "plate";
  equipmentSlot: HeroEquipmentSlotKey;
  armorHp?: number;
  damageBonus?: number;
  spearClinchRangeBonus?: number;
  spearLungeMoveBonus?: number;
  scrollEffect?: HeroScrollEffect;
  equipmentSet?: HeroEquipmentSetInfo;
  levelRequirement?: number;
  requirements?: Partial<HeroBaseStats>;
  statBonuses?: Partial<HeroBaseStats>;
}

export interface HeroScrollEffect {
  kind: "crackArmorSlot" | "fireballDamage" | "wardHit" | "preciseStrike" | "doubleStrike" | "poison";
}

export type HeroUpgradeableScrollKind = "crackArmor" | "fireball" | "ward" | "preciseStrike" | "doubleStrike" | "poison";
export type HeroScrollUpgradeRarity = Extract<HeroItemRarity, "common" | "uncommon" | "rare" | "epic" | "legendary">;
export type HeroScrollUpgrades = Partial<Record<HeroUpgradeableScrollKind, HeroScrollUpgradeRarity>>;

export interface HeroInventoryEntry {
  itemId: HeroItemId;
  quantity: number;
}

export interface BattleReward {
  gold: number;
  xp: number;
}

export interface HeroItemPurchase {
  itemIds: HeroItemId[];
  price: number;
}

export interface EnemyVisualPreset {
  skin: number;
  skinDark: number;
  hair: number;
  muscle?: number;
}

export interface EnemyLoadout {
  equipment: HeroEquipment;
  baseStats?: HeroBaseStats;
  maxHpOverride?: number;
  shurikenCount?: number;
  shurikenDamage?: number;
  shurikenItemId?: HeroItemId;
  scrollCount?: number;
  scrollItemId?: HeroItemId;
  crackArmorParts?: number;
  fireballScrollCount?: number;
  fireballScrollItemId?: HeroItemId;
  fireballDamage?: number;
  wardScrollCount?: number;
  wardScrollItemId?: HeroItemId;
  wardHitCount?: number;
  preciseStrikeScrollCount?: number;
  preciseStrikeScrollItemId?: HeroItemId;
  preciseStrikeBlockChanceReduction?: number;
  doubleStrikeScrollCount?: number;
  doubleStrikeScrollItemId?: HeroItemId;
  doubleStrikeDamageMultiplier?: number;
  poisonScrollCount?: number;
  poisonScrollItemId?: HeroItemId;
  poisonDamage?: number;
  visualPreset: EnemyVisualPreset;
}

export interface ArenaEncounter {
  id: string;
  kind: "random" | "boss";
  tierId: number;
  opponentId: string;
  difficultyId?: ArenaDifficultyId;
  backgroundVariantId?: string;
  mode?: "duoBossAi";
  name: string;
  enemyLoadout: EnemyLoadout;
  rewards: ArenaOpponentRewards;
  lootTable: readonly ArenaLootTableEntry[];
}

export interface ArenaLootDrop {
  sourceId: string;
  itemId: HeroItemId;
  itemIds?: HeroItemId[];
  quantity: number;
}

export interface CombatRewardApplication {
  reward: BattleReward;
  loot: ArenaLootDrop[];
  heroBeforeReward: HeroState;
  heroAfterReward: HeroState;
}

export interface CombatRewardOptions {
  recordBossVictory?: boolean;
  randomEnemyLootChanceMultiplier?: number;
}

export const DEFAULT_HERO_ID = "local-hero";
export const DEFAULT_HERO_NAME = "Borshemir";
export const HERO_MAX_LEVEL = 100;
export const HERO_LEVELS_PER_BOSS_TIER = 10;
export const HERO_TOTAL_XP_TO_MAX_LEVEL = 9999;
export const HERO_XP_TO_NEXT_LEVEL_BY_LEVEL: readonly number[] = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  26,
  27,
  28,
  29,
  30,
  33,
  34,
  35,
  36,
  37,
  39,
  40,
  41,
  42,
  43,
  55,
  56,
  57,
  58,
  59,
  61,
  62,
  63,
  64,
  65,
  80,
  81,
  82,
  83,
  84,
  86,
  87,
  88,
  89,
  90,
  115,
  116,
  117,
  118,
  119,
  121,
  122,
  123,
  124,
  125,
  165,
  166,
  167,
  168,
  169,
  171,
  172,
  173,
  174,
  175,
  215,
  216,
  217,
  218,
  219,
  221,
  222,
  223,
  224,
  225,
  258,
  259,
  260,
  261,
  262,
  263,
  265,
  266,
  267,
  268,
];
export const DEFAULT_HERO_XP_TO_NEXT_LEVEL = HERO_XP_TO_NEXT_LEVEL_BY_LEVEL[0]!;
export const HERO_STRENGTH_MELEE_DAMAGE_PERCENT_BONUS = 0.05;
export const HERO_STRENGTH_BODY_SCALE_BONUS = 0.005;
export const HERO_STRENGTH_CLINCH_RANGE_BONUS = 0.005;
export const HERO_STRENGTH_CLINCH_RANGE_MAX_BONUS = 0.50;
export const HERO_AGILITY_MOVEMENT_DISTANCE_BONUS = 0.015;
export const HERO_AGILITY_SPEAR_MELEE_DAMAGE_PERCENT_BONUS = 0.025;
export const HERO_AGILITY_SPEAR_LUNGE_DAMAGE_PERCENT_BONUS = 0.025;
export const HERO_AGILITY_BOW_DAMAGE_PERCENT_BONUS = 0.10;
export const HERO_VITALITY_HP_BONUS = 1;
export const HERO_VITALITY_STAMINA_BONUS = 1;
export const HERO_VITALITY_REST_HP_BONUS = 1;
export const HERO_VITALITY_REST_STAMINA_BONUS = 1;
export const HERO_EQUIPMENT_SET_BONUSES: Readonly<Record<string, HeroEquipmentSetBonusGroup>> = {
  wood_boss: {
    id: "wood_boss",
    label: "Oakhide Set",
    bonuses: [
      { pieces: 2, label: "Strength +1", statBonuses: { strength: 1 } },
      { pieces: 4, label: "Vitality +2", statBonuses: { vitality: 2 } },
      { pieces: 5, label: "Mace armor damage +10%", maceArmorDamagePercentBonus: 0.1 },
    ],
  },
};
export const HERO_SHURIKEN_MAX_QUANTITY = 2;
export const HERO_SCROLL_CAPACITY_BASE = 1;
export const HERO_SCROLL_CAPACITY_MAX = 5;
export const HERO_SCROLL_CAPACITY_UPGRADE_PRICES: Readonly<Record<number, number>> = {
  2: 500,
  3: 1000,
  4: 2000,
  5: 5000,
};
const HERO_SCROLL_CAPACITY_UPGRADE_UNLOCK_BOSS_TIER: Readonly<Record<number, number>> = {
  2: 2,
  3: 4,
  4: 6,
  5: 8,
};
export const HERO_SCROLL_MAX_QUANTITY = HERO_SCROLL_CAPACITY_MAX;
export const HERO_CRACK_ARMOR_SCROLL_ITEM_ID = "scroll_crack_armor_01";
export const HERO_FIREBALL_SCROLL_ITEM_ID = "scroll_fireball_01";
export const HERO_WARD_SCROLL_ITEM_ID = "scroll_ward_01";
export const HERO_PRECISE_STRIKE_SCROLL_ITEM_ID = "scroll_precise_strike_01";
export const HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID = "scroll_double_strike_01";
export const HERO_POISON_SCROLL_ITEM_ID = "scroll_poison_01";
export const HERO_PRECISE_STRIKE_HIT_COUNT = 3;
export const HERO_STARTING_SKILL_POINTS = 1;
export const ENEMY_SHURIKEN_ROLL_CHANCE = 0.25;
export const ENEMY_SHURIKEN_QUANTITY = 1;
export const ENEMY_SCROLL_QUANTITY = 1;
export const HERO_BOW_SHOT_CAPACITY_BASE = BOW_SHOTS_PER_BATTLE;
export const HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX = 10;
export const HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE = 500;
export const HERO_SCROLL_UPGRADE_RARITIES: readonly HeroScrollUpgradeRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
const HERO_SCROLL_UPGRADE_UNLOCK_BOSS_TIER: Readonly<Partial<Record<HeroScrollUpgradeRarity, number>>> = {
  uncommon: 2,
  rare: 4,
  epic: 6,
  legendary: 8,
};

const ENEMY_SCROLL_ROLLS_BY_TIER: Readonly<Record<number, { chance: number; rarity: HeroScrollUpgradeRarity }>> = {
  1: { chance: 0.1, rarity: "common" },
  2: { chance: 0.2, rarity: "common" },
  3: { chance: 0.3, rarity: "uncommon" },
  4: { chance: 0.4, rarity: "uncommon" },
  5: { chance: 0.5, rarity: "rare" },
  6: { chance: 0.6, rarity: "rare" },
  7: { chance: 0.7, rarity: "epic" },
  8: { chance: 0.8, rarity: "epic" },
  9: { chance: 0.9, rarity: "legendary" },
  10: { chance: 1, rarity: "legendary" },
};

const ENEMY_SCROLL_DIFFICULTY_CHANCE_MODIFIERS: Readonly<Record<ArenaDifficultyId, number>> = {
  easy: -0.1,
  medium: 0,
  hard: 0.1,
};

interface HeroScrollUpgradeDefinition {
  kind: HeroUpgradeableScrollKind;
  itemId: HeroItemId;
  purchasePrices: Record<HeroScrollUpgradeRarity, number>;
  upgradePrices: Partial<Record<HeroScrollUpgradeRarity, number>>;
  crackArmorParts?: Record<HeroScrollUpgradeRarity, number>;
  fireballDamage?: Record<HeroScrollUpgradeRarity, number>;
  wardHitCount?: Record<HeroScrollUpgradeRarity, number>;
  preciseBlockChanceReduction?: Record<HeroScrollUpgradeRarity, number>;
  doubleStrikeDamageMultiplier?: Record<HeroScrollUpgradeRarity, number>;
  poisonDamage?: Record<HeroScrollUpgradeRarity, number>;
}

const HERO_SCROLL_UPGRADE_DEFINITIONS: Record<HeroUpgradeableScrollKind, HeroScrollUpgradeDefinition> = {
  crackArmor: {
    kind: "crackArmor",
    itemId: HERO_CRACK_ARMOR_SCROLL_ITEM_ID,
    purchasePrices: {
      common: 36,
      uncommon: 144,
      rare: 300,
      epic: 700,
      legendary: 1500,
    },
    upgradePrices: {
      common: 900,
      uncommon: 2600,
      rare: 6500,
      epic: 14000,
    },
    crackArmorParts: {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    },
  },
  fireball: {
    kind: "fireball",
    itemId: HERO_FIREBALL_SCROLL_ITEM_ID,
    purchasePrices: {
      common: 50,
      uncommon: 108,
      rare: 200,
      epic: 425,
      legendary: 800,
    },
    upgradePrices: {
      common: 900,
      uncommon: 2600,
      rare: 6500,
      epic: 14000,
    },
    fireballDamage: {
      common: FIREBALL_SCROLL_DAMAGE,
      uncommon: 70,
      rare: 110,
      epic: 150,
      legendary: 200,
    },
  },
  ward: {
    kind: "ward",
    itemId: HERO_WARD_SCROLL_ITEM_ID,
    purchasePrices: {
      common: 36,
      uncommon: 108,
      rare: 220,
      epic: 500,
      legendary: 1000,
    },
    upgradePrices: {
      common: 800,
      uncommon: 2300,
      rare: 5800,
      epic: 12000,
    },
    wardHitCount: {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    },
  },
  preciseStrike: {
    kind: "preciseStrike",
    itemId: HERO_PRECISE_STRIKE_SCROLL_ITEM_ID,
    purchasePrices: {
      common: 36,
      uncommon: 72,
      rare: 120,
      epic: 250,
      legendary: 500,
    },
    upgradePrices: {
      common: 600,
      uncommon: 1800,
      rare: 4500,
      epic: 9000,
    },
    preciseBlockChanceReduction: {
      common: 0.1,
      uncommon: 0.15,
      rare: 0.2,
      epic: 0.25,
      legendary: 0.3,
    },
  },
  doubleStrike: {
    kind: "doubleStrike",
    itemId: HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID,
    purchasePrices: {
      common: 36,
      uncommon: 90,
      rare: 160,
      epic: 350,
      legendary: 700,
    },
    upgradePrices: {
      common: 700,
      uncommon: 2100,
      rare: 5200,
      epic: 10500,
    },
    doubleStrikeDamageMultiplier: {
      common: 0.4,
      uncommon: 0.55,
      rare: 0.7,
      epic: 0.85,
      legendary: 1,
    },
  },
  poison: {
    kind: "poison",
    itemId: HERO_POISON_SCROLL_ITEM_ID,
    purchasePrices: {
      common: 42,
      uncommon: 90,
      rare: 160,
      epic: 325,
      legendary: 650,
    },
    upgradePrices: {
      common: 700,
      uncommon: 2100,
      rare: 5200,
      epic: 10500,
    },
    poisonDamage: {
      common: POISON_SCROLL_DAMAGE,
      uncommon: 6,
      rare: 7,
      epic: 8,
      legendary: 10,
    },
  },
};

const HERO_SCROLL_UPGRADE_KIND_BY_ITEM_ID: Partial<Record<HeroItemId, HeroUpgradeableScrollKind>> = Object.fromEntries(
  Object.values(HERO_SCROLL_UPGRADE_DEFINITIONS).map((definition) => [definition.itemId, definition.kind]),
) as Partial<Record<HeroItemId, HeroUpgradeableScrollKind>>;

const HERO_SCROLL_ITEMS: Record<HeroItemId, HeroItemDefinition> = {
  [HERO_CRACK_ARMOR_SCROLL_ITEM_ID]: {
    id: HERO_CRACK_ARMOR_SCROLL_ITEM_ID,
    name: "Crack Armor Scroll",
    kind: "scroll",
    rarity: "common",
    equipmentSlot: "weaponMain",
    scrollEffect: {
      kind: "crackArmorSlot",
    },
  },
  [HERO_FIREBALL_SCROLL_ITEM_ID]: {
    id: HERO_FIREBALL_SCROLL_ITEM_ID,
    name: "Fireball Scroll",
    kind: "scroll",
    rarity: "common",
    equipmentSlot: "weaponMain",
    scrollEffect: {
      kind: "fireballDamage",
    },
  },
  [HERO_WARD_SCROLL_ITEM_ID]: {
    id: HERO_WARD_SCROLL_ITEM_ID,
    name: "Ward Scroll",
    kind: "scroll",
    rarity: "common",
    equipmentSlot: "weaponMain",
    scrollEffect: {
      kind: "wardHit",
    },
  },
  [HERO_PRECISE_STRIKE_SCROLL_ITEM_ID]: {
    id: HERO_PRECISE_STRIKE_SCROLL_ITEM_ID,
    name: "Precise Strike Scroll",
    kind: "scroll",
    rarity: "common",
    equipmentSlot: "weaponMain",
    scrollEffect: {
      kind: "preciseStrike",
    },
  },
  [HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID]: {
    id: HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID,
    name: "Double Strike Scroll",
    kind: "scroll",
    rarity: "common",
    equipmentSlot: "weaponMain",
    scrollEffect: {
      kind: "doubleStrike",
    },
  },
  [HERO_POISON_SCROLL_ITEM_ID]: {
    id: HERO_POISON_SCROLL_ITEM_ID,
    name: "Poison Scroll",
    kind: "scroll",
    rarity: "common",
    equipmentSlot: "weaponMain",
    scrollEffect: {
      kind: "poison",
    },
  },
};
export const HERO_ITEM_IDS = [...GENERATED_EQUIPMENT_ITEM_IDS, ...Object.keys(HERO_SCROLL_ITEMS)] as readonly HeroItemId[];
export const ALL_HERO_ITEM_IDS = HERO_ITEM_IDS;
export const HERO_ITEM_CATALOG: Record<HeroItemId, HeroItemDefinition> = {
  ...GENERATED_EQUIPMENT_ITEM_CATALOG,
  ...HERO_SCROLL_ITEMS,
};

export const DEFAULT_ENEMY_VISUAL_PRESET: EnemyVisualPreset = {
  skin: 0xefaa7b,
  skinDark: 0xd9854d,
  hair: 0x8b4a1f,
  muscle: 0x9b5a35,
};

export const ENEMY_VISUAL_PRESETS: EnemyVisualPreset[] = [DEFAULT_ENEMY_VISUAL_PRESET];

export function createRandomEnemyLoadout(
  random = Math.random,
  tierId = DEFAULT_ARENA_TIER_ID,
  difficultyId: ArenaDifficultyId = DEFAULT_ARENA_DIFFICULTY_ID,
): EnemyLoadout {
  const tier = resolveArenaTierDefinition(tierId);

  return createRandomEnemyLoadoutFromPools(tier.enemyEquipmentPools, random, tier.id, difficultyId);
}

export function createArenaRandomEnemyEncounter(
  tierId = DEFAULT_ARENA_TIER_ID,
  difficultyOrRandom: ArenaDifficultyId | (() => number) = DEFAULT_ARENA_DIFFICULTY_ID,
  random = Math.random,
): ArenaEncounter {
  const tier = resolveArenaTierDefinition(tierId);
  const difficultyId = typeof difficultyOrRandom === "function" ? DEFAULT_ARENA_DIFFICULTY_ID : difficultyOrRandom;
  const encounterRandom = typeof difficultyOrRandom === "function" ? difficultyOrRandom : random;
  const difficultyOpponents = resolveArenaRandomOpponentsForTier(tier.id).filter((opponent) => opponent.difficultyId === difficultyId);
  const opponents = difficultyOpponents.length > 0 ? difficultyOpponents : resolveArenaRandomOpponentsForTier(tier.id);
  const opponent = opponents.length > 0 ? pickRandom(opponents, encounterRandom) : createFallbackRandomOpponent(tier);
  const enemyLoadout = createRandomEnemyLoadoutForOpponent(opponent, encounterRandom);

  return {
    id: `random:${opponent.id}`,
    kind: "random",
    tierId: opponent.tierId,
    opponentId: opponent.id,
    difficultyId: opponent.difficultyId,
    name: pickRandomArenaOpponentName(encounterRandom),
    enemyLoadout,
    rewards: opponent.rewards,
    lootTable: [],
  };
}

export function createArenaBossEncounter(bossId: string): ArenaEncounter {
  const boss = resolveArenaBossDefinition(bossId);

  if (!boss) {
    throw new Error(`Unknown arena boss: ${bossId}.`);
  }

  return {
    id: `boss:${boss.id}`,
    kind: "boss",
    tierId: boss.tierId,
    opponentId: boss.id,
    name: boss.name,
    enemyLoadout: createBossEnemyLoadout(boss),
    rewards: boss.rewards,
    lootTable: boss.lootTable,
  };
}

function createRandomEnemyLoadoutFromPools(
  equipmentPools: readonly ArenaGeneratedEquipmentPool[],
  random = Math.random,
  tierId = DEFAULT_ARENA_TIER_ID,
  difficultyId: ArenaDifficultyId = DEFAULT_ARENA_DIFFICULTY_ID,
): EnemyLoadout {
  const equipment = createDefaultHeroEquipment();
  const shurikenItemId = rollEnemyShurikenItemIdFromPools(equipmentPools, random);

  equipmentPools.forEach((equipmentPool) => {
    HERO_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
      if (equipment[slotKey]) {
        return;
      }

      const itemIds = getEnemyItemIdsBySlot(slotKey, equipmentPool.itemRarities);
      const rollChance = getEnemyEquipmentSlotRollChance(equipmentPool, slotKey);

      if (itemIds.length === 0 || random() >= rollChance) {
        return;
      }

      equipment[slotKey] = pickRandom(itemIds, random);
    });
  });

  const scrollRoll = rollEnemyScrollFromTier(tierId, difficultyId, random);

  return {
    equipment,
    ...(shurikenItemId
      ? {
          shurikenCount: ENEMY_SHURIKEN_QUANTITY,
          shurikenDamage: getShurikenItemDamage(shurikenItemId),
          shurikenItemId,
        }
      : {}),
    ...createEnemyScrollLoadout(scrollRoll?.itemId, scrollRoll?.rarity),
    visualPreset: pickRandom(ENEMY_VISUAL_PRESETS, random),
  };
}

function createRandomEnemyLoadoutForOpponent(opponent: ArenaRandomOpponentDefinition, random = Math.random): EnemyLoadout {
  const baseStats = createRandomOpponentBaseStats(opponent, random);
  const maxHpOverride = getArenaOpponentMaxHpOverride(opponent);

  return {
    ...createRandomEnemyLoadoutFromPools(opponent.equipmentPools, random, opponent.tierId, opponent.difficultyId),
    ...(baseStats ? { baseStats } : {}),
    ...(maxHpOverride ? { maxHpOverride } : {}),
  };
}

function pickRandomArenaOpponentName(random: () => number): string {
  return RANDOM_ARENA_OPPONENT_NAMES.length > 0 ? pickRandom(RANDOM_ARENA_OPPONENT_NAMES, random) : "Arena Opponent";
}

function createRandomOpponentBaseStats(opponent: ArenaRandomOpponentDefinition, random: () => number): HeroBaseStats | undefined {
  if (opponent.baseStats) {
    return { ...opponent.baseStats };
  }

  const pointCount = Math.max(0, Math.floor(opponent.randomBaseStatPoints ?? 0));

  if (pointCount <= 0) {
    return undefined;
  }

  const baseStats: HeroBaseStats = { strength: 0, agility: 0, vitality: 0 };

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const attribute = pickRandom(HERO_ATTRIBUTE_KEYS, random);

    baseStats[attribute] += 1;
  }

  return baseStats;
}

function getArenaOpponentMaxHpOverride(opponent: ArenaRandomOpponentDefinition): number | undefined {
  if (typeof opponent.maxHp !== "number" || !Number.isFinite(opponent.maxHp)) {
    return undefined;
  }

  return Math.max(1, Math.floor(opponent.maxHp));
}

function createBossEnemyLoadout(boss: ArenaBossDefinition): EnemyLoadout {
  return {
    baseStats: { ...boss.baseStats },
    equipment: {
      ...createDefaultHeroEquipment(),
      ...boss.equipment,
    },
    visualPreset: { ...DEFAULT_ENEMY_VISUAL_PRESET },
  };
}

function createFallbackRandomOpponent(tier: ArenaTierDefinition): ArenaRandomOpponentDefinition {
  return {
    id: `tier_${tier.id}_fallback`,
    tierId: tier.id,
    difficultyId: DEFAULT_ARENA_DIFFICULTY_ID,
    equipmentPools: tier.enemyEquipmentPools,
    rewards: {
      win: BATTLE_WIN_REWARD,
      loss: BATTLE_LOSS_REWARD,
    },
  };
}

export function createDefaultHeroEquipment(): HeroEquipment {
  return Object.fromEntries(HERO_EQUIPMENT_SLOT_KEYS.map((slotKey) => [slotKey, null])) as HeroEquipment;
}

export function createHeroPreviewEquipment(baseEquipment: HeroEquipment, itemIds: readonly HeroItemId[]): HeroEquipment {
  const equipment: HeroEquipment = { ...baseEquipment };

  itemIds.forEach((itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    if (!isHeroEquipmentPreviewItem(item)) {
      return;
    }

    equipment[item.equipmentSlot] = itemId;
  });

  return equipment;
}

export function createDefaultHeroAppearance(): HeroAppearance {
  return { ...DEFAULT_HERO_APPEARANCE };
}

export function createDefaultHeroInventory(): HeroInventoryEntry[] {
  return [];
}

export function createDefaultHero(now = new Date().toISOString()): HeroState {
  const arenaEnergy = createHeroArenaEnergy(now);

  return {
    id: DEFAULT_HERO_ID,
    name: DEFAULT_HERO_NAME,
    level: 1,
    xp: 0,
    xpToNextLevel: DEFAULT_HERO_XP_TO_NEXT_LEVEL,
    skillPoints: HERO_STARTING_SKILL_POINTS,
    gold: 0,
    totalWins: 0,
    arenaWinQuest: createHeroArenaWinQuest(),
    arenaEnergy,
    arenaBossVictoryLedger: createHeroArenaBossVictoryLedger(now),
    bowShotCapacity: HERO_BOW_SHOT_CAPACITY_BASE,
    scrollCapacity: HERO_SCROLL_CAPACITY_BASE,
    baseStats: {
      strength: 0,
      agility: 0,
      vitality: 0,
    },
    appearance: createDefaultHeroAppearance(),
    equipment: createDefaultHeroEquipment(),
    weaponEnchantments: {},
    scrollUpgrades: {},
    inventory: createDefaultHeroInventory(),
    unlockedShopRarities: [],
    defeatedArenaBossIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getUtcDayKey(now: string | Date = new Date()): string {
  const date = typeof now === "string" ? new Date(now) : now;

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

export function createHeroArenaEnergy(now: string | Date = new Date()): HeroArenaEnergy {
  return {
    current: HERO_ARENA_ENERGY_MAX,
    max: HERO_ARENA_ENERGY_MAX,
    dayKey: getUtcDayKey(now),
  };
}

export function createHeroArenaBossVictoryLedger(now: string | Date = new Date()): HeroArenaBossVictoryLedger {
  return {
    dayKey: getUtcDayKey(now),
    tierIds: [],
  };
}

export function getHeroArenaBossVictoryLedger(hero: HeroState, now: string | Date = new Date()): HeroArenaBossVictoryLedger {
  const dayKey = getUtcDayKey(now);
  const source = hero.arenaBossVictoryLedger;

  if (!source || source.dayKey !== dayKey) {
    return createHeroArenaBossVictoryLedger(now);
  }

  return {
    dayKey,
    tierIds: Array.from(new Set((source.tierIds ?? [])
      .map((tierId) => Math.floor(tierId))
      .filter((tierId) => Number.isFinite(tierId) && tierId > 0))),
  };
}

export function hasHeroArenaBossVictoryForTier(hero: HeroState, tierId: number, now: string | Date = new Date()): boolean {
  const normalizedTierId = Math.floor(tierId);

  if (!Number.isFinite(normalizedTierId) || normalizedTierId <= 0) {
    return false;
  }

  return getHeroArenaBossVictoryLedger(hero, now).tierIds.includes(normalizedTierId);
}

export function resetHeroArenaBossVictoryLedger(hero: HeroState, now = new Date().toISOString()): HeroState {
  const ledger = createHeroArenaBossVictoryLedger(now);
  const currentLedger = getHeroArenaBossVictoryLedger(hero, now);

  if (hero.arenaBossVictoryLedger?.dayKey === ledger.dayKey && currentLedger.tierIds.length === 0) {
    return hero;
  }

  return {
    ...hero,
    arenaBossVictoryLedger: ledger,
    updatedAt: now,
  };
}

export function recordHeroArenaBossVictoryForTier(hero: HeroState, tierId: number, now = new Date().toISOString()): HeroState {
  const normalizedTierId = Math.floor(tierId);

  if (!Number.isFinite(normalizedTierId) || normalizedTierId <= 0) {
    return hero;
  }

  const ledger = getHeroArenaBossVictoryLedger(hero, now);

  if (ledger.tierIds.includes(normalizedTierId)) {
    if (hero.arenaBossVictoryLedger?.dayKey === ledger.dayKey) {
      return hero;
    }

    return {
      ...hero,
      arenaBossVictoryLedger: ledger,
      updatedAt: now,
    };
  }

  return {
    ...hero,
    arenaBossVictoryLedger: {
      dayKey: ledger.dayKey,
      tierIds: [...ledger.tierIds, normalizedTierId],
    },
    updatedAt: now,
  };
}

export function getHeroArenaEnergy(hero: HeroState, now: string | Date = new Date()): HeroArenaEnergy {
  const dayKey = getUtcDayKey(now);
  const source = hero.arenaEnergy;

  if (!source || source.dayKey !== dayKey) {
    return createHeroArenaEnergy(now);
  }

  return {
    current: clampHeroArenaEnergyValue(source.current),
    max: HERO_ARENA_ENERGY_MAX,
    dayKey,
  };
}

export function getHeroTotalWins(hero: HeroState): number {
  const source = hero.totalWins;

  if (typeof source !== "number" || !Number.isFinite(source)) {
    return 0;
  }

  return Math.max(0, Math.floor(source));
}

export function createHeroArenaWinQuest(wins = 0, claimed = false, lastOpenedDayKey?: string | null): HeroArenaWinQuest {
  const openedDayKey = typeof lastOpenedDayKey === "string" && lastOpenedDayKey.length > 0 ? lastOpenedDayKey : undefined;

  return {
    wins: Math.min(HERO_ARENA_WIN_QUEST_GOAL, Math.max(0, Math.floor(Number.isFinite(wins) ? wins : 0))),
    claimed: Boolean(claimed),
    ...(openedDayKey ? { lastOpenedDayKey: openedDayKey } : {}),
  };
}

export function getHeroArenaWinQuest(hero: HeroState): HeroArenaWinQuest {
  return createHeroArenaWinQuest(
    hero.arenaWinQuest?.wins ?? 0,
    hero.arenaWinQuest?.claimed ?? false,
    hero.arenaWinQuest?.lastOpenedDayKey,
  );
}

export function getHeroArenaWinQuestStatus(hero: HeroState, now: string | Date = new Date()): HeroArenaWinQuestStatus {
  const quest = getHeroArenaWinQuest(hero);

  return {
    wins: quest.wins,
    goal: HERO_ARENA_WIN_QUEST_GOAL,
    claimed: quest.claimed,
    ready: quest.wins >= HERO_ARENA_WIN_QUEST_GOAL && !quest.claimed,
    openedToday: quest.lastOpenedDayKey === getUtcDayKey(now),
    rewards: {
      arenaEnergy: HERO_ARENA_WIN_QUEST_ENERGY_REWARD,
      gold: HERO_ARENA_WIN_QUEST_GOLD_REWARD,
    },
  };
}

export function markHeroArenaWinQuestOpened(hero: HeroState, now = new Date().toISOString()): HeroState {
  const quest = getHeroArenaWinQuest(hero);
  const dayKey = getUtcDayKey(now);

  if (quest.lastOpenedDayKey === dayKey) {
    return hero;
  }

  return {
    ...hero,
    arenaWinQuest: createHeroArenaWinQuest(quest.wins, quest.claimed, dayKey),
    updatedAt: now,
  };
}

function recordHeroArenaWinQuestProgress(hero: HeroState, now = new Date().toISOString()): HeroState {
  const quest = getHeroArenaWinQuest(hero);

  if (quest.claimed || quest.wins >= HERO_ARENA_WIN_QUEST_GOAL) {
    return hero.arenaWinQuest ? hero : { ...hero, arenaWinQuest: quest, updatedAt: now };
  }

  return {
    ...hero,
    arenaWinQuest: createHeroArenaWinQuest(quest.wins + 1, false, quest.lastOpenedDayKey),
    updatedAt: now,
  };
}

export function refreshHeroArenaEnergy(hero: HeroState, now = new Date().toISOString()): HeroState {
  const arenaEnergy = getHeroArenaEnergy(hero, now);
  const source = hero.arenaEnergy;

  if (source && source.current === arenaEnergy.current && source.max === arenaEnergy.max && source.dayKey === arenaEnergy.dayKey) {
    return hero;
  }

  return {
    ...hero,
    arenaEnergy,
    updatedAt: now,
  };
}

export function restoreHeroArenaEnergy(hero: HeroState, now = new Date().toISOString()): HeroState {
  const arenaEnergy = createHeroArenaEnergy(now);

  if (hero.arenaEnergy?.current === arenaEnergy.current && hero.arenaEnergy.max === arenaEnergy.max && hero.arenaEnergy.dayKey === arenaEnergy.dayKey) {
    return hero;
  }

  return {
    ...hero,
    arenaEnergy,
    updatedAt: now,
  };
}

export function grantHeroArenaEnergy(hero: HeroState, amount: number, now = new Date().toISOString()): HeroState {
  const arenaEnergy = getHeroArenaEnergy(hero, now);
  const grantAmount = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));

  if (grantAmount <= 0 || arenaEnergy.current >= arenaEnergy.max) {
    return refreshHeroArenaEnergy(hero, now);
  }

  const nextArenaEnergy: HeroArenaEnergy = {
    ...arenaEnergy,
    current: clampHeroArenaEnergyValue(arenaEnergy.current + grantAmount),
  };

  if (nextArenaEnergy.current === arenaEnergy.current) {
    return refreshHeroArenaEnergy(hero, now);
  }

  return {
    ...hero,
    arenaEnergy: nextArenaEnergy,
    updatedAt: now,
  };
}

export function spendHeroArenaEnergy(
  hero: HeroState,
  amount = 1,
  now = new Date().toISOString(),
): { ok: true; hero: HeroState; arenaEnergy: HeroArenaEnergy } | { ok: false; hero: HeroState; arenaEnergy: HeroArenaEnergy } {
  const arenaEnergy = getHeroArenaEnergy(hero, now);
  const spendAmount = clampHeroArenaEnergySpendAmount(amount);

  if (arenaEnergy.current < spendAmount) {
    return {
      ok: false,
      hero: refreshHeroArenaEnergy(hero, now),
      arenaEnergy,
    };
  }

  const nextArenaEnergy: HeroArenaEnergy = {
    ...arenaEnergy,
    current: arenaEnergy.current - spendAmount,
  };

  return {
    ok: true,
    hero: {
      ...hero,
      arenaEnergy: nextArenaEnergy,
      updatedAt: now,
    },
    arenaEnergy: nextArenaEnergy,
  };
}

function clampHeroArenaEnergySpendAmount(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(HERO_ARENA_ENERGY_MAX, Math.floor(value)));
}

function clampHeroArenaEnergyValue(value: number): number {
  if (!Number.isFinite(value)) {
    return HERO_ARENA_ENERGY_MAX;
  }

  return Math.max(0, Math.min(HERO_ARENA_ENERGY_MAX, Math.floor(value)));
}

export function deriveHeroStats(hero: HeroState): HeroStats {
  return deriveFighterStats(hero.baseStats, hero.equipment, undefined, hero.weaponEnchantments, true);
}

function deriveFighterStats(
  baseStats: HeroBaseStats,
  equipment: HeroEquipment,
  armorOverride?: number,
  weaponSharpenings?: HeroWeaponSharpenings,
  includeEquipmentSetBonuses = false,
): HeroStats {
  const equipmentBonuses = getHeroEquipmentStatBonuses(equipment);
  const equipmentSetBonuses = includeEquipmentSetBonuses ? getHeroEquipmentSetStatBonuses(equipment) : { strength: 0, agility: 0, vitality: 0 };
  const armorBonus = armorOverride ?? getHeroEquipmentArmor(equipment);
  const mainWeaponItem = getHeroEquipmentSlotItem(equipment, "weaponMain");
  const mainWeaponDamageBonus = Math.max(0, mainWeaponItem?.damageBonus ?? 0) + getHeroWeaponSharpeningDamageBonus(weaponSharpenings, equipment.weaponMain);
  const strengthBonus = getHeroAttributeTotal(baseStats.strength, equipmentBonuses.strength + equipmentSetBonuses.strength);
  const agilityBonus = getHeroAttributeTotal(baseStats.agility, equipmentBonuses.agility + equipmentSetBonuses.agility);
  const vitalityBonus = getHeroAttributeTotal(baseStats.vitality, equipmentBonuses.vitality + equipmentSetBonuses.vitality);
  const bowWeaponDamageBonus = Math.round(
    getHeroEquipmentSlotDamageBonus(equipment, "weaponBow") * getAgilityBowDamageMultiplier(agilityBonus),
  );

  return {
    maxHp: MAX_HP + vitalityBonus * HERO_VITALITY_HP_BONUS,
    maxArmor: armorBonus,
    maxStamina: MAX_STAMINA + vitalityBonus * HERO_VITALITY_STAMINA_BONUS,
    damageBonus: mainWeaponDamageBonus,
    weaponDamageBonus: bowWeaponDamageBonus,
    meleeDamagePercentBonus: roundStatBonus(strengthBonus * HERO_STRENGTH_MELEE_DAMAGE_PERCENT_BONUS),
    maceArmorDamagePercentBonus: includeEquipmentSetBonuses ? getHeroEquipmentSetMaceArmorDamagePercentBonus(equipment) : 0,
    spearMeleeDamagePercentBonus: roundStatBonus(agilityBonus * HERO_AGILITY_SPEAR_MELEE_DAMAGE_PERCENT_BONUS),
    spearLungeDamagePercentBonus: roundStatBonus(agilityBonus * HERO_AGILITY_SPEAR_LUNGE_DAMAGE_PERCENT_BONUS),
    spearClinchRangeBonus: getHeroItemSpearClinchRangeBonus(mainWeaponItem),
    spearLungeMoveBonus: getHeroItemSpearLungeMoveBonus(mainWeaponItem),
    movementDistanceBonus: roundStatBonus(agilityBonus * HERO_AGILITY_MOVEMENT_DISTANCE_BONUS),
    bodyScaleBonus: roundStatBonus(strengthBonus * HERO_STRENGTH_BODY_SCALE_BONUS),
    clinchRangeBonus: roundStatBonus(Math.min(HERO_STRENGTH_CLINCH_RANGE_MAX_BONUS, strengthBonus * HERO_STRENGTH_CLINCH_RANGE_BONUS)),
    restHpRestoreBonus: vitalityBonus * HERO_VITALITY_REST_HP_BONUS,
    restStaminaRestoreBonus: vitalityBonus * HERO_VITALITY_REST_STAMINA_BONUS,
  };
}

export function getAgilityBowDamageMultiplier(agility: number): number {
  return 1 + Math.max(0, Math.floor(agility)) * HERO_AGILITY_BOW_DAMAGE_PERCENT_BONUS;
}

export function getEquippedHeroItems(equipment: HeroEquipment): HeroItemDefinition[] {
  return HERO_EQUIPMENT_SLOT_KEYS.flatMap((slotKey) => {
    const itemId = equipment[slotKey];
    const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

    return item && item.equipmentSlot === slotKey && !isHeroConsumableItem(item) ? [item] : [];
  });
}

export function isHeroItemOwned(hero: HeroState, itemId: HeroItemId): boolean {
  const item = HERO_ITEM_CATALOG[itemId];
  const isEquipped = item && !isHeroConsumableItem(item) ? hero.equipment[item.equipmentSlot] === itemId : false;

  return isEquipped || hero.inventory.some((entry) => entry.itemId === itemId && entry.quantity > 0);
}

export function areHeroItemsOwned(hero: HeroState, itemIds: readonly HeroItemId[]): boolean {
  return itemIds.every((itemId) => isHeroItemOwned(hero, itemId));
}

export function areHeroItemsEquipped(hero: HeroState, itemIds: readonly HeroItemId[]): boolean {
  return itemIds.every((itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    return Boolean(item && !isHeroConsumableItem(item) && hero.equipment[item.equipmentSlot] === itemId);
  });
}

export function getActiveSharpenableHeroWeaponItemId(hero: HeroState): HeroItemId | undefined {
  if (!HERO_WEAPON_SHARPENING_ENABLED) {
    return undefined;
  }

  const itemId = hero.equipment.weaponMain;
  const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;
  const weaponClass = getHeroItemWeaponClass(item);

  if (
    !item ||
    item.kind !== "weapon" ||
    item.equipmentSlot !== "weaponMain" ||
    weaponClass === "shuriken" ||
    weaponClass === "bow" ||
    !HERO_WEAPON_SHARPENING_ALLOWED_RARITIES.has(item.rarity ?? "common")
  ) {
    return undefined;
  }

  return itemId ?? undefined;
}

export function getHeroWeaponSharpening(
  sharpenings: HeroWeaponSharpenings | undefined,
  itemId: HeroItemId | null | undefined,
): HeroWeaponSharpening | undefined {
  return itemId ? sharpenings?.[itemId] : undefined;
}

export function getHeroWeaponSharpeningLevel(sharpenings: HeroWeaponSharpenings | undefined, itemId: HeroItemId | null | undefined): number {
  if (!HERO_WEAPON_SHARPENING_ENABLED) {
    return 0;
  }

  return Math.max(0, Math.min(HERO_WEAPON_SHARPENING_MAX_LEVEL, Math.floor(getHeroWeaponSharpening(sharpenings, itemId)?.level ?? 0)));
}

export function getHeroWeaponSharpeningDamageBonus(sharpenings: HeroWeaponSharpenings | undefined, itemId: HeroItemId | null | undefined): number {
  return getHeroWeaponSharpeningLevel(sharpenings, itemId);
}

export function getHeroActiveWeaponSharpeningPrice(hero: HeroState): number | undefined {
  if (!HERO_WEAPON_SHARPENING_ENABLED) {
    return undefined;
  }

  const itemId = getActiveSharpenableHeroWeaponItemId(hero);
  const itemPrice = getHeroWeaponProductPrice(itemId);

  if (itemPrice === undefined) {
    return undefined;
  }

  const currentLevel = getHeroWeaponSharpeningLevel(hero.weaponEnchantments, itemId);

  if (currentLevel >= HERO_WEAPON_SHARPENING_MAX_LEVEL) {
    return undefined;
  }

  const priceRatio = HERO_WEAPON_SHARPENING_BASE_PRICE_RATIO + HERO_WEAPON_SHARPENING_PRICE_RATIO_PER_LEVEL * currentLevel;

  return Math.max(0, Math.ceil(itemPrice * priceRatio));
}

function getHeroWeaponProductPrice(itemId: HeroItemId | null | undefined): number | undefined {
  const product = itemId ? GENERATED_WEAPON_PRODUCTS.find((candidate) => candidate.itemIds.includes(itemId)) : undefined;

  return product?.price;
}

export function canSharpenHeroActiveWeapon(hero: HeroState): boolean {
  if (!HERO_WEAPON_SHARPENING_ENABLED) {
    return false;
  }

  const price = getHeroActiveWeaponSharpeningPrice(hero);

  return price !== undefined && hero.gold >= price;
}

export function sharpenHeroActiveWeapon(hero: HeroState, now = new Date().toISOString()): HeroState {
  if (!HERO_WEAPON_SHARPENING_ENABLED) {
    void now;
    return hero;
  }

  const itemId = getActiveSharpenableHeroWeaponItemId(hero);
  const price = getHeroActiveWeaponSharpeningPrice(hero);

  if (!itemId || price === undefined || hero.gold < price) {
    return hero;
  }

  const currentLevel = getHeroWeaponSharpeningLevel(hero.weaponEnchantments, itemId);

  return {
    ...hero,
    gold: hero.gold - price,
    weaponEnchantments: {
      ...hero.weaponEnchantments,
      [itemId]: { level: Math.min(HERO_WEAPON_SHARPENING_MAX_LEVEL, currentLevel + 1) },
    },
    updatedAt: now,
  };
}

export function getHeroEquipmentStatBonuses(equipment: HeroEquipment): HeroBaseStats {
  return getEquippedHeroItems(equipment).reduce(
    (bonuses, item) => ({
      strength: bonuses.strength + (item.statBonuses?.strength ?? 0),
      agility: bonuses.agility + (item.statBonuses?.agility ?? 0),
      vitality: bonuses.vitality + (item.statBonuses?.vitality ?? 0),
    }),
    { strength: 0, agility: 0, vitality: 0 },
  );
}

export function getHeroEquipmentSetBonusSummary(item: HeroItemDefinition, equipment: HeroEquipment | undefined): HeroEquipmentSetBonusSummary | undefined {
  const setId = item.equipmentSet?.id;
  const bonusGroup = setId ? HERO_EQUIPMENT_SET_BONUSES[setId] : undefined;

  if (!setId || !bonusGroup) {
    return undefined;
  }

  const equippedPieces = equipment ? getHeroEquipmentSetEquippedPieceCount(equipment, setId) : 0;

  return {
    id: setId,
    label: bonusGroup.label,
    equippedPieces,
    bonuses: bonusGroup.bonuses.map((bonus) => ({
      ...bonus,
      active: equippedPieces >= bonus.pieces,
    })),
  };
}

export function getHeroEquipmentSetEquippedPieceCount(equipment: HeroEquipment, setId: string): number {
  const pieceKeys = new Set<string>();

  HERO_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    const itemId = equipment[slotKey];
    const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

    if (!item || isHeroConsumableItem(item) || item.equipmentSet?.id !== setId) {
      return;
    }

    pieceKeys.add(getHeroEquipmentSetPieceKey(slotKey));
  });

  return pieceKeys.size;
}

function getHeroEquipmentSetStatBonuses(equipment: HeroEquipment): HeroBaseStats {
  return getActiveHeroEquipmentSetBonuses(equipment).reduce(
    (bonuses, bonus) => ({
      strength: bonuses.strength + (bonus.statBonuses?.strength ?? 0),
      agility: bonuses.agility + (bonus.statBonuses?.agility ?? 0),
      vitality: bonuses.vitality + (bonus.statBonuses?.vitality ?? 0),
    }),
    { strength: 0, agility: 0, vitality: 0 },
  );
}

function getHeroEquipmentSetMaceArmorDamagePercentBonus(equipment: HeroEquipment): number {
  return getActiveHeroEquipmentSetBonuses(equipment).reduce((total, bonus) => total + (bonus.maceArmorDamagePercentBonus ?? 0), 0);
}

function getActiveHeroEquipmentSetBonuses(equipment: HeroEquipment): HeroEquipmentSetBonusDefinition[] {
  return Object.values(HERO_EQUIPMENT_SET_BONUSES).flatMap((bonusGroup) => {
    const equippedPieces = getHeroEquipmentSetEquippedPieceCount(equipment, bonusGroup.id);

    return bonusGroup.bonuses.filter((bonus) => equippedPieces >= bonus.pieces);
  });
}

function getHeroEquipmentSetPieceKey(slotKey: HeroEquipmentSlotKey): string {
  const pairedSlot = PAIRED_ARMOR_SLOT_CONFIGS.find((config) => config.backSlot === slotKey || config.frontSlot === slotKey);

  return pairedSlot?.token ?? slotKey;
}

export function getHeroEquipmentArmor(equipment: HeroEquipment): number {
  return getEquippedHeroItems(equipment).reduce((armor, item) => armor + (item.armorHp ?? 0), 0);
}

export function getHeroEquipmentArmorSlots(equipment: HeroEquipment): CombatArmorSlotState[] {
  return HERO_EQUIPMENT_SLOT_KEYS.flatMap((slotKey) => {
    const armorSlot = getHeroEquipmentArmorSlot(equipment, slotKey);

    return armorSlot ? [armorSlot] : [];
  });
}

function getEnemyEquipmentArmorSlots(equipment: HeroEquipment): CombatArmorSlotState[] {
  return HERO_EQUIPMENT_SLOT_KEYS.flatMap((slotKey) => {
    const armorSlot = getHeroEquipmentArmorSlot(equipment, slotKey) ?? getEnemyOrphanFrontArmorSlot(equipment, slotKey);

    return armorSlot ? [armorSlot] : [];
  });
}

function getArmorSlotTotal(armorSlots: readonly CombatArmorSlotState[]): number {
  return armorSlots.reduce((total, slot) => total + Math.max(0, Math.floor(slot.armorHp)), 0);
}

function getHeroEquipmentArmorSlot(equipment: HeroEquipment, slotKey: HeroEquipmentSlotKey): CombatArmorSlotState | undefined {
  const itemId = equipment[slotKey];
  if (!itemId) {
    return undefined;
  }

  const item = HERO_ITEM_CATALOG[itemId];
  const armorHp = Math.max(0, Math.floor(item?.armorHp ?? 0));

  if (!item || item.equipmentSlot !== slotKey || isHeroConsumableItem(item) || armorHp <= 0) {
    return undefined;
  }

  return {
    slotKey,
    itemId,
    label: item.name,
    armorHp,
  };
}

function getEnemyOrphanFrontArmorSlot(equipment: HeroEquipment, slotKey: HeroEquipmentSlotKey): CombatArmorSlotState | undefined {
  const pairConfig = getFrontArmorPairConfig(slotKey);
  const itemId = pairConfig ? equipment[slotKey] : undefined;
  const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

  if (!pairConfig || !itemId || !item || item.equipmentSlot !== slotKey || isHeroConsumableItem(item)) {
    return undefined;
  }

  const matchingBackItem = findMatchingPairedBackArmorItem(item, pairConfig);
  const matchingBackArmorHp = Math.max(0, Math.floor(matchingBackItem?.armorHp ?? 0));

  if (!matchingBackItem || matchingBackArmorHp <= 0) {
    return undefined;
  }

  const equippedBackItemId = equipment[pairConfig.backSlot];
  const equippedBackItem = equippedBackItemId ? HERO_ITEM_CATALOG[equippedBackItemId] : undefined;
  if (equippedBackItem && getPairedArmorItemKey(equippedBackItem, pairConfig) === getPairedArmorItemKey(item, pairConfig)) {
    return undefined;
  }

  return {
    slotKey,
    itemId,
    label: item.name,
    armorHp: Math.ceil(matchingBackArmorHp / 2),
  };
}

function getFrontArmorPairConfig(slotKey: HeroEquipmentSlotKey): PairedArmorSlotConfig | undefined {
  return PAIRED_ARMOR_SLOT_CONFIGS.find((config) => config.frontSlot === slotKey);
}

function findMatchingPairedBackArmorItem(frontItem: HeroItemDefinition, pairConfig: PairedArmorSlotConfig): HeroItemDefinition | undefined {
  const pairKey = getPairedArmorItemKey(frontItem, pairConfig);

  return Object.values(HERO_ITEM_CATALOG).find(
    (candidate) =>
      candidate.kind === "armor" &&
      candidate.equipmentSlot === pairConfig.backSlot &&
      getPairedArmorItemKey(candidate, pairConfig) === pairKey,
  );
}

function getPairedArmorItemKey(item: HeroItemDefinition, pairConfig: PairedArmorSlotConfig): string {
  return normalizePairedArmorText(item.id, pairConfig);
}

function normalizePairedArmorText(value: string, pairConfig: PairedArmorSlotConfig): string {
  const token = escapeRegExp(pairConfig.token);

  return value
    .toLowerCase()
    .replace(new RegExp(`(^|[_\\s-])(?:back|front)([_\\s-]+)${token}(?=$|[_\\s-])`, "gu"), `$1${pairConfig.token}`)
    .replace(new RegExp(`(^|[_\\s-])${token}([_\\s-]+)(?:back|front)(?=$|[_\\s-])`, "gu"), `$1${pairConfig.token}`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getHeroEquipmentDamageBonus(equipment: HeroEquipment): number {
  return getEquippedHeroItems(equipment).reduce((damageBonus, item) => damageBonus + (item.damageBonus ?? 0), 0);
}

export function getHeroEquipmentSlotDamageBonus(equipment: HeroEquipment, slotKey: HeroEquipmentSlotKey): number {
  const itemId = equipment[slotKey];
  const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

  return item && item.equipmentSlot === slotKey && !isHeroConsumableItem(item) ? Math.max(0, item.damageBonus ?? 0) : 0;
}

function getHeroEquipmentSlotItem(equipment: HeroEquipment, slotKey: HeroEquipmentSlotKey): HeroItemDefinition | undefined {
  const itemId = equipment[slotKey];
  const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

  return item && item.equipmentSlot === slotKey && !isHeroConsumableItem(item) ? item : undefined;
}

export function getHeroItemSpearClinchRangeBonus(item: HeroItemDefinition | undefined): number {
  if (getHeroItemWeaponClass(item) !== "spear") {
    return 0;
  }

  return Math.max(0, item?.spearClinchRangeBonus ?? HERO_SPEAR_CLINCH_RANGE_BONUS_BY_RARITY[item?.rarity ?? "common"]);
}

export function getHeroItemSpearLungeMoveBonus(item: HeroItemDefinition | undefined): number {
  if (getHeroItemWeaponClass(item) !== "spear") {
    return 0;
  }

  return Math.max(0, item?.spearLungeMoveBonus ?? HERO_SPEAR_LUNGE_MOVE_BONUS_BY_RARITY[item?.rarity ?? "common"]);
}

export function getHeroAttributeTotals(hero: HeroState): HeroBaseStats {
  const equipmentBonuses = getHeroEquipmentStatBonuses(hero.equipment);
  const equipmentSetBonuses = getHeroEquipmentSetStatBonuses(hero.equipment);

  return {
    strength: getHeroAttributeTotal(hero.baseStats.strength, equipmentBonuses.strength + equipmentSetBonuses.strength),
    agility: getHeroAttributeTotal(hero.baseStats.agility, equipmentBonuses.agility + equipmentSetBonuses.agility),
    vitality: getHeroAttributeTotal(hero.baseStats.vitality, equipmentBonuses.vitality + equipmentSetBonuses.vitality),
  };
}

export function getHeroItemRequirements(itemIds: readonly HeroItemId[]): HeroBaseStats {
  const requirements: HeroBaseStats = { strength: 0, agility: 0, vitality: 0 };

  itemIds.forEach((itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    HERO_ATTRIBUTE_KEYS.forEach((attribute) => {
      const required = Math.max(0, Math.floor(item?.requirements?.[attribute] ?? 0));

      requirements[attribute] = Math.max(requirements[attribute], required);
    });
  });

  return requirements;
}

export function getHeroItemLevelRequirement(itemIds: readonly HeroItemId[]): number {
  return Math.max(
    0,
    ...itemIds.map((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      return Math.max(0, Math.floor(item?.levelRequirement ?? 0));
    }),
  );
}

export function getHeroItemRequirementChecks(hero: HeroState, itemIds: readonly HeroItemId[]): HeroItemRequirementCheck[] {
  const requirements = getHeroItemRequirements(itemIds);
  const current = getHeroAttributeTotals(hero);
  const levelRequirement = getHeroItemLevelRequirement(itemIds);
  const levelChecks: HeroItemRequirementCheck[] =
    levelRequirement > 0 ? [{ kind: "level", required: levelRequirement, current: Math.max(1, Math.floor(hero.level)) }] : [];
  const attributeChecks: HeroItemRequirementCheck[] = HERO_ATTRIBUTE_KEYS.flatMap((attribute) => {
    const required = requirements[attribute];

    return required > 0 ? [{ kind: "attribute", attribute, required, current: current[attribute] }] : [];
  });

  return [...levelChecks, ...attributeChecks];
}

export function canHeroUseItems(hero: HeroState, itemIds: readonly HeroItemId[]): boolean {
  if (itemIds.some((itemId) => !HERO_ITEM_CATALOG[itemId])) {
    return false;
  }

  return getHeroItemRequirementChecks(hero, itemIds).every((requirement) => requirement.current >= requirement.required);
}

export function canHeroEquipItems(hero: HeroState, itemIds: readonly HeroItemId[]): boolean {
  if (areHeroItemsConsumable(itemIds) || itemIds.some((itemId) => !HERO_ITEM_CATALOG[itemId])) {
    return false;
  }

  return areHeroItemsOwned(hero, itemIds) || canHeroUseItems(hero, itemIds);
}

export function isHeroConsumableItem(item: HeroItemDefinition | undefined): boolean {
  return item?.kind === "scroll" || getHeroItemWeaponClass(item) === "shuriken";
}

export function isHeroEquipmentPreviewItem(item: HeroItemDefinition | undefined): item is HeroItemDefinition {
  return Boolean(item && item.kind !== "scroll");
}

export function isHeroScrollItem(item: HeroItemDefinition | undefined): boolean {
  return item?.kind === "scroll";
}

export function isHeroScrollItemId(itemId: HeroItemId): boolean {
  return isHeroScrollItem(HERO_ITEM_CATALOG[itemId]);
}

export function isHeroConsumableItemId(itemId: HeroItemId): boolean {
  return isHeroConsumableItem(HERO_ITEM_CATALOG[itemId]);
}

export function areHeroItemsConsumable(itemIds: readonly HeroItemId[]): boolean {
  return itemIds.length > 0 && itemIds.every(isHeroConsumableItemId);
}

export function getHeroItemQuantity(hero: HeroState, itemId: HeroItemId): number {
  const quantity = hero.inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;

  return Math.max(0, Math.floor(quantity));
}

export function getHeroConsumableMaxQuantity(itemId: HeroItemId): number {
  const item = HERO_ITEM_CATALOG[itemId];

  if (item?.kind === "scroll") {
    return HERO_SCROLL_MAX_QUANTITY;
  }

  return isHeroConsumableItemId(itemId) ? HERO_SHURIKEN_MAX_QUANTITY : 0;
}

export function getHeroScrollCapacity(hero: HeroState): number {
  const capacity = hero.scrollCapacity;
  const inventoryCapacityFloor = Math.max(HERO_SCROLL_CAPACITY_BASE, Math.min(HERO_SCROLL_CAPACITY_MAX, getHeroScrollQuantity(hero)));

  if (typeof capacity !== "number" || !Number.isFinite(capacity)) {
    return inventoryCapacityFloor;
  }

  return Math.max(inventoryCapacityFloor, Math.min(HERO_SCROLL_CAPACITY_MAX, Math.floor(capacity)));
}

function isHeroShurikenItemId(itemId: HeroItemId): boolean {
  return getHeroItemWeaponClass(HERO_ITEM_CATALOG[itemId]) === "shuriken";
}

export function getHeroShurikenQuantity(hero: HeroState): number {
  return getInventoryShurikenQuantity(hero.inventory);
}

function getInventoryShurikenQuantity(inventory: readonly HeroInventoryEntry[]): number {
  return inventory.reduce((total, entry) => {
    if (!isHeroShurikenItemId(entry.itemId)) {
      return total;
    }

    return total + Math.max(0, Math.floor(entry.quantity ?? 0));
  }, 0);
}

export function getHeroShurikenItemId(hero?: HeroState): HeroItemId | undefined {
  const shurikenItemIds = HERO_ITEM_IDS.filter(isHeroShurikenItemId);

  if (!hero) {
    return shurikenItemIds[0];
  }

  return shurikenItemIds
    .map((itemId) => ({
      itemId,
      quantity: getHeroItemQuantity(hero, itemId),
      damage: getShurikenItemDamage(itemId),
    }))
    .filter((entry) => entry.quantity > 0)
    .sort((left, right) => right.damage - left.damage)[0]?.itemId;
}

export function getHeroShurikenCount(hero: HeroState): number {
  const shurikenItemId = getHeroShurikenItemId(hero);

  return shurikenItemId ? getHeroItemQuantity(hero, shurikenItemId) : 0;
}

export function getHeroScrollQuantity(hero: HeroState): number {
  return hero.inventory.reduce((total, entry) => {
    if (!isHeroScrollItemId(entry.itemId)) {
      return total;
    }

    return total + Math.max(0, Math.floor(entry.quantity ?? 0));
  }, 0);
}

export function getHeroRemainingScrollCapacity(hero: HeroState): number {
  return Math.max(0, getHeroScrollCapacity(hero) - getHeroScrollQuantity(hero));
}

export function getHeroShurikenDamage(hero?: HeroState): number {
  return getShurikenItemDamage(getHeroShurikenItemId(hero));
}

export function getHeroCrackArmorScrollItemId(): HeroItemId {
  return HERO_CRACK_ARMOR_SCROLL_ITEM_ID;
}

export function getHeroCrackArmorScrollCount(hero: HeroState): number {
  return getHeroItemQuantity(hero, HERO_CRACK_ARMOR_SCROLL_ITEM_ID);
}

export function getHeroCrackArmorScrollEffect(): HeroScrollEffect {
  return HERO_SCROLL_ITEMS[HERO_CRACK_ARMOR_SCROLL_ITEM_ID]!.scrollEffect!;
}

export function getHeroCrackArmorParts(hero: HeroState): number {
  return getHeroCrackArmorPartsForRarity(getHeroScrollUpgradeRarity(hero, "crackArmor"));
}

export function getHeroFireballScrollItemId(): HeroItemId {
  return HERO_FIREBALL_SCROLL_ITEM_ID;
}

export function getHeroFireballScrollCount(hero: HeroState): number {
  return getHeroItemQuantity(hero, HERO_FIREBALL_SCROLL_ITEM_ID);
}

export function getHeroFireballScrollEffect(): HeroScrollEffect {
  return HERO_SCROLL_ITEMS[HERO_FIREBALL_SCROLL_ITEM_ID]!.scrollEffect!;
}

export function getHeroFireballDamage(hero: HeroState): number {
  return getHeroFireballDamageForRarity(getHeroScrollUpgradeRarity(hero, "fireball"));
}

export function getHeroWardScrollItemId(): HeroItemId {
  return HERO_WARD_SCROLL_ITEM_ID;
}

export function getHeroWardScrollCount(hero: HeroState): number {
  return getHeroItemQuantity(hero, HERO_WARD_SCROLL_ITEM_ID);
}

export function getHeroWardScrollEffect(): HeroScrollEffect {
  return HERO_SCROLL_ITEMS[HERO_WARD_SCROLL_ITEM_ID]!.scrollEffect!;
}

export function getHeroWardHitCount(hero: HeroState): number {
  return getHeroWardHitCountForRarity(getHeroScrollUpgradeRarity(hero, "ward"));
}

export function getHeroPreciseStrikeScrollItemId(): HeroItemId {
  return HERO_PRECISE_STRIKE_SCROLL_ITEM_ID;
}

export function getHeroPreciseStrikeScrollCount(hero: HeroState): number {
  return getHeroItemQuantity(hero, HERO_PRECISE_STRIKE_SCROLL_ITEM_ID);
}

export function getHeroPreciseStrikeScrollEffect(): HeroScrollEffect {
  return HERO_SCROLL_ITEMS[HERO_PRECISE_STRIKE_SCROLL_ITEM_ID]!.scrollEffect!;
}

export function getHeroDoubleStrikeScrollItemId(): HeroItemId {
  return HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID;
}

export function getHeroDoubleStrikeScrollCount(hero: HeroState): number {
  return getHeroItemQuantity(hero, HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID);
}

export function getHeroDoubleStrikeScrollEffect(): HeroScrollEffect {
  return HERO_SCROLL_ITEMS[HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID]!.scrollEffect!;
}

export function getHeroUpgradeableScrollKind(itemId: HeroItemId | undefined): HeroUpgradeableScrollKind | undefined {
  return itemId ? HERO_SCROLL_UPGRADE_KIND_BY_ITEM_ID[itemId] : undefined;
}

export function isHeroUpgradeableScrollItemId(itemId: HeroItemId | undefined): boolean {
  return Boolean(getHeroUpgradeableScrollKind(itemId));
}

export function getHeroScrollUpgradeRarity(hero: HeroState, kind: HeroUpgradeableScrollKind): HeroScrollUpgradeRarity {
  return normalizeHeroScrollUpgradeRarity(hero.scrollUpgrades?.[kind]);
}

export function getHeroScrollUpgradeRarityForItem(hero: HeroState, itemId: HeroItemId | undefined): HeroScrollUpgradeRarity | undefined {
  const kind = getHeroUpgradeableScrollKind(itemId);

  return kind ? getHeroScrollUpgradeRarity(hero, kind) : undefined;
}

export function getHeroScrollPurchasePrice(hero: HeroState, itemId: HeroItemId | undefined, fallbackPrice = 30): number {
  const kind = getHeroUpgradeableScrollKind(itemId);

  if (!kind) {
    return fallbackPrice;
  }

  const rarity = getHeroScrollUpgradeRarity(hero, kind);

  return HERO_SCROLL_UPGRADE_DEFINITIONS[kind].purchasePrices[rarity];
}

export function getHeroScrollUpgradePrice(hero: HeroState, itemId: HeroItemId | undefined): number | undefined {
  const kind = getHeroUpgradeableScrollKind(itemId);

  if (!kind) {
    return undefined;
  }

  const rarity = getHeroScrollUpgradeRarity(hero, kind);

  return HERO_SCROLL_UPGRADE_DEFINITIONS[kind].upgradePrices[rarity];
}

export function canUpgradeHeroScroll(hero: HeroState, itemId: HeroItemId | undefined): boolean {
  const kind = getHeroUpgradeableScrollKind(itemId);
  const price = getHeroScrollUpgradePrice(hero, itemId);
  const nextRarity = kind ? getNextHeroScrollUpgradeRarity(getHeroScrollUpgradeRarity(hero, kind)) : undefined;

  return price !== undefined && nextRarity !== undefined && isHeroScrollUpgradeRarityUnlocked(hero, nextRarity) && hero.gold >= price;
}

export function upgradeHeroScroll(hero: HeroState, itemId: HeroItemId | undefined, now = new Date().toISOString()): HeroState {
  const kind = getHeroUpgradeableScrollKind(itemId);
  const price = getHeroScrollUpgradePrice(hero, itemId);
  const nextRarity = kind ? getNextHeroScrollUpgradeRarity(getHeroScrollUpgradeRarity(hero, kind)) : undefined;

  if (!kind || !nextRarity || price === undefined || !canUpgradeHeroScroll(hero, itemId)) {
    return hero;
  }

  return {
    ...hero,
    gold: hero.gold - price,
    scrollUpgrades: {
      ...(hero.scrollUpgrades ?? {}),
      [kind]: nextRarity,
    },
    updatedAt: now,
  };
}

export function getHeroMaxScrollUpgradeRarity(hero: HeroState): HeroScrollUpgradeRarity {
  return HERO_SCROLL_UPGRADE_RARITIES.reduce<HeroScrollUpgradeRarity>((maxRarity, rarity) => {
    if (!isHeroScrollUpgradeRarityUnlocked(hero, rarity)) {
      return maxRarity;
    }

    return rarity;
  }, "common");
}

export function getHeroScrollUpgradeUnlockBossTier(rarity: HeroScrollUpgradeRarity): number | undefined {
  return HERO_SCROLL_UPGRADE_UNLOCK_BOSS_TIER[rarity];
}

export function isHeroScrollUpgradeRarityUnlocked(hero: HeroState, rarity: HeroScrollUpgradeRarity): boolean {
  const unlockBossTier = getHeroScrollUpgradeUnlockBossTier(rarity);

  if (!unlockBossTier) {
    return true;
  }

  const defeatedBossIds = new Set(hero.defeatedArenaBossIds ?? []);
  const unlockBosses = resolveArenaBossesForTier(unlockBossTier);

  return unlockBosses.some((boss) => defeatedBossIds.has(boss.id));
}

export function getHeroPreciseStrikeBlockChanceReduction(hero: HeroState): number {
  return getHeroPreciseStrikeBlockChanceReductionForRarity(getHeroScrollUpgradeRarity(hero, "preciseStrike"));
}

export function getHeroDoubleStrikeDamageMultiplier(hero: HeroState): number {
  return getHeroDoubleStrikeDamageMultiplierForRarity(getHeroScrollUpgradeRarity(hero, "doubleStrike"));
}

export function getHeroPoisonDamage(hero: HeroState): number {
  return getHeroPoisonDamageForRarity(getHeroScrollUpgradeRarity(hero, "poison"));
}

export function getHeroCrackArmorPartsForRarity(rarity: HeroScrollUpgradeRarity): number {
  return HERO_SCROLL_UPGRADE_DEFINITIONS.crackArmor.crackArmorParts?.[rarity] ?? 1;
}

export function getHeroFireballDamageForRarity(rarity: HeroScrollUpgradeRarity): number {
  return HERO_SCROLL_UPGRADE_DEFINITIONS.fireball.fireballDamage?.[rarity] ?? FIREBALL_SCROLL_DAMAGE;
}

export function getHeroWardHitCountForRarity(rarity: HeroScrollUpgradeRarity): number {
  return HERO_SCROLL_UPGRADE_DEFINITIONS.ward.wardHitCount?.[rarity] ?? 1;
}

export function getHeroPreciseStrikeBlockChanceReductionForRarity(rarity: HeroScrollUpgradeRarity): number {
  return HERO_SCROLL_UPGRADE_DEFINITIONS.preciseStrike.preciseBlockChanceReduction?.[rarity] ?? 0;
}

export function getHeroDoubleStrikeDamageMultiplierForRarity(rarity: HeroScrollUpgradeRarity): number {
  return HERO_SCROLL_UPGRADE_DEFINITIONS.doubleStrike.doubleStrikeDamageMultiplier?.[rarity] ?? 1;
}

export function getHeroPoisonDamageForRarity(rarity: HeroScrollUpgradeRarity): number {
  return HERO_SCROLL_UPGRADE_DEFINITIONS.poison.poisonDamage?.[rarity] ?? POISON_SCROLL_DAMAGE;
}

export function getHeroPoisonScrollItemId(): HeroItemId {
  return HERO_POISON_SCROLL_ITEM_ID;
}

export function getHeroPoisonScrollCount(hero: HeroState): number {
  return getHeroItemQuantity(hero, HERO_POISON_SCROLL_ITEM_ID);
}

export function getHeroPoisonScrollEffect(): HeroScrollEffect {
  return HERO_SCROLL_ITEMS[HERO_POISON_SCROLL_ITEM_ID]!.scrollEffect!;
}

function normalizeHeroScrollUpgradeRarity(rarity: HeroScrollUpgradeRarity | undefined): HeroScrollUpgradeRarity {
  return rarity && HERO_SCROLL_UPGRADE_RARITIES.includes(rarity) ? rarity : "common";
}

function getNextHeroScrollUpgradeRarity(rarity: HeroScrollUpgradeRarity): HeroScrollUpgradeRarity | undefined {
  const currentIndex = HERO_SCROLL_UPGRADE_RARITIES.indexOf(rarity);

  return HERO_SCROLL_UPGRADE_RARITIES[currentIndex + 1];
}

function getShurikenItemDamage(itemId: HeroItemId | undefined): number {
  const shurikenItem = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

  return Math.max(0, Math.floor(shurikenItem?.damageBonus ?? 0));
}

export function getHeroBowShotCapacity(hero: HeroState): number {
  const capacity = hero.bowShotCapacity;

  if (typeof capacity !== "number" || !Number.isFinite(capacity)) {
    return HERO_BOW_SHOT_CAPACITY_BASE;
  }

  return Math.max(HERO_BOW_SHOT_CAPACITY_BASE, Math.min(HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX, Math.floor(capacity)));
}

export function canUpgradeHeroBowShotCapacity(hero: HeroState): boolean {
  return getHeroBowShotCapacity(hero) < HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX && hero.gold >= HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE;
}

export function upgradeHeroBowShotCapacity(hero: HeroState, now = new Date().toISOString()): HeroState {
  if (!canUpgradeHeroBowShotCapacity(hero)) {
    return hero;
  }

  return {
    ...hero,
    gold: hero.gold - HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE,
    bowShotCapacity: HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX,
    updatedAt: now,
  };
}

export function getHeroScrollCapacityUpgradePrice(hero: HeroState): number | undefined {
  const nextCapacity = getHeroScrollCapacity(hero) + 1;

  return nextCapacity <= HERO_SCROLL_CAPACITY_MAX ? HERO_SCROLL_CAPACITY_UPGRADE_PRICES[nextCapacity] : undefined;
}

export function canUpgradeHeroScrollCapacity(hero: HeroState): boolean {
  const price = getHeroScrollCapacityUpgradePrice(hero);
  const nextCapacity = getHeroScrollCapacity(hero) + 1;

  return price !== undefined && isHeroScrollCapacityUpgradeUnlocked(hero, nextCapacity) && hero.gold >= price;
}

export function upgradeHeroScrollCapacity(hero: HeroState, now = new Date().toISOString()): HeroState {
  const currentCapacity = getHeroScrollCapacity(hero);
  const price = getHeroScrollCapacityUpgradePrice(hero);

  if (price === undefined || !canUpgradeHeroScrollCapacity(hero)) {
    return hero;
  }

  return {
    ...hero,
    gold: hero.gold - price,
    scrollCapacity: Math.min(HERO_SCROLL_CAPACITY_MAX, currentCapacity + 1),
    updatedAt: now,
  };
}

export function getHeroScrollCapacityUpgradeUnlockBossTier(capacity: number): number | undefined {
  return HERO_SCROLL_CAPACITY_UPGRADE_UNLOCK_BOSS_TIER[Math.max(0, Math.floor(capacity))];
}

export function isHeroScrollCapacityUpgradeUnlocked(hero: HeroState, capacity: number): boolean {
  const unlockBossTier = getHeroScrollCapacityUpgradeUnlockBossTier(capacity);

  if (!unlockBossTier) {
    return true;
  }

  const defeatedBossIds = new Set(hero.defeatedArenaBossIds ?? []);
  const unlockBosses = resolveArenaBossesForTier(unlockBossTier);

  return unlockBosses.some((boss) => defeatedBossIds.has(boss.id));
}

export function getHeroEquipmentWeaponClass(equipment: HeroEquipment): HeroWeaponClass {
  const weaponItemId = equipment.weaponMain;
  const weaponItem = weaponItemId ? HERO_ITEM_CATALOG[weaponItemId] : undefined;

  return isHeroConsumableItem(weaponItem) ? "sword" : getHeroItemWeaponClass(weaponItem);
}

export function getHeroEquipmentBowWeaponClass(equipment: HeroEquipment): HeroWeaponClass | undefined {
  const weaponItemId = equipment.weaponBow;
  const weaponItem = weaponItemId ? HERO_ITEM_CATALOG[weaponItemId] : undefined;

  return getHeroItemWeaponClass(weaponItem) === "bow" ? "bow" : undefined;
}

export function getHeroItemWeaponClass(item: HeroItemDefinition | undefined): HeroWeaponClass {
  if (!item || item.kind !== "weapon") {
    return "sword";
  }

  if (item.weaponClass) {
    return item.weaponClass;
  }

  const haystack = `${item.id} ${item.name}`.toLowerCase();

  if (haystack.includes("bow")) {
    return "bow";
  }

  if (haystack.includes("shuriken")) {
    return "shuriken";
  }

  if (haystack.includes("axe")) {
    return "axe";
  }

  if (haystack.includes("mace")) {
    return "mace";
  }

  if (haystack.includes("spear")) {
    return "spear";
  }

  return "sword";
}

function createCombatFighterStateFromHero(hero: HeroState, base: FighterState): FighterState {
  const stats = deriveHeroStats(hero);
  const equipment = hero.equipment;
  const mainWeaponClass = getHeroEquipmentWeaponClass(equipment);
  const bowWeaponClass = getHeroEquipmentBowWeaponClass(equipment);
  const weaponClass = equipment.weaponMain ? mainWeaponClass : bowWeaponClass ?? mainWeaponClass;
  const bowShotCapacity = getHeroBowShotCapacity(hero);

  return {
    ...base,
    name: hero.name,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    armor: stats.maxArmor,
    maxArmor: stats.maxArmor,
    stamina: stats.maxStamina,
    maxStamina: stats.maxStamina,
    damageBonus: stats.damageBonus,
    weaponDamageBonus: stats.weaponDamageBonus,
    meleeDamagePercentBonus: stats.meleeDamagePercentBonus,
    maceArmorDamagePercentBonus: stats.maceArmorDamagePercentBonus,
    spearMeleeDamagePercentBonus: stats.spearMeleeDamagePercentBonus,
    spearLungeDamagePercentBonus: stats.spearLungeDamagePercentBonus,
    spearClinchRangeBonus: stats.spearClinchRangeBonus,
    spearLungeMoveBonus: stats.spearLungeMoveBonus,
    mainWeaponClass,
    bowWeaponClass,
    movementDistanceBonus: stats.movementDistanceBonus,
    bodyScaleBonus: stats.bodyScaleBonus,
    clinchRangeBonus: stats.clinchRangeBonus,
    restHpRestoreBonus: stats.restHpRestoreBonus,
    restStaminaRestoreBonus: stats.restStaminaRestoreBonus,
    weaponClass,
    bowShotsRemaining: bowWeaponClass === "bow" ? bowShotCapacity : 0,
    bowMaxShots: bowWeaponClass === "bow" ? bowShotCapacity : 0,
    shurikenCount: getHeroShurikenCount(hero),
    shurikenDamage: getHeroShurikenDamage(hero),
    shurikenItemId: getHeroShurikenItemId(hero),
    scrollCount: getHeroCrackArmorScrollCount(hero),
    scrollItemId: getHeroCrackArmorScrollItemId(),
    crackArmorParts: getHeroCrackArmorParts(hero),
    fireballScrollCount: getHeroFireballScrollCount(hero),
    fireballScrollItemId: getHeroFireballScrollItemId(),
    fireballDamage: getHeroFireballDamage(hero),
    wardScrollCount: getHeroWardScrollCount(hero),
    wardScrollItemId: getHeroWardScrollItemId(),
    wardHitCount: getHeroWardHitCount(hero),
    wardHits: 0,
    preciseStrikeScrollCount: getHeroPreciseStrikeScrollCount(hero),
    preciseStrikeScrollItemId: getHeroPreciseStrikeScrollItemId(),
    preciseStrikeBlockChanceReduction: getHeroPreciseStrikeBlockChanceReduction(hero),
    preciseStrikeHits: 0,
    doubleStrikeScrollCount: getHeroDoubleStrikeScrollCount(hero),
    doubleStrikeScrollItemId: getHeroDoubleStrikeScrollItemId(),
    doubleStrikeDamageMultiplier: getHeroDoubleStrikeDamageMultiplier(hero),
    doubleStrikeHits: 0,
    poisonScrollCount: getHeroPoisonScrollCount(hero),
    poisonScrollItemId: getHeroPoisonScrollItemId(),
    poisonDamage: getHeroPoisonDamage(hero),
    poisonTurns: 0,
    equipment: { ...equipment },
    weaponEnchantments: { ...hero.weaponEnchantments },
    armorSlots: getHeroEquipmentArmorSlots(equipment),
    appearance: { ...hero.appearance },
  };
}

export function createPvpCombatStateFromHeroes(playerHero: HeroState, enemyHero: HeroState): CombatState {
  const state = freshState();

  return {
    ...state,
    player: createCombatFighterStateFromHero(playerHero, state.player),
    enemy: createCombatFighterStateFromHero(enemyHero, state.enemy),
    encounter: {
      id: "pvp-room",
      kind: "random",
      tierId: DEFAULT_ARENA_TIER_ID,
      opponentId: "pvp-room",
    },
    log: [
      { text: `${playerHero.name} and ${enemyHero.name} enter the sand.`, important: true },
      { text: "Each gladiator has 20 seconds to act." },
    ],
  };
}

export function createCombatStateFromHero(hero: HeroState, encounterOrTierId: ArenaEncounter | number = DEFAULT_ARENA_TIER_ID): CombatState {
  const stats = deriveHeroStats(hero);
  const encounter = typeof encounterOrTierId === "number" ? createArenaRandomEnemyEncounter(encounterOrTierId) : encounterOrTierId;
  const enemyLoadout = encounter.enemyLoadout;
  const heroEquipment = hero.equipment;
  const enemyEquipment = enemyLoadout.equipment;
  const enemyArmorSlots = getEnemyEquipmentArmorSlots(enemyEquipment);
  const enemyStats = deriveFighterStats(enemyLoadout.baseStats ?? { strength: 0, agility: 0, vitality: 0 }, enemyEquipment, getArmorSlotTotal(enemyArmorSlots), undefined, true);
  const enemyMaxHp = getEnemyLoadoutMaxHp(enemyLoadout, enemyStats.maxHp);
  const playerMainWeaponClass = getHeroEquipmentWeaponClass(heroEquipment);
  const playerBowWeaponClass = getHeroEquipmentBowWeaponClass(heroEquipment);
  const playerWeaponClass = heroEquipment.weaponMain ? playerMainWeaponClass : playerBowWeaponClass ?? playerMainWeaponClass;
  const enemyMainWeaponClass = getHeroEquipmentWeaponClass(enemyEquipment);
  const enemyBowWeaponClass = getHeroEquipmentBowWeaponClass(enemyEquipment);
  const enemyWeaponClass = enemyEquipment.weaponMain ? enemyMainWeaponClass : enemyBowWeaponClass ?? enemyMainWeaponClass;
  const playerShurikenItemId = getHeroShurikenItemId(hero);
  const playerScrollItemId = getHeroCrackArmorScrollItemId();
  const playerFireballScrollItemId = getHeroFireballScrollItemId();
  const playerWardScrollItemId = getHeroWardScrollItemId();
  const playerPreciseStrikeScrollItemId = getHeroPreciseStrikeScrollItemId();
  const playerDoubleStrikeScrollItemId = getHeroDoubleStrikeScrollItemId();
  const playerPoisonScrollItemId = getHeroPoisonScrollItemId();
  const playerBowShotCapacity = getHeroBowShotCapacity(hero);
  const state = freshState();

  return {
    ...state,
    player: {
      ...state.player,
      name: hero.name,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      armor: stats.maxArmor,
      maxArmor: stats.maxArmor,
      stamina: stats.maxStamina,
      maxStamina: stats.maxStamina,
      damageBonus: stats.damageBonus,
      weaponDamageBonus: stats.weaponDamageBonus,
      meleeDamagePercentBonus: stats.meleeDamagePercentBonus,
      maceArmorDamagePercentBonus: stats.maceArmorDamagePercentBonus,
      spearMeleeDamagePercentBonus: stats.spearMeleeDamagePercentBonus,
      spearLungeDamagePercentBonus: stats.spearLungeDamagePercentBonus,
      spearClinchRangeBonus: stats.spearClinchRangeBonus,
      spearLungeMoveBonus: stats.spearLungeMoveBonus,
      mainWeaponClass: playerMainWeaponClass,
      bowWeaponClass: playerBowWeaponClass,
      movementDistanceBonus: stats.movementDistanceBonus,
      bodyScaleBonus: stats.bodyScaleBonus,
      clinchRangeBonus: stats.clinchRangeBonus,
      restHpRestoreBonus: stats.restHpRestoreBonus,
      restStaminaRestoreBonus: stats.restStaminaRestoreBonus,
      weaponClass: playerWeaponClass,
      bowShotsRemaining: playerBowWeaponClass === "bow" ? playerBowShotCapacity : 0,
      bowMaxShots: playerBowWeaponClass === "bow" ? playerBowShotCapacity : 0,
      shurikenCount: getHeroShurikenCount(hero),
      shurikenDamage: getHeroShurikenDamage(hero),
      shurikenItemId: playerShurikenItemId,
      scrollCount: getHeroCrackArmorScrollCount(hero),
      scrollItemId: playerScrollItemId,
      crackArmorParts: getHeroCrackArmorParts(hero),
      fireballScrollCount: getHeroFireballScrollCount(hero),
      fireballScrollItemId: playerFireballScrollItemId,
      fireballDamage: getHeroFireballDamage(hero),
      wardScrollCount: getHeroWardScrollCount(hero),
      wardScrollItemId: playerWardScrollItemId,
      wardHitCount: getHeroWardHitCount(hero),
      wardHits: 0,
      preciseStrikeScrollCount: getHeroPreciseStrikeScrollCount(hero),
      preciseStrikeScrollItemId: playerPreciseStrikeScrollItemId,
      preciseStrikeBlockChanceReduction: getHeroPreciseStrikeBlockChanceReduction(hero),
      preciseStrikeHits: 0,
      doubleStrikeScrollCount: getHeroDoubleStrikeScrollCount(hero),
      doubleStrikeScrollItemId: playerDoubleStrikeScrollItemId,
      doubleStrikeDamageMultiplier: getHeroDoubleStrikeDamageMultiplier(hero),
      doubleStrikeHits: 0,
      poisonScrollCount: getHeroPoisonScrollCount(hero),
      poisonScrollItemId: playerPoisonScrollItemId,
      poisonDamage: getHeroPoisonDamage(hero),
      poisonTurns: 0,
      equipment: { ...heroEquipment },
      weaponEnchantments: { ...hero.weaponEnchantments },
      armorSlots: getHeroEquipmentArmorSlots(heroEquipment),
    },
    enemy: {
      ...state.enemy,
      name: encounter.name,
      hp: enemyMaxHp,
      maxHp: enemyMaxHp,
      armor: enemyStats.maxArmor,
      maxArmor: enemyStats.maxArmor,
      stamina: enemyStats.maxStamina,
      maxStamina: enemyStats.maxStamina,
      damageBonus: enemyStats.damageBonus,
      weaponDamageBonus: enemyStats.weaponDamageBonus,
      meleeDamagePercentBonus: enemyStats.meleeDamagePercentBonus,
      maceArmorDamagePercentBonus: enemyStats.maceArmorDamagePercentBonus,
      spearMeleeDamagePercentBonus: enemyStats.spearMeleeDamagePercentBonus,
      spearLungeDamagePercentBonus: enemyStats.spearLungeDamagePercentBonus,
      spearClinchRangeBonus: enemyStats.spearClinchRangeBonus,
      spearLungeMoveBonus: enemyStats.spearLungeMoveBonus,
      mainWeaponClass: enemyMainWeaponClass,
      bowWeaponClass: enemyBowWeaponClass,
      movementDistanceBonus: enemyStats.movementDistanceBonus,
      bodyScaleBonus: enemyStats.bodyScaleBonus,
      clinchRangeBonus: enemyStats.clinchRangeBonus,
      restHpRestoreBonus: enemyStats.restHpRestoreBonus,
      restStaminaRestoreBonus: enemyStats.restStaminaRestoreBonus,
      weaponClass: enemyWeaponClass,
      bowShotsRemaining: enemyBowWeaponClass === "bow" ? BOW_SHOTS_PER_BATTLE : 0,
      bowMaxShots: enemyBowWeaponClass === "bow" ? BOW_SHOTS_PER_BATTLE : 0,
      shurikenCount: Math.max(0, Math.floor(enemyLoadout.shurikenCount ?? 0)),
      shurikenDamage: Math.max(0, Math.floor(enemyLoadout.shurikenDamage ?? 0)),
      shurikenItemId: enemyLoadout.shurikenItemId,
      scrollCount: Math.max(0, Math.floor(enemyLoadout.scrollCount ?? 0)),
      scrollItemId: enemyLoadout.scrollItemId,
      crackArmorParts: enemyLoadout.crackArmorParts ?? getHeroCrackArmorPartsForRarity("common"),
      fireballScrollCount: Math.max(0, Math.floor(enemyLoadout.fireballScrollCount ?? 0)),
      fireballScrollItemId: enemyLoadout.fireballScrollItemId,
      fireballDamage: enemyLoadout.fireballDamage ?? getHeroFireballDamageForRarity("common"),
      wardScrollCount: Math.max(0, Math.floor(enemyLoadout.wardScrollCount ?? 0)),
      wardScrollItemId: enemyLoadout.wardScrollItemId,
      wardHitCount: enemyLoadout.wardHitCount ?? getHeroWardHitCountForRarity("common"),
      wardHits: 0,
      preciseStrikeScrollCount: Math.max(0, Math.floor(enemyLoadout.preciseStrikeScrollCount ?? 0)),
      preciseStrikeScrollItemId: enemyLoadout.preciseStrikeScrollItemId,
      preciseStrikeBlockChanceReduction: enemyLoadout.preciseStrikeBlockChanceReduction ?? getHeroPreciseStrikeBlockChanceReductionForRarity("common"),
      preciseStrikeHits: 0,
      doubleStrikeScrollCount: Math.max(0, Math.floor(enemyLoadout.doubleStrikeScrollCount ?? 0)),
      doubleStrikeScrollItemId: enemyLoadout.doubleStrikeScrollItemId,
      doubleStrikeDamageMultiplier: enemyLoadout.doubleStrikeDamageMultiplier ?? getHeroDoubleStrikeDamageMultiplierForRarity("common"),
      doubleStrikeHits: 0,
      poisonScrollCount: Math.max(0, Math.floor(enemyLoadout.poisonScrollCount ?? 0)),
      poisonScrollItemId: enemyLoadout.poisonScrollItemId,
      poisonDamage: enemyLoadout.poisonDamage ?? getHeroPoisonDamageForRarity("common"),
      poisonTurns: 0,
      equipment: { ...enemyEquipment },
      armorSlots: enemyArmorSlots,
      visualPreset: { ...enemyLoadout.visualPreset },
    },
    encounter: {
      id: encounter.id,
      kind: encounter.kind,
      tierId: encounter.tierId,
      opponentId: encounter.opponentId,
      difficultyId: encounter.difficultyId,
      backgroundVariantId: encounter.backgroundVariantId,
      mode: encounter.mode,
    },
    log: [
      { text: `The gate slams open. ${hero.name} and ${encounter.name} enter the sand.`, important: true },
      { text: "Move into range, strike, then survive the enemy turn." },
    ],
  };
}

export function createDuoBossCombatStateFromHero(hero: HeroState, encounter: ArenaEncounter, random = Math.random): CombatState {
  const duoEncounter: ArenaEncounter = {
    ...encounter,
    mode: "duoBossAi",
  };
  const state = createCombatStateFromHero(hero, duoEncounter);
  const helperLoadout = createDuoBossHelperLoadout(random, encounter.tierId);
  const helperName = pickRandomArenaOpponentName(random);
  const helper = createCombatFighterStateFromEnemyLoadout(helperName, helperLoadout, freshState().player);

  helper.scrollCount = 0;
  helper.fireballScrollCount = 0;
  helper.wardScrollCount = 0;
  helper.preciseStrikeScrollCount = 0;
  helper.doubleStrikeScrollCount = 0;
  helper.poisonScrollCount = 0;

  return {
    ...state,
    helper,
    helperPosition: state.playerPosition,
    enemy: createDuoBossEnemyState(state.enemy, encounter.tierId),
    log: [
      { text: `The gate slams open. ${hero.name} and ${helper.name} face ${encounter.name}.`, important: true },
      { text: "Duo boss prototype: act first, your helper follows, then the boss answers." },
    ],
  };
}

export function createOnlineDuoBossCombatStateFromHeroes(playerHero: HeroState, helperHero: HeroState, encounter: ArenaEncounter): CombatState {
  const duoEncounter: ArenaEncounter = {
    ...encounter,
    mode: "duoBossAi",
  };
  const state = createCombatStateFromHero(playerHero, duoEncounter);
  const helper = createCombatFighterStateFromHero(helperHero, freshState().player);

  return {
    ...state,
    helper,
    helperPosition: state.playerPosition,
    enemy: createDuoBossEnemyState(state.enemy, encounter.tierId),
    log: [
      { text: `The gate slams open. ${playerHero.name} and ${helperHero.name} face ${encounter.name}.`, important: true },
      { text: "Online duo: act first, your ally follows, then the boss answers." },
    ],
  };
}

function createDuoBossHelperLoadout(random: () => number, tierId: number): EnemyLoadout {
  const mediumOpponents = resolveArenaRandomOpponentsForTier(tierId).filter((opponent) => opponent.difficultyId === DEFAULT_ARENA_DIFFICULTY_ID);
  const opponent = mediumOpponents.length > 0 ? pickRandom(mediumOpponents, random) : undefined;

  return opponent ? createRandomEnemyLoadoutForOpponent(opponent, random) : createRandomEnemyLoadout(random, tierId, DEFAULT_ARENA_DIFFICULTY_ID);
}

function getEnemyLoadoutMaxHp(enemyLoadout: EnemyLoadout, fallbackMaxHp: number): number {
  if (typeof enemyLoadout.maxHpOverride !== "number" || !Number.isFinite(enemyLoadout.maxHpOverride)) {
    return fallbackMaxHp;
  }

  return Math.max(1, Math.floor(enemyLoadout.maxHpOverride));
}

function createCombatFighterStateFromEnemyLoadout(name: string, enemyLoadout: EnemyLoadout, base: FighterState): FighterState {
  const equipment = enemyLoadout.equipment;
  const armorSlots = getEnemyEquipmentArmorSlots(equipment);
  const stats = deriveFighterStats(enemyLoadout.baseStats ?? { strength: 0, agility: 0, vitality: 0 }, equipment, getArmorSlotTotal(armorSlots), undefined, true);
  const maxHp = getEnemyLoadoutMaxHp(enemyLoadout, stats.maxHp);
  const mainWeaponClass = getHeroEquipmentWeaponClass(equipment);
  const bowWeaponClass = getHeroEquipmentBowWeaponClass(equipment);
  const weaponClass = equipment.weaponMain ? mainWeaponClass : bowWeaponClass ?? mainWeaponClass;

  return {
    ...base,
    name,
    hp: maxHp,
    maxHp,
    armor: stats.maxArmor,
    maxArmor: stats.maxArmor,
    stamina: stats.maxStamina,
    maxStamina: stats.maxStamina,
    damageBonus: stats.damageBonus,
    weaponDamageBonus: stats.weaponDamageBonus,
    meleeDamagePercentBonus: stats.meleeDamagePercentBonus,
    maceArmorDamagePercentBonus: stats.maceArmorDamagePercentBonus,
    spearMeleeDamagePercentBonus: stats.spearMeleeDamagePercentBonus,
    spearLungeDamagePercentBonus: stats.spearLungeDamagePercentBonus,
    spearClinchRangeBonus: stats.spearClinchRangeBonus,
    spearLungeMoveBonus: stats.spearLungeMoveBonus,
    mainWeaponClass,
    bowWeaponClass,
    movementDistanceBonus: stats.movementDistanceBonus,
    bodyScaleBonus: stats.bodyScaleBonus,
    clinchRangeBonus: stats.clinchRangeBonus,
    restHpRestoreBonus: stats.restHpRestoreBonus,
    restStaminaRestoreBonus: stats.restStaminaRestoreBonus,
    weaponClass,
    bowShotsRemaining: bowWeaponClass === "bow" ? BOW_SHOTS_PER_BATTLE : 0,
    bowMaxShots: bowWeaponClass === "bow" ? BOW_SHOTS_PER_BATTLE : 0,
    shurikenCount: Math.max(0, Math.floor(enemyLoadout.shurikenCount ?? 0)),
    shurikenDamage: Math.max(0, Math.floor(enemyLoadout.shurikenDamage ?? 0)),
    shurikenItemId: enemyLoadout.shurikenItemId,
    scrollCount: Math.max(0, Math.floor(enemyLoadout.scrollCount ?? 0)),
    scrollItemId: enemyLoadout.scrollItemId,
    crackArmorParts: enemyLoadout.crackArmorParts ?? getHeroCrackArmorPartsForRarity("common"),
    fireballScrollCount: Math.max(0, Math.floor(enemyLoadout.fireballScrollCount ?? 0)),
    fireballScrollItemId: enemyLoadout.fireballScrollItemId,
    fireballDamage: enemyLoadout.fireballDamage ?? getHeroFireballDamageForRarity("common"),
    wardScrollCount: Math.max(0, Math.floor(enemyLoadout.wardScrollCount ?? 0)),
    wardScrollItemId: enemyLoadout.wardScrollItemId,
    wardHitCount: enemyLoadout.wardHitCount ?? getHeroWardHitCountForRarity("common"),
    wardHits: 0,
    preciseStrikeScrollCount: Math.max(0, Math.floor(enemyLoadout.preciseStrikeScrollCount ?? 0)),
    preciseStrikeScrollItemId: enemyLoadout.preciseStrikeScrollItemId,
    preciseStrikeBlockChanceReduction: enemyLoadout.preciseStrikeBlockChanceReduction ?? getHeroPreciseStrikeBlockChanceReductionForRarity("common"),
    preciseStrikeHits: 0,
    doubleStrikeScrollCount: Math.max(0, Math.floor(enemyLoadout.doubleStrikeScrollCount ?? 0)),
    doubleStrikeScrollItemId: enemyLoadout.doubleStrikeScrollItemId,
    doubleStrikeDamageMultiplier: enemyLoadout.doubleStrikeDamageMultiplier ?? getHeroDoubleStrikeDamageMultiplierForRarity("common"),
    doubleStrikeHits: 0,
    poisonScrollCount: Math.max(0, Math.floor(enemyLoadout.poisonScrollCount ?? 0)),
    poisonScrollItemId: enemyLoadout.poisonScrollItemId,
    poisonDamage: enemyLoadout.poisonDamage ?? getHeroPoisonDamageForRarity("common"),
    poisonTurns: 0,
    equipment: { ...equipment },
    armorSlots,
    visualPreset: { ...enemyLoadout.visualPreset },
  };
}

function createDuoBossEnemyState(enemy: FighterState, tierId: number): FighterState {
  return shouldScaleDuoBossEnemy(tierId) ? scaleDuoBossFighter(enemy) : enemy;
}

function shouldScaleDuoBossEnemy(tierId: number): boolean {
  return Math.max(1, Math.floor(tierId)) > 1;
}

function scaleDuoBossFighter(fighter: FighterState): FighterState {
  const baseArmorFromSlots = fighter.armorSlots ? getArmorSlotTotal(fighter.armorSlots) : 0;
  const maxArmor = Math.ceil((baseArmorFromSlots > 0 ? baseArmorFromSlots : getSafeFighterMaxArmor(fighter)) * 1.5);
  const armorSlots = fighter.armorSlots ? scaleDuoBossArmorSlots(fighter.armorSlots, maxArmor) : undefined;
  const maxHp = Math.ceil(Math.max(1, fighter.maxHp) * 1.5);

  return {
    ...fighter,
    hp: maxHp,
    maxHp,
    armor: maxArmor,
    maxArmor,
    armorSlots,
    damageBonus: Math.ceil(Math.max(0, fighter.damageBonus) * 1.5),
    weaponDamageBonus: fighter.weaponDamageBonus === undefined ? undefined : Math.ceil(Math.max(0, fighter.weaponDamageBonus) * 1.5),
  };
}

function scaleDuoBossArmorSlots(armorSlots: CombatArmorSlotState[], targetTotal: number): CombatArmorSlotState[] {
  if (targetTotal <= 0 || armorSlots.length <= 0) {
    return armorSlots.map((slot) => ({ ...slot, armorHp: 0 }));
  }

  const scaled = armorSlots.map((slot, index) => {
    const rawArmor = Math.max(0, slot.armorHp) * 1.5;

    return {
      index,
      armorHp: Math.floor(rawArmor),
      fraction: rawArmor - Math.floor(rawArmor),
    };
  });
  const armorValues = scaled.map((entry) => entry.armorHp);
  let remainingArmor = targetTotal - armorValues.reduce((total, armorHp) => total + armorHp, 0);
  const fillOrder = [...scaled].sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (const entry of fillOrder) {
    if (remainingArmor <= 0) {
      break;
    }

    armorValues[entry.index] += 1;
    remainingArmor -= 1;
  }

  return armorSlots.map((slot, index) => ({
    ...slot,
    armorHp: armorValues[index] ?? 0,
  }));
}

function getSafeFighterMaxArmor(fighter: FighterState): number {
  return Math.max(0, fighter.maxArmor ?? fighter.armor ?? 0);
}

export function getBattleReward(combat: CombatState): BattleReward {
  if (combat.result === "win") {
    return { ...getCombatEncounterRewards(combat).win };
  }

  if (combat.result === "lose") {
    return { ...getCombatEncounterRewards(combat).loss };
  }

  return { gold: 0, xp: 0 };
}

export function rollArenaEncounterLoot(encounter: ArenaEncounter, random = Math.random): ArenaLootDrop[] {
  return rollArenaLootTable(encounter.lootTable, random);
}

export function rollCombatEncounterLoot(combat: CombatState, random = Math.random): ArenaLootDrop[] {
  return rollArenaLootTable(getCombatEncounterLootTable(combat), random);
}

export function applyCombatReward(
  hero: HeroState,
  combat: CombatState,
  now = new Date().toISOString(),
  random = Math.random,
  options: CombatRewardOptions = {},
): CombatRewardApplication {
  const shouldRecordBossVictory = options.recordBossVictory ?? true;
  const reward = getBattleReward(combat);
  const heroAfterConsumables = applyCombatConsumableUsage(hero, combat, now);
  const heroAfterWinRecord = combat.result === "win" ? recordHeroWin(heroAfterConsumables, now) : heroAfterConsumables;
  const rolledLoot = combat.result === "win"
    ? rollCombatRewardLoot(heroAfterWinRecord, combat, random, options.randomEnemyLootChanceMultiplier)
    : [];
  const heroBeforeReward = shouldRecordBossVictory && combat.result === "win" && combat.encounter?.kind === "boss"
    ? recordHeroArenaBossVictoryForTier(recordArenaBossDefeat(heroAfterWinRecord, combat.encounter.opponentId, now), combat.encounter.tierId, now)
    : heroAfterWinRecord;
  const heroWithReward = applyBattleReward(heroBeforeReward, reward, now);
  const lootApplication = applyArenaLootWithAppliedDrops(heroWithReward, rolledLoot, now);

  return {
    reward,
    loot: lootApplication.loot,
    heroBeforeReward: hero,
    heroAfterReward: lootApplication.hero,
  };
}

export function applyArenaLoot(hero: HeroState, loot: readonly ArenaLootDrop[], now = new Date().toISOString()): HeroState {
  return applyArenaLootWithAppliedDrops(hero, loot, now).hero;
}

export function hasHeroDefeatedArenaBoss(hero: HeroState, bossId: string): boolean {
  return (hero.defeatedArenaBossIds ?? []).includes(bossId);
}

export function getHeroLevelCap(hero: HeroState): number {
  const defeatedBossIds = new Set((hero.defeatedArenaBossIds ?? []).filter((bossId): bossId is string => Boolean(bossId)));
  const defeatedGateBossCount = getArenaLevelGateBossIds().filter((bossId) => defeatedBossIds.has(bossId)).length;

  return Math.min(HERO_MAX_LEVEL, HERO_LEVELS_PER_BOSS_TIER * (defeatedGateBossCount + 1));
}

export function isHeroXpBlockedByArenaBossGate(hero: HeroState): boolean {
  const levelCap = getHeroLevelCap(hero);
  const xpToNextLevel = Math.max(1, Math.floor(hero.xpToNextLevel));
  const xp = Math.max(0, Math.floor(hero.xp));

  return levelCap < HERO_MAX_LEVEL && hero.level >= levelCap && xp >= xpToNextLevel;
}

export function recordArenaBossDefeat(hero: HeroState, bossId: string, now = new Date().toISOString()): HeroState {
  if (!bossId || hasHeroDefeatedArenaBoss(hero, bossId)) {
    return hero;
  }

  return {
    ...hero,
    defeatedArenaBossIds: [...(hero.defeatedArenaBossIds ?? []), bossId],
    updatedAt: now,
  };
}

function recordHeroWin(hero: HeroState, now = new Date().toISOString()): HeroState {
  const heroWithWin = {
    ...hero,
    totalWins: getHeroTotalWins(hero) + 1,
    updatedAt: now,
  };

  return recordHeroArenaWinQuestProgress(heroWithWin, now);
}

export function unlockAllArenaBossTiers(hero: HeroState, now = new Date().toISOString()): HeroState {
  const defeatedArenaBossIds = hero.defeatedArenaBossIds ?? [];
  const missingUnlockBossIds = getArenaLevelGateBossIds().filter((bossId) => !defeatedArenaBossIds.includes(bossId));

  if (missingUnlockBossIds.length <= 0) {
    return hero;
  }

  return {
    ...hero,
    defeatedArenaBossIds: [...defeatedArenaBossIds, ...missingUnlockBossIds],
    updatedAt: now,
  };
}

function getArenaLevelGateBossIds(): string[] {
  return [
    ...new Set(
      resolveArenaTierDefinitions()
        .map((tier) => tier.unlockBossId)
        .filter((bossId): bossId is string => Boolean(bossId)),
    ),
  ];
}

export function hasHeroUnlockedShopRarity(hero: HeroState, rarity: HeroItemRarity): boolean {
  return (hero.unlockedShopRarities ?? []).includes(rarity);
}

export function unlockAllHeroShopRarities(hero: HeroState, now = new Date().toISOString()): HeroState {
  const unlockedShopRarities = [...HERO_ITEM_RARITIES];

  if (unlockedShopRarities.every((rarity) => hasHeroUnlockedShopRarity(hero, rarity))) {
    return hero;
  }

  return {
    ...hero,
    unlockedShopRarities,
    updatedAt: now,
  };
}

function applyArenaLootWithAppliedDrops(
  hero: HeroState,
  loot: readonly ArenaLootDrop[],
  now = new Date().toISOString(),
): { hero: HeroState; loot: ArenaLootDrop[] } {
  if (loot.length === 0) {
    return { hero, loot: [] };
  }

  const inventory = hero.inventory.map((entry) => ({ ...entry }));
  const appliedLoot: ArenaLootDrop[] = [];

  loot.forEach((drop) => {
    const quantity = Math.max(0, Math.floor(drop.quantity));
    const itemIds = getArenaLootDropItemIds(drop).filter((itemId) => Boolean(HERO_ITEM_CATALOG[itemId]));

    if (itemIds.length === 0 || quantity <= 0) {
      return;
    }

    itemIds.forEach((itemId) => {
      const existingEntry = inventory.find((entry) => entry.itemId === itemId);

      if (existingEntry) {
        existingEntry.quantity += quantity;
      } else {
        inventory.push({ itemId, quantity });
      }
    });

    appliedLoot.push({
      ...drop,
      itemId: itemIds[0]!,
      ...(itemIds.length > 1 ? { itemIds } : {}),
      quantity,
    });
  });

  if (appliedLoot.length === 0) {
    return { hero, loot: [] };
  }

  return {
    hero: {
      ...hero,
      inventory,
      updatedAt: now,
    },
    loot: appliedLoot,
  };
}

function applyCombatConsumableUsage(hero: HeroState, combat: CombatState, now: string): HeroState {
  const consumables = [
    { itemId: combat.player.shurikenItemId, remaining: combat.player.shurikenCount },
    { itemId: combat.player.scrollItemId, remaining: combat.player.scrollCount },
    { itemId: combat.player.fireballScrollItemId, remaining: combat.player.fireballScrollCount },
    { itemId: combat.player.wardScrollItemId, remaining: combat.player.wardScrollCount },
    { itemId: combat.player.preciseStrikeScrollItemId, remaining: combat.player.preciseStrikeScrollCount },
    { itemId: combat.player.doubleStrikeScrollItemId, remaining: combat.player.doubleStrikeScrollCount },
    { itemId: combat.player.poisonScrollItemId, remaining: combat.player.poisonScrollCount },
  ];
  let inventory = hero.inventory.map((entry) => ({ ...entry }));
  let hasChange = false;

  consumables.forEach(({ itemId, remaining }) => {
    if (!itemId || !isHeroConsumableItemId(itemId)) {
      return;
    }

    const currentQuantity = Math.max(0, Math.floor(inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0));
    const remainingQuantity = Math.min(currentQuantity, Math.max(0, Math.floor(remaining ?? currentQuantity)));

    if (remainingQuantity >= currentQuantity) {
      return;
    }

    inventory = inventory.map((entry) => (entry.itemId === itemId ? { ...entry, quantity: remainingQuantity } : entry));
    hasChange = true;
  });

  if (!hasChange) {
    return hero;
  }

  return {
    ...hero,
    inventory: inventory.filter((entry) => entry.quantity > 0),
    updatedAt: now,
  };
}

function getCombatEncounterRewards(combat: CombatState): ArenaOpponentRewards {
  if (combat.encounter?.kind === "boss") {
    return resolveArenaBossDefinition(combat.encounter.opponentId)?.rewards ?? { win: BATTLE_WIN_REWARD, loss: BATTLE_LOSS_REWARD };
  }

  if (combat.encounter?.kind === "random") {
    return resolveArenaRandomOpponentDefinition(combat.encounter.opponentId)?.rewards ?? { win: BATTLE_WIN_REWARD, loss: BATTLE_LOSS_REWARD };
  }

  return { win: BATTLE_WIN_REWARD, loss: BATTLE_LOSS_REWARD };
}

function getCombatEncounterLootTable(combat: CombatState): readonly ArenaLootTableEntry[] {
  if (combat.encounter?.kind === "boss") {
    return resolveArenaBossDefinition(combat.encounter.opponentId)?.lootTable ?? [];
  }

  return [];
}

function rollCombatRewardLoot(
  hero: HeroState,
  combat: CombatState,
  random: () => number,
  randomEnemyLootChanceMultiplier = 1,
): ArenaLootDrop[] {
  if (combat.encounter?.kind === "boss") {
    return rollBossCombatLoot(hero, combat, random);
  }

  if (combat.encounter?.kind === "random") {
    return rollRandomEnemyCombatLoot(hero, combat, random, randomEnemyLootChanceMultiplier);
  }

  return rollCombatEncounterLoot(combat, random);
}

function rollBossCombatLoot(hero: HeroState, combat: CombatState, random: () => number): ArenaLootDrop[] {
  const entries = getCombatEncounterLootTable(combat).filter((candidate) => canHeroReceiveEquipmentLootEntry(hero, candidate));

  return entries.length > 0 ? [createArenaLootDrop(pickRandom(entries, random))] : [];
}

function rollRandomEnemyCombatLoot(
  hero: HeroState,
  combat: CombatState,
  random: () => number,
  chanceMultiplier = 1,
): ArenaLootDrop[] {
  const encounter = combat.encounter;

  if (!encounter || !canRollRandomEnemyEquipmentLoot(encounter)) {
    return [];
  }

  const entries = createRandomEnemyEquipmentLootEntries(encounter.opponentId, combat.enemy.equipment)
    .filter((candidate) => canHeroReceiveEquipmentLootEntry(hero, candidate));

  if (entries.length === 0 || random() >= getRandomEnemyEquipmentDropChance(encounter.difficultyId, encounter.tierId, chanceMultiplier)) {
    return [];
  }

  return [createArenaLootDrop(pickRandomEnemyEquipmentLootEntry(entries, encounter.tierId, random))];
}

function canRollRandomEnemyEquipmentLoot(encounter: NonNullable<CombatState["encounter"]>): boolean {
  return encounter.kind === "random" && encounter.id.startsWith("random:");
}

function canHeroReceiveEquipmentLootEntry(hero: HeroState, entry: ArenaLootTableEntry): boolean {
  const itemIds = getValidArenaLootEntryItemIds(entry);

  return itemIds.length > 0 && !itemIds.some((itemId) => isHeroItemOwned(hero, itemId));
}

function createArenaLootDrop(entry: ArenaLootTableEntry): ArenaLootDrop {
  const itemIds = getValidArenaLootEntryItemIds(entry);
  const itemId = itemIds[0]!;

  return {
    sourceId: entry.id,
    itemId,
    ...(itemIds.length > 1 ? { itemIds } : {}),
    quantity: 1,
  };
}

function createRandomEnemyEquipmentLootEntries(sourceId: string, equipment: HeroEquipment | undefined): ArenaLootTableEntry[] {
  if (!equipment) {
    return [];
  }

  const usedSlots = new Set<HeroEquipmentSlotKey>();
  const entries: ArenaLootTableEntry[] = [];

  HERO_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    if (usedSlots.has(slotKey)) {
      return;
    }

    const pairConfig = PAIRED_ARMOR_SLOT_CONFIGS.find((config) => config.backSlot === slotKey || config.frontSlot === slotKey);

    if (pairConfig) {
      const pairedEntry = createRandomEnemyPairedArmorLootEntry(sourceId, equipment, pairConfig);

      usedSlots.add(pairConfig.backSlot);
      usedSlots.add(pairConfig.frontSlot);

      if (pairedEntry) {
        entries.push(pairedEntry);
      }

      return;
    }

    const itemId = getLootableEnemyEquipmentItemId(equipment, slotKey);

    if (!itemId) {
      return;
    }

    usedSlots.add(slotKey);
    entries.push(createArenaLootTableEntry(sourceId, [itemId], RANDOM_ENEMY_EQUIPMENT_LOOT_ENTRY_CHANCE));
  });

  return entries;
}

function getRandomEnemyEquipmentDropChance(
  difficultyId: ArenaDifficultyId | undefined,
  tierId: number,
  chanceMultiplier = 1,
): number {
  const baseChance = RANDOM_ENEMY_EQUIPMENT_DROP_CHANCES_BY_DIFFICULTY[difficultyId ?? DEFAULT_ARENA_DIFFICULTY_ID];
  const tierMultiplier = RANDOM_ENEMY_EQUIPMENT_DROP_CHANCE_MULTIPLIERS_BY_TIER[Math.max(1, Math.floor(tierId))] ?? 1;

  return clampEnemyRollChance(baseChance * tierMultiplier * Math.max(0, chanceMultiplier));
}

function pickRandomEnemyEquipmentLootEntry(entries: readonly ArenaLootTableEntry[], tierId: number, random: () => number): ArenaLootTableEntry {
  const rarityWeights = getRandomEnemyEquipmentDropRarityWeights(tierId);
  const weightedEntries = entries
    .map((entry) => ({
      entry,
      weight: getRandomEnemyEquipmentLootEntryRarityWeight(entry, rarityWeights),
    }))
    .filter(({ weight }) => weight > 0);

  if (weightedEntries.length === 0) {
    return pickRandom(entries, random);
  }

  const totalWeight = weightedEntries.reduce((total, { weight }) => total + weight, 0);
  let roll = random() * totalWeight;

  for (const { entry, weight } of weightedEntries) {
    roll -= weight;

    if (roll <= 0) {
      return entry;
    }
  }

  return weightedEntries[weightedEntries.length - 1]!.entry;
}

function getRandomEnemyEquipmentDropRarityWeights(tierId: number): RandomEnemyEquipmentDropRarityWeights {
  const normalizedTierId = Math.max(1, Math.floor(tierId));

  return RANDOM_ENEMY_EQUIPMENT_DROP_RARITY_WEIGHTS_BY_TIER[normalizedTierId] ?? RANDOM_ENEMY_EQUIPMENT_DROP_RARITY_WEIGHTS_BY_TIER[10]!;
}

function getRandomEnemyEquipmentLootEntryRarityWeight(entry: ArenaLootTableEntry, rarityWeights: RandomEnemyEquipmentDropRarityWeights): number {
  const rarity = getArenaLootEntryRarity(entry);

  return rarity ? Math.max(0, rarityWeights[rarity] ?? 0) : 0;
}

function getArenaLootEntryRarity(entry: ArenaLootTableEntry): HeroItemRarity | undefined {
  const rarities = getValidArenaLootEntryItemIds(entry)
    .map((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      return item ? getHeroItemRarity(item) : undefined;
    })
    .filter((rarity): rarity is HeroItemRarity => Boolean(rarity));

  if (rarities.length === 0) {
    return undefined;
  }

  const firstRarity = rarities[0]!;

  return rarities.every((rarity) => rarity === firstRarity) ? firstRarity : undefined;
}

function createRandomEnemyPairedArmorLootEntry(
  sourceId: string,
  equipment: HeroEquipment,
  pairConfig: PairedArmorSlotConfig,
): ArenaLootTableEntry | undefined {
  const backItemId = getLootableEnemyEquipmentItemId(equipment, pairConfig.backSlot);
  const frontItemId = getLootableEnemyEquipmentItemId(equipment, pairConfig.frontSlot);
  const backItem = backItemId ? HERO_ITEM_CATALOG[backItemId] : undefined;
  const frontItem = frontItemId ? HERO_ITEM_CATALOG[frontItemId] : undefined;

  if (!backItemId || !frontItemId || !backItem || !frontItem || backItem.kind !== "armor" || frontItem.kind !== "armor") {
    return undefined;
  }

  if (getPairedArmorItemKey(backItem, pairConfig) !== getPairedArmorItemKey(frontItem, pairConfig)) {
    return undefined;
  }

  return createArenaLootTableEntry(sourceId, [backItemId, frontItemId], RANDOM_ENEMY_EQUIPMENT_LOOT_ENTRY_CHANCE);
}

function getLootableEnemyEquipmentItemId(equipment: HeroEquipment, slotKey: HeroEquipmentSlotKey): HeroItemId | undefined {
  const itemId = equipment[slotKey];
  const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

  if (!itemId || !item || item.equipmentSlot !== slotKey || isHeroConsumableItem(item)) {
    return undefined;
  }

  return item.kind === "weapon" || item.kind === "armor" ? itemId : undefined;
}

function createArenaLootTableEntry(sourceId: string, itemIds: readonly HeroItemId[], chance: number): ArenaLootTableEntry {
  return {
    id: `${sourceId}_${itemIds.join("_")}_drop`,
    itemIds: [...itemIds],
    chance,
    quantity: 1,
  };
}

function rollArenaLootTable(lootTable: readonly ArenaLootTableEntry[], random: () => number): ArenaLootDrop[] {
  return lootTable.flatMap((entry) => {
    const chance = Math.max(0, Math.min(1, entry.chance));
    const quantity = Math.max(0, Math.floor(entry.quantity));

    if (chance <= 0 || quantity <= 0 || random() >= chance) {
      return [];
    }

    return entry.itemIds.map((itemId) => ({
      sourceId: entry.id,
      itemId,
      quantity,
    }));
  });
}

function getValidArenaLootEntryItemIds(entry: ArenaLootTableEntry): HeroItemId[] {
  return entry.itemIds.filter((itemId) => Boolean(HERO_ITEM_CATALOG[itemId]));
}

function getArenaLootDropItemIds(drop: ArenaLootDrop): HeroItemId[] {
  return drop.itemIds && drop.itemIds.length > 0 ? [...new Set(drop.itemIds)] : [drop.itemId];
}

function getHeroAttributeTotal(baseValue: number, equipmentBonus: number): number {
  return Math.max(0, baseValue + equipmentBonus);
}

function roundStatBonus(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function applyBattleReward(hero: HeroState, reward: BattleReward, now = new Date().toISOString()): HeroState {
  if (reward.gold <= 0 && reward.xp <= 0) {
    return hero;
  }

  const progress = applyHeroXp(hero.level, hero.xp + reward.xp, getHeroLevelCap(hero));
  const earnedSkillPoints = Math.max(0, progress.level - hero.level);
  const heroWithReward: HeroState = {
    ...hero,
    gold: hero.gold + reward.gold,
    level: progress.level,
    xp: progress.xp,
    xpToNextLevel: progress.xpToNextLevel,
    skillPoints: hero.skillPoints + earnedSkillPoints,
    updatedAt: now,
  };

  return earnedSkillPoints > 0 ? restoreHeroArenaEnergy(heroWithReward, now) : heroWithReward;
}

export function allocateHeroSkillPoint(hero: HeroState, attribute: HeroAttributeKey, now = new Date().toISOString()): HeroState {
  return allocateHeroSkillPoints(hero, attribute, 1, now);
}

export function allocateHeroSkillPoints(hero: HeroState, attribute: HeroAttributeKey, amount: number, now = new Date().toISOString()): HeroState {
  const requestedPoints = Number.isFinite(amount) ? Math.floor(amount) : 0;
  const spentPoints = Math.min(hero.skillPoints, Math.max(0, requestedPoints));

  if (spentPoints <= 0) {
    return hero;
  }

  return {
    ...hero,
    skillPoints: hero.skillPoints - spentPoints,
    baseStats: {
      ...hero.baseStats,
      [attribute]: hero.baseStats[attribute] + spentPoints,
    },
    updatedAt: now,
  };
}

export function getHeroAllocatedSkillPoints(hero: HeroState): number {
  return HERO_ATTRIBUTE_KEYS.reduce((sum, attribute) => {
    const value = Math.floor(hero.baseStats[attribute]);

    return sum + Math.max(0, Number.isFinite(value) ? value : 0);
  }, 0);
}

export function getHeroSkillPointResetCount(hero: HeroState): number {
  const resetCount = Math.floor(hero.skillPointResetCount ?? 0);

  return Math.max(0, Number.isFinite(resetCount) ? resetCount : 0);
}

export function getHeroSkillPointResetPrice(hero: HeroState): number {
  return HERO_SKILL_POINT_RESET_BASE_PRICE + getHeroSkillPointResetCount(hero) * HERO_SKILL_POINT_RESET_PRICE_STEP;
}

export function canResetHeroSkillPoints(hero: HeroState): boolean {
  return getHeroAllocatedSkillPoints(hero) > 0 && hero.gold >= getHeroSkillPointResetPrice(hero);
}

export function resetHeroSkillPoints(hero: HeroState, now = new Date().toISOString()): HeroState {
  const allocatedSkillPoints = getHeroAllocatedSkillPoints(hero);
  const price = getHeroSkillPointResetPrice(hero);

  if (allocatedSkillPoints <= 0 || hero.gold < price) {
    return hero;
  }

  return {
    ...hero,
    gold: hero.gold - price,
    skillPoints: hero.skillPoints + allocatedSkillPoints,
    skillPointResetCount: getHeroSkillPointResetCount(hero) + 1,
    baseStats: {
      strength: 0,
      agility: 0,
      vitality: 0,
    },
    updatedAt: now,
  };
}

export function grantHeroSkillPoints(hero: HeroState, amount: number, now = new Date().toISOString()): HeroState {
  const skillPoints = Number.isFinite(amount) ? Math.floor(amount) : 0;

  if (skillPoints <= 0) {
    return hero;
  }

  return {
    ...hero,
    skillPoints: hero.skillPoints + skillPoints,
    updatedAt: now,
  };
}

export function grantHeroLevels(hero: HeroState, amount: number, now = new Date().toISOString()): HeroState {
  const levels = Number.isFinite(amount) ? Math.floor(amount) : 0;
  const currentLevel = Math.max(1, Math.min(HERO_MAX_LEVEL, Math.floor(hero.level)));
  const nextLevel = Math.min(HERO_MAX_LEVEL, currentLevel + Math.max(0, levels));
  const earnedSkillPoints = Math.max(0, nextLevel - currentLevel);

  if (earnedSkillPoints <= 0) {
    return hero;
  }

  return {
    ...hero,
    level: nextLevel,
    xp: 0,
    xpToNextLevel: getHeroXpToNextLevel(nextLevel),
    skillPoints: hero.skillPoints + earnedSkillPoints,
    updatedAt: now,
  };
}

export function grantHeroGold(hero: HeroState, amount: number, now = new Date().toISOString()): HeroState {
  const gold = Number.isFinite(amount) ? Math.floor(amount) : 0;

  if (gold <= 0) {
    return hero;
  }

  return {
    ...hero,
    gold: hero.gold + gold,
    updatedAt: now,
  };
}

export function claimHeroArenaWinQuestReward(
  hero: HeroState,
  now = new Date().toISOString(),
): { ok: true; hero: HeroState } | { ok: false; hero: HeroState } {
  const status = getHeroArenaWinQuestStatus(hero);

  if (!status.ready) {
    return { ok: false, hero };
  }

  const questClaimedHero: HeroState = {
    ...hero,
    arenaWinQuest: createHeroArenaWinQuest(status.goal, true, getHeroArenaWinQuest(hero).lastOpenedDayKey),
    updatedAt: now,
  };
  const heroWithGold = grantHeroGold(questClaimedHero, status.rewards.gold, now);
  const heroWithEnergy = grantHeroArenaEnergy(heroWithGold, status.rewards.arenaEnergy, now);

  return { ok: true, hero: heroWithEnergy };
}

export function updateHeroAppearance(hero: HeroState, appearance: Partial<HeroAppearance>, now = new Date().toISOString()): HeroState {
  const currentAppearance = hero.appearance ?? createDefaultHeroAppearance();
  const nextAppearance: HeroAppearance = {
    ...currentAppearance,
    ...appearance,
  };

  if (currentAppearance.hairId === nextAppearance.hairId && currentAppearance.beardId === nextAppearance.beardId) {
    return hero;
  }

  return {
    ...hero,
    appearance: nextAppearance,
    updatedAt: now,
  };
}

export function buyAndEquipHeroItems(hero: HeroState, purchase: HeroItemPurchase, now = new Date().toISOString()): HeroState {
  if (areHeroItemsConsumable(purchase.itemIds)) {
    if (!canHeroUseItems(hero, purchase.itemIds)) {
      return hero;
    }

    return buyHeroConsumableItems(hero, purchase, now);
  }

  const price = areHeroItemsOwned(hero, purchase.itemIds) ? 0 : purchase.price;

  if (!canHeroEquipItems(hero, purchase.itemIds)) {
    return hero;
  }

  if (price > hero.gold) {
    return hero;
  }

  const inventory = hero.inventory.map((entry) => ({ ...entry }));
  const equipment = { ...hero.equipment };

  purchase.itemIds.forEach((itemId) => {
    const existingEntry = inventory.find((entry) => entry.itemId === itemId);

    if (existingEntry) {
      existingEntry.quantity = Math.max(1, existingEntry.quantity);
    } else {
      inventory.push({ itemId, quantity: 1 });
    }

    const item = HERO_ITEM_CATALOG[itemId];
    equipment[item.equipmentSlot] = itemId;
  });

  return {
    ...hero,
    gold: hero.gold - price,
    equipment,
    inventory,
    updatedAt: now,
  };
}

export function unequipHeroItems(hero: HeroState, itemIds: readonly HeroItemId[], now = new Date().toISOString()): HeroState {
  if (itemIds.length <= 0 || areHeroItemsConsumable(itemIds)) {
    return hero;
  }

  const equipment = { ...hero.equipment };
  let changed = false;

  itemIds.forEach((itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    if (!item || isHeroConsumableItem(item) || equipment[item.equipmentSlot] !== itemId) {
      return;
    }

    equipment[item.equipmentSlot] = null;
    changed = true;
  });

  if (!changed) {
    return hero;
  }

  return {
    ...hero,
    equipment,
    updatedAt: now,
  };
}

function buyHeroConsumableItems(hero: HeroState, purchase: HeroItemPurchase, now: string): HeroState {
  if (purchase.price <= 0 || purchase.price > hero.gold) {
    return hero;
  }

  const inventory = hero.inventory.map((entry) => ({ ...entry }));
  let hasChange = false;

  for (const itemId of purchase.itemIds) {
    const maxQuantity = getHeroConsumableMaxQuantity(itemId);
    const maxScrollQuantity = getHeroScrollCapacity(hero);
    const existingEntry = inventory.find((entry) => entry.itemId === itemId);
    const currentQuantity = Math.max(0, Math.floor(existingEntry?.quantity ?? 0));
    const isScroll = isHeroScrollItemId(itemId);
    const isShuriken = isHeroShurikenItemId(itemId);
    const totalScrollQuantity = isScroll
      ? inventory.reduce((total, entry) => (isHeroScrollItemId(entry.itemId) ? total + Math.max(0, Math.floor(entry.quantity ?? 0)) : total), 0)
      : 0;
    const totalShurikenQuantity = isShuriken ? getInventoryShurikenQuantity(inventory) : 0;

    if (
      maxQuantity <= 0 ||
      currentQuantity >= maxQuantity ||
      (isScroll && totalScrollQuantity >= maxScrollQuantity) ||
      (isShuriken && totalShurikenQuantity >= HERO_SHURIKEN_MAX_QUANTITY)
    ) {
      return hero;
    }

    if (existingEntry) {
      existingEntry.quantity = Math.min(maxQuantity, currentQuantity + 1);
    } else {
      inventory.push({ itemId, quantity: 1 });
    }

    hasChange = true;
  }

  if (!hasChange) {
    return hero;
  }

  return {
    ...hero,
    gold: hero.gold - purchase.price,
    inventory,
    updatedAt: now,
  };
}

export function getHeroXpToNextLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.min(HERO_MAX_LEVEL, Math.floor(level)));

  return HERO_XP_TO_NEXT_LEVEL_BY_LEVEL[normalizedLevel - 1] ?? HERO_XP_TO_NEXT_LEVEL_BY_LEVEL[HERO_XP_TO_NEXT_LEVEL_BY_LEVEL.length - 1]!;
}

function applyHeroXp(level: number, xp: number, levelCap = HERO_MAX_LEVEL): Pick<HeroState, "level" | "xp" | "xpToNextLevel"> {
  let nextLevel = Math.max(1, Math.min(HERO_MAX_LEVEL, Math.floor(level)));
  let nextXp = nextLevel >= HERO_MAX_LEVEL ? 0 : Math.max(0, Math.floor(xp));
  let nextXpToNextLevel = getHeroXpToNextLevel(nextLevel);
  const normalizedLevelCap = Math.max(HERO_LEVELS_PER_BOSS_TIER, Math.min(HERO_MAX_LEVEL, Math.floor(levelCap)));

  while (nextLevel < HERO_MAX_LEVEL && nextLevel < normalizedLevelCap && nextXp >= nextXpToNextLevel) {
    nextXp -= nextXpToNextLevel;
    nextLevel += 1;
    nextXpToNextLevel = getHeroXpToNextLevel(nextLevel);
  }

  if (nextLevel >= HERO_MAX_LEVEL) {
    nextXp = 0;
  } else if (nextLevel >= normalizedLevelCap) {
    nextXp = Math.min(nextXp, nextXpToNextLevel);
  }

  return {
    level: nextLevel,
    xp: nextXp,
    xpToNextLevel: nextXpToNextLevel,
  };
}

function getEnemyItemIdsBySlot(slotKey: HeroEquipmentSlotKey, itemRarities: readonly HeroItemRarity[]): HeroItemId[] {
  return GENERATED_EQUIPMENT_ITEM_RECORDS.filter(
    (record) =>
      canRollGeneratedEquipmentForEnemy(record) &&
      !isHeroConsumableItem(record.item) &&
      record.item.equipmentSlot === slotKey &&
      itemRarities.includes(getHeroItemRarity(record.item)),
  ).map((record) => record.item.id);
}

function getEquipmentPoolItemRarities(equipmentPools: readonly ArenaGeneratedEquipmentPool[]): HeroItemRarity[] {
  return [...new Set(equipmentPools.flatMap((equipmentPool) => equipmentPool.itemRarities))];
}

function getEnemyEquipmentSlotRollChance(equipmentPool: ArenaGeneratedEquipmentPool, slotKey: HeroEquipmentSlotKey): number {
  if (slotKey === "weaponMain") {
    return getEnemyRollChanceOrFallback(equipmentPool.weaponChance, equipmentPool.rollChance);
  }

  if (slotKey === "weaponBow") {
    return getEnemyRollChanceOrFallback(equipmentPool.bowChance, equipmentPool.rollChance);
  }

  if (slotKey === "shield") {
    return getEnemyRollChanceOrFallback(equipmentPool.shieldChance, equipmentPool.rollChance);
  }

  return clampEnemyRollChance(equipmentPool.rollChance);
}

function rollEnemyShurikenItemIdFromPools(equipmentPools: readonly ArenaGeneratedEquipmentPool[], random: () => number): HeroItemId | undefined {
  const hasCustomShurikenChance = equipmentPools.some((equipmentPool) => isFiniteNumber(equipmentPool.shurikenChance));

  if (!hasCustomShurikenChance) {
    return rollEnemyShurikenItemId(getEquipmentPoolItemRarities(equipmentPools), ENEMY_SHURIKEN_ROLL_CHANCE, random);
  }

  for (const equipmentPool of equipmentPools) {
    const shurikenItemId = rollEnemyShurikenItemId(
      equipmentPool.itemRarities,
      getEnemyRollChanceOrFallback(equipmentPool.shurikenChance, ENEMY_SHURIKEN_ROLL_CHANCE),
      random,
    );

    if (shurikenItemId) {
      return shurikenItemId;
    }
  }

  return undefined;
}

function rollEnemyScrollFromTier(
  tierId: number,
  difficultyId: ArenaDifficultyId,
  random: () => number,
): { itemId: HeroItemId; rarity: HeroScrollUpgradeRarity } | undefined {
  const config = ENEMY_SCROLL_ROLLS_BY_TIER[tierId];
  const itemIds = getEnemyScrollItemIds();

  if (!config || itemIds.length === 0) {
    return undefined;
  }

  const rollChance = clampEnemyRollChance(config.chance + ENEMY_SCROLL_DIFFICULTY_CHANCE_MODIFIERS[difficultyId]);

  if (rollChance <= 0 || random() >= rollChance) {
    return undefined;
  }

  return {
    itemId: pickRandom(itemIds, random),
    rarity: config.rarity,
  };
}

function rollEnemyShurikenItemId(itemRarities: readonly HeroItemRarity[], rollChance: number, random: () => number): HeroItemId | undefined {
  const itemIds = getEnemyShurikenItemIds(itemRarities);

  if (itemIds.length === 0 || random() >= clampEnemyRollChance(rollChance)) {
    return undefined;
  }

  return pickRandom(itemIds, random);
}

function createEnemyScrollLoadout(itemId: HeroItemId | undefined, rarity: HeroScrollUpgradeRarity = "common"): Partial<EnemyLoadout> {
  const scrollEffect = itemId ? HERO_ITEM_CATALOG[itemId]?.scrollEffect : undefined;

  if (!itemId || !scrollEffect) {
    return {};
  }

  switch (scrollEffect.kind) {
    case "crackArmorSlot":
      return {
        scrollCount: ENEMY_SCROLL_QUANTITY,
        scrollItemId: itemId,
        crackArmorParts: getHeroCrackArmorPartsForRarity(rarity),
      };
    case "fireballDamage":
      return {
        fireballScrollCount: ENEMY_SCROLL_QUANTITY,
        fireballScrollItemId: itemId,
        fireballDamage: getHeroFireballDamageForRarity(rarity),
      };
    case "wardHit":
      return {
        wardScrollCount: ENEMY_SCROLL_QUANTITY,
        wardScrollItemId: itemId,
        wardHitCount: getHeroWardHitCountForRarity(rarity),
      };
    case "preciseStrike":
      return {
        preciseStrikeScrollCount: ENEMY_SCROLL_QUANTITY,
        preciseStrikeScrollItemId: itemId,
        preciseStrikeBlockChanceReduction: getHeroPreciseStrikeBlockChanceReductionForRarity(rarity),
      };
    case "doubleStrike":
      return {
        doubleStrikeScrollCount: ENEMY_SCROLL_QUANTITY,
        doubleStrikeScrollItemId: itemId,
        doubleStrikeDamageMultiplier: getHeroDoubleStrikeDamageMultiplierForRarity(rarity),
      };
    case "poison":
      return {
        poisonScrollCount: ENEMY_SCROLL_QUANTITY,
        poisonScrollItemId: itemId,
        poisonDamage: getHeroPoisonDamageForRarity(rarity),
      };
  }

  return {};
}

function getEnemyRollChanceOrFallback(value: number | undefined, fallback: number): number {
  return isFiniteNumber(value) ? clampEnemyRollChance(value) : clampEnemyRollChance(fallback);
}

function clampEnemyRollChance(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getEnemyShurikenItemIds(itemRarities: readonly HeroItemRarity[]): HeroItemId[] {
  return GENERATED_EQUIPMENT_ITEM_RECORDS.filter(
    (record) =>
      canRollGeneratedEquipmentForEnemy(record) &&
      getHeroItemWeaponClass(record.item) === "shuriken" &&
      itemRarities.includes(getHeroItemRarity(record.item)),
  ).map((record) => record.item.id);
}

function getEnemyScrollItemIds(): HeroItemId[] {
  return Object.values(HERO_SCROLL_ITEMS).map((item) => item.id);
}

function canRollGeneratedEquipmentForEnemy(record: (typeof GENERATED_EQUIPMENT_ITEM_RECORDS)[number]): boolean {
  return record.availability?.enemyPool ?? true;
}

function getHeroItemRarity(item: HeroItemDefinition): HeroItemRarity {
  return item.rarity ?? "common";
}

function pickRandom<T>(items: readonly T[], random: () => number): T {
  if (items.length === 0) {
    throw new Error("Cannot pick a random item from an empty list.");
  }

  return items[Math.floor(random() * items.length)] ?? items[0]!;
}
