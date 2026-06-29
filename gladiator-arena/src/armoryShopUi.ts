import {
  HERO_ITEM_CATALOG,
  areHeroItemsEquipped,
  areHeroItemsOwned,
  canHeroEquipItems,
  type HeroEquipmentSlotKey,
  type HeroItemId,
  type HeroState,
} from "./hero";
import {
  DAMAGE_BLOCK_ICON_ASSET_URL,
  SHOP_CATEGORY_ARMS_ICON_ASSET_URL,
  SHOP_CATEGORY_BODY_ICON_ASSET_URL,
  SHOP_CATEGORY_HEAD_ICON_ASSET_URL,
  SHOP_CATEGORY_LEGS_ICON_ASSET_URL,
  SHOP_BACK_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
} from "./assets";
import {
  createEquipmentInlineConfirmAction,
  createEquipmentItemCardContent,
  createEquipmentSlotCard,
  type EquipmentCardAction,
  type EquipmentCardInlineConfirmAction,
} from "./equipmentCardUi";
import { GENERATED_ARMORY_PRODUCTS } from "./generated/equipmentItems.generated";
import { getShopProductIconUrl } from "./shopItemIcons";
import {
  getEquippedShopProductStat,
  getShopProductActionLabel,
  getShopProductActionState,
  getShopProductDisplayName,
  getShopProductLevelRequirement,
  getShopProductRarity,
  getShopProductRequirementBadge,
  getShopProductRequirementDescription,
  getShopProductStat,
  getShopRarityLabel,
  isShopRaritySealed,
  isShopProductSealed,
  type ShopProductActionState,
  type ShopItemRarity,
  type ShopProductRequirementBadge,
} from "./shopPresentation";
import { readUiFilterPreferences, updateUiFilterPreferences } from "./uiFilterPreferences";

export interface ArmoryProduct {
  id: string;
  name: string;
  price: number;
  itemIds: HeroItemId[];
  rarity?: ShopItemRarity;
}

export interface ArmoryShopApi {
  open: () => void;
  close: () => void;
  render: () => void;
  syncHeroState: (options?: ArmoryShopHeroSyncOptions) => void;
}

export interface ArmoryShopHeroSyncOptions {
  product?: ArmoryProduct;
  previousHero?: HeroState;
  pendingProductId?: string | null;
}

interface ArmoryCategory {
  id: string;
  name: string;
  shortLabel: string;
  subcategories: ArmorySubcategory[];
}

interface ArmorySubcategory {
  id: string;
  name: string;
  shortLabel: string;
  products: ArmoryProduct[];
}

interface ArmoryShopOptions {
  getHero: () => HeroState;
  mountPreview?: (parent: HTMLElement) => () => void;
  onBuy: (product: ArmoryProduct) => void;
  onPreview?: (product: ArmoryProduct) => void;
  onPreviewClear?: () => void;
  onPrewarmProducts?: (products: readonly ArmoryProduct[]) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onLayoutChange?: (menuTopY?: number) => void;
  transitionDelayMs?: number;
}

interface ArmorySelectedMetaElements {
  root: HTMLElement;
  name: HTMLElement;
  rarity: HTMLElement;
  stat: HTMLElement;
  statValue: HTMLElement;
  diff: HTMLElement;
  price: HTMLElement;
  priceAmount: HTMLElement;
}

interface ArmorySelectedStripElements {
  card: HTMLElement;
  icon: HTMLImageElement;
  meta: ArmorySelectedMetaElements;
  buyButton: HTMLButtonElement;
}

interface PairedArmorySlotConfig {
  backSlot: HeroEquipmentSlotKey;
  frontSlot: HeroEquipmentSlotKey;
  token: string;
  singularLabel: string;
  pluralLabel: string;
}

interface ArmoryPartFilter {
  id: string;
  name: string;
  shortLabel: string;
  iconUrl: string;
}

interface ArmorySetFilter {
  id: string;
  name: string;
  rank: number;
}

interface ArmoryCategoryToolbarPlaceholder {
  id: string;
  name: string;
  shortLabel: string;
  iconText: string;
}

type ArmoryCategoryToolbarItem = ArmoryPartFilter | ArmoryCategoryToolbarPlaceholder;

function isArmoryCategoryToolbarPlaceholder(item: ArmoryCategoryToolbarItem): item is ArmoryCategoryToolbarPlaceholder {
  return "iconText" in item;
}

interface ArmoryEquippedSlotGroup {
  id: string;
  label: string;
  modifier: string;
  area: string;
  slots: readonly HeroEquipmentSlotKey[];
}

const ARMORY_CATEGORY_PLACEHOLDER_ID = "display-mode-placeholder";
const ARMORY_CATEGORY_SHOULDERS_ICON_URL = new URL("./assets/ui/shop/category-shoulders.webp", import.meta.url).href;
const ARMORY_CATEGORY_WRISTS_ICON_URL = new URL("./assets/ui/shop/category-wrists.webp", import.meta.url).href;
const ARMORY_CATEGORY_SHIELD_ICON_URL = new URL("./assets/shop-icons/shield-common-03.webp", import.meta.url).href;
const ARMORY_CATEGORY_GREAVES_ICON_URL = new URL("./assets/ui/shop/category-greaves.webp", import.meta.url).href;
const ARMORY_CATEGORY_SHINGUARDS_ICON_URL = new URL("./assets/ui/shop/category-shinguards.webp", import.meta.url).href;

const PAIRED_ARMORY_SLOT_CONFIGS: PairedArmorySlotConfig[] = [
  { backSlot: "backShoulderguard", frontSlot: "frontShoulderguard", token: "shoulderguard", singularLabel: "Shoulderguard", pluralLabel: "Shoulders" },
  { backSlot: "backWrist", frontSlot: "frontWrist", token: "wrist", singularLabel: "Wrist", pluralLabel: "Wrists" },
  { backSlot: "backGlove", frontSlot: "frontGlove", token: "glove", singularLabel: "Glove", pluralLabel: "Gloves" },
  { backSlot: "backGreave", frontSlot: "frontGreave", token: "greave", singularLabel: "Greave", pluralLabel: "Greaves" },
  { backSlot: "backShinguard", frontSlot: "frontShinguard", token: "shinguard", singularLabel: "Shinguard", pluralLabel: "Shinguards" },
  { backSlot: "backBoot", frontSlot: "frontBoot", token: "boot", singularLabel: "Boot", pluralLabel: "Boots" },
];

const ARMORY_RARITY_SORT_ORDER: Record<ShopItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
  unique: 6,
};

const ARMORY_RARITIES = Object.keys(ARMORY_RARITY_SORT_ORDER) as ShopItemRarity[];
const ARMORY_RARITY_FILTER_CLASS_NAMES = ARMORY_RARITIES.map(
  (rarity) => `armory-shop__set-filter--rarity-${rarity}`,
);

const ARMORY_SLOT_SORT_ORDER: Record<HeroEquipmentSlotKey, number> = {
  weaponMain: 0,
  weaponBow: 0,
  helmet: 0,
  breastplate: 1,
  backShoulderguard: 2,
  frontShoulderguard: 2,
  backWrist: 3,
  frontWrist: 3,
  backGlove: 4,
  frontGlove: 4,
  shield: 5,
  backGreave: 6,
  frontGreave: 6,
  backShinguard: 7,
  frontShinguard: 7,
  backBoot: 8,
  frontBoot: 8,
};

const SHOP_LAYOUT_SETTLE_DELAYS_MS = [80, 180, 360] as const;
const SHOP_VISIBLE_PREWARM_PRODUCT_LIMIT = 8;
const SHOP_PREWARM_AFTER_SCROLL_DELAY_MS = 140;
const ARMORY_PART_FILTERS: readonly ArmoryPartFilter[] = [
  { id: "helmet", name: "Helmet", shortLabel: "HELM", iconUrl: SHOP_CATEGORY_HEAD_ICON_ASSET_URL },
  { id: "breastplate", name: "Breastplate", shortLabel: "BODY", iconUrl: SHOP_CATEGORY_BODY_ICON_ASSET_URL },
  { id: "shoulders", name: "Shoulders", shortLabel: "SHLD", iconUrl: ARMORY_CATEGORY_SHOULDERS_ICON_URL },
  { id: "wrists", name: "Wrists", shortLabel: "WRST", iconUrl: ARMORY_CATEGORY_WRISTS_ICON_URL },
  { id: "gloves", name: "Gloves", shortLabel: "GLV", iconUrl: SHOP_CATEGORY_ARMS_ICON_ASSET_URL },
  { id: "shield", name: "Shield", shortLabel: "SHLD", iconUrl: ARMORY_CATEGORY_SHIELD_ICON_URL },
  { id: "greaves", name: "Greaves", shortLabel: "GRV", iconUrl: ARMORY_CATEGORY_GREAVES_ICON_URL },
  { id: "shinguards", name: "Shinguards", shortLabel: "SHIN", iconUrl: ARMORY_CATEGORY_SHINGUARDS_ICON_URL },
  { id: "boots", name: "Boots", shortLabel: "BOOT", iconUrl: SHOP_CATEGORY_LEGS_ICON_ASSET_URL },
];
const ARMORY_CATEGORY_TOOLBAR_ITEMS: readonly ArmoryCategoryToolbarItem[] = [
  ...ARMORY_PART_FILTERS,
  {
    id: ARMORY_CATEGORY_PLACEHOLDER_ID,
    name: "Two columns",
    shortLabel: "2COL",
    iconText: "2",
  },
];
const ARMORY_PART_FILTER_BY_SLOT: Partial<Record<HeroEquipmentSlotKey, string>> = {
  helmet: "helmet",
  breastplate: "breastplate",
  backShoulderguard: "shoulders",
  frontShoulderguard: "shoulders",
  backWrist: "wrists",
  frontWrist: "wrists",
  backGlove: "gloves",
  frontGlove: "gloves",
  shield: "shield",
  backGreave: "greaves",
  frontGreave: "greaves",
  backShinguard: "shinguards",
  frontShinguard: "shinguards",
  backBoot: "boots",
  frontBoot: "boots",
};

