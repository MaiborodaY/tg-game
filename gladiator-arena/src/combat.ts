import type { EnemyVisualPreset, HeroEquipment, HeroItemId, HeroWeaponClass } from "./hero";

export type ActionId = "forward" | "back" | "lunge" | "light" | "medium" | "heavy" | "switchWeapon" | "shuriken" | "taunt" | "rest";
export type Result = "playing" | "win" | "lose" | "draw";
export type TurnOwner = "player" | "enemy";

export interface ActionConfig {
  id: ActionId;
  title: string;
  detail: string;
  cost: number;
  damage?: number;
  blockChance?: number;
  restore?: number;
  heal?: number;
  glory?: number;
  vulnerability?: number;
  move?: number;
  rangeMax?: number;
}

export interface CombatMovementTuning {
  forwardMoveDistance: number;
  backMoveDistance: number;
  lungeMoveDistance: number;
}

interface DamageApplication {
  armorAbsorbed: number;
  armorBroken: boolean;
}

export interface FighterState {
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  stamina: number;
  maxStamina: number;
  damageBonus: number;
  weaponDamageBonus?: number;
  movementDistanceBonus: number;
  bodyScaleBonus: number;
  clinchRangeBonus: number;
  restHpRestoreBonus: number;
  restStaminaRestoreBonus: number;
  weaponClass?: HeroWeaponClass;
  bowShotsRemaining?: number;
  bowMaxShots?: number;
  shurikenCount?: number;
  shurikenDamage?: number;
  shurikenItemId?: HeroItemId;
  equipment?: HeroEquipment;
  visualPreset?: EnemyVisualPreset;
}

export interface LogEntry {
  text: string;
  important?: boolean;
}

export interface CombatEncounterState {
  id: string;
  kind: "random" | "boss";
  tierId: number;
  opponentId: string;
}

export interface CombatState {
  player: FighterState;
  enemy: FighterState;
  encounter?: CombatEncounterState;
  round: number;
  score: number;
  result: Result;
  activeTurn: TurnOwner;
  distance: number;
  playerPosition: number;
  enemyPosition: number;
  playerIncomingBonus: number;
  enemyIncomingBonus: number;
  lastPlayerAction?: ActionId;
  lastEnemyAction?: ActionId;
  lastPlayerDamage: number;
  lastEnemyDamage: number;
  lastPlayerArmorAbsorbed: number;
  lastEnemyArmorAbsorbed: number;
  lastPlayerArmorBroken: boolean;
  lastEnemyArmorBroken: boolean;
  lastPlayerBlocked: boolean;
  lastEnemyBlocked: boolean;
  log: LogEntry[];
}

export const MAX_HP = 10;
export const MAX_STAMINA = 10;
export const MIN_DISTANCE = 0;
export const MAX_DISTANCE = 4;
export const START_DISTANCE = 3;
export const MELEE_RANGE = 0;
export const DEFAULT_FORWARD_MOVE_DISTANCE = 0.2;
export const DEFAULT_BACK_MOVE_DISTANCE = 0.1;
export const DEFAULT_LUNGE_MOVE_DISTANCE = 0.3;
export const MOVE_DISTANCE_PER_STAMINA = 0.2;
export const DAMAGE_BONUS_PER_ATTACK_STAMINA = 10;
export const BOW_SHOTS_PER_BATTLE = 5;

export type DistanceBand = "clinch" | "melee" | "near" | "far" | "very-far";

const defaultCombatMovementTuning: CombatMovementTuning = {
  forwardMoveDistance: DEFAULT_FORWARD_MOVE_DISTANCE,
  backMoveDistance: DEFAULT_BACK_MOVE_DISTANCE,
  lungeMoveDistance: DEFAULT_LUNGE_MOVE_DISTANCE,
};

let combatMovementTuning: CombatMovementTuning = { ...defaultCombatMovementTuning };

