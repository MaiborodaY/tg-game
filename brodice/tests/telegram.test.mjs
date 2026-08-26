import assert from "node:assert/strict";
import test from "node:test";

import {
  createTelegramShareUrl,
  setupTelegramAdapter,
  supportsVersion,
} from "../src/telegram.ts";

function createHarness({ supported = true } = {}) {
  const calls = [];
  const events = new Map();
  const properties = new Map();
  const webApp = {
    initDataUnsafe: { start_param: "  r1_shared_roll  " },
    viewportHeight: 700.4,
    viewportStableHeight: 680.2,
    contentSafeAreaInset: { top: 12, right: 3, bottom: 18, left: 4 },
    isVersionAtLeast() { return supported; },
    ready() { calls.push(["ready"]); },
    expand() { calls.push(["expand"]); },
    disableVerticalSwipes() { calls.push(["disableVerticalSwipes"]); },
    setHeaderColor(value) { calls.push(["header", value]); },
    setBackgroundColor(value) { calls.push(["background", value]); },
    openTelegramLink(value) { calls.push(["share", value]); },
    onEvent(name, callback) { events.set(name, callback); },
    offEvent(name) { events.delete(name); },
    HapticFeedback: {
      impactOccurred(value) { calls.push(["impact", value]); },
      notificationOccurred(value) { calls.push(["notification", value]); },
    },
  };
  const hostEvents = new Map();
  const host = {
    Telegram: { WebApp: webApp },
    innerHeight: 640,
    addEventListener(name, callback) { hostEvents.set(name, callback); },
    removeEventListener(name) { hostEvents.delete(name); },
  };
  const style = { setProperty(name, value) { properties.set(name, value); } };
  return { calls, events, host, hostEvents, properties, style, webApp };
}

test("Telegram adapter initializes viewport, safe areas, colors, and swipes", () => {
  const harness = createHarness();
  const adapter = setupTelegramAdapter(harness.host, harness.style);
  assert.equal(adapter.isTelegram, true);
  assert.equal(adapter.startParam, "r1_shared_roll");
  assert.deepEqual(harness.calls.slice(0, 5), [
    ["ready"],
    ["expand"],
    ["disableVerticalSwipes"],
    ["header", "#0d1011"],
    ["background", "#080a0b"],
  ]);
  assert.equal(harness.properties.get("--tg-viewport-height"), "700px");
  assert.equal(harness.properties.get("--tg-safe-bottom"), "18px");
  assert.equal(harness.events.has("contentSafeAreaChanged"), true);
  adapter.destroy();
  assert.equal(harness.hostEvents.has("resize"), false);
});

test("Telegram sharing and haptics are guarded progressive enhancements", () => {
  const harness = createHarness();
  const adapter = setupTelegramAdapter(harness.host, harness.style);
  adapter.haptic("medium");
  adapter.haptic("success");
  assert.equal(adapter.share("Victory", "https://example.com/brodice/"), true);
  assert.deepEqual(harness.calls.slice(-3), [
    ["impact", "medium"],
    ["notification", "success"],
    ["share", "https://t.me/share/url?url=https%3A%2F%2Fexample.com%2Fbrodice%2F&text=Victory"],
  ]);
});

test("unsupported Telegram versions skip optional APIs", () => {
  const harness = createHarness({ supported: false });
  const adapter = setupTelegramAdapter(harness.host, harness.style);
  adapter.haptic("medium");
  assert.equal(harness.calls.some(([name]) => name === "disableVerticalSwipes"), false);
  assert.equal(harness.calls.some(([name]) => name === "impact"), false);
});

test("version and share URL helpers fail safely", () => {
  assert.equal(supportsVersion({ isVersionAtLeast() { throw new Error("broken"); } }, "7.7"), false);
  assert.equal(
    createTelegramShareUrl("  BroDice  ", "https://example.com/brodice/"),
    "https://t.me/share/url?url=https%3A%2F%2Fexample.com%2Fbrodice%2F&text=BroDice",
  );
});
