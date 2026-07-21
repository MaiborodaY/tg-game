type HapticKind = "light" | "medium" | "heavy" | "success" | "error";

type TelegramWebApp = {
  viewportHeight?: number;
  viewportStableHeight?: number;
  isVersionAtLeast?: (version: string) => boolean;
  ready?: () => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  onEvent?: (name: string, callback: () => void) => void;
  offEvent?: (name: string, callback: () => void) => void;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred?: (type: "success" | "error" | "warning") => void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export type TelegramBridge = Readonly<{
  refresh(): void;
  setClosingConfirmation(enabled: boolean): void;
  haptic(kind: HapticKind): void;
  destroy(): void;
}>;

export function setupTelegramBridge(): TelegramBridge {
  let webApp = window.Telegram?.WebApp;
  let closingConfirmationRequested = false;

  const updateViewport = () => {
    const current = positiveHeight(webApp?.viewportHeight) || window.innerHeight;
    const stable = positiveHeight(webApp?.viewportStableHeight) || current;
    document.documentElement.style.setProperty("--tg-viewport-height", `${Math.round(current)}px`);
    document.documentElement.style.setProperty("--tg-viewport-stable-height", `${Math.round(stable)}px`);
  };

  const applyClosingConfirmation = () => {
    try {
      if (!supportsApiVersion(webApp, "6.2")) return;
      if (closingConfirmationRequested) webApp?.enableClosingConfirmation?.();
      else webApp?.disableClosingConfirmation?.();
    } catch {
      // Closing confirmation is a progressive enhancement.
    }
  };

  const refresh = () => {
    const next = window.Telegram?.WebApp;
    if (next && next !== webApp) {
      try { webApp?.offEvent?.("viewportChanged", updateViewport); } catch { /* optional Telegram API */ }
      webApp = next;
      try { webApp.onEvent?.("viewportChanged", updateViewport); } catch { /* optional Telegram API */ }
    }
    try {
      webApp?.ready?.();
      webApp?.expand?.();
      if (supportsApiVersion(webApp, "7.7")) webApp?.disableVerticalSwipes?.();
      if (supportsApiVersion(webApp, "6.1")) {
        webApp?.setHeaderColor?.("#102a27");
        webApp?.setBackgroundColor?.("#0b1d1b");
      }
    } catch {
      // The game must keep working in ordinary browsers and older Telegram clients.
    }
    applyClosingConfirmation();
    updateViewport();
  };

  const setClosingConfirmation = (enabled: boolean) => {
    closingConfirmationRequested = enabled;
    applyClosingConfirmation();
  };

  const haptic = (kind: HapticKind) => {
    try {
      if (!supportsApiVersion(webApp, "6.1")) return;
      if (kind === "success" || kind === "error") webApp?.HapticFeedback?.notificationOccurred?.(kind);
      else webApp?.HapticFeedback?.impactOccurred?.(kind);
    } catch {
      // Haptics are optional and must never interrupt combat.
    }
  };

  const destroy = () => {
    try { webApp?.offEvent?.("viewportChanged", updateViewport); } catch { /* optional Telegram API */ }
    window.removeEventListener("resize", updateViewport);
  };

  window.addEventListener("resize", updateViewport, { passive: true });
  try { webApp?.onEvent?.("viewportChanged", updateViewport); } catch { /* optional Telegram API */ }
  refresh();
  window.addEventListener("load", refresh, { once: true });

  return Object.freeze({ refresh, setClosingConfirmation, haptic, destroy });
}

function positiveHeight(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function supportsApiVersion(
  webApp: Pick<TelegramWebApp, "isVersionAtLeast"> | null | undefined,
  version: string,
): boolean {
  try {
    return webApp?.isVersionAtLeast?.(version) === true;
  } catch {
    return false;
  }
}
