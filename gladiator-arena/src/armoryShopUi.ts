import {
  HERO_ITEM_CATALOG,
  areHeroItemsEquipped,
  areHeroItemsOwned,
  canHeroEquipItems,
  type HeroEquipmentSetInfo,
  type HeroEquipmentSlotKey,
  type HeroItemId,
  type HeroState,
} from "./hero";
import {
  DAMAGE_BLOCK_ICON_ASSET_URL,
  SHOP_BACK_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
} from "./assets";
import { GENERATED_ARMORY_PRODUCTS } from "./generated/equipmentItems.generated";
import { getShopProductIconUrl } from "./shopItemIcons";
import {
  getEquippedShopProductStat,
  getShopProductActionLabel,
  getShopProductActionState,
  getShopProductDisplayName,
  getShopProductRarity,
  getShopProductRequirementBadge,
  getShopProductRequirementDescription,
  getShopProductStat,
  getShopRarityLabel,
  isShopProductSealed,
  type ShopProductActionState,
  type ShopItemRarity,
  type ShopProductRequirementBadge,
} from "./shopPresentation";

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
  currentStat: HTMLElement;
  arrow: HTMLElement;
  nextStat: HTMLElement;
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
}

interface ArmoryEquipmentSetOption {
  info: HeroEquipmentSetInfo;
  products: ArmoryProduct[];
  rarity: ShopItemRarity;
}

interface ArmoryEquippedSlotGroup {
  id: string;
  label: string;
  modifier: string;
  area: string;
  slots: readonly HeroEquipmentSlotKey[];
}

const ALL_ARMORY_EQUIPMENT_SETS_FILTER_VALUE = "";

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

