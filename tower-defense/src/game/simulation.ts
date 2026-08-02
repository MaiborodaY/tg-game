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
import {
  AVALANCHE_HEALING_INTERRUPT_MS,
  calculateNorthernAvalancheImpact,
  getFrostArmorDamageMultiplier,
  isProgressInsideNorthernAvalancheZone,
} from "./northernPassMechanics.ts";
import { CLASSIC_CAMPAIGN_LEVEL, type LevelDefinition, type ModeRuleset } from "./content.ts";
import {
  HERO_ABILITY_RECHARGE_KILLS,
  HERO_AWAKENINGS,
  getHeroStats,
  isHeroAwakened,
} from "./heroes.ts";
import {
  HERO_COMBAT_RULESET_SUFFIX,
  HERO_COMBAT_TIMING,
  HERO_FRONTLINE_RATIOS,
  calculateHeroDamageTaken,
  getEnemyHeroAttackProfile,
  getEnemyHeroBlockCost,
  getEnemyHeroFirstAttackDelayMs,
  getHeroFrontlineProgress,
  getTorenHeroCombatStats,
} from "./heroCombat.ts";
import {
  createPathMetrics,
  getPointAtDistance,
  samplePointAtDistance,
  type MutablePoint,
  type PathMetrics,
} from "./pathing.ts";
import {
  applyLeakDamage,
  awardEnemyKill,
  buildTower,
  completeWave,
  createWaveCheckpoint,
  moveHero as moveCampaignHero,
  recordActiveDuration,
  repairLives,
  sellTower,
  upgradeHero as upgradeCampaignHero,
  upgradeTower,
} from "./state.ts";
import type {
  CampaignAct,
  CampaignError,
  CampaignState,
  DamageKind,
  EnemyType,
  EnemyVariant,
  HeroId,
  HeroLevel,
  NorthernAvalancheZoneId,
  NorthernPassWavePlan,
  NorthernRouteVariantId,
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
  heroAnchors: readonly Point[];
  heroCombat: "toren-frontline-v1" | null;
  heroAwakeningWave: number;
  finalWave: number | null;
  isComplete(completedWave: number): boolean;
  createWavePlan(wave: number): WavePlan;
  getBossRepair(wave: number): number;
  getWaveHealthMultiplier(wave: number): number;
}>;

export const DEFAULT_SIMULATION_RULES: SimulationRules = Object.freeze({
  id: "forest-campaign:heroes-v3",
  routePoints: ROUTE_POINTS,
  buildPads: BUILD_PADS,
  heroAnchors: CLASSIC_CAMPAIGN_LEVEL.heroAnchors,
  heroCombat: null,
  heroAwakeningWave: 20,
  finalWave: FINAL_WAVE,
  isComplete: (completedWave) => completedWave >= FINAL_WAVE,
  createWavePlan,
  getBossRepair,
  getWaveHealthMultiplier,
});

export type SimulationRuleOptions = Readonly<{
  heroCombat?: "toren-frontline-v1" | null;
}>;

export function createSimulationRules(
  level: LevelDefinition,
  mode: ModeRuleset,
  options: SimulationRuleOptions = {},
): SimulationRules {
  const finalWave = mode.getFinalWave(level);
  const heroCombat = options.heroCombat ?? null;
  const path = heroCombat ? createPathMetrics(level.route) : null;
  const heroAnchors = path
    ? Object.freeze(HERO_FRONTLINE_RATIOS.map((_, anchorId) => getPointAtDistance(
        path,
        getHeroFrontlineProgress(path.totalLength, anchorId) ?? 0,
      )))
    : level.heroAnchors;
  return Object.freeze({
    id: heroCombat
      ? `${level.id}:${mode.id}:v${level.contentVersion}:${HERO_COMBAT_RULESET_SUFFIX}`
      : `${level.id}:${mode.id}:v${level.contentVersion}:heroes-v3`,
    routePoints: level.route,
    buildPads: level.buildPads,
    heroAnchors,
    heroCombat,
    heroAwakeningWave: level.progression.awakeningWave,
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
  variant: EnemyVariant;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  frostArmor: number;
  maxFrostArmor: number;
  stunned: boolean;
  blocked: boolean;
  burning: boolean;
  elite: boolean;
  bossTier: CampaignAct;
  enraged: boolean;
}>;

export type HeroBarrierSimulationView = Readonly<{
  progress: number;
  x: number;
  y: number;
  remainingMs: number;
  capacity: number;
  capturedCount: number;
  capturedEnemyIds: readonly number[];
}>;

export type ProjectileSimulationView = Readonly<{
  id: number;
  x: number;
  y: number;
  originPadId: number;
  targetId: number;
  towerType: TowerType;
}>;

export type HeroSimulationView = Readonly<{
  id: HeroId;
  level: HeroLevel;
  anchorId: number;
  x: number;
  y: number;
  attackCooldownMs: number;
  abilityAvailable: boolean;
  awakened: boolean;
  abilityCharges: number;
  maxAbilityCharges: number;
  rechargeKills: number;
  rechargeThreshold: number;
  bonusChargeEarned: boolean;
  markedEnemyId: number | null;
  markedEnemyIds: readonly number[];
  markRemainingMs: number;
  bannerActive: boolean;
  bannerRemainingMs: number;
  barrier: HeroBarrierSimulationView | null;
  frontline: HeroFrontlineSimulationView | null;
}>;

export type HeroFrontlineStatus = "ready" | "deploying" | "holding" | "fighting" | "knocked_out";

export type HeroFrontlineSimulationView = Readonly<{
  status: HeroFrontlineStatus;
  progress: number;
  targetProgress: number;
  hp: number;
  maxHp: number;
  regenActive: boolean;
  knockoutRemainingMs: number;
  blockUsed: number;
  blockCapacity: number;
  blockedEnemyIds: readonly number[];
}>;

export type NorthernAvalancheZoneSimulationView = Readonly<{
  id: NorthernAvalancheZoneId;
  startRatio: number;
  endRatio: number;
  targetCount: number;
  canTrigger: boolean;
}>;

export type NorthernPassSimulationView = Readonly<{
  routeVariantId: NorthernRouteVariantId;
  routePoints: readonly Point[];
  forecastDangerZoneId: NorthernAvalancheZoneId;
  avalanche: Readonly<{
    maxCharges: number;
    chargesRemaining: number;
    available: boolean;
    zones: readonly NorthernAvalancheZoneSimulationView[];
  }>;
}>;

export type SimulationView = Readonly<{
  campaign: CampaignState;
  phase: SimulationPhase;
  paused: boolean;
  speed: 1 | 2;
  simulationTimeMs: number;
  currentWave: number;
  wavePlan: WavePlan | null;
  northernPass: NorthernPassSimulationView | null;
  countdownRemainingMs: number;
  hero: HeroSimulationView;
  heroAbilityAvailable: boolean;
  pulseAvailable: boolean;
  gateShield: number;
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
  northernPass: NorthernPassSimulationView | null;
  countdownRemainingMs: number;
  hero: HeroSimulationView;
  heroAbilityAvailable: boolean;
  pulseAvailable: boolean;
  gateShield: number;
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
      type: "hero_attack";
      heroId: HeroId;
      targetId: number;
      from: Point;
      to: Point;
      radius: number;
    }>
  | Readonly<{ type: "hero_moved"; heroId: HeroId; anchorId: number; x: number; y: number }>
  | Readonly<{ type: "hero_upgraded"; heroId: HeroId; level: HeroLevel }>
  | Readonly<{ type: "hero_frontline_arrived"; x: number; y: number }>
  | Readonly<{
      type: "enemy_attacked_hero";
      enemyId: number;
      x: number;
      y: number;
      damage: number;
      remainingHp: number;
    }>
  | Readonly<{ type: "hero_knocked_out"; x: number; y: number; returnInMs: number }>
  | Readonly<{ type: "hero_respawned"; x: number; y: number; hp: number }>
  | Readonly<{
      type: "hero_ability";
      heroId: HeroId;
      x: number;
      y: number;
      radius: number;
      targetId: number | null;
      targetIds: readonly number[];
      targetPoint: Point;
      durationMs: number;
    }>
  | Readonly<{ type: "hero_ability_recharged"; heroId: HeroId; charges: number }>
  | Readonly<{
      type: "hero_barrier_created";
      x: number;
      y: number;
      progress: number;
      radius: number;
      durationMs: number;
      capacity: number;
    }>
  | Readonly<{
      type: "hero_barrier_blocked";
      enemyId: number;
      x: number;
      y: number;
      durationMs: number;
    }>
  | Readonly<{ type: "gate_shield_absorbed"; amount: number; remaining: number }>
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
      frostAbsorbed: number;
    }>
  | Readonly<{ type: "frost_armor_broken"; enemyId: number; x: number; y: number }>
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
      enemyVariant: EnemyVariant;
      x: number;
      y: number;
      reward: number;
      elite: boolean;
      bossTier: CampaignAct;
      shielded: boolean;
      frostArmored: boolean;
    }>
  | Readonly<{ type: "enemy_leaked"; enemyId: number; x: number; y: number; damage: number; absorbed: number }>
  | Readonly<{ type: "wave_cleared"; wave: number; bonus: number; repairedLives: number }>
  | Readonly<{
      type: "northern_route_changed";
      wave: number;
      routeVariantId: NorthernRouteVariantId;
      routePoints: readonly Point[];
    }>
  | Readonly<{
      type: "northern_avalanche";
      zoneId: NorthernAvalancheZoneId;
      routeVariantId: NorthernRouteVariantId;
      chargesRemaining: number;
      impacts: readonly Readonly<{
        enemyId: number;
        x: number;
        y: number;
        frostArmorRemoved: number;
        stunDurationMs: number;
        healingInterrupted: boolean;
        boss: boolean;
      }>[];
    }>
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
  slowEffectFactor: number;
  slowFactor: number;
  burnUntilMs: number;
  burnDamagePerSecond: number;
  stunUntilMs: number;
  barrierUntilMs: number;
  blockedByHero: boolean;
  heroAttackCooldownMs: number;
  heroBlockStartedAtMs: number;
  heroBlockImmuneUntilMs: number;
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
  resistancePenetration: number;
};

