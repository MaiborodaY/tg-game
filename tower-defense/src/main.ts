import "./styles.css";
import eiraPortraitUrl from "./assets/heroes/eira-portrait.webp";
import grakPortraitUrl from "./assets/heroes/grak-portrait.webp";
import torenPortraitUrl from "./assets/heroes/toren-portrait.webp";
import {
  ENEMY_DEFINITIONS,
  MAX_TOWER_LEVEL,
  TOWER_DEFINITIONS,
  getTowerStats,
} from "./game/config.ts";
import {
  CAMPAIGN_MODE_ID,
  CLASSIC_CAMPAIGN_LEVEL_ID,
  CONTENT_CATALOG,
  ENDLESS_MODE_ID,
  LEGACY_NORTHERN_PASS_LEVEL_ID,
  MAX_ENDLESS_WAVE,
  NORTHERN_PASS_LEVEL_ID,
} from "./game/content.ts";
import {
  clearCampaign,
  getCampaignSaveKey,
  LEGACY_SAVE_KEY,
  loadCampaign,
  migrateLegacyCampaign,
  saveCampaign,
  type StorageLike,
} from "./game/save.ts";
import {
  readSessionSelection,
  resolveSessionSelection,
  resolveServerSessionSelection,
  writeSessionSelection,
} from "./game/sessionSelection.ts";
import type { PlayerProfileSnapshot } from "./game/profile.ts";
import { isHeroUnlocked } from "./game/heroAvailability.ts";
import {
  HERO_COMBAT_PREVIEW_QUERY_PARAM,
  buildHeroCombatPreviewSaveKey,
  isHeroCombatPreviewRequest,
  isHeroCombatPreviewSession,
  shouldEnableHeroCombatPreview,
} from "./game/heroCombatPreview.ts";
import { isSessionAvailable } from "./game/progression.ts";
import {
  isClientLevelReleased,
  normalizeClientLevelId,
  shouldExposePreviewContent,
} from "./game/releasePolicy.ts";
import { createLazyRuntimeController } from "./game/lazyRuntime.ts";
import {
  aggregateWaveEnemies,
  deriveNorthernAvalanchePreview,
  deriveResultAdvice,
  recommendWaveTowers,
  type WaveEnemyAggregate,
} from "./game/gameplayIntel.ts";
import { getHeroAura, getHeroStats, getHeroUpgradeCost, getHeroUpgradeWaveGate, isHeroId } from "./game/heroes.ts";
import { createCampaignState } from "./game/state.ts";
import { getSelectedTowerDetails } from "./game/towerDetails.ts";
import {
  createTutorialState,
  isTutorialDone,
  reduceTutorial,
  TUTORIAL_COMPLETION_STORAGE_KEY,
  type TutorialState,
} from "./game/tutorial.ts";
import type {
  EnemyType,
  HeroId,
  NorthernAvalancheZoneId,
  TowerLevel,
  TowerType,
  WavePlan,
} from "./game/types.ts";
import {
  detectLocale,
  normalizeLocale,
  readStoredLocale,
  tr,
  writeStoredLocale,
  type Locale,
  type TranslationKey,
} from "./i18n.ts";
import {
  createLeaderboardClient,
  type LeaderboardClient,
  type LeaderboardEntry,
  type TowerDefenseLeaderboard,
} from "./leaderboard.ts";
import {
  loadPendingResult,
  removePendingResult,
  savePendingResult,
  type PendingRunSummary,
} from "./pendingResult.ts";
import {
  captureFinalResult,
  captureFinishSubmission,
  clearAttemptPurchaseRequestId,
  clearMiniAppReward,
  createRewardFinisher,
  decideAttemptPurchaseRequestIdLifecycle,
  decideRewardLaunch,
  executeDailyAttemptLimitPrimaryAction,
  fetchMiniAppProfile,
  getOrCreateAttemptPurchaseRequestId,
  loadMiniAppBootstrap,
  parseLaunchParams,
  normalizeFinishOutcome,
  purchaseMiniAppDailyAttempts,
  recordMiniAppCheckpoint,
  replaceMiniAppBootstrap,
  resetMiniAppDailyAttempts,
  restartMiniAppRun,
  saveMiniAppBootstrap,
  startMiniAppReward,
  type FinalResult,
  type AttemptPurchaseOffer,
  type MiniAppBootstrap,
  type MiniAppProfileBootstrap,
  type RewardFinisher,
  type RewardLaunch,
} from "./reward.ts";
import type {
  NoticeCode,
  TerminalOutcome,
  TowerDefenseCallbacks,
  TowerDefenseScene,
  TowerDefenseUiState,
} from "./rendering/TowerDefenseScene.ts";
import { setupTelegramBridge } from "./telegram.ts";
import { TOWER_GUIDE_ENTRIES } from "./towerGuide.ts";

type AttemptPurchaseUiState = "offer" | "confirm" | "loading" | "success" | "insufficient" | "retry";
type RunTerminalOutcome = TerminalOutcome | "retired";

void bootstrap();

