import { GOBLIN_CAVE_LEVELS, getDungeonLevel, isDungeonLevelUnlocked } from './dungeons.ts';
import type { DungeonLevel, DungeonProgress } from './dungeons.ts';

const CAVE_ICON = new URL('./assets/dungeons/cave-icon.webp', import.meta.url).href;
const backIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="miter"/></svg>';
const lockIcon = '<svg viewBox="0 0 20 24" aria-hidden="true"><path d="M5 10V7a5 5 0 0 1 10 0v3M3 10h14v12H3Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 14v4" stroke="currentColor" stroke-width="2"/></svg>';
const caveIcon = (className = '') => `<img class="dungeon-cave-icon ${className}" src="${CAVE_ICON}" width="128" height="128" alt="" />`;
const route = () => '<ol class="dungeon-route" aria-label="Three waves; final boss on wave three"><li><b>1</b><span>Wave 1</span></li><li><b>2</b><span>Wave 2</span></li><li><b>♛</b><span>Boss · Wave 3</span></li></ol>';
const art = (level: DungeonLevel, className = '') => `<span class="dungeon-art dungeon-art-${level.tier} ${className}" role="img" aria-label="${level.boss} in the Goblin Cave"></span>`;
const requirement = (level: DungeonLevel, unlocked: boolean) => unlocked
  ? `✓ Round 1-${level.unlockRound} completed`
  : `Complete all 10 waves of round 1-${level.unlockRound}`;

export interface DungeonsUI {
  open(): void;
  close(): void;
  refresh(): void;
  focus(): void;
  destroy(): void;
}

