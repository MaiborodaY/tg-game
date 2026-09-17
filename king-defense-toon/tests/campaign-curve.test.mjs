import assert from 'node:assert/strict';
import test from 'node:test';
import { campaignCurve, campaignContinuationSpawns } from '../campaign-curve.mjs';
import { ENEMY_TYPES, WAVE_DEFINITIONS, getEnemyCombatType } from '../waves.mjs';

const health = wave => wave.spawns.reduce((total, spawn) => total + spawn.hp, 0);
const message = wave => `${wave.levelNumber}-${wave.roundNumber}, wave ${wave.waveInRound}`;
const continuation = WAVE_DEFINITIONS.slice(30);
const ordinary = WAVE_DEFINITIONS.slice(20).filter(wave => !wave.hasBoss);

test('both worlds continue above every preceding encounter without another opening reset', () => {
  let previous = WAVE_DEFINITIONS[29];
  for (const wave of continuation) {
    assert.ok(health(wave) > health(previous), message(wave));
    // The opening's largest late increase is 180 HP; continuations should not add a new wall.
    assert.ok(health(wave) - health(previous) <= 180, message(wave));
    previous = wave;
  }
  assert.equal(health(WAVE_DEFINITIONS[30]), 1695);
  assert.equal(health(WAVE_DEFINITIONS[46]), 2197);
  assert.ok(health(WAVE_DEFINITIONS[200]) > health(WAVE_DEFINITIONS[199]));
});

test('round finales and the following first waves preserve the opening health cadence', () => {
  const openingGain = health(WAVE_DEFINITIONS[29]) - health(WAVE_DEFINITIONS[19]);
  for (let round = 4; round <= 40; round += 1) {
    const ninth = WAVE_DEFINITIONS[round * 10 - 2];
    const finale = WAVE_DEFINITIONS[round * 10 - 1];
    const previousFinale = WAVE_DEFINITIONS[(round - 1) * 10 - 1];
    assert.equal(health(finale) - health(previousFinale), openingGain, message(finale));
    assert.ok(health(finale) > health(ninth), message(finale));
    if (round === 40) continue;
    const next = WAVE_DEFINITIONS[round * 10];
    assert.ok(health(next) > health(finale), message(next));
    assert.ok(health(next) < health(finale) * 1.02, message(next));
  }
});

test('enemy counts grow gradually within the mobile encounter limits', () => {
  let previous = ordinary[0];
  for (const wave of ordinary) {
    assert.ok(wave.total >= 8 && wave.total <= 16, message(wave));
    assert.ok(wave.total >= previous.total && wave.total <= previous.total + 1, message(wave));
    previous = wave;
  }
  for (const wave of continuation.filter(wave => wave.hasBoss)) {
    assert.ok(wave.total >= 6 && wave.total <= 10, message(wave));
  }
  assert.equal(ordinary.at(-1).total, 16);
  assert.equal(WAVE_DEFINITIONS.at(-1).total, 10);
});

test('ordinary role counts only change by one body at a time across both worlds', () => {
  const counts = wave => {
    const result = { goblin: 0, goblinArcher: 0, boar: 0 };
    for (const spawn of wave.spawns) {
      const role = spawn.type === 'goblinHealer' ? 'goblinArcher' : getEnemyCombatType(spawn.type);
      assert.ok(Object.hasOwn(result, role), message(wave));
      result[role] += 1;
    }
    return result;
  };
  let previous = counts(ordinary[0]);
  for (const wave of ordinary.slice(1)) {
    const next = counts(wave);
    for (const role of Object.keys(next)) {
      assert.ok(next[role] >= previous[role] && next[role] <= previous[role] + 1, `${message(wave)}: ${role}`);
    }
    previous = next;
  }
});

test('the goblin healer starts after 1-10, one per forest wave, without leaking into undead waves', () => {
  for (const wave of WAVE_DEFINITIONS) {
    const healers = wave.spawns.filter(spawn => spawn.type === 'goblinHealer');
    assert.equal(healers.length, wave.number >= 101 && wave.number <= 200 ? 1 : 0, message(wave));
    for (const healer of healers) {
      assert.ok(Number.isInteger(healer.heal) && healer.heal > 0, message(wave));
      assert.ok(healer.heal > healer.damage, message(wave));
      assert.equal(healer.y, 66, message(wave));
      assert.equal(healer.at, 14.8, message(wave));
    }
  }
  assert.equal(WAVE_DEFINITIONS.find(wave => wave.spawns.some(spawn => spawn.type === 'goblinHealer')).number, 101);
});

test('biomes keep their own roster and main bosses remain at the four campaign milestones', () => {
  const forest = new Set(['goblin', 'goblinArcher', 'goblinHealer', 'boar', 'goblinChief', 'ogre']);
  const undead = new Set(['skeleton', 'skeletonArcher', 'ghoul', 'cryptSpider', 'cryptKing']);
  for (const wave of continuation) {
    assert.ok(wave.spawns.every(spawn => (wave.levelNumber === 1 ? forest : undead).has(spawn.type)), message(wave));
    assert.equal(wave.spawns.filter(spawn => ENEMY_TYPES[spawn.type].isBoss).length,
      wave.waveInRound === 10 ? 1 : 0, message(wave));
  }
  assert.deepEqual(WAVE_DEFINITIONS.filter(wave => wave.isFinalBossWave).map(wave => [wave.number, wave.bossType]),
    [[100, 'ogre'], [200, 'ogre'], [300, 'cryptKing'], [400, 'cryptKing']]);
});

test('continuation APIs reject invalid campaign numbers rather than generating malformed encounters', () => {
  for (const invalid of [0, 1, 30, 401, -1, 31.5, NaN, Infinity, '31', undefined]) {
    assert.throws(() => campaignCurve(invalid), RangeError);
    assert.throws(() => campaignContinuationSpawns(invalid), RangeError);
  }
});
