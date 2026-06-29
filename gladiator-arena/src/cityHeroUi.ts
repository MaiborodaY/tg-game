import type { ArenaDebugTuning } from "./debugTuning";
import {
  DAILY_ARENA_ENERGY_ICON_ASSET_URL,
  DAMAGE_BLOCK_ICON_ASSET_URL,
  DAMAGE_HIT_ICON_ASSET_URL,
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
import { getGeneratedArmoryProductsForSlots, pairGeneratedArmoryProducts, type ArmoryProduct } from "./armoryShopUi";
import { HERO_APPEARANCE_ASSETS_BY_SLOT, type HeroAppearanceAssetDefinition } from "./appearanceAssetRegistry";
import { actions } from "./combat";
import { GENERATED_WEAPON_PRODUCTS } from "./generated/equipmentItems.generated";
import { createEquipmentItemCardContent, createEquipmentSlotCard } from "./equipmentCardUi";
import {
  areHeroItemsEquipped,
  areHeroItemsConsumable,
  areHeroItemsOwned,
  createHeroPreviewEquipment,
  deriveHeroStats,
  getHeroArenaEnergy,
  getHeroAllocatedSkillPoints,
  getHeroAttributeTotals,
  getHeroEquipmentSetBonusSummary,
  getHeroItemQuantity,
  getHeroSkillPointResetPrice,
  getHeroItemWeaponClass,
  getHeroShurikenItemId,
  getHeroTotalWins,
  HERO_ITEM_CATALOG,
  isHeroXpBlockedByArenaBossGate,
  isHeroConsumableItem,
  type HeroArenaEnergy,
  type HeroAppearance,
  type HeroAppearanceSlotKey,
  type HeroAttributeKey,
  type HeroEquipmentSlotKey,
  type HeroItemId,
  type HeroState,
} from "./hero";
import { getShopProductIconUrl } from "./shopItemIcons";
import {
  getEquippedShopProductDisplayStat,
  getShopProductDisplayName,
  getShopProductDisplayStat,
  getShopProductLevelRequirement,
  getShopProductRarity,
  getShopProductStat,
  getShopRarityLabel,
  type ShopItemRarity,
} from "./shopPresentation";
import { readUiFilterPreferences, updateUiFilterPreferences } from "./uiFilterPreferences";

const HERO_ATTRIBUTE_KEYS: readonly HeroAttributeKey[] = ["strength", "agility", "vitality"];
const ATTRIBUTE_CTRL_ALLOCATE_AMOUNT = 10;
const ATTRIBUTE_HOLD_REPEAT_DELAY_MS = 360;
const ATTRIBUTE_HOLD_REPEAT_INTERVAL_MS = 95;
const HERO_PROFILE_BASE_REST_HP = actions.rest.heal ?? 0;
const HERO_PROFILE_BASE_REST_STAMINA = actions.rest.restore ?? 0;
const CITY_CATEGORY_SHOULDERS_ICON_URL = new URL("./assets/ui/shop/category-shoulders.webp", import.meta.url).href;
const CITY_CATEGORY_WRISTS_ICON_URL = new URL("./assets/ui/shop/category-wrists.webp", import.meta.url).href;
const CITY_CATEGORY_SHIELD_ICON_URL = new URL("./assets/shop-icons/shield-common-03.webp", import.meta.url).href;
const CITY_CATEGORY_GREAVES_ICON_URL = new URL("./assets/ui/shop/category-greaves.webp", import.meta.url).href;
const CITY_CATEGORY_SHINGUARDS_ICON_URL = new URL("./assets/ui/shop/category-shinguards.webp", import.meta.url).href;

type CityHeroProfileStatKey = "damage" | "hp" | "stamina" | "movement" | "recovery";
export type CityEquipmentCategoryId =
  | "swords"
  | "bows"
  | "shurikens"
  | "axes"
  | "maces"
  | "spears"
  | "head"
  | "body"
  | "shoulders"
  | "wrists"
  | "gloves"
  | "shield"
  | "greaves"
  | "shinguards"
  | "boots";
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

interface CityHeroEquipmentHintItem {
  itemId: HeroItemId;
  slotKey: HeroEquipmentSlotKey;
  categoryId: CityEquipmentCategoryId;
}

export interface CityHeroInfoRenderOptions {
  highlightedEquipmentItemIds?: readonly HeroItemId[];
  attributeDraftAllocations?: Partial<Record<HeroAttributeKey, number>>;
  attributeSaveStatus?: CityHeroAttributeSaveStatus;
  attributeControlsDisabled?: boolean;
}

export type CityHeroAttributeSaveStatus = "idle" | "saving" | "saved";

type CityHeroPortraitNotice =
  | {
      kind: "level";
      label: "NEW LEVEL";
    }
  | {
      kind: "item";
      label: "NEW ITEM";
      rarity: ShopItemRarity;
    };

const CITY_HERO_PORTRAIT_NOTICE_CLASS_NAMES = [
  "city-menu__portrait-button--has-notification",
  "city-menu__portrait-button--has-points",
  "city-menu__portrait-button--notice-level",
  "city-menu__portrait-button--notice-item",
  "city-menu__portrait-button--notice-common",
  "city-menu__portrait-button--notice-uncommon",
  "city-menu__portrait-button--notice-rare",
  "city-menu__portrait-button--notice-epic",
  "city-menu__portrait-button--notice-legendary",
  "city-menu__portrait-button--notice-mythical",
  "city-menu__portrait-button--notice-unique",
] as const;

interface CityEquipmentMenuElements {
  root: HTMLElement;
  stage: HTMLElement | null;
  heroPreview: HTMLElement | null;
  equippedSlots: HTMLElement | null;
  details: HTMLElement | null;
  detailsCloseButton: HTMLButtonElement | null;
  weaponSlots: HTMLElement | null;
  detailsIcon: HTMLElement | null;
  detailsName: HTMLElement | null;
  detailsChips: HTMLElement | null;
  detailsRarity: HTMLElement | null;
  detailsKind: HTMLElement | null;
  detailsStat: HTMLElement | null;
  detailsEquipped: HTMLElement | null;
  detailsSet: HTMLElement | null;
  detailsEquipButton: HTMLButtonElement | null;
  inventory: HTMLElement | null;
  filterOutline: SVGSVGElement | null;
  filterOutlineWeapon: SVGPathElement | null;
  filterOutlineArmor: SVGPathElement | null;
  weaponCategories: HTMLElement | null;
  filterActions: HTMLElement | null;
  armorCategories: HTMLElement | null;
  productGrid: HTMLElement | null;
}

interface CityAppearanceMenuElements {
  root: HTMLElement;
  closeButton: HTMLButtonElement | null;
  tabs: HTMLElement | null;
  grid: HTMLElement | null;
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
const CITY_EQUIPMENT_PROFILE_PREVIEW_LEFT_SLOT_MODIFIERS = ["body", "shoulders", "wrists", "gloves"] as const;
const CITY_EQUIPMENT_PROFILE_PREVIEW_RIGHT_SLOT_MODIFIERS = ["shield", "greaves", "shinguards", "boots"] as const;

export interface CityEquipmentProfilePreviewLayout {
  centerX: number;
  visualBottomY: number;
  fitTopY?: number;
  fitWidth?: number;
  scale?: number;
}

interface CityEquipmentProfilePreviewSideFitRect {
  left: number;
  width: number;
}

const CITY_EQUIPMENT_WEAPON_CATEGORIES: readonly CityEquipmentCategory[] = [
  { id: "swords", label: "Swords", side: "weapon", iconUrl: SHOP_CATEGORY_SWORD_ICON_ASSET_URL },
  { id: "axes", label: "Axes", side: "weapon", iconUrl: SHOP_CATEGORY_AXE_ICON_ASSET_URL },
  { id: "maces", label: "Maces", side: "weapon", iconUrl: SHOP_CATEGORY_MACE_ICON_ASSET_URL },
  { id: "spears", label: "Spears", side: "weapon", iconUrl: SHOP_CATEGORY_SPEAR_ICON_ASSET_URL },
  { id: "bows", label: "Bows", side: "weapon", iconUrl: SHOP_CATEGORY_BOW_ICON_ASSET_URL },
  { id: "shurikens", label: "Shurikens", side: "weapon", iconUrl: SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL },
];

const CITY_EQUIPMENT_ARMOR_CATEGORIES: readonly CityEquipmentCategory[] = [
  { id: "head", label: "Head", side: "armor", iconUrl: SHOP_CATEGORY_HEAD_ICON_ASSET_URL, slots: ["helmet"] },
  { id: "body", label: "Body", side: "armor", iconUrl: SHOP_CATEGORY_BODY_ICON_ASSET_URL, slots: ["breastplate"] },
  {
    id: "shoulders",
    label: "Shoulders",
    side: "armor",
    iconUrl: CITY_CATEGORY_SHOULDERS_ICON_URL,
    slots: ["backShoulderguard", "frontShoulderguard"],
  },
  {
    id: "wrists",
    label: "Wrists",
    side: "armor",
    iconUrl: CITY_CATEGORY_WRISTS_ICON_URL,
    slots: ["backWrist", "frontWrist"],
  },
  { id: "gloves", label: "Gloves", side: "armor", iconUrl: SHOP_CATEGORY_ARMS_ICON_ASSET_URL, slots: ["backGlove", "frontGlove"] },
  { id: "shield", label: "Shield", side: "armor", iconUrl: CITY_CATEGORY_SHIELD_ICON_URL, slots: ["shield"] },
  {
    id: "greaves",
    label: "Greaves",
    side: "armor",
    iconUrl: CITY_CATEGORY_GREAVES_ICON_URL,
    slots: ["backGreave", "frontGreave"],
  },
  {
    id: "shinguards",
    label: "Shinguards",
    side: "armor",
    iconUrl: CITY_CATEGORY_SHINGUARDS_ICON_URL,
    slots: ["backShinguard", "frontShinguard"],
  },
  { id: "boots", label: "Boots", side: "armor", iconUrl: SHOP_CATEGORY_LEGS_ICON_ASSET_URL, slots: ["backBoot", "frontBoot"] },
];

const CITY_EQUIPMENT_CATEGORIES: readonly CityEquipmentCategory[] = [...CITY_EQUIPMENT_WEAPON_CATEGORIES, ...CITY_EQUIPMENT_ARMOR_CATEGORIES];

function getStoredCityEquipmentCategoryIds(): Set<CityEquipmentCategoryId> {
  const categoryIds = readUiFilterPreferences().cityEquipment?.categoryIds;

  if (!categoryIds) {
    return new Set();
  }

  const selectedCategoryIds = categoryIds.filter(isCityEquipmentCategoryId);

  return selectedCategoryIds.length >= CITY_EQUIPMENT_CATEGORIES.length ? new Set() : new Set(selectedCategoryIds);
}

function persistCityEquipmentFilterPreferences(activeCategoryIds: ReadonlySet<CityEquipmentCategoryId>): void {
  updateUiFilterPreferences((preferences) => ({
    ...preferences,
    cityEquipment: {
      categoryIds: [...activeCategoryIds],
    },
  }));
}

function isCityEquipmentCategoryId(value: string): value is CityEquipmentCategoryId {
  return CITY_EQUIPMENT_CATEGORIES.some((category) => category.id === value);
}

const HERO_RANKS: readonly { minLevel: number; title: string }[] = [
  { minLevel: 90, title: "Immortal" },
  { minLevel: 70, title: "Legend" },
  { minLevel: 50, title: "Warlord" },
  { minLevel: 35, title: "Champion" },
  { minLevel: 25, title: "Veteran" },
  { minLevel: 15, title: "Gladiator" },
  { minLevel: 10, title: "Arena Blood" },
  { minLevel: 5, title: "Pit Fighter" },
  { minLevel: 1, title: "Novice" },
];
const CITY_APPEARANCE_SLOT_OPTIONS: readonly { slot: HeroAppearanceSlotKey; label: string }[] = [
  { slot: "hair", label: "Hair" },
  { slot: "beard", label: "Beard" },
];

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
    label: "Shoulders",
    icon: "S",
    modifier: "shoulders",
    categoryId: "shoulders",
    slots: ["backShoulderguard", "frontShoulderguard"],
  },
  {
    label: "Wrists",
    icon: "W",
    modifier: "wrists",
    categoryId: "wrists",
    slots: ["backWrist", "frontWrist"],
  },
  { label: "Gloves", icon: "G", modifier: "gloves", categoryId: "gloves", slots: ["backGlove", "frontGlove"] },
  { label: "Shield", icon: "S", modifier: "shield", categoryId: "shield", slots: ["shield"] },
  { label: "Greaves", icon: "G", modifier: "greaves", categoryId: "greaves", slots: ["backGreave", "frontGreave"] },
  { label: "Shinguards", icon: "S", modifier: "shinguards", categoryId: "shinguards", slots: ["backShinguard", "frontShinguard"] },
  { label: "Boots", icon: "B", modifier: "boots", categoryId: "boots", slots: ["backBoot", "frontBoot"] },
  { label: "Weapon", icon: "W", modifier: "weapon", categoryId: "swords", slots: ["weaponMain"] },
  { label: "Bow", icon: "B", modifier: "bow", categoryId: "bows", slots: ["weaponBow"] },
];

