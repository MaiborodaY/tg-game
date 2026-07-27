import assert from "node:assert/strict";
import test from "node:test";

import { setupTelegramBridge, supportsApiVersion } from "../src/telegram.ts";

function withTelegramEnvironment(webApp, run) {
  const hadWindow = Object.hasOwn(globalThis, "window");
  const hadDocument = Object.hasOwn(globalThis, "document");
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const cssValues = new Map();
  const appEvents = new Map();
  const windowEvents = new Map();

  webApp.onEvent = (name, callback) => appEvents.set(name, callback);
  webApp.offEvent = (name, callback) => {
    if (appEvents.get(name) === callback) appEvents.delete(name);
  };
  globalThis.window = {
    Telegram: { WebApp: webApp },
    innerHeight: 720,
    addEventListener(name, callback) {
      windowEvents.set(name, callback);
    },
    removeEventListener(name, callback) {
      if (windowEvents.get(name) === callback) windowEvents.delete(name);
    },
  };
  globalThis.document = {
    documentElement: {
      style: {
        setProperty(name, value) {
          cssValues.set(name, value);
        },
        removeProperty(name) {
          const previous = cssValues.get(name) ?? "";
          cssValues.delete(name);
          return previous;
        },
      },
    },
  };

  try {
    return run({ appEvents, cssValues, windowEvents });
  } finally {
    if (hadWindow) globalThis.window = previousWindow;
    else delete globalThis.window;
    if (hadDocument) globalThis.document = previousDocument;
    else delete globalThis.document;
  }
}

test("Telegram enhancements run only when the host reports a supported API version", () => {
  assert.equal(supportsApiVersion(undefined, "6.1"), false);
  assert.equal(supportsApiVersion({}, "6.1"), false);
  assert.equal(supportsApiVersion({ isVersionAtLeast: (version) => version === "6.1" }, "6.1"), true);
  assert.equal(supportsApiVersion({ isVersionAtLeast: () => false }, "7.7"), false);
});

test("a broken Telegram version probe cannot interrupt the game", () => {
  assert.equal(supportsApiVersion({ isVersionAtLeast: () => { throw new Error("broken host"); } }, "6.1"), false);
});

test("Telegram bridge mirrors safe-area values and refreshes them from API 8.0 events", () => {
  const webApp = {
    viewportHeight: 700,
    viewportStableHeight: 680,
    safeAreaInset: { top: 12, right: 3, bottom: 24, left: 4 },
    contentSafeAreaInset: { top: 58, right: 5, bottom: 30, left: 6 },
    isVersionAtLeast: () => true,
  };

  withTelegramEnvironment(webApp, ({ appEvents, cssValues, windowEvents }) => {
    const bridge = setupTelegramBridge();

    assert.equal(cssValues.get("--td-safe-area-inset-top"), "12px");
    assert.equal(cssValues.get("--td-safe-area-inset-bottom"), "24px");
    assert.equal(cssValues.get("--td-content-safe-area-inset-top"), "58px");
    assert.equal(cssValues.get("--td-content-safe-area-inset-left"), "6px");
    assert.equal(cssValues.get("--tg-viewport-height"), "700px");
    assert.equal(typeof appEvents.get("safeAreaChanged"), "function");
    assert.equal(typeof appEvents.get("contentSafeAreaChanged"), "function");

    webApp.safeAreaInset.top = 18;
    webApp.contentSafeAreaInset.bottom = 42;
    appEvents.get("safeAreaChanged")();
    assert.equal(cssValues.get("--td-safe-area-inset-top"), "18px");
    assert.equal(cssValues.get("--td-content-safe-area-inset-bottom"), "42px");

    bridge.destroy();
    assert.equal(appEvents.has("viewportChanged"), false);
    assert.equal(appEvents.has("safeAreaChanged"), false);
    assert.equal(appEvents.has("contentSafeAreaChanged"), false);
    assert.equal(windowEvents.has("resize"), false);
  });
});

test("Telegram bridge requests fullscreen only through API 8.0 and avoids duplicate requests", () => {
  let expandCalls = 0;
  let fullscreenCalls = 0;
  const webApp = {
    isFullscreen: false,
    isVersionAtLeast: (version) => version === "8.0",
    expand: () => { expandCalls += 1; },
    requestFullscreen: () => { fullscreenCalls += 1; },
  };

  withTelegramEnvironment(webApp, () => {
    const bridge = setupTelegramBridge();
    assert.equal(expandCalls, 1);
    assert.equal(bridge.requestFullscreen(), true);
    assert.equal(fullscreenCalls, 1);
    assert.equal(expandCalls, 1);

    webApp.isFullscreen = true;
    assert.equal(bridge.requestFullscreen(), true);
    assert.equal(fullscreenCalls, 1);
    bridge.destroy();
  });
});

test("Telegram bridge falls back to expand when fullscreen is unavailable or rejected", () => {
  for (const webApp of [
    { isVersionAtLeast: () => false },
    {
      isVersionAtLeast: (version) => version === "8.0",
      requestFullscreen: () => { throw new Error("fullscreen rejected"); },
    },
  ]) {
    let expandCalls = 0;
    webApp.expand = () => { expandCalls += 1; };
    withTelegramEnvironment(webApp, () => {
      const bridge = setupTelegramBridge();
      assert.equal(expandCalls, 1);
      assert.equal(bridge.requestFullscreen(), false);
      assert.equal(expandCalls, 2);
      bridge.destroy();
    });
  }
});
