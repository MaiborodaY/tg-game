import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  REDUCED_MOTION_MEDIA_QUERY,
  prefersReducedBattleMotion,
} from "../src/rendering/motionPreference.ts";

const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const rendererSource = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");

test("battle motion preference is safe and uses the platform media query", () => {
  let observedQuery;
  assert.equal(prefersReducedBattleMotion(undefined), false);
  assert.equal(prefersReducedBattleMotion({ matchMedia: () => ({ matches: false }) }), false);
  assert.equal(prefersReducedBattleMotion({
    matchMedia: (query) => {
      observedQuery = query;
      return { matches: true };
    },
  }), true);
  assert.equal(observedQuery, REDUCED_MOTION_MEDIA_QUERY);
  assert.equal(prefersReducedBattleMotion({ matchMedia: () => { throw new Error("blocked"); } }), false);
});

test("reduced-motion battles reuse the exactly-once skip completion path", () => {
  assert.match(mainSource, /reducedMotion:\s*prefersReducedBattleMotion\(window\)/);
  assert.match(rendererSource, /if \(command\.reducedMotion\) \{\s*this\.completeBattleImmediately\(activeBattle\);\s*return;/s);
  assert.match(rendererSource, /private completeBattleImmediately[\s\S]*?completeSkippedBattle/);
});
