import {
  BATTLE_LOSS_REWARD,
  BATTLE_WIN_REWARD,
  DEFAULT_ARENA_TIER_ID,
  getArenaBossDefinition as resolveArenaBossDefinition,
  getArenaRandomOpponentDefinition as resolveArenaRandomOpponentDefinition,
  getArenaRandomOpponentsForTier as resolveArenaRandomOpponentsForTier,
  getArenaTierDefinition as resolveArenaTierDefinition,
} from "./arenaOpponents";
import type {
  ArenaBossDefinition,
  ArenaGeneratedEquipmentPool,
  ArenaLootTableEntry,
  ArenaOpponentRewards,
  ArenaRandomOpponentDefinition,
  ArenaTierDefinition,
} from "./arenaOpponents";
import { freshState, MAX_HP, MAX_STAMINA, type CombatState } from "./combat";
import { GENERATED_EQUIPMENT_ITEM_CATALOG, GENERATED_EQUIPMENT_ITEM_IDS, GENERATED_EQUIPMENT_ITEM_RECORDS } from "./generated/equipmentItems.generated";

export {
  ARENA_BOSSES,
  ARENA_RANDOM_OPPONENTS,
  ARENA_TIERS,
  BATTLE_LOSS_REWARD,
  BATTLE_WIN_REWARD,
  DEFAULT_ARENA_TIER_ID,
  getArenaBossDefinition,
  getArenaBossesForTier,
  getArenaRandomOpponentDefinition,
  getArenaRandomOpponentsForTier,
  getArenaTierDefinition,
} from "./arenaOpponents";
export type {
  ArenaBossDefinition,
  ArenaBossId,
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
  baseStats: HeroBaseStats;
  equipment: HeroEquipment;
  inventory: HeroInventoryEntry[];
  defeatedArenaBossIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HeroBaseStats {
  strength: number;
  agility: number;
  vitality: number;
}

export type HeroAttributeKey = keyof HeroBaseStats;

export interface HeroStats {
  maxHp: number;
  maxArmor: number;
  maxStamina: number;
  damageBonus: number;
  movementDistanceBonus: number;
  bodyScaleBonus: number;
  clinchRangeBonus: number;
  restHpRestoreBonus: number;
  restStaminaRestoreBonus: number;
}

export const HERO_EQUIPMENT_SLOT_KEYS = [
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

export type HeroEquipmentSlotKey = (typeof HERO_EQUIPMENT_SLOT_KEYS)[number];
export type HeroItemId = string;
export type HeroItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythical" | "unique";
export type HeroEquipment = Record<HeroEquipmentSlotKey, HeroItemId | null>;

export interface HeroItemDefinition {
  id: HeroItemId;
  name: string;
  kind: "weapon" | "armor";
  rarity?: HeroItemRarity;
  weaponClass?: HeroWeaponClass;
  armorCategory?: "leather" | "cloth" | "chain" | "plate";
  equipmentSlot: HeroEquipmentSlotKey;
  armorHp?: number;
  damageBonus?: number;
  statBonuses?: Partial<HeroBaseStats>;
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
  visualPreset: EnemyVisualPreset;
}

export interface ArenaEncounter {
  id: string;
  kind: "random" | "boss";
  tierId: number;
  opponentId: string;
  name: string;
  enemyLoadout: EnemyLoadout;
  rewards: ArenaOpponentRewards;
  lootTable: readonly ArenaLootTableEntry[];
}

export interface ArenaLootDrop {
  sourceId: string;
  itemId: HeroItemId;
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
export const HERO_MAX_LEVEL = 50;
export const HERO_TOTAL_XP_TO_MAX_LEVEL = 1000;
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
  25,
  25,
  30,
  30,
  30,
  30,
  30,
];
export const DEFAULT_HERO_XP_TO_NEXT_LEVEL = HERO_XP_TO_NEXT_LEVEL_BY_LEVEL[0]!;
export const HERO_STRENGTH_DAMAGE_BONUS = 1;
export const HERO_STRENGTH_BODY_SCALE_BONUS = 0.02;
export const HERO_STRENGTH_CLINCH_RANGE_BONUS = 0.01;
export const HERO_STRENGTH_CLINCH_RANGE_MAX_BONUS = 0.50;
export const HERO_AGILITY_MOVEMENT_DISTANCE_BONUS = 0.015;
export const HERO_VITALITY_HP_BONUS = 1;
export const HERO_VITALITY_STAMINA_BONUS = 1;
export const HERO_VITALITY_REST_HP_BONUS = 1;
export const HERO_VITALITY_REST_STAMINA_BONUS = 1;
export const HERO_ITEM_IDS = GENERATED_EQUIPMENT_ITEM_IDS;
export const ALL_HERO_ITEM_IDS = HERO_ITEM_IDS;
export const HERO_ITEM_CATALOG: Record<HeroItemId, HeroItemDefinition> = GENERATED_EQUIPMENT_ITEM_CATALOG;

export const DEFAULT_ENEMY_VISUAL_PRESET: EnemyVisualPreset = {
  skin: 0xefaa7b,
  skinDark: 0xd9854d,
  hair: 0x8b4a1f,
  muscle: 0x9b5a35,
};

export const ENEMY_VISUAL_PRESETS: EnemyVisualPreset[] = [DEFAULT_ENEMY_VISUAL_PRESET];

export function createRandomEnemyLoadout(random = Math.random, tierId = DEFAULT_ARENA_TIER_ID): EnemyLoadout {
  const tier = resolveArenaTierDefinition(tierId);
  const equipmentPool: ArenaGeneratedEquipmentPool = {
    itemRarities: tier.enemyItemRarities,
    rollChance: tier.enemyEquipmentRollChance,
  };

  return createRandomEnemyLoadoutFromPool(equipmentPool, random);
}

export function createArenaRandomEnemyEncounter(tierId = DEFAULT_ARENA_TIER_ID, random = Math.random): ArenaEncounter {
  const tier = resolveArenaTierDefinition(tierId);
  const opponents = resolveArenaRandomOpponentsForTier(tier.id);
  const opponent = opponents.length > 0 ? pickRandom(opponents, random) : createFallbackRandomOpponent(tier);

  return {
    id: `random:${opponent.id}`,
    kind: "random",
    tierId: opponent.tierId,
    opponentId: opponent.id,
    name: opponent.name,
    enemyLoadout: createRandomEnemyLoadoutFromPool(opponent.equipmentPool, random),
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

function createRandomEnemyLoadoutFromPool(equipmentPool: ArenaGeneratedEquipmentPool, random = Math.random): EnemyLoadout {
  const equipment = createDefaultHeroEquipment();

  HERO_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    const itemIds = getEnemyItemIdsBySlot(slotKey, equipmentPool.itemRarities);

    if (itemIds.length === 0 || random() >= equipmentPool.rollChance) {
      return;
    }

    equipment[slotKey] = pickRandom(itemIds, random);
  });

  return {
    equipment,
    visualPreset: pickRandom(ENEMY_VISUAL_PRESETS, random),
  };
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
    name: "Grumbus",
    equipmentPool: {
      itemRarities: tier.enemyItemRarities,
      rollChance: tier.enemyEquipmentRollChance,
    },
    rewards: {
      win: BATTLE_WIN_REWARD,
      loss: BATTLE_LOSS_REWARD,
    },
  };
}

export function createDefaultHeroEquipment(): HeroEquipment {
  return Object.fromEntries(HERO_EQUIPMENT_SLOT_KEYS.map((slotKey) => [slotKey, null])) as HeroEquipment;
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
    skillPoints: 0,
    gold: 0,
    baseStats: {
      strength: 0,
      agility: 0,
      vitality: 0,
    },
    equipment: createDefaultHeroEquipment(),
    inventory: createDefaultHeroInventory(),
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
  const equipmentDamageBonus = getHeroEquipmentDamageBonus(equipment);
  const strengthBonus = getHeroAttributeTotal(baseStats.strength, equipmentBonuses.strength);
  const agilityBonus = getHeroAttributeTotal(baseStats.agility, equipmentBonuses.agility);
  const vitalityBonus = getHeroAttributeTotal(baseStats.vitality, equipmentBonuses.vitality);

  return {
    maxHp: MAX_HP + vitalityBonus * HERO_VITALITY_HP_BONUS,
    maxArmor: armorBonus,
    maxStamina: MAX_STAMINA + vitalityBonus * HERO_VITALITY_STAMINA_BONUS,
    damageBonus: equipmentDamageBonus + strengthBonus * HERO_STRENGTH_DAMAGE_BONUS,
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

    return item && item.equipmentSlot === slotKey ? [item] : [];
  });
}

