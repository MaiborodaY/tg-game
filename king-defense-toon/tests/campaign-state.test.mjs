import assert from 'node:assert/strict';
import test from 'node:test';
import { campaignSnapshot, createCampaignState, resetCampaignState, restoreCampaignState } from '../campaign-state.ts';
import { allocateCampaignUnitId, EXHAUSTED_UNIT_ID } from '../campaign-roster.ts';
import { SAVE_SCHEMA_VERSION } from '../campaign-save.ts';
import { createSaveStorage } from '../save-storage.ts';
import { decodeCampaignSave, needsCampaignSaveMigration } from '../campaign-save.ts';
import { STARTING_GOLD, STARTING_CELLS } from '../progression.ts';
import { STARTING_SLAVES } from '../barracks.ts';
import { claimOfflineTreasury } from '../economy.ts';
import { claimOfflineMarket } from '../market.ts';
import { CAMPAIGN_VERSION } from '../waves.ts';
import { completeOnboarding } from '../campaign-commands.ts';

const now = 1_700_000_000_000;
const legacy = fields => ({ campaignVersion: CAMPAIGN_VERSION, gold: 125, ...fields });
const reload = state => restoreCampaignState(JSON.parse(JSON.stringify(campaignSnapshot(state))), now);

test('onboarding resumes for fresh saves, skips legacy saves, and restarts only with a new campaign', () => {
  const state = createCampaignState(now);
  assert.equal(reload(state).onboardingCompleted, false);
  completeOnboarding(state);
  completeOnboarding(state);
  assert.equal(reload(state).onboardingCompleted, true);
  assert.equal(resetCampaignState(state, now).onboardingCompleted, false);
  assert.equal(restoreCampaignState(legacy({}), now).onboardingCompleted, true);
  assert.equal(restoreCampaignState(legacy({ onboardingCompleted: false, clearedWaves: 1 }), now).onboardingCompleted, true);
});

test('fresh campaign owns starter supply and injected economic checkpoint without reading the wall clock', () => {
  const original = Date.now;
  Date.now = () => { throw new Error('State initialization must use its injected clock'); };
  try {
    const state = createCampaignState(now);
    assert.equal(state.gold, STARTING_GOLD);
    assert.equal(state.economy.slaves, STARTING_SLAVES);
    assert.equal(state.starterSupplyGranted, true);
    assert.equal(state.economy.treasuryUpdatedAt, now);
    assert.equal(state.economy.marketUpdatedAt, now);
    assert.equal(state.economy.marketLevel, 1);
    assert.equal(state.nextUnitId, 1);
    assert.deepEqual(state.units, []);
    assert.deepEqual(state.reserve, []);
    assert.deepEqual(reload(state), state);
    assert.deepEqual(restoreCampaignState(legacy({}), now), { ...state, onboardingCompleted: true });
  } finally { Date.now = original; }
  for (const time of [0, -1, 1.1, Infinity, NaN, '100']) {
    assert.throws(() => createCampaignState(time), RangeError);
    assert.throws(() => restoreCampaignState(legacy({}), time), RangeError);
  }
});

test('legacy zero, one and current schemas retain IDs and migrate once across JSON reloads', () => {
  for (const schema of [undefined, 0, 1, 2, SAVE_SCHEMA_VERSION]) {
    const raw = legacy({ gold: 250.8, nextUnitId: 80,
      units: [{ id: 8, type: 'archer', level: 11, col: 2, row: 0 }],
      reserve: [{ id: 2, type: 'healer', level: 13 }],
      economy: { slaves: 0 }, starterSupplyGranted: true,
      autoWaves: false, autoWavesDefaultVersion: 1,
    });
    if (schema !== undefined) raw.saveSchemaVersion = schema;
    const source = structuredClone(raw);
    const restored = restoreCampaignState(raw, now);
    assert.deepEqual(raw, source);
    assert.equal(restored.gold, 250);
    assert.equal(restored.units[0].id, 8);
    assert.equal(restored.reserve[0].id, 2);
    assert.equal(restored.nextUnitId, 80);
    assert.equal(restored.autoWaves, false);
    assert.deepEqual(reload(reload(restored)), restored);
  }
});

