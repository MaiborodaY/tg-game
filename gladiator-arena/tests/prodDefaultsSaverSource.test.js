import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("debug panel exposes save as prod defaults action", () => {
  const source = readFileSync(join(root, "src", "debugPanel.ts"), "utf8");

  assert.match(source, /Save as prod defaults/);
  assert.match(source, /saveProdDefaults\(debugTuning\)/);
});

test("client saver posts debug tuning to the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/save-prod-defaults/);
  assert.match(source, /method: "POST"/);
  assert.match(source, /JSON\.stringify\(tuning\)/);
});

test("client saver can promote auto equipment through the local dev endpoint", () => {
  const source = readFileSync(join(root, "src", "prodDefaultsSaver.ts"), "utf8");

  assert.match(source, /\/__dust-arena\/promote-equipment-item/);
  assert.match(source, /savePromotedEquipmentItem/);
});

test("vite dev middleware only writes whitelisted arena layout defaults", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /configureServer/);
  assert.match(source, /DEFAULT_PLAYER_STAGE_X: "playerStageX"/);
  assert.match(source, /DEFAULT_ACTION_REST_ANGLE: "actionRestArcAngle"/);
  assert.doesNotMatch(source, /gridStep/);
  assert.match(source, /applyProdDefaultUpdates/);
});

test("vite dev middleware writes promoted equipment to generated files", () => {
  const source = readFileSync(join(root, "vite.config.ts"), "utf8");

  assert.match(source, /promote-equipment-item/);
  assert.match(source, /equipmentItems\.generated\.json/);
  assert.match(source, /equipmentItems\.generated\.ts/);
  assert.match(source, /pickPromotedEquipmentItem/);
});
