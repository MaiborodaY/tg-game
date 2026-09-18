import type { Point } from './field.ts';
import type { HeroState } from './hero.ts';
import type { EnemyCombatType, WaveNumberInput } from './waves.ts';
import type { UnitType } from './units.ts';
import type { Actor, ActorBase, ActorType, ActorSide, ActorAction, AllyActor, EnemyActor, HeroActor,
  FormationUnit, MeleeApproach, HeroAbilityKind, PendingHeroAbility, Battle, BattleEvent,
  BattleEffect, BattleEffectType, BattleEffectPayloads, EffectOf } from './combat-types.ts';
export type { Actor, ActorBase, ActorType, ActorSide, ActorAction, AllyActor, EnemyActor, HeroActor, CastleActor,
  FormationUnit, MeleeApproach, HeroAbilityKind, PendingHeroAbility, Battle, BattlePhase, BattleEvent,
  BattleEffect, BattleEffectType, BattleEffectPayloads, EffectOf } from './combat-types.ts';

interface ActorOptions<T extends ActorType> extends Point {
  id: string; side: ActorSide; type: T; hp: number; damage: number;
  name?: string; heal?: number; level?: number; reward?: number; attackSpeed?: number;
  isBoss?: boolean; isFinalBoss?: boolean; visualScale?: number;
}
interface CombatRule {
  range: number; interval: number; duration: number; speed: number;
  healRange?: number; impactFraction?: number;
}
type CombatRules = Record<EnemyCombatType | UnitType | 'hero' | 'castle', CombatRule>
  & { goblinHealer: CombatRule & { healRange: number } };

import { FIELD, WALKABLE_AREAS, ROYAL_ROUTE, HERO_START, positionForCell } from './field.ts';
import { UNIT_TYPE_BY_ID } from './units.ts';
import { ENEMY_TYPES, getEnemyCombatType, getWaveDefinition } from './waves.ts';
import { getForgedUnitStats } from './forge.ts';
import type { ForgeState } from './forge.ts';
import { getHeroStats } from './hero.ts';
import { findHeroCrowdRoute as findCrowdRoute } from './hero-navigation.ts';

export const COMBAT_PACE = 0.85;
export const CASTLE_MAX_HP = 100;
// Kept for the historical balance harness; the objective no longer fights.
export const KING_MAX_HP = CASTLE_MAX_HP;
const FIXED_STEP = 1 / 60;
const MAX_FRAME_DELTA = .3;
const BASE_RULES = {
  swordsman: { range: 38, interval: 1.1, duration: .65, speed: 57 },
  lancer: { range: 75, interval: 1.3, duration: .75, speed: 53 },
  pantherRider: { range: 38, interval: 1.05, duration: .65, speed: 68 },
  archer: { range: 185, interval: 1.4, duration: .7, speed: 49 },
  healer: { range: 77.5, interval: 1.45, duration: .8, speed: 47 },
  hero: { range: 42, interval: 1.2, duration: .7, speed: 53 },
  castle: { range: 0, interval: 0, duration: 0, speed: 0 },
  goblin: { range: 34, interval: 1.45, duration: .7, speed: 60 },
  goblinArcher: { range: 120, interval: 1.8, duration: .8, speed: 53 },
  goblinHealer: { range: 34, healRange: 95, interval: 2.6, duration: .8, speed: 48 },
  goblinChief: { range: 43, interval: 2.15, duration: 1.4, speed: 40, impactFraction: .7 },
  ogre: { range: 43, interval: 2.15, duration: 1.4, speed: 40, impactFraction: .7 },
  boar: { range: 34, interval: 1.65, duration: .8, speed: 56, impactFraction: .5 },
} satisfies CombatRules;
// Mapping preserves every rule key and optional field; only pace-related numbers change.
// Keep every faction's movement, windups and attack rate at the same slower pace.
const RULES = Object.freeze(Object.fromEntries(Object.entries(BASE_RULES).map(([type, rule]) => [type, {
  ...rule, speed: rule.speed * COMBAT_PACE,
  interval: rule.interval / COMBAT_PACE, duration: rule.duration / COMBAT_PACE,
}])) as CombatRules);
const ALLY_ADVANCE_LIMIT = 165;

export function getUnitRange(type: ActorType): number {
  return RULES[getEnemyCombatType(type)]?.range ?? 0;
}

function actor<T extends ActorType>({ id, side, type, name = type, x, y, hp, damage, heal = 0, level = 1, reward = 0, attackSpeed = 1, isBoss = false, isFinalBoss = false, visualScale = 1 }: ActorOptions<T>): ActorBase<T> {
  return {
    id, side, type, x, y, homeX: x, homeY: y, hp, maxHp: hp, damage, baseDamage: damage,
    name, heal, level, reward, attackSpeed, isBoss, isFinalBoss, visualScale,
    range: getUnitRange(type), action: 'idle', actionTime: 0, actionDuration: 0,
    impactFraction: RULES[getEnemyCombatType(type)].impactFraction ?? .45,
    walkTime: 0, targetX: x,
    targetY: y + (side === 'enemy' ? 1 : -1), hitTime: 0, deathTime: 0,
    facingX: 0, facingY: side === 'enemy' ? 1 : -1,
    animationFacing: side === 'enemy' ? 'down' : 'up',
    focusId: null, followId: null, closingRange: false, following: false,
    cooldown: 0, targetId: null, didImpact: false, shield: 0, shieldTime: 0, stunTime: 0,
  };
}

