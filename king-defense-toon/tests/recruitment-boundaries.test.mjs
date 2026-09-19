import assert from 'node:assert/strict';
import test from 'node:test';
import { UNIT_TYPES, UNIT_TYPE_BY_ID } from '../units.ts';
import { createRecruitment, getRecruitProgress, getUnitStats, receiveRecruit } from '../recruitment.ts';

test('malformed save fields never become recruit counts, credits or inherited unit names', () => {
  const empty = createRecruitment();
  for (const saved of [null, false, true, 15, '', 'saved', [], { received: 'bad', legacyTrainingCredit: [] }]) {
    assert.deepEqual(createRecruitment(saved), empty);
  }
  for (const value of ['5', -1, .5, Number.MAX_SAFE_INTEGER + 1, null, false, {}, [], NaN, Infinity]) {
    assert.deepEqual(createRecruitment({ version: 2, received: { swordsman: value },
      legacyTrainingCredit: { healer: value }, lastType: 'constructor' }), empty);
  }
  const unknownVersion = createRecruitment({ version: '2', received: { archer: 7 },
    legacyTrainingCredit: { archer: 90 }, lastType: 'archer' });
  assert.equal(unknownVersion.received.archer, 7);
  assert.equal(unknownVersion.legacyTrainingCredit.archer, 0);
  assert.equal(unknownVersion.lastType, 'archer');
});

test('legacy training migration preserves receipts without granting lancer historical credit', () => {
  const saved = Object.freeze({ version: 1, received: Object.freeze({ swordsman: 12, archer: 3, healer: 0, lancer: 12 }),
    legacyTrainingCredit: Object.freeze({ lancer: 500 }), lastType: 'lancer' });
  const migrated = createRecruitment(saved);
  assert.deepEqual(migrated.received, { swordsman: 12, archer: 3, healer: 0, lancer: 12, pantherRider: 0, elfArcher: 0, elfHealer: 0, unicorn: 0 });
  assert.deepEqual(migrated.legacyTrainingCredit, { swordsman: 38, archer: 2, healer: 0, lancer: 0, pantherRider: 0, elfArcher: 0, elfHealer: 0, unicorn: 0 });
  assert.equal(migrated.lastType, 'lancer');
  assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(migrated))), migrated);
});

test('invalid recruitment states fail before a random roll or any receipt mutation', () => {
  const valid = createRecruitment();
  const badStates = [null, {}, { ...valid, version: 1 }, { ...valid, lastType: undefined },
    { ...valid, received: { swordsman: 0, archer: 0, healer: 0 } },
    { ...valid, legacyTrainingCredit: null },
    { ...valid, received: { ...valid.received, lancer: -1 } },
    { ...valid, legacyTrainingCredit: { ...valid.legacyTrainingCredit, healer: .5 } }];
  let rolls = 0;
  for (const state of badStates) {
    const before = JSON.stringify(state);
    assert.throws(() => receiveRecruit(state, () => { rolls++; return 0; }), TypeError);
    assert.throws(() => getRecruitProgress(state, 'swordsman'), TypeError);
    assert.equal(JSON.stringify(state), before);
  }
  assert.equal(rolls, 0);
  for (const type of ['king', 'constructor', '__proto__', null, 1]) {
    assert.throws(() => getRecruitProgress(valid, type), RangeError);
    assert.throws(() => getUnitStats(type), RangeError);
  }
});

test('lancer guarantee requires an exact boolean and still checks the random provider', () => {
  for (const options of [null, { guaranteedLancer: 'true' }, { guaranteedLancer: 1 }]) {
    let rolls = 0;
    const trained = createRecruitment({ version: 2, received: { swordsman: 140 } });
    const result = receiveRecruit(trained, () => { rolls++; return 0; }, options);
    assert.equal(result.type, 'swordsman');
    assert.equal(rolls, 1);
  }
  const state = createRecruitment();
  assert.throws(() => receiveRecruit(state, null, { guaranteedLancer: true }), TypeError);
  assert.deepEqual(state, createRecruitment());
});

test('saturated receipts and training remain safe and capped after a guaranteed recruit', () => {
  const max = Number.MAX_SAFE_INTEGER;
  const state = createRecruitment({ version: 2, received: { swordsman: 140, lancer: max }, legacyTrainingCredit: { lancer: max } });
  const result = receiveRecruit(state, () => { throw new Error('A guarantee must not roll'); },
    { guaranteedLancer: true });
  assert.deepEqual(result, { type: 'lancer', level: 100, received: max, progress: 0, needed: 500, leveledUp: false });
  assert.equal(state.received.lancer, max);
  assert.equal(state.lastType, 'lancer');
  assert.equal(state.received.swordsman, 140);
});

test('unit catalogue keeps shared frozen definitions and optional healing fields', () => {
  assert.deepEqual(UNIT_TYPES.map(unit => unit.id), ['swordsman', 'archer', 'healer', 'lancer', 'pantherRider', 'elfArcher', 'elfHealer', 'unicorn']);
  assert.ok(Object.isFrozen(UNIT_TYPES) && Object.isFrozen(UNIT_TYPE_BY_ID));
  for (const unit of UNIT_TYPES) {
    assert.equal(UNIT_TYPE_BY_ID[unit.id], unit);
    assert.ok(Object.isFrozen(unit));
    assert.equal(Object.hasOwn(unit, 'heal'), unit.id === 'healer' || unit.id === 'elfHealer');
  }
});