export const actions: Record<ActionId, ActionConfig> = {
  forward: {
    id: "forward",
    title: "Step Forward",
    detail: "Move forward",
    cost: 1,
    move: -DEFAULT_FORWARD_MOVE_DISTANCE,
  },
  back: {
    id: "back",
    title: "Step Back",
    detail: "Move back",
    cost: 1,
    move: DEFAULT_BACK_MOVE_DISTANCE,
  },
  lunge: {
    id: "lunge",
    title: "Lunge",
    detail: "Dash + hit in clinch",
    cost: 2,
    move: -DEFAULT_LUNGE_MOVE_DISTANCE,
    damage: 4,
    blockChance: 0.5,
    rangeMax: MELEE_RANGE,
  },
  light: {
    id: "light",
    title: "Weak Slash",
    detail: "Clinch only - Damage 1",
    cost: 2,
    damage: 1,
    blockChance: 0.25,
    rangeMax: MELEE_RANGE,
  },
  medium: {
    id: "medium",
    title: "Medium Slash",
    detail: "Clinch only - Damage 2",
    cost: 3,
    damage: 2,
    blockChance: 0.5,
    rangeMax: MELEE_RANGE,
  },
  heavy: {
    id: "heavy",
    title: "Grand Bonk",
    detail: "Clinch only - Damage 4",
    cost: 5,
    damage: 4,
    blockChance: 0.75,
    rangeMax: MELEE_RANGE,
  },
  switchWeapon: {
    id: "switchWeapon",
    title: "Draw Steel",
    detail: "Switch to melee",
    cost: 0,
  },
  shuriken: {
    id: "shuriken",
    title: "Throw Shuriken",
    detail: "Consumable - always hits",
    cost: 0,
    damage: 0,
    blockChance: 0,
    rangeMax: MAX_DISTANCE,
  },
  taunt: {
    id: "taunt",
    title: "Taunt Crowd",
    detail: "Cost 1 - Glory, +1 incoming",
    cost: 1,
    glory: 70,
    vulnerability: 1,
  },
  rest: {
    id: "rest",
    title: "Catch Breath",
    detail: "Free - Restore 5, +1 HP",
    cost: 0,
    restore: 5,
    heal: 1,
  },
};

export const actionOrder: ActionId[] = ["forward", "back", "lunge", "light", "medium", "heavy", "switchWeapon", "shuriken", "taunt", "rest"];

export function setCombatMovementTuning(nextTuning: Partial<CombatMovementTuning>): void {
  combatMovementTuning = {
    forwardMoveDistance: clampMoveDistance(nextTuning.forwardMoveDistance, defaultCombatMovementTuning.forwardMoveDistance),
    backMoveDistance: clampMoveDistance(nextTuning.backMoveDistance, defaultCombatMovementTuning.backMoveDistance),
    lungeMoveDistance: clampMoveDistance(nextTuning.lungeMoveDistance, defaultCombatMovementTuning.lungeMoveDistance),
  };
}

export function getCombatMovementTuning(): CombatMovementTuning {
  return { ...combatMovementTuning };
}

export function getActionMove(actionId: ActionId, actor?: FighterState): number {
  const movementDistanceBonus = Math.max(0, actor?.movementDistanceBonus ?? 0);

  if (actionId === "forward") {
    return applyMovementDistanceBonus(-combatMovementTuning.forwardMoveDistance, movementDistanceBonus);
  }

  if (actionId === "back") {
    return applyMovementDistanceBonus(combatMovementTuning.backMoveDistance, movementDistanceBonus);
  }

  if (actionId === "lunge") {
    return applyMovementDistanceBonus(-combatMovementTuning.lungeMoveDistance, movementDistanceBonus);
  }

  return actions[actionId].move ?? 0;
}

export function getActionStaminaCost(actionId: ActionId, actor?: FighterState): number {
  const actionMove = Math.abs(getActionMove(actionId, actor));

  if (actionMove > 0) {
    return Math.max(1, Math.round(roundStaminaCostRatio(actionMove / MOVE_DISTANCE_PER_STAMINA)));
  }

  if (actions[actionId].damage) {
    return actions[actionId].cost + Math.floor(getActionDamageBonus(actor) / DAMAGE_BONUS_PER_ATTACK_STAMINA);
  }

  return actions[actionId].cost;
}

export function getActionStaminaRestore(actionId: ActionId, actor?: FighterState): number {
  const baseRestore = actions[actionId].restore ?? 0;

  return baseRestore > 0 ? baseRestore + Math.max(0, actor?.restStaminaRestoreBonus ?? 0) : 0;
}

export function getActionHeal(actionId: ActionId, actor?: FighterState): number {
  const baseHeal = actions[actionId].heal ?? 0;

  return baseHeal > 0 ? baseHeal + Math.max(0, actor?.restHpRestoreBonus ?? 0) : 0;
}

