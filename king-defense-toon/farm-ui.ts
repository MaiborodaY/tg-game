import { CROPS, getCropProgress } from './farm.ts';
import type { CropId, FarmState } from './farm.ts';

interface FarmUIOptions {
  root: HTMLElement;
  getFarm: () => FarmState;
  canUse: () => boolean;
  onPlant: (crop: CropId) => void;
  onHarvest: (crop: CropId) => void;
  getNow?: () => number;
}

export interface FarmUI { refresh: () => void }

const CROP_ICONS: Record<CropId, string> = {
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
  // Timer refreshes change existing nodes, so a focused Plant/Harvest control stays put.
  options.root.innerHTML = CROPS.map(crop =>
    `<div class="farm-row" data-farm-row="${crop.id}" data-state="empty">`
    + `<svg class="farm-crop-icon" viewBox="0 0 36 36" aria-hidden="true">${CROP_ICONS[crop.id]}</svg>`
    + `<div class="farm-copy"><div class="farm-crop-heading"><strong>${crop.name}</strong>`
    + '<span class="farm-stock">Owned <b data-farm-stock>0</b></span></div>'
    + `<div class="farm-meter" data-farm-progress role="progressbar" aria-label="${crop.name} growth" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-farm-fill></span></div>`
    + '<small class="farm-timer" data-farm-timer></small></div>'
    + `<button class="battle-button farm-action" data-farm-action="${crop.id}" type="button">Plant</button></div>`
  ).join('');

  const rows = CROPS.map(crop => {
    const row = options.root.querySelector<HTMLElement>(`[data-farm-row="${crop.id}"]`)!;
    const button = row.querySelector<HTMLButtonElement>('[data-farm-action]')!;
    button.addEventListener('click', () => {
      if (button.disabled || !options.canUse()) return;
      // Consult the clock again: a timer tick or another action may have changed this plot.
      const { status } = getCropProgress(options.getFarm(), crop.id, now());
      if (status === 'empty') options.onPlant(crop.id);
      else if (status === 'ready') options.onHarvest(crop.id);
    });
    return { crop, row, button,
      stock: row.querySelector<HTMLElement>('[data-farm-stock]')!,
      timer: row.querySelector<HTMLElement>('[data-farm-timer]')!,
      meter: row.querySelector<HTMLElement>('[data-farm-progress]')!,
      fill: row.querySelector<HTMLElement>('[data-farm-fill]')! };
  });

  const refresh = () => {
    const farm = options.getFarm(), timestamp = now(), usable = options.canUse();
    for (const { crop, row, button, stock, timer, meter, fill } of rows) {
      const { status, remainingSeconds, progress } = getCropProgress(farm, crop.id, timestamp);
      const percentage = Math.max(0, Math.min(100, progress * 100));
      const owned = farm.stock[crop.id];
      row.dataset.state = status;
      stock.textContent = owned < 10000 ? String(owned) : stockNumber.format(owned);
      stock.parentElement!.setAttribute('aria-label', `${owned} ${crop.name} stored`);
      stock.parentElement!.title = `${owned} stored`;
      button.disabled = !usable || status === 'growing';
      button.textContent = status === 'empty' ? 'Plant' : status === 'ready' ? 'Harvest' : 'Growing';
      const duration = `${crop.growSeconds / 60} min`;
      timer.textContent = status === 'empty' ? `${duration} · +${crop.yield}`
        : status === 'ready' ? `Ready · +${crop.yield}` : `${countdown(remainingSeconds)} left`;
      button.setAttribute('aria-label', status === 'empty' ? `Plant ${crop.name} for free. Ready in ${duration}.`
        : status === 'ready' ? `Harvest ${crop.yield} ${crop.name}` : `${crop.name} growing: ${countdown(remainingSeconds)} remaining`);
      meter.setAttribute('aria-valuenow', String(Math.round(percentage)));
      meter.setAttribute('aria-valuetext', status === 'empty' ? 'Empty plot'
        : status === 'ready' ? 'Ready to harvest' : `${countdown(remainingSeconds)} remaining`);
      fill.style.width = `${percentage}%`;
    }
  };
  refresh();
  return { refresh };
}
