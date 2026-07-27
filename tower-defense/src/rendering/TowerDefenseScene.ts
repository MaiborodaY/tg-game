import Phaser from "phaser";
import {
  BUILD_PAD_HIT_SIZE,
  GAME_HEIGHT,
  GAME_WIDTH,
  MAX_TOWER_LEVEL,
  MASTERY_UNLOCK_WAVE,
  TOWER_DEFINITIONS,
  getTowerStats,
  getTowerTotalInvestment,
} from "../game/config.ts";
import {
  getLevelDefinition,
  getModeRuleset,
  type LevelDefinition,
  type ModeRuleset,
} from "../game/content.ts";
import { createPathMetrics, getRouteAngleAtDistance } from "../game/pathing.ts";
import {
  GameSimulation,
  createSimulationRules,
  type EnemySimulationView,
  type SimulationEvent,
  type SimulationOutcome,
  type SimulationPhase,
} from "../game/simulation.ts";
import { getTower } from "../game/state.ts";
import type {
  CampaignAct,
  CampaignError,
  CampaignState,
  EnemyType,
  TowerPlacement,
  TowerStats,
  TowerType,
  WavePlan,
} from "../game/types.ts";
import {
  createEnemyArt,
  createFloatingText,
  createGateHitEffect,
  createHealPulse,
  createHitBurst,
  createLightningArc,
  createSummonBurst,
  createTowerArt,
  drawWorld,
  setWorldAct,
  updateEnemyArtPose,
  type EnemyArt,
  type TowerArt,
  type WorldArt,
} from "./art.ts";

export type GamePhase = SimulationPhase;
export type TerminalOutcome = SimulationOutcome;
export type NoticeCode = CampaignError | "build_locked" | "select_pad" | "pulse_used";

export type TowerDefenseUiState = Readonly<{
  campaign: CampaignState;
  levelId: string;
  modeId: string;
  finalWave: number | null;
  phase: GamePhase;
  paused: boolean;
  speed: 1 | 2;
  selectedBuildType: TowerType | null;
  selectedPadId: number | null;
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
  }> | null;
}>;

