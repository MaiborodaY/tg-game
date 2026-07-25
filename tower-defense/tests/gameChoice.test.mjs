import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DEFAULT_BRIDGE_APP_URL,
  buildBridgeLaunchUrl,
  shouldProtectRewardNavigation,
  shouldShowTowerDefenseIntro,
} from "../src/gameChoice.ts";

const html = readFileSync(new globalThis.URL("../index.html", import.meta.url), "utf8");

test("Bridge navigation keeps Telegram launch data without leaking Tower Defense rewards", () => {
  const target = new globalThis.URL(buildBridgeLaunchUrl(
    "https://games.example/td/?run_id=run-secret&token=reward-secret&lang=ru"
      + "#tgWebAppData=signed-data&tgWebAppVersion=8.0&untrusted=drop-me",
  ));

  assert.equal(target.origin, new globalThis.URL(DEFAULT_BRIDGE_APP_URL).origin);
  assert.equal(target.searchParams.get("source"), "td");
  assert.equal([...target.searchParams].length, 1);
  assert.equal(target.hash.includes("tgWebAppData=signed-data"), true);
  assert.equal(target.hash.includes("tgWebAppVersion=8.0"), true);
  assert.equal(target.hash.includes("untrusted"), false);
  assert.equal(target.href.includes("run-secret"), false);
  assert.equal(target.href.includes("reward-secret"), false);
});

test("a configured Bridge URL keeps its own local-development parameters", () => {
  const target = new globalThis.URL(buildBridgeLaunchUrl(
    "http://127.0.0.1:5173/#tgWebAppPlatform=desktop",
    "http://127.0.0.1:8787/?dev_user=chooser",
  ));

  assert.equal(target.origin, "http://127.0.0.1:8787");
  assert.equal(target.searchParams.get("dev_user"), "chooser");
  assert.equal(target.searchParams.get("source"), "td");
  assert.equal(new globalThis.URLSearchParams(target.hash.slice(1)).get("tgWebAppPlatform"), "desktop");
});

test("encoded Telegram initData survives the cross-origin round trip once", () => {
  const initData = "query_id=AA%2B42&user={\"id\":42}&auth_date=1784990000";
  const sourceHash = new globalThis.URLSearchParams({ tgWebAppData: initData }).toString();
  const target = new globalThis.URL(buildBridgeLaunchUrl(`https://games.example/td/#${sourceHash}`));

  assert.equal(
    new globalThis.URLSearchParams(target.hash.slice(1)).get("tgWebAppData"),
    initData,
  );
});

test("an invalid configured URL falls back to the production Bridge worker", () => {
  assert.equal(
    new globalThis.URL(buildBridgeLaunchUrl("https://games.example/td/", "not a url")).origin,
    new globalThis.URL(DEFAULT_BRIDGE_APP_URL).origin,
  );
  assert.equal(
    new globalThis.URL(buildBridgeLaunchUrl("https://games.example/td/", "javascript:alert(1)")).origin,
    new globalThis.URL(DEFAULT_BRIDGE_APP_URL).origin,
  );
  assert.equal(
    new globalThis.URL(buildBridgeLaunchUrl("https://games.example/td/", "http://bridge.example/")).origin,
    new globalThis.URL(DEFAULT_BRIDGE_APP_URL).origin,
  );
});

test("Tower Defense intro is only shown for a first visit or a launch error", () => {
  assert.equal(shouldShowTowerDefenseIntro(false, 0, false), true);
  assert.equal(shouldShowTowerDefenseIntro(false, 0, true), false);
  assert.equal(shouldShowTowerDefenseIntro(false, 8, false), false);
  assert.equal(shouldShowTowerDefenseIntro(true, 8, true), true);
});

test("intentional Bridge navigation bypasses only the unfinished reward warning", () => {
  assert.equal(shouldProtectRewardNavigation(true, false, false), true);
  assert.equal(shouldProtectRewardNavigation(true, false, true), false);
  assert.equal(shouldProtectRewardNavigation(true, true, false), false);
  assert.equal(shouldProtectRewardNavigation(false, false, false), false);
});

test("game chooser is the initial accessible dialog and keeps the old intro available", () => {
  assert.match(html, /id="game-choice-overlay" class="modal-layer">/);
  assert.match(html, /role="dialog" aria-modal="true" aria-labelledby="game-choice-title"/);
  assert.match(html, /id="intro-overlay" class="modal-layer" hidden>/);
  assert.match(html, /id="intro-back-to-games"/);
});
