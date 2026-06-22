import {
  HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX,
  HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE,
  HERO_ITEM_CATALOG,
  areHeroItemsEquipped,
  areHeroItemsConsumable,
  areHeroItemsOwned,
  canHeroEquipItems,
  getHeroBowShotCapacity,
  getHeroConsumableMaxQuantity,
  getHeroItemQuantity,
  type HeroEquipmentSlotKey,
  type HeroItemId,
  type HeroState,
} from "./hero";
import {
  ARROW_ICON_ASSET_URL,
  DAMAGE_HIT_ICON_ASSET_URL,
  SHOP_BACK_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
} from "./assets";
import { GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";
import { getShopProductIconUrl } from "./shopItemIcons";
import {
  getEquippedShopProductDisplayStat,
  getShopProductActionLabel,
  getShopProductActionState,
  getShopProductDisplayStat,
  getShopProductDisplayName,
  getShopProductRequirementBadge,
  getShopProductRequirementDescription,
  getShopProductRarity,
  getShopProductStat,
  getShopRarityLabel,
  type ShopProductRequirementBadge,
  type ShopItemRarity,
  type ShopProductActionState,
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
  syncHeroState: (options?: WeaponShopHeroSyncOptions) => void;
}

export interface WeaponShopHeroSyncOptions {
  product?: WeaponProduct;
  previousHero?: HeroState;
}

interface WeaponCategory {
  id: string;
  name: string;
  products: WeaponProduct[];
  emptyText?: string;
}

interface WeaponShopOptions {
  getHero: () => HeroState;
  mountPreview?: (parent: HTMLElement) => () => void;
  onBuy: (product: WeaponProduct) => void;
  onBowCapacityUpgrade?: () => void;
  onPreview?: (product: WeaponProduct) => void;
  onPreviewClear?: () => void;
  onPrewarmProducts?: (products: readonly WeaponProduct[]) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onLayoutChange?: (menuTopY?: number) => void;
  transitionDelayMs?: number;
}

interface ConsumableCardInfo {
  quantity: number;
  maxQuantity: number;
}

interface SelectedMetaOptions {
  compareStat?: boolean;
  unitLabel?: string;
}

const WEAPON_RARITY_SORT_ORDER: Record<ShopItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
  unique: 6,
};

const ALL_WEAPON_RARITY_FILTER_VALUE = "";
const ALL_WEAPON_TYPE_FILTER_VALUE = "all";
const WEAPON_RARITIES = Object.keys(WEAPON_RARITY_SORT_ORDER) as ShopItemRarity[];
const WEAPON_RARITY_FILTER_CLASS_NAMES = WEAPON_RARITIES.map((rarity) => `armory-shop__set-filter--rarity-${rarity}`);

const WEAPON_CATEGORIES: WeaponCategory[] = [
  {
    id: "swords",
    name: "Swords",
    products: getGeneratedWeaponProducts("swords"),
  },
  {
    id: "axes",
    name: "Axes",
    products: getGeneratedWeaponProducts("axes"),
    emptyText: "Axes soon",
  },
  {
    id: "maces",
    name: "Maces",
    products: getGeneratedWeaponProducts("maces"),
    emptyText: "Maces soon",
  },
  {
    id: "spears",
    name: "Spears",
    products: getGeneratedWeaponProducts("spears"),
    emptyText: "Spears soon",
  },
  {
    id: "bows",
    name: "Bows",
    products: getGeneratedWeaponProducts("bows"),
    emptyText: "Bows soon",
  },
  {
    id: "shurikens",
    name: "Shurikens",
    products: getGeneratedWeaponProducts("shurikens"),
    emptyText: "Shurikens soon",
  },
];

const BOW_CATEGORY_ID = "bows";
const SHOP_LAYOUT_SETTLE_DELAYS_MS = [80, 180, 360] as const;
const SHOP_VISIBLE_PREWARM_PRODUCT_LIMIT = 6;
const SHOP_PREWARM_AFTER_SCROLL_DELAY_MS = 140;

function getGeneratedWeaponProducts(categoryId: string): WeaponProduct[] {
  return GENERATED_WEAPON_PRODUCTS.filter((product) => product.categoryId === categoryId)
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      itemIds: [...product.itemIds],
    }))
    .sort(compareWeaponProducts);
}