export function createBattle(formation: readonly FormationUnit[] = [], waveNumber: WaveNumberInput = 1, heroState?: HeroState,
  forge?: Readonly<ForgeState>): Battle {
  const wave = getWaveDefinition(waveNumber);
  // Combat owns copies: casualties and movement never overwrite the saved army.
  const allies = formation.filter(unit => UNIT_TYPE_BY_ID[unit.type]).map(unit => {
    const { level, hp, damage, heal, attackSpeed } = getForgedUnitStats(unit.type, unit.level, forge);
    return actor({
      id: `ally-${unit.id}`, side: 'ally', type: unit.type, level,
      ...positionForCell(unit.col, unit.row),
      hp, damage, heal, attackSpeed,
    });
  });
  const stats = Object.freeze({ ...getHeroStats(heroState) });
  const heroBase = actor({ id: 'hero', side: 'ally', type: 'hero', name: 'St. Knihor',
    ...HERO_START, hp: stats.maxHp, damage: stats.damage, level: stats.level });
  const hero: HeroActor = Object.assign(heroBase, { stats, heal: stats.healAmount, healCooldown: 0, hammerCooldown: 0,
    pendingAbility: null, miracleUsed: false, bastionTime: stats.bastion ? stats.bastionDuration : 0,
    bastionCooldown: stats.bastionInterval, guardianWard: 0, guardianWardTime: 0,
    guardianWardCooldown: 0, holyStrikeTime: 0 });
  const castle = actor({ id: 'castle', side: 'ally', type: 'castle', name: 'Castle',
    x: FIELD.kingX, y: FIELD.kingFeet, hp: CASTLE_MAX_HP, damage: 0 });
  return {
    phase: 'running', elapsed: 0, stepRemainder: 0, allies, enemies: [], waveNumber: wave.number, wave,
    // Every catalogued wave has at least one spawn.
    // Longer rounds must give the last reinforcement time to fight before stalemate pressure starts.
    enraged: false, enrageAt: Math.max(75, wave.spawns.at(-1)!.at + 45),
    castle, hero, king: castle,
    total: wave.total, spawned: 0, kills: 0, reward: 0, effects: [], nextSpawn: wave.spawns[0].at,
    nextEffectId: 1,
  };
}

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
const living = <T extends ActorBase>(actors: readonly T[]): T[] => actors.filter(unit => unit.hp > 0);
const alliedActors = (battle: Battle): (AllyActor | HeroActor)[] => [...battle.allies, battle.hero];
const allActors = (battle: Battle): Actor[] => [...battle.allies, ...battle.enemies, battle.hero, battle.castle];
const isBusy = (unit: ActorBase): boolean => ['attack', 'shoot', 'heal', 'hammer'].includes(unit.action);
const isEnemyHealer = (unit: ActorBase): boolean => getEnemyCombatType(unit.type) === 'goblinHealer';
const isRangedEnemy = (unit: ActorBase): boolean => ['goblinArcher', 'goblinHealer'].includes(getEnemyCombatType(unit.type));

// Merge exact segment intervals inside the land rectangles: melee cannot cut across water.
function hasLandPath(from: Point, to: Point): boolean {
  const intervals: [number, number][] = [];
  for (const area of WALKABLE_AREAS) {
    let start = 0;
    let end = 1;
    for (const [axis, low, high] of [['x', area.left, area.right], ['y', area.top, area.bottom]] as const) {
      const delta = to[axis] - from[axis];
      if (Math.abs(delta) < 1e-8) {
        if (from[axis] < low || from[axis] > high) { end = -1; break; }
      } else {
        const first = (low - from[axis]) / delta;
        const second = (high - from[axis]) / delta;
        start = Math.max(start, Math.min(first, second));
        end = Math.min(end, Math.max(first, second));
      }
    }
    if (start <= end) intervals.push([start, end]);
  }
  intervals.sort((a, b) => a[0] - b[0]);
  let covered = 0;
  for (const [start, end] of intervals) {
    if (start > covered + 1e-7) return false;
    covered = Math.max(covered, end);
    if (covered >= 1 - 1e-7) return true;
  }
  return false;
}

function clampToLand(unit: ActorBase, point: Point): Point {
  const top = unit.side === 'ally' ? ALLY_ADVANCE_LIMIT : 40;
  let closest: Point | null = null;
  let closestDistance = Infinity;
  for (const area of WALKABLE_AREAS) {
    const candidate = {
      x: Math.max(area.left, Math.min(area.right, point.x)),
      y: Math.max(top, area.top, Math.min(area.bottom, point.y)),
    };
    if (candidate.y > area.bottom) continue;
    const apart = distance(point, candidate);
    if (apart < closestDistance) { closest = candidate; closestDistance = apart; }
  }
  return closest ?? { x: unit.x, y: unit.y };
}

function constrainStep(unit: ActorBase, point: Point): Point {
  const clamped = clampToLand(unit, point);
  if (hasLandPath(unit, clamped)) return clamped;
  // Separation may nudge a fighter toward an inside corner; slide along its shore instead.
  const alternatives = [
    clampToLand(unit, { x: point.x, y: unit.y }),
    clampToLand(unit, { x: unit.x, y: point.y }),
    { x: unit.x, y: unit.y },
  ].filter(candidate => hasLandPath(unit, candidate));
  alternatives.sort((a, b) => distance(a, point) - distance(b, point));
  return alternatives[0] ?? { x: unit.x, y: unit.y };
}

function nextLandWaypoint(unit: ActorBase, target: Point): { point: Point; final: boolean } | null {
  const goal = clampToLand(unit, target);
  if (hasLandPath(unit, goal)) return { point: goal, final: true };
  // The two portals are the only connection between the army's island and the king's wing.
  const nodes = [unit, ...ROYAL_ROUTE, goal];
  const costs = nodes.map(() => Infinity);
  const previous = nodes.map(() => -1);
  const visited = new Set<number>();
  const finish = nodes.length - 1;
  costs[0] = 0;
  for (let pass = 0; pass < nodes.length; pass += 1) {
    let current = -1;
    for (let index = 0; index < nodes.length; index += 1) {
      if (!visited.has(index) && (current < 0 || costs[index] < costs[current])) current = index;
    }
    if (current < 0 || !Number.isFinite(costs[current])) return null;
    if (current === finish) break;
    visited.add(current);
    for (let next = 0; next < nodes.length; next += 1) {
      if (visited.has(next) || !hasLandPath(nodes[current], nodes[next])) continue;
      const cost = costs[current] + distance(nodes[current], nodes[next]);
      if (cost < costs[next]) { costs[next] = cost; previous[next] = current; }
    }
  }
  if (previous[finish] < 0) return null;
  let next = finish;
  while (previous[next] > 0) next = previous[next];
  return { point: nodes[next], final: next === finish };
}

