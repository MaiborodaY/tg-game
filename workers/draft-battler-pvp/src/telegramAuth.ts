export interface TelegramPlayerIdentity {
  userId: string;
  displayName: string;
}

export interface TelegramAuthEnv {
  BOT_TOKEN?: string;
}

export interface TelegramAuthOptions {
  nowMs?: number;
  maxAgeSeconds?: number;
  futureToleranceSeconds?: number;
}

export type TelegramAuthResult =
  | { ok: true; identity: TelegramPlayerIdentity }
  | { ok: false; error: string };

const DEFAULT_MAX_AUTH_AGE_SECONDS = 2 * 60 * 60;
const DEFAULT_FUTURE_TOLERANCE_SECONDS = 30;
const MAX_INIT_DATA_LENGTH = 8_192;

export class TelegramAuthError extends Error {
  readonly status: number;
  readonly code: "auth_unavailable" | "invalid_init_data";

  constructor(message: string, status: number, code: "auth_unavailable" | "invalid_init_data") {
    super(message);
    this.name = "TelegramAuthError";
    this.status = status;
    this.code = code;
  }
}

/** Empty initData intentionally means an anonymous, unranked browser player. */
export async function authenticateOptionalTelegramRequest(
  request: Request,
  env: TelegramAuthEnv,
): Promise<TelegramPlayerIdentity | undefined> {
  const initData = request.headers.get("x-telegram-init-data")?.trim() ?? "";
  if (!initData) {
    return undefined;
  }
  if (!env.BOT_TOKEN) {
    throw new TelegramAuthError("Telegram authentication is unavailable.", 503, "auth_unavailable");
  }

  const result = await verifyTelegramInitData(initData, env.BOT_TOKEN);
  if (!result.ok) {
    throw new TelegramAuthError("Invalid Telegram authentication.", 401, "invalid_init_data");
  }
  return result.identity;
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
    return { ok: false, error: "duplicate_key" };
  }
  const hash = params.get("hash") ?? "";
  if (!/^[0-9a-f]{64}$/iu.test(hash)) {
    return { ok: false, error: "bad_hash" };
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = await hmacSha256(new TextEncoder().encode("WebAppData"), botToken);
  const digest = await hmacSha256(secretKey, dataCheckString);
  if (!timingSafeEqualHex(hash.toLowerCase(), bytesToHex(digest))) {
    return { ok: false, error: "bad_signature" };
  }

  const authDateText = params.get("auth_date") ?? "";
  if (!/^\d{1,12}$/u.test(authDateText)) {
    return { ok: false, error: "bad_auth_date" };
  }
  const authDate = Number(authDateText);
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1_000);
  if (!Number.isSafeInteger(authDate) || authDate <= 0) {
    return { ok: false, error: "bad_auth_date" };
  }
  if (authDate > nowSeconds + (options.futureToleranceSeconds ?? DEFAULT_FUTURE_TOLERANCE_SECONDS)) {
    return { ok: false, error: "future_auth_date" };
  }
  if (nowSeconds - authDate > (options.maxAgeSeconds ?? DEFAULT_MAX_AUTH_AGE_SECONDS)) {
    return { ok: false, error: "expired_init_data" };
  }

  const identity = parseTelegramIdentity(params.get("user"));
  return identity ? { ok: true, identity } : { ok: false, error: "bad_user" };
}

function parseTelegramIdentity(value: string | null): TelegramPlayerIdentity | undefined {
  if (!value) return undefined;
  try {
    const user = JSON.parse(value) as Record<string, unknown>;
    if (!Number.isSafeInteger(user.id) || Number(user.id) <= 0) return undefined;
    const personalName = normalizeDisplayName(
      [readString(user.first_name), readString(user.last_name)].filter(Boolean).join(" "),
    );
    const username = normalizeDisplayName(readString(user.username)?.replace(/^@+/u, ""));
    return {
      userId: String(user.id),
      displayName: personalName ?? username ?? `Player ${user.id}`,
    };
  } catch {
    return undefined;
  }
}

function hasDuplicateKeys(params: URLSearchParams): boolean {
  const seen = new Set<string>();
  for (const [key] of params) {
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function normalizeDisplayName(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/gu, " ").slice(0, 32);
  return normalized || undefined;
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
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
