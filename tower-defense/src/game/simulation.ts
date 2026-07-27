import {
  BUILD_PADS,
  ENEMY_DEFINITIONS,
  FINAL_WAVE,
  ROUTE_POINTS,
  getTowerStats,
} from "./config.ts";
import { calculateDamage, chooseChainTargets, chooseTowerTarget, type TargetCandidate } from "./combat.ts";
import {
  applyControlResistance,
  crossedSummonThresholds,
  isEnemyAbilityReady,
  mergeBurnEffect,
  mergeSlowEffect,
  selectHealingTargets,
} from "./enemyAbilities.ts";
import type { LevelDefinition, ModeRuleset } from "./content.ts";
import { createPathMetrics, samplePointAtDistance, type MutablePoint, type PathMetrics } from "./pathing.ts";
import {
  applyLeakDamage,
  awardEnemyKill,
  buildTower,
  completeWave,
  createWaveCheckpoint,
  recordActiveDuration,
  repairLives,
  sellTower,
  upgradeTower,
} from "./state.ts";
import type {
  CampaignAct,
  CampaignError,
  CampaignState,
  DamageKind,
  EnemyType,
  Point,
  TowerPlacement,
  TowerStats,
  TowerType,
  WavePlan,
  WaveSpawn,
} from "./types.ts";
import { createWavePlan, getBossRepair, getWaveHealthMultiplier } from "./waves.ts";

export const FIXED_STEP_MS = 1_000 / 60;
const COUNTDOWN_MS = 2_400;
const TIME_EPSILON_MS = 1e-7;

export type SimulationPhase = "setup" | "countdown" | "wave" | "gameover" | "victory";
export type SimulationOutcome = "gameover" | "victory";

export type SimulationRules = Readonly<{
  id: string;
  routePoints: readonly Point[];
  buildPads: readonly Point[];
  finalWave: number | null;
  isComplete(completedWave: number): boolean;
  createWavePlan(wave: number): WavePlan;
  getBossRepair(wave: number): number;
  getWaveHealthMultiplier(wave: number): number;
}>;

export const DEFAULT_SIMULATION_RULES: SimulationRules = Object.freeze({
  id: "forest-campaign",
  routePoints: ROUTE_POINTS,
  buildPads: BUILD_PADS,
  finalWave: FINAL_WAVE,
  isComplete: (completedWave) => completedWave >= FINAL_WAVE,
  createWavePlan,
  getBossRepair,
  getWaveHealthMultiplier,
});

export function createSimulationRules(level: LevelDefinition, mode: ModeRuleset): SimulationRules {
  const finalWave = mode.getFinalWave(level);
  return Object.freeze({
    id: `${level.id}:${mode.id}:v${level.contentVersion}`,
    routePoints: level.route,
    buildPads: level.buildPads,
    finalWave,
    isComplete: (completedWave) => mode.isComplete(level, completedWave),
    createWavePlan: (wave) => mode.createWave(level, wave),
    getBossRepair: (wave) => {
      if (mode.kind !== "campaign" || finalWave === null || wave >= finalWave) return 0;
      return mode.createWave(level, wave).hasBoss ? (wave < finalWave * (2 / 3) ? 2 : 1) : 0;
    },
    getWaveHealthMultiplier: (wave) => estimateBaseHealthMultiplier(mode.createWave(level, wave)),
  });
}

export type EnemySimulationView = Readonly<TargetCandidate> & Readonly<{
  type: EnemyType;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  stunned: boolean;
  burning: boolean;
  elite: boolean;
  bossTier: CampaignAct;
  enraged: boolean;
}>;

export type ProjectileSimulationView = Readonly<{
  id: number;
  x: number;
  y: number;
  originPadId: number;
  targetId: number;
  towerType: TowerType;
}>;

export type SimulationView = Readonly<{
  campaign: CampaignState;
  phase: SimulationPhase;
  paused: boolean;
  speed: 1 | 2;
  simulationTimeMs: number;
  currentWave: number;
  wavePlan: WavePlan | null;
  countdownRemainingMs: number;
  pulseAvailable: boolean;
  waveResolvedCount: number;
  waveTotalCount: number;
  enemies: readonly EnemySimulationView[];
  projectiles: readonly ProjectileSimulationView[];
}>;

