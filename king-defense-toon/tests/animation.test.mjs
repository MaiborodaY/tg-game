import assert from 'node:assert/strict';
import test from 'node:test';
import { allyAnimationFrame, allyDeathOpacity } from '../ally-animation.mjs';
import { tinyWarriorFrame } from '../tiny-warrior.mjs';
import { tinyLancerFrame } from '../tiny-lancer.mjs';
import { tinyTorchFrame } from '../tiny-torch.mjs';
import { tinyGoblinArcherFrame } from '../tiny-goblin-archer.mjs';
import { tinyGoblinChiefFrame } from '../tiny-goblin-chief.mjs';
import { tinyGoblinHealerFrame } from '../tiny-goblin-healer.mjs';
import { tinyBoarFrame } from '../tiny-boar.mjs';
import { tinyArcherFrame, tinyMonkIdleFrame, tinyMonkRunFrame, tinyMonkHealFrame } from '../tiny-support.mjs';
import { tinyKingFrame } from '../tiny-king.mjs';
import { tinyStKnihorFrame } from '../tiny-st-knihor.mjs';

test('every strike, shot and blessing reaches its authored contact pose on the combat impact tick', () => {
  const cases = [
    [allyAnimationFrame, 'attack', .45, 6, 7],
    [tinyWarriorFrame, 'attack', .45, 38, 39],
    [tinyLancerFrame, 'attack', .45, 30, 31],
    [tinyTorchFrame, 'attack', .45, 23, 24],
    [tinyGoblinArcherFrame, 'shoot', .45, 13, 14],
    [tinyGoblinChiefFrame, 'attack', .7, 13, 14],
    [tinyGoblinHealerFrame, 'heal', .5, 13, 14],
    [tinyBoarFrame, 'attack', .5, 9, 10],
    [tinyArcherFrame, 'shoot', .45, 21, 22],
    [tinyMonkHealFrame, 'heal', .45, 4, 5],
    [tinyKingFrame, 'attack', .45, 9, 10],
    [tinyStKnihorFrame, 'attack', .5, 9, 10],
    [tinyStKnihorFrame, 'cast', .5, 13, 14],
  ];
  for (const [frameFor, action, impactFraction, before, contact] of cases) {
    const actor = { action, actionDuration: 1, impactFraction, hitTime: 0, deathTime: 0 };
    assert.equal(frameFor({ ...actor, actionTime: impactFraction - 1e-6 }), before, `${frameFor.name}: anticipation`);
    assert.equal(frameFor({ ...actor, actionTime: impactFraction }), contact, `${frameFor.name}: contact`);
  }
});

test('warrior alternating strikes keep their authored rows and a hit does not interrupt attack', () => {
  for (const [facingX, facingY, base] of [[1, 0, 12], [-1, 0, 12], [0, 1, 24], [0, -1, 36]]) {
    for (const [attackCount, offset] of [[0, 0], [1, 6], [2, 0], [-3, 6]]) {
      const actor = { action: 'attack', actionTime: .45, actionDuration: 1, impactFraction: .45, facingX, facingY, attackCount, hitTime: .2 };
      assert.equal(tinyWarriorFrame(actor), base + offset + 3);
    }
  }
  assert.equal(tinyWarriorFrame({ action: 'walk', walkTime: .3, hitTime: .09 }), 0);
});

test('death poses and fade boundaries remain stable across elapsed animation clocks', () => {
  const helpers = [tinyWarriorFrame, tinyLancerFrame, tinyTorchFrame, tinyGoblinArcherFrame,
    tinyGoblinChiefFrame, tinyGoblinHealerFrame, tinyBoarFrame, tinyArcherFrame, tinyMonkIdleFrame, tinyKingFrame];
  for (const frameFor of helpers) for (const time of [0, .8, 100]) {
    assert.equal(frameFor({ action: 'dead' }, time), 0, frameFor.name);
  }
  for (const time of [0, .8, 100]) assert.equal(tinyStKnihorFrame({ action: 'dead' }, time), 23);
  assert.equal(allyAnimationFrame({ action: 'dead', deathTime: .119 }), 10);
  assert.equal(allyAnimationFrame({ action: 'dead', deathTime: .12 }), 11);
  for (const [deathTime, expected] of [[0, 1], [.22, 1], [.57, .5], [.92, 0], [2, 0]]) {
    assert.ok(Math.abs(allyDeathOpacity({ action: 'dead', deathTime }) - expected) < 1e-12);
  }
  assert.equal(allyDeathOpacity(null), 1);
});

test('portrait defaults and monk movement accept absent poses without losing loop bounds', () => {
  const helpers = [tinyWarriorFrame, tinyLancerFrame, tinyTorchFrame, tinyGoblinArcherFrame,
    tinyGoblinChiefFrame, tinyGoblinHealerFrame, tinyBoarFrame, tinyArcherFrame, tinyMonkIdleFrame, tinyKingFrame,
    tinyStKnihorFrame, tinyMonkRunFrame];
  for (const frameFor of helpers) for (const actor of [undefined, null]) {
    assert.equal(frameFor(actor, 0), 0, frameFor.name);
  }
  assert.equal(tinyKingFrame({}), 8, 'a present king pose keeps its default upward facing');
  assert.equal(tinyMonkRunFrame({ walkTime: .3 }), 3);
  assert.equal(tinyMonkRunFrame({ walkTime: .4 }), 0);
});

test('legacy frame indexing exposes an absent frame for invalid numeric clocks', () => {
  const actor = { action: 'walk', walkTime: -.125, actionTime: 1, actionDuration: 1,
    hitTime: 0, deathTime: 0, impactFraction: 1 };
  assert.equal(allyAnimationFrame(actor), undefined);
  assert.equal(allyAnimationFrame({ ...actor, action: 'attack' }), undefined);
  assert.equal(allyAnimationFrame(null), 0);
});
