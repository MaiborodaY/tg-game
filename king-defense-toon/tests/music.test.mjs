import assert from 'node:assert/strict';
import test from 'node:test';
import { createLevelMusic } from '../music.mjs';

const MUTE = 'brotd-infinity:music-muted:v1';
const VOLUME = 'brotd-infinity:music-volume:v1';
const LEGACY_MUTE = 'brotd-infinity:sound-muted:v1';
const settle = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Every test owns isolated globals; deferred promises model playback settling after UI changes.
function environment(t, { preferences = {}, storageThrows = false, webkitOnly = false,
  unsupported = false, failGraph = false, plays = [], resumes = [] } = {}) {
  const calls = [], contexts = [], media = [], gains = [], sources = [];
  const saved = new Map(Object.entries(preferences));
  class MockAudio {
    paused = true;
    src = '';
    listeners = new Map();
    constructor() { media.push(this); calls.push('audio:new'); }
    addEventListener(name, handler) { this.listeners.set(name, handler); }
    removeEventListener(name, handler) { if (this.listeners.get(name) === handler) this.listeners.delete(name); }
    getAttribute(name) { return name === 'src' && this.src ? this.src : null; }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    play() {
      calls.push('audio:play');
      const result = plays.shift()?.();
      return Promise.resolve(result).then(() => {
        this.paused = false;
        this.listeners.get('play')?.();
        this.listeners.get('playing')?.();
      });
    }
    pause() { calls.push('audio:pause'); this.paused = true; }
    load() { calls.push('audio:load'); }
  }
  class MockContext {
    state = 'suspended';
    destination = {};
    constructor() { contexts.push(this); calls.push('context:new'); }
    createGain() {
      const node = { gain: { value: 1 }, connect: target => assert.equal(target, this.destination),
        disconnect: () => calls.push('gain:disconnect') };
      gains.push(node);
      return node;
    }
    createMediaElementSource(element) {
      if (failGraph) throw new Error('Device unavailable');
      assert.equal(element, media.at(-1));
      const node = { connect: target => assert.equal(target, gains.at(-1)),
        disconnect: () => calls.push('source:disconnect') };
      sources.push(node);
      return node;
    }
    resume() {
      calls.push('context:resume');
      const result = resumes.shift()?.();
      return Promise.resolve(result).then(() => { if (this.state !== 'closed') this.state = 'running'; });
    }
    suspend() { calls.push('context:suspend'); if (this.state !== 'closed') this.state = 'suspended'; return Promise.resolve(); }
    close() { calls.push('context:close'); this.state = 'closed'; return Promise.resolve(); }
  }
  const originals = new Map(['localStorage', 'Audio', 'AudioContext', 'webkitAudioContext']
    .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() {
    if (storageThrows) throw new Error('Storage blocked');
    return { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  } });
  for (const [key, value] of Object.entries({ Audio: unsupported ? undefined : MockAudio,
    AudioContext: unsupported || webkitOnly ? undefined : MockContext,
    webkitAudioContext: !unsupported && webkitOnly ? MockContext : undefined })) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { calls, contexts, media, gains, sources, saved };
}

test('music preferences retain legacy precedence, numeric normalization and lazy graph creation', t => {
  const env = environment(t, { preferences: { [LEGACY_MUTE]: '1' } });
  assert.equal(createLevelMusic().muted, true);
  env.saved.set(MUTE, '0');
  for (const [stored, expected] of [[null, .05], ['', .05], ['  ', .05], ['Infinity', .05],
    ['nope', .05], ['.25', .25], [' 0.8 ', .8], ['-1', 0], ['2', 1]]) {
    if (stored === null) env.saved.delete(VOLUME); else env.saved.set(VOLUME, stored);
    const music = createLevelMusic();
    assert.equal(music.volume, expected);
    assert.equal(music.muted, false);
    assert.equal(music.supported, true);
    music.destroy();
  }
  assert.equal(env.contexts.length, 0);
  assert.equal(env.media.length, 0);
});

test('user unlock resumes and starts synchronously, keeps media volume at one and persists normalized gain', async t => {
  const env = environment(t, { webkitOnly: true });
  let notifications = 0;
  const music = createLevelMusic({ onStateChange: () => { notifications++; } });
  music.setActive(true);
  assert.equal(env.contexts.length, 0, 'activation alone cannot authorize playback');
  const unlocked = music.unlock();
  assert.deepEqual(env.calls.slice(-2), ['context:resume', 'audio:play'], 'both start inside the gesture stack');
  assert.equal(await unlocked, true);
  const element = env.media[0];
  assert.ok(element.src.endsWith('/assets/audio/ambient-level-1.mp3'));
  assert.equal(element.preload, 'none');
  assert.equal(element.loop, true);
  assert.equal(element.playsInline, true);
  assert.equal(element.volume, 1);
  assert.equal(env.gains[0].gain.value, .05);
  music.setVolume(2);
  assert.equal(music.volume, 1);
  assert.equal(env.saved.get(VOLUME), '1');
  assert.equal(element.volume, 1);
  assert.equal(env.gains[0].gain.value, 1);
  for (const invalid of [undefined, null, '0.5', NaN, Infinity]) music.setVolume(invalid);
  assert.equal(music.volume, 1);
  music.setMuted(true);
  assert.equal(env.saved.get(MUTE), '1');
  assert.equal(env.gains[0].gain.value, 0);
  assert.equal(element.muted, true);
  assert.equal(element.paused, true);
  assert.equal(notifications, 2);
  music.destroy();
});

