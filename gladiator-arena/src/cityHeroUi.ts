import type { ArenaDebugTuning } from "./debugTuning";
import {
  DAMAGE_BLOCK_ICON_ASSET_URL,
  SHOP_CATEGORY_AXE_ICON_ASSET_URL,
  SHOP_CATEGORY_ARMS_ICON_ASSET_URL,
  SHOP_CATEGORY_BOW_ICON_ASSET_URL,
  SHOP_CATEGORY_BODY_ICON_ASSET_URL,
  SHOP_CATEGORY_HEAD_ICON_ASSET_URL,
  SHOP_CATEGORY_LEGS_ICON_ASSET_URL,
  SHOP_CATEGORY_MACE_ICON_ASSET_URL,
  SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL,
  SHOP_CATEGORY_SPEAR_ICON_ASSET_URL,
  SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
} from "./assets";
import { getGeneratedArmoryProductsForSlots, type ArmoryProduct } from "./armoryShopUi";
import { MAX_HP, MAX_STAMINA, actions } from "./combat";
import { GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";
import {
  areHeroItemsEquipped,
  areHeroItemsOwned,
  deriveHeroStats,
  getHeroItemWeaponClass,
  getHeroEquipmentStatBonuses,
  HERO_ITEM_CATALOG,
  type HeroAttributeKey,
  type HeroEquipmentSlotKey,
  type HeroItemId,
  type HeroState,
} from "./hero";
import { getShopProductIconUrl } from "./shopItemIcons";
import { getShopProductDisplayName, getShopProductRarity, getShopProductStat, getShopRarityLabel, type ShopItemRarity } from "./shopPresentation";

const HERO_ATTRIBUTE_KEYS: readonly HeroAttributeKey[] = ["strength", "agility", "vitality"];
const ATTRIBUTE_CTRL_ALLOCATE_AMOUNT = 10;
const ATTRIBUTE_HOLD_REPEAT_DELAY_MS = 360;
const ATTRIBUTE_HOLD_REPEAT_INTERVAL_MS = 95;
const HERO_PROFILE_BASE_REST_HP = actions.rest.heal ?? 0;
const HERO_PROFILE_BASE_REST_STAMINA = actions.rest.restore ?? 0;

type CityHeroProfileStatKey = "damage" | "hp" | "stamina" | "movement" | "recovery";
type CityEquipmentCategoryId = "swords" | "bows" | "shurikens" | "axes" | "maces" | "spears" | "head" | "body" | "arms" | "legs";
type CityEquipmentCategorySide = "weapon" | "armor";

interface CityEquipmentCategory {
  id: CityEquipmentCategoryId;
  label: string;
  side: CityEquipmentCategorySide;
  iconUrl?: string;
  slots?: readonly HeroEquipmentSlotKey[];
}

interface CityEquipmentProduct {
  id: string;
  name: string;
  itemIds: HeroItemId[];
}

interface CityEquipmentMenuElements {
  root: HTMLElement;
  closeButton: HTMLButtonElement | null;
  selectedOrb: HTMLElement | null;
  selectedIcon: HTMLElement | null;
  selectedName: HTMLElement | null;
  selectedRarity: HTMLElement | null;
  selectedStat: HTMLElement | null;
  weaponCategories: HTMLElement | null;
  armorCategories: HTMLElement | null;
  productGrid: HTMLElement | null;
}

const CITY_EQUIPMENT_RARITY_SORT_ORDER: Record<ShopItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
  unique: 6,
};

const CITY_EQUIPMENT_WEAPON_CATEGORIES: readonly CityEquipmentCategory[] = [
  { id: "swords", label: "Swords", side: "weapon", iconUrl: SHOP_CATEGORY_SWORD_ICON_ASSET_URL },
  { id: "bows", label: "Bows", side: "weapon", iconUrl: SHOP_CATEGORY_BOW_ICON_ASSET_URL },
  { id: "shurikens", label: "Shurikens", side: "weapon", iconUrl: SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL },
  { id: "axes", label: "Axes", side: "weapon", iconUrl: SHOP_CATEGORY_AXE_ICON_ASSET_URL },
  { id: "maces", label: "Maces", side: "weapon", iconUrl: SHOP_CATEGORY_MACE_ICON_ASSET_URL },
  { id: "spears", label: "Spears", side: "weapon", iconUrl: SHOP_CATEGORY_SPEAR_ICON_ASSET_URL },
];

const CITY_EQUIPMENT_ARMOR_CATEGORIES: readonly CityEquipmentCategory[] = [
  { id: "head", label: "Head", side: "armor", iconUrl: SHOP_CATEGORY_HEAD_ICON_ASSET_URL, slots: ["helmet"] },
  { id: "body", label: "Body", side: "armor", iconUrl: SHOP_CATEGORY_BODY_ICON_ASSET_URL, slots: ["breastplate"] },
  {
    id: "arms",
    label: "Arms",
    side: "armor",
    iconUrl: SHOP_CATEGORY_ARMS_ICON_ASSET_URL,
    slots: ["backShoulderguard", "frontShoulderguard", "backWrist", "frontWrist", "backGlove", "frontGlove"],
  },
  {
    id: "legs",
    label: "Legs",
    side: "armor",
    iconUrl: SHOP_CATEGORY_LEGS_ICON_ASSET_URL,
    slots: ["backGreave", "frontGreave", "backShinguard", "frontShinguard", "backBoot", "frontBoot"],
  },
];

