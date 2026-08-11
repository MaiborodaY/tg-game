import assert from "node:assert/strict";
import test from "node:test";
import {
  assertNoAuthoringAssetsInBuild,
  getAuthoringAssetsInBuild,
} from "../scripts/build-asset-policy.mjs";

test("build asset policy permits optimized runtime images", () => {
  const files = [
    "assets/units/iron_guard/unit.webp",
    "assets/ui/cards/frames/card-frame-common.svg",
    "assets/index.js",
  ];

  assert.deepEqual(getAuthoringAssetsInBuild(files), []);
  assert.doesNotThrow(() => assertNoAuthoringAssetsInBuild(files));
});

test("build asset policy rejects copied authoring PNG files", () => {
  const files = [
    "assets/units/iron_guard/unit.png",
    "assets/ui/cards/templates/card-template-common.png",
    "assets/units/iron_guard/unit.webp",
  ];

  assert.deepEqual(getAuthoringAssetsInBuild(files), [
    "assets/ui/cards/templates/card-template-common.png",
    "assets/units/iron_guard/unit.png",
  ]);
  assert.throws(
    () => assertNoAuthoringAssetsInBuild(files),
    /build contains authoring PNG assets/,
  );
});
