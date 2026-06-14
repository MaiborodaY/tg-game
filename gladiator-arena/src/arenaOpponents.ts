import { GENERATED_ARENA_BOSSES } from "./generated/arenaBosses.generated";
import type { BattleReward, HeroBaseStats, HeroEquipmentSlotKey, HeroItemId, HeroItemRarity } from "./hero";

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
  baseStats: HeroBaseStats;
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

const BASE_ARENA_BOSSES: readonly ArenaBossDefinition[] = [];

export const ARENA_BOSSES: readonly ArenaBossDefinition[] = [...BASE_ARENA_BOSSES, ...GENERATED_ARENA_BOSSES].sort((left, right) =>
  left.id.localeCompare(right.id),
);

const ARENA_TIER_IDS = [...new Set([DEFAULT_ARENA_TIER_ID, ...ARENA_RANDOM_OPPONENTS.map((opponent) => opponent.tierId), ...ARENA_BOSSES.map((boss) => boss.tierId)])].sort(
  (left, right) => left - right,
);

export const ARENA_TIERS: readonly ArenaTierDefinition[] = ARENA_TIER_IDS.map((tierId) => ({
  id: tierId,
  name: formatArenaTierName(tierId),
  enemyItemRarities: getArenaEnemyItemRaritiesForTier(tierId),
  enemyEquipmentRollChance: getArenaEnemyEquipmentRollChanceForTier(tierId),
  randomOpponentIds: ARENA_RANDOM_OPPONENTS.filter((opponent) => opponent.tierId === tierId).map((opponent) => opponent.id),
  bossIds: ARENA_BOSSES.filter((boss) => boss.tierId === tierId).map((boss) => boss.id),
}));

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

function formatArenaTierName(tierId: number): string {
  return tierId === 1 ? "Dust Arena I" : `Dust Arena ${tierId}`;
}

function getArenaEnemyItemRaritiesForTier(tierId: number): readonly HeroItemRarity[] {
  return ARENA_RANDOM_OPPONENTS.find((opponent) => opponent.tierId === tierId)?.equipmentPool.itemRarities ?? ["common"];
}

function getArenaEnemyEquipmentRollChanceForTier(tierId: number): number {
  return ARENA_RANDOM_OPPONENTS.find((opponent) => opponent.tierId === tierId)?.equipmentPool.rollChance ?? 0.52;
}
