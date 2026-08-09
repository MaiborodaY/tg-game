import { isCardAllowedInSlot } from "./draft";
import { BOARD_SLOT_COUNT, type BoardSlot, type CardId } from "./types";

export type DraftPlacementInvalidReason =
  | "invalid_board"
  | "invalid_target"
  | "upgrade_target_required"
  | "illegal_card_row"
  | "board_not_full"
  | "same_card_max_level";

interface DraftPlacementBase {
  cardId: CardId;
  targetSlotIndex: number;
}

export interface DraftUpgradePlacement extends DraftPlacementBase {
  kind: "upgrade";
  previousUpgradeLevel: 0;
  nextUpgradeLevel: 1;
}

export interface DraftPlacePlacement extends DraftPlacementBase {
  kind: "place";
}

export interface DraftReplacePlacement extends DraftPlacementBase {
  kind: "replace";
  replacedCardId: CardId;
  replacedUpgradeLevel: BoardSlot["upgradeLevel"];
  requiresConfirmation: true;
}

export interface DraftInvalidPlacement extends DraftPlacementBase {
  kind: "invalid";
  reason: DraftPlacementInvalidReason;
  requiredTargetSlotIndex?: number;
}

export type DraftPlacementClassification =
  | DraftUpgradePlacement
  | DraftPlacePlacement
  | DraftReplacePlacement
  | DraftInvalidPlacement;

export interface ApplyDraftPlacementOptions {
  allowReplacement: boolean;
}

export interface ApplyDraftPlacementResult {
  classification: DraftPlacementClassification;
  applied: boolean;
  boardSlots: BoardSlot[];
}

export function classifyDraftPlacement(
  slots: readonly BoardSlot[],
  cardId: CardId,
  targetSlotIndex: number,
): DraftPlacementClassification {
  const boardSlots = validateAndCloneBoard(slots);
  if (!boardSlots) {
    return createInvalidPlacement(cardId, targetSlotIndex, "invalid_board");
  }

  if (!isValidSlotIndex(targetSlotIndex)) {
    return createInvalidPlacement(cardId, targetSlotIndex, "invalid_target");
  }

  const upgradeSlot = boardSlots.find(
    (slot) => slot.cardId === cardId && slot.upgradeLevel === 0 && isCardAllowedInSlot(cardId, slot.slotIndex),
  );
  if (upgradeSlot) {
    if (targetSlotIndex !== upgradeSlot.slotIndex) {
      return {
        ...createInvalidPlacement(cardId, targetSlotIndex, "upgrade_target_required"),
        requiredTargetSlotIndex: upgradeSlot.slotIndex,
      };
    }

    return {
      kind: "upgrade",
      cardId,
      targetSlotIndex,
      previousUpgradeLevel: 0,
      nextUpgradeLevel: 1,
    };
  }

  if (!isCardAllowedInSlot(cardId, targetSlotIndex)) {
    return createInvalidPlacement(cardId, targetSlotIndex, "illegal_card_row");
  }

  const targetSlot = boardSlots[targetSlotIndex];
  if (targetSlot.cardId === null) {
    return { kind: "place", cardId, targetSlotIndex };
  }

  if (targetSlot.cardId === cardId && targetSlot.upgradeLevel === 1) {
    return createInvalidPlacement(cardId, targetSlotIndex, "same_card_max_level");
  }

  if (!boardSlots.every((slot) => slot.cardId !== null)) {
    return createInvalidPlacement(cardId, targetSlotIndex, "board_not_full");
  }

  return {
    kind: "replace",
    cardId,
    targetSlotIndex,
    replacedCardId: targetSlot.cardId,
    replacedUpgradeLevel: targetSlot.upgradeLevel,
    requiresConfirmation: true,
  };
}

export function applyDraftPlacement(
  slots: readonly BoardSlot[],
  cardId: CardId,
  targetSlotIndex: number,
  options: ApplyDraftPlacementOptions,
): ApplyDraftPlacementResult {
  const classification = classifyDraftPlacement(slots, cardId, targetSlotIndex);
  const boardSlots = cloneBoard(slots);

  if (
    classification.kind === "invalid" ||
    (classification.kind === "replace" && options.allowReplacement !== true)
  ) {
    return { classification, applied: false, boardSlots };
  }

  const targetSlot = boardSlots.find((slot) => slot.slotIndex === classification.targetSlotIndex);
  if (!targetSlot) {
    return {
      classification: createInvalidPlacement(cardId, targetSlotIndex, "invalid_board"),
      applied: false,
      boardSlots,
    };
  }

  if (classification.kind === "upgrade") {
    targetSlot.upgradeLevel = 1;
  } else {
    targetSlot.cardId = cardId;
    targetSlot.upgradeLevel = 0;
  }

  return { classification, applied: true, boardSlots };
}

function validateAndCloneBoard(slots: readonly BoardSlot[]): BoardSlot[] | undefined {
  if (slots.length !== BOARD_SLOT_COUNT) {
    return undefined;
  }

  const boardSlots = cloneBoard(slots).sort((left, right) => left.slotIndex - right.slotIndex);
  for (let slotIndex = 0; slotIndex < BOARD_SLOT_COUNT; slotIndex += 1) {
    const slot = boardSlots[slotIndex];
    if (
      slot.slotIndex !== slotIndex ||
      (slot.upgradeLevel !== 0 && slot.upgradeLevel !== 1) ||
      (slot.cardId === null && slot.upgradeLevel !== 0) ||
      (slot.cardId !== null && !isCardAllowedInSlot(slot.cardId, slot.slotIndex))
    ) {
      return undefined;
    }
  }

  return boardSlots;
}

function cloneBoard(slots: readonly BoardSlot[]): BoardSlot[] {
  return slots.map((slot) => ({ ...slot }));
}

function isValidSlotIndex(slotIndex: number): boolean {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < BOARD_SLOT_COUNT;
}

function createInvalidPlacement(
  cardId: CardId,
  targetSlotIndex: number,
  reason: DraftPlacementInvalidReason,
): DraftInvalidPlacement {
  return { kind: "invalid", cardId, targetSlotIndex, reason };
}
