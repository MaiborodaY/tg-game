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
    breastplate: 30,
    helmet: 20,
    shoulders: 11,
    greaves: 11,
    shinguards: 11,
    gloves: 5,
    boots: 6,
    wrists: 6,
  });
  assert.equal(Object.values(armorBalance.ARMOR_SLOT_WEIGHTS).reduce((total, weight) => total + weight, 0), 100);
});

test("armor balance stores the shop breastplate progression table", () => {
  assert.deepEqual(toPlainObject(armorBalance.ARMOR_SHOP_BREASTPLATE_ARMOR), {
    common: { low: 3, high: 5 },
    uncommon: { low: 8, high: 11 },
    rare: { low: 15, high: 20 },
    epic: { low: 25, high: 30 },
    legendary: { low: 38, high: 48 },
    mythical: { low: 60, high: 75 },
  });
  assert.equal(armorBalance.getArmorShopSetBreastplateArmor("uncommon", "low"), 8);
  assert.equal(armorBalance.getArmorShopSetBreastplateArmor("mythical", "high"), 75);
});

test("armor balance derives shop set prices from breastplate armor", () => {
  assert.equal(armorBalance.ARMOR_SHOP_PRICE_PER_BREASTPLATE_ARMOR, 10);
  assert.deepEqual(toPlainObject(armorBalance.ARMOR_PRICE_SLOT_WEIGHTS), toPlainObject(armorBalance.ARMOR_SLOT_WEIGHTS));
  assert.equal(armorBalance.getArmorShopSetTotalPrice("common", "low"), 30);
  assert.equal(armorBalance.getArmorShopSetTotalPrice("common", "high"), 50);
  assert.equal(armorBalance.getArmorShopSetTotalPrice("uncommon", "low"), 80);
  assert.equal(armorBalance.getArmorShopSetTotalPrice("mythical", "high"), 750);
});

test("starter armor prices use the same slot weights", () => {
  const priceSet = armorBalance.deriveArmorSetPricesFromBreastplateArmor(3);

  assert.deepEqual(toPlainObject(priceSet), {
    breastplate: 9,
    helmet: 6,
    shoulders: 3,
    greaves: 3,
    shinguards: 3,
    gloves: 2,
    boots: 2,
    wrists: 2,
  });
  assert.equal(armorBalance.getArmorPriceSetTotal(priceSet), 30);
});

test("better common armor prices keep the exact set total", () => {
  const priceSet = armorBalance.deriveArmorSetPricesFromBreastplateArmor(5);

  assert.deepEqual(toPlainObject(priceSet), {
    breastplate: 15,
    helmet: 10,
    shoulders: 6,
    greaves: 6,
    shinguards: 5,
    gloves: 2,
    boots: 3,
    wrists: 3,
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

test("better early armor can use a higher slot floor", () => {
  const armorSet = armorBalance.deriveArmorSetFromBreastplateArmor(5, { minimumArmorPerSlot: 2, rounding: "ceil" });

  assert.deepEqual(toPlainObject(armorSet), {
    breastplate: 5,
    helmet: 4,
    shoulders: 2,
    greaves: 2,
    shinguards: 2,
    gloves: 2,
    boots: 2,
    wrists: 2,
  });
  assert.equal(armorBalance.getArmorSetTotal(armorSet), 21);
});

test("uncommon armor sets derive from the progression table", () => {
  const lowArmorSet = armorBalance.deriveArmorSetFromBreastplateArmor(armorBalance.getArmorShopSetBreastplateArmor("uncommon", "low"));
  const highArmorSet = armorBalance.deriveArmorSetFromBreastplateArmor(armorBalance.getArmorShopSetBreastplateArmor("uncommon", "high"));

  assert.deepEqual(toPlainObject(lowArmorSet), {
    breastplate: 8,
    helmet: 5,
    shoulders: 3,
    greaves: 3,
    shinguards: 3,
    gloves: 1,
    boots: 2,
    wrists: 2,
  });
  assert.equal(armorBalance.getArmorSetTotal(lowArmorSet), 27);
  assert.deepEqual(toPlainObject(highArmorSet), {
    breastplate: 11,
    helmet: 7,
    shoulders: 4,
    greaves: 4,
    shinguards: 4,
    gloves: 2,
    boots: 2,
    wrists: 2,
  });
  assert.equal(armorBalance.getArmorSetTotal(highArmorSet), 36);
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
