import assert from 'node:assert/strict';
import test from 'node:test';
import { HERO_MAX_LEVEL, HERO_BRANCHES, HERO_TALENTS, createHero, getHeroProgress, getHeroStats, getHeroTalentStatus,
  heroXpForLevel, spendHeroTalent, resetHeroTalents, awardHeroXp } from '../hero.ts';

const atLevel = (level, talents = {}) => createHero({ xp: heroXpForLevel(level), talents });
const learn = (hero, id, ranks = 1) => {
  for (let rank = 0; rank < ranks; rank += 1) assert.equal(spendHeroTalent(hero, id).spent, true, `learn ${id} rank ${rank + 1}`);
};

test('a fresh hero has all three base abilities and no free talent points', () => {
  const hero = createHero();
  assert.equal(getHeroProgress(hero).level, 1);
  assert.equal(getHeroProgress(hero).availablePoints, 0);
  assert.equal(Object.values(hero.talents).every(rank => rank === 0), true);
  const stats = getHeroStats(hero);
  assert.deepEqual([stats.maxHp, stats.damage, stats.attackInterval], [60, 4, 1.2]);
  assert.deepEqual([stats.healAmount, stats.healCooldown, stats.auraReduction, stats.auraRadius], [2, 8, .02, 80]);
  assert.deepEqual([stats.hammerDamage, stats.hammerCooldown, stats.hammerRange, stats.hammerStunDuration], [4, 12, 150, 0]);
  assert.equal(stats.healShield, 0);
  assert.equal(stats.miracle || stats.bastion || stats.heavenlyHammer, false);
});

test('levels 2 through 20 grant exactly 19 points and XP thresholds are cumulative', () => {
  for (let level = 1; level <= HERO_MAX_LEVEL; level += 1) {
    const progress = getHeroProgress(atLevel(level));
    assert.equal(progress.level, level);
    assert.equal(progress.earnedPoints, level - 1);
    assert.equal(progress.availablePoints, level - 1);
    if (level > 1) assert.equal(getHeroProgress(createHero({ xp: heroXpForLevel(level) - 1 })).level, level - 1);
  }
  const maximum = getHeroProgress(createHero({ xp: Number.MAX_SAFE_INTEGER }));
  assert.equal(maximum.level, 20);
  assert.equal(maximum.maxLevel, true);
  assert.equal(maximum.ratio, 1);
  assert.equal(maximum.availablePoints, 19);
});

test('malformed saves are sanitized without trusting saved level or unknown fields', () => {
  for (const invalid of [undefined, null, [], 12, 'hero', false]) assert.deepEqual(createHero(invalid), createHero());
  for (const xp of [-5, Infinity, NaN, '18050', 10.5, {}, Number.MAX_VALUE]) assert.equal(createHero({ xp }).xp, 0);
  const saved = { xp: 50, highestWave: -1, level: 20, money: 123, talents: { heal_power: 999, aura_power: 3, unknown: 19 } };
  const sanitized = createHero(saved);
  assert.deepEqual(Object.keys(sanitized), ['xp', 'highestWave', 'talents']);
  assert.equal(sanitized.highestWave, 0);
  assert.equal(sanitized.talents.heal_power, 1);
  assert.equal(sanitized.talents.aura_power, 0);
  assert.equal(Object.hasOwn(sanitized.talents, 'unknown'), false);
  assert.equal(saved.talents.heal_power, 999, 'loading does not mutate the supplied save');
  assert.equal(spendHeroTalent(sanitized, '__proto__').spent, false);
});

test('sanitization removes ranks whose level or prerequisite was not earned', () => {
  const early = atLevel(4, { heal_power: 1, heal_shield: 3, second_target: 3, miracle: 1 });
  assert.equal(early.talents.heal_power, 1);
  assert.equal(early.talents.heal_shield, 0);
  assert.equal(early.talents.second_target, 0);
  assert.equal(early.talents.miracle, 0);
  const orphan = atLevel(20, { heal_shield: 3, second_target: 3, hammer_splash: 3, heavenly_hammer: 1 });
  assert.equal(getHeroProgress(orphan).spentPoints, 0);
  const fractional = atLevel(20, { heal_power: 1.5, aura_power: -1, hammer_power: '3' });
  assert.equal(getHeroProgress(fractional).spentPoints, 0);
});

