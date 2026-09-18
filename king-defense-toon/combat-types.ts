import type { Point } from './field.ts';
import type { HeroStats } from './hero.ts';
import type { UnitType } from './units.ts';
import type { EnemyType, WaveDefinition } from './waves.ts';

export type ActorType = UnitType | EnemyType | 'hero' | 'castle';
export type ActorSide = 'ally' | 'enemy';
export type ActorAction = 'idle' | 'walk' | 'attack' | 'shoot' | 'heal' | 'hammer' | 'dead';
export type BattlePhase = 'running' | 'victory' | 'defeat';

export interface FormationUnit {
  id: string | number;
  type: UnitType;
  col: number;
  row: number;
  level?: number | string;
}

export interface MeleeApproach extends Point {
  targetId: string;
  blockedTime: number;
  detour: Point | null;
  // Created only after a blocked approach attempts to choose a detour.
  detourUntil?: number;
}

export interface ActorBase<T extends ActorType = ActorType> extends Point {
  id: string;
  side: ActorSide;
  type: T;
  homeX: number;
  homeY: number;
  hp: number;
  maxHp: number;
  damage: number;
  baseDamage: number;
  name: string;
  heal: number;
  level: number;
  reward: number;
  isBoss: boolean;
  isFinalBoss: boolean;
  visualScale: number;
  range: number;
  action: ActorAction;
  actionTime: number;
  actionDuration: number;
  impactFraction: number;
  walkTime: number;
  targetX: number;
  targetY: number;
  hitTime: number;
  deathTime: number;
  facingX: number;
  facingY: number;
  animationFacing: 'up' | 'down';
  focusId: string | null;
  followId: string | null;
  closingRange: boolean;
  following: boolean;
  cooldown: number;
  targetId: string | null;
  didImpact: boolean;
  shield: number;
  shieldTime: number;
  stunTime: number;
  // These fields are absent until their corresponding action first occurs.
  attackCount?: number;
  approach?: MeleeApproach | null;
}

export type HeroAbilityKind = 'heal' | 'hammer' | 'miracle';
export interface PendingHeroAbility {
  kind: HeroAbilityKind;
  sourceId: string;
  targetIds: string[];
  time: number;
  duration: number;
  didImpact: boolean;
}

export interface HeroActor extends ActorBase<'hero'> {
  stats: Readonly<HeroStats>;
  healCooldown: number;
  hammerCooldown: number;
  pendingAbility: PendingHeroAbility | null;
  miracleUsed: boolean;
  bastionTime: number;
  bastionCooldown: number;
}

export type AllyActor = ActorBase<UnitType>;
export type EnemyActor = ActorBase<EnemyType>;
export type CastleActor = ActorBase<'castle'>;
export type Actor = AllyActor | EnemyActor | HeroActor | CastleActor;

export type BattleEvent =
  | { type: 'gold'; amount: number; x: number; y: number }
  | { type: 'bow-shot'; sourceId: string };

export interface BattleEffectBase extends Point {
  id: number;
  targetX: number;
  targetY: number;
  age: number;
  duration: number;
  side: ActorSide;
  sourceType: ActorType;
  sourceId: string;
}

export interface BattleEffectPayloads {
  hit: { amount: number };
  gold: { amount: number };
  heal: { amount: number };
  slash: Record<never, never>;
  // An arrow gains landed only on arrival; hero-hammer starts with landed: false.
  arrow: { targetId: string; damage: number; landed?: boolean };
  'hero-heal': { targetId: string; amount: number; shield: number };
  'hero-hammer': { targetId: string; damage: number; landed: boolean };
  'hero-impact': { targetId: string };
}

export type BattleEffectType = keyof BattleEffectPayloads;
export type EffectOf<T extends BattleEffectType> = T extends BattleEffectType
  ? BattleEffectBase & { type: T } & BattleEffectPayloads[T] : never;
export type BattleEffect = { [T in BattleEffectType]: EffectOf<T> }[BattleEffectType];

export interface Battle {
  phase: BattlePhase;
  elapsed: number;
  stepRemainder: number;
  allies: AllyActor[];
  enemies: EnemyActor[];
  waveNumber: number;
  wave: WaveDefinition;
  enraged: boolean;
  enrageAt: number;
  castle: CastleActor;
  hero: HeroActor;
  // The same mutable actor instance as castle, retained for older balance tooling.
  king: CastleActor;
  total: number;
  spawned: number;
  kills: number;
  reward: number;
  effects: BattleEffect[];
  nextSpawn: number;
  nextEffectId: number;
}