const ARMORY_EQUIPPED_SLOT_GROUPS: readonly ArmoryEquippedSlotGroup[] = [
  { id: "helmet", label: "Helmet", modifier: "head", area: "helmet", slots: ["helmet"] },
  { id: "breastplate", label: "Breastplate", modifier: "body", area: "body", slots: ["breastplate"] },
  { id: "shoulders", label: "Shoulders", modifier: "shoulders", area: "shoulders", slots: ["backShoulderguard", "frontShoulderguard"] },
  { id: "wrists", label: "Wrists", modifier: "wrists", area: "wrists", slots: ["backWrist", "frontWrist"] },
  { id: "gloves", label: "Gloves", modifier: "gloves", area: "gloves", slots: ["backGlove", "frontGlove"] },
  { id: "shield", label: "Shield", modifier: "shield", area: "shield", slots: ["shield"] },
  { id: "greaves", label: "Greaves", modifier: "greaves", area: "greaves", slots: ["backGreave", "frontGreave"] },
  { id: "shinguards", label: "Shinguards", modifier: "shinguards", area: "shinguards", slots: ["backShinguard", "frontShinguard"] },
  { id: "boots", label: "Boots", modifier: "boots", area: "boots", slots: ["backBoot", "frontBoot"] },
];

const ARMORY_CATEGORIES: ArmoryCategory[] = [
  {
    id: "head",
    name: "Head",
    shortLabel: "HEAD",
    subcategories: [
      {
        id: "head",
        name: "Head",
        shortLabel: "HEAD",
        products: getGeneratedArmoryProductsForSlots(["helmet"]),
      },
    ],
  },
  {
    id: "body",
    name: "Body",
    shortLabel: "BODY",
    subcategories: [
      {
        id: "chest",
        name: "Chest",
        shortLabel: "CHEST",
        products: getGeneratedArmoryProductsForSlots(["breastplate"]),
      },
    ],
  },
  {
    id: "arms",
    name: "Arms",
    shortLabel: "ARMS",
    subcategories: [
      {
        id: "shoulders",
        name: "Shoulders",
        shortLabel: "SHLD",
        products: getGeneratedArmoryProductsForSlots(["backShoulderguard", "frontShoulderguard"]),
      },
      {
        id: "forearms",
        name: "Forearms",
        shortLabel: "FORE",
        products: getGeneratedArmoryProductsForSlots(["backWrist", "frontWrist"]),
      },
      {
        id: "hands",
        name: "Hands",
        shortLabel: "HAND",
        products: getGeneratedArmoryProductsForSlots(["backGlove", "frontGlove"]),
      },
      {
        id: "shields",
        name: "Shields",
        shortLabel: "SHLD",
        products: getGeneratedArmoryProductsForSlots(["shield"]),
      },
    ],
  },
  {
    id: "legs",
    name: "Legs",
    shortLabel: "LEGS",
    subcategories: [
      {
        id: "thighs",
        name: "Thighs",
        shortLabel: "THIGH",
        products: getGeneratedArmoryProductsForSlots(["backGreave", "frontGreave"]),
      },
      {
        id: "shins",
        name: "Shins",
        shortLabel: "SHIN",
        products: getGeneratedArmoryProductsForSlots(["backShinguard", "frontShinguard"]),
      },
      {
        id: "feet",
        name: "Feet",
        shortLabel: "FOOT",
        products: getGeneratedArmoryProductsForSlots(["backBoot", "frontBoot"]),
      },
    ],
  },
];

export function getGeneratedArmoryProductsForSlots(slotKeys: readonly HeroEquipmentSlotKey[]): ArmoryProduct[] {
  const products = GENERATED_ARMORY_PRODUCTS.flatMap((product) => {
    const item = product.itemIds[0] ? HERO_ITEM_CATALOG[product.itemIds[0]] : undefined;

    if (!item || !slotKeys.some((slotKey) => slotKey === item.equipmentSlot)) {
      return [];
    }

    return [
      {
        id: product.id,
        name: product.name,
        price: product.price,
        itemIds: [...product.itemIds],
      },
    ];
  });

  return pairGeneratedArmoryProducts(products);
}

function getArmoryCategoryProducts(category: ArmoryCategory): ArmoryProduct[] {
  return category.subcategories.flatMap((subcategory) => subcategory.products);
}

function getArmoryCatalogProducts(): ArmoryProduct[] {
  return ARMORY_CATEGORIES.flatMap(getArmoryCategoryProducts);
}

function getSortedArmoryCatalogProducts(): ArmoryProduct[] {
  return getArmoryCatalogProducts().sort(compareArmoryProducts);
}

function filterArmoryProductsByRarity(products: readonly ArmoryProduct[], rarity: ShopItemRarity | undefined): ArmoryProduct[] {
  if (!rarity) {
    return [...products];
  }

  return products.filter((product) => getShopProductRarity(product.itemIds, product.rarity) === rarity);
}

function filterArmoryProductsBySet(products: readonly ArmoryProduct[], setId: string | undefined): ArmoryProduct[] {
  if (!setId) {
    return [...products];
  }

  return products.filter((product) => getArmoryProductSetFilter(product)?.id === setId);
}

function getAvailableArmoryRarities(hero: HeroState, products: readonly ArmoryProduct[]): ShopItemRarity[] {
  const rarities = new Set(products.map((product) => getShopProductRarity(product.itemIds, product.rarity)));

  return ARMORY_RARITIES.filter((rarity) => rarities.has(rarity) && !isShopRaritySealed(hero, rarity));
}

function getAvailableArmorySetFilters(products: readonly ArmoryProduct[]): ArmorySetFilter[] {
  const setsById = new Map<string, ArmorySetFilter>();

  products.forEach((product) => {
    const setFilter = getArmoryProductSetFilter(product);

    if (setFilter && !setsById.has(setFilter.id)) {
      setsById.set(setFilter.id, setFilter);
    }
  });

  return [...setsById.values()].sort((left, right) => left.rank - right.rank || left.name.localeCompare(right.name));
}

function filterArmoryProductsByParts(products: readonly ArmoryProduct[], partIds: ReadonlySet<string>): ArmoryProduct[] {
  if (partIds.size === 0) {
    return [...products];
  }

  return products.filter((product) => {
    const partId = getArmoryProductPartFilterId(product);

    return partId ? partIds.has(partId) : true;
  });
}

function getDefaultArmoryPartFilterIds(): Set<string> {
  return new Set();
}

function getStoredArmoryPartFilterIds(partIds: readonly string[] | undefined): Set<string> {
  if (!partIds) {
    return getDefaultArmoryPartFilterIds();
  }

  const availablePartIds = new Set(ARMORY_PART_FILTERS.map((part) => part.id));
  const storedPartIds = partIds.filter((partId) => availablePartIds.has(partId));

  return storedPartIds.length >= ARMORY_PART_FILTERS.length ? getDefaultArmoryPartFilterIds() : new Set(storedPartIds);
}

function getStoredArmoryRarity(rarity: string | undefined): ShopItemRarity | undefined {
  return ARMORY_RARITIES.includes(rarity as ShopItemRarity) ? (rarity as ShopItemRarity) : undefined;
}

function compareArmoryProducts(left: ArmoryProduct, right: ArmoryProduct): number {
  const rarityDifference = getArmoryProductRarityOrder(left) - getArmoryProductRarityOrder(right);

  if (rarityDifference !== 0) {
    return rarityDifference;
  }

  const setDifference = getArmoryProductSetOrder(left) - getArmoryProductSetOrder(right);

  if (setDifference !== 0) {
    return setDifference;
  }

  const slotDifference = getArmoryProductSlotOrder(left) - getArmoryProductSlotOrder(right);

  if (slotDifference !== 0) {
    return slotDifference;
  }

  const armorDifference = getShopProductStat(left.itemIds, "armor") - getShopProductStat(right.itemIds, "armor");

  if (armorDifference !== 0) {
    return armorDifference;
  }

  const priceDifference = left.price - right.price;

  if (priceDifference !== 0) {
    return priceDifference;
  }

  return left.name.localeCompare(right.name);
}

