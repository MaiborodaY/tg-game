import assert from "node:assert/strict";
import test from "node:test";

import {
  HERO_COMBAT_PREVIEW_QUERY_PARAM,
  HERO_COMBAT_PREVIEW_SAVE_NAMESPACE,
  buildHeroCombatPreviewSaveKey,
  isHeroCombatPreviewRequest,
  isHeroCombatPreviewSession,
  shouldEnableHeroCombatPreview,
} from "../src/game/heroCombatPreview.ts";

const ELIGIBLE_CONTEXT = Object.freeze({
  isDevelopment: true,
  launchKind: "practice",
  rewardMode: "local",
  queryValue: "1",
  levelId: "forest-gate",
  modeId: "campaign",
  heroId: "toren",
});

test("hero combat preview is limited to the explicit local Toren campaign", () => {
  assert.equal(HERO_COMBAT_PREVIEW_QUERY_PARAM, "preview_hero_combat");
  assert.equal(shouldEnableHeroCombatPreview(ELIGIBLE_CONTEXT), true);

  const ineligibleVariants = [
    { isDevelopment: false },
    { launchKind: "miniapp" },
    { launchKind: "legacy" },
    { rewardMode: "server" },
    { queryValue: null },
    { queryValue: "true" },
    { levelId: "northern-pass-v3" },
    { modeId: "endless" },
    { heroId: "eira" },
    { heroId: "grak" },
  ];
  for (const patch of ineligibleVariants) {
    assert.equal(shouldEnableHeroCombatPreview({ ...ELIGIBLE_CONTEXT, ...patch }), false);
  }
});

test("eligible preview sessions isolate their save before Toren is selected", () => {
  const { heroId: _heroId, ...session } = ELIGIBLE_CONTEXT;
  const { levelId: _levelId, modeId: _modeId, ...launch } = session;
  assert.equal(isHeroCombatPreviewRequest(launch), true);
  assert.equal(isHeroCombatPreviewRequest({ ...launch, isDevelopment: false }), false);
  assert.equal(isHeroCombatPreviewSession(session), true);
  assert.equal(isHeroCombatPreviewSession({ ...session, isDevelopment: false }), false);
  assert.equal(isHeroCombatPreviewSession({ ...session, modeId: "endless" }), false);
});

test("production URL input cannot enable the hero combat preview", () => {
  assert.equal(shouldEnableHeroCombatPreview({
    ...ELIGIBLE_CONTEXT,
    isDevelopment: false,
    queryValue: "1",
  }), false);
});

test("preview checkpoints use an isolated namespace without changing regular keys", () => {
  const baseKey = "td-save-v5:local:forest-gate:campaign";
  assert.equal(buildHeroCombatPreviewSaveKey(baseKey, false), baseKey);
  assert.equal(
    buildHeroCombatPreviewSaveKey(baseKey, true),
    `${baseKey}:${HERO_COMBAT_PREVIEW_SAVE_NAMESPACE}`,
  );
  assert.throws(() => buildHeroCombatPreviewSaveKey("", true), /base save key/i);
});
