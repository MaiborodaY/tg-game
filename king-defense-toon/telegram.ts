export type TelegramEvent = 'viewportChanged' | 'themeChanged' | 'safeAreaChanged'
  | 'contentSafeAreaChanged' | 'activated' | 'deactivated';
export type TelegramEdge = 'top' | 'right' | 'bottom' | 'left';

interface TelegramMethodArguments {
  ready: [];
  expand: [];
  disableVerticalSwipes: [];
  enableVerticalSwipes: [];
  setBackgroundColor: [color: string];
  setHeaderColor: [color: string];
  setBottomBarColor: [color: string];
  enableClosingConfirmation: [];
  disableClosingConfirmation: [];
  onEvent: [event: TelegramEvent, handler: () => void];
  offEvent: [event: TelegramEvent, handler: () => void];
}
type TelegramMethods = {
  [Method in keyof TelegramMethodArguments]?: (...args: TelegramMethodArguments[Method]) => unknown;
};

// Only the SDK surface this adapter consumes; untrusted client values retain their runtime guards.
export interface TelegramWebApp extends TelegramMethods {
  initData?: unknown;
  platform?: unknown;
  isActive?: unknown;
  viewportHeight?: unknown;
  viewportStableHeight?: unknown;
  safeAreaInset?: Partial<Record<TelegramEdge, unknown>> | null;
  contentSafeAreaInset?: Partial<Record<TelegramEdge, unknown>> | null;
  isVersionAtLeast?: (version: string) => boolean;
}

export interface TelegramRoot {
  dataset: { telegram?: string; telegramActive?: string };
  classList: Pick<DOMTokenList, 'toggle'>;
  style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>;
}
export interface TelegramDocument {
  hidden: boolean;
  documentElement: TelegramRoot;
  addEventListener(type: 'visibilitychange', handler: () => void): void;
  removeEventListener(type: 'visibilitychange', handler: () => void): void;
}
export interface TelegramHost {
  document: TelegramDocument;
  innerHeight?: unknown;
  Telegram?: { WebApp?: TelegramWebApp | null } | null;
  addEventListener(type: 'resize', handler: () => void, options?: { passive: boolean }): void;
  removeEventListener(type: 'resize', handler: () => void): void;
}
export interface TelegramAdapterOptions {
  host?: TelegramHost;
  root?: TelegramRoot;
  onDeactivate?: () => void;
  onActivate?: () => void;
  disableVerticalSwipes?: boolean;
}
export interface TelegramAdapter {
  readonly isTelegram: boolean;
  readonly isActive: boolean;
  readonly ready: () => void;
  readonly setGameInProgress: (value: boolean) => void;
  readonly suspend: () => void;
  readonly resume: () => void;
  readonly destroy: () => void;
}

const APP_COLOR = '#eee2bf';
const EDGES = ['top', 'right', 'bottom', 'left'] as const;

