interface TelegramWebApp {
  initData?: string;
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setBackgroundColor?: (color: string) => void;
  setHeaderColor?: (color: string) => void;
}

interface TelegramWindow {
  WebApp?: TelegramWebApp;
}

interface TelegramInitUser {
  id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

declare global {
  interface Window {
    Telegram?: TelegramWindow;
  }
}

export function bootTelegramWebApp(): void {
  const webApp = window.Telegram?.WebApp;

  if (!webApp) {
    return;
  }

  webApp.ready();
  webApp.expand();
  webApp.disableVerticalSwipes?.();
  webApp.setBackgroundColor?.("#35180d");
  webApp.setHeaderColor?.("#35180d");
}

export function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData ?? "";
}

export function getTelegramDisplayName(): string | undefined {
  const user = getTelegramInitUser();

  if (!user) {
    return undefined;
  }

  const personalName = normalizeTelegramName([user.first_name, user.last_name].filter(Boolean).join(" "));

  if (personalName) {
    return personalName;
  }

  return normalizeTelegramName(user.username?.replace(/^@+/, ""));
}

export function getTelegramUserStorageKey(): string {
  const user = getTelegramInitUser();

  if (user?.id !== undefined && user.id !== null) {
    return `telegram-${String(user.id).trim()}`;
  }

  return "local";
}

function getTelegramInitUser(): TelegramInitUser | undefined {
  const initData = getTelegramInitData();

  if (!initData) {
    return undefined;
  }

  try {
    const userJson = new URLSearchParams(initData).get("user");

    if (!userJson) {
      return undefined;
    }

    return JSON.parse(userJson) as TelegramInitUser;
  } catch {
    return undefined;
  }
}

function normalizeTelegramName(name: string | undefined): string | undefined {
  const normalized = name?.trim().replace(/\s+/g, " ").slice(0, 24);

  return normalized || undefined;
}
