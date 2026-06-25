import {
  json,
  readPlayerSave,
  readTelegramInitData,
  updatePlayerSaveIfRevision,
  upsertPlayerSave,
  verifyTelegramInitData,
  type Env,
} from "../gladiator-save";

interface SpendArenaEnergyRequest {
  hero?: unknown;
}

interface HeroArenaEnergy {
  current: number;
  max: number;
  dayKey: string;
}

type SpendArenaEnergyResult =
  | { ok: true; hero: Record<string, unknown>; arenaEnergy: HeroArenaEnergy }
  | { ok: false; error: "invalid_hero_payload" | "not_enough_arena_energy"; hero?: Record<string, unknown>; arenaEnergy?: HeroArenaEnergy };

const HERO_ARENA_ENERGY_MAX = 10;
const MAX_HERO_JSON_BYTES = 100_000;
const MAX_SPEND_RETRIES = 2;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.GLADIATOR_SAVES_DB) {
      return json({ ok: false, error: "missing_saves_db_binding" }, 503);
    }
    if (!env.BOT_TOKEN) {
      return json({ ok: false, error: "missing_bot_token" }, 503);
    }

    const auth = await verifyTelegramInitData(readTelegramInitData(request), env.BOT_TOKEN);
    if (!auth.ok) {
      return json({ ok: false, error: auth.error }, 401);
    }

    const requestBody = await readSpendArenaEnergyRequest(request);
    const telegramUserId = String(auth.user.id);

    for (let attempt = 0; attempt <= MAX_SPEND_RETRIES; attempt += 1) {
      const save = await readPlayerSave(env.GLADIATOR_SAVES_DB, telegramUserId);

      if (!save) {
        return spendAndCreatePlayerSave(env.GLADIATOR_SAVES_DB, {
          telegramUserId,
          telegramUsername: auth.user.username,
          seedHero: requestBody.hero,
        });
      }

      const spend = spendArenaEnergy(save.hero, new Date().toISOString());

      if (!spend.ok) {
        return json({ ok: false, error: spend.error, hero: spend.hero, arenaEnergy: spend.arenaEnergy }, spend.error === "not_enough_arena_energy" ? 409 : 400);
      }

      const heroJson = JSON.stringify(spend.hero);
      if (!heroJson || heroJson.length > MAX_HERO_JSON_BYTES) {
        return json({ ok: false, error: "invalid_hero_payload" }, 400);
      }

      const updateResult = await updatePlayerSaveIfRevision(env.GLADIATOR_SAVES_DB, {
        telegramUserId,
        telegramUsername: auth.user.username,
        heroJson,
        revision: save.revision,
      });

      if (updateResult.meta.changes > 0) {
        return json({ ok: true, hero: spend.hero, arenaEnergy: spend.arenaEnergy });
      }
    }

    return json({ ok: false, error: "save_revision_conflict" }, 409);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }
};

async function spendAndCreatePlayerSave(
  db: D1Database,
  save: { telegramUserId: string; telegramUsername?: string; seedHero: unknown },
): Promise<Response> {
  const spend = spendArenaEnergy(save.seedHero, new Date().toISOString());

  if (!spend.ok) {
    return json({ ok: false, error: spend.error, hero: spend.hero, arenaEnergy: spend.arenaEnergy }, spend.error === "not_enough_arena_energy" ? 409 : 400);
  }

  const heroJson = JSON.stringify(spend.hero);

  if (!heroJson || heroJson.length > MAX_HERO_JSON_BYTES) {
    return json({ ok: false, error: "invalid_hero_payload" }, 400);
  }

  await upsertPlayerSave(db, {
    telegramUserId: save.telegramUserId,
    telegramUsername: save.telegramUsername,
    heroJson,
  });

  return json({ ok: true, hero: spend.hero, arenaEnergy: spend.arenaEnergy });
}

async function readSpendArenaEnergyRequest(request: Request): Promise<SpendArenaEnergyRequest> {
  try {
    const body = (await request.json()) as SpendArenaEnergyRequest;

    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

function spendArenaEnergy(hero: unknown, nowIso: string): SpendArenaEnergyResult {
  if (!isHeroStateLike(hero)) {
    return { ok: false, error: "invalid_hero_payload" };
  }

  const dayKey = getUtcDayKey(nowIso);
  const currentEnergy = getCurrentArenaEnergy(hero.arenaEnergy, dayKey);
  const normalizedEnergy: HeroArenaEnergy = {
    current: currentEnergy,
    max: HERO_ARENA_ENERGY_MAX,
    dayKey,
  };

  if (currentEnergy <= 0) {
    return {
      ok: false,
      error: "not_enough_arena_energy",
      hero: {
        ...hero,
        arenaEnergy: normalizedEnergy,
      },
      arenaEnergy: normalizedEnergy,
    };
  }

  const arenaEnergy: HeroArenaEnergy = {
    ...normalizedEnergy,
    current: currentEnergy - 1,
  };

  return {
    ok: true,
    hero: {
      ...hero,
      arenaEnergy,
      updatedAt: nowIso,
    },
    arenaEnergy,
  };
}

function getCurrentArenaEnergy(source: unknown, dayKey: string): number {
  if (!isRecord(source) || source.dayKey !== dayKey) {
    return HERO_ARENA_ENERGY_MAX;
  }

  return clampArenaEnergyValue(source.current);
}

function clampArenaEnergyValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return HERO_ARENA_ENERGY_MAX;
  }

  return Math.max(0, Math.min(HERO_ARENA_ENERGY_MAX, Math.floor(value)));
}

function getUtcDayKey(nowIso: string): string {
  const date = new Date(nowIso);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function isHeroStateLike(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
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
