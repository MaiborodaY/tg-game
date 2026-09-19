import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecruitment, getElfRecruitUnlock, getRecruitChances, getRecruitProgress, getUnitStats, receiveRecruit, RECRUIT_COST } from '../recruitment.ts';
import { createBarracks, consumeFirstLancerGuarantee } from '../barracks.ts';
import { restoreCampaignRoster } from '../campaign-roster.ts';
import { createProgression } from '../progression.ts';
import { getConnectResult } from '../unit-merging.ts';
import { getUnitCellWidth, getUnitCells, getUnitPosition, canPlaceUnit } from '../unit-footprint.ts';
import { positionForCell } from '../field.ts';
import { createForge, getForgedUnitStats } from '../forge.ts';

const unlocked = { pool: 'elves', elvesUnlocked: true };

test('old saves gain zero elf-archer training without inheriting human archer or rider progress', () => {
  for (const version of [1, 2]) {
    const saved = { version, received: { archer: 130, pantherRider: 51 },
      legacyTrainingCredit: { archer: 88, pantherRider: 17 }, lastType: 'archer' };
    const untouched = structuredClone(saved), state = createRecruitment(saved);
    assert.deepEqual(getRecruitProgress(state, 'elfArcher'),
      { type: 'elfArcher', level: 1, received: 0, progress: 0, needed: 5 });
    assert.equal(state.legacyTrainingCredit.elfArcher, 0);
    assert.equal(state.received.archer, 130);
    assert.equal(state.received.pantherRider, 51);
    assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(state))), state);
    assert.deepEqual(saved, untouched);
  }
  const legacy = createRecruitment({ version: 1, received: { elfArcher: 12 }, legacyTrainingCredit: { elfArcher: 999 } });
  assert.equal(legacy.received.elfArcher, 12);
  assert.equal(legacy.legacyTrainingCredit.elfArcher, 0, 'Historical human compensation does not apply to newly introduced elves');
});

test('elf archer training increases on its own receipts and keeps the human lancer guarantee pending', () => {
  const state = createRecruitment({ version: 2, received: { pantherRider: 15 } });
  const barracks = createBarracks({ level: 3, firstLancerPending: true });
  const awarded = [];
  for (let index = 0; index < 15; index++) {
    const recruit = receiveRecruit(state, () => .5, { ...unlocked, guaranteedLancer: true });
    assert.equal(recruit.type, 'elfArcher');
    awarded.push(recruit.level);
    assert.equal(consumeFirstLancerGuarantee(barracks, recruit.type), false);
  }
  assert.equal(RECRUIT_COST, 1);
  assert.deepEqual(awarded, [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3]);
  assert.equal(getRecruitProgress(state, 'pantherRider').received, 15);
  assert.equal(getRecruitProgress(state, 'archer').received, 0);
  assert.deepEqual(getRecruitProgress(state, 'elfArcher'), { type: 'elfArcher', level: 3, received: 15, progress: 0, needed: 15 });
  assert.equal(barracks.firstLancerPending, true);
  assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(state))), state);
  state.received.swordsman = 140;
  const human = receiveRecruit(state, () => { throw new Error('The pending human guarantee must not roll'); },
    { guaranteedLancer: barracks.firstLancerPending });
  assert.equal(human.type, 'lancer');
  assert.equal(consumeFirstLancerGuarantee(barracks, human.type), true);
});

test('the receipt reaching Rider training level three is still a rider; only the following rolls can award an archer', () => {
  const state = createRecruitment({ version: 2, received: { pantherRider: 14 } });
  assert.equal(getRecruitProgress(state, 'pantherRider').level, 2);
  assert.deepEqual(getRecruitChances('elves', state), [{ type: 'pantherRider', chance: 1 }]);
  assert.equal(getElfRecruitUnlock(state, 'elfArcher', 3).available, false);
  const fifteenth = receiveRecruit(state, () => .999999, unlocked);
  assert.equal(fifteenth.type, 'pantherRider');
  assert.equal(fifteenth.level, 3);
  assert.equal(fifteenth.leveledUp, true);
  assert.equal(getElfRecruitUnlock(state, 'elfArcher', 3).available, true);
  assert.deepEqual(getRecruitChances('elves', state), [{ type: 'pantherRider', chance: .5 }, { type: 'elfArcher', chance: .5 }]);
  assert.equal(receiveRecruit(state, () => .5, unlocked).type, 'elfArcher');
  assert.equal(state.received.pantherRider, 15);
  assert.equal(state.received.elfArcher, 1);
});

