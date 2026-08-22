import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_RUN_ROUNDS,
  advanceEnemyBoardSlots,
  applyDraftPlacement,
  applyDraftSelectionToBoard,
  canRerollDraftCards,
  chooseDraftCards,
  createDraftOptions,
  createEmptyBoardSlots,
  createEnemyBoardSlots,
  createEnemyDraftOptions,
  createRun,
  getCardDefinition,
  getBoardCapacityForRound,
  getTerminalRunOutcome,
  isCardAllowedInSlot,
  rerollDraftCards,
  resolveRound,
} from "../src/game/index.ts";

test("a new run starts in a complete round-one draft state", () => {
  const state = createRun("p0-new-run");

  assert.equal(state.status, "draft");
  assert.equal(state.round, 1);
  assert.equal(state.playerHp, 20);
  assert.equal(state.enemyHp, 20);
  assert.equal(state.outcome, null);
  assert.equal(state.botDifficulty, "standard");
  assert.equal(state.draftOptions.length, 3);
  assert.equal(state.draftRerollCount, 0);
  assert.equal(state.boardSlots.length, 6);
  assert.equal(state.boardSlots.every((slot) => slot.cardId === null), true);
  assert.deepEqual(state.roundHistory, []);
});

test("strong difficulty compares all three offers while standard preserves the original pick", () => {
  const seed = "strong-fixture-1";
  const emptyBoard = createEmptyBoardSlots();
  const standard = advanceEnemyBoardSlots(seed, 1, emptyBoard);
  const explicitStandard = advanceEnemyBoardSlots(seed, 1, emptyBoard, "standard");
  const strong = advanceEnemyBoardSlots(seed, 1, emptyBoard, "strong");

  assert.deepEqual(standard, explicitStandard);
  assert.deepEqual(standard.draftOptions.map((option) => option.cardId), [
    "iron_guard",
    "plague_rat",
    "bone_archer",
  ]);
  assert.equal(standard.pickedCardId, "bone_archer");
  assert.equal(strong.pickedCardId, "iron_guard");
  assert.ok(strong.draftOptions.some((option) => option.cardId === strong.pickedCardId));
});

test("strong difficulty values crossing a four-unit synergy tier", () => {
  const board = createEmptyBoardSlots();
  board[0] = { slotIndex: 0, cardId: "sneakblade", upgradeLevel: 0 };
  board[1] = { slotIndex: 1, cardId: "longbow_hunter", upgradeLevel: 0 };
  board[2] = { slotIndex: 2, cardId: "bone_archer", upgradeLevel: 0 };

  const result = advanceEnemyBoardSlots("tier4-flip-3", 7, board, "strong");

  assert.deepEqual(result.draftOptions.map((option) => option.cardId), [
    "marsh_stalker",
    "crypt_keeper",
    "longbow_hunter",
  ]);
  assert.equal(result.pickedCardId, "marsh_stalker");
  assert.equal(result.targetSlotIndex, 3);
  assert.equal(
    result.boardSlots.filter((slot) => slot.cardId && getCardDefinition(slot.cardId).tags.includes("rogue")).length,
    4,
  );
});

