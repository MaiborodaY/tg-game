import assert from 'node:assert/strict';
import test from 'node:test';
import { GOBLIN_CAVE_LEVELS, getDungeonLevel, isDungeonLevelUnlocked } from '../dungeons.ts';
import { createCampaignState, campaignSnapshot, restoreCampaignState } from '../campaign-state.ts';
import { createScreenController } from '../screen-controller.ts';
import { createDungeonRun, getDungeonOpeningWave, getDungeonWaves, getNextDungeonWave, getDungeonExitState,
  startDungeonBattle, selectDungeonCell, prepareNextDungeonWave, finishDungeonWave } from '../dungeon-run.ts';
import { createBattleForWave, updateBattle } from '../combat.ts';
import { getSceneAssetPlan } from '../scene-assets.ts';
import { applyDungeonRunReward } from '../campaign-rewards.ts';
import { ENEMY_TYPES, getWaveDefinition } from '../waves.ts';

function clearWave(run) {
  run.battle.phase = 'victory'; run.battle.kills = run.battle.total;
  assert.equal(finishDungeonWave(run), true);
  assert.equal(finishDungeonWave(run), false, 'same result cannot advance twice');
}

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
  assert.deepEqual(GOBLIN_CAVE_LEVELS.map(level => level.completionReward), [
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

for (const level of GOBLIN_CAVE_LEVELS.slice(0, 2)) {
test(`Cave ${level.numeral} has two guard groups, then three, then its own solo boss`, () => {
  const waves = getDungeonWaves(level);
  assert.deepEqual(waves.map(wave => wave.total), [8, 12, 1]);
  assert.deepEqual(waves[1].spawns.slice(0, 8), waves[0].spawns, 'reinforcements use the same stats');
  assert.deepEqual(waves[0].spawns.map(spawn => spawn.at), [0.8, 0.8, 0.8, 0.8, 12.8, 12.8, 12.8, 12.8]);
  assert.deepEqual(waves[1].spawns.slice(8).map(spawn => spawn.at), [24.8, 24.8, 24.8, 24.8]);
  assert.deepEqual(waves[2].spawns.map(spawn => spawn.type), [level.runBoss]);
  assert.equal(waves[2].bossType, level.runBoss);
  assert.equal(waves[2].name, level.boss);
  assert.equal(waves[2].hasBoss, true);
  assert.ok(waves.every(wave => wave.reward === 0 && wave.spawns.every(spawn => spawn.reward === 0)));
  assert.equal(getDungeonWaves(GOBLIN_CAVE_LEVELS[2]).length, 1, 'Cave III stays a preview');
});

test(`Cave ${level.numeral} preparation returns survivors home without healing or resurrecting`, () => {
  const campaign = createCampaignState(1800000000000);
  campaign.units = [
    { id: 1, type: 'swordsman', level: 4, col: 2, row: 0 },
    { id: 2, type: 'healer', level: 4, col: 2, row: 1 },
  ];
  const before = campaignSnapshot(campaign);
  const run = createDungeonRun(level, { clearedWaves: level.unlockRound * 10, firstClears: [] }, campaign.units, ['2:0', '2:1']);
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
    clearWave(run);
    assert.equal(getDungeonExitState(run), 'confirm');
    assert.equal(getNextDungeonWave(run).number, wave);
    assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), false, 'a result cannot jump straight into combat');
    survivor.x += 35; survivor.y -= 80;
    assert.equal(prepareNextDungeonWave(run), true);
    assert.equal(prepareNextDungeonWave(run), false, 'double prepare cannot skip a wave');
    assert.equal(run.stage, 'preparation');
    assert.equal(getDungeonExitState(run), 'confirm', 'leaving during preparation still loses this run');
    assert.equal(survivor.x, survivor.homeX);
    assert.equal(survivor.y, survivor.homeY);
    for (let i = 0; i < 120; i++) updateBattle(battle, 1 / 30);
    assert.equal(battle.elapsed, 0);
    assert.equal(battle.spawned, 0);
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
    assert.equal(battle.enemies.some(enemy => enemy.type === level.runBoss), wave === 3);
  }
  clearWave(run);
  assert.equal(getNextDungeonWave(run), null);
  assert.equal(getDungeonExitState(run), 'leave', 'completed run has no unfinished progress warning');
  assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), false, 'cannot replay a finished wave in-place');
  assert.deepEqual(campaignSnapshot(campaign), before, 'the campaign army, progress and economy remain unchanged');
});

