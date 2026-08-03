import assert from "node:assert/strict";
import test from "node:test";

import { createBrowserAudioPort } from "../src/audio/browserAudioPort.ts";

test("the browser port primes fixed Web Audio channels and reuses them under heavy SFX load", async () => {
  await withFakeAudioBrowser(async (environment) => {
    const port = createBrowserAudioPort(["audio://one", "audio://two"]);
    assert.equal(await port.unlock(), true);

    assert.equal(environment.audios.length, 12, "two music and ten effect channels are primed");
    assert.ok(environment.audios.every((audio) => audio.playCalls === 1));
    assert.equal(environment.contexts.length, 1);
    assert.equal(environment.contexts[0].sourceCount, 12);

    port.startMusic({ id: "forest", loopUrl: "music://forest", volume: 0.27, crossfadeMs: 900 });
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(environment.audios.length, 12, "music reuses a primed channel");
    const music = environment.audios.find((audio) => audio.src === "music://forest");
    assert.ok(music);
    assert.equal(music.volume, 1, "Web Audio gain owns volume instead of iOS HTML volume");
    assert.ok(environment.contexts[0].gains.some((gain) => gain.gain.value > 0 && gain.gain.value < 1));

    for (let index = 0; index < 40; index += 1) {
      port.playEffect({ url: `audio://${index % 2}`, volume: 0.25, playbackRate: 1, priority: 1 });
    }
    assert.equal(environment.audios.length, 12, "effect bursts never allocate throwaway Audio elements");

    port.destroy();
    assert.equal(environment.contexts[0].state, "closed");
  });
});

test("a later gesture retries music playback after a WebView rejection", async () => {
  await withFakeAudioBrowser(async (environment) => {
    const port = createBrowserAudioPort([]);
    assert.equal(await port.unlock(), true);
    const musicChannel = environment.audios[0];
    musicChannel.failNextPlay = true;

    port.startMusic({ id: "forest", loopUrl: "music://forest", volume: 0.27, crossfadeMs: 900 });
    await Promise.resolve();
    await Promise.resolve();
    const rejectedAttemptCount = musicChannel.playCalls;
    assert.equal(environment.intervals.size, 0, "rejected playback must not fade the old channel");
    port.resume();
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(musicChannel.playCalls, rejectedAttemptCount + 1);
    assert.equal(environment.intervals.size, 1, "crossfade begins only after playback succeeds");
    port.destroy();
  });
});

test("a rapid page return resumes only after an in-flight context suspend settles", async () => {
  await withFakeAudioBrowser(async (environment) => {
    const port = createBrowserAudioPort([]);
    assert.equal(await port.unlock(), true);
    port.startMusic({ id: "forest", loopUrl: "music://forest", volume: 0.27, crossfadeMs: 900 });
    await Promise.resolve();
    await Promise.resolve();
    const musicChannel = environment.audios.find((audio) => audio.src === "music://forest");
    assert.ok(musicChannel);

    let finishSuspend;
    environment.contexts[0].suspend = function suspend() {
      return new Promise((resolve) => {
        finishSuspend = () => {
          this.state = "suspended";
          resolve();
        };
      });
    };
    const playCallsBefore = musicChannel.playCalls;
    port.suspend();
    port.resume();
    assert.equal(musicChannel.playCalls, playCallsBefore);

    finishSuspend();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(environment.contexts[0].state, "running");
    assert.equal(musicChannel.playCalls, playCallsBefore + 1);
    port.destroy();
  });
});

async function withFakeAudioBrowser(run) {
  const environment = { audios: [], contexts: [], intervals: new Map(), timeouts: new Map(), timerId: 0 };
  const audioDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Audio");
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");

  class FakeAudio {
    constructor(src = "") {
      this.src = src;
      this.currentTime = 0;
      this.loop = false;
      this.preload = "";
      this.playbackRate = 1;
      this.volume = 1;
      this.playCalls = 0;
      this.pauseCalls = 0;
      this.loadCalls = 0;
      this.failNextPlay = false;
      this.listeners = new Map();
      environment.audios.push(this);
    }

    play() {
      this.playCalls += 1;
      if (this.failNextPlay) {
        this.failNextPlay = false;
        return Promise.reject(new Error("autoplay blocked"));
      }
      return Promise.resolve();
    }

    pause() {
      this.pauseCalls += 1;
    }

    load() {
      this.loadCalls += 1;
    }

    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) ?? new Set();
      listeners.add(listener);
      this.listeners.set(type, listeners);
    }

    removeEventListener(type, listener) {
      this.listeners.get(type)?.delete(listener);
    }

    removeAttribute(name) {
      if (name === "src") this.src = "";
    }
  }

  class FakeAudioContext {
    constructor() {
      this.state = "suspended";
      this.destination = {};
      this.sourceCount = 0;
      this.gains = [];
      environment.contexts.push(this);
    }

    createMediaElementSource() {
      this.sourceCount += 1;
      return { connect() {} };
    }

    createGain() {
      const gain = { gain: { value: 1 }, connect() {} };
      this.gains.push(gain);
      return gain;
    }

    resume() {
      this.state = "running";
      return Promise.resolve();
    }

    suspend() {
      this.state = "suspended";
      return Promise.resolve();
    }

    close() {
      this.state = "closed";
      return Promise.resolve();
    }
  }

  Object.defineProperty(globalThis, "Audio", { configurable: true, value: FakeAudio });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      AudioContext: FakeAudioContext,
      setInterval(callback) {
        const id = ++environment.timerId;
        environment.intervals.set(id, callback);
        return id;
      },
      clearInterval(id) {
        environment.intervals.delete(id);
      },
      setTimeout(callback) {
        const id = ++environment.timerId;
        environment.timeouts.set(id, callback);
        return id;
      },
      clearTimeout(id) {
        environment.timeouts.delete(id);
      },
    },
  });

  try {
    await run(environment);
  } finally {
    restoreGlobal("Audio", audioDescriptor);
    restoreGlobal("window", windowDescriptor);
  }
}

function restoreGlobal(name, descriptor) {
  if (descriptor) Object.defineProperty(globalThis, name, descriptor);
  else delete globalThis[name];
}