export type SimulationSnapshot = Readonly<{
  rulesId: string;
  completedTicks: number;
  campaign: CampaignState;
  phase: SimulationPhase;
  paused: boolean;
  speed: 1 | 2;
  simulationTimeMs: number;
  currentWave: number;
  countdownRemainingMs: number;
  pulseAvailable: boolean;
  waveResolvedCount: number;
  waveTotalCount: number;
  enemies: readonly Readonly<EnemySimulationView>[];
  projectiles: readonly ProjectileSimulationView[];
}>;

export type SimulationEvent =
  | Readonly<{ type: "persist"; campaign: CampaignState }>
  | Readonly<{ type: "haptic"; kind: "light" | "medium" | "heavy" | "success" | "error" }>
  | Readonly<{ type: "boss_spawned" }>
  | Readonly<{ type: "pulse" }>
  | Readonly<{
      type: "enemy_healed";
      casterId: number;
      targets: readonly Readonly<{ id: number; x: number; y: number; amount: number }>[];
    }>
  | Readonly<{
      type: "enemy_damaged";
      enemyId: number;
      x: number;
      y: number;
      damage: number;
      absorbed: number;
    }>
  | Readonly<{
      type: "projectile_hit";
      towerType: TowerType;
      targetId: number;
      x: number;
      y: number;
      radius: number;
      major: boolean;
    }>
  | Readonly<{
      type: "lightning";
      from: Readonly<{ x: number; y: number }>;
      to: Readonly<{ x: number; y: number }>;
      intensity: number;
    }>
  | Readonly<{ type: "titan_summon"; x: number; y: number }>
  | Readonly<{
      type: "enemy_killed";
      enemyId: number;
      enemyType: EnemyType;
      x: number;
      y: number;
      reward: number;
      elite: boolean;
      bossTier: CampaignAct;
      shielded: boolean;
    }>
  | Readonly<{ type: "enemy_leaked"; enemyId: number; x: number; y: number; damage: number }>
  | Readonly<{ type: "wave_cleared"; wave: number; bonus: number; repairedLives: number }>
  | Readonly<{ type: "terminal"; outcome: SimulationOutcome; campaign: CampaignState }>;

type TowerEntity = {
  placement: TowerPlacement;
  cooldownMs: number;
};

type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };

type EnemyEntity = Mutable<EnemySimulationView> & {
  hp: number;
  shield: number;
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
  summonThresholds: readonly number[];
  summonCount: number;
  triggeredSummonThresholds: Set<number>;
  dead: boolean;
};

type ProjectileEntity = ProjectileSimulationView & {
  x: number;
  y: number;
  stats: TowerStats;
};

export type SimulationCommandResult = Readonly<{
  ok: boolean;
  error: CampaignError | "invalid_phase" | "pulse_used" | null;
}>;

export type SimulationCommand =
  | Readonly<{ type: "build"; padId: number; towerType: TowerType }>
  | Readonly<{ type: "upgrade"; padId: number }>
  | Readonly<{ type: "sell"; padId: number }>
  | Readonly<{ type: "start_wave" }>
  | Readonly<{ type: "set_paused"; paused: boolean }>
  | Readonly<{ type: "toggle_speed" }>
  | Readonly<{ type: "use_pulse" }>;

export type RecordedSimulationCommand = Readonly<{
  tick: number;
  command: SimulationCommand;
}>;

export type SimulationReplay = Readonly<{
  version: 1;
  rulesId: string;
  initialCampaign: CampaignState;
  completedTicks: number;
  commands: readonly RecordedSimulationCommand[];
}>;

/**
 * Canonical headless match simulation. Phaser is deliberately absent: callers
 * render the read-only view and translate domain events into visual effects.
 */
export class GameSimulation {
  private campaign: CampaignState;
  private readonly initialCampaign: CampaignState;
  private readonly rules: SimulationRules;
  private readonly path: PathMetrics;
  private phase: SimulationPhase;
  private paused = false;
  private speed: 1 | 2 = 1;
  private readonly towers = new Map<number, TowerEntity>();
  private enemies: EnemyEntity[] = [];
  private readonly enemiesById = new Map<number, EnemyEntity>();
  private projectiles: ProjectileEntity[] = [];
  private wavePlan: WavePlan | null = null;
  private waveElapsedMs = 0;
  private countdownRemainingMs = 0;
  private simulationTimeMs = 0;
  private fixedStepAccumulatorMs = 0;
  private completedTicks = 0;
  private nextSpawnIndex = 0;
  private pulseAvailable = true;
  private waveStartLives = 0;
  private waveCheckpoint: CampaignState | null = null;
  private lastCheckpointDurationMs = 0;
  private activeDurationMs: number;
  private waveResolvedCount = 0;
  private waveTotalCount = 0;
  private nextDynamicEnemyId = 1;
  private lastKillHapticAtMs = -1_000;
  private lastHitBurstAtMs = -1_000;
  private nextProjectileId = 1;
  private events: SimulationEvent[] = [];
  private readonly recordedCommands: RecordedSimulationCommand[] = [];
  private readonly pointScratch: MutablePoint = { x: 0, y: 0 };

