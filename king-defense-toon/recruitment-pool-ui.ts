import { ELF_RECRUITS } from './recruitment-pools.ts';
import type { ElfRecruitId } from './recruitment-pools.ts';

const PORTRAITS: Readonly<Record<ElfRecruitId, string>> = {
  pantherRider: new URL('./assets/recruitment/panther-rider.webp', import.meta.url).href,
  elfArcher: new URL('./assets/recruitment/elf-archer.webp', import.meta.url).href,
  elfHealer: new URL('./assets/recruitment/elf-healer.webp', import.meta.url).href,
  unicorn: new URL('./assets/recruitment/unicorn.webp', import.meta.url).href,
};

export function renderElfRecruitment(root: HTMLElement, rider: {
  portrait?: string;
  progressMarkup: string;
  chanceLabel: string;
}): void {
  // Keep preview portraits mounted during economy ticks; only the playable
  // fighter's recruitment progress and rank portrait need to change.
  if (!root.childElementCount) root.innerHTML = ELF_RECRUITS.map(recruit => {
    const portrait = PORTRAITS[recruit.id];
    const status = recruit.playable ? rider.chanceLabel : recruit.locked ? 'Locked' : 'Coming soon';
    const note = recruit.locked ? 'Unlocks later.' : recruit.playable ? '' : 'Not in the Market yet.';
    return `<article class="recruitment-detail elf-recruitment-detail${recruit.locked ? ' is-locked' : ''}" data-elf-recruit="${recruit.id}">`
      + `<img src="${portrait}" alt="" width="96" height="96" loading="lazy" />`
      + `<div class="recruitment-detail-copy"><div class="recruitment-detail-heading"><strong>${recruit.name}</strong><span>${status}</span></div><p>${recruit.role}</p>${note ? `<small>${note}</small>` : ''}</div></article>`;
  }).join('');
  const card = root.querySelector<HTMLElement>('[data-elf-recruit="pantherRider"]')!;
  const portrait = card.querySelector<HTMLImageElement>('img')!;
  const src = rider.portrait ?? PORTRAITS.pantherRider;
  if (portrait.getAttribute('src') !== src) portrait.src = src;
  card.querySelector<HTMLElement>('.recruitment-detail-copy')!.innerHTML =
    `<div class="recruitment-detail-heading"><strong>Panther Rider</strong><span>${rider.chanceLabel}</span></div>`
    + rider.progressMarkup;
}
