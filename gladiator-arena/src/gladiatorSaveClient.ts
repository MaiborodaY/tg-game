import type { CombatState } from "./combat";
import type { ArenaLootDrop, BattleReward, HeroArenaEnergy, HeroArenaWinQuest, HeroBaseStats, HeroEquipment, HeroState } from "./hero";
import type { PvpRoomSnapshot } from "./pvpProtocol";
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
  attributes?: GladiatorHeroAttributesPatch;
  hero?: HeroState;
  error?: string;
}

interface GladiatorEquipmentSyncResponse {
  ok: boolean;
  equipment?: HeroEquipment;
  updatedAt?: string;
  hero?: HeroState;
  error?: string;
}

interface GladiatorBattleSettlementResponse {
  ok: boolean;
  settlement?: GladiatorBattleSettlement;
  hero?: HeroState;
  error?: string;
}

interface GladiatorArenaQuestClaimResponse {
  ok: boolean;
  reward?: GladiatorArenaQuestRewardPatch;
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

export interface GladiatorHeroAttributesPatch {
  baseStats: HeroBaseStats;
  skillPoints: number;
  gold?: number;
  skillPointResetCount?: number;
  updatedAt: string;
}

export interface GladiatorArenaQuestRewardPatch {
  arenaWinQuest: HeroArenaWinQuest;
  gold: number;
  arenaEnergy: HeroArenaEnergy;
  updatedAt: string;
}

export interface GladiatorBattleSettlement {
  reward: BattleReward;
  loot: ArenaLootDrop[];
  heroBeforeReward: HeroState;
  heroAfterReward: HeroState;
}

export type GladiatorBattleSettlementKind = "manual" | "auto";

const GLADIATOR_SAVE_ENDPOINT = "/api/gladiator-save";
const GLADIATOR_ARENA_ENERGY_SPEND_ENDPOINT = "/api/gladiator-energy/spend";
const GLADIATOR_SHOP_BUY_ENDPOINT = "/api/gladiator-shop/buy";
const GLADIATOR_EQUIPMENT_SYNC_ENDPOINT = "/api/gladiator-equipment/sync";
const GLADIATOR_ATTRIBUTES_SAVE_ENDPOINT = "/api/gladiator-attributes/save";
const GLADIATOR_ATTRIBUTES_RESET_ENDPOINT = "/api/gladiator-attributes/reset";
const GLADIATOR_ARENA_QUEST_CLAIM_ENDPOINT = "/api/gladiator-arena-quest/claim";
const GLADIATOR_BATTLE_SETTLE_ENDPOINT = "/api/gladiator-battle/settle";
const GLADIATOR_ONLINE_DUO_SETTLE_ENDPOINT = "/api/gladiator-online-duo/settle";
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

export async function syncGladiatorHeroEquipment(equipment: HeroEquipment): Promise<{ equipment: HeroEquipment; updatedAt: string }> {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new GladiatorSaveError("missing_init_data", "Telegram initData is unavailable.");
  }

  const response = await fetch(getGladiatorApiUrl(GLADIATOR_EQUIPMENT_SYNC_ENDPOINT), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
    body: JSON.stringify({ equipment }),
  });
  const data = (await response.json()) as GladiatorEquipmentSyncResponse;

  if (!response.ok || !data.ok) {
    throw new GladiatorSaveError(data.error || `Gladiator equipment sync failed: ${response.status}`, data.error, data.hero);
  }

  if (!data.equipment || !data.updatedAt) {
    throw new GladiatorSaveError("missing_equipment_payload", "Equipment sync response did not include equipment.");
  }

  return { equipment: data.equipment, updatedAt: data.updatedAt };
}

export async function saveGladiatorHeroAttributes(baseStats: HeroBaseStats, skillPoints: number): Promise<GladiatorHeroAttributesPatch> {
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

  if (!data.attributes) {
    throw new GladiatorSaveError("missing_attributes_payload", "Attributes save response did not include attributes.");
  }

  return data.attributes;
}

export async function resetGladiatorHeroAttributes(): Promise<GladiatorHeroAttributesPatch> {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new GladiatorSaveError("missing_init_data", "Telegram initData is unavailable.");
  }

  const response = await fetch(getGladiatorApiUrl(GLADIATOR_ATTRIBUTES_RESET_ENDPOINT), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
  });
  const data = (await response.json()) as GladiatorAttributesSaveResponse;

  if (!response.ok || !data.ok) {
    throw new GladiatorSaveError(data.error || `Gladiator attributes reset request failed: ${response.status}`, data.error, data.hero);
  }

  if (!data.attributes) {
    throw new GladiatorSaveError("missing_attributes_payload", "Attributes reset response did not include attributes.");
  }

  return data.attributes;
}

