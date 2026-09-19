import { CROPS, FARM_LEVELS, getCropProgress, getFarmUpgrade } from './farm.ts';
import type { CropId, FarmState } from './farm.ts';

interface FarmUIOptions {
  root: HTMLElement;
  getFarm: () => FarmState;
  getGold: () => number;
  canUse: () => boolean;
  onUpgrade: () => void;
  onHarvest: (crop: CropId) => void;
  getNow?: () => number;
}

export interface FarmUI { refresh: () => void }

export const CROP_ICONS: Readonly<Record<CropId, string>> = {
  carrot: '<path d="m18 13 4-8 4 1-4 8m-2-1 1-10-4-1-1 11m4 1 8-5 2 4-8 4" fill="#79a45b" stroke="#496642"/><path d="M12 13c3-3 8-1 10 2 2 4-2 8-7 12L7 33l2-11c0-4 0-7 3-9Z" fill="#e59a42" stroke="#986039"/><path d="m12 19 4 2m-5 4 3 1m3-11 3 2" fill="none" stroke="#b47138"/><path d="m12 17-1 5" stroke="#f8c475"/>',
  potato: '<path d="M20 9c5-3 11 1 12 8 2 7-2 13-8 13-5 0-10-5-10-10 0-4 2-8 6-11Z" fill="#b89a68" stroke="#806345"/><path d="M9 11c4-3 9-1 12 4 3 5 3 12-2 15-4 4-11 2-14-3-4-5-2-12 4-16Z" fill="#d9b67c" stroke="#806345"/><path d="m9 16 2-1m4 6 2 1m-9 4 2 1m16-12 2 1m-3 8 2-1" fill="none" stroke="#a47f50"/><path d="m7 20 1-3m13-4 3-1" fill="none" stroke="#edcf97"/>',
  pumpkin: '<path d="m17 12 1-8 5-1 1 3-4 2v5" fill="#6f8950" stroke="#4f6341"/><path d="M18 13c5-6 13-3 15 4 3 9-3 15-15 15S1 26 4 17c2-6 9-8 14-4Z" fill="#dc903c" stroke="#94603a"/><ellipse cx="18" cy="22" rx="8" ry="10" fill="#eda44a" stroke="#b57435"/><path d="M18 13v18m-6-15-2 6m14-8 4 2" fill="none" stroke="#f6bf69"/>',
};

function countdown(seconds: number): string {
  const remaining = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
}

