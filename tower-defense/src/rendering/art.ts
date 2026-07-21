import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, ROUTE_POINTS } from "../game/config.ts";
import type { CampaignAct, EnemyType, Point, TowerLevel, TowerType } from "../game/types.ts";

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
  options: Readonly<{ elite?: boolean; bossTier?: CampaignAct; shielded?: boolean }> = {},
): EnemyArt {
  const container = scene.add.container(point.x, point.y).setDepth(point.y + 30);
  const body = scene.add.container(0, 0);
  const major = type === "boss" || type === "titan";
  const shadow = scene.add.ellipse(0, 8, major ? 48 : 28, major ? 17 : 11, 0x06100e, 0.42);
  if (type === "raider") drawRaider(scene, body);
  if (type === "swift") drawSwift(scene, body);
  if (type === "brute") drawBrute(scene, body);
  if (type === "warden") drawWarden(scene, body);
  if (type === "shade") drawShade(scene, body);
  if (type === "bulwark") drawBulwark(scene, body);
  if (type === "shaman") drawShaman(scene, body);
  if (type === "boss") drawBoss(scene, body, options.bossTier ?? 1);
  if (type === "titan") drawTitan(scene, body, options.bossTier ?? 2);

  const barWidth = major ? 56 : 30;
  const barY = major ? -39 : -27;
  const healthBack = scene.add.rectangle(0, barY, barWidth + 4, 6, 0x07110f, 0.9).setOrigin(0.5).setAlpha(major ? 1 : 0);
  const healthFill = scene.add.rectangle(-barWidth / 2, barY, barWidth, 3, major ? 0xf4bf56 : 0x77e6a5)
    .setOrigin(0, 0.5).setAlpha(major ? 1 : 0);
  const shieldFill = scene.add.rectangle(-barWidth / 2, barY - 5, barWidth, 2, 0x77dff2, 0.95)
    .setOrigin(0, 0.5).setAlpha(options.shielded ? 1 : 0);
  const statusRing = scene.add.circle(0, 1, major ? 29 : 19, 0x74dff2, 0)
    .setStrokeStyle(2, 0x74dff2, 0)
    .setDepth(-1);
  const eliteAura = scene.add.circle(0, 1, major ? 32 : 21, 0xf3c967, 0)
    .setStrokeStyle(2, 0xf3c967, options.elite ? 0.72 : 0)
    .setDepth(-2);
  container.add([eliteAura, statusRing, shadow, body, healthBack, healthFill, shieldFill]);
  if (options.elite) scene.tweens.add({ targets: eliteAura, alpha: 0.6, scale: 1.12, duration: 760, yoyo: true, repeat: -1 });
  return Object.freeze({ container, body, healthBack, healthFill, shieldFill, statusRing });
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

function drawRaider(scene: Phaser.Scene, body: Phaser.GameObjects.Container): void {
  const cloak = scene.add.triangle(0, 0, -13, 14, 0, -17, 13, 14, 0x659a52).setStrokeStyle(2, 0x183927);
  const head = scene.add.circle(0, -10, 7, 0xa8c76b).setStrokeStyle(2, 0x233b27);
  const eyes = scene.add.rectangle(2, -11, 5, 2, 0x18231c);
  body.add([cloak, head, eyes]);
}

function drawSwift(scene: Phaser.Scene, body: Phaser.GameObjects.Container): void {
  const cape = scene.add.triangle(-3, 2, -15, 11, 5, -16, 13, 13, 0x9c62bd).setStrokeStyle(2, 0x352040);
  const face = scene.add.circle(2, -8, 6, 0xd6b1df);
  const blade = scene.add.rectangle(11, -1, 16, 2, 0xcce8e3).setRotation(-0.65);
  body.add([cape, face, blade]);
}

function drawBrute(scene: Phaser.Scene, body: Phaser.GameObjects.Container): void {
  const shell = scene.add.ellipse(0, -1, 35, 29, 0x7e5a3c).setStrokeStyle(3, 0x2d2019);
  const ridge = scene.add.rectangle(0, -3, 4, 22, 0xb48152);
  const hornLeft = scene.add.triangle(-10, -11, -7, 0, 0, -11, 4, 0, 0xd0bd8a);
  const hornRight = scene.add.triangle(10, -11, -4, 0, 0, -11, 7, 0, 0xd0bd8a);
  body.add([shell, ridge, hornLeft, hornRight]);
}

function drawWarden(scene: Phaser.Scene, body: Phaser.GameObjects.Container): void {
  const robe = scene.add.triangle(0, 1, -14, 15, 0, -17, 14, 15, 0x397f82).setStrokeStyle(2, 0x163b42);
  const mask = scene.add.rectangle(0, -10, 12, 12, 0xc0f1e8).setRotation(Math.PI / 4).setScale(0.8, 1.1).setStrokeStyle(2, 0x2a6268);
  const orb = scene.add.circle(11, -1, 4, 0x8df7dc).setStrokeStyle(1, 0xffffff);
  body.add([robe, mask, orb]);
  scene.tweens.add({ targets: orb, alpha: 0.35, duration: 550, yoyo: true, repeat: -1 });
}

function drawShade(scene: Phaser.Scene, body: Phaser.GameObjects.Container): void {
  const mist = scene.add.ellipse(0, 4, 30, 19, 0x4b306b, 0.5);
  const cloak = scene.add.triangle(0, 0, -13, 15, 0, -19, 13, 15, 0x68428b, 0.88)
    .setStrokeStyle(2, 0x21132f, 0.85);
  const face = scene.add.ellipse(1, -10, 12, 9, 0x25182f, 0.95);
  const eyes = scene.add.rectangle(2, -11, 7, 2, 0xd3a8ff, 0.95);
  body.add([mist, cloak, face, eyes]);
  scene.tweens.add({ targets: mist, alpha: 0.12, scaleX: 1.35, duration: 620, yoyo: true, repeat: -1 });
}

function drawBulwark(scene: Phaser.Scene, body: Phaser.GameObjects.Container): void {
  const torso = scene.add.ellipse(2, -1, 34, 30, 0x59666a).setStrokeStyle(3, 0x20292b);
  const shield = scene.add.polygon(-7, 0, [-11, -16, 8, -14, 12, 5, 0, 17, -12, 7], 0x507e88)
    .setStrokeStyle(3, 0xb6d6d6);
  const boss = scene.add.rectangle(0, -1, 7, 7, 0x9eeaf1).setRotation(Math.PI / 4).setStrokeStyle(1, 0xeaffff);
  const helm = scene.add.rectangle(8, -13, 17, 10, 0x869397).setStrokeStyle(2, 0x30393a);
  body.add([torso, helm, shield, boss]);
}

function drawShaman(scene: Phaser.Scene, body: Phaser.GameObjects.Container): void {
  const robe = scene.add.triangle(-2, 1, -14, 15, -2, -17, 14, 15, 0x3d8461).setStrokeStyle(2, 0x163728);
  const hood = scene.add.circle(-2, -10, 8, 0x67a779).setStrokeStyle(2, 0x214e38);
  const mask = scene.add.rectangle(-1, -10, 9, 8, 0xd7e8b8).setRotation(Math.PI / 4).setScale(0.75, 1);
  const staff = scene.add.rectangle(12, -1, 3, 31, 0x6b4c31).setRotation(0.08);
  const bloom = scene.add.circle(13, -17, 5, 0x8af0ad, 0.85).setStrokeStyle(2, 0xd6ffe1);
  body.add([robe, hood, mask, staff, bloom]);
  scene.tweens.add({ targets: bloom, alpha: 0.35, scale: 1.35, duration: 690, yoyo: true, repeat: -1 });
}

function drawTitan(scene: Phaser.Scene, body: Phaser.GameObjects.Container, tier: CampaignAct): void {
  const colors: Record<CampaignAct, readonly [number, number, number]> = {
    1: [0x4e5d63, 0x86a5a9, 0x8fe8ef],
    2: [0x54476c, 0x8871a6, 0xc7a2f5],
    3: [0x6b3d4b, 0xa45a65, 0xffa0a4],
  };
  const [dark, mid, glow] = colors[tier];
  const legs = scene.add.rectangle(0, 10, 28, 18, dark).setStrokeStyle(3, 0x201c26);
  const torso = scene.add.polygon(0, -6, [-22, 13, -18, -15, 0, -27, 18, -15, 22, 13], mid)
    .setStrokeStyle(3, dark);
  const shoulders = scene.add.rectangle(0, -10, 48, 10, dark).setStrokeStyle(2, mid);
  const core = scene.add.rectangle(0, -8, 12, 12, glow).setRotation(Math.PI / 4).setStrokeStyle(2, 0xffffff, 0.8);
  const horns = scene.add.graphics();
  horns.lineStyle(5, dark, 1).beginPath().moveTo(-11, -22).lineTo(-19, -35).lineTo(-10, -31).strokePath();
  horns.beginPath().moveTo(11, -22).lineTo(19, -35).lineTo(10, -31).strokePath();
  body.add([legs, torso, shoulders, horns, core]);
  scene.tweens.add({ targets: core, scale: 1.32, alpha: 0.55, duration: 560, yoyo: true, repeat: -1 });
}

function drawBoss(scene: Phaser.Scene, body: Phaser.GameObjects.Container, tier: CampaignAct): void {
  if (tier === 2) {
    const mantle = scene.add.triangle(0, 3, -25, 21, 0, -29, 25, 21, 0x4e547f).setStrokeStyle(3, 0x20203d);
    const mask = scene.add.rectangle(0, -14, 19, 19, 0x81c8d1).setRotation(Math.PI / 4).setScale(0.78, 1.12).setStrokeStyle(2, 0xd9ffff);
    const crown = scene.add.polygon(0, -31, [-15, 4, -10, -12, -3, -4, 2, -17, 7, -4, 14, -12, 15, 4], 0x9ae7ef)
      .setStrokeStyle(2, 0xe4ffff);
    const core = scene.add.circle(0, -13, 4, 0xf5ffff, 0.96);
    body.add([mantle, mask, crown, core]);
    scene.tweens.add({ targets: core, alpha: 0.35, scale: 1.5, duration: 500, yoyo: true, repeat: -1 });
    return;
  }
  if (tier === 3) {
    const wings = scene.add.ellipse(0, -2, 54, 31, 0x5f294d, 0.8).setStrokeStyle(3, 0x271326);
    const cloak = scene.add.triangle(0, 3, -23, 22, 0, -30, 23, 22, 0x8d344d).setStrokeStyle(3, 0x351523);
    const face = scene.add.circle(0, -15, 11, 0x35223b).setStrokeStyle(2, 0xc15974);
    const crown = scene.add.polygon(0, -31, [-15, 3, -11, -14, -4, -5, 1, -19, 6, -5, 13, -15, 15, 3], 0xdd536c)
      .setStrokeStyle(2, 0xffb0b6);
    const eyes = scene.add.rectangle(1, -15, 9, 3, 0xffc1b8);
    body.add([wings, cloak, face, crown, eyes]);
    scene.tweens.add({ targets: wings, scaleX: 1.08, alpha: 0.45, duration: 740, yoyo: true, repeat: -1 });
    return;
  }
  const cloak = scene.add.triangle(0, 3, -24, 21, 0, -27, 24, 21, 0x9a4f54).setStrokeStyle(3, 0x391d26);
  const face = scene.add.circle(0, -14, 11, 0xd6a36f).setStrokeStyle(2, 0x4d2924);
  const crown = scene.add.graphics();
  crown.fillStyle(0xf1c85a, 1).lineStyle(2, 0x6d4821, 1);
  crown.beginPath().moveTo(-13, -26).lineTo(-8, -40).lineTo(-2, -30).lineTo(4, -42).lineTo(10, -29).lineTo(13, -26).closePath().fillPath().strokePath();
  const eyes = scene.add.rectangle(1, -15, 8, 3, 0xffe9a3);
  body.add([cloak, face, crown, eyes]);
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
