import { HERO_NAME, HERO_MAX_LEVEL, HERO_BRANCHES, HERO_TALENTS, getHeroProgress, getHeroStats,
  getHeroTalentStatus, getHeroTalentEffect } from './hero.ts';
import { ST_KNIHOR_PORTRAIT_IMAGE_URL } from './st-knihor-art.ts';
import { talentArtStyle } from './talent-art.ts';
import type { BranchId, HeroState, HeroTalentDefinition, HeroTalentStatus, TalentId,
  SpendHeroTalentResult, ResetHeroTalentsResult } from './hero.ts';
import type { Battle } from './combat-types.ts';

export type HeroUIChange =
  | ({ type: 'talent'; id: TalentId } & Extract<SpendHeroTalentResult, { spent: true }>)
  | ({ type: 'reset' } & ResetHeroTalentsResult);
export interface HeroUIOptions {
  button: HTMLElement;
  panel: HTMLElement;
  getHero: () => HeroState;
  getBattle?: () => Pick<Battle, 'phase'> | null;
  onLearn: (id: TalentId) => SpendHeroTalentResult | null;
  onReset: () => ResetHeroTalentsResult | null;
  onChange?: (change: HeroUIChange) => void;
  close?: () => void;
}
export interface HeroUI {
  render(): void;
  destroy(): void;
}

const lock = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 5V3.5a2.5 2.5 0 0 1 5 0V5M2.5 5h7v6h-7Z" fill="#ddd2b0" stroke="#686651" stroke-width="1.5"/><path d="M6 7v2" stroke="#686651"/></svg>';
const number = (value: number) => Number(value.toFixed(1));
const ROW_Y = [24, 96, 154, 212] as const;
const columnX = (column: HeroTalentDefinition['column']) => 25 + column * 25;
const rootLabel = (branch: BranchId) => ({ light: 'Heal', protection: 'Aura', judgement: 'Hammer' })[branch];

function branchMarkup(branch: typeof HERO_BRANCHES[number]) {
  const talents = HERO_TALENTS.filter(talent => talent.branch === branch.id);
  // Edges use the same prerequisites as learning, so the picture and progression stay in sync.
  const links = talents.flatMap(talent => talent.prerequisites.map(id => {
    const parent = HERO_TALENTS.find(node => node.id === id)!;
    const startX = columnX(parent.column), endX = columnX(talent.column);
    const startY = ROW_Y[parent.row] + (parent.row === 0 ? 36 : 24), endY = ROW_Y[talent.row] - 25;
    return `<path data-hero-link="${talent.id}" data-hero-parent="${id}" d="M${startX} ${startY} L${endX} ${endY} m-4 -5 4 5 4-5"/>`;
  })).join('');
  return `<section class="hero-branch hero-branch-${branch.id}" aria-labelledby="hero-branch-${branch.id}">
    <h3 id="hero-branch-${branch.id}">${branch.name}<span data-hero-branch="${branch.id}"></span></h3>
    <div class="hero-branch-nodes"><svg class="hero-connections" viewBox="0 0 100 240" preserveAspectRatio="none" aria-hidden="true">${links}</svg>
      ${talents.map(talent => `<button type="button" class="hero-node${talent.capstone ? ' hero-capstone' : ''}${talent.row === 0 ? ' hero-root' : ''}" data-hero-talent="${talent.id}" style="left:${columnX(talent.column)}%;top:${ROW_Y[talent.row]}px" aria-pressed="false" aria-controls="hero-talent-detail"><span class="hero-node-icon"><span class="hero-talent-art" style="${talentArtStyle(talent.id)}" aria-hidden="true"></span></span><span class="hero-node-rank"></span><span class="hero-node-gate" aria-hidden="true">${lock}</span>${talent.row === 0 ? `<span class="hero-node-name">${rootLabel(branch.id)}</span>` : ''}</button>`).join('')}
    </div></section>`;
}