test('sanitization enforces both total point budget and a single capstone', () => {
  const saturated = atLevel(20, Object.fromEntries(HERO_TALENTS.map(node => [node.id, node.maxRank])));
  assert.equal(getHeroProgress(saturated).spentPoints, 19);
  assert.equal(getHeroProgress(saturated).availablePoints, 0);
  const doubleCapstone = atLevel(20, { heal_power: 3, heal_shield: 3, miracle: 1,
    aura_power: 3, aura_radius: 3, bastion: 1 });
  assert.equal(doubleCapstone.talents.miracle, 1);
  assert.equal(doubleCapstone.talents.bastion, 0);
  assert.equal(getHeroProgress(doubleCapstone).spentPoints, 13);
});

test('ordinary talents enforce levels 2, 5, 10 and the previous node', () => {
  assert.equal(spendHeroTalent(atLevel(1), 'heal_power').reason, 'level');
  const hero = atLevel(4);
  learn(hero, 'heal_power');
  assert.equal(spendHeroTalent(hero, 'heal_shield').reason, 'level');
  hero.xp = heroXpForLevel(5);
  learn(hero, 'heal_shield');
  assert.equal(spendHeroTalent(hero, 'second_target').reason, 'level');
  hero.xp = heroXpForLevel(10);
  learn(hero, 'second_target');
  assert.equal(spendHeroTalent(hero, 'hammer_haste').reason, 'prerequisite');
  learn(hero, 'heal_power', 2);
  assert.equal(spendHeroTalent(hero, 'heal_power').reason, 'maxed');
});

test('spent points cannot be reused until reset and each rank costs exactly one', () => {
  const hero = atLevel(2);
  learn(hero, 'aura_power');
  assert.equal(getHeroProgress(hero).availablePoints, 0);
  assert.equal(spendHeroTalent(hero, 'hammer_power').reason, 'points');
  const before = structuredClone(hero);
  assert.equal(spendHeroTalent(hero, 'aura_power').spent, false);
  assert.deepEqual(hero, before);
});

test('capstones require level 20, six branch points, and a global choice', () => {
  const hero = atLevel(19);
  learn(hero, 'heal_power', 3);
  learn(hero, 'heal_shield', 3);
  assert.equal(spendHeroTalent(hero, 'miracle').reason, 'level');
  hero.xp = heroXpForLevel(20);
  assert.equal(getHeroTalentStatus(hero, 'bastion').reason, 'branch');
  learn(hero, 'aura_power', 3);
  learn(hero, 'aura_radius', 3);
  learn(hero, 'miracle');
  assert.equal(getHeroProgress(hero).availablePoints, 6);
  assert.equal(spendHeroTalent(hero, 'bastion').reason, 'capstone');
  assert.equal(hero.talents.bastion, 0);
});

test('free reset preserves XP and wave history and restores every point', () => {
  const hero = atLevel(20, { heal_power: 3, heal_shield: 3, miracle: 1 });
  hero.highestWave = 200;
  assert.deepEqual(resetHeroTalents(hero), { reset: true, refunded: 7 });
  assert.equal(hero.xp, heroXpForLevel(20));
  assert.equal(hero.highestWave, 200);
  assert.equal(getHeroProgress(hero).availablePoints, 19);
  assert.deepEqual(resetHeroTalents(hero), { reset: false, refunded: 0 });
  learn(hero, 'hammer_power', 3);
  learn(hero, 'hammer_haste', 3);
  learn(hero, 'heavenly_hammer');
  assert.equal(getHeroStats(hero).hammerStunDuration, .8);
});

test('level stats grow linearly while cooldowns and ranges do not auto-grow', () => {
  const first = getHeroStats(atLevel(1)), last = getHeroStats(atLevel(20));
  assert.equal(last.maxHp, 117);
  assert.equal(last.damage, 7.8);
  assert.equal(last.healAmount, 3.9);
  assert.equal(last.hammerDamage, 7.8);
  for (const key of ['attackInterval', 'healCooldown', 'healRange', 'auraRadius', 'hammerCooldown', 'hammerRange']) {
    assert.equal(last[key], first[key], key);
  }
});

