import { FORGE_MAX_RANK, FORGE_UPGRADES, forgeUpgradeCost } from './forge.ts';
import type { ForgeState, ForgeUpgrade } from './forge.ts';

interface ForgeUIOptions {
  root: HTMLElement;
  getForge: () => ForgeState;
  getGold: () => number;
  canUpgrade: () => boolean;
  onUpgrade: (upgrade: ForgeUpgrade) => void;
}

export interface ForgeUI { refresh: () => void }

const ICONS: Record<ForgeUpgrade, string> = {
  health: '<path d="M12 21S3 15 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 13-9 13Z"/><path d="M12 7v8m-4-4h8"/>',
  attack: '<path d="m6 17 11-13h4v4L9 20m-5-7 7 7m-7 1 3-3"/>',
  attackSpeed: '<circle cx="12" cy="13" r="8"/><path d="M12 8v5l4 2M9 2h6m-3 0v3"/>',
  rangedAttack: '<path d="M5 3q22 9 0 18l5-9Z M4 12h16m-4-4 4 4-4 4"/>',
  rangedAttackSpeed: '<path d="m14 2-9 12h7l-2 8 10-13h-7Z"/>',
};

export function createForgeUI(options: ForgeUIOptions): ForgeUI {
  // Build controls once; income ticks must not replace a focused purchase button.
  options.root.innerHTML = FORGE_UPGRADES.map((upgrade, index) =>
    `${index === 0 || index === 3 ? `<p class="forge-group">${upgrade.scope === 'all' ? 'All fighters' : 'Archers · extra bonus'}</p>` : ''}`
    + `<div class="forge-row" data-forge-row="${upgrade.id}"><svg class="forge-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[upgrade.id]}</svg>`
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
