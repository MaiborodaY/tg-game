import { DurableObject } from "cloudflare:workers";

import { GENERATED_ARMORY_PRODUCTS, GENERATED_WEAPON_PRODUCTS } from "../../../gladiator-arena/src/generated/equipmentItems.generated";
import {
  HERO_CRACK_ARMOR_SCROLL_ITEM_ID,
  HERO_ATTRIBUTE_KEYS,
  HERO_EQUIPMENT_SLOT_KEYS,
  HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID,
  HERO_FIREBALL_SCROLL_ITEM_ID,
  HERO_ITEM_CATALOG,
  HERO_POISON_SCROLL_ITEM_ID,
  HERO_PRECISE_STRIKE_SCROLL_ITEM_ID,
  HERO_WARD_SCROLL_ITEM_ID,
  applyCombatReward,
  areHeroItemsOwned,
  buyAndEquipHeroItems,
  getArenaBossDefinition,
  getArenaRandomOpponentDefinition,
  getHeroScrollPurchasePrice,
  isHeroConsumableItem,
  isHeroItemOwned,
  resetHeroSkillPoints,
  sharpenHeroActiveWeapon,
  upgradeHeroBowShotCapacity,
  upgradeHeroScroll,
  upgradeHeroScrollCapacity,
  type HeroAttributeKey,
  type HeroBaseStats,
  type HeroEquipment,
  type HeroEquipmentSlotKey,
  type HeroItemId,
  type HeroState,
  type CombatRewardApplication,
} from "../../../gladiator-arena/src/hero";
import type { CombatState, Result } from "../../../gladiator-arena/src/combat";
import { isShopProductSealed, type ShopItemRarity } from "../../../gladiator-arena/src/shopPresentation";

interface Env {
  BOT_TOKEN?: string;
  GLADIATOR_SAVES_DB: D1Database;
  PLAYER_ACTOR: DurableObjectNamespace<PlayerActor>;
}

interface TelegramInitUser {
  id: number;
  username?: string;
}

interface SpendArenaEnergyRequest {
  hero?: unknown;
  amount?: unknown;
}

interface ShopBuyRequest {
  shopKind?: unknown;
  action?: unknown;
  productId?: unknown;
  equipment?: unknown;
}

interface SaveHeroAttributesRequest {
  baseStats?: unknown;
  skillPoints?: unknown;
}

interface OfflineBattleSettlementRequest {
  battleKind?: unknown;
  result?: unknown;
  encounter?: unknown;
  equipment?: unknown;
  enemyEquipment?: unknown;
  playerConsumables?: unknown;
}

interface PlayerActorSpendArenaEnergyInput {
  telegramUserId: string;
  telegramUsername?: string;
  hero?: unknown;
  amount?: unknown;
  nowIso: string;
}

interface PlayerActorBuyShopProductInput {
  telegramUserId: string;
  telegramUsername?: string;
  shopKind: ShopKind;
  action: ShopAction;
  productId?: string;
  equipment?: HeroEquipmentSnapshot;
  nowIso: string;
}

interface PlayerActorSaveHeroAttributesInput {
  telegramUserId: string;
  telegramUsername?: string;
  baseStats: HeroBaseStats;
  skillPoints: number;
  nowIso: string;
}

interface PlayerActorResetHeroAttributesInput {
  telegramUserId: string;
  telegramUsername?: string;
  nowIso: string;
}

interface PlayerActorSettleOfflineBattleInput {
  telegramUserId: string;
  telegramUsername?: string;
  battleKind: OfflineBattleSettlementKind;
  result: OfflineBattleSettlementResult;
  encounter: OfflineBattleEncounterSnapshot;
  equipment?: HeroEquipmentSnapshot;
  enemyEquipment?: HeroEquipmentSnapshot;
  playerConsumables: OfflineBattlePlayerConsumablesSnapshot;
  nowIso: string;
}

interface HeroArenaEnergy {
  current: number;
  max: number;
  dayKey: string;
}

type SpendArenaEnergyResult =
  | { ok: true; arenaEnergy: HeroArenaEnergy }
  | { ok: false; error: "not_enough_arena_energy"; arenaEnergy: HeroArenaEnergy };

type ShopKind = "armory" | "weapon" | "magic";
type ShopAction = "buy" | "upgrade_scroll" | "upgrade_scroll_capacity" | "sharpen_weapon" | "upgrade_bow_capacity";
type OfflineBattleSettlementKind = "manual" | "auto";
type OfflineBattleSettlementResult = Exclude<Result, "playing">;
type HeroEquipmentSnapshot = Partial<Record<HeroEquipmentSlotKey, HeroItemId | null>>;
type OfflineBattleEncounterSnapshot = NonNullable<CombatState["encounter"]>;
type OfflineBattlePlayerConsumablesSnapshot = Partial<Record<
  | "shurikenItemId"
  | "scrollItemId"
  | "fireballScrollItemId"
  | "wardScrollItemId"
  | "preciseStrikeScrollItemId"
  | "doubleStrikeScrollItemId"
  | "poisonScrollItemId",
  HeroItemId
>> & Partial<Record<
  | "shurikenCount"
  | "scrollCount"
  | "fireballScrollCount"
  | "wardScrollCount"
  | "preciseStrikeScrollCount"
  | "doubleStrikeScrollCount"
  | "poisonScrollCount",
  number
>>;

type BuyShopProductResult =
  | { ok: true; hero: HeroState }
  | {
      ok: false;
      error:
        | "invalid_hero_payload"
        | "player_save_not_found"
        | "sealed_shop_product"
        | "shop_action_not_supported"
        | "shop_product_not_found"
        | "shop_purchase_rejected";
      hero?: HeroState;
    };

interface HeroAttributesPatch {
  baseStats: HeroBaseStats;
  skillPoints: number;
  gold?: number;
  skillPointResetCount?: number;
  updatedAt: string;
}

type SaveHeroAttributesResult =
  | { ok: true; attributes: HeroAttributesPatch }
  | {
      ok: false;
      error: "invalid_attribute_allocation" | "invalid_attribute_payload" | "invalid_hero_payload" | "player_save_not_found";
      hero?: HeroState;
    };

type HeroAttributeSnapshotResult =
  | { ok: true; hero: HeroState }
  | {
      ok: false;
      error: "invalid_attribute_allocation" | "invalid_hero_payload";
    };

type ResetHeroAttributesResult =
  | { ok: true; attributes: HeroAttributesPatch }
  | {
      ok: false;
      error: "attribute_reset_rejected" | "invalid_hero_payload" | "player_save_not_found";
      hero?: HeroState;
    };

