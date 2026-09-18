import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCampaignApis, runEarlyCampaign, directClearGoldBounds } from '../scripts/early-campaign.mjs';

const apis = await loadCampaignApis();

test('campaign scenario starts from actual supplies and spends only real earned resources', () => {
  const run = runEarlyCampaign(apis, { seed: 4, maxAttempts: 3 });
  assert.deepEqual(run, runEarlyCampaign(apis, { seed: 4, maxAttempts: 3 }));
  assert.equal(run.attempts[0].start.conversions, apis.barracks.STARTING_SLAVES);
  assert.equal(run.attempts[0].start.ownedLevelMass, 3);
  assert.equal(run.attempts[0].start.gold, apis.progression.STARTING_GOLD);
  assert.equal(run.conversions, apis.barracks.STARTING_SLAVES + run.captures);
  assert.equal(Object.values(run.received).reduce((sum, count) => sum + count, 0), run.conversions);
  for (const attempt of run.attempts) {
    assert.ok(attempt.start.gold >= 0);
    assert.ok(attempt.start.army.every(unit => attempt.start.unlockedCells.includes(`${unit.col}:${unit.row}`)));
  }
});

test('an unresolved campaign battle neither retreats nor awards a first clear', () => {
  const run = runEarlyCampaign(apis, { seed: 4, maxAttempts: 3, maxBattleSeconds: .1 });
  assert.equal(run.termination, 'timeout');
  assert.equal(run.attempts.length, 1);
  assert.equal(run.attempts[0].outcome, 'timeout');
  assert.equal(run.cleared, 0);
  assert.deepEqual(run.firstClears, []);
  assert.equal(run.hero.xp, 0);
  assert.equal(run.attempts[0].heroXp, null);
  assert.equal(run.conversions, apis.barracks.STARTING_SLAVES);
});

test('campaign diagnostics carry earned hero XP into the next battle without auto-spending talents', () => {
  const run = runEarlyCampaign(apis, { seed: 4, maxAttempts: 4 });
  let expected = 0;
  for (const attempt of run.attempts) {
    assert.equal(attempt.start.hero.xp, expected);
    expected += attempt.heroXp?.gained ?? 0;
  }
  assert.ok(expected > 0);
  assert.equal(run.hero.xp, expected);
  assert.ok(Object.values(run.hero.talents).every(rank => rank === 0));
});

test('direct-clear slot affordability is based on current waves and separate single-use bonuses', () => {
  const rows = directClearGoldBounds(apis);
  assert.equal(rows.length, 10);
  assert.equal(rows[0].totalGoldBeforeExpenses, apis.progression.STARTING_GOLD + apis.engine.getWaveDefinition(1).reward + 10);
  assert.equal(rows[9].bonuses, 550);
  assert.equal(rows[9].killGold, Array.from({ length: 10 }, (_, i) => apis.engine.getWaveDefinition(i + 1).reward).reduce((sum, reward) => sum + reward, 0));
  assert.ok(rows.every(row => row.maxSlotsWithoutTreasuryOrSales >= 3 && row.maxSlotsWithoutTreasuryOrSales <= 9));
});

test('three-round diagnostics retain per-round first-clear bonuses and the ten-wave default', () => {
  const rows = directClearGoldBounds(apis, 30);
  assert.equal(rows.length, 30);
  assert.deepEqual([rows[9].bonuses, rows[19].bonuses, rows[29].bonuses], [550, 1100, 1650]);
  assert.equal(rows[29].maxSlotsWithoutTreasuryOrSales, 9, 'surplus gold cannot bypass Barracks I capacity');
  assert.equal(directClearGoldBounds(apis).length, 10);
  assert.equal(runEarlyCampaign(apis, { lastWave: 30, maxBattleSeconds: .1 }).termination, 'timeout');
  assert.throws(() => runEarlyCampaign(apis, { lastWave: 31 }), RangeError);
  assert.throws(() => directClearGoldBounds(apis, 31), RangeError);
});

test('capture cooldown expires after thirty foreground seconds at both x1 and x3', () => {
  for (const speed of [1, 3]) {
    let observedEconomy;
    const clockApis = { ...apis,
      economy: { ...apis.economy, createEconomy(saved) {
        observedEconomy = apis.economy.createEconomy({ ...saved, captures: 4, captureCooldown: 30 });
        return observedEconomy;
      } },
      // Isolate the scenario clock from fighting, so a victory or defeat cannot end
      // the observation before the cooldown boundary. All economy functions are real.
      engine: { ...apis.engine, updateBattle(battle, dt) { battle.elapsed += dt; return []; } },
    };
    const rate = apis.speed.battleFrameDelta(1 / 60, speed) / (1 / 60);
    const run = runEarlyCampaign(clockApis, { seed: 4, speed, maxBattleSeconds: 30 * rate });
    assert.equal(run.termination, 'timeout');
    assert.equal(run.wallSeconds, 30);
    assert.ok(Math.abs(run.attempts[0].battleSeconds - 30 * rate) < 1e-9);
    assert.equal(observedEconomy.captureCooldown, 0);
    assert.equal(observedEconomy.captures, 4);
    assert.ok(Math.abs(observedEconomy.treasuryProgress - .5) < 1e-9);
  }
  assert.throws(() => runEarlyCampaign(apis, { speed: 4 }), RangeError);
});
