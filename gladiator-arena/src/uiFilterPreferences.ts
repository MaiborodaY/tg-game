export interface ArmoryShopFilterPreferences {
  rarity?: string;
  setId?: string;
  partIds?: string[];
  twoColumn?: boolean;
}

export interface WeaponShopFilterPreferences {
  rarityIds?: string[];
  typeIds?: string[];
  twoColumn?: boolean;
}

export interface CityEquipmentFilterPreferences {
  categoryIds?: string[];
}

export interface UiFilterPreferences {
  armoryShop?: ArmoryShopFilterPreferences;
  weaponShop?: WeaponShopFilterPreferences;
  cityEquipment?: CityEquipmentFilterPreferences;
}

const UI_FILTER_PREFERENCES_STORAGE_KEY = "gladiator-arena:ui-filter-preferences:v1";

export function readUiFilterPreferences(): UiFilterPreferences {
  const storage = getLocalStorage();

  if (!storage) {
    return {};
  }

  try {
    const raw = storage.getItem(UI_FILTER_PREFERENCES_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    return sanitizeUiFilterPreferences(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function updateUiFilterPreferences(updater: (preferences: UiFilterPreferences) => UiFilterPreferences): void {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    const nextPreferences = sanitizeUiFilterPreferences(updater(readUiFilterPreferences()));

    storage.setItem(UI_FILTER_PREFERENCES_STORAGE_KEY, JSON.stringify(nextPreferences));
  } catch {
    // UI preferences should never block gameplay.
  }
}

function getLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function sanitizeUiFilterPreferences(value: unknown): UiFilterPreferences {
  if (!isRecord(value)) {
    return {};
  }

  return {
    armoryShop: sanitizeArmoryShopFilterPreferences(value.armoryShop),
    weaponShop: sanitizeWeaponShopFilterPreferences(value.weaponShop),
    cityEquipment: sanitizeCityEquipmentFilterPreferences(value.cityEquipment),
  };
}

function sanitizeArmoryShopFilterPreferences(value: unknown): ArmoryShopFilterPreferences | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    rarity: readString(value.rarity),
    setId: readString(value.setId),
    partIds: readStringArray(value.partIds),
    twoColumn: readBoolean(value.twoColumn),
  };
}

function sanitizeWeaponShopFilterPreferences(value: unknown): WeaponShopFilterPreferences | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    rarityIds: readStringArray(value.rarityIds),
    typeIds: readStringArray(value.typeIds),
    twoColumn: readBoolean(value.twoColumn),
  };
}

function sanitizeCityEquipmentFilterPreferences(value: unknown): CityEquipmentFilterPreferences | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    categoryIds: readStringArray(value.categoryIds),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);

  return strings.length > 0 ? strings : undefined;
}
