import Phaser from "phaser";
import type {
  MornaCorpseSimulationView,
  MornaSimulationView,
  MornaSummonSimulationView,
} from "../game/simulation.ts";
import type { MornaCorpseKind, MornaSummonKind } from "../game/morna.ts";

export const MAX_MORNA_CORPSE_VIEWS = 6;
export const MAX_MORNA_SUMMON_VIEWS = 3;

type MornaCorpseArt = {
  entityId: number | null;
  kind: MornaCorpseKind | null;
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Arc;
  bones: Phaser.GameObjects.Graphics;
  essenceBadge: Phaser.GameObjects.Text;
};

type MornaSummonArt = {
  entityId: number | null;
  kind: MornaSummonKind | null;
  container: Phaser.GameObjects.Container;
  aura: Phaser.GameObjects.Arc;
  shadow: Phaser.GameObjects.Ellipse;
  body: Phaser.GameObjects.Graphics;
  weapon: Phaser.GameObjects.Graphics;
  healthTrack: Phaser.GameObjects.Rectangle;
  healthFill: Phaser.GameObjects.Rectangle;
  healthWidth: number;
};

export type MornaBattlefieldArt = Readonly<{
  corpses: readonly MornaCorpseArt[];
  summons: readonly MornaSummonArt[];
}>;

export function createMornaBattlefieldArt(scene: Phaser.Scene): MornaBattlefieldArt {
  return Object.freeze({
    corpses: Object.freeze(Array.from(
      { length: MAX_MORNA_CORPSE_VIEWS },
      () => createCorpseArt(scene),
    )),
    summons: Object.freeze(Array.from(
      { length: MAX_MORNA_SUMMON_VIEWS },
      () => createSummonArt(scene),
    )),
  });
}

export function syncMornaBattlefieldArt(
  art: MornaBattlefieldArt,
  state: MornaSimulationView | null,
  elapsedMs: number,
): void {
  syncCorpses(art.corpses, state?.corpses ?? [], elapsedMs);
  syncSummons(art.summons, state?.summons ?? [], elapsedMs);
}

export function destroyMornaBattlefieldArt(art: MornaBattlefieldArt): void {
  for (const corpse of art.corpses) corpse.container.destroy(true);
  for (const summon of art.summons) summon.container.destroy(true);
}

function createCorpseArt(scene: Phaser.Scene): MornaCorpseArt {
  const container = scene.add.container(0, 0).setVisible(false);
  const glow = scene.add.circle(0, 0, 15, 0x42d9ca, 0.08)
    .setStrokeStyle(1.5, 0x7ff7e9, 0.58);
  const bones = scene.add.graphics();
  const essenceBadge = scene.add.text(11, -13, "", {
    color: "#d9fffb",
    backgroundColor: "#153c3c",
    fontFamily: "Arial, sans-serif",
    fontSize: "8px",
    fontStyle: "bold",
    padding: { x: 2, y: 1 },
    stroke: "#102328",
    strokeThickness: 2,
  }).setOrigin(0.5);
  container.add([glow, bones, essenceBadge]);
  return { entityId: null, kind: null, container, glow, bones, essenceBadge };
}

function createSummonArt(scene: Phaser.Scene): MornaSummonArt {
  const container = scene.add.container(0, 0).setVisible(false);
  const aura = scene.add.circle(0, 2, 17, 0x53e0d0, 0.06)
    .setStrokeStyle(1.5, 0x74f4e7, 0.42);
  const shadow = scene.add.ellipse(0, 11, 27, 9, 0x071515, 0.55);
  const body = scene.add.graphics();
  const weapon = scene.add.graphics();
  const healthTrack = scene.add.rectangle(-13, -24, 26, 4, 0x122421, 0.94)
    .setOrigin(0, 0.5)
    .setStrokeStyle(1, 0x31554f, 0.92);
  const healthFill = scene.add.rectangle(-12, -24, 24, 2, 0x64e6c9, 1)
    .setOrigin(0, 0.5);
  container.add([shadow, aura, body, weapon, healthTrack, healthFill]);
  return {
    entityId: null,
    kind: null,
    container,
    aura,
    shadow,
    body,
    weapon,
    healthTrack,
    healthFill,
    healthWidth: 24,
  };
}

