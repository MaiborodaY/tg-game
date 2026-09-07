import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import postcss from "postcss";

import {
  createRoundDamagePresentation,
  getRoundDamageBarMaximum,
  getRoundDamageBarRatio,
} from "../src/roundDamagePresentation.ts";

test("damage bars share the largest contribution instead of a separate scale per army", () => {
  const player = [12, 6, 3];
  const enemy = [6, 2];
  const maximum = getRoundDamageBarMaximum([...player, ...enemy]);
  assert.equal(maximum, 12);
  assert.deepEqual(player.map((amount) => getRoundDamageBarRatio(amount, maximum)), [1, 0.5, 0.25]);
  assert.deepEqual(enemy.map((amount) => getRoundDamageBarRatio(amount, maximum)), [0.5, 1 / 6]);
  assert.deepEqual(player, [12, 6, 3], "Visual scaling never mutates recorded amounts");
});

test("empty, zero, negative and invalid damage do not produce invalid bar geometry", () => {
  assert.equal(getRoundDamageBarMaximum([]), 0);
  assert.equal(getRoundDamageBarMaximum([0, -4, NaN, Infinity, -Infinity]), 0);
  assert.equal(getRoundDamageBarMaximum([-4, NaN, Infinity, 8]), 8);
  for (const amount of [0, -3, NaN, Infinity, -Infinity]) {
    assert.equal(getRoundDamageBarRatio(amount, 8), 0);
  }
  for (const maximum of [0, -3, NaN, Infinity, -Infinity]) {
    assert.equal(getRoundDamageBarRatio(8, maximum), 0);
  }
  assert.equal(getRoundDamageBarRatio(10, 5), 1, "A stale maximum cannot overflow the track");
});

test("equal, fractional and very large contributions preserve proportional lengths", () => {
  const equal = [9, 9, 9];
  const maximum = getRoundDamageBarMaximum(equal);
  assert.deepEqual(equal.map((amount) => getRoundDamageBarRatio(amount, maximum)), [1, 1, 1]);
  assert.equal(getRoundDamageBarRatio(0.25, 1), 0.25);
  assert.equal(getRoundDamageBarRatio(Number.MAX_VALUE / 2, Number.MAX_VALUE), 0.5);
  assert.equal(getRoundDamageBarRatio(Number.MAX_VALUE, Number.MAX_VALUE), 1);
});

test("the damage scale includes full aggregated unit, armor and synergy amounts", () => {
  const presentation = createRoundDamagePresentation("player", [], [
    { source: { kind: "unit", unit: { instanceId: "caster" } }, hpDamage: 5, armorDamage: 2, eventCount: 1 },
    { source: { kind: "unit", unit: { instanceId: "caster" } }, hpDamage: 3, armorDamage: 0, eventCount: 1 },
    { source: { kind: "synergy", owner: "player", tag: "mage", threshold: 4 }, hpDamage: 16, armorDamage: 4, eventCount: 1 },
  ]);
  const amounts = [...presentation.units, ...presentation.synergies].map(({ amount }) => amount);
  const maximum = getRoundDamageBarMaximum(amounts);
  assert.deepEqual(amounts, [10, 20]);
  assert.equal(maximum, 20);
  assert.deepEqual(amounts.map((amount) => getRoundDamageBarRatio(amount, maximum)), [0.5, 1]);
});

const main = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const theme = postcss.parse(await readFile(new URL("../src/round-damage-theme.css", import.meta.url), "utf8"));
const summary = main.match(/function createRoundInsightsSummary\([\s\S]*?\n\}/)?.[0] ?? "";
const row = main.match(/function createRoundDamageRow\([\s\S]*?\n\}/)?.[0] ?? "";

test("all damage rows retain their number, source and explicit owner independently of the decorative bar", () => {
  assert.match(summary, /const maximumDamage = getRoundDamageBarMaximum\(sides\.flatMap/);
  assert.match(summary, /\[\.\.\.presentation\.units, \.\.\.presentation\.synergies\]/);
  assert.match(summary, /\[\.\.\.unitRows, \.\.\.synergyRows\]\.forEach/);
  assert.match(summary, /row\.dataset\.owner = owner/);
  assert.match(row, /owner\.textContent = `\$\{ownerLabel\} ·`/);
  assert.match(row, /value\.textContent = String\(amount\)/);
  assert.match(row, /row\.setAttribute\("aria-label", accessibleLabel\)/);
  assert.match(row, /track\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(row, /if \(amount !== undefined\) \{[\s\S]*?track\.append\(fill\)/);
  assert.doesNotMatch(row, /role.*progressbar|aria-valuenow/, "Contribution graphics do not announce task progress");
  const ratioAssignments = main.match(/getRoundDamageBarRatio\(amount, maximumDamage\)/g);
  assert.equal(ratioAssignments?.length, 2, "Unit and synergy rows use the same normalized ratio");
});

test("damage-bar styling is gameplay-only, remains quiet and keeps numbers out of the colored area", () => {
  const declarations = new Map();
  theme.walkRules((rule) => {
    for (const selector of rule.selectors) {
      assert.match(selector, /^:where\(\.stage--draft, \.stage--battle, \.stage--finished\) /);
      assert.doesNotMatch(selector, /main-menu|body|:root/);
      const values = new Map();
      rule.walkDecls((declaration) => {
        values.set(declaration.prop, declaration.value);
        assert.doesNotMatch(declaration.prop, /^(?:animation|transition|filter)/, "Statistics must not pulse or animate over battle results");
      });
      declarations.set(selector.split(" ").at(-1), values);
    }
  });
  const track = declarations.get(".round-result-damage__track");
  assert.equal(track.get("grid-column"), "1");
  assert.equal(track.get("height"), "3px");
  assert.equal(track.get("pointer-events"), "none");
  const value = declarations.get(".round-result-damage__value");
  assert.equal(value.get("grid-column"), "2");
  assert.equal(value.get("grid-row"), "1 / 3");
  const fillRules = [];
  theme.walkRules((rule) => {
    if (rule.selector.endsWith(" .round-result-damage__fill")) {
      rule.walkDecls("width", (declaration) => fillRules.push(declaration.value));
    }
  });
  assert.deepEqual(fillRules, ["calc(var(--round-damage-ratio, 0) * 100%)"]);
});
