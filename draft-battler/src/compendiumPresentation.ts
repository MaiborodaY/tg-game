import { CARD_DEFINITIONS, getCardStatsForUpgrade } from "./game/cards";
import { SYNERGY_RULES, SYNERGY_TAG_ORDER, type SynergyEffect } from "./game/synergies";
import {
  MAX_UPGRADE_LEVEL,
  type AbilityId,
  type CardDefinition,
  type CardId,
  type UnitRole,
  type UnitStats,
  type UnitTag,
} from "./game/types";

export type CompendiumCardRarity = "common" | "uncommon" | "rare";

export interface CompendiumCardPresentation {
  id: CardId;
  name: string;
  role: UnitRole;
  tags: readonly UnitTag[];
  rarity: CompendiumCardRarity;
  abilityId: AbilityId;
  baseStats: Readonly<UnitStats>;
  upgradedStats: Readonly<UnitStats>;
}

export interface CompendiumSynergyTierPresentation {
  threshold: number;
  effect: Readonly<SynergyEffect>;
  contributorCardIds: readonly CardId[];
  contributorRoles: readonly UnitRole[];
}

export interface CompendiumSynergyPresentation {
  tag: UnitTag;
  tiers: readonly CompendiumSynergyTierPresentation[];
}

export interface CompendiumPresentation {
  cards: readonly CompendiumCardPresentation[];
  synergies: readonly CompendiumSynergyPresentation[];
}

export function createCompendiumPresentation(): CompendiumPresentation {
  return {
    cards: CARD_DEFINITIONS.map(createCardPresentation),
    synergies: SYNERGY_TAG_ORDER.map((tag) => createSynergyPresentation(tag)),
  };
}

function createCardPresentation(card: CardDefinition): CompendiumCardPresentation {
  return {
    id: card.id,
    name: card.name,
    role: card.role,
    tags: [...card.tags],
    rarity: getRarityForTier(card.tier),
    abilityId: card.abilityId,
    baseStats: getCardStatsForUpgrade(card, 0),
    upgradedStats: getCardStatsForUpgrade(card, MAX_UPGRADE_LEVEL),
  };
}

function createSynergyPresentation(tag: UnitTag): CompendiumSynergyPresentation {
  const rule = SYNERGY_RULES[tag];
  const contributors = CARD_DEFINITIONS.filter((card) => card.tags.includes(tag));

  return {
    tag,
    tiers: rule.tiers.map((tier) => ({
      threshold: tier.threshold,
      effect: { ...tier.effect },
      contributorCardIds: contributors.map((card) => card.id),
      contributorRoles: [...new Set(contributors.map((card) => card.role))],
    })),
  };
}

function getRarityForTier(tier: CardDefinition["tier"]): CompendiumCardRarity {
  if (tier === 1) {
    return "common";
  }

  if (tier === 2) {
    return "uncommon";
  }

  return "rare";
}