function compareWeaponProducts(left: WeaponProduct, right: WeaponProduct): number {
  const rarityDifference = getWeaponProductRarityOrder(left) - getWeaponProductRarityOrder(right);

  if (rarityDifference !== 0) {
    return rarityDifference;
  }

  const damageDifference = getShopProductStat(left.itemIds, "damage") - getShopProductStat(right.itemIds, "damage");

  if (damageDifference !== 0) {
    return damageDifference;
  }

  const priceDifference = left.price - right.price;

  if (priceDifference !== 0) {
    return priceDifference;
  }

  return left.name.localeCompare(right.name);
}

function getWeaponProductRarityOrder(product: WeaponProduct): number {
  return WEAPON_RARITY_SORT_ORDER[getShopProductRarity(product.itemIds, product.rarity)];
}

function filterWeaponProductsByRarity(products: readonly WeaponProduct[], rarity: ShopItemRarity | undefined): WeaponProduct[] {
  if (!rarity) {
    return [...products];
  }

  return products.filter((product) => getShopProductRarity(product.itemIds, product.rarity) === rarity);
}

function getAvailableWeaponRarities(products: readonly WeaponProduct[]): ShopItemRarity[] {
  const rarities = new Set(products.map((product) => getShopProductRarity(product.itemIds, product.rarity)));

  return WEAPON_RARITIES.filter((rarity) => rarities.has(rarity));
}

function getDefaultWeaponTypeFilterIds(): Set<string> {
  return new Set();
}

function getSelectedWeaponCategories(typeIds: ReadonlySet<string>): WeaponCategory[] {
  if (typeIds.size === 0) {
    return WEAPON_CATEGORIES;
  }

  return WEAPON_CATEGORIES.filter((category) => typeIds.has(category.id));
}

function getWeaponProductsForCategories(categories: readonly WeaponCategory[]): WeaponProduct[] {
  return categories.flatMap((category) => category.products).sort(compareWeaponProducts);
}