export function createDungeonsUI({ root, getProgress, getCampaignStatus, onExit, onEnter }: {
  root: HTMLElement;
  getProgress: () => DungeonProgress;
  getCampaignStatus: () => string;
  onExit: () => void;
  onEnter: (level: DungeonLevel) => void;
}): DungeonsUI {
  let opened = false;
  let rulesOpen = false;
  let signature = '';
  let rulesOpener: HTMLElement | null = null;

  function focus() {
    root.querySelector<HTMLElement>(rulesOpen ? '[data-dungeon-action="close-rules"]' : '[data-dungeon-action="back"]')?.focus({ preventScroll: true });
  }

  function card(level: DungeonLevel, progress: DungeonProgress): string {
    const unlocked = isDungeonLevelUnlocked(level, progress);
    return `<article class="dungeon-level-card ${unlocked ? 'is-unlocked' : 'is-locked'}" aria-label="Goblin Cave ${level.numeral}: ${level.boss}">
      ${art(level)}<span class="dungeon-card-copy"><span class="dungeon-tier">Level ${level.numeral}</span>
      <strong>${level.boss}</strong><span class="dungeon-requirement">${requirement(level, unlocked)}</span>
      <span class="dungeon-card-reward-label">Full-run rewards · coming later</span>
      <span class="dungeon-card-rewards"><span><span class="coin-icon" aria-hidden="true"></span>${level.firstClearReward.gold} gold</span>
      <span><span class="slave-icon" aria-hidden="true"></span>${level.firstClearReward.slaves} slaves</span></span>
      <button type="button" data-dungeon-level="${level.id}" class="dungeon-card-action" ${unlocked ? '' : 'disabled'}
      aria-label="${unlocked ? 'Enter' : 'Locked'} Goblin Cave ${level.numeral}">${unlocked ? 'Enter' : `${lockIcon} Locked`}</button></span></article>`;
  }

  function render(force = false) {
    if (!opened) return;
    const progress = getProgress();
    const nextSignature = GOBLIN_CAVE_LEVELS.map(level => Number(isDungeonLevelUnlocked(level, progress))).join('');
    // Income and combat refresh often. Rebuild only when the view/unlocks change,
    // retaining scroll, focus and the rules dialog while the main battle advances.
    if (force || signature !== nextSignature) {
      const focusedLevel = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-dungeon-level]')?.dataset.dungeonLevel;
      const oldScroll = root.querySelector<HTMLElement>('.dungeon-scroll')?.scrollTop ?? 0;
      const hadFocus = root.contains(document.activeElement);
      signature = nextSignature;
      root.innerHTML = `<div class="dungeon-shell"><div class="dungeon-page">
        <header class="dungeon-heading"><button type="button" class="dungeon-icon-button" data-dungeon-action="back" aria-label="Back to main game">${backIcon}</button>
        <h2 id="dungeons-title">Dungeons</h2>
        <button type="button" class="dungeon-icon-button dungeon-info-button" data-dungeon-action="rules" aria-label="Dungeon rules" aria-haspopup="dialog" aria-controls="dungeon-rules">i</button></header>
        <div class="dungeon-scroll"><div class="dungeon-intro">${caveIcon()}<div><h3>Goblin Cave</h3><p>Choose a level</p></div></div>
        <div class="dungeon-level-list">${GOBLIN_CAVE_LEVELS.map(level => card(level, progress)).join('')}</div>
        <p class="dungeon-catalogue-note">Wave 1 is playable now.<br><span>Full runs, bosses and rewards are coming later.</span></p></div>
        <footer class="dungeon-footer"><span aria-hidden="true"></span><p data-dungeon-campaign-status></p></footer></div>
        <section id="dungeon-rules" class="dungeon-rules-overlay" role="dialog" aria-modal="true" aria-labelledby="dungeon-rules-title" hidden>
        <div class="dungeon-rules-card"><header><h3 id="dungeon-rules-title">Dungeon rules</h3><button type="button" class="dungeon-icon-button" data-dungeon-action="close-rules" aria-label="Close dungeon rules">×</button></header>
        ${caveIcon('dungeon-rules-art')}${route()}<ul class="dungeon-rules-list"><li><b aria-hidden="true">⚔</b>3 waves per run</li>
        <li><b aria-hidden="true">♛</b>Final boss on wave 3</li><li><b aria-hidden="true">♡</b>No recovery between waves</li>
        <li><b aria-hidden="true">†</b>Fallen units stay out for the run</li></ul>
        <p class="dungeon-healing">Healing during combat still works.</p><p class="dungeon-rules-note">Full runs will follow these rules. For now, play the first wave with four guards. Bosses and reward collection come later.<br><br>Your campaign pauses while inside the cave. Your main army is kept safe. Leaving or reloading ends this run.</p>
        <button type="button" class="dungeon-acknowledge" data-dungeon-action="close-rules">Got it</button></div></section></div>`;
      root.querySelector<HTMLElement>('.dungeon-scroll')!.scrollTop = force ? 0 : oldScroll;
      syncRules();
      if (hadFocus) {
        const replacement = !rulesOpen && focusedLevel ? root.querySelector<HTMLElement>(`[data-dungeon-level="${focusedLevel}"]`) : null;
        if (replacement) replacement.focus({ preventScroll: true }); else focus();
      }
    }
    const status = root.querySelector<HTMLElement>('[data-dungeon-campaign-status]')!;
    const text = getCampaignStatus();
    if (status.textContent !== text) status.textContent = text;
  }

  function syncRules() {
    root.querySelector<HTMLElement>('.dungeon-page')!.inert = rulesOpen;
    root.querySelector<HTMLElement>('#dungeon-rules')!.hidden = !rulesOpen;
    root.querySelector<HTMLElement>('[data-dungeon-action="rules"]')!.setAttribute('aria-expanded', String(rulesOpen));
  }

  function closeRules() {
    rulesOpen = false; syncRules();
    const target = rulesOpener?.isConnected ? rulesOpener : root.querySelector<HTMLElement>('[data-dungeon-action="rules"]');
    target?.focus({ preventScroll: true }); rulesOpener = null;
  }

  function back() {
    if (rulesOpen) { closeRules(); return; }
    onExit();
  }

  function onClick(event: MouseEvent) {
    if (!opened || root.inert) return;
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || !root.contains(button)) return;
    if (button.dataset.dungeonAction === 'close-rules') { closeRules(); return; }
    if (rulesOpen) return;
    if (button.dataset.dungeonAction === 'back') { back(); return; }
    if (button.dataset.dungeonAction === 'rules') {
      rulesOpener = button; rulesOpen = true; syncRules(); focus(); return;
    }
    const level = getDungeonLevel(button.dataset.dungeonLevel ?? '');
    if (level && !button.disabled && isDungeonLevelUnlocked(level, getProgress())) onEnter(level);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!opened || root.inert) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); back(); return; }
    if (event.key !== 'Tab') return;
    const container = rulesOpen ? root.querySelector<HTMLElement>('#dungeon-rules')! : root;
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
      .filter(button => button.getClientRects().length && !button.closest('[inert]'));
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);
  return {
    open() { opened = true; rulesOpen = false; render(true); focus(); },
    close() { opened = false; rulesOpen = false; rulesOpener = null; },
    refresh: () => render(), focus,
    destroy() { opened = false; root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKeyDown); root.replaceChildren(); },
  };
}
