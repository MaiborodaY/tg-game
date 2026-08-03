import assert from "node:assert/strict";
import test from "node:test";

import {
  AUDIO_SETTINGS_STORAGE_KEY,
  DEFAULT_AUDIO_SETTINGS,
  readAudioSettings,
  updateAudioSetting,
  writeAudioSettings,
} from "../src/audio/audioSettings.ts";

test("audio settings use safe defaults and tolerate partial or corrupt storage", () => {
  assert.deepEqual(readAudioSettings(null), { musicEnabled: true, sfxEnabled: true });
  assert.ok(Object.isFrozen(DEFAULT_AUDIO_SETTINGS));

  const storage = memoryStorage();
  storage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify({ musicEnabled: false }));
  assert.deepEqual(readAudioSettings(storage), { musicEnabled: false, sfxEnabled: true });

  storage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify({ musicEnabled: "no", sfxEnabled: false }));
  assert.deepEqual(readAudioSettings(storage), { musicEnabled: true, sfxEnabled: false });

  storage.setItem(AUDIO_SETTINGS_STORAGE_KEY, "{broken");
  assert.deepEqual(readAudioSettings(storage), DEFAULT_AUDIO_SETTINGS);
  assert.deepEqual(readAudioSettings(throwingStorage()), DEFAULT_AUDIO_SETTINGS);
});

test("music and effects persist independently without mutating previous settings", () => {
  const storage = memoryStorage();
  const musicMuted = updateAudioSetting(DEFAULT_AUDIO_SETTINGS, "music", false);
  assert.deepEqual(musicMuted, { musicEnabled: false, sfxEnabled: true });
  assert.deepEqual(DEFAULT_AUDIO_SETTINGS, { musicEnabled: true, sfxEnabled: true });
  assert.ok(Object.isFrozen(musicMuted));

  const allMuted = updateAudioSetting(musicMuted, "sfx", false);
  assert.equal(writeAudioSettings(storage, allMuted), true);
  assert.deepEqual(readAudioSettings(storage), allMuted);
  assert.equal(writeAudioSettings(throwingStorage(), allMuted), false);
});

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function throwingStorage() {
  return {
    getItem() {
      throw new Error("storage blocked");
    },
    setItem() {
      throw new Error("storage blocked");
    },
    removeItem() {
      throw new Error("storage blocked");
    },
  };
}
