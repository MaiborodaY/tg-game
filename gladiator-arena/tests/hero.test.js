import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadTypeScriptModule(modulePath, context = {}) {
  const filename = fileURLToPath(new URL(modulePath, import.meta.url));
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });

  const module = { exports: {} };

  vm.runInNewContext(
    outputText,
    {
      exports: module.exports,
      module,
      ...context,
    },
    { filename },
  );

  return module.exports;
}

const combat = loadTypeScriptModule("../src/combat.ts");
const generatedArenaBosses = loadTypeScriptModule("../src/generated/arenaBosses.generated.ts");
const arenaOpponents = loadTypeScriptModule("../src/arenaOpponents.ts", {
  require: (id) => {
    if (id === "./generated/arenaBosses.generated") {
      return generatedArenaBosses;
    }

    throw new Error(`Unsupported arena opponent test import: ${id}`);
  },
});
const generatedItems = {
  weapon_sword_01: {
    id: "weapon_sword_01",
    name: "Sword 01",
    kind: "weapon",
    rarity: "common",
    weaponClass: "sword",
    equipmentSlot: "weaponMain",
    damageBonus: 1,
  },
  generated_equipment_weapon_bow_01: {
    id: "generated_equipment_weapon_bow_01",
    name: "Bow 01",
    kind: "weapon",
    rarity: "common",
    weaponClass: "bow",
    equipmentSlot: "weaponBow",
    damageBonus: 5,
    requirements: { agility: 10 },
  },
  generated_equipment_weapon_shuriken_01: {
    id: "generated_equipment_weapon_shuriken_01",
    name: "Rusty Shuriken",
    kind: "weapon",
    rarity: "common",
    weaponClass: "shuriken",
    equipmentSlot: "weaponMain",
    damageBonus: 2,
  },
  cloth_breastplate_01: {
    id: "cloth_breastplate_01",
    name: "Cloth Breastplate 01",
    kind: "armor",
    rarity: "common",
    armorCategory: "cloth",
    equipmentSlot: "breastplate",
    armorHp: 1,
  },
  leather_helmet_01: {
    id: "leather_helmet_01",
    name: "Leather Helmet 01",
    kind: "armor",
    rarity: "uncommon",
    armorCategory: "leather",
    equipmentSlot: "helmet",
    armorHp: 1,
  },
  leather_breastplate_01: {
    id: "leather_breastplate_01",
    name: "Leather Breastplate 01",
    kind: "armor",
    rarity: "uncommon",
    armorCategory: "leather",
    equipmentSlot: "breastplate",
    armorHp: 1,
  },
  leather_back_wrist_01: {
    id: "leather_back_wrist_01",
    name: "Leather Back Wrist 01",
    kind: "armor",
    rarity: "uncommon",
    armorCategory: "leather",
    equipmentSlot: "backWrist",
    armorHp: 2,
  },
  leather_front_wrist_01: {
    id: "leather_front_wrist_01",
    name: "Leather Front Wrist 01",
    kind: "armor",
    rarity: "uncommon",
    armorCategory: "leather",
    equipmentSlot: "frontWrist",
    armorHp: 0,
  },
  generated_equipment_helmet_wood_boss_01: {
    id: "generated_equipment_helmet_wood_boss_01",
    name: "Wood Helmet Boss 01",
    kind: "armor",
    rarity: "unique",
    equipmentSlot: "helmet",
    armorHp: 5,
  },
  generated_equipment_breastplate_wood_boss_01: {
    id: "generated_equipment_breastplate_wood_boss_01",
    name: "Wood Breastplate Boss 01",
    kind: "armor",
    rarity: "unique",
    equipmentSlot: "breastplate",
    armorHp: 10,
  },
  generated_equipment_back_greave_wood_boss_01: {
    id: "generated_equipment_back_greave_wood_boss_01",
    name: "Wooden greave",
    kind: "armor",
    rarity: "unique",
    equipmentSlot: "backGreave",
    armorHp: 5,
  },
  generated_equipment_front_greave_wood_boss_01: {
    id: "generated_equipment_front_greave_wood_boss_01",
    name: "Wooden greave Front",
    kind: "armor",
    rarity: "unique",
    equipmentSlot: "frontGreave",
    armorHp: 0,
  },
  generated_equipment_weapon_mace_wood_boss_01: {
    id: "generated_equipment_weapon_mace_wood_boss_01",
    name: "Big Wooden mace",
    kind: "weapon",
    rarity: "unique",
    weaponClass: "mace",
    equipmentSlot: "weaponMain",
    damageBonus: 5,
  },
};
const hero = loadTypeScriptModule("../src/hero.ts", {
  require: (id) => {
    if (id === "./combat") {
      return combat;
    }

    if (id === "./arenaOpponents") {
      return arenaOpponents;
    }

    if (id === "./generated/equipmentItems.generated") {
      return {
        GENERATED_EQUIPMENT_ITEM_CATALOG: generatedItems,
        GENERATED_EQUIPMENT_ITEM_IDS: Object.keys(generatedItems),
        GENERATED_EQUIPMENT_ITEM_RECORDS: Object.values(generatedItems).map((item) => ({ item })),
      };
    }

    throw new Error(`Unsupported test import: ${id}`);
  },
});

