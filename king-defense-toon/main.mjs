import { createScene } from './scene.mjs';
import { UNIT_TYPES } from './units.mjs';
import { BATTLE_VIEW, FORMATION_VIEW } from './field.mjs';
import { createBattle, updateBattle } from './combat.mjs';
import { WAVE_DEFINITIONS, WAVES_PER_ROUND, ROUNDS_PER_LEVEL, CAMPAIGN_VERSION, LEVEL_COUNT, getRoundWaves, getWaveDefinition } from './waves.mjs';
import { setupTelegramAdapter } from './telegram.mjs';
import { createBattleAudio } from './audio.mjs';
import { createLevelMusic } from './music.mjs';
import { battleFrameDelta, nextBattleSpeed } from './battle-speed.mjs';
import { createFrameRateMeter } from './fps.mjs';
import { createEconomy, treasuryRate, treasuryUpgradeCost, accrueTreasury, checkpointTreasury, claimOfflineTreasury, TREASURY_OFFLINE_LIMIT_SECONDS, upgradeTreasury, rollSlaveDrop, progressionAfterBattle, advanceCaptureClock, CAPTURE_COOLDOWN, STARTER_CAPTURES, capturePityKills, captureDropChance } from './economy.mjs';
import { MARKET_BUILD_COST, MARKET_PRODUCTION_SECONDS, MARKET_OFFLINE_LIMIT_SECONDS, buildMarket, accrueMarket, checkpointMarket, claimOfflineMarket } from './market.mjs';
import { SAVE_KEY, STARTING_GOLD, createProgression, migrateCampaignSave, cellKey, nextCellCost, unlockCell, claimFirstClear } from './progression.mjs';
import { RECRUIT_COST, RECRUIT_LEVEL_CAP, createRecruitment, normalizeUnitLevel, getRecruitProgress, getUnitStats, getRecruitChances, receiveRecruit } from './recruitment.mjs';
import { STARTING_SLAVES, SELL_PRICE, createBarracks, getBarracksUpgrade, completeBarracksUpgrade, startBarracksUpgrade, speedUpBarracks, consumeFirstLancerGuarantee } from './barracks.mjs';
import { getMergeResult } from './unit-merging.mjs';
import { setupUnitDrag } from './unit-drag.mjs';
import { createHero, awardHeroXp } from './hero.mjs';
import { createHeroUI } from './hero-ui.mjs';
import './style.css';
import './hero.css';

const byId = id => document.getElementById(id);
const frameRateMeter = createFrameRateMeter();
const fpsLabel = byId('fps-counter');

function fitPortraitPreview() {
  // Desktop panels show the entire phone at one scale instead of flattening only the battlefield.
  const scale = !document.documentElement.classList.contains('is-telegram') && window.innerWidth >= 600
    ? Math.min(420 / 390, (window.innerWidth - 40) / 390, (window.innerHeight - 40) / 844)
    : 1;
  document.documentElement.style.setProperty('--preview-scale', String(scale));
  // Use layout pixels, not the desktop preview transform: all five columns share one projection.
  const width = byId('battle').clientWidth;
  const app = byId('app'), style = getComputedStyle(app);
  const height = app.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const controlsHeight = parseFloat(style.getPropertyValue('--dock-controls-height'));
  const townHeight = parseFloat(style.getPropertyValue('--town-min-height'));
  // Solve both stacked canvases together so Telegram safe areas cannot break their alignment.
  const formationScale = Math.min(width / BATTLE_VIEW.width,
    Math.max(1, height - controlsHeight) / (BATTLE_VIEW.height + FORMATION_VIEW.height),
    Math.max(1, height - controlsHeight - townHeight) / BATTLE_VIEW.height);
  app.style.setProperty('--formation-width', `${formationScale * FORMATION_VIEW.width}px`);
}

const types = Object.fromEntries(UNIT_TYPES.map(type => [type.id, type]));
const TOTAL_WAVES = WAVE_DEFINITIONS.length;
let gold = STARTING_GOLD, units = [], nextId = 1;
let reserve = [], recruitment = createRecruitment(), reservePage = 0;
let barracksPage = 0, starterSupplyGranted = false;
let barracksSelectedId = null;
let barracks = createBarracks();
let hero = createHero(), heroUI = null;
let marketHintCompleted = false;
let pendingRecruitId = null;
let pendingMerge = null;
let unitDrag = null, draggedMerge = null;
let mergeTargetIds = [], mergeLevel = 0;
let transforming = false, transformTimer;
let marketArrivalTimer, marketArrivalTotal = 0, pendingMarketArrival = 0;
const RESERVE_PAGE_SIZE = 3;
const BARRACKS_PAGE_SIZE = 10;
let clearedWaves = 0;
let selectedId = null, movingId = null, scene, toastTimer;
let battle = null, paused = false, lastOutcome = null;
let battleSpeed = 1;
const AUTO_WAVE_DELAY = 2;
const AUTO_WAVES_DEFAULT_VERSION = 1;
let autoWaves = true, autoNextRemaining = null;
let armyScene = null;
let economy = createEconomy();
let pendingOfflineGold = 0, pendingOfflineSlaves = 0;
let offlineRewardFocus = null;
const offlineRewardInert = new Map();
let progression = createProgression(), selectedLockedCell = null, selectedEmptyCell = null;
let overlay = null, overlayOpener = null, resetArmed = false;
let frameId = 0, lastFrame = 0, visualTime = 0, hudElapsed = 0, resultAge = 0;
let destroyed = false;
const battleAudio = createBattleAudio();
const levelMusic = createLevelMusic({ onStateChange: refreshSoundButton });
const telegram = setupTelegramAdapter({ onDeactivate: pauseForInactivity, onActivate: activateGame });
const profileName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name;
byId('profile-name').textContent = typeof profileName === 'string' && profileName.trim() ? profileName.trim().slice(0, 80) : 'Commander';
const hudGoldFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
let economyActive = telegram.isActive, economyLastTick = performance.now(), economyUnsaved = 0;
fitPortraitPreview();
window.addEventListener('resize', fitPortraitPreview);
const layoutObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fitPortraitPreview);
layoutObserver?.observe(byId('app'));

function refreshSoundButton() {
  const button = byId('sound-toggle');
  const silent = levelMusic.muted || levelMusic.volume === 0;
  button.setAttribute('aria-pressed', String(silent));
  const label = !levelMusic.supported ? 'Music unavailable' : silent ? 'Enable music' : 'Mute music';
  button.setAttribute('aria-label', label);
  button.title = label;
  button.disabled = !levelMusic.supported;
  byId('sound-description').textContent = silent ? 'Muted' : 'Level 1 ambience';
  const volume = Math.round(levelMusic.volume * 100);
  byId('music-volume').value = volume;
  byId('music-volume').disabled = !levelMusic.supported;
  byId('music-volume').setAttribute('aria-valuetext', `${volume}%`);
  byId('music-volume-label').textContent = `${volume}%`;
}

byId('sound-toggle').addEventListener('click', () => {
  const enable = levelMusic.muted || levelMusic.volume === 0;
  if (enable && levelMusic.volume === 0) levelMusic.setVolume(0.05);
  levelMusic.setMuted(!enable);
  if (enable) void levelMusic.unlock();
  refreshSoundButton();
});
byId('music-volume').addEventListener('input', event => {
  levelMusic.setVolume(Number(event.target.value) / 100);
  if (levelMusic.volume > 0) levelMusic.setMuted(false);
  void levelMusic.unlock();
  refreshSoundButton();
});
function unlockLevelMusic(event) {
  if (!event.isTrusted || (event.type === 'keydown' && (event.repeat || !['Enter', ' '].includes(event.key)))) return;
  void levelMusic.unlock();
}
// Media starts only after a real gesture; game-speed changes never alter its playback rate.
document.addEventListener('pointerup', unlockLevelMusic, { capture: true, passive: true });
document.addEventListener('keydown', unlockLevelMusic, true);
refreshSoundButton();

function refreshSpeedButton() {
  const button = byId('battle-speed');
  button.textContent = `×${battleSpeed}`;
  button.setAttribute('aria-pressed', String(battleSpeed > 1));
  const label = `Battle speed: ${battleSpeed}×. Switch to ${nextBattleSpeed(battleSpeed)}×`;
  button.setAttribute('aria-label', label);
  button.title = label;
  byId('battle').dataset.speed = String(battleSpeed);
}

byId('battle-speed').addEventListener('click', () => {
  if (battle?.phase !== 'running' || !telegram.isActive) return;
  battleSpeed = nextBattleSpeed(battleSpeed);
  lastFrame = 0;
  refreshSpeedButton();
});

// Balance v2 starts separately; the old v1 prototype save is deliberately never changed.
try {
  const saved = migrateCampaignSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
  if (saved && Number.isFinite(saved.gold) && saved.gold >= 0) {
    starterSupplyGranted = saved.starterSupplyGranted === true;
    recruitment = createRecruitment(saved.recruitment);
    barracks = createBarracks(saved.barracks);
    hero = createHero(saved.hero);
    // Existing conversions also count as having learned this action before the hint existed.
    marketHintCompleted = saved.marketHintCompleted === true || Object.values(recruitment.received).some(count => count > 0);
    progression = createProgression(saved.progression);
    const occupied = new Set();
    units = (Array.isArray(saved.units) ? saved.units : []).filter(unit => {
      if (!unit) return false;
      const key = `${unit.col}:${unit.row}`;
      if (!unit || !types[unit.type] || !Number.isInteger(unit.col) || !Number.isInteger(unit.row)
        || unit.col < 0 || unit.col > 4 || unit.row < 0 || unit.row > 2 || occupied.has(key)) return false;
      if (!progression.unlockedCells.includes(key)) return false;
      occupied.add(key); return true;
    }).map((unit, index) => ({ id: index + 1, type: unit.type, col: unit.col, row: unit.row,
      level: normalizeUnitLevel(unit.level) }));
    // Personal levels survive reloads; receiving another fighter never rewrites an older one.
    reserve = (Array.isArray(saved.reserve) ? saved.reserve : []).filter(unit => unit && types[unit.type])
      .map((unit, index) => ({ id: units.length + index + 1, type: unit.type, level: normalizeUnitLevel(unit.level) }));
    gold = Math.min(1_000_000, Math.floor(saved.gold));
    clearedWaves = Math.max(0, Math.min(TOTAL_WAVES, Math.floor(Number(saved.clearedWaves) || 0)));
    economy = createEconomy(saved.economy);
    pendingOfflineGold = Number.isSafeInteger(saved.offlineRewards?.gold) && saved.offlineRewards.gold > 0 ? saved.offlineRewards.gold : 0;
    pendingOfflineSlaves = Number.isSafeInteger(saved.offlineRewards?.slaves) && saved.offlineRewards.slaves > 0 ? saved.offlineRewards.slaves : 0;
    // Enable the new default once for older saves; later explicit Off choices still persist.
    autoWaves = saved.autoWavesDefaultVersion === AUTO_WAVES_DEFAULT_VERSION ? saved.autoWaves !== false : true;
    nextId = units.length + reserve.length + 1;
    save();
  }
} catch { /* Storage may be unavailable in an embedded preview. */ }

