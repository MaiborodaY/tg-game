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
  isHeroScrollCapacityUpgradeUnlocked,
  isHeroScrollUpgradeRarityUnlocked,
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
  MAGIC_DAMAGE_ICON_ASSET_URL,
  REST_STAMINA_ICON_ASSET_URL,
  SHOP_CATEGORY_BODY_ICON_ASSET_URL,
  SHOP_BACK_ICON_ASSET_URL,
  SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
  SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
} from "./assets";
import { GENERATED_ARMORY_PRODUCTS, GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";
import { applyUiLayoutTuning } from "./uiLayoutTuning";
import {
  getShopProductActionLabel,
  getShopProductActionState,
  getShopProductDisplayName,
  getShopProductRarity,
  getShopProductStat,
  getShopRarityLabel,
  type ShopItemRarity,
  type ShopProductActionState,
} from "./shopPresentation";
import { getShopProductIconUrl } from "./shopItemIcons";
import { getHeroScrollEffectText } from "./scrollEffectText";
import { pairGeneratedArmoryProducts, type ArmoryProduct } from "./armoryShopUi";
import type { WeaponProduct } from "./weaponShopUi";
import {
  createEquipmentItemCardContent,
  createEquipmentInlineConfirmAction,
  type EquipmentCardAction,
  type EquipmentCardInlineConfirmAction,
} from "./equipmentCardUi";

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
  syncHeroState: (options?: MagicShopHeroSyncOptions) => void;
}

export interface MagicShopHeroSyncOptions {
  pendingEquipmentProductId?: string | null;
}

type MagicEquipmentViewMode = "cards" | "hero";
type MagicShopEquipmentVisibility = boolean | (() => boolean);
type MagicEquipmentCategoryId = "staves" | "robes";
type MagicEquipmentProductKind = "staff" | "robe";
export type MagicEquipmentProduct = ArmoryProduct | WeaponProduct;

interface MagicShopOptions {
  getHero: () => HeroState;
  onBuy: (product: MagicProduct) => void;
  onBuyEquipment: (product: MagicEquipmentProduct) => void;
  onEquipmentPreview?: (product: MagicEquipmentProduct) => void;
  onEquipmentPreviewClear?: () => void;
  onEquipmentHeroViewChange?: (open: boolean) => void;
  showEquipment?: MagicShopEquipmentVisibility;
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

interface MagicEquipmentListItemElements {
  item: HTMLButtonElement;
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

type MagicShopMode = "home" | "scrolls" | "weaponSharpening" | "equipment";

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

const MAGIC_EQUIPMENT_RARITY_SORT_ORDER: Record<ShopItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
  unique: 6,
};
const MAGIC_EQUIPMENT_STAVES_CATEGORY_ID: MagicEquipmentCategoryId = "staves";
const MAGIC_EQUIPMENT_STAFF_PRODUCTS: readonly WeaponProduct[] = GENERATED_WEAPON_PRODUCTS.filter((product) => product.categoryId === MAGIC_EQUIPMENT_STAVES_CATEGORY_ID)
  .map((product) => ({
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    price: product.price,
    itemIds: [...product.itemIds],
  }))
  .sort(compareMagicEquipmentProducts);
const MAGIC_EQUIPMENT_ROBE_PRODUCTS: readonly ArmoryProduct[] = pairGeneratedArmoryProducts(
  GENERATED_ARMORY_PRODUCTS.filter((product) => product.magicShop === true).map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    itemIds: [...product.itemIds],
    magicShop: true,
  })),
).sort(compareMagicEquipmentProducts);
const MAGIC_EQUIPMENT_CATEGORIES: readonly {
  id: MagicEquipmentCategoryId;
  label: string;
  emptyName: string;
  emptyEffect: string;
  emptyIconUrl: string;
  products: readonly MagicEquipmentProduct[];
}[] = [
  {
    id: "staves",
    label: "Staves",
    emptyName: "No Staves",
    emptyEffect: "Import staff items to sell them here.",
    emptyIconUrl: SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
    products: MAGIC_EQUIPMENT_STAFF_PRODUCTS,
  },
  {
    id: "robes",
    label: "Robes",
    emptyName: "No Robes",
    emptyEffect: "Import robe armor items to sell them here.",
    emptyIconUrl: SHOP_CATEGORY_BODY_ICON_ASSET_URL,
    products: MAGIC_EQUIPMENT_ROBE_PRODUCTS,
  },
];
const MAGIC_EQUIPMENT_PRODUCTS: readonly MagicEquipmentProduct[] = MAGIC_EQUIPMENT_CATEGORIES.flatMap((category) => [...category.products]);
const SHOP_LAYOUT_SETTLE_DELAYS_MS = [80, 180, 360] as const;

