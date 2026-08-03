import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const assetsRoot = new URL("../src/assets/audio/", import.meta.url);
const assetsRootPath = fileURLToPath(assetsRoot);
const source = readFileSync(new URL("../src/audio/audioAssets.ts", import.meta.url), "utf8");
const license = readFileSync(new URL("../src/assets/audio/AUDIO_LICENSES.md", import.meta.url), "utf8");
const viteConfig = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

test("the production audio library contains only local, compressed assets", () => {
  const files = collectFiles(assetsRootPath).map((file) => relative(assetsRootPath, file).replaceAll("\\", "/"));
  const audioFiles = files.filter((file) => extname(file) !== ".md");
  const imports = [...source.matchAll(/from "\.\.\/assets\/audio\/([^"?]+\.mp3)"/g)].map((match) => match[1]);

  assert.equal(audioFiles.length, 41);
  assert.equal(new Set(imports).size, audioFiles.length);
  assert.deepEqual([...new Set(imports)].sort(), [...audioFiles].sort());
  assert.ok(audioFiles.every((file) => extname(file) === ".mp3"));
  assert.ok(imports.every((file) => !/^https?:/i.test(file)));
  assert.match(viteConfig, /assetsInlineLimit:\s*0/);
});

test("every audio source family keeps auditable CC0 provenance", () => {
  assert.match(license, /CC0 1\.0/);
  assert.match(license, /opengameart\.org\/content\/cathedral-in-the-forest/);
  assert.match(license, /opengameart\.org\/content\/lost-in-a-bad-place/);
  assert.match(license, /opengameart\.org\/content\/heartfelt-battle/);
  assert.match(license, /kenney\.nl\/assets\/rpg-audio/);
  assert.match(license, /creativecommons\.org\/publicdomain\/zero\/1\.0/);
});

test("shipped MP3 files have recognizable headers and bounded individual size", () => {
  for (const file of collectFiles(assetsRootPath).filter((path) => extname(path) === ".mp3")) {
    const bytes = readFileSync(file);
    const hasId3 = bytes.subarray(0, 3).toString("ascii") === "ID3";
    const scanLimit = Math.min(bytes.length - 1, 4_096);
    let hasFrameSync = false;
    for (let index = 0; index < scanLimit; index += 1) {
      if (bytes[index] === 0xff && (bytes[index + 1] & 0xe0) === 0xe0) {
        hasFrameSync = true;
        break;
      }
    }
    assert.ok(hasId3 || hasFrameSync, `${relative(assetsRootPath, file)} is not a recognizable MP3`);
    assert.ok(bytes.length < 3_000_000, `${relative(assetsRootPath, file)} is unexpectedly large`);
  }
});

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}