function nearest<T extends Actor>(unit: Point, candidates: readonly T[], range = Infinity): T | null {
  let target: T | null = null;
  let nearestDistance = range;
  for (const candidate of candidates) {
    if (candidate.hp <= 0) continue;
    const candidateDistance = distance(unit, candidate);
    if (candidateDistance <= nearestDistance) {
      target = candidate;
      nearestDistance = candidateDistance;
    }
  }
  return target;
}

function faceToward(unit: ActorBase, target: Point): void {
  const apart = distance(unit, target);
  if (apart < .01) return;
  unit.facingX = (target.x - unit.x) / apart;
  unit.facingY = (target.y - unit.y) / apart;
  // The deadband keeps nearly horizontal movement from alternating front/back frames.
  if (unit.facingY < -.2) unit.animationFacing = 'up';
  else if (unit.facingY > .2) unit.animationFacing = 'down';
}

function focusedEnemy<T extends Actor>(unit: ActorBase, candidates: readonly T[]): T | null {
  const closest = nearest(unit, candidates);
  const current = candidates.find(target => target.id === unit.focusId && target.hp > 0);
  if (!current) {
    unit.focusId = closest?.id ?? null;
    unit.closingRange = false;
    return closest;
  }
  // Keep pursuing the same opponent unless a substantially closer threat blocks the way.
  if (closest && closest.id !== current.id && distance(unit, closest) <= unit.range + 25
    && distance(unit, closest) + 45 < distance(unit, current)) {
    unit.focusId = closest.id;
    unit.closingRange = false;
    return closest;
  }
  return current;
}

function addEffect<T extends Exclude<BattleEffectType, 'slash'>>(battle: Battle, type: T,
  source: Actor, target: Actor, duration: number, extras: BattleEffectPayloads[T]): void;
function addEffect(battle: Battle, type: 'slash', source: Actor, target: Actor,
  duration: number, extras?: BattleEffectPayloads['slash']): void;
function addEffect(battle: Battle, type: BattleEffectType, source: Actor, target: Actor,
  duration: number, extras: BattleEffectPayloads[BattleEffectType] = {}): void {
  battle.effects.push({
    id: battle.nextEffectId++, type, x: source.x, y: source.y - 27,
    targetX: target.x, targetY: target.y - 27, age: 0, duration,
    // Overloads require the matching payload for each literal effect type at all call sites.
    side: source.side, sourceType: source.type, sourceId: source.id, ...extras,
  } as BattleEffect);
}

function hurt(battle: Battle, target: Actor | undefined, amount: number, events: BattleEvent[]): void {
  if (!target || target.hp <= 0) return;
  const hero = battle.hero;
  if (target.side === 'ally' && target.type !== 'castle') {
    if (hero.hp > 0 && hero.stats.auraUnlocked && distance(hero, target) <= hero.stats.auraRadius) {
      let reduction = hero.stats.auraReduction + (hero.bastionTime > 0 ? hero.stats.bastionReduction : 0);
      if (target === hero && target.hp / target.maxHp <= hero.stats.emergencyGuardThreshold) reduction += hero.stats.emergencyGuardReduction;
      amount *= 1 - Math.max(0, Math.min(.4, reduction));
    }
    if (target === hero && hero.guardianWard > 0) {
      const absorbed = Math.min(hero.guardianWard, amount);
      hero.guardianWard -= absorbed;
      amount -= absorbed;
    }
    const absorbed = Math.min(target.shield, amount);
    target.shield -= absorbed;
    amount -= absorbed;
  }
  if (amount <= 0) return;
  const dealt = Math.min(target.hp, amount);
  target.hp = Math.max(0, target.hp - amount);
  target.hitTime = .18;
  addEffect(battle, 'hit', target, target, .65, { amount: dealt });
  if (target.hp > 0) {
    // Only damage that actually reached HP can trigger a ward. It protects later hits,
    // has its own lifetime, and never extends the separate overheal barrier.
    if (target === hero && hero.stats.auraUnlocked && hero.stats.guardianWardFraction > 0
      && hero.guardianWardCooldown <= 0 && dealt >= hero.maxHp * hero.stats.guardianWardThreshold) {
      hero.guardianWard = hero.maxHp * hero.stats.guardianWardFraction;
      hero.guardianWardTime = hero.stats.guardianWardDuration;
      hero.guardianWardCooldown = hero.stats.guardianWardCooldown;
    }
    return;
  }
  target.action = 'dead';
  target.actionTime = 0;
  target.deathTime = 0;
  target.targetId = null;
  target.shield = 0;
  target.shieldTime = 0;
  if (target === hero) cancelHeroActions(battle);
  if (target.side === 'enemy') {
    battle.kills += 1;
    battle.reward += target.reward;
    addEffect(battle, 'gold', target, target, .95, { amount: target.reward });
    events.push({ type: 'gold', amount: target.reward, x: target.x, y: target.y });
  }
}

function findActor(battle: Battle, id: string | null): Actor | undefined {
  return battle.castle.id === id ? battle.castle : battle.hero.id === id ? battle.hero
    : battle.allies.find(unit => unit.id === id) ?? battle.enemies.find(unit => unit.id === id);
}

function beginAction(unit: Actor, target: Actor, action: 'attack' | 'shoot' | 'heal'): void {
  const rule = RULES[getEnemyCombatType(unit.type)];
  const speed = unit.side === 'ally' && unit.type !== 'hero' && unit.type !== 'castle' ? unit.attackSpeed : 1;
  if (action === 'attack') unit.attackCount = (unit.attackCount ?? -1) + 1;
  unit.action = action;
  unit.actionTime = 0;
  // Scale the windup with the interval so faster units never wait on an old-length animation.
  unit.actionDuration = rule.duration / speed;
  unit.cooldown = unit.type === 'hero' ? unit.stats.attackInterval / COMBAT_PACE : rule.interval / speed;
  unit.targetId = target.id;
  unit.targetX = target.x;
  unit.targetY = target.y;
  faceToward(unit, target);
  unit.didImpact = false;
}

