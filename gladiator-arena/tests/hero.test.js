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
const arenaOpponentNames = loadTypeScriptModule("../src/arenaOpponentNames.ts");
const generatedArenaBosses = loadTypeScriptModule("../src/generated/arenaBosses.generated.ts");
const generatedArenaTiers = loadTypeScriptModule("../src/generated/arenaTiers.generated.ts");
const arenaOpponents = loadTypeScriptModule("../src/arenaOpponents.ts", {
  require: (id) => {
    if (id === "./generated/arenaBosses.generated") {
      return generatedArenaBosses;
    }

    if (id === "./generated/arenaTiers.generated") {
      return generatedArenaTiers;
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
  generated_equipment_weapon_sword_top: {
    id: "generated_equipment_weapon_sword_top",
    name: "Common Sword Top",
    kind: "weapon",
    rarity: "common",
    weaponClass: "sword",
    equipmentSlot: "weaponMain",
    damageBonus: 4,
    levelRequirement: 10,
  },
  generated_equipment_weapon_sword_uncommon: {
    id: "generated_equipment_weapon_sword_uncommon",
    name: "Uncommon Sword",
    kind: "weapon",
    rarity: "uncommon",
    weaponClass: "sword",
    equipmentSlot: "weaponMain",
    damageBonus: 5,
  },
  generated_equipment_weapon_bow_01: {
    id: "generated_equipment_weapon_bow_01",
    name: "Bow 01",
    kind: "weapon",
    rarity: "common",
    weaponClass: "bow",
    equipmentSlot: "weaponBow",
    damageBonus: 5,
    requirements: { agility: 5 },
  },
  generated_equipment_weapon_shuriken_01: {
    id: "generated_equipment_weapon_shuriken_01",
    name: "Rusty Shuriken",
    kind: "weapon",
    rarity: "common",
    weaponClass: "shuriken",
    equipmentSlot: "weaponMain",
    damageBonus: 2,
    levelRequirement: 5,
  },
  generated_equipment_weapon_shuriken_rare: {
    id: "generated_equipment_weapon_shuriken_rare",
    name: "Rare Shuriken",
    kind: "weapon",
    rarity: "rare",
    weaponClass: "shuriken",
    equipmentSlot: "weaponMain",
    damageBonus: 7,
    levelRequirement: 30,
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
  sand_back_wrist_01: {
    id: "sand_back_wrist_01",
    name: "Sand Back Wrist 01",
    kind: "armor",
    rarity: "common",
    armorCategory: "sand",
    equipmentSlot: "backWrist",
    armorHp: 1,
  },
  sand_front_wrist_01: {
    id: "sand_front_wrist_01",
    name: "Sand Front Wrist 01",
    kind: "armor",
    rarity: "common",
    armorCategory: "sand",
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

    if (id === "./arenaOpponentNames") {
      return arenaOpponentNames;
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

test("hero starts with empty equipment including gloves wrists and shield", () => {
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("weaponBow"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("backWrist"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("frontWrist"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("backGlove"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("frontGlove"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("shield"), true);

  assert.equal(hero.createDefaultHeroEquipment().backWrist, null);
  assert.equal(hero.createDefaultHeroEquipment().frontWrist, null);
  assert.equal(hero.createDefaultHeroEquipment().backGlove, null);
  assert.equal(hero.createDefaultHeroEquipment().frontGlove, null);
  assert.equal(hero.createDefaultHeroEquipment().shield, null);
  assert.equal(hero.createDefaultHeroEquipment().weaponBow, null);
  assert.deepEqual([...hero.createDefaultHero().defeatedArenaBossIds], []);
  assert.deepEqual([...hero.createDefaultHero().unlockedShopRarities], []);
  assert.equal(Object.keys(hero.createDefaultHero().scrollUpgrades ?? {}).length, 0);
});

test("preview equipment shows bows without mutating equipped melee weapons", () => {
  const equipment = {
    ...hero.createDefaultHeroEquipment(),
    weaponMain: "weapon_sword_01",
  };
  const previewEquipment = hero.createHeroPreviewEquipment(equipment, ["generated_equipment_weapon_bow_01"]);

  assert.equal(equipment.weaponMain, "weapon_sword_01");
  assert.equal(equipment.weaponBow, null);
  assert.equal(previewEquipment.weaponMain, "weapon_sword_01");
  assert.equal(previewEquipment.weaponBow, "generated_equipment_weapon_bow_01");
});

test("preview equipment can show shurikens while they remain consumables", () => {
  const equipment = {
    ...hero.createDefaultHeroEquipment(),
    weaponMain: "weapon_sword_01",
  };
  const previewEquipment = hero.createHeroPreviewEquipment(equipment, ["generated_equipment_weapon_shuriken_01"]);

  assert.equal(hero.areHeroItemsConsumable(["generated_equipment_weapon_shuriken_01"]), true);
  assert.equal(equipment.weaponMain, "weapon_sword_01");
  assert.equal(previewEquipment.weaponMain, "generated_equipment_weapon_shuriken_01");
});

test("hero starts with default dummy appearance and can update cosmetic slots", () => {
  const defaultHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");

  const defaultAppearance = hero.createDefaultHeroAppearance();

  assert.equal(defaultAppearance.hairId, "hair-01");
  assert.equal(defaultAppearance.beardId, "beard-short-01");
  assert.equal(defaultHero.appearance.hairId, "hair-01");
  assert.equal(defaultHero.appearance.beardId, "beard-short-01");

  const withHair = hero.updateHeroAppearance(defaultHero, { hairId: null }, "2026-01-01T00:01:00.000Z");

  assert.notEqual(withHair, defaultHero);
  assert.equal(withHair.appearance.hairId, null);
  assert.equal(withHair.appearance.beardId, "beard-short-01");
  assert.equal(withHair.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(hero.updateHeroAppearance(withHair, { hairId: null }), withHair);

  const withBeard = hero.updateHeroAppearance(withHair, { beardId: null }, "2026-01-01T00:02:00.000Z");

  assert.equal(withBeard.appearance.hairId, null);
  assert.equal(withBeard.appearance.beardId, null);
  assert.equal(withBeard.updatedAt, "2026-01-01T00:02:00.000Z");
});

test("hero base attributes derive combat stats", () => {
  const defaultHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");

  assert.equal(defaultHero.baseStats.strength, 0);
  assert.equal(defaultHero.baseStats.agility, 0);
  assert.equal(defaultHero.baseStats.vitality, 0);
  assert.equal(defaultHero.skillPoints, hero.HERO_STARTING_SKILL_POINTS);

  const defaultStats = hero.deriveHeroStats(defaultHero);

  assert.equal(defaultStats.maxHp, combat.MAX_HP);
  assert.equal(defaultStats.maxStamina, combat.MAX_STAMINA);
  assert.equal(defaultStats.damageBonus, 0);
  assert.equal(defaultStats.weaponDamageBonus, 0);
  assert.equal(defaultStats.meleeDamagePercentBonus, 0);
  assert.equal(defaultStats.spearLungeDamagePercentBonus, 0);
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
  assert.equal(tunedStats.spearLungeDamagePercentBonus, 4 * hero.HERO_AGILITY_SPEAR_LUNGE_DAMAGE_PERCENT_BONUS);
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
  assert.equal(combatState.player.spearLungeDamagePercentBonus, tunedStats.spearLungeDamagePercentBonus);
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

const arenaMatrixRarities = ["common", "uncommon", "rare", "epic", "legendary", "mythical"];
const expectedArenaGoldRewards = new Map([
  [1, { easy: 4, medium: 6, hard: 9, boss: 14 }],
  [2, { easy: 14, medium: 16, hard: 19, boss: 25 }],
  [3, { easy: 25, medium: 28, hard: 32, boss: 40 }],
  [4, { easy: 40, medium: 44, hard: 49, boss: 60 }],
  [5, { easy: 60, medium: 65, hard: 71, boss: 85 }],
  [6, { easy: 85, medium: 91, hard: 99, boss: 115 }],
  [7, { easy: 115, medium: 122, hard: 131, boss: 150 }],
  [8, { easy: 150, medium: 158, hard: 168, boss: 190 }],
]);

function createExpectedArenaMatrixPool(rarity, rollChance, weaponChance, bowChance, shieldChance, shurikenChance, scrollChance) {
  return {
    itemRarities: [rarity],
    rollChance,
    weaponChance,
    bowChance,
    shieldChance,
    shurikenChance,
    ...(scrollChance > 0 ? { scrollChance } : {}),
  };
}

function createExpectedArenaMatrixArmorOnlyPool(rarity, rollChance) {
  return createExpectedArenaMatrixPool(rarity, rollChance, 0, 0, 0, 0, 0);
}

function getExpectedArenaMatrixCurrentRarityIndex(tierId) {
  return Math.min(Math.max(tierId - 1, 1), arenaMatrixRarities.length - 1);
}

function getExpectedArenaMatrixEquipmentPools(tierId, difficultyId) {
  const currentIndex = getExpectedArenaMatrixCurrentRarityIndex(tierId);
  const previous = arenaMatrixRarities[currentIndex - 1];
  const current = arenaMatrixRarities[currentIndex];
  const next = arenaMatrixRarities[currentIndex + 1];

  if (difficultyId === "easy") {
    return [
      createExpectedArenaMatrixPool(previous, 0.95, 0.7, 0.05, 0.05, 0.08, 0.02),
      createExpectedArenaMatrixPool(current, 1, 1, 0.03, 0.03, 0.02, 0.03),
    ];
  }

  if (difficultyId === "medium") {
    return [
      createExpectedArenaMatrixArmorOnlyPool(previous, 0.35),
      createExpectedArenaMatrixPool(current, 1, 1, 0.07, 0.14, 0.08, 0.05),
    ];
  }

  return next
    ? [createExpectedArenaMatrixPool(current, 0.95, 0.95, 0.1, 0.22, 0.12, 0.1), createExpectedArenaMatrixPool(next, 1, 1, 0.04, 0.08, 0.04, 0.05)]
    : [createExpectedArenaMatrixPool(current, 1, 1, 0.1, 0.22, 0.12, 0.1)];
}

test("arena tier one default enemy loadouts use tier one equipment pools", () => {
  const tierOneEquipmentPools = hero.getArenaTierDefinition(1).enemyEquipmentPools;

  assert.equal(tierOneEquipmentPools.length, 2);
  assert.equal(tierOneEquipmentPools[0].itemRarities.length, 1);
  assert.equal(tierOneEquipmentPools[0].itemRarities[0], "common");
  assert.equal(tierOneEquipmentPools[0].rollChance, 0.2);
  assert.equal(tierOneEquipmentPools[0].weaponChance, 0.5);
  assert.equal(tierOneEquipmentPools[0].bowChance, 0.1);
  assert.equal(tierOneEquipmentPools[0].shieldChance, 0.05);
  assert.equal(tierOneEquipmentPools[0].shurikenChance, 0.1);
  assert.equal(tierOneEquipmentPools[0].scrollChance, 1);
  assert.equal(tierOneEquipmentPools[1].itemRarities[0], "uncommon");
  assert.equal(tierOneEquipmentPools[1].rollChance, 0.01);
  assert.equal(tierOneEquipmentPools[1].bowChance, 0);
  assert.equal(tierOneEquipmentPools[1].shieldChance, 0);
  assert.equal(tierOneEquipmentPools[1].shurikenChance, 0);
  assert.equal(tierOneEquipmentPools[1].scrollChance, undefined);

  const loadout = hero.createRandomEnemyLoadout(() => 0, 1);
  const equippedItemIds = Object.values(loadout.equipment).filter(Boolean);

  assert.equal(loadout.equipment.weaponMain, "weapon_sword_01");
  assert.notEqual(loadout.equipment.weaponMain, "generated_equipment_weapon_shuriken_01");
  assert.equal(loadout.shurikenItemId, "generated_equipment_weapon_shuriken_01");
  assert.equal(loadout.shurikenCount, 1);
  assert.equal(loadout.shurikenDamage, 2);
  assert.equal(loadout.scrollItemId, hero.HERO_CRACK_ARMOR_SCROLL_ITEM_ID);
  assert.equal(loadout.scrollCount, 1);
  assert.equal(loadout.equipment.breastplate, "cloth_breastplate_01");

  assert.equal(equippedItemIds.includes("generated_equipment_weapon_shuriken_01"), false);
  for (const itemId of equippedItemIds) {
    assert.equal(["common", "uncommon"].includes(hero.HERO_ITEM_CATALOG[itemId]?.rarity), true);
  }
});

test("arena tier equipment pools follow the difficulty matrix from tier two onward", () => {
  for (const tier of hero.ARENA_TIER_CONFIGS.filter((arenaTier) => arenaTier.id >= 2)) {
    for (const opponent of tier.opponents) {
      assert.deepEqual(JSON.parse(JSON.stringify(opponent.equipmentPools)), getExpectedArenaMatrixEquipmentPools(tier.id, opponent.difficultyId));
    }
  }
});

test("arena win gold rewards follow the permanent equipment economy curve", () => {
  for (const tier of hero.ARENA_TIER_CONFIGS) {
    const expectedTierRewards = expectedArenaGoldRewards.get(tier.id);

    assert.ok(expectedTierRewards, `Missing expected reward curve for arena tier ${tier.id}`);

    for (const opponent of tier.opponents) {
      assert.equal(opponent.rewards.win.gold, expectedTierRewards[opponent.difficultyId]);
    }
  }

  for (const boss of hero.ARENA_BOSSES) {
    const expectedTierRewards = expectedArenaGoldRewards.get(boss.tierId);

    assert.ok(expectedTierRewards, `Missing expected boss reward curve for arena tier ${boss.tierId}`);
    assert.equal(boss.rewards.win.gold, expectedTierRewards.boss);
  }
});

test("enemy equipment generation keeps the first rolled item for each slot", () => {
  const testTier = {
    id: 99,
    name: "Test Tier",
    enemyEquipmentPools: [
      { itemRarities: ["common"], rollChance: 0, weaponChance: 1, shurikenChance: 0 },
      { itemRarities: ["uncommon"], rollChance: 0, weaponChance: 1, shurikenChance: 0 },
    ],
    randomOpponentIds: [],
    bossIds: [],
  };
  const isolatedArenaOpponents = {
    ARENA_BOSSES: [],
    ARENA_DIFFICULTY_IDS: ["easy", "medium", "hard"],
    ARENA_RANDOM_OPPONENTS: [],
    ARENA_TIER_CONFIGS: [],
    ARENA_TIERS: [testTier],
    BATTLE_LOSS_REWARD: { gold: 1, xp: 1 },
    BATTLE_WIN_REWARD: { gold: 10, xp: 10 },
    DEFAULT_ARENA_DIFFICULTY_ID: "medium",
    DEFAULT_ARENA_TIER_ID: testTier.id,
    getArenaBossDefinition: () => undefined,
    getArenaBossesForTier: () => [],
    getArenaRandomOpponentDefinition: () => undefined,
    getArenaRandomOpponentsForTier: () => [],
    getArenaRandomOpponentsForTierAndDifficulty: () => [],
    getArenaTierConfig: () => undefined,
    getArenaTierDefinition: () => testTier,
    getArenaTierDefinitions: () => [testTier],
  };
  const isolatedHero = loadTypeScriptModule("../src/hero.ts", {
    require: (id) => {
      if (id === "./combat") {
        return combat;
      }

      if (id === "./arenaOpponents") {
        return isolatedArenaOpponents;
      }

      if (id === "./arenaOpponentNames") {
        return arenaOpponentNames;
      }

      if (id === "./generated/equipmentItems.generated") {
        return {
          GENERATED_EQUIPMENT_ITEM_CATALOG: generatedItems,
          GENERATED_EQUIPMENT_ITEM_IDS: Object.keys(generatedItems),
          GENERATED_EQUIPMENT_ITEM_RECORDS: Object.values(generatedItems).map((item) => ({ item })),
        };
      }

      throw new Error(`Unsupported isolated hero test import: ${id}`);
    },
  });

  const loadout = isolatedHero.createRandomEnemyLoadout(() => 0, testTier.id);

  assert.equal(loadout.equipment.weaponMain, "weapon_sword_01");
});

test("enemy scroll generation uses the tier roll table and difficulty modifier", () => {
  const testTiers = [1, 3, 10].map((id) => ({
    id,
    name: `Scroll Test Tier ${id}`,
    enemyEquipmentPools: [],
    randomOpponentIds: [],
    bossIds: [],
  }));
  const rollSequence = (...values) => {
    const queue = [...values];

    return () => queue.shift() ?? 0;
  };
  const isolatedArenaOpponents = {
    ARENA_BOSSES: [],
    ARENA_DIFFICULTY_IDS: ["easy", "medium", "hard"],
    ARENA_RANDOM_OPPONENTS: [],
    ARENA_TIER_CONFIGS: [],
    ARENA_TIERS: testTiers,
    BATTLE_LOSS_REWARD: { gold: 1, xp: 1 },
    BATTLE_WIN_REWARD: { gold: 10, xp: 10 },
    DEFAULT_ARENA_DIFFICULTY_ID: "medium",
    DEFAULT_ARENA_TIER_ID: 1,
    getArenaBossDefinition: () => undefined,
    getArenaBossesForTier: () => [],
    getArenaRandomOpponentDefinition: () => undefined,
    getArenaRandomOpponentsForTier: () => [],
    getArenaRandomOpponentsForTierAndDifficulty: () => [],
    getArenaTierConfig: () => undefined,
    getArenaTierDefinition: (tierId = 1) => testTiers.find((tier) => tier.id === tierId) ?? testTiers[0],
    getArenaTierDefinitions: () => testTiers,
  };
  const isolatedHero = loadTypeScriptModule("../src/hero.ts", {
    require: (id) => {
      if (id === "./combat") {
        return combat;
      }

      if (id === "./arenaOpponents") {
        return isolatedArenaOpponents;
      }

      if (id === "./arenaOpponentNames") {
        return arenaOpponentNames;
      }

      if (id === "./generated/equipmentItems.generated") {
        return {
          GENERATED_EQUIPMENT_ITEM_CATALOG: generatedItems,
          GENERATED_EQUIPMENT_ITEM_IDS: Object.keys(generatedItems),
          GENERATED_EQUIPMENT_ITEM_RECORDS: Object.values(generatedItems).map((item) => ({ item })),
        };
      }

      throw new Error(`Unexpected import: ${id}`);
    },
  });

  const tierOneEasyLoadout = isolatedHero.createRandomEnemyLoadout(() => 0, 1, "easy");
  const tierOneMediumMiss = isolatedHero.createRandomEnemyLoadout(() => 0.1, 1, "medium");
  const tierOneMediumHit = isolatedHero.createRandomEnemyLoadout(rollSequence(0.09, 0, 0), 1, "medium");
  const tierThreeFireball = isolatedHero.createRandomEnemyLoadout(rollSequence(0, 0.2, 0), 3, "medium");
  const tierTenPoison = isolatedHero.createRandomEnemyLoadout(rollSequence(0.99, 0.99, 0), 10, "hard");

  assert.equal(tierOneEasyLoadout.scrollItemId, undefined);
  assert.equal(tierOneMediumMiss.scrollItemId, undefined);
  assert.equal(tierOneMediumHit.scrollItemId, hero.HERO_CRACK_ARMOR_SCROLL_ITEM_ID);
  assert.equal(tierOneMediumHit.scrollCount, 1);
  assert.equal(tierOneMediumHit.crackArmorParts, 1);
  assert.equal(tierThreeFireball.fireballScrollItemId, hero.HERO_FIREBALL_SCROLL_ITEM_ID);
  assert.equal(tierThreeFireball.fireballScrollCount, 1);
  assert.equal(tierThreeFireball.fireballDamage, 80);
  assert.equal(tierTenPoison.poisonScrollItemId, hero.HERO_POISON_SCROLL_ITEM_ID);
  assert.equal(tierTenPoison.poisonScrollCount, 1);
  assert.equal(tierTenPoison.poisonDamage, 10);
});

test("arena opponent model defines random opponents and boss hooks", () => {
  const tier = hero.getArenaTierDefinition(1);
  const randomOpponents = hero.getArenaRandomOpponentsForTier(1);
  const easyOpponents = hero.getArenaRandomOpponentsForTierAndDifficulty(1, "easy");
  const mediumOpponents = hero.getArenaRandomOpponentsForTierAndDifficulty(1, hero.DEFAULT_ARENA_DIFFICULTY_ID);
  const hardOpponents = hero.getArenaRandomOpponentsForTierAndDifficulty(1, "hard");
  const boss = hero.getArenaBossDefinition(tier.bossIds[0]);
  const tierTwo = hero.getArenaTierDefinition(2);
  const tierTwoEasyOpponents = hero.getArenaRandomOpponentsForTierAndDifficulty(2, "easy");

  assert.equal(hero.DEFAULT_ARENA_DIFFICULTY_ID, "medium");
  assert.equal(hero.ARENA_TIER_CONFIGS[0].name, "Dust Arena");
  assert.equal(tier.name, "Dust Arena");
  assert.equal(hero.getArenaTierDefinitions().some((arenaTier) => arenaTier.id === 1), true);
  assert.equal(tier.unlockBossId, undefined);
  assert.equal(tier.randomOpponentIds.length, 3);
  assert.deepEqual([...tier.randomOpponentIds], ["dust_arena_dummy", "dust_arena_brawler", "dust_arena_veteran"]);
  assert.equal(randomOpponents.length, 3);
  assert.equal(easyOpponents.length, 1);
  assert.equal(easyOpponents[0].id, "dust_arena_dummy");
  assert.equal(easyOpponents[0].baseStats?.strength, 0);
  assert.equal(easyOpponents[0].baseStats?.agility, 0);
  assert.equal(easyOpponents[0].baseStats?.vitality, 0);
  assert.equal("name" in easyOpponents[0], false);
  assert.equal(easyOpponents[0].equipmentPools.length, 0);
  assert.equal(easyOpponents[0].rewards.win.gold, 4);
  assert.equal(easyOpponents[0].rewards.win.xp, 4);
  assert.equal(easyOpponents[0].rewards.loss.gold, 1);
  assert.equal(easyOpponents[0].rewards.loss.xp, 1);
  assert.equal(mediumOpponents.length, 1);
  assert.equal(mediumOpponents[0].id, "dust_arena_brawler");
  assert.equal("name" in mediumOpponents[0], false);
  assert.equal(mediumOpponents[0].equipmentPools.length, 2);
  assert.equal(mediumOpponents[0].equipmentPools[0].itemRarities.length, 1);
  assert.equal(mediumOpponents[0].equipmentPools[0].itemRarities[0], "common");
  assert.equal(mediumOpponents[0].equipmentPools[0].rollChance, tier.enemyEquipmentPools[0].rollChance);
  assert.equal(mediumOpponents[0].equipmentPools[1].itemRarities[0], "uncommon");
  assert.equal(mediumOpponents[0].equipmentPools[1].rollChance, 0.01);
  assert.equal(mediumOpponents[0].rewards.win.gold, 6);
  assert.equal(mediumOpponents[0].rewards.win.xp, 6);
  assert.equal(mediumOpponents[0].rewards.loss.gold, 1);
  assert.equal(mediumOpponents[0].rewards.loss.xp, 1);
  assert.equal(hardOpponents.length, 1);
  assert.equal(hardOpponents[0].id, "dust_arena_veteran");
  assert.equal(hardOpponents[0].baseStats, undefined);
  assert.equal("name" in hardOpponents[0], false);
  assert.equal(hardOpponents[0].randomBaseStatPoints, 3);
  assert.equal(hardOpponents[0].equipmentPools.length, 2);
  assert.equal(hardOpponents[0].equipmentPools[0].itemRarities[0], "common");
  assert.equal(hardOpponents[0].equipmentPools[0].rollChance, 0.95);
  assert.equal(hardOpponents[0].equipmentPools[0].bowChance, 0.3);
  assert.equal(hardOpponents[0].equipmentPools[0].shieldChance, 0.1);
  assert.equal(hardOpponents[0].equipmentPools[1].itemRarities[0], "uncommon");
  assert.equal(hardOpponents[0].equipmentPools[1].rollChance, 1);
  assert.equal(hardOpponents[0].equipmentPools[1].bowChance, 0);
  assert.equal(hardOpponents[0].equipmentPools[1].shieldChance, 0);
  assert.equal(hardOpponents[0].equipmentPools[1].shurikenChance, 0);
  assert.equal(hardOpponents[0].rewards.win.gold, 9);
  assert.equal(hardOpponents[0].rewards.win.xp, 10);
  assert.equal(hardOpponents[0].rewards.loss.gold, 1);
  assert.equal(hardOpponents[0].rewards.loss.xp, 1);
  assert.equal(tierTwo.name, "Dust Arena II");
  assert.equal(tierTwo.unlockBossId, "dust_arena_champion");
  assert.equal(tierTwo.randomOpponentIds.length, 3);
  assert.equal(tierTwoEasyOpponents[0].rewards.win.gold, 14);
  assert.equal(tierTwoEasyOpponents[0].rewards.win.xp, 15);

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
  const easyEncounter = hero.createArenaRandomEnemyEncounter(1, "easy", () => 0);
  const easyState = hero.createCombatStateFromHero(baseHero, easyEncounter);
  const hardEncounter = hero.createArenaRandomEnemyEncounter(1, "hard", () => 0);
  const hardState = hero.createCombatStateFromHero(baseHero, hardEncounter);
  const hardStatRolls = [0, 0, 0.4, 0.8, 0.99];
  const hardSplitStatsEncounter = hero.createArenaRandomEnemyEncounter(1, "hard", () => hardStatRolls.shift() ?? 0.99);
  const hardSplitStatsState = hero.createCombatStateFromHero(baseHero, hardSplitStatsEncounter);
  const variantEncounter = { ...randomEncounter, backgroundVariantId: "variant-2" };
  const variantState = hero.createCombatStateFromHero(baseHero, variantEncounter);

  assert.equal(randomEncounter.kind, "random");
  assert.equal(randomEncounter.name, "Grubbo");
  assert.equal(randomState.encounter?.id, "random:dust_arena_brawler");
  assert.equal(randomState.encounter?.kind, "random");
  assert.equal(variantState.encounter?.backgroundVariantId, "variant-2");
  assert.equal(randomState.enemy.name, randomEncounter.name);
  assert.equal(randomState.enemy.equipment?.weaponMain, "weapon_sword_01");
  assert.equal(randomState.enemy.shurikenItemId, "generated_equipment_weapon_shuriken_01");
  assert.equal(randomState.enemy.shurikenCount, 1);
  assert.equal(randomState.enemy.shurikenDamage, 2);

  assert.equal(easyEncounter.kind, "random");
  assert.equal(easyEncounter.name, "Grubbo");
  assert.equal(easyState.encounter?.id, "random:dust_arena_dummy");
  assert.equal(easyState.enemy.name, easyEncounter.name);
  assert.equal(easyState.enemy.maxArmor, 0);
  assert.equal(easyState.enemy.maxHp, 10);
  assert.equal(easyState.enemy.shurikenCount, 0);
  assert.equal(easyState.enemy.shurikenItemId, undefined);
  assert.deepEqual(Object.values(easyState.enemy.equipment ?? {}), Object.values(hero.createDefaultHeroEquipment()));
  easyState.result = "win";
  assert.equal(hero.getBattleReward(easyState).gold, 4);
  assert.equal(hero.getBattleReward(easyState).xp, 4);
  easyState.result = "lose";
  assert.equal(hero.getBattleReward(easyState).gold, 1);
  assert.equal(hero.getBattleReward(easyState).xp, 1);

  assert.equal(hardEncounter.kind, "random");
  assert.equal(hardEncounter.name, "Grubbo");
  assert.equal(hardState.encounter?.id, "random:dust_arena_veteran");
  assert.equal(hardState.enemy.name, hardEncounter.name);
  assert.equal(
    Object.values(hardState.enemy.equipment ?? {}).some((itemId) => Boolean(itemId && hero.HERO_ITEM_CATALOG[itemId]?.rarity === "uncommon")),
    true,
  );
  assert.equal(hardSplitStatsState.enemy.maxHp, 11);
  assert.equal(hardSplitStatsState.enemy.maxStamina, 11);
  assert.equal(hardSplitStatsState.enemy.meleeDamagePercentBonus, 0.05);
  assert.equal(hardSplitStatsState.enemy.movementDistanceBonus, 0.015);
  assert.equal(hero.HERO_ITEM_CATALOG[hardSplitStatsState.enemy.equipment?.weaponMain]?.rarity, "uncommon");
  hardState.result = "win";
  assert.equal(hero.getBattleReward(hardState).gold, 9);
  assert.equal(hero.getBattleReward(hardState).xp, 10);
  hardState.result = "lose";
  assert.equal(hero.getBattleReward(hardState).gold, 1);
  assert.equal(hero.getBattleReward(hardState).xp, 1);

  const bossEncounter = hero.createArenaBossEncounter("dust_arena_champion");
  const bossState = hero.createCombatStateFromHero(baseHero, bossEncounter);

  assert.equal(bossEncounter.kind, "boss");
  assert.equal(bossState.encounter?.id, "boss:dust_arena_champion");
  assert.equal(bossState.enemy.name, "Dust Arena Champion");
  assert.equal(bossState.enemy.equipment?.helmet, "generated_equipment_helmet_wood_boss_01");
  assert.equal(bossState.enemy.equipment?.weaponMain, "generated_equipment_weapon_mace_wood_boss_01");
  assert.equal(bossState.enemy.armor, 20);

  bossState.result = "win";
  assert.equal(hero.getBattleReward(bossState).gold, 14);
  assert.equal(hero.getBattleReward(bossState).xp, 12);
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
  assert.equal(combatState.enemy.spearLungeDamagePercentBonus, 0.15);
  assert.equal(combatState.enemy.movementDistanceBonus, 0.045);
  assert.equal(combatState.enemy.restHpRestoreBonus, 4);
  assert.equal(combatState.enemy.restStaminaRestoreBonus, 4);
});

test("enemy front pair armor grants half armor without changing player armor rules", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const makeEncounter = (equipment) => ({
    id: "random:test_enemy_pair_armor",
    kind: "random",
    tierId: 1,
    opponentId: "test_enemy_pair_armor",
    name: "Pair Armor Test",
    enemyLoadout: {
      equipment,
      visualPreset: { skin: 0, skinDark: 0, hair: 0 },
    },
    rewards: {
      win: { gold: 0, xp: 0 },
      loss: { gold: 0, xp: 0 },
    },
    lootTable: [],
  });

  const frontOnlyEquipment = {
    ...hero.createDefaultHeroEquipment(),
    frontWrist: "leather_front_wrist_01",
  };
  const frontOnlyState = hero.createCombatStateFromHero(baseHero, makeEncounter(frontOnlyEquipment));

  assert.equal(frontOnlyState.enemy.armor, 1);
  assert.equal(frontOnlyState.enemy.maxArmor, 1);
  assert.deepEqual(Array.from(frontOnlyState.enemy.armorSlots ?? [], (slot) => [slot.slotKey, slot.itemId, slot.label, slot.armorHp]), [
    ["frontWrist", "leather_front_wrist_01", "Leather Front Wrist 01", 1],
  ]);

  const playerFrontOnlyState = hero.createCombatStateFromHero(
    { ...baseHero, equipment: frontOnlyEquipment },
    makeEncounter(hero.createDefaultHeroEquipment()),
  );

  assert.equal(playerFrontOnlyState.player.armor, 0);
  assert.deepEqual(Array.from(playerFrontOnlyState.player.armorSlots ?? []), []);

  const matchingPairEquipment = {
    ...hero.createDefaultHeroEquipment(),
    backWrist: "leather_back_wrist_01",
    frontWrist: "leather_front_wrist_01",
  };
  const matchingPairState = hero.createCombatStateFromHero(baseHero, makeEncounter(matchingPairEquipment));

  assert.equal(matchingPairState.enemy.armor, 2);
  assert.deepEqual(Array.from(matchingPairState.enemy.armorSlots ?? [], (slot) => [slot.slotKey, slot.itemId, slot.armorHp]), [
    ["backWrist", "leather_back_wrist_01", 2],
  ]);

  const mixedPairEquipment = {
    ...hero.createDefaultHeroEquipment(),
    backWrist: "leather_back_wrist_01",
    frontWrist: "sand_front_wrist_01",
  };
  const mixedPairState = hero.createCombatStateFromHero(baseHero, makeEncounter(mixedPairEquipment));

  assert.equal(mixedPairState.enemy.armor, 3);
  assert.deepEqual(Array.from(mixedPairState.enemy.armorSlots ?? [], (slot) => [slot.slotKey, slot.itemId, slot.armorHp]), [
    ["backWrist", "leather_back_wrist_01", 2],
    ["frontWrist", "sand_front_wrist_01", 1],
  ]);
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
  assert.equal(rewardApplication.reward.gold, 14);
  assert.equal(rewardApplication.reward.xp, 12);
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

  assert.equal(emptyLootRewardApplication.reward.gold, 14);
  assert.equal(emptyLootRewardApplication.reward.xp, 12);
  assert.equal(emptyLootRewardApplication.loot.length, 0);
  assert.equal(randomCalls, 0);
});

test("boss victory unlocks the next level cap before applying boss xp", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    level: 10,
    xp: hero.getHeroXpToNextLevel(10),
    xpToNextLevel: hero.getHeroXpToNextLevel(10),
    skillPoints: 10,
  };
  const bossEncounter = hero.createArenaBossEncounter("dust_arena_champion");
  const bossState = hero.createCombatStateFromHero(baseHero, bossEncounter);

  bossState.result = "win";

  const rewardApplication = hero.applyCombatReward(baseHero, bossState, "2026-01-01T00:01:00.000Z", () => 0.999);

  assert.equal(rewardApplication.reward.xp, 12);
  assert.equal(rewardApplication.heroAfterReward.defeatedArenaBossIds.includes("dust_arena_champion"), true);
  assert.equal(hero.getHeroLevelCap(rewardApplication.heroAfterReward), 20);
  assert.equal(rewardApplication.heroAfterReward.level, 11);
  assert.equal(rewardApplication.heroAfterReward.xp, 12);
  assert.equal(rewardApplication.heroAfterReward.xpToNextLevel, hero.getHeroXpToNextLevel(11));
  assert.equal(rewardApplication.heroAfterReward.skillPoints, 11);
});

test("boss victories are recorded once in hero progression", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const firstRecord = hero.recordArenaBossDefeat(baseHero, "dust_arena_champion", "2026-01-01T00:01:00.000Z");
  const secondRecord = hero.recordArenaBossDefeat(firstRecord, "dust_arena_champion", "2026-01-01T00:02:00.000Z");

  assert.deepEqual([...firstRecord.defeatedArenaBossIds], ["dust_arena_champion"]);
  assert.equal(firstRecord.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(secondRecord, firstRecord);
});

test("hero level cap grows by ten levels for each defeated arena boss", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const tierTwoHero = hero.recordArenaBossDefeat(baseHero, "dust_arena_champion", "2026-01-01T00:01:00.000Z");
  const tierThreeHero = hero.recordArenaBossDefeat(tierTwoHero, "arena_boss_2", "2026-01-01T00:02:00.000Z");
  const fullyUnlockedHero = hero.unlockAllArenaBossTiers(baseHero, "2026-01-01T00:03:00.000Z");

  assert.equal(hero.HERO_LEVELS_PER_BOSS_TIER, 10);
  assert.equal(hero.getHeroLevelCap(baseHero), 10);
  assert.equal(hero.getHeroLevelCap(tierTwoHero), 20);
  assert.equal(hero.getHeroLevelCap(tierThreeHero), 30);
  assert.equal(hero.getHeroLevelCap(fullyUnlockedHero), hero.HERO_MAX_LEVEL);
});

test("hero can unlock all arena boss tiers", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const unlockedHero = hero.unlockAllArenaBossTiers(baseHero, "2026-01-01T00:01:00.000Z");
  const expectedBossIds = Array.from(hero.ARENA_TIER_CONFIGS, (tier) => tier.unlockBossId)
    .filter((bossId) => typeof bossId === "string");

  assert.deepEqual([...unlockedHero.defeatedArenaBossIds], expectedBossIds);
  assert.equal(unlockedHero.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(hero.unlockAllArenaBossTiers(unlockedHero, "2026-01-01T00:02:00.000Z"), unlockedHero);
});

test("hero can unlock all shop rarity tiers", () => {
  const baseHero = hero.createDefaultHero("2026-01-01T00:00:00.000Z");
  const unlockedHero = hero.unlockAllHeroShopRarities(baseHero, "2026-01-01T00:01:00.000Z");

  assert.deepEqual([...unlockedHero.unlockedShopRarities], [...hero.HERO_ITEM_RARITIES]);
  assert.deepEqual([...unlockedHero.defeatedArenaBossIds], []);
  assert.equal(hero.hasHeroUnlockedShopRarity(unlockedHero, "mythical"), true);
  assert.equal(unlockedHero.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(hero.unlockAllHeroShopRarities(unlockedHero, "2026-01-01T00:02:00.000Z"), unlockedHero);
});

test("hero level progression uses 9999 total xp across one hundred levels", () => {
  assert.equal(hero.HERO_MAX_LEVEL, 100);
  assert.equal(hero.HERO_TOTAL_XP_TO_MAX_LEVEL, 9999);
  assert.equal(hero.HERO_XP_TO_NEXT_LEVEL_BY_LEVEL.length, 99);
  assert.equal(
    hero.HERO_XP_TO_NEXT_LEVEL_BY_LEVEL.reduce((total, xp) => total + xp, 0),
    9999,
  );

  assert.equal(hero.getHeroXpToNextLevel(1), 20);
  assert.equal(hero.getHeroXpToNextLevel(5), 30);
  assert.equal(hero.getHeroXpToNextLevel(15), 40);
  assert.equal(hero.getHeroXpToNextLevel(33), 50);
  assert.equal(hero.getHeroXpToNextLevel(45), 80);
  assert.equal(hero.getHeroXpToNextLevel(60), 110);
  assert.equal(hero.getHeroXpToNextLevel(80), 170);
  assert.equal(hero.getHeroXpToNextLevel(95), 220);
  assert.equal(hero.getHeroXpToNextLevel(100), 229);
  assert.equal(hero.HERO_XP_TO_NEXT_LEVEL_BY_LEVEL.slice(0, 9).reduce((total, xp) => total + xp, 0), 230);
});

test("battle xp follows the level table and respects boss level gates", () => {
  const staleHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    xp: 19,
    xpToNextLevel: 100,
  };

  const levelTwoHero = hero.applyBattleReward(staleHero, { gold: 0, xp: 1 }, "2026-01-01T00:01:00.000Z");

  assert.equal(levelTwoHero.level, 2);
  assert.equal(levelTwoHero.xp, 0);
  assert.equal(levelTwoHero.xpToNextLevel, 20);
  assert.equal(levelTwoHero.skillPoints, 2);

  const cappedHero = hero.applyBattleReward(hero.createDefaultHero("2026-01-01T00:00:00.000Z"), { gold: 0, xp: 9999 });

  assert.equal(cappedHero.level, 10);
  assert.equal(cappedHero.xp, hero.getHeroXpToNextLevel(10));
  assert.equal(cappedHero.xpToNextLevel, hero.getHeroXpToNextLevel(10));
  assert.equal(cappedHero.skillPoints, 10);

  const heroAtCap = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    level: 10,
    xp: hero.getHeroXpToNextLevel(10) - 1,
    xpToNextLevel: hero.getHeroXpToNextLevel(10),
    skillPoints: 10,
  };
  const stillCappedHero = hero.applyBattleReward(heroAtCap, { gold: 0, xp: 50 }, "2026-01-01T00:02:00.000Z");

  assert.equal(stillCappedHero.level, 10);
  assert.equal(stillCappedHero.xp, hero.getHeroXpToNextLevel(10));
  assert.equal(stillCappedHero.skillPoints, 10);

  const fullyUnlockedHero = hero.unlockAllArenaBossTiers(hero.createDefaultHero("2026-01-01T00:00:00.000Z"));
  const maxHero = hero.applyBattleReward(fullyUnlockedHero, { gold: 0, xp: 9999 });

  assert.equal(maxHero.level, 100);
  assert.equal(maxHero.xp, 0);
  assert.equal(maxHero.xpToNextLevel, 229);
  assert.equal(maxHero.skillPoints, 100);
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

  assert.equal(boostedHero.skillPoints, hero.HERO_STARTING_SKILL_POINTS + 10);
  assert.equal(boostedHero.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(hero.grantHeroSkillPoints(boostedHero, 0), boostedHero);
});

test("hero can receive temporary levels", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    xp: 7,
  };
  const boostedHero = hero.grantHeroLevels(baseHero, 2, "2026-01-01T00:01:00.000Z");

  assert.equal(boostedHero.level, 3);
  assert.equal(boostedHero.xp, 0);
  assert.equal(boostedHero.xpToNextLevel, hero.getHeroXpToNextLevel(3));
  assert.equal(boostedHero.skillPoints, hero.HERO_STARTING_SKILL_POINTS + 2);
  assert.equal(boostedHero.updatedAt, "2026-01-01T00:01:00.000Z");
  assert.equal(hero.grantHeroLevels(boostedHero, 0), boostedHero);

  const maxHero = hero.grantHeroLevels(boostedHero, 100, "2026-01-01T00:02:00.000Z");

  assert.equal(maxHero.level, hero.HERO_MAX_LEVEL);
  assert.equal(maxHero.xp, 0);
  assert.equal(maxHero.skillPoints, hero.HERO_STARTING_SKILL_POINTS + hero.HERO_MAX_LEVEL - 1);
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
  assert.equal(requirementChecks[0].kind, "attribute");
  assert.equal(requirementChecks[0].attribute, "agility");
  assert.equal(requirementChecks[0].required, 5);
  assert.equal(requirementChecks[0].current, 0);
  assert.equal(
    hero.buyAndEquipHeroItems(baseHero, { itemIds: ["generated_equipment_weapon_bow_01"], price: 100 }, "2026-01-01T00:01:00.000Z"),
    baseHero,
  );

  const agileHero = {
    ...baseHero,
    baseStats: {
      ...baseHero.baseStats,
      agility: 5,
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
  assert.equal(hero.HERO_AGILITY_BOW_DAMAGE_PERCENT_BONUS, 0.05);
  assert.equal(hero.getAgilityBowDamageMultiplier(5), 1.25);
  assert.equal(hero.deriveHeroStats(nextHero).weaponDamageBonus, 6);
  assert.equal(hero.createCombatStateFromHero(nextHero).player.weaponDamageBonus, 6);
});

test("weapon level requirements block purchases until hero reaches the required level", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    level: 9,
    gold: 150,
  };
  const itemIds = ["generated_equipment_weapon_sword_top"];
  const requirementChecks = hero.getHeroItemRequirementChecks(baseHero, itemIds);

  assert.equal(hero.getHeroItemLevelRequirement(itemIds), 10);
  assert.equal(hero.canHeroEquipItems(baseHero, itemIds), false);
  assert.equal(requirementChecks.length, 1);
  assert.equal(requirementChecks[0].kind, "level");
  assert.equal(requirementChecks[0].required, 10);
  assert.equal(requirementChecks[0].current, 9);
  assert.equal(hero.buyAndEquipHeroItems(baseHero, { itemIds, price: 100 }, "2026-01-01T00:01:00.000Z"), baseHero);

  const readyHero = {
    ...baseHero,
    level: 10,
  };
  const nextHero = hero.buyAndEquipHeroItems(readyHero, { itemIds, price: 100 }, "2026-01-01T00:02:00.000Z");

  assert.equal(hero.canHeroEquipItems(readyHero, itemIds), true);
  assert.equal(nextHero.gold, 50);
  assert.equal(nextHero.equipment.weaponMain, "generated_equipment_weapon_sword_top");
  assert.equal(hero.deriveHeroStats(nextHero).damageBonus, 4);
});

test("shurikens buy as capped consumables without equipping", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    level: 5,
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

test("shuriken consumables respect level requirements before purchase", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    gold: 20,
  };

  const blockedPurchase = hero.buyAndEquipHeroItems(
    baseHero,
    { itemIds: ["generated_equipment_weapon_shuriken_01"], price: 5 },
    "2026-01-01T00:01:00.000Z",
  );

  assert.equal(hero.canHeroUseItems(baseHero, ["generated_equipment_weapon_shuriken_01"]), false);
  assert.equal(hero.canHeroEquipItems(baseHero, ["generated_equipment_weapon_shuriken_01"]), false);
  assert.equal(blockedPurchase, baseHero);
});

test("shuriken consumables share one inventory cap across item types", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    level: 30,
    gold: 40,
  };

  const commonPurchase = hero.buyAndEquipHeroItems(
    baseHero,
    { itemIds: ["generated_equipment_weapon_shuriken_01"], price: 5 },
    "2026-01-01T00:01:00.000Z",
  );
  const rarePurchase = hero.buyAndEquipHeroItems(
    commonPurchase,
    { itemIds: ["generated_equipment_weapon_shuriken_rare"], price: 10 },
    "2026-01-01T00:02:00.000Z",
  );
  const blockedPurchase = hero.buyAndEquipHeroItems(
    rarePurchase,
    { itemIds: ["generated_equipment_weapon_shuriken_01"], price: 5 },
    "2026-01-01T00:03:00.000Z",
  );

  assert.equal(hero.getHeroShurikenQuantity(rarePurchase), hero.HERO_SHURIKEN_MAX_QUANTITY);
  assert.equal(hero.getHeroItemQuantity(rarePurchase, "generated_equipment_weapon_shuriken_01"), 1);
  assert.equal(hero.getHeroItemQuantity(rarePurchase, "generated_equipment_weapon_shuriken_rare"), 1);
  assert.equal(blockedPurchase, rarePurchase);
});

test("scrolls share one capped consumable inventory pool without equipping", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    gold: 750,
  };
  const crackScrollId = hero.HERO_CRACK_ARMOR_SCROLL_ITEM_ID;
  const fireballScrollId = hero.HERO_FIREBALL_SCROLL_ITEM_ID;
  const wardScrollId = hero.HERO_WARD_SCROLL_ITEM_ID;
  const preciseStrikeScrollId = hero.HERO_PRECISE_STRIKE_SCROLL_ITEM_ID;
  const doubleStrikeScrollId = hero.HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID;
  const poisonScrollId = hero.HERO_POISON_SCROLL_ITEM_ID;
  const firstPurchase = hero.buyAndEquipHeroItems(baseHero, { itemIds: [crackScrollId], price: 30 }, "2026-01-01T00:01:00.000Z");
  const blockedAtBaseCapacity = hero.buyAndEquipHeroItems(firstPurchase, { itemIds: [fireballScrollId], price: 50 }, "2026-01-01T00:02:00.000Z");
  const firstCapacityUpgrade = hero.upgradeHeroScrollCapacity(firstPurchase, "2026-01-01T00:03:00.000Z");
  const secondPurchase = hero.buyAndEquipHeroItems(firstCapacityUpgrade, { itemIds: [fireballScrollId], price: 50 }, "2026-01-01T00:04:00.000Z");
  const secondCapacityUpgrade = hero.upgradeHeroScrollCapacity(secondPurchase, "2026-01-01T00:05:00.000Z");
  const thirdPurchase = hero.buyAndEquipHeroItems(secondCapacityUpgrade, { itemIds: [doubleStrikeScrollId], price: 30 }, "2026-01-01T00:06:00.000Z");
  const blockedPurchase = hero.buyAndEquipHeroItems(thirdPurchase, { itemIds: [wardScrollId], price: 30 }, "2026-01-01T00:04:00.000Z");

  for (const scrollItemId of [crackScrollId, fireballScrollId, doubleStrikeScrollId]) {
    assert.equal(hero.HERO_ITEM_CATALOG[scrollItemId]?.kind, "scroll");
    assert.equal(hero.areHeroItemsConsumable([scrollItemId]), true);
    assert.equal(hero.getHeroConsumableMaxQuantity(scrollItemId), hero.HERO_SCROLL_MAX_QUANTITY);
    assert.equal(hero.getHeroItemQuantity(thirdPurchase, scrollItemId), 1);
  }

  assert.equal(hero.HERO_ITEM_CATALOG[wardScrollId]?.kind, "scroll");
  assert.equal(hero.HERO_ITEM_CATALOG[preciseStrikeScrollId]?.kind, "scroll");
  assert.equal(hero.HERO_ITEM_CATALOG[poisonScrollId]?.kind, "scroll");
  assert.equal(hero.getHeroItemQuantity(thirdPurchase, wardScrollId), 0);
  assert.equal(hero.getHeroItemQuantity(thirdPurchase, poisonScrollId), 0);
  assert.equal(hero.getHeroScrollCapacity(baseHero), 1);
  assert.equal(hero.getHeroScrollCapacity(firstPurchase), 1);
  assert.equal(blockedAtBaseCapacity, firstPurchase);
  assert.equal(hero.getHeroScrollCapacity(firstCapacityUpgrade), 2);
  assert.equal(hero.getHeroScrollCapacity(secondCapacityUpgrade), 3);
  assert.equal(thirdPurchase.gold, 40);
  assert.equal(thirdPurchase.equipment.weaponMain, null);
  assert.equal(hero.getHeroScrollQuantity(thirdPurchase), 3);
  assert.equal(hero.getHeroRemainingScrollCapacity(thirdPurchase), 0);
  assert.equal(blockedPurchase, thirdPurchase);
});

test("scroll capacity upgrades from one to five with rising prices", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    gold: 5000,
  };
  const upgradedToTwo = hero.upgradeHeroScrollCapacity(baseHero, "2026-01-01T00:01:00.000Z");
  const upgradedToThree = hero.upgradeHeroScrollCapacity(upgradedToTwo, "2026-01-01T00:02:00.000Z");
  const upgradedToFour = hero.upgradeHeroScrollCapacity(upgradedToThree, "2026-01-01T00:03:00.000Z");
  const upgradedToFive = hero.upgradeHeroScrollCapacity(upgradedToFour, "2026-01-01T00:04:00.000Z");
  const blockedAtMax = hero.upgradeHeroScrollCapacity(upgradedToFive, "2026-01-01T00:05:00.000Z");

  assert.equal(hero.getHeroScrollCapacity(baseHero), hero.HERO_SCROLL_CAPACITY_BASE);
  assert.equal(hero.getHeroScrollCapacityUpgradePrice(baseHero), 100);
  assert.equal(hero.getHeroScrollCapacity(upgradedToTwo), 2);
  assert.equal(upgradedToTwo.gold, 4900);
  assert.equal(hero.getHeroScrollCapacityUpgradePrice(upgradedToTwo), 500);
  assert.equal(hero.getHeroScrollCapacity(upgradedToThree), 3);
  assert.equal(upgradedToThree.gold, 4400);
  assert.equal(hero.getHeroScrollCapacityUpgradePrice(upgradedToThree), 1000);
  assert.equal(hero.getHeroScrollCapacity(upgradedToFour), 4);
  assert.equal(upgradedToFour.gold, 3400);
  assert.equal(hero.getHeroScrollCapacityUpgradePrice(upgradedToFour), 2000);
  assert.equal(hero.getHeroScrollCapacity(upgradedToFive), hero.HERO_SCROLL_CAPACITY_MAX);
  assert.equal(upgradedToFive.gold, 1400);
  assert.equal(hero.getHeroScrollCapacityUpgradePrice(upgradedToFive), undefined);
  assert.equal(blockedAtMax, upgradedToFive);
  assert.equal(hero.canUpgradeHeroScrollCapacity({ ...baseHero, gold: 99 }), false);
});

test("precise and double strike scroll upgrades change rarity prices and combat effects", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    gold: 1000,
  };
  const preciseStrikeScrollId = hero.HERO_PRECISE_STRIKE_SCROLL_ITEM_ID;
  const doubleStrikeScrollId = hero.HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID;

  assert.equal(hero.getHeroScrollUpgradeRarityForItem(baseHero, preciseStrikeScrollId), "common");
  assert.equal(hero.getHeroScrollPurchasePrice(baseHero, preciseStrikeScrollId), 30);
  assert.equal(hero.getHeroScrollUpgradePrice(baseHero, preciseStrikeScrollId), 150);
  assert.equal(hero.getHeroPreciseStrikeBlockChanceReduction(baseHero), 0.1);
  assert.equal(hero.getHeroDoubleStrikeDamageMultiplier(baseHero), 0.4);

  const upgradedPrecise = hero.upgradeHeroScroll(baseHero, preciseStrikeScrollId, "2026-01-01T00:01:00.000Z");
  const upgradedDouble = hero.upgradeHeroScroll(upgradedPrecise, doubleStrikeScrollId, "2026-01-01T00:02:00.000Z");
  const combatState = hero.createCombatStateFromHero(upgradedDouble, 1);

  assert.equal(upgradedPrecise.gold, 850);
  assert.equal(hero.getHeroScrollUpgradeRarityForItem(upgradedPrecise, preciseStrikeScrollId), "uncommon");
  assert.equal(hero.getHeroScrollPurchasePrice(upgradedPrecise, preciseStrikeScrollId), 60);
  assert.equal(hero.getHeroPreciseStrikeBlockChanceReduction(upgradedPrecise), 0.15);
  assert.equal(upgradedDouble.gold, 650);
  assert.equal(hero.getHeroScrollUpgradeRarityForItem(upgradedDouble, doubleStrikeScrollId), "uncommon");
  assert.equal(hero.getHeroScrollPurchasePrice(upgradedDouble, doubleStrikeScrollId), 75);
  assert.equal(hero.getHeroDoubleStrikeDamageMultiplier(upgradedDouble), 0.55);
  assert.equal(combatState.player.preciseStrikeBlockChanceReduction, 0.15);
  assert.equal(combatState.player.doubleStrikeDamageMultiplier, 0.55);
});

