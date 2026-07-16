import { loadTetrisAudioEnabled, saveTetrisAudioEnabled } from "./storage.ts";
import type { TetrisState } from "./tetrisState.ts";

export type TetrisAudioCue =
  | "move"
  | "rotate"
  | "soft-drop"
  | "hard-drop"
  | "lock"
  | "start"
  | "pause"
  | "resume"
  | "game-over";

export type TetrisAudioAction = "left" | "right" | "rotate" | "down" | "drop";

export type TetrisTransitionAudio =
  | Readonly<{ kind: "cue"; cue: TetrisAudioCue }>
  | Readonly<{ kind: "line-clear"; count: number; levelUp: boolean }>
  | null;

export type TetrisMusicNote = Readonly<{
  midi: number | null;
  steps: number;
}>;

export type TetrisLeadStyle = "soft" | "bright";
export type TetrisHarmonyQuality = "min" | "maj" | "dom7";

export type TetrisHarmonyBlock = Readonly<{
  rootMidi: number;
  quality: TetrisHarmonyQuality;
  steps: number;
}>;

export type TetrisMusicSection = Readonly<{
  id: string;
  notes: readonly TetrisMusicNote[];
  harmony: readonly TetrisHarmonyBlock[];
  lead: TetrisLeadStyle;
  transpose?: number;
  arpeggio?: boolean;
  octaveDouble?: boolean;
}>;

export type TetrisAudioController = {
  readonly enabled: boolean;
  unlock: () => void;
  setEnabled: (enabled: boolean) => void;
  startMusic: (level?: number) => void;
  pauseMusic: () => void;
  stopMusic: () => void;
  suspend: () => void;
  play: (cue: TetrisAudioCue) => void;
  playLineClear: (count: number, levelUp?: boolean) => void;
  destroy: () => void;
};

// A fresh Web Audio chiptune arrangement of the public-domain folk melody
// "Korobeiniki". No recording or game audio asset is copied into the project.
const INTRO = melody([
  [69, 2], [72, 2], [76, 2], [81, 1], [null, 1],
  [77, 2], [72, 2], [69, 2], [72, 1], [null, 1],
  [74, 2], [77, 2], [69, 2], [74, 1], [null, 1],
  [71, 2], [68, 2], [71, 2], [76, 1], [null, 1]
]);

const THEME_A = melody([
  [76, 2], [71, 1], [72, 1], [74, 2], [72, 1], [71, 1],
  [69, 2], [69, 1], [72, 1], [76, 2], [74, 1], [72, 1],
  [71, 2], [71, 1], [72, 1], [74, 2], [76, 2], [72, 2], [69, 2], [69, 2],
  [74, 2], [77, 1], [81, 2], [79, 1], [77, 1], [76, 2],
  [72, 1], [76, 2], [74, 1], [72, 1], [71, 2], [71, 1], [72, 1],
  [74, 2], [76, 2], [72, 2], [69, 2], [69, 2]
]);

const THEME_A_VARIATION = melody([
  [76, 1], [77, 1], [71, 1], [72, 1], [74, 2], [72, 1], [71, 1],
  [69, 2], [72, 1], [71, 1], [76, 2], [74, 1], [72, 1],
  [71, 1], [72, 1], [71, 1], [72, 1], [74, 2], [76, 1], [77, 1],
  [72, 2], [69, 2], [69, 1], [72, 1],
  [74, 1], [76, 1], [77, 1], [81, 2], [79, 1], [77, 1], [76, 1], [77, 1],
  [72, 1], [76, 1], [77, 1], [74, 1], [72, 1], [71, 1], [72, 1], [71, 1],
  [72, 1], [74, 2], [76, 2], [72, 1], [71, 1], [69, 2], [72, 1], [69, 1]
]);

