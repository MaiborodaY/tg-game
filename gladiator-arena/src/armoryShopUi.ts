import {
  CLOTH_BREASTPLATE_ID,
  HERO_ITEM_CATALOG,
  STARTER_BACK_BOOT_ID,
  STARTER_BACK_WRIST_ID,
  STARTER_BACK_GREAVE_ID,
  STARTER_BACK_SHINGUARD_ID,
  STARTER_BACK_SHOULDERGUARD_ID,
  STARTER_BREASTPLATE_ID,
  STARTER_FRONT_BOOT_ID,
  STARTER_FRONT_WRIST_ID,
  STARTER_FRONT_GREAVE_ID,
  STARTER_FRONT_SHINGUARD_ID,
  STARTER_FRONT_SHOULDERGUARD_ID,
  STARTER_HELMET_ID,
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
  getShopProductRarity,
  getShopProductStat,
  getShopRarityLabel,
  getShopRarityShortLabel,
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
  transitionDelayMs?: number;
}

interface PairedArmorySlotConfig {
  backSlot: HeroEquipmentSlotKey;
  frontSlot: HeroEquipmentSlotKey;
  token: string;
  singularLabel: string;
  pluralLabel: string;
}

const PAIRED_ARMORY_SLOT_CONFIGS: PairedArmorySlotConfig[] = [
  { backSlot: "backShoulderguard", frontSlot: "frontShoulderguard", token: "shoulderguard", singularLabel: "Shoulderguard", pluralLabel: "Shoulderguards" },
  { backSlot: "backWrist", frontSlot: "frontWrist", token: "wrist", singularLabel: "Wrist", pluralLabel: "Wrists" },
  { backSlot: "backGlove", frontSlot: "frontGlove", token: "glove", singularLabel: "Glove", pluralLabel: "Gloves" },
  { backSlot: "backGreave", frontSlot: "frontGreave", token: "greave", singularLabel: "Greave", pluralLabel: "Greaves" },
  { backSlot: "backShinguard", frontSlot: "frontShinguard", token: "shinguard", singularLabel: "Shinguard", pluralLabel: "Shinguards" },
  { backSlot: "backBoot", frontSlot: "frontBoot", token: "boot", singularLabel: "Boot", pluralLabel: "Boots" },
];

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
        products: [{ id: "starter-helmet", name: "Training Helmet", price: 0, itemIds: [STARTER_HELMET_ID] }, ...getGeneratedArmoryProductsForSlots(["helmet"])],
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
        products: [
          { id: "starter-breastplate", name: "Leather Breastplate", price: 0, itemIds: [STARTER_BREASTPLATE_ID] },
          { id: "cloth-breastplate", name: "Cloth Breastplate", price: 0, itemIds: [CLOTH_BREASTPLATE_ID] },
          ...getGeneratedArmoryProductsForSlots(["breastplate"]),
        ],
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
        products: [
          {
            id: "starter-shoulderguards",
            name: "Training Shoulderguards",
            price: 0,
            itemIds: [STARTER_BACK_SHOULDERGUARD_ID, STARTER_FRONT_SHOULDERGUARD_ID],
          },
          ...getGeneratedArmoryProductsForSlots(["backShoulderguard", "frontShoulderguard"]),
        ],
      },
      {
        id: "forearms",
        name: "Forearms",
        shortLabel: "FORE",
        products: [
          {
            id: "starter-wrists",
            name: "Training Forearms",
            price: 0,
            itemIds: [STARTER_BACK_WRIST_ID, STARTER_FRONT_WRIST_ID],
          },
          ...getGeneratedArmoryProductsForSlots(["backWrist", "frontWrist"]),
        ],
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
        products: [
          {
            id: "starter-greaves",
            name: "Training Thigh Guards",
            price: 0,
            itemIds: [STARTER_BACK_GREAVE_ID, STARTER_FRONT_GREAVE_ID],
          },
          ...getGeneratedArmoryProductsForSlots(["backGreave", "frontGreave"]),
        ],
      },
      {
        id: "shins",
        name: "Shins",
        shortLabel: "SHIN",
        products: [
          {
            id: "starter-shinguards",
            name: "Training Shinguards",
            price: 0,
            itemIds: [STARTER_BACK_SHINGUARD_ID, STARTER_FRONT_SHINGUARD_ID],
          },
          ...getGeneratedArmoryProductsForSlots(["backShinguard", "frontShinguard"]),
        ],
      },
      {
        id: "feet",
        name: "Feet",
        shortLabel: "FOOT",
        products: [
          {
            id: "starter-boots",
            name: "Training Boots",
            price: 0,
            itemIds: [STARTER_BACK_BOOT_ID, STARTER_FRONT_BOOT_ID],
          },
          ...getGeneratedArmoryProductsForSlots(["backBoot", "frontBoot"]),
        ],
      },
    ],
  },
];

