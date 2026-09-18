import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeroUI } from '../hero-ui.ts';
import { createHero, heroXpForLevel, HERO_TALENTS, HERO_TALENT_VERSION } from '../hero.ts';
import { HERO_TALENT_ART_CELLS, talentArtStyle } from '../talent-art.ts';
import { createHeroFixture } from './helpers/hero-ui-dom.mjs';

const savedHero = (level, talents = {}) => createHero({ xp: heroXpForLevel(level), talentVersion: HERO_TALENT_VERSION, talents });
const talentNode = (f, id) => f.panel.nodes.find(node => node.dataset.heroTalent === id);

test('hero panel starts with three locked skills, eighteen tree nodes and exact prerequisite links', () => {
  const f = createHeroFixture(createHeroUI, createHero());
  assert.equal(f.ref('level').textContent, 'Level 1 / 20');
  assert.equal(f.ref('points').textContent, '0 points');
  assert.equal(f.ref('stats').textContent, '60 HP · 4 hit');
  assert.equal(f.button.querySelector('.hero-trigger-level').textContent, 'Lv.1');
  assert.equal(f.button.querySelector('.hero-trigger-points').hidden, true);
  assert.equal(f.panel.nodes.length, 18);
  assert.equal(f.panel.branches.length, 3);
  const expectedLinks = HERO_TALENTS.flatMap(talent => talent.prerequisites.map(parent => `${parent}:${talent.id}`));
  assert.deepEqual(f.panel.links.map(link => `${link.dataset.heroParent}:${link.dataset.heroLink}`), expectedLinks);
  assert.equal(f.ref('detail-name').textContent, 'Healing Light');
  assert.equal(f.ref('reset').disabled, true);
  const writes = f.writes; f.ui.render(); assert.equal(f.writes, writes);
  f.hero.xp = heroXpForLevel(20); f.ui.render();
  assert.equal(f.ref('xp').textContent, 'Maximum level');
  assert.equal(f.ref('points').textContent, '19 points');
  assert.equal(f.button.querySelector('.hero-trigger-points').textContent, '19');
  assert.equal(f.button.querySelector('.hero-trigger-points').hidden, false);
  assert.equal(f.panel.querySelector('.hero-xp-track').firstElementChild.style.width, '100%');
  assert.equal(f.panel.querySelector('.hero-xp-track').attributes.get('aria-valuemax'), '1');
  f.ui.destroy();
});

test('selecting only previews a skill; confirming learns it and unlocks its linked improvements', () => {
  const f = createHeroFixture(createHeroUI, savedHero(5));
  f.select('heal_power');
  assert.equal(f.ref('detail-name').textContent, 'Radiant Light');
  assert.equal(f.ref('spend').disabled, true);
  assert.match(f.ref('detail-effect').textContent, /^Not learned → /);
  assert.equal(f.changes.length, 0);
  f.click(f.ref('spend')); assert.equal(f.changes.length, 0);
  f.select('heal_unlock');
  assert.equal(f.hero.talents.heal_unlock, 0);
  assert.equal(f.ref('spend').disabled, false);
  f.click(f.ref('spend'), true);
  assert.deepEqual(f.changes, [{ type: 'talent', id: 'heal_unlock', spent: true, reason: '', rank: 1 }]);
  assert.equal(f.hero.talents.heal_unlock, 1);
  assert.equal(f.ref('detail-rank').textContent, '1/1');
  assert.match(f.ref('stats').textContent, /heal/);
  assert.doesNotMatch(f.ref('stats').textContent, /aura|hammer/);
  assert.equal(f.panel.branches[0].textContent, '1 pt');
  assert.equal(talentNode(f, 'heal_unlock').classes.has('is-learned'), true);
  assert.equal(talentNode(f, 'heal_power').classes.has('is-available'), true);
  assert.equal(talentNode(f, 'heal_power').querySelector('.hero-node-gate').hidden, true);
  assert.equal(f.panel.links.find(link => link.dataset.heroLink === 'heal_power').classes.has('is-ready'), true);
  f.select('heal_power'); f.click(f.ref('spend'));
  assert.equal(f.ref('detail-rank').textContent, '1/3');
  assert.match(f.ref('detail-effect').textContent, /HP per heal → .*HP per heal/);
  assert.equal(f.panel.links.find(link => link.dataset.heroLink === 'heal_power').classes.has('is-learned'), true);
  f.ui.destroy();
});

test('running-wave learning updates the next-wave plan while reset remains blocked', () => {
  const f = createHeroFixture(createHeroUI, savedHero(5), { phase: 'running' });
  assert.equal(f.ref('timing').textContent, 'Battle continues. Changes apply next wave.');
  f.select('hammer_unlock'); f.click(f.ref('spend'));
  assert.equal(f.hero.talents.hammer_unlock, 1);
  assert.equal(f.changes.length, 1);
  assert.equal(f.ref('reset').disabled, true);
  f.click(f.ref('reset')); assert.equal(f.changes.length, 1);
  f.select('hammer_power'); f.click(f.ref('spend'));
  assert.equal(f.hero.talents.hammer_power, 1);
  assert.equal(f.changes.length, 2);
  f.select('heavenly_hammer'); f.click(f.ref('spend'));
  assert.equal(f.ref('spend').disabled, true);
  assert.equal(f.changes.length, 2);
  f.ui.destroy();
});

