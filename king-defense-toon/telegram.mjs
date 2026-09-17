const APP_COLOR = '#eee2bf';
const EDGES = ['top', 'right', 'bottom', 'left'];

export function setupTelegramAdapter({
  host = window,
  root = host.document.documentElement,
  onDeactivate = () => {},
  onActivate = () => {},
  disableVerticalSwipes = false,
} = {}) {
  const app = host.Telegram?.WebApp;
  // The official SDK also creates WebApp in ordinary browsers. This is UI detection, not authentication.
  const isTelegram = !!app && (typeof app.initData === 'string' && app.initData.trim().length > 0
    || typeof app.platform === 'string' && !!app.platform.trim() && app.platform !== 'unknown');
  let destroyed = false, suspended = false, listening = false, gameInProgress = false;
  let telegramActive = !isTelegram || !supports('8.0') || app.isActive !== false;
  let active = !host.document.hidden && telegramActive;
  let closingConfirmation = null;

  function supports(version) {
    try { return isTelegram && app.isVersionAtLeast?.(version) === true; }
    catch { return false; }
  }

  function call(method, ...args) {
    if (!isTelegram) return;
    try { app[method]?.(...args); }
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
    for (const [field, prefix] of [['safeAreaInset', '--tg-safe-area-inset'], ['contentSafeAreaInset', '--tg-content-safe-area-inset']]) {
      for (const edge of EDGES) {
        const value = app[field]?.[edge];
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

  const events = [
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
    setGameInProgress(value) {
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

function positiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}
