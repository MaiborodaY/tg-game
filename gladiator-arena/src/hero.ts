import { freshState, MAX_HP, MAX_STAMINA, type CombatState } from "./combat";

export interface HeroState {
  id: string;
  name: string;
  level: number;
  xp: number;
  gold: number;
  baseStats: HeroBaseStats;
  equipment: HeroEquipment;
  inventory: HeroInventoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface HeroBaseStats {
  strength: number;
  endurance: number;
  agility: number;
}

export interface HeroStats {
  maxHp: number;
  maxStamina: number;
  lightDamageBonus: number;
  mediumDamageBonus: number;
  heavyDamageBonus: number;
}

export const HERO_EQUIPMENT_SLOT_KEYS = [
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

export type HeroEquipmentSlotKey = (typeof HERO_EQUIPMENT_SLOT_KEYS)[number];
export type HeroEquipment = Record<HeroEquipmentSlotKey, HeroItemId | null>;

export interface HeroItemDefinition {
  id: HeroItemId;
  name: string;
  kind: "weapon" | "armor";
  equipmentSlot: HeroEquipmentSlotKey;
  statBonuses?: Partial<HeroBaseStats>;
}

export interface HeroInventoryEntry {
  itemId: string;
  quantity: number;
}

export interface BattleReward {
  gold: number;
  xp: number;
}

export const DEFAULT_HERO_ID = "local-hero";
export const DEFAULT_HERO_NAME = "Borshemir";
export const TRAINING_WEAPON_ID = "training_sword";
export const STARTER_HELMET_ID = "starter_helmet";
export const STARTER_BREASTPLATE_ID = "starter_breastplate";
export const STARTER_BACK_SHOULDERGUARD_ID = "starter_back_shoulderguard";
export const STARTER_FRONT_SHOULDERGUARD_ID = "starter_front_shoulderguard";
export const STARTER_BACK_GAUNTLET_ID = "starter_back_gauntlet";
export const STARTER_FRONT_GAUNTLET_ID = "starter_front_gauntlet";
export const STARTER_BACK_GREAVE_ID = "starter_back_greave";
export const STARTER_FRONT_GREAVE_ID = "starter_front_greave";
export const STARTER_BACK_SHINGUARD_ID = "starter_back_shinguard";
export const STARTER_FRONT_SHINGUARD_ID = "starter_front_shinguard";
export const STARTER_BACK_BOOT_ID = "starter_back_boot";
export const STARTER_FRONT_BOOT_ID = "starter_front_boot";
export const STARTER_ARMOUR_ID = STARTER_BREASTPLATE_ID;

export const HERO_ITEM_IDS = [
  TRAINING_WEAPON_ID,
  STARTER_HELMET_ID,
  STARTER_BREASTPLATE_ID,
  STARTER_BACK_SHOULDERGUARD_ID,
  STARTER_FRONT_SHOULDERGUARD_ID,
  STARTER_BACK_GAUNTLET_ID,
  STARTER_FRONT_GAUNTLET_ID,
  STARTER_BACK_GREAVE_ID,
  STARTER_FRONT_GREAVE_ID,
  STARTER_BACK_SHINGUARD_ID,
  STARTER_FRONT_SHINGUARD_ID,
  STARTER_BACK_BOOT_ID,
  STARTER_FRONT_BOOT_ID,
] as const;

export type HeroItemId = (typeof HERO_ITEM_IDS)[number];

export const HERO_ITEM_CATALOG: Record<HeroItemId, HeroItemDefinition> = {
  [TRAINING_WEAPON_ID]: { id: TRAINING_WEAPON_ID, name: "Training Sword", kind: "weapon", equipmentSlot: "weaponMain" },
  [STARTER_HELMET_ID]: { id: STARTER_HELMET_ID, name: "Starter Helmet", kind: "armor", equipmentSlot: "helmet" },
  [STARTER_BREASTPLATE_ID]: { id: STARTER_BREASTPLATE_ID, name: "Starter Breastplate", kind: "armor", equipmentSlot: "breastplate" },
  [STARTER_BACK_SHOULDERGUARD_ID]: {
    id: STARTER_BACK_SHOULDERGUARD_ID,
    name: "Starter Back Shoulderguard",
    kind: "armor",
    equipmentSlot: "backShoulderguard",
  },
  [STARTER_FRONT_SHOULDERGUARD_ID]: {
    id: STARTER_FRONT_SHOULDERGUARD_ID,
    name: "Starter Front Shoulderguard",
    kind: "armor",
    equipmentSlot: "frontShoulderguard",
  },
  [STARTER_BACK_GAUNTLET_ID]: { id: STARTER_BACK_GAUNTLET_ID, name: "Starter Back Gauntlet", kind: "armor", equipmentSlot: "backGauntlet" },
  [STARTER_FRONT_GAUNTLET_ID]: { id: STARTER_FRONT_GAUNTLET_ID, name: "Starter Front Gauntlet", kind: "armor", equipmentSlot: "frontGauntlet" },
  [STARTER_BACK_GREAVE_ID]: { id: STARTER_BACK_GREAVE_ID, name: "Starter Back Greave", kind: "armor", equipmentSlot: "backGreave" },
  [STARTER_FRONT_GREAVE_ID]: { id: STARTER_FRONT_GREAVE_ID, name: "Starter Front Greave", kind: "armor", equipmentSlot: "frontGreave" },
  [STARTER_BACK_SHINGUARD_ID]: { id: STARTER_BACK_SHINGUARD_ID, name: "Starter Back Shinguard", kind: "armor", equipmentSlot: "backShinguard" },
  [STARTER_FRONT_SHINGUARD_ID]: { id: STARTER_FRONT_SHINGUARD_ID, name: "Starter Front Shinguard", kind: "armor", equipmentSlot: "frontShinguard" },
  [STARTER_BACK_BOOT_ID]: { id: STARTER_BACK_BOOT_ID, name: "Starter Back Boot", kind: "armor", equipmentSlot: "backBoot" },
  [STARTER_FRONT_BOOT_ID]: { id: STARTER_FRONT_BOOT_ID, name: "Starter Front Boot", kind: "armor", equipmentSlot: "frontBoot" },
};

export function createDefaultHeroEquipment(): HeroEquipment {
  return {
    weaponMain: TRAINING_WEAPON_ID,
    helmet: STARTER_HELMET_ID,
    breastplate: STARTER_BREASTPLATE_ID,
    backShoulderguard: STARTER_BACK_SHOULDERGUARD_ID,
    frontShoulderguard: STARTER_FRONT_SHOULDERGUARD_ID,
    backGauntlet: STARTER_BACK_GAUNTLET_ID,
    frontGauntlet: STARTER_FRONT_GAUNTLET_ID,
    backGreave: STARTER_BACK_GREAVE_ID,
    frontGreave: STARTER_FRONT_GREAVE_ID,
    backShinguard: STARTER_BACK_SHINGUARD_ID,
    frontShinguard: STARTER_FRONT_SHINGUARD_ID,
    backBoot: STARTER_BACK_BOOT_ID,
    frontBoot: STARTER_FRONT_BOOT_ID,
  };
}

export function createDefaultHero(now = new Date().toISOString()): HeroState {
  return {
    id: DEFAULT_HERO_ID,
    name: DEFAULT_HERO_NAME,
    level: 1,
    xp: 0,
    gold: 0,
    baseStats: {
      strength: 1,
      endurance: 1,
      agility: 1,
    },
    equipment: createDefaultHeroEquipment(),
    inventory: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function deriveHeroStats(hero: HeroState): HeroStats {
  const equipmentBonuses = getHeroEquipmentStatBonuses(hero.equipment);
  const strengthBonus = Math.max(0, hero.baseStats.strength + equipmentBonuses.strength - 1);
  const enduranceBonus = Math.max(0, hero.baseStats.endurance + equipmentBonuses.endurance - 1);
  const agilityBonus = Math.max(0, hero.baseStats.agility + equipmentBonuses.agility - 1);

  return {
    maxHp: MAX_HP + enduranceBonus * 4,
    maxStamina: MAX_STAMINA + agilityBonus,
    lightDamageBonus: Math.floor(strengthBonus / 2),
    mediumDamageBonus: strengthBonus,
    heavyDamageBonus: strengthBonus * 2,
  };
}

export function getEquippedHeroItems(equipment: HeroEquipment): HeroItemDefinition[] {
  return HERO_EQUIPMENT_SLOT_KEYS.flatMap((slotKey) => {
    const itemId = equipment[slotKey];
    const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

    return item && item.equipmentSlot === slotKey ? [item] : [];
  });
}

export function getHeroEquipmentStatBonuses(equipment: HeroEquipment): HeroBaseStats {
  return getEquippedHeroItems(equipment).reduce(
    (bonuses, item) => ({
      strength: bonuses.strength + (item.statBonuses?.strength ?? 0),
      endurance: bonuses.endurance + (item.statBonuses?.endurance ?? 0),
      agility: bonuses.agility + (item.statBonuses?.agility ?? 0),
    }),
    { strength: 0, endurance: 0, agility: 0 },
  );
}

export function createCombatStateFromHero(hero: HeroState): CombatState {
  const stats = deriveHeroStats(hero);
  const state = freshState();

  return {
    ...state,
    player: {
      ...state.player,
      name: hero.name,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      stamina: stats.maxStamina,
      maxStamina: stats.maxStamina,
    },
    log: [
      { text: `The gate slams open. ${hero.name} and ${state.enemy.name} enter the sand.`, important: true },
      { text: "Move into range, strike, then survive the enemy turn." },
    ],
  };
}

export function getBattleReward(combat: CombatState): BattleReward {
  if (combat.result === "win") {
    return { gold: 18 + Math.floor(combat.score / 500), xp: 24 };
  }

  if (combat.result === "draw") {
    return { gold: 6, xp: 10 };
  }

  if (combat.result === "lose") {
    return { gold: 2, xp: 4 };
  }

  return { gold: 0, xp: 0 };
}

export function applyBattleReward(hero: HeroState, reward: BattleReward, now = new Date().toISOString()): HeroState {
  if (reward.gold <= 0 && reward.xp <= 0) {
    return hero;
  }

  return {
    ...hero,
    gold: hero.gold + reward.gold,
    xp: hero.xp + reward.xp,
    updatedAt: now,
  };
}
