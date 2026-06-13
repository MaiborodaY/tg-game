import type { ArenaDebugTuning } from "./debugTuning";
import type { HeroAttributeKey, HeroState } from "./hero";

const HERO_ATTRIBUTE_KEYS: readonly HeroAttributeKey[] = ["strength", "agility", "vitality"];

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
    skillPoints: root.querySelector<HTMLElement>("#heroInfoSkillPoints"),
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

  if (refs.skillPoints) {
    refs.skillPoints.textContent = `POINTS ${hero.skillPoints}`;
    refs.skillPoints.hidden = hero.skillPoints <= 0;
  }

  HERO_ATTRIBUTE_KEYS.forEach((attribute) => {
    const value = refs.attributeValues[attribute];
    const button = refs.attributeButtons[attribute];

    if (value) {
      value.textContent = String(hero.baseStats[attribute]);
    }

    if (button) {
      button.disabled = hero.skillPoints <= 0;
      button.hidden = hero.skillPoints <= 0;
    }
  });
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
