import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CARD_DEFINITIONS, CARD_BY_ID } from "../src/game/cards.ts";

test("responsive card fixture covers the full roster and exact reported low-silhouette regression", async () => {
  const fixture = await readFile(new URL("./visual/cards.ts", import.meta.url), "utf8");
  assert.equal(CARD_DEFINITIONS.length, 42);
  for (const id of ["forest_skirmisher", "sneakblade", "plague_rat"]) {
    assert.ok(CARD_BY_ID[id]);
    assert.ok(fixture.includes(`"${id}"`));
  }
  assert.match(fixture, /CARD_DEFINITIONS\.slice/);
  assert.match(fixture, /for \(const nextLocale of SUPPORTED_LOCALES\)/);
  assert.match(fixture, /for \(const withBadges of \[false, true\]\)/);
});

test("card geometry fixture uses production art and verifies painted alpha bounds instead of transparent image bounds", async () => {
  const fixture = await readFile(new URL("./visual/cards.ts", import.meta.url), "utf8");
  for (const css of ["styles.css", "gameplay-theme.css", "draft-card-theme.css"]) assert.ok(fixture.includes(css));
  assert.match(fixture, /createDraftCardSilhouette\(card\.id/);
  assert.match(fixture, /getImageData/);
  assert.match(fixture, /getScreenCTM/);
  assert.match(fixture, /document\.fonts\.ready/);
  assert.match(fixture, /image\.decode\(\)/);
  assert.doesNotMatch(fixture, /(?:fetch|localStorage|sessionStorage|mountBattlefield)\s*[.(]/);
});

test("the responsive card fixture has a local HTML entry and no production link", async () => {
  const html = await readFile(new URL("./visual/cards.html", import.meta.url), "utf8");
  assert.match(html, /type="module" src="\.\/cards\.ts"/);
  for (const path of ["../index.html", "../src/main.ts"]) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /tests\/visual|visual\/cards|card-fixture/);
  }
});