const ARMORY_SET_FILTER_RARITY_CLASS_NAMES = (Object.keys(ARMORY_RARITY_SORT_ORDER) as ShopItemRarity[]).map(
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
  { id: "head", name: "Head", shortLabel: "HEAD" },
  { id: "body", name: "Body", shortLabel: "BODY" },
  { id: "arms", name: "Arms", shortLabel: "ARMS" },
  { id: "shield", name: "Shield", shortLabel: "SHIELD" },
  { id: "legs", name: "Legs", shortLabel: "LEGS" },
];
const ARMORY_PART_FILTER_BY_SLOT: Partial<Record<HeroEquipmentSlotKey, string>> = {
  helmet: "head",
  breastplate: "body",
  backShoulderguard: "arms",
  frontShoulderguard: "arms",
  backWrist: "arms",
  frontWrist: "arms",
  backGlove: "arms",
  frontGlove: "arms",
  shield: "shield",
  backGreave: "legs",
  frontGreave: "legs",
  backShinguard: "legs",
  frontShinguard: "legs",
  backBoot: "legs",
  frontBoot: "legs",
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

function getArmoryEquipmentSetOptions(): ArmoryEquipmentSetOption[] {
  const optionsById = new Map<string, { info: HeroEquipmentSetInfo; products: ArmoryProduct[] }>();

  getArmoryCatalogProducts().forEach((product) => {
    const setInfo = getArmoryProductSetInfo(product);

    if (!setInfo) {
      return;
    }

    const existingOption = optionsById.get(setInfo.id);

    if (existingOption) {
      existingOption.products.push(product);
      return;
    }

    optionsById.set(setInfo.id, { info: setInfo, products: [product] });
  });

  return [...optionsById.values()]
    .flatMap((option) => {
      const firstProduct = option.products[0];

      return firstProduct
        ? [
            {
              ...option,
              rarity: getShopProductRarity(firstProduct.itemIds, firstProduct.rarity),
            },
          ]
        : [];
    })
    .sort((left, right) => left.info.rank - right.info.rank || left.info.name.localeCompare(right.info.name));
}

function filterArmoryProductsByEquipmentSet(products: readonly ArmoryProduct[], equipmentSetId: string | undefined): ArmoryProduct[] {
  if (!equipmentSetId) {
    return [...products];
  }

  return products.filter((product) => getArmoryProductSetInfo(product)?.id === equipmentSetId);
}

function getAvailableArmoryEquipmentSetOptions(
  hero: HeroState,
  equipmentSetOptions: readonly ArmoryEquipmentSetOption[],
): ArmoryEquipmentSetOption[] {
  return equipmentSetOptions.filter((option) => isArmoryEquipmentSetOptionAvailable(hero, option));
}

function isArmoryEquipmentSetOptionAvailable(hero: HeroState, option: ArmoryEquipmentSetOption): boolean {
  return option.products.some((product) => !isShopProductSealed(hero, product.itemIds, product.rarity));
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

function getArmoryProductSetInfo(product: ArmoryProduct): HeroEquipmentSetInfo | undefined {
  return product.itemIds.flatMap((itemId) => {
    const equipmentSet = HERO_ITEM_CATALOG[itemId]?.equipmentSet;

    return equipmentSet ? [equipmentSet] : [];
  })[0];
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
    : `${sideFreeName} Pair`;
}

function normalizePairedArmoryText(value: string, pairConfig: PairedArmorySlotConfig): string {
  return value
    .replace(new RegExp(`(^|[_\\s-])(?:back|front)([_\\s-]+)${pairConfig.token}(?=$|[_\\s-])`, "giu"), `$1${pairConfig.token}`)
    .replace(/\s+/gu, " ")
    .trim();
}

export function mountArmoryShop(root: HTMLElement, options: ArmoryShopOptions): ArmoryShopApi {
  let selectedEquipmentSetId: string | undefined;
  let selectedPartFilterIds = getDefaultArmoryPartFilterIds();
  let previewProduct: ArmoryProduct | undefined;
  let unmountPreview: (() => void) | undefined;
  let transitionTimer: number | undefined;
  let scrollIndicatorTimer: number | undefined;
  let layoutFrame: number | undefined;
  let layoutSettleTimers: number[] = [];
  let productPrewarmFrame: number | undefined;
  let productPrewarmTimer: number | undefined;
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
  const allEquipmentSetOptions = getArmoryEquipmentSetOptions();

  const header = document.createElement("div");
  header.className = "armory-shop__header";

  const title = document.createElement("h2");
  title.className = "armory-shop__title";

  const setFilter = document.createElement("select");
  setFilter.className = "armory-shop__set-filter";
  setFilter.setAttribute("aria-label", "Armor set");
  setFilter.append(createEquipmentSetFilterOption());
  setFilter.addEventListener("change", () => {
    selectedEquipmentSetId = setFilter.value || undefined;
    clearProductPreview();
    render();
  });

  const partsFilter = document.createElement("details");
  const partsFilterSummary = document.createElement("summary");
  const partsFilterSummaryText = document.createElement("span");
  const partsFilterPanel = document.createElement("div");
  const partFilterInputs = new Map<string, HTMLInputElement>();

  partsFilter.className = "armory-shop__parts-filter";
  partsFilterSummary.className = "armory-shop__parts-summary";
  partsFilterSummaryText.className = "armory-shop__parts-summary-text";
  partsFilterSummary.append(partsFilterSummaryText);
  partsFilterPanel.className = "armory-shop__parts-panel";
  ARMORY_PART_FILTERS.forEach((part) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");

    label.className = "armory-shop__parts-option";
    input.className = "armory-shop__parts-checkbox";
    input.type = "checkbox";
    input.value = part.id;
    input.checked = selectedPartFilterIds.has(part.id);
    text.className = "armory-shop__parts-option-text";
    text.textContent = part.name;
    input.addEventListener("change", () => {
      if (input.checked) {
        selectedPartFilterIds.add(part.id);
      } else {
        selectedPartFilterIds.delete(part.id);
      }

      clearProductPreview();
      updatePartsFilterControls();
      render();
    });
    partFilterInputs.set(part.id, input);
    label.append(input, text);
    partsFilterPanel.append(label);
  });
  partsFilter.append(partsFilterSummary, partsFilterPanel);

  const filterPlaceholder = document.createElement("button");
  const filterPlaceholderIcon = document.createElement("span");
  filterPlaceholder.className = "armory-shop__toolbar-button armory-shop__toolbar-button--placeholder";
  filterPlaceholder.type = "button";
  filterPlaceholder.disabled = true;
  filterPlaceholder.setAttribute("aria-label", "Additional filters coming soon");
  filterPlaceholderIcon.className = "armory-shop__toolbar-dots";
  filterPlaceholderIcon.setAttribute("aria-hidden", "true");
  filterPlaceholderIcon.textContent = "...";
  filterPlaceholder.append(filterPlaceholderIcon);

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
  headerMeta.append(gold, level);

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
    header.append(title, setFilter, partsFilter, filterPlaceholder, selected, headerMeta);
    tray.append(header, subcategories, content, scrollIndicator);
    menu.append(tray);
  } else {
    header.append(back, title, setFilter, partsFilter, filterPlaceholder, headerMeta);
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
  if (usesCityHeroPreview) {
    panel.append(back);
  }
  shop.append(panel);
  root.append(shop);
  window.addEventListener("resize", scheduleLayoutSync);
  window.visualViewport?.addEventListener("resize", scheduleLayoutSync);
  window.visualViewport?.addEventListener("scroll", scheduleLayoutSync);

  const layoutResizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(scheduleLayoutSync);
  layoutResizeObserver?.observe(root);
  layoutResizeObserver?.observe(menu);
  layoutResizeObserver?.observe(tray);

  function open(): void {
    clearTransitionTimer();
    selectedEquipmentSetId = undefined;
    selectedPartFilterIds = getDefaultArmoryPartFilterIds();
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
    const availableEquipmentSetOptions = getAvailableArmoryEquipmentSetOptions(hero, allEquipmentSetOptions);
    let selectedEquipmentSetOption = selectedEquipmentSetId
      ? availableEquipmentSetOptions.find((option) => option.info.id === selectedEquipmentSetId)
      : undefined;

    if (selectedEquipmentSetId && !selectedEquipmentSetOption) {
      selectedEquipmentSetId = undefined;
      selectedEquipmentSetOption = undefined;
      clearProductPreview();
    }

    const sortedProducts = getSortedArmoryCatalogProducts();
    const setFilteredProducts = filterArmoryProductsByEquipmentSet(sortedProducts, selectedEquipmentSetId);
    const selectedProducts = filterArmoryProductsByParts(setFilteredProducts, selectedPartFilterIds);

    title.textContent = "Gear";
    renderEquipmentSetFilterOptions(availableEquipmentSetOptions);
    updateEquipmentSetFilterRarity(selectedEquipmentSetOption?.rarity);
    updatePartsFilterControls();
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
    updateProductButtonSelection(previousProductId);
    scheduleLayoutSync();
  }

  function syncSelectionState(): void {
    const hasSelection = Boolean(previewProduct);

    shop.classList.toggle("armory-shop--has-selection", hasSelection);
    selected.hidden = !hasSelection;
    content.classList.toggle("armory-shop__content--has-selection", hasSelection);
  }

  function renderSelectedProduct(hero: HeroState): void {
    syncSelectionState();

    if (!previewProduct) {
      return;
    }

    updateSelectedProductStrip(ensureSelectedStripElements(), previewProduct, hero);
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

  function updateProductButtonSelection(previousProductId?: string): void {
    const nextProductId = previewProduct?.id;

    if (previousProductId && previousProductId !== nextProductId) {
      productButtons.get(previousProductId)?.classList.remove("armory-shop__option--selected");
    }

    if (nextProductId) {
      productButtons.get(nextProductId)?.classList.add("armory-shop__option--selected");
    }
  }

  function ensurePreviewMounted(): void {
    if (unmountPreview || !options.mountPreview) {
      return;
    }

    unmountPreview = options.mountPreview(preview);
  }

  function updatePartsFilterControls(): void {
    ARMORY_PART_FILTERS.forEach((part) => {
      const input = partFilterInputs.get(part.id);

      if (input) {
        input.checked = selectedPartFilterIds.has(part.id);
      }
    });
    partsFilterSummaryText.textContent = getPartsFilterSummaryText();
  }

  function getPartsFilterSummaryText(): string {
    if (selectedPartFilterIds.size === 0 || selectedPartFilterIds.size === ARMORY_PART_FILTERS.length) {
      return "All parts";
    }

    if (selectedPartFilterIds.size === 1) {
      const selectedPart = ARMORY_PART_FILTERS.find((part) => selectedPartFilterIds.has(part.id));

      return selectedPart?.name ?? "Parts";
    }

    return `${selectedPartFilterIds.size} parts`;
  }

  function renderEquipmentSetFilterOptions(equipmentSetOptions: readonly ArmoryEquipmentSetOption[]): void {
    setFilter.replaceChildren(createEquipmentSetFilterOption(), ...equipmentSetOptions.map(createEquipmentSetFilterOption));
    setFilter.value = selectedEquipmentSetId ?? ALL_ARMORY_EQUIPMENT_SETS_FILTER_VALUE;
  }

  function updateEquipmentSetFilterRarity(rarity?: ShopItemRarity): void {
    setFilter.classList.remove(...ARMORY_SET_FILTER_RARITY_CLASS_NAMES);

    if (rarity) {
      setFilter.classList.add(`armory-shop__set-filter--rarity-${rarity}`);
    }
  }

  function createEquipmentSetFilterOption(setOption?: ArmoryEquipmentSetOption): HTMLOptionElement {
    const option = document.createElement("option");

    option.value = setOption?.info.id ?? ALL_ARMORY_EQUIPMENT_SETS_FILTER_VALUE;
    option.textContent = setOption?.info.name ?? "All sets";

    if (setOption) {
      option.className = `armory-shop__set-filter-option--rarity-${setOption.rarity}`;
    }

    return option;
  }

  function createProductButton(product: ArmoryProduct, hero: HeroState, isSelected: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const armor = getShopProductStat(product.itemIds, "armor");
    const cardState = getArmoryProductCardState(hero, product);
    const displayName = getShopProductDisplayName(product.name);
    const requirementBadge = getShopProductRequirementBadge(hero, product.itemIds);
    const requirementDescription = getShopProductRequirementDescription(hero, product.itemIds);

    button.className = `armory-shop__option armory-shop__option--product armory-shop__option--rarity-${rarity}`;
    button.classList.toggle("armory-shop__option--selected", isSelected);
    button.classList.toggle("armory-shop__option--owned", cardState === "equip");
    button.classList.toggle("armory-shop__option--equipped", cardState === "equipped");
    button.classList.toggle("armory-shop__option--for-sale", cardState === "buy");
    button.classList.toggle("armory-shop__option--locked", cardState === "locked");
    button.classList.toggle("armory-shop__option--sealed", cardState === "sealed" || cardState === "locked");
    button.type = "button";
    button.disabled = cardState === "sealed" || cardState === "locked";
    button.title = cardState === "sealed" ? `${displayName} - SEALED` : requirementDescription ? `${displayName} - ${requirementDescription}` : displayName;
    button.setAttribute(
      "aria-label",
      `${displayName}, ${getShopRarityLabel(rarity)}, ${armor} armor, ${requirementDescription || getShopProductActionLabel(cardState, product.price)}`,
    );
    button.append(createProductIcon(iconUrl));
    if (cardState === "sealed") {
      button.append(createSealedRibbon());
    }
    if (cardState === "locked" && requirementBadge) {
      button.append(createRequirementRibbon(requirementBadge));
    }
    if (cardState === "buy") {
      button.append(createProductStats("AR", armor, product.price));
    }
    button.addEventListener("click", () => {
      if (button.disabled) {
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
    const slot = document.createElement("div");
    const icon = document.createElement("span");
    const label = items.length > 0
      ? `${group.label}: ${items.map((item) => getShopProductDisplayName(item.name)).join(", ")}`
      : `${group.label}: empty`;

    slot.className = [
      "armory-shop__equipped-slot",
      `armory-shop__equipped-slot--${group.modifier}`,
      `armory-shop__equipped-slot--area-${group.area}`,
      `armory-shop__equipped-slot--${rarity}`,
      rarity !== "empty" ? `armory-shop__option--rarity-${rarity}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    slot.setAttribute("aria-label", label);
    slot.title = label;
    icon.className = "armory-shop__equipped-icon";

    if (iconUrl) {
      icon.style.backgroundImage = `url("${iconUrl}")`;
    } else {
      icon.textContent = group.label.slice(0, 1);
    }

    slot.append(icon);

    return slot;
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
    if (shop.hidden) {
      return;
    }

    const hero = options.getHero();

    updateShopHeroMeta(hero);
    renderEquippedSlots(hero);
    refreshChangedProductButtons(hero, syncOptions);
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

  function refreshChangedProductButtons(hero: HeroState, syncOptions: ArmoryShopHeroSyncOptions): void {
    const productIds = getProductButtonRefreshIds(syncOptions.product, syncOptions.previousHero);

    if (productIds) {
      productIds.forEach((productId) => refreshProductButton(productId, hero));
      return;
    }

    renderedProducts.forEach((product) => refreshProductButton(product.id, hero));
  }

  function refreshProductButton(productId: string, hero: HeroState): void {
    const product = renderedProductsById.get(productId);

    if (!product) {
      return;
    }

    const currentButton = productButtons.get(product.id);

    if (!currentButton) {
      return;
    }

    const nextVisualState = getProductButtonVisualState(hero, product);

    if (productButtonVisualStates.get(product.id) === nextVisualState) {
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

  function getProductEquipmentSlots(product: ArmoryProduct): HeroEquipmentSlotKey[] {
    return product.itemIds.flatMap((itemId) => {
      const slotKey = HERO_ITEM_CATALOG[itemId]?.equipmentSlot;

      return slotKey ? [slotKey] : [];
    });
  }

  function getProductButtonVisualState(hero: HeroState, product: ArmoryProduct): string {
    return getArmoryProductCardState(hero, product);
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

    elements.card.className = `armory-shop__selected-card armory-shop__selected-card--rarity-${rarity}`;
    elements.icon.hidden = !iconUrl;
    if (iconUrl && elements.icon.src !== iconUrl) {
      elements.icon.src = iconUrl;
    }

    updateSelectedMeta(elements.meta, displayName, rarity, "armor", armor, currentArmor, product.price);
    elements.buyButton.disabled = actionState === "equipped" || actionState === "no-gold" || actionState === "sealed" || actionState === "locked";
    elements.buyButton.textContent = getShopProductActionLabel(actionState, product.price);
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
    meta.stat.setAttribute("aria-label", currentStat === stat ? `${statLabel} ${stat}` : `${statLabel} ${currentStat} to ${stat}`);
    meta.currentStat.textContent = String(currentStat);
    meta.nextStat.classList.toggle("armory-shop__selected-stat-value--positive", stat > currentStat);
    meta.nextStat.classList.toggle("armory-shop__selected-stat-value--negative", stat < currentStat);
    meta.nextStat.textContent = String(stat);
    meta.arrow.hidden = currentStat === stat;
    meta.nextStat.hidden = currentStat === stat;
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
      ".armory-shop__option--product, .armory-shop__set-filter, .armory-shop__parts-filter, .armory-shop__toolbar-button, .armory-shop__back",
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

function createProductIcon(iconUrl: string | undefined, className = "armory-shop__product-icon"): HTMLElement {
  if (!iconUrl) {
    const fallback = document.createElement("span");

    fallback.className = `${className} armory-shop__product-icon--missing`;
    fallback.textContent = "?";

    return fallback;
  }

  const icon = document.createElement("img");

  icon.className = className;
  icon.src = iconUrl;
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;

  return icon;
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

function createProductStats(statLabel: string, stat: number, price: number): HTMLElement {
  const stats = document.createElement("span");
  const statNode = document.createElement("span");
  const statIcon = document.createElement("img");
  const statValue = document.createElement("span");
  const priceNode = document.createElement("span");

  stats.className = "armory-shop__product-stats";
  statNode.className = "armory-shop__product-stat";
  statNode.setAttribute("aria-label", `${statLabel} ${stat}`);
  statIcon.className = "armory-shop__product-stat-icon";
  statIcon.src = DAMAGE_BLOCK_ICON_ASSET_URL;
  statIcon.alt = "";
  statIcon.decoding = "async";
  statIcon.draggable = false;
  statValue.className = "armory-shop__product-stat-value";
  statValue.textContent = String(stat);
  priceNode.className = "armory-shop__product-price";
  appendPriceContent(priceNode, price);
  statNode.append(statIcon, statValue);
  stats.append(statNode, priceNode);

  return stats;
}

function createSelectedMeta(): ArmorySelectedMetaElements {
  const meta = document.createElement("div");
  const nameNode = document.createElement("span");
  const rarityNode = document.createElement("span");
  const statNode = document.createElement("span");
  const currentStatNode = document.createElement("span");
  const arrowNode = document.createElement("span");
  const nextStatNode = document.createElement("span");
  const priceNode = document.createElement("span");

  meta.className = "armory-shop__selected-meta";
  nameNode.className = "armory-shop__selected-name";
  rarityNode.className = "armory-shop__selected-rarity";
  statNode.className = "armory-shop__selected-stat";
  currentStatNode.className = "armory-shop__selected-stat-value";
  arrowNode.className = "armory-shop__selected-stat-arrow";
  arrowNode.textContent = ">";
  nextStatNode.className = "armory-shop__selected-stat-value";
  priceNode.className = "armory-shop__selected-price";
  appendPriceContent(priceNode, 0);
  statNode.append(currentStatNode, arrowNode, nextStatNode);
  meta.append(nameNode, rarityNode, statNode, priceNode);

  return {
    root: meta,
    name: nameNode,
    rarity: rarityNode,
    stat: statNode,
    currentStat: currentStatNode,
    arrow: arrowNode,
    nextStat: nextStatNode,
    price: priceNode,
    priceAmount: priceNode.querySelector<HTMLElement>(".armory-shop__price-amount")!,
  };
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