type HeroBarrierEntity = {
  progress: number;
  x: number;
  y: number;
  untilMs: number;
  capacity: number;
  capturedEnemyIds: Set<number>;
};

type HeroFrontlineEntity = {
  status: HeroFrontlineStatus;
  progress: number;
  targetProgress: number;
  hp: number;
  maxHp: number;
  lastDamagedAtMs: number;
  knockoutUntilMs: number;
  moveSpeed: number;
  regenActive: boolean;
  blockedEnemyIds: Set<number>;
};

export type SimulationCommandResult = Readonly<{
  ok: boolean;
  error:
    | CampaignError
    | "invalid_phase"
    | "hero_ability_unavailable"
    | "hero_ability_target_required"
    | "invalid_hero_ability_target"
    | "pulse_used"
    | "invalid_avalanche_zone"
    | "avalanche_unavailable"
    | "avalanche_empty_zone"
    | null;
}>;

export type SimulationCommand =
  | Readonly<{ type: "build"; padId: number; towerType: TowerType }>
  | Readonly<{ type: "upgrade"; padId: number }>
  | Readonly<{ type: "sell"; padId: number }>
  | Readonly<{ type: "move_hero"; anchorId: number }>
  | Readonly<{ type: "upgrade_hero" }>
  | Readonly<{ type: "start_wave" }>
  | Readonly<{ type: "set_paused"; paused: boolean }>
  | Readonly<{ type: "toggle_speed" }>
  | Readonly<{ type: "use_hero_ability"; targetDistance?: number }>
  | Readonly<{ type: "trigger_northern_avalanche"; zoneId: NorthernAvalancheZoneId }>
  | Readonly<{ type: "use_pulse" }>;

export type RecordedSimulationCommand = Readonly<{
  tick: number;
  command: SimulationCommand;
}>;

