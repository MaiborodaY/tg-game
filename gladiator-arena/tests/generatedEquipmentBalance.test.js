import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const generatedItems = JSON.parse(readFileSync(resolve(currentDir, "../src/generated/equipmentItems.generated.json"), "utf8"));

const MELEE_WEAPON_PRICE_BASE = new Map([
  ["sword", 7],
  ["axe", 8],
  ["mace", 9],
  ["spear", 10],
]);

const WEAPON_RARITY_PRICE_TAX = new Map([
  ["common", 0],
  ["uncommon", 0],
  ["rare", 1],
  ["epic", 2],
  ["legendary", 3],
  ["mythical", 5],
]);

const ARMOR_EQUIPMENT_SET_EXPECTATIONS = new Map([
  ["cloth", { name: "Cloth", rank: 0, grade: "starter", shopCount: 14 }],
  ["sand", { name: "Sand", rank: 1, grade: "starter", shopCount: 14 }],
  ["leather", { name: "Leather", rank: 2, grade: "starter", shopCount: 14 }],
  ["chainmail", { name: "Chainmail", rank: 3, grade: "starter", shopCount: 14 }],
  ["rust_champion", { name: "Rust Champion", rank: 4, grade: "low", shopCount: 14 }],
  ["mercenary", { name: "Mercenary", rank: 5, grade: "mid", shopCount: 14 }],
  ["executioner", { name: "Executioner", rank: 6, grade: "high", shopCount: 14 }],
  ["lazure", { name: "Lazure", rank: 7, grade: "low", shopCount: 14 }],
  ["lion", { name: "Lion", rank: 8, grade: "mid", shopCount: 14 }],
  ["stormguard", { name: "Stormguard", rank: 9, grade: "high", shopCount: 14 }],
  ["viper", { name: "Viper", rank: 10, grade: "low", shopCount: 14 }],
  ["bone", { name: "Bone", rank: 11, grade: "mid", shopCount: 14 }],
  ["cathedral", { name: "Cathedral", rank: 12, grade: "high", shopCount: 14 }],
  ["druid", { name: "Druid", rank: 13, grade: "high", shopCount: 14 }],
  ["wood_boss", { name: "Wood Boss", rank: 14, grade: "boss", shopCount: 0, bossCount: 14 }],
]);

test("generated shop armor sets occupy their intended progression", () => {
  assertGeneratedArmorSet("leather", {
    rarity: "uncommon",
    armor: 34,
    price: 80,
  });
  assertGeneratedArmorSet("chainmail", {
    rarity: "uncommon",
    armor: 54,
    price: 130,
  });
  assertGeneratedArmorSet("rust_champion", {
    rarity: "rare",
    armor: 80,
    price: 200,
  });
  assertGeneratedArmorSet("mercenary", {
    rarity: "rare",
    armor: 102,
    price: 260,
  });
  assertGeneratedArmorSet("executioner", {
    rarity: "rare",
    armor: 135,
    price: 340,
  });
  assertGeneratedArmorSet("lazure", {
    rarity: "epic",
    armor: 202,
    price: 510,
  });
  assertGeneratedArmorSet("lion", {
    rarity: "epic",
    armor: 245,
    price: 610,
  });
  assertGeneratedArmorSet("stormguard", {
    rarity: "epic",
    armor: 291,
    price: 730,
  });
  assertGeneratedArmorSet("viper", {
    rarity: "legendary",
    armor: 335,
    price: 840,
  });
  assertGeneratedArmorSet("bone", {
    rarity: "legendary",
    armor: 366,
    price: 920,
  });
  assertGeneratedArmorSet("cathedral", {
    rarity: "legendary",
    armor: 402,
    price: 1010,
  });
  assertGeneratedArmorSet("druid", {
    rarity: "mythical",
    armor: 445,
    price: 1110,
  });
});

test("generated armor items carry equipment set metadata", () => {
  const armorItems = generatedItems.filter((item) => item.kind === "armor" && item.equipmentSlot !== "shield");

  assert.ok(armorItems.length > 0);

  armorItems.forEach((item) => {
    assert.ok(item.equipmentSet, `missing equipmentSet for ${item.id}`);
    assert.equal(ARMOR_EQUIPMENT_SET_EXPECTATIONS.has(item.equipmentSet.id), true, `unknown equipmentSet ${item.equipmentSet.id}`);
  });

  ARMOR_EQUIPMENT_SET_EXPECTATIONS.forEach((expected, setId) => {
    const setItems = armorItems.filter((item) => item.equipmentSet?.id === setId);
    const shopItems = setItems.filter((item) => item.availability?.shop);
    const bossItems = setItems.filter((item) => item.availability?.bossUnique);

    assert.ok(setItems.length > 0, `missing ${setId} set`);
    setItems.forEach((item) => {
      assert.deepEqual(item.equipmentSet, {
        id: setId,
        name: expected.name,
        rank: expected.rank,
        grade: expected.grade,
      });
    });
    assert.equal(shopItems.length, expected.shopCount, `${setId} shop count`);
    assert.equal(bossItems.length, expected.bossCount ?? 0, `${setId} boss count`);
  });
});