export type TowerDefenseCallbacks = Readonly<{
  onUiChange(state: TowerDefenseUiState): void;
  onPersist(state: CampaignState): void;
  onNotice(code: NoticeCode): void;
  onWaveClear(wave: number, bonus: number, repairedLives: number): void;
  onTerminal(outcome: TerminalOutcome, state: CampaignState): void;
  onHaptic(kind: "light" | "medium" | "heavy" | "success" | "error"): void;
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

export class TowerDefenseScene extends Phaser.Scene {
  private readonly callbacks: TowerDefenseCallbacks;
  private readonly level: LevelDefinition;
  private readonly mode: ModeRuleset;
  private readonly simulation: GameSimulation;
  private readonly path;
  private selectedBuildType: TowerType | null;
  private selectedPadId: number | null = null;
  private readonly padViews = new Map<number, PadView>();
  private readonly towerViews = new Map<number, TowerRenderView>();
  private readonly enemyViews = new Map<number, EnemyRenderView>();
  private readonly projectileViews = new Map<number, ProjectileRenderView>();
  private readonly enemyArtPool = new Map<string, EnemyArt[]>();
  private readonly projectilePool = new Map<TowerType, ProjectileObject[]>();
  private rangePreview?: Phaser.GameObjects.Arc;
  private lastUiEmitAt = -1_000;
  private lastBurnVfxAtMs = -1_000;
  private worldArt?: WorldArt;

  constructor(campaign: CampaignState, callbacks: TowerDefenseCallbacks) {
    super({ key: "tower-defense" });
    const level = getLevelDefinition(campaign.levelId);
    const mode = getModeRuleset(campaign.modeId);
    if (!level || !mode) throw new Error("Tower Defense run references unavailable content.");
    this.callbacks = callbacks;
    this.level = level;
    this.mode = mode;
    this.simulation = new GameSimulation(campaign, createSimulationRules(level, mode));
    this.path = createPathMetrics(level.route);
    this.selectedBuildType = this.simulation.readView().phase === "setup" ? "ranger" : null;
  }

  create(): void {
    this.worldArt = drawWorld(this, this.level);
    setWorldAct(this, this.worldArt, this.simulation.getCurrentWavePlan().act);
    this.createBuildPads();
    this.syncTowerViews();
    this.syncRenderState();
    this.updatePadVisuals();
    this.emitUi(true);

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
    this.selectedBuildType = type;
    this.selectedPadId = null;
    this.updatePadVisuals();
    this.updateRangePreview();
    this.emitUi(true);
  }

  startWave(): boolean {
    if (!this.simulation.startWave()) return false;
    this.selectedPadId = null;
    this.selectedBuildType = null;
    const view = this.simulation.readView();
    if (this.worldArt && view.wavePlan) setWorldAct(this, this.worldArt, view.wavePlan.act);
    this.processSimulationEvents();
    this.updatePadVisuals();
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
    this.simulation.setPaused(value);
    this.tweens.timeScale = value ? 0 : 1;
    this.emitUi(true);
  }

  toggleSpeed(): void {
    this.simulation.toggleSpeed();
    this.processSimulationEvents();
    this.emitUi(true);
  }

  usePulse(): boolean {
    const result = this.simulation.usePulse();
    if (!result.ok) {
      this.callbacks.onNotice("pulse_used");
      return false;
    }
    this.processSimulationEvents();
    this.syncRenderState();
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
    this.updatePadVisuals();
    this.updateRangePreview();
    this.callbacks.onHaptic("success");
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
    this.emitUi(true);
    return true;
  }

  clearSelection(): void {
    this.selectedPadId = null;
    this.updatePadVisuals();
    this.updateRangePreview();
    this.emitUi(true);
  }

  private createBuildPads(): void {
    this.level.buildPads.forEach((point, padId) => {
      const ring = this.add.circle(point.x, point.y, 20, 0x0d2521, 0.82)
        .setStrokeStyle(2, 0x5f8b77, 0.62)
        .setDepth(point.y + 5);
      const core = this.add.circle(point.x, point.y, 13, 0x214a3b, 0.45)
        .setStrokeStyle(1, 0x9bc98d, 0.34)
        .setDepth(point.y + 6);
      const rune = this.add.text(point.x, point.y - 1, "✦", {
        color: "#a9d9ad",
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
    this.updatePadVisuals();
    this.updateRangePreview();
    this.callbacks.onHaptic("success");
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
  }

  private updatePadVisuals(): void {
    const viewState = this.simulation.readView();
    for (const [padId, view] of this.padViews) {
      const tower = getTower(viewState.campaign, padId);
      const selected = this.selectedPadId === padId;
      const buildable = !tower && viewState.phase === "setup" && this.selectedBuildType !== null;
      view.ring.setFillStyle(selected ? 0x376e5a : buildable ? 0x1f594a : 0x0d2521, selected ? 0.94 : 0.78);
      view.ring.setStrokeStyle(selected ? 3 : 2, selected ? 0xf0d77d : buildable ? 0x75e3bd : 0x5f8b77, selected ? 1 : 0.64);
      view.core.setAlpha(tower ? 0.1 : buildable ? 0.72 : 0.42);
      view.rune.setAlpha(tower ? 0 : buildable ? 0.92 : 0.48);
      this.tweens.killTweensOf(view.rune);
      view.rune.setScale(1);
      if (buildable) this.tweens.add({ targets: view.rune, scale: 1.16, duration: 520, yoyo: true, repeat: 1 });
    }
  }

  private updateRangePreview(): void {
    this.rangePreview?.destroy();
    this.rangePreview = undefined;
    if (this.selectedPadId === null) return;
    const tower = getTower(this.simulation.readView().campaign, this.selectedPadId);
    if (!tower) return;
    const point = this.level.buildPads[tower.padId];
    if (!point) return;
    const stats = getTowerStats(tower.type, tower.level);
    this.rangePreview = this.add.circle(point.x, point.y, stats.range, 0x7be8c5, 0.055)
      .setStrokeStyle(2, 0x8debd0, 0.48)
      .setDepth(3);
  }

  private shakePad(padId: number): void {
    const view = this.padViews.get(padId);
    if (!view) return;
    this.tweens.add({ targets: [view.ring, view.core, view.rune], x: "+=4", duration: 45, yoyo: true, repeat: 3 });
    this.callbacks.onHaptic("error");
  }

  private processSimulationEvents(): void {
    for (const event of this.simulation.drainEvents()) this.processSimulationEvent(event);
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
    if (event.type === "boss_spawned") {
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
    if (event.type === "enemy_healed") {
      const caster = this.simulation.readView().enemies.find((enemy) => enemy.id === event.casterId);
      if (caster) createHealPulse(this, caster);
      for (const target of event.targets) {
        createFloatingText(this, target.x, target.y - 18, `+${Math.ceil(target.amount)}`, "#9effbc");
      }
      return;
    }
    if (event.type === "enemy_damaged") {
      createFloatingText(this, event.x, event.y - 15, `${Math.round(event.damage)}`, event.absorbed > 0 ? "#bcefff" : "#fff1bd");
      return;
    }
    if (event.type === "projectile_hit") {
      const color = projectileColor(event.towerType);
      createHitBurst(this, event.x, event.y, color, event.radius, event.towerType === "ranger" ? 0 : event.major ? 3 : 2);
      return;
    }
    if (event.type === "lightning") {
      createLightningArc(this, event.from, event.to, event.intensity);
      return;
    }
    if (event.type === "titan_summon") {
      createSummonBurst(this, event);
      return;
    }
    if (event.type === "enemy_killed") {
      if (event.reward > 0) createFloatingText(this, event.x, event.y - 2, `+${event.reward}`, "#ffd86c");
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
      if (this.worldArt) createGateHitEffect(this, this.worldArt, event.damage);
      this.cameras.main.shake(170, 0.006);
      return;
    }
    if (event.type === "wave_cleared") {
      this.selectedBuildType = "ranger";
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
    this.syncEnemyViews(view.enemies, view.simulationTimeMs);
    this.syncProjectileViews(view.projectiles);
  }

  private syncEnemyViews(enemies: readonly EnemySimulationView[], simulationTimeMs: number): void {
    const liveIds = new Set<number>();
    for (const enemy of enemies) {
      liveIds.add(enemy.id);
      let renderView = this.enemyViews.get(enemy.id);
      if (!renderView) {
        renderView = this.acquireEnemyArt(enemy);
        this.enemyViews.set(enemy.id, renderView);
      }
      const { art } = renderView;
      art.container.setPosition(enemy.x, enemy.y).setRotation(getRouteAngleAtDistance(this.path, enemy.progress) * 0.03);
      const depthBucket = Math.floor(enemy.y / 4);
      if (depthBucket !== renderView.depthBucket) {
        renderView.depthBucket = depthBucket;
        art.container.setDepth(enemy.y + 30);
      }
      updateEnemyArtPose(art, enemy.type, simulationTimeMs, enemy.progress, enemy.id, !enemy.stunned, enemy.enraged);
      art.healthFill.scaleX = Math.max(0, enemy.hp / enemy.maxHp);
      const damaged = enemy.hp < enemy.maxHp || enemy.shield < enemy.maxShield;
      const major = enemy.type === "boss" || enemy.type === "titan";
      art.healthBack.setAlpha(major || damaged ? 1 : 0);
      art.healthFill.setAlpha(major || damaged ? 1 : 0);
      art.shieldFill.scaleX = enemy.maxShield > 0 ? Math.max(0, enemy.shield / enemy.maxShield) : 0;
      art.shieldFill.setAlpha(enemy.shield > 0 ? 0.95 : 0);
      const statusActive = enemy.stunned || enemy.slowed;
      art.statusRing.setAlpha(statusActive ? 0.78 : 0)
        .setStrokeStyle(2, enemy.stunned ? 0x77f3d5 : 0x78dff6, statusActive ? 0.9 : 0);
      if (enemy.burning && simulationTimeMs - this.lastBurnVfxAtMs >= 85 && Math.random() < 0.22) {
        this.lastBurnVfxAtMs = simulationTimeMs;
        const ember = this.add.circle(enemy.x + (Math.random() * 8 - 4), enemy.y - 7, 2, 0xff9e5c, 0.88).setDepth(1_000);
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
    );
  }

  private acquireEnemyArtByAppearance(
    type: EnemyType,
    x: number,
    y: number,
    elite: boolean,
    bossTier: CampaignAct,
    shielded: boolean,
  ): EnemyRenderView {
    const poolKey = `${type}:${elite ? 1 : 0}:${bossTier}:${shielded ? 1 : 0}`;
    const pool = this.enemyArtPool.get(poolKey);
    const art = pool?.pop() ?? createEnemyArt(this, type, { x, y }, {
      elite,
      bossTier,
      shielded,
    });
    art.container.setActive(true).setVisible(true).setAlpha(1).setScale(1).setRotation(0).setPosition(x, y);
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
  }>[]): void {
    const liveIds = new Set<number>();
    const enemies = this.simulation.readView().enemies;
    for (const projectile of projectiles) {
      liveIds.add(projectile.id);
      let view = this.projectileViews.get(projectile.id);
      if (!view) {
        const object = this.acquireProjectile(projectile.towerType, projectile.x, projectile.y);
        view = { towerType: projectile.towerType, object, previousX: projectile.x, previousY: projectile.y };
        this.projectileViews.set(projectile.id, view);
        const target = enemies.find((enemy) => enemy.id === projectile.targetId);
        const tower = this.towerViews.get(projectile.originPadId);
        const origin = this.level.buildPads[projectile.originPadId];
        if (target && tower && origin && tower.placement.type !== "frost") {
          tower.art.head.setRotation(Math.atan2(target.y - origin.y, target.x - origin.x));
        }
        if (target) object.setRotation(Math.atan2(target.y - projectile.y, target.x - projectile.x));
      }
      const dx = projectile.x - view.previousX;
      const dy = projectile.y - view.previousY;
      view.object.setPosition(projectile.x, projectile.y);
      if (dx !== 0 || dy !== 0) view.object.setRotation(Math.atan2(dy, dx));
      view.previousX = projectile.x;
      view.previousY = projectile.y;
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
      phase: view.phase,
      paused: view.paused,
      speed: view.speed,
      selectedBuildType: this.selectedBuildType,
      selectedPadId: this.selectedPadId,
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
      boss: boss && (boss.type === "boss" || boss.type === "titan")
        ? Object.freeze({
            type: boss.type,
            tier: boss.bossTier,
            hpRatio: Math.max(0, boss.hp / boss.maxHp),
            shieldRatio: boss.maxShield > 0 ? Math.max(0, boss.shield / boss.maxShield) : 0,
            enraged: boss.enraged,
          })
        : null,
    }));
  }
}

export function getSelectedTowerDetails(state: TowerDefenseUiState): Readonly<{
  tower: TowerPlacement;
  stats: TowerStats;
  upgradeCost: number | null;
  sellValue: number;
  masteryLocked: boolean;
}> | null {
  if (state.selectedPadId === null) return null;
  const tower = getTower(state.campaign, state.selectedPadId);
  if (!tower) return null;
  return Object.freeze({
    tower,
    stats: getTowerStats(tower.type, tower.level),
    upgradeCost: tower.level < MAX_TOWER_LEVEL ? TOWER_DEFINITIONS[tower.type].upgradeCosts[tower.level - 1] : null,
    sellValue: Math.floor(getTowerTotalInvestment(tower.type, tower.level) * 0.65),
    masteryLocked: tower.level === 3 && state.campaign.completedWave < MASTERY_UNLOCK_WAVE,
  });
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
): Readonly<{ game: Phaser.Game; scene: TowerDefenseScene }> {
  const level = getLevelDefinition(campaign.levelId);
  const scene = new TowerDefenseScene(campaign, callbacks);
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