test("fireball and poison scroll upgrades change rarity prices and combat effects", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    gold: 1000,
  };
  const fireballScrollId = hero.HERO_FIREBALL_SCROLL_ITEM_ID;
  const poisonScrollId = hero.HERO_POISON_SCROLL_ITEM_ID;

  assert.equal(hero.getHeroScrollUpgradeRarityForItem(baseHero, fireballScrollId), "common");
  assert.equal(hero.getHeroScrollPurchasePrice(baseHero, fireballScrollId), 50);
  assert.equal(hero.getHeroScrollUpgradePrice(baseHero, fireballScrollId), 250);
  assert.equal(hero.getHeroFireballDamage(baseHero), 30);
  assert.equal(hero.getHeroScrollPurchasePrice(baseHero, poisonScrollId), 35);
  assert.equal(hero.getHeroScrollUpgradePrice(baseHero, poisonScrollId), 200);
  assert.equal(hero.getHeroPoisonDamage(baseHero), 5);

  const upgradedFireball = hero.upgradeHeroScroll(baseHero, fireballScrollId, "2026-01-01T00:01:00.000Z");
  const upgradedPoison = hero.upgradeHeroScroll(upgradedFireball, poisonScrollId, "2026-01-01T00:02:00.000Z");
  const combatState = hero.createCombatStateFromHero(upgradedPoison, 1);

  assert.equal(upgradedFireball.gold, 750);
  assert.equal(hero.getHeroScrollUpgradeRarityForItem(upgradedFireball, fireballScrollId), "uncommon");
  assert.equal(hero.getHeroScrollPurchasePrice(upgradedFireball, fireballScrollId), 90);
  assert.equal(hero.getHeroFireballDamage(upgradedFireball), 80);
  assert.equal(upgradedPoison.gold, 550);
  assert.equal(hero.getHeroScrollUpgradeRarityForItem(upgradedPoison, poisonScrollId), "uncommon");
  assert.equal(hero.getHeroScrollPurchasePrice(upgradedPoison, poisonScrollId), 75);
  assert.equal(hero.getHeroPoisonDamage(upgradedPoison), 6);
  assert.equal(combatState.player.fireballDamage, 80);
  assert.equal(combatState.player.poisonDamage, 6);
});

