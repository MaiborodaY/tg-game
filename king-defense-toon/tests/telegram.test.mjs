import assert from 'node:assert/strict';
import test from 'node:test';
import { setupTelegramAdapter } from '../telegram.ts';

function fixture({ version = '8.0', sdk = true, hidden = false, appFields = {}, failures = [] } = {}) {
  const trace = [], styles = new Map(), classes = new Set(), rejected = new Set(failures);
  const target = label => {
    const handlers = new Map();
    return {
      handlers,
      addEventListener(event, handler, options) {
        trace.push([label, 'on', event, options]);
        const list = handlers.get(event) ?? new Set();
        list.add(handler); handlers.set(event, list);
      },
      removeEventListener(event, handler) {
        trace.push([label, 'off', event]);
        handlers.get(event)?.delete(handler);
      },
      emit(event) { for (const handler of [...(handlers.get(event) ?? [])]) handler(); },
      size() { return [...handlers.values()].reduce((sum, handlers) => sum + handlers.size, 0); },
    };
  };
  const root = {
    dataset: {},
    classList: { toggle(name, force) { trace.push(['class', name, force]); if (force) classes.add(name); else classes.delete(name); return force; } },
    style: {
      setProperty(name, value) { trace.push(['style', name, value]); styles.set(name, value); },
      removeProperty(name) { trace.push(['style-remove', name]); const old = styles.get(name) ?? ''; styles.delete(name); return old; },
    },
  };
  const host = { ...target('host'), innerHeight: 720, document: { ...target('document'), hidden, documentElement: root } };
  const telegramEvents = target('telegram');
  const app = {
    initData: 'signed-payload', platform: 'android', viewportHeight: 640, viewportStableHeight: 680,
    isVersionAtLeast(requested) {
      assert.equal(this, app, 'the SDK version method retains its receiver');
      if (rejected.has('isVersionAtLeast')) throw 'unsupported-client';
      const current = version.split('.').map(Number), minimum = requested.split('.').map(Number);
      return current[0] > minimum[0] || current[0] === minimum[0] && current[1] >= minimum[1];
    },
  };
  for (const method of ['ready', 'expand', 'disableVerticalSwipes', 'enableVerticalSwipes', 'setBackgroundColor',
    'setHeaderColor', 'setBottomBarColor', 'enableClosingConfirmation', 'disableClosingConfirmation', 'onEvent', 'offEvent']) {
    app[method] = function (...args) {
      assert.equal(this, app, `${method} retains its SDK receiver`);
      trace.push(['sdk', method, ...args.filter(arg => typeof arg !== 'function')]);
      if (rejected.has(method)) throw method === 'setHeaderColor' ? new Error('client failure') : 'client failure';
      if (method === 'onEvent') telegramEvents.addEventListener(...args);
      if (method === 'offEvent') telegramEvents.removeEventListener(...args);
    };
  }
  Object.assign(app, appFields);
  if (sdk) host.Telegram = { WebApp: app };
  const transitions = [];
  const options = { host, onActivate: () => transitions.push(true), onDeactivate: () => transitions.push(false) };
  return { host, root, app, styles, classes, trace, transitions, options, telegramEvents,
    calls: method => trace.filter(entry => entry[0] === 'sdk' && entry[1] === method),
    visibility(value) { host.document.hidden = value; host.document.emit('visibilitychange'); },
  };
}

test('ordinary browsers bind local activity without calling the SDK', () => {
  for (const config of [{ sdk: false }, { appFields: { initData: '', platform: 'unknown' } }]) {
    const f = fixture(config), adapter = setupTelegramAdapter(f.options);
    assert.equal(adapter.isTelegram, false);
    assert.equal(adapter.isActive, true);
    assert.deepEqual(f.root.dataset, { telegram: 'false', telegramActive: 'true' });
    assert.equal(f.classes.has('is-telegram'), false);
    assert.equal(f.trace.some(entry => entry[0] === 'sdk'), false);
    assert.equal(f.styles.size, 0);
    f.visibility(true); f.visibility(true); f.visibility(false);
    assert.deepEqual(f.transitions, [false, true]);
    adapter.destroy();
    assert.equal(f.host.size() + f.host.document.size(), 0);
  }
});

