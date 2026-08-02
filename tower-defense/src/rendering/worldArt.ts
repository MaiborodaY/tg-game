import Phaser from "phaser";
import { BUILD_PADS, GAME_HEIGHT, GAME_WIDTH, ROUTE_POINTS } from "../game/config.ts";
import { NORTHERN_PASS_ROUTE_VARIANTS } from "../game/northernPassContent.ts";
import type { CampaignAct, Point } from "../game/types.ts";
import {
  FOREST_GATE_LANDMARKS,
  createNorthernLandmarkLayout,
  createWorldDecorationLayout,
  getActVisualProfile,
  getWorldVisualTheme,
  type WorldDecorationLayout,
  type WorldVisualTheme,
} from "./worldThemes.ts";
import {
  createNorthernAtmosphere,
  drawBrokenCaravan,
  drawNorthernBridgeRails,
  drawNorthernCitadel,
  drawNorthernDecorations,
  drawNorthernEntrance,
  drawNorthernGroundDetails,
  drawNorthernIceBridgeUnderlay,
  drawNorthernMountainFrame,
  type NorthernAtmosphere,
} from "./northernWorldArt.ts";

export type WorldArt = Readonly<{
  themeId: WorldVisualTheme["id"];
  route: Phaser.GameObjects.Graphics;
  routeMarks: Phaser.GameObjects.Graphics;
  actVeil: Phaser.GameObjects.Rectangle;
  portalGlow: Phaser.GameObjects.Ellipse;
  portalCore: Phaser.GameObjects.Ellipse;
  gate: Phaser.GameObjects.Container;
  gateCrystal: Phaser.GameObjects.Rectangle;
  gateWard: Phaser.GameObjects.Arc;
  gateCrystalHomeColor: number;
  gateHomeX: number;
  northernAtmosphere: NorthernAtmosphere | null;
}>;

export type WorldDefinition = Readonly<{
  id?: string;
  width: number;
  height: number;
  route: readonly Point[];
  buildPads?: readonly Point[];
  heroAnchors?: readonly Point[];
}>;

const DEFAULT_WORLD: WorldDefinition = Object.freeze({
  id: "forest-gate",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  route: ROUTE_POINTS,
  buildPads: BUILD_PADS,
});

export function drawWorld(scene: Phaser.Scene, world: WorldDefinition = DEFAULT_WORLD): WorldArt {
  const { width, height, route } = world;
  const theme = getWorldVisualTheme(world.id);
  const reservedPoints = [...(world.buildPads ?? []), ...(world.heroAnchors ?? [])];
  const additionalRoutes = theme.id === "northern-pass-v3"
    ? Object.values(NORTHERN_PASS_ROUTE_VARIANTS).filter((candidate) => candidate !== route)
    : [];
  const layout = createWorldDecorationLayout(theme, route, width, height, reservedPoints, additionalRoutes);
  const northernLandmarks = theme.id === "northern-pass-v3"
    ? createNorthernLandmarkLayout(route, width, height, layout.clearings)
    : null;

  drawGround(scene, width, height, theme, layout);
  if (theme.id === "northern-pass-v3") {
    drawNorthernGroundDetails(scene, width, height, theme, layout);
    drawNorthernMountainFrame(scene, width, height, theme);
    if (northernLandmarks) drawNorthernIceBridgeUnderlay(scene, northernLandmarks.iceBridge, theme);
  } else {
    drawCanopyFrame(scene, width, height, theme);
  }
  const routeArt = drawRoute(scene, route, theme);
  if (theme.id === "northern-pass-v3" && northernLandmarks) {
    drawNorthernDecorations(scene, layout, theme, world.buildPads ?? []);
    drawNorthernBridgeRails(scene, northernLandmarks.iceBridge);
    drawBrokenCaravan(scene, northernLandmarks.caravan);
  } else {
    drawDecorations(scene, layout, theme);
    drawForestLandmarks(scene);
  }
  const entrance = theme.id === "northern-pass-v3"
    ? drawNorthernEntrance(scene, route[0], theme)
    : drawEntrance(scene, route[0], theme);
  const gate = theme.id === "northern-pass-v3"
    ? drawNorthernCitadel(scene, route[route.length - 1], height, theme)
    : drawGate(scene, route[route.length - 1], height, theme);
  const northernAtmosphere = theme.id === "northern-pass-v3"
    ? createNorthernAtmosphere(scene, width, height, layout)
    : null;
  const actVeil = scene.add.rectangle(width / 2, height / 2, width, height, 0x52366f, 0)
    .setDepth(-12)
    .setBlendMode(Phaser.BlendModes.ADD);

  const vignette = scene.add.graphics().setDepth(80).setScrollFactor(0);
  vignette.lineStyle(20, 0x04110f, 0.26).strokeRoundedRect(-6, -6, width + 12, height + 12, 30);
  vignette.lineStyle(2, theme.stoneLight, 0.13).strokeRoundedRect(2, 2, width - 4, height - 4, 24);
  vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
  return Object.freeze({
    themeId: theme.id,
    route: routeArt.route,
    routeMarks: routeArt.marks,
    actVeil,
    portalGlow: entrance.glow,
    portalCore: entrance.inner,
    gate: gate.container,
    gateCrystal: gate.crystal,
    gateWard: gate.ward,
    gateCrystalHomeColor: gate.crystalHomeColor,
    gateHomeX: gate.container.x,
    northernAtmosphere,
  });
}

