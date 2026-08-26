import { countFaces, countSuccesses, formatTarget, isDieFace, isRollTarget, type DieFace, type RollTarget } from "./dice.ts";
import { createRollRecord, type RollRecord } from "./history.ts";

const SHARED_ROLL_PARAMETER = "roll";
const TELEGRAM_START_PARAMETER = "startapp";
const TELEGRAM_WEB_APP_START_PARAMETER = "tgWebAppStartParam";
const SHARED_ROLL_VERSION = "1";
const SHARED_ROLL_START_PREFIX = `r${SHARED_ROLL_VERSION}`;
const MAX_TELEGRAM_START_PARAMETER_LENGTH = 512;

export const BRODICE_TELEGRAM_APP_URL = "https://t.me/reallifesame_bot/brodice";

export type ShareAdapters = Readonly<{
  telegramShare?: (text: string, url: string) => boolean;
  nativeShare?: (data: ShareData) => Promise<void>;
  writeClipboard?: (value: string) => Promise<void>;
}>;

export type ShareData = Readonly<{ title: string; text: string; url: string }>;
export type ShareOutcome = "telegram" | "native" | "clipboard" | "cancelled" | "failed";

export function createSharedRollUrl(appUrl: string, record: RollRecord, target: RollTarget): string {
  const url = parseWebUrl(appUrl);
  if (!url) return "";
  url.search = "";
  url.hash = "";
  const payload = [
    SHARED_ROLL_START_PREFIX,
    record.createdAt.toString(36),
    String(target),
    record.faces.join(""),
  ].join("_");
  url.searchParams.set(isTelegramMiniAppUrl(url) ? TELEGRAM_START_PARAMETER : SHARED_ROLL_PARAMETER, payload);
  return url.toString();
}

export function parseSharedRollUrl(value: string, telegramStartParam?: string | null): RollRecord | null {
  const url = parseWebUrl(value);
  const payloads = [
    telegramStartParam,
    url?.searchParams.get(TELEGRAM_WEB_APP_START_PARAMETER),
    url?.searchParams.get(TELEGRAM_START_PARAMETER),
    url?.searchParams.get(SHARED_ROLL_PARAMETER),
  ];

  for (const payload of payloads) {
    const record = parseSharedRollPayload(payload);
    if (record) return record;
  }
  return null;
}

function parseSharedRollPayload(payload: string | null | undefined): RollRecord | null {
  const normalized = payload?.trim();
  if (!normalized || normalized.length > MAX_TELEGRAM_START_PARAMETER_LENGTH) return null;
  const startPayload = normalized.startsWith(`${SHARED_ROLL_START_PREFIX}_`);
  const [version, timestampValue, targetValue, faceValues, ...rest] = normalized.split(startPayload ? "_" : ".");
  const expectedVersion = startPayload ? SHARED_ROLL_START_PREFIX : SHARED_ROLL_VERSION;
  if (rest.length > 0 || version !== expectedVersion || !faceValues) return null;

  const createdAt = Number.parseInt(timestampValue ?? "", 36);
  const target = Number(targetValue);
  const faces = [...faceValues].map(Number);
  if (!Number.isSafeInteger(createdAt) || createdAt <= 0 || !isRollTarget(target)) return null;
  if (faces.length < 1 || faces.length > 100 || !faces.every(isDieFace)) return null;

  try {
    return createRollRecord(faces as DieFace[], target, createdAt);
  } catch {
    return null;
  }
}

export function formatShareText(record: RollRecord, target: RollTarget): string {
  const counts = countFaces(record.faces);
  const successes = countSuccesses(record.faces, target);
  const distribution = counts.map((count, index) => `${index + 1}: ${count}`).join(" · ");
  return [
    `🎲 BroDice · ${record.faces.length}d6`,
    distribution,
    `${formatTarget(target)} successes: ${successes}`,
  ].join("\n");
}

export async function shareRoll(data: ShareData, adapters: ShareAdapters): Promise<ShareOutcome> {
  const url = sanitizeSharedRollUrl(data.url);
  try {
    if (adapters.telegramShare?.(data.text, url) === true) return "telegram";
  } catch {
    // Telegram integration is optional; browser fallbacks remain available.
  }

  if (adapters.nativeShare) {
    try {
      await adapters.nativeShare({ ...data, url });
      return "native";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
    }
  }

  if (adapters.writeClipboard) {
    try {
      await adapters.writeClipboard([data.text, url].filter(Boolean).join("\n"));
      return "clipboard";
    } catch {
      // The caller provides visible failure feedback.
    }
  }

  return "failed";
}

export function sanitizeSharedRollUrl(value: string): string {
  const source = parseWebUrl(value);
  if (!source) return "";
  const startPayload = source.searchParams.get(TELEGRAM_START_PARAMETER);
  const payload = source.searchParams.get(SHARED_ROLL_PARAMETER);
  source.search = "";
  source.hash = "";
  if (startPayload && isTelegramMiniAppUrl(source)) {
    source.searchParams.set(TELEGRAM_START_PARAMETER, startPayload.slice(0, MAX_TELEGRAM_START_PARAMETER_LENGTH));
  } else if (payload) {
    source.searchParams.set(SHARED_ROLL_PARAMETER, payload.slice(0, MAX_TELEGRAM_START_PARAMETER_LENGTH));
  }
  return source.toString();
}

function isTelegramMiniAppUrl(url: URL): boolean {
  return url.protocol === "https:" && url.hostname.toLowerCase() === "t.me";
}

function parseWebUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}