function syncCorpses(
  slots: readonly MornaCorpseArt[],
  entities: readonly MornaCorpseSimulationView[],
  elapsedMs: number,
): void {
  const visible = [...entities]
    .sort((left, right) => left.id - right.id)
    .slice(0, MAX_MORNA_CORPSE_VIEWS);
  const liveIds = new Set(visible.map((corpse) => corpse.id));
  releaseMissingSlots(slots, liveIds);

  for (const corpse of visible) {
    const slot = acquireSlot(slots, corpse.id);
    if (!slot) continue;
    if (slot.kind !== corpse.kind) drawCorpse(slot, corpse.kind);
    slot.kind = corpse.kind;
    const pulse = (Math.sin(elapsedMs * 0.006 + corpse.id * 1.71) + 1) * 0.5;
    const expiryAlpha = Phaser.Math.Clamp(corpse.remainingMs / 1_200, 0.24, 1);
    slot.container
      .setPosition(corpse.x, corpse.y + 4)
      .setDepth(corpse.y + 12)
      .setAlpha(expiryAlpha)
      .setVisible(true);
    slot.glow.setScale(0.94 + pulse * 0.09).setAlpha(0.1 + pulse * 0.12);
    slot.essenceBadge.setText(corpse.essence > 1 ? `+${corpse.essence}` : "");
  }
}

function syncSummons(
  slots: readonly MornaSummonArt[],
  entities: readonly MornaSummonSimulationView[],
  elapsedMs: number,
): void {
  const visible = [...entities]
    .sort((left, right) => left.id - right.id)
    .slice(0, MAX_MORNA_SUMMON_VIEWS);
  const liveIds = new Set(visible.map((summon) => summon.id));
  releaseMissingSlots(slots, liveIds);

  for (const summon of visible) {
    const slot = acquireSlot(slots, summon.id);
    if (!slot) continue;
    if (slot.kind !== summon.kind) drawSummon(slot, summon.kind);
    slot.kind = summon.kind;
    const phase = elapsedMs * (summon.blockedEnemyIds.length > 0 ? 0.012 : 0.007) + summon.id * 0.83;
    const bob = Math.sin(phase) * (summon.kind === "colossus" ? 0.45 : 0.9);
    const expiryAlpha = Phaser.Math.Clamp(summon.remainingMs / 1_000, 0.35, 1);
    const hpRatio = Phaser.Math.Clamp(summon.hp / Math.max(1, summon.maxHp), 0, 1);
    slot.container
      .setPosition(summon.x, summon.y + bob)
      .setDepth(summon.y + 42)
      .setAlpha(expiryAlpha)
      .setVisible(true);
    slot.body.setRotation(Math.sin(phase * 0.52) * 0.018);
    slot.weapon.setRotation(summon.blockedEnemyIds.length > 0 ? -0.18 + Math.sin(phase) * 0.12 : 0);
    slot.aura
      .setScale(0.96 + Math.sin(phase * 0.65) * 0.045)
      .setAlpha(summon.blockedEnemyIds.length > 0 ? 0.22 : 0.1);
    slot.healthFill
      .setScale((slot.healthWidth / 24) * hpRatio, 1)
      .setFillStyle(hpRatio > 0.45 ? 0x64e6c9 : hpRatio > 0.2 ? 0xf0c765 : 0xe86c6c, 1);
    slot.healthTrack.setAlpha(0.96);
    slot.healthFill.setAlpha(1);
  }
}

function releaseMissingSlots<T extends { entityId: number | null; container: Phaser.GameObjects.Container }>(
  slots: readonly T[],
  liveIds: ReadonlySet<number>,
): void {
  for (const slot of slots) {
    if (slot.entityId !== null && liveIds.has(slot.entityId)) continue;
    slot.entityId = null;
    slot.container.setVisible(false);
  }
}

function acquireSlot<T extends { entityId: number | null }>(slots: readonly T[], entityId: number): T | null {
  const existing = slots.find((slot) => slot.entityId === entityId);
  if (existing) return existing;
  const available = slots.find((slot) => slot.entityId === null);
  if (!available) return null;
  available.entityId = entityId;
  return available;
}