async function bootstrap(): Promise<void> {
const legacyLaunch = parseLaunchParams(window.location.href);
const storage = safeStorage("localStorage");
const session = safeStorage("sessionStorage");
const developmentGrakPreview = import.meta.env.DEV
  && new URL(window.location.href).searchParams.get("preview_hero") === "grak";
const developmentLeaderboardPreview = import.meta.env.DEV
  && new URL(window.location.href).searchParams.get("preview_leaderboard") === "1";
const developmentAttemptPurchasePreview = import.meta.env.DEV
  ? new URL(window.location.href).searchParams.get("preview_attempt_purchase")
  : null;
const developmentResultPreview = import.meta.env.DEV
  ? new URL(window.location.href).searchParams.get("preview_result")
  : null;
const developmentHeroCombatPreviewQuery = import.meta.env.DEV
  ? new URL(window.location.href).searchParams.get(HERO_COMBAT_PREVIEW_QUERY_PARAM)
  : null;
const telegram = setupTelegramBridge();
let locale = readStoredLocale(storage) ?? detectLocale(legacyLaunch.payload?.lang, legacyLaunch.payload?.language);
const pendingStartButton = document.getElementById("intro-start");
if (pendingStartButton instanceof HTMLButtonElement) pendingStartButton.disabled = true;

const launchDecision = decideRewardLaunch(legacyLaunch, telegram.initData);
const isMiniAppLaunch = launchDecision.kind === "miniapp";
let previewContentEnabled = shouldExposePreviewContent(import.meta.env.DEV, launchDecision.kind);
const leaderboardClient = launchDecision.kind === "miniapp"
  ? safelyCreateLeaderboardClient(launchDecision.initData)
  : null;
let launch = legacyLaunch;
let miniAppBootstrap: MiniAppBootstrap | null = null;
let miniAppProfileBootstrap: MiniAppProfileBootstrap | null = null;
let launchError: "invalid_launch" | "miniapp_start_failed" | "daily_attempt_limit" | null = legacyLaunch.rewardError;
let canResetDailyAttempts = false;
let resettingDailyAttempts = false;
let attemptPurchaseOffer: AttemptPurchaseOffer | null = null;
let attemptPurchaseState: AttemptPurchaseUiState = "offer";
let attemptPurchaseError: string | null = null;
let attemptPurchaseBalanceCrystals = 0;
if (launchDecision.kind === "miniapp") {
  let cachedBootstrap = loadMiniAppBootstrap(session);
  if (cachedBootstrap && readFlag(storage, "td-reward-used-v1:" + cachedBootstrap.reward.runId)) {
    clearMiniAppReward(session);
    cachedBootstrap = null;
  }
  if (cachedBootstrap?.canAccessNorthernPass) previewContentEnabled = true;
  if (cachedBootstrap && !isClientLevelReleased(cachedBootstrap.binding.levelId, previewContentEnabled)) {
    // A previously released preview must not trap the player on a permanent
    // launch error after the binding is withdrawn from production.
    clearMiniAppReward(session);
    cachedBootstrap = null;
  }
  if (cachedBootstrap) {
    clearAttemptPurchaseRequestId(session);
    miniAppBootstrap = cachedBootstrap;
    launch = Object.freeze({ ...legacyLaunch, reward: cachedBootstrap.reward, rewardError: null });
    launchError = null;
  } else {
    const profiled = await fetchMiniAppProfile(launchDecision.initData);
    if (profiled.ok) {
      miniAppProfileBootstrap = profiled.bootstrap;
      if (profiled.bootstrap.canAccessNorthernPass) previewContentEnabled = true;
      const activeRun = profiled.bootstrap.activeRun;
      if (activeRun && !isClientLevelReleased(activeRun.binding.levelId, previewContentEnabled)) {
        launchError = "miniapp_start_failed";
      } else if (activeRun) {
        const started = await startMiniAppReward(launchDecision.initData, {
          resumeRunId: activeRun.runId,
          selection: {
            levelId: activeRun.binding.levelId,
            modeId: activeRun.binding.modeId,
            heroId: activeRun.heroId,
          },
        });
        if (started.ok && started.bootstrap.canAccessNorthernPass) previewContentEnabled = true;
        if (started.ok && isClientLevelReleased(started.bootstrap.binding.levelId, previewContentEnabled)) {
          clearAttemptPurchaseRequestId(session);
          miniAppBootstrap = started.bootstrap;
          saveMiniAppBootstrap(session, started.bootstrap);
          launch = Object.freeze({ ...legacyLaunch, reward: started.reward, rewardError: null });
          launchError = null;
        } else {
          launchError = "miniapp_start_failed";
        }
      } else {
        launchError = null;
      }
    } else {
      launchError = "miniapp_start_failed";
    }
  }
} else if (launchDecision.kind === "error") {
  launchError = launchDecision.error;
}
if (developmentAttemptPurchasePreview) {
  const insufficient = developmentAttemptPurchasePreview === "insufficient";
  launchError = "daily_attempt_limit";
  canResetDailyAttempts = false;
  attemptPurchaseOffer = Object.freeze({ attempts: 5, priceCrystals: 5, balanceCrystals: insufficient ? 3 : 27 });
  attemptPurchaseBalanceCrystals = attemptPurchaseOffer.balanceCrystals;
  attemptPurchaseState = developmentAttemptPurchasePreview === "confirm"
    ? "confirm"
    : developmentAttemptPurchasePreview === "success"
      ? "success"
      : insufficient
        ? "insufficient"
        : "offer";
}

let rewardUsedKey = launch.reward.runId ? "td-reward-used-v1:" + launch.reward.runId : null;
const rewardAlreadyUsed = rewardUsedKey ? readFlag(storage, rewardUsedKey) : false;
if (isMiniAppLaunch && rewardAlreadyUsed) clearMiniAppReward(session);
let reward: RewardLaunch = rewardAlreadyUsed
  ? Object.freeze({ mode: "local", runId: null, token: null, runNumber: null, finishUrl: null })
  : launch.reward;
const heroCombatPreviewRequest = isHeroCombatPreviewRequest({
  isDevelopment: import.meta.env.DEV,
  launchKind: launchDecision.kind,
  rewardMode: reward.mode,
  queryValue: developmentHeroCombatPreviewQuery,
});
let selectedSession = miniAppBootstrap && reward.mode === "server"
  ? resolveServerSessionSelection(miniAppBootstrap.binding)
  : reward.mode === "server"
    // Legacy signed URL launches predate server content bindings and stay on the classic campaign.
    ? resolveSessionSelection("server", null)
    : readSessionSelection(storage, "local");
if (heroCombatPreviewRequest) {
  // The explicit local prototype URL must not resume an unrelated practice session.
  selectedSession = resolveSessionSelection("local", {
    levelId: CLASSIC_CAMPAIGN_LEVEL_ID,
    modeId: CAMPAIGN_MODE_ID,
  });
}
const awaitingMiniAppStart = isMiniAppLaunch && !miniAppBootstrap;
const launchProfile = miniAppBootstrap?.profile ?? miniAppProfileBootstrap?.profile ?? null;
const normalizedClientLevelId = normalizeClientLevelId(selectedSession.level.id, previewContentEnabled);
const clientSelectionWasUnreleased = !selectedSession.locked
  && normalizedClientLevelId !== selectedSession.level.id;
if (clientSelectionWasUnreleased || (
  awaitingMiniAppStart
  && !isSessionAvailable(selectedSession.level.id, selectedSession.mode.id, launchProfile)
)) {
  selectedSession = resolveSessionSelection("local", {
    levelId: normalizedClientLevelId,
    modeId: CAMPAIGN_MODE_ID,
  });
  if (clientSelectionWasUnreleased) writeSessionSelection(storage, selectedSession.selection);
}
let saveKey = buildHeroCombatPreviewSaveKey(getCampaignSaveKey(
  reward.mode === "server" ? reward.runId : null,
  selectedSession.level.id,
  selectedSession.mode.id,
  currentRunRevision(),
), isHeroCombatPreviewSessionEnabled());
const loadedCampaign = awaitingMiniAppStart ? null : loadCampaign(storage, saveKey, selectedSession.selection);
const savedCampaign = isHeroCombatPreviewSessionEnabled() && loadedCampaign?.hero.id !== "toren"
  ? null
  : loadedCampaign;
const canMigrateLegacy = selectedSession.level.id === CLASSIC_CAMPAIGN_LEVEL_ID
  && selectedSession.mode.id === CAMPAIGN_MODE_ID
  && !isHeroCombatPreviewSessionEnabled();
const migrated = !awaitingMiniAppStart && !savedCampaign && canMigrateLegacy
  ? migrateLegacyCampaign(storage, reward.mode === "server" ? reward.runId : null)
  : null;
// A profile controls new hero selection, but an already-started run must remain
// resumable if the bootstrap profile is temporarily unavailable during reload.
const restoredCheckpoint = savedCampaign || migrated;
let pendingWaveLimit = selectedSession.mode.getFinalWave(selectedSession.level) ?? MAX_ENDLESS_WAVE;
let pendingScoreLimit = selectedSession.mode.calculateScore(pendingWaveLimit);
const pendingAtLaunch = reward.mode === "server" && reward.runId
  ? loadPendingResult(storage, reward.runId, pendingScoreLimit, pendingWaveLimit, currentRunRevision())
  : null;
let initialCampaign = pendingAtLaunch
  ? createCampaignState({ level: selectedSession.level, mode: selectedSession.mode, heroId: miniAppBootstrap?.heroId ?? "eira" })
  : restoredCheckpoint || createCampaignState({
      level: selectedSession.level,
      mode: selectedSession.mode,
      heroId: isHeroCombatPreviewSessionEnabled()
        ? "toren"
        : miniAppBootstrap?.heroId ?? miniAppProfileBootstrap?.activeRun?.heroId ?? "eira",
    });

function isHeroCombatPreviewSessionEnabled(
  levelId = selectedSession.level.id,
  modeId = selectedSession.mode.id,
): boolean {
  return isHeroCombatPreviewSession({
    isDevelopment: import.meta.env.DEV,
    launchKind: launchDecision.kind,
    rewardMode: reward.mode,
    queryValue: developmentHeroCombatPreviewQuery,
    levelId,
    modeId,
  });
}

function isHeroCombatPreviewEnabled(heroId: HeroId): boolean {
  return shouldEnableHeroCombatPreview({
    isDevelopment: import.meta.env.DEV,
    launchKind: launchDecision.kind,
    rewardMode: reward.mode,
    queryValue: developmentHeroCombatPreviewQuery,
    levelId: selectedSession.level.id,
    modeId: selectedSession.mode.id,
    heroId,
  });
}

let latestUi: TowerDefenseUiState | null = null;
let rewardFinisher: RewardFinisher | null = null;
let finishSettled = reward.mode === "local";
let terminalResult: FinalResult | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let renderedPreviewWave = -1;
let resumeAfterGuide = false;
let guideReturnFocus: HTMLElement | null = null;
let resumeAfterWaveIntel = false;
let waveIntelReturnFocus: HTMLElement | null = null;
let selectedWaveIntelType: EnemyType | null = null;
let renderedWaveIntelPlan: WavePlan | null = null;
let resumeAfterMenu = false;
let menuReturnFocus: HTMLElement | null = null;
let leaderboardOrigin: "intro" | "menu" | "result" | null = null;
let leaderboardReturnFocus: HTMLElement | null = null;
let leaderboardLevelId = CLASSIC_CAMPAIGN_LEVEL_ID;
let leaderboardModeId: typeof CAMPAIGN_MODE_ID | typeof ENDLESS_MODE_ID = CAMPAIGN_MODE_ID;
let leaderboardRequestId = 0;
let renderedLeaderboard: TowerDefenseLeaderboard | null = null;
let introReturnsToRun = false;
let sessionSwitching = false;
let localSaveWarningShown = false;
let finishAuthRefreshAttempted = false;
let finishRunReplaced = false;
let replacementBootstrapCached = false;
let terminalSubmissionStarted = false;
let exitAfterTerminalSettlement = false;
let restartSelectionPending = false;
let restartSubmitting = false;
let resumeAfterRestartPicker = false;
let menuConfirmation: "restart" | "retire" | null = null;
let serverCheckpointTail: Promise<boolean> = Promise.resolve(true);
let confirmedServerWave = miniAppBootstrap?.confirmedWave ?? 0;
const restoredServerWave = pendingAtLaunch?.waves ?? restoredCheckpoint?.completedWave ?? 0;
let checkpointTargetWave = Math.max(confirmedServerWave, restoredServerWave);
let checkpointFailureShown = false;
let checkpointResumeMismatch = Boolean(
  miniAppBootstrap?.runContractVersion === 3 && confirmedServerWave > restoredServerWave,
);
if (checkpointResumeMismatch) restartSelectionPending = true;
let gameStarting = false;
let gameMounted = false;
let runtimeLoadFailed = false;
let reloadRequested = false;
let playerProfile: PlayerProfileSnapshot | null = launchProfile;
let selectedHeroId: HeroId = initialCampaign.hero.id;
let runStarted = Boolean(restoredCheckpoint);
let tutorialState: TutorialState = createTutorialState({
  campaign: initialCampaign,
  phase: "setup",
  profile: playerProfile,
  tutorialCompleted: readFlag(storage, TUTORIAL_COMPLETION_STORAGE_KEY),
});
const NORTHERN_ONBOARDING_STORAGE_KEY = "td-northern-avalanche-onboarding-v3";
const NORTHERN_ARMOR_ONBOARDING_STORAGE_KEY = "td-northern-armor-onboarding-v3";
type NorthernOnboardingStep = "avalanche" | "armor";
let northernOnboardingStep = getNorthernOnboardingStep(initialCampaign);

const HERO_PORTRAIT_URLS: Readonly<Record<HeroId, string>> = Object.freeze({
  eira: eiraPortraitUrl,
  toren: torenPortraitUrl,
  grak: grakPortraitUrl,
});

const elements = {
  appShell: byId("app"),
  appTitle: byId("app-title"),
  appSubtitle: byId("app-subtitle"),
  hudRegion: byId("hud-region"),
  livesLabel: byId("lives-label"),
  livesValue: byId("lives-value"),
  gateShield: byId("gate-shield"),
  goldLabel: byId("gold-label"),
  goldValue: byId("gold-value"),
  waveLabel: byId("wave-label"),
  waveValue: byId("wave-value"),
  waveProgress: byId("wave-progress"),
  gameMenuButton: button("game-menu-button"),
  speedButton: button("speed-button"),
  pulseButton: button("pulse-button"),
  pulseLabel: byId("pulse-label"),
  pulseCharges: byId("pulse-charges"),
  phaseBadge: byId("phase-badge"),
  bossHud: byId("boss-hud"),
  bossIcon: byId("boss-icon"),
  bossName: byId("boss-name"),
  bossState: byId("boss-state"),
  bossHealthFill: byId("boss-health-fill"),
  bossShieldFill: byId("boss-shield-fill"),
  countdown: byId("countdown"),
  heroTargetPrompt: byId("hero-target-prompt"),
  heroTargetPromptLabel: byId("hero-target-prompt-label"),
  heroTargetCancel: button("hero-target-cancel"),
  tutorialCoach: byId("tutorial-coach"),
  tutorialStep: byId("tutorial-step"),
  tutorialTitle: byId("tutorial-title"),
  tutorialBody: byId("tutorial-body"),
  tutorialSkip: button("tutorial-skip"),
  battleShell: document.querySelector<HTMLElement>(".battle-shell")!,
  towerDeck: document.querySelector<HTMLElement>(".tower-deck")!,
  commandPanel: document.querySelector<HTMLElement>(".command-panel")!,
  buildPanel: byId("build-panel"),
  towerPanel: byId("tower-panel"),
  heroPanel: byId("hero-panel"),
  buildEyebrow: byId("build-eyebrow"),
  buildHint: byId("build-hint"),
  practiceBadge: byId("practice-badge"),
  fullscreenButton: button("fullscreen-button"),
  towerGuideButton: button("tower-guide-button"),
  towerGuideOverlay: byId("tower-guide-overlay"),
  towerGuideClose: button("tower-guide-close"),
  towerGuideEyebrow: byId("tower-guide-eyebrow"),
  towerGuideTitle: byId("tower-guide-title"),
  towerGuideIntro: byId("tower-guide-intro"),
  towerGuideGrid: byId("tower-guide-grid"),
  towerGuideCombo: byId("tower-guide-combo"),
  towerGuideDone: button("tower-guide-done"),
  waveIntelOverlay: byId("wave-intel-overlay"),
  waveIntelClose: button("wave-intel-close"),
  waveIntelEyebrow: byId("wave-intel-eyebrow"),
  waveIntelTitle: byId("wave-intel-title"),
  waveIntelIntro: byId("wave-intel-intro"),
  waveIntelTabs: byId("wave-intel-tabs"),
  waveIntelDetail: byId("wave-intel-detail"),
  waveIntelGlyph: byId("wave-intel-glyph"),
  waveIntelCount: byId("wave-intel-count"),
  waveIntelEnemyName: byId("wave-intel-enemy-name"),
  waveIntelDescription: byId("wave-intel-description"),
  waveIntelHpLabel: byId("wave-intel-hp-label"),
  waveIntelHp: byId("wave-intel-hp"),
  waveIntelSpeedLabel: byId("wave-intel-speed-label"),
  waveIntelSpeed: byId("wave-intel-speed"),
  waveIntelLeakLabel: byId("wave-intel-leak-label"),
  waveIntelLeak: byId("wave-intel-leak"),
  waveIntelTraits: byId("wave-intel-traits"),
  waveIntelCounterLabel: byId("wave-intel-counter-label"),
  waveIntelCounter: byId("wave-intel-counter"),
  waveIntelDone: button("wave-intel-done"),
  rangerName: byId("ranger-name"),
  frostName: byId("frost-name"),
  emberName: byId("ember-name"),
  stormName: byId("storm-name"),
  selectedEmblem: byId("selected-emblem"),
  selectedLevel: byId("selected-level"),
  selectedName: byId("selected-name"),
  selectedStats: byId("selected-stats"),
  upgradeButton: button("upgrade-button"),
  sellButton: button("sell-button"),
  closeTowerPanel: button("close-tower-panel"),
  selectedHeroEmblem: byId("selected-hero-emblem"),
  selectedHeroRank: byId("selected-hero-rank"),
  selectedHeroName: byId("selected-hero-name"),
  selectedHeroRole: byId("selected-hero-role"),
  selectedHeroHint: byId("selected-hero-hint"),
  heroUpgradeButton: button("hero-upgrade-button"),
  heroDetailsButton: button("hero-details-button"),
  closeHeroPanel: button("close-hero-panel"),
  nextWaveLabel: byId("next-wave-label"),
  waveIntelButton: button("wave-intel-button"),
  wavePreviewSummary: byId("wave-preview-summary"),
  waveEnemies: byId("wave-enemies"),
  threatMeter: byId("threat-meter"),
  startWaveButton: button("start-wave-button"),
  introOverlay: byId("intro-overlay"),
  introCard: document.querySelector<HTMLElement>(".intro-card")!,
  missionPreview: byId("mission-preview"),
  introSigilMark: byId("intro-sigil-mark"),
  introMissionEyebrow: byId("intro-mission-eyebrow"),
  introTitle: byId("intro-title"),
  introBody: byId("intro-body"),
  missionMetrics: byId("mission-metrics"),
  missionDifficultyLabel: byId("mission-difficulty-label"),
  missionDifficulty: byId("mission-difficulty"),
  missionGoldLabel: byId("mission-gold-label"),
  missionGold: byId("mission-gold"),
  missionLivesLabel: byId("mission-lives-label"),
  missionLives: byId("mission-lives"),
  missionTraitLabel: byId("mission-trait-label"),
  missionTraitTitle: byId("mission-trait-title"),
  missionTraitCopy: byId("mission-trait-copy"),
  introAttempts: byId("intro-attempts"),
  introAttemptsLabel: byId("intro-attempts-label"),
  introAttemptsValue: byId("intro-attempts-value"),
  attemptPurchase: byId("attempt-purchase"),
  attemptPurchaseSource: byId("attempt-purchase-source"),
  attemptPurchaseBalance: byId("attempt-purchase-balance"),
  attemptPurchaseConfirmation: byId("attempt-purchase-confirmation"),
  attemptPurchaseEyebrow: byId("attempt-purchase-eyebrow"),
  attemptPurchaseTitle: byId("attempt-purchase-title"),
  attemptPurchaseCopy: byId("attempt-purchase-copy"),
  attemptPurchaseStatus: byId("attempt-purchase-status"),
  attemptPurchaseCancel: button("attempt-purchase-cancel"),
  attemptPurchaseConfirm: button("attempt-purchase-confirm"),
  introStart: button("intro-start"),
  introRestartCancel: button("intro-restart-cancel"),
  introLeaderboard: button("intro-leaderboard"),
  introLeaderboardLabel: byId("intro-leaderboard-label"),
  sessionPicker: byId("session-picker"),
  levelChoiceLabel: byId("level-choice-label"),
  levelSelect: select("level-select"),
  modeChoiceLabel: byId("mode-choice-label"),
  modeSelect: select("mode-select"),
  modeUnlockHint: byId("mode-unlock-hint"),
  heroChoiceButton: button("hero-choice-button"),
  heroChoiceEmblem: byId("hero-choice-emblem"),
  heroChoiceLabel: byId("hero-choice-label"),
  heroChoiceName: byId("hero-choice-name"),
  heroChoiceRole: byId("hero-choice-role"),
  heroChoiceLock: byId("hero-choice-lock"),
  heroPicker: byId("hero-picker"),
  heroPickerEyebrow: byId("hero-picker-eyebrow"),
  heroPickerTitle: byId("hero-picker-title"),
  heroPickerHint: byId("hero-picker-hint"),
  heroPickerClose: button("hero-picker-close"),
  heroPickerDone: button("hero-picker-done"),
  heroPickerDetails: byId("hero-picker-details"),
  heroEiraName: byId("hero-eira-name"),
  heroEiraRole: byId("hero-eira-role"),
  heroEiraAbility: byId("hero-eira-ability"),
  heroTorenName: byId("hero-toren-name"),
  heroTorenRole: byId("hero-toren-role"),
  heroTorenAbility: byId("hero-toren-ability"),
  heroGrakName: byId("hero-grak-name"),
  heroGrakRole: byId("hero-grak-role"),
  heroGrakAbility: byId("hero-grak-ability"),
  heroGrakUnlock: byId("hero-grak-unlock"),
  introWaves: byId("intro-waves"),
  introTowers: byId("intro-towers"),
  introBosses: byId("intro-bosses"),
  gameMenuOverlay: byId("game-menu-overlay"),
  gameMenuTitle: byId("game-menu-title"),
  gameMenuEyebrow: byId("game-menu-eyebrow"),
  gameMenuClose: button("game-menu-close"),
  gameMenuContinue: button("game-menu-continue"),
  gameMenuHeroDetails: byId("game-menu-hero-details"),
  gameMenuSpeedLabel: byId("game-menu-speed-label"),
  gameMenuSpeedButtons: [...document.querySelectorAll<HTMLButtonElement>("[data-menu-speed]")],
  gameMenuTowerGuideLabel: byId("game-menu-tower-guide-label"),
  gameMenuLeaderboard: button("game-menu-leaderboard"),
  gameMenuLeaderboardLabel: byId("game-menu-leaderboard-label"),
  gameMenuFullscreenLabel: byId("game-menu-fullscreen-label"),
  gameMenuSession: button("game-menu-session"),
  gameMenuSessionLabel: byId("game-menu-session-label"),
  gameMenuRestart: button("game-menu-restart"),
  gameMenuRestartLabel: byId("game-menu-restart-label"),
  gameMenuRetire: button("game-menu-retire"),
  gameMenuRetireLabel: byId("game-menu-retire-label"),
  gameMenuExit: button("game-menu-exit"),
  gameMenuExitLabel: byId("game-menu-exit-label"),
  gameMenuRestartConfirm: byId("game-menu-restart-confirm"),
  gameMenuRestartConfirmTitle: byId("game-menu-restart-confirm-title"),
  gameMenuRestartConfirmCopy: byId("game-menu-restart-confirm-copy"),
  gameMenuRestartCancel: button("game-menu-restart-cancel"),
  gameMenuRestartAccept: button("game-menu-restart-accept"),
  leaderboardOverlay: byId("leaderboard-overlay"),
  leaderboardClose: button("leaderboard-close"),
  leaderboardEyebrow: byId("leaderboard-eyebrow"),
  leaderboardTitle: byId("leaderboard-title"),
  leaderboardTabs: byId("leaderboard-tabs"),
  leaderboardTabButtons: [...document.querySelectorAll<HTMLButtonElement>("[data-leaderboard-level]")],
  leaderboardModeTabs: byId("leaderboard-mode-tabs"),
  leaderboardModeButtons: [...document.querySelectorAll<HTMLButtonElement>("[data-leaderboard-mode]")],
  leaderboardPanel: byId("leaderboard-panel"),
  leaderboardSummary: byId("leaderboard-summary"),
  leaderboardStatus: byId("leaderboard-status"),
  leaderboardList: byId("leaderboard-list"),
  leaderboardSelf: byId("leaderboard-self"),
  leaderboardRetry: button("leaderboard-retry"),
  resultOverlay: byId("result-overlay"),
  resultCard: document.querySelector<HTMLElement>(".result-card")!,
  resultSigil: byId("result-sigil"),
  resultEyebrow: byId("result-eyebrow"),
  resultTitle: byId("result-title"),
  resultScore: byId("result-score"),
  resultStats: byId("result-stats"),
  resultWaves: byId("result-waves"),
  resultWavesLabel: byId("result-waves-label"),
  resultDuration: byId("result-duration"),
  resultDurationLabel: byId("result-duration-label"),
  resultKills: byId("result-kills"),
  resultKillsLabel: byId("result-kills-label"),
  resultRunSummary: byId("result-run-summary"),
  resultAdviceEyebrow: byId("result-advice-eyebrow"),
  resultAdviceTitle: byId("result-advice-title"),
  resultAdviceBody: byId("result-advice-body"),
  rewardStatus: byId("reward-status"),
  rewardRetry: button("reward-retry"),
  resultLeaderboard: button("result-leaderboard"),
  restartButton: button("restart-button"),
  closeHint: byId("close-hint"),
  toast: byId("toast"),
  gameRoot: byId("game-root"),
  towerCards: [...document.querySelectorAll<HTMLButtonElement>("[data-tower]")],
  heroOptions: [...document.querySelectorAll<HTMLButtonElement>("[data-hero-choice]")],
  languageSelects: [...document.querySelectorAll<HTMLSelectElement>('[data-role="language"]')],
  languageLabels: [...document.querySelectorAll<HTMLElement>("[data-language-label]")],
};

elements.appShell.inert = true;
applyPlayerProfile(playerProfile);
applyStaticTranslations();
applyLaunchErrorTranslations();
telegram.setClosingConfirmation(reward.mode === "server" && !finishSettled);

const gameCallbacks: TowerDefenseCallbacks = {
  onUiChange: (ui) => {
    latestUi = ui;
    renderUi(ui);
  },
  onPersist: (campaign) => {
    if (!saveCampaign(storage, saveKey, campaign) && !localSaveWarningShown) {
      localSaveWarningShown = true;
      showToast(text("local_save_unavailable"), true);
    }
  },
  onNotice: showNotice,
  onWaveClear: (wave, bonus, repairedLives) => {
    void ensureServerCheckpoints(wave).then((saved) => {
      if (!saved && !checkpointFailureShown) {
        checkpointFailureShown = true;
        showToast(text("checkpoint_save_failed"), true);
      }
    });
    const level = currentScene()?.getCampaign().levelId;
    const awakeningWave = level ? CONTENT_CATALOG.levels[level]?.progression.awakeningWave : null;
    const awakeningUnlocked = wave === awakeningWave && currentScene()?.getCampaign().hero.level === 3;
    showToast(awakeningUnlocked
      ? `${text("hero_awakening_unlocked")} · ${text("clear_bonus", { amount: bonus })}`
      : `${text("wave_clear")} · ${text("clear_bonus", { amount: bonus })}`);
    if (repairedLives > 0) window.setTimeout(() => showToast(`♥ +${repairedLives} · ${text("boss_repair")}`), 750);
  },
  onTerminal: handleTerminal,
  onHaptic: telegram.haptic,
};

if (!checkpointResumeMismatch && checkpointTargetWave > confirmedServerWave) {
  void ensureServerCheckpoints(checkpointTargetWave);
}

type TowerDefenseRuntime = typeof import("./rendering/TowerDefenseScene.ts");
type GameMountContext = Readonly<{
  parent: HTMLElement;
  campaign: TowerDefenseUiState["campaign"];
  callbacks: TowerDefenseCallbacks;
  initialBuildType?: TowerType | null;
  heroCombatPreview: boolean;
}>;

const runtimeController = createLazyRuntimeController(
  () => import("./rendering/TowerDefenseScene.ts"),
  (runtime: TowerDefenseRuntime, context: GameMountContext) => runtime.createTowerDefenseGame(
    context.parent,
    context.campaign,
    context.callbacks,
    context.initialBuildType,
    { heroCombatPreview: context.heroCombatPreview },
  ),
);

bindInteractions();
const developmentResultShown = showDevelopmentResultPreview();
const pendingFinishRestored = developmentResultShown || restorePendingFinish();
if (!developmentResultShown) showRestoredRunStatus();
if (checkpointResumeMismatch) showToast(text("run_resume_restart_required"), true);
if (!pendingFinishRestored) {
  if (elements.introOverlay.hidden) {
    await mountRestoredGame();
  } else {
    (attemptPurchaseState === "offer" ? elements.introStart : elements.attemptPurchaseConfirm).focus();
  }
}

function bindInteractions(): void {
  elements.languageSelects.forEach((select) => {
    select.addEventListener("change", () => setLocale(select.value));
  });
  elements.towerCards.forEach((card) => {
    card.addEventListener("click", () => {
      currentScene()?.setBuildType(card.dataset.tower as TowerType);
      updateTutorialState(reduceTutorial(tutorialState, { type: "tower_selected" }));
    });
  });
  elements.startWaveButton.addEventListener("click", () => {
    if (currentScene()?.startWave()) completeTutorial();
  });
  elements.tutorialSkip.addEventListener("click", () => completeTutorial());
  elements.waveIntelButton.addEventListener("click", openWaveIntel);
  elements.waveIntelClose.addEventListener("click", closeWaveIntel);
  elements.waveIntelDone.addEventListener("click", closeWaveIntel);
  elements.waveIntelOverlay.addEventListener("click", (event) => {
    if (event.target === elements.waveIntelOverlay) closeWaveIntel();
  });
  elements.waveIntelTabs.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLButtonElement) || !renderedWaveIntelPlan) return;
    const tabs = [...elements.waveIntelTabs.querySelectorAll<HTMLButtonElement>("[role=tab]")];
    const currentIndex = tabs.indexOf(event.target);
    if (currentIndex < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : event.key === "ArrowRight"
          ? (currentIndex + 1) % tabs.length
          : (currentIndex - 1 + tabs.length) % tabs.length;
    const type = tabs[nextIndex]?.dataset.enemyType;
    if (type) selectWaveIntelEnemy(type as EnemyType, true);
  });
  elements.speedButton.addEventListener("click", () => currentScene()?.toggleSpeed());
  elements.gameMenuButton.addEventListener("click", toggleGameMenu);
  elements.gameMenuClose.addEventListener("click", () => closeGameMenu(true));
  elements.gameMenuContinue.addEventListener("click", () => closeGameMenu(true));
  elements.gameMenuOverlay.addEventListener("click", (event) => {
    if (event.target === elements.gameMenuOverlay) closeGameMenu(true);
  });
  elements.introLeaderboard.addEventListener("click", () => openLeaderboard("intro"));
  elements.gameMenuLeaderboard.addEventListener("click", () => openLeaderboard("menu"));
  elements.resultLeaderboard.addEventListener("click", () => openLeaderboard("result"));
  elements.leaderboardClose.addEventListener("click", closeLeaderboard);
  elements.leaderboardOverlay.addEventListener("click", (event) => {
    if (event.target === elements.leaderboardOverlay) closeLeaderboard();
  });
  elements.leaderboardTabButtons.forEach((control) => {
    control.addEventListener("click", () => selectLeaderboardLevel(control.dataset.leaderboardLevel));
  });
  elements.leaderboardModeButtons.forEach((control) => {
    control.addEventListener("click", () => selectLeaderboardMode(control.dataset.leaderboardMode));
  });
  elements.leaderboardTabs.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const availableControls = elements.leaderboardTabButtons.filter((control) => !control.hidden && !control.disabled);
    const currentIndex = availableControls.indexOf(event.target);
    if (currentIndex < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = availableControls.length - 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowRight"
          ? (currentIndex + 1) % availableControls.length
          : (currentIndex - 1 + availableControls.length) % availableControls.length;
    const next = availableControls[nextIndex];
    selectLeaderboardLevel(next.dataset.leaderboardLevel);
    next.focus();
  });
  elements.leaderboardModeTabs.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const currentIndex = elements.leaderboardModeButtons.indexOf(event.target);
    if (currentIndex < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = elements.leaderboardModeButtons.length - 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowRight"
          ? (currentIndex + 1) % elements.leaderboardModeButtons.length
          : (currentIndex - 1 + elements.leaderboardModeButtons.length) % elements.leaderboardModeButtons.length;
    const next = elements.leaderboardModeButtons[nextIndex];
    selectLeaderboardMode(next.dataset.leaderboardMode);
    next.focus();
  });
  elements.leaderboardRetry.addEventListener("click", () => void loadLeaderboard(true));
  elements.gameMenuSpeedButtons.forEach((control) => {
    control.addEventListener("click", () => setGameSpeed(control.dataset.menuSpeed));
  });
  elements.pulseButton.addEventListener("click", () => currentScene()?.useHeroAbility());
  elements.heroTargetCancel.addEventListener("click", () => currentScene()?.cancelHeroAbilityTargeting());
  elements.upgradeButton.addEventListener("click", () => currentScene()?.upgradeSelectedTower());
  elements.sellButton.addEventListener("click", () => currentScene()?.sellSelectedTower());
  elements.closeTowerPanel.addEventListener("click", () => currentScene()?.clearSelection());
  elements.heroUpgradeButton.addEventListener("click", () => currentScene()?.upgradeHero());
  elements.heroDetailsButton.addEventListener("click", () => openGameMenu(true));
  elements.closeHeroPanel.addEventListener("click", () => currentScene()?.clearSelection());
  elements.fullscreenButton.addEventListener("click", () => {
    if (telegram.isFullscreen) telegram.exitFullscreen();
    else telegram.requestFullscreen();
  });
  elements.gameMenuSession.addEventListener("click", () => {
    closeGameMenu(false, false);
    openSessionMenu();
  });
  elements.gameMenuRestart.addEventListener("click", showRestartConfirmation);
  elements.gameMenuRetire.addEventListener("click", showRetireConfirmation);
  elements.gameMenuRestartCancel.addEventListener("click", hideRestartConfirmation);
  elements.gameMenuRestartAccept.addEventListener("click", acceptMenuConfirmation);
  elements.gameMenuExit.addEventListener("click", showRetireConfirmation);
  telegram.onFullscreenChange(syncFullscreenUi);
  elements.towerGuideButton.addEventListener("click", () => openTowerGuideFromMenu());
  elements.towerGuideClose.addEventListener("click", closeTowerGuide);
  elements.towerGuideDone.addEventListener("click", closeTowerGuide);
  elements.towerGuideOverlay.addEventListener("click", (event) => {
    if (event.target === elements.towerGuideOverlay) closeTowerGuide();
  });
  elements.levelSelect.addEventListener("change", () => void switchPracticeSession(
    elements.levelSelect.value,
    elements.modeSelect.value,
  ));
  elements.modeSelect.addEventListener("change", () => void switchPracticeSession(
    elements.levelSelect.value,
    elements.modeSelect.value,
  ));
  elements.heroChoiceButton.addEventListener("click", openHeroPicker);
  elements.heroPickerClose.addEventListener("click", () => closeHeroPicker(true));
  elements.heroPickerDone.addEventListener("click", () => closeHeroPicker(true));
  elements.heroOptions.forEach((option) => {
    option.addEventListener("click", () => chooseHero(option.dataset.heroChoice as HeroId));
  });
  elements.introStart.addEventListener("click", () => {
    if (launchError === "daily_attempt_limit") {
      void executeDailyAttemptLimitPrimaryAction({
        canResetAttempts: canResetDailyAttempts,
        hasPurchaseOffer: Boolean(attemptPurchaseOffer),
        onAdminReset: resetAdminDailyAttempts,
        onPurchaseOffer: showAttemptPurchaseConfirmation,
      });
    }
    else if (launchError === "miniapp_start_failed" || runtimeLoadFailed) reloadPage();
    else void startGameFromIntro();
  });
  elements.introRestartCancel.addEventListener("click", cancelPendingRestart);
  elements.attemptPurchaseCancel.addEventListener("click", hideAttemptPurchaseConfirmation);
  elements.attemptPurchaseConfirm.addEventListener("click", () => void purchaseDailyAttempts());
  elements.rewardRetry.addEventListener("click", () => {
    if (finishRunReplaced) return;
    finishAuthRefreshAttempted = false;
    void finishReward();
  });
  elements.restartButton.addEventListener("click", restartGame);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && latestUi && (latestUi.phase === "wave" || latestUi.phase === "countdown")) {
      currentScene()?.setPaused(true);
    }
  });
  window.addEventListener("beforeunload", (event) => {
    if (reward.mode === "server" && !finishSettled && !reloadRequested) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!elements.heroTargetPrompt.hidden) currentScene()?.cancelHeroAbilityTargeting();
    else if (!elements.leaderboardOverlay.hidden) closeLeaderboard();
    else if (!elements.waveIntelOverlay.hidden) closeWaveIntel();
    else if (!elements.towerGuideOverlay.hidden) closeTowerGuide();
    else if (!elements.gameMenuRestartConfirm.hidden) hideRestartConfirmation();
    else if (!elements.gameMenuOverlay.hidden) closeGameMenu(true);
    else if (attemptPurchaseState !== "offer" && attemptPurchaseState !== "loading" && attemptPurchaseState !== "success") {
      hideAttemptPurchaseConfirmation();
    }
    else if (!elements.heroPicker.hidden) closeHeroPicker(true);
  });
}

