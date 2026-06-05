export type ActionId = "forward" | "back" | "lunge" | "light" | "heavy" | "block" | "taunt" | "rest";
export type Result = "playing" | "win" | "lose" | "draw";
export type TurnOwner = "player" | "enemy";

export interface ActionConfig {
  id: ActionId;
  title: string;
  detail: string;
  cost: number;
  damage?: number;
  block?: number;
  restore?: number;
  glory?: number;
  vulnerability?: number;
  move?: number;
  rangeMax?: number;
}

export interface FighterState {
  name: string;
  hp: number;
  stamina: number;
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
  playerGuard: number;
  enemyGuard: number;
  playerIncomingBonus: number;
  enemyIncomingBonus: number;
  lastPlayerAction?: ActionId;
  lastEnemyAction?: ActionId;
  lastPlayerDamage: number;
  lastEnemyDamage: number;
  log: LogEntry[];
}

export const MAX_HP = 30;
export const MAX_STAMINA = 10;
export const ROUND_LIMIT = 12;
export const MIN_DISTANCE = 0;
export const MAX_DISTANCE = 4;
export const START_DISTANCE = 3;
export const MELEE_RANGE = 0;

export const actions: Record<ActionId, ActionConfig> = {
  forward: {
    id: "forward",
    title: "Step Forward",
    detail: "Cost 1 - Distance -1",
    cost: 1,
    move: -1,
  },
  back: {
    id: "back",
    title: "Step Back",
    detail: "Cost 1 - Distance +1",
    cost: 1,
    move: 1,
  },
  lunge: {
    id: "lunge",
    title: "Lunge",
    detail: "Cost 4 - Short dash + hit in clinch",
    cost: 4,
    move: -1,
    damage: 4,
    rangeMax: MELEE_RANGE,
  },
  light: {
    id: "light",
    title: "Quick Slash",
    detail: "Cost 2 - Clinch only - Damage 3",
    cost: 2,
    damage: 3,
    rangeMax: MELEE_RANGE,
  },
  heavy: {
    id: "heavy",
    title: "Grand Bonk",
    detail: "Cost 5 - Clinch only - Damage 7",
    cost: 5,
    damage: 7,
    rangeMax: MELEE_RANGE,
  },
  block: {
    id: "block",
    title: "Pot Lid Block",
    detail: "Cost 3 - Guard next hit",
    cost: 3,
    block: 0.7,
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

export const actionOrder: ActionId[] = ["forward", "back", "lunge", "light", "heavy", "taunt", "rest"];

export function freshState(): CombatState {
  return {
    player: { name: "Borshemir", hp: MAX_HP, stamina: MAX_STAMINA },
    enemy: { name: "Grumbus", hp: MAX_HP, stamina: MAX_STAMINA },
    round: 1,
    score: 0,
    result: "playing",
    activeTurn: "player",
    distance: START_DISTANCE,
    playerPosition: 0,
    enemyPosition: START_DISTANCE,
    playerGuard: 0,
    enemyGuard: 0,
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

export function availableActionIds(state: CombatState, actor: TurnOwner): ActionId[] {
  return actionOrder.filter((id) => canUseAction(state, id, actor));
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

  if (distance === 1) {
    return "Melee";
  }

  if (distance === 2) {
    return "Near";
  }

  if (distance === 3) {
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

  if (state.round >= ROUND_LIMIT) {
    finishBattle(state);
    return state;
  }

  state.round += 1;
  state.activeTurn = "player";
  return state;
}

function cloneStateForTurn(current: CombatState): CombatState {
  return {
    ...current,
    player: { ...current.player },
    enemy: { ...current.enemy },
    log: [...current.log],
    lastPlayerAction: undefined,
    lastEnemyAction: undefined,
    lastPlayerDamage: 0,
    lastEnemyDamage: 0,
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
      weighted.push(id, id, playerLowHp ? id : "light");
    } else if (id === "light") {
      weighted.push(id, id, id);
    } else if (id === "block") {
      weighted.push(id, enemyLowHp ? id : "light");
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

  attacker.stamina = clamp(attacker.stamina - action.cost, 0, MAX_STAMINA);
  clearGuard(state, actor);

  if (action.move) {
    moveActor(state, actor, action.move);
  }

  if (action.restore) {
    attacker.stamina = clamp(attacker.stamina + action.restore, 0, MAX_STAMINA);
  }

  if (action.block) {
    setGuard(state, actor, action.block);
  }

  if (action.vulnerability) {
    addIncomingBonus(state, actor, action.vulnerability);
  }

  let damage = action.damage ?? 0;
  const inRange = action.rangeMax === undefined || state.distance <= action.rangeMax;

  if (damage > 0 && !inRange) {
    damage = 0;
  }

  if (damage > 0) {
    damage = applyDefensiveStatuses(state, actor, damage);
    defender.hp = clamp(defender.hp - damage, 0, MAX_HP);
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

  if (action.block) {
    addLog(state, `${actorLabel} used ${action.title} and guards the next blow.`);
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
  if (state.enemy.hp <= 0 && state.player.hp <= 0) {
    state.result = "draw";
    state.score += 250;
    addLog(state, "Both gladiators collapse dramatically. The crowd calls it art.", true);
    return;
  }

  if (state.enemy.hp <= 0 || state.player.hp > state.enemy.hp) {
    state.result = "win";
    state.score += 1000 + state.player.hp * 40;
    addLog(state, "Victory! Borshemir survives with all the dignity a bucket helmet allows.", true);
    return;
  }

  if (state.player.hp <= 0 || state.enemy.hp > state.player.hp) {
    state.result = "lose";
    addLog(state, "Defeat. Grumbus wins and immediately starts posing at the wrong crowd.", true);
    return;
  }

  state.result = "draw";
  state.score += 250;
  addLog(state, "The horn sounds. It is a draw, somehow.", true);
}

function applyDefensiveStatuses(state: CombatState, attacker: TurnOwner, damage: number): number {
  const defender = attacker === "player" ? "enemy" : "player";
  const guard = defender === "player" ? state.playerGuard : state.enemyGuard;
  const incomingBonus = defender === "player" ? state.playerIncomingBonus : state.enemyIncomingBonus;
  const guardedDamage = guard > 0 ? Math.ceil(damage * (1 - guard)) : damage;

  clearGuard(state, defender);
  clearIncomingBonus(state, defender);

  return guardedDamage + incomingBonus;
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

function setGuard(state: CombatState, actor: TurnOwner, value: number): void {
  if (actor === "player") {
    state.playerGuard = value;
  } else {
    state.enemyGuard = value;
  }
}

function clearGuard(state: CombatState, actor: TurnOwner): void {
  setGuard(state, actor, 0);
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
