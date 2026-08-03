import type { MusicPlayback } from "./audioCatalog.ts";

export type AudioEffectPlayback = Readonly<{
  url: string;
  volume: number;
  playbackRate: number;
  priority: 1 | 2 | 3;
}>;

export interface AudioPort {
  unlock(): Promise<boolean>;
  startMusic(playback: MusicPlayback): void;
  setMusicVolume(volume: number): void;
  stopMusic(crossfadeMs?: number): void;
  playEffect(playback: AudioEffectPlayback): void;
  suspend(): void;
  resume(): void;
  destroy(): void;
}