test("equipment catalog is sourced from generated items", () => {
  assert.equal(hero.HERO_ITEM_IDS.includes("cloth_breastplate_01"), true);
  assert.equal(hero.HERO_ITEM_IDS.includes("leather_breastplate_01"), true);
  assert.equal(hero.HERO_ITEM_CATALOG.leather_breastplate_01?.name, "Leather Breastplate 01");
  assert.equal(hero.HERO_ITEM_CATALOG.cloth_breastplate_01?.name, "Cloth Breastplate 01");
  assert.equal(hero.HERO_ITEM_CATALOG.cloth_breastplate_01?.equipmentSlot, "breastplate");
  assert.equal(hero.createDefaultHeroInventory().length, 0);
});

test("hero starts with empty equipment including gloves and wrists", () => {
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("weaponBow"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("backWrist"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("frontWrist"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("backGlove"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("frontGlove"), true);

  assert.equal(hero.createDefaultHeroEquipment().backWrist, null);
  assert.equal(hero.createDefaultHeroEquipment().frontWrist, null);
  assert.equal(hero.createDefaultHeroEquipment().backGlove, null);
  assert.equal(hero.createDefaultHeroEquipment().frontGlove, null);
  assert.equal(hero.createDefaultHeroEquipment().weaponBow, null);
  assert.deepEqual([...hero.createDefaultHero().defeatedArenaBossIds], []);
});

test("hero base attributes derive combat stats", () => {
  const defaultHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");

  assert.equal(defaultHero.baseStats.strength, 0);
  assert.equal(defaultHero.baseStats.agility, 0);
  assert.equal(defaultHero.baseStats.vitality, 0);
  assert.equal(defaultHero.skillPoints, 0);

  const defaultStats = hero.deriveHeroStats(defaultHero);

  assert.equal(defaultStats.maxHp, combat.MAX_HP);
  assert.equal(defaultStats.maxStamina, combat.MAX_STAMINA);
  assert.equal(defaultStats.damageBonus, 0);
  assert.equal(defaultStats.weaponDamageBonus, 0);
  assert.equal(defaultStats.meleeDamagePercentBonus, 0);
  assert.equal(defaultStats.movementDistanceBonus, 0);
  assert.equal(defaultStats.bodyScaleBonus, 0);
  assert.equal(defaultStats.clinchRangeBonus, 0);
  assert.equal(defaultStats.restHpRestoreBonus, 0);
  assert.equal(defaultStats.restStaminaRestoreBonus, 0);

  const tunedHero = {
    ...defaultHero,
    baseStats: {
      strength: 3,
      agility: 4,
      vitality: 2,
    },
  };
  const tunedStats = hero.deriveHeroStats(tunedHero);
  const combatState = hero.createCombatStateFromHero(tunedHero);

  assert.equal(tunedStats.damageBonus, 0);
  assert.equal(tunedStats.weaponDamageBonus, 0);
  assert.equal(tunedStats.meleeDamagePercentBonus, 0.15);
  assert.equal(tunedStats.movementDistanceBonus, 4 * hero.HERO_AGILITY_MOVEMENT_DISTANCE_BONUS);
  assert.equal(tunedStats.bodyScaleBonus, 3 * hero.HERO_STRENGTH_BODY_SCALE_BONUS);
  assert.equal(
    tunedStats.clinchRangeBonus,
    Math.min(hero.HERO_STRENGTH_CLINCH_RANGE_MAX_BONUS, 3 * hero.HERO_STRENGTH_CLINCH_RANGE_BONUS),
  );
  assert.equal(tunedStats.maxHp, combat.MAX_HP + 2 * hero.HERO_VITALITY_HP_BONUS);
  assert.equal(tunedStats.maxStamina, combat.MAX_STAMINA + 2 * hero.HERO_VITALITY_STAMINA_BONUS);
  assert.equal(tunedStats.restHpRestoreBonus, 2 * hero.HERO_VITALITY_REST_HP_BONUS);
  assert.equal(tunedStats.restStaminaRestoreBonus, 2 * hero.HERO_VITALITY_REST_STAMINA_BONUS);
  assert.equal(combatState.player.damageBonus, tunedStats.damageBonus);
  assert.equal(combatState.player.weaponDamageBonus, tunedStats.weaponDamageBonus);
  assert.equal(combatState.player.meleeDamagePercentBonus, tunedStats.meleeDamagePercentBonus);
  assert.equal(combatState.player.movementDistanceBonus, tunedStats.movementDistanceBonus);
  assert.equal(combatState.player.bodyScaleBonus, tunedStats.bodyScaleBonus);
  assert.equal(combatState.player.clinchRangeBonus, tunedStats.clinchRangeBonus);
  assert.equal(combatState.player.restHpRestoreBonus, tunedStats.restHpRestoreBonus);
  assert.equal(combatState.player.restStaminaRestoreBonus, tunedStats.restStaminaRestoreBonus);
  assert.equal(combatState.player.maxHp, tunedStats.maxHp);
  assert.equal(combatState.player.maxStamina, tunedStats.maxStamina);
});

test("weapon class defaults to sword and can be inferred for generated weapons", () => {
  assert.equal(hero.HERO_ITEM_CATALOG.weapon_sword_01?.weaponClass, "sword");
  assert.equal(
    hero.getHeroItemWeaponClass({
      id: "generated_equipment_weapon_bow_01",
      name: "Bow 01",
      kind: "weapon",
      equipmentSlot: "weaponBow",
      damageBonus: 1,
    }),
    "bow",
  );
  assert.equal(
    hero.getHeroItemWeaponClass({
      id: "generated_equipment_weapon_axe_01",
      name: "Axe 01",
      kind: "weapon",
      equipmentSlot: "weaponMain",
      damageBonus: 1,
    }),
    "axe",
  );
  assert.equal(
    hero.getHeroItemWeaponClass({
      id: "generated_equipment_weapon_mace_01",
      name: "Mace 01",
      kind: "weapon",
      equipmentSlot: "weaponMain",
      damageBonus: 1,
    }),
    "mace",
  );
  assert.equal(
    hero.getHeroItemWeaponClass({
      id: "generated_equipment_weapon_spear_01",
      name: "Spear 01",
      kind: "weapon",
      equipmentSlot: "weaponMain",
      damageBonus: 1,
    }),
    "spear",
  );
  assert.equal(
    hero.getHeroItemWeaponClass({
      id: "generated_equipment_weapon_shuriken_01",
      name: "Shuriken 01",
      kind: "weapon",
      equipmentSlot: "weaponMain",
      damageBonus: 1,
    }),
    "shuriken",
  );
});

test("cloth and sword stay common while leather catalog items are uncommon", () => {
  assert.equal(hero.HERO_ITEM_CATALOG.weapon_sword_01?.rarity, "common");
  assert.equal(hero.HERO_ITEM_CATALOG.cloth_breastplate_01?.rarity, "common");

  for (const item of Object.values(hero.HERO_ITEM_CATALOG)) {
    if (item?.armorCategory === "leather") {
      assert.equal(item.rarity, "uncommon");
    }
  }
});

test("arena tier one enemy loadouts only roll common equipment", () => {
  const tierOneRarities = hero.getArenaTierDefinition(1).enemyItemRarities;

  assert.equal(tierOneRarities.length, 1);
  assert.equal(tierOneRarities[0], "common");

  const loadout = hero.createRandomEnemyLoadout(() => 0, 1);
  const equippedItemIds = Object.values(loadout.equipment).filter(Boolean);

  assert.equal(loadout.equipment.weaponMain, "weapon_sword_01");
  assert.equal(loadout.equipment.breastplate, "cloth_breastplate_01");
  assert.equal(loadout.equipment.helmet, null);
  assert.equal(loadout.equipment.backWrist, null);
  assert.equal(loadout.equipment.frontWrist, null);

  for (const itemId of equippedItemIds) {
    assert.equal(hero.HERO_ITEM_CATALOG[itemId]?.rarity, "common");
  }
});

test("arena opponent model defines random opponents and boss hooks", () => {
  const tier = hero.getArenaTierDefinition(1);
  const randomOpponents = hero.getArenaRandomOpponentsForTier(1);
  const boss = hero.getArenaBossDefinition(tier.bossIds[0]);

  assert.equal(tier.randomOpponentIds.length, 1);
  assert.equal(tier.randomOpponentIds[0], "dust_arena_brawler");
  assert.equal(randomOpponents.length, 1);
  assert.equal(randomOpponents[0].id, "dust_arena_brawler");
  assert.deepEqual(randomOpponents[0].equipmentPool.itemRarities, tier.enemyItemRarities);
  assert.equal(randomOpponents[0].equipmentPool.rollChance, tier.enemyEquipmentRollChance);

  assert.equal(tier.bossIds.length, 1);
  assert.equal(boss?.id, "dust_arena_champion");
  assert.equal(boss?.tierId, 1);
  assert.equal(boss?.equipment.weaponMain, "generated_equipment_weapon_mace_wood_boss_01");
  assert.equal(boss?.equipment.helmet, "generated_equipment_helmet_wood_boss_01");
  assert.equal(boss?.equipment.breastplate, "generated_equipment_breastplate_wood_boss_01");
  assert.equal(boss?.equipment.backGreave, "generated_equipment_back_greave_wood_boss_01");
  assert.equal(boss?.equipment.frontGreave, "generated_equipment_front_greave_wood_boss_01");
  assert.deepEqual(
    Array.from(boss?.lootTable ?? [], (entry) => Array.from(entry.itemIds)),
    [
      ["generated_equipment_weapon_mace_wood_boss_01"],
      ["generated_equipment_back_boot_wood_boss_01", "generated_equipment_front_boot_wood_boss_01"],
      ["generated_equipment_breastplate_wood_boss_01"],
      ["generated_equipment_back_glove_wood_boss_01", "generated_equipment_front_glove_wood_boss_01"],
      ["generated_equipment_helmet_wood_boss_01"],
      ["generated_equipment_back_shinguard_wood_boss_01", "generated_equipment_front_shinguard_wood_boss_01"],
      ["generated_equipment_back_shoulderguard_wood_boss_01", "generated_equipment_front_shoulderguard_wood_boss_01"],
      ["generated_equipment_back_wrist_wood_boss_01", "generated_equipment_front_wrist_wood_boss_01"],
      ["generated_equipment_back_greave_wood_boss_01", "generated_equipment_front_greave_wood_boss_01"],
    ],
  );
  boss?.lootTable.forEach((entry) => {
    assert.equal(entry.chance, 1);
    assert.equal(entry.quantity, 1);
  });
});

test("arena encounters can create combat states from random opponents and bosses", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const randomEncounter = hero.createArenaRandomEnemyEncounter(1, () => 0);
  const randomState = hero.createCombatStateFromHero(baseHero, randomEncounter);

  assert.equal(randomEncounter.kind, "random");
  assert.equal(randomEncounter.name, "Grumbus");
  assert.equal(randomState.encounter?.id, "random:dust_arena_brawler");
  assert.equal(randomState.encounter?.kind, "random");
  assert.equal(randomState.enemy.name, "Grumbus");
  assert.equal(randomState.enemy.equipment?.weaponMain, "weapon_sword_01");

  const bossEncounter = hero.createArenaBossEncounter("dust_arena_champion");
  const bossState = hero.createCombatStateFromHero(baseHero, bossEncounter);

  assert.equal(bossEncounter.kind, "boss");
  assert.equal(bossState.encounter?.id, "boss:dust_arena_champion");
  assert.equal(bossState.enemy.name, "Dust Arena Champion");
  assert.equal(bossState.enemy.equipment?.helmet, "generated_equipment_helmet_wood_boss_01");
  assert.equal(bossState.enemy.equipment?.weaponMain, "generated_equipment_weapon_mace_wood_boss_01");
  assert.equal(bossState.enemy.armor, 20);

  bossState.result = "win";
  assert.equal(hero.getBattleReward(bossState).gold, 50);
  assert.equal(hero.getBattleReward(bossState).xp, 100);
});

test("arena encounter enemy base stats derive combat stats", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const encounter = {
    ...hero.createArenaRandomEnemyEncounter(1, () => 0),
    enemyLoadout: {
      equipment: hero.createDefaultHeroEquipment(),
      baseStats: {
        strength: 2,
        agility: 3,
        vitality: 4,
      },
      visualPreset: { skin: 0, skinDark: 0, hair: 0 },
    },
  };
  const combatState = hero.createCombatStateFromHero(baseHero, encounter);

  assert.equal(combatState.enemy.maxHp, 14);
  assert.equal(combatState.enemy.maxStamina, 14);
  assert.equal(combatState.enemy.damageBonus, 0);
  assert.equal(combatState.enemy.meleeDamagePercentBonus, 2 * hero.HERO_STRENGTH_MELEE_DAMAGE_PERCENT_BONUS);
  assert.equal(combatState.enemy.movementDistanceBonus, 0.045);
  assert.equal(combatState.enemy.restHpRestoreBonus, 4);
  assert.equal(combatState.enemy.restStaminaRestoreBonus, 4);
});

test("arena encounter loot rolls into hero inventory", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    inventory: [{ itemId: "leather_helmet_01", quantity: 1 }],
  };
  const bossEncounter = {
    ...hero.createArenaBossEncounter("dust_arena_champion"),
    lootTable: [
      {
        id: "guaranteed_leather_helmet",
        itemIds: ["leather_helmet_01"],
        chance: 1,
        quantity: 2,
      },
      {
        id: "missed_leather_breastplate",
        itemIds: ["leather_breastplate_01"],
        chance: 0,
        quantity: 1,
      },
    ],
  };
  const loot = hero.rollArenaEncounterLoot(bossEncounter, () => 0);
  const nextHero = hero.applyArenaLoot(baseHero, loot, "2026-01-01T00:01:00.000Z");

  assert.equal(loot.length, 1);
  assert.equal(loot[0].sourceId, "guaranteed_leather_helmet");
  assert.equal(loot[0].itemId, "leather_helmet_01");
  assert.equal(loot[0].quantity, 2);
  assert.equal(nextHero.inventory.find((entry) => entry.itemId === "leather_helmet_01")?.quantity, 3);
  assert.equal(nextHero.inventory.some((entry) => entry.itemId === "leather_breastplate_01"), false);
  assert.equal(nextHero.updatedAt, "2026-01-01T00:01:00.000Z");
});