test('personal Rider levels and extra options cannot bypass receipt-based archer unlock', () => {
  const state = createRecruitment();
  const connected = getConnectResult([], [{ id: 1, type: 'pantherRider', level: 1 }, { id: 2, type: 'pantherRider', level: 2 }],
    { location: 'reserve', id: 1 }, [{ location: 'reserve', id: 2 }], { minArmyUnits: 0 });
  assert.equal(connected.ok, true);
  assert.equal(connected.recipient.level, 3);
  assert.equal(getElfRecruitUnlock(state, 'elfArcher', 3).available, false);
  assert.deepEqual(getRecruitChances('elves'), [{ type: 'pantherRider', chance: 1 }], 'Missing training data cannot silently open the new type');
  assert.equal(receiveRecruit(state, () => .999999, { ...unlocked, elfArcherUnlocked: true,
    guaranteedElfArcher: true, personalRiderLevel: 500 }).type, 'pantherRider');
  assert.equal(state.received.elfArcher, 0);
});

test('previous elf archer receipts survive a locked gate without unlocking it or replacing owned fighters', () => {
  const state = createRecruitment({ version: 2, received: { elfArcher: 51, archer: 100, pantherRider: 0 }, lastType: 'elfArcher' });
  assert.equal(getRecruitProgress(state, 'elfArcher').level, 5);
  assert.equal(getElfRecruitUnlock(state, 'elfArcher', 3).available, false);
  assert.equal(receiveRecruit(state, () => .99, unlocked).type, 'pantherRider', 'Closed Archer receipts do not count toward the healer threshold');
  assert.equal(state.received.elfArcher, 51);
  assert.deepEqual(createRecruitment(JSON.parse(JSON.stringify(state))), state);
  const restored = restoreCampaignRoster([{ type: 'elfArcher', level: 100, col: 2, row: 0 }],
    [{ type: 'elfArcher', level: 4 }], createProgression());
  assert.equal(restored.units[0].level, 100);
  assert.equal(restored.reserve[0].level, 4);
});

test('shared elf unlock details expose faction totals and keep the faction building gate', () => {
  const state = createRecruitment({ version: 2, received: { pantherRider: 15, elfArcher: 4 } });
  assert.deepEqual(getElfRecruitUnlock(state, 'pantherRider', 3), { requirementsMet: true, available: true,
    requiredRecruitType: null, requiredRecruitLevel: null, requiredLevelTotal: null, levelTotal: 4, requiredBarracksLevel: 3 });
  assert.deepEqual(getElfRecruitUnlock(state, 'elfArcher', 3), { requirementsMet: true, available: true,
    requiredRecruitType: 'pantherRider', requiredRecruitLevel: 3, requiredLevelTotal: null, levelTotal: 4, requiredBarracksLevel: 3 });
  assert.deepEqual(getElfRecruitUnlock(state, 'elfHealer', 3), { requirementsMet: false, available: false,
    requiredRecruitType: null, requiredRecruitLevel: null, requiredLevelTotal: 5, levelTotal: 4, requiredBarracksLevel: 3 });
  receiveRecruit(state, () => .5, unlocked);
  assert.equal(getElfRecruitUnlock(state, 'elfHealer', 3).requirementsMet, true);
  assert.equal(getElfRecruitUnlock(state, 'elfHealer', 3).available, true);
  assert.deepEqual(getElfRecruitUnlock(state, 'unicorn', 3), { requirementsMet: false, available: false,
    requiredRecruitType: null, requiredRecruitLevel: null, requiredLevelTotal: 10, levelTotal: 6, requiredBarracksLevel: 3 });
  assert.deepEqual(getElfRecruitUnlock(state, 'unicorn', 4), { requirementsMet: false, available: false,
    requiredRecruitType: null, requiredRecruitLevel: null, requiredLevelTotal: 10, levelTotal: 6, requiredBarracksLevel: 3 });
  assert.deepEqual(getRecruitChances('elves', state).map(entry => entry.type), ['pantherRider', 'elfArcher', 'elfHealer']);
  for (const tier of [undefined, null, '3', '4', 0, 1, 2, 3.5, 5, Infinity, NaN]) {
    for (const id of ['pantherRider', 'elfArcher', 'elfHealer', 'unicorn']) assert.equal(getElfRecruitUnlock(state, id, tier).available, false);
  }
  for (const id of ['archer', 'unknown', '__proto__']) assert.throws(() => getElfRecruitUnlock(state, id, 3), RangeError);
});

