import assert from 'node:assert/strict';
import test from 'node:test';
import { HERO_MAX_LEVEL, HERO_TALENT_VERSION, HERO_BRANCHES, HERO_TALENTS, createHero, getHeroProgress,
  getHeroStats, getHeroTalentStatus, getHeroTalentEffect, heroXpForLevel, spendHeroTalent,
  resetHeroTalents, awardHeroXp } from '../hero.ts';

const atLevel = (level, talents = {}) => createHero({ xp: heroXpForLevel(level), talentVersion: HERO_TALENT_VERSION, talents });
const fullBranch = branch => Object.fromEntries(HERO_TALENTS.filter(node => node.branch === branch).map(node => [node.id, node.maxRank]));
const learn = (hero, id, ranks = 1) => {
  for (let rank = 0; rank < ranks; rank += 1) assert.equal(spendHeroTalent(hero, id).spent, true, `learn ${id} rank ${rank + 1}`);
};
const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-9, `${value} ~= ${expected}`);

test('fresh heroes have ordinary melee stats but no learned abilities or free points', () => {
  const hero = createHero(), stats = getHeroStats(hero);
  assert.equal(hero.talentVersion, 2);
  assert.equal(getHeroProgress(hero).level, 1);
  assert.equal(getHeroProgress(hero).availablePoints, 0);
  assert.equal(Object.values(hero.talents).every(rank => rank === 0), true);
  assert.deepEqual([stats.maxHp, stats.damage, stats.attackInterval], [60, 4, 1.2]);
  for (const key of ['healUnlocked', 'auraUnlocked', 'hammerUnlocked', 'miracle', 'bastion', 'heavenlyHammer']) {
    assert.equal(stats[key], false, key);
  }
  for (const key of ['healAmount', 'healCooldown', 'healRange', 'healShield', 'healShieldDuration', 'secondaryHealFraction',
    'auraReduction', 'auraRadius', 'emergencyGuardReduction', 'emergencyGuardThreshold', 'guardianWardFraction',
    'guardianWardThreshold', 'guardianWardDuration', 'guardianWardCooldown', 'hammerDamage', 'hammerCooldown',
    'hammerRange', 'hammerSplashFraction', 'hammerSplashRadius', 'holyStrikeFraction', 'holyStrikeDuration',
    'miracleHealFraction', 'miracleRadius', 'miracleThreshold', 'bastionReduction', 'bastionDuration',
    'bastionInterval', 'hammerStunDuration']) assert.equal(stats[key], 0, key);
});

test('each branch has six connected nodes in a 1-2-2-1 layout and costs twelve points', () => {
  assert.equal(HERO_TALENTS.length, 18);
  assert.equal(new Set(HERO_TALENTS.map(node => node.id)).size, 18);
  for (const branch of HERO_BRANCHES) {
    const nodes = HERO_TALENTS.filter(node => node.branch === branch.id);
    assert.deepEqual(nodes.map(node => [node.row, node.column]), [[0, 1], [1, 0], [1, 2], [2, 0], [2, 2], [3, 1]]);
    assert.deepEqual(nodes.map(node => node.maxRank), [1, 3, 3, 2, 2, 1]);
    assert.deepEqual(nodes.map(node => node.branchRequired), [0, 0, 0, 5, 5, 10]);
    assert.deepEqual(nodes[0].prerequisites, []);
    for (const node of nodes.slice(1)) {
      assert.ok(node.prerequisites.length);
      for (const id of node.prerequisites) {
        const parent = nodes.find(candidate => candidate.id === id);
        assert.ok(parent && parent.row === node.row - 1);
      }
    }
    assert.deepEqual(nodes[5].prerequisites, nodes.slice(3, 5).map(node => node.id));
    assert.equal(nodes.reduce((sum, node) => sum + node.maxRank, 0), 12);
  }
});

