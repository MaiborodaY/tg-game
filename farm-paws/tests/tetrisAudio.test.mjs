import assert from "node:assert/strict";
import test from "node:test";

import {
  TETRIS_MUSIC_SECTIONS,
  TETRIS_MUSIC_SEQUENCE,
  TETRIS_MUSIC_TOTAL_STEPS,
  createTetrisAudioController,
  midiToFrequency,
  tetrisAudioForTransition,
  tetrisMusicStepSeconds
} from "../src/tetrisAudio.ts";
import {
  hardDropTetris,
  moveTetris,
  rotateTetris,
  startTetrisGame
} from "../src/tetrisState.ts";

test("defines a long sectioned chiptune arrangement with aligned harmony and rests", () => {
  assert.equal(TETRIS_MUSIC_SECTIONS.length, 11);
  assert.equal(TETRIS_MUSIC_TOTAL_STEPS, 600);
  assert.ok(TETRIS_MUSIC_SEQUENCE.length > 350);
  assert.ok(TETRIS_MUSIC_SEQUENCE.filter((note) => note.midi === null).length >= 8);
  assert.ok(
    TETRIS_MUSIC_SEQUENCE
      .filter((note) => note.midi === null)
      .reduce((total, note) => total + note.steps, 0) >= 8
  );
  assert.ok(TETRIS_MUSIC_SEQUENCE.some((note) => note.midi !== null));
  for (const section of TETRIS_MUSIC_SECTIONS) {
    const melodySteps = section.notes.reduce((total, note) => total + note.steps, 0);
    const harmonySteps = section.harmony.reduce((total, block) => total + block.steps, 0);
    assert.equal(melodySteps, harmonySteps, `${section.id} melody and harmony stay aligned`);
  }
  for (const note of TETRIS_MUSIC_SEQUENCE) {
    assert.ok(Number.isFinite(note.steps));
    assert.ok(note.steps > 0);
    if (note.midi !== null) {
      assert.ok(note.midi >= 36 && note.midi <= 96);
      assert.ok(Number.isFinite(midiToFrequency(note.midi)));
      assert.ok(midiToFrequency(note.midi) > 0);
    }
  }
  assert.ok(
    TETRIS_MUSIC_TOTAL_STEPS * tetrisMusicStepSeconds(15) >= 60,
    "the exact loop remains at least one minute long at maximum music tempo"
  );
});

test("music tempo accelerates moderately by level and remains bounded", () => {
  assert.ok(tetrisMusicStepSeconds(1) > tetrisMusicStepSeconds(8));
  assert.ok(tetrisMusicStepSeconds(8) >= tetrisMusicStepSeconds(10_000));
  assert.equal(tetrisMusicStepSeconds(Number.NaN), tetrisMusicStepSeconds(1));
  assert.ok(tetrisMusicStepSeconds(10_000) >= 0.1);
});

test("maps only successful Tetris transitions to one sound event", () => {
  const initial = startTetrisGame(0, () => 0.5);
  const state = {
    ...initial,
    active: { type: "T", rotation: 0, x: 3, y: 2 }
  };
  assert.equal(tetrisAudioForTransition(state, state, "left"), null);

  const moved = moveTetris(state, -1);
  assert.deepEqual(tetrisAudioForTransition(state, moved, "left"), {
    kind: "cue",
    cue: "move"
  });

  const rotated = rotateTetris(state);
  assert.deepEqual(tetrisAudioForTransition(state, rotated, "rotate"), {
    kind: "cue",
    cue: "rotate"
  });

  const dropped = hardDropTetris(state, () => 0.5);
  assert.deepEqual(tetrisAudioForTransition(state, dropped, "drop"), {
    kind: "cue",
    cue: "hard-drop"
  });

  const cleared = {
    ...state,
    board: state.board.map((row) => [...row]),
    lines: state.lines + 4,
    score: state.score + 8,
    level: state.level + 1
  };
  assert.deepEqual(tetrisAudioForTransition(state, cleared, "drop"), {
    kind: "line-clear",
    count: 4,
    levelUp: true
  });

  const gameOver = { ...state, phase: "gameover" };
  assert.deepEqual(tetrisAudioForTransition(state, gameOver, null), {
    kind: "cue",
    cue: "game-over"
  });
});