export function setWorldAct(scene: Phaser.Scene, art: WorldArt, act: CampaignAct): void {
  const profile = getActVisualProfile(act, art.themeId);
  scene.tweens.killTweensOf(art.actVeil);
  art.actVeil.setFillStyle(profile.veil, 1);
  art.portalGlow.setFillStyle(profile.portal, 0.09).setStrokeStyle(3, profile.portal, 0.58);
  art.portalCore.setFillStyle(profile.portal, 0.38).setStrokeStyle(2, profile.bossAccent, 0.72);
  art.gateWard.setFillStyle(profile.gateWard, 0.1).setStrokeStyle(2, profile.gateWard, 0.34);
  scene.tweens.add({ targets: art.actVeil, alpha: profile.veilAlpha, duration: 850, ease: "Sine.InOut" });
  if (art.northernAtmosphere) {
    scene.tweens.add({
      targets: art.northernAtmosphere.snow,
      alpha: profile.snowAlpha,
      duration: 900,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: art.northernAtmosphere.aurora,
      alpha: profile.auroraAlpha,
      duration: 1_200,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: art.northernAtmosphere.storm,
      alpha: profile.stormAlpha,
      duration: 900,
      ease: "Sine.InOut",
    });
  }
}

export function setWorldRoute(art: WorldArt, points: readonly Point[]): void {
  drawRouteGraphics(art.route, art.routeMarks, points, getWorldVisualTheme(art.themeId));
}

function drawGround(
  scene: Phaser.Scene,
  width: number,
  height: number,
  theme: WorldVisualTheme,
  layout: WorldDecorationLayout,
): void {
  const ground = scene.add.graphics().setDepth(-40);
  ground.fillStyle(theme.ground, 1).fillRect(0, 0, width, height);
  ground.fillStyle(theme.groundDeep, 0.26);
  ground.fillEllipse(width * 0.13, height * 0.19, width * 0.74, height * 0.34);
  ground.fillEllipse(width * 0.9, height * 0.53, width * 0.66, height * 0.48);
  ground.fillEllipse(width * 0.22, height * 0.88, width * 0.76, height * 0.28);

  for (const clearing of layout.clearings) {
    const wide = 42 * clearing.scale;
    const tall = 24 * clearing.scale;
    ground.fillStyle(clearing.variant % 2 === 0 ? theme.groundLight : theme.moss, 0.09)
      .fillEllipse(clearing.x, clearing.y, wide, tall);
    ground.lineStyle(1, theme.groundLight, 0.08)
      .strokeEllipse(clearing.x, clearing.y, wide * 0.72, tall * 0.58);
  }
}

