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
  ["cloth", { name: "Cloth", rank: 0, grade: "starter", shopCount: 14, level: 1 }],
  ["sand", { name: "Sand", rank: 1, grade: "starter", shopCount: 14, level: 7 }],
  ["leather", { name: "Leather", rank: 2, grade: "starter", shopCount: 14, level: 15 }],
  ["chainmail", { name: "Chainmail", rank: 3, grade: "starter", shopCount: 14, level: 25 }],
  ["rust_champion", { name: "Rust Champion", rank: 4, grade: "low", shopCount: 14, level: 30 }],
  ["mercenary", { name: "Mercenary", rank: 5, grade: "mid", shopCount: 14, level: 35 }],
  ["executioner", { name: "Executioner", rank: 6, grade: "high", shopCount: 14, level: 40 }],
  ["lazure", { name: "Lazure", rank: 7, grade: "low", shopCount: 14, level: 45 }],
  ["lion", { name: "Lion", rank: 8, grade: "mid", shopCount: 14, level: 50 }],
  ["stormguard", { name: "Stormguard", rank: 9, grade: "high", shopCount: 14, level: 60 }],
  ["viper", { name: "Viper", rank: 10, grade: "low", shopCount: 14, level: 70 }],
  ["bone", { name: "Bone", rank: 11, grade: "mid", shopCount: 14, level: 80 }],
  ["cathedral", { name: "Cathedral", rank: 12, grade: "high", shopCount: 14, level: 90 }],
  ["druid", { name: "Druid", rank: 13, grade: "high", shopCount: 0 }],
  ["wood_boss", { name: "Wood Boss", rank: 14, grade: "boss", shopCount: 0, bossCount: 14 }],
  ["boar_boss", { name: "Boar Boss", rank: 15, grade: "boss", shopCount: 0, bossCount: 14 }],
]);

const SHIELD_BALANCE_EXPECTATIONS = new Map([
  ["generated_equipment_shield_common_03", { rarity: "common", armor: 18, price: 80, level: 5 }],
  ["generated_equipment_shield_common_04", { rarity: "common", armor: 25, price: 120, level: 10 }],
  ["generated_equipment_shield_uncommon_01", { rarity: "uncommon", armor: 35, price: 180, level: 15 }],
  ["generated_equipment_shield_uncommon_02", { rarity: "uncommon", armor: 50, price: 260, level: 25 }],
  ["generated_equipment_shield_rare_01", { rarity: "rare", armor: 70, price: 420, level: 30 }],
  ["generated_equipment_shield_rare_02", { rarity: "rare", armor: 95, price: 600, level: 40 }],
  ["generated_equipment_shield_epic_01", { rarity: "epic", armor: 125, price: 900, level: 50 }],
  ["generated_equipment_shield_epic_02", { rarity: "epic", armor: 165, price: 1250, level: 60 }],
  ["generated_equipment_shield_legendary_01", { rarity: "legendary", armor: 220, price: 1800, level: 70 }],
  ["generated_equipment_shield_legendary_02", { rarity: "legendary", armor: 290, price: 2500, level: 80 }],
  ["generated_equipment_shield_mythical_01", { rarity: "mythical", armor: 380, shop: false }],
  ["generated_equipment_shield_mythical_02", { rarity: "mythical", armor: 500, shop: false }],
]);

