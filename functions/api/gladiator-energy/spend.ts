import {
  ARENA_ENERGY_RESOURCE_KEY,
  createFullHeroArenaEnergy,
  getHeroArenaEnergyFromUnknownHero,
  getUtcDayKey,
  HERO_ARENA_ENERGY_MAX,
  json,
  readPlayerDailyArenaEnergy,
  readPlayerSave,
  readTelegramInitData,
  verifyTelegramInitData,
  type Env,
  type HeroArenaEnergy,
} from "../gladiator-save";

interface SpendArenaEnergyRequest {
  hero?: unknown;
}

type SpendArenaEnergyResult =
  | { ok: true; arenaEnergy: HeroArenaEnergy }
  | { ok: false; error: "not_enough_arena_energy"; arenaEnergy: HeroArenaEnergy };

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
    const nowIso = new Date().toISOString();
    const initialArenaEnergy = await resolveInitialArenaEnergy(env.GLADIATOR_SAVES_DB, telegramUserId, requestBody.hero, nowIso);
    const spend = await spendPlayerDailyArenaEnergy(env.GLADIATOR_SAVES_DB, telegramUserId, initialArenaEnergy, nowIso);

    return spend.ok
      ? json({ ok: true, arenaEnergy: spend.arenaEnergy })
      : json({ ok: false, error: spend.error, arenaEnergy: spend.arenaEnergy }, 409);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }
};

async function readSpendArenaEnergyRequest(request: Request): Promise<SpendArenaEnergyRequest> {
  try {
    const body = (await request.json()) as SpendArenaEnergyRequest;

    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

async function resolveInitialArenaEnergy(
  db: D1Database,
  telegramUserId: string,
  requestHero: unknown,
  nowIso: string,
): Promise<HeroArenaEnergy> {
  const dayKey = getUtcDayKey(nowIso);
  const storedDailyArenaEnergy = await readPlayerDailyArenaEnergy(db, telegramUserId, dayKey);

  if (storedDailyArenaEnergy) {
    return storedDailyArenaEnergy;
  }

  const savedHero = await readPlayerSave(db, telegramUserId);
  const savedArenaEnergy = getHeroArenaEnergyFromUnknownHero(savedHero?.hero, dayKey);
  if (savedArenaEnergy) {
    return savedArenaEnergy;
  }

  const requestArenaEnergy = getHeroArenaEnergyFromUnknownHero(requestHero, dayKey);
  if (requestArenaEnergy) {
    return requestArenaEnergy;
  }

  return createFullHeroArenaEnergy(dayKey);
}

async function spendPlayerDailyArenaEnergy(
  db: D1Database,
  telegramUserId: string,
  initialArenaEnergy: HeroArenaEnergy,
  nowIso: string,
): Promise<SpendArenaEnergyResult> {
  await initializePlayerDailyArenaEnergy(db, telegramUserId, initialArenaEnergy, nowIso);

  const updateResult = await db
    .prepare(
      `
        UPDATE player_daily_resources SET
          current = current - 1,
          max = ?,
          updated_at = ?
        WHERE telegram_user_id = ?
          AND resource_key = ?
          AND day_key = ?
          AND current > 0
      `,
    )
    .bind(HERO_ARENA_ENERGY_MAX, nowIso, telegramUserId, ARENA_ENERGY_RESOURCE_KEY, initialArenaEnergy.dayKey)
    .run();
  const arenaEnergy = (await readPlayerDailyArenaEnergy(db, telegramUserId, initialArenaEnergy.dayKey)) ?? initialArenaEnergy;

  if (updateResult.meta.changes <= 0) {
    return { ok: false, error: "not_enough_arena_energy", arenaEnergy };
  }

  return { ok: true, arenaEnergy };
}

function initializePlayerDailyArenaEnergy(
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
        ON CONFLICT(telegram_user_id, resource_key, day_key) DO NOTHING
      `,
    )
    .bind(telegramUserId, ARENA_ENERGY_RESOURCE_KEY, arenaEnergy.dayKey, arenaEnergy.current, HERO_ARENA_ENERGY_MAX, nowIso)
    .run();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
