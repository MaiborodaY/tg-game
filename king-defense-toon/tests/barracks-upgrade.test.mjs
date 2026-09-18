import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STARTING_SLAVES, SELL_PRICE, BARRACKS_UPGRADE_DURATION_MS, createBarracks, getBarracksUpgrade,
  startBarracksUpgrade, completeBarracksUpgrade, speedUpBarracks, consumeFirstLancerGuarantee,
} from '../barracks.mjs';
import { createRecruitment, getRecruitLevel, receiveRecruit } from '../recruitment.mjs';

const START = 1_800_000_000_000;
const HOUR = BARRACKS_UPGRADE_DURATION_MS;
const recruitmentAt = swordsman => createRecruitment({ version: 2, received: { swordsman } });

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
    assert.equal(speedUpBarracks(barracks, 100, START + elapsed).reason, 'max-level');
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
  assert.equal(startBarracksUpgrade(barracks, recruitment, 1000, START + HOUR * 2).reason, 'max-level');
  assert.equal(speedUpBarracks(barracks, 1000, START + HOUR * 2).reason, 'max-level');
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
  const invalidStates = [null, {}, { ...valid, level: 3 }, { ...valid, firstLancerPending: true },
    { ...valid, firstLancerPending: 'false' }, { ...valid, upgradeStartedAt: START },
    { ...valid, upgradeReadyAt: START + HOUR },
    { ...valid, upgradeStartedAt: START, upgradeReadyAt: START + HOUR + 1 },
    { ...valid, level: 2, upgradeStartedAt: START, upgradeReadyAt: START + HOUR }];
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
