import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getAbilityIconPath, getCardArchetypeIconPath } from "../src/cardAssetContract.ts";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";

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