test("combat reward application grants one random missing boss loot once", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const bossEncounter = hero.createArenaBossEncounter("dust_arena_champion");
  const bossState = hero.createCombatStateFromHero(baseHero, bossEncounter);

  bossState.result = "win";

  const lastLootEntry = bossEncounter.lootTable.at(-1);
  const lastLootItemIds = Array.from(lastLootEntry?.itemIds ?? []);

  assert.ok(lastLootEntry);

  const rewardApplication = hero.applyCombatReward(baseHero, bossState, "2026-01-01T00:01:00.000Z", () => 0.999);
  assert.equal(rewardApplication.reward.gold, 50);
  assert.equal(rewardApplication.reward.xp, 100);
  assert.equal(rewardApplication.loot.length, 1);
  assert.equal(rewardApplication.loot[0].sourceId, lastLootEntry.id);
  assert.deepEqual(Array.from(rewardApplication.loot[0].itemIds ?? [rewardApplication.loot[0].itemId]), lastLootItemIds);
  lastLootItemIds.forEach((itemId) => {
    assert.equal(rewardApplication.heroAfterReward.inventory.find((entry) => entry.itemId === itemId)?.quantity, 1);
  });
  assert.equal(rewardApplication.heroAfterReward.defeatedArenaBossIds.includes("dust_arena_champion"), true);
  assert.equal(hero.hasHeroDefeatedArenaBoss(rewardApplication.heroAfterReward, "dust_arena_champion"), true);

  const heroWithLastLoot = {
    ...baseHero,
    inventory: lastLootItemIds.map((itemId) => ({ itemId, quantity: 1 })),
  };
  const secondRewardApplication = hero.applyCombatReward(heroWithLastLoot, bossState, "2026-01-01T00:02:00.000Z", () => 0.999);
  const secondLootItemIds = Array.from(secondRewardApplication.loot[0]?.itemIds ?? [secondRewardApplication.loot[0]?.itemId].filter(Boolean));

  assert.equal(secondRewardApplication.loot.length, 1);
  assert.equal(secondLootItemIds.some((itemId) => lastLootItemIds.includes(itemId)), false);

  const stockedHero = {
    ...baseHero,
    inventory: bossEncounter.lootTable.flatMap((entry) => entry.itemIds.map((itemId) => ({ itemId, quantity: 1 }))),
  };
  let randomCalls = 0;
  const emptyLootRewardApplication = hero.applyCombatReward(stockedHero, bossState, "2026-01-01T00:04:00.000Z", () => {
    randomCalls += 1;
    return 0.5;
  });

  assert.equal(emptyLootRewardApplication.reward.gold, 50);
  assert.equal(emptyLootRewardApplication.reward.xp, 100);
  assert.equal(emptyLootRewardApplication.loot.length, 0);
  assert.equal(randomCalls, 0);
});

