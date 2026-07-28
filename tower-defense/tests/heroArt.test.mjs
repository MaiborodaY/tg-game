import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/rendering/heroArt.ts", import.meta.url), "utf8");
const sceneSource = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");
const heroAnchorSource = source.slice(
  source.indexOf("export function createHeroAnchorArt"),
  source.indexOf("export function createHeroEffectPool"),
);
const heroIds = ["eira", "toren"];

test("hero art exhaustively maps every approved hero to a profile and builder", () => {
  assert.match(source, /satisfies Readonly<Record<HeroId, HeroVisualProfile>>/);
  assert.match(source, /satisfies Readonly<Record<HeroId, HeroBuilder>>/);
  for (const heroId of heroIds) {
    assert.match(source, new RegExp(`^\\s{2}${heroId}: Object\\.freeze\\(`, "m"));
    assert.match(source, new RegExp(`^\\s{2}${heroId}: draw`, "m"));
  }
  assert.equal(new Set(heroIds).size, heroIds.length);
});

test("Eira and Toren keep distinct readable silhouettes and signature weapons", () => {
  assert.match(source, /function drawEira[\s\S]*fillTriangle[\s\S]*bow\.arc[\s\S]*arrowHead/);
  assert.match(source, /function drawToren[\s\S]*leftShoulder[\s\S]*beard[\s\S]*hammerHead[\s\S]*rune/);
  assert.match(source, /eira:[\s\S]*primary: 0x2f7550[\s\S]*accent: 0xe6c665/);
  assert.match(source, /toren:[\s\S]*primary: 0x777a74[\s\S]*accent: 0xb77b43/);
  assert.match(source, /toren:[\s\S]*shadowWidth: 48/);
  assert.match(source, /eira:[\s\S]*shadowWidth: 37/);
});

