import type { ArenaTierConfig } from "../arenaOpponents";

export const GENERATED_ARENA_TIERS: readonly ArenaTierConfig[] = [
  {
    id: 1,
    name: "Dust Arena I",
    opponents: [
      {
        id: "dust_arena_dummy",
        difficultyId: "easy",
        baseStats: {"strength":0,"agility":0,"vitality":0},
        equipmentPools: [],
        rewards: {"win":{"gold":4,"xp":4},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_brawler",
        difficultyId: "medium",
        randomBaseStatPoints: 1,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.2}],
        rewards: {"win":{"gold":8,"xp":6},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_veteran",
        difficultyId: "hard",
        randomBaseStatPoints: 3,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.5},{"itemRarities":["uncommon"],"rollChance":0.1}],
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
        randomBaseStatPoints: 5,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.4},{"itemRarities":["uncommon"],"rollChance":0.2}],
        rewards: {"win":{"gold":25,"xp":15},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_2_medium",
        difficultyId: "medium",
        randomBaseStatPoints: 10,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.25},{"itemRarities":["uncommon"],"rollChance":0.7},{"itemRarities":["rare"],"rollChance":0.05}],
        rewards: {"win":{"gold":35,"xp":22},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_2_hard",
        difficultyId: "hard",
        randomBaseStatPoints: 15,
        equipmentPools: [{"itemRarities":["uncommon"],"rollChance":0.7},{"itemRarities":["rare"],"rollChance":0.15}],
        rewards: {"win":{"gold":50,"xp":32},"loss":{"gold":1,"xp":1}},
      },
    ],
  },
  {
    id: 3,
    name: "Aztec3",
    unlockBossId: "arena_boss_2",
    opponents: [
      {
        id: "arena_3_easy",
        difficultyId: "easy",
        randomBaseStatPoints: 15,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.83},{"itemRarities":["uncommon"],"rollChance":0.4}],
        rewards: {"win":{"gold":35,"xp":22},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "arena_3_medium",
        difficultyId: "medium",
        randomBaseStatPoints: 9,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.89},{"itemRarities":["uncommon"],"rollChance":0.5}],
        rewards: {"win":{"gold":40,"xp":26},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "arena_3_hard",
        difficultyId: "hard",
        randomBaseStatPoints: 26,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.93},{"itemRarities":["uncommon"],"rollChance":0.59}],
        rewards: {"win":{"gold":45,"xp":30},"loss":{"gold":1,"xp":1}},
      },
    ],
  },
  {
    id: 4,
    name: "Dust Arena 4",
    unlockBossId: "arena_boss_3",
    opponents: [
      {
        id: "dust_arena_4_easy",
        difficultyId: "easy",
        randomBaseStatPoints: 21,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.9200000000000002},{"itemRarities":["uncommon"],"rollChance":0.6000000000000001}],
        rewards: {"win":{"gold":45,"xp":28},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_4_medium",
        difficultyId: "medium",
        randomBaseStatPoints: 21,
        equipmentPools: [{"itemRarities":["common"],"rollChance":0.9700000000000001},{"itemRarities":["uncommon"],"rollChance":0.7000000000000001}],
        rewards: {"win":{"gold":50,"xp":32},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_4_hard",
        difficultyId: "hard",
        randomBaseStatPoints: 26,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":0.8}],
        rewards: {"win":{"gold":55,"xp":36},"loss":{"gold":1,"xp":1}},
      },
    ],
  },
  {
    id: 5,
    name: "Dust Arena 5",
    unlockBossId: "arena_boss_4",
    opponents: [
      {
        id: "dust_arena_5_easy",
        difficultyId: "easy",
        randomBaseStatPoints: 31,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":0.8}],
        rewards: {"win":{"gold":55,"xp":34},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_5_medium",
        difficultyId: "medium",
        randomBaseStatPoints: 38,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":0.9}],
        rewards: {"win":{"gold":60,"xp":38},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_5_hard",
        difficultyId: "hard",
        randomBaseStatPoints: 41,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":65,"xp":42},"loss":{"gold":1,"xp":1}},
      },
    ],
  },
  {
    id: 6,
    name: "Dust Arena 6",
    unlockBossId: "arena_boss_5",
    opponents: [
      {
        id: "dust_arena_6_easy",
        difficultyId: "easy",
        randomBaseStatPoints: 39,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":65,"xp":40},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_6_medium",
        difficultyId: "medium",
        randomBaseStatPoints: 40,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":70,"xp":44},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_6_hard",
        difficultyId: "hard",
        randomBaseStatPoints: 29,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":75,"xp":48},"loss":{"gold":1,"xp":1}},
      },
    ],
  },
  {
    id: 7,
    name: "Dust Arena 7",
    unlockBossId: "arena_boss_6",
    opponents: [
      {
        id: "dust_arena_7_easy",
        difficultyId: "easy",
        randomBaseStatPoints: 18,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":75,"xp":46},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_7_medium",
        difficultyId: "medium",
        randomBaseStatPoints: 21,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":80,"xp":50},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_7_hard",
        difficultyId: "hard",
        randomBaseStatPoints: 24,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":85,"xp":54},"loss":{"gold":1,"xp":1}},
      },
    ],
  },
  {
    id: 8,
    name: "Dust Arena 8",
    unlockBossId: "arena_boss_7",
    opponents: [
      {
        id: "dust_arena_8_easy",
        difficultyId: "easy",
        randomBaseStatPoints: 21,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":85,"xp":52},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_8_medium",
        difficultyId: "medium",
        randomBaseStatPoints: 24,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":90,"xp":56},"loss":{"gold":1,"xp":1}},
      },
      {
        id: "dust_arena_8_hard",
        difficultyId: "hard",
        randomBaseStatPoints: 27,
        equipmentPools: [{"itemRarities":["common"],"rollChance":1},{"itemRarities":["uncommon"],"rollChance":1}],
        rewards: {"win":{"gold":95,"xp":60},"loss":{"gold":1,"xp":1}},
      },
    ],
  }
];
