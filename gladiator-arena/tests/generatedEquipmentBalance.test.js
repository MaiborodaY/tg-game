import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const generatedItems = JSON.parse(readFileSync(resolve(currentDir, "../src/generated/equipmentItems.generated.json"), "utf8"));

test("generated chainmail and rust champion sets occupy their intended shop tiers", () => {
  assertGeneratedArmorSet("chainmail", {
    rarity: "uncommon",
    armor: 45,
    price: 110,
  });
  assertGeneratedArmorSet("rust_champion", {
    rarity: "rare",
    armor: 60,
    price: 150,
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
