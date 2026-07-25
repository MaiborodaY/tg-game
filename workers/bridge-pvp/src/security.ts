export interface TelegramInitUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface BridgeIdentity {
  userId: string;
  displayName: string;
  source: "telegram" | "development";
}

export interface BridgeAuthEnv {
  BOT_TOKEN?: string;
  ENVIRONMENT?: string;
}

export interface TelegramAuthOptions {
  nowMs?: number;
  maxAgeSeconds?: number;
  futureToleranceSeconds?: number;
}

export type TelegramAuthResult =
  | { ok: true; identity: BridgeIdentity; authDate: number }
  | { ok: false; error: string };

const DEFAULT_MAX_AUTH_AGE_SECONDS = 60 * 60;
const DEFAULT_FUTURE_TOLERANCE_SECONDS = 30;
const MAX_INIT_DATA_LENGTH = 8_192;

export class BridgeAuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    message: string,
    status: number,
    code: string,
  ) {
    super(message);
    this.name = "BridgeAuthError";
    this.status = status;
    this.code = code;
  }
}

export async function authenticateBridgeRequest(request: Request, env: BridgeAuthEnv): Promise<BridgeIdentity> {
  const initData = request.headers.get("x-telegram-init-data")?.trim() ?? "";

  if (initData) {
    if (!env.BOT_TOKEN) {
      throw new BridgeAuthError("Telegram authentication is unavailable.", 503, "missing_bot_token");
    }

    const result = await verifyTelegramInitData(initData, env.BOT_TOKEN);
    if (!result.ok) {
      throw new BridgeAuthError("Invalid Telegram authentication.", 401, result.error);
    }

    return result.identity;
  }

  if (env.ENVIRONMENT === "development") {
    const userId = normalizeDevelopmentUserId(request.headers.get("x-bridge-dev-user-id"));
    if (!userId) {
      throw new BridgeAuthError(
        "Development identity is required.",
        401,
        "missing_development_identity",
      );
    }

    return {
      userId,
      displayName: normalizeDisplayName(request.headers.get("x-bridge-dev-user-name")) ?? `Dev ${userId}`,
      source: "development",
    };
  }

  // Production deliberately has no anonymous fallback. A missing bot secret or
  // initData must never silently turn a private card room into an unauthenticated one.
  throw new BridgeAuthError("Telegram authentication is required.", 401, "missing_init_data");
}

export async function verifyTelegramInitData(
  initData: string,
  botToken: string,
  options: TelegramAuthOptions = {},
): Promise<TelegramAuthResult> {
  if (!initData || initData.length > MAX_INIT_DATA_LENGTH || !botToken) {
    return { ok: false, error: "bad_init_data" };
  }

  const params = new URLSearchParams(initData);
  if (hasDuplicateKeys(params)) {
    return { ok: false, error: "duplicate_init_data_key" };
  }

  const hash = params.get("hash") ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hash)) {
    return { ok: false, error: "bad_init_data_hash" };
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = await hmacSha256(new TextEncoder().encode("WebAppData"), botToken);
  const digest = await hmacSha256(secretKey, dataCheckString);

  if (!timingSafeEqualHex(hash.toLowerCase(), bytesToHex(digest))) {
    return { ok: false, error: "bad_init_data_signature" };
  }

  const authDateText = params.get("auth_date") ?? "";
  if (!/^\d{1,12}$/.test(authDateText)) {
    return { ok: false, error: "missing_auth_date" };
  }

  const authDate = Number(authDateText);
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1_000);
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_MAX_AUTH_AGE_SECONDS;
  const futureToleranceSeconds = options.futureToleranceSeconds ?? DEFAULT_FUTURE_TOLERANCE_SECONDS;

  if (!Number.isSafeInteger(authDate) || authDate <= 0) {
    return { ok: false, error: "bad_auth_date" };
  }
  if (authDate > nowSeconds + futureToleranceSeconds) {
    return { ok: false, error: "future_auth_date" };
  }
  if (nowSeconds - authDate > maxAgeSeconds) {
    return { ok: false, error: "expired_init_data" };
  }

  const user = parseTelegramUser(params.get("user"));
  if (!user) {
    return { ok: false, error: "bad_telegram_user" };
  }

  return {
    ok: true,
    authDate,
    identity: {
      userId: String(user.id),
      displayName: getTelegramDisplayName(user),
      source: "telegram",
    },
  };
}

function hasDuplicateKeys(params: URLSearchParams): boolean {
  const keys = new Set<string>();

  for (const [key] of params) {
    if (keys.has(key)) {
      return true;
    }
    keys.add(key);
  }

  return false;
}

function parseTelegramUser(value: string | null): TelegramInitUser | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const candidate = JSON.parse(value) as Partial<TelegramInitUser>;
    if (!Number.isSafeInteger(candidate.id) || Number(candidate.id) <= 0) {
      return undefined;
    }

    return {
      id: Number(candidate.id),
      username: readOptionalString(candidate.username),
      first_name: readOptionalString(candidate.first_name),
      last_name: readOptionalString(candidate.last_name),
    };
  } catch {
    return undefined;
  }
}

function getTelegramDisplayName(user: TelegramInitUser): string {
  const personalName = normalizeDisplayName([user.first_name, user.last_name].filter(Boolean).join(" "));
  const username = normalizeDisplayName(user.username?.replace(/^@+/, ""));

  return personalName ?? username ?? `Player ${user.id}`;
}

function normalizeDisplayName(value: string | null | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, " ").slice(0, 32);
  return normalized || undefined;
}

function normalizeDevelopmentUserId(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized && /^[a-zA-Z0-9:_-]{1,64}$/.test(normalized) ? normalized : undefined;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

async function hmacSha256(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
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
