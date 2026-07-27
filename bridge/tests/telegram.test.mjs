import assert from "node:assert/strict";
import test from "node:test";

import { getTelegramLanguageCode, supportsTelegramVersion } from "../src/telegram.ts";

test("Telegram capabilities are enabled only after an explicit version check", () => {
  assert.equal(supportsTelegramVersion(undefined, "6.1"), false);
  assert.equal(
    supportsTelegramVersion({ isVersionAtLeast: (version) => version === "7.7" }, "7.7"),
    true,
  );
  assert.equal(
    supportsTelegramVersion({ isVersionAtLeast: () => false }, "6.2"),
    false,
  );
});

test("a broken Telegram version probe fails closed", () => {
  assert.equal(
    supportsTelegramVersion({
      isVersionAtLeast() {
        throw new Error("unsupported");
      },
    }, "6.1"),
    false,
  );
});

test("Telegram language is read defensively from the signed user payload", () => {
  assert.equal(getTelegramLanguageCode(undefined), null);
  assert.equal(getTelegramLanguageCode({ initDataUnsafe: { user: { language_code: " uk-UA " } } }), "uk-UA");
  assert.equal(getTelegramLanguageCode({ initDataUnsafe: { user: {} } }), null);
});
