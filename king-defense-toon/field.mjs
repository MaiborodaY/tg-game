export const FIELD = Object.freeze({
  width: 390,
  height: 445,
  gridX: 50,
  gridY: 270,
  columns: 5,
  rows: 3,
  cellWidth: 58,
  cellHeight: 55,
  kingX: -28,
  kingFeet: 410,
  battlefieldBottom: 435,
});

// Equal framing around the mainland keeps its centre aligned with the Army columns.
export const BATTLE_VIEW = Object.freeze({ x: -56, y: 0, width: 502, height: 445 });
export const FORMATION_VIEW = Object.freeze({ x: 42, y: 260, width: 306, height: 184 });
// The hero enters from the mainland shore without occupying a purchasable army cell.
export const HERO_START = Object.freeze({ x: 40, y: 408 });
export const ROYAL_PENINSULA = Object.freeze({ left: -54, top: 300, right: -2, bottom: 442 });
export const ROYAL_NECK = Object.freeze({ left: -4, top: 392, right: 36, bottom: 424 });
// Foot positions stay inside the shore. The overlap at each end makes one continuous route.
export const WALKABLE_AREAS = Object.freeze([
  Object.freeze({ left: 32, top: 40, right: 358, bottom: 435 }),
  Object.freeze({ left: -44, top: 310, right: -12, bottom: 427 }),
  Object.freeze({ left: -16, top: 400, right: 36, bottom: 416 }),
]);
export const ROYAL_ROUTE = Object.freeze([
  Object.freeze({ x: 34, y: 408 }),
  Object.freeze({ x: -14, y: 408 }),
]);

export function positionForCell(col, row) {
  return {
    x: FIELD.gridX + col * FIELD.cellWidth + FIELD.cellWidth / 2,
    y: FIELD.gridY + (row + 1) * FIELD.cellHeight - 5,
  };
}
