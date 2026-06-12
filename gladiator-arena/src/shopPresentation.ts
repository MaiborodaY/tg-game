import {
  HERO_ITEM_CATALOG,
  areHeroItemsEquipped,
  areHeroItemsOwned,
  type HeroItemDefinition,
  type HeroItemId,
  type HeroItemRarity,
  type HeroState,
} from "./hero";

export type ShopItemRarity = HeroItemRarity;
export type ShopProductActionState = "buy" | "equip" | "equipped" | "no-gold";
export type ShopProductStatKind = "armor" | "damage";

const shopRarityLabels: Record<ShopItemRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythical: "Mythical",
};

const shopRarityShortLabels: Record<ShopItemRarity, string> = {
  common: "C",
  uncommon: "U",
  rare: "R",
  epic: "E",
  legendary: "L",
  mythical: "M",
};

const shopRarityRanks: Record<ShopItemRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythical: 6,
};

export function getShopProductStat(itemIds: HeroItemId[], statKind: ShopProductStatKind): number {
  return itemIds.reduce((total, itemId) => total + getShopItemStat(HERO_ITEM_CATALOG[itemId], statKind), 0);
}

export function getEquippedShopProductStat(hero: HeroState, itemIds: HeroItemId[], statKind: ShopProductStatKind): number {
  return itemIds.reduce((total, itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];
    const equippedItemId = item ? hero.equipment[item.equipmentSlot] : null;
    const equippedItem = equippedItemId ? HERO_ITEM_CATALOG[equippedItemId] : undefined;

    return total + getShopItemStat(equippedItem, statKind);
  }, 0);
}

export function getShopProductActionState(hero: HeroState, itemIds: HeroItemId[], price: number): ShopProductActionState {
  if (areHeroItemsEquipped(hero, itemIds)) {
    return "equipped";
  }

  if (areHeroItemsOwned(hero, itemIds)) {
    return "equip";
  }

  return hero.gold >= price ? "buy" : "no-gold";
}

export function getShopProductActionLabel(actionState: ShopProductActionState, price: number): string {
  if (actionState === "equipped") {
    return "Equipped";
  }

  if (actionState === "equip") {
    return "Equip";
  }

  return actionState === "buy" ? `Buy ${price}` : "No gold";
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

function getHighestShopRarity(rarities: ShopItemRarity[]): ShopItemRarity | undefined {
  return rarities.reduce<ShopItemRarity | undefined>((highest, rarity) => {
    if (!highest || shopRarityRanks[rarity] > shopRarityRanks[highest]) {
      return rarity;
    }

    return highest;
  }, undefined);
}