function getArmoryProductRarityOrder(product: ArmoryProduct): number {
  return ARMORY_RARITY_SORT_ORDER[getShopProductRarity(product.itemIds, product.rarity)];
}

function getArmoryProductSetOrder(product: ArmoryProduct): number {
  return Math.min(
    Number.MAX_SAFE_INTEGER,
    ...product.itemIds.map((itemId) => HERO_ITEM_CATALOG[itemId]?.equipmentSet?.rank ?? Number.MAX_SAFE_INTEGER),
  );
}

function getArmoryProductSetFilter(product: ArmoryProduct): ArmorySetFilter | undefined {
  const setInfo = product.itemIds.flatMap((itemId) => {
    const equipmentSet = HERO_ITEM_CATALOG[itemId]?.equipmentSet;

    return equipmentSet ? [equipmentSet] : [];
  })[0];

  return setInfo ? { id: setInfo.id, name: setInfo.name, rank: setInfo.rank } : undefined;
}

function getArmoryProductPartFilterId(product: ArmoryProduct): string | undefined {
  return product.itemIds.flatMap((itemId) => {
    const slotKey = HERO_ITEM_CATALOG[itemId]?.equipmentSlot;
    const partId = slotKey ? ARMORY_PART_FILTER_BY_SLOT[slotKey] : undefined;

    return partId ? [partId] : [];
  })[0];
}

function getArmoryProductSlotOrder(product: ArmoryProduct): number {
  return Math.min(
    Number.MAX_SAFE_INTEGER,
    ...product.itemIds.map((itemId) => {
      const slotKey = HERO_ITEM_CATALOG[itemId]?.equipmentSlot;

      return slotKey ? ARMORY_SLOT_SORT_ORDER[slotKey] : Number.MAX_SAFE_INTEGER;
    }),
  );
}

export function pairGeneratedArmoryProducts(products: ArmoryProduct[]): ArmoryProduct[] {
  const pairedProducts: ArmoryProduct[] = [];
  const usedProductIds = new Set<string>();

  products.forEach((product) => {
    if (usedProductIds.has(product.id)) {
      return;
    }

    const item = getArmoryProductItem(product);
    const pairConfig = item ? getPairedArmorySlotConfig(item.equipmentSlot) : undefined;
    const counterpart = pairConfig ? findArmoryProductPair(product, products, pairConfig, usedProductIds) : undefined;

    if (!pairConfig) {
      pairedProducts.push(product);
      usedProductIds.add(product.id);
      return;
    }

    if (!counterpart) {
      usedProductIds.add(product.id);
      return;
    }

    const pairedProduct = createPairedArmoryProduct(product, counterpart, pairConfig);

    pairedProducts.push(pairedProduct ?? product);
    usedProductIds.add(product.id);
    usedProductIds.add(counterpart.id);
  });

  return pairedProducts;
}

function findArmoryProductPair(
  product: ArmoryProduct,
  products: ArmoryProduct[],
  pairConfig: PairedArmorySlotConfig,
  usedProductIds: ReadonlySet<string>,
): ArmoryProduct | undefined {
  const item = getArmoryProductItem(product);
  const pairKey = getArmoryProductPairKey(product, pairConfig);

  if (!item || !pairKey) {
    return undefined;
  }

  const counterpartSlot = item.equipmentSlot === pairConfig.backSlot ? pairConfig.frontSlot : pairConfig.backSlot;

  return products.find((candidate) => {
    const candidateItem = getArmoryProductItem(candidate);

    return (
      candidate.id !== product.id &&
      !usedProductIds.has(candidate.id) &&
      candidateItem?.equipmentSlot === counterpartSlot &&
      getArmoryProductPairKey(candidate, pairConfig) === pairKey
    );
  });
}

function createPairedArmoryProduct(
  product: ArmoryProduct,
  counterpart: ArmoryProduct,
  pairConfig: PairedArmorySlotConfig,
): ArmoryProduct | undefined {
  const productItem = getArmoryProductItem(product);
  const counterpartItem = getArmoryProductItem(counterpart);

  if (!productItem || !counterpartItem) {
    return undefined;
  }

  const backProduct = productItem.equipmentSlot === pairConfig.backSlot ? product : counterpart;
  const frontProduct = productItem.equipmentSlot === pairConfig.frontSlot ? product : counterpart;
  const backItemId = backProduct.itemIds[0];
  const frontItemId = frontProduct.itemIds[0];
  const pairKey = getArmoryProductPairKey(backProduct, pairConfig) ?? backProduct.id;

  if (!backItemId || !frontItemId) {
    return undefined;
  }

  return {
    id: `${pairKey}-pair`,
    name: getPairedArmoryProductName(backProduct, pairConfig),
    price: getPairedArmoryProductPrice(backProduct, frontProduct),
    itemIds: [backItemId, frontItemId],
  };
}

function getPairedArmoryProductPrice(backProduct: ArmoryProduct, frontProduct: ArmoryProduct): number {
  return Math.max(backProduct.price, frontProduct.price);
}

function getArmoryProductItem(product: ArmoryProduct): (typeof HERO_ITEM_CATALOG)[HeroItemId] | undefined {
  const itemId = product.itemIds[0];

  return itemId ? HERO_ITEM_CATALOG[itemId] : undefined;
}

function getPairedArmorySlotConfig(slotKey: HeroEquipmentSlotKey): PairedArmorySlotConfig | undefined {
  return PAIRED_ARMORY_SLOT_CONFIGS.find((config) => config.backSlot === slotKey || config.frontSlot === slotKey);
}

function getArmoryProductPairKey(product: ArmoryProduct, pairConfig: PairedArmorySlotConfig): string | undefined {
  const itemId = product.itemIds[0];

  return itemId ? normalizePairedArmoryText(itemId, pairConfig).toLowerCase() : undefined;
}

function getPairedArmoryProductName(product: ArmoryProduct, pairConfig: PairedArmorySlotConfig): string {
  const sideFreeName = normalizePairedArmoryText(product.name, pairConfig);
  const singularLabelPattern = new RegExp(`\\b${pairConfig.singularLabel}\\b`, "iu");

  return singularLabelPattern.test(sideFreeName)
    ? sideFreeName.replace(singularLabelPattern, pairConfig.pluralLabel)
    : sideFreeName;
}

function normalizePairedArmoryText(value: string, pairConfig: PairedArmorySlotConfig): string {
  return value
    .replace(new RegExp(`(^|[_\\s-])(?:back|front)([_\\s-]+)${pairConfig.token}(?=$|[_\\s-])`, "giu"), `$1${pairConfig.token}`)
    .replace(/\s+/gu, " ")
    .trim();
}

