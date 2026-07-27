import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, ROUTE_POINTS } from "../game/config.ts";
import type { CampaignAct, EnemyType, Point, TowerLevel, TowerType } from "../game/types.ts";
import {
  createEnemyMotionPose,
  ENEMY_VISUAL_PROFILES,
  sampleEnemyMotion,
  type EnemyMotionPose,
} from "./enemyVisuals.ts";

export type WorldArt = Readonly<{
  actVeil: Phaser.GameObjects.Rectangle;
  gate: Phaser.GameObjects.Container;
  gateCrystal: Phaser.GameObjects.Rectangle;
  gateHomeX: number;
}>;

export type TowerArt = Readonly<{
  container: Phaser.GameObjects.Container;
  head: Phaser.GameObjects.Container;
  aura?: Phaser.GameObjects.Arc;
}>;

export type EnemyArt = Readonly<{
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  healthBack: Phaser.GameObjects.Rectangle;
  healthFill: Phaser.GameObjects.Rectangle;
  shieldFill: Phaser.GameObjects.Rectangle;
  statusRing: Phaser.GameObjects.Arc;
}>;

type AnimatedShape = Phaser.GameObjects.Shape;
type EnemyDrawOptions = Readonly<{ elite?: boolean; bossTier?: CampaignAct; shielded?: boolean }>;
type EnemyRigSpec = Readonly<{
  feet?: readonly [AnimatedShape, AnimatedShape];
  arms?: readonly [AnimatedShape, AnimatedShape];
  weapons?: readonly AnimatedShape[];
  cloth?: AnimatedShape;
  glow?: readonly AnimatedShape[];
}>;
type RigPart = Readonly<{
  target: AnimatedShape;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
}>;
type EnemyRig = Readonly<{
  type: EnemyType;
  pose: EnemyMotionPose;
  feet: readonly RigPart[];
  arms: readonly RigPart[];
  weapons: readonly RigPart[];
  cloth: RigPart | null;
  glow: readonly RigPart[];
  eliteAura: RigPart | null;
}>;

type EnemyBuilder = (scene: Phaser.Scene, body: Phaser.GameObjects.Container, options: EnemyDrawOptions) => EnemyRigSpec;

const ENEMY_BUILDERS = {
  raider: (scene, body) => drawRaider(scene, body),
  swift: (scene, body) => drawSwift(scene, body),
  brute: (scene, body) => drawBrute(scene, body),
  warden: (scene, body) => drawWarden(scene, body),
  shade: (scene, body) => drawShade(scene, body),
  bulwark: (scene, body) => drawBulwark(scene, body),
  shaman: (scene, body) => drawShaman(scene, body),
  boss: (scene, body, options) => drawBoss(scene, body, options.bossTier ?? 1),
  titan: (scene, body, options) => drawTitan(scene, body, options.bossTier ?? 2),
} satisfies Readonly<Record<EnemyType, EnemyBuilder>>;

const enemyRigs = new WeakMap<Phaser.GameObjects.Container, EnemyRig>();

export function drawWorld(scene: Phaser.Scene): WorldArt {
  const background = scene.add.graphics().setDepth(-30);
  background.fillStyle(0x102a27, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  for (let band = 0; band < 16; band += 1) {
    const color = band % 2 === 0 ? 0x173a30 : 0x15342d;
    background.fillStyle(color, 0.54).fillRect(0, band * 36, GAME_WIDTH, 38);
  }

  drawRoute(scene);
  drawDecorations(scene);
  drawEntrance(scene);
  const gate = drawGate(scene);
  const actVeil = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x52366f, 0)
    .setDepth(-12)
    .setBlendMode(Phaser.BlendModes.ADD);

  const vignette = scene.add.graphics().setDepth(80).setScrollFactor(0);
  vignette.lineStyle(18, 0x071310, 0.2).strokeRoundedRect(-5, -5, GAME_WIDTH + 10, GAME_HEIGHT + 10, 28);
  vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
  return Object.freeze({ actVeil, gate: gate.container, gateCrystal: gate.crystal, gateHomeX: gate.container.x });
}

export function createTowerArt(
  scene: Phaser.Scene,
  type: TowerType,
  level: TowerLevel,
  point: Point,
): TowerArt {
  const container = scene.add.container(point.x, point.y).setDepth(point.y + 50);
  const shadow = scene.add.ellipse(0, 9, 39, 17, 0x071511, 0.4);
  const base = scene.add.graphics();
  base.fillStyle(0x213a36, 1).fillCircle(0, 1, 19);
  base.lineStyle(2, 0x6f8873, 0.8).strokeCircle(0, 1, 17);
  base.fillStyle(0x314a43, 1).fillCircle(0, -2, 13);
  for (let index = 0; index < level; index += 1) {
    base.fillStyle(0xf3c967, 0.95).fillCircle(-6 + index * 6, 11, 2);
  }

  const head = scene.add.container(0, -8);
  let aura: Phaser.GameObjects.Arc | undefined;
  if (type === "ranger") drawRanger(scene, head, level);
  if (type === "frost") aura = drawFrost(scene, head, level);
  if (type === "ember") aura = drawEmber(scene, head, level);
  if (type === "storm") aura = drawStorm(scene, head, level);
  container.add([shadow, base, head]);
  if (aura) container.addAt(aura, 2);
  return Object.freeze({ container, head, aura });
}