test('other levels authorize the context without requesting the level-one track', async t => {
  const env = environment(t);
  const music = createLevelMusic();
  music.setActive(true);
  music.setLevel(2);
  assert.equal(await music.unlock(), false);
  assert.equal(env.media[0].src, '');
  assert.equal(env.calls.includes('audio:play'), false);
  music.setLevel('1');
  await settle();
  assert.equal(env.media[0].src, '', 'the runtime does not coerce a string level');
  music.setLevel(1);
  await settle();
  assert.equal(env.media[0].paused, false);
  music.setActive(false);
  assert.equal(env.media[0].paused, true);
  assert.equal(env.gains[0].gain.value, 0);
  music.destroy();
});

test('autoplay rejection and synchronous play failure remain retryable on a later gesture', async t => {
  const env = environment(t, { plays: [() => Promise.reject(new Error('NotAllowedError')),
    () => { throw new Error('Detached element'); }] });
  const music = createLevelMusic();
  music.setActive(true);
  assert.equal(await music.unlock(), false);
  assert.equal(await music.unlock(), false);
  assert.equal(await music.unlock(), true);
  assert.equal(env.contexts.length, 1);
  assert.equal(env.media.length, 1);
  assert.equal(music.supported, true);
  music.destroy();
});

test('pending playback is reused by settings and stale completion cannot undo muting or cleanup', async t => {
  const resume = deferred(), play = deferred();
  const env = environment(t, { resumes: [() => resume.promise], plays: [() => play.promise] });
  const music = createLevelMusic();
  music.setActive(true);
  const pending = music.unlock();
  music.setVolume(.2);
  assert.equal(env.calls.filter(call => call === 'audio:play').length, 1);
  music.setMuted(true);
  resume.resolve();
  play.resolve();
  assert.equal(await pending, false);
  assert.equal(env.media[0].paused, true);
  assert.equal(env.media[0].muted, true);
  assert.equal(env.gains[0].gain.value, 0);
  music.destroy();
  music.destroy();
  assert.equal(env.media[0].src, '');
  assert.equal(env.media[0].listeners.size, 0);
  assert.equal(env.calls.filter(call => call === 'audio:load').length, 1);
  assert.equal(env.calls.filter(call => call === 'source:disconnect').length, 1);
  assert.equal(env.calls.filter(call => call === 'gain:disconnect').length, 1);
  assert.equal(env.calls.filter(call => call === 'context:close').length, 1);
  assert.equal(await music.unlock(), false);
});

test('destroying an in-flight unlock keeps a late play event silent and settings inert', async t => {
  const play = deferred();
  const env = environment(t, { plays: [() => play.promise] });
  let notifications = 0;
  const music = createLevelMusic({ onStateChange: () => { notifications++; } });
  music.setActive(true);
  const pending = music.unlock();
  music.destroy();
  play.resolve();
  assert.equal(await pending, false);
  assert.equal(env.media[0].paused, true);
  assert.equal(env.media[0].muted, true);
  assert.equal(env.gains[0].gain.value, 0);
  assert.equal(env.contexts[0].state, 'closed');
  music.setMuted(true);
  music.setVolume(.5);
  music.setActive(true);
  music.setLevel(2);
  assert.equal(music.volume, .05);
  assert.equal(music.muted, false);
  assert.equal(env.saved.size, 0);
  assert.equal(notifications, 0);
});

test('blocked storage, unavailable devices and throwing UI callbacks do not escape lifecycle handling', async t => {
  const env = environment(t, { storageThrows: true, failGraph: true });
  const music = createLevelMusic({ onStateChange: () => { throw new Error('UI teardown'); } });
  assert.equal(music.volume, .05);
  music.setVolume(.3);
  music.setMuted(true);
  music.setMuted(false);
  music.setActive(true);
  assert.equal(await music.unlock(), false);
  assert.equal(music.supported, false);
  assert.equal(env.media[0].paused, true);
  assert.equal(env.gains[0].gain.value, 0);
  assert.equal(env.contexts[0].state, 'closed');
  assert.equal(await music.unlock(), false);
  assert.equal(env.contexts.length, 1, 'failed graphs are not recreated');
  music.destroy();
});

test('environments without audio constructors report unsupported without touching media', async t => {
  const env = environment(t, { unsupported: true });
  const music = createLevelMusic();
  music.setActive(true);
  assert.equal(music.supported, false);
  assert.equal(await music.unlock(), false);
  assert.equal(env.contexts.length, 0);
  assert.equal(env.media.length, 0);
  music.destroy();
});
