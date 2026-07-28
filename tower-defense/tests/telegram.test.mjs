import assert from "node:assert/strict";
import test from "node:test";

import { setupTelegramBridge, supportsApiVersion } from "../src/telegram.ts";

function attachTelegramEventApi(webApp) {
  const events = new Map();
  webApp.onEvent = (name, callback) => events.set(name, callback);
  webApp.offEvent = (name, callback) => {
    if (events.get(name) === callback) events.delete(name);
  };
  return events;
}

function withTelegramEnvironment(webApp, run) {
  const hadWindow = Object.hasOwn(globalThis, "window");
  const hadDocument = Object.hasOwn(globalThis, "document");
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const cssValues = new Map();
  const appEvents = attachTelegramEventApi(webApp);
  const windowEvents = new Map();

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
    assert.equal(appEvents.has("fullscreenChanged"), false);
    assert.equal(appEvents.has("fullscreenFailed"), false);
    assert.equal(windowEvents.has("resize"), false);
    assert.equal(windowEvents.has("load"), false);
  });
});

test("Telegram bridge bootstrap expands the Mini App without entering or exiting fullscreen", () => {
  let readyCalls = 0;
  let expandCalls = 0;
  let fullscreenCalls = 0;
  let exitCalls = 0;
  const webApp = {
    isFullscreen: false,
    isVersionAtLeast: () => true,
    ready: () => { readyCalls += 1; },
    expand: () => { expandCalls += 1; },
    requestFullscreen: () => { fullscreenCalls += 1; },
    exitFullscreen: () => { exitCalls += 1; },
  };

  withTelegramEnvironment(webApp, () => {
    const bridge = setupTelegramBridge();
    assert.equal(readyCalls, 1);
    assert.equal(expandCalls, 1);
    assert.equal(fullscreenCalls, 0);
    assert.equal(exitCalls, 0);
    bridge.destroy();
  });
});

test("Telegram close remains an explicit supported menu action", () => {
  let closeCalls = 0;
  const webApp = {
    isVersionAtLeast: () => true,
    close: () => { closeCalls += 1; },
  };

  withTelegramEnvironment(webApp, () => {
    const bridge = setupTelegramBridge();
    assert.equal(bridge.canClose, true);
    assert.equal(closeCalls, 0);
    assert.equal(bridge.close(), true);
    assert.equal(closeCalls, 1);
    bridge.destroy();
    assert.equal(bridge.close(), false);
  });

  withTelegramEnvironment({ isVersionAtLeast: () => true }, () => {
    const bridge = setupTelegramBridge();
    assert.equal(bridge.canClose, false);
    assert.equal(bridge.close(), false);
    bridge.destroy();
  });
});

test("Telegram bridge enters fullscreen only after an explicit request", () => {
  let expandCalls = 0;
  let fullscreenCalls = 0;
  const webApp = {
    isFullscreen: false,
    isVersionAtLeast: (version) => version === "8.0",
    expand: () => { expandCalls += 1; },
    requestFullscreen: () => { fullscreenCalls += 1; },
    exitFullscreen: () => {},
  };

  withTelegramEnvironment(webApp, () => {
    const bridge = setupTelegramBridge();
    assert.equal(bridge.supportsFullscreen, true);
    assert.equal(bridge.isFullscreen, false);
    assert.equal(bridge.requestFullscreen(), true);
    assert.equal(fullscreenCalls, 1);
    assert.equal(expandCalls, 1);

    webApp.isFullscreen = true;
    assert.equal(bridge.isFullscreen, true);
    assert.equal(bridge.requestFullscreen(), true);
    assert.equal(fullscreenCalls, 1);
    bridge.destroy();
  });
});

test("Telegram bridge exits fullscreen only after an explicit request", () => {
  let exitCalls = 0;
  const webApp = {
    isFullscreen: true,
    isVersionAtLeast: (version) => version === "8.0",
    requestFullscreen: () => {},
    exitFullscreen: () => { exitCalls += 1; },
  };

  withTelegramEnvironment(webApp, () => {
    const bridge = setupTelegramBridge();
    assert.equal(bridge.exitFullscreen(), true);
    assert.equal(exitCalls, 1);

    webApp.isFullscreen = false;
    assert.equal(bridge.isFullscreen, false);
    assert.equal(bridge.exitFullscreen(), true);
    assert.equal(exitCalls, 1);
    bridge.destroy();
  });
});

