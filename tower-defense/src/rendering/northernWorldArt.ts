import Phaser from "phaser";
import type { Point } from "../game/types.ts";
import type {
  NorthernLandmarkLayout,
  WorldDecorationLayout,
  WorldVisualTheme,
} from "./worldThemes.ts";

export type NorthernAtmosphere = Readonly<{
  snow: readonly Phaser.GameObjects.Ellipse[];
  aurora: Phaser.GameObjects.Graphics;
  storm: Phaser.GameObjects.Rectangle;
}>;

export type NorthernEntranceArt = Readonly<{
  glow: Phaser.GameObjects.Ellipse;
  inner: Phaser.GameObjects.Ellipse;
}>;

export type NorthernGateArt = Readonly<{
  container: Phaser.GameObjects.Container;
  crystal: Phaser.GameObjects.Rectangle;
  ward: Phaser.GameObjects.Arc;
  crystalHomeColor: number;
}>;

export function drawNorthernGroundDetails(
  scene: Phaser.Scene,
  width: number,
  height: number,
  theme: WorldVisualTheme,
  layout: WorldDecorationLayout,
): void {
  const snow = scene.add.graphics().setDepth(-38);
  for (const clearing of layout.clearings) {
    const wide = 48 * clearing.scale;
    const tall = 19 * clearing.scale;
    snow.fillStyle(0xcde5e8, 0.08 + (clearing.variant % 2) * 0.025)
      .fillEllipse(clearing.x, clearing.y, wide, tall);
    snow.lineStyle(1, 0xebffff, 0.1)
      .beginPath()
      .arc(clearing.x, clearing.y - 1, wide * 0.36, Math.PI * 1.08, Math.PI * 1.88)
      .strokePath();
  }

  snow.lineStyle(1, theme.stoneLight, 0.1);
  for (let index = 0; index < 9; index += 1) {
    const x = 25 + ((index * 83) % Math.max(40, width - 50));
    const y = 54 + ((index * 137) % Math.max(80, height - 108));
    snow.beginPath()
      .moveTo(x - 8, y - 2)
      .lineTo(x, y + 3)
      .lineTo(x + 6, y - 1)
      .strokePath();
  }
}

export function drawNorthernMountainFrame(
  scene: Phaser.Scene,
  width: number,
  height: number,
  theme: WorldVisualTheme,
): void {
  const cliffs = scene.add.graphics().setDepth(-34);
  const ledges = [
    { x: -13, y: 64, radius: 47, side: 1 },
    { x: 2, y: 188, radius: 39, side: 1 },
    { x: -10, y: 326, radius: 51, side: 1 },
    { x: 5, y: 470, radius: 43, side: 1 },
    { x: width + 12, y: 88, radius: 44, side: -1 },
    { x: width - 3, y: 222, radius: 38, side: -1 },
    { x: width + 12, y: 368, radius: 51, side: -1 },
    { x: width - 4, y: height - 42, radius: 45, side: -1 },
  ] as const;

  for (const [index, ledge] of ledges.entries()) {
    cliffs.fillStyle(theme.groundDeep, 0.94).fillCircle(ledge.x, ledge.y, ledge.radius);
    cliffs.fillStyle(index % 2 === 0 ? theme.stoneDark : theme.groundLight, 0.88)
      .fillTriangle(
        ledge.x - ledge.side * ledge.radius * 0.7,
        ledge.y + ledge.radius * 0.7,
        ledge.x + ledge.side * ledge.radius * 0.78,
        ledge.y + ledge.radius * 0.38,
        ledge.x + ledge.side * ledge.radius * 0.13,
        ledge.y - ledge.radius * 0.82,
      );
    cliffs.fillStyle(0xd8eef0, 0.38)
      .fillTriangle(
        ledge.x + ledge.side * ledge.radius * 0.13,
        ledge.y - ledge.radius * 0.82,
        ledge.x - ledge.side * ledge.radius * 0.08,
        ledge.y - ledge.radius * 0.23,
        ledge.x + ledge.side * ledge.radius * 0.5,
        ledge.y - ledge.radius * 0.05,
      );
  }

  cliffs.fillStyle(0xbfdce2, 0.07)
    .fillTriangle(width * 0.08, 0, width * 0.35, 0, width * 0.21, height * 0.43)
    .fillTriangle(width * 0.7, 0, width * 0.96, 0, width * 0.84, height * 0.47);
}

