import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { TOWER_GUIDE_ENTRIES } from "../src/towerGuide.ts";
import { translations } from "../src/i18n.ts";

test("tower guide covers every tower with localized matchup advice", () => {
  assert.deepEqual(TOWER_GUIDE_ENTRIES.map((entry) => entry.type), ["ranger", "frost", "ember", "storm"]);
  for (const locale of Object.keys(translations)) {
    for (const entry of TOWER_GUIDE_ENTRIES) {
      assert.ok(translations[locale][entry.descriptionKey]);
      assert.ok(translations[locale][entry.strongKey]);
      assert.ok(translations[locale][entry.weakKey]);
    }
  }
});

test("tower guide dialog is labelled and controlled by an accessible button", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  assert.match(html, /id="tower-guide-button"[^>]*aria-controls="tower-guide-overlay"[^>]*aria-expanded="false"/);
  assert.match(html, /id="tower-guide-overlay"[^>]*hidden/);
  assert.match(html, /role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="tower-guide-title"/);
  assert.match(main, /elements\.appShell\.inert = true;/);
  assert.match(main, /elements\.appShell\.inert = false;/);
});
