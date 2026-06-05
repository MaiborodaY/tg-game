import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("gladiator dev scripts load the local Vite config", () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));

  assert.match(packageJson.scripts["gladiator:dev"], /--config gladiator-arena\/vite\.config\.ts/);
  assert.match(packageJson.scripts["gladiator:debug"], /--config gladiator-arena\/vite\.config\.ts/);
  assert.match(packageJson.scripts["gladiator:build"], /--config gladiator-arena\/vite\.config\.ts/);
});