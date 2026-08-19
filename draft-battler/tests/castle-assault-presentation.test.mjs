import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CASTLE_ASSAULT_HIT_STAGGER_MS,
  createCastleAssaultPlan,
  getCastleAssaultDurationMs,
} from "../src/rendering/castleAssaultPresentation.ts";

const rendererSource = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");

test("castle assault preserves attacker order with a compact stable hit stagger", () => {
  const attackerIds = ["player-2", "player-0", "player-5"];

  assert.deepEqual(createCastleAssaultPlan(attackerIds, 3, 17), [
    { attackerId: "player-2", delayMs: 0, remainingHpAfterHit: 19 },
    { attackerId: "player-0", delayMs: CASTLE_ASSAULT_HIT_STAGGER_MS, remainingHpAfterHit: 18 },
    { attackerId: "player-5", delayMs: CASTLE_ASSAULT_HIT_STAGGER_MS * 2, remainingHpAfterHit: 17 },
  ]);
  assert.deepEqual(
    createCastleAssaultPlan(attackerIds, 3, 17),
    createCastleAssaultPlan(attackerIds, 3, 17),
  );
});

test("castle assault reports only actual HP loss when the army overkills the castle", () => {
  const plan = createCastleAssaultPlan(
    Array.from({ length: 6 }, (_, index) => `enemy-${index}`),
    2,
    0,
  );

  assert.deepEqual(plan.map((hit) => hit.remainingHpAfterHit), [1, 0, undefined, undefined, undefined, undefined]);
});

test("grouped assault remains bounded as the surviving army grows", () => {
  const durations = Array.from({ length: 6 }, (_, index) => getCastleAssaultDurationMs(index + 1));

  assert.equal(getCastleAssaultDurationMs(0), 0);
  assert.equal(durations[0], 620);
  assert.equal(durations[5], 795);
  assert.ok(durations.every((duration, index) => index === 0 || duration > durations[index - 1]));
  assert.ok(durations[5] <= 800);

  // The battle scene currently doubles configured durations at normal playback speed.
  assert.ok(durations[5] * 2 <= 1_600);
});

test("battlefield renderer presents one guarded concurrent castle assault", () => {
  assert.match(rendererSource, /if \(event\.type === "castle_assault"\)/);
  assert.match(rendererSource, /await Promise\.all\(\s*attackers\.map[\s\S]*?this\.moveUnitTo/);
  assert.match(rendererSource, /createCastleAssaultPlan\(event\.attackerIds, event\.damage, event\.remainingHp\)/);
  assert.match(
    rendererSource,
    /if \(!this\.isCurrentBattle\(playToken, activeBattle\)\) \{\s*return;\s*\}[\s\S]*?completion\.emitCastleHp\(event\.owner, remainingHpAfterHit\)/,
  );
  assert.doesNotMatch(rendererSource, /event\.type === "(?:unit_move_to_castle|castle_hit|unit_sacrifice)"/);
});
