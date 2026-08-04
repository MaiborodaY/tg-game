import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const artSource = readFileSync(new URL("../src/rendering/mornaBattlefieldArt.ts", import.meta.url), "utf8");
const sceneSource = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");

test("Morna battlefield state uses fixed pools and deterministic entity assignment", () => {
  assert.match(artSource, /MAX_MORNA_CORPSE_VIEWS = 6/);
  assert.match(artSource, /MAX_MORNA_SUMMON_VIEWS = 3/);
  assert.match(artSource, /Array\.from\([\s\S]*MAX_MORNA_CORPSE_VIEWS[\s\S]*createCorpseArt/);
  assert.match(artSource, /Array\.from\([\s\S]*MAX_MORNA_SUMMON_VIEWS[\s\S]*createSummonArt/);
  assert.match(artSource, /sort\(\(left, right\) => left\.id - right\.id\)/);
  assert.match(artSource, /slots\.find\(\(slot\) => slot\.entityId === entityId\)/);
  assert.match(artSource, /slots\.find\(\(slot\) => slot\.entityId === null\)/);

  const syncSource = artSource.slice(
    artSource.indexOf("export function syncMornaBattlefieldArt"),
    artSource.indexOf("export function destroyMornaBattlefieldArt"),
  );
  assert.doesNotMatch(syncSource, /scene\.add\.|new Phaser/);
});

test("corpse and summon silhouettes remain code-native and mechanically distinct", () => {
  assert.doesNotMatch(artSource, /\.load\.(?:image|spritesheet|atlas)|new Image\(|\.png|\.webp|\.jpg/);
  assert.match(artSource, /function drawCorpse[\s\S]*kind === "essence"[\s\S]*kind === "heavy"/);
  assert.match(artSource, /function drawSummon[\s\S]*kind === "colossus"[\s\S]*kind === "guard"[\s\S]*kind === "warrior"/);
  assert.match(artSource, /healthTrack: Phaser\.GameObjects\.Rectangle/);
  assert.match(artSource, /healthFill: Phaser\.GameObjects\.Rectangle/);
  assert.match(artSource, /summon\.hp \/ Math\.max\(1, summon\.maxHp\)/);
  assert.match(artSource, /blockedEnemyIds\.length > 0/);
});

test("the scene owns, synchronizes, and destroys one Morna battlefield pool", () => {
  assert.match(sceneSource, /private mornaBattlefieldArt\?: MornaBattlefieldArt/);
  assert.equal(sceneSource.match(/createMornaBattlefieldArt\(this\)/g)?.length, 1);
  assert.match(sceneSource, /syncMornaBattlefieldArt\(this\.mornaBattlefieldArt, view\.hero\.morna, view\.simulationTimeMs\)/);
  assert.match(sceneSource, /Phaser\.Scenes\.Events\.SHUTDOWN[\s\S]*destroyMornaBattlefieldArt\(this\.mornaBattlefieldArt\)/);
  assert.match(sceneSource, /frontline && frontlinePresent && !enemy\.blocked/);
});

test("Morna summon events produce readable bounded combat feedback", () => {
  assert.match(sceneSource, /event\.type === "morna_summon_raised"[\s\S]*heroEffects\?\.playAbility\("morna"/);
  assert.match(sceneSource, /event\.type === "morna_summon_attack"[\s\S]*heroEffects\?\.playAttack\("morna"/);
  assert.match(sceneSource, /event\.type === "enemy_attacked_morna_summon"[\s\S]*createFloatingText/);
  assert.match(sceneSource, /event\.type === "morna_summon_destroyed"[\s\S]*event\.reason !== "wave_end" && event\.reason !== "run_end"/);
});

test("selected Morna shows a distinct corpse-harvest radius", () => {
  const rangeSource = sceneSource.slice(
    sceneSource.indexOf("private updateRangePreview"),
    sceneSource.indexOf("private highlightAuraTowers"),
  );
  assert.match(rangeSource, /view\.hero\.id === "morna" && view\.hero\.morna/);
  assert.match(rangeSource, /getMornaRankRules\(view\.hero\.level\)\.harvestRadius/);
  assert.match(rangeSource, /setFillStyle\(0x76518c[\s\S]*setStrokeStyle\(1\.5, 0xbb9bd1/);
  assert.match(rangeSource, /harvestRadius, 0x59e1d2[\s\S]*setStrokeStyle\(3, 0x7ff7e9/);
});
