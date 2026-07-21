import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, ROUTE_POINTS } from "../game/config.ts";
import type { EnemyType, Point, TowerType } from "../game/types.ts";

export type TowerArt = Readonly<{
  container: Phaser.GameObjects.Container;
  head: Phaser.GameObjects.Container;
  aura?: Phaser.GameObjects.Arc;
}>;

export type EnemyArt = Readonly<{
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  healthFill: Phaser.GameObjects.Rectangle;
  statusRing: Phaser.GameObjects.Arc;
}>;

export function drawWorld(scene: Phaser.Scene): void {
  const background = scene.add.graphics().setDepth(-30);
  background.fillStyle(0x102a27, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  for (let band = 0; band < 16; band += 1) {
    const color = band % 2 === 0 ? 0x173a30 : 0x15342d;
    background.fillStyle(color, 0.54).fillRect(0, band * 36, GAME_WIDTH, 38);
  }

  drawRoute(scene);
  drawDecorations(scene);
  drawEntrance(scene);
  drawGate(scene);

  const vignette = scene.add.graphics().setDepth(80).setScrollFactor(0);
  vignette.lineStyle(18, 0x071310, 0.2).strokeRoundedRect(-5, -5, GAME_WIDTH + 10, GAME_HEIGHT + 10, 28);
  vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
}

export function createTowerArt(
  scene: Phaser.Scene,
  type: TowerType,
  level: 1 | 2 | 3,
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
  container.add([shadow, base, head]);
  if (aura) container.addAt(aura, 2);
  return Object.freeze({ container, head, aura });
}

export function createEnemyArt(scene: Phaser.Scene, type: EnemyType, point: Point): EnemyArt {
  const container = scene.add.container(point.x, point.y).setDepth(point.y + 30);
  const body = scene.add.container(0, 0);
  const shadow = scene.add.ellipse(0, 8, type === "boss" ? 43 : 28, type === "boss" ? 16 : 11, 0x06100e, 0.42);
  body.add(shadow);
  if (type === "raider") drawRaider(scene, body);
  if (type === "swift") drawSwift(scene, body);
  if (type === "brute") drawBrute(scene, body);
  if (type === "warden") drawWarden(scene, body);
  if (type === "boss") drawBoss(scene, body);

  const barWidth = type === "boss" ? 52 : 30;
  const barY = type === "boss" ? -34 : -25;
  const healthBack = scene.add.rectangle(0, barY, barWidth + 4, 6, 0x07110f, 0.9).setOrigin(0.5);
  const healthFill = scene.add.rectangle(-barWidth / 2, barY, barWidth, 3, type === "boss" ? 0xf4bf56 : 0x77e6a5)
    .setOrigin(0, 0.5);
  const statusRing = scene.add.circle(0, 1, type === "boss" ? 27 : 19, 0x74dff2, 0)
    .setStrokeStyle(2, 0x74dff2, 0)
    .setDepth(-1);
  container.add([statusRing, body, healthBack, healthFill]);
  return Object.freeze({ container, body, healthFill, statusRing });
}

export function createHitBurst(scene: Phaser.Scene, x: number, y: number, color: number, radius = 18): void {
  const ring = scene.add.circle(x, y, 5, color, 0).setStrokeStyle(3, color, 0.9).setDepth(1_000);
  scene.tweens.add({
    targets: ring,
    radius,
    alpha: 0,
    duration: 240,
    ease: "Quad.Out",
    onComplete: () => ring.destroy(),
  });
  for (let index = 0; index < 5; index += 1) {
    const angle = (Math.PI * 2 * index) / 5 + Math.random() * 0.5;
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
}

function drawEntrance(scene: Phaser.Scene): void {
  const portal = scene.add.container(8, 52).setDepth(40);
  const glow = scene.add.circle(0, 0, 24, 0xb46cff, 0.08).setStrokeStyle(3, 0xb987ff, 0.65);
  const inner = scene.add.circle(0, 0, 13, 0x58317a, 0.8).setStrokeStyle(2, 0xe4bdff, 0.8);
  portal.add([glow, inner]);
  scene.tweens.add({ targets: glow, scale: 1.25, alpha: 0.18, duration: 1_200, yoyo: true, repeat: -1 });
}

function drawGate(scene: Phaser.Scene): void {
  const gate = scene.add.container(162, 535).setDepth(600);
  const shadow = scene.add.ellipse(0, 17, 72, 24, 0x07110f, 0.45);
  const left = scene.add.rectangle(-23, 1, 18, 48, 0x31423e).setStrokeStyle(3, 0x809080);
  const right = scene.add.rectangle(23, 1, 18, 48, 0x31423e).setStrokeStyle(3, 0x809080);
  const arch = scene.add.rectangle(0, -20, 61, 15, 0x3c5049).setStrokeStyle(3, 0x8ea08f);
  const crystal = scene.add.rectangle(0, -23, 12, 12, 0x72e6c2).setRotation(Math.PI / 4).setStrokeStyle(2, 0xd6fff1);
  const doors = scene.add.rectangle(0, 8, 28, 34, 0x6f4a2d).setStrokeStyle(2, 0x261b15);
  gate.add([shadow, doors, left, right, arch, crystal]);
  scene.tweens.add({ targets: crystal, alpha: 0.55, duration: 950, yoyo: true, repeat: -1 });
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

function drawBoss(scene: Phaser.Scene, body: Phaser.GameObjects.Container): void {
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
