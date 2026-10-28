import { FORGE_MAX_RANK, FORGE_UPGRADES, forgeUpgradeCost } from './forge.ts';
import type { ForgeState, ForgeUpgrade } from './forge.ts';
import { STAT_ICONS } from './stat-icons.ts';

interface ForgeUIOptions {
  root: HTMLElement;
  getForge: () => ForgeState;
  getGold: () => number;
  canUpgrade: () => boolean;
  onUpgrade: (upgrade: ForgeUpgrade) => void;
}

export interface ForgeUI { refresh: () => void }

export function createForgeUI(options: ForgeUIOptions): ForgeUI {
  // Build controls once; income ticks must not replace a focused purchase button.
  options.root.innerHTML = FORGE_UPGRADES.map(upgrade =>
    `<div class="forge-row" data-forge-row="${upgrade.id}"><svg class="forge-icon" viewBox="0 0 24 24" aria-hidden="true">${STAT_ICONS[upgrade.id]}</svg>`
    + `<div class="forge-copy"><strong>${upgrade.name}</strong><small data-forge-bonus></small></div>`
    + `<button class="battle-button forge-upgrade" data-forge-upgrade="${upgrade.id}" type="button"><span data-forge-increase>+1%</span><span class="forge-price"><span class="coin-icon" aria-hidden="true"></span><b data-forge-price></b></span></button></div>`
  ).join('');
  const rows = FORGE_UPGRADES.map(upgrade => {
    const row = options.root.querySelector<HTMLElement>(`[data-forge-row="${upgrade.id}"]`)!;
    const button = row.querySelector<HTMLButtonElement>('button')!;
    button.addEventListener('click', () => {
      if (!button.disabled && options.canUpgrade()) options.onUpgrade(upgrade.id);
    });
    return { upgrade, button, bonus: row.querySelector<HTMLElement>('[data-forge-bonus]')!,
      increase: row.querySelector<HTMLElement>('[data-forge-increase]')!,
      price: row.querySelector<HTMLElement>('[data-forge-price]')!,
      priceGroup: row.querySelector<HTMLElement>('.forge-price')! };
  });
  const refresh = () => {
    const forge = options.getForge();
    for (const { upgrade, button, bonus, increase, price, priceGroup } of rows) {
      const rank = forge[upgrade.id], cost = forgeUpgradeCost(forge, upgrade.id);
      bonus.textContent = cost === null ? `+${rank}% · Max` : `+${rank}% → +${rank + 1}%`;
      increase.textContent = cost === null ? 'Max' : '+1%';
      price.textContent = String(cost ?? '');
      priceGroup.hidden = cost === null;
      button.disabled = cost === null || options.getGold() < cost || !options.canUpgrade();
      button.setAttribute('aria-label', cost === null ? `${upgrade.name}: maximum +${FORGE_MAX_RANK}%`
        : `${upgrade.name}: +${rank}% to +${rank + 1}% for ${cost} gold. ${upgrade.description}`);
    }
  };
  refresh();
  return { refresh };
}