const WEAPON_LEVEL_REQUIREMENT_EXPECTATIONS = new Map([
  ["Common Sword 01", 1],
  ["Common Sword 02", 5],
  ["Common Sword 04", 10],
  ["Common Axe 01", 1],
  ["Common Axe 02", 5],
  ["Common Axe 03", 10],
  ["Common Mace 01", 1],
  ["Common Mace 02", 5],
  ["Common Mace 03", 10],
  ["Uncommon Sword 01", 15],
  ["Uncommon Sword 02", 20],
  ["Uncommon Sword 03", 25],
  ["Uncommon Axe 01", 15],
  ["Uncommon Axe 02", 20],
  ["Uncommon Axe 03", 25],
  ["Uncommon Mace 01", 15],
  ["Uncommon Mace 02", 20],
  ["Uncommon Mace 04", 25],
  ["Rare Sword 01", 30],
  ["Rare Sword 02", 35],
  ["Rare Sword 03", 40],
  ["Rare Axe 01", 30],
  ["Rare Axe 02", 35],
  ["Rare Axe 03", 40],
  ["Rare Mace 01", 30],
  ["Rare Mace 02", 35],
  ["Rare Mace 03", 40],
  ["Rare Spear 01", 30],
  ["Rare Spear 02", 40],
  ["Epic Sword 01", 45],
  ["Epic Sword 03", 48],
  ["Epic Sword 04", 51],
  ["Epic Sword 06", 54],
  ["Epic Sword 07", 57],
  ["Epic Sword 08", 60],
  ["Epic Axe 01", 45],
  ["Epic Axe 02", 50],
  ["Epic Axe 03", 55],
  ["Epic Axe 06", 57],
  ["Epic Axe 07", 58],
  ["Epic Axe 05", 60],
  ["Epic Mace 02", 45],
  ["Epic Mace 03", 50],
  ["Epic Mace 04", 55],
  ["Epic Mace 05", 60],
  ["Epic Mace 06", 65],
  ["Epic Mace 07", 70],
  ["Epic Spear 01", 45],
  ["Epic Spear 02", 50],
  ["Epic Spear 04", 55],
  ["Epic Spear 05", 60],
  ["Epic Spear 06", 65],
  ["Epic Spear 07", 70],
  ["Legendary Axe 01", 70],
  ["Legendary Axe 02", 80],
  ["Legendary Sword 01", 70],
  ["Legendary Sword 02", 80],
  ["Legendary Mace 01", 70],
  ["Legendary Mace 02", 80],
  ["Legendary Spear 01", 70],
  ["Legendary Spear 02", 80],
  ["Rusty Shuriken", 5],
  ["common shuriken 2", 10],
  ["uncommon shuriken 1", 15],
  ["uncommon shuriken 2", 25],
  ["rare shuriken 1", 30],
  ["rare shuriken 2", 40],
  ["epic shuriken 1", 50],
  ["epic shuriken 2", 60],
  ["Legendary shuriken 1", 70],
  ["Legendary shuriken 2", 80],
]);

const BOW_AGILITY_REQUIREMENT_EXPECTATIONS = new Map([
  ["Bow 01", 5],
  ["Common bow 02", 10],
  ["Uncommon bow 1", 15],
  ["Uncommon bow 2", 20],
  ["Rare bow 1", 25],
  ["Rare bow 2", 30],
  ["Epic bow 1", 35],
  ["Epic bow 2", 40],
  ["Legendary bow 1", 45],
  ["Legendary bow 2", 50],
]);

test("generated shop armor sets occupy their intended progression", () => {
  assertGeneratedArmorSet("cloth", {
    rarity: "common",
    armor: 11,
    price: 30,
    level: 1,
  });
  assertGeneratedArmorSet("sand", {
    rarity: "common",
    armor: 20,
    price: 50,
    level: 7,
  });
  assertGeneratedArmorSet("leather", {
    rarity: "uncommon",
    armor: 34,
    price: 80,
    level: 15,
  });
  assertGeneratedArmorSet("chainmail", {
    rarity: "uncommon",
    armor: 54,
    price: 130,
    level: 25,
  });
  assertGeneratedArmorSet("rust_champion", {
    rarity: "rare",
    armor: 80,
    price: 200,
    level: 30,
  });
  assertGeneratedArmorSet("mercenary", {
    rarity: "rare",
    armor: 102,
    price: 260,
    level: 35,
  });
  assertGeneratedArmorSet("executioner", {
    rarity: "rare",
    armor: 135,
    price: 340,
    level: 40,
  });
  assertGeneratedArmorSet("lazure", {
    rarity: "epic",
    armor: 202,
    price: 510,
    level: 45,
  });
  assertGeneratedArmorSet("lion", {
    rarity: "epic",
    armor: 245,
    price: 610,
    level: 50,
  });
  assertGeneratedArmorSet("stormguard", {
    rarity: "epic",
    armor: 291,
    price: 730,
    level: 60,
  });
  assertGeneratedArmorSet("viper", {
    rarity: "legendary",
    armor: 335,
    price: 840,
    level: 70,
  });
  assertGeneratedArmorSet("bone", {
    rarity: "legendary",
    armor: 366,
    price: 920,
    level: 80,
  });
  assertGeneratedArmorSet("cathedral", {
    rarity: "legendary",
    armor: 402,
    price: 1010,
    level: 90,
  });
});

