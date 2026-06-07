interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setBackgroundColor?: (color: string) => void;
  setHeaderColor?: (color: string) => void;
}

interface TelegramWindow {
  WebApp?: TelegramWebApp;
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