test("generated axes follow the strength-scaling damage curve", () => {
  assertGeneratedAxe("Common Axe 01", { damage: 2, shop: true, enemy: true });
  assertGeneratedAxe("Common Axe 02", { damage: 3, shop: true, enemy: true });
  assertGeneratedAxe("Common Axe 03", { damage: 4, shop: true, enemy: true });
  assertGeneratedAxe("Uncommon Axe 01", { damage: 6, shop: true, enemy: true });
  assertGeneratedAxe("Uncommon Axe 02", { damage: 8, shop: true, enemy: true });
  assertGeneratedAxe("Uncommon Axe 03", { damage: 10, shop: true, enemy: true });
  assertGeneratedAxe("Uncommon Axe 04", { damage: 13, shop: false, enemy: true });
  assertGeneratedAxe("Rare Axe 01", { damage: 15, shop: true, enemy: true });
  assertGeneratedAxe("Rare Axe 02", { damage: 18, shop: true, enemy: true });
  assertGeneratedAxe("Rare Axe 03", { damage: 21, shop: true, enemy: true });
  assertGeneratedAxe("Epic Axe 01", { damage: 25, shop: true, enemy: true });
  assertGeneratedAxe("Epic Axe 02", { damage: 29, shop: true, enemy: true });
  assertGeneratedAxe("Epic Axe 03", { damage: 33, shop: true, enemy: true });
  assertGeneratedAxe("Epic Axe 04", { damage: 40, shop: false, enemy: true });
  assertGeneratedAxe("Epic Axe 05", { damage: 45, shop: true, enemy: true });
});

test("generated swords follow the accuracy-focused damage curve", () => {
  assertGeneratedSword("Common Sword 01", { damage: 1, shop: true, enemy: true });
  assertGeneratedSword("Common Sword 02", { damage: 2, shop: true, enemy: true });
  assertGeneratedSword("Common Sword 03", { damage: 3, shop: false, enemy: true });
  assertGeneratedSword("Common Sword 04", { damage: 4, shop: true, enemy: true });
  assertGeneratedSword("Uncommon Sword 01", { damage: 5, shop: true, enemy: true });
  assertGeneratedSword("Uncommon Sword 02", { damage: 7, shop: true, enemy: true });
  assertGeneratedSword("Uncommon Sword 03", { damage: 9, shop: true, enemy: true });
  assertGeneratedSword("Rare Sword 01", { damage: 14, shop: true, enemy: true });
  assertGeneratedSword("Rare Sword 02", { damage: 15, shop: true, enemy: true });
  assertGeneratedSword("Rare Sword 03", { damage: 16, shop: true, enemy: true });
  assertGeneratedSword("Rare Sword 04", { damage: 17, shop: false, enemy: true });
  assertGeneratedSword("Rare Sword 05", { damage: 18, shop: false, enemy: true });
  assertGeneratedSword("Rare Sword 06", { damage: 19, shop: false, enemy: true });
  assertGeneratedSword("Rare Sword 07", { damage: 20, shop: false, enemy: true });
  assertGeneratedSword("Epic Sword 01", { damage: 24, shop: true, enemy: true });
  assertGeneratedSword("Epic Sword 02", { damage: 25, shop: false, enemy: true });
  assertGeneratedSword("Epic Sword 03", { damage: 26, shop: true, enemy: true });
  assertGeneratedSword("Epic Sword 04", { damage: 27, shop: true, enemy: true });
  assertGeneratedSword("Epic Sword 05", { damage: 28, shop: false, enemy: true });
  assertGeneratedSword("Epic Sword 06", { damage: 29, shop: true, enemy: true });
  assertGeneratedSword("Epic Sword 07", { damage: 30, shop: true, enemy: true });
  assertGeneratedSword("Epic Sword 08", { damage: 32, shop: true, enemy: true });
  assertGeneratedSword("Epic Sword 09", { damage: 39, shop: false, enemy: true });
  assertGeneratedSword("Epic Sword 10", { damage: 44, shop: false, enemy: true });
  assertGeneratedSword("Legendary Sword 01", { damage: 44, shop: true, enemy: true });
  assertGeneratedSword("Legendary Sword 02", { damage: 49, shop: true, enemy: true });
});