test("hero rendering stays code-native and pools bounded combat effects", () => {
  assert.doesNotMatch(source, /\.load\.(?:image|spritesheet|atlas)|new Image\(|\.png|\.webp|\.jpg/);
  assert.match(source, /const MAX_ATTACK_EFFECTS = 12/);
  assert.match(source, /const MAX_ABILITY_EFFECTS = 4/);
  assert.match(source, /pool\.find\(\(effect\) => !effect\.active\)/);
  assert.match(source, /onComplete: \(\) => releaseAttackEffect\(effect\)/);
  assert.match(source, /onComplete: \(\) => releaseAbilityEffect\(effect\)/);
});

test("hero anchors expose explicit hidden, available, and selected states", () => {
  assert.match(source, /state: "hidden" \| "available" \| "selected"/);
  assert.match(source, /setVisible\(state !== "hidden"\)/);
  assert.match(source, /const selected = state === "selected"/);
  assert.doesNotMatch(heroAnchorSource, /scene\.add\.circle/);
  assert.match(heroAnchorSource, /HERO_ANCHOR_PLATFORM_POINTS/);
  assert.match(heroAnchorSource, /HERO_ANCHOR_CORE_POINTS/);
  assert.match(heroAnchorSource, /fillEllipse\(-5, 2, 5, 9\)/);
  assert.match(source, /available:[\s\S]*platformStroke: 0x8dffe0[\s\S]*rune: 0xe4fff7/);
  assert.match(source, /selected:[\s\S]*platformStroke: 0xf2d06f[\s\S]*rune: 0xfff1ba/);
});

test("hero placement keeps generous hit targets and visually subdues tower pads", () => {
  assert.match(sceneSource, /this\.add\.zone\(point\.x, point\.y, 64, 64\)/);
  assert.match(sceneSource, /const anchorsAvailable = this\.selectedHero && view\.phase === "setup"/);
  assert.match(sceneSource, /anchorsAvailable[\s\S]*\? anchorId === view\.hero\.anchorId \? "selected" : "available"[\s\S]*: "hidden"/);
  assert.match(sceneSource, /const heroPlacementActive = this\.selectedHero && viewState\.phase === "setup"/);
  assert.match(sceneSource, /if \(heroPlacementActive\) \{[\s\S]*view\.ring\.setStrokeStyle\(1, 0x49685c[\s\S]*continue;/);
  assert.match(sceneSource, /this\.selectedHero = false;[\s\S]*this\.updateHeroSelectionVisuals\(\);[\s\S]*this\.updatePadVisuals\(\);/);
});

test("the Phaser scene derives hero rendering and selection from simulation state", () => {
  assert.match(sceneSource, /private selectedHero = false/);
  assert.match(sceneSource, /this\.level\.heroAnchors\.forEach\(\(point, anchorId\) =>/);
  assert.match(sceneSource, /this\.simulation\.moveHero\(anchorId\)/);
  assert.match(sceneSource, /this\.simulation\.upgradeHero\(\)/);
  assert.match(sceneSource, /this\.simulation\.useHeroAbility\(\)/);
  assert.match(sceneSource, /hero: view\.hero/);
  assert.match(sceneSource, /selectedHero: this\.selectedHero/);
  assert.match(sceneSource, /heroAbilityAvailable: view\.heroAbilityAvailable/);
});

test("selected heroes reuse the range preview for their primary level mechanic", () => {
  assert.match(sceneSource, /import \{ getHeroStats \} from "\.\.\/game\/heroes\.ts"/);
  assert.match(sceneSource, /if \(this\.selectedHero\) \{[\s\S]*getHeroStats\(view\.hero\.id, view\.hero\.level\)/);
  assert.match(sceneSource, /view\.hero\.level === 1[\s\S]*stats\.attackRange/);
  assert.match(sceneSource, /view\.hero\.id === "eira"[\s\S]*stats\.towerDamageAuraRadius[\s\S]*stats\.slowAuraRadius/);
  assert.match(sceneSource, /this\.add\.circle\(view\.hero\.x, view\.hero\.y, radius/);
});

test("hero ability failures keep a distinct unavailable notice", () => {
  const abilitySource = sceneSource.slice(
    sceneSource.indexOf("useHeroAbility(): boolean"),
    sceneSource.indexOf("usePulse(): boolean"),
  );
  assert.match(abilitySource, /result\.error \|\| "hero_ability_unavailable"/);
  assert.doesNotMatch(abilitySource, /hero_ability_unavailable[\s\S]*pulse_used/);
});

test("hero movement and upgrade haptics come only from simulation events", () => {
  const upgradeSource = sceneSource.slice(
    sceneSource.indexOf("upgradeHero(): boolean"),
    sceneSource.indexOf("upgradeSelectedTower(): boolean"),
  );
  const moveSource = sceneSource.slice(
    sceneSource.indexOf("private handleHeroAnchorClick"),
    sceneSource.indexOf("private syncHeroView"),
  );
  assert.doesNotMatch(upgradeSource, /callbacks\.onHaptic/);
  assert.doesNotMatch(moveSource, /callbacks\.onHaptic/);
  assert.match(sceneSource, /event\.type === "haptic"[\s\S]*callbacks\.onHaptic\(event\.kind\)/);
});

test("hero domain events use pooled rendering effects instead of gameplay branches", () => {
  assert.match(sceneSource, /event\.type === "hero_attack"[\s\S]*heroEffects\?\.playAttack/);
  assert.match(sceneSource, /event\.type === "hero_ability"[\s\S]*heroEffects\?\.playAbility/);
  assert.match(sceneSource, /createHeroEffectPool\(this\)/);
  assert.match(sceneSource, /Phaser\.Scenes\.Events\.SHUTDOWN[\s\S]*heroEffects\?\.destroy\(\)/);
  assert.doesNotMatch(sceneSource, /campaign\.hero\s*=|campaign\.hero\.[a-zA-Z]+\s*=/);
});

test("Eira's persistent mark reuses one visual and follows the simulation target", () => {
  const heroSyncSource = sceneSource.slice(
    sceneSource.indexOf("private syncHeroView"),
    sceneSource.indexOf("private updateHeroSelectionVisuals"),
  );
  const markSyncSource = heroSyncSource.slice(heroSyncSource.indexOf("const markedEnemy"));
  assert.equal(source.match(/const mark = createHeroMark\(scene\)/g)?.length, 1);
  assert.match(source, /function setMark\(point: Point \| null, elapsedMs: number\)/);
  assert.match(source, /mark\.container[\s\S]*setPosition\(point\.x, point\.y\)[\s\S]*setVisible\(true\)/);
  assert.match(sceneSource, /hero\.markedEnemyId[\s\S]*view\.enemies\.find[\s\S]*heroEffects\?\.setMark/);
  assert.doesNotMatch(markSyncSource, /this\.add\./);
});
