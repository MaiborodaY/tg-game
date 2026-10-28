import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecruitment, recruitsNeededForLevel, receiveRecruit } from '../recruitment.ts';

test('unlock remaining count uses Market training, including partial progress and legacy credit', () => {
  const recruits = createRecruitment({ version: 2, received: { lancer: 5 }, legacyTrainingCredit: { swordsman: 49 } });
  const before = structuredClone(recruits);
  assert.equal(recruitsNeededForLevel(recruits, 'lancer', 5), 45);
  assert.equal(recruitsNeededForLevel(recruits, 'swordsman', 5), 1);
  assert.equal(recruitsNeededForLevel(recruits, 'lancer', 1), 0);
  assert.deepEqual(recruits, before, 'The menu projection must not mutate progress');
  receiveRecruit(recruits, () => 0);
  assert.equal(recruitsNeededForLevel(recruits, 'swordsman', 5), 0);
});

test('unlock remaining count handles trained/capped units and rejects invalid targets', () => {
  const recruits = createRecruitment({ version: 2, received: { pantherRider: 49500 } });
  assert.equal(recruitsNeededForLevel(recruits, 'pantherRider', 100), 0);
  assert.equal(recruitsNeededForLevel(recruits, 'pantherRider', 5), 0);
  for (const level of [0, 101, 1.5, NaN, Infinity]) assert.throws(() => recruitsNeededForLevel(recruits, 'lancer', level), RangeError);
});
