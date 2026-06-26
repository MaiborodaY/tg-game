import type { HeroArenaEnergy, HeroState } from "./hero";
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

const GLADIATOR_SAVE_ENDPOINT = "/api/gladiator-save";
const GLADIATOR_ARENA_ENERGY_SPEND_ENDPOINT = "/api/gladiator-energy/spend";

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

  const response = await fetch(GLADIATOR_ARENA_ENERGY_SPEND_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
    body: JSON.stringify({ hero, amount }),
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
