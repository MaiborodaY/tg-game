import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const telegramSource = await readFile(new URL("../src/telegram.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("Telegram SDK loads before the application module", () => {
  const telegramSdkPosition = indexHtml.indexOf("https://telegram.org/js/telegram-web-app.js");
  const applicationModulePosition = indexHtml.indexOf('type="module" src="/src/main.ts"');
  assert.ok(telegramSdkPosition >= 0, "Telegram WebApp SDK must be present");
  assert.ok(applicationModulePosition > telegramSdkPosition, "Telegram SDK must load before the game module");
});

test("game lifecycle is connected to Telegram without requiring a backend", () => {
  assert.match(mainSource, /telegram\.languageCode \?\? navigator\.language/);
  assert.match(mainSource, /telegram\.ready\(\)/);
  assert.match(mainSource, /telegram\.setGameInProgress\(gameInProgress\)/);
  assert.match(mainSource, /telegram\.setBackHandler\(/);
  assert.match(styles, /height:\s*var\(--tg-viewport-stable-height,\s*100dvh\)/);

  assert.match(telegramSource, /BackButton/);
  assert.match(telegramSource, /contentSafeAreaInset/);
  assert.doesNotMatch(telegramSource, /\bfetch\s*\(|\bsendBeacon\s*\(|\.initData\b/);
});
