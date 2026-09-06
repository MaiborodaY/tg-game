import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { getVisibleBounds, prepareChromaUnit, removeMagentaMatte } from "../scripts/prepare-chroma-unit.mjs";

test("chroma preparation removes only the matte and unmixes its edge color", () => {
  const source = Buffer.from([
    255, 0, 255, 255, 180, 60, 180, 255, 50, 100, 150, 255,
    50, 100, 150, 255, 50, 100, 150, 255, 130, 80, 130, 255,
  ]);
  const original = Buffer.from(source);
  const output = removeMagentaMatte(source, 6, 1);
  assert.deepEqual(source, original, "original pixels must not be modified");
  assert.deepEqual([...output.subarray(0, 4)], [0, 0, 0, 0]);
  assert.ok(output[7] > 0 && output[7] < 255, "edge alpha must be feathered");
  assert.ok(output[4] < source[4] && output[6] < source[6], "magenta must not leave a colored fringe");
  assert.deepEqual(output.subarray(8, 12), source.subarray(8, 12));
  assert.deepEqual(output.subarray(20, 24), source.subarray(20, 24), "interior purple is not matte");
});

test("chroma preparation rejects an unrelated or empty image", () => {
  assert.throws(() => removeMagentaMatte(Buffer.alloc(16, 100), 2, 2), /unrelated image/);
  assert.throws(() => removeMagentaMatte(Buffer.alloc(4), 2, 2), /RGBA/);
  assert.throws(() => getVisibleBounds(Buffer.alloc(16), 2, 2), /No visible/);
});

test("noisy generated magenta borders become fully transparent, not green fringes", () => {
  const source = Buffer.from([231, 34, 221, 255, 235, 13, 227, 255, 50, 100, 150, 255]);
  const output = removeMagentaMatte(source, 3, 1);
  assert.deepEqual([...output.subarray(0, 8)], Array(8).fill(0));
  assert.deepEqual(output.subarray(8), source.subarray(8));
});

test("prepared authoring file preserves canvas dimensions, full figure and transparent foot margin", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bro-unit-matte-"));
  try {
    const inputPath = path.join(root, "original.png");
    const outputPath = path.join(root, "prepared.png");
    const subject = await sharp({ create: { width: 300, height: 550, channels: 4, background: "#76543a" } }).png().toBuffer();
    await sharp({ create: { width: 512, height: 768, channels: 4, background: "#ff00ff" } })
      .composite([{ input: subject, left: 100, top: 90 }]).png().toFile(inputPath);
    const before = await readFile(inputPath);
    const prepared = await prepareChromaUnit(inputPath, outputPath);
    assert.deepEqual(await readFile(inputPath), before);
    const metadata = await sharp(outputPath).metadata();
    assert.equal(metadata.width, 512);
    assert.equal(metadata.height, 768);
    assert.equal(metadata.hasAlpha, true);
    assert.equal(prepared.preparedBounds.top + prepared.preparedBounds.height, Math.round(768 * 0.96));
    const { data, info } = await sharp(outputPath).raw().toBuffer({ resolveWithObject: true });
    assert.equal(data[3], 0);
    const bounds = getVisibleBounds(data, info.width, info.height);
    assert.ok(bounds.left > 0 && bounds.top > 0);
    assert.ok(bounds.left + bounds.width < info.width && bounds.top + bounds.height < info.height);
    await assert.rejects(prepareChromaUnit(inputPath, inputPath), /separate output/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
