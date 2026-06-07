import {
  HERO_ITEM_CATALOG,
  STARTER_BACK_BOOT_ID,
  STARTER_BACK_GAUNTLET_ID,
  STARTER_BACK_GREAVE_ID,
  STARTER_BACK_SHINGUARD_ID,
  STARTER_BACK_SHOULDERGUARD_ID,
  STARTER_BREASTPLATE_ID,
  STARTER_FRONT_BOOT_ID,
  STARTER_FRONT_GAUNTLET_ID,
  STARTER_FRONT_GREAVE_ID,
  STARTER_FRONT_SHINGUARD_ID,
  STARTER_FRONT_SHOULDERGUARD_ID,
  STARTER_HELMET_ID,
  type HeroItemId,
  type HeroState,
} from "./hero";

export interface ArmoryProduct {
  id: string;
  name: string;
  price: number;
  itemIds: HeroItemId[];
}

export interface ArmoryShopApi {
  open: () => void;
  close: () => void;
  render: () => void;
}

interface ArmoryCategory {
  id: string;
  name: string;
  products: ArmoryProduct[];
}

interface ArmoryShopOptions {
  getHero: () => HeroState;
  mountPreview?: (parent: HTMLElement) => () => void;
  onBuy: (product: ArmoryProduct) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

const ARMORY_CATEGORIES: ArmoryCategory[] = [
  {
    id: "head",
    name: "Голова",
    products: [{ id: "starter-helmet", name: "Учебный шлем", price: 0, itemIds: [STARTER_HELMET_ID] }],
  },
  {
    id: "chest",
    name: "Грудь",
    products: [{ id: "starter-breastplate", name: "Учебный нагрудник", price: 0, itemIds: [STARTER_BREASTPLATE_ID] }],
  },
  {
    id: "shoulders",
    name: "Плечи",
    products: [
      {
        id: "starter-shoulderguards",
        name: "Учебные наплечники",
        price: 0,
        itemIds: [STARTER_BACK_SHOULDERGUARD_ID, STARTER_FRONT_SHOULDERGUARD_ID],
      },
    ],
  },
  {
    id: "other",
    name: "Прочее",
    products: [
      {
        id: "starter-gauntlets",
        name: "Учебные перчатки",
        price: 0,
        itemIds: [STARTER_BACK_GAUNTLET_ID, STARTER_FRONT_GAUNTLET_ID],
      },
      {
        id: "starter-greaves",
        name: "Учебные поножи",
        price: 0,
        itemIds: [STARTER_BACK_GREAVE_ID, STARTER_FRONT_GREAVE_ID],
      },
      {
        id: "starter-shinguards",
        name: "Учебные щитки",
        price: 0,
        itemIds: [STARTER_BACK_SHINGUARD_ID, STARTER_FRONT_SHINGUARD_ID],
      },
      {
        id: "starter-boots",
        name: "Учебные сапоги",
        price: 0,
        itemIds: [STARTER_BACK_BOOT_ID, STARTER_FRONT_BOOT_ID],
      },
    ],
  },
];

export function mountArmoryShop(root: HTMLElement, options: ArmoryShopOptions): ArmoryShopApi {
  let selectedCategoryId: string | undefined;
  let unmountPreview: (() => void) | undefined;
  const usesCityHeroPreview = !options.mountPreview;

  const shop = document.createElement("section");
  shop.className = usesCityHeroPreview ? "armory-shop armory-shop--city-mode" : "armory-shop";
  shop.hidden = true;
  shop.setAttribute("aria-label", "Бронник");

  const panel = document.createElement("div");
  panel.className = "armory-shop__panel";

  const previewShell = document.createElement("div");
  previewShell.className = "armory-shop__preview-shell";

  const preview = document.createElement("div");
  preview.className = "armory-shop__preview";
  previewShell.append(preview);

  const menu = document.createElement("div");
  menu.className = "armory-shop__menu";

  const header = document.createElement("div");
  header.className = "armory-shop__header";

  const title = document.createElement("h2");
  title.className = "armory-shop__title";

  const gold = document.createElement("span");
  gold.className = "armory-shop__gold";

  const content = document.createElement("div");
  content.className = "armory-shop__content";

  const back = document.createElement("button");
  back.className = "armory-shop__back";
  back.type = "button";
  back.textContent = "Назад";
  back.addEventListener("click", () => {
    if (selectedCategoryId) {
      selectedCategoryId = undefined;
      render();
      return;
    }

    close();
  });

  header.append(title, gold);
  menu.append(header, content, back);
  if (options.mountPreview) {
    panel.append(previewShell);
  }
  panel.append(menu);
  shop.append(panel);
  root.append(shop);

  function open(): void {
    selectedCategoryId = undefined;
    if (usesCityHeroPreview) {
      root.classList.add("city-menu--armory-open");
    }
    options.onOpen?.();
    shop.hidden = false;
    ensurePreviewMounted();
    render();
  }

  function close(): void {
    if (usesCityHeroPreview) {
      root.classList.remove("city-menu--armory-open");
    }
    options.onClose?.();
    shop.hidden = true;
    unmountPreview?.();
    unmountPreview = undefined;
  }

  function render(): void {
    const hero = options.getHero();
    const selectedCategory = ARMORY_CATEGORIES.find((category) => category.id === selectedCategoryId);

    title.textContent = selectedCategory ? selectedCategory.name : "Бронник";
    gold.textContent = `GOLD ${hero.gold}`;
    content.replaceChildren();
    content.classList.toggle("armory-shop__content--categories", !selectedCategory);
    content.classList.toggle("armory-shop__content--products", Boolean(selectedCategory));

    if (!selectedCategory) {
      ARMORY_CATEGORIES.forEach((category) => {
        content.append(createCategoryButton(category));
      });
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

  function createCategoryButton(category: ArmoryCategory): HTMLButtonElement {
    const button = document.createElement("button");

    button.className = "armory-shop__option";
    button.type = "button";
    button.textContent = category.name;
    button.addEventListener("click", () => {
      selectedCategoryId = category.id;
      render();
    });

    return button;
  }

  function createProductButton(product: ArmoryProduct, hero: HeroState): HTMLButtonElement {
    const button = document.createElement("button");
    const isOwned = product.itemIds.every((itemId) => hero.inventory.some((entry) => entry.itemId === itemId && entry.quantity > 0));
    const isEquipped = product.itemIds.every((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      return hero.equipment[item.equipmentSlot] === itemId;
    });
    const canBuy = hero.gold >= product.price;

    button.className = "armory-shop__option armory-shop__option--product";
    button.type = "button";
    button.disabled = isEquipped || !canBuy;
    button.innerHTML = `
      <span class="armory-shop__product-name">${product.name}</span>
      <span class="armory-shop__product-meta">${getProductActionLabel(isOwned, isEquipped, canBuy)} · ${product.price} GOLD</span>
    `;
    button.addEventListener("click", () => {
      options.onBuy(product);
      render();
    });

    return button;
  }

  return { open, close, render };
}

function getProductActionLabel(isOwned: boolean, isEquipped: boolean, canBuy: boolean): string {
  if (isEquipped) {
    return "Надето";
  }

  if (isOwned) {
    return "Надеть";
  }

  return canBuy ? "Купить" : "Не хватает золота";
}