function resolveImpact(battle: Battle, unit: Actor, events: BattleEvent[]): void {
  const target = findActor(battle, unit.targetId);
  if (unit.hp <= 0 || unit.type === 'castle' || !target || target.hp <= 0) return;
  unit.targetX = target.x;
  unit.targetY = target.y;
  if (unit.action === 'heal') {
    // The defended objective is never healable, including an already queued cast.
    if (target.type === 'castle' || target.side !== unit.side) return;
    // Enemy support cannot sustain itself or another healer indefinitely.
    if (isEnemyHealer(unit) && (target.id === unit.id || isEnemyHealer(target))) return;
    const healRange = RULES[getEnemyCombatType(unit.type)].healRange ?? unit.range;
    if (distance(unit, target) > healRange + 8) return;
    const amount = Math.min(unit.heal, target.maxHp - target.hp);
    if (!amount) return;
    target.hp += amount;
    addEffect(battle, 'heal', unit, target, .7, { amount });
  } else if (unit.action === 'shoot') {
    // Damage lands with the arrow, rather than before it reaches its target.
    addEffect(battle, 'arrow', unit, target, Math.max(.15, distance(unit, target) / 420) / COMBAT_PACE, {
      targetId: target.id, damage: unit.damage,
    });
    events.push({ type: 'bow-shot', sourceId: unit.id });
  } else if (target.side !== unit.side && distance(unit, target) <= unit.range + 10 && hasLandPath(unit, target)) {
    addEffect(battle, 'slash', unit, target, .27);
    let amount = unit.damage;
    if (unit.type === 'hero' && unit.holyStrikeTime > 0) {
      amount += unit.baseDamage * unit.stats.holyStrikeFraction;
      unit.holyStrikeTime = 0;
    }
    hurt(battle, target, amount, events);
  }
}

function moveToward(unit: ActorBase, target: Point, dt: number, stopDistance = 0): void {
  const waypoint = nextLandWaypoint(unit, target);
  if (!waypoint) { unit.action = 'idle'; return; }
  const destination = waypoint.point;
  // A target beyond our advance limit is projected onto land. That gap already
  // consumes attack range; stopping a full range from the projection leaves us out of reach.
  const stopping = waypoint.final ? Math.max(0, stopDistance - distance(destination, target)) : 0;
  const separation = distance(unit, destination);
  if (separation <= stopping + .5) {
    unit.action = 'idle';
    return;
  }
  const step = Math.min(separation - stopping, RULES[getEnemyCombatType(unit.type)].speed * dt);
  const next = constrainStep(unit, {
    x: unit.x + (destination.x - unit.x) / separation * step,
    y: unit.y + (destination.y - unit.y) / separation * step,
  });
  const nextX = next.x;
  const nextY = next.y;
  const travelled = Math.hypot(nextX - unit.x, nextY - unit.y);
  if (travelled < .001) { unit.action = 'idle'; return; }
  faceToward(unit, { x: nextX, y: nextY });
  unit.x = nextX;
  unit.y = nextY;
  unit.targetX = target.x;
  unit.targetY = target.y;
  unit.action = 'walk';
  unit.walkTime += dt * COMBAT_PACE;
}

function advanceAlly(battle: Battle, unit: AllyActor | HeroActor, target: Actor, dt: number,
  goal: Point = target, stopDistance = unit.range - 2): void {
  const usesCrowdRoute = unit.type === 'hero' || unit.type === 'healer';
  const approach: MeleeApproach = unit.approach?.targetId === target.id ? unit.approach
    : { targetId: target.id, x: unit.x, y: unit.y, blockedTime: 0, detour: null };
  if (approach.detourTarget && ((unit.type !== 'healer' && goal !== target) || distance(target, approach.detourTarget) > 24)) {
    approach.detour = null;
    approach.detourRoute = undefined;
    approach.detourTarget = undefined;
    approach.retryAt = undefined;
    approach.blockedTime = 0;
  }
  if (approach.retryAt && battle.elapsed < approach.retryAt) { unit.action = 'idle'; return; }
  // Separation can cancel a rear fighter's forward step against its own frontline.
  // Only after sustained lack of progress, walk around that frontage at normal speed.
  // A hero or monk can creep through separation while still being effectively blocked.
  const minimumProgress = usesCrowdRoute ? RULES[unit.type].speed * .25 : 1.5;
  const stalled = unit.action === 'walk' && distance(unit, approach) < minimumProgress * dt;
  approach.blockedTime = approach.retryAt ? .5 : stalled ? approach.blockedTime + dt : 0;
  approach.retryAt = undefined;
  approach.x = unit.x;
  approach.y = unit.y;
  // Casting pauses a hero route without discarding the chosen side of the crowd.
  if (!usesCrowdRoute && unit.action !== 'walk') { approach.detour = null; approach.detourRoute = undefined; }
  if (approach.detour && distance(unit, approach.detour) < (usesCrowdRoute ? .75 : 4)) {
    approach.detour = approach.detourRoute?.shift() ?? null;
  }
  // A non-null detour is assigned together with its deadline below.
  if (approach.detour && (battle.elapsed >= approach.detourUntil! || approach.blockedTime >= .5)) {
    approach.detour = null;
    approach.detourRoute = undefined;
  }
  if (!approach.detour && approach.blockedTime >= .5) {
    const friends = living(alliedActors(battle)).filter(ally => ally.id !== unit.id);
    const apart = Math.max(1, distance(unit, goal));
    const dx = (goal.x - unit.x) / apart;
    const dy = (goal.y - unit.y) / apart;
    const blocked = friends.some(ally => distance(unit, ally) < 30
      && (ally.x - unit.x) * dx + (ally.y - unit.y) * dy > 0);
    if (blocked) {
      if (usesCrowdRoute && (goal === target || unit.type === 'healer')) {
        // Keep the patient as an obstacle, but exclude the moving monk itself. A monk's
        // route ends inside its existing cast threshold, without increasing heal range.
        const arrivalRange = unit.type === 'healer' ? unit.range - 22 : stopDistance + 6;
        const route = findCrowdRoute(unit, target, friends, arrivalRange,
          hasLandPath, ALLY_ADVANCE_LIMIT);
        approach.detour = route?.[0] ?? null;
        approach.detourRoute = route?.slice(1);
        approach.detourTarget = { x: target.x, y: target.y };
        let previous: Point = unit;
        const length = route?.reduce((total, point) => {
          const segment = distance(previous, point); previous = point; return total + segment;
        }, 0) ?? 0;
        approach.detourUntil = battle.elapsed + length / RULES[unit.type].speed + 1;
        approach.blockedTime = 0;
        unit.approach = approach;
        if (!route) {
          // A sealed frontage is a wait, not endless running. Retry when the crowd can change.
          approach.retryAt = battle.elapsed + .5;
          unit.action = 'idle';
          return;
        }
        moveToward(unit, approach.detour!, dt);
        return;
      }
      const options = [-1, 1].map(side => clampToLand(unit, {
        x: unit.x - dy * 42 * side, y: unit.y + dx * 42 * side,
      })).filter(point => distance(unit, point) >= 30 && hasLandPath(unit, point));
      const clearance = (point: Point): number => Math.min(80, ...friends.map(ally => distance(point, ally)));
      options.sort((a, b) => clearance(b) - clearance(a));
      approach.detour = options[0] ?? null;
      approach.detourUntil = battle.elapsed + 1.5;
      approach.blockedTime = 0;
    }
  }
  unit.approach = approach;
  moveToward(unit, approach.detour ?? goal, dt, approach.detour ? 0 : stopDistance);
}