  constructor(campaign: CampaignState, rules: SimulationRules = DEFAULT_SIMULATION_RULES) {
    this.campaign = campaign;
    this.initialCampaign = campaign;
    this.rules = rules;
    this.path = createPathMetrics(rules.routePoints);
    this.activeDurationMs = campaign.activeDurationMs;
    this.phase = campaign.lives <= 0
      ? "gameover"
      : rules.isComplete(campaign.completedWave)
        ? "victory"
        : "setup";
    this.syncTowerEntities();
  }

  getRules(): SimulationRules {
    return this.rules;
  }

  getCampaign(): CampaignState {
    this.syncCampaignDuration();
    return this.campaign;
  }

  getCurrentWavePlan(): WavePlan {
    const nextWave = this.rules.finalWave === null
      ? this.campaign.completedWave + 1
      : Math.min(this.rules.finalWave, this.campaign.completedWave + 1);
    return this.rules.createWavePlan(nextWave);
  }

  getCompletedTicks(): number {
    return this.completedTicks;
  }

  readView(): SimulationView {
    return {
      campaign: this.campaign,
      phase: this.phase,
      paused: this.paused,
      speed: this.speed,
      simulationTimeMs: this.simulationTimeMs,
      currentWave: this.campaign.completedWave + 1,
      wavePlan: this.wavePlan,
      countdownRemainingMs: this.countdownRemainingMs,
      pulseAvailable: this.pulseAvailable,
      waveResolvedCount: this.waveResolvedCount,
      waveTotalCount: this.waveTotalCount,
      enemies: this.enemies,
      projectiles: this.projectiles,
    };
  }

  createSnapshot(): SimulationSnapshot {
    this.syncCampaignDuration();
    const view = this.readView();
    return Object.freeze({
      rulesId: this.rules.id,
      completedTicks: this.completedTicks,
      campaign: view.campaign,
      phase: view.phase,
      paused: view.paused,
      speed: view.speed,
      simulationTimeMs: view.simulationTimeMs,
      currentWave: view.currentWave,
      countdownRemainingMs: view.countdownRemainingMs,
      pulseAvailable: view.pulseAvailable,
      waveResolvedCount: view.waveResolvedCount,
      waveTotalCount: view.waveTotalCount,
      enemies: Object.freeze(view.enemies.map((enemy) => Object.freeze({
        id: enemy.id,
        type: enemy.type,
        x: enemy.x,
        y: enemy.y,
        progress: enemy.progress,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        shield: enemy.shield,
        maxShield: enemy.maxShield,
        slowed: enemy.slowed,
        stunned: enemy.stunned,
        burning: enemy.burning,
        elite: enemy.elite,
        bossTier: enemy.bossTier,
        enraged: enemy.enraged,
        physicalResistance: enemy.physicalResistance,
        magicResistance: enemy.magicResistance,
      }))),
      projectiles: Object.freeze(view.projectiles.map((projectile) => Object.freeze({
        id: projectile.id,
        x: projectile.x,
        y: projectile.y,
        originPadId: projectile.originPadId,
        targetId: projectile.targetId,
        towerType: projectile.towerType,
      }))),
    });
  }

  exportReplay(): SimulationReplay {
    return Object.freeze({
      version: 1,
      rulesId: this.rules.id,
      initialCampaign: this.initialCampaign,
      completedTicks: this.completedTicks,
      commands: Object.freeze(this.recordedCommands.map((entry) => Object.freeze({
        tick: entry.tick,
        command: Object.freeze({ ...entry.command }),
      }))),
    });
  }

