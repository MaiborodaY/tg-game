import {
  HERO_CRACK_ARMOR_SCROLL_ITEM_ID,
  HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID,
  HERO_FIREBALL_SCROLL_ITEM_ID,
  HERO_POISON_SCROLL_ITEM_ID,
  HERO_PRECISE_STRIKE_SCROLL_ITEM_ID,
  HERO_WARD_SCROLL_ITEM_ID,
  getHeroCrackArmorParts,
  getHeroDoubleStrikeDamageMultiplier,
  getHeroFireballDamage,
  getHeroPoisonDamage,
  getHeroPreciseStrikeBlockChanceReduction,
  getHeroWardHitCount,
  type HeroItemId,
  type HeroState,
} from "./hero";
import {
  POISON_SCROLL_TURNS,
  getFighterCrackArmorParts,
  getFighterDoubleStrikeDamageMultiplier,
  getFighterFireballDamage,
  getFighterPoisonDamage,
  getFighterPreciseStrikeBlockChanceReduction,
  getFighterWardHitCount,
  type ActionId,
  type FighterState,
} from "./combat";

export function getHeroScrollEffectText(hero: HeroState, itemId: HeroItemId | undefined, fallback = ""): string {
  if (itemId === HERO_CRACK_ARMOR_SCROLL_ITEM_ID) {
    return formatCrackArmorEffect(getHeroCrackArmorParts(hero));
  }

  if (itemId === HERO_WARD_SCROLL_ITEM_ID) {
    return formatWardEffect(getHeroWardHitCount(hero));
  }

  if (itemId === HERO_PRECISE_STRIKE_SCROLL_ITEM_ID) {
    return formatPreciseStrikeEffect(getHeroPreciseStrikeBlockChanceReduction(hero));
  }

  if (itemId === HERO_FIREBALL_SCROLL_ITEM_ID) {
    return formatFireballEffect(getHeroFireballDamage(hero));
  }

  if (itemId === HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID) {
    return formatDoubleStrikeEffect(getHeroDoubleStrikeDamageMultiplier(hero));
  }

  if (itemId === HERO_POISON_SCROLL_ITEM_ID) {
    return formatPoisonEffect(getHeroPoisonDamage(hero));
  }

  return fallback;
}

export function getFighterSpellbookScrollEffectText(fighter: FighterState, actionId: ActionId, fallback = ""): string {
  if (actionId === "scroll") {
    return formatCrackArmorEffect(getFighterCrackArmorParts(fighter));
  }

  if (actionId === "ward") {
    return formatWardEffect(getFighterWardHitCount(fighter));
  }

  if (actionId === "preciseStrike") {
    return formatPreciseStrikeEffect(getFighterPreciseStrikeBlockChanceReduction(fighter));
  }

  if (actionId === "fireball") {
    return formatFireballEffect(getFighterFireballDamage(fighter));
  }

  if (actionId === "doubleStrike") {
    return formatDoubleStrikeEffect(getFighterDoubleStrikeDamageMultiplier(fighter));
  }

  if (actionId === "poison") {
    return formatPoisonEffect(getFighterPoisonDamage(fighter));
  }

  return fallback;
}

function formatCrackArmorEffect(parts: number): string {
  return `Breaks ${parts} ${formatPlural(parts, "armor part", "armor parts")}.`;
}

function formatWardEffect(hits: number): string {
  return `Blocks ${hits} ${formatPlural(hits, "hit", "hits")}.`;
}

function formatPreciseStrikeEffect(blockChanceReduction: number): string {
  return `3 strikes: +${formatPercent(blockChanceReduction)} hit chance.`;
}

function formatFireballEffect(damage: number): string {
  return `Deals ${damage} damage.`;
}

function formatDoubleStrikeEffect(damageMultiplier: number): string {
  return `Deals second hit with ${formatPercent(damageMultiplier)} damage.`;
}

function formatPoisonEffect(damage: number): string {
  return `${damage} poison damage for ${POISON_SCROLL_TURNS} turns.`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatPlural(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
