import type { Battle } from './combat-types.ts';
import type { HeroState } from './hero.ts';
import type { CapitolState } from './capitol.ts';
import type { UnitType } from './units.ts';
import type { SceneAssetWave } from './scene-assets.ts';

export interface GridCell {
  col: number;
  row: number;
}

export type SceneUnitId = string | number;

export interface SceneUnit extends GridCell {
  id: SceneUnitId;
  type: UnitType;
  level?: number;
  hp?: number;
  maxHp?: number;
}

export interface SceneState {
  units: readonly SceneUnit[];
  selectedId: SceneUnitId | null;
  placementType: UnitType | null;
  battle: Battle | null;
  time: number;
  levelNumber?: number;
  wave?: SceneAssetWave | null;
  placementLevel?: number;
  heroState?: HeroState;
  capitolState?: Readonly<CapitolState>;
  unlockedCells?: readonly string[];
  selectedEmptyCell?: string | null;
  selectedLockedCell?: string | null;
  nextUnlockCost?: number | null;
  barracksLevel?: number;
  movingId?: SceneUnitId | null;
  replacingFromReserve?: boolean;
  mergeTargets?: readonly SceneUnitId[];
  mergeLevel?: number;
  draggedId?: SceneUnitId | null;
  dragTargetId?: SceneUnitId | null;
}

export type SceneUpdate = Partial<SceneState>;
export type SceneAssetState =
  | { status: 'loading' | 'ready'; levelNumber: 1 | 2 }
  | { status: 'error'; levelNumber: 1 | 2; error: unknown };

export interface SceneOptions {
  onCell?: (cell: GridCell) => void;
  onHero?: () => void;
  onAssetState?: (state: SceneAssetState) => void;
  formationOnly?: boolean;
  placementGrid?: boolean;
}

export interface Scene {
  getCellAt(clientX: number, clientY: number): GridCell | null;
  getPortrait(type: UnitType): string | null;
  getUnitArt(type: UnitType, level?: number | string): string | null;
  render(nextState: SceneUpdate): void;
  setDrawingEnabled(enabled: boolean): void;
  prepare(nextState?: SceneUpdate): Promise<boolean>;
  retryAssets(): Promise<boolean>;
  getAssetState(): SceneAssetState;
  destroy(): void;
}
