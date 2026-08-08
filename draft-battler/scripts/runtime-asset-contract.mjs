import { readFile } from "node:fs/promises";

const SAFE_ASSET_ID = /^[a-z0-9_-]+$/;

export async function readRuntimeAssetContract(filePath) {
  const contract = JSON.parse(await readFile(filePath, "utf8"));

  return {
    abilityIds: readUniqueIds(contract?.abilityIds, "abilityIds"),
    cardArchetypes: readUniqueIds(contract?.cardArchetypes, "cardArchetypes"),
  };
}

export function getDynamicPublicAssetPaths(contract) {
  return [
    ...contract.abilityIds.map((abilityId) => `ui/cards/abilities/ability-${abilityId}.svg`),
    ...contract.cardArchetypes.map((archetype) => `ui/cards/archetypes/archetype-${archetype}.svg`),
  ];
}

function readUniqueIds(value, propertyName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Runtime asset contract ${propertyName} must be a non-empty array.`);
  }

  const ids = value.map((entry) => {
    if (typeof entry !== "string" || !SAFE_ASSET_ID.test(entry)) {
      throw new Error(`Runtime asset contract ${propertyName} contains an invalid asset ID.`);
    }
    return entry;
  });

  if (new Set(ids).size !== ids.length) {
    throw new Error(`Runtime asset contract ${propertyName} contains duplicate IDs.`);
  }

  return ids;
}