test('talent effects match their ranks and returned combat stats are independent snapshots', () => {
  const hero = atLevel(20, { heal_power: 3, heal_shield: 3, second_target: 3,
    hammer_power: 3, hammer_haste: 3, hammer_splash: 3, heavenly_hammer: 1 });
  const snapshot = getHeroStats(hero);
  assert.ok(Math.abs(snapshot.healAmount - 7.41) < 1e-9);
  assert.equal(snapshot.healShield, 11.7);
  assert.equal(snapshot.secondaryHealFraction, .75);
  assert.equal(snapshot.hammerDamage, 13.65);
  assert.equal(snapshot.hammerCooldown, 9);
  assert.equal(snapshot.hammerSplashFraction, .75);
  assert.equal(snapshot.hammerStunDuration, .8);
  resetHeroTalents(hero);
  assert.equal(snapshot.hammerStunDuration, .8);
  assert.equal(snapshot.healShield, 11.7);
  assert.equal(getHeroStats(hero).hammerStunDuration, 0);
  const protector = getHeroStats(atLevel(20, { aura_power: 3, aura_radius: 3, emergency_guard: 3, bastion: 1 }));
  assert.equal(protector.auraReduction, .11);
  assert.equal(protector.auraRadius, 110);
  assert.equal(protector.emergencyGuardReduction, .4);
  assert.equal(protector.bastion, true);
});

test('unique victories reach level 20 near wave 200', () => {
  const hero = createHero();
  let maxLevelWave = null;
  for (let waveNumber = 1; waveNumber <= 210; waveNumber += 1) {
    const result = awardHeroXp(hero, { waveNumber, kills: 20, total: 20, won: true });
    if (result.level === 20 && maxLevelWave === null) maxLevelWave = waveNumber;
    if (waveNumber === 100) assert.ok(result.level < 20);
  }
  assert.ok(maxLevelWave >= 195 && maxLevelWave <= 205, `level 20 at wave ${maxLevelWave}`);
  assert.equal(hero.highestWave, 210);
  assert.equal(hero.xp, heroXpForLevel(20));
});

test('replays grant reduced XP and defeat rewards depend on actual kills', () => {
  const hero = createHero(), outcome = { waveNumber: 12, kills: 10, total: 10, won: true };
  const first = awardHeroXp(hero, outcome), repeated = awardHeroXp(hero, outcome);
  assert.equal(first.gained, 24);
  assert.equal(repeated.gained, 6);
  const before = hero.xp;
  assert.equal(awardHeroXp(hero, { waveNumber: 13, kills: 0, total: 10, won: false }).gained, 0);
  assert.equal(hero.xp, before);
  const partial = awardHeroXp(hero, { waveNumber: 13, kills: 2, total: 10, won: false });
  assert.ok(partial.gained > 0 && partial.gained < first.gained);
  assert.equal(hero.highestWave, 12, 'losing does not consume a first clear');
  const next = awardHeroXp(hero, { waveNumber: 13, kills: 10, total: 10, won: true });
  assert.ok(next.gained > repeated.gained);
  assert.ok(hero.xp > before);
});

test('invalid outcomes cannot poison or lower XP', () => {
  const hero = atLevel(3), before = structuredClone(hero);
  for (const outcome of [null, {}, { waveNumber: 0, kills: 1, total: 1, won: true },
    { waveNumber: 1, kills: -1, total: 1, won: true }, { waveNumber: 1, kills: 1, total: 0, won: true },
    { waveNumber: 1, kills: Infinity, total: 1, won: true }, { waveNumber: 1, kills: 1, total: 1, won: 'yes' }]) {
    assert.equal(awardHeroXp(hero, outcome).gained, 0);
    assert.deepEqual(hero, before);
  }
  const result = awardHeroXp(hero, { waveNumber: 1, kills: 10, total: 1, won: true });
  assert.equal(result.gained, 16, 'kill fraction is capped at 100%');
});

test('JSON save reload preserves a legal mixed build and repeat-clear history', () => {
  const hero = atLevel(20, { heal_power: 3, heal_shield: 1, aura_power: 3, aura_radius: 3,
    emergency_guard: 3, bastion: 1, hammer_power: 3, hammer_haste: 2 });
  hero.highestWave = 188;
  assert.deepEqual(createHero(JSON.parse(JSON.stringify(hero))), hero);
  assert.equal(getHeroProgress(hero).spentPoints, 19);
  assert.equal(getHeroStats(hero).bastion, true);
});

