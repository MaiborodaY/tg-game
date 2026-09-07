import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";
import { getVisibleBounds } from "../scripts/prepare-chroma-unit.mjs";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";
import { createFieldLayout, DRAFT_CAMERA_ZOOM } from "../src/fieldLayout.ts";
import { getUnitAsset } from "../src/unitAssets.ts";
import { BATTLE_UNIT_ART_GROUND_Y, getGroundedUnitArtBounds, getGroundedUnitArtPlacement } from "../src/unitArtGrounding.ts";
import { BATTLE_CAMERA_CLOSE_ZOOM, BATTLE_CAMERA_ZOOM, getUnitPresentationScale } from "../src/rendering/battlePresentationLayout.ts";

const scene = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");
const atlasSize = readSceneNumber("UNIT_SPRITE_SHEET_DISPLAY_SIZE");
const atlasY = readSceneNumber("UNIT_SPRITE_SHEET_Y");
const shadowMatch = /const contactShadow = this\.add\.ellipse\(0, ([\d.]+),/.exec(scene);
assert.ok(shadowMatch, "Read the actual scene contact-shadow position");
const shadowY = Number(shadowMatch[1]);
const groundedCards = CARD_DEFINITIONS.filter((card) => getGroundedUnitArtBounds(card.id));

test("all 240 redrawn atlas poses touch their scene shadow after perspective and camera transforms", async () => {
  assert.equal(groundedCards.length, 24);
  // Atlas alpha bounds alone cannot detect an incorrect sprite offset in the renderer.
  assert.match(scene, /\.sprite\(0, UNIT_SPRITE_SHEET_Y, asset\.spriteSheet\.key, frame\)\s*\.setDisplaySize\(UNIT_SPRITE_SHEET_DISPLAY_SIZE, UNIT_SPRITE_SHEET_DISPLAY_SIZE\)/);
  for (const card of groundedCards) {
    const asset = getUnitAsset(card.id);
    assert.ok(asset.spriteSheet, card.id);
    const { frameWidth, frameHeight } = asset.spriteSheet;
    const atlas = sharp(fileURLToPath(asset.spriteSheet.path));
    for (let frame = 0; frame < 10; frame += 1) {
      const { data, info } = await atlas.clone().extract({
        left: (frame % 5) * frameWidth, top: Math.floor(frame / 5) * frameHeight,
        width: frameWidth, height: frameHeight,
      }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const bounds = getVisibleBounds(data, info.width, info.height);
      const ground = atlasY + (bounds.top + bounds.height - frameHeight / 2) * atlasSize / frameHeight;
      assertContactAcrossField(ground, `${card.id} frame ${frame}`);
    }
  }
});

test("grounded static fallback and atlas share the same scene contact line", () => {
  assert.equal(BATTLE_UNIT_ART_GROUND_Y, shadowY);
  for (const card of groundedCards) {
    const bounds = getGroundedUnitArtBounds(card.id);
    const placement = getGroundedUnitArtPlacement(card.id, 56, 68, BATTLE_UNIT_ART_GROUND_Y);
    const ground = placement.y + (bounds.top + bounds.height) * placement.height / bounds.sourceHeight;
    assertContactAcrossField(ground, `${card.id} fallback`);
  }
});

test("ground-contact regression rejects a sprite floating five scene pixels above its shadow", () => {
  assert.throws(() => assertContactAcrossField(shadowY - 5, "floating sprite"), /ground gap/);
});

function assertContactAcrossField(ground, label) {
  for (const [width, height] of [[320, 568], [390, 844], [540, 960]]) {
    const layout = createFieldLayout(width, height);
    const positions = [layout.fieldTopY, layout.fieldBottomY, layout.centerY,
      ...Object.values(layout.homeRowsY).flat(), ...Object.values(layout.clashRowsY).flat(),
      ...Object.values(layout.castleApproachY)];
    for (const y of positions) {
      for (const zoom of [DRAFT_CAMERA_ZOOM, BATTLE_CAMERA_ZOOM, BATTLE_CAMERA_CLOSE_ZOOM]) {
        const gap = Math.abs(ground - shadowY) * getUnitPresentationScale(layout, y, "battle") * zoom;
        assert.ok(gap <= 2, `${label}: ground gap ${gap.toFixed(3)}px at ${width}x${height}, y=${y}, zoom=${zoom}`);
      }
    }
  }
}

function readSceneNumber(name) {
  const match = new RegExp(`const ${name} = (-?[\\d.]+);`).exec(scene);
  assert.ok(match, `Read actual scene constant ${name}`);
  return Number(match[1]);
}