export function setupTelegramAdapter({
  host = window,
  root = host.document.documentElement,
  onDeactivate = () => {},
  onActivate = () => {},
  disableVerticalSwipes = false,
}: TelegramAdapterOptions = {}): TelegramAdapter {
  const app = host.Telegram?.WebApp;
  // The official SDK also creates WebApp in ordinary browsers. This is UI detection, not authentication.
  const isTelegram = !!app && (typeof app.initData === 'string' && app.initData.trim().length > 0
    || typeof app.platform === 'string' && !!app.platform.trim() && app.platform !== 'unknown');
  let destroyed = false, suspended = false, listening = false, gameInProgress = false;
  let telegramActive = !isTelegram || !supports('8.0') || app.isActive !== false;
  let active = !host.document.hidden && telegramActive;
  let closingConfirmation: boolean | null = null;

  function supports(version: string) {
    try { return isTelegram && app.isVersionAtLeast?.(version) === true; }
    catch { return false; }
  }

  function call<Method extends keyof TelegramMethodArguments>(method: Method, ...args: TelegramMethodArguments[Method]) {
    if (!isTelegram) return;
    // Preserve method receivers while keeping each method's argument tuple correlated.
    try { (app as TelegramMethods)[method]?.(...args); }
    catch { /* Optional client APIs must not interrupt local play. */ }
  }

  function updateActive() {
    const next = !destroyed && !suspended && !host.document.hidden && telegramActive;
    root.dataset.telegramActive = String(next);
    if (active === next) return;
    active = next;
    if (active) onActivate(); else onDeactivate();
  }

  function updateViewport() {
    if (!isTelegram) return;
    const current = positiveNumber(app.viewportHeight) ?? positiveNumber(host.innerHeight);
    const stable = positiveNumber(app.viewportStableHeight) ?? current;
    if (current) root.style.setProperty('--tg-viewport-height', `${current}px`);
    if (stable) root.style.setProperty('--tg-viewport-stable-height', `${stable}px`);
  }

  function updateInsets() {
    if (!supports('8.0')) return;
    for (const [field, prefix] of [['safeAreaInset', '--tg-safe-area-inset'], ['contentSafeAreaInset', '--tg-content-safe-area-inset']] as const) {
      for (const edge of EDGES) {
        // supports('8.0') is true only for a detected, present Telegram WebApp.
        const value = app![field]?.[edge];
        // Missing system insets retain CSS env() fallbacks on older or partial clients.
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
          root.style.setProperty(`${prefix}-${edge}`, `${value}px`);
        } else root.style.removeProperty(`${prefix}-${edge}`);
      }
    }
  }

  function applyTheme() {
    if (supports('6.1')) call('setBackgroundColor', APP_COLOR);
    if (supports('6.9')) call('setHeaderColor', APP_COLOR);
    if (supports('7.10')) call('setBottomBarColor', APP_COLOR);
  }

  function applyClosingConfirmation(enabled = gameInProgress && !suspended && !destroyed) {
    if (!supports('6.2') || closingConfirmation === enabled) return;
    call(enabled ? 'enableClosingConfirmation' : 'disableClosingConfirmation');
    closingConfirmation = enabled;
  }

  const events: [event: TelegramEvent, handler: () => void, version?: string][] = [
    ['viewportChanged', updateViewport],
    ['themeChanged', applyTheme],
    ['safeAreaChanged', updateInsets, '8.0'],
    ['contentSafeAreaChanged', updateInsets, '8.0'],
    ['activated', () => { telegramActive = true; updateActive(); }, '8.0'],
    ['deactivated', () => { telegramActive = false; updateActive(); }, '8.0'],
  ];

  function bind() {
    if (listening) return;
    listening = true;
    host.addEventListener('resize', updateViewport, { passive: true });
    host.document.addEventListener('visibilitychange', updateActive);
    for (const [event, handler, version] of events) {
      if (!version || supports(version)) call('onEvent', event, handler);
    }
  }

  function unbind() {
    if (!listening) return;
    listening = false;
    host.removeEventListener('resize', updateViewport);
    host.document.removeEventListener('visibilitychange', updateActive);
    for (const [event, handler, version] of events) {
      if (!version || supports(version)) call('offEvent', event, handler);
    }
  }

  function ready() {
    if (destroyed || suspended) return;
    call('ready');
    call('expand');
    if (disableVerticalSwipes && supports('7.7')) call('disableVerticalSwipes');
    applyTheme();
    updateViewport();
    updateInsets();
    applyClosingConfirmation();
  }

  root.classList.toggle('is-telegram', isTelegram);
  root.dataset.telegram = String(isTelegram);
  root.dataset.telegramActive = String(active);
  bind();
  ready();

  return Object.freeze({
    isTelegram,
    get isActive() { return active; },
    ready,
    setGameInProgress(value: boolean) {
      if (destroyed) return;
      gameInProgress = !!value;
      applyClosingConfirmation();
    },
    suspend() {
      if (destroyed || suspended) return;
      suspended = true;
      unbind();
      updateActive();
      applyClosingConfirmation();
    },
    resume() {
      if (destroyed || !suspended) return;
      suspended = false;
      telegramActive = !isTelegram || !supports('8.0') || app.isActive !== false;
      bind();
      ready();
      updateActive();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unbind();
      updateActive();
      applyClosingConfirmation(false);
      if (disableVerticalSwipes && supports('7.7')) call('enableVerticalSwipes');
    },
  });
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}