test("boss victories are recorded once in hero progression", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const firstRecord = hero.recordArenaBossDefeat(baseHero, "dust_arena_champion", "2026-01-01T00:01:00.000Z");
  const secondRecord = hero.recordArenaBossDefeat(firstRecord, "dust_arena_champion", "2026-01-01T00:02:00.000Z");

  assert.deepEqual([...firstRecord.defeatedArenaBossIds], ["dust_arena_champion"]);
  assert.equal(firstRecord.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(secondRecord, firstRecord);
});

test("hero level progression uses one thousand total xp across fifty levels", () => {
  assert.equal(hero.HERO_MAX_LEVEL, 50);
  assert.equal(hero.HERO_TOTAL_XP_TO_MAX_LEVEL, 1000);
  assert.equal(hero.HERO_XP_TO_NEXT_LEVEL_BY_LEVEL.length, 49);
  assert.equal(
    hero.HERO_XP_TO_NEXT_LEVEL_BY_LEVEL.reduce((total, xp) => total + xp, 0),
    1000,
  );

  assert.equal(hero.getHeroXpToNextLevel(1), 10);
  assert.equal(hero.getHeroXpToNextLevel(5), 15);
  assert.equal(hero.getHeroXpToNextLevel(15), 20);
  assert.equal(hero.getHeroXpToNextLevel(33), 25);
  assert.equal(hero.getHeroXpToNextLevel(45), 30);
  assert.equal(hero.getHeroXpToNextLevel(50), 30);
});

