import assert from "node:assert/strict";
import test from "node:test";

import {
  isClientLevelReleased,
  normalizeClientLevelId,
  shouldExposePreviewContent,
} from "../src/game/releasePolicy.ts";

test("unreleased content is visible only in a local development practice launch", () => {
  assert.equal(shouldExposePreviewContent(true, "practice"), true);

  for (const launchKind of ["miniapp", "legacy", "error"]) {
    assert.equal(shouldExposePreviewContent(true, launchKind), false);
  }
  for (const launchKind of ["practice", "miniapp", "legacy", "error"]) {
    assert.equal(shouldExposePreviewContent(false, launchKind), false);
  }
});

test("production keeps Northern Pass behind an explicit preview capability", () => {
  assert.equal(isClientLevelReleased("forest-gate", false), true);
  assert.equal(isClientLevelReleased("northern-pass", false), false);
  assert.equal(normalizeClientLevelId("northern-pass", false), "forest-gate");
  assert.equal(isClientLevelReleased("missing-level", false), false);
  assert.equal(normalizeClientLevelId("missing-level", false), "forest-gate");
});

test("development practice exposes the catalog without accepting unknown levels", () => {
  assert.equal(isClientLevelReleased("forest-gate", true), true);
  assert.equal(isClientLevelReleased("northern-pass", true), true);
  assert.equal(normalizeClientLevelId("northern-pass", true), "northern-pass");
  assert.equal(isClientLevelReleased("missing-level", true), false);
  assert.equal(normalizeClientLevelId("missing-level", true), "forest-gate");
});
