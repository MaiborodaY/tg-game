import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STARTING_SLAVES, SELL_PRICE, BARRACKS_UPGRADE_DURATION_MS, BARRACKS_UPGRADES, createBarracks, getBarracksUpgrade,
  startBarracksUpgrade, completeBarracksUpgrade, speedUpBarracks, consumeFirstLancerGuarantee,
} from '../barracks.ts';
import { createRecruitment, getRecruitLevel, receiveRecruit } from '../recruitment.ts';

const START = 1_800_000_000_000;
const HOUR = BARRACKS_UPGRADE_DURATION_MS;
const recruitmentAt = (swordsman, lancer = 0, pantherRider = 0) => createRecruitment({ version: 2, received: { swordsman, lancer, pantherRider } });
const THIRD_DURATION = 3 * HOUR;
const FOURTH_DURATION = 6 * HOUR;

test('barracks upgrades preserve the starting slave supply and individual sale price', () => {
  assert.equal(STARTING_SLAVES, 3);
  assert.equal(SELL_PRICE, 1);
});

test('Barracks II requires recruitment level 5, reached on the 50th swordsman receipt', () => {
  const recruitment = recruitmentAt(49);
  const barracks = createBarracks();
  const before = JSON.stringify(barracks);
  assert.equal(getRecruitLevel(recruitment, 'swordsman'), 4);
  // A personal level or cleared boss is not part of this requirement.
  barracks.personalSwordsmanLevel = 100;
  barracks.clearedWaves = 400;
  assert.equal(startBarracksUpgrade(barracks, recruitment, 1000, START).reason, 'locked');
  delete barracks.personalSwordsmanLevel;
  delete barracks.clearedWaves;
  assert.equal(JSON.stringify(barracks), before);
  receiveRecruit(recruitment, () => 0);
  assert.equal(getRecruitLevel(recruitment, 'swordsman'), 5);
  assert.equal(getBarracksUpgrade(barracks, recruitment, START).canStart, true);
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 200, START), {
    ok: true, gold: 0, reason: null, cost: 200,
  });
  assert.equal(barracks.upgradeReadyAt, START + HOUR);
  assert.equal(barracks.level, 1);
  assert.equal(barracks.firstLancerPending, false);
});

test('old training credits retain earned swordsman eligibility instead of resetting the gate', () => {
  const recruitment = createRecruitment({ version: 1, received: { swordsman: 12 } });
  assert.equal(recruitment.received.swordsman, 12);
  assert.equal(recruitment.legacyTrainingCredit.swordsman, 38);
  assert.equal(getRecruitLevel(recruitment, 'swordsman'), 5);
  assert.equal(startBarracksUpgrade(createBarracks(), recruitment, 200, START).ok, true);
});

test('insufficient funds, duplicate starts and invalid clocks do not spend or restart construction', () => {
  const recruitment = recruitmentAt(50);
  const barracks = createBarracks();
  const before = JSON.stringify(barracks);
  for (const gold of [199, -1, NaN, Infinity]) {
    const result = startBarracksUpgrade(barracks, recruitment, gold, START);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'insufficient-gold');
    assert.ok(Object.is(result.gold, gold));
    assert.equal(JSON.stringify(barracks), before);
  }
  for (const now of [0, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
    assert.equal(startBarracksUpgrade(barracks, recruitment, 1000, now).reason, 'invalid-time');
    assert.equal(JSON.stringify(barracks), before);
  }
  startBarracksUpgrade(barracks, recruitment, 200, START);
  const started = JSON.stringify(barracks);
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 800, START + 1000), {
    ok: false, gold: 800, reason: 'upgrading', cost: 0,
  });
  assert.equal(JSON.stringify(barracks), started);
});