const THEME_B = melody([
  [76, 2], [72, 2], [74, 2], [71, 2], [72, 2], [69, 2], [68, 2], [71, 2],
  [76, 2], [72, 2], [74, 2], [71, 2], [72, 1], [76, 1], [81, 2], [80, 2],
  [76, 2], [72, 2], [74, 2], [71, 2], [72, 2], [69, 2], [68, 2], [71, 2],
  [76, 2], [72, 2], [74, 2], [71, 2], [72, 1], [76, 1], [81, 2], [80, 2]
]);

const THEME_B_VARIATION = melody([
  [76, 2], [72, 1], [74, 1], [74, 2], [71, 2], [72, 2], [69, 1], [71, 1],
  [68, 2], [71, 2], [76, 1], [77, 1], [72, 2], [74, 1], [76, 1], [71, 2],
  [72, 1], [76, 1], [81, 1], [83, 1], [80, 2],
  [76, 2], [72, 2], [74, 1], [76, 1], [71, 2], [72, 1], [74, 1], [69, 2],
  [68, 1], [69, 1], [71, 2], [76, 2], [72, 1], [71, 1], [74, 2], [71, 1],
  [72, 1], [72, 1], [76, 1], [81, 2], [80, 1], [81, 1]
]);

const BRIDGE = melody([
  [69, 2], [72, 2], [76, 2], [81, 1], [null, 1],
  [80, 2], [76, 2], [74, 2], [71, 2],
  [69, 2], [74, 2], [77, 2], [81, 1], [null, 1],
  [80, 2], [76, 2], [71, 2], [68, 2],
  [69, 1], [71, 1], [72, 2], [76, 2], [72, 1], [null, 1],
  [74, 1], [76, 1], [77, 2], [81, 2], [77, 2],
  [80, 1], [81, 1], [83, 2], [80, 2], [76, 1], [null, 1],
  [81, 2], [76, 2], [72, 2], [69, 2]
]);

const OUTRO = melody([
  [76, 2], [72, 2], [69, 2], [72, 2],
  [77, 2], [74, 2], [69, 2], [74, 2],
  [80, 2], [83, 2], [76, 2], [74, 2],
  [71, 2], [68, 2], [71, 2], [76, 2]
]);

const INTRO_HARMONY = harmony([
  [45, "min", 8], [41, "maj", 8], [38, "min", 8], [40, "dom7", 8]
]);
const THEME_A_HARMONY = harmony([
  [40, "dom7", 8], [45, "min", 8], [40, "dom7", 8], [45, "min", 6],
  [38, "min", 9], [45, "min", 7], [40, "dom7", 6], [45, "min", 6]
]);
const THEME_B_HARMONY = harmony([
  [45, "min", 12], [40, "dom7", 4], [45, "min", 12], [40, "dom7", 2],
  [45, "min", 12], [40, "dom7", 4], [45, "min", 12], [40, "dom7", 2]
]);
const BRIDGE_HARMONY = harmony([
  [45, "min", 8], [40, "dom7", 8], [38, "min", 8], [40, "dom7", 8],
  [45, "min", 8], [38, "min", 8], [40, "dom7", 8], [45, "min", 8]
]);
const OUTRO_HARMONY = harmony([
  [45, "min", 8], [38, "min", 8], [40, "dom7", 8], [40, "dom7", 8]
]);

export const TETRIS_MUSIC_SECTIONS: readonly TetrisMusicSection[] = Object.freeze([
  section("intro", INTRO, INTRO_HARMONY, "soft"),
  section("a1", THEME_A, THEME_A_HARMONY, "soft"),
  section("b1", THEME_B, THEME_B_HARMONY, "bright", { arpeggio: true }),
  section("a2", THEME_A_VARIATION, THEME_A_HARMONY, "bright", { arpeggio: true }),
  section("b2", THEME_B_VARIATION, THEME_B_HARMONY, "bright", { arpeggio: true }),
  section("bridge", BRIDGE, BRIDGE_HARMONY, "soft"),
  section("a-low", THEME_A, THEME_A_HARMONY, "soft", { transpose: -12 }),
  section("b-low", THEME_B_VARIATION, THEME_B_HARMONY, "soft", { transpose: -12 }),
  section("a-final", THEME_A_VARIATION, THEME_A_HARMONY, "bright", {
    arpeggio: true,
    octaveDouble: true
  }),
  section("b-final", THEME_B, THEME_B_HARMONY, "bright", {
    arpeggio: true,
    octaveDouble: true
  }),
  section("outro", OUTRO, OUTRO_HARMONY, "soft")
]);