type OfflineBattleSettlementResultPayload =
  | { ok: true; settlement: CombatRewardApplication }
  | {
      ok: false;
      error: "invalid_battle_settlement" | "invalid_hero_payload" | "player_save_not_found";
      hero?: HeroState;
    };

interface PlayerDailyResourceRow {
  current: number;
  max: number;
  day_key: string;
}

interface PlayerSaveHeroRow {
  hero_json: string;
}

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  itemIds: HeroItemId[];
  rarity?: ShopItemRarity;
}

interface PairedArmorySlotConfig {
  backSlot: HeroEquipmentSlotKey;
  frontSlot: HeroEquipmentSlotKey;
  token: string;
  singularLabel: string;
  pluralLabel: string;
}

const API_PREFIX = "/api";
const SAVE_SCHEMA_VERSION = 1;
const MAX_HERO_JSON_BYTES = 100_000;
const ARENA_ENERGY_RESOURCE_KEY = "arena_energy";
const HERO_ARENA_ENERGY_MAX = 10;
const AUTO_FIGHT_RANDOM_ENEMY_LOOT_CHANCE_MULTIPLIER = 0.5;
const PAIRED_ARMORY_SLOT_CONFIGS: readonly PairedArmorySlotConfig[] = [
  {
    backSlot: "backShoulderguard",
    frontSlot: "frontShoulderguard",
    token: "shoulderguard",
    singularLabel: "Shoulderguard",
    pluralLabel: "Shoulders",
  },
  { backSlot: "backWrist", frontSlot: "frontWrist", token: "wrist", singularLabel: "Wrist", pluralLabel: "Wrists" },
  { backSlot: "backGlove", frontSlot: "frontGlove", token: "glove", singularLabel: "Glove", pluralLabel: "Gloves" },
  { backSlot: "backGreave", frontSlot: "frontGreave", token: "greave", singularLabel: "Greave", pluralLabel: "Greaves" },
  { backSlot: "backShinguard", frontSlot: "frontShinguard", token: "shinguard", singularLabel: "Shinguard", pluralLabel: "Shinguards" },
  { backSlot: "backBoot", frontSlot: "frontBoot", token: "boot", singularLabel: "Boot", pluralLabel: "Boots" },
];
const SERVER_ARMORY_PRODUCTS = pairGeneratedServerArmoryProducts(GENERATED_ARMORY_PRODUCTS.map(toServerShopProduct));
const SERVER_WEAPON_PRODUCTS = GENERATED_WEAPON_PRODUCTS.map(toServerShopProduct);
const SERVER_MAGIC_PRODUCTS: readonly ShopProduct[] = [
  { id: "crack_armor_scroll", name: "Crack Armor Scroll", price: 30, itemIds: [HERO_CRACK_ARMOR_SCROLL_ITEM_ID], rarity: "common" },
  { id: "fireball_scroll", name: "Fireball Scroll", price: 50, itemIds: [HERO_FIREBALL_SCROLL_ITEM_ID], rarity: "common" },
  { id: "ward_scroll", name: "Ward Scroll", price: 30, itemIds: [HERO_WARD_SCROLL_ITEM_ID], rarity: "common" },
  { id: "precise_strike_scroll", name: "Precise Strike Scroll", price: 30, itemIds: [HERO_PRECISE_STRIKE_SCROLL_ITEM_ID], rarity: "common" },
  { id: "double_strike_scroll", name: "Double Strike Scroll", price: 30, itemIds: [HERO_DOUBLE_STRIKE_SCROLL_ITEM_ID], rarity: "common" },
  { id: "poison_scroll", name: "Poison Scroll", price: 35, itemIds: [HERO_POISON_SCROLL_ITEM_ID], rarity: "common" },
];

export class PlayerActor extends DurableObject<Env> {
  private operationQueue: Promise<void> = Promise.resolve();

  async spendArenaEnergy(input: PlayerActorSpendArenaEnergyInput): Promise<SpendArenaEnergyResult> {
    return this.enqueue(() => this.spendArenaEnergyNow(input));
  }

  async buyShopProduct(input: PlayerActorBuyShopProductInput): Promise<BuyShopProductResult> {
    return this.enqueue(() => this.buyShopProductNow(input));
  }

  async saveHeroAttributes(input: PlayerActorSaveHeroAttributesInput): Promise<SaveHeroAttributesResult> {
    return this.enqueue(() => this.saveHeroAttributesNow(input));
  }

  async resetHeroAttributes(input: PlayerActorResetHeroAttributesInput): Promise<ResetHeroAttributesResult> {
    return this.enqueue(() => this.resetHeroAttributesNow(input));
  }

  async settleOfflineBattle(input: PlayerActorSettleOfflineBattleInput): Promise<OfflineBattleSettlementResultPayload> {
    return this.enqueue(() => this.settleOfflineBattleNow(input));
  }

  private async spendArenaEnergyNow(input: PlayerActorSpendArenaEnergyInput): Promise<SpendArenaEnergyResult> {
    const spendAmount = getArenaEnergySpendAmount(input.amount);
    const dayKey = getUtcDayKey(input.nowIso);

    await initializePlayerDailyArenaEnergy(
      this.env.GLADIATOR_SAVES_DB,
      input.telegramUserId,
      dayKey,
      input.nowIso,
    );
    const result = await spendPlayerDailyArenaEnergy(
      this.env.GLADIATOR_SAVES_DB,
      input.telegramUserId,
      dayKey,
      spendAmount,
      input.nowIso,
    );

    return result;
  }

  private async buyShopProductNow(input: PlayerActorBuyShopProductInput): Promise<BuyShopProductResult> {
    const savedHero = await readPlayerHero(this.env.GLADIATOR_SAVES_DB, input.telegramUserId);

    if (!savedHero) {
      return { ok: false, error: "player_save_not_found" };
    }

    const hero = withValidatedEquipmentSnapshot(savedHero, input.equipment, input.nowIso);
    const nextHero = input.shopKind === "magic"
      ? applyMagicShopAction(hero, input)
      : applyEquipmentShopAction(hero, input);

    if (!nextHero.ok) {
      return { ...nextHero, hero };
    }

    const heroJson = JSON.stringify(nextHero.hero);

    if (!heroJson || heroJson.length > MAX_HERO_JSON_BYTES) {
      return { ok: false, error: "invalid_hero_payload", hero };
    }

    await updatePlayerHero(this.env.GLADIATOR_SAVES_DB, {
      telegramUserId: input.telegramUserId,
      telegramUsername: input.telegramUsername,
      heroJson,
      nowIso: input.nowIso,
    });

    return { ok: true, hero: nextHero.hero };
  }

