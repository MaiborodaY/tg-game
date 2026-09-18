import assert from 'node:assert/strict';

// Only Canvas calls used by these renderers are mocked; unknown calls fail instead
// of silently passing through a catch-all proxy. This verifies commands, not pixels.
const DRAW_METHODS = ['arc', 'arcTo', 'beginPath', 'clearRect', 'clip', 'closePath', 'ellipse',
  'fill', 'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'rotate', 'scale',
  'setLineDash', 'setTransform', 'stroke', 'strokeRect', 'strokeText', 'translate'];

function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    dispatch(type, event = {}) { for (const callback of listeners.get(type) ?? []) callback(event); },
    get listenerCount() { return [...listeners.values()].reduce((total, set) => total + set.size, 0); },
  };
}

export function createSceneEnvironment() {
  const originals = new Map(['window', 'document', 'Image', 'ResizeObserver'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const requests = [], pending = new Set(), observers = [], canvases = [], scenes = [];
  let imageMode = () => 'resolve';
  let canvasId = 0, restoring = false;
  const window = Object.assign(eventTarget(), { devicePixelRatio: 3 });
  function canvas(width = 390, height = 445, left = 0, top = 0) {
    const commands = [];
    let depth = 0, gradientId = 0;
    const record = (method, args) => {
      for (const value of args.flat()) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${method} received ${value}`);
      commands.push([method, ...args]);
    };
    const context = {};
    for (const method of DRAW_METHODS) context[method] = (...args) => record(method, args);
    Object.assign(context, {
      save() { depth += 1; record('save', []); },
      restore() { assert.ok(depth > 0, 'Canvas restore must balance save'); depth -= 1; record('restore', []); },
      drawImage(image, ...args) { assert.ok(image, 'drawImage requires a loaded image or layer'); record('drawImage', [image.src ?? image.label, ...args]); },
      measureText(text) { return { width: String(text).length * 7 }; },
      createLinearGradient(...args) {
        const label = `gradient:${gradientId++}`;
        record('createLinearGradient', [label, ...args]);
        return { label, addColorStop(...stop) { record('addColorStop', [label, ...stop]); } };
      },
    });
    const drawing = new Proxy(context, {
      set(target, property, value) { commands.push(['set', property, value?.label ?? value]); target[property] = value; return true; },
    });
    const surface = Object.assign(eventTarget(), {
      label: `canvas:${canvasId++}`, width: 0, height: 0, dataset: {}, commands,
      rect: { width, height, left, top },
      getContext(kind) { assert.equal(kind, '2d'); return drawing; },
      getBoundingClientRect() { return { ...this.rect, right: this.rect.left + this.rect.width, bottom: this.rect.top + this.rect.height }; },
      clear() { commands.length = 0; gradientId = 0; },
    });
    Object.defineProperty(surface, 'saveDepth', { get: () => depth });
    canvases.push(surface);
    return surface;
  }
  class Image {
    width = 768;
    height = 768;
    naturalWidth = 768;
    naturalHeight = 768;
    onload = null;
    onerror = null;
    set src(value) {
      this.url = value;
      if (!value) return;
      if (/\/(panther-rider|elf-archer|elf-healer)\//.test(value)) {
        this.width = this.height = this.naturalWidth = this.naturalHeight = /moon-glaive|elf-healer-pulse/.test(value) ? 128 : 512;
      }
      requests.push(value);
      const mode = imageMode(value);
      if (mode === 'hold') pending.add(this);
      else queueMicrotask(() => mode === 'reject' ? this.onerror?.() : this.onload?.());
    }
    get src() { return this.url; }
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  const document = {
    fonts: { ready: Promise.resolve() },
    createElement(tag) { assert.equal(tag, 'canvas'); return canvas(); },
  };
  for (const [key, value] of Object.entries({ window, document, Image, ResizeObserver })) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  return {
    canvas, canvases, window, requests, observers,
    setImageMode(mode) { imageMode = mode; },
    keep(scene) { if (restoring) scene.destroy(); else scenes.push(scene); return scene; },
    flush() { return new Promise(resolve => setImmediate(resolve)); },
    finishImages() { for (const image of pending) { pending.delete(image); image.onload?.(); } },
    async restore() {
      restoring = true;
      for (const scene of scenes) scene.destroy();
      this.finishImages();
      await this.flush();
      for (const [key, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}
