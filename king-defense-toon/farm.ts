export type CropId = 'carrot' | 'potato' | 'pumpkin';
export interface CropDefinition {
  readonly id: CropId;
  readonly name: string;
  readonly growSeconds: number;
  readonly yield: 1;
}
export interface FarmPlot {
  readonly plantedAt: number;
  readonly readyAt: number;
}
export interface FarmState {
  plots: Record<CropId, FarmPlot | null>;
  stock: Record<CropId, number>;
}
export interface CropProgress {
  status: 'empty' | 'growing' | 'ready';
  remainingSeconds: number;
  progress: number;
}
export interface HarvestResult { harvested: boolean; amount: number }

export const CROPS: readonly CropDefinition[] = Object.freeze([
  Object.freeze({ id: 'carrot', name: 'Carrot', growSeconds: 5 * 60, yield: 1 }),
  Object.freeze({ id: 'potato', name: 'Potato', growSeconds: 15 * 60, yield: 1 }),
  Object.freeze({ id: 'pumpkin', name: 'Pumpkin', growSeconds: 30 * 60, yield: 1 }),
]);

const fields = (value: unknown): Record<string, unknown> => value !== null
  && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const own = (value: Record<string, unknown>, key: string): unknown => Object.hasOwn(value, key) ? value[key] : undefined;
const validTimestamp = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value > 0;
const validStock = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0;

function validPlot(value: unknown, crop: CropDefinition): value is FarmPlot {
  const source = fields(value), plantedAt = own(source, 'plantedAt');
  const duration = crop.growSeconds * 1000;
  return validTimestamp(plantedAt) && plantedAt <= Number.MAX_SAFE_INTEGER - duration
    && own(source, 'readyAt') === plantedAt + duration;
}

function validFarm(value: unknown): value is FarmState {
  const source = fields(value), plots = fields(own(source, 'plots')), stock = fields(own(source, 'stock'));
  return CROPS.every(crop => (own(plots, crop.id) === null || validPlot(own(plots, crop.id), crop))
    && validStock(own(stock, crop.id)));
}

export function createFarm(saved?: unknown): FarmState {
  const source = fields(saved), plots = fields(own(source, 'plots')), stock = fields(own(source, 'stock'));
  return {
    plots: Object.fromEntries(CROPS.map(crop => {
      const plot = own(plots, crop.id);
      return [crop.id, validPlot(plot, crop) ? { plantedAt: plot.plantedAt, readyAt: plot.readyAt } : null];
    })) as FarmState['plots'],
    stock: Object.fromEntries(CROPS.map(crop => {
      const count = own(stock, crop.id);
      return [crop.id, validStock(count) ? count : 0];
    })) as FarmState['stock'],
  };
}

export function getCropProgress(farm: Readonly<FarmState>, cropId: CropId, now: number = Date.now()): CropProgress {
  if (!validFarm(farm)) throw new TypeError('Invalid farm state');
  const crop = CROPS.find(entry => entry.id === cropId);
  if (!crop) throw new RangeError('Unknown crop');
  if (!validTimestamp(now)) throw new RangeError('Invalid farm clock');
  const plot = farm.plots[cropId];
  if (!plot) return { status: 'empty', remainingSeconds: 0, progress: 0 };
  const duration = crop.growSeconds * 1000;
  // Absolute timestamps advance offline without a ticker or battle-speed multiplier.
  // A clock rollback can delay readiness, but cannot show negative growth or >100% remaining time.
  const remaining = Math.max(0, Math.min(duration, plot.readyAt - now));
  return { status: now >= plot.readyAt ? 'ready' : 'growing',
    remainingSeconds: Math.ceil(remaining / 1000), progress: 1 - remaining / duration };
}

export function plantCrop(farm: FarmState, cropId: CropId, now: number = Date.now()): boolean {
  const crop = CROPS.find(entry => entry.id === cropId);
  if (!crop || !validFarm(farm) || !validTimestamp(now)
    || now > Number.MAX_SAFE_INTEGER - crop.growSeconds * 1000 || farm.plots[cropId] !== null) return false;
  farm.plots[cropId] = { plantedAt: now, readyAt: now + crop.growSeconds * 1000 };
  return true;
}

export function harvestCrop(farm: FarmState, cropId: CropId, now: number = Date.now()): HarvestResult {
  const fail = (): HarvestResult => ({ harvested: false, amount: 0 });
  const crop = CROPS.find(entry => entry.id === cropId);
  if (!crop || !validFarm(farm) || !validTimestamp(now)) return fail();
  const plot = farm.plots[cropId];
  if (!plot || now < plot.readyAt || farm.stock[cropId] > Number.MAX_SAFE_INTEGER - crop.yield) return fail();
  // Credit and empty the bed together; an overflow leaves the ripe crop available.
  farm.stock[cropId] += crop.yield;
  farm.plots[cropId] = null;
  return { harvested: true, amount: crop.yield };
}
