import assert from 'node:assert/strict';
import test from 'node:test';
import { accrueTreasury, advanceCaptureClock, checkpointTreasury, claimOfflineTreasury, createEconomy,
  rollSlaveDrop, treasuryUpgradeCost, upgradeTreasury } from '../economy.ts';
import { accrueMarket, upgradeMarket, checkpointMarket, claimOfflineMarket, createMarketState, marketRate, marketUpgradeCost } from '../market.ts';

const NOW = 1_800_000_000_000;
const HALF_HOUR = 1800;
const emptyTreasury = { gold: 0, elapsedSeconds: 0, capped: false };
const emptyMarket = { slaves: 0, elapsedSeconds: 0, capped: false };

test('save normalization rejects numeric text and malformed balances while preserving valid progress', () => {
  const empty = createEconomy();
  for (const saved of [null, false, true, 15, 'saved', [], {}]) assert.deepEqual(createEconomy(saved), empty);
  for (const value of ['2', -1, 1.5, NaN, Infinity, null, false, {}, []]) {
    assert.deepEqual(createEconomy({ treasuryLevel: value, treasuryProgress: value, treasuryUpdatedAt: value,
      slaves: value, captures: value, captureKills: value, captureCooldown: value,
      marketLevel: value, marketBuilt: 'true', marketProgress: value, marketUpdatedAt: value }), empty);
  }
  const source = Object.freeze({ treasuryLevel: 99, treasuryProgress: .25, treasuryUpdatedAt: NOW,
    slaves: 12, captures: 4, captureKills: 3, captureCooldown: 100,
    marketBuilt: true, marketProgress: .75, marketUpdatedAt: NOW });
  assert.deepEqual(createEconomy(source), { ...source, marketLevel: 2, treasuryLevel: 5, captureCooldown: 30 });
  assert.deepEqual(createMarketState({ marketBuilt: 1, marketProgress: .75, marketUpdatedAt: NOW }),
    { marketLevel: 1, marketBuilt: true, marketProgress: 0, marketUpdatedAt: null });
  const starter = createEconomy({ captures: 3, captureKills: 2, captureCooldown: 30, slaves: 9 });
  assert.equal(starter.captureCooldown, 0);
  assert.equal(starter.captureKills, 2);
  assert.equal(starter.slaves, 9);
});

test('market starts free and upgrades add one per hour without touching captures', () => {
  const economy = createEconomy({ slaves: 7, captures: 4, captureKills: 2, captureCooldown: 12 });
  assert.equal(marketRate(economy), 1);
  assert.equal(marketUpgradeCost(economy), 100);
  checkpointMarket(economy, NOW);
  assert.equal(accrueMarket(economy, 3600), 1);
  checkpointMarket(economy, NOW + 3_600_000);
  const before = structuredClone(economy);
  for (const gold of [99, -1, NaN, Infinity, '100', 125.5]) {
    assert.deepEqual(upgradeMarket(economy, gold, NOW + 3_600_000), { upgraded: false, gold });
    assert.deepEqual(economy, before);
  }
  assert.deepEqual(upgradeMarket(economy, 125, NOW + 3_600_000), { upgraded: true, gold: 25 });
  assert.deepEqual(economy, { ...before, marketLevel: 2 });
  assert.equal(marketRate(economy), 2);
  assert.equal(marketUpgradeCost(economy), 200);
  assert.deepEqual(upgradeMarket(economy, 200, NOW + 3_600_000), { upgraded: true, gold: 0 });
  assert.equal(marketRate(economy), 3);
  assert.equal(marketUpgradeCost(economy), 300);
  assert.equal(accrueMarket(economy, 3600), 3);
  assert.deepEqual([economy.captures, economy.captureKills, economy.captureCooldown], [4, 2, 12]);
});

test('market upgrades settle old-rate income and preserve fractional progress through reload', () => {
  const economy = createEconomy({ marketLevel: 1, marketProgress: .25, marketUpdatedAt: NOW, slaves: 2 });
  assert.deepEqual(upgradeMarket(economy, 100, NOW + 4_500_000), { upgraded: true, gold: 0 });
  assert.equal(economy.slaves, 3);
  assert.equal(economy.marketProgress, .5);
  assert.equal(economy.marketUpdatedAt, NOW + 4_500_000);
  const restored = createEconomy(JSON.parse(JSON.stringify(economy)));
  assert.deepEqual(restored, economy);
  assert.equal(claimOfflineMarket(restored, NOW + 4_500_000).slaves, 0);
  assert.equal(claimOfflineMarket(restored, NOW + 5_400_000).slaves, 1);
  assert.equal(restored.marketProgress, 0);
});

test('free and upgraded market offline storage stays four hours at the current rate', () => {
  for (const level of [1, 2, 3, 10]) {
    const economy = createEconomy({ marketLevel: level, marketUpdatedAt: NOW, marketProgress: .5 });
    assert.equal(claimOfflineMarket(economy, NOW + 8 * 3_600_000).slaves, 4 * level);
    assert.equal(economy.marketProgress, .5);
    assert.equal(claimOfflineMarket(economy, NOW + 8 * 3_600_000).slaves, 0);
  }
});

