interface Env {
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

const SAVE_SCHEMA_VERSION = 1;
const MAX_HERO_JSON_BYTES = 100_000;

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

    if (request.method === "GET") {
      return json({ ok: true, save: await readPlayerSave(env.GLADIATOR_SAVES_DB, String(auth.user.id)) });
    }

    if (request.method === "PUT") {
      const body = await request.json<{ hero?: unknown }>();
      const heroJson = JSON.stringify(body.hero);

      if (!body.hero || !heroJson || heroJson.length > MAX_HERO_JSON_BYTES) {
        return json({ ok: false, error: "invalid_hero_payload" }, 400);
      }

      await upsertPlayerSave(env.GLADIATOR_SAVES_DB, {
        telegramUserId: String(auth.user.id),
        telegramUsername: auth.user.username,
        heroJson,
      });

      return json({ ok: true, save: await readPlayerSave(env.GLADIATOR_SAVES_DB, String(auth.user.id)) });
    }

    if (request.method === "DELETE") {
      await env.GLADIATOR_SAVES_DB
        .prepare("DELETE FROM player_saves WHERE telegram_user_id = ?")
        .bind(String(auth.user.id))
        .run();

      return json({ ok: true });
    }

    return json({ ok: false, error: "method_not_allowed" }, 405);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }
};

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

async function readPlayerSave(db: D1Database, telegramUserId: string): Promise<{ hero: unknown; schemaVersion: number; revision: number; createdAt: string; updatedAt: string } | null> {
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

function upsertPlayerSave(
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

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
