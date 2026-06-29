import {
  HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX,
  HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE,
  HERO_ITEM_CATALOG,
  areHeroItemsEquipped,
  areHeroItemsConsumable,
  areHeroItemsOwned,
  canHeroEquipItems,
  canHeroUseItems,
  getHeroBowShotCapacity,
  getHeroConsumableMaxQuantity,
  getHeroItemWeaponClass,
  getHeroItemQuantity,
  getHeroShurikenItemId,
  getHeroShurikenQuantity,
  type HeroEquipmentSlotKey,
  type HeroItemId,
  type HeroState,
  type HeroWeaponClass,
} from "./hero";
import {
  ARROW_ICON_ASSET_URL,
  DAMAGE_HIT_ICON_ASSET_URL,
  SHOP_BACK_ICON_ASSET_URL,
  SHOP_CATEGORY_AXE_ICON_ASSET_URL,
  SHOP_CATEGORY_BOW_ICON_ASSET_URL,
  SHOP_CATEGORY_MACE_ICON_ASSET_URL,
  SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL,
  SHOP_CATEGORY_SPEAR_ICON_ASSET_URL,
  SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
  SHOP_GOLD_COIN_ICON_ASSET_URL,
} from "./assets";
import {
  createEquipmentInlineConfirmAction,
  createEquipmentItemCardContent,
  createEquipmentSlotCard,
  type EquipmentCardAction,
  type EquipmentCardInlineConfirmAction,
} from "./equipmentCardUi";
import { GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";
import { getShopProductIconUrl } from "./shopItemIcons";
import {
  getEquippedShopProductDisplayStat,
  getShopProductActionLabel,
  getShopProductActionState,
  getShopProductDisplayStat,
  getShopProductDisplayName,
  getShopProductLevelRequirement,
  getShopProductRequirementBadge,
  getShopProductRequirementDescription,
  getShopProductRarity,
  getShopProductStat,
  getShopRarityLabel,
  isShopProductSealed,
  isShopRaritySealed,
  type ShopProductRequirementBadge,
  type ShopItemRarity,
  type ShopProductActionState,
} from "./shopPresentation";
import { readUiFilterPreferences, updateUiFilterPreferences } from "./uiFilterPreferences";

export interface WeaponProduct {
  id: string;
  categoryId: string;
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
  pendingProductId?: string | null;
}

interface WeaponCategory {
  id: string;
  name: string;
  iconUrl: string;
  products: WeaponProduct[];
  emptyText?: string;
}

interface WeaponCategoryToolbarPlaceholder {
  id: string;
  name: string;
  iconText: string;
}

type WeaponCategoryToolbarItem = WeaponCategory | WeaponCategoryToolbarPlaceholder;

function isWeaponCategoryToolbarPlaceholder(item: WeaponCategoryToolbarItem): item is WeaponCategoryToolbarPlaceholder {
  return "iconText" in item;
}

interface WeaponEquippedSlotGroup {
  id: string;
  label: string;
  modifier: string;
  area: string;
  slot?: HeroEquipmentSlotKey;
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
  weaponClass?: HeroWeaponClass;
}

interface WeaponPerkDefinition {
  chipLabel: string;
  title: string;
  lines: readonly string[];
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

const DEFAULT_WEAPON_RARITY_FILTER: ShopItemRarity = "common";
const WEAPON_RARITIES = Object.keys(WEAPON_RARITY_SORT_ORDER) as ShopItemRarity[];
const WEAPON_RARITY_FILTERS = WEAPON_RARITIES.filter((rarity) => rarity !== "mythical");
const WEAPON_RARITY_FILTER_CLASS_NAMES = WEAPON_RARITY_FILTERS.map((rarity) => `armory-shop__set-filter--rarity-${rarity}`);
const WEAPON_RANGED_CATEGORY_IDS = new Set(["bows", "shurikens"]);
const WEAPON_CATEGORY_PLACEHOLDER_ID = "display-mode-placeholder";
const WEAPON_PERK_DEFINITIONS: Record<HeroWeaponClass, WeaponPerkDefinition> = {
  sword: {
    chipLabel: "Precise",
    title: "Sword / Precise",
    lines: ["Higher hit chance.", "Light: hit chance +15%", "Medium: hit chance +20%", "Heavy: hit chance +25%"],
  },
  mace: {
    chipLabel: "Armorbreaker",
    title: "Mace / Armorbreaker",
    lines: ["Deals more damage while target has armor.", "Damage +25% against armored targets."],
  },
  axe: {
    chipLabel: "Brutal",
    title: "Axe / Brutal",
    lines: ["High damage weapon.", "Strength damage x2.", "Light: hit chance -25%", "Medium: hit chance -15%", "Heavy: hit chance -15%"],
  },
  spear: {
    chipLabel: "Reach",
    title: "Spear / Reach",
    lines: ["Longer range.", "Lunge: higher damage, agility scaling, increased hit chance."],
  },
  bow: {
    chipLabel: "Ranged",
    title: "Bow / Ranged",
    lines: ["Ranged weapon.", "Damage scales with agility.", "Limited shots per battle."],
  },
  shuriken: {
    chipLabel: "Throwing",
    title: "Shuriken / Throwing",
    lines: ["Thrown consumable weapon.", "Uses carried shuriken charges."],
  },
};

const WEAPON_CATEGORIES: WeaponCategory[] = [
  {
    id: "swords",
    name: "Swords",
    iconUrl: SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("swords"),
  },
  {
    id: "axes",
    name: "Axes",
    iconUrl: SHOP_CATEGORY_AXE_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("axes"),
    emptyText: "Axes soon",
  },
  {
    id: "maces",
    name: "Maces",
    iconUrl: SHOP_CATEGORY_MACE_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("maces"),
    emptyText: "Maces soon",
  },
  {
    id: "spears",
    name: "Spears",
    iconUrl: SHOP_CATEGORY_SPEAR_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("spears"),
    emptyText: "Spears soon",
  },
  {
    id: "bows",
    name: "Bows",
    iconUrl: SHOP_CATEGORY_BOW_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("bows"),
    emptyText: "Bows soon",
  },
  {
    id: "shurikens",
    name: "Shurikens",
    iconUrl: SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL,
    products: getGeneratedWeaponProducts("shurikens"),
    emptyText: "Shurikens soon",
  },
];
const WEAPON_CATEGORY_TOOLBAR_ITEMS: readonly WeaponCategoryToolbarItem[] = [
  ...WEAPON_CATEGORIES,
  {
    id: WEAPON_CATEGORY_PLACEHOLDER_ID,
    name: "Two columns",
    iconText: "2",
  },
];
const WEAPON_EQUIPPED_SLOT_GROUPS: readonly WeaponEquippedSlotGroup[] = [
  { id: "bow", label: "Bow", modifier: "weapon-bow", area: "bow", slot: "weaponBow" },
  { id: "melee", label: "Melee weapon", modifier: "weapon-main", area: "melee", slot: "weaponMain" },
  { id: "shuriken", label: "Shuriken", modifier: "weapon-shuriken", area: "shuriken" },
];

const BOW_CATEGORY_ID = "bows";
const SHOP_LAYOUT_SETTLE_DELAYS_MS = [80, 180, 360] as const;
const SHOP_VISIBLE_PREWARM_PRODUCT_LIMIT = 6;
const SHOP_PREWARM_AFTER_SCROLL_DELAY_MS = 140;

function getGeneratedWeaponProducts(categoryId: string): WeaponProduct[] {
  return GENERATED_WEAPON_PRODUCTS.filter((product) => product.categoryId === categoryId)
    .map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
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

  const categoryGroupDifference = getWeaponProductCategoryGroupOrder(left) - getWeaponProductCategoryGroupOrder(right);

  if (categoryGroupDifference !== 0) {
    return categoryGroupDifference;
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

function getWeaponProductCategoryGroupOrder(product: WeaponProduct): number {
  return WEAPON_RANGED_CATEGORY_IDS.has(product.categoryId) ? 1 : 0;
}

function filterWeaponProductsByRarities(products: readonly WeaponProduct[], rarities: ReadonlySet<ShopItemRarity>): WeaponProduct[] {
  if (rarities.size === 0) {
    return [];
  }

  return products.filter((product) => rarities.has(getShopProductRarity(product.itemIds, product.rarity)));
}

function getAvailableWeaponRarities(hero: HeroState, products: readonly WeaponProduct[]): ShopItemRarity[] {
  const rarities = new Set(products.map((product) => getShopProductRarity(product.itemIds, product.rarity)));

  return WEAPON_RARITY_FILTERS.filter((rarity) => rarities.has(rarity) && !isShopRaritySealed(hero, rarity));
}

function getDefaultWeaponRarityFilterIds(): Set<ShopItemRarity> {
  return new Set([DEFAULT_WEAPON_RARITY_FILTER]);
}

function getDefaultWeaponTypeFilterIds(): Set<string> {
  return new Set();
}

function getStoredWeaponRarityFilterIds(rarityIds: readonly string[] | undefined): Set<ShopItemRarity> {
  if (!rarityIds) {
    return getDefaultWeaponRarityFilterIds();
  }

  const selectedRarityIds = rarityIds.filter((rarityId): rarityId is ShopItemRarity =>
    WEAPON_RARITY_FILTERS.includes(rarityId as ShopItemRarity),
  );

  return selectedRarityIds.length > 0 ? new Set(selectedRarityIds) : getDefaultWeaponRarityFilterIds();
}

function getStoredWeaponTypeFilterIds(typeIds: readonly string[] | undefined): Set<string> {
  if (!typeIds) {
    return getDefaultWeaponTypeFilterIds();
  }

  const availableTypeIds = new Set(WEAPON_CATEGORIES.map((category) => category.id));
  const selectedTypeIds = typeIds.filter((typeId) => availableTypeIds.has(typeId));

  return selectedTypeIds.length >= WEAPON_CATEGORIES.length ? getDefaultWeaponTypeFilterIds() : new Set(selectedTypeIds);
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
  const storedFilterPreferences = readUiFilterPreferences().weaponShop;
  let selectedWeaponTypeIds = getStoredWeaponTypeFilterIds(storedFilterPreferences?.typeIds);
  let selectedRarityIds = getStoredWeaponRarityFilterIds(storedFilterPreferences?.rarityIds);
  let isTwoColumnProductMode = storedFilterPreferences?.twoColumn === true;
  let previewProduct: WeaponProduct | undefined;
  let unmountPreview: (() => void) | undefined;
  let transitionTimer: number | undefined;
  let scrollIndicatorTimer: number | undefined;
  let layoutFrame: number | undefined;
  let layoutSettleTimers: number[] = [];
  let productPrewarmFrame: number | undefined;
  let productPrewarmTimer: number | undefined;
  let pendingProductId: string | undefined;
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

  const equipment = document.createElement("div");
  equipment.className = "armory-shop__equipment weapon-shop__equipment";
  equipment.setAttribute("aria-label", "Equipped weapons");

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
  const rarityFilterInputs = new Map<ShopItemRarity, HTMLInputElement>();

  rarityFilter.className = "armory-shop__parts-filter weapon-shop__rarity-filter";
  rarityFilter.setAttribute("aria-label", "Weapon rarity");
  rarityFilterSummary.className = "armory-shop__parts-summary weapon-shop__rarity-summary";
  rarityFilterSummaryText.className = "armory-shop__parts-summary-text";
  rarityFilterSummary.append(rarityFilterSummaryText);
  rarityFilterPanel.className = "armory-shop__parts-panel weapon-shop__rarity-panel";
  rarityFilter.append(rarityFilterSummary, rarityFilterPanel);

  const categoryFilter = document.createElement("div");
  const weaponCategoryButtons = new Map<string, HTMLButtonElement>();
  let displayModeButton: HTMLButtonElement | undefined;

  categoryFilter.className = "weapon-shop__category-filter";
  categoryFilter.setAttribute("aria-label", "Weapon types");
  WEAPON_CATEGORY_TOOLBAR_ITEMS.forEach((item) => categoryFilter.append(createWeaponCategoryButton(item)));

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

  const footerMeta = document.createElement("div");
  footerMeta.className = "armory-shop__footer-meta";

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
      const previousProductId = clearProductPreview();

      updateProductButtonSelection(previousProductId);
      return;
    }

    close();
  });

  if (usesCityHeroPreview) {
    footerMeta.append(gold, back, level);
    header.append(title, rarityFilter, categoryFilter);
    tray.append(header, content, footerMeta, scrollIndicator);
    menu.append(tray);
  } else {
    headerMeta.append(gold, level);
    header.append(back, title, rarityFilter, categoryFilter, headerMeta);
    tray.append(header, selected, content, scrollIndicator);
    menu.append(tray);
  }
  if (options.mountPreview) {
    panel.append(previewShell);
  } else {
    panel.append(bowUpgrade);
    if (usesCityHeroPreview) {
      panel.append(equipment);
      panel.append(selected);
    }
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

  function persistWeaponShopFilterPreferences(): void {
    updateUiFilterPreferences((preferences) => ({
      ...preferences,
      weaponShop: {
        rarityIds: [...selectedRarityIds],
        typeIds: [...selectedWeaponTypeIds],
        twoColumn: isTwoColumnProductMode,
      },
    }));
  }

  function open(): void {
    clearTransitionTimer();
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
    const shopProducts = filterVisibleWeaponShopProducts(hero, getWeaponProductsForCategories(selectedCategories));
    const typeFilteredProducts = shopProducts;
    const availableRarities = getAvailableWeaponRarities(hero, typeFilteredProducts);

    if (previewProduct && !isWeaponProductVisibleInShop(hero, previewProduct)) {
      clearProductPreview();
    }

    if (normalizeSelectedWeaponRarityIds(availableRarities)) {
      persistWeaponShopFilterPreferences();
      clearProductPreview();
    }

    const selectedProducts = sortWeaponProductsForHero(hero, filterWeaponProductsByRarities(typeFilteredProducts, selectedRarityIds));

    title.textContent = "Weapons";
    shop.classList.toggle("armory-shop--two-column", isTwoColumnProductMode);
    renderRarityFilterOptions(availableRarities);
    updateWeaponCategoryButtons();
    updateWeaponDisplayModeButton();
    renderEquippedWeaponSlots(hero);
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

    const bowCategory = selectedWeaponTypeIds.has(BOW_CATEGORY_ID) ? WEAPON_CATEGORIES.find((category) => category.id === BOW_CATEGORY_ID) : undefined;
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

  function sortWeaponProductsForHero(hero: HeroState, products: readonly WeaponProduct[]): WeaponProduct[] {
    return [...products].sort((left, right) => compareWeaponProductsForHero(hero, left, right));
  }

  function compareWeaponProductsForHero(hero: HeroState, left: WeaponProduct, right: WeaponProduct): number {
    const availabilityDifference = getWeaponProductAvailabilityOrder(hero, left) - getWeaponProductAvailabilityOrder(hero, right);

    if (availabilityDifference !== 0) {
      return availabilityDifference;
    }

    return compareWeaponProducts(left, right);
  }

  function getWeaponProductAvailabilityOrder(hero: HeroState, product: WeaponProduct): number {
    const actionState = getWeaponProductCardState(hero, product);

    return actionState === "locked" || actionState === "sealed" ? 1 : 0;
  }

  function ensurePreviewMounted(): void {
    if (unmountPreview || !options.mountPreview) {
      return;
    }

    unmountPreview = options.mountPreview(preview);
  }

  function renderRarityFilterOptions(availableRarities: readonly ShopItemRarity[]): void {
    rarityFilterInputs.clear();
    rarityFilterPanel.replaceChildren(...availableRarities.map(createRarityFilterOption));
    updateRarityFilterVisual();
  }

  function updateRarityFilterVisual(): void {
    rarityFilter.classList.remove(...WEAPON_RARITY_FILTER_CLASS_NAMES);
    rarityFilterInputs.forEach((input) => {
      input.checked = selectedRarityIds.has(input.value as ShopItemRarity);
    });
    rarityFilterSummaryText.textContent = "Rarity";

    if (selectedRarityIds.size === 1) {
      const [rarity] = selectedRarityIds;

      if (rarity) {
        rarityFilter.classList.add(`armory-shop__set-filter--rarity-${rarity}`);
      }
    }
  }

  function createRarityFilterOption(rarity: ShopItemRarity): HTMLLabelElement {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");

    label.className = `armory-shop__parts-option weapon-shop__rarity-option armory-shop__set-filter-option--rarity-${rarity}`;
    input.className = "armory-shop__parts-checkbox weapon-shop__rarity-checkbox";
    input.type = "checkbox";
    input.name = "weapon-shop-rarity-filter";
    input.value = rarity;
    text.className = "armory-shop__parts-option-text weapon-shop__rarity-option-text";
    text.textContent = getShopRarityLabel(rarity);
    input.addEventListener("change", () => {
      if (!input.checked && selectedRarityIds.size <= 1 && selectedRarityIds.has(rarity)) {
        input.checked = true;
        return;
      }

      if (input.checked) {
        selectedRarityIds.add(rarity);
      } else {
        selectedRarityIds.delete(rarity);
      }

      persistWeaponShopFilterPreferences();
      clearProductPreview();
      updateRarityFilterVisual();
      render();
    });

    rarityFilterInputs.set(rarity, input);
    label.append(input, text);

    return label;
  }

  function createWeaponCategoryButton(category: WeaponCategoryToolbarItem): HTMLButtonElement {
    const button = document.createElement("button");

    button.className = "weapon-shop__category-button";
    button.type = "button";
    button.title = category.name;
    button.setAttribute("aria-label", category.name);
    button.setAttribute("aria-pressed", "false");

    if (isWeaponCategoryToolbarPlaceholder(category)) {
      const icon = document.createElement("span");

      button.classList.add("weapon-shop__category-button--placeholder", "weapon-shop__category-button--display-mode");
      button.title = "Two columns";
      button.setAttribute("aria-label", "Two columns");
      icon.className = "weapon-shop__category-placeholder";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = category.iconText;
      button.addEventListener("click", () => {
        closeRarityFilter();
        isTwoColumnProductMode = !isTwoColumnProductMode;
        persistWeaponShopFilterPreferences();
        shop.classList.toggle("armory-shop--two-column", isTwoColumnProductMode);
        updateWeaponDisplayModeButton();
        scheduleLayoutSync();
        scheduleVisibleProductPrewarm();
      });
      button.append(icon);
      displayModeButton = button;

      return button;
    }

    const icon = document.createElement("img");

    icon.className = "weapon-shop__category-icon";
    icon.src = category.iconUrl;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    button.addEventListener("click", () => {
      closeRarityFilter();

      if (selectedWeaponTypeIds.has(category.id)) {
        selectedWeaponTypeIds.delete(category.id);
      } else {
        selectedWeaponTypeIds.add(category.id);
      }

      normalizeSelectedWeaponTypeIds();
      persistWeaponShopFilterPreferences();
      clearProductPreview();
      updateWeaponCategoryButtons();
      render();
    });

    weaponCategoryButtons.set(category.id, button);
    button.append(icon);

    return button;
  }

  function updateWeaponCategoryButtons(): void {
    WEAPON_CATEGORIES.forEach((category) => {
      const button = weaponCategoryButtons.get(category.id);

      if (button) {
        const isActive = selectedWeaponTypeIds.has(category.id);

        button.classList.toggle("weapon-shop__category-button--active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      }
    });
  }

  function updateWeaponDisplayModeButton(): void {
    if (!displayModeButton) {
      return;
    }

    displayModeButton.classList.toggle("weapon-shop__category-button--active", isTwoColumnProductMode);
    displayModeButton.setAttribute("aria-pressed", String(isTwoColumnProductMode));
    displayModeButton.title = isTwoColumnProductMode ? "One column" : "Two columns";
    displayModeButton.setAttribute("aria-label", displayModeButton.title);
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

  function normalizeSelectedWeaponRarityIds(availableRarities: readonly ShopItemRarity[]): boolean {
    const availableRarityIds = new Set(availableRarities);
    const nextRarityIds = new Set([...selectedRarityIds].filter((rarity) => availableRarityIds.has(rarity)));
    const fallbackRarity = availableRarityIds.has(DEFAULT_WEAPON_RARITY_FILTER) ? DEFAULT_WEAPON_RARITY_FILTER : availableRarities[0];

    if (nextRarityIds.size === 0 && fallbackRarity) {
      nextRarityIds.add(fallbackRarity);
    }

    if (areRarityFiltersEqual(selectedRarityIds, nextRarityIds)) {
      return false;
    }

    selectedRarityIds = nextRarityIds;

    return true;
  }

  function areRarityFiltersEqual(left: ReadonlySet<ShopItemRarity>, right: ReadonlySet<ShopItemRarity>): boolean {
    if (left.size !== right.size) {
      return false;
    }

    return [...left].every((rarity) => right.has(rarity));
  }

  function createProductButton(product: WeaponProduct, hero: HeroState, isSelected: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const damage = getShopProductDisplayStat(hero, product.itemIds, "damage");
    const cardState = getWeaponProductCardState(hero, product);
    const actionState = getWeaponProductActionState(hero, product);
    const isPending = pendingProductId === product.id;
    const inlineConfirmAction = isSelected
      ? isPending
        ? getPendingProductInlineConfirmAction()
        : getProductInlineConfirmAction(actionState, product.price)
      : undefined;
    const displayName = getShopProductDisplayName(product.name);
    const isConsumable = areHeroItemsConsumable(product.itemIds);
    const currentDamage = isConsumable ? damage : getEquippedShopProductDisplayStat(hero, product.itemIds, "damage");
    const requirementBadge = getShopProductRequirementBadge(hero, product.itemIds);
    const requirementDescription = getShopProductRequirementDescription(hero, product.itemIds);
    const consumableInfo = getConsumableCardInfo(hero, product.itemIds);

    button.className = `equipment-item-card armory-shop__option armory-shop__option--product armory-shop__option--rarity-${rarity}`;
    button.classList.toggle("equipment-item-card--selected", isSelected);
    button.classList.toggle("armory-shop__option--selected", isSelected);
    button.classList.toggle("equipment-item-card--equipped", cardState === "equipped");
    button.classList.toggle("armory-shop__option--owned", cardState === "equip");
    button.classList.toggle("armory-shop__option--equipped", cardState === "equipped");
    button.classList.toggle("armory-shop__option--max", cardState === "max");
    button.classList.toggle("armory-shop__option--for-sale", cardState === "buy");
    button.classList.toggle("armory-shop__option--locked", cardState === "locked");
    button.classList.toggle("armory-shop__option--sealed", cardState === "sealed" || cardState === "locked");
    button.classList.toggle("armory-shop__option--consumable", Boolean(consumableInfo));
    button.classList.toggle("armory-shop__option--inline-confirm", Boolean(inlineConfirmAction));
    button.classList.toggle("armory-shop__option--pending", isPending);
    button.type = "button";
    button.disabled = isPending || cardState === "sealed" || cardState === "locked";
    button.title = cardState === "sealed" ? `${displayName} - SEALED` : requirementDescription ? `${displayName} - ${requirementDescription}` : displayName;
    button.setAttribute(
      "aria-label",
      `${displayName}, ${getShopRarityLabel(rarity)}, ${damage} damage, ${
        isPending
          ? "buying"
          : inlineConfirmAction
          ? inlineConfirmAction.state === "buy"
            ? `selected, buy for ${product.price} gold`
            : `selected, not enough gold, ${product.price} gold`
          : requirementDescription || getShopProductActionLabel(actionState, product.price)
      }`,
    );
    const cardContent = createEquipmentItemCardContent({
      iconUrl,
      name: displayName,
      rarityLabel: getShopRarityLabel(rarity),
      statIconUrl: DAMAGE_HIT_ICON_ASSET_URL,
      statLabel: "damage",
      statValue: damage,
      diff: damage - currentDamage,
      levelRequirement: inlineConfirmAction ? undefined : getShopProductLevelRequirement(product.itemIds),
      action: inlineConfirmAction ? undefined : isPending ? getPendingProductCardAction() : getProductCardAction(actionState, product.price),
    });

    if (inlineConfirmAction) {
      cardContent.classList.add("equipment-item-card__content--with-inline-confirm");
      cardContent.append(createEquipmentInlineConfirmAction(inlineConfirmAction));
    }

    button.append(cardContent);
    if (consumableInfo) {
      button.append(createConsumableCardBadges(consumableInfo));
    }
    if (cardState === "sealed") {
      button.append(createSealedRibbon());
    }
    if (cardState === "locked" && requirementBadge) {
      button.append(createRequirementRibbon(requirementBadge));
    }
    button.addEventListener("click", (event) => {
      if (button.disabled || (pendingProductId && !isPending)) {
        return;
      }

      closeRarityFilter();
      if (isSelected) {
        const target = event.target;
        const confirmAction =
          target instanceof Element ? target.closest(".equipment-item-card__confirm-action") : undefined;

        if (confirmAction && button.contains(confirmAction) && inlineConfirmAction?.state === "buy") {
          options.onBuy(product);
        }

        return;
      }

      previewWeaponProduct(product);
    });

    return button;
  }

  function previewWeaponProduct(product: WeaponProduct): void {
    if (previewProduct?.id === product.id) {
      return;
    }

    const previousProductId = previewProduct?.id;

    clearVisibleProductPrewarm();
    previewProduct = product;
    options.onPreview?.(product);
    updateProductButtonSelection(previousProductId);
    scheduleLayoutSync();
    scheduleVisibleProductPrewarm();
  }

  function createSelectedProductStrip(product: WeaponProduct, hero: HeroState): HTMLElement {
    const strip = document.createElement("div");
    const iconUrl = getShopProductIconUrl(product.itemIds);
    const rarity = getShopProductRarity(product.itemIds, product.rarity);
    const damage = getShopProductDisplayStat(hero, product.itemIds, "damage");
    const currentDamage = getEquippedShopProductDisplayStat(hero, product.itemIds, "damage");
    const displayName = getShopProductDisplayName(product.name);
    const isConsumable = areHeroItemsConsumable(product.itemIds);
    const weaponClass = getWeaponProductClass(product);

    strip.className = `armory-shop__selected-card armory-shop__selected-card--rarity-${rarity}`;
    strip.append(
      createProductIcon(iconUrl, "armory-shop__selected-icon"),
      createSelectedMeta(displayName, rarity, "damage", DAMAGE_HIT_ICON_ASSET_URL, damage, currentDamage, {
        compareStat: !isConsumable,
        unitLabel: isConsumable ? "x1" : undefined,
        weaponClass,
      }),
      createPreviewBuyButton(product, hero),
    );

    return strip;
  }

  function createPreviewBuyButton(product: WeaponProduct, hero: HeroState): HTMLButtonElement {
    const button = document.createElement("button");
    const actionState = getWeaponProductActionState(hero, product);
    const isPending = pendingProductId === product.id;

    button.className = "armory-shop__selected-buy";
    button.type = "button";
    button.disabled =
      isPending || actionState === "equipped" || actionState === "no-gold" || actionState === "sealed" || actionState === "locked" || actionState === "max";
    if (isPending) {
      button.textContent = "BUYING";
      button.setAttribute("aria-label", `Buying ${getShopProductDisplayName(product.name)}`);
    } else if (actionState === "buy" || actionState === "no-gold") {
      button.classList.add("armory-shop__selected-buy--price");
      appendPriceContent(button, product.price);
    } else {
      button.textContent = getShopProductActionLabel(actionState, product.price);
    }
    button.addEventListener("click", () => {
      closeRarityFilter();
      options.onBuy(product);
    });

    return button;
  }

  function createBowCapacityUpgrade(hero: HeroState): HTMLElement {
    const currentCapacity = getHeroBowShotCapacity(hero);
    const isMaxed = currentCapacity >= HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX;
    const canBuy = !isMaxed && hero.gold >= HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE;
    const card = document.createElement("button");
    const icon = document.createElement("img");
    const capacity = document.createElement("span");
    const currentCapacityNode = document.createElement("span");
    const arrowNode = document.createElement("span");
    const nextCapacityNode = document.createElement("span");
    const price = document.createElement("span");

    card.className = "weapon-shop__bow-upgrade-card";
    card.type = "button";
    card.disabled = isMaxed || !canBuy || !options.onBowCapacityUpgrade;
    card.classList.toggle("weapon-shop__bow-upgrade-card--max", isMaxed);
    card.classList.toggle("weapon-shop__bow-upgrade-card--no-gold", !isMaxed && !canBuy);
    card.setAttribute(
      "aria-label",
      isMaxed
        ? `Arrows capacity ${currentCapacity} of ${HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX}, max`
        : `Upgrade arrows capacity from ${currentCapacity} to ${HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX} for ${HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE} gold`,
    );
    icon.className = "weapon-shop__bow-upgrade-icon";
    icon.src = ARROW_ICON_ASSET_URL;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    capacity.className = "weapon-shop__bow-upgrade-capacity";
    currentCapacityNode.className = "weapon-shop__bow-upgrade-capacity-current";
    currentCapacityNode.textContent = String(currentCapacity);
    arrowNode.className = "weapon-shop__bow-upgrade-capacity-arrow";
    arrowNode.textContent = isMaxed ? "/" : ">";
    nextCapacityNode.className = "weapon-shop__bow-upgrade-capacity-next";
    nextCapacityNode.textContent = String(HERO_BOW_SHOT_CAPACITY_UPGRADE_MAX);
    price.className = "weapon-shop__bow-upgrade-price";
    if (isMaxed) {
      price.textContent = "Max";
    } else {
      appendPriceContent(price, HERO_BOW_SHOT_CAPACITY_UPGRADE_PRICE);
    }
    card.addEventListener("click", () => {
      closeRarityFilter();
      options.onBowCapacityUpgrade?.();
    });
    capacity.append(currentCapacityNode, arrowNode, nextCapacityNode);
    card.append(icon, capacity, price);

    return card;
  }

  function syncHeroState(syncOptions: WeaponShopHeroSyncOptions = {}): void {
    const previousPendingProductId = pendingProductId;

    if ("pendingProductId" in syncOptions) {
      pendingProductId = syncOptions.pendingProductId ?? undefined;
      shop.classList.toggle("armory-shop--purchase-pending", Boolean(pendingProductId));
    }

    if (shop.hidden) {
      return;
    }

    const hero = options.getHero();

    updateShopHeroMeta(hero);
    renderEquippedWeaponSlots(hero);
    syncSelectionState();
    refreshSelectedProduct(hero);
    refreshChangedProductButtons(hero, syncOptions, previousPendingProductId);
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

    shop.classList.remove("armory-shop--has-selection");
    shop.classList.toggle("weapon-shop--has-inline-confirm", hasSelection);
    selected.hidden = true;
    content.classList.toggle("armory-shop__content--has-selection", false);
  }

  function refreshSelectedProduct(_hero: HeroState): void {
    selected.replaceChildren();
  }

  function updateProductButtonSelection(previousProductId?: string): void {
    const hero = options.getHero();
    const nextProductId = previewProduct?.id;

    syncSelectionState();
    if (previousProductId && previousProductId !== nextProductId) {
      refreshProductButton(previousProductId, hero, true);
    }

    if (nextProductId) {
      refreshProductButton(nextProductId, hero, true);
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

  function refreshChangedProductButtons(hero: HeroState, syncOptions: WeaponShopHeroSyncOptions, previousPendingProductId?: string): void {
    const hiddenProducts = renderedProducts.filter((product) => !isWeaponProductVisibleInShop(hero, product));

    if (hiddenProducts.length > 0) {
      if (syncOptions.product && hiddenProducts.length === 1 && hiddenProducts[0]?.id === syncOptions.product.id) {
        removeRenderedProduct(hiddenProducts[0]);
        refreshVisibleProductButtons(hero);
        return;
      }

      render();
      return;
    }

    if ("pendingProductId" in syncOptions) {
      if (previousPendingProductId) {
        refreshProductButton(previousPendingProductId, hero, true);
      }
      if (pendingProductId) {
        refreshProductButton(pendingProductId, hero, true);
      }
      return;
    }

    const productIds = getProductButtonRefreshIds(syncOptions.product, syncOptions.previousHero);

    if (productIds) {
      productIds.forEach((productId) => refreshProductButton(productId, hero));
      return;
    }

    refreshVisibleProductButtons(hero);
  }

  function refreshVisibleProductButtons(hero: HeroState): void {
    renderedProducts.forEach((product) => refreshProductButton(product.id, hero));
  }

  function removeRenderedProduct(product: WeaponProduct): void {
    productButtons.get(product.id)?.remove();
    productButtons.delete(product.id);
    productButtonVisualStates.delete(product.id);
    renderedProductsById.delete(product.id);
    renderedProducts = renderedProducts.filter((renderedProduct) => renderedProduct.id !== product.id);
    product.itemIds.forEach((itemId) => removeProductIdFromItemIndex(itemId, product.id));

    if (previewProduct?.id === product.id) {
      clearProductPreview();
      syncSelectionState();
    }

    if (renderedProducts.length === 0) {
      content.append(createEmptyState("No items yet"));
    }
  }

  function refreshProductButton(productId: string, hero: HeroState, force = false): void {
    const product = renderedProductsById.get(productId);

    if (!product) {
      return;
    }

    const currentButton = productButtons.get(product.id);

    if (!currentButton) {
      return;
    }

    const nextVisualState = getProductButtonVisualState(hero, product);

    if (!force && productButtonVisualStates.get(product.id) === nextVisualState) {
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

  function removeProductIdFromItemIndex(itemId: HeroItemId, productId: string): void {
    const productIds = productIdsByItemId.get(itemId);

    if (!productIds) {
      return;
    }

    productIds.delete(productId);
    if (productIds.size === 0) {
      productIdsByItemId.delete(itemId);
    }
  }

  function getProductEquipmentSlots(product: WeaponProduct): HeroEquipmentSlotKey[] {
    return product.itemIds.flatMap((itemId) => {
      const slotKey = HERO_ITEM_CATALOG[itemId]?.equipmentSlot;

      return slotKey ? [slotKey] : [];
    });
  }

  function getProductButtonVisualState(hero: HeroState, product: WeaponProduct): string {
    const actionState = getWeaponProductActionState(hero, product);
    const damage = getShopProductDisplayStat(hero, product.itemIds, "damage");
    const consumableInfo = getConsumableCardInfo(hero, product.itemIds);
    const consumableState = consumableInfo ? `${consumableInfo.quantity}/${consumableInfo.maxQuantity}` : "";
    const pendingState = pendingProductId === product.id ? "pending" : "";

    return `${actionState}|${damage}|${consumableState}|${pendingState}`;
  }

  function getWeaponProductCardState(hero: HeroState, product: WeaponProduct): ShopProductActionState {
    if (areHeroItemsConsumable(product.itemIds)) {
      const isMax = product.itemIds.every((itemId) => getConsumableQuantity(hero, itemId) >= getHeroConsumableMaxQuantity(itemId));

      if (!canHeroUseItems(hero, product.itemIds)) {
        return "locked";
      }

      if (isMax) {
        return "max";
      }

      return isShopProductSealed(hero, product.itemIds, product.rarity) ? "sealed" : "buy";
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

    return isShopProductSealed(hero, product.itemIds, product.rarity) ? "sealed" : "buy";
  }

  function filterVisibleWeaponShopProducts(hero: HeroState, products: readonly WeaponProduct[]): WeaponProduct[] {
    return products.filter((product) => isWeaponProductVisibleInShop(hero, product));
  }

  function isWeaponProductVisibleInShop(hero: HeroState, product: WeaponProduct): boolean {
    if (areHeroItemsConsumable(product.itemIds)) {
      return !isShopProductSealed(hero, product.itemIds, product.rarity);
    }

    return (
      !areHeroItemsOwned(hero, product.itemIds) &&
      !isShopProductSealed(hero, product.itemIds, product.rarity)
    );
  }

  function getWeaponProductActionState(hero: HeroState, product: WeaponProduct): ShopProductActionState {
    const actionState = getShopProductActionState(hero, product.itemIds, product.price);

    if ((actionState === "buy" || actionState === "no-gold") && isShopProductSealed(hero, product.itemIds, product.rarity)) {
      return "sealed";
    }

    return actionState;
  }

  function refreshBowCapacityUpgrade(hero: HeroState): void {
    bowUpgrade.replaceChildren();
    renderBowCapacityUpgrade(hero);
  }

  function renderEquippedWeaponSlots(hero: HeroState): void {
    if (!usesCityHeroPreview) {
      return;
    }

    const renderKey = getWeaponEquippedSlotsRenderKey(hero);

    if (equipment.dataset.weaponEquippedSlotsRenderKey === renderKey) {
      return;
    }

    equipment.dataset.weaponEquippedSlotsRenderKey = renderKey;
    equipment.replaceChildren(...WEAPON_EQUIPPED_SLOT_GROUPS.map((group) => createEquippedWeaponSlot(group, hero)));
  }

  function createEquippedWeaponSlot(group: WeaponEquippedSlotGroup, hero: HeroState): HTMLElement {
    const itemId = getEquippedWeaponSlotItemId(group, hero);
    const itemIds = itemId ? [itemId] : [];
    const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;
    const iconUrl = getShopProductIconUrl(itemIds);
    const rarity = itemIds.length > 0 ? getShopProductRarity(itemIds) : "empty";
    const quantity = getEquippedWeaponSlotQuantity(group, hero, itemId);
    const label = item
      ? `${group.label}: ${getShopProductDisplayName(item.name)}${quantity > 0 ? ` x${quantity}` : ""}`
      : `${group.label}: empty`;

    return createEquipmentSlotCard({
      tagName: "div",
      classNames: [
        "armory-shop__equipped-slot",
        "weapon-shop__equipped-slot",
        `armory-shop__equipped-slot--${group.modifier}`,
        `armory-shop__equipped-slot--area-${group.area}`,
        `armory-shop__equipped-slot--${rarity}`,
      ],
      iconClassNames: ["armory-shop__equipped-icon"],
      rarity,
      rarityClassName: rarity !== "empty" ? `armory-shop__option--rarity-${rarity}` : undefined,
      iconUrl,
      label,
      count: quantity > 0 ? quantity : undefined,
      countClassName: "weapon-shop__equipped-count",
    });
  }

  function getEquippedWeaponSlotItemId(group: WeaponEquippedSlotGroup, hero: HeroState): HeroItemId | undefined {
    if (group.slot) {
      return hero.equipment[group.slot] ?? undefined;
    }

    return group.id === "shuriken" ? getHeroShurikenItemId(hero) : undefined;
  }

  function getEquippedWeaponSlotQuantity(group: WeaponEquippedSlotGroup, hero: HeroState, itemId: HeroItemId | undefined): number {
    if (group.id !== "shuriken" || !itemId) {
      return 0;
    }

    return getHeroItemQuantity(hero, itemId);
  }

  function getWeaponEquippedSlotsRenderKey(hero: HeroState): string {
    return WEAPON_EQUIPPED_SLOT_GROUPS.map((group) => {
      const itemId = getEquippedWeaponSlotItemId(group, hero);
      const quantity = getEquippedWeaponSlotQuantity(group, hero, itemId);

      return `${group.id}:${itemId ?? ""}:${quantity}`;
    }).join("|");
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

  function closeRarityFilter(): void {
    rarityFilter.open = false;
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
    const shopAction = targetElement?.closest(".armory-shop__option--product, .weapon-shop__rarity-filter, .weapon-shop__category-filter, .armory-shop__back");

    if (shopAction && shop.contains(shopAction)) {
      return;
    }

    const previousProductId = clearProductPreview();

    updateProductButtonSelection(previousProductId);
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

function createProductIcon(iconUrl: string | undefined, className: string): HTMLElement {
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
    quantity: Math.min(getConsumableQuantity(hero, itemId), maxQuantity),
    maxQuantity,
  };
}

function getConsumableQuantity(hero: HeroState, itemId: HeroItemId): number {
  return HERO_ITEM_CATALOG[itemId]?.kind === "scroll" ? getHeroItemQuantity(hero, itemId) : getHeroShurikenQuantity(hero);
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

function getProductCardAction(actionState: ShopProductActionState, price: number): EquipmentCardAction {
  if (actionState === "buy" || actionState === "no-gold" || actionState === "sealed" || actionState === "locked") {
    return { kind: "price", iconUrl: SHOP_GOLD_COIN_ICON_ASSET_URL, value: price, state: actionState };
  }

  return { kind: "status", label: getShopProductActionLabel(actionState, price), state: actionState };
}

function getPendingProductCardAction(): EquipmentCardAction {
  return { kind: "status", label: "BUYING", state: "buying" };
}

function getPendingProductInlineConfirmAction(): EquipmentCardInlineConfirmAction {
  return { state: "buying" };
}

function getProductInlineConfirmAction(actionState: ShopProductActionState, price: number): EquipmentCardInlineConfirmAction | undefined {
  if (actionState !== "buy" && actionState !== "no-gold") {
    return undefined;
  }

  return { state: actionState, price, iconUrl: SHOP_GOLD_COIN_ICON_ASSET_URL };
}

function createRequirementRibbon(requirement: ShopProductRequirementBadge): HTMLElement {
  const ribbon = document.createElement("span");

  ribbon.className = "armory-shop__sealed-ribbon armory-shop__requirement-ribbon";
  appendRequirementContent(ribbon, requirement);

  return ribbon;
}

function createSealedRibbon(): HTMLElement {
  const ribbon = document.createElement("span");

  ribbon.className = "armory-shop__sealed-ribbon";
  ribbon.textContent = "SEALED";

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

function getWeaponProductClass(product: WeaponProduct): HeroWeaponClass | undefined {
  const itemId = product.itemIds[0];

  return itemId ? getHeroItemWeaponClass(HERO_ITEM_CATALOG[itemId]) : undefined;
}

function createSelectedMeta(
  productName: string,
  rarity: ShopItemRarity,
  statLabel: string,
  statIconUrl: string,
  stat: number,
  currentStat: number,
  options: SelectedMetaOptions = {},
): HTMLElement {
  const meta = document.createElement("div");
  const nameNode = document.createElement("span");
  const nameText = document.createElement("span");
  const rarityNode = document.createElement("span");
  const statNode = document.createElement("span");
  const statRow = document.createElement("span");
  const statIcon = document.createElement("img");
  const statValueNode = document.createElement("span");
  const diffNode = document.createElement("span");
  const comparesStat = options.compareStat ?? true;
  const diff = stat - currentStat;
  const perkDefinition = options.weaponClass ? WEAPON_PERK_DEFINITIONS[options.weaponClass] : undefined;

  meta.className = "armory-shop__selected-meta";
  nameNode.className = "armory-shop__selected-name";
  nameText.className = "armory-shop__selected-name-text";
  nameText.textContent = productName;
  rarityNode.className = "armory-shop__selected-rarity";
  rarityNode.textContent = getShopRarityLabel(rarity);
  nameNode.append(nameText, rarityNode);
  if (options.unitLabel) {
    const unitNode = document.createElement("span");

    unitNode.className = "armory-shop__selected-unit";
    unitNode.textContent = options.unitLabel;
    nameNode.append(unitNode);
  }
  statRow.className = "weapon-shop__selected-stat-row";
  statNode.className = "armory-shop__selected-stat";
  statNode.setAttribute("aria-label", `${statLabel} ${stat}`);
  statIcon.className = "armory-shop__selected-stat-icon";
  statIcon.src = statIconUrl;
  statIcon.alt = "";
  statIcon.decoding = "async";
  statIcon.draggable = false;
  statValueNode.className = "armory-shop__selected-stat-value";
  statValueNode.textContent = String(stat);
  statNode.append(statIcon, statValueNode);
  statRow.append(statNode);
  if (comparesStat) {
    diffNode.className = [
      "equipment-item-card__diff",
      "armory-shop__selected-diff",
      diff > 0 ? "equipment-item-card__diff--better" : "",
      diff < 0 ? "equipment-item-card__diff--worse" : "",
      diff === 0 ? "equipment-item-card__diff--equal" : "",
      diff > 0 ? "armory-shop__selected-diff--better" : "",
      diff < 0 ? "armory-shop__selected-diff--worse" : "",
      diff === 0 ? "armory-shop__selected-diff--equal" : "",
    ]
      .filter(Boolean)
      .join(" ");
    diffNode.textContent = diff > 0 ? `+${diff}` : String(diff);
    diffNode.setAttribute("aria-label", diff > 0 ? `Better by ${diff}` : diff < 0 ? `Worse by ${Math.abs(diff)}` : "Same stat");
    statRow.append(diffNode);
  }
  if (perkDefinition) {
    statRow.append(createWeaponPerkButton(perkDefinition));
  }
  meta.append(nameNode, statRow);

  return meta;
}

function createWeaponPerkButton(definition: WeaponPerkDefinition): HTMLElement {
  const wrapper = document.createElement("span");
  const button = document.createElement("button");
  const popover = document.createElement("span");
  const title = document.createElement("strong");
  const body = document.createElement("span");
  const popoverId = `weapon-shop-perk-${definition.chipLabel.toLowerCase()}`;

  wrapper.className = "weapon-shop__selected-perk-wrap";
  button.className = "weapon-shop__selected-perk";
  button.type = "button";
  button.textContent = definition.chipLabel;
  button.setAttribute("aria-label", `Show ${definition.chipLabel} weapon bonus`);
  button.setAttribute("aria-controls", popoverId);
  button.setAttribute("aria-expanded", "false");
  popover.id = popoverId;
  popover.className = "weapon-shop__selected-perk-popover";
  popover.setAttribute("role", "tooltip");
  popover.hidden = true;
  title.className = "weapon-shop__selected-perk-title";
  title.textContent = definition.title;
  body.className = "weapon-shop__selected-perk-body";
  definition.lines.forEach((line) => {
    const lineNode = document.createElement("span");

    lineNode.className = "weapon-shop__selected-perk-line";
    lineNode.textContent = line;
    body.append(lineNode);
  });
  popover.append(title, body);

  const closePopover = () => {
    popover.hidden = true;
    button.setAttribute("aria-expanded", "false");
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const shouldOpen = popover.hidden;

    popover.hidden = !shouldOpen;
    button.setAttribute("aria-expanded", String(shouldOpen));
  });
  button.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || popover.hidden) {
      return;
    }

    event.stopPropagation();
    closePopover();
  });
  wrapper.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!wrapper.contains(document.activeElement)) {
        closePopover();
      }
    }, 0);
  });
  wrapper.append(button, popover);

  return wrapper;
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
