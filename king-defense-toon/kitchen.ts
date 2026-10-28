import type { ForgeUpgradeId } from './forge.ts';
import type { FarmState } from './farm.ts';
import type { FoodBonuses } from './army-food.ts';

export type KitchenIngredient = 'carrot' | 'potato';
export type RecipeId = `${KitchenIngredient}-${ForgeUpgradeId}`;
export interface Recipe {
  readonly id: RecipeId;
  readonly ingredient: KitchenIngredient;
  readonly stat: ForgeUpgradeId;
  readonly name: string;
  readonly bonus: number;
  readonly farmLevel: number;
}
export const RECIPES: readonly Recipe[] = Object.freeze(([
  { id: 'carrot-health', ingredient: 'carrot', stat: 'health', name: 'Carrot soup', bonus: 1, farmLevel: 1 },
  { id: 'carrot-attack', ingredient: 'carrot', stat: 'attack', name: 'Roasted carrots', bonus: 1, farmLevel: 1 },
  { id: 'carrot-attackSpeed', ingredient: 'carrot', stat: 'attackSpeed', name: 'Carrot juice', bonus: 1, farmLevel: 1 },
  { id: 'potato-health', ingredient: 'potato', stat: 'health', name: 'Potato soup', bonus: 2, farmLevel: 2 },
  { id: 'potato-attack', ingredient: 'potato', stat: 'attack', name: 'Baked potato', bonus: 2, farmLevel: 2 },
  { id: 'potato-attackSpeed', ingredient: 'potato', stat: 'attackSpeed', name: 'Potato pancakes', bonus: 2, farmLevel: 2 },
] satisfies Recipe[]).map(recipe => Object.freeze(recipe)));

export const kitchenRecipe = (id: unknown): Recipe | undefined => RECIPES.find(recipe => recipe.id === id);
export const validMealCount = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0;
// Cumulative costs use integers even at the save format's safe-integer boundary.
const levelStart = (level: number): bigint => {
  const n = BigInt(level - 1);
  return 10n * n * (n + 1n) * (2n * n + 1n) / 6n;
};

export function kitchenProgress(mealsCooked: number) {
  const total = BigInt(validMealCount(mealsCooked) ? mealsCooked : 0);
  let low = 1, high = 2;
  while (levelStart(high) <= total) high *= 2;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (levelStart(middle) <= total) low = middle; else high = middle;
  }
  const required = 10 * low * low;
  return { level: low, cooked: Number(total - levelStart(low)), required,
    durationMs: 600_000 + (low - 1) * 30_000 };
}

/** A batch earns the same duration and XP as separate cooks, including crossed levels. */
export function batchDuration(mealsCooked: number, quantity: number): number | null {
  if (!validMealCount(mealsCooked) || !validMealCount(quantity) || quantity < 1
    || mealsCooked > Number.MAX_SAFE_INTEGER - quantity) return null;
  let remaining = quantity, total = mealsCooked, duration = 0;
  while (remaining > 0) {
    const progress = kitchenProgress(total);
    const count = Math.min(remaining, progress.required - progress.cooked);
    const added = count * progress.durationMs;
    if (!Number.isSafeInteger(added) || duration > Number.MAX_SAFE_INTEGER - added) return null;
    duration += added;
    total += count;
    remaining -= count;
  }
  return duration;
}

export function availableMeals(farm: Readonly<FarmState>, recipe: Recipe): number {
  const stock = farm.stock[recipe.ingredient];
  return farm.level >= recipe.farmLevel && validMealCount(stock) ? stock : 0;
}

export const FOOD_STATS: readonly ForgeUpgradeId[] = ['health', 'attack', 'attackSpeed'];
export interface FoodServing { recipeId: RecipeId; startsAt: number; endsAt: number }
export interface KitchenState {
  mealsCooked: number;
  buffs: Record<ForgeUpgradeId, FoodServing[]>;
}
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object'
  && !Array.isArray(value) ? value as Record<string, unknown> : {};
const timestamp = (value: unknown): value is number => validMealCount(value) && value > 0;

