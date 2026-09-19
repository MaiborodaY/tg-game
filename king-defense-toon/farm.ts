export type CropId = 'carrot' | 'potato' | 'pumpkin';
export type FarmLevel = 1 | 2 | 3;
export interface CropDefinition {
  readonly id: CropId;
  readonly name: string;
  readonly growSeconds: number;
  readonly unlockLevel: FarmLevel;
}
export interface FarmPlot {
  // Production checkpoint; readyAt is the first uncollected crop's deadline.
  readonly plantedAt: number;
  readonly readyAt: number;
}
export interface FarmState {
  version: 2;
  level: FarmLevel;
  plots: Record<CropId, FarmPlot | null>;
  stock: Record<CropId, number>;
}
export interface CropProgress {
  status: 'locked' | 'growing' | 'ready' | 'full';
  available: number;
  capacity: number;
  remainingSeconds: number;
  progress: number;
}
export interface HarvestResult { harvested: boolean; amount: number }

export const CROPS: readonly CropDefinition[] = Object.freeze([
  Object.freeze({ id: 'carrot', name: 'Carrot', growSeconds: 5 * 60, unlockLevel: 1 as const }),
  Object.freeze({ id: 'potato', name: 'Potato', growSeconds: 15 * 60, unlockLevel: 2 as const }),
  Object.freeze({ id: 'pumpkin', name: 'Pumpkin', growSeconds: 30 * 60, unlockLevel: 3 as const }),
]);

export const FARM_LEVELS = Object.freeze({
  1: Object.freeze({ capacity: 10, upgradeCost: 500 }),
  2: Object.freeze({ capacity: 20, upgradeCost: 1500 }),
  3: Object.freeze({ capacity: 30, upgradeCost: null }),
});

const fields = (value: unknown): Record<string, unknown> => value !== null
  && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const own = (value: Record<string, unknown>, key: string): unknown => Object.hasOwn(value, key) ? value[key] : undefined;
const validTimestamp = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value > 0;
const validStock = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0;
const validLevel = (value: unknown): value is FarmLevel => value === 1 || value === 2 || value === 3;
const validClock = (value: unknown): value is number => validTimestamp(value)
  && value <= Number.MAX_SAFE_INTEGER - 30 * 60 * 1000;
const newPlot = (crop: CropDefinition, start: number): FarmPlot =>
  ({ plantedAt: start, readyAt: start + crop.growSeconds * 1000 });

function validPlot(value: unknown, crop: CropDefinition): value is FarmPlot {
  const source = fields(value), plantedAt = own(source, 'plantedAt');
  const duration = crop.growSeconds * 1000;
  return validTimestamp(plantedAt) && plantedAt <= Number.MAX_SAFE_INTEGER - duration
    && own(source, 'readyAt') === plantedAt + duration;
}

function validFarm(value: unknown): value is FarmState {
  const source = fields(value), plots = fields(own(source, 'plots')), stock = fields(own(source, 'stock'));
  const level = own(source, 'level');
  return own(source, 'version') === 2 && validLevel(level) && CROPS.every(crop =>
    (crop.unlockLevel <= level ? validPlot(own(plots, crop.id), crop) : own(plots, crop.id) === null)
    && validStock(own(stock, crop.id)));
}

export function createFarm(saved: unknown = undefined, now: number = Date.now()): FarmState {
  if (!validClock(now)) throw new RangeError('Invalid farm clock');
  const source = fields(saved), plots = fields(own(source, 'plots')), stock = fields(own(source, 'stock'));
  const automatic = own(source, 'version') === 2, savedLevel = own(source, 'level');
  const level = automatic && validLevel(savedLevel) ? savedLevel : 1;
  return {
    version: 2, level,
    plots: Object.fromEntries(CROPS.map(crop => {
      const plot = own(plots, crop.id);
      if (crop.unlockLevel > level) return [crop.id, null];
      // A legacy planting earned one crop, not continuous production since that date.
      const start = validPlot(plot, crop)
        ? (!automatic && now >= plot.readyAt ? now - crop.growSeconds * 1000 : plot.plantedAt) : now;
      return [crop.id, newPlot(crop, start)];
    })) as FarmState['plots'],
    stock: Object.fromEntries(CROPS.map(crop => {
      const count = own(stock, crop.id);
      let stored = validStock(count) ? count : 0;
      // Return the old potato/pumpkin planting once, as these beds now require upgrades.
      if (!automatic && crop.unlockLevel > level && validPlot(own(plots, crop.id), crop)
        && stored < Number.MAX_SAFE_INTEGER) stored += 1;
      return [crop.id, stored];
    })) as FarmState['stock'],
  };
}

