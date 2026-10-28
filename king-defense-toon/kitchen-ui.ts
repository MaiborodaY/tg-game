import { FORGE_UPGRADES } from './forge.ts';
import type { ForgeUpgradeId } from './forge.ts';
import type { FarmState } from './farm.ts';
import { CROP_ICONS } from './farm-ui.ts';
import { CLOCK_ICON, statIcon } from './stat-icons.ts';
import { activeServing, availableMeals, kitchenProgress, kitchenRecipe, planCooking } from './kitchen.ts';
import type { KitchenIngredient, KitchenState, RecipeId } from './kitchen.ts';

interface KitchenOptions {
  root: HTMLElement;
  getKitchen: () => KitchenState;
  getFarm: () => FarmState;
  canUse: () => boolean;
  onCook: (recipe: RecipeId, quantity: number) => boolean;
  onFarm: () => void;
  getNow?: () => number;
}
export interface KitchenUI { refresh: () => void; closeHelp: (restoreFocus?: boolean) => boolean }

export function foodTime(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds < 3600) return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const minutes = Math.ceil(seconds / 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const clock = `<svg class="stat-icon kitchen-clock" viewBox="0 0 24 24" aria-hidden="true">${CLOCK_ICON}</svg>`;
const cropIcon = (crop: KitchenIngredient) => `<svg class="kitchen-crop" viewBox="0 0 36 36" aria-hidden="true">${CROP_ICONS[crop]}</svg>`;
const lock = '<svg class="kitchen-lock" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v12H5Zm7 5v3"/></svg>';
const dishNames: Record<KitchenIngredient, readonly string[]> = { carrot: ['Soup', 'Roast', 'Juice'], potato: ['Soup', 'Baked potato', 'Pancakes'] };

export function createKitchenUI(options: KitchenOptions): KitchenUI {
  const now = options.getNow ?? (() => Date.now());
  const root = options.root;
  const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  let ingredient: KitchenIngredient = 'carrot', selected: ForgeUpgradeId = 'health';
  let feedbackUntil = 0;
  // Build once. Shared quantity entry, focus and selection survive economy ticks.
  root.innerHTML = '<div data-kitchen-main><div class="kitchen-level"><strong data-kitchen-level></strong>'
    + '<button class="kitchen-help-toggle" type="button" data-kitchen-help aria-label="How the Kitchen works" aria-expanded="false" aria-controls="kitchen-help">?</button>'
    + '<span data-kitchen-xp></span></div><progress data-kitchen-progress aria-label="Kitchen level progress"></progress>'
    + '<div class="kitchen-ingredients" role="group" aria-label="Recipe ingredient">'
    + (['carrot', 'potato'] as const).map(crop => `<button type="button" data-ingredient="${crop}" aria-pressed="${crop === 'carrot'}">${cropIcon(crop)}<span data-stock></span>${crop === 'potato' ? `<span data-ingredient-lock>${lock} Farm 2</span>` : ''}</button>`).join('') + '</div>'
    + '<div class="kitchen-recipes" role="group" aria-label="Choose a dish">'
    + FORGE_UPGRADES.map((stat, index) => `<button type="button" class="kitchen-recipe" data-recipe-stat="${stat.id}" aria-pressed="${index === 0}">`
      + `<span class="kitchen-dish" data-dish="${index}" aria-hidden="true"></span><span class="kitchen-recipe-copy"><strong data-recipe-name></strong>`
      + `<span class="kitchen-recipe-stats">${statIcon(stat.id)}<b data-recipe-bonus></b><span class="kitchen-active" data-food-active="${stat.id}" hidden>${clock}<span data-food-timer></span></span></span>`
      + '<small data-food-queue hidden></small></span><span class="kitchen-choice" aria-hidden="true">✓</span></button>').join('') + '</div>'
    + `<div class="kitchen-batch" data-batch><span data-batch-crop>${cropIcon('carrot')}</span><span data-batch-cost></span><span class="kitchen-batch-duration">${clock}<span data-batch-time></span></span></div>`
    + '<div class="kitchen-cook-controls"><button type="button" class="battle-button" data-less aria-label="Fewer portions">−</button>'
    + '<input type="number" inputmode="numeric" min="1" step="1" value="1" data-quantity aria-label="Portions">'
    + '<button type="button" class="battle-button" data-more aria-label="More portions">+</button><button type="button" class="battle-button" data-max aria-label="Maximum portions">Max</button>'
    + '<button type="button" class="battle-button kitchen-cook" data-cook>Cook</button></div>'
    + '<div class="kitchen-status"><span data-kitchen-feedback role="status" aria-live="polite"></span><button type="button" data-kitchen-farm hidden>Collect at Farm</button></div></div>'
    + '<section id="kitchen-help" class="kitchen-help" aria-label="Kitchen guide" hidden><header><strong>Kitchen guide</strong><button type="button" data-help-close aria-label="Close Kitchen guide">×</button></header>'
    + '<div class="kitchen-help-copy"><div class="kitchen-help-stats">'
    + FORGE_UPGRADES.map(stat => `<span>${statIcon(stat.id)}${stat.name}</span>`).join('') + '</div>'
    + '<p><b>1 crop = 1 portion.</b> Carrot: +1%. Potato: +2%, unlocked at Farm 2.</p>'
    + '<p>Instant army bonuses; hero and castle excluded. Different stats work together. Portions add <b>time, not %</b>. Time runs offline.</p>'
    + '<p>Stronger food runs first; remaining carrot time waits.</p>'
    + '<p><b>Lv.1: 10 minutes per portion.</b> Each level adds 30 seconds, never bonus strength.</p>'
    + '<p><b>1 portion = 1 cooking XP.</b> Level-ups cost 10, 40, 90… XP: 10 × current level².</p>'
    + '<p class="kitchen-help-next" data-help-next></p></div></section>';

  const find = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const main = find('[data-kitchen-main]'), help = find('#kitchen-help');
  const helpToggle = find<HTMLButtonElement>('[data-kitchen-help]'), helpClose = find<HTMLButtonElement>('[data-help-close]');
  const level = find('[data-kitchen-level]'), xp = find('[data-kitchen-xp]');
  const progress = find<HTMLProgressElement>('[data-kitchen-progress]');
  const input = find<HTMLInputElement>('[data-quantity]');
  const less = find<HTMLButtonElement>('[data-less]'), more = find<HTMLButtonElement>('[data-more]');
  const max = find<HTMLButtonElement>('[data-max]'), cook = find<HTMLButtonElement>('[data-cook]');
  const batch = find('[data-batch]'), batchCrop = find('[data-batch-crop]');
  const batchCost = find('[data-batch-cost]'), batchTime = find('[data-batch-time]');
  const feedback = find('[data-kitchen-feedback]'), farmButton = find<HTMLButtonElement>('[data-kitchen-farm]');
  const ingredientButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ingredient]')];
  const quantity = () => Number.isSafeInteger(input.valueAsNumber) && input.valueAsNumber > 0 ? input.valueAsNumber : 0;
  const recipe = () => kitchenRecipe(`${ingredient}-${selected}`)!;
  const clearFeedback = () => { feedbackUntil = 0; feedback.textContent = ''; };
  const resetChoice = () => { input.value = '1'; clearFeedback(); };
  const closeHelp = (restoreFocus = true) => {
    if (help.hidden) return false;
    help.hidden = true; main.inert = false; main.removeAttribute('aria-hidden');
    helpToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) helpToggle.focus({ preventScroll: true });
    return true;
  };
  helpToggle.addEventListener('click', () => {
    help.hidden = false; main.inert = true; main.setAttribute('aria-hidden', 'true');
    helpToggle.setAttribute('aria-expanded', 'true'); helpClose.focus({ preventScroll: true });
  });
  helpClose.addEventListener('click', () => closeHelp());
  help.addEventListener('keydown', event => {
    if (event.key === 'Tab') { event.preventDefault(); event.stopPropagation(); helpClose.focus(); }
  });
  less.addEventListener('click', () => { input.value = String(Math.max(1, quantity() - 1)); clearFeedback(); refresh(); });
  more.addEventListener('click', () => { input.value = String(Math.min(availableMeals(options.getFarm(), recipe()), quantity() + 1)); clearFeedback(); refresh(); });
  max.addEventListener('click', () => { input.value = String(Math.max(1, availableMeals(options.getFarm(), recipe()))); clearFeedback(); refresh(); });
  input.addEventListener('input', () => { clearFeedback(); refresh(); });
  input.addEventListener('blur', () => { if (!quantity()) input.value = '1'; refresh(); });
  cook.addEventListener('click', () => {
    if (cook.disabled || !options.canUse()) return;
    const count = quantity();
    // Revalidate against the current state; a resume/recovery gate may change it.
    if (!planCooking(options.getKitchen(), options.getFarm(), recipe().id, count, now()).ok) { refresh(); return; }
    if (options.onCook(recipe().id, count)) {
      input.value = '1'; feedback.textContent = `✓ ${count} ${count === 1 ? 'portion' : 'portions'} ready`;
      feedbackUntil = now() + 2500;
    } else { feedback.textContent = 'Unable to cook. Check ingredients.'; feedbackUntil = now() + 5000; }
    refresh();
  });
  farmButton.addEventListener('click', () => { if (options.canUse()) options.onFarm(); });
  const rows = FORGE_UPGRADES.map((stat, index) => {
    const row = find<HTMLButtonElement>(`[data-recipe-stat="${stat.id}"]`);
    row.addEventListener('click', () => {
      if (selected === stat.id) return;
      selected = stat.id; resetChoice(); refresh();
    });
    return { stat, index, row, name: row.querySelector<HTMLElement>('[data-recipe-name]')!,
      bonus: row.querySelector<HTMLElement>('[data-recipe-bonus]')!,
      active: row.querySelector<HTMLElement>('[data-food-active]')!,
      timer: row.querySelector<HTMLElement>('[data-food-timer]')!, queued: row.querySelector<HTMLElement>('[data-food-queue]')! };
  });
  for (const button of ingredientButtons) button.addEventListener('click', () => {
    if (button.disabled || button.dataset.ingredient === ingredient) return;
    ingredient = button.dataset.ingredient as KitchenIngredient;
    batchCrop.innerHTML = cropIcon(ingredient); resetChoice(); refresh();
  });

  function refresh() {
    const kitchen = options.getKitchen(), farm = options.getFarm(), time = now(), usable = options.canUse();
    if (farm.level < 2 && ingredient !== 'carrot') {
      ingredient = 'carrot'; batchCrop.innerHTML = cropIcon(ingredient); resetChoice();
    }
    root.dataset.ingredient = ingredient;
    const info = kitchenProgress(kitchen.mealsCooked);
    level.textContent = `Kitchen · Lv.${info.level}`;
    xp.textContent = `${compactNumber.format(info.cooked)}/${compactNumber.format(info.required)}`;
    xp.title = `${info.cooked} / ${info.required} cooking XP`;
    progress.max = info.required; progress.value = info.cooked;
    progress.setAttribute('aria-valuetext', xp.title);
    find('[data-help-next]').textContent = `${info.required - info.cooked} more portions to level ${info.level + 1}.`;
    for (const button of ingredientButtons) {
      const crop = button.dataset.ingredient as KitchenIngredient, locked = crop === 'potato' && farm.level < 2;
      button.disabled = !usable || locked;
      button.setAttribute('aria-pressed', String(crop === ingredient));
      button.setAttribute('aria-label', locked ? 'Potato recipes: unlock at Farm level 2' : `${crop}: ${farm.stock[crop]} stored`);
      const stock = button.querySelector<HTMLElement>('[data-stock]')!;
      stock.hidden = locked; stock.textContent = `×${compactNumber.format(farm.stock[crop])}`;
      const lockedLabel = button.querySelector<HTMLElement>('[data-ingredient-lock]');
      if (lockedLabel) lockedLabel.hidden = !locked;
    }
    for (const row of rows) {
      const dish = kitchenRecipe(`${ingredient}-${row.stat.id}`)!, active = activeServing(kitchen, row.stat.id, time);
      const activeBonus = active ? kitchenRecipe(active.recipeId)!.bonus : 0;
      const queued = kitchen.buffs[row.stat.id].find(serving => serving.startsAt > time);
      row.row.disabled = !usable;
      row.row.setAttribute('aria-pressed', String(selected === row.stat.id));
      row.name.textContent = dishNames[ingredient][row.index]; row.bonus.textContent = `+${dish.bonus}%`;
      row.active.hidden = !active;
      // Recipe strength and the currently active strength can differ after a crop switch.
      row.timer.textContent = active ? `${activeBonus !== dish.bonus ? `+${activeBonus}% · ` : ''}${foodTime(active.endsAt - time)}` : '';
      row.active.title = active ? `Active ${row.stat.name}: +${activeBonus}% · ${foodTime(active.endsAt - time)}` : '';
      row.queued.hidden = !queued;
      row.queued.textContent = queued ? `Then +${kitchenRecipe(queued.recipeId)!.bonus}% · ${foodTime(queued.endsAt - queued.startsAt)}` : '';
      row.row.setAttribute('aria-label', `${dish.name}: ${row.stat.name} +${dish.bonus}%.${active ? ` ${row.active.title}.` : ''}${queued ? ` ${row.queued.textContent}.` : ''}`);
    }
    const count = quantity(), dish = recipe(), available = availableMeals(farm, dish);
    const plan = planCooking(kitchen, farm, dish.id, count, time);
    input.max = String(Math.max(1, available)); input.disabled = !usable || !available;
    input.setAttribute('aria-invalid', String(!count || count > available && available > 0));
    less.disabled = !usable || !available || count <= 1; more.disabled = !usable || count >= available;
    max.disabled = !usable || !available || count === available; cook.disabled = !usable || !plan.ok;
    cook.setAttribute('aria-label', `Cook ${count || 1} ${dish.name} for ${count || 1} ${ingredient}`);
    batchCost.textContent = `×${count || 1}`;
    batchTime.textContent = foodTime(plan.ok ? plan.durationMs : info.durationMs);
    batch.dataset.valid = String(plan.ok || available === 0);
    if (!plan.ok && available > 0) {
      batchTime.textContent = plan.reason === 'clock-moved-back' ? 'Check device time'
        : plan.reason === 'food-overflow' ? 'Choose fewer portions'
        : count > available ? `Only ${available} available` : 'Enter a whole number';
    }
    batch.setAttribute('aria-label', plan.ok
      ? `${count} ${ingredient} · ${foodTime(plan.durationMs)} · ${count} cooking XP`
      : available ? batchTime.textContent : `Collect ${ingredient} at the Farm`);
    if (time >= feedbackUntil) clearFeedback();
    farmButton.hidden = available > 0 || time < feedbackUntil;
    farmButton.disabled = !usable;
    cook.dataset.success = String(time < feedbackUntil && feedback.textContent?.startsWith('✓'));
  }
  refresh();
  return { refresh, closeHelp };
}
