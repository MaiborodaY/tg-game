import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";
import { getAbilityIconPath, getCardArchetypeIconPath } from "../src/cardAssetContract.ts";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";
import { getUnitAsset, getUnitAssets } from "../src/unitAssets.ts";

const runtimeAssets = JSON.parse(
  await readFile(new URL("../runtime-assets.json", import.meta.url), "utf8"),
);

test("runtime asset contract covers every card ability and presentation archetype", () => {
  const expectedAbilities = [...new Set(CARD_DEFINITIONS.map((card) => card.abilityId))].sort();
  const expectedArchetypes = [...new Set(CARD_DEFINITIONS.map((card) => {
    if (card.role === "tank") {
      return "tank";
    }
    return card.role === "support" ? "support" : "damage";
  }))].sort();

  assert.deepEqual([...runtimeAssets.abilityIds].sort(), expectedAbilities);
  assert.deepEqual([...runtimeAssets.cardArchetypes].sort(), expectedArchetypes);

  runtimeAssets.abilityIds.forEach((abilityId) => {
    assert.equal(getAbilityIconPath(abilityId), `assets/ui/cards/abilities/ability-${abilityId}.svg`);
  });
  runtimeAssets.cardArchetypes.forEach((archetype) => {
    assert.equal(getCardArchetypeIconPath(archetype), `assets/ui/cards/archetypes/archetype-${archetype}.svg`);
  });
});

test("every card has a complete decodable unit art set", async () => {
  const assets = CARD_DEFINITIONS.map((card) => {
    const asset = getUnitAsset(card.id);
    assert.ok(asset, `Missing unit art mapping for ${card.id}`);
    assert.ok(asset.spriteSheet, `Missing sprite sheet mapping for ${card.id}`);
    return asset;
  });

  assert.equal(getUnitAssets().length, CARD_DEFINITIONS.length);
  assert.equal(new Set(assets.map((asset) => asset.key)).size, assets.length);

  for (const asset of assets) {
    const files = [
      { label: `${asset.key} unit`, url: asset.path, maxWidth: 384, maxHeight: 576 },
      { label: `${asset.key} card`, url: asset.cardPath, width: 256, height: 384 },
      {
        label: `${asset.key} sprite sheet`,
        url: asset.spriteSheet.path,
        width: asset.spriteSheet.frameWidth * 5,
        height: asset.spriteSheet.frameHeight * 2,
      },
    ];

    for (const file of files) {
      const image = sharp(fileURLToPath(file.url));
      const metadata = await image.metadata();
      if (file.width && file.height) {
        assert.equal(metadata.width, file.width, `${file.label} width`);
        assert.equal(metadata.height, file.height, `${file.label} height`);
      } else {
        assert.ok(metadata.width && metadata.width <= file.maxWidth, `${file.label} max width`);
        assert.ok(metadata.height && metadata.height <= file.maxHeight, `${file.label} max height`);
      }
      assert.equal(metadata.hasAlpha, true, `${file.label} alpha channel`);
      await image.ensureAlpha().raw().toBuffer();
    }
  }
});
