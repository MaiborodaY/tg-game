import { HERO_ITEM_CATALOG, TRAINING_WEAPON_ID, type HeroItemId, type HeroState } from "./hero";
import { GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";
import { getShopProductIconUrl } from "./shopItemIcons";

export interface WeaponProduct {
  id: string;
  name: string;
  price: number;
  itemIds: HeroItemId[];
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

  const content = document.createElement("div");
  content.className = "armory-shop__content";

  const back = document.createElement("button");
  back.className = "armory-shop__back";
  back.type = "button";
  back.textContent = "Back";
  back.addEventListener("click", () => {
    if (previewProduct) {
      clearProductPreview();
      render();
      return;
    }

    close();
  });

  header.append(gold, title, level);
  tray.append(header, content, back);
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
    content.classList.toggle("armory-shop__content--categories", false);
    content.classList.toggle("armory-shop__content--products", !previewProduct);
    content.classList.toggle("armory-shop__content--confirm", Boolean(previewProduct));
    back.hidden = Boolean(previewProduct);

    WEAPON_CATEGORIES.forEach((category) => {
      categoryRail.append(createCategoryButton(category, category.id === selectedCategory.id));
    });

    if (previewProduct) {
      content.append(createPreviewBuyButton(previewProduct, hero), createPreviewBackButton());
      return;
    }

    if (selectedCategory.products.length === 0) {
      content.append(createEmptyState(selectedCategory.emptyText ?? "No items yet"));
      return;
    }

    selectedCategory.products.forEach((product) => {
      content.append(createProductButton(product, hero));
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

  function createProductButton(product: WeaponProduct, hero: HeroState): HTMLButtonElement {
    const button = document.createElement("button");
    const isEquipped = product.itemIds.every((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      return hero.equipment[item.equipmentSlot] === itemId;
    });
    const iconUrl = getShopProductIconUrl(product.itemIds);

    button.className = "armory-shop__option armory-shop__option--product";
    button.type = "button";
    button.disabled = isEquipped;
    button.title = product.name;
    button.setAttribute("aria-label", `${product.name}, ${product.price} GOLD`);
    button.innerHTML = iconUrl
      ? `
        <img class="armory-shop__product-icon" src="${iconUrl}" alt="" draggable="false" />
        <span class="armory-shop__product-price">${product.price} GOLD</span>
      `
      : `<span class="armory-shop__product-price">${product.price} GOLD</span>`;
    button.addEventListener("click", () => {
      previewProduct = product;
      options.onPreview?.(product);
      render();
    });

    return button;
  }

  function createPreviewBuyButton(product: WeaponProduct, hero: HeroState): HTMLButtonElement {
    const button = document.createElement("button");
    const isEquipped = product.itemIds.every((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      return hero.equipment[item.equipmentSlot] === itemId;
    });
    const canBuy = hero.gold >= product.price;

    button.className = "armory-shop__option armory-shop__confirm-button armory-shop__confirm-button--buy";
    button.type = "button";
    button.disabled = isEquipped || !canBuy;
    button.textContent = `Buy - ${product.price} GOLD`;
    button.addEventListener("click", () => {
      previewProduct = undefined;
      options.onBuy(product);
      render();
    });

    return button;
  }

  function createPreviewBackButton(): HTMLButtonElement {
    const button = document.createElement("button");

    button.className = "armory-shop__option armory-shop__confirm-button armory-shop__confirm-button--back";
    button.type = "button";
    button.textContent = "Back";
    button.addEventListener("click", () => {
      clearProductPreview();
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

function createEmptyState(text: string): HTMLButtonElement {
  const button = document.createElement("button");

  button.className = "armory-shop__option armory-shop__option--empty";
  button.type = "button";
  button.disabled = true;
  button.textContent = text;

  return button;
}
