import assert from 'node:assert/strict';
import test from 'node:test';
import { createSaveSession } from '../save-session.ts';

const flush = () => new Promise(resolve => setImmediate(resolve));

// Schedule callbacks separately from requests, as browsers do. The resource
// remains held until the callback's promise settles, not just until it returns.
function lockScheduler() {
  const queued = [];
  const held = new Map();
  const calls = [];
  const locks = {
    request(name, options, callback) {
      calls.push({ name, options });
      return new Promise((resolve, reject) => {
        queued.push(() => {
          const token = {};
          const granted = !held.has(name);
          if (granted) held.set(name, token);
          Promise.resolve().then(() => callback(granted ? { name, mode: 'exclusive' } : null))
            .then(resolve, reject).finally(() => {
              if (held.get(name) === token) held.delete(name);
            });
        });
      });
    },
  };
  return {
    locks, calls, held,
    run() {
      assert.ok(queued.length, 'a lock request is queued');
      queued.shift()();
    },
    get pending() { return queued.length; },
  };
}

function session(scheduler, key = 'campaign') {
  return createSaveSession({ key, getLocks: () => scheduler.locks });
}

test('save session is lazy, denies writes before ownership and validates the slot name', () => {
  const scheduler = lockScheduler();
  const guard = session(scheduler);
  assert.equal(guard.status, 'idle');
  assert.equal(guard.canWrite, false);
  assert.equal(guard.error, null);
  assert.equal(scheduler.calls.length, 0);
  for (const key of [null, undefined, '', 7, {}]) {
    assert.throws(() => createSaveSession({ key }), TypeError);
  }
  assert.throws(() => createSaveSession(), TypeError);
});

test('concurrent writers for the same slot cannot both acquire; the loser never steals or waits', async () => {
  const scheduler = lockScheduler();
  const first = session(scheduler), second = session(scheduler);
  const firstResult = first.acquire(), secondResult = second.acquire();
  assert.equal(first.canWrite, false);
  scheduler.run();
  scheduler.run();
  assert.equal(await firstResult, true);
  assert.equal(await secondResult, false);
  assert.equal(first.status, 'owned');
  assert.equal(first.canWrite, true);
  assert.equal(second.status, 'busy');
  assert.equal(second.canWrite, false);
  assert.equal(second.error, null);
  assert.deepEqual(scheduler.calls, [
    { name: 'brotd-save:campaign', options: { mode: 'exclusive', ifAvailable: true } },
    { name: 'brotd-save:campaign', options: { mode: 'exclusive', ifAvailable: true } },
  ]);
  await flush();
  assert.equal(scheduler.held.size, 1);
  first.release();
  await flush();
  assert.equal(scheduler.held.size, 0);
  assert.equal(second.canWrite, false, 'a busy session must explicitly retry');
});

test('pending and owned acquisitions are idempotent; a released slot can be acquired by another session', async () => {
  const scheduler = lockScheduler();
  const first = session(scheduler), second = session(scheduler);
  const pending = first.acquire();
  assert.equal(first.acquire(), pending);
  assert.equal(scheduler.pending, 1);
  scheduler.run();
  assert.equal(await pending, true);
  assert.equal(first.acquire(), pending);
  assert.equal(scheduler.calls.length, 1);
  first.release();
  assert.equal(first.canWrite, false);
  assert.equal(first.status, 'idle');
  first.release();
  await flush();
  const next = second.acquire();
  scheduler.run();
  assert.equal(await next, true);
  assert.equal(second.canWrite, true);
  second.release();
  await flush();
});

test('different save slots can have independent owners', async () => {
  const scheduler = lockScheduler();
  const first = session(scheduler, 'campaign'), second = session(scheduler, 'preview');
  const a = first.acquire(), b = second.acquire();
  scheduler.run();
  scheduler.run();
  assert.deepEqual(await Promise.all([a, b]), [true, true]);
  assert.equal(scheduler.held.size, 2);
  first.release();
  second.release();
  await flush();
  assert.equal(scheduler.held.size, 0);
});