function currentScene(): TowerDefenseScene | null {
  return runtimeController.getMounted()?.scene ?? null;
}

function setAppShellBlocked(blocked: boolean): void {
  elements.appShell.inert = blocked;
  if (blocked) {
    currentScene()?.setInputEnabled(false);
    return;
  }
  // Re-enable after the closing pointer event has finished, so it cannot also
  // activate the map object underneath the dismissed modal.
  window.setTimeout(() => {
    if (!elements.appShell.inert) currentScene()?.setInputEnabled(true);
  }, 0);
}

async function ensureGameMounted(): Promise<boolean> {
  try {
    await runtimeController.ensureMounted({
      parent: elements.gameRoot,
      campaign: initialCampaign,
      callbacks: gameCallbacks,
      initialBuildType: tutorialState.step === "choose_tower" ? null : undefined,
      heroCombatPreview: isHeroCombatPreviewEnabled(initialCampaign.hero.id),
    });
    gameMounted = true;
    currentScene()?.setInputEnabled(!elements.appShell.inert);
    syncHeroChoiceControls();
    return true;
  } catch (error) {
    if (import.meta.env.DEV) console.error("Tower Defense runtime failed to mount", error);
    return false;
  }
}

async function startGameFromIntro(): Promise<void> {
  if (gameStarting || sessionSwitching || launchError) return;
  closeHeroPicker(false);
  gameStarting = true;
  runtimeLoadFailed = false;
  syncIntroAction();
  syncSessionControls();
  if (latestUi) syncTutorial(latestUi);
  if (restartSelectionPending) {
    const restarted = await applyPendingRestart();
    if (!restarted) {
      gameStarting = false;
      syncIntroAction();
      syncSessionControls();
      return;
    }
  } else if (launchDecision.kind === "miniapp" && reward.mode !== "server") {
    const started = await createSelectedMiniAppRun();
    if (!started) {
      gameStarting = false;
      syncIntroAction();
      syncSessionControls();
      return;
    }
  }
  const ready = await ensureGameMounted();
  gameStarting = false;
  if (!ready) {
    showRuntimeLoadFailure();
    return;
  }
  runStarted = true;
  const startedCampaign = currentScene()?.getCampaign() ?? initialCampaign;
  if (!saveCampaign(storage, saveKey, startedCampaign) && !localSaveWarningShown) {
    localSaveWarningShown = true;
    showToast(text("local_save_unavailable"), true);
  }
  syncIntroAction();
  syncSessionControls();
  dismissIntro();
}

async function createSelectedMiniAppRun(): Promise<boolean> {
  if (launchDecision.kind !== "miniapp") return true;
  if (!isClientLevelReleased(selectedSession.level.id, previewContentEnabled)) {
    showToast(text("miniapp_launch_error_body"), true);
    return false;
  }
  if (!isSessionAvailable(selectedSession.level.id, selectedSession.mode.id, playerProfile)) {
    showToast(text("mode_endless_locked"), true);
    return false;
  }
  const requestedSelection = Object.freeze({
    levelId: selectedSession.level.id,
    modeId: selectedSession.mode.id,
    heroId: selectedHeroId,
  });
  const started = await startMiniAppReward(launchDecision.initData, {
    selection: {
      ...requestedSelection,
    },
  });
  if (!started.ok) {
    if (started.error === "daily_attempt_limit") {
      launchError = "daily_attempt_limit";
      canResetDailyAttempts = started.canResetAttempts === true;
      attemptPurchaseOffer = started.attemptPurchase ?? null;
      attemptPurchaseBalanceCrystals = attemptPurchaseOffer?.balanceCrystals ?? 0;
      applyLaunchErrorTranslations();
    } else if (started.error === "active_run_conflict") {
      reloadPage();
    } else {
      showToast(text(started.error === "mode_locked" ? "mode_endless_locked" : "miniapp_launch_error_body"), true);
    }
    return false;
  }
  if (!isClientLevelReleased(started.bootstrap.binding.levelId, previewContentEnabled)) {
    showToast(text("miniapp_launch_error_body"), true);
    return false;
  }
  if (started.bootstrap.runContractVersion !== 3) {
    showToast(text("miniapp_launch_error_body"), true);
    return false;
  }
  const selectionChanged = started.bootstrap.binding.levelId !== requestedSelection.levelId
    || started.bootstrap.binding.modeId !== requestedSelection.modeId
    || started.bootstrap.heroId !== requestedSelection.heroId;
  clearAttemptPurchaseRequestId(session);
  if (!saveMiniAppBootstrap(session, started.bootstrap)) {
    showToast(text("local_save_unavailable"), true);
  }
  activateServerBootstrap(started.bootstrap, selectedHeroId);
  initialCampaign = createCampaignState({
    level: selectedSession.level,
    mode: selectedSession.mode,
    heroId: selectedHeroId,
  });
  if (selectionChanged || started.bootstrap.resumed && started.bootstrap.confirmedWave > 0) {
    restartSelectionPending = true;
    showToast(text(selectionChanged ? "run_selection_changed" : "run_resume_restart_required"), true);
    return false;
  }
  return true;
}

async function applyPendingRestart(): Promise<boolean> {
  if (!restartSelectionPending || restartSubmitting) return false;
  restartSubmitting = true;
  syncIntroAction();
  try {
    if (reward.mode === "server") {
      if (launchDecision.kind !== "miniapp" || !miniAppBootstrap) return false;
      const restartSource = miniAppBootstrap;
      let restarted = await restartMiniAppRun(
        launchDecision.initData,
        miniAppBootstrap,
        selectedHeroId,
      );
      if (!restarted.ok && (restarted.error === "invalid_token" || restarted.error === "http_403")) {
        const refreshed = await refreshActiveRunAuthorization(miniAppBootstrap);
        if (refreshed && miniAppBootstrap) {
          restarted = await restartMiniAppRun(
            launchDecision.initData,
            miniAppBootstrap,
            selectedHeroId,
          );
        }
      }
      if (!restarted.ok) {
        const recovered = await recoverAppliedRestart(restartSource, selectedHeroId);
        if (recovered) restarted = Object.freeze({ ok: true, bootstrap: recovered });
      }
      if (!restarted.ok) {
        showToast(text("game_menu_restart_failed"), true);
        return false;
      }
      if (!replaceMiniAppBootstrap(session, restarted.bootstrap)) {
        showToast(text("local_save_unavailable"), true);
      }
      clearCampaign(storage, saveKey);
      removePendingResult(storage, reward.runId, currentRunRevision());
      activateServerBootstrap(restarted.bootstrap, selectedHeroId);
    } else {
      clearCampaign(storage, saveKey);
      clearCampaign(storage, LEGACY_SAVE_KEY);
    }

    const previous = runtimeController.clearMounted();
    if (previous) {
      gameMounted = false;
      previous.game.destroy(true);
      await waitForRendererCleanup();
      elements.gameRoot.replaceChildren();
    }
    initialCampaign = createCampaignState({
      level: selectedSession.level,
      mode: selectedSession.mode,
      heroId: selectedHeroId,
    });
    latestUi = null;
    runStarted = false;
    renderedPreviewWave = -1;
    rewardFinisher = null;
    terminalResult = null;
    finishSettled = reward.mode === "local";
    terminalSubmissionStarted = false;
    exitAfterTerminalSettlement = false;
    serverCheckpointTail = Promise.resolve(true);
    confirmedServerWave = miniAppBootstrap?.confirmedWave ?? 0;
    tutorialState = createTutorialState({
      campaign: initialCampaign,
      phase: "setup",
      profile: playerProfile,
      tutorialCompleted: readFlag(storage, TUTORIAL_COMPLETION_STORAGE_KEY),
    });
    northernOnboardingStep = getNorthernOnboardingStep(initialCampaign);
    restartSelectionPending = false;
    telegram.haptic("success");
    return true;
  } finally {
    restartSubmitting = false;
  }
}

async function recoverAppliedRestart(
  expected: MiniAppBootstrap,
  heroId: HeroId,
): Promise<MiniAppBootstrap | null> {
  if (launchDecision.kind !== "miniapp" || expected.runRevision === null) return null;
  const profileResult = await fetchMiniAppProfile(launchDecision.initData);
  if (!profileResult.ok) return null;
  const active = profileResult.bootstrap.activeRun;
  if (
    !active
    || active.runId !== expected.reward.runId
    || active.runContractVersion !== 3
    || active.runRevision <= expected.runRevision
    || active.confirmedWave !== 0
    || active.heroId !== heroId
    || active.binding.levelId !== expected.binding.levelId
    || active.binding.modeId !== expected.binding.modeId
  ) return null;

  const resumed = await startMiniAppReward(launchDecision.initData, {
    resumeRunId: active.runId,
    selection: {
      levelId: active.binding.levelId,
      modeId: active.binding.modeId,
      heroId: active.heroId,
    },
  });
  return resumed.ok
    && resumed.bootstrap.runContractVersion === 3
    && resumed.bootstrap.reward.runId === active.runId
    && resumed.bootstrap.runRevision === active.runRevision
    && resumed.bootstrap.confirmedWave === 0
    && resumed.bootstrap.heroId === heroId
    && resumed.bootstrap.binding.levelId === active.binding.levelId
    && resumed.bootstrap.binding.modeId === active.binding.modeId
    ? resumed.bootstrap
    : null;
}

function activateServerBootstrap(bootstrap: MiniAppBootstrap, fallbackHeroId: HeroId): void {
  if (bootstrap.canAccessNorthernPass) previewContentEnabled = true;
  miniAppBootstrap = bootstrap;
  miniAppProfileBootstrap = Object.freeze({
    profile: bootstrap.profile,
    activeRun: null,
    canAccessNorthernPass: bootstrap.canAccessNorthernPass,
  });
  reward = bootstrap.reward;
  rewardUsedKey = "td-reward-used-v1:" + reward.runId;
  selectedSession = resolveServerSessionSelection(bootstrap.binding);
  saveKey = getCampaignSaveKey(
    reward.runId,
    selectedSession.level.id,
    selectedSession.mode.id,
    currentRunRevision(),
  );
  pendingWaveLimit = selectedSession.mode.getFinalWave(selectedSession.level) ?? MAX_ENDLESS_WAVE;
  pendingScoreLimit = selectedSession.mode.calculateScore(pendingWaveLimit);
  selectedHeroId = bootstrap.heroId ?? fallbackHeroId;
  confirmedServerWave = bootstrap.confirmedWave;
  checkpointTargetWave = confirmedServerWave;
  checkpointFailureShown = false;
  checkpointResumeMismatch = false;
  finishSettled = false;
  applyPlayerProfile(bootstrap.profile);
  telegram.setClosingConfirmation(true);
}

function currentRunRevision(): number | null {
  return miniAppBootstrap?.runContractVersion === 3 ? miniAppBootstrap.runRevision : null;
}

function ensureServerCheckpoints(targetWave: number): Promise<boolean> {
  if (
    launchDecision.kind !== "miniapp"
    || reward.mode !== "server"
    || !miniAppBootstrap
    || miniAppBootstrap.runContractVersion !== 3
  ) return Promise.resolve(true);
  checkpointTargetWave = Math.max(checkpointTargetWave, Math.min(MAX_ENDLESS_WAVE, Math.floor(targetWave)));
  serverCheckpointTail = serverCheckpointTail.then(async () => {
    while (confirmedServerWave < checkpointTargetWave) {
      const saved = await submitServerCheckpoint(confirmedServerWave + 1);
      if (!saved) return false;
    }
    return true;
  });
  return serverCheckpointTail;
}

async function submitServerCheckpoint(completedWave: number): Promise<boolean> {
  if (launchDecision.kind !== "miniapp" || !miniAppBootstrap) return false;
  let source = miniAppBootstrap;
  let authRefreshed = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await recordMiniAppCheckpoint(
      launchDecision.initData,
      source,
      completedWave,
    );
    if (result.ok) {
      if (
        miniAppBootstrap?.reward.runId !== source.reward.runId
        || miniAppBootstrap.runRevision !== source.runRevision
      ) return false;
      confirmedServerWave = result.confirmedWave;
      miniAppBootstrap = Object.freeze({ ...miniAppBootstrap, confirmedWave: result.confirmedWave });
      replaceMiniAppBootstrap(session, miniAppBootstrap);
      checkpointFailureShown = false;
      return true;
    }
    if (
      !authRefreshed
      && (result.error === "invalid_token" || result.error === "http_403")
      && await refreshActiveRunAuthorization(source)
      && miniAppBootstrap
    ) {
      authRefreshed = true;
      source = miniAppBootstrap;
      continue;
    }
    if (result.error !== "checkpoint_too_fast" || attempt > 1) return false;
    await new Promise((resolve) => window.setTimeout(resolve, Math.max(50, result.retryAfterMs ?? 250)));
  }
  return false;
}

async function refreshActiveRunAuthorization(expected: MiniAppBootstrap): Promise<boolean> {
  if (launchDecision.kind !== "miniapp" || expected.runContractVersion !== 3 || !expected.heroId) return false;
  const refreshed = await startMiniAppReward(launchDecision.initData, {
    resumeRunId: expected.reward.runId,
    selection: {
      levelId: expected.binding.levelId,
      modeId: expected.binding.modeId,
      heroId: expected.heroId,
    },
  });
  if (
    !refreshed.ok
    || refreshed.bootstrap.runContractVersion !== 3
    || refreshed.bootstrap.reward.runId !== expected.reward.runId
    || refreshed.bootstrap.runRevision !== expected.runRevision
    || refreshed.bootstrap.confirmedWave !== confirmedServerWave
    || refreshed.bootstrap.binding.levelId !== expected.binding.levelId
    || refreshed.bootstrap.binding.modeId !== expected.binding.modeId
    || refreshed.bootstrap.heroId !== expected.heroId
  ) return false;
  if (!replaceMiniAppBootstrap(session, refreshed.bootstrap)) return false;
  miniAppBootstrap = refreshed.bootstrap;
  reward = refreshed.reward;
  applyPlayerProfile(refreshed.bootstrap.profile);
  return true;
}

async function mountRestoredGame(): Promise<void> {
  introReturnsToRun = hasRunProgress(initialCampaign);
  elements.introOverlay.hidden = false;
  gameStarting = true;
  runtimeLoadFailed = false;
  syncIntroAction();
  syncSessionControls();
  const ready = await ensureGameMounted();
  gameStarting = false;
  if (!ready) {
    showRuntimeLoadFailure();
    return;
  }
  runtimeLoadFailed = false;
  elements.introOverlay.hidden = true;
  setAppShellBlocked(false);
  introReturnsToRun = false;
  syncIntroAction();
  syncSessionControls();
  if (latestUi) syncTutorial(latestUi);
}

function showRuntimeLoadFailure(): void {
  gameStarting = false;
  runtimeLoadFailed = true;
  introReturnsToRun = hasRunProgress(initialCampaign);
  setAppShellBlocked(true);
  elements.introOverlay.hidden = false;
  applyLaunchErrorTranslations();
  syncSessionControls();
  elements.introStart.focus();
  showToast(text("game_load_failed"), true);
}