// A one-time starting supply replaces gold recruitment; spent supplies never refill on reload.
if (!starterSupplyGranted) {
  if (!units.length && !reserve.length && economy.slaves === 0) economy.slaves = STARTING_SLAVES;
  starterSupplyGranted = true;
  save();
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ campaignVersion: CAMPAIGN_VERSION, gold, units, reserve, recruitment, barracks, hero, starterSupplyGranted, marketHintCompleted, clearedWaves, economy, progression, autoWaves, autoWavesDefaultVersion: AUTO_WAVES_DEFAULT_VERSION,
    offlineRewards: { gold: pendingOfflineGold, slaves: pendingOfflineSlaves } })); } catch { /* The map also works without storage. */ }
}

function collectOfflineIncome() {
  const now = Date.now();
  completeBarracksUpgrade(barracks, now);
  const earned = claimOfflineTreasury(economy, now).gold;
  const slaves = claimOfflineMarket(economy, now).slaves;
  gold += earned;
  pendingOfflineGold += earned;
  pendingOfflineSlaves += slaves;
  // Save income, consumed time and its unacknowledged receipt together, before any reload.
  save();
  return earned;
}

function showOfflineIncome() {
  if (!scene || !economyActive || (!pendingOfflineGold && !pendingOfflineSlaves)) return;
  unitDrag?.cancel();
  const panel = byId('offline-rewards-panel');
  byId('offline-gold-reward').hidden = !pendingOfflineGold;
  byId('offline-slaves-reward').hidden = !pendingOfflineSlaves;
  byId('offline-gold-amount').textContent = `+${pendingOfflineGold}`;
  byId('offline-slaves-amount').textContent = `+${pendingOfflineSlaves}`;
  if (!panel.hidden) return;
  panel.hidden = false;
  offlineRewardFocus = document.activeElement;
  // Cover an open menu without discarding its selection or making its background interactive.
  for (const element of byId('app').children) {
    if (element === panel) continue;
    offlineRewardInert.set(element, element.inert);
    element.inert = true;
  }
  byId('collect-offline-rewards').focus({ preventScroll: true });
  refreshMarketHint();
}

byId('collect-offline-rewards').addEventListener('click', () => {
  const panel = byId('offline-rewards-panel');
  if (panel.hidden || !economyActive) return;
  tickEconomy();
  // Income was already saved exactly once. Collect acknowledges it, rather than paying again.
  const collectedSlaves = pendingOfflineSlaves;
  pendingOfflineGold = pendingOfflineSlaves = 0;
  save();
  panel.hidden = true;
  for (const [element, wasInert] of offlineRewardInert) element.inert = wasInert;
  offlineRewardInert.clear();
  // A first click after OS sleep can open a menu while tickEconomy reveals the receipt.
  document.querySelectorAll('.wave-track, .battlefield, .army-dock').forEach(element => {
    element.inert = !!overlay && !overlay.contains(element);
  });
  const target = offlineRewardFocus?.isConnected && offlineRewardFocus !== document.body && !offlineRewardFocus.disabled
    && !offlineRewardFocus.closest('[inert]') && offlineRewardFocus.getClientRects().length
    ? offlineRewardFocus : overlay?.querySelector('[data-close-overlay]') ?? byId('army-map');
  target?.focus({ preventScroll: true });
  offlineRewardFocus = null;
  refreshMarketHint();
  showMarketArrival(collectedSlaves);
});
byId('offline-rewards-panel').addEventListener('keydown', event => {
  if (event.key === 'Tab' || event.key === 'Escape') {
    event.preventDefault();
    byId('collect-offline-rewards').focus({ preventScroll: true });
  }
});

// A background-loaded tab waits until it is actually opened to consume its absence.
if (economyActive) {
  collectOfflineIncome();
  economyLastTick = performance.now();
}

// This is the saved formation for the next wave. Each running battle owns its own fighters.
const canEditFormation = () => !!armyScene && telegram.isActive;
function saveFormation() { save(); }

function refreshArmyWallet() {
  byId('army-gold').textContent = gold;
  byId('army-slaves').textContent = economy.slaves;
}

function refreshRecruitment() {
  const button = byId('transform-slave');
  byId('market-slaves').textContent = economy.slaves >= 1000 ? hudGoldFormat.format(economy.slaves) : economy.slaves;
  byId('market-slaves').parentElement.title = `${economy.slaves} slaves`;
  button.classList.toggle('has-slaves', economy.slaves >= RECRUIT_COST);
  const reserveStock = Math.max(0, reserve.length - (transforming ? 1 : 0));
  byId('barracks-stock').textContent = reserveStock >= 1000 ? hudGoldFormat.format(reserveStock) : reserveStock;
  byId('open-barracks').disabled = !canEditFormation() || transforming;
  button.disabled = !canEditFormation() || economy.slaves < RECRUIT_COST || transforming;
  const chances = getRecruitChances(barracks.level === 2);
  const odds = chances.map(({ type, chance }) => `${types[type].name} ${Math.round(chance * 100)}%`).join(', ');
  const nextRecruit = barracks.firstLancerPending ? 'Next recruit: guaranteed Lancer.' : odds;
  button.setAttribute('aria-label', `Transform 1 slave into a fighter. ${economy.slaves} slaves available. ${nextRecruit}`);
  button.title = nextRecruit;
  byId('market-convert-label').textContent = barracks.firstLancerPending ? 'Lancer next' : 'Market';
  const upgrade = getBarracksUpgrade(barracks, recruitment);
  byId('barracks-building-level').textContent = barracks.level === 2 ? 'II' : ['upgrading', 'ready'].includes(upgrade.status) ? '…' : 'I';
  byId('open-market-info').classList.toggle('upgrade-available', upgrade.canStart);
  byId('open-market-info').disabled = !canEditFormation();
  refreshMarketHint();
  if (overlay?.id === 'market-info-panel') refreshRecruitmentDetails();
}

function refreshMarketHint() {
  const visible = !marketHintCompleted && canEditFormation() && economy.slaves >= RECRUIT_COST
    && !transforming && !overlay && !pendingRecruitId && !pendingMerge && !movingId && byId('offline-rewards-panel').hidden;
  const button = byId('transform-slave');
  byId('market-first-use-hint').hidden = !visible;
  button.classList.toggle('needs-market-hint', visible);
  if (visible) button.setAttribute('aria-describedby', 'market-first-use-hint');
  else button.removeAttribute('aria-describedby');
}

function showMarketArrival(amount = 0) {
  if (Number.isSafeInteger(amount) && amount > 0) pendingMarketArrival += amount;
  if (!pendingMarketArrival || destroyed || !telegram.isActive || overlay
    || !byId('offline-rewards-panel').hidden) return;
  marketArrivalTotal += pendingMarketArrival;
  pendingMarketArrival = 0;
  const notice = byId('market-arrival');
  notice.hidden = false;
  notice.textContent = `+${marketArrivalTotal}`;
  notice.setAttribute('aria-label', `${marketArrivalTotal} ${marketArrivalTotal === 1 ? 'slave arrived' : 'slaves arrived'} at Market`);
  const button = byId('transform-slave');
  button.classList.remove('is-arriving');
  void button.offsetWidth;
  button.classList.add('is-arriving');
  clearTimeout(marketArrivalTimer);
  marketArrivalTimer = setTimeout(() => {
    button.classList.remove('is-arriving');
    notice.hidden = true;
    marketArrivalTotal = 0;
  }, 2800);
}

function finishRecruitReveal() {
  transforming = false;
  byId('transform-slave').classList.remove('is-transforming', 'is-working');
  document.querySelector('.recruitment-dock').classList.remove('is-transferring');
  byId('market-recruit-reveal').hidden = true;
}

function recruitmentProgressMarkup(type) {
  const pluralNames = { swordsman: 'swordsmen', archer: 'archers', healer: 'healers', lancer: 'lancers' };
  const progress = getRecruitProgress(recruitment, type);
  const capped = progress.level === RECRUIT_LEVEL_CAP;
  const remaining = progress.needed - progress.progress;
  const detail = capped ? 'Maximum recruitment level' : remaining + ' more ' + (remaining === 1 ? types[type].name.toLowerCase() : pluralNames[type]) + ' → Lv. ' + (progress.level + 1);
  return '<p>Recruitment level · Lv. ' + progress.level + '</p>'
    + '<progress max="' + progress.needed + '" value="' + (capped ? progress.needed : progress.progress) + '" aria-label="' + types[type].name + ': ' + detail + '"></progress><small>' + detail + '</small>';
}

function refreshRecruitmentDetails() {
  byId('recruitment-guarantee').hidden = !barracks.firstLancerPending;
  // Keep the inline purchase controls mounted so timer/income updates preserve focus.
  byId('recruitment-current-types').innerHTML = getRecruitChances(barracks.level === 2).filter(({ type }) => type !== 'lancer').map(({ type, chance }) => {
    const progress = getRecruitProgress(recruitment, type);
    const portrait = scene?.getUnitArt(type, progress.level);
    const chanceLabel = Math.round(chance * 100) + '%';
    return '<article class="recruitment-detail" data-recruit-type="' + type + '">'
      + (portrait ? '<img src="' + portrait + '" alt="" />' : '')
      + '<div class="recruitment-detail-copy"><div class="recruitment-detail-heading"><strong>' + types[type].name + '</strong><span>' + chanceLabel + '</span></div>'
      + recruitmentProgressMarkup(type) + '</div></article>';
  }).join('');
  byId('lancer-recruitment-training').innerHTML = recruitmentProgressMarkup('lancer');
  refreshBarracksUpgrade();
}

