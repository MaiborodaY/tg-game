import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(scriptDir, "../../public/td");
const assetsDir = resolve(outputDir, "assets");
const headersPath = resolve(outputDir, "../_headers");
const htmlPath = resolve(outputDir, "index.html");

assert.ok(existsSync(htmlPath), "Tower Defense build is missing public/td/index.html");
const html = readFileSync(htmlPath, "utf8");
assert.ok(!html.includes("/src/main.ts"), "Production HTML still references /src/main.ts");
assert.ok(!/localhost|127\.0\.0\.1/i.test(html), "Production HTML contains a local development address");
assert.ok(!/(?:src|href)=["']\/assets\//i.test(html), "Production assets must use relative URLs");
assert.ok(html.includes('id="intro-overlay"'), "Production HTML is missing the Tower Defense intro");
assert.ok(!html.includes('id="game-choice-overlay"'), "Production HTML still contains the removed game chooser");
assert.ok(!html.includes('id="choose-bridge"'), "Production HTML still contains a Bridge launch action");

const localReferences = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)]
  .map((match) => match[1])
  .filter((value) => !/^(?:https?:|data:|#)/i.test(value));

for (const reference of localReferences) {
  const clean = cleanReference(reference);
  assert.ok(!clean.startsWith("/"), `Build reference must be relative: ${reference}`);
  assert.ok(existsSync(resolve(outputDir, clean)), `Build reference does not exist: ${reference}`);
}

const entryReferences = localReferences.filter((value) => cleanReference(value).endsWith(".js"));
assert.equal(entryReferences.length, 1, "Production HTML must reference exactly one JavaScript entry");
assert.ok(localReferences.some((value) => cleanReference(value).endsWith(".css")), "Production HTML has no CSS bundle");

const assetFiles = readdirSync(assetsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
assert.ok(assetFiles.length > 0, "Production build emitted no Tower Defense assets");
for (const fileName of assetFiles) {
  assert.match(
    fileName,
    /^.+-[A-Za-z0-9_-]{8,}(?:\.[A-Za-z0-9]+)+$/,
    `Immutable asset is not fingerprinted: ${fileName}`,
  );
}

const entryPath = resolve(outputDir, cleanReference(entryReferences[0]));
const entrySource = readFileSync(entryPath, "utf8");
const dynamicEntryReferences = readDynamicImports(entrySource);
assert.equal(dynamicEntryReferences.length, 1, "Production entry must have exactly one lazy gameplay chunk");
assert.match(
  basename(cleanReference(dynamicEntryReferences[0])),
  /^TowerDefenseScene-[A-Za-z0-9_-]{8,}\.js$/,
  "Production entry must lazily import the fingerprinted TowerDefenseScene chunk",
);

const emittedJs = assetFiles.filter((fileName) => fileName.endsWith(".js"));
const phaserChunks = emittedJs.filter((fileName) => /^phaser-[A-Za-z0-9_-]{8,}\.js$/.test(fileName));
assert.equal(phaserChunks.length, 1, "Production build must emit one fingerprinted Phaser chunk");
const phaserChunk = phaserChunks[0];
assert.ok(
  !localReferences.some((reference) => basename(cleanReference(reference)) === phaserChunk),
  "Production HTML must not eagerly load the Phaser chunk",
);
const entryStaticImports = readStaticImports(entrySource).map((reference) => basename(cleanReference(reference)));
assert.ok(
  !entryStaticImports.includes(phaserChunk),
  "Production entry must not statically import the Phaser chunk",
);
assert.ok(
  !entryStaticImports.includes(basename(cleanReference(dynamicEntryReferences[0]))),
  "Production entry must not statically import the TowerDefenseScene chunk",
);

const rendererPath = resolveJavaScriptReference(entryPath, dynamicEntryReferences[0]);
const rendererPhaserImports = readStaticImports(readFileSync(rendererPath, "utf8"))
  .map((reference) => basename(cleanReference(reference)))
  .filter((fileName) => fileName === phaserChunk);
assert.equal(rendererPhaserImports.length, 1, "TowerDefenseScene must statically import the Phaser chunk exactly once");

const reachableJs = collectReachableJavaScript(entryPath);
assert.deepEqual(
  [...reachableJs].map((path) => basename(path)).sort(),
  emittedJs,
  "Production build contains a missing or unreachable JavaScript chunk",
);

verifyImmutableHeaders();
globalThis.console.log(
  `Tower Defense build verified (${localReferences.length} local assets, ${reachableJs.size} JavaScript chunks).`,
);

function cleanReference(reference) {
  return reference.split(/[?#]/, 1)[0];
}

function readDynamicImports(source) {
  return [...source.matchAll(/\bimport\s*\(\s*["'`]([^"'`]+\.js)["'`]\s*\)/g)].map((match) => match[1]);
}

function readStaticImports(source) {
  const fromImports = [...source.matchAll(/\bfrom\s*["'`]([^"'`]+\.js)["'`]/g)].map((match) => match[1]);
  const sideEffectImports = [...source.matchAll(/\bimport\s*["'`]([^"'`]+\.js)["'`]/g)].map((match) => match[1]);
  return [...fromImports, ...sideEffectImports];
}

function collectReachableJavaScript(entry) {
  const reachable = new Set();
  const pending = [entry];
  while (pending.length > 0) {
    const current = pending.pop();
    if (reachable.has(current)) continue;
    reachable.add(current);
    const source = readFileSync(current, "utf8");
    for (const reference of [...readStaticImports(source), ...readDynamicImports(source)]) {
      const target = resolveJavaScriptReference(current, reference);
      assert.ok(existsSync(target), `JavaScript chunk reference does not exist: ${reference}`);
      if (!reachable.has(target)) pending.push(target);
    }
  }
  return reachable;
}

function resolveJavaScriptReference(importer, reference) {
  const clean = cleanReference(reference);
  assert.ok(clean.startsWith("./") || clean.startsWith("../"), `JavaScript chunk must be relative: ${reference}`);
  const target = resolve(dirname(importer), clean);
  const relativeTarget = relative(assetsDir, target);
  assert.ok(
    relativeTarget !== "" && !relativeTarget.startsWith("..") && !isAbsolute(relativeTarget),
    `JavaScript chunk escapes the assets directory: ${reference}`,
  );
  return target;
}

function verifyImmutableHeaders() {
  assert.ok(existsSync(headersPath), "Cloudflare Pages output is missing public/_headers");
  const blocks = parseHeaderBlocks(readFileSync(headersPath, "utf8"));
  const assetBlocks = blocks.filter((block) => block.path === "/td/assets/*");
  assert.equal(assetBlocks.length, 1, "Cloudflare Pages headers need exactly one /td/assets/* rule");
  const assetBlock = assetBlocks[0];
  const cacheControl = (assetBlock.headers.get("cache-control") ?? []).join(",").toLowerCase();
  const directives = new Set(cacheControl.split(",").map((value) => value.trim()).filter(Boolean));
  assert.ok(directives.has("public"), "Tower Defense assets must use public browser caching");
  assert.ok(directives.has("immutable"), "Tower Defense fingerprinted assets must use immutable caching");
  assert.ok(!directives.has("no-store") && !directives.has("no-cache"), "Immutable assets cannot disable caching");
  const maxAges = [...directives]
    .map((directive) => directive.match(/^max-age=(\d+)$/)?.[1])
    .filter(Boolean);
  assert.equal(maxAges.length, 1, "Tower Defense assets need exactly one max-age directive");
  assert.ok(Number(maxAges[0]) >= 31_536_000, "Tower Defense immutable assets need at least a one-year max-age");

  for (const broaderPath of ["/*", "/td/*"]) {
    const broaderBlocks = blocks.filter((block) => block.path === broaderPath);
    for (const block of broaderBlocks) {
      assert.ok(
        !block.headers.has("cache-control"),
        `Broader Pages route must not override Tower Defense asset caching: ${broaderPath}`,
      );
    }
  }

  const htmlRoutes = new Set(["/*", "/td", "/td/", "/td/*", "/td/index.html"]);
  for (const block of blocks) {
    if (!htmlRoutes.has(block.path)) continue;
    const value = (block.headers.get("cache-control") ?? []).join(",").toLowerCase();
    assert.ok(!value.includes("immutable"), `Tower Defense HTML must not be immutable: ${block.path}`);
  }
}

function parseHeaderBlocks(source) {
  const blocks = [];
  let current = null;
  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(rawLine)) {
      current = { path: rawLine.trim(), headers: new Map() };
      blocks.push(current);
      continue;
    }
    assert.ok(current, `Header appears before a route: ${rawLine.trim()}`);
    const separator = rawLine.indexOf(":");
    assert.ok(separator > 0, `Malformed Pages header: ${rawLine.trim()}`);
    const name = rawLine.slice(0, separator).trim().toLowerCase();
    const value = rawLine.slice(separator + 1).trim();
    const values = current.headers.get(name) ?? [];
    values.push(value);
    current.headers.set(name, values);
  }
  return blocks;
}