export function drawNorthernIceBridgeUnderlay(
  scene: Phaser.Scene,
  bridge: NorthernLandmarkLayout["iceBridge"],
  theme: WorldVisualTheme,
): void {
  const container = scene.add.container(bridge.x, bridge.y).setRotation(bridge.rotation).setDepth(-25);
  const graphics = scene.add.graphics();
  const half = bridge.length / 2;
  graphics.fillStyle(0x040e16, 0.94).fillRoundedRect(-half - 10, -34, bridge.length + 20, 68, 18);
  graphics.fillStyle(0x163747, 0.76).fillRoundedRect(-half - 5, -27, bridge.length + 10, 54, 15);
  graphics.lineStyle(2, 0x68b8cc, 0.24).strokeRoundedRect(-half - 4, -26, bridge.length + 8, 52, 14);
  graphics.lineStyle(1, theme.crystal, 0.22)
    .beginPath().moveTo(-half + 4, -14).lineTo(-8, -5).lineTo(half - 7, -16).strokePath()
    .beginPath().moveTo(-half + 9, 15).lineTo(4, 5).lineTo(half - 10, 14).strokePath();
  container.add(graphics);
}

export function drawNorthernBridgeRails(
  scene: Phaser.Scene,
  bridge: NorthernLandmarkLayout["iceBridge"],
): void {
  const container = scene.add.container(bridge.x, bridge.y).setRotation(bridge.rotation).setDepth(-15);
  const rails = scene.add.graphics();
  const half = bridge.length / 2;
  rails.lineStyle(2, 0xa8c9d2, 0.58)
    .lineBetween(-half, -23, half, -23)
    .lineBetween(-half, 23, half, 23);
  for (const x of [-half, -half / 2, 0, half / 2, half]) {
    rails.lineStyle(2, 0x58717b, 0.86)
      .lineBetween(x, -28, x, -19)
      .lineBetween(x, 19, x, 28);
    rails.fillStyle(0xe4f6f7, 0.7).fillCircle(x, -28, 1.8).fillCircle(x, 28, 1.8);
  }
  container.add(rails);
}

export function drawNorthernDecorations(
  scene: Phaser.Scene,
  layout: WorldDecorationLayout,
  theme: WorldVisualTheme,
  buildPads: readonly Point[],
): void {
  const details = scene.add.graphics().setDepth(-20);
  for (const point of layout.groundDetails) {
    const radius = (2.6 + (point.variant % 3)) * point.scale;
    details.fillStyle(theme.groundDeep, 0.5).fillEllipse(point.x + 1, point.y + 2, radius * 2.3, radius * 1.2);
    details.fillStyle(point.variant % 2 === 0 ? theme.stoneDark : theme.groundLight, 0.82)
      .fillCircle(point.x, point.y, radius);
    details.fillStyle(0xdff7fa, 0.34)
      .fillEllipse(point.x - radius * 0.18, point.y - radius * 0.45, radius * 1.3, radius * 0.62);
  }

  for (const shrub of layout.shrubs) {
    const scale = shrub.scale;
    details.lineStyle(1.5, 0x70848b, 0.72)
      .lineBetween(shrub.x, shrub.y + 4 * scale, shrub.x, shrub.y - 5 * scale)
      .lineBetween(shrub.x, shrub.y - 1 * scale, shrub.x - 5 * scale, shrub.y - 7 * scale)
      .lineBetween(shrub.x, shrub.y - 2 * scale, shrub.x + 5 * scale, shrub.y - 8 * scale);
    details.fillStyle(0xd6edef, 0.48)
      .fillCircle(shrub.x - 5 * scale, shrub.y - 7 * scale, 1.8 * scale)
      .fillCircle(shrub.x + 5 * scale, shrub.y - 8 * scale, 1.8 * scale);
  }

  const conifers = scene.add.graphics().setDepth(-15);
  for (const tree of layout.trees) drawSnowPine(conifers, tree, theme);

  const padRunes = scene.add.graphics().setDepth(-13);
  for (const [index, pad] of buildPads.entries()) {
    const accent = index % 3 === 0 ? theme.crystal : theme.stoneLight;
    padRunes.lineStyle(1, accent, 0.14).strokeCircle(pad.x, pad.y, 24);
    padRunes.lineStyle(1, accent, 0.12)
      .lineBetween(pad.x - 17, pad.y, pad.x, pad.y - 12)
      .lineBetween(pad.x, pad.y - 12, pad.x + 17, pad.y)
      .lineBetween(pad.x + 17, pad.y, pad.x, pad.y + 12)
      .lineBetween(pad.x, pad.y + 12, pad.x - 17, pad.y);
  }
}

