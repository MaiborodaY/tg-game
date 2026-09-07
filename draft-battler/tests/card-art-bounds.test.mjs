import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getCardArtBounds } from "../src/cardArtBounds.ts";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";
import {
  CARD_ART_ALPHA_THRESHOLD,
  CARD_ART_SAFETY_PADDING,
  collectCardArtBounds,
  scanCardArtBounds,
  serializeCardArtBounds,
} from "../scripts/generate-card-art-bounds.mjs";

const metadataUrl = new URL("../src/card-art-bounds.json", import.meta.url);

test("every current card has reproducible bounds from its own runtime card.webp", async () => {
  const fresh = await collectCardArtBounds();
  const source = (await readFile(metadataUrl, "utf8")).replaceAll("\r\n", "\n");
  const roster = CARD_DEFINITIONS.map((card) => card.id).sort();
  assert.deepEqual(Object.keys(fresh), roster, "The asset roster and playable card roster must agree");
  assert.equal(source, serializeCardArtBounds(fresh), "Regenerate bounds after changing runtime card art");
  for (const cardId of roster) {
    assert.deepEqual(getCardArtBounds(cardId), fresh[cardId], `${cardId} must use its own visible silhouette`);
    const bounds = fresh[cardId];
    assert.ok(bounds.width > 0 && bounds.height > 0);
    assert.ok(bounds.left >= 0 && bounds.top >= 0);
    assert.ok(bounds.left + bounds.width <= bounds.sourceWidth);
    assert.ok(bounds.top + bounds.height <= bounds.sourceHeight);
  }
});

test("low silhouettes exclude transparent headroom while retaining their whole body", () => {
  const rat = getCardArtBounds("plague_rat");
  assert.ok(rat.top > rat.sourceHeight * 0.3, "The rat's empty authoring headroom must not consume the art area");
  assert.ok(rat.height < rat.sourceHeight * 0.7);
  assert.ok(rat.width > rat.height, "The rat must retain its naturally wide, low silhouette");
});

test("runtime asset generation refreshes framing only for the canonical application assets", async () => {
  const source = await readFile(new URL("../scripts/generate-runtime-assets.mjs", import.meta.url), "utf8");
  assert.match(source, /if \(outputRoot === fileURLToPath\(new URL\("\.\.\/src\/assets", import\.meta\.url\)\)\) \{[\s\S]*?collectCardArtBounds\(path\.join\(outputRoot, "units"\)\)[\s\S]*?card-art-bounds\.json/);
});

test("bounds ignore barely-visible pixels and retain two safe pixels around the silhouette", () => {
  assert.equal(CARD_ART_ALPHA_THRESHOLD, 12);
  assert.equal(CARD_ART_SAFETY_PADDING, 2);
  const data = Buffer.alloc(12 * 10 * 4);
  data[3] = 12;
  data[(4 * 12 + 5) * 4 + 3] = 13;
  data[(6 * 12 + 8) * 4 + 3] = 255;
  assert.deepEqual(scanCardArtBounds(data, { width: 12, height: 10, channels: 4 }), {
    sourceWidth: 12, sourceHeight: 10, left: 3, top: 2, width: 8, height: 7,
  });
});

test("safety padding clamps to source edges without dropping their visible pixels", () => {
  const data = Buffer.alloc(8 * 9 * 4);
  data[3] = 255;
  data[data.length - 1] = 255;
  assert.deepEqual(scanCardArtBounds(data, { width: 8, height: 9, channels: 4 }), {
    sourceWidth: 8, sourceHeight: 9, left: 0, top: 0, width: 8, height: 9,
  });
});

test("invalid or fully-transparent art fails generation rather than hiding a broken card", () => {
  assert.throws(() => scanCardArtBounds(Buffer.alloc(16), { width: 2, height: 2, channels: 4 }), /no visible silhouette/);
  assert.throws(() => scanCardArtBounds(Buffer.alloc(16), { width: 0, height: 2, channels: 4 }), /positive-size RGBA/);
  assert.throws(() => scanCardArtBounds(Buffer.alloc(12), { width: 2, height: 2, channels: 3 }), /positive-size RGBA/);
  assert.throws(() => scanCardArtBounds(Buffer.alloc(12), { width: 2, height: 2, channels: 4 }), /does not match/);
});