export type SimulationReplay = Readonly<{
  version: 2;
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
  private path: PathMetrics;
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
  private heroAttackCooldownMs = 180;
  private heroAbilityCharges = 1;
  private heroAbilityRechargeKills = 0;
  private heroAbilityRechargeGranted = false;
  private markedEnemyIds: number[] = [];
  private markUntilMs = 0;
  private bannerUntilMs = 0;
  private heroBarrier: HeroBarrierEntity | null = null;
  private heroFrontline: HeroFrontlineEntity | null = null;
  private gateShield = 0;
  private northernAvalancheMaxCharges = 0;
  private northernAvalancheCharges = 0;
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
    this.heroFrontline = this.createHeroFrontline();
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

  private readHeroView(): HeroSimulationView {
    const point = this.getHeroPoint();
    const awakened = this.isCurrentHeroAwakened();
    const markedEnemyIds = this.markUntilMs > this.simulationTimeMs
      ? Object.freeze(this.markedEnemyIds.filter((id) => this.enemiesById.has(id)))
      : Object.freeze([] as number[]);
    const barrier = this.heroBarrier && this.heroBarrier.untilMs > this.simulationTimeMs
      ? Object.freeze({
          progress: this.heroBarrier.progress,
          x: this.heroBarrier.x,
          y: this.heroBarrier.y,
          remainingMs: this.heroBarrier.untilMs - this.simulationTimeMs,
          capacity: this.heroBarrier.capacity,
          capturedCount: this.heroBarrier.capturedEnemyIds.size,
          capturedEnemyIds: Object.freeze([...this.heroBarrier.capturedEnemyIds]),
        })
      : null;
    const frontlineStats = this.heroFrontline
      ? getTorenHeroCombatStats(this.campaign.hero.level)
      : null;
    const frontline = this.heroFrontline && frontlineStats
      ? Object.freeze({
          status: this.heroFrontline.status,
          progress: this.heroFrontline.progress,
          targetProgress: this.heroFrontline.targetProgress,
          hp: Math.max(0, this.heroFrontline.hp),
          maxHp: this.heroFrontline.maxHp,
          regenActive: this.heroFrontline.regenActive,
          knockoutRemainingMs: this.heroFrontline.status === "knocked_out"
            ? Math.max(0, this.heroFrontline.knockoutUntilMs - this.simulationTimeMs)
            : 0,
          blockUsed: this.getHeroFrontlineBlockUsed(),
          blockCapacity: frontlineStats.blockCapacity,
          blockedEnemyIds: Object.freeze([...this.heroFrontline.blockedEnemyIds].sort((a, b) => a - b)),
        })
      : null;
    const abilityAvailable = this.heroAbilityCharges > 0 && frontline?.status !== "knocked_out";
    return Object.freeze({
      ...this.campaign.hero,
      x: point.x,
      y: point.y,
      attackCooldownMs: Math.max(0, this.heroAttackCooldownMs),
      abilityAvailable,
      awakened,
      abilityCharges: this.heroAbilityCharges,
      maxAbilityCharges: awakened ? 2 : 1,
      rechargeKills: awakened ? Math.min(HERO_ABILITY_RECHARGE_KILLS, this.heroAbilityRechargeKills) : 0,
      rechargeThreshold: HERO_ABILITY_RECHARGE_KILLS,
      bonusChargeEarned: awakened && this.heroAbilityRechargeGranted,
      markedEnemyId: markedEnemyIds[0] ?? null,
      markedEnemyIds,
      markRemainingMs: markedEnemyIds.length > 0 ? this.markUntilMs - this.simulationTimeMs : 0,
      bannerActive: this.campaign.hero.id === "grak" && this.bannerUntilMs > this.simulationTimeMs,
      bannerRemainingMs: this.campaign.hero.id === "grak"
        ? Math.max(0, this.bannerUntilMs - this.simulationTimeMs)
        : 0,
      barrier,
      frontline,
    });
  }

  private getHeroPoint(): Point {
    if (this.heroFrontline) return getPointAtDistance(this.path, this.heroFrontline.progress);
    const anchors = this.rules.heroAnchors ?? CLASSIC_CAMPAIGN_LEVEL.heroAnchors;
    return anchors[this.campaign.hero.anchorId]
      ?? anchors[0]
      ?? Object.freeze({ x: 0, y: 0 });
  }

  private createHeroFrontline(): HeroFrontlineEntity | null {
    if (this.rules.heroCombat !== "toren-frontline-v1" || this.campaign.hero.id !== "toren") return null;
    const stats = getTorenHeroCombatStats(this.campaign.hero.level);
    const targetProgress = getHeroFrontlineProgress(this.path.totalLength, this.campaign.hero.anchorId) ?? 0;
    return {
      status: "ready",
      progress: targetProgress,
      targetProgress,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      lastDamagedAtMs: Number.NEGATIVE_INFINITY,
      knockoutUntilMs: 0,
      moveSpeed: HERO_COMBAT_TIMING.countdownMoveSpeed,
      regenActive: false,
      blockedEnemyIds: new Set<number>(),
    };
  }

  private isCurrentHeroAwakened(): boolean {
    return isHeroAwakened(
      this.campaign.hero.level,
      this.campaign.completedWave,
      this.rules.heroAwakeningWave ?? DEFAULT_SIMULATION_RULES.heroAwakeningWave,
    );
  }

  private readNorthernPassView(): NorthernPassSimulationView | null {
    const plan = this.wavePlan?.northernPass
      ?? (this.phase === "setup" ? this.getCurrentWavePlan().northernPass : undefined);
    if (!plan) return null;

    const active = Boolean(this.wavePlan?.northernPass) && this.phase === "wave";
    const maxCharges = this.wavePlan?.northernPass
      ? this.northernAvalancheMaxCharges
      : plan.avalancheCharges;
    const chargesRemaining = this.wavePlan?.northernPass
      ? this.northernAvalancheCharges
      : plan.avalancheCharges;
    const armed = active && chargesRemaining > 0;
    const zones = Object.freeze(plan.zones.map((zone) => {
      const targetCount = active
        ? this.enemies.filter((enemy) => (
            !enemy.dead
            && isProgressInsideNorthernAvalancheZone(enemy.progress, this.path.totalLength, zone.id)
          )).length
        : 0;
      return Object.freeze({
        ...zone,
        targetCount,
        canTrigger: armed && zone.id === plan.dangerZoneId && targetCount > 0,
      });
    }));
    return Object.freeze({
      routeVariantId: plan.routeVariantId,
      routePoints: plan.routePoints,
      forecastDangerZoneId: plan.dangerZoneId,
      avalanche: Object.freeze({
        maxCharges,
        chargesRemaining,
        available: armed,
        zones,
      }),
    });
  }

  readView(): SimulationView {
    const hero = this.readHeroView();
    return {
      campaign: this.campaign,
      phase: this.phase,
      paused: this.paused,
      speed: this.speed,
      simulationTimeMs: this.simulationTimeMs,
      currentWave: this.campaign.completedWave + 1,
      wavePlan: this.wavePlan,
      northernPass: this.readNorthernPassView(),
      countdownRemainingMs: this.countdownRemainingMs,
      hero,
      heroAbilityAvailable: hero.abilityAvailable,
      pulseAvailable: hero.abilityAvailable,
      gateShield: this.gateShield,
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
      northernPass: view.northernPass ? Object.freeze({
        ...view.northernPass,
        routePoints: Object.freeze(view.northernPass.routePoints.map((point) => Object.freeze({ ...point }))),
        avalanche: Object.freeze({
          ...view.northernPass.avalanche,
          zones: Object.freeze(view.northernPass.avalanche.zones.map((zone) => Object.freeze({ ...zone }))),
        }),
      }) : null,
      countdownRemainingMs: view.countdownRemainingMs,
      hero: Object.freeze({
        ...view.hero,
        frontline: view.hero.frontline ? Object.freeze({
          ...view.hero.frontline,
          blockedEnemyIds: Object.freeze([...view.hero.frontline.blockedEnemyIds]),
        }) : null,
      }),
      heroAbilityAvailable: view.heroAbilityAvailable,
      pulseAvailable: view.pulseAvailable,
      gateShield: view.gateShield,
      waveResolvedCount: view.waveResolvedCount,
      waveTotalCount: view.waveTotalCount,
      enemies: Object.freeze(view.enemies.map((enemy) => Object.freeze({
        id: enemy.id,
        type: enemy.type,
        variant: enemy.variant,
        x: enemy.x,
        y: enemy.y,
        progress: enemy.progress,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        shield: enemy.shield,
        maxShield: enemy.maxShield,
        frostArmor: enemy.frostArmor,
        maxFrostArmor: enemy.maxFrostArmor,
        slowed: enemy.slowed,
        stunned: enemy.stunned,
        blocked: enemy.blocked,
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
      version: 2,
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
    switch (command.type) {
      case "build": return this.build(command.padId, command.towerType);
      case "upgrade": return this.upgrade(command.padId);
      case "sell": return this.sell(command.padId);
      case "move_hero": return this.moveHero(command.anchorId);
      case "upgrade_hero": return this.upgradeHero();
      case "start_wave": return this.startWave() ? COMMAND_SUCCESS : commandFailure("invalid_phase");
      case "set_paused": return this.setPaused(command.paused) ? COMMAND_SUCCESS : commandFailure("invalid_phase");
      case "toggle_speed": {
        if (this.phase === "gameover" || this.phase === "victory") return commandFailure("invalid_phase");
        this.toggleSpeed();
        return COMMAND_SUCCESS;
      }
      case "use_hero_ability": return this.useHeroAbility(command.targetDistance);
      case "trigger_northern_avalanche": return this.triggerNorthernAvalanche(command.zoneId);
      case "use_pulse": return this.usePulse();
      default: return assertNeverCommand(command);
    }
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

  moveHero(anchorId: number): SimulationCommandResult {
    if (this.phase !== "setup") return commandFailure("invalid_phase");
    const result = moveCampaignHero(this.campaign, anchorId);
    if (!result.ok) return commandFailure(result.error);
    this.campaign = result.state;
    if (this.heroFrontline) {
      this.heroFrontline.targetProgress = getHeroFrontlineProgress(this.path.totalLength, anchorId) ?? 0;
      this.heroFrontline.progress = this.heroFrontline.targetProgress;
      this.heroFrontline.status = "ready";
    }
    const point = this.getHeroPoint();
    this.events.push(
      { type: "hero_moved", heroId: this.campaign.hero.id, anchorId, x: point.x, y: point.y },
      { type: "persist", campaign: this.campaign },
      { type: "haptic", kind: "light" },
    );
    this.recordCommand({ type: "move_hero", anchorId });
    return COMMAND_SUCCESS;
  }

  upgradeHero(): SimulationCommandResult {
    if (this.phase !== "setup") return commandFailure("invalid_phase");
    const result = upgradeCampaignHero(this.campaign);
    if (!result.ok) return commandFailure(result.error);
    this.campaign = result.state;
    if (this.heroFrontline) {
      const stats = getTorenHeroCombatStats(this.campaign.hero.level);
      this.heroFrontline.maxHp = stats.maxHp;
      this.heroFrontline.hp = stats.maxHp;
    }
    this.events.push(
      { type: "hero_upgraded", heroId: this.campaign.hero.id, level: this.campaign.hero.level },
      { type: "persist", campaign: this.campaign },
      { type: "haptic", kind: "success" },
    );
    this.recordCommand({ type: "upgrade_hero" });
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
    const northernPass = this.wavePlan.northernPass;
    this.path = createPathMetrics(northernPass?.routePoints ?? this.rules.routePoints);
    this.northernAvalancheMaxCharges = northernPass?.avalancheCharges ?? 0;
    this.northernAvalancheCharges = this.northernAvalancheMaxCharges;
    this.waveElapsedMs = 0;
    this.countdownRemainingMs = COUNTDOWN_MS;
    this.fixedStepAccumulatorMs = 0;
    this.nextSpawnIndex = 0;
    this.waveResolvedCount = 0;
    this.waveTotalCount = this.wavePlan.spawns.length;
    this.nextDynamicEnemyId = this.wavePlan.wave * 10_000 + this.wavePlan.spawns.length + 100;
    this.waveStartLives = this.campaign.lives;
    this.heroAttackCooldownMs = 180;
    this.heroAbilityCharges = 1;
    this.heroAbilityRechargeKills = 0;
    this.heroAbilityRechargeGranted = false;
    this.markedEnemyIds = [];
    this.markUntilMs = 0;
    this.bannerUntilMs = 0;
    this.heroBarrier = null;
    this.resetHeroFrontlineForWave();
    this.gateShield = getHeroStats(this.campaign.hero.id, this.campaign.hero.level).gateShield;
    for (const tower of this.towers.values()) tower.cooldownMs = 180;
    this.phase = "countdown";
    if (northernPass) {
      this.events.push({
        type: "northern_route_changed",
        wave: this.wavePlan.wave,
        routeVariantId: northernPass.routeVariantId,
        routePoints: northernPass.routePoints,
      });
    }
    if (this.wavePlan.hasBoss) this.events.push({ type: "haptic", kind: "heavy" });
    this.recordCommand({ type: "start_wave" });
    return true;
  }

  triggerNorthernAvalanche(zoneId: NorthernAvalancheZoneId): SimulationCommandResult {
    const plan = this.wavePlan?.northernPass;
    if (!plan?.zones.some((zone) => zone.id === zoneId)) {
      return commandFailure("invalid_avalanche_zone");
    }
    if (
      this.phase !== "wave"
      || this.northernAvalancheCharges <= 0
      || zoneId !== plan.dangerZoneId
    ) {
      return commandFailure("avalanche_unavailable");
    }

    const targets = this.enemies.filter((enemy) => (
      !enemy.dead
      && isProgressInsideNorthernAvalancheZone(enemy.progress, this.path.totalLength, zoneId)
    ));
    if (targets.length === 0) return commandFailure("avalanche_empty_zone");

    const impacts = targets.map((enemy) => {
      const boss = enemy.type === "boss" || enemy.type === "titan";
      const impact = calculateNorthernAvalancheImpact(
        enemy.frostArmor,
        enemy.maxFrostArmor,
        boss,
        enemy.healingRadius > 0,
      );
      const previousFrostArmor = enemy.frostArmor;
      enemy.frostArmor = Math.max(0, enemy.frostArmor - impact.frostArmorRemoved);
      // Boss waves grant a second charge intentionally: avalanche stuns stack so
      // committing both charges is a real tactical choice instead of a no-op.
      enemy.stunUntilMs = Math.max(enemy.stunUntilMs, this.simulationTimeMs) + impact.stunDurationMs;
      if (impact.healingInterrupted) {
        enemy.lastHealAtMs = Math.max(
          enemy.lastHealAtMs,
          this.simulationTimeMs + AVALANCHE_HEALING_INTERRUPT_MS,
        );
      }
      if (previousFrostArmor > 0 && enemy.frostArmor <= 0) {
        this.events.push({ type: "frost_armor_broken", enemyId: enemy.id, x: enemy.x, y: enemy.y });
      }
      return Object.freeze({
        enemyId: enemy.id,
        x: enemy.x,
        y: enemy.y,
        frostArmorRemoved: impact.frostArmorRemoved,
        stunDurationMs: impact.stunDurationMs,
        healingInterrupted: impact.healingInterrupted,
        boss,
      });
    });
    this.northernAvalancheCharges -= 1;
    this.events.push(
      {
        type: "northern_avalanche",
        zoneId,
        routeVariantId: plan.routeVariantId,
        chargesRemaining: this.northernAvalancheCharges,
        impacts: Object.freeze(impacts),
      },
      { type: "haptic", kind: "heavy" },
    );
    this.recordCommand({ type: "trigger_northern_avalanche", zoneId });
    return COMMAND_SUCCESS;
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

  useHeroAbility(targetDistance?: number): SimulationCommandResult {
    if (this.phase !== "wave") return commandFailure("invalid_phase");
    if (this.heroAbilityCharges <= 0 || this.heroFrontline?.status === "knocked_out") {
      return commandFailure("hero_ability_unavailable");
    }
    const hero = this.campaign.hero;
    const stats = getHeroStats(hero.id, hero.level);
    const heroPoint = this.getHeroPoint();
    const awakened = this.isCurrentHeroAwakened();
    let targetPoint: Point = heroPoint;
    let targetIds: number[] = [];
    let eventRadius = stats.abilityRadius;
    let eventDurationMs = 0;
    let torenVictims: EnemyEntity[] = [];
    let barrierProgress: number | null = null;

    if (hero.id === "eira") {
      const targets = awakened
        ? this.strongestEnemies(this.enemies, HERO_AWAKENINGS.eira.markedTargetCount)
        : this.strongestEnemies(this.enemies, 1);
      if (targets.length === 0) return commandFailure("hero_ability_unavailable");
      targetIds = targets.map((target) => target.id);
      targetPoint = Object.freeze({ x: targets[0].x, y: targets[0].y });
      eventDurationMs = awakened ? HERO_AWAKENINGS.eira.abilityDurationMs : stats.markDurationMs;
    } else if (hero.id === "toren") {
      if (awakened) {
        if (targetDistance === undefined) return commandFailure("hero_ability_target_required");
        if (
          !Number.isFinite(targetDistance)
          || targetDistance < 0
          || targetDistance > this.path.totalLength
        ) return commandFailure("invalid_hero_ability_target");
        barrierProgress = targetDistance;
        targetPoint = getPointAtDistance(this.path, targetDistance);
        eventRadius = HERO_AWAKENINGS.toren.impactRadius;
        eventDurationMs = HERO_AWAKENINGS.toren.abilityDurationMs;
        torenVictims = this.enemies.filter(
          (enemy) => squaredDistance(enemy, targetPoint) <= HERO_AWAKENINGS.toren.impactRadius ** 2,
        );
        targetIds = torenVictims.map((enemy) => enemy.id);
      } else {
        torenVictims = this.enemies.filter(
          (enemy) => squaredDistance(enemy, heroPoint) <= stats.abilityRadius ** 2,
        );
        if (torenVictims.length === 0) return commandFailure("hero_ability_unavailable");
        targetIds = torenVictims.map((enemy) => enemy.id);
        eventDurationMs = stats.abilityStunMs;
      }
    } else {
      if (this.enemies.length === 0) return commandFailure("hero_ability_unavailable");
      eventDurationMs = awakened ? HERO_AWAKENINGS.grak.abilityDurationMs : stats.abilityDurationMs;
    }

    // Spend the charge before damage is resolved: the 25th kill caused by
    // Toren's impact must be able to grant the earned recharge immediately.
    this.heroAbilityCharges -= 1;
    if (hero.id === "eira") {
      this.markedEnemyIds = targetIds;
      this.markUntilMs = this.simulationTimeMs + eventDurationMs;
    } else if (hero.id === "toren" && awakened && barrierProgress !== null) {
      this.clearHeroBarrier();
      this.heroBarrier = {
        progress: barrierProgress,
        x: targetPoint.x,
        y: targetPoint.y,
        untilMs: this.simulationTimeMs + HERO_AWAKENINGS.toren.abilityDurationMs,
        capacity: HERO_AWAKENINGS.toren.barrierCapacity,
        capturedEnemyIds: new Set<number>(),
      };
    } else if (hero.id === "grak") {
      this.bannerUntilMs = this.simulationTimeMs + eventDurationMs;
    }

    const frozenTargetIds = Object.freeze([...targetIds]);
    this.events.push(
      {
        type: "hero_ability",
        heroId: hero.id,
        x: heroPoint.x,
        y: heroPoint.y,
        radius: eventRadius,
        targetId: frozenTargetIds[0] ?? null,
        targetIds: frozenTargetIds,
        targetPoint,
        durationMs: eventDurationMs,
      },
      { type: "haptic", kind: "medium" },
    );
    if (this.heroBarrier) {
      this.events.push({
        type: "hero_barrier_created",
        x: this.heroBarrier.x,
        y: this.heroBarrier.y,
        progress: this.heroBarrier.progress,
        radius: HERO_AWAKENINGS.toren.impactRadius,
        durationMs: HERO_AWAKENINGS.toren.abilityDurationMs,
        capacity: this.heroBarrier.capacity,
      });
    }

    if (hero.id === "toren") {
      for (const enemy of torenVictims) {
        const damage = awakened ? HERO_AWAKENINGS.toren.impactDamage : stats.abilityDamage;
        this.damageEnemy(enemy, damage, stats.damageKind);
        if (awakened || enemy.dead) continue;
        const resistance = Math.max(0, enemy.controlResistance - stats.controlResistancePenetration);
        const control = applyControlResistance(0.1, stats.abilityStunMs, resistance);
        enemy.stunUntilMs = Math.max(enemy.stunUntilMs, this.simulationTimeMs + control.durationMs);
      }
      if (awakened) this.captureBarrierEnemies();
    }

    this.recordCommand(targetDistance === undefined
      ? { type: "use_hero_ability" }
      : { type: "use_hero_ability", targetDistance });
    return COMMAND_SUCCESS;
  }

  usePulse(): SimulationCommandResult {
    const result = this.useHeroAbility();
    return result.ok ? result : commandFailure("pulse_used");
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
      this.updateHeroFrontlineMovement(deltaMs);
      this.countdownRemainingMs = Math.max(0, this.countdownRemainingMs - deltaMs);
      if (this.countdownRemainingMs <= 0) this.phase = "wave";
      return;
    }

    this.waveElapsedMs += deltaMs;
    this.spawnScheduledEnemies();
    this.updateHeroFrontlineMovement(deltaMs);
    this.updateHeroFrontlineBlocks();
    this.updateEnemies(deltaMs);
    if (this.phase !== "wave") return;
    this.updateHero(deltaMs);
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
    const maxFrostArmor = Math.round(spawn.maxHp * (spawn.frostArmorRatio ?? 0));
    const entity: EnemyEntity = {
      id: spawn.id,
      type: spawn.type,
      variant: spawn.variant ?? "standard",
      x: point.x,
      y: point.y,
      progress,
      hp: spawn.maxHp,
      maxHp: spawn.maxHp,
      shield: maxShield,
      maxShield,
      frostArmor: maxFrostArmor,
      maxFrostArmor,
      speed: spawn.speed,
      reward: spawn.reward,
      leakDamage: spawn.leakDamage,
      physicalResistance: spawn.physicalResistance,
      magicResistance: spawn.magicResistance,
      slowed: false,
      stunned: false,
      blocked: false,
      burning: false,
      enraged: false,
      slowUntilMs: 0,
      slowEffectFactor: 1,
      slowFactor: 1,
      burnUntilMs: 0,
      burnDamagePerSecond: 0,
      stunUntilMs: 0,
      barrierUntilMs: 0,
      blockedByHero: false,
      heroAttackCooldownMs: 0,
      heroBlockStartedAtMs: 0,
      heroBlockImmuneUntilMs: 0,
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

  private resetHeroFrontlineForWave(): void {
    const frontline = this.heroFrontline;
    if (!frontline) return;
    this.releaseAllHeroFrontlineBlocks(false);
    const stats = getTorenHeroCombatStats(this.campaign.hero.level);
    frontline.maxHp = stats.maxHp;
    frontline.hp = stats.maxHp;
    frontline.targetProgress = getHeroFrontlineProgress(this.path.totalLength, this.campaign.hero.anchorId) ?? 0;
    frontline.progress = this.path.totalLength;
    frontline.status = "deploying";
    frontline.moveSpeed = HERO_COMBAT_TIMING.countdownMoveSpeed;
    frontline.lastDamagedAtMs = Number.NEGATIVE_INFINITY;
    frontline.knockoutUntilMs = 0;
    frontline.regenActive = false;
  }

  private resetHeroFrontlineAfterWave(): void {
    const frontline = this.heroFrontline;
    if (!frontline) return;
    this.releaseAllHeroFrontlineBlocks(false);
    const stats = getTorenHeroCombatStats(this.campaign.hero.level);
    frontline.maxHp = stats.maxHp;
    frontline.hp = stats.maxHp;
    frontline.targetProgress = getHeroFrontlineProgress(this.path.totalLength, this.campaign.hero.anchorId) ?? 0;
    frontline.progress = frontline.targetProgress;
    frontline.status = "ready";
    frontline.lastDamagedAtMs = Number.NEGATIVE_INFINITY;
    frontline.knockoutUntilMs = 0;
    frontline.regenActive = false;
  }

  private updateHeroFrontlineMovement(deltaMs: number): void {
    const frontline = this.heroFrontline;
    if (!frontline) return;

    if (frontline.status === "knocked_out") {
      if (this.simulationTimeMs < frontline.knockoutUntilMs) return;
      frontline.hp = Math.max(1, Math.round(frontline.maxHp * HERO_COMBAT_TIMING.respawnHpRatio));
      frontline.progress = this.path.totalLength;
      frontline.targetProgress = getHeroFrontlineProgress(this.path.totalLength, this.campaign.hero.anchorId) ?? 0;
      frontline.status = "deploying";
      frontline.moveSpeed = HERO_COMBAT_TIMING.respawnMoveSpeed;
      frontline.lastDamagedAtMs = this.simulationTimeMs;
      const point = getPointAtDistance(this.path, frontline.progress);
      this.events.push(
        { type: "hero_respawned", x: point.x, y: point.y, hp: frontline.hp },
        { type: "haptic", kind: "medium" },
      );
    }

    if (frontline.status !== "deploying") return;
    frontline.progress = Math.max(
      frontline.targetProgress,
      frontline.progress - frontline.moveSpeed * (deltaMs / 1_000),
    );
    if (frontline.progress > frontline.targetProgress + 1e-6) return;
    frontline.progress = frontline.targetProgress;
    frontline.status = "holding";
    const point = getPointAtDistance(this.path, frontline.progress);
    this.events.push({ type: "hero_frontline_arrived", x: point.x, y: point.y });
  }

  private updateHeroFrontlineBlocks(): void {
    const frontline = this.heroFrontline;
    if (!frontline) return;

    for (const enemyId of [...frontline.blockedEnemyIds]) {
      const enemy = this.enemiesById.get(enemyId);
      if (!enemy || enemy.dead) {
        frontline.blockedEnemyIds.delete(enemyId);
        continue;
      }
      const bossBlockExpired = (enemy.type === "boss" || enemy.type === "titan")
        && this.simulationTimeMs - enemy.heroBlockStartedAtMs >= HERO_COMBAT_TIMING.bossMaximumBlockMs;
      if (bossBlockExpired) this.releaseHeroFrontlineBlock(enemy, true);
    }

    if (frontline.status !== "holding" && frontline.status !== "fighting") {
      this.releaseAllHeroFrontlineBlocks(false);
      return;
    }

    const stats = getTorenHeroCombatStats(this.campaign.hero.level);
    let blockUsed = this.getHeroFrontlineBlockUsed();
    const candidates = this.enemies
      .filter((enemy) => (
        !enemy.dead
        && !enemy.blockedByHero
        && enemy.heroBlockImmuneUntilMs <= this.simulationTimeMs
        && Math.abs(enemy.progress - frontline.progress) <= HERO_COMBAT_TIMING.captureDistance
      ))
      .sort((left, right) => right.progress - left.progress || left.id - right.id);

    for (const enemy of candidates) {
      const cost = getEnemyHeroBlockCost(enemy.type);
      if (blockUsed + cost > stats.blockCapacity) continue;
      enemy.blockedByHero = true;
      enemy.heroBlockStartedAtMs = this.simulationTimeMs;
      enemy.heroAttackCooldownMs = getEnemyHeroFirstAttackDelayMs(enemy.type);
      frontline.blockedEnemyIds.add(enemy.id);
      blockUsed += cost;
    }
    frontline.status = frontline.blockedEnemyIds.size > 0 ? "fighting" : "holding";
  }

  private getHeroFrontlineBlockUsed(): number {
    const frontline = this.heroFrontline;
    if (!frontline) return 0;
    let used = 0;
    for (const enemyId of frontline.blockedEnemyIds) {
      const enemy = this.enemiesById.get(enemyId);
      if (enemy && !enemy.dead && enemy.blockedByHero) used += getEnemyHeroBlockCost(enemy.type);
    }
    return used;
  }

  private releaseHeroFrontlineBlock(enemy: EnemyEntity, grantImmunity: boolean): void {
    enemy.blockedByHero = false;
    enemy.heroAttackCooldownMs = 0;
    enemy.heroBlockStartedAtMs = 0;
    if (grantImmunity) {
      enemy.heroBlockImmuneUntilMs = this.simulationTimeMs + HERO_COMBAT_TIMING.bossBlockImmunityMs;
    }
    this.heroFrontline?.blockedEnemyIds.delete(enemy.id);
  }

  private releaseAllHeroFrontlineBlocks(grantBossImmunity: boolean): void {
    const frontline = this.heroFrontline;
    if (!frontline) return;
    for (const enemyId of [...frontline.blockedEnemyIds]) {
      const enemy = this.enemiesById.get(enemyId);
      if (enemy) {
        this.releaseHeroFrontlineBlock(
          enemy,
          grantBossImmunity && (enemy.type === "boss" || enemy.type === "titan"),
        );
      } else {
        frontline.blockedEnemyIds.delete(enemyId);
      }
    }
  }

  private attackHeroWithEnemy(enemy: EnemyEntity, deltaMs: number): void {
    const frontline = this.heroFrontline;
    if (!frontline || !enemy.blockedByHero || enemy.stunned || frontline.status === "knocked_out") return;
    enemy.heroAttackCooldownMs -= deltaMs;
    if (enemy.heroAttackCooldownMs > 0) return;
    const profile = getEnemyHeroAttackProfile(enemy.type);
    enemy.heroAttackCooldownMs += profile.intervalMs;
    const stats = getTorenHeroCombatStats(this.campaign.hero.level);
    const damage = calculateHeroDamageTaken(profile.damage, stats.armor);
    frontline.hp = Math.max(0, frontline.hp - damage);
    frontline.lastDamagedAtMs = this.simulationTimeMs;
    frontline.regenActive = false;
    this.events.push({
      type: "enemy_attacked_hero",
      enemyId: enemy.id,
      x: enemy.x,
      y: enemy.y,
      damage,
      remainingHp: frontline.hp,
    });
    if (frontline.hp > 0) return;
    const point = getPointAtDistance(this.path, frontline.progress);
    frontline.status = "knocked_out";
    frontline.knockoutUntilMs = this.simulationTimeMs + HERO_COMBAT_TIMING.knockoutDurationMs;
    this.releaseAllHeroFrontlineBlocks(false);
    this.events.push(
      {
        type: "hero_knocked_out",
        x: point.x,
        y: point.y,
        returnInMs: HERO_COMBAT_TIMING.knockoutDurationMs,
      },
      { type: "haptic", kind: "heavy" },
    );
  }

  private updateEnemies(deltaMs: number): void {
    // Spawn order is gameplay-visible for simultaneous burns and healer casts.
    if (this.heroBarrier && this.heroBarrier.untilMs <= this.simulationTimeMs) this.heroBarrier = null;
    let index = 0;
    while (index < this.enemies.length) {
      const enemy = this.enemies[index];
      if (!enemy || enemy.dead) {
        index += 1;
        continue;
      }
      enemy.burning = enemy.burnUntilMs > this.simulationTimeMs;
      if (enemy.burning) {
        this.damageEnemy(
          enemy,
          enemy.burnDamagePerSecond * this.getMarkedTowerDamageMultiplier(enemy) * (deltaMs / 1_000),
          "fire",
          false,
        );
      }
      if (enemy.dead) continue;
      enemy.stunned = enemy.stunUntilMs > this.simulationTimeMs;
      this.captureEnemyWithBarrier(enemy);
      enemy.blocked = enemy.barrierUntilMs > this.simulationTimeMs || enemy.blockedByHero;
      this.attackHeroWithEnemy(enemy, deltaMs);
      // A hit can knock Toren out and release every enemy during this same fixed tick.
      enemy.blocked = enemy.barrierUntilMs > this.simulationTimeMs || enemy.blockedByHero;

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

      const timedSlow = enemy.slowUntilMs > this.simulationTimeMs;
      const auraSlowFactor = this.getHeroSlowFactor(enemy);
      enemy.slowed = timedSlow || auraSlowFactor < 1;
      enemy.slowFactor = Math.min(timedSlow ? enemy.slowEffectFactor : 1, auraSlowFactor);
      enemy.enraged = (enemy.type === "boss" || enemy.type === "titan") && enemy.hp / enemy.maxHp <= 0.4;
      if (!enemy.stunned && !enemy.blocked) {
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

  private updateHero(deltaMs: number): void {
    const frontline = this.heroFrontline;
    if (frontline) {
      frontline.regenActive = false;
      const canRegenerate = (frontline.status === "holding" || frontline.status === "fighting")
        && frontline.blockedEnemyIds.size === 0
        && frontline.hp < frontline.maxHp
        && this.simulationTimeMs - frontline.lastDamagedAtMs >= HERO_COMBAT_TIMING.regenDelayMs;
      if (canRegenerate) {
        const combatStats = getTorenHeroCombatStats(this.campaign.hero.level);
        frontline.hp = Math.min(
          frontline.maxHp,
          frontline.hp + combatStats.regenHpPerSecond * (deltaMs / 1_000),
        );
        frontline.regenActive = frontline.hp < frontline.maxHp;
      }
      if (frontline.status !== "holding" && frontline.status !== "fighting") return;
    }

    this.heroAttackCooldownMs -= deltaMs;
    if (this.heroAttackCooldownMs > 0) return;
    const hero = this.campaign.hero;
    const stats = getHeroStats(hero.id, hero.level);
    const point = this.getHeroPoint();
    const attackRange = frontline ? HERO_COMBAT_TIMING.meleeRange : stats.attackRange;
    const inRange = this.enemies.filter((enemy) => squaredDistance(enemy, point) <= attackRange ** 2);
    const blockedTarget = frontline
      ? [...frontline.blockedEnemyIds]
          .map((enemyId) => this.enemiesById.get(enemyId))
          .filter((enemy): enemy is EnemyEntity => Boolean(enemy && !enemy.dead))
          .sort((left, right) => right.progress - left.progress || left.id - right.id)[0] ?? null
      : null;
    const target = blockedTarget ?? (hero.id === "eira"
      ? inRange.reduce<EnemyEntity | null>((best, enemy) => !best || enemy.progress > best.progress ? enemy : best, null)
      : chooseTowerTarget("ember", point, attackRange, inRange, stats.attackSplashRadius) as EnemyEntity | null);
    if (!target) {
      this.heroAttackCooldownMs = 80;
      return;
    }

    this.events.push({
      type: "hero_attack",
      heroId: hero.id,
      targetId: target.id,
      from: point,
      to: Object.freeze({ x: target.x, y: target.y }),
      radius: stats.attackSplashRadius,
    });
    const victims = stats.attackSplashRadius > 0
      ? [...this.enemies].filter((enemy) => squaredDistance(enemy, target) <= stats.attackSplashRadius ** 2)
      : [target];
    for (const victim of victims) {
      if (victim.dead) continue;
      const falloff = victim.id === target.id ? 1 : 0.72;
      this.damageEnemy(victim, stats.attackDamage * falloff, stats.damageKind);
    }
    this.heroAttackCooldownMs += stats.attackIntervalMs;
  }

  private getHeroSlowFactor(enemy: EnemyEntity): number {
    const hero = this.campaign.hero;
    if (hero.id !== "toren" || hero.level < 2) return 1;
    const stats = getHeroStats(hero.id, hero.level);
    if (squaredDistance(enemy, this.getHeroPoint()) > stats.slowAuraRadius ** 2) return 1;
    const resistance = Math.max(0, enemy.controlResistance - stats.controlResistancePenetration);
    return applyControlResistance(stats.slowAuraFactor, 1_000, resistance).slowFactor;
  }

  private captureBarrierEnemies(): void {
    for (const enemy of this.enemies) this.captureEnemyWithBarrier(enemy);
  }

  private clearHeroBarrier(): void {
    if (!this.heroBarrier) return;
    for (const enemyId of this.heroBarrier.capturedEnemyIds) {
      const enemy = this.enemiesById.get(enemyId);
      if (enemy) enemy.barrierUntilMs = 0;
    }
    this.heroBarrier = null;
  }

  private captureEnemyWithBarrier(enemy: EnemyEntity): void {
    const barrier = this.heroBarrier;
    if (
      !barrier
      || barrier.untilMs <= this.simulationTimeMs
      || barrier.capturedEnemyIds.has(enemy.id)
      || barrier.capturedEnemyIds.size >= barrier.capacity
      || Math.abs(enemy.progress - barrier.progress) > HERO_AWAKENINGS.toren.barrierCaptureRadius
    ) return;

    const maximumDuration = enemy.type === "boss" || enemy.type === "titan"
      ? HERO_AWAKENINGS.toren.bossBarrierDurationMs
      : HERO_AWAKENINGS.toren.abilityDurationMs;
    const durationMs = Math.min(maximumDuration, barrier.untilMs - this.simulationTimeMs);
    barrier.capturedEnemyIds.add(enemy.id);
    enemy.barrierUntilMs = Math.max(enemy.barrierUntilMs, this.simulationTimeMs + durationMs);
    enemy.blocked = true;
    this.events.push({
      type: "hero_barrier_blocked",
      enemyId: enemy.id,
      x: enemy.x,
      y: enemy.y,
      durationMs,
    });
  }

  private strongestEnemies(candidates: readonly EnemyEntity[], limit: number): EnemyEntity[] {
    return [...candidates]
      .sort((left, right) => {
        const strengthDelta = (right.hp + right.shield) - (left.hp + left.shield);
        if (strengthDelta !== 0) return strengthDelta;
        if (left.progress !== right.progress) return right.progress - left.progress;
        return left.id - right.id;
      })
      .slice(0, Math.max(0, limit));
  }

  private refillAwakenedEiraMarks(): void {
    if (
      this.campaign.hero.id !== "eira"
      || !this.isCurrentHeroAwakened()
      || this.markUntilMs <= this.simulationTimeMs
    ) return;
    this.markedEnemyIds = this.markedEnemyIds.filter((id) => this.enemiesById.has(id));
    const missing = HERO_AWAKENINGS.eira.markedTargetCount - this.markedEnemyIds.length;
    if (missing <= 0) return;
    const marked = new Set(this.markedEnemyIds);
    const replacements = this.strongestEnemies(
      this.enemies.filter((enemy) => !marked.has(enemy.id)),
      missing,
    );
    this.markedEnemyIds.push(...replacements.map((enemy) => enemy.id));
  }

  private recordHeroAbilityRechargeKill(): void {
    if (!this.isCurrentHeroAwakened() || this.heroAbilityRechargeGranted) return;
    this.heroAbilityRechargeKills += 1;
    if (this.heroAbilityRechargeKills < HERO_ABILITY_RECHARGE_KILLS) return;
    this.heroAbilityRechargeGranted = true;
    this.heroAbilityCharges = Math.min(2, this.heroAbilityCharges + 1);
    this.events.push({
      type: "hero_ability_recharged",
      heroId: this.campaign.hero.id,
      charges: this.heroAbilityCharges,
    });
  }

  private getTowerAuraDamageMultiplier(originPadId: number): number {
    const hero = this.campaign.hero;
    if (hero.id !== "eira") return 1;
    const stats = getHeroStats(hero.id, hero.level);
    const towerPoint = this.rules.buildPads[originPadId];
    if (
      towerPoint
      && stats.towerDamageAuraRadius > 0
      && squaredDistance(towerPoint, this.getHeroPoint()) <= stats.towerDamageAuraRadius ** 2
    ) return stats.towerDamageMultiplier;
    return stats.globalTowerDamageMultiplier;
  }

  private getMarkedTowerDamageMultiplier(enemy: EnemyEntity): number {
    if (!this.markedEnemyIds.includes(enemy.id) || this.simulationTimeMs >= this.markUntilMs) return 1;
    const hero = this.campaign.hero;
    if (hero.id !== "eira") return 1;
    return this.isCurrentHeroAwakened()
      ? HERO_AWAKENINGS.eira.markedTowerDamageMultiplier
      : getHeroStats(hero.id, hero.level).markedTowerDamageMultiplier;
  }

  private getTowerDamageMultiplier(originPadId: number, enemy: EnemyEntity): number {
    return this.getTowerAuraDamageMultiplier(originPadId) * this.getMarkedTowerDamageMultiplier(enemy);
  }

  private getTowerAttackIntervalMultiplier(originPadId: number): number {
    const hero = this.campaign.hero;
    if (hero.id !== "grak") return 1;
    const towerPoint = this.rules.buildPads[originPadId];
    if (!towerPoint) return 1;
    const stats = getHeroStats(hero.id, hero.level);
    const distance = squaredDistance(towerPoint, this.getHeroPoint());
    let multiplier = stats.towerAttackSpeedAuraRadius > 0 && distance <= stats.towerAttackSpeedAuraRadius ** 2
      ? stats.towerAttackIntervalMultiplier
      : stats.globalTowerAttackIntervalMultiplier;
    if (this.bannerUntilMs > this.simulationTimeMs) {
      if (this.isCurrentHeroAwakened()) {
        multiplier *= HERO_AWAKENINGS.grak.towerAttackIntervalMultiplier;
      } else if (distance <= stats.abilityRadius ** 2) {
        multiplier *= stats.abilityTowerAttackIntervalMultiplier;
      }
    }
    return multiplier;
  }

  private getTowerResistancePenetration(originPadId: number): number {
    const hero = this.campaign.hero;
    if (hero.id !== "grak" || this.bannerUntilMs <= this.simulationTimeMs) return 0;
    const towerPoint = this.rules.buildPads[originPadId];
    const stats = getHeroStats(hero.id, hero.level);
    if (!towerPoint) return 0;
    if (this.isCurrentHeroAwakened()) return HERO_AWAKENINGS.grak.resistancePenetration;
    return squaredDistance(towerPoint, this.getHeroPoint()) <= stats.abilityRadius ** 2
      ? stats.abilityResistancePenetration
      : 0;
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
        // Snapshot the banner bonus when the tower fires so an in-flight shot
        // cannot gain or lose penetration when the timed aura changes.
        resistancePenetration: this.getTowerResistancePenetration(tower.placement.padId),
      });
      this.nextProjectileId += 1;
      tower.cooldownMs += stats.fireRateMs * this.getTowerAttackIntervalMultiplier(tower.placement.padId);
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
        const heroMultiplier = this.getTowerDamageMultiplier(projectile.originPadId, victim);
        this.damageEnemy(
          victim,
          projectile.stats.damage * Math.pow(0.72, index) * bossMultiplier * heroMultiplier,
          projectile.stats.damageKind,
          true,
          projectile.resistancePenetration,
        );
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
      const heroMultiplier = this.getTowerDamageMultiplier(projectile.originPadId, victim);
      this.damageEnemy(
        victim,
        projectile.stats.damage * falloff * bossMultiplier * heroMultiplier,
        projectile.stats.damageKind,
        true,
        projectile.resistancePenetration,
      );
      if (victim.dead) continue;
      if (projectile.stats.slowDurationMs > 0) {
        const control = applyControlResistance(projectile.stats.slowFactor, projectile.stats.slowDurationMs, victim.controlResistance);
        const slow = mergeSlowEffect(
          { factor: victim.slowEffectFactor, untilMs: victim.slowUntilMs },
          { factor: control.slowFactor, durationMs: control.durationMs },
          this.simulationTimeMs,
        );
        victim.slowUntilMs = slow.untilMs;
        victim.slowEffectFactor = slow.factor;
      }
      if (projectile.stats.burnDurationMs > 0) {
        const burn = mergeBurnEffect(
          { damagePerSecond: victim.burnDamagePerSecond, untilMs: victim.burnUntilMs },
          {
            damagePerSecond: projectile.stats.burnDamagePerSecond * this.getTowerAuraDamageMultiplier(projectile.originPadId),
            durationMs: projectile.stats.burnDurationMs,
          },
          this.simulationTimeMs,
        );
        victim.burnUntilMs = burn.untilMs;
        victim.burnDamagePerSecond = burn.damagePerSecond;
      }
    }
  }

  private damageEnemy(
    enemy: EnemyEntity,
    amount: number,
    kind: DamageKind,
    showText = true,
    resistancePenetration = 0,
  ): void {
    if (enemy.dead) return;
    const damage = calculateDamage(amount, kind, enemy, resistancePenetration);
    const previousHpRatio = enemy.hp / enemy.maxHp;
    const frostMultiplier = getFrostArmorDamageMultiplier(kind);
    const previousFrostArmor = enemy.frostArmor;
    const frostAbsorbed = Math.min(enemy.frostArmor, damage * frostMultiplier);
    enemy.frostArmor -= frostAbsorbed;
    const damageAfterFrostArmor = Math.max(0, damage - frostAbsorbed / frostMultiplier);
    const absorbed = Math.min(enemy.shield, damageAfterFrostArmor);
    enemy.shield -= absorbed;
    const coreDamage = Math.max(0, damageAfterFrostArmor - absorbed);
    enemy.hp -= coreDamage;
    const appliedDamage = frostAbsorbed + absorbed + coreDamage;
    if (
      showText
      && appliedDamage >= 1
      && (appliedDamage >= 8 || enemy.type === "boss" || enemy.type === "titan")
      && this.simulationTimeMs - enemy.lastDamageTextAtMs >= 160
    ) {
      enemy.lastDamageTextAtMs = this.simulationTimeMs;
      this.events.push({
        type: "enemy_damaged",
        enemyId: enemy.id,
        x: enemy.x,
        y: enemy.y,
        damage: appliedDamage,
        absorbed,
        frostAbsorbed,
      });
    }
    if (previousFrostArmor > 0 && enemy.frostArmor <= 0) {
      this.events.push({ type: "frost_armor_broken", enemyId: enemy.id, x: enemy.x, y: enemy.y });
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
    const transferAwakenedMark = this.isCurrentHeroAwakened()
      && this.campaign.hero.id === "eira"
      && this.markUntilMs > this.simulationTimeMs
      && this.markedEnemyIds.includes(enemy.id);
    enemy.dead = true;
    this.removeEnemy(enemy);
    this.waveResolvedCount += 1;
    this.campaign = awardEnemyKill(this.campaign, enemy.reward);
    this.events.push({
      type: "enemy_killed",
      enemyId: enemy.id,
      enemyType: enemy.type,
      enemyVariant: enemy.variant,
      x: enemy.x,
      y: enemy.y,
      reward: enemy.reward,
      elite: enemy.elite,
      bossTier: enemy.bossTier,
      shielded: enemy.maxShield > 0,
      frostArmored: enemy.maxFrostArmor > 0,
    });
    if (transferAwakenedMark) this.refillAwakenedEiraMarks();
    this.recordHeroAbilityRechargeKill();
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
    const absorbed = Math.min(this.gateShield, enemy.leakDamage);
    const damage = enemy.leakDamage - absorbed;
    this.gateShield -= absorbed;
    if (damage > 0) this.campaign = applyLeakDamage(this.campaign, damage);
    if (absorbed > 0) {
      this.events.push({ type: "gate_shield_absorbed", amount: absorbed, remaining: this.gateShield });
    }
    this.events.push(
      { type: "enemy_leaked", enemyId: enemy.id, x: enemy.x, y: enemy.y, damage, absorbed },
      { type: "haptic", kind: "heavy" },
    );
    this.persistWaveDurationCheckpoint(true);
    if (this.campaign.lives <= 0) this.endRun("gameover");
  }

  private removeEnemy(enemy: EnemyEntity): void {
    if (enemy.blockedByHero) this.releaseHeroFrontlineBlock(enemy, false);
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
    this.path = createPathMetrics(this.rules.routePoints);
    this.resetHeroFrontlineAfterWave();
    this.northernAvalancheMaxCharges = 0;
    this.northernAvalancheCharges = 0;
    this.waveCheckpoint = null;
    this.fixedStepAccumulatorMs = 0;
    this.phase = this.rules.isComplete(this.campaign.completedWave) ? "victory" : "setup";
    this.heroAbilityCharges = 1;
    this.heroAbilityRechargeKills = 0;
    this.heroAbilityRechargeGranted = false;
    this.markedEnemyIds = [];
    this.markUntilMs = 0;
    this.bannerUntilMs = 0;
    this.heroBarrier = null;
    this.gateShield = 0;
    if (this.phase === "victory") this.endRun("victory");
  }

  private endRun(outcome: SimulationOutcome): void {
    if (this.phase === "gameover" || (this.phase === "victory" && outcome !== "victory")) return;
    this.phase = outcome;
    this.syncCampaignDuration();
    this.paused = false;
    this.wavePlan = null;
    this.path = createPathMetrics(this.rules.routePoints);
    this.releaseAllHeroFrontlineBlocks(false);
    this.northernAvalancheMaxCharges = 0;
    this.northernAvalancheCharges = 0;
    this.waveCheckpoint = null;
    this.projectiles.length = 0;
    this.markedEnemyIds = [];
    this.markUntilMs = 0;
    this.bannerUntilMs = 0;
    this.heroBarrier = null;
    this.gateShield = 0;
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
  if (replay.version !== 2 || replay.rulesId !== rules.id) throw new Error("Replay rules do not match.");
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

function assertNeverCommand(command: never): never {
  throw new Error(`Unsupported simulation command: ${String((command as { type?: unknown }).type)}`);
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