export function mountArmoryShop(root: HTMLElement, options: ArmoryShopOptions): ArmoryShopApi {
  const storedFilterPreferences = readUiFilterPreferences().armoryShop;
  let selectedRarity = getStoredArmoryRarity(storedFilterPreferences?.rarity);
  let selectedSetId = storedFilterPreferences?.setId;
  let isTwoColumnProductMode = storedFilterPreferences?.twoColumn === true;
  let selectedPartFilterIds = getStoredArmoryPartFilterIds(storedFilterPreferences?.partIds);
  let previewProduct: ArmoryProduct | undefined;
  let unmountPreview: (() => void) | undefined;
  let transitionTimer: number | undefined;
  let scrollIndicatorTimer: number | undefined;
  let layoutFrame: number | undefined;
  let layoutSettleTimers: number[] = [];
  let productPrewarmFrame: number | undefined;
  let productPrewarmTimer: number | undefined;
  let pendingProductId: string | undefined;
  let selectedStripElements: ArmorySelectedStripElements | undefined;
  let productButtons = new Map<string, HTMLButtonElement>();
  let productButtonVisualStates = new Map<string, string>();
  let productIdsByItemId = new Map<HeroItemId, Set<string>>();
  let renderedProductsById = new Map<string, ArmoryProduct>();
  let renderedProducts: ArmoryProduct[] = [];
  const usesCityHeroPreview = !options.mountPreview;
  const transitionDelayMs = options.transitionDelayMs ?? 0;

  const shop = document.createElement("section");
  shop.className = usesCityHeroPreview ? "armory-shop armory-shop--city-mode" : "armory-shop";
  shop.hidden = true;
  shop.setAttribute("aria-label", "Armorer");

  const panel = document.createElement("div");
  panel.className = "armory-shop__panel";

  const previewShell = document.createElement("div");
  previewShell.className = "armory-shop__preview-shell";

  const preview = document.createElement("div");
  preview.className = "armory-shop__preview";
  previewShell.append(preview);

  const equipment = document.createElement("div");
  equipment.className = "armory-shop__equipment";
  equipment.setAttribute("aria-label", "Equipped armor");

  const menu = document.createElement("div");
  menu.className = "armory-shop__menu";

  const tray = document.createElement("div");
  tray.className = "armory-shop__tray";

  const header = document.createElement("div");
  header.className = "armory-shop__header";

  const title = document.createElement("h2");
  title.className = "armory-shop__title";

  const rarityFilter = document.createElement("details");
  const rarityFilterSummary = document.createElement("summary");
  const rarityFilterSummaryText = document.createElement("span");
  const rarityFilterPanel = document.createElement("div");
  const rarityFilterInputs = new Map<ShopItemRarity, HTMLInputElement>();

  rarityFilter.className = "armory-shop__parts-filter weapon-shop__rarity-filter";
  rarityFilter.setAttribute("aria-label", "Armor rarity");
  rarityFilterSummary.className = "armory-shop__parts-summary weapon-shop__rarity-summary";
  rarityFilterSummaryText.className = "armory-shop__parts-summary-text";
  rarityFilterSummary.append(rarityFilterSummaryText);
  rarityFilterPanel.className = "armory-shop__parts-panel weapon-shop__rarity-panel";
  rarityFilter.append(rarityFilterSummary, rarityFilterPanel);

  const setFilter = document.createElement("details");
  const setFilterSummary = document.createElement("summary");
  const setFilterSummaryText = document.createElement("span");
  const setFilterPanel = document.createElement("div");
  const setFilterInputs = new Map<string, HTMLInputElement>();

  setFilter.className = "armory-shop__parts-filter armory-shop__sets-filter";
  setFilter.setAttribute("aria-label", "Armor sets");
  setFilterSummary.className = "armory-shop__parts-summary armory-shop__sets-summary";
  setFilterSummaryText.className = "armory-shop__parts-summary-text";
  setFilterSummary.append(setFilterSummaryText);
  setFilterPanel.className = "armory-shop__parts-panel armory-shop__sets-panel";
  setFilter.append(setFilterSummary, setFilterPanel);

  const categoryFilter = document.createElement("div");
  const categoryFilterButtons = new Map<string, HTMLButtonElement>();
  let displayModeButton: HTMLButtonElement | undefined;

  categoryFilter.className = "armory-shop__category-filter";
  categoryFilter.setAttribute("aria-label", "Armor parts");
  ARMORY_CATEGORY_TOOLBAR_ITEMS.forEach((item) => categoryFilter.append(createArmoryCategoryButton(item)));

  const gold = document.createElement("span");
  gold.className = "armory-shop__gold";
  const goldIcon = document.createElement("img");
  const goldAmount = document.createElement("span");

  goldIcon.className = "armory-shop__gold-icon";
  goldIcon.src = SHOP_GOLD_COIN_ICON_ASSET_URL;
  goldIcon.alt = "";
  goldIcon.decoding = "async";
  goldIcon.draggable = false;
  goldAmount.className = "armory-shop__gold-amount";
  gold.append(goldIcon, goldAmount);

  const level = document.createElement("span");
  level.className = "armory-shop__level";
  const levelLabel = document.createElement("span");
  const levelValue = document.createElement("span");

  levelLabel.className = "armory-shop__level-label";
  levelLabel.textContent = "LVL";
  levelValue.className = "armory-shop__level-value";
  level.append(levelLabel, levelValue);

  const headerMeta = document.createElement("div");
  headerMeta.className = "armory-shop__header-meta";

  const footerMeta = document.createElement("div");
  footerMeta.className = "armory-shop__footer-meta";

  const selected = document.createElement("div");
  selected.className = "armory-shop__selected";

  const subcategories = document.createElement("div");
  subcategories.className = "armory-shop__subcategories";

  const content = document.createElement("div");
  content.className = "armory-shop__content";
  content.addEventListener("scroll", showScrollIndicator, { passive: true });

  const scrollIndicator = document.createElement("span");
  scrollIndicator.className = "armory-shop__scroll-indicator";
  scrollIndicator.setAttribute("aria-hidden", "true");

  const back = document.createElement("button");
  const backIcon = document.createElement("img");
  back.className = "armory-shop__back";
  back.type = "button";
  back.setAttribute("aria-label", "Back");
  backIcon.className = "armory-shop__back-icon";
  backIcon.src = SHOP_BACK_ICON_ASSET_URL;
  backIcon.alt = "";
  backIcon.decoding = "async";
  backIcon.draggable = false;
  back.append(backIcon);
  back.addEventListener("click", () => {
    if (previewProduct) {
      const previousProductId = clearProductPreview();

      renderPreviewSelection(previousProductId);
      return;
    }

    close();
  });

  if (usesCityHeroPreview) {
    footerMeta.append(gold, back, level);
    header.append(title, rarityFilter, setFilter, categoryFilter, selected);
    tray.append(header, subcategories, content, footerMeta, scrollIndicator);
    menu.append(tray);
  } else {
    headerMeta.append(gold, level);
    header.append(back, title, rarityFilter, setFilter, categoryFilter, headerMeta);
    tray.append(header, subcategories, selected, content, scrollIndicator);
    menu.append(tray);
  }
  if (options.mountPreview) {
    panel.append(previewShell);
  }
  if (usesCityHeroPreview) {
    panel.append(equipment);
  }
  panel.append(menu);
  shop.append(panel);
  root.append(shop);
  window.addEventListener("resize", scheduleLayoutSync);
  window.visualViewport?.addEventListener("resize", scheduleLayoutSync);
  window.visualViewport?.addEventListener("scroll", scheduleLayoutSync);

  const layoutResizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(scheduleLayoutSync);
  layoutResizeObserver?.observe(root);
  layoutResizeObserver?.observe(menu);
  layoutResizeObserver?.observe(tray);

  function persistArmoryShopFilterPreferences(): void {
    updateUiFilterPreferences((preferences) => ({
      ...preferences,
      armoryShop: {
        rarity: selectedRarity,
        setId: selectedSetId,
        partIds: [...selectedPartFilterIds],
        twoColumn: isTwoColumnProductMode,
      },
    }));
  }

  function open(): void {
    clearTransitionTimer();
    clearProductPreview();
    window.addEventListener("pointerdown", dismissPreviewFromPointerDown, true);
    options.onOpen?.();
    scheduleShopTransition(() => {
      if (usesCityHeroPreview) {
        root.classList.add("city-menu--armory-open");
      }
      shop.hidden = false;
      ensurePreviewMounted();
      render();
      scheduleSettledLayoutSync();
    });
  }

  function close(): void {
    if (shop.hidden && !transitionTimer) {
      return;
    }

    clearTransitionTimer();
    clearProductPreview();
    clearVisibleProductPrewarm();
    options.onPrewarmProducts?.([]);
    window.removeEventListener("pointerdown", dismissPreviewFromPointerDown, true);
    options.onClose?.();
    scheduleShopTransition(() => {
      if (usesCityHeroPreview) {
        root.classList.remove("city-menu--armory-open");
      }
      shop.hidden = true;
      unmountPreview?.();
      unmountPreview = undefined;
      clearScrollIndicator();
      clearLayoutSync();
    });
  }

  function render(): void {
    const hero = options.getHero();
    const sortedProducts = getSortedArmoryCatalogProducts();
    const shopProducts = filterVisibleArmoryShopProducts(hero, sortedProducts);
    const partFilteredProducts = filterArmoryProductsByParts(shopProducts, selectedPartFilterIds);
    const availableSets = getAvailableArmorySetFilters(partFilteredProducts);
    let didNormalizeStoredFilters = false;

    if (previewProduct && !isArmoryProductVisibleInShop(hero, previewProduct)) {
      clearProductPreview();
    }

    if (selectedSetId && !availableSets.some((set) => set.id === selectedSetId)) {
      selectedSetId = undefined;
      didNormalizeStoredFilters = true;
      clearProductPreview();
    }

    const setFilteredProducts = filterArmoryProductsBySet(partFilteredProducts, selectedSetId);
    const availableRarities = getAvailableArmoryRarities(hero, setFilteredProducts);

    if (selectedRarity && !availableRarities.includes(selectedRarity)) {
      selectedRarity = undefined;
      didNormalizeStoredFilters = true;
      clearProductPreview();
    }

    if (didNormalizeStoredFilters) {
      persistArmoryShopFilterPreferences();
    }

    const selectedProducts = filterArmoryProductsByRarity(setFilteredProducts, selectedRarity);

    title.textContent = "Gear";
    shop.classList.toggle("armory-shop--has-set-filter", availableSets.length > 0);
    shop.classList.toggle("armory-shop--two-column", isTwoColumnProductMode);
    setFilter.hidden = availableSets.length === 0;
    if (availableSets.length === 0) {
      setFilter.open = false;
    }
    renderArmoryRarityFilterOptions(availableRarities);
    renderArmorySetFilterOptions(availableSets);
    updateCategoryFilterButtons();
    updateArmoryDisplayModeButton();
    goldAmount.textContent = String(hero.gold);
    gold.setAttribute("aria-label", `Gold ${hero.gold}`);
    levelValue.textContent = String(hero.level);
    level.setAttribute("aria-label", `Level ${hero.level}`);
    renderEquippedSlots(hero);
    subcategories.replaceChildren();
    content.replaceChildren();
    productButtons = new Map();
    productButtonVisualStates = new Map();
    productIdsByItemId = new Map();
    renderedProductsById = new Map(selectedProducts.map((product) => [product.id, product]));
    renderedProducts = selectedProducts;
    clearScrollIndicator();
    clearVisibleProductPrewarm();
    options.onPrewarmProducts?.([]);
    subcategories.hidden = true;
    shop.classList.toggle("armory-shop--has-subcategories", false);
    content.classList.toggle("armory-shop__content--categories", false);
    content.classList.toggle("armory-shop__content--products", true);
    content.classList.toggle("armory-shop__content--confirm", false);
    syncSelectionState();

    renderSelectedProduct(hero);

    scheduleLayoutSync();

    if (selectedProducts.length === 0) {
      content.append(createEmptyState("No items"));
      return;
    }

    selectedProducts.forEach((product) => content.append(createTrackedProductButton(product, hero)));
    scheduleVisibleProductPrewarm();
  }

  function previewArmoryProduct(product: ArmoryProduct): void {
    if (previewProduct?.id === product.id) {
      return;
    }

    const previousProductId = previewProduct?.id;

    clearVisibleProductPrewarm();
    previewProduct = product;
    options.onPreview?.(product);
    renderPreviewSelection(previousProductId);
  }

  function renderPreviewSelection(previousProductId?: string): void {
    const hero = options.getHero();

    renderSelectedProduct(hero);
    updateProductButtonSelection(previousProductId, hero);
    scheduleLayoutSync();
  }

  function syncSelectionState(): void {
    const hasSelection = Boolean(previewProduct);

    shop.classList.remove("armory-shop--has-selection");
    shop.classList.toggle("armory-shop--has-inline-confirm", hasSelection);
    selected.hidden = true;
    content.classList.toggle("armory-shop__content--has-selection", false);
  }

  function renderSelectedProduct(_hero: HeroState): void {
    syncSelectionState();
    selected.replaceChildren();
  }

  function ensureSelectedStripElements(): ArmorySelectedStripElements {
    if (!selectedStripElements) {
      selectedStripElements = createSelectedProductStrip(() => {
        if (!previewProduct) {
          return;
        }

        const product = previewProduct;

        previewProduct = undefined;
        options.onBuy(product);
      });
      selected.replaceChildren(selectedStripElements.card);
    }

    return selectedStripElements;
  }

  function updateProductButtonSelection(previousProductId: string | undefined, hero: HeroState): void {
    const nextProductId = previewProduct?.id;

    if (previousProductId && previousProductId !== nextProductId) {
      refreshProductButton(previousProductId, hero, true);
    }

    if (nextProductId) {
      refreshProductButton(nextProductId, hero, true);
    }
  }

  function ensurePreviewMounted(): void {
    if (unmountPreview || !options.mountPreview) {
      return;
    }

    unmountPreview = options.mountPreview(preview);
  }

  function updateCategoryFilterButtons(): void {
    ARMORY_PART_FILTERS.forEach((part) => {
      const button = categoryFilterButtons.get(part.id);

      if (button) {
        const isActive = selectedPartFilterIds.has(part.id);

        button.classList.toggle("armory-shop__category-button--active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      }
    });
  }

  function renderArmoryRarityFilterOptions(availableRarities: readonly ShopItemRarity[]): void {
    rarityFilterInputs.clear();
    rarityFilterPanel.replaceChildren(...availableRarities.map(createArmoryRarityFilterOption));
    updateArmoryRarityFilterVisual();
  }

  function updateArmoryRarityFilterVisual(): void {
    rarityFilter.classList.remove(...ARMORY_RARITY_FILTER_CLASS_NAMES);
    rarityFilterInputs.forEach((input) => {
      input.checked = selectedRarity === (input.value as ShopItemRarity);
    });
    rarityFilterSummaryText.textContent = "Rarity";

    if (selectedRarity) {
      rarityFilter.classList.add(`armory-shop__set-filter--rarity-${selectedRarity}`);
    }
  }

  function createArmoryRarityFilterOption(rarity: ShopItemRarity): HTMLLabelElement {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");

    label.className = `armory-shop__parts-option weapon-shop__rarity-option armory-shop__set-filter-option--rarity-${rarity}`;
    input.className = "armory-shop__parts-checkbox weapon-shop__rarity-checkbox";
    input.type = "checkbox";
    input.name = "armory-shop-rarity-filter";
    input.value = rarity;
    text.className = "armory-shop__parts-option-text weapon-shop__rarity-option-text";
    text.textContent = getShopRarityLabel(rarity);
    input.addEventListener("change", () => {
      selectedRarity = input.checked ? rarity : undefined;
      persistArmoryShopFilterPreferences();
      clearProductPreview();
      updateArmoryRarityFilterVisual();
      render();
    });

    rarityFilterInputs.set(rarity, input);
    label.append(input, text);

    return label;
  }

  function createArmoryCategoryButton(item: ArmoryCategoryToolbarItem): HTMLButtonElement {
    const button = document.createElement("button");

    button.className = "armory-shop__category-button";
    button.type = "button";
    button.title = item.name;
    button.setAttribute("aria-label", item.name);
    button.setAttribute("aria-pressed", "false");

    if (isArmoryCategoryToolbarPlaceholder(item)) {
      const icon = document.createElement("span");

      button.classList.add("armory-shop__category-button--placeholder", "armory-shop__category-button--display-mode");
      button.title = "Two columns";
      button.setAttribute("aria-label", "Two columns");
      icon.className = "armory-shop__category-placeholder";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = item.iconText;
      button.addEventListener("click", () => {
        closeRarityFilter();
        closeSetFilter();
        isTwoColumnProductMode = !isTwoColumnProductMode;
        persistArmoryShopFilterPreferences();
        shop.classList.toggle("armory-shop--two-column", isTwoColumnProductMode);
        updateArmoryDisplayModeButton();
        scheduleLayoutSync();
        scheduleVisibleProductPrewarm();
      });
      button.append(icon);
      displayModeButton = button;

      return button;
    }

    const icon = document.createElement("img");

    icon.className = "armory-shop__category-icon";
    icon.src = item.iconUrl;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    button.addEventListener("click", () => {
      closeRarityFilter();
      closeSetFilter();

      if (selectedPartFilterIds.size === 1 && selectedPartFilterIds.has(item.id)) {
        selectedPartFilterIds = getDefaultArmoryPartFilterIds();
      } else {
        selectedPartFilterIds = new Set([item.id]);
      }

      persistArmoryShopFilterPreferences();
      clearProductPreview();
      updateCategoryFilterButtons();
      render();
    });

    categoryFilterButtons.set(item.id, button);
    button.append(icon);

    return button;
  }

  function updateArmoryDisplayModeButton(): void {
    if (!displayModeButton) {
      return;
    }

    displayModeButton.classList.toggle("armory-shop__category-button--active", isTwoColumnProductMode);
    displayModeButton.setAttribute("aria-pressed", String(isTwoColumnProductMode));
    displayModeButton.title = isTwoColumnProductMode ? "One column" : "Two columns";
    displayModeButton.setAttribute("aria-label", displayModeButton.title);
  }

  function closeRarityFilter(): void {
    rarityFilter.open = false;
  }

  function closeSetFilter(): void {
    setFilter.open = false;
  }

  function renderArmorySetFilterOptions(availableSets: readonly ArmorySetFilter[]): void {
    setFilterInputs.clear();
    setFilterPanel.replaceChildren(...availableSets.map(createArmorySetFilterOption));
    updateArmorySetFilterVisual(availableSets);
  }

  function updateArmorySetFilterVisual(availableSets: readonly ArmorySetFilter[]): void {
    const selectedSet = availableSets.find((set) => set.id === selectedSetId);

    setFilterInputs.forEach((input) => {
      input.checked = selectedSetId === input.value;
    });
    setFilterSummaryText.textContent = selectedSet?.name ?? "Sets";
  }

  function createArmorySetFilterOption(set: ArmorySetFilter): HTMLLabelElement {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");

    label.className = "armory-shop__parts-option armory-shop__sets-option";
    input.className = "armory-shop__parts-checkbox armory-shop__sets-checkbox";
    input.type = "checkbox";
    input.name = "armory-shop-set-filter";
    input.value = set.id;
    text.className = "armory-shop__parts-option-text armory-shop__sets-option-text";
    text.textContent = set.name;
    input.addEventListener("change", () => {
      selectedSetId = input.checked ? set.id : undefined;
      persistArmoryShopFilterPreferences();
      clearProductPreview();
      render();
    });

    setFilterInputs.set(set.id, input);
    label.append(input, text);

    return label;
  }

  function createProductButton(product: ArmoryProduct, hero: HeroState, isSelected: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const armor = getShopProductStat(product.itemIds, "armor");
    const currentArmor = getEquippedShopProductStat(hero, product.itemIds, "armor");
    const cardState = getArmoryProductCardState(hero, product);
    const actionState = getArmoryProductActionState(hero, product);
    const isPending = pendingProductId === product.id;
    const inlineConfirmAction = isSelected
      ? isPending
        ? getPendingProductInlineConfirmAction()
        : getProductInlineConfirmAction(actionState, product.price)
      : undefined;
    const displayName = getShopProductDisplayName(product.name);
    const requirementBadge = getShopProductRequirementBadge(hero, product.itemIds);
    const requirementDescription = getShopProductRequirementDescription(hero, product.itemIds);

    button.className = `equipment-item-card armory-shop__option armory-shop__option--product armory-shop__option--rarity-${rarity}`;
    button.classList.toggle("equipment-item-card--selected", isSelected);
    button.classList.toggle("armory-shop__option--selected", isSelected);
    button.classList.toggle("equipment-item-card--equipped", cardState === "equipped");
    button.classList.toggle("armory-shop__option--owned", cardState === "equip");
    button.classList.toggle("armory-shop__option--equipped", cardState === "equipped");
    button.classList.toggle("armory-shop__option--for-sale", cardState === "buy");
    button.classList.toggle("armory-shop__option--locked", cardState === "locked");
    button.classList.toggle("armory-shop__option--sealed", cardState === "sealed" || cardState === "locked");
    button.classList.toggle("armory-shop__option--inline-confirm", Boolean(inlineConfirmAction));
    button.classList.toggle("armory-shop__option--pending", isPending);
    button.type = "button";
    button.disabled = isPending || cardState === "sealed" || cardState === "locked";
    button.title = cardState === "sealed" ? `${displayName} - SEALED` : requirementDescription ? `${displayName} - ${requirementDescription}` : displayName;
    button.setAttribute(
      "aria-label",
      `${displayName}, ${getShopRarityLabel(rarity)}, ${armor} armor, ${
        isPending
          ? "buying"
          : inlineConfirmAction
          ? inlineConfirmAction.state === "buy"
            ? `selected, buy for ${product.price} gold`
            : `selected, not enough gold, ${product.price} gold`
          : requirementDescription || getShopProductActionLabel(actionState, product.price)
      }`,
    );
    const cardContent = createEquipmentItemCardContent({
      iconUrl,
      name: displayName,
      rarityLabel: getShopRarityLabel(rarity),
      statIconUrl: DAMAGE_BLOCK_ICON_ASSET_URL,
      statLabel: "armor",
      statValue: armor,
      diff: armor - currentArmor,
      levelRequirement: inlineConfirmAction ? undefined : getShopProductLevelRequirement(product.itemIds),
      action: inlineConfirmAction ? undefined : isPending ? getPendingProductCardAction() : getProductCardAction(actionState, product.price),
    });

    if (inlineConfirmAction) {
      cardContent.classList.add("equipment-item-card__content--with-inline-confirm");
      cardContent.append(createEquipmentInlineConfirmAction(inlineConfirmAction));
    }

    button.append(cardContent);
    if (cardState === "sealed") {
      button.append(createSealedRibbon());
    }
    if (cardState === "locked" && requirementBadge) {
      button.append(createRequirementRibbon(requirementBadge));
    }
    button.addEventListener("click", (event) => {
      if (button.disabled || (pendingProductId && !isPending)) {
        return;
      }

      if (isSelected) {
        const target = event.target;
        const confirmAction =
          target instanceof Element ? target.closest(".equipment-item-card__confirm-action") : undefined;

        if (confirmAction && button.contains(confirmAction) && inlineConfirmAction?.state === "buy") {
          options.onBuy(product);
        }

        return;
      }

      previewArmoryProduct(product);
    });

    return button;
  }

  function createTrackedProductButton(product: ArmoryProduct, hero: HeroState): HTMLButtonElement {
    const button = createProductButton(product, hero, previewProduct?.id === product.id);

    productButtons.set(product.id, button);
    productButtonVisualStates.set(product.id, getProductButtonVisualState(hero, product));
    product.itemIds.forEach((itemId) => addProductIdToItemIndex(itemId, product.id));

    return button;
  }

  function renderEquippedSlots(hero: HeroState): void {
    if (!usesCityHeroPreview) {
      return;
    }

    const renderKey = getArmoryEquippedSlotsRenderKey(hero);

    if (equipment.dataset.armoryEquippedSlotsRenderKey === renderKey) {
      return;
    }

    equipment.dataset.armoryEquippedSlotsRenderKey = renderKey;
    equipment.replaceChildren(...ARMORY_EQUIPPED_SLOT_GROUPS.map((group) => createEquippedSlot(group, hero)));
  }

  function createEquippedSlot(group: ArmoryEquippedSlotGroup, hero: HeroState): HTMLElement {
    const itemIds = getEquippedSlotItemIds(group, hero);
    const items = itemIds.flatMap((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      return item ? [item] : [];
    });
    const iconUrl = getShopProductIconUrl(itemIds);
    const rarity = itemIds.length > 0 ? getShopProductRarity(itemIds) : "empty";
    const label = items.length > 0
      ? `${group.label}: ${items.map((item) => getShopProductDisplayName(item.name)).join(", ")}`
      : `${group.label}: empty`;

    return createEquipmentSlotCard({
      tagName: "div",
      classNames: [
        "armory-shop__equipped-slot",
        `armory-shop__equipped-slot--${group.modifier}`,
        `armory-shop__equipped-slot--area-${group.area}`,
        `armory-shop__equipped-slot--${rarity}`,
      ],
      iconClassNames: ["armory-shop__equipped-icon"],
      rarity,
      rarityClassName: rarity !== "empty" ? `armory-shop__option--rarity-${rarity}` : undefined,
      iconUrl,
      fallbackText: group.label.slice(0, 1),
      label,
    });
  }

  function getEquippedSlotItemIds(group: ArmoryEquippedSlotGroup, hero: HeroState): HeroItemId[] {
    return group.slots.flatMap((slotKey): HeroItemId[] => {
      const itemId = hero.equipment[slotKey];

      return itemId ? [itemId] : [];
    });
  }

  function getArmoryEquippedSlotsRenderKey(hero: HeroState): string {
    return ARMORY_EQUIPPED_SLOT_GROUPS.flatMap((group) =>
      group.slots.map((slotKey) => `${slotKey}:${hero.equipment[slotKey] ?? ""}`),
    ).join("|");
  }

  function syncHeroState(syncOptions: ArmoryShopHeroSyncOptions = {}): void {
    const previousPendingProductId = pendingProductId;

    if ("pendingProductId" in syncOptions) {
      pendingProductId = syncOptions.pendingProductId ?? undefined;
      shop.classList.toggle("armory-shop--purchase-pending", Boolean(pendingProductId));
    }

    if (shop.hidden) {
      return;
    }

    const hero = options.getHero();

    updateShopHeroMeta(hero);
    renderEquippedSlots(hero);
    refreshChangedProductButtons(hero, syncOptions, previousPendingProductId);
    renderSelectedProduct(hero);
    scheduleLayoutSync();
  }

  function updateShopHeroMeta(hero: HeroState): void {
    goldAmount.textContent = String(hero.gold);
    gold.setAttribute("aria-label", `Gold ${hero.gold}`);
    levelValue.textContent = String(hero.level);
    level.setAttribute("aria-label", `Level ${hero.level}`);
  }

  function addProductIdToItemIndex(itemId: HeroItemId, productId: string): void {
    const productIds = productIdsByItemId.get(itemId) ?? new Set<string>();

    productIds.add(productId);
    productIdsByItemId.set(itemId, productIds);
  }

  function refreshChangedProductButtons(hero: HeroState, syncOptions: ArmoryShopHeroSyncOptions, previousPendingProductId?: string): void {
    const hiddenProducts = renderedProducts.filter((product) => !isArmoryProductVisibleInShop(hero, product));

    if (hiddenProducts.length > 0) {
      if (syncOptions.product && hiddenProducts.length === 1 && hiddenProducts[0]?.id === syncOptions.product.id) {
        removeRenderedProduct(hiddenProducts[0]);
        refreshVisibleProductButtons(hero);
        return;
      }

      render();
      return;
    }

    if ("pendingProductId" in syncOptions) {
      if (previousPendingProductId) {
        refreshProductButton(previousPendingProductId, hero, true);
      }
      if (pendingProductId) {
        refreshProductButton(pendingProductId, hero, true);
      }
      return;
    }

    const productIds = getProductButtonRefreshIds(syncOptions.product, syncOptions.previousHero);

    if (productIds) {
      productIds.forEach((productId) => refreshProductButton(productId, hero));
      return;
    }

    refreshVisibleProductButtons(hero);
  }

  function refreshVisibleProductButtons(hero: HeroState): void {
    renderedProducts.forEach((product) => refreshProductButton(product.id, hero));
  }

  function removeRenderedProduct(product: ArmoryProduct): void {
    productButtons.get(product.id)?.remove();
    productButtons.delete(product.id);
    productButtonVisualStates.delete(product.id);
    renderedProductsById.delete(product.id);
    renderedProducts = renderedProducts.filter((renderedProduct) => renderedProduct.id !== product.id);
    product.itemIds.forEach((itemId) => removeProductIdFromItemIndex(itemId, product.id));

    if (previewProduct?.id === product.id) {
      clearProductPreview();
    }

    if (renderedProducts.length === 0) {
      content.append(createEmptyState("No items"));
    }
  }

  function refreshProductButton(productId: string, hero: HeroState, force = false): void {
    const product = renderedProductsById.get(productId);

    if (!product) {
      return;
    }

    const currentButton = productButtons.get(product.id);

    if (!currentButton) {
      return;
    }

    const nextVisualState = getProductButtonVisualState(hero, product);

    if (!force && productButtonVisualStates.get(product.id) === nextVisualState) {
      return;
    }

    const nextButton = createProductButton(product, hero, previewProduct?.id === product.id);

    currentButton.replaceWith(nextButton);
    productButtons.set(product.id, nextButton);
    productButtonVisualStates.set(product.id, nextVisualState);
  }

  function getProductButtonRefreshIds(product: ArmoryProduct | undefined, previousHero: HeroState | undefined): Set<string> | undefined {
    if (!product) {
      return undefined;
    }

    const productIds = new Set<string>();

    productIds.add(product.id);
    product.itemIds.forEach((itemId) => addIndexedProductIds(productIds, itemId));

    if (previousHero) {
      getProductEquipmentSlots(product).forEach((slotKey) => {
        const previousItemId = previousHero.equipment[slotKey];

        if (previousItemId) {
          addIndexedProductIds(productIds, previousItemId);
        }
      });
    }

    return productIds;
  }

  function addIndexedProductIds(productIds: Set<string>, itemId: HeroItemId): void {
    productIdsByItemId.get(itemId)?.forEach((productId) => productIds.add(productId));
  }

  function removeProductIdFromItemIndex(itemId: HeroItemId, productId: string): void {
    const productIds = productIdsByItemId.get(itemId);

    if (!productIds) {
      return;
    }

    productIds.delete(productId);
    if (productIds.size === 0) {
      productIdsByItemId.delete(itemId);
    }
  }

  function getProductEquipmentSlots(product: ArmoryProduct): HeroEquipmentSlotKey[] {
    return product.itemIds.flatMap((itemId) => {
      const slotKey = HERO_ITEM_CATALOG[itemId]?.equipmentSlot;

      return slotKey ? [slotKey] : [];
    });
  }

  function getProductButtonVisualState(hero: HeroState, product: ArmoryProduct): string {
    return `${getArmoryProductActionState(hero, product)}|${pendingProductId === product.id ? "pending" : ""}`;
  }

  function getArmoryProductCardState(hero: HeroState, product: ArmoryProduct): ShopProductActionState {
    if (areHeroItemsEquipped(hero, product.itemIds)) {
      return "equipped";
    }

    if (!canHeroEquipItems(hero, product.itemIds)) {
      return "locked";
    }

    if (areHeroItemsOwned(hero, product.itemIds)) {
      return "equip";
    }

    return isShopProductSealed(hero, product.itemIds, product.rarity) ? "sealed" : "buy";
  }

  function filterVisibleArmoryShopProducts(hero: HeroState, products: readonly ArmoryProduct[]): ArmoryProduct[] {
    return products.filter((product) => isArmoryProductVisibleInShop(hero, product));
  }

  function isArmoryProductVisibleInShop(hero: HeroState, product: ArmoryProduct): boolean {
    return (
      !areHeroItemsOwned(hero, product.itemIds) &&
      !isShopProductSealed(hero, product.itemIds, product.rarity)
    );
  }

  function createSelectedProductStrip(onBuy: () => void): ArmorySelectedStripElements {
    const strip = document.createElement("div");
    const icon = document.createElement("img");
    const meta = createSelectedMeta();
    const button = document.createElement("button");

    strip.className = "armory-shop__selected-card";
    icon.className = "armory-shop__selected-icon";
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    button.className = "armory-shop__selected-buy";
    button.type = "button";
    button.addEventListener("click", onBuy);
    strip.append(icon, meta.root, button);

    return {
      card: strip,
      icon,
      meta,
      buyButton: button,
    };
  }

  function updateSelectedProductStrip(elements: ArmorySelectedStripElements, product: ArmoryProduct, hero: HeroState): void {
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const armor = getShopProductStat(product.itemIds, "armor");
    const currentArmor = getEquippedShopProductStat(hero, product.itemIds, "armor");
    const displayName = getShopProductDisplayName(product.name);
    const actionState = getArmoryProductActionState(hero, product);
    const isPending = pendingProductId === product.id;

    elements.card.className = `armory-shop__selected-card armory-shop__selected-card--rarity-${rarity}`;
    elements.icon.hidden = !iconUrl;
    if (iconUrl && elements.icon.src !== iconUrl) {
      elements.icon.src = iconUrl;
    }

    updateSelectedMeta(elements.meta, displayName, rarity, "armor", armor, currentArmor, product.price);
    elements.buyButton.disabled = isPending || actionState === "equipped" || actionState === "no-gold" || actionState === "sealed" || actionState === "locked";
    elements.buyButton.classList.toggle("armory-shop__selected-buy--price", !isPending && (actionState === "buy" || actionState === "no-gold"));
    elements.buyButton.replaceChildren();
    if (isPending) {
      elements.buyButton.textContent = "BUYING";
      elements.buyButton.setAttribute("aria-label", `Buying ${displayName}`);
    } else if (actionState === "buy" || actionState === "no-gold") {
      appendPriceContent(elements.buyButton, product.price);
    } else {
      elements.buyButton.textContent = getShopProductActionLabel(actionState, product.price);
      elements.buyButton.removeAttribute("aria-label");
    }
  }

  function updateSelectedMeta(
    meta: ArmorySelectedMetaElements,
    productName: string,
    rarity: ShopItemRarity,
    statLabel: string,
    stat: number,
    currentStat: number,
    price: number,
  ): void {
    meta.name.textContent = productName;
    meta.rarity.textContent = getShopRarityLabel(rarity);
    meta.stat.setAttribute("aria-label", `${statLabel} ${stat}`);
    meta.statValue.textContent = String(stat);
    updateSelectedDiffChip(meta.diff, stat - currentStat);
    meta.price.setAttribute("aria-label", `${price} gold`);
    meta.priceAmount.textContent = String(price);
  }

  function clearProductPreview(): string | undefined {
    if (!previewProduct) {
      return undefined;
    }

    const previousProductId = previewProduct.id;

    previewProduct = undefined;
    options.onPreviewClear?.();

    return previousProductId;
  }

  function getArmoryProductActionState(hero: HeroState, product: ArmoryProduct): ShopProductActionState {
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);

    if ((actionState === "buy" || actionState === "no-gold") && isShopProductSealed(hero, product.itemIds, product.rarity)) {
      return "sealed";
    }

    return actionState;
  }

  function dismissPreviewFromPointerDown(event: PointerEvent): void {
    if (!previewProduct || shop.hidden) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (selected.contains(target)) {
      return;
    }

    const targetElement = target instanceof Element ? target : target.parentElement;
    const shopAction = targetElement?.closest(
      ".armory-shop__option--product, .armory-shop__parts-filter, .armory-shop__category-button, .armory-shop__back",
    );

    if (shopAction && shop.contains(shopAction)) {
      return;
    }

    const previousProductId = clearProductPreview();

    renderPreviewSelection(previousProductId);
  }

  function scheduleShopTransition(callback: () => void): void {
    if (transitionDelayMs <= 0) {
      callback();
      return;
    }

    transitionTimer = window.setTimeout(() => {
      transitionTimer = undefined;
      callback();
    }, transitionDelayMs);
  }

  function clearTransitionTimer(): void {
    if (!transitionTimer) {
      return;
    }

    window.clearTimeout(transitionTimer);
    transitionTimer = undefined;
  }

  function showScrollIndicator(): void {
    if (!updateScrollIndicator()) {
      clearScrollIndicator();
      return;
    }

    tray.classList.add("armory-shop__tray--scrolling");
    if (scrollIndicatorTimer) {
      window.clearTimeout(scrollIndicatorTimer);
    }
    scheduleVisibleProductPrewarm(SHOP_PREWARM_AFTER_SCROLL_DELAY_MS);
    scrollIndicatorTimer = window.setTimeout(() => {
      scrollIndicatorTimer = undefined;
      tray.classList.remove("armory-shop__tray--scrolling");
    }, 620);
  }

  function updateScrollIndicator(): boolean {
    const scrollRange = content.scrollHeight - content.clientHeight;

    if (scrollRange <= 1 || content.clientHeight <= 0) {
      return false;
    }

    const trackPadding = 8;
    const trackHeight = Math.max(24, content.clientHeight - trackPadding * 2);
    const thumbHeight = Math.max(24, Math.min(trackHeight, (content.clientHeight / content.scrollHeight) * trackHeight));
    const thumbTop = trackPadding + (content.scrollTop / scrollRange) * (trackHeight - thumbHeight);

    tray.style.setProperty("--shop-scroll-thumb-height", `${thumbHeight}px`);
    tray.style.setProperty("--shop-scroll-thumb-top", `${thumbTop}px`);

    return true;
  }

  function scheduleVisibleProductPrewarm(delayMs = 0): void {
    if (!options.onPrewarmProducts || shop.hidden) {
      return;
    }

    clearVisibleProductPrewarm();

    const scheduleFrame = () => {
      productPrewarmFrame = window.requestAnimationFrame(() => {
        productPrewarmFrame = undefined;
        options.onPrewarmProducts?.(getVisibleProductPrewarmCandidates());
      });
    };

    if (delayMs > 0) {
      productPrewarmTimer = window.setTimeout(() => {
        productPrewarmTimer = undefined;
        scheduleFrame();
      }, delayMs);
      return;
    }

    scheduleFrame();
  }

  function getVisibleProductPrewarmCandidates(): ArmoryProduct[] {
    if (renderedProducts.length === 0 || productButtons.size === 0) {
      return [];
    }

    const viewportRect = content.getBoundingClientRect();
    const hasUsableViewport = viewportRect.width > 0 && viewportRect.height > 0;
    const candidates: ArmoryProduct[] = [];

    renderedProducts.some((product) => {
      const button = productButtons.get(product.id);

      if (!button || button.disabled) {
        return false;
      }

      if (hasUsableViewport) {
        const buttonRect = button.getBoundingClientRect();

        if (buttonRect.bottom <= viewportRect.top || buttonRect.top >= viewportRect.bottom) {
          return false;
        }
      }

      candidates.push(product);

      return candidates.length >= SHOP_VISIBLE_PREWARM_PRODUCT_LIMIT;
    });

    if (candidates.length > 0 || hasUsableViewport) {
      return candidates;
    }

    return renderedProducts
      .filter((product) => !productButtons.get(product.id)?.disabled)
      .slice(0, SHOP_VISIBLE_PREWARM_PRODUCT_LIMIT);
  }

  function scheduleLayoutSync(): void {
    if (!usesCityHeroPreview || !options.onLayoutChange || shop.hidden) {
      return;
    }

    if (layoutFrame) {
      window.cancelAnimationFrame(layoutFrame);
    }

    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = undefined;
      syncLayout();
    });
  }

  function scheduleSettledLayoutSync(): void {
    if (!usesCityHeroPreview || !options.onLayoutChange || shop.hidden) {
      return;
    }

    syncLayout();
    scheduleLayoutSync();
    clearLayoutSettleTimers();

    SHOP_LAYOUT_SETTLE_DELAYS_MS.forEach((delayMs) => {
      const timer = window.setTimeout(() => {
        layoutSettleTimers = layoutSettleTimers.filter((activeTimer) => activeTimer !== timer);
        scheduleLayoutSync();
      }, delayMs);

      layoutSettleTimers.push(timer);
    });
  }

  function syncLayout(): void {
    if (!usesCityHeroPreview || !options.onLayoutChange || shop.hidden) {
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    options.onLayoutChange(Math.max(0, menuRect.top - rootRect.top));
  }

  function clearLayoutSync(): void {
    if (layoutFrame) {
      window.cancelAnimationFrame(layoutFrame);
      layoutFrame = undefined;
    }
    clearLayoutSettleTimers();

    if (usesCityHeroPreview) {
      options.onLayoutChange?.(undefined);
    }
  }

  function clearVisibleProductPrewarm(): void {
    if (productPrewarmFrame !== undefined) {
      window.cancelAnimationFrame(productPrewarmFrame);
      productPrewarmFrame = undefined;
    }
    if (productPrewarmTimer !== undefined) {
      window.clearTimeout(productPrewarmTimer);
      productPrewarmTimer = undefined;
    }
  }

  function clearLayoutSettleTimers(): void {
    layoutSettleTimers.forEach((timer) => window.clearTimeout(timer));
    layoutSettleTimers = [];
  }

  function clearScrollIndicator(): void {
    if (scrollIndicatorTimer) {
      window.clearTimeout(scrollIndicatorTimer);
      scrollIndicatorTimer = undefined;
    }
    tray.classList.remove("armory-shop__tray--scrolling");
  }

  return { open, close, render, syncHeroState };
}