byId('transform-slave').addEventListener('click', () => {
  if (!canEditFormation() || overlay || transforming || economy.slaves < RECRUIT_COST) return;
  completeBarracksUpgrade(barracks);
  const result = receiveRecruit(recruitment, Math.random, {
    lancerUnlocked: barracks.level === 2, guaranteedLancer: barracks.firstLancerPending,
  });
  consumeFirstLancerGuarantee(barracks, result.type);
  marketHintCompleted = true;
  economy.slaves -= RECRUIT_COST;
  reserve.push({ id: nextId++, type: result.type, level: result.level });
  reservePage = Math.floor((reserve.length - 1) / RESERVE_PAGE_SIZE);
  barracksPage = Math.floor((reserve.length - 1) / BARRACKS_PAGE_SIZE);
  // Commit the cost and fighter together before the purely cosmetic reveal starts.
  saveFormation();
  transforming = true;
  const reveal = byId('market-recruit-reveal');
  reveal.src = scene.getUnitArt(result.type, result.level);
  reveal.alt = `${types[result.type].name}, level ${result.level}`;
  reveal.hidden = false;
  byId('transform-slave').classList.add('is-transforming', 'is-working');
  document.querySelector('.recruitment-dock').classList.add('is-transferring');
  refresh();
  clearTimeout(transformTimer);
  transformTimer = setTimeout(() => {
    finishRecruitReveal();
    if (!destroyed) {
      refreshRecruitment();
      tell(`${types[result.type].name} · Lv. ${result.level}`);
    }
  }, 1200);
});

function refreshEconomy() {
  // Only the small HUD abbreviates large balances; menus retain the exact amount.
  byId('gold-count').textContent = gold < 10000 ? gold : hudGoldFormat.format(gold);
  const goldLabel = `${gold} gold`;
  byId('gold-count').parentElement.setAttribute('aria-label', goldLabel);
  byId('gold-count').parentElement.title = goldLabel;
  byId('battle').dataset.gold = gold;
  byId('slaves-count').textContent = economy.slaves;
  byId('open-buildings').setAttribute('aria-label', `Buildings. ${economy.slaves} ${economy.slaves === 1 ? 'slave' : 'slaves'}`);
  byId('building-gold').textContent = gold;
  byId('building-slaves').textContent = economy.slaves;
  byId('treasury-level').textContent = economy.treasuryLevel;
  byId('treasury-rate').textContent = treasuryRate(economy);
  byId('treasury-offline-note').textContent = `Offline storage: ${TREASURY_OFFLINE_LIMIT_SECONDS / 3600}h · up to ${treasuryRate(economy) * TREASURY_OFFLINE_LIMIT_SECONDS / 60} gold`;
  byId('treasury-progress').style.width = `${economy.treasuryProgress * 100}%`;
  byId('treasury-progress').parentElement.setAttribute('aria-valuenow', Math.floor(economy.treasuryProgress * 100));
  const seconds = Math.max(1, Math.ceil((1 - economy.treasuryProgress) * 60 / treasuryRate(economy)));
  byId('treasury-countdown').textContent = `${seconds}s`;
  byId('treasury-progress').parentElement.setAttribute('aria-valuetext', `Next gold in ${seconds} seconds`);
  const cost = treasuryUpgradeCost(economy);
  byId('treasury-cost').textContent = cost ?? 'Max';
  byId('treasury-upgrade').disabled = cost === null || gold < cost;
  byId('treasury-upgrade').setAttribute('aria-label', cost === null ? 'Treasury at maximum level' : `Upgrade Treasury for ${cost} gold. Earn ${treasuryRate(economy) + 1} gold per minute`);
  byId('market-status').textContent = economy.marketBuilt ? 'Passive income active' : 'Training ready';
  byId('market-rate').textContent = `1 slave / ${MARKET_PRODUCTION_SECONDS / 60} min`;
  byId('market-cost').textContent = MARKET_BUILD_COST;
  byId('market-build').hidden = economy.marketBuilt;
  byId('market-build').disabled = economy.marketBuilt || gold < MARKET_BUILD_COST;
  byId('market-build').setAttribute('aria-label', `Enable passive slave income for ${MARKET_BUILD_COST} gold`);
  byId('market-production').hidden = !economy.marketBuilt;
  byId('market-description').textContent = economy.marketBuilt ? 'Income is collected automatically. Transform slaves below your army.' : 'Transform captured slaves below your army. Enable passive income here.';
  const marketSeconds = Math.max(1, Math.ceil((1 - economy.marketProgress) * MARKET_PRODUCTION_SECONDS));
  byId('market-countdown').textContent = `${Math.floor(marketSeconds / 60)}:${String(marketSeconds % 60).padStart(2, '0')}`;
  byId('market-progress').style.width = `${economy.marketProgress * 100}%`;
  byId('market-progress').parentElement.setAttribute('aria-valuenow', Math.floor(economy.marketProgress * 100));
  byId('market-progress').parentElement.setAttribute('aria-valuetext', `Next slave in ${marketSeconds} seconds`);
  byId('market-offline-note').textContent = `Offline storage: ${MARKET_OFFLINE_LIMIT_SECONDS / 3600}h · up to ${Math.floor(MARKET_OFFLINE_LIMIT_SECONDS / MARKET_PRODUCTION_SECONDS)} slaves`;
  refreshRecruitment();
  const cellCost = nextCellCost(progression);
  byId('slots-count').textContent = `${progression.unlockedCells.length} / 15`;
  byId('slots-cost').textContent = cellCost === null ? 'All tiles unlocked' : `Next tile: ${cellCost} gold`;
  byId('choose-cell').disabled = cellCost === null;
  const captureSeconds = Math.ceil(economy.captureCooldown);
  const captureLimit = capturePityKills(economy);
  const captureProgress = Math.min(economy.captureKills, captureLimit);
  byId('capture-status').textContent = captureSeconds > 0
    ? `Next search in ${Math.floor(captureSeconds / 60)}:${String(captureSeconds % 60).padStart(2, '0')}`
    : economy.captures < STARTER_CAPTURES ? `Starter capture ${economy.captures + 1}/${STARTER_CAPTURES}: ${captureProgress}/${captureLimit} kills`
    : `Searching: ${captureProgress} / ${captureLimit} kills`;
  byId('capture-detail').textContent = economy.captureCooldown > 0
    ? `${CAPTURE_COOLDOWN} seconds of active play between searches. No offline progress.`
    : `${Math.round(captureDropChance(economy) * 100)}% per kill. Guaranteed by ${captureLimit} kills. ${economy.captures < STARTER_CAPTURES ? 'No wait for the first four captures.' : 'Progress is saved.'}`;
  refreshArmyWallet();
}

function tickEconomy(now = performance.now()) {
  const elapsed = Math.max(0, (now - economyLastTick) / 1000);
  economyLastTick = now;
  if (destroyed || !economyActive) return;
  const wallNow = Date.now();
  const barracksFinished = completeBarracksUpgrade(barracks, wallNow);
  const checkpoints = [economy.treasuryUpdatedAt, economy.marketBuilt ? economy.marketUpdatedAt : null];
  const wallElapsed = Math.max(0, ...checkpoints.filter(value => value !== null).map(value => (wallNow - value) / 1000));
  // OS sleep can suspend a visible page without a visibility event. Cap that gap like any absence.
  if (elapsed > 60 || wallElapsed > 60) {
    collectOfflineIncome();
    economyUnsaved = 0;
    refresh(); showOfflineIncome();
    return;
  }
  // Real foreground time, independent of battle speed and open menus.
  const earned = accrueTreasury(economy, elapsed);
  const slaves = accrueMarket(economy, elapsed);
  checkpointTreasury(economy, wallNow);
  checkpointMarket(economy, wallNow);
  advanceCaptureClock(economy, elapsed);
  gold += earned;
  economyUnsaved += elapsed;
  if (earned || slaves || barracksFinished || economyUnsaved >= 15) { save(); economyUnsaved = 0; }
  if (earned || slaves || barracksFinished) refresh(); else refreshEconomy();
  if (overlay?.id === 'market-info-panel') refreshBarracksUpgrade();
  if (slaves) showMarketArrival(slaves);
}

function setOverlay(id, opener) {
  unitDrag?.cancel();
  if (overlay) closeOverlay(false);
  tickEconomy();
  overlay = byId(id); overlayOpener = opener;
  byId('app').classList.add('has-menu');
  overlay.hidden = false;
  opener?.setAttribute('aria-expanded', 'true');
  document.querySelectorAll('.wave-track, .battlefield, .army-dock').forEach(element => { element.inert = !overlay.contains(element); });
  // Prefer the close control; a menu may begin with a hidden Back button.
  overlay.querySelector('[data-close-overlay]')?.focus({ preventScroll: true });
  refreshMarketHint();
}

function closeOverlay(restoreFocus = true) {
  if (!overlay) return;
  const wasPicker = overlay.id === 'unit-panel';
  if (overlay.id === 'barracks-panel') barracksSelectedId = null;
  if (wasPicker && !movingId) {
    selectedId = movingId = selectedLockedCell = selectedEmptyCell = null;
  }
  overlay.hidden = true;
  overlayOpener?.setAttribute('aria-expanded', 'false');
  document.querySelectorAll('.wave-track, .battlefield, .army-dock').forEach(element => { element.inert = false; });
  overlay = null; resetArmed = false;
  byId('app').classList.remove('has-menu');
  byId('reset').setAttribute('aria-label', 'Reset run');
  byId('reset').title = 'Reset run';
  byId('reset-confirmation').hidden = true;
  if (restoreFocus) overlayOpener?.focus({ preventScroll: true });
  overlayOpener = null;
  refreshMarketHint();
  if (wasPicker) refresh();
  showMarketArrival();
}

heroUI = createHeroUI({ button: byId('open-hero'), panel: byId('hero-panel'),
  getHero: () => hero, getBattle: () => battle, close: () => closeOverlay(),
  onChange: () => { save(); refresh(); } });

for (const [button, panel] of [['open-buildings', 'buildings-panel'], ['open-profile', 'profile-panel'], ['open-barracks', 'barracks-panel'], ['open-market-info', 'market-info-panel'], ['open-hero', 'hero-panel']]) {
  byId(button).addEventListener('click', () => {
    if (panel === 'barracks-panel') {
      pendingRecruitId = null;
      pendingMerge = null;
      barracksSelectedId = null;
      byId('barracks-feedback').textContent = 'Tap for details · Hold to connect';
    }
    setOverlay(panel, byId(button)); refresh();
  });
}
for (const panel of ['buildings-panel', 'profile-panel', 'unit-panel', 'barracks-panel', 'market-info-panel', 'hero-panel']) {
  byId(panel).addEventListener('click', event => {
    if (event.target === byId(panel) || event.target.closest('[data-close-overlay]')) {
      closeOverlay();
    }
  });
  byId(panel).addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (panel === 'barracks-panel' && barracksSelectedId !== null) {
        showBarracksList();
        return;
      }
      closeOverlay();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...byId(panel).querySelectorAll('button:not(:disabled):not([tabindex="-1"]), canvas[tabindex="0"]')]
      .filter(element => !element.hidden && element.getClientRects().length > 0);
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
}
byId('treasury-upgrade').addEventListener('click', () => {
  tickEconomy();
  const result = upgradeTreasury(economy, gold);
  if (!result.upgraded) return;
  gold = result.gold;
  save(); refresh();
});
byId('market-build').addEventListener('click', () => {
  if (!economyActive) return;
  tickEconomy();
  const result = buildMarket(economy, gold);
  if (!result.built) return;
  gold = result.gold;
  save(); refresh();
  byId('tab-market').focus({ preventScroll: true });
  tell('Income enabled.');
});

