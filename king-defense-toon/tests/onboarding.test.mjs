import test from 'node:test';
import assert from 'node:assert/strict';
import { getOnboardingStep, restoreOnboardingCompleted } from '../onboarding.ts';

const fresh = { completed: false, inBattle: false, received: 0, slaves: 3, army: 0, reserve: 0, hasEmptyCell: true };

test('new campaigns opt in; legacy progress never starts a tutorial after updating', () => {
  assert.equal(restoreOnboardingCompleted(null), false);
  assert.equal(restoreOnboardingCompleted({}), true);
  assert.equal(restoreOnboardingCompleted({ clearedWaves: 0, units: [{ level: 20 }] }), true);
  assert.equal(restoreOnboardingCompleted({ onboardingCompleted: false, clearedWaves: 0 }), false);
  assert.equal(restoreOnboardingCompleted({ onboardingCompleted: false, clearedWaves: 1 }), true);
  assert.equal(restoreOnboardingCompleted({ onboardingCompleted: true, clearedWaves: 0 }), true);
});

test('all three starting conversions come before placement and the first wave', () => {
  for (let received = 0; received < 3; received++) {
    assert.equal(getOnboardingStep({ ...fresh, received, reserve: received, slaves: 3 - received }), 'market');
  }
  for (let army = 0; army < 3; army++) {
    assert.equal(getOnboardingStep({ ...fresh, received: 3, slaves: 0, army, reserve: 3 - army }), 'place');
  }
  assert.equal(getOnboardingStep({ ...fresh, received: 3, slaves: 0, army: 3, hasEmptyCell: false }), 'start');
});

test('detours never demand missing fighters or keep spending newly generated slaves', () => {
  assert.equal(getOnboardingStep({ ...fresh, received: 3, slaves: 8, reserve: 3 }), 'place');
  assert.equal(getOnboardingStep({ ...fresh, received: 3, slaves: 0, army: 1 }), 'start');
  assert.equal(getOnboardingStep({ ...fresh, received: 3, slaves: 0 }), null);
  assert.equal(getOnboardingStep({ ...fresh, received: 3, slaves: 1 }), 'market');
  assert.equal(getOnboardingStep({ ...fresh, received: 3, slaves: 0, army: 3, reserve: 1, hasEmptyCell: false }), 'start');
});

test('battle or saved completion suppresses all arrows', () => {
  assert.equal(getOnboardingStep({ ...fresh, inBattle: true }), null);
  assert.equal(getOnboardingStep({ ...fresh, completed: true }), null);
});
