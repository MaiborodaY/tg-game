import { ELF_RECRUITS } from './recruitment-pools.ts';
import type { ElfRecruitId } from './recruitment-pools.ts';

const PORTRAITS: Readonly<Partial<Record<ElfRecruitId, string>>> = {
  pantherRider: new URL('./assets/recruitment/panther-rider.webp', import.meta.url).href,
  elfArcher: new URL('./assets/recruitment/elf-archer.webp', import.meta.url).href,
  unicorn: new URL('./assets/recruitment/unicorn.webp', import.meta.url).href,
};

const HEALER_ROLE_ICON = '<svg class="elf-healer-placeholder" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4C9 9 4 19 9 30c4 10 16 13 25 5 10-9 7-23-10-31Z" fill="#d2dfac" stroke="#6e8960" stroke-width="2"/><path d="M14 36 30 13" stroke="#88a06b" stroke-width="2"/><path d="M21 14h7v8h8v7h-8v8h-7v-8h-8v-7h8Z" fill="#f6edbc" stroke="#6b875a" stroke-width="2"/></svg>';

export function renderElfRecruitment(root: HTMLElement): void {
  // Load these three small, static portraits only when the elf roster is opened.
  // No combat sheets or new deployable unit types are needed for this preview.
  if (root.childElementCount) return;
  root.innerHTML = ELF_RECRUITS.map(recruit => {
    const portrait = PORTRAITS[recruit.id];
    const status = recruit.locked ? 'Locked' : 'Base recruit';
    const note = recruit.locked ? 'Unlocks later.' : recruit.id === 'elfHealer' ? 'Portrait coming later.' : '';
    return `<article class="recruitment-detail elf-recruitment-detail${recruit.locked ? ' is-locked' : ''}" data-elf-recruit="${recruit.id}">`
      + (portrait ? `<img src="${portrait}" alt="" width="96" height="96" loading="lazy" />` : HEALER_ROLE_ICON)
      + `<div class="recruitment-detail-copy"><div class="recruitment-detail-heading"><strong>${recruit.name}</strong><span>${status}</span></div><p>${recruit.role}</p>${note ? `<small>${note}</small>` : ''}</div></article>`;
  }).join('');
}
