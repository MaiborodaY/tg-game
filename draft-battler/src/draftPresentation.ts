import { getCardDefinition, getCardStatsForUpgrade } from "./game/cards";
import {
  SYNERGY_RULES,
  SYNERGY_TAG_ORDER,
  type SynergyEffect,
} from "./game/synergies";
import type { BoardSlot, CardId, UnitStats, UnitTag } from "./game/types";

export { SYNERGY_THRESHOLD } from "./game/synergies";

export interface BoardSynergyProgress {
  tag: UnitTag;
  count: number;
  threshold: number;
  active: boolean;
  effect: SynergyEffect;
}

export interface BoardUnitInspection {
  slotIndex: number;
  cardId: CardId;
  upgradeLevel: BoardSlot["upgradeLevel"];
  stats: UnitStats;
}

export function getBoardSynergyProgress(slots: readonly BoardSlot[]): BoardSynergyProgress[] {
  const counts = new Map<UnitTag, number>();

  slots.forEach((slot) => {
    if (!slot.cardId) {
      return;
    }

    getCardDefinition(slot.cardId).tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return SYNERGY_TAG_ORDER.flatMap((tag) => {
    const count = counts.get(tag) ?? 0;
    if (count === 0) {
      return [];
    }

    const rule = SYNERGY_RULES[tag];

    return [{
      tag,
      count,
      threshold: rule.threshold,
      active: count >= rule.threshold,
      effect: rule.effect,
    }];
  });
}

export function getBoardUnitInspection(
  slots: readonly BoardSlot[],
  slotIndex: number,
): BoardUnitInspection | undefined {
  const slot = slots.find((candidate) => candidate.slotIndex === slotIndex);
  if (!slot?.cardId) {
    return undefined;
  }

  const card = getCardDefinition(slot.cardId);
  return {
    slotIndex: slot.slotIndex,
    cardId: slot.cardId,
    upgradeLevel: slot.upgradeLevel,
    stats: getCardStatsForUpgrade(card, slot.upgradeLevel),
  };
}