export function drawBrokenCaravan(
  scene: Phaser.Scene,
  caravan: NorthernLandmarkLayout["caravan"],
): void {
  const container = scene.add.container(caravan.x, caravan.y).setRotation(caravan.rotation).setDepth(-14);
  const art = scene.add.graphics();
  art.fillStyle(0x06141b, 0.48).fillEllipse(0, 8, 57, 16);
  art.fillStyle(0x574434, 0.96).fillRoundedRect(-18, -7, 31, 15, 3);
  art.lineStyle(2, 0x9b7a52, 0.7).strokeRoundedRect(-18, -7, 31, 15, 3);
  art.fillStyle(0x2d2520, 1).fillCircle(-14, 10, 8).fillCircle(12, 10, 8);
  art.lineStyle(2, 0x957758, 0.78).strokeCircle(-14, 10, 6).strokeCircle(12, 10, 6);
  art.lineStyle(2, 0x806249, 0.9)
    .lineBetween(13, 2, 29, -5)
    .lineBetween(28, -5, 37, 0);
  art.fillStyle(0xdceef0, 0.48).fillTriangle(-19, -7, 10, -7, 0, -13);
  art.fillStyle(0x405b67, 0.92).fillRoundedRect(18, 4, 10, 9, 2);
  art.lineStyle(1, 0xb8d7dd, 0.48).strokeRoundedRect(18, 4, 10, 9, 2);
  container.add(art);
}