test("a solo duel is capped at fifteen rounds", () => {
  assert.equal(MAX_RUN_ROUNDS, 15);
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

test("an incumbent card gets one deterministic 3x weight boost regardless of duplicate copies", () => {
  const oneCopy = createEmptyBoardSlots();
  oneCopy[0] = { slotIndex: 0, cardId: "bone_archer", upgradeLevel: 0 };
  const twoCopies = oneCopy.map((slot) => ({ ...slot }));
  twoCopies[1] = { slotIndex: 1, cardId: "bone_archer", upgradeLevel: 1 };
  let baselineOffers = 0;
  let incumbentOffers = 0;

  for (let seedIndex = 0; seedIndex < 500; seedIndex += 1) {
    const seed = `incumbent-weight-${seedIndex}`;
    const baseline = createDraftOptions(seed, 7);
    const weighted = createDraftOptions(seed, 7, 0, oneCopy);
    const duplicateWeighted = createDraftOptions(seed, 7, 0, twoCopies);

    baselineOffers += baseline.some((option) => option.cardId === "bone_archer") ? 1 : 0;
    incumbentOffers += weighted.some((option) => option.cardId === "bone_archer") ? 1 : 0;
    assert.deepEqual(duplicateWeighted, weighted, seed);
  }

  assert.equal(baselineOffers, 25);
  assert.equal(incumbentOffers, 80);
});

test("solo rerolls and next rounds use the player's incumbent board", () => {
  let state = createRun("incumbent-solo-flow");
  state.boardSlots[0] = { slotIndex: 0, cardId: "bone_archer", upgradeLevel: 0 };

  const rerolled = rerollDraftCards(state);
  assert.deepEqual(
    rerolled.draftOptions,
    createDraftOptions(state.seed, state.round, 1, state.boardSlots),
  );

  const selectedBoard = applyDraftSelectionToBoard(rerolled, [rerolled.draftOptions[0].cardId]);
  const nextState = resolveRound(chooseDraftCards(rerolled, selectedBoard));
  assert.equal(nextState.status, "draft");
  assert.deepEqual(
    nextState.draftOptions,
    createDraftOptions(nextState.seed, nextState.round, 0, nextState.boardSlots),
  );
});

test("enemy drafting uses the same incumbent weighting seam", () => {
  const board = createEmptyBoardSlots();
  board[0] = { slotIndex: 0, cardId: "plague_rat", upgradeLevel: 0 };
  const result = advanceEnemyBoardSlots("incumbent-enemy-flow", 4, board, "strong");

  assert.deepEqual(
    result.draftOptions,
    createEnemyDraftOptions("incumbent-enemy-flow", 4, board),
  );
});

test("enemy drafts exactly one deterministic legal card onto its persistent board each round", () => {
  for (const botDifficulty of ["standard", "strong"]) {
    for (let seedIndex = 0; seedIndex < 80; seedIndex += 1) {
      const seed = `enemy-persistent-${seedIndex}`;
      let board = createEmptyBoardSlots();

      for (let round = 1; round <= MAX_RUN_ROUNDS; round += 1) {
        const capacity = getBoardCapacityForRound(round);
        const first = advanceEnemyBoardSlots(seed, round, board, botDifficulty);
        const repeated = advanceEnemyBoardSlots(seed, round, board, botDifficulty);
        const pickedOption = first.draftOptions.find((option) => option.cardId === first.pickedCardId);
        const expected = applyDraftPlacement(board, first.pickedCardId, first.targetSlotIndex, {
          allowReplacement: true,
        });

        assert.deepEqual(first, repeated, `${botDifficulty}, round ${round}, seed ${seedIndex}`);
        assert.ok(pickedOption, `${botDifficulty}, round ${round}, seed ${seedIndex}`);
        assert.equal(expected.applied, true, `${botDifficulty}, round ${round}, seed ${seedIndex}`);
        assert.deepEqual(first.boardSlots, expected.boardSlots, `${botDifficulty}, round ${round}, seed ${seedIndex}`);
        first.boardSlots.filter((slot) => slot.cardId !== null).forEach((slot) => {
          assert.ok(slot.slotIndex < capacity);
          assert.equal(isCardAllowedInSlot(slot.cardId, slot.slotIndex), true);
        });

        board = first.boardSlots;
        assert.deepEqual(createEnemyBoardSlots(seed, round, botDifficulty), board);
      }
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

test("enemy board and both castle HP values persist between rounds", () => {
  let state = createRun("persistent-duel");
  const firstBoard = applyDraftSelectionToBoard(state, [state.draftOptions[0].cardId]);
  state = chooseDraftCards(state, firstBoard);
  const enemyRoundOne = state.enemyBoardSlots.map((slot) => ({ ...slot }));
  state = resolveRound(state);

  assert.equal(state.status, "draft");
  assert.deepEqual(state.enemyBoardSlots, enemyRoundOne);
  assert.equal(state.roundHistory[0].enemyHpBefore, 20);
  assert.equal(state.roundHistory[0].playerHpAfter, state.playerHp);
  assert.equal(state.roundHistory[0].enemyHpAfter, state.enemyHp);

  const expectedRoundTwo = advanceEnemyBoardSlots(state.seed, 2, enemyRoundOne).boardSlots;
  state = chooseDraftCards(state, applyDraftSelectionToBoard(state, [state.draftOptions[0].cardId]));
  assert.deepEqual(state.enemyBoardSlots, expectedRoundTwo);
});

test("terminal outcome uses castle destruction first and round-fifteen HP second", () => {
  assert.equal(getTerminalRunOutcome(0, 7, 2), "enemy");
  assert.equal(getTerminalRunOutcome(6, 0, 2), "player");
  assert.equal(getTerminalRunOutcome(0, 0, 2), "draw");
  assert.equal(getTerminalRunOutcome(4, 3, MAX_RUN_ROUNDS - 1), null);
  assert.equal(getTerminalRunOutcome(4, 3, MAX_RUN_ROUNDS), "player");
  assert.equal(getTerminalRunOutcome(3, 4, MAX_RUN_ROUNDS), "enemy");
  assert.equal(getTerminalRunOutcome(4, 4, MAX_RUN_ROUNDS), "draw");
});