export function createFarmUI(options: FarmUIOptions): FarmUI {
  const now = options.getNow ?? (() => Date.now());
  const stockNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  // Refresh existing nodes so focus stays on Collect/Upgrade as the clock advances.
  options.root.innerHTML = '<div class="farm-level"><strong data-farm-level></strong><span data-farm-capacity></span></div>' + CROPS.map(crop =>
    `<div class="farm-row" data-farm-row="${crop.id}">`
    + `<svg class="farm-crop-icon" viewBox="0 0 36 36" aria-hidden="true">${CROP_ICONS[crop.id]}</svg>`
    + `<div class="farm-copy"><div class="farm-crop-heading"><strong>${crop.name}</strong>`
    + '<span class="farm-stock">Owned <b data-farm-stock>0</b></span></div>'
    + '<div class="farm-harvest-count" data-farm-available></div>'
    + `<div class="farm-meter" data-farm-progress role="progressbar" aria-label="${crop.name} bed capacity" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-farm-fill></span></div>`
    + '<small class="farm-timer" data-farm-timer></small></div>'
    + `<button class="battle-button farm-action" data-farm-action="${crop.id}" type="button">Collect</button></div>`
  ).join('') + '<div class="farm-upgrade" data-farm-upgrade-panel><div class="farm-upgrade-copy">'
    + '<strong data-farm-upgrade-title></strong><span data-farm-upgrade-detail></span></div>'
    + '<button class="battle-button farm-upgrade-action" data-farm-upgrade type="button">Upgrade<span data-farm-upgrade-cost></span></button></div>';

  const level = options.root.querySelector<HTMLElement>('[data-farm-level]')!;
  const capacityLabel = options.root.querySelector<HTMLElement>('[data-farm-capacity]')!;
  const upgradePanel = options.root.querySelector<HTMLElement>('[data-farm-upgrade-panel]')!;
  const upgradeTitle = options.root.querySelector<HTMLElement>('[data-farm-upgrade-title]')!;
  const upgradeDetail = options.root.querySelector<HTMLElement>('[data-farm-upgrade-detail]')!;
  const upgradeButton = options.root.querySelector<HTMLButtonElement>('[data-farm-upgrade]')!;
  const upgradeCost = options.root.querySelector<HTMLElement>('[data-farm-upgrade-cost]')!;
  upgradeButton.addEventListener('click', () => {
    if (upgradeButton.disabled || !options.canUse()) return;
    const upgrade = getFarmUpgrade(options.getFarm());
    if (upgrade && options.getGold() >= upgrade.cost) options.onUpgrade();
  });

  const rows = CROPS.map(crop => {
    const row = options.root.querySelector<HTMLElement>(`[data-farm-row="${crop.id}"]`)!;
    const button = row.querySelector<HTMLButtonElement>('[data-farm-action]')!;
    button.addEventListener('click', () => {
      if (button.disabled || !options.canUse()) return;
      // Consult the clock again: a timer tick or another action may have changed this plot.
      if (getCropProgress(options.getFarm(), crop.id, now()).available > 0) options.onHarvest(crop.id);
    });
    return { crop, row, button,
      stock: row.querySelector<HTMLElement>('[data-farm-stock]')!,
      availableLabel: row.querySelector<HTMLElement>('[data-farm-available]')!,
      timer: row.querySelector<HTMLElement>('[data-farm-timer]')!,
      meter: row.querySelector<HTMLElement>('[data-farm-progress]')!,
      fill: row.querySelector<HTMLElement>('[data-farm-fill]')! };
  });

  const refresh = () => {
    const farm = options.getFarm(), timestamp = now(), usable = options.canUse();
    level.textContent = `Level ${farm.level} / 3`;
    capacityLabel.textContent = `Limit ${FARM_LEVELS[farm.level].capacity} per crop`;
    const upgrade = getFarmUpgrade(farm);
    upgradePanel.hidden = !upgrade;
    upgradeButton.hidden = !upgrade;
    upgradeButton.disabled = !usable || !upgrade || options.getGold() < upgrade.cost;
    upgradeTitle.textContent = upgrade ? `Level ${upgrade.nextLevel} · ${upgrade.crop.name}` : 'Maximum level';
    upgradeDetail.textContent = upgrade ? `Limit ${upgrade.capacity} → ${upgrade.nextCapacity} per crop`
      : 'All 3 crops grow automatically.';
    if (upgrade) {
      upgradeCost.textContent = `${upgrade.cost} gold`;
      upgradeButton.setAttribute('aria-label', `Upgrade farm to level ${upgrade.nextLevel} for ${upgrade.cost} gold. Unlock ${upgrade.crop.name}, limit ${upgrade.nextCapacity} per crop.`);
    }
    for (const { crop, row, button, stock, availableLabel, timer, meter, fill } of rows) {
      const { status, available, capacity, remainingSeconds, progress } = getCropProgress(farm, crop.id, timestamp);
      const percentage = Math.max(0, Math.min(100, progress * 100));
      const owned = farm.stock[crop.id];
      row.dataset.state = status;
      row.hidden = status === 'locked';
      stock.textContent = owned < 10000 ? String(owned) : stockNumber.format(owned);
      stock.parentElement!.setAttribute('aria-label', `${owned} ${crop.name} stored`);
      stock.parentElement!.title = `${owned} stored`;
      availableLabel.textContent = `${available} / ${capacity} ready`;
      button.disabled = !usable || available === 0;
      button.textContent = available ? `Collect ${available}` : 'Collect';
      timer.textContent = status === 'full' ? 'Full · collect to grow more' : `Next +1 in ${countdown(remainingSeconds)}`;
      button.setAttribute('aria-label', available ? `Collect ${available} ${crop.name}`
        : `${crop.name} growing: ${countdown(remainingSeconds)} remaining`);
      meter.setAttribute('aria-valuenow', String(Math.round(percentage)));
      meter.setAttribute('aria-valuetext', `${available} of ${capacity} ready${status === 'full' ? ', full' : `, next in ${countdown(remainingSeconds)}`}`);
      fill.style.width = `${percentage}%`;
    }
  };
  refresh();
  return { refresh };
}