export const TETRIS_MUSIC_SEQUENCE: readonly TetrisMusicNote[] = Object.freeze(
  TETRIS_MUSIC_SECTIONS.flatMap((musicSection) => musicSection.notes.map((note) => Object.freeze({
    midi: note.midi === null ? null : note.midi + (musicSection.transpose || 0),
    steps: note.steps
  })))
);

export const TETRIS_MUSIC_TOTAL_STEPS = TETRIS_MUSIC_SEQUENCE.reduce(
  (total, note) => total + note.steps,
  0
);

const MUSIC_LOOKAHEAD_SECONDS = 0.16;
const MUSIC_SCHEDULER_INTERVAL_MS = 55;
const MAX_LEVEL_FOR_TEMPO = 15;
const MIN_STEP_SECONDS = 0.105;
const MAX_STEP_SECONDS = 0.155;

type MusicTimelineEvent = Readonly<
  | {
    kind: "lead";
    midi: number;
    steps: number;
    style: TetrisLeadStyle;
    octaveDouble: boolean;
  }
  | { kind: "bass"; midi: number; steps: number }
  | { kind: "arp"; midi: number; steps: number }
>;

type MusicWaveSet = Readonly<{
  soft: PeriodicWave | null;
  bright: PeriodicWave | null;
}>;

const CHORD_INTERVALS: Record<TetrisHarmonyQuality, readonly number[]> = {
  min: [0, 3, 7],
  maj: [0, 4, 7],
  dom7: [0, 4, 7, 10]
};

const TETRIS_MUSIC_TIMELINE = buildMusicTimeline(TETRIS_MUSIC_SECTIONS);

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function tetrisMusicStepSeconds(level: number): number {
  const safeLevel = Number.isFinite(level)
    ? Math.max(1, Math.min(MAX_LEVEL_FOR_TEMPO, Math.floor(level)))
    : 1;
  return Math.max(MIN_STEP_SECONDS, MAX_STEP_SECONDS - (safeLevel - 1) * 0.004);
}

export function midiToFrequency(midi: number): number {
  const safeMidi = Number.isFinite(midi) ? midi : 69;
  return 440 * 2 ** ((safeMidi - 69) / 12);
}

export function tetrisAudioForTransition(
  previousState: TetrisState,
  nextState: TetrisState,
  action: TetrisAudioAction | null
): TetrisTransitionAudio {
  if (nextState === previousState) return null;
  if (previousState.phase === "playing" && nextState.phase === "gameover") {
    return { kind: "cue", cue: "game-over" };
  }

  const clearedLines = nextState.lines - previousState.lines;
  if (clearedLines > 0) {
    return {
      kind: "line-clear",
      count: clearedLines,
      levelUp: nextState.level > previousState.level
    };
  }

  if (nextState.board !== previousState.board) {
    return { kind: "cue", cue: action === "drop" ? "hard-drop" : "lock" };
  }
  if (action === "left" || action === "right") return { kind: "cue", cue: "move" };
  if (action === "rotate") return { kind: "cue", cue: "rotate" };
  if (action === "down") return { kind: "cue", cue: "soft-drop" };
  return null;
}

