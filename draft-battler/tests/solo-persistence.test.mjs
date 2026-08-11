import assert from "node:assert/strict";
import test from "node:test";

import {
  applyDraftSelectionToBoard,
  autoplayRun,
  chooseDraftCards,
  createRun,
  resolveRound,
} from "../src/game/index.ts";
import { applyDraftPlacement } from "../src/game/placement.ts";
import {
  SOLO_RUN_SNAPSHOT_VERSION,
  SOLO_RUN_STORAGE_KEY,
  clearSoloRunSnapshot,
  createSoloRunSnapshot,
  decodeSoloRunSnapshot,
  encodeSoloRunSnapshot,
  loadSoloRunSnapshot,
  saveSoloRunSnapshot,
} from "../src/soloPersistence.ts";

const FIXED_SAVED_AT = 1_700_000_000_000;
const LEGACY_V1_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v1";
const LEGACY_V2_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v2";
const LEGACY_V3_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v3";
const LEGACY_V4_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v4";

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function createDraftCheckpoint() {
  const run = createRun("solo-persistence-draft");
  const draftBoardSlots = applyDraftSelectionToBoard(run, [run.draftOptions[0].cardId]);

  return {
    checkpoint: "draft",
    run,
    draftBoardSlots,
    cardPickedThisRound: true,
    lastRound: 1,
  };
}

function createBattleResultCheckpoint() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const draft = createRun(`solo-persistence-battle-${attempt}`);
    const board = applyDraftSelectionToBoard(draft, [draft.draftOptions[0].cardId]);
    const run = resolveRound(chooseDraftCards(draft, board));

    if (run.status === "draft") {
      return {
        checkpoint: "battle_result",
        run,
        draftBoardSlots: run.boardSlots,
        cardPickedThisRound: false,
        lastRound: run.round - 1,
      };
    }
  }

  throw new Error("Could not produce a non-terminal round for the persistence fixture.");
}

function createFinishedCheckpoint() {
  const run = autoplayRun("solo-persistence-finished", (state) => [state.draftOptions[0].cardId]);

  return {
    checkpoint: "finished",
    run,
    draftBoardSlots: run.boardSlots,
    cardPickedThisRound: false,
    lastRound: run.round,
  };
}

function createFullBoardReplacementCheckpoint() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let run = createRun(`solo-persistence-replacement-${attempt}`);

    while (run.status === "draft") {
      const occupiedSlots = run.boardSlots.filter((slot) => slot.cardId !== null);
      if (occupiedSlots.length === run.boardSlots.length) {
        for (const option of run.draftOptions) {
          for (const targetSlot of occupiedSlots.filter((slot) => slot.upgradeLevel === 1)) {
            const placement = applyDraftPlacement(run.boardSlots, option.cardId, targetSlot.slotIndex, {
              allowReplacement: true,
            });
            if (placement.applied && placement.classification.kind === "replace") {
              return {
                state: {
                  checkpoint: "draft",
                  run,
                  draftBoardSlots: placement.boardSlots,
                  cardPickedThisRound: true,
                  lastRound: run.round - 1,
                },
                placement,
              };
            }
          }
        }
      }

      const occupiedCardIds = new Set(occupiedSlots.map((slot) => slot.cardId));
      const pick = run.draftOptions.find((option) => !occupiedCardIds.has(option.cardId)) ?? run.draftOptions[0];
      const board = applyDraftSelectionToBoard(run, [pick.cardId]);
      run = resolveRound(chooseDraftCards(run, board));
    }
  }

  throw new Error("Could not produce a full-board upgraded-unit replacement fixture.");
}

