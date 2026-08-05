import Phaser from "phaser";
import eiraBattleAtlasUrl from "../assets/heroes/eira-battle-atlas.webp";
import grakBattleAtlasUrl from "../assets/heroes/grak-battle-atlas.webp";
import mornaBattleAtlasUrl from "../assets/heroes/morna-battle-atlas.webp";
import torenBattleAtlasUrl from "../assets/heroes/toren-battle-atlas.webp";
import type { HeroId, Point } from "../game/types.ts";
import {
  HERO_BATTLE_ATLAS_SPECS,
  HERO_BATTLE_FRAMES,
  isHeroBattleAtlasHeroId,
  selectHeroBattleFrame,
  type HeroBattleAtlasHeroId,
  type HeroFacing,
} from "./heroBattleAtlas.ts";

export type HeroVisualProfile = Readonly<{
  primary: number;
  secondary: number;
  accent: number;
  shadowWidth: number;
  shadowHeight: number;
  silhouetteWidth: number;
  silhouetteHeight: number;
  stepRate: number;
  bob: number;
}>;

export const HERO_VISUAL_PROFILES = Object.freeze({
  eira: Object.freeze({
    primary: 0x2f7550,
    secondary: 0x173f31,
    accent: 0xe6c665,
    shadowWidth: 37,
    shadowHeight: 13,
    silhouetteWidth: 35,
    silhouetteHeight: 47,
    stepRate: 0.011,
    bob: 1.4,
  }),
  toren: Object.freeze({
    primary: 0x777a74,
    secondary: 0x3d4441,
    accent: 0xb77b43,
    shadowWidth: 48,
    shadowHeight: 17,
    silhouetteWidth: 47,
    silhouetteHeight: 43,
    stepRate: 0.008,
    bob: 0.8,
  }),
  grak: Object.freeze({
    primary: 0x3d7145,
    secondary: 0x33251f,
    accent: 0xe56f32,
    shadowWidth: 52,
    shadowHeight: 18,
    silhouetteWidth: 51,
    silhouetteHeight: 51,
    stepRate: 0.009,
    bob: 1.05,
  }),
  morna: Object.freeze({
    primary: 0x56345f,
    secondary: 0x181c2b,
    accent: 0x59e1d2,
    shadowWidth: 41,
    shadowHeight: 14,
    silhouetteWidth: 40,
    silhouetteHeight: 49,
    stepRate: 0.01,
    bob: 1.2,
  }),
} satisfies Readonly<Record<HeroId, HeroVisualProfile>>);

export type HeroArt = Readonly<{
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  weapon: Phaser.GameObjects.Container;
  selectionRing: Phaser.GameObjects.Arc;
  abilityAura: Phaser.GameObjects.Arc;
  healthTrack: Phaser.GameObjects.Rectangle;
  healthFill: Phaser.GameObjects.Rectangle;
  armorTrack: Phaser.GameObjects.Rectangle;
  armorFill: Phaser.GameObjects.Rectangle;
  knockoutBadge: Phaser.GameObjects.Text;
}>;

export type HeroFrontlineStatus = "ready" | "deploying" | "holding" | "fighting" | "knocked_out";

export type HeroFrontlineState = Readonly<{
  hp: number;
  maxHp: number;
  heroicArmor: number;
  maxHeroicArmor: number;
  status: HeroFrontlineStatus;
}>;

export type HeroAnchorArt = Readonly<{
  container: Phaser.GameObjects.Container;
  platform: Phaser.GameObjects.Graphics;
  core: Phaser.GameObjects.Graphics;
  rune: Phaser.GameObjects.Graphics;
}>;

export type HeroEffectPool = Readonly<{
  playAttack(heroId: HeroId, from: Point, to: Point): void;
  playAbility(heroId: HeroId, point: Point, radius: number): void;
  setMark(point: Point | null, elapsedMs: number): void;
  setMarks(points: readonly Point[], elapsedMs: number): void;
  setBanner(point: Point | null, radius: number, remainingMs: number, elapsedMs: number): void;
  destroy(): void;
}>;

type HeroRig = Readonly<{
  heroId: HeroId;
  bodyHomeY: number;
  weaponHomeRotation: number;
}>;

type HeroBuilder = (
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
) => void;

type AttackEffect = {
  container: Phaser.GameObjects.Container;
  shaft: Phaser.GameObjects.Rectangle;
  head: Phaser.GameObjects.Triangle;
  axeBlade: Phaser.GameObjects.Graphics;
  active: boolean;
  tween: Phaser.Tweens.Tween | null;
};

type AbilityEffect = {
  ring: Phaser.GameObjects.Arc;
  core: Phaser.GameObjects.Arc;
  active: boolean;
  tween: Phaser.Tweens.Tween | null;
};

type HeroBannerArt = Readonly<{
  aura: Phaser.GameObjects.Arc;
  innerRing: Phaser.GameObjects.Arc;
  container: Phaser.GameObjects.Container;
  cloth: Phaser.GameObjects.Graphics;
}>;

const MAX_ATTACK_EFFECTS = 12;
const MAX_ABILITY_EFFECTS = 4;
const heroRigs = new WeakMap<Phaser.GameObjects.Container, HeroRig>();
const heroBattleSprites = new WeakMap<Phaser.GameObjects.Container, Readonly<{
  heroId: HeroBattleAtlasHeroId;
  sprite: Phaser.GameObjects.Sprite;
}>>();
const HERO_BATTLE_ATLAS_URLS = Object.freeze({
  eira: eiraBattleAtlasUrl,
  toren: torenBattleAtlasUrl,
  grak: grakBattleAtlasUrl,
  morna: mornaBattleAtlasUrl,
}) satisfies Readonly<Record<HeroBattleAtlasHeroId, string>>;