const CITY_EQUIPMENT_WEAPON_SLOT_GROUPS: readonly {
  id: "bow" | "melee" | "shuriken";
  label: string;
  modifier: string;
  area: string;
  slot?: HeroEquipmentSlotKey;
}[] = [
  { id: "bow", label: "Bow", modifier: "weapon-bow", area: "bow", slot: "weaponBow" },
  { id: "melee", label: "Melee weapon", modifier: "weapon-main", area: "melee", slot: "weaponMain" },
  { id: "shuriken", label: "Shuriken", modifier: "weapon-shuriken", area: "shuriken" },
];

export interface CityHeroWidgetRefs {
  widget: HTMLElement | null;
  portrait: HTMLElement | null;
  portraitButton: HTMLButtonElement | null;
  name: HTMLElement | null;
  level: HTMLElement | null;
  rank: HTMLElement | null;
  arenaEnergy: HTMLElement | null;
  gold: HTMLElement | null;
  xpFill: HTMLElement | null;
  xpText: HTMLElement | null;
  skillPoints: HTMLElement | null;
  profile: HTMLElement | null;
  profilePortrait: HTMLElement | null;
  profileName: HTMLElement | null;
  profileResetButton: HTMLButtonElement | null;
  profileResetPointsButton: HTMLButtonElement | null;
  profileSaveAttributesButton: HTMLButtonElement | null;
  profileGold: HTMLElement | null;
  profileArenaEnergy: HTMLElement | null;
  profileLevel: HTMLElement | null;
  profileXpFill: HTMLElement | null;
  profileXpText: HTMLElement | null;
  profileEquipment: HTMLElement | null;
  profileStats: Record<CityHeroProfileStatKey, HTMLElement | null>;
  attributeValues: Record<HeroAttributeKey, HTMLElement | null>;
  attributeButtons: Record<HeroAttributeKey, HTMLButtonElement | null>;
  attributeDecreaseButtons: Record<HeroAttributeKey, HTMLButtonElement | null>;
}

export function getCityHeroWidgetRefs(root: ParentNode = document): CityHeroWidgetRefs {
  return {
    widget: root.querySelector<HTMLElement>("#heroWidget"),
    portrait: root.querySelector<HTMLElement>("#heroPortrait"),
    portraitButton: root.querySelector<HTMLButtonElement>("#heroPortraitButton"),
    name: root.querySelector<HTMLElement>("#heroInfoName"),
    level: root.querySelector<HTMLElement>("#heroInfoLevel"),
    rank: root.querySelector<HTMLElement>("#heroInfoRank"),
    arenaEnergy: root.querySelector<HTMLElement>("#heroInfoArenaEnergy"),
    gold: root.querySelector<HTMLElement>("#heroInfoGold"),
    xpFill: root.querySelector<HTMLElement>("#heroInfoXpFill"),
    xpText: root.querySelector<HTMLElement>("#heroInfoXpText"),
    skillPoints: root.querySelector<HTMLElement>("#heroProfileSkillPoints"),
    profile: root.querySelector<HTMLElement>("#heroProfile"),
    profilePortrait: root.querySelector<HTMLElement>("#heroProfilePortrait"),
    profileName: root.querySelector<HTMLElement>("#heroProfileName"),
    profileResetButton: root.querySelector<HTMLButtonElement>("#heroProfileResetButton"),
    profileResetPointsButton: root.querySelector<HTMLButtonElement>("#heroProfileResetPointsButton"),
    profileSaveAttributesButton: root.querySelector<HTMLButtonElement>("#heroProfileSaveAttributesButton"),
    profileGold: root.querySelector<HTMLElement>("#heroProfileGold"),
    profileArenaEnergy: root.querySelector<HTMLElement>("#heroProfileArenaEnergy"),
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
    attributeDecreaseButtons: {
      strength: root.querySelector<HTMLButtonElement>('[data-hero-attribute-decrease-button="strength"]'),
      agility: root.querySelector<HTMLButtonElement>('[data-hero-attribute-decrease-button="agility"]'),
      vitality: root.querySelector<HTMLButtonElement>('[data-hero-attribute-decrease-button="vitality"]'),
    },
  };
}

export function getHeroRankTitle(level: number): string {
  const normalizedLevel = Math.max(1, Math.floor(level));

  return HERO_RANKS.find((rank) => normalizedLevel >= rank.minLevel)?.title ?? "Novice";
}