test("battle xp follows the level table and caps at level fifty", () => {
  const staleHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    xp: 9,
    xpToNextLevel: 100,
  };

  const levelTwoHero = hero.applyBattleReward(staleHero, { gold: 0, xp: 1 }, "2026-01-01T00:01:00.000Z");

  assert.equal(levelTwoHero.level, 2);
  assert.equal(levelTwoHero.xp, 0);
  assert.equal(levelTwoHero.xpToNextLevel, 10);
  assert.equal(levelTwoHero.skillPoints, 1);

  const maxHero = hero.applyBattleReward(hero.createDefaultHero("2026-01-01T00:00:00.000Z"), { gold: 0, xp: 1000 });

  assert.equal(maxHero.level, 50);
  assert.equal(maxHero.xp, 0);
  assert.equal(maxHero.xpToNextLevel, 30);
  assert.equal(maxHero.skillPoints, 49);
});

test("hero can spend level-up skill points on base attributes", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    skillPoints: 2,
  };
  const strengthHero = hero.allocateHeroSkillPoint(baseHero, "strength", "2026-01-01T00:01:00.000Z");
  const vitalityHero = hero.allocateHeroSkillPoint(strengthHero, "vitality", "2026-01-01T00:02:00.000Z");
  const exhaustedHero = hero.allocateHeroSkillPoint(vitalityHero, "agility", "2026-01-01T00:03:00.000Z");

  assert.equal(strengthHero.skillPoints, 1);
  assert.equal(strengthHero.baseStats.strength, 1);
  assert.equal(strengthHero.baseStats.agility, 0);
  assert.equal(strengthHero.updatedAt, "2026-01-01T00:01:00.000Z");

  assert.equal(vitalityHero.skillPoints, 0);
  assert.equal(vitalityHero.baseStats.strength, 1);
  assert.equal(vitalityHero.baseStats.vitality, 1);
  assert.equal(hero.deriveHeroStats(vitalityHero).damageBonus, 0);
  assert.equal(hero.deriveHeroStats(vitalityHero).meleeDamagePercentBonus, hero.HERO_STRENGTH_MELEE_DAMAGE_PERCENT_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).bodyScaleBonus, hero.HERO_STRENGTH_BODY_SCALE_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).clinchRangeBonus, hero.HERO_STRENGTH_CLINCH_RANGE_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).maxHp, combat.MAX_HP + hero.HERO_VITALITY_HP_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).maxStamina, combat.MAX_STAMINA + hero.HERO_VITALITY_STAMINA_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).restHpRestoreBonus, hero.HERO_VITALITY_REST_HP_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).restStaminaRestoreBonus, hero.HERO_VITALITY_REST_STAMINA_BONUS);

  assert.equal(exhaustedHero, vitalityHero);
});

