import {
  HERO_CRACK_ARMOR_SCROLL_ITEM_ID,
  HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID,
  HERO_FIREBALL_SCROLL_ITEM_ID,
  HERO_POISON_SCROLL_ITEM_ID,
  HERO_PRECISE_STRIKE_SCROLL_ITEM_ID,
  HERO_SCROLL_MAX_QUANTITY,
  HERO_WARD_SCROLL_ITEM_ID,
  getHeroScrollQuantity,
  type HeroItemId,
  type HeroState,
} from "./hero";
import {
  CITY_MAGIC_SHOP_BACKGROUND_ASSET_URL,
  MAGIC_SHOP_SELECTED_CARD_FRAME_ASSET_URL,
  MAGIC_SHOP_TITLE_FRAME_ASSET_URL,
  SHOP_BACK_ICON_ASSET_URL,
  SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
} from "./assets";
import { applyUiLayoutTuning } from "./uiLayoutTuning";
import {
  getShopProductActionLabel,
  getShopProductActionState,
  getShopProductDisplayName,
  getShopProductRarity,
  getShopRarityLabel,
  type ShopItemRarity,
} from "./shopPresentation";
import { getShopProductIconUrl } from "./shopItemIcons";

export interface MagicProduct {
  id: string;
  name: string;
  displayName?: string;
  listEffect?: string;
  price: number;
  itemIds: HeroItemId[];
  rarity?: ShopItemRarity;
  effect: string;
}

export interface MagicShopApi {
  open: () => void;
  close: () => void;
  render: () => void;
  syncHeroState: () => void;
}

interface MagicShopOptions {
  getHero: () => HeroState;
  onBuy: (product: MagicProduct) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onLayoutChange?: (menuTopY?: number) => void;
  transitionDelayMs?: number;
}

