import assert from "node:assert/strict";
import test from "node:test";

import { playRollSound } from "../src/audio.ts";

test("roll sound fails safely when Web Audio is unavailable", async () => {
  await assert.doesNotReject(playRollSound({}));
});

test("roll sound uses quiet filtered noise taps", async () => {
  const events = {
    filters: [],
    gainValues: [],
    resumed: 0,
    sources: [],
  };

  class FakeAudioContext {
    constructor() {
      this.currentTime = 4;
      this.destination = {};
      this.sampleRate = 8_000;
      this.state = "suspended";
    }

    async resume() {
      events.resumed += 1;
      this.state = "running";
    }

    createBuffer(_channels, frameCount) {
      const samples = new Float32Array(frameCount);
      return { getChannelData: () => samples };
    }

    createBufferSource() {
      const source = {
        buffer: null,
        connect() {},
        start(at) { source.startedAt = at; },
        stop(at) { source.stoppedAt = at; },
      };
      events.sources.push(source);
      return source;
    }

    createBiquadFilter() {
      const filter = {
        type: "",
        frequency: { setValueAtTime(value) { filter.cutoff = value; } },
        Q: { setValueAtTime(value) { filter.q = value; } },
        connect() {},
      };
      events.filters.push(filter);
      return filter;
    }

    createGain() {
      return {
        gain: {
          setValueAtTime(value) { events.gainValues.push(value); },
          linearRampToValueAtTime(value) { events.gainValues.push(value); },
          exponentialRampToValueAtTime(value) { events.gainValues.push(value); },
        },
        connect() {},
      };
    }
  }

  await playRollSound({ AudioContext: FakeAudioContext });

  assert.equal(events.resumed, 1);
  assert.equal(events.sources.length, 5);
  assert.equal(events.filters.length, 5);
  assert.ok(events.filters.every((filter) => filter.type === "lowpass"));
  assert.ok(events.filters.every((filter) => filter.cutoff <= 1_140));
  assert.ok(Math.max(...events.gainValues) <= 0.3);
  assert.ok(events.sources.every((source) => source.stoppedAt > source.startedAt));
});