type HeroAnchorPalette = Readonly<{
  platformFill: number;
  platformStroke: number;
  coreFill: number;
  coreStroke: number;
  rune: number;
}>;

const HERO_ANCHOR_PLATFORM_POINTS = Object.freeze([
  Object.freeze({ x: 0, y: -16 }),
  Object.freeze({ x: 20, y: -5 }),
  Object.freeze({ x: 20, y: 13 }),
  Object.freeze({ x: 0, y: 22 }),
  Object.freeze({ x: -20, y: 13 }),
  Object.freeze({ x: -20, y: -5 }),
]);

const HERO_ANCHOR_CORE_POINTS = Object.freeze([
  Object.freeze({ x: 0, y: -10 }),
  Object.freeze({ x: 12, y: 3 }),
  Object.freeze({ x: 0, y: 15 }),
  Object.freeze({ x: -12, y: 3 }),
]);

const HERO_ANCHOR_PALETTES = Object.freeze({
  available: Object.freeze({
    platformFill: 0x123a31,
    platformStroke: 0x8dffe0,
    coreFill: 0x36c99a,
    coreStroke: 0xc8fff0,
    rune: 0xe4fff7,
  }),
  selected: Object.freeze({
    platformFill: 0x4d4324,
    platformStroke: 0xf2d06f,
    coreFill: 0x9b7731,
    coreStroke: 0xffe8a2,
    rune: 0xfff1ba,
  }),
}) satisfies Readonly<Record<"available" | "selected", HeroAnchorPalette>>;

const HERO_BUILDERS = {
  eira: drawEiraBattle,
  toren: drawTorenBattle,
  grak: drawGrakBattle,
  morna: drawMornaBattle,
} satisfies Readonly<Record<HeroId, HeroBuilder>>;

export function preloadHeroBattleAtlas(scene: Phaser.Scene, heroId: HeroId): void {
  if (!isHeroBattleAtlasHeroId(heroId)) return;
  const spec = HERO_BATTLE_ATLAS_SPECS[heroId];
  if (scene.textures.exists(spec.textureKey)) return;
  scene.load.spritesheet(spec.textureKey, HERO_BATTLE_ATLAS_URLS[heroId], {
    frameWidth: spec.frameWidth,
    frameHeight: spec.frameHeight,
    startFrame: 0,
    endFrame: spec.frameCount - 1,
  });
}