function encodedObject(state) {
  const serialized = encodeSoloRunSnapshot(state, FIXED_SAVED_AT);
  assert.equal(typeof serialized, "string");
  return JSON.parse(serialized);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

test("draft, battle-result, and finished checkpoints round-trip without sharing mutable state", () => {
  assert.equal(SOLO_RUN_SNAPSHOT_VERSION, 5);
  assert.equal(SOLO_RUN_STORAGE_KEY, "draft-battler:solo-run:v5");

  const checkpoints = [
    createDraftCheckpoint(),
    createBattleResultCheckpoint(),
    createFinishedCheckpoint(),
  ];

  for (const state of checkpoints) {
    const snapshot = createSoloRunSnapshot(state, FIXED_SAVED_AT);
    assert.deepEqual(snapshot, {
      version: SOLO_RUN_SNAPSHOT_VERSION,
      savedAt: FIXED_SAVED_AT,
      ...state,
    });
    assert.notStrictEqual(snapshot.run, state.run);
    assert.notStrictEqual(snapshot.draftBoardSlots, state.draftBoardSlots);

    const decoded = decodeSoloRunSnapshot(JSON.stringify(snapshot));
    assert.deepEqual(decoded, snapshot);
    assert.notStrictEqual(decoded.run, snapshot.run);
    assert.notStrictEqual(decoded.run.roundHistory, snapshot.run.roundHistory);
  }
});

test("snapshot creation deep-clones input boards and combat history", () => {
  const state = createFinishedCheckpoint();
  const snapshot = createSoloRunSnapshot(state, FIXED_SAVED_AT);
  assert.ok(snapshot);

  const originalCard = snapshot.run.boardSlots[0].cardId;
  const originalWinner = snapshot.run.roundHistory[0].combatResult.winner;
  state.run.boardSlots[0].cardId = null;
  state.run.roundHistory[0].combatResult.winner = "draw";

  assert.equal(snapshot.run.boardSlots[0].cardId, originalCard);
  assert.equal(snapshot.run.roundHistory[0].combatResult.winner, originalWinner);
});

test("battle-result snapshots retain both castle HP values and the persistent enemy board", () => {
  const state = createBattleResultCheckpoint();
  const lastRecord = state.run.roundHistory.at(-1);
  const snapshot = createSoloRunSnapshot(state, FIXED_SAVED_AT);

  assert.ok(lastRecord);
  assert.ok(snapshot);
  assert.equal(snapshot.run.playerHp, lastRecord.playerHpAfter);
  assert.equal(snapshot.run.enemyHp, lastRecord.enemyHpAfter);
  assert.deepEqual(snapshot.run.enemyBoardSlots, lastRecord.enemySlots);
  assert.equal(snapshot.run.outcome, null);
});

test("combat_ready is an unsafe transient status and is never persisted", () => {
  const draft = createRun("solo-persistence-combat-ready");
  const board = applyDraftSelectionToBoard(draft, [draft.draftOptions[0].cardId]);
  const run = chooseDraftCards(draft, board);
  const unsafeState = {
    checkpoint: "draft",
    run,
    draftBoardSlots: run.boardSlots,
    cardPickedThisRound: false,
    lastRound: 1,
  };

  assert.equal(createSoloRunSnapshot(unsafeState, FIXED_SAVED_AT), undefined);
  assert.equal(encodeSoloRunSnapshot(unsafeState, FIXED_SAVED_AT), undefined);

  const storage = new MemoryStorage();
  assert.equal(saveSoloRunSnapshot(storage, unsafeState, FIXED_SAVED_AT), false);
  assert.equal(storage.getItem(SOLO_RUN_STORAGE_KEY), null);
});

test("an early defeat persists finished.lastRound as the defeated run round", () => {
  let run;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const candidate = autoplayRun(`solo-persistence-early-defeat-${attempt}`, (state) => [
      state.draftOptions.at(-1).cardId,
    ]);
    if (candidate.playerHp === 0 && candidate.round < 10) {
      run = candidate;
      break;
    }
  }

  assert.ok(run, "expected the deterministic fixture range to contain an early defeat");
  assert.equal(run.status, "finished");
  assert.equal(run.playerHp, 0);

  const state = {
    checkpoint: "finished",
    run,
    draftBoardSlots: run.boardSlots,
    cardPickedThisRound: false,
    lastRound: run.round,
  };
  const snapshot = createSoloRunSnapshot(state, FIXED_SAVED_AT);

  assert.ok(snapshot);
  assert.equal(snapshot.lastRound, snapshot.run.round);
  assert.equal(snapshot.run.roundHistory.at(-1).round, snapshot.run.round);
});

