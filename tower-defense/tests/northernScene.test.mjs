import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");

test("Northern Pass exposes three large direct-tap avalanche zones only during combat", () => {
  assert.match(source, /createAvalancheZones\(initialView\)/);
  assert.match(source, /AVALANCHE_ZONE_HIT_SIZE, AVALANCHE_ZONE_HIT_SIZE/);
  assert.match(source, /hitZone\.on\("pointerdown", \(\) => this\.handleAvalancheClick\(zone\.id\)\)/);
  assert.match(source, /executeCommand\(\{ type: "trigger_northern_avalanche", zoneId \}\)/);
  assert.match(source, /view\.phase === "wave"[\s\S]*!view\.paused[\s\S]*avalanche\.available/);
  assert.match(source, /input\.enabled = interactive && zone\.id === northernPass\.forecastDangerZoneId/);
  assert.doesNotMatch(source, /handleAvalancheClick[\s\S]{0,500}moveHero/);
});

test("avalanche visuals communicate waiting, armed, and spent states without hidden sector guessing", () => {
  assert.match(source, /avalanche\.chargesRemaining <= 0[\s\S]*\? "spent"/);
  assert.match(source, /zone\.id === northernPass\.forecastDangerZoneId && zone\.canTrigger \? "armed" : "available"/);
  assert.match(source, /zone\.id === northernPass\.forecastDangerZoneId \? 1 : 0\.46/);
  assert.match(source, /setAvalancheZoneState\(renderView\.art, state\)/);
  assert.match(source, /event\.type === "northern_avalanche"/);
  assert.match(source, /event\.impacts\.slice\(0, 8\)/);
  assert.match(source, /sampleAvalancheRouteSegment\(this\.path\.points, zone\.startRatio, zone\.endRatio\)/);
  assert.match(source, /renderKey === this\.avalancheRouteHighlightKey/);
  assert.match(source, /stroke\(12, armed \? 0\.2 : 0\.1\)/);
  assert.match(source, /selectAvalancheMarkerPoint\(/);
  assert.doesNotMatch(source, /❄−|✕/);
});

test("route variants redraw the actual world route and reposition their avalanche zones", () => {
  assert.match(source, /event\.type === "northern_route_changed"/);
  assert.match(source, /this\.path = createPathMetrics\(routePoints\)/);
  assert.match(source, /setWorldRoute\(this\.worldArt, routePoints\)/);
  assert.match(source, /this\.repositionAvalancheZones\(\)/);
  assert.match(source, /setAvalancheZoneAct\(renderView\.art, act\)/);
});

test("Northern Pass enemies keep variant and frost armour identity through render pooling", () => {
  assert.match(source, /event\.enemyVariant,\s*event\.frostArmored/);
  assert.match(source, /enemy\.variant,\s*enemy\.maxFrostArmor > 0/);
  assert.match(source, /\$\{variant\}:\$\{frostArmored \? 1 : 0\}/);
  assert.match(source, /setFillStyle\(frostArmorActive \? 0xb4f4ff : 0x77dff2/);
  assert.match(source, /event\.type === "frost_armor_broken"/);
});

test("boss protection and northern build pads remain compatible with the new interaction", () => {
  assert.match(source, /boss\.maxShield \+ boss\.maxFrostArmor/);
  assert.match(source, /boss\.shield \+ boss\.frostArmor/);
  assert.match(source, /this\.level\.id === NORTHERN_PASS_LEVEL_ID/);
  assert.match(source, /northern \? "❄" : "✦"/);
  assert.match(source, /view\.ring\.setFillStyle\(selected \? 0x57472b/);
});

test("an exposed boss core has a distinct one-shot effect and persistent status ring", () => {
  assert.match(source, /event\.type === "boss_core_exposed"/);
  assert.match(source, /createFloatingText\(this, point\.x, point\.y - 30, "×2"/);
  assert.match(source, /enemy\.frostCoreExposed \? 3 : 2/);
  assert.match(source, /enemy\.frostCoreExposed \? 0xffc766/);
  assert.match(source, /frostCoreExposed: boss\.frostCoreExposed/);
});
