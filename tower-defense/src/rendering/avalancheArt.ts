import Phaser from "phaser";
import type { CampaignAct, Point } from "../game/types.ts";
import {
  getAvalancheActVisualProfile,
  getAvalancheZoneVisualProfile,
  type AvalancheZoneState,
} from "./avalancheVisuals.ts";

export {
  getAvalancheActVisualProfile,
  getAvalancheZoneVisualProfile,
  sampleAvalancheRouteSegment,
  selectAvalancheMarkerPoint,
  type AvalancheActVisualProfile,
  type AvalancheZoneState,
  type AvalancheZoneVisualProfile,
} from "./avalancheVisuals.ts";

export const AVALANCHE_ZONE_HIT_SIZE = 78;

export type AvalancheZoneArt = Readonly<{
  container: Phaser.GameObjects.Container;
  footprint: Phaser.GameObjects.Ellipse;
  pulse: Phaser.GameObjects.Ellipse;
  shelf: Phaser.GameObjects.Graphics;
  marker: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Graphics;
  index: Phaser.GameObjects.Text;
  rubble: Phaser.GameObjects.Graphics;
}>;

export function createAvalancheZoneArt(
  scene: Phaser.Scene,
  point: Point,
  index: number,
  act: CampaignAct,
): AvalancheZoneArt {
  const footprint = scene.add.ellipse(0, 8, 64, 42, 0x153f4c, 0.56)
    .setStrokeStyle(2, 0x8ee9f1, 0.88);
  const pulse = scene.add.ellipse(0, 8, 72, 50, 0x000000, 0)
    .setStrokeStyle(2, 0x8ee9f1, 0.24);
  const shelf = scene.add.graphics();
  const marker = scene.add.circle(0, -8, 17, 0x2e8492, 0.94)
    .setStrokeStyle(2, 0x8ee9f1, 0.88);
  const icon = scene.add.graphics();
  const label = scene.add.text(0, -8, String(index + 1), {
    color: "#e8fdff",
    fontFamily: "Arial, sans-serif",
    fontSize: "10px",
    fontStyle: "bold",
  }).setOrigin(0.5);
  const rubble = scene.add.graphics();
  const container = scene.add.container(point.x, point.y, [footprint, pulse, shelf, marker, icon, label, rubble])
    .setDepth(-7);
  const art = Object.freeze({ container, footprint, pulse, shelf, marker, icon, index: label, rubble });

  drawAvalancheShelf(art, act);
  setAvalancheZoneState(art, "available");
  scene.tweens.add({
    targets: pulse,
    scaleX: 1.13,
    scaleY: 1.13,
    alpha: 0.04,
    duration: 920 + index * 110,
    yoyo: true,
    repeat: -1,
    ease: "Sine.InOut",
  });
  return art;
}

export function setAvalancheZoneState(art: AvalancheZoneArt, state: AvalancheZoneState): void {
  if (art.container.getData("avalancheZoneState") === state) return;
  art.container.setData("avalancheZoneState", state);
  const profile = getAvalancheZoneVisualProfile(state);
  art.footprint
    .setFillStyle(profile.footprint, profile.footprintAlpha)
    .setStrokeStyle(state === "armed" ? 3 : 2, profile.rim, profile.rimAlpha);
  art.pulse.setStrokeStyle(state === "armed" ? 3 : 2, profile.rim, profile.pulseAlpha).setAlpha(1);
  art.marker
    .setFillStyle(profile.marker, profile.markerAlpha)
    .setStrokeStyle(state === "armed" ? 2.5 : 2, profile.rim, profile.rimAlpha);
  art.index.setColor(toCssColor(profile.icon)).setAlpha(profile.iconAlpha).setVisible(state !== "spent");
  art.icon.clear();
  if (state === "spent") drawSpentMark(art.icon, profile.icon, profile.iconAlpha);
  else drawAvalancheChevrons(art.icon, profile.icon, profile.iconAlpha);
  art.rubble.setAlpha(profile.rubbleAlpha);
}

