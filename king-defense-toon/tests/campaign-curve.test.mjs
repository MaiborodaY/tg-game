import assert from 'node:assert/strict';
import test from 'node:test';
import { campaignCurve, campaignContinuationSpawns } from '../campaign-curve.ts';
import { ENEMY_TYPES, WAVE_DEFINITIONS, getEnemyCombatType } from '../waves.ts';

// Keep checking the pre-existing curve separately from the newly added support.
const originalSpawns = wave => wave.spawns.filter(spawn => spawn.type !== 'plagueAlchemist');
const health = wave => originalSpawns(wave).reduce((total, spawn) => total + spawn.hp, 0);
const message = wave => `${wave.levelNumber}-${wave.roundNumber}, wave ${wave.waveInRound}`;
const continuation = WAVE_DEFINITIONS.slice(30);
const ordinary = WAVE_DEFINITIONS.slice(20).filter(wave => !wave.hasBoss);

test('both worlds retain their health steps with one fifteen-percent increase for the second level', () => {
  let previous = WAVE_DEFINITIONS[29];
  for (const wave of continuation) {
    assert.ok(health(wave) > health(previous), message(wave));
    // Only the biome boundary adds the one-time multiplier. Later steps keep
    // their old cadence, including the original ninth/tenth-wave peaks.
    if (wave.number !== 201) assert.ok(health(wave) - health(previous) <= (wave.levelNumber === 2 ? 228 : 198), message(wave));
    previous = wave;
  }
  assert.equal(health(WAVE_DEFINITIONS[30]), 1865);
  assert.equal(health(WAVE_DEFINITIONS[46]), 2417);
  assert.equal(health(WAVE_DEFINITIONS[199]), 9889);
  assert.equal(health(WAVE_DEFINITIONS[200]), Math.round(9906 * 1.15));
  assert.equal(health(WAVE_DEFINITIONS[399]), Math.round(19349 * 1.15));
});

test('round finales and following first waves preserve their cadence within each biome', () => {
  const openingGain = health(WAVE_DEFINITIONS[29]) - health(WAVE_DEFINITIONS[19]);
  for (let round = 4; round <= 40; round += 1) {
    const ninth = WAVE_DEFINITIONS[round * 10 - 2];
    const finale = WAVE_DEFINITIONS[round * 10 - 1];
    const previousFinale = WAVE_DEFINITIONS[(round - 1) * 10 - 1];
    if (round !== 21) assert.ok(Math.abs(health(finale) - health(previousFinale) - openingGain * (finale.levelNumber === 2 ? 1.15 : 1)) <= 1,
      `${message(finale)}: round gains keep their cadence with integer HP rounding`);
    assert.ok(health(finale) > health(ninth), message(finale));
    if (round === 40) continue;
    const next = WAVE_DEFINITIONS[round * 10];
    assert.ok(health(next) > health(finale), message(next));
    if (round === 20) assert.ok(health(next) >= health(finale) * 1.15, message(next));
    else assert.ok(health(next) < health(finale) * 1.02, message(next));
  }
});

test('enemy counts grow gradually within the mobile encounter limits', () => {
  let previous = ordinary[0];
  for (const wave of ordinary) {
    assert.ok(wave.total >= 8 && wave.total <= 17, message(wave));
    // Round six unlocks its regular extra fighter and the first additional healer together.
    const maximumAdded = wave.number === 51 ? 2 : 1;
    assert.ok(wave.total >= previous.total && wave.total <= previous.total + maximumAdded, message(wave));
    previous = wave;
  }
  for (const wave of continuation.filter(wave => wave.hasBoss)) {
    assert.ok(wave.total >= 6 && wave.total <= 11, message(wave));
  }
  assert.equal(ordinary.at(-1).total, 17);
  assert.equal(WAVE_DEFINITIONS.at(-1).total, 11);
});