export function freshState(): CombatState {
  return {
    player: {
      name: "Borshemir",
      hp: MAX_HP,
      maxHp: MAX_HP,
      armor: 0,
      maxArmor: 0,
      stamina: MAX_STAMINA,
      maxStamina: MAX_STAMINA,
      damageBonus: 0,
      weaponDamageBonus: 0,
      movementDistanceBonus: 0,
      bodyScaleBonus: 0,
      clinchRangeBonus: 0,
      restHpRestoreBonus: 0,
      restStaminaRestoreBonus: 0,
      weaponClass: "sword",
    },
    enemy: {
      name: "Grumbus",
      hp: MAX_HP,
      maxHp: MAX_HP,
      armor: 0,
      maxArmor: 0,
      stamina: MAX_STAMINA,
      maxStamina: MAX_STAMINA,
      damageBonus: 0,
      weaponDamageBonus: 0,
      movementDistanceBonus: 0,
      bodyScaleBonus: 0,
      clinchRangeBonus: 0,
      restHpRestoreBonus: 0,
      restStaminaRestoreBonus: 0,
      weaponClass: "sword",
    },
    round: 1,
    score: 0,
    result: "playing",
    activeTurn: "player",
    distance: START_DISTANCE,
    playerPosition: 0,
    enemyPosition: START_DISTANCE,
    playerIncomingBonus: 0,
    enemyIncomingBonus: 0,
    lastPlayerDamage: 0,
    lastEnemyDamage: 0,
    lastPlayerArmorAbsorbed: 0,
    lastEnemyArmorAbsorbed: 0,
    lastPlayerArmorBroken: false,
    lastEnemyArmorBroken: false,
    lastPlayerBlocked: false,
    lastEnemyBlocked: false,
    log: [
      { text: "The gate slams open. Borshemir and Grumbus enter the sand.", important: true },
      { text: "Move into range, strike, then survive Grumbus on his turn." },
    ],
  };
}

export function getFighterMaxHp(fighter: FighterState): number {
  return Math.max(1, fighter.maxHp);
}

export function getFighterMaxArmor(fighter: FighterState): number {
  return Math.max(0, fighter.maxArmor ?? 0);
}

export function getFighterMaxStamina(fighter: FighterState): number {
  return Math.max(1, fighter.maxStamina);
}

export function getActionBlockChance(action: ActionConfig, attacker?: FighterState, defender?: FighterState): number {
  void attacker;
  void defender;

  return clamp(action.blockChance ?? 0, 0, 0.95);
}

export function getFighterWeaponClass(fighter: FighterState): HeroWeaponClass {
  return fighter.weaponClass ?? "sword";
}

export function isRangedWeaponClass(weaponClass: HeroWeaponClass | undefined): boolean {
  return weaponClass === "bow";
}

export function isRangedFighter(fighter: FighterState): boolean {
  return isRangedWeaponClass(getFighterWeaponClass(fighter));
}

export function isBowFighter(fighter: FighterState): boolean {
  return getFighterWeaponClass(fighter) === "bow";
}

export function getBowShotsRemaining(fighter: FighterState): number {
  const fallbackShots = isBowFighter(fighter) ? fighter.bowMaxShots ?? BOW_SHOTS_PER_BATTLE : 0;

  return Math.max(0, Math.floor(fighter.bowShotsRemaining ?? fallbackShots));
}

export function getFighterShurikenCount(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.shurikenCount ?? 0));
}

export function getActionTitle(actionId: ActionId, actor?: FighterState): string {
  if (actor && isRangedFighter(actor)) {
    if (actionId === "light") {
      return "Quick Shot";
    }

    if (actionId === "medium") {
      return "Aimed Shot";
    }

    if (actionId === "heavy") {
      return "Power Shot";
    }
  }

  return actions[actionId].title;
}

export function availableActionIds(state: CombatState, actor: TurnOwner): ActionId[] {
  return actionOrder.filter((id) => canUseAction(state, id, actor));
}

export function getFighterClinchRange(fighter?: FighterState): number {
  return Math.min(MAX_DISTANCE, MELEE_RANGE + Math.max(0, fighter?.clinchRangeBonus ?? 0));
}

export function isFighterInClinchRange(state: CombatState, actor: TurnOwner): boolean {
  const fighter = actor === "player" ? state.player : state.enemy;

  return state.distance <= getFighterClinchRange(fighter);
}