export function createTetrisAudioController(): TetrisAudioController {
  let enabled = loadTetrisAudioEnabled();
  let destroyed = false;
  let wantsMusic = false;
  let musicLevel = 1;
  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let musicGain: GainNode | null = null;
  let effectsGain: GainNode | null = null;
  let musicWaves: MusicWaveSet = { soft: null, bright: null };
  let contextSuspendPromise: Promise<void> | null = null;
  let resumeAfterSuspend = false;
  let schedulerTimer: number | null = null;
  let nextMusicAt = 0;
  let musicStep = 0;
  let lastSoftDropAt = Number.NEGATIVE_INFINITY;
  const scheduledMusic = new Set<OscillatorNode>();
  const scheduledEffects = new Set<OscillatorNode>();

  const controller: TetrisAudioController = {
    get enabled() {
      return enabled;
    },

    unlock(): void {
      if (!enabled || destroyed) return;
      const audioContext = ensureContext();
      if (!audioContext || audioContext.state === "closed") return;
      if (contextSuspendPromise) {
        resumeAfterSuspend = true;
        return;
      }
      if (audioContext.state === "running") return;
      requestContextResume(audioContext);
    },

    setEnabled(nextEnabled: boolean): void {
      if (destroyed || enabled === nextEnabled) return;
      enabled = nextEnabled;
      saveTetrisAudioEnabled(enabled);

      if (!enabled) {
        silenceAll();
        return;
      }

      controller.unlock();
      setMasterVolume(true);
      if (wantsMusic) beginMusicScheduler(true);
    },

    startMusic(level = 1): void {
      if (destroyed) return;
      wantsMusic = true;
      musicLevel = normalizeLevel(level);
      if (!enabled) return;
      controller.unlock();
      beginMusicScheduler(schedulerTimer === null);
    },

    pauseMusic(): void {
      wantsMusic = false;
      stopMusicScheduler();
      stopOscillators(scheduledMusic);
    },

    stopMusic(): void {
      wantsMusic = false;
      stopMusicScheduler();
      stopOscillators(scheduledMusic);
      nextMusicAt = 0;
      musicStep = 0;
    },

    suspend(): void {
      wantsMusic = false;
      stopMusicScheduler();
      stopOscillators(scheduledMusic);
      stopOscillators(scheduledEffects);
      requestContextSuspend();
    },

    play(cue: TetrisAudioCue): void {
      if (!enabled || destroyed) return;
      controller.unlock();
      const audioContext = ensureContext();
      const output = effectsGain;
      if (!audioContext || !output) return;
      if (cue === "soft-drop") {
        if (audioContext.currentTime - lastSoftDropAt < 0.09) return;
        lastSoftDropAt = audioContext.currentTime;
      }
      scheduleCue(audioContext, output, scheduledEffects, cue);
    },

    playLineClear(count: number, levelUp = false): void {
      if (!enabled || destroyed) return;
      controller.unlock();
      const audioContext = ensureContext();
      const output = effectsGain;
      if (!audioContext || !output) return;

      const safeCount = Math.max(1, Math.min(4, Math.floor(Number.isFinite(count) ? count : 1)));
      const notes = safeCount === 4
        ? [64, 68, 71, 76, 80]
        : [64, 67, 71, 76].slice(0, safeCount + 1);
      const start = audioContext.currentTime + 0.008;
      notes.forEach((midi, index) => {
        scheduleTone(
          audioContext,
          output,
          scheduledEffects,
          midiToFrequency(midi + (levelUp ? 12 : 0)),
          start + index * 0.055,
          safeCount === 4 ? 0.16 : 0.11,
          safeCount === 4 ? "square" : "triangle",
          safeCount === 4 ? 0.2 : 0.15
        );
      });
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      wantsMusic = false;
      stopMusicScheduler();
      stopOscillators(scheduledMusic);
      stopOscillators(scheduledEffects);
      const audioContext = context;
      context = null;
      masterGain = null;
      musicGain = null;
      effectsGain = null;
      musicWaves = { soft: null, bright: null };
      contextSuspendPromise = null;
      resumeAfterSuspend = false;
      if (audioContext && audioContext.state !== "closed") {
        void audioContext.close().catch(() => undefined);
      }
    }
  };

  return controller;

  function ensureContext(): AudioContext | null {
    if (context || destroyed || typeof window === "undefined") return context;
    const AudioContextConstructor = window.AudioContext
      || (window as AudioWindow).webkitAudioContext;
    if (!AudioContextConstructor) return null;

    try {
      context = new AudioContextConstructor();
      masterGain = context.createGain();
      musicGain = context.createGain();
      effectsGain = context.createGain();
      masterGain.gain.value = enabled ? 0.72 : 0;
      musicGain.gain.value = 0.3;
      effectsGain.gain.value = 0.42;

      let musicOutput: AudioNode = musicGain;
      if (typeof context.createBiquadFilter === "function") {
        try {
          const filter = context.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 2_450;
          filter.Q.value = 0.7;
          musicOutput.connect(filter);
          musicOutput = filter;
        } catch {
          // The unfiltered music bus remains available as a safe fallback.
        }
      }
      if (typeof context.createDynamicsCompressor === "function") {
        try {
          const compressor = context.createDynamicsCompressor();
          compressor.threshold.value = -18;
          compressor.knee.value = 12;
          compressor.ratio.value = 3;
          compressor.attack.value = 0.008;
          compressor.release.value = 0.22;
          musicOutput.connect(compressor);
          musicOutput = compressor;
        } catch {
          // Compression is optional in older embedded WebViews.
        }
      }
      musicOutput.connect(masterGain);
      effectsGain.connect(masterGain);
      masterGain.connect(context.destination);
      musicWaves = createMusicWaves(context);
      return context;
    } catch {
      context = null;
      masterGain = null;
      musicGain = null;
      effectsGain = null;
      musicWaves = { soft: null, bright: null };
      return null;
    }
  }

  function setMasterVolume(audible: boolean): void {
    if (!context || !masterGain) return;
    const now = context.currentTime;
    try {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(audible ? 0.72 : 0, now, 0.012);
    } catch {
      masterGain.gain.value = audible ? 0.72 : 0;
    }
  }

  function silenceAll(): void {
    stopMusicScheduler();
    stopOscillators(scheduledMusic);
    stopOscillators(scheduledEffects);
    setMasterVolume(false);
    requestContextSuspend();
  }

  function beginMusicScheduler(restartPosition: boolean): void {
    if (!enabled || destroyed || !wantsMusic || schedulerTimer !== null) return;
    const audioContext = ensureContext();
    if (!audioContext || !musicGain) return;
    setMasterVolume(true);
    if (restartPosition || nextMusicAt < audioContext.currentTime - 0.25) {
      nextMusicAt = audioContext.currentTime + 0.04;
    }
    scheduleMusic();
  }

  function scheduleMusic(): void {
    schedulerTimer = null;
    const audioContext = context;
    const output = musicGain;
    if (!enabled || destroyed || !wantsMusic || !audioContext || !output) return;

    if (nextMusicAt < audioContext.currentTime - 0.25) {
      nextMusicAt = audioContext.currentTime + 0.04;
    }
    const stepSeconds = tetrisMusicStepSeconds(musicLevel);
    const horizon = audioContext.currentTime + MUSIC_LOOKAHEAD_SECONDS;

    const lateness = audioContext.currentTime - nextMusicAt;
    if (lateness > stepSeconds * 0.5) {
      const missedSteps = Math.max(1, Math.ceil(lateness / stepSeconds));
      musicStep = (musicStep + missedSteps) % TETRIS_MUSIC_TIMELINE.length;
      nextMusicAt = audioContext.currentTime + 0.02;
    }

    while (nextMusicAt < horizon) {
      const events = TETRIS_MUSIC_TIMELINE[musicStep] || [];
      events.forEach((event) => {
        scheduleMusicEvent(
          audioContext,
          output,
          scheduledMusic,
          event,
          nextMusicAt,
          stepSeconds,
          musicWaves
        );
      });
      nextMusicAt += stepSeconds;
      musicStep = (musicStep + 1) % TETRIS_MUSIC_TIMELINE.length;
    }

    schedulerTimer = window.setTimeout(scheduleMusic, MUSIC_SCHEDULER_INTERVAL_MS);
  }

  function stopMusicScheduler(): void {
    if (schedulerTimer === null || typeof window === "undefined") return;
    window.clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }

  function requestContextSuspend(): void {
    const audioContext = context;
    resumeAfterSuspend = false;
    if (
      !audioContext
      || audioContext.state === "closed"
      || audioContext.state === "suspended"
      || typeof audioContext.suspend !== "function"
      || contextSuspendPromise
    ) return;
    try {
      const suspendPromise = audioContext.suspend().catch(() => undefined);
      contextSuspendPromise = suspendPromise;
      void suspendPromise.finally(() => {
        if (context !== audioContext || contextSuspendPromise !== suspendPromise) return;
        contextSuspendPromise = null;
        const shouldResume = resumeAfterSuspend && enabled && !destroyed;
        resumeAfterSuspend = false;
        if (shouldResume) requestContextResume(audioContext);
      });
    } catch {
      contextSuspendPromise = null;
      resumeAfterSuspend = false;
    }
  }

  function requestContextResume(audioContext: AudioContext): void {
    try {
      void audioContext.resume().catch(() => undefined);
    } catch {
      // Resume may be rejected by autoplay policy; gameplay must continue.
    }
  }
}

