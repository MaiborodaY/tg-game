import type { HeroAppearance, HeroAppearanceSlotKey } from "./hero";

export interface HeroAppearanceAssetDefinition {
  id: string;
  key: string;
  slot: HeroAppearanceSlotKey;
  label: string;
  url: string;
  sourcePath: string;
}

const appearanceWebpAssetUrls = import.meta.glob("./assets/fighters/appearance/**/*.webp", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const appearancePngAssetUrls = import.meta.glob("./assets/fighters/appearance/**/*.png", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const appearanceAssetUrls = {
  ...appearanceWebpAssetUrls,
  ...appearancePngAssetUrls,
};

export const HERO_APPEARANCE_ASSETS = createHeroAppearanceAssetEntries();

export const HERO_APPEARANCE_ASSETS_BY_SLOT = {
  hair: HERO_APPEARANCE_ASSETS.filter((asset) => asset.slot === "hair"),
  beard: HERO_APPEARANCE_ASSETS.filter((asset) => asset.slot === "beard"),
} as const;

const heroAppearanceAssetsById = new Map(HERO_APPEARANCE_ASSETS.map((asset) => [asset.id, asset]));

export function getHeroAppearanceAsset(id: string | null | undefined): HeroAppearanceAssetDefinition | undefined {
  return id ? heroAppearanceAssetsById.get(id) : undefined;
}

export function getHeroAppearanceAssetKeys(appearance: HeroAppearance | undefined): string[] {
  return [getHeroAppearanceAsset(appearance?.hairId)?.key, getHeroAppearanceAsset(appearance?.beardId)?.key].filter((key): key is string =>
    typeof key === "string",
  );
}

export function resolveHeroAppearanceAssetUrl(sourcePath: string): Promise<string | undefined> {
  const assetPath = toAssetGlobPath(sourcePath);

  return Promise.resolve(appearanceAssetUrls[assetPath]);
}

function createHeroAppearanceAssetEntries(): HeroAppearanceAssetDefinition[] {
  const entriesByAssetPath = new Map<string, string>();

  Object.keys(appearanceWebpAssetUrls).forEach((assetPath) => {
    entriesByAssetPath.set(getAssetPathWithoutExtension(assetPath), assetPath);
  });

  Object.keys(appearancePngAssetUrls).forEach((assetPath) => {
    const assetPathKey = getAssetPathWithoutExtension(assetPath);

    if (!entriesByAssetPath.has(assetPathKey)) {
      entriesByAssetPath.set(assetPathKey, assetPath);
    }
  });

  return [...entriesByAssetPath.values()]
    .flatMap((assetPath): HeroAppearanceAssetDefinition[] => {
      const slot = getAppearanceSlot(assetPath);
      const id = getAssetId(assetPath);

      if (!slot || !id) {
        return [];
      }

      return [
        {
          id,
          key: `appearance-${id}`,
          slot,
          label: formatAppearanceLabel(id, slot),
          url: appearanceAssetUrls[assetPath],
          sourcePath: toSourcePath(assetPath),
        },
      ];
    })
    .sort((left, right) => left.slot.localeCompare(right.slot) || left.label.localeCompare(right.label));
}

function getAppearanceSlot(assetPath: string): HeroAppearanceSlotKey | undefined {
  if (assetPath.includes("/appearance/hair/")) {
    return "hair";
  }

  if (assetPath.includes("/appearance/beard/")) {
    return "beard";
  }

  return undefined;
}

function getAssetId(assetPath: string): string | undefined {
  return assetPath.split("/").at(-1)?.replace(/\.(?:png|webp)$/i, "");
}

function getAssetPathWithoutExtension(assetPath: string): string {
  return assetPath.replace(/\.(?:png|webp)$/i, "");
}

function toSourcePath(assetPath: string): string {
  return assetPath.replace(/^\.\//, "");
}

function toAssetGlobPath(sourcePath: string): string {
  return sourcePath.startsWith("./") ? sourcePath : `./${sourcePath}`;
}

function formatAppearanceLabel(id: string, slot: HeroAppearanceSlotKey): string {
  const normalized = id.replace(new RegExp(`^${slot}-`), "");

  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
