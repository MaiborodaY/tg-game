import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeroUI } from '../hero-ui.ts';
import { createHero, heroXpForLevel } from '../hero.ts';
import { createHeroFixture } from './helpers/hero-ui-dom.mjs';

test('hero panel shows level, talent gates and maximum progress while skipping unchanged renders', () => {
  const f = createHeroFixture(createHeroUI, createHero());
  assert.equal(f.ref('level').textContent, 'Level 1 / 20');
  assert.equal(f.ref('points').textContent, '0 points');
  assert.equal(f.button.querySelector('.hero-trigger-level').textContent, 'Lv.1');
  assert.equal(f.button.querySelector('.hero-trigger-points').hidden, true);
  assert.equal(f.panel.nodes.length, 12);
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

test('talent selection and spending emit only successful changes, including during a running wave', () => {
  const f = createHeroFixture(createHeroUI, createHero({ xp: heroXpForLevel(5) }));
  f.select('heal_power');
  assert.equal(f.ref('detail-name').textContent, 'Healing Light');
  assert.equal(f.ref('spend').disabled, false);
  f.click(f.ref('spend'), true);
  assert.deepEqual(f.changes, [{ type: 'talent', id: 'heal_power', spent: true, reason: '', rank: 1 }]);
  assert.equal(f.hero.talents.heal_power, 1);
  assert.equal(f.ref('detail-rank').textContent, '1/3');
  f.setBattle({ phase: 'running' }); f.ui.render();
  assert.equal(f.ref('timing').textContent, 'Battle continues. Talent changes apply next wave.');
  assert.equal(f.ref('reset').disabled, true);
  f.click(f.ref('reset')); assert.equal(f.changes.length, 1);
  f.click(f.ref('spend')); assert.equal(f.hero.talents.heal_power, 2);
  assert.equal(f.changes.length, 2);
  f.select('miracle'); f.click(f.ref('spend'));
  assert.equal(f.ref('spend').disabled, true);
  assert.equal(f.changes.length, 2);
  f.ui.destroy();
});

test('free reset works between waves, stays silent with no spent points and removes click listeners on destroy', () => {
  const f = createHeroFixture(createHeroUI, createHero({ xp: heroXpForLevel(5), talents: { heal_power: 2 } }));
  f.click(f.ref('reset'), true);
  assert.deepEqual(f.changes, [{ type: 'reset', reset: true, refunded: 2 }]);
  assert.equal(f.hero.talents.heal_power, 0);
  assert.equal(f.ref('reset').disabled, true);
  f.click(f.ref('reset')); assert.equal(f.changes.length, 1);
  f.select('heal_power'); f.ui.destroy(); f.ui.destroy();
  assert.equal(f.panel.listeners.get('click').size, 0);
  f.click(f.ref('spend')); assert.equal(f.hero.talents.heal_power, 0);
  // Existing API permits explicit render after destruction; destruction removes event ownership only.
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

test('talent details explain each progression block and reflect learned ranks', () => {
  const cases = [
    [{ xp: heroXpForLevel(5), talents: { heal_power: 3 } }, 'heal_power', 'Fully learned'],
    [{ xp: 0 }, 'miracle', 'Requires Lv. 20 + 6 Light points'],
    [{ xp: heroXpForLevel(5) }, 'heal_shield', 'Requires Healing Light rank 1'],
    [{ xp: heroXpForLevel(20) }, 'miracle', 'Requires 6 Light points (0/6)'],
    [{ xp: heroXpForLevel(20), talents: { heal_power: 3, heal_shield: 3, miracle: 1 } }, 'bastion', 'Only one final talent. Reset to switch.'],
    [{ xp: heroXpForLevel(2), talents: { heal_power: 1 } }, 'aura_power', 'Gain a level for another point'],
  ];
  for (const [saved, talent, expected] of cases) {
    const f = createHeroFixture(createHeroUI, createHero(saved));
    f.select(talent);
    assert.equal(f.ref('detail-gate').textContent, expected);
    assert.equal(f.ref('spend').disabled, true);
    if (expected === 'Fully learned') assert.equal(f.ref('spend').textContent, 'Learned');
    f.ui.destroy();
  }
});
