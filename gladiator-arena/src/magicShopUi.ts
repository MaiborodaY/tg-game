import {
  HERO_CRACK_ARMOR_SCROLL_ITEM_ID,
  HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID,
  HERO_FIREBALL_SCROLL_ITEM_ID,
  HERO_POISON_SCROLL_ITEM_ID,
  HERO_PRECISE_STRIKE_SCROLL_ITEM_ID,
  HERO_SCROLL_CAPACITY_MAX,
  HERO_SCROLL_UPGRADE_RARITIES,
  HERO_WEAPON_SHARPENING_MAX_LEVEL,
  HERO_ITEM_CATALOG,
  HERO_WARD_SCROLL_ITEM_ID,
  canUpgradeHeroScroll,
  canUpgradeHeroScrollCapacity,
  canSharpenHeroActiveWeapon,
  getActiveSharpenableHeroWeaponItemId,
  getHeroActiveWeaponSharpeningPrice,
  getHeroCrackArmorPartsForRarity,
  getHeroDoubleStrikeDamageMultiplierForRarity,
  getHeroFireballDamageForRarity,
  getHeroPoisonDamageForRarity,
  getHeroPreciseStrikeBlockChanceReductionForRarity,
  getHeroScrollCapacity,
  getHeroScrollCapacityUpgradePrice,
  getHeroScrollPurchasePrice,
  getHeroScrollUpgradePrice,
  getHeroScrollUpgradeRarityForItem,
  getHeroScrollQuantity,
  getHeroWardHitCountForRarity,
  getHeroWeaponSharpeningLevel,
  isHeroUpgradeableScrollItemId,
  type HeroItemId,
  type HeroScrollUpgradeRarity,
  type HeroState,
} from "./hero";
import {
  CITY_MAGIC_SHOP_BACKGROUND_ASSET_URL,
  MAGIC_SHOP_SCROLL_CAPACITY_UPGRADE_ICON_URL,
  MAGIC_SHOP_SELECTED_CARD_FRAME_ASSET_URL,
  MAGIC_SHOP_TITLE_FRAME_ASSET_URL,
  SHOP_BACK_ICON_ASSET_URL,
  SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
  SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
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
import { getHeroScrollEffectText } from "./scrollEffectText";

export interface MagicProduct {
  id: string;
  name: string;
  displayName?: string;
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
  onUpgradeScroll: (product: MagicProduct) => void;
  onScrollCapacityUpgrade: () => void;
  onSharpenWeapon: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onLayoutChange?: (menuTopY?: number) => void;
  transitionDelayMs?: number;
}

interface MagicProductPreviewElements {
  card: HTMLElement;
  icon: HTMLImageElement;
  name: HTMLHeadingElement;
  rarity: HTMLSpanElement;
  effect: HTMLParagraphElement;
  buyButton: HTMLButtonElement;
}

interface MagicProductListItemElements {
  item: HTMLElement;
  selectButton: HTMLButtonElement;
  upgradeButton: HTMLButtonElement;
  price: HTMLElement;
  priceAmount: HTMLElement;
}

interface MagicProductUpgradePreview {
  price: number;
  currentRarity: HeroScrollUpgradeRarity;
  nextRarity: HeroScrollUpgradeRarity;
  label: string;
  currentValue: string;
  nextValue: string;
  suffix?: string;
}

interface MagicScrollCapacityUpgradeElements {
  root: HTMLElement;
  card: HTMLButtonElement;
  current: HTMLElement;
  arrow: HTMLElement;
  next: HTMLElement;
  price: HTMLElement;
}

type MagicShopMode = "home" | "scrolls" | "weaponSharpening";

const MAGIC_PRODUCTS: readonly MagicProduct[] = [
  {
    id: "crack_armor_scroll",
    name: "Crack Armor Scroll",
    displayName: "Armor Crack",
    price: 30,
    itemIds: [HERO_CRACK_ARMOR_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Breaks armor parts in battle",
  },
  {
    id: "fireball_scroll",
    name: "Fireball Scroll",
    displayName: "Fireball",
    price: 50,
    itemIds: [HERO_FIREBALL_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Deals damage in battle",
  },
  {
    id: "ward_scroll",
    name: "Ward Scroll",
    displayName: "Ward",
    price: 30,
    itemIds: [HERO_WARD_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Blocks incoming hits",
  },
  {
    id: "precise_strike_scroll",
    name: "Precise Strike Scroll",
    displayName: "True Strike",
    price: 30,
    itemIds: [HERO_PRECISE_STRIKE_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Focuses your next 3 strikes",
  },
  {
    id: "double_strike_scroll",
    name: "Double Strike Scroll",
    displayName: "Double Hit",
    price: 30,
    itemIds: [HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID],
    rarity: "common",
    effect: "Repeats your next strike",
  },
  {
    id: "poison_scroll",
    name: "Poison Scroll",
    displayName: "Poison",
    price: 35,
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
  let mode: MagicShopMode = "home";
  let selectedProductId = MAGIC_PRODUCTS[0]?.id ?? "";
  let pendingUpgradeProductId: string | undefined;

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

  const home = document.createElement("div");
  home.className = "magic-shop__home";
  const scrollsModeButton = createMagicShopHomeAction({
    label: "Scrolls",
    detail: "Battle magic",
    iconUrl: SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
    onClick: () => setMode("scrolls"),
  });
  const enchantModeButton = createMagicShopHomeAction({
    label: "Weapon Sharpening",
    detail: "+ flat damage",
    iconUrl: SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
    onClick: () => setMode("weaponSharpening"),
  });

  home.append(scrollsModeButton, enchantModeButton);

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
  back.addEventListener("click", handleBack);

  const previewElements = createMagicProductPreview();
  const scrollUpgradeElements = createMagicScrollCapacityUpgrade();
  const productListItems = MAGIC_PRODUCTS.map((product) => [product.id, createMagicProductListItem(product)] as const);
  const productListItemsById = new Map(productListItems);

  preview.append(previewElements.card);
  productList.append(...productListItems.map(([, elements]) => elements.item));
  content.append(home, productList, wallet);
  header.append(title);
  tray.append(header, content);
  menu.append(tray);
  panel.append(preview, menu, scrollUpgradeElements.root, back);
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
      mode = "home";
      pendingUpgradeProductId = undefined;
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
    pendingUpgradeProductId = undefined;
    options.onClose?.();
    scheduleShopTransition(() => {
      root.classList.remove("city-menu--armory-open");
      root.classList.remove("city-menu--magic-shop-open");
      shop.hidden = true;
      clearLayoutSync();
    });
  }

  function handleBack(): void {
    if (mode !== "home") {
      setMode("home");
      return;
    }

    close();
  }

  function render(): void {
    const hero = options.getHero();

    refreshHeroState(hero);
    scheduleLayoutSync();
  }

  function syncHeroState(): void {
    if (shop.hidden) {
      return;
    }

    refreshHeroState(options.getHero());
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

  function setMode(nextMode: MagicShopMode): void {
    if (mode === nextMode) {
      return;
    }

    mode = nextMode;
    pendingUpgradeProductId = undefined;
    refreshHeroState(options.getHero());
    scheduleLayoutSync();
  }

  function refreshHeroState(hero: HeroState): void {
    refreshMode();
    refreshWallet(hero);
    refreshScrollCapacityUpgrade(hero);
    if (mode === "scrolls") {
      refreshSelectedProduct(hero);
      refreshProductList(hero);
      return;
    }

    if (mode === "weaponSharpening") {
      refreshWeaponSharpening(hero);
    }
  }

  function refreshMode(): void {
    shop.classList.toggle("magic-shop--mode-home", mode === "home");
    shop.classList.toggle("magic-shop--mode-scrolls", mode === "scrolls");
    shop.classList.toggle("magic-shop--mode-sharpening", mode === "weaponSharpening");
    preview.hidden = mode === "home";
    home.hidden = mode !== "home";
    productList.hidden = mode !== "scrolls";
    scrollUpgradeElements.root.hidden = mode !== "scrolls";
    preview.setAttribute("aria-label", mode === "weaponSharpening" ? "Weapon sharpening" : "Selected scroll");
  }

  function refreshWallet(hero: HeroState): void {
    const scrollCapacityValue = getHeroScrollCapacity(hero);
    const scrollCount = Math.min(getHeroScrollQuantity(hero), scrollCapacityValue);

    setTextContentIfChanged(goldAmount, String(hero.gold));
    gold.setAttribute("aria-label", `Gold ${hero.gold}`);
    scrollCapacity.hidden = mode !== "scrolls";
    setTextContentIfChanged(scrollCapacityAmount, `${scrollCount}/${scrollCapacityValue}`);
    scrollCapacity.setAttribute("aria-label", `Scrolls ${scrollCount} of ${scrollCapacityValue}`);
  }

  function refreshScrollCapacityUpgrade(hero: HeroState): void {
    const currentCapacity = getHeroScrollCapacity(hero);
    const price = getHeroScrollCapacityUpgradePrice(hero);
    const isMaxed = currentCapacity >= HERO_SCROLL_CAPACITY_MAX || price === undefined;
    const canBuy = canUpgradeHeroScrollCapacity(hero);
    const nextCapacity = Math.min(HERO_SCROLL_CAPACITY_MAX, currentCapacity + 1);

    scrollUpgradeElements.card.disabled = isMaxed || !canBuy;
    scrollUpgradeElements.card.classList.toggle("magic-shop__scroll-upgrade-card--max", isMaxed);
    scrollUpgradeElements.card.classList.toggle("magic-shop__scroll-upgrade-card--no-gold", !isMaxed && !canBuy);
    scrollUpgradeElements.card.setAttribute(
      "aria-label",
      isMaxed
        ? `Scroll capacity ${currentCapacity} of ${HERO_SCROLL_CAPACITY_MAX}, max`
        : `Upgrade scroll capacity from ${currentCapacity} to ${nextCapacity} for ${price} gold`,
    );
    setTextContentIfChanged(scrollUpgradeElements.current, String(currentCapacity));
    setTextContentIfChanged(scrollUpgradeElements.arrow, isMaxed ? "/" : ">");
    setTextContentIfChanged(scrollUpgradeElements.next, String(isMaxed ? HERO_SCROLL_CAPACITY_MAX : nextCapacity));
    scrollUpgradeElements.price.replaceChildren();
    if (isMaxed) {
      scrollUpgradeElements.price.textContent = "Max";
    } else {
      appendPriceContent(scrollUpgradeElements.price, price ?? 0);
    }
  }

  function refreshSelectedProduct(hero: HeroState): void {
    const product = getSelectedMagicProduct();
    const price = getMagicProductPurchasePrice(hero, product);
    const rarity = getMagicProductRarity(hero, product);
    const actionState = getShopProductActionState(hero, product.itemIds, price);
    const upgradePreview = pendingUpgradeProductId === product.id ? getMagicProductUpgradePreview(hero, product) : undefined;
    const previewRarity = upgradePreview?.nextRarity ?? rarity;
    const displayName = getMagicProductDisplayName(product);
    const iconUrl = getShopProductIconUrl(product.itemIds) ?? SHOP_CATEGORY_SCROLL_ICON_ASSET_URL;
    const actionLabel = actionState === "buy" ? "Buy" : getShopProductActionLabel(actionState, price);

    if (pendingUpgradeProductId === product.id && !upgradePreview) {
      pendingUpgradeProductId = undefined;
    }

    previewElements.card.className = `magic-shop__preview-card armory-shop__selected-card--rarity-${previewRarity}`;
    previewElements.card.classList.toggle("magic-shop__preview-card--max", actionState === "max");
    previewElements.card.classList.toggle("magic-shop__preview-card--upgrade", Boolean(upgradePreview));
    setImageSourceIfChanged(previewElements.icon, iconUrl);
    setTextContentIfChanged(previewElements.name, displayName);
    setMagicProductPreviewRarity(previewElements.rarity, rarity, upgradePreview);
    setMagicProductPreviewEffect(previewElements.effect, hero, product, upgradePreview);
    previewElements.buyButton.disabled = upgradePreview ? hero.gold < upgradePreview.price : actionState === "no-gold" || actionState === "max";
    setMagicProductPreviewAction(previewElements.buyButton, actionLabel, upgradePreview);
  }

  function refreshWeaponSharpening(hero: HeroState): void {
    const activeWeaponItemId = hero.equipment.weaponMain;
    const sharpenableItemId = getActiveSharpenableHeroWeaponItemId(hero);
    const displayItemId = sharpenableItemId ?? activeWeaponItemId;
    const displayItem = displayItemId ? HERO_ITEM_CATALOG[displayItemId] : undefined;
    const sharpeningLevel = getHeroWeaponSharpeningLevel(hero.weaponEnchantments, sharpenableItemId);
    const sharpeningPrice = getHeroActiveWeaponSharpeningPrice(hero);
    const canSharpen = canSharpenHeroActiveWeapon(hero);
    const isMaxSharpening = sharpeningLevel >= HERO_WEAPON_SHARPENING_MAX_LEVEL;
    const hasEnoughGold = sharpeningPrice !== undefined && hero.gold >= sharpeningPrice;
    const iconUrl = displayItemId ? getShopProductIconUrl([displayItemId]) : undefined;
    const displayName = displayItem ? getShopProductDisplayName(displayItem.name) : "No Weapon";
    const status = sharpenableItemId ? `+${sharpeningLevel}/${HERO_WEAPON_SHARPENING_MAX_LEVEL}` : "No Sharpening";
    const effect = getWeaponSharpeningEffectText(Boolean(activeWeaponItemId), Boolean(sharpenableItemId), isMaxSharpening, sharpeningPrice, hasEnoughGold);

    previewElements.card.className = "magic-shop__preview-card magic-shop__preview-card--sharpening";
    previewElements.card.classList.toggle("magic-shop__preview-card--max", isMaxSharpening);
    setImageSourceIfChanged(previewElements.icon, iconUrl ?? SHOP_CATEGORY_SWORD_ICON_ASSET_URL);
    setTextContentIfChanged(previewElements.name, displayName);
    setTextContentIfChanged(previewElements.rarity, status);
    setTextContentIfChanged(previewElements.effect, effect);
    previewElements.buyButton.disabled = !canSharpen;
    setTextContentIfChanged(
      previewElements.buyButton,
      getWeaponSharpeningActionLabel(Boolean(activeWeaponItemId), Boolean(sharpenableItemId), isMaxSharpening, hasEnoughGold, sharpeningPrice),
    );
  }

  function refreshProductList(hero: HeroState): void {
    MAGIC_PRODUCTS.forEach((product) => {
      const elements = productListItemsById.get(product.id);

      if (!elements) {
        return;
      }

      const price = getMagicProductPurchasePrice(hero, product);
      const rarity = getMagicProductRarity(hero, product);
      const actionState = getShopProductActionState(hero, product.itemIds, price);
      const upgradePrice = getMagicProductUpgradePrice(hero, product);
      const canUpgrade = canUpgradeMagicProduct(hero, product);
      const canEventuallyUpgrade = upgradePrice !== undefined;

      elements.item.className = `magic-shop__list-item armory-shop__option--rarity-${rarity}`;
      elements.item.classList.toggle("magic-shop__list-item--selected", product.id === selectedProductId);
      elements.item.classList.toggle("magic-shop__list-item--max", actionState === "max");
      elements.item.classList.toggle("magic-shop__list-item--no-gold", actionState === "no-gold");
      elements.item.classList.toggle("magic-shop__list-item--upgrade-ready", canUpgrade);
      elements.item.classList.toggle("magic-shop__list-item--upgrade-max", isMagicProductUpgradeMax(hero, product));
      elements.item.classList.toggle("magic-shop__list-item--upgrade-pending", product.id === pendingUpgradeProductId);
      elements.selectButton.setAttribute("aria-pressed", product.id === selectedProductId ? "true" : "false");
      setPriceAmount(elements.price, elements.priceAmount, price);
      refreshMagicProductUpgradeButton(elements.upgradeButton, product, upgradePrice, canUpgrade, canEventuallyUpgrade);
    });
  }

  function selectMagicProduct(productId: string): void {
    if (selectedProductId === productId && pendingUpgradeProductId !== productId) {
      return;
    }

    selectedProductId = productId;
    pendingUpgradeProductId = undefined;
    refreshHeroState(options.getHero());
    scheduleLayoutSync();
  }

  function selectMagicProductUpgrade(product: MagicProduct): void {
    selectedProductId = product.id;
    pendingUpgradeProductId = product.id;
    refreshHeroState(options.getHero());
    scheduleLayoutSync();
  }

  function createMagicProductPreview(): MagicProductPreviewElements {
    const card = document.createElement("article");
    const icon = document.createElement("img");
    const title = document.createElement("div");
    const name = document.createElement("h3");
    const rarityNode = document.createElement("span");
    const effect = document.createElement("p");
    const footer = document.createElement("div");
    const buyButton = document.createElement("button");

    card.className = "magic-shop__preview-card";
    icon.className = "magic-shop__preview-icon";
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    title.className = "magic-shop__preview-title";
    name.className = "magic-shop__preview-name";
    rarityNode.className = "magic-shop__preview-rarity";
    effect.className = "magic-shop__preview-effect";
    title.append(name, rarityNode);
    footer.className = "magic-shop__preview-footer";
    buyButton.className = "armory-shop__selected-buy magic-shop__buy";
    buyButton.type = "button";
    buyButton.addEventListener("click", () => {
      if (buyButton.disabled) {
        return;
      }

      if (mode === "weaponSharpening") {
        options.onSharpenWeapon();
      } else if (pendingUpgradeProductId === getSelectedMagicProduct().id) {
        const product = getSelectedMagicProduct();

        pendingUpgradeProductId = undefined;
        options.onUpgradeScroll(product);
      } else {
        options.onBuy(getMagicProductPurchase(getSelectedMagicProduct(), options.getHero()));
      }
    });
    footer.append(buyButton);
    card.append(title, icon, effect, footer);

    return { card, icon, name, rarity: rarityNode, effect, buyButton };
  }

  function createMagicProductListItem(product: MagicProduct): MagicProductListItemElements {
    const item = document.createElement("div");
    const selectButton = document.createElement("button");
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const displayName = getMagicProductDisplayName(product);
    const icon = document.createElement("img");
    const text = document.createElement("span");
    const name = document.createElement("span");
    const upgradeButton = document.createElement("button");
    const price = document.createElement("span");
    const priceAmount = appendPriceContent(price, product.price);

    item.className = `magic-shop__list-item armory-shop__option--rarity-${rarity}`;
    item.title = displayName;
    selectButton.className = "magic-shop__list-select";
    selectButton.type = "button";
    selectButton.addEventListener("click", () => {
      selectMagicProduct(product.id);
    });
    icon.className = "magic-shop__list-icon";
    icon.src = getShopProductIconUrl(product.itemIds) ?? SHOP_CATEGORY_SCROLL_ICON_ASSET_URL;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    text.className = "magic-shop__list-text";
    name.className = "magic-shop__list-name";
    name.textContent = displayName;
    text.append(name);
    selectButton.append(icon, text);
    upgradeButton.className = "magic-shop__list-upgrade";
    upgradeButton.type = "button";
    upgradeButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (upgradeButton.disabled) {
        return;
      }

      selectMagicProductUpgrade(product);
    });
    price.className = "magic-shop__list-price";
    item.append(selectButton, upgradeButton, price);

    return { item, selectButton, upgradeButton, price, priceAmount };
  }

  function createMagicScrollCapacityUpgrade(): MagicScrollCapacityUpgradeElements {
    const root = document.createElement("div");
    const card = document.createElement("button");
    const icon = document.createElement("img");
    const capacity = document.createElement("span");
    const current = document.createElement("span");
    const arrow = document.createElement("span");
    const next = document.createElement("span");
    const price = document.createElement("span");

    root.className = "magic-shop__scroll-upgrade";
    card.className = "magic-shop__scroll-upgrade-card";
    card.type = "button";
    icon.className = "magic-shop__scroll-upgrade-icon";
    icon.src = MAGIC_SHOP_SCROLL_CAPACITY_UPGRADE_ICON_URL;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    capacity.className = "magic-shop__scroll-upgrade-capacity";
    current.className = "magic-shop__scroll-upgrade-capacity-current";
    arrow.className = "magic-shop__scroll-upgrade-capacity-arrow";
    next.className = "magic-shop__scroll-upgrade-capacity-next";
    price.className = "magic-shop__scroll-upgrade-price";
    card.addEventListener("click", () => {
      if (card.disabled) {
        return;
      }

      options.onScrollCapacityUpgrade();
    });
    capacity.append(current, arrow, next);
    card.append(icon, capacity, price);
    root.append(card);

    return { root, card, current, arrow, next, price };
  }

  return { open, close, render, syncHeroState };
}

function createMagicShopHomeAction(options: { label: string; detail: string; iconUrl: string; onClick: () => void }): HTMLButtonElement {
  const button = document.createElement("button");
  const icon = document.createElement("img");
  const text = document.createElement("span");
  const label = document.createElement("strong");
  const detail = document.createElement("span");

  button.className = "magic-shop__home-action";
  button.type = "button";
  button.addEventListener("click", options.onClick);
  icon.className = "magic-shop__home-icon";
  icon.src = options.iconUrl;
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  text.className = "magic-shop__home-text";
  label.className = "magic-shop__home-label";
  detail.className = "magic-shop__home-detail";
  label.textContent = options.label;
  detail.textContent = options.detail;
  text.append(label, detail);
  button.append(icon, text);

  return button;
}

function setTextContentIfChanged(node: HTMLElement, text: string): void {
  if (node.textContent === text) {
    return;
  }

  node.textContent = text;
}

function setImageSourceIfChanged(image: HTMLImageElement, src: string): void {
  if (image.getAttribute("src") === src) {
    return;
  }

  image.src = src;
}

function appendPriceContent(priceNode: HTMLElement, price: number): HTMLElement {
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
  return amount;
}

function setPriceAmount(priceNode: HTMLElement, amountNode: HTMLElement, price: number): void {
  priceNode.setAttribute("aria-label", `${price} gold`);
  setTextContentIfChanged(amountNode, String(price));
}

function getMagicProductPrimaryItemId(product: MagicProduct): HeroItemId | undefined {
  return product.itemIds[0];
}

function getMagicProductPurchase(product: MagicProduct, hero: HeroState): MagicProduct {
  return {
    ...product,
    price: getMagicProductPurchasePrice(hero, product),
    rarity: getMagicProductRarity(hero, product),
    effect: getMagicProductEffect(hero, product),
  };
}

function getMagicProductPurchasePrice(hero: HeroState, product: MagicProduct): number {
  return getHeroScrollPurchasePrice(hero, getMagicProductPrimaryItemId(product), product.price);
}

function getMagicProductUpgradePrice(hero: HeroState, product: MagicProduct): number | undefined {
  return getHeroScrollUpgradePrice(hero, getMagicProductPrimaryItemId(product));
}

function getMagicProductRarity(hero: HeroState, product: MagicProduct): ShopItemRarity {
  return getHeroScrollUpgradeRarityForItem(hero, getMagicProductPrimaryItemId(product)) ?? getShopProductRarity(product.itemIds, product.rarity);
}

function getMagicProductEffect(hero: HeroState, product: MagicProduct): string {
  return getHeroScrollEffectText(hero, getMagicProductPrimaryItemId(product), product.effect);
}

function setMagicProductPreviewAction(
  button: HTMLButtonElement,
  actionLabel: string,
  upgradePreview: MagicProductUpgradePreview | undefined,
): void {
  button.classList.toggle("magic-shop__buy--upgrade-confirm", Boolean(upgradePreview));

  if (!upgradePreview) {
    button.removeAttribute("aria-label");
    setTextContentIfChanged(button, actionLabel);
    return;
  }

  const label = document.createElement("span");
  const price = document.createElement("span");
  const icon = document.createElement("img");
  const amount = document.createElement("span");

  label.className = "magic-shop__buy-label";
  label.textContent = "Upgrade";
  price.className = "magic-shop__buy-price";
  icon.className = "armory-shop__price-icon magic-shop__buy-price-icon";
  icon.src = SHOP_GOLD_COIN_ICON_ASSET_URL;
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  amount.className = "magic-shop__buy-price-amount";
  amount.textContent = String(upgradePreview.price);
  price.append(icon, amount);
  button.setAttribute("aria-label", `Upgrade for ${upgradePreview.price} gold`);
  button.replaceChildren(label, price);
}

function setMagicProductPreviewEffect(
  effectNode: HTMLParagraphElement,
  hero: HeroState,
  product: MagicProduct,
  upgradePreview: MagicProductUpgradePreview | undefined,
): void {
  if (!upgradePreview) {
    effectNode.classList.remove("magic-shop__preview-effect--upgrade");
    setTextContentIfChanged(effectNode, getMagicProductEffect(hero, product));
    return;
  }

  const nextValue = document.createElement("span");

  nextValue.className = "magic-shop__effect-diff";
  nextValue.textContent = upgradePreview.nextValue;
  effectNode.classList.add("magic-shop__preview-effect--upgrade");
  effectNode.replaceChildren(
    document.createTextNode(`${upgradePreview.label}${upgradePreview.suffix ? " " : ": "}${upgradePreview.currentValue} > `),
    nextValue,
    document.createTextNode(`${upgradePreview.suffix ? ` ${upgradePreview.suffix}` : ""}.`),
  );
}

function setMagicProductPreviewRarity(
  rarityNode: HTMLElement,
  rarity: ShopItemRarity,
  upgradePreview: MagicProductUpgradePreview | undefined,
): void {
  rarityNode.classList.toggle("magic-shop__preview-rarity--upgrade", Boolean(upgradePreview));

  if (!upgradePreview) {
    setTextContentIfChanged(rarityNode, getShopRarityLabel(rarity));
    return;
  }

  const currentRarity = document.createElement("span");
  const separator = document.createElement("span");
  const nextRarity = document.createElement("span");

  currentRarity.className = `magic-shop__rarity-token armory-shop__option--rarity-${upgradePreview.currentRarity}`;
  currentRarity.textContent = getShopRarityLabel(upgradePreview.currentRarity);
  separator.className = "magic-shop__rarity-separator";
  separator.textContent = ">";
  nextRarity.className = `magic-shop__rarity-token armory-shop__option--rarity-${upgradePreview.nextRarity}`;
  nextRarity.textContent = getShopRarityLabel(upgradePreview.nextRarity);
  rarityNode.replaceChildren(currentRarity, separator, nextRarity);
}

function getMagicProductUpgradePreview(hero: HeroState, product: MagicProduct): MagicProductUpgradePreview | undefined {
  const itemId = getMagicProductPrimaryItemId(product);
  const price = getMagicProductUpgradePrice(hero, product);
  const currentRarity = getHeroScrollUpgradeRarityForItem(hero, itemId);
  const nextRarity = currentRarity ? getNextMagicProductUpgradeRarity(currentRarity) : undefined;
  const effect = itemId && currentRarity && nextRarity ? getMagicProductUpgradeEffect(itemId, currentRarity, nextRarity) : undefined;

  if (!effect || price === undefined || !currentRarity || !nextRarity) {
    return undefined;
  }

  return {
    price,
    currentRarity,
    nextRarity,
    ...effect,
  };
}

function getNextMagicProductUpgradeRarity(rarity: HeroScrollUpgradeRarity): HeroScrollUpgradeRarity | undefined {
  const currentIndex = HERO_SCROLL_UPGRADE_RARITIES.indexOf(rarity);

  return HERO_SCROLL_UPGRADE_RARITIES[currentIndex + 1];
}

function getMagicProductUpgradeEffect(
  itemId: HeroItemId,
  currentRarity: HeroScrollUpgradeRarity,
  nextRarity: HeroScrollUpgradeRarity,
): Pick<MagicProductUpgradePreview, "label" | "currentValue" | "nextValue" | "suffix"> | undefined {
  if (itemId === HERO_CRACK_ARMOR_SCROLL_ITEM_ID) {
    return {
      label: "Breaks",
      currentValue: String(getHeroCrackArmorPartsForRarity(currentRarity)),
      nextValue: String(getHeroCrackArmorPartsForRarity(nextRarity)),
      suffix: "armor parts",
    };
  }

  if (itemId === HERO_FIREBALL_SCROLL_ITEM_ID) {
    return {
      label: "Deals",
      currentValue: String(getHeroFireballDamageForRarity(currentRarity)),
      nextValue: String(getHeroFireballDamageForRarity(nextRarity)),
      suffix: "damage",
    };
  }

  if (itemId === HERO_PRECISE_STRIKE_SCROLL_ITEM_ID) {
    return {
      label: "Hit chance",
      currentValue: `+${formatPercent(getHeroPreciseStrikeBlockChanceReductionForRarity(currentRarity))}`,
      nextValue: `+${formatPercent(getHeroPreciseStrikeBlockChanceReductionForRarity(nextRarity))}`,
    };
  }

  if (itemId === HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID) {
    return {
      label: "Deals second hit with",
      currentValue: formatPercent(getHeroDoubleStrikeDamageMultiplierForRarity(currentRarity)),
      nextValue: formatPercent(getHeroDoubleStrikeDamageMultiplierForRarity(nextRarity)),
      suffix: "damage",
    };
  }

  if (itemId === HERO_POISON_SCROLL_ITEM_ID) {
    return {
      label: "Poison damage",
      currentValue: String(getHeroPoisonDamageForRarity(currentRarity)),
      nextValue: String(getHeroPoisonDamageForRarity(nextRarity)),
    };
  }

  if (itemId === HERO_WARD_SCROLL_ITEM_ID) {
    return {
      label: "Blocks",
      currentValue: String(getHeroWardHitCountForRarity(currentRarity)),
      nextValue: String(getHeroWardHitCountForRarity(nextRarity)),
      suffix: "hits",
    };
  }

  return undefined;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function canUpgradeMagicProduct(hero: HeroState, product: MagicProduct): boolean {
  return canUpgradeHeroScroll(hero, getMagicProductPrimaryItemId(product));
}

function isMagicProductUpgradeMax(hero: HeroState, product: MagicProduct): boolean {
  const itemId = getMagicProductPrimaryItemId(product);

  return isHeroUpgradeableScrollItemId(itemId) && getHeroScrollUpgradePrice(hero, itemId) === undefined;
}

function refreshMagicProductUpgradeButton(
  button: HTMLButtonElement,
  product: MagicProduct,
  upgradePrice: number | undefined,
  canUpgrade: boolean,
  canEventuallyUpgrade: boolean,
): void {
  const itemId = getMagicProductPrimaryItemId(product);
  const isUpgradeable = isHeroUpgradeableScrollItemId(itemId);

  button.hidden = !isUpgradeable;

  if (!isUpgradeable) {
    button.disabled = true;
    button.removeAttribute("aria-label");
    button.title = "";
    setTextContentIfChanged(button, "");
    return;
  }

  if (!canEventuallyUpgrade) {
    button.disabled = true;
    button.setAttribute("aria-label", "Max scroll rarity");
    button.title = "Max rarity";
    setTextContentIfChanged(button, "MAX");
    return;
  }

  button.disabled = !canUpgrade;
  button.setAttribute("aria-label", `Upgrade ${getMagicProductDisplayName(product)} for ${upgradePrice} gold`);
  button.title = `Upgrade ${upgradePrice}`;
  setTextContentIfChanged(button, "");
}

function getWeaponSharpeningEffectText(hasWeapon: boolean, isSharpenable: boolean, isMaxSharpening: boolean, sharpeningPrice: number | undefined, hasEnoughGold: boolean): string {
  if (!hasWeapon) {
    return "Equip an epic melee weapon to sharpen it";
  }

  if (!isSharpenable) {
    return "Only epic+ melee weapons can be sharpened";
  }

  if (isMaxSharpening) {
    return `Sharpening is maxed at +${HERO_WEAPON_SHARPENING_MAX_LEVEL}`;
  }

  if (sharpeningPrice === undefined) {
    return "Sharpening unavailable";
  }

  if (!hasEnoughGold) {
    return `Sharpening costs ${sharpeningPrice} gold`;
  }

  return "Adds +1 flat damage to this weapon";
}

function getWeaponSharpeningActionLabel(
  hasWeapon: boolean,
  isSharpenable: boolean,
  isMaxSharpening: boolean,
  hasEnoughGold: boolean,
  sharpeningPrice: number | undefined,
): string {
  if (!hasWeapon) {
    return "No Weapon";
  }

  if (!isSharpenable) {
    return "Unavailable";
  }

  if (isMaxSharpening) {
    return `Max +${HERO_WEAPON_SHARPENING_MAX_LEVEL}`;
  }

  if (!hasEnoughGold || sharpeningPrice === undefined) {
    return "No Gold";
  }

  return `Sharpen ${sharpeningPrice}`;
}

function getMagicProductDisplayName(product: MagicProduct): string {
  return getShopProductDisplayName(product.displayName ?? product.name)
    .replace(/\s+Scroll\b/giu, "")
    .trim();
}
