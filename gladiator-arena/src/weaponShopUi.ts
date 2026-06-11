import { TRAINING_WEAPON_ID, type HeroItemId, type HeroState } from "./hero";
import { GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";
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

export interface WeaponProduct {
  id: string;
  name: string;
  price: number;
  itemIds: HeroItemId[];
  rarity?: ShopItemRarity;
}

export interface WeaponShopApi {
  open: () => void;
  close: () => void;
  render: () => void;
}

interface WeaponCategory {
  id: string;
  name: string;
  shortLabel: string;
  products: WeaponProduct[];
  emptyText?: string;
}

interface WeaponShopOptions {
  getHero: () => HeroState;
  mountPreview?: (parent: HTMLElement) => () => void;
  onBuy: (product: WeaponProduct) => void;
  onPreview?: (product: WeaponProduct) => void;
  onPreviewClear?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  transitionDelayMs?: number;
}

const WEAPON_CATEGORIES: WeaponCategory[] = [
  {
    id: "swords",
    name: "Swords",
    shortLabel: "SW",
    products: [{ id: "training-sword", name: "Training Sword", price: 0, itemIds: [TRAINING_WEAPON_ID] }, ...getGeneratedWeaponProducts("swords")],
  },
  {
    id: "axes",
    name: "Axes",
    shortLabel: "AX",
    products: getGeneratedWeaponProducts("axes"),
    emptyText: "Axes soon",
  },
  {
    id: "bows",
    name: "Bows",
    shortLabel: "BW",
    products: getGeneratedWeaponProducts("bows"),
    emptyText: "Bows soon",
  },
];

function getGeneratedWeaponProducts(categoryId: string): WeaponProduct[] {
  return GENERATED_WEAPON_PRODUCTS.filter((product) => product.categoryId === categoryId).map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    itemIds: [...product.itemIds],
  }));
}

export function mountWeaponShop(root: HTMLElement, options: WeaponShopOptions): WeaponShopApi {
  let selectedCategoryId: string | undefined;
  let previewProduct: WeaponProduct | undefined;
  let unmountPreview: (() => void) | undefined;
  let transitionTimer: number | undefined;
  const usesCityHeroPreview = !options.mountPreview;
  const transitionDelayMs = options.transitionDelayMs ?? 0;

  const shop = document.createElement("section");
  shop.className = usesCityHeroPreview ? "armory-shop weapon-shop armory-shop--city-mode" : "armory-shop weapon-shop";
  shop.hidden = true;
  shop.setAttribute("aria-label", "Weaponsmith");

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
  tray.append(header, selected, content);
  menu.append(categoryRail, tray);
  if (options.mountPreview) {
    panel.append(previewShell);
  }
  panel.append(menu);
  shop.append(panel);
  root.append(shop);

  function open(): void {
    clearTransitionTimer();
    selectedCategoryId = WEAPON_CATEGORIES[0]?.id;
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
    const selectedCategory = WEAPON_CATEGORIES.find((category) => category.id === selectedCategoryId) ?? WEAPON_CATEGORIES[0]!;

    selectedCategoryId = selectedCategory.id;
    title.textContent = selectedCategory.name;
    gold.textContent = `GOLD ${hero.gold}`;
    level.textContent = `LVL ${hero.level}`;
    categoryRail.replaceChildren();
    content.replaceChildren();
    selected.replaceChildren();
    selected.hidden = !previewProduct;
    content.classList.toggle("armory-shop__content--categories", false);
    content.classList.toggle("armory-shop__content--products", true);
    content.classList.toggle("armory-shop__content--has-selection", Boolean(previewProduct));
    content.classList.toggle("armory-shop__content--confirm", false);

    WEAPON_CATEGORIES.forEach((category) => {
      categoryRail.append(createCategoryButton(category, category.id === selectedCategory.id));
    });

    if (previewProduct) {
      selected.append(createSelectedProductStrip(previewProduct, hero));
    }

    if (selectedCategory.products.length === 0) {
      content.append(createEmptyState(selectedCategory.emptyText ?? "No items yet"));
      return;
    }

    selectedCategory.products.forEach((product) => {
      content.append(createProductButton(product, hero, previewProduct?.id === product.id));
    });
  }

  function ensurePreviewMounted(): void {
    if (unmountPreview || !options.mountPreview) {
      return;
    }

    unmountPreview = options.mountPreview(preview);
  }

  function createCategoryButton(category: WeaponCategory, isActive: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    const iconUrl = getShopProductIconUrl(category.products.flatMap((product) => product.itemIds));

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

  function createProductButton(product: WeaponProduct, hero: HeroState, isSelected: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const damage = getShopProductStat(product.itemIds, "damage");
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);

    button.className = `armory-shop__option armory-shop__option--product armory-shop__option--rarity-${rarity}`;
    button.classList.toggle("armory-shop__option--selected", isSelected);
    button.classList.toggle("armory-shop__option--owned", actionState === "equip");
    button.classList.toggle("armory-shop__option--equipped", actionState === "equipped");
    button.type = "button";
    button.title = product.name;
    button.setAttribute("aria-label", `${product.name}, ${getShopRarityLabel(rarity)}, ${damage} damage, ${getShopProductActionLabel(actionState, product.price)}`);
    button.append(createRarityBadge(rarity), createProductIcon(iconUrl), createProductStats("DM", damage, product.price));
    button.addEventListener("click", () => {
      previewProduct = product;
      options.onPreview?.(product);
      render();
    });

    return button;
  }

  function createSelectedProductStrip(product: WeaponProduct, hero: HeroState): HTMLElement {
    const strip = document.createElement("div");
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const damage = getShopProductStat(product.itemIds, "damage");
    const currentDamage = getEquippedShopProductStat(hero, product.itemIds, "damage");

    strip.className = `armory-shop__selected-card armory-shop__selected-card--rarity-${rarity}`;
    strip.append(createProductIcon(iconUrl, "armory-shop__selected-icon"), createSelectedMeta(rarity, "DM", damage, currentDamage, product.price), createPreviewBuyButton(product, hero));

    return strip;
  }

  function createPreviewBuyButton(product: WeaponProduct, hero: HeroState): HTMLButtonElement {
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

function createRarityBadge(rarity: ShopItemRarity): HTMLElement {
  const badge = document.createElement("span");

  badge.className = "armory-shop__rarity-badge";
  badge.textContent = getShopRarityShortLabel(rarity);
  badge.title = getShopRarityLabel(rarity);

  return badge;
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

function createProductStats(statLabel: string, stat: number, price: number): HTMLElement {
  const stats = document.createElement("span");
  const statNode = document.createElement("span");
  const priceNode = document.createElement("span");

  stats.className = "armory-shop__product-stats";
  statNode.className = "armory-shop__product-stat";
  statNode.textContent = `${statLabel} ${stat}`;
  priceNode.className = "armory-shop__product-price";
  priceNode.textContent = `${price} G`;
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
  priceNode.textContent = `${price} GOLD`;
  meta.append(rarityNode, statNode, priceNode);

  return meta;
}

function createEmptyState(text: string): HTMLButtonElement {
  const button = document.createElement("button");

  button.className = "armory-shop__option armory-shop__option--empty";
  button.type = "button";
  button.disabled = true;
  button.textContent = text;

  return button;
}
