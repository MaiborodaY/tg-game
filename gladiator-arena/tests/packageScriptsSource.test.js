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
  assert.match(packageJson.scripts["gladiator:build"], /gladiator:verify-build/);
  assert.equal(packageJson.scripts["gladiator:verify-build"], "node gladiator-arena/scripts/verify-build.mjs");
});

test("typecheck scripts keep browser apps and functions in separate projects", () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));

  assert.equal(packageJson.scripts["gladiator:typecheck"], "tsc --noEmit --project gladiator-arena/tsconfig.json");
  assert.equal(packageJson.scripts["farm-paws:typecheck"], "tsc --noEmit --project farm-paws/tsconfig.json");
  assert.equal(packageJson.scripts["functions:typecheck"], "tsc --noEmit --project functions/tsconfig.json");
  assert.match(packageJson.scripts.typecheck, /gladiator:typecheck/);
  assert.match(packageJson.scripts.typecheck, /farm-paws:typecheck/);
  assert.match(packageJson.scripts.typecheck, /functions:typecheck/);
});

test("debug start command launches the gladiator debug script", () => {
  const source = readFileSync(join(repoRoot, "start-gladiator-debug.cmd"), "utf8");

  assert.match(source, /npm\.cmd" run gladiator:debug/);
  assert.match(source, /cd \/d/);
});