const CITY_EQUIPMENT_CATEGORIES: readonly CityEquipmentCategory[] = [...CITY_EQUIPMENT_WEAPON_CATEGORIES, ...CITY_EQUIPMENT_ARMOR_CATEGORIES];

const HERO_PROFILE_EQUIPMENT_GROUPS: readonly {
  label: string;
  icon: string;
  modifier: string;
  categoryId: CityEquipmentCategoryId;
  slots: readonly HeroEquipmentSlotKey[];
}[] = [
  { label: "Head", icon: "H", modifier: "head", categoryId: "head", slots: ["helmet"] },
  { label: "Body", icon: "B", modifier: "body", categoryId: "body", slots: ["breastplate"] },
  {
    label: "Arms",
    icon: "A",
    modifier: "arms",
    categoryId: "arms",
    slots: ["backShoulderguard", "frontShoulderguard", "backWrist", "frontWrist", "backGlove", "frontGlove"],
  },
  {
    label: "Legs",
    icon: "L",
    modifier: "legs",
    categoryId: "legs",
    slots: ["backGreave", "frontGreave", "backShinguard", "frontShinguard", "backBoot", "frontBoot"],
  },
  { label: "Weapon", icon: "W", modifier: "weapon", categoryId: "swords", slots: ["weaponMain"] },
];

export interface CityHeroWidgetRefs {
  widget: HTMLElement | null;
  portrait: HTMLElement | null;
  portraitButton: HTMLButtonElement | null;
  name: HTMLElement | null;
  level: HTMLElement | null;
  gold: HTMLElement | null;
  xpFill: HTMLElement | null;
  xpText: HTMLElement | null;
  skillPoints: HTMLElement | null;
  profile: HTMLElement | null;
  profilePortrait: HTMLElement | null;
  profileName: HTMLElement | null;
  profileGold: HTMLElement | null;
  profileLevel: HTMLElement | null;
  profileXpFill: HTMLElement | null;
  profileXpText: HTMLElement | null;
  profileEquipment: HTMLElement | null;
  profileStats: Record<CityHeroProfileStatKey, HTMLElement | null>;
  attributeValues: Record<HeroAttributeKey, HTMLElement | null>;
  attributeButtons: Record<HeroAttributeKey, HTMLButtonElement | null>;
}

export function getCityHeroWidgetRefs(root: ParentNode = document): CityHeroWidgetRefs {
  return {
    widget: root.querySelector<HTMLElement>("#heroWidget"),
    portrait: root.querySelector<HTMLElement>("#heroPortrait"),
    portraitButton: root.querySelector<HTMLButtonElement>("#heroPortraitButton"),
    name: root.querySelector<HTMLElement>("#heroInfoName"),
    level: root.querySelector<HTMLElement>("#heroInfoLevel"),
    gold: root.querySelector<HTMLElement>("#heroInfoGold"),
    xpFill: root.querySelector<HTMLElement>("#heroInfoXpFill"),
    xpText: root.querySelector<HTMLElement>("#heroInfoXpText"),
    skillPoints: root.querySelector<HTMLElement>("#heroProfileSkillPoints"),
    profile: root.querySelector<HTMLElement>("#heroProfile"),
    profilePortrait: root.querySelector<HTMLElement>("#heroProfilePortrait"),
    profileName: root.querySelector<HTMLElement>("#heroProfileName"),
    profileGold: root.querySelector<HTMLElement>("#heroProfileGold"),
    profileLevel: root.querySelector<HTMLElement>("#heroProfileLevel"),
    profileXpFill: root.querySelector<HTMLElement>("#heroProfileXpFill"),
    profileXpText: root.querySelector<HTMLElement>("#heroProfileXpText"),
    profileEquipment: root.querySelector<HTMLElement>("[data-hero-profile-equipment]"),
    profileStats: {
      damage: root.querySelector<HTMLElement>('[data-hero-profile-stat="damage"]'),
      hp: root.querySelector<HTMLElement>('[data-hero-profile-stat="hp"]'),
      stamina: root.querySelector<HTMLElement>('[data-hero-profile-stat="stamina"]'),
      movement: root.querySelector<HTMLElement>('[data-hero-profile-stat="movement"]'),
      recovery: root.querySelector<HTMLElement>('[data-hero-profile-stat="recovery"]'),
    },
    attributeValues: {
      strength: root.querySelector<HTMLElement>('[data-hero-attribute-value="strength"]'),
      agility: root.querySelector<HTMLElement>('[data-hero-attribute-value="agility"]'),
      vitality: root.querySelector<HTMLElement>('[data-hero-attribute-value="vitality"]'),
    },
    attributeButtons: {
      strength: root.querySelector<HTMLButtonElement>('[data-hero-attribute-button="strength"]'),
      agility: root.querySelector<HTMLButtonElement>('[data-hero-attribute-button="agility"]'),
      vitality: root.querySelector<HTMLButtonElement>('[data-hero-attribute-button="vitality"]'),
    },
  };
}

