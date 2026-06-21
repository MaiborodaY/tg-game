import {
  BATTLE_LOSS_REWARD,
  BATTLE_WIN_REWARD,
  DEFAULT_ARENA_DIFFICULTY_ID,
  DEFAULT_ARENA_TIER_ID,
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
import { BOW_SHOTS_PER_BATTLE, freshState, MAX_HP, MAX_STAMINA, type CombatArmorSlotState, type CombatState } from "./combat";
import { GENERATED_EQUIPMENT_ITEM_CATALOG, GENERATED_EQUIPMENT_ITEM_IDS, GENERATED_EQUIPMENT_ITEM_RECORDS } from "./generated/equipmentItems.generated";

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
  bowShotCapacity?: number;
  baseStats: HeroBaseStats;
  appearance: HeroAppearance;
  equipment: HeroEquipment;
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
  spearLungeDamagePercentBonus: number;
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

export const HERO_ITEM_RARITIES: readonly HeroItemRarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythical", "unique"];

export interface HeroEquipmentSetInfo {
  id: string;
  name: string;
  rank: number;
  grade?: HeroEquipmentSetGrade;
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
  scrollEffect?: HeroScrollEffect;
  equipmentSet?: HeroEquipmentSetInfo;
  levelRequirement?: number;
  requirements?: Partial<HeroBaseStats>;
  statBonuses?: Partial<HeroBaseStats>;
}

export interface HeroScrollEffect {
  kind: "crackArmorSlot" | "fireballDamage" | "wardHit" | "preciseStrike" | "doubleStrike" | "poison";
}

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
  shurikenCount?: number;
  shurikenDamage?: number;
  shurikenItemId?: HeroItemId;
  visualPreset: EnemyVisualPreset;
}