test("armor crack and ward scroll upgrades change rarity prices and combat effects", () => {
  const baseHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    gold: 1000,
  };
  const crackArmorScrollId = hero.HERO_CRACK_ARMOR_SCROLL_ITEM_ID;
  const wardScrollId = hero.HERO_WARD_SCROLL_ITEM_ID;

  assert.equal(hero.getHeroScrollUpgradeRarityForItem(baseHero, crackArmorScrollId), "common");
  assert.equal(hero.getHeroScrollPurchasePrice(baseHero, crackArmorScrollId), 30);
  assert.equal(hero.getHeroScrollUpgradePrice(baseHero, crackArmorScrollId), 400);
  assert.equal(hero.getHeroCrackArmorParts(baseHero), 1);
  assert.equal(hero.getHeroScrollPurchasePrice(baseHero, wardScrollId), 30);
  assert.equal(hero.getHeroScrollUpgradePrice(baseHero, wardScrollId), 250);
  assert.equal(hero.getHeroWardHitCount(baseHero), 1);

  const upgradedCrackArmor = hero.upgradeHeroScroll(baseHero, crackArmorScrollId, "2026-01-01T00:01:00.000Z");
  const upgradedWard = hero.upgradeHeroScroll(upgradedCrackArmor, wardScrollId, "2026-01-01T00:02:00.000Z");
  const combatState = hero.createCombatStateFromHero(upgradedWard, 1);

  assert.equal(upgradedCrackArmor.gold, 600);
  assert.equal(hero.getHeroScrollUpgradeRarityForItem(upgradedCrackArmor, crackArmorScrollId), "uncommon");
  assert.equal(hero.getHeroScrollPurchasePrice(upgradedCrackArmor, crackArmorScrollId), 120);
  assert.equal(hero.getHeroCrackArmorParts(upgradedCrackArmor), 2);
  assert.equal(upgradedWard.gold, 350);
  assert.equal(hero.getHeroScrollUpgradeRarityForItem(upgradedWard, wardScrollId), "uncommon");
  assert.equal(hero.getHeroScrollPurchasePrice(upgradedWard, wardScrollId), 90);
  assert.equal(hero.getHeroWardHitCount(upgradedWard), 2);
  assert.equal(combatState.player.crackArmorParts, 2);
  assert.equal(combatState.player.wardHitCount, 2);
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

test("combat state uses the strongest owned shuriken consumable", () => {
  const stockedHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    inventory: [
      { itemId: "generated_equipment_weapon_shuriken_01", quantity: 2 },
      { itemId: "generated_equipment_weapon_shuriken_rare", quantity: 1 },
    ],
  };
  const combatState = hero.createCombatStateFromHero(stockedHero, 1);

  assert.equal(combatState.player.shurikenCount, 1);
  assert.equal(combatState.player.shurikenDamage, 7);
  assert.equal(combatState.player.shurikenItemId, "generated_equipment_weapon_shuriken_rare");

  const spentCombatState = {
    ...combatState,
    result: "lose",
    player: {
      ...combatState.player,
      shurikenCount: 0,
    },
  };
  const rewardApplication = hero.applyCombatReward(stockedHero, spentCombatState, "2026-01-01T00:01:00.000Z", () => 0.99);

  assert.equal(hero.getHeroItemQuantity(rewardApplication.heroAfterReward, "generated_equipment_weapon_shuriken_01"), 2);
  assert.equal(hero.getHeroItemQuantity(rewardApplication.heroAfterReward, "generated_equipment_weapon_shuriken_rare"), 0);
});