test("druid armor set and mythical shields are enemy-only equipment", () => {
  const enemyOnlyItems = generatedItems.filter(
    (item) =>
      item.kind === "armor" &&
      (item.equipmentSet?.id === "druid" || (item.equipmentSlot === "shield" && item.rarity === "mythical")),
  );
  const nonMythicalShopShields = generatedItems.filter(
    (item) => item.kind === "armor" && item.equipmentSlot === "shield" && item.rarity !== "mythical" && item.availability?.shop,
  );

  assert.equal(enemyOnlyItems.length, 16);
  assert.equal(sumBy(enemyOnlyItems.filter((item) => item.equipmentSet?.id === "druid"), (item) => item.armorHp ?? 0), 445);
  assert.equal(nonMythicalShopShields.length, 10);

  enemyOnlyItems.forEach((item) => {
    assert.equal(item.availability?.shop ?? false, false, `${item.id} shop availability`);
    assert.equal(item.availability?.enemyPool ?? false, true, `${item.id} enemy availability`);
    assert.equal(item.availability?.bossUnique ?? true, false, `${item.id} boss uniqueness`);
    assert.equal(item.armoryProduct, undefined, `${item.id} armory product`);
    assert.equal(item.levelRequirement, undefined, `${item.id} level requirement`);
  });
});

test("generated shields follow the defensive curve with mythical shields kept enemy-only", () => {
  const shields = generatedItems.filter((item) => item.kind === "armor" && item.equipmentSlot === "shield");

  assert.equal(shields.length, SHIELD_BALANCE_EXPECTATIONS.size);

  SHIELD_BALANCE_EXPECTATIONS.forEach((expected, id) => {
    assertGeneratedShield(id, expected);
  });
});