function createSealedRibbon(): HTMLElement {
  const ribbon = document.createElement("span");

  ribbon.className = "armory-shop__sealed-ribbon";
  ribbon.textContent = "SEALED";

  return ribbon;
}

function createRequirementRibbon(requirement: ShopProductRequirementBadge): HTMLElement {
  const ribbon = document.createElement("span");

  ribbon.className = "armory-shop__sealed-ribbon armory-shop__requirement-ribbon";
  appendRequirementContent(ribbon, requirement);

  return ribbon;
}

function appendRequirementContent(requirementNode: HTMLElement, requirement: ShopProductRequirementBadge): void {
  const icon = document.createElement("span");
  const amount = document.createElement("span");
  const requirementKey = requirement.kind === "level" ? "level" : requirement.attribute;
  const requirementLabel = requirement.kind === "level" ? "Level" : requirement.attribute;

  requirementNode.setAttribute("aria-label", `${requirementLabel} ${requirement.required}`);
  icon.className = `armory-shop__requirement-icon armory-shop__requirement-icon--${requirementKey}`;
  icon.textContent = requirement.kind === "level" ? "LVL" : "";
  amount.className = "armory-shop__requirement-amount";
  amount.textContent = String(requirement.required);
  requirementNode.append(icon, amount);
}