export function shouldAutoRestPlayer(state: CombatState): boolean {
  return state.result === "playing" && state.activeTurn === "player" && state.player.stamina <= 0 && canUseAction(state, "rest", "player");
}

export function canUseAction(state: CombatState, actionId: ActionId, actor: TurnOwner = "player"): boolean {
  if (state.result !== "playing") {
    return false;
  }

  if (actor === "player" && state.activeTurn !== "player") {
    return false;
  }

  const action = actions[actionId];
  const fighter = actor === "player" ? state.player : state.enemy;
  const actionRangeMax = getActionRangeMax(action, fighter);
  const fighterClinchRange = getFighterClinchRange(fighter);

  if (actionId === "forward") {
    return state.distance > fighterClinchRange;
  }

  if (actionId === "back") {
    return state.distance < MAX_DISTANCE;
  }

  if (actionId === "lunge") {
    if (isRangedFighter(fighter)) {
      return false;
    }

    return state.distance > fighterClinchRange;
  }

  if (actionId === "switchWeapon") {
    return isBowFighter(fighter);
  }

  if (actionId === "shuriken") {
    return getFighterShurikenCount(fighter) > 0;
  }

  if (isAttackAction(actionId) && isBowFighter(fighter) && getBowShotsRemaining(fighter) <= 0) {
    return false;
  }

  if (actionRangeMax !== undefined) {
    return state.distance <= actionRangeMax;
  }

  return true;
}

export function distanceBand(distance: number, clinchRange = MELEE_RANGE): DistanceBand {
  if (distance <= Math.max(MELEE_RANGE, clinchRange)) {
    return "clinch";
  }

  if (distance <= 1) {
    return "melee";
  }

  if (distance <= 2) {
    return "near";
  }

  if (distance <= 3) {
    return "far";
  }

  return "very-far";
}

export function distanceLabel(distance: number, clinchRange = MELEE_RANGE): string {
  switch (distanceBand(distance, clinchRange)) {
    case "clinch":
      return "Clinch";
    case "melee":
      return "Melee";
    case "near":
      return "Near";
    case "far":
      return "Far";
    case "very-far":
      return "Very far";
  }
}

export function resolvePlayerTurn(current: CombatState, playerActionId: ActionId, random = Math.random): CombatState {
  const state = cloneStateForTurn(current);

  if (!canUseAction(state, playerActionId, "player")) {
    addLog(state, `${getActionTitle(playerActionId, state.player)} is not available right now.`);
    return state;
  }

  applyAction(state, "player", playerActionId, random);

  if (state.result === "playing") {
    state.activeTurn = "enemy";
  }

  return state;
}

export function resolveEnemyTurn(current: CombatState, random = Math.random): CombatState {
  const state = cloneStateForTurn(current);

  if (state.result !== "playing" || state.activeTurn !== "enemy") {
    return state;
  }

  applyAction(state, "enemy", chooseEnemyAction(state, random), random);

  if (state.result !== "playing") {
    return state;
  }

  state.round += 1;
  state.activeTurn = "player";
  return state;
}

function cloneStateForTurn(current: CombatState): CombatState {
  return {
    ...current,
    player: cloneFighterState(current.player),
    enemy: cloneFighterState(current.enemy),
    log: [...current.log],
    lastPlayerAction: undefined,
    lastEnemyAction: undefined,
    lastPlayerDamage: 0,
    lastEnemyDamage: 0,
    lastPlayerArmorAbsorbed: 0,
    lastEnemyArmorAbsorbed: 0,
    lastPlayerArmorBroken: false,
    lastEnemyArmorBroken: false,
    lastPlayerBlocked: false,
    lastEnemyBlocked: false,
  };
}

function cloneFighterState(fighter: FighterState): FighterState {
  return {
    ...fighter,
    equipment: fighter.equipment ? { ...fighter.equipment } : undefined,
    visualPreset: fighter.visualPreset ? { ...fighter.visualPreset } : undefined,
  };
}