function renderUi(ui: TowerDefenseUiState): void {
  elements.livesValue.textContent = String(ui.campaign.lives);
  elements.gateShield.hidden = ui.gateShield <= 0;
  elements.gateShield.textContent = `◇ ${ui.gateShield}`;
  elements.gateShield.title = text("hero_gate_shield", { count: ui.gateShield });
  elements.gateShield.setAttribute("aria-label", elements.gateShield.title);
  elements.goldValue.textContent = String(ui.campaign.gold);
  elements.waveValue.textContent = `${ui.currentWave} / ${ui.finalWave ?? "∞"}`;
  elements.waveProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, ui.waveProgress))})`;
  const combatPhase = ui.phase === "wave" || ui.phase === "countdown";
  elements.gameMenuButton.textContent = combatPhase ? (ui.paused ? "▶" : "Ⅱ") : "☰";
  elements.gameMenuButton.classList.toggle("is-active", ui.paused);
  elements.gameMenuButton.disabled = ui.phase === "gameover" || ui.phase === "victory";
  elements.speedButton.textContent = `×${ui.speed}`;
  elements.speedButton.classList.toggle("is-active", ui.speed === 2);
  const actLabel = ui.levelId === NORTHERN_PASS_LEVEL_ID
    ? text(`northern_act_${ui.act}` as TranslationKey)
    : text("act", { count: ui.act });
  elements.phaseBadge.textContent = `${phaseLabel(ui)} · ${actLabel}`;
  elements.countdown.hidden = ui.phase !== "countdown" || ui.paused;
  elements.countdown.textContent = String(Math.max(1, ui.countdown));
  const heroAbility = heroAbilityName(ui.hero.id);
  const recharging = ui.hero.awakened
    && ui.hero.abilityCharges === 0
    && !ui.hero.bonusChargeEarned;
  const frontlineKnockedOut = ui.hero.frontline?.status === "knocked_out";
  const frontlineReturnSeconds = Math.max(
    1,
    Math.ceil((ui.hero.frontline?.knockoutRemainingMs ?? 0) / 1_000),
  );
  elements.pulseLabel.textContent = frontlineKnockedOut
    ? text("hero_frontline_return_short", { seconds: frontlineReturnSeconds })
    : recharging
    ? `${ui.hero.rechargeKills}/${ui.hero.rechargeThreshold}`
    : heroAbility;
  elements.pulseButton.disabled = ui.heroTargeting
    || ui.phase !== "wave"
    || ui.hero.abilityCharges <= 0
    || frontlineKnockedOut
    || ui.enemiesAlive === 0
    || ui.paused;
  elements.pulseButton.classList.toggle("is-used", ui.hero.abilityCharges <= 0);
  elements.pulseButton.classList.toggle("is-targeting", ui.heroTargeting);
  elements.pulseButton.classList.toggle("is-eira", ui.hero.id === "eira");
  elements.pulseButton.classList.toggle("is-toren", ui.hero.id === "toren");
  elements.pulseButton.classList.toggle("is-grak", ui.hero.id === "grak");
  elements.pulseCharges.hidden = !ui.hero.awakened;
  elements.pulseCharges.dataset.charges = String(ui.hero.abilityCharges);
  elements.pulseButton.setAttribute("aria-label", frontlineKnockedOut
    ? text("hero_frontline_knocked_out", { seconds: frontlineReturnSeconds })
    : recharging
    ? text("hero_ability_recharge", {
        count: ui.hero.rechargeKills,
        total: ui.hero.rechargeThreshold,
      })
    : ui.hero.abilityCharges > 0 && ui.hero.awakened
      ? text("hero_ability_ready_charges", {
          ability: heroAbility,
          current: ui.hero.abilityCharges,
          max: ui.hero.maxAbilityCharges,
        })
      : text(ui.hero.abilityCharges > 0 ? "hero_ability_ready" : "hero_ability_used", {
          ability: heroAbility,
        }));
  elements.heroTargetPrompt.hidden = !ui.heroTargeting;
  elements.bossHud.hidden = !ui.boss;
  if (ui.boss) {
    elements.bossIcon.textContent = ui.boss.type === "titan" ? "♜" : "♛";
    elements.bossName.textContent = ui.boss.type === "titan"
      ? text("enemy_titan")
      : text(`${ui.levelId === NORTHERN_PASS_LEVEL_ID ? "northern_boss_act" : "boss_act"}_${ui.boss.tier}` as TranslationKey);
    elements.bossState.textContent = text(ui.boss.enraged ? "boss_enraged" : "boss_state");
    elements.bossHealthFill.style.width = `${Math.round(ui.boss.hpRatio * 100)}%`;
    elements.bossShieldFill.style.width = `${Math.round(ui.boss.shieldRatio * 100)}%`;
    elements.bossShieldFill.parentElement?.toggleAttribute("hidden", ui.boss.shieldRatio <= 0);
  }

  const editing = ui.phase === "setup" && !ui.paused;
  elements.buildHint.textContent = ui.selectedBuildType
    ? towerRole(ui.selectedBuildType)
    : text("build_hint");
  elements.towerCards.forEach((card) => {
    const type = card.dataset.tower as TowerType;
    const selected = ui.selectedBuildType === type;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
    card.disabled = !editing || ui.campaign.gold < TOWER_DEFINITIONS[type].buildCost;
  });

  const selected = getSelectedTowerDetails(ui);
  const heroSelected = ui.selectedHero && !selected;
  elements.buildPanel.hidden = Boolean(selected) || heroSelected;
  elements.towerPanel.hidden = !selected;
  elements.heroPanel.hidden = !heroSelected;
  if (selected) {
    elements.selectedEmblem.className = `tower-emblem ${selected.tower.type}`;
    elements.selectedEmblem.innerHTML = "<i></i>";
    elements.selectedLevel.textContent = `${text("level")} ${selected.tower.level}`;
    elements.selectedName.textContent = towerName(selected.tower.type);
    const nextStats = selected.tower.level < MAX_TOWER_LEVEL
      ? getTowerStats(selected.tower.type, (selected.tower.level + 1) as TowerLevel)
      : null;
    elements.selectedStats.textContent = nextStats
      ? `${text("damage")} ${selected.stats.damage}→${nextStats.damage} · ${text("range")} ${Math.round(selected.stats.range)}→${Math.round(nextStats.range)}`
      : `${text("damage")} ${selected.stats.damage} · ${text("range")} ${Math.round(selected.stats.range)}`;
    elements.selectedStats.title = elements.selectedStats.textContent;
    elements.upgradeButton.textContent = selected.masteryLocked
      ? text("mastery_locked")
      : selected.upgradeCost === null
      ? text("max_level")
      : `${text("upgrade")} · ${selected.upgradeCost} ●`;
    elements.upgradeButton.disabled = !editing || selected.masteryLocked || selected.upgradeCost === null || ui.campaign.gold < selected.upgradeCost;
    elements.sellButton.textContent = `${text("sell")} · ${selected.sellValue} ●`;
    elements.sellButton.disabled = !editing;
  }
  if (heroSelected) {
    const hero = ui.hero;
    const upgradeCost = getHeroUpgradeCost(hero.id, hero.level);
    const progression = CONTENT_CATALOG.levels[ui.levelId]?.progression;
    const upgradeWave = getHeroUpgradeWaveGate(hero.level, progression?.heroUpgradeWaves);
    const upgradeUnlocked = upgradeWave === null || ui.campaign.completedWave >= upgradeWave;
    syncHeroPortrait(elements.selectedHeroEmblem, hero.id);
    elements.selectedHeroRank.textContent = hero.awakened
      ? `${text("hero_rank", { count: hero.level })} · ✦`
      : text("hero_rank", { count: hero.level });
    elements.selectedHeroRank.title = hero.awakened ? text("hero_awakened") : elements.selectedHeroRank.textContent;
    elements.selectedHeroName.textContent = heroName(hero.id);
    elements.selectedHeroRole.textContent = heroRole(hero.id);
    syncHeroAuraStatus(ui);
    elements.heroDetailsButton.setAttribute("aria-label", text("game_menu_hero_details"));
    elements.heroUpgradeButton.textContent = upgradeCost === null
      ? text("hero_max_rank")
      : !upgradeUnlocked && upgradeWave !== null
        ? text("hero_upgrade_wave", { wave: upgradeWave })
        : `${text("upgrade")} · ${upgradeCost} ●`;
    elements.heroUpgradeButton.disabled = !editing
      || upgradeCost === null
      || !upgradeUnlocked
      || ui.campaign.gold < upgradeCost;
  }

  // The paused scene keeps emitting UI snapshots behind the restart picker.
  // Do not let its old hero overwrite the player's pending restart choice.
  if (!restartSelectionPending) selectedHeroId = ui.hero.id;
  syncHeroChoiceControls();

  const plan = ui.nextWavePlan;
  if (renderedPreviewWave !== plan.wave) {
    renderWavePreview(plan);
    renderedPreviewWave = plan.wave;
  }
  syncNorthernAvalanchePreview(ui, plan);
  elements.threatMeter.textContent = `${"◆".repeat(plan.threat)}${"◇".repeat(5 - plan.threat)}`;
  elements.threatMeter.setAttribute("aria-label", text("threat", { count: plan.threat }));
  elements.startWaveButton.disabled = !editing || (ui.finalWave !== null && ui.campaign.completedWave >= ui.finalWave);
  elements.startWaveButton.classList.toggle("is-boss", plan.hasBoss);
  elements.startWaveButton.textContent = plan.hasBoss ? text("boss_wave") : text("start_wave");
  elements.practiceBadge.hidden = reward.mode === "server";
  syncGameMenuUi(ui);
  syncTutorial(ui);
}

function syncNorthernAvalanchePreview(ui: TowerDefenseUiState, plan: WavePlan): void {
  const liveCharges = ui.phase === "wave"
    ? ui.northernPass?.avalanche.chargesRemaining ?? null
    : null;
  const preview = deriveNorthernAvalanchePreview(plan, liveCharges);
  if (!preview || !plan.northernPass) return;
  elements.nextWaveLabel.textContent = text(
    preview.status === "spent" ? "northern_avalanche_spent" : "northern_avalanche_preview",
    {
      zone: northernAvalancheZoneLabel(plan.northernPass.dangerZoneId),
      charges: preview.charges,
    },
  );
}

function syncTutorial(ui: TowerDefenseUiState): void {
  syncNorthernOnboardingProgress(ui);
  updateTutorialState(reduceTutorial(tutorialState, { type: "ui_changed", snapshot: ui }));
}

function syncNorthernOnboardingProgress(ui: TowerDefenseUiState): void {
  if (northernOnboardingStep !== "avalanche") return;
  const northernPass = ui.northernPass;
  if (!northernPass || northernPass.avalanche.chargesRemaining >= northernPass.avalanche.maxCharges) return;
  writeFlag(storage, NORTHERN_ONBOARDING_STORAGE_KEY);
  northernOnboardingStep = getNorthernOnboardingStep(ui.campaign);
}

function updateTutorialState(next: TutorialState): void {
  const completedNow = !isTutorialDone(tutorialState) && isTutorialDone(next);
  tutorialState = next;
  if (completedNow) writeFlag(storage, TUTORIAL_COMPLETION_STORAGE_KEY);

  elements.towerDeck.classList.remove("tutorial-focus");
  elements.battleShell.classList.remove("tutorial-focus");
  elements.startWaveButton.classList.remove("tutorial-focus");
  elements.tutorialCoach.classList.remove("is-action-ready");
  if (!northernOnboardingStep && latestUi) {
    northernOnboardingStep = getNorthernOnboardingStep(latestUi.campaign);
  }
  const northernPass = latestUi?.northernPass;
  const avalancheTargetReady = Boolean(northernPass?.avalanche.zones.some((zone) => zone.canTrigger));
  const northernVisible = northernOnboardingStep !== null
    && latestUi?.levelId === NORTHERN_PASS_LEVEL_ID
    && (northernOnboardingStep === "avalanche"
      ? latestUi.phase === "wave"
        && !latestUi.paused
        && Boolean(northernPass?.avalanche.available)
        && (northernPass?.avalanche.chargesRemaining ?? 0) > 0
      : latestUi.phase === "setup");
  const visible = (northernVisible || !isTutorialDone(tutorialState))
    && gameMounted
    && elements.introOverlay.hidden
    && elements.resultOverlay.hidden;
  elements.tutorialCoach.hidden = !visible;
  if (!visible) return;

  if (northernVisible) {
    const armorStep = northernOnboardingStep === "armor";
    elements.tutorialStep.textContent = "1 / 1";
    elements.tutorialTitle.textContent = text(armorStep
      ? "northern_onboarding_armor_title"
      : "northern_onboarding_title");
    elements.tutorialBody.textContent = text(armorStep
      ? "northern_onboarding_armor_body"
      : "northern_onboarding_body");
    elements.tutorialCoach.classList.toggle("is-action-ready", !armorStep && avalancheTargetReady);
    elements.battleShell.classList.add("tutorial-focus");
    return;
  }

  const stepNumber = tutorialState.step === "choose_tower" ? 1 : tutorialState.step === "place_tower" ? 2 : 3;
  elements.tutorialStep.textContent = `${stepNumber} / 3`;
  elements.tutorialTitle.textContent = text(`tutorial_${tutorialState.step}_title` as TranslationKey);
  elements.tutorialBody.textContent = text(`tutorial_${tutorialState.step}_body` as TranslationKey);
  const focusTarget = tutorialState.step === "choose_tower"
    ? elements.towerDeck
    : tutorialState.step === "place_tower"
      ? elements.battleShell
      : elements.startWaveButton;
  focusTarget.classList.add("tutorial-focus");
}

function completeTutorial(): void {
  if (northernOnboardingStep) {
    writeFlag(storage, northernOnboardingStep === "armor"
      ? NORTHERN_ARMOR_ONBOARDING_STORAGE_KEY
      : NORTHERN_ONBOARDING_STORAGE_KEY);
    northernOnboardingStep = null;
  }
  updateTutorialState(reduceTutorial(tutorialState, { type: "skip" }));
}

function getNorthernOnboardingStep(campaign: TowerDefenseUiState["campaign"]): NorthernOnboardingStep | null {
  if (campaign.levelId !== NORTHERN_PASS_LEVEL_ID) return null;
  if (!readFlag(storage, NORTHERN_ONBOARDING_STORAGE_KEY) && !hasRunProgress(campaign)) return "avalanche";
  if (campaign.completedWave >= 2 && !readFlag(storage, NORTHERN_ARMOR_ONBOARDING_STORAGE_KEY)) return "armor";
  return null;
}

function syncHeroAuraStatus(ui: TowerDefenseUiState): void {
  const frontline = ui.hero.frontline;
  if (frontline) {
    elements.selectedHeroHint.dataset.aura = "frontline";
    const params = {
      hp: Math.max(0, Math.ceil(frontline.hp)),
      max: frontline.maxHp,
      used: frontline.blockUsed,
      capacity: frontline.blockCapacity,
      seconds: Math.max(1, Math.ceil(frontline.knockoutRemainingMs / 1_000)),
    };
    const statusKey: TranslationKey = frontline.status === "knocked_out"
      ? "hero_frontline_knocked_out"
      : frontline.status === "deploying"
        ? "hero_frontline_deploying"
        : frontline.regenActive
          ? "hero_frontline_recovering"
          : frontline.status === "fighting"
            ? "hero_frontline_fighting"
            : frontline.status === "ready"
              ? "hero_frontline_ready"
              : "hero_frontline_holding";
    elements.selectedHeroHint.textContent = text(statusKey, params);
    elements.selectedHeroHint.title = elements.selectedHeroHint.textContent;
    return;
  }
  const aura = getHeroAura(ui.hero.id, ui.hero.level);
  if (!aura) {
    elements.selectedHeroHint.dataset.aura = "locked";
    elements.selectedHeroHint.textContent = text("hero_aura_unlock");
    elements.selectedHeroHint.title = elements.selectedHeroHint.textContent;
    return;
  }

  elements.selectedHeroHint.dataset.aura = aura.kind;
  if (aura.kind === "slow") {
    const stats = getHeroStats(ui.hero.id, ui.hero.level);
    elements.selectedHeroHint.textContent = text("hero_toren_aura_status", {
      slow: Math.round(aura.strength * 100),
      shield: stats.gateShield,
    });
  } else {
    const level = CONTENT_CATALOG.levels[ui.levelId];
    const radiusSquared = aura.radius ** 2;
    const count = ui.campaign.towers.reduce((total, tower) => {
      const point = level?.buildPads[tower.padId];
      if (!point) return total;
      const dx = point.x - ui.hero.x;
      const dy = point.y - ui.hero.y;
      return dx * dx + dy * dy <= radiusSquared ? total + 1 : total;
    }, 0);
    elements.selectedHeroHint.textContent = text(aura.kind === "tower_attack_speed"
      ? "hero_grak_aura_status"
      : "hero_eira_aura_status", {
      count,
      global: Math.round(aura.globalStrength * 100),
      local: Math.round(aura.strength * 100),
    });
  }
  elements.selectedHeroHint.title = elements.selectedHeroHint.textContent;
}

function renderWavePreview(plan: WavePlan): void {
  const types = plan.spawns.map((spawn) => spawn.type);
  const traits: TranslationKey[] = [];
  if (types.some((type) => type === "boss" || type === "titan")) traits.push("wave_trait_boss");
  if (types.some((type) => type === "swift" || type === "shade")) traits.push("wave_trait_fast");
  if (types.some((type) => type === "brute" || type === "bulwark")) traits.push("wave_trait_armored");
  if (plan.spawns.some(({ frostArmorRatio }) => (frostArmorRatio ?? 0) > 0)) traits.push("wave_trait_frost");
  if (types.some((type) => type === "warden" || type === "shaman")) traits.push("wave_trait_support");
  const recommended = recommendWaveTowers(plan);
  const displayedTraits: readonly TranslationKey[] = traits.length ? traits : ["wave_trait_mixed"];
  if (plan.northernPass) {
    elements.nextWaveLabel.dataset.kind = "avalanche";
    elements.nextWaveLabel.textContent = text("northern_avalanche_preview", {
      zone: northernAvalancheZoneLabel(plan.northernPass.dangerZoneId),
      charges: plan.northernPass.avalancheCharges,
    });
    elements.wavePreviewSummary.textContent = text("northern_avalanche_summary", {
      towers: recommended.map(towerName).join(" + "),
    });
  } else {
    delete elements.nextWaveLabel.dataset.kind;
    elements.nextWaveLabel.textContent = text("wave_preview_title", { wave: plan.wave });
    elements.wavePreviewSummary.textContent = text("wave_preview_summary", {
      traits: displayedTraits.slice(0, 2).map((key) => text(key)).join(" · "),
      towers: recommended.map(towerName).join(" + "),
    });
  }
  elements.waveEnemies.replaceChildren(...aggregateWaveEnemies(plan).map((enemy) => {
    const chip = document.createElement("span");
    chip.className = "enemy-chip";
    chip.title = enemyName(enemy.type);
    chip.setAttribute("aria-label", `${enemyName(enemy.type)}: ${enemy.count}`);
    const glyph = document.createElement("i");
    glyph.className = `enemy-glyph ${enemy.type}`;
    glyph.setAttribute("aria-hidden", "true");
    chip.append(glyph, document.createTextNode(`${enemy.count}`));
    return chip;
  }));
}

function northernAvalancheZoneLabel(zoneId: NorthernAvalancheZoneId): string {
  return text(`northern_zone_${zoneId}` as TranslationKey);
}

function phaseLabel(ui: TowerDefenseUiState): string {
  if (ui.paused) return text("paused");
  if (ui.phase === "setup") return text("preparing");
  if (ui.phase === "countdown") return text("preparing");
  if (ui.phase === "wave") return text("fighting");
  return text(ui.phase === "victory" ? "victory" : "game_over");
}

function showNotice(code: NoticeCode): void {
  if (code === "hero_awakening_unlocked") {
    showToast(text("hero_awakening_unlocked"));
    return;
  }
  if (code === "pulse_used") {
    const ability = heroAbilityName(latestUi?.hero.id ?? selectedHeroId);
    showToast(text("hero_ability_used", { ability }), true);
    return;
  }
  if (code === "hero_ability_unavailable") {
    showToast(text("hero_ability_no_target"), true);
    return;
  }
  if (code === "hero_ability_target_required" || code === "invalid_hero_ability_target") {
    showToast(text("hero_ability_target_road"), true);
    return;
  }
  if (code === "invalid_avalanche_zone" || code === "avalanche_unavailable" || code === "avalanche_empty_zone") {
    showToast(text(code), true);
    return;
  }
  const key: TranslationKey = code === "insufficient_gold"
    ? "insufficient_gold"
    : code === "max_level"
      ? "max_level"
      : code === "hero_max_level"
        ? "hero_max_rank"
        : code === "hero_upgrade_locked"
          ? "hero_upgrade_locked"
      : code === "mastery_locked"
        ? "mastery_locked"
        : code === "build_locked"
          ? "build_locked"
          : code === "invalid_hero_anchor"
            ? "select_hero_anchor"
          : "select_pad";
  showToast(text(key), true);
}

function showToast(message: string, isError = false): void {
  if (toastTimer) clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), isError ? 5_200 : 2_800);
}

function handleTerminal(outcome: RunTerminalOutcome, campaign: TowerDefenseUiState["campaign"]): void {
  if (terminalSubmissionStarted) return;
  terminalSubmissionStarted = true;
  const finishOutcome = normalizeFinishOutcome(selectedSession.mode.id, outcome);
  const displayOutcome: RunTerminalOutcome = outcome === "retired"
    ? "retired"
    : finishOutcome === "defeat" ? "gameover" : finishOutcome;
  const pendingOutcome: RunTerminalOutcome = finishOutcome === "defeat" ? "gameover" : finishOutcome;
  const finalWave = selectedSession.mode.getFinalWave(selectedSession.level);
  const completedWaves = finalWave === null ? campaign.completedWave : Math.min(finalWave, campaign.completedWave);
  const score = selectedSession.mode.calculateScore(completedWaves);
  const result = captureFinalResult(score, campaign.activeDurationMs);
  const summary = createPendingRunSummary(campaign);
  terminalResult = result;
  const pendingSaved = reward.mode === "server"
    && savePendingResult(
      storage,
      reward.runId,
      pendingOutcome,
      result,
      completedWaves,
      summary,
      currentRunRevision(),
    );
  if (reward.mode === "local" || pendingSaved) clearCampaign(storage, saveKey);
  showResult(displayOutcome, result, completedWaves, finalWave, summary);
  finishAuthRefreshAttempted = false;
  finishRunReplaced = false;
  replacementBootstrapCached = false;
  rewardFinisher = createRewardFinisher(reward, captureFinishSubmission(
    result.score,
    result.durationMs,
    finishOutcome,
    completedWaves,
    summary.heroId,
  ), { runRevision: miniAppBootstrap?.runRevision });
  void finishReward();
}

async function finishReward(): Promise<void> {
  if (!rewardFinisher || !terminalResult) return;
  elements.rewardRetry.hidden = true;
  elements.restartButton.hidden = true;
  elements.rewardStatus.className = "reward-status";
  elements.rewardStatus.textContent = text("reward_saving");
  elements.closeHint.textContent = text(reward.mode === "server" ? "finish_pending_hint" : "close_hint");
  const finishMetadata = rewardFinisher.finishMetadata;
  if (
    reward.mode === "server"
    && miniAppBootstrap?.runContractVersion === 3
    && finishMetadata
    && !await ensureServerCheckpoints(finishMetadata.completedWaves)
  ) {
    elements.rewardStatus.classList.add("is-error");
    elements.rewardStatus.textContent = text("checkpoint_save_failed");
    elements.rewardRetry.hidden = false;
    elements.closeHint.textContent = text("finish_failed_hint");
    telegram.setClosingConfirmation(true);
    return;
  }
  const result = await rewardFinisher.finish();
  if (result.mode === "local") {
    finishSettled = true;
    elements.rewardStatus.classList.add("is-success");
    elements.rewardStatus.textContent = text("practice");
    elements.restartButton.hidden = false;
    elements.closeHint.textContent = text("close_hint");
    telegram.setClosingConfirmation(false);
    completeTerminalExit();
    return;
  }
  if (!result.ok && result.error === "http_403") {
    if (await refreshFinishAuthorization()) {
      await finishReward();
      return;
    }
    if (finishRunReplaced) {
      finishSettled = true;
      removePendingResult(storage, reward.runId, currentRunRevision());
      elements.rewardStatus.textContent = text("run_replaced");
      elements.restartButton.hidden = false;
      elements.closeHint.textContent = text("close_hint");
      telegram.setClosingConfirmation(false);
      completeTerminalExit();
      return;
    }
  }
  if (result.ok) {
    finishSettled = true;
    leaderboardClient?.invalidate(selectedSession.level.id, selectedSession.mode.id as typeof CAMPAIGN_MODE_ID | typeof ENDLESS_MODE_ID);
    if (
      !elements.leaderboardOverlay.hidden
      && leaderboardLevelId === selectedSession.level.id
      && leaderboardModeId === selectedSession.mode.id
    ) {
      void loadLeaderboard(true);
    }
    if (result.profile) applyPlayerProfile(result.profile);
    elements.rewardStatus.classList.add("is-success");
    elements.rewardStatus.textContent = text(
      result.profileSync === "pending"
        ? "profile_sync_pending"
        : result.duplicate
          ? "reward_duplicate"
          : "reward_saved",
    );
    elements.restartButton.hidden = false;
    elements.closeHint.textContent = text("close_hint");
    telegram.setClosingConfirmation(false);
    if (result.profileSync === "pending") {
      elements.rewardRetry.textContent = text("profile_sync_retry");
      elements.rewardRetry.hidden = false;
      return;
    }
    if (rewardUsedKey) writeFlag(storage, rewardUsedKey);
    if (isMiniAppLaunch) clearMiniAppReward(session);
    clearCampaign(storage, saveKey);
    removePendingResult(storage, reward.runId, currentRunRevision());
    completeTerminalExit();
    return;
  }
  if (finishSettled) {
    elements.rewardStatus.classList.add("is-success");
    elements.rewardStatus.textContent = text("profile_sync_retry_failed");
    elements.rewardRetry.textContent = text("profile_sync_retry");
    elements.rewardRetry.hidden = false;
    elements.restartButton.hidden = false;
    elements.closeHint.textContent = text("close_hint");
    telegram.setClosingConfirmation(false);
    return;
  }
  elements.rewardStatus.classList.add("is-error");
  elements.rewardStatus.textContent = text("reward_failed");
  elements.rewardRetry.hidden = false;
  elements.closeHint.textContent = text("finish_failed_hint");
  telegram.setClosingConfirmation(true);
}

function completeTerminalExit(): void {
  if (!exitAfterTerminalSettlement || !finishSettled) return;
  exitAfterTerminalSettlement = false;
  telegram.setClosingConfirmation(false);
  restartGame();
}

async function refreshFinishAuthorization(): Promise<boolean> {
  if (
    finishAuthRefreshAttempted
    || launchDecision.kind !== "miniapp"
    || reward.mode !== "server"
    || !rewardFinisher
  ) return false;
  finishAuthRefreshAttempted = true;
  const currentRunId = reward.runId;
  const currentRevision = currentRunRevision();
  const refreshed = await startMiniAppReward(launchDecision.initData, {
    resumeRunId: currentRunId,
    selection: {
      levelId: selectedSession.level.id,
      modeId: selectedSession.mode.id,
      heroId: selectedHeroId,
    },
  });
  if (!refreshed.ok) return false;
  const bootstrapCached = replaceMiniAppBootstrap(session, refreshed.bootstrap);
  if (
    refreshed.reward.runId !== currentRunId
    || (currentRevision !== null && refreshed.bootstrap.runRevision !== currentRevision)
  ) {
    finishRunReplaced = true;
    replacementBootstrapCached = bootstrapCached;
    return false;
  }

  reward = refreshed.reward;
  miniAppBootstrap = refreshed.bootstrap;
  applyPlayerProfile(refreshed.bootstrap.profile);
  const previous = rewardFinisher;
  rewardFinisher = createRewardFinisher(reward, previous.finishMetadata
    ? captureFinishSubmission(
      previous.finalResult.score,
      previous.finalResult.durationMs,
      previous.finishMetadata.outcome,
      previous.finishMetadata.completedWaves,
      previous.finishMetadata.heroId,
    )
    : previous.finalResult, { runRevision: refreshed.bootstrap.runRevision });
  return true;
}

function showResult(
  outcome: RunTerminalOutcome,
  result: FinalResult,
  completedWaves: number,
  finalWave: number | null,
  summary?: PendingRunSummary,
): void {
  elements.resultOverlay.hidden = false;
  setAppShellBlocked(true);
  elements.resultCard.classList.toggle("is-victory", outcome === "victory");
  elements.resultCard.classList.toggle("is-defeat", outcome === "gameover");
  elements.resultCard.classList.toggle("is-retired", outcome === "retired");
  elements.resultSigil.textContent = outcome === "victory" ? "✦" : outcome === "retired" ? "◇" : "◆";
  elements.resultTitle.textContent = text(
    outcome === "victory" ? "victory" : outcome === "retired" ? "run_retired" : "game_over",
  );
  elements.resultScore.textContent = `${text(selectedSession.level.displayNameKey)} · ${text(selectedSession.mode.displayNameKey)}`;
  elements.resultWaves.textContent = `${completedWaves} / ${finalWave ?? "∞"}`;
  elements.resultDuration.textContent = formatLeaderboardDuration(result.durationMs);
  elements.resultKills.textContent = summary ? String(summary.kills) : "—";
  elements.resultRunSummary.hidden = !summary;
  if (summary) {
    elements.resultRunSummary.textContent = text("result_run_summary", {
      hero: heroName(summary.heroId),
      towers: summary.towers,
      lives: summary.lives,
    });
  }
  const adviceWave = outcome === "victory" || outcome === "retired"
    ? Math.max(1, completedWaves)
    : Math.max(1, completedWaves + 1);
  const advice = deriveResultAdvice(resolveResultWavePlan(adviceWave), outcome === "victory" ? "victory" : "defeat");
  const adviceTowers = advice.recommendedTowers.map(towerName).join(" + ");
  elements.resultAdviceTitle.textContent = text(`result_advice_${advice.category}_title` as TranslationKey);
  elements.resultAdviceBody.textContent = text(`result_advice_${advice.category}_body` as TranslationKey, {
    wave: adviceWave,
    towers: adviceTowers,
    time: formatLeaderboardDuration(result.durationMs),
  });
  elements.rewardRetry.textContent = text("reward_retry");
  elements.restartButton.textContent = text("restart");
  elements.closeHint.textContent = text(reward.mode === "server" ? "finish_pending_hint" : "close_hint");
  elements.introOverlay.hidden = true;
  elements.resultCard.focus({ preventScroll: true });
}

function createPendingRunSummary(campaign: TowerDefenseUiState["campaign"]): PendingRunSummary {
  return Object.freeze({
    lives: campaign.lives,
    kills: campaign.totalKills,
    towers: campaign.towers.length,
    heroId: campaign.hero.id,
  });
}

function resolveResultWavePlan(wave: number): WavePlan {
  try {
    return selectedSession.mode.createWave(selectedSession.level, wave);
  } catch {
    return latestUi?.nextWavePlan ?? selectedSession.mode.createWave(selectedSession.level, 1);
  }
}

function showDevelopmentResultPreview(): boolean {
  if (developmentResultPreview !== "defeat" && developmentResultPreview !== "victory") return false;
  const outcome: TerminalOutcome = developmentResultPreview === "victory" ? "victory" : "gameover";
  const finalWave = selectedSession.mode.getFinalWave(selectedSession.level);
  const completedWaves = outcome === "victory" ? (finalWave ?? 24) : Math.max(0, (finalWave ?? 24) - 1);
  const result = captureFinalResult(selectedSession.mode.calculateScore(completedWaves), 519_000);
  showResult(outcome, result, completedWaves, finalWave, Object.freeze({
    lives: outcome === "victory" ? 7 : 0,
    kills: outcome === "victory" ? 214 : 198,
    towers: 8,
    heroId: selectedHeroId,
  }));
  finishSettled = true;
  elements.rewardStatus.classList.add("is-success");
  elements.rewardStatus.textContent = text("practice");
  elements.restartButton.hidden = false;
  elements.closeHint.textContent = text("close_hint");
  return true;
}

function restorePendingFinish(): boolean {
  if (launchError) return false;
  if (checkpointResumeMismatch) return false;
  if (reward.mode !== "server" || !reward.runId) {
    if (runStarted || hasRunProgress(initialCampaign)) elements.introOverlay.hidden = true;
    return false;
  }
  const pending = pendingAtLaunch || loadPendingResult(
    storage,
    reward.runId,
    pendingScoreLimit,
    pendingWaveLimit,
    currentRunRevision(),
  );
  if (!pending) {
    if (runStarted || hasRunProgress(initialCampaign)) elements.introOverlay.hidden = true;
    return false;
  }
  terminalResult = captureFinalResult(pending.score, pending.durationMs);
  terminalSubmissionStarted = true;
  finishAuthRefreshAttempted = false;
  finishRunReplaced = false;
  replacementBootstrapCached = false;
  rewardFinisher = createRewardFinisher(reward, captureFinishSubmission(
    terminalResult.score,
    terminalResult.durationMs,
    normalizeFinishOutcome(selectedSession.mode.id, pending.outcome),
    pending.waves,
    pending.summary?.heroId ?? null,
  ), { runRevision: miniAppBootstrap?.runRevision });
  showResult(
    pending.outcome,
    terminalResult,
    pending.waves,
    selectedSession.mode.getFinalWave(selectedSession.level),
    pending.summary,
  );
  void finishReward();
  return true;
}

function showRestoredRunStatus(): void {
  if (reward.mode !== "server" || pendingAtLaunch) return;
  if (restoredCheckpoint && hasRunProgress(restoredCheckpoint)) {
    const finalWave = selectedSession.mode.getFinalWave(selectedSession.level);
    const nextWave = finalWave === null
      ? restoredCheckpoint.completedWave + 1
      : Math.min(finalWave, restoredCheckpoint.completedWave + 1);
    showToast(text("run_resumed", { wave: nextWave }));
    return;
  }
  if (miniAppBootstrap?.resumed) showToast(text("run_resume_unavailable"), true);
}

function applyPlayerProfile(profile: PlayerProfileSnapshot | null): void {
  if (!profile) return;
  const grakWasUnlocked = isHeroAvailable("grak", playerProfile);
  playerProfile = profile;
  elements.appShell.dataset.profileRevision = String(playerProfile.revision);
  elements.appShell.dataset.unlockedLevels = String(playerProfile.unlockedLevelIds.length);
  syncSessionControls();
  syncHeroChoiceControls();
  if (!grakWasUnlocked && isHeroAvailable("grak", playerProfile)) {
    showToast(text("hero_grak_unlocked"), true);
    telegram.haptic("heavy");
  }
}

async function switchPracticeSession(levelId: string, modeId: string): Promise<void> {
  if (reward.mode === "server" || elements.introOverlay.hidden || sessionSwitching || gameStarting) return;
  if (!isClientLevelReleased(levelId, previewContentEnabled)) {
    syncSessionControls();
    return;
  }
  const selectableModeId = isSelectableSession(levelId, modeId) ? modeId : CAMPAIGN_MODE_ID;
  const next = resolveSessionSelection("local", { levelId, modeId: selectableModeId });
  if (
    next.selection.levelId === selectedSession.selection.levelId
    && next.selection.modeId === selectedSession.selection.modeId
  ) return;
  sessionSwitching = true;
  syncSessionControls();
  try {
    selectedSession = next;
    writeSessionSelection(storage, next.selection);
    saveKey = buildHeroCombatPreviewSaveKey(
      getCampaignSaveKey(null, next.level.id, next.mode.id),
      isHeroCombatPreviewSessionEnabled(next.level.id, next.mode.id),
    );
    const saved = loadCampaign(storage, saveKey, next.selection);
    const mayMigrate = next.level.id === CLASSIC_CAMPAIGN_LEVEL_ID
      && next.mode.id === CAMPAIGN_MODE_ID
      && !isHeroCombatPreviewSessionEnabled(next.level.id, next.mode.id);
    const restored = saved || (mayMigrate ? migrateLegacyCampaign(storage) : null);
    runStarted = Boolean(restored);
    initialCampaign = restored || createCampaignState({
      level: next.level,
      mode: next.mode,
      heroId: selectedHeroId,
    });
    northernOnboardingStep = getNorthernOnboardingStep(initialCampaign);
    selectedHeroId = initialCampaign.hero.id;

    latestUi = null;
    renderedPreviewWave = -1;
    const previous = runtimeController.clearMounted();
    if (previous) {
      gameMounted = false;
      previous.game.destroy(true);
      await waitForRendererCleanup();
      elements.gameRoot.replaceChildren();
    }
    introReturnsToRun = hasRunProgress(initialCampaign);
    telegram.haptic("light");
  } finally {
    sessionSwitching = false;
    syncSessionControls();
    syncHeroChoiceControls();
    syncIntroAction();
  }
}

function toggleGameMenu(): void {
  if (latestUi?.paused && (latestUi.phase === "wave" || latestUi.phase === "countdown")) {
    currentScene()?.setPaused(false);
    return;
  }
  openGameMenu(false);
}

function openGameMenu(focusHeroDetails: boolean): void {
  if (
    !elements.gameMenuOverlay.hidden
    || !elements.introOverlay.hidden
    || !elements.resultOverlay.hidden
    || !latestUi
    || latestUi.phase === "gameover"
    || latestUi.phase === "victory"
  ) return;

  menuReturnFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : elements.gameMenuButton;
  const combatPhase = latestUi.phase === "wave" || latestUi.phase === "countdown";
  resumeAfterMenu = combatPhase && !latestUi.paused;
  if (combatPhase && !latestUi.paused) currentScene()?.setPaused(true);
  setAppShellBlocked(true);
  elements.gameMenuOverlay.hidden = false;
  elements.gameMenuButton.setAttribute("aria-expanded", "true");
  hideRestartConfirmation();
  syncGameMenuUi(latestUi);
  (focusHeroDetails ? elements.gameMenuHeroDetails : elements.gameMenuContinue).focus();
  telegram.haptic("light");
}

function closeGameMenu(resumeGame: boolean, restoreFocus = true): void {
  if (elements.gameMenuOverlay.hidden) return;
  elements.gameMenuOverlay.hidden = true;
  setAppShellBlocked(false);
  elements.gameMenuButton.setAttribute("aria-expanded", "false");
  hideRestartConfirmation();
  const shouldResume = resumeGame && resumeAfterMenu;
  resumeAfterMenu = false;
  if (shouldResume && latestUi?.paused) currentScene()?.setPaused(false);
  if (restoreFocus && menuReturnFocus?.isConnected) menuReturnFocus.focus();
  menuReturnFocus = null;
}

function openLeaderboard(origin: "intro" | "menu" | "result"): void {
  if (!elements.leaderboardOverlay.hidden) return;
  if (origin === "intro" && elements.introOverlay.hidden) return;
  if (origin === "menu" && elements.gameMenuOverlay.hidden) return;
  if (origin === "result" && elements.resultOverlay.hidden) return;

  leaderboardOrigin = origin;
  leaderboardReturnFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : origin === "intro"
      ? elements.introLeaderboard
      : origin === "menu" ? elements.gameMenuLeaderboard : elements.resultLeaderboard;
  leaderboardLevelId = isLeaderboardLevel(selectedSession.level.id)
    && isClientLevelReleased(selectedSession.level.id, previewContentEnabled)
    ? selectedSession.level.id
    : CLASSIC_CAMPAIGN_LEVEL_ID;
  leaderboardModeId = selectedSession.mode.id === ENDLESS_MODE_ID ? ENDLESS_MODE_ID : CAMPAIGN_MODE_ID;
  if (leaderboardModeId === ENDLESS_MODE_ID) leaderboardLevelId = CLASSIC_CAMPAIGN_LEVEL_ID;

  if (origin === "intro") {
    elements.introOverlay.hidden = true;
    elements.introLeaderboard.setAttribute("aria-expanded", "true");
  } else if (origin === "menu") {
    hideRestartConfirmation();
    elements.gameMenuOverlay.hidden = true;
    elements.gameMenuButton.setAttribute("aria-expanded", "false");
    elements.gameMenuLeaderboard.setAttribute("aria-expanded", "true");
  } else {
    elements.resultOverlay.hidden = true;
    elements.resultLeaderboard.setAttribute("aria-expanded", "true");
  }

  setAppShellBlocked(true);
  elements.leaderboardOverlay.hidden = false;
  syncLeaderboardTabs();
  elements.leaderboardClose.focus();
  telegram.haptic("light");
  void loadLeaderboard();
}

function closeLeaderboard(): void {
  if (elements.leaderboardOverlay.hidden) return;
  leaderboardRequestId += 1;
  elements.leaderboardOverlay.hidden = true;
  elements.leaderboardPanel.setAttribute("aria-busy", "false");
  elements.introLeaderboard.setAttribute("aria-expanded", "false");
  elements.gameMenuLeaderboard.setAttribute("aria-expanded", "false");
  elements.resultLeaderboard.setAttribute("aria-expanded", "false");

  const origin = leaderboardOrigin;
  const returnFocus = leaderboardReturnFocus;
  leaderboardOrigin = null;
  leaderboardReturnFocus = null;
  if (origin === "intro") {
    elements.introOverlay.hidden = false;
    setAppShellBlocked(true);
  } else if (origin === "menu") {
    elements.gameMenuOverlay.hidden = false;
    elements.gameMenuButton.setAttribute("aria-expanded", "true");
    setAppShellBlocked(true);
  } else if (origin === "result") {
    elements.resultOverlay.hidden = false;
    setAppShellBlocked(true);
  } else {
    setAppShellBlocked(false);
  }
  if (returnFocus?.isConnected) returnFocus.focus();
}

function selectLeaderboardLevel(rawLevelId: string | undefined): void {
  if (
    !rawLevelId
    || !isLeaderboardLevel(rawLevelId)
    || !isClientLevelReleased(rawLevelId, previewContentEnabled)
    || rawLevelId === leaderboardLevelId
  ) return;
  leaderboardLevelId = rawLevelId;
  if (leaderboardLevelId !== CLASSIC_CAMPAIGN_LEVEL_ID) leaderboardModeId = CAMPAIGN_MODE_ID;
  renderedLeaderboard = null;
  syncLeaderboardTabs();
  telegram.haptic("light");
  void loadLeaderboard();
}

function selectLeaderboardMode(rawModeId: string | undefined): void {
  if (
    (rawModeId !== CAMPAIGN_MODE_ID && rawModeId !== ENDLESS_MODE_ID)
    || rawModeId === leaderboardModeId
  ) return;
  leaderboardModeId = rawModeId;
  if (leaderboardModeId === ENDLESS_MODE_ID) leaderboardLevelId = CLASSIC_CAMPAIGN_LEVEL_ID;
  renderedLeaderboard = null;
  syncLeaderboardTabs();
  telegram.haptic("light");
  void loadLeaderboard();
}

function syncLeaderboardTabs(): void {
  const level = CONTENT_CATALOG.levels[leaderboardLevelId];
  elements.leaderboardTabButtons.forEach((control) => {
    const selected = control.dataset.leaderboardLevel === leaderboardLevelId;
    const levelId = control.dataset.leaderboardLevel;
    const unavailable = !levelId
      || !isClientLevelReleased(levelId, previewContentEnabled)
      || (leaderboardModeId === ENDLESS_MODE_ID && levelId !== CLASSIC_CAMPAIGN_LEVEL_ID);
    control.hidden = unavailable;
    control.disabled = unavailable;
    control.setAttribute("aria-selected", String(selected));
    control.tabIndex = selected ? 0 : -1;
  });
  elements.leaderboardModeButtons.forEach((control) => {
    const selected = control.dataset.leaderboardMode === leaderboardModeId;
    control.setAttribute("aria-selected", String(selected));
    control.tabIndex = selected ? 0 : -1;
  });
  const selectedLevelControl = elements.leaderboardTabButtons.find(
    (control) => control.dataset.leaderboardLevel === leaderboardLevelId,
  );
  const selectedModeControl = elements.leaderboardModeButtons.find(
    (control) => control.dataset.leaderboardMode === leaderboardModeId,
  );
  if (selectedLevelControl && selectedModeControl) {
    elements.leaderboardPanel.setAttribute(
      "aria-labelledby",
      `${selectedLevelControl.id} ${selectedModeControl.id}`,
    );
  }
  elements.leaderboardEyebrow.textContent = text(
    leaderboardModeId === ENDLESS_MODE_ID ? "leaderboard_eyebrow_endless" : "leaderboard_eyebrow",
  );
  const summary = leaderboardModeId === ENDLESS_MODE_ID
    ? text("leaderboard_summary_endless")
    : text("leaderboard_summary", { count: level.waves.finalWave });
  elements.leaderboardSummary.textContent = renderedLeaderboard?.levelId === leaderboardLevelId
    && renderedLeaderboard.modeId === leaderboardModeId
    ? `${summary} · ${text("leaderboard_players", { count: renderedLeaderboard.totalPlayers })}`
    : summary;
}

async function loadLeaderboard(force = false): Promise<void> {
  const requestId = ++leaderboardRequestId;
  const levelId = leaderboardLevelId;
  const modeId = leaderboardModeId;
  renderedLeaderboard = null;
  syncLeaderboardTabs();
  elements.leaderboardPanel.setAttribute("aria-busy", "true");
  elements.leaderboardStatus.hidden = false;
  elements.leaderboardStatus.classList.remove("is-error");
  elements.leaderboardStatus.textContent = text("leaderboard_loading");
  elements.leaderboardList.hidden = true;
  elements.leaderboardList.replaceChildren();
  elements.leaderboardSelf.hidden = true;
  elements.leaderboardSelf.replaceChildren();
  elements.leaderboardRetry.hidden = true;

  if (developmentLeaderboardPreview) {
    renderLeaderboard(createDevelopmentLeaderboard(levelId, modeId), requestId);
    return;
  }
  if (!leaderboardClient) {
    finishLeaderboardStatus(requestId, "leaderboard_unavailable", false);
    return;
  }

  if (force) leaderboardClient.invalidate(levelId, modeId);
  try {
    const result = await leaderboardClient.load(levelId, modeId);
    renderLeaderboard(result, requestId);
  } catch (error) {
    const authExpired = error instanceof Error && error.message === "http_401";
    finishLeaderboardStatus(
      requestId,
      authExpired ? "leaderboard_auth_expired" : "leaderboard_error",
      !authExpired,
    );
  }
}

function renderLeaderboard(result: TowerDefenseLeaderboard, requestId: number): void {
  if (!leaderboardRequestIsCurrent(requestId, result.levelId, result.modeId)) return;
  renderedLeaderboard = result;
  elements.leaderboardPanel.setAttribute("aria-busy", "false");
  syncLeaderboardTabs();
  if (result.entries.length === 0) {
    finishLeaderboardStatus(requestId, "leaderboard_empty", false);
    return;
  }

  elements.leaderboardStatus.hidden = true;
  elements.leaderboardList.hidden = false;
  elements.leaderboardList.replaceChildren(...result.entries.map((entry) => createLeaderboardRow(entry, result.maxWaves, true)));
  const ownEntryIsInList = result.entries.some((entry) => entry.isMe);
  if (result.me && !ownEntryIsInList) {
    const label = document.createElement("small");
    label.textContent = text("leaderboard_self");
    elements.leaderboardSelf.replaceChildren(label, createLeaderboardRow(result.me, result.maxWaves, false));
    elements.leaderboardSelf.hidden = false;
  } else {
    elements.leaderboardSelf.hidden = true;
    elements.leaderboardSelf.replaceChildren();
  }
}

function finishLeaderboardStatus(requestId: number, key: TranslationKey, canRetry: boolean): void {
  if (!leaderboardRequestIsCurrent(requestId, leaderboardLevelId, leaderboardModeId)) return;
  elements.leaderboardPanel.setAttribute("aria-busy", "false");
  elements.leaderboardStatus.hidden = false;
  elements.leaderboardStatus.classList.toggle("is-error", canRetry);
  elements.leaderboardStatus.textContent = text(key);
  elements.leaderboardRetry.hidden = !canRetry;
}

function createLeaderboardRow(entry: LeaderboardEntry, maxWaves: number | null, listItem: boolean): HTMLElement {
  const row = document.createElement(listItem ? "li" : "div");
  const isComplete = maxWaves !== null && entry.outcome === "victory" && entry.completedWaves === maxWaves;
  const hasHeroWins = isComplete && entry.heroWins.length > 0;
  row.className = `leaderboard-entry${isComplete ? " is-complete" : ""}${hasHeroWins ? " has-hero-wins" : ""}${entry.isMe ? " is-me" : ""}`;
  if (row instanceof HTMLLIElement) row.value = entry.rank;

  const rank = document.createElement("span");
  rank.className = "leaderboard-rank";
  rank.textContent = `#${entry.rank}`;

  const copy = document.createElement("span");
  copy.className = "leaderboard-copy";
  const name = document.createElement("strong");
  const playerName = entry.name ?? text("leaderboard_player_unknown");
  name.textContent = entry.isMe ? `${playerName} · ${text("leaderboard_you")}` : playerName;
  const duration = document.createElement("small");
  duration.textContent = formatLeaderboardDuration(entry.durationMs);
  copy.append(name, duration);

  const result = document.createElement("span");
  result.className = "leaderboard-result";
  const waves = document.createElement("strong");
  waves.textContent = maxWaves === null
    ? String(entry.completedWaves)
    : `${entry.completedWaves} / ${maxWaves}`;
  const unit = document.createElement("small");
  unit.textContent = text("leaderboard_waves");
  result.append(waves, unit);
  row.append(rank, copy);
  if (hasHeroWins) row.append(createLeaderboardHeroWins(entry.heroWins));
  else if (maxWaves === null && entry.heroId) row.append(createLeaderboardRunHero(entry.heroId));
  row.append(result);
  return row;
}

