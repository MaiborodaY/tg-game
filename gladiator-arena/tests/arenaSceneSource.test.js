import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");

test("fighter alpha only touches Phaser game objects", () => {
  assert.equal(arenaSceneSource.includes("Object.values(fighter).forEach((part) => part.setAlpha(alpha))"), false);
  assert.equal(arenaSceneSource.includes("getFighterParts(fighter).forEach((part) => part.setAlpha(alpha))"), true);
});