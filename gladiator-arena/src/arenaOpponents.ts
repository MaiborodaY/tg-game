import { GENERATED_ARENA_BOSSES } from "./generated/arenaBosses.generated";
import type { BattleReward, HeroBaseStats, HeroEquipmentSlotKey, HeroItemId, HeroItemRarity } from "./hero";

export type ArenaOpponentId = string;
export type ArenaBossId = string;
export type ArenaDifficultyId = "easy" | "medium" | "hard";

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
  randomBaseStatPoints?: number;
  equipmentPools: readonly ArenaGeneratedEquipmentPool[];
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
  enemyEquipmentPools: readonly ArenaGeneratedEquipmentPool[];
  randomOpponentIds: readonly ArenaOpponentId[];
  bossIds: readonly ArenaBossId[];
}

export const BATTLE_WIN_REWARD: BattleReward = { gold: 8, xp: 6 };
export const BATTLE_LOSS_REWARD: BattleReward = { gold: 1, xp: 1 };
export const DEFAULT_ARENA_TIER_ID = 1;
export const DEFAULT_ARENA_DIFFICULTY_ID: ArenaDifficultyId = "medium";

export const ARENA_RANDOM_OPPONENTS: readonly ArenaRandomOpponentDefinition[] = [
  {
    id: "dust_arena_dummy",
    tierId: 1,
    difficultyId: "easy",
    name: "Training Dummy",
    baseStats: { strength: 0, agility: 0, vitality: 0 },
    equipmentPools: [],
    rewards: {
      win: { gold: 4, xp: 4 },
      loss: { gold: 1, xp: 1 },
    },
  },
  {
    id: "dust_arena_brawler",
    tierId: 1,
    difficultyId: "medium",
    name: "Grumbus",
    equipmentPools: [{ itemRarities: ["common"], rollChance: 0.52 }],
    rewards: {
      win: BATTLE_WIN_REWARD,
      loss: BATTLE_LOSS_REWARD,
    },
  },
  {
    id: "dust_arena_veteran",
    tierId: 1,
    difficultyId: "hard",
    name: "Dust Arena Veteran",
    randomBaseStatPoints: 3,
    equipmentPools: [
      { itemRarities: ["common"], rollChance: 0.7 },
      { itemRarities: ["uncommon"], rollChance: 0.15 },
    ],
    rewards: {
      win: { gold: 15, xp: 10 },
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
  enemyEquipmentPools: getArenaEnemyEquipmentPoolsForTier(tierId),
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

function getArenaEnemyEquipmentPoolsForTier(tierId: number): readonly ArenaGeneratedEquipmentPool[] {
  return getDefaultArenaRandomOpponentForTier(tierId)?.equipmentPools ?? [{ itemRarities: ["common"], rollChance: 0.52 }];
}

function getDefaultArenaRandomOpponentForTier(tierId: number): ArenaRandomOpponentDefinition | undefined {
  return (
    ARENA_RANDOM_OPPONENTS.find((opponent) => opponent.tierId === tierId && opponent.difficultyId === DEFAULT_ARENA_DIFFICULTY_ID) ??
    ARENA_RANDOM_OPPONENTS.find((opponent) => opponent.tierId === tierId)
  );
}
