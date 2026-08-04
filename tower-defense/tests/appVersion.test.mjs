import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createBuildFingerprint,
  createTowerDefenseBuildInfo,
  parseTowerDefenseAppVersion,
  readCiBuildId,
  TOWER_DEFENSE_BUILD_PLACEHOLDER,
} from "../scripts/app-version.mjs";

test("Tower Defense app version is an explicit semantic release version", () => {
  const source = readFileSync(new URL("../version.json", import.meta.url), "utf8");
  assert.equal(parseTowerDefenseAppVersion(source), "1.4.1");
  assert.throws(() => parseTowerDefenseAppVersion('{"version":"content-2"}'), /semantic version/);
});

test("CI commit identifiers take precedence over a local build fingerprint", () => {
  assert.equal(readCiBuildId({ CF_PAGES_COMMIT_SHA: "ABCDEF1234567890" }), "gabcdef12");
  assert.equal(readCiBuildId({ GITHUB_SHA: "1234567890abcdef" }), "g12345678");
  assert.equal(readCiBuildId({ GITHUB_SHA: "abcdef1" }), null);
  const info = createTowerDefenseBuildInfo({
    version: "1.0.0",
    env: { CF_PAGES_COMMIT_SHA: "ABCDEF1234567890" },
    entries: [{ path: "src/main.ts", content: "ignored for CI identity" }],
  });
  assert.deepEqual(info, { version: "1.0.0", buildId: "gabcdef12", label: "v1.0.0 · gabcdef12" });
});

test("local build fingerprints are deterministic and change with source content", () => {
  const first = createBuildFingerprint([
    { path: "src/main.ts", content: "main" },
    { path: "index.html", content: "html" },
  ]);
  const reordered = createBuildFingerprint([
    { path: "index.html", content: "html" },
    { path: "src\\main.ts", content: "main" },
  ]);
  const changed = createBuildFingerprint([
    { path: "index.html", content: "html" },
    { path: "src/main.ts", content: "main changed" },
  ]);
  assert.match(first, /^b[0-9a-f]{8}$/);
  assert.equal(reordered, first);
  assert.notEqual(changed, first);
});

test("both player menus expose the build placeholder for Vite replacement", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.equal(html.match(/data-app-version/g)?.length, 2);
  assert.equal(html.split(TOWER_DEFENSE_BUILD_PLACEHOLDER).length - 1, 2);
});