test('construction uses one real hour, persists through reload, and completes offline exactly once', () => {
  const recruitment = recruitmentAt(50);
  const barracks = createBarracks();
  startBarracksUpgrade(barracks, recruitment, 200, START);
  const reloaded = createBarracks(JSON.parse(JSON.stringify(barracks)), START + HOUR / 2);
  assert.equal(reloaded.level, 1);
  assert.equal(getBarracksUpgrade(reloaded, recruitment, START + HOUR / 2).remainingMs, HOUR / 2);
  assert.equal(completeBarracksUpgrade(reloaded, START + HOUR - 1), false);
  const ready = getBarracksUpgrade(reloaded, recruitment, START + HOUR);
  assert.equal(ready.status, 'ready');
  assert.equal(ready.speedUpCost, 0);
  assert.equal(reloaded.level, 1, 'reading the status does not mutate a save');
  assert.equal(completeBarracksUpgrade(reloaded, START + HOUR), true);
  assert.deepEqual(reloaded, { level: 2, upgradeStartedAt: null, upgradeReadyAt: null, firstLancerPending: true });
  assert.equal(completeBarracksUpgrade(reloaded, START + HOUR * 2), false);
  assert.deepEqual(createBarracks(barracks, START + HOUR * 10), reloaded);
  assert.equal(getBarracksUpgrade(reloaded, recruitment, START + HOUR).lancerUnlocked, true);
});

test('skip price declines proportionally from 100 gold and charges at most the current remaining time', () => {
  const recruitment = recruitmentAt(50);
  for (const [elapsed, expectedCost] of [[0, 100], [HOUR / 4, 75], [HOUR / 2, 50], [HOUR - 36_000, 1], [HOUR - 1, 1]]) {
    const barracks = createBarracks();
    startBarracksUpgrade(barracks, recruitment, 200, START);
    assert.equal(getBarracksUpgrade(barracks, recruitment, START + elapsed).speedUpCost, expectedCost);
    const before = JSON.stringify(barracks);
    assert.equal(speedUpBarracks(barracks, expectedCost - 1, START + elapsed).reason, 'insufficient-gold');
    assert.equal(JSON.stringify(barracks), before);
    assert.deepEqual(speedUpBarracks(barracks, 100, START + elapsed), {
      ok: true, gold: 100 - expectedCost, reason: null, cost: expectedCost,
    });
    assert.equal(barracks.level, 2);
    assert.equal(barracks.firstLancerPending, true);
    assert.equal(speedUpBarracks(barracks, 100, START + elapsed).reason, 'not-upgrading');
  }
});

test('elapsed upgrades finish free and repeated completion never restores a consumed lancer guarantee', () => {
  const barracks = createBarracks();
  const recruitment = recruitmentAt(50);
  startBarracksUpgrade(barracks, recruitment, 200, START);
  assert.deepEqual(speedUpBarracks(barracks, 0, START + HOUR), { ok: true, gold: 0, reason: null, cost: 0 });
  assert.equal(consumeFirstLancerGuarantee(barracks, 'swordsman'), false);
  assert.equal(barracks.firstLancerPending, true);
  assert.equal(consumeFirstLancerGuarantee(barracks, 'lancer'), true);
  assert.equal(consumeFirstLancerGuarantee(barracks, 'lancer'), false);
  assert.equal(completeBarracksUpgrade(barracks, START + HOUR * 2), false);
  assert.equal(startBarracksUpgrade(barracks, recruitment, 1000, START + HOUR * 2).reason, 'locked');
  assert.equal(speedUpBarracks(barracks, 1000, START + HOUR * 2).reason, 'not-upgrading');
  assert.equal(createBarracks(barracks, START + HOUR * 3).firstLancerPending, false);
});

