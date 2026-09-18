import { createUnitDragGesture } from '../../unit-drag-gesture.ts';
import type { DragPoint, UnitDragGesture } from '../../unit-drag-gesture.ts';
import { setupUnitDrag } from '../../unit-drag.ts';
import type { DragSourceEvent, UnitDragController } from '../../unit-drag.ts';

interface Source { location: 'army' | 'reserve'; id: number }

export function dragContracts(): void {
  const source: Source = { location: 'reserve', id: 42 };
  const gesture = createUnitDragGesture<Source>({
    onStart(unit, point) { const id: number = unit.id; const x: number = point.x; void [id, x]; },
    onDrop(unit, point) { const location: Source['location'] = unit.location; void [location, point]; },
    schedule(callback, delay) { return window.setTimeout(callback, delay); },
    unschedule(timer) { window.clearTimeout(timer); },
  });
  const point: DragPoint = { x: 10, y: 20 };
  const started: boolean = gesture.down({ pointerId: 'touch:1', ...point, source });
  gesture.down({ pointerId: 2, ...point, source: null });
  gesture.down({ pointerId: 3, ...point });
  gesture.move({ pointerId: 1, ...point });
  gesture.up({ pointerId: 1, ...point });
  const suppressed: boolean = gesture.consumeClick();
  gesture.destroy();

  const controller: UnitDragController = setupUnitDrag({
    getSource(event) { const native: DragSourceEvent = event; void native; return source; },
    onStart(unit, at) { const id: number = unit.id; void [id, at]; return true; },
    onMove(at) { const y: number = at.y; void y; },
    onDrop(unit) { const id: number = unit.id; void id; },
    onCancel() {},
  });
  const tracking: boolean = controller.tracking;
  controller.cancel();
  controller.destroy();

  // @ts-expect-error A second reference cannot accept sources incompatible with this gesture.
  const widened: UnitDragGesture<unknown> = gesture;
  // @ts-expect-error Source identity retains its caller-selected shape.
  gesture.down({ pointerId: 1, ...point, source: { id: '42', location: 'army' } });
  // @ts-expect-error Pointer IDs are native numbers or the adapter's namespaced strings.
  gesture.up({ pointerId: {}, ...point });
  // @ts-expect-error Coordinates must be numeric client positions.
  gesture.move({ pointerId: 1, x: '10', y: 20 });
  // @ts-expect-error Gesture phase is owned by its lifecycle.
  gesture.active = true;
  // @ts-expect-error DOM timers return numeric handles.
  createUnitDragGesture({ schedule: () => 'timer' });
  // @ts-expect-error The scheduler invokes a parameterless callback.
  createUnitDragGesture({ onCancel: (source: Source) => source.id });
  createUnitDragGesture({ onStart(value) {
    // @ts-expect-error The default source is unknown until the caller chooses its shape.
    return value.id > 0;
  } });
  // @ts-expect-error Touch-origin source lookup does not guarantee full PointerEvent fields.
  setupUnitDrag<Source>({ getSource: (event: PointerEvent) => event.pointerId ? source : null,
    onStart: () => true, onMove() {}, onDrop() {}, onCancel() {} });
  // @ts-expect-error Pickup acceptance is synchronous; native event handling cannot await it.
  setupUnitDrag<Source>({ getSource: () => source, onStart: async () => true,
    onMove() {}, onDrop() {}, onCancel() {} });
  // @ts-expect-error Listener ownership and pointer tracking cannot be changed by a caller.
  controller.tracking = false;
  void [started, suppressed, tracking, widened];
}
