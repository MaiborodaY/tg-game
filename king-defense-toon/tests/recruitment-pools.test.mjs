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
  for (const level of [undefined, null, '3', 0, -1, 2.5, 4, Infinity, NaN]) {
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

test('elf previews cannot spend slaves or roll recruits even when their pool is unlocked', () => {
  for (const level of [1, 2, 3]) {
    assert.equal(canRecruitFromPool('humans', level), true);
    assert.equal(canRecruitFromPool('elves', level), false);
  }
  for (const level of [undefined, null, '3', 0, 4, NaN]) {
    assert.equal(canRecruitFromPool('humans', level), false);
    assert.equal(canRecruitFromPool('elves', level), false);
  }
  assert.equal(canRecruitFromPool('dwarves', 3), false);
  assert.equal(getRecruitmentPoolName('humans'), 'Human recruits');
  assert.equal(getRecruitmentPoolName('elves'), 'Elven recruits');
});

test('four immutable elf previews show three initial roles and a locked unicorn', () => {
  assert.deepEqual(ELF_RECRUITS, [
    { id: 'pantherRider', name: 'Panther Rider', role: 'Melee', locked: false },
    { id: 'elfArcher', name: 'Elven Archer', role: 'Ranged', locked: false },
    { id: 'elfHealer', name: 'Elven Healer', role: 'Healing', locked: false },
    { id: 'unicorn', name: 'Unicorn', role: 'Special', locked: true },
  ]);
  assert.ok(Object.isFrozen(ELF_RECRUITS));
  assert.ok(ELF_RECRUITS.every(Object.isFrozen));
  assert.throws(() => ELF_RECRUITS.push({ id: 'unicorn' }), TypeError);
  assert.throws(() => { ELF_RECRUITS[3].locked = false; }, TypeError);
});
