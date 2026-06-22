import { GENERATED_ARENA_BOSSES } from "./generated/arenaBosses.generated";
import { GENERATED_ARENA_TIERS } from "./generated/arenaTiers.generated";
import type { BattleReward, HeroBaseStats, HeroEquipmentSlotKey, HeroItemId, HeroItemRarity } from "./hero";

export type ArenaOpponentId = string;
export type ArenaBossId = string;
export const ARENA_DIFFICULTY_IDS = ["easy", "medium", "hard"] as const;
export type ArenaDifficultyId = (typeof ARENA_DIFFICULTY_IDS)[number];

export interface ArenaGeneratedEquipmentPool {
  itemRarities: readonly HeroItemRarity[];
  rollChance: number;
  weaponChance?: number;
  bowChance?: number;
  shieldChance?: number;
  shurikenChance?: number;
}

export interface ArenaOpponentRewards {
  win: BattleReward;
  loss: BattleReward;
}

export interface ArenaTierOpponentDefinition {
  id: ArenaOpponentId;
  difficultyId: ArenaDifficultyId;
  baseStats?: HeroBaseStats;
  randomBaseStatPoints?: number;
  equipmentPools: readonly ArenaGeneratedEquipmentPool[];
  rewards: ArenaOpponentRewards;
}

export interface ArenaTierConfig {
  id: number;
  name: string;
  unlockBossId?: ArenaBossId;
  opponents: readonly ArenaTierOpponentDefinition[];
}

export interface ArenaRandomOpponentDefinition extends ArenaTierOpponentDefinition {
  tierId: number;
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
  unlockBossId?: ArenaBossId;
  enemyEquipmentPools: readonly ArenaGeneratedEquipmentPool[];
  randomOpponentIds: readonly ArenaOpponentId[];
  bossIds: readonly ArenaBossId[];
}

export const BATTLE_WIN_REWARD: BattleReward = { gold: 8, xp: 6 };
export const BATTLE_LOSS_REWARD: BattleReward = { gold: 1, xp: 1 };
export const DEFAULT_ARENA_TIER_ID = 1;
export const DEFAULT_ARENA_DIFFICULTY_ID: ArenaDifficultyId = "medium";

export const ARENA_TIER_CONFIGS: readonly ArenaTierConfig[] = [...GENERATED_ARENA_TIERS].sort((left, right) => left.id - right.id);

export const ARENA_RANDOM_OPPONENTS: readonly ArenaRandomOpponentDefinition[] = ARENA_TIER_CONFIGS.flatMap((tier) =>
  tier.opponents.map((opponent) => ({
    ...opponent,
    tierId: tier.id,
  })),
).sort((left, right) => left.tierId - right.tierId || getDifficultySortIndex(left.difficultyId) - getDifficultySortIndex(right.difficultyId) || left.id.localeCompare(right.id));

const BASE_ARENA_BOSSES: readonly ArenaBossDefinition[] = [];

export const ARENA_BOSSES: readonly ArenaBossDefinition[] = [...BASE_ARENA_BOSSES, ...GENERATED_ARENA_BOSSES].sort((left, right) =>
  left.id.localeCompare(right.id),
);

const ARENA_TIER_IDS = [
  ...new Set([DEFAULT_ARENA_TIER_ID, ...ARENA_TIER_CONFIGS.map((tier) => tier.id), ...ARENA_RANDOM_OPPONENTS.map((opponent) => opponent.tierId), ...ARENA_BOSSES.map((boss) => boss.tierId)]),
].sort((left, right) => left - right);

export const ARENA_TIERS: readonly ArenaTierDefinition[] = ARENA_TIER_IDS.map((tierId) => ({
  id: tierId,
  name: getArenaTierConfig(tierId)?.name ?? formatArenaTierName(tierId),
  ...(getArenaTierConfig(tierId)?.unlockBossId ? { unlockBossId: getArenaTierConfig(tierId)!.unlockBossId } : {}),
  enemyEquipmentPools: getArenaEnemyEquipmentPoolsForTier(tierId),
  randomOpponentIds: ARENA_RANDOM_OPPONENTS.filter((opponent) => opponent.tierId === tierId).map((opponent) => opponent.id),
  bossIds: ARENA_BOSSES.filter((boss) => boss.tierId === tierId).map((boss) => boss.id),
}));

export function getArenaTierDefinitions(): ArenaTierDefinition[] {
  return [...ARENA_TIERS];
}

export function getArenaTierDefinition(tierId = DEFAULT_ARENA_TIER_ID): ArenaTierDefinition {
  return ARENA_TIERS.find((tier) => tier.id === tierId) ?? ARENA_TIERS[0]!;
}

export function getArenaTierConfig(tierId: number): ArenaTierConfig | undefined {
  return ARENA_TIER_CONFIGS.find((tier) => tier.id === tierId);
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
  return tierId === 1 ? "Dust Arena" : `Dust Arena ${tierId}`;
}

function getDifficultySortIndex(difficultyId: ArenaDifficultyId): number {
  return ARENA_DIFFICULTY_IDS.indexOf(difficultyId);
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
