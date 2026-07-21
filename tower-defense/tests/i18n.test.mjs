import assert from "node:assert/strict";
import test from "node:test";

import { detectLocale, normalizeLocale, tr } from "../src/i18n.ts";

test("locale normalization supports Telegram language variants and Russian fallback", () => {
  assert.equal(normalizeLocale("uk-UA"), "uk");
  assert.equal(normalizeLocale("UA"), "uk");
  assert.equal(normalizeLocale("en_US"), "en");
  assert.equal(normalizeLocale("pl"), null);
  assert.equal(tr("pl", "result_waves", { count: 4 }), "Отбито волн: 4");
  assert.equal(tr("en", "intro_waves", { count: 12 }), "12 waves");
  assert.equal(detectLocale("uk-UA"), "uk");
});