  private async saveHeroAttributesNow(input: PlayerActorSaveHeroAttributesInput): Promise<SaveHeroAttributesResult> {
    const savedHero = await readPlayerHero(this.env.GLADIATOR_SAVES_DB, input.telegramUserId);

    if (!savedHero) {
      return { ok: false, error: "player_save_not_found" };
    }

    const nextHero = applyHeroAttributeSnapshot(savedHero, input.baseStats, input.skillPoints, input.nowIso);

    if (!nextHero.ok) {
      return { ...nextHero, hero: savedHero };
    }

    const attributes = createHeroAttributesPatch(nextHero.hero);

    await updatePlayerHeroAttributes(this.env.GLADIATOR_SAVES_DB, {
      telegramUserId: input.telegramUserId,
      telegramUsername: input.telegramUsername,
      attributes,
    });

    return { ok: true, attributes };
  }

  private async resetHeroAttributesNow(input: PlayerActorResetHeroAttributesInput): Promise<ResetHeroAttributesResult> {
    const savedHero = await readPlayerHero(this.env.GLADIATOR_SAVES_DB, input.telegramUserId);

    if (!savedHero) {
      return { ok: false, error: "player_save_not_found" };
    }

    const nextHero = resetHeroSkillPoints(savedHero, input.nowIso);

    if (nextHero === savedHero) {
      return { ok: false, error: "attribute_reset_rejected", hero: savedHero };
    }

    const attributes = createHeroAttributesPatch(nextHero, { includeResetFields: true });

    await updatePlayerHeroAttributes(this.env.GLADIATOR_SAVES_DB, {
      telegramUserId: input.telegramUserId,
      telegramUsername: input.telegramUsername,
      attributes,
    });

    return { ok: true, attributes };
  }

  private async settleOfflineBattleNow(input: PlayerActorSettleOfflineBattleInput): Promise<OfflineBattleSettlementResultPayload> {
    const savedHero = await readPlayerHero(this.env.GLADIATOR_SAVES_DB, input.telegramUserId);

    if (!savedHero) {
      return { ok: false, error: "player_save_not_found" };
    }

    const heroWithArenaEnergy = await withCurrentPlayerDailyArenaEnergy(this.env.GLADIATOR_SAVES_DB, input.telegramUserId, savedHero, input.nowIso);
    const hero = withValidatedEquipmentSnapshot(heroWithArenaEnergy, input.equipment, input.nowIso);
    const combat = createOfflineBattleSettlementCombat(input);
    const settlement = applyCombatReward(hero, combat, input.nowIso, Math.random, {
      randomEnemyLootChanceMultiplier: input.battleKind === "auto" ? AUTO_FIGHT_RANDOM_ENEMY_LOOT_CHANCE_MULTIPLIER : 1,
    });
    const heroJson = JSON.stringify(settlement.heroAfterReward);

    if (!heroJson || heroJson.length > MAX_HERO_JSON_BYTES) {
      return { ok: false, error: "invalid_hero_payload", hero };
    }

    await updatePlayerHero(this.env.GLADIATOR_SAVES_DB, {
      telegramUserId: input.telegramUserId,
      telegramUsername: input.telegramUsername,
      heroJson,
      nowIso: input.nowIso,
    });
    if (!areHeroArenaEnergyEqual(hero.arenaEnergy, settlement.heroAfterReward.arenaEnergy)) {
      await syncPlayerDailyArenaEnergyFromHero(this.env.GLADIATOR_SAVES_DB, input.telegramUserId, settlement.heroAfterReward, input.nowIso);
    }

    return { ok: true, settlement };
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const nextOperation = this.operationQueue.then(operation, operation);
    this.operationQueue = nextOperation.then(
      () => undefined,
      () => undefined,
    );

    return nextOperation;
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      const url = new URL(request.url);

      if (!url.pathname.startsWith(API_PREFIX)) {
        return json({ ok: false, error: "not_found" }, 404);
      }
      if (!env.BOT_TOKEN) {
        return json({ ok: false, error: "missing_bot_token" }, 503);
      }

      if (request.method === "POST" && url.pathname === "/api/gladiator-energy/spend") {
        return handleSpendArenaEnergy(request, env);
      }

      if (request.method === "POST" && url.pathname === "/api/gladiator-shop/buy") {
        return handleBuyShopProduct(request, env);
      }

      if (request.method === "POST" && url.pathname === "/api/gladiator-attributes/save") {
        return handleSaveHeroAttributes(request, env);
      }

      if (request.method === "POST" && url.pathname === "/api/gladiator-attributes/reset") {
        return handleResetHeroAttributes(request, env);
      }

      if (request.method === "POST" && url.pathname === "/api/gladiator-battle/settle") {
        return handleSettleOfflineBattle(request, env);
      }

      return json({ ok: false, error: "not_found" }, 404);
    } catch (error) {
      return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
    }
  },
} satisfies ExportedHandler<Env>;

async function handleSpendArenaEnergy(request: Request, env: Env): Promise<Response> {
  const auth = await verifyTelegramInitData(readTelegramInitData(request), env.BOT_TOKEN ?? "");

  if (!auth.ok) {
    return json({ ok: false, error: auth.error }, 401);
  }

  const body = await readSpendArenaEnergyRequest(request);
  const telegramUserId = String(auth.user.id);
  const actor = env.PLAYER_ACTOR.getByName(telegramUserId);
  const result = await actor.spendArenaEnergy({
    telegramUserId,
    telegramUsername: auth.user.username,
    hero: body.hero,
    amount: body.amount,
    nowIso: new Date().toISOString(),
  });

  return result.ok
    ? json({ ok: true, arenaEnergy: result.arenaEnergy })
    : json({ ok: false, error: result.error, arenaEnergy: result.arenaEnergy }, 409);
}

async function handleBuyShopProduct(request: Request, env: Env): Promise<Response> {
  const auth = await verifyTelegramInitData(readTelegramInitData(request), env.BOT_TOKEN ?? "");

  if (!auth.ok) {
    return json({ ok: false, error: auth.error }, 401);
  }

  const body = await readShopBuyRequest(request);
  const shopKind = toShopKind(body.shopKind);
  const action = body.action === undefined ? "buy" : toShopAction(body.action);
  const productId = typeof body.productId === "string" ? body.productId : undefined;

  if (!shopKind || !action || (doesShopActionRequireProductId(shopKind, action) && !productId)) {
    return json({ ok: false, error: "invalid_shop_buy_request" }, 400);
  }

  const telegramUserId = String(auth.user.id);
  const actor = env.PLAYER_ACTOR.getByName(telegramUserId);
  const result = await actor.buyShopProduct({
    telegramUserId,
    telegramUsername: auth.user.username,
    shopKind,
    action,
    productId,
    equipment: readHeroEquipmentSnapshot(body.equipment),
    nowIso: new Date().toISOString(),
  });

  if (result.ok) {
    return json({ ok: true, hero: result.hero });
  }

  const status = result.error === "player_save_not_found" || result.error === "shop_product_not_found" ? 404 : 409;

  return json({ ok: false, error: result.error, hero: result.hero }, status);
}