function getProductCardAction(actionState: ShopProductActionState, price: number): EquipmentCardAction {
  if (actionState === "buy" || actionState === "no-gold" || actionState === "sealed" || actionState === "locked") {
    return { kind: "price", iconUrl: SHOP_GOLD_COIN_ICON_ASSET_URL, value: price, state: actionState };
  }

  return { kind: "status", label: getShopProductActionLabel(actionState, price), state: actionState };
}

function getPendingProductCardAction(): EquipmentCardAction {
  return { kind: "status", label: "BUYING", state: "buying" };
}

function getPendingProductInlineConfirmAction(): EquipmentCardInlineConfirmAction {
  return { state: "buying" };
}

function getProductInlineConfirmAction(actionState: ShopProductActionState, price: number): EquipmentCardInlineConfirmAction | undefined {
  if (actionState !== "buy" && actionState !== "no-gold") {
    return undefined;
  }

  return { state: actionState, price, iconUrl: SHOP_GOLD_COIN_ICON_ASSET_URL };
}

function createSelectedMeta(): ArmorySelectedMetaElements {
  const meta = document.createElement("div");
  const nameNode = document.createElement("span");
  const rarityNode = document.createElement("span");
  const statNode = document.createElement("span");
  const statIcon = document.createElement("img");
  const statValueNode = document.createElement("span");
  const diffNode = document.createElement("span");
  const priceNode = document.createElement("span");

  meta.className = "armory-shop__selected-meta";
  nameNode.className = "armory-shop__selected-name";
  rarityNode.className = "armory-shop__selected-rarity";
  statNode.className = "armory-shop__selected-stat";
  statIcon.className = "armory-shop__selected-stat-icon";
  statIcon.src = DAMAGE_BLOCK_ICON_ASSET_URL;
  statIcon.alt = "";
  statIcon.decoding = "async";
  statIcon.draggable = false;
  statValueNode.className = "armory-shop__selected-stat-value";
  diffNode.className =
    "equipment-item-card__diff equipment-item-card__diff--equal armory-shop__selected-diff armory-shop__selected-diff--equal";
  priceNode.className = "armory-shop__selected-price";
  appendPriceContent(priceNode, 0);
  statNode.append(statIcon, statValueNode);
  meta.append(nameNode, rarityNode, statNode, diffNode, priceNode);

  return {
    root: meta,
    name: nameNode,
    rarity: rarityNode,
    stat: statNode,
    statValue: statValueNode,
    diff: diffNode,
    price: priceNode,
    priceAmount: priceNode.querySelector<HTMLElement>(".armory-shop__price-amount")!,
  };
}