function selectBuilding(name) {
  for (const tab of byId('buildings-tabs').querySelectorAll('[data-building]')) {
    const selected = tab.dataset.building === name;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    byId(tab.getAttribute('aria-controls')).hidden = !selected;
  }
}
byId('buildings-tabs').addEventListener('click', event => {
  const tab = event.target.closest('[data-building]');
  if (tab) selectBuilding(tab.dataset.building);
});
byId('buildings-tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = [...byId('buildings-tabs').querySelectorAll('[data-building]')];
  const current = tabs.indexOf(document.activeElement);
  if (current < 0) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
    : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  selectBuilding(tabs[next].dataset.building);
  tabs[next].focus();
});
byId('choose-cell').addEventListener('click', () => {
  closeOverlay();
  pendingRecruitId = null;
  pendingMerge = null;
  selectedId = movingId = null;
  selectedLockedCell = null;
  byId('army-map').focus({ preventScroll: true });
  refresh(); tell('Choose a lock.');
});

const nextWaveNumber = () => Math.min(clearedWaves + 1, TOTAL_WAVES);
const runComplete = () => clearedWaves === TOTAL_WAVES;
const automaticWaveNumber = () => runComplete() ? 1 : nextWaveNumber();
const hasActiveBattle = () => battle?.phase === 'running' || autoNextRemaining !== null;
const waveLabel = number => {
  const wave = getWaveDefinition(number);
  return `${wave.levelNumber}-${wave.roundNumber} · Wave ${wave.waveInRound}`;
};

function buildWaveTrack(wave = getWaveDefinition(battle?.waveNumber ?? nextWaveNumber())) {
  const track = byId('wave-nodes');
  track.dataset.level = wave.levelNumber;
  track.dataset.round = wave.roundNumber;
  track.style.setProperty('--wave-count', WAVES_PER_ROUND);
  byId('wave-total').textContent = `/${WAVES_PER_ROUND}`;
  track.replaceChildren(...getRoundWaves(wave.levelNumber, wave.roundNumber).map(wave => {
    const node = document.createElement('li');
    node.className = `wave-node${wave.hasBoss ? ' has-skull' : ''}${wave.isFinalBossWave ? ' has-final-boss' : ''}`;
    node.dataset.wave = wave.number;
    node.title = `${waveLabel(wave.number)}: ${wave.name}${wave.hasBoss ? wave.isFinalBossWave ? ' · Main boss' : ' · Mini-boss' : ''}`;
    const number = document.createElement('span');
    number.className = 'step-number';
    number.textContent = wave.waveInRound;
    node.append(number);
    if (wave.hasBoss) node.insertAdjacentHTML('beforeend', '<svg class="wave-skull" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8 1a6 6 0 0 0-6 6v3l3 1v3h6v-3l3-1V7a6 6 0 0 0-6-6ZM4 6h3v3H4Zm5 0h3v3H9ZM7 10h2v2H7Z"/></svg>');
    return node;
  }));
}

function refreshWaveTrack() {
  const number = battle?.waveNumber ?? nextWaveNumber();
  const wave = getWaveDefinition(number);
  if (Number(byId('wave-nodes').dataset.level) !== wave.levelNumber
    || Number(byId('wave-nodes').dataset.round) !== wave.roundNumber) buildWaveTrack(wave);
  byId('level-number').textContent = `${wave.levelNumber}-${wave.roundNumber}`;
  byId('wave-number').textContent = wave.waveInRound;
  byId('profile-progress').textContent = `Level ${wave.levelNumber} · Round ${wave.roundNumber} / ${ROUNDS_PER_LEVEL} · Wave ${wave.waveInRound} / ${WAVES_PER_ROUND}`;
  document.querySelector('.wave-track').setAttribute('aria-label', `${wave.levelName}. Round ${wave.levelNumber}-${wave.roundNumber}. Wave ${wave.waveInRound} of ${WAVES_PER_ROUND}`);
  document.querySelector('.wave-label').title = `${wave.levelName} · Round ${wave.roundNumber} / ${ROUNDS_PER_LEVEL}`;
  document.querySelectorAll('[data-wave]').forEach(node => {
    const step = Number(node.dataset.wave);
    const definition = getWaveDefinition(step);
    const done = step <= clearedWaves;
    const current = step === number && !(runComplete() && !battle);
    node.classList.toggle('is-cleared', done);
    node.classList.toggle('is-current', current && !done);
    node.setAttribute('aria-label', `${waveLabel(step)}, ${definition.name}${definition.hasBoss ? definition.isFinalBossWave ? ', main boss' : ', mini-boss' : ''}, ${done ? 'cleared' : current ? 'current' : 'upcoming'}`);
    if (current) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
    node.querySelector('.step-number').textContent = done ? '✓' : definition.waveInRound;
  });
}

function hideNotice() {
  clearTimeout(toastTimer);
  byId('toast').classList.remove('visible');
  byId('toast').replaceChildren();
}

function tell(message, resource = null) {
  clearTimeout(toastTimer);
  const notice = byId('toast');
  notice.textContent = message;
  if (resource === 'slaves') {
    const icon = document.createElement('span');
    icon.className = 'slave-icon';
    icon.setAttribute('role', 'img');
    icon.setAttribute('aria-label', 'Slaves');
    notice.append(icon);
  }
  notice.classList.add('visible');
  toastTimer = setTimeout(hideNotice, 2300);
}

function refreshPhaseLabel() {
  const label = byId('phase-label');
  label.textContent = autoNextRemaining !== null
    ? paused ? 'Auto paused' : `Next in ${Math.ceil(autoNextRemaining)}s`
    : battle
    ? battle.phase === 'running' ? (paused ? 'Paused' : battle.enraged ? 'Enraged' : '') : battle.phase === 'victory' ? 'Wave cleared' : 'Guard defeated'
    : runComplete() ? 'Campaign cleared' : '';
  label.parentElement.hidden = !label.textContent;
}

