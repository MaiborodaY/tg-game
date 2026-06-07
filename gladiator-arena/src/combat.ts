import type { EnemyVisualPreset, HeroEquipment } from "./hero";

export type ActionId = "forward" | "back" | "lunge" | "light" | "medium" | "heavy" | "taunt" | "rest";
export type Result = "playing" | "win" | "lose" | "draw";
export type TurnOwner = "player" | "enemy";

export interface ActionConfig {
  id: ActionId;
  title: string;
  detail: string;
  cost: number;
  damage?: number;
  restore?: number;
  glory?: number;
  vulnerability?: number;
  move?: number;
  rangeMax?: number;
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
  equipment?: HeroEquipment;
  visualPreset?: EnemyVisualPreset;
}

export interface LogEntry {
  text: string;
  important?: boolean;
}

export interface CombatState {
  player: FighterState;
  enemy: FighterState;
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
  log: LogEntry[];
}

export const MAX_HP = 10;
export const MAX_STAMINA = 10;
export const MIN_DISTANCE = 0;
export const MAX_DISTANCE = 4;
export const START_DISTANCE = 3;
export const MELEE_RANGE = 0;

export const actions: Record<ActionId, ActionConfig> = {
  forward: {
    id: "forward",
    title: "Step Forward",
    detail: "Cost 1 - Distance -0.5",
    cost: 1,
    move: -0.5,
  },
  back: {
    id: "back",
    title: "Step Back",
    detail: "Cost 1 - Distance +0.5",
    cost: 1,
    move: 0.5,
  },
  lunge: {
    id: "lunge",
    title: "Lunge",
    detail: "Cost 4 - Half dash + hit in clinch",
    cost: 4,
    move: -0.5,
    damage: 4,
    rangeMax: MELEE_RANGE,
  },
  light: {
    id: "light",
    title: "Weak Slash",
    detail: "Cost 2 - Clinch only - Damage 1",
    cost: 2,
    damage: 1,
    rangeMax: MELEE_RANGE,
  },
  medium: {
    id: "medium",
    title: "Medium Slash",
    detail: "Cost 3 - Clinch only - Damage 2",
    cost: 3,
    damage: 2,
    rangeMax: MELEE_RANGE,
  },
  heavy: {
    id: "heavy",
    title: "Grand Bonk",
    detail: "Cost 5 - Clinch only - Damage 4",
    cost: 5,
    damage: 4,
    rangeMax: MELEE_RANGE,
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
    detail: "Free - Restore 5, +1 incoming",
    cost: 0,
    restore: 5,
    vulnerability: 1,
  },
};

export const actionOrder: ActionId[] = ["forward", "back", "lunge", "light", "medium", "heavy", "taunt", "rest"];

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

export function availableActionIds(state: CombatState, actor: TurnOwner): ActionId[] {
  return actionOrder.filter((id) => canUseAction(state, id, actor));
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

  const fighter = actor === "player" ? state.player : state.enemy;
  const action = actions[actionId];

  if (fighter.stamina < action.cost) {
    return false;
  }

  if (actionId === "forward") {
    return state.distance > MIN_DISTANCE;
  }

  if (actionId === "back") {
    return state.distance < MAX_DISTANCE;
  }

  if (actionId === "lunge") {
    return state.distance > MELEE_RANGE;
  }

  if (action.rangeMax !== undefined) {
    return state.distance <= action.rangeMax;
  }

  return true;
}

export function distanceLabel(distance: number): string {
  if (distance <= 0) {
    return "Clinch";
  }

  if (distance <= 1) {
    return "Melee";
  }

  if (distance <= 2) {
    return "Near";
  }

  if (distance <= 3) {
    return "Far";
  }

  return "Very far";
}

export function resolvePlayerTurn(current: CombatState, playerActionId: ActionId): CombatState {
  const state = cloneStateForTurn(current);

  if (!canUseAction(state, playerActionId, "player")) {
    addLog(state, `${actions[playerActionId].title} is not available right now.`);
    return state;
  }

  applyAction(state, "player", playerActionId);

  if (state.result === "playing") {
    state.activeTurn = "enemy";
  }

  return state;
}

export function resolveEnemyTurn(current: CombatState): CombatState {
  const state = cloneStateForTurn(current);

  if (state.result !== "playing" || state.activeTurn !== "enemy") {
    return state;
  }

  applyAction(state, "enemy", chooseEnemyAction(state));

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
  };
}

function cloneFighterState(fighter: FighterState): FighterState {
  return {
    ...fighter,
    equipment: fighter.equipment ? { ...fighter.equipment } : undefined,
    visualPreset: fighter.visualPreset ? { ...fighter.visualPreset } : undefined,
  };
}