export function isHeroItemOwned(hero: HeroState, itemId: HeroItemId): boolean {
  const item = HERO_ITEM_CATALOG[itemId];
  const isEquipped = item ? hero.equipment[item.equipmentSlot] === itemId : false;

  return isEquipped || hero.inventory.some((entry) => entry.itemId === itemId && entry.quantity > 0);
}

export function areHeroItemsOwned(hero: HeroState, itemIds: readonly HeroItemId[]): boolean {
  return itemIds.every((itemId) => isHeroItemOwned(hero, itemId));
}

export function areHeroItemsEquipped(hero: HeroState, itemIds: readonly HeroItemId[]): boolean {
  return itemIds.every((itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    return Boolean(item && hero.equipment[item.equipmentSlot] === itemId);
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

export function getHeroEquipmentDamageBonus(equipment: HeroEquipment): number {
  return getEquippedHeroItems(equipment).reduce((damageBonus, item) => damageBonus + (item.damageBonus ?? 0), 0);
}

export function getHeroEquipmentWeaponClass(equipment: HeroEquipment): HeroWeaponClass {
  const weaponItemId = equipment.weaponMain;
  const weaponItem = weaponItemId ? HERO_ITEM_CATALOG[weaponItemId] : undefined;

  return getHeroItemWeaponClass(weaponItem);
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
  const enemyStats = deriveFighterStats(enemyLoadout.baseStats ?? { strength: 0, agility: 0, vitality: 0 }, enemyLoadout.equipment);
  const playerWeaponClass = getHeroEquipmentWeaponClass(hero.equipment);
  const enemyWeaponClass = getHeroEquipmentWeaponClass(enemyLoadout.equipment);
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
      movementDistanceBonus: stats.movementDistanceBonus,
      bodyScaleBonus: stats.bodyScaleBonus,
      clinchRangeBonus: stats.clinchRangeBonus,
      restHpRestoreBonus: stats.restHpRestoreBonus,
      restStaminaRestoreBonus: stats.restStaminaRestoreBonus,
      weaponClass: playerWeaponClass,
      equipment: { ...hero.equipment },
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
      movementDistanceBonus: enemyStats.movementDistanceBonus,
      bodyScaleBonus: enemyStats.bodyScaleBonus,
      clinchRangeBonus: enemyStats.clinchRangeBonus,
      restHpRestoreBonus: enemyStats.restHpRestoreBonus,
      restStaminaRestoreBonus: enemyStats.restStaminaRestoreBonus,
      weaponClass: enemyWeaponClass,
      equipment: { ...enemyLoadout.equipment },
      visualPreset: { ...enemyLoadout.visualPreset },
    },
    encounter: {
      id: encounter.id,
      kind: encounter.kind,
      tierId: encounter.tierId,
      opponentId: encounter.opponentId,
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
  const rolledLoot = combat.result === "win" ? rollCombatEncounterLoot(combat, random) : [];
  const heroWithReward = applyBattleReward(hero, reward, now);
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

    if (!drop.itemId || quantity <= 0 || !HERO_ITEM_CATALOG[drop.itemId]) {
      return;
    }

    const existingEntry = inventory.find((entry) => entry.itemId === drop.itemId);

    if (existingEntry) {
      existingEntry.quantity += quantity;
    } else {
      inventory.push({ itemId: drop.itemId, quantity });
    }

    appliedLoot.push({ ...drop, quantity });
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

export function buyAndEquipHeroItems(hero: HeroState, purchase: HeroItemPurchase, now = new Date().toISOString()): HeroState {
  const price = areHeroItemsOwned(hero, purchase.itemIds) ? 0 : purchase.price;

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
      record.item.equipmentSlot === slotKey &&
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
