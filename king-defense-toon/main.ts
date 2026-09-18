import { createScene } from './scene.ts';
import { getOnboardingStep, restoreOnboardingCompleted } from './onboarding.ts';
import { createOnboardingGuide } from './onboarding-ui.ts';
import './onboarding.css';
import { UNIT_TYPES, isHealingUnit } from './units.ts';
import { BATTLE_VIEW, FORMATION_VIEW } from './field.ts';
import { createBattle, updateBattle } from './combat.ts';
import { WAVE_DEFINITIONS, WAVES_PER_ROUND, ROUNDS_PER_LEVEL, CAMPAIGN_VERSION, LEVEL_COUNT, getRoundWaves, getWaveDefinition } from './waves.ts';
import { setupTelegramAdapter } from './telegram.ts';
import { createBattleAudio } from './audio.ts';
import { createLevelMusic } from './music.ts';
import { DEFAULT_BATTLE_SPEED, MAX_REAL_FRAME_DELTA, battleFrameDelta, nextBattleSpeed } from './battle-speed.ts';
import { createFrameRateMeter } from './fps.ts';
import { createFramePacer } from './frame-pacer.ts';
import { createSaveStorage } from './save-storage.ts';
import { createEconomy, treasuryRate, treasuryUpgradeCost, accrueTreasury, checkpointTreasury, claimOfflineTreasury, TREASURY_OFFLINE_LIMIT_SECONDS, upgradeTreasury, rollSlaveDrop, progressionAfterBattle, advanceCaptureClock, CAPTURE_COOLDOWN, STARTER_CAPTURES, capturePityKills, captureDropChance } from './economy.ts';
import { MARKET_BUILD_COST, MARKET_PRODUCTION_SECONDS, MARKET_OFFLINE_LIMIT_SECONDS, buildMarket, accrueMarket, checkpointMarket, claimOfflineMarket } from './market.ts';
import { SAVE_KEY, STARTING_GOLD, createProgression, cellKey, nextCellCost, getCellAvailability, unlockCell, claimFirstClear } from './progression.ts';
import { RECRUIT_COST, RECRUIT_LEVEL_CAP, createRecruitment, getRecruitProgress, getRecruitChances, getElfRecruitUnlock, receiveRecruit } from './recruitment.ts';
import { ELF_RECRUITS, normalizeRecruitmentPool, isRecruitmentPoolUnlocked, canRecruitFromPool } from './recruitment-pools.ts';
import type { RecruitmentPool } from './recruitment-pools.ts';
import { renderElfRecruitment } from './recruitment-pool-ui.ts';
import { createForge, restoreForge, getForgedUnitStats, upgradeForge, FORGE_UPGRADES } from './forge.ts';
import { createForgeUI } from './forge-ui.ts';
import type { ForgeUI } from './forge-ui.ts';
import { CROPS, createFarm, plantCrop, harvestCrop } from './farm.ts';
import type { CropId } from './farm.ts';
import { createFarmUI } from './farm-ui.ts';
import type { FarmUI } from './farm-ui.ts';
import { createCapitol, upgradeCapitol, getCapitolStats } from './capitol.ts';
import { createCapitolUI } from './capitol-ui.ts';
import type { CapitolUI } from './capitol-ui.ts';
import { STARTING_SLAVES, SELL_PRICE, createBarracks, getBarracksUpgrade, completeBarracksUpgrade, startBarracksUpgrade, speedUpBarracks, consumeFirstLancerGuarantee } from './barracks.ts';
import { getMergeResult, getConnectResult } from './unit-merging.ts';
import { renderConnectPanel } from './connect-ui.ts';
import { setupUnitDrag } from './unit-drag.ts';
import { createHero, awardHeroXp } from './hero.ts';
import { addHeroXpEffect } from './hero-xp-effect.ts';
import { createHeroUI } from './hero-ui.ts';
import { byId } from './main-dom.ts';
import { restoreCampaignRoster } from './campaign-roster.ts';
import { reconcileArmyCapacity } from './army-capacity-migration.ts';
import { getUnitCellWidth, getUnitAtCell, canPlaceUnit, planFormationMove, reconcileUnitFootprints } from './unit-footprint.ts';
import { decodeCampaignSave } from './campaign-save.ts';
import type { GameElementId } from './main-dom.ts';
import type { Battle, BattlePhase } from './combat-types.ts';
import type { HeroXpResult } from './hero.ts';
import type { HeroUI } from './hero-ui.ts';
import type { ArmyUnit, Fighter, MergeSource } from './unit-merging.ts';
import type { UnitDragController, DragSourceEvent } from './unit-drag.ts';
import type { DragPoint } from './unit-drag-gesture.ts';
import type { Scene, SceneAssetState, GridCell } from './scene-types.ts';
import type { UnitType, UnitDefinition } from './units.ts';
import type { CellKey } from './progression.ts';
import type { BattleSpeed } from './battle-speed.ts';
import './style.css';
import './hero.css';
import './farm.css';
import './connect.css';

interface GameBattle extends Battle {
  resultRecorded?: boolean;
  heroXp?: HeroXpResult;
  firstClearBonus?: number;
}
interface DraggedMerge {
  source: MergeSource;
  targetId: number | null | undefined;
  ghost: HTMLDivElement;
  returnTo: { id: GameElementId; opener: HTMLElement | null; scrollTop: number; page: number } | null;
}
type LoadState = SceneAssetState | { status: 'loading' } | { status: 'error'; error: unknown };
type FocusElement = HTMLElement & { disabled?: boolean };
const frameRateMeter = createFrameRateMeter();
const framePacer = createFramePacer();
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

const types = Object.fromEntries(UNIT_TYPES.map(type => [type.id, type])) as Record<UnitType, UnitDefinition>;
const TOTAL_WAVES = WAVE_DEFINITIONS.length;
let gold = STARTING_GOLD, nextId = 1;
let units: ArmyUnit[] = [];
let reserve: Fighter[] = [], recruitment = createRecruitment(), reservePage = 0;
let barracksPage = 0, starterSupplyGranted = false;
let barracksSelectedId: number | null = null;
let barracks = createBarracks();
let recruitmentPool: RecruitmentPool = 'humans';
let forge = createForge(), forgeUI: ForgeUI | null = null;
let farm = createFarm(), farmUI: FarmUI | null = null;
let capitol = createCapitol(), capitolUI: CapitolUI | null = null;
const unitStatFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
let hero = createHero();
let heroUI: HeroUI | null = null;
let marketHintCompleted = false;
let onboardingCompleted = false;
const onboardingGuide = createOnboardingGuide(byId('app'), byId('army-map'));
let pendingRecruitId: number | null = null;
let pendingMerge: MergeSource | null = null;
let connectSelection: { recipient: MergeSource; sourceTab: 'army' | 'reserve'; donorIds: Set<number>; notice: string } | null = null;
const connectMarkupCache = new WeakMap<HTMLElement, string>();
let unitDrag: UnitDragController | null = null, draggedMerge: DraggedMerge | null = null;
let mergeTargetIds: number[] = [], mergeLevel = 0;
let transforming = false, transformTimer: ReturnType<typeof setTimeout> | undefined;
let marketArrivalTimer: ReturnType<typeof setTimeout> | undefined, marketArrivalTotal = 0, pendingMarketArrival = 0;
const RESERVE_PAGE_SIZE = 3;
const BARRACKS_PAGE_SIZE = 10;
let clearedWaves = 0;
let selectedId: number | null = null, movingId: number | null = null;
let scene: Scene | undefined, toastTimer: ReturnType<typeof setTimeout> | undefined;
let battle: GameBattle | null = null, paused = false, lastOutcome: BattlePhase | null = null;
let battleSpeed: BattleSpeed = DEFAULT_BATTLE_SPEED;
const AUTO_WAVE_DELAY = 2;
const AUTO_WAVES_DEFAULT_VERSION = 1;
let autoWaves = true, autoNextRemaining: number | null = null;
let armyScene: Scene | null = null;
let economy = createEconomy();
let pendingOfflineGold = 0, pendingOfflineSlaves = 0;
let pendingSlotRefund = 0, pendingReturnedFighters = 0, pendingClosedCells = 0;
let pendingForgeRefund = 0;
let offlineRewardFocus: FocusElement | null = null;
const offlineRewardInert = new Map<HTMLElement, boolean>();
let progression = createProgression(), selectedLockedCell: string | null = null, selectedEmptyCell: string | null = null;
let overlay: HTMLElement | null = null, overlayOpener: HTMLElement | null = null, resetArmed = false;
let frameId = 0, visualTime = 0, hudElapsed = 0, resultAge = 0;
let destroyed = false;
const assetStates: Record<'battle' | 'army', LoadState> = { battle: { status: 'loading' }, army: { status: 'loading' } };
const recoveryInert = new Map<HTMLElement, boolean>();
let recoveryFocus: FocusElement | null = null, resetSaveToken: symbol | null = null, recoveryResetArmed = false, recoveryUiScheduled = false;
const saveStorage = createSaveStorage<ReturnType<typeof saveSnapshot>>({ key: SAVE_KEY, getStorage: () => window.localStorage,
  decode: decodeCampaignSave,
});
const battleAudio = createBattleAudio();
const levelMusic = createLevelMusic({ onStateChange: refreshSoundButton });
const telegram = setupTelegramAdapter({ onDeactivate: pauseForInactivity, onActivate: activateGame });
const profileName = (window as Window & { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { first_name?: unknown } } } } }).Telegram?.WebApp?.initDataUnsafe?.user?.first_name;
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
  byId('music-volume').value = String(volume);
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
  levelMusic.setVolume(Number((event.target as HTMLInputElement).value) / 100);
  if (levelMusic.volume > 0) levelMusic.setMuted(false);
  void levelMusic.unlock();
  refreshSoundButton();
});
function unlockLevelMusic(event: PointerEvent | KeyboardEvent) {
  if (!event.isTrusted || (event.type === 'keydown' && ((event as KeyboardEvent).repeat || !['Enter', ' '].includes((event as KeyboardEvent).key)))) return;
  void levelMusic.unlock();
}
// Media starts only after a real gesture; game-speed changes never alter its playback rate.
document.addEventListener('pointerup', unlockLevelMusic, { capture: true, passive: true });
document.addEventListener('keydown', unlockLevelMusic, true);
refreshSoundButton();

function refreshSpeedButton() {
  const button = byId('battle-speed');
  button.textContent = `×${battleSpeed}`;
  button.setAttribute('aria-pressed', String(battleSpeed !== DEFAULT_BATTLE_SPEED));
  const label = `Battle speed: ${battleSpeed}×. Switch to ${nextBattleSpeed(battleSpeed)}×`;
  button.setAttribute('aria-label', label);
  button.title = label;
  byId('battle').dataset.speed = String(battleSpeed);
}

byId('battle-speed').addEventListener('click', () => {
  if (battle?.phase !== 'running' || !telegram.isActive) return;
  battleSpeed = nextBattleSpeed(battleSpeed);
  framePacer.reset();
  refreshSpeedButton();
});

