import type { ArenaTierConfig } from "../arenaOpponents";

export const GENERATED_ARENA_TIERS: readonly ArenaTierConfig[] = [
  {
    id: 1,
    name: "Dust Arena I",
    opponents: [
      {
        id: "dust_arena_dummy",
        difficultyId: "easy",
        name: "Training Dummy",
        baseStats: {"strength":0,"agility":0,"vitality":0},
        equipmentPools: [],
        rewards: {"win":{"gold":4,"xp":4},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_brawler",
        difficultyId: "medium",
        name: "Grumbus",
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.52}],
        rewards: {"win":{"gold":8,"xp":6},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_veteran",
        difficultyId: "hard",
        name: "Dust Arena Veteran",
        randomBaseStatPoints: 3,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.7},{"itemRarities":["uncommon"],"rollChance":0.15}],
        rewards: {"win":{"gold":15,"xp":10},"loss":{"gold":1,"xp":1}},
      },
    ],
  },
  {
    id: 2,
    name: "Dust Arena II",
    unlockBossId: "dust_arena_champion",
    opponents: [
      {
        id: "dust_arena_2_easy",
        difficultyId: "easy",
        name: "Dust Arena II Rookie",
        randomBaseStatPoints: 5,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.4},{"itemRarities":["uncommon"],"rollChance":0.2}],
        rewards: {"win":{"gold":25,"xp":15},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_2_medium",
        difficultyId: "medium",
        name: "Dust Arena II Brawler",
        randomBaseStatPoints: 10,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.25},{"itemRarities":["uncommon"],"rollChance":0.7},{"itemRarities":["rare"],"rollChance":0.05}],
        rewards: {"win":{"gold":35,"xp":22},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_2_hard",
        difficultyId: "hard",
        name: "Dust Arena II Veteran",
        randomBaseStatPoints: 15,
        equipmentPools: [{"itemRarities":["uncommon"],"rollChance":0.7},{"itemRarities":["rare"],"rollChance":0.15}],
        rewards: {"win":{"gold":50,"xp":32},"loss":{"gold":1,"xp":1}},
      },
    ],
  }
];
