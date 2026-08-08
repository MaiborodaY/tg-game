import assert from "node:assert/strict";
import test from "node:test";

import { SeededRandom, hashSeed } from "../src/game/random.ts";

test("seeded random is deterministic and bounded", () => {
  const left = new SeededRandom("p0-random-seed");
  const right = new SeededRandom("p0-random-seed");
  const values = Array.from({ length: 32 }, () => left.next());

  assert.deepEqual(values, Array.from({ length: 32 }, () => right.next()));
  values.forEach((value) => assert.ok(value >= 0 && value < 1));
  assert.notEqual(hashSeed("p0-random-seed"), hashSeed("another-seed"));
});

test("seeded random helpers preserve their contracts", () => {
  const random = new SeededRandom("p0-helper-seed");

  assert.equal(random.nextInt(0), 0);
  assert.equal(random.nextInt(-4), 0);
  assert.throws(() => random.pick([]), /empty list/i);

  const source = [1, 2, 3, 4, 5];
  const shuffled = random.shuffle(source);
  assert.deepEqual(source, [1, 2, 3, 4, 5]);
  assert.deepEqual([...shuffled].sort((left, right) => left - right), source);
});