export interface ArenaEncounter {
  id: string;
  kind: "random" | "boss";
  tierId: number;
  opponentId: string;
  backgroundVariantId?: string;
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

export const DEFAULT_HERO_ID = "local-hero";
export const DEFAULT_HERO_NAME = "Borshemir";
export const HERO_MAX_LEVEL = 100;
export const HERO_TOTAL_XP_TO_MAX_LEVEL = 5000;
export const HERO_XP_TO_NEXT_LEVEL_BY_LEVEL: readonly number[] = [
  10,
  10,
  10,
  10,
  15,
  15,
  15,
  15,
  15,
  15,
  15,
  15,
  15,
  15,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  25,
  25,
  25,
  25,
  25,
  25,
  25,
  25,
  25,
  25,
  30,
  30,
  30,
  30,
  30,
  30,
  30,
  30,
  30,
  30,
  40,
  40,
  40,
  40,
  40,
  40,
  40,
  40,
  40,
  40,
  55,
  55,
  55,
  55,
  55,
  55,
  55,
  55,
  55,
  55,
  70,
  70,
  70,
  70,
  70,
  70,
  70,
  70,
  70,
  70,
  85,
  85,
  85,
  85,
  85,
  85,
  85,
  85,
  85,
  85,
  100,
  100,
  100,
  100,
  100,
  100,
  100,
  100,
  100,
  100,
  110,
  110,
  110,
  115,
  115,
];
export const DEFAULT_HERO_XP_TO_NEXT_LEVEL = HERO_XP_TO_NEXT_LEVEL_BY_LEVEL[0]!;
export const HERO_STRENGTH_MELEE_DAMAGE_PERCENT_BONUS = 0.05;
export const HERO_STRENGTH_BODY_SCALE_BONUS = 0.02;
export const HERO_STRENGTH_CLINCH_RANGE_BONUS = 0.01;
export const HERO_STRENGTH_CLINCH_RANGE_MAX_BONUS = 0.50;
export const HERO_AGILITY_MOVEMENT_DISTANCE_BONUS = 0.015;
export const HERO_AGILITY_SPEAR_LUNGE_DAMAGE_PERCENT_BONUS = 0.05;
export const HERO_VITALITY_HP_BONUS = 1;
export const HERO_VITALITY_STAMINA_BONUS = 1;
export const HERO_VITALITY_REST_HP_BONUS = 1;
export const HERO_VITALITY_REST_STAMINA_BONUS = 1;
export const HERO_SHURIKEN_MAX_QUANTITY = 2;
export const HERO_SCROLL_MAX_QUANTITY = 3;
export const HERO_CRACK_ARMOR_SCROLL_ITEM_ID = "scroll_crack_armor_01";
export const HERO_FIREBALL_SCROLL_ITEM_ID = "scroll_fireball_01";
export const HERO_WARD_SCROLL_ITEM_ID = "scroll_ward_01";
export const HERO_PRECISE_STRIKE_SCROLL_ITEM_ID = "scroll_precise_strike_01";
export const HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID = "scroll_double_strike_01";
export const HERO_POISON_SCROLL_ITEM_ID = "scroll_poison_01";
export const HERO_STARTING_SKILL_POINTS = 1;
export const ENEMY_SHURIKEN_ROLL_CHANCE = 0.25;
export const ENEMY_SHURIKEN_QUANTITY = 1;
export const HERO_BOW_SHOT_CAPACITY_BASE = BOW_SHOTS_PER_BATTLE;
export const HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX = 10;
export const HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE = 500;
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

export function createRandomEnemyLoadout(random = Math.random, tierId = DEFAULT_ARENA_TIER_ID): EnemyLoadout {
  const tier = resolveArenaTierDefinition(tierId);

  return createRandomEnemyLoadoutFromPools(tier.enemyEquipmentPools, random);
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

function createRandomEnemyLoadoutFromPools(equipmentPools: readonly ArenaGeneratedEquipmentPool[], random = Math.random): EnemyLoadout {
  const equipment = createDefaultHeroEquipment();
  const shurikenItemId = rollEnemyShurikenItemIdFromPools(equipmentPools, random);

  equipmentPools.forEach((equipmentPool) => {
    HERO_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
      const itemIds = getEnemyItemIdsBySlot(slotKey, equipmentPool.itemRarities);
      const rollChance = getEnemyEquipmentSlotRollChance(equipmentPool, slotKey);

      if (itemIds.length === 0 || random() >= rollChance) {
        return;
      }

      equipment[slotKey] = pickRandom(itemIds, random);
    });
  });

  return {
    equipment,
    ...(shurikenItemId
      ? {
          shurikenCount: ENEMY_SHURIKEN_QUANTITY,
          shurikenDamage: getShurikenItemDamage(shurikenItemId),
          shurikenItemId,
        }
      : {}),
    visualPreset: pickRandom(ENEMY_VISUAL_PRESETS, random),
  };
}