/** Reject malformed paid food instead of silently replacing it with an empty kitchen. */
export function createKitchen(saved?: unknown, now = 1): KitchenState {
  if (saved === undefined) return { mealsCooked: 0, buffs: { health: [], attack: [], attackSpeed: [] } };
  const source = record(saved), buffs = record(source.buffs);
  if (!validMealCount(source.mealsCooked)) throw new Error('Invalid saved kitchen progress');
  const restored: KitchenState = { mealsCooked: source.mealsCooked, buffs: { health: [], attack: [], attackSpeed: [] } };
  for (const stat of FOOD_STATS) {
    const entries = buffs[stat];
    if (!Array.isArray(entries) || entries.length > 2) throw new Error('Invalid saved food queue');
    let previous: FoodServing | undefined;
    for (const entry of entries) {
      const item = record(entry), recipe = kitchenRecipe(item.recipeId);
      if (!recipe || recipe.stat !== stat || !timestamp(item.startsAt) || !timestamp(item.endsAt)
        || item.endsAt <= item.startsAt || (previous && (previous.endsAt !== item.startsAt
          || kitchenRecipe(previous.recipeId)!.bonus <= recipe.bonus))) throw new Error('Invalid saved food serving');
      const serving = { recipeId: recipe.id, startsAt: item.startsAt, endsAt: item.endsAt };
      if (serving.endsAt > now) restored.buffs[stat].push(serving);
      previous = serving;
    }
  }
  return restored;
}

export function activeServing(kitchen: Readonly<KitchenState>, stat: ForgeUpgradeId, now: number): FoodServing | undefined {
  return kitchen.buffs[stat].find(serving => serving.startsAt <= now && serving.endsAt > now);
}

export function kitchenBonuses(kitchen: Readonly<KitchenState>, now: number): FoodBonuses {
  const bonus = (stat: ForgeUpgradeId) => kitchenRecipe(activeServing(kitchen, stat, now)?.recipeId)?.bonus ?? 0;
  return { health: bonus('health'), attack: bonus('attack'), attackSpeed: bonus('attackSpeed') };
}

export function planCooking(kitchen: Readonly<KitchenState>, farm: Readonly<FarmState>, recipeId: RecipeId,
  quantity: number, now: number) {
  const fail = (reason: string) => ({ ok: false as const, reason });
  const recipe = kitchenRecipe(recipeId);
  if (!recipe) return fail('invalid-recipe');
  if (!timestamp(now)) return fail('invalid-time');
  if (!validMealCount(quantity) || quantity < 1) return fail('invalid-quantity');
  if (farm.level < recipe.farmLevel) return fail('farm-locked');
  if (availableMeals(farm, recipe) < quantity) return fail('insufficient-ingredients');
  const durationMs = batchDuration(kitchen.mealsCooked, quantity);
  if (durationMs === null) return fail('food-overflow');
  const bank: Record<KitchenIngredient, number> = { carrot: 0, potato: 0 };
  const old = kitchen.buffs[recipe.stat];
  if (old.length && now < old[0].startsAt) return fail('clock-moved-back');
  for (const serving of old) {
    bank[kitchenRecipe(serving.recipeId)!.ingredient] += Math.max(0, serving.endsAt - Math.max(now, serving.startsAt));
  }
  bank[recipe.ingredient] += durationMs;
  let start = now;
  const queue: FoodServing[] = [];
  // At most two segments per stat. Stronger food runs first; weaker time is never
  // discarded or converted into stronger time by cheap ingredient top-ups.
  for (const ingredient of ['potato', 'carrot'] as const) {
    const duration = bank[ingredient];
    if (!duration) continue;
    if (!Number.isSafeInteger(duration) || start > Number.MAX_SAFE_INTEGER - duration) return fail('food-overflow');
    queue.push({ recipeId: `${ingredient}-${recipe.stat}`, startsAt: start, endsAt: start + duration });
    start += duration;
  }
  const next: KitchenState = { mealsCooked: kitchen.mealsCooked + quantity,
    buffs: { ...kitchen.buffs, [recipe.stat]: queue } };
  return { ok: true as const, kitchen: next, ingredient: recipe.ingredient, durationMs, quantity };
}