const MAGIC_PRODUCTS: readonly MagicProduct[] = [
  {
    id: "crack_armor_scroll",
    name: "Crack Armor Scroll",
    displayName: "Armor Crack",
    listEffect: "Removes 1 random armor piece",
    price: 30,
    itemIds: [HERO_CRACK_ARMOR_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Breaks one random armor piece in battle",
  },
  {
    id: "fireball_scroll",
    name: "Fireball Scroll",
    displayName: "Fireball",
    listEffect: "Deals direct damage",
    price: 30,
    itemIds: [HERO_FIREBALL_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Deals 5 direct damage in battle",
  },
  {
    id: "ward_scroll",
    name: "Ward Scroll",
    displayName: "Ward",
    listEffect: "Absorbs the next incoming hit",
    price: 30,
    itemIds: [HERO_WARD_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Absorbs the next incoming hit",
  },
  {
    id: "precise_strike_scroll",
    name: "Precise Strike Scroll",
    displayName: "True Strike",
    listEffect: "Your next attack is 100%",
    price: 30,
    itemIds: [HERO_PRECISE_STRIKE_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Makes your next strike guaranteed",
  },
  {
    id: "double_strike_scroll",
    name: "Double Strike Scroll",
    displayName: "Double Hit",
    listEffect: "Your next attack hits twice",
    price: 30,
    itemIds: [HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Makes your next strike hit twice",
  },
  {
    id: "poison_scroll",
    name: "Poison Scroll",
    displayName: "Poison",
    listEffect: "Poisons the enemy for 2 turns",
    price: 30,
    itemIds: [HERO_POISON_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Poisons the enemy for 2 turns",
  },
];

const SHOP_LAYOUT_SETTLE_DELAYS_MS = [80, 180, 360] as const;

export function mountMagicShop(root: HTMLElement, options: MagicShopOptions): MagicShopApi {
  let transitionTimer: number | undefined;
  let layoutFrame: number | undefined;
  let layoutSettleTimers: number[] = [];
  let selectedProductId = MAGIC_PRODUCTS[0]?.id ?? "";

  const shop = document.createElement("section");
  shop.className = "armory-shop weapon-shop magic-shop armory-shop--city-mode";
  shop.hidden = true;
  shop.style.setProperty("--magic-shop-background-image", `url("${CITY_MAGIC_SHOP_BACKGROUND_ASSET_URL}")`);
  shop.style.setProperty("--magic-shop-title-frame-image", `url("${MAGIC_SHOP_TITLE_FRAME_ASSET_URL}")`);
  shop.style.setProperty("--magic-shop-selected-card-frame-image", `url("${MAGIC_SHOP_SELECTED_CARD_FRAME_ASSET_URL}")`);
  shop.setAttribute("aria-label", "Magic shop");
  applyUiLayoutTuning(shop);

  const panel = document.createElement("div");
  panel.className = "armory-shop__panel";

  const menu = document.createElement("div");
  menu.className = "armory-shop__menu";

  const tray = document.createElement("div");
  tray.className = "armory-shop__tray";

  const header = document.createElement("div");
  header.className = "armory-shop__header";

  const title = document.createElement("h2");
  title.className = "armory-shop__title";
  title.textContent = "Magic Shop";

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

  const scrollCapacity = document.createElement("span");
  const scrollCapacityIcon = document.createElement("img");
  const scrollCapacityAmount = document.createElement("span");

  scrollCapacity.className = "magic-shop__scroll-capacity";
  scrollCapacityIcon.className = "magic-shop__scroll-capacity-icon";
  scrollCapacityIcon.src = SHOP_CATEGORY_SCROLL_ICON_ASSET_URL;
  scrollCapacityIcon.alt = "";
  scrollCapacityIcon.decoding = "async";
  scrollCapacityIcon.draggable = false;
  scrollCapacityAmount.className = "magic-shop__scroll-capacity-amount";
  scrollCapacity.append(scrollCapacityIcon, scrollCapacityAmount);

  const content = document.createElement("div");
  content.className = "armory-shop__content armory-shop__content--products magic-shop__content";

  const preview = document.createElement("section");
  preview.className = "magic-shop__preview";
  preview.setAttribute("aria-label", "Selected scroll");

  const productList = document.createElement("div");
  productList.className = "magic-shop__list";

  const wallet = document.createElement("div");
  wallet.className = "magic-shop__wallet";
  wallet.append(scrollCapacity, gold);

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
  back.addEventListener("click", close);

  content.append(productList, wallet);
  header.append(title);
  tray.append(header, content);
  menu.append(tray);
  panel.append(preview, menu, back);
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
    options.onOpen?.();
    scheduleShopTransition(() => {
      root.classList.add("city-menu--armory-open");
      root.classList.add("city-menu--magic-shop-open");
      shop.hidden = false;
      render();
      scheduleSettledLayoutSync();
    });
  }

  function close(): void {
    if (shop.hidden && !transitionTimer) {
      return;
    }

    clearTransitionTimer();
    options.onClose?.();
    scheduleShopTransition(() => {
      root.classList.remove("city-menu--armory-open");
      root.classList.remove("city-menu--magic-shop-open");
      shop.hidden = true;
      clearLayoutSync();
    });
  }

  function render(): void {
    const hero = options.getHero();
    const scrollCount = Math.min(getHeroScrollQuantity(hero), HERO_SCROLL_MAX_QUANTITY);
    const selectedProduct = getSelectedMagicProduct();

    goldAmount.textContent = String(hero.gold);
    gold.setAttribute("aria-label", `Gold ${hero.gold}`);
    scrollCapacityAmount.textContent = `${scrollCount}/${HERO_SCROLL_MAX_QUANTITY}`;
    scrollCapacity.setAttribute("aria-label", `Scrolls ${scrollCount} of ${HERO_SCROLL_MAX_QUANTITY}`);
    preview.replaceChildren(createMagicProductPreview(selectedProduct, hero));
    productList.replaceChildren(...MAGIC_PRODUCTS.map((product) => createMagicProductListItem(product, hero)));
    scheduleLayoutSync();
  }

  function syncHeroState(): void {
    if (shop.hidden) {
      return;
    }

    render();
  }

  function scheduleShopTransition(callback: () => void): void {
    if ((options.transitionDelayMs ?? 0) <= 0) {
      callback();
      return;
    }

    transitionTimer = window.setTimeout(() => {
      transitionTimer = undefined;
      callback();
    }, options.transitionDelayMs);
  }

  function clearTransitionTimer(): void {
    if (!transitionTimer) {
      return;
    }

    window.clearTimeout(transitionTimer);
    transitionTimer = undefined;
  }

  function scheduleLayoutSync(): void {
    if (!options.onLayoutChange || shop.hidden) {
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
    if (!options.onLayoutChange || shop.hidden) {
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
    if (!options.onLayoutChange || shop.hidden) {
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
    options.onLayoutChange?.(undefined);
  }

  function clearLayoutSettleTimers(): void {
    layoutSettleTimers.forEach((timer) => window.clearTimeout(timer));
    layoutSettleTimers = [];
  }

  function getSelectedMagicProduct(): MagicProduct {
    const selectedProduct = MAGIC_PRODUCTS.find((product) => product.id === selectedProductId) ?? MAGIC_PRODUCTS[0];

    selectedProductId = selectedProduct.id;
    return selectedProduct;
  }

  function createMagicProductPreview(product: MagicProduct, hero: HeroState): HTMLElement {
    const card = document.createElement("article");
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);
    const displayName = getMagicProductDisplayName(product);
    const icon = document.createElement("img");
    const title = document.createElement("div");
    const name = document.createElement("h3");
    const rarityNode = document.createElement("span");
    const effect = document.createElement("p");
    const footer = document.createElement("div");
    const buyButton = document.createElement("button");

    card.className = `magic-shop__preview-card armory-shop__selected-card--rarity-${rarity}`;
    card.classList.toggle("magic-shop__preview-card--max", actionState === "max");
    icon.className = "magic-shop__preview-icon";
    icon.src = getShopProductIconUrl(product.itemIds) ?? SHOP_CATEGORY_SCROLL_ICON_ASSET_URL;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    title.className = "magic-shop__preview-title";
    name.className = "magic-shop__preview-name";
    name.textContent = displayName;
    rarityNode.className = "magic-shop__preview-rarity";
    rarityNode.textContent = getShopRarityLabel(rarity);
    effect.className = "magic-shop__preview-effect";
    effect.textContent = product.effect;
    title.append(name, rarityNode);
    footer.className = "magic-shop__preview-footer";
    buyButton.className = "armory-shop__selected-buy magic-shop__buy";
    buyButton.type = "button";
    buyButton.disabled = actionState === "no-gold" || actionState === "max";
    buyButton.textContent = actionState === "buy" ? "Buy" : getShopProductActionLabel(actionState, product.price);
    buyButton.addEventListener("click", () => {
      if (!buyButton.disabled) {
        options.onBuy(product);
      }
    });
    footer.append(buyButton);
    card.append(title, icon, effect, footer);

    return card;
  }

  function createMagicProductListItem(product: MagicProduct, hero: HeroState): HTMLElement {
    const item = document.createElement("button");
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);
    const displayName = getMagicProductDisplayName(product);
    const icon = document.createElement("img");
    const text = document.createElement("span");
    const name = document.createElement("span");
    const effect = document.createElement("span");
    const price = document.createElement("span");

    item.className = `magic-shop__list-item armory-shop__option--rarity-${rarity}`;
    item.classList.toggle("magic-shop__list-item--selected", product.id === selectedProductId);
    item.classList.toggle("magic-shop__list-item--max", actionState === "max");
    item.classList.toggle("magic-shop__list-item--no-gold", actionState === "no-gold");
    item.type = "button";
    item.title = displayName;
    item.setAttribute("aria-pressed", product.id === selectedProductId ? "true" : "false");
    item.addEventListener("click", () => {
      selectedProductId = product.id;
      render();
    });
    icon.className = "magic-shop__list-icon";
    icon.src = getShopProductIconUrl(product.itemIds) ?? SHOP_CATEGORY_SCROLL_ICON_ASSET_URL;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    text.className = "magic-shop__list-text";
    name.className = "magic-shop__list-name";
    name.textContent = displayName;
    effect.className = "magic-shop__list-effect";
    effect.textContent = product.listEffect ?? product.effect;
    text.append(name, effect);
    price.className = "magic-shop__list-price";
    appendPriceContent(price, product.price);
    item.append(icon, text, price);

    return item;
  }

  return { open, close, render, syncHeroState };
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

function getMagicProductDisplayName(product: MagicProduct): string {
  return getShopProductDisplayName(product.displayName ?? product.name)
    .replace(/\s+Scroll\b/giu, "")
    .trim();
}
