import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

function loadCombatModule() {
  const filename = fileURLToPath(new URL("../src/combat.ts", import.meta.url));
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });

  const module = { exports: {} };

  vm.runInNewContext(outputText, { exports: module.exports, module }, { filename });

  return module.exports;
}

const combat = loadCombatModule();

test("bow fighters can attack at range but cannot lunge", () => {
  const state = combat.freshState();

  state.player.weaponClass = "bow";
  state.distance = 3;
  state.enemyPosition = 3;

  assert.equal(combat.canUseAction(state, "light"), true);
  assert.equal(combat.canUseAction(state, "medium"), true);
  assert.equal(combat.canUseAction(state, "heavy"), true);
  assert.equal(combat.canUseAction(state, "lunge"), false);
  assert.equal(combat.canUseAction(state, "switchWeapon"), true);
});

test("bow attack resolves damage and uses shot naming in the log", () => {
  const state = combat.freshState();

  state.player.weaponClass = "bow";
  state.player.damageBonus = 0;
  state.distance = 3;
  state.enemyPosition = 3;

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(nextState.enemy.hp, combat.MAX_HP - 4);
  assert.equal(nextState.player.bowShotsRemaining, combat.BOW_SHOTS_PER_BATTLE - 1);
  assert.match(nextState.log[0].text, /Power Shot/);
});

test("bow attacks stop after five shots until the fighter switches to melee", () => {
  let state = combat.freshState();

  state.player.weaponClass = "bow";
  state.distance = 3;
  state.enemyPosition = 3;

  for (let shotIndex = 0; shotIndex < combat.BOW_SHOTS_PER_BATTLE; shotIndex += 1) {
    state = combat.resolvePlayerTurn(state, "light", () => 0.99);
    state.activeTurn = "player";
  }

  assert.equal(state.player.bowShotsRemaining, 0);
  assert.equal(combat.canUseAction(state, "light"), false);
  assert.equal(combat.canUseAction(state, "switchWeapon"), true);

  const switched = combat.resolvePlayerTurn(state, "switchWeapon");

  assert.equal(switched.player.weaponClass, "sword");
  assert.equal(combat.canUseAction({ ...switched, activeTurn: "player" }, "lunge"), true);
});

test("bow attacks ignore strength damage bonus and use only weapon damage", () => {
  const state = combat.freshState();

  state.player.weaponClass = "bow";
  state.player.damageBonus = 50;
  state.player.weaponDamageBonus = 5;
  state.distance = 3;
  state.enemyPosition = 3;

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(nextState.enemy.hp, combat.MAX_HP - 9);
  assert.equal(nextState.player.stamina, combat.MAX_STAMINA - 5);
});

test("enemy bow fighters also use ranged attack rules", () => {
  const state = combat.freshState();

  state.activeTurn = "enemy";
  state.enemy.weaponClass = "bow";
  state.distance = 3;
  state.enemyPosition = 3;

  assert.equal(combat.canUseAction(state, "light", "enemy"), true);
  assert.equal(combat.canUseAction(state, "heavy", "enemy"), true);
  assert.equal(combat.canUseAction(state, "lunge", "enemy"), false);
});

test("shurikens are consumable ranged throws with guaranteed hit", () => {
  const state = combat.freshState();

  state.player.shurikenCount = 2;
  state.player.shurikenDamage = 2;
  state.distance = 3;
  state.enemyPosition = 3;

  assert.equal(combat.canUseAction(state, "shuriken"), true);
  assert.equal(combat.canUseAction(state, "light"), false);

  const nextState = combat.resolvePlayerTurn(state, "shuriken", () => 0);

  assert.equal(nextState.enemy.hp, combat.MAX_HP - 2);
  assert.equal(nextState.player.shurikenCount, 1);
  assert.equal(nextState.lastPlayerBlocked, false);
  assert.match(nextState.log[0].text, /Throw Shuriken/);
});
