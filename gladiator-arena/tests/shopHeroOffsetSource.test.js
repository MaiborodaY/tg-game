import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const offsetSource = readFileSync(resolve(currentDir, "../src/shopHeroOffset.ts"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

test("shop hero offset persists separately from player settings", () => {
  assert.match(offsetSource, /dust-arena-shop-hero-offset-y/);
  assert.match(offsetSource, /window\.localStorage\.getItem\(storageKey\)/);
  assert.match(offsetSource, /window\.localStorage\.setItem\(storageKey, String\(offsetY\)\)/);
  assert.match(offsetSource, /SHOP_HERO_OFFSET_Y_MIN = -140/);
  assert.match(offsetSource, /SHOP_HERO_OFFSET_Y_MAX = 120/);
});

test("city hero canvas only receives pointer events while a shop is open", () => {
  assert.match(stylesSource, /\.city-menu__hero[\s\S]*pointer-events: none/);
  assert.match(stylesSource, /\.city-menu--armory-open \.city-menu__hero[\s\S]*pointer-events: auto/);
});
