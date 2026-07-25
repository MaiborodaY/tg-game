import assert from "node:assert/strict";
import test from "node:test";

import { scoreDuplicateContract } from "../src/game/index.ts";

const contract = (level, strain, doubled = 0, declaringSide = "ns") => ({ level, strain, doubled, declaringSide });

test("duplicate scoring awards partscore and game bonuses from trick points", () => {
  assert.deepEqual(scoreDuplicateContract(contract(2, "spades"), 9, "none"), {
    total: 140,
    made: true,
    contractPoints: 60,
    overtrickPoints: 30,
    insultBonus: 0,
    gameOrPartscoreBonus: 50,
    slamBonus: 0,
    undertrickPenalty: 0,
  });
  assert.equal(scoreDuplicateContract(contract(4, "hearts"), 10, "none").total, 420);
  assert.equal(scoreDuplicateContract(contract(3, "notrump"), 9, "both").total, 600);
  assert.equal(scoreDuplicateContract(contract(3, "notrump", 0, "ew"), 9, "ns").total, 400);
  assert.equal(scoreDuplicateContract(contract(3, "notrump", 0, "ew"), 9, "ew").total, 600);
  assert.equal(scoreDuplicateContract(contract(5, "diamonds"), 11, "none").total, 400);
});

test("doubled and redoubled contracts include insult and special overtricks", () => {
  const doubled = scoreDuplicateContract(contract(2, "spades", 1), 9, "none");
  assert.deepEqual(doubled, {
    total: 570,
    made: true,
    contractPoints: 120,
    overtrickPoints: 100,
    insultBonus: 50,
    gameOrPartscoreBonus: 300,
    slamBonus: 0,
    undertrickPenalty: 0,
  });
  assert.equal(scoreDuplicateContract(contract(4, "spades", 1), 10, "ns").total, 790);
  assert.equal(scoreDuplicateContract(contract(1, "clubs", 2), 8, "none").total, 430);
  assert.equal(scoreDuplicateContract(contract(1, "notrump", 2), 8, "both").total, 1160);
});

test("small and grand slam bonuses respect vulnerability", () => {
  assert.equal(scoreDuplicateContract(contract(6, "notrump"), 12, "none").total, 990);
  assert.equal(scoreDuplicateContract(contract(6, "notrump"), 12, "ns").total, 1440);
  assert.equal(scoreDuplicateContract(contract(7, "notrump"), 13, "none").total, 1520);
  assert.equal(scoreDuplicateContract(contract(7, "notrump"), 13, "both").total, 2220);
});

test("undertrick penalties follow vulnerable, doubled and redoubled schedules", () => {
  assert.equal(scoreDuplicateContract(contract(4, "hearts"), 8, "none").total, -100);
  assert.equal(scoreDuplicateContract(contract(4, "hearts"), 8, "ns").total, -200);
  assert.equal(scoreDuplicateContract(contract(4, "hearts", 1), 9, "none").total, -100);
  assert.equal(scoreDuplicateContract(contract(4, "hearts", 1), 7, "none").total, -500);
  assert.equal(scoreDuplicateContract(contract(4, "hearts", 1), 6, "none").total, -800);
  assert.equal(scoreDuplicateContract(contract(4, "hearts", 1), 7, "ns").total, -800);
  assert.equal(scoreDuplicateContract(contract(4, "hearts", 2), 7, "ns").total, -1600);
});
