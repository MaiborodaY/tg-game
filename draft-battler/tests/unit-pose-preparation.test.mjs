import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { getVisibleBounds } from "../scripts/prepare-chroma-unit.mjs";
import { prepareUnitPoseSheet, readPoseSheetOptions } from "../scripts/prepare-unit-pose-sheet.mjs";

async function withTempDirectory(run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "bro-unit-poses-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function writeGrid(outputPath, { width = 1000, height = 400, background = "alpha", omit = -1, alpha = 255, uniform = false } = {}) {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (background === "magenta") data.set([245, 4, 240, 255], offset);
      if (background === "checker") {
        const shade = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 150 : 220;
        data.set([shade, shade, shade, 255], offset);
      }
    }
  }
  for (let index = 0; index < 10; index += 1) {
    if (index === omit) continue;
    const column = index % 5;
    const row = Math.floor(index / 5);
    const dead = column === 4 && !uniform;
    const poseWidth = uniform ? 80 : dead ? 120 + row * 10 : 40 + index * 5;
    const poseHeight = uniform ? 100 : dead ? 24 - row * 4 : 80 + index * 5;
    const left = Math.round(column * width / 5) + 25;
    const top = Math.round(row * height / 2) + 30;
    for (let y = top; y < top + poseHeight; y += 1) {
      for (let x = left; x < left + poseWidth; x += 1) {
        const color = x < left + poseWidth / 4 && y < top + poseHeight / 2
          ? [220, 120, 10, alpha]
          : [40 + index * 10, 100, 140, alpha];
        data.set(color, (y * width + x) * 4);
      }
    }
  }
  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(outputPath);
}