function supportPosition(unit: ActorBase, target: ActorBase): Point {
  const laneLimit = unit.range * .3;
  const laneOffset = Math.max(-laneLimit, Math.min(laneLimit, (unit.homeX - target.homeX) * .3));
  return {
    x: target.x + laneOffset,
    // Healthy support follows the army forward, never retreats just to fill a rear offset.
    y: Math.min(unit.y, FIELD.battlefieldBottom - 25, target.y + unit.range * .5),
  };
}

function followAlly(battle: Battle, unit: AllyActor, target: AllyActor | HeroActor, dt: number): void {
  const goal = supportPosition(unit, target);
  const apart = distance(unit, goal);
  if (apart > 24) unit.following = true;
  if (apart < 10) unit.following = false;
  if (unit.following) advanceAlly(battle, unit, target, dt, goal, 8);
  else { unit.action = 'idle'; unit.approach = null; }
}

function actHealer(battle: Battle, unit: AllyActor, dt: number): void {
  const wounded = alliedActors(battle)
    .filter(target => target.hp > 0 && target.hp < target.maxHp)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  const current = wounded.find(target => target.id === unit.focusId);
  const urgent = wounded[0];
  const target = current && (!urgent || current.hp / current.maxHp <= urgent.hp / urgent.maxHp + .2)
    ? current : urgent;
  if (target) {
    unit.focusId = target.id;
    if (distance(unit, target) <= unit.range - 20) {
      unit.following = false;
      unit.approach = null;
      if (unit.cooldown <= 0) beginAction(unit, target, 'heal');
      else unit.action = 'idle';
    } else {
      // Reach the actual patient: a fixed rear position may lie outside the heal radius.
      unit.following = false;
      advanceAlly(battle, unit, target, dt, target, unit.range - 22);
    }
    return;
  }
  unit.focusId = null;
  if (!living(battle.enemies).length) {
    unit.following = false;
    unit.approach = null;
    unit.action = 'idle';
    return;
  }
  const fighters = living(alliedActors(battle)).filter(ally => ally.type !== 'healer');
  const front = [...fighters].sort((a, b) => a.y - b.y)[0];
  const followed = fighters.find(ally => ally.id === unit.followId);
  const leader = followed && front && followed.y <= front.y + 50 ? followed : front;
  if (!leader || distance(unit, leader) <= unit.range || leader.y >= unit.y) {
    unit.following = false;
    unit.approach = null;
    unit.action = 'idle';
    return;
  }
  unit.followId = leader.id;
  followAlly(battle, unit, leader, dt);
}

function cancelHeroActions(battle: Battle): void {
  const hero = battle.hero;
  hero.pendingAbility = null;
  hero.bastionTime = 0;
  hero.guardianWard = 0;
  hero.guardianWardTime = 0;
  hero.guardianWardCooldown = 0;
  hero.holyStrikeTime = 0;
  hero.targetId = null;
  battle.effects = battle.effects.filter(effect => effect.type !== 'hero-hammer');
}

function woundedAllies(battle: Battle, range: number): (AllyActor | HeroActor)[] {
  return alliedActors(battle).filter(target => target.side === battle.hero.side
    && target.hp > 0 && target.hp < target.maxHp && distance(battle.hero, target) <= range)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
}

function beginHeroAbility(hero: HeroActor, kind: HeroAbilityKind, targets: readonly Actor[]): void {
  // Ability queues own their target and impact flag; basic attacks keep their own state.
  hero.pendingAbility = { kind, sourceId: hero.id, targetIds: targets.map(target => target.id),
    time: 0, duration: .65 / COMBAT_PACE, didImpact: false };
  hero.action = kind === 'hammer' ? 'hammer' : 'heal';
  hero.actionTime = 0;
  hero.actionDuration = hero.pendingAbility.duration;
  hero.targetX = targets[0].x;
  hero.targetY = targets[0].y;
  faceToward(hero, targets[0]);
  if (kind === 'heal') hero.healCooldown = hero.stats.healCooldown;
  if (kind === 'hammer') hero.hammerCooldown = hero.stats.hammerCooldown;
  if (kind === 'miracle') hero.miracleUsed = true;
}

function healByHero(battle: Battle, target: Actor | undefined, amount: number, range: number, shield = 0): void {
  const hero = battle.hero;
  if (hero.hp <= 0 || !target || target.hp <= 0 || target.type === 'castle'
    || target.side !== hero.side || distance(hero, target) > range) return;
  const healed = Math.min(amount, target.maxHp - target.hp);
  target.hp += Math.max(0, healed);
  shield = Math.min(shield, Math.max(0, amount - healed));
  if (shield > 0) {
    // Refresh a finite barrier instead of stacking it on every eight-second cast.
    target.shield = Math.max(target.shield, shield);
    target.shieldTime = hero.stats.healShieldDuration;
  }
  if (healed > 0 || shield > 0) addEffect(battle, 'hero-heal', hero, target, .65,
    { targetId: target.id, amount: healed, shield });
}

