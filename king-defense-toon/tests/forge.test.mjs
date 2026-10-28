import assert from 'node:assert/strict';
import test from 'node:test';
import { createForge, restoreForge, FORGE_MAX_RANK, FORGE_UPGRADES, forgeUpgradeCost, getForgedUnitStats, upgradeForge } from '../forge.ts';
import { getUnitStats } from '../recruitment.ts';
import { UNIT_TYPES } from '../units.ts';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test('old saves have no forge bonus and every unit retains its existing level curve', () => {
  const empty = createForge();
  assert.deepEqual(empty, { health: 0, attack: 0, attackSpeed: 0 });
  assert.deepEqual(FORGE_UPGRADES.map(({ id }) => id), ['health', 'attack', 'attackSpeed']);
  for (const { id } of UNIT_TYPES) for (const level of [1, 4, 100, 500, Number.MAX_SAFE_INTEGER]) {
    assert.deepEqual(getForgedUnitStats(id, level), { ...getUnitStats(id, level), attackSpeed: 1 });
    assert.deepEqual(getForgedUnitStats(id, level, empty), getForgedUnitStats(id, level));
  }
  assert.ok(Object.isFrozen(FORGE_UPGRADES));
  assert.ok(FORGE_UPGRADES.every(Object.isFrozen));
});

test('forge save restoration sanitizes only invalid ranks and survives JSON round trips', () => {
  const empty = createForge();
  for (const source of [undefined, null, false, true, 0, '5', [], NaN]) assert.deepEqual(createForge(source), empty);
  for (const rank of [-1, .5, 101, NaN, Infinity, '1', null, false, {}, []]) {
    assert.deepEqual(createForge({ attack: rank, health: 10 }), { ...empty, health: 10 });
  }
  const source = Object.freeze({ health: 1, attack: 12, attackSpeed: 25 });
  const restored = createForge(source);
  assert.deepEqual(restored, source);
  assert.notEqual(restored, source);
  assert.deepEqual(createForge(JSON.parse(JSON.stringify(restored))), restored);
});

test('each purchase costs its current rank price and increments only the selected branch', () => {
  for (const { id } of FORGE_UPGRADES) {
    const forge = createForge();
    const first = 50;
    const step = 25;
    assert.equal(forgeUpgradeCost(forge, id), first);
    assert.deepEqual(upgradeForge(forge, id, first), { upgraded: true, gold: 0 });
    assert.equal(forgeUpgradeCost(forge, id), first + step);
    assert.deepEqual(forge, { ...createForge(), [id]: 1 });
    assert.deepEqual(upgradeForge(forge, id, 1000), { upgraded: true, gold: 1000 - first - step });
  }
});

test('failed purchases preserve all ranks and gold, including invalid runtime inputs', () => {
  const original = createForge();
  for (const gold of [-1, 0, 49, 50.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '50', null]) {
    const forge = { ...original };
    assert.deepEqual(upgradeForge(forge, 'health', gold), { upgraded: false, gold });
    assert.deepEqual(forge, original);
  }
  for (const id of ['constructor', '__proto__', 'hero', 'heal', 'rangedAttack', 'rangedAttackSpeed', undefined, null, 1]) {
    const forge = { ...original };
    assert.equal(forgeUpgradeCost(forge, id), null);
    assert.deepEqual(upgradeForge(forge, id, 500), { upgraded: false, gold: 500 });
    assert.deepEqual(forge, original);
  }
  for (const forge of [null, {}, [], { ...original, attack: -1 }, { ...original, health: 101 }]) {
    const before = structuredClone(forge);
    assert.equal(forgeUpgradeCost(forge, 'attackSpeed'), null);
    assert.deepEqual(upgradeForge(forge, 'attackSpeed', 500), { upgraded: false, gold: 500 });
    assert.deepEqual(forge, before);
  }
});

test('the last forge rank can be bought once and the explicit cap is saved unchanged', () => {
  for (const { id } of FORGE_UPGRADES) {
    const forge = createForge({ [id]: FORGE_MAX_RANK - 1 });
    const cost = forgeUpgradeCost(forge, id);
    assert.equal(upgradeForge(forge, id, cost).upgraded, true);
    assert.equal(forge[id], FORGE_MAX_RANK);
    assert.equal(forgeUpgradeCost(forge, id), null);
    assert.deepEqual(upgradeForge(forge, id, 100000), { upgraded: false, gold: 100000 });
    assert.equal(createForge(forge)[id], FORGE_MAX_RANK);
  }
});

