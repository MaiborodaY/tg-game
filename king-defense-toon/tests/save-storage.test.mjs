import assert from 'node:assert/strict';
import test from 'node:test';
import { createSaveStorage } from '../save-storage.ts';
import { UnsupportedSaveVersionError } from '../save-version.ts';

const KEY = 'campaign';

function fixture(initial = null, options = {}) {
  const state = { raw: initial, writes: [], readError: null, writeError: null, accessError: null, accesses: 0 };
  const adapter = createSaveStorage({
    key: KEY,
    getStorage() {
      state.accesses += 1;
      if (state.accessError) throw state.accessError;
      return {
        getItem(key) {
          assert.equal(key, KEY);
          if (state.readError) throw state.readError;
          return state.raw;
        },
        setItem(key, value) {
          assert.equal(key, KEY);
          if (state.writeError) throw state.writeError;
          state.raw = value;
          state.writes.push(value);
        },
      };
    },
    ...options,
  });
  return { state, adapter };
}

test('storage is lazy and writes remain blocked until the initial slot is read', () => {
  const { state, adapter } = fixture('{"gold":17}');
  assert.equal(adapter.status, 'unread');
  assert.equal(state.accesses, 0);
  assert.deepEqual(adapter.save({ gold: 125 }), { ok: false, status: 'unread', blocked: true });
  assert.equal(state.accesses, 0);
  assert.equal(state.raw, '{"gold":17}');
  assert.deepEqual(adapter.load(), { ok: true, status: 'ready', value: { gold: 17 } });
});

test('an empty slot accepts a fresh game and a valid existing slot accepts updates', () => {
  for (const initial of [null, '{"gold":17}']) {
    const { state, adapter } = fixture(initial);
    assert.equal(adapter.load().ok, true);
    assert.deepEqual(adapter.save({ gold: 23 }), { ok: true, status: 'ready' });
    assert.deepEqual(JSON.parse(state.raw), { gold: 23 });
  }
});

test('throwing storage access and read failure are visible and never overwrite an unknown save', () => {
  for (const field of ['accessError', 'readError']) {
    const { state, adapter } = fixture('{"gold":17}');
    state[field] = new Error('Unavailable');
    assert.equal(adapter.load().status, 'read-error');
    assert.deepEqual(adapter.save({ gold: 125 }), { ok: false, status: 'read-error', blocked: true });
    assert.equal(state.raw, '{"gold":17}');
    assert.equal(state.writes.length, 0);
  }
});

test('malformed JSON and non-record saves are protected as corrupt', () => {
  for (const initial of ['{broken', 'null', '[]', '12', '"old"', '']) {
    const { state, adapter } = fixture(initial);
    assert.equal(adapter.load().status, 'corrupt');
    assert.equal(adapter.save({ gold: 125 }).blocked, true);
    assert.equal(adapter.retry({ gold: 125 }).status, 'corrupt');
    assert.equal(state.raw, initial);
    assert.equal(state.writes.length, 0);
  }
});

test('decoder can reject semantic corruption and migrate a valid save', () => {
  const decode = value => {
    if (!Number.isFinite(value.gold) || value.gold < 0) throw new TypeError('Invalid gold');
    return { ...value, version: 2 };
  };
  const invalid = fixture('{"gold":-1}', { decode });
  assert.equal(invalid.adapter.load().status, 'corrupt');
  assert.equal(invalid.adapter.save({ gold: 125 }).blocked, true);
  assert.equal(invalid.state.raw, '{"gold":-1}');
  const valid = fixture('{"gold":17}', { decode });
  assert.deepEqual(valid.adapter.load().value, { gold: 17, version: 2 });
  assert.equal(valid.state.writes.length, 0);
  const rejected = fixture('{"gold":17}', { decode: () => null });
  assert.equal(rejected.adapter.load().status, 'corrupt');
});

