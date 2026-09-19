export const DUNGEON_INTRO_SECONDS = 3;
const START_TIMEOUT_SECONDS = 1;
const STALL_TIMEOUT_SECONDS = 1;
const INTRO_URL = new URL('./assets/dungeons/goblin-cave-intro.mp4', import.meta.url).href;

type IntroVideo = Pick<HTMLVideoElement, 'src' | 'currentTime' | 'readyState' | 'ended' | 'paused'
  | 'play' | 'pause' | 'load' | 'addEventListener' | 'removeEventListener' | 'removeAttribute'>;

export interface DungeonIntroPlayback {
  readonly active: boolean;
  prepare(): Promise<boolean>;
  start(): void;
  frame(dt: number): void;
  setPaused(value: boolean): void;
  skip(): void;
  stop(): void;
  destroy(): void;
}

/** Native media decodes the short clip; only the game's shared frame clock may complete entry. */
export function createDungeonIntroPlayback({ video, onFinish, reducedMotion, source = INTRO_URL }: {
  video: IntroVideo;
  onFinish(): void;
  reducedMotion(): boolean;
  source?: string;
}): DungeonIntroPlayback {
  let active = false, paused = false, destroyed = false, loaded = false, failed = false;
  let started = false, pendingFinish = false, generation = 0;
  let elapsed = 0, startupElapsed = 0, stallElapsed = 0, lastMediaTime = 0;
  let prepared: Promise<boolean> | null = null, resolvePrepared: ((ready: boolean) => void) | null = null;

  function settlePreparation(ready: boolean) {
    resolvePrepared?.(ready); resolvePrepared = null;
  }
  function onReady() { loaded = true; settlePreparation(true); }
  function onError() { failed = true; settlePreparation(false); if (active) pendingFinish = true; }
  function onEnded() { if (active) pendingFinish = true; }
  function onPlaying() {
    if (!active || paused || destroyed) { video.pause(); return; }
    started = true;
  }
  video.addEventListener('loadeddata', onReady);
  video.addEventListener('error', onError);
  video.addEventListener('ended', onEnded);
  video.addEventListener('playing', onPlaying);

  function play() {
    const attempt = ++generation;
    try {
      void video.play().catch(() => {
        // Pausing or replaying intentionally rejects an older play() promise.
        if (active && !paused && !destroyed && attempt === generation) pendingFinish = true;
      });
    } catch { if (active && !paused && !destroyed && attempt === generation) pendingFinish = true; }
  }
  function stop() {
    active = false; paused = false; pendingFinish = false; generation += 1;
    video.pause();
  }
  function finish() {
    if (!active || paused || destroyed) return;
    stop(); settlePreparation(false); onFinish();
  }
  function prepare() {
    if (destroyed || failed || reducedMotion()) return Promise.resolve(false);
    if (loaded || video.readyState >= 2) return Promise.resolve(true);
    if (!prepared) {
      prepared = new Promise<boolean>(resolve => { resolvePrepared = resolve; });
      try { video.src = source; video.load(); }
      catch { onError(); }
    }
    return prepared;
  }
  return {
    get active() { return active; },
    prepare,
    start() {
      if (destroyed || active) return;
      active = true; paused = false; pendingFinish = false; started = false;
      elapsed = 0; startupElapsed = 0; stallElapsed = 0; lastMediaTime = 0;
      if (reducedMotion() || failed) { finish(); return; }
      void prepare();
      try { video.currentTime = 0; } catch { /* Metadata may still be loading on first entry. */ }
      play();
    },
    frame(dt) {
      if (!active || paused || destroyed) return;
      if (pendingFinish || reducedMotion()) { finish(); return; }
      if (!Number.isFinite(dt) || dt <= 0) return;
      if (!started) {
        startupElapsed += dt;
        if (startupElapsed >= START_TIMEOUT_SECONDS) finish();
        return;
      }
      elapsed += dt;
      stallElapsed = video.currentTime > lastMediaTime ? 0 : stallElapsed + dt;
      lastMediaTime = video.currentTime;
      if (video.ended || video.currentTime >= DUNGEON_INTRO_SECONDS
        || elapsed >= DUNGEON_INTRO_SECONDS || stallElapsed >= STALL_TIMEOUT_SECONDS) finish();
    },
    setPaused(value) {
      if (!active || destroyed || paused === value) return;
      paused = value;
      if (paused) { generation += 1; video.pause(); }
      else if (!pendingFinish) play();
    },
    skip() { if (active && !paused) pendingFinish = true; },
    stop,
    destroy() {
      if (destroyed) return;
      stop(); destroyed = true; settlePreparation(false);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('playing', onPlaying);
      video.removeAttribute('src'); video.load();
    },
  };
}

export interface DungeonIntro extends DungeonIntroPlayback { readonly root: HTMLElement; }

export function createDungeonIntro({ parent, onFinish }: { parent: HTMLElement; onFinish(): void }): DungeonIntro {
  const root = document.createElement('section');
  root.id = 'dungeon-intro-screen'; root.className = 'dungeon-intro-screen'; root.hidden = true;
  root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Entering Goblin Cave');
  const video = document.createElement('video');
  video.muted = true; video.defaultMuted = true; video.playsInline = true; video.preload = 'auto';
  video.disablePictureInPicture = true; video.setAttribute('aria-hidden', 'true');
  const skip = document.createElement('button');
  skip.type = 'button'; skip.className = 'dungeon-intro-skip'; skip.textContent = 'Skip';
  skip.setAttribute('aria-label', 'Skip cave introduction');
  root.append(video, skip); parent.append(root);
  const playback = createDungeonIntroPlayback({ video, onFinish,
    reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  function onSkip() { playback.skip(); }
  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); playback.skip(); }
    if (event.key === 'Tab') { event.preventDefault(); skip.focus({ preventScroll: true }); }
  }
  skip.addEventListener('click', onSkip); root.addEventListener('keydown', onKey);
  return {
    root,
    get active() { return playback.active; },
    prepare: () => playback.prepare(),
    start() { playback.start(); if (playback.active) skip.focus({ preventScroll: true }); },
    frame: dt => playback.frame(dt),
    setPaused: value => playback.setPaused(value),
    skip: () => playback.skip(),
    stop: () => playback.stop(),
    destroy() {
      playback.destroy(); skip.removeEventListener('click', onSkip); root.removeEventListener('keydown', onKey); root.remove();
    },
  };
}
