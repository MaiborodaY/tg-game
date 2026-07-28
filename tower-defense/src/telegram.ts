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
  exitFullscreen?: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  close?: () => void;
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
  readonly supportsFullscreen: boolean;
  readonly isFullscreen: boolean;
  readonly canClose: boolean;
  requestFullscreen(): boolean;
  exitFullscreen(): boolean;
  onFullscreenChange(listener: (isFullscreen: boolean) => void): () => void;
  setClosingConfirmation(enabled: boolean): void;
  close(): boolean;
  readonly initData: string;
  haptic(kind: HapticKind): void;
  destroy(): void;
}>;

export function setupTelegramBridge(): TelegramBridge {
  let webApp = window.Telegram?.WebApp;
  let closingConfirmationRequested = false;
  let destroyed = false;
  const fullscreenListeners = new Set<(isFullscreen: boolean) => void>();

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

  const emitFullscreenChange = () => {
    if (destroyed) return;
    const isFullscreen = webApp?.isFullscreen === true;
    for (const listener of [...fullscreenListeners]) {
      try { listener(isFullscreen); } catch { /* UI listeners must not break the bridge. */ }
    }
  };

  const handleFullscreenEvent = () => {
    if (destroyed) return;
    updateViewport();
    updateSafeArea();
    emitFullscreenChange();
  };

  const bindEvents = (target: TelegramWebApp | undefined) => {
    try { target?.onEvent?.("viewportChanged", updateViewport); } catch { /* optional Telegram API */ }
    if (!supportsApiVersion(target, "8.0")) return;
    try { target?.onEvent?.("safeAreaChanged", updateSafeArea); } catch { /* optional Telegram API */ }
    try { target?.onEvent?.("contentSafeAreaChanged", updateSafeArea); } catch { /* optional Telegram API */ }
    try { target?.onEvent?.("fullscreenChanged", handleFullscreenEvent); } catch { /* optional Telegram API */ }
    try { target?.onEvent?.("fullscreenFailed", handleFullscreenEvent); } catch { /* optional Telegram API */ }
  };

  const unbindEvents = (target: TelegramWebApp | undefined) => {
    try { target?.offEvent?.("viewportChanged", updateViewport); } catch { /* optional Telegram API */ }
    try { target?.offEvent?.("safeAreaChanged", updateSafeArea); } catch { /* optional Telegram API */ }
    try { target?.offEvent?.("contentSafeAreaChanged", updateSafeArea); } catch { /* optional Telegram API */ }
    try { target?.offEvent?.("fullscreenChanged", handleFullscreenEvent); } catch { /* optional Telegram API */ }
    try { target?.offEvent?.("fullscreenFailed", handleFullscreenEvent); } catch { /* optional Telegram API */ }
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
    if (destroyed) return;
    const next = window.Telegram?.WebApp;
    if (next !== webApp) {
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
    emitFullscreenChange();
  };

  const requestFullscreen = () => {
    if (destroyed || !supportsFullscreen(webApp)) return false;
    if (webApp?.isFullscreen) return true;
    try {
      webApp?.requestFullscreen?.();
      return true;
    } catch {
      return false;
    }
  };

  const exitFullscreen = () => {
    if (destroyed || !supportsFullscreen(webApp)) return false;
    if (!webApp?.isFullscreen) return true;
    try {
      webApp?.exitFullscreen?.();
      return true;
    } catch {
      return false;
    }
  };

  const onFullscreenChange = (listener: (isFullscreen: boolean) => void) => {
    if (destroyed) return () => {};
    fullscreenListeners.add(listener);
    return () => fullscreenListeners.delete(listener);
  };

  const setClosingConfirmation = (enabled: boolean) => {
    closingConfirmationRequested = enabled;
    applyClosingConfirmation();
  };

  const close = () => {
    if (destroyed || typeof webApp?.close !== "function") return false;
    try {
      webApp.close();
      return true;
    } catch {
      return false;
    }
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
    if (destroyed) return;
    destroyed = true;
    unbindEvents(webApp);
    fullscreenListeners.clear();
    window.removeEventListener("resize", updateViewport);
    window.removeEventListener("load", refresh);
  };

  window.addEventListener("resize", updateViewport, { passive: true });
  bindEvents(webApp);
  refresh();
  window.addEventListener("load", refresh, { once: true });

  return Object.freeze({
    get initData() { return webApp?.initData ?? ""; },
    get supportsFullscreen() { return supportsFullscreen(webApp); },
    get isFullscreen() { return webApp?.isFullscreen === true; },
    get canClose() { return typeof webApp?.close === "function"; },
    refresh,
    requestFullscreen,
    exitFullscreen,
    onFullscreenChange,
    setClosingConfirmation,
    close,
    haptic,
    destroy,
  });
}

function supportsFullscreen(webApp: TelegramWebApp | undefined): boolean {
  return supportsApiVersion(webApp, "8.0")
    && typeof webApp?.requestFullscreen === "function"
    && typeof webApp?.exitFullscreen === "function";
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