function createLeaderboardRunHero(heroId: HeroId): HTMLElement {
  const emblem = document.createElement("span");
  emblem.className = `leaderboard-run-hero ${heroId}`;
  const label = text("leaderboard_run_hero", { hero: text(`hero_${heroId}`) });
  emblem.setAttribute("role", "img");
  emblem.setAttribute("aria-label", label);
  emblem.title = label;
  const portrait = document.createElement("img");
  portrait.src = HERO_PORTRAIT_URLS[heroId];
  portrait.alt = "";
  portrait.loading = "lazy";
  emblem.append(portrait);
  return emblem;
}

function createLeaderboardHeroWins(heroWins: LeaderboardEntry["heroWins"]): HTMLElement {
  const cluster = document.createElement("span");
  cluster.className = "leaderboard-hero-wins";
  for (const heroWin of heroWins) {
    const label = text("leaderboard_hero_completions", {
      hero: text(`hero_${heroWin.heroId}`),
      count: heroWin.completions,
    });
    const medal = document.createElement("span");
    medal.className = `leaderboard-hero-medal ${heroWin.heroId}`;
    medal.setAttribute("role", "img");
    medal.setAttribute("aria-label", label);
    medal.title = label;

    const portrait = document.createElement("img");
    portrait.src = HERO_PORTRAIT_URLS[heroWin.heroId];
    portrait.alt = "";
    portrait.loading = "lazy";
    portrait.decoding = "async";
    const count = document.createElement("small");
    count.textContent = `×${heroWin.completions}`;
    medal.append(portrait, count);
    cluster.append(medal);
  }
  return cluster;
}

