import assert from "node:assert/strict";
import test from "node:test";
import {
  getTelegramLanguageCode,
  setupTelegramMiniApp,
  supportsTelegramVersion,
} from "../src/telegram.ts";

function createCssVariables() {
  const values = new Map();
  return {
    values,
    setProperty(name, value) {
      values.set(name, value);
    },
    removeProperty(name) {
      const previous = values.get(name) ?? "";
      values.delete(name);
      return previous;
    },
  };
}

function createHost(webApp) {
  const listeners = new Map();
  return {
    Telegram: webApp ? { WebApp: webApp } : undefined,
    innerHeight: 720,
    listeners,
    addEventListener(name, callback) {
      const callbacks = listeners.get(name) ?? new Set();
      callbacks.add(callback);
      listeners.set(name, callbacks);
    },
    removeEventListener(name, callback) {
      listeners.get(name)?.delete(callback);
    },
    emit(name) {
      for (const callback of [...(listeners.get(name) ?? [])]) callback();
    },
  };
}

function createWebApp() {
  const eventListeners = new Map();
  const backHandlers = new Set();
  const calls = {
    ready: 0,
    expand: 0,
    disableVerticalSwipes: 0,
    enableClosingConfirmation: 0,
    disableClosingConfirmation: 0,
    showBackButton: 0,
    hideBackButton: 0,
    headerColors: [],
    backgroundColors: [],
    bottomBarColors: [],
  };

  return {
    calls,
    eventListeners,
    backHandlers,
    initDataUnsafe: { user: { language_code: " uk-UA " } },
    viewportHeight: 684,
    viewportStableHeight: 660,
    safeAreaInset: { top: 5, right: 6, bottom: 7, left: 8 },
    contentSafeAreaInset: { top: 15, right: 16, bottom: 17, left: 18 },
    isVersionAtLeast: () => true,
    ready() { calls.ready += 1; },
    expand() { calls.expand += 1; },
    disableVerticalSwipes() { calls.disableVerticalSwipes += 1; },
    enableClosingConfirmation() { calls.enableClosingConfirmation += 1; },
    disableClosingConfirmation() { calls.disableClosingConfirmation += 1; },
    setHeaderColor(color) { calls.headerColors.push(color); },
    setBackgroundColor(color) { calls.backgroundColors.push(color); },
    setBottomBarColor(color) { calls.bottomBarColors.push(color); },
    onEvent(name, callback) {
      const callbacks = eventListeners.get(name) ?? new Set();
      callbacks.add(callback);
      eventListeners.set(name, callbacks);
    },
    offEvent(name, callback) {
      eventListeners.get(name)?.delete(callback);
    },
    emit(name) {
      for (const callback of [...(eventListeners.get(name) ?? [])]) callback();
    },
    BackButton: {
      show() { calls.showBackButton += 1; },
      hide() { calls.hideBackButton += 1; },
      onClick(callback) { backHandlers.add(callback); },
      offClick(callback) { backHandlers.delete(callback); },
      click() {
        for (const callback of [...backHandlers]) callback();
      },
    },
  };
}

test("standalone browser fallback stays operational without Telegram", () => {
  const host = createHost(undefined);
  const cssVariables = createCssVariables();
  const bridge = setupTelegramMiniApp(host, cssVariables);

  assert.equal(bridge.isTelegram, false);
  assert.equal(bridge.languageCode, null);
  assert.equal(cssVariables.values.get("--tg-viewport-height"), "720px");
  assert.equal(cssVariables.values.get("--tg-viewport-stable-height"), "720px");
  assert.doesNotThrow(() => {
    bridge.ready();
    bridge.setGameInProgress(true);
    bridge.setBackHandler(() => {});
    bridge.destroy();
  });
  assert.equal(cssVariables.values.size, 0);
});