function harmony(
  entries: ReadonlyArray<readonly [number, TetrisHarmonyQuality, number]>
): readonly TetrisHarmonyBlock[] {
  return Object.freeze(entries.map(([rootMidi, quality, steps]) => Object.freeze({
    rootMidi,
    quality,
    steps
  })));
}

function section(
  id: string,
  notes: readonly TetrisMusicNote[],
  sectionHarmony: readonly TetrisHarmonyBlock[],
  lead: TetrisLeadStyle,
  options: Readonly<{
    transpose?: number;
    arpeggio?: boolean;
    octaveDouble?: boolean;
  }> = {}
): TetrisMusicSection {
  return Object.freeze({ id, notes, harmony: sectionHarmony, lead, ...options });
}

function buildMusicTimeline(
  sections: readonly TetrisMusicSection[]
): readonly (readonly MusicTimelineEvent[])[] {
  const timeline: MusicTimelineEvent[][] = [];

  sections.forEach((musicSection) => {
    const sectionStart = timeline.length;
    const sectionSteps = musicSection.notes.reduce((total, note) => total + note.steps, 0);
    for (let index = 0; index < sectionSteps; index += 1) timeline.push([]);

    let noteStep = 0;
    musicSection.notes.forEach((note) => {
      if (note.midi !== null) {
        addTimelineEvent(timeline, sectionStart + noteStep, {
          kind: "lead",
          midi: note.midi + (musicSection.transpose || 0),
          steps: note.steps,
          style: musicSection.lead,
          octaveDouble: Boolean(musicSection.octaveDouble)
        });
      }
      noteStep += note.steps;
    });

    let chordStep = 0;
    musicSection.harmony.forEach((chord) => {
      for (let offset = 0; offset < chord.steps; offset += 4) {
        const remainingSteps = chord.steps - offset;
        const beat = Math.floor(offset / 4);
        addTimelineEvent(timeline, sectionStart + chordStep + offset, {
          kind: "bass",
          midi: chord.rootMidi + (beat % 2 === 0 ? 0 : 7),
          steps: Math.min(3, remainingSteps)
        });

        if (musicSection.arpeggio && offset + 2 < chord.steps) {
          const intervals = CHORD_INTERVALS[chord.quality];
          addTimelineEvent(timeline, sectionStart + chordStep + offset + 2, {
            kind: "arp",
            midi: chord.rootMidi + 12 + intervals[beat % intervals.length],
            steps: 1
          });
        }
      }
      chordStep += chord.steps;
    });
  });

  return Object.freeze(timeline.map((events) => Object.freeze(events)));
}