test("hero can spend multiple skill points on one base attribute", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    skillPoints: 12,
  };
  const bulkHero = hero.allocateHeroSkillPoints(baseHero, "agility", 10, "2026-01-01T00:01:00.000Z");
  const cappedHero = hero.allocateHeroSkillPoints(bulkHero, "agility", 10, "2026-01-01T00:02:00.000Z");

  assert.equal(bulkHero.skillPoints, 2);
  assert.equal(bulkHero.baseStats.agility, 10);
  assert.equal(bulkHero.updatedAt, "2026-01-01T00:01:00.000Z");

  assert.equal(cappedHero.skillPoints, 0);
  assert.equal(cappedHero.baseStats.agility, 12);
  assert.equal(cappedHero.updatedAt, "2026-01-01T00:02:00.000Z");
  assert.equal(hero.allocateHeroSkillPoints(cappedHero, "agility", 0), cappedHero);
});

test("hero can receive temporary skill points", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const boostedHero = hero.grantHeroSkillPoints(baseHero, 10, "2026-01-01T00:01:00.000Z");

  assert.equal(boostedHero.skillPoints, 10);
  assert.equal(boostedHero.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(hero.grantHeroSkillPoints(boostedHero, 0), boostedHero);
});

test("hero can receive temporary gold", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const boostedHero = hero.grantHeroGold(baseHero, 1000, "2026-01-01T00:01:00.000Z");

  assert.equal(boostedHero.gold, 1000);
  assert.equal(boostedHero.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(hero.grantHeroGold(boostedHero, 0), boostedHero);
});

