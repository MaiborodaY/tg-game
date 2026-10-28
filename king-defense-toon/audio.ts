const BOW_SHOT_URL = new URL('./assets/audio/bow-short-whoosh-v2.wav', import.meta.url).href;
// Bow audio stays dormant until the sound rework; saved mute preferences remain intact.
const BOW_SFX_ENABLED = false;
const MUTED_STORAGE_KEY = 'brotd-infinity:sound-muted:v1';
const MASTER_GAIN = 0.05;
const MAX_VOICES = 4;
const MIN_SHOT_INTERVAL = 0.035;

type AudioContextHost = {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

export interface BattleAudio {
  readonly enabled: boolean;
  readonly muted: boolean;
  readonly supported: boolean;
  unlock: () => Promise<boolean>;
  setMuted: (value: boolean) => void;
  setActive: (value: boolean) => void;
  playBowShot: () => boolean;
  stop: () => void;
  destroy: () => void;
}

function audioContextClass(): typeof AudioContext | undefined {
  const host: AudioContextHost = globalThis;
  return host.AudioContext || host.webkitAudioContext;
}

function settleContextCall(context: AudioContext | null | undefined, method: 'suspend' | 'close'): void {
  try {
    Promise.resolve(context?.[method]?.()).catch(() => {});
  } catch { /* Audio can remain unavailable without interrupting the game. */ }
}

export function createBattleAudio(): BattleAudio {
  let muted = false;
  try { muted = globalThis.localStorage?.getItem(MUTED_STORAGE_KEY) === '1'; } catch { /* Storage is optional. */ }

  let active = false;
  let destroyed = false;
  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let buffer: AudioBuffer | null = null;
  let loading: Promise<AudioBuffer | null> | null = null;
  let generation = 0;
  let authorizedGeneration: number | null = null;
  let lastShotAt = -Infinity;
  const voices = new Set<AudioBufferSourceNode>();

  function releaseVoice(source: AudioBufferSourceNode, stopSource: boolean): void {
    source.onended = null;
    if (stopSource) {
      try { source.stop(); } catch { /* Already ended or not started. */ }
    }
    try { source.disconnect(); } catch { /* Already disconnected. */ }
    voices.delete(source);
  }

  function stop() {
    for (const source of voices) releaseVoice(source, true);
    lastShotAt = -Infinity;
  }

  function mayRun() {
    return BOW_SFX_ENABLED && !destroyed && active && !muted && authorizedGeneration === generation;
  }

  function suspendUnwantedContext(candidate: AudioContext): void {
    // A stale resume must not undo a pause, or suspend a newer authorized resume.
    if (candidate === context && !mayRun()) settleContextCall(candidate, 'suspend');
  }

  function ensureContext(): AudioContext | null {
    if (context && context.state !== 'closed') return context;
    const Context = audioContextClass();
    if (typeof Context !== 'function' || typeof globalThis.fetch !== 'function') return null;
    let candidate: AudioContext | undefined;
    try {
      candidate = new Context();
      if (typeof candidate.decodeAudioData !== 'function'
          || typeof candidate.createBufferSource !== 'function'
          || typeof candidate.resume !== 'function') throw new Error('Audio unavailable');
      const gain = candidate.createGain();
      gain.gain.value = MASTER_GAIN;
      gain.connect(candidate.destination);
      context = candidate;
      masterGain = gain;
      return context;
    } catch {
      settleContextCall(candidate, 'close');
      return null;
    }
  }

  function loadBuffer(candidate: AudioContext): Promise<AudioBuffer | null> {
    if (buffer) return Promise.resolve(buffer);
    if (loading) return loading;
    const task: Promise<AudioBuffer | null> = (async () => {
      const response = await globalThis.fetch(BOW_SHOT_URL);
      if (!response.ok) return null;
      const data = await response.arrayBuffer();
      if (destroyed || candidate !== context) return null;
      const decoded = await candidate.decodeAudioData(data);
      if (destroyed || candidate !== context) return null;
      buffer = decoded;
      return buffer;
    })().catch(() => null).finally(() => {
      if (loading === task) loading = null;
    });
    loading = task;
    return task;
  }

  async function unlock(): Promise<boolean> {
    if (!BOW_SFX_ENABLED || destroyed || !active || muted) return false;
    const candidate = ensureContext();
    if (!candidate) return false;
    const requestedGeneration = generation;
    authorizedGeneration = generation;
    try {
      // Called directly by the user's gesture, before any fetch/decode await.
      if (candidate.state !== 'running') await candidate.resume();
      if (requestedGeneration !== generation || !mayRun() || candidate !== context) {
        suspendUnwantedContext(candidate);
        return false;
      }
      const loaded = await loadBuffer(candidate);
      if (requestedGeneration !== generation || !mayRun() || candidate !== context) {
        suspendUnwantedContext(candidate);
        return false;
      }
      return Boolean(loaded) && candidate.state === 'running';
    } catch {
      suspendUnwantedContext(candidate);
      return false;
    }
  }

  function setMuted(value: boolean): void {
    if (!BOW_SFX_ENABLED || destroyed) return;
    const nextMuted = Boolean(value);
    if (nextMuted === muted) return;
    muted = nextMuted;
    try { globalThis.localStorage?.setItem(MUTED_STORAGE_KEY, muted ? '1' : '0'); } catch { /* Storage is optional. */ }
    if (muted) {
      generation += 1;
      authorizedGeneration = null;
      stop();
      settleContextCall(context, 'suspend');
    }
  }

  function setActive(value: boolean): void {
    if (destroyed) return;
    const nextActive = Boolean(value);
    if (nextActive === active) return;
    active = nextActive;
    if (!active) {
      generation += 1;
      authorizedGeneration = null;
      stop();
      settleContextCall(context, 'suspend');
    }
  }

  function playBowShot() {
    // Missing audio is dropped, never queued for playback after loading or resume.
    if (!mayRun() || !buffer || context?.state !== 'running'
        || voices.size >= MAX_VOICES) return false;
    const now = context.currentTime;
    if (!Number.isFinite(now) || now - lastShotAt < MIN_SHOT_INTERVAL) return false;
    let source: AudioBufferSourceNode | undefined;
    try {
      source = context.createBufferSource();
      source.buffer = buffer;
      // ensureContext publishes the context only after its connected gain exists.
      source.connect(masterGain!);
      const voice = source;
      source.onended = () => releaseVoice(voice, false);
      voices.add(source);
      source.start(now);
      lastShotAt = now;
      return true;
    } catch {
      if (source) releaseVoice(source, true);
      return false;
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    active = false;
    generation += 1;
    authorizedGeneration = null;
    stop();
    try { masterGain?.disconnect(); } catch { /* Already disconnected. */ }
    settleContextCall(context, 'close');
    buffer = null;
    loading = null;
  }

  return {
    get enabled() { return BOW_SFX_ENABLED; },
    get muted() { return muted; },
    get supported() { return typeof audioContextClass() === 'function' && typeof globalThis.fetch === 'function'; },
    unlock,
    setMuted,
    setActive,
    playBowShot,
    stop,
    destroy,
  };
}