async function handleSaveHeroAttributes(request: Request, env: Env): Promise<Response> {
  const auth = await verifyTelegramInitData(readTelegramInitData(request), env.BOT_TOKEN ?? "");

  if (!auth.ok) {
    return json({ ok: false, error: auth.error }, 401);
  }

  const body = await readSaveHeroAttributesRequest(request);
  const baseStats = readHeroBaseStats(body.baseStats);
  const skillPoints = readNonNegativeInteger(body.skillPoints);

  if (!baseStats || skillPoints === undefined) {
    return json({ ok: false, error: "invalid_attribute_payload" }, 400);
  }

  const telegramUserId = String(auth.user.id);
  const actor = env.PLAYER_ACTOR.getByName(telegramUserId);
  const result = await actor.saveHeroAttributes({
    telegramUserId,
    telegramUsername: auth.user.username,
    baseStats,
    skillPoints,
    nowIso: new Date().toISOString(),
  });

  if (result.ok) {
    return json({ ok: true, attributes: result.attributes });
  }

  const status = result.error === "player_save_not_found" ? 404 : result.error === "invalid_attribute_payload" ? 400 : 409;

  return json({ ok: false, error: result.error, hero: result.hero }, status);
}

async function handleResetHeroAttributes(request: Request, env: Env): Promise<Response> {
  const auth = await verifyTelegramInitData(readTelegramInitData(request), env.BOT_TOKEN ?? "");

  if (!auth.ok) {
    return json({ ok: false, error: auth.error }, 401);
  }

  const telegramUserId = String(auth.user.id);
  const actor = env.PLAYER_ACTOR.getByName(telegramUserId);
  const result = await actor.resetHeroAttributes({
    telegramUserId,
    telegramUsername: auth.user.username,
    nowIso: new Date().toISOString(),
  });

  if (result.ok) {
    return json({ ok: true, attributes: result.attributes });
  }

  const status = result.error === "player_save_not_found" ? 404 : 409;

  return json({ ok: false, error: result.error, hero: result.hero }, status);
}

async function handleSettleOfflineBattle(request: Request, env: Env): Promise<Response> {
  const auth = await verifyTelegramInitData(readTelegramInitData(request), env.BOT_TOKEN ?? "");

  if (!auth.ok) {
    return json({ ok: false, error: auth.error }, 401);
  }

  const body = await readOfflineBattleSettlementRequest(request);
  const battleKind = toOfflineBattleSettlementKind(body.battleKind);
  const result = toOfflineBattleSettlementResult(body.result);
  const encounter = readOfflineBattleEncounterSnapshot(body.encounter);

  if (!battleKind || !result || !encounter) {
    return json({ ok: false, error: "invalid_battle_settlement" }, 400);
  }

  const telegramUserId = String(auth.user.id);
  const actor = env.PLAYER_ACTOR.getByName(telegramUserId);
  const settlement = await actor.settleOfflineBattle({
    telegramUserId,
    telegramUsername: auth.user.username,
    battleKind,
    result,
    encounter,
    equipment: readHeroEquipmentSnapshot(body.equipment),
    enemyEquipment: readHeroEquipmentSnapshot(body.enemyEquipment),
    playerConsumables: readOfflineBattlePlayerConsumablesSnapshot(body.playerConsumables),
    nowIso: new Date().toISOString(),
  });

  if (settlement.ok) {
    return json({ ok: true, settlement: settlement.settlement });
  }

  const status = settlement.error === "player_save_not_found" ? 404 : settlement.error === "invalid_battle_settlement" ? 400 : 409;

  return json({ ok: false, error: settlement.error, hero: settlement.hero }, status);
}