test('retry after write failure saves the current snapshot, not an older failed one', () => {
  const { state, adapter } = fixture('{"gold":17}');
  adapter.load();
  state.writeError = new Error('Quota exceeded');
  assert.equal(adapter.save({ gold: 23 }).status, 'write-error');
  assert.equal(state.raw, '{"gold":17}');
  state.writeError = null;
  assert.deepEqual(adapter.retry({ gold: 31 }), { ok: true, status: 'ready' });
  assert.deepEqual(JSON.parse(state.raw), { gold: 31 });
});

test('storage getter can fail after loading and recover on a later save', () => {
  const { state, adapter } = fixture();
  adapter.load();
  state.accessError = new Error('Permission changed');
  assert.equal(adapter.save({ gold: 23 }).status, 'write-error');
  state.accessError = null;
  assert.equal(adapter.retry({ gold: 31 }).ok, true);
  assert.deepEqual(JSON.parse(state.raw), { gold: 31 });
});

test('successful read retry preserves the write gate until restoration reloads the save', () => {
  for (const recovered of [null, '{"gold":17}']) {
    const { state, adapter } = fixture(recovered);
    state.readError = new Error('Unavailable');
    adapter.load();
    state.readError = null;
    assert.deepEqual(adapter.retry({ gold: 125 }), {
      ok: true, status: 'read-error', value: recovered === null ? null : { gold: 17 }, needsRestore: true,
    });
    assert.equal(adapter.save({ gold: 126 }).blocked, true);
    assert.equal(state.raw, recovered);
    assert.equal(state.writes.length, 0);
    const loaded = adapter.load();
    assert.equal(loaded.status, 'ready');
    assert.equal(adapter.save({ gold: 18 }).ok, true);
  }
});

test('repairing a corrupt slot and retrying does not overwrite its recovered contents', () => {
  const { state, adapter } = fixture('{broken');
  adapter.load();
  state.raw = '{"gold":17}';
  assert.deepEqual(adapter.retry({ gold: 125 }), {
    ok: true, status: 'corrupt', value: { gold: 17 }, needsRestore: true,
  });
  assert.equal(adapter.save({ gold: 126 }).blocked, true);
  assert.equal(state.raw, '{"gold":17}');
});

test('serialization errors leave the previous save intact and report write failure', () => {
  const { state, adapter } = fixture('{"gold":17}');
  adapter.load();
  const circular = { gold: 23 };
  circular.self = circular;
  for (const snapshot of [circular, undefined, { gold: 1n }, { toJSON: () => null }]) {
    assert.equal(adapter.save(snapshot).status, 'write-error');
    assert.equal(state.raw, '{"gold":17}');
  }
  assert.equal(adapter.retry({ gold: 31 }).ok, true);
});

test('protected reset requires its own confirmation and does not remove the old slot first', () => {
  const { state, adapter } = fixture('{broken');
  adapter.load();
  assert.equal(adapter.reset({ gold: 125 }).needsConfirmation, true);
  assert.equal(adapter.reset({ gold: 125 }, { confirmation: Symbol('wrong') }).needsConfirmation, true);
  assert.equal(state.raw, '{broken');
  const confirmation = adapter.prepareReset();
  assert.equal(adapter.reset({ gold: 125 }, { confirmation }).ok, true);
  assert.deepEqual(JSON.parse(state.raw), { gold: 125 });
  assert.equal(state.writes.length, 1);
});

test('replaced and consumed confirmation tokens cannot authorize a later protected reset', () => {
  const { state, adapter } = fixture('{broken');
  adapter.load();
  const old = adapter.prepareReset();
  const current = adapter.prepareReset();
  assert.equal(adapter.reset({ gold: 125 }, { confirmation: old }).needsConfirmation, true);
  assert.equal(adapter.reset({ gold: 125 }, { confirmation: current }).ok, true);
  state.raw = '{broken-again';
  adapter.load();
  assert.equal(adapter.reset({ gold: 125 }, { confirmation: current }).needsConfirmation, true);
  assert.equal(state.raw, '{broken-again');
});