test("battle rewards use small early arena numbers", () => {
  const winState = combat.freshState();
  winState.result = "win";
  const winReward = hero.getBattleReward(winState);

  assert.equal(winReward.gold, hero.BATTLE_WIN_REWARD.gold);
  assert.equal(winReward.xp, hero.BATTLE_WIN_REWARD.xp);

  const loseState = combat.freshState();
  loseState.result = "lose";
  const lossReward = hero.getBattleReward(loseState);

  assert.equal(lossReward.gold, hero.BATTLE_LOSS_REWARD.gold);
  assert.equal(lossReward.xp, hero.BATTLE_LOSS_REWARD.xp);

  const drawState = combat.freshState();
  drawState.result = "draw";
  const drawReward = hero.getBattleReward(drawState);

  assert.equal(drawReward.gold, 0);
  assert.equal(drawReward.xp, 0);
});

test("owned shop items can be equipped without paying again", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    gold: 10,
    inventory: [{ itemId: "leather_helmet_01", quantity: 1 }],
  };

  assert.equal(hero.areHeroItemsOwned(baseHero, ["leather_helmet_01"]), true);
  assert.equal(hero.areHeroItemsEquipped(baseHero, ["leather_helmet_01"]), false);

  const nextHero = hero.buyAndEquipHeroItems(
    baseHero,
    {
      itemIds: ["leather_helmet_01"],
      price: 5,
    },
    "2026-01-01T00:01:00.000Z",
  );

  assert.equal(nextHero.gold, 10);
  assert.equal(nextHero.equipment.helmet, "leather_helmet_01");
  assert.equal(hero.areHeroItemsEquipped(nextHero, ["leather_helmet_01"]), true);
});

test("weapon requirements block bow purchases until agility is high enough", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    gold: 150,
  };
  const requirementChecks = hero.getHeroItemRequirementChecks(baseHero, ["generated_equipment_weapon_bow_01"]);

  assert.equal(hero.canHeroEquipItems(baseHero, ["generated_equipment_weapon_bow_01"]), false);
  assert.equal(requirementChecks.length, 1);
  assert.equal(requirementChecks[0].attribute, "agility");
  assert.equal(requirementChecks[0].required, 10);
  assert.equal(requirementChecks[0].current, 0);
  assert.equal(
    hero.buyAndEquipHeroItems(baseHero, { itemIds: ["generated_equipment_weapon_bow_01"], price: 100 }, "2026-01-01T00:01:00.000Z"),
    baseHero,
  );

  const agileHero = {
    ...baseHero,
    baseStats: {
      ...baseHero.baseStats,
      agility: 10,
    },
  };
  const nextHero = hero.buyAndEquipHeroItems(
    agileHero,
    { itemIds: ["generated_equipment_weapon_bow_01"], price: 100 },
    "2026-01-01T00:02:00.000Z",
  );

  assert.equal(hero.canHeroEquipItems(agileHero, ["generated_equipment_weapon_bow_01"]), true);
  assert.equal(nextHero.gold, 50);
  assert.equal(nextHero.equipment.weaponMain, null);
  assert.equal(nextHero.equipment.weaponBow, "generated_equipment_weapon_bow_01");
  assert.equal(hero.deriveHeroStats(nextHero).weaponDamageBonus, 5);
});