test('elf archers restore in either roster and Connect only with matching elves, preserving recipient identity', () => {
  const progression = createProgression();
  const roster = restoreCampaignRoster([{ type: 'elfArcher', col: 2, row: 0, level: 99 },
    { type: 'swordsman', col: 2, row: 1, level: 1 }],
  [{ type: 'elfArcher', level: 3 }, { type: 'archer', level: 500 }, { type: 'pantherRider', level: 50 }], progression);
  const original = structuredClone(roster);
  for (const id of [4, 5]) {
    const rejected = getConnectResult(roster.units, roster.reserve, { location: 'army', id: 1 }, [{ location: 'reserve', id }]);
    assert.equal(rejected.reason, 'different-type');
    assert.deepEqual(roster, original, 'A rejected connection does not consume either fighter');
  }
  for (const recipientLocation of ['army', 'reserve']) {
    const recipientId = recipientLocation === 'army' ? 1 : 3;
    const donor = recipientLocation === 'army' ? { location: 'reserve', id: 3 } : { location: 'army', id: 1 };
    const connected = getConnectResult(roster.units, roster.reserve, { location: recipientLocation, id: recipientId }, [donor]);
    assert.equal(connected.ok, true);
    assert.equal(connected.recipient.id, recipientId);
    assert.equal(connected.recipient.type, 'elfArcher');
    assert.equal(connected.recipient.level, 102);
    const saved = JSON.parse(JSON.stringify({ units: connected.units, reserve: connected.reserve }));
    const restored = restoreCampaignRoster(saved.units, saved.reserve, progression);
    const elf = [...restored.units, ...restored.reserve].find(unit => unit.type === 'elfArcher');
    assert.equal(elf.level, 102);
    assert.equal([...restored.units, ...restored.reserve].filter(unit => unit.type === 'elfArcher').length, 1);
    if (recipientLocation === 'army') assert.deepEqual([elf.col, elf.row], [2, 0]);
    assert.equal(connected.reserve.find(unit => unit.type === 'archer').level, 500);
  }
});

test('an elf archer occupies exactly one purchased cell and uses its centre', () => {
  const unit = { id: 1, type: 'elfArcher', level: 1, col: 4, row: 2 };
  assert.equal(getUnitCellWidth(unit.type), 1);
  assert.deepEqual(getUnitCells(unit), ['4:2']);
  assert.deepEqual(getUnitPosition(unit), positionForCell(4, 2));
  assert.equal(canPlaceUnit(unit, [], ['4:2']), true, 'Rightmost bought cell needs no extra space');
  assert.equal(canPlaceUnit(unit, [], ['3:2']), false);
  assert.equal(canPlaceUnit(unit, [{ ...unit, id: 2, type: 'archer' }], ['4:2']), false);
});

test('elf archer levels use existing additive growth and every shared Forge track', () => {
  assert.deepEqual(getUnitStats('elfArcher', 1), { level: 1, hp: 45, damage: 11, heal: 0 });
  for (const level of [1, 10, 50, 100, 500]) {
    const elf = getUnitStats('elfArcher', level), human = getUnitStats('archer', level);
    assert.ok(elf.hp > human.hp && elf.damage > human.damage, `An elf improves its human role at level ${level}`);
    assert.equal(elf.hp, Math.round(45 * (1 + (level - 1) * .05)));
    assert.equal(elf.damage, Math.round(11 * (1 + (level - 1) * .05)));
  }
  assert.ok(getUnitStats('elfArcher', 1).hp < getUnitStats('archer', 100).hp, 'No hidden old-army catch-up');
  const forge = createForge({ health: 20, attack: 30, attackSpeed: 40 });
  const stats = getUnitStats('elfArcher', 11), forged = getForgedUnitStats('elfArcher', 11, forge);
  assert.equal(forged.hp, stats.hp * 1.2);
  assert.equal(forged.damage, stats.damage * 1.3);
  assert.equal(forged.attackSpeed, 1.4);
});
