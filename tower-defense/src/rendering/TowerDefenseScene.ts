import Phaser from "phaser";
import {
  BUILD_PADS,
  BUILD_PAD_HIT_SIZE,
  ENEMY_DEFINITIONS,
  FINAL_WAVE,
  GAME_HEIGHT,
  GAME_WIDTH,
  MAX_TOWER_LEVEL,
  MASTERY_UNLOCK_WAVE,
  ROUTE_POINTS,
  TOWER_DEFINITIONS,
  getTowerStats,
  getTowerTotalInvestment,
} from "../game/config.ts";
import { calculateDamage, chooseChainTargets, chooseTowerTarget, type TargetCandidate } from "../game/combat.ts";
import {
  applyControlResistance,
  crossedSummonThresholds,
  isEnemyAbilityReady,
  mergeBurnEffect,
  mergeSlowEffect,
  selectHealingTargets,
} from "../game/enemyAbilities.ts";
import { createPathMetrics, getPointAtDistance, getRouteAngleAtDistance } from "../game/pathing.ts";
import {
  applyLeakDamage,
  awardEnemyKill,
  buildTower,
  completeWave,
  createWaveCheckpoint,
  getTower,
  recordActiveDuration,
  repairLives,
  sellTower,
  upgradeTower,
} from "../game/state.ts";
import type {
  CampaignError,
  CampaignState,
  CampaignAct,
  DamageKind,
  EnemyType,
  TowerPlacement,
  TowerStats,
  TowerType,
  WavePlan,
  WaveSpawn,
} from "../game/types.ts";
import { createWavePlan, getBossRepair, getWaveAct, getWaveHealthMultiplier } from "../game/waves.ts";
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
  type EnemyArt,
  type TowerArt,
  type WorldArt,
} from "./art.ts";

export type GamePhase = "setup" | "countdown" | "wave" | "gameover" | "victory";
export type TerminalOutcome = "gameover" | "victory";
export type NoticeCode = CampaignError | "build_locked" | "select_pad" | "pulse_used";