export function syncCityHeroWidgetPosition(
  refs: CityHeroWidgetRefs,
  tuning: Pick<ArenaDebugTuning, "heroPortraitButtonX" | "heroPortraitButtonY" | "heroPortraitButtonScale">,
): void {
  const target = refs.widget ?? refs.portraitButton;

  if (!target) {
    return;
  }

  target.style.setProperty("--hero-portrait-button-x", `${tuning.heroPortraitButtonX}px`);
  target.style.setProperty("--hero-portrait-button-y", `${tuning.heroPortraitButtonY}px`);
  target.style.setProperty("--hero-portrait-button-scale", `${tuning.heroPortraitButtonScale}`);
}

export function renderCityHeroInfo(refs: CityHeroWidgetRefs, hero: HeroState): void {
  const xpToNextLevel = Math.max(1, hero.xpToNextLevel);
  const xpRatio = Math.max(0, Math.min(1, hero.xp / xpToNextLevel));

  if (refs.name) {
    refs.name.textContent = hero.name.toUpperCase();
  }

  if (refs.level) {
    refs.level.textContent = `LVL ${hero.level}`;
  }

  if (refs.gold) {
    refs.gold.textContent = String(hero.gold);
  }

  if (refs.xpFill) {
    refs.xpFill.style.width = `${xpRatio * 100}%`;
  }

  if (refs.xpText) {
    refs.xpText.textContent = `${hero.xp}/${xpToNextLevel}`;
  }

  if (refs.profileName) {
    refs.profileName.textContent = hero.name.toUpperCase();
  }

  if (refs.profileLevel) {
    const label = document.createElement("span");
    const value = document.createElement("strong");

    label.textContent = "LVL";
    value.textContent = String(hero.level);
    refs.profileLevel.replaceChildren(label, value);
  }

  if (refs.profileGold) {
    refs.profileGold.textContent = String(hero.gold);
  }

  if (refs.profileXpFill) {
    refs.profileXpFill.style.width = `${xpRatio * 100}%`;
  }

  if (refs.profileXpText) {
    refs.profileXpText.textContent = `${hero.xp}/${xpToNextLevel}`;
  }

  refs.portraitButton?.classList.toggle("city-menu__portrait-button--has-points", hero.skillPoints > 0);

  if (refs.skillPoints) {
    refs.skillPoints.textContent = hero.skillPoints > 0 ? `${hero.skillPoints} POINTS READY` : "NO POINTS";
    refs.skillPoints.classList.toggle("city-profile__points--ready", hero.skillPoints > 0);
  }

  renderCityHeroProfileEquipment(refs, hero);

  HERO_ATTRIBUTE_KEYS.forEach((attribute) => {
    const value = refs.attributeValues[attribute];
    const button = refs.attributeButtons[attribute];

    if (value) {
      value.textContent = String(hero.baseStats[attribute]);
    }

    if (button) {
      button.disabled = hero.skillPoints <= 0;
      button.hidden = false;
    }
  });

  renderCityHeroProfileStats(refs, hero);
}

export interface CityHeroProfileApi {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

export function mountCityHeroProfile(refs: CityHeroWidgetRefs): CityHeroProfileApi {
  const { profile, portraitButton } = refs;
  const cityMenu = profile?.closest<HTMLElement>(".city-menu") ?? null;
  const profileCloseButtons = Array.from(profile?.querySelectorAll<HTMLButtonElement>("[data-hero-profile-close]") ?? []);
  let isProfileOpen = false;

  const setOpen = (nextOpen: boolean) => {
    if (!profile) {
      return;
    }

    isProfileOpen = nextOpen;
    profile.hidden = !nextOpen;
    cityMenu?.classList.toggle("city-menu--profile-open", nextOpen);
    portraitButton?.setAttribute("aria-expanded", String(nextOpen));
    profile.dispatchEvent(new CustomEvent("city-profile-visibility", { detail: { open: nextOpen } }));
  };

  const open = () => setOpen(true);
  const close = () => setOpen(false);
  const toggle = () => setOpen(!isProfileOpen);
  const handlePortraitClick = (event: MouseEvent) => {
    event.preventDefault();
    toggle();
  };
  const handleProfileClick = (event: MouseEvent) => {
    if (event.target === profile) {
      close();
    }
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (profile?.querySelector(".city-equipment-menu:not([hidden])")) {
        return;
      }

      close();
    }
  };

