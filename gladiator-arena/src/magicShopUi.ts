import {
  HERO_CRACK_ARMOR_SCROLL_ITEM_ID,
  HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID,
  HERO_FIREBALL_SCROLL_ITEM_ID,
  HERO_PRECISE_STRIKE_SCROLL_ITEM_ID,
  HERO_WARD_SCROLL_ITEM_ID,
  getHeroConsumableMaxQuantity,
  getHeroItemQuantity,
  getHeroScrollQuantity,
  isHeroScrollItemId,
  type HeroItemId,
  type HeroState,
} from "./hero";
import {
  SHOP_BACK_ICON_ASSET_URL,
  SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
} from "./assets";
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
    price: 30,
    itemIds: [HERO_CRACK_ARMOR_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Breaks one random armor piece in battle",
  },
  {
    id: "fireball_scroll",
    name: "Fireball Scroll",
    price: 30,
    itemIds: [HERO_FIREBALL_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Deals 5 direct damage in battle",
  },
  {
    id: "ward_scroll",
    name: "Ward Scroll",
    price: 30,
    itemIds: [HERO_WARD_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Absorbs the next incoming hit",
  },
  {
    id: "precise_strike_scroll",
    name: "Precise Strike Scroll",
    price: 30,
    itemIds: [HERO_PRECISE_STRIKE_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Makes your next strike guaranteed",
  },
  {
    id: "double_strike_scroll",
    name: "Double Strike Scroll",
    price: 30,
    itemIds: [HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Makes your next strike hit twice",
  },
];

const SHOP_LAYOUT_SETTLE_DELAYS_MS = [80, 180, 360] as const;

export function mountMagicShop(root: HTMLElement, options: MagicShopOptions): MagicShopApi {
  let transitionTimer: number | undefined;
  let layoutFrame: number | undefined;
  let layoutSettleTimers: number[] = [];

  const shop = document.createElement("section");
  shop.className = "armory-shop weapon-shop magic-shop armory-shop--city-mode";
  shop.hidden = true;
  shop.setAttribute("aria-label", "Magic shop");

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

  const headerMeta = document.createElement("div");
  headerMeta.className = "armory-shop__header-meta";
  headerMeta.append(gold);

  const content = document.createElement("div");
  content.className = "armory-shop__content armory-shop__content--products magic-shop__content";

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

  header.append(title, headerMeta);
  tray.append(header, content);
  menu.append(tray);
  panel.append(menu, back);
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
      shop.hidden = true;
      clearLayoutSync();
    });
  }

  function render(): void {
    const hero = options.getHero();

    goldAmount.textContent = String(hero.gold);
    gold.setAttribute("aria-label", `Gold ${hero.gold}`);
    content.replaceChildren(...MAGIC_PRODUCTS.map((product) => createMagicProductCard(product, hero)));
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

  function createMagicProductCard(product: MagicProduct, hero: HeroState): HTMLElement {
    const card = document.createElement("article");
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);
    const quantity = getMagicProductQuantity(hero, product);
    const maxQuantity = getMagicProductMaxQuantity(product);
    const displayName = getShopProductDisplayName(product.name);
    const icon = document.createElement("img");
    const badges = document.createElement("span");
    const quantityBadge = document.createElement("span");
    const name = document.createElement("h3");
    const rarityNode = document.createElement("span");
    const effect = document.createElement("p");
    const footer = document.createElement("div");
    const price = document.createElement("span");
    const buyButton = document.createElement("button");

    card.className = `armory-shop__option armory-shop__option--product armory-shop__option--rarity-${rarity} magic-shop__product`;
    card.classList.toggle("armory-shop__option--max", actionState === "max");
    card.classList.toggle("armory-shop__option--for-sale", actionState === "buy");
    icon.className = "armory-shop__product-icon magic-shop__product-icon";
    icon.src = getShopProductIconUrl(product.itemIds) ?? SHOP_CATEGORY_SCROLL_ICON_ASSET_URL;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    badges.className = "armory-shop__product-consumable-badges";
    quantityBadge.className = "armory-shop__product-consumable-quantity";
    quantityBadge.textContent = `${quantity}/${maxQuantity}`;
    badges.append(quantityBadge);
    name.className = "magic-shop__product-name";
    name.textContent = displayName;
    rarityNode.className = "magic-shop__product-rarity";
    rarityNode.textContent = getShopRarityLabel(rarity);
    effect.className = "magic-shop__product-effect";
    effect.textContent = product.effect;
    footer.className = "magic-shop__product-footer";
    price.className = "magic-shop__product-price";
    appendPriceContent(price, product.price);
    buyButton.className = "armory-shop__selected-buy magic-shop__buy";
    buyButton.type = "button";
    buyButton.disabled = actionState === "no-gold" || actionState === "max";
    buyButton.textContent = actionState === "buy" ? "Buy" : getShopProductActionLabel(actionState, product.price);
    buyButton.addEventListener("click", () => {
      if (!buyButton.disabled) {
        options.onBuy(product);
      }
    });
    footer.append(price, buyButton);
    card.append(icon, badges, name, rarityNode, effect, footer);

    return card;
  }

  return { open, close, render, syncHeroState };
}

function getMagicProductQuantity(hero: HeroState, product: MagicProduct): number {
  const itemId = product.itemIds[0];

  if (itemId && isHeroScrollItemId(itemId)) {
    return Math.min(getHeroScrollQuantity(hero), getHeroConsumableMaxQuantity(itemId));
  }

  return itemId ? Math.min(getHeroItemQuantity(hero, itemId), getHeroConsumableMaxQuantity(itemId)) : 0;
}

function getMagicProductMaxQuantity(product: MagicProduct): number {
  const itemId = product.itemIds[0];

  return itemId ? getHeroConsumableMaxQuantity(itemId) : 0;
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
