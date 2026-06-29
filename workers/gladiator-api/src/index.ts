import { DurableObject } from "cloudflare:workers";

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

interface PlayerActorSpendArenaEnergyInput {
  telegramUserId: string;
  telegramUsername?: string;
  hero?: unknown;
  amount?: unknown;
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

interface PlayerDailyResourceRow {
  current: number;
  max: number;
  day_key: string;
}

const API_PREFIX = "/api";
const ARENA_ENERGY_RESOURCE_KEY = "arena_energy";
const HERO_ARENA_ENERGY_MAX = 10;

export class PlayerActor extends DurableObject<Env> {
  private operationQueue: Promise<void> = Promise.resolve();

  async spendArenaEnergy(input: PlayerActorSpendArenaEnergyInput): Promise<SpendArenaEnergyResult> {
    return this.enqueue(() => this.spendArenaEnergyNow(input));
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

async function readSpendArenaEnergyRequest(request: Request): Promise<SpendArenaEnergyRequest> {
  try {
    const body = (await request.json()) as SpendArenaEnergyRequest;

    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
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
