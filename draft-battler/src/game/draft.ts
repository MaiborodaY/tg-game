import { CARD_DEFINITIONS } from "./cards";
import { SeededRandom } from "./random";
import {
  BOARD_SLOT_COUNT,
  DRAFT_OPTION_COUNT,
  MAX_UPGRADE_LEVEL,
  type BoardSlot,
  type CardDefinition,
  type CardId,
  type DraftOption,
} from "./types";

const FIRST_ROUND_HIDDEN_CARD_IDS = new Set<CardId>(["field_cleric", "shieldbearer"]);

export function createEmptyBoardSlots(): BoardSlot[] {
  return Array.from({ length: BOARD_SLOT_COUNT }, (_, slotIndex) => ({ slotIndex, cardId: null, upgradeLevel: 0 }));
}

export function cloneBoardSlots(slots: readonly BoardSlot[]): BoardSlot[] {
  return createEmptyBoardSlots().map((emptySlot) => {
    const sourceSlot = slots.find((slot) => slot.slotIndex === emptySlot.slotIndex);

    if (!sourceSlot) {
      return emptySlot;
    }

    return {
      slotIndex: emptySlot.slotIndex,
      cardId: sourceSlot.cardId,
      upgradeLevel: sourceSlot.cardId ? normalizeUpgradeLevel(sourceSlot.upgradeLevel) : 0,
    };
  });
}

export function getBoardCapacityForRound(_round: number): number {
  return BOARD_SLOT_COUNT;
}

export function createDraftOptions(seed: string, round: number, rerollCount = 0): DraftOption[] {
  const rng = new SeededRandom(`${seed}:draft:${round}:${rerollCount}`);
  const weightedPool = createWeightedDraftPool(round);
  const options: DraftOption[] = [];
  const used = new Set<string>();

  while (options.length < DRAFT_OPTION_COUNT && used.size < CARD_DEFINITIONS.length) {
    const card = rng.pick(weightedPool);

    if (used.has(card.id)) {
      continue;
    }

    used.add(card.id);
    options.push({
      optionId: `r${round}-rr${rerollCount}-o${options.length + 1}`,
      cardId: card.id,
    });
  }

  return options;
}

export function createBoardFromSlots(slots: readonly BoardSlot[], capacity: number): BoardSlot[] {
  const normalizedSlots = cloneBoardSlots(slots);

  normalizedSlots.forEach((slot) => {
    if (slot.cardId && slot.slotIndex >= capacity) {
      throw new Error(`Slot ${slot.slotIndex + 1} is outside board capacity.`);
    }

    if (slot.cardId && !isCardAllowedInSlot(slot.cardId, slot.slotIndex)) {
      throw new Error(`${slot.cardId} cannot be placed in slot ${slot.slotIndex + 1}.`);
    }
  });

  return normalizedSlots;
}

export function createEnemyBoardSlots(seed: string, round: number): BoardSlot[] {
  const rng = new SeededRandom(`${seed}:enemy:${round}`);
  const pool = CARD_DEFINITIONS.filter((card) => isCardAvailableForRound(card, round));
  const shuffled = rng.shuffle(pool);
  const picks = shuffled.slice(0, getEnemyBoardSizeForRound(round));

  const slots = createEmptyBoardSlots();

  picks.forEach((card) => {
    const targetSlot = slots.find((slot) => slot.cardId === null && isCardAllowedInSlot(card.id, slot.slotIndex));

    if (targetSlot) {
      targetSlot.cardId = card.id;
    }
  });

  return slots;
}

export function isFrontRowSlot(slotIndex: number): boolean {
  return slotIndex >= 0 && slotIndex < 3;
}

export function isFrontRowOnlyCard(cardId: CardId): boolean {
  return cardId === "shieldbearer";
}

export function isCardAllowedInSlot(cardId: CardId, slotIndex: number): boolean {
  return !isFrontRowOnlyCard(cardId) || isFrontRowSlot(slotIndex);
}

function getEnemyBoardSizeForRound(round: number): number {
  return Math.min(Math.max(1, round), BOARD_SLOT_COUNT);
}

function normalizeUpgradeLevel(upgradeLevel: BoardSlot["upgradeLevel"]): BoardSlot["upgradeLevel"] {
  return upgradeLevel >= MAX_UPGRADE_LEVEL ? MAX_UPGRADE_LEVEL : 0;
}

function createWeightedDraftPool(round: number): CardDefinition[] {
  const pool: CardDefinition[] = [];

  CARD_DEFINITIONS.forEach((card) => {
    if (!isCardAvailableForRound(card, round)) {
      return;
    }

    const weight = getTierWeight(card.tier, round);
    for (let count = 0; count < weight; count += 1) {
      pool.push(card);
    }
  });

  return pool;
}

function isCardAvailableForRound(card: CardDefinition, round: number): boolean {
  if (round <= 1 && FIRST_ROUND_HIDDEN_CARD_IDS.has(card.id)) {
    return false;
  }

  return card.tier <= getMaxTierForRound(round);
}

function getMaxTierForRound(round: number): 1 | 2 | 3 {
  if (round >= 7) {
    return 3;
  }

  if (round >= 4) {
    return 2;
  }

  return 1;
}

function getTierWeight(tier: CardDefinition["tier"], round: number): number {
  if (tier === 1) {
    return round >= 7 ? 2 : 5;
  }

  if (tier === 2) {
    return round >= 7 ? 4 : 2;
  }

  return 1;
}