export async function claimGladiatorArenaQuestReward(): Promise<GladiatorArenaQuestRewardPatch> {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new GladiatorSaveError("missing_init_data", "Telegram initData is unavailable.");
  }

  const response = await fetch(getGladiatorApiUrl(GLADIATOR_ARENA_QUEST_CLAIM_ENDPOINT), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
  });
  const data = (await response.json()) as GladiatorArenaQuestClaimResponse;

  if (!response.ok || !data.ok) {
    throw new GladiatorSaveError(data.error || `Gladiator arena quest claim failed: ${response.status}`, data.error, data.hero);
  }

  if (!data.reward) {
    throw new GladiatorSaveError("missing_arena_quest_reward_payload", "Arena quest claim response did not include reward.");
  }

  return data.reward;
}

export async function settleGladiatorOfflineBattleReward(
  combat: CombatState,
  battleKind: GladiatorBattleSettlementKind = "manual",
): Promise<GladiatorBattleSettlement> {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new GladiatorSaveError("missing_init_data", "Telegram initData is unavailable.");
  }

  const response = await fetch(getGladiatorApiUrl(GLADIATOR_BATTLE_SETTLE_ENDPOINT), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
    body: JSON.stringify(createOfflineBattleSettlementRequest(combat, battleKind)),
  });
  const data = (await response.json()) as GladiatorBattleSettlementResponse;

  if (!response.ok || !data.ok) {
    throw new GladiatorSaveError(data.error || `Gladiator battle settlement failed: ${response.status}`, data.error, data.hero);
  }

  if (!data.settlement) {
    throw new GladiatorSaveError("missing_battle_settlement_payload", "Battle settlement response did not include settlement.");
  }

  return data.settlement;
}

export async function settleGladiatorOnlineDuoBossReward(snapshot: PvpRoomSnapshot): Promise<GladiatorBattleSettlement> {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new GladiatorSaveError("missing_init_data", "Telegram initData is unavailable.");
  }

  const response = await fetch(getGladiatorApiUrl(GLADIATOR_ONLINE_DUO_SETTLE_ENDPOINT), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
    },
    body: JSON.stringify(createOnlineDuoBossSettlementRequest(snapshot)),
  });
  const data = (await response.json()) as GladiatorBattleSettlementResponse;

  if (!response.ok || !data.ok) {
    throw new GladiatorSaveError(data.error || `Gladiator online duo settlement failed: ${response.status}`, data.error, data.hero);
  }

  if (!data.settlement) {
    throw new GladiatorSaveError("missing_online_duo_settlement_payload", "Online duo settlement response did not include settlement.");
  }

  return data.settlement;
}

function createOfflineBattleSettlementRequest(combat: CombatState, battleKind: GladiatorBattleSettlementKind): unknown {
  return {
    battleKind,
    result: combat.result,
    encounter: combat.encounter,
    equipment: combat.player.equipment,
    enemyEquipment: combat.enemy.equipment,
    playerConsumables: createBattleSettlementPlayerConsumables(combat.player),
  };
}

function createOnlineDuoBossSettlementRequest(snapshot: PvpRoomSnapshot): unknown {
  const combat = createOnlineDuoBossSettlementCombat(snapshot);

  return {
    roomCode: snapshot.roomCode,
    seat: snapshot.seat,
    result: combat.result,
    encounter: combat.encounter,
    equipment: combat.player.equipment,
    enemyEquipment: combat.enemy.equipment,
    playerConsumables: createBattleSettlementPlayerConsumables(combat.player),
  };
}

function createOnlineDuoBossSettlementCombat(snapshot: PvpRoomSnapshot): CombatState {
  if (!snapshot.state || snapshot.state.result === "playing" || !snapshot.state.encounter) {
    throw new GladiatorSaveError("invalid_online_duo_settlement", "Online duo snapshot is not finished.");
  }

  if (snapshot.seat !== "guest" || !snapshot.state.helper) {
    return snapshot.state;
  }

  return {
    ...snapshot.state,
    player: snapshot.state.helper,
  };
}

function createBattleSettlementPlayerConsumables(player: CombatState["player"]): unknown {
  return {
    shurikenItemId: player.shurikenItemId,
    shurikenCount: player.shurikenCount,
    scrollItemId: player.scrollItemId,
    scrollCount: player.scrollCount,
    fireballScrollItemId: player.fireballScrollItemId,
    fireballScrollCount: player.fireballScrollCount,
    wardScrollItemId: player.wardScrollItemId,
    wardScrollCount: player.wardScrollCount,
    preciseStrikeScrollItemId: player.preciseStrikeScrollItemId,
    preciseStrikeScrollCount: player.preciseStrikeScrollCount,
    doubleStrikeScrollItemId: player.doubleStrikeScrollItemId,
    doubleStrikeScrollCount: player.doubleStrikeScrollCount,
    poisonScrollItemId: player.poisonScrollItemId,
    poisonScrollCount: player.poisonScrollCount,
  };
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
