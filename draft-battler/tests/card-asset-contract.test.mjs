import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";
import { getAbilityIconPath, getCardArchetypeIconPath } from "../src/cardAssetContract.ts";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";
import { getUnitAsset, getUnitAssets } from "../src/unitAssets.ts";

const runtimeAssets = JSON.parse(
  await readFile(new URL("../runtime-assets.json", import.meta.url), "utf8"),
);
const authoringUnitsRoot = fileURLToPath(new URL("../assets-source/units/", import.meta.url));
const existingAnimatedCardIds = new Set([
  "iron_guard",
  "shieldbearer",
  "boar_rider",
  "sneakblade",
  "spear_recruit",
  "longbow_hunter",
  "ember_mage",
  "frost_acolyte",
  "grave_binder",
  "bone_soldier",
  "witch_doctor",
  "field_cleric",
  "wolfhound",
  "thorn_druid",
  "stone_golem",
  "pyromancer",
  "duelist",
  "banner_knight",
]);
const redrawnAnimatedCardIds = new Set([
  "plague_rat",
  "battle_alchemist",
  "night_warden",
  "moon_priestess",
  "siege_engineer",
  "phantom_duelist",
  "frost_wraith",
  "star_seer",
  "bronze_minotaur",
  "harpy_scout",
  "bone_archer",
  "rune_warden",
  "marsh_stalker",
  "ironhide_bear",
  "grave_bellringer",
  "forest_skirmisher",
  "crypt_keeper",
  "city_crossbowman",
  "smoke_trickster",
  "war_mastiff",
  "grave_raider",
  "soul_hunter",
  "headless_knight",
  "war_chaplain",
]);

test("the completed animation rollout covers all 42 cards with 18 original and 24 redrawn atlases", () => {
  assert.equal(existingAnimatedCardIds.size, 18);
  assert.equal(redrawnAnimatedCardIds.size, 24);
  const classifiedIds = [...existingAnimatedCardIds, ...redrawnAnimatedCardIds];
  assert.equal(new Set(classifiedIds).size, classifiedIds.length, "Animation cohorts must not overlap");
  assert.deepEqual(classifiedIds.sort(), CARD_DEFINITIONS.map((card) => card.id).sort());
});

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

test("redesigned abilities have distinct decodable runtime icons", async () => {
  const abilityIds = ["poison_bite", "armor_corrosion", "bodyguard", "phantom_parry", "piercing_bolt", "frost_delay", "moon_chorus", "threat_sight"];
  const digests = [];
  for (const abilityId of abilityIds) {
    const iconPath = fileURLToPath(new URL(`../public/${getAbilityIconPath(abilityId)}`, import.meta.url));
    const icon = sharp(iconPath);
    const metadata = await icon.metadata();
    assert.equal(metadata.format, "svg", abilityId);
    assert.equal(metadata.width, 128, abilityId);
    assert.equal(metadata.height, 128, abilityId);
    const { data, info } = await icon.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.ok(data.some((value, offset) => offset % info.channels === 3 && value > 0), `${abilityId} has visible artwork`);
    digests.push(createHash("sha256").update(data).digest("hex"));
  }
  assert.equal(new Set(digests).size, abilityIds.length, "Mechanics must not reuse indistinguishable symbols");
});

test("every card has unique decodable unit and card art", async () => {
  const assets = CARD_DEFINITIONS.map((card) => {
    const asset = getUnitAsset(card.id);
    assert.ok(asset, `Missing unit art mapping for ${card.id}`);
    return asset;
  });

  assert.equal(getUnitAssets().length, CARD_DEFINITIONS.length);
  assert.equal(new Set(assets.map((asset) => asset.key)).size, assets.length);
  assert.equal(new Set(assets.map((asset) => asset.path)).size, assets.length, "Unit art paths must be unique");
  assert.equal(new Set(assets.map((asset) => asset.cardPath)).size, assets.length, "Card art paths must be unique");

  const unitArtDigests = [];
  const cardArtDigests = [];

  for (const asset of assets) {
    const files = [
      { kind: "unit", label: `${asset.key} unit`, url: asset.path, format: "webp", maxWidth: 384, maxHeight: 576 },
      { kind: "card", label: `${asset.key} card`, url: asset.cardPath, format: "webp", width: 256, height: 384 },
    ];
    if (asset.spriteSheet) {
      files.push({
        kind: "sprite-sheet",
        label: `${asset.key} sprite sheet`,
        url: asset.spriteSheet.path,
        format: "webp",
        width: asset.spriteSheet.frameWidth * 5,
        height: asset.spriteSheet.frameHeight * 2,
        frameWidth: asset.spriteSheet.frameWidth,
        frameHeight: asset.spriteSheet.frameHeight,
      });
    }

    for (const file of files) {
      const digest = await assertTransparentRaster({ ...file, filePath: fileURLToPath(file.url) });
      if (file.kind === "unit") {
        unitArtDigests.push(digest);
      } else if (file.kind === "card") {
        cardArtDigests.push(digest);
      }
    }
  }

  assert.equal(new Set(unitArtDigests).size, assets.length, "Every card must have unique unit artwork");
  assert.equal(new Set(cardArtDigests).size, assets.length, "Every card must have unique card artwork");
});

