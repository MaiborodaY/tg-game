import { HERO_NAME, HERO_MAX_LEVEL, HERO_BRANCHES, HERO_TALENTS, getHeroProgress, getHeroStats,
  getHeroTalentStatus, spendHeroTalent, resetHeroTalents } from './hero.mjs';
import { ST_KNIHOR_PORTRAIT_IMAGE_URL } from './st-knihor-art.mjs';

const ICON_PATHS = {
  light: '<path d="M12 3v18M3 12h18M6 6l12 12M6 18 18 6"/>',
  ward: '<path d="m12 3 8 3v6c0 4-5 8-8 9-3-1-8-5-8-9V6Z"/><path d="M12 7v9M8 12h8"/>',
  shared: '<path d="M7 5v10M2 10h10M17 10v10M12 15h10"/>',
  miracle: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
  shield: '<path d="m12 3 8 3v6c0 4-5 8-8 9-3-1-8-5-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  radius: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  guard: '<path d="m12 3 8 3v6c0 4-5 8-8 9-3-1-8-5-8-9V6Z"/><path d="m6 13 4-4 3 7 3-4h4"/>',
  bastion: '<path d="M4 21V4h4v4h3V4h3v4h3V4h3v17ZM9 21v-7h6v7"/>',
  hammer: '<path d="m6 4 4-2 9 9-4 4ZM11 12 3 20l2 2 8-8"/>',
  haste: '<path d="m14 2-9 12h7l-2 8 9-12h-7Z"/>',
  splash: '<path d="m8 4 3-2 8 8-4 4ZM11 11 6 16M2 19l4 3 2-3 4 2 2-4 4 2 4-3"/>',
  heaven: '<path d="m9 5 3-2 8 8-3 3ZM12 12 5 19M3 4l3 3M2 11h4M14 19v3M21 17l2 2"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] ?? ICON_PATHS.light}</svg>`;
const number = value => Number(value.toFixed(1));

export function createHeroUI({ button, panel, getHero, getBattle = () => null, onChange = () => {}, close = () => {} }) {
  let selectedId = null, lastSignature = '';
  button.classList.add('hero-trigger');
  button.innerHTML = `<img src="${ST_KNIHOR_PORTRAIT_IMAGE_URL}" alt="" draggable="false"><span class="hero-trigger-level"></span><span class="hero-trigger-points" hidden></span>`;
  panel.classList.add('menu-overlay', 'hero-overlay');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'hero-title');
  panel.innerHTML = `<div class="menu-card hero-card">
    <header class="menu-heading hero-heading"><h2 id="hero-title">${HERO_NAME}</h2><button class="icon-button close-menu" type="button" data-close-overlay aria-label="Close hero talents"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10m0-10L5 15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button></header>
    <div class="hero-overview"><img class="hero-portrait" src="${ST_KNIHOR_PORTRAIT_IMAGE_URL}" alt="${HERO_NAME}" draggable="false"><div class="hero-overview-progress"><div class="hero-level-line"><b data-hero-level></b><span data-hero-points></span></div><div class="hero-xp-track" role="progressbar" aria-label="Hero experience"><span></span></div><div class="hero-xp-label" data-hero-xp></div></div></div>
    <p class="hero-base-stats" data-hero-stats></p><p class="hero-timing" data-hero-timing></p>
    <div class="hero-tree" aria-label="Hero talent branches">${HERO_BRANCHES.map(branch => `<section class="hero-branch hero-branch-${branch.id}" aria-labelledby="hero-branch-${branch.id}"><h3 id="hero-branch-${branch.id}">${branch.name}</h3>${HERO_TALENTS.filter(talent => talent.branch === branch.id).map(talent => `<button type="button" class="hero-node${talent.capstone ? ' hero-capstone' : ''}" data-hero-talent="${talent.id}" aria-pressed="false" aria-controls="hero-talent-detail"><span class="hero-node-icon">${icon(talent.icon)}</span><span class="hero-node-name">${talent.short}</span><span class="hero-node-rank"></span><span class="hero-node-gate"></span></button>`).join('')}</section>`).join('')}</div>
    <section id="hero-talent-detail" class="hero-detail" aria-label="Selected talent"><p class="hero-detail-empty">Tap a talent to see its effect.<br>19 points · 1 final talent · reset free</p><div class="hero-detail-content" hidden><div class="hero-detail-title"><b data-hero-detail-name></b><span data-hero-detail-rank></span></div><p data-hero-detail-description></p><div class="hero-detail-action"><span data-hero-detail-gate></span><button type="button" class="hero-spend" data-hero-spend>Learn · 1 pt</button></div></div></section>
    <footer class="hero-footer"><span data-hero-reset-hint>1 point per level, from Lv. 2</span><button type="button" class="hero-reset" data-hero-reset>Reset free</button></footer>
  </div>`;

  const refs = Object.fromEntries(['level', 'points', 'xp', 'stats', 'timing', 'detail-name', 'detail-rank', 'detail-description', 'detail-gate', 'spend', 'reset', 'reset-hint']
    .map(name => [name, panel.querySelector(`[data-hero-${name}]`)]));
  const nodes = [...panel.querySelectorAll('[data-hero-talent]')];
  const xpTrack = panel.querySelector('.hero-xp-track');
  const branchName = id => HERO_BRANCHES.find(branch => branch.id === id).name;

  function statusText(talent, status) {
    switch (status.reason) {
      case 'maxed': return 'Fully learned';
      case 'level': return `Requires Lv. ${talent.level}${talent.capstone ? ` + 6 ${branchName(talent.branch)} points` : ''}`;
      case 'prerequisite': return `Requires ${HERO_TALENTS.find(node => node.id === talent.prerequisite).name} rank 1`;
      case 'capstone': return 'Only one final talent. Reset to switch.';
      case 'branch': return `Requires 6 ${branchName(talent.branch)} points (${status.branchPoints}/6)`;
      case 'points': return 'Gain a level for another point';
      default: return talent.capstone ? 'Your one final talent' : 'Costs 1 talent point';
    }
  }

  function render() {
    const hero = getHero(), progress = getHeroProgress(hero), running = getBattle()?.phase === 'running';
    const signature = JSON.stringify([hero, running, selectedId]);
    if (signature === lastSignature) return;
    lastSignature = signature;
    button.querySelector('.hero-trigger-level').textContent = `Lv.${progress.level}`;
    const badge = button.querySelector('.hero-trigger-points');
    badge.textContent = progress.availablePoints;
    badge.hidden = progress.availablePoints === 0;
    button.setAttribute('aria-label', `${HERO_NAME}, level ${progress.level}. ${progress.availablePoints} talent points available. Open hero talents`);
    button.title = `${HERO_NAME} · Lv. ${progress.level}`;
    refs.level.textContent = `Level ${progress.level} / ${HERO_MAX_LEVEL}`;
    refs.points.textContent = `${progress.availablePoints} ${progress.availablePoints === 1 ? 'point' : 'points'}`;
    refs.xp.textContent = progress.maxLevel ? 'Maximum level' : `${progress.currentXp} / ${progress.neededXp} XP`;
    xpTrack.setAttribute('aria-valuemin', '0');
    xpTrack.setAttribute('aria-valuemax', String(progress.maxLevel ? 1 : progress.neededXp));
    xpTrack.setAttribute('aria-valuenow', String(progress.maxLevel ? 1 : progress.currentXp));
    xpTrack.firstElementChild.style.width = `${progress.ratio * 100}%`;
    const stats = getHeroStats(hero);
    refs.stats.textContent = `${number(stats.maxHp)} HP · ${number(stats.damage)} hit · ${number(stats.healAmount)} heal · ${Math.round(stats.auraReduction * 100)}% aura`;
    refs.timing.textContent = running ? 'Battle continues. Talent changes apply next wave.' : 'Auto-fights, heals and protects. Returns each wave.';

    for (const node of nodes) {
      const talent = HERO_TALENTS.find(item => item.id === node.dataset.heroTalent), status = getHeroTalentStatus(hero, talent.id);
      node.classList.toggle('is-selected', selectedId === talent.id);
      node.classList.toggle('is-learned', status.rank > 0);
      node.classList.toggle('is-available', status.available);
      node.classList.toggle('is-locked', status.rank === 0 && !status.available);
      node.setAttribute('aria-pressed', String(selectedId === talent.id));
      node.setAttribute('aria-label', `${talent.name}, rank ${status.rank} of ${talent.maxRank}. ${statusText(talent, status)}`);
      node.querySelector('.hero-node-rank').textContent = `${status.rank}/${talent.maxRank}`;
      node.querySelector('.hero-node-gate').textContent = status.available ? '+' : status.reason === 'level' ? `Lv.${talent.level}` : '';
    }
    panel.querySelector('.hero-detail-empty').hidden = !!selectedId;
    panel.querySelector('.hero-detail-content').hidden = !selectedId;
    if (selectedId) {
      const talent = HERO_TALENTS.find(item => item.id === selectedId), status = getHeroTalentStatus(hero, selectedId);
      refs['detail-name'].textContent = talent.name;
      refs['detail-rank'].textContent = `${status.rank}/${talent.maxRank}`;
      refs['detail-description'].textContent = talent.description;
      refs['detail-gate'].textContent = statusText(talent, status);
      refs.spend.textContent = status.reason === 'maxed' ? 'Learned' : `${status.rank ? 'Upgrade' : 'Learn'} · 1 pt`;
      refs.spend.disabled = !status.available;
    }
    refs.reset.disabled = running || progress.spentPoints === 0;
    refs['reset-hint'].textContent = running ? 'Reset between waves' : '1 point per level, from Lv. 2';
  }

  function onClick(event) {
    if (event.target === panel || event.target.closest('[data-close-overlay]')) {
      event.stopPropagation();
      close();
      return;
    }
    const talent = event.target.closest('[data-hero-talent]');
    if (talent) { selectedId = talent.dataset.heroTalent; render(); return; }
    if (event.target.closest('[data-hero-spend]') && selectedId) {
      const result = spendHeroTalent(getHero(), selectedId);
      if (result.spent) onChange({ type: 'talent', id: selectedId, ...result });
      render();
    }
    if (event.target.closest('[data-hero-reset]') && getBattle()?.phase !== 'running') {
      const result = resetHeroTalents(getHero());
      if (result.reset) onChange({ type: 'reset', ...result });
      render();
    }
  }
  panel.addEventListener('click', onClick);
  render();
  return { render, destroy() { panel.removeEventListener('click', onClick); } };
}