test('XP thresholds clamp finite levels without coercing malformed level inputs', () => {
  for (const [level, expected] of [[-2, 0], [1.99, 0], [2.99, 50], [20, 18050], [999, 18050]]) {
    assert.equal(heroXpForLevel(level), expected);
  }
  for (const invalid of [undefined, null, '20', [], {}, NaN, Infinity, -Infinity, 20n, Symbol('level')]) {
    assert.equal(heroXpForLevel(invalid), 0);
  }
});

test('omitted outcomes and malformed numeric fields leave the hero untouched', () => {
  const hero = atLevel(3), before = structuredClone(hero);
  const noReward = { gained: 0, level: 3, previousLevel: 3, leveledUp: false };
  assert.deepEqual(awardHeroXp(hero), noReward);
  for (const field of ['waveNumber', 'kills', 'total']) {
    for (const invalid of ['1', null, true, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1, 1n, Symbol(field)]) {
      const outcome = { waveNumber: 1, kills: 1, total: 1, won: true, [field]: invalid };
      assert.deepEqual(awardHeroXp(hero, outcome), noReward, field);
      assert.deepEqual(hero, before, field);
    }
  }
  for (const invalid of [undefined, null, [], false, 'hero', 5]) {
    assert.deepEqual(resetHeroTalents(invalid), { reset: false, refunded: 0 });
    assert.equal(spendHeroTalent(invalid, 'heal_power').spent, false);
    assert.deepEqual(awardHeroXp(invalid, { waveNumber: 1, kills: 1, total: 1, won: true }),
      { gained: 0, level: 1, previousLevel: 1, leveledUp: false });
  }
});

test('talent mutations normalize partial objects while preserving their identity and unrelated fields', () => {
  const marker = { preserved: true };
  const hero = { xp: 50, highestWave: 4, talents: { heal_power: 0 }, marker };
  const savedTalents = hero.talents;
  assert.deepEqual(spendHeroTalent(hero, 'heal_power'), { spent: true, reason: '', rank: 1 });
  assert.equal(hero.marker, marker);
  assert.notEqual(hero.talents, savedTalents);
  assert.deepEqual(savedTalents, { heal_power: 0 });
  assert.deepEqual(Object.keys(hero.talents), HERO_TALENTS.map(talent => talent.id));
  const learnedTalents = hero.talents;
  assert.deepEqual(resetHeroTalents(hero), { reset: true, refunded: 1 });
  assert.equal(learnedTalents.heal_power, 1, 'reset replaces ranks without mutating the previous snapshot');
  assert.equal(hero.talents.heal_power, 0);
  assert.equal(hero.xp, 50);
  assert.equal(hero.highestWave, 4);
  assert.equal(hero.marker, marker);
});

test('rewards round before the XP cap and victories still advance history at the cap', () => {
  const hero = createHero({ xp: heroXpForLevel(20) - 2, highestWave: 4 });
  const previousTalents = hero.talents;
  const outcome = { waveNumber: 5, kills: 1, total: 1, won: true };
  const uncapped = createHero();
  assert.equal(awardHeroXp(uncapped, outcome).gained, 19, '18.75 XP rounds to 19');
  assert.deepEqual(awardHeroXp(hero, outcome), { gained: 2, level: 20, previousLevel: 19, leveledUp: true });
  assert.equal(hero.xp, heroXpForLevel(20));
  assert.notEqual(hero.talents, previousTalents);
  assert.equal(hero.highestWave, 5);
  assert.deepEqual(awardHeroXp(hero, { ...outcome, waveNumber: 6 }),
    { gained: 0, level: 20, previousLevel: 20, leveledUp: false });
  assert.equal(hero.highestWave, 6);
});

test('hero definitions stay frozen while constructed state and stat snapshots stay mutable', () => {
  for (const definitions of [HERO_BRANCHES, HERO_TALENTS]) {
    assert.equal(Object.isFrozen(definitions), true);
    assert.equal(definitions.every(Object.isFrozen), true);
  }
  const hero = createHero(), stats = getHeroStats(hero);
  assert.equal(Object.isFrozen(hero), false);
  assert.equal(Object.isFrozen(hero.talents), false);
  assert.equal(Object.isFrozen(stats), false);
  stats.maxHp = 1;
  assert.equal(getHeroStats(hero).maxHp, 60);
});
