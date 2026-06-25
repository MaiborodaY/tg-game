export interface Env {
  BOT_TOKEN?: string;
  GLADIATOR_SAVES_DB?: D1Database;
}

interface TelegramInitUser {
  id: number;
  username?: string;
}

interface PlayerSaveRow {
  hero_json: string;
  schema_version: number;
  revision: number;
  created_at: string;
  updated_at: string;
}

interface PlayerDailyResourceRow {
  current: number;
  max: number;
  day_key: string;
}

export interface PlayerSave {
  hero: unknown;
  schemaVersion: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface HeroArenaEnergy {
  current: number;
  max: number;
  dayKey: string;
}

const SAVE_SCHEMA_VERSION = 1;
const MAX_HERO_JSON_BYTES = 100_000;
export const ARENA_ENERGY_RESOURCE_KEY = "arena_energy";
export const HERO_ARENA_ENERGY_MAX = 10;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
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

    const telegramUserId = String(auth.user.id);

    if (request.method === "GET") {
      return json({ ok: true, save: await readPlayerSaveWithDailyArenaEnergy(env.GLADIATOR_SAVES_DB, telegramUserId) });
    }

    if (request.method === "PUT") {
      const body = await request.json<{ hero?: unknown }>();
      const heroJson = JSON.stringify(body.hero);

      if (!body.hero || !heroJson || heroJson.length > MAX_HERO_JSON_BYTES) {
        return json({ ok: false, error: "invalid_hero_payload" }, 400);
      }

      await upsertPlayerSave(env.GLADIATOR_SAVES_DB, {
        telegramUserId,
        telegramUsername: auth.user.username,
        heroJson,
      });
      await syncDailyArenaEnergyFromHero(env.GLADIATOR_SAVES_DB, telegramUserId, body.hero);

      return json({ ok: true, save: await readPlayerSaveWithDailyArenaEnergy(env.GLADIATOR_SAVES_DB, telegramUserId) });
    }

    if (request.method === "DELETE") {
      await env.GLADIATOR_SAVES_DB
        .prepare("DELETE FROM player_daily_resources WHERE telegram_user_id = ?")
        .bind(telegramUserId)
        .run();
      await env.GLADIATOR_SAVES_DB
        .prepare("DELETE FROM player_saves WHERE telegram_user_id = ?")
        .bind(telegramUserId)
        .run();

      return json({ ok: true });
    }

    return json({ ok: false, error: "method_not_allowed" }, 405);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }
};

export function readTelegramInitData(request: Request): string {
  return request.headers.get("x-telegram-init-data") ?? "";
}

export async function verifyTelegramInitData(initData: string, botToken: string): Promise<{ ok: true; user: TelegramInitUser } | { ok: false; error: string }> {
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

export async function readPlayerSave(db: D1Database, telegramUserId: string): Promise<PlayerSave | null> {
  const row = await db
    .prepare("SELECT hero_json, schema_version, revision, created_at, updated_at FROM player_saves WHERE telegram_user_id = ?")
    .bind(telegramUserId)
    .first<PlayerSaveRow>();

  if (!row) {
    return null;
  }

  return {
    hero: JSON.parse(row.hero_json),
    schemaVersion: row.schema_version,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function readPlayerSaveWithDailyArenaEnergy(db: D1Database, telegramUserId: string): Promise<PlayerSave | null> {
  const save = await readPlayerSave(db, telegramUserId);

  if (!save) {
    return null;
  }

  const dailyArenaEnergy = await readPlayerDailyArenaEnergy(db, telegramUserId);

  if (!dailyArenaEnergy) {
    return save;
  }

  return {
    ...save,
    hero: withArenaEnergy(save.hero, dailyArenaEnergy),
  };
}

export function upsertPlayerSave(
  db: D1Database,
  save: { telegramUserId: string; telegramUsername?: string; heroJson: string },
): Promise<D1Result> {
  return db
    .prepare(`
      INSERT INTO player_saves (
        telegram_user_id,
        telegram_username,
        hero_json,
        schema_version,
        revision,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(telegram_user_id) DO UPDATE SET
        telegram_username = excluded.telegram_username,
        hero_json = excluded.hero_json,
        schema_version = excluded.schema_version,
        revision = player_saves.revision + 1,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    `)
    .bind(save.telegramUserId, save.telegramUsername ?? null, save.heroJson, SAVE_SCHEMA_VERSION)
    .run();
}

export function updatePlayerSaveIfRevision(
  db: D1Database,
  save: { telegramUserId: string; telegramUsername?: string; heroJson: string; revision: number },
): Promise<D1Result> {
  return db
    .prepare(`
      UPDATE player_saves SET
        telegram_username = ?,
        hero_json = ?,
        schema_version = ?,
        revision = revision + 1,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE telegram_user_id = ? AND revision = ?
    `)
    .bind(save.telegramUsername ?? null, save.heroJson, SAVE_SCHEMA_VERSION, save.telegramUserId, save.revision)
    .run();
}

export async function readPlayerDailyArenaEnergy(
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

  return {
    current: clampArenaEnergyValue(row.current),
    max: HERO_ARENA_ENERGY_MAX,
    dayKey: row.day_key,
  };
}

export function upsertPlayerDailyArenaEnergy(
  db: D1Database,
  save: { telegramUserId: string; arenaEnergy: HeroArenaEnergy; updatedAt?: string },
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
      save.telegramUserId,
      ARENA_ENERGY_RESOURCE_KEY,
      save.arenaEnergy.dayKey,
      clampArenaEnergyValue(save.arenaEnergy.current),
      HERO_ARENA_ENERGY_MAX,
      save.updatedAt ?? new Date().toISOString(),
    )
    .run();
}

export function getHeroArenaEnergyFromUnknownHero(hero: unknown, dayKey = getUtcDayKey()): HeroArenaEnergy | null {
  if (!isRecord(hero) || !isRecord(hero.arenaEnergy) || hero.arenaEnergy.dayKey !== dayKey) {
    return null;
  }

  return {
    current: clampArenaEnergyValue(hero.arenaEnergy.current),
    max: HERO_ARENA_ENERGY_MAX,
    dayKey,
  };
}

export function createFullHeroArenaEnergy(dayKey = getUtcDayKey()): HeroArenaEnergy {
  return {
    current: HERO_ARENA_ENERGY_MAX,
    max: HERO_ARENA_ENERGY_MAX,
    dayKey,
  };
}

export function getUtcDayKey(now: string | Date = new Date()): string {
  const date = typeof now === "string" ? new Date(now) : now;

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function syncDailyArenaEnergyFromHero(db: D1Database, telegramUserId: string, hero: unknown): Promise<D1Result | undefined> {
  const arenaEnergy = getHeroArenaEnergyFromUnknownHero(hero);

  if (!arenaEnergy) {
    return Promise.resolve(undefined);
  }

  return upsertPlayerDailyArenaEnergy(db, { telegramUserId, arenaEnergy });
}

function withArenaEnergy(hero: unknown, arenaEnergy: HeroArenaEnergy): unknown {
  if (!isRecord(hero)) {
    return hero;
  }

  return {
    ...hero,
    arenaEnergy,
  };
}

function clampArenaEnergyValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return HERO_ARENA_ENERGY_MAX;
  }

  return Math.max(0, Math.min(HERO_ARENA_ENERGY_MAX, Math.floor(value)));
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

export function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
