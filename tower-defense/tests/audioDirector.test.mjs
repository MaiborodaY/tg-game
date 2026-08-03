import assert from "node:assert/strict";
import test from "node:test";

import { AUDIO_SAMPLE_IDS } from "../src/audio/audioCatalog.ts";
import { AudioDirector, resolveMusicContext } from "../src/audio/audioDirector.ts";

const SETTINGS_ON = Object.freeze({ musicEnabled: true, sfxEnabled: true });

test("audio remains silent before a gesture and concurrent unlocks share one attempt", async () => {
  let resolveUnlock;
  const unlockAttempt = new Promise((resolve) => {
    resolveUnlock = resolve;
  });
  const port = fakePort({ unlock: () => unlockAttempt });
  const director = new AudioDirector(port, SETTINGS_ON, fakeLibrary());

  director.setMusicContext("forest");
  assert.equal(director.playCue("ui_select"), false);
  assert.equal(port.calls.startMusic.length, 0);

  const first = director.unlockFromGesture();
  const second = director.unlockFromGesture();
  assert.equal(first, second);
  assert.equal(port.calls.unlock, 1);
  resolveUnlock(true);
  assert.equal(await first, true);
  assert.equal(port.calls.startMusic.length, 1);
  assert.equal(port.calls.startMusic[0].id, "forest");
});

test("failed unlock is retryable and a successful retry restores desired music", async () => {
  let attempts = 0;
  const port = fakePort({
    unlock: async () => {
      attempts += 1;
      return attempts > 1;
    },
  });
  const director = new AudioDirector(port, SETTINGS_ON, fakeLibrary());
  director.setMusicContext("northern");

  assert.equal(await director.unlockFromGesture(), false);
  assert.equal(port.calls.startMusic.length, 0);
  assert.equal(await director.unlockFromGesture(), true);
  assert.equal(port.calls.startMusic[0].id, "northern");
});

test("later gestures ask the media port to retry playback without a second unlock", async () => {
  const port = fakePort();
  const director = new AudioDirector(port, SETTINGS_ON, fakeLibrary());
  director.setMusicContext("forest");

  assert.equal(await director.unlockFromGesture(), true);
  assert.equal(await director.unlockFromGesture(), true);
  assert.equal(port.calls.unlock, 1);
  assert.equal(port.calls.resume, 1);
});

test("cue throttling, variants, mute and lifecycle stay presentation-only", async () => {
  let now = 1_000;
  const port = fakePort();
  const director = new AudioDirector(port, SETTINGS_ON, fakeLibrary(), () => now, () => 0.75);
  await director.unlockFromGesture();

  assert.equal(director.playCue("tower_ranger_hit"), true);
  assert.equal(director.playCue("tower_ranger_hit"), false);
  now += 104;
  assert.equal(director.playCue("tower_ranger_hit"), false);
  now += 1;
  assert.equal(director.playCue("tower_ranger_hit"), true);
  assert.match(port.calls.playEffect[0].url, /rangerHit1/);
  assert.match(port.calls.playEffect[1].url, /rangerHit2/);
  assert.ok(port.calls.playEffect[0].playbackRate > 1);

  director.setSettings({ musicEnabled: true, sfxEnabled: false });
  assert.equal(director.playCue("ui_error"), false);
  director.setSettings(SETTINGS_ON);
  assert.equal(director.playCue("ui_error"), true, "muted cues must not consume their cooldown");

  director.suspend();
  now += 1_000;
  assert.equal(director.playCue("gate_hit"), false);
  assert.equal(port.calls.suspend, 1);
  director.resume();
  assert.equal(port.calls.resume, 1);
  assert.equal(director.playCue("gate_hit"), true);

  director.destroy();
  assert.equal(port.calls.destroy, 1);
  assert.equal(director.playCue("victory"), false);
});

test("music changes are idempotent and respect the music switch", async () => {
  const port = fakePort();
  const director = new AudioDirector(port, SETTINGS_ON, fakeLibrary());
  director.setMusicContext("forest");
  await director.unlockFromGesture();
  director.setMusicContext("forest");
  assert.equal(port.calls.startMusic.length, 1);

  director.setMusicContext("boss");
  assert.equal(port.calls.startMusic.at(-1).id, "boss");
  director.setSettings({ musicEnabled: false, sfxEnabled: true });
  assert.equal(port.calls.stopMusic, 1);
  director.setSettings(SETTINGS_ON);
  assert.equal(port.calls.startMusic.at(-1).id, "boss");
  director.setMusicContext(null);
  assert.equal(port.calls.stopMusic, 2);
});

test("returning to a visible page before the first gesture does not leave audio suspended", async () => {
  const port = fakePort();
  const director = new AudioDirector(port, SETTINGS_ON, fakeLibrary());
  director.setMusicContext("forest");
  director.suspend();
  director.resume();

  assert.equal(port.calls.suspend, 1);
  assert.equal(port.calls.resume, 1);
  assert.equal(await director.unlockFromGesture(), true);
  assert.equal(port.calls.startMusic.length, 1);
  assert.equal(port.calls.startMusic[0].id, "forest");
});

test("music context follows level, boss and terminal state without game speed input", () => {
  assert.equal(resolveMusicContext("forest-gate", "setup", false), "forest");
  assert.equal(resolveMusicContext("northern-pass-v3", "wave", false), "northern");
  assert.equal(resolveMusicContext("forest-gate", "wave", true), "boss");
  assert.equal(resolveMusicContext("northern-pass-v3", "victory", true), null);
  assert.equal(resolveMusicContext("forest-gate", "gameover", false), null);
});

function fakeLibrary() {
  const sampleUrls = Object.fromEntries(AUDIO_SAMPLE_IDS.map((id) => [id, `audio://${id}`]));
  return Object.freeze({
    sampleUrls: Object.freeze(sampleUrls),
    effectUrls: Object.freeze(Object.values(sampleUrls)),
    music: Object.freeze({
      forest: Object.freeze({ id: "forest", loopUrl: "music://forest", volume: 0.27, crossfadeMs: 900 }),
      northern: Object.freeze({ id: "northern", loopUrl: "music://northern", volume: 0.25, crossfadeMs: 900 }),
      boss: Object.freeze({ id: "boss", introUrl: "music://boss-intro", loopUrl: "music://boss", volume: 0.34, crossfadeMs: 650 }),
    }),
  });
}

function fakePort(options = {}) {
  const calls = {
    unlock: 0,
    startMusic: [],
    setMusicVolume: [],
    stopMusic: 0,
    playEffect: [],
    suspend: 0,
    resume: 0,
    destroy: 0,
  };
  return {
    calls,
    async unlock() {
      calls.unlock += 1;
      return options.unlock ? options.unlock() : true;
    },
    startMusic(playback) {
      calls.startMusic.push(playback);
    },
    setMusicVolume(volume) {
      calls.setMusicVolume.push(volume);
    },
    stopMusic() {
      calls.stopMusic += 1;
    },
    playEffect(playback) {
      calls.playEffect.push(playback);
    },
    suspend() {
      calls.suspend += 1;
    },
    resume() {
      calls.resume += 1;
    },
    destroy() {
      calls.destroy += 1;
    },
  };
}