export function mountWeaponShop(root: HTMLElement, options: WeaponShopOptions): WeaponShopApi {
  let selectedWeaponTypeIds = getDefaultWeaponTypeFilterIds();
  let selectedRarity: ShopItemRarity | undefined;
  let previewProduct: WeaponProduct | undefined;
  let unmountPreview: (() => void) | undefined;
  let transitionTimer: number | undefined;
  let scrollIndicatorTimer: number | undefined;
  let layoutFrame: number | undefined;
  let layoutSettleTimers: number[] = [];
  let productPrewarmFrame: number | undefined;
  let productPrewarmTimer: number | undefined;
  let productButtons = new Map<string, HTMLButtonElement>();
  let productButtonVisualStates = new Map<string, string>();
  let productIdsByItemId = new Map<HeroItemId, Set<string>>();
  let renderedProductsById = new Map<string, WeaponProduct>();
  let renderedProducts: WeaponProduct[] = [];
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
  const rarityFilterInputs = new Map<string, HTMLInputElement>();

  rarityFilter.className = "armory-shop__parts-filter weapon-shop__rarity-filter";
  rarityFilter.setAttribute("aria-label", "Weapon rarity");
  rarityFilterSummary.className = "armory-shop__parts-summary weapon-shop__rarity-summary";
  rarityFilterSummaryText.className = "armory-shop__parts-summary-text";
  rarityFilterSummary.append(rarityFilterSummaryText);
  rarityFilterPanel.className = "armory-shop__parts-panel weapon-shop__rarity-panel";
  rarityFilter.append(rarityFilterSummary, rarityFilterPanel);

  const typeFilter = document.createElement("details");
  const typeFilterSummary = document.createElement("summary");
  const typeFilterSummaryText = document.createElement("span");
  const typeFilterPanel = document.createElement("div");
  const typeFilterInputs = new Map<string, HTMLInputElement>();

  typeFilter.className = "armory-shop__parts-filter weapon-shop__type-filter";
  typeFilter.setAttribute("aria-label", "Weapon types");
  typeFilterSummary.className = "armory-shop__parts-summary weapon-shop__type-summary";
  typeFilterSummaryText.className = "armory-shop__parts-summary-text";
  typeFilterSummary.append(typeFilterSummaryText);
  typeFilterPanel.className = "armory-shop__parts-panel weapon-shop__type-panel";
  typeFilterPanel.append(createWeaponTypeFilterOption());
  WEAPON_CATEGORIES.forEach((category) => typeFilterPanel.append(createWeaponTypeFilterOption(category)));
  typeFilter.append(typeFilterSummary, typeFilterPanel);

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

  const bowUpgrade = document.createElement("div");
  bowUpgrade.className = "weapon-shop__bow-upgrade";
  bowUpgrade.hidden = true;

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
      clearProductPreview();
      render();
      return;
    }

    close();
  });

  if (usesCityHeroPreview) {
    header.append(title, rarityFilter, typeFilter, selected, headerMeta);
    tray.append(header, content, scrollIndicator);
    menu.append(tray);
  } else {
    header.append(back, title, rarityFilter, typeFilter, headerMeta);
    tray.append(header, selected, content, scrollIndicator);
    menu.append(tray);
  }
  if (options.mountPreview) {
    panel.append(previewShell);
  } else {
    panel.append(bowUpgrade);
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
    selectedWeaponTypeIds = getDefaultWeaponTypeFilterIds();
    selectedRarity = undefined;
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
    const selectedCategories = getSelectedWeaponCategories(selectedWeaponTypeIds);
    const typeFilteredProducts = getWeaponProductsForCategories(selectedCategories);
    const availableRarities = getAvailableWeaponRarities(typeFilteredProducts);

    if (selectedRarity && !availableRarities.includes(selectedRarity)) {
      selectedRarity = undefined;
      clearProductPreview();
    }

    const selectedProducts = filterWeaponProductsByRarity(typeFilteredProducts, selectedRarity);

    title.textContent = "Weapons";
    renderRarityFilterOptions(availableRarities);
    updateWeaponTypeFilterControls();
    goldAmount.textContent = String(hero.gold);
    gold.setAttribute("aria-label", `Gold ${hero.gold}`);
    levelValue.textContent = String(hero.level);
    level.setAttribute("aria-label", `Level ${hero.level}`);
    content.replaceChildren();
    selected.replaceChildren();
    bowUpgrade.replaceChildren();
    productButtons = new Map();
    productButtonVisualStates = new Map();
    productIdsByItemId = new Map();
    renderedProductsById = new Map(selectedProducts.map((product) => [product.id, product]));
    renderedProducts = selectedProducts;
    clearScrollIndicator();
    clearVisibleProductPrewarm();
    options.onPrewarmProducts?.([]);
    syncSelectionState();
    content.classList.toggle("armory-shop__content--categories", false);
    content.classList.toggle("armory-shop__content--products", true);
    content.classList.toggle("armory-shop__content--confirm", false);

    if (previewProduct) {
      selected.append(createSelectedProductStrip(previewProduct, hero));
    }

    renderBowCapacityUpgrade(hero);
    scheduleLayoutSync();

    if (selectedProducts.length === 0) {
      const emptyText = selectedCategories.length === 1 ? selectedCategories[0]?.emptyText : undefined;

      content.append(createEmptyState(emptyText ?? "No items yet"));
      return;
    }

    selectedProducts.forEach((product) => {
      const button = createProductButton(product, hero, previewProduct?.id === product.id);

      trackProductButton(product, button, hero);
      content.append(button);
    });
    scheduleVisibleProductPrewarm();
  }

  function renderBowCapacityUpgrade(hero: HeroState): void {
    if (!usesCityHeroPreview) {
      return;
    }

    const selectedTypeId = getSingleSelectedWeaponTypeId();
    const bowCategory = selectedTypeId === BOW_CATEGORY_ID ? WEAPON_CATEGORIES.find((category) => category.id === BOW_CATEGORY_ID) : undefined;
    const isVisible = Boolean(bowCategory && isBowCategoryAvailable(hero, bowCategory));

    bowUpgrade.hidden = !isVisible;

    if (!isVisible) {
      return;
    }

    bowUpgrade.append(createBowCapacityUpgrade(hero));
  }

  function isBowCategoryAvailable(hero: HeroState, category: WeaponCategory): boolean {
    return category.products.some((product) => getWeaponProductCardState(hero, product) !== "locked");
  }

  function ensurePreviewMounted(): void {
    if (unmountPreview || !options.mountPreview) {
      return;
    }

    unmountPreview = options.mountPreview(preview);
  }

  function renderRarityFilterOptions(availableRarities: readonly ShopItemRarity[]): void {
    rarityFilterInputs.clear();
    rarityFilterPanel.replaceChildren(createRarityFilterOption(), ...availableRarities.map(createRarityFilterOption));
    updateRarityFilterVisual(selectedRarity);
  }

  function updateRarityFilterVisual(rarity?: ShopItemRarity): void {
    rarityFilter.classList.remove(...WEAPON_RARITY_FILTER_CLASS_NAMES);
    rarityFilterInputs.forEach((input) => {
      input.checked = input.value === (rarity ?? ALL_WEAPON_RARITY_FILTER_VALUE);
    });
    rarityFilterSummaryText.textContent = rarity ? getShopRarityLabel(rarity) : "All rarity";

    if (rarity) {
      rarityFilter.classList.add(`armory-shop__set-filter--rarity-${rarity}`);
    }
  }

  function createRarityFilterOption(rarity?: ShopItemRarity): HTMLLabelElement {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");
    const optionId = rarity ?? ALL_WEAPON_RARITY_FILTER_VALUE;

    label.className = "armory-shop__parts-option";
    input.className = "armory-shop__parts-checkbox";
    input.type = "radio";
    input.name = "weapon-shop-rarity-filter";
    input.value = optionId;
    text.className = "armory-shop__parts-option-text";
    text.textContent = rarity ? getShopRarityLabel(rarity) : "All rarity";
    input.addEventListener("change", () => {
      if (!input.checked) {
        return;
      }

      selectedRarity = rarity;
      rarityFilter.open = false;
      clearProductPreview();
      updateRarityFilterVisual(selectedRarity);
      render();
    });

    if (rarity) {
      label.classList.add(`armory-shop__set-filter-option--rarity-${rarity}`);
    }

    rarityFilterInputs.set(optionId, input);
    label.append(input, text);

    return label;
  }

  function createWeaponTypeFilterOption(category?: WeaponCategory): HTMLLabelElement {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");
    const optionId = category?.id ?? ALL_WEAPON_TYPE_FILTER_VALUE;

    label.className = "armory-shop__parts-option";
    input.className = "armory-shop__parts-checkbox";
    input.type = "checkbox";
    input.value = optionId;
    text.className = "armory-shop__parts-option-text";
    text.textContent = category?.name ?? "All weapons";
    input.addEventListener("change", () => {
      if (!category) {
        selectedWeaponTypeIds = getDefaultWeaponTypeFilterIds();
      } else if (input.checked) {
        selectedWeaponTypeIds.add(category.id);
      } else {
        selectedWeaponTypeIds.delete(category.id);
      }

      normalizeSelectedWeaponTypeIds();
      clearProductPreview();
      updateWeaponTypeFilterControls();
      render();
    });

    typeFilterInputs.set(optionId, input);
    label.append(input, text);

    return label;
  }

  function updateWeaponTypeFilterControls(): void {
    const isAllSelected = selectedWeaponTypeIds.size === 0;
    const allInput = typeFilterInputs.get(ALL_WEAPON_TYPE_FILTER_VALUE);

    if (allInput) {
      allInput.checked = isAllSelected;
    }

    WEAPON_CATEGORIES.forEach((category) => {
      const input = typeFilterInputs.get(category.id);

      if (input) {
        input.checked = !isAllSelected && selectedWeaponTypeIds.has(category.id);
      }
    });
    typeFilterSummaryText.textContent = getWeaponTypeFilterSummaryText();
  }

  function getWeaponTypeFilterSummaryText(): string {
    if (selectedWeaponTypeIds.size === 0) {
      return "All weapons";
    }

    if (selectedWeaponTypeIds.size === 1) {
      const selectedCategory = WEAPON_CATEGORIES.find((category) => selectedWeaponTypeIds.has(category.id));

      return selectedCategory?.name ?? "Weapons";
    }

    return `${selectedWeaponTypeIds.size} types`;
  }

  function normalizeSelectedWeaponTypeIds(): void {
    if (selectedWeaponTypeIds.size === 0 || selectedWeaponTypeIds.size >= WEAPON_CATEGORIES.length) {
      selectedWeaponTypeIds = getDefaultWeaponTypeFilterIds();
      return;
    }

    selectedWeaponTypeIds = new Set(
      WEAPON_CATEGORIES.filter((category) => selectedWeaponTypeIds.has(category.id)).map((category) => category.id),
    );
  }

  function getSingleSelectedWeaponTypeId(): string | undefined {
    if (selectedWeaponTypeIds.size !== 1) {
      return undefined;
    }

    return Array.from(selectedWeaponTypeIds)[0];
  }

  function createProductButton(product: WeaponProduct, hero: HeroState, isSelected: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const damage = getShopProductDisplayStat(hero, product.itemIds, "damage");
    const cardState = getWeaponProductCardState(hero, product);
    const displayName = getShopProductDisplayName(product.name);
    const requirementBadge = getShopProductRequirementBadge(hero, product.itemIds);
    const requirementDescription = getShopProductRequirementDescription(hero, product.itemIds);
    const consumableInfo = getConsumableCardInfo(hero, product.itemIds);

    button.className = `armory-shop__option armory-shop__option--product armory-shop__option--rarity-${rarity}`;
    button.classList.toggle("armory-shop__option--selected", isSelected);
    button.classList.toggle("armory-shop__option--owned", cardState === "equip");
    button.classList.toggle("armory-shop__option--equipped", cardState === "equipped");
    button.classList.toggle("armory-shop__option--max", cardState === "max");
    button.classList.toggle("armory-shop__option--for-sale", cardState === "buy");
    button.classList.toggle("armory-shop__option--locked", cardState === "locked");
    button.classList.toggle("armory-shop__option--sealed", cardState === "locked");
    button.classList.toggle("armory-shop__option--consumable", Boolean(consumableInfo));
    button.type = "button";
    button.disabled = cardState === "locked";
    button.title = requirementDescription ? `${displayName} - ${requirementDescription}` : displayName;
    button.setAttribute(
      "aria-label",
      `${displayName}, ${getShopRarityLabel(rarity)}, ${damage} damage, ${requirementDescription || getShopProductActionLabel(cardState, product.price)}`,
    );
    button.append(createProductIcon(iconUrl));
    if (consumableInfo) {
      button.append(createConsumableCardBadges(consumableInfo));
    }
    if (cardState === "locked" && requirementBadge) {
      button.append(createRequirementRibbon(requirementBadge));
    }
    if (cardState === "buy") {
      button.append(createProductStats("damage", DAMAGE_HIT_ICON_ASSET_URL, damage, product.price));
    }
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }

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
    const damage = getShopProductDisplayStat(hero, product.itemIds, "damage");
    const currentDamage = getEquippedShopProductDisplayStat(hero, product.itemIds, "damage");
    const displayName = getShopProductDisplayName(product.name);
    const isConsumable = areHeroItemsConsumable(product.itemIds);

    strip.className = `armory-shop__selected-card armory-shop__selected-card--rarity-${rarity}`;
    strip.append(
      createProductIcon(iconUrl, "armory-shop__selected-icon"),
      createSelectedMeta(displayName, rarity, "damage", DAMAGE_HIT_ICON_ASSET_URL, damage, currentDamage, product.price, {
        compareStat: !isConsumable,
        unitLabel: isConsumable ? "x1" : undefined,
      }),
      createPreviewBuyButton(product, hero),
    );

    return strip;
  }

  function createPreviewBuyButton(product: WeaponProduct, hero: HeroState): HTMLButtonElement {
    const button = document.createElement("button");
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);

    button.className = "armory-shop__selected-buy";
    button.type = "button";
    button.disabled = actionState === "equipped" || actionState === "no-gold" || actionState === "locked" || actionState === "max";
    button.textContent = actionState === "buy" ? "Buy" : getShopProductActionLabel(actionState, product.price);
    button.addEventListener("click", () => {
      options.onBuy(product);
    });

    return button;
  }

  function createBowCapacityUpgrade(hero: HeroState): HTMLElement {
    const currentCapacity = getHeroBowShotCapacity(hero);
    const isMaxed = currentCapacity >= HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX;
    const canBuy = !isMaxed && hero.gold >= HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE;
    const card = document.createElement("div");
    const icon = document.createElement("img");
    const meta = document.createElement("div");
    const name = document.createElement("span");
    const capacity = document.createElement("span");
    const price = document.createElement("span");
    const button = document.createElement("button");

    card.className = "weapon-shop__bow-upgrade-card";
    card.classList.toggle("weapon-shop__bow-upgrade-card--max", isMaxed);
    card.classList.toggle("weapon-shop__bow-upgrade-card--no-gold", !isMaxed && !canBuy);
    icon.className = "weapon-shop__bow-upgrade-icon";
    icon.src = ARROW_ICON_ASSET_URL;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    meta.className = "weapon-shop__bow-upgrade-meta";
    name.className = "weapon-shop__bow-upgrade-name";
    name.textContent = "Arrows";
    capacity.className = "weapon-shop__bow-upgrade-capacity";
    capacity.textContent = isMaxed ? `${currentCapacity} / ${HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX}` : `${currentCapacity} > ${HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX}`;
    price.className = "weapon-shop__bow-upgrade-price";
    appendPriceContent(price, HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE);
    button.className = "weapon-shop__bow-upgrade-button";
    button.type = "button";
    button.disabled = isMaxed || !canBuy || !options.onBowCapacityUpgrade;
    button.textContent = isMaxed ? "Max" : canBuy ? "Buy" : "No gold";
    button.addEventListener("click", () => {
      options.onBowCapacityUpgrade?.();
    });
    meta.append(name, capacity, price);
    card.append(icon, meta, button);

    return card;
  }

  function syncHeroState(syncOptions: WeaponShopHeroSyncOptions = {}): void {
    if (shop.hidden) {
      return;
    }

    const hero = options.getHero();

    updateShopHeroMeta(hero);
    syncSelectionState();
    refreshSelectedProduct(hero);
    refreshChangedProductButtons(hero, syncOptions);
    refreshBowCapacityUpgrade(hero);
    scheduleLayoutSync();
  }

  function updateShopHeroMeta(hero: HeroState): void {
    goldAmount.textContent = String(hero.gold);
    gold.setAttribute("aria-label", `Gold ${hero.gold}`);
    levelValue.textContent = String(hero.level);
    level.setAttribute("aria-label", `Level ${hero.level}`);
  }

  function syncSelectionState(): void {
    const hasSelection = Boolean(previewProduct);

    shop.classList.toggle("armory-shop--has-selection", hasSelection);
    selected.hidden = !hasSelection;
    content.classList.toggle("armory-shop__content--has-selection", hasSelection);
  }

  function refreshSelectedProduct(hero: HeroState): void {
    selected.replaceChildren();

    if (previewProduct) {
      selected.append(createSelectedProductStrip(previewProduct, hero));
    }
  }

  function trackProductButton(product: WeaponProduct, button: HTMLButtonElement, hero: HeroState): void {
    productButtons.set(product.id, button);
    productButtonVisualStates.set(product.id, getProductButtonVisualState(hero, product));
    product.itemIds.forEach((itemId) => addProductIdToItemIndex(itemId, product.id));
  }

  function addProductIdToItemIndex(itemId: HeroItemId, productId: string): void {
    const productIds = productIdsByItemId.get(itemId) ?? new Set<string>();

    productIds.add(productId);
    productIdsByItemId.set(itemId, productIds);
  }

  function refreshChangedProductButtons(hero: HeroState, syncOptions: WeaponShopHeroSyncOptions): void {
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

  function getProductButtonRefreshIds(product: WeaponProduct | undefined, previousHero: HeroState | undefined): Set<string> | undefined {
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

  function getProductEquipmentSlots(product: WeaponProduct): HeroEquipmentSlotKey[] {
    return product.itemIds.flatMap((itemId) => {
      const slotKey = HERO_ITEM_CATALOG[itemId]?.equipmentSlot;

      return slotKey ? [slotKey] : [];
    });
  }

  function getProductButtonVisualState(hero: HeroState, product: WeaponProduct): string {
    const actionState = getWeaponProductCardState(hero, product);
    const damage = getShopProductDisplayStat(hero, product.itemIds, "damage");
    const consumableInfo = getConsumableCardInfo(hero, product.itemIds);
    const consumableState = consumableInfo ? `${consumableInfo.quantity}/${consumableInfo.maxQuantity}` : "";

    return `${actionState}|${damage}|${consumableState}`;
  }

  function getWeaponProductCardState(hero: HeroState, product: WeaponProduct): ShopProductActionState {
    if (areHeroItemsConsumable(product.itemIds)) {
      const isMax = product.itemIds.every((itemId) => getHeroItemQuantity(hero, itemId) >= getHeroConsumableMaxQuantity(itemId));

      return isMax ? "max" : "buy";
    }

    if (areHeroItemsEquipped(hero, product.itemIds)) {
      return "equipped";
    }

    if (!canHeroEquipItems(hero, product.itemIds)) {
      return "locked";
    }

    if (areHeroItemsOwned(hero, product.itemIds)) {
      return "equip";
    }

    return "buy";
  }

  function refreshBowCapacityUpgrade(hero: HeroState): void {
    bowUpgrade.replaceChildren();
    renderBowCapacityUpgrade(hero);
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
    const shopAction = targetElement?.closest(".armory-shop__option--product, .weapon-shop__rarity-filter, .weapon-shop__type-filter, .armory-shop__back");

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

  function getVisibleProductPrewarmCandidates(): WeaponProduct[] {
    if (renderedProducts.length === 0 || productButtons.size === 0) {
      return [];
    }

    const viewportRect = content.getBoundingClientRect();
    const hasUsableViewport = viewportRect.width > 0 && viewportRect.height > 0;
    const candidates: WeaponProduct[] = [];

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

function getConsumableCardInfo(hero: HeroState, itemIds: readonly HeroItemId[]): ConsumableCardInfo | undefined {
  if (!areHeroItemsConsumable(itemIds)) {
    return undefined;
  }

  const itemId = itemIds[0];

  if (!itemId) {
    return undefined;
  }

  const maxQuantity = getHeroConsumableMaxQuantity(itemId);

  if (maxQuantity <= 0) {
    return undefined;
  }

  return {
    quantity: Math.min(getHeroItemQuantity(hero, itemId), maxQuantity),
    maxQuantity,
  };
}

function createConsumableCardBadges(info: ConsumableCardInfo): HTMLElement {
  const badges = document.createElement("span");
  const quantity = document.createElement("span");

  badges.className = "armory-shop__product-consumable-badges";
  quantity.className = "armory-shop__product-consumable-quantity";
  quantity.textContent = `${info.quantity}/${info.maxQuantity}`;
  badges.append(quantity);

  return badges;
}

function createProductStats(statLabel: string, statIconUrl: string, stat: number, price: number): HTMLElement {
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
  priceNode.className = "armory-shop__product-price";
  appendPriceContent(priceNode, price);
  statNode.append(statIcon, statValue);
  stats.append(statNode, priceNode);

  return stats;
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

function createSelectedMeta(
  productName: string,
  rarity: ShopItemRarity,
  statLabel: string,
  statIconUrl: string,
  stat: number,
  currentStat: number,
  price: number,
  options: SelectedMetaOptions = {},
): HTMLElement {
  const meta = document.createElement("div");
  const nameNode = document.createElement("span");
  const nameText = document.createElement("span");
  const rarityNode = document.createElement("span");
  const statNode = document.createElement("span");
  const statIcon = document.createElement("img");
  const currentStatNode = document.createElement("span");
  const nextStatNode = document.createElement("span");
  const priceNode = document.createElement("span");
  const comparesStat = options.compareStat ?? true;

  meta.className = "armory-shop__selected-meta";
  nameNode.className = "armory-shop__selected-name";
  nameText.className = "armory-shop__selected-name-text";
  nameText.textContent = productName;
  nameNode.append(nameText);
  if (options.unitLabel) {
    const unitNode = document.createElement("span");

    unitNode.className = "armory-shop__selected-unit";
    unitNode.textContent = options.unitLabel;
    nameNode.append(unitNode);
  }
  rarityNode.className = "armory-shop__selected-rarity";
  rarityNode.textContent = getShopRarityLabel(rarity);
  statNode.className = "armory-shop__selected-stat";
  statNode.setAttribute("aria-label", !comparesStat || currentStat === stat ? `${statLabel} ${stat}` : `${statLabel} ${currentStat} to ${stat}`);
  statIcon.className = "armory-shop__selected-stat-icon";
  statIcon.src = statIconUrl;
  statIcon.alt = "";
  statIcon.decoding = "async";
  statIcon.draggable = false;
  currentStatNode.className = "armory-shop__selected-stat-value";
  currentStatNode.textContent = String(comparesStat ? currentStat : stat);
  nextStatNode.className = "armory-shop__selected-stat-value";
  nextStatNode.classList.toggle("armory-shop__selected-stat-value--positive", stat > currentStat);
  nextStatNode.classList.toggle("armory-shop__selected-stat-value--negative", stat < currentStat);
  nextStatNode.textContent = String(stat);
  statNode.append(statIcon, currentStatNode);
  if (comparesStat && currentStat !== stat) {
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
