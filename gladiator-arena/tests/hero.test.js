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
};
const hero = loadTypeScriptModule("../src/hero.ts", {
  require: (id) => {
    if (id === "./combat") {
      return combat;
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

  const maxHero = hero.applyBattleReward(hero.createDefaultHero("2026-01-01T00:00:00.000Z"), { gold: 0, xp: 1000 });

  assert.equal(maxHero.level, 50);
  assert.equal(maxHero.xp, 0);
  assert.equal(maxHero.xpToNextLevel, 30);
});

test("battle rewards use small early arena numbers", () => {
  const winState = combat.freshState();
  winState.result = "win";
  const winReward = hero.getBattleReward(winState);

  assert.equal(winReward.gold, 5);
  assert.equal(winReward.xp, 10);

  const loseState = combat.freshState();
  loseState.result = "lose";
  const lossReward = hero.getBattleReward(loseState);

  assert.equal(lossReward.gold, 1);
  assert.equal(lossReward.xp, 2);

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
