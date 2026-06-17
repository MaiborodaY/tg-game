import { getArenaBossesForTier } from "./arenaOpponents";
import {
  HERO_ITEM_CATALOG,
  areHeroItemsEquipped,
  areHeroItemsOwned,
  areHeroItemsConsumable,
  canHeroEquipItems,
  getHeroConsumableMaxQuantity,
  getHeroItemQuantity,
  getHeroItemRequirementChecks,
  deriveHeroStats,
  getHeroItemWeaponClass,
  hasHeroUnlockedShopRarity,
  type HeroAttributeKey,
  type HeroItemDefinition,
  type HeroItemId,
  type HeroItemRequirementCheck,
  type HeroItemRarity,
  type HeroState,
} from "./hero";

export type ShopItemRarity = HeroItemRarity;
export type ShopProductActionState = "buy" | "equip" | "equipped" | "no-gold" | "sealed" | "locked" | "max";
export type ShopProductStatKind = "armor" | "damage";

export type ShopProductRequirementBadge =
  | {
      kind: "attribute";
      attribute: HeroAttributeKey;
      required: number;
    }
  | {
      kind: "level";
      required: number;
    };

const shopRarityLabels: Record<ShopItemRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythical: "Mythical",
  unique: "Unique",
};

const shopRarityShortLabels: Record<ShopItemRarity, string> = {
  common: "C",
  uncommon: "U",
  rare: "R",
  epic: "E",
  legendary: "L",
  mythical: "M",
  unique: "X",
};

const shopRarityRanks: Record<ShopItemRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythical: 6,
  unique: 7,
};

const shopRequirementShortLabels: Record<HeroAttributeKey, string> = {
  strength: "STR",
  agility: "AGI",
  vitality: "VIT",
};

const shopRequirementLabels: Record<HeroAttributeKey, string> = {
  strength: "Strength",
  agility: "Agility",
  vitality: "Vitality",
};

const shopRarityUnlockBossTier: Partial<Record<ShopItemRarity, number>> = {
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
  unique: 6,
};

export function getShopProductStat(itemIds: HeroItemId[], statKind: ShopProductStatKind): number {
  return itemIds.reduce((total, itemId) => total + getShopItemStat(HERO_ITEM_CATALOG[itemId], statKind), 0);
}

export function getShopProductDisplayStat(hero: HeroState, itemIds: HeroItemId[], statKind: ShopProductStatKind): number {
  return itemIds.reduce((total, itemId) => total + getShopItemDisplayStat(hero, HERO_ITEM_CATALOG[itemId], statKind), 0);
}

export function getEquippedShopProductStat(hero: HeroState, itemIds: HeroItemId[], statKind: ShopProductStatKind): number {
  return itemIds.reduce((total, itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];
    const equippedItemId = item ? hero.equipment[item.equipmentSlot] : null;
    const equippedItem = equippedItemId ? HERO_ITEM_CATALOG[equippedItemId] : undefined;

    return total + getShopItemStat(equippedItem, statKind);
  }, 0);
}

export function getEquippedShopProductDisplayStat(hero: HeroState, itemIds: HeroItemId[], statKind: ShopProductStatKind): number {
  return itemIds.reduce((total, itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];
    const equippedItemId = item ? hero.equipment[item.equipmentSlot] : null;
    const equippedItem = equippedItemId ? HERO_ITEM_CATALOG[equippedItemId] : undefined;

    return total + getShopItemDisplayStat(hero, equippedItem, statKind);
  }, 0);
}

export function getShopProductActionState(hero: HeroState, itemIds: HeroItemId[], price: number): ShopProductActionState {
  if (areHeroItemsConsumable(itemIds)) {
    return isShopConsumableAtMax(hero, itemIds) ? "max" : hero.gold >= price ? "buy" : "no-gold";
  }

  if (areHeroItemsEquipped(hero, itemIds)) {
    return "equipped";
  }

  if (!canHeroEquipItems(hero, itemIds)) {
    return "locked";
  }

  if (areHeroItemsOwned(hero, itemIds)) {
    return "equip";
  }

  return hero.gold >= price ? "buy" : "no-gold";
}

export function getShopProductActionLabel(actionState: ShopProductActionState, price: number): string {
  if (actionState === "sealed") {
    return "Sealed";
  }

  if (actionState === "equipped") {
    return "Equipped";
  }

  if (actionState === "equip") {
    return "Equip";
  }

  if (actionState === "locked") {
    return "Locked";
  }

  if (actionState === "max") {
    return "Max";
  }

  return actionState === "buy" ? `Buy ${price}` : "No gold";
}

export function getShopProductRequirementLabel(hero: HeroState, itemIds: readonly HeroItemId[]): string {
  return getHeroItemRequirementChecks(hero, itemIds)
    .filter((requirement) => requirement.current < requirement.required)
    .map((requirement) => `${getShopRequirementShortLabel(requirement)} ${requirement.required}`)
    .join(" / ");
}

