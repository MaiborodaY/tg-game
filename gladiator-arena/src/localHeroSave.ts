import type { HeroState } from "./hero";
import { getTelegramUserStorageKey } from "./telegram";

const LOCAL_HERO_SAVE_SCHEMA_VERSION = 1;
const LOCAL_HERO_SAVE_STORAGE_KEY_PREFIX = "dust-arena-local-hero:";

interface LocalHeroSavePayload {
  schemaVersion: number;
  savedAt: string;
  hero: HeroState;
}

export function loadLocalHeroSave(): HeroState | undefined {
  const storage = getLocalStorage();

  if (!storage) {
    return undefined;
  }

  try {
    const raw = storage.getItem(getLocalHeroSaveStorageKey());

    if (!raw) {
      return undefined;
    }

    const payload = JSON.parse(raw) as unknown;

    if (!isLocalHeroSavePayload(payload)) {
      return undefined;
    }

    return payload.hero;
  } catch {
    return undefined;
  }
}

export function saveLocalHeroSave(hero: HeroState): void {
  const storage = getLocalStorage();

  if (!storage || !isHeroStateLike(hero)) {
    return;
  }

  const payload: LocalHeroSavePayload = {
    schemaVersion: LOCAL_HERO_SAVE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    hero,
  };

  try {
    storage.setItem(getLocalHeroSaveStorageKey(), JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable or full. Cloud save remains authoritative.
  }
}

export function clearLocalHeroSave(): void {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(getLocalHeroSaveStorageKey());
  } catch {
    // Ignore storage failures; reset still proceeds in memory/cloud.
  }
}

function getLocalHeroSaveStorageKey(): string {
  return `${LOCAL_HERO_SAVE_STORAGE_KEY_PREFIX}${getTelegramUserStorageKey()}`;
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

function isLocalHeroSavePayload(value: unknown): value is LocalHeroSavePayload {
  if (!isRecord(value)) {
    return false;
  }

  return value.schemaVersion === LOCAL_HERO_SAVE_SCHEMA_VERSION && isHeroStateLike(value.hero);
}

function isHeroStateLike(value: unknown): value is HeroState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.level === "number" &&
    typeof value.xp === "number" &&
    typeof value.xpToNextLevel === "number" &&
    typeof value.skillPoints === "number" &&
    typeof value.gold === "number" &&
    isRecord(value.baseStats) &&
    isRecord(value.appearance) &&
    isRecord(value.equipment) &&
    isRecord(value.weaponEnchantments) &&
    Array.isArray(value.inventory) &&
    Array.isArray(value.unlockedShopRarities) &&
    Array.isArray(value.defeatedArenaBossIds) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
