import assert from 'node:assert/strict';
import test from 'node:test';
import { ENEMY_TYPES, WAVE_DEFINITIONS, getEnemyCombatType, getRoundWaves } from '../waves.ts';
import { claimFirstClear, createProgression } from '../progression.ts';
import { WALKABLE_AREAS } from '../field.ts';
import { openingContinuationSpawns } from '../opening-curve.ts';

const totalHealth = wave => wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
const bossOf = wave => wave.spawns.find(spawn => ENEMY_TYPES[spawn.type].isBoss);
const label = wave => `${wave.levelNumber}-${wave.roundNumber}, wave ${wave.waveInRound}`;

test('the first three tutorial waves retain their composition, timing and rewards with a small stat increase', () => {
  const expected = [
    [[.8, 'goblin', 66, 7.35], [.8, 'goblin', 66, 7.35], [6.8, 'goblin', 66, 7.35]],
    [[.8, 'goblin', 66, 7.35], [.8, 'goblin', 66, 7.35], [.8, 'goblinArcher', 35, 4.2], [.8, 'goblinArcher', 35, 4.2]],
    [[.8, 'goblin', 70, 7.35], [.8, 'goblin', 70, 7.35], [.8, 'goblinArcher', 40, 4.2], [14.8, 'goblin', 70, 7.35], [14.8, 'goblinArcher', 40, 4.2]],
  ];
  for (const [index, wave] of WAVE_DEFINITIONS.slice(0, 3).entries()) {
    assert.deepEqual(wave.spawns.map(spawn => [spawn.at, spawn.type, spawn.hp, spawn.damage]), expected[index]);
    assert.equal(wave.reward, wave.total);
    assert.ok(wave.spawns.every(spawn => spawn.reward === 1));
  }
});

test('the next two rounds retain both archers with only the requested 1-2/9 melee escort removed', () => {
  const ordinary = WAVE_DEFINITIONS.slice(10, 30).filter(wave => !wave.hasBoss);
  assert.equal(ordinary.length, 18);
  for (const wave of ordinary) {
    assert.equal(wave.total, wave.number === 19 ? 7 : 8);
    assert.deepEqual(wave.enemies.map(enemy => [enemy.type, enemy.count]),
      [['goblin', wave.number === 19 ? 3 : 4], ['boar', 2], ['goblinArcher', 2]]);
    assert.equal(wave.spawns.filter(spawn => spawn.at === .8).length, 4);
    assert.equal(wave.spawns.filter(spawn => spawn.at === 14.8).length, wave.number === 19 ? 3 : 4);
  }
  for (const wave of WAVE_DEFINITIONS.slice(10, 30)) {
    const baseline = openingContinuationSpawns(wave.number);
    assert.equal(totalHealth(wave), Math.round(baseline.reduce((sum, spawn) => sum + spawn.hp, 0) * 1.1), label(wave));
    assert.equal(wave.total, baseline.length, label(wave));
    for (const [index, spawn] of wave.spawns.entries()) {
      const before = baseline[index];
      assert.deepEqual([spawn.at, spawn.x, spawn.y], [before.at, before.x, before.y], label(wave));
      assert.equal(spawn.type, before.type, label(wave));
      assert.equal(spawn.damage, Math.round(before.damage * 105) / 100, label(wave));
    }
  }
  for (let index = 1; index < ordinary.length; index += 1) {
    const previous = ordinary[index - 1];
    ordinary[index].spawns.forEach((spawn, slot) => {
      const previousSpawn = previous.spawns.find(before => before.type === spawn.type
        && before.at === spawn.at && before.x === spawn.x && before.y === spawn.y);
      if (!previousSpawn) return; // The removed escort must not shift comparisons onto the archer.
      // The lead fighter absorbs per-body rounding to keep the exact encounter budget.
      const roundingTolerance = slot === 0 ? 2 : 0;
      assert.ok(spawn.hp >= previousSpawn.hp - roundingTolerance,
        `${label(ordinary[index])}: slot ${slot} health grows apart from bounded rounding`);
      assert.ok(spawn.damage >= previousSpawn.damage);
    });
  }
  for (const number of [0, 10, 31, 400, NaN, 11.5]) {
    assert.throws(() => openingContinuationSpawns(number), RangeError);
  }
});

