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
  assert.match(registrySource, /createAutoEquipmentAssetEntries/);
  assert.match(registrySource, /entriesByAssetKey\.set\(assetKey, \[assetPath, url\]\)/);
});

test("auto equipment registry can expose weapon assets", () => {
  assert.match(registrySource, /weaponWebpAssetUrls/);
  assert.match(registrySource, /weaponPngAssetUrls/);
  assert.match(registrySource, /lowWeaponAssetUrls/);
  assert.match(registrySource, /prefix: "weapon-"/);
  assert.match(registrySource, /slot: "weaponMain"/);
  assert.match(registrySource, /assetKey: "weaponMainAssetKey"/);
  assert.match(registrySource, /kind: "weapon"/);
  assert.match(registrySource, /weaponClass: getWeaponClassFromText\(suffix\)/);
  assert.match(registrySource, /text\.includes\("bow"\)/);
  assert.match(registrySource, /text\.includes\("axe"\)/);
  assert.match(registrySource, /FIGHTER_WEAPON_SWORD_01_ASSET_KEY/);
});

test("auto equipment registry prefers low webp paths for png previews", () => {
  assert.match(registrySource, /replace\("\.\/assets\/", "\.\/assets-low\/"\)\.replace/);
  assert.match(registrySource, /\.replace\(\/\\\.\(\?:png\|webp\)\$\/i, "\.webp"\)/);
});

test("auto equipment registry recognizes wrist and glove armor assets", () => {
  assert.match(registrySource, /prefix: "back-wrist-"/);
  assert.match(registrySource, /slot: "backWrist"/);
  assert.match(registrySource, /assetKey: "backWristAssetKey"/);
  assert.match(registrySource, /prefix: "front-wrist-"/);
  assert.match(registrySource, /slot: "frontWrist"/);
  assert.match(registrySource, /assetKey: "frontWristAssetKey"/);
  assert.match(registrySource, /prefix: "back-glove-"/);
  assert.match(registrySource, /slot: "backGlove"/);
  assert.match(registrySource, /assetKey: "backGloveAssetKey"/);
  assert.match(registrySource, /prefix: "front-glove-"/);
  assert.match(registrySource, /slot: "frontGlove"/);
  assert.match(registrySource, /assetKey: "frontGloveAssetKey"/);
});
