import assert from "node:assert/strict";
import test from "node:test";
import { createUnitCombatFeedback, getUnitVitals } from "../src/rendering/battleUnitHud.ts";
import { HeadlessBattleScene } from "./headless-battle-scene.mjs";

test("unit vitals consistently describe full, injured, armored and dead units", () => {
  assert.deepEqual(getUnitVitals(12, 12, 0), { hpLabel: "12/12", armorLabel: "", armor: 0, ratio: 1, alive: true });
  assert.deepEqual(getUnitVitals(3, 12, 4), { hpLabel: "3/12", armorLabel: "🛡 4", armor: 4, ratio: 0.25, alive: true });
  assert.deepEqual(getUnitVitals(0, 12, 0), { hpLabel: "0/12", armorLabel: "", armor: 0, ratio: 0, alive: false });
  assert.equal(getUnitVitals(100, 12, -1).hpLabel, "12/12");
  assert.equal(getUnitVitals(NaN, Infinity, NaN).ratio, 0);
});

test("simultaneous feedback merges a recipient's hits but never hides healing by netting", () => {
  const events = [damage("one", 3, 2), damage("one", 4, 0), heal("one", 2), heal("two", 5), damage("three", 0, 3)];
  const units = [{ unitId: "one", owner: "player" }, { unitId: "two", owner: "enemy" }, { unitId: "three", owner: "enemy" }];
  assert.deepEqual(createUnitCombatFeedback(events, units, "BLOCK"), [
    { unitId: "one", label: "-7  🛡-2 · +2", tone: "damage", amount: 11 },
    { unitId: "two", label: "+5", tone: "heal", amount: 5 },
    { unitId: "three", label: "🛡-3", tone: "armor", amount: 3 },
  ]);
});

test("zero hits and overheals stay quiet, while a real block remains explicit", () => {
  const units = [{ unitId: "one", owner: "player" }];
  assert.deepEqual(createUnitCombatFeedback([damage("one", 0, 0), heal("one", 0)], units, "BLOCK"), []);
  assert.deepEqual(createUnitCombatFeedback([{ type: "unit_block", unitId: "one" }], units, "BLOCK"), [
    { unitId: "one", label: "BLOCK", tone: "block", amount: 0 },
  ]);
});

test("busy steps choose at most two strongest labels per side without event-order bias", () => {
  const units = ["player", "enemy"].flatMap((owner) => Array.from({ length: 6 }, (_, slot) => ({ unitId: `${owner}-${slot}`, owner })));
  const events = units.flatMap((unit, index) => [damage(unit.unitId, index + 1, 0), heal(unit.unitId, 1)]);
  const result = createUnitCombatFeedback(events, units, "BLOCK");
  assert.deepEqual(result.map((item) => item.unitId), ["player-5", "player-4", "enemy-5", "enemy-4"]);
  assert.equal(result.length, 4);
  assert.equal(new Set(result.map((item) => item.unitId)).size, result.length);
});

test("real unit HUD hides every vitals object at death and cannot mutate a replaced unit", () => {
  const scene = new HeadlessBattleScene();
  scene.add = { container: makeObject, rectangle: makeObject, ellipse: makeObject, text: makeObject };
  scene.createUnitArt = () => ({ objects: [] });
  scene.updateUnitSpatialStyle = () => {};
  scene.getHomePosition = () => ({ x: 100, y: 400 });
  scene.createUnit({ unitId: "one", cardId: "phantom_duelist", owner: "player", slotIndex: 0, upgradeLevel: 0, startHp: 12, maxHp: 12 });
  const view = scene.unitViews.get("one");
  assert.equal(view.vitals.children.length, 5, "one parent owns backing, HP bar/fill, number and armor");
  assert.equal(view.vitals.visible, true);
  assert.equal(view.hpLabel.text, "12/12");
  assert.equal(view.armorLabel.visible, false);
  scene.updateUnitArmor(view, 4);
  scene.updateUnitHp(view, 3);
  assert.equal(view.armorLabel.text, "🛡 4");
  assert.equal(view.armorLabel.visible, true);
  assert.equal(view.hpLabel.x, -10);
  assert.equal(view.hpLabel.text, "3/12");
  scene.updateUnitHp(view, 0);
  scene.updateUnitArmor(view, 0);
  assert.equal(view.vitals.visible, false, "fallen bodies do not leave black 0-HP panels");
  assert.equal(view.hpFill.visible, false);
  assert.equal(view.armorLabel.visible, false);
  scene.unitViews.delete("one");
  scene.updateUnitHp(view, 12);
  scene.updateUnitArmor(view, 8);
  assert.equal(view.vitals.visible, false);
  assert.equal(view.armorLabel.visible, false);
});

function makeObject(x = 0, y = 0) {
  return {
    x, y, visible: true, children: [],
    add(children) { this.children.push(...children); return this; },
    setOrigin() { return this; }, setStrokeStyle() { return this; },
    setVisible(visible) { this.visible = visible; return this; },
    setText(text) { this.text = text; return this; },
    setX(nextX) { this.x = nextX; return this; },
    setDisplaySize(width, height) { this.width = width; this.height = height; return this; },
  };
}

function damage(unitId, amount, shieldAbsorbed) { return { type: "unit_damage", unitId, amount, shieldAbsorbed }; }
function heal(unitId, amount) { return { type: "unit_heal", unitId, amount }; }
