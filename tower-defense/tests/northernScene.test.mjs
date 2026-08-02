import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");

test("Northern Pass signal fires follow hero placement state without affecting levels that omit them", () => {
  assert.match(source, /setInputEnabled\(enabled: boolean\): void \{\s*this\.interactionEnabled = enabled;\s*if \(this\.input\) this\.input\.enabled = enabled/);
  assert.match(source, /create\(\): void \{\s*this\.input\.enabled = this\.interactionEnabled/);
  assert.match(source, /this\.level\.signalFires\?\.forEach\(\(point, anchorId\) =>/);
  assert.match(source, /const selected = anchorId === view\.hero\.anchorId/);
  assert.match(source, /view\.phase === "setup" \? "active" : "protected"/);
  assert.match(source, /const selectable = view\.phase === "setup" && !selected/);
  assert.match(source, /selectable \? "available"/);
  assert.match(source, /setSignalFireState\(fire\.art, state\)/);
  assert.match(source, /fire\.hitZone\.input\.enabled = selectable/);
  assert.match(source, /hitZone\.on\("pointerdown", \(\) => this\.handleSignalFireClick\(anchorId\)\)/);
  assert.match(source, /private handleSignalFireClick\(anchorId: number\)/);
  assert.match(source, /view\.phase !== "setup" \|\| anchorId === view\.hero\.anchorId/);
  assert.match(source, /this\.selectedHero = true;\s*this\.selectedBuildType = null;\s*this\.selectedPadId = null;\s*this\.updatePadVisuals\(\);\s*this\.handleHeroAnchorClick\(anchorId\)/);
});

test("Northern Pass renders three storm sectors from the actual next-wave plan", () => {
  assert.match(source, /NORTHERN_STORM_SECTORS\.forEach\(\(sector, index\) =>/);
  assert.match(source, /createNorthernStormSectorArt\(this, this\.path, sector, index\)/);
  assert.match(source, /const threatened = new Set\(plan\?\.sectorIds \?\? \[\]\)/);
  assert.match(source, /sectorId === protectedSector\s*\? "protected"/);
  assert.match(source, /threatened\.has\(sectorId\) \? "threatened" : "calm"/);
  assert.match(source, /this\.simulation\.getCurrentWavePlan\(\)\.northernStorm/);
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