test("combat state exposes scroll count and rewards persist spent scrolls", () => {
  const scrollItemId = hero.HERO_CRACK_ARMOR_SCROLL_ITEM_ID;
  const stockedHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    inventory: [{ itemId: scrollItemId, quantity: 2 }],
  };
  const combatState = hero.createCombatStateFromHero(stockedHero, 1);

  assert.equal(combatState.player.scrollCount, 2);
  assert.equal(combatState.player.scrollItemId, scrollItemId);

  const spentCombatState = {
    ...combatState,
    result: "lose",
    player: {
      ...combatState.player,
      scrollCount: 1,
    },
  };
  const rewardApplication = hero.applyCombatReward(stockedHero, spentCombatState, "2026-01-01T00:01:00.000Z", () => 0.99);

  assert.equal(hero.getHeroItemQuantity(rewardApplication.heroAfterReward, scrollItemId), 1);
});

test("combat state exposes fireball scroll count and rewards persist spent fireball scrolls", () => {
  const scrollItemId = hero.HERO_FIREBALL_SCROLL_ITEM_ID;
  const stockedHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    inventory: [{ itemId: scrollItemId, quantity: 2 }],
  };
  const combatState = hero.createCombatStateFromHero(stockedHero, 1);

  assert.equal(combatState.player.fireballScrollCount, 2);
  assert.equal(combatState.player.fireballScrollItemId, scrollItemId);
  assert.equal(combatState.player.fireballDamage, 30);

  const spentCombatState = {
    ...combatState,
    result: "lose",
    player: {
      ...combatState.player,
      fireballScrollCount: 1,
    },
  };
  const rewardApplication = hero.applyCombatReward(stockedHero, spentCombatState, "2026-01-01T00:01:00.000Z", () => 0.99);

  assert.equal(hero.getHeroItemQuantity(rewardApplication.heroAfterReward, scrollItemId), 1);
});

