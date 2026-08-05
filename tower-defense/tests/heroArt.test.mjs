import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";
import {
  EIRA_BATTLE_ATLAS_SPEC,
  EIRA_BATTLE_FRAMES,
  selectEiraBattleFrame,
  selectEiraFacing,
} from "../src/rendering/eiraBattleAtlas.ts";

const source = readFileSync(new URL("../src/rendering/heroArt.ts", import.meta.url), "utf8");
const sceneSource = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");
const heroAnchorSource = source.slice(
  source.indexOf("export function createHeroAnchorArt"),
  source.indexOf("export function createHeroEffectPool"),
);
const heroIds = ["eira", "toren", "grak", "morna"];

test("hero art exhaustively maps every approved hero to a profile and builder", () => {
  assert.match(source, /satisfies Readonly<Record<HeroId, HeroVisualProfile>>/);
  assert.match(source, /satisfies Readonly<Record<HeroId, HeroBuilder>>/);
  for (const heroId of heroIds) {
    assert.match(source, new RegExp(`^\\s{2}${heroId}: Object\\.freeze\\(`, "m"));
    assert.match(source, new RegExp(`^\\s{2}${heroId}: draw`, "m"));
  }
  assert.equal(new Set(heroIds).size, heroIds.length);
});

test("every hero keeps a distinct readable silhouette and signature weapon", () => {
  assert.match(source, /function drawEira[\s\S]*fillTriangle[\s\S]*bow\.arc[\s\S]*arrowHead/);
  assert.match(source, /function drawToren[\s\S]*leftShoulder[\s\S]*beard[\s\S]*hammerHead[\s\S]*rune/);
  assert.match(source, /eira:[\s\S]*primary: 0x2f7550[\s\S]*accent: 0xe6c665/);
  assert.match(source, /toren:[\s\S]*primary: 0x777a74[\s\S]*accent: 0xb77b43/);
  assert.match(source, /toren:[\s\S]*shadowWidth: 48/);
  assert.match(source, /eira:[\s\S]*shadowWidth: 37/);
  assert.match(source, /function drawGrak[\s\S]*backBanner[\s\S]*leftTusk[\s\S]*mohawk[\s\S]*axeHead[\s\S]*axeRune/);
  assert.match(source, /grak:[\s\S]*primary: 0x3d7145[\s\S]*accent: 0xe56f32/);
  assert.match(source, /grak:[\s\S]*shadowWidth: 52/);
  assert.match(source, /const axeBlade[\s\S]*axeBlade\.lineTo\(18, 0\)/);
  assert.match(source, /effect\.axeBlade\.setVisible\(heroId === "grak"\)/);
  assert.match(source, /function drawMorna[\s\S]*boneShoulder[\s\S]*crown[\s\S]*lanternFrame[\s\S]*lanternSoul/);
  assert.match(source, /morna:[\s\S]*primary: 0x56345f[\s\S]*accent: 0x59e1d2/);
  assert.match(source, /morna:[\s\S]*shadowWidth: 41/);
});