test('release while acquisition is pending settles it false and a late grant never opens writes', async () => {
  const scheduler = lockScheduler();
  const guard = session(scheduler);
  const pending = guard.acquire();
  guard.release();
  assert.equal(await pending, false);
  assert.equal(guard.status, 'idle');
  scheduler.run();
  await flush();
  assert.equal(guard.canWrite, false);
  assert.equal(guard.status, 'idle');
  assert.equal(scheduler.held.size, 0);
  const next = guard.acquire();
  scheduler.run();
  assert.equal(await next, true);
  guard.release();
  await flush();
});

test('a canceled callback or rejection cannot change a newer acquisition', async () => {
  for (const completion of ['grant', 'reject']) {
    const scheduler = lockScheduler();
    let rejectOld;
    const getLocks = () => completion === 'reject' && scheduler.calls.length === 0
      ? { request() {
        scheduler.calls.push({});
        return new Promise((_, reject) => { rejectOld = reject; });
      } }
      : scheduler.locks;
    const guard = createSaveSession({ key: 'campaign', getLocks });
    const old = guard.acquire();
    guard.release();
    assert.equal(await old, false);
    const next = guard.acquire();
    if (completion === 'grant') {
      scheduler.run();
      await flush();
    } else {
      rejectOld(new Error('old request failed'));
      await flush();
    }
    assert.equal(guard.status, 'idle');
    assert.equal(guard.error, null);
    scheduler.run();
    assert.equal(await next, true);
    guard.release();
    await flush();
  }
});

test('missing Web Locks never silently enables writes, and availability can recover on retry', async () => {
  const scheduler = lockScheduler();
  let available = false;
  const guard = createSaveSession({ key: 'campaign', getLocks: () => available ? scheduler.locks : undefined });
  assert.equal(await guard.acquire(), false);
  assert.equal(guard.status, 'unavailable');
  assert.equal(guard.canWrite, false);
  assert.match(guard.error.message, /Web Locks/);
  available = true;
  const next = guard.acquire();
  assert.equal(guard.error, null);
  scheduler.run();
  assert.equal(await next, true);
  guard.release();
  await flush();
});

test('getter failures, synchronous request failures and rejected requests expose the exact cause', async () => {
  for (const cause of [new Error('denied'), 'denied', null, { reason: 'denied' }]) {
    for (const getLocks of [
      () => { throw cause; },
      () => ({ request() { throw cause; } }),
      () => ({ request() { return Promise.reject(cause); } }),
    ]) {
      const guard = createSaveSession({ key: 'campaign', getLocks });
      assert.equal(await guard.acquire(), false);
      assert.equal(guard.status, 'unavailable');
      assert.equal(guard.canWrite, false);
      assert.equal(guard.error, cause);
      guard.release();
      assert.equal(guard.status, 'idle');
      assert.equal(guard.error, null);
    }
  }
});

test('an API that completes without granting a lock fails closed', async () => {
  const guard = createSaveSession({ key: 'campaign', getLocks: () => ({ request: () => Promise.resolve() }) });
  assert.equal(await guard.acquire(), false);
  assert.equal(guard.status, 'unavailable');
  assert.equal(guard.canWrite, false);
  assert.ok(guard.error instanceof Error);
});

test('unexpected loss of an owned lock immediately revokes write permission', async () => {
  let loseLock;
  let held;
  const lost = new Error('lock was revoked');
  const guard = createSaveSession({ key: 'campaign', getLocks: () => ({
    request(name, options, callback) {
      held = callback({ name, mode: options.mode });
      return new Promise((_, reject) => { loseLock = reject; });
    },
  }) });
  assert.equal(await guard.acquire(), true);
  assert.equal(guard.canWrite, true);
  loseLock(lost);
  await flush();
  assert.equal(guard.canWrite, false);
  assert.equal(guard.status, 'unavailable');
  assert.equal(guard.error, lost);
  await held;
});
