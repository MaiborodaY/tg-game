import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";
import { readUnitAssetSelection } from "../scripts/unit-asset-selection.mjs";

const scriptsRoot = fileURLToPath(new URL("../scripts/", import.meta.url));
const unitIds = ["plague_rat", "night_warden", "untouched_unit"];
const selectedIds = unitIds.slice(0, 2);
const sourcePrefix = "draft-battler/assets-source";
const runtimePrefix = "draft-battler/src/assets";
const previewPath = ".tmp/draft-battler-card-unit-preview.png";

test("unit selection accepts either CLI syntax and preserves an omitted full-roster default", () => {
  assert.equal(readUnitAssetSelection([], unitIds), undefined);
  assert.deepEqual(readUnitAssetSelection(["--units", "plague_rat,night_warden"], unitIds), selectedIds);
  assert.deepEqual(readUnitAssetSelection(["--units=plague_rat,night_warden"], unitIds), selectedIds);
});

test("unit selection rejects ambiguous options, empty IDs, unknown IDs, and paths", () => {
  for (const args of [
    ["--units"],
    ["--units", "--source-root=fixture"],
    ["--units="],
    ["--units", " "],
    ["--units", "plague_rat,,night_warden"],
    ["--units", "plague_rat,"],
    ["--units", "plague_rat,plague_rat"],
    ["--units", "missing_unit"],
    ["--units", "../plague_rat"],
    ["--units", "C:\\plague_rat"],
    ["--units", "/plague_rat"],
    ["--units", "plague_rat", "--units=night_warden"],
  ]) {
    assert.throws(() => readUnitAssetSelection(args, unitIds), /--units/, JSON.stringify(args));
  }
});

for (const selectionArgs of [
  ["--units", selectedIds.join(",")],
  [`--units=${selectedIds.join(",")}`],
]) {
  test(`card generation changes only selected portraits (${selectionArgs[0]})`, async (context) => {
    const fixtureRoot = await createFixture(context);
    const before = await snapshotFiles(fixtureRoot);
    const result = runGenerator("generate-card-unit-assets.mjs", fixtureRoot, selectionArgs);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(changedPaths(before, await snapshotFiles(fixtureRoot)), selectedIds
      .map((id) => `${sourcePrefix}/units/${id}/card.png`).sort());
    assert.match(result.stdout, /Generated 2 card portraits/);

    const metadata = await sharp(path.join(fixtureRoot, sourcePrefix, "units/plague_rat/card.png")).metadata();
    assert.deepEqual([metadata.width, metadata.height, metadata.hasAlpha], [512, 768, true]);
  });

  test(`runtime generation leaves unselected units, static assets, and README untouched (${selectionArgs[0]})`, async (context) => {
    const fixtureRoot = await createFixture(context);
    const before = await snapshotFiles(fixtureRoot);
    const result = runGenerator("generate-runtime-assets.mjs", fixtureRoot, selectionArgs);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(changedPaths(before, await snapshotFiles(fixtureRoot)), selectedIds
      .flatMap((id) => ["unit", "card"].map((kind) => `${runtimePrefix}/units/${id}/${kind}.webp`)).sort());
    assert.match(result.stdout, /Generated runtime assets: 4/);
  });
}

for (const script of ["generate-card-unit-assets.mjs", "generate-runtime-assets.mjs"]) {
  test(`${script} validates the entire whitelist before writing any asset`, async (context) => {
    const fixtureRoot = await createFixture(context);
    const before = await snapshotFiles(fixtureRoot);
    for (const ids of ["plague_rat,missing_unit", "", "plague_rat,plague_rat", "plague_rat,../outside"]) {
      const result = runGenerator(script, fixtureRoot, ["--units", ids]);
      assert.notEqual(result.status, 0, `Must reject ${JSON.stringify(ids)}`);
      assert.match(result.stderr, /--units/);
      assert.deepEqual(await snapshotFiles(fixtureRoot), before, `No partial writes for ${JSON.stringify(ids)}`);
    }
  });
}

test("full card generation still refreshes all portraits and the shared preview", async (context) => {
  const fixtureRoot = await createFixture(context);
  const before = await snapshotFiles(fixtureRoot);
  const result = runGenerator("generate-card-unit-assets.mjs", fixtureRoot);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(changedPaths(before, await snapshotFiles(fixtureRoot)), [
    previewPath,
    ...unitIds.map((id) => `${sourcePrefix}/units/${id}/card.png`),
  ].sort());
});

test("full runtime generation still refreshes all units, static assets, and README", async (context) => {
  const fixtureRoot = await createFixture(context);
  const before = await snapshotFiles(fixtureRoot);
  const result = runGenerator("generate-runtime-assets.mjs", fixtureRoot);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(changedPaths(before, await snapshotFiles(fixtureRoot)), [
    `${runtimePrefix}/README.md`,
    `${runtimePrefix}/environment/player_keep/keep.webp`,
    ...unitIds.flatMap((id) => ["unit", "card"].map((kind) => `${runtimePrefix}/units/${id}/${kind}.webp`)),
  ].sort());
});

async function createFixture(context) {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "draft-battler-selected-assets-"));
  context.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  const unitImage = await sharp({ create: {
    width: 16,
    height: 24,
    channels: 4,
    background: { r: 60, g: 160, b: 90, alpha: 0.8 },
  } }).png().toBuffer();
  const cardImage = await sharp({ create: {
    width: 12,
    height: 18,
    channels: 4,
    background: { r: 180, g: 60, b: 90, alpha: 0.8 },
  } }).png().toBuffer();
  for (const id of unitIds) {
    await writeFixtureFile(fixtureRoot, `${sourcePrefix}/units/${id}/unit.png`, unitImage);
    await writeFixtureFile(fixtureRoot, `${sourcePrefix}/units/${id}/card.png`, cardImage);
    await writeFixtureFile(fixtureRoot, `${runtimePrefix}/units/${id}/unit.webp`, "unchanged runtime unit");
    await writeFixtureFile(fixtureRoot, `${runtimePrefix}/units/${id}/card.webp`, "unchanged runtime card");
  }
  await writeFixtureFile(fixtureRoot, `${sourcePrefix}/environment/player_keep/keep.png`, unitImage);
  await writeFixtureFile(fixtureRoot, `${runtimePrefix}/environment/player_keep/keep.webp`, "unchanged keep");
  await writeFixtureFile(fixtureRoot, `${runtimePrefix}/README.md`, "complete inventory");
  await writeFixtureFile(fixtureRoot, previewPath, "complete roster preview");
  return fixtureRoot;
}

async function writeFixtureFile(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
}

async function snapshotFiles(root, relativePath = "") {
  const snapshot = {};
  const entries = await readdir(path.join(root, relativePath), { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      Object.assign(snapshot, await snapshotFiles(root, entryPath));
    } else {
      snapshot[entryPath] = createHash("sha256").update(await readFile(path.join(root, entryPath))).digest("hex");
    }
  }
  return snapshot;
}

function changedPaths(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((filePath) => before[filePath] !== after[filePath])
    .sort();
}

function runGenerator(script, cwd, args = []) {
  return spawnSync(process.execPath, [path.join(scriptsRoot, script), ...args], { cwd, encoding: "utf8" });
}