test('a confirmed reset that cannot write remains retryable with the new current progress', () => {
  const { state, adapter } = fixture('{broken');
  adapter.load();
  const confirmation = adapter.prepareReset();
  state.writeError = new Error('Quota exceeded');
  assert.equal(adapter.reset({ gold: 125 }, { confirmation }).status, 'write-error');
  assert.equal(state.raw, '{broken');
  state.writeError = null;
  assert.equal(adapter.retry({ gold: 126 }).ok, true);
  assert.deepEqual(JSON.parse(state.raw), { gold: 126 });
});

test('reset of an already loaded save needs no additional adapter confirmation', () => {
  const { state, adapter } = fixture('{"gold":17}');
  adapter.load();
  assert.equal(adapter.prepareReset(), null);
  assert.equal(adapter.reset({ gold: 125 }).ok, true);
  assert.deepEqual(JSON.parse(state.raw), { gold: 125 });
});

test('retry before the first load neither serializes fresh progress nor opens the write gate', () => {
  for (const initial of [null, '{"gold":17}']) {
    const { state, adapter } = fixture(initial);
    const fresh = { toJSON() { assert.fail('unrestored progress was serialized'); } };
    assert.deepEqual(adapter.retry(fresh), {
      ok: true, status: 'unread', value: initial === null ? null : { gold: 17 }, needsRestore: true,
    });
    assert.deepEqual(adapter.save(fresh), { ok: false, status: 'unread', blocked: true });
    assert.equal(state.raw, initial);
    assert.deepEqual(state.writes, []);
    assert.equal(adapter.load().status, 'ready');
  }
});

test('reset confirmations are local to a slot instance and are invalidated by a new load', () => {
  const first = fixture('{broken'), second = fixture('{broken');
  first.adapter.load();
  second.adapter.load();
  const firstToken = first.adapter.prepareReset();
  const secondToken = second.adapter.prepareReset();
  assert.equal(second.adapter.reset({ gold: 125 }, { confirmation: firstToken }).needsConfirmation, true);
  assert.equal(first.adapter.load().status, 'corrupt');
  assert.equal(first.adapter.reset({ gold: 125 }, { confirmation: firstToken }).needsConfirmation, true);
  assert.deepEqual(first.state.writes, []);
  assert.equal(second.adapter.reset({ gold: 125 }, { confirmation: secondToken }).ok, true);
  assert.equal(first.adapter.reset({ gold: 125 }, { confirmation: first.adapter.prepareReset() }).ok, true);
});

test('missing saves bypass decoding and decoder failures preserve the exact thrown value', () => {
  const absent = fixture(null, { decode() { assert.fail('absent slots have no JSON to decode'); } });
  assert.deepEqual(absent.adapter.load(), { ok: true, status: 'ready', value: null });
  for (const error of ['invalid legacy version', null, 17, { field: 'gold' }]) {
    const { state, adapter } = fixture('{"gold":17}', { decode() { throw error; } });
    const failed = adapter.load();
    assert.equal(failed.status, 'corrupt');
    assert.equal(failed.error, error);
    assert.equal(adapter.save({ gold: 125 }).blocked, true);
    assert.equal(state.raw, '{"gold":17}');
    assert.deepEqual(state.writes, []);
  }
});

test('non-record snapshots and custom JSON primitives cannot replace a readable save', () => {
  const { state, adapter } = fixture('{"gold":17}');
  adapter.load();
  for (const snapshot of [null, [], 23, 'progress', () => ({}), new Date(0),
    { toJSON: () => [] }, { toJSON: () => 1 }, { toJSON: () => undefined }]) {
    const failed = adapter.save(snapshot);
    assert.equal(failed.status, 'write-error');
    assert.ok(failed.error instanceof TypeError);
    assert.equal(state.raw, '{"gold":17}');
    assert.deepEqual(state.writes, []);
  }
  assert.deepEqual(adapter.retry({ gold: 31 }), { ok: true, status: 'ready' });
  assert.equal(state.raw, '{"gold":31}');
});