test("audio controller is a safe no-op when Web Audio is unavailable", () => {
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    },
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout
  };

  const audio = createTetrisAudioController();
  assert.equal(audio.enabled, true);
  assert.doesNotThrow(() => {
    audio.unlock();
    audio.startMusic(3);
    audio.play("move");
    audio.playLineClear(4, true);
    audio.pauseMusic();
    audio.stopMusic();
    audio.suspend();
  });

  audio.setEnabled(false);
  assert.equal(audio.enabled, false);
  assert.equal([...values.values()].at(-1), "0");
  audio.setEnabled(true);
  assert.equal(audio.enabled, true);
  assert.equal([...values.values()].at(-1), "1");
  assert.doesNotThrow(() => audio.destroy());
  assert.doesNotThrow(() => audio.startMusic());

  delete globalThis.window;
});

test("keeps one music scheduler and silences it on pause, mute, and destroy", async () => {
  const timers = new Map();
  const oscillators = [];
  let nextTimerId = 0;
  let contextCount = 0;
  let contextClosed = false;
  let resumeCount = 0;
  let suspendCount = 0;
  let periodicWaveCount = 0;
  let filterCount = 0;
  let compressorCount = 0;
  let latestContextState = null;
  let fakeCurrentTime = 1;
  let deferSuspend = false;
  let resolvePendingSuspend = null;

  class FakeAudioParam {
    value = 0;
    setValueAtTime(value) { this.value = value; }
    exponentialRampToValueAtTime(value) { this.value = value; }
    cancelScheduledValues() {}
    setTargetAtTime(value) { this.value = value; }
  }
  class FakeGain {
    gain = new FakeAudioParam();
    connect(target) { return target; }
  }
  class FakeBiquad {
    type = "lowpass";
    frequency = new FakeAudioParam();
    Q = new FakeAudioParam();
    connect(target) { return target; }
  }
  class FakeCompressor {
    threshold = new FakeAudioParam();
    knee = new FakeAudioParam();
    ratio = new FakeAudioParam();
    attack = new FakeAudioParam();
    release = new FakeAudioParam();
    connect(target) { return target; }
  }
  class FakeOscillator {
    frequency = new FakeAudioParam();
    stopped = false;
    disconnected = false;
    periodicWave = null;
    connect(target) { return target; }
    addEventListener() {}
    setPeriodicWave(wave) { this.periodicWave = wave; }
    start() {}
    stop() { this.stopped = true; }
    disconnect() { this.disconnected = true; }
  }
  class FakeAudioContext {
    state = "interrupted";
    destination = {};
    get currentTime() { return fakeCurrentTime; }
    constructor() {
      contextCount += 1;
      latestContextState = this.state;
    }
    createGain() { return new FakeGain(); }
    createBiquadFilter() {
      filterCount += 1;
      return new FakeBiquad();
    }
    createDynamicsCompressor() {
      compressorCount += 1;
      return new FakeCompressor();
    }
    createPeriodicWave(real, imaginary) {
      periodicWaveCount += 1;
      assert.equal(real.length, imaginary.length);
      assert.equal(real[0], 0);
      assert.equal(imaginary[0], 0);
      return { id: periodicWaveCount };
    }
    createOscillator() {
      const oscillator = new FakeOscillator();
      oscillators.push(oscillator);
      return oscillator;
    }
    resume() {
      resumeCount += 1;
      this.state = "running";
      latestContextState = this.state;
      return Promise.resolve();
    }
    suspend() {
      suspendCount += 1;
      if (deferSuspend) {
        return new Promise((resolve) => {
          resolvePendingSuspend = () => {
            this.state = "suspended";
            latestContextState = this.state;
            resolve();
          };
        });
      }
      this.state = "suspended";
      latestContextState = this.state;
      return Promise.resolve();
    }
    close() {
      this.state = "closed";
      latestContextState = this.state;
      contextClosed = true;
      return Promise.resolve();
    }
  }

  globalThis.window = {
    AudioContext: FakeAudioContext,
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout: (callback) => {
      nextTimerId += 1;
      timers.set(nextTimerId, callback);
      return nextTimerId;
    },
    clearTimeout: (timerId) => timers.delete(timerId)
  };

  const audio = createTetrisAudioController();
  assert.equal(contextCount, 0, "mounting does not create AudioContext before a gesture");
  audio.unlock();
  assert.equal(contextCount, 1);
  assert.equal(resumeCount, 1, "an interrupted mobile audio context is resumed");
  assert.equal(periodicWaveCount, 2, "wave tables are created once per context");
  assert.equal(filterCount, 1);
  assert.equal(compressorCount, 1);
  audio.startMusic(1);
  const firstScheduleCount = oscillators.length;
  assert.ok(firstScheduleCount > 0);
  assert.equal(timers.size, 1);

  audio.startMusic(2);
  assert.equal(contextCount, 1);
  assert.equal(oscillators.length, firstScheduleCount);
  assert.equal(timers.size, 1, "repeated start does not layer schedulers");

  const [queuedTimerId, queuedTimer] = timers.entries().next().value;
  timers.delete(queuedTimerId);
  fakeCurrentTime += 0.35;
  const oscillatorCountBeforeCatchUp = oscillators.length;
  queuedTimer();
  assert.equal(timers.size, 1, "the scheduler re-arms exactly one timer");
  assert.ok(
    oscillators.length - oscillatorCountBeforeCatchUp <= 3,
    "late scheduler callbacks skip stale notes instead of playing a burst"
  );
  const staleCallback = timers.values().next().value;

  audio.pauseMusic();
  assert.equal(timers.size, 0);
  assert.ok(oscillators.every((oscillator) => oscillator.stopped));
  assert.ok(oscillators.every((oscillator) => oscillator.disconnected));
  const oscillatorCountAfterPause = oscillators.length;
  staleCallback();
  assert.equal(timers.size, 0, "a queued callback cannot revive paused music");
  assert.equal(oscillators.length, oscillatorCountAfterPause);

  audio.startMusic(3);
  assert.equal(timers.size, 1);
  audio.stopMusic();
  assert.equal(timers.size, 0);
  const oscillatorCountBeforeRestart = oscillators.length;
  audio.startMusic(3);
  assert.equal(timers.size, 1);
  assert.ok(
    Math.abs(
      oscillators[oscillatorCountBeforeRestart].frequency.value - midiToFrequency(69)
    ) < 0.001,
    "a stopped soundtrack restarts from the opening note"
  );
  audio.playLineClear(4, true);
  deferSuspend = true;
  audio.suspend();
  audio.suspend();
  assert.equal(suspendCount, 1, "duplicate background events share one suspend request");
  assert.equal(timers.size, 0);
  assert.ok(
    oscillators.every((oscillator) => oscillator.stopped),
    "background suspension silences music and effects"
  );
  assert.ok(oscillators.every((oscillator) => oscillator.disconnected));
  audio.startMusic(4);
  assert.equal(timers.size, 1);
  assert.equal(resumeCount, 1, "resume waits for an in-flight suspend request");
  resolvePendingSuspend();
  deferSuspend = false;
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(resumeCount, 2, "resuming play wakes the suspended audio context");
  assert.equal(latestContextState, "running");
  assert.equal(periodicWaveCount, 2, "persistent audio nodes are not recreated on resume");
  assert.equal(filterCount, 1);
  assert.equal(compressorCount, 1);
  audio.play("move");
  const oscillatorCountBeforeMute = oscillators.length;
  audio.setEnabled(false);
  assert.equal(timers.size, 0);
  assert.equal(suspendCount, 2);
  assert.ok(oscillators.every((oscillator) => oscillator.stopped));
  assert.ok(oscillators.every((oscillator) => oscillator.disconnected));
  audio.play("move");
  audio.playLineClear(4, true);
  assert.equal(oscillators.length, oscillatorCountBeforeMute, "muted effects are not created");

  audio.setEnabled(true);
  assert.equal(timers.size, 1, "unmuting an active game restores one scheduler");
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(resumeCount, 3);
  assert.equal(latestContextState, "running");
  const oscillatorCountBeforeDestroy = oscillators.length;
  audio.destroy();
  await Promise.resolve();
  assert.equal(timers.size, 0);
  assert.equal(contextClosed, true);
  audio.startMusic();
  audio.play("move");
  audio.setEnabled(false);
  audio.destroy();
  assert.equal(timers.size, 0);
  assert.equal(oscillators.length, oscillatorCountBeforeDestroy);

  delete globalThis.window;
});
