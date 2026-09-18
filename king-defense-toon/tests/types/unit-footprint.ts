import { canPlaceUnit, getUnitAtCell, getUnitCells, getUnitPosition, planFormationMove,
  reconcileUnitFootprints } from '../../unit-footprint.ts';
import type { ArmyUnit, Fighter } from '../../unit-merging.ts';
import type { Point } from '../../field.ts';

export function verifyUnitFootprintContracts(units: readonly ArmyUnit[], reserve: readonly Fighter[],
  unlockedCells: readonly string[]): void {
  const moved: ArmyUnit[] = planFormationMove(units, 1, 2, 0, unlockedCells).units;
  const found: ArmyUnit | undefined = getUnitAtCell(units, 3, 0);
  const preview = { type: 'pantherRider' as const, col: 1, row: 0 };
  const fits: boolean = canPlaceUnit(preview, units, unlockedCells, [1]);
  const cells: string[] = getUnitCells(preview);
  const position: Point = getUnitPosition(preview);
  const migrated = reconcileUnitFootprints(units, reserve, unlockedCells);
  const army: ArmyUnit[] = migrated.units;
  const barracks: Fighter[] = migrated.reserve;
  const sceneUnits = [{ ...preview, id: 'render-unit', hp: 20 }];
  const sceneMove = planFormationMove(sceneUnits, 'render-unit', 2, 0, unlockedCells);
  const hp: number = sceneMove.units[0]!.hp;
  // @ts-expect-error A positioned unit needs both formation coordinates.
  getUnitCells({ type: 'pantherRider', col: 1 });
  // @ts-expect-error Only catalogue unit IDs have a formation footprint.
  getUnitPosition({ type: 'hero', col: 1, row: 0 });
  // @ts-expect-error A geometry-only preview cannot identify which unit is moving.
  planFormationMove([preview], 1, 2, 0, unlockedCells);
  void [moved, found, fits, cells, position, army, barracks, hp];
}