function drawCanopyFrame(scene: Phaser.Scene, width: number, height: number, theme: WorldVisualTheme): void {
  const canopy = scene.add.graphics().setDepth(-34);
  const positions = [
    { x: -9, y: 28, r: 38 }, { x: 10, y: 116, r: 28 }, { x: -8, y: 217, r: 34 },
    { x: 8, y: 325, r: 31 }, { x: -5, y: 445, r: 38 }, { x: 18, y: 548, r: 35 },
    { x: width + 8, y: 42, r: 34 }, { x: width - 7, y: 143, r: 30 }, { x: width + 9, y: 250, r: 39 },
    { x: width - 4, y: 365, r: 32 }, { x: width + 8, y: 478, r: 38 }, { x: width - 12, y: height + 4, r: 35 },
  ];
  for (const [index, position] of positions.entries()) {
    canopy.fillStyle(theme.groundDeep, 0.78).fillCircle(position.x, position.y, position.r);
    canopy.fillStyle(index % 2 === 0 ? theme.groundLight : theme.moss, 0.46)
      .fillCircle(position.x + (index % 2 ? -8 : 8), position.y - 8, position.r * 0.7);
    canopy.fillStyle(theme.leaf, 0.12).fillCircle(position.x - 8, position.y - 15, position.r * 0.3);
  }

  const light = scene.add.graphics().setDepth(-33).setBlendMode(Phaser.BlendModes.ADD);
  light.fillStyle(theme.groundLight, 0.055);
  light.fillTriangle(width * 0.2, 0, width * 0.45, 0, width * 0.3, height * 0.48);
  light.fillTriangle(width * 0.68, 0, width * 0.84, 0, width * 0.61, height * 0.62);
}

function drawRoute(
  scene: Phaser.Scene,
  points: readonly Point[],
  theme: WorldVisualTheme,
): Readonly<{ route: Phaser.GameObjects.Graphics; marks: Phaser.GameObjects.Graphics }> {
  const route = scene.add.graphics().setDepth(-18);
  const marks = scene.add.graphics().setDepth(-16);
  drawRouteGraphics(route, marks, points, theme);
  return Object.freeze({ route, marks });
}

function drawRouteGraphics(
  route: Phaser.GameObjects.Graphics,
  marks: Phaser.GameObjects.Graphics,
  points: readonly Point[],
  theme: WorldVisualTheme,
): void {
  route.clear();
  marks.clear();
  if (points.length < 2) return;
  const [shadowWidth, bankWidth, edgeWidth, bedWidth, lightWidth] = theme.routeWidths;
  drawRouteLayer(route, points, shadowWidth, theme.routeShadow, 0.58);
  drawRouteLayer(route, points, bankWidth, theme.routeBank, 1);
  drawRouteLayer(route, points, edgeWidth, theme.routeEdge, 1);
  drawRouteLayer(route, points, bedWidth, theme.routeBed, 1);
  drawRouteLayer(route, points, lightWidth, theme.routeLight, 0.66);

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) continue;
    const normalX = -dy / length;
    const normalY = dx / length;
    const steps = Math.max(1, Math.floor(length / 28));
    for (let step = 1; step < steps; step += 1) {
      const ratio = step / steps;
      const x = start.x + dx * ratio;
      const y = start.y + dy * ratio;
      const side = (step + index) % 2 === 0 ? -1 : 1;
      marks.fillStyle(theme.routeBank, 0.32).fillEllipse(
        x + normalX * side * 6,
        y + normalY * side * 6,
        4.5,
        2.2,
      );
      if ((step + index) % 3 === 0) {
        const edge = side * 24;
        marks.fillStyle(theme.stoneDark, 0.76).fillCircle(x + normalX * edge, y + normalY * edge, 3.1);
        marks.fillStyle(theme.stoneLight, 0.5).fillCircle(x + normalX * edge - 0.8, y + normalY * edge - 0.8, 1.5);
      }
    }
  }
}