test("combat state exposes ward scroll count and rewards persist spent ward scrolls", () => {
  const scrollItemId = hero.HERO_WARD_SCROLL_ITEM_ID;
  const stockedHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    inventory: [{ itemId: scrollItemId, quantity: 2 }],
  };
  const combatState = hero.createCombatStateFromHero(stockedHero, 1);

  assert.equal(combatState.player.wardScrollCount, 2);
  assert.equal(combatState.player.wardScrollItemId, scrollItemId);
  assert.equal(combatState.player.wardHits, 0);

  const spentCombatState = {
    ...combatState,
    result: "lose",
    player: {
      ...combatState.player,
      wardScrollCount: 1,
      wardHits: 1,
    },
  };
  const rewardApplication = hero.applyCombatReward(stockedHero, spentCombatState, "2026-01-01T00:01:00.000Z", () => 0.99);

  assert.equal(hero.getHeroItemQuantity(rewardApplication.heroAfterReward, scrollItemId), 1);
});

test("combat state exposes precise strike scroll count and rewards persist spent precise strike scrolls", () => {
  const scrollItemId = hero.HERO_PRECISE_STRIKE_SCROLL_ITEM_ID;
  const stockedHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    inventory: [{ itemId: scrollItemId, quantity: 2 }],
  };
  const combatState = hero.createCombatStateFromHero(stockedHero, 1);

  assert.equal(combatState.player.preciseStrikeScrollCount, 2);
  assert.equal(combatState.player.preciseStrikeScrollItemId, scrollItemId);
  assert.equal(combatState.player.preciseStrikeHits, 0);

  const spentCombatState = {
    ...combatState,
    result: "win",
    player: {
      ...combatState.player,
      preciseStrikeScrollCount: 1,
      preciseStrikeHits: 1,
    },
  };
  const rewardApplication = hero.applyCombatReward(stockedHero, spentCombatState, "2026-01-01T00:01:00.000Z", () => 0.99);

  assert.equal(hero.getHeroItemQuantity(rewardApplication.heroAfterReward, scrollItemId), 1);
});