test(`Cave ${level.numeral} defeat cannot advance a wave or refill the run`, () => {
  const campaign = createCampaignState(1800000000000);
  const units = [{ id: 1, type: 'swordsman', level: 1, col: 2, row: 0 }];
  const run = createDungeonRun(level, { clearedWaves: level.unlockRound * 10, firstClears: [] }, units, ['2:0']);
  startDungeonBattle(run, campaign.hero, campaign.forge);
  run.battle.phase = 'defeat'; run.battle.castle.hp = 0;
  finishDungeonWave(run);
  assert.equal(getDungeonExitState(run), 'leave');
  assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), false);
  assert.equal(run.battle.castle.hp, 0);
  const retry = createDungeonRun(level, { clearedWaves: level.unlockRound * 10, firstClears: [] }, units, ['2:0']);
  assert.equal(retry.battle, null);
  assert.equal(retry.wave.number, 1, 'leaving/re-entering starts an entirely new run');
});

test(`Cave ${level.numeral} waiting between waves does not heal or refresh hero skills`, () => {
  const campaign = createCampaignState(1800000000000);
  const units = [{ id: 1, type: 'healer', level: 4, col: 2, row: 0 }];
  const run = createDungeonRun(level, { clearedWaves: level.unlockRound * 10, firstClears: [] }, units, ['2:0']);
  startDungeonBattle(run, campaign.hero, campaign.forge);
  const battle = run.battle;
  clearWave(run);
  battle.allies[0].hp = 10;
  battle.hero.hp = 21;
  battle.hero.healCooldown = 6;
  battle.hero.hammerCooldown = 7;
  battle.hero.miracleUsed = true;
  for (let i = 0; i < 600; i++) updateBattle(battle, 1 / 30);
  prepareNextDungeonWave(run);
  for (let i = 0; i < 600; i++) updateBattle(battle, 1 / 30);
  startDungeonBattle(run, campaign.hero, campaign.forge);
  assert.equal(battle.allies[0].hp, 10);
  assert.equal(battle.hero.hp, 21);
  assert.equal(battle.hero.healCooldown, 6);
  assert.equal(battle.hero.hammerCooldown, 7);
  assert.equal(battle.hero.miracleUsed, true);
});

test(`Cave ${level.numeral} buffs only its copies: guards +15% and boss +30%`, () => {
  const milestone = level.unlockRound * 10;
  const reference = structuredClone(getWaveDefinition(milestone + 1));
  const chief = structuredClone(getWaveDefinition(milestone));
  const waves = getDungeonWaves(level);
  for (const spawn of waves[0].spawns.slice(0, 4)) {
    const original = reference.spawns.find(enemy => enemy.type === spawn.type);
    if (!original) continue; // Boar uses the same existing melee-based fallback.
    assert.equal(spawn.hp, Math.round(original.hp * 1.15));
    assert.equal(spawn.damage, original.damage * 1.15);
    if (original.heal) assert.equal(spawn.heal, original.heal * 1.15);
  }
  const boss = chief.spawns.find(enemy => ENEMY_TYPES[enemy.type].isBoss);
  assert.equal(waves[2].spawns[0].hp, Math.round(boss.hp * 1.3));
  assert.equal(waves[2].spawns[0].damage, boss.damage * 1.3);
  assert.deepEqual(getWaveDefinition(milestone + 1), reference);
  assert.deepEqual(getWaveDefinition(milestone), chief);
});
}