function refresh() {
  const focusedAction = document.activeElement?.closest('#selection-panel [data-action]')?.dataset.action;
  const focusedReserveId = document.activeElement?.closest('[data-reserve-id]')?.dataset.reserveId;
  const focusedRecruitId = document.activeElement?.closest('[data-barracks-recruit-id]')?.dataset.barracksRecruitId;
  const focusedMergeId = document.activeElement?.closest('[data-barracks-merge-id]')?.dataset.barracksMergeId;
  const focusedSellId = document.activeElement?.closest('[data-barracks-sell-id]')?.dataset.barracksSellId;
  const focusedBarracksId = document.activeElement?.closest('[data-barracks-unit-id]')?.dataset.barracksUnitId;
  telegram.setGameInProgress(hasActiveBattle());
  levelMusic.setLevel(getWaveDefinition(battle?.waveNumber ?? nextWaveNumber()).levelNumber);
  levelMusic.setActive(!destroyed && telegram.isActive);
  refreshEconomy();
  heroUI?.render();
  byId('army-count').textContent = `${units.length} / ${progression.unlockedCells.length}`;
  const pendingRecruit = reserve.find(unit => unit.id === pendingRecruitId);
  if (!pendingRecruit) pendingRecruitId = null;
  const mergeSource = draggedMerge?.source ?? pendingMerge;
  const merging = getMergeSource(mergeSource);
  if (!getMergeSource()) pendingMerge = null;
  // Recompute eligibility on roster/UI changes, not on every Canvas animation frame.
  mergeTargetIds = mergeSource ? units.filter(unit => getMergeResult(units, reserve, mergeSource, unit.id).ok).map(unit => unit.id) : [];
  mergeLevel = merging?.level ?? 0;
  byId('army-status').textContent = draggedMerge ? 'Release on a green fighter to connect. Release elsewhere to cancel.'
    : merging ? `Connect: choose another ${types[merging.type].name}. Adds ${merging.level} levels.`
    : pendingRecruit ? `Place ${types[pendingRecruit.type].name} · Lv. ${pendingRecruit.level}`
    : movingId ? 'Tap a destination' : 'Tap for details · Hold a fighter to connect';
  byId('cancel-army-move').hidden = !movingId && !pendingRecruitId && !pendingMerge;
  byId('open-market-info').hidden = !!movingId || !!pendingRecruitId || !!pendingMerge;
  const cancelLabel = pendingMerge ? 'Cancel connection' : pendingRecruit ? 'Cancel recruitment' : 'Cancel moving fighter';
  byId('cancel-army-move').setAttribute('aria-label', cancelLabel);
  byId('cancel-army-move').title = cancelLabel;
  byId('app').classList.toggle('is-battling', !!battle);
  byId('app').classList.toggle('is-paused', paused);
  byId('reset').disabled = !!battle;
  byId('start-wave').hidden = !!battle;
  byId('start-wave').disabled = !scene || !armyScene || !units.length;
  const startAction = runComplete() ? 'Replay' : lastOutcome === 'defeat' ? 'Retry' : 'Start';
  byId('start-label').textContent = startAction;
  const startDescription = runComplete() ? 'Replay campaign' : `${startAction} ${waveLabel(nextWaveNumber())}`;
  byId('start-wave').setAttribute('aria-label', startDescription);
  byId('start-wave').title = startDescription;
  byId('battle-toolbar').hidden = !battle;
  byId('battle-speed').disabled = battle?.phase !== 'running';
  refreshPhaseLabel();
  byId('auto-waves').textContent = autoWaves ? 'On' : 'Off';
  byId('auto-waves').setAttribute('aria-pressed', String(autoWaves));
  byId('auto-waves').setAttribute('aria-label', `Auto waves ${autoWaves ? 'on' : 'off'}. ${autoWaves ? 'Disable' : 'Enable'} automatic waves`);
  refreshSpeedButton(); refreshWaveTrack();
  const selected = units.find(unit => unit.id === selectedId);
  const panel = byId('selection-panel');
  refreshReserve(selected);
  // Touchmove/touchend keep their original target. Keep that icon connected even
  // when income refreshes the UI or pickup hides the Barracks dialog.
  if (!unitDrag?.tracking && !draggedMerge) refreshBarracks();
  if (selectedLockedCell) {
    const cost = nextCellCost(progression);
    byId('unit-panel-title').textContent = 'Unlock tile';
    panel.innerHTML = `<div class="placement-copy"><strong>Expand your army</strong><p>Cost: ${cost} gold · You have ${gold}</p></div><div class="selection-actions"><button data-action="unlock-cell"${gold < cost ? ' disabled' : ''}>Unlock · ${cost} gold</button><button data-action="cancel">Cancel</button></div>`;
  } else if (selected) {
    const type = types[selected.type];
    const stats = getUnitStats(selected.type, selected.level);
    const hp = stats.hp, effect = selected.type === 'healer' ? stats.heal : stats.damage;
    const portrait = scene?.getUnitArt?.(selected.type, selected.level);
    const lastGuard = !!battle && units.length === 1;
    byId('unit-panel-title').textContent = type.name;
    panel.innerHTML = `<div class="selected-info">${portrait ? `<img class="selected-portrait" data-unit="${selected.type}" src="${portrait}" alt="" />` : ''}<div class="selected-copy"><div class="selected-line"><strong>${type.name}</strong><span class="unit-rank-name">Lv. ${selected.level}</span></div><p class="selected-stats">${hp} HP · ${effect} ${selected.type === 'healer' ? 'healing' : 'attack'}</p></div></div><div class="selection-actions">${mergeButtonMarkup({ location: 'army', id: selected.id })}<button data-action="move">Move</button><button data-action="remove"${lastGuard ? ' disabled title="Keep one guard for the next wave"' : ''}>To barracks</button></div><p class="building-note">${mergeDescription({ location: 'army', id: selected.id })}</p>${lastGuard ? '<p class="building-note">Keep one guard or replace it from your barracks.</p>' : ''}`;
  } else {
    byId('unit-panel-title').textContent = 'Deploy a fighter';
    panel.innerHTML = '<p class="building-note">Choose a fighter from your barracks for this tile.</p>';
  }
  byId('army-map').dataset.formation = JSON.stringify(units);
  byId('army-map').dataset.unlockedCells = JSON.stringify(progression.unlockedCells);
  byId('army-map').setAttribute('aria-label', `Army for the next wave. ${units.length} guards. ${byId('army-status').textContent}. Use arrow keys and Enter to choose a tile.`);
  const canvas = byId('battle');
  canvas.dataset.formation = JSON.stringify(battle ? battle.allies.map(({ id, type, col, row, level }) => ({ id, type, col, row, level })) : units);
  canvas.dataset.gold = gold;
  const currentWave = getWaveDefinition(battle?.waveNumber ?? nextWaveNumber());
  canvas.dataset.campaign = JSON.stringify({ wave: currentWave.number, level: currentWave.levelNumber, round: currentWave.roundNumber, waveInRound: currentWave.waveInRound, clearedWaves, complete: runComplete() });
  if (!battle) canvas.setAttribute('aria-label', `Preparing ${waveLabel(nextWaveNumber())}. ${units.length} defenders. Edit your army in the grid below.`);
  else refreshBattleHud();
  if (focusedAction && overlay?.id === 'unit-panel') {
    const replacement = panel.querySelector(`[data-action="${focusedAction}"]`);
    (replacement && !replacement.disabled ? replacement : overlay.querySelector('[data-close-overlay]')).focus({ preventScroll: true });
  }
  if (focusedReserveId && overlay?.id === 'unit-panel') {
    (byId('reserve-options').querySelector(`[data-reserve-id="${focusedReserveId}"]`)
      ?? overlay.querySelector('[data-close-overlay]')).focus({ preventScroll: true });
  }
  if (focusedRecruitId && overlay?.id === 'barracks-panel') {
    const replacement = byId('barracks-detail').querySelector(`[data-barracks-recruit-id="${focusedRecruitId}"]`);
    (replacement && !replacement.disabled ? replacement : overlay.querySelector('[data-close-overlay]')).focus({ preventScroll: true });
  }
  if (focusedMergeId && overlay?.id === 'barracks-panel') {
    const replacement = byId('barracks-detail').querySelector(`[data-barracks-merge-id="${focusedMergeId}"]`);
    (replacement && !replacement.disabled ? replacement : overlay.querySelector('[data-close-overlay]')).focus({ preventScroll: true });
  }
  if (focusedSellId && overlay?.id === 'barracks-panel') {
    const replacement = byId('barracks-detail').querySelector(`[data-barracks-sell-id="${focusedSellId}"]`);
    (replacement && !replacement.disabled ? replacement : overlay.querySelector('[data-close-overlay]')).focus({ preventScroll: true });
  }
  if (focusedBarracksId && overlay?.id === 'barracks-panel' && barracksSelectedId === null) {
    (byId('barracks-options').querySelector(`[data-barracks-unit-id="${focusedBarracksId}"]`)
      ?? overlay.querySelector('[data-close-overlay]')).focus({ preventScroll: true });
  }
  renderScene();
}

function getMergeSource(source = pendingMerge) {
  return source && (source.location === 'army' ? units : reserve).find(unit => unit.id === source.id);
}

function canMerge(source) {
  return units.some(unit => getMergeResult(units, reserve, source, unit.id).ok);
}

function mergeDescription(source) {
  const fighter = getMergeSource(source);
  if (!fighter) return '';
  if (canMerge(source)) return `Add ${fighter.level} levels to a matching Army fighter. This fighter is consumed.`;
  const sameType = units.some(unit => unit.type === fighter.type && unit.id !== fighter.id);
  return sameType ? `Combined level cannot exceed ${RECRUIT_LEVEL_CAP}.`
    : `Place another ${types[fighter.type].name} in your Army to connect.`;
}

function mergeButtonMarkup(source, unavailable = false) {
  const action = source.location === 'army' ? 'data-action="merge"' : `data-barracks-merge-id="${source.id}"`;
  return `<button class="merge-button" ${action} type="button"${unavailable || !canMerge(source) ? ' disabled' : ''}><span class="merge-plus" aria-hidden="true">+</span>Connect</button>`;
}

function beginMerge(source) {
  if (!canEditFormation() || transforming || !canMerge(source)) return;
  pendingMerge = source;
  pendingRecruitId = selectedId = movingId = selectedLockedCell = selectedEmptyCell = null;
  closeOverlay(false); refresh();
  byId('army-map').focus({ preventScroll: true });
  tell('Tap a green fighter.');
}

function mergeInto(targetId, source = pendingMerge) {
  if (!canEditFormation() || transforming) return false;
  const result = getMergeResult(units, reserve, source, targetId);
  if (!result.ok) {
    const messages = {
      'different-type': 'Choose the same type.', 'same-unit': 'Choose another fighter.',
      'level-cap': `Max level: ${RECRUIT_LEVEL_CAP}.`, 'target-missing': 'Tap a green fighter.',
    };
    tell(messages[result.reason] ?? 'Fighter unavailable.');
    return false;
  }
  // Commit only the saved roster. The ongoing wave owns separate combat actors.
  units = result.units;
  reserve = result.reserve;
  pendingMerge = null;
  selectedId = movingId = selectedLockedCell = selectedEmptyCell = null;
  saveFormation(); refresh();
  tell(`Lv. ${result.target.level}${battle ? ' · Next wave' : ' · Connected'}`);
  return true;
}

function dragSourceAt(event) {
  if (!canEditFormation() || transforming || pendingMerge || pendingRecruitId || movingId
    || !byId('offline-rewards-panel').hidden) return null;
  if (!overlay && event.target === byId('army-map')) {
    const cell = armyScene.getCellAt(event.clientX, event.clientY);
    const fighter = cell && units.find(unit => unit.col === cell.col && unit.row === cell.row);
    return fighter ? { location: 'army', id: fighter.id } : null;
  }
  if (overlay?.id === 'barracks-panel' && barracksSelectedId === null) {
    const button = event.target.closest?.('[data-barracks-unit-id]');
    if (button) return { location: 'reserve', id: Number(button.dataset.barracksUnitId) };
  }
  return null;
}

function startDragMerge(source, point) {
  if (!canEditFormation() || transforming || pendingMerge || pendingRecruitId || movingId
    || !byId('offline-rewards-panel').hidden || !canMerge(source)) return false;
  const fighter = getMergeSource(source);
  const returnTo = overlay ? { id: overlay.id, opener: overlayOpener,
    scrollTop: overlay.querySelector('.menu-card').scrollTop, page: barracksPage } : null;
  const ghost = document.createElement('div');
  ghost.className = 'unit-drag-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  const portrait = document.createElement('img');
  portrait.src = scene.getUnitArt(fighter.type, fighter.level);
  portrait.alt = ''; portrait.draggable = false;
  const label = document.createElement('span');
  label.textContent = `Lv. ${fighter.level}`;
  ghost.append(portrait, label);
  document.body.append(ghost);
  draggedMerge = { source, ghost, returnTo, targetId: null };
  // Only the floating preview moves; ownership stays untouched until a legal drop.
  closeOverlay(false);
  document.body.classList.add('unit-dragging');
  refresh(); moveDragMerge(point);
  return true;
}

function dragTargetAt(point) {
  if (!canEditFormation() || overlay || !byId('offline-rewards-panel').hidden
    || document.elementFromPoint(point.x, point.y) !== byId('army-map')) return null;
  const cell = armyScene.getCellAt(point.x, point.y);
  return cell && units.find(unit => unit.col === cell.col && unit.row === cell.row)?.id;
}

function moveDragMerge(point) {
  if (!draggedMerge) return;
  const targetId = dragTargetAt(point);
  draggedMerge.targetId = getMergeResult(units, reserve, draggedMerge.source, targetId).ok ? targetId : null;
  const { ghost } = draggedMerge;
  ghost.style.left = `${point.x}px`; ghost.style.top = `${point.y}px`;
  ghost.classList.toggle('is-valid', draggedMerge.targetId !== null);
  renderScene();
}

function clearDragMerge() {
  const previous = draggedMerge;
  draggedMerge = null;
  previous?.ghost.remove();
  document.body.classList.remove('unit-dragging');
  return previous;
}

function cancelDragMerge() {
  const previous = clearDragMerge();
  if (!previous) return;
  if (previous.returnTo) {
    barracksPage = previous.returnTo.page;
    setOverlay(previous.returnTo.id, previous.returnTo.opener);
    refresh();
    overlay.querySelector('.menu-card').scrollTop = previous.returnTo.scrollTop;
  } else refresh();
}

