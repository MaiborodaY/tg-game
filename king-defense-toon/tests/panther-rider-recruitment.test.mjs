import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecruitment, getRecruitChances, getRecruitProgress, getUnitStats, receiveRecruit } from '../recruitment.ts';
import { createBarracks, consumeFirstLancerGuarantee } from '../barracks.ts';
import { getMergeResult } from '../unit-merging.ts';
import { restoreCampaignRoster } from '../campaign-roster.ts';
import { createProgression } from '../progression.ts';

const unlocked = { pool: 'elves', elvesUnlocked: true };

test('the trained elf pool splits riders and archers equally and preserves both human chance tables', () => {
  const expectedHumans = getRecruitChances(true);
  const trained = createRecruitment({ version: 2, received: { pantherRider: 15 } });
  for (const lancerUnlocked of [false, true]) {
    assert.deepEqual(getRecruitChances(lancerUnlocked, 'elves', trained), [{ type: 'pantherRider', chance: .5 }, { type: 'elfArcher', chance: .5 }]);
    for (const roll of [0, .25, .499999, .5, .75, .999999]) {
      const state = createRecruitment(trained);
      const expected = roll < .5 ? 'pantherRider' : 'elfArcher';
      assert.equal(receiveRecruit(state, () => roll, { ...unlocked, lancerUnlocked }).type, expected);
      assert.deepEqual(state.received, { swordsman: 0, archer: 0, healer: 0, lancer: 0,
        pantherRider: 15 + Number(expected === 'pantherRider'), elfArcher: Number(expected === 'elfArcher'), elfHealer: 0, unicorn: 0 });
    }
  }
  assert.equal(getRecruitChances(false).length, 3);
  assert.deepEqual(getRecruitChances(true), expectedHumans);
  assert.deepEqual(expectedHumans.map(entry => entry.chance), [.25, .25, .25, .25]);
  for (const state of [undefined, trained]) {
    assert.ok(Object.isFrozen(getRecruitChances(true, 'elves', state)));
    assert.ok(getRecruitChances(true, 'elves', state).every(Object.isFrozen));
  }
});

test('locked or unsupported pools fail before rolling or changing recruitment', () => {
  for (const options of [{ pool: 'elves' }, { pool: 'elves', elvesUnlocked: false },
    { pool: 'elves', elvesUnlocked: 'true' }, { pool: 'elves', elvesUnlocked: 3 },
    { pool: 'unknown', elvesUnlocked: true }]) {
    const state = createRecruitment(), before = structuredClone(state);
    let rolls = 0;
    assert.throws(() => receiveRecruit(state, () => { rolls++; return 0; }, options), RangeError);
    assert.equal(rolls, 0);
    assert.deepEqual(state, before);
  }
  assert.throws(() => getRecruitChances(true, 'unknown'), RangeError);
  for (const roll of [NaN, Infinity, -1, 1, '0', null]) {
    const state = createRecruitment();
    assert.throws(() => receiveRecruit(state, () => roll, unlocked), RangeError);
    assert.deepEqual(state, createRecruitment());
  }
});

test('selecting elves does not consume the pending first human lancer guarantee', () => {
  const barracks = createBarracks({ level: 3, firstLancerPending: true });
  const state = createRecruitment();
  const elf = receiveRecruit(state, () => 0, { ...unlocked, lancerUnlocked: true, guaranteedLancer: true });
  assert.equal(elf.type, 'pantherRider');
  assert.equal(consumeFirstLancerGuarantee(barracks, elf.type), false);
  assert.equal(barracks.firstLancerPending, true);
  const human = receiveRecruit(state, () => { throw new Error('Human guarantee must not roll'); },
    { pool: 'humans', lancerUnlocked: true, guaranteedLancer: barracks.firstLancerPending });
  assert.equal(human.type, 'lancer');
  assert.equal(consumeFirstLancerGuarantee(barracks, human.type), true);
  assert.equal(barracks.firstLancerPending, false);
});

test('old saves gain zero rider progress without inheriting human levels or legacy credit', () => {
  for (const version of [1, 2]) {
    const saved = { version, received: { swordsman: 100, archer: 50, healer: 20, lancer: 10 },
      legacyTrainingCredit: { swordsman: 20, lancer: 10 }, lastType: 'swordsman' };
    const state = createRecruitment(saved);
    assert.equal(state.received.pantherRider, 0);
    assert.equal(state.legacyTrainingCredit.pantherRider, 0);
    assert.deepEqual(getRecruitProgress(state, 'pantherRider'),
      { type: 'pantherRider', level: 1, received: 0, progress: 0, needed: 5 });
    assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(state))), state);
  }
  const legacy = createRecruitment({ version: 1, received: { pantherRider: 12 }, legacyTrainingCredit: { pantherRider: 999 } });
  assert.equal(legacy.received.pantherRider, 12);
  assert.equal(legacy.legacyTrainingCredit.pantherRider, 0);
});

test('rider training advances independently and survives reload without upgrading existing fighters', () => {
  const state = createRecruitment();
  const riders = Array.from({ length: 15 }, () => receiveRecruit(state, () => 0, unlocked));
  assert.deepEqual(riders.map(unit => unit.level), [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3]);
  assert.equal(getRecruitProgress(state, 'swordsman').level, 1);
  assert.deepEqual(getRecruitProgress(state, 'pantherRider'),
    { type: 'pantherRider', level: 3, received: 15, progress: 0, needed: 15 });
  assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(state))), state);
});

test('riders restore in both rosters and connect only to riders beyond level one hundred', () => {
  const saved = { units: [{ type: 'pantherRider', level: 99, col: 2, row: 0 }],
    reserve: [{ type: 'pantherRider', level: 3 }, { type: 'swordsman', level: 100 }] };
  const roster = restoreCampaignRoster(saved.units, saved.reserve, createProgression());
  const failed = getMergeResult(roster.units, roster.reserve, { location: 'reserve', id: 3 }, 1);
  assert.equal(failed.reason, 'different-type');
  assert.deepEqual(failed.reserve, roster.reserve);
  const merged = getMergeResult(roster.units, roster.reserve, { location: 'reserve', id: 2 }, 1);
  assert.equal(merged.ok, true);
  assert.equal(merged.target.level, 102);
  assert.deepEqual(merged.reserve, [{ id: 3, type: 'swordsman', level: 100 }]);
  const restored = restoreCampaignRoster(JSON.parse(JSON.stringify(merged.units)),
    JSON.parse(JSON.stringify(merged.reserve)), createProgression());
  assert.equal(restored.units[0].type, 'pantherRider');
  assert.equal(restored.units[0].level, 102);
  assert.equal(getMergeResult(merged.units, merged.reserve, { location: 'reserve', id: 2 }, 1).reason, 'source-missing');
});

test('new tier is stronger at equal personal levels but does not inherit an old army level', () => {
  for (const level of [1, 10, 50, 100, 500]) {
    const rider = getUnitStats('pantherRider', level), sword = getUnitStats('swordsman', level);
    assert.ok(rider.hp > sword.hp && rider.damage > sword.damage);
  }
  assert.deepEqual(getUnitStats('pantherRider', 1), { level: 1, hp: 90, damage: 9, heal: 0 });
  assert.ok(getUnitStats('pantherRider', 1).hp < getUnitStats('swordsman', 100).hp);
  const state = createRecruitment();
  let level = 0;
  for (let count = 0; count < 27; count++) level += receiveRecruit(state, () => 0, unlocked).level;
  assert.equal(level, 63);
  assert.deepEqual(getUnitStats('pantherRider', level), { level: 63, hp: 369, damage: 37, heal: 0 });
});
