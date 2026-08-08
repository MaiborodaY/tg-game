import Phaser from "phaser";
import emberMageTierAtlasUrl from "../assets/towers/ember-mage-tier-atlas.webp";
import type { TowerLevel } from "../game/types.ts";
import {
  EMBER_MAGE_TIER_ATLAS_SPEC,
  selectEmberMageTierFrame,
} from "./emberMageTowerAtlas.ts";

export function preloadEmberMageTowerAtlas(scene: Phaser.Scene): void {
  const spec = EMBER_MAGE_TIER_ATLAS_SPEC;
  if (scene.textures.exists(spec.textureKey)) return;
  scene.load.spritesheet(spec.textureKey, emberMageTierAtlasUrl, {
    frameWidth: spec.frameWidth,
    frameHeight: spec.frameHeight,
    startFrame: 0,
    endFrame: spec.frameCount - 1,
  });
}

export function createEmberMageTierSprite(
  scene: Phaser.Scene,
  head: Phaser.GameObjects.Container,
  level: TowerLevel,
): Phaser.GameObjects.Sprite | null {
  const spec = EMBER_MAGE_TIER_ATLAS_SPEC;
  const textureReady = scene.textures.exists(spec.textureKey)
    && scene.textures.get(spec.textureKey).frameTotal >= spec.frameCount + 1;
  if (!textureReady) return null;

  const scale = spec.displayHeight / spec.frameHeight;
  const sprite = scene.add.sprite(
    0,
    spec.spriteBottomY,
    spec.textureKey,
    selectEmberMageTierFrame(level),
  )
    .setOrigin(0.5, 1)
    .setDisplaySize(spec.frameWidth * scale, spec.displayHeight);
  head.add(sprite);
  return sprite;
}
