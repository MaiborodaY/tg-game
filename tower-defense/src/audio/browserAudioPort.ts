import type { MusicPlayback } from "./audioCatalog.ts";
import type { AudioEffectPlayback, AudioPort } from "./audioPort.ts";

const SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAgICA";
const MAX_EFFECT_VOICES = 10;
const MUSIC_CHANNELS = 2;
const EFFECT_PRELOAD_DELAY_MS = 1_500;

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type ActiveEffect = {
  audio: HTMLAudioElement;
  priority: AudioEffectPlayback["priority"];
  startedAt: number;
  cleanup: () => void;
};

type ActiveMusic = {
  audio: HTMLAudioElement;
  playback: MusicPlayback;
  targetVolume: number;
  loopPreload?: HTMLAudioElement;
};

type PendingMusicTransition = {
  previous: ActiveMusic | null;
  next: ActiveMusic;
  attempting: boolean;
};

export function createBrowserAudioPort(effectUrls: readonly string[]): AudioPort {
  return new BrowserAudioPort(effectUrls);
}

class BrowserAudioPort implements AudioPort {
  private readonly effectUrls: readonly string[];
  private readonly effectTemplates = new Map<string, HTMLAudioElement>();
  private readonly musicChannels: HTMLAudioElement[] = [];
  private readonly effectChannels: HTMLAudioElement[] = [];
  private readonly activeEffects: ActiveEffect[] = [];
  private readonly fadingMusic = new Set<HTMLAudioElement>();
  private channelGains = new WeakMap<HTMLAudioElement, GainNode>();
  private audioContext: AudioContext | null = null;
  private currentMusic: ActiveMusic | null = null;
  private pendingMusic: PendingMusicTransition | null = null;
  private fadeTimer: number | null = null;
  private preloadTimer: number | null = null;
  private contextSuspendPromise: Promise<void> | null = null;
  private resumeAfterSuspend = false;
  private suspended = false;
  private destroyed = false;

  constructor(effectUrls: readonly string[]) {
    this.effectUrls = effectUrls;
  }

  async unlock(): Promise<boolean> {
    if (this.destroyed) return false;
    try {
      this.ensurePlaybackChannels();
      const channels = [...this.musicChannels, ...this.effectChannels];
      const context = this.ensureAudioMixer(channels);
      const resumeAttempt = context && context.state !== "running"
        ? context.resume()
        : Promise.resolve();
      // Start every fixed channel before the first await so iOS binds each one to this gesture.
      const playAttempts = channels.map((audio) => {
        audio.src = SILENT_WAV;
        audio.loop = false;
        this.setChannelVolume(audio, 0);
        return audio.play();
      });
      await Promise.all([resumeAttempt, ...playAttempts]);
      for (const audio of channels) {
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch {
          // A primed WebView channel can reject seeking until its tiny source is ready.
        }
      }
      this.scheduleEffectPreload();
      return true;
    } catch {
      return false;
    }
  }

  startMusic(playback: MusicPlayback): void {
    if (this.destroyed) return;
    if (this.currentMusic?.playback.id === playback.id) {
      this.currentMusic.playback = playback;
      this.currentMusic.targetVolume = playback.volume;
      this.setMusicVolume(playback.volume);
      return;
    }

    this.cancelPendingMusic(true);
    this.finishTransition();
    const previous = this.currentMusic;
    const audio = this.acquireMusicChannel(playback.introUrl ?? playback.loopUrl);
    audio.preload = "auto";
    audio.loop = !playback.introUrl;
    this.setChannelVolume(audio, previous ? 0 : playback.volume * 0.25);
    const loopPreload = playback.introUrl ? this.createAudio(playback.loopUrl) : undefined;
    if (loopPreload) {
      loopPreload.preload = "auto";
      try {
        loopPreload.load();
      } catch {
        // The intro can still hand off to a normal network load when preloading is unavailable.
      }
    }
    const active: ActiveMusic = { audio, playback, targetVolume: playback.volume, loopPreload };
    this.currentMusic = active;
    this.pendingMusic = { previous, next: active, attempting: false };

    if (playback.introUrl) {
      audio.addEventListener("ended", () => this.startBossLoop(active), { once: true });
    }
    if (!this.suspended) this.attemptPendingMusic();
  }

