import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ELF_RECRUITS, canRecruitFromPool, getRecruitmentPoolName,
  isRecruitmentPoolUnlocked, normalizeRecruitmentPool,
} from '../recruitment-pools.ts';
import { createBarracks, completeBarracksUpgrade } from '../barracks.ts';

test('older saves and unrecognized recruitment pools fall back to humans', () => {
  for (const saved of [undefined, null, '', 'humans', 'dwarves', 'Elves', 3, {}, ['elves'], { pool: 'elves' }]) {
    assert.equal(normalizeRecruitmentPool(saved, 3), 'humans');
  }
  assert.equal(normalizeRecruitmentPool('elves', 3), 'elves');
  assert.equal(normalizeRecruitmentPool('elves', 4), 'elves');
  const restored = JSON.parse(JSON.stringify({ recruitmentPool: 'elves' }));
  assert.equal(normalizeRecruitmentPool(restored.recruitmentPool, 3), 'elves');
});

test('elf selection requires a supported completed Barracks III level without coercion', () => {
  for (const level of [1, 2]) {
    assert.equal(isRecruitmentPoolUnlocked('humans', level), true);
    assert.equal(isRecruitmentPoolUnlocked('elves', level), false);
    assert.equal(normalizeRecruitmentPool('elves', level), 'humans');
  }
  assert.equal(isRecruitmentPoolUnlocked('humans', 3), true);
  assert.equal(isRecruitmentPoolUnlocked('elves', 3), true);
  assert.equal(isRecruitmentPoolUnlocked('humans', 4), true);
  assert.equal(isRecruitmentPoolUnlocked('elves', 4), true);
  for (const level of [undefined, null, '3', '4', 0, -1, 2.5, 5, Infinity, NaN]) {
    assert.equal(isRecruitmentPoolUnlocked('humans', level), false);
    assert.equal(isRecruitmentPoolUnlocked('elves', level), false);
    assert.equal(normalizeRecruitmentPool('elves', level), 'humans');
  }
  assert.equal(isRecruitmentPoolUnlocked('dwarves', 3), false);
});

test('construction in progress cannot unlock elves before Barracks III is complete', () => {
  const startedAt = 1_800_000_000_000;
  const readyAt = startedAt + 3 * 60 * 60 * 1000;
  const barracks = createBarracks({ level: 2, upgradeStartedAt: startedAt, upgradeReadyAt: readyAt }, startedAt);
  assert.equal(barracks.level, 2);
  assert.equal(isRecruitmentPoolUnlocked('elves', barracks.level), false);
  assert.equal(completeBarracksUpgrade(barracks, readyAt - 1), false);
  assert.equal(normalizeRecruitmentPool('elves', barracks.level), 'humans');
  assert.equal(completeBarracksUpgrade(barracks, readyAt), true);
  assert.equal(barracks.level, 3);
  assert.equal(normalizeRecruitmentPool('elves', barracks.level), 'elves');
  assert.equal(createBarracks({ level: 2, upgradeStartedAt: startedAt, upgradeReadyAt: readyAt }, readyAt).level, 3);
});

test('playable elf recruitment requires completed Barracks III or IV', () => {
  for (const level of [1, 2, 3, 4]) {
    assert.equal(canRecruitFromPool('humans', level), true);
    assert.equal(canRecruitFromPool('elves', level), level >= 3);
  }
  for (const level of [undefined, null, '3', '4', 0, 5, NaN]) {
    assert.equal(canRecruitFromPool('humans', level), false);
    assert.equal(canRecruitFromPool('elves', level), false);
  }
  assert.equal(canRecruitFromPool('dwarves', 3), false);
  assert.equal(getRecruitmentPoolName('humans'), 'Human recruits');
  assert.equal(getRecruitmentPoolName('elves'), 'Elven recruits');
});

test('four immutable elf entries expose every implemented class with separate unlock gates', () => {
  assert.deepEqual(ELF_RECRUITS, [
    { id: 'pantherRider', name: 'Panther Rider', role: 'Short range', locked: false, playable: true },
    { id: 'elfArcher', name: 'Elven Archer', role: 'Ranged', locked: false, playable: true },
    { id: 'elfHealer', name: 'Elven Healer', role: 'Healing', locked: false, playable: true },
    { id: 'unicorn', name: 'Unicorn', role: 'Defender · 2 tiles', locked: false, playable: true },
  ]);
  assert.ok(Object.isFrozen(ELF_RECRUITS));
  assert.ok(ELF_RECRUITS.every(Object.isFrozen));
  assert.throws(() => ELF_RECRUITS.push({ id: 'unicorn' }), TypeError);
  assert.throws(() => { ELF_RECRUITS[3].locked = false; }, TypeError);
});