export function createNorthernAtmosphere(
  scene: Phaser.Scene,
  width: number,
  height: number,
  layout: WorldDecorationLayout,
): NorthernAtmosphere {
  const aurora = scene.add.graphics().setDepth(-31).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
  aurora.fillStyle(0x6de6cf, 0.22)
    .fillEllipse(width * 0.34, 24, width * 0.82, 54)
    .fillEllipse(width * 0.73, 46, width * 0.64, 42);
  aurora.fillStyle(0x8ba8ff, 0.14).fillEllipse(width * 0.56, 31, width * 0.9, 31);
  scene.tweens.add({ targets: aurora, scaleX: 1.04, x: -7, duration: 3_800, yoyo: true, repeat: -1, ease: "Sine.InOut" });

  const storm = scene.add.rectangle(width / 2, height / 2, width, height, 0xd8f4ff, 1)
    .setDepth(-11)
    .setAlpha(0)
    .setBlendMode(Phaser.BlendModes.ADD);

  const snow = layout.fireflies.map((point, index) => {
    const flake = scene.add.ellipse(point.x, point.y, index % 3 === 0 ? 2.6 : 1.7, index % 3 === 0 ? 5.2 : 3.4, 0xf0feff, 1)
      .setRotation(-0.55)
      .setDepth(-10)
      .setAlpha(0);
    scene.tweens.add({
      targets: flake,
      x: flake.x + 32 + (index % 4) * 6,
      y: Math.min(height + 8, flake.y + 74 + (index % 3) * 12),
      duration: 2_400 + (index % 5) * 290,
      delay: (index * 173) % 820,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    return flake;
  });

  return Object.freeze({ snow: Object.freeze(snow), aurora, storm });
}

export function drawNorthernEntrance(
  scene: Phaser.Scene,
  entrance: Point,
  theme: WorldVisualTheme,
): NorthernEntranceArt {
  const x = Math.max(13, entrance.x + 36);
  const cave = scene.add.container(x, entrance.y).setDepth(40);
  const shadow = scene.add.ellipse(0, 19, 63, 18, theme.groundDeep, 0.72);
  const glow = scene.add.ellipse(0, -1, 51, 61, theme.portal, 0.08).setStrokeStyle(3, theme.portal, 0.5);
  const inner = scene.add.ellipse(0, 1, 29, 42, 0x071722, 0.98).setStrokeStyle(2, 0x91e6f2, 0.62);
  const ice = scene.add.graphics();
  ice.fillStyle(theme.stoneDark, 1)
    .fillTriangle(-33, 22, -22, -23, -7, -33)
    .fillTriangle(33, 22, 22, -23, 7, -33)
    .fillTriangle(-17, -23, 0, -42, 17, -23);
  ice.lineStyle(2, theme.stoneLight, 0.78)
    .lineBetween(-33, 22, -22, -23)
    .lineBetween(-22, -23, 0, -42)
    .lineBetween(0, -42, 22, -23)
    .lineBetween(22, -23, 33, 22);
  ice.fillStyle(0xdff8fa, 0.58)
    .fillTriangle(-24, -19, -16, -27, -7, -29)
    .fillTriangle(24, -19, 16, -27, 7, -29)
    .fillTriangle(-10, 23, -3, 23, -7, 37)
    .fillTriangle(9, 23, 15, 23, 12, 34);
  cave.add([shadow, glow, inner, ice]);
  scene.tweens.add({ targets: [glow, inner], scale: 1.06, alpha: "+=0.07", duration: 1_500, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  return Object.freeze({ glow, inner });
}

export function drawNorthernCitadel(
  scene: Phaser.Scene,
  exit: Point,
  height: number,
  theme: WorldVisualTheme,
): NorthernGateArt {
  const citadel = scene.add.container(exit.x, Math.min(height - 30, exit.y + 20)).setDepth(600);
  const shadow = scene.add.ellipse(0, 19, 96, 28, theme.groundDeep, 0.7);
  const ward = scene.add.circle(0, -37, 23, theme.crystal, 0.09).setStrokeStyle(2, theme.crystal, 0.31);
  const doors = scene.add.rectangle(0, 8, 34, 39, 0x3d3029).setStrokeStyle(2, 0x15191a);
  const leftTower = scene.add.rectangle(-30, -1, 23, 58, theme.stoneDark).setStrokeStyle(3, theme.stoneLight, 0.84);
  const rightTower = scene.add.rectangle(30, -1, 23, 58, theme.stoneDark).setStrokeStyle(3, theme.stoneLight, 0.84);
  const masonry = scene.add.graphics();
  masonry.fillStyle(theme.stoneDark, 1).fillRoundedRect(-43, -38, 86, 19, 4);
  masonry.lineStyle(3, theme.stoneLight, 0.8).strokeRoundedRect(-43, -38, 86, 19, 4);
  for (const x of [-38, -19, 0, 19, 38]) masonry.fillStyle(theme.stoneDark, 1).fillRect(x - 5, -48, 10, 13);
  masonry.fillStyle(0xd8edef, 0.5)
    .fillTriangle(-42, -38, -18, -38, -30, -47)
    .fillTriangle(18, -38, 42, -38, 30, -47);
  masonry.lineStyle(2, 0x6e8791, 0.7)
    .lineBetween(-42, 7, -49, 24)
    .lineBetween(42, 7, 49, 24);
  const crystal = scene.add.rectangle(0, -37, 14, 14, theme.crystal)
    .setRotation(Math.PI / 4)
    .setStrokeStyle(2, 0xe8ffff);
  const beaconStem = scene.add.rectangle(0, -59, 4, 23, 0x69828a, 1);
  const beaconGlow = scene.add.circle(0, -72, 13, 0x98efff, 0.1).setBlendMode(Phaser.BlendModes.ADD);
  const beacon = scene.add.graphics();
  beacon.fillStyle(0xb9f8ff, 0.92).fillTriangle(-4, -66, 0, -81, 5, -66);
  beacon.fillStyle(0xffffff, 0.82).fillTriangle(-2, -67, 0, -76, 2, -67);
  citadel.add([shadow, doors, leftTower, rightTower, masonry, ward, crystal, beaconStem, beaconGlow, beacon]);
  scene.tweens.add({ targets: [ward, crystal], alpha: 0.58, duration: 1_050, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  scene.tweens.add({ targets: beaconGlow, scale: 1.18, alpha: 0.3, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  return Object.freeze({ container: citadel, crystal, ward, crystalHomeColor: theme.crystal });
}

function drawSnowPine(
  graphics: Phaser.GameObjects.Graphics,
  tree: Readonly<{ x: number; y: number; scale: number; variant: number }>,
  theme: WorldVisualTheme,
): void {
  const { x, y, scale, variant } = tree;
  const height = (29 + variant * 2) * scale;
  graphics.fillStyle(0x3b302a, 0.96).fillRoundedRect(x - 2.5 * scale, y - 3 * scale, 5 * scale, 19 * scale, 2);
  graphics.fillStyle(theme.groundDeep, 0.98)
    .fillTriangle(x, y - height, x - 15 * scale, y + 2 * scale, x + 15 * scale, y + 2 * scale);
  graphics.fillStyle(theme.groundLight, 0.9)
    .fillTriangle(x, y - height + 6 * scale, x - 12 * scale, y - 2 * scale, x + 12 * scale, y - 2 * scale);
  graphics.fillStyle(0xd9edef, 0.48)
    .fillTriangle(x, y - height, x - 7 * scale, y - height + 12 * scale, x + 7 * scale, y - height + 12 * scale)
    .fillTriangle(x - 2 * scale, y - height + 11 * scale, x - 10 * scale, y - 5 * scale, x + 5 * scale, y - 5 * scale);
}
