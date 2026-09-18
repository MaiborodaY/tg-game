import type { DragPoint } from './unit-drag-gesture.ts';

export interface DragSourceEvent { clientX: number; clientY: number; target: EventTarget | null }
export interface UnitDragOptions<Source> {
  getSource: (event: DragSourceEvent) => Source | null | undefined;
  onStart: (source: Source, point: DragPoint) => boolean;
  onMove: (point: DragPoint) => void;
  onDrop: (source: Source, point: DragPoint) => void;
  onCancel: () => void;
}
export interface UnitDragController {
  cancel: () => void;
  destroy: () => void;
  readonly tracking: boolean;
  readonly pending: boolean;
  readonly active: boolean;
}

type DragEventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap & VisualViewportEventMap;

import { createUnitDragGesture } from './unit-drag-gesture.ts';

export function setupUnitDrag<Source>({ getSource, onStart, onMove, onDrop, onCancel }: UnitDragOptions<Source>): UnitDragController {
  const listeners: (() => void)[] = [];
  const downIds = new Set<string>();
  let blocked = false;
  let captureId: number | null = null, mouseId: number | null = null;
  const capture = document.documentElement;
  const gesture = createUnitDragGesture<Source>({
    onStart(source, point) {
      // Capture mouse/pen on a stable node before the source dialog is hidden.
      if (mouseId !== null) {
        try { capture.setPointerCapture(mouseId); captureId = mouseId; } catch { /* Window listeners still track the pointer. */ }
      }
      const accepted = onStart(source, point);
      if (!accepted) releaseCapture();
      return accepted;
    },
    onMove,
    onDrop(source, point) { releaseCapture(); onDrop(source, point); },
    onCancel() { releaseCapture(); onCancel(); },
  });
  function listen<Key extends keyof DragEventMap>(target: EventTarget, type: Key,
    handler: (event: DragEventMap[Key]) => void, options: AddEventListenerOptions = { capture: true }): void {
    // The private helper's literal event names determine the native handler type.
    const listener = handler as EventListener;
    target.addEventListener(type, listener, options);
    listeners.push(() => target.removeEventListener(type, listener, options));
  }
  function releaseCapture(): void {
    const id = captureId;
    captureId = null;
    if (id !== null && capture.hasPointerCapture(id)) capture.releasePointerCapture(id);
  }
  function cancel(): void { gesture.cancel(); releaseCapture(); }
  function reset(): void { blocked = false; downIds.clear(); mouseId = null; cancel(); }
  function down(id: string, point: DragPoint, event: DragSourceEvent): void {
    downIds.add(id);
    if (downIds.size > 1) { blocked = true; cancel(); return; }
    if (!blocked) gesture.down({ pointerId: id, ...point, source: getSource(event) });
  }
  function up(id: string, point: DragPoint): void {
    downIds.delete(id);
    if (!blocked) gesture.up({ pointerId: id, ...point });
    if (!downIds.size) blocked = false;
  }
  const pointOf = (event: Pick<MouseEvent, 'clientX' | 'clientY'>): DragPoint => ({ x: event.clientX, y: event.clientY });
  listen(window, 'pointerdown', event => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    mouseId = event.pointerId;
    down(`pointer:${event.pointerId}`, pointOf(event), event);
  });
  listen(window, 'pointermove', event => {
    if (event.pointerType === 'touch') return;
    if (gesture.active && event.buttons === 0) { cancel(); return; }
    gesture.move({ pointerId: `pointer:${event.pointerId}`, ...pointOf(event) });
  });
  listen(window, 'pointerup', event => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    up(`pointer:${event.pointerId}`, pointOf(event));
    mouseId = null;
  });
  listen(window, 'pointercancel', event => {
    if (event.pointerType !== 'touch') reset();
  });
  listen(capture, 'lostpointercapture', event => {
    if (event.pointerId === captureId) cancel();
  });

  // Native scrolling is allowed until pickup. Touch Events let us cancel the
  // first post-hold pan; changing touch-action midway through a gesture cannot.
  listen(document, 'touchstart', event => {
    for (const touch of event.changedTouches) {
      down(`touch:${touch.identifier}`, pointOf(touch), { ...pointOf(touch),
        clientX: touch.clientX, clientY: touch.clientY, target: touch.target });
    }
  }, { capture: true, passive: true });
  listen(document, 'touchmove', event => {
    if (gesture.active) {
      if (!event.cancelable) { cancel(); return; }
      event.preventDefault();
    }
    for (const touch of event.changedTouches) {
      gesture.move({ pointerId: `touch:${touch.identifier}`, ...pointOf(touch) });
    }
  }, { capture: true, passive: false });
  listen(document, 'touchend', event => {
    const suppress = gesture.suppressClick;
    for (const touch of event.changedTouches) up(`touch:${touch.identifier}`, pointOf(touch));
    if ((suppress || gesture.suppressClick) && event.cancelable) event.preventDefault();
  }, { capture: true, passive: false });
  listen(document, 'touchcancel', reset);
  listen(document, 'click', event => {
    // The release click may target the newly uncovered canvas or a refreshed icon.
    // Keyboard activation has detail=0 and keeps the existing accessible controls.
    if (event.detail !== 0 && gesture.consumeClick()) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  });
  listen(document, 'contextmenu', event => {
    if (gesture.active || gesture.pending || getSource(event)) event.preventDefault();
  });
  listen(document, 'dragstart', event => {
    if (gesture.active || gesture.pending || getSource(event)) event.preventDefault();
  });
  listen(document, 'keydown', event => {
    if (event.key === 'Escape' && (gesture.active || gesture.pending)) {
      event.preventDefault(); event.stopImmediatePropagation(); cancel();
    }
  });
  // Moving focus between game controls is not the app losing focus.
  listen(window, 'blur', reset, { capture: false });
  listen(window, 'pagehide', reset);
  listen(window, 'resize', cancel);
  listen(window.visualViewport ?? window, 'resize', cancel);
  listen(document, 'scroll', cancel);
  listen(document, 'visibilitychange', () => { if (document.hidden) reset(); });
  return {
    cancel,
    get tracking() { return downIds.size > 0; },
    get pending() { return gesture.pending; },
    get active() { return gesture.active; },
    destroy() { reset(); gesture.destroy(); listeners.forEach(remove => remove()); },
  };
}