function chooseEnemyAction(current: CombatState, random = Math.random): ActionId {
  const available = availableActionIds(current, "enemy");
  const weighted: ActionId[] = [];
  const enemyLowStamina = current.enemy.stamina <= 3;
  const enemyLowHp = current.enemy.hp <= 10;
  const playerLowHp = current.player.hp <= 9;
  const enemyHasRangedWeapon = isRangedFighter(current.enemy);

  for (const id of available) {
    if (id === "switchWeapon") {
      if (enemyHasRangedWeapon && getBowShotsRemaining(current.enemy) <= 0) {
        weighted.push(id, id, id);
      }
      continue;
    }

    if (id === "shuriken") {
      weighted.push(id, playerLowHp ? id : "light");
      continue;
    }

    if (!isFighterInClinchRange(current, "enemy")) {
      if (enemyHasRangedWeapon) {
        if (id === "heavy") {
          weighted.push(id, playerLowHp ? id : "medium");
        } else if (id === "medium") {
          weighted.push(id, id);
        } else if (id === "light") {
          weighted.push(id, id, id);
        } else if (id === "back") {
          weighted.push(current.distance < MAX_DISTANCE ? id : "light");
        } else if (id === "rest" && enemyLowStamina) {
          weighted.push(id, id);
        } else if (id === "taunt" && !enemyLowHp) {
          weighted.push(id);
        }
      } else if (id === "forward") {
        weighted.push(id, id, id);
      } else if (id === "lunge") {
        weighted.push(id, id);
      } else if (id === "rest" && enemyLowStamina) {
        weighted.push(id, id);
      } else if (id === "taunt" && !enemyLowHp) {
        weighted.push(id);
      }
      continue;
    }

    if (id === "heavy") {
      weighted.push(id, playerLowHp ? id : "medium");
    } else if (id === "medium") {
      weighted.push(id, id, playerLowHp ? "heavy" : id);
    } else if (id === "light") {
      weighted.push(id, id, id);
    } else if (id === "rest") {
      weighted.push(id, enemyLowStamina ? id : "light");
    } else if (id === "back") {
      weighted.push(enemyLowHp ? id : "light");
    } else if (id === "taunt") {
      weighted.push(id);
    }
  }

  return weighted[Math.floor(random() * weighted.length)] ?? "rest";
}

function applyAction(state: CombatState, actor: TurnOwner, actionId: ActionId, random: () => number): void {
  const action = actions[actionId];
  const attacker = actor === "player" ? state.player : state.enemy;
  const defender = actor === "player" ? state.enemy : state.player;
  const actionMove = getActionMove(actionId, attacker);
  const actorLabel = actor === "player" ? "You" : "Grumbus";
  const defenderLabel = actor === "player" ? "Grumbus" : "you";
  const defenderOwner = actor === "player" ? "enemy" : "player";
  const actionTitle = getActionTitle(actionId, attacker);
  const actionRangeMax = getActionRangeMax(action, attacker);
  const staminaRestore = getActionStaminaRestore(actionId, attacker);
  const heal = getActionHeal(actionId, attacker);

  attacker.stamina = clamp(attacker.stamina - getActionStaminaCost(actionId, attacker), 0, getFighterMaxStamina(attacker));

  if (actionId === "switchWeapon") {
    attacker.weaponClass = "sword";
  }

  if (actionMove) {
    moveActor(state, actor, actionMove);
  }

  if (staminaRestore > 0) {
    attacker.stamina = clamp(attacker.stamina + staminaRestore, 0, getFighterMaxStamina(attacker));
  }

  if (heal > 0) {
    attacker.hp = clamp(attacker.hp + heal, 0, getFighterMaxHp(attacker));
  }

  if (action.vulnerability) {
    addIncomingBonus(state, actor, action.vulnerability);
  }

  let damage = getActionDamage(actionId, attacker);
  const inRange = actionRangeMax === undefined || state.distance <= actionRangeMax;
  let blocked = false;
  let appliedDamage: DamageApplication = { armorAbsorbed: 0, armorBroken: false };

  if (actionId === "shuriken" && getFighterShurikenCount(attacker) > 0) {
    attacker.shurikenCount = getFighterShurikenCount(attacker) - 1;
  }

  if (isAttackAction(actionId) && isBowFighter(attacker) && getBowShotsRemaining(attacker) > 0) {
    attacker.bowShotsRemaining = getBowShotsRemaining(attacker) - 1;
  }

  if (damage > 0 && !inRange) {
    damage = 0;
  }

  if (damage > 0) {
    blocked = isActionBlocked(action, attacker, defender, random);

    if (blocked) {
      damage = 0;
      clearIncomingBonus(state, defenderOwner);
    } else {
      damage = applyIncomingBonus(state, actor, damage);
      appliedDamage = applyDamageToFighter(defender, damage);
    }
  } else {
    clearIncomingBonus(state, defenderOwner);
  }

  if (actor === "player") {
    const glory = action.glory ?? 0;
    const riskBonus = action.vulnerability ? 35 : 0;
    const staminaBonus = state.player.stamina >= 5 ? 12 : 0;

    state.score += damage * 90 + glory + riskBonus + staminaBonus;
    state.lastPlayerAction = actionId;
    state.lastPlayerDamage = damage;
    state.lastPlayerArmorAbsorbed = appliedDamage.armorAbsorbed;
    state.lastPlayerArmorBroken = appliedDamage.armorBroken;
    state.lastPlayerBlocked = blocked;
  } else {
    state.lastEnemyAction = actionId;
    state.lastEnemyDamage = damage;
    state.lastEnemyArmorAbsorbed = appliedDamage.armorAbsorbed;
    state.lastEnemyArmorBroken = appliedDamage.armorBroken;
    state.lastEnemyBlocked = blocked;
  }

  addActionLog(state, actorLabel, defenderLabel, action, actionTitle, actionMove, damage, inRange, blocked, getFighterClinchRange(attacker), staminaRestore, heal);

  if (state.player.hp <= 0 || state.enemy.hp <= 0) {
    finishBattle(state);
  }
}

