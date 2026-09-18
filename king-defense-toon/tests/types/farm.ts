import { CROPS, createFarm, getCropProgress, harvestCrop, plantCrop } from '../../farm.ts';
import type { CropDefinition, CropId, CropProgress, FarmPlot, FarmState, HarvestResult } from '../../farm.ts';

export function verifyFarmContracts(saved: unknown): void {
  const farm: FarmState = createFarm(saved);
  const crop: CropId = 'carrot';
  const definition: CropDefinition = CROPS[0]!;
  const progress: CropProgress = getCropProgress(farm, crop);
  const planted: boolean = plantCrop(farm, crop, Date.now());
  const result: HarvestResult = harvestCrop(farm, crop);
  const plot: FarmPlot | null = farm.plots.pumpkin;
  const count: number = farm.stock.potato;
  // @ts-expect-error There are only three fixed crop identifiers.
  plantCrop(farm, 'bean');
  // @ts-expect-error Saved input must be normalized before use.
  harvestCrop(saved, crop);
  // @ts-expect-error Real-time timestamps are numeric milliseconds.
  plantCrop(farm, crop, '1800000000000');
  // @ts-expect-error The shared crop catalogue is immutable.
  CROPS.push(definition);
  // @ts-expect-error Crop durations cannot be changed through a shared definition.
  definition.growSeconds = 0;
  // @ts-expect-error A bed can be empty.
  const readyAt: number = farm.plots.carrot.readyAt;
  // @ts-expect-error Stock is counted using validated integer numbers.
  farm.stock.potato = '3';
  // @ts-expect-error Normalized saves contain all three crop inventories.
  const incomplete: FarmState['stock'] = { carrot: 0, potato: 0 };
  void [progress, planted, result, plot, count, readyAt, incomplete];
}
