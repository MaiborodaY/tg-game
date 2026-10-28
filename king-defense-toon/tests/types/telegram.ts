import { setupTelegramAdapter } from '../../telegram.ts';
import type { TelegramAdapter, TelegramAdapterOptions, TelegramHost, TelegramRoot, TelegramWebApp } from '../../telegram.ts';

export function verifyTelegramContracts(host: TelegramHost, root: TelegramRoot, app: TelegramWebApp): void {
  const browserHost: TelegramHost = window;
  const browserRoot: TelegramRoot = document.documentElement;
  const options: TelegramAdapterOptions = { host, root, disableVerticalSwipes: true, onActivate() {}, onDeactivate() {} };
  const adapter: TelegramAdapter = setupTelegramAdapter(options);
  const detected: boolean = adapter.isTelegram;
  const active: boolean = adapter.isActive;
  adapter.setGameInProgress(true); adapter.ready(); adapter.suspend(); adapter.resume(); adapter.destroy();
  app.setHeaderColor?.('#eee2bf');
  app.onEvent?.('activated', () => {});
  app.offEvent?.('deactivated', () => {});
  const partialClient: TelegramWebApp = { initData: null, viewportHeight: '640', safeAreaInset: { top: 'invalid', bottom: 0 } };

  // @ts-expect-error Activity is a readonly getter on the frozen adapter.
  adapter.isActive = false;
  // @ts-expect-error Detection is readonly on the frozen adapter.
  adapter.isTelegram = true;
  // @ts-expect-error Methods cannot be replaced on the frozen adapter.
  adapter.ready = () => {};
  // @ts-expect-error Typed callers use an explicit boolean for gameplay activity.
  adapter.setGameInProgress('yes');
  // @ts-expect-error Root projection must provide style and class operations.
  setupTelegramAdapter({ root: { dataset: {} } });
  // @ts-expect-error Host must expose document visibility and event lifecycles.
  setupTelegramAdapter({ host: { innerHeight: 800 } });
  // @ts-expect-error User callbacks receive no SDK-specific payload.
  setupTelegramAdapter({ onActivate: (event: { isActive: boolean }) => { void event; } });
  // @ts-expect-error Swipe policy is boolean.
  setupTelegramAdapter({ disableVerticalSwipes: 'yes' });
  // @ts-expect-error This adapter has no arbitrary SDK event subscription surface.
  app.onEvent?.('buttonClicked', () => {});
  // @ts-expect-error Event handlers are callbacks, not strings.
  app.offEvent?.('activated', 'handler');
  // @ts-expect-error Client theme methods consume color strings.
  app.setHeaderColor?.(42);
  // @ts-expect-error Ready has no data argument.
  app.ready?.('payload');
  // @ts-expect-error The SDK callback name and arity cannot be changed.
  const invalid: TelegramWebApp = { onEvent: (_event: number) => {} };
  // @ts-expect-error Only the four actual inset edges are accepted.
  const invalidInsets: TelegramWebApp = { safeAreaInset: { center: 4 } };
  void [browserHost, browserRoot, detected, active, partialClient, invalid, invalidInsets];
}
