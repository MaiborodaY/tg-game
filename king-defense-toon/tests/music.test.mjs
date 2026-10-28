import assert from 'node:assert/strict';
import test from 'node:test';
import { createLevelMusic } from '../music.ts';

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
    ended = false;
    currentTime = 0;
    _src = '';
    get src() { return this._src; }
    set src(value) {
      this._src = value;
      this.ended = false;
      this.paused = true;
      this.currentTime = 0;
      calls.push(`audio:src:${value}`);
    }
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
    finish() {
      this.ended = true;
      this.paused = true;
      this.listeners.get('ended')?.();
    }
    load() { calls.push('audio:load'); }
  }
  class MockContext {
    state = 'suspended';
    destination = {};
    constructor() { contexts.push(this); calls.push('context:new'); }
    createGain() {
      let value = 1;
      const node = { gain: { get value() { return value; }, set value(next) { value = next; calls.push('gain:set'); } },
        connect: target => assert.equal(target, this.destination),
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
  assert.equal(element.loop, false, 'ended advances the playlist instead of looping one track');
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

test('level-one playlist streams the two full tracks in order through one player and wraps', async t => {
  const env = environment(t);
  const music = createLevelMusic();
  music.setActive(true);
  assert.equal(await music.unlock(), true);
  const element = env.media[0];
  const first = element.src;
  assert.equal(env.calls.filter(call => call.startsWith('audio:src:')).length, 1,
    'the next track is not requested at startup');
  element.finish();
  await settle();
  assert.ok(element.src.endsWith('/assets/audio/ambient-level-1-menu.mp3'));
  assert.equal(element.paused, false);
  const second = element.src;
  element.currentTime = 27;
  element.listeners.get('ended')();
  music.setLevel(1);
  music.setActive(true);
  await music.unlock();
  assert.equal(element.src, second, 'a stale ended event or UI refresh does not advance music');
  assert.equal(element.currentTime, 27);
  element.finish();
  await settle();
  assert.equal(element.src, first);
  assert.equal(element.paused, false);
  assert.equal(env.calls.filter(call => call === 'audio:play').length, 3);
  assert.equal(env.contexts.length, 1);
  assert.equal(env.media.length, 1);
  assert.equal(env.sources.length, 1);
  music.destroy();
});

test('cave music is lazy, loops through the same player and restores both location bookmarks', async t => {
  const env = environment(t);
  const music = createLevelMusic();
  music.setActive(true);
  await music.unlock();
  const element = env.media[0];
  element.finish(); await settle();
  const campaignTrack = element.src;
  element.currentTime = 31;
  music.setScene('goblin-cave'); await settle();
  assert.ok(element.src.endsWith('/assets/audio/goblin-cave-action.mp3'));
  assert.equal(element.loop, true, 'one cave track uses the native media loop');
  assert.equal(element.currentTime, 0);
  element.currentTime = 18;
  const playingCalls = [...env.calls];
  music.setScene('goblin-cave'); await music.unlock();
  assert.deepEqual(env.calls, playingCalls, 'ordinary game refresh does not restart the cave track');
  music.setScene('campaign'); await settle();
  assert.equal(element.src, campaignTrack);
  assert.equal(element.currentTime, 31);
  assert.equal(element.loop, false);
  music.setScene('goblin-cave'); await settle();
  assert.equal(element.currentTime, 18);
  assert.equal(env.contexts.length, 1);
  assert.equal(env.media.length, 1);
  assert.equal(env.sources.length, 1);
  music.destroy();
});

test('dungeon selection obeys mute and visibility, independently of the campaign level', async t => {
  const env = environment(t);
  const music = createLevelMusic();
  music.setLevel(2);
  music.setScene('goblin-cave');
  music.setMuted(true); music.setActive(true);
  await music.unlock();
  const element = env.media[0];
  assert.equal(element.src, '', 'muted entry does not download dungeon music');
  music.setActive(false); music.setMuted(false); await settle();
  assert.equal(element.src, '');
  music.setActive(true); await settle();
  assert.ok(element.src.endsWith('/goblin-cave-action.mp3'));
  assert.equal(element.paused, false);
  element.currentTime = 24;
  music.setActive(false); music.setActive(true); await settle();
  assert.equal(element.currentTime, 24);
  music.setScene('campaign'); await settle();
  assert.equal(element.paused, true, 'leaving the cave restores level-two silence');
  music.setLevel(1); await settle();
  assert.ok(element.src.endsWith('/ambient-level-1.mp3'));
  music.destroy();
});

test('leaving during an unfinished cave play request cannot restore the cave source', async t => {
  const play = deferred();
  const env = environment(t, { plays: [() => {}, () => play.promise] });
  const music = createLevelMusic();
  music.setActive(true); await music.unlock();
  const element = env.media[0], campaignTrack = element.src;
  element.currentTime = 9;
  music.setScene('goblin-cave');
  music.setScene('campaign'); await settle();
  play.resolve(); await settle();
  assert.equal(element.src, campaignTrack);
  assert.equal(element.currentTime, 9);
  assert.equal(element.paused, false);
  assert.equal(env.media.length, 1);
  music.destroy();
});

test('an ending while hidden, muted or outside level one waits before requesting the next track', async t => {
  const env = environment(t);
  const music = createLevelMusic();
  music.setActive(true);
  await music.unlock();
  const element = env.media[0];
  for (const [disable, enable] of [
    [() => music.setActive(false), () => music.setActive(true)],
    [() => music.setMuted(true), () => music.setMuted(false)],
    [() => music.setLevel(2), () => music.setLevel(1)],
    [() => music.setVolume(0), () => music.setVolume(.05)],
  ]) {
    disable();
    const before = element.src;
    const requests = env.calls.filter(call => call.startsWith('audio:src:')).length;
    element.finish();
    await settle();
    assert.equal(element.src, before);
    assert.equal(element.paused, true);
    assert.equal(env.calls.filter(call => call.startsWith('audio:src:')).length, requests);
    enable();
    await settle();
    assert.notEqual(element.src, before);
    assert.equal(element.paused, false);
  }
  music.destroy();
});

test('mute, inactivity and other levels retain the second track and its playback position', async t => {
  const env = environment(t);
  const music = createLevelMusic();
  music.setActive(true);
  await music.unlock();
  const element = env.media[0];
  element.finish();
  await settle();
  const second = element.src;
  element.currentTime = 42;
  music.setMuted(true);
  music.setActive(false);
  music.setLevel(2);
  music.setMuted(false);
  music.setActive(true);
  await settle();
  assert.equal(element.paused, true);
  music.setLevel(1);
  await settle();
  assert.equal(element.src, second);
  assert.equal(element.currentTime, 42);
  assert.equal(element.paused, false);
  assert.equal(env.calls.filter(call => call.startsWith('audio:src:')).length, 2);
  music.destroy();
});

test('a rejected automatic transition retries the selected track on a gesture without skipping it', async t => {
  const env = environment(t, { plays: [() => {}, () => Promise.reject(new Error('NotAllowedError'))] });
  const music = createLevelMusic();
  music.setActive(true);
  await music.unlock();
  const element = env.media[0];
  element.finish();
  await settle();
  assert.ok(element.src.endsWith('/assets/audio/ambient-level-1-menu.mp3'));
  assert.equal(element.paused, true);
  assert.equal(await music.unlock(), true);
  assert.ok(element.src.endsWith('/assets/audio/ambient-level-1-menu.mp3'));
  assert.equal(env.calls.filter(call => call.startsWith('audio:src:')).length, 2);
  music.destroy();
});

test('ordinary taps leave playing audio untouched while a suspended context remains retryable', async t => {
  const env = environment(t);
  const music = createLevelMusic();
  music.setActive(true);
  await music.unlock();
  const before = [...env.calls];
  for (let i = 0; i < 10; i++) assert.equal(await music.unlock(), true);
  assert.deepEqual(env.calls, before);
  env.contexts[0].state = 'suspended';
  assert.equal(await music.unlock(), true);
  assert.equal(env.contexts[0].state, 'running');
  assert.equal(env.calls.filter(call => call === 'context:resume').length, 2);
  music.destroy();
});

test('destroy removes playlist callbacks and an already queued ending cannot load another track', async t => {
  const env = environment(t);
  const music = createLevelMusic();
  music.setActive(true);
  await music.unlock();
  const element = env.media[0];
  const queuedEnding = element.listeners.get('ended');
  music.destroy();
  const after = [...env.calls];
  element.ended = true;
  queuedEnding();
  await settle();
  assert.equal(element.listeners.size, 0);
  assert.deepEqual(env.calls, after);
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