export function createEnemyArt(
  scene: Phaser.Scene,
  type: EnemyType,
  point: Point,
  options: EnemyDrawOptions = {},
): EnemyArt {
  const container = scene.add.container(point.x, point.y).setDepth(point.y + 30);
  const body = scene.add.container(0, 0);
  const major = type === "boss" || type === "titan";
  const visual = ENEMY_VISUAL_PROFILES[type];
  const shadow = scene.add.ellipse(0, 9, visual.shadowWidth, visual.shadowHeight, 0x06100e, 0.42);
  const rigSpec = ENEMY_BUILDERS[type](scene, body, options);

  const barWidth = visual.healthBarWidth;
  const barY = visual.healthBarY;
  const healthBack = scene.add.rectangle(0, barY, barWidth + 4, 6, 0x07110f, 0.9).setOrigin(0.5).setAlpha(major ? 1 : 0);
  const healthFill = scene.add.rectangle(-barWidth / 2, barY, barWidth, 3, major ? 0xf4bf56 : 0x77e6a5)
    .setOrigin(0, 0.5).setAlpha(major ? 1 : 0);
  const shieldFill = scene.add.rectangle(-barWidth / 2, barY - 5, barWidth, 2, 0x77dff2, 0.95)
    .setOrigin(0, 0.5).setAlpha(options.shielded ? 1 : 0);
  const statusRing = scene.add.circle(0, 1, visual.statusRadius, 0x74dff2, 0)
    .setStrokeStyle(2, 0x74dff2, 0)
    .setDepth(-1);
  const eliteAura = scene.add.circle(0, 1, visual.statusRadius + 3, 0xf3c967, 0)
    .setStrokeStyle(2, 0xf3c967, options.elite ? 0.72 : 0)
    .setDepth(-2);
  container.add([eliteAura, statusRing, shadow, body, healthBack, healthFill, shieldFill]);
  const art = Object.freeze({ container, body, healthBack, healthFill, shieldFill, statusRing });
  enemyRigs.set(body, createEnemyRig(type, rigSpec, options.elite ? eliteAura : null));
  return art;
}

export function updateEnemyArtPose(
  art: EnemyArt,
  type: EnemyType,
  elapsedMs: number,
  progress: number,
  instanceSeed: number,
  moving: boolean,
  enraged: boolean,
): void {
  const rig = enemyRigs.get(art.body);
  if (!rig || rig.type !== type) return;
  const pose = sampleEnemyMotion(type, elapsedMs, progress, instanceSeed, moving, enraged, rig.pose);
  art.body.y = pose.bodyY;
  art.body.rotation = pose.bodyRotation;
  art.body.setScale(pose.bodyScaleX, pose.bodyScaleY);
  applyFootPose(rig.feet[0], pose.leftFootLift, pose.limbSwing);
  applyFootPose(rig.feet[1], pose.rightFootLift, -pose.limbSwing);
  applySwingPose(rig.arms[0], -pose.limbSwing);
  applySwingPose(rig.arms[1], pose.limbSwing);
  for (let index = 0; index < rig.weapons.length; index += 1) {
    applySwingPose(rig.weapons[index], index % 2 === 0 ? pose.limbSwing : -pose.limbSwing);
  }
  if (rig.cloth) {
    rig.cloth.target.rotation = rig.cloth.rotation + pose.clothSway;
    rig.cloth.target.scaleX = rig.cloth.scaleX * (1 + Math.abs(pose.clothSway) * 0.12);
  }
  for (const part of rig.glow) {
    part.target.setAlpha(part.alpha * pose.glowAlpha);
    part.target.setScale(part.scaleX * pose.glowScale, part.scaleY * pose.glowScale);
  }
  if (rig.eliteAura) {
    rig.eliteAura.target.setAlpha(rig.eliteAura.alpha * pose.auraAlpha);
    rig.eliteAura.target.setScale(pose.auraScale);
  }
}

export function createHitBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  radius = 18,
  particleCount = 3,
): void {
  const ring = scene.add.circle(x, y, 5, color, 0).setStrokeStyle(3, color, 0.9).setDepth(1_000);
  scene.tweens.add({
    targets: ring,
    radius,
    alpha: 0,
    duration: 240,
    ease: "Quad.Out",
    onComplete: () => ring.destroy(),
  });
  for (let index = 0; index < particleCount; index += 1) {
    const angle = (Math.PI * 2 * index) / Math.max(1, particleCount) + Math.random() * 0.5;
    const particle = scene.add.circle(x, y, 2.2, color, 0.9).setDepth(1_000);
    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
      alpha: 0,
      scale: 0.2,
      duration: 260,
      onComplete: () => particle.destroy(),
    });
  }
}

