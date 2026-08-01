import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");

test("Northern Pass signal fires follow hero placement state without affecting levels that omit them", () => {
  assert.match(source, /this\.level\.signalFires\?\.forEach\(\(point, anchorId\) =>/);
  assert.match(source, /anchorId === view\.hero\.anchorId\s*\? "active"/);
  assert.match(source, /anchorsAvailable \? "available" : "idle"/);
  assert.match(source, /setSignalFireState\(fire, state\)/);
});

test("Northern Pass enemies keep variant and frost armour identity through render pooling", () => {
  assert.match(source, /event\.enemyVariant,\s*event\.frostArmored/);
  assert.match(source, /enemy\.variant,\s*enemy\.maxFrostArmor > 0/);
  assert.match(source, /\$\{variant\}:\$\{frostArmored \? 1 : 0\}/);
  assert.match(source, /setFillStyle\(frostArmorActive \? 0xb4f4ff : 0x77dff2/);
  assert.match(source, /event\.type === "frost_armor_broken"/);
});

test("boss protection and northern build pads account for the new level mechanics", () => {
  assert.match(source, /boss\.maxShield \+ boss\.maxFrostArmor/);
  assert.match(source, /boss\.shield \+ boss\.frostArmor/);
  assert.match(source, /this\.level\.id === NORTHERN_PASS_LEVEL_ID/);
  assert.match(source, /northern \? "❄" : "✦"/);
  assert.match(source, /view\.ring\.setFillStyle\(selected \? 0x57472b/);
});