test('clock rollback never grants completion or increases skip price beyond 100', () => {
  const barracks = createBarracks();
  const recruitment = recruitmentAt(50);
  startBarracksUpgrade(barracks, recruitment, 200, START);
  const reloaded = createBarracks(barracks, START - HOUR);
  assert.equal(reloaded.level, 1);
  assert.equal(getBarracksUpgrade(reloaded, recruitment, START - HOUR).remainingMs, HOUR);
  assert.equal(getBarracksUpgrade(reloaded, recruitment, START - HOUR).speedUpCost, 100);
  assert.equal(completeBarracksUpgrade(reloaded, NaN), false);
  assert.equal(speedUpBarracks(reloaded, 100, 0).reason, 'invalid-time');
  assert.deepEqual(speedUpBarracks(reloaded, 100, START - HOUR), { ok: true, gold: 0, reason: null, cost: 100 });
});

test('legacy and malformed barracks saves default safely without inventing a free unlock', () => {
  const baseline = { level: 1, upgradeStartedAt: null, upgradeReadyAt: null, firstLancerPending: false };
  for (const saved of [undefined, null, {}, { level: '2' }, { level: 1, firstLancerPending: true },
    { level: 1, upgradeStartedAt: START, upgradeReadyAt: START + 1000 },
    { level: 1, upgradeStartedAt: -1, upgradeReadyAt: HOUR - 1 }]) {
    assert.deepEqual(createBarracks(saved, START + HOUR), baseline);
  }
  assert.equal(speedUpBarracks(createBarracks(), 100, START).reason, 'not-upgrading');
  assert.equal(consumeFirstLancerGuarantee(createBarracks(), 'lancer'), false);
});

test('all barracks actions reject inconsistent runtime state before changing it or charging gold', () => {
  const recruitment = recruitmentAt(50);
  const valid = createBarracks({}, START);
  const invalidStates = [null, {}, { ...valid, level: 5 }, { ...valid, firstLancerPending: true },
    { ...valid, firstLancerPending: 'false' }, { ...valid, upgradeStartedAt: START },
    { ...valid, upgradeReadyAt: START + HOUR },
    { ...valid, upgradeStartedAt: START, upgradeReadyAt: START + HOUR + 1 },
    { ...valid, level: 2, upgradeStartedAt: START, upgradeReadyAt: START + HOUR },
    { ...valid, level: 3, upgradeStartedAt: START, upgradeReadyAt: START + THIRD_DURATION },
    { ...valid, level: 4, upgradeStartedAt: START, upgradeReadyAt: START + FOURTH_DURATION }];
  const actions = [state => getBarracksUpgrade(state, recruitment, START),
    state => startBarracksUpgrade(state, recruitment, 1000, START),
    state => completeBarracksUpgrade(state, START + HOUR),
    state => speedUpBarracks(state, 1000, START),
    state => consumeFirstLancerGuarantee(state, 'lancer')];
  for (const state of invalidStates) for (const action of actions) {
    const before = structuredClone(state);
    assert.throws(() => action(state), { name: 'TypeError', message: 'Invalid barracks state' });
    assert.deepEqual(state, before);
  }
});

test('Barracks III requires Lancer recruitment level 5 and charges 2000 gold for three hours', () => {
  const recruitment = recruitmentAt(1000, 49);
  const barracks = createBarracks({ level: 2 }, START);
  barracks.personalLancerLevel = 100;
  const locked = getBarracksUpgrade(barracks, recruitment, START);
  assert.equal(locked.targetLevel, 3);
  assert.equal(locked.requiredRecruitType, 'lancer');
  assert.equal(locked.requiredRecruitLevel, 5);
  assert.equal(locked.recruitLevel, 4);
  assert.equal(locked.cost, 2000);
  assert.equal(locked.durationMs, THIRD_DURATION);
  assert.equal(locked.speedUpMaxCost, 300);
  assert.equal(locked.lancerUnlocked, true);
  assert.equal(startBarracksUpgrade(barracks, recruitment, 5000, START).reason, 'locked');
  receiveRecruit(recruitment, () => .9, { lancerUnlocked: true });
  assert.equal(getRecruitLevel(recruitment, 'lancer'), 5);
  assert.equal(getBarracksUpgrade(barracks, recruitment, START).canStart, true);
  const before = structuredClone(barracks);
  for (const gold of [1999, -1, NaN, Infinity, '2000', 2000.5, Number.MAX_SAFE_INTEGER + 1]) {
    const result = startBarracksUpgrade(barracks, recruitment, gold, START);
    assert.equal(result.reason, 'insufficient-gold');
    assert.ok(Object.is(result.gold, gold));
    assert.deepEqual(barracks, before);
  }
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 2500, START), { ok: true, gold: 500, reason: null, cost: 2000 });
  assert.equal(barracks.level, 2);
  assert.equal(barracks.upgradeReadyAt, START + THIRD_DURATION);
  assert.equal(barracks.firstLancerPending, false);
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 2500, START + HOUR), { ok: false, gold: 2500, reason: 'upgrading', cost: 0 });
  assert.equal(barracks.upgradeStartedAt, START);
});

