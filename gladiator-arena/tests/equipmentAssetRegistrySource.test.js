import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const registrySource = readFileSync(resolve(currentDir, "../src/equipmentAssetRegistry.ts"), "utf8");

test("auto equipment registry can expose png-only armor assets", () => {
  assert.match(registrySource, /armorWebpAssetUrls/);
  assert.match(registrySource, /armorPngAssetUrls/);
  assert.match(registrySource, /createAutoArmorAssetEntries/);
  assert.match(registrySource, /entriesByAssetKey\.set\(assetKey, \[assetPath, url\]\)/);
});

test("auto equipment registry prefers low webp paths for png previews", () => {
  assert.match(registrySource, /replace\("\.\/assets\/", "\.\/assets-low\/"\)\.replace/);
  assert.match(registrySource, /\.replace\(\/\\\.\(\?:png\|webp\)\$\/i, "\.webp"\)/);
});