// Balance v2 starts separately; the old v1 prototype save is deliberately never changed.
try {
  const loaded = saveStorage.load();
  const saved = loaded.ok ? loaded.value : null;
  if (saved && typeof saved.gold === 'number' && Number.isFinite(saved.gold) && saved.gold >= 0) {
    onboardingCompleted = restoreOnboardingCompleted(saved);
    starterSupplyGranted = saved.starterSupplyGranted === true;
    recruitment = createRecruitment(saved.recruitment);
    barracks = createBarracks(saved.barracks);
    recruitmentPool = normalizeRecruitmentPool(saved.recruitmentPool, barracks.level);
    const forgeMigration = restoreForge(saved.forge);
    forge = forgeMigration.forge;
    farm = createFarm(saved.farm);
    capitol = createCapitol(saved.capitol);
    hero = createHero(saved.hero);
    // Existing conversions also count as having learned this action before the hint existed.
    marketHintCompleted = saved.marketHintCompleted === true || Object.values(recruitment.received).some(count => count > 0);
    progression = createProgression(saved.progression);
    const restored = restoreCampaignRoster(saved.units, saved.reserve, progression);
    // Reconcile owned cells before reserving both cells of each mounted fighter.
    const capacityMigration = reconcileArmyCapacity(progression, restored, barracks.level);
    const footprintMigration = reconcileUnitFootprints(capacityMigration.units, capacityMigration.reserve, progression.unlockedCells);
    units = footprintMigration.units;
    // Personal levels survive reloads; receiving another fighter never rewrites an older one.
    reserve = footprintMigration.reserve;
    gold = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(saved.gold) + capacityMigration.refund + forgeMigration.refund);
    clearedWaves = Math.max(0, Math.min(TOTAL_WAVES, Math.floor(Number(saved.clearedWaves) || 0)));
    economy = createEconomy(saved.economy);
    const offlineRewards = savedFields(saved.offlineRewards);
    pendingOfflineGold = typeof offlineRewards.gold === 'number' && Number.isSafeInteger(offlineRewards.gold) && offlineRewards.gold > 0 ? offlineRewards.gold : 0;
    pendingOfflineSlaves = typeof offlineRewards.slaves === 'number' && Number.isSafeInteger(offlineRewards.slaves) && offlineRewards.slaves > 0 ? offlineRewards.slaves : 0;
    pendingSlotRefund = savedPositiveInteger(offlineRewards.slotRefund) + capacityMigration.refund;
    pendingReturnedFighters = savedPositiveInteger(offlineRewards.returnedFighters) + capacityMigration.movedCount + footprintMigration.movedCount;
    pendingClosedCells = savedPositiveInteger(offlineRewards.closedCells) + capacityMigration.removedCells.length;
    // Removing the retired ranks and crediting their gold in the same save makes
    // reloads idempotent; this receipt only acknowledges the already-paid refund.
    pendingForgeRefund = savedPositiveInteger(offlineRewards.forgeRefund) + forgeMigration.refund;
    // Enable the new default once for older saves; later explicit Off choices still persist.
    autoWaves = saved.autoWavesDefaultVersion === AUTO_WAVES_DEFAULT_VERSION ? saved.autoWaves !== false : true;
    nextId = units.length + reserve.length + 1;
    save();
  }
} catch (error) { console.error('Could not restore the campaign', error); }

function savedFields(value: unknown): Record<string, unknown> {
  return Object(value) as Record<string, unknown>;
}

function savedPositiveInteger(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : 0;
}

function isUnlockedCell(key: string): key is CellKey {
  return (progression.unlockedCells as readonly string[]).includes(key);
}

// A one-time starting supply replaces gold recruitment; spent supplies never refill on reload.
if (!starterSupplyGranted) {
  if (!units.length && !reserve.length && economy.slaves === 0) economy.slaves = STARTING_SLAVES;
  starterSupplyGranted = true;
  save();
}

function saveSnapshot() {
  return { campaignVersion: CAMPAIGN_VERSION, gold, units, reserve, recruitment, recruitmentPool, barracks, forge, farm, capitol, hero, starterSupplyGranted, marketHintCompleted, onboardingCompleted, clearedWaves, economy, progression, autoWaves, autoWavesDefaultVersion: AUTO_WAVES_DEFAULT_VERSION,
    offlineRewards: { gold: pendingOfflineGold, slaves: pendingOfflineSlaves,
      slotRefund: pendingSlotRefund, returnedFighters: pendingReturnedFighters, closedCells: pendingClosedCells,
      forgeRefund: pendingForgeRefund } };
}

function save() {
  const result = saveStorage.save(saveSnapshot());
  if (!result.ok) stopFrames();
  scheduleRecoveryUi();
  return result.ok;
}

function isRecovering() {
  return saveStorage.status !== 'ready' || Object.values(assetStates).some(state => state.status !== 'ready');
}

function scheduleRecoveryUi() {
  if (recoveryUiScheduled) return;
  recoveryUiScheduled = true;
  // Save failures can occur inside actions that then close a menu or replace DOM.
  // Capture focus/inert only after that action has settled, while the clock is already stopped.
  queueMicrotask(() => { recoveryUiScheduled = false; syncRecoveryUi(); });
}

function syncRecoveryUi() {
  if (destroyed) return;
  const storageError = saveStorage.status !== 'ready' && saveStorage.status !== 'unread';
  const assetError = Object.values(assetStates).some(state => state.status === 'error');
  const blocked = isRecovering();
  if (blocked) onboardingGuide.hide();
  const panel = byId('recovery-panel');
  const entering = blocked && panel.hidden;
  const leaving = !blocked && !panel.hidden;
  panel.hidden = !blocked;
  if (blocked) {
    if (entering) {
      recoveryFocus = (document.activeElement as FocusElement | null);
      unitDrag?.cancel();
      for (const child of Array.from(byId('app').children) as HTMLElement[]) {
        if (child === panel) continue;
        recoveryInert.set(child, child.inert);
        child.inert = true;
      }
    }
    stopFrames();
    battleAudio.setActive(false);
    levelMusic.setActive(false);
    byId('recovery-title').textContent = storageError ? 'Progress needs attention' : assetError ? 'Battlefield unavailable' : 'Loading battlefield';
    byId('recovery-description').textContent = storageError
      ? saveStorage.status === 'write-error' ? 'Progress is not saved. Keep this game open and retry.'
        : saveStorage.status === 'corrupt' ? 'Saved progress is damaged. Saving is paused to protect it.'
          : 'Saved progress could not be loaded. Saving is paused to protect it.'
      : assetError ? 'Some game images could not be loaded. Check your connection and retry. The battle is paused.'
        : 'Preparing your map and fighters. The battle is paused.';
    byId('recovery-retry').hidden = !storageError && !assetError;
    byId('recovery-reset').hidden = !['read-error', 'corrupt'].includes(saveStorage.status);
    if (entering) panel.focus({ preventScroll: true });
  } else {
    for (const [child, inert] of recoveryInert) child.inert = inert;
    recoveryInert.clear();
    if (recoveryFocus?.isConnected && !recoveryFocus.closest<HTMLElement>('[inert]')) recoveryFocus.focus({ preventScroll: true });
    recoveryFocus = null;
    recoveryResetArmed = false;
    byId('recovery-reset-confirmation').hidden = true;
    byId('recovery-reset').textContent = 'Reset saved game';
    if (leaving) {
      battleAudio.setActive(battle?.phase === 'running' && telegram.isActive && !paused);
      levelMusic.setActive(telegram.isActive);
      showOfflineIncome(); showMarketArrival();
      refreshOnboarding();
    }
    resumeFrames();
  }
}

function onAssetState(which: 'battle' | 'army', state: LoadState) {
  assetStates[which] = state;
  if (state.status !== 'ready') stopFrames();
  scheduleRecoveryUi();
}

function collectOfflineIncome() {
  if (saveStorage.status !== 'ready') return 0;
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
  if (!scene || !economyActive || isRecovering() || !byId('recovery-panel').hidden || (!pendingOfflineGold && !pendingOfflineSlaves && !pendingClosedCells && !pendingReturnedFighters && !pendingForgeRefund)) return;
  unitDrag?.cancel();
  const panel = byId('offline-rewards-panel');
  byId('offline-gold-reward').hidden = !pendingOfflineGold;
  byId('offline-slaves-reward').hidden = !pendingOfflineSlaves;
  byId('offline-gold-amount').textContent = `+${pendingOfflineGold}`;
  byId('offline-slaves-amount').textContent = `+${pendingOfflineSlaves}`;
  byId('offline-rewards-title').textContent = pendingClosedCells || pendingReturnedFighters ? 'Army space updated' : pendingForgeRefund ? 'Forge updated' : 'Welcome back!';
  byId('offline-rewards-description').textContent = pendingClosedCells
    ? `${pendingClosedCells} ${pendingClosedCells === 1 ? 'tile now requires' : 'tiles now require'} a Barracks upgrade. Your fighters and gold are safe.`
    : pendingReturnedFighters ? 'Panther Riders now need two adjacent tiles. Fighters without enough room are safe in Barracks.'
    : pendingForgeRefund ? 'Forge upgrades now apply to all fighters. Your gold for retired archer upgrades has been returned.'
      : 'Your buildings kept working.';
  byId('slot-refund-reward').hidden = !pendingClosedCells;
  byId('slot-refund-amount').textContent = `+${pendingSlotRefund}`;
  byId('forge-refund-reward').hidden = !pendingForgeRefund;
  byId('forge-refund-amount').textContent = `+${pendingForgeRefund}`;
  byId('returned-fighters-note').hidden = !pendingReturnedFighters;
  byId('returned-fighters-note').textContent = `${pendingReturnedFighters} ${pendingReturnedFighters === 1 ? 'fighter returned' : 'fighters returned'} to Barracks.`;
  byId('offline-storage-note').hidden = !pendingOfflineGold && !pendingOfflineSlaves;
  byId('collect-offline-rewards').textContent = pendingClosedCells || pendingReturnedFighters || pendingForgeRefund ? 'Continue' : 'Collect';
  if (!panel.hidden) return;
  panel.hidden = false;
  offlineRewardFocus = (document.activeElement as FocusElement | null);
  // Cover an open menu without discarding its selection or making its background interactive.
  for (const element of Array.from(byId('app').children) as HTMLElement[]) {
    if (element === panel || element.id === 'recovery-panel') continue;
    offlineRewardInert.set(element, element.inert);
    element.inert = true;
  }
  byId('collect-offline-rewards').focus({ preventScroll: true });
  refreshOnboarding();
}