test("hero rendering keeps raster art bounded, lazy, and protected by the procedural fallback", async () => {
  const atlasUrl = new URL("../src/assets/heroes/eira-battle-atlas.webp", import.meta.url);
  const metadata = await sharp(readFileSync(atlasUrl)).metadata();

  assert.equal(metadata.width, EIRA_BATTLE_ATLAS_SPEC.textureWidth);
  assert.equal(metadata.height, EIRA_BATTLE_ATLAS_SPEC.textureHeight);
  assert.equal(metadata.hasAlpha, true);
  assert.ok(statSync(atlasUrl).size <= EIRA_BATTLE_ATLAS_SPEC.maxBytes);
  assert.equal(EIRA_BATTLE_ATLAS_SPEC.frameWidth * EIRA_BATTLE_ATLAS_SPEC.frameCount, metadata.width);
  assert.equal(EIRA_BATTLE_ATLAS_SPEC.frameHeight, metadata.height);
  assert.equal(EIRA_BATTLE_ATLAS_SPEC.displayHeight, 62);

  assert.match(sceneSource, /preload\(\): void \{[\s\S]*hero\.id === "eira"[\s\S]*preloadEiraBattleAtlas\(this\)/);
  assert.match(source, /scene\.load\.spritesheet\(EIRA_BATTLE_ATLAS_SPEC\.textureKey, eiraBattleAtlasUrl/);
  assert.match(source, /scene\.textures\.exists\(EIRA_BATTLE_ATLAS_SPEC\.textureKey\)/);
  assert.match(source, /if \(!textureReady\) \{[\s\S]*drawEira\(scene, body, weapon\);[\s\S]*return;/);
  assert.equal(source.match(/scene\.add\.sprite\(/g)?.length, 1);
  assert.match(source, /const MAX_ATTACK_EFFECTS = 12/);
  assert.match(source, /const MAX_ABILITY_EFFECTS = 4/);
  assert.match(source, /pool\.find\(\(effect\) => !effect\.active\)/);
  assert.match(source, /onComplete: \(\) => releaseAttackEffect\(effect\)/);
  assert.match(source, /onComplete: \(\) => releaseAbilityEffect\(effect\)/);
});

test("Eira battle atlas keeps idle stable and maps attacks to fixed frames", () => {
  assert.deepEqual(EIRA_BATTLE_FRAMES, {
    idleA: 0,
    idleB: 1,
    attackDraw: 2,
    attackRelease: 3,
  });
  assert.equal(selectEiraBattleFrame(0, 0), EIRA_BATTLE_FRAMES.idleA);
  assert.equal(selectEiraBattleFrame(599, 0), EIRA_BATTLE_FRAMES.idleA);
  assert.equal(selectEiraBattleFrame(600, 0), EIRA_BATTLE_FRAMES.idleA);
  assert.equal(selectEiraBattleFrame(1_200, 0), EIRA_BATTLE_FRAMES.idleA);
  assert.equal(selectEiraBattleFrame(60_000, 0), EIRA_BATTLE_FRAMES.idleA);
  assert.equal(selectEiraBattleFrame(300, 0.25), EIRA_BATTLE_FRAMES.attackDraw);
  assert.equal(selectEiraBattleFrame(300, 0.75), EIRA_BATTLE_FRAMES.attackRelease);
  assert.equal(selectEiraBattleFrame(Number.NaN, Number.NaN), EIRA_BATTLE_FRAMES.idleA);
  assert.match(source, /const nextFrame = selectEiraBattleFrame\(safeTime, attack\)/);
  assert.match(source, /Number\(eiraSprite\.frame\.name\) !== nextFrame[\s\S]*eiraSprite\.setFrame\(nextFrame\)/);
});

test("Eira faces each attack target without changing combat coordinates", () => {
  assert.equal(selectEiraFacing(100, 60, 1), -1);
  assert.equal(selectEiraFacing(100, 140, -1), 1);
  assert.equal(selectEiraFacing(100, 100, -1), -1);
  assert.equal(selectEiraFacing(Number.NaN, 140, -1), -1);
  assert.match(sceneSource, /private eiraFacing: EiraFacing = 1/);
  assert.match(sceneSource, /event\.heroId === "eira"[\s\S]*selectEiraFacing\(from\.x, target\.x, this\.eiraFacing\)/);
  assert.match(sceneSource, /updateHeroArtPose\([\s\S]*attackProgress,[\s\S]*this\.eiraFacing/);
  assert.match(source, /const facingScale = heroId === "eira" \? facing : 1/);
  assert.match(source, /art\.body\.scaleX = facingScale \* \(1 \+/);
  assert.match(source, /art\.weapon\.scaleX = facingScale \* \(1 \+/);
});

test("frontline health and knockout art is allocated once and updated without new game objects", () => {
  const createSource = source.slice(
    source.indexOf("export function createHeroArt"),
    source.indexOf("export function updateHeroArtPose"),
  );
  const frontlineSource = source.slice(
    source.indexOf("export function setHeroFrontlineState"),
    source.indexOf("export function createHeroAnchorArt"),
  );

  assert.match(source, /healthTrack: Phaser\.GameObjects\.Rectangle/);
  assert.match(source, /healthFill: Phaser\.GameObjects\.Rectangle/);
  assert.match(source, /armorTrack: Phaser\.GameObjects\.Rectangle/);
  assert.match(source, /armorFill: Phaser\.GameObjects\.Rectangle/);
  assert.match(source, /knockoutBadge: Phaser\.GameObjects\.Text/);
  assert.equal(createSource.match(/const healthTrack = scene\.add\.rectangle/g)?.length, 1);
  assert.equal(createSource.match(/const healthFill = scene\.add\.rectangle/g)?.length, 1);
  assert.equal(createSource.match(/const armorTrack = scene\.add\.rectangle/g)?.length, 1);
  assert.equal(createSource.match(/const armorFill = scene\.add\.rectangle/g)?.length, 1);
  assert.equal(createSource.match(/const knockoutBadge = scene\.add\.text/g)?.length, 1);
  assert.match(createSource, /container\.add\(\[[\s\S]*healthTrack,[\s\S]*healthFill,[\s\S]*armorTrack,[\s\S]*armorFill,[\s\S]*knockoutBadge,[\s\S]*\]\)/);
  assert.doesNotMatch(frontlineSource, /scene\.add\.|new Phaser/);
  assert.match(frontlineSource, /state: HeroFrontlineState \| null/);
  assert.match(frontlineSource, /state\.status === "knocked_out"/);
  assert.match(frontlineSource, /state\.status === "fighting" \|\| hpRatio < 0\.999 \|\| armorRatio < 0\.999/);
  assert.match(frontlineSource, /setScale\(hpRatio, 1\)/);
  assert.match(frontlineSource, /setScale\(armorRatio, 1\)/);
  assert.match(frontlineSource, /art\.body\.setAlpha\(knockedOut \? 0\.34 : 1\)/);
  assert.match(frontlineSource, /art\.weapon\.setAlpha\(knockedOut \? 0\.3 : 1\)/);
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
  assert.match(sceneSource, /this\.simulation\.getRules\(\)\.heroAnchors\.forEach\(\(point, anchorId\) =>/);
  assert.match(sceneSource, /this\.simulation\.moveHero\(anchorId\)/);
  assert.match(sceneSource, /this\.simulation\.upgradeHero\(\)/);
  assert.match(sceneSource, /this\.simulation\.useHeroAbility\(targetDistance\)/);
  assert.match(sceneSource, /hero: view\.hero/);
  assert.match(sceneSource, /selectedHero: this\.selectedHero/);
  assert.match(sceneSource, /heroAbilityAvailable: view\.heroAbilityAvailable/);
});

test("selected heroes show distinct attack and aura ranges with affected tower highlights", () => {
  assert.match(sceneSource, /import \{ getHeroAura, getHeroStats \} from "\.\.\/game\/heroes\.ts"/);
  assert.match(sceneSource, /if \(this\.selectedHero\) \{[\s\S]*getHeroStats\(view\.hero\.id, view\.hero\.level\)/);
  assert.match(sceneSource, /view\.hero\.frontline[\s\S]*getHeroCombatStats\(view\.hero\.id, view\.hero\.level\)\.attackRange[\s\S]*stats\.attackRange/);
  assert.match(sceneSource, /this\.add\.circle\(view\.hero\.x, view\.hero\.y, attackRange/);
  assert.match(sceneSource, /getHeroAura\(view\.hero\.id, view\.hero\.level\)/);
  assert.match(sceneSource, /aura\.kind === "tower_damage"[\s\S]*0xf1cc69[\s\S]*aura\.kind === "tower_attack_speed"[\s\S]*0xff8a45/);
  assert.match(sceneSource, /this\.add\.circle\(view\.hero\.x, view\.hero\.y, aura\.radius/);
  assert.match(sceneSource, /highlightAuraTowers\([\s\S]*aura\.strength \* passivePower,[\s\S]*aura\.kind/);
  assert.match(sceneSource, /this\.heroAuraTowerHighlights\.set\(tower\.padId, \{ ring, badge \}\)/);
});

test("Grak's banner persists from simulation state and visualizes its full effect radius", () => {
  const heroSyncSource = sceneSource.slice(
    sceneSource.indexOf("private syncHeroView"),
    sceneSource.indexOf("private updateHeroSelectionVisuals"),
  );
  const bannerSyncSource = heroSyncSource.slice(
    heroSyncSource.indexOf("const heroStats"),
    heroSyncSource.indexOf("const markedIds"),
  );
  assert.equal(source.match(/const banner = createHeroBanner\(scene\)/g)?.length, 1);
  assert.match(source, /function setBanner\(point: Point \| null, radius: number, remainingMs: number, elapsedMs: number\)/);
  assert.match(source, /banner\.aura[\s\S]*setRadius\(safeRadius\)[\s\S]*setStrokeStyle\(3, 0xff8a45/);
  assert.match(source, /function createHeroBanner[\s\S]*const cloth[\s\S]*const rune/);
  assert.match(heroSyncSource, /hero\.id === "grak" && hero\.bannerActive \? hero : null/);
  assert.match(heroSyncSource, /heroStats\.abilityRadius[\s\S]*hero\.bannerRemainingMs/);
  assert.doesNotMatch(bannerSyncSource, /this\.add\./);
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

test("Eira's persistent marks reuse a bounded pool and follow all simulation targets", () => {
  const heroSyncSource = sceneSource.slice(
    sceneSource.indexOf("private syncHeroView"),
    sceneSource.indexOf("private updateHeroSelectionVisuals"),
  );
  const markSyncSource = heroSyncSource.slice(
    heroSyncSource.indexOf("const markedIds"),
    heroSyncSource.indexOf("this.syncHeroBarrier"),
  );
  assert.match(source, /const marks = Array\.from\(\{ length: 4 \}, \(\) => createHeroMark\(scene\)\)/);
  assert.match(source, /function setMarks\(points: readonly Point\[\], elapsedMs: number\)/);
  assert.match(source, /mark\.container[\s\S]*setPosition\(point\.x, point\.y\)[\s\S]*setVisible\(true\)/);
  assert.match(sceneSource, /hero\.markedEnemyIds[\s\S]*view\.enemies\.find[\s\S]*heroEffects\?\.setMarks/);
  assert.doesNotMatch(markSyncSource, /this\.add\./);
});

test("awakened Toren targeting projects taps to the route and renders one transient barrier", () => {
  assert.match(sceneSource, /projectPointToPathDistance\(this\.path, \{ x: pointer\.worldX, y: pointer\.worldY \}\)/);
  assert.match(sceneSource, /this\.simulation\.useHeroAbility\(targetDistance\)/);
  assert.match(sceneSource, /private syncHeroBarrier\(barrier: HeroSimulationView\["barrier"\]/);
  assert.match(sceneSource, /barrier\.capturedCount[\s\S]*barrier\.capacity/);
  assert.match(sceneSource, /event\.type === "hero_barrier_created"/);
  assert.match(sceneSource, /event\.type === "hero_barrier_blocked"/);
  assert.match(sceneSource, /const point = target[\s\S]*this\.getEnemyRenderPoint\(target\.id, target\)[\s\S]*event\.targetPoint/);
  assert.match(sceneSource, /private handleTerminalEvent[\s\S]*this\.clearHeroAbilityTargeting\(\)/);
});

test("a fully absorbed leak keeps damage-only gate feedback hidden", () => {
  const leakEventSource = sceneSource.slice(
    sceneSource.indexOf('event.type === "enemy_leaked"'),
    sceneSource.indexOf('event.type === "wave_cleared"'),
  );
  assert.match(leakEventSource, /if \(event\.damage > 0\) \{[\s\S]*createGateHitEffect[\s\S]*cameras\.main\.shake/);
});
