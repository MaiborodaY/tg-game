import assert from "node:assert/strict";
import test from "node:test";

import {
  CARD_DEFINITIONS,
  applyDraftSelectionToBoard,
  autoplayRun,
  chooseDraftCards,
  createDraftOptions,
  createRun,
  resolveRound,
} from "../src/game/index.ts";
import { applyDraftPlacement } from "../src/game/placement.ts";
import {
  SOLO_RUN_ID_MAX_LENGTH,
  SOLO_RUN_RULESET_VERSION,
  SOLO_RUN_SNAPSHOT_VERSION,
  SOLO_RUN_STORAGE_KEY,
  clearSoloRunSnapshot,
  completeSoloRunSession,
  createSoloRunSession,
  createSoloRunSnapshot,
  decodeSoloRunSnapshot,
  encodeSoloRunSnapshot,
  loadSoloRunSnapshot,
  saveSoloRunSnapshot,
} from "../src/soloPersistence.ts";

const FIXED_SAVED_AT = 1_700_000_000_000;
const FIXED_STARTED_AT = FIXED_SAVED_AT - 10_000;
const FIXED_COMPLETED_AT = FIXED_SAVED_AT - 1_000;
const LEGACY_V1_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v1";
const LEGACY_V2_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v2";
const LEGACY_V3_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v3";
const LEGACY_V4_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v4";
const LEGACY_V5_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v5";
const LEGACY_V6_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v6";
const LEGACY_V7_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v7";
const LEGACY_V8_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v8";
const LEGACY_V9_SOLO_RUN_STORAGE_KEY = "draft-battler:solo-run:v9";

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

function createSession(id, finished = false, options = {}) {
  const session = createSoloRunSession({
    source: "standard",
    now: FIXED_STARTED_AT,
    runId: `session-${id}`,
    ...options,
  });
  return finished ? completeSoloRunSession(session, FIXED_COMPLETED_AT) : session;
}

function createDraftCheckpoint(botDifficulty = "standard") {
  const run = createRun(`solo-persistence-draft-${botDifficulty}`, botDifficulty);
  const draftBoardSlots = applyDraftSelectionToBoard(run, [run.draftOptions[0].cardId]);

  return {
    session: createSession(`draft-${botDifficulty}`),
    checkpoint: "draft",
    run,
    draftBoardSlots,
    cardPickedThisRound: true,
    lastRound: 1,
  };
}

