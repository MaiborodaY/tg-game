import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getTowerTierVisualProfile, isPointWithinVisualRadius } from "../src/rendering/worldThemes.ts";

const artSource = readFileSync(new URL("../src/rendering/art.ts", import.meta.url), "utf8");
const sceneSource = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");

test("tower tier profiles create four increasingly substantial silhouettes", () => {
  const towerTypes = ["ranger", "frost", "ember", "storm"];
  const accents = new Set();

  for (const type of towerTypes) {
    const tiers = [1, 2, 3, 4].map((level) => getTowerTierVisualProfile(type, level));
    assert.deepEqual(tiers.map((profile) => profile.footprintRadius), [17, 18, 20, 22]);
    assert.deepEqual(tiers.map((profile) => profile.headLift), [0, 2, 4, 6]);
    assert.deepEqual(tiers.map((profile) => profile.buttressCount), [0, 2, 4, 4]);
    assert.deepEqual(tiers.map((profile) => profile.mastery), [false, false, false, true]);
    assert.ok(tiers.every(Object.isFrozen));
    accents.add(tiers[0].accent);
  }

  assert.equal(accents.size, towerTypes.length);
});

test("each tower family gains authored tier details beyond level dots", () => {
  for (const functionName of ["drawRanger", "drawFrost", "drawEmber", "drawStorm"]) {
    const start = artSource.indexOf(`function ${functionName}(`);
    const next = artSource.indexOf("\nfunction ", start + 1);
    const source = artSource.slice(start, next === -1 ? undefined : next);
    assert.match(source, /level >= 2/);
    assert.match(source, /level >= 3/);
    assert.match(source, /level === 4/);
  }
  assert.match(artSource, /drawTowerTierBase\(base, profile, level\)/);
  assert.doesNotMatch(artSource, /for \(let index = 0; index < level; index \+= 1\)[\s\S]*fillCircle\(-6 \+ index \* 6, 11, 2\)/);
});

test("Embermage replaces perpetual flame motion with one static tier sprite", () => {
  const emberEntry = artSource.slice(
    artSource.indexOf("function drawEmberTower"),
    artSource.indexOf("function drawEmber", artSource.indexOf("function drawEmberTower") + 1),
  );
  assert.match(emberEntry, /createEmberMageTierSprite/);
  assert.doesNotMatch(emberEntry, /scene\.tweens|repeat:\s*-1/);
  assert.match(sceneSource, /tower\.placement\.type !== "ember"/);
});

test("successful build and upgrade commands play one bounded Phaser feedback effect", () => {
  const feedback = artSource.slice(
    artSource.indexOf("export function playTowerConstructionEffect"),
    artSource.indexOf("export function createEnemyArt"),
  );
  assert.match(feedback, /const effect = scene\.add\.graphics\(\)/);
  assert.match(feedback, /onComplete: \(\) => effect\.destroy\(\)/);
  assert.doesNotMatch(feedback, /repeat:\s*-1/);

  const upgrade = sceneSource.slice(
    sceneSource.indexOf("upgradeSelectedTower(): boolean"),
    sceneSource.indexOf("sellSelectedTower(): boolean"),
  );
  const build = sceneSource.slice(
    sceneSource.indexOf("private handlePadClick"),
    sceneSource.indexOf("private syncTowerViews"),
  );
  assert.match(upgrade, /if \(!result\.ok\)[\s\S]*return false;[\s\S]*playTowerConstructionEffect/);
  assert.match(build, /if \(!result\.ok\)[\s\S]*return;[\s\S]*playTowerConstructionEffect/);
});

test("local hero aura markers use the same inclusive radius boundary as combat", () => {
  const hero = { x: 20, y: 30 };
  assert.equal(isPointWithinVisualRadius({ x: 23, y: 34 }, hero, 5), true);
  assert.equal(isPointWithinVisualRadius({ x: 23.01, y: 34 }, hero, 5), false);
  assert.equal(isPointWithinVisualRadius(hero, hero, 0), false);
  assert.equal(isPointWithinVisualRadius(hero, hero, Number.NaN), false);

  assert.match(artSource, /export function setTowerAuraMarker[\s\S]*setVisible\(false\)/);
  assert.match(sceneSource, /private syncTowerAuraMarkers[\s\S]*isPointWithinVisualRadius\(point, view\.hero, aura\.radius\)/);
  assert.match(sceneSource, /setTowerAuraMarker\(towerView\.art, towerAuraKind, this\.selectedHero\)/);
});

test("boss arrival and gate impact polish stay transient and code-native", () => {
  const bossEffect = artSource.slice(
    artSource.indexOf("export function createBossArrivalEffect"),
    artSource.indexOf("export function createGateHitEffect"),
  );
  assert.match(bossEffect, /const sigil = scene\.add\.graphics\(\)/);
  assert.match(bossEffect, /onComplete: \(\) => sigil\.destroy\(\)/);
  assert.doesNotMatch(bossEffect, /repeat:\s*-1|\.load\./);
  assert.match(sceneSource, /event\.type === "boss_spawned"[\s\S]*createBossArrivalEffect\(this, boss, boss\.bossTier, this\.worldArt\?\.themeId\)/);
  assert.match(artSource, /const wardPulse = scene\.add\.circle[\s\S]*onComplete: \(\) => wardPulse\.destroy\(\)/);
});
