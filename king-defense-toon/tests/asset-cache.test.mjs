import assert from 'node:assert/strict';
import test from 'node:test';
import { createAssetCache, loadImage } from '../asset-cache.mjs';

test('two scenes share one pending load and resources live until both release them', async () => {
  const cache = createAssetCache();
  const battle = {}, army = {};
  cache.retain(battle, ['warrior']);
  cache.retain(army, ['warrior']);
  let loads = 0, finish;
  const load = () => { loads += 1; return new Promise(resolve => { finish = resolve; }); };
  const first = cache.get('warrior', load);
  const second = cache.get('warrior', load);
  await Promise.resolve();
  assert.equal(loads, 1);
  assert.equal(first, second);
  const image = {};
  finish(image);
  assert.equal(await first, image);
  cache.release(battle);
  assert.equal(cache.size, 1);
  assert.equal(await cache.get('warrior', load), image);
  cache.release(army);
  assert.equal(cache.size, 0);
});

test('an obsolete in-flight request is evicted when it completes without evicting the current level', async () => {
  const cache = createAssetCache(), owner = {};
  let finish;
  cache.retain(owner, ['forest']);
  const old = cache.get('forest', () => new Promise(resolve => { finish = resolve; }));
  await Promise.resolve();
  cache.retain(owner, ['graveyard']);
  await cache.get('graveyard', () => 'graveyard');
  finish('forest');
  await old;
  assert.equal(cache.size, 1);
  assert.equal(await cache.get('graveyard', () => assert.fail('current level was evicted')), 'graveyard');
  cache.release(owner);
  assert.equal(cache.size, 0);
});

test('a failed shared request can be retried successfully without replacing its scenes', async () => {
  const cache = createAssetCache(), owner = {};
  cache.retain(owner, ['map']);
  let calls = 0;
  const loader = () => { if (++calls === 1) throw new Error('offline'); return 'ready'; };
  const first = cache.get('map', loader);
  const second = cache.get('map', loader);
  await assert.rejects(first, /offline/);
  await assert.rejects(second, /offline/);
  assert.equal(cache.size, 0);
  assert.equal(await cache.get('map', loader), 'ready');
  assert.equal(calls, 2);
});

test('image loader retries a transient network failure, cleans handlers and exposes exhausted failures', async () => {
  let requests = 0;
  class Image {
    set src(value) {
      if (!value) return;
      requests += 1;
      queueMicrotask(() => requests === 1 ? this.onerror?.() : this.onload?.());
    }
  }
  const image = await loadImage('/warrior.png', { ImageClass: Image, timeoutMs: 50 });
  assert.equal(requests, 2);
  assert.equal(image.onload, null);
  assert.equal(image.onerror, null);
  class BrokenImage { set src(value) { if (value) queueMicrotask(() => this.onerror?.()); } }
  await assert.rejects(loadImage('/missing.png', { ImageClass: BrokenImage, timeoutMs: 50 }), /Could not load image/);
});

test('a hanging image is bounded by the timeout and can recover on the second attempt', async () => {
  let requests = 0;
  class Image {
    set src(value) {
      if (value && ++requests > 1) queueMicrotask(() => this.onload?.());
    }
  }
  await loadImage('/slow.png', { ImageClass: Image, timeoutMs: 5 });
  assert.equal(requests, 2);
  class HangingImage { set src(_) {} }
  await assert.rejects(loadImage('/never.png', { ImageClass: HangingImage, timeoutMs: 5 }), /timed out/);
});