export type TowerDefenseUiState = Readonly<{
  campaign: CampaignState;
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

type TowerRuntime = {
  placement: TowerPlacement;
  art: TowerArt;
  cooldownMs: number;
};

type EnemyRuntime = TargetCandidate & {
  type: EnemyType;
  art: EnemyArt;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  reward: number;
  leakDamage: number;
  slowUntilMs: number;
  slowFactor: number;
  burnUntilMs: number;
  burnDamagePerSecond: number;
  stunUntilMs: number;
  controlResistance: number;
  healingRadius: number;
  healingRatio: number;
  lastHealAtMs: number;
  lastDamageTextAtMs: number;
  elite: boolean;
  bossTier: CampaignAct;
  summonThresholds: readonly number[];
  summonCount: number;
  triggeredSummonThresholds: Set<number>;
  dead: boolean;
};

type ProjectileRuntime = {
  object: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;
  targetId: number;
  towerType: TowerType;
  stats: TowerStats;
};

const path = createPathMetrics(ROUTE_POINTS);
const COUNTDOWN_MS = 2_400;

export class TowerDefenseScene extends Phaser.Scene {
  private campaign: CampaignState;
  private readonly callbacks: TowerDefenseCallbacks;
  private phase: GamePhase;
  private paused = false;
  private speed: 1 | 2 = 1;
  private selectedBuildType: TowerType | null = "ranger";
  private selectedPadId: number | null = null;
  private readonly padViews = new Map<number, PadView>();
  private readonly towerViews = new Map<number, TowerRuntime>();
  private enemies: EnemyRuntime[] = [];
  private readonly enemiesById = new Map<number, EnemyRuntime>();
  private projectiles: ProjectileRuntime[] = [];
  private wavePlan: WavePlan | null = null;
  private waveElapsedMs = 0;
  private countdownRemainingMs = 0;
  private simulationTimeMs = 0;
  private nextSpawnIndex = 0;
  private pulseAvailable = true;
  private rangePreview?: Phaser.GameObjects.Arc;
  private waveStartLives = 0;
  private lastUiEmitAt = -1_000;
  private waveCheckpoint: CampaignState | null = null;
  private lastCheckpointDurationMs = 0;
  private activeDurationMs: number;
  private waveResolvedCount = 0;
  private waveTotalCount = 0;
  private nextDynamicEnemyId = 1;
  private lastKillHapticAtMs = -1_000;
  private lastBurnVfxAtMs = -1_000;
  private lastHitBurstAtMs = -1_000;
  private worldArt?: WorldArt;

  constructor(campaign: CampaignState, callbacks: TowerDefenseCallbacks) {
    super({ key: "tower-defense" });
    this.campaign = campaign;
    this.activeDurationMs = campaign.activeDurationMs;
    this.callbacks = callbacks;
    this.phase = campaign.lives <= 0 ? "gameover" : campaign.completedWave >= FINAL_WAVE ? "victory" : "setup";
  }

  create(): void {
    this.worldArt = drawWorld(this);
    setWorldAct(this, this.worldArt, getWaveAct(Math.min(FINAL_WAVE, this.campaign.completedWave + 1)));
    this.createBuildPads();
    this.syncTowerViews();
    this.updatePadVisuals();
    this.emitUi(true);
    if (this.phase === "victory" || this.phase === "gameover") {
      const outcome = this.phase;
      this.time.delayedCall(0, () => this.callbacks.onTerminal(outcome, this.campaign));
    }
  }

  update(_time: number, delta: number): void {
    if (this.paused || this.phase === "setup" || this.phase === "gameover" || this.phase === "victory") return;
    const realDelta = Math.min(100, Math.max(0, delta));
    this.activeDurationMs += realDelta;
    this.persistWaveDurationCheckpoint();
    const step = realDelta * this.speed;
    this.simulationTimeMs += step;

    if (this.phase === "countdown") {
      this.countdownRemainingMs = Math.max(0, this.countdownRemainingMs - step);
      if (this.countdownRemainingMs <= 0) this.phase = "wave";
      this.emitUi();
      return;
    }

    this.waveElapsedMs += step;
    this.spawnScheduledEnemies();
    this.updateEnemies(step);
    if (this.phase !== "wave") return;
    this.updateTowers(step);
    this.updateProjectiles(step);
    this.checkWaveResolution();
    this.emitUi();
  }

  getCampaign(): CampaignState {
    this.syncCampaignDuration();
    return this.campaign;
  }

  getCurrentWavePlan(): WavePlan {
    return createWavePlan(Math.min(FINAL_WAVE, this.campaign.completedWave + 1));
  }

  setBuildType(type: TowerType | null): void {
    if (this.phase !== "setup") {
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
    if (this.phase !== "setup" || this.campaign.completedWave >= FINAL_WAVE) return false;
    this.syncCampaignDuration();
    this.callbacks.onPersist(this.campaign);
    this.waveCheckpoint = this.campaign;
    this.lastCheckpointDurationMs = this.activeDurationMs;
    this.wavePlan = createWavePlan(this.campaign.completedWave + 1);
    this.waveElapsedMs = 0;
    this.countdownRemainingMs = COUNTDOWN_MS;
    this.nextSpawnIndex = 0;
    this.waveResolvedCount = 0;
    this.waveTotalCount = this.wavePlan.spawns.length;
    this.nextDynamicEnemyId = this.wavePlan.wave * 10_000 + this.wavePlan.spawns.length + 100;
    this.waveStartLives = this.campaign.lives;
    this.pulseAvailable = true;
    this.selectedPadId = null;
    this.selectedBuildType = null;
    this.phase = "countdown";
    if (this.worldArt) setWorldAct(this, this.worldArt, this.wavePlan.act);
    this.updatePadVisuals();
    this.updateRangePreview();
    if (this.wavePlan.hasBoss) this.callbacks.onHaptic("heavy");
    this.emitUi(true);
    return true;
  }

  togglePause(): void {
    if (this.phase === "gameover" || this.phase === "victory") return;
    this.setPaused(!this.paused);
  }

  setPaused(value: boolean): void {
    if (this.phase === "gameover" || this.phase === "victory") return;
    this.paused = value;
    this.tweens.timeScale = value ? 0 : 1;
    this.emitUi(true);
  }

  toggleSpeed(): void {
    this.speed = this.speed === 1 ? 2 : 1;
    this.callbacks.onHaptic("light");
    this.emitUi(true);
  }

  usePulse(): boolean {
    if (this.phase !== "wave" || this.enemies.length === 0 || !this.pulseAvailable) {
      this.callbacks.onNotice("pulse_used");
      return false;
    }
    this.pulseAvailable = false;
    const damage = 7 + (this.wavePlan?.wave || 1) * 1.5;
    for (const enemy of [...this.enemies]) {
      const control = applyControlResistance(0.1, 1_500, enemy.controlResistance);
      enemy.stunUntilMs = Math.max(enemy.stunUntilMs, this.simulationTimeMs + control.durationMs);
      enemy.art.statusRing.setAlpha(0.78).setStrokeStyle(2, 0x78f0dc, 0.9);
      this.damageEnemy(enemy, damage, "arcane");
    }
    const pulse = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 18, 0x72e6c2, 0.08)
      .setStrokeStyle(4, 0x8ff5dc, 0.9)
      .setDepth(1_200);
    this.tweens.add({
      targets: pulse,
      radius: GAME_WIDTH * 0.68,
      alpha: 0,
      duration: 520,
      ease: "Quad.Out",
      onComplete: () => pulse.destroy(),
    });
    this.cameras.main.flash(180, 105, 232, 204, false);
    this.callbacks.onHaptic("medium");
    this.emitUi(true);
    return true;
  }

  upgradeSelectedTower(): boolean {
    if (this.phase !== "setup" || this.selectedPadId === null) {
      this.callbacks.onNotice("build_locked");
      return false;
    }
    const result = upgradeTower(this.campaign, this.selectedPadId);
    if (!result.ok) {
      this.callbacks.onNotice(result.error || "insufficient_gold");
      return false;
    }
    this.campaign = result.state;
    this.syncTowerViews();
    this.updatePadVisuals();
    this.updateRangePreview();
    this.callbacks.onPersist(this.campaign);
    this.callbacks.onHaptic("success");
    this.emitUi(true);
    return true;
  }

  sellSelectedTower(): boolean {
    if (this.phase !== "setup" || this.selectedPadId === null) {
      this.callbacks.onNotice("build_locked");
      return false;
    }
    const result = sellTower(this.campaign, this.selectedPadId);
    if (!result.ok) return false;
    this.campaign = result.state;
    this.selectedPadId = null;
    this.syncTowerViews();
    this.updatePadVisuals();
    this.updateRangePreview();
    this.callbacks.onPersist(this.campaign);
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
    BUILD_PADS.forEach((point, padId) => {
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
    if (this.phase !== "setup") {
      this.callbacks.onNotice("build_locked");
      return;
    }
    const tower = getTower(this.campaign, padId);
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
    const result = buildTower(this.campaign, padId, this.selectedBuildType);
    if (!result.ok) {
      this.callbacks.onNotice(result.error || "insufficient_gold");
      this.shakePad(padId);
      return;
    }
    this.campaign = result.state;
    this.selectedPadId = padId;
    this.selectedBuildType = null;
    this.syncTowerViews();
    this.updatePadVisuals();
    this.updateRangePreview();
    this.callbacks.onPersist(this.campaign);
    this.callbacks.onHaptic("success");
    this.emitUi(true);
  }

  private syncTowerViews(): void {
    for (const runtime of this.towerViews.values()) runtime.art.container.destroy(true);
    this.towerViews.clear();
    for (const placement of this.campaign.towers) {
      const point = BUILD_PADS[placement.padId];
      const art = createTowerArt(this, placement.type, placement.level, point);
      this.towerViews.set(placement.padId, { placement, art, cooldownMs: 180 });
    }
  }

  private updatePadVisuals(): void {
    for (const [padId, view] of this.padViews) {
      const tower = getTower(this.campaign, padId);
      const selected = this.selectedPadId === padId;
      const buildable = !tower && this.phase === "setup" && this.selectedBuildType !== null;
      view.ring.setFillStyle(selected ? 0x376e5a : buildable ? 0x1f594a : 0x0d2521, selected ? 0.94 : 0.78);
      view.ring.setStrokeStyle(selected ? 3 : 2, selected ? 0xf0d77d : buildable ? 0x75e3bd : 0x5f8b77, selected ? 1 : 0.64);
      view.core.setAlpha(tower ? 0.1 : buildable ? 0.72 : 0.42);
      view.rune.setAlpha(tower ? 0 : buildable ? 0.92 : 0.48);
      this.tweens.killTweensOf(view.rune);
      view.rune.setScale(1);
      if (buildable) {
        this.tweens.add({ targets: view.rune, scale: 1.16, duration: 520, yoyo: true, repeat: 1 });
      }
    }
  }

  private updateRangePreview(): void {
    this.rangePreview?.destroy();
    this.rangePreview = undefined;
    if (this.selectedPadId === null) return;
    const tower = getTower(this.campaign, this.selectedPadId);
    if (!tower) return;
    const point = BUILD_PADS[tower.padId];
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

  private spawnScheduledEnemies(): void {
    if (!this.wavePlan) return;
    while (
      this.nextSpawnIndex < this.wavePlan.spawns.length
      && this.wavePlan.spawns[this.nextSpawnIndex].atMs <= this.waveElapsedMs
    ) {
      this.spawnEnemy(this.wavePlan.spawns[this.nextSpawnIndex]);
      this.nextSpawnIndex += 1;
    }
  }

  private spawnEnemy(spawn: WaveSpawn, progress = 0, dynamic = false): void {
    const point = getPointAtDistance(path, progress);
    const art = createEnemyArt(this, spawn.type, point, {
      elite: spawn.elite,
      bossTier: spawn.bossTier,
      shielded: spawn.shieldRatio > 0,
    });
    const maxShield = Math.round(spawn.maxHp * spawn.shieldRatio);
    const runtime: EnemyRuntime = {
      id: spawn.id,
      type: spawn.type,
      art,
      x: point.x,
      y: point.y,
      progress,
      hp: spawn.maxHp,
      maxHp: spawn.maxHp,
      shield: maxShield,
      maxShield,
      speed: spawn.speed,
      reward: spawn.reward,
      leakDamage: spawn.leakDamage,
      physicalResistance: spawn.physicalResistance,
      magicResistance: spawn.magicResistance,
      slowed: false,
      slowUntilMs: 0,
      slowFactor: 1,
      burnUntilMs: 0,
      burnDamagePerSecond: 0,
      stunUntilMs: 0,
      controlResistance: spawn.controlResistance,
      healingRadius: spawn.healingRadius,
      healingRatio: spawn.healingRatio,
      lastHealAtMs: this.simulationTimeMs + 900 + (spawn.id % 7) * 170,
      lastDamageTextAtMs: -1_000,
      elite: spawn.elite,
      bossTier: spawn.bossTier,
      summonThresholds: spawn.summonThresholds,
      summonCount: spawn.summonCount,
      triggeredSummonThresholds: new Set<number>(),
      dead: false,
    };
    this.enemies.push(runtime);
    this.enemiesById.set(runtime.id, runtime);
    if (dynamic) this.waveTotalCount += 1;
    if (spawn.type === "boss" || spawn.type === "titan") {
      this.cameras.main.shake(320, 0.008);
      this.callbacks.onHaptic("heavy");
    }
  }

  private updateEnemies(deltaMs: number): void {
    for (const enemy of [...this.enemies]) {
      if (enemy.dead) continue;
      const burning = enemy.burnUntilMs > this.simulationTimeMs;
      if (burning) this.damageEnemy(enemy, enemy.burnDamagePerSecond * (deltaMs / 1_000), "fire", false);
      if (enemy.dead) continue;
      const stunned = enemy.stunUntilMs > this.simulationTimeMs;

      if (enemy.healingRadius > 0 && isEnemyAbilityReady(this.simulationTimeMs, enemy.stunUntilMs, enemy.lastHealAtMs)) {
        enemy.lastHealAtMs = this.simulationTimeMs + 2_800;
        const targets = selectHealingTargets(enemy, this.enemies, enemy.healingRadius, 2);
        if (targets.length > 0) {
          createHealPulse(this, enemy);
          for (const candidate of targets) {
            const target = this.enemiesById.get(candidate.id);
            if (!target || target.dead) continue;
            const healed = Math.min(target.maxHp - target.hp, Math.max(1, target.maxHp * enemy.healingRatio));
            target.hp += healed;
            createFloatingText(this, target.x, target.y - 18, `+${Math.ceil(healed)}`, "#9effbc");
          }
        }
      }

      enemy.slowed = enemy.slowUntilMs > this.simulationTimeMs;
      enemy.slowFactor = enemy.slowed ? enemy.slowFactor : 1;
      const enraged = (enemy.type === "boss" || enemy.type === "titan") && enemy.hp / enemy.maxHp <= 0.4;
      if (!stunned) enemy.progress += enemy.speed * (enraged ? 1.28 : 1) * enemy.slowFactor * (deltaMs / 1_000);
      if (enemy.progress >= path.totalLength) {
        this.leakEnemy(enemy);
        if (this.phase !== "wave") return;
        continue;
      }

      const point = getPointAtDistance(path, enemy.progress);
      enemy.x = point.x;
      enemy.y = point.y;
      enemy.art.container.setPosition(point.x, point.y).setDepth(point.y + 30);
      enemy.art.container.setRotation(getRouteAngleAtDistance(path, enemy.progress) * 0.03);
      enemy.art.body.y = Math.sin(this.simulationTimeMs * 0.009 + enemy.id) * 1.8;
      enemy.art.healthFill.scaleX = Math.max(0, enemy.hp / enemy.maxHp);
      const damaged = enemy.hp < enemy.maxHp || enemy.shield < enemy.maxShield;
      const major = enemy.type === "boss" || enemy.type === "titan";
      enemy.art.healthBack.setAlpha(major || damaged ? 1 : 0);
      enemy.art.healthFill.setAlpha(major || damaged ? 1 : 0);
      enemy.art.shieldFill.scaleX = enemy.maxShield > 0 ? Math.max(0, enemy.shield / enemy.maxShield) : 0;
      enemy.art.shieldFill.setAlpha(enemy.shield > 0 ? 0.95 : 0);
      const statusActive = stunned || enemy.slowed;
      enemy.art.statusRing.setAlpha(statusActive ? 0.78 : 0).setStrokeStyle(2, stunned ? 0x77f3d5 : 0x78dff6, statusActive ? 0.9 : 0);
      if (burning && this.simulationTimeMs - this.lastBurnVfxAtMs >= 85 && Math.random() < deltaMs / 90) {
        this.lastBurnVfxAtMs = this.simulationTimeMs;
        const ember = this.add.circle(point.x + (Math.random() * 8 - 4), point.y - 7, 2, 0xff9e5c, 0.88).setDepth(1_000);
        this.tweens.add({ targets: ember, y: ember.y - 11, alpha: 0, duration: 310, onComplete: () => ember.destroy() });
      }
    }
  }

  private updateTowers(deltaMs: number): void {
    const candidates = this.enemies.filter((enemy) => !enemy.dead);
    for (const runtime of this.towerViews.values()) {
      runtime.cooldownMs -= deltaMs;
      if (runtime.cooldownMs > 0) continue;
      const point = BUILD_PADS[runtime.placement.padId];
      const stats = getTowerStats(runtime.placement.type, runtime.placement.level);
      const clusterRadius = runtime.placement.type === "storm" ? stats.chainRange : stats.splashRadius;
      const target = chooseTowerTarget(runtime.placement.type, point, stats.range, candidates, clusterRadius);
      if (!target) {
        runtime.cooldownMs = 80;
        continue;
      }
      const angle = Math.atan2(target.y - point.y, target.x - point.x);
      if (runtime.placement.type !== "frost") runtime.art.head.setRotation(angle);
      this.createProjectile(runtime.placement.type, stats, point.x, point.y - 8, target.id, angle);
      runtime.cooldownMs = stats.fireRateMs;
    }
  }

  private createProjectile(
    towerType: TowerType,
    stats: TowerStats,
    x: number,
    y: number,
    targetId: number,
    angle: number,
  ): void {
    let object: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;
    if (towerType === "ranger") {
      object = this.add.rectangle(x, y, 15, 3, 0xf6dfa0).setRotation(angle).setDepth(1_000);
    } else if (towerType === "frost") {
      object = this.add.circle(x, y, 5, 0x8cecf4, 0.95).setStrokeStyle(2, 0xe2ffff, 0.82).setDepth(1_000);
    } else if (towerType === "ember") {
      object = this.add.circle(x, y, 7, 0xff7545, 0.96).setStrokeStyle(2, 0xffd36f, 0.9).setDepth(1_000);
    } else {
      object = this.add.rectangle(x, y, 9, 9, 0xc9f8ff, 0.96)
        .setRotation(angle + Math.PI / 4)
        .setStrokeStyle(2, 0x66d8ed, 0.9)
        .setDepth(1_000);
    }
    this.projectiles.push({ object, targetId, towerType, stats });
  }

  private updateProjectiles(deltaMs: number): void {
    for (const projectile of [...this.projectiles]) {
      const candidate = this.enemiesById.get(projectile.targetId);
      const target = candidate && !candidate.dead ? candidate : null;
      if (!target) {
        this.removeProjectile(projectile);
        continue;
      }
      const dx = target.x - projectile.object.x;
      const dy = target.y - projectile.object.y;
      const distance = Math.hypot(dx, dy);
      const step = projectile.stats.projectileSpeed * (deltaMs / 1_000);
      if (distance <= Math.max(step, 9)) {
        this.resolveProjectileHit(projectile, target);
        this.removeProjectile(projectile);
        continue;
      }
      projectile.object.x += (dx / distance) * step;
      projectile.object.y += (dy / distance) * step;
      projectile.object.rotation = Math.atan2(dy, dx);
    }
  }

  private resolveProjectileHit(projectile: ProjectileRuntime, target: EnemyRuntime): void {
    const color = projectile.towerType === "ranger"
      ? 0xf5d887
      : projectile.towerType === "frost"
        ? 0x7ceaf2
        : projectile.towerType === "storm"
          ? 0xbcefff
          : 0xff8050;
    const majorTarget = target.type === "boss" || target.type === "titan";
    const burstCooldownMs = majorTarget ? 30 : projectile.towerType === "ranger" ? 70 : 50;
    if (this.time.now - this.lastHitBurstAtMs >= burstCooldownMs) {
      this.lastHitBurstAtMs = this.time.now;
      createHitBurst(
        this,
        target.x,
        target.y,
        color,
        projectile.stats.splashRadius || 14,
        projectile.towerType === "ranger" ? 0 : majorTarget ? 3 : 2,
      );
    }
    if (projectile.towerType === "storm") {
      const victims = chooseChainTargets(target, this.enemies.filter((enemy) => !enemy.dead), projectile.stats.chainTargets, projectile.stats.chainRange)
        .map((candidate) => this.enemiesById.get(candidate.id))
        .filter((enemy): enemy is EnemyRuntime => Boolean(enemy && !enemy.dead));
      let previous: EnemyRuntime = target;
      victims.forEach((victim, index) => {
        if (index > 0) createLightningArc(this, previous, victim, victims.length - index);
        const bossMultiplier = victim.type === "boss" || victim.type === "titan" ? projectile.stats.bossDamageMultiplier : 1;
        this.damageEnemy(victim, projectile.stats.damage * Math.pow(0.72, index) * bossMultiplier, projectile.stats.damageKind);
        previous = victim;
      });
      return;
    }
    const victims = projectile.stats.splashRadius > 0
      ? this.enemies.filter((enemy) => Math.hypot(enemy.x - target.x, enemy.y - target.y) <= projectile.stats.splashRadius)
      : [target];
    for (const victim of victims) {
      const falloff = victim.id === target.id ? 1 : projectile.towerType === "ember" ? 0.68 : 0.5;
      const bossMultiplier = victim.type === "boss" || victim.type === "titan" ? projectile.stats.bossDamageMultiplier : 1;
      this.damageEnemy(victim, projectile.stats.damage * falloff * bossMultiplier, projectile.stats.damageKind);
      if (victim.dead) continue;
      if (projectile.stats.slowDurationMs > 0) {
        const control = applyControlResistance(projectile.stats.slowFactor, projectile.stats.slowDurationMs, victim.controlResistance);
        const slow = mergeSlowEffect(
          { factor: victim.slowFactor, untilMs: victim.slowUntilMs },
          { factor: control.slowFactor, durationMs: control.durationMs },
          this.simulationTimeMs,
        );
        victim.slowUntilMs = slow.untilMs;
        victim.slowFactor = slow.factor;
      }
      if (projectile.stats.burnDurationMs > 0) {
        const burn = mergeBurnEffect(
          { damagePerSecond: victim.burnDamagePerSecond, untilMs: victim.burnUntilMs },
          { damagePerSecond: projectile.stats.burnDamagePerSecond, durationMs: projectile.stats.burnDurationMs },
          this.simulationTimeMs,
        );
        victim.burnUntilMs = burn.untilMs;
        victim.burnDamagePerSecond = burn.damagePerSecond;
      }
    }
  }

  private damageEnemy(enemy: EnemyRuntime, amount: number, kind: DamageKind, showText = true): void {
    if (enemy.dead) return;
    const damage = calculateDamage(amount, kind, enemy);
    const previousHpRatio = enemy.hp / enemy.maxHp;
    const absorbed = Math.min(enemy.shield, damage);
    enemy.shield -= absorbed;
    const coreDamage = Math.max(0, damage - absorbed);
    enemy.hp -= coreDamage;
    if (
      showText
      && damage >= 1
      && (damage >= 8 || enemy.type === "boss" || enemy.type === "titan")
      && this.simulationTimeMs - enemy.lastDamageTextAtMs >= 160
    ) {
      enemy.lastDamageTextAtMs = this.simulationTimeMs;
      createFloatingText(this, enemy.x, enemy.y - 15, `${Math.round(damage)}`, absorbed > 0 ? "#bcefff" : "#fff1bd");
    }
    if (enemy.type === "titan" && coreDamage > 0 && enemy.hp > 0) {
      const crossed = crossedSummonThresholds(
        previousHpRatio,
        enemy.hp / enemy.maxHp,
        enemy.summonThresholds,
        enemy.triggeredSummonThresholds,
      );
      for (const threshold of crossed) {
        enemy.triggeredSummonThresholds.add(threshold);
        this.summonTitanShades(enemy);
      }
    }
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  private summonTitanShades(titan: EnemyRuntime): void {
    if (!this.wavePlan || titan.summonCount <= 0) return;
    const definition = ENEMY_DEFINITIONS.shade;
    const hpMultiplier = getWaveHealthMultiplier(this.wavePlan.wave) * 0.78;
    createSummonBurst(this, titan);
    for (let index = 0; index < titan.summonCount; index += 1) {
      const spawn: WaveSpawn = Object.freeze({
        id: this.nextDynamicEnemyId,
        type: "shade",
        atMs: this.waveElapsedMs,
        maxHp: Math.round(definition.baseHp * hpMultiplier),
        speed: definition.speed * Math.min(1.4, 1 + (this.wavePlan.wave - 1) * 0.01),
        reward: 0,
        leakDamage: definition.leakDamage,
        physicalResistance: definition.physicalResistance,
        magicResistance: definition.magicResistance,
        shieldRatio: 0,
        controlResistance: definition.controlResistance,
        healingRadius: 0,
        healingRatio: 0,
        elite: false,
        bossTier: this.wavePlan.act,
        summonThresholds: Object.freeze([]),
        summonCount: 0,
      });
      this.nextDynamicEnemyId += 1;
      this.spawnEnemy(spawn, Math.max(0, titan.progress - 10 - index * 9), true);
    }
    this.callbacks.onHaptic("medium");
  }

  private killEnemy(enemy: EnemyRuntime): void {
    if (enemy.dead) return;
    enemy.dead = true;
    this.enemies = this.enemies.filter((candidate) => candidate.id !== enemy.id);
    this.enemiesById.delete(enemy.id);
    this.waveResolvedCount += 1;
    this.campaign = awardEnemyKill(this.campaign, enemy.reward);
    if (enemy.reward > 0) createFloatingText(this, enemy.x, enemy.y - 2, `+${enemy.reward}`, "#ffd86c");
    this.tweens.add({
      targets: enemy.art.container,
      alpha: 0,
      scale: 1.45,
      duration: 230,
      onComplete: () => enemy.art.container.destroy(true),
    });
    if (enemy.type === "boss" || enemy.type === "titan") {
      this.callbacks.onHaptic("heavy");
      this.lastKillHapticAtMs = this.simulationTimeMs;
    } else if (this.simulationTimeMs - this.lastKillHapticAtMs >= 300) {
      this.callbacks.onHaptic(enemy.elite ? "medium" : "light");
      this.lastKillHapticAtMs = this.simulationTimeMs;
    }
    this.emitUi();
  }

  private leakEnemy(enemy: EnemyRuntime): void {
    enemy.dead = true;
    this.enemies = this.enemies.filter((candidate) => candidate.id !== enemy.id);
    this.enemiesById.delete(enemy.id);
    this.waveResolvedCount += 1;
    this.campaign = applyLeakDamage(this.campaign, enemy.leakDamage);
    enemy.art.container.destroy(true);
    if (this.worldArt) createGateHitEffect(this, this.worldArt, enemy.leakDamage);
    this.cameras.main.shake(170, 0.006);
    this.callbacks.onHaptic("heavy");
    this.persistWaveDurationCheckpoint(true);
    if (this.campaign.lives <= 0) {
      this.endRun("gameover");
    } else {
      this.emitUi(true);
    }
  }

  private removeProjectile(projectile: ProjectileRuntime): void {
    this.projectiles = this.projectiles.filter((candidate) => candidate !== projectile);
    projectile.object.destroy();
  }

  private checkWaveResolution(): void {
    if (
      this.phase !== "wave"
      || !this.wavePlan
      || this.nextSpawnIndex < this.wavePlan.spawns.length
      || this.enemies.length > 0
    ) return;

    for (const projectile of [...this.projectiles]) this.removeProjectile(projectile);
    const flawlessBonus = this.campaign.lives === this.waveStartLives ? 10 : 0;
    const totalBonus = this.wavePlan.clearBonus + flawlessBonus;
    this.syncCampaignDuration();
    const result = completeWave(this.campaign, this.wavePlan.wave, totalBonus);
    if (!result.ok) return;
    this.campaign = result.state;
    const repairAmount = getBossRepair(this.wavePlan.wave);
    const livesBeforeRepair = this.campaign.lives;
    if (repairAmount > 0) this.campaign = repairLives(this.campaign, repairAmount);
    const repairedLives = this.campaign.lives - livesBeforeRepair;
    this.callbacks.onWaveClear(this.wavePlan.wave, totalBonus, repairedLives);
    this.callbacks.onPersist(this.campaign);
    this.callbacks.onHaptic("success");
    this.wavePlan = null;
    this.waveCheckpoint = null;
    this.phase = this.campaign.completedWave >= FINAL_WAVE ? "victory" : "setup";
    this.selectedBuildType = this.phase === "setup" ? "ranger" : null;
    this.pulseAvailable = true;
    if (this.worldArt && this.phase === "setup") {
      setWorldAct(this, this.worldArt, getWaveAct(Math.min(FINAL_WAVE, this.campaign.completedWave + 1)));
    }
    this.updatePadVisuals();
    this.emitUi(true);
    if (this.phase === "victory") this.endRun("victory");
  }

  private endRun(outcome: TerminalOutcome): void {
    if (this.phase === "gameover" || (this.phase === "victory" && outcome !== "victory")) return;
    this.phase = outcome;
    this.syncCampaignDuration();
    this.paused = false;
    this.tweens.timeScale = 1;
    this.wavePlan = null;
    this.waveCheckpoint = null;
    for (const projectile of [...this.projectiles]) this.removeProjectile(projectile);
    if (outcome === "gameover") {
      for (const enemy of this.enemies) enemy.art.container.destroy(true);
      this.enemies = [];
      this.enemiesById.clear();
      this.cameras.main.fade(480, 17, 16, 22, false);
      this.callbacks.onHaptic("error");
    } else {
      this.cameras.main.flash(420, 235, 205, 112, false);
      this.callbacks.onHaptic("success");
    }
    this.emitUi(true);
    this.callbacks.onTerminal(outcome, this.campaign);
  }

  private persistWaveDurationCheckpoint(force = false): void {
    if (!this.waveCheckpoint || (!force && this.activeDurationMs - this.lastCheckpointDurationMs < 1_000)) return;
    this.waveCheckpoint = createWaveCheckpoint(this.waveCheckpoint, this.campaign, this.activeDurationMs);
    this.lastCheckpointDurationMs = this.activeDurationMs;
    this.callbacks.onPersist(this.waveCheckpoint);
  }

  private syncCampaignDuration(): void {
    const duration = Math.round(this.activeDurationMs);
    if (duration !== this.campaign.activeDurationMs) this.campaign = recordActiveDuration(this.campaign, duration);
  }

  private emitUi(force = false): void {
    const now = this.time.now;
    if (!force && now - this.lastUiEmitAt < 100) return;
    this.lastUiEmitAt = now;
    const plan = this.wavePlan || this.getCurrentWavePlan();
    const boss = this.enemies.find((enemy) => !enemy.dead && (enemy.type === "boss" || enemy.type === "titan"));
    this.callbacks.onUiChange(Object.freeze({
      campaign: this.campaign,
      phase: this.phase,
      paused: this.paused,
      speed: this.speed,
      selectedBuildType: this.selectedBuildType,
      selectedPadId: this.selectedPadId,
      currentWave: Math.min(FINAL_WAVE, this.campaign.completedWave + 1),
      waveProgress: this.phase === "setup"
        ? 0
        : this.waveTotalCount > 0
          ? Math.min(1, this.waveResolvedCount / this.waveTotalCount)
          : 0,
      enemiesAlive: this.enemies.length,
      totalEnemies: this.phase === "setup" ? plan.spawns.length : this.waveTotalCount,
      countdown: Math.ceil(this.countdownRemainingMs / 1_000),
      pulseAvailable: this.pulseAvailable,
      act: plan.act,
      threat: plan.threat,
      boss: boss && (boss.type === "boss" || boss.type === "titan")
        ? Object.freeze({
            type: boss.type,
            tier: boss.bossTier,
            hpRatio: Math.max(0, boss.hp / boss.maxHp),
            shieldRatio: boss.maxShield > 0 ? Math.max(0, boss.shield / boss.maxShield) : 0,
            enraged: boss.hp / boss.maxHp <= 0.4,
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
  const scene = new TowerDefenseScene(campaign, callbacks);
  const game = new Phaser.Game({ ...TOWER_DEFENSE_GAME_CONFIG, parent, scene });
  return Object.freeze({ game, scene });
}