  executeCommand(command: SimulationCommand): SimulationCommandResult {
    if (command.type === "build") return this.build(command.padId, command.towerType);
    if (command.type === "upgrade") return this.upgrade(command.padId);
    if (command.type === "sell") return this.sell(command.padId);
    if (command.type === "start_wave") return this.startWave() ? COMMAND_SUCCESS : commandFailure("invalid_phase");
    if (command.type === "set_paused") return this.setPaused(command.paused) ? COMMAND_SUCCESS : commandFailure("invalid_phase");
    if (command.type === "toggle_speed") {
      if (this.phase === "gameover" || this.phase === "victory") return commandFailure("invalid_phase");
      this.toggleSpeed();
      return COMMAND_SUCCESS;
    }
    return this.usePulse();
  }

  drainEvents(): readonly SimulationEvent[] {
    if (this.events.length === 0) return Object.freeze([]);
    const drained = Object.freeze(this.events);
    this.events = [];
    return drained;
  }

  build(padId: number, type: TowerType): SimulationCommandResult {
    if (this.phase !== "setup") return commandFailure("invalid_phase");
    const result = buildTower(this.campaign, padId, type);
    if (!result.ok) return commandFailure(result.error);
    this.campaign = result.state;
    this.syncTowerEntities();
    this.emitPersist(this.campaign);
    this.recordCommand({ type: "build", padId, towerType: type });
    return COMMAND_SUCCESS;
  }

  upgrade(padId: number): SimulationCommandResult {
    if (this.phase !== "setup") return commandFailure("invalid_phase");
    const result = upgradeTower(this.campaign, padId);
    if (!result.ok) return commandFailure(result.error);
    this.campaign = result.state;
    this.syncTowerEntities();
    this.emitPersist(this.campaign);
    this.recordCommand({ type: "upgrade", padId });
    return COMMAND_SUCCESS;
  }

  sell(padId: number): SimulationCommandResult {
    if (this.phase !== "setup") return commandFailure("invalid_phase");
    const result = sellTower(this.campaign, padId);
    if (!result.ok) return commandFailure(result.error);
    this.campaign = result.state;
    this.syncTowerEntities();
    this.emitPersist(this.campaign);
    this.recordCommand({ type: "sell", padId });
    return COMMAND_SUCCESS;
  }

  startWave(): boolean {
    if (this.phase !== "setup") return false;
    if (this.rules.isComplete(this.campaign.completedWave)) return false;
    this.syncCampaignDuration();
    this.emitPersist(this.campaign);
    this.waveCheckpoint = this.campaign;
    this.lastCheckpointDurationMs = this.activeDurationMs;
    this.wavePlan = this.rules.createWavePlan(this.campaign.completedWave + 1);
    this.waveElapsedMs = 0;
    this.countdownRemainingMs = COUNTDOWN_MS;
    this.fixedStepAccumulatorMs = 0;
    this.nextSpawnIndex = 0;
    this.waveResolvedCount = 0;
    this.waveTotalCount = this.wavePlan.spawns.length;
    this.nextDynamicEnemyId = this.wavePlan.wave * 10_000 + this.wavePlan.spawns.length + 100;
    this.waveStartLives = this.campaign.lives;
    this.pulseAvailable = true;
    for (const tower of this.towers.values()) tower.cooldownMs = 180;
    this.phase = "countdown";
    if (this.wavePlan.hasBoss) this.events.push({ type: "haptic", kind: "heavy" });
    this.recordCommand({ type: "start_wave" });
    return true;
  }

  setPaused(value: boolean): boolean {
    if (this.phase === "gameover" || this.phase === "victory" || this.paused === value) return false;
    this.paused = value;
    this.recordCommand({ type: "set_paused", paused: value });
    return true;
  }

  toggleSpeed(): 1 | 2 {
    if (this.phase === "gameover" || this.phase === "victory") return this.speed;
    this.speed = this.speed === 1 ? 2 : 1;
    this.events.push({ type: "haptic", kind: "light" });
    this.recordCommand({ type: "toggle_speed" });
    return this.speed;
  }

  usePulse(): SimulationCommandResult {
    if (this.phase !== "wave" || this.enemies.length === 0 || !this.pulseAvailable) {
      return commandFailure("pulse_used");
    }
    this.pulseAvailable = false;
    const damage = 7 + (this.wavePlan?.wave ?? 1) * 1.5;
    for (const enemy of [...this.enemies]) {
      const control = applyControlResistance(0.1, 1_500, enemy.controlResistance);
      enemy.stunUntilMs = Math.max(enemy.stunUntilMs, this.simulationTimeMs + control.durationMs);
      this.damageEnemy(enemy, damage, "arcane");
    }
    this.events.push({ type: "pulse" }, { type: "haptic", kind: "medium" });
    this.recordCommand({ type: "use_pulse" });
    return COMMAND_SUCCESS;
  }