test("combat state exposes double strike scroll count and rewards persist spent double strike scrolls", () => {
  const scrollItemId = hero.HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID;
  const stockedHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    inventory: [{ itemId: scrollItemId, quantity: 2 }],
  };
  const combatState = hero.createCombatStateFromHero(stockedHero, 1);

  assert.equal(combatState.player.doubleStrikeScrollCount, 2);
  assert.equal(combatState.player.doubleStrikeScrollItemId, scrollItemId);
  assert.equal(combatState.player.doubleStrikeHits, 0);

  const spentCombatState = {
    ...combatState,
    result: "win",
    player: {
      ...combatState.player,
      doubleStrikeScrollCount: 1,
      doubleStrikeHits: 1,
    },
  };
  const rewardApplication = hero.applyCombatReward(stockedHero, spentCombatState, "2026-01-01T00:01:00.000Z", () => 0.99);

  assert.equal(hero.getHeroItemQuantity(rewardApplication.heroAfterReward, scrollItemId), 1);
});

test("combat state exposes poison scroll count and rewards persist spent poison scrolls", () => {
  const scrollItemId = hero.HERO_POISON_SCROLL_ITEM_ID;
  const stockedHero = {
    ...hero.createDefaultHero("2026-01-01T00:00:00.000Z"),
    inventory: [{ itemId: scrollItemId, quantity: 2 }],
  };
  const combatState = hero.createCombatStateFromHero(stockedHero, 1);

  assert.equal(combatState.player.poisonScrollCount, 2);
  assert.equal(combatState.player.poisonScrollItemId, scrollItemId);
  assert.equal(combatState.player.poisonDamage, 5);
  assert.equal(combatState.player.poisonTurns, 0);

  const spentCombatState = {
    ...combatState,
    result: "win",
    player: {
      ...combatState.player,
      poisonScrollCount: 1,
    },
    enemy: {
      ...combatState.enemy,
      poisonTurns: 1,
    },
  };
  const rewardApplication = hero.applyCombatReward(stockedHero, spentCombatState, "2026-01-01T00:01:00.000Z", () => 0.99);

  assert.equal(hero.getHeroItemQuantity(rewardApplication.heroAfterReward, scrollItemId), 1);
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
