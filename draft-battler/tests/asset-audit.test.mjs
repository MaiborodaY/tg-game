import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

const repoRoot = process.cwd();
const auditScript = path.join(repoRoot, "draft-battler", "scripts", "audit-assets.mjs");

test("asset audit requires every dynamic icon in the runtime asset contract", async (context) => {
  const fixtureRoot = await createFixture(context);
  const sourceRoot = path.join(fixtureRoot, "src");
  const assetRoot = path.join(fixtureRoot, "assets");

  await writeFixtureContract(fixtureRoot, ["fireball"], ["tank", "damage", "support"]);

  const result = runAudit(assetRoot, sourceRoot);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /ui\/cards\/abilities\/ability-fireball\.svg/);
  assert.match(result.stdout, /ui\/cards\/archetypes\/archetype-tank\.svg/);
  assert.match(result.stdout, /ui\/cards\/archetypes\/archetype-damage\.svg/);
  assert.match(result.stdout, /ui\/cards\/archetypes\/archetype-support\.svg/);
});

test("asset audit fully decodes and rejects a parseable but truncated image", async (context) => {
  const fixtureRoot = await createFixture(context);
  const sourceRoot = path.join(fixtureRoot, "src");
  const assetRoot = path.join(fixtureRoot, "assets");
  const brokenAssetPath = path.join(assetRoot, "broken.png");
  const sourceImage = await readFile(path.join(repoRoot, "draft-battler", "public", "assets", "units", "wolfhound", "unit.png"));

  await writeFile(path.join(sourceRoot, "main.ts"), 'const image = "assets/broken.png";\n', "utf8");
  await writeFile(brokenAssetPath, sourceImage.subarray(0, 128));
  await assert.doesNotReject(() => sharp(brokenAssetPath).metadata());

  const result = runAudit(assetRoot, sourceRoot);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Invalid image assets/);
  assert.match(result.stdout, /broken\.png/);
});

async function createFixture(context) {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "draft-battler-assets-"));
  await mkdir(path.join(fixtureRoot, "src"));
  await mkdir(path.join(fixtureRoot, "assets"));
  await mkdir(path.join(fixtureRoot, "assets", "ui", "cards", "abilities"), { recursive: true });
  await mkdir(path.join(fixtureRoot, "assets", "ui", "cards", "archetypes"), { recursive: true });
  await writeFile(path.join(fixtureRoot, "index.html"), "", "utf8");
  await writeFile(path.join(fixtureRoot, "src", "main.ts"), "", "utf8");
  await writeFixtureContract(fixtureRoot, ["fixture"], ["fixture"]);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
  await writeFile(path.join(fixtureRoot, "assets", "ui", "cards", "abilities", "ability-fixture.svg"), svg, "utf8");
  await writeFile(path.join(fixtureRoot, "assets", "ui", "cards", "archetypes", "archetype-fixture.svg"), svg, "utf8");
  context.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  return fixtureRoot;
}

function writeFixtureContract(fixtureRoot, abilityIds, cardArchetypes) {
  return writeFile(
    path.join(fixtureRoot, "runtime-assets.json"),
    JSON.stringify({ abilityIds, cardArchetypes }),
    "utf8",
  );
}

function runAudit(assetRoot, sourceRoot) {
  return spawnSync(
    process.execPath,
    [
      auditScript,
      `--assets-root=${assetRoot}`,
      `--source-root=${sourceRoot}`,
      `--asset-contract=${path.join(path.dirname(sourceRoot), "runtime-assets.json")}`,
      "--top=0",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  );
}