function getGeneratedArmoryProductsForSlots(slotKeys: readonly HeroEquipmentSlotKey[]): ArmoryProduct[] {
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

    if (pairConfig && !counterpart) {
      usedProductIds.add(product.id);
      return;
    }

    if (!pairConfig) {
      pairedProducts.push(product);
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
    price: backProduct.price + frontProduct.price,
    itemIds: [backItemId, frontItemId],
  };
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
  let selectedSubcategoryId: string | undefined;
  let previewProduct: ArmoryProduct | undefined;
  let unmountPreview: (() => void) | undefined;
  let transitionTimer: number | undefined;
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

  const level = document.createElement("span");
  level.className = "armory-shop__level";

  const headerMeta = document.createElement("div");
  headerMeta.className = "armory-shop__header-meta";
  headerMeta.append(gold, level);

  const selected = document.createElement("div");
  selected.className = "armory-shop__selected";

  const subcategories = document.createElement("div");
  subcategories.className = "armory-shop__subcategories";

  const content = document.createElement("div");
  content.className = "armory-shop__content";

  const back = document.createElement("button");
  back.className = "armory-shop__back";
  back.type = "button";
  back.textContent = "<";
  back.setAttribute("aria-label", "Back");
  back.addEventListener("click", () => {
    if (previewProduct) {
      clearProductPreview();
      render();
      return;
    }

    close();
  });

  header.append(back, title, headerMeta);
  if (usesCityHeroPreview) {
    tray.append(header, subcategories, content);
    menu.append(tray, selected, categoryRail);
  } else {
    tray.append(header, subcategories, selected, content);
    menu.append(categoryRail, tray);
  }
  if (options.mountPreview) {
    panel.append(previewShell);
  }
  panel.append(menu);
  shop.append(panel);
  root.append(shop);

  function open(): void {
    clearTransitionTimer();
    selectedCategoryId = ARMORY_CATEGORIES[0]?.id;
    selectedSubcategoryId = ARMORY_CATEGORIES[0]?.subcategories[0]?.id;
    clearProductPreview();
    options.onOpen?.();
    scheduleShopTransition(() => {
      if (usesCityHeroPreview) {
        root.classList.add("city-menu--armory-open");
      }
      shop.hidden = false;
      ensurePreviewMounted();
      render();
    });
  }

  function close(): void {
    if (shop.hidden && !transitionTimer) {
      return;
    }

    clearTransitionTimer();
    clearProductPreview();
    options.onClose?.();
    scheduleShopTransition(() => {
      if (usesCityHeroPreview) {
        root.classList.remove("city-menu--armory-open");
      }
      shop.hidden = true;
      unmountPreview?.();
      unmountPreview = undefined;
    });
  }

  function render(): void {
    const hero = options.getHero();
    const selectedCategory = ARMORY_CATEGORIES.find((category) => category.id === selectedCategoryId) ?? ARMORY_CATEGORIES[0]!;
    const selectedSubcategory =
      selectedCategory.subcategories.find((subcategory) => subcategory.id === selectedSubcategoryId) ?? selectedCategory.subcategories[0]!;

    selectedCategoryId = selectedCategory.id;
    selectedSubcategoryId = selectedSubcategory.id;
    title.textContent = selectedCategory.name;
    gold.textContent = `GOLD ${hero.gold}`;
    level.textContent = `LVL ${hero.level}`;
    categoryRail.replaceChildren();
    subcategories.replaceChildren();
    content.replaceChildren();
    selected.replaceChildren();
    subcategories.hidden = selectedCategory.subcategories.length <= 1;
    selected.hidden = !previewProduct;
    content.classList.toggle("armory-shop__content--categories", false);
    content.classList.toggle("armory-shop__content--products", true);
    content.classList.toggle("armory-shop__content--has-selection", Boolean(previewProduct));
    content.classList.toggle("armory-shop__content--confirm", false);

    ARMORY_CATEGORIES.forEach((category) => {
      categoryRail.append(createCategoryButton(category, category.id === selectedCategory.id));
    });

    selectedCategory.subcategories.forEach((subcategory) => {
      subcategories.append(createSubcategoryButton(subcategory, subcategory.id === selectedSubcategory.id));
    });

    if (previewProduct) {
      selected.append(createSelectedProductStrip(previewProduct, hero));
    }

    if (selectedSubcategory.products.length === 0) {
      content.append(createEmptyState("No items"));
      return;
    }

    selectedSubcategory.products.forEach((product) => {
      content.append(createProductButton(product, hero, previewProduct?.id === product.id));
    });
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
    button.append(createCategoryLabel(category.shortLabel));
    button.addEventListener("click", () => {
      selectedCategoryId = category.id;
      selectedSubcategoryId = category.subcategories[0]?.id;
      clearProductPreview();
      render();
    });

    return button;
  }

  function createSubcategoryButton(subcategory: ArmorySubcategory, isActive: boolean): HTMLButtonElement {
    const button = document.createElement("button");

    button.className = "armory-shop__subcategory-button";
    button.classList.toggle("armory-shop__subcategory-button--active", isActive);
    button.type = "button";
    button.textContent = subcategory.name;
    button.title = subcategory.name;
    button.setAttribute("aria-label", subcategory.name);
    button.setAttribute("aria-pressed", String(isActive));
    button.addEventListener("click", () => {
      selectedSubcategoryId = subcategory.id;
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
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);

    button.className = `armory-shop__option armory-shop__option--product armory-shop__option--rarity-${rarity}`;
    button.classList.toggle("armory-shop__option--selected", isSelected);
    button.classList.toggle("armory-shop__option--owned", actionState === "equip");
    button.classList.toggle("armory-shop__option--equipped", actionState === "equipped");
    button.classList.toggle("armory-shop__option--for-sale", actionState === "buy" || actionState === "no-gold");
    button.type = "button";
    button.title = product.name;
    button.setAttribute("aria-label", `${product.name}, ${getShopRarityLabel(rarity)}, ${armor} armor, ${getShopProductActionLabel(actionState, product.price)}`);
    button.append(createProductRarityBadge(rarity), createProductIcon(iconUrl));
    if (actionState === "buy" || actionState === "no-gold") {
      button.append(createProductStats("AR", armor, product.price));
    }
    button.addEventListener("click", () => {
      previewProduct = product;
      options.onPreview?.(product);
      render();
    });

    return button;
  }

  function createSelectedProductStrip(product: ArmoryProduct, hero: HeroState): HTMLElement {
    const strip = document.createElement("div");
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const armor = getShopProductStat(product.itemIds, "armor");
    const currentArmor = getEquippedShopProductStat(hero, product.itemIds, "armor");

    strip.className = `armory-shop__selected-card armory-shop__selected-card--rarity-${rarity}`;
    strip.append(createProductIcon(iconUrl, "armory-shop__selected-icon"), createSelectedMeta(rarity, "AR", armor, currentArmor, product.price), createPreviewBuyButton(product, hero));

    return strip;
  }

  function createPreviewBuyButton(product: ArmoryProduct, hero: HeroState): HTMLButtonElement {
    const button = document.createElement("button");
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);

    button.className = "armory-shop__selected-buy";
    button.type = "button";
    button.disabled = actionState === "equipped" || actionState === "no-gold";
    button.textContent = getShopProductActionLabel(actionState, product.price);
    button.addEventListener("click", () => {
      previewProduct = undefined;
      options.onBuy(product);
      render();
    });

    return button;
  }

  function clearProductPreview(): void {
    if (!previewProduct) {
      return;
    }

    previewProduct = undefined;
    options.onPreviewClear?.();
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

  return { open, close, render };
}

function createCategoryLabel(text: string): HTMLElement {
  const label = document.createElement("span");

  label.className = "armory-shop__category-label";
  label.textContent = text;

  return label;
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

function createProductRarityBadge(rarity: ShopItemRarity): HTMLElement {
  const badge = document.createElement("span");

  badge.className = "armory-shop__rarity-badge";
  badge.textContent = getShopRarityShortLabel(rarity);
  badge.setAttribute("aria-hidden", "true");

  return badge;
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

function createSelectedMeta(rarity: ShopItemRarity, statLabel: string, stat: number, currentStat: number, price: number): HTMLElement {
  const meta = document.createElement("div");
  const rarityNode = document.createElement("span");
  const statNode = document.createElement("span");
  const priceNode = document.createElement("span");

  meta.className = "armory-shop__selected-meta";
  rarityNode.className = "armory-shop__selected-rarity";
  rarityNode.textContent = getShopRarityLabel(rarity);
  statNode.className = "armory-shop__selected-stat";
  statNode.textContent = currentStat === stat ? `${statLabel} ${stat}` : `${statLabel} ${currentStat} > ${stat}`;
  priceNode.className = "armory-shop__selected-price";
  appendPriceContent(priceNode, price);
  meta.append(rarityNode, statNode, priceNode);

  return meta;
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
