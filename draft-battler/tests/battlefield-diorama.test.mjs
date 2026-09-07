import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

const scene = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");
const main = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");

test("the diorama stays a small opaque runtime asset with the original field aspect ratio", async () => {
  const image = new URL("../src/assets/environment/battlefield/common_forest/battlefield_diorama.webp", import.meta.url);
  const original = new URL("../src/assets/environment/battlefield/common_forest/battlefield_base.webp", import.meta.url);
  const meta = await sharp(await readFile(image)).metadata();
  const base = await sharp(await readFile(original)).metadata();
  assert.equal(meta.format, "webp");
  assert.ok(meta.width <= 585 && meta.height <= 1080);
  assert.ok(Math.abs(meta.width / meta.height - base.width / base.height) < 0.002);
  assert.equal(meta.hasAlpha, false);
  assert.ok((await stat(image)).size < 150_000, "The new background must stay suitable for mobile loading");
  await sharp(await readFile(image)).raw().toBuffer();
});

test("menu and game request distinct background renders without discarding the original", () => {
  assert.match(main, /backdrop: uiState\.mode === "menu" \? "menu" : "game"/);
  assert.match(main, /key: `draft:\$\{uiState\.mode\}:/);
  assert.match(main, /backdrop: command\.backdrop/);
  assert.match(scene, /backdrop: input\.backdrop/);
  assert.match(scene, /this\.command\.type === "draft" && this\.command\.backdrop === "menu"/);
  assert.match(scene, /useGameBackdrop \? BATTLEFIELD_GAME_TEXTURE_KEY : BATTLEFIELD_BASE_TEXTURE_KEY/);
  assert.match(scene, /this\.textures\.exists\(BATTLEFIELD_GAME_TEXTURE_KEY\)/);
});

test("the standard asset generator can reproduce the optimized diorama", async () => {
  const generator = await readFile(new URL("../scripts/generate-runtime-assets.mjs", import.meta.url), "utf8");
  assert.match(generator, /source: "environment\/battlefield\/common_forest\/battlefield_diorama\.png",\s*target: "environment\/battlefield\/common_forest\/battlefield_diorama\.webp",\s*profile: profiles\.battlefield/);
});
