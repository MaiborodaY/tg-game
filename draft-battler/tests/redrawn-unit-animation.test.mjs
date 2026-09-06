import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";
import { getUnitAsset } from "../src/unitAssets.ts";
import { getVisibleBounds } from "../scripts/prepare-chroma-unit.mjs";

const animatedIds = ["battle_alchemist", "siege_engineer", "night_warden", "moon_priestess", "plague_rat"];

test("the five redrawn units have complete grounded pose atlases at authoring and runtime sizes", async () => {
  for (const id of animatedIds) {
    const asset = getUnitAsset(id);
    assert.ok(asset.spriteSheet, id);
    const files = [
      { path: fileURLToPath(new URL(`../assets-source/units/${id}/sprite-sheet.png`, import.meta.url)), size: 256, baseline: 236 },
      { path: fileURLToPath(asset.spriteSheet.path), size: 128, baseline: 118 },
    ];
    for (const file of files) {
      const atlas = sharp(file.path);
      const metadata = await atlas.metadata();
      assert.equal(metadata.width, file.size * 5, id);
      assert.equal(metadata.height, file.size * 2, id);
      assert.equal(metadata.hasAlpha, true, id);
      const frameDigests = [];
      const frames = [];
      for (let index = 0; index < 10; index += 1) {
        const { data, info } = await atlas.clone().extract({
          left: index % 5 * file.size,
          top: Math.floor(index / 5) * file.size,
          width: file.size,
          height: file.size,
        }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const bounds = getVisibleBounds(data, info.width, info.height);
        const bottom = bounds.top + bounds.height;
        assert.ok(Math.abs(bottom - file.baseline) <= 1, `${id} frame ${index} must rest on the common baseline, got ${bottom}`);
        assert.ok(bounds.left >= file.size * 0.05, `${id} frame ${index} left margin`);
        assert.ok(bounds.left + bounds.width <= file.size * 0.95, `${id} frame ${index} right margin`);
        frames.push({ data, bounds });
        frameDigests.push(createHash("sha256").update(data).digest("hex"));
      }
      assert.equal(new Set(frameDigests).size, 10, `${id} must not clone poses or facing rows`);
      for (const row of [0, 5]) {
        // Compare the silhouette, not just color noise: distinct PNG hashes alone do not prove a step.
        const difference = silhouetteDifference(frames[row + 1].data, frames[row + 2].data);
        assert.ok(difference > 0.06, `${id} walk silhouettes must differ, got ${difference}`);
        assert.ok(frames[row + 4].bounds.height < frames[row].bounds.height * 0.8, `${id} fallen pose must stay low, not be stretched upright`);
      }
    }
  }
});

function silhouetteDifference(first, second) {
  let union = 0;
  let difference = 0;
  for (let offset = 3; offset < first.length; offset += 4) {
    const a = first[offset] > 128;
    const b = second[offset] > 128;
    if (a || b) union += 1;
    if (a !== b) difference += 1;
  }
  return difference / union;
}
