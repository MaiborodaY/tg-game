import assert from 'node:assert/strict';
import test from 'node:test';
import { createSaveStorage } from '../save-storage.mjs';

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
