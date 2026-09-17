const pointOf = ({ x, y }) => ({ x, y });
const distanceSquared = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/**
 * Long press arbitration only; rendering, pointer capture and merge validation
 * belong to the caller. Pending movement stays native so lists can scroll.
 */
export function createUnitDragGesture({
  holdMs = 450,
  slop = 10,
  schedule = setTimeout,
  unschedule = clearTimeout,
  onStart = () => true,
  onMove = () => {},
  onDrop = () => {},
  onCancel = () => {},
} = {}) {
  const pointers = new Set();
  const slopSquared = slop ** 2;
  let gesture = null;
  let suppressClick = false;
  let destroyed = false;

  function clearTimer(entry) {
    if (entry.timer !== null) unschedule(entry.timer);
    entry.timer = null;
  }

  function discard(entry) {
    if (gesture !== entry) return;
    gesture = null;
    clearTimer(entry);
    suppressClick = true;
    if (entry.phase !== 'pending') onCancel();
  }

  function down({ pointerId, x, y, source }) {
    if (destroyed || pointers.has(pointerId)) return false;
    pointers.add(pointerId);
    if (pointers.size > 1) {
      // Keep both pointers tracked: a second finger must not start a new drag.
      if (gesture) discard(gesture);
      suppressClick = true;
      return false;
    }
    suppressClick = false;
    // Global listeners still track unrelated touches for multi-touch arbitration.
    if (source == null) return false;
    const entry = {
      pointerId, source, origin: { x, y }, point: { x, y },
      pickup: null, moved: false, phase: 'pending', timer: null,
    };
    gesture = entry;
    entry.timer = schedule(() => {
      // A cleared timer may already be queued, so identity also guards it.
      if (destroyed || gesture !== entry || entry.phase !== 'pending') return;
      entry.timer = null;
      entry.pickup = pointOf(entry.point);
      entry.phase = 'starting';
      suppressClick = true;
      let accepted;
      try {
        accepted = onStart(entry.source, pointOf(entry.point)) !== false;
      } catch (error) {
        discard(entry);
        throw error;
      }
      if (gesture !== entry) return;
      if (accepted) entry.phase = 'active';
      else discard(entry);
    }, holdMs);
    return true;
  }

  function move({ pointerId, x, y }) {
    const entry = gesture;
    if (!entry || pointerId !== entry.pointerId) return false;
    entry.point = { x, y };
    if (entry.phase === 'pending') {
      if (distanceSquared(entry.origin, entry.point) > slopSquared) discard(entry);
      return false;
    }
    if (entry.phase !== 'active') return false;
    entry.moved ||= distanceSquared(entry.pickup, entry.point) > slopSquared;
    onMove(pointOf(entry.point));
    return true;
  }

  function up({ pointerId, x, y }) {
    pointers.delete(pointerId);
    const entry = gesture;
    if (!entry || pointerId !== entry.pointerId) return false;
    gesture = null;
    clearTimer(entry);
    if (entry.phase === 'pending') return false;

    suppressClick = true;
    // Clear state before callbacks: duplicate/reentrant releases cannot merge twice.
    const point = { x, y };
    const moved = entry.moved || distanceSquared(entry.pickup, point) > slopSquared;
    if (entry.phase === 'active' && moved) onDrop(entry.source, point);
    else onCancel();
    return true;
  }

  function cancel() {
    if (gesture || pointers.size) suppressClick = true;
    pointers.clear();
    if (gesture) discard(gesture);
  }

  return {
    down,
    move,
    up,
    cancel,
    destroy() {
      destroyed = true;
      cancel();
    },
    consumeClick() {
      const suppressed = suppressClick;
      suppressClick = false;
      return suppressed;
    },
    get active() { return gesture?.phase === 'active'; },
    get pending() { return gesture?.phase === 'pending' || gesture?.phase === 'starting'; },
    get suppressClick() { return suppressClick; },
  };
}
