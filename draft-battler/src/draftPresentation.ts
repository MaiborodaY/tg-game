import { getCardDefinition, getCardStatsForUpgrade } from "./game/cards";
import { createBoardFromSlots } from "./game/draft";
import { applyDraftPlacement, classifyDraftPlacement } from "./game/placement";
import {
  SYNERGY_RULES,
  SYNERGY_TAG_ORDER,
  type SynergyEffect,
  type SynergyTier,
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

export interface BoardSynergyTierProgress {
  threshold: number;
  active: boolean;
  effect: SynergyEffect;
}

export interface BoardSynergyProgress {
  tag: UnitTag;
  count: number;
  tiers: BoardSynergyTierProgress[];
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
  tiers: DraftSynergyTierForecast[];
  activatedThresholds: number[];
  deactivatedThresholds: number[];
}

export interface DraftSynergyTierForecast {
  threshold: number;
  effect: SynergyEffect;
  activeBefore: boolean;
  activeAfter: boolean;
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

interface DraftOptionSynergyOutcomeBase {
  tag: UnitTag;
  beforeCount: number;
  afterCount: number;
  guaranteed: boolean;
}

export type DraftOptionSynergyOutcome = DraftOptionSynergyOutcomeBase & {
  kind: "activates" | "loses";
  threshold: number;
  effect: SynergyEffect;
};

export interface DraftOptionSynergyOutcomePresentation {
  placementKind: "place" | "replace";
  outcomes: DraftOptionSynergyOutcome[];
}

export function selectVisibleDraftOptionSynergyOutcomes(
  outcomes: readonly DraftOptionSynergyOutcome[],
  limit: number,
): DraftOptionSynergyOutcome[] {
  if (limit <= 0) {
    return [];
  }

  const selected: DraftOptionSynergyOutcome[] = [];
  (["activates", "loses"] as const).forEach((kind) => {
    const outcome = outcomes.find((candidate) => candidate.kind === kind);
    if (outcome && selected.length < limit) {
      selected.push(outcome);
    }
  });
  outcomes.forEach((outcome) => {
    if (selected.length < limit && !selected.includes(outcome)) {
      selected.push(outcome);
    }
  });

  return selected;
}

export type DraftOptionBoardStatus = "upgrade" | "maxed";

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

    return [{
      tag,
      count,
      tiers: SYNERGY_RULES[tag].tiers.map((tier) => ({
        threshold: tier.threshold,
        active: count >= tier.threshold,
        effect: cloneSynergyEffect(tier.effect),
      })),
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

export function getDraftOptionBoardStatus(
  cardId: CardId,
  slots: readonly BoardSlot[],
): DraftOptionBoardStatus | undefined {
  if (!slots.some((slot) => slot.cardId === cardId)) {
    return undefined;
  }

  const classifications = Array.from({ length: BOARD_SLOT_COUNT }, (_, targetSlotIndex) =>
    classifyDraftPlacement(slots, cardId, targetSlotIndex),
  );
  if (classifications.every((placement) => placement.kind === "invalid" && placement.reason === "invalid_board")) {
    return undefined;
  }

  return classifications.some((placement) => placement.kind === "upgrade") ? "upgrade" : "maxed";
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

export function summarizeDraftOptionSynergyPresentation(
  presentation: DraftOptionSynergyPresentation,
): DraftOptionSynergyOutcomePresentation | undefined {
  const placements = presentation.placements.filter((placement) => placement.placementKind !== "upgrade");
  const placementKind = placements[0]?.placementKind;
  if (!placementKind || placementKind === "upgrade") {
    return undefined;
  }

  const outcomes = new Map<string, DraftOptionSynergyOutcome & { placementTargets: Set<number> }>();
  placements.forEach((placement) => {
    placement.synergies.forEach((synergy) => {
      synergy.activatedThresholds.forEach((threshold) => {
        const tier = synergy.tiers.find((candidate) => candidate.threshold === threshold);
        if (tier) {
          addSynergyOutcome(outcomes, "activates", synergy, tier, placement.targetSlotIndex);
        }
      });
      synergy.deactivatedThresholds.forEach((threshold) => {
        const tier = synergy.tiers.find((candidate) => candidate.threshold === threshold);
        if (tier) {
          addSynergyOutcome(outcomes, "loses", synergy, tier, placement.targetSlotIndex);
        }
      });

    });
  });

  if (outcomes.size === 0) {
    return undefined;
  }

  const kindOrder: Record<DraftOptionSynergyOutcome["kind"], number> = {
    activates: 0,
    loses: 1,
  };
  return {
    placementKind,
    outcomes: [...outcomes.values()]
      .map(({ placementTargets, ...outcome }) => ({
        ...outcome,
        guaranteed: placementTargets.size === placements.length,
      }))
      .sort((left, right) => kindOrder[left.kind] - kindOrder[right.kind]),
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
      const tiers = SYNERGY_RULES[tag].tiers.map((tier) => createTierForecast(tier, beforeCount, afterCount));
      return [{
        tag,
        beforeCount,
        afterCount,
        tiers,
        activatedThresholds: tiers
          .filter((tier) => !tier.activeBefore && tier.activeAfter)
          .map((tier) => tier.threshold),
        deactivatedThresholds: tiers
          .filter((tier) => tier.activeBefore && !tier.activeAfter)
          .map((tier) => tier.threshold),
      }];
    }),
  };
}

function createTierForecast(
  tier: SynergyTier,
  beforeCount: number,
  afterCount: number,
): DraftSynergyTierForecast {
  return {
    threshold: tier.threshold,
    effect: cloneSynergyEffect(tier.effect),
    activeBefore: beforeCount >= tier.threshold,
    activeAfter: afterCount >= tier.threshold,
  };
}

function addSynergyOutcome(
  outcomes: Map<string, DraftOptionSynergyOutcome & { placementTargets: Set<number> }>,
  kind: "activates" | "loses",
  synergy: DraftTagSynergyForecast,
  tier: DraftSynergyTierForecast,
  targetSlotIndex: number,
): void {
  const key = [kind, synergy.tag, synergy.beforeCount, synergy.afterCount, tier.threshold].join(":");
  const existing = outcomes.get(key);
  if (existing) {
    existing.placementTargets.add(targetSlotIndex);
    return;
  }

  outcomes.set(key, {
    kind,
    tag: synergy.tag,
    beforeCount: synergy.beforeCount,
    afterCount: synergy.afterCount,
    threshold: tier.threshold,
    effect: cloneSynergyEffect(tier.effect),
    guaranteed: false,
    placementTargets: new Set([targetSlotIndex]),
  });
}

function cloneSynergyEffect(effect: SynergyEffect): SynergyEffect {
  return { ...effect };
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