export function getCropProgress(farm: Readonly<FarmState>, cropId: CropId, now: number = Date.now()): CropProgress {
  if (!validFarm(farm)) throw new TypeError('Invalid farm state');
  const crop = CROPS.find(entry => entry.id === cropId);
  if (!crop) throw new RangeError('Unknown crop');
  if (!validClock(now)) throw new RangeError('Invalid farm clock');
  const capacity = FARM_LEVELS[farm.level].capacity;
  const plot = farm.plots[cropId];
  if (!plot) return { status: 'locked', available: 0, capacity, remainingSeconds: 0, progress: 0 };
  const duration = crop.growSeconds * 1000;
  // Absolute time advances offline; a full bed stops earning, regardless of time away.
  const elapsed = Math.max(0, now - plot.plantedAt);
  const available = Math.min(capacity, Math.floor(elapsed / duration));
  const full = available === capacity;
  return { status: full ? 'full' : available > 0 ? 'ready' : 'growing', available, capacity,
    remainingSeconds: full ? 0 : Math.ceil((duration - elapsed % duration) / 1000),
    progress: Math.min(1, elapsed / duration / capacity) };
}

export function getFarmUpgrade(farm: Readonly<FarmState>) {
  if (!validFarm(farm)) throw new TypeError('Invalid farm state');
  if (farm.level === 3) return null;
  const nextLevel = (farm.level + 1) as FarmLevel;
  return { nextLevel, cost: FARM_LEVELS[farm.level].upgradeCost,
    capacity: FARM_LEVELS[farm.level].capacity, nextCapacity: FARM_LEVELS[nextLevel].capacity,
    crop: CROPS.find(crop => crop.unlockLevel === nextLevel)! };
}

export function harvestCrop(farm: FarmState, cropId: CropId, now: number = Date.now()): HarvestResult {
  const fail = (): HarvestResult => ({ harvested: false, amount: 0 });
  const crop = CROPS.find(entry => entry.id === cropId);
  if (!crop || !validFarm(farm) || !validClock(now)) return fail();
  const plot = farm.plots[cropId];
  if (!plot) return fail();
  const { available, status } = getCropProgress(farm, cropId, now);
  if (!available || farm.stock[cropId] > Number.MAX_SAFE_INTEGER - available) return fail();
  // Keep fractional growth on partial collection; discard overflow time at the cap.
  const start = status === 'full' ? now : plot.plantedAt + available * crop.growSeconds * 1000;
  farm.stock[cropId] += available;
  farm.plots[cropId] = newPlot(crop, start);
  return { harvested: true, amount: available };
}

export function upgradeFarm(farm: FarmState, gold: number, now: number) {
  if (!validFarm(farm) || !validStock(gold)) return { ok: false as const, reason: 'invalid-state' as const };
  if (!validClock(now)) return { ok: false as const, reason: 'invalid-time' as const };
  const upgrade = getFarmUpgrade(farm);
  if (!upgrade) return { ok: false as const, reason: 'max-level' as const };
  if (gold < upgrade.cost) return { ok: false as const, reason: 'insufficient-gold' as const };
  const plots = { ...farm.plots };
  for (const crop of CROPS) {
    if (crop.unlockLevel === upgrade.nextLevel) plots[crop.id] = newPlot(crop, now);
    else if (crop.unlockLevel <= farm.level && getCropProgress(farm, crop.id, now).status === 'full') {
      // Preserve the old cap's crop count, but never backfill newly purchased space.
      plots[crop.id] = newPlot(crop, now - upgrade.capacity * crop.growSeconds * 1000);
    }
  }
  farm.level = upgrade.nextLevel;
  farm.plots = plots;
  return { ok: true as const, gold: gold - upgrade.cost, cost: upgrade.cost, level: farm.level };
}
