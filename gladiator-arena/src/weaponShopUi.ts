import { HERO_ITEM_CATALOG, TRAINING_WEAPON_ID, type HeroItemId, type HeroState } from "./hero";

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
  products: WeaponProduct[];
  emptyText?: string;
}

interface WeaponShopOptions {
  getHero: () => HeroState;
  mountPreview: (parent: HTMLElement) => () => void;
  onBuy: (product: WeaponProduct) => void;
}

const WEAPON_CATEGORIES: WeaponCategory[] = [
  {
    id: "swords",
    name: "Мечи",
    products: [{ id: "training-sword", name: "Учебный меч", price: 0, itemIds: [TRAINING_WEAPON_ID] }],
  },
  {
    id: "axes",
    name: "Топоры",
    products: [],
    emptyText: "Топоры скоро",
  },
  {
    id: "bows",
    name: "Луки",
    products: [],
    emptyText: "Луки скоро",
  },
];

export function mountWeaponShop(root: HTMLElement, options: WeaponShopOptions): WeaponShopApi {
  let selectedCategoryId: string | undefined;

  const shop = document.createElement("section");
  shop.className = "armory-shop weapon-shop";
  shop.hidden = true;
  shop.setAttribute("aria-label", "Оружейник");

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
  panel.append(previewShell, menu);
  shop.append(panel);
  root.append(shop);
  options.mountPreview(preview);

  function open(): void {
    selectedCategoryId = undefined;
    shop.hidden = false;
    render();
  }

  function close(): void {
    shop.hidden = true;
  }

  function render(): void {
    const hero = options.getHero();
    const selectedCategory = WEAPON_CATEGORIES.find((category) => category.id === selectedCategoryId);

    title.textContent = selectedCategory ? selectedCategory.name : "Оружейник";
    gold.textContent = `GOLD ${hero.gold}`;
    content.replaceChildren();
    content.classList.toggle("armory-shop__content--categories", !selectedCategory);
    content.classList.toggle("armory-shop__content--products", Boolean(selectedCategory));

    if (!selectedCategory) {
      WEAPON_CATEGORIES.forEach((category) => {
        content.append(createCategoryButton(category));
      });
      return;
    }

    if (selectedCategory.products.length === 0) {
      content.append(createEmptyState(selectedCategory.emptyText ?? "Пока нет товара"));
      return;
    }

    selectedCategory.products.forEach((product) => {
      content.append(createProductButton(product, hero));
    });
  }

  function createCategoryButton(category: WeaponCategory): HTMLButtonElement {
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

  function createProductButton(product: WeaponProduct, hero: HeroState): HTMLButtonElement {
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

function createEmptyState(text: string): HTMLButtonElement {
  const button = document.createElement("button");

  button.className = "armory-shop__option armory-shop__option--empty";
  button.type = "button";
  button.disabled = true;
  button.textContent = text;

  return button;
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
