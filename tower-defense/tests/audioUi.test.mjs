import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const port = readFileSync(new URL("../src/audio/browserAudioPort.ts", import.meta.url), "utf8");

test("music and effects are independent accessible controls in the game menu", () => {
  assert.match(html, /<fieldset class="game-menu-audio">[\s\S]*aria-labelledby="game-menu-audio-label"/);
  assert.match(html, /data-audio-toggle="music"[^>]*aria-pressed="true"/);
  assert.match(html, /data-audio-toggle="sfx"[^>]*aria-pressed="true"/);
  assert.match(css, /\.game-menu-audio button:focus-visible/);
  assert.match(css, /\.game-menu-audio button\.is-active/);
});

test("audio unlock and page lifecycle stay outside Phaser gameplay code", () => {
  assert.match(main, /document\.addEventListener\("pointerdown"[\s\S]*closest\("\[data-audio-toggle\]"\)[\s\S]*audioDirector\.unlockFromGesture/);
  assert.match(main, /document\.addEventListener\("keydown"[\s\S]*event\.key !== "Enter"[\s\S]*event\.key !== " "[\s\S]*audioDirector\.unlockFromGesture/);
  assert.match(main, /document\.addEventListener\("click"[\s\S]*event\.isTrusted[\s\S]*audioDirector\.unlockFromGesture/);
  assert.match(main, /document\.addEventListener\("visibilitychange"[\s\S]*audioDirector\.suspend\(\)[\s\S]*audioDirector\.resume\(\)/);
  assert.match(main, /window\.addEventListener\("pagehide"[\s\S]*audioDirector\.suspend\(\)/);
  assert.match(main, /window\.addEventListener\("pageshow"[\s\S]*audioDirector\.resume\(\)/);
  assert.match(main, /readAudioSettings\(storage\)/);
  assert.match(main, /writeAudioSettings\(storage, audioSettings\)/);
  assert.match(main, /control\.dataset\.audioCueHandled !== undefined/);
  assert.equal(html.match(/data-audio-cue-handled/g)?.length, 5);
  assert.doesNotMatch(main, /new Audio\s*\(/);
  assert.doesNotMatch(main, /pagehide[\s\S]*audioDirector\.destroy/);
  assert.match(port, /new Audio\(url\)/);
});