async function readSpendArenaEnergyRequest(request: Request): Promise<SpendArenaEnergyRequest> {
  try {
    const body = (await request.json()) as SpendArenaEnergyRequest;

    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

async function readShopBuyRequest(request: Request): Promise<ShopBuyRequest> {
  try {
    const body = (await request.json()) as ShopBuyRequest;

    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

async function readSaveHeroAttributesRequest(request: Request): Promise<SaveHeroAttributesRequest> {
  try {
    const body = (await request.json()) as SaveHeroAttributesRequest;

    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

async function readOfflineBattleSettlementRequest(request: Request): Promise<OfflineBattleSettlementRequest> {
  try {
    const body = (await request.json()) as OfflineBattleSettlementRequest;

    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

function applyEquipmentShopAction(hero: HeroState, input: PlayerActorBuyShopProductInput): BuyShopProductResult {
  if (input.action === "upgrade_bow_capacity") {
    return input.shopKind === "weapon"
      ? toShopMutationResult(upgradeHeroBowShotCapacity(hero, input.nowIso), hero)
      : { ok: false, error: "shop_action_not_supported" };
  }

  if (input.action !== "buy") {
    return { ok: false, error: "shop_action_not_supported" };
  }

  const product = input.productId ? getServerShopProduct(input.shopKind, input.productId) : undefined;

  if (!product) {
    return { ok: false, error: "shop_product_not_found" };
  }

  if (!areHeroItemsOwned(hero, product.itemIds) && isShopProductSealed(hero, product.itemIds, product.rarity)) {
    return { ok: false, error: "sealed_shop_product" };
  }

  return toShopMutationResult(buyAndEquipHeroItems(hero, {
    itemIds: product.itemIds,
    price: product.price,
  }, input.nowIso), hero);
}

function applyMagicShopAction(hero: HeroState, input: PlayerActorBuyShopProductInput): BuyShopProductResult {
  if (input.action === "upgrade_scroll_capacity") {
    return toShopMutationResult(upgradeHeroScrollCapacity(hero, input.nowIso), hero);
  }

  if (input.action === "sharpen_weapon") {
    return toShopMutationResult(sharpenHeroActiveWeapon(hero, input.nowIso), hero);
  }

  const product = input.productId ? getServerShopProduct("magic", input.productId) : undefined;

  if (!product) {
    return { ok: false, error: "shop_product_not_found" };
  }

  if (input.action === "upgrade_scroll") {
    return toShopMutationResult(upgradeHeroScroll(hero, product.itemIds[0], input.nowIso), hero);
  }

  if (input.action !== "buy") {
    return { ok: false, error: "shop_action_not_supported" };
  }

  const itemId = product.itemIds[0];
  const price = getHeroScrollPurchasePrice(hero, itemId, product.price);

  return toShopMutationResult(buyAndEquipHeroItems(hero, {
    itemIds: product.itemIds,
    price,
  }, input.nowIso), hero);
}

function toShopMutationResult(nextHero: HeroState, previousHero: HeroState): BuyShopProductResult {
  return nextHero === previousHero
    ? { ok: false, error: "shop_purchase_rejected" }
    : { ok: true, hero: nextHero };
}

function createHeroAttributesPatch(hero: HeroState, options: { includeResetFields?: boolean } = {}): HeroAttributesPatch {
  return {
    baseStats: {
      strength: hero.baseStats.strength,
      agility: hero.baseStats.agility,
      vitality: hero.baseStats.vitality,
    },
    skillPoints: hero.skillPoints,
    ...(options.includeResetFields
      ? {
          gold: hero.gold,
          skillPointResetCount: hero.skillPointResetCount ?? 0,
        }
      : {}),
    updatedAt: hero.updatedAt,
  };
}

function applyHeroAttributeSnapshot(
  hero: HeroState,
  baseStats: HeroBaseStats,
  skillPoints: number,
  nowIso: string,
): HeroAttributeSnapshotResult {
  const currentBaseStats = readHeroBaseStats(hero.baseStats);
  const currentSkillPoints = readNonNegativeInteger(hero.skillPoints);

  if (!currentBaseStats || currentSkillPoints === undefined) {
    return { ok: false, error: "invalid_hero_payload" };
  }

  const currentTotal = getHeroAttributeBudget(currentBaseStats, currentSkillPoints);
  const nextTotal = getHeroAttributeBudget(baseStats, skillPoints);
  const decreasesSavedAttribute = HERO_ATTRIBUTE_KEYS.some((attribute) => baseStats[attribute] < currentBaseStats[attribute]);

  if (nextTotal !== currentTotal || decreasesSavedAttribute) {
    return { ok: false, error: "invalid_attribute_allocation" };
  }

  return {
    ok: true,
    hero: {
      ...hero,
      baseStats,
      skillPoints,
      updatedAt: nowIso,
    },
  };
}

function getHeroAttributeBudget(baseStats: HeroBaseStats, skillPoints: number): number {
  return skillPoints + HERO_ATTRIBUTE_KEYS.reduce((sum, attribute) => sum + baseStats[attribute], 0);
}

function readHeroBaseStats(value: unknown): HeroBaseStats | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const baseStats = {} as Record<HeroAttributeKey, number>;

  for (const attribute of HERO_ATTRIBUTE_KEYS) {
    const attributeValue = readNonNegativeInteger(value[attribute]);

    if (attributeValue === undefined) {
      return undefined;
    }

    baseStats[attribute] = attributeValue;
  }

  return {
    strength: baseStats.strength,
    agility: baseStats.agility,
    vitality: baseStats.vitality,
  };
}

function readNonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function toOfflineBattleSettlementKind(value: unknown): OfflineBattleSettlementKind | undefined {
  return value === "manual" || value === "auto" ? value : undefined;
}

function toOfflineBattleSettlementResult(value: unknown): OfflineBattleSettlementResult | undefined {
  return value === "win" || value === "lose" || value === "draw" ? value : undefined;
}

function readOfflineBattleEncounterSnapshot(value: unknown): OfflineBattleEncounterSnapshot | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = typeof value.id === "string" ? value.id : undefined;
  const kind = value.kind === "random" || value.kind === "boss" ? value.kind : undefined;
  const tierId = readPositiveInteger(value.tierId);
  const opponentId = typeof value.opponentId === "string" ? value.opponentId : undefined;
  const difficultyId = toArenaDifficultyId(value.difficultyId);
  const backgroundVariantId = typeof value.backgroundVariantId === "string" ? value.backgroundVariantId : undefined;
  const mode = value.mode === "duoBossAi" ? value.mode : undefined;

  if (!id || !kind || !tierId || !opponentId) {
    return undefined;
  }

  if (kind === "random") {
    const opponent = getArenaRandomOpponentDefinition(opponentId);

    if (!opponent || opponent.tierId !== tierId || opponent.difficultyId !== difficultyId) {
      return undefined;
    }
  }

  if (kind === "boss") {
    const boss = getArenaBossDefinition(opponentId);

    if (!boss || boss.tierId !== tierId) {
      return undefined;
    }
  }

  return {
    id,
    kind,
    tierId,
    opponentId,
    ...(difficultyId ? { difficultyId } : {}),
    ...(backgroundVariantId ? { backgroundVariantId } : {}),
    ...(mode ? { mode } : {}),
  };
}

function readOfflineBattlePlayerConsumablesSnapshot(value: unknown): OfflineBattlePlayerConsumablesSnapshot {
  if (!isRecord(value)) {
    return {};
  }

  const snapshot: OfflineBattlePlayerConsumablesSnapshot = {};

  copyConsumableItemSnapshot(value, snapshot, "shurikenItemId");
  copyConsumableItemSnapshot(value, snapshot, "scrollItemId");
  copyConsumableItemSnapshot(value, snapshot, "fireballScrollItemId");
  copyConsumableItemSnapshot(value, snapshot, "wardScrollItemId");
  copyConsumableItemSnapshot(value, snapshot, "preciseStrikeScrollItemId");
  copyConsumableItemSnapshot(value, snapshot, "doubleStrikeScrollItemId");
  copyConsumableItemSnapshot(value, snapshot, "poisonScrollItemId");
  copyConsumableCountSnapshot(value, snapshot, "shurikenCount");
  copyConsumableCountSnapshot(value, snapshot, "scrollCount");
  copyConsumableCountSnapshot(value, snapshot, "fireballScrollCount");
  copyConsumableCountSnapshot(value, snapshot, "wardScrollCount");
  copyConsumableCountSnapshot(value, snapshot, "preciseStrikeScrollCount");
  copyConsumableCountSnapshot(value, snapshot, "doubleStrikeScrollCount");
  copyConsumableCountSnapshot(value, snapshot, "poisonScrollCount");

  return snapshot;
}

function toArenaDifficultyId(value: unknown): OfflineBattleEncounterSnapshot["difficultyId"] | undefined {
  return value === "easy" || value === "medium" || value === "hard" ? value : undefined;
}

function copyConsumableItemSnapshot(
  source: Record<string, unknown>,
  target: OfflineBattlePlayerConsumablesSnapshot,
  key: keyof OfflineBattlePlayerConsumablesSnapshot,
): void {
  const itemId = source[key];
  const item = typeof itemId === "string" ? HERO_ITEM_CATALOG[itemId] : undefined;

  if (item && isHeroConsumableItem(item)) {
    target[key] = itemId as never;
  }
}

function copyConsumableCountSnapshot(
  source: Record<string, unknown>,
  target: OfflineBattlePlayerConsumablesSnapshot,
  key: keyof OfflineBattlePlayerConsumablesSnapshot,
): void {
  const count = readNonNegativeInteger(source[key]);

  if (count !== undefined) {
    target[key] = count as never;
  }
}

function readPositiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function createOfflineBattleSettlementCombat(input: PlayerActorSettleOfflineBattleInput): CombatState {
  return {
    result: input.result,
    encounter: input.encounter,
    player: {
      name: "Player",
      ...input.playerConsumables,
    },
    enemy: {
      name: "Enemy",
      equipment: input.enemyEquipment as HeroEquipment | undefined,
    },
  } as CombatState;
}

function readHeroEquipmentSnapshot(value: unknown): HeroEquipmentSnapshot | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const snapshot: HeroEquipmentSnapshot = {};

  HERO_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    if (!(slotKey in value)) {
      return;
    }

    const itemId = value[slotKey];

    if (itemId === null || typeof itemId === "string") {
      snapshot[slotKey] = itemId;
    }
  });

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
}

function withValidatedEquipmentSnapshot(hero: HeroState, snapshot: HeroEquipmentSnapshot | undefined, nowIso: string): HeroState {
  if (!snapshot) {
    return hero;
  }

  const equipment: HeroEquipment = { ...hero.equipment };
  let changed = false;

  HERO_EQUIPMENT_SLOT_KEYS.forEach((slotKey) => {
    if (!(slotKey in snapshot)) {
      return;
    }

    const itemId = snapshot[slotKey];

    if (itemId === null) {
      if (equipment[slotKey] !== null) {
        equipment[slotKey] = null;
        changed = true;
      }
      return;
    }

    if (!itemId || !canApplyEquipmentSnapshotItem(hero, slotKey, itemId)) {
      return;
    }

    if (equipment[slotKey] !== itemId) {
      equipment[slotKey] = itemId;
      changed = true;
    }
  });

  return changed ? { ...hero, equipment, updatedAt: nowIso } : hero;
}

function canApplyEquipmentSnapshotItem(hero: HeroState, slotKey: HeroEquipmentSlotKey, itemId: HeroItemId): boolean {
  const item = HERO_ITEM_CATALOG[itemId];

  return Boolean(
    item &&
      item.equipmentSlot === slotKey &&
      !isHeroConsumableItem(item) &&
      isHeroItemOwned(hero, itemId),
  );
}

async function readPlayerHero(db: D1Database, telegramUserId: string): Promise<HeroState | null> {
  const row = await db
    .prepare("SELECT hero_json FROM player_saves WHERE telegram_user_id = ?")
    .bind(telegramUserId)
    .first<PlayerSaveHeroRow>();

  if (!row) {
    return null;
  }

  try {
    const hero = JSON.parse(row.hero_json) as unknown;

    return isHeroState(hero) ? hero : null;
  } catch {
    return null;
  }
}

async function withCurrentPlayerDailyArenaEnergy(
  db: D1Database,
  telegramUserId: string,
  hero: HeroState,
  nowIso: string,
): Promise<HeroState> {
  const arenaEnergy = await readPlayerDailyArenaEnergy(db, telegramUserId, getUtcDayKey(nowIso));

  return arenaEnergy ? { ...hero, arenaEnergy } : hero;
}

function updatePlayerHero(
  db: D1Database,
  save: { telegramUserId: string; telegramUsername?: string; heroJson: string; nowIso: string },
): Promise<D1Result> {
  return db
    .prepare(
      `
        UPDATE player_saves SET
          telegram_username = ?,
          hero_json = ?,
          schema_version = ?,
          revision = revision + 1,
          updated_at = ?
        WHERE telegram_user_id = ?
      `,
    )
    .bind(save.telegramUsername ?? null, save.heroJson, SAVE_SCHEMA_VERSION, save.nowIso, save.telegramUserId)
    .run();
}

function updatePlayerHeroAttributes(
  db: D1Database,
  save: { telegramUserId: string; telegramUsername?: string; attributes: HeroAttributesPatch },
): Promise<D1Result> {
  const attributes = save.attributes;
  const hasResetFields = attributes.gold !== undefined && attributes.skillPointResetCount !== undefined;

  if (hasResetFields) {
    return db
      .prepare(
        `
          UPDATE player_saves SET
            telegram_username = ?,
            hero_json = json_set(
              hero_json,
              '$.baseStats.strength', ?,
              '$.baseStats.agility', ?,
              '$.baseStats.vitality', ?,
              '$.skillPoints', ?,
              '$.gold', ?,
              '$.skillPointResetCount', ?,
              '$.updatedAt', ?
            ),
            schema_version = ?,
            revision = revision + 1,
            updated_at = ?
          WHERE telegram_user_id = ?
        `,
      )
      .bind(
        save.telegramUsername ?? null,
        attributes.baseStats.strength,
        attributes.baseStats.agility,
        attributes.baseStats.vitality,
        attributes.skillPoints,
        attributes.gold,
        attributes.skillPointResetCount,
        attributes.updatedAt,
        SAVE_SCHEMA_VERSION,
        attributes.updatedAt,
        save.telegramUserId,
      )
      .run();
  }

  return db
    .prepare(
      `
        UPDATE player_saves SET
          telegram_username = ?,
          hero_json = json_set(
            hero_json,
            '$.baseStats.strength', ?,
            '$.baseStats.agility', ?,
            '$.baseStats.vitality', ?,
            '$.skillPoints', ?,
            '$.updatedAt', ?
          ),
          schema_version = ?,
          revision = revision + 1,
          updated_at = ?
        WHERE telegram_user_id = ?
      `,
    )
    .bind(
      save.telegramUsername ?? null,
      attributes.baseStats.strength,
      attributes.baseStats.agility,
      attributes.baseStats.vitality,
      attributes.skillPoints,
      attributes.updatedAt,
      SAVE_SCHEMA_VERSION,
      attributes.updatedAt,
      save.telegramUserId,
    )
    .run();
}

function syncPlayerDailyArenaEnergyFromHero(
  db: D1Database,
  telegramUserId: string,
  hero: HeroState,
  nowIso: string,
): Promise<D1Result | undefined> {
  const arenaEnergy = getHeroArenaEnergyFromHero(hero, getUtcDayKey(nowIso));

  return arenaEnergy ? upsertPlayerDailyArenaEnergy(db, telegramUserId, arenaEnergy, nowIso) : Promise.resolve(undefined);
}

function getHeroArenaEnergyFromHero(hero: HeroState, dayKey: string): HeroArenaEnergy | undefined {
  const arenaEnergy = hero.arenaEnergy;

  if (!arenaEnergy || arenaEnergy.dayKey !== dayKey) {
    return undefined;
  }

  return {
    current: clampArenaEnergyValue(arenaEnergy.current),
    max: HERO_ARENA_ENERGY_MAX,
    dayKey,
  };
}

function areHeroArenaEnergyEqual(left: HeroArenaEnergy | undefined, right: HeroArenaEnergy | undefined): boolean {
  if (!left || !right) {
    return left === right;
  }

  return left.current === right.current && left.max === right.max && left.dayKey === right.dayKey;
}

function upsertPlayerDailyArenaEnergy(
  db: D1Database,
  telegramUserId: string,
  arenaEnergy: HeroArenaEnergy,
  nowIso: string,
): Promise<D1Result> {
  return db
    .prepare(
      `
        INSERT INTO player_daily_resources (
          telegram_user_id,
          resource_key,
          day_key,
          current,
          max,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(telegram_user_id, resource_key, day_key) DO UPDATE SET
          current = excluded.current,
          max = excluded.max,
          updated_at = excluded.updated_at
      `,
    )
    .bind(
      telegramUserId,
      ARENA_ENERGY_RESOURCE_KEY,
      arenaEnergy.dayKey,
      clampArenaEnergyValue(arenaEnergy.current),
      HERO_ARENA_ENERGY_MAX,
      nowIso,
    )
    .run();
}

async function spendPlayerDailyArenaEnergy(
  db: D1Database,
  telegramUserId: string,
  dayKey: string,
  amount: number,
  nowIso: string,
): Promise<SpendArenaEnergyResult> {
  const arenaEnergy = await decrementPlayerDailyArenaEnergy(db, telegramUserId, dayKey, amount, nowIso);

  if (!arenaEnergy) {
    return {
      ok: false,
      error: "not_enough_arena_energy",
      arenaEnergy: (await readPlayerDailyArenaEnergy(db, telegramUserId, dayKey)) ?? createFullHeroArenaEnergy(dayKey),
    };
  }

  return { ok: true, arenaEnergy };
}

async function decrementPlayerDailyArenaEnergy(
  db: D1Database,
  telegramUserId: string,
  dayKey: string,
  amount: number,
  nowIso: string,
): Promise<HeroArenaEnergy | null> {
  const row = await db
    .prepare(
      `
        UPDATE player_daily_resources SET
          current = current - ?,
          max = ?,
          updated_at = ?
        WHERE telegram_user_id = ?
          AND resource_key = ?
          AND day_key = ?
          AND current >= ?
        RETURNING current, max, day_key
      `,
    )
    .bind(amount, HERO_ARENA_ENERGY_MAX, nowIso, telegramUserId, ARENA_ENERGY_RESOURCE_KEY, dayKey, amount)
    .first<PlayerDailyResourceRow>();

  return row ? toHeroArenaEnergy(row) : null;
}

function initializePlayerDailyArenaEnergy(
  db: D1Database,
  telegramUserId: string,
  dayKey: string,
  nowIso: string,
): Promise<D1Result> {
  return db
    .prepare(
      `
        INSERT INTO player_daily_resources (
          telegram_user_id,
          resource_key,
          day_key,
          current,
          max,
          updated_at
        )
        VALUES (
          ?,
          ?,
          ?,
          COALESCE(
            (
              SELECT CASE
                WHEN json_valid(hero_json)
                  AND json_extract(hero_json, '$.arenaEnergy.dayKey') = ?
                  AND typeof(json_extract(hero_json, '$.arenaEnergy.current')) IN ('integer', 'real')
                THEN min(?, max(0, CAST(json_extract(hero_json, '$.arenaEnergy.current') AS INTEGER)))
                ELSE ?
              END
              FROM player_saves
              WHERE telegram_user_id = ?
            ),
            ?
          ),
          ?,
          ?
        )
        ON CONFLICT(telegram_user_id, resource_key, day_key) DO NOTHING
      `,
    )
    .bind(
      telegramUserId,
      ARENA_ENERGY_RESOURCE_KEY,
      dayKey,
      dayKey,
      HERO_ARENA_ENERGY_MAX,
      HERO_ARENA_ENERGY_MAX,
      telegramUserId,
      HERO_ARENA_ENERGY_MAX,
      HERO_ARENA_ENERGY_MAX,
      nowIso,
    )
    .run();
}

async function readPlayerDailyArenaEnergy(
  db: D1Database,
  telegramUserId: string,
  dayKey = getUtcDayKey(),
): Promise<HeroArenaEnergy | null> {
  const row = await db
    .prepare(
      `
        SELECT current, max, day_key
        FROM player_daily_resources
        WHERE telegram_user_id = ? AND resource_key = ? AND day_key = ?
      `,
    )
    .bind(telegramUserId, ARENA_ENERGY_RESOURCE_KEY, dayKey)
    .first<PlayerDailyResourceRow>();

  if (!row) {
    return null;
  }

  return toHeroArenaEnergy(row);
}

function toHeroArenaEnergy(row: PlayerDailyResourceRow): HeroArenaEnergy {
  return {
    current: clampArenaEnergyValue(row.current),
    max: HERO_ARENA_ENERGY_MAX,
    dayKey: row.day_key,
  };
}

function createFullHeroArenaEnergy(dayKey = getUtcDayKey()): HeroArenaEnergy {
  return {
    current: HERO_ARENA_ENERGY_MAX,
    max: HERO_ARENA_ENERGY_MAX,
    dayKey,
  };
}

function getArenaEnergySpendAmount(value: unknown): number {
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 1;

  if (!Number.isFinite(amount)) {
    return 1;
  }

  return Math.max(1, Math.min(HERO_ARENA_ENERGY_MAX, Math.floor(amount)));
}

function toShopKind(value: unknown): ShopKind | undefined {
  return value === "armory" || value === "weapon" || value === "magic" ? value : undefined;
}

function toShopAction(value: unknown): ShopAction | undefined {
  return value === "buy" || value === "upgrade_scroll" || value === "upgrade_scroll_capacity" || value === "sharpen_weapon" || value === "upgrade_bow_capacity"
    ? value
    : undefined;
}

function doesShopActionRequireProductId(_shopKind: ShopKind, action: ShopAction): boolean {
  return action === "buy" || action === "upgrade_scroll";
}

function getServerShopProduct(shopKind: ShopKind, productId: string): ShopProduct | undefined {
  const products = shopKind === "armory"
    ? SERVER_ARMORY_PRODUCTS
    : shopKind === "weapon"
      ? SERVER_WEAPON_PRODUCTS
      : SERVER_MAGIC_PRODUCTS;

  return products.find((product) => product.id === productId);
}

function toServerShopProduct(product: { id: string; name: string; price: number; itemIds: readonly string[] }): ShopProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    itemIds: product.itemIds.filter((itemId) => HERO_ITEM_CATALOG[itemId]),
  };
}

function pairGeneratedServerArmoryProducts(products: ShopProduct[]): ShopProduct[] {
  const pairedProducts: ShopProduct[] = [];
  const usedProductIds = new Set<string>();

  products.forEach((product) => {
    if (usedProductIds.has(product.id)) {
      return;
    }

    const item = getArmoryProductItem(product);
    const pairConfig = item ? getPairedArmorySlotConfig(item.equipmentSlot) : undefined;
    const counterpart = pairConfig ? findArmoryProductPair(product, products, pairConfig, usedProductIds) : undefined;

    if (!pairConfig) {
      pairedProducts.push(product);
      usedProductIds.add(product.id);
      return;
    }

    if (!counterpart) {
      usedProductIds.add(product.id);
      return;
    }

    const pairedProduct = createPairedArmoryProduct(product, counterpart, pairConfig);

    pairedProducts.push(pairedProduct ?? product);
    usedProductIds.add(product.id);
    usedProductIds.add(counterpart.id);
  });

  return pairedProducts;
}

function findArmoryProductPair(
  product: ShopProduct,
  products: ShopProduct[],
  pairConfig: PairedArmorySlotConfig,
  usedProductIds: ReadonlySet<string>,
): ShopProduct | undefined {
  const item = getArmoryProductItem(product);
  const pairKey = getArmoryProductPairKey(product, pairConfig);

  if (!item || !pairKey) {
    return undefined;
  }

  const counterpartSlot = item.equipmentSlot === pairConfig.backSlot ? pairConfig.frontSlot : pairConfig.backSlot;

  return products.find((candidate) => {
    const candidateItem = getArmoryProductItem(candidate);

    return (
      candidate.id !== product.id &&
      !usedProductIds.has(candidate.id) &&
      candidateItem?.equipmentSlot === counterpartSlot &&
      getArmoryProductPairKey(candidate, pairConfig) === pairKey
    );
  });
}

function createPairedArmoryProduct(
  product: ShopProduct,
  counterpart: ShopProduct,
  pairConfig: PairedArmorySlotConfig,
): ShopProduct | undefined {
  const productItem = getArmoryProductItem(product);
  const counterpartItem = getArmoryProductItem(counterpart);

  if (!productItem || !counterpartItem) {
    return undefined;
  }

  const backProduct = productItem.equipmentSlot === pairConfig.backSlot ? product : counterpart;
  const frontProduct = productItem.equipmentSlot === pairConfig.frontSlot ? product : counterpart;
  const backItemId = backProduct.itemIds[0];
  const frontItemId = frontProduct.itemIds[0];
  const pairKey = getArmoryProductPairKey(backProduct, pairConfig) ?? backProduct.id;

  if (!backItemId || !frontItemId) {
    return undefined;
  }

  return {
    id: `${pairKey}-pair`,
    name: getPairedArmoryProductName(backProduct, pairConfig),
    price: Math.max(backProduct.price, frontProduct.price),
    itemIds: [backItemId, frontItemId],
  };
}

function getArmoryProductItem(product: ShopProduct): (typeof HERO_ITEM_CATALOG)[HeroItemId] | undefined {
  const itemId = product.itemIds[0];

  return itemId ? HERO_ITEM_CATALOG[itemId] : undefined;
}

function getPairedArmorySlotConfig(slotKey: HeroEquipmentSlotKey): PairedArmorySlotConfig | undefined {
  return PAIRED_ARMORY_SLOT_CONFIGS.find((config) => config.backSlot === slotKey || config.frontSlot === slotKey);
}

function getArmoryProductPairKey(product: ShopProduct, pairConfig: PairedArmorySlotConfig): string | undefined {
  const itemId = product.itemIds[0];

  return itemId ? normalizePairedArmoryText(itemId, pairConfig).toLowerCase() : undefined;
}

function getPairedArmoryProductName(product: ShopProduct, pairConfig: PairedArmorySlotConfig): string {
  const sideFreeName = normalizePairedArmoryText(product.name, pairConfig);
  const singularLabelPattern = new RegExp(`\\b${pairConfig.singularLabel}\\b`, "iu");

  return singularLabelPattern.test(sideFreeName)
    ? sideFreeName.replace(singularLabelPattern, pairConfig.pluralLabel)
    : sideFreeName;
}

function normalizePairedArmoryText(value: string, pairConfig: PairedArmorySlotConfig): string {
  return value
    .replace(new RegExp(`(^|[_\\s-])(?:back|front)([_\\s-]+)${pairConfig.token}(?=$|[_\\s-])`, "giu"), `$1${pairConfig.token}`)
    .replace(/\s+/gu, " ")
    .trim();
}

function isHeroState(value: unknown): value is HeroState {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.gold === "number" &&
    isRecord(value.equipment) &&
    Array.isArray(value.inventory)
  );
}

