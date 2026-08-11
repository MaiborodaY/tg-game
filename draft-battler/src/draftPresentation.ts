import { getCardDefinition, getCardStatsForUpgrade } from "./game/cards";
import { createBoardFromSlots } from "./game/draft";
import { applyDraftPlacement } from "./game/placement";
import {
  SYNERGY_RULES,
  SYNERGY_TAG_ORDER,
  type SynergyEffect,
} from "./game/synergies";
import {
  BOARD_SLOT_COUNT,
  type BoardSlot,
  type CardId,
  type DraftOption,
  type RunState,
  type UnitStats,
  type UnitTag,
} from "./game/types";

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

export interface LastKnownEnemyArmySlot {
  slotIndex: number;
  cardId: CardId | null;
  upgradeLevel: BoardSlot["upgradeLevel"];
  stats?: UnitStats;
}

export interface DraftTagSynergyForecast {
  tag: UnitTag;
  beforeCount: number;
  afterCount: number;
  threshold: number;
  activatesThreshold: boolean;
  effect: SynergyEffect;
}

export interface DraftOptionPlacementSynergyForecast {
  targetSlotIndex: number;
  placementKind: "place" | "upgrade" | "replace";
  synergies: DraftTagSynergyForecast[];
}

export interface DraftOptionSynergyPresentation {
  optionId: string;
  cardId: CardId;
  tags: UnitTag[];
  placements: DraftOptionPlacementSynergyForecast[];
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

export function getLastKnownEnemyArmy(
  state: Pick<RunState, "enemyBoardSlots">,
): LastKnownEnemyArmySlot[] {
  let slots: BoardSlot[];
  try {
    slots = createBoardFromSlots(state.enemyBoardSlots, BOARD_SLOT_COUNT);
  } catch {
    return [];
  }

  return slots.map((slot) => {
    if (!slot.cardId) {
      return {
        slotIndex: slot.slotIndex,
        cardId: null,
        upgradeLevel: 0,
      };
    }

    const card = getCardDefinition(slot.cardId);
    return {
      slotIndex: slot.slotIndex,
      cardId: slot.cardId,
      upgradeLevel: slot.upgradeLevel,
      stats: getCardStatsForUpgrade(card, slot.upgradeLevel),
    };
  });
}

export function getDraftOptionSynergyPresentation(
  option: DraftOption,
  slots: readonly BoardSlot[],
): DraftOptionSynergyPresentation {
  const card = getCardDefinition(option.cardId);
  const placements = Array.from({ length: BOARD_SLOT_COUNT }, (_, targetSlotIndex) =>
    getDraftOptionPlacementSynergyForecast(option, slots, targetSlotIndex),
  ).filter((forecast): forecast is DraftOptionPlacementSynergyForecast => forecast !== undefined);

  return {
    optionId: option.optionId,
    cardId: option.cardId,
    tags: [...card.tags],
    placements,
  };
}

export function getDraftOptionPlacementSynergyForecast(
  option: DraftOption,
  slots: readonly BoardSlot[],
  targetSlotIndex: number,
): DraftOptionPlacementSynergyForecast | undefined {
  const placement = applyDraftPlacement(slots, option.cardId, targetSlotIndex, { allowReplacement: true });
  if (!placement.applied || placement.classification.kind === "invalid") {
    return undefined;
  }

  const card = getCardDefinition(option.cardId);
  const beforeCounts = countBoardTags(slots);
  const afterCounts = countBoardTags(placement.boardSlots);
  const relevantTags = new Set<UnitTag>(card.tags);

  for (const tag of SYNERGY_TAG_ORDER) {
    if ((beforeCounts.get(tag) ?? 0) !== (afterCounts.get(tag) ?? 0)) {
      relevantTags.add(tag);
    }
  }

  return {
    targetSlotIndex,
    placementKind: placement.classification.kind,
    synergies: SYNERGY_TAG_ORDER.flatMap((tag) => {
      if (!relevantTags.has(tag)) {
        return [];
      }

      const beforeCount = beforeCounts.get(tag) ?? 0;
      const afterCount = afterCounts.get(tag) ?? 0;
      const rule = SYNERGY_RULES[tag];
      return [{
        tag,
        beforeCount,
        afterCount,
        threshold: rule.threshold,
        activatesThreshold: beforeCount < rule.threshold && afterCount >= rule.threshold,
        effect: { ...rule.effect },
      }];
    }),
  };
}

function countBoardTags(slots: readonly BoardSlot[]): Map<UnitTag, number> {
  const counts = new Map<UnitTag, number>();

  slots.forEach((slot) => {
    if (!slot.cardId) {
      return;
    }

    getCardDefinition(slot.cardId).tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return counts;
}
