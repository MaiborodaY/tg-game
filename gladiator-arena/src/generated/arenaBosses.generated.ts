import type { ArenaBossDefinition } from "../arenaOpponents";

export const GENERATED_ARENA_BOSSES: readonly ArenaBossDefinition[] = [
  {
    id: "dust_arena_champion",
    tierId: 1,
    name: "Dust Arena Champion",
    baseStats: {"strength":10,"agility":10,"vitality":5},
    equipment: {"weaponMain":"generated_equipment_weapon_mace_wood_boss_01","helmet":"generated_equipment_helmet_wood_boss_01","breastplate":"generated_equipment_breastplate_wood_boss_01","backGreave":"generated_equipment_back_greave_wood_boss_01","frontGreave":"generated_equipment_front_greave_wood_boss_01"},
    rewards: {"win":{"gold":50,"xp":100},"loss":{"gold":0,"xp":0}},
    lootTable: [
      {"id":"dust_arena_champion_generated_equipment_weapon_mace_wood_boss_01_drop","itemIds":["generated_equipment_weapon_mace_wood_boss_01"],"chance":1,"quantity":1},
      {"id":"dust_arena_champion_generated_equipment_breastplate_wood_boss_01_drop","itemIds":["generated_equipment_breastplate_wood_boss_01"],"chance":1,"quantity":1},
      {"id":"dust_arena_champion_generated_equipment_helmet_wood_boss_01_drop","itemIds":["generated_equipment_helmet_wood_boss_01"],"chance":1,"quantity":1},
      {"id":"dust_arena_champion_generated_equipment_back_greave_wood_boss_01_generated_equipment_front_greave_wood_boss_01_drop","itemIds":["generated_equipment_back_greave_wood_boss_01","generated_equipment_front_greave_wood_boss_01"],"chance":1,"quantity":1},
    ],
  }
];