test('future formats are protected separately from corruption and cannot authorize a reset', () => {
  for (const versionKind of ['schema', 'campaign']) {
    const error = new UnsupportedSaveVersionError(versionKind, 99, 1);
    const { state, adapter } = fixture('{"version":99,"gold":17}', { decode() { throw error; } });
    assert.deepEqual(adapter.load(), { ok: false, status: 'unsupported', error });
    assert.equal(adapter.prepareReset(), null);
    for (const result of [adapter.save({ gold: 125 }), adapter.reset({ gold: 125 }),
      adapter.reset({ gold: 125 }, { confirmation: Symbol('confirmed elsewhere') })]) {
      assert.deepEqual(result, { ok: false, status: 'unsupported', blocked: true });
    }
    assert.deepEqual(adapter.retry({ gold: 125 }), { ok: false, status: 'unsupported', error });
    assert.equal(state.raw, '{"version":99,"gold":17}');
    assert.deepEqual(state.writes, []);
  }
});

function migrationFixture(initial, existingBackup = null) {
  const backupKey = `${KEY}:schema-1-backup`;
  const state = { values: new Map([[KEY, initial], [backupKey, existingBackup]]), writes: [],
    backupError: null, duringBackup: null, ownsSession: true };
  const adapter = createSaveStorage({
    key: KEY,
    canWrite: () => state.ownsSession,
    migrationBackup: { key: backupKey, needed: value => value.version !== 1 },
    decode: value => ({ ...value, version: 1 }),
    getStorage: () => ({
      getItem: key => state.values.get(key) ?? null,
      setItem(key, value) {
        if (key === backupKey && state.backupError) throw state.backupError;
        state.values.set(key, value);
        state.writes.push({ key, value });
        if (key === backupKey) state.duringBackup?.();
      },
    }),
  });
  return { state, adapter, backupKey };
}

test('migration backs up exact original bytes once before writing normalized progress', () => {
  const original = ' { "gold" : 17, "unknown" : { "keep": true } }\n';
  const { state, adapter, backupKey } = migrationFixture(original);
  assert.deepEqual(adapter.load().value, { gold: 17, unknown: { keep: true }, version: 1 });
  assert.deepEqual(state.writes, [], 'reading and decoding must not change storage');
  assert.equal(adapter.save({ gold: 23, version: 1 }).ok, true);
  assert.deepEqual(state.writes, [
    { key: backupKey, value: original }, { key: KEY, value: '{"gold":23,"version":1}' },
  ]);
  assert.equal(adapter.save({ gold: 31, version: 1 }).ok, true);
  assert.equal(state.values.get(backupKey), original);
  assert.equal(state.writes.filter(write => write.key === backupKey).length, 1);
  assert.equal(adapter.load().ok, true);
  assert.equal(adapter.save({ gold: 37, version: 1 }).ok, true);
  assert.equal(state.values.get(backupKey), original);
  assert.equal(state.writes.filter(write => write.key === backupKey).length, 1);
});

test('existing migration backup is never overwritten by a different legacy session', () => {
  const older = '{"gold":11,"oldest":true}';
  const { state, adapter, backupKey } = migrationFixture('{"gold":17}', older);
  adapter.load();
  assert.equal(adapter.save({ gold: 23, version: 1 }).ok, true);
  assert.equal(state.values.get(backupKey), older);
  assert.deepEqual(state.writes, [{ key: KEY, value: '{"gold":23,"version":1}' }]);
});