  portraitButton?.setAttribute("aria-controls", "heroProfile");
  portraitButton?.setAttribute("aria-expanded", "false");
  portraitButton?.addEventListener("click", handlePortraitClick);
  profileCloseButtons.forEach((button) => button.addEventListener("click", close));
  profile?.addEventListener("click", handleProfileClick);
  document.addEventListener("keydown", handleKeyDown);

  return {
    open,
    close,
    toggle,
    isOpen: () => isProfileOpen,
    destroy: () => {
      close();
      portraitButton?.removeEventListener("click", handlePortraitClick);
      profileCloseButtons.forEach((button) => button.removeEventListener("click", close));
      profile?.removeEventListener("click", handleProfileClick);
      document.removeEventListener("keydown", handleKeyDown);
    },
  };
}

export interface CityHeroEquipmentMenuApi {
  open: (categoryId?: CityEquipmentCategoryId) => void;
  close: () => void;
  render: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

interface CityHeroEquipmentMenuOptions {
  getHero: () => HeroState;
  onEquip: (itemIds: readonly HeroItemId[]) => void;
}

export function mountCityHeroEquipmentMenu(refs: CityHeroWidgetRefs, options: CityHeroEquipmentMenuOptions): CityHeroEquipmentMenuApi {
  const { profile, profileEquipment } = refs;
  const menu = createCityEquipmentMenuElements();
  let isOpen = false;
  let activeCategoryId: CityEquipmentCategoryId = "head";
  let selectedProductId: string | undefined;

  profile?.append(menu.root);

  const setOpen = (nextOpen: boolean, categoryId = activeCategoryId) => {
    activeCategoryId = normalizeCityEquipmentCategoryId(categoryId);
    isOpen = nextOpen;
    menu.root.hidden = !nextOpen;
    profile?.classList.toggle("city-profile--equipment-menu-open", nextOpen);

    if (nextOpen) {
      selectedProductId = undefined;
      render();
    }
  };

  const open = (categoryId?: CityEquipmentCategoryId) => setOpen(true, categoryId ?? activeCategoryId);
  const close = () => setOpen(false);
  const handleProfileEquipmentClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("[data-hero-equipment-category]");

    if (!button || !profileEquipment?.contains(button)) {
      return;
    }

    event.preventDefault();
    open(normalizeCityEquipmentCategoryId(button.dataset.heroEquipmentCategory));
  };
  const handleCategoryClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("[data-city-equipment-category]");

    if (!button || !menu.root.contains(button)) {
      return;
    }

