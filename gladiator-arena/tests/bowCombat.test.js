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
});

test("bow attack resolves damage and uses shot naming in the log", () => {
  const state = combat.freshState();

  state.player.weaponClass = "bow";
  state.player.damageBonus = 0;
  state.distance = 3;
  state.enemyPosition = 3;

  const nextState = combat.resolvePlayerTurn(state, "heavy", () => 0.99);

  assert.equal(nextState.enemy.hp, combat.MAX_HP - 4);
  assert.match(nextState.log[0].text, /Power Shot/);
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