function addTimelineEvent(
  timeline: MusicTimelineEvent[][],
  step: number,
  event: MusicTimelineEvent
): void {
  if (!timeline[step]) return;
  timeline[step].push(Object.freeze(event));
}

function createMusicWaves(context: AudioContext): MusicWaveSet {
  if (typeof context.createPeriodicWave !== "function") {
    return { soft: null, bright: null };
  }

  const real = new Float32Array(9);
  let soft: PeriodicWave | null = null;
  let bright: PeriodicWave | null = null;
  try {
    soft = context.createPeriodicWave(
      real,
      new Float32Array([0, 1, 0, 0.22, 0, 0.075, 0, 0.03, 0])
    );
  } catch {
    // Built-in oscillator shapes remain available as a fallback.
  }
  try {
    bright = context.createPeriodicWave(
      real,
      new Float32Array([0, 1, 0.11, 0.3, 0.065, 0.13, 0.04, 0.06, 0.025])
    );
  } catch {
    // Built-in oscillator shapes remain available as a fallback.
  }
  return { soft, bright };
}

function scheduleMusicEvent(
  context: AudioContext,
  output: GainNode,
  registry: Set<OscillatorNode>,
  event: MusicTimelineEvent,
  startAt: number,
  stepSeconds: number,
  waves: MusicWaveSet
): void {
  if (event.kind === "lead") {
    scheduleMusicTone(context, output, registry, {
      frequency: midiToFrequency(event.midi),
      startAt,
      duration: event.steps * stepSeconds * 0.94,
      type: event.style === "soft" ? "triangle" : "square",
      wave: waves[event.style],
      volume: event.style === "soft" ? 0.095 : 0.08,
      sustain: event.style === "soft" ? 0.68 : 0.6
    });
    if (event.octaveDouble && event.midi - 12 >= 36) {
      scheduleMusicTone(context, output, registry, {
        frequency: midiToFrequency(event.midi - 12),
        startAt,
        duration: event.steps * stepSeconds * 0.9,
        type: "triangle",
        wave: null,
        volume: 0.024,
        sustain: 0.58
      });
    }
    return;
  }

  if (event.kind === "bass") {
    scheduleMusicTone(context, output, registry, {
      frequency: midiToFrequency(event.midi),
      startAt,
      duration: event.steps * stepSeconds * 0.82,
      type: "triangle",
      wave: null,
      volume: 0.065,
      sustain: 0.52
    });
    return;
  }

  scheduleMusicTone(context, output, registry, {
    frequency: midiToFrequency(event.midi),
    startAt,
    duration: event.steps * stepSeconds * 0.86,
    type: "sine",
    wave: null,
    volume: 0.028,
    sustain: 0.48
  });
}