    event.preventDefault();
    activeCategoryId = normalizeCityEquipmentCategoryId(button.dataset.cityEquipmentCategory);
    selectedProductId = undefined;
    render();
  };
  const handleProductClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("[data-city-equipment-product]");

    if (!button || !menu.productGrid?.contains(button)) {
      return;
    }

    event.preventDefault();

    const product = getOwnedCityEquipmentProducts(options.getHero(), getCityEquipmentCategory(activeCategoryId)).find(
      (candidate) => candidate.id === button.dataset.cityEquipmentProduct,
    );

    if (!product) {
      return;
    }

    selectedProductId = product.id;
    options.onEquip(product.itemIds);
    render();
  };
  const handleProfileVisibility = (event: Event) => {
    const profileEvent = event as CustomEvent<{ open?: boolean }>;

    if (profileEvent.detail?.open === false) {
      close();
    }
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (isOpen && event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  profileEquipment?.addEventListener("click", handleProfileEquipmentClick);
  menu.root.addEventListener("click", handleCategoryClick);
  menu.productGrid?.addEventListener("click", handleProductClick);
  menu.closeButton?.addEventListener("click", close);
  profile?.addEventListener("city-profile-visibility", handleProfileVisibility);
  document.addEventListener("keydown", handleKeyDown);

  function render(): void {
    if (!isOpen) {
      return;
    }

    const hero = options.getHero();
    const category = getCityEquipmentCategory(activeCategoryId);
    const products = getOwnedCityEquipmentProducts(hero, category);
    const selectedProduct = getSelectedCityEquipmentProduct(hero, products, selectedProductId);

    selectedProductId = selectedProduct?.id;
    renderCityEquipmentSelected(menu, category, selectedProduct);
    renderCityEquipmentCategories(menu.weaponCategories, CITY_EQUIPMENT_WEAPON_CATEGORIES, activeCategoryId);
    renderCityEquipmentCategories(menu.armorCategories, CITY_EQUIPMENT_ARMOR_CATEGORIES, activeCategoryId);
    renderCityEquipmentProducts(menu.productGrid, category, products, selectedProduct, hero);
  }

  return {
    open,
    close,
    render,
    isOpen: () => isOpen,
    destroy: () => {
      close();
      profileEquipment?.removeEventListener("click", handleProfileEquipmentClick);
      menu.root.removeEventListener("click", handleCategoryClick);
      menu.productGrid?.removeEventListener("click", handleProductClick);
      menu.closeButton?.removeEventListener("click", close);
      profile?.removeEventListener("city-profile-visibility", handleProfileVisibility);
      document.removeEventListener("keydown", handleKeyDown);
      menu.root.remove();
    },
  };
}

export function mountCityHeroAttributeControls(refs: CityHeroWidgetRefs, onAllocate: (attribute: HeroAttributeKey, amount: number) => void): () => void {
  const cleanups = HERO_ATTRIBUTE_KEYS.flatMap((attribute) => {
    const button = refs.attributeButtons[attribute];

    if (!button) {
      return [];
    }

    let holdDelayId: number | undefined;
    let holdIntervalId: number | undefined;
    let suppressNextClick = false;

    const clearHoldRepeat = () => {
      if (holdDelayId !== undefined) {
        window.clearTimeout(holdDelayId);
        holdDelayId = undefined;
      }

      if (holdIntervalId !== undefined) {
        window.clearInterval(holdIntervalId);
        holdIntervalId = undefined;
      }
    };

    const allocate = (amount: number) => {
      if (!button.disabled) {
        onAllocate(attribute, amount);
      }
    };

    const getAllocateAmount = (event: MouseEvent | PointerEvent) => (event.ctrlKey ? ATTRIBUTE_CTRL_ALLOCATE_AMOUNT : 1);

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || button.disabled) {
        return;
      }

      const amount = getAllocateAmount(event);

      suppressNextClick = true;
      allocate(amount);
      clearHoldRepeat();
      try {
        button.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort; regular pointerup/cancel still clears the repeat.
      }
      holdDelayId = window.setTimeout(() => {
        allocate(amount);
        holdIntervalId = window.setInterval(() => allocate(amount), ATTRIBUTE_HOLD_REPEAT_INTERVAL_MS);
      }, ATTRIBUTE_HOLD_REPEAT_DELAY_MS);
    };

    const handleClick = (event: MouseEvent) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }

      allocate(getAllocateAmount(event));
    };

    button.addEventListener("pointerdown", handlePointerDown);
    button.addEventListener("pointerup", clearHoldRepeat);
    button.addEventListener("pointercancel", clearHoldRepeat);
    button.addEventListener("lostpointercapture", clearHoldRepeat);
    button.addEventListener("blur", clearHoldRepeat);
    button.addEventListener("click", handleClick);

    return [
      () => {
        clearHoldRepeat();
        button.removeEventListener("pointerdown", handlePointerDown);
        button.removeEventListener("pointerup", clearHoldRepeat);
        button.removeEventListener("pointercancel", clearHoldRepeat);
        button.removeEventListener("lostpointercapture", clearHoldRepeat);
        button.removeEventListener("blur", clearHoldRepeat);
        button.removeEventListener("click", handleClick);
      },
    ];
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function renderCityHeroProfileStats(refs: CityHeroWidgetRefs, hero: HeroState): void {
  const stats = deriveHeroStats(hero);
  const equipmentBonuses = getHeroEquipmentStatBonuses(hero.equipment);
  const attributeTotals = {
    strength: hero.baseStats.strength + equipmentBonuses.strength,
    agility: hero.baseStats.agility + equipmentBonuses.agility,
    vitality: hero.baseStats.vitality + equipmentBonuses.vitality,
  };

  setText(refs.profileStats.damage, `+${stats.damageBonus}`);
  setText(refs.profileStats.hp, String(MAX_HP));
  setText(refs.profileStats.stamina, String(MAX_STAMINA));
  setText(refs.profileStats.movement, formatMovementSpeedPercent(stats.movementDistanceBonus));
  renderProfileRecoveryStat(
    refs.profileStats.recovery,
    HERO_PROFILE_BASE_REST_HP + stats.restHpRestoreBonus,
    HERO_PROFILE_BASE_REST_STAMINA + stats.restStaminaRestoreBonus,
  );

  HERO_ATTRIBUTE_KEYS.forEach((attribute) => {
    const value = refs.attributeValues[attribute];

    if (value) {
      value.textContent = String(attributeTotals[attribute]);
    }
  });
}