test('levels 2 through 20 grant exactly nineteen points and clamp cumulative XP', () => {
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

test('the first selected root opens only its own skill and all roots can be mixed by level four', () => {
  assert.equal(spendHeroTalent(atLevel(1), 'heal_unlock').reason, 'level');
  const hero = atLevel(2);
  assert.equal(spendHeroTalent(hero, 'heal_power').reason, 'prerequisite');
  learn(hero, 'heal_unlock');
  let stats = getHeroStats(hero);
  assert.deepEqual([stats.healUnlocked, stats.auraUnlocked, stats.hammerUnlocked], [true, false, false]);
  near(stats.healAmount, 4.2);
  assert.equal(spendHeroTalent(hero, 'aura_unlock').reason, 'points');
  hero.xp = heroXpForLevel(4);
  learn(hero, 'aura_unlock');
  learn(hero, 'hammer_unlock');
  stats = getHeroStats(hero);
  assert.deepEqual([stats.healUnlocked, stats.auraUnlocked, stats.hammerUnlocked], [true, true, true]);
  assert.equal(getHeroProgress(hero).spentPoints, 3);
  assert.equal(stats.auraReduction, .04);
  near(stats.hammerDamage, 6.9);
});

test('tier-three nodes require five other points in their branch and their own linked parent', () => {
  const hero = atLevel(20);
  learn(hero, 'heal_unlock');
  learn(hero, 'heal_power', 3);
  assert.equal(getHeroTalentStatus(hero, 'heal_shield').reason, 'branch');
  learn(hero, 'hammer_unlock');
  learn(hero, 'hammer_power', 3);
  assert.equal(getHeroTalentStatus(hero, 'heal_shield').reason, 'branch', 'other branches cannot fund a row');
  learn(hero, 'heal_haste');
  learn(hero, 'heal_shield', 2);
  learn(hero, 'second_target', 2);
  assert.equal(getHeroTalentStatus(hero, 'heal_shield').reason, 'maxed');
  const wrongParent = atLevel(20, { heal_unlock: 1, heal_power: 3, heal_haste: 0, heal_shield: 2 });
  assert.equal(getHeroTalentStatus(wrongParent, 'second_target').reason, 'prerequisite');
});

test('final talents require level twenty, ten other branch points and both tier-three parents', () => {
  const hero = atLevel(19, { ...fullBranch('light'), miracle: 0 });
  assert.equal(getHeroTalentStatus(hero, 'miracle').reason, 'level');
  hero.xp = heroXpForLevel(20);
  learn(hero, 'miracle');
  assert.equal(getHeroProgress(hero).spentPoints, 12);
  assert.equal(getHeroStats(hero).miracle, true);
  const short = atLevel(20, { heal_unlock: 1, heal_power: 3, heal_haste: 3, heal_shield: 1, second_target: 1 });
  assert.equal(getHeroTalentStatus(short, 'miracle').reason, 'branch');
  learn(short, 'heal_shield');
  learn(short, 'miracle');
  assert.equal(getHeroProgress(short).spentPoints, 11, 'minimum final build uses eleven points');
  const missingParent = atLevel(20, { heal_unlock: 1, heal_power: 3, heal_haste: 3, heal_shield: 2 });
  assert.equal(getHeroTalentStatus(missingParent, 'miracle').reason, 'prerequisite');
});

test('nineteen-point budget permits cross-branch choices but cannot buy two final talents', () => {
  const hero = atLevel(20, fullBranch('light'));
  learn(hero, 'aura_unlock');
  learn(hero, 'aura_power', 3);
  learn(hero, 'aura_radius', 3);
  assert.equal(getHeroProgress(hero).spentPoints, 19);
  assert.equal(spendHeroTalent(hero, 'guardian_ward').reason, 'points');
  const forged = atLevel(20, { ...fullBranch('light'), ...fullBranch('protection'), ...fullBranch('judgement') });
  assert.equal(getHeroProgress(forged).spentPoints, 19);
  assert.ok(HERO_TALENTS.filter(node => node.capstone && forged.talents[node.id]).length <= 1);
});

test('unversioned old allocations refund once while preserving XP and cleared-wave history', () => {
  const old = { xp: heroXpForLevel(20), highestWave: 188, talents: { heal_power: 3, heal_shield: 3, miracle: 1 } };
  const before = structuredClone(old), hero = createHero(old);
  assert.equal(hero.xp, old.xp);
  assert.equal(hero.highestWave, 188);
  assert.equal(hero.talentVersion, 2);
  assert.equal(getHeroProgress(hero).availablePoints, 19);
  assert.deepEqual(old, before, 'loading does not mutate the supplied save');
  learn(hero, 'aura_unlock');
  learn(hero, 'aura_power', 2);
  const reload = createHero(JSON.parse(JSON.stringify(hero)));
  assert.deepEqual(reload, hero);
  assert.equal(getHeroProgress(reload).spentPoints, 3);
  awardHeroXp(reload, { waveNumber: 189, kills: 5, total: 5, won: true });
  assert.equal(reload.talents.aura_power, 2);
  assert.equal(reload.talentVersion, 2);
  for (const talentVersion of [undefined, 1, 3, '2', null]) {
    assert.equal(getHeroProgress(createHero({ ...hero, talentVersion })).spentPoints, 0);
  }
});

test('forged nodes cannot fund themselves, orphan descendants, or mutually unlock a locked row', () => {
  for (const talents of [
    { heal_power: 3, heal_shield: 2, second_target: 2, miracle: 1 },
    { heal_unlock: 1, heal_power: 3, heal_shield: 2 },
    { heal_unlock: 1, heal_power: 1, heal_haste: 1, heal_shield: 2, second_target: 2 },
  ]) {
    const hero = atLevel(20, talents);
    assert.equal(hero.talents.heal_shield, 0);
    assert.equal(hero.talents.second_target, 0);
    assert.equal(hero.talents.miracle, 0);
  }
  const selfFundedFinal = atLevel(20, { heal_unlock: 1, heal_power: 3, heal_haste: 3, heal_shield: 1, second_target: 1, miracle: 1 });
  assert.equal(selfFundedFinal.talents.miracle, 0);
  assert.equal(getHeroProgress(selfFundedFinal).spentPoints, 9);
});

test('sanitization is independent of saved key order and retains legal sibling-funded builds', () => {
  const talents = { heal_unlock: 1, heal_power: 1, heal_haste: 3, heal_shield: 1, second_target: 2,
    hammer_unlock: 1, hammer_power: 3, hammer_haste: 2, hammer_splash: 2, holy_strike: 2, heavenly_hammer: 1 };
  const forward = atLevel(20, talents);
  const reverse = atLevel(20, Object.fromEntries(Object.entries(talents).reverse()));
  assert.deepEqual(forward, reverse);
  assert.equal(getHeroProgress(forward).spentPoints, 19);
  assert.equal(forward.talents.heal_shield, 1, 'later sibling points fund the earlier catalogue node');
  assert.equal(forward.talents.heavenly_hammer, 1);
  assert.deepEqual(createHero(forward), forward);
});

test('arbitrary malformed saves normalize idempotently within point budgets', () => {
  let seed = 917;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  const values = [0, 1, 2, 3, 99, -1, 1.5, NaN, Infinity, '3', null, {}, Number.MAX_SAFE_INTEGER];
  for (let attempt = 0; attempt < 250; attempt += 1) {
    const level = 1 + Math.floor(random() * 20);
    const talents = Object.fromEntries(HERO_TALENTS.map(node => [node.id, values[Math.floor(random() * values.length)]]));
    const hero = atLevel(level, talents);
    const reordered = atLevel(level, Object.fromEntries(Object.entries(talents).reverse()));
    assert.deepEqual(reordered, hero);
    assert.deepEqual(createHero(hero), hero);
    assert.ok(getHeroProgress(hero).spentPoints <= level - 1);
    for (const node of HERO_TALENTS) {
      assert.ok(Number.isInteger(hero.talents[node.id]) && hero.talents[node.id] <= node.maxRank);
      if (!hero.talents[node.id]) continue;
      assert.ok(level >= node.level);
      assert.ok(node.prerequisites.every(id => hero.talents[id] > 0));
      const other = HERO_TALENTS.filter(candidate => candidate.branch === node.branch && candidate.id !== node.id)
        .reduce((sum, candidate) => sum + hero.talents[candidate.id], 0);
      assert.ok(other >= node.branchRequired);
    }
  }
});

test('malformed raw values and unknown talent keys are sanitized without coercion', () => {
  for (const invalid of [undefined, null, [], 12, 'hero', false]) assert.deepEqual(createHero(invalid), createHero());
  for (const xp of [-5, Infinity, NaN, '18050', 10.5, {}, Number.MAX_VALUE]) assert.equal(createHero({ xp }).xp, 0);
  const hero = createHero({ xp: 50, highestWave: -1, talentVersion: 2, level: 20,
    talents: { heal_unlock: 999, aura_unlock: 1, unknown: 19 } });
  assert.deepEqual(Object.keys(hero), ['xp', 'highestWave', 'talentVersion', 'talents']);
  assert.equal(hero.highestWave, 0);
  assert.equal(hero.talents.heal_unlock, 1);
  assert.equal(hero.talents.aura_unlock, 0);
  assert.equal(Object.hasOwn(hero.talents, 'unknown'), false);
  for (const id of ['__proto__', 'constructor', 'unknown', null]) {
    assert.equal(spendHeroTalent(hero, id).spent, false);
    assert.equal(getHeroTalentEffect(hero, id), '');
  }
});

test('free reset preserves progression and version and restores every learned point', () => {
  const hero = atLevel(20, fullBranch('light'));
  hero.highestWave = 200;
  const oldTalents = hero.talents;
  assert.deepEqual(resetHeroTalents(hero), { reset: true, refunded: 12 });
  assert.equal(hero.xp, heroXpForLevel(20));
  assert.equal(hero.highestWave, 200);
  assert.equal(hero.talentVersion, 2);
  assert.equal(getHeroProgress(hero).availablePoints, 19);
  assert.equal(oldTalents.miracle, 1, 'reset keeps old snapshots independent');
  assert.deepEqual(resetHeroTalents(hero), { reset: false, refunded: 0 });
  assert.equal(getHeroStats(hero).healUnlocked, false);
});

test('base HP and damage retain linear five-percent growth without free abilities', () => {
  const first = getHeroStats(atLevel(1)), last = getHeroStats(atLevel(20));
  assert.equal(last.maxHp, 117);
  assert.equal(last.damage, 7.8);
  assert.equal(last.attackInterval, first.attackInterval);
  assert.equal(last.healAmount, 0);
  assert.equal(last.hammerDamage, 0);
});

test('all eighteen talents derive the approved rank effects from independent stat snapshots', () => {
  const healer = atLevel(20, fullBranch('light')), healing = getHeroStats(healer);
  near(healing.healAmount, 10.14);
  assert.equal(healing.healCooldown, 5.75);
  near(healing.healShield, 7.8);
  assert.equal(healing.healShieldDuration, 6);
  assert.equal(healing.secondaryHealFraction, .6);
  assert.equal(healing.miracle, true);
  assert.deepEqual([healing.miracleHealFraction, healing.miracleRadius, healing.miracleThreshold], [.15, 110, .3]);
  const protection = getHeroStats(atLevel(20, fullBranch('protection')));
  assert.deepEqual([protection.auraReduction, protection.auraRadius, protection.emergencyGuardReduction], [.1, 110, .25]);
  assert.deepEqual([protection.guardianWardFraction, protection.guardianWardThreshold,
    protection.guardianWardDuration, protection.guardianWardCooldown], [.12, .1, 4, 12]);
  assert.equal(protection.bastion, true);
  assert.deepEqual([protection.bastionReduction, protection.bastionDuration, protection.bastionInterval], [.12, 3, 18]);
  const judgement = getHeroStats(atLevel(20, fullBranch('judgement')));
  near(judgement.hammerDamage, 16.965);
  assert.deepEqual([judgement.hammerCooldown, judgement.hammerSplashFraction, judgement.hammerSplashRadius], [9, .5, 40]);
  assert.deepEqual([judgement.holyStrikeFraction, judgement.holyStrikeDuration, judgement.hammerStunDuration], [.5, 6, .8]);
  resetHeroTalents(healer);
  assert.equal(healing.miracle, true);
  assert.equal(getHeroStats(healer).miracle, false);
});

test('effect previews describe current and next rank without learning or modifying a save', () => {
  const hero = atLevel(20), before = structuredClone(hero);
  assert.equal(getHeroTalentEffect(hero, 'heal_unlock'), 'Not learned');
  assert.equal(getHeroTalentEffect(hero, 'heal_unlock', 1), '7.8 HP / 8s');
  assert.equal(getHeroTalentEffect(hero, 'heal_haste', 1), '7.25s healing cooldown');
  assert.equal(getHeroTalentEffect(hero, 'heal_haste', 2), '6.5s healing cooldown');
  assert.equal(getHeroTalentEffect(hero, 'heal_power', 3), '10.14 HP per heal');
  assert.equal(getHeroTalentEffect(hero, 'guardian_ward', 2), '12% HP shield / 4s');
  assert.equal(getHeroTalentEffect(hero, 'holy_strike', 2), 'Next attack +50% / 6s');
  for (const node of HERO_TALENTS) {
    assert.ok(getHeroTalentEffect(hero, node.id, node.maxRank).length > 0);
    assert.equal(getHeroTalentEffect(hero, node.id, 999), getHeroTalentEffect(hero, node.id, node.maxRank));
    assert.equal(getHeroTalentEffect(hero, node.id, -1), 'Not learned');
  }
  assert.deepEqual(hero, before);
});

test('unique victories reach level twenty near wave two hundred', () => {
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
  assert.equal(hero.talentVersion, 2);
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
  assert.equal(hero.highestWave, 12);
  assert.ok(awardHeroXp(hero, { waveNumber: 13, kills: 10, total: 10, won: true }).gained > repeated.gained);
});

test('XP thresholds clamp finite levels without coercing malformed inputs', () => {
  for (const [level, expected] of [[-2, 0], [1.99, 0], [2.99, 50], [20, 18050], [999, 18050]]) {
    assert.equal(heroXpForLevel(level), expected);
  }
  for (const invalid of [undefined, null, '20', [], {}, NaN, Infinity, -Infinity, 20n, Symbol('level')]) {
    assert.equal(heroXpForLevel(invalid), 0);
  }
});

test('omitted outcomes and malformed numeric fields leave the hero untouched', () => {
  const hero = atLevel(3, { heal_unlock: 1 }), before = structuredClone(hero);
  const noReward = { gained: 0, level: 3, previousLevel: 3, leveledUp: false };
  assert.deepEqual(awardHeroXp(hero), noReward);
  for (const outcome of [null, {}, { waveNumber: 0, kills: 1, total: 1, won: true },
    { waveNumber: 1, kills: -1, total: 1, won: true }, { waveNumber: 1, kills: 1, total: 0, won: true },
    { waveNumber: 1, kills: 1, total: 1, won: 'yes' }]) {
    assert.deepEqual(awardHeroXp(hero, outcome), noReward);
    assert.deepEqual(hero, before);
  }
  for (const field of ['waveNumber', 'kills', 'total']) {
    for (const invalid of ['1', null, true, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1, 1n, Symbol(field)]) {
      assert.deepEqual(awardHeroXp(hero, { waveNumber: 1, kills: 1, total: 1, won: true, [field]: invalid }), noReward, field);
      assert.deepEqual(hero, before, field);
    }
  }
  for (const invalid of [undefined, null, [], false, 'hero', 5]) {
    assert.deepEqual(resetHeroTalents(invalid), { reset: false, refunded: 0 });
    assert.equal(spendHeroTalent(invalid, 'heal_unlock').spent, false);
    assert.deepEqual(awardHeroXp(invalid, { waveNumber: 1, kills: 1, total: 1, won: true }),
      { gained: 0, level: 1, previousLevel: 1, leveledUp: false });
  }
  assert.equal(awardHeroXp(hero, { waveNumber: 1, kills: 10, total: 1, won: true }).gained, 16);
});

test('mutations normalize partial saves while preserving identity, version and unrelated fields', () => {
  const marker = { preserved: true }, hero = { xp: 50, highestWave: 4, talents: {}, marker };
  const oldTalents = hero.talents;
  assert.deepEqual(spendHeroTalent(hero, 'heal_unlock'), { spent: true, reason: '', rank: 1 });
  assert.equal(hero.marker, marker);
  assert.notEqual(hero.talents, oldTalents);
  assert.deepEqual(oldTalents, {});
  assert.equal(hero.talentVersion, 2);
  assert.equal(createHero(hero).talents.heal_unlock, 1);
  assert.deepEqual(resetHeroTalents(hero), { reset: true, refunded: 1 });
  assert.equal(hero.xp, 50);
  assert.equal(hero.highestWave, 4);
  assert.equal(hero.marker, marker);
});

test('rewards round before the XP cap and still advance victory history at maximum level', () => {
  const hero = createHero({ xp: heroXpForLevel(20) - 2, highestWave: 4 });
  const previousTalents = hero.talents, outcome = { waveNumber: 5, kills: 1, total: 1, won: true };
  assert.equal(awardHeroXp(createHero(), outcome).gained, 19);
  assert.deepEqual(awardHeroXp(hero, outcome), { gained: 2, level: 20, previousLevel: 19, leveledUp: true });
  assert.notEqual(hero.talents, previousTalents);
  assert.equal(hero.highestWave, 5);
  assert.deepEqual(awardHeroXp(hero, { ...outcome, waveNumber: 6 }),
    { gained: 0, level: 20, previousLevel: 20, leveledUp: false });
  assert.equal(hero.highestWave, 6);
});

test('definitions and prerequisite arrays stay frozen while states and stat snapshots remain mutable', () => {
  for (const definitions of [HERO_BRANCHES, HERO_TALENTS]) {
    assert.equal(Object.isFrozen(definitions), true);
    assert.equal(definitions.every(Object.isFrozen), true);
  }
  assert.equal(HERO_TALENTS.every(node => Object.isFrozen(node.prerequisites)), true);
  const hero = createHero(), stats = getHeroStats(hero);
  assert.equal(Object.isFrozen(hero), false);
  assert.equal(Object.isFrozen(hero.talents), false);
  assert.equal(Object.isFrozen(stats), false);
  stats.maxHp = 1;
  assert.equal(getHeroStats(hero).maxHp, 60);
});