export function createHeroUI({ button, panel, getHero, getBattle = () => null, onLearn, onReset, onChange = () => {}, close = () => {} }: HeroUIOptions): HeroUI {
  let selectedId: TalentId | null = HERO_TALENTS.find(talent => talent.row === 0 && getHeroTalentStatus(getHero(), talent.id).available)?.id ?? 'heal_unlock';
  let lastSignature = '';
  button.classList.add('hero-trigger');
  button.innerHTML = `<img src="${ST_KNIHOR_PORTRAIT_IMAGE_URL}" alt="" draggable="false"><span class="hero-trigger-level"></span><span class="hero-trigger-points" hidden></span>`;
  panel.classList.add('menu-overlay', 'hero-overlay');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'hero-title');
  panel.innerHTML = `<div class="menu-card hero-card">
    <header class="menu-heading hero-heading"><img class="hero-portrait" src="${ST_KNIHOR_PORTRAIT_IMAGE_URL}" alt="" draggable="false"><div class="hero-heading-label"><h2 id="hero-title">${HERO_NAME}</h2><div class="hero-level-line"><b data-hero-level></b><span data-hero-points></span></div></div><button class="icon-button close-menu" type="button" data-close-overlay aria-label="Close hero talents"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10m0-10L5 15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button></header>
    <div class="hero-overview"><div class="hero-xp-track" role="progressbar" aria-label="Hero experience"><span></span></div><span class="hero-xp-label" data-hero-xp></span></div>
    <p class="hero-base-stats" data-hero-stats></p><p class="hero-timing" data-hero-timing></p>
    <div class="hero-tree" aria-label="Hero talent branches">${HERO_BRANCHES.map(branchMarkup).join('')}</div>
    <section id="hero-talent-detail" class="hero-detail" aria-label="Selected talent" aria-live="polite"><p class="hero-detail-empty">Choose a talent to see its effect.<br><span>Start with Heal, Aura or Hammer.</span></p><div class="hero-detail-content" hidden><div class="hero-detail-title"><span class="hero-detail-picture"><span class="hero-talent-art" data-hero-detail-art aria-hidden="true"></span></span><div class="hero-detail-title-copy"><b data-hero-detail-name></b><span data-hero-detail-rank></span></div></div><p data-hero-detail-description></p><p class="hero-detail-effect" data-hero-detail-effect></p><div class="hero-detail-action"><span data-hero-detail-gate></span><button type="button" class="hero-spend" data-hero-spend>Learn · 1 pt</button></div></div></section>
    <footer class="hero-footer"><span data-hero-reset-hint>1 point per level, from Lv. 2</span><button type="button" class="hero-reset" data-hero-reset>Reset free</button></footer>
  </div>`;

  type TextRef = 'level' | 'points' | 'xp' | 'stats' | 'timing' | 'detail-name' | 'detail-rank'
    | 'detail-description' | 'detail-effect' | 'detail-gate' | 'reset-hint';
  const refs = Object.fromEntries(['level', 'points', 'xp', 'stats', 'timing', 'detail-name', 'detail-rank', 'detail-art', 'detail-description', 'detail-effect', 'detail-gate', 'spend', 'reset', 'reset-hint']
    .map(name => [name, panel.querySelector(`[data-hero-${name}]`)])) as Record<TextRef | 'detail-art', HTMLElement> & Record<'spend' | 'reset', HTMLButtonElement>;
  const nodes = [...panel.querySelectorAll<HTMLElement>('[data-hero-talent]')];
  const links = [...panel.querySelectorAll<SVGPathElement>('[data-hero-link]')];
  const branchLabels = [...panel.querySelectorAll<HTMLElement>('[data-hero-branch]')];
  const xpTrack = panel.querySelector<HTMLElement>('.hero-xp-track')!;
  const branchName = (id: BranchId) => HERO_BRANCHES.find(branch => branch.id === id)!.name;

  function statusText(talent: HeroTalentDefinition, status: HeroTalentStatus, hero: HeroState) {
    switch (status.reason) {
      case 'maxed': return 'Fully learned';
      case 'level': return `Requires Lv. ${talent.level}${talent.branchRequired ? ` + ${talent.branchRequired} ${branchName(talent.branch)} points` : ''}`;
      case 'prerequisite': return `Requires ${talent.prerequisites.filter(id => !hero.talents[id]).map(id => HERO_TALENTS.find(node => node.id === id)!.name).join(' + ')}`;
      case 'capstone': return 'Only one final talent. Reset to switch.';
      case 'branch': return `Requires ${talent.branchRequired} ${branchName(talent.branch)} points (${status.branchPoints - status.rank}/${talent.branchRequired})`;
      case 'points': return 'Gain a level for another point';
      default: return talent.capstone ? 'Final talent · costs 1 point' : 'Costs 1 talent point';
    }
  }

  function render() {
    const hero = getHero(), progress = getHeroProgress(hero), running = getBattle()?.phase === 'running';
    const signature = JSON.stringify([hero, running, selectedId]);
    if (signature === lastSignature) return;
    lastSignature = signature;
    button.querySelector<HTMLElement>('.hero-trigger-level')!.textContent = `Lv.${progress.level}`;
    const badge = button.querySelector<HTMLElement>('.hero-trigger-points')!;
    badge.textContent = String(progress.availablePoints);
    badge.hidden = progress.availablePoints === 0;
    button.setAttribute('aria-label', `${HERO_NAME}, level ${progress.level}. ${progress.availablePoints} talent points available. Open hero talents`);
    button.title = `${HERO_NAME} · Lv. ${progress.level}`;
    refs.level.textContent = `Level ${progress.level} / ${HERO_MAX_LEVEL}`;
    refs.points.textContent = `${progress.availablePoints} ${progress.availablePoints === 1 ? 'point' : 'points'}`;
    refs.xp.textContent = progress.maxLevel ? 'Maximum level' : `${progress.currentXp} / ${progress.neededXp} XP`;
    xpTrack.setAttribute('aria-valuemin', '0');
    xpTrack.setAttribute('aria-valuemax', String(progress.maxLevel ? 1 : progress.neededXp));
    xpTrack.setAttribute('aria-valuenow', String(progress.maxLevel ? 1 : progress.currentXp));
    (xpTrack.firstElementChild as HTMLElement).style.width = `${progress.ratio * 100}%`;
    const stats = getHeroStats(hero);
    refs.stats.textContent = [`${number(stats.maxHp)} HP`, `${number(stats.damage)} hit`,
      ...(stats.healUnlocked ? [`${number(stats.healAmount)} heal`] : []),
      ...(stats.auraUnlocked ? [`${Math.round(stats.auraReduction * 100)}% aura`] : []),
      ...(stats.hammerUnlocked ? [`${number(stats.hammerDamage)} hammer`] : [])].join(' · ');
    refs.timing.textContent = running ? 'Battle continues. Changes apply next wave.' : 'Learn a branch’s first talent to unlock its skill.';

    for (const label of branchLabels) {
      const branch = label.dataset.heroBranch;
      const spent = HERO_TALENTS.filter(talent => talent.branch === branch).reduce((sum, talent) => sum + hero.talents[talent.id], 0);
      label.textContent = `${spent} ${spent === 1 ? 'pt' : 'pts'}`;
    }
    for (const link of links) {
      const target = link.dataset.heroLink as TalentId, parent = link.dataset.heroParent as TalentId;
      link.classList.toggle('is-learned', hero.talents[parent] > 0 && hero.talents[target] > 0);
      link.classList.toggle('is-ready', hero.talents[parent] > 0 && getHeroTalentStatus(hero, target).available);
    }
    for (const node of nodes) {
      const talent = HERO_TALENTS.find(item => item.id === node.dataset.heroTalent)!, status = getHeroTalentStatus(hero, talent.id);
      const locked = status.rank === 0 && !status.available;
      node.classList.toggle('is-selected', selectedId === talent.id);
      node.classList.toggle('is-learned', status.rank > 0);
      node.classList.toggle('is-available', status.available);
      node.classList.toggle('is-locked', locked);
      node.setAttribute('aria-pressed', String(selectedId === talent.id));
      node.setAttribute('aria-label', `${talent.name}, rank ${status.rank} of ${talent.maxRank}. ${statusText(talent, status, hero)}`);
      node.querySelector<HTMLElement>('.hero-node-rank')!.textContent = `${status.rank}/${talent.maxRank}`;
      node.querySelector<HTMLElement>('.hero-node-gate')!.hidden = !locked;
    }
    panel.querySelector<HTMLElement>('.hero-detail-empty')!.hidden = !!selectedId;
    panel.querySelector<HTMLElement>('.hero-detail-content')!.hidden = !selectedId;
    if (selectedId) {
      const talent = HERO_TALENTS.find(item => item.id === selectedId)!, status = getHeroTalentStatus(hero, selectedId);
      refs['detail-name'].textContent = talent.name;
      refs['detail-rank'].textContent = `${status.rank}/${talent.maxRank}`;
      refs['detail-art'].setAttribute('style', talentArtStyle(selectedId));
      refs['detail-description'].textContent = talent.description;
      const current = getHeroTalentEffect(hero, selectedId, status.rank);
      refs['detail-effect'].textContent = status.rank < talent.maxRank ? `${current} → ${getHeroTalentEffect(hero, selectedId, status.rank + 1)}` : current;
      refs['detail-gate'].textContent = statusText(talent, status, hero);
      refs.spend.textContent = status.reason === 'maxed' ? 'Learned' : `${status.rank ? 'Upgrade' : 'Learn'} · 1 pt`;
      refs.spend.disabled = !status.available;
    }
    refs.reset.disabled = running || progress.spentPoints === 0;
    refs['reset-hint'].textContent = running ? 'Reset between waves' : '1 point per level, from Lv. 2';
  }

  function onClick(event: MouseEvent) {
    if (event.target === panel || (event.target as Element).closest('[data-close-overlay]')) {
      event.stopPropagation();
      close();
      return;
    }
    const talent = (event.target as Element).closest<HTMLElement>('[data-hero-talent]');
    if (talent) { selectedId = talent.dataset.heroTalent as TalentId; render(); return; }
    if ((event.target as Element).closest('[data-hero-spend]') && selectedId) {
      const result = onLearn(selectedId);
      if (result?.spent) onChange({ type: 'talent', id: selectedId, ...result });
      render();
    }
    if ((event.target as Element).closest('[data-hero-reset]') && getBattle()?.phase !== 'running') {
      const result = onReset();
      if (result?.reset) onChange({ type: 'reset', ...result });
      render();
    }
  }
  panel.addEventListener('click', onClick);
  render();
  return { render, destroy() { panel.removeEventListener('click', onClick); } };
}