function chooseEnemyAction(current: CombatState): ActionId {
  const available = availableActionIds(current, "enemy");
  const weighted: ActionId[] = [];
  const enemyLowStamina = current.enemy.stamina <= 3;
  const enemyLowHp = current.enemy.hp <= 10;
  const playerLowHp = current.player.hp <= 9;

  for (const id of available) {
    if (current.distance > MELEE_RANGE) {
      if (id === "forward") {
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

  return weighted[Math.floor(Math.random() * weighted.length)] ?? "rest";
}

function applyAction(state: CombatState, actor: TurnOwner, actionId: ActionId): void {
  const action = actions[actionId];
  const attacker = actor === "player" ? state.player : state.enemy;
  const defender = actor === "player" ? state.enemy : state.player;
  const actorLabel = actor === "player" ? "You" : "Grumbus";
  const defenderLabel = actor === "player" ? "Grumbus" : "you";

  attacker.stamina = clamp(attacker.stamina - action.cost, 0, getFighterMaxStamina(attacker));

  if (action.move) {
    moveActor(state, actor, action.move);
  }

  if (action.restore) {
    attacker.stamina = clamp(attacker.stamina + action.restore, 0, getFighterMaxStamina(attacker));
  }

  if (action.vulnerability) {
    addIncomingBonus(state, actor, action.vulnerability);
  }

  let damage = action.damage ? action.damage + Math.max(0, attacker.damageBonus ?? 0) : 0;
  const inRange = action.rangeMax === undefined || state.distance <= action.rangeMax;

  if (damage > 0 && !inRange) {
    damage = 0;
  }

  if (damage > 0) {
    damage = applyIncomingBonus(state, actor, damage);
    applyDamageToFighter(defender, damage);
  } else {
    clearIncomingBonus(state, actor === "player" ? "enemy" : "player");
  }

  if (actor === "player") {
    const glory = action.glory ?? 0;
    const riskBonus = action.vulnerability ? 35 : 0;
    const staminaBonus = state.player.stamina >= 5 ? 12 : 0;

    state.score += damage * 90 + glory + riskBonus + staminaBonus;
    state.lastPlayerAction = actionId;
    state.lastPlayerDamage = damage;
  } else {
    state.lastEnemyAction = actionId;
    state.lastEnemyDamage = damage;
  }

  addActionLog(state, actorLabel, defenderLabel, action, damage, inRange);

  if (state.player.hp <= 0 || state.enemy.hp <= 0) {
    finishBattle(state);
  }
}

function applyDamageToFighter(defender: FighterState, damage: number): void {
  let remainingDamage = Math.max(0, damage);

  if (remainingDamage <= 0) {
    return;
  }

  const currentArmor = Math.max(0, defender.armor ?? 0);
  const armorDamage = Math.min(currentArmor, remainingDamage);
  defender.armor = clamp(currentArmor - armorDamage, 0, getFighterMaxArmor(defender));
  remainingDamage -= armorDamage;

  if (remainingDamage > 0) {
    defender.hp = clamp(defender.hp - remainingDamage, 0, getFighterMaxHp(defender));
  }
}

function addActionLog(
  state: CombatState,
  actorLabel: string,
  defenderLabel: string,
  action: ActionConfig,
  damage: number,
  inRange: boolean,
): void {
  if (action.move && action.damage) {
    addLog(
      state,
      `${actorLabel} used ${action.title}, rushed to ${distanceLabel(state.distance)}, and ${
        damage > 0 ? `hit ${defenderLabel} for ${damage}` : "came up short"
      }.`,
      damage >= 4,
    );
    return;
  }

  if (action.move) {
    addLog(state, `${actorLabel} used ${action.title}. Distance is now ${distanceLabel(state.distance)}.`);
    return;
  }

  if (action.damage) {
    addLog(
      state,
      `${actorLabel} used ${action.title} and ${inRange ? `hit ${defenderLabel} for ${damage}` : "missed out of range"}.`,
      damage >= 7,
    );
    return;
  }

  if (action.restore) {
    addLog(state, `${actorLabel} used ${action.title} and restored stamina.`);
    return;
  }

  if (action.glory) {
    addLog(state, `${actorLabel} used ${action.title}. The crowd loves bad decisions.`);
  }
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
  const nextDistance = clamp(state.distance + distanceDelta, MIN_DISTANCE, MAX_DISTANCE);
  const actualDistanceDelta = nextDistance - state.distance;

  if (actualDistanceDelta === 0) {
    return;
  }

  if (actor === "player") {
    state.playerPosition = Math.min(state.playerPosition - actualDistanceDelta, state.enemyPosition);
  } else {
    state.enemyPosition = Math.max(state.enemyPosition + actualDistanceDelta, state.playerPosition);
  }

  state.distance = clamp(state.enemyPosition - state.playerPosition, MIN_DISTANCE, MAX_DISTANCE);
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
