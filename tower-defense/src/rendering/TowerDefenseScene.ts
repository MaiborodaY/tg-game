import Phaser from "phaser";
import { audioCuesForSimulationEvents } from "../audio/audioCues.ts";
import type { AudioCueId } from "../audio/audioCatalog.ts";
import {
  BUILD_PAD_HIT_SIZE,
  GAME_HEIGHT,
  GAME_WIDTH,
  getTowerStats,
} from "../game/config.ts";
import {
  getLevelDefinition,
  getModeRuleset,
  NORTHERN_PASS_LEVEL_ID,
  type LevelDefinition,
  type ModeRuleset,
} from "../game/content.ts";
import { getHeroAura, getHeroStats } from "../game/heroes.ts";
import { getEffectiveEnemyHeroBlockCost, getHeroCombatStats } from "../game/heroCombat.ts";
import { getMornaRankRules } from "../game/morna.ts";
import {
  createPathMetrics,
  getPointAtDistance,
  getRouteAngleAtDistance,
  projectPointToPathDistance,
} from "../game/pathing.ts";
import {
  GameSimulation,
  createSimulationRules,
  type EnemySimulationView,
  type HeroSimulationView,
  type SimulationEvent,
  type SimulationOutcome,
  type SimulationPhase,
} from "../game/simulation.ts";
import { getTower } from "../game/state.ts";
import type {
  CampaignAct,
  CampaignError,
  CampaignState,
  EnemyVariant,
  EnemyType,
  HeroId,
  NorthernAvalancheZoneId,
  Point,
  TowerPlacement,
  TowerType,
  WavePlan,
} from "../game/types.ts";
import {
  createEnemyArt,
  createBossArrivalEffect,
  createFloatingText,
  createGateHitEffect,
  createHealPulse,
  createHitBurst,
  createLightningArc,
  AVALANCHE_ZONE_HIT_SIZE,
  createAvalancheZoneArt,
  playAvalancheCollapse,
  preloadEmberMageTowerAtlas,
  sampleAvalancheRouteSegment,
  selectAvalancheMarkerPoint,
  createSummonBurst,
  createTowerArt,
  drawWorld,
  playTowerConstructionEffect,
  setAvalancheZoneAct,
  setAvalancheZoneState,
  setWorldAct,
  setWorldRoute,
  setTowerAuraMarker,
  updateEnemyArtPose,
  type EnemyArt,
  type AvalancheZoneArt,
  type TowerArt,
  type WorldArt,
} from "./art.ts";
import {
  createHeroAnchorArt,
  createHeroArt,
  createHeroEffectPool,
  moveHeroArt,
  preloadHeroBattleAtlas,
  setHeroAbilityCharge,
  setHeroAnchorState,
  setHeroArtSelected,
  setHeroFrontlineState,
  updateHeroArtPose,
  type HeroAnchorArt,
  type HeroArt,
  type HeroEffectPool,
} from "./heroArt.ts";
import {
  isHeroBattleAtlasHeroId,
  selectHeroFacing,
  type HeroFacing,
} from "./heroBattleAtlas.ts";
import {
  createMornaBattlefieldArt,
  destroyMornaBattlefieldArt,
  syncMornaBattlefieldArt,
  type MornaBattlefieldArt,
} from "./mornaBattlefieldArt.ts";
import {
  createHeroFrontlineRouteFrame,
  getHeroFrontlineBypassPose,
  getHeroFrontlineContactPose,
} from "./heroFrontlineVisuals.ts";
import { isPointWithinVisualRadius } from "./worldThemes.ts";

export type GamePhase = SimulationPhase;
export type TerminalOutcome = SimulationOutcome;
export type NoticeCode = CampaignError
  | "build_locked"
  | "hero_ability_unavailable"
  | "hero_ability_target_required"
  | "invalid_hero_ability_target"
  | "hero_awakening_unlocked"
  | "invalid_avalanche_zone"
  | "avalanche_unavailable"
  | "avalanche_empty_zone"
  | "select_pad"
  | "pulse_used";

export type TowerDefenseUiState = Readonly<{
  campaign: CampaignState;
  levelId: string;
  modeId: string;
  finalWave: number | null;
  nextWavePlan: WavePlan;
  phase: GamePhase;
  paused: boolean;
  speed: 1 | 2;
  selectedBuildType: TowerType | null;
  selectedPadId: number | null;
  selectedHero: boolean;
  hero: HeroSimulationView;
  heroAbilityAvailable: boolean;
  gateShield: number;
  heroTargeting: boolean;
  currentWave: number;
  waveProgress: number;
  enemiesAlive: number;
  totalEnemies: number;
  countdown: number;
  pulseAvailable: boolean;
  act: CampaignAct;
  threat: 1 | 2 | 3 | 4 | 5;
  boss: Readonly<{
    type: "boss" | "titan";
    tier: CampaignAct;
    hpRatio: number;
    shieldRatio: number;
    enraged: boolean;
    frostCoreExposed: boolean;
  }> | null;
  northernPass: ReturnType<GameSimulation["readView"]>["northernPass"];
}>;

export type TowerDefenseCallbacks = Readonly<{
  onUiChange(state: TowerDefenseUiState): void;
  onPersist(state: CampaignState): void;
  onNotice(code: NoticeCode): void;
  onWaveClear(wave: number, bonus: number, repairedLives: number): void;
  onTerminal(outcome: TerminalOutcome, state: CampaignState): void;
  onHaptic(kind: "light" | "medium" | "heavy" | "success" | "error"): void;
  onAudioCue(cue: AudioCueId): void;
}>;

export type TowerDefenseGameOptions = Readonly<{
  heroCombatEnabled?: boolean;
}>;

type PadView = {
  ring: Phaser.GameObjects.Arc;
  core: Phaser.GameObjects.Arc;
  rune: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
};

type TowerRenderView = {
  placement: TowerPlacement;
  art: TowerArt;
};

type EnemyRenderView = {
  type: EnemyType;
  poolKey: string;
  art: EnemyArt;
  depthBucket: number;
};

type ProjectileObject = Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;

type ProjectileRenderView = {
  towerType: TowerType;
  object: ProjectileObject;
  previousX: number;
  previousY: number;
};

type HeroRenderView = {
  id: HeroId;
  art: HeroArt;
  hitZone: Phaser.GameObjects.Zone;
};

type HeroAnchorRenderView = {
  art: HeroAnchorArt;
  hitZone: Phaser.GameObjects.Zone;
};

type AvalancheZoneRenderView = {
  art: AvalancheZoneArt;
  hitZone: Phaser.GameObjects.Zone;
};

type HeroAuraTowerHighlight = {
  ring: Phaser.GameObjects.Arc;
  badge: Phaser.GameObjects.Text;
};

type HeroBarrierRenderView = {
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Arc;
  counter: Phaser.GameObjects.Text;
};

export class TowerDefenseScene extends Phaser.Scene {
  private readonly callbacks: TowerDefenseCallbacks;
  private readonly level: LevelDefinition;
  private readonly mode: ModeRuleset;
  private readonly simulation: GameSimulation;
  private path;
  private selectedBuildType: TowerType | null;
  private selectedPadId: number | null = null;
  private selectedHero = false;
  private interactionEnabled = true;
  private heroAbilityTargeting = false;
  private readonly padViews = new Map<number, PadView>();
  private readonly towerViews = new Map<number, TowerRenderView>();
  private readonly enemyViews = new Map<number, EnemyRenderView>();
  private readonly projectileViews = new Map<number, ProjectileRenderView>();
  private readonly enemyArtPool = new Map<string, EnemyArt[]>();
  private readonly projectilePool = new Map<TowerType, ProjectileObject[]>();
  private readonly heroAnchorViews = new Map<number, HeroAnchorRenderView>();
  private readonly avalancheZoneViews = new Map<NorthernAvalancheZoneId, AvalancheZoneRenderView>();
  private avalancheRouteHighlight?: Phaser.GameObjects.Graphics;
  private avalancheRouteHighlightKey: string | null = null;
  private northernRouteVariantId: string | null = null;
  private heroView?: HeroRenderView;
  private heroEffects?: HeroEffectPool;
  private mornaBattlefieldArt?: MornaBattlefieldArt;
  private lastHeroAttackAtMs = -1_000;
  private heroFacing: HeroFacing = 1;
  private lastHeroPassivePower = Number.NaN;
  private rangePreview?: Phaser.GameObjects.Arc;
  private heroAuraPreview?: Phaser.GameObjects.Arc;
  private heroTargetPreview?: Phaser.GameObjects.Arc;
  private heroBarrierView?: HeroBarrierRenderView;
  private readonly heroAuraTowerHighlights = new Map<number, HeroAuraTowerHighlight>();
  private lastUiEmitAt = -1_000;
  private lastBurnVfxAtMs = -1_000;
  private worldArt?: WorldArt;