test('backup failure leaves original campaign bytes intact and retry backs up before the latest snapshot', () => {
  const original = '{ "gold": 17 }\n';
  const { state, adapter, backupKey } = migrationFixture(original);
  adapter.load();
  state.backupError = new Error('Backup quota exceeded');
  assert.deepEqual(adapter.save({ gold: 23, version: 1 }), {
    ok: false, status: 'write-error', error: state.backupError,
  });
  assert.equal(state.values.get(KEY), original);
  assert.equal(state.values.get(backupKey), null);
  assert.deepEqual(state.writes, []);
  state.backupError = null;
  assert.equal(adapter.retry({ gold: 31, version: 1 }).ok, true);
  assert.deepEqual(state.writes, [
    { key: backupKey, value: original }, { key: KEY, value: '{"gold":31,"version":1}' },
  ]);
});

test('current schema and empty slots never request a legacy backup', () => {
  for (const initial of [null, '{"gold":17,"version":1}']) {
    const { state, adapter, backupKey } = migrationFixture(initial);
    assert.equal(adapter.load().ok, true);
    assert.equal(adapter.save({ gold: 23, version: 1 }).ok, true);
    assert.equal(state.values.get(backupKey), null);
    assert.equal(state.writes.filter(write => write.key === backupKey).length, 0);
  }
  for (const key of [KEY, '']) {
    assert.throws(() => createSaveStorage({ key: KEY, migrationBackup: { key, needed: () => true } }),
      /separate storage key/);
  }
});

test('missing session ownership blocks reading, writing and reset before accessing storage', () => {
  for (const canWrite of [() => false, () => { throw new Error('Lock unavailable'); }]) {
    const { state, adapter } = fixture('{"gold":17}', { canWrite });
    assert.equal(adapter.load().status, 'session-blocked');
    assert.equal(adapter.save({ gold: 125 }).status, 'session-blocked');
    assert.equal(adapter.retry({ gold: 125 }).status, 'session-blocked');
    assert.equal(adapter.prepareReset(), null);
    assert.equal(adapter.reset({ gold: 125 }, { confirmation: Symbol('reset') }).status, 'session-blocked');
    assert.equal(adapter.checkForUpdates().status, 'session-blocked');
    assert.equal(state.accesses, 0);
    assert.equal(state.raw, '{"gold":17}');
    assert.deepEqual(state.writes, []);
  }
});

test('losing ownership after load protects stale state even if ownership later returns', () => {
  let ownsSession = true;
  const { state, adapter } = fixture('{"gold":17}', { canWrite: () => ownsSession });
  adapter.load();
  ownsSession = false;
  assert.equal(adapter.save({ gold: 23 }).status, 'session-blocked');
  assert.equal(adapter.load().status, 'session-blocked');
  assert.equal(adapter.reset({ gold: 125 }).status, 'session-blocked');
  ownsSession = true;
  assert.equal(adapter.save({ gold: 31 }).blocked, true);
  assert.deepEqual(adapter.retry({ gold: 31 }), {
    ok: true, status: 'session-blocked', value: { gold: 17 }, needsRestore: true,
  });
  assert.equal(adapter.reset({ gold: 125 }).blocked, true);
  assert.equal(state.raw, '{"gold":17}');
  assert.deepEqual(state.writes, []);
  assert.equal(adapter.load().ok, true);
  assert.equal(adapter.save({ gold: 18 }).ok, true);
});

test('external changes and removals block stale writes, reset and update checks', () => {
  for (const operation of ['save', 'reset', 'checkForUpdates']) {
    for (const external of ['{"gold":99}', null]) {
      const { state, adapter } = fixture('{"gold":17}');
      adapter.load();
      state.raw = external;
      assert.equal(adapter[operation]({ gold: 23 }).status, 'conflict');
      assert.equal(adapter.prepareReset(), null);
      assert.equal(adapter.reset({ gold: 125 }).blocked, true);
      assert.equal(adapter.save({ gold: 31 }).blocked, true);
      assert.equal(state.raw, external);
      assert.deepEqual(state.writes, []);
      assert.deepEqual(adapter.retry({ gold: 31 }), {
        ok: true, status: 'conflict', value: external === null ? null : { gold: 99 }, needsRestore: true,
      });
      assert.equal(adapter.save({ gold: 31 }).blocked, true);
    }
  }
});

