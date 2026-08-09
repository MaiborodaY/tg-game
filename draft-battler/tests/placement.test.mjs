import assert from "node:assert/strict";
import test from "node:test";

import { createEmptyBoardSlots } from "../src/game/draft.ts";
import { applyDraftPlacement, classifyDraftPlacement } from "../src/game/placement.ts";

function createFullBoard() {
  return [
    { slotIndex: 0, cardId: "iron_guard", upgradeLevel: 0 },
    { slotIndex: 1, cardId: "boar_rider", upgradeLevel: 0 },
    { slotIndex: 2, cardId: "spear_recruit", upgradeLevel: 0 },
    { slotIndex: 3, cardId: "longbow_hunter", upgradeLevel: 0 },
    { slotIndex: 4, cardId: "wolfhound", upgradeLevel: 0 },
    { slotIndex: 5, cardId: "field_cleric", upgradeLevel: 0 },
  ];
}

function cloneBoard(board) {
  return board.map((slot) => ({ ...slot }));
}

test("a level-zero duplicate exposes only the lowest deterministic upgrade target", () => {
  const board = createEmptyBoardSlots();
  board[1] = { slotIndex: 1, cardId: "sneakblade", upgradeLevel: 0 };
  board[4] = { slotIndex: 4, cardId: "sneakblade", upgradeLevel: 0 };

  assert.deepEqual(classifyDraftPlacement(board, "sneakblade", 1), {
    kind: "upgrade",
    cardId: "sneakblade",
    targetSlotIndex: 1,
    previousUpgradeLevel: 0,
    nextUpgradeLevel: 1,
  });
  assert.deepEqual(classifyDraftPlacement(board, "sneakblade", 4), {
    kind: "invalid",
    cardId: "sneakblade",
    targetSlotIndex: 4,
    reason: "upgrade_target_required",
    requiredTargetSlotIndex: 1,
  });

  const before = cloneBoard(board);
  const result = applyDraftPlacement(board, "sneakblade", 1, { allowReplacement: false });
  assert.equal(result.applied, true);
  assert.deepEqual(result.boardSlots[1], { slotIndex: 1, cardId: "sneakblade", upgradeLevel: 1 });
  assert.deepEqual(result.boardSlots[4], board[4]);
  assert.deepEqual(board, before);
});

test("an empty legal target places a level-zero card without mutating the input", () => {
  const board = createEmptyBoardSlots();
  board[0] = { slotIndex: 0, cardId: "iron_guard", upgradeLevel: 1 };
  const before = cloneBoard(board);

  const classification = classifyDraftPlacement(board, "ember_mage", 4);
  assert.deepEqual(classification, { kind: "place", cardId: "ember_mage", targetSlotIndex: 4 });

  const result = applyDraftPlacement(board, "ember_mage", 4, { allowReplacement: false });
  assert.equal(result.applied, true);
  assert.deepEqual(result.boardSlots[4], { slotIndex: 4, cardId: "ember_mage", upgradeLevel: 0 });
  assert.deepEqual(result.boardSlots.filter((slot) => slot.cardId !== null).length, 2);
  assert.deepEqual(board, before);
});

test("an occupied target is invalid until the board is full", () => {
  const board = createEmptyBoardSlots();
  board[0] = { slotIndex: 0, cardId: "iron_guard", upgradeLevel: 0 };

  const classification = classifyDraftPlacement(board, "ember_mage", 0);
  assert.deepEqual(classification, {
    kind: "invalid",
    cardId: "ember_mage",
    targetSlotIndex: 0,
    reason: "board_not_full",
  });

  const result = applyDraftPlacement(board, "ember_mage", 0, { allowReplacement: true });
  assert.equal(result.applied, false);
  assert.deepEqual(result.boardSlots, board);
});