test("generated maces follow the armored-target damage curve", () => {
  assertGeneratedMace("Common Mace 01", { damage: 1, shop: true, enemy: true });
  assertGeneratedMace("Common Mace 02", { damage: 2, shop: true, enemy: true });
  assertGeneratedMace("Common Mace 03", { damage: 3, shop: true, enemy: true });
  assertGeneratedMace("Uncommon Mace 01", { damage: 4, shop: true, enemy: true });
  assertGeneratedMace("Uncommon Mace 02", { damage: 5, shop: true, enemy: true });
  assertGeneratedMace("Uncommon Mace 03", { damage: 6, shop: false, enemy: true });
  assertGeneratedMace("Uncommon Mace 04", { damage: 7, shop: true, enemy: true });
  assertGeneratedMace("Uncommon Mace 05", { damage: 8, shop: false, enemy: true });
  assertGeneratedMace("Uncommon Mace 06", { damage: 9, shop: false, enemy: true });
  assertGeneratedMace("Rare Mace 01", { damage: 11, shop: true, enemy: true });
  assertGeneratedMace("Rare Mace 02", { damage: 13, shop: true, enemy: true });
  assertGeneratedMace("Rare Mace 03", { damage: 15, shop: true, enemy: true });
  assertGeneratedMace("Epic Mace 01", { damage: 18, shop: false, enemy: true });
  assertGeneratedMace("Epic Mace 02", { damage: 20, shop: true, enemy: true });
  assertGeneratedMace("Epic Mace 03", { damage: 22, shop: true, enemy: true });
  assertGeneratedMace("Epic Mace 04", { damage: 24, shop: true, enemy: true });
  assertGeneratedMace("Epic Mace 05", { damage: 27, shop: true, enemy: true });
  assertGeneratedMace("Legendary Mace 01", { damage: 34, shop: true, enemy: true });
});

test("generated spears follow the reach-focused damage curve", () => {
  assertGeneratedSpear("Rare Spear 01", { damage: 7, shop: true, enemy: true });
  assertGeneratedSpear("Rare Spear 02", { damage: 8, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 01", { damage: 10, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 02", { damage: 11, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 03", { damage: 16, shop: false, enemy: true });
  assertGeneratedSpear("Epic Spear 04", { damage: 13, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 05", { damage: 15, shop: true, enemy: true });
  assertGeneratedSpear("Legendary Spear 01", { damage: 19, shop: true, enemy: true });
});

test("generated melee weapon prices follow class and rarity multipliers", () => {
  const meleeShopWeapons = generatedItems.filter(
    (item) => item.kind === "weapon" && item.weaponProduct && MELEE_WEAPON_PRICE_BASE.has(item.weaponClass),
  );

  assert.ok(meleeShopWeapons.length > 0);

  meleeShopWeapons.forEach((item) => {
    assert.equal(item.weaponProduct.price, getExpectedMeleeWeaponPrice(item), `${item.name} price`);
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

function assertGeneratedAxe(name, expected) {
  const item = generatedItems.find((candidate) => candidate.kind === "weapon" && candidate.weaponClass === "axe" && candidate.name === name);

  assert.ok(item, `missing ${name}`);
  assert.equal(item.damageBonus, expected.damage);
  assert.equal(item.weaponProduct?.price ?? 0, expected.shop ? getExpectedMeleeWeaponPrice(item) : 0);
  assert.equal(item.availability?.shop ?? false, expected.shop);
  assert.equal(item.availability?.enemyPool ?? false, expected.enemy);
}

function assertGeneratedSword(name, expected) {
  const item = generatedItems.find((candidate) => candidate.kind === "weapon" && candidate.weaponClass === "sword" && candidate.name === name);

  assert.ok(item, `missing ${name}`);
  assert.equal(item.damageBonus, expected.damage);
  assert.equal(item.weaponProduct?.price ?? 0, expected.shop ? getExpectedMeleeWeaponPrice(item) : 0);
  assert.equal(item.availability?.shop ?? false, expected.shop);
  assert.equal(item.availability?.enemyPool ?? false, expected.enemy);
}

function assertGeneratedMace(name, expected) {
  const item = generatedItems.find((candidate) => candidate.kind === "weapon" && candidate.weaponClass === "mace" && candidate.name === name);

  assert.ok(item, `missing ${name}`);
  assert.equal(item.damageBonus, expected.damage);
  assert.equal(item.weaponProduct?.price ?? 0, expected.shop ? getExpectedMeleeWeaponPrice(item) : 0);
  assert.equal(item.availability?.shop ?? false, expected.shop);
  assert.equal(item.availability?.enemyPool ?? false, expected.enemy);
}

function assertGeneratedSpear(name, expected) {
  const item = generatedItems.find((candidate) => candidate.kind === "weapon" && candidate.weaponClass === "spear" && candidate.name === name);

  assert.ok(item, `missing ${name}`);
  assert.equal(item.damageBonus, expected.damage);
  assert.equal(item.weaponProduct?.price ?? 0, expected.shop ? getExpectedMeleeWeaponPrice(item) : 0);
  assert.equal(item.availability?.shop ?? false, expected.shop);
  assert.equal(item.availability?.enemyPool ?? false, expected.enemy);
}

function getExpectedMeleeWeaponPrice(item) {
  const classBase = MELEE_WEAPON_PRICE_BASE.get(item.weaponClass);
  const rarityTax = WEAPON_RARITY_PRICE_TAX.get(item.rarity);

  assert.notEqual(classBase, undefined, `missing price base for ${item.weaponClass}`);
  assert.notEqual(rarityTax, undefined, `missing rarity price tax for ${item.rarity}`);

  return Math.max(0, item.damageBonus ?? 0) * (classBase + rarityTax);
}

function sumBy(items, getValue) {
  return items.reduce((total, item) => total + getValue(item), 0);
}