  setMusicVolume(volume: number): void {
    const current = this.currentMusic;
    if (!current) return;
    current.targetVolume = clampVolume(volume);
    if (this.fadeTimer === null) this.setChannelVolume(current.audio, current.targetVolume);
  }

  stopMusic(crossfadeMs = 450): void {
    this.cancelPendingMusic(true);
    const current = this.currentMusic;
    this.currentMusic = null;
    this.finishTransition();
    if (!current) return;
    this.stopMusicPreload(current);
    if (crossfadeMs <= 0) {
      stopAudio(current.audio);
      return;
    }
    const initial = this.getChannelVolume(current.audio);
    const startedAt = performance.now();
    this.fadingMusic.add(current.audio);
    this.fadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / crossfadeMs);
      this.setChannelVolume(current.audio, initial * (1 - progress));
      if (progress < 1) return;
      this.clearFadeTimer();
      this.fadingMusic.delete(current.audio);
      stopAudio(current.audio);
    }, 50);
  }

  playEffect(playback: AudioEffectPlayback): void {
    if (this.destroyed || this.suspended) return;
    if (this.activeEffects.length >= MAX_EFFECT_VOICES && !this.releaseVoiceFor(playback.priority)) return;

    const activeAudio = new Set(this.activeEffects.map((voice) => voice.audio));
    const audio = this.effectChannels.find((candidate) => !activeAudio.has(candidate));
    if (!audio) return;
    audio.src = playback.url;
    audio.preload = "auto";
    audio.loop = false;
    this.setChannelVolume(audio, playback.volume);
    audio.playbackRate = Math.max(0.75, Math.min(1.25, playback.playbackRate));
    const voice = {} as ActiveEffect;
    const cleanup = () => {
      audio.removeEventListener("ended", cleanup);
      audio.removeEventListener("error", cleanup);
      this.removeEffect(voice);
    };
    Object.assign(voice, { audio, priority: playback.priority, startedAt: performance.now(), cleanup });
    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });
    this.activeEffects.push(voice);
    void audio.play().catch(cleanup);
  }

  suspend(): void {
    if (this.suspended || this.destroyed) return;
    this.suspended = true;
    this.resumeAfterSuspend = false;
    this.finishTransition();
    if (this.currentMusic) this.setChannelVolume(this.currentMusic.audio, this.currentMusic.targetVolume);
    this.currentMusic?.audio.pause();
    this.pendingMusic?.previous?.audio.pause();
    for (const voice of [...this.activeEffects]) {
      voice.cleanup();
      stopAudio(voice.audio);
    }
    const context = this.audioContext;
    if (context && context.state !== "closed" && !this.contextSuspendPromise) {
      const pending = context.suspend().catch(() => undefined).finally(() => {
        if (this.contextSuspendPromise !== pending) return;
        this.contextSuspendPromise = null;
        if (!this.destroyed && !this.suspended && this.resumeAfterSuspend) {
          this.resumeAfterSuspend = false;
          this.resumePlayback();
        }
      });
      this.contextSuspendPromise = pending;
    }
  }

  resume(): void {
    if (this.destroyed) return;
    this.suspended = false;
    if (this.contextSuspendPromise) {
      this.resumeAfterSuspend = true;
      return;
    }
    this.resumeAfterSuspend = false;
    this.resumePlayback();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancelPendingMusic(false);
    this.finishTransition();
    if (this.currentMusic) this.stopMusicPreload(this.currentMusic);
    this.currentMusic = null;
    if (this.preloadTimer !== null) window.clearTimeout(this.preloadTimer);
    this.preloadTimer = null;
    this.resumeAfterSuspend = false;
    for (const voice of [...this.activeEffects]) {
      voice.cleanup();
      stopAudio(voice.audio);
    }
    this.activeEffects.length = 0;
    for (const audio of [...this.musicChannels, ...this.effectChannels, ...this.effectTemplates.values()]) {
      stopAudio(audio);
    }
    this.musicChannels.length = 0;
    this.effectChannels.length = 0;
    this.effectTemplates.clear();
    void this.audioContext?.close().catch(() => undefined);
    this.audioContext = null;
    this.channelGains = new WeakMap<HTMLAudioElement, GainNode>();
  }

  private scheduleEffectPreload(): void {
    if (this.preloadTimer !== null || this.effectTemplates.size > 0) return;
    this.preloadTimer = window.setTimeout(() => {
      this.preloadTimer = null;
      this.preloadEffects();
    }, EFFECT_PRELOAD_DELAY_MS);
  }

  private preloadEffects(): void {
    if (this.destroyed) return;
    for (const url of this.effectUrls) {
      if (this.effectTemplates.has(url)) continue;
      const audio = this.createAudio(url);
      audio.preload = "auto";
      this.effectTemplates.set(url, audio);
      try {
        audio.load();
      } catch {
        // A failed preload is harmless; the first real playback retries the URL.
      }
    }
  }

  private startBossLoop(active: ActiveMusic): void {
    if (this.destroyed || this.currentMusic !== active) return;
    active.audio.src = active.playback.loopUrl;
    active.audio.loop = true;
    try {
      active.audio.currentTime = 0;
    } catch {
      // Some Telegram WebViews reject a seek while swapping from the intro source.
    }
    this.setChannelVolume(active.audio, active.targetVolume);
    if (!this.suspended) void active.audio.play().catch(() => undefined);
  }

  private attemptPendingMusic(): void {
    const pending = this.pendingMusic;
    if (!pending || pending.attempting || this.destroyed || this.suspended) return;
    pending.attempting = true;
    void pending.next.audio.play().then(() => {
      if (this.pendingMusic !== pending || this.currentMusic !== pending.next) return;
      if (this.suspended) {
        pending.next.audio.pause();
        pending.attempting = false;
        return;
      }
      this.pendingMusic = null;
      if (pending.previous) this.stopMusicPreload(pending.previous);
      this.crossfade(pending.previous?.audio ?? null, pending.next, pending.next.playback.crossfadeMs);
    }).catch(() => {
      if (this.pendingMusic === pending) pending.attempting = false;
    });
  }

  private resumePlayback(): void {
    void this.audioContext?.resume().catch(() => undefined);
    if (this.pendingMusic) this.attemptPendingMusic();
    else if (this.currentMusic) void this.currentMusic.audio.play().catch(() => undefined);
  }

  private cancelPendingMusic(restorePrevious: boolean): void {
    const pending = this.pendingMusic;
    if (!pending) return;
    this.pendingMusic = null;
    this.stopMusicPreload(pending.next);
    stopAudio(pending.next.audio);
    if (restorePrevious) this.currentMusic = pending.previous;
  }

  private crossfade(previous: HTMLAudioElement | null, next: ActiveMusic, durationMs: number): void {
    this.clearFadeTimer();
    if (durationMs <= 0) {
      if (previous) stopAudio(previous);
      this.setChannelVolume(next.audio, next.targetVolume);
      return;
    }
    if (previous) this.fadingMusic.add(previous);
    const previousVolume = previous ? this.getChannelVolume(previous) : 0;
    const startedAt = performance.now();
    this.fadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / durationMs);
      if (previous) this.setChannelVolume(previous, previousVolume * (1 - progress));
      this.setChannelVolume(next.audio, next.targetVolume * progress);
      if (progress < 1) return;
      this.clearFadeTimer();
      if (previous) {
        this.fadingMusic.delete(previous);
        stopAudio(previous);
      }
    }, 50);
  }

  private releaseVoiceFor(priority: AudioEffectPlayback["priority"]): boolean {
    let candidateIndex = -1;
    for (let index = 0; index < this.activeEffects.length; index += 1) {
      const candidate = this.activeEffects[index];
      if (!candidate || candidate.priority > priority) continue;
      const selected = candidateIndex < 0 ? null : this.activeEffects[candidateIndex];
      if (
        !selected
        || candidate.priority < selected.priority
        || (candidate.priority === selected.priority && candidate.startedAt < selected.startedAt)
      ) {
        candidateIndex = index;
      }
    }
    if (candidateIndex < 0) return false;
    const [released] = this.activeEffects.splice(candidateIndex, 1);
    if (released) {
      released.cleanup();
      stopAudio(released.audio);
    }
    return true;
  }

  private removeEffect(voice: ActiveEffect): void {
    const index = this.activeEffects.indexOf(voice);
    if (index >= 0) this.activeEffects.splice(index, 1);
  }

  private clearFadeTimer(): void {
    if (this.fadeTimer === null) return;
    window.clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }

  private finishTransition(): void {
    this.clearFadeTimer();
    for (const audio of this.fadingMusic) stopAudio(audio);
    this.fadingMusic.clear();
  }

  private ensurePlaybackChannels(): void {
    while (this.musicChannels.length < MUSIC_CHANNELS) this.musicChannels.push(this.createAudio(SILENT_WAV));
    while (this.effectChannels.length < MAX_EFFECT_VOICES) this.effectChannels.push(this.createAudio(SILENT_WAV));
  }

  private acquireMusicChannel(url: string): HTMLAudioElement {
    const unavailable = new Set(this.fadingMusic);
    if (this.currentMusic) unavailable.add(this.currentMusic.audio);
    let audio = this.musicChannels.find((candidate) => !unavailable.has(candidate));
    if (!audio) {
      audio = this.createAudio(SILENT_WAV);
      this.musicChannels.push(audio);
      if (this.audioContext) this.connectChannelToMixer(audio, this.audioContext);
    }
    audio.src = url;
    return audio;
  }

  private ensureAudioMixer(channels: readonly HTMLAudioElement[]): AudioContext | null {
    if (!this.audioContext) {
      const AudioContextConstructor = window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!AudioContextConstructor) return null;
      try {
        this.audioContext = new AudioContextConstructor();
      } catch {
        return null;
      }
    }
    for (const audio of channels) this.connectChannelToMixer(audio, this.audioContext);
    return this.audioContext;
  }

  private connectChannelToMixer(audio: HTMLAudioElement, context: AudioContext): void {
    if (this.channelGains.has(audio)) return;
    try {
      const source = context.createMediaElementSource(audio);
      const gain = context.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(context.destination);
      audio.volume = 1;
      this.channelGains.set(audio, gain);
    } catch {
      // HTML volume remains a functional fallback in browsers without media-element routing.
    }
  }

  private setChannelVolume(audio: HTMLAudioElement, volume: number): void {
    const safeVolume = clampVolume(volume);
    const gain = this.channelGains.get(audio);
    if (gain) gain.gain.value = safeVolume;
    else audio.volume = safeVolume;
  }

  private getChannelVolume(audio: HTMLAudioElement): number {
    return this.channelGains.get(audio)?.gain.value ?? audio.volume;
  }

  private stopMusicPreload(active: ActiveMusic): void {
    if (!active.loopPreload) return;
    stopAudio(active.loopPreload);
    active.loopPreload = undefined;
  }

  private createAudio(url: string): HTMLAudioElement {
    return new Audio(url);
  }
}

function stopAudio(audio: HTMLAudioElement): void {
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    // Some WebViews reject seeks while a resource is still loading.
  }
  audio.removeAttribute("src");
  audio.load();
}

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
