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
  weapon_axe_01: {
    id: "weapon_axe_01",
    name: "Axe 01",
    kind: "weapon",
    rarity: "epic",
    weaponClass: "axe",
    equipmentSlot: "weaponMain",
    damageBonus: 10,
  },
  weapon_axe_02: {
    id: "weapon_axe_02",
    name: "Axe 02",
    kind: "weapon",
    rarity: "epic",
    weaponClass: "axe",
    equipmentSlot: "weaponMain",
    damageBonus: 18,
  },
  weapon_bow_01: {
    id: "weapon_bow_01",
    name: "Bow 01",
    kind: "weapon",
    rarity: "common",
    weaponClass: "bow",
    equipmentSlot: "weaponBow",
    damageBonus: 5,
  },
  weapon_shuriken_01: {
    id: "weapon_shuriken_01",
    name: "Rusty Shuriken",
    kind: "weapon",
    rarity: "common",
    weaponClass: "shuriken",
    equipmentSlot: "weaponMain",
    damageBonus: 2,
  },
  scroll_crack_armor_01: {
    id: "scroll_crack_armor_01",
    name: "Crack Armor Scroll",
    kind: "scroll",
    rarity: "common",
    equipmentSlot: "weaponMain",
  },
  cloth_breastplate_01: {
    id: "cloth_breastplate_01",
    name: "Cloth Breastplate 01",
    kind: "armor",
    rarity: "common",
    equipmentSlot: "breastplate",
    armorHp: 3,
  },
};

const shopPresentation = loadTypeScriptModule("../src/shopPresentation.ts", {
  require: (id) => {
    if (id === "./arenaOpponents") {
      return { getArenaBossesForTier: () => [] };
    }

    if (id === "./combat") {
      return { AXE_MELEE_DAMAGE_PERCENT_BONUS_MULTIPLIER: 1.5 };
    }

    if (id === "./hero") {
      return {
        HERO_ITEM_CATALOG: generatedItems,
        areHeroItemsEquipped: () => false,
        areHeroItemsOwned: () => false,
        areHeroItemsConsumable: (itemIds) =>
          itemIds.every((itemId) => generatedItems[itemId]?.weaponClass === "shuriken" || generatedItems[itemId]?.kind === "scroll"),
        canHeroEquipItems: (hero) => hero.canEquip !== false,
        canHeroUseItems: (hero) => hero.canUse !== false,
        deriveHeroStats: (hero) => ({ meleeDamagePercentBonus: hero.meleeDamagePercentBonus ?? 0 }),
        getAgilityBowDamageMultiplier: (agility) => 1 + Math.max(0, Math.floor(agility)) * 0.05,
        getHeroAttributeTotals: (hero) => ({ strength: 0, agility: hero.agility ?? 0, vitality: 0 }),
        getHeroConsumableMaxQuantity: (itemId) => (generatedItems[itemId]?.weaponClass === "shuriken" ? 2 : 0),
        getHeroItemQuantity: () => 0,
        getHeroRemainingScrollCapacity: (hero) => hero.scrollCapacity ?? 0,
        getHeroShurikenQuantity: (hero) => hero.shurikenQuantity ?? 0,
        getHeroItemRequirementChecks: () => [],
        getHeroItemWeaponClass: (item) => item?.weaponClass ?? "sword",
        isHeroScrollItemId: (itemId) => generatedItems[itemId]?.kind === "scroll",
      };
    }

    throw new Error(`Unsupported shop presentation test import: ${id}`);
  },
});

test("shop display damage scales melee by strength and bows by agility while leaving consumables raw", () => {
  const hero = {
    meleeDamagePercentBonus: 0.5,
    agility: 10,
    equipment: {
      weaponMain: "weapon_sword_01",
      weaponBow: "weapon_bow_01",
    },
  };

  assert.equal(shopPresentation.getShopProductStat(["weapon_sword_01"], "damage"), 1);
  assert.equal(shopPresentation.getShopProductDisplayStat({ ...hero, meleeDamagePercentBonus: 0.05 }, ["weapon_sword_01"], "damage"), 2);
  assert.equal(shopPresentation.getShopProductDisplayStat(hero, ["weapon_sword_01"], "damage"), 2);
  assert.equal(shopPresentation.getShopProductDisplayStat(hero, ["weapon_axe_01"], "damage"), 18);
  assert.equal(shopPresentation.getShopProductDisplayStat({ ...hero, meleeDamagePercentBonus: 0.2 }, ["weapon_axe_02"], "damage"), 24);
  assert.equal(shopPresentation.getShopProductDisplayStat(hero, ["weapon_bow_01"], "damage"), 8);
  assert.equal(shopPresentation.getShopProductDisplayStat(hero, ["weapon_shuriken_01"], "damage"), 2);
  assert.equal(shopPresentation.getShopProductDisplayStat(hero, ["cloth_breastplate_01"], "armor"), 3);
  assert.equal(shopPresentation.getEquippedShopProductDisplayStat(hero, ["weapon_axe_01"], "damage"), 2);
  assert.equal(shopPresentation.getEquippedShopProductDisplayStat(hero, ["weapon_bow_01"], "damage"), 8);
});

test("scroll shop products use the shared scroll inventory cap", () => {
  assert.equal(shopPresentation.getShopProductActionState({ gold: 100, scrollCapacity: 1 }, ["scroll_crack_armor_01"], 30), "buy");
  assert.equal(shopPresentation.getShopProductActionState({ gold: 100, scrollCapacity: 0 }, ["scroll_crack_armor_01"], 30), "max");
});

test("consumable shop products respect item requirements before purchase state", () => {
  assert.equal(shopPresentation.getShopProductActionState({ gold: 100, canUse: false }, ["weapon_shuriken_01"], 5), "locked");
});

test("shuriken shop products use the shared shuriken inventory cap", () => {
  assert.equal(shopPresentation.getShopProductActionState({ gold: 100, shurikenQuantity: 1 }, ["weapon_shuriken_01"], 5), "buy");
  assert.equal(shopPresentation.getShopProductActionState({ gold: 100, shurikenQuantity: 2 }, ["weapon_shuriken_01"], 5), "max");
});