test('one-percent purchases retain fractional HP, damage and healing at level one', () => {
  const forge = createForge({ health: 1, attack: 1, attackSpeed: 1 });
  const sword = getForgedUnitStats('swordsman', 1, forge);
  const healer = getForgedUnitStats('healer', 1, forge);
  close(sword.hp, 60.6);
  close(sword.damage, 6.06);
  close(sword.attackSpeed, 1.01);
  close(healer.hp, 36.36);
  close(healer.heal, 4.04);
  assert.equal(healer.damage, 0);
  for (const { id } of UNIT_TYPES) {
    const stats = getForgedUnitStats(id, 500, forge), base = getUnitStats(id, 500);
    close(stats.hp, base.hp * 1.01);
    close(stats.damage, base.damage * 1.01);
    close(stats.heal, base.heal * 1.01);
  }
});

test('shared bonuses apply the same percentages to every live regular unit including archers', () => {
  const forge = createForge({ health: 5, attack: 10, attackSpeed: 20 });
  for (const { id: type } of UNIT_TYPES) {
    const stats = getForgedUnitStats(type, 1, forge), base = getUnitStats(type);
    close(stats.hp, base.hp * 1.05);
    close(stats.damage, base.damage * 1.1);
    close(stats.heal, base.heal * 1.1);
    close(stats.attackSpeed, 1.2);
  }
  const maximum = createForge(Object.fromEntries(FORGE_UPGRADES.map(({ id }) => [id, FORGE_MAX_RANK])));
  for (const { id } of UNIT_TYPES) for (const value of Object.values(getForgedUnitStats(id, Number.MAX_SAFE_INTEGER, maximum))) {
    assert.ok(Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER);
  }
  for (const type of ['hero', 'goblin', 'constructor']) assert.throws(() => getForgedUnitStats(type, 1, forge), RangeError);
});

test('legacy ranged ranks return the exact gold spent at every valid rank', () => {
  for (const id of ['rangedAttack', 'rangedAttackSpeed']) {
    let paid = 0;
    for (let rank = 0; rank <= FORGE_MAX_RANK; rank++) {
      const saved = Object.freeze({ health: 7, attack: 13, attackSpeed: 21, [id]: rank });
      const restored = restoreForge(saved);
      assert.equal(restored.refund, paid, `${id} rank ${rank}`);
      assert.deepEqual(restored.forge, { health: 7, attack: 13, attackSpeed: 21 });
      assert.deepEqual(saved, { health: 7, attack: 13, attackSpeed: 21, [id]: rank });
      paid += 25 + 15 * rank;
    }
  }
  assert.equal(restoreForge({ rangedAttack: 100, rangedAttackSpeed: 100 }).refund, 153500);
});

test('normalizing and saving a migrated forge prevents refund replay and preserves its shared ranks', () => {
  const saved = Object.freeze({ health: 2, attack: 17, attackSpeed: 9, rangedAttack: 3, rangedAttackSpeed: 2 });
  const first = restoreForge(saved);
  assert.equal(first.refund, 120 + 65);
  assert.deepEqual(first.forge, { health: 2, attack: 17, attackSpeed: 9 });
  assert.deepEqual(restoreForge(first.forge), { forge: first.forge, refund: 0 });
  assert.deepEqual(restoreForge(JSON.parse(JSON.stringify(first.forge))), { forge: first.forge, refund: 0 });
});

test('invalid legacy ranks do not mint a refund and cannot erase valid shared upgrades', () => {
  for (const value of [-1, .5, 101, Number.MAX_SAFE_INTEGER, NaN, Infinity, '5', null, false, {}, []]) {
    for (const id of ['rangedAttack', 'rangedAttackSpeed']) {
      const other = id === 'rangedAttack' ? 'rangedAttackSpeed' : 'rangedAttack';
      assert.deepEqual(restoreForge({ health: 3, attack: 4, attackSpeed: 5, [id]: value, [other]: 1 }),
        { forge: { health: 3, attack: 4, attackSpeed: 5 }, refund: 25 });
    }
  }
  for (const source of [undefined, null, false, true, 0, '5', [], NaN]) {
    assert.deepEqual(restoreForge(source), { forge: createForge(), refund: 0 });
  }
  assert.equal(restoreForge(Object.create({ rangedAttack: 10, rangedAttackSpeed: 10 })).refund, 0);
});

test('legacy ranged fields never leave hidden bonuses after their controls are removed', () => {
  const shared = { health: 3, attack: 9, attackSpeed: 11 };
  const legacy = { ...shared, rangedAttack: 100, rangedAttackSpeed: 100 };
  assert.deepEqual(createForge(legacy), shared);
  for (const { id } of UNIT_TYPES) {
    assert.deepEqual(getForgedUnitStats(id, 11, legacy), getForgedUnitStats(id, 11, shared));
    assert.deepEqual(getForgedUnitStats(id, 1, { rangedAttack: 100, rangedAttackSpeed: 100 }), getForgedUnitStats(id, 1));
  }
});
