import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

const introMarkup = elementMarkupById(html, "intro-overlay");
const gameMenuMarkup = elementMarkupById(html, "game-menu-overlay");
const settingsMarkup = elementMarkupById(html, "settings-overlay");
const settingsFunctions = main.slice(
  main.indexOf("function openSettings"),
  main.indexOf("function openLeaderboard"),
);

test("one accessible settings dialog serves the intro and paused game menu", () => {
  assert.match(html, /id="intro-settings"[^>]*aria-controls="settings-overlay"[^>]*aria-expanded="false"/);
  assert.match(html, /id="game-menu-settings-button"[^>]*aria-controls="settings-overlay"[^>]*aria-expanded="false"/);
  assert.match(html, /id="settings-overlay"[^>]*hidden/);
  assert.match(settingsMarkup, /role="dialog"/);
  assert.match(settingsMarkup, /aria-modal="true"/);
  assert.match(settingsMarkup, /aria-labelledby="settings-title"/);
  assert.match(settingsMarkup, /id="settings-close"[^>]*aria-label=/);
  assert.match(settingsMarkup, /id="settings-done"/);

  assert.doesNotMatch(introMarkup, /id="intro-attempts"|data-role="language"|data-audio-toggle|id="fullscreen-button"/);
  assert.doesNotMatch(gameMenuMarkup, /id="intro-attempts"|data-role="language"|data-audio-toggle|id="fullscreen-button"/);
  assert.match(settingsMarkup, /id="intro-attempts"[^>]*settings-attempts/);
  assert.match(settingsMarkup, /<span role="status">[\s\S]*id="intro-attempts-value"/);
  assert.match(settingsMarkup, /data-role="language"/);
  assert.match(settingsMarkup, /data-audio-toggle="music"[^>]*aria-pressed="true"/);
  assert.match(settingsMarkup, /data-audio-toggle="sfx"[^>]*aria-pressed="true"/);
  assert.match(settingsMarkup, /id="fullscreen-button"[^>]*aria-pressed="false"[^>]*hidden/);
  assert.equal(html.match(/data-role="language"/g)?.length, 1);
  assert.equal(html.match(/data-audio-toggle="music"/g)?.length, 1);
  assert.equal(html.match(/data-audio-toggle="sfx"/g)?.length, 1);
  assert.equal(html.match(/id="fullscreen-button"/g)?.length, 1);
});

test("settings preserve their intro or menu origin and restore launcher focus", () => {
  assert.match(main, /elements\.introSettings\.addEventListener\("click", \(\) => openSettings\("intro"\)\)/);
  assert.match(main, /elements\.gameMenuSettingsButton\.addEventListener\("click", \(\) => openSettings\("menu"\)\)/);
  assert.match(settingsFunctions, /settingsOrigin = origin;/);
  assert.match(settingsFunctions, /settingsReturnFocus = document\.activeElement instanceof HTMLElement[\s\S]*elements\.introSettings : elements\.gameMenuSettingsButton/);
  assert.match(settingsFunctions, /if \(origin === "intro"\) \{[\s\S]*introOverlay\.hidden = true;[\s\S]*introSettings\.setAttribute\("aria-expanded", "true"\)/);
  assert.match(settingsFunctions, /else \{[\s\S]*gameMenuOverlay\.hidden = true;[\s\S]*gameMenuSettingsButton\.setAttribute\("aria-expanded", "true"\)/);
  assert.match(settingsFunctions, /settingsOverlay\.hidden = false;[\s\S]*settingsClose\.focus\(\)/);
  assert.match(settingsFunctions, /const origin = settingsOrigin;[\s\S]*settingsOrigin = null;[\s\S]*settingsReturnFocus = null/);
  assert.match(settingsFunctions, /if \(origin === "intro"\) \{[\s\S]*introOverlay\.hidden = false/);
  assert.match(settingsFunctions, /else if \(origin === "menu"\) \{[\s\S]*gameMenuOverlay\.hidden = false;[\s\S]*gameMenuButton\.setAttribute\("aria-expanded", "true"\)/);
  assert.match(settingsFunctions, /if \(returnFocus\?\.isConnected\) returnFocus\.focus\(\)/);
});

test("backdrop and Escape close settings without resuming gameplay", () => {
  assert.match(main, /elements\.settingsClose\.addEventListener\("click", closeSettings\)/);
  assert.match(main, /elements\.settingsDone\.addEventListener\("click", closeSettings\)/);
  assert.match(main, /elements\.settingsOverlay\.addEventListener\("click", \(event\) => \{\s*if \(event\.target === elements\.settingsOverlay\) closeSettings\(\);/);
  assert.match(main, /if \(event\.key !== "Escape"\) return;[\s\S]*else if \(!elements\.settingsOverlay\.hidden\) closeSettings\(\);[\s\S]*else if \(!elements\.gameMenuOverlay\.hidden\) closeGameMenu\(true\);/);
  assert.doesNotMatch(settingsFunctions, /setPaused\(|closeGameMenu\(|resumeAfterMenu\s*=/);
});

test("settings controls remain reachable in compact Telegram viewports", () => {
  assert.match(css, /\.secondary-action\.intro-settings \{[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.settings-card \{[^}]*max-height:/s);
  assert.match(css, /\.settings-card > \.modal-primary \{[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.game-menu-card \{[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior:\s*contain;/s);
  assert.match(css, /\.modal-layer \{[^}]*env\(safe-area-inset-bottom\)/s);
});

function elementMarkupById(source, id) {
  const idIndex = source.indexOf(`id="${id}"`);
  if (idIndex < 0) return "";
  const start = source.lastIndexOf("<", idIndex);
  const openingTag = source.slice(start).match(/^<([a-z][a-z0-9-]*)\b[^>]*>/i);
  if (!openingTag) return "";
  const tagName = openingTag[1];
  const tokens = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tokens.lastIndex = start;
  let depth = 0;
  for (let token = tokens.exec(source); token; token = tokens.exec(source)) {
    depth += token[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return source.slice(start, tokens.lastIndex);
  }
  return "";
}
