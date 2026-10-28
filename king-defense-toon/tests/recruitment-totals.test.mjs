import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecruitment, getHumanRecruitUnlock, getElfRecruitUnlock, getRecruitChances, receiveRecruit } from '../recruitment.ts';

const training = received => createRecruitment({ version: 2, received });

test('human Archer opens at 3 and Healer at 5 total levels of already open types', () => {
  const state = training({ swordsman: 14 });
  assert.equal(getHumanRecruitUnlock(state, 'archer').available, false);
  assert.equal(getHumanRecruitUnlock(state, 'healer').available, false);
  assert.equal(receiveRecruit(state, () => .99).type, 'swordsman');
  assert.equal(getHumanRecruitUnlock(state, 'archer').available, true);
  assert.equal(getHumanRecruitUnlock(state, 'healer').available, false);
  state.received.archer = 4;
  assert.equal(receiveRecruit(state, () => .99).type, 'archer');
  assert.equal(getHumanRecruitUnlock(state, 'healer').available, true, 'Swordsman 3 + Archer 2 = 5');
  assert.equal(receiveRecruit(state, () => .99).type, 'healer');
});

test('human Lancer requires 10 open human levels even with Mercenaries II', () => {
  const state = training({ swordsman: 50, archer: 15, healer: 4 });
  assert.equal(getHumanRecruitUnlock(state, 'lancer').available, false, '5 + 3 + 1 = 9');
  assert.deepEqual(getRecruitChances('humans', state).map(entry => entry.type), ['swordsman', 'archer', 'healer']);
  state.received.healer = 5;
  assert.equal(getHumanRecruitUnlock(state, 'lancer').available, true, '5 + 3 + 2 = 10');
  assert.deepEqual(getRecruitChances('humans', state).map(entry => entry.chance), [.25, .25, .25, .25]);
});

test('Elven Healer requires 5 open Elven levels and Unicorn requires 10', () => {
  const state = training({ pantherRider: 15, elfArcher: 4 });
  assert.equal(getElfRecruitUnlock(state, 'elfHealer', 4).available, false, 'Rider 3 + Archer 1 = 4');
  state.received.elfArcher = 5;
  assert.equal(getElfRecruitUnlock(state, 'elfHealer', 4).available, true, 'Rider 3 + Archer 2 = 5');
  Object.assign(state.received, { pantherRider: 50, elfArcher: 15, elfHealer: 4 });
  assert.equal(getElfRecruitUnlock(state, 'unicorn', 4).available, false, '5 + 3 + 1 = 9');
  state.received.elfHealer = 5;
  assert.equal(getElfRecruitUnlock(state, 'unicorn', 4).available, true, '5 + 3 + 2 = 10');
  assert.deepEqual(getRecruitChances('elves', state, 4).map(entry => entry.chance), [.25, .25, .25, .25]);
});

test('closed types and the other faction cannot inflate an unlock total', () => {
  const humans = training({ swordsman: 14, archer: 49500, healer: 49500, lancer: 49500, pantherRider: 49500 });
  const elves = training({ pantherRider: 14, elfArcher: 49500, elfHealer: 49500, unicorn: 49500, swordsman: 49500 });
  const before = structuredClone([humans, elves]);
  assert.equal(getHumanRecruitUnlock(humans, 'archer').available, false);
  assert.equal(getHumanRecruitUnlock(humans, 'healer').available, false);
  assert.equal(getHumanRecruitUnlock(humans, 'lancer').available, false);
  assert.equal(getElfRecruitUnlock(elves, 'elfHealer', 4).available, false);
  assert.equal(getElfRecruitUnlock(elves, 'unicorn', 4).available, false);
  assert.deepEqual([humans, elves], before, 'Reading eligibility does not erase old training');
});