  advance(realDeltaMs: number): void {
    if (this.paused || this.phase === "setup" || this.phase === "gameover" || this.phase === "victory") return;
    let remainingRealMs = Math.min(250, Math.max(0, Number(realDeltaMs) || 0));
    while (remainingRealMs > TIME_EPSILON_MS) {
      const simulationNeededMs = FIXED_STEP_MS - this.fixedStepAccumulatorMs;
      const realSliceMs = Math.min(remainingRealMs, simulationNeededMs / this.speed);
      this.activeDurationMs += realSliceMs;
      this.fixedStepAccumulatorMs += realSliceMs * this.speed;
      remainingRealMs -= realSliceMs;
      if (this.fixedStepAccumulatorMs + TIME_EPSILON_MS < FIXED_STEP_MS) continue;
      this.fixedStepAccumulatorMs = Math.max(0, this.fixedStepAccumulatorMs - FIXED_STEP_MS);
      this.step(FIXED_STEP_MS);
      this.completedTicks += 1;
      if (this.shouldStopAdvancing()) break;
    }
    this.persistWaveDurationCheckpoint();
  }

  private step(deltaMs: number): void {
    this.simulationTimeMs += deltaMs;
    if (this.phase === "countdown") {
      this.countdownRemainingMs = Math.max(0, this.countdownRemainingMs - deltaMs);
      if (this.countdownRemainingMs <= 0) this.phase = "wave";
      return;
    }

    this.waveElapsedMs += deltaMs;
    this.spawnScheduledEnemies();
    this.updateEnemies(deltaMs);
    if (this.phase !== "wave") return;
    this.updateTowers(deltaMs);
    this.updateProjectiles(deltaMs);
    this.checkWaveResolution();
  }

  private shouldStopAdvancing(): boolean {
    return this.phase === "gameover" || this.phase === "victory" || this.phase === "setup";
  }

