import { freshState, MAX_HP, MAX_STAMINA, type CombatState } from "./combat";
import { GENERATED_EQUIPMENT_ITEM_CATALOG, GENERATED_EQUIPMENT_ITEM_IDS } from "./generated/equipmentItems.generated";

export type HeroWeaponClass = "sword" | "axe" | "bow";

export interface HeroState {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
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
  maxArmor: number;
  maxStamina: number;
  damageBonus: number;
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
export type HeroEquipment = Record<HeroEquipmentSlotKey, HeroItemId | null>;

export interface HeroItemDefinition {
  id: HeroItemId;
  name: string;
  kind: "weapon" | "armor";
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
  visualPreset: EnemyVisualPreset;
}

export const DEFAULT_HERO_ID = "local-hero";
export const DEFAULT_HERO_NAME = "Borshemir";
export const DEFAULT_HERO_XP_TO_NEXT_LEVEL = 100;
export const HERO_XP_TO_NEXT_LEVEL_STEP = 50;
export const BATTLE_WIN_REWARD: BattleReward = { gold: 25, xp: 20 };
export const TRAINING_WEAPON_ID = "training_sword";
export const STARTER_HELMET_ID = "starter_helmet";
export const STARTER_BREASTPLATE_ID = "starter_breastplate";
export const CLOTH_BREASTPLATE_ID = "cloth_breastplate_01";
export const STARTER_BACK_SHOULDERGUARD_ID = "starter_back_shoulderguard";
export const STARTER_FRONT_SHOULDERGUARD_ID = "starter_front_shoulderguard";
export const STARTER_BACK_WRIST_ID = "starter_back_wrist";
export const STARTER_FRONT_WRIST_ID = "starter_front_wrist";
export const STARTER_BACK_GREAVE_ID = "starter_back_greave";
export const STARTER_FRONT_GREAVE_ID = "starter_front_greave";
export const STARTER_BACK_SHINGUARD_ID = "starter_back_shinguard";
export const STARTER_FRONT_SHINGUARD_ID = "starter_front_shinguard";
export const STARTER_BACK_BOOT_ID = "starter_back_boot";
export const STARTER_FRONT_BOOT_ID = "starter_front_boot";
export const STARTER_ARMOUR_ID = STARTER_BREASTPLATE_ID;
export const STARTER_ARMOR_HP = 1;
export const TRAINING_WEAPON_DAMAGE_BONUS = 1;

export const HERO_ITEM_IDS = [
  TRAINING_WEAPON_ID,
  STARTER_HELMET_ID,
  STARTER_BREASTPLATE_ID,
  CLOTH_BREASTPLATE_ID,
  STARTER_BACK_SHOULDERGUARD_ID,
  STARTER_FRONT_SHOULDERGUARD_ID,
  STARTER_BACK_WRIST_ID,
  STARTER_FRONT_WRIST_ID,
  STARTER_BACK_GREAVE_ID,
  STARTER_FRONT_GREAVE_ID,
  STARTER_BACK_SHINGUARD_ID,
  STARTER_FRONT_SHINGUARD_ID,
  STARTER_BACK_BOOT_ID,
  STARTER_FRONT_BOOT_ID,
] as const satisfies readonly HeroItemId[];

export const ALL_HERO_ITEM_IDS = [...HERO_ITEM_IDS, ...GENERATED_EQUIPMENT_ITEM_IDS] as const satisfies readonly HeroItemId[];

const STARTER_HERO_ITEM_IDS: HeroItemId[] = [
  TRAINING_WEAPON_ID,
  STARTER_HELMET_ID,
  STARTER_BREASTPLATE_ID,
  STARTER_BACK_SHOULDERGUARD_ID,
  STARTER_FRONT_SHOULDERGUARD_ID,
  STARTER_BACK_WRIST_ID,
  STARTER_FRONT_WRIST_ID,
  STARTER_BACK_GREAVE_ID,
  STARTER_FRONT_GREAVE_ID,
  STARTER_BACK_SHINGUARD_ID,
  STARTER_FRONT_SHINGUARD_ID,
  STARTER_BACK_BOOT_ID,
  STARTER_FRONT_BOOT_ID,
];

export const HERO_ITEM_CATALOG: Record<HeroItemId, HeroItemDefinition> = {
  [TRAINING_WEAPON_ID]: {
    id: TRAINING_WEAPON_ID,
    name: "Training Sword",
    kind: "weapon",
    weaponClass: "sword",
    equipmentSlot: "weaponMain",
    damageBonus: TRAINING_WEAPON_DAMAGE_BONUS,
  },
  [STARTER_HELMET_ID]: {
    id: STARTER_HELMET_ID,
    name: "Starter Helmet",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "helmet",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_BREASTPLATE_ID]: {
    id: STARTER_BREASTPLATE_ID,
    name: "Leather Breastplate",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "breastplate",
    armorHp: STARTER_ARMOR_HP,
  },
  [CLOTH_BREASTPLATE_ID]: {
    id: CLOTH_BREASTPLATE_ID,
    name: "Cloth Breastplate",
    kind: "armor",
    armorCategory: "cloth",
    equipmentSlot: "breastplate",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_BACK_SHOULDERGUARD_ID]: {
    id: STARTER_BACK_SHOULDERGUARD_ID,
    name: "Starter Back Shoulderguard",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "backShoulderguard",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_FRONT_SHOULDERGUARD_ID]: {
    id: STARTER_FRONT_SHOULDERGUARD_ID,
    name: "Starter Front Shoulderguard",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "frontShoulderguard",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_BACK_WRIST_ID]: {
    id: STARTER_BACK_WRIST_ID,
    name: "Starter Back Wrist",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "backWrist",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_FRONT_WRIST_ID]: {
    id: STARTER_FRONT_WRIST_ID,
    name: "Starter Front Wrist",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "frontWrist",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_BACK_GREAVE_ID]: {
    id: STARTER_BACK_GREAVE_ID,
    name: "Starter Back Greave",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "backGreave",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_FRONT_GREAVE_ID]: {
    id: STARTER_FRONT_GREAVE_ID,
    name: "Starter Front Greave",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "frontGreave",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_BACK_SHINGUARD_ID]: {
    id: STARTER_BACK_SHINGUARD_ID,
    name: "Starter Back Shinguard",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "backShinguard",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_FRONT_SHINGUARD_ID]: {
    id: STARTER_FRONT_SHINGUARD_ID,
    name: "Starter Front Shinguard",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "frontShinguard",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_BACK_BOOT_ID]: {
    id: STARTER_BACK_BOOT_ID,
    name: "Starter Back Boot",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "backBoot",
    armorHp: STARTER_ARMOR_HP,
  },
  [STARTER_FRONT_BOOT_ID]: {
    id: STARTER_FRONT_BOOT_ID,
    name: "Starter Front Boot",
    kind: "armor",
    armorCategory: "leather",
    equipmentSlot: "frontBoot",
    armorHp: STARTER_ARMOR_HP,
  },
  ...GENERATED_EQUIPMENT_ITEM_CATALOG,
};

export const DEFAULT_ENEMY_VISUAL_PRESET: EnemyVisualPreset = {
  skin: 0xefaa7b,
  skinDark: 0xd9854d,
  hair: 0x8b4a1f,
  muscle: 0x9b5a35,
};

export const ENEMY_VISUAL_PRESETS: EnemyVisualPreset[] = [DEFAULT_ENEMY_VISUAL_PRESET];

const ENEMY_ARMOR_ITEMS: Array<[HeroEquipmentSlotKey, HeroItemId]> = [
  ["helmet", STARTER_HELMET_ID],
  ["breastplate", STARTER_BREASTPLATE_ID],
  ["backShoulderguard", STARTER_BACK_SHOULDERGUARD_ID],
  ["frontShoulderguard", STARTER_FRONT_SHOULDERGUARD_ID],
  ["backWrist", STARTER_BACK_WRIST_ID],
  ["frontWrist", STARTER_FRONT_WRIST_ID],
  ["backGreave", STARTER_BACK_GREAVE_ID],
  ["frontGreave", STARTER_FRONT_GREAVE_ID],
  ["backShinguard", STARTER_BACK_SHINGUARD_ID],
  ["frontShinguard", STARTER_FRONT_SHINGUARD_ID],
  ["backBoot", STARTER_BACK_BOOT_ID],
  ["frontBoot", STARTER_FRONT_BOOT_ID],
];

const ENEMY_WEAPON_ITEMS: Array<[HeroEquipmentSlotKey, HeroItemId]> = [["weaponMain", TRAINING_WEAPON_ID]];

export function createRandomEnemyLoadout(random = Math.random): EnemyLoadout {
  const equipment = createDefaultHeroEquipment();

  ENEMY_WEAPON_ITEMS.forEach(([slotKey, itemId]) => {
    if (random() >= 0.52) {
      return;
    }

    equipment[slotKey] = itemId;
  });

  ENEMY_ARMOR_ITEMS.forEach(([slotKey, itemId]) => {
    if (random() >= 0.52) {
      return;
    }

    equipment[slotKey] = itemId;
  });

  return {
    equipment,
    visualPreset: pickRandom(ENEMY_VISUAL_PRESETS, random),
  };
}

export function createDefaultHeroEquipment(): HeroEquipment {
  return Object.fromEntries(HERO_EQUIPMENT_SLOT_KEYS.map((slotKey) => [slotKey, null])) as HeroEquipment;
}

export function createStarterHeroEquipment(): HeroEquipment {
  return {
    weaponMain: TRAINING_WEAPON_ID,
    helmet: STARTER_HELMET_ID,
    breastplate: STARTER_BREASTPLATE_ID,
    backShoulderguard: STARTER_BACK_SHOULDERGUARD_ID,
    frontShoulderguard: STARTER_FRONT_SHOULDERGUARD_ID,
    backWrist: STARTER_BACK_WRIST_ID,
    frontWrist: STARTER_FRONT_WRIST_ID,
    backGlove: null,
    frontGlove: null,
    backGreave: STARTER_BACK_GREAVE_ID,
    frontGreave: STARTER_FRONT_GREAVE_ID,
    backShinguard: STARTER_BACK_SHINGUARD_ID,
    frontShinguard: STARTER_FRONT_SHINGUARD_ID,
    backBoot: STARTER_BACK_BOOT_ID,
    frontBoot: STARTER_FRONT_BOOT_ID,
  };
}

export function createDefaultHeroInventory(): HeroInventoryEntry[] {
  return [];
}

export function createStarterHeroInventory(): HeroInventoryEntry[] {
  return STARTER_HERO_ITEM_IDS.map((itemId) => ({ itemId, quantity: 1 }));
}

export function createDefaultHero(now = new Date().toISOString()): HeroState {
  return {
    id: DEFAULT_HERO_ID,
    name: DEFAULT_HERO_NAME,
    level: 1,
    xp: 0,
    xpToNextLevel: DEFAULT_HERO_XP_TO_NEXT_LEVEL,
    gold: 0,
    baseStats: {
      strength: 1,
      endurance: 1,
      agility: 1,
    },
    equipment: createDefaultHeroEquipment(),
    inventory: createDefaultHeroInventory(),
    createdAt: now,
    updatedAt: now,
  };
}

export function deriveHeroStats(hero: HeroState): HeroStats {
  const equipmentBonuses = getHeroEquipmentStatBonuses(hero.equipment);
  const armorBonus = getHeroEquipmentArmor(hero.equipment);
  const damageBonus = getHeroEquipmentDamageBonus(hero.equipment);
  const strengthBonus = Math.max(0, hero.baseStats.strength + equipmentBonuses.strength - 1);
  const enduranceBonus = Math.max(0, hero.baseStats.endurance + equipmentBonuses.endurance - 1);
  const agilityBonus = Math.max(0, hero.baseStats.agility + equipmentBonuses.agility - 1);

  return {
    maxHp: MAX_HP + enduranceBonus * 4,
    maxArmor: armorBonus,
    maxStamina: MAX_STAMINA + agilityBonus,
    damageBonus,
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

  if (haystack.includes("axe")) {
    return "axe";
  }

  return "sword";
}

export function createCombatStateFromHero(hero: HeroState): CombatState {
  const stats = deriveHeroStats(hero);
  const enemyLoadout = createRandomEnemyLoadout();
  const enemyArmor = getHeroEquipmentArmor(enemyLoadout.equipment);
  const enemyDamageBonus = getHeroEquipmentDamageBonus(enemyLoadout.equipment);
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
      weaponClass: playerWeaponClass,
      equipment: { ...hero.equipment },
    },
    enemy: {
      ...state.enemy,
      armor: enemyArmor,
      maxArmor: enemyArmor,
      damageBonus: enemyDamageBonus,
      weaponClass: enemyWeaponClass,
      equipment: { ...enemyLoadout.equipment },
      visualPreset: { ...enemyLoadout.visualPreset },
    },
    log: [
      { text: `The gate slams open. ${hero.name} and ${state.enemy.name} enter the sand.`, important: true },
      { text: "Move into range, strike, then survive the enemy turn." },
    ],
  };
}