test('ordinary attacker counts only change by one body at a time and healers never replace archers', () => {
  const counts = wave => {
    const result = { goblin: 0, goblinArcher: 0, boar: 0 };
    for (const spawn of wave.spawns) {
      if (spawn.type === 'goblinHealer' || spawn.type === 'plagueAlchemist') continue;
      const role = getEnemyCombatType(spawn.type);
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

test('one additional healer starts with the first forest squad at wave 51 and never enters undead waves', () => {
  let previousHeal = 0;
  for (const wave of WAVE_DEFINITIONS) {
    const healers = wave.spawns.filter(spawn => spawn.type === 'goblinHealer');
    assert.equal(healers.length, wave.number >= 51 && wave.number <= 200 ? 1 : 0, message(wave));
    for (const healer of healers) {
      assert.ok(Number.isInteger(healer.heal) && healer.heal > 0, message(wave));
      assert.ok(healer.heal > healer.damage, message(wave));
      assert.ok(healer.heal >= previousHeal, `${message(wave)}: support strength must not reset`);
      if (wave.number > 51 && wave.number <= 101) assert.ok(healer.heal <= previousHeal + 1,
        `${message(wave)}: introducing healers must not add a sudden support spike`);
      assert.equal(healer.y, 66, message(wave));
      assert.equal(healer.at, .8, message(wave));
      assert.equal(healer.reward, 1, message(wave));
      assert.deepEqual(wave.spawns.filter(spawn => spawn.at === .8).map(spawn => spawn.type),
        ['goblin', wave.bossType ?? 'boar', 'goblin', 'goblinHealer'],
        `${message(wave)}: the healer arrives beside the first fighters and boss`);
      previousHeal = healer.heal;
    }
  }
  const healerAt = number => WAVE_DEFINITIONS[number - 1].spawns.find(spawn => spawn.type === 'goblinHealer');
  assert.equal(WAVE_DEFINITIONS.find(wave => wave.spawns.some(spawn => spawn.type === 'goblinHealer')).number, 51);
  assert.deepEqual([51, 60, 99, 100, 101, 200].map(number => healerAt(number).heal), [17, 21, 34, 35, 35, 48]);
  for (const [number, total, archers, hasHealer] of [
    [50, 6, 2, false], [51, 10, 2, true], [100, 8, 2, true],
    [101, 11, 3, true], [200, 9, 3, true], [201, 14, 3, false],
  ]) {
    const wave = WAVE_DEFINITIONS[number - 1];
    assert.equal(wave.total, total, `${number}: additive healer preserves the existing attacker count`);
    assert.equal(wave.spawns.filter(spawn => getEnemyCombatType(spawn.type) === 'goblinArcher').length,
      archers, `${number}: all archers remain in the encounter`);
    assert.equal(campaignCurve(number).hasHealer, hasHealer, `${number}: forest support boundary`);
  }
});

test('existing fighter stats remain intact when the second level gains its alchemist', () => {
  for (const wave of continuation) {
    const baseline = campaignContinuationSpawns(wave.number);
    const heroHealth = Math.round(campaignCurve(wave.number).health * 1.1);
    assert.equal(health(wave), wave.levelNumber === 2 ? Math.round(heroHealth * 1.15) : heroHealth, message(wave));
    assert.equal(originalSpawns(wave).length, baseline.length, message(wave));
    for (const [index, spawn] of originalSpawns(wave).entries()) {
      const before = baseline[index];
      const at = wave.levelNumber === 2 && before.at === .8 && before.type === 'skeletonArcher' ? 1.6 : before.at;
      assert.deepEqual([spawn.at, spawn.x, spawn.y], [at, before.x, before.y], message(wave));
      assert.equal(spawn.type, before.type, message(wave));
      const heroDamage = Math.round(before.damage * 105) / 100;
      assert.equal(spawn.damage, wave.levelNumber === 2 ? Math.round(heroDamage * 115) / 100 : heroDamage, message(wave));
      assert.equal(spawn.heal, before.heal, message(wave));
      assert.equal(spawn.reward, ENEMY_TYPES[spawn.type].reward, message(wave));
    }
    if (wave.hasBoss) {
      const heroBossHealth = Math.round(Math.round(campaignCurve(wave.number).health * (wave.isFinalBossWave ? .65 : .55)) * 1.1);
      assert.equal(wave.spawns.find(spawn => ENEMY_TYPES[spawn.type].isBoss).hp,
        wave.levelNumber === 2 ? Math.round(heroBossHealth * 1.15) : heroBossHealth,
        `${message(wave)}: the boss keeps its original share before the shared stat increases`);
    }
  }
});

test('biomes keep their own roster and main bosses remain at the four campaign milestones', () => {
  const forest = new Set(['goblin', 'goblinArcher', 'goblinHealer', 'boar', 'goblinChief', 'ogre', 'goblinBombardier']);
  const undead = new Set(['skeleton', 'skeletonArcher', 'ghoul', 'cryptSpider', 'cryptKing', 'plagueAlchemist']);
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
