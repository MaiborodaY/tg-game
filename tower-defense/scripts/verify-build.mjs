import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(scriptDir, "../../public/td");
const htmlPath = resolve(outputDir, "index.html");

assert.ok(existsSync(htmlPath), "Tower Defense build is missing public/td/index.html");
const html = readFileSync(htmlPath, "utf8");
assert.ok(!html.includes("/src/main.ts"), "Production HTML still references /src/main.ts");
assert.ok(!/localhost|127\.0\.0\.1/i.test(html), "Production HTML contains a local development address");
assert.ok(!/(?:src|href)=["']\/assets\//i.test(html), "Production assets must use relative URLs");

const localReferences = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)]
  .map((match) => match[1])
  .filter((value) => !/^(?:https?:|data:|#)/i.test(value));

for (const reference of localReferences) {
  const clean = reference.split(/[?#]/, 1)[0];
  assert.ok(!clean.startsWith("/"), `Build reference must be relative: ${reference}`);
  assert.ok(existsSync(resolve(outputDir, clean)), `Build reference does not exist: ${reference}`);
}

assert.ok(localReferences.some((value) => value.endsWith(".js")), "Production HTML has no JavaScript bundle");
assert.ok(localReferences.some((value) => value.endsWith(".css")), "Production HTML has no CSS bundle");
console.log(`Tower Defense build verified (${localReferences.length} local assets).`);