function drawRouteLayer(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly Point[],
  width: number,
  color: number,
  alpha: number,
): void {
  graphics.lineStyle(width, color, alpha).beginPath().moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) graphics.lineTo(points[index].x, points[index].y);
  graphics.strokePath();
  graphics.fillStyle(color, alpha);
  for (const point of points) graphics.fillCircle(point.x, point.y, width / 2);
}

function drawDecorations(scene: Phaser.Scene, layout: WorldDecorationLayout, theme: WorldVisualTheme): void {
  const details = scene.add.graphics().setDepth(-20);
  for (const point of layout.groundDetails) {
    if (point.variant === 0) {
      details.fillStyle(theme.stoneDark, 0.62).fillEllipse(point.x, point.y, 5 * point.scale, 3 * point.scale);
      details.fillStyle(theme.stoneLight, 0.36).fillCircle(point.x - 1, point.y - 0.8, 1.2 * point.scale);
    } else {
      const rotation = point.variant * 0.7;
      const dx = Math.cos(rotation) * 3.2 * point.scale;
      const dy = Math.sin(rotation) * 3.2 * point.scale;
      details.lineStyle(1, theme.leaf, 0.42).lineBetween(point.x - dx, point.y - dy, point.x + dx, point.y + dy);
      details.fillStyle(theme.leaf, 0.42).fillEllipse(point.x - dx, point.y - dy, 4 * point.scale, 2 * point.scale);
    }
  }

  for (const shrub of layout.shrubs) {
    const radius = 3.5 * shrub.scale;
    details.fillStyle(theme.groundDeep, 0.52).fillCircle(shrub.x + 1, shrub.y + 2, radius + 2);
    details.fillStyle(theme.moss, 0.76).fillCircle(shrub.x - radius * 0.55, shrub.y, radius);
    details.fillStyle(theme.groundLight, 0.72).fillCircle(shrub.x + radius * 0.45, shrub.y - 1, radius * 0.9);
    if (shrub.variant === 0) details.fillStyle(theme.flower, 0.78).fillCircle(shrub.x, shrub.y - radius, 1.25);
  }

  const trees = scene.add.graphics().setDepth(-15);
  for (const tree of layout.trees) drawTree(trees, tree, theme);

  for (const fireflyPoint of layout.fireflies) {
    const firefly = scene.add.circle(fireflyPoint.x, fireflyPoint.y, 1.4, theme.flower, 0.2)
      .setDepth(-14)
      .setBlendMode(Phaser.BlendModes.ADD);
    const driftX = fireflyPoint.variant % 2 === 0 ? 14 : -14;
    const driftY = fireflyPoint.variant < 2 ? -10 : 10;
    scene.tweens.add({
      targets: firefly,
      x: firefly.x + driftX,
      y: firefly.y + driftY,
      alpha: 0.82,
      duration: 1_900 + fireflyPoint.variant * 240,
      delay: fireflyPoint.y % 760,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }
}

function drawTree(
  graphics: Phaser.GameObjects.Graphics,
  tree: Readonly<{ x: number; y: number; scale: number; variant: number }>,
  theme: WorldVisualTheme,
): void {
  const { x, y, scale, variant } = tree;
  graphics.fillStyle(0x4c3528, 0.92).fillRoundedRect(x - 4 * scale, y - 2 * scale, 8 * scale, 24 * scale, 3 * scale);
  graphics.fillStyle(theme.groundDeep, 0.95).fillCircle(x, y - 8 * scale, (18 + variant) * scale);
  graphics.fillStyle(theme.moss, 0.9).fillCircle(x - 6 * scale, y - 12 * scale, 13 * scale);
  graphics.fillStyle(theme.groundLight, 0.82).fillCircle(x + 7 * scale, y - 9 * scale, 11 * scale);
  graphics.fillStyle(theme.leaf, 0.26).fillCircle(x - 9 * scale, y - 17 * scale, 5 * scale);
}

function drawForestLandmarks(scene: Phaser.Scene): void {
  const landmarks = scene.add.graphics().setDepth(-15);
  const fallenLog = FOREST_GATE_LANDMARKS[0];
  const mushroomRing = FOREST_GATE_LANDMARKS[1];
  landmarks.fillStyle(0x071815, 0.46).fillEllipse(fallenLog.x, fallenLog.y, 61, 18);
  landmarks.fillStyle(0x503a29, 1).fillRoundedRect(fallenLog.x - 24, fallenLog.y - 11, 48, 13, 6);
  landmarks.lineStyle(2, 0x836345, 0.72).strokeRoundedRect(fallenLog.x - 24, fallenLog.y - 11, 48, 13, 6);
  landmarks.fillStyle(0x315f43, 0.88)
    .fillCircle(fallenLog.x - 15, fallenLog.y - 11, 5)
    .fillCircle(fallenLog.x + 13, fallenLog.y - 10, 4);
  landmarks.lineStyle(2, 0x315f43, 0.76)
    .beginPath()
    .moveTo(fallenLog.x - 21, fallenLog.y)
    .lineTo(fallenLog.x - 29, fallenLog.y + 8)
    .lineTo(fallenLog.x - 35, fallenLog.y + 7)
    .strokePath();

  landmarks.fillStyle(0x402c23, 0.84).fillEllipse(mushroomRing.x, mushroomRing.y, 34, 12);
  for (let index = 0; index < 5; index += 1) {
    const angle = (Math.PI * 2 * index) / 5;
    const x = mushroomRing.x + Math.cos(angle) * 14;
    const y = mushroomRing.y + Math.sin(angle) * 8;
    landmarks.fillStyle(0xe9cf82, 0.88).fillCircle(x, y, 2.4);
    landmarks.fillStyle(index % 2 === 0 ? 0xb8564f : 0x6fbf8f, 0.9).fillCircle(x, y - 2.2, 3.2);
  }
}

function drawEntrance(
  scene: Phaser.Scene,
  entrance: Point,
  theme: WorldVisualTheme,
): Readonly<{
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Ellipse;
  inner: Phaser.GameObjects.Ellipse;
}> {
  const x = Math.max(11, entrance.x + 35);
  const portal = scene.add.container(x, entrance.y).setDepth(40);
  const shadow = scene.add.ellipse(0, 17, 54, 17, theme.groundDeep, 0.56);
  const glow = scene.add.ellipse(0, -1, 49, 58, theme.portal, 0.08).setStrokeStyle(3, theme.portal, 0.52);
  const inner = scene.add.ellipse(0, 0, 27, 39, 0x38234f, 0.88).setStrokeStyle(2, 0xe4c2ff, 0.72);
  const arch = scene.add.graphics();
  arch.lineStyle(9, theme.stoneDark, 1).beginPath().arc(0, 2, 22, Math.PI * 0.88, Math.PI * 2.12).strokePath();
  arch.lineStyle(2, theme.stoneLight, 0.82).beginPath().arc(0, 2, 23, Math.PI * 0.9, Math.PI * 2.1).strokePath();
  arch.fillStyle(theme.stoneDark, 1).fillRoundedRect(-25, 4, 10, 28, 3).fillRoundedRect(15, 4, 10, 28, 3);
  arch.lineStyle(2, theme.moss, 0.9)
    .beginPath().moveTo(-23, -5).lineTo(-28, 7).lineTo(-24, 20).strokePath()
    .beginPath().moveTo(20, -8).lineTo(27, 4).lineTo(23, 16).strokePath();
  const rune = scene.add.text(0, -23, "✦", {
    color: "#ead2ff",
    fontFamily: "Georgia, serif",
    fontSize: "10px",
  }).setOrigin(0.5).setAlpha(0.82);
  portal.add([shadow, glow, inner, arch, rune]);
  scene.tweens.add({ targets: [glow, inner], scale: 1.08, alpha: "+=0.08", duration: 1_350, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  return Object.freeze({ container: portal, glow, inner });
}

function drawGate(
  scene: Phaser.Scene,
  exit: Point,
  height: number,
  theme: WorldVisualTheme,
): Readonly<{
  container: Phaser.GameObjects.Container;
  crystal: Phaser.GameObjects.Rectangle;
  ward: Phaser.GameObjects.Arc;
  crystalHomeColor: number;
}> {
  const gate = scene.add.container(exit.x, Math.min(height - 25, exit.y + 17)).setDepth(600);
  const shadow = scene.add.ellipse(0, 18, 84, 25, theme.groundDeep, 0.56);
  const crystalGlow = scene.add.circle(0, -26, 19, theme.crystal, 0.11).setStrokeStyle(2, theme.crystal, 0.28);
  const doors = scene.add.rectangle(0, 8, 31, 36, 0x68462e).setStrokeStyle(2, 0x281b15);
  const doorLine = scene.add.rectangle(0, 8, 2, 34, 0x2c2018, 0.86);
  const left = scene.add.rectangle(-25, 1, 18, 50, theme.stoneDark).setStrokeStyle(3, theme.stoneLight, 0.9);
  const right = scene.add.rectangle(25, 1, 18, 50, theme.stoneDark).setStrokeStyle(3, theme.stoneLight, 0.9);
  const arch = scene.add.graphics();
  arch.fillStyle(theme.stoneDark, 1).fillRoundedRect(-36, -31, 72, 17, 5);
  arch.lineStyle(3, theme.stoneLight, 0.86).strokeRoundedRect(-36, -31, 72, 17, 5);
  arch.fillStyle(0x493528, 1).fillTriangle(-42, -28, 0, -47, 42, -28);
  arch.lineStyle(3, 0x8b6844, 0.82)
    .beginPath().moveTo(-42, -28).lineTo(0, -47).lineTo(42, -28).strokePath();
  const roots = scene.add.graphics();
  roots.lineStyle(5, 0x4e3928, 0.96)
    .beginPath().moveTo(-30, 13).lineTo(-43, 22).lineTo(-54, 20).strokePath()
    .beginPath().moveTo(30, 13).lineTo(43, 22).lineTo(55, 18).strokePath();
  roots.lineStyle(2, theme.moss, 0.86)
    .beginPath().moveTo(-31, -30).lineTo(-37, -16).lineTo(-32, 3).strokePath()
    .beginPath().moveTo(29, -31).lineTo(37, -14).lineTo(31, 7).strokePath();
  const leftLamp = scene.add.circle(-29, -17, 3.2, theme.flower, 0.88).setStrokeStyle(2, 0x5a432b, 1);
  const rightLamp = scene.add.circle(29, -17, 3.2, theme.flower, 0.88).setStrokeStyle(2, 0x5a432b, 1);
  const crystal = scene.add.rectangle(0, -29, 13, 13, theme.crystal)
    .setRotation(Math.PI / 4)
    .setStrokeStyle(2, 0xd9fff3);
  gate.add([shadow, roots, doors, doorLine, left, right, arch, crystalGlow, leftLamp, rightLamp, crystal]);
  scene.tweens.add({ targets: [crystalGlow, crystal], alpha: 0.58, duration: 1_050, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  return Object.freeze({ container: gate, crystal, ward: crystalGlow, crystalHomeColor: theme.crystal });
}