  constructor(
    campaign: CampaignState,
    callbacks: TowerDefenseCallbacks,
    initialBuildType?: TowerType | null,
    options: TowerDefenseGameOptions = {},
  ) {
    super({ key: "tower-defense" });
    const level = getLevelDefinition(campaign.levelId);
    const mode = getModeRuleset(campaign.modeId);
    if (!level || !mode) throw new Error("Tower Defense run references unavailable content.");
    this.callbacks = callbacks;
    this.level = level;
    this.mode = mode;
    this.simulation = new GameSimulation(campaign, createSimulationRules(level, mode, {
      heroCombat: options.heroCombatEnabled
        ? "hero-frontline-v2"
        : null,
    }));
    this.path = createPathMetrics(level.route);
    this.selectedBuildType = this.simulation.readView().phase === "setup"
      ? initialBuildType === undefined ? "ranger" : initialBuildType
      : null;
  }

  preload(): void {
    preloadHeroBattleAtlas(this, this.simulation.readView().hero.id);
    preloadEmberMageTowerAtlas(this);
  }

  create(): void {
    this.input.enabled = this.interactionEnabled;
    const initialView = this.simulation.readView();
    this.worldArt = drawWorld(this, this.level);
    if (initialView.northernPass) {
      this.applyNorthernRoute(initialView.northernPass.routePoints, initialView.northernPass.routeVariantId);
    }
    setWorldAct(this, this.worldArt, this.simulation.getCurrentWavePlan().act);
    this.heroEffects = createHeroEffectPool(this);
    this.mornaBattlefieldArt = createMornaBattlefieldArt(this);
    this.createAvalancheZones(initialView);
    this.createHeroAnchors();
    this.createBuildPads();
    this.syncTowerViews();
    this.syncRenderState();
    this.updatePadVisuals();
    this.emitUi(true);
    this.input.on("pointermove", this.handleHeroTargetPointerMove, this);
    this.input.on("pointerdown", this.handleHeroTargetPointerDown, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("pointermove", this.handleHeroTargetPointerMove, this);
      this.input.off("pointerdown", this.handleHeroTargetPointerDown, this);
      this.heroEffects?.destroy();
      this.heroEffects = undefined;
      if (this.mornaBattlefieldArt) destroyMornaBattlefieldArt(this.mornaBattlefieldArt);
      this.mornaBattlefieldArt = undefined;
      this.heroTargetPreview?.destroy();
      this.heroTargetPreview = undefined;
      this.heroBarrierView?.container.destroy(true);
      this.heroBarrierView = undefined;
    });

