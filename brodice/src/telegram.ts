export type HapticKind = "light" | "medium" | "success" | "error";

type TelegramInsets = Readonly<{ top?: number; right?: number; bottom?: number; left?: number }>;

interface TelegramWebApp {
  initDataUnsafe?: { start_param?: string };
  viewportHeight?: number;
  viewportStableHeight?: number;
  safeAreaInset?: TelegramInsets;
  contentSafeAreaInset?: TelegramInsets;
  isVersionAtLeast?: (version: string) => boolean;
  ready?: () => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  onEvent?: (name: string, callback: () => void) => void;
  offEvent?: (name: string, callback: () => void) => void;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred?: (type: "success" | "error" | "warning") => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export type TelegramAdapter = Readonly<{
  isTelegram: boolean;
  startParam: string | null;
  ready(): void;
  haptic(kind: HapticKind): void;
  share(text: string, url: string): boolean;
  destroy(): void;
}>;

export function setupTelegramAdapter(host: Window = window, style: CSSStyleDeclaration = document.documentElement.style): TelegramAdapter {
  let webApp = host.Telegram?.WebApp;
  let destroyed = false;

  const updateViewport = () => {
    const viewport = positiveNumber(webApp?.viewportHeight) ?? host.innerHeight;
    const stable = positiveNumber(webApp?.viewportStableHeight) ?? viewport;
    style.setProperty("--tg-viewport-height", `${Math.round(viewport)}px`);
    style.setProperty("--tg-viewport-stable-height", `${Math.round(stable)}px`);
  };

  const updateInsets = () => {
    const insets = webApp?.contentSafeAreaInset ?? webApp?.safeAreaInset;
    style.setProperty("--tg-safe-top", `${nonNegativeNumber(insets?.top)}px`);
    style.setProperty("--tg-safe-right", `${nonNegativeNumber(insets?.right)}px`);
    style.setProperty("--tg-safe-bottom", `${nonNegativeNumber(insets?.bottom)}px`);
    style.setProperty("--tg-safe-left", `${nonNegativeNumber(insets?.left)}px`);
  };

  const bindEvents = (app: TelegramWebApp | undefined) => {
    try { app?.onEvent?.("viewportChanged", updateViewport); } catch { /* Optional Telegram API. */ }
    try { app?.onEvent?.("safeAreaChanged", updateInsets); } catch { /* Optional Telegram API. */ }
    try { app?.onEvent?.("contentSafeAreaChanged", updateInsets); } catch { /* Optional Telegram API. */ }
  };

  const unbindEvents = (app: TelegramWebApp | undefined) => {
    try { app?.offEvent?.("viewportChanged", updateViewport); } catch { /* Optional Telegram API. */ }
    try { app?.offEvent?.("safeAreaChanged", updateInsets); } catch { /* Optional Telegram API. */ }
    try { app?.offEvent?.("contentSafeAreaChanged", updateInsets); } catch { /* Optional Telegram API. */ }
  };

  const ready = () => {
    if (destroyed) return;
    const next = host.Telegram?.WebApp;
    if (next !== webApp) {
      unbindEvents(webApp);
      webApp = next;
      bindEvents(webApp);
    }
    try {
      webApp?.ready?.();
      webApp?.expand?.();
      if (supportsVersion(webApp, "7.7")) webApp?.disableVerticalSwipes?.();
      if (supportsVersion(webApp, "6.1")) {
        webApp?.setHeaderColor?.("#0d1011");
        webApp?.setBackgroundColor?.("#080a0b");
      }
    } catch {
      // Browser preview intentionally works without Telegram.
    }
    updateViewport();
    updateInsets();
  };

  const haptic = (kind: HapticKind) => {
    if (destroyed || !supportsVersion(webApp, "6.1")) return;
    try {
      if (kind === "success" || kind === "error") webApp?.HapticFeedback?.notificationOccurred?.(kind);
      else webApp?.HapticFeedback?.impactOccurred?.(kind);
    } catch {
      // Feedback must never block a roll.
    }
  };

  const share = (text: string, url: string): boolean => {
    if (destroyed || !webApp?.openTelegramLink) return false;
    try {
      webApp.openTelegramLink(createTelegramShareUrl(text, url));
      return true;
    } catch {
      return false;
    }
  };

  const destroy = () => {
    if (destroyed) return;
    unbindEvents(webApp);
    host.removeEventListener("resize", updateViewport);
    destroyed = true;
  };

  host.addEventListener("resize", updateViewport, { passive: true });
  bindEvents(webApp);
  ready();

  return Object.freeze({
    get isTelegram() { return webApp !== undefined; },
    get startParam() {
      const value = webApp?.initDataUnsafe?.start_param;
      return typeof value === "string" && value.trim() ? value.trim() : null;
    },
    ready,
    haptic,
    share,
    destroy,
  });
}

export function createTelegramShareUrl(text: string, url: string): string {
  const params = new URLSearchParams();
  if (url) params.set("url", url);
  params.set("text", text.trim().slice(0, 1_024));
  return `https://t.me/share/url?${params.toString()}`;
}

export function supportsVersion(
  webApp: Pick<TelegramWebApp, "isVersionAtLeast"> | undefined,
  minimum: string,
): boolean {
  try {
    return webApp?.isVersionAtLeast?.(minimum) === true;
  } catch {
    return false;
  }
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function nonNegativeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}
