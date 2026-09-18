import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecruitment, getRecruitChances, getRecruitLevel, getRecruitProgress, receiveRecruit } from '../recruitment.ts';
import { createBarracks, startBarracksUpgrade, completeBarracksUpgrade, consumeFirstLancerGuarantee } from '../barracks.ts';

test('locked barracks keep all existing recruitment odds and cannot roll lancer', () => {
  assert.deepEqual(getRecruitChances(), [
    { type: 'swordsman', chance: .6 }, { type: 'archer', chance: .25 }, { type: 'healer', chance: .15 },
  ]);
  for (const [roll, expected] of [[0, 'swordsman'], [.59999, 'swordsman'], [.6, 'archer'], [.84999, 'archer'], [.85, 'healer'], [.99999, 'healer']]) {
    const recruitment = createRecruitment();
    assert.equal(receiveRecruit(recruitment, () => roll).type, expected);
    assert.equal(recruitment.received.lancer, 0);
  }
  assert.equal(receiveRecruit(createRecruitment(), () => 0, { guaranteedLancer: true }).type, 'swordsman');
});

test('Barracks II gives all four types equal 25% odds at exact roll boundaries', () => {
  const chances = getRecruitChances(true);
  assert.deepEqual(chances, [
    { type: 'swordsman', chance: .25 }, { type: 'archer', chance: .25 },
    { type: 'healer', chance: .25 }, { type: 'lancer', chance: .25 },
  ]);
  assert.equal(chances.reduce((sum, entry) => sum + entry.chance, 0), 1);
  assert.ok(Object.isFrozen(chances) && chances.every(Object.isFrozen));
  for (const [roll, expected] of [[0, 'swordsman'], [.24999, 'swordsman'], [.25, 'archer'], [.49999, 'archer'],
    [.5, 'healer'], [.74999, 'healer'], [.75, 'lancer'], [.99999, 'lancer']]) {
    const recruitment = createRecruitment();
    assert.equal(receiveRecruit(recruitment, () => roll, { lancerUnlocked: true }).type, expected);
  }
});

test('first paid conversion after completion guarantees one level-one lancer and persists consumption', () => {
  const recruitment = createRecruitment({ version: 2, received: { swordsman: 50 } });
  const barracks = createBarracks();
  const started = 1_800_000_000_000;
  startBarracksUpgrade(barracks, recruitment, 200, started);
  completeBarracksUpgrade(barracks, started + 3_600_000);
  const before = JSON.parse(JSON.stringify({ recruitment, barracks }));
  // Waiting or reopening the barracks is not a conversion and does not consume the reward.
  const reloadedBarracks = createBarracks(before.barracks, started + 4_000_000);
  const reloadedRecruitment = createRecruitment(before.recruitment);
  assert.equal(reloadedBarracks.firstLancerPending, true);
  const result = receiveRecruit(reloadedRecruitment, () => { throw new Error('Guarantee should not roll'); }, {
    lancerUnlocked: true, guaranteedLancer: reloadedBarracks.firstLancerPending,
  });
  assert.equal(result.type, 'lancer');
  assert.equal(result.level, 1);
  assert.equal(result.received, 1);
  assert.equal(reloadedRecruitment.received.swordsman, 50);
  assert.equal(consumeFirstLancerGuarantee(reloadedBarracks, result.type), true);
  const saved = JSON.parse(JSON.stringify({ recruitment: reloadedRecruitment, barracks: reloadedBarracks }));
  const nextBarracks = createBarracks(saved.barracks, started + 5_000_000);
  const nextRecruitment = createRecruitment(saved.recruitment);
  const next = receiveRecruit(nextRecruitment, () => 0, {
    lancerUnlocked: nextBarracks.level === 2, guaranteedLancer: nextBarracks.firstLancerPending,
  });
  assert.equal(next.type, 'swordsman');
  assert.equal(nextRecruitment.received.lancer, 1);
  assert.equal(nextBarracks.firstLancerPending, false);
});

test('existing version-two saves preserve every receipt and training credit while adding lancer at level one', () => {
  const saved = { version: 2, received: { swordsman: 27, archer: 12, healer: 8 },
    legacyTrainingCredit: { swordsman: 23, archer: 14, healer: 0 }, lastType: 'archer' };
  const migrated = createRecruitment(saved);
  assert.deepEqual(migrated.received, { ...saved.received, lancer: 0 });
  assert.deepEqual(migrated.legacyTrainingCredit, { ...saved.legacyTrainingCredit, lancer: 0 });
  assert.equal(migrated.lastType, 'archer');
  assert.equal(getRecruitLevel(migrated, 'swordsman'), 5);
  assert.equal(getRecruitLevel(migrated, 'lancer'), 1);
  assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(migrated))), migrated);
  receiveRecruit(migrated, () => .9, { lancerUnlocked: true });
  assert.equal(migrated.received.lancer, 1);
  assert.equal(migrated.received.swordsman, 27);
  assert.equal(migrated.legacyTrainingCredit.swordsman, 23);
});

test('lancer training rises independently without changing already received fighters', () => {
  const recruitment = createRecruitment();
  const fighters = Array.from({ length: 5 }, () => receiveRecruit(recruitment, () => .9, { lancerUnlocked: true }));
  assert.deepEqual(fighters.map(fighter => fighter.level), [1, 1, 1, 1, 2]);
  assert.equal(getRecruitLevel(recruitment, 'lancer'), 2);
  assert.equal(getRecruitLevel(recruitment, 'swordsman'), 1);
  assert.deepEqual(getRecruitProgress(recruitment, 'lancer'), { type: 'lancer', level: 2, received: 5, progress: 0, needed: 10 });
  const reloaded = createRecruitment(JSON.parse(JSON.stringify(recruitment)));
  assert.deepEqual(reloaded, recruitment);
});

test('invalid random rolls never consume receipts or corrupt recruitment progress', () => {
  const recruitment = createRecruitment();
  const before = JSON.stringify(recruitment);
  for (const value of [NaN, Infinity, -1, 1, '0']) {
    assert.throws(() => receiveRecruit(recruitment, () => value, { lancerUnlocked: true }), RangeError);
    assert.equal(JSON.stringify(recruitment), before);
  }
});