function resolveHeroAbility(battle: Battle, pending: PendingHeroAbility): void {
  const hero = battle.hero;
  if (hero.hp <= 0 || pending.sourceId !== hero.id) return;
  const stats = hero.stats;
  if (pending.kind === 'miracle') {
    if (!stats.healUnlocked || !stats.miracle) return;
    for (const target of alliedActors(battle)) healByHero(battle, target,
      target.maxHp * stats.miracleHealFraction, stats.miracleRadius);
    return;
  }
  if (pending.kind === 'heal') {
    if (!stats.healUnlocked) return;
    pending.targetIds.forEach((id, index) => healByHero(battle, findActor(battle, id),
      stats.healAmount * (index === 0 ? 1 : stats.secondaryHealFraction), stats.healRange,
      index === 0 ? stats.healShield : 0));
    return;
  }
  const target = findActor(battle, pending.targetIds[0]);
  if (!stats.hammerUnlocked || !target || target.hp <= 0 || target.side === hero.side || target.type === 'castle'
    || distance(hero, target) > stats.hammerRange) return;
  addEffect(battle, 'hero-hammer', hero, target, Math.max(.15, distance(hero, target) / 330),
    { targetId: target.id, damage: stats.hammerDamage, landed: false });
}

function stunByHammer(hero: HeroActor, target: Actor): void {
  if (target.hp <= 0 || hero.stats.hammerStunDuration <= 0) return;
  target.stunTime = Math.max(target.stunTime, hero.stats.hammerStunDuration);
  target.action = 'idle';
  target.targetId = null;
}

function landHeroHammer(battle: Battle, effect: EffectOf<'hero-hammer'>, events: BattleEvent[]): void {
  const hero = battle.hero;
  const target = findActor(battle, effect.targetId);
  // Revalidate at arrival: a dead caster, switched side or escaped target cancels damage.
  if (hero.hp <= 0 || !hero.stats.hammerUnlocked || effect.sourceId !== hero.id || !target || target.hp <= 0
    || target.side === hero.side || target.type === 'castle'
    || distance(hero, target) > hero.stats.hammerRange) return;
  addEffect(battle, 'hero-impact', hero, target, .4, { targetId: target.id });
  hurt(battle, target, effect.damage, events);
  if (hero.stats.holyStrikeFraction > 0) hero.holyStrikeTime = hero.stats.holyStrikeDuration;
  stunByHammer(hero, target);
  if (hero.stats.hammerSplashFraction <= 0) return;
  for (const enemy of battle.enemies) {
    if (enemy.id !== target.id && enemy.side !== hero.side && enemy.hp > 0
      && distance(target, enemy) <= hero.stats.hammerSplashRadius) {
      hurt(battle, enemy, effect.damage * hero.stats.hammerSplashFraction, events);
      stunByHammer(hero, enemy);
    }
  }
}

function actHero(battle: Battle, hero: HeroActor, dt: number): void {
  const stats = hero.stats;
  const wounded = stats.healUnlocked ? woundedAllies(battle, stats.healRange) : [];
  const emergency = stats.healUnlocked && stats.miracle && !hero.miracleUsed
    && woundedAllies(battle, stats.miracleRadius).some(target => target.hp / target.maxHp <= stats.miracleThreshold);
  if (emergency) { beginHeroAbility(hero, 'miracle', [hero]); return; }
  if (stats.healUnlocked && hero.healCooldown <= 0 && wounded.length) {
    beginHeroAbility(hero, 'heal', wounded.slice(0, stats.secondaryHealFraction > 0 ? 2 : 1));
    return;
  }
  const enemies = living(battle.enemies);
  if (stats.hammerUnlocked && hero.hammerCooldown <= 0) {
    const target = nearest(hero, enemies.filter(isRangedEnemy), stats.hammerRange)
      ?? nearest(hero, enemies, stats.hammerRange);
    if (target) { beginHeroAbility(hero, 'hammer', [target]); return; }
  }
  const adjacent = nearest(hero, enemies.filter(enemy => hasLandPath(hero, enemy)), hero.range + 6);
  if (adjacent) {
    if (hero.cooldown <= 0) beginAction(hero, adjacent, 'attack');
    else hero.action = 'idle';
    return;
  }
  const target = focusedEnemy(hero, enemies);
  if (!target) { hero.action = 'idle'; return; }
  const onlyRanged = enemies.every(isRangedEnemy);
  if (onlyRanged && stats.hammerUnlocked) {
    const castingRange = stats.hammerRange - 8;
    // A ranged stance needs a reachable casting position, not a fixed point inside
    // friendly archers. Once in range, wait for the next cast instead of pacing.
    if (distance(hero, target) <= castingRange) { hero.action = 'idle'; hero.approach = null; return; }
    advanceAlly(battle, hero, target, dt, target, castingRange - 6);
    return;
  }
  const fighters = living(battle.allies).filter(ally => ally.type !== 'healer');
  const frontline = nearest(target, fighters.filter(ally => ally.type !== 'archer'));
  const leader = frontline ?? nearest(target, fighters);
  const frontlineEngaged = frontline && distance(frontline, target) <= frontline.range + 27;
  if (!leader || onlyRanged || !frontline || frontlineEngaged) {
    // Once the frontline engages, join it using the same collision detours as melee allies.
    // Following a swordsman/lancer's rear position can leave the hero permanently out of reach.
    advanceAlly(battle, hero, target, dt);
    return;
  }
  // Follow the front without overtaking it to tank every incoming group; leave
  // enough room for friendly collision spacing until it reaches the enemy.
  const goal = { x: Math.max(leader.x - 70, Math.min(leader.x + 70, target.x)),
    y: Math.max(target.y + hero.range - 2, leader.y + 30) };
  advanceAlly(battle, hero, target, dt, goal, 4);
}

