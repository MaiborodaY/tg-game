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
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("backWrist"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("frontWrist"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("backGlove"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("frontGlove"), true);

  assert.equal(hero.createDefaultHeroEquipment().backWrist, null);
  assert.equal(hero.createDefaultHeroEquipment().frontWrist, null);
  assert.equal(hero.createDefaultHeroEquipment().backGlove, null);
  assert.equal(hero.createDefaultHeroEquipment().frontGlove, null);
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

  assert.equal(tunedStats.damageBonus, 3);
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
      equipmentSlot: "weaponMain",
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
  assert.equal(boss?.equipment.helmet, "generated_equipment_helmet_wood_boss_01");
  assert.equal(boss?.lootTable.length, 1);
  assert.equal(boss?.lootTable[0].id, "dust_arena_champion_generated_equipment_helmet_wood_boss_01_drop");
  assert.equal(boss?.lootTable[0].itemIds.length, 1);
  assert.equal(boss?.lootTable[0].itemIds[0], "generated_equipment_helmet_wood_boss_01");
  assert.equal(boss?.lootTable[0].chance, 1);
  assert.equal(boss?.lootTable[0].quantity, 1);
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
  assert.equal(bossState.enemy.equipment?.weaponMain, null);
  assert.equal(bossState.enemy.armor, 5);

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
  assert.equal(combatState.enemy.damageBonus, 2);
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

test("combat reward application stores shown boss loot in hero inventory", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const bossState = hero.createCombatStateFromHero(baseHero, hero.createArenaBossEncounter("dust_arena_champion"));

  bossState.result = "win";

  const rewardApplication = hero.applyCombatReward(baseHero, bossState, "2026-01-01T00:01:00.000Z", () => 0);
  const bossHelmetId = "generated_equipment_helmet_wood_boss_01";

  assert.equal(rewardApplication.reward.gold, 50);
  assert.equal(rewardApplication.reward.xp, 100);
  assert.equal(rewardApplication.loot.length, 1);
  assert.equal(rewardApplication.loot[0].itemId, bossHelmetId);
  assert.equal(rewardApplication.heroAfterReward.inventory.find((entry) => entry.itemId === bossHelmetId)?.quantity, 1);
  assert.equal(rewardApplication.heroAfterReward.defeatedArenaBossIds.includes("dust_arena_champion"), true);
  assert.equal(hero.hasHeroDefeatedArenaBoss(rewardApplication.heroAfterReward, "dust_arena_champion"), true);
  assert.equal(hero.isHeroItemOwned(rewardApplication.heroAfterReward, bossHelmetId), true);
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
  assert.equal(hero.deriveHeroStats(vitalityHero).damageBonus, 1);
  assert.equal(hero.deriveHeroStats(vitalityHero).bodyScaleBonus, hero.HERO_STRENGTH_BODY_SCALE_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).clinchRangeBonus, hero.HERO_STRENGTH_CLINCH_RANGE_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).maxHp, combat.MAX_HP + hero.HERO_VITALITY_HP_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).maxStamina, combat.MAX_STAMINA + hero.HERO_VITALITY_STAMINA_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).restHpRestoreBonus, hero.HERO_VITALITY_REST_HP_BONUS);
  assert.equal(hero.deriveHeroStats(vitalityHero).restStaminaRestoreBonus, hero.HERO_VITALITY_REST_STAMINA_BONUS);

  assert.equal(exhaustedHero, vitalityHero);
});

test("hero can receive temporary skill points", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const boostedHero = hero.grantHeroSkillPoints(baseHero, 10, "2026-01-01T00:01:00.000Z");

  assert.equal(boostedHero.skillPoints, 10);
  assert.equal(boostedHero.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(hero.grantHeroSkillPoints(boostedHero, 0), boostedHero);
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
