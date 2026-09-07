import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createDraftCardSilhouette } from "../src/draftCardArt.ts";
import { getCardArtBounds } from "../src/cardArtBounds.ts";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";

test("every draft silhouette uses its own bounded SVG viewport, unchanged image and accessible name", () => {
  const previous = globalThis.document;
  globalThis.document = { createElementNS: (namespace, tag) => new SvgStub(namespace, tag) };
  try {
    for (const card of CARD_DEFINITIONS) {
      const bounds = getCardArtBounds(card.id);
      const path = `/assets/units/${card.id}/card.webp`;
      const art = createDraftCardSilhouette(card.id, card.id, path);
      assert.equal(art.namespace, "http://www.w3.org/2000/svg");
      assert.equal(art.tag, "svg");
      assert.equal(art.attributes.viewBox, `${bounds.left} ${bounds.top} ${bounds.width} ${bounds.height}`);
      assert.equal(art.attributes.preserveAspectRatio, "xMidYMid meet", "Never crop with slice or distort a unit");
      assert.equal(art.attributes.role, "img");
      assert.equal(art.attributes["aria-label"], card.id);
      assert.equal(art.attributes.focusable, "false");
      assert.ok(art.classes.includes("unit-card__sprite"));
      assert.equal(art.children.length, 1);
      assert.deepEqual(art.children[0].attributes, {
        href: path, width: String(bounds.sourceWidth), height: String(bounds.sourceHeight), "aria-hidden": "true",
      });
    }
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test("whole silhouettes fit short, tall and wide art areas with their proportions intact", () => {
  for (const card of CARD_DEFINITIONS) {
    const bounds = getCardArtBounds(card.id);
    for (const [width, height] of [[85, 50], [110, 90], [145, 160], [180, 220]]) {
      // SVG meet performs this uniform fit on the visible bounds, not on the full portrait.
      const scale = Math.min(width / bounds.width, height / bounds.height);
      const paintedWidth = bounds.width * scale;
      const paintedHeight = bounds.height * scale;
      assert.ok(paintedWidth <= width + 1e-6 && paintedHeight <= height + 1e-6, card.id);
      assert.ok(Math.abs(paintedWidth / paintedHeight - bounds.width / bounds.height) < 1e-6);
    }
  }
  const rat = getCardArtBounds("plague_rat");
  assert.ok(Math.min(110 / rat.width, 160 / rat.height) * rat.height > 70,
    "The low rat should be a visible full body, not a sliver at the bottom of a portrait");
});

test("only draft cards opt into silhouette framing, not detail, collection or battlefield images", async () => {
  const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  const body = source.match(/function createCardBody\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(body, /createCardArt\(card, meta, "silhouette"\)/);
  assert.equal(source.match(/createCardArt\(card, meta, "silhouette"\)/g)?.length, 1);
  assert.match(source, /framing: "portrait" \| "silhouette" = "portrait"/);
  assert.match(source, /sprite\.alt = localizedName/);
});

class SvgStub {
  constructor(namespace, tag) {
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = {};
    this.children = [];
    this.classes = [];
    this.classList = { add: (...classes) => this.classes.push(...classes) };
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(...children) { this.children.push(...children); }
}
