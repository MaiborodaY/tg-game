import assert from "node:assert/strict";
import test from "node:test";

import { supportsApiVersion } from "../src/telegram.ts";

test("Telegram enhancements run only when the host reports a supported API version", () => {
  assert.equal(supportsApiVersion(undefined, "6.1"), false);
  assert.equal(supportsApiVersion({}, "6.1"), false);
  assert.equal(supportsApiVersion({ isVersionAtLeast: (version) => version === "6.1" }, "6.1"), true);
  assert.equal(supportsApiVersion({ isVersionAtLeast: () => false }, "7.7"), false);
});

test("a broken Telegram version probe cannot interrupt the game", () => {
  assert.equal(supportsApiVersion({ isVersionAtLeast: () => { throw new Error("broken host"); } }, "6.1"), false);
});
