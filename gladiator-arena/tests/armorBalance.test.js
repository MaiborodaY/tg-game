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

const armorBalance = loadTypeScriptModule("../src/armorBalance.ts");

test("armor balance slot weights are the single source of truth", () => {
  assert.deepEqual(toPlainObject(armorBalance.ARMOR_SLOT_WEIGHTS), {
    breastplate: 25,
    helmet: 15,
    shoulders: 11,
    greaves: 11,
    shinguards: 11,
    gloves: 9,
    boots: 9,
    wrists: 9,
  });
  assert.equal(Object.values(armorBalance.ARMOR_SLOT_WEIGHTS).reduce((total, weight) => total + weight, 0), 100);
});

test("armor balance stores the shop breastplate progression table", () => {
  assert.deepEqual(toPlainObject(armorBalance.ARMOR_SHOP_BREASTPLATE_ARMOR), {
    common: { low: 3, mid: 4, high: 5 },
    uncommon: { low: 8, mid: 10, high: 11 },
    rare: { low: 12, mid: 14, high: 16 },
    epic: { low: 20, mid: 23, high: 26 },
    legendary: { low: 32, mid: 36, high: 40 },
    mythical: { low: 48, mid: 48, high: 48 },
  });
  assert.equal(armorBalance.getArmorShopSetBreastplateArmor("uncommon", "low"), 8);
  assert.equal(armorBalance.getArmorShopSetBreastplateArmor("mythical", "high"), 48);
});

test("armor balance stores the named late-game shop set curve", () => {
  assert.deepEqual(toPlainObject(armorBalance.ARMOR_SHOP_SET_BREASTPLATE_ARMOR), {
    rust_champion: { rarity: "rare", grade: "low", breastplateArmor: 12 },
    mercenary: { rarity: "rare", grade: "mid", breastplateArmor: 14 },
    executioner: { rarity: "rare", grade: "high", breastplateArmor: 16 },
    lazure: { rarity: "epic", grade: "low", breastplateArmor: 20 },
    lion: { rarity: "epic", grade: "mid", breastplateArmor: 23 },
    stormguard: { rarity: "epic", grade: "high", breastplateArmor: 26 },
    viper: { rarity: "legendary", grade: "low", breastplateArmor: 32 },
    bone: { rarity: "legendary", grade: "mid", breastplateArmor: 36 },
    cathedral: { rarity: "legendary", grade: "high", breastplateArmor: 40 },
    druid: { rarity: "mythical", grade: "high", breastplateArmor: 48 },
  });
  assert.equal(armorBalance.getNamedArmorShopSetBreastplateArmor("lion"), 23);
  assert.equal(armorBalance.getNamedArmorShopSetTotalPrice("druid"), 480);
});

test("armor balance derives shop set prices from breastplate armor", () => {
  assert.equal(armorBalance.ARMOR_SHOP_PRICE_PER_BREASTPLATE_ARMOR, 10);
  assert.deepEqual(toPlainObject(armorBalance.ARMOR_PRICE_SLOT_WEIGHTS), toPlainObject(armorBalance.ARMOR_SLOT_WEIGHTS));
  assert.equal(armorBalance.getArmorShopSetTotalPrice("common", "low"), 30);
  assert.equal(armorBalance.getArmorShopSetTotalPrice("common", "high"), 50);
  assert.equal(armorBalance.getArmorShopSetTotalPrice("uncommon", "low"), 80);
  assert.equal(armorBalance.getArmorShopSetTotalPrice("mythical", "high"), 480);
});

test("starter armor prices use the same slot weights", () => {
  const priceSet = armorBalance.deriveArmorSetPricesFromBreastplateArmor(3);

  assert.deepEqual(toPlainObject(priceSet), {
    breastplate: 8,
    helmet: 4,
    shoulders: 3,
    greaves: 3,
    shinguards: 3,
    gloves: 3,
    boots: 3,
    wrists: 3,
  });
  assert.equal(armorBalance.getArmorPriceSetTotal(priceSet), 30);
});

test("better common armor prices keep the exact set total", () => {
  const priceSet = armorBalance.deriveArmorSetPricesFromBreastplateArmor(5);

  assert.deepEqual(toPlainObject(priceSet), {
    breastplate: 13,
    helmet: 8,
    shoulders: 6,
    greaves: 6,
    shinguards: 5,
    gloves: 4,
    boots: 4,
    wrists: 4,
  });
  assert.equal(armorBalance.getArmorPriceSetTotal(priceSet), 50);
});

test("starter armor can be derived from breastplate armor", () => {
  const armorSet = armorBalance.deriveArmorSetFromBreastplateArmor(3);

  assert.deepEqual(toPlainObject(armorSet), {
    breastplate: 3,
    helmet: 2,
    shoulders: 1,
    greaves: 1,
    shinguards: 1,
    gloves: 1,
    boots: 1,
    wrists: 1,
  });
  assert.equal(armorBalance.getArmorSetTotal(armorSet), 11);
});

test("better common armor can be derived from breastplate armor", () => {
  const armorSet = armorBalance.deriveArmorSetFromBreastplateArmor(5);

  assert.deepEqual(toPlainObject(armorSet), {
    breastplate: 5,
    helmet: 3,
    shoulders: 2,
    greaves: 2,
    shinguards: 2,
    gloves: 2,
    boots: 2,
    wrists: 2,
  });
  assert.equal(armorBalance.getArmorSetTotal(armorSet), 20);
});

test("uncommon armor sets derive from the progression table", () => {
  const lowArmorSet = armorBalance.deriveArmorSetFromBreastplateArmor(armorBalance.getArmorShopSetBreastplateArmor("uncommon", "low"));
  const highArmorSet = armorBalance.deriveArmorSetFromBreastplateArmor(armorBalance.getArmorShopSetBreastplateArmor("uncommon", "high"));

  assert.deepEqual(toPlainObject(lowArmorSet), {
    breastplate: 8,
    helmet: 5,
    shoulders: 4,
    greaves: 4,
    shinguards: 4,
    gloves: 3,
    boots: 3,
    wrists: 3,
  });
  assert.equal(armorBalance.getArmorSetTotal(lowArmorSet), 34);
  assert.deepEqual(toPlainObject(highArmorSet), {
    breastplate: 11,
    helmet: 7,
    shoulders: 5,
    greaves: 5,
    shinguards: 5,
    gloves: 4,
    boots: 4,
    wrists: 4,
  });
  assert.equal(armorBalance.getArmorSetTotal(highArmorSet), 45);
});

test("armor balance maps paired armor to primary and mirror equipment slots", () => {
  assert.equal(armorBalance.ARMOR_BALANCE_PRIMARY_EQUIPMENT_SLOTS.shoulders, "backShoulderguard");
  assert.equal(armorBalance.ARMOR_BALANCE_MIRROR_EQUIPMENT_SLOTS.shoulders, "frontShoulderguard");
  assert.equal(armorBalance.ARMOR_BALANCE_PRIMARY_EQUIPMENT_SLOTS.breastplate, "breastplate");
  assert.equal(armorBalance.ARMOR_BALANCE_MIRROR_EQUIPMENT_SLOTS.breastplate, undefined);
});

test("armor balance does not depend on generated equipment files", () => {
  const source = readFileSync(fileURLToPath(new URL("../src/armorBalance.ts", import.meta.url)), "utf8");

  assert.equal(source.includes("equipmentItems.generated"), false);
});

function toPlainObject(value) {
  return JSON.parse(JSON.stringify(value));
}