test("Telegram startup applies viewport, safe area, locale and lifecycle controls", () => {
  const webApp = createWebApp();
  const host = createHost(webApp);
  const cssVariables = createCssVariables();
  const bridge = setupTelegramMiniApp(host, cssVariables);

  assert.equal(bridge.isTelegram, true);
  assert.equal(bridge.languageCode, "uk-UA");
  assert.equal(cssVariables.values.get("--tg-viewport-height"), "684px");
  assert.equal(cssVariables.values.get("--tg-viewport-stable-height"), "660px");
  assert.equal(cssVariables.values.get("--safe-top"), "15px");
  assert.equal(cssVariables.values.get("--safe-right"), "16px");
  assert.equal(cssVariables.values.get("--safe-bottom"), "17px");
  assert.equal(cssVariables.values.get("--safe-left"), "18px");

  bridge.ready();
  assert.equal(webApp.calls.ready, 1);
  assert.equal(webApp.calls.expand, 1);
  assert.equal(webApp.calls.disableVerticalSwipes, 1);
  assert.deepEqual(webApp.calls.headerColors, ["#0d100c"]);
  assert.deepEqual(webApp.calls.backgroundColors, ["#0d100c"]);
  assert.deepEqual(webApp.calls.bottomBarColors, ["#0d100c"]);

  bridge.setGameInProgress(true);
  bridge.setGameInProgress(true);
  assert.equal(webApp.calls.enableClosingConfirmation, 1);
  bridge.setGameInProgress(false);
  assert.equal(webApp.calls.disableClosingConfirmation, 2);

  let backCount = 0;
  const onBack = () => { backCount += 1; };
  bridge.setBackHandler(onBack);
  webApp.BackButton.click();
  assert.equal(backCount, 1);
  assert.equal(webApp.calls.showBackButton, 1);
  bridge.setBackHandler(undefined);
  webApp.BackButton.click();
  assert.equal(backCount, 1);
  assert.equal(webApp.calls.hideBackButton, 1);
});

test("Telegram events refresh layout and destroy removes every binding", () => {
  const webApp = createWebApp();
  const host = createHost(webApp);
  const cssVariables = createCssVariables();
  const bridge = setupTelegramMiniApp(host, cssVariables);
  let backCount = 0;
  bridge.setBackHandler(() => { backCount += 1; });
  bridge.setGameInProgress(true);

  webApp.viewportHeight = 612;
  webApp.viewportStableHeight = 600;
  webApp.contentSafeAreaInset = { top: 21, right: 22, bottom: 23, left: 24 };
  webApp.emit("viewportChanged");
  webApp.emit("contentSafeAreaChanged");
  assert.equal(cssVariables.values.get("--tg-viewport-height"), "612px");
  assert.equal(cssVariables.values.get("--tg-viewport-stable-height"), "600px");
  assert.equal(cssVariables.values.get("--safe-bottom"), "23px");

  bridge.destroy();
  webApp.BackButton.click();
  assert.equal(backCount, 0);
  assert.equal(webApp.calls.disableClosingConfirmation, 1);
  assert.equal(cssVariables.values.size, 0);
  assert.equal(webApp.eventListeners.get("viewportChanged")?.size, 0);
  assert.equal(host.listeners.get("resize")?.size, 0);
  assert.equal(host.listeners.get("load")?.size, 0);
});

test("Telegram language and version helpers fail closed on malformed clients", () => {
  assert.equal(getTelegramLanguageCode(undefined), null);
  assert.equal(getTelegramLanguageCode({ initDataUnsafe: { user: { language_code: "   " } } }), null);
  assert.equal(getTelegramLanguageCode({ initDataUnsafe: { user: { language_code: "ru-RU" } } }), "ru-RU");
  assert.equal(supportsTelegramVersion(undefined, "8.0"), false);
  assert.equal(supportsTelegramVersion({ isVersionAtLeast: () => false }, "8.0"), false);
  assert.equal(supportsTelegramVersion({ isVersionAtLeast: () => { throw new Error("old client"); } }, "8.0"), false);
});
