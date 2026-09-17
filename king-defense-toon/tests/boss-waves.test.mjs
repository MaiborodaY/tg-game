import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { ENEMY_TYPES, WAVE_DEFINITIONS, getEnemyCombatType, getRoundWaves } from '../waves.mjs';
import { claimFirstClear, createProgression } from '../progression.mjs';
import { WALKABLE_AREAS } from '../field.mjs';
import { openingContinuationSpawns } from '../opening-curve.mjs';

const totalHealth = wave => wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
const bossOf = wave => wave.spawns.find(spawn => ENEMY_TYPES[spawn.type].isBoss);
const label = wave => `${wave.levelNumber}-${wave.roundNumber}, wave ${wave.waveInRound}`;

test('the first three tutorial waves retain their composition, stats, timing and rewards', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(WAVE_DEFINITIONS.slice(0, 3))).digest('hex'),
    '28e3aaae9436bb385d84ebfe7728e41732f18536b8637a23da20148280397403');
});

test('extending the campaign preserves the calibrated first thirty waves', () => {
  // Captured from the released opening before extending rounds 4–40.
  assert.equal(createHash('sha256').update(JSON.stringify(WAVE_DEFINITIONS.slice(0, 30))).digest('hex'),
    '3658798c3adb80372f2d54727ce9cc95288df7626bc638c9ea07236b12867156');
  const ordinary = WAVE_DEFINITIONS.slice(10, 30).filter(wave => !wave.hasBoss);
  assert.equal(ordinary.length, 18);
  for (const wave of ordinary) {
    assert.equal(wave.total, 8);
    assert.deepEqual(wave.enemies.map(enemy => [enemy.type, enemy.count]),
      [['goblin', 4], ['boar', 2], ['goblinArcher', 2]]);
    assert.equal(wave.spawns.filter(spawn => spawn.at === .8).length, 4);
    assert.equal(wave.spawns.filter(spawn => spawn.at === 14.8).length, 4);
  }
  for (let index = 1; index < ordinary.length; index += 1) {
    const previous = ordinary[index - 1];
    ordinary[index].spawns.forEach((spawn, slot) => {
      assert.ok(spawn.hp >= previous.spawns[slot].hp);
      assert.ok(spawn.damage >= previous.spawns[slot].damage);
    });
  }
  for (const number of [0, 10, 31, 400, NaN, 11.5]) {
    assert.throws(() => openingContinuationSpawns(number), RangeError);
  }
});

test('every round ends with one supported boss, with main bosses only in rounds 10 and 20', () => {
  assert.equal(WAVE_DEFINITIONS.length, 400);
  assert.equal(WAVE_DEFINITIONS.filter(wave => wave.hasBoss).length, 40);
  for (const wave of WAVE_DEFINITIONS) {
    const bosses = wave.spawns.filter(spawn => ENEMY_TYPES[spawn.type].isBoss);
    if (wave.waveInRound !== 10) {
      assert.equal(bosses.length, 0, label(wave));
      continue;
    }
    const mainBoss = wave.roundNumber === 10 || wave.roundNumber === 20;
    const expectedType = wave.levelNumber === 1
      ? (mainBoss ? 'ogre' : 'goblinChief')
      : (mainBoss ? 'cryptKing' : 'cryptSpider');
    assert.equal(bosses.length, 1, label(wave));
    assert.equal(bosses[0].type, expectedType, label(wave));
    assert.equal(wave.bossType, expectedType, label(wave));
    assert.equal(wave.isFinalBossWave, mainBoss, label(wave));
    assert.equal(wave.bossOnly, false, label(wave));
    if (wave.number === 10) assert.equal(wave.total, 5, label(wave));
    else assert.ok(wave.total >= 6 && wave.total <= 10, label(wave));
    const opening = wave.spawns.filter(spawn => spawn.at === .8);
    assert.equal(opening.length, 4, label(wave));
    assert.deepEqual(opening.map(spawn => getEnemyCombatType(spawn.type)).sort(),
      ['goblin', 'goblin', 'goblinArcher', mainBoss ? 'ogre' : 'goblinChief'].sort(), label(wave));
    const support = wave.spawns.filter(spawn => spawn.at === 14.8);
    if (wave.number <= 30) {
      assert.deepEqual(support.map(spawn => getEnemyCombatType(spawn.type)).sort(),
        wave.number === 10 ? ['goblinArcher'] : ['goblin', 'goblinArcher'], label(wave));
    } else {
      assert.ok(support.length >= 2 && support.length <= 4, label(wave));
      assert.ok(support.every(spawn => !ENEMY_TYPES[spawn.type].isBoss), label(wave));
    }
    assert.ok(wave.spawns.every(spawn => [.8, 14.8, 28.8].includes(spawn.at)), label(wave));
  }
});