function scheduleMusicTone(
  context: AudioContext,
  output: GainNode,
  registry: Set<OscillatorNode>,
  options: Readonly<{
    frequency: number;
    startAt: number;
    duration: number;
    type: OscillatorType;
    wave: PeriodicWave | null;
    volume: number;
    sustain: number;
  }>
): void {
  const { frequency, startAt, duration, type, wave, volume, sustain } = options;
  if (
    !Number.isFinite(frequency)
    || !Number.isFinite(startAt)
    || !Number.isFinite(duration)
    || !Number.isFinite(volume)
    || !Number.isFinite(sustain)
    || frequency <= 0
    || duration <= 0
    || volume <= 0
  ) return;

  try {
    const safeStart = Math.max(context.currentTime, startAt);
    const safeDuration = Math.min(1.2, Math.max(0.04, duration));
    const stopAt = safeStart + safeDuration;
    const attackAt = safeStart + Math.min(0.008, safeDuration * 0.18);
    const releaseDuration = Math.min(0.035, safeDuration * 0.28);
    const releaseAt = Math.max(attackAt + 0.01, stopAt - releaseDuration);
    const decayAt = Math.min(releaseAt, attackAt + Math.min(0.032, safeDuration * 0.24));
    const peak = Math.max(0.001, Math.min(0.2, volume));
    const sustainVolume = Math.max(0.0002, peak * Math.max(0.1, Math.min(0.9, sustain)));
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    if (wave && typeof oscillator.setPeriodicWave === "function") oscillator.setPeriodicWave(wave);
    else oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, safeStart);
    envelope.gain.setValueAtTime(0.0001, safeStart);
    envelope.gain.exponentialRampToValueAtTime(peak, attackAt);
    envelope.gain.exponentialRampToValueAtTime(sustainVolume, decayAt);
    envelope.gain.setValueAtTime(sustainVolume, releaseAt);
    envelope.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    oscillator.connect(envelope).connect(output);
    registry.add(oscillator);
    oscillator.addEventListener("ended", () => registry.delete(oscillator), { once: true });
    oscillator.start(safeStart);
    oscillator.stop(stopAt + 0.012);
  } catch {
    // Music is optional and must never interrupt the game loop.
  }
}