function actEnemyHealer(battle: Battle, unit: Actor, dt: number): boolean {
  const fighters = living(battle.enemies).filter(target => target.side === unit.side && target.id !== unit.id && !isEnemyHealer(target));
  if (!fighters.length) {
    // A support-only remainder still advances and fights instead of waiting for enrage.
    unit.focusId = null;
    unit.followId = null;
    unit.following = false;
    return false;
  }
  const healRange = RULES.goblinHealer.healRange;
  const wounded = fighters.filter(target => target.hp < target.maxHp)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  const current = wounded.find(target => target.id === unit.focusId);
  const urgent = wounded[0];
  const target = current && current.hp / current.maxHp <= urgent.hp / urgent.maxHp + .2 ? current : urgent;
  if (target) {
    unit.focusId = target.id;
    unit.following = false;
    if (distance(unit, target) <= healRange - 12) {
      if (unit.cooldown <= 0) beginAction(unit, target, 'heal');
      else unit.action = 'idle';
    } else moveToward(unit, target, dt, healRange - 14);
    return true;
  }

  unit.focusId = null;
  const defenders = living(alliedActors(battle));
  const opponents: Actor[] = defenders.length ? defenders : living([battle.castle]);
  if (!opponents.length) return true;
  // The opponents here are a non-empty living set with finite battlefield positions.
  const front = [...fighters].sort((a, b) => distance(a, nearest(a, opponents)!) - distance(b, nearest(b, opponents)!))[0];
  const followed = fighters.find(target => target.id === unit.followId);
  const leader = followed && distance(followed, nearest(followed, opponents)!) <= distance(front, nearest(front, opponents)!) + 45
    ? followed : front;
  const opponent = nearest(leader, opponents)!;
  const apart = Math.max(1, distance(leader, opponent));
  // Stay behind the fighters even when the army turns into the king's side peninsula.
  const goal = clampToLand(unit, {
    x: leader.x + (leader.x - opponent.x) / apart * healRange * .65,
    y: leader.y + (leader.y - opponent.y) / apart * healRange * .65,
  });
  unit.followId = leader.id;
  const separation = distance(unit, goal);
  if (separation > 24) unit.following = true;
  if (separation < 10) unit.following = false;
  if (unit.following) moveToward(unit, goal, dt, 8);
  else unit.action = 'idle';
  return true;
}

function act(battle: Battle, unit: Actor, dt: number): void {
  if (unit.hp <= 0 || unit.stunTime > 0 || isBusy(unit) || unit.type === 'castle') return;
  if (unit.type === 'hero') {
    actHero(battle, unit, dt);
    return;
  }
  if (unit.type === 'healer') {
    actHealer(battle, unit, dt);
    return;
  }
  if (isEnemyHealer(unit) && actEnemyHealer(battle, unit, dt)) return;

  const defenders = unit.side === 'enemy' ? living(alliedActors(battle)) : [];
  const opponents: Actor[] = unit.side === 'enemy' ? (defenders.length ? defenders : [battle.castle]) : battle.enemies;
  const target = focusedEnemy(unit, opponents);
  if (!target) {
    // Hold ground between groups; home cells are only the next preparation layout.
    unit.approach = null;
    unit.action = 'idle';
    return;
  }
  unit.targetX = target.x;
  unit.targetY = target.y;
  faceToward(unit, target);
  const apart = distance(unit, target);
  const combatType = getEnemyCombatType(unit.type);
  const ranged = combatType === 'archer' || combatType === 'goblinArcher';
  // Incoming archers step into the arena before firing, so the guard need not camp on the entrance.
  if (combatType === 'goblinArcher' && unit.y < 125) {
    moveToward(unit, { x: target.x, y: Math.max(135, target.y) }, dt);
    return;
  }
  if (unit.type === 'archer') {
    if (apart > unit.range) unit.closingRange = true;
    if (apart <= unit.range - 20) unit.closingRange = false;
    if (unit.closingRange) {
      moveToward(unit, target, dt, unit.range - 22);
      return;
    }
  }
  if (apart <= unit.range + (ranged ? 0 : 6) && (ranged || hasLandPath(unit, target))) {
    unit.approach = null;
    if (unit.cooldown <= 0) beginAction(unit, target,
      ranged ? 'shoot' : 'attack');
    else unit.action = 'idle';
    return;
  }
  if (unit.side === 'enemy') {
    moveToward(unit, target, dt, unit.range - 2);
  } else if (unit.type === 'swordsman' || unit.type === 'lancer' || unit.type === 'pantherRider') {
    // Spear reach lets lancers stop behind defenders, while retaining melee land-path checks.
    advanceAlly(battle, unit, target, dt);
  } else unit.action = 'idle';
}

function separateAllies(battle: Battle, dt: number): void {
  const allies = living(alliedActors(battle));
  for (let i = 0; i < allies.length; i += 1) {
    for (let j = i + 1; j < allies.length; j += 1) {
      const first = allies[i];
      const second = allies[j];
      const apart = distance(first, second);
      if (apart >= 27) continue;
      const firstMoves = first.action === 'walk';
      const secondMoves = second.action === 'walk';
      if (!firstMoves && !secondMoves) continue;
      const push = Math.min((27 - apart) * .35, 40 * dt);
      const dx = apart > .001 ? (second.x - first.x) / apart : 1;
      const dy = apart > .001 ? (second.y - first.y) / apart : 0;
      const share = firstMoves && secondMoves ? .5 : 1;
      for (const [moving, direction, enabled] of [[first, -1, firstMoves], [second, 1, secondMoves]] as const) {
        if (!enabled) continue;
        const next = constrainStep(moving, {
          x: moving.x + dx * push * share * direction,
          y: moving.y + dy * push * share * direction,
        });
        moving.x = next.x;
        moving.y = next.y;
      }
    }
  }
}