function drawCorpse(art: MornaCorpseArt, kind: MornaCorpseKind): void {
  const bones = art.bones.clear();
  if (kind === "essence") {
    bones.lineStyle(2, 0x8cfbf0, 0.9).strokeCircle(0, 0, 10);
    bones.lineStyle(1.5, 0x5ad7d0, 0.7)
      .lineBetween(-7, 0, 0, -7)
      .lineBetween(0, -7, 7, 0)
      .lineBetween(7, 0, 0, 7)
      .lineBetween(0, 7, -7, 0);
    bones.fillStyle(0xc8fff8, 0.92).fillCircle(0, 0, 3);
    art.glow.setRadius(17).setFillStyle(0x42d9ca, 0.13).setStrokeStyle(2, 0x8cfbf0, 0.8);
    return;
  }

  bones.lineStyle(kind === "heavy" ? 2.4 : 1.8, 0xc9d8cf, 0.86);
  bones.strokeCircle(-3, -4, kind === "heavy" ? 5 : 4);
  bones.lineBetween(-1, 0, 6, 7).lineBetween(2, 3, -7, 8).lineBetween(2, 4, 11, 1);
  bones.lineBetween(6, 7, 0, 12).lineBetween(6, 7, 13, 11);
  if (kind === "heavy") {
    bones.lineStyle(2, 0x7ddfd4, 0.88)
      .lineBetween(-10, -7, -3, -12)
      .lineBetween(-3, -12, 5, -7);
    bones.fillStyle(0x344b4c, 0.92).fillTriangle(-10, -7, -3, -13, 6, -7);
  }
  art.glow
    .setRadius(kind === "heavy" ? 16 : 14)
    .setFillStyle(0x42d9ca, kind === "heavy" ? 0.11 : 0.07)
    .setStrokeStyle(kind === "heavy" ? 2 : 1.5, 0x7ff7e9, kind === "heavy" ? 0.72 : 0.52);
}

function drawSummon(art: MornaSummonArt, kind: MornaSummonKind): void {
  const body = art.body.clear();
  const weapon = art.weapon.clear();
  const scale = kind === "colossus" ? 1.3 : kind === "guard" ? 1.08 : 0.94;
  const healthWidth = kind === "colossus" ? 34 : kind === "guard" ? 28 : 24;
  art.healthWidth = healthWidth;
  art.healthTrack
    .setPosition(-(healthWidth + 2) / 2, kind === "colossus" ? -31 : -24)
    .setDisplaySize(healthWidth + 2, 4);
  art.healthFill.setPosition(-healthWidth / 2, kind === "colossus" ? -31 : -24);
  art.aura.setRadius(kind === "colossus" ? 24 : kind === "guard" ? 19 : 16);
  art.shadow.setDisplaySize(kind === "colossus" ? 40 : kind === "guard" ? 31 : 27, kind === "colossus" ? 12 : 9);

  body.fillStyle(0x20272b, 0.98).fillRoundedRect(-7 * scale, -10 * scale, 14 * scale, 21 * scale, 4);
  body.lineStyle(2, 0xb9cec5, 0.96).strokeCircle(0, -14 * scale, 6 * scale);
  body.fillStyle(0xd5e2da, 0.96).fillCircle(0, -14 * scale, 5 * scale);
  body.fillStyle(0x16282a, 1)
    .fillCircle(-2.2 * scale, -15 * scale, 1.25 * scale)
    .fillCircle(2.2 * scale, -15 * scale, 1.25 * scale);
  body.fillStyle(0x6ff1e1, 0.94)
    .fillCircle(-2.2 * scale, -15 * scale, 0.72 * scale)
    .fillCircle(2.2 * scale, -15 * scale, 0.72 * scale);
  body.lineStyle(2, 0xc6d7ce, 0.92)
    .lineBetween(-5 * scale, -5 * scale, 5 * scale, -5 * scale)
    .lineBetween(-6 * scale, 1 * scale, 6 * scale, 1 * scale)
    .lineBetween(-3 * scale, 10 * scale, -5 * scale, 17 * scale)
    .lineBetween(3 * scale, 10 * scale, 5 * scale, 17 * scale);

  if (kind === "warrior") {
    weapon.lineStyle(2.3, 0xdbe7df, 1).lineBetween(8, -7, 18, -18);
    weapon.lineStyle(2, 0x74e8d8, 0.9).lineBetween(11, -8, 17, -2);
  } else {
    weapon.fillStyle(kind === "colossus" ? 0x40565a : 0x31494b, 1)
      .fillRoundedRect(-18 * scale, -8 * scale, 10 * scale, 19 * scale, 4);
    weapon.lineStyle(2, 0x73e8db, 0.9)
      .strokeRoundedRect(-18 * scale, -8 * scale, 10 * scale, 19 * scale, 4)
      .lineBetween(-13 * scale, -4 * scale, -13 * scale, 7 * scale);
    weapon.lineStyle(kind === "colossus" ? 4 : 2.5, 0xd4dfd8, 0.96)
      .lineBetween(9 * scale, -9 * scale, 18 * scale, 12 * scale);
  }
  if (kind === "colossus") {
    body.fillStyle(0x536266, 0.98)
      .fillTriangle(-7, -19, -16, -29, -11, -14)
      .fillTriangle(7, -19, 16, -29, 11, -14);
    body.lineStyle(3, 0x79f0e2, 0.86).strokeCircle(0, 0, 17);
  }
}