test('market upgrade rejects invalid time, cost overflow and balance overflow without consuming progress', () => {
  const economy = createEconomy({ marketLevel: 1, marketUpdatedAt: NOW, slaves: Number.MAX_SAFE_INTEGER });
  const before = structuredClone(economy);
  for (const time of [0, -1, 1.5, NaN, Infinity, '1800000000000', NOW + 3_600_000]) {
    assert.deepEqual(upgradeMarket(economy, 100, time), { upgraded: false, gold: 100 });
    assert.deepEqual(economy, before);
  }
  const maximum = createEconomy({ marketLevel: Number.MAX_SAFE_INTEGER });
  assert.equal(marketUpgradeCost(maximum), null);
  assert.deepEqual(upgradeMarket(maximum, Number.MAX_SAFE_INTEGER, NOW), { upgraded: false, gold: Number.MAX_SAFE_INTEGER });
});

test('fractional market production survives saves and never changes capture guarantees', () => {
  const economy = createEconomy({ marketBuilt: true, marketProgress: .25, slaves: 2,
    captures: 4, captureKills: 3, captureCooldown: 12 });
  assert.equal(accrueMarket(economy, HALF_HOUR / 2), 0);
  assert.equal(economy.marketProgress, .75);
  const reloaded = createEconomy(JSON.parse(JSON.stringify(economy)));
  assert.equal(accrueMarket(reloaded, HALF_HOUR / 4), 1);
  assert.equal(reloaded.marketProgress, 0);
  assert.equal(reloaded.slaves, 3);
  assert.deepEqual([reloaded.captures, reloaded.captureKills, reloaded.captureCooldown], [4, 3, 12]);
});

test('treasury fractional gold survives a level purchase and maximum level rejects another charge', () => {
  const economy = createEconomy({ treasuryProgress: .75 });
  assert.equal(accrueTreasury(economy, 15), 1);
  assert.equal(economy.treasuryProgress, 0);
  assert.equal(accrueTreasury(economy, 30), 0);
  assert.equal(economy.treasuryProgress, .5);
  assert.deepEqual(upgradeTreasury(economy, 100), { upgraded: true, gold: 25 });
  assert.equal(economy.treasuryProgress, .5);
  assert.equal(accrueTreasury(economy, 15), 1);
  assert.equal(economy.treasuryProgress, 0);
  const maximum = createEconomy({ treasuryLevel: 5, treasuryProgress: .75 });
  assert.equal(treasuryUpgradeCost(maximum), null);
  assert.deepEqual(upgradeTreasury(maximum, 1000), { upgraded: false, gold: 1000 });
  assert.equal(maximum.treasuryProgress, .75);
});

test('old saves establish departure baselines without inventing offline income', () => {
  const economy = createEconomy({ marketBuilt: true, marketProgress: .5, treasuryProgress: .5, slaves: 7 });
  assert.deepEqual(claimOfflineMarket(economy, NOW), emptyMarket);
  assert.deepEqual(claimOfflineTreasury(economy, NOW), emptyTreasury);
  assert.deepEqual([economy.marketUpdatedAt, economy.treasuryUpdatedAt], [NOW, NOW]);
  assert.deepEqual([economy.marketProgress, economy.treasuryProgress, economy.slaves], [.5, .5, 7]);
  const unbuilt = createEconomy({ marketBuilt: false, marketProgress: .9, marketUpdatedAt: NOW - 3_600_000 });
  assert.equal(unbuilt.marketLevel, 1);
  assert.deepEqual(claimOfflineMarket(unbuilt, NOW), emptyMarket);
  assert.equal(unbuilt.marketUpdatedAt, NOW);
  assert.equal(unbuilt.marketProgress, 0);
  assert.equal(claimOfflineMarket(unbuilt, NOW + 3_600_000).slaves, 1);
});

test('offline rewards cap each resource at four hours and consume the complete absence once', () => {
  const economy = createEconomy({ treasuryLevel: 2, treasuryProgress: .25, treasuryUpdatedAt: NOW,
    marketBuilt: true, marketProgress: .75, marketUpdatedAt: NOW, slaves: 2,
    captures: 4, captureCooldown: 30, captureKills: 3 });
  const returnAt = NOW + 8 * 3600 * 1000;
  assert.deepEqual(claimOfflineTreasury(economy, returnAt), { gold: 480, elapsedSeconds: 14400, capped: true });
  assert.deepEqual(claimOfflineMarket(economy, returnAt), { slaves: 8, elapsedSeconds: 14400, capped: true });
  assert.deepEqual([economy.treasuryProgress, economy.marketProgress], [.25, .75]);
  assert.deepEqual([economy.treasuryUpdatedAt, economy.marketUpdatedAt], [returnAt, returnAt]);
  assert.deepEqual([economy.slaves, economy.captures, economy.captureKills, economy.captureCooldown], [10, 4, 3, 30]);
  const reloaded = createEconomy(JSON.parse(JSON.stringify(economy)));
  assert.deepEqual(claimOfflineTreasury(reloaded, returnAt), emptyTreasury);
  assert.deepEqual(claimOfflineMarket(reloaded, returnAt), emptyMarket);
  assert.deepEqual(claimOfflineMarket(reloaded, returnAt + HALF_HOUR * 1000),
    { slaves: 1, elapsedSeconds: HALF_HOUR, capped: false });
  const atLimit = createEconomy({ treasuryUpdatedAt: NOW, marketBuilt: true, marketUpdatedAt: NOW });
  assert.equal(claimOfflineTreasury(atLimit, NOW + 14400 * 1000).capped, false);
  assert.equal(claimOfflineMarket(atLimit, NOW + 14400 * 1000).capped, false);
});