test('Barracks III timer survives reload and offline completion without granting another Lancer', () => {
  const recruitment = recruitmentAt(50, 50);
  for (const pending of [false, true]) {
    const barracks = createBarracks({ level: 2, firstLancerPending: pending }, START);
    startBarracksUpgrade(barracks, recruitment, 2000, START);
    const reloaded = createBarracks(JSON.parse(JSON.stringify(barracks)), START + HOUR);
    assert.equal(reloaded.level, 2);
    assert.equal(getBarracksUpgrade(reloaded, recruitment, START + HOUR).remainingMs, 2 * HOUR);
    assert.equal(completeBarracksUpgrade(reloaded, START + THIRD_DURATION - 1), false);
    assert.equal(getBarracksUpgrade(reloaded, recruitment, START + THIRD_DURATION).status, 'ready');
    assert.equal(completeBarracksUpgrade(reloaded, START + THIRD_DURATION), true);
    assert.deepEqual(reloaded, { level: 3, upgradeStartedAt: null, upgradeReadyAt: null, firstLancerPending: pending });
    assert.deepEqual(createBarracks(barracks, START + THIRD_DURATION * 2), reloaded);
    assert.equal(completeBarracksUpgrade(reloaded, START + THIRD_DURATION * 2), false);
    const next = getBarracksUpgrade(reloaded, recruitment, START + THIRD_DURATION);
    assert.equal(next.status, 'locked');
    assert.equal(next.targetLevel, 4);
    assert.equal(next.requiredRecruitType, 'pantherRider');
    assert.equal(next.canStart, false);
    assert.equal(next.lancerUnlocked, true);
    assert.equal(next.cost, 5000);
    assert.equal(next.durationMs, FOURTH_DURATION);
    assert.equal(next.speedUpMaxCost, 600);
    assert.equal(next.remainingMs, 0);
    assert.equal(next.speedUpCost, 0);
    assert.equal(startBarracksUpgrade(reloaded, recruitment, 5000, START + THIRD_DURATION).reason, 'locked');
    assert.equal(speedUpBarracks(reloaded, 5000, START + THIRD_DURATION).reason, 'not-upgrading');
    assert.equal(consumeFirstLancerGuarantee(reloaded, 'swordsman'), false);
    assert.equal(consumeFirstLancerGuarantee(reloaded, 'lancer'), pending);
    assert.equal(consumeFirstLancerGuarantee(reloaded, 'lancer'), false);
    assert.equal(createBarracks(reloaded, START + THIRD_DURATION * 3).firstLancerPending, false);
  }
});

