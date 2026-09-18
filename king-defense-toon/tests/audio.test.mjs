import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattleAudio } from '../audio.mjs';

const MUTED_KEY = 'brotd-infinity:sound-muted:v1';

function globals(t, values) {
  const descriptors = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  t.after(() => {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
}

test('dormant bow audio preserves the legacy preference without creating contexts, fetching or writing storage', async t => {
  const calls = { contexts: 0, fetches: 0, reads: [], writes: [] };
  let saved = '1';
  globals(t, {
    AudioContext: class { constructor() { calls.contexts += 1; throw new Error('must stay dormant'); } },
    webkitAudioContext: undefined,
    fetch() { calls.fetches += 1; throw new Error('must not download dormant sound'); },
    localStorage: { getItem(key) { calls.reads.push(key); return saved; }, setItem(...args) { calls.writes.push(args); } },
  });
  for (const [value, expectedMuted] of [['1', true], ['0', false], [null, false], ['true', false]]) {
    saved = value;
    const audio = createBattleAudio();
    assert.equal(audio.enabled, false);
    assert.equal(audio.supported, true, 'capability detection is independent of the feature flag');
    assert.equal(audio.muted, expectedMuted);
    audio.setActive(true);
    for (const muted of [true, false, true]) audio.setMuted(muted);
    assert.equal(audio.muted, expectedMuted, 'the disabled feature leaves the stored preference intact');
    assert.equal(await audio.unlock(), false);
    assert.equal(audio.playBowShot(), false);
    audio.setActive(false);
    audio.stop();
    audio.destroy();
  }
  assert.deepEqual(calls, { contexts: 0, fetches: 0, reads: Array(4).fill(MUTED_KEY), writes: [] });
});

test('support detection follows native and WebKit availability and requires fetch', t => {
  globals(t, { AudioContext: undefined, webkitAudioContext: undefined, fetch: undefined, localStorage: undefined });
  const audio = createBattleAudio();
  assert.equal(audio.supported, false);
  globalThis.webkitAudioContext = class {};
  assert.equal(audio.supported, false);
  globalThis.fetch = () => {};
  assert.equal(audio.supported, true);
  globalThis.webkitAudioContext = undefined;
  globalThis.AudioContext = class {};
  assert.equal(audio.supported, true);
  globalThis.AudioContext = undefined;
  assert.equal(audio.supported, false, 'the getter reflects changed capabilities instead of a stale snapshot');
  audio.destroy();
});

test('missing storage, blocked getItem and a throwing storage property do not interrupt the game', async t => {
  globals(t, { AudioContext: undefined, webkitAudioContext: undefined, fetch: undefined, localStorage: undefined });
  for (const storage of [undefined, null, { getItem() { throw new Error('storage blocked'); } }]) {
    globalThis.localStorage = storage;
    const audio = createBattleAudio();
    assert.equal(audio.muted, false);
    audio.setActive(true);
    assert.equal(await audio.unlock(), false);
    audio.destroy();
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('access denied'); } });
  const audio = createBattleAudio();
  assert.equal(audio.muted, false);
  assert.doesNotThrow(() => audio.setMuted(true));
  audio.destroy();
});

test('destroy is repeatable and later activation, mute changes and playback remain inert', async t => {
  let writes = 0;
  globals(t, {
    AudioContext: class { constructor() { assert.fail('destroyed audio cannot create a context'); } },
    webkitAudioContext: undefined,
    fetch() { assert.fail('destroyed audio cannot fetch'); },
    localStorage: { getItem: () => '1', setItem() { writes += 1; throw new Error('writes denied'); } },
  });
  const audio = createBattleAudio();
  for (let round = 0; round < 3; round++) {
    audio.destroy();
    audio.stop();
    audio.setActive(true);
    audio.setMuted(false);
    assert.equal(await audio.unlock(), false);
    assert.equal(audio.playBowShot(), false);
  }
  assert.equal(audio.muted, true);
  assert.equal(writes, 0);
});
