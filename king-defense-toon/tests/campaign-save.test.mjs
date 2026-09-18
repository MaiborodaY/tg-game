import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeCampaignSave } from '../campaign-save.ts';
import { createSaveStorage } from '../save-storage.ts';
import { CAMPAIGN_VERSION } from '../waves.ts';

test('campaign decode retains ordinary legacy coercion and unrelated saved fields', () => {
  for (const value of [undefined, null, true, false, '', '12', 'invalid', [7], {}, -4, 500]) {
    const saved = { campaignVersion: CAMPAIGN_VERSION, gold: 100, clearedWaves: value,
      hero: { xp: 60 }, offlineRewards: { gold: 4 }, futureField: 'retained' };
    const decoded = decodeCampaignSave(saved);
    assert.equal(decoded.clearedWaves, Number(value));
    assert.deepEqual(decoded.hero, saved.hero);
    assert.deepEqual(decoded.offlineRewards, saved.offlineRewards);
    assert.equal(decoded.futureField, 'retained');
    assert.equal(saved.clearedWaves, value);
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