test('selling the highest fighter then reloading cannot recycle its ID', () => {
  const state = createCampaignState(now);
  state.reserve.push({ id: allocateCampaignUnitId(state), type: 'swordsman', level: 1 });
  const soldId = allocateCampaignUnitId(state);
  state.reserve.push({ id: soldId, type: 'archer', level: 1 });
  state.reserve = state.reserve.filter(unit => unit.id !== soldId);
  const restored = reload(state);
  const nextId = allocateCampaignUnitId(restored);
  assert.equal(soldId, 2);
  assert.equal(nextId, 3);
  assert.equal(restored.reserve[0].id, 1);
  assert.equal(reload(restored).nextUnitId, 4);
});

test('migration credits slot and retired forge refunds exactly once and retains pending receipts', () => {
  const saved = legacy({ gold: 100, starterSupplyGranted: true,
    progression: { unlockedCells: ['0:0', '1:0', '4:0'], firstClears: [1, 10, 201] },
    units: [{ id: 35, type: 'lancer', level: 120, col: 0, row: 0 },
      { id: 4, type: 'archer', level: 80, col: 1, row: 0 }],
    reserve: [{ id: 12, type: 'healer', level: 7 }], nextUnitId: 100,
    forge: { health: 2, attack: 3, attackSpeed: 4, rangedAttack: 2, rangedAttackSpeed: 1 },
    offlineRewards: { gold: 9, slaves: 2, slotRefund: 4, returnedFighters: 1, closedCells: 1, forgeRefund: 3 },
  });
  const state = restoreCampaignState(saved, now);
  assert.equal(state.gold, 100 + 150 + 90);
  assert.deepEqual(state.offlineRewards, { gold: 9, slaves: 2, slotRefund: 154, returnedFighters: 2, closedCells: 3, forgeRefund: 93 });
  assert.deepEqual(state.progression.unlockedCells, [...STARTING_CELLS, '1:0']);
  assert.deepEqual(state.reserve.map(unit => unit.id), [12, 35]);
  assert.equal(state.units[0].id, 4);
  assert.equal(state.nextUnitId, 100);
  assert.deepEqual(state.forge, { health: 2, attack: 3, attackSpeed: 4 });
  assert.deepEqual(reload(reload(state)), state);
});

test('footprint reconciliation preserves the ID and receipt of a displaced mounted fighter', () => {
  const state = restoreCampaignState(legacy({ barracks: { level: 3 }, starterSupplyGranted: true,
    progression: { unlockedCells: ['3:0'] },
    units: [{ id: 41, type: 'pantherRider', level: 9, col: 2, row: 0 },
      { id: 77, type: 'archer', level: 2, col: 3, row: 0 }],
  }), now);
  assert.deepEqual(state.units.map(unit => unit.id), [77]);
  assert.deepEqual(state.reserve, [{ id: 41, type: 'pantherRider', level: 9 }]);
  assert.equal(state.offlineRewards.returnedFighters, 1);
  assert.deepEqual(reload(state), state);
});

test('spent starter supply is never restored and legacy auto-wave and market hint rules remain intact', () => {
  assert.equal(restoreCampaignState(legacy({ economy: { slaves: 0 } }), now).economy.slaves, 3);
  assert.equal(restoreCampaignState(legacy({ starterSupplyGranted: true, economy: { slaves: 0 } }), now).economy.slaves, 0);
  assert.equal(restoreCampaignState(legacy({ reserve: [{ type: 'healer' }] }), now).economy.slaves, 0);
  assert.equal(restoreCampaignState(legacy({ autoWaves: false }), now).autoWaves, true);
  const state = restoreCampaignState(legacy({ recruitment: { version: 2, received: { archer: 1 } } }), now);
  assert.equal(state.marketHintCompleted, true);
  state.economy.slaves = 0;
  assert.equal(reload(state).economy.slaves, 0);
});

