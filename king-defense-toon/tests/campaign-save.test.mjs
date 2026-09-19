import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeCampaignSave, needsCampaignSaveMigration, SAVE_SCHEMA_VERSION } from '../campaign-save.ts';
import { createSaveStorage } from '../save-storage.ts';
import { UnsupportedSaveVersionError } from '../save-version.ts';
import { CAMPAIGN_VERSION } from '../waves.ts';

test('campaign decode retains ordinary legacy coercion and unrelated saved fields', () => {
  for (const value of [undefined, null, true, false, '', '12', 'invalid', [7], {}, -4, 500]) {
    const saved = { campaignVersion: CAMPAIGN_VERSION, gold: 100, clearedWaves: value,
      hero: { xp: 60 }, offlineRewards: { gold: 4 }, futureField: 'retained' };
    const decoded = decodeCampaignSave(saved);
    assert.equal(decoded.saveSchemaVersion, SAVE_SCHEMA_VERSION);
    assert.equal(decoded.clearedWaves, Number(value));
    assert.deepEqual(decoded.hero, saved.hero);
    assert.deepEqual(decoded.offlineRewards, saved.offlineRewards);
    assert.equal(decoded.futureField, 'retained');
    assert.equal(saved.clearedWaves, value);
  }
});

test('current schema decode retains unknown fields without mutating its source', () => {
  const saved = Object.freeze({ saveSchemaVersion: SAVE_SCHEMA_VERSION, nextUnitId: 1, campaignVersion: CAMPAIGN_VERSION,
    gold: 125, clearedWaves: 205, progression: Object.freeze({ firstClears: Object.freeze([1, 201]) }),
    optionalFeature: Object.freeze({ retained: true }) });
  const decoded = decodeCampaignSave(saved);
  assert.notStrictEqual(decoded, saved);
  assert.deepEqual(decoded, saved);
  assert.strictEqual(decoded.optionalFeature, saved.optionalFeature);
  assert.equal(needsCampaignSaveMigration(saved), false);
});

test('unversioned and earlier schema saves migrate campaign numbering exactly once', () => {
  for (const schemaFields of [{}, { saveSchemaVersion: 0 }, { saveSchemaVersion: 1 }]) {
    for (const campaignFields of [{}, { campaignVersion: 1 }, { campaignVersion: 2 }, { campaignVersion: '2' }]) {
      const saved = { ...schemaFields, ...campaignFields, gold: 125, clearedWaves: 12,
        progression: { firstClears: [1, 10, 11, 12] }, custom: { retain: true } };
      const before = structuredClone(saved);
      assert.equal(needsCampaignSaveMigration(saved), true);
      const decoded = decodeCampaignSave(saved);
      assert.equal(decoded.saveSchemaVersion, SAVE_SCHEMA_VERSION);
      assert.equal(decoded.campaignVersion, CAMPAIGN_VERSION);
      assert.equal(decoded.clearedWaves, 202);
      assert.deepEqual(decoded.progression.firstClears, [1, 10, 201, 202]);
      assert.deepEqual(decoded.custom, saved.custom);
      assert.deepEqual(saved, before);
      assert.deepEqual(decodeCampaignSave(decoded), decoded, 'loading the migrated save cannot remap rewards twice');
      assert.equal(needsCampaignSaveMigration(decoded), false);
    }
  }
});

test('new schema with old campaign numbering retains the existing numbering migration', () => {
  const decoded = decodeCampaignSave({ saveSchemaVersion: SAVE_SCHEMA_VERSION, nextUnitId: 1, campaignVersion: 2,
    gold: 125, clearedWaves: 10, progression: { firstClears: [10] } });
  assert.equal(decoded.saveSchemaVersion, SAVE_SCHEMA_VERSION);
  assert.equal(decoded.campaignVersion, CAMPAIGN_VERSION);
  assert.equal(decoded.clearedWaves, 200);
  assert.deepEqual(decoded.progression.firstClears, [10]);
});

test('persistent-ID schemas require the consumed-ID cursor while legacy decode supplies one', () => {
  for (const nextUnitId of [undefined, null, 0, -1, 1.5, '10', {}, [], NaN, Infinity]) {
    assert.throws(() => decodeCampaignSave({ saveSchemaVersion: SAVE_SCHEMA_VERSION, gold: 125, nextUnitId }), /fighter ID cursor/);
  }
  const legacy = { saveSchemaVersion: 1, campaignVersion: CAMPAIGN_VERSION, gold: 125,
    units: [{ id: 8, type: 'archer', col: 2, row: 0 }], reserve: [] };
  const decoded = decodeCampaignSave(legacy);
  assert.equal(decoded.nextUnitId, 9);
  assert.deepEqual(decodeCampaignSave(decoded), decoded);
  assert.equal(decodeCampaignSave({ ...decoded, nextUnitId: 100 }).nextUnitId, 100);
  assert.equal(decodeCampaignSave({ ...decoded, nextUnitId: 1 }).nextUnitId, 9);
});

