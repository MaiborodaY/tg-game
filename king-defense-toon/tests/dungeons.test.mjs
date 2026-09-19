import assert from 'node:assert/strict';
import test from 'node:test';
import { GOBLIN_CAVE_LEVELS, getDungeonLevel, isDungeonLevelUnlocked } from '../dungeons.ts';
import { createCampaignState, campaignSnapshot, restoreCampaignState } from '../campaign-state.ts';
import { createScreenController } from '../screen-controller.ts';

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