export function createHeroArt(scene: Phaser.Scene, heroId: HeroId, point: Point): HeroArt {
  const visual = HERO_VISUAL_PROFILES[heroId];
  const container = scene.add.container(point.x, point.y).setDepth(point.y + 42);
  const selectionRing = scene.add.circle(0, 6, visual.silhouetteWidth * 0.66, 0x71e4b5, 0)
    .setStrokeStyle(2, 0x8cf0c9, 0)
    .setDepth(-4);
  const abilityAura = scene.add.circle(0, 4, visual.silhouetteWidth * 0.54, visual.accent, 0)
    .setStrokeStyle(2, visual.accent, 0.3)
    .setDepth(-3);
  const shadow = scene.add.ellipse(0, 9, visual.shadowWidth, visual.shadowHeight, 0x06110e, 0.48)
    .setDepth(-2);
  const body = scene.add.container(0, -5);
  const weapon = scene.add.container(0, -5);
  const healthY = -visual.silhouetteHeight - 15;
  const healthWidth = Math.max(34, visual.silhouetteWidth - 3);
  const healthTrack = scene.add.rectangle(0, healthY, healthWidth, 6, 0x071713, 0.84)
    .setStrokeStyle(1, 0xb9dfcc, 0.46)
    .setDepth(8)
    .setVisible(false);
  const healthFill = scene.add.rectangle(-(healthWidth - 2) / 2, healthY, healthWidth - 2, 4, 0x75d8a8, 0.94)
    .setOrigin(0, 0.5)
    .setDepth(9)
    .setVisible(false);
  const armorY = healthY + 7;
  const armorTrack = scene.add.rectangle(0, armorY, healthWidth, 3, 0x071713, 0.76)
    .setStrokeStyle(1, 0xc8a75c, 0.38)
    .setDepth(8)
    .setVisible(false);
  const armorFill = scene.add.rectangle(-(healthWidth - 2) / 2, armorY, healthWidth - 2, 1.5, 0xe5c36f, 0.96)
    .setOrigin(0, 0.5)
    .setDepth(9)
    .setVisible(false);
  const knockoutBadge = scene.add.text(0, healthY - 9, "KO", {
    color: "#fff1d0",
    fontFamily: "Arial, sans-serif",
    fontSize: "8px",
    fontStyle: "bold",
    stroke: "#3c1715",
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(10).setVisible(false);
  HERO_BUILDERS[heroId](scene, body, weapon);
  container.add([
    selectionRing,
    abilityAura,
    shadow,
    body,
    weapon,
    healthTrack,
    healthFill,
    armorTrack,
    armorFill,
    knockoutBadge,
  ]);
  heroRigs.set(container, Object.freeze({ heroId, bodyHomeY: body.y, weaponHomeRotation: weapon.rotation }));
  return Object.freeze({
    container,
    body,
    weapon,
    selectionRing,
    abilityAura,
    healthTrack,
    healthFill,
    armorTrack,
    armorFill,
    knockoutBadge,
  });
}

export function updateHeroArtPose(
  art: HeroArt,
  heroId: HeroId,
  elapsedMs: number,
  moving: boolean,
  attackProgress = 0,
  facing: HeroFacing = 1,
): void {
  const rig = heroRigs.get(art.container);
  if (!rig || rig.heroId !== heroId) return;
  const visual = HERO_VISUAL_PROFILES[heroId];
  const safeTime = Number.isFinite(elapsedMs) ? elapsedMs : 0;
  const phase = safeTime * visual.stepRate;
  const stride = moving ? Math.sin(phase) : Math.sin(phase * 0.37) * 0.12;
  const attack = clamp01(attackProgress);
  const swing = Math.sin(attack * Math.PI);

  art.body.y = rig.bodyHomeY - Math.abs(stride) * visual.bob;
  art.body.rotation = stride * (heroId === "eira" ? 0.025 : heroId === "grak" ? 0.018 : heroId === "morna" ? 0.022 : 0.014);
  const facingScale = isHeroBattleAtlasHeroId(heroId) ? facing : 1;
  art.body.scaleX = facingScale * (1 + Math.sin(phase * 0.42) * 0.012);
  art.body.scaleY = 1 - Math.sin(phase * 0.42) * 0.009;
  art.weapon.y = art.body.y;
  const weaponSwing = heroId === "eira" ? -0.18 : heroId === "grak" ? -1.02 : heroId === "morna" ? -0.26 : -0.72;
  const weaponStretch = heroId === "eira" ? 0.03 : heroId === "grak" ? 0.12 : heroId === "morna" ? 0.05 : 0.08;
  art.weapon.rotation = rig.weaponHomeRotation + weaponSwing * swing;
  art.weapon.scaleX = facingScale * (1 + swing * weaponStretch);
  const battleSprite = heroBattleSprites.get(art.body);
  if (battleSprite && battleSprite.heroId === heroId) {
    const nextFrame = selectHeroBattleFrame(battleSprite.heroId, attack);
    if (Number(battleSprite.sprite.frame.name) !== nextFrame) battleSprite.sprite.setFrame(nextFrame);
  }
}

export function moveHeroArt(art: HeroArt, point: Point): void {
  art.container.setPosition(point.x, point.y).setDepth(point.y + 42);
}

export function setHeroArtSelected(art: HeroArt, selected: boolean): void {
  art.selectionRing.setStrokeStyle(selected ? 3 : 2, 0x8cf0c9, selected ? 0.94 : 0);
  art.selectionRing.setScale(selected ? 1.08 : 1);
}

export function setHeroAbilityCharge(art: HeroArt, ratio: number): void {
  const charge = clamp01(ratio);
  art.abilityAura.setAlpha(0.12 + charge * 0.48);
  art.abilityAura.setScale(0.9 + charge * 0.14);
}

export function setHeroFrontlineState(art: HeroArt, state: HeroFrontlineState | null): void {
  if (!state) {
    art.healthTrack.setVisible(false);
    art.healthFill.setVisible(false);
    art.armorTrack.setVisible(false);
    art.armorFill.setVisible(false);
    art.knockoutBadge.setVisible(false);
    art.body.setAlpha(1);
    art.weapon.setAlpha(1);
    return;
  }

  const maxHp = Number.isFinite(state.maxHp) && state.maxHp > 0 ? state.maxHp : 1;
  const hp = Number.isFinite(state.hp) ? Math.min(maxHp, Math.max(0, state.hp)) : 0;
  const hpRatio = hp / maxHp;
  const maxArmor = Number.isFinite(state.maxHeroicArmor) && state.maxHeroicArmor > 0
    ? state.maxHeroicArmor
    : 0;
  const armor = Number.isFinite(state.heroicArmor)
    ? Math.min(maxArmor, Math.max(0, state.heroicArmor))
    : 0;
  const armorRatio = maxArmor > 0 ? armor / maxArmor : 0;
  const knockedOut = state.status === "knocked_out";
  const prominent = knockedOut || state.status === "fighting" || hpRatio < 0.999 || armorRatio < 0.999;
  const alpha = prominent ? 1 : 0.16;
  const fillColor = hpRatio <= 0.3 ? 0xe66d5f : hpRatio <= 0.6 ? 0xe6be65 : 0x75d8a8;

  art.healthTrack.setVisible(true).setAlpha(alpha);
  art.healthFill
    .setVisible(hpRatio > 0)
    .setAlpha(alpha)
    .setFillStyle(fillColor, 0.94)
    .setScale(hpRatio, 1);
  art.armorTrack.setVisible(maxArmor > 0).setAlpha(alpha);
  art.armorFill
    .setVisible(armor > 0)
    .setAlpha(alpha)
    .setFillStyle(armorRatio <= 0.34 ? 0xdc8355 : 0xe5c36f, 0.96)
    .setScale(armorRatio, 1);
  art.knockoutBadge.setVisible(knockedOut);
  art.body.setAlpha(knockedOut ? 0.34 : 1);
  art.weapon.setAlpha(knockedOut ? 0.3 : 1);
}

export function createHeroAnchorArt(scene: Phaser.Scene, point: Point): HeroAnchorArt {
  const container = scene.add.container(point.x, point.y).setDepth(point.y + 12).setVisible(false);
  const platform = scene.add.graphics();
  const core = scene.add.graphics();
  const rune = scene.add.graphics();
  container.add([platform, core, rune]);
  const art = Object.freeze({ container, platform, core, rune });
  drawHeroAnchor(art, HERO_ANCHOR_PALETTES.available, false);
  return art;
}

export function setHeroAnchorState(
  art: HeroAnchorArt,
  state: "hidden" | "available" | "selected",
): void {
  art.container.setVisible(state !== "hidden");
  if (state === "hidden") return;
  const selected = state === "selected";
  drawHeroAnchor(
    art,
    selected ? HERO_ANCHOR_PALETTES.selected : HERO_ANCHOR_PALETTES.available,
    selected,
  );
}

function drawHeroAnchor(art: HeroAnchorArt, palette: HeroAnchorPalette, selected: boolean): void {
  art.platform.clear();
  art.platform.fillStyle(palette.platformFill, selected ? 0.96 : 0.9);
  art.platform.lineStyle(selected ? 3 : 2, palette.platformStroke, 1);
  drawClosedShape(art.platform, HERO_ANCHOR_PLATFORM_POINTS);
  art.platform.lineStyle(1, palette.platformStroke, selected ? 0.62 : 0.46);
  art.platform.lineBetween(-17, 12, 0, 20);
  art.platform.lineBetween(0, 20, 17, 12);

  art.core.clear();
  art.core.fillStyle(palette.coreFill, selected ? 0.9 : 0.78);
  art.core.lineStyle(1, palette.coreStroke, selected ? 1 : 0.92);
  drawClosedShape(art.core, HERO_ANCHOR_CORE_POINTS);

  // Two footprints read as a hero destination even at the smallest mobile scale.
  art.rune.clear();
  art.rune.fillStyle(palette.rune, selected ? 1 : 0.94);
  art.rune.fillEllipse(-5, 2, 5, 9);
  art.rune.fillCircle(-5, -4, 2);
  art.rune.fillEllipse(5, 7, 5, 9);
  art.rune.fillCircle(5, 1, 2);
}

function drawClosedShape(graphics: Phaser.GameObjects.Graphics, points: readonly Point[]): void {
  const first = points[0];
  if (!first) return;
  graphics.beginPath();
  graphics.moveTo(first.x, first.y);
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (point) graphics.lineTo(point.x, point.y);
  }
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
}

export function createHeroEffectPool(scene: Phaser.Scene): HeroEffectPool {
  const attackEffects: AttackEffect[] = [];
  const abilityEffects: AbilityEffect[] = [];
  const marks = Array.from({ length: 4 }, () => createHeroMark(scene));
  const banner = createHeroBanner(scene);

  function playAttack(heroId: HeroId, from: Point, to: Point): void {
    const effect = acquireAttackEffect(scene, attackEffects);
    const visual = HERO_VISUAL_PROFILES[heroId];
    effect.tween?.stop();
    effect.active = true;
    effect.shaft
      .setFillStyle(heroId === "eira" || heroId === "morna" ? visual.accent : heroId === "grak" ? 0x6a4228 : visual.secondary, 1)
      .setSize(heroId === "grak" ? 17 : heroId === "morna" ? 14 : 20, heroId === "grak" || heroId === "morna" ? 5 : 3);
    effect.head
      .setFillStyle(heroId === "eira" ? 0xf4e2a1 : visual.accent, 1)
      .setScale(1)
      .setVisible(heroId !== "grak");
    effect.axeBlade.setVisible(heroId === "grak");
    effect.container
      .setPosition(from.x, from.y - 8)
      .setRotation(Math.atan2(to.y - from.y, to.x - from.x))
      .setScale(heroId === "eira" ? 1 : heroId === "grak" ? 1.52 : heroId === "morna" ? 1.08 : 1.34)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(1_100);
    effect.tween = scene.tweens.add({
      targets: effect.container,
      x: to.x,
      y: to.y - 6,
      ...(heroId === "grak" ? { rotation: effect.container.rotation + Math.PI * 2.5 } : {}),
      alpha: heroId === "eira" || heroId === "morna" ? 0.9 : 0.25,
      duration: heroId === "eira" ? 155 : heroId === "grak" ? 210 : heroId === "morna" ? 185 : 110,
      ease: "Quad.Out",
      onComplete: () => releaseAttackEffect(effect),
    });
  }

  function playAbility(heroId: HeroId, point: Point, radius: number): void {
    const effect = acquireAbilityEffect(scene, abilityEffects);
    const visual = HERO_VISUAL_PROFILES[heroId];
    const targetRadius = Math.max(24, Number.isFinite(radius) ? radius : 24);
    effect.tween?.stop();
    effect.active = true;
    effect.ring
      .setPosition(point.x, point.y)
      .setRadius(14)
      .setScale(1)
      .setAlpha(0.95)
      .setStrokeStyle(heroId === "eira" ? 3 : heroId === "grak" ? 5 : 4, visual.accent, 0.95)
      .setVisible(true)
      .setDepth(1_090);
    effect.core
      .setPosition(point.x, point.y)
      .setRadius(9)
      .setScale(1)
      .setAlpha(heroId === "eira" ? 0.28 : heroId === "grak" ? 0.5 : heroId === "morna" ? 0.46 : 0.4)
      .setFillStyle(visual.primary, 1)
      .setVisible(true)
      .setDepth(1_089);
    const scale = targetRadius / 14;
    effect.tween = scene.tweens.add({
      targets: [effect.ring, effect.core],
      scale,
      alpha: 0,
      duration: heroId === "eira" ? 460 : heroId === "grak" ? 520 : heroId === "morna" ? 620 : 380,
      ease: "Cubic.Out",
      onComplete: () => releaseAbilityEffect(effect),
    });
  }

  function setMark(point: Point | null, elapsedMs: number): void {
    setMarks(point ? [point] : [], elapsedMs);
  }

  function setMarks(points: readonly Point[], elapsedMs: number): void {
    const safeTime = Number.isFinite(elapsedMs) ? elapsedMs : 0;
    const pulse = (Math.sin(safeTime * 0.008) + 1) * 0.5;
    for (let index = 0; index < marks.length; index += 1) {
      const mark = marks[index];
      const point = points[index];
      if (!point) {
        mark.container.setVisible(false);
        continue;
      }
      mark.container
        .setPosition(point.x, point.y)
        .setRotation(Math.sin(safeTime * 0.0024 + index * 0.7) * 0.08)
        .setScale(0.94 + pulse * 0.1)
        .setVisible(true)
        .setDepth(1_075);
      mark.ring.setAlpha(0.68 + pulse * 0.28);
      mark.rune.setAlpha(0.72 + pulse * 0.28);
    }
  }

  function setBanner(point: Point | null, radius: number, remainingMs: number, elapsedMs: number): void {
    const active = point !== null && remainingMs > 0;
    banner.container.setVisible(active);
    banner.aura.setVisible(active);
    banner.innerRing.setVisible(active);
    if (!active || !point) return;

    const safeTime = Number.isFinite(elapsedMs) ? elapsedMs : 0;
    const pulse = (Math.sin(safeTime * 0.0065) + 1) * 0.5;
    const safeRadius = Math.max(24, Number.isFinite(radius) ? radius : 24);
    banner.aura
      .setPosition(point.x, point.y)
      .setRadius(safeRadius)
      .setAlpha(0.13 + pulse * 0.05)
      .setStrokeStyle(3, 0xff8a45, 0.74 + pulse * 0.18)
      .setDepth(4);
    banner.innerRing
      .setPosition(point.x, point.y)
      .setRadius(Math.max(18, safeRadius - 8))
      .setAlpha(0.16 + pulse * 0.06)
      .setDepth(5);
    banner.container
      .setPosition(point.x + 22, point.y - 10)
      .setDepth(point.y + 48);
    banner.cloth.setScale(1 + pulse * 0.035, 1 - pulse * 0.025);
  }

  function destroy(): void {
    for (const effect of attackEffects) {
      effect.tween?.stop();
      effect.container.destroy(true);
    }
    for (const effect of abilityEffects) {
      effect.tween?.stop();
      effect.ring.destroy();
      effect.core.destroy();
    }
    for (const mark of marks) mark.container.destroy(true);
    banner.aura.destroy();
    banner.innerRing.destroy();
    banner.container.destroy(true);
    attackEffects.length = 0;
    abilityEffects.length = 0;
  }

  return Object.freeze({ playAttack, playAbility, setMark, setMarks, setBanner, destroy });
}

function createHeroMark(scene: Phaser.Scene): Readonly<{
  container: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Arc;
  rune: Phaser.GameObjects.Graphics;
}> {
  const container = scene.add.container(0, 0).setVisible(false);
  const ring = scene.add.circle(0, 1, 21, 0x2f7550, 0.06).setStrokeStyle(3, 0xe6c665, 0.9);
  const rune = scene.add.graphics();
  rune.lineStyle(2, 0xf3df9b, 0.95);
  rune.lineBetween(-8, -13, 7, 11);
  rune.lineBetween(-7, 11, 8, -13);
  rune.lineBetween(0, -16, 0, -10);
  container.add([ring, rune]);
  return Object.freeze({ container, ring, rune });
}

function createHeroBanner(scene: Phaser.Scene): HeroBannerArt {
  const aura = scene.add.circle(0, 0, 24, 0xe56f32, 0.12)
    .setStrokeStyle(3, 0xff8a45, 0.82)
    .setVisible(false);
  const innerRing = scene.add.circle(0, 0, 18, 0x5b281e, 0.08)
    .setStrokeStyle(1, 0xffc078, 0.5)
    .setVisible(false);
  const container = scene.add.container(0, 0).setVisible(false);
  const shadow = scene.add.ellipse(0, 17, 19, 7, 0x100b08, 0.42);
  const pole = scene.add.rectangle(0, -8, 4, 50, 0x68442d, 1)
    .setStrokeStyle(1, 0xc59255, 0.9);
  const spear = scene.add.triangle(0, -37, 0, -8, -5, 2, 5, 2, 0xe7a25c, 1)
    .setStrokeStyle(1, 0x6a321f, 1);
  const cloth = scene.add.graphics().setPosition(2, -27);
  cloth.fillStyle(0x9d3124, 1);
  cloth.lineStyle(2, 0xf0793d, 1);
  cloth.beginPath();
  cloth.moveTo(0, 0);
  cloth.lineTo(25, 3);
  cloth.lineTo(19, 13);
  cloth.lineTo(25, 22);
  cloth.lineTo(0, 19);
  cloth.closePath();
  cloth.fillPath();
  cloth.strokePath();
  const rune = scene.add.graphics().setPosition(12, -17);
  rune.lineStyle(2, 0xffcf85, 0.95);
  rune.strokeCircle(0, 0, 5);
  rune.lineBetween(-4, 4, 4, -4);
  rune.lineBetween(-3, -4, 4, 3);
  container.add([shadow, pole, cloth, rune, spear]);
  return Object.freeze({ aura, innerRing, container, cloth });
}

function drawEira(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
): void {
  const cloak = scene.add.graphics();
  cloak.fillStyle(0x173f31, 1).fillTriangle(-12, -7, 12, -7, 0, 21);
  cloak.lineStyle(2, 0x4d9b68, 0.9).strokeTriangle(-12, -7, 12, -7, 0, 21);
  const torso = scene.add.ellipse(0, -4, 22, 27, 0x2f7550, 1).setStrokeStyle(2, 0xe6c665, 0.76);
  const belt = scene.add.rectangle(0, 4, 22, 4, 0x6e4928, 1);
  const head = scene.add.circle(0, -19, 9, 0xe8b88c, 1).setStrokeStyle(2, 0x7b4d2b, 0.8);
  const hair = scene.add.ellipse(0, -23, 19, 10, 0xd6b45d, 1);
  const leftEar = scene.add.triangle(-10, -19, 0, 3, 7, 0, 7, 6, 0xe8b88c, 1).setRotation(-0.18);
  const rightEar = scene.add.triangle(10, -19, 0, 3, -7, 0, -7, 6, 0xe8b88c, 1).setRotation(0.18);
  const brooch = scene.add.circle(0, -9, 3, 0xf2dc83, 1).setStrokeStyle(1, 0x9c722c, 1);
  const leftBoot = scene.add.ellipse(-6, 15, 7, 12, 0x1d2924, 1).setRotation(-0.18);
  const rightBoot = scene.add.ellipse(6, 15, 7, 12, 0x1d2924, 1).setRotation(0.18);
  body.add([cloak, leftBoot, rightBoot, torso, belt, head, leftEar, rightEar, hair, brooch]);

  const bow = scene.add.graphics();
  bow.lineStyle(3, 0xd8a84d, 1);
  bow.beginPath();
  bow.arc(10, -5, 17, -Math.PI * 0.55, Math.PI * 0.55, false);
  bow.strokePath();
  bow.lineStyle(1, 0xf3e7bd, 0.9).lineBetween(8, -22, 8, 12);
  const arrow = scene.add.rectangle(8, -5, 28, 2, 0xf3df9b, 1).setOrigin(0.42, 0.5);
  const arrowHead = scene.add.triangle(24, -5, 0, 0, -6, -4, -6, 4, 0xe6c665, 1);
  weapon.add([bow, arrow, arrowHead]);
}

function drawEiraBattle(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
): void {
  drawBattleAtlasHero(scene, body, weapon, "eira", drawEira);
}

function drawTorenBattle(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
): void {
  drawBattleAtlasHero(scene, body, weapon, "toren", drawToren);
}

function drawGrakBattle(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
): void {
  drawBattleAtlasHero(scene, body, weapon, "grak", drawGrak);
}

function drawMornaBattle(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
): void {
  drawBattleAtlasHero(scene, body, weapon, "morna", drawMorna);
}

function drawBattleAtlasHero(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
  heroId: HeroBattleAtlasHeroId,
  fallback: HeroBuilder,
): void {
  const spec = HERO_BATTLE_ATLAS_SPECS[heroId];
  const textureReady = scene.textures.exists(spec.textureKey)
    && scene.textures.get(spec.textureKey).frameTotal >= spec.frameCount + 1;
  if (!textureReady) {
    fallback(scene, body, weapon);
    return;
  }

  const scale = spec.displayHeight / spec.frameHeight;
  const sprite = scene.add.sprite(0, 20, spec.textureKey, HERO_BATTLE_FRAMES[heroId].idle)
    .setOrigin(0.5, 1)
    .setDisplaySize(spec.frameWidth * scale, spec.displayHeight);
  heroBattleSprites.set(body, Object.freeze({ heroId, sprite }));
  body.add(sprite);
}

function drawToren(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
): void {
  const leftBoot = scene.add.ellipse(-8, 15, 11, 12, 0x272d2b, 1).setRotation(-0.12);
  const rightBoot = scene.add.ellipse(8, 15, 11, 12, 0x272d2b, 1).setRotation(0.12);
  const torso = scene.add.rectangle(0, -1, 34, 30, 0x646b67, 1).setStrokeStyle(2, 0xb77b43, 0.9);
  const leftShoulder = scene.add.circle(-17, -6, 9, 0x858883, 1).setStrokeStyle(2, 0x4c5350, 1);
  const rightShoulder = scene.add.circle(17, -6, 9, 0x858883, 1).setStrokeStyle(2, 0x4c5350, 1);
  const belt = scene.add.rectangle(0, 7, 34, 5, 0x5d3824, 1);
  const buckle = scene.add.rectangle(0, 7, 7, 7, 0xc28c4d, 1).setStrokeStyle(1, 0x5a351d, 1);
  const head = scene.add.circle(0, -19, 10, 0xd0a17d, 1).setStrokeStyle(2, 0x4d3226, 0.9);
  const helmet = scene.add.ellipse(0, -24, 23, 13, 0x777a74, 1).setStrokeStyle(2, 0xb77b43, 0.9);
  const noseGuard = scene.add.rectangle(0, -19, 4, 15, 0xb77b43, 1);
  const beard = scene.add.graphics();
  beard.fillStyle(0x7a482c, 1).fillTriangle(-9, -17, 9, -17, 0, 3);
  beard.lineStyle(1, 0xc07943, 0.82);
  beard.lineBetween(-5, -13, -2, -1);
  beard.lineBetween(0, -14, 0, 1);
  beard.lineBetween(5, -13, 2, -1);
  body.add([leftBoot, rightBoot, torso, leftShoulder, rightShoulder, belt, buckle, head, beard, helmet, noseGuard]);

  const handle = scene.add.rectangle(13, 1, 7, 39, 0x60402b, 1).setRotation(-0.3);
  const hammerHead = scene.add.rectangle(18, -16, 29, 18, 0x7b7d77, 1)
    .setStrokeStyle(3, 0xb77b43, 1)
    .setRotation(-0.3);
  const rune = scene.add.graphics().setPosition(18, -16).setRotation(-0.3);
  rune.lineStyle(2, 0xf2cf75, 1);
  rune.lineBetween(-5, 0, 5, 0);
  rune.lineBetween(0, -5, 0, 5);
  rune.lineBetween(-4, -4, 4, 4);
  const cap = scene.add.rectangle(7, 18, 9, 7, 0xb77b43, 1).setRotation(-0.3);
  weapon.add([handle, hammerHead, rune, cap]);
}

function drawGrak(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
): void {
  const backBannerPole = scene.add.rectangle(-18, -6, 3, 48, 0x6b442d, 1).setRotation(-0.08);
  const backBanner = scene.add.graphics().setPosition(-20, -29).setRotation(-0.08);
  backBanner.fillStyle(0x8f3026, 1);
  backBanner.lineStyle(2, 0xe56f32, 0.9);
  backBanner.beginPath();
  backBanner.moveTo(0, 0);
  backBanner.lineTo(20, 4);
  backBanner.lineTo(14, 12);
  backBanner.lineTo(19, 20);
  backBanner.lineTo(0, 17);
  backBanner.closePath();
  backBanner.fillPath();
  backBanner.strokePath();

  const leftBoot = scene.add.ellipse(-9, 16, 13, 12, 0x251b17, 1).setRotation(-0.14);
  const rightBoot = scene.add.ellipse(9, 16, 13, 12, 0x251b17, 1).setRotation(0.14);
  const furCloak = scene.add.graphics();
  furCloak.fillStyle(0x392923, 1).fillTriangle(-20, -8, 20, -8, 0, 21);
  furCloak.lineStyle(2, 0x81604a, 0.88).strokeTriangle(-20, -8, 20, -8, 0, 21);
  const torso = scene.add.ellipse(0, -2, 39, 34, 0x3d7145, 1).setStrokeStyle(2, 0x203e2b, 1);
  const chestHarness = scene.add.graphics();
  chestHarness.lineStyle(5, 0x6b422b, 1);
  chestHarness.lineBetween(-13, -12, 12, 10);
  chestHarness.lineBetween(13, -12, -6, 8);
  const belt = scene.add.rectangle(0, 9, 38, 6, 0x43281e, 1).setStrokeStyle(1, 0xb8733d, 0.85);
  const buckle = scene.add.circle(0, 9, 5, 0xca7239, 1).setStrokeStyle(2, 0x55291f, 1);
  const leftShoulder = scene.add.circle(-20, -8, 10, 0x5e3828, 1).setStrokeStyle(2, 0xd26a34, 0.92);
  const rightShoulder = scene.add.circle(20, -8, 10, 0x5e3828, 1).setStrokeStyle(2, 0xd26a34, 0.92);
  const shoulderSpikes = scene.add.graphics();
  shoulderSpikes.fillStyle(0xd8b273, 1);
  shoulderSpikes.fillTriangle(-27, -13, -21, -28, -17, -12);
  shoulderSpikes.fillTriangle(17, -12, 22, -28, 27, -13);

  const neck = scene.add.rectangle(0, -18, 12, 10, 0x467f4b, 1);
  const head = scene.add.ellipse(0, -26, 25, 23, 0x4b884f, 1).setStrokeStyle(2, 0x24492d, 1);
  const brow = scene.add.rectangle(0, -30, 19, 4, 0x285234, 1).setRotation(-0.03);
  const nose = scene.add.ellipse(0, -24, 6, 8, 0x35673e, 1);
  const jaw = scene.add.ellipse(0, -17, 21, 10, 0x397441, 1).setStrokeStyle(1, 0x1c3d27, 1);
  const leftTusk = scene.add.triangle(-8, -18, 0, 5, 7, 4, 4, -5, 0xf1d49b, 1).setRotation(-0.14);
  const rightTusk = scene.add.triangle(8, -18, 0, 5, -7, 4, -4, -5, 0xf1d49b, 1).setRotation(0.14);
  const eyes = scene.add.graphics();
  eyes.fillStyle(0xffb04e, 1);
  eyes.fillCircle(-5, -29, 1.5);
  eyes.fillCircle(5, -29, 1.5);
  const mohawk = scene.add.graphics();
  mohawk.fillStyle(0xb94028, 1);
  mohawk.fillTriangle(-7, -36, -3, -50, 1, -36);
  mohawk.fillTriangle(-2, -37, 3, -53, 7, -35);
  mohawk.lineStyle(1, 0xf06f37, 0.84);
  mohawk.lineBetween(-4, -39, -2, -48);
  mohawk.lineBetween(2, -39, 3, -50);
  body.add([
    backBannerPole,
    backBanner,
    leftBoot,
    rightBoot,
    furCloak,
    torso,
    chestHarness,
    belt,
    buckle,
    leftShoulder,
    rightShoulder,
    shoulderSpikes,
    neck,
    head,
    brow,
    nose,
    jaw,
    leftTusk,
    rightTusk,
    eyes,
    mohawk,
  ]);

  const axeHandle = scene.add.rectangle(17, -2, 6, 47, 0x69432b, 1)
    .setStrokeStyle(1, 0xd09551, 0.8)
    .setRotation(-0.36);
  const axeHead = scene.add.graphics().setPosition(22, -23).setRotation(-0.36);
  axeHead.fillStyle(0x3c4645, 1);
  axeHead.lineStyle(2, 0xd66b35, 1);
  axeHead.beginPath();
  axeHead.moveTo(-4, -7);
  axeHead.lineTo(13, -11);
  axeHead.lineTo(18, 0);
  axeHead.lineTo(13, 11);
  axeHead.lineTo(-4, 7);
  axeHead.closePath();
  axeHead.fillPath();
  axeHead.strokePath();
  const axeRune = scene.add.graphics().setPosition(26, -23).setRotation(-0.36);
  axeRune.lineStyle(2, 0xffa75f, 0.95);
  axeRune.lineBetween(-4, 0, 4, 0);
  axeRune.lineBetween(0, -4, 0, 4);
  const grip = scene.add.rectangle(10, 18, 9, 8, 0xa83a29, 1).setRotation(-0.36);
  weapon.add([axeHandle, axeHead, axeRune, grip]);
}

function drawMorna(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  weapon: Phaser.GameObjects.Container,
): void {
  const cloak = scene.add.graphics();
  cloak.fillStyle(0x211a2d, 1).fillTriangle(-17, -8, 16, -8, 2, 23);
  cloak.lineStyle(2, 0x704477, 0.88).strokeTriangle(-17, -8, 16, -8, 2, 23);
  const leftBoot = scene.add.ellipse(-6, 16, 8, 12, 0x171923, 1).setRotation(-0.12);
  const rightBoot = scene.add.ellipse(6, 16, 8, 12, 0x171923, 1).setRotation(0.12);
  const skirt = scene.add.graphics();
  skirt.fillStyle(0x56345f, 1).fillTriangle(-12, 1, 12, 1, 0, 23);
  skirt.lineStyle(1, 0xb08a59, 0.78).lineBetween(0, 3, 0, 20);
  const torso = scene.add.ellipse(0, -5, 25, 29, 0x292536, 1).setStrokeStyle(2, 0xb08a59, 0.82);
  const belt = scene.add.rectangle(0, 5, 25, 4, 0x6f4b32, 1).setStrokeStyle(1, 0xc7a46d, 0.8);
  const boneShoulder = scene.add.graphics().setPosition(-13, -10);
  boneShoulder.fillStyle(0xd8ccb1, 1);
  boneShoulder.lineStyle(2, 0x796952, 1);
  boneShoulder.fillTriangle(-7, 4, 0, -8, 7, 4);
  boneShoulder.strokeTriangle(-7, 4, 0, -8, 7, 4);
  const head = scene.add.circle(0, -22, 9, 0xc7c5d0, 1).setStrokeStyle(2, 0x5c5364, 0.9);
  const hair = scene.add.graphics();
  hair.fillStyle(0x171923, 1);
  hair.fillEllipse(0, -27, 20, 12);
  hair.fillTriangle(-10, -26, -8, -7, -2, -18);
  hair.fillTriangle(9, -26, 10, -8, 2, -17);
  hair.lineStyle(3, 0xc7c8d2, 0.92).lineBetween(3, -31, 8, -18);
  const crown = scene.add.graphics();
  crown.fillStyle(0xd6c7a7, 1);
  crown.lineStyle(1, 0x756249, 1);
  crown.fillTriangle(-8, -29, -12, -40, -3, -31);
  crown.fillTriangle(-2, -31, 1, -43, 5, -30);
  crown.lineBetween(-10, -30, 5, -30);
  const eyes = scene.add.graphics();
  eyes.fillStyle(0x72f3e0, 1);
  eyes.fillCircle(-3, -22, 1.4);
  eyes.fillCircle(3, -22, 1.4);
  const soul = scene.add.circle(-16, -2, 4, 0x59e1d2, 0.82).setStrokeStyle(1, 0xb5fff4, 0.92);
  body.add([cloak, leftBoot, rightBoot, skirt, torso, belt, boneShoulder, head, hair, crown, eyes, soul]);

  const staff = scene.add.rectangle(16, -2, 4, 50, 0x392d30, 1)
    .setStrokeStyle(1, 0xb08a59, 0.9)
    .setRotation(-0.12);
  const staffCrescent = scene.add.graphics().setPosition(19, -28).setRotation(-0.12);
  staffCrescent.lineStyle(4, 0xd8ccb1, 1);
  staffCrescent.beginPath();
  staffCrescent.arc(0, 0, 10, -Math.PI * 0.72, Math.PI * 0.72, false);
  staffCrescent.strokePath();
  const lanternFrame = scene.add.graphics().setPosition(21, -20).setRotation(-0.12);
  lanternFrame.lineStyle(2, 0xb08a59, 1);
  lanternFrame.strokeRect(-5, -7, 10, 14);
  lanternFrame.lineBetween(-5, -7, 0, -11);
  lanternFrame.lineBetween(5, -7, 0, -11);
  const lanternSoul = scene.add.circle(21, -20, 4, 0x59e1d2, 0.94)
    .setStrokeStyle(1, 0xc5fff5, 1)
    .setRotation(-0.12);
  weapon.add([staff, staffCrescent, lanternFrame, lanternSoul]);
}

function acquireAttackEffect(scene: Phaser.Scene, pool: AttackEffect[]): AttackEffect {
  const available = pool.find((effect) => !effect.active);
  if (available) return available;
  if (pool.length >= MAX_ATTACK_EFFECTS) {
    const reused = pool[0];
    reused.tween?.stop();
    releaseAttackEffect(reused);
    pool.push(pool.shift()!);
    return reused;
  }
  const container = scene.add.container(0, 0).setVisible(false);
  const shaft = scene.add.rectangle(0, 0, 20, 3, 0xe6c665, 1).setOrigin(0.35, 0.5);
  const head = scene.add.triangle(13, 0, 0, 0, -7, -5, -7, 5, 0xf4e2a1, 1);
  const axeBlade = scene.add.graphics().setVisible(false);
  axeBlade.fillStyle(0x424a49, 1);
  axeBlade.lineStyle(2, 0xf0793d, 1);
  axeBlade.beginPath();
  axeBlade.moveTo(5, -10);
  axeBlade.lineTo(14, -7);
  axeBlade.lineTo(18, 0);
  axeBlade.lineTo(14, 7);
  axeBlade.lineTo(5, 10);
  axeBlade.lineTo(8, 0);
  axeBlade.closePath();
  axeBlade.fillPath();
  axeBlade.strokePath();
  container.add([shaft, head, axeBlade]);
  const effect: AttackEffect = { container, shaft, head, axeBlade, active: false, tween: null };
  pool.push(effect);
  return effect;
}

function releaseAttackEffect(effect: AttackEffect): void {
  effect.tween = null;
  effect.active = false;
  effect.head.setVisible(true);
  effect.axeBlade.setVisible(false);
  effect.container.setVisible(false).setAlpha(1).setScale(1);
}

function acquireAbilityEffect(scene: Phaser.Scene, pool: AbilityEffect[]): AbilityEffect {
  const available = pool.find((effect) => !effect.active);
  if (available) return available;
  if (pool.length >= MAX_ABILITY_EFFECTS) {
    const reused = pool[0];
    reused.tween?.stop();
    releaseAbilityEffect(reused);
    pool.push(pool.shift()!);
    return reused;
  }
  const ring = scene.add.circle(0, 0, 14, 0x000000, 0).setVisible(false);
  const core = scene.add.circle(0, 0, 9, 0x2f7550, 0.3).setVisible(false);
  const effect: AbilityEffect = { ring, core, active: false, tween: null };
  pool.push(effect);
  return effect;
}

function releaseAbilityEffect(effect: AbilityEffect): void {
  effect.tween = null;
  effect.active = false;
  effect.ring.setVisible(false).setAlpha(1).setScale(1);
  effect.core.setVisible(false).setAlpha(1).setScale(1);
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
