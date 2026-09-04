type TelegramSafeAreaInset = Readonly<{
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}>;

type TelegramBackButton = {
  show?: () => void;
  hide?: () => void;
  onClick?: (callback: () => void) => void;
  offClick?: (callback: () => void) => void;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      language_code?: string;
    };
  };
  viewportHeight?: number;
  viewportStableHeight?: number;
  safeAreaInset?: TelegramSafeAreaInset;
  contentSafeAreaInset?: TelegramSafeAreaInset;
  isVersionAtLeast?: (version: string) => boolean;
  ready?: () => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  onEvent?: (name: string, callback: () => void) => void;
  offEvent?: (name: string, callback: () => void) => void;
  BackButton?: TelegramBackButton;
};

type TelegramHost = {
  Telegram?: { WebApp?: TelegramWebApp };
  innerHeight: number;
  addEventListener?: (
    name: string,
    callback: () => void,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener?: (name: string, callback: () => void) => void;
};

type CssVariableTarget = {
  setProperty(name: string, value: string): void;
  removeProperty(name: string): string;
};

export type TelegramMiniAppBridge = Readonly<{
  readonly isTelegram: boolean;
  readonly languageCode: string | null;
  readonly initData: string | null;
  ready(): void;
  setGameInProgress(active: boolean): void;
  setBackHandler(handler: (() => void) | undefined): void;
  share(text: string, url: string): boolean;
  destroy(): void;
}>;

const SAFE_AREA_SIDES = ["top", "right", "bottom", "left"] as const;

export function setupTelegramMiniApp(
  host: TelegramHost = window as unknown as TelegramHost,
  cssVariables: CssVariableTarget = document.documentElement.style,
): TelegramMiniAppBridge {
  let webApp = host.Telegram?.WebApp;
  let destroyed = false;
  let readyRequested = false;
  let readyAppliedTo: TelegramWebApp | undefined;
  let gameInProgress = false;
  let closingConfirmationTarget: TelegramWebApp | undefined;
  let closingConfirmationState: boolean | undefined;
  let requestedBackHandler: (() => void) | undefined;
  let boundBackButton: TelegramBackButton | undefined;
  let boundBackHandler: (() => void) | undefined;

  const updateViewport = () => {
    if (destroyed) return;
    const current = positiveNumber(webApp?.viewportHeight) ?? positiveNumber(host.innerHeight);
    const stable = positiveNumber(webApp?.viewportStableHeight) ?? current;
    setPixelVariable(cssVariables, "--tg-viewport-height", current);
    setPixelVariable(cssVariables, "--tg-viewport-stable-height", stable);
  };

  const updateSafeArea = () => {
    if (destroyed) return;
    if (!supportsTelegramVersion(webApp, "8.0")) {
      clearSafeAreaVariables(cssVariables);
      return;
    }

    for (const side of SAFE_AREA_SIDES) {
      const value = nonNegativeNumber(webApp?.contentSafeAreaInset?.[side])
        ?? nonNegativeNumber(webApp?.safeAreaInset?.[side]);
      setPixelVariable(cssVariables, `--safe-${side}`, value);
    }
  };

  const unbindWebAppEvents = (target: TelegramWebApp | undefined) => {
    try { target?.offEvent?.("viewportChanged", updateViewport); } catch { /* Optional Telegram API. */ }
    try { target?.offEvent?.("safeAreaChanged", updateSafeArea); } catch { /* Optional Telegram API. */ }
    try { target?.offEvent?.("contentSafeAreaChanged", updateSafeArea); } catch { /* Optional Telegram API. */ }
  };

  const bindWebAppEvents = (target: TelegramWebApp | undefined) => {
    try { target?.onEvent?.("viewportChanged", updateViewport); } catch { /* Optional Telegram API. */ }
    if (!supportsTelegramVersion(target, "8.0")) return;
    try { target?.onEvent?.("safeAreaChanged", updateSafeArea); } catch { /* Optional Telegram API. */ }
    try { target?.onEvent?.("contentSafeAreaChanged", updateSafeArea); } catch { /* Optional Telegram API. */ }
  };

  const unbindBackButton = () => {
    if (boundBackButton && boundBackHandler) {
      try { boundBackButton.offClick?.(boundBackHandler); } catch { /* Optional Telegram API. */ }
    }
    if (boundBackButton) {
      try { boundBackButton.hide?.(); } catch { /* Optional Telegram API. */ }
    }
    boundBackButton = undefined;
    boundBackHandler = undefined;
  };

  const applyBackHandler = () => {
    const nextButton = webApp?.BackButton;
    if (boundBackButton === nextButton && boundBackHandler === requestedBackHandler) return;
    unbindBackButton();
    if (!nextButton || !requestedBackHandler) return;

    try {
      nextButton.onClick?.(requestedBackHandler);
      nextButton.show?.();
      boundBackButton = nextButton;
      boundBackHandler = requestedBackHandler;
    } catch {
      // BackButton is a progressive enhancement; in-game controls remain available.
    }
  };

  const applyClosingConfirmation = () => {
    if (!supportsTelegramVersion(webApp, "6.2")) return;
    if (closingConfirmationTarget === webApp && closingConfirmationState === gameInProgress) return;
    try {
      if (gameInProgress) webApp?.enableClosingConfirmation?.();
      else webApp?.disableClosingConfirmation?.();
      closingConfirmationTarget = webApp;
      closingConfirmationState = gameInProgress;
    } catch {
      // Closing confirmation must never prevent browser play.
    }
  };

  const applyReady = () => {
    if (!readyRequested || !webApp || readyAppliedTo === webApp) return;
    const target = webApp;
    callTelegramApi(() => target.ready?.());
    callTelegramApi(() => target.expand?.());
    if (supportsTelegramVersion(target, "7.7")) {
      callTelegramApi(() => target.disableVerticalSwipes?.());
    }
    if (supportsTelegramVersion(target, "6.9")) {
      callTelegramApi(() => target.setHeaderColor?.("#0d100c"));
      callTelegramApi(() => target.setBackgroundColor?.("#0d100c"));
    }
    if (supportsTelegramVersion(target, "7.10")) {
      callTelegramApi(() => target.setBottomBarColor?.("#0d100c"));
    }
    readyAppliedTo = target;
  };

  const refresh = () => {
    if (destroyed) return;
    const next = host.Telegram?.WebApp;
    if (next !== webApp) {
      unbindWebAppEvents(webApp);
      unbindBackButton();
      webApp = next;
      closingConfirmationTarget = undefined;
      closingConfirmationState = undefined;
      bindWebAppEvents(webApp);
    }
    applyReady();
    applyClosingConfirmation();
    applyBackHandler();
    updateViewport();
    updateSafeArea();
  };

  const ready = () => {
    readyRequested = true;
    refresh();
  };

  const setGameInProgress = (active: boolean) => {
    gameInProgress = active;
    applyClosingConfirmation();
  };

  const setBackHandler = (handler: (() => void) | undefined) => {
    requestedBackHandler = handler;
    applyBackHandler();
  };

  const share = (text: string, url: string): boolean => {
    if (destroyed || !webApp?.openTelegramLink) {
      return false;
    }

    try {
      webApp.openTelegramLink(createTelegramShareUrl(text, url));
      return true;
    } catch {
      return false;
    }
  };

  const destroy = () => {
    if (destroyed) return;
    if (supportsTelegramVersion(webApp, "6.2") && gameInProgress) {
      try { webApp?.disableClosingConfirmation?.(); } catch { /* Optional Telegram API. */ }
    }
    unbindWebAppEvents(webApp);
    unbindBackButton();
    host.removeEventListener?.("resize", updateViewport);
    host.removeEventListener?.("load", refresh);
    cssVariables.removeProperty("--tg-viewport-height");
    cssVariables.removeProperty("--tg-viewport-stable-height");
    clearSafeAreaVariables(cssVariables);
    destroyed = true;
  };

  host.addEventListener?.("resize", updateViewport, { passive: true });
  host.addEventListener?.("load", refresh, { once: true });
  bindWebAppEvents(webApp);
  updateViewport();
  updateSafeArea();

  return Object.freeze({
    get isTelegram() { return webApp !== undefined; },
    get languageCode() { return getTelegramLanguageCode(webApp); },
    get initData() { return webApp?.initData?.trim() || null; },
    ready,
    setGameInProgress,
    setBackHandler,
    share,
    destroy,
  });
}

export function createTelegramShareUrl(text: string, url: string): string {
  const parameters = new URLSearchParams();
  const safeUrl = sanitizeSharedPageUrl(url);
  if (safeUrl) {
    parameters.set("url", safeUrl);
  }
  parameters.set("text", text.trim().slice(0, 1024));
  return `https://t.me/share/url?${parameters.toString()}`;
}

export function getTelegramLanguageCode(
  webApp: Pick<TelegramWebApp, "initDataUnsafe"> | undefined,
): string | null {
  const languageCode = webApp?.initDataUnsafe?.user?.language_code;
  return typeof languageCode === "string" ? languageCode.trim().slice(0, 32) || null : null;
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

function setPixelVariable(target: CssVariableTarget, name: string, value: number | null): void {
  if (value === null) target.removeProperty(name);
  else target.setProperty(name, `${Math.round(value)}px`);
}

function clearSafeAreaVariables(target: CssVariableTarget): void {
  for (const side of SAFE_AREA_SIDES) {
    target.removeProperty(`--safe-${side}`);
  }
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function nonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function callTelegramApi(action: () => void): void {
  try {
    action();
  } catch {
    // Telegram APIs are optional; standalone browser play must remain available.
  }
}

export function sanitizeSharedPageUrl(value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "";
    }

    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    const sanitized = parsed.toString();
    if (sanitized.length <= 2048) {
      return sanitized;
    }

    // Keep an oversized URL valid instead of cutting through an encoded path.
    const originOnly = `${parsed.origin}/`;
    return originOnly.length <= 2048 ? originOnly : "";
  } catch {
    return "";
  }
}