test('Barracks III skip charges the current proportion of 300 gold including a stale displayed price', () => {
  const recruitment = recruitmentAt(50, 50);
  for (const [elapsed, expectedCost] of [[0, 300], [HOUR, 200], [THIRD_DURATION / 2, 150], [THIRD_DURATION - 36_000, 1], [THIRD_DURATION - 1, 1]]) {
    const barracks = createBarracks({ level: 2 }, START);
    startBarracksUpgrade(barracks, recruitment, 2000, START);
    assert.equal(getBarracksUpgrade(barracks, recruitment, START).speedUpCost, 300);
    const before = structuredClone(barracks);
    assert.equal(speedUpBarracks(barracks, expectedCost - 1, START + elapsed).reason, 'insufficient-gold');
    assert.deepEqual(barracks, before);
    assert.deepEqual(speedUpBarracks(barracks, 300, START + elapsed), { ok: true, gold: 300 - expectedCost, reason: null, cost: expectedCost });
    assert.equal(barracks.level, 3);
    assert.equal(barracks.firstLancerPending, false);
    assert.equal(speedUpBarracks(barracks, 300, START + elapsed).reason, 'not-upgrading');
  }
  const elapsed = createBarracks({ level: 2 }, START);
  startBarracksUpgrade(elapsed, recruitment, 2000, START);
  assert.deepEqual(speedUpBarracks(elapsed, 0, START + THIRD_DURATION), { ok: true, gold: 0, reason: null, cost: 0 });
  assert.equal(elapsed.level, 3);
});

test('Barracks III validates transition-specific timers, rollback and safe integer boundaries', () => {
  const recruitment = recruitmentAt(50, 50);
  const base = createBarracks({ level: 2, firstLancerPending: true }, START);
  for (const timer of [
    { upgradeStartedAt: START, upgradeReadyAt: START + HOUR },
    { upgradeStartedAt: START, upgradeReadyAt: START + THIRD_DURATION + 1 },
    { upgradeStartedAt: START + .5, upgradeReadyAt: START + .5 + THIRD_DURATION },
    { upgradeStartedAt: Number.MAX_SAFE_INTEGER - THIRD_DURATION + 1, upgradeReadyAt: Number.MAX_SAFE_INTEGER + 1 },
  ]) assert.deepEqual(createBarracks({ ...base, ...timer }, START + THIRD_DURATION * 2), base);
  const lastStart = Number.MAX_SAFE_INTEGER - THIRD_DURATION;
  const edge = structuredClone(base);
  assert.equal(startBarracksUpgrade(edge, recruitment, 2000, lastStart + 1).reason, 'invalid-time');
  assert.deepEqual(edge, base);
  assert.equal(startBarracksUpgrade(edge, recruitment, 2000, lastStart).ok, true);
  assert.equal(edge.upgradeReadyAt, Number.MAX_SAFE_INTEGER);
  assert.deepEqual(createBarracks(edge, lastStart), edge);
  assert.equal(completeBarracksUpgrade(edge, Number.MAX_SAFE_INTEGER), true);
  const rollback = structuredClone(base);
  startBarracksUpgrade(rollback, recruitment, 2000, START);
  for (const now of [START - HOUR, null, NaN, Infinity, -1, 0, '1800000000000']) {
    const info = getBarracksUpgrade(rollback, recruitment, now);
    assert.equal(info.remainingMs, THIRD_DURATION);
    assert.equal(info.speedUpCost, 300);
  }
  assert.equal(createBarracks(rollback, START - HOUR).level, 2);
  assert.deepEqual(speedUpBarracks(rollback, 300, START - HOUR), { ok: true, gold: 0, reason: null, cost: 300 });
  assert.equal(rollback.firstLancerPending, true);
});

test('a stale start request finishing Barracks II never buys Barracks III in the same action', () => {
  const recruitment = recruitmentAt(50, 50);
  const barracks = createBarracks({}, START);
  startBarracksUpgrade(barracks, recruitment, 200, START);
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 5000, START + HOUR), { ok: false, gold: 5000, reason: 'upgrading', cost: 0 });
  assert.equal(barracks.level, 2);
  assert.equal(barracks.upgradeStartedAt, null);
  assert.equal(barracks.firstLancerPending, true);
  assert.equal(getBarracksUpgrade(barracks, recruitment, START + HOUR).targetLevel, 3);
  assert.equal(getBarracksUpgrade(barracks, recruitment, START + HOUR).canStart, true);
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 5000, START + HOUR), { ok: true, gold: 3000, reason: null, cost: 2000 });
});

