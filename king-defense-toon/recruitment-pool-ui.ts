import { ELF_RECRUITS } from './recruitment-pools.ts';
import type { ElfRecruitId } from './recruitment-pools.ts';

const PORTRAITS: Readonly<Record<ElfRecruitId, string>> = {
  pantherRider: new URL('./assets/recruitment/panther-rider.webp', import.meta.url).href,
  elfArcher: new URL('./assets/recruitment/elf-archer.webp', import.meta.url).href,
  elfHealer: new URL('./assets/recruitment/elf-healer.webp', import.meta.url).href,
  unicorn: new URL('./assets/recruitment/unicorn.webp', import.meta.url).href,
};

export function renderElfRecruitment(root: HTMLElement, fighters: readonly {
  id: ElfRecruitId;
  locked: boolean;
  portrait?: string;
  progressMarkup: string;
  chanceLabel: string;
}[]): void {
  // Keep portraits and the upgrade controls mounted during economy ticks so
  // progress updates cannot replace a focused construction button.
  if (!root.childElementCount) root.innerHTML = ELF_RECRUITS.map(recruit => {
    const portrait = PORTRAITS[recruit.id];
    return `<article class="recruitment-detail elf-recruitment-detail" data-elf-recruit="${recruit.id}">`
      + `<img src="${portrait}" alt="" width="96" height="96" loading="lazy" />`
      + '<div class="recruitment-detail-copy"><div data-elf-content></div><div data-elf-upgrade-slot></div></div></article>';
  }).join('');
  for (const recruit of ELF_RECRUITS) {
    const fighter = fighters.find(entry => entry.id === recruit.id);
    if (!fighter) continue;
    const card = root.querySelector<HTMLElement>(`[data-elf-recruit="${recruit.id}"]`)!;
    card.classList.toggle('is-locked', fighter.locked);
    const portrait = card.querySelector<HTMLImageElement>('img')!;
    const src = fighter.portrait ?? PORTRAITS[recruit.id];
    if (portrait.getAttribute('src') !== src) portrait.src = src;
    card.querySelector<HTMLElement>('[data-elf-content]')!.innerHTML =
      `<div class="recruitment-detail-heading"><strong>${recruit.name}</strong><span>${fighter.chanceLabel}</span></div>`
      + fighter.progressMarkup;
  }
}