test('Telegram UI detection preserves the existing init-data and platform guards', () => {
  const cases = [
    [{ initData: '', platform: '' }, false], [{ initData: '   ', platform: 'unknown' }, false],
    [{ initData: 1, platform: 7 }, false], [{ initData: null, platform: 'ios' }, true],
    [{ initData: 'signed', platform: 'unknown' }, true], [{ initData: '', platform: ' unknown ' }, true],
    [{ initData: undefined, platform: '  ' }, false], [{ initData: {}, platform: undefined }, false],
  ];
  for (const [appFields, expected] of cases) {
    const f = fixture({ appFields }), adapter = setupTelegramAdapter(f.options);
    assert.equal(adapter.isTelegram, expected, JSON.stringify(appFields));
    adapter.destroy();
  }
});

test('optional SDK methods and event subscriptions follow their exact version gates', () => {
  for (const version of ['6.0', '6.1', '6.2', '6.9', '7.6', '7.7', '7.9', '7.10', '8.0']) {
    const f = fixture({ version }), adapter = setupTelegramAdapter({ ...f.options, disableVerticalSwipes: true });
    for (const [method, minimum] of [['setBackgroundColor', '6.1'], ['setHeaderColor', '6.9'],
      ['setBottomBarColor', '7.10'], ['disableClosingConfirmation', '6.2'], ['disableVerticalSwipes', '7.7']]) {
      assert.equal(f.calls(method).length, Number(f.app.isVersionAtLeast(minimum)), `${version}: ${method}`);
    }
    assert.equal(f.calls('ready').length, 1);
    assert.equal(f.calls('expand').length, 1);
    assert.equal(f.telegramEvents.size(), f.app.isVersionAtLeast('8.0') ? 6 : 2);
    adapter.destroy();
    assert.equal(f.telegramEvents.size(), 0);
    assert.equal(f.calls('enableVerticalSwipes').length, Number(f.app.isVersionAtLeast('7.7')));
  }
});

test('viewport validation preserves previous styles when all height sources are invalid', () => {
  const f = fixture(), adapter = setupTelegramAdapter(f.options);
  assert.equal(f.styles.get('--tg-viewport-height'), '640px');
  assert.equal(f.styles.get('--tg-viewport-stable-height'), '680px');
  for (const invalid of [0, -1, NaN, Infinity, '800', null, undefined]) {
    f.app.viewportHeight = invalid; f.app.viewportStableHeight = invalid;
    f.telegramEvents.emit('viewportChanged');
    assert.equal(f.styles.get('--tg-viewport-height'), '720px');
    assert.equal(f.styles.get('--tg-viewport-stable-height'), '720px');
    f.host.innerHeight = invalid;
    f.host.emit('resize');
    assert.equal(f.styles.get('--tg-viewport-height'), '720px');
    f.host.innerHeight = 720;
  }
  adapter.destroy();
});

test('safe-area zero is valid and missing or malformed edges restore CSS fallbacks', () => {
  const f = fixture({ appFields: { safeAreaInset: { top: 0, right: 9, bottom: 20, left: 4 },
    contentSafeAreaInset: { top: 15, right: 2, bottom: 0, left: 1 } } });
  const adapter = setupTelegramAdapter(f.options);
  assert.equal(f.styles.get('--tg-safe-area-inset-top'), '0px');
  assert.equal(f.styles.get('--tg-content-safe-area-inset-bottom'), '0px');
  f.app.safeAreaInset = { top: -1, right: '9', bottom: NaN, left: Infinity };
  f.app.contentSafeAreaInset = null;
  f.telegramEvents.emit('safeAreaChanged');
  for (const field of ['safe-area-inset', 'content-safe-area-inset']) {
    for (const edge of ['top', 'right', 'bottom', 'left']) assert.equal(f.styles.has(`--tg-${field}-${edge}`), false);
  }
  adapter.destroy();
});

test('activity combines visibility, Telegram activation and suspension without duplicate transitions', () => {
  const f = fixture({ appFields: { isActive: false } }), adapter = setupTelegramAdapter(f.options);
  assert.equal(adapter.isActive, false);
  assert.deepEqual(f.transitions, []);
  f.telegramEvents.emit('activated'); f.telegramEvents.emit('activated');
  f.visibility(true); f.telegramEvents.emit('deactivated'); f.visibility(false);
  assert.deepEqual(f.transitions, [true, false]);
  assert.equal(adapter.isActive, false);
  f.telegramEvents.emit('activated');
  adapter.suspend(); adapter.suspend();
  assert.equal(f.host.size() + f.host.document.size() + f.telegramEvents.size(), 0);
  f.app.isActive = true;
  adapter.resume(); adapter.resume();
  assert.deepEqual(f.transitions, [true, false, true, false, true]);
  assert.equal(f.host.size(), 1);
  assert.equal(f.host.document.size(), 1);
  assert.equal(f.telegramEvents.size(), 6);
  adapter.destroy();
  assert.equal(f.root.dataset.telegramActive, 'false');
});

