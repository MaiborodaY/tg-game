import assert from "node:assert/strict";
import test from "node:test";

import { createPlayerProfileSnapshot } from "../src/game/profile.ts";
import { buildTower, createCampaignState } from "../src/game/state.ts";
import {
  TUTORIAL_COMPLETION_STORAGE_KEY,
  createTutorialState,
  isTutorialDone,
  reduceTutorial,
} from "../src/game/tutorial.ts";

function context(overrides = {}) {
  return {
    campaign: createCampaignState(),
    phase: "setup",
    profile: createPlayerProfileSnapshot(),
    tutorialCompleted: false,
    ...overrides,
  };
}

test("a genuinely fresh run starts with tower choice", () => {
  const state = createTutorialState(context());

  assert.deepEqual(state, { step: "choose_tower" });
  assert.equal(isTutorialDone(state), false);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(TUTORIAL_COMPLETION_STORAGE_KEY, "td-onboarding-v1");
});

test("the completion flag and an experienced profile suppress onboarding", () => {
  const completed = createTutorialState(context({ tutorialCompleted: true }));
  const experiencedProfile = {
    ...createPlayerProfileSnapshot(),
    bestResults: [{ levelId: "forest-gate", outcome: "defeat", completedWaves: 2, score: 2, durationMs: 1_000 }],
  };
  const experienced = createTutorialState(context({ profile: experiencedProfile }));

  assert.deepEqual(completed, { step: "done" });
  assert.deepEqual(experienced, { step: "done" });
});

test("a restored setup with a placed tower resumes at the start-wave hint", () => {
  const built = buildTower(createCampaignState(), 0, "ranger");
  assert.equal(built.ok, true);
  if (!built.ok) return;

  assert.deepEqual(createTutorialState(context({ campaign: built.state })), { step: "start_wave" });
});

test("an already active or progressed run never reopens onboarding", () => {
  const campaign = createCampaignState();

  assert.deepEqual(createTutorialState(context({ phase: "countdown" })), { step: "done" });
  assert.deepEqual(createTutorialState(context({ campaign: { ...campaign, completedWave: 1 } })), { step: "done" });
  assert.deepEqual(createTutorialState(context({ campaign: { ...campaign, totalKills: 1 } })), { step: "done" });
  assert.deepEqual(createTutorialState(context({ campaign: { ...campaign, activeDurationMs: 1 } })), { step: "done" });
});

test("tower selection, placement, and wave start advance the reducer", () => {
  const freshCampaign = createCampaignState();
  const choosing = createTutorialState(context({ campaign: freshCampaign }));
  const placing = reduceTutorial(choosing, { type: "tower_selected" });
  const built = buildTower(freshCampaign, 0, "ranger");
  assert.equal(built.ok, true);
  if (!built.ok) return;

  const ready = reduceTutorial(placing, {
    type: "ui_changed",
    snapshot: { campaign: built.state, phase: "setup" },
  });
  const done = reduceTutorial(ready, {
    type: "ui_changed",
    snapshot: { campaign: built.state, phase: "countdown" },
  });

  assert.deepEqual(placing, { step: "place_tower" });
  assert.deepEqual(ready, { step: "start_wave" });
  assert.deepEqual(done, { step: "done" });
  assert.equal(isTutorialDone(done), true);
});

test("skip completes immediately and done is terminal", () => {
  const choosing = createTutorialState(context());
  const done = reduceTutorial(choosing, { type: "skip" });

  assert.deepEqual(done, { step: "done" });
  assert.equal(reduceTutorial(done, { type: "tower_selected" }), done);
  assert.equal(reduceTutorial(done, {
    type: "ui_changed",
    snapshot: { campaign: createCampaignState(), phase: "setup" },
  }), done);
});

test("the reducer is pure and never mutates caller-owned state or snapshots", () => {
  const state = Object.freeze({ step: "place_tower" });
  const campaign = createCampaignState();
  const snapshot = Object.freeze({ campaign, phase: "setup" });

  const next = reduceTutorial(state, { type: "ui_changed", snapshot });

  assert.equal(next, state);
  assert.equal(snapshot.campaign, campaign);
  assert.deepEqual(campaign, createCampaignState());
});