test("decoder fails closed on corruption, incompatible versions, and tampering", () => {
  const draft = encodedObject(createDraftCheckpoint());
  const finished = encodedObject(createFinishedCheckpoint());
  const cases = [
    "not-json",
    JSON.stringify({}),
    JSON.stringify({ ...draft, version: 1 }),
    JSON.stringify({ ...draft, version: 2 }),
    JSON.stringify({ ...draft, version: SOLO_RUN_SNAPSHOT_VERSION + 1 }),
    JSON.stringify({ ...draft, savedAt: -1 }),
    JSON.stringify({ ...draft, pvp: { roomId: "online-data" } }),
    JSON.stringify({ ...draft, checkpoint: "finished" }),
    JSON.stringify({ ...draft, lastRound: 2 }),
    JSON.stringify({ ...draft, cardPickedThisRound: false }),
    JSON.stringify({ ...draft, run: { ...draft.run, status: "combat_ready" } }),
    JSON.stringify({ ...draft, run: { ...draft.run, round: 11 } }),
    JSON.stringify({ ...draft, run: { ...draft.run, playerHp: 21 } }),
    JSON.stringify({ ...draft, run: { ...draft.run, enemyHp: 21 } }),
    JSON.stringify({ ...draft, run: { ...draft.run, outcome: "player" } }),
  ];

  const invalidCard = cloneJson(draft);
  invalidCard.draftBoardSlots[0].cardId = "unknown_card";
  cases.push(JSON.stringify(invalidCard));

  const duplicateSlot = cloneJson(draft);
  duplicateSlot.draftBoardSlots[1].slotIndex = 0;
  cases.push(JSON.stringify(duplicateSlot));

  const shortBoard = cloneJson(draft);
  shortBoard.draftBoardSlots.pop();
  cases.push(JSON.stringify(shortBoard));

  const forgedOption = cloneJson(draft);
  forgedOption.run.draftOptions[0].cardId = "unknown_card";
  cases.push(JSON.stringify(forgedOption));

  const missingRound = cloneJson(finished);
  missingRound.run.roundHistory.pop();
  cases.push(JSON.stringify(missingRound));

  const forgedCombat = cloneJson(finished);
  forgedCombat.run.roundHistory[0].combatResult.hpLoss += 1;
  cases.push(JSON.stringify(forgedCombat));

  const missingEnemyHp = cloneJson(finished);
  delete missingEnemyHp.run.roundHistory[0].enemyHpBefore;
  cases.push(JSON.stringify(missingEnemyHp));

  const forgedEnemyHp = cloneJson(finished);
  forgedEnemyHp.run.enemyHp = forgedEnemyHp.run.enemyHp === 0 ? 1 : forgedEnemyHp.run.enemyHp - 1;
  cases.push(JSON.stringify(forgedEnemyHp));

  const forgedEnemyPick = cloneJson(finished);
  const extraEnemySlot = forgedEnemyPick.run.roundHistory[0].enemySlots.find((slot) => slot.cardId === null);
  assert.ok(extraEnemySlot);
  extraEnemySlot.cardId = "sneakblade";
  cases.push(JSON.stringify(forgedEnemyPick));

  const wrongFinishedRound = cloneJson(finished);
  wrongFinishedRound.lastRound -= 1;
  cases.push(JSON.stringify(wrongFinishedRound));

  const pickedBattleResult = encodedObject(createBattleResultCheckpoint());
  pickedBattleResult.cardPickedThisRound = true;
  cases.push(JSON.stringify(pickedBattleResult));

  for (const serialized of cases) {
    assert.equal(decodeSoloRunSnapshot(serialized), undefined);
  }
});

