import { createCampaignState, restoreCampaignState, resetCampaignState, campaignSnapshot } from './campaign-state.ts';
import * as commands from './campaign-commands.ts';
import { createBattleRewardReceipt, applyBattleKillRewards, applyCampaignBattleResult } from './campaign-rewards.ts';
import type { BattleRewardReceipt } from './campaign-rewards.ts';
import { createScene } from './scene.ts';
import { getOnboardingStep } from './onboarding.ts';
import { createOnboardingGuide } from './onboarding-ui.ts';
import './onboarding.css';
import { UNIT_TYPES, isHealingUnit } from './units.ts';
import { BATTLE_VIEW, FORMATION_VIEW } from './field.ts';
import { createBattle, updateBattle } from './combat.ts';
import { WAVE_DEFINITIONS, WAVES_PER_ROUND, ROUNDS_PER_LEVEL, LEVEL_COUNT, getRoundWaves, getWaveDefinition } from './waves.ts';
import { setupTelegramAdapter } from './telegram.ts';
import { createBattleAudio } from './audio.ts';
import { createLevelMusic } from './music.ts';
import { DEFAULT_BATTLE_SPEED, MAX_REAL_FRAME_DELTA, battleFrameDelta, nextBattleSpeed } from './battle-speed.ts';
import { createFrameRateMeter } from './fps.ts';
import { createFramePacer } from './frame-pacer.ts';
import { createCombatProfiler, collectProfilerCounters } from './combat-profiler.ts';
import { createProfilerPanel } from './profiler-panel.ts';
import { createSaveStorage } from './save-storage.ts';
import { createSaveSession } from './save-session.ts';
import { createLoadingIndicator } from './loading-indicator.ts';
import { treasuryRate, treasuryUpgradeCost, TREASURY_OFFLINE_LIMIT_SECONDS, CAPTURE_COOLDOWN, STARTER_CAPTURES, capturePityKills, captureDropChance } from './economy.ts';
import { marketRate, marketUpgradeCost, MARKET_PRODUCTION_SECONDS, MARKET_OFFLINE_LIMIT_SECONDS } from './market.ts';
import { SAVE_KEY, cellKey, nextCellCost, getCellAvailability } from './progression.ts';
import { RECRUIT_COST, getRecruitChances } from './recruitment.ts';
import { canRecruitFromPool } from './recruitment-pools.ts';
import { createMercenariesUI } from './mercenaries-ui.ts';
import type { MercenariesUI } from './mercenaries-ui.ts';
import { FORGE_UPGRADES } from './forge.ts';
import { applyBattleFood, getArmyUnitStats, NO_FOOD } from './army-food.ts';
import type { FoodBonuses } from './army-food.ts';
import { kitchenBonuses } from './kitchen.ts';
import { createKitchenUI } from './kitchen-ui.ts';
import type { KitchenUI } from './kitchen-ui.ts';
import { createForgeUI } from './forge-ui.ts';
import type { ForgeUI } from './forge-ui.ts';
import { CROPS } from './farm.ts';
import type { CropId } from './farm.ts';
import { createFarmUI } from './farm-ui.ts';
import type { FarmUI } from './farm-ui.ts';
import { getCapitolStats } from './capitol.ts';
import { createCapitolUI } from './capitol-ui.ts';
import type { CapitolUI } from './capitol-ui.ts';
import { SELL_PRICE, STARTING_SLAVES, getBarracksUpgrade } from './barracks.ts';
import { getMergeResult, getConnectResult } from './unit-merging.ts';
import { renderConnectPanel } from './connect-ui.ts';
import { setupUnitDrag } from './unit-drag.ts';
import { addHeroXpEffect } from './hero-xp-effect.ts';
import { createHeroUI } from './hero-ui.ts';
import { byId } from './main-dom.ts';
import { createScreenController } from './screen-controller.ts';
import { createDungeonsUI } from './dungeons-ui.ts';
import type { DungeonsUI } from './dungeons-ui.ts';
import { createDungeonRun, selectDungeonCell, startDungeonBattle } from './dungeon-run.ts';
import type { DungeonRun } from './dungeon-run.ts';
import { createDungeonRunUI } from './dungeon-run-ui.ts';
import './dungeons.css';

import { getUnitCellWidth, getUnitAtCell } from './unit-footprint.ts';
import { decodeCampaignSave, needsCampaignSaveMigration, SAVE_SCHEMA_VERSION } from './campaign-save.ts';
import type { GameElementId } from './main-dom.ts';
import type { Battle, BattlePhase } from './combat-types.ts';
import type { HeroXpResult } from './hero.ts';
import type { HeroUI } from './hero-ui.ts';
import type { ArmyUnit, MergeSource } from './unit-merging.ts';
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
import './kitchen.css';

interface GameBattle extends Battle {
  campaignRewards: BattleRewardReceipt;
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
const combatProfiler = new URLSearchParams(window.location.search).get('profile') === '1'
  ? createCombatProfiler({ enabled: true, targetFps: 30 }) : null;
const profilerPanel = combatProfiler ? createProfilerPanel(combatProfiler) : null;

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
let campaign = createCampaignState(Date.now());
let campaignError: string | null = null;

let reservePage = 0;
let barracksPage = 0;
let barracksSelectedId: number | null = null;

let forgeUI: ForgeUI | null = null;
let farmUI: FarmUI | null = null;
let kitchenUI: KitchenUI | null = null;
let foodBonuses: FoodBonuses = NO_FOOD;

function syncFood() {
  const next = kitchenBonuses(campaign.kitchen, Date.now());
  const changed = next.health !== foodBonuses.health || next.attack !== foodBonuses.attack
    || next.attackSpeed !== foodBonuses.attackSpeed;
  foodBonuses = next;
  if (battle) applyBattleFood(battle, foodBonuses);
  if (dungeonRun?.battle) applyBattleFood(dungeonRun.battle, foodBonuses);
  return changed;
}
let capitolUI: CapitolUI | null = null;
const unitStatFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

let heroUI: HeroUI | null = null;
let mercenariesUI: MercenariesUI | null = null;
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

let selectedId: number | null = null, movingId: number | null = null;
let scene: Scene | undefined, toastTimer: ReturnType<typeof setTimeout> | undefined;
let battle: GameBattle | null = null, paused = false, lastOutcome: BattlePhase | null = null;
let battleSpeed: BattleSpeed = DEFAULT_BATTLE_SPEED;
const AUTO_WAVE_DELAY = 2;
let autoNextRemaining: number | null = null;
let armyScene: Scene | null = null;

let offlineRewardFocus: FocusElement | null = null;
const offlineRewardInert = new Map<HTMLElement, boolean>();
let selectedLockedCell: string | null = null, selectedEmptyCell: string | null = null;
let overlay: HTMLElement | null = null, overlayOpener: HTMLElement | null = null, resetArmed = false;
let frameId = 0, visualTime = 0, hudElapsed = 0, resultAge = 0;
let destroyed = false;
let dungeonsUI: DungeonsUI | null = null;
let dungeonRun: DungeonRun | null = null;
const screens = createScreenController({ app: byId('app'), dungeons: byId('dungeons-screen'),
  background: [...document.querySelectorAll<HTMLElement>('.wave-track, .battlefield, .army-dock')],
  onChange: screen => {
    const visible = screen !== 'dungeons';
    fitPortraitPreview();
    if (screen === 'campaign') {
      byId('army-map').setAttribute('aria-label', 'Next wave formation. Tap a tile to recruit or manage a fighter.');
      byId('battle').dataset.phase = battle?.phase ?? 'formation';
      if (!battle) delete byId('battle').dataset.combat;
    }
    // Refresh retained state before re-enabling drawing, so return never flashes
    // an obsolete battle. Keep the shared simulation/economy clocks running.
    if (visible) renderScene();
    scene?.setDrawingEnabled(visible);
    armyScene?.setDrawingEnabled(visible);
    battleAudio.setActive(visible && visibleBattle()?.phase === 'running' && telegram.isActive && !paused && !isRecovering());
    resetFrameRate();
    refreshOnboarding();
  },
});
function isCampaignScreen() { return screens.active === 'campaign'; }
function isDungeonBattleScreen() { return screens.active === 'dungeon-battle'; }
function visibleBattle() { return isDungeonBattleScreen() ? dungeonRun?.battle ?? null : battle; }
const assetStates: Record<'battle' | 'army', LoadState> = { battle: { status: 'loading' }, army: { status: 'loading' } };
const recoveryInert = new Map<HTMLElement, boolean>();
let recoveryFocus: FocusElement | null = null, resetSaveToken: symbol | null = null, recoveryResetArmed = false, recoveryUiScheduled = false;
let recoveryBlocked = false;
const loadingIndicator = createLoadingIndicator(scheduleRecoveryUi);
let sessionPageHidden = false;
const saveSession = createSaveSession({ key: SAVE_KEY });
// Navigation can interrupt the initial async lock request before the full game
// lifecycle exists. Revoke that request too, so a hidden page cannot gain ownership.
function onStartupPageHide(event: PageTransitionEvent) {
  sessionPageHidden = true;
  if (!event.persisted) destroyed = true;
  saveSession.release();
}
window.addEventListener('pagehide', onStartupPageHide);
await saveSession.acquire();
const saveStorage = createSaveStorage<ReturnType<typeof saveSnapshot>>({ key: SAVE_KEY, getStorage: () => window.localStorage,
  decode: decodeCampaignSave,
  canWrite: () => saveSession.canWrite && !sessionPageHidden && !destroyed,
  migrationBackup: { key: `${SAVE_KEY}:backup:before-schema-${SAVE_SCHEMA_VERSION}`, needed: needsCampaignSaveMigration },
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
  if (visibleBattle()?.phase !== 'running' || !telegram.isActive) return;
  battleSpeed = nextBattleSpeed(battleSpeed);
  framePacer.reset();
  refreshSpeedButton();
});

// Restore off to the side; publish state only after every migration succeeds.
try {
  const loaded = saveStorage.load();
  if (loaded.ok) {
    campaign = loaded.value === null ? createCampaignState(Date.now()) : restoreCampaignState(loaded.value, Date.now());
    save();
  }
} catch (error) {
  saveStorage.protectRestoreFailure(error);
  console.error('Could not restore the campaign', error);
  scheduleRecoveryUi();
}

function isUnlockedCell(key: string): key is CellKey {
  return (campaign.progression.unlockedCells as readonly string[]).includes(key);
}

function saveSnapshot() { return campaignSnapshot(campaign); }

function save() {
  if (campaignError) return false;
  const result = saveStorage.save(saveSnapshot());
  if (!result.ok) stopFrames();
  scheduleRecoveryUi();
  return result.ok;
}

function isProgressBlocked() {
  return !!campaignError || !saveSession.canWrite || sessionPageHidden || saveStorage.status !== 'ready';
}

function isRecovering() {
  return isProgressBlocked() || Object.values(assetStates).some(state => state.status !== 'ready');
}

function syncMusicActivity() {
  // Images can pause combat, but have no bearing on an already playing track.
  // Keep the real lifecycle and save-conflict gates independent of asset loading.
  levelMusic.setActive(!destroyed && telegram.isActive && !isProgressBlocked());
}

function stopForCampaignError(reason: string) {
  // Rejected automatic commands must not leave the battle running past an
  // unpaid reward. Keep the last durable save and require a fresh restoration.
  campaignError = reason;
  stopFrames(); scheduleRecoveryUi();
  console.error('Campaign command rejected', reason);
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
  const sessionError = !saveSession.canWrite;
  const storageError = !!campaignError || sessionError || saveStorage.status !== 'ready' && saveStorage.status !== 'unread';
  const assetError = Object.values(assetStates).some(state => state.status === 'error');
  const blocked = isRecovering();
  syncMusicActivity();
  if (blocked) onboardingGuide.hide();
  const panel = byId('recovery-panel');
  // Blocking and presentation are separate: a quick load must not flash a modal,
  // but it must still pause combat and prevent edits until its resources are ready.
  const entering = blocked && !recoveryBlocked;
  const leaving = !blocked && recoveryBlocked;
  recoveryBlocked = blocked;
  const visible = loadingIndicator.update(blocked, storageError || assetError);
  const showing = visible && panel.hidden;
  panel.hidden = !visible;
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
    byId('recovery-title').textContent = storageError ? 'Progress needs attention' : assetError ? 'Battlefield unavailable' : 'Loading battlefield';
    byId('recovery-description').textContent = storageError
      ? campaignError ? 'Progress could not be updated. Reload to restore your last saved progress.'
        : sessionError ? saveSession.status === 'unavailable'
          ? 'Safe saving is unavailable in this browser. Update Telegram or your browser, then retry. Your progress has not been changed.'
          : 'Another game window may be using this progress. Close it, then retry here. Your progress is protected.'
        : saveStorage.status === 'conflict' ? 'Progress changed in another game window. Reload to continue with the latest saved progress.'
        : saveStorage.status === 'unsupported' ? 'This progress needs a newer game version. Reload or update the game to continue. Your save is protected.'
        : saveStorage.status === 'write-error' ? 'Progress is not saved. Keep this game open and retry.'
        : saveStorage.status === 'corrupt' ? 'Saved progress is damaged. Saving is paused to protect it.'
          : 'Saved progress could not be loaded. Saving is paused to protect it.'
      : assetError ? 'Some game images could not be loaded. Check your connection and retry. The battle is paused.'
        : 'Preparing your map and fighters. The battle is paused.';
    byId('recovery-retry').hidden = !storageError && !assetError;
    byId('recovery-retry').textContent = campaignError || ['conflict', 'unsupported'].includes(saveStorage.status) ? 'Reload game' : 'Retry';
    byId('recovery-reset').hidden = !!campaignError || sessionError || !['read-error', 'corrupt'].includes(saveStorage.status);
    if (byId('recovery-reset').hidden) {
      resetSaveToken = null; recoveryResetArmed = false;
      byId('recovery-reset-confirmation').hidden = true;
      byId('recovery-reset').textContent = 'Reset saved game';
    }
    if (showing) panel.focus({ preventScroll: true });
  } else {
    for (const [child, inert] of recoveryInert) child.inert = inert;
    recoveryInert.clear();
    if (recoveryFocus?.isConnected && !recoveryFocus.closest<HTMLElement>('[inert]')) recoveryFocus.focus({ preventScroll: true });
    recoveryFocus = null;
    recoveryResetArmed = false;
    byId('recovery-reset-confirmation').hidden = true;
    byId('recovery-reset').textContent = 'Reset saved game';
    if (leaving) {
      battleAudio.setActive(screens.active !== 'dungeons' && visibleBattle()?.phase === 'running' && telegram.isActive && !paused);
      showOfflineIncome(); showMarketArrival();
      refreshOnboarding();
    }
    resumeFrames();
  }
  if (isDungeonBattleScreen()) refreshDungeonRun();
}