function updateSelectedDiffChip(chip: HTMLElement, diff: number): void {
  chip.className = [
    "equipment-item-card__diff",
    "armory-shop__selected-diff",
    diff > 0 ? "equipment-item-card__diff--better" : "",
    diff < 0 ? "equipment-item-card__diff--worse" : "",
    diff === 0 ? "equipment-item-card__diff--equal" : "",
    diff > 0 ? "armory-shop__selected-diff--better" : "",
    diff < 0 ? "armory-shop__selected-diff--worse" : "",
    diff === 0 ? "armory-shop__selected-diff--equal" : "",
  ]
    .filter(Boolean)
    .join(" ");
  chip.textContent = diff > 0 ? `+${diff}` : String(diff);
  chip.setAttribute("aria-label", diff > 0 ? `Better by ${diff}` : diff < 0 ? `Worse by ${Math.abs(diff)}` : "Same stat");
}

function appendPriceContent(priceNode: HTMLElement, price: number): void {
  const icon = document.createElement("img");
  const amount = document.createElement("span");

  priceNode.setAttribute("aria-label", `${price} gold`);
  icon.className = "armory-shop__price-icon";
  icon.src = SHOP_GOLD_COIN_ICON_ASSET_URL;
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  amount.className = "armory-shop__price-amount";
  amount.textContent = String(price);
  priceNode.append(icon, amount);
}

function createEmptyState(text: string): HTMLButtonElement {
  const button = document.createElement("button");

  button.className = "armory-shop__option armory-shop__option--empty";
  button.type = "button";
  button.disabled = true;
  button.textContent = text;

  return button;
}
