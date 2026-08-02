import Phaser from "phaser";
import { getPointAtDistance, type PathMetrics } from "../game/pathing.ts";
import type { NorthernStormSectorId } from "../game/types.ts";
import {
  getNorthernStormVisualProfile,
  type NorthernStormVisualState,
} from "./northernStormVisuals.ts";

export type NorthernStormSectorArt = Readonly<{
  id: NorthernStormSectorId;
  route: Phaser.GameObjects.Graphics;
  badge: Phaser.GameObjects.Arc;
  status: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  points: readonly Readonly<{ x: number; y: number }>[];
}>;

export function createNorthernStormSectorArt(
  scene: Phaser.Scene,
  path: PathMetrics,
  sector: Readonly<{ id: NorthernStormSectorId; startRatio: number; endRatio: number }>,
  index: number,
): NorthernStormSectorArt {
  const points = sampleSectorPoints(path, sector.startRatio, sector.endRatio);
  const midpoint = points[Math.floor(points.length / 2)];
  const route = scene.add.graphics().setDepth(-13);
  const badge = scene.add.circle(midpoint.x, midpoint.y, 11, 0x354b55, 0.5)
    .setStrokeStyle(1.5, 0xa9c2ca, 0.22)
    .setDepth(-8);
  const status = scene.add.graphics().setPosition(midpoint.x, midpoint.y).setDepth(-7);
  const label = scene.add.text(midpoint.x, midpoint.y, String(index + 1), {
    color: "#b5cbd1",
    fontFamily: "Arial, sans-serif",
    fontSize: "8px",
    fontStyle: "bold",
  }).setOrigin(0.5).setDepth(-6);
  const art = Object.freeze({ id: sector.id, route, badge, status, label, points: Object.freeze(points) });
  setNorthernStormSectorState(art, "calm");
  scene.tweens.add({
    targets: [badge, status, label],
    scaleX: 1.07,
    scaleY: 1.07,
    duration: 1_150 + index * 130,
    yoyo: true,
    repeat: -1,
    ease: "Sine.InOut",
  });
  return art;
}

export function setNorthernStormSectorState(
  art: NorthernStormSectorArt,
  state: NorthernStormVisualState,
): void {
  if (art.badge.getData("stormState") === state) return;
  art.badge.setData("stormState", state);
  const profile = getNorthernStormVisualProfile(state);
  art.route.clear();
  drawPolyline(art.route, art.points, 15, profile.edge, profile.edgeAlpha);
  drawPolyline(art.route, art.points, 8, profile.route, profile.routeAlpha);
  art.badge
    .setFillStyle(profile.badge, profile.badgeAlpha)
    .setStrokeStyle(state === "calm" ? 1.5 : 2, profile.edge, profile.edgeAlpha + 0.18);
  art.label.setColor(profile.label).setVisible(state === "calm");
  art.status.clear();
  if (state === "threatened") drawThreatenedMark(art.status, profile.edge);
  if (state === "protected") drawProtectedMark(art.status, profile.edge);
}

function sampleSectorPoints(path: PathMetrics, startRatio: number, endRatio: number) {
  const start = path.totalLength * Math.min(1, Math.max(0, startRatio));
  const end = path.totalLength * Math.min(1, Math.max(startRatio, endRatio));
  const steps = Math.max(3, Math.ceil((end - start) / 18));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const distance = start + ((end - start) * index) / steps;
    return getPointAtDistance(path, distance);
  });
}

function drawPolyline(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly Readonly<{ x: number; y: number }>[],
  width: number,
  color: number,
  alpha: number,
): void {
  graphics.lineStyle(width, color, alpha).beginPath().moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) graphics.lineTo(points[index].x, points[index].y);
  graphics.strokePath();
}

function drawThreatenedMark(graphics: Phaser.GameObjects.Graphics, color: number): void {
  graphics.lineStyle(1.5, color, 0.96)
    .lineBetween(-5, -5, 5, 5)
    .lineBetween(-5, 5, 5, -5)
    .lineBetween(0, -7, 0, 7)
    .lineBetween(-7, 0, 7, 0);
}

function drawProtectedMark(graphics: Phaser.GameObjects.Graphics, color: number): void {
  graphics.fillStyle(color, 0.94).lineStyle(1, 0xfff3b5, 0.92);
  graphics.beginPath()
    .moveTo(0, -7)
    .lineTo(6, -4)
    .lineTo(5, 3)
    .lineTo(0, 7)
    .lineTo(-5, 3)
    .lineTo(-6, -4)
    .closePath()
    .fillPath()
    .strokePath();
}
