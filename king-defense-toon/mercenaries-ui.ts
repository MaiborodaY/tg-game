import type { CampaignState } from './campaign-state.ts';
import type { RecruitmentPool } from './recruitment-pools.ts';
import { ELF_RECRUITS, isRecruitmentPoolUnlocked } from './recruitment-pools.ts';
import { HUMAN_RECRUITS, RECRUIT_LEVEL_CAP, getRecruitChances, getRecruitProgress,
  getHumanRecruitUnlock, getElfRecruitUnlock, recruitsNeededForLevel } from './recruitment.ts';
import { getBarracksUpgrade } from './barracks.ts';
import { getArmyCapacity } from './progression.ts';
import { UNIT_TYPE_BY_ID } from './units.ts';
import type { UnitType } from './units.ts';
import './mercenaries.css';

type MenuState = Pick<CampaignState, 'gold' | 'recruitmentPool' | 'recruitment' | 'barracks'>;
type Options = {
  panel: HTMLElement;
  getState(): MenuState;
  getPortrait(type: UnitType, level: number): string | undefined;
  canEdit(): boolean;
  onPool(pool: RecruitmentPool): void;
  onUpgrade(finish: boolean): void;
  onMarket(): void;
};
export interface MercenariesUI {
  open(): void;
  showUpgrade(): void;
  back(): boolean;
  refresh(): void;
  tick(): void;
  destroy(): void;
}
const TIERS = ['I', 'II', 'III', 'IV'];
const PORTRAITS: Partial<Record<UnitType, string>> = {
  pantherRider: new URL('./assets/recruitment/panther-rider.webp', import.meta.url).href,
  elfArcher: new URL('./assets/recruitment/elf-archer.webp', import.meta.url).href,
  elfHealer: new URL('./assets/recruitment/elf-healer.webp', import.meta.url).href,
  unicorn: new URL('./assets/recruitment/unicorn.webp', import.meta.url).href,
};
const paths = {
  back: '<path d="m12 4-6 6 6 6M6 10h11"/>',
  close: '<path d="m5 5 10 10M15 5 5 15"/>',
  lock: '<rect x="4" y="8" width="12" height="10" rx="1"/><path d="M7 8V5a3 3 0 0 1 6 0v3M10 12v2"/>',
  check: '<path d="m4 10 4 4 8-9"/>',
  clock: '<circle cx="10" cy="10" r="8"/><path d="M10 5v5h4"/>',
  leaf: '<path d="M17 3C5 1 1 10 6 14s13 0 11-11ZM3 18 13 8"/>',
  tiles: '<path d="M2 2h6v6H2zM12 2h6v6h-6zM2 12h6v6H2zM12 12h6v6h-6z"/>',
  chance: '<rect x="2" y="2" width="16" height="16" rx="2"/><path d="M6 6h.01M14 6h.01M10 10h.01M6 14h.01M14 14h.01" stroke-linecap="round"/>',
  help: '<circle cx="10" cy="10" r="8"/><path d="M7.5 7a2.5 2.5 0 1 1 3 2.5V12M10.5 15h.01"/>',
};
const icon = (name: keyof typeof paths) => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${paths[name]}</svg>`;
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const name = (type: UnitType) => UNIT_TYPE_BY_ID[type].name;
const amount = new Intl.NumberFormat('en-US');

export function getMercenaryCards(state: MenuState) {
  const elves = state.recruitmentPool === 'elves';
  const chances = getRecruitChances(state.barracks.level >= 2, state.recruitmentPool, state.recruitment, state.barracks.level);
  const ids = elves ? ELF_RECRUITS.map(recruit => recruit.id) : HUMAN_RECRUITS;
  return ids.map(type => {
    const progress = getRecruitProgress(state.recruitment, type);
    const unlock = elves ? getElfRecruitUnlock(state.recruitment, type as typeof ELF_RECRUITS[number]['id'], state.barracks.level)
      : getHumanRecruitUnlock(state.recruitment, type as typeof HUMAN_RECRUITS[number], state.barracks.level >= 2);
    const requiredTier = 'requiredBarracksLevel' in unlock ? unlock.requiredBarracksLevel : type === 'lancer' ? 2 : 1;
    const requirements: string[] = [];
    if (state.barracks.level < requiredTier) requirements.push(`Mercenaries ${TIERS[requiredTier - 1]}`);
    if (unlock.requiredRecruitType && unlock.requiredRecruitLevel
      && getRecruitProgress(state.recruitment, unlock.requiredRecruitType).level < unlock.requiredRecruitLevel) {
      requirements.push(`${name(unlock.requiredRecruitType)} Lv. ${unlock.requiredRecruitLevel}`);
    }
    return { type, name: name(type), progress, locked: !unlock.available, requirements,
      chance: chances.find(entry => entry.type === type)?.chance ?? 0 };
  });
}

function timeLabel(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return seconds >= 3600 ? `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function createMercenariesUI(options: Options): MercenariesUI {
  const { panel } = options;
  let mounted = false, detail = false, lastCards = '';
  const nodes = new Map<string, HTMLElement>();
  const node = <T extends HTMLElement = HTMLElement>(id: string) => nodes.get(id)! as T;
  const text = (id: string, value: string) => { const el = node(id); if (el.textContent !== value) el.textContent = value; };
  const hide = (id: string, value: boolean) => { const el = node(id); if (el.hidden !== value) el.hidden = value; };
  const portrait = (id: string, type: UnitType, level: number) => {
    const img = node<HTMLImageElement>(id);
    const src = options.getPortrait(type, level) ?? PORTRAITS[type];
    img.hidden = !src;
    if (src && img.getAttribute('src') !== src) img.src = src;
  };
  function mount() {
    if (mounted) return;
    // Mount on first opening. Four rows reuse the scene's existing portraits;
    // no image/DOM work is added to closed menus or to the animation loop.
    panel.innerHTML = `<div class="menu-card mercenaries-card">
      <header class="menu-heading"><div class="mercenaries-heading"><button id="mercenaries-back" class="mercenaries-back" data-merc-action="back" aria-label="Back to Mercenaries" hidden>${icon('back')}</button><h2 id="market-info-title">Mercenaries</h2><button id="mercenaries-help" class="mercenaries-help" data-merc-action="help" aria-label="About recruitment levels" aria-expanded="false" aria-controls="recruitment-info-note">${icon('help')}</button></div><button class="icon-button close-menu" type="button" data-close-overlay aria-label="Close Mercenaries">${icon('close')}</button></header>
      <div id="mercenaries-overview">
        <div class="mercenaries-toolbar"><select id="recruitment-pool" aria-label="Recruit army"><option value="humans">Human recruits</option><option id="recruitment-pool-elves" value="elves">Elven recruits</option></select><span class="barracks-upgrade-wallet"><span class="coin-icon" aria-hidden="true"></span><b id="barracks-upgrade-gold"></b></span></div>
        <div class="mercenaries-meta"><span class="recruitment-info-cost" aria-label="1 slave becomes 1 fighter">1 <span class="slave-icon" aria-hidden="true"></span> → 1 fighter</span><span class="mercenaries-chance">${icon('chance')}<span id="recruitment-chance"></span></span></div>
        <p id="recruitment-info-note" hidden>Recruitment levels rise at the Market. The counter shows recruits earned toward the next level. Connect does not count. Only unlocked fighters share the chance.</p>
        <div id="recruitment-guarantee" class="mercenaries-guarantee" hidden><span>Next: guaranteed Lancer</span><button data-merc-action="market" class="mercenaries-link">Go to Market</button></div>
        <ul id="recruitment-details" class="mercenaries-list" aria-label="Recruitment levels and progress"></ul>
        <div class="mercenaries-upgrade-summary"><div class="mercenaries-upgrade-top"><div class="mercenaries-summary-copy"><h3 id="mercenaries-next-tier"></h3><p id="mercenaries-unlock-summary"></p><div id="mercenaries-summary-requirement" class="mercenaries-summary-requirement"><span id="mercenaries-summary-lock">${icon('lock')}</span><span><span id="mercenaries-summary-name"></span> <span id="mercenaries-summary-level"></span></span></div><p id="mercenaries-summary-status" hidden></p></div><button id="mercenaries-view-upgrade" class="mercenaries-button" data-merc-action="upgrade">View upgrade</button></div></div>
      </div>
      <div id="mercenaries-upgrade-detail" hidden>
        <h3 id="mercenaries-upgrade-tier" class="mercenaries-subheading"></h3>
        <div class="mercenaries-benefits"><div><span id="mercenaries-benefit-icon">${icon('leaf')}</span><span id="mercenaries-unlock"></span><small id="mercenaries-unlock-label">Unlock</small></div><div>${icon('tiles')}<span>Army limit</span><span id="mercenaries-capacity"></span></div><small id="mercenaries-slot-note">New slot sold separately</small></div>
        <div id="mercenaries-requirements"><h3>Requirements</h3><div class="mercenaries-requirement"><img id="mercenaries-required-art" alt=""><div class="mercenaries-requirement-copy"><strong id="mercenaries-required-name"></strong><small>Recruitment level</small><small id="mercenaries-required-count"></small></div><span id="mercenaries-required-level" class="mercenaries-amount"></span><span id="mercenaries-required-symbol"></span></div><div class="mercenaries-requirement"><span class="coin-icon" aria-hidden="true"></span><span>Gold</span><span id="mercenaries-required-gold" class="mercenaries-amount"></span><span id="mercenaries-gold-symbol"></span></div></div>
        <div id="mercenaries-time" class="mercenaries-time">${icon('clock')}<span id="mercenaries-time-label">Time</span><span id="mercenaries-duration"></span></div>
        <progress id="barracks-upgrade-progress" aria-label="Upgrade progress" hidden></progress><p id="mercenaries-running-note" class="mercenaries-note" hidden>Continues offline</p>
        <button id="barracks-start-upgrade" class="mercenaries-button mercenaries-primary" data-merc-action="start">Upgrade</button>
        <button id="barracks-finish-upgrade" class="mercenaries-button mercenaries-primary" data-merc-action="finish" hidden>Finish now</button>
        <p id="barracks-upgrade-pricing" class="mercenaries-note" hidden>Finish price decreases with time.</p>
        <button id="barracks-go-market" class="mercenaries-button mercenaries-primary" data-merc-action="market" hidden>Go to Market · Lancer next</button>
        <p id="mercenaries-complete" class="mercenaries-note" hidden>Maximum level reached</p>
      </div></div>`;
    panel.querySelectorAll<HTMLElement>('[id]').forEach(el => nodes.set(el.id, el));
    panel.setAttribute('aria-labelledby', 'market-info-title');
    mounted = true;
  }
  function switchView(showDetail: boolean) {
    detail = showDetail;
    hide('mercenaries-overview', detail); hide('mercenaries-upgrade-detail', !detail); hide('mercenaries-back', !detail);
    hide('mercenaries-help', detail);
    text('market-info-title', detail ? 'Upgrade' : 'Mercenaries');
    node('market-info-title').closest<HTMLElement>('.menu-card')!.scrollTop = 0;
    tick();
  }
  function symbol(id: string, met: boolean) {
    const el = node(id), state = met ? 'check' : 'lock';
    if (el.dataset.state !== state) { el.innerHTML = icon(state); el.dataset.state = state; }
    el.classList.toggle('is-met', met); el.classList.toggle('is-missing', !met);
  }
  function tick() {
    if (!mounted || panel.hidden) return;
    const state = options.getState(), info = getBarracksUpgrade(state.barracks, state.recruitment);
    const upgrading = info.status === 'upgrading' || info.status === 'ready';
    const max = info.targetLevel === null;
    const met = info.recruitLevel >= info.requiredRecruitLevel;
    const tier = max ? 'Mercenaries IV' : `Mercenaries ${TIERS[info.level - 1]} → ${TIERS[info.targetLevel! - 1]}`;
    const reward = info.targetLevel === 2 ? 'Lancer' : info.targetLevel === 3 ? 'Elven recruits' : max ? 'All tiers unlocked' : 'Unicorn';
    text('barracks-upgrade-gold', amount.format(state.gold));
    text('mercenaries-next-tier', tier);
    text('mercenaries-unlock-summary', max ? 'Maximum level' : `Unlocks ${info.targetLevel === 3 ? 'Elves' : reward}`);
    hide('mercenaries-summary-requirement', max || upgrading);
    hide('mercenaries-summary-status', !upgrading);
    text('mercenaries-summary-status', 'Upgrade in progress');
    text('mercenaries-summary-name', name(info.requiredRecruitType));
    text('mercenaries-summary-level', `Lv. ${info.recruitLevel} / ${info.requiredRecruitLevel}`);
    symbol('mercenaries-summary-lock', met);
    // The shared economy clock calls tick; hidden detail fields and static rows
    // are left alone. Assignments below only write when a visible value changed.
    if (!detail) return;
    text('mercenaries-upgrade-tier', tier); text('mercenaries-unlock', reward);
    hide('mercenaries-unlock-label', max);
    text('mercenaries-capacity', max ? String(getArmyCapacity(info.level)) : `${getArmyCapacity(info.level)} → ${getArmyCapacity(info.targetLevel!)}`);
    hide('mercenaries-slot-note', max); hide('mercenaries-requirements', max || upgrading);
    hide('mercenaries-complete', !max); hide('mercenaries-time', max);
    if (!max && !upgrading) {
      portrait('mercenaries-required-art', info.requiredRecruitType, info.recruitLevel);
      text('mercenaries-required-name', name(info.requiredRecruitType));
      text('mercenaries-required-level', `${info.recruitLevel} / ${info.requiredRecruitLevel}`);
      const remaining = recruitsNeededForLevel(state.recruitment, info.requiredRecruitType, info.requiredRecruitLevel);
      text('mercenaries-required-count', met ? 'Ready' : `${remaining} more at Market`);
      symbol('mercenaries-required-symbol', met);
      node('mercenaries-required-level').classList.toggle('is-missing', !met);
      node('mercenaries-required-level').classList.toggle('is-met', met);
      text('mercenaries-required-gold', `${amount.format(state.gold)} / ${amount.format(info.cost)}`);
      symbol('mercenaries-gold-symbol', state.gold >= info.cost);
      node('mercenaries-required-gold').classList.toggle('is-missing', state.gold < info.cost);
      node('mercenaries-required-gold').classList.toggle('is-met', state.gold >= info.cost);
    }
    text('mercenaries-time-label', upgrading ? 'Remaining' : 'Time');
    text('mercenaries-duration', upgrading ? timeLabel(info.remainingMs) : `${info.durationMs / 3_600_000}h`);
    hide('barracks-upgrade-progress', !upgrading); hide('mercenaries-running-note', !upgrading);
    const progress = node<HTMLProgressElement>('barracks-upgrade-progress');
    if (upgrading) {
      if (progress.max !== info.durationMs) progress.max = info.durationMs;
      // Second precision is sufficient for a multi-hour UI progress bar.
      const elapsed = Math.floor((info.durationMs - info.remainingMs) / 1000) * 1000;
      if (progress.value !== elapsed) progress.value = elapsed;
    }
    const start = node<HTMLButtonElement>('barracks-start-upgrade');
    start.hidden = max || upgrading;
    start.disabled = !options.canEdit() || !info.canStart || state.gold < info.cost;
    const reason = !met ? `${name(info.requiredRecruitType)} recruitment level ${info.requiredRecruitLevel} required`
      : state.gold < info.cost ? `${info.cost - state.gold} more gold required` : `Costs ${info.cost} gold, takes ${info.durationMs / 3_600_000} hours`;
    const label = `Upgrade. ${reason}`;
    if (start.getAttribute('aria-label') !== label) start.setAttribute('aria-label', label);
    const finish = node<HTMLButtonElement>('barracks-finish-upgrade');
    finish.hidden = !upgrading;
    finish.disabled = !options.canEdit() || info.remainingMs === 0 || state.gold < info.speedUpCost;
    text('barracks-finish-upgrade', `Finish now · ${amount.format(info.speedUpCost)} gold`);
    hide('barracks-upgrade-pricing', !upgrading);
    hide('barracks-go-market', state.recruitmentPool !== 'humans' || !state.barracks.firstLancerPending);
  }
  function refresh() {
    if (panel.hidden) return;
    mount();
    const state = options.getState();
    const select = node<HTMLSelectElement>('recruitment-pool');
    if (select.value !== state.recruitmentPool) select.value = state.recruitmentPool;
    select.disabled = !options.canEdit();
    const elves = node<HTMLOptionElement>('recruitment-pool-elves');
    elves.disabled = !isRecruitmentPoolUnlocked('elves', state.barracks.level);
    text('recruitment-pool-elves', elves.disabled ? 'Elves · Mercenaries III' : 'Elven recruits');
    const cards = getMercenaryCards(state);
    const guaranteed = state.recruitmentPool === 'humans' && state.barracks.firstLancerPending;
    text('recruitment-chance', guaranteed ? 'Lancer next' : `${Number((cards.find(card => !card.locked)!.chance * 100).toFixed(1))}% each`);
    hide('recruitment-guarantee', !guaranteed);
    const html = cards.map(card => {
      const { type, progress, locked } = card;
      const src = options.getPortrait(type, progress.level) ?? PORTRAITS[type];
      const capped = progress.level >= RECRUIT_LEVEL_CAP;
      const label = `${progress.progress} of ${progress.needed} recruits toward level ${progress.level + 1}`;
      return `<li class="mercenary-recruit${locked ? ' is-locked' : ''}" data-recruit-type="${type}"${state.recruitmentPool === 'elves' ? ` data-elf-recruit="${type}"` : ''}>
        ${src ? `<img src="${escape(src)}" alt="" width="36" height="41" loading="lazy">` : '<span></span>'}
        <div class="mercenary-identity"><h3>${card.name}</h3><span class="mercenary-level">${locked ? `${icon('lock')}<span class="sr-only">Locked</span>` : `Lv. ${progress.level}`}</span></div>
        ${locked ? `<small class="mercenary-unlock">${card.requirements.join('<br>')}</small>` : capped ? '<span class="mercenary-max">Max level</span>' : `<span class="mercenary-progress" role="img" aria-label="${label}"><span class="mercenary-count">${progress.progress}/${progress.needed}</span> <span class="mercenary-next">→ Lv. ${progress.level + 1}</span></span>`}</li>`;
    }).join('');
    if (html !== lastCards) { node('recruitment-details').innerHTML = html; lastCards = html; }
    tick();
  }
  function onClick(event: Event) {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-merc-action]');
    if (!button || button.disabled) return;
    switch (button.dataset.mercAction) {
      case 'upgrade': switchView(true); node('mercenaries-back').focus({ preventScroll: true }); break;
      case 'back': switchView(false); node('mercenaries-view-upgrade').focus({ preventScroll: true }); break;
      case 'help': { const help = node('recruitment-info-note'); help.hidden = !help.hidden; button.setAttribute('aria-expanded', String(!help.hidden)); break; }
      case 'start': case 'finish': {
        options.onUpgrade(button.dataset.mercAction === 'finish');
        // A completed purchase hides its button. Never leave focus in hidden UI.
        if (button.hidden && !panel.hidden) node('mercenaries-back').focus({ preventScroll: true });
        break;
      }
      case 'market': options.onMarket(); break;
    }
  }
  function onChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.id === 'recruitment-pool' && (select.value === 'humans' || select.value === 'elves')) options.onPool(select.value);
  }
  panel.addEventListener('click', onClick); panel.addEventListener('change', onChange);
  return {
    open() { mount(); switchView(false); refresh(); },
    showUpgrade() { mount(); switchView(true); node('mercenaries-back').focus({ preventScroll: true }); },
    back() { if (!mounted || !detail) return false; switchView(false); node('mercenaries-view-upgrade').focus({ preventScroll: true }); return true; },
    refresh, tick,
    destroy() { panel.removeEventListener('click', onClick); panel.removeEventListener('change', onChange); nodes.clear(); },
  };
}