function formatLeaderboardDuration(durationMs: number | null): string {
  if (durationMs === null) return text("leaderboard_time_unknown");
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor(totalSeconds % 3_600 / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function leaderboardRequestIsCurrent(
  requestId: number,
  levelId: string,
  modeId: typeof CAMPAIGN_MODE_ID | typeof ENDLESS_MODE_ID,
): boolean {
  return requestId === leaderboardRequestId
    && levelId === leaderboardLevelId
    && modeId === leaderboardModeId
    && !elements.leaderboardOverlay.hidden;
}

function isLeaderboardLevel(value: string): value is typeof CLASSIC_CAMPAIGN_LEVEL_ID | typeof NORTHERN_PASS_LEVEL_ID {
  return value === CLASSIC_CAMPAIGN_LEVEL_ID || value === NORTHERN_PASS_LEVEL_ID;
}

function createDevelopmentLeaderboard(
  levelId: string,
  modeId: typeof CAMPAIGN_MODE_ID | typeof ENDLESS_MODE_ID,
): TowerDefenseLeaderboard {
  const maxWaves = modeId === ENDLESS_MODE_ID ? null : CONTENT_CATALOG.levels[levelId].waves.finalWave;
  const showcaseWave = maxWaves ?? 68;
  const values: readonly LeaderboardEntry[] = [
    { rank: 1, name: "Astralglow", outcome: modeId === ENDLESS_MODE_ID ? "defeat" : "victory", completedWaves: showcaseWave, durationMs: 381_000, heroWins: Object.freeze(modeId === ENDLESS_MODE_ID ? [] : [{ heroId: "eira", completions: 1 }]), heroId: modeId === ENDLESS_MODE_ID ? "eira" : null, isMe: false },
    { rank: 2, name: "JOKER", outcome: modeId === ENDLESS_MODE_ID ? "defeat" : "victory", completedWaves: showcaseWave, durationMs: 432_000, heroWins: Object.freeze(modeId === ENDLESS_MODE_ID ? [] : [{ heroId: "eira", completions: 2 }, { heroId: "grak", completions: 1 }]), heroId: modeId === ENDLESS_MODE_ID ? "grak" : null, isMe: false },
    { rank: 3, name: "Єнотенко", outcome: "defeat", completedWaves: showcaseWave - 1, durationMs: 449_000, heroWins: Object.freeze([]), heroId: modeId === ENDLESS_MODE_ID ? "toren" : null, isMe: false },
    { rank: 4, name: null, outcome: "defeat", completedWaves: showcaseWave - 2, durationMs: null, heroWins: Object.freeze([]), heroId: null, isMe: false },
    { rank: 5, name: "GTR_730", outcome: "defeat", completedWaves: showcaseWave - 2, durationMs: 487_000, heroWins: Object.freeze([]), heroId: modeId === ENDLESS_MODE_ID ? "eira" : null, isMe: false },
  ];
  const me: LeaderboardEntry = {
    rank: 17,
    name: "Mr.Maybik",
    outcome: "defeat",
    completedWaves: Math.max(1, showcaseWave - 3),
    durationMs: 519_000,
    heroWins: Object.freeze([]),
    heroId: modeId === ENDLESS_MODE_ID ? "toren" : null,
    isMe: true,
  };
  return Object.freeze({
    gameId: "td",
    levelId,
    modeId,
    maxWaves,
    seasonId: modeId === ENDLESS_MODE_ID ? "endless-v1" : null,
    totalPlayers: 42,
    entries: Object.freeze(values.map((entry) => Object.freeze(entry))),
    me: Object.freeze(me),
  });
}

function setGameSpeed(rawSpeed: string | undefined): void {
  const speed = rawSpeed === "2" ? 2 : rawSpeed === "1" ? 1 : null;
  if (!speed || !latestUi || latestUi.speed === speed) return;
  currentScene()?.toggleSpeed();
  telegram.haptic("light");
}

function showRestartConfirmation(): void {
  if (reward.mode === "server" && miniAppBootstrap?.runContractVersion !== 3) {
    showToast(text("game_menu_restart_unavailable"), true);
    return;
  }
  menuConfirmation = "restart";
  elements.gameMenuRestartConfirmTitle.textContent = text("game_menu_restart_confirm");
  elements.gameMenuRestartConfirmCopy.textContent = text("game_menu_restart_confirm_copy");
  elements.gameMenuRestartAccept.textContent = text("game_menu_restart_accept");
  elements.gameMenuRestartConfirm.hidden = false;
  elements.gameMenuRestartAccept.focus();
  telegram.haptic("medium");
}

function showRetireConfirmation(): void {
  if (!latestUi || terminalSubmissionStarted) return;
  menuConfirmation = "retire";
  elements.gameMenuRestartConfirmTitle.textContent = text("game_menu_retire_confirm_title");
  elements.gameMenuRestartConfirmCopy.textContent = text("game_menu_retire_confirm_copy");
  elements.gameMenuRestartAccept.textContent = text("game_menu_retire_accept");
  elements.gameMenuRestartConfirm.hidden = false;
  elements.gameMenuRestartCancel.focus();
  telegram.haptic("medium");
}

function acceptMenuConfirmation(): void {
  const action = menuConfirmation;
  hideRestartConfirmation();
  if (action === "restart") {
    enterRestartHeroSelection();
    return;
  }
  if (action === "retire") {
    const campaign = currentScene()?.getCampaign();
    if (!campaign) return;
    exitAfterTerminalSettlement = true;
    closeGameMenu(false, false);
    handleTerminal("retired", campaign);
  }
}

function hideRestartConfirmation(): void {
  elements.gameMenuRestartConfirm.hidden = true;
  menuConfirmation = null;
}

function enterRestartHeroSelection(): void {
  if (!latestUi || restartSelectionPending) return;
  resumeAfterRestartPicker = resumeAfterMenu;
  selectedHeroId = latestUi.campaign.hero.id;
  restartSelectionPending = true;
  closeGameMenu(false, false);
  setAppShellBlocked(true);
  elements.introOverlay.hidden = false;
  introReturnsToRun = false;
  syncSessionControls();
  syncIntroAction();
  openHeroPicker();
  telegram.haptic("light");
}

function cancelPendingRestart(): void {
  if (!restartSelectionPending || restartSubmitting || checkpointResumeMismatch) return;
  restartSelectionPending = false;
  selectedHeroId = currentScene()?.getCampaign().hero.id ?? initialCampaign.hero.id;
  closeHeroPicker(false);
  elements.introOverlay.hidden = true;
  setAppShellBlocked(false);
  if (resumeAfterRestartPicker && latestUi?.paused) currentScene()?.setPaused(false);
  resumeAfterRestartPicker = false;
  syncSessionControls();
  syncIntroAction();
  elements.gameMenuButton.focus();
}

function openTowerGuideFromMenu(): void {
  const resumeAfterClose = resumeAfterMenu;
  closeGameMenu(false, false);
  openTowerGuide(resumeAfterClose, elements.gameMenuButton);
}

function openSessionMenu(): void {
  if (
    reward.mode === "server"
    || launchError
    || !latestUi
    || latestUi.phase !== "setup"
    || !elements.resultOverlay.hidden
    || !elements.introOverlay.hidden
    || sessionSwitching
  ) return;
  introReturnsToRun = true;
  setAppShellBlocked(true);
  elements.introOverlay.hidden = false;
  syncIntroAction();
  syncSessionControls();
  elements.levelSelect.focus();
  telegram.haptic("light");
}

function dismissIntro(): void {
  closeHeroPicker(false);
  elements.introOverlay.hidden = true;
  setAppShellBlocked(false);
  introReturnsToRun = false;
  writeFlag(session, "td-intro-seen-v1");
  if (latestUi) syncTutorial(latestUi);
  telegram.haptic("light");
}

function openTowerGuide(resumeOverride = false, returnFocus: HTMLElement | null = null): void {
  if (!elements.towerGuideOverlay.hidden) return;
  guideReturnFocus = returnFocus
    ?? (document.activeElement instanceof HTMLElement ? document.activeElement : elements.towerGuideButton);
  const running = Boolean(latestUi && !latestUi.paused && (latestUi.phase === "wave" || latestUi.phase === "countdown"));
  resumeAfterGuide = resumeOverride || running;
  if (running) currentScene()?.setPaused(true);
  setAppShellBlocked(true);
  elements.towerGuideOverlay.hidden = false;
  elements.towerGuideButton.setAttribute("aria-expanded", "true");
  elements.towerGuideClose.focus();
  telegram.haptic("light");
}

function closeTowerGuide(): void {
  if (elements.towerGuideOverlay.hidden) return;
  elements.towerGuideOverlay.hidden = true;
  setAppShellBlocked(false);
  elements.towerGuideButton.setAttribute("aria-expanded", "false");
  if (resumeAfterGuide) currentScene()?.setPaused(false);
  resumeAfterGuide = false;
  if (guideReturnFocus?.isConnected) guideReturnFocus.focus();
  guideReturnFocus = null;
}

function openWaveIntel(): void {
  if (!latestUi || !elements.waveIntelOverlay.hidden) return;
  renderedWaveIntelPlan = latestUi.nextWavePlan;
  renderWaveIntel(renderedWaveIntelPlan);
  waveIntelReturnFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : elements.waveIntelButton;
  const running = !latestUi.paused && (latestUi.phase === "wave" || latestUi.phase === "countdown");
  resumeAfterWaveIntel = running;
  if (running) currentScene()?.setPaused(true);
  setAppShellBlocked(true);
  elements.waveIntelOverlay.hidden = false;
  elements.waveIntelButton.setAttribute("aria-expanded", "true");
  elements.waveIntelClose.focus();
  telegram.haptic("light");
}

function closeWaveIntel(): void {
  if (elements.waveIntelOverlay.hidden) return;
  elements.waveIntelOverlay.hidden = true;
  setAppShellBlocked(false);
  elements.waveIntelButton.setAttribute("aria-expanded", "false");
  if (resumeAfterWaveIntel) currentScene()?.setPaused(false);
  resumeAfterWaveIntel = false;
  if (waveIntelReturnFocus?.isConnected) waveIntelReturnFocus.focus();
  waveIntelReturnFocus = null;
}

function renderWaveIntel(plan: WavePlan): void {
  const enemies = aggregateWaveEnemies(plan);
  elements.waveIntelTitle.textContent = text("wave_intel_title", { wave: plan.wave });
  elements.waveIntelIntro.textContent = plan.northernPass
    ? text("northern_avalanche_intel", {
        zone: northernAvalancheZoneLabel(plan.northernPass.dangerZoneId),
        charges: plan.northernPass.avalancheCharges,
      })
    : text("wave_intel_intro");
  selectedWaveIntelType = enemies.some(({ type }) => type === selectedWaveIntelType)
    ? selectedWaveIntelType
    : enemies[0]?.type ?? null;
  elements.waveIntelTabs.replaceChildren(...enemies.map((enemy) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = `wave-intel-tab-${enemy.type}`;
    tab.className = "wave-intel-tab";
    tab.dataset.enemyType = enemy.type;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "wave-intel-detail");
    tab.setAttribute("aria-selected", String(enemy.type === selectedWaveIntelType));
    tab.tabIndex = enemy.type === selectedWaveIntelType ? 0 : -1;
    const glyph = document.createElement("i");
    glyph.className = `enemy-glyph ${enemy.type}`;
    glyph.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = enemyName(enemy.type);
    const count = document.createElement("small");
    count.textContent = text("wave_intel_count", { count: enemy.count });
    copy.append(name, count);
    tab.append(glyph, copy);
    tab.addEventListener("click", () => selectWaveIntelEnemy(enemy.type));
    return tab;
  }));
  if (selectedWaveIntelType) selectWaveIntelEnemy(selectedWaveIntelType);
}