test('future schema and campaign numbering are rejected before restoring any gameplay fields', () => {
  for (const [fields, versionKind, foundVersion, supportedVersion] of [
    [{ saveSchemaVersion: SAVE_SCHEMA_VERSION + 1 }, 'schema', SAVE_SCHEMA_VERSION + 1, SAVE_SCHEMA_VERSION],
    [{ campaignVersion: CAMPAIGN_VERSION + 1 }, 'campaign', CAMPAIGN_VERSION + 1, CAMPAIGN_VERSION],
    [{ campaignVersion: String(CAMPAIGN_VERSION + 1) }, 'campaign', CAMPAIGN_VERSION + 1, CAMPAIGN_VERSION],
    [{ campaignVersion: [CAMPAIGN_VERSION + 1] }, 'campaign', CAMPAIGN_VERSION + 1, CAMPAIGN_VERSION],
  ]) {
    const saved = { saveSchemaVersion: SAVE_SCHEMA_VERSION, campaignVersion: CAMPAIGN_VERSION,
      gold: 'invalid', clearedWaves: { toString: null }, future: { retained: true }, ...fields };
    const before = structuredClone(saved);
    assert.throws(() => decodeCampaignSave(saved), error => {
      assert.ok(error instanceof UnsupportedSaveVersionError);
      assert.equal(error.versionKind, versionKind);
      assert.equal(error.foundVersion, foundVersion);
      assert.equal(error.supportedVersion, supportedVersion);
      return true;
    });
    assert.deepEqual(saved, before);
  }
});

test('explicit schema versions never use permissive legacy numeric coercion', () => {
  for (const saveSchemaVersion of [undefined, null, true, false, '', '0', '1', '2', [], [1], {}, -1, 0.5,
    Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    const saved = { saveSchemaVersion, campaignVersion: CAMPAIGN_VERSION, gold: 125, clearedWaves: 1 };
    assert.throws(() => decodeCampaignSave(saved), error => {
      assert.ok(error instanceof Error);
      assert.equal(error instanceof UnsupportedSaveVersionError, false);
      assert.match(error.message, /schema version/);
      return true;
    });
    assert.equal(needsCampaignSaveMigration(saved), false);
  }
  for (const value of [null, undefined, [], 1, '1', false]) {
    assert.throws(() => decodeCampaignSave(value), /Invalid saved campaign/);
    assert.equal(needsCampaignSaveMigration(value), false);
  }
});

test('current legacy campaign version coercion remains accepted independently of schema version', () => {
  for (const campaignVersion of [CAMPAIGN_VERSION, String(CAMPAIGN_VERSION), [CAMPAIGN_VERSION]]) {
    const decoded = decodeCampaignSave({ campaignVersion, gold: 125, clearedWaves: '205' });
    assert.deepEqual(decoded.campaignVersion, campaignVersion);
    assert.equal(decoded.clearedWaves, 205);
    assert.equal(decoded.saveSchemaVersion, SAVE_SCHEMA_VERSION);
  }
});

test('unsupported versions protect the exact save bytes from regular writes and retries', () => {
  for (const fields of [{ saveSchemaVersion: SAVE_SCHEMA_VERSION + 1 }, { campaignVersion: CAMPAIGN_VERSION + 1 }]) {
    const raw = JSON.stringify({ campaignVersion: CAMPAIGN_VERSION, gold: 125, clearedWaves: 1, ...fields });
    let stored = raw, writes = 0;
    const storage = createSaveStorage({ key: 'campaign', decode: decodeCampaignSave,
      getStorage: () => ({ getItem: () => stored, setItem(_key, value) { writes++; stored = value; } }) });
    const loaded = storage.load();
    assert.equal(loaded.ok, false);
    assert.ok(loaded.error instanceof UnsupportedSaveVersionError);
    assert.equal(storage.save({ gold: 150 }).blocked, true);
    const retried = storage.retry({ gold: 150 });
    assert.equal(retried.ok, false);
    assert.ok(retried.error instanceof UnsupportedSaveVersionError);
    assert.equal(stored, raw);
    assert.equal(writes, 0);
  }
});

test('invalid campaign data stays protected before later game saves can replace it', () => {
  for (const fields of [{ clearedWaves: { toString: null } }, { gold: '100' }, { gold: -1 }]) {
    const raw = JSON.stringify({ campaignVersion: CAMPAIGN_VERSION, gold: 100, clearedWaves: 1, ...fields });
    let stored = raw, writes = 0;
    const storage = createSaveStorage({ key: 'campaign', decode: decodeCampaignSave,
      getStorage: () => ({ getItem: () => stored, setItem(_key, value) { writes++; stored = value; } }) });
    const loaded = storage.load();
    assert.equal(loaded.ok, false);
    assert.equal(storage.status, 'corrupt');
    assert.equal(storage.save({ gold: 125 }).blocked, true);
    assert.equal(stored, raw);
    assert.equal(writes, 0);
  }
});

test('schema two still requires its persistent identity cursor during farm migration', () => {
  assert.throws(() => decodeCampaignSave({ saveSchemaVersion: 2, gold: 50 }), /fighter ID cursor/);
  assert.equal(needsCampaignSaveMigration({ saveSchemaVersion: 2 }), true);
  const decoded = decodeCampaignSave({ saveSchemaVersion: 2, nextUnitId: 100, campaignVersion: CAMPAIGN_VERSION, gold: 50 });
  assert.equal(decoded.saveSchemaVersion, SAVE_SCHEMA_VERSION);
  assert.equal(decoded.nextUnitId, 100);
});