test('clock rollback and invalid timestamps cannot replay or move paid checkpoints backward', () => {
  const future = NOW + 3600 * 1000;
  const economy = createEconomy({ treasuryUpdatedAt: future, marketBuilt: true, marketUpdatedAt: future });
  assert.deepEqual(claimOfflineTreasury(economy, NOW), emptyTreasury);
  assert.deepEqual(claimOfflineMarket(economy, NOW), emptyMarket);
  for (const now of [0, -1, 1.5, NaN, Infinity, '1800000000000']) {
    const before = structuredClone(economy);
    checkpointTreasury(economy, now);
    checkpointMarket(economy, now);
    assert.deepEqual(claimOfflineTreasury(economy, now), emptyTreasury);
    assert.deepEqual(claimOfflineMarket(economy, now), emptyMarket);
    assert.deepEqual(economy, before);
  }
  assert.deepEqual([economy.treasuryUpdatedAt, economy.marketUpdatedAt], [future, future]);
  assert.deepEqual(claimOfflineTreasury(economy, future + HALF_HOUR * 1000),
    { gold: 30, elapsedSeconds: HALF_HOUR, capped: false });
  assert.deepEqual(claimOfflineMarket(economy, future + HALF_HOUR * 1000),
    { slaves: 1, elapsedSeconds: HALF_HOUR, capped: false });
});

test('invalid foreground intervals never mutate balances or cooldowns, including numeric text', () => {
  const economy = createEconomy({ treasuryProgress: .5, marketBuilt: true, marketProgress: .5,
    captures: 4, captureCooldown: 30, slaves: 7 });
  const before = structuredClone(economy);
  for (const seconds of [0, -1, NaN, Infinity, '60', null, undefined]) {
    assert.equal(accrueTreasury(economy, seconds), 0);
    assert.equal(accrueMarket(economy, seconds), 0);
    advanceCaptureClock(economy, seconds);
    assert.deepEqual(economy, before);
  }
  for (let frame = 0; frame < 30 * 60; frame++) advanceCaptureClock(economy, 1 / 60);
  assert.equal(economy.captureCooldown, 0);
});

test('capture cooldown skips RNG, while a pity capture still rolls after counting the kill', () => {
  const economy = createEconomy({ captures: 4, captureCooldown: 30, captureKills: 4 });
  assert.equal(rollSlaveDrop(economy, () => { throw new Error('Cooldown must not roll'); }), 0);
  assert.equal(economy.captureKills, 4);
  advanceCaptureClock(economy, 30);
  let calls = 0;
  assert.equal(rollSlaveDrop(economy, () => { calls++; assert.equal(economy.captureKills, 5); return NaN; }), 1);
  assert.equal(calls, 1);
  assert.deepEqual([economy.slaves, economy.captures, economy.captureKills, economy.captureCooldown], [1, 5, 0, 30]);
});

test('starter guarantees use two then three eligible kills and begin cooldown on the fourth capture', () => {
  const economy = createEconomy();
  assert.equal(rollSlaveDrop(economy, () => .99), 0);
  assert.equal(rollSlaveDrop(economy, () => .99), 1);
  assert.equal(economy.captureCooldown, 0);
  for (let capture = 2; capture <= 4; capture++) {
    assert.equal(rollSlaveDrop(economy, () => .99), 0);
    assert.equal(rollSlaveDrop(economy, () => .99), 0);
    assert.equal(rollSlaveDrop(economy, () => .99), 1);
    assert.equal(economy.captures, capture);
    assert.equal(economy.captureCooldown, capture < 4 ? 0 : 30);
  }
  assert.equal(economy.slaves, 4);
});

test('invalid or throwing capture rolls preserve the original kill counting and mutation order', () => {
  for (const roll of [NaN, Infinity, -1, '0']) {
    const economy = createEconomy({ captures: 4 });
    assert.equal(rollSlaveDrop(economy, () => roll), 0);
    assert.deepEqual([economy.captureKills, economy.slaves, economy.captures], [1, 0, 4]);
  }
  const economy = createEconomy({ captures: 4, captureKills: 4 });
  assert.throws(() => rollSlaveDrop(economy, () => { throw new Error('RNG failure'); }), /RNG failure/);
  assert.deepEqual([economy.captureKills, economy.slaves, economy.captures, economy.captureCooldown], [5, 0, 4, 0]);
});