function isActionBlocked(action: ActionConfig, attacker: FighterState, defender: FighterState, random: () => number): boolean {
  const blockChance = getActionBlockChance(action, attacker, defender);

  return blockChance > 0 && random() < blockChance;
}

function getActionDamageBonus(attacker?: FighterState): number {
  if (!attacker) {
    return 0;
  }

  if (isRangedFighter(attacker)) {
    return Math.max(0, attacker.weaponDamageBonus ?? 0);
  }

  return Math.max(0, attacker.damageBonus ?? 0);
}

function getActionDamage(actionId: ActionId, attacker: FighterState): number {
  if (actionId === "shuriken") {
    return Math.max(0, Math.floor(attacker.shurikenDamage ?? 0));
  }

  const actionDamage = actions[actionId].damage ?? 0;

  return actionDamage > 0 ? actionDamage + getActionDamageBonus(attacker) : 0;
}

function applyDamageToFighter(defender: FighterState, damage: number): DamageApplication {
  let remainingDamage = Math.max(0, damage);

  if (remainingDamage <= 0) {
    return { armorAbsorbed: 0, armorBroken: false };
  }

  const currentArmor = Math.max(0, defender.armor ?? 0);
  const armorDamage = Math.min(currentArmor, remainingDamage);
  defender.armor = clamp(currentArmor - armorDamage, 0, getFighterMaxArmor(defender));
  remainingDamage -= armorDamage;

  if (remainingDamage > 0) {
    defender.hp = clamp(defender.hp - remainingDamage, 0, getFighterMaxHp(defender));
  }

  return {
    armorAbsorbed: armorDamage,
    armorBroken: currentArmor > 0 && armorDamage >= currentArmor,
  };
}

function addActionLog(
  state: CombatState,
  actorLabel: string,
  defenderLabel: string,
  action: ActionConfig,
  actionTitle: string,
  actionMove: number,
  damage: number,
  inRange: boolean,
  blocked: boolean,
  actorClinchRange: number,
  staminaRestore: number,
  heal: number,
): void {
  if (actionMove && action.damage) {
    addLog(
      state,
      `${actorLabel} used ${actionTitle}, rushed to ${distanceLabel(state.distance, actorClinchRange)}, and ${
        blocked ? `${defenderLabel} blocked it` : damage > 0 ? `hit ${defenderLabel} for ${damage}` : "came up short"
      }.`,
      damage >= 4,
    );
    return;
  }

  if (actionMove) {
    addLog(state, `${actorLabel} used ${actionTitle}. Distance is now ${distanceLabel(state.distance, actorClinchRange)}.`);
    return;
  }

  if (action.damage || action.id === "shuriken") {
    addLog(
      state,
      `${actorLabel} used ${actionTitle} and ${
        !inRange ? "missed out of range" : blocked ? `${defenderLabel} blocked it` : `hit ${defenderLabel} for ${damage}`
      }.`,
      damage >= 7,
    );
    return;
  }

  if (staminaRestore > 0 || heal > 0) {
    if (staminaRestore > 0 && heal > 0) {
      addLog(state, `${actorLabel} used ${actionTitle}, restored stamina, and recovered ${heal} HP.`);
      return;
    }

    if (staminaRestore > 0) {
      addLog(state, `${actorLabel} used ${actionTitle} and restored stamina.`);
      return;
    }

    addLog(state, `${actorLabel} used ${actionTitle} and recovered ${heal} HP.`);
    return;
  }

  if (action.glory) {
    addLog(state, `${actorLabel} used ${actionTitle}. The crowd loves bad decisions.`);
    return;
  }

  if (action.id === "switchWeapon") {
    addLog(state, `${actorLabel} used ${actionTitle} and switched to melee.`);
  }
}

