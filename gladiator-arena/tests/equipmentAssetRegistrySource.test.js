import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const registrySource = readFileSync(resolve(currentDir, "../src/equipmentAssetRegistry.ts"), "utf8");

test("auto equipment registry only exposes promoted webp armor assets", () => {
  assert.match(registrySource, /armorWebpAssetUrlLoaders/);
  assert.doesNotMatch(registrySource, /armorPngAssetUrls/);
  assert.doesNotMatch(registrySource, /"\.\/assets\/fighters\/armor\/\*\*\/\*\.png"/);
  assert.match(registrySource, /createAutoEquipmentAssetEntries/);
  assert.match(registrySource, /entriesByAssetKey\.set\(assetKey, assetPath\)/);
  assert.doesNotMatch(registrySource, /eager: true/);
});

test("auto equipment registry can expose weapon assets", () => {
  assert.match(registrySource, /weaponWebpAssetUrlLoaders/);
  assert.doesNotMatch(registrySource, /weaponPngAssetUrls/);
  assert.doesNotMatch(registrySource, /"\.\/assets\/fighters\/weapons\/\*\*\/\*\.png"/);
  assert.match(registrySource, /lowWeaponAssetUrlLoaders/);
  assert.match(registrySource, /prefix: "weapon-"/);
  assert.match(registrySource, /slot: "weaponMain"/);
  assert.match(registrySource, /assetKey: "weaponMainAssetKey"/);
  assert.match(registrySource, /weaponBowAssetKey\?: string/);
  assert.match(registrySource, /kind: "weapon"/);
  assert.match(registrySource, /const weaponClass = getWeaponClassFromText\(suffix\)/);
  assert.match(registrySource, /equipmentSlot: weaponClass === "bow" \? "weaponBow" : slotConfig\.slot/);
  assert.match(registrySource, /return item\.kind === "weapon" && item\.weaponClass === "bow" \? "weaponBowAssetKey" : fallback/);
  assert.match(registrySource, /text\.includes\("bow"\)/);
  assert.match(registrySource, /text\.includes\("axe"\)/);
  assert.match(registrySource, /text\.includes\("mace"\)/);
  assert.match(registrySource, /text\.includes\("spear"\)/);
  assert.match(registrySource, /text\.includes\("shuriken"\)/);
  assert.match(registrySource, /GENERATED_EQUIPMENT_ITEM_ASSET_KEYS/);
  assert.match(registrySource, /const generatedEquipmentAssetKeys = new Set/);
  assert.match(registrySource, /const registeredEquipmentAssetKeys = generatedEquipmentAssetKeys/);
});

test("auto equipment registry prefers low webp paths for runtime previews", () => {
  assert.match(registrySource, /replace\("\.\/assets\/", "\.\/assets-low\/"\)\.replace/);
  assert.match(registrySource, /\.replace\(\/\\\.\(\?:png\|webp\)\$\/i, "\.webp"\)/);
});

test("auto equipment registry recognizes wrist glove and shield armor assets", () => {
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
  assert.match(registrySource, /prefix: "shield-"/);
  assert.match(registrySource, /slot: "shield"/);
  assert.match(registrySource, /assetKey: "shieldAssetKey"/);
});

test("equipment set importer reads only staged import assets", () => {
  assert.match(registrySource, /equipmentImportArmorWebpAssetUrlLoaders/);
  assert.match(registrySource, /equipmentImportArmorPngAssetUrlLoaders/);
  assert.match(registrySource, /equipmentImportWeaponWebpAssetUrlLoaders/);
  assert.match(registrySource, /equipmentImportWeaponPngAssetUrlLoaders/);
  assert.match(registrySource, /assets\/equipment-import\/armor/);
  assert.match(registrySource, /assets\/equipment-import\/weapons/);
  assert.match(registrySource, /createEquipmentImportAssetEntries/);
  assert.match(registrySource, /getAssetPathWithoutExtension/);
  assert.match(registrySource, /getEquipmentSetImportAssetUrl/);
});

test("equipment asset urls resolve lazily from source paths", () => {
  assert.match(registrySource, /export function resolveEquipmentAssetUrl\(sourcePath: string\): Promise<string \| undefined>/);
  assert.match(registrySource, /const equipmentAssetUrlPromises = new Map<string, Promise<string>>/);
  assert.match(registrySource, /const loader = equipmentAssetUrlLoaders\[assetPath\]/);
  assert.match(registrySource, /urlPromise = loader\(\)/);
  assert.doesNotMatch(registrySource, /url: string;/);
  assert.doesNotMatch(registrySource, /lowUrl\?: string;/);
});