test('free reset removes learned skills and remains silent with no spent points', () => {
  const f = createHeroFixture(createHeroUI, savedHero(5, { heal_unlock: 1, heal_power: 2 }));
  f.click(f.ref('reset'), true);
  assert.deepEqual(f.changes, [{ type: 'reset', reset: true, refunded: 3 }]);
  assert.equal(f.hero.talents.heal_power, 0);
  assert.doesNotMatch(f.ref('stats').textContent, /heal|aura|hammer/);
  assert.equal(f.ref('reset').disabled, true);
  f.click(f.ref('reset')); assert.equal(f.changes.length, 1);
  f.select('heal_unlock'); f.ui.destroy(); f.ui.destroy();
  assert.equal(f.panel.listeners.get('click').size, 0);
  f.click(f.ref('spend')); assert.equal(f.hero.talents.heal_unlock, 0);
  // Explicit rendering remains safe after event ownership ends.
  f.hero.xp = heroXpForLevel(6); f.ui.render();
  assert.equal(f.ref('level').textContent, 'Level 6 / 20');
});

test('backdrop and nested close-icon clicks close once and stop bubbling', () => {
  const f = createHeroFixture(createHeroUI, createHero());
  f.click(f.panel); f.click(f.panel.querySelector('[data-close-overlay]'), true);
  assert.equal(f.closed, 2); assert.equal(f.stopped, 2);
  f.click(f.ref('stats')); assert.equal(f.closed, 2);
  f.ui.destroy();
});

test('talent details distinguish missing prerequisites, branch investment, levels and exhausted points', () => {
  const cases = [
    [savedHero(5, { heal_unlock: 1, heal_power: 3 }), 'heal_power', 'Fully learned'],
    [savedHero(1), 'miracle', 'Requires Lv. 20 + 10 Light points'],
    [savedHero(5), 'heal_power', 'Requires Healing Light'],
    [savedHero(20, { heal_unlock: 1, heal_power: 1 }), 'heal_shield', 'Requires 5 Light points (2/5)'],
    [savedHero(20, { heal_unlock: 1, heal_power: 3, heal_haste: 1, heal_shield: 1, second_target: 1 }), 'miracle', 'Requires 10 Light points (7/10)'],
    [savedHero(20, { heal_unlock: 1, heal_power: 3, heal_haste: 3, heal_shield: 2 }), 'miracle', 'Requires Shared Light'],
    [savedHero(2, { heal_unlock: 1 }), 'aura_unlock', 'Gain a level for another point'],
  ];
  for (const [hero, talent, expected] of cases) {
    const f = createHeroFixture(createHeroUI, hero);
    f.select(talent);
    assert.equal(f.ref('detail-gate').textContent, expected);
    assert.equal(f.ref('spend').disabled, true);
    if (expected === 'Fully learned') assert.equal(f.ref('spend').textContent, 'Learned');
    f.ui.destroy();
  }
});

test('every talent can be inspected including both parents of final talents without spending', () => {
  const f = createHeroFixture(createHeroUI, savedHero(20));
  for (const talent of HERO_TALENTS) {
    f.select(talent.id);
    assert.equal(f.ref('detail-name').textContent, talent.name);
    assert.equal(talentNode(f, talent.id).attributes.get('aria-pressed'), 'true');
    assert.equal(f.panel.nodes.filter(node => node.classes.has('is-selected')).length, 1);
    assert.match(f.ref('detail-effect').textContent, /^Not learned → .+/);
    assert.equal(f.ref('detail-description').textContent, talent.description);
  }
  f.select('miracle');
  assert.equal(f.ref('detail-gate').textContent, 'Requires Overflowing Light + Shared Light');
  assert.equal(f.changes.length, 0);
  assert.equal(f.ref('points').textContent, '19 points');
  f.ui.destroy();
});

test('all eighteen illustrations follow selection without changing allocations or rewriting an unchanged panel', () => {
  const f = createHeroFixture(createHeroUI, savedHero(8, { heal_unlock: 1, heal_power: 2, aura_unlock: 1 }));
  const beforeHero = structuredClone(f.hero);
  const seenArt = new Set();
  assert.deepEqual(Object.keys(HERO_TALENT_ART_CELLS).sort(), HERO_TALENTS.map(talent => talent.id).sort(),
    'every talent has an illustration');
  for (const talent of HERO_TALENTS) {
    f.select(talent.id);
    const style = f.ref('detail-art').attributes.get('style');
    assert.equal(style, talentArtStyle(talent.id), `detail shows the selected ${talent.id} crop`);
    assert.ok(f.panel.innerHTML.includes(`style="${style}"`), 'selected illustration also exists in the static tree');
    seenArt.add(style);
    assert.deepEqual(f.hero, beforeHero, 'previewing artwork preserves XP and allocations');
    assert.deepEqual(f.changes, [], 'selection does not request a save or spend');
    const writes = f.writes, snapshot = f.snapshot();
    f.ui.render(); f.ui.render();
    assert.equal(f.writes, writes, 'unchanged render does not write to the DOM');
    assert.deepEqual(f.snapshot(), snapshot);
  }
  assert.equal(seenArt.size, 18, 'each talent has its own atlas crop');
  f.select('hammer_unlock');
  f.click(f.ref('spend'));
  assert.equal(f.hero.talents.hammer_unlock, 1, 'the explicit Learn action still allocates one point');
  assert.equal(f.ref('detail-art').attributes.get('style'), talentArtStyle('hammer_unlock'));
  assert.deepEqual(f.changes, [{ type: 'talent', id: 'hammer_unlock', spent: true, reason: '', rank: 1 }]);
  f.ui.destroy();
});
