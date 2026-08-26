import { countFaces, countSuccesses, formatTarget, isDieFace, isRollTarget, type DieFace, type RollTarget } from "./dice.ts";
import { createRollRecord, type RollRecord } from "./history.ts";

const SHARED_ROLL_PARAMETER = "roll";
const SHARED_ROLL_VERSION = "1";

export type ShareAdapters = Readonly<{
  telegramShare?: (text: string, url: string) => boolean;
  nativeShare?: (data: ShareData) => Promise<void>;
  writeClipboard?: (value: string) => Promise<void>;
}>;

export type ShareData = Readonly<{ title: string; text: string; url: string }>;
export type ShareOutcome = "telegram" | "native" | "clipboard" | "cancelled" | "failed";

export function createSharedRollUrl(pageUrl: string, record: RollRecord, target: RollTarget): string {
  const url = parseWebUrl(pageUrl);
  if (!url) return "";
  url.search = "";
  url.hash = "";
  const payload = [
    SHARED_ROLL_VERSION,
    record.createdAt.toString(36),
    String(target),
    record.faces.join(""),
  ].join(".");
  url.searchParams.set(SHARED_ROLL_PARAMETER, payload);
  return url.toString();
}

export function parseSharedRollUrl(value: string): RollRecord | null {
  const url = parseWebUrl(value);
  if (!url) return null;
  const payload = url.searchParams.get(SHARED_ROLL_PARAMETER);
  if (!payload) return null;
  const [version, timestampValue, targetValue, faceValues, ...rest] = payload.split(".");
  if (rest.length > 0 || version !== SHARED_ROLL_VERSION || !faceValues) return null;

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
  const payload = source.searchParams.get(SHARED_ROLL_PARAMETER);
  source.search = "";
  source.hash = "";
  if (payload) source.searchParams.set(SHARED_ROLL_PARAMETER, payload.slice(0, 180));
  return source.toString();
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