function readTelegramInitData(request: Request): string {
  return request.headers.get("x-telegram-init-data") ?? "";
}

async function verifyTelegramInitData(initData: string, botToken: string): Promise<{ ok: true; user: TelegramInitUser } | { ok: false; error: string }> {
  if (!initData) {
    return { ok: false, error: "missing_init_data" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? "";
  const userJson = params.get("user") ?? "";

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await hmacSha256(new TextEncoder().encode("WebAppData"), botToken);
  const digest = await hmacSha256(secretKey, dataCheckString);

  if (!timingSafeEqualHex(hash, bytesToHex(digest))) {
    return { ok: false, error: "bad_init_data_signature" };
  }

  try {
    const user = JSON.parse(userJson) as Partial<TelegramInitUser>;
    const userId = typeof user.id === "number" && Number.isFinite(user.id) ? Math.floor(user.id) : undefined;

    if (userId === undefined) {
      return { ok: false, error: "missing_telegram_user" };
    }

    return {
      ok: true,
      user: {
        id: userId,
        username: typeof user.username === "string" ? user.username : undefined,
      },
    };
  } catch {
    return { ok: false, error: "bad_telegram_user" };
  }
}

async function hmacSha256(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

function timingSafeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getUtcDayKey(now: string | Date = new Date()): string {
  const date = typeof now === "string" ? new Date(now) : now;

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function clampArenaEnergyValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return HERO_ARENA_ENERGY_MAX;
  }

  return Math.max(0, Math.min(HERO_ARENA_ENERGY_MAX, Math.floor(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders(),
    },
  });
}

function corsHeaders(): HeadersInit {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-telegram-init-data",
  };
}
