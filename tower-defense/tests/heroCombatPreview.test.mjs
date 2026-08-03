import assert from "node:assert/strict";
import test from "node:test";

import {
  HERO_COMBAT_PREVIEW_QUERY_PARAM,
  HERO_COMBAT_PREVIEW_SAVE_NAMESPACE,
  buildHeroCombatPreviewSaveKey,
  isHeroCombatPreviewRequest,
  isHeroCombatPreviewSession,
} from "../src/game/heroCombatPreview.ts";

const ELIGIBLE_CONTEXT = Object.freeze({
  isDevelopment: true,
  launchKind: "practice",
  rewardMode: "local",
  queryValue: "1",
  levelId: "forest-gate",
  modeId: "campaign",
});

test("hero combat preview isolates only the explicit local campaign", () => {
  assert.equal(HERO_COMBAT_PREVIEW_QUERY_PARAM, "preview_hero_combat");
  assert.equal(isHeroCombatPreviewSession(ELIGIBLE_CONTEXT), true);

  const ineligibleVariants = [
    { isDevelopment: false },
    { launchKind: "miniapp" },
    { launchKind: "legacy" },
    { rewardMode: "server" },
    { queryValue: null },
    { queryValue: "true" },
    { levelId: "northern-pass-v3" },
    { modeId: "endless" },
  ];
  for (const patch of ineligibleVariants) {
    assert.equal(isHeroCombatPreviewSession({ ...ELIGIBLE_CONTEXT, ...patch }), false);
  }
});

test("eligible preview sessions isolate their save before a hero is selected", () => {
  const { levelId: _levelId, modeId: _modeId, ...launch } = ELIGIBLE_CONTEXT;
  assert.equal(isHeroCombatPreviewRequest(launch), true);
  assert.equal(isHeroCombatPreviewRequest({ ...launch, isDevelopment: false }), false);
  assert.equal(isHeroCombatPreviewSession(ELIGIBLE_CONTEXT), true);
  assert.equal(isHeroCombatPreviewSession({ ...ELIGIBLE_CONTEXT, isDevelopment: false }), false);
  assert.equal(isHeroCombatPreviewSession({ ...ELIGIBLE_CONTEXT, modeId: "endless" }), false);
});

test("production URL input cannot activate the isolated preview save", () => {
  assert.equal(isHeroCombatPreviewSession({ ...ELIGIBLE_CONTEXT, isDevelopment: false }), false);
});

test("preview checkpoints use an isolated namespace without changing regular keys", () => {
  const baseKey = "td-save-v5:local:forest-gate:campaign";
  assert.equal(buildHeroCombatPreviewSaveKey(baseKey, false), baseKey);
  assert.equal(
    buildHeroCombatPreviewSaveKey(baseKey, true),
    `${baseKey}:${HERO_COMBAT_PREVIEW_SAVE_NAMESPACE}`,
  );
  assert.match(HERO_COMBAT_PREVIEW_SAVE_NAMESPACE, /v2$/);
  assert.throws(() => buildHeroCombatPreviewSaveKey("", true), /base save key/i);
});