test("draft checkpoint accepts rearrangement but requires a valid single picked-card effect", () => {
  const state = createBattleResultCheckpoint();
  state.checkpoint = "draft";
  state.lastRound = state.run.round - 1;
  state.draftBoardSlots = state.draftBoardSlots.map((slot) => ({ ...slot }));

  const occupied = state.draftBoardSlots.find((slot) => slot.cardId !== null);
  const empty = state.draftBoardSlots.find((slot) => slot.cardId === null);
  assert.ok(occupied);
  assert.ok(empty);

  [occupied.cardId, empty.cardId] = [empty.cardId, occupied.cardId];
  [occupied.upgradeLevel, empty.upgradeLevel] = [empty.upgradeLevel, occupied.upgradeLevel];
  assert.ok(createSoloRunSnapshot(state, FIXED_SAVED_AT));

  state.cardPickedThisRound = true;
  assert.equal(createSoloRunSnapshot(state, FIXED_SAVED_AT), undefined);
});

test("a confirmed full-board replacement of an upgraded unit survives create/decode round-trip", () => {
  const { state, placement } = createFullBoardReplacementCheckpoint();
  assert.equal(placement.classification.kind, "replace");
  assert.equal(placement.classification.replacedUpgradeLevel, 1);

  const replacedSlot = placement.boardSlots.find(
    (slot) => slot.slotIndex === placement.classification.targetSlotIndex,
  );
  assert.deepEqual(replacedSlot, {
    slotIndex: placement.classification.targetSlotIndex,
    cardId: placement.classification.cardId,
    upgradeLevel: 0,
  });

  const snapshot = createSoloRunSnapshot(state, FIXED_SAVED_AT);
  assert.ok(snapshot);
  assert.deepEqual(decodeSoloRunSnapshot(JSON.stringify(snapshot)), snapshot);
});

test("a partial-board replacement is rejected by persistence validation", () => {
  const state = createBattleResultCheckpoint();
  state.checkpoint = "draft";
  state.lastRound = state.run.round - 1;
  state.cardPickedThisRound = true;
  state.draftBoardSlots = state.run.boardSlots.map((slot) => ({ ...slot }));

  const occupiedSlot = state.draftBoardSlots.find((slot) => slot.cardId !== null);
  assert.ok(occupiedSlot);
  const replacementOption = state.run.draftOptions.find((option) => option.cardId !== occupiedSlot.cardId);
  assert.ok(replacementOption);
  occupiedSlot.cardId = replacementOption.cardId;
  occupiedSlot.upgradeLevel = 0;

  assert.equal(createSoloRunSnapshot(state, FIXED_SAVED_AT), undefined);
  assert.equal(encodeSoloRunSnapshot(state, FIXED_SAVED_AT), undefined);
});

test("storage adapter saves, loads, clears, and removes invalid payloads", () => {
  const storage = new MemoryStorage();
  const state = createDraftCheckpoint();

  storage.setItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY, "legacy-wave-snapshot");
  storage.setItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY, "legacy-ten-round-snapshot");
  storage.setItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY, "legacy-old-combat-snapshot");
  storage.setItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY, "legacy-old-bone-pact-snapshot");
  assert.equal(saveSoloRunSnapshot(storage, state, FIXED_SAVED_AT), true);
  assert.equal(storage.getItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY), null);

  storage.setItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY, "legacy-wave-snapshot");
  storage.setItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY, "legacy-ten-round-snapshot");
  storage.setItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY, "legacy-old-combat-snapshot");
  storage.setItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY, "legacy-old-bone-pact-snapshot");
  assert.deepEqual(loadSoloRunSnapshot(storage), createSoloRunSnapshot(state, FIXED_SAVED_AT));
  assert.equal(storage.getItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY), null);

  storage.setItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY, "legacy-wave-snapshot");
  storage.setItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY, "legacy-ten-round-snapshot");
  storage.setItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY, "legacy-old-combat-snapshot");
  storage.setItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY, "legacy-old-bone-pact-snapshot");
  assert.equal(clearSoloRunSnapshot(storage), true);
  assert.equal(loadSoloRunSnapshot(storage), undefined);
  assert.equal(storage.getItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY), null);

  storage.setItem(SOLO_RUN_STORAGE_KEY, "corrupted");
  assert.equal(loadSoloRunSnapshot(storage), undefined);
  assert.equal(storage.getItem(SOLO_RUN_STORAGE_KEY), null);
});

