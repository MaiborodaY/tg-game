import assert from "node:assert/strict";
import test from "node:test";

import { audioCuesForSimulationEvent, audioCuesForSimulationEvents } from "../src/audio/audioCues.ts";

test("simulation events map to semantic audio without coupling sound to haptics", () => {
  assert.deepEqual(audioCuesForSimulationEvent({ type: "haptic", kind: "heavy" }), []);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "persist", campaign: {} }), []);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "boss_spawned" }), ["boss_arrival"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "hero_attack", heroId: "eira" }), ["hero_eira_attack"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "hero_attack", heroId: "toren" }), ["hero_toren_attack"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "hero_ability", heroId: "grak" }), ["hero_grak_ability"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "projectile_hit", towerType: "ranger" }), ["tower_ranger_hit"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "projectile_hit", towerType: "frost" }), ["tower_frost_hit"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "lightning" }), ["storm_chain"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "northern_avalanche" }), ["avalanche"]);
});

test("gate, boss and terminal cues preserve gameplay meaning", () => {
  assert.deepEqual(audioCuesForSimulationEvent({ type: "gate_shield_absorbed" }), ["gate_shield"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "enemy_leaked", damage: 0 }), []);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "enemy_leaked", damage: 2 }), ["gate_hit"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "enemy_killed", enemyType: "runner" }), ["enemy_defeat"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "enemy_killed", enemyType: "boss" }), ["boss_defeat"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "enemy_killed", enemyType: "titan" }), ["boss_defeat"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "wave_cleared" }), ["wave_clear"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "terminal", outcome: "victory" }), ["victory"]);
  assert.deepEqual(audioCuesForSimulationEvent({ type: "terminal", outcome: "gameover" }), ["defeat"]);
});

test("a terminal victory replaces the same-batch wave-clear fanfare", () => {
  assert.deepEqual(audioCuesForSimulationEvents([
    { type: "enemy_killed", enemyType: "boss" },
    { type: "wave_cleared" },
    { type: "terminal", outcome: "victory" },
  ]), ["boss_defeat", "victory"]);
  assert.deepEqual(audioCuesForSimulationEvents([{ type: "wave_cleared" }]), ["wave_clear"]);
});
