export interface FieldHitPoint {
  x: number;
  y: number;
}

export interface FieldHitRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface SlotHitTargetGeometry {
  rect: FieldHitRect;
  hitRect: FieldHitRect;
  anchor: FieldHitPoint;
}

export interface IndexedSlotHitTargetGeometry extends SlotHitTargetGeometry {
  slotIndex: number;
}

export interface FieldSlotClickActivation {
  clientX: number;
  clientY: number;
  detail: number;
}

export function findNearestSlotHitTarget<T extends SlotHitTargetGeometry>(
  point: FieldHitPoint,
  targets: readonly T[],
): T | undefined {
  const exactTargets = targets.filter((target) => containsPoint(target.rect, point));
  const candidates = exactTargets.length > 0
    ? exactTargets
    : targets.filter((target) => containsPoint(target.hitRect, point));

  return candidates.reduce<T | undefined>((nearest, candidate) => {
    if (!nearest) {
      return candidate;
    }

    return squaredDistance(candidate.anchor, point) < squaredDistance(nearest.anchor, point)
      ? candidate
      : nearest;
  }, undefined);
}

export function resolveFieldSlotIndexForClick<T extends IndexedSlotHitTargetGeometry>(
  activation: FieldSlotClickActivation,
  suppliedSlotIndex: number,
  targets: readonly T[],
): number {
  if (activation.detail === 0 && activation.clientX === 0 && activation.clientY === 0) {
    return suppliedSlotIndex;
  }

  return findNearestSlotHitTarget(
    { x: activation.clientX, y: activation.clientY },
    targets,
  )?.slotIndex ?? suppliedSlotIndex;
}

function containsPoint(rect: FieldHitRect, point: FieldHitPoint): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function squaredDistance(left: FieldHitPoint, right: FieldHitPoint): number {
  const deltaX = left.x - right.x;
  const deltaY = left.y - right.y;
  return deltaX * deltaX + deltaY * deltaY;
}
