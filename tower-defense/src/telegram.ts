type HapticKind = "light" | "medium" | "heavy" | "success" | "error";

type TelegramSafeAreaInset = Readonly<{
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}>;

type TelegramWebApp = {
  initData?: string;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isFullscreen?: boolean;
  safeAreaInset?: TelegramSafeAreaInset;
  contentSafeAreaInset?: TelegramSafeAreaInset;
  isVersionAtLeast?: (version: string) => boolean;
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
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
  requestFullscreen(): boolean;
  setClosingConfirmation(enabled: boolean): void;
  readonly initData: string;
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

  const updateSafeArea = () => {
    if (!supportsApiVersion(webApp, "8.0")) {
      clearSafeAreaCssVariables();
      return;
    }
    applySafeAreaCssVariables("--td-safe-area-inset", webApp?.safeAreaInset);
    applySafeAreaCssVariables("--td-content-safe-area-inset", webApp?.contentSafeAreaInset);
  };

  const bindEvents = (target: TelegramWebApp | undefined) => {
    try { target?.onEvent?.("viewportChanged", updateViewport); } catch { /* optional Telegram API */ }
    if (!supportsApiVersion(target, "8.0")) return;
    try { target?.onEvent?.("safeAreaChanged", updateSafeArea); } catch { /* optional Telegram API */ }
    try { target?.onEvent?.("contentSafeAreaChanged", updateSafeArea); } catch { /* optional Telegram API */ }
  };

  const unbindEvents = (target: TelegramWebApp | undefined) => {
    try { target?.offEvent?.("viewportChanged", updateViewport); } catch { /* optional Telegram API */ }
    try { target?.offEvent?.("safeAreaChanged", updateSafeArea); } catch { /* optional Telegram API */ }
    try { target?.offEvent?.("contentSafeAreaChanged", updateSafeArea); } catch { /* optional Telegram API */ }
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
      unbindEvents(webApp);
      webApp = next;
      bindEvents(webApp);
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
    updateSafeArea();
  };

  const requestFullscreen = () => {
    try {
      if (supportsApiVersion(webApp, "8.0") && typeof webApp?.requestFullscreen === "function") {
        if (!webApp.isFullscreen) webApp.requestFullscreen();
        return true;
      }
    } catch {
      // Fall through to the older expand API when fullscreen is rejected by the host.
    }
    try { webApp?.expand?.(); } catch { /* optional Telegram API */ }
    return false;
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
    unbindEvents(webApp);
    window.removeEventListener("resize", updateViewport);
  };

  window.addEventListener("resize", updateViewport, { passive: true });
  bindEvents(webApp);
  refresh();
  window.addEventListener("load", refresh, { once: true });

  return Object.freeze({
    get initData() { return webApp?.initData ?? ""; },
    refresh,
    requestFullscreen,
    setClosingConfirmation,
    haptic,
    destroy,
  });
}

const SAFE_AREA_SIDES = ["top", "right", "bottom", "left"] as const;

function applySafeAreaCssVariables(prefix: string, inset: TelegramSafeAreaInset | undefined): void {
  const style = document.documentElement.style;
  for (const side of SAFE_AREA_SIDES) {
    const property = `${prefix}-${side}`;
    const value = nonNegativeInset(inset?.[side]);
    if (value === null) style.removeProperty(property);
    else style.setProperty(property, `${Math.round(value)}px`);
  }
}

function clearSafeAreaCssVariables(): void {
  for (const prefix of ["--td-safe-area-inset", "--td-content-safe-area-inset"]) {
    applySafeAreaCssVariables(prefix, undefined);
  }
}

function positiveHeight(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function nonNegativeInset(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
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
