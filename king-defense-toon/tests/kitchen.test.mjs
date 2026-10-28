import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignState, campaignSnapshot, restoreCampaignState, resetCampaignState } from '../campaign-state.ts';
import { cookCampaignMeals } from '../campaign-commands.ts';
import { createKitchen, kitchenProgress, kitchenBonuses, batchDuration, RECIPES } from '../kitchen.ts';
import { decodeCampaignSave, SAVE_SCHEMA_VERSION, needsCampaignSaveMigration } from '../campaign-save.ts';
import { createSaveStorage } from '../save-storage.ts';
import { createFarm } from '../farm.ts';

const now = 1_800_000_000_000;
function state(stock = 200) {
  const value = createCampaignState(now);
  value.farm.stock = { carrot: stock, potato: stock, pumpkin: stock };
  return value;
}
const cook = (value, recipe = 'carrot-health', quantity = 1, time = now) => cookCampaignMeals(value, recipe, quantity, time);

test('kitchen levels require 10, 40, 90 additional cooks; only duration grows', () => {
  for (const [total, level, cooked, required, durationMs] of [
    [0, 1, 0, 10, 600000], [9, 1, 9, 10, 600000], [10, 2, 0, 40, 630000],
    [49, 2, 39, 40, 630000], [50, 3, 0, 90, 660000], [140, 4, 0, 160, 690000],
  ]) assert.deepEqual(kitchenProgress(total), { level, cooked, required, durationMs });
  const late = kitchenProgress(Number.MAX_SAFE_INTEGER);
  assert.ok(late.level > 100000 && late.cooked >= 0 && late.cooked < late.required);
  assert.deepEqual(RECIPES.map(recipe => recipe.bonus), [1, 1, 1, 2, 2, 2]);
});

test('batch cooking is identical to individual portions across multiple level-ups', () => {
  const bulk = state(), separate = state();
  assert.equal(cook(bulk, 'carrot-health', 151).ok, true);
  for (let i = 0; i < 151; i++) assert.equal(cook(separate).ok, true);
  assert.deepEqual(bulk, separate);
  assert.equal(batchDuration(0, 10), 100 * 60000);
  assert.equal(batchDuration(9, 2), 600000 + 630000);
  assert.equal(bulk.kitchen.mealsCooked, 151);
  assert.equal(bulk.farm.stock.carrot, 49);
});

test('same recipe extends remaining time, different stats coexist without percentage stacking', () => {
  const value = state();
  cook(value, 'carrot-health', 2);
  cook(value, 'carrot-health', 1, now + 60000);
  cook(value, 'carrot-attack'); cook(value, 'carrot-attackSpeed');
  assert.equal(value.kitchen.buffs.health.length, 1);
  assert.equal(value.kitchen.buffs.health[0].endsAt, now + 1800000);
  assert.deepEqual(kitchenBonuses(value.kitchen, now + 60000), { health: 1, attack: 1, attackSpeed: 1 });
});

test('potato requires farm level two even with legacy potato stock', () => {
  const value = state(), before = structuredClone(value);
  assert.equal(cook(value, 'potato-health').reason, 'farm-locked');
  assert.deepEqual(value, before);
  value.farm = createFarm({ ...value.farm, level: 2 }, now);
  assert.equal(cook(value, 'potato-health').ok, true);
  assert.equal(kitchenBonuses(value.kitchen, now).health, 2);
});

test('stronger food runs first, keeps weaker time and cannot be extended cheaply', () => {
  const value = state(); value.farm.level = 2;
  cook(value, 'carrot-attack', 2);
  cook(value, 'potato-attack', 1, now + 60000);
  let queue = value.kitchen.buffs.attack;
  assert.deepEqual(queue, [
    { recipeId: 'potato-attack', startsAt: now + 60000, endsAt: now + 660000 },
    { recipeId: 'carrot-attack', startsAt: now + 660000, endsAt: now + 1800000 },
  ]);
  cook(value, 'carrot-attack', 1, now + 120000);
  queue = value.kitchen.buffs.attack;
  assert.equal(queue.length, 2);
  assert.equal(queue[0].endsAt, now + 660000);
  assert.equal(queue[1].endsAt, now + 2400000);
  assert.equal(kitchenBonuses(value.kitchen, now + 659999).attack, 2);
  assert.equal(kitchenBonuses(value.kitchen, now + 660000).attack, 1);
  assert.equal(kitchenBonuses(value.kitchen, now + 2400000).attack, 0);
});

