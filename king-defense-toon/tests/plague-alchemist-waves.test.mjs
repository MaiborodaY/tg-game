import assert from 'node:assert/strict';
import test from 'node:test';
import { WAVE_DEFINITIONS } from '../waves.ts';
import { campaignContinuationSpawns } from '../campaign-curve.ts';

test('one alchemist accompanies the opening squad of every second-level wave, including all bosses', () => {
  for (const wave of WAVE_DEFINITIONS) {
    const alchemists = wave.spawns.filter(spawn => spawn.type === 'plagueAlchemist');
    assert.equal(alchemists.length, wave.levelNumber === 2 ? 1 : 0, `wave ${wave.number}`);
    if (wave.levelNumber !== 2) continue;
    const [alchemist] = alchemists;
    assert.equal(alchemist.at, .8);
    assert.equal(alchemist.y, 66);
    assert.equal(alchemist.reward, 2);
    assert.equal(alchemist.heal, undefined);
    assert.ok(wave.spawns.every(spawn => spawn.type !== 'goblinHealer'));
    if (wave.hasBoss) assert.equal(wave.spawns.find(spawn => spawn.type === wave.bossType).at, alchemist.at);
    const arrivals = new Map();
    for (const spawn of wave.spawns) arrivals.set(spawn.at, (arrivals.get(spawn.at) ?? 0) + 1);
    assert.ok([...arrivals.values()].every(count => count <= 4), `wave ${wave.number}: max four per arrival`);
    const original = campaignContinuationSpawns(wave.number);
    assert.equal(wave.total, original.length + 1);
    assert.equal(wave.spawns.filter(spawn => spawn.type === 'skeletonArcher').length,
      original.filter(spawn => spawn.type === 'skeletonArcher').length, 'retain every archer');
    assert.equal(wave.spawns.find(spawn => spawn.type === 'skeletonArcher').at, 1.6);
  }
});

test('added poison support scales smoothly without lowering boss or round-boundary health', () => {
  let previousHp = 0, previousAlchemyHp = 0, previousDamage = 0;
  for (const wave of WAVE_DEFINITIONS.slice(200)) {
    const alchemist = wave.spawns.find(spawn => spawn.type === 'plagueAlchemist');
    const archer = wave.spawns.find(spawn => spawn.type === 'skeletonArcher');
    const hp = wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
    assert.ok(hp > previousHp, `wave ${wave.number}: total health grows`);
    assert.equal(alchemist.hp, Math.round((hp - alchemist.hp) * .06));
    assert.equal(alchemist.damage, archer.damage, 'damage is the full poison budget, not extra direct damage');
    assert.ok(alchemist.hp >= previousAlchemyHp);
    assert.ok(alchemist.damage >= previousDamage);
    previousHp = hp; previousAlchemyHp = alchemist.hp; previousDamage = alchemist.damage;
  }
});
