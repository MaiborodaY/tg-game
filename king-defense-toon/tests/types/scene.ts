import { cellAtPoint, createScene } from '../../scene.ts';
import type { GridCell, Scene, SceneAssetState, SceneUnit, SceneUpdate } from '../../scene-types.ts';
import { createBattle } from '../../combat.ts';
import { createHero } from '../../hero.ts';

export async function verifySceneContracts(canvas: HTMLCanvasElement, saved: unknown): Promise<void> {
  const unit: SceneUnit = { id: 1, type: 'swordsman', col: 2, row: 0, level: 1 };
  const units: readonly SceneUnit[] = [unit];
  const battle = createBattle(units, 1, createHero(saved));
  const scene: Scene = await createScene(canvas, {
    onCell(cell) { const col: number = cell.col; void col; },
    onAssetState(state) {
      if (state.status === 'error') {
        const failure: unknown = state.error;
        // @ts-expect-error Failed image loading can throw any value.
        const error: Error = state.error;
        void [failure, error];
      } else {
        // @ts-expect-error Loading and ready notifications carry no failure payload.
        state.error;
      }
    },
  });
  const prepared: boolean = await scene.prepare({ units, battle, time: .5 });
  await scene.prepare({ wave: battle.wave });
  const update: SceneUpdate = { selectedId: 1, placementType: 'archer', placementLevel: 26, heroState: createHero() };
  scene.render(update);
  scene.render({ battle: null, units: [], placementType: null, selectedId: null });
  const cell: GridCell | null = scene.getCellAt(100, 300);
  const worldCell: GridCell | null = cellAtPoint(200, 400);
  const art: string | null = scene.getUnitArt('lancer', '26');
  const status: SceneAssetState = scene.getAssetState();
  const retry: boolean = await scene.retryAssets();

  // @ts-expect-error Canvas picking can miss the placement grid.
  const guaranteed: GridCell = scene.getCellAt(0, 0);
  // @ts-expect-error The renderer needs a canvas, not an arbitrary HTML element.
  await createScene(document.createElement('div'));
  // @ts-expect-error Pointer positions use numbers, not CSS lengths.
  scene.getCellAt('100px', 200);
  // @ts-expect-error Unit portrait lookup has a closed allied type catalogue.
  scene.getPortrait('goblin');
  // @ts-expect-error Unit art levels are numeric or a legacy numeric string, not flags.
  scene.getUnitArt('archer', false);
  // @ts-expect-error A formation cannot deploy an enemy.
  scene.render({ units: [{ ...unit, type: 'goblin' }] });
  // @ts-expect-error An incoming battle must have actual initialized combat state.
  scene.render({ battle: { phase: 'running' } });
  // @ts-expect-error Raw saved hero fields need normalization before rendering.
  scene.render({ heroState: saved });
  // @ts-expect-error Visual time uses numbers.
  scene.prepare({ time: '0.5' });
  // @ts-expect-error Grid slots are addressed by column and row, not world positions.
  await createScene(canvas, { onCell: (point: { x: number; y: number }) => { void point; } });
  // @ts-expect-error A failed resource notification includes the original error.
  const incomplete: SceneAssetState = { status: 'error', levelNumber: 1 };
  // @ts-expect-error Only the supported asset lifecycle statuses exist.
  const invalid: SceneAssetState = { status: 'done', levelNumber: 1 };
  scene.destroy();
  void [prepared, cell, worldCell, art, status, retry, guaranteed, incomplete, invalid];
}