test("authoring art is complete and sprite mappings follow available source atlases", async () => {
  for (const card of CARD_DEFINITIONS) {
    const asset = getUnitAsset(card.id);
    assert.ok(asset, `Missing unit art mapping for ${card.id}`);

    const unitPath = path.join(authoringUnitsRoot, card.id, "unit.png");
    const cardPath = path.join(authoringUnitsRoot, card.id, "card.png");
    const spriteSheetPath = path.join(authoringUnitsRoot, card.id, "sprite-sheet.png");

    await assertTransparentRaster({
      label: `${card.id} authoring unit`,
      filePath: unitPath,
      format: "png",
      minWidth: 512,
      minHeight: 512,
      maxWidth: 1536,
      maxHeight: 1536,
    });
    await assertTransparentRaster({
      label: `${card.id} authoring card`,
      filePath: cardPath,
      format: "png",
      width: 512,
      height: 768,
    });

    const hasSourceSpriteSheet = await fileExists(spriteSheetPath);
    assert.equal(hasSourceSpriteSheet, true, `${card.id} must retain its authored source atlas`);
    assert.ok(asset.spriteSheet, `${card.id} must retain its runtime sprite mapping`);
    assert.equal(
      Boolean(asset.spriteSheet),
      hasSourceSpriteSheet,
      `${card.id} runtime sprite mapping must match the available source atlas`,
    );

    await assertTransparentRaster({
      label: `${card.id} authoring sprite sheet`,
      filePath: spriteSheetPath,
      format: "png",
      width: 1280,
      height: 512,
      frameWidth: 256,
      frameHeight: 256,
    });
  }
});

async function assertTransparentRaster(options) {
  const image = sharp(options.filePath);
  const metadata = await image.metadata();
  assert.equal(metadata.format, options.format, `${options.label} format`);
  if (options.width && options.height) {
    assert.equal(metadata.width, options.width, `${options.label} width`);
    assert.equal(metadata.height, options.height, `${options.label} height`);
  } else {
    assert.ok(metadata.width && metadata.width >= (options.minWidth ?? 1), `${options.label} min width`);
    assert.ok(metadata.height && metadata.height >= (options.minHeight ?? 1), `${options.label} min height`);
    assert.ok(metadata.width <= options.maxWidth, `${options.label} max width`);
    assert.ok(metadata.height <= options.maxHeight, `${options.label} max height`);
  }
  assert.equal(metadata.hasAlpha, true, `${options.label} alpha channel`);

  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let hasVisiblePixel = false;
  let hasTransparentPixel = false;
  for (let offset = 3; offset < data.length; offset += info.channels) {
    const alpha = data[offset];
    hasVisiblePixel ||= alpha > 0;
    hasTransparentPixel ||= alpha < 255;
    if (alpha === 0) {
      data[offset - 3] = 0;
      data[offset - 2] = 0;
      data[offset - 1] = 0;
    }
  }
  assert.ok(hasVisiblePixel, `${options.label} must contain visible pixels`);
  assert.ok(hasTransparentPixel, `${options.label} must contain transparent pixels`);

  if (options.frameWidth && options.frameHeight) {
    const columns = info.width / options.frameWidth;
    const rows = info.height / options.frameHeight;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        assert.ok(
          frameContainsVisiblePixel(data, info, column, row, options.frameWidth, options.frameHeight),
          `${options.label} frame ${row * columns + column} must contain visible pixels`,
        );
      }
    }
  }

  return createHash("sha256")
    .update(`${info.width}x${info.height}:`)
    .update(data)
    .digest("hex");
}

function frameContainsVisiblePixel(data, info, column, row, frameWidth, frameHeight) {
  const left = column * frameWidth;
  const top = row * frameHeight;
  for (let y = top; y < top + frameHeight; y += 1) {
    for (let x = left; x < left + frameWidth; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] > 0) {
        return true;
      }
    }
  }
  return false;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