  private syncTowerEntities(): void {
    const retained = new Set<number>();
    for (const placement of this.campaign.towers) {
      retained.add(placement.padId);
      const current = this.towers.get(placement.padId);
      if (current && current.placement.type === placement.type && current.placement.level === placement.level) {
        current.placement = placement;
      } else {
        this.towers.set(placement.padId, { placement, cooldownMs: 180 });
      }
    }
    for (const padId of this.towers.keys()) {
      if (!retained.has(padId)) this.towers.delete(padId);
    }
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
    const point = samplePointAtDistance(this.path, progress, this.pointScratch);
    const maxShield = Math.round(spawn.maxHp * spawn.shieldRatio);
    const entity: EnemyEntity = {
      id: spawn.id,
      type: spawn.type,
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
      stunned: false,
      burning: false,
      enraged: false,
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
    this.enemies.push(entity);
    this.enemiesById.set(entity.id, entity);
    if (dynamic) this.waveTotalCount += 1;
    if (spawn.type === "boss" || spawn.type === "titan") {
      this.events.push({ type: "boss_spawned" }, { type: "haptic", kind: "heavy" });
    }
  }

  private updateEnemies(deltaMs: number): void {
    // Spawn order is gameplay-visible for simultaneous burns and healer casts.
    let index = 0;
    while (index < this.enemies.length) {
      const enemy = this.enemies[index];
      if (!enemy || enemy.dead) {
        index += 1;
        continue;
      }
      enemy.burning = enemy.burnUntilMs > this.simulationTimeMs;
      if (enemy.burning) this.damageEnemy(enemy, enemy.burnDamagePerSecond * (deltaMs / 1_000), "fire", false);
      if (enemy.dead) continue;
      enemy.stunned = enemy.stunUntilMs > this.simulationTimeMs;

      if (enemy.healingRadius > 0 && isEnemyAbilityReady(this.simulationTimeMs, enemy.stunUntilMs, enemy.lastHealAtMs)) {
        enemy.lastHealAtMs = this.simulationTimeMs + 2_800;
        const targets = selectHealingTargets(enemy, this.enemies, enemy.healingRadius, 2);
        const healedTargets: Array<Readonly<{ id: number; x: number; y: number; amount: number }>> = [];
        for (const candidate of targets) {
          const target = this.enemiesById.get(candidate.id);
          if (!target || target.dead) continue;
          const healed = Math.min(target.maxHp - target.hp, Math.max(1, target.maxHp * enemy.healingRatio));
          target.hp += healed;
          healedTargets.push(Object.freeze({ id: target.id, x: target.x, y: target.y, amount: healed }));
        }
        if (healedTargets.length > 0) {
          this.events.push({ type: "enemy_healed", casterId: enemy.id, targets: Object.freeze(healedTargets) });
        }
      }

      enemy.slowed = enemy.slowUntilMs > this.simulationTimeMs;
      enemy.slowFactor = enemy.slowed ? enemy.slowFactor : 1;
      enemy.enraged = (enemy.type === "boss" || enemy.type === "titan") && enemy.hp / enemy.maxHp <= 0.4;
      if (!enemy.stunned) {
        enemy.progress += enemy.speed * (enemy.enraged ? 1.28 : 1) * enemy.slowFactor * (deltaMs / 1_000);
      }
      if (enemy.progress >= this.path.totalLength) {
        this.leakEnemy(enemy);
        if (this.phase !== "wave") return;
        continue;
      }
      const point = samplePointAtDistance(this.path, enemy.progress, this.pointScratch);
      enemy.x = point.x;
      enemy.y = point.y;
      index += 1;
    }
  }

  private updateTowers(deltaMs: number): void {
    for (const tower of this.towers.values()) {
      tower.cooldownMs -= deltaMs;
      if (tower.cooldownMs > 0) continue;
      const point = this.rules.buildPads[tower.placement.padId];
      if (!point) continue;
      const stats = getTowerStats(tower.placement.type, tower.placement.level);
      const clusterRadius = tower.placement.type === "storm" ? stats.chainRange : stats.splashRadius;
      const target = chooseTowerTarget(tower.placement.type, point, stats.range, this.enemies, clusterRadius);
      if (!target) {
        tower.cooldownMs = 80;
        continue;
      }
      this.projectiles.push({
        id: this.nextProjectileId,
        x: point.x,
        y: point.y - 8,
        originPadId: tower.placement.padId,
        targetId: target.id,
        towerType: tower.placement.type,
        stats,
      });
      this.nextProjectileId += 1;
      tower.cooldownMs += stats.fireRateMs;
    }
  }

  private updateProjectiles(deltaMs: number): void {
    // Resolve older projectiles first to preserve the original combat balance.
    let index = 0;
    while (index < this.projectiles.length) {
      const projectile = this.projectiles[index];
      if (!projectile) {
        index += 1;
        continue;
      }
      const candidate = this.enemiesById.get(projectile.targetId);
      const target = candidate && !candidate.dead ? candidate : null;
      if (!target) {
        this.removeProjectileAt(index);
        continue;
      }
      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const distance = Math.hypot(dx, dy);
      const movement = projectile.stats.projectileSpeed * (deltaMs / 1_000);
      if (distance <= Math.max(movement, 9)) {
        this.resolveProjectileHit(projectile, target);
        this.removeProjectileAt(index);
        continue;
      }
      projectile.x += (dx / distance) * movement;
      projectile.y += (dy / distance) * movement;
      index += 1;
    }
  }

  private resolveProjectileHit(projectile: ProjectileEntity, target: EnemyEntity): void {
    const majorTarget = target.type === "boss" || target.type === "titan";
    const burstCooldownMs = majorTarget ? 30 : projectile.towerType === "ranger" ? 70 : 50;
    if (this.simulationTimeMs - this.lastHitBurstAtMs >= burstCooldownMs) {
      this.lastHitBurstAtMs = this.simulationTimeMs;
      this.events.push({
        type: "projectile_hit",
        towerType: projectile.towerType,
        targetId: target.id,
        x: target.x,
        y: target.y,
        radius: projectile.stats.splashRadius || 14,
        major: majorTarget,
      });
    }

    if (projectile.towerType === "storm") {
      const victims = chooseChainTargets(target, this.enemies, projectile.stats.chainTargets, projectile.stats.chainRange)
        .map((candidate) => this.enemiesById.get(candidate.id))
        .filter((enemy): enemy is EnemyEntity => Boolean(enemy && !enemy.dead));
      let previous: EnemyEntity = target;
      victims.forEach((victim, index) => {
        if (index > 0) {
          this.events.push({
            type: "lightning",
            from: Object.freeze({ x: previous.x, y: previous.y }),
            to: Object.freeze({ x: victim.x, y: victim.y }),
            intensity: victims.length - index,
          });
        }
        const bossMultiplier = victim.type === "boss" || victim.type === "titan" ? projectile.stats.bossDamageMultiplier : 1;
        this.damageEnemy(victim, projectile.stats.damage * Math.pow(0.72, index) * bossMultiplier, projectile.stats.damageKind);
        previous = victim;
      });
      return;
    }

    const victims = projectile.stats.splashRadius > 0
      ? this.enemies.filter((enemy) => squaredDistance(enemy, target) <= projectile.stats.splashRadius ** 2)
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

  private damageEnemy(enemy: EnemyEntity, amount: number, kind: DamageKind, showText = true): void {
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
      this.events.push({
        type: "enemy_damaged",
        enemyId: enemy.id,
        x: enemy.x,
        y: enemy.y,
        damage,
        absorbed,
      });
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

  private summonTitanShades(titan: EnemyEntity): void {
    if (!this.wavePlan || titan.summonCount <= 0) return;
    const definition = ENEMY_DEFINITIONS.shade;
    const hpMultiplier = this.rules.getWaveHealthMultiplier(this.wavePlan.wave) * 0.78;
    this.events.push({ type: "titan_summon", x: titan.x, y: titan.y });
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
    this.events.push({ type: "haptic", kind: "medium" });
  }

  private killEnemy(enemy: EnemyEntity): void {
    if (enemy.dead) return;
    enemy.dead = true;
    this.removeEnemy(enemy);
    this.waveResolvedCount += 1;
    this.campaign = awardEnemyKill(this.campaign, enemy.reward);
    this.events.push({
      type: "enemy_killed",
      enemyId: enemy.id,
      enemyType: enemy.type,
      x: enemy.x,
      y: enemy.y,
      reward: enemy.reward,
      elite: enemy.elite,
      bossTier: enemy.bossTier,
      shielded: enemy.maxShield > 0,
    });
    if (enemy.type === "boss" || enemy.type === "titan") {
      this.events.push({ type: "haptic", kind: "heavy" });
      this.lastKillHapticAtMs = this.simulationTimeMs;
    } else if (this.simulationTimeMs - this.lastKillHapticAtMs >= 300) {
      this.events.push({ type: "haptic", kind: enemy.elite ? "medium" : "light" });
      this.lastKillHapticAtMs = this.simulationTimeMs;
    }
  }

  private leakEnemy(enemy: EnemyEntity): void {
    if (enemy.dead) return;
    enemy.dead = true;
    this.removeEnemy(enemy);
    this.waveResolvedCount += 1;
    this.campaign = applyLeakDamage(this.campaign, enemy.leakDamage);
    this.events.push(
      { type: "enemy_leaked", enemyId: enemy.id, x: enemy.x, y: enemy.y, damage: enemy.leakDamage },
      { type: "haptic", kind: "heavy" },
    );
    this.persistWaveDurationCheckpoint(true);
    if (this.campaign.lives <= 0) this.endRun("gameover");
  }

  private removeEnemy(enemy: EnemyEntity): void {
    const index = this.enemies.indexOf(enemy);
    if (index >= 0) this.enemies.splice(index, 1);
    this.enemiesById.delete(enemy.id);
  }

  private removeProjectileAt(index: number): void {
    this.projectiles.splice(index, 1);
  }

  private checkWaveResolution(): void {
    if (
      this.phase !== "wave"
      || !this.wavePlan
      || this.nextSpawnIndex < this.wavePlan.spawns.length
      || this.enemies.length > 0
    ) return;

    this.projectiles.length = 0;
    const flawlessBonus = this.campaign.lives === this.waveStartLives ? 10 : 0;
    const totalBonus = this.wavePlan.clearBonus + flawlessBonus;
    this.syncCampaignDuration();
    const result = completeWave(this.campaign, this.wavePlan.wave, totalBonus);
    if (!result.ok) return;
    this.campaign = result.state;
    const repairAmount = this.rules.getBossRepair(this.wavePlan.wave);
    const livesBeforeRepair = this.campaign.lives;
    if (repairAmount > 0) this.campaign = repairLives(this.campaign, repairAmount);
    const repairedLives = this.campaign.lives - livesBeforeRepair;
    this.events.push(
      { type: "wave_cleared", wave: this.wavePlan.wave, bonus: totalBonus, repairedLives },
      { type: "persist", campaign: this.campaign },
      { type: "haptic", kind: "success" },
    );
    this.wavePlan = null;
    this.waveCheckpoint = null;
    this.fixedStepAccumulatorMs = 0;
    this.phase = this.rules.isComplete(this.campaign.completedWave) ? "victory" : "setup";
    this.pulseAvailable = true;
    if (this.phase === "victory") this.endRun("victory");
  }

  private endRun(outcome: SimulationOutcome): void {
    if (this.phase === "gameover" || (this.phase === "victory" && outcome !== "victory")) return;
    this.phase = outcome;
    this.syncCampaignDuration();
    this.paused = false;
    this.wavePlan = null;
    this.waveCheckpoint = null;
    this.projectiles.length = 0;
    if (outcome === "gameover") {
      this.enemies.length = 0;
      this.enemiesById.clear();
      this.events.push({ type: "haptic", kind: "error" });
    } else {
      this.events.push({ type: "haptic", kind: "success" });
    }
    this.events.push({ type: "terminal", outcome, campaign: this.campaign });
  }

  private persistWaveDurationCheckpoint(force = false): void {
    if (!this.waveCheckpoint || (!force && this.activeDurationMs - this.lastCheckpointDurationMs < 1_000)) return;
    this.waveCheckpoint = createWaveCheckpoint(this.waveCheckpoint, this.campaign, this.activeDurationMs);
    this.lastCheckpointDurationMs = this.activeDurationMs;
    this.emitPersist(this.waveCheckpoint);
  }

  private syncCampaignDuration(): void {
    const duration = Math.round(this.activeDurationMs);
    if (duration !== this.campaign.activeDurationMs) this.campaign = recordActiveDuration(this.campaign, duration);
  }

  private emitPersist(campaign: CampaignState): void {
    this.events.push({ type: "persist", campaign });
  }

  private recordCommand(command: SimulationCommand): void {
    this.recordedCommands.push(Object.freeze({
      tick: this.completedTicks,
      command: Object.freeze({ ...command }),
    }));
  }
}

export function replaySimulation(replay: SimulationReplay, rules: SimulationRules): GameSimulation {
  if (replay.version !== 1 || replay.rulesId !== rules.id) throw new Error("Replay rules do not match.");
  if (!Number.isSafeInteger(replay.completedTicks) || replay.completedTicks < 0) throw new Error("Replay tick count is invalid.");
  const simulation = new GameSimulation(replay.initialCampaign, rules);
  let previousTick = 0;
  for (const entry of replay.commands) {
    if (!Number.isSafeInteger(entry.tick) || entry.tick < previousTick || entry.tick > replay.completedTicks) {
      throw new Error("Replay command order is invalid.");
    }
    advanceReplayToTick(simulation, entry.tick);
    const result = simulation.executeCommand(entry.command);
    if (!result.ok) throw new Error(`Replay command was rejected: ${entry.command.type}.`);
    previousTick = entry.tick;
  }
  advanceReplayToTick(simulation, replay.completedTicks);
  return simulation;
}

function advanceReplayToTick(simulation: GameSimulation, targetTick: number): void {
  while (simulation.getCompletedTicks() < targetTick) {
    const before = simulation.getCompletedTicks();
    simulation.advance(FIXED_STEP_MS / simulation.readView().speed);
    if (simulation.getCompletedTicks() === before) throw new Error("Replay cannot advance in the current phase.");
  }
}

const COMMAND_SUCCESS: SimulationCommandResult = Object.freeze({ ok: true, error: null });

function commandFailure(error: SimulationCommandResult["error"]): SimulationCommandResult {
  return Object.freeze({ ok: false, error });
}

function squaredDistance(
  left: Readonly<{ x: number; y: number }>,
  right: Readonly<{ x: number; y: number }>,
): number {
  return Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2);
}

function estimateBaseHealthMultiplier(plan: WavePlan): number {
  const ratios = plan.spawns
    .filter((spawn) => !spawn.elite && spawn.type !== "boss" && spawn.type !== "titan")
    .map((spawn) => spawn.maxHp / ENEMY_DEFINITIONS[spawn.type].baseHp)
    .filter((ratio) => Number.isFinite(ratio) && ratio > 0);
  return ratios.length > 0 ? Math.max(1, Math.min(...ratios)) : 1;
}