export function getBattleReward(combat: CombatState): BattleReward {
  if (combat.result === "win") {
    return { ...BATTLE_WIN_REWARD };
  }

  return { gold: 0, xp: 0 };
}

export function applyBattleReward(hero: HeroState, reward: BattleReward, now = new Date().toISOString()): HeroState {
  if (reward.gold <= 0 && reward.xp <= 0) {
    return hero;
  }

  const progress = applyHeroXp(hero.level, hero.xp + reward.xp, hero.xpToNextLevel);

  return {
    ...hero,
    gold: hero.gold + reward.gold,
    level: progress.level,
    xp: progress.xp,
    xpToNextLevel: progress.xpToNextLevel,
    updatedAt: now,
  };
}

export function buyAndEquipHeroItems(hero: HeroState, purchase: HeroItemPurchase, now = new Date().toISOString()): HeroState {
  if (purchase.price > hero.gold) {
    return hero;
  }

  const inventory = [...hero.inventory];
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
    gold: hero.gold - purchase.price,
    equipment,
    inventory,
    updatedAt: now,
  };
}

export function getHeroXpToNextLevel(level: number): number {
  return DEFAULT_HERO_XP_TO_NEXT_LEVEL + Math.max(0, level - 1) * HERO_XP_TO_NEXT_LEVEL_STEP;
}

function applyHeroXp(level: number, xp: number, xpToNextLevel: number): Pick<HeroState, "level" | "xp" | "xpToNextLevel"> {
  let nextLevel = Math.max(1, Math.floor(level));
  let nextXp = Math.max(0, Math.floor(xp));
  let nextXpToNextLevel = Math.max(1, Math.floor(xpToNextLevel));

  while (nextXp >= nextXpToNextLevel) {
    nextXp -= nextXpToNextLevel;
    nextLevel += 1;
    nextXpToNextLevel = getHeroXpToNextLevel(nextLevel);
  }

  return {
    level: nextLevel,
    xp: nextXp,
    xpToNextLevel: nextXpToNextLevel,
  };
}

function pickRandom<T>(items: readonly T[], random: () => number): T {
  if (items.length === 0) {
    throw new Error("Cannot pick a random item from an empty list.");
  }

  return items[Math.floor(random() * items.length)] ?? items[0]!;
}