test('first chief loses only the late melee escort without a compensating stat increase', () => {
  const [, , , , , , , , ninth, tenth] = getRoundWaves(1, 1);
  assert.equal(bossOf(tenth).hp, 450);
  assert.equal(bossOf(tenth).damage, 18);
  assert.equal(tenth.total, 5);
  assert.deepEqual(tenth.enemies.map(enemy => [enemy.type, enemy.count]),
    [['goblin', 2], ['goblinChief', 1], ['goblinArcher', 2]]);
  assert.equal(totalHealth(tenth), 750);
  assert.equal(totalHealth(ninth), 790);
  assert.equal(tenth.reward, 24);
  assert.deepEqual(tenth.spawns.filter(spawn => spawn.at === 14.8), [
    { y: 66, hp: 56, damage: 7, at: 14.8, type: 'goblinArcher', x: 195, reward: 1 },
  ]);
});

test('opening health grows except for the explicitly reduced first chief encounter', () => {
  let previousHp = 0;
  let previousBoss;
  for (const wave of WAVE_DEFINITIONS.slice(0, 30)) {
    // Removing the requested 94-HP escort makes wave 10 the sole numeric exception.
    if (wave.number === 10) assert.equal(totalHealth(wave), 750);
    else assert.ok(totalHealth(wave) > previousHp, label(wave));
    previousHp = totalHealth(wave);
    if (!wave.hasBoss) continue;
    const boss = bossOf(wave);
    if (previousBoss) {
      assert.ok(boss.hp > previousBoss.hp);
      assert.ok(boss.damage >= previousBoss.damage);
    }
    previousBoss = boss;
  }
});

test('all 400 waves retain at most four enemies per arrival and valid distinct spawn positions', () => {
  for (const wave of WAVE_DEFINITIONS) {
    assert.equal(wave.total, wave.spawns.length, label(wave));
    const arrivals = new Map();
    for (const spawn of wave.spawns) {
      assert.ok(Number.isFinite(spawn.at) && spawn.at >= 0, label(wave));
      assert.ok(Number.isInteger(spawn.hp) && spawn.hp > 0, label(wave));
      assert.ok(Number.isInteger(spawn.damage) && spawn.damage > 0, label(wave));
      assert.ok(WALKABLE_AREAS.some(area => spawn.x >= area.left && spawn.x <= area.right
        && spawn.y >= area.top && spawn.y <= area.bottom), label(wave));
      const group = arrivals.get(spawn.at) ?? [];
      group.push(spawn);
      arrivals.set(spawn.at, group);
    }
    for (const group of arrivals.values()) {
      assert.ok(group.length <= 4, label(wave));
      assert.equal(new Set(group.map(spawn => `${spawn.x}:${spawn.y}`)).size, group.length, label(wave));
    }
    assert.deepEqual(wave.spawns.map(spawn => spawn.at),
      [...wave.spawns].sort((a, b) => a.at - b.at).map(spawn => spawn.at), label(wave));
  }
});

test('stronger bosses do not inflate per-kill or repeat-clear gold', () => {
  const progression = createProgression();
  for (const wave of WAVE_DEFINITIONS) {
    const goldMultiplier = wave.levelNumber === 2 ? 2 : 1;
    for (const spawn of wave.spawns) {
      const expectedReward = ENEMY_TYPES[spawn.type].isBoss ? 20
        : getEnemyCombatType(spawn.type) === 'boar' ? 2 : 1;
      assert.equal(spawn.reward, expectedReward * goldMultiplier, label(wave));
    }
    assert.equal(wave.reward, wave.spawns.reduce((sum, spawn) => sum + spawn.reward, 0), label(wave));
    assert.equal(claimFirstClear(progression, wave.number), wave.waveInRound * 10, label(wave));
    assert.equal(claimFirstClear(progression, wave.number), 0, label(wave));
  }
  assert.equal(progression.firstClears.length, 400);
});
