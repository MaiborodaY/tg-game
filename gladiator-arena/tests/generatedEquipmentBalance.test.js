import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const generatedItems = JSON.parse(readFileSync(resolve(currentDir, "../src/generated/equipmentItems.generated.json"), "utf8"));

test("generated shop armor sets occupy their intended progression", () => {
  assertGeneratedArmorSet("leather", {
    rarity: "uncommon",
    armor: 34,
    price: 80,
  });
  assertGeneratedArmorSet("chainmail", {
    rarity: "uncommon",
    armor: 45,
    price: 110,
  });
  assertGeneratedArmorSet("rust_champion", {
    rarity: "rare",
    armor: 46,
    price: 120,
  });
  assertGeneratedArmorSet("mercenary", {
    rarity: "rare",
    armor: 55,
    price: 140,
  });
  assertGeneratedArmorSet("executioner", {
    rarity: "rare",
    armor: 65,
    price: 160,
  });
  assertGeneratedArmorSet("lazure", {
    rarity: "epic",
    armor: 80,
    price: 200,
  });
  assertGeneratedArmorSet("lion", {
    rarity: "epic",
    armor: 91,
    price: 230,
  });
  assertGeneratedArmorSet("stormguard", {
    rarity: "epic",
    armor: 102,
    price: 260,
  });
  assertGeneratedArmorSet("viper", {
    rarity: "legendary",
    armor: 129,
    price: 320,
  });
  assertGeneratedArmorSet("bone", {
    rarity: "legendary",
    armor: 145,
    price: 360,
  });
  assertGeneratedArmorSet("cathedral", {
    rarity: "legendary",
    armor: 160,
    price: 400,
  });
  assertGeneratedArmorSet("druid", {
    rarity: "mythical",
    armor: 191,
    price: 480,
  });
});

function assertGeneratedArmorSet(token, expected) {
  const setItems = generatedItems.filter((item) => item.kind === "armor" && item.availability?.shop && item.id.includes(token));
  const rarities = new Set(setItems.map((item) => item.rarity));
  const frontPairItems = setItems.filter((item) => item.equipmentSlot.startsWith("front"));

  assert.equal(setItems.length, 14);
  assert.deepEqual([...rarities], [expected.rarity]);
  assert.equal(sumBy(setItems, (item) => item.armorHp ?? 0), expected.armor);
  assert.equal(sumBy(setItems, (item) => item.armoryProduct?.price ?? 0), expected.price);
  assert.equal(sumBy(frontPairItems, (item) => item.armorHp ?? 0), 0);
  assert.equal(sumBy(frontPairItems, (item) => item.armoryProduct?.price ?? 0), 0);
}

function sumBy(items, getValue) {
  return items.reduce((total, item) => total + getValue(item), 0);
}