test('a newly created external slot also conflicts with a loaded empty baseline', () => {
  const { state, adapter } = fixture();
  adapter.load();
  state.raw = '{"gold":99}';
  assert.equal(adapter.save({ gold: 125 }).status, 'conflict');
  assert.equal(state.raw, '{"gold":99}');
  assert.deepEqual(state.writes, []);
});

test('restoration failures close the write gate and retry requires restoration before saving', () => {
  const { state, adapter } = fixture('{"gold":17}');
  assert.equal(adapter.load().ok, true);
  const error = new Error('Failed to restore roster');
  assert.deepEqual(adapter.protectRestoreFailure(error), { ok: false, status: 'corrupt', error });
  assert.equal(adapter.save({ gold: 125 }).blocked, true);
  assert.deepEqual(adapter.retry({ gold: 125 }), {
    ok: true, status: 'corrupt', value: { gold: 17 }, needsRestore: true,
  });
  assert.equal(adapter.save({ gold: 126 }).blocked, true);
  assert.equal(state.raw, '{"gold":17}');
  assert.deepEqual(state.writes, []);
  assert.equal(adapter.load().ok, true);
  assert.equal(adapter.save({ gold: 18 }).ok, true);
});

test('a save changed during serialization is detected again before committing the snapshot', () => {
  const { state, adapter } = fixture('{"gold":17}');
  adapter.load();
  const result = adapter.save({ toJSON() { state.raw = '{"gold":99}'; return { gold: 23 }; } });
  assert.equal(result.status, 'conflict');
  assert.equal(state.raw, '{"gold":99}');
  assert.deepEqual(state.writes, []);
});

test('a session lost during serialization cannot write or reset the save', () => {
  let ownsSession = true;
  const { state, adapter } = fixture('{"gold":17}', { canWrite: () => ownsSession });
  adapter.load();
  const result = adapter.save({ toJSON() { ownsSession = false; return { gold: 23 }; } });
  assert.equal(result.status, 'session-blocked');
  assert.equal(state.raw, '{"gold":17}');
  assert.deepEqual(state.writes, []);
  assert.equal(adapter.reset({ gold: 125 }).status, 'session-blocked');
});

test('a save changed while the backup is written cannot be overwritten by migrated progress', () => {
  const original = '{ "gold": 17 }';
  const { state, adapter, backupKey } = migrationFixture(original);
  adapter.load();
  state.duringBackup = () => state.values.set(KEY, '{"gold":99}');
  assert.equal(adapter.save({ gold: 23, version: 1 }).status, 'conflict');
  assert.equal(state.values.get(KEY), '{"gold":99}');
  assert.equal(state.values.get(backupKey), original);
  assert.deepEqual(state.writes, [{ key: backupKey, value: original }]);
  assert.equal(adapter.reset({ gold: 125, version: 1 }).blocked, true);
});

test('confirmation of an older damaged save cannot reset a slot that changed afterward', () => {
  for (const external of ['{"gold":99}', '{different-damage', null]) {
    const { state, adapter } = fixture('{broken');
    adapter.load();
    const confirmation = adapter.prepareReset();
    assert.equal(typeof confirmation, 'symbol');
    state.raw = external;
    assert.equal(adapter.reset({ gold: 125 }, { confirmation }).status, 'conflict');
    assert.equal(adapter.reset({ gold: 125 }, { confirmation }).blocked, true);
    assert.equal(adapter.prepareReset(), null);
    assert.equal(state.raw, external);
    assert.deepEqual(state.writes, []);
  }
});

