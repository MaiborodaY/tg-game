import type { BattleReward, HeroEquipmentSlotKey, HeroItemId, HeroItemRarity } from "./hero";

export type ArenaOpponentId = string;
export type ArenaBossId = string;

export interface ArenaGeneratedEquipmentPool {
  itemRarities: readonly HeroItemRarity[];
  rollChance: number;
}

export interface ArenaOpponentRewards {
  win: BattleReward;
  loss: BattleReward;
}

export interface ArenaRandomOpponentDefinition {
  id: ArenaOpponentId;
  tierId: number;
  name: string;
  equipmentPool: ArenaGeneratedEquipmentPool;
  rewards: ArenaOpponentRewards;
}

export interface ArenaLootTableEntry {
  id: string;
  itemIds: readonly HeroItemId[];
  chance: number;
  quantity: number;
}

export interface ArenaBossDefinition {
  id: ArenaBossId;
  tierId: number;
  name: string;
  equipment: Readonly<Partial<Record<HeroEquipmentSlotKey, HeroItemId>>>;
  rewards: ArenaOpponentRewards;
  lootTable: readonly ArenaLootTableEntry[];
}

export interface ArenaTierDefinition {
  id: number;
  name: string;
  enemyItemRarities: readonly HeroItemRarity[];
  enemyEquipmentRollChance: number;
  randomOpponentIds: readonly ArenaOpponentId[];
  bossIds: readonly ArenaBossId[];
}

export const BATTLE_WIN_REWARD: BattleReward = { gold: 5, xp: 5 };
export const BATTLE_LOSS_REWARD: BattleReward = { gold: 1, xp: 2 };
export const DEFAULT_ARENA_TIER_ID = 1;
const DUST_ARENA_CHAMPION_WOOD_HELMET_ID = "generated_equipment_helmet_wood_boss_01";

export const ARENA_RANDOM_OPPONENTS: readonly ArenaRandomOpponentDefinition[] = [
  {
    id: "dust_arena_brawler",
    tierId: 1,
    name: "Grumbus",
    equipmentPool: {
      itemRarities: ["common"],
      rollChance: 0.52,
    },
    rewards: {
      win: BATTLE_WIN_REWARD,
      loss: BATTLE_LOSS_REWARD,
    },
  },
];

export const ARENA_BOSSES: readonly ArenaBossDefinition[] = [
  {
    id: "dust_arena_champion",
    tierId: 1,
    name: "Dust Arena Champion",
    equipment: {
      helmet: DUST_ARENA_CHAMPION_WOOD_HELMET_ID,
    },
    rewards: {
      win: { gold: 15, xp: 15 },
      loss: BATTLE_LOSS_REWARD,
    },
    lootTable: [
      {
        id: "dust_arena_champion_wood_helmet",
        itemIds: [DUST_ARENA_CHAMPION_WOOD_HELMET_ID],
        chance: 1,
        quantity: 1,
      },
    ],
  },
];

export const ARENA_TIERS: readonly ArenaTierDefinition[] = [
  {
    id: 1,
    name: "Dust Arena I",
    enemyItemRarities: ARENA_RANDOM_OPPONENTS[0]!.equipmentPool.itemRarities,
    enemyEquipmentRollChance: ARENA_RANDOM_OPPONENTS[0]!.equipmentPool.rollChance,
    randomOpponentIds: ["dust_arena_brawler"],
    bossIds: ["dust_arena_champion"],
  },
];

export function getArenaTierDefinition(tierId = DEFAULT_ARENA_TIER_ID): ArenaTierDefinition {
  return ARENA_TIERS.find((tier) => tier.id === tierId) ?? ARENA_TIERS[0]!;
}

export function getArenaRandomOpponentDefinition(opponentId: ArenaOpponentId): ArenaRandomOpponentDefinition | undefined {
  return ARENA_RANDOM_OPPONENTS.find((opponent) => opponent.id === opponentId);
}

export function getArenaBossDefinition(bossId: ArenaBossId): ArenaBossDefinition | undefined {
  return ARENA_BOSSES.find((boss) => boss.id === bossId);
}

export function getArenaRandomOpponentsForTier(tierId: number): ArenaRandomOpponentDefinition[] {
  return ARENA_RANDOM_OPPONENTS.filter((opponent) => opponent.tierId === tierId);
}

export function getArenaBossesForTier(tierId: number): ArenaBossDefinition[] {
  return ARENA_BOSSES.filter((boss) => boss.tierId === tierId);
}