function dropDragMerge(source, point) {
  const targetId = dragTargetAt(point);
  // Check the current roster again: income and automatic waves keep running during a drag.
  if (transforming || !getMergeResult(units, reserve, source, targetId).ok) {
    cancelDragMerge(); return;
  }
  clearDragMerge();
  mergeInto(targetId, source);
  byId('army-map').focus({ preventScroll: true });
}

function refreshReserve(selected) {
  const section = byId('reserve-section');
  section.hidden = !!selectedLockedCell || (!selectedEmptyCell && !selected);
  const pageCount = Math.max(1, Math.ceil(reserve.length / RESERVE_PAGE_SIZE));
  reservePage = Math.max(0, Math.min(reservePage, pageCount - 1));
  byId('reserve-count').textContent = reserve.length;
  byId('reserve-empty').hidden = reserve.length > 0;
  byId('reserve-pagination').hidden = pageCount === 1;
  byId('reserve-prev').disabled = reservePage === 0;
  byId('reserve-next').disabled = reservePage >= pageCount - 1;
  byId('reserve-page').textContent = `${reservePage + 1} / ${pageCount}`;
  byId('reserve-options').innerHTML = reserve.slice(reservePage * RESERVE_PAGE_SIZE, (reservePage + 1) * RESERVE_PAGE_SIZE).map(unit => {
    const portrait = scene?.getUnitArt(unit.type, unit.level);
    return `<button class="reserve-card" data-reserve-id="${unit.id}" type="button" aria-label="${selected ? 'Replace with' : 'Deploy'} ${types[unit.type].name}, level ${unit.level}">${portrait ? `<img src="${portrait}" alt="" />` : ''}<strong>${types[unit.type].name}</strong><small>Lv. ${unit.level}</small></button>`;
  }).join('');
}

