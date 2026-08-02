import Phaser from "phaser";
import type { Point } from "../game/types.ts";
import {
  SIGNAL_FIRE_RADIUS,
  getSignalFireVisualProfile,
  type SignalFireState,
} from "./signalFireVisuals.ts";

export {
  SIGNAL_FIRE_RADIUS,
  getSignalFireVisualProfile,
  type SignalFireState,
  type SignalFireVisualProfile,
} from "./signalFireVisuals.ts";

export type SignalFireArt = Readonly<{
  container: Phaser.GameObjects.Container;
  zone: Phaser.GameObjects.Arc;
  halo: Phaser.GameObjects.Arc;
  flame: Phaser.GameObjects.Ellipse;
  core: Phaser.GameObjects.Ellipse;
  rune: Phaser.GameObjects.Arc;
  choiceRing: Phaser.GameObjects.Arc;
  pointer: Phaser.GameObjects.Triangle;
}>;

export function createSignalFireArt(
  scene: Phaser.Scene,
  point: Point,
  active = false,
): SignalFireArt {
  const zone = scene.add.circle(point.x, point.y, SIGNAL_FIRE_RADIUS, 0xffc45e, 0)
    .setStrokeStyle(1.5, 0xffc45e, 0)
    .setDepth(-9);
  const rune = scene.add.circle(point.x, point.y, 26, 0x0c1a20, 0.18)
    .setStrokeStyle(1.5, 0xffd780, 0)
    .setDepth(point.y + 1);
  const choiceRing = scene.add.circle(point.x, point.y, 34, 0x000000, 0)
    .setStrokeStyle(2, 0xffd780, 0)
    .setDepth(point.y + 2);

  const container = scene.add.container(point.x, point.y + 13).setDepth(point.y + 12);
  const shadow = scene.add.ellipse(0, 9, 38, 12, 0x061117, 0.52);
  const halo = scene.add.circle(0, -9, 20, 0xff9d3d, 0).setBlendMode(Phaser.BlendModes.ADD);
  const brazier = scene.add.graphics();
  brazier.fillStyle(0x18262b, 1).fillEllipse(0, 0, 27, 10);
  brazier.lineStyle(2, 0x819399, 0.82).strokeEllipse(0, -1, 28, 11);
  brazier.fillStyle(0x34464b, 1).fillRoundedRect(-11, 1, 22, 5, 2);
  brazier.lineStyle(2, 0x56696e, 0.9)
    .lineBetween(-8, 5, -12, 14)
    .lineBetween(8, 5, 12, 14)
    .lineBetween(-12, 14, 12, 14);
  const flame = scene.add.ellipse(0, -12, 11, 23, 0xff7b35, 0.98).setRotation(0.08);
  const core = scene.add.ellipse(1, -9, 5, 13, 0xfff0a8, 0.9).setRotation(-0.12);
  const pointer = scene.add.triangle(0, -43, -7, -6, 7, -6, 0, 5, 0xffe3a0, 0)
    .setStrokeStyle(1, 0x6f4d25, 0.8);
  container.add([shadow, halo, brazier, flame, core, pointer]);

  const art = Object.freeze({ container, zone, halo, flame, core, rune, choiceRing, pointer });
  setSignalFireState(art, active ? "active" : "idle");
  scene.tweens.add({
    targets: [halo, flame],
    scaleX: 1.08,
    scaleY: 1.12,
    duration: 940,
    yoyo: true,
    repeat: -1,
    ease: "Sine.InOut",
  });
  return art;
}

export function setSignalFireState(art: SignalFireArt, state: SignalFireState): void {
  if (art.container.getData("signalFireState") === state) return;
  const profile = getSignalFireVisualProfile(state);
  art.container.setData("signalFireState", state);
  art.zone
    .setFillStyle(profile.zone, profile.zoneAlpha)
    .setStrokeStyle(state === "active" ? 2 : 1.5, profile.zone, profile.zoneStrokeAlpha);
  art.halo.setFillStyle(profile.halo, profile.haloAlpha);
  art.flame.setFillStyle(profile.flame, profile.flameAlpha);
  art.core.setFillStyle(profile.core, profile.coreAlpha);
  art.rune
    .setFillStyle(0x0c1a20, state === "idle" ? 0.18 : 0.28)
    .setStrokeStyle(state === "active" ? 2 : 1.5, profile.rune, profile.runeAlpha);
  art.choiceRing.setStrokeStyle(state === "available" || state === "active" ? 2.5 : 1.5, profile.choice, profile.choiceAlpha);
  art.pointer.setFillStyle(profile.choice, profile.pointerAlpha).setAlpha(profile.pointerAlpha);
}