function onAssetState(which: 'battle' | 'army', state: LoadState) {
  assetStates[which] = state;
  if (state.status !== 'ready') stopFrames();
  scheduleRecoveryUi();
}

function collectOfflineIncome() {
  if (campaignError || !saveSession.canWrite || sessionPageHidden || saveStorage.status !== 'ready') return 0;
  const result = commands.claimCampaignOfflineIncome(campaign, Date.now());
  if (!result.ok) { stopForCampaignError(result.reason); return 0; }
  // Save income, consumed time and its unacknowledged receipt together, before any reload.
  save();
  return result.gold;
}

function showOfflineIncome() {
  if (!scene || !economyActive || isRecovering() || !byId('recovery-panel').hidden || (!campaign.offlineRewards.gold && !campaign.offlineRewards.slaves && !campaign.offlineRewards.closedCells && !campaign.offlineRewards.returnedFighters && !campaign.offlineRewards.forgeRefund)) return;
  unitDrag?.cancel();
  const panel = byId('offline-rewards-panel');
  byId('offline-gold-reward').hidden = !campaign.offlineRewards.gold;
  byId('offline-slaves-reward').hidden = !campaign.offlineRewards.slaves;
  byId('offline-gold-amount').textContent = `+${campaign.offlineRewards.gold}`;
  byId('offline-slaves-amount').textContent = `+${campaign.offlineRewards.slaves}`;
  byId('offline-rewards-title').textContent = campaign.offlineRewards.closedCells || campaign.offlineRewards.returnedFighters ? 'Army space updated' : campaign.offlineRewards.forgeRefund ? 'Forge updated' : 'Welcome back!';
  byId('offline-rewards-description').textContent = campaign.offlineRewards.closedCells
    ? `${campaign.offlineRewards.closedCells} ${campaign.offlineRewards.closedCells === 1 ? 'tile now requires' : 'tiles now require'} a Barracks upgrade. Your fighters and gold are safe.`
    : campaign.offlineRewards.returnedFighters ? 'Panther Riders now need two adjacent tiles. Fighters without enough room are safe in Barracks.'
    : campaign.offlineRewards.forgeRefund ? 'Forge upgrades now apply to all fighters. Your gold for retired archer upgrades has been returned.'
      : 'Your buildings kept working.';
  byId('slot-refund-reward').hidden = !campaign.offlineRewards.closedCells;
  byId('slot-refund-amount').textContent = `+${campaign.offlineRewards.slotRefund}`;
  byId('forge-refund-reward').hidden = !campaign.offlineRewards.forgeRefund;
  byId('forge-refund-amount').textContent = `+${campaign.offlineRewards.forgeRefund}`;
  byId('returned-fighters-note').hidden = !campaign.offlineRewards.returnedFighters;
  byId('returned-fighters-note').textContent = `${campaign.offlineRewards.returnedFighters} ${campaign.offlineRewards.returnedFighters === 1 ? 'fighter returned' : 'fighters returned'} to Barracks.`;
  byId('offline-storage-note').hidden = !campaign.offlineRewards.gold && !campaign.offlineRewards.slaves;
  byId('collect-offline-rewards').textContent = campaign.offlineRewards.closedCells || campaign.offlineRewards.returnedFighters || campaign.offlineRewards.forgeRefund ? 'Continue' : 'Collect';
  if (!panel.hidden) return;
  // A native top-layer confirmation must yield to the game's recovery/receipt UI.
  if (isDungeonBattleScreen()) dungeonRunUI.dismissConfirmation();
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
  const collectedSlaves = commands.acknowledgeOfflineRewards(campaign).rewards.slaves;
  panel.hidden = true;
  for (const [element, wasInert] of offlineRewardInert) element.inert = wasInert;
  offlineRewardInert.clear();
  // A first click after OS sleep can open a menu while tickEconomy reveals the receipt.
  document.querySelectorAll<HTMLElement>('.wave-track, .battlefield, .army-dock').forEach(element => {
    element.inert = screens.active === 'dungeons' || !!overlay && !overlay.contains(element);
  });
  farmUI?.refresh();
  capitolUI?.refresh();
  const target = offlineRewardFocus?.isConnected && offlineRewardFocus !== document.body && !offlineRewardFocus.disabled
    && !offlineRewardFocus.closest<HTMLElement>('[inert]') && offlineRewardFocus.getClientRects().length
    ? offlineRewardFocus : screens.active === 'dungeons' ? byId('dungeons-screen') : overlay?.querySelector<HTMLElement>('[data-close-overlay]') ?? byId('army-map');
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
const canEditFormation = () => isCampaignScreen() && !!armyScene && telegram.isActive && !isRecovering();
function saveFormation() { save(); }

function refreshArmyWallet() {
  byId('army-gold').textContent = String(campaign.gold);
  byId('army-slaves').textContent = String(campaign.economy.slaves);
}

function refreshRecruitment() {
  const button = byId('transform-slave');
  const recruitable = canRecruitFromPool(campaign.recruitmentPool, campaign.barracks.level);
  byId('market-slaves').textContent = String(campaign.economy.slaves >= 1000 ? hudGoldFormat.format(campaign.economy.slaves) : campaign.economy.slaves);
  byId('market-slaves').parentElement!.title = `${campaign.economy.slaves} slaves`;
  button.classList.toggle('has-slaves', recruitable && campaign.economy.slaves >= RECRUIT_COST);
  const reserveStock = Math.max(0, campaign.reserve.length - (transforming ? 1 : 0));
  byId('barracks-stock').textContent = String(reserveStock >= 1000 ? hudGoldFormat.format(reserveStock) : reserveStock);
  byId('open-barracks').disabled = !canEditFormation() || transforming;
  button.disabled = !canEditFormation() || (recruitable && campaign.economy.slaves < RECRUIT_COST) || transforming;
  const chances = getRecruitChances(campaign.barracks.level >= 2, campaign.recruitmentPool, campaign.recruitment, campaign.barracks.level);
  const odds = chances.map(({ type, chance }) => `${types[type].name} ${Number((chance * 100).toFixed(1))}%`).join(', ');
  const guaranteedLancer = campaign.recruitmentPool === 'humans' && campaign.barracks.firstLancerPending;
  const nextRecruit = guaranteedLancer ? 'Next recruit: guaranteed Lancer.' : odds;
  const previewLabel = 'Elven recruits require Mercenaries III. Open Mercenaries for details.';
  button.setAttribute('aria-label', recruitable ? `Transform 1 slave into a fighter. ${campaign.economy.slaves} slaves available. ${nextRecruit}` : previewLabel);
  button.title = recruitable ? nextRecruit : previewLabel;
  byId('market-convert-label').textContent = campaign.recruitmentPool === 'elves' ? 'Elves' : guaranteedLancer ? 'Lancer next' : 'Market';
  const upgrade = getBarracksUpgrade(campaign.barracks, campaign.recruitment);
  byId('barracks-building-level').textContent = ['I', 'II', 'III', 'IV'][campaign.barracks.level - 1] + (['upgrading', 'ready'].includes(upgrade.status) ? '…' : '');
  byId('open-market-info').classList.toggle('upgrade-available', upgrade.canStart);
  byId('open-market-info').disabled = !canEditFormation();
  refreshOnboarding();
  if (overlay?.id === 'market-info-panel') refreshRecruitmentDetails();
}

function refreshOnboarding() {
  if (campaign.onboardingCompleted || destroyed || !canEditFormation() || transforming || draggedMerge
    || !byId('offline-rewards-panel').hidden) { onboardingGuide.hide(); return; }
  const emptyKey = campaign.progression.unlockedCells.find(key => {
    const [col, row] = key.split(':').map(Number);
    return !getUnitAtCell(campaign.units, col, row);
  });
  const received = Object.values(campaign.recruitment.received).reduce((sum, count) => sum + count, 0);
  const step = getOnboardingStep({ completed: campaign.onboardingCompleted, inBattle: !!battle,
    received, slaves: campaign.economy.slaves, army: campaign.units.length, reserve: campaign.reserve.length, hasEmptyCell: !!emptyKey });
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
    const left = Math.min(campaign.economy.slaves, Math.max(1, STARTING_SLAVES - received));
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
  if (!pendingMarketArrival || destroyed || !telegram.isActive || overlay || !isCampaignScreen()
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

function refreshRecruitmentDetails() { mercenariesUI?.refresh(); }

byId('transform-slave').addEventListener('click', () => {
  if (!canEditFormation() || overlay || transforming) return;
  commands.completeCampaignBarracksUpgrade(campaign, Date.now());
  if (!canRecruitFromPool(campaign.recruitmentPool, campaign.barracks.level)) {
    setOverlay('market-info-panel', byId('transform-slave')); refresh();
    return;
  }
  const result = commands.recruitFighter(campaign, { now: Date.now(), random: Math.random });
  if (!result.ok) return;
  reservePage = Math.floor((campaign.reserve.length - 1) / RESERVE_PAGE_SIZE);
  barracksPage = Math.floor((campaign.reserve.length - 1) / BARRACKS_PAGE_SIZE);
  // Commit the cost and fighter together before the purely cosmetic reveal starts.
  saveFormation();
  transforming = true;
  const reveal = byId('market-recruit-reveal');
  byId('market-recruit-art').src = String(scene!.getUnitArt(result.type, result.level));
  byId('market-recruit-level').textContent = `Lv.${result.level}`;
  reveal.setAttribute('aria-label', `${types[result.type].name}, level ${result.level}, received in Barracks`);
  reveal.hidden = false;
  byId('transform-slave').classList.add('is-transforming', 'is-working');
  document.querySelector<HTMLElement>('.recruitment-dock')!.classList.add('is-transferring');
  refresh();
  clearTimeout(transformTimer);
  transformTimer = setTimeout(() => {
    finishRecruitReveal();
    if (!destroyed) {
      refreshRecruitment();
    }
  }, 1200);
});

function refreshEconomy() {
  if (combatProfiler) combatProfiler.measure('ui', refreshEconomyContent);
  else refreshEconomyContent();
}

function refreshEconomyContent() {
  if (!isCampaignScreen()) return;
  // Only the small HUD abbreviates large balances; menus retain the exact amount.
  byId('gold-count').textContent = String(campaign.gold < 10000 ? campaign.gold : hudGoldFormat.format(campaign.gold));
  const goldLabel = `${campaign.gold} gold`;
  byId('gold-count').parentElement!.setAttribute('aria-label', goldLabel);
  byId('gold-count').parentElement!.title = goldLabel;
  byId('battle').dataset.gold = String(campaign.gold);
  byId('slaves-count').textContent = String(campaign.economy.slaves);
  byId('open-buildings').setAttribute('aria-label', `Buildings. ${campaign.economy.slaves} ${campaign.economy.slaves === 1 ? 'slave' : 'slaves'}`);
  byId('building-gold').textContent = String(campaign.gold);
  byId('building-slaves').textContent = String(campaign.economy.slaves);
  byId('treasury-level').textContent = String(campaign.economy.treasuryLevel);
  byId('treasury-rate').textContent = String(treasuryRate(campaign.economy));
  byId('treasury-offline-note').textContent = `Offline storage: ${TREASURY_OFFLINE_LIMIT_SECONDS / 3600}h · up to ${treasuryRate(campaign.economy) * TREASURY_OFFLINE_LIMIT_SECONDS / 60} gold`;
  byId('treasury-progress').style.width = `${campaign.economy.treasuryProgress * 100}%`;
  byId('treasury-progress').parentElement!.setAttribute('aria-valuenow', String(Math.floor(campaign.economy.treasuryProgress * 100)));
  const seconds = Math.max(1, Math.ceil((1 - campaign.economy.treasuryProgress) * 60 / treasuryRate(campaign.economy)));
  byId('treasury-countdown').textContent = `${seconds}s`;
  byId('treasury-progress').parentElement!.setAttribute('aria-valuetext', `Next gold in ${seconds} seconds`);
  const cost = treasuryUpgradeCost(campaign.economy);
  byId('treasury-cost').textContent = String(cost ?? 'Max');
  byId('treasury-upgrade').disabled = cost === null || campaign.gold < cost;
  byId('treasury-upgrade').setAttribute('aria-label', cost === null ? 'Treasury at maximum level' : `Upgrade Treasury for ${cost} gold. Earn ${treasuryRate(campaign.economy) + 1} gold per minute`);
  const marketIncome = marketRate(campaign.economy), marketCost = marketUpgradeCost(campaign.economy);
  byId('market-status').textContent = `Level ${campaign.economy.marketLevel} · Income active`;
  byId('market-rate').textContent = `${marketIncome} ${marketIncome === 1 ? 'slave' : 'slaves'} / hour`;
  byId('market-cost').textContent = String(marketCost ?? 'Max');
  byId('market-build').disabled = marketCost === null || campaign.gold < marketCost;
  byId('market-build-label').textContent = marketCost === null ? 'Maximum level' : `Upgrade · ${marketIncome + 1} / hour`;
  byId('market-build').setAttribute('aria-label', marketCost === null ? 'Market at maximum level' : `Upgrade Market for ${marketCost} gold. Earn ${marketIncome + 1} slaves per hour`);
  const marketSeconds = Math.max(1, Math.ceil((1 - campaign.economy.marketProgress) * MARKET_PRODUCTION_SECONDS / marketIncome));
  byId('market-countdown').textContent = `${Math.floor(marketSeconds / 60)}:${String(marketSeconds % 60).padStart(2, '0')}`;
  byId('market-progress').style.width = `${campaign.economy.marketProgress * 100}%`;
  byId('market-progress').parentElement!.setAttribute('aria-valuenow', String(Math.floor(campaign.economy.marketProgress * 100)));
  byId('market-progress').parentElement!.setAttribute('aria-valuetext', `Next slave in ${marketSeconds} seconds`);
  byId('market-offline-note').textContent = `Offline storage: ${MARKET_OFFLINE_LIMIT_SECONDS / 3600}h · up to ${Math.floor(MARKET_OFFLINE_LIMIT_SECONDS * marketIncome / MARKET_PRODUCTION_SECONDS)} slaves`;
  refreshRecruitment();
  forgeUI?.refresh();
  farmUI?.refresh();
  if (overlay?.id === 'kitchen-panel') kitchenUI?.refresh();
  capitolUI?.refresh();
  const captureSeconds = Math.ceil(campaign.economy.captureCooldown);
  const captureLimit = capturePityKills(campaign.economy);
  const captureProgress = Math.min(campaign.economy.captureKills, captureLimit);
  byId('capture-status').textContent = captureSeconds > 0
    ? `Next search in ${Math.floor(captureSeconds / 60)}:${String(captureSeconds % 60).padStart(2, '0')}`
    : campaign.economy.captures < STARTER_CAPTURES ? `Starter capture ${campaign.economy.captures + 1}/${STARTER_CAPTURES}: ${captureProgress}/${captureLimit} kills`
    : `Searching: ${captureProgress} / ${captureLimit} kills`;
  byId('capture-detail').textContent = campaign.economy.captureCooldown > 0
    ? `${CAPTURE_COOLDOWN} seconds of active play between searches. No offline progress.`
    : `${Math.round(captureDropChance(campaign.economy) * 100)}% per kill. Guaranteed by ${captureLimit} kills. ${campaign.economy.captures < STARTER_CAPTURES ? 'No wait for the first four captures.' : 'Progress is saved.'}`;
  refreshArmyWallet();
}

function tickEconomy(now = performance.now()) {
  const elapsed = Math.max(0, (now - economyLastTick) / 1000);
  economyLastTick = now;
  // Unexpected native lock loss also needs visible recovery when no user action
  // is trying to save. The timer observes it without advancing the economy.
  if (!destroyed && !sessionPageHidden && !saveSession.canWrite) scheduleRecoveryUi();
  if (destroyed || campaignError || !saveSession.canWrite || sessionPageHidden || !economyActive || saveStorage.status !== 'ready') return;
  const wallNow = Date.now();
  const checkpoints = [campaign.economy.treasuryUpdatedAt, campaign.economy.marketBuilt ? campaign.economy.marketUpdatedAt : null];
  const wallElapsed = Math.max(0, ...checkpoints.filter(value => value !== null).map(value => (wallNow - value) / 1000));
  // OS sleep can suspend a visible page without a visibility event. Cap that gap like any absence.
  if (elapsed > 60 || wallElapsed > 60) {
    collectOfflineIncome();
    economyUnsaved = 0;
    refresh(); showOfflineIncome();
    return;
  }
  // Real foreground time, independent of battle speed and open menus.
  const result = commands.accrueCampaignEconomy(campaign, { elapsedSeconds: elapsed, now: wallNow });
  if (!result.ok) { stopForCampaignError(result.reason); return; }
  const { gold: earned, slaves, barracksFinished } = result;
  economyUnsaved += elapsed;
  if (earned || slaves || barracksFinished || economyUnsaved >= 15) { save(); economyUnsaved = 0; }
  if (syncFood() || earned || slaves || barracksFinished) refresh(); else refreshEconomy();
  if (overlay?.id === 'market-info-panel') refreshBarracksUpgrade();
  if (slaves) showMarketArrival(slaves);
}

function setOverlay(id: GameElementId, opener: HTMLElement | null) {
  if (!isCampaignScreen() && !(isDungeonBattleScreen() && id === 'hero-panel')) return;
  unitDrag?.cancel();
  if (overlay) closeOverlay(false);
  tickEconomy();
  overlay = byId(id); overlayOpener = opener;
  byId('app').classList.add('has-menu');
  overlay.hidden = false;
  if (id === 'market-info-panel') mercenariesUI?.open();
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

mercenariesUI = createMercenariesUI({ panel: byId('market-info-panel'), getState: () => campaign,
  getPortrait: (type, level) => scene?.getUnitArt(type, level) ?? undefined,
  canEdit: () => canEditFormation() && !transforming,
  onPool: pool => {
    if (!canEditFormation() || transforming || overlay?.id !== 'market-info-panel') return;
    tickEconomy();
    if (!canEditFormation() || overlay?.id !== 'market-info-panel') return;
    if (!commands.selectRecruitmentPool(campaign, pool).ok) { refreshRecruitmentDetails(); return; }
    save(); refresh();
  },
  onUpgrade: finish => {
    if (!canEditFormation() || transforming || overlay?.id !== 'market-info-panel') return;
    tickEconomy();
    if (!canEditFormation() || overlay?.id !== 'market-info-panel') return;
    const result = finish ? commands.finishCampaignBarracksUpgrade(campaign, Date.now())
      : commands.startCampaignBarracksUpgrade(campaign, Date.now());
    if (result.ok) save();
    refresh();
  },
  onMarket: () => { closeOverlay(false); byId('transform-slave').focus({ preventScroll: true }); },
});

heroUI = createHeroUI({ button: byId('open-hero'), panel: byId('hero-panel'),
  getHero: () => campaign.hero, getBattle: visibleBattle, close: () => closeOverlay(),
  onLearn: id => {
    if (!(canEditFormation() || isDungeonBattleScreen() && telegram.isActive && !isRecovering())) return null;
    const result = commands.learnCampaignHeroTalent(campaign, id);
    return result.ok ? { spent: true, reason: '', rank: result.rank } : null;
  },
  onReset: () => {
    if (!(canEditFormation() || isDungeonBattleScreen() && telegram.isActive && !isRecovering())) return null;
    const result = commands.resetCampaignHeroTalents(campaign, { battleRunning: visibleBattle()?.phase === 'running' || battle?.phase === 'running' });
    return result.ok ? { reset: true, refunded: result.refunded } : null;
  },
  onChange: () => { save(); refresh(); } });

const dungeonRunUI = createDungeonRunUI({ battlefield: byId('battle').parentElement!, armyDock: byId('army-map').closest<HTMLElement>('.army-dock')!,
  onExit: () => {
    if (!isDungeonBattleScreen() || dungeonRun?.battle?.phase === 'running' || isRecovering() || !byId('offline-rewards-panel').hidden) return;
    closeOverlay(false);
    dungeonRun = null;
    dungeonRunUI.refresh(null, campaign.forge, true, false, battleSpeed);
    screens.show('dungeons');
    framePacer.reset();
    dungeonsUI?.open(); refresh(); resumeFrames();
  },
  onStart: () => {
    if (!dungeonRun || !isDungeonBattleScreen() || overlay || isRecovering() || !telegram.isActive || !byId('offline-rewards-panel').hidden) return;
    if (!startDungeonBattle(dungeonRun, campaign.hero, campaign.forge)) return;
    battleAudio.setActive(visibleBattle()?.phase === 'running');
    void battleAudio.unlock();
    framePacer.reset(); refresh(); resumeFrames();
  },
  onSpeed: () => {
    if (!isDungeonBattleScreen() || dungeonRun?.battle?.phase !== 'running' || !telegram.isActive || isRecovering()) return;
    battleSpeed = nextBattleSpeed(battleSpeed); framePacer.reset(); refresh();
  },
});

function refreshDungeonRun() {
  dungeonRunUI.refresh(dungeonRun, campaign.forge, !isRecovering(), paused, battleSpeed, foodBonuses);
  const active = dungeonRun?.battle;
  byId('battle').dataset.phase = active?.phase ?? 'formation';
  byId('battle').setAttribute('aria-label', `Goblin Cave. Wave ${dungeonRun?.wave.number ?? 1}. ${active ? `${active.kills} of ${active.total} enemies defeated.` : 'Prepare your army.'}`);
  byId('army-map').setAttribute('aria-label', active
    ? 'Dungeon army. Formation is fixed for this run. Fallen fighters remain out.'
    : 'Dungeon army. Tap a fighter, then a purchased tile to move or swap.');
  byId('army-status').textContent = 'Your dungeon formation. Main army remains unchanged.';
}

dungeonsUI = createDungeonsUI({ root: byId('dungeons-screen'),
  getProgress: () => ({ clearedWaves: campaign.clearedWaves, firstClears: campaign.progression.firstClears }),
  getCampaignStatus: () => battle?.phase === 'running' ? 'Main battle continues'
    : autoNextRemaining !== null ? 'Next wave starts automatically'
    : battle ? 'Main battle finished' : 'Your army is waiting',
  onEnter: level => {
    if (screens.active !== 'dungeons' || isRecovering() || !telegram.isActive || !byId('offline-rewards-panel').hidden) return;
    const run = createDungeonRun(level, { clearedWaves: campaign.clearedWaves, firstClears: campaign.progression.firstClears },
      campaign.units, campaign.progression.unlockedCells);
    if (!run) return;
    dungeonRun = run;
    dungeonsUI?.close();
    screens.show('dungeon-battle');
    framePacer.reset(); refresh(); resumeFrames(); dungeonRunUI.focus();
  },
  onExit: () => {
    if (isRecovering() || !byId('offline-rewards-panel').hidden) return;
    dungeonsUI?.close();
    screens.show('campaign');
    byId('open-dungeons').setAttribute('aria-expanded', 'false');
    refresh(); refreshBattleHud(); showMarketArrival();
    byId('open-dungeons').focus({ preventScroll: true });
  },
});
byId('open-dungeons').addEventListener('click', () => {
  if (!isCampaignScreen() || !scene || !armyScene || isRecovering() || !byId('offline-rewards-panel').hidden) return;
  tickEconomy();
  if (isRecovering() || !byId('offline-rewards-panel').hidden) return;
  unitDrag?.cancel(); closeOverlay(false); hideNotice();
  screens.show('dungeons');
  byId('open-dungeons').setAttribute('aria-expanded', 'true');
  dungeonsUI?.open();
});

forgeUI = createForgeUI({ root: byId('forge-upgrades'), getForge: () => campaign.forge, getGold: () => campaign.gold,
  canUpgrade: () => economyActive && !isRecovering(),
  onUpgrade: upgrade => {
    tickEconomy();
    if (!economyActive || isRecovering()) return;
    const result = commands.purchaseForgeUpgrade(campaign, upgrade);
    if (!result.ok) return;
    // Save the shared bonus and its gold cost together. A running battle owns its old stats.
    save(); refresh();
    const name = FORGE_UPGRADES.find(entry => entry.id === upgrade)!.name;
    byId('forge-feedback').textContent = `${name} +${campaign.forge[upgrade]}% · Applies next wave.`;
  } });

function canUpgradeCapitol() {
  return economyActive && !isRecovering() && overlay?.id === 'buildings-panel'
    && !byId('capitol-building').hidden && !!byId('offline-rewards-panel').hidden;
}

capitolUI = createCapitolUI({ root: byId('capitol-upgrades'), getCapitol: () => campaign.capitol, getGold: () => campaign.gold,
  canUpgrade: canUpgradeCapitol, onUpgrade: upgrade => {
    if (!canUpgradeCapitol()) return;
    tickEconomy();
    if (!canUpgradeCapitol()) return;
    const result = commands.purchaseCapitolUpgrade(campaign, upgrade);
    if (!result.ok) return;
    // Persist the purchase and its payment together; active combat owns a separate snapshot.
    save(); refresh();
    const stats = getCapitolStats(campaign.capitol);
    byId('capitol-feedback').textContent = `${upgrade === 'health' ? `${stats.hp} HP` : `Tower: ${stats.damage} damage / 2s`} · Applies next battle.`;
  } });

function canUseFarm() {
  return economyActive && !isRecovering() && overlay?.id === 'buildings-panel'
    && !byId('farm-building').hidden && !!byId('offline-rewards-panel').hidden;
}

function collectFarm(crop: CropId) {
  if (!canUseFarm()) return;
  tickEconomy();
  // A first action after sleep may open an income or recovery window.
  if (!canUseFarm()) return;
  const definition = CROPS.find(entry => entry.id === crop)!;
  const result = commands.harvestCampaignCrop(campaign, crop, Date.now());
  if (!result.ok) return;
  byId('farm-feedback').textContent = `+${result.amount} ${definition.name.toLowerCase()} stored. Growing continues.`;
  // Save the collection and its consumed production checkpoint together.
  save(); refresh();
}

farmUI = createFarmUI({ root: byId('farm-crops'), getFarm: () => campaign.farm,
  getGold: () => campaign.gold, canUse: canUseFarm, onHarvest: collectFarm, onUpgrade: () => {
    if (!canUseFarm()) return;
    tickEconomy();
    if (!canUseFarm()) return;
    const result = commands.upgradeCampaignFarm(campaign, Date.now());
    if (!result.ok) return;
    const unlocked = CROPS.find(crop => crop.unlockLevel === result.level)!;
    byId('farm-feedback').textContent = `Farm level ${result.level} · ${unlocked.name} now grows automatically.`;
    save(); refresh();
  } });

kitchenUI = createKitchenUI({ root: byId('kitchen-content'), getKitchen: () => campaign.kitchen,
  getFarm: () => campaign.farm, canUse: canUseKitchen, onCook: (recipe, quantity) => {
    if (!canUseKitchen()) return false;
    tickEconomy();
    if (!canUseKitchen()) return false;
    const result = commands.cookCampaignMeals(campaign, recipe, quantity, Date.now());
    if (!result.ok) { byId('kitchen-feedback').textContent = 'Unable to cook. Check ingredients and quantity.'; return false; }
    // Saving retries the resulting snapshot, never the ingredient-consuming command.
    save(); refresh();
    byId('kitchen-feedback').textContent = `${quantity} ${quantity === 1 ? 'portion' : 'portions'} cooked · +${quantity} cooking XP`;
    return true;
  } });

function canUseKitchen() {
  return economyActive && !isRecovering() && overlay?.id === 'kitchen-panel'
    && !!byId('offline-rewards-panel').hidden;
}
byId('open-kitchen').addEventListener('click', () => {
  if (isRecovering() || !byId('offline-rewards-panel').hidden) return;
  // Close returns focus to a visible game control, Back returns to the building entry.
  setOverlay('kitchen-panel', byId('open-buildings')); refresh();
});
byId('kitchen-back').addEventListener('click', () => {
  setOverlay('buildings-panel', byId('open-buildings')); refresh();
  byId('open-kitchen').focus({ preventScroll: true });
});

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
for (const panel of ['buildings-panel', 'kitchen-panel', 'profile-panel', 'unit-panel', 'barracks-panel', 'market-info-panel', 'hero-panel'] as const) {
  byId(panel).addEventListener('click', event => {
    if (event.target === byId(panel) || (event.target as Element).closest<HTMLElement>('[data-close-overlay]')) {
      closeOverlay();
    }
  });
  byId(panel).addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (panel === 'market-info-panel' && mercenariesUI?.back()) return;
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
  if (!economyActive || isRecovering()) return;
  if (!commands.purchaseTreasuryUpgrade(campaign).ok) return;
  save(); refresh();
});
byId('market-build').addEventListener('click', () => {
  if (!economyActive) return;
  tickEconomy();
  if (!economyActive || isRecovering()) return;
  if (!commands.purchaseMarket(campaign, Date.now()).ok) return;
  save(); refresh();
  byId('tab-market').focus({ preventScroll: true });
  tell(`Market Lv. ${campaign.economy.marketLevel}`);
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
const nextWaveNumber = () => Math.min(campaign.clearedWaves + 1, TOTAL_WAVES);
const runComplete = () => campaign.clearedWaves === TOTAL_WAVES;
const automaticWaveNumber = () => runComplete() ? 1 : nextWaveNumber();
const hasActiveBattle = () => battle?.phase === 'running' || autoNextRemaining !== null || dungeonRun?.battle?.phase === 'running';
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
    const done = step <= campaign.clearedWaves;
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
  if (combatProfiler) combatProfiler.measure('ui', refreshContent);
  else refreshContent();
  renderScene();
  // Keep the paused campaign's current assets warm for return from the cave.
  const upcoming = getWaveDefinition(isDungeonBattleScreen() ? battle?.waveNumber ?? nextWaveNumber() : battle?.phase === 'running'
    ? Math.min(TOTAL_WAVES, battle.waveNumber + 1) : nextWaveNumber());
  void scene?.preload({ units: campaign.units, wave: upcoming, capitolState: campaign.capitol });
  refreshOnboarding();
}

function refreshContent() {
  syncFood();
  levelMusic.setScene(isDungeonBattleScreen() ? 'goblin-cave' : 'campaign');
  if (!isCampaignScreen()) {
    telegram.setGameInProgress(hasActiveBattle());
    levelMusic.setLevel(getWaveDefinition(battle?.waveNumber ?? nextWaveNumber()).levelNumber);
    syncMusicActivity();
    dungeonsUI?.refresh();
    if (isDungeonBattleScreen()) { heroUI?.render(); refreshDungeonRun(); }
    return;
  }
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
  syncMusicActivity();
  refreshEconomy();
  heroUI?.render();
  byId('army-count').textContent = `${campaign.units.reduce((total, unit) => total + getUnitCellWidth(unit.type), 0)} / ${campaign.progression.unlockedCells.length}`;
  const pendingRecruit = campaign.reserve.find(unit => unit.id === pendingRecruitId);
  if (!pendingRecruit) pendingRecruitId = null;
  const mergeSource = draggedMerge?.source ?? pendingMerge;
  const merging = getMergeSource(mergeSource);
  if (!getMergeSource()) pendingMerge = null;
  // Recompute eligibility on roster/UI changes, not on every Canvas animation frame.
  mergeTargetIds = mergeSource ? campaign.units.filter(unit => getMergeResult(campaign.units, campaign.reserve, mergeSource, unit.id).ok).map(unit => unit.id) : [];
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
  byId('start-wave').disabled = !scene || !armyScene || !campaign.units.length;
  const startAction = runComplete() ? 'Replay' : lastOutcome === 'defeat' ? 'Retry' : 'Start';
  byId('start-label').textContent = startAction;
  const startDescription = runComplete() ? 'Replay campaign' : `${startAction} ${waveLabel(nextWaveNumber())}`;
  byId('start-wave').setAttribute('aria-label', startDescription);
  byId('start-wave').title = startDescription;
  byId('battle-toolbar').hidden = !battle;
  byId('battle-speed').disabled = battle?.phase !== 'running';
  refreshPhaseLabel();
  byId('auto-waves-state').textContent = campaign.autoWaves ? 'On' : 'Off';
  byId('auto-waves').setAttribute('aria-pressed', String(campaign.autoWaves));
  byId('auto-waves').setAttribute('aria-label', `Auto waves ${campaign.autoWaves ? 'on' : 'off'}. ${campaign.autoWaves ? 'Disable' : 'Enable'} automatic waves`);
  refreshSpeedButton(); refreshWaveTrack();
  const selected = campaign.units.find(unit => unit.id === selectedId);
  const panel = byId('selection-panel');
  refreshReserve(selected);
  // Touchmove/touchend keep their original target. Keep that icon connected even
  // when income refreshes the UI or pickup hides the Barracks dialog.
  if (!unitDrag?.tracking && !draggedMerge) refreshBarracks();
  if (selectedLockedCell) {
    const availability = getCellAvailability(campaign.progression, selectedLockedCell, campaign.barracks.level);
    const cost = availability.cost;
    byId('unit-panel-title').textContent = 'Unlock tile';
    panel.innerHTML = availability.allowed
      ? `<div class="placement-copy"><strong>Expand your army</strong><p>Cost: ${cost} gold · You have ${campaign.gold}</p></div><div class="selection-actions"><button data-action="unlock-cell"${campaign.gold < (cost ?? 0) ? ' disabled' : ''}>Unlock · ${cost} gold</button><button data-action="cancel">Cancel</button></div>`
      : `<div class="placement-copy"><strong>${availability.requiredBarracksLevel ? `Requires Mercenaries ${['I', 'II', 'III', 'IV'][availability.requiredBarracksLevel - 1]}` : 'Maximum army capacity'}</strong><p>${availability.requiredBarracksLevel ? 'Upgrade Mercenaries to unlock another tile to buy.' : 'No further army slots can be unlocked.'}</p></div><div class="selection-actions">${availability.requiredBarracksLevel ? '<button data-action="barracks-info">View upgrade</button>' : ''}<button data-action="cancel">Close</button></div>`;
  } else if (selected) {
    const type = types[selected.type];
    const stats = getArmyUnitStats(selected.type, selected.level, campaign.forge, foodBonuses);
    const hp = unitStatFormat.format(stats.hp), effect = unitStatFormat.format(isHealingUnit(selected.type) ? stats.heal : stats.damage);
    const portrait = scene?.getUnitArt?.(selected.type, selected.level);
    const lastGuard = !!battle && campaign.units.length === 1;
    byId('unit-panel-title').textContent = type.name;
    const markup = `<div class="selected-info">${portrait ? `<img class="selected-portrait" data-unit="${selected.type}" src="${portrait}" alt="" />` : ''}<div class="selected-copy"><div class="selected-line"><strong>${type.name}</strong><span class="unit-rank-name">Lv. ${selected.level}</span></div><p class="selected-stats">${hp} HP · ${effect} ${isHealingUnit(selected.type) ? 'healing' : 'attack'}${stats.attackSpeed > 1 ? ` · +${Math.round((stats.attackSpeed - 1) * 100)}% speed` : ''}${getUnitCellWidth(selected.type) === 2 ? ' · 2 tiles' : ''}</p></div></div><div class="selection-actions"><button data-action="move">Move</button><button data-action="remove"${lastGuard ? ' disabled title="Keep one guard for the next wave"' : ''}>To barracks</button></div>${connectPanelMarkup(true)}${lastGuard ? '<p class="building-note">Keep one guard or replace it from your barracks.</p>' : ''}`;
    refreshConnectPanel(panel, markup);
  } else {
    byId('unit-panel-title').textContent = 'Deploy a fighter';
    panel.innerHTML = '<p class="building-note">Choose a fighter from your barracks for this tile.</p>';
  }
  byId('army-map').dataset.formation = JSON.stringify(campaign.units);
  byId('army-map').dataset.unlockedCells = JSON.stringify(campaign.progression.unlockedCells);
  byId('army-map').setAttribute('aria-label', `Army for the next wave. ${campaign.units.length} guards. ${byId('army-status').textContent}. Use arrow keys and Enter to choose a tile.`);
  const canvas = byId('battle');
  canvas.dataset.formation = JSON.stringify(battle ? battle.allies.map(({ id, type, level }) => ({ id, type, level })) : campaign.units);
  canvas.dataset.gold = String(campaign.gold);
  const currentWave = getWaveDefinition(battle?.waveNumber ?? nextWaveNumber());
  canvas.dataset.campaign = JSON.stringify({ wave: currentWave.number, level: currentWave.levelNumber, round: currentWave.roundNumber, waveInRound: currentWave.waveInRound, clearedWaves: campaign.clearedWaves, complete: runComplete() });
  if (!battle) canvas.setAttribute('aria-label', `Preparing ${waveLabel(nextWaveNumber())}. ${campaign.units.length} defenders. Edit your army in the grid below.`);
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
}

function getMergeSource(source = pendingMerge) {
  return source && (source.location === 'army' ? campaign.units : campaign.reserve).find(unit => unit.id === source.id);
}

function canMerge(source: MergeSource) {
  return campaign.units.some(unit => getMergeResult(campaign.units, campaign.reserve, source, unit.id).ok);
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
  // Army unit details only offer reserve donors, including Select all and stale UI events.
  const roster = recipient.location === 'army' || location === 'reserve' ? campaign.reserve
    : location === 'army' ? campaign.units : [...campaign.units, ...campaign.reserve];
  return fighter ? roster.filter(unit => unit.id !== fighter.id && unit.type === fighter.type) : [];
}

function connectPanelMarkup(inline = false) {
  if (!connectSelection) return '';
  const { recipient, sourceTab, donorIds, notice } = connectSelection;
  const fighter = getMergeSource(recipient);
  if (!fighter) return '';
  const donors: MergeSource[] = [...donorIds].map(id => ({ id, location: recipient.location === 'army' ? 'reserve'
    : campaign.units.some(unit => unit.id === id) ? 'army' : 'reserve' }));
  const result = getConnectResult(campaign.units, campaign.reserve, recipient, donors, { minArmyUnits: battle ? 1 : 0 });
  const level = result.ok ? result.recipient.level : fighter.level;
  const stats = getArmyUnitStats(fighter.type, level, campaign.forge, foodBonuses);
  const before = getArmyUnitStats(fighter.type, fighter.level, campaign.forge, foodBonuses);
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
    const donors: MergeSource[] = [...connectSelection.donorIds].map(id => ({ id, location: recipient.location === 'army' ? 'reserve'
      : campaign.units.some(unit => unit.id === id) ? 'army' : 'reserve' }));
    const result = commands.connectCampaignFighters(campaign, recipient, donors, { minArmyUnits: battle ? 1 : 0 });
    if (!result.ok) { refresh(); return true; }
    // Apply the entire selection once to the saved roster; live combat owns its own actors.
    connectSelection.donorIds.clear();
    connectSelection.notice = `Connected · Lv. ${result.recipient.level}${battle ? ' · Applies next wave' : ''}`;
    saveFormation(); refresh();
    return true;
  }
  const location = button.dataset.connectLocation;
  if (location === 'army' || location === 'reserve') {
    if (recipient.location === 'army') return true;
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
  const result = commands.mergeCampaignFighters(campaign, source, targetId);
  if (!result.ok) {
    const messages: Partial<Record<import('./unit-merging.ts').MergeFailureReason, string>> = {
      'different-type': 'Pick the same type.', 'same-unit': 'Pick another unit.',
      'level-overflow': 'Level limit reached.', 'target-missing': 'Tap a green unit.',
    };
    tell(messages[result.reason] ?? 'Unit unavailable.');
    return false;
  }
  // Commit only the saved roster. The ongoing wave owns separate combat actors.
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
    const fighter = cell && getUnitAtCell(campaign.units, cell.col, cell.row);
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
  return cell && getUnitAtCell(campaign.units, cell.col, cell.row)?.id;
}

function moveDragMerge(point: DragPoint) {
  if (!draggedMerge) return;
  const targetId = dragTargetAt(point);
  draggedMerge.targetId = getMergeResult(campaign.units, campaign.reserve, draggedMerge.source, targetId).ok ? targetId : null;
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
  if (transforming || !getMergeResult(campaign.units, campaign.reserve, source, targetId).ok) {
    cancelDragMerge(); return;
  }
  clearDragMerge();
  mergeInto(targetId, source);
  byId('army-map').focus({ preventScroll: true });
}

function refreshReserve(selected: ArmyUnit | undefined) {
  const section = byId('reserve-section');
  section.hidden = !!connectSelection || !!selectedLockedCell || (!selectedEmptyCell && !selected);
  const pageCount = Math.max(1, Math.ceil(campaign.reserve.length / RESERVE_PAGE_SIZE));
  reservePage = Math.max(0, Math.min(reservePage, pageCount - 1));
  byId('reserve-count').textContent = String(campaign.reserve.length);
  byId('reserve-empty').hidden = campaign.reserve.length > 0;
  byId('reserve-pagination').hidden = pageCount === 1;
  byId('reserve-prev').disabled = reservePage === 0;
  byId('reserve-next').disabled = reservePage >= pageCount - 1;
  byId('reserve-page').textContent = `${reservePage + 1} / ${pageCount}`;
  byId('reserve-options').innerHTML = campaign.reserve.slice(reservePage * RESERVE_PAGE_SIZE, (reservePage + 1) * RESERVE_PAGE_SIZE).map(unit => {
    const portrait = scene?.getUnitArt(unit.type, unit.level);
    return `<button class="reserve-card" data-reserve-id="${unit.id}" type="button" aria-label="${selected ? 'Replace with' : 'Deploy'} ${types[unit.type].name}, level ${unit.level}">${portrait ? `<img src="${portrait}" alt="" />` : ''}<strong>${types[unit.type].name}</strong><small>Lv. ${unit.level}${getUnitCellWidth(unit.type) === 2 ? ' · 2 tiles' : ''}</small></button>`;
  }).join('');
}

function refreshBarracksUpgrade() { mercenariesUI?.tick(); }

function refreshBarracks() {
  const pageCount = Math.max(1, Math.ceil(campaign.reserve.length / BARRACKS_PAGE_SIZE));
  barracksPage = Math.max(0, Math.min(barracksPage, pageCount - 1));
  byId('barracks-count').textContent = String(campaign.reserve.length);
  byId('barracks-gold').textContent = String(campaign.gold);
  byId('barracks-empty').hidden = campaign.reserve.length > 0;
  byId('barracks-pagination').hidden = pageCount === 1;
  byId('barracks-prev').disabled = barracksPage === 0;
  byId('barracks-next').disabled = barracksPage >= pageCount - 1;
  byId('barracks-page').textContent = `${barracksPage + 1} / ${pageCount}`;
  byId('barracks-options').innerHTML = campaign.reserve.slice(barracksPage * BARRACKS_PAGE_SIZE, (barracksPage + 1) * BARRACKS_PAGE_SIZE).map(unit => {
    const portrait = scene?.getUnitArt(unit.type, unit.level);
    const available = canEditFormation() && !transforming && canMerge({ location: 'reserve', id: unit.id });
    const connectLabel = available ? `Connect ${types[unit.type].name}, level ${unit.level}, to a matching fighter in Army` : `Connect ${types[unit.type].name}: no eligible fighter in Army`;
    return `<div class="barracks-entry"><button class="barracks-unit" data-barracks-unit-id="${unit.id}" type="button" aria-label="${types[unit.type].name}, level ${unit.level}. View details." aria-controls="barracks-detail">${portrait ? `<img src="${portrait}" alt="" />` : ''}<span class="barracks-unit-level">Lv. ${unit.level}</span></button><button class="barracks-connect" data-barracks-connect-id="${unit.id}" type="button" aria-label="${connectLabel}" title="${connectLabel}"${available ? '' : ' disabled'}>Connect</button></div>`;
  }).join('');
  const selected = campaign.reserve.find(unit => unit.id === barracksSelectedId);
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
    const stats = getArmyUnitStats(selected.type, selected.level, campaign.forge, foodBonuses);
    const portrait = scene?.getUnitArt(selected.type, selected.level);
    const lastFighter = campaign.units.length + campaign.reserve.length <= 1;
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
  const result = commands.sellReserveFighters(campaign, ids);
  if (!result.ok) return;
  const { sold } = result;
  // Ownership and proceeds are saved together; received counts and deployed fighters never change.
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
    tell('Tap a green unit.');
    return;
  }
  const button = (event.target as Element).closest<HTMLElement>('[data-barracks-unit-id]');
  const fighter = button && campaign.reserve.find(unit => unit.id === Number(button.dataset.barracksUnitId));
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
  const fighter = button && !button.disabled && campaign.reserve.find(unit => unit.id === Number(button.dataset.barracksRecruitId));
  if (!fighter) return;
  pendingMerge = null;
  pendingRecruitId = fighter.id;
  selectedId = movingId = selectedLockedCell = selectedEmptyCell = null;
  closeOverlay(false); refresh();
  byId('army-map').focus({ preventScroll: true });
  tell(getUnitCellWidth(fighter.type) === 2 ? 'Pick 2 tiles side by side.' : 'Choose a tile.');
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
  const index = button ? campaign.reserve.findIndex(unit => unit.id === Number(button.dataset.reserveId)) : -1;
  if (index < 0) return;
  const selected = campaign.units.find(unit => unit.id === selectedId);
  const key = selected ? cellKey(selected.col, selected.row) : selectedEmptyCell;
  if (!key || !isUnlockedCell(key)) return;
  placeReserveFighter(campaign.reserve[index].id, key);
});

function placeReserveFighter(id: number, key: string) {
  if (!canEditFormation() || !isUnlockedCell(key)) return false;
  const result = commands.deployReserveFighter(campaign, id, key);
  if (!result.ok) {
    const fighter = campaign.reserve.find(unit => unit.id === id);
    tell(fighter && getUnitCellWidth(fighter.type) === 2
      ? 'Free the tile on the right.' : 'Tile occupied.');
    return false;
  }
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
  if (isDungeonBattleScreen()) {
    if (dungeonRun && !overlay && telegram.isActive && !isRecovering()) {
      selectDungeonCell(dungeonRun, col, row); refresh();
    }
    return;
  }
  if (!canEditFormation() || overlay || col < 0 || col > 4 || row < 0 || row > 2) return;
  const key = cellKey(col, row);
  if (pendingMerge) {
    mergeInto(getUnitAtCell(campaign.units, col, row)?.id);
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
  const occupied = getUnitAtCell(campaign.units, col, row);
  if (movingId) {
    const result = commands.moveFormationFighter(campaign, movingId, col, row);
    if (!result.ok) {
      tell('Both units need free tiles.');
      return;
    }
    // Swap complete footprints atomically; a running battle keeps its old actors.
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
    mercenariesUI?.showUpgrade();
    return;
  }
  if (action === 'unlock-cell') {
    const result = commands.purchaseCampaignCell(campaign, selectedLockedCell!);
    if (result.ok) {
      selectedEmptyCell = selectedLockedCell;
      selectedLockedCell = null;
      if (pendingRecruitId && placeReserveFighter(pendingRecruitId, selectedEmptyCell!)) return;
      saveFormation(); refresh(); tell('Tile unlocked.');
    }
    return;
  }
  const selected = campaign.units.find(unit => unit.id === selectedId);
  if (!selected) return;
  if (action === 'move') {
    movingId = selected.id;
    closeOverlay(); refresh(); resumeFrames(); return;
  }
  if (action === 'remove') {
    if (!commands.withdrawFormationFighter(campaign, selected.id, { minArmyUnits: battle ? 1 : 0 }).ok) return;
    // Removing never converts free fighters or earned levels into gold.
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
  if (overlay || !(canEditFormation() || isDungeonBattleScreen() && telegram.isActive && !isRecovering())) return;
  if (isDungeonBattleScreen() && event.key === 'Escape' && dungeonRun) {
    event.preventDefault(); dungeonRun.selectedId = null; refresh(); return;
  }
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
  if (campaignError || !saveSession.canWrite || sessionPageHidden || ['conflict', 'unsupported', 'session-blocked'].includes(saveStorage.status)) return;
  if (['corrupt', 'read-error'].includes(saveStorage.status)) {
    if (!resetSaveToken) return;
  } else if (!saveStorage.checkForUpdates().ok) { syncRecoveryUi(); return; }
  connectSelection = null;
  campaign = resetCampaignState(campaign, Date.now());
  reservePage = 0;
  byId('forge-feedback').textContent = 'Changes apply next wave.';
  byId('farm-feedback').textContent = 'No planting needed. Collect whenever you like.';
  byId('capitol-feedback').textContent = 'Changes apply next battle.';
  barracksPage = 0; barracksSelectedId = null;
  pendingRecruitId = null;
  pendingMerge = null;
  clearTimeout(transformTimer); finishRecruitReveal();
  clearTimeout(marketArrivalTimer);
  marketArrivalTotal = pendingMarketArrival = 0;
  byId('market-arrival').hidden = true;
  byId('transform-slave').classList.remove('is-arriving');
  economyLastTick = performance.now(); economyUnsaved = 0;
  selectedLockedCell = selectedEmptyCell = null;
  battleSpeed = DEFAULT_BATTLE_SPEED;
  selectedId = movingId = lastOutcome = null;
  for (const [child, inert] of recoveryInert) child.inert = inert;
  recoveryInert.clear();
  closeOverlay();
  const result = saveStorage.reset(saveSnapshot(), { confirmation: resetSaveToken });
  resetSaveToken = null;
  // Re-entering the recovery panel must capture the new, closed-menu inert state.
  recoveryBlocked = false;
  loadingIndicator.update(false);
  byId('recovery-panel').hidden = true;
  syncRecoveryUi();
  refresh();
  if (result.ok) tell('Supplies ready.');
}

byId('recovery-retry').addEventListener('click', async () => {
  const button = byId('recovery-retry');
  button.disabled = true;
  try {
    if (!saveSession.canWrite) {
      if (await saveSession.acquire()) { window.location.reload(); return; }
      syncRecoveryUi();
      return;
    }
    if (campaignError || saveStorage.status === 'unsupported' || saveStorage.status === 'conflict') {
      window.location.reload();
      return;
    }
    if (saveStorage.status !== 'ready') {
      const result = saveStorage.retry(saveSnapshot());
      if (result.ok && 'needsRestore' in result && result.needsRestore) { window.location.reload(); return; }
      economyLastTick = performance.now();
      // A failed save may span a visibility pause. Once it is durable again,
      // restore both clocks instead of hiding recovery over a frozen battle.
      if (result.ok && telegram.isActive) activateGame();
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
  if (screens.active === 'dungeons') return;
  if (combatProfiler) combatProfiler.measure('render', drawScenes);
  else drawScenes();
}

function drawScenes() {
  if (isDungeonBattleScreen() && dungeonRun) {
    const run = dungeonRun;
    const selected = run.units.find(unit => unit.id === run.selectedId);
    const common = { mapVariant: 'goblin-cave' as const, units: run.units, wave: run.wave, levelNumber: 1,
      time: visualTime, heroState: campaign.hero, capitolState: undefined, unlockedCells: run.unlockedCells,
      selectedId: null, movingId: null, placementType: null, selectedEmptyCell: null, selectedLockedCell: null,
      nextUnlockCost: null, barracksLevel: undefined, replacingFromReserve: false,
      mergeTargets: [], mergeLevel: 0, draggedId: null, dragTargetId: null };
    scene?.render({ ...common, battle: run.battle });
    // The dock retains formation positions but reports actual health/casualties.
    const units = run.battle ? run.units.map(unit => {
      const actor = run.battle!.allies.find(ally => ally.id === `ally-${unit.id}`);
      return { ...unit, hp: actor?.hp ?? 0, maxHp: actor?.maxHp };
    }) : run.units;
    armyScene?.render({ ...common, units, battle: null, selectedId: run.selectedId, movingId: run.selectedId,
      placementType: selected?.type ?? null, placementLevel: selected?.level ?? 1 });
    return;
  }
  // Both canvases show the same level, including preparation, defeat and campaign replay.
  const wave = getWaveDefinition(battle?.waveNumber ?? nextWaveNumber());
  const levelNumber = wave.levelNumber;
  // Preparation owns the upcoming enemies' resources too, so Start uses the
  // same ready plan instead of beginning an image load inside the click handler.
  scene?.render({ mapVariant: 'campaign', units: campaign.units, wave, selectedId: null, movingId: null, placementType: null, battle, time: visualTime, levelNumber,
    unlockedCells: campaign.progression.unlockedCells, heroState: campaign.hero, capitolState: campaign.capitol });
  const selected = campaign.units.find(unit => unit.id === selectedId);
  const recruit = campaign.reserve.find(unit => unit.id === pendingRecruitId);
  armyScene?.render({ mapVariant: 'campaign', wave: null, units: campaign.units, selectedId, movingId, levelNumber,
    mergeTargets: mergeTargetIds, mergeLevel,
    draggedId: draggedMerge?.source.location === 'army' ? draggedMerge.source.id : null,
    dragTargetId: draggedMerge?.targetId ?? null,
    placementType: recruit?.type ?? (movingId ? selected?.type : null), replacingFromReserve: !!recruit,
    placementLevel: recruit?.level ?? selected?.level ?? 1, battle: null, time: visualTime,
    unlockedCells: campaign.progression.unlockedCells, barracksLevel: campaign.barracks.level,
    nextUnlockCost: nextCellCost(campaign.progression, campaign.barracks.level), selectedLockedCell, selectedEmptyCell });
}

function refreshBattleHud() {
  if (combatProfiler) combatProfiler.measure('ui', refreshBattleHudContent);
  else refreshBattleHudContent();
}

function refreshBattleHudContent() {
  if (!battle || !isCampaignScreen()) return;
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
  const won = battle.phase === 'victory';
  const result = applyCampaignBattleResult(campaign, battle.campaignRewards,
    { waveNumber: battle.waveNumber, kills: battle.kills, total: battle.total, won });
  if (!result.ok) { stopForCampaignError(result.reason); return; }
  battle.resultRecorded = true;
  battleAudio.setActive(false);
  lastOutcome = battle.phase;
  paused = false;
  resultAge = 0;
  // Record hero XP with the battle outcome once; talent changes apply to a fresh battle snapshot.
  battle.heroXp = result.heroXp;
  battle.firstClearBonus = result.firstClearBonus;
  battle.reward += result.firstClearBonus;
  addHeroXpEffect(battle, result.heroXp.gained);
  // Commit either outcome once, including the retreat, before showing the result screen.
  save();
  presentResult();
}

function presentResult() {
  if (!battle || battle.phase === 'running') return;
  autoNextRemaining = campaign.autoWaves ? AUTO_WAVE_DELAY : null;
  byId('result-panel').hidden = campaign.autoWaves;
  refresh();
  if (campaign.autoWaves) {
    if (isCampaignScreen() && !overlay && !movingId && !pendingRecruitId && !pendingMerge) byId('army-map').focus({ preventScroll: true });
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
  if (isCampaignScreen() && !overlay && !movingId && !pendingRecruitId && !pendingMerge) byId('return-prep').focus({ preventScroll: true });
}

function startWave() {
  if (isDungeonBattleScreen() || battle || !scene || !campaign.units.length || !telegram.isActive || isRecovering()) return;
  // Keep the cell picker or move action open across automatic wave transitions.
  if (runComplete()) { commands.resetCampaignCycle(campaign); lastOutcome = null; if (!save()) return; }
  const waveNumber = nextWaveNumber();
  battle = Object.assign(createBattle(campaign.units, waveNumber, campaign.hero, campaign.forge, campaign.capitol),
    { campaignRewards: createBattleRewardReceipt(waveNumber) });
  if (!campaign.onboardingCompleted) { commands.completeOnboarding(campaign); save(); }
  paused = false; resultAge = 0; autoNextRemaining = null;
  battleAudio.setActive(isCampaignScreen());
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
  if (isCampaignScreen() && !overlay && !movingId && !pendingRecruitId && !pendingMerge) byId('start-wave').focus({ preventScroll: true });
}

byId('return-prep').addEventListener('click', () => {
  if (!battle || battle.phase === 'running') return;
  returnToFormation();
});

byId('auto-waves').addEventListener('click', () => {
  if (isRecovering()) return;
  commands.setCampaignAutoWaves(campaign, !campaign.autoWaves);
  save();
  if (battle && battle.phase !== 'running') presentResult(); else refresh();
});

// Telegram can minimize a Mini App without hiding the document; both lifecycle signals stop play.
function resetFrameRate() { frameRateMeter.reset(); fpsLabel.textContent = '— FPS'; }
function stopFrames() {
  cancelAnimationFrame(frameId); frameId = 0; framePacer.reset(); resetFrameRate();
  combatProfiler?.suspend();
}
function resumeFrames() {
  if (!destroyed && !frameId && scene && telegram.isActive && !paused && !isRecovering()) frameId = requestAnimationFrame(frame);
}
function frame(timestamp: number) {
  frameId = 0;
  if (destroyed || !telegram.isActive || paused || isRecovering()) {
    framePacer.reset(); resetFrameRate(); combatProfiler?.suspend(); return;
  }
  const realDelta = framePacer.sample(timestamp);
  if (realDelta === null) { resumeFrames(); return; }
  combatProfiler?.beginFrame(timestamp);
  try {
    if (syncFood()) refresh();
    const dt = Math.min(realDelta, MAX_REAL_FRAME_DELTA);
    if (isDungeonBattleScreen()) {
      // A single RAF dispatches one simulation. The campaign battle/countdown is
      // retained unchanged until exit; dungeon kills never enter campaign rewards.
      const active = dungeonRun?.battle;
      const delta = active?.phase === 'running' ? battleFrameDelta(dt, battleSpeed) : dt;
      visualTime += delta;
      if (active) {
        const wasRunning = active.phase === 'running';
        const events = updateBattle(active, delta);
        for (const event of events) if (event.type === 'bow-shot') battleAudio.playBowShot();
        if (wasRunning && active.phase !== 'running') { battleAudio.setActive(false); refresh(); }
      }
      hudElapsed += dt;
      if (hudElapsed >= .15) { refreshDungeonRun(); hudElapsed = 0; }
      renderScene();
      const fps = frameRateMeter.record(timestamp);
      if (fps !== null) fpsLabel.textContent = `${fps} FPS`;
      resumeFrames();
      return;
    }
    const battleDt = battle?.phase === 'running' ? battleFrameDelta(dt, battleSpeed) : dt;
    visualTime += battleDt;
    if (battle) {
      const wasRunning = battle.phase === 'running';
      // Movement, casts, projectiles, spawns and enrage share the same scaled clock.
      const activeBattle = battle;
      const events = combatProfiler
        ? combatProfiler.measure('simulation', () => updateBattle(activeBattle, battleDt))
        : updateBattle(activeBattle, battleDt);
      if (isCampaignScreen()) for (const event of events) if (event.type === 'bow-shot') battleAudio.playBowShot();
      if (!battle.campaignRewards.result) {
        const reward = applyBattleKillRewards(campaign, battle.campaignRewards,
          { kills: battle.kills, totalGold: battle.reward }, Math.random);
        if (!reward.ok) { stopForCampaignError(reward.reason); return; }
        if (reward.gold || reward.slaves) {
          save(); refresh();
          if (reward.slaves) showMarketArrival(reward.slaves);
        }
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
    const fps = isCampaignScreen() ? frameRateMeter.record(timestamp) : null;
    if (fps !== null) fpsLabel.textContent = `${fps} FPS`;
    if (!battle || battle.phase === 'running' || autoNextRemaining !== null || resultAge < 1.3 || armyScene) resumeFrames();
  } finally {
    if (combatProfiler) {
      combatProfiler.endFrame(collectProfilerCounters(visibleBattle(), battleSpeed, campaign.units.length));
      profilerPanel?.update(timestamp);
    }
  }
}

function pauseForInactivity() {
  unitDrag?.cancel();
  if (isDungeonBattleScreen()) dungeonRunUI.dismissConfirmation();
  tickEconomy(); economyActive = false;
  if (saveSession.canWrite && !sessionPageHidden) save();
  refreshOnboarding();
  levelMusic.setActive(false);
  battleAudio.setActive(false);
  stopFrames();
  if (hasActiveBattle()) { paused = true; refresh(); }
}

function activateGame() {
  if (sessionPageHidden || destroyed) return;
  if (campaignError || !saveStorage.checkForUpdates().ok || saveStorage.status !== 'ready') { syncRecoveryUi(); return; }
  if (!economyActive) collectOfflineIncome();
  economyLastTick = performance.now(); economyActive = true;
  paused = false;
  battleAudio.setActive(screens.active !== 'dungeons' && visibleBattle()?.phase === 'running' && !isRecovering());
  if (visibleBattle()?.phase === 'running') void battleAudio.unlock();
  refresh();
  showOfflineIncome();
  showMarketArrival();
  resumeFrames();
}

function onPageHide(event: PageTransitionEvent) {
  loadingIndicator.update(false);
  unitDrag?.cancel();
  levelMusic.setActive(false);
  battleAudio.setActive(false);
  telegram.suspend();
  stopFrames();
  // Suspend flushes the owner first. Ordinary visibility pauses keep ownership;
  // actual navigation releases it, including pages entering the back/forward cache.
  sessionPageHidden = true;
  saveSession.release();
  if (!event.persisted) {
    destroyed = true;
    loadingIndicator.destroy();
    profilerPanel?.destroy();
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
    window.removeEventListener('storage', onSavedProgressChanged);
    document.removeEventListener('pointerup', unlockLevelMusic, true);
    document.removeEventListener('keydown', unlockLevelMusic, true);
    scene?.destroy();
    heroUI?.destroy();
    mercenariesUI?.destroy();
    dungeonsUI?.destroy();
    dungeonRunUI.destroy();
    armyScene?.destroy();
    unitDrag?.destroy();
    onboardingGuide.destroy();
  }
}

async function onPageShow(event: PageTransitionEvent) {
  if (!event.persisted || destroyed) return;
  sessionPageHidden = false;
  const owned = await saveSession.acquire();
  if (destroyed || sessionPageHidden) return;
  // Never collect offline income or resume a cached battle against a save that
  // another page changed while this page did not own the session.
  if (!owned || !saveStorage.checkForUpdates().ok) { syncRecoveryUi(); return; }
  telegram.resume(); fitPortraitPreview(); refresh(); resumeFrames();
}
function onSavedProgressChanged(event: StorageEvent) {
  if (destroyed || sessionPageHidden || !saveSession.canWrite || event.key !== null && event.key !== SAVE_KEY) return;
  if (!saveStorage.checkForUpdates().ok) { stopFrames(); scheduleRecoveryUi(); }
}
window.removeEventListener('pagehide', onStartupPageHide);
window.addEventListener('pagehide', onPageHide);
window.addEventListener('pageshow', onPageShow);
window.addEventListener('storage', onSavedProgressChanged);

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
