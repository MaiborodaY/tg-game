import { GENERATED_ARENA_BOSSES } from "./generated/arenaBosses.generated";
import type { BattleReward, HeroBaseStats, HeroEquipmentSlotKey, HeroItemId, HeroItemRarity } from "./hero";

export type ArenaOpponentId = string;
export type ArenaBossId = string;
export type ArenaDifficultyId = "easy" | "medium";

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
  difficultyId: ArenaDifficultyId;
  name: string;
  baseStats?: HeroBaseStats;
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
export const DEFAULT_ARENA_DIFFICULTY_ID: ArenaDifficultyId = "medium";

export const ARENA_RANDOM_OPPONENTS: readonly ArenaRandomOpponentDefinition[] = [
  {
    id: "dust_arena_dummy",
    tierId: 1,
    difficultyId: "easy",
    name: "Training Dummy",
    baseStats: { strength: 0, agility: 0, vitality: 0 },
    equipmentPool: {
      itemRarities: [],
      rollChance: 0,
    },
    rewards: {
      win: { gold: 3, xp: 3 },
      loss: { gold: 1, xp: 1 },
    },
  },
  {
    id: "dust_arena_brawler",
    tierId: 1,
    difficultyId: "medium",
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

export function getArenaRandomOpponentsForTierAndDifficulty(tierId: number, difficultyId: ArenaDifficultyId): ArenaRandomOpponentDefinition[] {
  return ARENA_RANDOM_OPPONENTS.filter((opponent) => opponent.tierId === tierId && opponent.difficultyId === difficultyId);
}

export function getArenaBossesForTier(tierId: number): ArenaBossDefinition[] {
  return ARENA_BOSSES.filter((boss) => boss.tierId === tierId);
}

function formatArenaTierName(tierId: number): string {
  return tierId === 1 ? "Dust Arena I" : `Dust Arena ${tierId}`;
}

function getArenaEnemyItemRaritiesForTier(tierId: number): readonly HeroItemRarity[] {
  return getDefaultArenaRandomOpponentForTier(tierId)?.equipmentPool.itemRarities ?? ["common"];
}

function getArenaEnemyEquipmentRollChanceForTier(tierId: number): number {
  return getDefaultArenaRandomOpponentForTier(tierId)?.equipmentPool.rollChance ?? 0.52;
}

function getDefaultArenaRandomOpponentForTier(tierId: number): ArenaRandomOpponentDefinition | undefined {
  return (
    ARENA_RANDOM_OPPONENTS.find((opponent) => opponent.tierId === tierId && opponent.difficultyId === DEFAULT_ARENA_DIFFICULTY_ID) ??
    ARENA_RANDOM_OPPONENTS.find((opponent) => opponent.tierId === tierId)
  );
}
