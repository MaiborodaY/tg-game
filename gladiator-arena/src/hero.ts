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

export interface HeroEquipment {
  weaponId: string;
  armourId: string;
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
export const STARTER_ARMOUR_ID = "cloth_wraps";

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
    equipment: {
      weaponId: TRAINING_WEAPON_ID,
      armourId: STARTER_ARMOUR_ID,
    },
    inventory: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function deriveHeroStats(hero: HeroState): HeroStats {
  const strengthBonus = Math.max(0, hero.baseStats.strength - 1);
  const enduranceBonus = Math.max(0, hero.baseStats.endurance - 1);
  const agilityBonus = Math.max(0, hero.baseStats.agility - 1);

  return {
    maxHp: MAX_HP + enduranceBonus * 4,
    maxStamina: MAX_STAMINA + agilityBonus,
    lightDamageBonus: Math.floor(strengthBonus / 2),
    mediumDamageBonus: strengthBonus,
    heavyDamageBonus: strengthBonus * 2,
  };
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