export function getShopProductRequirementBadge(hero: HeroState, itemIds: readonly HeroItemId[]): ShopProductRequirementBadge | undefined {
  const requirement = getHeroItemRequirementChecks(hero, itemIds).find((check) => check.current < check.required);

  if (!requirement) {
    return undefined;
  }

  return requirement.kind === "level"
    ? { kind: "level", required: requirement.required }
    : { kind: "attribute", attribute: requirement.attribute, required: requirement.required };
}

export function getShopProductRequirementDescription(hero: HeroState, itemIds: readonly HeroItemId[]): string {
  return getHeroItemRequirementChecks(hero, itemIds)
    .filter((requirement) => requirement.current < requirement.required)
    .map((requirement) => `Requires ${getShopRequirementLabel(requirement)} ${requirement.required}`)
    .join(", ");
}

function getShopRequirementShortLabel(requirement: HeroItemRequirementCheck): string {
  return requirement.kind === "level" ? "LVL" : shopRequirementShortLabels[requirement.attribute];
}

function getShopRequirementLabel(requirement: HeroItemRequirementCheck): string {
  return requirement.kind === "level" ? "Level" : shopRequirementLabels[requirement.attribute];
}

export function getShopProductDisplayName(productName: string): string {
  return productName
    .replace(/\bshoulderguards?\b/giu, "Shoulders")
    .replace(/\s+01\b/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function isShopProductSealed(hero: HeroState, itemIds: HeroItemId[], explicitRarity?: ShopItemRarity): boolean {
  return isShopRaritySealed(hero, getShopProductRarity(itemIds, explicitRarity));
}

export function isShopRaritySealed(hero: HeroState, rarity: ShopItemRarity): boolean {
  if (hasHeroUnlockedShopRarity(hero, rarity)) {
    return false;
  }

  const unlockBossTier = shopRarityUnlockBossTier[rarity];

  if (!unlockBossTier) {
    return false;
  }

  const bosses = getArenaBossesForTier(unlockBossTier);

  if (bosses.length === 0) {
    return true;
  }

  const defeatedBossIds = new Set(hero.defeatedArenaBossIds ?? []);

  return !bosses.some((boss) => defeatedBossIds.has(boss.id));
}

export function getShopProductRarity(itemIds: HeroItemId[], explicitRarity?: ShopItemRarity): ShopItemRarity {
  if (explicitRarity) {
    return explicitRarity;
  }

  const itemRarity = getHighestShopRarity(
    itemIds.flatMap((itemId) => {
      const rarity = HERO_ITEM_CATALOG[itemId]?.rarity;

      return rarity ? [rarity] : [];
    }),
  );

  if (itemRarity) {
    return itemRarity;
  }

  const score = Math.max(
    0,
    ...itemIds.map((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      return Math.max(getShopItemStat(item, "armor"), getShopItemStat(item, "damage"));
    }),
  );

  if (score >= 10) {
    return "mythical";
  }

  if (score >= 6) {
    return "legendary";
  }

  if (score >= 5) {
    return "epic";
  }

  if (score >= 3) {
    return "rare";
  }

  if (score >= 2) {
    return "uncommon";
  }

  return "common";
}

export function getShopRarityLabel(rarity: ShopItemRarity): string {
  return shopRarityLabels[rarity];
}

export function getShopRarityShortLabel(rarity: ShopItemRarity): string {
  return shopRarityShortLabels[rarity];
}

function getShopItemStat(item: HeroItemDefinition | undefined, statKind: ShopProductStatKind): number {
  if (!item) {
    return 0;
  }

  return statKind === "armor" ? item.armorHp ?? 0 : item.damageBonus ?? 0;
}

function getShopItemDisplayStat(hero: HeroState, item: HeroItemDefinition | undefined, statKind: ShopProductStatKind): number {
  const stat = getShopItemStat(item, statKind);

  if (statKind !== "damage" || !isMeleeWeaponShopItem(item)) {
    return stat;
  }

  return Math.round(stat * getHeroMeleeDamageDisplayMultiplier(hero, item));
}

function getHeroMeleeDamageDisplayMultiplier(hero: HeroState, item: HeroItemDefinition): number {
  const weaponMultiplier = getHeroItemWeaponClass(item) === "axe" ? 2 : 1;

  return 1 + Math.max(0, deriveHeroStats(hero).meleeDamagePercentBonus) * weaponMultiplier;
}

function isMeleeWeaponShopItem(item: HeroItemDefinition | undefined): item is HeroItemDefinition {
  if (!item || item.kind !== "weapon") {
    return false;
  }

  const weaponClass = getHeroItemWeaponClass(item);

  return weaponClass !== "bow" && weaponClass !== "shuriken";
}

function isShopConsumableAtMax(hero: HeroState, itemIds: readonly HeroItemId[]): boolean {
  return itemIds.every((itemId) => {
    const maxQuantity = getHeroConsumableMaxQuantity(itemId);

    return maxQuantity > 0 && getHeroItemQuantity(hero, itemId) >= maxQuantity;
  });
}

function getHighestShopRarity(rarities: ShopItemRarity[]): ShopItemRarity | undefined {
  return rarities.reduce<ShopItemRarity | undefined>((highest, rarity) => {
    if (!highest || shopRarityRanks[rarity] > shopRarityRanks[highest]) {
      return rarity;
    }

    return highest;
  }, undefined);
}
