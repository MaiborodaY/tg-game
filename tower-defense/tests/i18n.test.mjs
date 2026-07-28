import assert from "node:assert/strict";
import test from "node:test";

import {
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
  detectLocale,
  normalizeLocale,
  readStoredLocale,
  tr,
  writeStoredLocale,
} from "../src/i18n.ts";

test("locale normalization supports Telegram language variants and Russian fallback", () => {
  assert.equal(normalizeLocale("uk-UA"), "uk");
  assert.equal(normalizeLocale("UA"), "uk");
  assert.equal(normalizeLocale("en_US"), "en");
  assert.equal(normalizeLocale("pl"), null);
  assert.equal(tr("pl", "result_waves", { count: 4 }), "Отбито волн: 4");
  assert.equal(tr("en", "intro_waves", { count: 24 }), "24 waves");
  assert.equal(
    tr("ru", "result_summary", { waves: 13, total: 24, score: 31 }),
    "Волны: 13 / 24 · Очки рейтинга: 31",
  );
  assert.equal(tr("uk", "tower_guide_button"), "Довідка про вежі");
  assert.equal(tr("ru", "fullscreen_enter"), "Развернуть на весь экран");
  assert.equal(tr("uk", "fullscreen_exit"), "Вийти з повноекранного режиму");
  assert.equal(tr("en", "fullscreen_exit"), "Exit fullscreen");
  assert.equal(tr("ru", "tower_storm"), "Грозовой шпиль");
  assert.equal(tr("uk", "enemy_titan"), "Титан розлому");
  assert.equal(tr("ru", "run_resumed", { wave: 3 }), "Продолжаем защиту: следующая волна — 3");
  assert.match(tr("uk", "run_resume_unavailable"), /локальне збереження/);
  assert.match(tr("en", "local_save_unavailable"), /Closing the game/);
  assert.equal(tr("ru", "run_replaced"), "Этот забег уже закрыт. Можно начать новый.");
  assert.equal(tr("ru", "profile_sync_pending"), "Результат сохранён, профиль обновится позже");
  assert.equal(tr("en", "profile_sync_retry"), "Update profile");
  assert.equal(tr("uk", "profile_sync_retry_failed"), "Нагороду збережено, профіль поки не оновлено");
  assert.equal(detectLocale("uk-UA"), "uk");
});

test("manual locale storage is persistent and fails closed", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.deepEqual(LOCALE_LABELS, { ru: "RU", uk: "UA", en: "EN" });
  assert.equal(readStoredLocale(storage), null);
  assert.equal(writeStoredLocale(storage, "en"), true);
  assert.equal(values.get(LOCALE_STORAGE_KEY), "en");
  assert.equal(readStoredLocale(storage), "en");

  const blockedStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  assert.equal(readStoredLocale(blockedStorage), null);
  assert.equal(writeStoredLocale(blockedStorage, "uk"), false);
});
