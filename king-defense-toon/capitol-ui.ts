import { capitolUpgradeCost, getCapitolStats } from './capitol.ts';
import type { CapitolState } from './capitol.ts';

type CapitolUpgrade = keyof CapitolState;
interface CapitolUIOptions {
  root: HTMLElement;
  getCapitol: () => CapitolState;
  getGold: () => number;
  canUpgrade: () => boolean;
  onUpgrade: (upgrade: CapitolUpgrade) => void;
}

export interface CapitolUI { refresh: () => void }

const UPGRADES = ['tower', 'health'] as const;
const LABELS: Record<CapitolUpgrade, string> = { tower: 'Tower', health: 'Health' };
const ICONS: Record<CapitolUpgrade, string> = {
  tower: '<path d="M5 21V8H3V3h4v3h3V3h4v3h3V3h4v5h-2v13Z"/><path d="M10 21v-6h4v6M9 10h2m3 0h2"/>',
  health: '<path d="m12 2 9 4v6c0 5-5 9-9 11-4-2-9-6-9-11V6Z"/><path d="M12 7v9m-4-4h8"/>',
};
const numberFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

export function createCapitolUI(options: CapitolUIOptions): CapitolUI {
  // Stable controls preserve touch/focus while gold income refreshes their prices.
  options.root.innerHTML = UPGRADES.map(upgrade =>
    `<div class="capitol-row" data-capitol-row="${upgrade}"><svg class="capitol-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[upgrade]}</svg>`
    + `<div class="capitol-copy"><strong>${LABELS[upgrade]}</strong><small data-capitol-stats></small><small class="capitol-detail" data-capitol-detail></small></div>`
    + `<button class="battle-button capitol-upgrade" data-capitol-upgrade="${upgrade}" type="button"><span data-capitol-action></span><span class="capitol-price"><span class="coin-icon" aria-hidden="true"></span><b data-capitol-price></b></span></button></div>`
  ).join('');
  const rows = UPGRADES.map(upgrade => {
    const row = options.root.querySelector<HTMLElement>(`[data-capitol-row="${upgrade}"]`)!;
    const button = row.querySelector<HTMLButtonElement>('button')!;
    button.addEventListener('click', () => {
      if (!button.disabled && options.canUpgrade()) options.onUpgrade(upgrade);
    });
    return { upgrade, button, stats: row.querySelector<HTMLElement>('[data-capitol-stats]')!,
      detail: row.querySelector<HTMLElement>('[data-capitol-detail]')!,
      action: row.querySelector<HTMLElement>('[data-capitol-action]')!,
      price: row.querySelector<HTMLElement>('[data-capitol-price]')!,
      priceGroup: row.querySelector<HTMLElement>('.capitol-price')! };
  });

  const refresh = () => {
    const capitol = options.getCapitol(), current = getCapitolStats(capitol);
    for (const { upgrade, button, stats, detail, action, price, priceGroup } of rows) {
      const cost = capitolUpgradeCost(capitol, upgrade);
      const next = cost === null ? current : getCapitolStats({ ...capitol, [upgrade]: capitol[upgrade] + 1 });
      const unbuilt = upgrade === 'tower' && capitol.tower === 0;
      const value = upgrade === 'health' ? current.hp : current.damage;
      const nextValue = upgrade === 'health' ? next.hp : next.damage;
      const unit = upgrade === 'health' ? 'HP' : 'damage';
      stats.textContent = unbuilt ? `${numberFormat.format(nextValue)} ${unit}`
        : cost === null ? `${numberFormat.format(value)} ${unit} · Max`
          : `${numberFormat.format(value)} → ${numberFormat.format(nextValue)} ${unit}`;
      detail.textContent = upgrade === 'health' ? `Upgrade ${capitol.health}`
        : `Every ${numberFormat.format(next.interval)}s · ${unbuilt ? 'Not built' : `Lv. ${current.towerLevel}`}`;
      action.textContent = cost === null ? 'Max' : unbuilt ? 'Build' : 'Upgrade';
      price.textContent = String(cost ?? '');
      priceGroup.hidden = cost === null;
      button.disabled = cost === null || options.getGold() < cost || !options.canUpgrade();
      button.setAttribute('aria-label', cost === null ? `${LABELS[upgrade]}: maximum upgrade`
        : `${unbuilt ? 'Build' : 'Upgrade'} ${LABELS[upgrade].toLowerCase()} for ${cost} gold: ${stats.textContent}. Changes apply next battle.`);
    }
  };
  refresh();
  return { refresh };
}
