import {
  AUDIO_CUES,
  type AudioCueId,
  type AudioLibrary,
  type MusicContext,
} from "./audioCatalog.ts";
import type { AudioPort } from "./audioPort.ts";
import type { AudioSettings } from "./audioSettings.ts";

type Clock = () => number;
type Random = () => number;

export class AudioDirector {
  private readonly port: AudioPort;
  private readonly library: AudioLibrary;
  private readonly now: Clock;
  private readonly random: Random;
  private readonly lastCueAt = new Map<AudioCueId, number>();
  private readonly sampleIndices = new Map<AudioCueId, number>();
  private settings: AudioSettings;
  private desiredMusic: MusicContext = null;
  private activeMusic: MusicContext = null;
  private unlockPromise: Promise<boolean> | null = null;
  private unlocked = false;
  private suspended = false;
  private destroyed = false;

  constructor(
    port: AudioPort,
    settings: AudioSettings,
    library: AudioLibrary,
    now: Clock = Date.now,
    random: Random = Math.random,
  ) {
    this.port = port;
    this.settings = settings;
    this.library = library;
    this.now = now;
    this.random = random;
  }

  unlockFromGesture(): Promise<boolean> {
    if (this.destroyed) return Promise.resolve(false);
    if (this.unlocked) {
      if (!this.suspended) this.port.resume();
      return Promise.resolve(true);
    }
    if (this.unlockPromise) return this.unlockPromise;
    this.unlockPromise = this.port.unlock().then((unlocked) => {
      this.unlocked = unlocked;
      this.unlockPromise = null;
      if (unlocked) this.syncMusic();
      return unlocked;
    }).catch(() => {
      this.unlockPromise = null;
      return false;
    });
    return this.unlockPromise;
  }

  setSettings(settings: AudioSettings): void {
    if (this.destroyed) return;
    const musicChanged = settings.musicEnabled !== this.settings.musicEnabled;
    this.settings = settings;
    if (musicChanged) this.syncMusic();
  }

  setMusicContext(context: MusicContext): void {
    if (this.destroyed || context === this.desiredMusic) return;
    this.desiredMusic = context;
    this.syncMusic();
  }

  playCue(id: AudioCueId): boolean {
    if (this.destroyed || !this.unlocked || this.suspended || !this.settings.sfxEnabled) return false;
    const config = AUDIO_CUES[id];
    const now = this.now();
    const lastPlayedAt = this.lastCueAt.get(id);
    if (lastPlayedAt !== undefined && now - lastPlayedAt < config.cooldownMs) return false;

    const sampleIndex = this.sampleIndices.get(id) ?? 0;
    const sample = config.samples[sampleIndex % config.samples.length];
    if (!sample) return false;
    this.sampleIndices.set(id, sampleIndex + 1);
    const pitchOffset = config.pitchSpread === 0
      ? 0
      : (Math.max(0, Math.min(1, this.random())) * 2 - 1) * config.pitchSpread;
    this.port.playEffect({
      url: this.library.sampleUrls[sample],
      volume: config.volume,
      playbackRate: 1 + pitchOffset,
      priority: config.priority,
    });
    this.lastCueAt.set(id, now);
    return true;
  }

  suspend(): void {
    if (this.destroyed || this.suspended) return;
    this.suspended = true;
    this.port.suspend();
  }

  resume(): void {
    if (this.destroyed || !this.suspended) return;
    this.suspended = false;
    this.port.resume();
    this.syncMusic();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.port.destroy();
    this.lastCueAt.clear();
    this.sampleIndices.clear();
  }

  private syncMusic(): void {
    if (this.destroyed || !this.unlocked || this.suspended) return;
    if (!this.settings.musicEnabled || this.desiredMusic === null) {
      if (this.activeMusic !== null) this.port.stopMusic();
      this.activeMusic = null;
      return;
    }
    const playback = this.library.music[this.desiredMusic];
    if (this.activeMusic === this.desiredMusic) {
      this.port.setMusicVolume(playback.volume);
      return;
    }
    this.port.startMusic(playback);
    this.activeMusic = this.desiredMusic;
  }
}

export function resolveMusicContext(
  levelId: string,
  phase: "setup" | "countdown" | "wave" | "gameover" | "victory",
  bossActive: boolean,
): MusicContext {
  if (phase === "gameover" || phase === "victory") return null;
  if (bossActive) return "boss";
  return levelId.startsWith("northern-pass") ? "northern" : "forest";
}