test("a full-board replacement is classified but applies only after explicit confirmation", () => {
  const board = createFullBoard();
  board[2].upgradeLevel = 1;
  const before = cloneBoard(board);
  const expectedClassification = {
    kind: "replace",
    cardId: "ember_mage",
    targetSlotIndex: 2,
    replacedCardId: "spear_recruit",
    replacedUpgradeLevel: 1,
    requiresConfirmation: true,
  };

  assert.deepEqual(classifyDraftPlacement(board, "ember_mage", 2), expectedClassification);

  const denied = applyDraftPlacement(board, "ember_mage", 2, { allowReplacement: false });
  assert.equal(denied.applied, false);
  assert.deepEqual(denied.classification, expectedClassification);
  assert.deepEqual(denied.boardSlots, board);

  const confirmed = applyDraftPlacement(board, "ember_mage", 2, { allowReplacement: true });
  assert.equal(confirmed.applied, true);
  assert.deepEqual(confirmed.boardSlots[2], { slotIndex: 2, cardId: "ember_mage", upgradeLevel: 0 });
  assert.deepEqual(confirmed.boardSlots.filter((_, index) => index !== 2), board.filter((_, index) => index !== 2));
  assert.deepEqual(board, before);
});

test("a max-level copy cannot be replaced by its own level-zero card", () => {
  const board = createFullBoard();
  board[3] = { slotIndex: 3, cardId: "sneakblade", upgradeLevel: 1 };

  const classification = classifyDraftPlacement(board, "sneakblade", 3);
  assert.deepEqual(classification, {
    kind: "invalid",
    cardId: "sneakblade",
    targetSlotIndex: 3,
    reason: "same_card_max_level",
  });
  assert.equal(applyDraftPlacement(board, "sneakblade", 3, { allowReplacement: true }).applied, false);
});

test("when every existing copy is max level, another copy may use a different empty slot", () => {
  const board = createEmptyBoardSlots();
  board[0] = { slotIndex: 0, cardId: "sneakblade", upgradeLevel: 1 };

  assert.deepEqual(classifyDraftPlacement(board, "sneakblade", 1), {
    kind: "place",
    cardId: "sneakblade",
    targetSlotIndex: 1,
  });

  const result = applyDraftPlacement(board, "sneakblade", 1, { allowReplacement: false });
  assert.equal(result.applied, true);
  assert.deepEqual(result.boardSlots[0], board[0]);
  assert.deepEqual(result.boardSlots[1], { slotIndex: 1, cardId: "sneakblade", upgradeLevel: 0 });
});

test("shieldbearer obeys its front-row restriction for place and replacement", () => {
  const partialBoard = createEmptyBoardSlots();
  partialBoard[0] = { slotIndex: 0, cardId: "iron_guard", upgradeLevel: 0 };
  partialBoard[1] = { slotIndex: 1, cardId: "boar_rider", upgradeLevel: 0 };
  partialBoard[2] = { slotIndex: 2, cardId: "spear_recruit", upgradeLevel: 0 };

  assert.equal(classifyDraftPlacement(partialBoard, "shieldbearer", 4).kind, "invalid");
  assert.deepEqual(classifyDraftPlacement(partialBoard, "shieldbearer", 0), {
    kind: "invalid",
    cardId: "shieldbearer",
    targetSlotIndex: 0,
    reason: "board_not_full",
  });

  const rearranged = cloneBoard(partialBoard);
  rearranged[4] = { ...rearranged[0], slotIndex: 4 };
  rearranged[0] = { slotIndex: 0, cardId: null, upgradeLevel: 0 };
  assert.deepEqual(classifyDraftPlacement(rearranged, "shieldbearer", 0), {
    kind: "place",
    cardId: "shieldbearer",
    targetSlotIndex: 0,
  });

  const fullBoard = createFullBoard();
  assert.equal(classifyDraftPlacement(fullBoard, "shieldbearer", 4).kind, "invalid");
  assert.equal(classifyDraftPlacement(fullBoard, "shieldbearer", 0).kind, "replace");
});

test("invalid board shapes and target indices fail closed", () => {
  const board = createEmptyBoardSlots();
  const duplicateIndexBoard = cloneBoard(board);
  duplicateIndexBoard[5].slotIndex = 4;

  assert.equal(classifyDraftPlacement(board.slice(0, 5), "ember_mage", 0).reason, "invalid_board");
  assert.equal(classifyDraftPlacement(duplicateIndexBoard, "ember_mage", 0).reason, "invalid_board");
  assert.equal(classifyDraftPlacement(board, "ember_mage", -1).reason, "invalid_target");
  assert.equal(classifyDraftPlacement(board, "ember_mage", 6).reason, "invalid_target");
});