function getActionRangeMax(action: ActionConfig, attacker: FighterState): number | undefined {
  if (isRangedFighter(attacker) && isAttackAction(action.id)) {
    return MAX_DISTANCE;
  }

  if (action.rangeMax === undefined) {
    return undefined;
  }

  return action.rangeMax === MELEE_RANGE ? getFighterClinchRange(attacker) : action.rangeMax;
}

function isAttackAction(actionId: ActionId): boolean {
  return actionId === "light" || actionId === "medium" || actionId === "heavy";
}

function finishBattle(state: CombatState): void {
  const playerName = state.player.name;
  const enemyName = state.enemy.name;

  if (state.enemy.hp <= 0 && state.player.hp <= 0) {
    state.result = "draw";
    state.score += 250;
    addLog(state, "Both gladiators collapse dramatically. The crowd calls it art.", true);
    return;
  }

  if (state.enemy.hp <= 0) {
    state.result = "win";
    state.score += 1000 + state.player.hp * 40;
    addLog(state, `Victory! ${playerName} survives with all the dignity a bucket helmet allows.`, true);
    return;
  }

  if (state.player.hp <= 0) {
    state.result = "lose";
    addLog(state, `Defeat. ${enemyName} wins and immediately starts posing at the wrong crowd.`, true);
  }
}

function applyIncomingBonus(state: CombatState, attacker: TurnOwner, damage: number): number {
  const defender = attacker === "player" ? "enemy" : "player";
  const incomingBonus = defender === "player" ? state.playerIncomingBonus : state.enemyIncomingBonus;

  clearIncomingBonus(state, defender);

  return damage + incomingBonus;
}

function moveActor(state: CombatState, actor: TurnOwner, distanceDelta: number): void {
  const nextDistance = roundCombatDistance(clamp(state.distance + distanceDelta, MIN_DISTANCE, MAX_DISTANCE));
  const actualDistanceDelta = roundCombatDistance(nextDistance - state.distance);

  if (actualDistanceDelta === 0) {
    return;
  }

  if (actor === "player") {
    state.playerPosition = Math.min(state.playerPosition - actualDistanceDelta, state.enemyPosition);
  } else {
    state.enemyPosition = Math.max(state.enemyPosition + actualDistanceDelta, state.playerPosition);
  }

  state.distance = roundCombatDistance(clamp(state.enemyPosition - state.playerPosition, MIN_DISTANCE, MAX_DISTANCE));
}

function addIncomingBonus(state: CombatState, actor: TurnOwner, value: number): void {
  if (actor === "player") {
    state.playerIncomingBonus += value;
  } else {
    state.enemyIncomingBonus += value;
  }
}

function clearIncomingBonus(state: CombatState, actor: TurnOwner): void {
  if (actor === "player") {
    state.playerIncomingBonus = 0;
  } else {
    state.enemyIncomingBonus = 0;
  }
}

function addLog(state: CombatState, text: string, important = false): void {
  state.log = [{ text, important }, ...state.log].slice(0, 7);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampMoveDistance(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, 0.1, MAX_DISTANCE) : fallback;
}

function applyMovementDistanceBonus(distanceDelta: number, distanceBonus: number): number {
  const direction = Math.sign(distanceDelta);

  if (direction === 0) {
    return 0;
  }

  return Math.round((Math.abs(distanceDelta) + distanceBonus) * direction * 1000) / 1000;
}

function roundCombatDistance(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundStaminaCostRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}