test('upgrade definitions are immutable and retain the established Barracks II price and timing', () => {
  assert.ok(Object.isFrozen(BARRACKS_UPGRADES));
  assert.ok(Object.values(BARRACKS_UPGRADES).every(Object.isFrozen));
  assert.deepEqual(BARRACKS_UPGRADES[2], { targetLevel: 2, requiredRecruitType: 'swordsman', requiredRecruitLevel: 5,
    cost: 200, durationMs: HOUR, speedUpMaxCost: 100 });
  assert.deepEqual(BARRACKS_UPGRADES[3], { targetLevel: 3, requiredRecruitType: 'lancer', requiredRecruitLevel: 5,
    cost: 2000, durationMs: THIRD_DURATION, speedUpMaxCost: 300 });
  assert.deepEqual(BARRACKS_UPGRADES[4], { targetLevel: 4, requiredRecruitType: 'pantherRider', requiredRecruitLevel: 5,
    cost: 5000, durationMs: FOURTH_DURATION, speedUpMaxCost: 600 });
  const info = getBarracksUpgrade(createBarracks(), recruitmentAt(50), START);
  assert.equal(info.targetLevel, 2);
  assert.equal(info.requiredRecruitType, 'swordsman');
  assert.equal(info.requiredRecruitLevel, 5);
  assert.equal(info.durationMs, HOUR);
  assert.equal(info.cost, 200);
});

test('construction timestamps stay within safe integers and invalid status clocks cannot inflate prices', () => {
  const recruitment = recruitmentAt(50);
  const lastStart = Number.MAX_SAFE_INTEGER - HOUR;
  const barracks = createBarracks({}, START);
  assert.equal(startBarracksUpgrade(barracks, recruitment, 200, lastStart).ok, true);
  assert.equal(barracks.upgradeReadyAt, Number.MAX_SAFE_INTEGER);
  for (const now of [null, '1800000000000', NaN, Infinity, 0, -1]) {
    const status = getBarracksUpgrade(barracks, recruitment, now);
    assert.equal(status.remainingMs, HOUR);
    assert.equal(status.speedUpCost, 100);
    assert.equal(status.status, 'upgrading');
  }
  const roundTrip = createBarracks(JSON.parse(JSON.stringify(barracks)), lastStart);
  assert.deepEqual(roundTrip, barracks);
  assert.equal(completeBarracksUpgrade(roundTrip, Number.MAX_SAFE_INTEGER), true);
  const overflow = { ...barracks, upgradeStartedAt: lastStart + 1, upgradeReadyAt: Number.MAX_SAFE_INTEGER + 1 };
  assert.deepEqual(createBarracks(overflow, START), createBarracks({}, START));
  assert.equal(startBarracksUpgrade(createBarracks(), recruitment, 200, lastStart + 1).reason, 'invalid-time');
});

test('Barracks IV requires Panther Rider recruitment level 5 and charges 5000 gold for six hours', () => {
  const recruitment = recruitmentAt(1000, 1000, 49), barracks = createBarracks({ level: 3 }, START);
  barracks.personalRiderLevel = 500;
  const locked = getBarracksUpgrade(barracks, recruitment, START);
  assert.equal(locked.targetLevel, 4); assert.equal(locked.requiredRecruitType, 'pantherRider');
  assert.equal(locked.requiredRecruitLevel, 5); assert.equal(locked.recruitLevel, 4);
  assert.equal(locked.status, 'locked'); assert.equal(locked.cost, 5000);
  assert.equal(locked.durationMs, FOURTH_DURATION); assert.equal(locked.speedUpMaxCost, 600);
  assert.equal(startBarracksUpgrade(barracks, recruitment, 10000, START).reason, 'locked');
  receiveRecruit(recruitment, () => 0, { pool: 'elves', elvesUnlocked: true });
  assert.equal(getRecruitLevel(recruitment, 'pantherRider'), 5);
  assert.equal(getBarracksUpgrade(barracks, recruitment, START).status, 'available');
  const before = structuredClone(barracks);
  for (const gold of [4999, -1, NaN, Infinity, '5000', 5000.5, Number.MAX_SAFE_INTEGER + 1]) {
    const result = startBarracksUpgrade(barracks, recruitment, gold, START);
    assert.equal(result.reason, 'insufficient-gold'); assert.ok(Object.is(result.gold, gold));
    assert.deepEqual(barracks, before);
  }
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 6000, START), { ok: true, gold: 1000, reason: null, cost: 5000 });
  assert.equal(barracks.level, 3); assert.equal(barracks.upgradeStartedAt, START);
  assert.equal(barracks.upgradeReadyAt, START + FOURTH_DURATION);
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 10000, START + HOUR), { ok: false, gold: 10000, reason: 'upgrading', cost: 0 });
  assert.equal(barracks.upgradeStartedAt, START);
});