function createBattleResultCheckpoint(botDifficulty = "standard") {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const draft = createRun(`solo-persistence-battle-${botDifficulty}-${attempt}`, botDifficulty);
    const board = applyDraftSelectionToBoard(draft, [draft.draftOptions[0].cardId]);
    const run = resolveRound(chooseDraftCards(draft, board));

    if (run.status === "draft") {
      return {
        session: createSession(`battle-${botDifficulty}-${attempt}`),
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

function createFinishedCheckpoint(botDifficulty = "standard") {
  const run = autoplayRun(
    `solo-persistence-finished-${botDifficulty}`,
    (state) => [state.draftOptions[0].cardId],
    botDifficulty,
  );

  return {
    session: createSession(`finished-${botDifficulty}`, true),
    checkpoint: "finished",
    run,
    draftBoardSlots: run.boardSlots,
    cardPickedThisRound: false,
    lastRound: run.round,
  };
}

function createMasteryCheckpoint(tag, seed) {
  const taggedCardIds = new Set(
    CARD_DEFINITIONS.filter((card) => card.tags.includes(tag)).map((card) => card.id),
  );
  const run = autoplayRun(seed, (state) => {
    const occupiedCardIds = new Set(state.boardSlots.flatMap((slot) => slot.cardId ? [slot.cardId] : []));
    const freshTaggedOption = state.draftOptions.find((option) =>
      taggedCardIds.has(option.cardId) && !occupiedCardIds.has(option.cardId),
    );
    const taggedOption = freshTaggedOption ?? state.draftOptions.find((option) => taggedCardIds.has(option.cardId));
    return taggedOption ? [taggedOption.cardId] : [];
  });
  const event = run.roundHistory
    .flatMap((record) => record.combatResult.events)
    .find((candidate) =>
      candidate.type === "synergy_applied"
        && candidate.owner === "player"
        && candidate.tag === tag
        && candidate.threshold === 4,
    );
  assert.ok(event, `expected ${tag} mastery in deterministic persistence fixture`);

  return {
    state: {
      session: createSession(`mastery-${tag}`, true),
      checkpoint: "finished",
      run,
      draftBoardSlots: run.boardSlots,
      cardPickedThisRound: false,
      lastRound: run.round,
    },
    event,
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
                  session: createSession(`replacement-${attempt}`),
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

function removeDamageTelemetry(snapshot) {
  const legacy = cloneJson(snapshot);
  let removed = 0;
  legacy.run.roundHistory.forEach((record) => {
    record.combatResult.events.forEach((event) => {
      if (event.type === "unit_damaged") {
        delete event.hpDamage;
        delete event.source;
        removed += 1;
      }
    });
  });
  assert.ok(removed > 0, "fixture must contain damage telemetry");
  return legacy;
}

test("draft, battle-result, and finished checkpoints round-trip without sharing mutable state", () => {
  assert.equal(SOLO_RUN_SNAPSHOT_VERSION, 10);
  assert.equal(SOLO_RUN_STORAGE_KEY, "draft-battler:solo-run:v10");
  assert.equal(SOLO_RUN_RULESET_VERSION, "draft-battler-solo-v4");

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
    assert.notStrictEqual(snapshot.session, state.session);

    const decoded = decodeSoloRunSnapshot(JSON.stringify(snapshot));
    assert.deepEqual(decoded, snapshot);
    assert.notStrictEqual(decoded.run, snapshot.run);
    assert.notStrictEqual(decoded.run.roundHistory, snapshot.run.roundHistory);
  }
});

test("v10 battle-result and finished snapshots without damage telemetry replay into canonical records", () => {
  for (const state of [createBattleResultCheckpoint(), createFinishedCheckpoint()]) {
    const snapshot = createSoloRunSnapshot(state, FIXED_SAVED_AT);
    const legacy = removeDamageTelemetry(snapshot);
    const decoded = decodeSoloRunSnapshot(JSON.stringify(legacy));

    assert.ok(decoded);
    const damageEvents = decoded.run.roundHistory
      .flatMap((record) => record.combatResult.events)
      .filter((event) => event.type === "unit_damaged");
    assert.ok(damageEvents.length > 0);
    assert.ok(damageEvents.every((event) => Number.isSafeInteger(event.hpDamage) && event.source));
  }
});

test("loading a compatible pre-telemetry v10 snapshot preserves the active save", () => {
  const storage = new MemoryStorage();
  const snapshot = createSoloRunSnapshot(createBattleResultCheckpoint(), FIXED_SAVED_AT);
  const serialized = JSON.stringify(removeDamageTelemetry(snapshot));
  storage.setItem(SOLO_RUN_STORAGE_KEY, serialized);

  const loaded = loadSoloRunSnapshot(storage);

  assert.ok(loaded);
  assert.equal(storage.getItem(SOLO_RUN_STORAGE_KEY), serialized);
  assert.ok(loaded.run.roundHistory.some((record) => record.combatResult.events.some((event) =>
    event.type === "unit_damaged" && event.source && Number.isSafeInteger(event.hpDamage),
  )));
});

test("partially missing or forged damage telemetry is rejected", () => {
  const state = createBattleResultCheckpoint();
  const missingSource = encodedObject(state);
  const missingSourceEvent = missingSource.run.roundHistory
    .flatMap((record) => record.combatResult.events)
    .find((event) => event.type === "unit_damaged");
  assert.ok(missingSourceEvent?.source);
  delete missingSourceEvent.source;
  assert.equal(decodeSoloRunSnapshot(JSON.stringify(missingSource)), undefined);

  const forgedSource = encodedObject(state);
  const forgedSourceEvent = forgedSource.run.roundHistory
    .flatMap((record) => record.combatResult.events)
    .find((event) => event.type === "unit_damaged" && event.source?.kind === "unit");
  assert.ok(forgedSourceEvent);
  forgedSourceEvent.source.unitId = "player-5-forged";
  assert.equal(decodeSoloRunSnapshot(JSON.stringify(forgedSource)), undefined);
});

test("session factories keep a stable identity and completion timestamp", () => {
  const daily = createSoloRunSession({
    source: "daily",
    dailyDateKey: "2026-08-20",
    now: FIXED_STARTED_AT,
    runId: "daily-2026-08-20",
  });
  assert.deepEqual(daily, {
    runId: "daily-2026-08-20",
    source: "daily",
    dailyDateKey: "2026-08-20",
    rulesetVersion: SOLO_RUN_RULESET_VERSION,
    startedAt: FIXED_STARTED_AT,
    completedAt: null,
  });

  const completed = completeSoloRunSession(daily, FIXED_COMPLETED_AT);
  const repeated = completeSoloRunSession(completed, FIXED_COMPLETED_AT + 5_000);
  assert.deepEqual(repeated, completed);
  assert.equal(repeated.runId, daily.runId);
  assert.equal(repeated.completedAt, FIXED_COMPLETED_AT);
});

test("strong bot difficulty round-trips and replays at every durable checkpoint", () => {
  for (const state of [
    createDraftCheckpoint("strong"),
    createBattleResultCheckpoint("strong"),
    createFinishedCheckpoint("strong"),
  ]) {
    const snapshot = createSoloRunSnapshot(state, FIXED_SAVED_AT);
    assert.ok(snapshot);
    assert.equal(snapshot.run.botDifficulty, "strong");
    assert.deepEqual(decodeSoloRunSnapshot(JSON.stringify(snapshot)), snapshot);
  }
});

test("every four-unit synergy effect round-trips through replay-validated persistence", () => {
  const cases = [
    ["warrior", "persist-tier4-warrior-0", { effectKind: "stat", value: 1, shieldBonus: 1 }],
    ["beast", "persist-tier4-beast-0", { effectKind: "stat", value: 1, speedBonus: 1 }],
    ["mage", "persist-tier4-mage-5", { effectKind: "opening_damage", value: 1, openingDamage: 1 }],
    ["undead", "persist-tier4-undead-0", { effectKind: "first_undead_death_attack", value: 1 }],
    ["rogue", "persist-tier4-rogue-0", { effectKind: "first_attack_damage", value: 2, firstAttackDamage: 2 }],
    ["guardian", "persist-tier4-guardian-1", { effectKind: "stat", value: 1, shieldBonus: 1 }],
  ];

  for (const [tag, seed, expectedEffect] of cases) {
    const fixture = createMasteryCheckpoint(tag, seed);
    assert.deepEqual({
      effectKind: fixture.event.effectKind,
      value: fixture.event.value,
      ...(fixture.event.speedBonus === undefined ? {} : { speedBonus: fixture.event.speedBonus }),
      ...(fixture.event.shieldBonus === undefined ? {} : { shieldBonus: fixture.event.shieldBonus }),
      ...(fixture.event.openingDamage === undefined ? {} : { openingDamage: fixture.event.openingDamage }),
      ...(fixture.event.firstAttackDamage === undefined ? {} : { firstAttackDamage: fixture.event.firstAttackDamage }),
    }, expectedEffect);

    const snapshot = createSoloRunSnapshot(fixture.state, FIXED_SAVED_AT);
    assert.ok(snapshot);
    const decoded = decodeSoloRunSnapshot(JSON.stringify(snapshot));
    assert.deepEqual(decoded, snapshot);
    assert.ok(decoded.run.roundHistory.some((record) => record.combatResult.events.some((event) =>
      event.type === "synergy_applied"
        && event.owner === "player"
        && event.tag === tag
        && event.threshold === 4,
    )));
  }
});

test("persistence rejects missing, forged, and inconsistent four-unit synergy payloads", () => {
  const { state } = createMasteryCheckpoint("beast", "persist-tier4-beast-0");
  const mutateMasteryEvent = (mutate) => {
    const snapshot = encodedObject(state);
    const event = snapshot.run.roundHistory
      .flatMap((record) => record.combatResult.events)
      .find((candidate) =>
        candidate.type === "synergy_applied"
          && candidate.owner === "player"
          && candidate.tag === "beast"
          && candidate.threshold === 4,
      );
    assert.ok(event);
    mutate(event);
    return JSON.stringify(snapshot);
  };

  assert.equal(decodeSoloRunSnapshot(mutateMasteryEvent((event) => delete event.threshold)), undefined);
  assert.equal(decodeSoloRunSnapshot(mutateMasteryEvent((event) => { event.effectKind = "opening_damage"; })), undefined);
  assert.equal(decodeSoloRunSnapshot(mutateMasteryEvent((event) => { event.value = 2; })), undefined);
  assert.equal(decodeSoloRunSnapshot(mutateMasteryEvent((event) => delete event.speedBonus)), undefined);
  assert.equal(decodeSoloRunSnapshot(mutateMasteryEvent((event) => { event.openingDamage = 1; })), undefined);
});

test("later-round snapshots replay draft offers with the pre-pick incumbent board", () => {
  let state;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const firstRound = createRun(`solo-incumbent-weight-${attempt}`);
    const pickedBoard = applyDraftSelectionToBoard(firstRound, [firstRound.draftOptions[0].cardId]);
    const nextRound = resolveRound(chooseDraftCards(firstRound, pickedBoard));
    if (
      nextRound.status === "draft" &&
      JSON.stringify(nextRound.draftOptions) !== JSON.stringify(createDraftOptions(nextRound.seed, nextRound.round))
    ) {
      state = {
        session: createSession(`incumbent-weight-${attempt}`),
        checkpoint: "battle_result",
        run: nextRound,
        draftBoardSlots: nextRound.boardSlots,
        cardPickedThisRound: false,
        lastRound: nextRound.round - 1,
      };
      break;
    }
  }

  assert.ok(state, "expected a deterministic seed where incumbent weighting changes the next offer");
  const snapshot = createSoloRunSnapshot(state, FIXED_SAVED_AT);
  assert.ok(snapshot);
  assert.deepEqual(decodeSoloRunSnapshot(JSON.stringify(snapshot)), snapshot);
});

test("v5-v9 active checkpoints are discarded instead of crossing the solo-v4 ruleset boundary", () => {
  const legacyCases = [
    [5, LEGACY_V5_SOLO_RUN_STORAGE_KEY],
    [6, LEGACY_V6_SOLO_RUN_STORAGE_KEY],
    [7, LEGACY_V7_SOLO_RUN_STORAGE_KEY],
    [8, LEGACY_V8_SOLO_RUN_STORAGE_KEY],
    [9, LEGACY_V9_SOLO_RUN_STORAGE_KEY],
  ];

  for (const [version, storageKey] of legacyCases) {
    const legacy = encodedObject(createDraftCheckpoint("standard"));
    legacy.version = version;
    if (version < 7) {
      delete legacy.session;
    } else {
      legacy.session.rulesetVersion = version === 7
        ? "draft-battler-solo-v1"
        : version === 8
          ? "draft-battler-solo-v2"
          : "draft-battler-solo-v3";
    }
    if (version === 5) {
      delete legacy.run.botDifficulty;
    }
    const storage = new MemoryStorage();
    storage.setItem(storageKey, JSON.stringify(legacy));

    assert.equal(loadSoloRunSnapshot(storage), undefined);
    assert.equal(storage.getItem(storageKey), null);
    assert.equal(storage.getItem(SOLO_RUN_STORAGE_KEY), null);
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
    session: createSession("combat-ready"),
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
    session: createSession("early-defeat", true),
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
    JSON.stringify({ ...draft, run: { ...draft.run, botDifficulty: "impossible" } }),
    JSON.stringify({ ...draft, session: { ...draft.session, runId: "" } }),
    JSON.stringify({ ...draft, session: { ...draft.session, runId: "x".repeat(SOLO_RUN_ID_MAX_LENGTH + 1) } }),
    JSON.stringify({ ...draft, session: { ...draft.session, source: "daily", dailyDateKey: null } }),
    JSON.stringify({ ...draft, session: { ...draft.session, dailyDateKey: "2026-08-20" } }),
    JSON.stringify({
      ...draft,
      session: { ...draft.session, source: "daily", dailyDateKey: "2026-02-30" },
    }),
    JSON.stringify({ ...draft, session: { ...draft.session, rulesetVersion: "future-rules" } }),
    JSON.stringify({ ...draft, session: { ...draft.session, startedAt: 0 } }),
    JSON.stringify({ ...draft, session: { ...draft.session, startedAt: 8_640_000_000_000_001 } }),
    JSON.stringify({ ...draft, session: { ...draft.session, completedAt: draft.session.startedAt } }),
    JSON.stringify({
      ...finished,
      session: { ...finished.session, completedAt: finished.session.startedAt - 1 },
    }),
    JSON.stringify({ ...finished, session: { ...finished.session, completedAt: null } }),
    JSON.stringify({ ...finished, session: { ...finished.session, completedAt: 8_640_000_000_000_001 } }),
    JSON.stringify({ ...draft, session: { ...draft.session, extra: true } }),
  ];

  const missingSession = cloneJson(draft);
  delete missingSession.session;
  cases.push(JSON.stringify(missingSession));

  const missingDifficulty = cloneJson(draft);
  delete missingDifficulty.run.botDifficulty;
  cases.push(JSON.stringify(missingDifficulty));

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
  storage.setItem(LEGACY_V5_SOLO_RUN_STORAGE_KEY, "corrupted-pre-difficulty-snapshot");
  storage.setItem(LEGACY_V6_SOLO_RUN_STORAGE_KEY, "legacy-pre-session-snapshot");
  storage.setItem(LEGACY_V7_SOLO_RUN_STORAGE_KEY, "legacy-solo-v1-snapshot");
  storage.setItem(LEGACY_V8_SOLO_RUN_STORAGE_KEY, "legacy-solo-v2-snapshot");
  assert.equal(saveSoloRunSnapshot(storage, state, FIXED_SAVED_AT), true);
  assert.equal(storage.getItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V5_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V6_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V7_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V8_SOLO_RUN_STORAGE_KEY), null);

  storage.setItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY, "legacy-wave-snapshot");
  storage.setItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY, "legacy-ten-round-snapshot");
  storage.setItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY, "legacy-old-combat-snapshot");
  storage.setItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY, "legacy-old-bone-pact-snapshot");
  storage.setItem(LEGACY_V5_SOLO_RUN_STORAGE_KEY, "corrupted-pre-difficulty-snapshot");
  storage.setItem(LEGACY_V6_SOLO_RUN_STORAGE_KEY, "legacy-pre-session-snapshot");
  storage.setItem(LEGACY_V7_SOLO_RUN_STORAGE_KEY, "legacy-solo-v1-snapshot");
  storage.setItem(LEGACY_V8_SOLO_RUN_STORAGE_KEY, "legacy-solo-v2-snapshot");
  assert.deepEqual(loadSoloRunSnapshot(storage), createSoloRunSnapshot(state, FIXED_SAVED_AT));
  assert.equal(storage.getItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V5_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V6_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V7_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V8_SOLO_RUN_STORAGE_KEY), null);

  storage.setItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY, "legacy-wave-snapshot");
  storage.setItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY, "legacy-ten-round-snapshot");
  storage.setItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY, "legacy-old-combat-snapshot");
  storage.setItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY, "legacy-old-bone-pact-snapshot");
  storage.setItem(LEGACY_V5_SOLO_RUN_STORAGE_KEY, "corrupted-pre-difficulty-snapshot");
  storage.setItem(LEGACY_V6_SOLO_RUN_STORAGE_KEY, "legacy-pre-session-snapshot");
  storage.setItem(LEGACY_V7_SOLO_RUN_STORAGE_KEY, "legacy-solo-v1-snapshot");
  storage.setItem(LEGACY_V8_SOLO_RUN_STORAGE_KEY, "legacy-solo-v2-snapshot");
  assert.equal(clearSoloRunSnapshot(storage), true);
  assert.equal(loadSoloRunSnapshot(storage), undefined);
  assert.equal(storage.getItem(LEGACY_V1_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V2_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V3_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V4_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V5_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V6_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V7_SOLO_RUN_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_V8_SOLO_RUN_STORAGE_KEY), null);

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
