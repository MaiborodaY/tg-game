import runtimeAssets from "../runtime-assets.json" with { type: "json" };
import type { AbilityId } from "./game";

export type CardArchetype = "tank" | "damage" | "support";

const abilityIds = new Set<string>(runtimeAssets.abilityIds);
const cardArchetypes = new Set<string>(runtimeAssets.cardArchetypes);

export function getAbilityIconPath(abilityId: AbilityId): string {
  if (!abilityIds.has(abilityId)) {
    throw new Error(`Missing runtime asset contract for ability ${abilityId}.`);
  }

  return `assets/ui/cards/abilities/ability-${abilityId}.svg`;
}

export function getCardArchetypeIconPath(archetype: CardArchetype): string {
  if (!cardArchetypes.has(archetype)) {
    throw new Error(`Missing runtime asset contract for card archetype ${archetype}.`);
  }

  return `assets/ui/cards/archetypes/archetype-${archetype}.svg`;
}
