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
const hero = loadTypeScriptModule("../src/hero.ts", {
  require: (id) => {
    if (id === "./combat") {
      return combat;
    }

    if (id === "./generated/equipmentItems.generated") {
      return {
        GENERATED_EQUIPMENT_ITEM_CATALOG: {},
        GENERATED_EQUIPMENT_ITEM_IDS: [],
      };
    }

    throw new Error(`Unsupported test import: ${id}`);
  },
});

test("cloth breastplate is cataloged but not starter inventory", () => {
  assert.equal(hero.HERO_ITEM_IDS.includes(hero.CLOTH_BREASTPLATE_ID), true);
  assert.equal(hero.HERO_ITEM_CATALOG[hero.STARTER_BREASTPLATE_ID]?.name, "Leather Breastplate");
  assert.equal(hero.HERO_ITEM_CATALOG[hero.CLOTH_BREASTPLATE_ID]?.name, "Cloth Breastplate");
  assert.equal(hero.HERO_ITEM_CATALOG[hero.CLOTH_BREASTPLATE_ID]?.equipmentSlot, "breastplate");

  const starterItemIds = hero.createStarterHeroInventory().map((entry) => entry.itemId);

  assert.equal(starterItemIds.includes(hero.STARTER_BREASTPLATE_ID), true);
  assert.equal(starterItemIds.includes(hero.CLOTH_BREASTPLATE_ID), false);
});

test("hero equipment has empty glove slots separate from wrists", () => {
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("backWrist"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("frontWrist"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("backGlove"), true);
  assert.equal(hero.HERO_EQUIPMENT_SLOT_KEYS.includes("frontGlove"), true);

  assert.equal(hero.createStarterHeroEquipment().backWrist, hero.STARTER_BACK_WRIST_ID);
  assert.equal(hero.createStarterHeroEquipment().frontWrist, hero.STARTER_FRONT_WRIST_ID);
  assert.equal(hero.createDefaultHeroEquipment().backGlove, null);
  assert.equal(hero.createDefaultHeroEquipment().frontGlove, null);
  assert.equal(hero.createStarterHeroEquipment().backGlove, null);
  assert.equal(hero.createStarterHeroEquipment().frontGlove, null);
});

test("weapon class defaults to sword and can be inferred for generated weapons", () => {
  assert.equal(hero.HERO_ITEM_CATALOG[hero.TRAINING_WEAPON_ID]?.weaponClass, "sword");
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