test("boar boss armor sits between rare low and rare mid", () => {
  assertGeneratedBossArmorSet("boar_boss", {
    armor: 91,
    slots: {
      breastplate: 23,
      helmet: 14,
      backShoulderguard: 10,
      frontShoulderguard: 0,
      backGreave: 10,
      frontGreave: 0,
      backShinguard: 10,
      frontShinguard: 0,
      backGlove: 8,
      frontGlove: 0,
      backBoot: 8,
      frontBoot: 0,
      backWrist: 8,
      frontWrist: 0,
    },
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
    shopItems.forEach((item) => {
      assert.equal(item.levelRequirement, expected.level, `${item.id} level requirement`);
    });
    setItems
      .filter((item) => !item.availability?.shop)
      .forEach((item) => {
        assert.equal(item.levelRequirement, undefined, `${item.id} non-shop level requirement`);
      });
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
  assertGeneratedAxe("Epic Axe 06", { damage: 37, shop: true, enemy: true });
  assertGeneratedAxe("Epic Axe 07", { damage: 41, shop: true, enemy: true });
  assertGeneratedAxe("Legendary Axe 01", { damage: 50, shop: true, enemy: true });
  assertGeneratedAxe("Legendary Axe 02", { damage: 55, shop: true, enemy: true });
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
  assertGeneratedSword("Mythical Sword 01", { damage: 56, shop: false, enemy: true });
  assertGeneratedSword("Mythical Sword 02", { damage: 62, shop: false, enemy: true });
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
  assertGeneratedMace("Epic Mace 06", { damage: 29, shop: true, enemy: true });
  assertGeneratedMace("Epic Mace 07", { damage: 31, shop: true, enemy: true });
  assertGeneratedMace("Legendary Mace 01", { damage: 34, shop: true, enemy: true });
  assertGeneratedMace("Legendary Mace 02", { damage: 38, shop: true, enemy: true });
  assertGeneratedMace("Mythical Mace 01", { damage: 42, shop: false, enemy: true });
  assertGeneratedMace("Mythical Mace 02", { damage: 46, shop: false, enemy: true });
});

test("generated spears follow the reach-focused damage curve", () => {
  assertGeneratedSpear("Rare Spear 01", { damage: 7, shop: true, enemy: true });
  assertGeneratedSpear("Rare Spear 02", { damage: 8, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 01", { damage: 10, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 02", { damage: 11, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 03", { damage: 16, shop: false, enemy: true });
  assertGeneratedSpear("Epic Spear 04", { damage: 13, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 05", { damage: 15, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 06", { damage: 17, shop: true, enemy: true });
  assertGeneratedSpear("Epic Spear 07", { damage: 18, shop: true, enemy: true });
  assertGeneratedSpear("Legendary Spear 01", { damage: 19, shop: true, enemy: true });
  assertGeneratedSpear("Legendary Spear 02", { damage: 21, shop: true, enemy: true });
  assertGeneratedSpear("Mythical Spear 01", { damage: 23, shop: false, enemy: true });
  assertGeneratedSpear("Mythical Spear 02", { damage: 25, shop: false, enemy: true });
});

test("generated mythical weapons stay enemy-only", () => {
  const mythicalWeapons = generatedItems.filter((item) => item.kind === "weapon" && item.rarity === "mythical");

  assert.equal(mythicalWeapons.length, 10);

  mythicalWeapons.forEach((item) => {
    assert.equal(item.weaponProduct, undefined, `${item.name} weapon product`);
    assert.equal(item.levelRequirement, undefined, `${item.name} level requirement`);
    assert.equal(item.availability?.shop ?? true, false, `${item.name} shop availability`);
    assert.equal(item.availability?.enemyPool ?? false, true, `${item.name} enemy availability`);
  });
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

test("generated shop weapons follow the level one hundred progression gates", () => {
  const shopWeapons = generatedItems.filter((item) => item.kind === "weapon" && item.weaponProduct && WEAPON_LEVEL_REQUIREMENT_EXPECTATIONS.has(item.name));

  assert.equal(shopWeapons.length, WEAPON_LEVEL_REQUIREMENT_EXPECTATIONS.size);

  WEAPON_LEVEL_REQUIREMENT_EXPECTATIONS.forEach((expectedLevel, name) => {
    const item = shopWeapons.find((candidate) => candidate.name === name);

    assert.ok(item, `missing ${name}`);
    assert.equal(item.levelRequirement, expectedLevel, `${name} level requirement`);
  });
});

test("generated shop bows follow agility progression gates", () => {
  const shopBows = generatedItems.filter((item) => item.kind === "weapon" && item.weaponClass === "bow" && item.weaponProduct);

  assert.equal(shopBows.length, BOW_AGILITY_REQUIREMENT_EXPECTATIONS.size);

  BOW_AGILITY_REQUIREMENT_EXPECTATIONS.forEach((expectedAgility, name) => {
    const item = shopBows.find((candidate) => candidate.name === name);

    assert.ok(item, `missing ${name}`);
    assert.equal(item.requirements?.agility, expectedAgility, `${name} agility requirement`);
  });
});

function assertGeneratedArmorSet(token, expected) {
  const setItems = generatedItems.filter((item) => item.kind === "armor" && item.availability?.shop && item.equipmentSet?.id === token);
  const rarities = new Set(setItems.map((item) => item.rarity));
  const levels = new Set(setItems.map((item) => item.levelRequirement));
  const frontPairItems = setItems.filter((item) => item.equipmentSlot.startsWith("front"));

  assert.equal(setItems.length, 14);
  assert.deepEqual([...rarities], [expected.rarity]);
  assert.deepEqual([...levels], [expected.level]);
  assert.equal(sumBy(setItems, (item) => item.armorHp ?? 0), expected.armor);
  assert.equal(sumBy(setItems, (item) => item.armoryProduct?.price ?? 0), expected.price);
  assert.equal(sumBy(frontPairItems, (item) => item.armorHp ?? 0), 0);
  assert.equal(sumBy(frontPairItems, (item) => item.armoryProduct?.price ?? 0), 0);
}

function assertGeneratedBossArmorSet(token, expected) {
  const setItems = generatedItems.filter((item) => item.kind === "armor" && item.equipmentSet?.id === token);
  const rarities = new Set(setItems.map((item) => item.rarity));

  assert.equal(setItems.length, 14);
  assert.deepEqual([...rarities], ["unique"]);
  assert.equal(sumBy(setItems, (item) => item.armorHp ?? 0), expected.armor);

  Object.entries(expected.slots).forEach(([slot, armor]) => {
    const item = setItems.find((candidate) => candidate.equipmentSlot === slot);

    assert.ok(item, `missing ${token} ${slot}`);
    assert.equal(item.armorHp ?? 0, armor, `${item.id} armor`);
  });
}

function assertGeneratedShield(id, expected) {
  const item = generatedItems.find((candidate) => candidate.kind === "armor" && candidate.equipmentSlot === "shield" && candidate.id === id);
  const isShopShield = expected.shop ?? true;

  assert.ok(item, `missing ${id}`);
  assert.equal(item.rarity, expected.rarity);
  assert.equal(item.armorHp, expected.armor);
  assert.equal(item.levelRequirement, isShopShield ? expected.level : undefined);
  assert.equal(item.armoryProduct?.price, isShopShield ? expected.price : undefined);
  assert.equal(item.availability?.shop ?? false, isShopShield);
  assert.equal(item.availability?.enemyPool ?? false, true);
  assert.equal(item.equipmentSet, undefined);
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