test("a v2 run finished under the old round-ten rule is removed instead of restored", () => {
  const storage = new MemoryStorage();
  const legacy = encodedObject(createFinishedCheckpoint());
  legacy.version = 2;
  legacy.lastRound = 10;
  legacy.run.round = 10;
  legacy.run.status = "finished";

  storage.setItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY, JSON.stringify(legacy));

  assert.equal(loadSoloRunSnapshot(storage), undefined);
  assert.equal(storage.getItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(SOLO_RUN_STORAGE_KEY), null);
});

test("a v3 snapshot from the previous combat rules is removed instead of restored", () => {
  const storage = new MemoryStorage();
  const legacy = encodedObject(createFinishedCheckpoint());
  legacy.version = 3;

  storage.setItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY, JSON.stringify(legacy));

  assert.equal(loadSoloRunSnapshot(storage), undefined);
  assert.equal(storage.getItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(SOLO_RUN_STORAGE_KEY), null);
});

test("a v4 snapshot from the previous Bone Pact rules is removed instead of restored", () => {
  const storage = new MemoryStorage();
  const legacy = encodedObject(createFinishedCheckpoint());
  legacy.version = 4;

  storage.setItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY, JSON.stringify(legacy));

  assert.equal(loadSoloRunSnapshot(storage), undefined);
  assert.equal(storage.getItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(SOLO_RUN_STORAGE_KEY), null);
});

test("storage failures and unavailable local storage are non-fatal", () => {
  const state = createDraftCheckpoint();
  const readFailure = {
    getItem() {
      throw new Error("read denied");
    },
    setItem() {},
    removeItem() {},
  };
  const writeFailure = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("quota exceeded");
    },
    removeItem() {},
  };
  const clearFailure = {
    getItem() {
      return "corrupted";
    },
    setItem() {},
    removeItem() {
      throw new Error("clear denied");
    },
  };

  assert.equal(loadSoloRunSnapshot(readFailure), undefined);
  assert.equal(saveSoloRunSnapshot(writeFailure, state, FIXED_SAVED_AT), false);
  assert.equal(clearSoloRunSnapshot(clearFailure), false);
  assert.equal(loadSoloRunSnapshot(clearFailure), undefined);
  assert.equal(loadSoloRunSnapshot(null), undefined);
  assert.equal(saveSoloRunSnapshot(undefined, state, FIXED_SAVED_AT), false);
  assert.equal(clearSoloRunSnapshot(null), false);
});

test("solo snapshots reject online and transient UI data", () => {
  const state = createFinishedCheckpoint();
  const serialized = encodeSoloRunSnapshot(state, FIXED_SAVED_AT);
  assert.equal(typeof serialized, "string");
  assert.equal(serialized.includes("pvp"), false);
  assert.equal(serialized.includes("selectedCardInfoId"), false);
  assert.equal(serialized.includes("playMode"), false);

  const storage = new MemoryStorage();
  const stateWithOnlineData = { ...state, pvp: { roomId: "room-1" } };
  assert.equal(saveSoloRunSnapshot(storage, stateWithOnlineData, FIXED_SAVED_AT), false);
  assert.equal(storage.getItem(SOLO_RUN_STORAGE_KEY), null);
});