byId('collect-offline-rewards').addEventListener('click', () => {
  const panel = byId('offline-rewards-panel');
  if (panel.hidden || !economyActive) return;
  tickEconomy();
  if (isRecovering()) return;
  // Income was already saved exactly once. Collect acknowledges it, rather than paying again.
  const collectedSlaves = pendingOfflineSlaves;
  pendingOfflineGold = pendingOfflineSlaves = 0;
  pendingSlotRefund = pendingReturnedFighters = pendingClosedCells = 0;
  pendingForgeRefund = 0;
  panel.hidden = true;
  for (const [element, wasInert] of offlineRewardInert) element.inert = wasInert;
  offlineRewardInert.clear();
  // A first click after OS sleep can open a menu while tickEconomy reveals the receipt.
  document.querySelectorAll<HTMLElement>('.wave-track, .battlefield, .army-dock').forEach(element => {
    element.inert = !!overlay && !overlay.contains(element);
  });
  farmUI?.refresh();
  capitolUI?.refresh();
  const target = offlineRewardFocus?.isConnected && offlineRewardFocus !== document.body && !offlineRewardFocus.disabled
    && !offlineRewardFocus.closest<HTMLElement>('[inert]') && offlineRewardFocus.getClientRects().length
    ? offlineRewardFocus : overlay?.querySelector<HTMLElement>('[data-close-overlay]') ?? byId('army-map');
  target?.focus({ preventScroll: true });
  offlineRewardFocus = null;
  save();
  refreshOnboarding();
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
const canEditFormation = () => !!armyScene && telegram.isActive && !isRecovering();
function saveFormation() { save(); }

function refreshArmyWallet() {
  byId('army-gold').textContent = String(gold);
  byId('army-slaves').textContent = String(economy.slaves);
}

function refreshRecruitment() {
  const button = byId('transform-slave');
  const recruitable = canRecruitFromPool(recruitmentPool, barracks.level);
  byId('market-slaves').textContent = String(economy.slaves >= 1000 ? hudGoldFormat.format(economy.slaves) : economy.slaves);
  byId('market-slaves').parentElement!.title = `${economy.slaves} slaves`;
  button.classList.toggle('has-slaves', recruitable && economy.slaves >= RECRUIT_COST);
  const reserveStock = Math.max(0, reserve.length - (transforming ? 1 : 0));
  byId('barracks-stock').textContent = String(reserveStock >= 1000 ? hudGoldFormat.format(reserveStock) : reserveStock);
  byId('open-barracks').disabled = !canEditFormation() || transforming;
  button.disabled = !canEditFormation() || (recruitable && economy.slaves < RECRUIT_COST) || transforming;
  const chances = getRecruitChances(barracks.level >= 2, recruitmentPool, recruitment, barracks.level);
  const odds = chances.map(({ type, chance }) => `${types[type].name} ${Number((chance * 100).toFixed(1))}%`).join(', ');
  const guaranteedLancer = recruitmentPool === 'humans' && barracks.firstLancerPending;
  const nextRecruit = guaranteedLancer ? 'Next recruit: guaranteed Lancer.' : odds;
  const previewLabel = 'Elven recruits require Barracks III. Open Recruitment for details.';
  button.setAttribute('aria-label', recruitable ? `Transform 1 slave into a fighter. ${economy.slaves} slaves available. ${nextRecruit}` : previewLabel);
  button.title = recruitable ? nextRecruit : previewLabel;
  byId('market-convert-label').textContent = recruitmentPool === 'elves' ? 'Elves' : guaranteedLancer ? 'Lancer next' : 'Market';
  const upgrade = getBarracksUpgrade(barracks, recruitment);
  byId('barracks-building-level').textContent = ['I', 'II', 'III', 'IV'][barracks.level - 1] + (['upgrading', 'ready'].includes(upgrade.status) ? '…' : '');
  byId('open-market-info').classList.toggle('upgrade-available', upgrade.canStart);
  byId('open-market-info').disabled = !canEditFormation();
  refreshOnboarding();
  if (overlay?.id === 'market-info-panel') refreshRecruitmentDetails();
}

function refreshOnboarding() {
  if (onboardingCompleted || destroyed || !canEditFormation() || transforming || draggedMerge
    || !byId('offline-rewards-panel').hidden) { onboardingGuide.hide(); return; }
  const emptyKey = progression.unlockedCells.find(key => {
    const [col, row] = key.split(':').map(Number);
    return !getUnitAtCell(units, col, row);
  });
  const received = Object.values(recruitment.received).reduce((sum, count) => sum + count, 0);
  const step = getOnboardingStep({ completed: onboardingCompleted, inBattle: !!battle,
    received, slaves: economy.slaves, army: units.length, reserve: reserve.length, hasEmptyCell: !!emptyKey });
  if (!step) { onboardingGuide.hide(); return; }
  const show = (element: HTMLElement | null, label: string, currentStep: string = step) => {
    if (element) onboardingGuide.show({ element, step: currentStep, label });
    else onboardingGuide.hide();
  };
  if (overlay) {
    if (step === 'place' && overlay.id === 'unit-panel' && selectedEmptyCell && !connectSelection) {
      show(byId('reserve-options').querySelector('[data-reserve-id]'), 'Choose a fighter for this tile', 'choose');
    } else if (step === 'place' && overlay.id === 'barracks-panel' && !connectSelection) {
      show(barracksSelectedId === null
        ? byId('barracks-options').querySelector('[data-barracks-unit-id]')
        : byId('barracks-detail').querySelector('[data-barracks-recruit-id]'),
      barracksSelectedId === null ? 'Choose a fighter' : 'Recruit, then tap a free tile', 'choose');
    } else {
      show(overlay.querySelector('[data-close-overlay]'), 'Close to continue', 'close');
    }
  } else if (movingId || pendingMerge) {
    show(byId('cancel-army-move'), 'Cancel to continue', 'cancel');
  } else if (step === 'market' && !pendingRecruitId) {
    const left = Math.min(economy.slaves, Math.max(1, STARTING_SLAVES - received));
    show(byId('transform-slave'), `Tap Market · ${left} left`);
  } else if ((step === 'place' || pendingRecruitId) && emptyKey) {
    const [col, row] = emptyKey.split(':').map(Number);
    onboardingGuide.show({ element: byId('army-map'), cell: { col, row }, step: 'place',
      label: pendingRecruitId ? 'Tap here to place your fighter' : 'Tap + to place a fighter' });
  } else if (step === 'start') {
    show(byId('start-wave'), 'Army ready · Start the wave');
  } else onboardingGuide.hide();
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
  document.querySelector<HTMLElement>('.recruitment-dock')!.classList.remove('is-transferring');
  byId('market-recruit-reveal').hidden = true;
}

function recruitmentProgressMarkup(type: UnitType) {
  const pluralNames: Record<UnitType, string> = { swordsman: 'swordsmen', archer: 'archers', healer: 'healers', lancer: 'lancers', pantherRider: 'riders', elfArcher: 'elven archers', elfHealer: 'elven healers', unicorn: 'unicorns' };
  const progress = getRecruitProgress(recruitment, type);
  const capped = progress.level === RECRUIT_LEVEL_CAP;
  const remaining = progress.needed - progress.progress;
  const detail = capped ? 'Maximum recruitment level' : remaining + ' more ' + (remaining === 1 ? types[type].name.toLowerCase() : pluralNames[type]) + ' → Lv. ' + (progress.level + 1);
  return '<p>Recruitment level · Lv. ' + progress.level + '</p>'
    + '<progress max="' + progress.needed + '" value="' + (capped ? progress.needed : progress.progress) + '" aria-label="' + types[type].name + ': ' + detail + '"></progress><small>' + detail + '</small>';
}

function refreshRecruitmentDetails() {
  const elves = recruitmentPool === 'elves';
  const elvesUnlocked = isRecruitmentPoolUnlocked('elves', barracks.level);
  byId('recruitment-pool').value = recruitmentPool;
  byId('recruitment-pool').disabled = transforming || !canEditFormation();
  byId('recruitment-pool-elves').disabled = !elvesUnlocked;
  byId('recruitment-pool-elves').textContent = elvesUnlocked ? 'Elven recruits' : 'Elves · Barracks III';
  byId('recruitment-pool-status').textContent = elves ? 'Recruitment levels unlock the next Elven fighter.'
    : elvesUnlocked ? 'Elven recruits unlocked. Choose your army above.' : 'Elves unlock after Barracks III is built.';
  byId('recruitment-details').hidden = elves;
  byId('elf-recruitment-details').hidden = !elves;
  byId('recruitment-info-cost').hidden = false;
  byId('recruitment-info-note').classList.toggle('human-recruitment-note', !elves);
  byId('recruitment-info-note').textContent = elves
    ? 'Unlocks use Market recruitment levels. Connect levels do not count.'
    : 'Market recruits raise recruitment levels. Connect adds personal levels together.';
  byId('recruitment-guarantee').hidden = elves || !barracks.firstLancerPending;
  if (elves) {
    const chances = getRecruitChances(barracks.level >= 2, 'elves', recruitment, barracks.level);
    renderElfRecruitment(byId('elf-recruitment-details'), ELF_RECRUITS.map(({ id }) => {
      const unlock = getElfRecruitUnlock(recruitment, id, barracks.level);
      const chance = chances.find(entry => entry.type === id);
      const required = unlock.requiredRecruitType;
      const level = required ? getRecruitProgress(recruitment, required).level : 0;
      const requirement = required
        ? `${types[required].name} recruitment Lv. ${unlock.requiredRecruitLevel} · now ${level}` : '';
      const barracksNote = unlock.requiredBarracksLevel === 4 ? 'Barracks IV · 2 tiles' : '';
      const details = chance ? recruitmentProgressMarkup(chance.type)
        : `<small>${requirement}</small>${barracksNote ? `<small>${barracksNote}</small>` : ''}`;
      return {
        id, locked: !unlock.available,
        portrait: chance ? scene?.getUnitArt(chance.type, getRecruitProgress(recruitment, chance.type).level) ?? undefined : undefined,
        progressMarkup: details,
        chanceLabel: chance ? Number((chance.chance * 100).toFixed(1)) + '%' : unlock.requirementsMet ? 'Coming soon' : 'Locked',
      };
    }));
    refreshBarracksUpgrade();
    return;
  }
  refreshBarracksUpgrade();
  // Keep the inline purchase controls mounted so timer/income updates preserve focus.
  byId('recruitment-current-types').innerHTML = getRecruitChances(barracks.level >= 2).filter(({ type }) => type !== 'lancer').map(({ type, chance }) => {
    const progress = getRecruitProgress(recruitment, type);
    const portrait = scene?.getUnitArt(type, progress.level);
    const chanceLabel = Math.round(chance * 100) + '%';
    return '<article class="recruitment-detail" data-recruit-type="' + type + '">'
      + (portrait ? '<img src="' + portrait + '" alt="" />' : '')
      + '<div class="recruitment-detail-copy"><div class="recruitment-detail-heading"><strong>' + types[type].name + '</strong><span>' + chanceLabel + '</span></div>'
      + recruitmentProgressMarkup(type) + '</div></article>';
  }).join('');
  byId('lancer-recruitment-training').innerHTML = recruitmentProgressMarkup('lancer');
}

byId('recruitment-pool').addEventListener('change', () => {
  if (!canEditFormation() || transforming || overlay?.id !== 'market-info-panel') return;
  const requestedPool = byId('recruitment-pool').value;
  tickEconomy();
  if (!canEditFormation() || overlay?.id !== 'market-info-panel') return;
  recruitmentPool = normalizeRecruitmentPool(requestedPool, barracks.level);
  save(); refresh();
});

byId('transform-slave').addEventListener('click', () => {
  if (!canEditFormation() || overlay || transforming) return;
  completeBarracksUpgrade(barracks);
  if (!canRecruitFromPool(recruitmentPool, barracks.level)) {
    setOverlay('market-info-panel', byId('transform-slave')); refresh();
    return;
  }
  if (economy.slaves < RECRUIT_COST) return;
  const result = receiveRecruit(recruitment, Math.random, {
    pool: recruitmentPool, elvesUnlocked: isRecruitmentPoolUnlocked('elves', barracks.level),
    barracksLevel: barracks.level,
    lancerUnlocked: barracks.level >= 2,
    guaranteedLancer: recruitmentPool === 'humans' && barracks.firstLancerPending,
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
  reveal.src = String(scene!.getUnitArt(result.type, result.level));
  reveal.alt = `${types[result.type].name}, level ${result.level}`;
  reveal.hidden = false;
  byId('transform-slave').classList.add('is-transforming', 'is-working');
  document.querySelector<HTMLElement>('.recruitment-dock')!.classList.add('is-transferring');
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
  byId('gold-count').textContent = String(gold < 10000 ? gold : hudGoldFormat.format(gold));
  const goldLabel = `${gold} gold`;
  byId('gold-count').parentElement!.setAttribute('aria-label', goldLabel);
  byId('gold-count').parentElement!.title = goldLabel;
  byId('battle').dataset.gold = String(gold);
  byId('slaves-count').textContent = String(economy.slaves);
  byId('open-buildings').setAttribute('aria-label', `Buildings. ${economy.slaves} ${economy.slaves === 1 ? 'slave' : 'slaves'}`);
  byId('building-gold').textContent = String(gold);
  byId('building-slaves').textContent = String(economy.slaves);
  byId('treasury-level').textContent = String(economy.treasuryLevel);
  byId('treasury-rate').textContent = String(treasuryRate(economy));
  byId('treasury-offline-note').textContent = `Offline storage: ${TREASURY_OFFLINE_LIMIT_SECONDS / 3600}h · up to ${treasuryRate(economy) * TREASURY_OFFLINE_LIMIT_SECONDS / 60} gold`;
  byId('treasury-progress').style.width = `${economy.treasuryProgress * 100}%`;
  byId('treasury-progress').parentElement!.setAttribute('aria-valuenow', String(Math.floor(economy.treasuryProgress * 100)));
  const seconds = Math.max(1, Math.ceil((1 - economy.treasuryProgress) * 60 / treasuryRate(economy)));
  byId('treasury-countdown').textContent = `${seconds}s`;
  byId('treasury-progress').parentElement!.setAttribute('aria-valuetext', `Next gold in ${seconds} seconds`);
  const cost = treasuryUpgradeCost(economy);
  byId('treasury-cost').textContent = String(cost ?? 'Max');
  byId('treasury-upgrade').disabled = cost === null || gold < cost;
  byId('treasury-upgrade').setAttribute('aria-label', cost === null ? 'Treasury at maximum level' : `Upgrade Treasury for ${cost} gold. Earn ${treasuryRate(economy) + 1} gold per minute`);
  byId('market-status').textContent = economy.marketBuilt ? 'Passive income active' : 'Training ready';
  byId('market-rate').textContent = `1 slave / ${MARKET_PRODUCTION_SECONDS / 60} min`;
  byId('market-cost').textContent = String(MARKET_BUILD_COST);
  byId('market-build').hidden = economy.marketBuilt;
  byId('market-build').disabled = economy.marketBuilt || gold < MARKET_BUILD_COST;
  byId('market-build').setAttribute('aria-label', `Enable passive slave income for ${MARKET_BUILD_COST} gold`);
  byId('market-production').hidden = !economy.marketBuilt;
  byId('market-description').textContent = economy.marketBuilt ? 'Income is collected automatically. Transform slaves below your army.' : 'Transform captured slaves below your army. Enable passive income here.';
  const marketSeconds = Math.max(1, Math.ceil((1 - economy.marketProgress) * MARKET_PRODUCTION_SECONDS));
  byId('market-countdown').textContent = `${Math.floor(marketSeconds / 60)}:${String(marketSeconds % 60).padStart(2, '0')}`;
  byId('market-progress').style.width = `${economy.marketProgress * 100}%`;
  byId('market-progress').parentElement!.setAttribute('aria-valuenow', String(Math.floor(economy.marketProgress * 100)));
  byId('market-progress').parentElement!.setAttribute('aria-valuetext', `Next slave in ${marketSeconds} seconds`);
  byId('market-offline-note').textContent = `Offline storage: ${MARKET_OFFLINE_LIMIT_SECONDS / 3600}h · up to ${Math.floor(MARKET_OFFLINE_LIMIT_SECONDS / MARKET_PRODUCTION_SECONDS)} slaves`;
  refreshRecruitment();
  forgeUI?.refresh();
  farmUI?.refresh();
  capitolUI?.refresh();
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
  if (destroyed || !economyActive || saveStorage.status !== 'ready') return;
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

function setOverlay(id: GameElementId, opener: HTMLElement | null) {
  unitDrag?.cancel();
  if (overlay) closeOverlay(false);
  tickEconomy();
  overlay = byId(id); overlayOpener = opener;
  byId('app').classList.add('has-menu');
  overlay.hidden = false;
  opener?.setAttribute('aria-expanded', 'true');
  document.querySelectorAll<HTMLElement>('.wave-track, .battlefield, .army-dock').forEach(element => { element.inert = !overlay!.contains(element); });
  // Prefer the close control; a menu may begin with a hidden Back button.
  overlay.querySelector<HTMLElement>('[data-close-overlay]')?.focus({ preventScroll: true });
  refreshOnboarding();
}

function closeOverlay(restoreFocus = true) {
  if (!overlay) return;
  connectSelection = null;
  const wasPicker = overlay.id === 'unit-panel';
  if (overlay.id === 'barracks-panel') barracksSelectedId = null;
  if (wasPicker && !movingId) {
    selectedId = movingId = selectedLockedCell = selectedEmptyCell = null;
  }
  overlay.hidden = true;
  overlayOpener?.setAttribute('aria-expanded', 'false');
  document.querySelectorAll<HTMLElement>('.wave-track, .battlefield, .army-dock').forEach(element => { element.inert = false; });
  overlay = null; resetArmed = false;
  byId('app').classList.remove('has-menu');
  byId('reset').setAttribute('aria-label', 'Reset run');
  byId('reset').title = 'Reset run';
  byId('reset-confirmation').hidden = true;
  if (restoreFocus) overlayOpener?.focus({ preventScroll: true });
  overlayOpener = null;
  refreshOnboarding();
  if (wasPicker) refresh();
  showMarketArrival();
}

heroUI = createHeroUI({ button: byId('open-hero'), panel: byId('hero-panel'),
  getHero: () => hero, getBattle: () => battle, close: () => closeOverlay(),
  onChange: () => { save(); refresh(); } });

forgeUI = createForgeUI({ root: byId('forge-upgrades'), getForge: () => forge, getGold: () => gold,
  canUpgrade: () => economyActive && saveStorage.status === 'ready',
  onUpgrade: upgrade => {
    tickEconomy();
    if (!economyActive || saveStorage.status !== 'ready') return;
    const result = upgradeForge(forge, upgrade, gold);
    if (!result.upgraded) return;
    gold = result.gold;
    // Save the shared bonus and its gold cost together. A running battle owns its old stats.
    save(); refresh();
    const name = FORGE_UPGRADES.find(entry => entry.id === upgrade)!.name;
    byId('forge-feedback').textContent = `${name} +${forge[upgrade]}% · Applies next wave.`;
  } });

function canUpgradeCapitol() {
  return economyActive && !isRecovering() && overlay?.id === 'buildings-panel'
    && !byId('capitol-building').hidden && !!byId('offline-rewards-panel').hidden;
}

capitolUI = createCapitolUI({ root: byId('capitol-upgrades'), getCapitol: () => capitol, getGold: () => gold,
  canUpgrade: canUpgradeCapitol, onUpgrade: upgrade => {
    if (!canUpgradeCapitol()) return;
    tickEconomy();
    if (!canUpgradeCapitol()) return;
    const result = upgradeCapitol(capitol, upgrade, gold);
    if (!result.upgraded) return;
    gold = result.gold;
    // Persist the purchase and its payment together; active combat owns a separate snapshot.
    save(); refresh();
    const stats = getCapitolStats(capitol);
    byId('capitol-feedback').textContent = `${upgrade === 'health' ? `${stats.hp} HP` : `Tower: ${stats.damage} damage / 2s`} · Applies next battle.`;
  } });

function canUseFarm() {
  return economyActive && !isRecovering() && overlay?.id === 'buildings-panel'
    && !byId('farm-building').hidden && !!byId('offline-rewards-panel').hidden;
}

function tendFarm(crop: CropId, harvest: boolean) {
  if (!canUseFarm()) return;
  tickEconomy();
  // A first action after sleep may open an income or recovery window.
  if (!canUseFarm()) return;
  const definition = CROPS.find(entry => entry.id === crop)!;
  if (harvest) {
    const result = harvestCrop(farm, crop);
    if (!result.harvested) return;
    byId('farm-feedback').textContent = `+${result.amount} ${definition.name.toLowerCase()} added to your stock.`;
  } else {
    if (!plantCrop(farm, crop)) return;
    byId('farm-feedback').textContent = `${definition.name} planted · ${definition.growSeconds / 60} min.`;
  }
  // Save planting timestamps or the cleared plot and harvest together.
  save(); refresh();
}

farmUI = createFarmUI({ root: byId('farm-crops'), getFarm: () => farm,
  canUse: canUseFarm, onPlant: crop => tendFarm(crop, false), onHarvest: crop => tendFarm(crop, true) });

for (const [button, panel] of [['open-buildings', 'buildings-panel'], ['open-profile', 'profile-panel'], ['open-barracks', 'barracks-panel'], ['open-market-info', 'market-info-panel'], ['open-hero', 'hero-panel']] as const) {
  byId(button).addEventListener('click', () => {
    if (panel === 'barracks-panel') {
      pendingRecruitId = null;
      pendingMerge = null;
      barracksSelectedId = null;
      byId('barracks-feedback').textContent = 'Connect → same type in Army · Tap icon for details';
    }
    setOverlay(panel, byId(button)); refresh();
  });
}
for (const panel of ['buildings-panel', 'profile-panel', 'unit-panel', 'barracks-panel', 'market-info-panel', 'hero-panel'] as const) {
  byId(panel).addEventListener('click', event => {
    if (event.target === byId(panel) || (event.target as Element).closest<HTMLElement>('[data-close-overlay]')) {
      closeOverlay();
    }
  });
  byId(panel).addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (connectSelection && (panel !== 'unit-panel' || connectSelection.donorIds.size)) { cancelConnect(); return; }
      if (panel === 'barracks-panel' && barracksSelectedId !== null) {
        showBarracksList();
        return;
      }
      closeOverlay();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...byId(panel).querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), select:not(:disabled), input:not(:disabled), [tabindex="0"]')]
      .filter(element => !element.hidden && element.getClientRects().length > 0);
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && (document.activeElement as FocusElement | null) === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement as FocusElement | null) === last) { event.preventDefault(); first?.focus(); }
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

function selectBuilding(name: string | undefined) {
  for (const tab of byId('buildings-tabs').querySelectorAll<HTMLElement>('[data-building]')) {
    const selected = tab.dataset.building === name;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    byId(tab.getAttribute('aria-controls') as GameElementId).hidden = !selected;
  }
  farmUI?.refresh();
  capitolUI?.refresh();
}
byId('buildings-tabs').addEventListener('click', event => {
  const tab = (event.target as Element).closest<HTMLElement>('[data-building]');
  if (tab) selectBuilding(tab.dataset.building);
});
byId('buildings-tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = [...byId('buildings-tabs').querySelectorAll<HTMLElement>('[data-building]')];
  const current = tabs.findIndex(tab => tab === document.activeElement);
  if (current < 0) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
    : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  selectBuilding(tabs[next].dataset.building);
  tabs[next].focus();
});
const nextWaveNumber = () => Math.min(clearedWaves + 1, TOTAL_WAVES);
const runComplete = () => clearedWaves === TOTAL_WAVES;
const automaticWaveNumber = () => runComplete() ? 1 : nextWaveNumber();
const hasActiveBattle = () => battle?.phase === 'running' || autoNextRemaining !== null;
const waveLabel = (number: number) => {
  const wave = getWaveDefinition(number);
  return `${wave.levelNumber}-${wave.roundNumber} · Wave ${wave.waveInRound}`;
};

function buildWaveTrack(wave = getWaveDefinition(battle?.waveNumber ?? nextWaveNumber())) {
  const track = byId('wave-nodes');
  track.dataset.level = String(wave.levelNumber);
  track.dataset.round = String(wave.roundNumber);
  track.style.setProperty('--wave-count', String(WAVES_PER_ROUND));
  byId('wave-total').textContent = `/${WAVES_PER_ROUND}`;
  track.replaceChildren(...getRoundWaves(wave.levelNumber, wave.roundNumber).map(wave => {
    const node = document.createElement('li');
    node.className = `wave-node${wave.hasBoss ? ' has-skull' : ''}${wave.isFinalBossWave ? ' has-final-boss' : ''}`;
    node.dataset.wave = String(wave.number);
    node.title = `${waveLabel(wave.number)}: ${wave.name}${wave.hasBoss ? wave.isFinalBossWave ? ' · Main boss' : ' · Mini-boss' : ''}`;
    const number = document.createElement('span');
    number.className = 'step-number';
    number.textContent = String(wave.waveInRound);
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
  byId('wave-number').textContent = String(wave.waveInRound);
  byId('profile-progress').textContent = `Level ${wave.levelNumber} · Round ${wave.roundNumber} / ${ROUNDS_PER_LEVEL} · Wave ${wave.waveInRound} / ${WAVES_PER_ROUND}`;
  document.querySelector<HTMLElement>('.wave-track')!.setAttribute('aria-label', `${wave.levelName}. Round ${wave.levelNumber}-${wave.roundNumber}. Wave ${wave.waveInRound} of ${WAVES_PER_ROUND}`);
  document.querySelector<HTMLElement>('.wave-label')!.title = `${wave.levelName} · Round ${wave.roundNumber} / ${ROUNDS_PER_LEVEL}`;
  document.querySelectorAll<HTMLElement>('[data-wave]').forEach(node => {
    const step = Number(node.dataset.wave);
    const definition = getWaveDefinition(step);
    const done = step <= clearedWaves;
    const current = step === number && !(runComplete() && !battle);
    node.classList.toggle('is-cleared', done);
    node.classList.toggle('is-current', current && !done);
    node.setAttribute('aria-label', `${waveLabel(step)}, ${definition.name}${definition.hasBoss ? definition.isFinalBossWave ? ', main boss' : ', mini-boss' : ''}, ${done ? 'cleared' : current ? 'current' : 'upcoming'}`);
    if (current) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
    node.querySelector<HTMLElement>('.step-number')!.textContent = String(done ? '✓' : definition.waveInRound);
  });
}

function hideNotice() {
  clearTimeout(toastTimer);
  byId('toast').classList.remove('visible');
  byId('toast').replaceChildren();
}

function tell(message: string, resource: 'slaves' | null = null) {
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
  label.parentElement!.hidden = !label.textContent;
}

function refresh() {
  const connectFocus = (document.activeElement as HTMLElement | null)?.closest<HTMLButtonElement>('.connect-panel button, [data-connect-action="begin"]');
  const connectFocusSelector = connectFocus?.dataset.connectDonorId ? `[data-connect-donor-id="${connectFocus.dataset.connectDonorId}"]`
    : connectFocus?.dataset.connectLocation ? `[data-connect-location="${connectFocus.dataset.connectLocation}"]`
    : connectFocus?.dataset.connectAction ? `[data-connect-action="${connectFocus.dataset.connectAction}"]` : null;
  const connectScrollElement = overlay?.querySelector<HTMLElement>('.connect-donor-scroll');
  const connectScroll = connectScrollElement?.scrollTop ?? 0;
  const connectScrollFocused = document.activeElement === connectScrollElement;
  const focusedAction = (document.activeElement as FocusElement | null)?.closest<HTMLButtonElement>('#selection-panel [data-action]')?.dataset.action;
  const focusedReserveId = (document.activeElement as FocusElement | null)?.closest<HTMLElement>('[data-reserve-id]')?.dataset.reserveId;
  const focusedRecruitId = (document.activeElement as FocusElement | null)?.closest<HTMLButtonElement>('[data-barracks-recruit-id]')?.dataset.barracksRecruitId;
  const focusedSellId = (document.activeElement as FocusElement | null)?.closest<HTMLButtonElement>('[data-barracks-sell-id]')?.dataset.barracksSellId;
  const focusedBarracksId = (document.activeElement as FocusElement | null)?.closest<HTMLElement>('[data-barracks-unit-id]')?.dataset.barracksUnitId;
  const focusedBarracksConnectId = (document.activeElement as FocusElement | null)?.closest<HTMLElement>('[data-barracks-connect-id]')?.dataset.barracksConnectId;
  telegram.setGameInProgress(hasActiveBattle());
  levelMusic.setLevel(getWaveDefinition(battle?.waveNumber ?? nextWaveNumber()).levelNumber);
  levelMusic.setActive(!destroyed && telegram.isActive && !isRecovering());
  refreshEconomy();
  heroUI?.render();
  byId('army-count').textContent = `${units.reduce((total, unit) => total + getUnitCellWidth(unit.type), 0)} / ${progression.unlockedCells.length}`;
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
    : pendingRecruit ? `Place ${types[pendingRecruit.type].name} · Lv. ${pendingRecruit.level}${getUnitCellWidth(pendingRecruit.type) === 2 ? ' · 2 adjacent tiles' : ''}`
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
  byId('auto-waves-state').textContent = autoWaves ? 'On' : 'Off';
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
    const availability = getCellAvailability(progression, selectedLockedCell, barracks.level);
    const cost = availability.cost;
    byId('unit-panel-title').textContent = 'Unlock tile';
    panel.innerHTML = availability.allowed
      ? `<div class="placement-copy"><strong>Expand your army</strong><p>Cost: ${cost} gold · You have ${gold}</p></div><div class="selection-actions"><button data-action="unlock-cell"${gold < (cost ?? 0) ? ' disabled' : ''}>Unlock · ${cost} gold</button><button data-action="cancel">Cancel</button></div>`
      : `<div class="placement-copy"><strong>${availability.requiredBarracksLevel ? `Requires Barracks ${['I', 'II', 'III', 'IV'][availability.requiredBarracksLevel - 1]}` : 'Future Barracks upgrade'}</strong><p>${availability.requiredBarracksLevel ? 'Barracks II allows 9 central tiles; III and IV each allow one more side tile to buy.' : 'More side tiles will become available in a future update.'}</p></div><div class="selection-actions">${availability.requiredBarracksLevel ? '<button data-action="barracks-info">View upgrade</button>' : ''}<button data-action="cancel">Close</button></div>`;
  } else if (selected) {
    const type = types[selected.type];
    const stats = getForgedUnitStats(selected.type, selected.level, forge);
    const hp = unitStatFormat.format(stats.hp), effect = unitStatFormat.format(isHealingUnit(selected.type) ? stats.heal : stats.damage);
    const portrait = scene?.getUnitArt?.(selected.type, selected.level);
    const lastGuard = !!battle && units.length === 1;
    byId('unit-panel-title').textContent = type.name;
    const markup = `<div class="selected-info">${portrait ? `<img class="selected-portrait" data-unit="${selected.type}" src="${portrait}" alt="" />` : ''}<div class="selected-copy"><div class="selected-line"><strong>${type.name}</strong><span class="unit-rank-name">Lv. ${selected.level}</span></div><p class="selected-stats">${hp} HP · ${effect} ${isHealingUnit(selected.type) ? 'healing' : 'attack'}${stats.attackSpeed > 1 ? ` · +${Math.round((stats.attackSpeed - 1) * 100)}% speed` : ''}${getUnitCellWidth(selected.type) === 2 ? ' · 2 tiles' : ''}</p></div></div><div class="selection-actions"><button data-action="move">Move</button><button data-action="remove"${lastGuard ? ' disabled title="Keep one guard for the next wave"' : ''}>To barracks</button></div>${connectPanelMarkup(true)}${lastGuard ? '<p class="building-note">Keep one guard or replace it from your barracks.</p>' : ''}`;
    refreshConnectPanel(panel, markup);
  } else {
    byId('unit-panel-title').textContent = 'Deploy a fighter';
    panel.innerHTML = '<p class="building-note">Choose a fighter from your barracks for this tile.</p>';
  }
  byId('army-map').dataset.formation = JSON.stringify(units);
  byId('army-map').dataset.unlockedCells = JSON.stringify(progression.unlockedCells);
  byId('army-map').setAttribute('aria-label', `Army for the next wave. ${units.length} guards. ${byId('army-status').textContent}. Use arrow keys and Enter to choose a tile.`);
  const canvas = byId('battle');
  canvas.dataset.formation = JSON.stringify(battle ? battle.allies.map(({ id, type, level }) => ({ id, type, level })) : units);
  canvas.dataset.gold = String(gold);
  const currentWave = getWaveDefinition(battle?.waveNumber ?? nextWaveNumber());
  canvas.dataset.campaign = JSON.stringify({ wave: currentWave.number, level: currentWave.levelNumber, round: currentWave.roundNumber, waveInRound: currentWave.waveInRound, clearedWaves, complete: runComplete() });
  if (!battle) canvas.setAttribute('aria-label', `Preparing ${waveLabel(nextWaveNumber())}. ${units.length} defenders. Edit your army in the grid below.`);
  else refreshBattleHud();
  if (focusedAction && overlay?.id === 'unit-panel') {
    const replacement = panel.querySelector<HTMLButtonElement>(`[data-action="${focusedAction}"]`);
    (replacement && !replacement.disabled ? replacement : overlay.querySelector<HTMLElement>('[data-close-overlay]'))!.focus({ preventScroll: true });
  }
  if (focusedReserveId && overlay?.id === 'unit-panel') {
    (byId('reserve-options').querySelector<HTMLElement>(`[data-reserve-id="${focusedReserveId}"]`)
      ?? overlay.querySelector<HTMLElement>('[data-close-overlay]'))!.focus({ preventScroll: true });
  }
  if (focusedRecruitId && overlay?.id === 'barracks-panel') {
    const replacement = byId('barracks-detail').querySelector<HTMLButtonElement>(`[data-barracks-recruit-id="${focusedRecruitId}"]`);
    (replacement && !replacement.disabled ? replacement : overlay.querySelector<HTMLElement>('[data-close-overlay]'))!.focus({ preventScroll: true });
  }
  if (focusedSellId && overlay?.id === 'barracks-panel') {
    const replacement = byId('barracks-detail').querySelector<HTMLButtonElement>(`[data-barracks-sell-id="${focusedSellId}"]`);
    (replacement && !replacement.disabled ? replacement : overlay.querySelector<HTMLElement>('[data-close-overlay]'))!.focus({ preventScroll: true });
  }
  if (focusedBarracksId && overlay?.id === 'barracks-panel' && barracksSelectedId === null) {
    (byId('barracks-options').querySelector<HTMLElement>(`[data-barracks-unit-id="${focusedBarracksId}"]`)
      ?? overlay.querySelector<HTMLElement>('[data-close-overlay]'))!.focus({ preventScroll: true });
  }
  if (focusedBarracksConnectId && overlay?.id === 'barracks-panel' && barracksSelectedId === null) {
    const replacement = byId('barracks-options').querySelector<HTMLButtonElement>(`[data-barracks-connect-id="${focusedBarracksConnectId}"]`);
    (replacement && !replacement.disabled ? replacement : overlay.querySelector<HTMLElement>('[data-close-overlay]'))!.focus({ preventScroll: true });
  }
  const connectGrid = overlay?.querySelector<HTMLElement>('.connect-donor-scroll');
  if (connectGrid) connectGrid.scrollTop = connectScroll;
  if (connectScrollFocused) connectGrid?.focus({ preventScroll: true });
  if (connectFocusSelector) {
    const replacement = overlay?.querySelector<HTMLButtonElement>(connectFocusSelector);
    (replacement && !replacement.disabled ? replacement : overlay?.querySelector<HTMLButtonElement>('[data-connect-action="cancel"], [data-close-overlay]'))?.focus({ preventScroll: true });
  }
  renderScene();
  refreshOnboarding();
}

function getMergeSource(source = pendingMerge) {
  return source && (source.location === 'army' ? units : reserve).find(unit => unit.id === source.id);
}

function canMerge(source: MergeSource) {
  return units.some(unit => getMergeResult(units, reserve, source, unit.id).ok);
}

function mergeDescription(source: MergeSource) {
  const fighter = getMergeSource(source);
  if (!fighter) return '';
  const space = getUnitCellWidth(fighter.type) === 2 ? 'Uses 2 adjacent horizontal tiles. ' : '';
  return space + (connectCandidates(source).length
    ? 'Connect adds matching fighters to this unit. Choose from Barracks or Army.'
    : `Get another ${types[fighter.type].name} to connect to this unit.`);
}

function mergeButtonMarkup(source: MergeSource, unavailable = false) {
  return `<button class="merge-button" data-connect-action="begin" data-connect-recipient-location="${source.location}" data-connect-recipient-id="${source.id}" type="button"${unavailable || !connectCandidates(source).length ? ' disabled' : ''}><span class="merge-plus" aria-hidden="true">+</span>Connect</button>`;
}

function connectCandidates(recipient: MergeSource, location?: 'army' | 'reserve') {
  const fighter = getMergeSource(recipient);
  const roster = location === 'army' ? units : location === 'reserve' ? reserve : [...units, ...reserve];
  return fighter ? roster.filter(unit => unit.id !== fighter.id && unit.type === fighter.type) : [];
}

function connectPanelMarkup(inline = false) {
  if (!connectSelection) return '';
  const { recipient, sourceTab, donorIds, notice } = connectSelection;
  const fighter = getMergeSource(recipient);
  if (!fighter) return '';
  const donors: MergeSource[] = [...donorIds].map(id => ({ id, location: units.some(unit => unit.id === id) ? 'army' : 'reserve' }));
  const result = getConnectResult(units, reserve, recipient, donors, { minArmyUnits: battle ? 1 : 0 });
  const level = result.ok ? result.recipient.level : fighter.level;
  const stats = getForgedUnitStats(fighter.type, level, forge);
  const before = getForgedUnitStats(fighter.type, fighter.level, forge);
  const statText = (old: number, next: number) => unitStatFormat.format(old) + (next !== old ? ` → ${unitStatFormat.format(next)}` : '');
  const message = !result.ok && result.reason === 'army-minimum' ? 'Keep one fighter in Army during a wave.'
    : !result.ok && result.reason === 'level-overflow' ? 'Combined level is too large to save safely.'
    : notice || (donors.length ? 'Selected fighters are consumed. This unit stays here.' : 'Select matching fighters to add their levels.');
  return renderConnectPanel({ inline, recipient: fighter, location: recipient.location, sourceTab,
    donors: connectCandidates(recipient, sourceTab), selectedIds: donorIds, selectedCount: donorIds.size,
    addedLevels: result.ok ? result.addedLevels : 0, previewLevel: level,
    hp: statText(before.hp, stats.hp), effect: statText(isHealingUnit(fighter.type) ? before.heal : before.damage, isHealingUnit(fighter.type) ? stats.heal : stats.damage),
    effectLabel: isHealingUnit(fighter.type) ? 'Healing' : 'Attack', message,
    canApply: result.ok && canEditFormation() && !transforming, art: unit => scene?.getUnitArt(unit.type, unit.level) ?? undefined });
}

function refreshConnectPanel(panel: HTMLElement, markup = connectPanelMarkup()) {
  // Economy and combat refreshes must not detach a donor under a finger or reset scrolling.
  if (!panel.querySelector('.connect-panel') || connectMarkupCache.get(panel) !== markup) {
    panel.innerHTML = markup;
    connectMarkupCache.set(panel, markup);
  }
}

function cancelConnect() {
  if (overlay?.id === 'unit-panel' && connectSelection?.recipient.location === 'army') {
    connectSelection.donorIds.clear();
    connectSelection.notice = '';
    refresh();
    overlay.querySelector<HTMLButtonElement>('[data-connect-action="select-all"]')?.focus({ preventScroll: true });
    return;
  }
  connectSelection = null;
  refresh();
  overlay?.querySelector<HTMLButtonElement>('[data-connect-action="begin"]')?.focus({ preventScroll: true });
}

function handleConnectClick(event: MouseEvent, recipient: MergeSource) {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-connect-action], [data-connect-location], [data-connect-donor-id]');
  if (!button) return false;
  if (button.disabled || !canEditFormation() || transforming) return true;
  const action = button.dataset.connectAction;
  if (action === 'begin') {
    if (!connectCandidates(recipient).length) return true;
    connectSelection = { recipient, sourceTab: 'reserve', donorIds: new Set(), notice: '' };
    refresh();
    overlay?.querySelector<HTMLButtonElement>('[data-connect-location="reserve"]')?.focus({ preventScroll: true });
    return true;
  }
  if (!connectSelection || connectSelection.recipient.id !== recipient.id || connectSelection.recipient.location !== recipient.location) return true;
  if (action === 'cancel') { cancelConnect(); return true; }
  if (action === 'select-all') {
    // Select the full current source list, including scrolled-off icons, without spending fighters.
    for (const fighter of connectCandidates(recipient, connectSelection.sourceTab)) connectSelection.donorIds.add(fighter.id);
    connectSelection.notice = '';
    refresh();
    return true;
  }
  if (action === 'apply') {
    const donors: MergeSource[] = [...connectSelection.donorIds].map(id => ({ id, location: units.some(unit => unit.id === id) ? 'army' : 'reserve' }));
    const result = getConnectResult(units, reserve, recipient, donors, { minArmyUnits: battle ? 1 : 0 });
    if (!result.ok) { refresh(); return true; }
    // Apply the entire selection once to the saved roster; live combat owns its own actors.
    units = result.units; reserve = result.reserve;
    connectSelection.donorIds.clear();
    connectSelection.notice = `Connected · Lv. ${result.recipient.level}${battle ? ' · Applies next wave' : ''}`;
    saveFormation(); refresh();
    return true;
  }
  const location = button.dataset.connectLocation;
  if (location === 'army' || location === 'reserve') {
    connectSelection.sourceTab = location;
    refresh();
    const grid = overlay?.querySelector<HTMLElement>('.connect-donor-scroll');
    if (grid) grid.scrollTop = 0;
    return true;
  }
  const donorId = Number(button.dataset.connectDonorId);
  if (connectCandidates(recipient, connectSelection.sourceTab).some(unit => unit.id === donorId)) {
    if (connectSelection.donorIds.has(donorId)) connectSelection.donorIds.delete(donorId);
    else connectSelection.donorIds.add(donorId);
    connectSelection.notice = '';
    refresh();
  }
  return true;
}

function mergeInto(targetId: number | null | undefined, source = pendingMerge) {
  if (!canEditFormation() || transforming) return false;
  const result = getMergeResult(units, reserve, source, targetId);
  if (!result.ok) {
    const messages: Partial<Record<import('./unit-merging.ts').MergeFailureReason, string>> = {
      'different-type': 'Choose the same type.', 'same-unit': 'Choose another fighter.',
      'level-overflow': 'Combined level is too large to save safely.', 'target-missing': 'Tap a green fighter.',
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

function dragSourceAt(event: DragSourceEvent): MergeSource | null {
  if (!canEditFormation() || transforming || pendingMerge || pendingRecruitId || movingId
    || !byId('offline-rewards-panel').hidden) return null;
  if (!overlay && event.target === byId('army-map')) {
    const cell = armyScene!.getCellAt(event.clientX, event.clientY);
    const fighter = cell && getUnitAtCell(units, cell.col, cell.row);
    return fighter ? { location: 'army', id: fighter.id } : null;
  }
  if (overlay?.id === 'barracks-panel' && barracksSelectedId === null) {
    const button = (event.target as Element).closest?.<HTMLElement>('[data-barracks-unit-id]');
    if (button) return { location: 'reserve', id: Number(button.dataset.barracksUnitId) };
  }
  return null;
}

function startDragMerge(source: MergeSource, point: DragPoint) {
  if (!canEditFormation() || transforming || pendingMerge || pendingRecruitId || movingId
    || !byId('offline-rewards-panel').hidden || !canMerge(source)) return false;
  const fighter = getMergeSource(source)!;
  const returnTo = overlay ? { id: overlay.id as GameElementId, opener: overlayOpener,
    scrollTop: overlay.querySelector<HTMLElement>('.menu-card')!.scrollTop, page: barracksPage } : null;
  const ghost = document.createElement('div');
  ghost.className = 'unit-drag-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  const portrait = document.createElement('img');
  portrait.src = String(scene!.getUnitArt(fighter.type, fighter.level));
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

function dragTargetAt(point: DragPoint) {
  if (!canEditFormation() || overlay || !byId('offline-rewards-panel').hidden
    || document.elementFromPoint(point.x, point.y) !== byId('army-map')) return null;
  const cell = armyScene!.getCellAt(point.x, point.y);
  return cell && getUnitAtCell(units, cell.col, cell.row)?.id;
}

function moveDragMerge(point: DragPoint) {
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
    overlay!.querySelector<HTMLElement>('.menu-card')!.scrollTop = previous.returnTo.scrollTop;
  } else refresh();
}

function dropDragMerge(source: MergeSource, point: DragPoint) {
  const targetId = dragTargetAt(point);
  // Check the current roster again: income and automatic waves keep running during a drag.
  if (transforming || !getMergeResult(units, reserve, source, targetId).ok) {
    cancelDragMerge(); return;
  }
  clearDragMerge();
  mergeInto(targetId, source);
  byId('army-map').focus({ preventScroll: true });
}

function refreshReserve(selected: ArmyUnit | undefined) {
  const section = byId('reserve-section');
  section.hidden = !!connectSelection || !!selectedLockedCell || (!selectedEmptyCell && !selected);
  const pageCount = Math.max(1, Math.ceil(reserve.length / RESERVE_PAGE_SIZE));
  reservePage = Math.max(0, Math.min(reservePage, pageCount - 1));
  byId('reserve-count').textContent = String(reserve.length);
  byId('reserve-empty').hidden = reserve.length > 0;
  byId('reserve-pagination').hidden = pageCount === 1;
  byId('reserve-prev').disabled = reservePage === 0;
  byId('reserve-next').disabled = reservePage >= pageCount - 1;
  byId('reserve-page').textContent = `${reservePage + 1} / ${pageCount}`;
  byId('reserve-options').innerHTML = reserve.slice(reservePage * RESERVE_PAGE_SIZE, (reservePage + 1) * RESERVE_PAGE_SIZE).map(unit => {
    const portrait = scene?.getUnitArt(unit.type, unit.level);
    return `<button class="reserve-card" data-reserve-id="${unit.id}" type="button" aria-label="${selected ? 'Replace with' : 'Deploy'} ${types[unit.type].name}, level ${unit.level}">${portrait ? `<img src="${portrait}" alt="" />` : ''}<strong>${types[unit.type].name}</strong><small>Lv. ${unit.level}${getUnitCellWidth(unit.type) === 2 ? ' · 2 tiles' : ''}</small></button>`;
  }).join('');
}

function formatUpgradeTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    : `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function refreshBarracksUpgrade() {
  const info = getBarracksUpgrade(barracks, recruitment);
  const upgrading = info.status === 'upgrading' || info.status === 'ready';
  const unlocked = info.lancerUnlocked;
  const targetName = info.targetLevel ? ['I', 'II', 'III', 'IV'][info.targetLevel - 1] : 'IV';
  const inElves = recruitmentPool === 'elves' && barracks.level >= 3;
  const controls = byId('barracks-upgrade-controls');
  const parent = inElves
    ? byId('elf-recruitment-details').querySelector<HTMLElement>('[data-elf-recruit="unicorn"] [data-elf-upgrade-slot]')
    : byId('lancer-recruitment').querySelector<HTMLElement>('.recruitment-detail-copy');
  if (parent && controls.parentElement !== parent) parent.append(controls);
  const hours = info.durationMs / 3_600_000;
  const unavailable = !canEditFormation() || transforming;
  byId('barracks-upgrade-gold').textContent = String(gold);
  const portrait = scene?.getUnitArt('lancer', getRecruitProgress(recruitment, 'lancer').level);
  byId('barracks-lancer-art').hidden = !portrait;
  if (portrait) byId('barracks-lancer-art').src = portrait;
  byId('lancer-recruitment').classList.toggle('is-locked', !unlocked);
  byId('lancer-recruitment-chance').textContent = unlocked
    ? Math.round(getRecruitChances(true).find(({ type }) => type === 'lancer')!.chance * 100) + '%' : 'Locked';
  byId('lancer-recruitment-training').hidden = !unlocked;
  byId('barracks-upgrade-state').hidden = info.targetLevel === null || (inElves && !upgrading && !info.canStart);
  byId('barracks-upgrade-state').textContent = upgrading ? `Barracks ${targetName} · ${formatUpgradeTime(info.remainingMs)}`
    : info.canStart ? `Barracks ${targetName} · +1 tile to buy`
    : `Requires ${types[info.requiredRecruitType].name} Lv. ${info.requiredRecruitLevel} · now Lv. ${info.recruitLevel}`;
  byId('barracks-upgrade-note').hidden = unlocked && !upgrading && !info.canStart && info.targetLevel !== null;
  byId('barracks-upgrade-note').textContent = upgrading ? 'Building continues offline.'
    : info.targetLevel === null ? 'Barracks IV · up to 11 army tiles'
    : info.canStart ? `${hours} ${hours === 1 ? 'hour' : 'hours'} · offline building${info.targetLevel === 4 ? '' : ` · unlocks ${info.targetLevel === 2 ? 'Lancer' : 'Elves'}`}`
    : 'Raise its recruitment level at the Market.';
  byId('barracks-upgrade-progress').hidden = !upgrading;
  byId('barracks-upgrade-progress').value = info.durationMs - info.remainingMs;
  byId('barracks-upgrade-progress').max = Math.max(1, info.durationMs);
  byId('barracks-upgrade-progress').setAttribute('aria-label', `Barracks construction: ${formatUpgradeTime(info.remainingMs)} remaining`);
  const start = byId('barracks-start-upgrade');
  start.hidden = !info.canStart;
  start.disabled = unavailable || !info.canStart || gold < info.cost;
  start.textContent = `Upgrade Barracks ${targetName} · ${info.cost} gold`;
  start.setAttribute('aria-label', `Upgrade Barracks to level ${info.targetLevel} for ${info.cost} gold. Takes ${hours} ${hours === 1 ? 'hour' : 'hours'}.`);
  const finish = byId('barracks-finish-upgrade');
  finish.hidden = !upgrading;
  finish.disabled = unavailable || info.remainingMs === 0 || gold < info.speedUpCost;
  finish.textContent = `Finish now · ${info.speedUpCost} gold`;
  byId('barracks-go-market').hidden = recruitmentPool === 'elves' || !barracks.firstLancerPending;
  byId('barracks-upgrade-pricing').hidden = !upgrading;
}

byId('barracks-start-upgrade').addEventListener('click', () => {
  if (!canEditFormation() || overlay?.id !== 'market-info-panel' || transforming) return;
  const result = startBarracksUpgrade(barracks, recruitment, gold);
  if (!result.ok) { refresh(); return; }
  gold = result.gold;
  save(); refresh();
  byId('market-info-panel').querySelector<HTMLElement>('[data-close-overlay]')!.focus({ preventScroll: true });
});
byId('barracks-finish-upgrade').addEventListener('click', () => {
  if (!canEditFormation() || overlay?.id !== 'market-info-panel' || transforming) return;
  const result = speedUpBarracks(barracks, gold);
  // Save natural completion too if the last second elapsed between rendering and tapping.
  gold = result.gold;
  save(); refresh();
  if (barracks.firstLancerPending) byId('barracks-go-market').focus({ preventScroll: true });
  else byId('market-info-panel').querySelector<HTMLElement>('[data-close-overlay]')!.focus({ preventScroll: true });
});
byId('barracks-go-market').addEventListener('click', () => {
  closeOverlay(false);
  byId('transform-slave').focus({ preventScroll: true });
});

function refreshBarracks() {
  const pageCount = Math.max(1, Math.ceil(reserve.length / BARRACKS_PAGE_SIZE));
  barracksPage = Math.max(0, Math.min(barracksPage, pageCount - 1));
  byId('barracks-count').textContent = String(reserve.length);
  byId('barracks-gold').textContent = String(gold);
  byId('barracks-empty').hidden = reserve.length > 0;
  byId('barracks-pagination').hidden = pageCount === 1;
  byId('barracks-prev').disabled = barracksPage === 0;
  byId('barracks-next').disabled = barracksPage >= pageCount - 1;
  byId('barracks-page').textContent = `${barracksPage + 1} / ${pageCount}`;
  byId('barracks-options').innerHTML = reserve.slice(barracksPage * BARRACKS_PAGE_SIZE, (barracksPage + 1) * BARRACKS_PAGE_SIZE).map(unit => {
    const portrait = scene?.getUnitArt(unit.type, unit.level);
    const available = canEditFormation() && !transforming && canMerge({ location: 'reserve', id: unit.id });
    const connectLabel = available ? `Connect ${types[unit.type].name}, level ${unit.level}, to a matching fighter in Army` : `Connect ${types[unit.type].name}: no eligible fighter in Army`;
    return `<div class="barracks-entry"><button class="barracks-unit" data-barracks-unit-id="${unit.id}" type="button" aria-label="${types[unit.type].name}, level ${unit.level}. View details." aria-controls="barracks-detail">${portrait ? `<img src="${portrait}" alt="" />` : ''}<span class="barracks-unit-level">Lv. ${unit.level}</span></button><button class="barracks-connect" data-barracks-connect-id="${unit.id}" type="button" aria-label="${connectLabel}" title="${connectLabel}"${available ? '' : ' disabled'}>Connect</button></div>`;
  }).join('');
  const selected = reserve.find(unit => unit.id === barracksSelectedId);
  if (!selected) barracksSelectedId = null;
  byId('barracks-list').hidden = !!selected;
  byId('barracks-detail').hidden = !selected;
  byId('barracks-back').hidden = !selected;
  byId('barracks-feedback').hidden = !!selected;
  byId('barracks-title').textContent = selected ? 'Unit details' : 'Barracks';
  if (selected && connectSelection?.recipient.location === 'reserve' && connectSelection.recipient.id === selected.id) {
    byId('barracks-title').textContent = 'Connect';
    refreshConnectPanel(byId('barracks-detail'));
  } else if (selected) {
    const stats = getForgedUnitStats(selected.type, selected.level, forge);
    const portrait = scene?.getUnitArt(selected.type, selected.level);
    const lastFighter = units.length + reserve.length <= 1;
    const unavailable = !canEditFormation() || transforming;
    byId('barracks-detail').innerHTML = `<div class="barracks-detail-unit">${portrait ? `<img src="${portrait}" alt="" />` : ''}<div class="barracks-detail-copy"><strong>${types[selected.type].name}</strong><small>Lv. ${selected.level}</small></div></div><div class="barracks-detail-stats"><span><b>HP</b><strong>${unitStatFormat.format(stats.hp)}</strong></span><span><b>${isHealingUnit(selected.type) ? 'Healing' : 'Attack'}</b><strong>${unitStatFormat.format(isHealingUnit(selected.type) ? stats.heal : stats.damage)}</strong></span>${stats.attackSpeed > 1 ? `<span><b>Speed</b><strong>+${Math.round((stats.attackSpeed - 1) * 100)}%</strong></span>` : ''}</div><div class="barracks-detail-actions">${mergeButtonMarkup({ location: 'reserve', id: selected.id }, unavailable)}<button class="battle-button" data-barracks-recruit-id="${selected.id}" type="button"${unavailable ? ' disabled' : ''}>Recruit</button><button class="barracks-sell" data-barracks-sell-id="${selected.id}" type="button" aria-label="Sell ${types[selected.type].name}, level ${selected.level}, for ${SELL_PRICE} gold"${unavailable || lastFighter ? ' disabled' : ''}><span>Sell</span><span class="coin-icon" aria-hidden="true"></span><span>${SELL_PRICE}</span></button></div><p class="barracks-detail-note">${mergeDescription({ location: 'reserve', id: selected.id })}</p>${lastFighter ? '<p class="barracks-detail-note">Keep at least one fighter.</p>' : ''}`;
  } else byId('barracks-detail').replaceChildren();
}

function showBarracksList() {
  connectSelection = null;
  const previousId = barracksSelectedId;
  barracksSelectedId = null;
  refresh();
  (byId('barracks-options').querySelector<HTMLElement>(`[data-barracks-unit-id="${previousId}"]`)
    ?? byId('barracks-options').querySelector('button')
    ?? byId('barracks-panel').querySelector<HTMLElement>('[data-close-overlay]'))!.focus({ preventScroll: true });
}

function sellReserve(ids: ReadonlySet<number>) {
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
  const connectButton = (event.target as Element).closest<HTMLButtonElement>('[data-barracks-connect-id]');
  if (connectButton) {
    const source: MergeSource = { location: 'reserve', id: Number(connectButton.dataset.barracksConnectId) };
    if (connectButton.disabled || !canMerge(source)) return;
    // Selection spends nothing. The existing merge transaction consumes this fighter only after a valid Army tap.
    pendingMerge = source;
    pendingRecruitId = selectedId = movingId = selectedLockedCell = selectedEmptyCell = null;
    closeOverlay(false); refresh();
    byId('army-map').focus({ preventScroll: true });
    tell(`Choose a green ${types[getMergeSource(source)!.type].name}.`);
    return;
  }
  const button = (event.target as Element).closest<HTMLElement>('[data-barracks-unit-id]');
  const fighter = button && reserve.find(unit => unit.id === Number(button.dataset.barracksUnitId));
  if (!fighter) return;
  barracksSelectedId = fighter.id;
  refresh();
  byId('barracks-back').focus({ preventScroll: true });
});
byId('barracks-detail').addEventListener('click', event => {
  if (!canEditFormation() || overlay?.id !== 'barracks-panel' || transforming || barracksSelectedId === null) return;
  if (handleConnectClick(event, { location: 'reserve', id: barracksSelectedId })) return;
  const sellButton = (event.target as Element).closest<HTMLButtonElement>('[data-barracks-sell-id]');
  if (sellButton) {
    if (!sellButton.disabled) sellReserve(new Set([Number(sellButton.dataset.barracksSellId)]));
    return;
  }
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-barracks-recruit-id]');
  const fighter = button && !button.disabled && reserve.find(unit => unit.id === Number(button.dataset.barracksRecruitId));
  if (!fighter) return;
  pendingMerge = null;
  pendingRecruitId = fighter.id;
  selectedId = movingId = selectedLockedCell = selectedEmptyCell = null;
  closeOverlay(false); refresh();
  byId('army-map').focus({ preventScroll: true });
  tell(getUnitCellWidth(fighter.type) === 2 ? 'Choose the left of 2 adjacent open tiles.' : 'Choose a tile.');
});

function changeReservePage(delta: number) {
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
  const button = (event.target as Element).closest<HTMLElement>('[data-reserve-id]');
  const index = button ? reserve.findIndex(unit => unit.id === Number(button.dataset.reserveId)) : -1;
  if (index < 0) return;
  const selected = units.find(unit => unit.id === selectedId);
  const key = selected ? cellKey(selected.col, selected.row) : selectedEmptyCell;
  if (!key || !isUnlockedCell(key)) return;
  placeReserveFighter(reserve[index].id, key);
});

function placeReserveFighter(id: number, key: string) {
  if (!canEditFormation() || !isUnlockedCell(key)) return false;
  const index = reserve.findIndex(unit => unit.id === id);
  if (index < 0) return false;
  const [clickedCol, clickedRow] = key.split(':').map(Number);
  const occupied = getUnitAtCell(units, clickedCol, clickedRow);
  const col = occupied?.col ?? clickedCol, row = occupied?.row ?? clickedRow;
  const candidate = { ...reserve[index], col, row };
  if (!canPlaceUnit(candidate, units, progression.unlockedCells, occupied ? [occupied.id] : [])) {
    tell(getUnitCellWidth(candidate.type) === 2 ? 'Needs 2 adjacent open tiles. Clear the tile on the right.' : 'This tile is occupied.');
    return false;
  }
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
  if (selectedId !== null) {
    connectSelection = { recipient: { location: 'army', id: selectedId }, sourceTab: 'reserve', donorIds: new Set(), notice: '' };
  }
  refresh();
}

function onCell({ col, row }: GridCell) {
  if (!canEditFormation() || overlay || col < 0 || col > 4 || row < 0 || row > 2) return;
  const key = cellKey(col, row);
  if (pendingMerge) {
    mergeInto(getUnitAtCell(units, col, row)?.id);
    return;
  }
  selectedEmptyCell = null;
  if (!isUnlockedCell(key)) {
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
  const occupied = getUnitAtCell(units, col, row);
  if (movingId) {
    const destination = occupied && occupied.id !== movingId ? occupied : { col, row };
    const result = planFormationMove(units, movingId, destination.col, destination.row, progression.unlockedCells);
    if (!result.ok) {
      tell('Not enough room. Both fighters need free, unlocked tiles.');
      return;
    }
    // Swap complete footprints atomically; a running battle keeps its old actors.
    units = result.units;
    movingId = selectedId = null;
    saveFormation(); refresh(); return;
  }
  selectedId = occupied?.id ?? null;
  selectedEmptyCell = occupied ? null : key;
  openCellPicker();
}


byId('selection-panel').addEventListener('click', event => {
  if (!canEditFormation() || overlay?.id !== 'unit-panel') return;
  if (selectedId !== null && handleConnectClick(event, { location: 'army', id: selectedId })) return;
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-action]'), action = button?.dataset.action;
  if (!action || button.disabled) return;
  if (action === 'cancel') { closeOverlay(); return; }
  if (action === 'barracks-info') {
    setOverlay('market-info-panel', byId('army-map'));
    refreshRecruitmentDetails();
    return;
  }
  if (action === 'unlock-cell') {
    const result = unlockCell(progression, gold, selectedLockedCell!, barracks.level);
    if (result.unlocked) {
      gold = result.gold;
      selectedEmptyCell = selectedLockedCell;
      selectedLockedCell = null;
      if (pendingRecruitId && placeReserveFighter(pendingRecruitId, selectedEmptyCell!)) return;
      saveFormation(); refresh(); tell('Tile unlocked.');
    }
    return;
  }
  const selected = units.find(unit => unit.id === selectedId);
  if (!selected) return;
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
    connectSelection = null;
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
    resetSaveToken = saveStorage.prepareReset();
    byId('reset-confirmation').hidden = false;
    byId('reset').setAttribute('aria-label', 'Confirm reset run');
    byId('reset').title = 'Confirm reset run';
    return;
  }
  resetRun();
});

function resetRun() {
  connectSelection = null;
  onboardingCompleted = false; marketHintCompleted = false;
  units = []; reserve = []; recruitment = createRecruitment(); reservePage = 0;
  barracks = createBarracks();
  recruitmentPool = 'humans';
  forge = createForge();
  byId('forge-feedback').textContent = 'Changes apply next wave.';
  farm = createFarm();
  byId('farm-feedback').textContent = 'Plant for free, then collect each harvest.';
  capitol = createCapitol();
  byId('capitol-feedback').textContent = 'Changes apply next battle.';
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
  pendingSlotRefund = pendingReturnedFighters = pendingClosedCells = 0;
  pendingForgeRefund = 0;
  progression = createProgression(); selectedLockedCell = selectedEmptyCell = null;
  battleSpeed = DEFAULT_BATTLE_SPEED;
  selectedId = movingId = lastOutcome = null;
  for (const [child, inert] of recoveryInert) child.inert = inert;
  recoveryInert.clear();
  closeOverlay();
  const result = saveStorage.reset(saveSnapshot(), { confirmation: resetSaveToken });
  resetSaveToken = null;
  // Re-entering the recovery panel must capture the new, closed-menu inert state.
  byId('recovery-panel').hidden = true;
  syncRecoveryUi();
  refresh();
  if (result.ok) tell('Supplies ready.');
}

byId('recovery-retry').addEventListener('click', async () => {
  const button = byId('recovery-retry');
  button.disabled = true;
  try {
    if (saveStorage.status !== 'ready') {
      const result = saveStorage.retry(saveSnapshot());
      if (result.ok && 'needsRestore' in result && result.needsRestore) { window.location.reload(); return; }
      economyLastTick = performance.now();
    } else if (!scene || !armyScene) {
      window.location.reload();
      return;
    } else {
      await Promise.all([scene.retryAssets(), armyScene.retryAssets()]);
    }
    syncRecoveryUi();
  } finally { button.disabled = false; }
});

byId('recovery-reset').addEventListener('click', () => {
  if (!recoveryResetArmed) {
    recoveryResetArmed = true;
    resetSaveToken = saveStorage.prepareReset();
    byId('recovery-reset').textContent = 'Confirm reset';
    byId('recovery-reset-confirmation').hidden = false;
    return;
  }
  resetRun();
});

byId('recovery-panel').addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); }
  if (event.key !== 'Tab') return;
  const buttons = [...byId('recovery-panel').querySelectorAll('button')].filter(button => !button.hidden && !button.disabled);
  event.preventDefault();
  if (!buttons.length) return;
  const index = buttons.findIndex(button => button === document.activeElement);
  buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
});

function renderScene() {
  // Both canvases show the same level, including preparation, defeat and campaign replay.
  const levelNumber = getWaveDefinition(battle?.waveNumber ?? nextWaveNumber()).levelNumber;
  scene?.render({ units, selectedId: null, movingId: null, placementType: null, battle, time: visualTime, levelNumber,
    unlockedCells: progression.unlockedCells, heroState: hero, capitolState: capitol });
  const selected = units.find(unit => unit.id === selectedId);
  const recruit = reserve.find(unit => unit.id === pendingRecruitId);
  armyScene?.render({ units, selectedId, movingId, levelNumber,
    mergeTargets: mergeTargetIds, mergeLevel,
    draggedId: draggedMerge?.source.location === 'army' ? draggedMerge.source.id : null,
    dragTargetId: draggedMerge?.targetId ?? null,
    placementType: recruit?.type ?? (movingId ? selected?.type : null), replacingFromReserve: !!recruit,
    placementLevel: recruit?.level ?? selected?.level ?? 1, battle: null, time: visualTime,
    unlockedCells: progression.unlockedCells, barracksLevel: barracks.level,
    nextUnlockCost: nextCellCost(progression, barracks.level), selectedLockedCell, selectedEmptyCell });
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
  addHeroXpEffect(battle, battle.heroXp.gained);
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
  if (battle || !scene || !units.length || !telegram.isActive || isRecovering()) return;
  // Keep the cell picker or move action open across automatic wave transitions.
  if (runComplete()) { clearedWaves = 0; lastOutcome = null; save(); }
  battle = createBattle(units, nextWaveNumber(), hero, forge, capitol);
  if (!onboardingCompleted) { onboardingCompleted = true; save(); }
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
function stopFrames() { cancelAnimationFrame(frameId); frameId = 0; framePacer.reset(); resetFrameRate(); }
function resumeFrames() {
  if (!destroyed && !frameId && scene && telegram.isActive && !paused && !isRecovering()) frameId = requestAnimationFrame(frame);
}
function frame(timestamp: number) {
  frameId = 0;
  if (destroyed || !telegram.isActive || paused || isRecovering()) { framePacer.reset(); resetFrameRate(); return; }
  const realDelta = framePacer.sample(timestamp);
  if (realDelta === null) { resumeFrames(); return; }
  const dt = Math.min(realDelta, MAX_REAL_FRAME_DELTA);
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
  refreshOnboarding();
  levelMusic.setActive(false);
  battleAudio.setActive(false);
  stopFrames();
  if (hasActiveBattle()) { paused = true; refresh(); }
}

function activateGame() {
  if (!economyActive) collectOfflineIncome();
  economyLastTick = performance.now(); economyActive = true;
  paused = false;
  battleAudio.setActive(battle?.phase === 'running' && !isRecovering());
  if (battle?.phase === 'running') void battleAudio.unlock();
  refresh();
  showOfflineIncome();
  showMarketArrival();
  resumeFrames();
}

function onPageHide(event: PageTransitionEvent) {
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
    onboardingGuide.destroy();
  }
}

function onPageShow(event: PageTransitionEvent) {
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
unitDrag = setupUnitDrag<MergeSource>({ getSource: dragSourceAt, onStart: startDragMerge,
  onMove: moveDragMerge, onDrop: dropDragMerge, onCancel: cancelDragMerge });
refresh();
const economyTimer = setInterval(tickEconomy, 1000);
try {
  const [loadedScene, loadedArmy] = await Promise.all([
    createScene(byId('battle'), { placementGrid: false, onHero: () => { setOverlay('hero-panel', byId('open-hero')); refresh(); }, onAssetState: state => onAssetState('battle', state) }),
    createScene(byId('army-map'), { formationOnly: true, onCell, onAssetState: state => onAssetState('army', state) }),
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
    onAssetState('battle', { status: 'error', error });
  }
}
