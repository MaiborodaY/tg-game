import type { TowerType } from "./game/types.ts";
import type { TranslationKey } from "./i18n.ts";

export type TowerGuideEntry = Readonly<{
  type: TowerType;
  descriptionKey: TranslationKey;
  strongKey: TranslationKey;
  weakKey: TranslationKey;
}>;

export const TOWER_GUIDE_ENTRIES: readonly TowerGuideEntry[] = Object.freeze([
  {
    type: "ranger",
    descriptionKey: "tower_ranger_desc",
    strongKey: "guide_ranger_strong",
    weakKey: "guide_ranger_weak",
  },
  {
    type: "frost",
    descriptionKey: "tower_frost_desc",
    strongKey: "guide_frost_strong",
    weakKey: "guide_frost_weak",
  },
  {
    type: "ember",
    descriptionKey: "tower_ember_desc",
    strongKey: "guide_ember_strong",
    weakKey: "guide_ember_weak",
  },
  {
    type: "storm",
    descriptionKey: "tower_storm_desc",
    strongKey: "guide_storm_strong",
    weakKey: "guide_storm_weak",
  },
]);