function formatUpgradeTime(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    : `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function refreshBarracksUpgrade() {
  const info = getBarracksUpgrade(barracks, recruitment);
  const upgrading = info.status === 'upgrading' || info.status === 'ready';
  const unlocked = info.lancerUnlocked;
  const unavailable = !canEditFormation() || transforming;
  byId('barracks-upgrade-gold').textContent = gold;
  const portrait = scene?.getUnitArt('lancer', getRecruitProgress(recruitment, 'lancer').level);
  byId('barracks-lancer-art').hidden = !portrait;
  if (portrait) byId('barracks-lancer-art').src = portrait;
  byId('lancer-recruitment').classList.toggle('is-locked', !unlocked);
  byId('lancer-recruitment-chance').textContent = unlocked ? '20%' : 'Locked';
  byId('lancer-recruitment-training').hidden = !unlocked;
  byId('barracks-upgrade-state').hidden = unlocked;
  byId('barracks-upgrade-state').textContent = upgrading ? `Barracks II · ${formatUpgradeTime(info.remainingMs)}`
    : info.canStart ? 'Unlock with Barracks II'
    : `Requires Swordsman Lv. ${info.requiredRecruitLevel} · now Lv. ${info.recruitLevel}`;
  byId('barracks-upgrade-note').hidden = unlocked;
  byId('barracks-upgrade-note').textContent = upgrading ? 'Building continues offline.'
    : info.canStart ? '1 hour · continues offline · first Lancer guaranteed'
    : 'Raise its recruitment level at the Market.';
  byId('barracks-upgrade-progress').hidden = !upgrading;
  byId('barracks-upgrade-progress').value = info.durationMs - info.remainingMs;
  byId('barracks-upgrade-progress').max = info.durationMs;
  byId('barracks-upgrade-progress').setAttribute('aria-label', `Barracks construction: ${formatUpgradeTime(info.remainingMs)} remaining`);
  const start = byId('barracks-start-upgrade');
  start.hidden = !info.canStart;
  start.disabled = unavailable || !info.canStart || gold < info.cost;
  start.textContent = `Upgrade Barracks II · ${info.cost} gold`;
  start.setAttribute('aria-label', `Upgrade Barracks to level 2 for ${info.cost} gold. Takes 1 hour.`);
  const finish = byId('barracks-finish-upgrade');
  finish.hidden = !upgrading;
  finish.disabled = unavailable || info.remainingMs === 0 || gold < info.speedUpCost;
  finish.textContent = `Finish now · ${info.speedUpCost} gold`;
  byId('barracks-go-market').hidden = !barracks.firstLancerPending;
  byId('barracks-upgrade-pricing').hidden = !upgrading;
}

byId('barracks-start-upgrade').addEventListener('click', () => {
  if (!canEditFormation() || overlay?.id !== 'market-info-panel' || transforming) return;
  const result = startBarracksUpgrade(barracks, recruitment, gold);
  if (!result.ok) { refresh(); return; }
  gold = result.gold;
  save(); refresh();
  byId('market-info-panel').querySelector('[data-close-overlay]').focus({ preventScroll: true });
});
byId('barracks-finish-upgrade').addEventListener('click', () => {
  if (!canEditFormation() || overlay?.id !== 'market-info-panel' || transforming) return;
  const result = speedUpBarracks(barracks, gold);
  // Save natural completion too if the last second elapsed between rendering and tapping.
  gold = result.gold;
  save(); refresh();
  if (barracks.level === 2) byId('barracks-go-market').focus({ preventScroll: true });
});
byId('barracks-go-market').addEventListener('click', () => {
  closeOverlay(false);
  byId('transform-slave').focus({ preventScroll: true });
});

function refreshBarracks() {
  const pageCount = Math.max(1, Math.ceil(reserve.length / BARRACKS_PAGE_SIZE));
  barracksPage = Math.max(0, Math.min(barracksPage, pageCount - 1));
  byId('barracks-count').textContent = reserve.length;
  byId('barracks-gold').textContent = gold;
  byId('barracks-empty').hidden = reserve.length > 0;
  byId('barracks-pagination').hidden = pageCount === 1;
  byId('barracks-prev').disabled = barracksPage === 0;
  byId('barracks-next').disabled = barracksPage >= pageCount - 1;
  byId('barracks-page').textContent = `${barracksPage + 1} / ${pageCount}`;
  byId('barracks-options').innerHTML = reserve.slice(barracksPage * BARRACKS_PAGE_SIZE, (barracksPage + 1) * BARRACKS_PAGE_SIZE).map(unit => {
    const portrait = scene?.getUnitArt(unit.type, unit.level);
    return `<button class="barracks-unit" data-barracks-unit-id="${unit.id}" type="button" aria-label="${types[unit.type].name}, level ${unit.level}. View details." aria-controls="barracks-detail">${portrait ? `<img src="${portrait}" alt="" />` : ''}<span class="barracks-unit-level">Lv. ${unit.level}</span></button>`;
  }).join('');
  const selected = reserve.find(unit => unit.id === barracksSelectedId);
  if (!selected) barracksSelectedId = null;
  byId('barracks-list').hidden = !!selected;
  byId('barracks-detail').hidden = !selected;
  byId('barracks-back').hidden = !selected;
  byId('barracks-feedback').hidden = !!selected;
  byId('barracks-title').textContent = selected ? 'Unit details' : 'Barracks';
  if (selected) {
    const stats = getUnitStats(selected.type, selected.level);
    const portrait = scene?.getUnitArt(selected.type, selected.level);
    const lastFighter = units.length + reserve.length <= 1;
    const unavailable = !canEditFormation() || transforming;
    byId('barracks-detail').innerHTML = `<div class="barracks-detail-unit">${portrait ? `<img src="${portrait}" alt="" />` : ''}<div class="barracks-detail-copy"><strong>${types[selected.type].name}</strong><small>Lv. ${selected.level}</small></div></div><div class="barracks-detail-stats"><span><b>HP</b><strong>${stats.hp}</strong></span><span><b>Attack</b><strong>${stats.damage}</strong></span>${selected.type === 'healer' ? `<span><b>Healing</b><strong>${stats.heal}</strong></span>` : ''}</div><div class="barracks-detail-actions">${mergeButtonMarkup({ location: 'reserve', id: selected.id }, unavailable)}<button class="battle-button" data-barracks-recruit-id="${selected.id}" type="button"${unavailable ? ' disabled' : ''}>Recruit</button><button class="barracks-sell" data-barracks-sell-id="${selected.id}" type="button" aria-label="Sell ${types[selected.type].name}, level ${selected.level}, for ${SELL_PRICE} gold"${unavailable || lastFighter ? ' disabled' : ''}><span>Sell</span><span class="coin-icon" aria-hidden="true"></span><span>${SELL_PRICE}</span></button></div><p class="barracks-detail-note">${mergeDescription({ location: 'reserve', id: selected.id })}</p>${lastFighter ? '<p class="barracks-detail-note">Keep at least one fighter.</p>' : ''}`;
  } else byId('barracks-detail').replaceChildren();
}

function showBarracksList() {
  const previousId = barracksSelectedId;
  barracksSelectedId = null;
  refresh();
  (byId('barracks-options').querySelector(`[data-barracks-unit-id="${previousId}"]`)
    ?? byId('barracks-options').querySelector('button')
    ?? byId('barracks-panel').querySelector('[data-close-overlay]')).focus({ preventScroll: true });
}

function sellReserve(ids) {
  if (!canEditFormation() || overlay?.id !== 'barracks-panel' || transforming) return;
  const sold = reserve.filter(unit => ids.has(unit.id));
  if (!sold.length || units.length + reserve.length - sold.length < 1) return;
  // Ownership and proceeds are saved together; received counts and deployed fighters never change.
  reserve = reserve.filter(unit => !ids.has(unit.id));
  gold += sold.length * SELL_PRICE;
  saveFormation(); refresh();
  byId('barracks-feedback').textContent = `${sold.length} ${sold.length === 1 ? 'fighter sold' : 'fighters sold'} · +${sold.length * SELL_PRICE} gold`;
}

byId('barracks-prev').addEventListener('click', () => { barracksPage -= 1; refresh(); });
byId('barracks-next').addEventListener('click', () => { barracksPage += 1; refresh(); });
byId('barracks-back').addEventListener('click', showBarracksList);
byId('barracks-options').addEventListener('click', event => {
  if (!canEditFormation() || overlay?.id !== 'barracks-panel' || transforming) return;
  const button = event.target.closest('[data-barracks-unit-id]');
  const fighter = button && reserve.find(unit => unit.id === Number(button.dataset.barracksUnitId));
  if (!fighter) return;
  barracksSelectedId = fighter.id;
  refresh();
  byId('barracks-back').focus({ preventScroll: true });
});
byId('barracks-detail').addEventListener('click', event => {
  if (!canEditFormation() || overlay?.id !== 'barracks-panel' || transforming || barracksSelectedId === null) return;
  const mergeButton = event.target.closest('[data-barracks-merge-id]');
  if (mergeButton) {
    if (!mergeButton.disabled) beginMerge({ location: 'reserve', id: Number(mergeButton.dataset.barracksMergeId) });
    return;
  }
  const sellButton = event.target.closest('[data-barracks-sell-id]');
  if (sellButton) {
    if (!sellButton.disabled) sellReserve(new Set([Number(sellButton.dataset.barracksSellId)]));
    return;
  }
  const button = event.target.closest('[data-barracks-recruit-id]');
  const fighter = button && !button.disabled && reserve.find(unit => unit.id === Number(button.dataset.barracksRecruitId));
  if (!fighter) return;
  pendingMerge = null;
  pendingRecruitId = fighter.id;
  selectedId = movingId = selectedLockedCell = selectedEmptyCell = null;
  closeOverlay(false); refresh();
  byId('army-map').focus({ preventScroll: true });
  tell('Choose a tile.');
});

function changeReservePage(delta) {
  reservePage += delta;
  refresh();
  const button = byId(delta < 0 ? 'reserve-prev' : 'reserve-next');
  // A newly disabled page arrow loses focus; retain keyboard access to the dialog.
  (button.disabled ? byId(delta < 0 ? 'reserve-next' : 'reserve-prev') : button).focus({ preventScroll: true });
}
byId('reserve-prev').addEventListener('click', () => changeReservePage(-1));
byId('reserve-next').addEventListener('click', () => changeReservePage(1));
byId('reserve-options').addEventListener('click', event => {
  if (!canEditFormation() || overlay?.id !== 'unit-panel' || selectedLockedCell) return;
  const button = event.target.closest('[data-reserve-id]');
  const index = button ? reserve.findIndex(unit => unit.id === Number(button.dataset.reserveId)) : -1;
  if (index < 0) return;
  const selected = units.find(unit => unit.id === selectedId);
  const key = selected ? cellKey(selected.col, selected.row) : selectedEmptyCell;
  if (!key || !progression.unlockedCells.includes(key)) return;
  placeReserveFighter(reserve[index].id, key);
});

function placeReserveFighter(id, key) {
  if (!canEditFormation() || !progression.unlockedCells.includes(key)) return false;
  const index = reserve.findIndex(unit => unit.id === id);
  if (index < 0) return false;
  const [col, row] = key.split(':').map(Number);
  const occupied = units.find(unit => unit.col === col && unit.row === row);
  const [fighter] = reserve.splice(index, 1);
  if (occupied) {
    reserve.splice(index, 0, { id: occupied.id, type: occupied.type, level: occupied.level });
    units = units.filter(unit => unit.id !== occupied.id);
  }
  units.push({ ...fighter, col, row });
  // Selection alone changes no ownership; commit both sides only when a tile is chosen.
  pendingRecruitId = selectedId = movingId = selectedLockedCell = selectedEmptyCell = null;
  saveFormation(); closeOverlay(false); refresh();
  byId('army-map').focus({ preventScroll: true });
  tell(battle ? 'Next wave ready.' : 'Unit deployed.');
  return true;
}

function openCellPicker() {
  setOverlay('unit-panel', byId('army-map'));
  refresh();
}

function onCell({ col, row }) {
  if (!canEditFormation() || overlay || col < 0 || col > 4 || row < 0 || row > 2) return;
  const key = cellKey(col, row);
  if (pendingMerge) {
    mergeInto(units.find(unit => unit.col === col && unit.row === row)?.id);
    return;
  }
  selectedEmptyCell = null;
  if (!progression.unlockedCells.includes(key)) {
    if (movingId) { tell('Choose a tile.'); return; }
    selectedId = null;
    selectedLockedCell = key;
    openCellPicker(); return;
  }
  selectedLockedCell = null;
  if (pendingRecruitId) {
    placeReserveFighter(pendingRecruitId, key);
    return;
  }
  const occupied = units.find(unit => unit.col === col && unit.row === row);
  if (movingId) {
    const moving = units.find(unit => unit.id === movingId);
    if (moving) {
      // Save both positions together; the current battle keeps its existing fighter snapshot.
      if (occupied && occupied !== moving) Object.assign(occupied, { col: moving.col, row: moving.row });
      Object.assign(moving, { col, row });
    }
    movingId = selectedId = null;
    saveFormation(); refresh(); return;
  }
  selectedId = occupied?.id ?? null;
  selectedEmptyCell = occupied ? null : key;
  openCellPicker();
}


byId('selection-panel').addEventListener('click', event => {
  if (!canEditFormation() || overlay?.id !== 'unit-panel') return;
  const button = event.target.closest('[data-action]'), action = button?.dataset.action;
  if (!action || button.disabled) return;
  if (action === 'cancel') { closeOverlay(); return; }
  if (action === 'unlock-cell') {
    const result = unlockCell(progression, gold, selectedLockedCell);
    if (result.unlocked) {
      gold = result.gold;
      selectedEmptyCell = selectedLockedCell;
      selectedLockedCell = null;
      if (pendingRecruitId && placeReserveFighter(pendingRecruitId, selectedEmptyCell)) return;
      saveFormation(); refresh(); tell('Tile unlocked.');
    }
    return;
  }
  const selected = units.find(unit => unit.id === selectedId);
  if (!selected) return;
  if (action === 'merge') { beginMerge({ location: 'army', id: selected.id }); return; }
  if (action === 'move') {
    movingId = selected.id;
    closeOverlay(); refresh(); resumeFrames(); return;
  }
  if (action === 'remove') {
    if (battle && units.length === 1) return;
    // Removing never converts free fighters or earned levels into gold.
    reserve.push({ id: selected.id, type: selected.type, level: selected.level });
    units = units.filter(unit => unit.id !== selected.id);
    selectedEmptyCell = cellKey(selected.col, selected.row);
    selectedId = movingId = null;
    tell('In Barracks.');
  }
  saveFormation(); refresh();
});

function cancelArmyMove() {
  pendingRecruitId = null;
  pendingMerge = null;
  movingId = selectedId = null;
  refresh(); byId('army-map').focus({ preventScroll: true });
}
byId('cancel-army-move').addEventListener('click', cancelArmyMove);
let keyboardCell = { col: 2, row: 0 };
byId('army-map').addEventListener('keydown', event => {
  if (overlay || !canEditFormation()) return;
  if (event.key === 'Escape' && (movingId || pendingRecruitId || pendingMerge)) { event.preventDefault(); cancelArmyMove(); return; }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Enter' || event.key === ' ') { onCell(keyboardCell); return; }
  keyboardCell.col = Math.max(0, Math.min(4, keyboardCell.col + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0)));
  keyboardCell.row = Math.max(0, Math.min(2, keyboardCell.row + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0)));
  byId('army-map').setAttribute('aria-label', `Army tile. Row ${keyboardCell.row + 1}, column ${keyboardCell.col + 1}. Press Enter to choose.`);
});

byId('reset').addEventListener('click', () => {
  if (battle) return;
  if (!resetArmed) {
    resetArmed = true;
    byId('reset-confirmation').hidden = false;
    byId('reset').setAttribute('aria-label', 'Confirm reset run');
    byId('reset').title = 'Confirm reset run';
    return;
  }
  units = []; reserve = []; recruitment = createRecruitment(); reservePage = 0;
  barracks = createBarracks();
  hero = createHero();
  barracksPage = 0; barracksSelectedId = null; starterSupplyGranted = true;
  pendingRecruitId = null;
  pendingMerge = null;
  clearTimeout(transformTimer); finishRecruitReveal();
  clearTimeout(marketArrivalTimer);
  marketArrivalTotal = pendingMarketArrival = 0;
  byId('market-arrival').hidden = true;
  byId('transform-slave').classList.remove('is-arriving');
  gold = STARTING_GOLD; nextId = 1;
  clearedWaves = 0;
  economy = createEconomy(); economyLastTick = performance.now(); economyUnsaved = 0;
  economy.slaves = STARTING_SLAVES;
  checkpointTreasury(economy); pendingOfflineGold = pendingOfflineSlaves = 0;
  progression = createProgression(); selectedLockedCell = selectedEmptyCell = null;
  battleSpeed = 1;
  selectedId = movingId = lastOutcome = null;
  closeOverlay();
  save(); refresh(); tell('Supplies ready.');
});

function renderScene() {
  // Both canvases show the same level, including preparation, defeat and campaign replay.
  const levelNumber = getWaveDefinition(battle?.waveNumber ?? nextWaveNumber()).levelNumber;
  scene?.render({ units, selectedId: null, movingId: null, placementType: null, battle, time: visualTime, levelNumber,
    unlockedCells: progression.unlockedCells, heroState: hero });
  const selected = units.find(unit => unit.id === selectedId);
  const recruit = reserve.find(unit => unit.id === pendingRecruitId);
  armyScene?.render({ units, selectedId, movingId, levelNumber,
    mergeTargets: mergeTargetIds, mergeLevel,
    draggedId: draggedMerge?.source.location === 'army' ? draggedMerge.source.id : null,
    dragTargetId: draggedMerge?.targetId ?? null,
    placementType: recruit?.type ?? (movingId ? selected?.type : null), replacingFromReserve: !!recruit,
    placementLevel: recruit?.level ?? selected?.level ?? 1, battle: null, time: visualTime,
    unlockedCells: progression.unlockedCells, nextUnlockCost: nextCellCost(progression), selectedLockedCell, selectedEmptyCell });
}

function refreshBattleHud() {
  if (!battle) return;
  refreshPhaseLabel();
  const alive = battle.allies.filter(unit => unit.hp > 0).length;
  const canvas = byId('battle');
  canvas.dataset.phase = battle.phase;
  canvas.dataset.combat = JSON.stringify({ phase: battle.phase, wave: battle.waveNumber, level: battle.wave.levelNumber, round: battle.wave.roundNumber, waveInRound: battle.wave.waveInRound, paused, speed: battleSpeed, elapsed: Math.round(battle.elapsed * 10) / 10,
    kills: battle.kills, total: battle.total, reward: battle.reward, alive, castleHp: Math.ceil(battle.castle.hp),
    hero: { hp: Math.ceil(battle.hero.hp), maxHp: battle.hero.maxHp, level: battle.hero.level, action: battle.hero.action },
    guards: battle.allies.map(unit => ({ id: unit.id, type: unit.type, action: unit.action,
      x: Math.round(unit.x), y: Math.round(unit.y), hp: Math.ceil(unit.hp) })) });
  canvas.setAttribute('aria-label', `${waveLabel(battle.waveNumber)}. ${battle.kills} of ${battle.total} enemies defeated. ${alive} guards alive. Castle ${Math.ceil(battle.castle.hp)} health. St. Knihor ${Math.ceil(battle.hero.hp)} health. ${paused ? 'Paused.' : ''}`);
}

function showResult() {
  if (!battle || battle.resultRecorded) return;
  battle.resultRecorded = true;
  battleAudio.setActive(false);
  lastOutcome = battle.phase;
  paused = false;
  resultAge = 0;
  const won = battle.phase === 'victory';
  // Record hero XP with the battle outcome once; talent changes apply to a fresh battle snapshot.
  battle.heroXp = awardHeroXp(hero, { waveNumber: battle.waveNumber, kills: battle.kills, total: battle.total, won });
  const firstClearBonus = won ? claimFirstClear(progression, battle.waveNumber) : 0;
  battle.firstClearBonus = firstClearBonus;
  gold += firstClearBonus;
  battle.reward += firstClearBonus;
  // Commit either outcome once, including the retreat, before showing the result screen.
  clearedWaves = progressionAfterBattle(battle.waveNumber, won, TOTAL_WAVES);
  save();
  presentResult();
}

function presentResult() {
  if (!battle || battle.phase === 'running') return;
  autoNextRemaining = autoWaves ? AUTO_WAVE_DELAY : null;
  byId('result-panel').hidden = autoWaves;
  refresh();
  if (autoWaves) {
    if (!overlay && !movingId && !pendingRecruitId && !pendingMerge) byId('army-map').focus({ preventScroll: true });
    resumeFrames();
    return;
  }
  const won = battle.phase === 'victory';
  const firstClearBonus = battle.firstClearBonus ?? 0;
  const panel = byId('result-panel');
  panel.classList.toggle('is-defeat', !won);
  const wave = battle.wave;
  const roundCleared = won && wave.waveInRound === WAVES_PER_ROUND;
  const levelCleared = roundCleared && wave.roundNumber === ROUNDS_PER_LEVEL;
  byId('result-eyebrow').textContent = `${wave.levelName.toUpperCase()} · ${waveLabel(wave.number).toUpperCase()} / ${WAVES_PER_ROUND}`;
  byId('result-title').textContent = won ? runComplete() ? 'Campaign cleared!' : levelCleared ? `Level ${wave.levelNumber} cleared!` : roundCleared ? `Round ${wave.levelNumber}-${wave.roundNumber} cleared!` : `Wave ${wave.waveInRound} cleared!` : 'The castle has fallen';
  byId('result-copy').textContent = won
    ? runComplete() ? `Your guard survived all ${LEVEL_COUNT} levels and ${TOTAL_WAVES} waves.` : `Up next: ${waveLabel(nextWaveNumber())}${levelCleared ? ` in ${getWaveDefinition(nextWaveNumber()).levelName}` : `, ${getWaveDefinition(nextWaveNumber()).name}`}. Your army, hero and castle recover fully.`
    : `${battle.waveNumber > 1 ? 'Fall back to' : 'Regroup for'} ${waveLabel(nextWaveNumber())}. Your guard, gold and buildings are kept. Your army recovers fully.`;
  if (firstClearBonus) byId('result-copy').textContent += ` First clear: +${firstClearBonus} gold.`;
  if (battle.heroXp?.gained) byId('result-copy').textContent += ` St. Knihor: +${battle.heroXp.gained} XP${battle.heroXp.leveledUp ? ` · Level ${battle.heroXp.level}` : ''}.`;
  byId('return-prep').textContent = won && runComplete() ? 'Return to camp' : `Prepare ${waveLabel(nextWaveNumber())}`;
  byId('result-stats').innerHTML = `<span>${battle.kills} / ${battle.total} defeated</span><strong><span class="coin-icon" aria-hidden="true"></span>+${battle.reward} gold</strong>`;
  panel.hidden = false;
  if (!overlay && !movingId && !pendingRecruitId && !pendingMerge) byId('return-prep').focus({ preventScroll: true });
}

function startWave() {
  if (battle || !scene || !units.length || !telegram.isActive) return;
  // Keep the cell picker or move action open across automatic wave transitions.
  if (runComplete()) { clearedWaves = 0; lastOutcome = null; save(); }
  battle = createBattle(units, nextWaveNumber(), hero);
  paused = false; resultAge = 0; autoNextRemaining = null;
  battleAudio.setActive(true);
  void battleAudio.unlock();
  hideNotice();
  refresh();
  resumeFrames();
}
byId('start-wave').addEventListener('click', startWave);

function clearBattleState() {
  stopFrames();
  battle = null; paused = false;
  autoNextRemaining = null; resultAge = 0;
  battleAudio.setActive(false);
  byId('result-panel').hidden = true;
  delete byId('battle').dataset.combat;
  byId('battle').dataset.phase = 'preparation';
}

function returnToFormation() {
  clearBattleState();
  refresh(); resumeFrames();
  if (!overlay && !movingId && !pendingRecruitId && !pendingMerge) byId('start-wave').focus({ preventScroll: true });
}

byId('return-prep').addEventListener('click', () => {
  if (!battle || battle.phase === 'running') return;
  returnToFormation();
});

byId('auto-waves').addEventListener('click', () => {
  autoWaves = !autoWaves;
  save();
  if (battle && battle.phase !== 'running') presentResult(); else refresh();
});



// Telegram can minimize a Mini App without hiding the document; both lifecycle signals stop play.
function resetFrameRate() { frameRateMeter.reset(); fpsLabel.textContent = '— FPS'; }
function stopFrames() { cancelAnimationFrame(frameId); frameId = 0; lastFrame = 0; resetFrameRate(); }
function resumeFrames() {
  if (!destroyed && !frameId && scene && telegram.isActive && !paused) frameId = requestAnimationFrame(frame);
}
function frame(timestamp) {
  frameId = 0;
  if (destroyed || !telegram.isActive || paused) { lastFrame = 0; resetFrameRate(); return; }
  if (lastFrame && timestamp - lastFrame < 1000 / 30) { resumeFrames(); return; }
  const realDelta = lastFrame ? Math.max(0, (timestamp - lastFrame) / 1000) : 0;
  const dt = Math.min(realDelta, .1);
  lastFrame = timestamp;
  const battleDt = battle?.phase === 'running' ? battleFrameDelta(dt, battleSpeed) : dt;
  visualTime += battleDt;
  if (battle) {
    const wasRunning = battle.phase === 'running';
    // Movement, casts, projectiles, spawns and enrage share the same scaled clock.
    const events = updateBattle(battle, battleDt);
    for (const event of events) if (event.type === 'bow-shot') battleAudio.playBowShot();
    let reward = 0, slavesGained = 0;
    for (const event of events) if (event.type === 'gold') {
      reward += event.amount;
      slavesGained += rollSlaveDrop(economy);
    }
    if (reward || slavesGained) {
      gold += reward; save();
      refresh();
      if (slavesGained) showMarketArrival(slavesGained);
    }
    hudElapsed += dt;
    if (hudElapsed >= .15) { refreshBattleHud(); hudElapsed = 0; }
    if (wasRunning && battle.phase !== 'running') showResult();
    if (battle.phase !== 'running') {
      resultAge += dt;
      // Countdown follows visible real time, not ×1/×2/×3 or the capped combat timestep.
      if (!wasRunning && autoNextRemaining !== null) {
        autoNextRemaining = Math.max(0, autoNextRemaining - realDelta);
        if (autoNextRemaining === 0) {
          clearBattleState();
          startWave();
        }
      }
    }
  }
  renderScene();
  // Count rendered frames after the existing 30-FPS gate, using wall time rather than battle speed.
  const fps = frameRateMeter.record(timestamp);
  if (fps !== null) fpsLabel.textContent = `${fps} FPS`;
  if (!battle || battle.phase === 'running' || autoNextRemaining !== null || resultAge < 1.3 || armyScene) resumeFrames();
}

function pauseForInactivity() {
  unitDrag?.cancel();
  tickEconomy(); economyActive = false; save();
  refreshMarketHint();
  levelMusic.setActive(false);
  battleAudio.setActive(false);
  stopFrames();
  if (hasActiveBattle()) { paused = true; refresh(); }
}

function activateGame() {
  if (!economyActive) collectOfflineIncome();
  economyLastTick = performance.now(); economyActive = true;
  paused = false;
  battleAudio.setActive(battle?.phase === 'running');
  if (battle?.phase === 'running') void battleAudio.unlock();
  refresh();
  showOfflineIncome();
  showMarketArrival();
  resumeFrames();
}

function onPageHide(event) {
  unitDrag?.cancel();
  levelMusic.setActive(false);
  battleAudio.setActive(false);
  telegram.suspend();
  stopFrames();
  if (!event.persisted) {
    destroyed = true;
    battleAudio.destroy();
    levelMusic.destroy();
    telegram.destroy();
    clearTimeout(toastTimer);
    clearTimeout(transformTimer);
    clearTimeout(marketArrivalTimer);
    clearInterval(economyTimer);
    window.removeEventListener('resize', fitPortraitPreview);
    layoutObserver?.disconnect();
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    document.removeEventListener('pointerup', unlockLevelMusic, true);
    document.removeEventListener('keydown', unlockLevelMusic, true);
    scene?.destroy();
    heroUI?.destroy();
    armyScene?.destroy();
    unitDrag?.destroy();
  }
}

function onPageShow(event) {
  if (event.persisted && !destroyed) { telegram.resume(); fitPortraitPreview(); refresh(); resumeFrames(); }
}
window.addEventListener('pagehide', onPageHide);
window.addEventListener('pageshow', onPageShow);

// The result is a small modal; keyboard focus stays inside it until returning to formation.
byId('result-panel').addEventListener('keydown', event => {
  if (event.key === 'Tab') { event.preventDefault(); byId('return-prep').focus(); }
  if (event.key === 'Escape') byId('return-prep').click();
});

buildWaveTrack();
unitDrag = setupUnitDrag({ getSource: dragSourceAt, onStart: startDragMerge,
  onMove: moveDragMerge, onDrop: dropDragMerge, onCancel: cancelDragMerge });
refresh();
const economyTimer = setInterval(tickEconomy, 1000);
try {
  const [loadedScene, loadedArmy] = await Promise.all([
    createScene(byId('battle'), { placementGrid: false, onHero: () => { setOverlay('hero-panel', byId('open-hero')); refresh(); } }),
    createScene(byId('army-map'), { formationOnly: true, onCell }),
  ]);
  if (destroyed) { loadedScene.destroy(); loadedArmy.destroy(); }
  else {
    scene = loadedScene; armyScene = loadedArmy;
    refresh();
    showOfflineIncome();
    resumeFrames();
  }
} catch (error) {
  if (!destroyed) {
    console.error(error);
    tell('Reload the map.');
  }
}