test('update-read failure protects progress until a successful restore rather than allowing blind writes', () => {
  const { state, adapter } = fixture('{"gold":17}');
  adapter.load();
  state.readError = new Error('Storage permission changed');
  assert.equal(adapter.checkForUpdates().status, 'read-error');
  state.readError = null;
  assert.equal(adapter.save({ gold: 23 }).blocked, true);
  assert.equal(adapter.retry({ gold: 23 }).needsRestore, true);
  assert.equal(adapter.save({ gold: 23 }).blocked, true);
  assert.equal(state.raw, '{"gold":17}');
  assert.deepEqual(state.writes, []);
});

test('reset approved during a read failure cannot overwrite newly accessible valid or future progress', () => {
  for (const [raw, expectedStatus] of [['{"gold":99}', 'conflict'], ['{"gold":99,"version":99}', 'unsupported']]) {
    const decode = value => {
      if (value.version === 99) throw new UnsupportedSaveVersionError('schema', 99, 1);
      return value;
    };
    const { state, adapter } = fixture(raw, { decode });
    state.readError = new Error('Temporarily unreadable');
    assert.equal(adapter.load().status, 'read-error');
    const confirmation = adapter.prepareReset();
    state.readError = null;
    assert.equal(adapter.reset({ gold: 125 }, { confirmation }).status, expectedStatus);
    assert.equal(state.raw, raw);
    assert.deepEqual(state.writes, []);
    assert.equal(adapter.save({ gold: 126 }).blocked, true);
    assert.equal(adapter.reset({ gold: 125 }, { confirmation }).blocked, true);
    assert.equal(adapter.prepareReset(), null);
    if (expectedStatus === 'conflict') {
      assert.deepEqual(adapter.retry({ gold: 125 }), {
        ok: true, status: 'conflict', value: { gold: 99 }, needsRestore: true,
      });
      assert.equal(adapter.save({ gold: 126 }).blocked, true);
    }
  }
});

test('losing session ownership during serialization also prevents the legacy backup write', () => {
  const original = '{ "gold": 17 }';
  const { state, adapter, backupKey } = migrationFixture(original);
  adapter.load();
  const result = adapter.save({ toJSON() { state.ownsSession = false; return { gold: 23, version: 1 }; } });
  assert.equal(result.status, 'session-blocked');
  assert.equal(state.values.get(KEY), original);
  assert.equal(state.values.get(backupKey), null);
  assert.deepEqual(state.writes, []);
});

test('a confirmed reset cannot blindly overwrite a save that remains unreadable', () => {
  const { state, adapter } = fixture('{"gold":99}');
  state.readError = new Error('Still unreadable');
  assert.equal(adapter.load().status, 'read-error');
  const confirmation = adapter.prepareReset();
  assert.equal(adapter.reset({ gold: 125 }, { confirmation }).status, 'read-error');
  assert.equal(adapter.save({ gold: 126 }).blocked, true);
  assert.equal(state.raw, '{"gold":99}');
  assert.deepEqual(state.writes, []);
});

test('damage discovered after a read failure requires fresh confirmation tied to those bytes', () => {
  const { state, adapter } = fixture('{newly-readable-damage');
  state.readError = new Error('Temporarily unreadable');
  assert.equal(adapter.load().status, 'read-error');
  const unknownSaveToken = adapter.prepareReset();
  state.readError = null;
  assert.equal(adapter.reset({ gold: 125 }, { confirmation: unknownSaveToken }).status, 'corrupt');
  assert.equal(state.raw, '{newly-readable-damage');
  assert.deepEqual(state.writes, []);
  assert.equal(adapter.reset({ gold: 125 }, { confirmation: unknownSaveToken }).needsConfirmation, true);
  const currentToken = adapter.prepareReset();
  assert.notEqual(currentToken, unknownSaveToken);
  assert.equal(adapter.reset({ gold: 125 }, { confirmation: currentToken }).ok, true);
  assert.deepEqual(state.writes, ['{"gold":125}']);
});
