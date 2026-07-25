export type BridgeHaptic = "light" | "medium" | "success" | "error";

interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: {
    start_param?: string;
    user?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
  viewportHeight?: number;
  viewportStableHeight?: number;
  isVersionAtLeast?: (version: string) => boolean;
  ready?: () => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
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

export type TelegramBridge = Readonly<{
  initData: string;
  startParam: string | null;
  displayName: string;
  refresh(): void;
  setGameInProgress(active: boolean): void;
  haptic(kind: BridgeHaptic): void;
  destroy(): void;
}>;

export function setupTelegramBridge(): TelegramBridge {
  let webApp = window.Telegram?.WebApp;
  let gameInProgress = false;

  const updateViewport = () => {
    const current = positiveHeight(webApp?.viewportHeight) ?? window.innerHeight;
    const stable = positiveHeight(webApp?.viewportStableHeight) ?? current;
    document.documentElement.style.setProperty("--tg-viewport-height", `${Math.round(current)}px`);
    document.documentElement.style.setProperty("--tg-viewport-stable-height", `${Math.round(stable)}px`);
  };

  const applyClosingConfirmation = () => {
    if (!supportsTelegramVersion(webApp, "6.2")) return;
    try {
      if (gameInProgress) webApp?.enableClosingConfirmation?.();
      else webApp?.disableClosingConfirmation?.();
    } catch {
      // Telegram APIs are progressive enhancements; browser play must keep working.
    }
  };

  const refresh = () => {
    const next = window.Telegram?.WebApp;
    if (next && next !== webApp) {
      try { webApp?.offEvent?.("viewportChanged", updateViewport); } catch { /* optional API */ }
      webApp = next;
      try { webApp.onEvent?.("viewportChanged", updateViewport); } catch { /* optional API */ }
    }

    try {
      webApp?.ready?.();
      webApp?.expand?.();
      if (supportsTelegramVersion(webApp, "7.7")) webApp?.disableVerticalSwipes?.();
      if (supportsTelegramVersion(webApp, "6.1")) {
        webApp?.setHeaderColor?.("#17100d");
        webApp?.setBackgroundColor?.("#17100d");
      }
    } catch {
      // The standalone preview intentionally works without Telegram.
    }

    updateViewport();
    applyClosingConfirmation();
  };

  const haptic = (kind: BridgeHaptic) => {
    if (!supportsTelegramVersion(webApp, "6.1")) return;
    try {
      if (kind === "success" || kind === "error") {
        webApp?.HapticFeedback?.notificationOccurred?.(kind);
      } else {
        webApp?.HapticFeedback?.impactOccurred?.(kind);
      }
    } catch {
      // Haptics must never interrupt a bid or play.
    }
  };

  const setGameInProgress = (active: boolean) => {
    gameInProgress = active;
    applyClosingConfirmation();
  };

  const destroy = () => {
    window.removeEventListener("resize", updateViewport);
    try { webApp?.offEvent?.("viewportChanged", updateViewport); } catch { /* optional API */ }
  };

  window.addEventListener("resize", updateViewport, { passive: true });
  try { webApp?.onEvent?.("viewportChanged", updateViewport); } catch { /* optional API */ }
  refresh();
  window.addEventListener("load", refresh, { once: true });

  return Object.freeze({
    get initData() { return webApp?.initData ?? ""; },
    get startParam() { return webApp?.initDataUnsafe?.start_param?.trim() || null; },
    get displayName() { return getTelegramDisplayName(webApp); },
    refresh,
    setGameInProgress,
    haptic,
    destroy,
  });
}

function getTelegramDisplayName(webApp: TelegramWebApp | undefined): string {
  const user = webApp?.initDataUnsafe?.user;
  const personalName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const name = personalName || user?.username || "Игрок";
  return name.trim().replace(/\s+/g, " ").slice(0, 24) || "Игрок";
}

function positiveHeight(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function supportsTelegramVersion(
  webApp: Pick<TelegramWebApp, "isVersionAtLeast"> | undefined,
  minimumVersion: string,
): boolean {
  try {
    return webApp?.isVersionAtLeast?.(minimumVersion) === true;
  } catch {
    return false;
  }
}
