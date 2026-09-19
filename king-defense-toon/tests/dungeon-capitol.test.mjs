import assert from 'node:assert/strict';
import test from 'node:test';
import { createCampaignState } from '../campaign-state.ts';
import { createCapitol } from '../capitol.ts';
import { GOBLIN_CAVE_LEVELS } from '../dungeons.ts';
import { createDungeonRun, startDungeonBattle, finishDungeonWave, prepareNextDungeonWave } from '../dungeon-run.ts';
import { updateBattle } from '../combat.ts';
import { CAPITOL_TOWER_POSITION } from '../field.ts';
import { getSceneAssetPlan } from '../scene-assets.ts';

function fixture(level, capitol = { health: 3, tower: 3 }) {
  const campaign = createCampaignState(1800000000000);
  campaign.capitol = createCapitol(capitol);
  campaign.units = [{ id: 1, type: 'swordsman', level: 10, col: 2, row: 0 }];
  const run = createDungeonRun(level, { clearedWaves: 200, firstClears: [] }, campaign.units, ['2:0']);
  return { campaign, run };
}

function clearWave(run) {
  Object.assign(run.battle, { phase: 'victory', kills: run.battle.total });
  assert.equal(finishDungeonWave(run), true);
}

const hold = actor => Object.assign(actor, {
  action: 'attack', actionDuration: 9999, actionTime: 0, didImpact: true, cooldown: 9999,
});

for (const level of GOBLIN_CAVE_LEVELS) {
  test(`Cave ${level.numeral} snapshots Capitol HP and tower damage even without an army archer`, () => {
    const { campaign, run } = fixture(level);
    const before = structuredClone(campaign);
    assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge, campaign.capitol), true);
    assert.equal(run.battle.castle.hp, 160);
    assert.equal(run.battle.castle.maxHp, 160);
    assert.equal(run.battle.castle.damage, 14);
    assert.equal(run.battle.castle.range, 144);
    assert.equal(run.battle.castle.stats.towerLevel, 3);
    assert.ok(Object.isFrozen(run.battle.castle.stats));
    const plan = getSceneAssetPlan({ mapVariant: 'goblin-cave', battle: run.battle });
    assert.ok(plan.allies.some(ally => ally.type === 'archer' && ally.rank === 1), 'tower uses the shared archer art');
    assert.deepEqual(campaign, before);
  });

  test(`Cave ${level.numeral} keeps an unbuilt Capitol at 100 HP with no shots`, () => {
    const { campaign, run } = fixture(level, { health: 0, tower: 0 });
    startDungeonBattle(run, campaign.hero, campaign.forge, campaign.capitol);
    const battle = run.battle;
    assert.equal(battle.castle.maxHp, 100);
    assert.equal(battle.castle.damage, 0);
    for (const ally of [...battle.allies, battle.hero]) hold(ally);
    for (let step = 0; step < 60; step++) updateBattle(battle, 1 / 60);
    const target = battle.enemies[0];
    hold(target);
    Object.assign(target, { x: CAPITOL_TOWER_POSITION.x + 50, y: CAPITOL_TOWER_POSITION.y, hp: 10000 });
    const events = [];
    for (let step = 0; step < 60; step++) events.push(...updateBattle(battle, 1 / 60));
    assert.equal(events.some(event => event.type === 'bow-shot' && event.sourceId === 'castle'), false);
  });
}

for (const level of GOBLIN_CAVE_LEVELS.filter(level => level.runBoss)) {
  test(`Cave ${level.numeral} retains injured Capitol and its shots through all three waves`, () => {
    const { campaign, run } = fixture(level);
    startDungeonBattle(run, campaign.hero, campaign.forge, campaign.capitol);
    const battle = run.battle, castle = battle.castle, stats = castle.stats;
    castle.hp = 117;
    // A later purchase cannot alter the snapshot or heal the current expedition.
    Object.assign(campaign.capitol, { health: 10, tower: 8 });
    for (let wave = 0; wave < 3; wave++) {
      if (wave > 0) {
        clearWave(run);
        castle.cooldown = 1.25;
        assert.equal(prepareNextDungeonWave(run), true);
        assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge, campaign.capitol), true);
        assert.equal(castle.cooldown, 1.25, 'next-wave preparation does not reset firing cooldown');
      }
      assert.equal(battle.castle, castle);
      assert.equal(castle.stats, stats);
      assert.equal(castle.hp, 117);
      assert.equal(castle.maxHp, 160);
      assert.equal(castle.damage, 14);
      for (const ally of [...battle.allies, battle.hero]) hold(ally);
      for (let step = 0; step < 60; step++) updateBattle(battle, 1 / 60);
      for (const enemy of battle.enemies) hold(enemy);
      const target = battle.enemies[0];
      Object.assign(target, { x: CAPITOL_TOWER_POSITION.x + 50, y: CAPITOL_TOWER_POSITION.y, hp: 10000, maxHp: 10000 });
      castle.cooldown = 0;
      battle.visualEffectLimit = 0;
      const events = [];
      for (let step = 0; step < 60; step++) events.push(...updateBattle(battle, 1 / 60));
      assert.equal(events.filter(event => event.type === 'bow-shot' && event.sourceId === 'castle').length, 1);
      assert.equal(target.hp, 9986, 'a real tower projectile deals upgraded damage without cosmetic effects');
      assert.equal(castle.hp, 117);
    }
    const next = createDungeonRun(level, { clearedWaves: 200, firstClears: [] }, campaign.units, ['2:0']);
    startDungeonBattle(next, campaign.hero, campaign.forge, campaign.capitol);
    assert.equal(next.battle.castle.hp, 300, 'a new run uses current upgrades and full HP');
    assert.equal(next.battle.castle.damage, 24);
  });
}
