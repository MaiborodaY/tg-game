import { sanitizeSharedPageUrl } from "./telegram";

export type SharedResultData = Readonly<{
  title: string;
  text: string;
  url: string;
}>;

export type ShareResultAdapters = Readonly<{
  telegramShare?: (text: string, url: string) => boolean;
  nativeShare?: (data: SharedResultData) => Promise<void>;
  writeClipboard?: (text: string) => Promise<void>;
}>;

export type ShareResultOutcome =
  | Readonly<{ kind: "telegram" }>
  | Readonly<{ kind: "native" }>
  | Readonly<{ kind: "clipboard" }>
  | Readonly<{ kind: "cancelled" }>
  | Readonly<{ kind: "failed" }>;

export async function shareResult(
  data: SharedResultData,
  adapters: ShareResultAdapters,
): Promise<ShareResultOutcome> {
  const safeData: SharedResultData = Object.freeze({
    title: data.title,
    text: data.text,
    url: sanitizeSharedPageUrl(data.url),
  });

  try {
    if (adapters.telegramShare?.(safeData.text, safeData.url) === true) {
      return { kind: "telegram" };
    }
  } catch {
    // Telegram sharing is optional; continue through standalone fallbacks.
  }

  if (adapters.nativeShare) {
    try {
      await adapters.nativeShare(safeData);
      return { kind: "native" };
    } catch (error) {
      if (isAbortError(error)) {
        return { kind: "cancelled" };
      }
    }
  }

  if (adapters.writeClipboard) {
    try {
      await adapters.writeClipboard(`${safeData.text}\n${safeData.url}`);
      return { kind: "clipboard" };
    } catch {
      // The caller owns localized failure feedback.
    }
  }

  return { kind: "failed" };
}

function isAbortError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "name" in error
    && error.name === "AbortError";
}