test('Barracks IV survives offline reload, finishes exactly once and preserves the Lancer guarantee', () => {
  const recruitment = recruitmentAt(50, 50, 50);
  for (const firstLancerPending of [false, true]) {
    const barracks = createBarracks({ level: 3, firstLancerPending }, START);
    startBarracksUpgrade(barracks, recruitment, 5000, START);
    const reloaded = createBarracks(JSON.parse(JSON.stringify(barracks)), START + HOUR);
    assert.equal(reloaded.level, 3);
    assert.equal(getBarracksUpgrade(reloaded, recruitment, START + HOUR).remainingMs, 5 * HOUR);
    assert.equal(completeBarracksUpgrade(reloaded, START + FOURTH_DURATION - 1), false);
    assert.equal(getBarracksUpgrade(reloaded, recruitment, START + FOURTH_DURATION).status, 'ready');
    assert.equal(completeBarracksUpgrade(reloaded, START + FOURTH_DURATION), true);
    assert.deepEqual(reloaded, { level: 4, upgradeStartedAt: null, upgradeReadyAt: null, firstLancerPending });
    assert.deepEqual(createBarracks(barracks, START + FOURTH_DURATION), reloaded);
    assert.equal(completeBarracksUpgrade(reloaded, START + FOURTH_DURATION * 2), false);
    const info = getBarracksUpgrade(reloaded, recruitment, START + FOURTH_DURATION);
    assert.equal(info.status, 'complete'); assert.equal(info.targetLevel, null); assert.equal(info.canStart, false);
    assert.equal(info.lancerUnlocked, true);
    for (const field of ['cost', 'durationMs', 'remainingMs', 'speedUpCost', 'speedUpMaxCost']) assert.equal(info[field], 0);
    assert.equal(startBarracksUpgrade(reloaded, recruitment, 10000, START).reason, 'max-level');
    assert.equal(speedUpBarracks(reloaded, 10000, START).reason, 'max-level');
    assert.equal(consumeFirstLancerGuarantee(reloaded, 'lancer'), firstLancerPending);
    assert.equal(consumeFirstLancerGuarantee(reloaded, 'lancer'), false);
    assert.equal(createBarracks(reloaded, START + FOURTH_DURATION * 3).firstLancerPending, false);
  }
});