function melody(entries: ReadonlyArray<readonly [number | null, number]>): readonly TetrisMusicNote[] {
  return Object.freeze(entries.map(([midi, steps]) => Object.freeze({ midi, steps })));
}

function normalizeLevel(level: number): number {
  return Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
}

function scheduleCue(
  context: AudioContext,
  output: GainNode,
  registry: Set<OscillatorNode>,
  cue: TetrisAudioCue
): void {
  const now = context.currentTime + 0.005;
  if (cue === "move") {
    scheduleTone(context, output, registry, 150, now, 0.035, "square", 0.07, 185);
    return;
  }
  if (cue === "rotate") {
    scheduleTone(context, output, registry, 390, now, 0.06, "square", 0.1, 560);
    return;
  }
  if (cue === "soft-drop") {
    scheduleTone(context, output, registry, 105, now, 0.028, "triangle", 0.055, 88);
    return;
  }
  if (cue === "hard-drop") {
    scheduleTone(context, output, registry, 145, now, 0.095, "square", 0.15, 58);
    return;
  }
  if (cue === "lock") {
    scheduleTone(context, output, registry, 92, now, 0.07, "triangle", 0.12, 66);
    return;
  }
  if (cue === "start" || cue === "resume") {
    [57, 64, 69].forEach((midi, index) => {
      scheduleTone(context, output, registry, midiToFrequency(midi), now + index * 0.045, 0.09, "square", 0.1);
    });
    return;
  }
  if (cue === "pause") {
    [64, 57].forEach((midi, index) => {
      scheduleTone(context, output, registry, midiToFrequency(midi), now + index * 0.05, 0.08, "triangle", 0.09);
    });
    return;
  }

  [64, 59, 52, 40].forEach((midi, index) => {
    scheduleTone(context, output, registry, midiToFrequency(midi), now + index * 0.11, 0.18, "sawtooth", 0.13);
  });
}

function scheduleTone(
  context: AudioContext,
  output: GainNode,
  registry: Set<OscillatorNode>,
  startFrequency: number,
  startAt: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  endFrequency = startFrequency
): void {
  if (
    !Number.isFinite(startFrequency)
    || !Number.isFinite(endFrequency)
    || !Number.isFinite(startAt)
    || !Number.isFinite(duration)
    || startFrequency <= 0
    || endFrequency <= 0
    || duration <= 0
  ) return;

  try {
    const safeStart = Math.max(context.currentTime, startAt);
    const safeDuration = Math.min(0.8, Math.max(0.018, duration));
    const stopAt = safeStart + safeDuration;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, safeStart);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, stopAt);
    envelope.gain.setValueAtTime(0.0001, safeStart);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.001, Math.min(0.25, volume)), safeStart + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    oscillator.connect(envelope).connect(output);
    registry.add(oscillator);
    oscillator.addEventListener("ended", () => registry.delete(oscillator), { once: true });
    oscillator.start(safeStart);
    oscillator.stop(stopAt + 0.012);
  } catch {
    // Audio feedback is optional and must never affect the game loop.
  }
}

function stopOscillators(registry: Set<OscillatorNode>): void {
  registry.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      // The oscillator may already have finished between scheduling and cleanup.
    }
    try {
      oscillator.disconnect();
    } catch {
      // A disconnected oscillator still needs to be removed from the registry.
    }
  });
  registry.clear();
}
