import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  applyArmorDelta,
  formatArmorBadge,
  formatDamageFeedback,
} from "../src/rendering/armorPresentation.ts";

const sceneSource = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");

test("armor presentation accumulates, absorbs, and disappears at zero", () => {
  assert.equal(applyArmorDelta(0, 2), 2);
  assert.equal(applyArmorDelta(2, 1), 3);
  assert.equal(applyArmorDelta(2, -2), 0);
  assert.equal(applyArmorDelta(1, -4), 0);
  assert.equal(formatArmorBadge(2), "🛡 2");
  assert.equal(formatArmorBadge(0), "");
});

test("damage feedback distinguishes HP loss from absorbed armor", () => {
  assert.equal(formatDamageFeedback(0, 2), "🛡-2");
  assert.equal(formatDamageFeedback(1, 2), "-1  🛡-2");
  assert.equal(formatDamageFeedback(3, 0), "-3");
});

test("battlefield renderer applies armor gains and absorption to the persistent badge", () => {
  assert.match(sceneSource, /event\.shieldDelta[\s\S]*?updateUnitArmor/);
  assert.match(sceneSource, /event\.shieldAbsorbed > 0[\s\S]*?updateUnitArmor/);
  assert.match(sceneSource, /formatDamageFeedback\(event\.amount, event\.shieldAbsorbed\)/);
});
