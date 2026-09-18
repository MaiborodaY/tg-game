import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecruitment, getHumanRecruitUnlock, getRecruitChances, getRecruitProgress, receiveRecruit } from '../recruitment.ts';
import { openingContinuationSpawns } from '../opening-curve.ts';
import { getWaveDefinition } from '../waves.ts';

test('human roles open on their prerequisite recruitment level, including the threshold receipt', () => {
  const state = createRecruitment({ version: 2, received: { swordsman: 14 } });
  assert.equal(getHumanRecruitUnlock(state, 'archer').available, false);
  assert.equal(receiveRecruit(state, () => .99).type, 'swordsman');
  assert.equal(getRecruitProgress(state, 'swordsman').level, 3);
  assert.equal(getHumanRecruitUnlock(state, 'archer').available, true);
  assert.deepEqual(getRecruitChances(false, 'humans', state), [
    { type: 'swordsman', chance: .5 }, { type: 'archer', chance: .5 },
  ]);
  for (let count = 0; count < 14; count++) assert.equal(receiveRecruit(state, () => .99).type, 'archer');
  assert.equal(getHumanRecruitUnlock(state, 'healer').available, false);
  assert.equal(receiveRecruit(state, () => .99).type, 'archer');
  assert.equal(getHumanRecruitUnlock(state, 'healer').available, true);
  assert.equal(receiveRecruit(state, () => .99).type, 'healer');
});

test('only open human types share the pool equally, including Barracks II before healer training', () => {
  for (const [received, lancer, types] of [
    [{}, false, ['swordsman']],
    [{ swordsman: 15 }, false, ['swordsman', 'archer']],
    [{ swordsman: 15, archer: 15 }, false, ['swordsman', 'archer', 'healer']],
    [{ swordsman: 50 }, true, ['swordsman', 'archer', 'lancer']],
    [{ swordsman: 50, archer: 15 }, true, ['swordsman', 'archer', 'healer', 'lancer']],
  ]) {
    const state = createRecruitment({ version: 2, received });
    assert.deepEqual(getRecruitChances(lancer, 'humans', state), types.map(type => ({ type, chance: 1 / types.length })));
    for (const [index, type] of types.entries()) {
      assert.equal(receiveRecruit(createRecruitment(state), () => (index + .5) / types.length,
        { lancerUnlocked: lancer }).type, type);
    }
  }
});

test('legacy earned training and reloads preserve unlocks without granting new receipts', () => {
  const state = createRecruitment({ version: 1, received: { swordsman: 6, archer: 6 } });
  const saved = structuredClone(state);
  assert.equal(getHumanRecruitUnlock(state, 'archer').available, true);
  assert.equal(getHumanRecruitUnlock(state, 'healer').available, true);
  assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(state))), saved);
  assert.deepEqual(state.received, saved.received);
  assert.equal(getHumanRecruitUnlock(createRecruitment(), 'lancer').available, false);
});

test('1-2 wave 9 loses only its last melee escort without redistributing its health', () => {
  const wave = getWaveDefinition(19), baseline = openingContinuationSpawns(19);
  assert.equal(wave.total, 7);
  assert.deepEqual(baseline.filter(spawn => spawn.at === 14.8).map(spawn => spawn.type), ['goblin', 'boar', 'goblinArcher']);
  assert.equal(baseline.reduce((sum, spawn) => sum + spawn.hp, 0), 969);
  assert.equal(wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0), 1066);
  assert.ok(1 - 1066 / 1232 > .10 && 1 - 1066 / 1232 < .15);
  for (const number of [18, 21, 29]) assert.equal(getWaveDefinition(number).total, 8);
  assert.equal(getWaveDefinition(20).hasBoss, true);
});
