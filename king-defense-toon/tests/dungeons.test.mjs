import assert from 'node:assert/strict';
import test from 'node:test';
import { GOBLIN_CAVE_LEVELS, getDungeonLevel, isDungeonLevelUnlocked } from '../dungeons.ts';
import { createCampaignState, campaignSnapshot, restoreCampaignState } from '../campaign-state.ts';
import { createScreenController } from '../screen-controller.ts';
import { createDungeonRun, getDungeonOpeningWave, startDungeonBattle, selectDungeonCell } from '../dungeon-run.ts';
import { getSceneAssetPlan } from '../scene-assets.ts';

for (const [index, milestone] of [50, 100, 150].entries()) {
  test(`Goblin Cave ${index + 1} opens only after the whole round (${milestone} waves)`, () => {
    const level = GOBLIN_CAVE_LEVELS[index];
    assert.equal(isDungeonLevelUnlocked(level, { clearedWaves: milestone - 1, firstClears: [milestone - 1] }), false);
    assert.equal(isDungeonLevelUnlocked(level, { clearedWaves: milestone, firstClears: [] }), true, 'legacy progress without receipts');
    assert.equal(isDungeonLevelUnlocked(level, { clearedWaves: 0, firstClears: [milestone] }), true, 'replay retains historical unlock');
    assert.equal(isDungeonLevelUnlocked(level, { clearedWaves: milestone - 2, firstClears: [milestone + 5] }), true, 'retreat does not relock');
  });
}

test('the catalogue is read-only and uses durable progress after restoring a save', () => {
  const campaign = createCampaignState(1800000000000);
  campaign.progression.firstClears = [50, 100];
  const before = campaignSnapshot(campaign);
  const restored = restoreCampaignState(before, 1800000000000);
  const progress = Object.freeze({ clearedWaves: restored.clearedWaves, firstClears: Object.freeze(restored.progression.firstClears) });
  assert.deepEqual(GOBLIN_CAVE_LEVELS.map(level => isDungeonLevelUnlocked(level, progress)), [true, true, false]);
  assert.deepEqual(campaignSnapshot(campaign), before, 'viewing does not consume gold, army or slaves');
  assert.deepEqual(GOBLIN_CAVE_LEVELS.map(level => level.firstClearReward), [
    { gold: 150, slaves: 3 }, { gold: 300, slaves: 5 }, { gold: 500, slaves: 8 },
  ]);
  assert.equal(getDungeonLevel('unknown'), undefined);
  assert.equal(getDungeonLevel('goblin-cave-2')?.boss, 'Bombardier');
});

test('screen changes cover the campaign without losing existing inert states', () => {
  const app = { dataset: {} }, dungeons = { hidden: true };
  const battlefield = { inert: false }, dock = { inert: true }, transitions = [];
  const screens = createScreenController({ app, dungeons, background: [battlefield, dock], onChange: screen => transitions.push(screen) });
  screens.show('dungeons'); screens.show('dungeons');
  assert.equal(dungeons.hidden, false);
  assert.equal(battlefield.inert, true);
  assert.equal(dock.inert, true);
  assert.equal(screens.active, 'dungeons');
  screens.show('campaign'); screens.show('campaign');
  assert.equal(dungeons.hidden, true);
  assert.equal(battlefield.inert, false);
  assert.equal(dock.inert, true, 'unrelated modal ownership is retained');
  assert.deepEqual(transitions, ['dungeons', 'campaign']);
});

test('dungeon entry validates gates and isolates formation, battle snapshots and reward state', () => {
  const campaign = createCampaignState(1800000000000);
  campaign.units = [{ id: 1, type: 'swordsman', level: 4, col: 2, row: 0 }];
  const before = campaignSnapshot(campaign);
  const closed = { clearedWaves: 49, firstClears: [] };
  assert.equal(createDungeonRun(GOBLIN_CAVE_LEVELS[0], closed, campaign.units, ['2:0']), null);
  const run = createDungeonRun(GOBLIN_CAVE_LEVELS[0], { ...closed, clearedWaves: 50 }, campaign.units, ['2:0', '2:1']);
  assert.ok(run);
  assert.equal(selectDungeonCell(run, 2, 0), true);
  assert.equal(selectDungeonCell(run, 0, 0), false, 'cannot buy or move into closed cells');
  assert.equal(selectDungeonCell(run, 2, 1), true);
  assert.equal(run.units[0].row, 1);
  assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), true);
  const battle = run.battle;
  assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), false, 'double tap cannot restart combat');
  assert.equal(run.battle, battle);
  assert.equal(selectDungeonCell(run, 2, 0), false, 'formation is fixed during the run');
  battle.allies[0].hp = 0;
  battle.hero.hp = 0;
  assert.deepEqual(campaignSnapshot(campaign), before);
  assert.equal(battle.wave.reward, 0, 'opening wave is not a full-clear prize');
  assert.ok(!('campaignRewards' in battle), 'cannot accidentally settle a campaign receipt');
});

test('each opening encounter preloads exactly one of each requested enemy and a separate cave map', () => {
  for (const level of GOBLIN_CAVE_LEVELS) {
    const wave = getDungeonOpeningWave(level);
    assert.equal(wave.total, 4);
    assert.deepEqual(wave.spawns.map(spawn => spawn.type).sort(), ['boar', 'goblin', 'goblinArcher', 'goblinHealer']);
    assert.ok(wave.spawns.every(spawn => spawn.at === wave.spawns[0].at && spawn.reward === 0));
    assert.ok(wave.spawns.find(spawn => spawn.type === 'goblinHealer').heal > 0);
    const plan = getSceneAssetPlan({ mapVariant: 'goblin-cave', wave });
    assert.equal(plan.mapKey, 'map:goblin-cave');
    assert.equal(plan.enemies.length, 4);
    assert.equal(getSceneAssetPlan({ mapVariant: 'goblin-cave' }, { formationOnly: true }).mapKey, plan.mapKey);
    assert.notEqual(getSceneAssetPlan().mapKey, plan.mapKey, 'campaign cache is not replaced by cave art');
  }
});

test('switching catalogue to cave and back restores input ownership', () => {
  const app = { dataset: {} }, dungeons = { hidden: true }, battlefield = { inert: false };
  const screens = createScreenController({ app, dungeons, background: [battlefield], onChange() {} });
  screens.show('dungeons'); screens.show('dungeon-battle');
  assert.equal(app.dataset.screen, 'dungeon-battle');
  assert.equal(dungeons.hidden, true);
  assert.equal(battlefield.inert, false);
  screens.show('dungeons');
  assert.equal(battlefield.inert, true);
  screens.show('campaign');
  assert.equal(battlefield.inert, false);
});