function renderCityHeroProfileEquipment(refs: CityHeroWidgetRefs, hero: HeroState): void {
  const equipmentHost = refs.profileEquipment;

  if (!equipmentHost) {
    return;
  }

  equipmentHost.replaceChildren();

  HERO_PROFILE_EQUIPMENT_GROUPS.forEach((group) => {
    const itemIds = group.slots.flatMap((slotKey): HeroItemId[] => {
      const itemId = hero.equipment[slotKey];

      return itemId ? [itemId] : [];
    });
    const items = itemIds.flatMap((itemId) => {
      const item = HERO_ITEM_CATALOG[itemId];

      return item ? [item] : [];
    });
    const iconUrl = getShopProductIconUrl(itemIds);
    const rarity = itemIds.length > 0 ? getShopProductRarity(itemIds) : "empty";
    const card = document.createElement("button");
    const icon = document.createElement("span");

    card.type = "button";
    card.className = [
      "city-profile__equipment-card",
      `city-profile__equipment-card--${group.modifier}`,
      `city-profile__equipment-card--${rarity}`,
      rarity !== "empty" ? `armory-shop__option--rarity-${rarity}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    card.title = items.length > 0 ? `${group.label}: ${items.map((item) => getShopProductDisplayName(item.name)).join(", ")}` : `${group.label}: empty`;
    card.setAttribute("aria-label", card.title);
    card.dataset.heroEquipmentCategory = getProfileEquipmentCategoryId(group, hero.equipment);
    icon.className = "city-profile__equipment-icon";

    if (iconUrl) {
      icon.style.backgroundImage = `url("${iconUrl}")`;
    } else {
      icon.textContent = group.icon;
    }

    card.append(icon);
    equipmentHost.append(card);
  });
}

function createCityEquipmentMenuElements(): CityEquipmentMenuElements {
  const root = document.createElement("section");

  root.className = "city-equipment-menu";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Equipment");
  root.innerHTML = `
    <div class="city-equipment-menu__panel">
      <button class="city-equipment-menu__close" type="button" aria-label="Close equipment">x</button>
      <div class="city-equipment-menu__title">EQUIPMENT</div>
      <div class="city-equipment-menu__selected">
        <div class="city-equipment-menu__selected-copy">
          <strong class="city-equipment-menu__selected-name"></strong>
          <span class="city-equipment-menu__selected-stat"></span>
        </div>
        <div class="city-equipment-menu__selected-showcase">
          <div class="city-equipment-menu__selected-orb" aria-hidden="true">
            <span class="city-equipment-menu__selected-icon"></span>
          </div>
          <span class="city-equipment-menu__selected-rarity"></span>
        </div>
      </div>
      <div class="city-equipment-menu__tray">
        <div class="city-equipment-menu__categories city-equipment-menu__categories--weapon" aria-label="Weapon categories"></div>
        <div class="city-equipment-menu__products" aria-label="Owned equipment"></div>
        <div class="city-equipment-menu__categories city-equipment-menu__categories--armor" aria-label="Armor categories"></div>
      </div>
    </div>
  `;

  return {
    root,
    closeButton: root.querySelector<HTMLButtonElement>(".city-equipment-menu__close"),
    selectedOrb: root.querySelector<HTMLElement>(".city-equipment-menu__selected-orb"),
    selectedIcon: root.querySelector<HTMLElement>(".city-equipment-menu__selected-icon"),
    selectedName: root.querySelector<HTMLElement>(".city-equipment-menu__selected-name"),
    selectedRarity: root.querySelector<HTMLElement>(".city-equipment-menu__selected-rarity"),
    selectedStat: root.querySelector<HTMLElement>(".city-equipment-menu__selected-stat"),
    weaponCategories: root.querySelector<HTMLElement>(".city-equipment-menu__categories--weapon"),
    armorCategories: root.querySelector<HTMLElement>(".city-equipment-menu__categories--armor"),
    productGrid: root.querySelector<HTMLElement>(".city-equipment-menu__products"),
  };
}

function renderCityEquipmentSelected(
  menu: CityEquipmentMenuElements,
  category: CityEquipmentCategory,
  product: CityEquipmentProduct | undefined,
): void {
  const rarity = product ? getShopProductRarity(product.itemIds) : undefined;
  const iconUrl = product ? getShopProductIconUrl(product.itemIds) : getCityEquipmentCategoryIconUrl(category);
  const statKind = category.side === "weapon" ? "damage" : "armor";
  const statLabel = category.side === "weapon" ? "DAMAGE" : "ARMOR";
  const statValue = product ? getShopProductStat(product.itemIds, statKind) : 0;

  if (menu.selectedOrb) {
    menu.selectedOrb.className = [
      "city-equipment-menu__selected-orb",
      rarity ? `armory-shop__option--rarity-${rarity}` : "city-equipment-menu__selected-orb--empty",
    ].join(" ");
  }

  if (menu.selectedIcon) {
    menu.selectedIcon.style.backgroundImage = iconUrl ? `url("${iconUrl}")` : "";
    menu.selectedIcon.textContent = iconUrl ? "" : category.label.slice(0, 1);
  }

  setText(menu.selectedName, product ? getShopProductDisplayName(product.name).toUpperCase() : category.label.toUpperCase());
  if (menu.selectedRarity) {
    menu.selectedRarity.className = [
      "city-equipment-menu__selected-rarity",
      rarity ? `armory-shop__option--rarity-${rarity}` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }
  setText(menu.selectedRarity, rarity ? getShopRarityLabel(rarity).toUpperCase() : "NO OWNED ITEMS");
  if (menu.selectedStat) {
    menu.selectedStat.classList.toggle("city-equipment-menu__selected-stat--armor", product !== undefined && statKind === "armor");
    menu.selectedStat.style.setProperty("--city-equipment-stat-icon", statKind === "armor" ? `url("${DAMAGE_BLOCK_ICON_ASSET_URL}")` : "");
    menu.selectedStat.textContent = product ? `${statLabel} ${statValue}` : "EMPTY";
  }
}

function renderCityEquipmentCategories(
  host: HTMLElement | null,
  categories: readonly CityEquipmentCategory[],
  activeCategoryId: CityEquipmentCategoryId,
): void {
  if (!host) {
    return;
  }

  host.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      const icon = document.createElement("span");
      const iconUrl = getCityEquipmentCategoryIconUrl(category);

      button.type = "button";
      button.className = "city-equipment-menu__category";
      button.classList.toggle("city-equipment-menu__category--active", category.id === activeCategoryId);
      button.dataset.cityEquipmentCategory = category.id;
      button.setAttribute("aria-label", category.label);
      icon.className = "city-equipment-menu__category-icon";

      if (iconUrl) {
        icon.style.backgroundImage = `url("${iconUrl}")`;
      } else {
        icon.textContent = category.label.slice(0, 1);
      }

      button.append(icon);

      return button;
    }),
  );
}

function renderCityEquipmentProducts(
  host: HTMLElement | null,
  category: CityEquipmentCategory,
  products: readonly CityEquipmentProduct[],
  selectedProduct: CityEquipmentProduct | undefined,
  hero: HeroState,
): void {
  if (!host) {
    return;
  }

  if (products.length <= 0) {
    const empty = document.createElement("span");

    empty.className = "city-equipment-menu__empty";
    empty.textContent = "NO OWNED ITEMS";
    host.replaceChildren(empty);
    return;
  }

  host.replaceChildren(
    ...products.map((product) => {
      const rarity = getShopProductRarity(product.itemIds);
      const iconUrl = getShopProductIconUrl(product.itemIds);
      const button = document.createElement("button");
      const icon = document.createElement("span");

      button.type = "button";
      button.className = [
        "city-equipment-menu__item",
        `city-equipment-menu__item--${category.side}`,
        `armory-shop__option--rarity-${rarity}`,
        selectedProduct?.id === product.id ? "city-equipment-menu__item--selected" : "",
        areHeroItemsEquipped(hero, product.itemIds) ? "city-equipment-menu__item--equipped" : "",
      ]
        .filter(Boolean)
        .join(" ");
      button.dataset.cityEquipmentProduct = product.id;
      button.setAttribute("aria-label", getShopProductDisplayName(product.name));
      icon.className = "city-equipment-menu__item-icon";

      if (iconUrl) {
        icon.style.backgroundImage = `url("${iconUrl}")`;
      } else {
        icon.textContent = "?";
      }

      button.append(icon);

      return button;
    }),
  );
}

function getOwnedCityEquipmentProducts(hero: HeroState, category: CityEquipmentCategory): CityEquipmentProduct[] {
  const shopProducts =
    category.side === "armor"
      ? getGeneratedArmoryProductsForSlots(category.slots ?? []).map(toCityEquipmentProduct)
      : GENERATED_WEAPON_PRODUCTS.filter((product) => product.categoryId === category.id).map(toCityEquipmentProduct);
  const inventoryProducts = getInventoryCityEquipmentProducts(hero, category, shopProducts);
  const products = [...shopProducts, ...inventoryProducts];

  return products.filter((product) => areHeroItemsOwned(hero, product.itemIds)).sort(compareCityEquipmentProducts);
}

function getInventoryCityEquipmentProducts(
  hero: HeroState,
  category: CityEquipmentCategory,
  shopProducts: readonly CityEquipmentProduct[],
): CityEquipmentProduct[] {
  const usedProductKeys = new Set(shopProducts.map(getCityEquipmentProductKey));

  return hero.inventory.flatMap((entry) => {
    const item = HERO_ITEM_CATALOG[entry.itemId];

    if (!item || entry.quantity <= 0 || !isInventoryItemInCityEquipmentCategory(item, category)) {
      return [];
    }

    const product: CityEquipmentProduct = {
      id: `inventory-${entry.itemId}`,
      name: item.name,
      itemIds: [entry.itemId],
    };
    const productKey = getCityEquipmentProductKey(product);
    const isCoveredByShopProduct = shopProducts.some((shopProduct) => shopProduct.itemIds.includes(entry.itemId) && areHeroItemsOwned(hero, shopProduct.itemIds));

    if (usedProductKeys.has(productKey) || isCoveredByShopProduct) {
      return [];
    }

    usedProductKeys.add(productKey);
    return [product];
  });
}

function isInventoryItemInCityEquipmentCategory(
  item: (typeof HERO_ITEM_CATALOG)[HeroItemId],
  category: CityEquipmentCategory,
): boolean {
  if (category.side === "armor") {
    return item.kind === "armor" && Boolean(category.slots?.some((slotKey) => slotKey === item.equipmentSlot));
  }

  return item.kind === "weapon" && item.equipmentSlot === "weaponMain" && getCityWeaponCategoryId(item) === category.id;
}

function getCityWeaponCategoryId(item: (typeof HERO_ITEM_CATALOG)[HeroItemId]): CityEquipmentCategoryId {
  const weaponClass = getHeroItemWeaponClass(item);

  if (weaponClass === "bow") {
    return "bows";
  }

  if (weaponClass === "shuriken") {
    return "shurikens";
  }

  if (weaponClass === "axe") {
    return "axes";
  }

  if (weaponClass === "mace") {
    return "maces";
  }

  if (weaponClass === "spear") {
    return "spears";
  }

  return "swords";
}

function getCityEquipmentProductKey(product: CityEquipmentProduct): string {
  return product.itemIds.slice().sort().join("|");
}

function toCityEquipmentProduct(product: ArmoryProduct | { id: string; name: string; itemIds: HeroItemId[] }): CityEquipmentProduct {
  return {
    id: product.id,
    name: product.name,
    itemIds: [...product.itemIds],
  };
}

function compareCityEquipmentProducts(left: CityEquipmentProduct, right: CityEquipmentProduct): number {
  const rarityDifference =
    CITY_EQUIPMENT_RARITY_SORT_ORDER[getShopProductRarity(left.itemIds)] -
    CITY_EQUIPMENT_RARITY_SORT_ORDER[getShopProductRarity(right.itemIds)];

  if (rarityDifference !== 0) {
    return rarityDifference;
  }

  const armorDifference = getShopProductStat(left.itemIds, "armor") - getShopProductStat(right.itemIds, "armor");

  if (armorDifference !== 0) {
    return armorDifference;
  }

  const damageDifference = getShopProductStat(left.itemIds, "damage") - getShopProductStat(right.itemIds, "damage");

  if (damageDifference !== 0) {
    return damageDifference;
  }

  return left.name.localeCompare(right.name);
}

function getSelectedCityEquipmentProduct(
  hero: HeroState,
  products: readonly CityEquipmentProduct[],
  preferredProductId: string | undefined,
): CityEquipmentProduct | undefined {
  return (
    products.find((product) => product.id === preferredProductId) ??
    products.find((product) => areHeroItemsEquipped(hero, product.itemIds)) ??
    products[0]
  );
}

function getProfileEquipmentCategoryId(
  group: (typeof HERO_PROFILE_EQUIPMENT_GROUPS)[number],
  equipment: HeroState["equipment"],
): CityEquipmentCategoryId {
  if (group.modifier !== "weapon") {
    return group.categoryId;
  }

  const weapon = equipment.weaponMain ? HERO_ITEM_CATALOG[equipment.weaponMain] : undefined;
  const weaponClass = getHeroItemWeaponClass(weapon);

  if (weaponClass === "bow") {
    return "bows";
  }

  if (weaponClass === "shuriken") {
    return "shurikens";
  }

  if (weaponClass === "axe") {
    return "axes";
  }

  if (weaponClass === "mace") {
    return "maces";
  }

  if (weaponClass === "spear") {
    return "spears";
  }

  return "swords";
}

function getCityEquipmentCategory(categoryId: CityEquipmentCategoryId): CityEquipmentCategory {
  return CITY_EQUIPMENT_CATEGORIES.find((category) => category.id === categoryId) ?? CITY_EQUIPMENT_ARMOR_CATEGORIES[0]!;
}

function normalizeCityEquipmentCategoryId(value: string | undefined): CityEquipmentCategoryId {
  return CITY_EQUIPMENT_CATEGORIES.some((category) => category.id === value) ? (value as CityEquipmentCategoryId) : "head";
}

function getCityEquipmentCategoryIconUrl(category: CityEquipmentCategory): string | undefined {
  if (category.iconUrl) {
    return category.iconUrl;
  }

  const product = GENERATED_WEAPON_PRODUCTS.find((candidate) => candidate.categoryId === category.id);

  return product ? getShopProductIconUrl(product.itemIds) : undefined;
}

function renderProfileRecoveryStat(target: HTMLElement | null, hpRestore: number, staminaRestore: number): void {
  if (!target) {
    return;
  }

  const hpValue = document.createElement("span");
  const staminaValue = document.createElement("span");

  hpValue.className = "city-profile__recovery-value city-profile__recovery-value--hp";
  hpValue.textContent = formatSignedInteger(hpRestore);
  staminaValue.className = "city-profile__recovery-value city-profile__recovery-value--stamina";
  staminaValue.textContent = formatSignedInteger(staminaRestore);

  target.classList.add("city-profile__derived-recovery-values");
  target.setAttribute("aria-label", `${formatSignedInteger(hpRestore)} health, ${formatSignedInteger(staminaRestore)} stamina`);
  target.replaceChildren(hpValue, staminaValue);
}

function formatMovementSpeedPercent(value: number): string {
  const percent = Math.round(value * 1000) / 10;
  const formattedValue = percent.toFixed(1).replace(/\.0$/u, "");

  if (percent === 0) {
    return "0%";
  }

  return `${percent > 0 ? "+" : ""}${formattedValue}%`;
}

function formatSignedInteger(value: number): string {
  const formattedValue = String(Math.round(value));

  return value >= 0 ? `+${formattedValue}` : formattedValue;
}

function setText(target: HTMLElement | null, value: string): void {
  if (target) {
    target.textContent = value;
  }
}
