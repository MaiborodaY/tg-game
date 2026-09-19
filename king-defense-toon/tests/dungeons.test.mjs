import assert from 'node:assert/strict';
import test from 'node:test';
import { GOBLIN_CAVE_LEVELS, getDungeonLevel, isDungeonLevelUnlocked } from '../dungeons.ts';
import { createCampaignState, campaignSnapshot, restoreCampaignState } from '../campaign-state.ts';
import { createScreenController } from '../screen-controller.ts';
import { createDungeonRun, getDungeonOpeningWave, getDungeonWaves, getNextDungeonWave, getDungeonExitState,
  startDungeonBattle, selectDungeonCell } from '../dungeon-run.ts';
import { updateBattle } from '../combat.ts';
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

test('Cave I has identical reinforcements then the club chief; later tiers retain their previews', () => {
  const waves = getDungeonWaves(GOBLIN_CAVE_LEVELS[0]);
  assert.deepEqual(waves.map(wave => wave.total), [4, 4, 1]);
  assert.deepEqual(waves[1].spawns, waves[0].spawns, 'wave 2 does not silently increase the requested guard stats');
  assert.deepEqual(waves[2].spawns.map(spawn => spawn.type), ['goblinChief']);
  assert.equal(waves[2].hasBoss, true);
  assert.ok(waves.every(wave => wave.reward === 0 && wave.spawns.every(spawn => spawn.reward === 0)));
  for (const level of GOBLIN_CAVE_LEVELS.slice(1)) assert.equal(getDungeonWaves(level).length, 1);
});

test('one start action advances each wave without healing, resurrecting or rebuilding campaign stats', () => {
  const campaign = createCampaignState(1800000000000);
  campaign.units = [
    { id: 1, type: 'swordsman', level: 4, col: 2, row: 0 },
    { id: 2, type: 'healer', level: 4, col: 2, row: 1 },
  ];
  const before = campaignSnapshot(campaign);
  const run = createDungeonRun(GOBLIN_CAVE_LEVELS[0], { clearedWaves: 50, firstClears: [] }, campaign.units, ['2:0', '2:1']);
  assert.equal(getDungeonExitState(run), 'leave', 'no warning before starting');
  assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), true);
  const battle = run.battle, survivor = battle.allies[0], hero = battle.hero, castle = battle.castle;
  assert.equal(getDungeonExitState(run), 'blocked');
  survivor.hp = 13;
  survivor.approach = { targetId: 'old-enemy', blockedTime: 1, detour: null, x: 0, y: 0 };
  battle.allies[1].hp = 0;
  hero.hp = 0; hero.action = 'dead'; hero.miracleUsed = true;
  castle.hp = 57;
  const originalStats = survivor.damage;
  for (const wave of [2, 3]) {
    battle.phase = 'victory';
    assert.equal(getDungeonExitState(run), 'confirm');
    assert.equal(getNextDungeonWave(run).number, wave);
    assert.equal(startDungeonBattle(run, { ...campaign.hero, level: 20 }, campaign.forge), true);
    assert.equal(run.battle, battle, 'a single combat snapshot is retained');
    assert.equal(battle.waveNumber, wave);
    assert.deepEqual(battle.allies, [survivor], 'fallen healer stays out');
    assert.equal(survivor.hp, 13);
    assert.equal(survivor.damage, originalStats);
    assert.equal(survivor.approach, null, 'old enemy IDs/paths cannot leak to the next wave');
    assert.equal(battle.hero, hero);
    assert.equal(hero.hp, 0, 'dead hero does not respawn for his aura or healing');
    assert.equal(hero.miracleUsed, true);
    assert.equal(battle.castle, castle);
    assert.equal(castle.hp, 57);
    assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), false, 'rapid second tap is rejected');
    for (let i = 0; i < 50; i++) updateBattle(battle, 1 / 60);
    assert.equal(battle.spawned, wave === 2 ? 4 : 1);
    assert.equal(battle.enemies.some(enemy => enemy.type === 'goblinChief'), wave === 3);
  }
  battle.phase = 'victory';
  assert.equal(getNextDungeonWave(run), null);
  assert.equal(getDungeonExitState(run), 'leave', 'completed run has no unfinished progress warning');
  assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), false, 'cannot replay a finished wave in-place');
  assert.deepEqual(campaignSnapshot(campaign), before, 'the campaign army, progress and economy remain unchanged');
});

test('defeat cannot advance a wave or refill the run', () => {
  const campaign = createCampaignState(1800000000000);
  const units = [{ id: 1, type: 'swordsman', level: 1, col: 2, row: 0 }];
  const run = createDungeonRun(GOBLIN_CAVE_LEVELS[0], { clearedWaves: 50, firstClears: [] }, units, ['2:0']);
  startDungeonBattle(run, campaign.hero, campaign.forge);
  run.battle.phase = 'defeat'; run.battle.castle.hp = 0;
  assert.equal(getDungeonExitState(run), 'leave');
  assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), false);
  assert.equal(run.battle.castle.hp, 0);
  const retry = createDungeonRun(GOBLIN_CAVE_LEVELS[0], { clearedWaves: 50, firstClears: [] }, units, ['2:0']);
  assert.equal(retry.battle, null);
  assert.equal(retry.wave.number, 1, 'leaving/re-entering starts an entirely new run');
});

test('waiting between waves does not heal survivors or refresh hero skills', () => {
  const campaign = createCampaignState(1800000000000);
  const units = [{ id: 1, type: 'healer', level: 4, col: 2, row: 0 }];
  const run = createDungeonRun(GOBLIN_CAVE_LEVELS[0], { clearedWaves: 50, firstClears: [] }, units, ['2:0']);
  startDungeonBattle(run, campaign.hero, campaign.forge);
  const battle = run.battle;
  battle.phase = 'victory';
  battle.allies[0].hp = 10;
  battle.hero.hp = 21;
  battle.hero.healCooldown = 6;
  battle.hero.hammerCooldown = 7;
  battle.hero.miracleUsed = true;
  for (let i = 0; i < 600; i++) updateBattle(battle, 1 / 30);
  startDungeonBattle(run, campaign.hero, campaign.forge);
  assert.equal(battle.allies[0].hp, 10);
  assert.equal(battle.hero.hp, 21);
  assert.equal(battle.hero.healCooldown, 6);
  assert.equal(battle.hero.hammerCooldown, 7);
  assert.equal(battle.hero.miracleUsed, true);
});