export function mountMagicShop(root: HTMLElement, options: MagicShopOptions): MagicShopApi {
  let transitionTimer: number | undefined;
  let layoutFrame: number | undefined;
  let layoutSettleTimers: number[] = [];
  let mode: MagicShopMode = "home";
  let selectedProductId = MAGIC_PRODUCTS[0]?.id ?? "";
  let selectedEquipmentCategoryId: MagicEquipmentCategoryId = MAGIC_EQUIPMENT_STAVES_CATEGORY_ID;
  let selectedEquipmentProductId = MAGIC_EQUIPMENT_PRODUCTS[0]?.id ?? "";
  let pendingEquipmentProductId: string | undefined;
  let pendingUpgradeProductId: string | undefined;
  let equipmentViewMode: MagicEquipmentViewMode = "cards";
  let isEquipmentHeroViewActive = false;
  let previewedEquipmentProductId: string | undefined;

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
  scrollCapacityIcon.src = MAGIC_SHOP_SCROLL_CAPACITY_UPGRADE_ICON_URL;
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
    detail: "Weapon upgrades",
    iconUrl: SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
    onClick: () => setMode("weaponSharpening"),
  });
  enchantModeButton.append(createSoonRibbon("magic-shop__home-soon"));
  const equipmentModeButton = createMagicShopHomeAction({
    label: "Magic Equipment",
    detail: "Staves / Robes",
    iconUrl: SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
    onClick: () => setMode("equipment"),
  });

  home.append(scrollsModeButton, equipmentModeButton, enchantModeButton);

  const productList = document.createElement("div");
  productList.className = "magic-shop__list";
  const equipmentList = document.createElement("div");
  equipmentList.className = "magic-shop__equipment-grid";

  const wallet = document.createElement("div");
  wallet.className = "magic-shop__wallet";

  const back = document.createElement("button");
  const backIcon = document.createElement("img");
  const equipmentViewToggle = document.createElement("button");

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
  wallet.append(scrollCapacity, back, gold);

  equipmentViewToggle.className = "magic-shop__equipment-view-toggle";
  equipmentViewToggle.type = "button";
  equipmentViewToggle.setAttribute("aria-label", "Show character preview");
  equipmentViewToggle.setAttribute("aria-pressed", "false");
  equipmentViewToggle.addEventListener("click", () => {
    equipmentViewMode = equipmentViewMode === "cards" ? "hero" : "cards";
    refreshHeroState(options.getHero());
    scheduleLayoutSync();
  });

  const equipmentCategoryBar = document.createElement("div");
  equipmentCategoryBar.className = "magic-shop__equipment-tabs";
  equipmentCategoryBar.setAttribute("aria-label", "Magic equipment category");
  const equipmentCategoryButtons = MAGIC_EQUIPMENT_CATEGORIES.map((category) => {
    const button = document.createElement("button");

    button.className = "magic-shop__equipment-tab";
    button.type = "button";
    button.textContent = category.label;
    button.addEventListener("click", () => {
      selectMagicEquipmentCategory(category.id);
    });

    return [category.id, button] as const;
  });
  const equipmentCategoryButtonsById = new Map(equipmentCategoryButtons);
  equipmentCategoryBar.append(...equipmentCategoryButtons.map(([, button]) => button), equipmentViewToggle);

  const previewElements = createMagicProductPreview();
  const scrollUpgradeElements = createMagicScrollCapacityUpgrade();
  const productListItems = MAGIC_PRODUCTS.map((product) => [product.id, createMagicProductListItem(product)] as const);
  const productListItemsById = new Map(productListItems);
  const equipmentListItems = MAGIC_EQUIPMENT_PRODUCTS.map((product) => [product.id, createMagicEquipmentListItem(product)] as const);
  const equipmentListItemsById = new Map(equipmentListItems);

  preview.append(previewElements.card);
  productList.append(...productListItems.map(([, elements]) => elements.item));
  equipmentList.append(...equipmentListItems.map(([, elements]) => elements.item));
  content.append(home, productList, equipmentCategoryBar, equipmentList, wallet);
  header.append(title);
  tray.append(header, content);
  menu.append(tray);
  panel.append(preview, menu, scrollUpgradeElements.root);
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
      equipmentViewMode = "cards";
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
      root.classList.remove("city-menu--magic-equipment-preview-open");
      shop.hidden = true;
      syncEquipmentHeroView(false);
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

  function syncHeroState(syncOptions: MagicShopHeroSyncOptions = {}): void {
    if ("pendingEquipmentProductId" in syncOptions) {
      pendingEquipmentProductId = syncOptions.pendingEquipmentProductId ?? undefined;
      shop.classList.toggle("magic-shop--purchase-pending", Boolean(pendingEquipmentProductId));
    }

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

  function getSelectedMagicEquipmentCategory(): (typeof MAGIC_EQUIPMENT_CATEGORIES)[number] {
    return getMagicEquipmentCategory(selectedEquipmentCategoryId);
  }

  function canShowEquipment(): boolean {
    return typeof options.showEquipment === "function" ? options.showEquipment() : options.showEquipment ?? true;
  }

  function ensureVisibleMode(): void {
    if (mode !== "equipment" || canShowEquipment()) {
      return;
    }

    mode = "home";
    equipmentViewMode = "cards";
  }

  function setMode(nextMode: MagicShopMode): void {
    if (nextMode === "equipment" && !canShowEquipment()) {
      return;
    }

    if (mode === nextMode) {
      return;
    }

    mode = nextMode;
    if (mode !== "equipment") {
      equipmentViewMode = "cards";
    }
    pendingUpgradeProductId = undefined;
    refreshHeroState(options.getHero());
    scheduleLayoutSync();
  }

  function refreshHeroState(hero: HeroState): void {
    ensureVisibleMode();
    refreshMode();
    refreshWallet(hero);
    refreshScrollCapacityUpgrade(hero);
    if (mode === "scrolls") {
      refreshSelectedProduct(hero);
      refreshProductList(hero);
      return;
    }

    if (mode === "equipment") {
      refreshEquipmentCategories(hero);
      refreshSelectedEquipmentProduct(hero);
      refreshEquipmentProductList(hero);
      return;
    }

    if (mode === "weaponSharpening") {
      refreshWeaponSharpening(hero);
    }
  }

  function refreshMode(): void {
    const showEquipment = canShowEquipment();

    shop.classList.toggle("magic-shop--mode-home", mode === "home");
    shop.classList.toggle("magic-shop--mode-scrolls", mode === "scrolls");
    shop.classList.toggle("magic-shop--mode-sharpening", mode === "weaponSharpening");
    shop.classList.toggle("magic-shop--mode-equipment", mode === "equipment");
    syncEquipmentHeroView();
    preview.hidden = mode === "home" || isEquipmentHeroViewOpen();
    equipmentModeButton.hidden = !showEquipment;
    equipmentViewToggle.hidden = mode !== "equipment";
    equipmentCategoryBar.hidden = mode !== "equipment";
    previewElements.buyButton.hidden = mode === "equipment";
    previewElements.effect.hidden = mode === "equipment";
    equipmentViewToggle.setAttribute("aria-pressed", String(equipmentViewMode === "hero"));
    equipmentViewToggle.setAttribute(
      "aria-label",
      equipmentViewMode === "hero" ? "Show magic equipment cards" : "Show character preview",
    );
    home.hidden = mode !== "home";
    productList.hidden = mode !== "scrolls";
    equipmentList.hidden = mode !== "equipment";
    scrollUpgradeElements.root.hidden = mode !== "scrolls";
    preview.setAttribute(
      "aria-label",
      mode === "weaponSharpening" ? "Weapon sharpening" : mode === "equipment" ? "Selected magic equipment" : "Selected scroll",
    );
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

  function getSelectedMagicEquipmentProduct(hero: HeroState): MagicEquipmentProduct | undefined {
    const visibleProducts = getVisibleMagicEquipmentProducts(hero, selectedEquipmentCategoryId);
    const selectedProduct = visibleProducts.find((product) => product.id === selectedEquipmentProductId) ?? visibleProducts[0];

    if (selectedProduct) {
      selectedEquipmentProductId = selectedProduct.id;
    }

    return selectedProduct;
  }

  function refreshEquipmentCategories(hero: HeroState): void {
    MAGIC_EQUIPMENT_CATEGORIES.forEach((category) => {
      const button = equipmentCategoryButtonsById.get(category.id);

      if (!button) {
        return;
      }

      const visibleCount = getVisibleMagicEquipmentProducts(hero, category.id).length;
      const isSelected = category.id === selectedEquipmentCategoryId;

      button.classList.toggle("magic-shop__equipment-tab--active", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
      button.setAttribute("aria-label", `${category.label}, ${visibleCount} available`);
    });
  }

  function refreshScrollCapacityUpgrade(hero: HeroState): void {
    const currentCapacity = getHeroScrollCapacity(hero);
    const price = getHeroScrollCapacityUpgradePrice(hero);
    const isMaxed = currentCapacity >= HERO_SCROLL_CAPACITY_MAX || price === undefined;
    const nextCapacity = Math.min(HERO_SCROLL_CAPACITY_MAX, currentCapacity + 1);
    const isTierUnlocked = isMaxed || isHeroScrollCapacityUpgradeUnlocked(hero, nextCapacity);
    const hasEnoughGold = price !== undefined && hero.gold >= price;
    const canBuy = canUpgradeHeroScrollCapacity(hero);
    const noGold = !isMaxed && isTierUnlocked && !hasEnoughGold;

    scrollUpgradeElements.root.hidden = mode !== "scrolls" || (!isMaxed && !isTierUnlocked);
    scrollUpgradeElements.card.disabled = isMaxed || !canBuy;
    scrollUpgradeElements.card.classList.toggle("magic-shop__scroll-upgrade-card--max", isMaxed);
    scrollUpgradeElements.card.classList.toggle("magic-shop__scroll-upgrade-card--no-gold", noGold);
    scrollUpgradeElements.card.setAttribute(
      "aria-label",
      isMaxed
        ? `Scroll capacity ${currentCapacity} of ${HERO_SCROLL_CAPACITY_MAX}, max`
        : noGold
          ? `Not enough gold to upgrade scroll capacity from ${currentCapacity} to ${nextCapacity}`
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
    const status = "SOON";
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

  function refreshSelectedEquipmentProduct(hero: HeroState): void {
    const product = getSelectedMagicEquipmentProduct(hero);
    const category = getSelectedMagicEquipmentCategory();

    previewElements.card.className = "magic-shop__preview-card magic-shop__preview-card--equipment";

    if (!product) {
      setImageSourceIfChanged(previewElements.icon, category.emptyIconUrl);
      setTextContentIfChanged(previewElements.name, category.emptyName);
      setTextContentIfChanged(previewElements.rarity, "EMPTY");
      setTextContentIfChanged(previewElements.effect, category.emptyEffect);
      previewElements.buyButton.disabled = true;
      return;
    }

    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);
    const iconUrl = getShopProductIconUrl(product.itemIds) ?? SHOP_CATEGORY_SCROLL_ICON_ASSET_URL;

    previewElements.card.className = `magic-shop__preview-card magic-shop__preview-card--equipment armory-shop__selected-card--rarity-${rarity}`;
    previewElements.card.classList.toggle("magic-shop__preview-card--max", actionState === "equipped");
    setImageSourceIfChanged(previewElements.icon, iconUrl);
    setTextContentIfChanged(previewElements.name, getShopProductDisplayName(product.name));
    setTextContentIfChanged(previewElements.rarity, getShopRarityLabel(rarity));
    setTextContentIfChanged(previewElements.effect, getMagicEquipmentProductEffect(product));
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
      const upgradeState = getMagicProductUpgradeState(hero, product);

      elements.item.className = `magic-shop__list-item armory-shop__option--rarity-${rarity}`;
      elements.item.classList.toggle("magic-shop__list-item--selected", product.id === selectedProductId);
      elements.item.classList.toggle("magic-shop__list-item--max", actionState === "max");
      elements.item.classList.toggle("magic-shop__list-item--no-gold", actionState === "no-gold");
      elements.item.classList.toggle("magic-shop__list-item--upgrade-ready", canUpgrade);
      elements.item.classList.toggle("magic-shop__list-item--upgrade-max", isMagicProductUpgradeMax(hero, product));
      elements.item.classList.toggle("magic-shop__list-item--upgrade-pending", product.id === pendingUpgradeProductId);
      elements.selectButton.setAttribute("aria-pressed", product.id === selectedProductId ? "true" : "false");
      setPriceAmount(elements.price, elements.priceAmount, price);
      refreshMagicProductUpgradeButton(elements.upgradeButton, product, upgradePrice, canUpgrade, upgradeState);
    });
  }

  function refreshEquipmentProductList(hero: HeroState): void {
    const visibleProductIds = new Set(getVisibleMagicEquipmentProducts(hero, selectedEquipmentCategoryId).map((product) => product.id));

    MAGIC_EQUIPMENT_PRODUCTS.forEach((product) => {
      const elements = equipmentListItemsById.get(product.id);

      if (!elements) {
        return;
      }

      const isVisible = visibleProductIds.has(product.id);

      elements.item.hidden = !isVisible;
      if (!isVisible) {
        return;
      }

      const rarity = getShopProductRarity(product.itemIds, product.rarity);
      const actionState = getShopProductActionState(hero, product.itemIds, product.price);
      const isPending = pendingEquipmentProductId === product.id;

      const isSelected = product.id === selectedEquipmentProductId;
      const productKind = getMagicEquipmentProductKind(product);
      const displayName = getShopProductDisplayName(product.name);
      const stat = getMagicEquipmentProductStat(product);
      const actionLabel = isPending ? "buying" : getShopProductActionLabel(actionState, product.price);
      const inlineConfirmAction = isSelected
        ? isPending
          ? getPendingMagicEquipmentInlineConfirmAction()
          : getMagicEquipmentInlineConfirmAction(actionState, product.price)
        : undefined;

      elements.item.className = `equipment-item-card armory-shop__option armory-shop__option--product magic-shop__equipment-card armory-shop__option--rarity-${rarity}`;
      elements.item.classList.toggle("equipment-item-card--selected", isSelected);
      elements.item.classList.toggle("armory-shop__option--selected", isSelected);
      elements.item.classList.toggle("equipment-item-card--equipped", actionState === "equipped");
      elements.item.classList.toggle("armory-shop__option--equipped", actionState === "equipped");
      elements.item.classList.toggle("armory-shop__option--owned", actionState === "equip");
      elements.item.classList.toggle("armory-shop__option--for-sale", actionState === "buy");
      elements.item.classList.toggle("armory-shop__option--locked", actionState === "locked");
      elements.item.classList.toggle("armory-shop__option--sealed", actionState === "sealed" || actionState === "locked");
      elements.item.classList.toggle("armory-shop__option--pending", isPending);
      elements.item.classList.toggle("armory-shop__option--inline-confirm", Boolean(inlineConfirmAction));
      elements.item.classList.toggle("magic-shop__equipment-card--staff", productKind === "staff");
      elements.item.classList.toggle("magic-shop__equipment-card--robe", productKind === "robe");
      elements.item.disabled = isPending || actionState === "locked" || actionState === "sealed";
      elements.item.setAttribute("aria-pressed", isSelected ? "true" : "false");
      elements.item.setAttribute(
        "aria-label",
        `${displayName}, ${getShopRarityLabel(rarity)}, ${stat.value} ${stat.label}, ${isSelected ? "selected, " : ""}${actionLabel}`,
      );
      elements.item.title = displayName;
      const cardContent = createEquipmentItemCardContent({
        iconUrl: getShopProductIconUrl(product.itemIds) ?? SHOP_CATEGORY_SCROLL_ICON_ASSET_URL,
        name: displayName,
        rarityLabel: getShopRarityLabel(rarity),
        typeLabel: stat.typeLabel,
        statIconUrl: stat.iconUrl,
        statLabel: stat.label,
        statValue: stat.value,
        action: inlineConfirmAction ? undefined : isPending ? getPendingMagicEquipmentCardAction() : getMagicEquipmentCardAction(actionState, product.price),
      });

      if (inlineConfirmAction) {
        cardContent.classList.add("equipment-item-card__content--with-inline-confirm");
        cardContent.append(createEquipmentInlineConfirmAction(inlineConfirmAction));
      }

      elements.item.replaceChildren(cardContent);
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

  function selectMagicEquipmentCategory(categoryId: MagicEquipmentCategoryId): void {
    if (selectedEquipmentCategoryId === categoryId) {
      return;
    }

    selectedEquipmentCategoryId = categoryId;
    selectedEquipmentProductId = "";
    equipmentList.scrollTop = 0;
    refreshHeroState(options.getHero());
    scheduleLayoutSync();
  }

  function selectMagicEquipmentProduct(productId: string): void {
    if (selectedEquipmentProductId === productId) {
      return;
    }

    selectedEquipmentProductId = productId;
    refreshHeroState(options.getHero());
    scheduleLayoutSync();
  }

  function isEquipmentHeroViewOpen(): boolean {
    return mode === "equipment" && equipmentViewMode === "hero";
  }

  function syncEquipmentHeroView(forceOpen = isEquipmentHeroViewOpen()): void {
    shop.classList.toggle("magic-shop--equipment-hero-view", forceOpen);
    root.classList.toggle("city-menu--magic-equipment-preview-open", forceOpen);

    if (forceOpen !== isEquipmentHeroViewActive) {
      isEquipmentHeroViewActive = forceOpen;
      options.onEquipmentHeroViewChange?.(forceOpen);
      if (!forceOpen) {
        previewedEquipmentProductId = undefined;
        options.onEquipmentPreviewClear?.();
      }
    }

    if (!forceOpen) {
      return;
    }

    const product = getSelectedMagicEquipmentProduct(options.getHero());

    if (product && product.id !== previewedEquipmentProductId) {
      previewedEquipmentProductId = product.id;
      options.onEquipmentPreview?.(product);
    } else if (!product) {
      previewedEquipmentProductId = undefined;
      options.onEquipmentPreviewClear?.();
    }
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
      } else if (mode === "equipment") {
        const product = getSelectedMagicEquipmentProduct(options.getHero());

        if (product) {
          options.onBuyEquipment(product);
        }
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

  function createMagicEquipmentListItem(product: MagicEquipmentProduct): MagicEquipmentListItemElements {
    const item = document.createElement("button");
    const displayName = getShopProductDisplayName(product.name);

    item.className = "equipment-item-card armory-shop__option armory-shop__option--product magic-shop__equipment-card";
    item.type = "button";
    item.title = displayName;
    item.setAttribute("aria-label", displayName);
    item.setAttribute("aria-pressed", "false");
    item.addEventListener("click", (event) => {
      const hero = options.getHero();
      const actionState = getShopProductActionState(hero, product.itemIds, product.price);
      const isPending = pendingEquipmentProductId === product.id;

      if (item.disabled || (pendingEquipmentProductId && !isPending)) {
        return;
      }

      if (selectedEquipmentProductId === product.id) {
        const target = event.target;
        const confirmAction =
          target instanceof Element ? target.closest(".equipment-item-card__confirm-action") : undefined;

        if (confirmAction && item.contains(confirmAction) && actionState === "buy") {
          options.onBuyEquipment(product);
        }

        return;
      }

      selectMagicEquipmentProduct(product.id);
    });

    return { item };
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

function createSoonRibbon(className: string): HTMLElement {
  const ribbon = document.createElement("span");

  ribbon.className = `city-level-ribbon city-soon-ribbon ${className}`;
  ribbon.setAttribute("aria-label", "Coming soon");
  ribbon.textContent = "SOON";

  return ribbon;
}

function compareMagicEquipmentProducts(left: MagicEquipmentProduct, right: MagicEquipmentProduct): number {
  const rarityDifference =
    MAGIC_EQUIPMENT_RARITY_SORT_ORDER[getShopProductRarity(left.itemIds, left.rarity)] -
    MAGIC_EQUIPMENT_RARITY_SORT_ORDER[getShopProductRarity(right.itemIds, right.rarity)];

  if (rarityDifference !== 0) {
    return rarityDifference;
  }

  const damageDifference = getMagicEquipmentProductStat(left).value - getMagicEquipmentProductStat(right).value;

  if (damageDifference !== 0) {
    return damageDifference;
  }

  const priceDifference = left.price - right.price;

  if (priceDifference !== 0) {
    return priceDifference;
  }

  return left.name.localeCompare(right.name);
}

function getMagicEquipmentProductEffect(product: MagicEquipmentProduct): string {
  const stat = getMagicEquipmentProductStat(product);

  if (getMagicEquipmentProductKind(product) === "robe") {
    return `Robe stamina ${stat.value}. Built for magic equipment sets.`;
  }

  return `Staff damage ${stat.value}. Replaces attacks with 100% hit fireballs.`;
}

function getMagicEquipmentCategory(categoryId: MagicEquipmentCategoryId): (typeof MAGIC_EQUIPMENT_CATEGORIES)[number] {
  return MAGIC_EQUIPMENT_CATEGORIES.find((category) => category.id === categoryId) ?? MAGIC_EQUIPMENT_CATEGORIES[0]!;
}

function getVisibleMagicEquipmentProducts(hero: HeroState, categoryId: MagicEquipmentCategoryId): MagicEquipmentProduct[] {
  return getMagicEquipmentCategory(categoryId).products.filter((product) => {
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);

    return actionState !== "equip" && actionState !== "equipped";
  });
}

function getMagicEquipmentProductKind(product: MagicEquipmentProduct): MagicEquipmentProductKind {
  const primaryItem = product.itemIds[0] ? HERO_ITEM_CATALOG[product.itemIds[0]] : undefined;

  return primaryItem?.kind === "armor" ? "robe" : "staff";
}

function getMagicEquipmentProductStat(product: MagicEquipmentProduct): {
  typeLabel: string;
  label: string;
  value: number;
  iconUrl: string;
} {
  if (getMagicEquipmentProductKind(product) === "robe") {
    return {
      typeLabel: "Robe",
      label: "stamina",
      value: getMagicEquipmentProductMaxStaminaBonus(product),
      iconUrl: REST_STAMINA_ICON_ASSET_URL,
    };
  }

  return {
    typeLabel: "Staff",
    label: "damage",
    value: getShopProductStat(product.itemIds, "damage"),
    iconUrl: MAGIC_DAMAGE_ICON_ASSET_URL,
  };
}

function getMagicEquipmentProductMaxStaminaBonus(product: MagicEquipmentProduct): number {
  return product.itemIds.reduce((total, itemId) => {
    const item = HERO_ITEM_CATALOG[itemId];

    return total + Math.max(0, Math.floor(item?.maxStaminaBonus ?? 0));
  }, 0);
}

function getMagicEquipmentCardAction(actionState: ShopProductActionState, price: number): EquipmentCardAction {
  if (actionState === "buy" || actionState === "no-gold" || actionState === "sealed" || actionState === "locked") {
    return { kind: "price", iconUrl: SHOP_GOLD_COIN_ICON_ASSET_URL, value: price, state: actionState };
  }

  return { kind: "status", label: getShopProductActionLabel(actionState, price), state: actionState };
}

function getPendingMagicEquipmentCardAction(): EquipmentCardAction {
  return { kind: "status", label: "BUYING", state: "buying" };
}

function getMagicEquipmentInlineConfirmAction(actionState: ShopProductActionState, price: number): EquipmentCardInlineConfirmAction | undefined {
  if (actionState !== "buy" && actionState !== "no-gold") {
    return undefined;
  }

  return { state: actionState, price, iconUrl: SHOP_GOLD_COIN_ICON_ASSET_URL };
}

function getPendingMagicEquipmentInlineConfirmAction(): EquipmentCardInlineConfirmAction {
  return { state: "buying" };
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
  if (!canUpgradeMagicProduct(hero, product)) {
    return undefined;
  }

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

type MagicProductUpgradeState = "hidden" | "ready" | "no-gold" | "max";

function getMagicProductUpgradeState(hero: HeroState, product: MagicProduct): MagicProductUpgradeState {
  const itemId = getMagicProductPrimaryItemId(product);

  if (!isHeroUpgradeableScrollItemId(itemId)) {
    return "hidden";
  }

  const price = getHeroScrollUpgradePrice(hero, itemId);
  const currentRarity = getHeroScrollUpgradeRarityForItem(hero, itemId);
  const nextRarity = currentRarity ? getNextMagicProductUpgradeRarity(currentRarity) : undefined;

  if (price === undefined || !nextRarity) {
    return "max";
  }

  if (!isHeroScrollUpgradeRarityUnlocked(hero, nextRarity)) {
    return "hidden";
  }

  return hero.gold >= price ? "ready" : "no-gold";
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
  upgradeState: MagicProductUpgradeState,
): void {
  const itemId = getMagicProductPrimaryItemId(product);
  const isUpgradeable = isHeroUpgradeableScrollItemId(itemId);

  button.hidden = !isUpgradeable;
  button.classList.remove("magic-shop__list-upgrade--unavailable");

  if (!isUpgradeable) {
    button.disabled = true;
    button.removeAttribute("aria-label");
    button.title = "";
    setTextContentIfChanged(button, "");
    return;
  }

  if (upgradeState === "hidden") {
    button.disabled = true;
    button.classList.add("magic-shop__list-upgrade--unavailable");
    button.removeAttribute("aria-label");
    button.title = "";
    setTextContentIfChanged(button, "");
    return;
  }

  if (upgradeState === "max") {
    button.disabled = true;
    button.setAttribute("aria-label", "Max scroll rarity");
    button.title = "Max rarity";
    setTextContentIfChanged(button, "MAX");
    return;
  }

  button.disabled = !canUpgrade;

  if (upgradeState === "no-gold") {
    button.setAttribute("aria-label", `Not enough gold to upgrade ${getMagicProductDisplayName(product)}`);
    button.title = `Need ${upgradePrice} gold`;
    setTextContentIfChanged(button, "");
    return;
  }

  button.setAttribute("aria-label", `Upgrade ${getMagicProductDisplayName(product)} for ${upgradePrice} gold`);
  button.title = `Upgrade ${upgradePrice}`;
  setTextContentIfChanged(button, "");
}

function getWeaponSharpeningEffectText(hasWeapon: boolean, isSharpenable: boolean, isMaxSharpening: boolean, sharpeningPrice: number | undefined, hasEnoughGold: boolean): string {
  void hasWeapon;
  void isSharpenable;
  void isMaxSharpening;
  void sharpeningPrice;
  void hasEnoughGold;

  return "SOON";
}

function getWeaponSharpeningActionLabel(
  hasWeapon: boolean,
  isSharpenable: boolean,
  isMaxSharpening: boolean,
  hasEnoughGold: boolean,
  sharpeningPrice: number | undefined,
): string {
  void hasWeapon;
  void isSharpenable;
  void isMaxSharpening;
  void hasEnoughGold;
  void sharpeningPrice;

  return "SOON";
}

function getMagicProductDisplayName(product: MagicProduct): string {
  return getShopProductDisplayName(product.displayName ?? product.name)
    .replace(/\s+Scroll\b/giu, "")
    .trim();
}
