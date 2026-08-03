import type { StorageLike } from "../game/save.ts";

export const AUDIO_SETTINGS_STORAGE_KEY = "td-audio-settings-v1";

export type AudioSettings = Readonly<{
  musicEnabled: boolean;
  sfxEnabled: boolean;
}>;

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = Object.freeze({
  musicEnabled: true,
  sfxEnabled: true,
});

export function readAudioSettings(storage: StorageLike | null): AudioSettings {
  if (!storage) return DEFAULT_AUDIO_SETTINGS;
  try {
    const raw = storage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Record<keyof AudioSettings, unknown>>;
    return Object.freeze({
      musicEnabled: typeof parsed.musicEnabled === "boolean"
        ? parsed.musicEnabled
        : DEFAULT_AUDIO_SETTINGS.musicEnabled,
      sfxEnabled: typeof parsed.sfxEnabled === "boolean"
        ? parsed.sfxEnabled
        : DEFAULT_AUDIO_SETTINGS.sfxEnabled,
    });
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function writeAudioSettings(storage: StorageLike | null, settings: AudioSettings): boolean {
  if (!storage) return false;
  try {
    storage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function updateAudioSetting(
  settings: AudioSettings,
  kind: "music" | "sfx",
  enabled: boolean,
): AudioSettings {
  return Object.freeze({
    musicEnabled: kind === "music" ? enabled : settings.musicEnabled,
    sfxEnabled: kind === "sfx" ? enabled : settings.sfxEnabled,
  });
}