export function createFloatingText(scene: Phaser.Scene, x: number, y: number, text: string, color: string): void {
  const label = scene.add.text(x, y, text, {
    color,
    fontFamily: "system-ui, sans-serif",
    fontSize: "12px",
    fontStyle: "700",
    stroke: "#07110f",
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(1_100);
  scene.tweens.add({
    targets: label,
    y: y - 24,
    alpha: 0,
    duration: 620,
    ease: "Quad.Out",
    onComplete: () => label.destroy(),
  });
}

export function setWorldAct(scene: Phaser.Scene, art: WorldArt, act: CampaignAct): void {
  const colors: Record<CampaignAct, number> = { 1: 0x3e7b63, 2: 0x5c3c78, 3: 0x8b3448 };
  const alpha: Record<CampaignAct, number> = { 1: 0, 2: 0.08, 3: 0.14 };
  art.actVeil.setFillStyle(colors[act], 1);
  scene.tweens.add({ targets: art.actVeil, alpha: alpha[act], duration: 850, ease: "Sine.InOut" });
}

export function createLightningArc(
  scene: Phaser.Scene,
  from: Point,
  to: Point,
  intensity = 1,
): void {
  const bolt = scene.add.graphics().setDepth(1_050);
  bolt.lineStyle(2.4 + intensity * 0.35, 0xc9f8ff, 0.96).beginPath().moveTo(from.x, from.y);
  const segments = 5;
  for (let index = 1; index < segments; index += 1) {
    const ratio = index / segments;
    const jitter = (index % 2 === 0 ? -1 : 1) * (3 + intensity);
    bolt.lineTo(from.x + (to.x - from.x) * ratio + jitter, from.y + (to.y - from.y) * ratio - jitter * 0.45);
  }
  bolt.lineTo(to.x, to.y).strokePath();
  scene.tweens.add({ targets: bolt, alpha: 0, duration: 150, onComplete: () => bolt.destroy() });
}

export function createHealPulse(scene: Phaser.Scene, point: Point): void {
  const pulse = scene.add.circle(point.x, point.y, 8, 0x71f0a1, 0.08).setStrokeStyle(2, 0x9effbc, 0.82).setDepth(1_020);
  scene.tweens.add({ targets: pulse, radius: 42, alpha: 0, duration: 520, onComplete: () => pulse.destroy() });
}

export function createSummonBurst(scene: Phaser.Scene, point: Point): void {
  const ring = scene.add.circle(point.x, point.y, 10, 0xb77df2, 0.12).setStrokeStyle(3, 0xd5a6ff, 0.9).setDepth(1_040);
  scene.tweens.add({ targets: ring, radius: 58, alpha: 0, duration: 620, ease: "Quad.Out", onComplete: () => ring.destroy() });
}

export function createGateHitEffect(scene: Phaser.Scene, art: WorldArt, damage: number): void {
  scene.tweens.killTweensOf(art.gate);
  art.gate.setX(art.gateHomeX);
  scene.tweens.add({ targets: art.gate, x: art.gateHomeX + 5, duration: 45, yoyo: true, repeat: 3 });
  art.gateCrystal.setFillStyle(0xff685f, 1);
  scene.time.delayedCall(260, () => art.gateCrystal.active && art.gateCrystal.setFillStyle(0x72e6c2, 1));
  createFloatingText(scene, art.gate.x, art.gate.y - 35, `−${damage} ♥`, "#ff9589");
  for (let index = 0; index < 4; index += 1) {
    const shard = scene.add.rectangle(art.gate.x, art.gate.y - 18, 4, 8, 0x9ff6dc).setRotation(index * 0.8).setDepth(1_100);
    scene.tweens.add({
      targets: shard,
      x: shard.x + (index - 1.5) * 13,
      y: shard.y - 12 - (index % 2) * 8,
      alpha: 0,
      duration: 360,
      onComplete: () => shard.destroy(),
    });
  }
}

function drawRoute(scene: Phaser.Scene): void {
  const route = scene.add.graphics().setDepth(-18);
  strokePolyline(route, ROUTE_POINTS, 48, 0x071a18, 0.72);
  strokePolyline(route, ROUTE_POINTS, 42, 0x765838, 1);
  strokePolyline(route, ROUTE_POINTS, 34, 0xb78a53, 1);
  strokePolyline(route, ROUTE_POINTS, 25, 0xc9a369, 0.72);
  strokePolyline(route, ROUTE_POINTS, 2, 0xf3d99b, 0.2);

  const marks = scene.add.graphics().setDepth(-16);
  marks.fillStyle(0x5c432d, 0.34);
  for (let index = 0; index < ROUTE_POINTS.length - 1; index += 1) {
    const start = ROUTE_POINTS[index];
    const end = ROUTE_POINTS[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    const steps = Math.floor(length / 34);
    for (let step = 1; step < steps; step += 1) {
      const ratio = step / steps;
      const x = start.x + (end.x - start.x) * ratio;
      const y = start.y + (end.y - start.y) * ratio;
      marks.fillCircle(x + (step % 2 ? -5 : 6), y + (index % 2 ? 4 : -4), 1.5);
    }
  }
}

function strokePolyline(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly Point[],
  width: number,
  color: number,
  alpha: number,
): void {
  graphics.lineStyle(width, color, alpha).beginPath().moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) graphics.lineTo(points[index].x, points[index].y);
  graphics.strokePath();
}

function drawDecorations(scene: Phaser.Scene): void {
  const rng = seededRandom(87_121);
  const graphics = scene.add.graphics().setDepth(-20);
  for (let index = 0; index < 86; index += 1) {
    const x = 10 + rng() * (GAME_WIDTH - 20);
    const y = 10 + rng() * (GAME_HEIGHT - 20);
    if (distanceToRoute(x, y) < 34) continue;
    const radius = 2 + rng() * 4;
    if (rng() > 0.35) {
      graphics.fillStyle(rng() > 0.5 ? 0x245a43 : 0x1e4a3a, 0.84).fillCircle(x, y, radius + 2);
      graphics.fillStyle(0x3c7650, 0.62).fillCircle(x - 2, y - 2, radius);
    } else {
      graphics.fillStyle(0xc6db88, 0.65).fillCircle(x, y, 1.4);
      graphics.fillStyle(rng() > 0.5 ? 0xe9a873 : 0x88d7c0, 0.8).fillCircle(x + 2, y - 1, 1.2);
    }
  }

  for (let index = 0; index < 8; index += 1) {
    const x = index % 2 === 0 ? 12 + rng() * 34 : GAME_WIDTH - 12 - rng() * 34;
    const y = 55 + index * 62 + rng() * 20;
    const tree = scene.add.container(x, y).setDepth(y - 15);
    const trunk = scene.add.rectangle(0, 8, 8, 22, 0x59412e).setOrigin(0.5);
    const crownBack = scene.add.circle(0, -4, 18, 0x12392e);
    const crown = scene.add.circle(-3, -8, 14, 0x246044);
    const light = scene.add.circle(-8, -13, 6, 0x46825a, 0.7);
    tree.add([trunk, crownBack, crown, light]);
  }

  for (let index = 0; index < 5; index += 1) {
    const firefly = scene.add.circle(26 + rng() * (GAME_WIDTH - 52), 80 + rng() * (GAME_HEIGHT - 150), 1.5, 0xd6ff9b, 0.24)
      .setDepth(-14)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: firefly,
      x: firefly.x + (rng() - 0.5) * 30,
      y: firefly.y + (rng() - 0.5) * 24,
      alpha: 0.85,
      duration: 1_700 + rng() * 1_200,
      delay: rng() * 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }
}

function drawEntrance(scene: Phaser.Scene): void {
  const portal = scene.add.container(8, 52).setDepth(40);
  const glow = scene.add.circle(0, 0, 24, 0xb46cff, 0.08).setStrokeStyle(3, 0xb987ff, 0.65);
  const inner = scene.add.circle(0, 0, 13, 0x58317a, 0.8).setStrokeStyle(2, 0xe4bdff, 0.8);
  portal.add([glow, inner]);
  scene.tweens.add({ targets: glow, scale: 1.25, alpha: 0.18, duration: 1_200, yoyo: true, repeat: -1 });
}

function drawGate(scene: Phaser.Scene): Readonly<{
  container: Phaser.GameObjects.Container;
  crystal: Phaser.GameObjects.Rectangle;
}> {
  const gate = scene.add.container(162, 535).setDepth(600);
  const shadow = scene.add.ellipse(0, 17, 72, 24, 0x07110f, 0.45);
  const left = scene.add.rectangle(-23, 1, 18, 48, 0x31423e).setStrokeStyle(3, 0x809080);
  const right = scene.add.rectangle(23, 1, 18, 48, 0x31423e).setStrokeStyle(3, 0x809080);
  const arch = scene.add.rectangle(0, -20, 61, 15, 0x3c5049).setStrokeStyle(3, 0x8ea08f);
  const crystal = scene.add.rectangle(0, -23, 12, 12, 0x72e6c2).setRotation(Math.PI / 4).setStrokeStyle(2, 0xd6fff1);
  const doors = scene.add.rectangle(0, 8, 28, 34, 0x6f4a2d).setStrokeStyle(2, 0x261b15);
  gate.add([shadow, doors, left, right, arch, crystal]);
  scene.tweens.add({ targets: crystal, alpha: 0.55, duration: 950, yoyo: true, repeat: -1 });
  return Object.freeze({ container: gate, crystal });
}

function drawRanger(scene: Phaser.Scene, head: Phaser.GameObjects.Container, level: number): void {
  const deck = scene.add.rectangle(0, 0, 28, 12, 0x725032).setStrokeStyle(2, 0xc59752);
  const bow = scene.add.graphics();
  bow.lineStyle(3 + level * 0.4, 0xd8ad62, 1).beginPath().arc(5, 0, 13, -1.2, 1.2).strokePath();
  bow.lineStyle(1, 0xe8e0c3, 0.9).beginPath().moveTo(10, -12).lineTo(10, 12).strokePath();
  const bolt = scene.add.rectangle(12, 0, 28, 2.4, 0xf0db95).setOrigin(0.15, 0.5);
  head.add([deck, bow, bolt]);
}

function drawFrost(scene: Phaser.Scene, head: Phaser.GameObjects.Container, level: number): Phaser.GameObjects.Arc {
  const aura = scene.add.circle(0, -8, 16 + level * 2, 0x65dce8, 0.08).setStrokeStyle(2, 0x74e8f3, 0.36);
  const crystal = scene.add.rectangle(0, -2, 18 + level * 2, 18 + level * 2, 0x7ee5ee)
    .setRotation(Math.PI / 4).setScale(0.72, 1.12).setStrokeStyle(2, 0xd9ffff);
  const core = scene.add.rectangle(-3, -6, 7, 7, 0xffffff, 0.72).setRotation(Math.PI / 4).setScale(0.7, 1.1);
  head.add([crystal, core]);
  scene.tweens.add({ targets: [crystal, core], y: "-=3", duration: 880, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  scene.tweens.add({ targets: aura, alpha: 0.2, scale: 1.2, duration: 1_100, yoyo: true, repeat: -1 });
  return aura;
}

function drawEmber(scene: Phaser.Scene, head: Phaser.GameObjects.Container, level: number): Phaser.GameObjects.Arc {
  const aura = scene.add.circle(0, -8, 18 + level * 2, 0xff7b45, 0.08);
  const bowl = scene.add.ellipse(0, 5, 28, 14, 0x6f4030).setStrokeStyle(2, 0xd08b56);
  const flameOuter = scene.add.triangle(0, -9, -9, 10, 0, -17 - level * 2, 9, 10, 0xff7643);
  const flameInner = scene.add.triangle(0, -5, -5, 6, 1, -10 - level, 6, 6, 0xffd56a);
  head.add([bowl, flameOuter, flameInner]);
  scene.tweens.add({ targets: [flameOuter, flameInner], scaleX: 0.78, scaleY: 1.12, duration: 180, yoyo: true, repeat: -1 });
  scene.tweens.add({ targets: aura, alpha: 0.2, scale: 1.3, duration: 760, yoyo: true, repeat: -1 });
  return aura;
}

function drawStorm(scene: Phaser.Scene, head: Phaser.GameObjects.Container, level: number): Phaser.GameObjects.Arc {
  const aura = scene.add.circle(0, -8, 18 + level * 2, 0x74dff2, 0.06)
    .setStrokeStyle(2, 0x9ff5ff, 0.3);
  const crown = scene.add.graphics();
  crown.fillStyle(0x315c72, 1).lineStyle(2, 0xa9e9f5, 0.92);
  crown.beginPath()
    .moveTo(-13, 7)
    .lineTo(-9, -8)
    .lineTo(-2, -2)
    .lineTo(3, -18 - level)
    .lineTo(6, -4)
    .lineTo(13, -10)
    .lineTo(11, 7)
    .closePath()
    .fillPath()
    .strokePath();
  const core = scene.add.circle(1, -5, 4 + level * 0.45, 0xe0fcff, 0.98)
    .setStrokeStyle(2, 0x65d9ee, 0.86);
  const prongLeft = scene.add.rectangle(-10, -10, 3, 17, 0x8ddcec).setRotation(-0.35);
  const prongRight = scene.add.rectangle(11, -11, 3, 17, 0x8ddcec).setRotation(0.35);
  head.add([crown, prongLeft, prongRight, core]);
  scene.tweens.add({ targets: core, scale: 1.35, alpha: 0.62, duration: 390, yoyo: true, repeat: -1 });
  scene.tweens.add({ targets: aura, alpha: 0.2, scale: 1.26, duration: 820, yoyo: true, repeat: -1 });
  return aura;
}

function drawRaider(scene: Phaser.Scene, body: Phaser.GameObjects.Container): EnemyRigSpec {
  const leftFoot = scene.add.ellipse(-6, 10, 9, 6, 0x263326).setStrokeStyle(2, 0x14231a);
  const rightFoot = scene.add.ellipse(6, 10, 9, 6, 0x263326).setStrokeStyle(2, 0x14231a);
  const cloak = scene.add.ellipse(0, 1, 25, 27, 0x5f9951).setStrokeStyle(2, 0x172e22);
  const leftArm = scene.add.ellipse(-11, 0, 7, 17, 0x76aa55).setRotation(0.22).setStrokeStyle(2, 0x172e22);
  const rightArm = scene.add.ellipse(10, -1, 7, 16, 0x76aa55).setRotation(-0.24).setStrokeStyle(2, 0x172e22);
  const sword = scene.add.polygon(14, -1, [-3, 9, -2, -6, 1, -14, 4, -6, 4, 9], 0xd8eee5)
    .setRotation(0.32)
    .setStrokeStyle(2, 0x49625c);
  const portrait = scene.add.graphics();
  portrait.fillStyle(0x304a2d, 1).lineStyle(2, 0x172e22, 1).fillCircle(0, -10, 11).strokeCircle(0, -10, 11);
  portrait.fillStyle(0xa2c76c, 1).fillTriangle(-7, -11, -15, -14, -7, -5).fillTriangle(7, -11, 15, -14, 7, -5);
  portrait.fillEllipse(0, -10, 15, 12);
  portrait.fillStyle(0xffe578, 1).fillRect(-5, -12, 3, 2).fillRect(2, -12, 3, 2);
  portrait.fillStyle(0x815b36, 1).fillRect(-5, 4, 10, 3);
  body.add([leftFoot, rightFoot, cloak, leftArm, rightArm, sword, portrait]);
  return { feet: [leftFoot, rightFoot], arms: [leftArm, rightArm], weapons: [sword], cloth: cloak };
}

function drawSwift(scene: Phaser.Scene, body: Phaser.GameObjects.Container): EnemyRigSpec {
  const cape = scene.add.polygon(-4, 1, [-13, -9, 5, -12, 13, 3, 4, 13, -4, 8, -14, 14], 0x754595, 0.92)
    .setStrokeStyle(2, 0x301d3b);
  const leftFoot = scene.add.ellipse(-5, 10, 7, 6, 0x27243a).setRotation(-0.2).setStrokeStyle(2, 0x161422);
  const rightFoot = scene.add.ellipse(5, 9, 7, 6, 0x27243a).setRotation(0.2).setStrokeStyle(2, 0x161422);
  const torso = scene.add.ellipse(0, 0, 19, 27, 0x8f55ad).setStrokeStyle(2, 0x301d3b);
  const leftArm = scene.add.ellipse(-9, -1, 6, 17, 0x6d438a).setRotation(-0.45).setStrokeStyle(2, 0x301d3b);
  const rightArm = scene.add.ellipse(9, -1, 6, 17, 0x6d438a).setRotation(0.45).setStrokeStyle(2, 0x301d3b);
  const leftBlade = scene.add.polygon(-13, 2, [-8, 1, 3, -3, 9, -1, 3, 2], 0xd8f3ee).setRotation(-0.4).setStrokeStyle(1, 0x607a78);
  const rightBlade = scene.add.polygon(13, 2, [-9, -1, -3, -3, 8, 1, -3, 2], 0xd8f3ee).setRotation(0.4).setStrokeStyle(1, 0x607a78);
  const portrait = scene.add.graphics();
  portrait.fillStyle(0x3b274d, 1).lineStyle(2, 0x22152d, 1).fillCircle(0, -10, 9).strokeCircle(0, -10, 9);
  portrait.fillStyle(0x17131f, 1).fillEllipse(0, -9, 12, 8);
  portrait.fillStyle(0xe6c7ff, 1).fillRect(-5, -11, 3, 2).fillRect(2, -11, 3, 2);
  body.add([cape, leftFoot, rightFoot, torso, leftArm, rightArm, leftBlade, rightBlade, portrait]);
  return { feet: [leftFoot, rightFoot], arms: [leftArm, rightArm], weapons: [rightBlade, leftBlade], cloth: cape };
}

function drawBrute(scene: Phaser.Scene, body: Phaser.GameObjects.Container): EnemyRigSpec {
  const leftFoot = scene.add.ellipse(-8, 11, 13, 7, 0x3d2d23).setStrokeStyle(2, 0x201812);
  const rightFoot = scene.add.ellipse(8, 11, 13, 7, 0x3d2d23).setStrokeStyle(2, 0x201812);
  const torso = scene.add.ellipse(0, 0, 38, 31, 0x78563b).setStrokeStyle(3, 0x2d2019);
  const leftArm = scene.add.ellipse(-17, 2, 12, 24, 0x6b4c35).setRotation(0.18).setStrokeStyle(2, 0x2d2019);
  const rightArm = scene.add.ellipse(17, 2, 12, 24, 0x6b4c35).setRotation(-0.18).setStrokeStyle(2, 0x2d2019);
  const portrait = scene.add.graphics();
  portrait.fillStyle(0x2d2019, 1).fillCircle(-11, -8, 8).fillCircle(11, -8, 8);
  portrait.fillStyle(0xa97749, 1).lineStyle(2, 0x2d2019, 1).fillEllipse(0, -9, 24, 18).strokeEllipse(0, -9, 24, 18);
  portrait.fillStyle(0xd2c08b, 1).fillTriangle(-8, -15, -17, -24, -13, -8).fillTriangle(8, -15, 17, -24, 13, -8);
  portrait.fillStyle(0xffcf6b, 1).fillRect(-7, -11, 4, 3).fillRect(3, -11, 4, 3);
  portrait.fillStyle(0x9d7048, 1).fillRoundedRect(-5, -1, 10, 16, 3);
  body.add([leftFoot, rightFoot, torso, leftArm, rightArm, portrait]);
  return { feet: [leftFoot, rightFoot], arms: [leftArm, rightArm] };
}

function drawWarden(scene: Phaser.Scene, body: Phaser.GameObjects.Container): EnemyRigSpec {
  const leftFoot = scene.add.ellipse(-6, 11, 10, 6, 0x24474b).setStrokeStyle(2, 0x173b42);
  const rightFoot = scene.add.ellipse(6, 11, 10, 6, 0x24474b).setStrokeStyle(2, 0x173b42);
  const torso = scene.add.ellipse(0, 1, 28, 30, 0x397f82).setStrokeStyle(2, 0x173b42);
  const leftArm = scene.add.ellipse(-12, 0, 8, 20, 0x316d71).setRotation(0.18).setStrokeStyle(2, 0x173b42);
  const rightArm = scene.add.ellipse(12, 0, 8, 20, 0x316d71).setRotation(-0.18).setStrokeStyle(2, 0x173b42);
  const ward = scene.add.circle(14, -3, 6, 0x8df7dc, 0.78).setStrokeStyle(2, 0xd9ffff, 0.9);
  const wardCore = scene.add.circle(14, -3, 2.5, 0xf4ffff, 0.96);
  const portrait = scene.add.graphics();
  portrait.fillStyle(0x2c656a, 1).lineStyle(2, 0x173b42, 1).fillCircle(0, -10, 10).strokeCircle(0, -10, 10);
  portrait.fillStyle(0x4d999b, 1).fillCircle(-12, -5, 5).fillCircle(12, -5, 5);
  portrait.fillStyle(0xbff1e8, 1).lineStyle(1, 0x2a6268, 1);
  portrait.beginPath().moveTo(0, -18).lineTo(7, -10).lineTo(0, -2).lineTo(-7, -10).closePath().fillPath().strokePath();
  portrait.fillStyle(0x18393c, 1).fillRect(-4, -11, 8, 2);
  body.add([leftFoot, rightFoot, torso, leftArm, rightArm, ward, wardCore, portrait]);
  return { feet: [leftFoot, rightFoot], arms: [leftArm, rightArm], glow: [ward, wardCore] };
}

function drawShade(scene: Phaser.Scene, body: Phaser.GameObjects.Container): EnemyRigSpec {
  const mist = scene.add.ellipse(0, 5, 33, 19, 0x8055a2, 0.28);
  const tail = scene.add.polygon(0, 3, [-13, -11, 13, -11, 11, 3, 5, 14, 0, 9, -6, 15, -11, 3], 0x563474, 0.9)
    .setStrokeStyle(2, 0x21132f, 0.9);
  const leftArm = scene.add.polygon(-11, -1, [-5, -6, 4, -3, 10, 7, 4, 6, 0, 11, -4, 5], 0x6f4590, 0.88)
    .setStrokeStyle(2, 0x21132f, 0.8);
  const rightArm = scene.add.polygon(11, -1, [5, -6, -4, -3, -10, 7, -4, 6, 0, 11, 4, 5], 0x6f4590, 0.88)
    .setStrokeStyle(2, 0x21132f, 0.8);
  const portrait = scene.add.graphics();
  portrait.fillStyle(0x563474, 1).lineStyle(2, 0x21132f, 1).fillCircle(0, -10, 11).strokeCircle(0, -10, 11);
  portrait.fillStyle(0x17101f, 1).fillEllipse(0, -9, 14, 11);
  portrait.fillStyle(0xd3a8ff, 1).fillEllipse(-4, -10, 4, 3).fillEllipse(4, -10, 4, 3);
  body.add([mist, tail, leftArm, rightArm, portrait]);
  return { arms: [leftArm, rightArm], cloth: tail, glow: [mist] };
}

function drawBulwark(scene: Phaser.Scene, body: Phaser.GameObjects.Container): EnemyRigSpec {
  const leftFoot = scene.add.ellipse(-7, 11, 12, 7, 0x354247).setStrokeStyle(2, 0x20292b);
  const rightFoot = scene.add.ellipse(8, 11, 12, 7, 0x354247).setStrokeStyle(2, 0x20292b);
  const torso = scene.add.ellipse(4, 0, 34, 31, 0x59666a).setStrokeStyle(3, 0x20292b);
  const leftArm = scene.add.ellipse(-12, 0, 9, 21, 0x4b585c).setRotation(0.18).setStrokeStyle(2, 0x20292b);
  const rightArm = scene.add.ellipse(15, 0, 9, 21, 0x4b585c).setRotation(-0.14).setStrokeStyle(2, 0x20292b);
  const shield = scene.add.polygon(-7, 1, [-13, -17, 10, -15, 14, 5, 0, 18, -14, 7], 0x507e88)
    .setStrokeStyle(3, 0xb6d6d6);
  const core = scene.add.rectangle(-7, 0, 8, 8, 0x9eeaf1).setRotation(Math.PI / 4).setStrokeStyle(1, 0xeaffff);
  const portrait = scene.add.graphics();
  portrait.fillStyle(0x87969a, 1).lineStyle(2, 0x30393a, 1).fillRoundedRect(0, -18, 18, 14, 5).strokeRoundedRect(0, -18, 18, 14, 5);
  portrait.fillStyle(0x182326, 1).fillRect(3, -13, 12, 3);
  body.add([leftFoot, rightFoot, torso, leftArm, rightArm, portrait, shield, core]);
  return { feet: [leftFoot, rightFoot], arms: [leftArm, rightArm], glow: [core] };
}

function drawShaman(scene: Phaser.Scene, body: Phaser.GameObjects.Container): EnemyRigSpec {
  const leftFoot = scene.add.ellipse(-6, 11, 9, 6, 0x284b34).setStrokeStyle(2, 0x163728);
  const rightFoot = scene.add.ellipse(6, 11, 9, 6, 0x284b34).setStrokeStyle(2, 0x163728);
  const cloak = scene.add.ellipse(-1, 1, 27, 30, 0x3d8461).setStrokeStyle(2, 0x163728);
  const leftArm = scene.add.ellipse(-11, 0, 7, 19, 0x397557).setRotation(0.2).setStrokeStyle(2, 0x163728);
  const rightArm = scene.add.ellipse(10, -1, 7, 19, 0x397557).setRotation(-0.2).setStrokeStyle(2, 0x163728);
  const staff = scene.add.rectangle(14, 0, 3, 34, 0x6b4c31).setRotation(0.08).setStrokeStyle(1, 0x362519);
  const bloom = scene.add.circle(15, -18, 6, 0x8af0ad, 0.82).setStrokeStyle(2, 0xd6ffe1, 0.9);
  const bloomCore = scene.add.circle(15, -18, 2.5, 0xe8fff0, 0.95);
  const portrait = scene.add.graphics();
  portrait.fillStyle(0x67a779, 1).lineStyle(2, 0x214e38, 1).fillCircle(-1, -10, 10).strokeCircle(-1, -10, 10);
  portrait.fillStyle(0xd7e8b8, 1).lineStyle(1, 0x56634a, 1);
  portrait.beginPath().moveTo(-1, -18).lineTo(7, -10).lineTo(3, -2).lineTo(-5, -2).lineTo(-9, -10).closePath().fillPath().strokePath();
  portrait.fillStyle(0x183025, 1).fillCircle(-4, -10, 1.5).fillCircle(3, -10, 1.5);
  body.add([leftFoot, rightFoot, cloak, leftArm, rightArm, staff, bloom, bloomCore, portrait]);
  return { feet: [leftFoot, rightFoot], arms: [leftArm, rightArm], weapons: [staff], cloth: cloak, glow: [bloom, bloomCore] };
}

function drawTitan(scene: Phaser.Scene, body: Phaser.GameObjects.Container, tier: CampaignAct): EnemyRigSpec {
  const colors: Record<CampaignAct, readonly [number, number, number]> = {
    1: [0x3e4b50, 0x789196, 0x8fe8ef],
    2: [0x493e5e, 0x806c9c, 0xc7a2f5],
    3: [0x5e3542, 0x98525d, 0xffa0a4],
  };
  const [dark, mid, glow] = colors[tier];
  const leftFoot = scene.add.ellipse(-12, 15, 20, 11, dark).setStrokeStyle(3, 0x201c26);
  const rightFoot = scene.add.ellipse(12, 15, 20, 11, dark).setStrokeStyle(3, 0x201c26);
  const torso = scene.add.polygon(0, -3, [-22, 13, -19, -14, -9, -22, 9, -22, 19, -14, 22, 13], mid)
    .setStrokeStyle(3, dark);
  const leftArm = scene.add.ellipse(-23, 0, 17, 32, dark).setRotation(0.12).setStrokeStyle(3, 0x201c26);
  const rightArm = scene.add.ellipse(23, 0, 17, 32, dark).setRotation(-0.12).setStrokeStyle(3, 0x201c26);
  const core = scene.add.rectangle(0, -5, 13, 13, glow).setRotation(Math.PI / 4).setStrokeStyle(2, 0xffffff, 0.82);
  const portrait = scene.add.graphics();
  portrait.fillStyle(dark, 1).lineStyle(3, 0x201c26, 1).fillRoundedRect(-22, -18, 44, 12, 4).strokeRoundedRect(-22, -18, 44, 12, 4);
  portrait.fillStyle(mid, 1).fillRoundedRect(-10, -28, 20, 17, 5);
  portrait.fillStyle(dark, 1).fillTriangle(-9, -24, -21, -38, -14, -17).fillTriangle(9, -24, 21, -38, 14, -17);
  portrait.fillStyle(glow, 1).fillRect(-6, -23, 12, 3);
  body.add([leftFoot, rightFoot, torso, leftArm, rightArm, portrait, core]);
  return { feet: [leftFoot, rightFoot], arms: [leftArm, rightArm], glow: [core] };
}

function drawBoss(scene: Phaser.Scene, body: Phaser.GameObjects.Container, tier: CampaignAct): EnemyRigSpec {
  const palettes: Record<CampaignAct, readonly [number, number, number, number]> = {
    1: [0x391d26, 0x873f4a, 0xf1c85a, 0xffe9a3],
    2: [0x20203d, 0x4e547f, 0x9ae7ef, 0xf5ffff],
    3: [0x351523, 0x812f48, 0xdd536c, 0xffc1b8],
  };
  const [dark, mid, accent, glow] = palettes[tier];
  const leftFoot = scene.add.ellipse(-9, 14, 14, 8, dark).setStrokeStyle(3, 0x1d151b);
  const rightFoot = scene.add.ellipse(9, 14, 14, 8, dark).setStrokeStyle(3, 0x1d151b);
  const mantle = scene.add.ellipse(0, 1, 51, 38, mid, 0.94).setStrokeStyle(3, dark);
  const robe = scene.add.ellipse(0, 5, 34, 35, dark, 0.96).setStrokeStyle(2, 0x1d151b);
  const leftArm = scene.add.ellipse(-20, 1, 10, 26, mid).setRotation(0.16).setStrokeStyle(3, dark);
  const rightArm = scene.add.ellipse(20, 1, 10, 26, mid).setRotation(-0.16).setStrokeStyle(3, dark);
  const staff = scene.add.rectangle(23, -1, 4, 39, dark).setRotation(0.04).setStrokeStyle(1, accent);
  const staffCore = scene.add.circle(23, -22, 7, accent, 0.82).setStrokeStyle(2, glow, 0.92);
  const chestCore = scene.add.circle(0, -2, 4.5, glow, 0.92).setStrokeStyle(2, accent, 0.9);
  const portrait = scene.add.graphics();
  portrait.fillStyle(0x211923, 1).lineStyle(2, dark, 1).fillCircle(0, -14, 11).strokeCircle(0, -14, 11);
  portrait.fillStyle(glow, 1).fillRect(-6, -16, 4, 3).fillRect(2, -16, 4, 3);
  portrait.fillStyle(accent, 1).lineStyle(2, dark, 1);
  portrait.beginPath().moveTo(-13, -23).lineTo(-9, -36).lineTo(-3, -28).lineTo(1, -39).lineTo(6, -28).lineTo(12, -36).lineTo(13, -23).closePath().fillPath().strokePath();
  body.add([leftFoot, rightFoot, mantle, robe, leftArm, rightArm, staff, staffCore, chestCore, portrait]);
  return {
    feet: [leftFoot, rightFoot],
    arms: [leftArm, rightArm],
    weapons: [staff],
    cloth: mantle,
    glow: [staffCore, chestCore],
  };
}

function createEnemyRig(type: EnemyType, spec: EnemyRigSpec, eliteAura: AnimatedShape | null): EnemyRig {
  return Object.freeze({
    type,
    pose: createEnemyMotionPose(),
    feet: (spec.feet ?? []).map(captureRigPart),
    arms: (spec.arms ?? []).map(captureRigPart),
    weapons: (spec.weapons ?? []).map(captureRigPart),
    cloth: spec.cloth ? captureRigPart(spec.cloth) : null,
    glow: (spec.glow ?? []).map(captureRigPart),
    eliteAura: eliteAura ? captureRigPart(eliteAura) : null,
  });
}

function captureRigPart(target: AnimatedShape): RigPart {
  return Object.freeze({
    target,
    x: target.x,
    y: target.y,
    rotation: target.rotation,
    scaleX: target.scaleX,
    scaleY: target.scaleY,
    alpha: target.alpha,
  });
}

function applyFootPose(part: RigPart | undefined, lift: number, swing: number): void {
  if (!part) return;
  part.target.y = part.y - lift;
  part.target.rotation = part.rotation + swing * 0.28;
}

function applySwingPose(part: RigPart | undefined, swing: number): void {
  if (!part) return;
  part.target.rotation = part.rotation + swing;
}

function distanceToRoute(x: number, y: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 1; index < ROUTE_POINTS.length; index += 1) {
    best = Math.min(best, distanceToSegment(x, y, ROUTE_POINTS[index - 1], ROUTE_POINTS[index]));
  }
  return best;
}

function distanceToSegment(x: number, y: number, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const ratio = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared));
  return Math.hypot(x - (start.x + dx * ratio), y - (start.y + dy * ratio));
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = Math.imul(1_664_525, value) + 1_013_904_223;
    return (value >>> 0) / 4_294_967_296;
  };
}
