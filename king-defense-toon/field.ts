export interface Point {
  x: number;
  y: number;
}

export interface Viewport extends Point {
  width: number;
  height: number;
}

export interface LandBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface FieldGeometry {
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  kingX: number;
  kingFeet: number;
  battlefieldBottom: number;
}

export const FIELD: Readonly<FieldGeometry> = Object.freeze({
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
export const BATTLE_VIEW: Readonly<Viewport> = Object.freeze({ x: -56, y: 0, width: 502, height: 445 });
export const FORMATION_VIEW: Readonly<Viewport> = Object.freeze({ x: 42, y: 260, width: 306, height: 184 });
// The hero enters from the mainland shore without occupying a purchasable army cell.
export const HERO_START: Readonly<Point> = Object.freeze({ x: 40, y: 408 });
// The tower sits on the existing castle; the defended objective keeps its route anchor.
export const CAPITOL_TOWER_POSITION: Readonly<Point> = Object.freeze({ x: FIELD.kingX + 14, y: 332 });
export const ROYAL_PENINSULA: Readonly<LandBounds> = Object.freeze({ left: -54, top: 300, right: -2, bottom: 442 });
export const ROYAL_NECK: Readonly<LandBounds> = Object.freeze({ left: -4, top: 392, right: 36, bottom: 424 });
// Foot positions stay inside the shore. The overlap at each end makes one continuous route.
export const WALKABLE_AREAS = Object.freeze([
  Object.freeze({ left: 32, top: 40, right: 358, bottom: 435 }),
  Object.freeze({ left: -44, top: 310, right: -12, bottom: 427 }),
  Object.freeze({ left: -16, top: 400, right: 36, bottom: 416 }),
] as const) satisfies readonly Readonly<LandBounds>[];
export const ROYAL_ROUTE = Object.freeze([
  Object.freeze({ x: 34, y: 408 }),
  Object.freeze({ x: -14, y: 408 }),
] as const) satisfies readonly Readonly<Point>[];

export function positionForCell(col: number, row: number): Point {
  return {
    x: FIELD.gridX + col * FIELD.cellWidth + FIELD.cellWidth / 2,
    y: FIELD.gridY + (row + 1) * FIELD.cellHeight - 5,
  };
}
