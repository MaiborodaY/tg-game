import assert from 'node:assert/strict';
import test from 'node:test';
import { createDungeonIntroPlayback } from '../dungeon-intro.ts';
import { createScreenController } from '../screen-controller.ts';

class Video extends EventTarget {
  src = ''; currentTime = 0; readyState = 0; ended = false; paused = true;
  loads = 0; plays = 0;
  load() { this.loads++; }
  play() { this.plays++; this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  emit(name) { this.dispatchEvent(new Event(name)); }
}
function fixture({ reduced = false } = {}) {
  const video = new Video();
  let finishes = 0;
  const intro = createDungeonIntroPlayback({ video, reducedMotion: () => reduced, onFinish: () => finishes++ });
  return { video, intro, finishes: () => finishes };
}

test('entry video is lazy, preparation is shared and completion fires once at three seconds', async () => {
  const { video, intro, finishes } = fixture();
  assert.equal(video.src, ''); assert.equal(video.loads, 0);
  const first = intro.prepare(), second = intro.prepare();
  assert.equal(first, second); assert.equal(video.loads, 1);
  video.readyState = 2; video.emit('loadeddata');
  assert.equal(await first, true);
  intro.start(); intro.start(); assert.equal(video.plays, 1);
  video.emit('playing');
  for (let i = 1; i <= 29; i++) { video.currentTime = i / 10; intro.frame(.1); }
  assert.equal(finishes(), 0);
  video.currentTime = 3; intro.frame(.1);
  video.emit('ended'); intro.frame(1); intro.skip();
  assert.equal(finishes(), 1); assert.equal(intro.active, false); assert.equal(video.paused, true);
  intro.start(); assert.equal(video.currentTime, 0); assert.equal(video.loads, 1, 're-entry retains the same media resource');
  intro.destroy();
});

test('inactivity pauses media and deadlines; delayed completion waits for a visible frame', () => {
  const { video, intro, finishes } = fixture();
  intro.start(); video.emit('playing'); video.currentTime = .5; intro.frame(.5);
  intro.setPaused(true); assert.equal(video.paused, true);
  intro.frame(120); intro.skip(); assert.equal(finishes(), 0);
  intro.setPaused(false); assert.equal(video.paused, false);
  video.currentTime = .6; intro.frame(.1); assert.equal(finishes(), 0);
  intro.setPaused(true); video.emit('ended'); intro.frame(120); assert.equal(finishes(), 0);
  intro.setPaused(false); intro.frame(.1); assert.equal(finishes(), 1);
  intro.destroy();
});

test('unavailable, stalled and refused media fail open without blocking entry', async t => {
  await t.test('never-loaded media has a bounded start deadline', async () => {
    const { video, intro, finishes } = fixture(); const pending = intro.prepare();
    intro.start(); intro.frame(.5); assert.equal(finishes(), 0);
    intro.frame(.5); assert.equal(finishes(), 1); assert.equal(await pending, false);
    video.paused = false; video.emit('playing');
    assert.equal(video.paused, true, 'late media readiness cannot play behind the cave');
    intro.destroy();
  });
  await t.test('decoder stalls have a bounded deadline', () => {
    const { video, intro, finishes } = fixture();
    intro.start(); video.emit('playing'); intro.frame(.5); assert.equal(finishes(), 0);
    intro.frame(.5); assert.equal(finishes(), 1); intro.destroy();
  });
  await t.test('play rejection is handled on the shared frame', async () => {
    const { video, intro, finishes } = fixture();
    video.play = () => Promise.reject(new Error('Playback refused'));
    intro.start(); await Promise.resolve(); assert.equal(finishes(), 0);
    intro.frame(.1); assert.equal(finishes(), 1); intro.destroy();
  });
  await t.test('preload failure bypasses the optional clip', async () => {
    const { video, intro, finishes } = fixture(); const pending = intro.prepare();
    video.emit('error'); assert.equal(await pending, false);
    intro.start(); assert.equal(finishes(), 1); assert.equal(video.plays, 0); intro.destroy();
  });
});

test('reduced motion bypasses playback without even requesting the video', async () => {
  const { video, intro, finishes } = fixture({ reduced: true });
  assert.equal(await intro.prepare(), false);
  intro.start(); assert.equal(finishes(), 1); assert.equal(video.src, ''); assert.equal(video.plays, 0);
  intro.destroy();
});

test('a late rejected play request cannot end a resumed or replacement entry', async () => {
  const { video, intro, finishes } = fixture();
  let reject;
  video.play = () => new Promise((resolve, fail) => { reject = fail; });
  intro.start(); const oldReject = reject;
  intro.setPaused(true); intro.setPaused(false);
  video.emit('playing'); oldReject(new Error('Interrupted by pause')); await Promise.resolve();
  video.currentTime = .1; intro.frame(.1); assert.equal(finishes(), 0);
  intro.stop(); reject(new Error('Stopped')); await Promise.resolve(); intro.frame(10);
  assert.equal(finishes(), 0); intro.destroy();
});

test('skip is one-shot and destruction settles pending work without entering the cave', async () => {
  const { video, intro, finishes } = fixture();
  intro.start(); intro.skip(); intro.skip(); assert.equal(finishes(), 0);
  intro.frame(.1); assert.equal(finishes(), 1);
  intro.start(); intro.destroy(); video.emit('ended'); intro.frame(10); intro.start();
  assert.equal(finishes(), 1); assert.equal(video.src, ''); assert.equal(video.paused, true);
  assert.equal(await intro.prepare(), false);
});

test('catalogue to introduction keeps background inert until the battle becomes visible', () => {
  const app = { dataset: {} }, dungeons = { hidden: true }, intro = { hidden: true };
  const battlefield = { inert: false }, alreadyInert = { inert: true };
  const screens = createScreenController({ app, dungeons, intro, background: [battlefield, alreadyInert], onChange() {} });
  screens.show('dungeons'); screens.show('dungeon-intro');
  assert.equal(dungeons.hidden, true); assert.equal(intro.hidden, false); assert.equal(battlefield.inert, true);
  screens.show('dungeon-battle');
  assert.equal(intro.hidden, true); assert.equal(battlefield.inert, false); assert.equal(alreadyInert.inert, true);
});