test('Barracks IV skip falls proportionally from 600 gold, recomputes stale prices and completes free at the boundary', () => {
  const recruitment = recruitmentAt(50, 50, 50);
  for (const [elapsed, expectedCost] of [[0, 600], [HOUR, 500], [3 * HOUR, 300], [FOURTH_DURATION - 36_000, 1], [FOURTH_DURATION - 1, 1]]) {
    const barracks = createBarracks({ level: 3 }, START);
    startBarracksUpgrade(barracks, recruitment, 5000, START);
    assert.equal(getBarracksUpgrade(barracks, recruitment, START).speedUpCost, 600);
    assert.equal(getBarracksUpgrade(barracks, recruitment, START + elapsed).speedUpCost, expectedCost);
    const before = structuredClone(barracks);
    assert.equal(speedUpBarracks(barracks, expectedCost - 1, START + elapsed).reason, 'insufficient-gold');
    assert.deepEqual(barracks, before);
    assert.deepEqual(speedUpBarracks(barracks, 600, START + elapsed), { ok: true, gold: 600 - expectedCost, reason: null, cost: expectedCost });
    assert.equal(barracks.level, 4); assert.equal(barracks.firstLancerPending, false);
    assert.equal(speedUpBarracks(barracks, 600, START + elapsed).reason, 'max-level');
  }
  const barracks = createBarracks({ level: 3 }, START); startBarracksUpgrade(barracks, recruitment, 5000, START);
  assert.deepEqual(speedUpBarracks(barracks, 0, START + FOURTH_DURATION), { ok: true, gold: 0, reason: null, cost: 0 });
});

test('Barracks IV rejects incorrect tier timers and unsafe clocks without granting free progress', () => {
  const recruitment = recruitmentAt(50, 50, 50), base = createBarracks({ level: 3 }, START);
  for (const timer of [
    { upgradeStartedAt: START, upgradeReadyAt: START + HOUR },
    { upgradeStartedAt: START, upgradeReadyAt: START + THIRD_DURATION },
    { upgradeStartedAt: START, upgradeReadyAt: START + FOURTH_DURATION + 1 },
    { upgradeStartedAt: START + .5, upgradeReadyAt: START + .5 + FOURTH_DURATION },
    { upgradeStartedAt: Number.MAX_SAFE_INTEGER - FOURTH_DURATION + 1, upgradeReadyAt: Number.MAX_SAFE_INTEGER + 1 },
  ]) assert.deepEqual(createBarracks({ ...base, ...timer }, START + FOURTH_DURATION * 2), base);
  const lastStart = Number.MAX_SAFE_INTEGER - FOURTH_DURATION, edge = structuredClone(base);
  assert.equal(startBarracksUpgrade(edge, recruitment, 5000, lastStart + 1).reason, 'invalid-time');
  assert.deepEqual(edge, base);
  assert.equal(startBarracksUpgrade(edge, recruitment, 5000, lastStart).ok, true);
  assert.equal(edge.upgradeReadyAt, Number.MAX_SAFE_INTEGER);
  assert.deepEqual(createBarracks(edge, lastStart), edge);
  assert.equal(completeBarracksUpgrade(edge, Number.MAX_SAFE_INTEGER), true);
  const rollback = structuredClone(base); startBarracksUpgrade(rollback, recruitment, 5000, START);
  for (const now of [START - HOUR, null, NaN, Infinity, -1, 0, '1800000000000']) {
    const status = getBarracksUpgrade(rollback, recruitment, now);
    assert.equal(status.remainingMs, FOURTH_DURATION); assert.equal(status.speedUpCost, 600);
  }
  assert.deepEqual(speedUpBarracks(rollback, 600, START - HOUR), { ok: true, gold: 0, reason: null, cost: 600 });
  assert.equal(rollback.level, 4);
});

test('a stale start completing Barracks III never pays for IV in the same action', () => {
  const recruitment = recruitmentAt(50, 50, 50), barracks = createBarracks({ level: 2 }, START);
  startBarracksUpgrade(barracks, recruitment, 2000, START);
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 10000, START + THIRD_DURATION), { ok: false, gold: 10000, reason: 'upgrading', cost: 0 });
  assert.equal(barracks.level, 3); assert.equal(barracks.upgradeReadyAt, null);
  assert.equal(getBarracksUpgrade(barracks, recruitment, START + THIRD_DURATION).canStart, true);
  assert.deepEqual(startBarracksUpgrade(barracks, recruitment, 10000, START + THIRD_DURATION), { ok: true, gold: 5000, reason: null, cost: 5000 });
  assert.equal(barracks.upgradeReadyAt, START + THIRD_DURATION + FOURTH_DURATION);
});