async function readFrame(atlasPath, index) {
  return sharp(atlasPath).extract({ left: index % 5 * 256, top: Math.floor(index / 5) * 256, width: 256, height: 256 })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function writeLooseGrid(outputPath, { omit = -1, extra = false, ambiguousGear = false, tall = false } = {}) {
  const width = 1000;
  const height = 400;
  const data = Buffer.alloc(width * height * 4);
  const counts = [];
  const draw = (left, top, rectangleWidth, rectangleHeight, color) => {
    for (let y = top; y < top + rectangleHeight; y += 1) {
      for (let x = left; x < left + rectangleWidth; x += 1) data.set(color, (y * width + x) * 4);
    }
  };
  for (let index = 0; index < 10; index += 1) {
    const column = index % 5;
    const row = Math.floor(index / 5);
    const dead = column === 4;
    const left = [50, 190, 430, 630, 800][column];
    const top = row * 200 + (dead ? 160 : 40);
    const poseWidth = dead ? 160 : 60;
    const poseHeight = dead ? 30 : 140;
    counts[index] = poseWidth * poseHeight;
    if (index !== omit) draw(left, top, poseWidth, poseHeight, [30 + index * 15, 100, 140, 255]);
  }
  draw(695, 75, 8, 10, [30 + 3 * 15, 100, 140, 255]);
  counts[3] += 80;
  draw(49, 100, 1, 1, [0, 0, 0, 8]);
  if (extra) draw(320, 70, 30, 80, [150, 150, 50, 255]);
  if (ambiguousGear) draw(145, 80, 10, 20, [150, 150, 50, 255]);
  if (tall) draw(50, 5, 60, 234, [30, 100, 140, 255]);
  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(outputPath);
  return counts;
}

test("pose preparation retains genuine alpha and does not alter the generated original", async () => {
  await withTempDirectory(async (directory) => {
    const inputPath = path.join(directory, "original.png");
    const outputPath = path.join(directory, "sheet.png");
    await writeGrid(inputPath, { alpha: 137, uniform: true });
    const original = await readFile(inputPath);
    const result = await prepareUnitPoseSheet(inputPath, outputPath);
    assert.deepEqual(await readFile(inputPath), original);
    assert.equal(result.background, "alpha");
    const metadata = await sharp(outputPath).metadata();
    assert.equal(metadata.width, 1280);
    assert.equal(metadata.height, 512);
    assert.equal(metadata.hasAlpha, true);
    const { data } = await readFrame(outputPath, 0);
    assert.equal(data[3], 0);
    assert.ok(Math.abs(data[(150 * 256 + 128) * 4 + 3] - 137) <= 1, "semi-transparent source pixels retain their alpha");
  });
});

test("all ten poses use a common scale, centered bounds, and the same grounded baseline", async () => {
  await withTempDirectory(async (directory) => {
    const inputPath = path.join(directory, "original.png");
    const outputPath = path.join(directory, "sheet.png");
    await writeGrid(inputPath);
    const result = await prepareUnitPoseSheet(inputPath, outputPath);
    assert.equal(result.frames.length, 10);
    for (const frame of result.frames) {
      const { data, info } = await readFrame(outputPath, frame.index);
      const bounds = getVisibleBounds(data, info.width, info.height);
      assert.deepEqual(bounds, frame.preparedBounds);
      assert.equal(bounds.top + bounds.height, 236, "bottom edge sits on the exclusive y=236 baseline");
      assert.ok(bounds.width <= 220 && bounds.height <= 196);
      assert.ok(bounds.left >= 18 && bounds.top >= 40, "visible poses retain safety margins");
      assert.ok(Math.abs(bounds.left + bounds.width / 2 - 128) <= 0.5);
      assert.ok(Math.abs(bounds.width - frame.sourceBounds.width * result.scale) <= 2);
      assert.ok(Math.abs(bounds.height - frame.sourceBounds.height * result.scale) <= 2);
      const centerOffset = ((bounds.top + Math.floor(bounds.height / 2)) * 256 + bounds.left + Math.floor(bounds.width / 2)) * 4;
      assert.ok(Math.abs(data[centerOffset] - (40 + frame.index * 10)) <= 1, "poses stay in their authored grid positions");
      const markerY = bounds.top + Math.floor(bounds.height / 4);
      const markerLeft = (markerY * 256 + bounds.left + Math.floor(bounds.width / 8)) * 4;
      const markerRight = (markerY * 256 + bounds.left + Math.floor(bounds.width * 7 / 8)) * 4;
      assert.ok(data[markerLeft] > 200 && data[markerRight] < 140, "authored asymmetric markings must not be mirrored");
    }
    assert.ok(result.frames[4].preparedBounds.height < result.frames[3].preparedBounds.height / 3, "fallen pose is not enlarged vertically");
    assert.ok(result.frames[9].preparedBounds.height < result.frames[8].preparedBounds.height / 3);
  });
});

test("magenta grids are keyed and rounded 1984x794 grids split into exactly ten complete cells", async () => {
  await withTempDirectory(async (directory) => {
    const inputPath = path.join(directory, "original.png");
    const outputPath = path.join(directory, "sheet.png");
    await writeGrid(inputPath, { width: 1984, height: 794, background: "magenta" });
    const result = await prepareUnitPoseSheet(inputPath, outputPath, { maxWidth: 160, maxHeight: 120 });
    assert.equal(result.background, "magenta");
    assert.equal(result.frames.slice(0, 5).reduce((sum, frame) => sum + frame.sourceCell.width, 0), 1984);
    assert.equal(result.frames[0].sourceCell.height + result.frames[5].sourceCell.height, 794);
    assert.equal(result.frames[9].sourceCell.left + result.frames[9].sourceCell.width, 1984);
    for (const frame of result.frames) {
      const { data, info } = await readFrame(outputPath, frame.index);
      assert.equal(data[3], 0);
      const bounds = getVisibleBounds(data, info.width, info.height);
      assert.ok(bounds.width <= 160 && bounds.height <= 120);
      assert.equal(bounds.top + bounds.height, 236);
    }
  });
});

test("bad grids, empty poses, and opaque checkerboards fail without modifying output", async () => {
  await withTempDirectory(async (directory) => {
    const inputPath = path.join(directory, "original.png");
    const outputPath = path.join(directory, "sheet.png");
    const sentinel = Buffer.from("existing output remains untouched");
    await writeFile(outputPath, sentinel);
    for (const [options, expected] of [
      [{ width: 1000, height: 500 }, /5x2 grid/],
      [{ omit: 6 }, /Frame 7 has no visible pose/],
      [{ background: "magenta", omit: 9 }, /Frame 10 has no visible pose/],
      [{ background: "checker" }, /magenta matte.*checkerboard/],
    ]) {
      await writeGrid(inputPath, options);
      await assert.rejects(prepareUnitPoseSheet(inputPath, outputPath), expected);
      assert.deepEqual(await readFile(outputPath), sentinel);
    }
    const original = await readFile(inputPath);
    await assert.rejects(prepareUnitPoseSheet(inputPath, inputPath), /separate output/);
    assert.deepEqual(await readFile(inputPath), original);
    await assert.rejects(prepareUnitPoseSheet(inputPath, outputPath, { maxWidth: 221 }), /Visible limits/);
    await assert.rejects(prepareUnitPoseSheet(inputPath, path.join(directory, "sheet.webp")), /must be PNG/);
  });
});

test("pose preparation accepts only unique explicit CLI options and bounded integer size limits", () => {
  assert.deepEqual(readPoseSheetOptions(["--input=source.png", "--output=sheet.png"]), {
    inputPath: "source.png", outputPath: "sheet.png", options: { maxWidth: 220, maxHeight: 196 },
  });
  assert.deepEqual(readPoseSheetOptions(["--input=source.png", "--output=sheet.png", "--max-width=160", "--max-height=120"]).options, { maxWidth: 160, maxHeight: 120 });
  assert.equal(readPoseSheetOptions(["--input=source.png", "--output=sheet.png", "--loose-grid"]).options.looseGrid, true);
  for (const args of [[], ["--input=source.png"], ["--input", "source.png", "--output=sheet.png"], ["--input=a.png", "--input=b.png", "--output=c.png"]]) {
    assert.throws(() => readPoseSheetOptions(args));
  }
  for (const option of ["--max-width=0", "--max-width=NaN", "--max-width=221", "--max-height=1.5", "--max-height=197"]) {
    assert.throws(() => readPoseSheetOptions(["--input=a.png", "--output=b.png", option]), /Visible limits/);
  }
  assert.throws(() => readPoseSheetOptions(["--input=a.png", "--output=b.png", "--loose-grid", "--loose-grid"]));
});

test("loose grids preserve whole crossing poses and disconnected gear without neighbor fragments", async () => {
  await withTempDirectory(async (directory) => {
    const inputPath = path.join(directory, "original.png");
    const outputPath = path.join(directory, "sheet.png");
    const counts = await writeLooseGrid(inputPath);
    await assert.rejects(prepareUnitPoseSheet(inputPath, outputPath), /background and margins/);
    const result = await prepareUnitPoseSheet(inputPath, outputPath, { looseGrid: true, maxWidth: 162, maxHeight: 142 });
    assert.equal(result.looseGrid, true);
    assert.equal(result.scale, 1);
    assert.deepEqual(result.skippedParticles, []);
    for (const frame of result.frames) {
      const { data, info } = await readFrame(outputPath, frame.index);
      let count = 0;
      let faint = 0;
      for (let offset = 0; offset < data.length; offset += 4) {
        if (data[offset + 3] === 8) faint += 1;
        if (data[offset + 3] <= 12) continue;
        count += 1;
        assert.equal(data[offset], 30 + frame.index * 15, "a frame must contain its own pose and gear, never a neighbor fragment");
      }
      assert.equal(count, counts[frame.index], "every authored visible pixel survives at unit scale");
      assert.equal(faint, frame.index === 0 ? 1 : 0, "true faint edges survive only beside their owned pose");
      const bounds = getVisibleBounds(data, info.width, info.height);
      assert.equal(bounds.top + bounds.height, 236);
      assert.ok(bounds.width <= 162 && bounds.height <= 142);
    }
  });
});

test("loose grids reject missing or extra major figures and ambiguous possible body parts", async () => {
  await withTempDirectory(async (directory) => {
    const inputPath = path.join(directory, "original.png");
    const outputPath = path.join(directory, "sheet.png");
    const sentinel = Buffer.from("do not overwrite on validation failure");
    await writeFile(outputPath, sentinel);
    for (const [options, expected] of [
      [{ omit: 2 }, /exactly 10.*found 9/],
      [{ extra: true }, /exactly 10.*found 11/],
      [{ omit: 7, extra: true }, /five distinct figures in each row/],
      [{ tall: true }, /oversized or merged figure/],
      [{ ambiguousGear: true }, /cannot be assigned unambiguously/],
    ]) {
      await writeLooseGrid(inputPath, options);
      await assert.rejects(prepareUnitPoseSheet(inputPath, outputPath, { looseGrid: true }), expected);
      assert.deepEqual(await readFile(outputPath), sentinel);
    }
    await writeGrid(inputPath, { background: "checker" });
    await assert.rejects(prepareUnitPoseSheet(inputPath, outputPath, { looseGrid: true }), /checkerboard/);
    await assert.rejects(prepareUnitPoseSheet(inputPath, outputPath, { looseGrid: "true" }), /must be boolean/);
  });
});
