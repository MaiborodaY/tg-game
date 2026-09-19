import { FORGE_UPGRADES } from './forge.ts';
import type { FarmState } from './farm.ts';
import { activeServing, availableMeals, kitchenProgress, kitchenRecipe, planCooking } from './kitchen.ts';
import type { KitchenIngredient, KitchenState, RecipeId } from './kitchen.ts';

interface KitchenOptions {
  root: HTMLElement;
  getKitchen: () => KitchenState;
  getFarm: () => FarmState;
  canUse: () => boolean;
  onCook: (recipe: RecipeId, quantity: number) => boolean;
  getNow?: () => number;
}
export interface KitchenUI { refresh: () => void }

export function foodTime(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds < 3600) return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const minutes = Math.ceil(seconds / 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const DISHES = [
  '<path d="M5 18h30v7H5zM8 25h24v5H8zM12 30h16v3H12z" fill="#879d91"/><path d="M8 18h24v4H8z" fill="#d89849"/><path d="M13 6v7m8-10v10m7-6v6" stroke="#9aa27b" stroke-width="2"/>',
  '<path d="M4 24h32v5H4zM8 29h24v4H8z" fill="#879d91"/><path d="m9 22 7-10 5 3-7 10m6-1 6-11 5 3-6 10" fill="#d89849" stroke="#90643e" stroke-width="2"/>',
  '<path d="M12 10h17v23H12z" fill="#bac2a1" stroke="#667768" stroke-width="2"/><path d="M15 17h11v13H15z" fill="#db9b4d"/><path d="M22 19V5h9" fill="none" stroke="#69784e" stroke-width="3"/>',
];

export function createKitchenUI(options: KitchenOptions): KitchenUI {
  const now = options.getNow ?? (() => Date.now());
  const root = options.root;
  let ingredient: KitchenIngredient = 'carrot';
  root.innerHTML = '<div class="kitchen-level"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 13h32v29H8zM30 3h8v10h-8z" fill="#969884" stroke="#596752" stroke-width="2"/><path d="M14 28h20v14H14z" fill="#635c47"/><path d="m18 38 2-10 4 5 4-9 3 14" fill="#d89849"/><path d="M6 13h36v6H6z" fill="#bbc1a0"/></svg>'
    + '<div><strong data-kitchen-level></strong><span data-kitchen-xp></span><progress data-kitchen-progress aria-label="Kitchen level progress"></progress><small>Next level: +30 sec per portion</small></div></div>'
    + '<div class="kitchen-active" aria-label="Active army bonuses">'
    + FORGE_UPGRADES.map(stat => `<div data-food-active="${stat.id}"><b>${stat.name}</b><span data-food-timer></span><small data-food-queue></small></div>`).join('') + '</div>'
    + '<div class="kitchen-ingredients" role="group" aria-label="Recipe ingredient"><button type="button" class="battle-button" data-ingredient="carrot" aria-pressed="true">Carrot</button>'
    + '<button type="button" class="battle-button" data-ingredient="potato" aria-pressed="false">Potato</button></div><p class="kitchen-stock" data-kitchen-stock></p>'
    + FORGE_UPGRADES.map((stat, index) => `<article class="kitchen-recipe" data-recipe-stat="${stat.id}"><div class="kitchen-recipe-heading">`
      + `<svg viewBox="0 0 40 40" aria-hidden="true">${DISHES[index]}</svg><div><h3>${stat.name}</h3><span data-recipe-name></span></div><strong data-recipe-bonus></strong></div>`
      + `<div class="kitchen-cook-controls"><div class="kitchen-quantity" role="group" aria-label="${stat.name} portions">`
      + `<button type="button" data-less aria-label="Fewer ${stat.name} portions">−</button><input type="number" inputmode="numeric" min="1" step="1" value="1" data-quantity aria-label="${stat.name} portions">`
      + `<button type="button" data-more aria-label="More ${stat.name} portions">+</button><button type="button" data-max aria-label="Maximum ${stat.name} portions">Max</button></div>`
      + '<button type="button" class="battle-button kitchen-cook" data-cook>Cook 1</button></div><p class="kitchen-batch" data-batch></p></article>').join('')
    + '<p class="kitchen-locked" data-potato-locked>Potato recipes · Farm level 2<br>Stronger bonuses: +2%</p>'
    + '<p class="kitchen-note">Time adds up. Percentages do not stack.<br>Kitchen level improves duration only.<br>Army only · Hero excluded · Time runs offline.</p>';
  const level = root.querySelector<HTMLElement>('[data-kitchen-level]')!;
  const xp = root.querySelector<HTMLElement>('[data-kitchen-xp]')!;
  const progress = root.querySelector<HTMLProgressElement>('[data-kitchen-progress]')!;
  const stock = root.querySelector<HTMLElement>('[data-kitchen-stock]')!;
  const locked = root.querySelector<HTMLElement>('[data-potato-locked]')!;
  const ingredientButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ingredient]')];
  const rows = FORGE_UPGRADES.map(stat => {
    const row = root.querySelector<HTMLElement>(`[data-recipe-stat="${stat.id}"]`)!;
    const input = row.querySelector<HTMLInputElement>('[data-quantity]')!;
    const less = row.querySelector<HTMLButtonElement>('[data-less]')!;
    const more = row.querySelector<HTMLButtonElement>('[data-more]')!;
    const max = row.querySelector<HTMLButtonElement>('[data-max]')!;
    const cook = row.querySelector<HTMLButtonElement>('[data-cook]')!;
    const quantity = () => Number.isSafeInteger(input.valueAsNumber) && input.valueAsNumber > 0 ? input.valueAsNumber : 0;
    const recipe = () => kitchenRecipe(`${ingredient}-${stat.id}`)!;
    less.addEventListener('click', () => { input.value = String(Math.max(1, quantity() - 1)); refresh(); });
    more.addEventListener('click', () => { input.value = String(Math.min(availableMeals(options.getFarm(), recipe()), quantity() + 1)); refresh(); });
    max.addEventListener('click', () => { input.value = String(Math.max(1, availableMeals(options.getFarm(), recipe()))); refresh(); });
    input.addEventListener('input', () => refresh());
    input.addEventListener('blur', () => { if (!quantity()) input.value = '1'; refresh(); });
    cook.addEventListener('click', () => {
      if (cook.disabled || !options.canUse()) return;
      if (options.onCook(recipe().id, quantity())) input.value = '1';
      refresh();
    });
    const active = root.querySelector<HTMLElement>(`[data-food-active="${stat.id}"]`)!;
    return { stat, row, input, less, more, max, cook, quantity, recipe,
      name: row.querySelector<HTMLElement>('[data-recipe-name]')!, bonus: row.querySelector<HTMLElement>('[data-recipe-bonus]')!,
      batch: row.querySelector<HTMLElement>('[data-batch]')!, active,
      timer: active.querySelector<HTMLElement>('[data-food-timer]')!, queued: active.querySelector<HTMLElement>('[data-food-queue]')! };
  });
  for (const button of ingredientButtons) button.addEventListener('click', () => {
    if (button.disabled) return;
    ingredient = button.dataset.ingredient as KitchenIngredient;
    for (const row of rows) row.input.value = '1';
    refresh();
  });

  function refresh() {
    const kitchen = options.getKitchen(), farm = options.getFarm(), time = now(), usable = options.canUse();
    if (farm.level < 2) ingredient = 'carrot';
    const info = kitchenProgress(kitchen.mealsCooked);
    level.textContent = `Kitchen · Level ${info.level}`;
    xp.textContent = `${info.cooked} / ${info.required} portions to next level`;
    progress.max = info.required; progress.value = info.cooked;
    progress.setAttribute('aria-valuetext', xp.textContent);
    stock.textContent = `${ingredient === 'carrot' ? 'Carrots' : 'Potatoes'} owned: ${farm.stock[ingredient]} · 1 per portion`;
    locked.hidden = farm.level >= 2;
    for (const button of ingredientButtons) {
      button.disabled = !usable || button.dataset.ingredient === 'potato' && farm.level < 2;
      button.setAttribute('aria-pressed', String(button.dataset.ingredient === ingredient));
      if (button.dataset.ingredient === 'potato') button.textContent = farm.level < 2 ? 'Potato · Farm 2' : 'Potato';
    }
    for (const row of rows) {
      const recipe = row.recipe(), count = row.quantity(), available = availableMeals(farm, recipe);
      const plan = planCooking(kitchen, farm, recipe.id, count, time);
      row.name.textContent = recipe.name;
      row.bonus.textContent = `+${recipe.bonus}%`;
      row.input.max = String(Math.max(1, available));
      row.input.disabled = !usable || !available;
      row.input.setAttribute('aria-invalid', String(!count || count > available && available > 0));
      row.less.disabled = !usable || !available || count <= 1;
      row.more.disabled = !usable || count >= available;
      row.max.disabled = !usable || !available || count === available;
      row.cook.disabled = !usable || !plan.ok;
      row.cook.textContent = `Cook ${count || 1}`;
      row.cook.setAttribute('aria-label', `Cook ${count || 1} ${recipe.name} for ${count || 1} ${ingredient}`);
      row.batch.textContent = plan.ok ? `${count} ${ingredient} · +${foodTime(plan.durationMs)} · +${count} cooking XP`
        : !available ? `Collect ${ingredient} at the Farm · ${foodTime(info.durationMs)} per portion`
        : count > available ? `Only ${available} ${ingredient} available` : 'Choose a valid portion count';
      const active = activeServing(kitchen, row.stat.id, time);
      row.active.dataset.active = String(!!active);
      row.timer.textContent = active ? `+${kitchenRecipe(active.recipeId)!.bonus}% · ${foodTime(active.endsAt - time)}` : 'Inactive';
      const queued = kitchen.buffs[row.stat.id].find(serving => serving.startsAt > time);
      row.queued.textContent = queued ? `Then +${kitchenRecipe(queued.recipeId)!.bonus}% · ${foodTime(queued.endsAt - queued.startsAt)}` : '';
      row.queued.hidden = !queued;
    }
  }
  refresh();
  return { refresh };
}