test('legacy clients ignore isActive and use document visibility', () => {
  const f = fixture({ version: '7.10', hidden: true, appFields: { isActive: false } });
  const adapter = setupTelegramAdapter(f.options);
  assert.equal(adapter.isActive, false);
  f.visibility(false);
  assert.equal(adapter.isActive, true);
  adapter.destroy();
});

test('closing confirmation deduplicates transitions and preserves JavaScript truthiness', () => {
  const f = fixture(), adapter = setupTelegramAdapter(f.options);
  assert.equal(f.calls('disableClosingConfirmation').length, 1);
  for (const value of [true, 1, 'yes', {}]) adapter.setGameInProgress(value);
  assert.equal(f.calls('enableClosingConfirmation').length, 1);
  adapter.suspend(); adapter.setGameInProgress(true); adapter.resume();
  assert.equal(f.calls('disableClosingConfirmation').length, 2);
  assert.equal(f.calls('enableClosingConfirmation').length, 2);
  for (const value of [false, 0, '', null, undefined]) adapter.setGameInProgress(value);
  assert.equal(f.calls('disableClosingConfirmation').length, 3);
  adapter.destroy();
  assert.equal(f.calls('disableClosingConfirmation').length, 3);
});

test('destroy is idempotent, restores opted-in swipes and silences future public calls', () => {
  const f = fixture(), adapter = setupTelegramAdapter({ ...f.options, disableVerticalSwipes: true });
  assert.equal(Object.isFrozen(adapter), true);
  assert.throws(() => { adapter.ready = () => {}; }, TypeError);
  adapter.setGameInProgress(true); adapter.destroy();
  const after = structuredClone(f.trace);
  adapter.destroy(); adapter.ready(); adapter.suspend(); adapter.resume(); adapter.setGameInProgress(true);
  f.host.emit('resize'); f.visibility(false); f.telegramEvents.emit('activated');
  assert.deepEqual(f.trace, after);
  assert.equal(adapter.isActive, false);
  assert.equal(f.calls('enableVerticalSwipes').length, 1);
  assert.equal(f.host.size() + f.host.document.size() + f.telegramEvents.size(), 0);
});

test('SDK method exceptions including primitives do not interrupt local play', () => {
  const f = fixture({ failures: ['ready', 'expand', 'setBackgroundColor', 'setHeaderColor', 'setBottomBarColor',
    'disableVerticalSwipes', 'enableVerticalSwipes', 'enableClosingConfirmation', 'disableClosingConfirmation'] });
  const adapter = setupTelegramAdapter({ ...f.options, disableVerticalSwipes: true });
  adapter.setGameInProgress(true); adapter.suspend(); adapter.resume(); adapter.destroy();
  assert.equal(adapter.isActive, false);
  assert.equal(f.host.size() + f.host.document.size() + f.telegramEvents.size(), 0);
  const brokenVersion = fixture({ failures: ['isVersionAtLeast'] });
  const legacy = setupTelegramAdapter(brokenVersion.options);
  assert.equal(brokenVersion.telegramEvents.size(), 2);
  assert.equal(brokenVersion.calls('setBackgroundColor').length, 0);
  legacy.destroy();
});

test('partial clients and explicitly selected roots remain supported', () => {
  const f = fixture({ appFields: { isVersionAtLeast: undefined, onEvent: undefined, offEvent: undefined,
    ready: undefined, expand: undefined } }), alternate = fixture().root;
  const adapter = setupTelegramAdapter({ ...f.options, root: alternate });
  assert.equal(adapter.isTelegram, true);
  assert.equal(alternate.dataset.telegram, 'true');
  assert.deepEqual(f.root.dataset, {});
  assert.equal(f.styles.size, 0);
  adapter.destroy();
});

test('the default host reads window only when setup is called', () => {
  const f = fixture({ sdk: false });
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: f.host });
  try {
    const adapter = setupTelegramAdapter();
    assert.equal(adapter.isTelegram, false);
    assert.equal(f.root.dataset.telegramActive, 'true');
    adapter.destroy();
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
  }
});