test('reinforcements actually spawn on the fixed clock and clearing a group does not end the wave', () => {
  const campaign = createCampaignState(1800000000000);
  const units = [{ id: 1, type: 'swordsman', level: 10000, col: 2, row: 0 }];
  for (const fps of [30, 60, 120]) for (const speed of [1, 2, 3]) {
    for (const wave of getDungeonWaves(GOBLIN_CAVE_LEVELS[0]).slice(0, 2)) {
      const battle = createBattleForWave(units, wave, campaign.hero, campaign.forge);
      for (let frame = 0; frame < Math.ceil(11 * fps / speed); frame++) updateBattle(battle, speed / fps);
      assert.equal(battle.spawned, 4);
      assert.equal(battle.phase, 'running', 'future reinforcements keep the wave open');
      while (battle.elapsed < 13 && battle.phase === 'running') updateBattle(battle, speed / fps);
      assert.equal(battle.spawned, 8);
      if (wave.number === 2) {
        assert.equal(battle.phase, 'running');
        while (battle.elapsed < 25 && battle.phase === 'running') updateBattle(battle, speed / fps);
        assert.equal(battle.spawned, 12);
      }
    }
  }
});

function completeRun(campaign, level = GOBLIN_CAVE_LEVELS[0]) {
  const run = createDungeonRun(level, { clearedWaves: 200, firstClears: [] },
    [{ id: 1, type: 'swordsman', level: 10, col: 2, row: 0 }], ['2:0']);
  for (const wave of run.waves) {
    if (wave.number > 1) assert.equal(prepareNextDungeonWave(run), true);
    assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), true);
    clearWave(run);
  }
  return run;
}

test('Cave II preloads the existing Bombardier body and effects and its bomb actually hits', () => {
  const campaign = createCampaignState(1800000000000);
  const waves = getDungeonWaves(GOBLIN_CAVE_LEVELS[1]);
  const openingPlan = getSceneAssetPlan({ mapVariant: 'goblin-cave', wave: waves[0] });
  const plan = getSceneAssetPlan({ mapVariant: 'goblin-cave', wave: waves[2] });
  assert.equal(openingPlan.cannonBomb, null, 'guards do not require bomb effects');
  assert.equal(plan.mapKey, openingPlan.mapKey);
  assert.deepEqual(plan.enemies.map(enemy => enemy.type), ['goblinBombardier']);
  assert.ok(plan.cannonBomb && plan.cannonExplosion);
  const battle = createBattleForWave([{ id: 1, type: 'healer', level: 1000, col: 2, row: 0 }],
    waves[2], campaign.hero, campaign.forge);
  let bomb;
  for (let tick = 0; tick < 60 * 120 && !bomb && battle.phase === 'running'; tick++) {
    updateBattle(battle, 1 / 60);
    bomb = battle.projectiles.find(projectile => projectile.sourceType === 'goblinBombardier');
  }
  assert.ok(bomb, 'the actual dungeon boss releases a bomb through shared combat');
  const damage = [];
  for (let tick = 0; tick < 60 * 5 && battle.projectiles.some(projectile => projectile.id === bomb.id); tick++) {
    damage.push(...updateBattle(battle, 1 / 60).filter(event => event.type === 'damage' && event.targetId === bomb.targetId));
  }
  assert.ok(damage.some(event => event.amount > 0));
  assert.ok(battle.effects.some(effect => effect.type === 'cannon-impact'));
});