test('restoration preserves unpaid absence, absolute construction timers and all owned domains', () => {
  const past = now - 60_000;
  const original = Date.now;
  Date.now = () => { throw new Error('Restoration must use its injected clock'); };
  let state;
  try {
    state = restoreCampaignState(legacy({ starterSupplyGranted: true,
      economy: { treasuryUpdatedAt: past, marketBuilt: true, marketUpdatedAt: past, slaves: 0 },
      barracks: { level: 1, upgradeStartedAt: now - 3_600_000, upgradeReadyAt: now },
      farm: { plots: { carrot: { plantedAt: past, readyAt: past + 300_000 } }, stock: { potato: 5 } },
      capitol: { health: 12, tower: 15 }, hero: { xp: 60, highestWave: 3 },
    }), now);
  } finally { Date.now = original; }
  assert.equal(state.barracks.level, 2);
  assert.equal(state.barracks.firstLancerPending, true);
  assert.equal(state.economy.treasuryUpdatedAt, past);
  assert.equal(state.economy.marketUpdatedAt, past);
  assert.equal(claimOfflineTreasury(state.economy, now).gold, 1);
  assert.equal(claimOfflineMarket(state.economy, now).slaves, 0);
  assert.equal(state.farm.stock.potato, 5);
  assert.equal(state.farm.plots.carrot.readyAt, past + 300_000);
  assert.deepEqual(state.capitol, { health: 12, tower: 15 });
  assert.equal(state.hero.xp, 60);
});

test('snapshot owns every nested object and excludes transient extra runtime fields', () => {
  const state = createCampaignState(now);
  state.reserve.push({ id: allocateCampaignUnitId(state), type: 'archer', level: 8 });
  state.farm.plots.carrot = { plantedAt: now, readyAt: now + 300_000 };
  state.transient = { html: 'not durable' };
  const snapshot = campaignSnapshot(state);
  assert.equal(snapshot.saveSchemaVersion, SAVE_SCHEMA_VERSION);
  assert.equal(Object.hasOwn(snapshot, 'transient'), false);
  const before = structuredClone(snapshot);
  state.reserve[0].level = 20;
  state.recruitment.received.archer = 9;
  state.farm.plots.carrot.readyAt += 1;
  state.farm.stock.potato = 8;
  state.hero.talents.heal_unlock = 1;
  state.progression.firstClears.push(1);
  state.offlineRewards.forgeRefund = 50;
  state.economy.slaves = 90;
  state.barracks.level = 4;
  state.forge.health = 30;
  state.capitol.health = 40;
  assert.deepEqual(snapshot, before);
  snapshot.reserve[0].level = 1;
  assert.equal(state.reserve[0].level, 20);
});

test('reset clears progress but retains consumed IDs, preferences and acknowledged market hint', () => {
  const state = createCampaignState(now);
  state.gold = 999;
  state.nextUnitId = 500;
  state.reserve.push({ id: 49, type: 'archer', level: 8 });
  state.autoWaves = false;
  state.marketHintCompleted = true;
  state.forge.health = 10;
  state.hero.xp = 60;
  const before = structuredClone(state);
  const fresh = resetCampaignState(state, now + 1000);
  assert.deepEqual(fresh, { ...createCampaignState(now + 1000), nextUnitId: 500, autoWaves: false, marketHintCompleted: true });
  assert.deepEqual(state, before);
  assert.equal(allocateCampaignUnitId(fresh), 500);
  state.nextUnitId = EXHAUSTED_UNIT_ID;
  assert.equal(resetCampaignState(state, now).nextUnitId, EXHAUSTED_UNIT_ID);
});

test('legacy schema-one storage migration backs up original bytes before saving persistent IDs', () => {
  const key = 'campaign', backupKey = 'before-schema-3';
  const raw = JSON.stringify(legacy({ saveSchemaVersion: 1, reserve: [{ id: 99, type: 'archer' }] }));
  const disk = new Map([[key, raw]]);
  const storage = createSaveStorage({ key, getStorage: () => ({ getItem: key => disk.get(key) ?? null,
    setItem: (key, value) => disk.set(key, value) }), decode: decodeCampaignSave,
  migrationBackup: { key: backupKey, needed: needsCampaignSaveMigration } });
  const loaded = storage.load();
  assert.equal(loaded.ok, true);
  assert.equal(storage.save(campaignSnapshot(restoreCampaignState(loaded.value, now))).ok, true);
  assert.equal(disk.get(backupKey), raw);
  assert.equal(JSON.parse(disk.get(key)).nextUnitId, 100);
  assert.equal(JSON.parse(disk.get(key)).saveSchemaVersion, SAVE_SCHEMA_VERSION);
});