function selectWaveIntelEnemy(type: EnemyType, focus = false): void {
  if (!renderedWaveIntelPlan) return;
  const enemy = aggregateWaveEnemies(renderedWaveIntelPlan).find((candidate) => candidate.type === type);
  if (!enemy) return;
  selectedWaveIntelType = type;
  elements.waveIntelTabs.querySelectorAll<HTMLButtonElement>("[role=tab]").forEach((tab) => {
    const selected = tab.dataset.enemyType === type;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  elements.waveIntelDetail.setAttribute("aria-labelledby", `wave-intel-tab-${type}`);
  elements.waveIntelGlyph.className = `enemy-glyph ${type}`;
  elements.waveIntelCount.textContent = text("wave_intel_count", { count: enemy.count });
  elements.waveIntelEnemyName.textContent = enemyName(type);
  elements.waveIntelDescription.textContent = text(`wave_intel_enemy_${type}` as TranslationKey);
  elements.waveIntelHp.textContent = formatEnemyStat(enemy, ({ maxHp }) => maxHp);
  elements.waveIntelSpeed.textContent = formatEnemyStat(enemy, ({ speed }) => speed);
  elements.waveIntelLeak.textContent = formatEnemyStat(enemy, ({ leakDamage }) => leakDamage);
  elements.waveIntelTraits.replaceChildren(...createWaveIntelTraits(enemy));

  const focusedPlan: WavePlan = Object.freeze({
    ...renderedWaveIntelPlan,
    spawns: Object.freeze(renderedWaveIntelPlan.spawns.filter((spawn) => spawn.type === type)),
  });
  const counter = recommendWaveTowers(focusedPlan, 1)[0] ?? "ranger";
  elements.waveIntelCounter.textContent = towerName(counter);
}

function formatEnemyStat(
  enemy: WaveEnemyAggregate,
  select: (variant: WaveEnemyAggregate["variants"][number]) => number,
): string {
  const values = enemy.variants.map((variant) => Math.round(select(variant))).sort((left, right) => left - right);
  return values[0] === values[values.length - 1] ? String(values[0]) : `${values[0]}–${values[values.length - 1]}`;
}

function createWaveIntelTraits(enemy: WaveEnemyAggregate): HTMLElement[] {
  const maximum = (select: (variant: WaveEnemyAggregate["variants"][number]) => number): number => (
    Math.max(...enemy.variants.map(select))
  );
  const traits: Array<readonly [TranslationKey, number]> = [];
  if (enemy.eliteCount > 0) traits.push(["wave_intel_trait_elite", enemy.eliteCount]);
  if (maximum(({ physicalResistance }) => physicalResistance) > 0) {
    traits.push(["wave_intel_trait_physical", Math.round(maximum(({ physicalResistance }) => physicalResistance) * 100)]);
  }
  if (maximum(({ magicResistance }) => magicResistance) > 0) {
    traits.push(["wave_intel_trait_magic", Math.round(maximum(({ magicResistance }) => magicResistance) * 100)]);
  }
  if (maximum(({ controlResistance }) => controlResistance) > 0) {
    traits.push(["wave_intel_trait_control", Math.round(maximum(({ controlResistance }) => controlResistance) * 100)]);
  }
  if (maximum(({ shieldRatio }) => shieldRatio) > 0) {
    traits.push(["wave_intel_trait_shield", Math.round(maximum(({ shieldRatio }) => shieldRatio) * 100)]);
  }
  if (maximum(({ frostArmorRatio }) => frostArmorRatio) > 0) {
    traits.push(["wave_intel_trait_frost_armor", Math.round(maximum(({ frostArmorRatio }) => frostArmorRatio) * 100)]);
  }
  if (maximum(({ healingRatio }) => healingRatio) > 0) {
    traits.push(["wave_intel_trait_healing", Math.round(maximum(({ healingRatio }) => healingRatio) * 100)]);
  }
  if (traits.length === 0) traits.push(["wave_intel_trait_none", 0]);
  return traits.map(([key, value]) => {
    const chip = document.createElement("span");
    chip.textContent = text(key, { count: value, value });
    return chip;
  });
}

function restartGame(): void {
  if (reward.mode === "server" && !finishSettled) return;
  clearCampaign(storage, saveKey);
  clearCampaign(storage, LEGACY_SAVE_KEY);
  if (reward.mode === "server") {
    removePendingResult(storage, reward.runId, currentRunRevision());
    // A replacement bootstrap belongs to the next run and must survive this reload.
    if (isMiniAppLaunch && !replacementBootstrapCached) clearMiniAppReward(session);
  }
  reloadPage();
}

function reloadPage(): void {
  // Preserve the checkpoint/bootstrap while bypassing only our accidental-close prompt.
  reloadRequested = true;
  window.location.reload();
}

async function resetAdminDailyAttempts(): Promise<void> {
  if (
    resettingDailyAttempts
    || !canResetDailyAttempts
    || launchError !== "daily_attempt_limit"
    || launchDecision.kind !== "miniapp"
  ) return;

  resettingDailyAttempts = true;
  syncIntroAction();
  const result = await resetMiniAppDailyAttempts(launchDecision.initData);
  if (result.ok) {
    reloadPage();
    return;
  }
  resettingDailyAttempts = false;
  showToast(text("daily_attempt_reset_failed"), true);
  syncIntroAction();
}

function showAttemptPurchaseConfirmation(): void {
  if (
    launchError !== "daily_attempt_limit"
    || !attemptPurchaseOffer
    || canResetDailyAttempts
    || attemptPurchaseState === "loading"
    || attemptPurchaseState === "success"
  ) return;
  attemptPurchaseState = "confirm";
  attemptPurchaseError = null;
  syncIntroAction();
  elements.attemptPurchaseConfirm.focus();
  telegram.haptic("light");
}

function hideAttemptPurchaseConfirmation(): void {
  if (attemptPurchaseState === "loading" || attemptPurchaseState === "success") return;
  attemptPurchaseState = "offer";
  attemptPurchaseError = null;
  syncIntroAction();
  elements.introStart.focus();
}

async function purchaseDailyAttempts(): Promise<void> {
  if (
    !attemptPurchaseOffer
    || canResetDailyAttempts
    || launchError !== "daily_attempt_limit"
    || attemptPurchaseState === "loading"
    || attemptPurchaseState === "success"
  ) return;

  attemptPurchaseState = "loading";
  attemptPurchaseError = null;
  syncIntroAction();

  if (developmentAttemptPurchasePreview && launchDecision.kind !== "miniapp") {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    attemptPurchaseState = "success";
    attemptPurchaseBalanceCrystals = Math.max(0, attemptPurchaseBalanceCrystals - attemptPurchaseOffer.priceCrystals);
    syncIntroAction();
    telegram.haptic("success");
    return;
  }

  if (launchDecision.kind !== "miniapp") {
    attemptPurchaseState = "retry";
    attemptPurchaseError = "invalid_purchase_request";
    syncIntroAction();
    telegram.haptic("error");
    return;
  }

  const requestId = getOrCreateAttemptPurchaseRequestId(session);
  if (!requestId) {
    attemptPurchaseState = "retry";
    attemptPurchaseError = "request_id_unavailable";
    syncIntroAction();
    telegram.haptic("error");
    return;
  }

  const result = await purchaseMiniAppDailyAttempts(launchDecision.initData, requestId);
  if (decideAttemptPurchaseRequestIdLifecycle(result) === "clear") {
    clearAttemptPurchaseRequestId(session);
  }
  if (result.ok) {
    attemptPurchaseBalanceCrystals = result.crystalBalance;
    attemptPurchaseState = "success";
    syncIntroAction();
    telegram.haptic("success");
    window.setTimeout(reloadPage, 850);
    return;
  }

  attemptPurchaseError = result.error;
  if (result.error === "not_enough_crystals") {
    if (result.crystalBalance !== undefined) attemptPurchaseBalanceCrystals = result.crystalBalance;
    attemptPurchaseState = "insufficient";
  } else if (result.error === "attempts_available") {
    attemptPurchaseState = "success";
    window.setTimeout(reloadPage, 650);
  } else if (result.error === "request_conflict") {
    // This key belongs to a different purchase context and is safe to replace.
    attemptPurchaseState = "retry";
  } else {
    // Ambiguous failures retain the request id so a retry can never charge twice.
    attemptPurchaseState = "retry";
  }
  syncIntroAction();
  if (attemptPurchaseState === "insufficient") elements.attemptPurchaseCancel.focus();
  telegram.haptic(attemptPurchaseState === "success" ? "success" : "error");
}

function setLocale(value: string): void {
  const selectedLocale = normalizeLocale(value);
  if (!selectedLocale || selectedLocale === locale) return;
  locale = selectedLocale;
  writeStoredLocale(storage, locale);
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
  elements.toast.classList.remove("is-visible");
  applyStaticTranslations();
  applyLaunchErrorTranslations();
  renderedPreviewWave = -1;
  if (latestUi) renderUi(latestUi);
  telegram.haptic("light");
}

function syncGameMenuUi(ui: TowerDefenseUiState | null): void {
  if (!ui) return;
  const combatPhase = ui.phase === "wave" || ui.phase === "countdown";
  elements.gameMenuTitle.textContent = text(combatPhase ? "paused" : "game_menu");
  elements.gameMenuContinue.textContent = text("game_menu_continue");
  elements.gameMenuButton.setAttribute("aria-label", text(
    combatPhase ? (ui.paused ? "game_menu_continue" : "pause") : "game_menu",
  ));
  elements.gameMenuButton.title = text("game_menu");
  elements.gameMenuSpeedButtons.forEach((control) => {
    const selected = control.dataset.menuSpeed === String(ui.speed);
    control.classList.toggle("is-active", selected);
    control.setAttribute("aria-pressed", String(selected));
  });
  elements.gameMenuSession.hidden = reward.mode === "server";
  elements.gameMenuSession.disabled = ui.phase !== "setup";
  elements.gameMenuRestart.disabled = reward.mode === "server" && miniAppBootstrap?.runContractVersion !== 3;
  elements.gameMenuRestart.title = elements.gameMenuRestart.disabled
    ? text("game_menu_restart_unavailable")
    : text("game_menu_restart");
  elements.gameMenuRetire.hidden = false;
  elements.gameMenuRetire.disabled = false;
  elements.gameMenuRetire.title = text("game_menu_retire");
  elements.gameMenuExit.hidden = true;
  renderHeroDetails(elements.gameMenuHeroDetails, ui.hero.id, ui.hero.level, ui.hero.awakened);
}

function renderHeroDetails(container: HTMLElement, heroId: HeroId, level: number, awakened = false): void {
  const emblem = container.querySelector<HTMLElement>("[data-hero-detail-emblem]");
  if (emblem) syncHeroPortrait(emblem, heroId);
  const name = container.querySelector<HTMLElement>("[data-hero-detail-name]");
  const role = container.querySelector<HTMLElement>("[data-hero-detail-role]");
  if (name) name.textContent = heroName(heroId);
  if (role) role.textContent = heroRole(heroId);
  setHeroDetailRow(container, "rank", null, text("hero_detail_rank", { count: level }));
  setHeroDetailRow(container, "attack", "hero_detail_attack", `hero_${heroId}_attack_text` as TranslationKey);
  setHeroDetailRow(container, "passive", "hero_detail_passive", `hero_${heroId}_passive_text` as TranslationKey);
  setHeroDetailRow(container, "ability", "hero_detail_ability", `hero_${heroId}_ability_text` as TranslationKey);
  setHeroDetailRow(
    container,
    "awakening",
    "hero_detail_awakening",
    awakened ? `hero_${heroId}_awakening_text` as TranslationKey : "hero_awakening_requirement",
  );
  if (!awakened) {
    const requirement = container.querySelector<HTMLElement>('[data-hero-detail="awakening"] [data-hero-detail-value]');
    if (requirement) requirement.textContent = text("hero_awakening_requirement", {
      wave: selectedSession.level.progression.awakeningWave,
    });
  }
  const awakeningRow = container.querySelector<HTMLElement>('[data-hero-detail="awakening"]');
  if (awakeningRow) awakeningRow.dataset.state = awakened ? "active" : "locked";

  const next = container.querySelector<HTMLElement>("[data-hero-detail-next]");
  if (!next) return;
  const upgradeCost = getHeroUpgradeCost(heroId, level as 1 | 2 | 3);
  next.textContent = upgradeCost === null
    ? text(awakened ? "hero_awakened" : "hero_max_rank")
    : text("hero_detail_next_upgrade", {
      rank: level + 1,
      effect: text(`hero_${heroId}_upgrade_${level + 1}` as TranslationKey),
      cost: upgradeCost,
    });
}

function setHeroDetailRow(
  container: HTMLElement,
  kind: "rank" | "attack" | "passive" | "ability" | "awakening",
  labelKey: TranslationKey | null,
  value: TranslationKey | string,
): void {
  const row = container.querySelector<HTMLElement>(`[data-hero-detail="${kind}"]`);
  if (!row) return;
  const label = row.querySelector<HTMLElement>("[data-hero-detail-label]");
  const output = row.querySelector<HTMLElement>("[data-hero-detail-value]");
  if (label && labelKey) label.textContent = text(labelKey);
  if (output) output.textContent = labelKey ? text(value as TranslationKey) : value;
}

function applyStaticTranslations(): void {
  document.documentElement.lang = locale;
  document.title = text("app_title");
  elements.languageSelects.forEach((select) => {
    select.value = locale;
    select.setAttribute("aria-label", text("language"));
  });
  elements.languageLabels.forEach((label) => {
    label.textContent = text("language");
  });
  elements.appTitle.textContent = text("app_title");
  elements.appSubtitle.textContent = text("app_subtitle");
  elements.hudRegion.setAttribute("aria-label", text("defense_status"));
  elements.gameRoot.setAttribute("aria-label", text("game_field"));
  elements.livesLabel.textContent = text("lives");
  elements.goldLabel.textContent = text("gold");
  elements.waveLabel.textContent = text("wave");
  elements.pulseLabel.textContent = heroAbilityName(selectedHeroId);
  elements.buildEyebrow.textContent = text("arsenal");
  elements.buildHint.textContent = text("build_hint");
  elements.practiceBadge.textContent = text("practice");
  elements.gameMenuEyebrow.textContent = text("app_title");
  elements.gameMenuClose.setAttribute("aria-label", text("close"));
  elements.gameMenuSpeedLabel.textContent = text("speed");
  const menuLanguageLabel = text("game_menu_language");
  const menuLanguage = elements.gameMenuOverlay.querySelector<HTMLElement>(".game-menu-language > span");
  if (menuLanguage) menuLanguage.textContent = menuLanguageLabel;
  elements.gameMenuTowerGuideLabel.textContent = text("game_menu_tower_guide");
  elements.introLeaderboardLabel.textContent = text("game_menu_leaderboard");
  elements.gameMenuLeaderboardLabel.textContent = text("game_menu_leaderboard");
  elements.gameMenuSessionLabel.textContent = text("game_menu_session");
  elements.gameMenuRestartLabel.textContent = text("game_menu_restart");
  elements.gameMenuRetireLabel.textContent = text("game_menu_retire");
  elements.gameMenuExitLabel.textContent = text("game_menu_exit");
  elements.gameMenuRestartConfirmTitle.textContent = text("game_menu_restart_confirm");
  elements.gameMenuRestartConfirmCopy.textContent = text("game_menu_restart_confirm_copy");
  elements.gameMenuRestartCancel.textContent = text("game_menu_cancel");
  elements.gameMenuRestartAccept.textContent = text("game_menu_restart_accept");
  elements.introRestartCancel.textContent = text("game_menu_cancel");
  elements.leaderboardEyebrow.textContent = text("leaderboard_eyebrow");
  elements.leaderboardTitle.textContent = text("leaderboard_title");
  elements.leaderboardClose.setAttribute("aria-label", text("close"));
  elements.leaderboardTabs.setAttribute("aria-label", text("leaderboard_level_label"));
  elements.leaderboardModeTabs.setAttribute("aria-label", text("session_mode"));
  elements.leaderboardList.setAttribute("aria-label", text("leaderboard_results_label"));
  elements.leaderboardSelf.setAttribute("aria-label", text("leaderboard_self"));
  elements.leaderboardRetry.textContent = text("leaderboard_retry");
  elements.resultLeaderboard.textContent = text("game_menu_leaderboard");
  elements.leaderboardTabButtons.forEach((control) => {
    const levelId = control.dataset.leaderboardLevel;
    if (levelId && isLeaderboardLevel(levelId)) {
      control.textContent = text(CONTENT_CATALOG.levels[levelId].displayNameKey);
    }
  });
  elements.leaderboardModeButtons.forEach((control) => {
    control.textContent = text(
      control.dataset.leaderboardMode === ENDLESS_MODE_ID ? "mode_endless" : "mode_campaign",
    );
  });
  syncLeaderboardTabs();
  syncFullscreenUi(telegram.isFullscreen);
  const guideButtonLabel = text("tower_guide_button");
  elements.towerGuideButton.setAttribute("aria-label", guideButtonLabel);
  elements.towerGuideButton.title = guideButtonLabel;
  elements.towerGuideClose.setAttribute("aria-label", text("close"));
  elements.towerGuideEyebrow.textContent = text("guide_eyebrow");
  elements.towerGuideTitle.textContent = text("guide_title");
  elements.towerGuideIntro.textContent = text("guide_intro");
  elements.towerGuideCombo.textContent = text("guide_combo");
  elements.towerGuideDone.textContent = text("guide_done");
  renderTowerGuide();
  elements.tutorialSkip.textContent = text("tutorial_skip");
  elements.waveIntelClose.setAttribute("aria-label", text("close"));
  elements.waveIntelEyebrow.textContent = text("wave_intel_eyebrow");
  elements.waveIntelIntro.textContent = text("wave_intel_intro");
  elements.waveIntelTabs.setAttribute("aria-label", text("wave_intel_tabs_label"));
  elements.waveIntelHpLabel.textContent = text("wave_intel_hp");
  elements.waveIntelSpeedLabel.textContent = text("wave_intel_speed");
  elements.waveIntelLeakLabel.textContent = text("wave_intel_leak");
  elements.waveIntelCounterLabel.textContent = text("wave_intel_counter");
  elements.waveIntelDone.textContent = text("wave_intel_done");
  if (renderedWaveIntelPlan) renderWaveIntel(renderedWaveIntelPlan);
  elements.rangerName.textContent = text("tower_ranger");
  elements.frostName.textContent = text("tower_frost");
  elements.emberName.textContent = text("tower_ember");
  elements.stormName.textContent = text("tower_storm");
  elements.towerCards.forEach((card) => {
    const type = card.dataset.tower as TowerType;
    const role = towerRole(type);
    const compactRole = card.querySelector<HTMLElement>("em");
    if (compactRole) compactRole.textContent = text(`tower_card_role_${type}` as TranslationKey);
    card.title = role;
    card.setAttribute("aria-label", `${towerName(type)}. ${role}. ${TOWER_DEFINITIONS[type].buildCost} ${text("gold")}`);
  });
  elements.nextWaveLabel.textContent = text("next_wave");
  elements.heroTargetPromptLabel.textContent = text("hero_ability_target_road");
  elements.heroTargetCancel.textContent = text("hero_ability_target_cancel");
  elements.heroChoiceLabel.textContent = text("hero_choice");
  elements.heroChoiceLock.textContent = text("hero_choice_locked");
  elements.heroPickerEyebrow.textContent = text("hero_picker_eyebrow");
  elements.heroPickerTitle.textContent = text("hero_picker_title");
  elements.heroPickerHint.textContent = text("hero_picker_hint");
  elements.heroPickerDone.textContent = text("hero_picker_done");
  elements.heroEiraName.textContent = heroName("eira");
  elements.heroEiraRole.textContent = heroRole("eira");
  elements.heroEiraAbility.textContent = heroAbilityName("eira");
  elements.heroTorenName.textContent = heroName("toren");
  elements.heroTorenRole.textContent = heroRole("toren");
  elements.heroTorenAbility.textContent = heroAbilityName("toren");
  elements.heroGrakName.textContent = heroName("grak");
  elements.heroGrakRole.textContent = heroRole("grak");
  elements.heroGrakAbility.textContent = heroAbilityName("grak");
  elements.heroGrakUnlock.querySelector("small")!.textContent = text("hero_grak_unlock_requirement");
  elements.heroPickerClose.setAttribute("aria-label", text("close"));
  elements.heroDetailsButton.setAttribute("aria-label", text("game_menu_hero_details"));
  renderHeroDetails(elements.heroPickerDetails, selectedHeroId, 1);
  if (latestUi) syncGameMenuUi(latestUi);
  syncHeroChoiceControls();
  syncIntroAction();
  syncSessionControls();
  elements.introTowers.textContent = text("intro_towers", { count: 4 });
  elements.introBosses.textContent = text("intro_bosses");
  elements.resultEyebrow.textContent = text("result_eyebrow");
  elements.resultStats.setAttribute("aria-label", text("result_stats_label"));
  elements.resultWavesLabel.textContent = text("result_stat_waves");
  elements.resultDurationLabel.textContent = text("result_stat_time");
  elements.resultKillsLabel.textContent = text("result_stat_kills");
  elements.resultAdviceEyebrow.textContent = text("result_advice_eyebrow");
  elements.closeTowerPanel.setAttribute("aria-label", text("close"));
  elements.closeHeroPanel.setAttribute("aria-label", text("close"));
  elements.speedButton.setAttribute("aria-label", text("speed"));
  elements.pulseButton.setAttribute("aria-label", text("hero_ability_ready", {
    ability: heroAbilityName(selectedHeroId),
  }));
  updateTutorialState(tutorialState);
}

function openHeroPicker(): void {
  if (elements.heroChoiceButton.disabled || elements.introOverlay.hidden) return;
  elements.introCard.classList.add("is-hero-picker-open");
  elements.heroPicker.hidden = false;
  elements.heroChoiceButton.setAttribute("aria-expanded", "true");
  elements.heroOptions.find((option) => option.dataset.heroChoice === selectedHeroId)?.focus();
  telegram.haptic("light");
}

function closeHeroPicker(restoreFocus: boolean): void {
  if (elements.heroPicker.hidden) return;
  elements.heroPicker.hidden = true;
  elements.introCard.classList.remove("is-hero-picker-open");
  elements.heroChoiceButton.setAttribute("aria-expanded", "false");
  if (restoreFocus && !elements.heroChoiceButton.disabled) elements.heroChoiceButton.focus();
}

function chooseHero(value: string): void {
  if (!isHeroId(value) || heroChoiceIsLocked()) return;
  if (!isHeroAvailable(value, playerProfile)) {
    showToast(text("hero_grak_locked"));
    telegram.haptic("medium");
    return;
  }
  selectedHeroId = value;
  if (!restartSelectionPending) {
    initialCampaign = createCampaignState({
      level: selectedSession.level,
      mode: selectedSession.mode,
      heroId: selectedHeroId,
    });
  }
  syncHeroChoiceControls();
  syncIntroAction();
  telegram.haptic("light");
}

function syncHeroChoiceControls(): void {
  if (!restartSelectionPending) {
    const campaign = latestUi?.campaign ?? initialCampaign;
    selectedHeroId = campaign.hero.id;
  }
  const locked = heroChoiceIsLocked();
  const disabled = locked || sessionSwitching || gameStarting || Boolean(launchError);
  elements.heroChoiceButton.disabled = disabled;
  elements.heroChoiceButton.setAttribute("aria-label", `${text("hero_choice")}: ${heroName(selectedHeroId)}`);
  syncHeroPortrait(elements.heroChoiceEmblem, selectedHeroId);
  elements.heroChoiceName.textContent = heroName(selectedHeroId);
  elements.heroChoiceRole.textContent = heroRole(selectedHeroId);
  elements.heroChoiceLock.hidden = !locked;
  elements.heroOptions.forEach((option) => {
    const optionHeroId = option.dataset.heroChoice;
    if (!isHeroId(optionHeroId)) return;
    const selected = optionHeroId === selectedHeroId;
    const unavailable = !isHeroAvailable(optionHeroId, playerProfile);
    option.classList.toggle("is-selected", selected);
    option.classList.toggle("is-locked", unavailable);
    option.setAttribute("aria-checked", String(selected));
    option.setAttribute("aria-disabled", String(disabled || unavailable));
    if (optionHeroId === "grak") {
      if (unavailable) option.setAttribute("aria-describedby", "hero-grak-unlock");
      else option.removeAttribute("aria-describedby");
    }
    option.disabled = disabled || unavailable;
  });
  renderHeroDetails(elements.heroPickerDetails, selectedHeroId, 1);
  if (disabled) closeHeroPicker(false);
}

function heroChoiceIsLocked(): boolean {
  if (restartSelectionPending) return false;
  return gameMounted || runStarted || hasRunProgress(latestUi?.campaign ?? initialCampaign);
}

function isHeroAvailable(heroId: HeroId, profile: PlayerProfileSnapshot | null): boolean {
  return isHeroUnlocked(heroId, profile) || (heroId === "grak" && developmentGrakPreview);
}

function syncHeroPortrait(container: HTMLElement, heroId: HeroId): void {
  container.className = `hero-emblem ${heroId}`;
  let image = container.querySelector<HTMLImageElement>("img");
  if (!image) {
    image = document.createElement("img");
    image.alt = "";
    container.replaceChildren(image);
  }
  if (image.dataset.heroPortrait === heroId) return;
  image.src = HERO_PORTRAIT_URLS[heroId];
  image.dataset.heroPortrait = heroId;
}

function syncSessionControls(): void {
  const visibleLevels = Object.values(CONTENT_CATALOG.levels).filter((level) => (
    level.id !== LEGACY_NORTHERN_PASS_LEVEL_ID
      && isClientLevelReleased(level.id, previewContentEnabled)
  ));
  elements.levelSelect.replaceChildren(...visibleLevels.map((level) => {
    const option = document.createElement("option");
    option.value = level.id;
    option.textContent = text(level.displayNameKey);
    option.disabled = isMiniAppLaunch && !playerProfile?.unlockedLevelIds.includes(level.id);
    return option;
  }));
  elements.modeSelect.replaceChildren(...Object.values(CONTENT_CATALOG.modes).map((mode) => {
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = text(mode.displayNameKey);
    option.disabled = !isSelectableSession(selectedSession.level.id, mode.id);
    return option;
  }));

  elements.levelSelect.value = selectedSession.level.id;
  elements.modeSelect.value = selectedSession.mode.id;
  elements.levelChoiceLabel.textContent = text("session_level");
  elements.modeChoiceLabel.textContent = text("session_mode");
  const endlessLocked = isMiniAppLaunch && !isSessionAvailable(
    CLASSIC_CAMPAIGN_LEVEL_ID,
    ENDLESS_MODE_ID,
    playerProfile,
  );
  elements.modeUnlockHint.hidden = !endlessLocked || selectedSession.locked;
  elements.modeUnlockHint.textContent = text("mode_endless_locked");
  elements.sessionPicker.hidden = Boolean(launchError) || selectedSession.locked;
  elements.levelSelect.disabled = selectedSession.locked || sessionSwitching || gameStarting;
  elements.modeSelect.disabled = selectedSession.locked || sessionSwitching || gameStarting;
  const finalWave = selectedSession.mode.getFinalWave(selectedSession.level);
  elements.introWaves.textContent = finalWave === null
    ? text("intro_endless")
    : text("intro_waves", { count: finalWave });
  syncMissionPreview();
  syncHeroChoiceControls();
}

function syncMissionPreview(): void {
  const northern = selectedSession.level.id === NORTHERN_PASS_LEVEL_ID;
  const prefix = northern ? "mission_northern" : "mission_forest";
  elements.missionPreview.dataset.levelTheme = northern ? NORTHERN_PASS_LEVEL_ID : CLASSIC_CAMPAIGN_LEVEL_ID;
  elements.introSigilMark.textContent = northern ? "✧" : "✦";
  elements.introMissionEyebrow.textContent = text(`${prefix}_eyebrow` as TranslationKey);
  elements.introTitle.textContent = text(`${prefix}_title` as TranslationKey);
  elements.introBody.textContent = text(`${prefix}_body` as TranslationKey);
  elements.missionMetrics.setAttribute("aria-label", text("mission_preview_label"));
  elements.missionDifficultyLabel.textContent = text("mission_difficulty_label");
  elements.missionDifficulty.textContent = text(`${prefix}_difficulty` as TranslationKey);
  elements.missionGoldLabel.textContent = text("mission_starting_gold_label");
  elements.missionGold.textContent = String(selectedSession.level.startingGold);
  elements.missionLivesLabel.textContent = text("mission_starting_lives_label");
  elements.missionLives.textContent = String(selectedSession.level.startingLives);
  elements.missionTraitLabel.textContent = text("mission_trait_label");
  elements.missionTraitTitle.textContent = text(`${prefix}_trait` as TranslationKey);
  elements.missionTraitCopy.textContent = text(`${prefix}_trait_body` as TranslationKey);
}

function isSelectableSession(levelId: string, modeId: string): boolean {
  if (!isClientLevelReleased(levelId, previewContentEnabled)) return false;
  if (isMiniAppLaunch) return isSessionAvailable(levelId, modeId, playerProfile);
  return modeId === CAMPAIGN_MODE_ID
    || (modeId === ENDLESS_MODE_ID && levelId === CLASSIC_CAMPAIGN_LEVEL_ID);
}

function hasRunProgress(campaign: TowerDefenseUiState["campaign"]): boolean {
  const level = CONTENT_CATALOG.levels[campaign.levelId];
  return campaign.completedWave > 0
    || campaign.towers.length > 0
    || campaign.totalKills > 0
    || campaign.activeDurationMs > 0
    || campaign.hero.level > 1
    || campaign.hero.anchorId !== 0
    || Boolean(level && (campaign.gold !== level.startingGold || campaign.lives !== level.startingLives));
}

function waitForRendererCleanup(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

function syncFullscreenUi(isFullscreen: boolean): void {
  const supportsFullscreen = telegram.supportsFullscreen;
  document.documentElement.classList.toggle("is-telegram-fullscreen", isFullscreen);
  elements.fullscreenButton.hidden = !supportsFullscreen;
  elements.fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
  const label = text(isFullscreen ? "fullscreen_exit" : "fullscreen_enter");
  elements.fullscreenButton.setAttribute("aria-label", label);
  elements.fullscreenButton.title = label;
  elements.gameMenuFullscreenLabel.textContent = text("game_menu_fullscreen");
}

function applyLaunchErrorTranslations(): void {
  syncMissionPreview();
  if (runtimeLoadFailed) {
    elements.introTitle.textContent = text("launch_error_title");
    elements.introBody.textContent = text("game_load_failed");
  } else if (launchError === "daily_attempt_limit") {
    elements.introTitle.textContent = text("daily_attempt_limit_title");
    elements.introBody.textContent = text(
      attemptPurchaseOffer && !canResetDailyAttempts
        ? "daily_attempt_purchase_body"
        : "daily_attempt_limit_body",
    );
  } else if (launchError) {
    elements.introTitle.textContent = text("launch_error_title");
    elements.introBody.textContent = text(
      launchError === "miniapp_start_failed" ? "miniapp_launch_error_body" : "launch_error_body",
    );
  }
  syncIntroAttemptStatus();
  syncIntroAction();
}

function syncIntroAttemptStatus(): void {
  const exhausted = launchError === "daily_attempt_limit";
  const practice = !launchError && reward.mode !== "server" && !isMiniAppLaunch;
  elements.introAttempts.classList.toggle("is-exhausted", exhausted);
  elements.introAttempts.classList.toggle("is-practice", practice);
  elements.introAttemptsLabel.textContent = text("intro_attempts_label");
  elements.introAttemptsValue.textContent = text(
    exhausted
      ? "intro_attempts_exhausted"
      : launchError
        ? "intro_attempts_unavailable"
        : practice
          ? "intro_attempts_practice"
          : "intro_attempts_rewarded",
  );
}

function syncAttemptPurchaseUi(): void {
  const visible = launchError === "daily_attempt_limit" && Boolean(attemptPurchaseOffer) && !canResetDailyAttempts;
  const confirmationVisible = visible && attemptPurchaseState !== "offer";
  elements.attemptPurchase.hidden = !visible;
  elements.attemptPurchaseConfirmation.hidden = !confirmationVisible;
  elements.introCard.classList.toggle("is-attempt-purchase-confirming", confirmationVisible);
  elements.introStart.hidden = confirmationVisible;
  if (!visible || !attemptPurchaseOffer) return;

  elements.attemptPurchaseSource.textContent = text("daily_attempt_purchase_source");
  elements.attemptPurchaseBalance.textContent = text("daily_attempt_purchase_balance", {
    balance: attemptPurchaseBalanceCrystals,
  });
  elements.attemptPurchaseEyebrow.textContent = text("daily_attempt_purchase_eyebrow");
  elements.attemptPurchaseTitle.textContent = text("daily_attempt_purchase_title");
  elements.attemptPurchaseCopy.textContent = text("daily_attempt_purchase_confirm_copy");
  elements.attemptPurchaseCancel.textContent = text("daily_attempt_purchase_cancel");
  elements.attemptPurchaseCancel.disabled = attemptPurchaseState === "loading" || attemptPurchaseState === "success";
  elements.attemptPurchaseConfirm.disabled = attemptPurchaseState === "loading"
    || attemptPurchaseState === "success"
    || (attemptPurchaseState === "insufficient" && attemptPurchaseBalanceCrystals < attemptPurchaseOffer.priceCrystals);
  elements.attemptPurchaseConfirm.setAttribute("aria-busy", String(attemptPurchaseState === "loading"));
  elements.attemptPurchaseConfirm.textContent = text(
    attemptPurchaseState === "loading"
      ? "daily_attempt_purchase_loading"
      : attemptPurchaseState === "retry"
        ? "daily_attempt_purchase_retry_action"
        : "daily_attempt_purchase_confirm",
  );

  let statusKey: TranslationKey | null = null;
  let statusClass = "";
  if (attemptPurchaseState === "loading") statusKey = "daily_attempt_purchase_loading_detail";
  if (attemptPurchaseState === "success") {
    statusKey = attemptPurchaseError === "attempts_available"
      ? "daily_attempt_purchase_available"
      : "daily_attempt_purchase_success";
    statusClass = "is-success";
  }
  if (attemptPurchaseState === "insufficient") {
    statusKey = "daily_attempt_purchase_insufficient";
    statusClass = "is-error";
  }
  if (attemptPurchaseState === "retry") {
    statusKey = attemptPurchaseError === "purchase_in_progress" || attemptPurchaseError === "profile_sync_pending"
      ? "daily_attempt_purchase_pending"
      : "daily_attempt_purchase_retry";
    statusClass = "is-error";
  }
  elements.attemptPurchaseStatus.hidden = statusKey === null;
  elements.attemptPurchaseStatus.className = `attempt-purchase-status${statusClass ? ` ${statusClass}` : ""}`;
  elements.attemptPurchaseStatus.textContent = statusKey
    ? text(statusKey, { balance: attemptPurchaseBalanceCrystals })
    : "";
}

function syncIntroAction(): void {
  syncAttemptPurchaseUi();
  elements.introStart.setAttribute("aria-busy", String(
    gameStarting || restartSubmitting || resettingDailyAttempts || attemptPurchaseState === "loading",
  ));
  elements.introRestartCancel.hidden = !restartSelectionPending;
  elements.introRestartCancel.disabled = restartSubmitting || checkpointResumeMismatch;
  elements.introLeaderboard.disabled = gameStarting || sessionSwitching;
  if (launchError === "daily_attempt_limit") {
    if (canResetDailyAttempts) {
      elements.introStart.disabled = resettingDailyAttempts;
      elements.introStart.textContent = text(
        resettingDailyAttempts ? "daily_attempt_resetting" : "daily_attempt_admin_reset_action",
      );
    } else if (attemptPurchaseOffer) {
      elements.introStart.disabled = attemptPurchaseState !== "offer";
      elements.introStart.textContent = text("daily_attempt_purchase_action");
    } else {
      elements.introStart.disabled = true;
      elements.introStart.textContent = text("daily_attempt_limit_action");
    }
    return;
  }
  elements.introStart.hidden = false;
  if (launchError === "miniapp_start_failed") {
    elements.introStart.disabled = false;
    elements.introStart.textContent = text("miniapp_launch_retry");
    return;
  }
  if (launchError) {
    elements.introStart.disabled = true;
    elements.introStart.textContent = text("launch_error_action");
    return;
  }
  if (gameStarting) {
    elements.introStart.disabled = true;
    elements.introStart.textContent = text("game_loading");
    return;
  }
  if (runtimeLoadFailed) {
    elements.introStart.disabled = false;
    elements.introStart.textContent = text("game_load_retry");
    return;
  }
  elements.introStart.disabled = sessionSwitching || restartSubmitting;
  elements.introStart.textContent = restartSelectionPending
    ? text("game_menu_restart_accept")
    : introReturnsToRun
      ? text("intro_continue")
      : text(selectedSession.level.id === NORTHERN_PASS_LEVEL_ID ? "mission_northern_cta" : "mission_forest_cta");
}

function renderTowerGuide(): void {
  elements.towerGuideGrid.replaceChildren(...TOWER_GUIDE_ENTRIES.map((entry) => {
    const card = document.createElement("article");
    card.className = `guide-tower ${entry.type}`;

    const header = document.createElement("div");
    header.className = "guide-tower-header";
    const emblem = document.createElement("span");
    emblem.className = `tower-emblem ${entry.type}`;
    emblem.setAttribute("aria-hidden", "true");
    emblem.append(document.createElement("i"));
    const copy = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = towerName(entry.type);
    const description = document.createElement("p");
    description.textContent = text(entry.descriptionKey);
    copy.append(name, description);
    header.append(emblem, copy);

    card.append(
      header,
      guideMatchup("strong", "guide_strong", entry.strongKey),
      guideMatchup("weak", "guide_weak", entry.weakKey),
    );
    return card;
  }));
}

function guideMatchup(kind: "strong" | "weak", labelKey: TranslationKey, valueKey: TranslationKey): HTMLElement {
  const row = document.createElement("p");
  row.className = `guide-matchup is-${kind}`;
  const label = document.createElement("strong");
  label.textContent = `${kind === "strong" ? "✓" : "!"} ${text(labelKey)}:`;
  row.append(label, document.createTextNode(` ${text(valueKey)}`));
  return row;
}

function towerName(type: TowerType): string {
  return text(`tower_${type}` as TranslationKey);
}

function towerRole(type: TowerType): string {
  return text(`tower_role_${type}` as TranslationKey);
}

function heroName(id: HeroId): string {
  return text(`hero_${id}` as TranslationKey);
}

function heroRole(id: HeroId): string {
  return text(`hero_${id}_role` as TranslationKey);
}

function heroAbilityName(id: HeroId): string {
  return text(`hero_${id}_ability` as TranslationKey);
}

function enemyName(type: EnemyType): string {
  return text(`enemy_${type}` as TranslationKey);
}

function text(key: TranslationKey, params: Record<string, string | number> = {}): string {
  return tr(locale as Locale, key, params);
}

function safelyCreateLeaderboardClient(initData: string): LeaderboardClient | null {
  try {
    return createLeaderboardClient(initData);
  } catch {
    return null;
  }
}

function readFlag(target: StorageLike | null, key: string): boolean {
  if (!target) return false;
  try { return target.getItem(key) === "1"; } catch { return false; }
}

function writeFlag(target: StorageLike | null, key: string): void {
  if (!target) return;
  try { target.setItem(key, "1"); } catch { /* storage is optional */ }
}

function safeStorage(key: "localStorage" | "sessionStorage"): StorageLike | null {
  try { return window[key]; } catch { return null; }
}

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing tower defense element: ${id}`);
  return element;
}

function button(id: string): HTMLButtonElement {
  const element = byId(id);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected button: ${id}`);
  return element;
}

function select(id: string): HTMLSelectElement {
  const element = byId(id);
  if (!(element instanceof HTMLSelectElement)) throw new Error(`Expected select: ${id}`);
  return element;
}
}
