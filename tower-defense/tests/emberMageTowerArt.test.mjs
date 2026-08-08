import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";
import {
  EMBER_MAGE_TIER_ATLAS_SPEC,
  EMBER_MAGE_TIER_FRAMES,
  selectEmberMageTierFrame,
} from "../src/rendering/emberMageTowerAtlas.ts";

const atlasUrl = new URL("../src/assets/towers/ember-mage-tier-atlas.webp", import.meta.url);
const artSource = readFileSync(new URL("../src/rendering/art.ts", import.meta.url), "utf8");
const moduleSource = readFileSync(new URL("../src/rendering/emberMageTowerArt.ts", import.meta.url), "utf8");
const sceneSource = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");

test("Embermage tier atlas is compact, transparent, and keeps all four figures grounded", async () => {
  const spec = EMBER_MAGE_TIER_ATLAS_SPEC;
  const metadata = await sharp(readFileSync(atlasUrl)).metadata();
  assert.equal(metadata.width, spec.textureWidth);
  assert.equal(metadata.height, spec.textureHeight);
  assert.equal(metadata.hasAlpha, true);
  assert.equal(spec.frameWidth * spec.frameCount, metadata.width);
  assert.equal(spec.frameHeight, metadata.height);
  assert.ok(statSync(atlasUrl).size <= spec.maxBytes);

  const { data, info } = await sharp(readFileSync(atlasUrl))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bounds = [];
  for (let frame = 0; frame < spec.frameCount; frame += 1) {
    let minX = spec.frameWidth;
    let minY = spec.frameHeight;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < spec.frameHeight; y += 1) {
      for (let x = 0; x < spec.frameWidth; x += 1) {
        const atlasX = frame * spec.frameWidth + x;
        const alpha = data[(y * info.width + atlasX) * info.channels + 3];
        if (alpha <= 32) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    bounds.push({ minX, minY, maxX, maxY });
  }
  assert.deepEqual(bounds.map(({ maxY }) => maxY), [119, 119, 119, 119]);
  assert.ok(bounds.every(({ minX, minY, maxX, maxY }) => (
    minX > 0 && minY > 0 && maxX < spec.frameWidth - 1 && maxY < spec.frameHeight - 1
  )));
});

test("Embermage levels select one static frame without a runtime animation loop", () => {
  assert.deepEqual(EMBER_MAGE_TIER_FRAMES, { 1: 0, 2: 1, 3: 2, 4: 3 });
  assert.equal(selectEmberMageTierFrame(1), 0);
  assert.equal(selectEmberMageTierFrame(2), 1);
  assert.equal(selectEmberMageTierFrame(3), 2);
  assert.equal(selectEmberMageTierFrame(4), 3);
  assert.equal(EMBER_MAGE_TIER_ATLAS_SPEC.displayHeight, 56);
  assert.equal(moduleSource.match(/scene\.add\.sprite\(/g)?.length, 1);
  assert.doesNotMatch(moduleSource, /scene\.tweens|repeat:\s*-1|setFrame\(/);
});

test("Embermage uses the atlas with a procedural fallback and never rotates the whole mage", () => {
  assert.match(sceneSource, /preload\(\): void \{[\s\S]*preloadEmberMageTowerAtlas\(this\)/);
  assert.match(moduleSource, /scene\.load\.spritesheet\(spec\.textureKey, emberMageTierAtlasUrl/);
  assert.match(moduleSource, /if \(!textureReady\) return null/);
  assert.match(artSource, /drawEmberTower\(scene, head, level\)/);
  assert.match(artSource, /createEmberMageTierSprite\(scene, head, level\)[\s\S]*drawEmber\(scene, head, level\)/);
  assert.match(sceneSource, /tower\.placement\.type !== "frost"[\s\S]*tower\.placement\.type !== "ember"/);
  assert.match(sceneSource, /if \(towerType === "ember"\) return this\.add\.circle\(x, y, 7/);
  assert.match(sceneSource, /enemy\.burning[\s\S]*duration: 310/);
});