function ageVisuals(battle: Battle, dt: number, events: BattleEvent[], active: boolean): void {
  if (battle.hero.hp <= 0) cancelHeroActions(battle);
  // Iterate a snapshot because a landed arrow can append hit, death, and gold effects.
  for (const effect of [...battle.effects]) {
    effect.age += dt;
    if (active && effect.type === 'arrow' && !effect.landed && effect.age >= effect.duration) {
      effect.landed = true;
      hurt(battle, findActor(battle, effect.targetId), effect.damage, events);
    } else if (active && effect.type === 'hero-hammer' && !effect.landed && effect.age >= effect.duration) {
      effect.landed = true;
      landHeroHammer(battle, effect, events);
    }
  }
  battle.effects = battle.effects.filter(effect => effect.age < effect.duration);
  for (const unit of allActors(battle)) {
    unit.hitTime = Math.max(0, unit.hitTime - dt);
    if (unit.hp <= 0) unit.deathTime += dt;
    if (!active) continue;
    unit.shieldTime = Math.max(0, unit.shieldTime - dt);
    if (unit.shieldTime <= 0) unit.shield = 0;
    unit.stunTime = Math.max(0, unit.stunTime - dt);
    unit.cooldown = Math.max(0, unit.cooldown - dt);
    if (unit === battle.hero && unit.hp > 0) {
      const hero = battle.hero;
      hero.healCooldown = Math.max(0, hero.healCooldown - dt);
      hero.hammerCooldown = Math.max(0, hero.hammerCooldown - dt);
      hero.guardianWardCooldown = Math.max(0, hero.guardianWardCooldown - dt);
      hero.guardianWardTime = Math.max(0, hero.guardianWardTime - dt);
      if (hero.guardianWardTime <= 0) hero.guardianWard = 0;
      hero.holyStrikeTime = Math.max(0, hero.holyStrikeTime - dt);
      hero.bastionTime = Math.max(0, hero.bastionTime - dt);
      hero.bastionCooldown = Math.max(0, hero.bastionCooldown - dt);
      if (hero.stats.auraUnlocked && hero.stats.bastion && hero.bastionCooldown <= 0) {
        hero.bastionTime = hero.stats.bastionDuration;
        hero.bastionCooldown = hero.stats.bastionInterval;
      }
      const pending = hero.pendingAbility;
      if (pending) {
        if (hero.stunTime > 0) continue;
        pending.time += dt;
        hero.actionTime = pending.time;
        if (!pending.didImpact && pending.time >= pending.duration * hero.impactFraction) {
          pending.didImpact = true;
          resolveHeroAbility(battle, pending);
        }
        if (pending.time >= pending.duration) { hero.pendingAbility = null; hero.action = 'idle'; }
        continue;
      }
    }
    if (unit.hp <= 0 || unit.stunTime > 0 || !isBusy(unit)) continue;
    unit.actionTime += dt;
    if (!unit.didImpact && unit.actionTime >= unit.actionDuration * unit.impactFraction) {
      unit.didImpact = true;
      resolveImpact(battle, unit, events);
    }
    if (unit.hp > 0 && unit.actionTime >= unit.actionDuration) unit.action = 'idle';
  }
}

function separateEnemies(battle: Battle): void {
  const enemies = living(battle.enemies);
  // The royal neck is only 16px tall. Full 21px spacing can push two enemies
  // away from its entrance forever; allow tighter ranks through the neck.
  const nearRoyalNeck = (unit: Point): boolean => unit.x <= ROYAL_ROUTE[0].x + 21
    && unit.x >= ROYAL_ROUTE[1].x - 21 && Math.abs(unit.y - ROYAL_ROUTE[0].y) <= 21;
  for (let i = 0; i < enemies.length; i += 1) {
    for (let j = i + 1; j < enemies.length; j += 1) {
      const first = enemies[i];
      const second = enemies[j];
      const apart = distance(first, second);
      const spacing = nearRoyalNeck(first) && nearRoyalNeck(second) ? 12 : 21;
      if (apart >= spacing || apart === 0) continue;
      const push = (spacing - apart) * .22;
      const dx = (second.x - first.x) / apart * push;
      const dy = (second.y - first.y) / apart * push;
      if (!isBusy(first)) Object.assign(first, constrainStep(first, { x: first.x - dx, y: first.y - dy }));
      if (!isBusy(second)) Object.assign(second, constrainStep(second, { x: second.x + dx, y: second.y + dy }));
    }
  }
}

function step(battle: Battle, dt: number, events: BattleEvent[]): void {
  const active = battle.phase === 'running';
  ageVisuals(battle, dt, events, active);
  if (!active) return;
  battle.elapsed += dt;
  while (battle.spawned < battle.total && battle.elapsed >= battle.nextSpawn) {
    const index = battle.spawned++;
    const spawn = battle.wave.spawns[index];
    battle.enemies.push(actor({ id: `${spawn.type}-${index + 1}`, side: 'enemy',
      ...ENEMY_TYPES[spawn.type], ...spawn }));
    battle.nextSpawn = battle.wave.spawns[battle.spawned]?.at ?? Infinity;
  }
  // Escalating pressure resolves support-only stalemates without imposing a sudden defeat timer.
  battle.enraged = battle.elapsed >= battle.enrageAt;
  if (battle.enraged) {
    const multiplier = 2 + Math.floor((battle.elapsed - battle.enrageAt) / 10);
    for (const enemy of battle.enemies) enemy.damage = enemy.baseDamage * multiplier;
  }
  for (const unit of [...battle.allies, ...battle.enemies, battle.hero]) act(battle, unit, dt);
  separateAllies(battle, dt);
  separateEnemies(battle);
  if (battle.castle.hp <= 0) battle.phase = 'defeat';
  else if (battle.spawned === battle.total && battle.kills === battle.total) battle.phase = 'victory';
  if (battle.phase !== 'running') {
    cancelHeroActions(battle);
    battle.effects = battle.effects.filter(effect => effect.type !== 'arrow');
    for (const unit of allActors(battle)) {
      if (unit.hp > 0) unit.action = 'idle';
      unit.targetId = null;
    }
  }
}

export function updateBattle(battle: Battle, dt: number): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (!Number.isFinite(dt) || dt <= 0) return events;
  // Carry partial ticks across frames: resolving them immediately makes targeting and
  // separation depend on FPS and the speed control. The cap still bounds catch-up work.
  battle.stepRemainder += Math.min(dt, MAX_FRAME_DELTA);
  while (battle.stepRemainder + 1e-10 >= FIXED_STEP) {
    step(battle, FIXED_STEP, events);
    // Tolerate rounding at an exact tick boundary without carrying a negative balance.
    battle.stepRemainder = Math.max(0, battle.stepRemainder - FIXED_STEP);
  }
  return events;
}