test('the first round restores each replaced archer with its original ranged damage', () => {
  for (const [number, count, damage] of [[6, 1, 5.25], [7, 2, 6.3], [8, 2, 6.3], [9, 2, 7.35], [10, 2, 7.35]]) {
    const archers = WAVE_DEFINITIONS[number - 1].spawns.filter(spawn => spawn.type === 'goblinArcher');
    assert.equal(archers.length, count, `wave ${number}: original archer count`);
    assert.deepEqual(archers.map(spawn => spawn.damage), Array(count).fill(damage),
      `wave ${number}: the removed healer's weak fallback attack does not survive on its restored archer`);
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
      ? (mainBoss ? 'ogre' : wave.roundNumber > 10 ? 'goblinBombardier' : 'goblinChief')
      : (mainBoss ? 'cryptKing' : 'cryptSpider');
    assert.equal(bosses.length, 1, label(wave));
    assert.equal(bosses[0].type, expectedType, label(wave));
    assert.equal(wave.bossType, expectedType, label(wave));
    assert.equal(wave.isFinalBossWave, mainBoss, label(wave));
    assert.equal(wave.bossOnly, false, label(wave));
    if (wave.number === 10) assert.equal(wave.total, 5, label(wave));
    else assert.ok(wave.total >= 6 && wave.total <= 11, label(wave));
    const opening = wave.spawns.filter(spawn => spawn.at === .8);
    assert.equal(opening.length, 4, label(wave));
    const hasHealer = wave.number >= 51 && wave.number <= 200;
    assert.deepEqual(opening.map(spawn => getEnemyCombatType(spawn.type)).sort(),
      ['goblin', 'goblin', wave.levelNumber === 2 ? 'plagueAlchemist' : hasHealer ? 'goblinHealer' : 'goblinArcher', getEnemyCombatType(expectedType)].sort(), label(wave));
    assert.equal(bosses[0].at, .8, `${label(wave)}: the boss remains in the opening squad`);
    const support = wave.spawns.filter(spawn => spawn.at === 14.8);
    if (wave.number <= 30) {
      assert.deepEqual(support.map(spawn => getEnemyCombatType(spawn.type)).sort(),
        wave.number === 10 ? ['goblinArcher'] : ['goblin', 'goblinArcher'], label(wave));
    } else {
      assert.ok(support.length >= 2 && support.length <= 4, label(wave));
      assert.ok(support.every(spawn => !ENEMY_TYPES[spawn.type].isBoss), label(wave));
    }
    assert.ok(wave.spawns.every(spawn => [.8, 14.8, 28.8].includes(spawn.at)
      || (wave.levelNumber === 2 && spawn.type === 'skeletonArcher' && spawn.at === 1.6)), label(wave));
  }
});

test('the first chief retains its two original archers and no removed melee escort or early healer', () => {
  const [, , , , , , , , ninth, tenth] = getRoundWaves(1, 1);
  assert.equal(bossOf(tenth).hp, 495);
  assert.equal(bossOf(tenth).damage, 18.9);
  assert.equal(tenth.total, 5);
  assert.deepEqual(tenth.enemies.map(enemy => [enemy.type, enemy.count]),
    [['goblin', 2], ['goblinChief', 1], ['goblinArcher', 2]]);
  assert.equal(totalHealth(tenth), 825);
  assert.equal(totalHealth(ninth), 869);
  assert.equal(tenth.reward, 24);
  assert.deepEqual(tenth.spawns.filter(spawn => spawn.at === 14.8), [
    { y: 66, hp: 62, damage: 7.35, at: 14.8, type: 'goblinArcher', x: 195, reward: 1 },
  ]);
});

test('opening health grows except for the explicitly reduced first chief encounter', () => {
  let previousHp = 0;
  let previousBoss;
  for (const wave of WAVE_DEFINITIONS.slice(0, 30)) {
    // The requested escort removal remains the sole opening health-budget exception.
    if (wave.number === 10) assert.equal(totalHealth(wave), 825);
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
      assert.ok(Number.isFinite(spawn.damage) && spawn.damage > 0, label(wave));
      assert.ok(Math.abs(spawn.damage * 100 - Math.round(spawn.damage * 100)) < 1e-8,
        `${label(wave)}: damage is precise to hundredths, not rounded up by a full point`);
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

test('150 forest healers and 200 alchemists add their own kill rewards without changing bosses or first clears', () => {
  const progression = createProgression();
  // The 1-2/9 nerf removes one melee goblin and its one-gold kill reward.
  assert.equal(WAVE_DEFINITIONS.reduce((sum, wave) => sum + wave.total, 0), 4847 + 200 - 1);
  assert.equal(WAVE_DEFINITIONS.reduce((sum, wave) => sum + wave.reward, 0), 10489 + 400 - 1);
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
