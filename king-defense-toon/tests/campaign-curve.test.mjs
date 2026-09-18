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
    // The former maximum step was 180 HP; the shared 10% buff must not add a new wall.
    assert.ok(health(wave) - health(previous) <= 198, message(wave));
    previous = wave;
  }
  assert.equal(health(WAVE_DEFINITIONS[30]), 1865);
  assert.equal(health(WAVE_DEFINITIONS[46]), 2417);
  assert.ok(health(WAVE_DEFINITIONS[200]) > health(WAVE_DEFINITIONS[199]));
});

test('round finales and the following first waves preserve the opening health cadence', () => {
  const openingGain = health(WAVE_DEFINITIONS[29]) - health(WAVE_DEFINITIONS[19]);
  for (let round = 4; round <= 40; round += 1) {
    const ninth = WAVE_DEFINITIONS[round * 10 - 2];
    const finale = WAVE_DEFINITIONS[round * 10 - 1];
    const previousFinale = WAVE_DEFINITIONS[(round - 1) * 10 - 1];
    assert.ok(Math.abs(health(finale) - health(previousFinale) - openingGain) <= 1,
      `${message(finale)}: round gains keep their cadence with integer HP rounding`);
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

test('a single weak healer starts at wave six and grows gradually without leaking into undead waves', () => {
  let previousHeal = 0;
  for (const wave of WAVE_DEFINITIONS) {
    const healers = wave.spawns.filter(spawn => spawn.type === 'goblinHealer');
    assert.equal(healers.length, wave.number >= 6 && wave.number <= 200 ? 1 : 0, message(wave));
    for (const healer of healers) {
      assert.ok(Number.isInteger(healer.heal) && healer.heal > 0, message(wave));
      assert.ok(healer.heal > healer.damage, message(wave));
      assert.ok(healer.heal >= previousHeal, `${message(wave)}: support strength must not reset`);
      if (wave.number > 6 && wave.number <= 101) assert.ok(healer.heal <= previousHeal + 1,
        `${message(wave)}: introducing healers must not add a sudden support spike`);
      assert.equal(healer.y, 66, message(wave));
      assert.equal(healer.at, 14.8, message(wave));
      assert.equal(healer.reward, 1, message(wave));
      previousHeal = healer.heal;
    }
  }
  const healerAt = number => WAVE_DEFINITIONS[number - 1].spawns.find(spawn => spawn.type === 'goblinHealer');
  assert.equal(WAVE_DEFINITIONS.find(wave => wave.spawns.some(spawn => spawn.type === 'goblinHealer')).number, 6);
  assert.deepEqual([6, 10, 30, 31, 100, 101, 200].map(number => healerAt(number).heal), [4, 5, 10, 10, 35, 35, 48]);
  assert.equal(healerAt(6).hp, 46, 'the first healer inherits the replaced archer\'s modest durability');
  assert.equal(healerAt(6).damage, 3.15, 'healing support has low fallback melee damage');
});

test('the modest stat increase applies through the final wave without changing the old count, schedule or late healing', () => {
  for (const wave of continuation) {
    const baseline = campaignContinuationSpawns(wave.number);
    assert.equal(health(wave), Math.round(campaignCurve(wave.number).health * 1.1), message(wave));
    assert.equal(wave.spawns.length, baseline.length, message(wave));
    for (const [index, spawn] of wave.spawns.entries()) {
      const before = baseline[index];
      assert.deepEqual([spawn.at, spawn.x, spawn.y], [before.at, before.x, before.y], message(wave));
      if (spawn.type === 'goblinHealer' && before.type === 'goblinArcher') {
        assert.ok(wave.number <= 100, message(wave));
        assert.equal(spawn.hp, Math.round(before.hp * 1.1), message(wave));
        assert.ok(spawn.damage < before.damage, `${message(wave)}: support replaces ranged damage, not an extra attacker`);
      } else {
        assert.equal(spawn.type, before.type, message(wave));
        assert.equal(spawn.damage, Math.round(before.damage * 105) / 100, message(wave));
        assert.equal(spawn.heal, before.heal, message(wave));
      }
    }
  }
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
