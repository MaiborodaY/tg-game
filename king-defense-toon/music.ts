export interface LevelMusicOptions {
  onStateChange?: () => void;
}

export interface LevelMusic {
  readonly muted: boolean;
  readonly volume: number;
  readonly supported: boolean;
  setMuted: (value: boolean) => void;
  setVolume: (value: number) => void;
  setLevel: (value: number) => void;
  setActive: (value: boolean) => void;
  unlock: () => Promise<boolean>;
  destroy: () => void;
}

// Safari's prefixed constructor and the existing audio-element hint are local browser boundaries.
type AudioContextHost = { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
type InlineAudioElement = HTMLAudioElement & { playsInline?: boolean };

const LEVEL_ONE_PLAYLIST = [
  new URL('./assets/audio/ambient-level-1.mp3', import.meta.url).href,
  new URL('./assets/audio/ambient-level-1-menu.mp3', import.meta.url).href,
] as const;
const MUTED_STORAGE_KEY = 'brotd-infinity:music-muted:v1';
const VOLUME_STORAGE_KEY = 'brotd-infinity:music-volume:v1';
const LEGACY_MUTED_STORAGE_KEY = 'brotd-infinity:sound-muted:v1';
const DEFAULT_VOLUME = 0.05;

function readPreference(key: string): string | null {
  try { return globalThis.localStorage?.getItem(key) ?? null; }
  catch { return null; }
}

function writePreference(key: string, value: string | number): void {
  try { globalThis.localStorage?.setItem(key, String(value)); }
  catch { /* Private browsing can make storage unavailable. */ }
}

function audioContextClass(): typeof AudioContext | undefined {
  const host: AudioContextHost = globalThis;
  return host.AudioContext || host.webkitAudioContext;
}

export function createLevelMusic({ onStateChange = () => {} }: LevelMusicOptions = {}): LevelMusic {
  const savedVolume = readPreference(VOLUME_STORAGE_KEY);
  let volume = savedVolume !== null && savedVolume.trim() !== '' && Number.isFinite(Number(savedVolume))
    ? Math.max(0, Math.min(1, Number(savedVolume))) : DEFAULT_VOLUME;
  let muted = (readPreference(MUTED_STORAGE_KEY) ?? readPreference(LEGACY_MUTED_STORAGE_KEY)) === '1';
  let active = false, level = 1, authorized = false, destroyed = false, unavailable = false;
  let context: AudioContext | null = null;
  let media: InlineAudioElement | null = null;
  let source: MediaElementAudioSourceNode | null = null;
  let gain: GainNode | null = null;
  let trackIndex = 0;
  let generation = 0;
  let pendingPlayback: Promise<boolean> | null = null;

  function notify(): void {
    if (destroyed) return;
    try { onStateChange(); } catch { /* UI updates must not interrupt audio cleanup. */ }
  }

  function supported(): boolean {
    return !unavailable && typeof audioContextClass() === 'function' && typeof globalThis.Audio === 'function';
  }

  function mayPlay(): boolean {
    return !destroyed && !unavailable && authorized && active && level === 1 && !muted && volume > 0;
  }

  function contextCall(method: 'resume' | 'suspend' | 'close'): Promise<void | boolean> {
    try { return Promise.resolve(context?.[method]?.()).catch(() => false); }
    catch { return Promise.resolve(false); }
  }

  function applyGain(): void {
    const allowed = mayPlay();
    try {
      // MediaElement.volume is not reliably adjustable on iOS; the GainNode is authoritative.
      if (gain) gain.gain.value = allowed ? volume : 0;
      if (media) media.muted = !allowed;
    } catch { /* A closed audio device must not affect the game. */ }
  }

  function pause(): void {
    generation += 1;
    pendingPlayback = null;
    applyGain();
    try { media?.pause(); } catch { /* The element may already be detached. */ }
    if (context && context.state !== 'closed') void contextCall('suspend');
  }

  function stopIfUnwanted(): void {
    // Old resume/play promises may settle after a newer mute, level change or destruction.
    if (mayPlay()) return;
    applyGain();
    try { media?.pause(); } catch { /* Already stopped. */ }
    if (context && context.state !== 'closed') void contextCall('suspend');
  }

  function onTrackEnded(): void {
    // Hidden/muted endings wait for reactivation; queued events from an old source are ignored.
    if (media?.ended && mayPlay()) void start();
  }

  function ensureGraph(): boolean {
    if (context && media && source && gain) return context.state !== 'closed';
    if (!supported() || destroyed) return false;
    try {
      context = new (audioContextClass()!)();
      media = new globalThis.Audio();
      media.preload = 'none';
      media.loop = false;
      media.playsInline = true;
      media.muted = true;
      media.volume = 1;
      gain = context.createGain();
      gain.gain.value = 0;
      source = context.createMediaElementSource(media);
      source.connect(gain);
      gain.connect(context.destination);
      media.addEventListener('play', stopIfUnwanted);
      media.addEventListener('playing', stopIfUnwanted);
      media.addEventListener('ended', onTrackEnded);
      return true;
    } catch {
      unavailable = true;
      pause();
      try { source?.disconnect(); gain?.disconnect(); } catch { /* Partially constructed graph. */ }
      void contextCall('close');
      notify();
      return false;
    }
  }

  function start({ fromGesture = false }: { fromGesture?: boolean } = {}): Promise<boolean> {
    if (destroyed || !authorized || !ensureGraph()) return Promise.resolve(false);
    if (!mayPlay()) {
      if (!fromGesture) { pause(); return Promise.resolve(false); }
      // A tap on another level can authorize the context without loading this track.
      return contextCall('resume').then(() => { stopIfUnwanted(); return false; });
    }
    applyGain();
    // A successful graph creation initializes these references; cleanup never replaces them.
    try {
      // Keep one streaming player. Request the next track only when the previous one ends.
      if (media!.ended) trackIndex = (trackIndex + 1) % LEVEL_ONE_PLAYLIST.length;
      const trackUrl = LEVEL_ONE_PLAYLIST[trackIndex];
      if (media!.getAttribute('src') !== trackUrl) media!.src = trackUrl;
    } catch { return Promise.resolve(false); }
    if (!media!.paused && context!.state === 'running') return Promise.resolve(true);
    if (pendingPlayback && !fromGesture) return pendingPlayback;
    const requestedGeneration = ++generation;
    // Both calls happen synchronously in the gesture stack, before either promise is awaited.
    const resumed = context!.state === 'running' ? Promise.resolve() : contextCall('resume');
    let played: Promise<void>;
    try { played = Promise.resolve(media!.play()); }
    catch { played = Promise.reject(new Error('Music playback unavailable')); }
    const task: Promise<boolean> = Promise.all([resumed, played]).then(() => {
      stopIfUnwanted();
      return requestedGeneration === generation && mayPlay() && !media!.paused && context!.state === 'running';
    }).catch(() => {
      // Autoplay restrictions and interrupted loads are retried on a later user gesture.
      stopIfUnwanted();
      return false;
    }).finally(() => {
      if (pendingPlayback === task) pendingPlayback = null;
    });
    pendingPlayback = task;
    return task;
  }

  function reconcile(): void {
    if (mayPlay()) void start(); else pause();
  }

  function setMuted(value: boolean): void {
    if (destroyed || Boolean(value) === muted) return;
    muted = Boolean(value);
    writePreference(MUTED_STORAGE_KEY, muted ? '1' : '0');
    reconcile();
    notify();
  }

  function setVolume(value: number): void {
    if (destroyed || typeof value !== 'number' || !Number.isFinite(value)) return;
    const next = Math.max(0, Math.min(1, value));
    if (next === volume) return;
    volume = next;
    writePreference(VOLUME_STORAGE_KEY, volume);
    reconcile();
    notify();
  }

  function setLevel(value: number): void {
    if (destroyed || value === level) return;
    level = value;
    reconcile();
  }

  function setActive(value: boolean): void {
    if (destroyed || Boolean(value) === active) return;
    active = Boolean(value);
    reconcile();
  }

  function unlock(): Promise<boolean> {
    if (destroyed) return Promise.resolve(false);
    // Ordinary game taps must leave an already-playing track and its gain untouched.
    if (mayPlay() && media && !media.paused && !media.ended && context?.state === 'running') {
      return Promise.resolve(true);
    }
    authorized = true;
    return start({ fromGesture: true });
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    pause();
    if (media) {
      media.removeEventListener('play', stopIfUnwanted);
      media.removeEventListener('playing', stopIfUnwanted);
      media.removeEventListener('ended', onTrackEnded);
      media.removeAttribute('src');
      try { media.load(); } catch { /* Cancels any in-flight media request. */ }
    }
    try { source?.disconnect(); gain?.disconnect(); } catch { /* Already disconnected. */ }
    void contextCall('close');
  }

  return {
    get muted() { return muted; },
    get volume() { return volume; },
    get supported() { return supported(); },
    setMuted, setVolume, setLevel, setActive, unlock, destroy,
  };
}