function createRandomEnemyLoadoutForOpponent(opponent: ArenaRandomOpponentDefinition, random = Math.random): EnemyLoadout {
  const baseStats = createRandomOpponentBaseStats(opponent, random);

  return {
    ...createRandomEnemyLoadoutFromPools(opponent.equipmentPools, random),
    ...(baseStats ? { baseStats } : {}),
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

export function createDefaultHeroAppearance(): HeroAppearance {
  return { ...DEFAULT_HERO_APPEARANCE };
}

export function createDefaultHeroInventory(): HeroInventoryEntry[] {
  return [];
}

export function createDefaultHero(now = new Date().toISOString()): HeroState {
  return {
    id: DEFAULT_HERO_ID,
    name: DEFAULT_HERO_NAME,
    level: 1,
    xp: 0,
    xpToNextLevel: DEFAULT_HERO_XP_TO_NEXT_LEVEL,
    skillPoints: HERO_STARTING_SKILL_POINTS,
    gold: 0,
    bowShotCapacity: HERO_BOW_SHOT_CAPACITY_BASE,
    baseStats: {
      strength: 0,
      agility: 0,
      vitality: 0,
    },
    appearance: createDefaultHeroAppearance(),
    equipment: createDefaultHeroEquipment(),
    inventory: createDefaultHeroInventory(),
    unlockedShopRarities: [],
    defeatedArenaBossIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function deriveHeroStats(hero: HeroState): HeroStats {
  return deriveFighterStats(hero.baseStats, hero.equipment);
}

function deriveFighterStats(baseStats: HeroBaseStats, equipment: HeroEquipment): HeroStats {
  const equipmentBonuses = getHeroEquipmentStatBonuses(equipment);
  const armorBonus = getHeroEquipmentArmor(equipment);
  const mainWeaponDamageBonus = getHeroEquipmentSlotDamageBonus(equipment, "weaponMain");
  const bowWeaponDamageBonus = getHeroEquipmentSlotDamageBonus(equipment, "weaponBow");
  const strengthBonus = getHeroAttributeTotal(baseStats.strength, equipmentBonuses.strength);
  const agilityBonus = getHeroAttributeTotal(baseStats.agility, equipmentBonuses.agility);
  const vitalityBonus = getHeroAttributeTotal(baseStats.vitality, equipmentBonuses.vitality);

  return {
    maxHp: MAX_HP + vitalityBonus * HERO_VITALITY_HP_BONUS,
    maxArmor: armorBonus,
    maxStamina: MAX_STAMINA + vitalityBonus * HERO_VITALITY_STAMINA_BONUS,
    damageBonus: mainWeaponDamageBonus,
    weaponDamageBonus: bowWeaponDamageBonus,
    meleeDamagePercentBonus: roundStatBonus(strengthBonus * HERO_STRENGTH_MELEE_DAMAGE_PERCENT_BONUS),
    spearLungeDamagePercentBonus: roundStatBonus(agilityBonus * HERO_AGILITY_SPEAR_LUNGE_DAMAGE_PERCENT_BONUS),
    movementDistanceBonus: roundStatBonus(agilityBonus * HERO_AGILITY_MOVEMENT_DISTANCE_BONUS),
    bodyScaleBonus: roundStatBonus(strengthBonus * HERO_STRENGTH_BODY_SCALE_BONUS),
    clinchRangeBonus: roundStatBonus(Math.min(HERO_STRENGTH_CLINCH_RANGE_MAX_BONUS, strengthBonus * HERO_STRENGTH_CLINCH_RANGE_BONUS)),
    restHpRestoreBonus: vitalityBonus * HERO_VITALITY_REST_HP_BONUS,
    restStaminaRestoreBonus: vitalityBonus * HERO_VITALITY_REST_STAMINA_BONUS,
  };
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

export function getHeroEquipmentArmor(equipment: HeroEquipment): number {
  return getEquippedHeroItems(equipment).reduce((armor, item) => armor + (item.armorHp ?? 0), 0);
}

export function getHeroEquipmentArmorSlots(equipment: HeroEquipment): CombatArmorSlotState[] {
  return HERO_EQUIPMENT_SLOT_KEYS.flatMap((slotKey) => {
    const itemId = equipment[slotKey];
    if (!itemId) {
      return [];
    }

    const item = HERO_ITEM_CATALOG[itemId];
    const armorHp = Math.max(0, Math.floor(item?.armorHp ?? 0));

    if (!item || item.equipmentSlot !== slotKey || isHeroConsumableItem(item) || armorHp <= 0) {
      return [];
    }

    return [
      {
        slotKey,
        itemId,
        label: item.name,
        armorHp,
      },
    ];
  });
}

export function getHeroEquipmentDamageBonus(equipment: HeroEquipment): number {
  return getEquippedHeroItems(equipment).reduce((damageBonus, item) => damageBonus + (item.damageBonus ?? 0), 0);
}

export function getHeroEquipmentSlotDamageBonus(equipment: HeroEquipment, slotKey: HeroEquipmentSlotKey): number {
  const itemId = equipment[slotKey];
  const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

  return item && item.equipmentSlot === slotKey && !isHeroConsumableItem(item) ? Math.max(0, item.damageBonus ?? 0) : 0;
}

export function getHeroAttributeTotals(hero: HeroState): HeroBaseStats {
  const equipmentBonuses = getHeroEquipmentStatBonuses(hero.equipment);

  return {
    strength: getHeroAttributeTotal(hero.baseStats.strength, equipmentBonuses.strength),
    agility: getHeroAttributeTotal(hero.baseStats.agility, equipmentBonuses.agility),
    vitality: getHeroAttributeTotal(hero.baseStats.vitality, equipmentBonuses.vitality),
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

export function canHeroEquipItems(hero: HeroState, itemIds: readonly HeroItemId[]): boolean {
  if (itemIds.some((itemId) => !HERO_ITEM_CATALOG[itemId])) {
    return false;
  }

  return getHeroItemRequirementChecks(hero, itemIds).every((requirement) => requirement.current >= requirement.required);
}

export function isHeroConsumableItem(item: HeroItemDefinition | undefined): boolean {
  return item?.kind === "scroll" || getHeroItemWeaponClass(item) === "shuriken";
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

export function getHeroShurikenItemId(): HeroItemId | undefined {
  return GENERATED_EQUIPMENT_ITEM_IDS.find((itemId) => isHeroConsumableItemId(itemId));
}

export function getHeroShurikenCount(hero: HeroState): number {
  const shurikenItemId = getHeroShurikenItemId();

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
  return Math.max(0, HERO_SCROLL_MAX_QUANTITY - getHeroScrollQuantity(hero));
}

export function getHeroShurikenDamage(): number {
  return getShurikenItemDamage(getHeroShurikenItemId());
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

export function getHeroFireballScrollItemId(): HeroItemId {
  return HERO_FIREBALL_SCROLL_ITEM_ID;
}

export function getHeroFireballScrollCount(hero: HeroState): number {
  return getHeroItemQuantity(hero, HERO_FIREBALL_SCROLL_ITEM_ID);
}

export function getHeroFireballScrollEffect(): HeroScrollEffect {
  return HERO_SCROLL_ITEMS[HERO_FIREBALL_SCROLL_ITEM_ID]!.scrollEffect!;
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

export function getHeroPoisonScrollItemId(): HeroItemId {
  return HERO_POISON_SCROLL_ITEM_ID;
}

export function getHeroPoisonScrollCount(hero: HeroState): number {
  return getHeroItemQuantity(hero, HERO_POISON_SCROLL_ITEM_ID);
}

export function getHeroPoisonScrollEffect(): HeroScrollEffect {
  return HERO_SCROLL_ITEMS[HERO_POISON_SCROLL_ITEM_ID]!.scrollEffect!;
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

export function createCombatStateFromHero(hero: HeroState, encounterOrTierId: ArenaEncounter | number = DEFAULT_ARENA_TIER_ID): CombatState {
  const stats = deriveHeroStats(hero);
  const encounter = typeof encounterOrTierId === "number" ? createArenaRandomEnemyEncounter(encounterOrTierId) : encounterOrTierId;
  const enemyLoadout = encounter.enemyLoadout;
  const heroEquipment = hero.equipment;
  const enemyEquipment = enemyLoadout.equipment;
  const enemyStats = deriveFighterStats(enemyLoadout.baseStats ?? { strength: 0, agility: 0, vitality: 0 }, enemyEquipment);
  const playerMainWeaponClass = getHeroEquipmentWeaponClass(heroEquipment);
  const playerBowWeaponClass = getHeroEquipmentBowWeaponClass(heroEquipment);
  const playerWeaponClass = heroEquipment.weaponMain ? playerMainWeaponClass : playerBowWeaponClass ?? playerMainWeaponClass;
  const enemyMainWeaponClass = getHeroEquipmentWeaponClass(enemyEquipment);
  const enemyBowWeaponClass = getHeroEquipmentBowWeaponClass(enemyEquipment);
  const enemyWeaponClass = enemyEquipment.weaponMain ? enemyMainWeaponClass : enemyBowWeaponClass ?? enemyMainWeaponClass;
  const playerShurikenItemId = getHeroShurikenItemId();
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
      spearLungeDamagePercentBonus: stats.spearLungeDamagePercentBonus,
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
      shurikenDamage: getHeroShurikenDamage(),
      shurikenItemId: playerShurikenItemId,
      scrollCount: getHeroCrackArmorScrollCount(hero),
      scrollItemId: playerScrollItemId,
      fireballScrollCount: getHeroFireballScrollCount(hero),
      fireballScrollItemId: playerFireballScrollItemId,
      wardScrollCount: getHeroWardScrollCount(hero),
      wardScrollItemId: playerWardScrollItemId,
      wardHits: 0,
      preciseStrikeScrollCount: getHeroPreciseStrikeScrollCount(hero),
      preciseStrikeScrollItemId: playerPreciseStrikeScrollItemId,
      preciseStrikeHits: 0,
      doubleStrikeScrollCount: getHeroDoubleStrikeScrollCount(hero),
      doubleStrikeScrollItemId: playerDoubleStrikeScrollItemId,
      doubleStrikeHits: 0,
      poisonScrollCount: getHeroPoisonScrollCount(hero),
      poisonScrollItemId: playerPoisonScrollItemId,
      poisonTurns: 0,
      equipment: { ...heroEquipment },
      armorSlots: getHeroEquipmentArmorSlots(heroEquipment),
    },
    enemy: {
      ...state.enemy,
      name: encounter.name,
      hp: enemyStats.maxHp,
      maxHp: enemyStats.maxHp,
      armor: enemyStats.maxArmor,
      maxArmor: enemyStats.maxArmor,
      stamina: enemyStats.maxStamina,
      maxStamina: enemyStats.maxStamina,
      damageBonus: enemyStats.damageBonus,
      weaponDamageBonus: enemyStats.weaponDamageBonus,
      meleeDamagePercentBonus: enemyStats.meleeDamagePercentBonus,
      spearLungeDamagePercentBonus: enemyStats.spearLungeDamagePercentBonus,
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
      poisonTurns: 0,
      equipment: { ...enemyEquipment },
      armorSlots: getHeroEquipmentArmorSlots(enemyEquipment),
      visualPreset: { ...enemyLoadout.visualPreset },
    },
    encounter: {
      id: encounter.id,
      kind: encounter.kind,
      tierId: encounter.tierId,
      opponentId: encounter.opponentId,
      backgroundVariantId: encounter.backgroundVariantId,
    },
    log: [
      { text: `The gate slams open. ${hero.name} and ${encounter.name} enter the sand.`, important: true },
      { text: "Move into range, strike, then survive the enemy turn." },
    ],
  };
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
): CombatRewardApplication {
  const reward = getBattleReward(combat);
  const heroAfterConsumables = applyCombatConsumableUsage(hero, combat, now);
  const rolledLoot = combat.result === "win" ? rollCombatRewardLoot(heroAfterConsumables, combat, random) : [];
  const heroWithReward = applyBattleReward(heroAfterConsumables, reward, now);
  const heroWithBossProgress = combat.result === "win" && combat.encounter?.kind === "boss" ? recordArenaBossDefeat(heroWithReward, combat.encounter.opponentId, now) : heroWithReward;
  const lootApplication = applyArenaLootWithAppliedDrops(heroWithBossProgress, rolledLoot, now);

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

export function unlockAllArenaBossTiers(hero: HeroState, now = new Date().toISOString()): HeroState {
  const defeatedArenaBossIds = hero.defeatedArenaBossIds ?? [];
  const missingUnlockBossIds = [
    ...new Set(
      resolveArenaTierDefinitions()
        .map((tier) => tier.unlockBossId)
        .filter((bossId): bossId is string => Boolean(bossId)),
    ),
  ].filter((bossId) => !defeatedArenaBossIds.includes(bossId));

  if (missingUnlockBossIds.length <= 0) {
    return hero;
  }

  return {
    ...hero,
    defeatedArenaBossIds: [...defeatedArenaBossIds, ...missingUnlockBossIds],
    updatedAt: now,
  };
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

function rollCombatRewardLoot(hero: HeroState, combat: CombatState, random: () => number): ArenaLootDrop[] {
  if (combat.encounter?.kind === "boss") {
    return rollBossCombatLoot(hero, combat, random);
  }

  return rollCombatEncounterLoot(combat, random);
}

function rollBossCombatLoot(hero: HeroState, combat: CombatState, random: () => number): ArenaLootDrop[] {
  const entries = getCombatEncounterLootTable(combat).filter((candidate) => canHeroReceiveBossLootEntry(hero, candidate));

  return entries.length > 0 ? [createGuaranteedBossLootDrop(pickRandom(entries, random))] : [];
}

function canHeroReceiveBossLootEntry(hero: HeroState, entry: ArenaLootTableEntry): boolean {
  const itemIds = getValidArenaLootEntryItemIds(entry);

  return itemIds.length > 0 && !itemIds.some((itemId) => isHeroItemOwned(hero, itemId));
}

function createGuaranteedBossLootDrop(entry: ArenaLootTableEntry): ArenaLootDrop {
  const itemIds = getValidArenaLootEntryItemIds(entry);
  const itemId = itemIds[0]!;

  return {
    sourceId: entry.id,
    itemId,
    ...(itemIds.length > 1 ? { itemIds } : {}),
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

  const progress = applyHeroXp(hero.level, hero.xp + reward.xp);
  const earnedSkillPoints = Math.max(0, progress.level - hero.level);

  return {
    ...hero,
    gold: hero.gold + reward.gold,
    level: progress.level,
    xp: progress.xp,
    xpToNextLevel: progress.xpToNextLevel,
    skillPoints: hero.skillPoints + earnedSkillPoints,
    updatedAt: now,
  };
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

function buyHeroConsumableItems(hero: HeroState, purchase: HeroItemPurchase, now: string): HeroState {
  if (purchase.price <= 0 || purchase.price > hero.gold) {
    return hero;
  }

  const inventory = hero.inventory.map((entry) => ({ ...entry }));
  let hasChange = false;

  for (const itemId of purchase.itemIds) {
    const maxQuantity = getHeroConsumableMaxQuantity(itemId);
    const existingEntry = inventory.find((entry) => entry.itemId === itemId);
    const currentQuantity = Math.max(0, Math.floor(existingEntry?.quantity ?? 0));
    const isScroll = isHeroScrollItemId(itemId);
    const totalScrollQuantity = isScroll
      ? inventory.reduce((total, entry) => (isHeroScrollItemId(entry.itemId) ? total + Math.max(0, Math.floor(entry.quantity ?? 0)) : total), 0)
      : 0;

    if (maxQuantity <= 0 || currentQuantity >= maxQuantity || (isScroll && totalScrollQuantity >= HERO_SCROLL_MAX_QUANTITY)) {
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

function applyHeroXp(level: number, xp: number): Pick<HeroState, "level" | "xp" | "xpToNextLevel"> {
  let nextLevel = Math.max(1, Math.min(HERO_MAX_LEVEL, Math.floor(level)));
  let nextXp = nextLevel >= HERO_MAX_LEVEL ? 0 : Math.max(0, Math.floor(xp));
  let nextXpToNextLevel = getHeroXpToNextLevel(nextLevel);

  while (nextLevel < HERO_MAX_LEVEL && nextXp >= nextXpToNextLevel) {
    nextXp -= nextXpToNextLevel;
    nextLevel += 1;
    nextXpToNextLevel = getHeroXpToNextLevel(nextLevel);
  }

  if (nextLevel >= HERO_MAX_LEVEL) {
    nextXp = 0;
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

function rollEnemyShurikenItemId(itemRarities: readonly HeroItemRarity[], rollChance: number, random: () => number): HeroItemId | undefined {
  const itemIds = getEnemyShurikenItemIds(itemRarities);

  if (itemIds.length === 0 || random() >= clampEnemyRollChance(rollChance)) {
    return undefined;
  }

  return pickRandom(itemIds, random);
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
