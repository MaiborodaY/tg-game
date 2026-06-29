import type { HeroArenaEnergy, HeroBaseStats, HeroEquipment, HeroState } from "./hero";
import { getTelegramInitData } from "./telegram";

interface GladiatorSaveResponse {
  ok: boolean;
  save?: {
    hero: HeroState;
    schemaVersion: number;
    revision: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  error?: string;
}

interface GladiatorArenaEnergySpendResponse {
  ok: boolean;
  arenaEnergy?: HeroArenaEnergy;
  hero?: HeroState;
  error?: string;
}

interface GladiatorShopBuyResponse {
  ok: boolean;
  hero?: HeroState;
  error?: string;
}

interface GladiatorAttributesSaveResponse {
  ok: boolean;
  hero?: HeroState;
  error?: string;
}

export type GladiatorShopKind = "armory" | "weapon" | "magic";
export type GladiatorShopAction = "buy" | "upgrade_scroll" | "upgrade_scroll_capacity" | "sharpen_weapon" | "upgrade_bow_capacity";

export interface GladiatorShopActionRequest {
  shopKind: GladiatorShopKind;
  action?: GladiatorShopAction;
  productId?: string;
  equipment?: HeroEquipment;
}

const GLADIATOR_SAVE_ENDPOINT = "/api/gladiator-save";
const GLADIATOR_ARENA_ENERGY_SPEND_ENDPOINT = "/api/gladiator-energy/spend";
const GLADIATOR_SHOP_BUY_ENDPOINT = "/api/gladiator-shop/buy";
const GLADIATOR_ATTRIBUTES_SAVE_ENDPOINT = "/api/gladiator-attributes/save";
const GLADIATOR_API_BASE_URL_STORAGE_KEY = "dust-arena-gladiator-api-base-url";
const DEFAULT_GLADIATOR_API_BASE_URL = "https://gladiator-api.mr-maybik.workers.dev";

export class GladiatorSaveError extends Error {
  readonly code: string;
  readonly hero?: HeroState;
  readonly arenaEnergy?: HeroArenaEnergy;

  constructor(code: string, message = code, hero?: HeroState, arenaEnergy?: HeroArenaEnergy) {
    super(message);
    this.name = "GladiatorSaveError";
    this.code = code;
    this.hero = hero;
    this.arenaEnergy = arenaEnergy;
  }
}

export function canUseGladiatorCloudSave(): boolean {
  return getTelegramInitData().length > 0;
}

export async function loadGladiatorCloudSave(): Promise<HeroState | undefined> {
  const data = await requestGladiatorSave("GET");

  return data.save?.hero;
}

export async function saveGladiatorCloudHero(hero: HeroState): Promise<void> {
  await requestGladiatorSave("PUT", { hero });
}

export async function deleteGladiatorCloudSave(): Promise<void> {
  await requestGladiatorSave("DELETE");
}

export async function spendGladiatorArenaEnergy(hero: HeroState, amount = 1): Promise<HeroArenaEnergy> {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new GladiatorSaveError("missing_init_data", "Telegram initData is unavailable.");
  }

  const response = await fetch(getGladiatorApiUrl(GLADIATOR_ARENA_ENERGY_SPEND_ENDPOINT), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
    body: JSON.stringify({ requestId: createGladiatorCommandRequestId("arena-energy"), hero, amount }),
  });
  const data = (await response.json()) as GladiatorArenaEnergySpendResponse;

  if (!response.ok || !data.ok) {
    throw new GladiatorSaveError(data.error || `Gladiator arena energy request failed: ${response.status}`, data.error, data.hero, data.arenaEnergy);
  }

  if (!data.arenaEnergy) {
    throw new GladiatorSaveError("missing_arena_energy_payload", "Arena energy response did not include arenaEnergy.");
  }

  return data.arenaEnergy;
}

export async function buyGladiatorShopProduct(shopKind: "armory" | "weapon" | "magic", productId: string, equipment?: HeroEquipment): Promise<HeroState> {
  return applyGladiatorShopAction({ shopKind, productId, equipment });
}

export async function applyGladiatorShopAction(actionRequest: GladiatorShopActionRequest): Promise<HeroState> {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new GladiatorSaveError("missing_init_data", "Telegram initData is unavailable.");
  }

  const response = await fetch(getGladiatorApiUrl(GLADIATOR_SHOP_BUY_ENDPOINT), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
    body: JSON.stringify(actionRequest),
  });
  const data = (await response.json()) as GladiatorShopBuyResponse;

  if (!response.ok || !data.ok) {
    throw new GladiatorSaveError(data.error || `Gladiator shop buy request failed: ${response.status}`, data.error, data.hero);
  }

  if (!data.hero) {
    throw new GladiatorSaveError("missing_hero_payload", "Shop buy response did not include hero.");
  }

  return data.hero;
}

export async function saveGladiatorHeroAttributes(baseStats: HeroBaseStats, skillPoints: number): Promise<HeroState> {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new GladiatorSaveError("missing_init_data", "Telegram initData is unavailable.");
  }

  const response = await fetch(getGladiatorApiUrl(GLADIATOR_ATTRIBUTES_SAVE_ENDPOINT), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
    body: JSON.stringify({ baseStats, skillPoints }),
  });
  const data = (await response.json()) as GladiatorAttributesSaveResponse;

  if (!response.ok || !data.ok) {
    throw new GladiatorSaveError(data.error || `Gladiator attributes save request failed: ${response.status}`, data.error, data.hero);
  }

  if (!data.hero) {
    throw new GladiatorSaveError("missing_hero_payload", "Attributes save response did not include hero.");
  }

  return data.hero;
}

function getGladiatorApiUrl(path: string): string {
  return new URL(joinUrlPath(getGladiatorApiBaseUrl(), path), window.location.href).toString();
}

function getGladiatorApiBaseUrl(): string {
  const configured = import.meta.env.VITE_GLADIATOR_API_BASE_URL as string | undefined;
  const stored = window.localStorage.getItem(GLADIATOR_API_BASE_URL_STORAGE_KEY) ?? undefined;

  return normalizeBaseUrl(configured || stored || DEFAULT_GLADIATOR_API_BASE_URL);
}

function createGladiatorCommandRequestId(prefix: string): string {
  const randomId = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomId}`;
}

function joinUrlPath(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "") || DEFAULT_GLADIATOR_API_BASE_URL;
}

async function requestGladiatorSave(method: "GET" | "PUT" | "DELETE", payload?: unknown): Promise<GladiatorSaveResponse> {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new GladiatorSaveError("missing_init_data", "Telegram initData is unavailable.");
  }

  const response = await fetch(GLADIATOR_SAVE_ENDPOINT, {
    method,
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = (await response.json()) as GladiatorSaveResponse;

  if (!response.ok || !data.ok) {
    throw new GladiatorSaveError(data.error || `Gladiator save request failed: ${response.status}`, data.error);
  }

  return data;
}