test("shurikens buy as capped consumables without equipping", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    gold: 20,
  };
  const firstPurchase = hero.buyAndEquipHeroItems(
    baseHero,
    { itemIds: ["generated_equipment_weapon_shuriken_01"], price: 5 },
    "2026-01-01T00:01:00.000Z",
  );
  const secondPurchase = hero.buyAndEquipHeroItems(
    firstPurchase,
    { itemIds: ["generated_equipment_weapon_shuriken_01"], price: 5 },
    "2026-01-01T00:02:00.000Z",
  );
  const blockedPurchase = hero.buyAndEquipHeroItems(
    secondPurchase,
    { itemIds: ["generated_equipment_weapon_shuriken_01"], price: 5 },
    "2026-01-01T00:03:00.000Z",
  );

  assert.equal(hero.areHeroItemsConsumable(["generated_equipment_weapon_shuriken_01"]), true);
  assert.equal(firstPurchase.gold, 15);
  assert.equal(secondPurchase.gold, 10);
  assert.equal(secondPurchase.equipment.weaponMain, null);
  assert.equal(hero.getHeroItemQuantity(secondPurchase, "generated_equipment_weapon_shuriken_01"), 2);
  assert.equal(blockedPurchase, secondPurchase);
});

test("combat state exposes shuriken count and rewards persist spent consumables", () => {
  const stockedHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    inventory: [{ itemId: "generated_equipment_weapon_shuriken_01", quantity: 2 }],
  };
  const combatState = hero.createCombatStateFromHero(stockedHero, 1);

  assert.equal(combatState.player.shurikenCount, 2);
  assert.equal(combatState.player.shurikenDamage, 2);
  assert.equal(combatState.player.shurikenItemId, "generated_equipment_weapon_shuriken_01");

  const spentCombatState = {
    ...combatState,
    result: "lose",
    player: {
      ...combatState.player,
      shurikenCount: 1,
    },
  };
  const rewardApplication = hero.applyCombatReward(stockedHero, spentCombatState, "2026-01-01T00:01:00.000Z", () => 0.99);

  assert.equal(hero.getHeroItemQuantity(rewardApplication.heroAfterReward, "generated_equipment_weapon_shuriken_01"), 1);
});

test("bow capacity upgrade costs gold and expands combat shots", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const bowHero = {
    ...baseHero,
    equipment: {
      ...baseHero.equipment,
      weaponBow: "generated_equipment_weapon_bow_01",
    },
  };
  const defaultCombatState = hero.createCombatStateFromHero(bowHero, 1);
  const poorHero = {
    ...baseHero,
    gold: hero.HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE - 1,
  };
  const fundedHero = {
    ...baseHero,
    gold: hero.HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE,
  };

  assert.equal(hero.getHeroBowShotCapacity({ ...baseHero, bowShotCapacity: undefined }), combat.BOW_SHOTS_PER_BATTLE);
  assert.equal(defaultCombatState.player.bowShotsRemaining, combat.BOW_SHOTS_PER_BATTLE);
  assert.equal(defaultCombatState.player.bowMaxShots, combat.BOW_SHOTS_PER_BATTLE);
  assert.equal(hero.canUpgradeHeroBowShotCapacity(poorHero), false);
  assert.equal(hero.upgradeHeroBowShotCapacity(poorHero, "2026-01-01T00:01:00.000Z"), poorHero);

  const upgradedHero = hero.upgradeHeroBowShotCapacity(fundedHero, "2026-01-01T00:02:00.000Z");
  const upgradedBowHero = {
    ...upgradedHero,
    equipment: {
      ...upgradedHero.equipment,
      weaponBow: "generated_equipment_weapon_bow_01",
    },
  };
  const upgradedCombatState = hero.createCombatStateFromHero(upgradedBowHero, 1);

  assert.equal(upgradedHero.gold, 0);
  assert.equal(hero.getHeroBowShotCapacity(upgradedHero), hero.HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX);
  assert.equal(upgradedCombatState.player.bowShotsRemaining, hero.HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX);
  assert.equal(upgradedCombatState.player.bowMaxShots, hero.HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX);
  assert.equal(hero.upgradeHeroBowShotCapacity(upgradedHero, "2026-01-01T00:03:00.000Z"), upgradedHero);
});
