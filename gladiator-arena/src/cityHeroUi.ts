import type { ArenaDebugTuning } from "./debugTuning";
import {
  deriveHeroStats,
  getHeroEquipmentStatBonuses,
  HERO_ITEM_CATALOG,
  type HeroAttributeKey,
  type HeroEquipmentSlotKey,
  type HeroState,
} from "./hero";

const HERO_ATTRIBUTE_KEYS: readonly HeroAttributeKey[] = ["strength", "agility", "vitality"];
type CityHeroProfileStatKey = "damage" | "armor" | "hp" | "stamina" | "movement" | "recovery";

const HERO_PROFILE_EQUIPMENT_GROUPS: readonly {
  label: string;
  icon: string;
  modifier: string;
  slots: readonly HeroEquipmentSlotKey[];
}[] = [
  { label: "Head", icon: "H", modifier: "head", slots: ["helmet"] },
  { label: "Body", icon: "B", modifier: "body", slots: ["breastplate"] },
  {
    label: "Arms",
    icon: "A",
    modifier: "arms",
    slots: ["backShoulderguard", "frontShoulderguard", "backWrist", "frontWrist", "backGlove", "frontGlove"],
  },
  {
    label: "Legs",
    icon: "L",
    modifier: "legs",
    slots: ["backGreave", "frontGreave", "backShinguard", "frontShinguard", "backBoot", "frontBoot"],
  },
  { label: "Weapon", icon: "W", modifier: "weapon", slots: ["weaponMain"] },
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
      armor: root.querySelector<HTMLElement>('[data-hero-profile-stat="armor"]'),
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

export function mountCityHeroAttributeControls(refs: CityHeroWidgetRefs, onAllocate: (attribute: HeroAttributeKey) => void): () => void {
  const cleanups = HERO_ATTRIBUTE_KEYS.flatMap((attribute) => {
    const button = refs.attributeButtons[attribute];

    if (!button) {
      return [];
    }

    const handleClick = () => onAllocate(attribute);

    button.addEventListener("click", handleClick);

    return [() => button.removeEventListener("click", handleClick)];
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
  setText(refs.profileStats.armor, String(stats.maxArmor));
  setText(refs.profileStats.hp, String(stats.maxHp));
  setText(refs.profileStats.stamina, String(stats.maxStamina));
  setText(refs.profileStats.movement, formatSignedDecimal(stats.movementDistanceBonus));
  setText(refs.profileStats.recovery, `+${stats.restHpRestoreBonus}/+${stats.restStaminaRestoreBonus}`);

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
    const item = group.slots
      .map((slotKey) => {
        const itemId = hero.equipment[slotKey];

        return itemId ? HERO_ITEM_CATALOG[itemId] : undefined;
      })
      .find(Boolean);
    const rarity = item?.rarity ?? "empty";
    const card = document.createElement("div");
    const icon = document.createElement("span");
    const label = document.createElement("strong");
    const detail = document.createElement("span");

    card.className = `city-profile__equipment-card city-profile__equipment-card--${group.modifier} city-profile__equipment-card--${rarity}`;
    card.title = item?.name ?? `${group.label}: empty`;
    icon.className = "city-profile__equipment-icon";
    icon.textContent = group.icon;
    label.textContent = group.label;
    detail.textContent = item ? "Lv.1" : "Empty";
    card.append(icon, label, detail);
    equipmentHost.append(card);
  });
}

function formatSignedDecimal(value: number): string {
  const formattedValue = value.toFixed(3).replace(/\.?0+$/, "");

  return `+${formattedValue || "0"}`;
}

function setText(target: HTMLElement | null, value: string): void {
  if (target) {
    target.textContent = value;
  }
}