test('rejected batches preserve every campaign field and cannot partially debit stock', () => {
  for (const [recipe, quantity, time] of [
    ['carrot-health', 201, now], ['bad-recipe', 1, now], ['carrot-health', 0, now],
    ['carrot-health', -1, now], ['carrot-health', 1.5, now], ['carrot-health', '2', now],
    ['carrot-health', NaN, now], ['carrot-health', Infinity, now], ['carrot-health', 1, 0],
    ['carrot-health', 1, NaN], ['carrot-health', 1, Number.MAX_SAFE_INTEGER],
  ]) {
    const value = state(), before = structuredClone(value);
    assert.equal(cook(value, recipe, quantity, time).ok, false);
    assert.deepEqual(value, before);
  }
  const value = state(Number.MAX_SAFE_INTEGER); value.kitchen.mealsCooked = Number.MAX_SAFE_INTEGER;
  const before = structuredClone(value);
  assert.equal(cook(value).ok, false); assert.deepEqual(value, before);
  assert.equal(batchDuration(0, Number.MAX_SAFE_INTEGER), null);
});

test('a repeated batch with exhausted ingredients grants no extra XP or food', () => {
  const value = state(10);
  cook(value, 'carrot-health', 10);
  const before = structuredClone(value);
  assert.equal(cook(value, 'carrot-health', 10).ok, false);
  assert.deepEqual(value, before);
});

test('food uses absolute real time, survives reload and expires during offline absence', () => {
  const value = state(); cook(value);
  const snapshot = campaignSnapshot(value), saved = structuredClone(snapshot);
  assert.equal(restoreCampaignState(snapshot, now + 599999).kitchen.buffs.health.length, 1);
  const expired = restoreCampaignState(snapshot, now + 600000);
  assert.deepEqual(expired.kitchen.buffs, createKitchen().buffs);
  assert.equal(expired.kitchen.mealsCooked, 1);
  assert.equal(expired.farm.stock.carrot, 199);
  assert.deepEqual(snapshot, saved);
  expired.kitchen.mealsCooked = 999;
  assert.equal(snapshot.kitchen.mealsCooked, 1);
  assert.deepEqual(resetCampaignState(value, now).kitchen, createKitchen());
});

test('clock rollback cannot add future paid time twice or activate a future serving', () => {
  const value = state(); cook(value);
  const before = structuredClone(value);
  assert.equal(cook(value, 'carrot-health', 1, now - 1).reason, 'clock-moved-back');
  assert.deepEqual(value, before);
  assert.equal(kitchenBonuses(value.kitchen, now - 1).health, 0);
});

test('schema-three migration preserves farm and exact backup bytes, creates an empty kitchen', () => {
  const fixture = campaignSnapshot(state()); delete fixture.kitchen; fixture.saveSchemaVersion = 3;
  const raw = JSON.stringify(fixture), disk = new Map([['campaign', raw]]);
  const storage = createSaveStorage({ key: 'campaign', decode: decodeCampaignSave,
    getStorage: () => ({ getItem: key => disk.get(key) ?? null, setItem: (key, value) => disk.set(key, value) }),
    migrationBackup: { key: 'before-schema-4', needed: needsCampaignSaveMigration } });
  const loaded = storage.load(); assert.equal(loaded.ok, true);
  const restored = restoreCampaignState(loaded.value, now);
  assert.deepEqual(restored.kitchen, createKitchen());
  assert.deepEqual(restored.farm, fixture.farm);
  assert.equal(storage.save(campaignSnapshot(restored)).ok, true);
  assert.equal(disk.get('before-schema-4'), raw);
  assert.equal(JSON.parse(disk.get('campaign')).saveSchemaVersion, SAVE_SCHEMA_VERSION);
});

test('malformed paid kitchen data is rejected at the storage decode boundary', () => {
  const value = state(); cook(value);
  const snapshot = campaignSnapshot(value);
  for (const damage of [
    save => { save.kitchen.mealsCooked = -1; },
    save => { save.kitchen.buffs.health[0].recipeId = 'potato-attack'; },
    save => { save.kitchen.buffs.health[0].endsAt = now; },
    save => { save.kitchen.buffs.health.push({ ...save.kitchen.buffs.health[0] }); },
    save => { save.kitchen.buffs.attack = null; },
  ]) {
    const broken = structuredClone(snapshot); damage(broken);
    assert.throws(() => decodeCampaignSave(broken), /Invalid saved/);
  }
});
