import { type HeroItemId, type HeroState } from "./hero";
import {
  DAMAGE_HIT_ICON_ASSET_URL,
  SHOP_CATEGORY_AXE_ICON_ASSET_URL,
  SHOP_CATEGORY_BOW_ICON_ASSET_URL,
  SHOP_CATEGORY_MACE_ICON_ASSET_URL,
  SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL,
  SHOP_CATEGORY_SPEAR_ICON_ASSET_URL,
  SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
} from "./assets";
import { GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";
import { getShopProductIconUrl } from "./shopItemIcons";
import {
  getEquippedShopProductStat,
  getShopProductActionLabel,
  getShopProductActionState,
  getShopProductDisplayName,
  getShopProductRequirementDescription,
  getShopProductRequirementLabel,
  getShopProductRarity,
  getShopProductStat,
  getShopRarityLabel,
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
  range: "melee" | "ranged";
  iconUrl?: string;
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
  onLayoutChange?: (menuTopY?: number) => void;
  transitionDelayMs?: number;
}

const WEAPON_CATEGORIES: WeaponCategory[] = [
  {
    id: "swords",
    name: "Swords",
    shortLabel: "SW",
    range: "melee",
    iconUrl: SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("swords"),
  },
  {
    id: "axes",
    name: "Axes",
    shortLabel: "AX",
    range: "melee",
    iconUrl: SHOP_CATEGORY_AXE_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("axes"),
    emptyText: "Axes soon",
  },
  {
    id: "maces",
    name: "Maces",
    shortLabel: "MC",
    range: "melee",
    iconUrl: SHOP_CATEGORY_MACE_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("maces"),
    emptyText: "Maces soon",
  },
  {
    id: "spears",
    name: "Spears",
    shortLabel: "SP",
    range: "melee",
    iconUrl: SHOP_CATEGORY_SPEAR_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("spears"),
    emptyText: "Spears soon",
  },
  {
    id: "bows",
    name: "Bows",
    shortLabel: "BW",
    range: "ranged",
    iconUrl: SHOP_CATEGORY_BOW_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("bows"),
    emptyText: "Bows soon",
  },
  {
    id: "shurikens",
    name: "Shurikens",
    shortLabel: "SH",
    range: "ranged",
    iconUrl: SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("shurikens"),
    emptyText: "Shurikens soon",
  },
];

const MELEE_WEAPON_CATEGORIES = WEAPON_CATEGORIES.filter((category) => category.range === "melee");
const RANGED_WEAPON_CATEGORIES = WEAPON_CATEGORIES.filter((category) => category.range === "ranged");

const SHOP_LAYOUT_SETTLE_DELAYS_MS = [80, 180, 360] as const;

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
  let scrollIndicatorTimer: number | undefined;
  let layoutFrame: number | undefined;
  let layoutSettleTimers: number[] = [];
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
  categoryRail.style.setProperty("--shop-category-count", String(WEAPON_CATEGORIES.length));

  const rangedCategoryRail = document.createElement("div");
  rangedCategoryRail.className = "armory-shop__category-rail armory-shop__category-rail--ranged";
  rangedCategoryRail.style.setProperty("--shop-category-count", String(RANGED_WEAPON_CATEGORIES.length));

  const meleeCategoryRail = document.createElement("div");
  meleeCategoryRail.className = "armory-shop__category-rail armory-shop__category-rail--melee";
  meleeCategoryRail.style.setProperty("--shop-category-count", String(MELEE_WEAPON_CATEGORIES.length));

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
      clearProductPreview();
      render();
      return;
    }

    close();
  });

  if (usesCityHeroPreview) {
    header.append(title, selected, headerMeta);
    tray.append(header, content, scrollIndicator);
    menu.append(rangedCategoryRail, tray, meleeCategoryRail, back);
  } else {
    header.append(back, title, headerMeta);
    tray.append(header, selected, content, scrollIndicator);
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
    selectedCategoryId = WEAPON_CATEGORIES[0]?.id;
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
    const selectedCategory = WEAPON_CATEGORIES.find((category) => category.id === selectedCategoryId) ?? WEAPON_CATEGORIES[0]!;

    selectedCategoryId = selectedCategory.id;
    title.textContent = selectedCategory.name;
    goldAmount.textContent = String(hero.gold);
    gold.setAttribute("aria-label", `Gold ${hero.gold}`);
    levelValue.textContent = String(hero.level);
    level.setAttribute("aria-label", `Level ${hero.level}`);
    categoryRail.replaceChildren();
    rangedCategoryRail.replaceChildren();
    meleeCategoryRail.replaceChildren();
    content.replaceChildren();
    selected.replaceChildren();
    clearScrollIndicator();
    shop.classList.toggle("armory-shop--has-selection", Boolean(previewProduct));
    selected.hidden = !previewProduct;
    content.classList.toggle("armory-shop__content--categories", false);
    content.classList.toggle("armory-shop__content--products", true);
    content.classList.toggle("armory-shop__content--has-selection", Boolean(previewProduct));
    content.classList.toggle("armory-shop__content--confirm", false);

    if (usesCityHeroPreview) {
      renderCategoryRail(rangedCategoryRail, RANGED_WEAPON_CATEGORIES, selectedCategory.id);
      renderCategoryRail(meleeCategoryRail, MELEE_WEAPON_CATEGORIES, selectedCategory.id);
    } else {
      renderCategoryRail(categoryRail, WEAPON_CATEGORIES, selectedCategory.id);
    }

    if (previewProduct) {
      selected.append(createSelectedProductStrip(previewProduct, hero));
    }

    scheduleLayoutSync();

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

  function renderCategoryRail(rail: HTMLElement, categories: readonly WeaponCategory[], activeCategoryId: string): void {
    rail.style.setProperty("--shop-category-count", String(categories.length));
    rail.replaceChildren(...categories.map((category) => createCategoryButton(category, category.id === activeCategoryId)));
  }

  function createCategoryButton(category: WeaponCategory, isActive: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    const iconUrl = category.iconUrl ?? getShopProductIconUrl(category.products.flatMap((product) => product.itemIds));

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
    const displayName = getShopProductDisplayName(product.name);
    const requirementLabel = getShopProductRequirementLabel(hero, product.itemIds);
    const requirementDescription = getShopProductRequirementDescription(hero, product.itemIds);

    button.className = `armory-shop__option armory-shop__option--product armory-shop__option--rarity-${rarity}`;
    button.classList.toggle("armory-shop__option--selected", isSelected);
    button.classList.toggle("armory-shop__option--owned", actionState === "equip");
    button.classList.toggle("armory-shop__option--equipped", actionState === "equipped");
    button.classList.toggle("armory-shop__option--max", actionState === "max");
    button.classList.toggle("armory-shop__option--for-sale", actionState === "buy" || actionState === "no-gold");
    button.classList.toggle("armory-shop__option--locked", actionState === "locked");
    button.type = "button";
    button.title = requirementDescription ? `${displayName} - ${requirementDescription}` : displayName;
    button.setAttribute(
      "aria-label",
      `${displayName}, ${getShopRarityLabel(rarity)}, ${damage} damage, ${requirementDescription || getShopProductActionLabel(actionState, product.price)}`,
    );
    button.append(createProductIcon(iconUrl));
    if (actionState === "buy" || actionState === "no-gold" || actionState === "locked") {
      button.append(createProductStats("damage", DAMAGE_HIT_ICON_ASSET_URL, damage, product.price, requirementLabel));
    }
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
    const displayName = getShopProductDisplayName(product.name);

    strip.className = `armory-shop__selected-card armory-shop__selected-card--rarity-${rarity}`;
    strip.append(
      createProductIcon(iconUrl, "armory-shop__selected-icon"),
      createSelectedMeta(displayName, rarity, "damage", DAMAGE_HIT_ICON_ASSET_URL, damage, currentDamage, product.price),
      createPreviewBuyButton(product, hero),
    );

    return strip;
  }

  function createPreviewBuyButton(product: WeaponProduct, hero: HeroState): HTMLButtonElement {
    const button = document.createElement("button");
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);
    const requirementLabel = getShopProductRequirementLabel(hero, product.itemIds);

    button.className = "armory-shop__selected-buy";
    button.type = "button";
    button.disabled = actionState === "equipped" || actionState === "no-gold" || actionState === "locked" || actionState === "max";
    button.textContent = actionState === "locked" && requirementLabel ? requirementLabel : getShopProductActionLabel(actionState, product.price);
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

    clearProductPreview();
    render();
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

function createProductStats(statLabel: string, statIconUrl: string, stat: number, price: number, requirementLabel = ""): HTMLElement {
  const stats = document.createElement("span");
  const statNode = document.createElement("span");
  const statIcon = document.createElement("img");
  const statValue = document.createElement("span");
  const priceNode = document.createElement("span");

  stats.className = "armory-shop__product-stats";
  statNode.className = "armory-shop__product-stat";
  statNode.setAttribute("aria-label", `${statLabel} ${stat}`);
  statIcon.className = "armory-shop__product-stat-icon";
  statIcon.src = statIconUrl;
  statIcon.alt = "";
  statIcon.decoding = "async";
  statIcon.draggable = false;
  statValue.className = "armory-shop__product-stat-value";
  statValue.textContent = String(stat);
  priceNode.className = requirementLabel ? "armory-shop__product-requirement" : "armory-shop__product-price";
  if (requirementLabel) {
    priceNode.textContent = requirementLabel;
  } else {
    appendPriceContent(priceNode, price);
  }
  statNode.append(statIcon, statValue);
  stats.append(statNode, priceNode);

  return stats;
}

function createSelectedMeta(
  productName: string,
  rarity: ShopItemRarity,
  statLabel: string,
  statIconUrl: string,
  stat: number,
  currentStat: number,
  price: number,
): HTMLElement {
  const meta = document.createElement("div");
  const nameNode = document.createElement("span");
  const rarityNode = document.createElement("span");
  const statNode = document.createElement("span");
  const statIcon = document.createElement("img");
  const currentStatNode = document.createElement("span");
  const nextStatNode = document.createElement("span");
  const priceNode = document.createElement("span");

  meta.className = "armory-shop__selected-meta";
  nameNode.className = "armory-shop__selected-name";
  nameNode.textContent = productName;
  rarityNode.className = "armory-shop__selected-rarity";
  rarityNode.textContent = getShopRarityLabel(rarity);
  statNode.className = "armory-shop__selected-stat";
  statNode.setAttribute("aria-label", currentStat === stat ? `${statLabel} ${stat}` : `${statLabel} ${currentStat} to ${stat}`);
  statIcon.className = "armory-shop__selected-stat-icon";
  statIcon.src = statIconUrl;
  statIcon.alt = "";
  statIcon.decoding = "async";
  statIcon.draggable = false;
  currentStatNode.className = "armory-shop__selected-stat-value";
  currentStatNode.textContent = String(currentStat);
  nextStatNode.className = "armory-shop__selected-stat-value";
  nextStatNode.classList.toggle("armory-shop__selected-stat-value--positive", stat > currentStat);
  nextStatNode.classList.toggle("armory-shop__selected-stat-value--negative", stat < currentStat);
  nextStatNode.textContent = String(stat);
  statNode.append(statIcon, currentStatNode);
  if (currentStat !== stat) {
    const arrowNode = document.createElement("span");

    arrowNode.className = "armory-shop__selected-stat-arrow";
    arrowNode.textContent = ">";
    statNode.append(arrowNode, nextStatNode);
  }
  priceNode.className = "armory-shop__selected-price";
  appendPriceContent(priceNode, price);
  meta.append(nameNode, rarityNode, statNode, priceNode);

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
