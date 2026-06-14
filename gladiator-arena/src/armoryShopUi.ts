import {
  HERO_ITEM_CATALOG,
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
  getShopProductStat,
  getShopRarityLabel,
  isShopProductSealed,
  type ShopProductActionState,
  type ShopItemRarity,
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
}

interface ArmoryCategory {
  id: string;
  name: string;
  shortLabel: string;
  iconUrl?: string;
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

const ARMORY_SLOT_SORT_ORDER: Record<HeroEquipmentSlotKey, number> = {
  weaponMain: 0,
  helmet: 0,
  breastplate: 0,
  backShoulderguard: 0,
  frontShoulderguard: 0,
  backWrist: 1,
  frontWrist: 1,
  backGlove: 2,
  frontGlove: 2,
  backGreave: 0,
  frontGreave: 0,
  backShinguard: 1,
  frontShinguard: 1,
  backBoot: 2,
  frontBoot: 2,
};

const SHOP_LAYOUT_SETTLE_DELAYS_MS = [80, 180, 360] as const;

const ARMORY_CATEGORIES: ArmoryCategory[] = [
  {
    id: "head",
    name: "Head",
    shortLabel: "HEAD",
    iconUrl: SHOP_CATEGORY_HEAD_ICON_ASSET_URL,
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
    iconUrl: SHOP_CATEGORY_BODY_ICON_ASSET_URL,
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
    iconUrl: SHOP_CATEGORY_ARMS_ICON_ASSET_URL,
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
    ],
  },
  {
    id: "legs",
    name: "Legs",
    shortLabel: "LEGS",
    iconUrl: SHOP_CATEGORY_LEGS_ICON_ASSET_URL,
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

function getSortedArmoryCategoryProducts(category: ArmoryCategory): ArmoryProduct[] {
  return [...getArmoryCategoryProducts(category)].sort(compareArmoryProducts);
}

function compareArmoryProducts(left: ArmoryProduct, right: ArmoryProduct): number {
  const rarityDifference = getArmoryProductRarityOrder(left) - getArmoryProductRarityOrder(right);

  if (rarityDifference !== 0) {
    return rarityDifference;
  }

  const armorDifference = getShopProductStat(left.itemIds, "armor") - getShopProductStat(right.itemIds, "armor");

  if (armorDifference !== 0) {
    return armorDifference;
  }

  const priceDifference = left.price - right.price;

  if (priceDifference !== 0) {
    return priceDifference;
  }

  const slotDifference = getArmoryProductSlotOrder(left) - getArmoryProductSlotOrder(right);

  if (slotDifference !== 0) {
    return slotDifference;
  }

  return left.name.localeCompare(right.name);
}

function getArmoryProductRarityOrder(product: ArmoryProduct): number {
  return ARMORY_RARITY_SORT_ORDER[getShopProductRarity(product.itemIds, product.rarity)];
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

function pairGeneratedArmoryProducts(products: ArmoryProduct[]): ArmoryProduct[] {
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
  let selectedCategoryId: string | undefined;
  let previewProduct: ArmoryProduct | undefined;
  let unmountPreview: (() => void) | undefined;
  let transitionTimer: number | undefined;
  let scrollIndicatorTimer: number | undefined;
  let layoutFrame: number | undefined;
  let layoutSettleTimers: number[] = [];
  let selectedStripElements: ArmorySelectedStripElements | undefined;
  let productButtons = new Map<string, HTMLButtonElement>();
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

  const menu = document.createElement("div");
  menu.className = "armory-shop__menu";

  const categoryRail = document.createElement("div");
  categoryRail.className = "armory-shop__category-rail";
  categoryRail.style.setProperty("--shop-category-count", String(ARMORY_CATEGORIES.length));

  const tray = document.createElement("div");
  tray.className = "armory-shop__tray";

  const header = document.createElement("div");
  header.className = "armory-shop__header";

  const title = document.createElement("h2");
  title.className = "armory-shop__title";

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
  back.className = "armory-shop__back";
  back.type = "button";
  back.textContent = "<";
  back.setAttribute("aria-label", "Back");
  back.addEventListener("click", () => {
    if (previewProduct) {
      const previousProductId = clearProductPreview();

      renderPreviewSelection(previousProductId);
      return;
    }

    close();
  });

  if (usesCityHeroPreview) {
    header.append(title, selected, headerMeta);
    tray.append(header, subcategories, content, scrollIndicator);
    menu.append(tray, categoryRail, back);
  } else {
    header.append(back, title, headerMeta);
    tray.append(header, subcategories, selected, content, scrollIndicator);
    menu.append(categoryRail, tray);
  }
  if (options.mountPreview) {
    panel.append(previewShell);
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

  function open(): void {
    clearTransitionTimer();
    selectedCategoryId = ARMORY_CATEGORIES[0]?.id;
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
    const selectedCategory = ARMORY_CATEGORIES.find((category) => category.id === selectedCategoryId) ?? ARMORY_CATEGORIES[0]!;
    const selectedProducts = getSortedArmoryCategoryProducts(selectedCategory);

    selectedCategoryId = selectedCategory.id;
    title.textContent = selectedCategory.name;
    goldAmount.textContent = String(hero.gold);
    gold.setAttribute("aria-label", `Gold ${hero.gold}`);
    levelValue.textContent = String(hero.level);
    level.setAttribute("aria-label", `Level ${hero.level}`);
    categoryRail.replaceChildren();
    subcategories.replaceChildren();
    content.replaceChildren();
    productButtons = new Map();
    clearScrollIndicator();
    subcategories.hidden = true;
    shop.classList.toggle("armory-shop--has-subcategories", false);
    content.classList.toggle("armory-shop__content--categories", false);
    content.classList.toggle("armory-shop__content--products", true);
    content.classList.toggle("armory-shop__content--confirm", false);
    syncSelectionState();

    ARMORY_CATEGORIES.forEach((category) => {
      categoryRail.append(createCategoryButton(category, category.id === selectedCategory.id));
    });

    renderSelectedProduct(hero);

    scheduleLayoutSync();

    if (selectedProducts.length === 0) {
      content.append(createEmptyState("No items"));
      return;
    }

    selectedProducts.forEach((product) => {
      const button = createProductButton(product, hero, previewProduct?.id === product.id);

      productButtons.set(product.id, button);
      content.append(button);
    });
  }

  function previewArmoryProduct(product: ArmoryProduct): void {
    if (previewProduct?.id === product.id) {
      return;
    }

    const previousProductId = previewProduct?.id;

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
        render();
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

  function createCategoryButton(category: ArmoryCategory, isActive: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    const iconUrl = category.iconUrl ?? getShopProductIconUrl(getArmoryCategoryProducts(category).flatMap((product) => product.itemIds));

    button.className = "armory-shop__category-button";
    button.classList.toggle("armory-shop__category-button--active", isActive);
    button.type = "button";
    button.title = category.name;
    button.setAttribute("aria-label", category.name);
    button.setAttribute("aria-pressed", String(isActive));
    if (iconUrl) {
      const icon = document.createElement("img");

      icon.className = "armory-shop__category-icon";
      icon.src = iconUrl;
      icon.alt = "";
      icon.decoding = "async";
      icon.draggable = false;
      button.append(icon);
    } else {
      const fallback = document.createElement("span");

      fallback.className = "armory-shop__category-fallback";
      fallback.textContent = category.shortLabel;
      button.append(fallback);
    }
    button.addEventListener("click", () => {
      selectedCategoryId = category.id;
      clearProductPreview();
      render();
    });

    return button;
  }

  function createProductButton(product: ArmoryProduct, hero: HeroState, isSelected: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const armor = getShopProductStat(product.itemIds, "armor");
    const actionState = getArmoryProductActionState(hero, product);
    const displayName = getShopProductDisplayName(product.name);

    button.className = `armory-shop__option armory-shop__option--product armory-shop__option--rarity-${rarity}`;
    button.classList.toggle("armory-shop__option--selected", isSelected);
    button.classList.toggle("armory-shop__option--owned", actionState === "equip");
    button.classList.toggle("armory-shop__option--equipped", actionState === "equipped");
    button.classList.toggle("armory-shop__option--for-sale", actionState === "buy" || actionState === "no-gold");
    button.classList.toggle("armory-shop__option--sealed", actionState === "sealed");
    button.type = "button";
    button.disabled = actionState === "sealed";
    button.title = actionState === "sealed" ? `${displayName} - SEALED` : displayName;
    button.setAttribute("aria-label", `${displayName}, ${getShopRarityLabel(rarity)}, ${armor} armor, ${getShopProductActionLabel(actionState, product.price)}`);
    button.append(createProductIcon(iconUrl));
    if (actionState === "sealed") {
      button.append(createSealedRibbon());
    }
    if (actionState === "buy" || actionState === "no-gold") {
      button.append(createProductStats("AR", armor, product.price));
    }
    button.addEventListener("click", () => {
      previewArmoryProduct(product);
    });

    return button;
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
    elements.buyButton.disabled = actionState === "equipped" || actionState === "no-gold" || actionState === "sealed";
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
    const shopAction = targetElement?.closest(".armory-shop__option--product, .armory-shop__category-button, .armory-shop__back");

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

  return { open, close, render };
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