export function formatHeroWinCount(wins: number): string {
  const normalizedWins = Math.max(0, Math.floor(wins));

  return `${normalizedWins} ${normalizedWins === 1 ? "win" : "wins"}`;
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

export function renderCityHeroInfo(refs: CityHeroWidgetRefs, hero: HeroState, options: CityHeroInfoRenderOptions = {}): void {
  const xpToNextLevel = Math.max(1, hero.xpToNextLevel);
  const xpRatio = Math.max(0, Math.min(1, hero.xp / xpToNextLevel));
  const isBossGateLocked = isHeroXpBlockedByArenaBossGate(hero);
  const xpText = isBossGateLocked ? "DEFEAT BOSS TO UNLOCK" : `${hero.xp}/${xpToNextLevel}`;
  const highlightedEquipmentItems = getHighlightedCityEquipmentItems(options.highlightedEquipmentItemIds);
  const portraitNotice = getCityHeroPortraitNotice(hero, highlightedEquipmentItems);
  const attributeDraftAllocations = options.attributeDraftAllocations ?? {};
  const attributeSaveStatus = options.attributeSaveStatus ?? "idle";
  const attributeControlsDisabled = Boolean(options.attributeControlsDisabled);
  const hasAttributeDraft = HERO_ATTRIBUTE_KEYS.some((attribute) => getAttributeDraftAllocation(attributeDraftAllocations, attribute) > 0);

  if (refs.name) {
    refs.name.textContent = hero.name.toUpperCase();
  }

  if (refs.level) {
    refs.level.textContent = `LVL ${hero.level}`;
  }

  if (refs.rank) {
    renderCityHeroRank(refs.rank, hero);
  }

  if (refs.gold) {
    refs.gold.textContent = String(hero.gold);
  }

  const arenaEnergy = getHeroArenaEnergy(hero);

  if (refs.arenaEnergy) {
    renderCityArenaEnergyBadge(refs.arenaEnergy, arenaEnergy, "city-menu__hero-energy--empty");
  }

  if (refs.xpFill) {
    refs.xpFill.style.width = `${xpRatio * 100}%`;
  }

  if (refs.xpText) {
    refs.xpText.textContent = xpText;
    refs.xpText.classList.toggle("city-menu__hero-xp-text--boss-gated", isBossGateLocked);
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

  if (refs.profileArenaEnergy) {
    renderCityArenaEnergyBadge(refs.profileArenaEnergy, arenaEnergy, "city-profile__arena-energy--empty");
  }

  if (refs.profileXpFill) {
    refs.profileXpFill.style.width = `${xpRatio * 100}%`;
  }

  if (refs.profileXpText) {
    refs.profileXpText.textContent = xpText;
    refs.profileXpText.classList.toggle("city-profile__xp-text--boss-gated", isBossGateLocked);
  }

  syncCityHeroPortraitNotice(refs.portraitButton, portraitNotice);

  if (refs.skillPoints) {
    refs.skillPoints.textContent = hero.skillPoints > 0 ? `${hero.skillPoints} POINTS READY` : "NO POINTS";
    refs.skillPoints.classList.toggle("city-profile__points--ready", hero.skillPoints > 0);
  }

  if (refs.profileResetPointsButton) {
    const resetPrice = getHeroSkillPointResetPrice(hero);
    const allocatedSkillPoints = getHeroAllocatedSkillPoints(hero);
    const canAffordReset = hero.gold >= resetPrice;

    refs.profileResetPointsButton.hidden = allocatedSkillPoints <= 0;
    refs.profileResetPointsButton.disabled = allocatedSkillPoints <= 0 || !canAffordReset || attributeControlsDisabled;
    refs.profileResetPointsButton.textContent = `RESET ${resetPrice}`;
    refs.profileResetPointsButton.setAttribute("aria-label", `Reset attribute points for ${resetPrice} gold`);
    refs.profileResetPointsButton.title =
      attributeControlsDisabled
        ? "Saving attributes"
        : allocatedSkillPoints <= 0
        ? "No spent points"
        : canAffordReset
          ? `Reset ${allocatedSkillPoints} spent points for ${resetPrice} gold`
          : `Need ${resetPrice} gold`;
  }

  if (refs.profileSaveAttributesButton) {
    refs.profileSaveAttributesButton.hidden = !hasAttributeDraft && attributeSaveStatus !== "saved";
    refs.profileSaveAttributesButton.disabled = !hasAttributeDraft || attributeSaveStatus === "saving" || attributeSaveStatus === "saved";
    refs.profileSaveAttributesButton.classList.toggle("city-profile__points-save--saving", attributeSaveStatus === "saving");
    refs.profileSaveAttributesButton.classList.toggle("city-profile__points-save--saved", attributeSaveStatus === "saved");
    refs.profileSaveAttributesButton.textContent =
      attributeSaveStatus === "saving"
        ? "SAVING"
        : attributeSaveStatus === "saved"
          ? "SAVED"
          : "SAVE";
    refs.profileSaveAttributesButton.setAttribute(
      "aria-label",
      attributeSaveStatus === "saved"
        ? "Attributes saved"
        : attributeSaveStatus === "saving"
          ? "Saving attributes"
          : "Save attribute changes",
    );
    refs.profileSaveAttributesButton.title =
      attributeSaveStatus === "saved"
        ? "Attributes saved"
        : attributeSaveStatus === "saving"
          ? "Saving attributes"
          : "Save attribute changes";
  }

  renderCityHeroProfileEquipment(refs, hero, highlightedEquipmentItems);

  HERO_ATTRIBUTE_KEYS.forEach((attribute) => {
    const value = refs.attributeValues[attribute];
    const button = refs.attributeButtons[attribute];
    const decreaseButton = refs.attributeDecreaseButtons[attribute];
    const draftAllocation = getAttributeDraftAllocation(attributeDraftAllocations, attribute);

    if (value) {
      value.textContent = String(hero.baseStats[attribute]);
    }

    if (button) {
      button.disabled = hero.skillPoints <= 0 || attributeControlsDisabled;
      button.hidden = false;
    }

    if (decreaseButton) {
      decreaseButton.disabled = draftAllocation <= 0 || attributeControlsDisabled;
      decreaseButton.hidden = false;
    }
  });

  renderCityHeroProfileStats(refs, hero);
}

function getAttributeDraftAllocation(
  draftAllocations: Partial<Record<HeroAttributeKey, number>>,
  attribute: HeroAttributeKey,
): number {
  const value = draftAllocations[attribute];

  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function getCityHeroPortraitNotice(hero: HeroState, highlightedEquipmentItems: readonly CityHeroEquipmentHintItem[]): CityHeroPortraitNotice | undefined {
  if (hero.skillPoints > 0) {
    return { kind: "level", label: "NEW LEVEL" };
  }

  const rarity = getHighestHighlightedEquipmentRarity(highlightedEquipmentItems);

  return rarity ? { kind: "item", label: "NEW ITEM", rarity } : undefined;
}

function getHighestHighlightedEquipmentRarity(highlightedEquipmentItems: readonly CityHeroEquipmentHintItem[]): ShopItemRarity | undefined {
  return highlightedEquipmentItems.reduce<ShopItemRarity | undefined>((highestRarity, hint) => {
    const rarity = getShopProductRarity([hint.itemId]);

    if (!highestRarity || CITY_EQUIPMENT_RARITY_SORT_ORDER[rarity] > CITY_EQUIPMENT_RARITY_SORT_ORDER[highestRarity]) {
      return rarity;
    }

    return highestRarity;
  }, undefined);
}

function syncCityHeroPortraitNotice(button: HTMLButtonElement | null, notice: CityHeroPortraitNotice | undefined): void {
  if (!button) {
    return;
  }

  button.classList.remove(...CITY_HERO_PORTRAIT_NOTICE_CLASS_NAMES);

  if (!notice) {
    delete button.dataset.heroNotice;
    return;
  }

  button.dataset.heroNotice = notice.label;
  button.classList.add("city-menu__portrait-button--has-notification", `city-menu__portrait-button--notice-${notice.kind}`);

  if (notice.kind === "item") {
    button.classList.add(`city-menu__portrait-button--notice-${notice.rarity}`);
  }
}

export function renderCityArenaEnergyBadge(element: HTMLElement, arenaEnergy: HeroArenaEnergy, emptyClassName: string): void {
  const energyBadge = document.createElement("span");
  const icon = document.createElement("img");
  const value = document.createElement("span");
  const showResetTimer = arenaEnergy.current <= 0;
  const resetTimerText = showResetTimer ? formatArenaEnergyResetTimer(arenaEnergy) : "";

  energyBadge.className = "city-arena-energy-badge";
  icon.className = "city-arena-energy-icon";
  icon.src = DAILY_ARENA_ENERGY_ICON_ASSET_URL;
  icon.alt = "";
  icon.decoding = "async";
  icon.draggable = false;
  value.className = "city-arena-energy-value";
  value.textContent = `${arenaEnergy.current}/${arenaEnergy.max}`;
  energyBadge.append(icon, value);
  if (showResetTimer) {
    const timer = document.createElement("span");

    timer.className = "city-arena-energy-reset";
    timer.textContent = resetTimerText;
    element.replaceChildren(energyBadge, timer);
    element.title = `Arena energy: ${arenaEnergy.current}/${arenaEnergy.max}. Reset in ${resetTimerText}.`;
    element.setAttribute("aria-label", `Arena energy ${arenaEnergy.current} of ${arenaEnergy.max}, reset in ${resetTimerText}`);
  } else {
    element.replaceChildren(energyBadge);
    element.title = `Arena energy: ${arenaEnergy.current}/${arenaEnergy.max}`;
    element.setAttribute("aria-label", `Arena energy ${arenaEnergy.current} of ${arenaEnergy.max}`);
  }
  element.classList.toggle(emptyClassName, arenaEnergy.current <= 0);
}

function formatArenaEnergyResetTimer(arenaEnergy: HeroArenaEnergy, now = new Date()): string {
  const resetAt = new Date(`${arenaEnergy.dayKey}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000;
  const fallbackResetAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const safeResetAt = Number.isFinite(resetAt) ? resetAt : fallbackResetAt;
  const remainingMs = Math.max(0, safeResetAt - now.getTime());
  const totalMinutes = Math.ceil(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function renderCityHeroRank(element: HTMLElement, hero: HeroState): void {
  const rankTitle = getHeroRankTitle(hero.level);
  const winsElement = document.createElement("span");

  winsElement.className = "city-menu__hero-wins";
  winsElement.textContent = ` (${formatHeroWinCount(getHeroTotalWins(hero))})`;
  element.replaceChildren(document.createTextNode(rankTitle), winsElement);
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
      if (profile?.querySelector(".city-equipment-menu:not([hidden]), .city-appearance-menu:not([hidden])")) {
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

export interface CityHeroAppearanceMenuApi {
  open: (slot?: HeroAppearanceSlotKey) => void;
  close: () => void;
  render: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

interface CityHeroEquipmentMenuOptions {
  getHero: () => HeroState;
  onEquip: (itemIds: readonly HeroItemId[]) => void;
  onUnequip: (itemIds: readonly HeroItemId[]) => void;
  onCategoryOpen?: (categoryId: CityEquipmentCategoryId) => void;
  onOpen?: (layout?: CityEquipmentProfilePreviewLayout) => void;
  onClose?: () => void;
}

interface CityHeroAppearanceMenuOptions {
  getHero: () => HeroState;
  onChange: (appearance: Partial<HeroAppearance>) => void;
}

export function mountCityHeroEquipmentMenu(refs: CityHeroWidgetRefs, options: CityHeroEquipmentMenuOptions): CityHeroEquipmentMenuApi {
  const { profile, profileEquipment } = refs;
  const cityMenu = profile?.closest<HTMLElement>(".city-menu") ?? null;
  const menu = createCityEquipmentMenuElements();
  const profileCloseButton = profile?.querySelector<HTMLButtonElement>("[data-hero-profile-close]") ?? null;
  const profileCloseButtonAriaLabel = profileCloseButton?.getAttribute("aria-label");
  const profileClosePlaceholder = document.createComment("hero-profile-close-placeholder");
  let isOpen = false;
  let isProfileCloseButtonMoved = false;
  let activeCategoryIds = getStoredCityEquipmentCategoryIds();
  let selectedProductId: string | undefined;

  profile?.append(menu.root);

  const syncProfilePreviewLayout = () => {
    if (isOpen) {
      options.onOpen?.(getCityEquipmentProfilePreviewLayout(menu));
    }
  };
  const setOpen = (nextOpen: boolean, categoryId?: CityEquipmentCategoryId) => {
    const wasOpen = isOpen;

    if (nextOpen) {
      activeCategoryIds = categoryId ? new Set([normalizeCityEquipmentCategoryId(categoryId)]) : getStoredCityEquipmentCategoryIds();
      if (categoryId) {
        persistCityEquipmentFilterPreferences(activeCategoryIds);
      }
    }

    isOpen = nextOpen;
    menu.root.hidden = !nextOpen;
    profile?.classList.toggle("city-profile--equipment-menu-open", nextOpen);
    cityMenu?.classList.toggle("city-menu--equipment-preview-open", nextOpen);

    if (nextOpen) {
      selectedProductId = undefined;
      moveProfileCloseButtonIntoEquipmentMenu();
      render();
      if (!wasOpen) {
        syncProfilePreviewLayout();
        if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(syncProfilePreviewLayout);
        }
      }
      return;
    }

    if (wasOpen) {
      restoreProfileCloseButton();
      options.onClose?.();
    }
  };

  const open = (categoryId?: CityEquipmentCategoryId) => setOpen(true, categoryId);
  const close = () => setOpen(false);
  const handleProfileEquipmentClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("[data-hero-equipment-category]");

    if (!button || !profileEquipment?.contains(button)) {
      return;
    }

    event.preventDefault();
    const categoryId = normalizeCityEquipmentCategoryId(button.dataset.heroEquipmentCategory);

    options.onCategoryOpen?.(categoryId);
    open(categoryId);
  };
  const handleCategoryClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>(
      "[data-city-equipment-category], [data-city-equipment-side-all], [data-city-equipment-filter]",
    );

    if (!button || !menu.root.contains(button)) {
      return;
    }

    event.preventDefault();

    if (button.dataset.cityEquipmentFilter) {
      return;
    }

    if (button.dataset.cityEquipmentSideAll) {
      activeCategoryIds = getNextCityEquipmentSideAllSelection(
        activeCategoryIds,
        button.dataset.cityEquipmentSideAll as CityEquipmentCategorySide,
      );
      persistCityEquipmentFilterPreferences(activeCategoryIds);
      selectedProductId = undefined;
      render();
      return;
    }

    const categoryId = normalizeCityEquipmentCategoryId(button.dataset.cityEquipmentCategory);
    const nextCategoryIds = new Set(activeCategoryIds);

    if (nextCategoryIds.has(categoryId)) {
      nextCategoryIds.delete(categoryId);
    } else {
      nextCategoryIds.add(categoryId);
      options.onCategoryOpen?.(categoryId);
    }

    activeCategoryIds = nextCategoryIds;
    persistCityEquipmentFilterPreferences(activeCategoryIds);
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

    const product = getOwnedCityEquipmentProductsForCategories(options.getHero(), getSelectedCityEquipmentCategories(activeCategoryIds)).find(
      (candidate) => candidate.id === button.dataset.cityEquipmentProduct,
    );

    if (!product) {
      return;
    }

    selectedProductId = product.id;
    render();
  };
  const handleEquippedSlotClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("[data-city-equipment-slot-category]");

    if (!button || !menu.stage?.contains(button)) {
      return;
    }

    event.preventDefault();
    const categoryId = normalizeCityEquipmentCategoryId(button.dataset.cityEquipmentSlotCategory);
    const productKey = button.dataset.cityEquipmentSlotProductKey;
    const products = getOwnedCityEquipmentProductsForCategories(options.getHero(), [getCityEquipmentCategory(categoryId)]);
    const product = productKey ? products.find((candidate) => getCityEquipmentProductKey(candidate) === productKey) : undefined;

    activeCategoryIds = new Set([categoryId]);
    persistCityEquipmentFilterPreferences(activeCategoryIds);
    selectedProductId = product?.id;
    options.onCategoryOpen?.(categoryId);
    render();
  };
  const handleDetailsCloseClick = (event: MouseEvent) => {
    event.preventDefault();
    selectedProductId = undefined;
    render();
  };
  const handleDetailsOutsideClick = (event: MouseEvent) => {
    if (!isOpen || !selectedProductId || !menu.details || menu.details.hidden) {
      return;
    }

    const target = event.target instanceof Node ? event.target : null;

    if (target && menu.details.contains(target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    selectedProductId = undefined;
    render();
  };
  const handleEquipClick = (event: MouseEvent) => {
    event.preventDefault();

    const product = selectedProductId
      ? getOwnedCityEquipmentProductsForCategories(options.getHero(), getSelectedCityEquipmentCategories(activeCategoryIds)).find(
        (candidate) => candidate.id === selectedProductId,
      )
      : undefined;

    if (!product) {
      return;
    }

    if (areHeroItemsEquipped(options.getHero(), product.itemIds)) {
      options.onUnequip(product.itemIds);
    } else {
      options.onEquip(product.itemIds);
    }

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
      if (selectedProductId) {
        selectedProductId = undefined;
        render();
        return;
      }

      close();
    }
  };
  const handleWindowResize = () => {
    syncProfilePreviewLayout();
    syncCityEquipmentFilterOutline(menu);
  };
  const handleProfileCloseCapture = (event: MouseEvent) => {
    if (!isOpen) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    close();
  };

  profileEquipment?.addEventListener("click", handleProfileEquipmentClick);
  menu.root.addEventListener("click", handleCategoryClick);
  menu.productGrid?.addEventListener("click", handleProductClick);
  menu.stage?.addEventListener("click", handleEquippedSlotClick);
  menu.detailsCloseButton?.addEventListener("click", handleDetailsCloseClick);
  menu.detailsEquipButton?.addEventListener("click", handleEquipClick);
  profileCloseButton?.addEventListener("click", handleProfileCloseCapture, true);
  profile?.addEventListener("city-profile-visibility", handleProfileVisibility);
  window.addEventListener("resize", handleWindowResize);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("click", handleDetailsOutsideClick, true);

  function render(): void {
    if (!isOpen) {
      return;
    }

    const hero = options.getHero();
    const selectedCategories = getSelectedCityEquipmentCategories(activeCategoryIds);
    const products = getOwnedCityEquipmentProductsForCategories(hero, selectedCategories);
    const selectedProduct = selectedProductId ? products.find((product) => product.id === selectedProductId) : undefined;

    selectedProductId = selectedProduct?.id;
    renderCityEquipmentPaperDoll(menu, hero);
    renderCityEquipmentWeaponSlots(menu, hero);
    renderCityEquipmentDetails(menu, selectedProduct, hero);
    renderCityEquipmentCategories(menu.weaponCategories, CITY_EQUIPMENT_WEAPON_CATEGORIES, activeCategoryIds);
    renderCityEquipmentFilterActions(menu.filterActions, activeCategoryIds);
    renderCityEquipmentCategories(menu.armorCategories, CITY_EQUIPMENT_ARMOR_CATEGORIES, activeCategoryIds);
    syncCityEquipmentFilterOutline(menu);
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => syncCityEquipmentFilterOutline(menu));
    }
    renderCityEquipmentProducts(menu.productGrid, selectedCategories, products, selectedProduct, hero);
  }

  function moveProfileCloseButtonIntoEquipmentMenu(): void {
    if (!profileCloseButton || !menu.inventory) {
      return;
    }

    if (!isProfileCloseButtonMoved) {
      profileCloseButton.before(profileClosePlaceholder);
      isProfileCloseButtonMoved = true;
    }

    profileCloseButton.classList.add("city-profile__footer-close--equipment-menu");
    profileCloseButton.setAttribute("aria-label", "Close equipment");
    menu.inventory.append(profileCloseButton);
  }

  function restoreProfileCloseButton(): void {
    if (!profileCloseButton || !isProfileCloseButtonMoved) {
      return;
    }

    profileCloseButton.classList.remove("city-profile__footer-close--equipment-menu");
    if (profileCloseButtonAriaLabel) {
      profileCloseButton.setAttribute("aria-label", profileCloseButtonAriaLabel);
    } else {
      profileCloseButton.removeAttribute("aria-label");
    }
    profileClosePlaceholder.parentNode?.insertBefore(profileCloseButton, profileClosePlaceholder);
    profileClosePlaceholder.remove();
    isProfileCloseButtonMoved = false;
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
      menu.stage?.removeEventListener("click", handleEquippedSlotClick);
      menu.detailsCloseButton?.removeEventListener("click", handleDetailsCloseClick);
      menu.detailsEquipButton?.removeEventListener("click", handleEquipClick);
      profileCloseButton?.removeEventListener("click", handleProfileCloseCapture, true);
      profile?.removeEventListener("city-profile-visibility", handleProfileVisibility);
      window.removeEventListener("resize", handleWindowResize);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleDetailsOutsideClick, true);
      menu.root.remove();
    },
  };
}

export function mountCityHeroAppearanceMenu(refs: CityHeroWidgetRefs, options: CityHeroAppearanceMenuOptions): CityHeroAppearanceMenuApi {
  const { profile, profilePortrait } = refs;
  const menu = createCityAppearanceMenuElements();
  let isOpen = false;
  let activeSlot: HeroAppearanceSlotKey = "hair";

  profile?.append(menu.root);

  const setOpen = (nextOpen: boolean, slot = activeSlot) => {
    activeSlot = normalizeHeroAppearanceSlotKey(slot);
    isOpen = nextOpen;
    menu.root.hidden = !nextOpen;
    profile?.classList.toggle("city-profile--appearance-menu-open", nextOpen);

    if (nextOpen) {
      render();
    }
  };

  const open = (slot?: HeroAppearanceSlotKey) => setOpen(true, slot ?? activeSlot);
  const close = () => setOpen(false);
  const handleProfilePortraitClick = (event: MouseEvent) => {
    event.preventDefault();
    open();
  };
  const handleTabClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("[data-hero-appearance-tab]");

    if (!button || !menu.tabs?.contains(button)) {
      return;
    }

    event.preventDefault();
    activeSlot = normalizeHeroAppearanceSlotKey(button.dataset.heroAppearanceTab);
    render();
  };
  const handleOptionClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("[data-hero-appearance-option]");

    if (!button || !menu.grid?.contains(button)) {
      return;
    }

    event.preventDefault();
    options.onChange(createHeroAppearancePatch(activeSlot, button.dataset.heroAppearanceOption || null));
    render();
  };
  const handleProfileVisibility = (event: Event) => {
    const profileEvent = event as CustomEvent<{ open?: boolean }>;

    if (profileEvent.detail?.open === false) {
      close();
    }
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && isOpen) {
      event.stopPropagation();
      close();
    }
  };

  profilePortrait?.addEventListener("click", handleProfilePortraitClick);
  menu.tabs?.addEventListener("click", handleTabClick);
  menu.grid?.addEventListener("click", handleOptionClick);
  menu.closeButton?.addEventListener("click", close);
  profile?.addEventListener("city-profile-visibility", handleProfileVisibility);
  document.addEventListener("keydown", handleKeyDown);

  return {
    open,
    close,
    render,
    isOpen: () => isOpen,
    destroy: () => {
      close();
      profilePortrait?.removeEventListener("click", handleProfilePortraitClick);
      menu.tabs?.removeEventListener("click", handleTabClick);
      menu.grid?.removeEventListener("click", handleOptionClick);
      menu.closeButton?.removeEventListener("click", close);
      profile?.removeEventListener("city-profile-visibility", handleProfileVisibility);
      document.removeEventListener("keydown", handleKeyDown);
      menu.root.remove();
    },
  };

  function render(): void {
    renderCityAppearanceTabs(menu, activeSlot);
    renderCityAppearanceOptions(menu, options.getHero(), activeSlot);
  }
}

export interface CityHeroAttributeControlOptions {
  onAllocate: (attribute: HeroAttributeKey, amount: number) => void;
  onDeallocate?: (attribute: HeroAttributeKey, amount: number) => void;
  onSave?: () => void;
  onReset?: () => void;
}

export function mountCityHeroAttributeControls(
  refs: CityHeroWidgetRefs,
  options: CityHeroAttributeControlOptions,
): () => void {
  const cleanups = HERO_ATTRIBUTE_KEYS.flatMap((attribute) => {
    const increaseButton = refs.attributeButtons[attribute];
    const decreaseButton = refs.attributeDecreaseButtons[attribute];
    const attributeCleanups: (() => void)[] = [];

    if (increaseButton) {
      attributeCleanups.push(mountAttributeRepeatButton(increaseButton, (amount) => options.onAllocate(attribute, amount)));
    }

    if (decreaseButton && options.onDeallocate) {
      attributeCleanups.push(mountAttributeRepeatButton(decreaseButton, (amount) => options.onDeallocate?.(attribute, amount)));
    }

    return attributeCleanups;
  });

  if (refs.profileSaveAttributesButton && options.onSave) {
    const button = refs.profileSaveAttributesButton;
    const handleClick = () => {
      if (!button.disabled) {
        options.onSave?.();
      }
    };

    button.addEventListener("click", handleClick);
    cleanups.push(() => button.removeEventListener("click", handleClick));
  }

  if (refs.profileResetPointsButton && options.onReset) {
    const button = refs.profileResetPointsButton;
    const handleClick = () => {
      if (!button.disabled) {
        options.onReset?.();
      }
    };

    button.addEventListener("click", handleClick);
    cleanups.push(() => button.removeEventListener("click", handleClick));
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}

function mountAttributeRepeatButton(button: HTMLButtonElement, onChange: (amount: number) => void): () => void {
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

  const change = (amount: number) => {
    if (!button.disabled) {
      onChange(amount);
    }
  };

  const getChangeAmount = (event: MouseEvent | PointerEvent) => (event.ctrlKey ? ATTRIBUTE_CTRL_ALLOCATE_AMOUNT : 1);

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || button.disabled) {
      return;
    }

    const amount = getChangeAmount(event);

    suppressNextClick = true;
    change(amount);
    clearHoldRepeat();
    try {
      button.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; regular pointerup/cancel still clears the repeat.
    }
    holdDelayId = window.setTimeout(() => {
      change(amount);
      holdIntervalId = window.setInterval(() => change(amount), ATTRIBUTE_HOLD_REPEAT_INTERVAL_MS);
    }, ATTRIBUTE_HOLD_REPEAT_DELAY_MS);
  };

  const handleClick = (event: MouseEvent) => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    change(getChangeAmount(event));
  };

  button.addEventListener("pointerdown", handlePointerDown);
  button.addEventListener("pointerup", clearHoldRepeat);
  button.addEventListener("pointercancel", clearHoldRepeat);
  button.addEventListener("lostpointercapture", clearHoldRepeat);
  button.addEventListener("blur", clearHoldRepeat);
  button.addEventListener("click", handleClick);

  return () => {
    clearHoldRepeat();
    button.removeEventListener("pointerdown", handlePointerDown);
    button.removeEventListener("pointerup", clearHoldRepeat);
    button.removeEventListener("pointercancel", clearHoldRepeat);
    button.removeEventListener("lostpointercapture", clearHoldRepeat);
    button.removeEventListener("blur", clearHoldRepeat);
    button.removeEventListener("click", handleClick);
  };
}

function renderCityHeroProfileStats(refs: CityHeroWidgetRefs, hero: HeroState): void {
  const stats = deriveHeroStats(hero);
  const attributeTotals = getHeroAttributeTotals(hero);

  setText(refs.profileStats.damage, formatMeleeDamageProfileStat(stats.meleeDamagePercentBonus));
  setText(refs.profileStats.hp, String(stats.maxHp));
  setText(refs.profileStats.stamina, String(stats.maxStamina));
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

function formatMeleeDamageProfileStat(percentDamageBonus: number): string {
  const percentBonus = Math.round(Math.max(0, percentDamageBonus) * 100);

  return `+${percentBonus}%`;
}

function renderCityHeroProfileEquipment(refs: CityHeroWidgetRefs, hero: HeroState, highlightedEquipmentItems: readonly CityHeroEquipmentHintItem[]): void {
  const equipmentHost = refs.profileEquipment;

  if (!equipmentHost) {
    return;
  }

  const renderKey = getCityHeroProfileEquipmentRenderKey(hero, highlightedEquipmentItems);

  if (equipmentHost.dataset.heroProfileEquipmentRenderKey === renderKey) {
    return;
  }

  equipmentHost.dataset.heroProfileEquipmentRenderKey = renderKey;
  equipmentHost.replaceChildren();

  HERO_PROFILE_EQUIPMENT_GROUPS.forEach((group) => {
    const hintItem = highlightedEquipmentItems.find((hint) => group.slots.includes(hint.slotKey));
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
    const label = items.length > 0 ? `${group.label}: ${items.map((item) => getShopProductDisplayName(item.name)).join(", ")}` : `${group.label}: empty`;
    const card = createEquipmentSlotCard({
      classNames: [
        "city-profile__equipment-card",
        `city-profile__equipment-card--${group.modifier}`,
        `city-profile__equipment-card--${rarity}`,
        hintItem ? "city-profile__equipment-card--hint" : "",
      ],
      iconClassNames: ["city-profile__equipment-icon"],
      rarity,
      rarityClassName: rarity !== "empty" ? `armory-shop__option--rarity-${rarity}` : undefined,
      iconUrl,
      fallbackText: group.icon,
      label,
      dataset: {
        heroEquipmentCategory: hintItem?.categoryId ?? getProfileEquipmentCategoryId(group, hero.equipment),
        heroEquipmentHint: hintItem ? "true" : undefined,
      },
    });

    equipmentHost.append(card);
  });
}

function getCityHeroProfileEquipmentRenderKey(hero: HeroState, highlightedEquipmentItems: readonly CityHeroEquipmentHintItem[]): string {
  const equipmentKey = HERO_PROFILE_EQUIPMENT_GROUPS.flatMap((group) =>
    group.slots.map((slotKey) => `${slotKey}:${hero.equipment[slotKey] ?? ""}`),
  ).join("|");
  const hintKey = [...highlightedEquipmentItems]
    .map((hint) => `${hint.slotKey}:${hint.itemId}:${hint.categoryId}`)
    .sort()
    .join("|");

  return `${equipmentKey}::${hintKey}`;
}

function getHighlightedCityEquipmentItems(itemIds: readonly HeroItemId[] | undefined): CityHeroEquipmentHintItem[] {
  const seenItemIds = new Set<HeroItemId>();

  return (itemIds ?? []).flatMap((itemId): CityHeroEquipmentHintItem[] => {
    if (seenItemIds.has(itemId)) {
      return [];
    }

    const item = HERO_ITEM_CATALOG[itemId];
    const categoryId = getCityEquipmentCategoryIdForHeroItemId(itemId);

    if (!item || !categoryId) {
      return [];
    }

    seenItemIds.add(itemId);
    return [{ itemId, slotKey: item.equipmentSlot, categoryId }];
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
      <div class="city-equipment-menu__stage">
        <div class="city-equipment-menu__hero-preview" aria-hidden="true"></div>
        <div class="city-equipment-menu__equipped-slots" aria-label="Equipped armor"></div>
        <div class="city-equipment-menu__weapon-slots" aria-label="Equipped weapons"></div>
        <div class="city-equipment-menu__details" hidden>
          <button class="city-equipment-menu__details-close" type="button" aria-label="Close item details">x</button>
          <span class="city-equipment-menu__details-icon" aria-hidden="true"></span>
          <strong class="city-equipment-menu__details-name"></strong>
          <div class="city-equipment-menu__details-chips">
            <span class="city-equipment-menu__details-rarity"></span>
            <span class="city-equipment-menu__details-kind"></span>
            <span class="city-equipment-menu__details-stat"></span>
            <span class="city-equipment-menu__details-equipped" hidden>EQUIPPED</span>
          </div>
          <div class="city-equipment-menu__details-set" hidden></div>
          <button class="city-equipment-menu__details-equip" type="button">EQUIP</button>
        </div>
      </div>
      <div class="city-equipment-menu__inventory">
        <div class="city-equipment-menu__filters">
          <svg class="city-equipment-menu__filter-outline" viewBox="0 0 100 100" aria-hidden="true">
            <path class="city-equipment-menu__filter-outline-path city-equipment-menu__filter-outline-path--weapon" />
            <path class="city-equipment-menu__filter-outline-path city-equipment-menu__filter-outline-path--armor" />
          </svg>
          <div class="city-equipment-menu__categories city-equipment-menu__categories--weapon" aria-label="Weapon filters"></div>
          <div class="city-equipment-menu__filter-actions" aria-label="Equipment filter actions"></div>
          <div class="city-equipment-menu__categories city-equipment-menu__categories--armor" aria-label="Armor filters"></div>
        </div>
        <div class="city-equipment-menu__products" aria-label="Owned equipment"></div>
      </div>
    </div>
  `;

  return {
    root,
    stage: root.querySelector<HTMLElement>(".city-equipment-menu__stage"),
    heroPreview: root.querySelector<HTMLElement>(".city-equipment-menu__hero-preview"),
    equippedSlots: root.querySelector<HTMLElement>(".city-equipment-menu__equipped-slots"),
    weaponSlots: root.querySelector<HTMLElement>(".city-equipment-menu__weapon-slots"),
    details: root.querySelector<HTMLElement>(".city-equipment-menu__details"),
    detailsCloseButton: root.querySelector<HTMLButtonElement>(".city-equipment-menu__details-close"),
    detailsIcon: root.querySelector<HTMLElement>(".city-equipment-menu__details-icon"),
    detailsName: root.querySelector<HTMLElement>(".city-equipment-menu__details-name"),
    detailsChips: root.querySelector<HTMLElement>(".city-equipment-menu__details-chips"),
    detailsRarity: root.querySelector<HTMLElement>(".city-equipment-menu__details-rarity"),
    detailsKind: root.querySelector<HTMLElement>(".city-equipment-menu__details-kind"),
    detailsStat: root.querySelector<HTMLElement>(".city-equipment-menu__details-stat"),
    detailsEquipped: root.querySelector<HTMLElement>(".city-equipment-menu__details-equipped"),
    detailsSet: root.querySelector<HTMLElement>(".city-equipment-menu__details-set"),
    detailsEquipButton: root.querySelector<HTMLButtonElement>(".city-equipment-menu__details-equip"),
    inventory: root.querySelector<HTMLElement>(".city-equipment-menu__inventory"),
    filterOutline: root.querySelector<SVGSVGElement>(".city-equipment-menu__filter-outline"),
    filterOutlineWeapon: root.querySelector<SVGPathElement>(".city-equipment-menu__filter-outline-path--weapon"),
    filterOutlineArmor: root.querySelector<SVGPathElement>(".city-equipment-menu__filter-outline-path--armor"),
    weaponCategories: root.querySelector<HTMLElement>(".city-equipment-menu__categories--weapon"),
    filterActions: root.querySelector<HTMLElement>(".city-equipment-menu__filter-actions"),
    armorCategories: root.querySelector<HTMLElement>(".city-equipment-menu__categories--armor"),
    productGrid: root.querySelector<HTMLElement>(".city-equipment-menu__products"),
  };
}

function createCityAppearanceMenuElements(): CityAppearanceMenuElements {
  const root = document.createElement("section");

  root.className = "city-appearance-menu";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Appearance");
  root.innerHTML = `
    <div class="city-appearance-menu__panel">
      <button class="city-appearance-menu__close" type="button" aria-label="Close appearance">x</button>
      <div class="city-appearance-menu__title">APPEARANCE</div>
      <div class="city-appearance-menu__tabs" aria-label="Appearance categories"></div>
      <div class="city-appearance-menu__grid" aria-label="Appearance options"></div>
    </div>
  `;

  return {
    root,
    closeButton: root.querySelector<HTMLButtonElement>(".city-appearance-menu__close"),
    tabs: root.querySelector<HTMLElement>(".city-appearance-menu__tabs"),
    grid: root.querySelector<HTMLElement>(".city-appearance-menu__grid"),
  };
}

function renderCityAppearanceTabs(menu: CityAppearanceMenuElements, activeSlot: HeroAppearanceSlotKey): void {
  if (!menu.tabs) {
    return;
  }

  menu.tabs.replaceChildren(
    ...CITY_APPEARANCE_SLOT_OPTIONS.map((option) => {
      const button = document.createElement("button");

      button.className = "city-appearance-menu__tab";
      button.classList.toggle("city-appearance-menu__tab--active", option.slot === activeSlot);
      button.type = "button";
      button.dataset.heroAppearanceTab = option.slot;
      button.textContent = option.label;

      return button;
    }),
  );
}

function renderCityAppearanceOptions(menu: CityAppearanceMenuElements, hero: HeroState, activeSlot: HeroAppearanceSlotKey): void {
  if (!menu.grid) {
    return;
  }

  const selectedId = getHeroAppearanceSlotValue(hero.appearance, activeSlot);
  const assets = HERO_APPEARANCE_ASSETS_BY_SLOT[activeSlot];
  const noneButton = createCityAppearanceOptionButton(activeSlot, null, "None", selectedId === null);
  const assetButtons = assets.map((asset) => createCityAppearanceAssetOptionButton(asset, selectedId === asset.id));

  menu.grid.replaceChildren(noneButton, ...assetButtons);
}

function createCityAppearanceAssetOptionButton(asset: HeroAppearanceAssetDefinition, selected: boolean): HTMLButtonElement {
  const button = createCityAppearanceOptionButton(asset.slot, asset.id, asset.label, selected);
  const image = document.createElement("span");

  image.className = "city-appearance-menu__option-image";
  image.style.backgroundImage = `url("${asset.url}")`;
  button.prepend(image);

  return button;
}

function createCityAppearanceOptionButton(
  slot: HeroAppearanceSlotKey,
  id: string | null,
  labelText: string,
  selected: boolean,
): HTMLButtonElement {
  const button = document.createElement("button");
  const label = document.createElement("span");

  button.className = "city-appearance-menu__option";
  button.classList.toggle("city-appearance-menu__option--selected", selected);
  button.classList.toggle("city-appearance-menu__option--empty", id === null);
  button.type = "button";
  button.dataset.heroAppearanceSlot = slot;
  button.dataset.heroAppearanceOption = id ?? "";
  label.className = "city-appearance-menu__option-label";
  label.textContent = labelText;
  button.append(label);

  return button;
}

function normalizeHeroAppearanceSlotKey(value: unknown): HeroAppearanceSlotKey {
  return value === "beard" ? "beard" : "hair";
}

function getHeroAppearanceSlotValue(appearance: HeroAppearance | undefined, slot: HeroAppearanceSlotKey): string | null {
  return slot === "hair" ? (appearance?.hairId ?? null) : (appearance?.beardId ?? null);
}

function createHeroAppearancePatch(slot: HeroAppearanceSlotKey, id: string | null): Partial<HeroAppearance> {
  return slot === "hair" ? { hairId: id } : { beardId: id };
}

function renderCityEquipmentPaperDoll(menu: CityEquipmentMenuElements, hero: HeroState): void {
  const host = menu.equippedSlots;

  if (!host) {
    return;
  }

  const groups = getCityEquipmentPaperDollGroups();
  const renderKey = groups.flatMap((group) => group.slots.map((slotKey) => `${slotKey}:${hero.equipment[slotKey] ?? ""}`)).join("|");

  if (host.dataset.cityEquipmentPaperDollRenderKey === renderKey) {
    return;
  }

  host.dataset.cityEquipmentPaperDollRenderKey = renderKey;
  host.replaceChildren(...groups.map((group) => createCityEquipmentPaperDollSlot(group, hero)));
}

function getCityEquipmentPaperDollGroups(): (typeof HERO_PROFILE_EQUIPMENT_GROUPS)[number][] {
  return HERO_PROFILE_EQUIPMENT_GROUPS.filter((group) => group.categoryId !== "swords" && group.categoryId !== "bows");
}

function createCityEquipmentPaperDollSlot(group: (typeof HERO_PROFILE_EQUIPMENT_GROUPS)[number], hero: HeroState): HTMLElement {
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
  const slot = document.createElement("button");
  const icon = document.createElement("span");
  const label = items.length > 0
    ? `${group.label}: ${items.map((item) => getShopProductDisplayName(item.name)).join(", ")}`
    : `${group.label}: empty`;

  slot.type = "button";
  slot.className = [
    "city-equipment-menu__slot",
    `city-equipment-menu__slot--${group.modifier}`,
    `city-equipment-menu__slot--${rarity}`,
    rarity !== "empty" ? `armory-shop__option--rarity-${rarity}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  slot.dataset.cityEquipmentSlotCategory = group.categoryId;
  if (itemIds.length > 0) {
    slot.dataset.cityEquipmentSlotProductKey = getCityEquipmentItemIdsKey(itemIds);
  }
  slot.setAttribute("aria-label", label);
  slot.title = label;
  icon.className = "city-equipment-menu__slot-icon";

  if (iconUrl) {
    icon.style.backgroundImage = `url("${iconUrl}")`;
  } else {
    icon.textContent = group.icon;
  }

  slot.append(icon);

  return slot;
}

function getCityEquipmentProfilePreviewLayout(menu: CityEquipmentMenuElements): CityEquipmentProfilePreviewLayout | undefined {
  const stageRect = menu.stage?.getBoundingClientRect();

  if (!stageRect || stageRect.width <= 0 || stageRect.height <= 0) {
    return undefined;
  }

  syncCityEquipmentWeaponSlotsPosition(menu, stageRect);

  const weaponSlotsRect = menu.weaponSlots?.getBoundingClientRect();
  const headSlotRect = getCityEquipmentProfilePreviewSlotRect(menu, "head");
  const sideFitRect = getCityEquipmentProfilePreviewSideFitRect(menu);
  const visualBottomY =
    weaponSlotsRect && weaponSlotsRect.width > 0 && weaponSlotsRect.height > 0
      ? weaponSlotsRect.top
      : stageRect.bottom - stageRect.height * 0.1;
  const fallbackCenterX = stageRect.left + stageRect.width / 2;

  return {
    centerX: sideFitRect ? sideFitRect.left + sideFitRect.width / 2 : fallbackCenterX,
    visualBottomY,
    fitTopY: headSlotRect ? headSlotRect.bottom : stageRect.top,
    fitWidth: sideFitRect?.width ?? stageRect.width,
  };
}

function syncCityEquipmentWeaponSlotsPosition(menu: CityEquipmentMenuElements, stageRect: DOMRect): void {
  const host = menu.weaponSlots;
  const topY = getCityEquipmentWeaponSlotsTopY(menu);

  if (!host) {
    return;
  }

  if (typeof topY !== "number" || !Number.isFinite(topY)) {
    host.style.removeProperty("top");
    host.style.removeProperty("bottom");
    return;
  }

  host.style.top = `${Math.max(0, topY - stageRect.top)}px`;
  host.style.bottom = "auto";
}

function getCityEquipmentWeaponSlotsTopY(menu: CityEquipmentMenuElements): number | undefined {
  const glovesRect = getCityEquipmentProfilePreviewSlotRect(menu, "gloves");
  const bootsRect = getCityEquipmentProfilePreviewSlotRect(menu, "boots");
  const bottoms = [glovesRect?.bottom, bootsRect?.bottom].filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return bottoms.length > 0 ? Math.max(...bottoms) : undefined;
}

function getCityEquipmentProfilePreviewSlotRect(
  menu: CityEquipmentMenuElements,
  modifier: (typeof HERO_PROFILE_EQUIPMENT_GROUPS)[number]["modifier"],
): DOMRect | undefined {
  const slot = menu.equippedSlots?.querySelector<HTMLElement>(`.city-equipment-menu__slot--${modifier}`);
  const rect = slot?.getBoundingClientRect();

  return rect && rect.width > 0 && rect.height > 0 ? rect : undefined;
}

function getCityEquipmentProfilePreviewSideFitRect(menu: CityEquipmentMenuElements): CityEquipmentProfilePreviewSideFitRect | undefined {
  const leftRects = CITY_EQUIPMENT_PROFILE_PREVIEW_LEFT_SLOT_MODIFIERS.flatMap((modifier) => {
    const rect = getCityEquipmentProfilePreviewSlotRect(menu, modifier);

    return rect ? [rect] : [];
  });
  const rightRects = CITY_EQUIPMENT_PROFILE_PREVIEW_RIGHT_SLOT_MODIFIERS.flatMap((modifier) => {
    const rect = getCityEquipmentProfilePreviewSlotRect(menu, modifier);

    return rect ? [rect] : [];
  });

  if (leftRects.length === 0 || rightRects.length === 0) {
    return undefined;
  }

  const left = Math.max(...leftRects.map((rect) => rect.right));
  const right = Math.min(...rightRects.map((rect) => rect.left));
  const width = right - left;

  if (width <= 0) {
    return undefined;
  }

  return { left, width };
}

function renderCityEquipmentWeaponSlots(menu: CityEquipmentMenuElements, hero: HeroState): void {
  const host = menu.weaponSlots;

  if (!host) {
    return;
  }

  const renderKey = getCityEquipmentWeaponSlotsRenderKey(hero);

  if (host.dataset.cityEquipmentWeaponSlotsRenderKey === renderKey) {
    return;
  }

  host.dataset.cityEquipmentWeaponSlotsRenderKey = renderKey;
  host.replaceChildren(...CITY_EQUIPMENT_WEAPON_SLOT_GROUPS.map((group) => createCityEquipmentWeaponSlot(group, hero)));
}

function createCityEquipmentWeaponSlot(group: (typeof CITY_EQUIPMENT_WEAPON_SLOT_GROUPS)[number], hero: HeroState): HTMLElement {
  const itemId = getCityEquipmentWeaponSlotItemId(group, hero);
  const itemIds = itemId ? [itemId] : [];
  const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;
  const iconUrl = getShopProductIconUrl(itemIds);
  const rarity = itemIds.length > 0 ? getShopProductRarity(itemIds) : "empty";
  const categoryId = getCityEquipmentWeaponSlotCategoryId(group, itemId);
  const quantity = getCityEquipmentWeaponSlotQuantity(group, hero, itemId);
  const label = item
    ? `${group.label}: ${getShopProductDisplayName(item.name)}${quantity > 0 ? ` x${quantity}` : ""}`
    : `${group.label}: empty`;
  return createEquipmentSlotCard({
    classNames: [
      "armory-shop__equipped-slot",
      "weapon-shop__equipped-slot",
      "city-equipment-menu__weapon-slot",
      `armory-shop__equipped-slot--${group.modifier}`,
      `armory-shop__equipped-slot--area-${group.area}`,
      `armory-shop__equipped-slot--${rarity}`,
    ],
    iconClassNames: ["armory-shop__equipped-icon"],
    rarity,
    rarityClassName: rarity !== "empty" ? `armory-shop__option--rarity-${rarity}` : undefined,
    iconUrl,
    label,
    dataset: {
      cityEquipmentSlotCategory: categoryId,
      cityEquipmentSlotProductKey: itemIds.length > 0 ? getCityEquipmentItemIdsKey(itemIds) : undefined,
    },
    count: quantity > 0 ? quantity : undefined,
    countClassName: "weapon-shop__equipped-count",
  });
}

function getCityEquipmentWeaponSlotCategoryId(
  group: (typeof CITY_EQUIPMENT_WEAPON_SLOT_GROUPS)[number],
  itemId: HeroItemId | undefined,
): CityEquipmentCategoryId {
  const itemCategoryId = itemId ? getCityEquipmentCategoryIdForHeroItemId(itemId) : undefined;

  if (itemCategoryId) {
    return itemCategoryId;
  }

  if (group.id === "bow") {
    return "bows";
  }

  if (group.id === "shuriken") {
    return "shurikens";
  }

  return "swords";
}

function getCityEquipmentWeaponSlotItemId(group: (typeof CITY_EQUIPMENT_WEAPON_SLOT_GROUPS)[number], hero: HeroState): HeroItemId | undefined {
  if (group.slot) {
    return hero.equipment[group.slot] ?? undefined;
  }

  return group.id === "shuriken" ? getHeroShurikenItemId(hero) : undefined;
}

function getCityEquipmentWeaponSlotQuantity(
  group: (typeof CITY_EQUIPMENT_WEAPON_SLOT_GROUPS)[number],
  hero: HeroState,
  itemId: HeroItemId | undefined,
): number {
  if (group.id !== "shuriken" || !itemId) {
    return 0;
  }

  return getHeroItemQuantity(hero, itemId);
}

function getCityEquipmentWeaponSlotsRenderKey(hero: HeroState): string {
  return CITY_EQUIPMENT_WEAPON_SLOT_GROUPS.map((group) => {
    const itemId = getCityEquipmentWeaponSlotItemId(group, hero);
    const quantity = getCityEquipmentWeaponSlotQuantity(group, hero, itemId);

    return `${group.id}:${itemId ?? ""}:${quantity}`;
  }).join("|");
}

function renderCityEquipmentDetails(menu: CityEquipmentMenuElements, product: CityEquipmentProduct | undefined, hero: HeroState): void {
  if (!menu.details) {
    return;
  }

  menu.details.hidden = !product;

  if (!product) {
    return;
  }

  const iconUrl = getShopProductIconUrl(product.itemIds);
  const rarity = getShopProductRarity(product.itemIds);
  const statKind = getCityEquipmentProductStatKind(product);
  const statLabel = statKind === "armor" ? "ARMOR" : "DAMAGE";
  const statValue = getShopProductDisplayStat(hero, product.itemIds, statKind);
  const currentStat = getEquippedShopProductDisplayStat(hero, product.itemIds, statKind);
  const isEquipped = areHeroItemsEquipped(hero, product.itemIds);
  const firstItem = product.itemIds.map((itemId) => HERO_ITEM_CATALOG[itemId]).find(Boolean);
  const previewEquipment = createHeroPreviewEquipment(hero.equipment, product.itemIds);
  const setBonusSummary = firstItem ? getHeroEquipmentSetBonusSummary(firstItem, previewEquipment) : undefined;

  menu.details.className = [
    "city-equipment-menu__details",
    `city-equipment-menu__details--${rarity}`,
    `armory-shop__option--rarity-${rarity}`,
    isEquipped ? "city-equipment-menu__details--equipped" : "",
  ].join(" ");

  if (menu.detailsIcon) {
    menu.detailsIcon.style.backgroundImage = iconUrl ? `url("${iconUrl}")` : "";
    menu.detailsIcon.textContent = iconUrl ? "" : "?";
  }

  setText(menu.detailsName, getShopProductDisplayName(product.name).toUpperCase());
  setText(menu.detailsRarity, getShopRarityLabel(rarity).toUpperCase());
  setText(menu.detailsKind, getCityEquipmentProductTypeLabel(product));
  if (menu.detailsEquipped) {
    menu.detailsEquipped.hidden = !isEquipped;
  }

  if (menu.detailsStat) {
    const statText = isEquipped || currentStat === statValue ? `${statValue}` : `${currentStat} > ${statValue}`;

    menu.detailsStat.classList.toggle("city-equipment-menu__details-stat--armor", statKind === "armor");
    menu.detailsStat.classList.toggle("city-equipment-menu__details-stat--damage", statKind === "damage");
    menu.detailsStat.style.setProperty("--city-equipment-stat-icon", `url("${statKind === "armor" ? DAMAGE_BLOCK_ICON_ASSET_URL : DAMAGE_HIT_ICON_ASSET_URL}")`);
    menu.detailsStat.setAttribute("aria-label", `${statLabel} ${statText}`);
    menu.detailsStat.title = `${statLabel} ${statText}`;
    menu.detailsStat.textContent = statText;
  }

  renderCityEquipmentDetailsSet(menu.detailsSet, setBonusSummary);

  if (menu.detailsEquipButton) {
    menu.detailsEquipButton.disabled = false;
    menu.detailsEquipButton.textContent = isEquipped ? "UNEQUIP" : "EQUIP";
  }
}

function renderCityEquipmentDetailsSet(element: HTMLElement | null, summary: ReturnType<typeof getHeroEquipmentSetBonusSummary>): void {
  if (!element) {
    return;
  }

  element.replaceChildren();
  element.hidden = !summary;

  if (!summary) {
    return;
  }

  const label = document.createElement("span");

  label.className = "city-equipment-menu__details-set-name";
  label.textContent = summary.label;
  element.append(label);

  summary.bonuses.forEach((bonus) => {
    const row = document.createElement("span");

    row.className = "city-equipment-menu__details-set-bonus";
    row.classList.toggle("city-equipment-menu__details-set-bonus--active", bonus.active);
    row.classList.toggle("city-equipment-menu__details-set-bonus--inactive", !bonus.active);
    row.textContent = `(${bonus.pieces}) ${bonus.label}`;
    element.append(row);
  });
}

function renderCityEquipmentCategories(
  host: HTMLElement | null,
  categories: readonly CityEquipmentCategory[],
  activeCategoryIds: ReadonlySet<CityEquipmentCategoryId>,
): void {
  if (!host) {
    return;
  }

  const buttons = categories.map((category) => {
    const button = document.createElement("button");
    const icon = document.createElement("span");
    const iconUrl = getCityEquipmentCategoryIconUrl(category);

    button.type = "button";
    button.className = "city-equipment-menu__category";
    button.classList.toggle("city-equipment-menu__category--active", activeCategoryIds.has(category.id));
    button.dataset.cityEquipmentCategory = category.id;
    button.setAttribute("aria-label", category.label);
    button.setAttribute("aria-pressed", String(activeCategoryIds.has(category.id)));
    icon.className = "city-equipment-menu__category-icon";

    if (iconUrl) {
      icon.style.backgroundImage = `url("${iconUrl}")`;
    } else {
      icon.textContent = category.label.slice(0, 1);
    }

    button.append(icon);

    return button;
  });

  host.replaceChildren(...buttons);
}

function renderCityEquipmentFilterActions(host: HTMLElement | null, activeCategoryIds: ReadonlySet<CityEquipmentCategoryId>): void {
  if (!host) {
    return;
  }

  host.replaceChildren(
    createCityEquipmentSideAllButton("weapon", getCityEquipmentSideAllAriaLabel("weapon"), activeCategoryIds),
    createCityEquipmentFilterButton(),
    createCityEquipmentSideAllButton("armor", getCityEquipmentSideAllAriaLabel("armor"), activeCategoryIds),
  );
}

function syncCityEquipmentFilterOutline(menu: CityEquipmentMenuElements): void {
  const filterOutline = menu.filterOutline;
  const weaponPath = menu.filterOutlineWeapon;
  const armorPath = menu.filterOutlineArmor;
  const weaponCategories = menu.weaponCategories;
  const armorCategories = menu.armorCategories;
  const weaponAll = menu.filterActions?.querySelector<HTMLElement>(".city-equipment-menu__category--weapon-all");
  const armorAll = menu.filterActions?.querySelector<HTMLElement>(".city-equipment-menu__category--armor-all");
  const filters = filterOutline?.closest<HTMLElement>(".city-equipment-menu__filters");

  if (!filterOutline || !weaponPath || !armorPath || !weaponCategories || !armorCategories || !weaponAll || !armorAll || !filters) {
    return;
  }

  const filterRect = filters.getBoundingClientRect();

  if (filterRect.width <= 0 || filterRect.height <= 0) {
    return;
  }

  const armorAllRect = getCityEquipmentLocalRect(armorAll, filterRect);

  filterOutline.setAttribute("viewBox", `0 0 ${formatSvgPathNumber(filterRect.width)} ${formatSvgPathNumber(filterRect.height)}`);
  weaponPath.setAttribute(
    "d",
    createCityEquipmentFilterOutlinePath(
      getCityEquipmentLocalRect(weaponCategories, filterRect),
      getCityEquipmentLocalRect(weaponAll, filterRect),
      "weapon",
      filterRect.width,
      armorAllRect.bottom,
    ),
  );
  armorPath.setAttribute(
    "d",
    createCityEquipmentFilterOutlinePath(
      getCityEquipmentLocalRect(armorCategories, filterRect),
      armorAllRect,
      "armor",
      filterRect.width,
      armorAllRect.bottom,
    ),
  );
}

interface CityEquipmentLocalRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function getCityEquipmentLocalRect(element: HTMLElement, rootRect: DOMRect): CityEquipmentLocalRect {
  const rect = element.getBoundingClientRect();

  return {
    left: rect.left - rootRect.left,
    top: rect.top - rootRect.top,
    right: rect.right - rootRect.left,
    bottom: rect.bottom - rootRect.top,
  };
}

function createCityEquipmentFilterOutlinePath(
  categoryRect: CityEquipmentLocalRect,
  allRect: CityEquipmentLocalRect,
  side: CityEquipmentCategorySide,
  rootWidth: number,
  sharedBottom: number,
): string {
  const outlineInset = 2;
  const bevel = 3;

  if (side === "weapon") {
    const left = outlineInset;
    const top = Math.min(categoryRect.top, allRect.top) + outlineInset;
    const right = allRect.right - outlineInset;
    const allBottom = allRect.bottom - outlineInset;
    const innerRight = categoryRect.right - outlineInset;
    const bottom = sharedBottom - outlineInset;

    return createBeveledSvgPath([
      [left, top],
      [right, top],
      [right, allBottom],
      [innerRight, allBottom],
      [innerRight, bottom],
      [left, bottom],
    ], bevel);
  }

  const right = rootWidth - outlineInset;
  const top = categoryRect.top + outlineInset;
  const left = allRect.left + outlineInset;
  const bottom = sharedBottom - outlineInset;
  const allTop = allRect.top + outlineInset;
  const innerLeft = categoryRect.left + outlineInset;

  return createBeveledSvgPath([
    [innerLeft, top],
    [right, top],
    [right, bottom],
    [left, bottom],
    [left, allTop],
    [innerLeft, allTop],
  ], bevel);
}

function createBeveledSvgPath(points: readonly (readonly [number, number])[], bevel: number): string {
  if (points.length < 3) {
    return "";
  }

  const commands: string[] = [];

  points.forEach((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length]!;
    const next = points[(index + 1) % points.length]!;
    const entry = moveSvgPointToward(point, previous, bevel);
    const exit = moveSvgPointToward(point, next, bevel);

    if (index === 0) {
      commands.push(`M ${formatSvgPathNumber(entry[0])} ${formatSvgPathNumber(entry[1])}`);
    } else {
      commands.push(`L ${formatSvgPathNumber(entry[0])} ${formatSvgPathNumber(entry[1])}`);
    }

    commands.push(`L ${formatSvgPathNumber(exit[0])} ${formatSvgPathNumber(exit[1])}`);
  });

  commands.push("Z");

  return commands.join(" ");
}

function moveSvgPointToward(
  point: readonly [number, number],
  target: readonly [number, number],
  distance: number,
): [number, number] {
  const deltaX = target[0] - point[0];
  const deltaY = target[1] - point[1];
  const length = Math.hypot(deltaX, deltaY);

  if (length <= 0) {
    return [point[0], point[1]];
  }

  const offset = Math.min(distance, length / 2);

  return [
    point[0] + (deltaX / length) * offset,
    point[1] + (deltaY / length) * offset,
  ];
}

function formatSvgPathNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function createCityEquipmentSideAllButton(
  side: CityEquipmentCategorySide,
  ariaLabel: string,
  activeCategoryIds: ReadonlySet<CityEquipmentCategoryId>,
): HTMLButtonElement {
  const button = document.createElement("button");
  const label = document.createElement("span");
  const isActive = isCityEquipmentSideAllSelected(activeCategoryIds, side);

  button.type = "button";
  button.className = [
    "city-equipment-menu__category",
    "city-equipment-menu__category--all",
    "city-equipment-menu__category--side-all",
    `city-equipment-menu__category--${side}-all`,
  ].join(" ");
  button.classList.toggle("city-equipment-menu__category--active", isActive);
  button.dataset.cityEquipmentSideAll = side;
  button.setAttribute("aria-label", ariaLabel);
  button.setAttribute("aria-pressed", String(isActive));
  label.className = "city-equipment-menu__category-label";
  label.textContent = "All";
  button.append(label);

  return button;
}

function getCityEquipmentSideAllAriaLabel(side: CityEquipmentCategorySide): string {
  return side === "weapon" ? "All weapons" : "All armor";
}

function createCityEquipmentFilterButton(): HTMLButtonElement {
  const button = document.createElement("button");
  const icon = document.createElement("span");

  button.type = "button";
  button.className = "city-equipment-menu__category city-equipment-menu__category--filter";
  button.dataset.cityEquipmentFilter = "true";
  button.setAttribute("aria-label", "Filter equipment");
  button.setAttribute("aria-pressed", "false");
  icon.className = "city-equipment-menu__category-icon city-equipment-menu__category-icon--filter";
  button.append(icon);

  return button;
}

function getNextCityEquipmentSideAllSelection(
  activeCategoryIds: ReadonlySet<CityEquipmentCategoryId>,
  side: CityEquipmentCategorySide,
): Set<CityEquipmentCategoryId> {
  if (isCityEquipmentOnlySideAllSelected(activeCategoryIds, side)) {
    return new Set();
  }

  return new Set(getCityEquipmentSideCategoryIds(side));
}

function isCityEquipmentSideAllSelected(activeCategoryIds: ReadonlySet<CityEquipmentCategoryId>, side: CityEquipmentCategorySide): boolean {
  return activeCategoryIds.size === 0 || isCityEquipmentOnlySideAllSelected(activeCategoryIds, side);
}

function isCityEquipmentOnlySideAllSelected(activeCategoryIds: ReadonlySet<CityEquipmentCategoryId>, side: CityEquipmentCategorySide): boolean {
  const sideCategoryIds = getCityEquipmentSideCategoryIds(side);

  return activeCategoryIds.size === sideCategoryIds.length && sideCategoryIds.every((categoryId) => activeCategoryIds.has(categoryId));
}

function getCityEquipmentSideCategoryIds(side: CityEquipmentCategorySide): CityEquipmentCategoryId[] {
  const categories = side === "weapon" ? CITY_EQUIPMENT_WEAPON_CATEGORIES : CITY_EQUIPMENT_ARMOR_CATEGORIES;

  return categories.map((category) => category.id);
}

function renderCityEquipmentProducts(
  host: HTMLElement | null,
  selectedCategories: readonly CityEquipmentCategory[],
  products: readonly CityEquipmentProduct[],
  selectedProduct: CityEquipmentProduct | undefined,
  hero: HeroState,
): void {
  if (!host) {
    return;
  }

  if (selectedCategories.length <= 0) {
    const empty = document.createElement("span");

    empty.className = "city-equipment-menu__empty";
    empty.textContent = "SELECT CATEGORY";
    host.replaceChildren(empty);
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
      const side = getCityEquipmentProductSide(product);
      const statKind = getCityEquipmentProductStatKind(product);
      const statValue = getShopProductDisplayStat(hero, product.itemIds, statKind);
      const currentStat = getEquippedShopProductDisplayStat(hero, product.itemIds, statKind);
      const statLabel = statKind === "armor" ? "Armor" : "Damage";
      const statIconUrl = statKind === "armor" ? DAMAGE_BLOCK_ICON_ASSET_URL : DAMAGE_HIT_ICON_ASSET_URL;
      const diff = statValue - currentStat;
      const isEquipped = areHeroItemsEquipped(hero, product.itemIds);
      const displayName = getShopProductDisplayName(product.name);
      const button = document.createElement("button");

      button.type = "button";
      button.className = [
        "equipment-item-card",
        "city-equipment-menu__item",
        `city-equipment-menu__item--${side}`,
        `armory-shop__option--rarity-${rarity}`,
        selectedProduct?.id === product.id ? "equipment-item-card--selected" : "",
        selectedProduct?.id === product.id ? "city-equipment-menu__item--selected" : "",
        isEquipped ? "equipment-item-card--equipped" : "",
        isEquipped ? "city-equipment-menu__item--equipped" : "",
      ]
        .filter(Boolean)
        .join(" ");
      button.dataset.cityEquipmentProduct = product.id;
      button.setAttribute("aria-label", `${displayName}, ${statLabel} ${statValue}`);
      button.append(
        createEquipmentItemCardContent({
          iconUrl,
          name: displayName,
          rarityLabel: getShopRarityLabel(rarity),
          statIconUrl,
          statLabel,
          statValue,
          diff,
          levelRequirement: getShopProductLevelRequirement(product.itemIds),
          action: isEquipped ? { kind: "status", label: "Equipped", state: "equipped" } : undefined,
        }),
      );

      return button;
    }),
  );
}

function getOwnedCityEquipmentProducts(hero: HeroState, category: CityEquipmentCategory): CityEquipmentProduct[] {
  const shopProducts =
    category.side === "armor"
      ? getGeneratedArmoryProductsForSlots(category.slots ?? []).map(toCityEquipmentProduct)
      : GENERATED_WEAPON_PRODUCTS.filter((product) => product.categoryId === category.id).map(toCityEquipmentProduct);
  const equipmentShopProducts = shopProducts.filter((product) => !areHeroItemsConsumable(product.itemIds));
  const inventoryProducts = pairGeneratedArmoryProducts(
    getInventoryCityEquipmentProducts(hero, category, equipmentShopProducts).map((product) => ({
      ...product,
      price: 0,
    })),
  ).map(toCityEquipmentProduct);
  const products = [...equipmentShopProducts, ...inventoryProducts];

  return products.filter((product) => areHeroItemsOwned(hero, product.itemIds)).sort(compareCityEquipmentProducts);
}

function getSelectedCityEquipmentCategories(categoryIds: ReadonlySet<CityEquipmentCategoryId>): CityEquipmentCategory[] {
  return categoryIds.size <= 0 ? [...CITY_EQUIPMENT_CATEGORIES] : CITY_EQUIPMENT_CATEGORIES.filter((category) => categoryIds.has(category.id));
}

function getOwnedCityEquipmentProductsForCategories(hero: HeroState, categories: readonly CityEquipmentCategory[]): CityEquipmentProduct[] {
  const productsByKey = new Map<string, CityEquipmentProduct>();

  categories.forEach((category) => {
    getOwnedCityEquipmentProducts(hero, category).forEach((product) => {
      productsByKey.set(getCityEquipmentProductKey(product), product);
    });
  });

  return [...productsByKey.values()].sort(compareCityEquipmentProducts);
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

  return item.kind === "weapon" && !isHeroConsumableItem(item) && getCityWeaponCategoryId(item) === category.id;
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

export function getCityEquipmentCategoryIdForHeroItemId(itemId: HeroItemId): CityEquipmentCategoryId | undefined {
  const item = HERO_ITEM_CATALOG[itemId];

  if (!item || isHeroConsumableItem(item)) {
    return undefined;
  }

  if (item.kind === "weapon") {
    return getCityWeaponCategoryId(item);
  }

  return CITY_EQUIPMENT_ARMOR_CATEGORIES.find((category) => category.slots?.includes(item.equipmentSlot))?.id;
}

function getCityEquipmentProductKey(product: CityEquipmentProduct): string {
  return getCityEquipmentItemIdsKey(product.itemIds);
}

function getCityEquipmentItemIdsKey(itemIds: readonly HeroItemId[]): string {
  return itemIds.slice().sort().join("|");
}

function getCityEquipmentProductSide(product: CityEquipmentProduct): CityEquipmentCategorySide {
  return product.itemIds.some((itemId) => HERO_ITEM_CATALOG[itemId]?.kind === "armor") ? "armor" : "weapon";
}

function getCityEquipmentProductTypeLabel(product: CityEquipmentProduct): string {
  const itemId = product.itemIds.find((candidateId) => Boolean(HERO_ITEM_CATALOG[candidateId]));
  const item = itemId ? HERO_ITEM_CATALOG[itemId] : undefined;

  if (!itemId || !item) {
    return "ITEM";
  }

  if (item.kind === "weapon") {
    return getHeroItemWeaponClass(item).toUpperCase();
  }

  const categoryId = getCityEquipmentCategoryIdForHeroItemId(itemId);
  const category = categoryId ? getCityEquipmentCategory(categoryId) : undefined;

  return (category?.label ?? "Armor").toUpperCase();
}

function getCityEquipmentProductStatKind(product: CityEquipmentProduct): "armor" | "damage" {
  return getCityEquipmentProductSide(product) === "armor" ? "armor" : "damage";
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

function getProfileEquipmentCategoryId(
  group: (typeof HERO_PROFILE_EQUIPMENT_GROUPS)[number],
  equipment: HeroState["equipment"],
): CityEquipmentCategoryId {
  const weaponSlot = group.slots.find((slotKey) => slotKey === "weaponMain" || slotKey === "weaponBow");

  if (!weaponSlot) {
    return group.categoryId;
  }

  const weaponItemId = equipment[weaponSlot];
  const weapon = weaponItemId ? HERO_ITEM_CATALOG[weaponItemId] : undefined;
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
