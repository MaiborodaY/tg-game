import assert from "node:assert/strict";
import test from "node:test";

import { RUNNER_TEXTS, normalizeRunnerLang, translate } from "../src/i18n.ts";

test("normalizes supported Runner language variants", () => {
  assert.equal(normalizeRunnerLang("ru-RU"), "ru");
  assert.equal(normalizeRunnerLang("uk-UA"), "uk");
  assert.equal(normalizeRunnerLang("ua_UA"), "uk");
  assert.equal(normalizeRunnerLang("en-US"), "en");
  assert.equal(normalizeRunnerLang("de-DE"), "ru");
});

test("all Runner locales expose the same translation keys", () => {
  const russianKeys = Object.keys(RUNNER_TEXTS.ru).sort();

  assert.deepEqual(Object.keys(RUNNER_TEXTS.uk).sort(), russianKeys);
  assert.deepEqual(Object.keys(RUNNER_TEXTS.en).sort(), russianKeys);
});

test("translation interpolates result values and supports language aliases", () => {
  assert.equal(
    translate("en-US", "new_record", { score: 42 }),
    "New record: 42!",
  );
  assert.match(
    translate("ua", "result_summary", { score: 8, time: "4,2 с", crops: 3, combo: 1 }),
    /Рахунок 8.*4,2 с.*3.*×1/,
  );
});