    const view = this.simulation.readView();
    if (view.phase === "victory" || view.phase === "gameover") {
      const outcome = view.phase;
      this.time.delayedCall(0, () => this.callbacks.onTerminal(outcome, this.simulation.getCampaign()));
    }
  }

  update(_time: number, delta: number): void {
    this.simulation.advance(delta);
    this.processSimulationEvents();
    this.syncRenderState();
    this.emitUi();
  }

  getCampaign(): CampaignState {
    return this.simulation.getCampaign();
  }

  setInputEnabled(enabled: boolean): void {
    this.interactionEnabled = enabled;
    if (this.input) this.input.enabled = enabled;
  }

  getCurrentWavePlan(): WavePlan {
    return this.simulation.getCurrentWavePlan();
  }

  getLevel(): LevelDefinition {
    return this.level;
  }

  getMode(): ModeRuleset {
    return this.mode;
  }

  setBuildType(type: TowerType | null): void {
    if (this.simulation.readView().phase !== "setup") {
      this.callbacks.onNotice("build_locked");
      return;
    }
    this.selectedHero = false;
    this.selectedBuildType = type;
    this.selectedPadId = null;
    this.updatePadVisuals();
    this.updateHeroSelectionVisuals();
    this.updateRangePreview();
    this.emitUi(true);
  }

  startWave(): boolean {
    if (!this.simulation.startWave()) return false;
    this.callbacks.onAudioCue("wave_start");
    this.selectedPadId = null;
    this.selectedHero = false;
    this.selectedBuildType = null;
    this.clearHeroAbilityTargeting();
    const view = this.simulation.readView();
    if (this.worldArt && view.wavePlan) setWorldAct(this, this.worldArt, view.wavePlan.act);
    this.processSimulationEvents();
    this.updatePadVisuals();
    this.updateHeroSelectionVisuals();
    this.updateRangePreview();
    this.emitUi(true);
    return true;
  }

  togglePause(): void {
    const view = this.simulation.readView();
    if (view.phase === "gameover" || view.phase === "victory") return;
    this.setPaused(!view.paused);
  }

  setPaused(value: boolean): void {
    const view = this.simulation.readView();
    if (view.phase === "gameover" || view.phase === "victory") return;
    if (value) this.clearHeroAbilityTargeting();
    this.simulation.setPaused(value);
    this.tweens.timeScale = value ? 0 : 1;
    this.emitUi(true);
  }

  toggleSpeed(): void {
    this.simulation.toggleSpeed();
    this.processSimulationEvents();
    this.emitUi(true);
  }

  useHeroAbility(): boolean {
    const view = this.simulation.readView();
    if (
      view.hero.id === "toren"
      && view.hero.awakened
      && view.phase === "wave"
      && !view.paused
      && view.hero.abilityCharges > 0
      && view.enemies.length > 0
    ) {
      this.heroAbilityTargeting = true;
      const target = view.enemies.reduce((furthest, enemy) => enemy.progress > furthest.progress ? enemy : furthest);
      this.updateHeroTargetPreview(projectPointToPathDistance(this.path, target));
      this.emitUi(true);
      return true;
    }
    return this.activateHeroAbility();
  }

  cancelHeroAbilityTargeting(): void {
    if (!this.heroAbilityTargeting) return;
    this.clearHeroAbilityTargeting();
    this.emitUi(true);
  }

  private activateHeroAbility(targetDistance?: number): boolean {
    const result = this.simulation.useHeroAbility(targetDistance);
    if (!result.ok) {
      const notice: NoticeCode = result.error === "invalid_phase"
        ? "build_locked"
        : result.error || "hero_ability_unavailable";
      this.callbacks.onNotice(notice);
      return false;
    }
    this.clearHeroAbilityTargeting();
    this.processSimulationEvents();
    this.syncRenderState();
    this.emitUi(true);
    return true;
  }

  usePulse(): boolean {
    return this.useHeroAbility();
  }

  upgradeHero(): boolean {
    const result = this.simulation.upgradeHero();
    if (!result.ok) {
      this.callbacks.onNotice(result.error === "invalid_phase" ? "build_locked" : result.error || "hero_upgrade_locked");
      return false;
    }
    this.processSimulationEvents();
    this.syncRenderState();
    this.updateRangePreview();
    this.emitUi(true);
    return true;
  }

  upgradeSelectedTower(): boolean {
    if (this.selectedPadId === null) {
      this.callbacks.onNotice("build_locked");
      return false;
    }
    const result = this.simulation.upgrade(this.selectedPadId);
    if (!result.ok) {
      this.callbacks.onNotice(result.error === "invalid_phase" ? "build_locked" : result.error || "insufficient_gold");
      return false;
    }
    this.processSimulationEvents();
    this.syncTowerViews();
    const upgradedTower = getTower(this.simulation.readView().campaign, this.selectedPadId);
    const upgradedView = this.towerViews.get(this.selectedPadId);
    const upgradedPoint = this.level.buildPads[this.selectedPadId];
    if (upgradedTower && upgradedView && upgradedPoint) {
      playTowerConstructionEffect(
        this,
        upgradedView.art,
        upgradedPoint,
        upgradedTower.type,
        upgradedTower.level,
        "upgrade",
      );
    }
    this.updatePadVisuals();
    this.updateRangePreview();
    this.callbacks.onHaptic("success");
    this.callbacks.onAudioCue("upgrade");
    this.emitUi(true);
    return true;
  }

  sellSelectedTower(): boolean {
    if (this.selectedPadId === null) {
      this.callbacks.onNotice("build_locked");
      return false;
    }
    const result = this.simulation.sell(this.selectedPadId);
    if (!result.ok) {
      if (result.error === "invalid_phase") this.callbacks.onNotice("build_locked");
      return false;
    }
    this.selectedPadId = null;
    this.processSimulationEvents();
    this.syncTowerViews();
    this.updatePadVisuals();
    this.updateRangePreview();
    this.callbacks.onHaptic("medium");
    this.callbacks.onAudioCue("sell");
    this.emitUi(true);
    return true;
  }

  clearSelection(): void {
    this.selectedPadId = null;
    this.selectedHero = false;
    this.updatePadVisuals();
    this.updateHeroSelectionVisuals();
    this.updateRangePreview();
    this.emitUi(true);
  }

  private createHeroAnchors(): void {
    this.simulation.getRules().heroAnchors.forEach((point, anchorId) => {
      const art = createHeroAnchorArt(this, point);
      const hitZone = this.add.zone(point.x, point.y, 64, 64)
        .setInteractive({ useHandCursor: true })
        .setDepth(2_050);
      hitZone.on("pointerdown", () => this.handleHeroAnchorClick(anchorId));
      this.heroAnchorViews.set(anchorId, { art, hitZone });
    });
  }

  private createAvalancheZones(view: ReturnType<GameSimulation["readView"]>): void {
    if (!view.northernPass) return;
    this.avalancheRouteHighlight = this.add.graphics()
      .setDepth(-15.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    view.northernPass.avalanche.zones.forEach((zone, index) => {
      const point = this.getAvalancheZonePoint(zone.startRatio, zone.endRatio);
      const art = createAvalancheZoneArt(this, point, index, this.simulation.getCurrentWavePlan().act);
      const hitZone = this.add.zone(point.x, point.y, AVALANCHE_ZONE_HIT_SIZE, AVALANCHE_ZONE_HIT_SIZE)
        .setInteractive({ useHandCursor: true })
        .setDepth(2_040);
      if (hitZone.input) hitZone.input.enabled = false;
      hitZone.on("pointerdown", () => this.handleAvalancheClick(zone.id));
      this.avalancheZoneViews.set(zone.id, { art, hitZone });
    });
  }

  private getAvalancheZonePoint(startRatio: number, endRatio: number): Point {
    return selectAvalancheMarkerPoint(
      this.path.points,
      startRatio,
      endRatio,
      [...this.level.buildPads, ...this.level.heroAnchors],
      this.level.width,
      this.level.height,
    );
  }

  private applyNorthernRoute(routePoints: readonly Point[], routeVariantId: string): void {
    this.path = createPathMetrics(routePoints);
    this.northernRouteVariantId = routeVariantId;
    if (this.worldArt) setWorldRoute(this.worldArt, routePoints);
    this.repositionAvalancheZones();
  }

  private repositionAvalancheZones(): void {
    const northernPass = this.simulation.readView().northernPass;
    if (!northernPass) return;
    for (const zone of northernPass.avalanche.zones) {
      const renderView = this.avalancheZoneViews.get(zone.id);
      if (!renderView) continue;
      const point = this.getAvalancheZonePoint(zone.startRatio, zone.endRatio);
      renderView.art.container.setPosition(point.x, point.y);
      renderView.hitZone.setPosition(point.x, point.y);
    }
  }

  private handleHeroClick(): void {
    this.selectedHero = true;
    this.selectedPadId = null;
    this.selectedBuildType = null;
    this.updatePadVisuals();
    this.updateRangePreview();
    this.updateHeroSelectionVisuals();
    this.callbacks.onHaptic("light");
    this.emitUi(true);
  }

  private handleAvalancheClick(zoneId: NorthernAvalancheZoneId): void {
    const result = this.simulation.executeCommand({ type: "trigger_northern_avalanche", zoneId });
    if (!result.ok) {
      const notice = result.error === "invalid_avalanche_zone"
        || result.error === "avalanche_empty_zone"
        || result.error === "avalanche_unavailable"
        ? result.error
        : "avalanche_unavailable";
      this.callbacks.onNotice(notice);
      this.callbacks.onHaptic("error");
      return;
    }
    this.processSimulationEvents();
    this.syncRenderState();
    this.emitUi(true);
  }

  private handleHeroAnchorClick(anchorId: number): void {
    const view = this.simulation.readView();
    if (view.phase !== "setup" || !this.selectedHero) return;
    const result = this.simulation.moveHero(anchorId);
    if (!result.ok) {
      this.callbacks.onNotice(result.error === "invalid_phase" ? "build_locked" : result.error || "invalid_hero_anchor");
      return;
    }
    this.processSimulationEvents();
    this.syncRenderState();
    this.updateHeroSelectionVisuals();
    this.updateRangePreview();
    this.emitUi(true);
  }

  private handleHeroTargetPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.heroAbilityTargeting) return;
    const distance = projectPointToPathDistance(this.path, { x: pointer.worldX, y: pointer.worldY });
    this.updateHeroTargetPreview(distance);
  }

  private handleHeroTargetPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.heroAbilityTargeting) return;
    const distance = projectPointToPathDistance(this.path, { x: pointer.worldX, y: pointer.worldY });
    this.activateHeroAbility(distance);
  }

  private updateHeroTargetPreview(distance: number): void {
    const point = getPointAtDistance(this.path, distance);
    if (!this.heroTargetPreview) {
      this.heroTargetPreview = this.add.circle(point.x, point.y, 23, 0x75d8ef, 0.12)
        .setStrokeStyle(3, 0xbffaff, 0.96)
        .setDepth(2_300);
    }
    this.heroTargetPreview.setPosition(point.x, point.y).setVisible(true);
  }

  private clearHeroAbilityTargeting(): void {
    this.heroAbilityTargeting = false;
    this.heroTargetPreview?.destroy();
    this.heroTargetPreview = undefined;
  }

  private syncHeroView(): void {
    const view = this.simulation.readView();
    const hero = view.hero;
    if (!this.heroView || this.heroView.id !== hero.id) {
      this.heroView?.hitZone.destroy();
      this.heroView?.art.container.destroy(true);
      const art = createHeroArt(this, hero.id, hero);
      const hitZone = this.add.zone(
        hero.x,
        hero.y - (hero.id === "grak" ? 7 : 0),
        hero.id === "grak" ? 82 : 62,
        hero.id === "grak" ? 88 : 68,
      )
        .setInteractive({ useHandCursor: true })
        .setDepth(2_100);
      hitZone.on("pointerdown", () => this.handleHeroClick());
      this.heroView = { id: hero.id, art, hitZone };
    }

    const attackElapsedMs = view.simulationTimeMs - this.lastHeroAttackAtMs;
    const attackProgress = attackElapsedMs >= 0 && attackElapsedMs <= 260
      ? Math.max(1, attackElapsedMs) / 260
      : 0;
    moveHeroArt(this.heroView.art, hero);
    this.heroView.art.container.setRotation(0);
    this.heroView.hitZone.setPosition(hero.x, hero.y - (hero.id === "grak" ? 7 : 0));
    if (this.heroView.hitZone.input) this.heroView.hitZone.input.enabled = hero.frontline?.status !== "knocked_out";
    updateHeroArtPose(
      this.heroView.art,
      hero.id,
      view.simulationTimeMs,
      hero.frontline?.status === "deploying",
      attackProgress,
      this.heroFacing,
    );
    setHeroFrontlineState(this.heroView.art, hero.frontline);
    const passivePower = hero.frontline?.passivePower ?? 1;
    if (passivePower !== this.lastHeroPassivePower) {
      this.lastHeroPassivePower = passivePower;
      if (this.selectedHero) this.updateRangePreview();
      else this.syncTowerAuraMarkers();
    }
    setHeroAbilityCharge(
      this.heroView.art,
      hero.maxAbilityCharges > 0 ? hero.abilityCharges / hero.maxAbilityCharges : 0,
    );
    const heroStats = getHeroStats(hero.id, hero.level);
    this.heroEffects?.setBanner(
      hero.id === "grak" && hero.bannerActive ? hero : null,
      hero.awakened ? Math.hypot(this.level.width, this.level.height) : heroStats.abilityRadius,
      hero.bannerRemainingMs,
      view.simulationTimeMs,
    );
    const markedIds = hero.markedEnemyIds.length > 0
      ? hero.markedEnemyIds
      : hero.markedEnemyId === null ? [] : [hero.markedEnemyId];
    const markedEnemies = markedIds.flatMap((id) => {
      const enemy = view.enemies.find((candidate) => candidate.id === id);
      return enemy ? [this.getEnemyRenderPoint(id, enemy)] : [];
    });
    this.heroEffects?.setMarks(markedEnemies, view.simulationTimeMs);
    this.syncHeroBarrier(hero.barrier, view.simulationTimeMs);
    this.updateHeroSelectionVisuals(view);
  }

  private syncHeroBarrier(barrier: HeroSimulationView["barrier"], simulationTimeMs: number): void {
    if (!barrier) {
      this.heroBarrierView?.container.destroy(true);
      this.heroBarrierView = undefined;
      return;
    }
    if (!this.heroBarrierView) this.heroBarrierView = this.createHeroBarrierView();
    const view = this.heroBarrierView;
    const angle = getRouteAngleAtDistance(this.path, barrier.progress);
    const pulse = (Math.sin(simulationTimeMs * 0.009) + 1) * 0.5;
    view.container
      .setPosition(barrier.x, barrier.y)
      .setRotation(angle)
      .setAlpha(0.76 + pulse * 0.2)
      .setDepth(barrier.y + 50);
    view.glow.setAlpha(0.08 + pulse * 0.08);
    view.counter
      .setText(`${barrier.capturedCount}/${barrier.capacity}`)
      .setRotation(-angle)
      .setVisible(barrier.capturedCount > 0);
  }

  private createHeroBarrierView(): HeroBarrierRenderView {
    const container = this.add.container(0, 0);
    const glow = this.add.circle(0, 0, 29, 0x75d8ef, 0.12).setStrokeStyle(2, 0xbffaff, 0.76);
    const body = this.add.graphics();
    body.fillStyle(0x254b45, 0.98);
    body.lineStyle(2, 0xbffaff, 0.92);
    body.fillRoundedRect(-8, -35, 16, 70, 4);
    body.strokeRoundedRect(-8, -35, 16, 70, 4);
    body.lineStyle(3, 0xe3c46c, 0.9);
    body.lineBetween(-4, -27, 4, -19);
    body.lineBetween(4, -19, -4, -11);
    body.lineBetween(-4, 0, 4, 8);
    body.lineBetween(4, 8, -4, 16);
    const counter = this.add.text(0, -43, "", {
      color: "#dffeff",
      backgroundColor: "#173f3b",
      fontFamily: "Arial, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    container.add([glow, body, counter]);
    return { container, glow, counter };
  }

  private updateHeroSelectionVisuals(view = this.simulation.readView()): void {
    if (this.heroView) setHeroArtSelected(this.heroView.art, this.selectedHero);
    const anchorsAvailable = this.selectedHero && view.phase === "setup";
    for (const [anchorId, anchor] of this.heroAnchorViews) {
      const state = anchorsAvailable
        ? anchorId === view.hero.anchorId ? "selected" : "available"
        : "hidden";
      setHeroAnchorState(anchor.art, state);
      if (anchor.hitZone.input) anchor.hitZone.input.enabled = anchorsAvailable && anchorId !== view.hero.anchorId;
    }
  }

  private syncNorthernPassVisuals(view: ReturnType<GameSimulation["readView"]>): void {
    const northernPass = view.northernPass;
    if (!northernPass) return;
    if (this.northernRouteVariantId !== northernPass.routeVariantId) {
      this.applyNorthernRoute(northernPass.routePoints, northernPass.routeVariantId);
    }
    const act = (view.wavePlan ?? this.simulation.getCurrentWavePlan()).act;
    const avalanche = northernPass.avalanche;
    this.drawAvalancheRouteHighlight(northernPass);
    const interactive = view.phase === "wave"
      && !view.paused
      && avalanche.available
      && avalanche.chargesRemaining > 0;
    for (const zone of avalanche.zones) {
      const renderView = this.avalancheZoneViews.get(zone.id);
      if (!renderView) continue;
      const state = avalanche.chargesRemaining <= 0
        ? "spent"
        : zone.id === northernPass.forecastDangerZoneId && zone.canTrigger ? "armed" : "available";
      setAvalancheZoneAct(renderView.art, act);
      setAvalancheZoneState(renderView.art, state);
      renderView.art.container.setAlpha(
        avalanche.chargesRemaining <= 0 || zone.id === northernPass.forecastDangerZoneId ? 1 : 0.46,
      );
      if (renderView.hitZone.input) {
        renderView.hitZone.input.enabled = interactive && zone.id === northernPass.forecastDangerZoneId;
      }
    }
  }

  private drawAvalancheRouteHighlight(
    northernPass: NonNullable<ReturnType<GameSimulation["readView"]>["northernPass"]>,
  ): void {
    const graphics = this.avalancheRouteHighlight;
    if (!graphics) return;
    const available = northernPass.avalanche.chargesRemaining > 0;
    const zone = northernPass.avalanche.zones.find((candidate) => (
      candidate.id === northernPass.forecastDangerZoneId
    ));
    const renderKey = `${northernPass.routeVariantId}:${northernPass.forecastDangerZoneId}:${zone?.canTrigger === true}:${available}`;
    if (renderKey === this.avalancheRouteHighlightKey) return;
    this.avalancheRouteHighlightKey = renderKey;
    graphics.clear();
    if (!available || !zone) return;
    const points = sampleAvalancheRouteSegment(this.path.points, zone.startRatio, zone.endRatio);
    const armed = zone.canTrigger;
    const color = armed ? 0xffd47c : 0x8ee9f1;
    const stroke = (width: number, alpha: number) => {
      graphics.lineStyle(width, color, alpha).beginPath().moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        graphics.lineTo(points[index].x, points[index].y);
      }
      graphics.strokePath();
    };
    stroke(12, armed ? 0.2 : 0.1);
    stroke(2.5, armed ? 0.82 : 0.52);
    const last = points[points.length - 1] ?? points[0];
    graphics.fillStyle(color, armed ? 0.88 : 0.62)
      .fillCircle(points[0].x, points[0].y, 4)
      .fillCircle(last.x, last.y, 4);
  }

  private createBuildPads(): void {
    const northern = this.level.id === NORTHERN_PASS_LEVEL_ID;
    this.level.buildPads.forEach((point, padId) => {
      const foundation = this.add.graphics().setDepth(point.y + 4);
      foundation.fillStyle(northern ? 0x081923 : 0x071613, northern ? 0.62 : 0.48)
        .fillEllipse(point.x, point.y + 4, 47, 24);
      for (let stone = 0; stone < 8; stone += 1) {
        const angle = (Math.PI * 2 * stone) / 8 + (padId % 3) * 0.08;
        const radius = stone % 2 === 0 ? 19 : 18;
        const x = point.x + Math.cos(angle) * radius;
        const y = point.y + Math.sin(angle) * radius * 0.72;
        const stoneColor = northern
          ? stone % 3 === 0 ? 0x66869a : 0x344f62
          : stone % 3 === 0 ? 0x52675c : 0x344a42;
        foundation.fillStyle(stoneColor, northern ? 0.84 : 0.78)
          .fillEllipse(x, y, stone % 2 === 0 ? 9 : 8, 6);
        foundation.fillStyle(northern ? 0xc0e8f1 : 0x8ba08f, northern ? 0.27 : 0.2)
          .fillEllipse(x - 1, y - 1, 5, 2.4);
      }
      const ring = this.add.circle(point.x, point.y, 18, northern ? 0x102c3a : 0x0d2521, 0.62)
        .setStrokeStyle(2, northern ? 0x8bcbd8 : 0x6f8a79, northern ? 0.56 : 0.48)
        .setDepth(point.y + 5);
      const core = this.add.circle(point.x, point.y, 11.5, northern ? 0x24566a : 0x214a3b, 0.34)
        .setStrokeStyle(1, northern ? 0xc6eff4 : 0xa8c795, northern ? 0.34 : 0.25)
        .setDepth(point.y + 6);
      const rune = this.add.text(point.x, point.y - 1, northern ? "❄" : "✦", {
        color: northern ? "#c9f4f7" : "#a9d9ad",
        fontFamily: "Georgia, serif",
        fontSize: "14px",
      }).setOrigin(0.5).setAlpha(0.58).setDepth(point.y + 7);
      const zone = this.add.zone(point.x, point.y, BUILD_PAD_HIT_SIZE, BUILD_PAD_HIT_SIZE)
        .setInteractive({ useHandCursor: true })
        .setDepth(2_000);
      zone.on("pointerdown", () => this.handlePadClick(padId));
      this.padViews.set(padId, { ring, core, rune, zone });
    });
  }

  private handlePadClick(padId: number): void {
    if (this.simulation.readView().phase !== "setup") {
      this.callbacks.onNotice("build_locked");
      return;
    }
    this.selectedHero = false;
    this.updateHeroSelectionVisuals();
    this.updatePadVisuals();
    this.updateRangePreview();
    const tower = getTower(this.simulation.readView().campaign, padId);
    if (tower) {
      this.selectedPadId = padId;
      this.selectedBuildType = null;
      this.callbacks.onHaptic("light");
      this.updatePadVisuals();
      this.updateRangePreview();
      this.emitUi(true);
      return;
    }
    if (!this.selectedBuildType) {
      this.callbacks.onNotice("select_pad");
      return;
    }
    const result = this.simulation.build(padId, this.selectedBuildType);
    if (!result.ok) {
      this.callbacks.onNotice(result.error === "invalid_phase" ? "build_locked" : result.error || "insufficient_gold");
      this.shakePad(padId);
      return;
    }
    this.selectedPadId = padId;
    this.selectedBuildType = null;
    this.processSimulationEvents();
    this.syncTowerViews();
    const builtTower = getTower(this.simulation.readView().campaign, padId);
    const builtView = this.towerViews.get(padId);
    const builtPoint = this.level.buildPads[padId];
    if (builtTower && builtView && builtPoint) {
      playTowerConstructionEffect(this, builtView.art, builtPoint, builtTower.type, builtTower.level, "build");
    }
    this.updatePadVisuals();
    this.updateRangePreview();
    this.callbacks.onHaptic("success");
    this.callbacks.onAudioCue("build");
    this.emitUi(true);
  }

  private syncTowerViews(): void {
    for (const runtime of this.towerViews.values()) runtime.art.container.destroy(true);
    this.towerViews.clear();
    for (const placement of this.simulation.readView().campaign.towers) {
      const point = this.level.buildPads[placement.padId];
      if (!point) continue;
      const art = createTowerArt(this, placement.type, placement.level, point);
      this.towerViews.set(placement.padId, { placement, art });
    }
    this.syncTowerAuraMarkers();
  }

  private updatePadVisuals(): void {
    const viewState = this.simulation.readView();
    const heroPlacementActive = this.selectedHero && viewState.phase === "setup";
    const northern = this.level.id === NORTHERN_PASS_LEVEL_ID;
    for (const [padId, view] of this.padViews) {
      const tower = getTower(viewState.campaign, padId);
      const selected = this.selectedPadId === padId;
      const buildable = !tower && viewState.phase === "setup" && this.selectedBuildType !== null;
      this.tweens.killTweensOf(view.rune);
      view.rune.setScale(1);
      if (heroPlacementActive) {
        if (northern) {
          view.ring.setFillStyle(0x091b25, tower ? 0.12 : 0.28);
          view.ring.setStrokeStyle(1, 0x527b8e, tower ? 0.08 : 0.24);
        } else {
          view.ring.setFillStyle(0x071713, tower ? 0.12 : 0.28);
          view.ring.setStrokeStyle(1, 0x49685c, tower ? 0.08 : 0.24);
        }
        view.core.setAlpha(tower ? 0.03 : 0.13);
        view.rune.setAlpha(tower ? 0 : 0.11);
        continue;
      }
      if (northern) {
        view.ring.setFillStyle(selected ? 0x4a4b57 : buildable ? 0x245f71 : 0x102c3a, selected ? 0.94 : buildable ? 0.82 : 0.58);
        view.ring.setStrokeStyle(selected ? 3 : 2, selected ? 0xffd78b : buildable ? 0x9ceaf0 : 0x759daf, selected ? 1 : buildable ? 0.84 : 0.5);
        view.core.setAlpha(tower ? 0.06 : buildable ? 0.8 : 0.36);
        view.rune.setAlpha(tower ? 0 : buildable ? 0.98 : 0.46);
        if (buildable) this.tweens.add({ targets: view.rune, scale: 1.16, duration: 520, yoyo: true, repeat: 1 });
        continue;
      }
      view.ring.setFillStyle(selected ? 0x57472b : buildable ? 0x1f594a : 0x0d2521, selected ? 0.94 : buildable ? 0.82 : 0.54);
      view.ring.setStrokeStyle(selected ? 3 : 2, selected ? 0xf0d77d : buildable ? 0x75e3bd : 0x6f8a79, selected ? 1 : buildable ? 0.78 : 0.42);
      view.core.setAlpha(tower ? 0.06 : buildable ? 0.76 : 0.3);
      view.rune.setAlpha(tower ? 0 : buildable ? 0.94 : 0.34);
      if (buildable) this.tweens.add({ targets: view.rune, scale: 1.16, duration: 520, yoyo: true, repeat: 1 });
    }
  }

  private updateRangePreview(): void {
    this.rangePreview?.destroy();
    this.rangePreview = undefined;
    this.heroAuraPreview?.destroy();
    this.heroAuraPreview = undefined;
    for (const highlight of this.heroAuraTowerHighlights.values()) {
      highlight.ring.destroy();
      highlight.badge.destroy();
    }
    this.heroAuraTowerHighlights.clear();
    this.syncTowerAuraMarkers();
    const view = this.simulation.readView();
    if (this.selectedHero) {
      const stats = getHeroStats(view.hero.id, view.hero.level);
      const attackRange = view.hero.frontline
        ? getHeroCombatStats(view.hero.id, view.hero.level).attackRange
        : stats.attackRange;
      const passivePower = view.hero.frontline?.passivePower ?? 1;
      this.rangePreview = this.add.circle(view.hero.x, view.hero.y, attackRange, 0x7be8c5, 0.025)
        .setStrokeStyle(1, 0x8debd0, 0.58)
        .setDepth(3);
      if (view.hero.id === "morna" && view.hero.morna) {
        const harvestRadius = getMornaRankRules(view.hero.level).harvestRadius;
        this.rangePreview.setFillStyle(0x76518c, 0.018).setStrokeStyle(1.5, 0xbb9bd1, 0.72);
        this.heroAuraPreview = this.add.circle(view.hero.x, view.hero.y, harvestRadius, 0x59e1d2, 0.045)
          .setStrokeStyle(3, 0x7ff7e9, 0.9)
          .setDepth(2);
        return;
      }
      const aura = getHeroAura(view.hero.id, view.hero.level);
      if (!aura) return;
      const auraColor = aura.kind === "tower_damage"
        ? 0xf1cc69
        : aura.kind === "tower_attack_speed"
          ? 0xff8a45
          : 0x75d8ef;
      this.heroAuraPreview = this.add.circle(view.hero.x, view.hero.y, aura.radius, auraColor, 0.02 + passivePower * 0.025)
        .setStrokeStyle(3, auraColor, 0.28 + passivePower * 0.6)
        .setDepth(2);
      if (aura.kind !== "slow" && passivePower > 0) {
        this.highlightAuraTowers(
          view.campaign.towers,
          aura.radius,
          aura.strength * passivePower,
          aura.kind,
        );
      }
      return;
    }
    if (this.selectedPadId === null) return;
    const tower = getTower(view.campaign, this.selectedPadId);
    if (!tower) return;
    const point = this.level.buildPads[tower.padId];
    if (!point) return;
    const stats = getTowerStats(tower.type, tower.level);
    this.rangePreview = this.add.circle(point.x, point.y, stats.range, 0x7be8c5, 0.055)
      .setStrokeStyle(2, 0x8debd0, 0.48)
      .setDepth(3);
  }

  private highlightAuraTowers(
    towers: readonly TowerPlacement[],
    radius: number,
    strength: number,
    kind: "tower_damage" | "tower_attack_speed",
  ): void {
    const hero = this.simulation.readView().hero;
    const radiusSquared = radius ** 2;
    const bonus = Math.round(strength * 100);
    const color = kind === "tower_attack_speed" ? 0xff8a45 : 0xf1cc69;
    const stroke = kind === "tower_attack_speed" ? 0xffad68 : 0xf5d77f;
    const textColor = kind === "tower_attack_speed" ? "#ffe0bf" : "#fff1b6";
    const backgroundColor = kind === "tower_attack_speed" ? "#55291d" : "#493a20";
    for (const tower of towers) {
      const point = this.level.buildPads[tower.padId];
      if (!point) continue;
      const dx = point.x - hero.x;
      const dy = point.y - hero.y;
      if (dx * dx + dy * dy > radiusSquared) continue;
      const ring = this.add.circle(point.x, point.y, 24, color, 0.09)
        .setStrokeStyle(3, stroke, 0.92)
        .setDepth(point.y + 44);
      const badge = this.add.text(point.x, point.y - 29, `+${bonus}%`, {
        color: textColor,
        backgroundColor,
        fontFamily: "Arial, sans-serif",
        fontSize: "9px",
        fontStyle: "bold",
        padding: { x: 3, y: 1 },
        stroke: "#20352b",
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(2_200);
      this.heroAuraTowerHighlights.set(tower.padId, { ring, badge });
    }
  }

  private syncTowerAuraMarkers(): void {
    const view = this.simulation.readView();
    const aura = getHeroAura(view.hero.id, view.hero.level);
    const passivePower = view.hero.frontline?.passivePower ?? 1;
    const towerAuraKind = aura?.kind === "tower_damage" || aura?.kind === "tower_attack_speed" ? aura.kind : null;
    for (const [padId, towerView] of this.towerViews) {
      const point = this.level.buildPads[padId];
      if (
        !aura
        || !towerAuraKind
        || passivePower <= 0
        || !point
        || !isPointWithinVisualRadius(point, view.hero, aura.radius)
      ) {
        setTowerAuraMarker(towerView.art, null);
        continue;
      }
      setTowerAuraMarker(towerView.art, towerAuraKind, this.selectedHero);
    }
  }

  private shakePad(padId: number): void {
    const view = this.padViews.get(padId);
    if (!view) return;
    this.tweens.add({ targets: [view.ring, view.core, view.rune], x: "+=4", duration: 45, yoyo: true, repeat: 3 });
    this.callbacks.onHaptic("error");
  }

  private processSimulationEvents(): void {
    const events = this.simulation.drainEvents();
    for (const cue of audioCuesForSimulationEvents(events)) this.callbacks.onAudioCue(cue);
    for (const event of events) this.processSimulationEvent(event);
  }

  private processSimulationEvent(event: SimulationEvent): void {
    if (event.type === "persist") {
      this.callbacks.onPersist(event.campaign);
      return;
    }
    if (event.type === "haptic") {
      this.callbacks.onHaptic(event.kind);
      return;
    }
    if (event.type === "northern_route_changed") {
      this.applyNorthernRoute(event.routePoints, event.routeVariantId);
      return;
    }
    if (event.type === "northern_avalanche") {
      const zone = this.avalancheZoneViews.get(event.zoneId);
      if (zone) playAvalancheCollapse(this, zone.art);
      for (const impact of event.impacts.slice(0, 8)) {
        const point = this.getEnemyRenderPoint(impact.enemyId, impact);
        createHitBurst(this, point.x, point.y, 0xdffaff, impact.boss ? 32 : 24, 3);
        if (impact.frostArmorRemoved > 0) {
          createFloatingText(
            this,
            point.x,
            point.y - 22,
            `-${Math.round(impact.frostArmorRemoved)}`,
            "#e6fdff",
          );
        }
      }
      this.cameras.main.shake(210, 0.006);
      this.callbacks.onHaptic("heavy");
      return;
    }
    if (event.type === "boss_spawned") {
      const boss = this.simulation.readView().enemies.find((enemy) => enemy.type === "boss" || enemy.type === "titan");
      if (boss) createBossArrivalEffect(this, boss, boss.bossTier, this.worldArt?.themeId);
      this.cameras.main.shake(320, 0.008);
      return;
    }
    if (event.type === "pulse") {
      const pulse = this.add.circle(this.level.width / 2, this.level.height / 2, 18, 0x72e6c2, 0.08)
        .setStrokeStyle(4, 0x8ff5dc, 0.9)
        .setDepth(1_200);
      this.tweens.add({
        targets: pulse,
        radius: this.level.width * 0.68,
        alpha: 0,
        duration: 520,
        ease: "Quad.Out",
        onComplete: () => pulse.destroy(),
      });
      this.cameras.main.flash(180, 105, 232, 204, false);
      return;
    }
    if (event.type === "hero_attack") {
      this.lastHeroAttackAtMs = this.simulation.readView().simulationTimeMs;
      const from = this.heroView
        ? { x: this.heroView.art.container.x, y: this.heroView.art.container.y }
        : event.from;
      const target = this.getEnemyRenderPoint(event.targetId, event.to);
      if (isHeroBattleAtlasHeroId(event.heroId)) {
        this.heroFacing = selectHeroFacing(from.x, target.x, this.heroFacing);
      }
      this.heroEffects?.playAttack(event.heroId, from, target);
      return;
    }
    if (event.type === "morna_summon_raised") {
      this.heroEffects?.playAbility("morna", event, event.kind === "colossus" ? 38 : 24);
      if (event.kind === "colossus") {
        this.cameras.main.shake(220, 0.006);
        this.cameras.main.flash(150, 90, 225, 210, false);
      }
      return;
    }
    if (event.type === "morna_summon_attack") {
      const target = this.getEnemyRenderPoint(event.targetId, event.to);
      this.heroEffects?.playAttack("morna", event.from, target);
      if (event.radius > 0) createHitBurst(this, target.x, target.y, 0x6fe8dc, event.radius, 2);
      return;
    }
    if (event.type === "enemy_attacked_morna_summon") {
      createFloatingText(this, event.x, event.y - 28, `-${event.damage}`, "#ffad96");
      createHitBurst(this, event.x, event.y - 5, 0xd66c55, 14, 2);
      return;
    }
    if (event.type === "morna_summon_destroyed") {
      if (event.reason !== "wave_end" && event.reason !== "run_end") {
        const combatLoss = event.reason === "defeated" || event.reason === "major_hold";
        createHitBurst(this, event.x, event.y, combatLoss ? 0x75e3d5 : 0x809995, event.kind === "colossus" ? 34 : 22, 3);
        if (event.kind === "colossus" && combatLoss) this.cameras.main.shake(180, 0.005);
      }
      return;
    }
    if (event.type === "enemy_attacked_hero") {
      const hero = this.simulation.readView().hero;
      const passing = event.attackKind === "passing";
      createFloatingText(this, hero.x, hero.y - 34, `-${event.damage}`, passing ? "#ffd08a" : "#ff9d86");
      if (event.armorDamage > 0) {
        createFloatingText(this, hero.x, hero.y - 45, `⛨ −${event.armorDamage}`, "#f0ce83");
      }
      createHitBurst(this, hero.x, hero.y - 6, passing ? 0xe7bd68 : 0xd66c55, passing ? 14 : 18, 2);
      return;
    }
    if (event.type === "hero_knocked_out") {
      this.cameras.main.shake(180, 0.005);
      createHitBurst(this, event.x, event.y, 0xd66c55, 34, 4);
      return;
    }
    if (event.type === "hero_respawned") {
      this.heroEffects?.playAbility(this.simulation.readView().hero.id, event, 30);
      return;
    }
    if (event.type === "hero_frontline_arrived") {
      createHitBurst(this, event.x, event.y + 5, 0xe7bd68, 18, 2);
      return;
    }
    if (event.type === "hero_moved") {
      this.syncHeroView();
      return;
    }
    if (event.type === "hero_upgraded") {
      const hero = this.simulation.readView().hero;
      this.heroEffects?.playAbility(event.heroId, hero, 34 + event.level * 3);
      this.cameras.main.flash(150, 226, 196, 104, false);
      if (hero.awakened) this.callbacks.onNotice("hero_awakening_unlocked");
      return;
    }
    if (event.type === "hero_ability") {
      const target = event.targetId === null
        ? null
        : this.simulation.readView().enemies.find((enemy) => enemy.id === event.targetId);
      const point = target
        ? this.getEnemyRenderPoint(target.id, target)
        : event.targetPoint;
      const radius = event.heroId === "eira" ? 28 : event.radius;
      this.heroEffects?.playAbility(event.heroId, point, radius);
      if (event.heroId === "toren") this.cameras.main.shake(190, 0.005);
      else if (event.heroId === "grak") {
        this.cameras.main.shake(230, 0.006);
        this.cameras.main.flash(170, 229, 111, 50, false);
      } else this.cameras.main.flash(130, 215, 195, 92, false);
      return;
    }
    if (event.type === "hero_ability_recharged") {
      const hero = this.simulation.readView().hero;
      this.heroEffects?.playAbility(event.heroId, hero, 30);
      createFloatingText(this, hero.x, hero.y - 34, `+${event.charges}`, "#f5d77f");
      return;
    }
    if (event.type === "hero_barrier_created") {
      this.heroEffects?.playAbility("toren", event, event.radius);
      this.cameras.main.shake(130, 0.0035);
      return;
    }
    if (event.type === "hero_barrier_blocked") {
      createFloatingText(this, event.x, event.y - 24, "✦", "#bffaff");
      return;
    }
    if (event.type === "gate_shield_absorbed") {
      const gate = this.level.route[this.level.route.length - 1];
      if (gate) createFloatingText(this, gate.x, gate.y - 30, `◇ −${event.amount}`, "#bffaff");
      this.cameras.main.flash(100, 117, 216, 239, false);
      return;
    }
    if (event.type === "enemy_healed") {
      const caster = this.simulation.readView().enemies.find((enemy) => enemy.id === event.casterId);
      if (caster) createHealPulse(this, this.getEnemyRenderPoint(caster.id, caster));
      for (const target of event.targets) {
        const point = this.getEnemyRenderPoint(target.id, target);
        createFloatingText(this, point.x, point.y - 18, `+${Math.ceil(target.amount)}`, "#9effbc");
      }
      return;
    }
    if (event.type === "enemy_damaged") {
      const point = this.getEnemyRenderPoint(event.enemyId, event);
      const damageColor = event.frostAbsorbed > 0
        ? "#d7fbff"
        : event.absorbed > 0 ? "#bcefff" : "#fff1bd";
      createFloatingText(this, point.x, point.y - 15, `${Math.round(event.damage)}`, damageColor);
      return;
    }
    if (event.type === "frost_armor_broken") {
      const point = this.getEnemyRenderPoint(event.enemyId, event);
      createHitBurst(this, point.x, point.y, 0xb9f6ff, 30, 4);
      createFloatingText(this, point.x, point.y - 25, "❄", "#e1fcff");
      return;
    }
    if (event.type === "boss_core_exposed") {
      const point = this.getEnemyRenderPoint(event.enemyId, event);
      createHitBurst(this, point.x, point.y, 0xffc766, 42, 6);
      createFloatingText(this, point.x, point.y - 30, "×2", "#ffe6a3");
      this.cameras.main.flash(120, 255, 194, 92, false);
      return;
    }
    if (event.type === "projectile_hit") {
      const color = projectileColor(event.towerType);
      const point = this.getEnemyRenderPoint(event.targetId, event);
      createHitBurst(this, point.x, point.y, color, event.radius, event.towerType === "ranger" ? 0 : event.major ? 3 : 2);
      return;
    }
    if (event.type === "lightning") {
      createLightningArc(
        this,
        this.getEnemyRenderPoint(event.fromId, event.from),
        this.getEnemyRenderPoint(event.toId, event.to),
        event.intensity,
      );
      return;
    }
    if (event.type === "titan_summon") {
      createSummonBurst(this, event);
      return;
    }
    if (event.type === "enemy_killed") {
      let renderView = this.enemyViews.get(event.enemyId);
      if (renderView) {
        this.enemyViews.delete(event.enemyId);
      } else {
        renderView = this.acquireEnemyArtByAppearance(
          event.enemyType,
          event.x,
          event.y,
          event.elite,
          event.bossTier,
          event.shielded,
          event.enemyVariant,
          event.frostArmored,
        );
      }
      if (event.reward > 0) {
        createFloatingText(
          this,
          renderView.art.container.x,
          renderView.art.container.y - 2,
          `+${event.reward}`,
          "#ffd86c",
        );
      }
      this.tweens.add({
        targets: renderView.art.container,
        alpha: 0,
        scale: 1.45,
        duration: 230,
        onComplete: () => this.releaseEnemyArt(renderView),
      });
      return;
    }
    if (event.type === "enemy_leaked") {
      const renderView = this.enemyViews.get(event.enemyId);
      if (renderView) {
        this.enemyViews.delete(event.enemyId);
        this.releaseEnemyArt(renderView);
      }
      if (event.damage > 0) {
        if (this.worldArt) createGateHitEffect(this, this.worldArt, event.damage);
        this.cameras.main.shake(170, 0.006);
      }
      return;
    }
    if (event.type === "wave_cleared") {
      this.selectedHero = false;
      this.selectedBuildType = "ranger";
      this.clearHeroAbilityTargeting();
      this.callbacks.onWaveClear(event.wave, event.bonus, event.repairedLives);
      const view = this.simulation.readView();
      if (this.worldArt && view.phase === "setup") setWorldAct(this, this.worldArt, this.simulation.getCurrentWavePlan().act);
      this.updatePadVisuals();
      return;
    }
    if (event.type === "terminal") this.handleTerminalEvent(event.outcome, event.campaign);
  }

  private handleTerminalEvent(outcome: TerminalOutcome, campaign: CampaignState): void {
    this.tweens.timeScale = 1;
    this.clearHeroAbilityTargeting();
    this.releaseAllProjectiles();
    if (outcome === "gameover") {
      this.releaseAllEnemies();
      this.cameras.main.fade(480, 17, 16, 22, false);
    } else {
      this.cameras.main.flash(420, 235, 205, 112, false);
    }
    this.emitUi(true);
    this.callbacks.onTerminal(outcome, campaign);
  }

  private syncRenderState(): void {
    const view = this.simulation.readView();
    this.syncNorthernPassVisuals(view);
    this.syncEnemyViews(view.enemies, view.hero, view.simulationTimeMs);
    this.syncHeroView();
    if (this.mornaBattlefieldArt) {
      syncMornaBattlefieldArt(this.mornaBattlefieldArt, view.hero.morna, view.simulationTimeMs);
    }
    this.syncProjectileViews(view.projectiles, view.enemies);
  }

  private syncEnemyViews(
    enemies: readonly EnemySimulationView[],
    hero: HeroSimulationView,
    simulationTimeMs: number,
  ): void {
    const liveIds = new Set<number>();
    const frontline = hero.frontline;
    const frontlinePresent = Boolean(frontline && (frontline.status === "holding" || frontline.status === "fighting"));
    const frame = frontline ? createHeroFrontlineRouteFrame(this.path, frontline.progress) : null;
    const blockedSlots = new Map(frontline?.blockedEnemyIds.map((enemyId, index) => [enemyId, index]) ?? []);
    const blockedCount = blockedSlots.size;
    for (const enemy of enemies) {
      liveIds.add(enemy.id);
      let renderView = this.enemyViews.get(enemy.id);
      if (!renderView) {
        renderView = this.acquireEnemyArt(enemy);
        this.enemyViews.set(enemy.id, renderView);
      }
      const { art } = renderView;
      let renderX = enemy.x;
      let renderY = enemy.y;
      let renderRotation = getRouteAngleAtDistance(this.path, enemy.progress) * 0.03;
      if (frame && blockedSlots.has(enemy.id)) {
        const pose = getHeroFrontlineContactPose(
          frame,
          enemy.type,
          blockedSlots.get(enemy.id) ?? 0,
          blockedCount,
        );
        renderX = pose.x;
        renderY = pose.y;
        renderRotation = frame.angle * 0.03;
      } else if (frame && frontline && frontlinePresent && !enemy.blocked) {
        const bypassStart = frontline.progress - 32;
        const bypassEnd = frontline.progress + 34;
        const remainingCapacity = Math.max(0, frontline.blockCapacity - frontline.blockUsed);
        const cannotJoinContact = enemy.progress >= frontline.progress
          || getEffectiveEnemyHeroBlockCost(enemy.type, frontline.blockCapacity) > remainingCapacity;
        if (cannotJoinContact && enemy.progress >= bypassStart && enemy.progress <= bypassEnd) {
          const pose = getHeroFrontlineBypassPose(frame, enemy.id, enemy.type, {
            kind: "overflow",
            progress: (enemy.progress - bypassStart) / (bypassEnd - bypassStart),
          });
          renderX = pose.x;
          renderY = pose.y;
          renderRotation = frame.angle * 0.03 + (pose.rotation - frame.angle);
        }
      }
      art.container.setPosition(renderX, renderY).setRotation(renderRotation);
      const depthBucket = Math.floor(renderY / 4);
      if (depthBucket !== renderView.depthBucket) {
        renderView.depthBucket = depthBucket;
        art.container.setDepth(renderY + 30);
      }
      updateEnemyArtPose(
        art,
        enemy.type,
        simulationTimeMs,
        enemy.progress,
        enemy.id,
        !enemy.stunned && !enemy.blocked,
        enemy.enraged,
      );
      art.healthFill.scaleX = Math.max(0, enemy.hp / enemy.maxHp);
      const damaged = enemy.hp < enemy.maxHp
        || enemy.shield < enemy.maxShield
        || enemy.frostArmor < enemy.maxFrostArmor;
      const major = enemy.type === "boss" || enemy.type === "titan";
      art.healthBack.setAlpha(major || damaged ? 1 : 0);
      art.healthFill.setAlpha(major || damaged ? 1 : 0);
      const frostArmorActive = enemy.maxFrostArmor > 0 && enemy.frostArmor > 0;
      const protectionRatio = frostArmorActive
        ? Math.max(0, enemy.frostArmor / enemy.maxFrostArmor)
        : enemy.maxShield > 0 ? Math.max(0, enemy.shield / enemy.maxShield) : 0;
      art.shieldFill
        .setFillStyle(frostArmorActive ? 0xb4f4ff : 0x77dff2, 0.95)
        .setScale(protectionRatio, 1)
        .setAlpha(protectionRatio > 0 ? 0.95 : 0);
      const statusActive = enemy.stunned || enemy.slowed || enemy.frostCoreExposed;
      art.statusRing.setAlpha(statusActive ? 0.78 : 0)
        .setStrokeStyle(
          enemy.frostCoreExposed ? 3 : 2,
          enemy.frostCoreExposed ? 0xffc766 : enemy.stunned ? 0x77f3d5 : 0x78dff6,
          statusActive ? 0.9 : 0,
        );
      if (enemy.burning && simulationTimeMs - this.lastBurnVfxAtMs >= 85 && Math.random() < 0.22) {
        this.lastBurnVfxAtMs = simulationTimeMs;
        const ember = this.add.circle(renderX + (Math.random() * 8 - 4), renderY - 7, 2, 0xff9e5c, 0.88).setDepth(1_000);
        this.tweens.add({ targets: ember, y: ember.y - 11, alpha: 0, duration: 310, onComplete: () => ember.destroy() });
      }
    }

    for (const [enemyId, renderView] of this.enemyViews) {
      if (liveIds.has(enemyId)) continue;
      this.enemyViews.delete(enemyId);
      this.releaseEnemyArt(renderView);
    }
  }

  private acquireEnemyArt(enemy: EnemySimulationView): EnemyRenderView {
    return this.acquireEnemyArtByAppearance(
      enemy.type,
      enemy.x,
      enemy.y,
      enemy.elite,
      enemy.bossTier,
      enemy.maxShield > 0,
      enemy.variant,
      enemy.maxFrostArmor > 0,
    );
  }

  private getEnemyRenderPoint(enemyId: number, fallback: Point): Point {
    const container = this.enemyViews.get(enemyId)?.art.container;
    return container?.visible
      ? { x: container.x, y: container.y }
      : fallback;
  }

  private acquireEnemyArtByAppearance(
    type: EnemyType,
    x: number,
    y: number,
    elite: boolean,
    bossTier: CampaignAct,
    shielded: boolean,
    variant: EnemyVariant,
    frostArmored: boolean,
  ): EnemyRenderView {
    const poolKey = `${type}:${elite ? 1 : 0}:${bossTier}:${shielded ? 1 : 0}:${variant}:${frostArmored ? 1 : 0}`;
    const pool = this.enemyArtPool.get(poolKey);
    const art = pool?.pop() ?? createEnemyArt(this, type, { x, y }, {
      elite,
      bossTier,
      shielded: shielded || frostArmored,
      frostArmored,
      variant,
    });
    art.container.setActive(true).setVisible(true).setAlpha(1).setScale(1).setRotation(0).setPosition(x, y);
    art.shieldFill
      .setFillStyle(frostArmored ? 0xb4f4ff : 0x77dff2, 0.95)
      .setScale(1, 1)
      .setAlpha(shielded || frostArmored ? 0.95 : 0);
    return { type, poolKey, art, depthBucket: Number.NaN };
  }

  private releaseEnemyArt(view: EnemyRenderView): void {
    this.tweens.killTweensOf(view.art.container);
    view.art.container.setVisible(false).setActive(false).setAlpha(1).setScale(1).setRotation(0);
    const pool = this.enemyArtPool.get(view.poolKey) ?? [];
    pool.push(view.art);
    this.enemyArtPool.set(view.poolKey, pool);
  }

  private releaseAllEnemies(): void {
    for (const view of this.enemyViews.values()) this.releaseEnemyArt(view);
    this.enemyViews.clear();
  }

  private syncProjectileViews(projectiles: readonly Readonly<{
    id: number;
    x: number;
    y: number;
    originPadId: number;
    targetId: number;
    towerType: TowerType;
  }>[], enemies: readonly EnemySimulationView[]): void {
    const liveIds = new Set<number>();
    for (const projectile of projectiles) {
      liveIds.add(projectile.id);
      const target = enemies.find((enemy) => enemy.id === projectile.targetId);
      const targetArt = this.enemyViews.get(projectile.targetId)?.art.container;
      const distanceToTarget = target
        ? Math.hypot(target.x - projectile.x, target.y - projectile.y)
        : Number.POSITIVE_INFINITY;
      const visualBlend = target && targetArt?.visible
        ? Math.max(0, Math.min(1, 1 - distanceToTarget / 90))
        : 0;
      const renderX = projectile.x + (target && targetArt ? targetArt.x - target.x : 0) * visualBlend;
      const renderY = projectile.y + (target && targetArt ? targetArt.y - target.y : 0) * visualBlend;
      let view = this.projectileViews.get(projectile.id);
      if (!view) {
        const object = this.acquireProjectile(projectile.towerType, renderX, renderY);
        view = { towerType: projectile.towerType, object, previousX: renderX, previousY: renderY };
        this.projectileViews.set(projectile.id, view);
        const tower = this.towerViews.get(projectile.originPadId);
        const origin = this.level.buildPads[projectile.originPadId];
        if (
          target
          && targetArt
          && tower
          && origin
          && tower.placement.type !== "frost"
          && tower.placement.type !== "ember"
        ) {
          tower.art.head.setRotation(Math.atan2(targetArt.y - origin.y, targetArt.x - origin.x));
        }
        if (targetArt) object.setRotation(Math.atan2(targetArt.y - renderY, targetArt.x - renderX));
      }
      const dx = renderX - view.previousX;
      const dy = renderY - view.previousY;
      view.object.setPosition(renderX, renderY);
      if (dx !== 0 || dy !== 0) view.object.setRotation(Math.atan2(dy, dx));
      view.previousX = renderX;
      view.previousY = renderY;
    }

    for (const [projectileId, view] of this.projectileViews) {
      if (liveIds.has(projectileId)) continue;
      this.projectileViews.delete(projectileId);
      this.releaseProjectile(view);
    }
  }

  private acquireProjectile(towerType: TowerType, x: number, y: number): ProjectileObject {
    const pool = this.projectilePool.get(towerType);
    const object = pool?.pop() ?? this.createProjectileObject(towerType, x, y);
    object.setActive(true).setVisible(true).setAlpha(1).setScale(1).setPosition(x, y).setDepth(1_000);
    return object;
  }

  private createProjectileObject(towerType: TowerType, x: number, y: number): ProjectileObject {
    if (towerType === "ranger") return this.add.rectangle(x, y, 15, 3, 0xf6dfa0);
    if (towerType === "frost") return this.add.circle(x, y, 5, 0x8cecf4, 0.95).setStrokeStyle(2, 0xe2ffff, 0.82);
    if (towerType === "ember") return this.add.circle(x, y, 7, 0xff7545, 0.96).setStrokeStyle(2, 0xffd36f, 0.9);
    return this.add.rectangle(x, y, 9, 9, 0xc9f8ff, 0.96).setStrokeStyle(2, 0x66d8ed, 0.9);
  }

  private releaseProjectile(view: ProjectileRenderView): void {
    view.object.setVisible(false).setActive(false).setRotation(0);
    const pool = this.projectilePool.get(view.towerType) ?? [];
    pool.push(view.object);
    this.projectilePool.set(view.towerType, pool);
  }

  private releaseAllProjectiles(): void {
    for (const view of this.projectileViews.values()) this.releaseProjectile(view);
    this.projectileViews.clear();
  }

  private emitUi(force = false): void {
    const now = this.time.now;
    if (!force && now - this.lastUiEmitAt < 100) return;
    this.lastUiEmitAt = now;
    const view = this.simulation.readView();
    const plan = view.wavePlan || this.simulation.getCurrentWavePlan();
    const boss = view.enemies.find((enemy) => enemy.type === "boss" || enemy.type === "titan");
    const finalWave = this.mode.getFinalWave(this.level);
    const currentWave = finalWave === null ? view.currentWave : Math.min(finalWave, view.currentWave);
    this.callbacks.onUiChange(Object.freeze({
      campaign: view.campaign,
      levelId: this.level.id,
      modeId: this.mode.id,
      finalWave,
      nextWavePlan: plan,
      phase: view.phase,
      paused: view.paused,
      speed: view.speed,
      selectedBuildType: this.selectedBuildType,
      selectedPadId: this.selectedPadId,
      selectedHero: this.selectedHero,
      hero: view.hero,
      heroAbilityAvailable: view.heroAbilityAvailable,
      gateShield: view.gateShield,
      heroTargeting: this.heroAbilityTargeting,
      currentWave,
      waveProgress: view.phase === "setup"
        ? 0
        : view.waveTotalCount > 0
          ? Math.min(1, view.waveResolvedCount / view.waveTotalCount)
          : 0,
      enemiesAlive: view.enemies.length,
      totalEnemies: view.phase === "setup" ? plan.spawns.length : view.waveTotalCount,
      countdown: Math.ceil(view.countdownRemainingMs / 1_000),
      pulseAvailable: view.pulseAvailable,
      act: plan.act,
      threat: plan.threat,
      northernPass: view.northernPass,
      boss: boss && (boss.type === "boss" || boss.type === "titan")
        ? Object.freeze({
            type: boss.type,
            tier: boss.bossTier,
            hpRatio: Math.max(0, boss.hp / boss.maxHp),
            shieldRatio: boss.maxShield + boss.maxFrostArmor > 0
              ? Math.max(0, (boss.shield + boss.frostArmor) / (boss.maxShield + boss.maxFrostArmor))
              : 0,
            enraged: boss.enraged,
            frostCoreExposed: boss.frostCoreExposed,
          })
        : null,
    }));
  }
}

export const TOWER_DEFENSE_GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#102a27",
  transparent: false,
  render: {
    antialias: true,
    antialiasGL: true,
    roundPixels: true,
    powerPreference: "high-performance",
  },
  fps: {
    target: 60,
    min: 24,
    smoothStep: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export function createTowerDefenseGame(
  parent: HTMLElement,
  campaign: CampaignState,
  callbacks: TowerDefenseCallbacks,
  initialBuildType?: TowerType | null,
  options: TowerDefenseGameOptions = {},
): Readonly<{ game: Phaser.Game; scene: TowerDefenseScene }> {
  const level = getLevelDefinition(campaign.levelId);
  const scene = new TowerDefenseScene(campaign, callbacks, initialBuildType, options);
  const game = new Phaser.Game({
    ...TOWER_DEFENSE_GAME_CONFIG,
    width: level?.width ?? GAME_WIDTH,
    height: level?.height ?? GAME_HEIGHT,
    parent,
    scene,
  });
  return Object.freeze({ game, scene });
}

function projectileColor(towerType: TowerType): number {
  if (towerType === "ranger") return 0xf5d887;
  if (towerType === "frost") return 0x7ceaf2;
  if (towerType === "storm") return 0xbcefff;
  return 0xff8050;
}