export function setAvalancheZoneAct(art: AvalancheZoneArt, act: CampaignAct): void {
  if (art.container.getData("avalancheAct") === act) return;
  art.container.setData("avalancheAct", act);
  drawAvalancheShelf(art, act);
}

export function playAvalancheCollapse(scene: Phaser.Scene, art: AvalancheZoneArt): void {
  const burst = scene.add.container(art.container.x, art.container.y).setDepth(28);
  const fragments = Array.from({ length: 12 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 12 + (index % 2) * 0.13;
    const snow = index % 3 !== 0;
    const fragment = snow
      ? scene.add.circle(0, 0, 2.2 + (index % 2), 0xe3f7f6, 0.92)
      : scene.add.rectangle(0, 0, 5, 3, 0x40555d, 0.94).setRotation(angle);
    fragment.setData("targetX", Math.cos(angle) * (30 + (index % 4) * 5));
    fragment.setData("targetY", Math.sin(angle) * 16 + 12 + (index % 3) * 4);
    burst.add(fragment);
    return fragment;
  });
  const shock = scene.add.ellipse(art.container.x, art.container.y + 8, 42, 20, 0x000000, 0)
    .setStrokeStyle(3, 0xdaf8f7, 0.82)
    .setDepth(27);

  fragments.forEach((fragment, index) => {
    scene.tweens.add({
      targets: fragment,
      x: fragment.getData("targetX") as number,
      y: fragment.getData("targetY") as number,
      alpha: 0,
      angle: index % 2 ? 80 : -80,
      duration: 360 + index * 14,
      ease: "Cubic.Out",
    });
  });
  scene.tweens.add({
    targets: shock,
    scaleX: 1.7,
    scaleY: 1.7,
    alpha: 0,
    duration: 420,
    ease: "Cubic.Out",
    onComplete: () => {
      shock.destroy();
      burst.destroy(true);
    },
  });
}

function drawAvalancheShelf(art: AvalancheZoneArt, act: CampaignAct): void {
  const profile = getAvalancheActVisualProfile(act);
  art.shelf.clear();
  art.shelf.fillStyle(profile.route, profile.routeAlpha)
    .fillRoundedRect(-30, -1, 60, 19, 8);
  art.shelf.lineStyle(2, profile.snow, 0.72)
    .beginPath()
    .moveTo(-27, 1)
    .lineTo(-17, -4)
    .lineTo(-6, 0)
    .lineTo(4, -5)
    .lineTo(15, 0)
    .lineTo(27, -3)
    .strokePath();
  art.shelf.lineStyle(act === 1 ? 1 : 1.5, profile.crack, act === 1 ? 0.28 : 0.68)
    .lineBetween(-13, 4, -6, 11)
    .lineBetween(-6, 11, -9, 16)
    .lineBetween(12, 3, 7, 10)
    .lineBetween(7, 10, 11, 16);
  art.rubble.clear();
  for (let index = 0; index < 7; index += 1) {
    const x = -23 + index * 8;
    const y = 14 + (index % 2) * 3;
    art.rubble.fillStyle(index % 2 ? profile.crack : profile.snow, index % 2 ? 0.82 : 0.66)
      .fillTriangle(x - 4, y + 3, x, y - 3, x + 4, y + 3);
  }
}

function drawAvalancheChevrons(graphics: Phaser.GameObjects.Graphics, color: number, alpha: number): void {
  graphics.lineStyle(2.5, color, alpha)
    .beginPath()
    .moveTo(-7, -15)
    .lineTo(0, -9)
    .lineTo(7, -15)
    .strokePath()
    .beginPath()
    .moveTo(-7, -9)
    .lineTo(0, -3)
    .lineTo(7, -9)
    .strokePath();
}

function drawSpentMark(graphics: Phaser.GameObjects.Graphics, color: number, alpha: number): void {
  graphics.lineStyle(2.5, color, alpha)
    .lineBetween(-6, -14, 6, -2)
    .lineBetween(-6, -2, 6, -14);
}

function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}
