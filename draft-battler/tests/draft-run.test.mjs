import assert from "node:assert/strict";
import test from "node:test";

import {
  applyDraftSelectionToBoard,
  canRerollDraftCards,
  chooseDraftCards,
  createDraftOptions,
  createEnemyBoardSlots,
  createRun,
  isCardAllowedInSlot,
  rerollDraftCards,
  resolveRound,
} from "../src/game/index.ts";

test("a new run starts in a complete round-one draft state", () => {
  const state = createRun("p0-new-run");

  assert.equal(state.status, "draft");
  assert.equal(state.round, 1);
  assert.equal(state.playerHp, 20);
  assert.equal(state.draftOptions.length, 3);
  assert.equal(state.draftRerollCount, 0);
  assert.equal(state.boardSlots.length, 6);
  assert.equal(state.boardSlots.every((slot) => slot.cardId === null), true);
  assert.deepEqual(state.roundHistory, []);
});

test("draft options are deterministic, unique, and reroll-specific", () => {
  const original = createDraftOptions("p0-draft-seed", 4, 0);
  const repeated = createDraftOptions("p0-draft-seed", 4, 0);
  const rerolled = createDraftOptions("p0-draft-seed", 4, 1);

  assert.deepEqual(original, repeated);
  assert.equal(original.length, 3);
  assert.equal(new Set(original.map((option) => option.cardId)).size, original.length);
  assert.notDeepEqual(original, rerolled);
});

test("enemy boards always fill their round capacity with legal placements", () => {
  for (let round = 1; round <= 10; round += 1) {
    const expectedSize = Math.min(round, 6);

    for (let seedIndex = 0; seedIndex < 160; seedIndex += 1) {
      const slots = createEnemyBoardSlots(`enemy-capacity-${seedIndex}`, round);
      const occupied = slots.filter((slot) => slot.cardId !== null);

      assert.equal(occupied.length, expectedSize, `round ${round}, seed ${seedIndex}`);
      occupied.forEach((slot) => {
        assert.equal(isCardAllowedInSlot(slot.cardId, slot.slotIndex), true);
      });
    }
  }
});

test("a duplicate upgrades an existing level-zero copy before using an empty slot", () => {
  const state = createRun("p0-duplicate-seed");
  state.boardSlots[0] = { slotIndex: 0, cardId: "sneakblade", upgradeLevel: 1 };
  state.boardSlots[3] = { slotIndex: 3, cardId: "sneakblade", upgradeLevel: 0 };

  const upgraded = applyDraftSelectionToBoard(state, ["sneakblade"]);
  assert.deepEqual(upgraded[0], state.boardSlots[0]);
  assert.deepEqual(upgraded[3], { slotIndex: 3, cardId: "sneakblade", upgradeLevel: 1 });
  assert.equal(upgraded[1].cardId, null);

  state.boardSlots = upgraded;
  const placed = applyDraftSelectionToBoard(state, ["sneakblade"]);
  assert.deepEqual(placed[0], upgraded[0]);
  assert.deepEqual(placed[1], { slotIndex: 1, cardId: "sneakblade", upgradeLevel: 0 });
});

test("a new card replaces a legal slot when the board is full", () => {
  const state = createRun("p0-replacement-seed");
  state.boardSlots = [
    { slotIndex: 0, cardId: "iron_guard", upgradeLevel: 0 },
    { slotIndex: 1, cardId: "boar_rider", upgradeLevel: 0 },
    { slotIndex: 2, cardId: "spear_recruit", upgradeLevel: 0 },
    { slotIndex: 3, cardId: "longbow_hunter", upgradeLevel: 0 },
    { slotIndex: 4, cardId: "wolfhound", upgradeLevel: 0 },
    { slotIndex: 5, cardId: "field_cleric", upgradeLevel: 0 },
  ];

  const replaced = applyDraftSelectionToBoard(state, ["ember_mage"]);
  assert.deepEqual(replaced[0], { slotIndex: 0, cardId: "ember_mage", upgradeLevel: 0 });
  assert.deepEqual(replaced.slice(1), state.boardSlots.slice(1));
});

test("only one free reroll is allowed per round and the allowance resets", () => {
  let state = createRun("p0-reroll-seed");
  const originalOptions = state.draftOptions;

  assert.equal(canRerollDraftCards(state), true);
  state = rerollDraftCards(state);
  assert.equal(state.draftRerollCount, 1);
  assert.notDeepEqual(state.draftOptions, originalOptions);
  assert.equal(canRerollDraftCards(state), false);
  assert.throws(() => rerollDraftCards(state), /already been used/i);

  const board = applyDraftSelectionToBoard(state, [state.draftOptions[0].cardId]);
  state = resolveRound(chooseDraftCards(state, board));
  assert.equal(state.status, "draft");
  assert.equal(state.round, 2);
  assert.equal(state.draftRerollCount, 0);
  assert.equal(canRerollDraftCards(state), true);
});