test('Cave II completes all three waves through real combat and pays only after Bombardier dies', () => {
  const campaign = createCampaignState(1800000000000);
  campaign.units = [
    { id: 1, type: 'swordsman', level: 1000, col: 2, row: 0 },
    { id: 2, type: 'archer', level: 1000, col: 2, row: 1 },
    { id: 3, type: 'healer', level: 1000, col: 2, row: 2 },
  ];
  const before = campaignSnapshot(campaign);
  const run = createDungeonRun(GOBLIN_CAVE_LEVELS[1], { clearedWaves: 100, firstClears: [] },
    campaign.units, ['2:0', '2:1', '2:2']);
  for (const wave of run.waves) {
    if (wave.number > 1) assert.equal(prepareNextDungeonWave(run), true);
    assert.equal(startDungeonBattle(run, campaign.hero, campaign.forge), true);
    for (let tick = 0; tick < 60 * 900 && run.battle.phase === 'running'; tick++) updateBattle(run.battle, 1 / 60);
    assert.equal(run.battle.phase, 'victory', `wave ${wave.number}`);
    assert.equal(finishDungeonWave(run), true);
    if (wave.number < 3) assert.equal(applyDungeonRunReward(campaign, run).reason, 'unfinished-run');
  }
  assert.equal(run.stage, 'complete');
  assert.equal(run.battle.enemies[0].type, 'goblinBombardier');
  assert.ok(run.battle.enemies[0].hp <= 0);
  assert.deepEqual(campaignSnapshot(campaign), before, 'combat itself does not modify campaign progression or army');
  assert.deepEqual(applyDungeonRunReward(campaign, run), { ok: true, gold: 300, slaves: 5 });
});

for (const level of GOBLIN_CAVE_LEVELS.slice(0, 2)) {
test(`Cave ${level.numeral} grants once per clear, survives saves and allows repeat rewards`, () => {
  let campaign = createCampaignState(1800000000000);
  const before = campaignSnapshot(campaign);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const run = completeRun(campaign, level);
    assert.deepEqual(applyDungeonRunReward(campaign, run), { ok: true, ...level.completionReward });
    const paid = campaignSnapshot(campaign);
    assert.equal(applyDungeonRunReward(campaign, run).reason, 'already-recorded');
    assert.deepEqual(campaignSnapshot(campaign), paid);
    campaign = restoreCampaignState(paid, 1800000000000);
    assert.equal(campaign.gold, before.gold + attempt * level.completionReward.gold);
    assert.equal(campaign.economy.slaves, before.economy.slaves + attempt * level.completionReward.slaves);
    assert.deepEqual(campaign.hero, before.hero);
    assert.deepEqual(campaign.units, before.units);
    assert.deepEqual(campaign.progression, before.progression);
    assert.equal(campaign.clearedWaves, before.clearedWaves);
  }
});

test(`Cave ${level.numeral} rejects unfinished/failed runs and partial grants; Cave III has no rewards`, () => {
  const campaign = createCampaignState(1800000000000);
  const before = campaignSnapshot(campaign);
  const run = createDungeonRun(level, { clearedWaves: level.unlockRound * 10, firstClears: [] },
    [{ id: 1, type: 'swordsman', level: 10, col: 2, row: 0 }], ['2:0']);
  for (const stage of ['preparation', 'combat', 'wave-cleared', 'defeat']) {
    run.stage = stage;
    assert.equal(applyDungeonRunReward(campaign, run).reason, 'unfinished-run');
    assert.equal(run.reward, null);
  }
  assert.equal(applyDungeonRunReward(campaign, completeRun(campaign, GOBLIN_CAVE_LEVELS[2])).reason, 'preview-only');
  assert.deepEqual(campaignSnapshot(campaign), before);
  const completed = completeRun(campaign, level);
  for (const resource of ['gold', 'slaves']) {
    const state = structuredClone(campaign);
    if (resource === 'gold') state.gold = Number.MAX_SAFE_INTEGER;
    else state.economy.slaves = Number.MAX_SAFE_INTEGER;
    const snapshot = structuredClone(state);
    assert.equal(applyDungeonRunReward(state, completed).reason, 'resource-overflow');
    assert.equal(completed.reward, null);
    assert.deepEqual(state, snapshot);
  }
});
}