test("fullscreen host events refresh viewport and safe area before notifying listeners", () => {
  const webApp = {
    isFullscreen: false,
    viewportHeight: 700,
    viewportStableHeight: 680,
    safeAreaInset: { top: 12 },
    contentSafeAreaInset: { top: 58 },
    isVersionAtLeast: () => true,
    requestFullscreen: () => {},
    exitFullscreen: () => {},
  };

  withTelegramEnvironment(webApp, ({ appEvents, cssValues }) => {
    const bridge = setupTelegramBridge();
    const notifications = [];
    const unsubscribe = bridge.onFullscreenChange((isFullscreen) => {
      notifications.push({
        isFullscreen,
        viewport: cssValues.get("--tg-viewport-height"),
        safeTop: cssValues.get("--td-content-safe-area-inset-top"),
      });
    });

    webApp.isFullscreen = true;
    webApp.viewportHeight = 820;
    webApp.contentSafeAreaInset.top = 72;
    appEvents.get("fullscreenChanged")();
    assert.equal(bridge.isFullscreen, true);
    assert.deepEqual(notifications, [{ isFullscreen: true, viewport: "820px", safeTop: "72px" }]);

    webApp.isFullscreen = false;
    webApp.viewportHeight = 760;
    webApp.contentSafeAreaInset.top = 64;
    appEvents.get("fullscreenFailed")();
    assert.deepEqual(notifications.at(-1), { isFullscreen: false, viewport: "760px", safeTop: "64px" });

    unsubscribe();
    appEvents.get("fullscreenChanged")();
    assert.equal(notifications.length, 2);
    bridge.destroy();
  });
});

test("unsupported and rejected fullscreen operations never fall back to expand", () => {
  const cases = [
    {
      webApp: {
        isFullscreen: false,
        isVersionAtLeast: () => false,
        requestFullscreen: () => assert.fail("unsupported request must not run"),
        exitFullscreen: () => assert.fail("unsupported exit must not run"),
      },
      operation: (bridge) => bridge.requestFullscreen(),
    },
    {
      webApp: {
        isFullscreen: false,
        isVersionAtLeast: (version) => version === "8.0",
        requestFullscreen: () => assert.fail("incomplete fullscreen API must not run"),
      },
      operation: (bridge) => bridge.requestFullscreen(),
    },
    {
      webApp: {
        isFullscreen: false,
        isVersionAtLeast: (version) => version === "8.0",
        requestFullscreen: () => { throw new Error("fullscreen rejected"); },
        exitFullscreen: () => {},
      },
      operation: (bridge) => bridge.requestFullscreen(),
    },
    {
      webApp: {
        isFullscreen: true,
        isVersionAtLeast: (version) => version === "8.0",
        requestFullscreen: () => {},
        exitFullscreen: () => { throw new Error("fullscreen exit rejected"); },
      },
      operation: (bridge) => bridge.exitFullscreen(),
    },
  ];

  for (const { webApp, operation } of cases) {
    let expandCalls = 0;
    webApp.expand = () => { expandCalls += 1; };
    withTelegramEnvironment(webApp, () => {
      const bridge = setupTelegramBridge();
      assert.equal(expandCalls, 1);
      assert.equal(operation(bridge), false);
      assert.equal(expandCalls, 1);
      bridge.destroy();
    });
  }
});

test("load refresh moves bindings to a late WebApp, notifies UI, and destroy removes listeners", () => {
  const originalWebApp = {
    isFullscreen: false,
    isVersionAtLeast: () => true,
    requestFullscreen: () => {},
    exitFullscreen: () => {},
  };

  withTelegramEnvironment(originalWebApp, ({ appEvents: originalEvents, windowEvents }) => {
    const bridge = setupTelegramBridge();
    let notifications = 0;
    bridge.onFullscreenChange(() => { notifications += 1; });

    const replacementWebApp = {
      isFullscreen: true,
      isVersionAtLeast: () => true,
      requestFullscreen: () => {},
      exitFullscreen: () => {},
    };
    const replacementEvents = attachTelegramEventApi(replacementWebApp);
    globalThis.window.Telegram.WebApp = replacementWebApp;
    windowEvents.get("load")();

    assert.equal(originalEvents.size, 0);
    assert.equal(typeof replacementEvents.get("fullscreenChanged"), "function");
    assert.equal(bridge.isFullscreen, true);
    assert.equal(notifications, 1);

    replacementEvents.get("fullscreenChanged")();
    assert.equal(notifications, 2);

    const detachedCallback = replacementEvents.get("fullscreenChanged");
    bridge.destroy();
    assert.equal(replacementEvents.size, 0);
    assert.equal(windowEvents.has("resize"), false);
    assert.equal(windowEvents.has("load"), false);
    detachedCallback();
    assert.equal(notifications, 2);
    assert.equal(bridge.requestFullscreen(), false);
    assert.equal(bridge.exitFullscreen(), false);
  });
});
