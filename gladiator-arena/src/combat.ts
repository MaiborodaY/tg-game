import type { EnemyVisualPreset, HeroAppearance, HeroEquipment, HeroEquipmentSlotKey, HeroItemId, HeroWeaponClass, HeroWeaponEnchantments } from "./hero";
import type { ArenaDifficultyId } from "./arenaOpponents";

export type ActionId =
  | "forward"
  | "back"
  | "lunge"
  | "light"
  | "medium"
  | "heavy"
  | "switchWeapon"
  | "shuriken"
  | "scroll"
  | "fireball"
  | "ward"
  | "preciseStrike"
  | "doubleStrike"
  | "poison"
  | "taunt"
  | "rest";
export type Result = "playing" | "win" | "lose" | "draw";
export type TurnOwner = "player" | "enemy";
export type CombatActor = TurnOwner | "helper";

export interface CombatActionTrace {
  actionId: ActionId;
  defender: CombatActor;
}

export interface ActionConfig {
  id: ActionId;
  title: string;
  detail: string;
  cost: number;
  damage?: number;
  meleeDamageMultiplier?: number;
  blockChance?: number;
  restore?: number;
  heal?: number;
  glory?: number;
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
  removedArmorSlots?: CombatArmorSlotState[];
  wardAbsorbed?: boolean;
}

interface WeaponHitResolution {
  damage: number;
  blocked: boolean;
  appliedDamage: DamageApplication;
}

export interface CombatArmorSlotState {
  slotKey: HeroEquipmentSlotKey;
  itemId: HeroItemId;
  label: string;
  armorHp: number;
}

export interface CombatHitResult {
  damage: number;
  armorAbsorbed: number;
  armorBroken: boolean;
  removedArmorSlots?: CombatArmorSlotState[];
  wardAbsorbed: boolean;
  blocked: boolean;
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
  meleeDamagePercentBonus?: number;
  maceArmorDamagePercentBonus?: number;
  spearMeleeDamagePercentBonus?: number;
  spearLungeDamagePercentBonus?: number;
  spearClinchRangeBonus?: number;
  spearLungeMoveBonus?: number;
  movementDistanceBonus: number;
  bodyScaleBonus: number;
  clinchRangeBonus: number;
  restHpRestoreBonus: number;
  restStaminaRestoreBonus: number;
  weaponClass?: HeroWeaponClass;
  mainWeaponClass?: HeroWeaponClass;
  bowWeaponClass?: HeroWeaponClass;
  bowShotsRemaining?: number;
  bowMaxShots?: number;
  shurikenCount?: number;
  shurikenDamage?: number;
  shurikenItemId?: HeroItemId;
  scrollCount?: number;
  scrollItemId?: HeroItemId;
  crackArmorParts?: number;
  fireballScrollCount?: number;
  fireballScrollItemId?: HeroItemId;
  fireballDamage?: number;
  wardScrollCount?: number;
  wardScrollItemId?: HeroItemId;
  wardHitCount?: number;
  wardHits?: number;
  preciseStrikeScrollCount?: number;
  preciseStrikeScrollItemId?: HeroItemId;
  preciseStrikeBlockChanceReduction?: number;
  preciseStrikeHits?: number;
  doubleStrikeScrollCount?: number;
  doubleStrikeScrollItemId?: HeroItemId;
  doubleStrikeDamageMultiplier?: number;
  doubleStrikeHits?: number;
  poisonScrollCount?: number;
  poisonScrollItemId?: HeroItemId;
  poisonDamage?: number;
  poisonTurns?: number;
  equipment?: HeroEquipment;
  weaponEnchantments?: HeroWeaponEnchantments;
  armorSlots?: CombatArmorSlotState[];
  appearance?: HeroAppearance;
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
  difficultyId?: ArenaDifficultyId;
  backgroundVariantId?: string;
  mode?: "duoBossAi";
}

export interface CombatState {
  player: FighterState;
  helper?: FighterState;
  enemy: FighterState;
  encounter?: CombatEncounterState;
  round: number;
  score: number;
  result: Result;
  activeTurn: TurnOwner;
  distance: number;
  playerPosition: number;
  helperPosition?: number;
  enemyPosition: number;
  playerRestDefensePenalty: number;
  helperRestDefensePenalty: number;
  enemyRestDefensePenalty: number;
  lastPlayerActions: CombatActionTrace[];
  lastEnemyActions: CombatActionTrace[];
  lastHelperActions: CombatActionTrace[];
  lastPlayerAction?: ActionId;
  lastEnemyAction?: ActionId;
  lastPlayerDamage: number;
  lastEnemyDamage: number;
  lastPlayerArmorAbsorbed: number;
  lastEnemyArmorAbsorbed: number;
  lastPlayerArmorBroken: boolean;
  lastEnemyArmorBroken: boolean;
  lastPlayerRemovedArmorSlots?: CombatArmorSlotState[];
  lastEnemyRemovedArmorSlots?: CombatArmorSlotState[];
  lastPlayerWardAbsorbed: boolean;
  lastEnemyWardAbsorbed: boolean;
  lastPlayerHitResults?: CombatHitResult[];
  lastEnemyHitResults?: CombatHitResult[];
  lastHelperAction?: ActionId;
  lastHelperDamage: number;
  lastHelperArmorAbsorbed: number;
  lastHelperArmorBroken: boolean;
  lastHelperRemovedArmorSlots?: CombatArmorSlotState[];
  lastHelperWardAbsorbed: boolean;
  lastHelperHitResults?: CombatHitResult[];
  lastHelperDoubleStrikeRepeat: boolean;
  lastHelperBlocked: boolean;
  lastEnemyTarget?: "player" | "helper";
  lastPlayerPoisonDamage: number;
  lastEnemyPoisonDamage: number;
  lastPlayerDoubleStrikeRepeat: boolean;
  lastEnemyDoubleStrikeRepeat: boolean;
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
export const DEFAULT_AUTO_COMBAT_MAX_TURNS = 300;
export const FIREBALL_SCROLL_DAMAGE = 30;
export const POISON_SCROLL_DAMAGE = 5;
export const POISON_SCROLL_TURNS = 2;
export const PRECISE_STRIKE_HITS = 3;
export const DEFAULT_PRECISE_STRIKE_BLOCK_CHANCE_REDUCTION = 0.1;
export const DEFAULT_DOUBLE_STRIKE_DAMAGE_MULTIPLIER = 0.4;
export const DEFAULT_FORWARD_MOVE_DISTANCE = 0.2;
export const DEFAULT_BACK_MOVE_DISTANCE = 0.1;
export const DEFAULT_LUNGE_MOVE_DISTANCE = 0.3;
export const MOVE_DISTANCE_PER_STAMINA = 0.2;
export const BOW_SHOTS_PER_BATTLE = 5;
const MIN_MELEE_WEAPON_DAMAGE = 1;
export const AXE_BLOCK_CHANCE_PENALTY: Partial<Record<ActionId, number>> = {
  light: 0.25,
  medium: 0.15,
  heavy: 0.15,
};
const BOW_BLOCK_CHANCE_PENALTY = 0.10;
export const AXE_MELEE_DAMAGE_PERCENT_BONUS_MULTIPLIER = 1.5;
const AXE_MELEE_DAMAGE_MULTIPLIER: Partial<Record<ActionId, number>> = {
  light: 1,
  medium: 1.5,
  heavy: 2,
};
export const MELEE_ACTION_FLAT_DAMAGE_BONUS: Partial<Record<ActionId, number>> = {
  light: 0,
  medium: 1,
  heavy: 2,
};
const SWORD_BLOCK_CHANCE_REDUCTION: Partial<Record<ActionId, number>> = {
  light: 0.15,
  medium: 0.2,
  heavy: 0.25,
};
const MACE_ARMORED_TARGET_DAMAGE_MULTIPLIER = 1.25;
export const SPEAR_CLINCH_RANGE_BONUS = 0.4;
export const SPEAR_LUNGE_MOVE_BONUS = 0.3;
export const SPEAR_LUNGE_BLOCK_CHANCE_REDUCTION = 0.30;
export const SPEAR_LUNGE_DAMAGE_MULTIPLIER = 1.5;
export const REST_DEFENSE_PENALTY = 0.2;
const PAIRED_ARMOR_SLOT_KEYS: readonly (readonly [HeroEquipmentSlotKey, HeroEquipmentSlotKey])[] = [
  ["backShoulderguard", "frontShoulderguard"],
  ["backWrist", "frontWrist"],
  ["backGlove", "frontGlove"],
  ["backGreave", "frontGreave"],
  ["backShinguard", "frontShinguard"],
  ["backBoot", "frontBoot"],
];
const EAGLE_BOSS_ID = "arena_boss_4";

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
    detail: "Clinch only - Weapon damage 100%",
    cost: 2,
    damage: 1,
    meleeDamageMultiplier: 1,
    blockChance: 0.25,
    rangeMax: MELEE_RANGE,
  },
  medium: {
    id: "medium",
    title: "Medium Slash",
    detail: "Clinch only - Weapon damage 150%",
    cost: 3,
    damage: 2,
    meleeDamageMultiplier: 1.5,
    blockChance: 0.5,
    rangeMax: MELEE_RANGE,
  },
  heavy: {
    id: "heavy",
    title: "Grand Bonk",
    detail: "Clinch only - Weapon damage 200%",
    cost: 5,
    damage: 4,
    meleeDamageMultiplier: 2,
    blockChance: 0.75,
    rangeMax: MELEE_RANGE,
  },
  switchWeapon: {
    id: "switchWeapon",
    title: "Switch Weapon",
    detail: "Swap bow / melee",
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
  scroll: {
    id: "scroll",
    title: "Crack Armor Scroll",
    detail: "Break random armor",
    cost: 0,
    rangeMax: MAX_DISTANCE,
  },
  fireball: {
    id: "fireball",
    title: "Fireball Scroll",
    detail: "Deal armor damage",
    cost: 0,
    damage: FIREBALL_SCROLL_DAMAGE,
    rangeMax: MAX_DISTANCE,
  },
  ward: {
    id: "ward",
    title: "Ward Scroll",
    detail: "Absorb next hit",
    cost: 0,
  },
  preciseStrike: {
    id: "preciseStrike",
    title: "Precise Strike Scroll",
    detail: "Focus your next 3 strikes",
    cost: 0,
  },
  doubleStrike: {
    id: "doubleStrike",
    title: "Double Strike Scroll",
    detail: "Next strike repeats",
    cost: 0,
  },
  poison: {
    id: "poison",
    title: "Poison Scroll",
    detail: "Poison for 2 turns",
    cost: 0,
    rangeMax: MAX_DISTANCE,
  },
  taunt: {
    id: "taunt",
    title: "Taunt Crowd",
    detail: "Cost 1 - Glory",
    cost: 1,
    glory: 70,
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

export const actionOrder: ActionId[] = [
  "forward",
  "back",
  "lunge",
  "light",
  "medium",
  "heavy",
  "switchWeapon",
  "shuriken",
  "scroll",
  "fireball",
  "ward",
  "preciseStrike",
  "doubleStrike",
  "poison",
  "taunt",
  "rest",
];

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
    return applyMovementDistanceBonus(-(combatMovementTuning.lungeMoveDistance + getSpearLungeMoveBonus(actor)), movementDistanceBonus);
  }

  return actions[actionId].move ?? 0;
}

export function getActionStaminaCost(actionId: ActionId, actor?: FighterState): number {
  const actionMove = Math.abs(getActionMove(actionId, actor));

  if (actionMove > 0) {
    return Math.max(1, Math.round(roundStaminaCostRatio(actionMove / MOVE_DISTANCE_PER_STAMINA)));
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
      meleeDamagePercentBonus: 0,
      maceArmorDamagePercentBonus: 0,
      spearMeleeDamagePercentBonus: 0,
      spearLungeDamagePercentBonus: 0,
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
      meleeDamagePercentBonus: 0,
      maceArmorDamagePercentBonus: 0,
      spearMeleeDamagePercentBonus: 0,
      spearLungeDamagePercentBonus: 0,
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
    helperPosition: undefined,
    enemyPosition: START_DISTANCE,
    playerRestDefensePenalty: 0,
    helperRestDefensePenalty: 0,
    enemyRestDefensePenalty: 0,
    lastPlayerActions: [],
    lastEnemyActions: [],
    lastHelperActions: [],
    lastPlayerDamage: 0,
    lastEnemyDamage: 0,
    lastPlayerArmorAbsorbed: 0,
    lastEnemyArmorAbsorbed: 0,
    lastPlayerArmorBroken: false,
    lastEnemyArmorBroken: false,
    lastPlayerRemovedArmorSlots: undefined,
    lastEnemyRemovedArmorSlots: undefined,
    lastPlayerWardAbsorbed: false,
    lastEnemyWardAbsorbed: false,
    lastPlayerHitResults: undefined,
    lastEnemyHitResults: undefined,
    lastHelperDamage: 0,
    lastHelperArmorAbsorbed: 0,
    lastHelperArmorBroken: false,
    lastHelperRemovedArmorSlots: undefined,
    lastHelperWardAbsorbed: false,
    lastHelperHitResults: undefined,
    lastHelperDoubleStrikeRepeat: false,
    lastHelperBlocked: false,
    lastEnemyTarget: undefined,
    lastPlayerPoisonDamage: 0,
    lastEnemyPoisonDamage: 0,
    lastPlayerDoubleStrikeRepeat: false,
    lastEnemyDoubleStrikeRepeat: false,
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
  void defender;

  return getAdjustedActionBlockChance(action, getActionBlockChanceModifier(action, attacker), 0);
}

export function getActionBlockChanceForState(state: CombatState, actionId: ActionId, actor: CombatActor = "player", defenderActor = getDefaultDefenderActor(state, actor)): number {
  const action = actions[actionId];
  const attacker = getCombatActorFighter(state, actor);

  return getAdjustedActionBlockChance(action, getActionBlockChanceModifier(action, attacker), getRestDefensePenalty(state, defenderActor));
}

export function isActionTargetRestVulnerable(state: CombatState, actionId: ActionId, actor: CombatActor = "player"): boolean {
  return actions[actionId].blockChance !== undefined && getRestDefensePenalty(state, getDefaultDefenderActor(state, actor)) > 0;
}

function getActionBlockChanceModifier(action: ActionConfig, attacker?: FighterState): number {
  const swordBlockChanceReduction = attacker && getFighterWeaponClass(attacker) === "sword" ? SWORD_BLOCK_CHANCE_REDUCTION[action.id] ?? 0 : 0;
  const axeBlockChancePenalty = attacker && getFighterWeaponClass(attacker) === "axe" ? AXE_BLOCK_CHANCE_PENALTY[action.id] ?? 0 : 0;
  const bowBlockChancePenalty = attacker && isBowFighter(attacker) && isAttackAction(action.id) ? BOW_BLOCK_CHANCE_PENALTY : 0;
  const spearLungeBlockChanceReduction =
    attacker && getFighterWeaponClass(attacker) === "spear" && action.id === "lunge" ? SPEAR_LUNGE_BLOCK_CHANCE_REDUCTION : 0;
  const preciseStrikeBlockChanceReduction = isPreciseStrikeBoostedAction(action.id, attacker) ? getFighterPreciseStrikeBlockChanceReduction(attacker) : 0;

  return axeBlockChancePenalty + bowBlockChancePenalty - swordBlockChanceReduction - spearLungeBlockChanceReduction - preciseStrikeBlockChanceReduction;
}

function getAdjustedActionBlockChance(action: ActionConfig, blockChanceModifier: number, defenderDefensePenalty: number): number {
  return clamp((action.blockChance ?? 0) + blockChanceModifier - defenderDefensePenalty, 0, 0.95);
}

export function getFighterWeaponClass(fighter: FighterState): HeroWeaponClass {
  return fighter.weaponClass ?? "sword";
}

function isSpearFighter(fighter: FighterState | undefined): boolean {
  return Boolean(fighter && getFighterWeaponClass(fighter) === "spear");
}

function getSpearClinchRangeBonus(fighter: FighterState | undefined): number {
  return isSpearFighter(fighter) ? Math.max(0, fighter?.spearClinchRangeBonus ?? SPEAR_CLINCH_RANGE_BONUS) : 0;
}

function getSpearLungeMoveBonus(fighter: FighterState | undefined): number {
  return isSpearFighter(fighter) ? Math.max(0, fighter?.spearLungeMoveBonus ?? SPEAR_LUNGE_MOVE_BONUS) : 0;
}

function getSpearLungeDamageMultiplier(actionId: ActionId, attacker: FighterState): number {
  return actionId === "lunge" && isSpearFighter(attacker) ? SPEAR_LUNGE_DAMAGE_MULTIPLIER : 1;
}

function getSpearLungeAgilityDamageMultiplier(actionId: ActionId, attacker: FighterState): number {
  return actionId === "lunge" && isSpearFighter(attacker) ? 1 + Math.max(0, attacker.spearLungeDamagePercentBonus ?? 0) : 1;
}

export function getFighterMainWeaponClass(fighter: FighterState): HeroWeaponClass {
  return fighter.mainWeaponClass ?? "sword";
}

export function hasFighterBowWeapon(fighter: FighterState): boolean {
  return fighter.bowWeaponClass === "bow" || (fighter.weaponClass === "bow" && getFighterMainWeaponClass(fighter) !== "bow");
}

export function canFighterSwitchWeapon(fighter: FighterState): boolean {
  if (!hasFighterBowWeapon(fighter) || getFighterMainWeaponClass(fighter) === "bow") {
    return false;
  }

  return isBowFighter(fighter) || getBowShotsRemaining(fighter) > 0;
}

export function getFighterSwitchTargetWeaponClass(fighter: FighterState): HeroWeaponClass {
  return isBowFighter(fighter) ? getFighterMainWeaponClass(fighter) : "bow";
}

function getFighterClinchWeaponClass(fighter: FighterState): HeroWeaponClass {
  const mainWeaponClass = getFighterMainWeaponClass(fighter);

  return isRangedWeaponClass(mainWeaponClass) ? "sword" : mainWeaponClass;
}

function forceFighterClinchWeapon(fighter: FighterState): void {
  if (isBowFighter(fighter)) {
    fighter.weaponClass = getFighterClinchWeaponClass(fighter);
  }
}

function forceClinchWeapons(state: CombatState): void {
  if (isFighterInClinchRange(state, "player")) {
    forceFighterClinchWeapon(state.player);
  }

  if (hasLivingHelper(state) && isFighterInClinchRange(state, "helper")) {
    forceFighterClinchWeapon(state.helper);
  }

  if (isEnemyInClinchWithAnyLivingAlly(state)) {
    forceFighterClinchWeapon(state.enemy);
  }
}

export function isDuoBossAiCombat(state: CombatState): boolean {
  return state.encounter?.mode === "duoBossAi" && Boolean(state.helper);
}

function isAlliedActor(actor: CombatActor): boolean {
  return actor !== "enemy";
}

function getCombatActorFighter(state: CombatState, actor: CombatActor): FighterState | undefined {
  if (actor === "player") {
    return state.player;
  }

  if (actor === "helper") {
    return state.helper;
  }

  return state.enemy;
}

function getDefaultDefenderActor(state: CombatState, actor: CombatActor): CombatActor {
  if (actor === "enemy") {
    if (state.lastEnemyTarget === "helper" && hasLivingHelper(state)) {
      return "helper";
    }

    if (hasLivingPlayer(state)) {
      return "player";
    }

    return hasLivingHelper(state) ? "helper" : "player";
  }

  return "enemy";
}

function getDefenderForActor(state: CombatState, actor: CombatActor, defenderActor = getDefaultDefenderActor(state, actor)): FighterState | undefined {
  return getCombatActorFighter(state, defenderActor);
}

function hasLivingHelper(state: CombatState): state is CombatState & { helper: FighterState } {
  return Boolean(state.helper && state.helper.hp > 0);
}

function hasLivingPlayer(state: CombatState): boolean {
  return state.player.hp > 0;
}

function areAllAlliesDefeated(state: CombatState): boolean {
  return !hasLivingPlayer(state) && !hasLivingHelper(state);
}

function shouldFinishBattle(state: CombatState): boolean {
  return state.enemy.hp <= 0 || areAllAlliesDefeated(state);
}

function advanceToNextAlliedTurn(state: CombatState): void {
  state.activeTurn = hasLivingPlayer(state) ? "player" : "enemy";
  clearRestDefensePenalty(state, state.activeTurn);
}

function getLivingHelperPosition(state: CombatState): number | undefined {
  return hasLivingHelper(state) ? state.helperPosition ?? state.playerPosition : undefined;
}

function getLivingPlayerPosition(state: CombatState): number | undefined {
  return hasLivingPlayer(state) ? state.playerPosition : undefined;
}

function getAlliedActorPosition(state: CombatState, actor: CombatActor): number {
  if (actor === "helper" && hasLivingHelper(state)) {
    return state.helperPosition ?? state.playerPosition;
  }

  return state.playerPosition;
}

function getClosestAlliedPosition(state: CombatState): number {
  const playerPosition = getLivingPlayerPosition(state);
  const helperPosition = getLivingHelperPosition(state);

  if (playerPosition === undefined) {
    return helperPosition ?? state.playerPosition;
  }

  return helperPosition === undefined ? playerPosition : Math.max(playerPosition, helperPosition);
}

function getFarthestAlliedPosition(state: CombatState): number {
  const playerPosition = getLivingPlayerPosition(state);
  const helperPosition = getLivingHelperPosition(state);

  if (playerPosition === undefined) {
    return helperPosition ?? state.playerPosition;
  }

  return helperPosition === undefined ? playerPosition : Math.min(playerPosition, helperPosition);
}

function getActorDistance(state: CombatState, actor: CombatActor, defenderActor = getDefaultDefenderActor(state, actor)): number {
  if (!state.helper) {
    return state.distance;
  }

  if (actor === "enemy") {
    return roundCombatDistance(clamp(state.enemyPosition - getAlliedActorPosition(state, defenderActor), MIN_DISTANCE, MAX_DISTANCE));
  }

  return roundCombatDistance(clamp(state.enemyPosition - getAlliedActorPosition(state, actor), MIN_DISTANCE, MAX_DISTANCE));
}

function syncSharedCombatDistance(state: CombatState): void {
  state.distance = roundCombatDistance(clamp(state.enemyPosition - getFarthestAlliedPosition(state), MIN_DISTANCE, MAX_DISTANCE));
}

function isEnemyInClinchWithActor(state: CombatState, defenderActor: CombatActor): boolean {
  const defender = getCombatActorFighter(state, defenderActor);

  if (!defender || defender.hp <= 0) {
    return false;
  }

  return getActorDistance(state, "enemy", defenderActor) <= getFighterClinchRange(state.enemy);
}

function isEnemyInClinchWithAnyLivingAlly(state: CombatState): boolean {
  return isEnemyInClinchWithActor(state, "player") || isEnemyInClinchWithActor(state, "helper");
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

export function getFighterScrollCount(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.scrollCount ?? 0));
}

export function getFighterCrackArmorParts(fighter?: FighterState): number {
  return Math.max(1, Math.floor(fighter?.crackArmorParts ?? 1));
}

export function getFighterFireballScrollCount(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.fireballScrollCount ?? 0));
}

export function getFighterFireballDamage(fighter?: FighterState): number {
  return Math.max(0, Math.floor(fighter?.fireballDamage ?? FIREBALL_SCROLL_DAMAGE));
}

export function getFighterWardScrollCount(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.wardScrollCount ?? 0));
}

export function getFighterWardHitCount(fighter?: FighterState): number {
  return Math.max(1, Math.floor(fighter?.wardHitCount ?? 1));
}

export function getFighterPreciseStrikeScrollCount(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.preciseStrikeScrollCount ?? 0));
}

export function getFighterDoubleStrikeScrollCount(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.doubleStrikeScrollCount ?? 0));
}

export function getFighterPoisonScrollCount(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.poisonScrollCount ?? 0));
}

export function getFighterPoisonDamage(fighter?: FighterState): number {
  return Math.max(0, Math.floor(fighter?.poisonDamage ?? POISON_SCROLL_DAMAGE));
}

export function getFighterPoisonTurns(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.poisonTurns ?? 0));
}

export function getFighterSpellbookScrollCount(fighter: FighterState): number {
  return (
    getFighterScrollCount(fighter) +
    getFighterFireballScrollCount(fighter) +
    getFighterWardScrollCount(fighter) +
    getFighterPreciseStrikeScrollCount(fighter) +
    getFighterDoubleStrikeScrollCount(fighter) +
    getFighterPoisonScrollCount(fighter)
  );
}

export function getFighterWardHits(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.wardHits ?? 0));
}

export function getFighterPreciseStrikeHits(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.preciseStrikeHits ?? 0));
}

export function getFighterDoubleStrikeHits(fighter: FighterState): number {
  return Math.max(0, Math.floor(fighter.doubleStrikeHits ?? 0));
}

export function getFighterPreciseStrikeBlockChanceReduction(fighter?: FighterState): number {
  const reduction = fighter?.preciseStrikeBlockChanceReduction ?? DEFAULT_PRECISE_STRIKE_BLOCK_CHANCE_REDUCTION;

  return clamp(reduction, 0, 0.95);
}

export function getFighterDoubleStrikeDamageMultiplier(fighter?: FighterState): number {
  const multiplier = fighter?.doubleStrikeDamageMultiplier ?? DEFAULT_DOUBLE_STRIKE_DAMAGE_MULTIPLIER;

  return clamp(multiplier, 0, 1);
}

export function getActionTitle(actionId: ActionId, actor?: FighterState): string {
  if (actionId === "switchWeapon" && actor) {
    return isBowFighter(actor) ? "Draw Steel" : "Draw Bow";
  }

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

export function availableActionIds(state: CombatState, actor: CombatActor): ActionId[] {
  return actionOrder.filter((id) => canUseAction(state, id, actor));
}

function doesActionEndTurn(actionId: ActionId, actor: CombatActor): boolean {
  if (actionId === "switchWeapon" || actionId === "preciseStrike" || actionId === "doubleStrike") {
    return false;
  }

  return !(actor === "player" && actionId === "shuriken");
}

export function doesPvpActionEndTurn(actionId: ActionId): boolean {
  return actionId !== "switchWeapon" && actionId !== "preciseStrike" && actionId !== "doubleStrike" && actionId !== "shuriken";
}

export function getFighterClinchRange(fighter?: FighterState): number {
  return Math.min(MAX_DISTANCE, MELEE_RANGE + Math.max(0, fighter?.clinchRangeBonus ?? 0) + getSpearClinchRangeBonus(fighter));
}

export function isFighterInClinchRange(state: CombatState, actor: CombatActor, defenderActor = getDefaultDefenderActor(state, actor)): boolean {
  const fighter = getCombatActorFighter(state, actor);

  return getActorDistance(state, actor, defenderActor) <= getFighterClinchRange(fighter);
}

export function doesLungeReachTarget(state: CombatState, actor: CombatActor = "player", defenderActor?: CombatActor): boolean {
  if (!canUseAction(state, "lunge", actor, defenderActor)) {
    return false;
  }

  const attacker = getCombatActorFighter(state, actor);

  if (!attacker) {
    return false;
  }

  const actionRangeMax = getActionRangeMax(actions.lunge, attacker);

  if (actionRangeMax === undefined) {
    return false;
  }

  const distanceDelta = clampActionMoveToContactRange(state, "lunge", attacker, actor, getActionMove("lunge", attacker), defenderActor);
  const nextDistance = roundCombatDistance(clamp(getActorDistance(state, actor, defenderActor) + distanceDelta, MIN_DISTANCE, MAX_DISTANCE));

  return nextDistance <= actionRangeMax;
}

export function shouldAutoRestPlayer(state: CombatState): boolean {
  return isPlayerExhausted(state) && canUseAction(state, "rest", "player");
}

export function isPlayerExhausted(state: CombatState): boolean {
  return state.result === "playing" && state.activeTurn === "player" && state.player.stamina <= 0;
}

export function canUseAction(state: CombatState, actionId: ActionId, actor: CombatActor = "player", defenderActor?: CombatActor): boolean {
  if (state.result !== "playing") {
    return false;
  }

  if (actor === "player" && state.activeTurn !== "player") {
    return false;
  }

  if (actor === "helper" && state.activeTurn !== "enemy") {
    return false;
  }

  if (actor === "enemy" && state.activeTurn !== "enemy") {
    return false;
  }

  const action = actions[actionId];
  const fighter = getCombatActorFighter(state, actor);
  const currentDistance = getActorDistance(state, actor, defenderActor);

  if (!fighter || fighter.hp <= 0) {
    return false;
  }

  const actionRangeMax = getActionRangeMax(action, fighter);
  const fighterClinchRange = getFighterClinchRange(fighter);
  const fighterInClinch = actor === "enemy" ? isEnemyInClinchWithAnyLivingAlly(state) : currentDistance <= fighterClinchRange;

  if (isAlliedActor(actor) && fighter.stamina <= 0 && actionId !== "rest" && !isScrollAction(actionId)) {
    return false;
  }

  if (actionId === "forward") {
    return !fighterInClinch && currentDistance > fighterClinchRange;
  }

  if (actionId === "back") {
    return currentDistance < MAX_DISTANCE;
  }

  if (actionId === "lunge") {
    if (isRangedFighter(fighter)) {
      return false;
    }

    return !fighterInClinch && currentDistance > fighterClinchRange;
  }

  if (actionId === "switchWeapon") {
    return !fighterInClinch && canFighterSwitchWeapon(fighter);
  }

  if (actionId === "shuriken") {
    return getFighterShurikenCount(fighter) > 0;
  }

  if (actionId === "scroll") {
    const defender = getDefenderForActor(state, actor, defenderActor);

    if (!defender) {
      return false;
    }

    return getFighterScrollCount(fighter) > 0 && hasCrackableArmorSlot(defender);
  }

  if (actionId === "fireball") {
    return getFighterFireballScrollCount(fighter) > 0;
  }

  if (actionId === "ward") {
    return getFighterWardScrollCount(fighter) > 0 && getFighterWardHits(fighter) <= 0;
  }

  if (actionId === "preciseStrike") {
    return getFighterPreciseStrikeScrollCount(fighter) > 0 && getFighterPreciseStrikeHits(fighter) <= 0;
  }

  if (actionId === "doubleStrike") {
    return getFighterDoubleStrikeScrollCount(fighter) > 0 && getFighterDoubleStrikeHits(fighter) <= 0;
  }

  if (actionId === "poison") {
    return getFighterPoisonScrollCount(fighter) > 0;
  }

  if (isAttackAction(actionId) && isBowFighter(fighter)) {
    return !fighterInClinch && getBowShotsRemaining(fighter) > 0;
  }

  if (actionRangeMax !== undefined) {
    return currentDistance <= actionRangeMax;
  }

  return true;
}

export function canUseTurnAction(state: CombatState, actionId: ActionId, actor: CombatActor = "player"): boolean {
  const activeTurn = actor === "helper" ? "enemy" : actor;

  if (state.result !== "playing" || state.activeTurn !== activeTurn) {
    return false;
  }

  const fighter = getCombatActorFighter(state, actor);

  if (!fighter || fighter.stamina <= 0 && actionId !== "rest" && !isScrollAction(actionId)) {
    return false;
  }

  return canUseAction(state, actionId, actor);
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

  forceClinchWeapons(state);
  if (state.result === "playing" && state.activeTurn === "player") {
    applyPoisonTurnStart(state, "player");
  }

  if (state.result !== "playing") {
    return state;
  }

  if (!hasLivingPlayer(state) && hasLivingHelper(state)) {
    advanceToNextAlliedTurn(state);
    return state;
  }

  if (!canUseAction(state, playerActionId, "player")) {
    addLog(state, `${getActionTitle(playerActionId, state.player)} is not available right now.`);
    return state;
  }

  applyAction(state, "player", playerActionId, random);

  if (state.result === "playing" && doesActionEndTurn(playerActionId, "player")) {
    state.activeTurn = "enemy";
    clearRestDefensePenalty(state, state.activeTurn);
  }

  return state;
}

export function resolveAutoPlayerTurn(current: CombatState, random = Math.random): CombatState {
  const actionId = choosePlayerAutoAction(current);

  return actionId ? resolvePlayerTurn(current, actionId, random) : current;
}

export function resolvePvpTurn(current: CombatState, actor: TurnOwner, actionId: ActionId, random = Math.random): CombatState {
  const state = cloneStateForTurn(current);

  if (state.result !== "playing" || state.activeTurn !== actor) {
    return state;
  }

  forceClinchWeapons(state);
  applyPoisonTurnStart(state, actor);

  if (state.result !== "playing") {
    return state;
  }

  if (actor === "player" && !hasLivingPlayer(state) && hasLivingHelper(state)) {
    advanceToNextAlliedTurn(state);
    return state;
  }

  if (!canUseTurnAction(state, actionId, actor)) {
    addLog(state, `${getActionTitle(actionId, actor === "player" ? state.player : state.enemy)} is not available right now.`);
    return state;
  }

  applyAction(state, actor, actionId, random, {
    playerActor: state.player.name,
    playerDefender: state.player.name,
    helperActor: state.helper?.name ?? "Ally",
    helperDefender: state.helper?.name ?? "ally",
    enemyActor: state.enemy.name,
    enemyDefender: state.enemy.name,
  });

  if (state.result === "playing" && doesPvpActionEndTurn(actionId)) {
    if (actor === "enemy") {
      state.round += 1;
    }
    state.activeTurn = actor === "player" ? "enemy" : "player";
    clearRestDefensePenalty(state, state.activeTurn);
  }

  return state;
}

export function resolveEnemyTurn(current: CombatState, random = Math.random): CombatState {
  const state = cloneStateForTurn(current);

  if (state.result !== "playing" || state.activeTurn !== "enemy") {
    return state;
  }

  forceClinchWeapons(state);
  applyPoisonTurnStart(state, "enemy");

  if (state.result !== "playing") {
    return state;
  }

  const defenderActor = chooseEnemyTarget(state, random);

  state.lastEnemyTarget = defenderActor === "helper" ? "helper" : "player";

  let enemyActionId = chooseEnemyAction(state, random, defenderActor);

  applyAction(state, "enemy", enemyActionId, random, DEFAULT_COMBAT_LOG_LABELS, defenderActor);

  if (state.result === "playing" && !doesActionEndTurn(enemyActionId, "enemy")) {
    enemyActionId = chooseEnemyAction(state, random, defenderActor);
    applyAction(state, "enemy", enemyActionId, random, DEFAULT_COMBAT_LOG_LABELS, defenderActor);
  }

  if (state.result !== "playing") {
    return state;
  }

  state.round += 1;
  advanceToNextAlliedTurn(state);
  return state;
}

export function resolveDuoBossSkippedDefeatedAllyTurn(current: CombatState): CombatState {
  if (!isDuoBossAiCombat(current) || current.result !== "playing") {
    return current;
  }

  if (shouldFinishBattle(current)) {
    const state = cloneStateForTurn(current);

    finishBattle(state);
    return state;
  }

  if (current.activeTurn === "player" && !hasLivingPlayer(current) && hasLivingHelper(current)) {
    const state = cloneStateForTurn(current);

    advanceToNextAlliedTurn(state);
    return state;
  }

  if (current.activeTurn === "enemy" && !hasLivingHelper(current) && hasLivingPlayer(current)) {
    return resolveEnemyTurn(current);
  }

  return current;
}

export function resolveDuoBossHelperTurn(current: CombatState, random = Math.random): CombatState {
  const state = cloneStateForTurn(current);

  if (!isDuoBossAiCombat(state) || state.result !== "playing" || state.activeTurn !== "enemy" || !state.helper || state.helper.hp <= 0) {
    return state;
  }

  forceClinchWeapons(state);

  const helperActionId = chooseDuoBossHelperAction(state, random);

  applyAction(state, "helper", helperActionId, random, {
    playerActor: state.player.name,
    playerDefender: state.player.name,
    helperActor: state.helper.name,
    helperDefender: state.helper.name,
    enemyActor: state.enemy.name,
    enemyDefender: state.enemy.name,
  });

  return state;
}

export function resolveDuoBossHelperPlayerTurn(current: CombatState, actionId: ActionId, random = Math.random): CombatState {
  const state = cloneStateForTurn(current);

  if (!isDuoBossAiCombat(state) || state.result !== "playing" || state.activeTurn !== "enemy" || !state.helper || state.helper.hp <= 0) {
    return state;
  }

  forceClinchWeapons(state);
  applyPoisonTurnStart(state, "helper");

  if (state.result !== "playing") {
    return state;
  }

  if (!canUseTurnAction(state, actionId, "helper")) {
    addLog(state, `${getActionTitle(actionId, state.helper)} is not available right now.`);
    return state;
  }

  applyAction(state, "helper", actionId, random, {
    playerActor: state.player.name,
    playerDefender: state.player.name,
    helperActor: state.helper.name,
    helperDefender: state.helper.name,
    enemyActor: state.enemy.name,
    enemyDefender: state.enemy.name,
  });

  return state;
}

export interface AutoCombatResolveOptions {
  maxTurns?: number;
  random?: () => number;
}

export function resolveAutoCombat(current: CombatState, options: AutoCombatResolveOptions = {}): CombatState {
  const maxTurns = Math.max(1, Math.floor(options.maxTurns ?? DEFAULT_AUTO_COMBAT_MAX_TURNS));
  const random = options.random ?? Math.random;
  let state = current;

  for (let turn = 0; state.result === "playing" && turn < maxTurns; turn += 1) {
    const previousState = state;

    if (state.activeTurn === "player") {
      state = resolveAutoPlayerTurn(state, random);
    } else if (isDuoBossAiCombat(state)) {
      const helperState = resolveDuoBossHelperTurn(state, random);

      state = helperState.result === "playing" ? resolveEnemyTurn(helperState, random) : helperState;
    } else {
      state = resolveEnemyTurn(state, random);
    }

    if (state === previousState) {
      return finishAutoCombatByLimit(state, "Auto fight stalled. The crowd declares it a loss.");
    }
  }

  return state.result === "playing"
    ? finishAutoCombatByLimit(state, `Auto fight exceeded ${maxTurns} turns. The crowd declares it a loss.`)
    : state;
}

function finishAutoCombatByLimit(current: CombatState, message: string): CombatState {
  const state = cloneStateForTurn(current);

  state.result = "lose";
  addLog(state, message, true);
  return state;
}

function cloneStateForTurn(current: CombatState): CombatState {
  return {
    ...current,
    player: cloneFighterState(current.player),
    helper: current.helper ? cloneFighterState(current.helper) : undefined,
    enemy: cloneFighterState(current.enemy),
    log: [...current.log],
    lastPlayerActions: [],
    lastEnemyActions: [],
    lastHelperActions: [],
    lastPlayerAction: undefined,
    lastEnemyAction: undefined,
    lastHelperAction: undefined,
    lastPlayerDamage: 0,
    lastEnemyDamage: 0,
    lastHelperDamage: 0,
    lastPlayerArmorAbsorbed: 0,
    lastEnemyArmorAbsorbed: 0,
    lastHelperArmorAbsorbed: 0,
    lastPlayerArmorBroken: false,
    lastEnemyArmorBroken: false,
    lastHelperArmorBroken: false,
    lastPlayerRemovedArmorSlots: undefined,
    lastEnemyRemovedArmorSlots: undefined,
    lastHelperRemovedArmorSlots: undefined,
    lastPlayerWardAbsorbed: false,
    lastEnemyWardAbsorbed: false,
    lastHelperWardAbsorbed: false,
    lastPlayerHitResults: undefined,
    lastEnemyHitResults: undefined,
    lastHelperHitResults: undefined,
    lastPlayerPoisonDamage: 0,
    lastEnemyPoisonDamage: 0,
    lastPlayerDoubleStrikeRepeat: false,
    lastEnemyDoubleStrikeRepeat: false,
    lastHelperDoubleStrikeRepeat: false,
    lastPlayerBlocked: false,
    lastEnemyBlocked: false,
    lastHelperBlocked: false,
    lastEnemyTarget: undefined,
  };
}

function cloneFighterState(fighter: FighterState): FighterState {
  return {
    ...fighter,
    equipment: fighter.equipment ? { ...fighter.equipment } : undefined,
    weaponEnchantments: fighter.weaponEnchantments ? { ...fighter.weaponEnchantments } : undefined,
    armorSlots: fighter.armorSlots?.map((slot) => ({ ...slot })),
    appearance: fighter.appearance ? { ...fighter.appearance } : undefined,
    visualPreset: fighter.visualPreset ? { ...fighter.visualPreset } : undefined,
  };
}

export function choosePlayerAutoAction(current: CombatState, actor: "player" | "helper" = "player"): ActionId | undefined {
  const available = availableActionIds(current, actor).filter((actionId) => isPlayerAutoAction(actionId));

  if (available.length === 0) {
    return undefined;
  }

  const fighter = getCombatActorFighter(current, actor);

  if (!fighter) {
    return undefined;
  }

  const lowStamina = fighter.stamina <= Math.max(1, Math.floor(getFighterMaxStamina(fighter) * 0.35));
  const enemyLowHp = current.enemy.hp <= Math.max(3, Math.ceil(getActionDamage("light", fighter) * 2));
  const fighterHasRangedWeapon = isRangedFighter(fighter);
  const inClinch = isFighterInClinchRange(current, actor);
  const lungeReaches = available.includes("lunge") && doesLungeReachTarget(current, actor);

  if (fighter.stamina <= 0 && available.includes("rest")) {
    return "rest";
  }

  if (lowStamina && available.includes("rest") && (inClinch || !available.includes("forward"))) {
    return "rest";
  }

  if (fighterHasRangedWeapon) {
    if (available.includes("heavy") && enemyLowHp) {
      return "heavy";
    }

    if (available.includes("medium") && fighter.stamina >= getActionStaminaCost("medium", fighter)) {
      return "medium";
    }

    if (available.includes("light")) {
      return "light";
    }

    if (available.includes("back")) {
      return "back";
    }
  }

  if (!inClinch) {
    if (lungeReaches && !lowStamina) {
      return "lunge";
    }

    if (available.includes("forward")) {
      return "forward";
    }
  }

  if (available.includes("heavy") && (enemyLowHp || fighter.stamina >= getActionStaminaCost("heavy", fighter) + 2)) {
    return "heavy";
  }

  if (available.includes("medium") && fighter.stamina >= getActionStaminaCost("medium", fighter)) {
    return "medium";
  }

  if (available.includes("light")) {
    return "light";
  }

  return available.includes("rest") ? "rest" : available[0];
}

function isPlayerAutoAction(actionId: ActionId): boolean {
  return actionId === "forward"
    || actionId === "back"
    || actionId === "lunge"
    || actionId === "light"
    || actionId === "medium"
    || actionId === "heavy"
    || actionId === "rest";
}

function chooseEnemyAction(current: CombatState, random = Math.random, defenderActor: CombatActor = "player"): ActionId {
  const available = availableEnemyAiActionIds(current, defenderActor);
  const weighted: ActionId[] = [];
  const enemyLowStamina = current.enemy.stamina <= 3;
  const enemyLowHp = current.enemy.hp <= 10;
  const defender = getDefenderForActor(current, "enemy", defenderActor) ?? current.player;
  const playerLowHp = defender.hp <= 9;
  const enemyHasRangedWeapon = isRangedFighter(current.enemy);
  const enemyCanSwitchWeapon = canFighterSwitchWeapon(current.enemy);
  const enemyInClinch = isEnemyInClinchWithAnyLivingAlly(current);
  const enemyLungeReaches = available.includes("lunge") && doesLungeReachTarget(current, "enemy", defenderActor);

  if (current.enemy.stamina <= 0 && available.includes("rest")) {
    return "rest";
  }

  const bossAction = chooseBossSpecificEnemyAction(current, available, random, defenderActor);

  if (bossAction) {
    return bossAction;
  }

  for (const id of available) {
    if (id === "switchWeapon") {
      if (!enemyInClinch && enemyCanSwitchWeapon && !enemyHasRangedWeapon) {
        weighted.push(id, id, id);
      } else if (enemyHasRangedWeapon && getBowShotsRemaining(current.enemy) <= 0) {
        weighted.push(id, id, id);
      }
      continue;
    }

    if (addEnemyScrollActionWeights(current, id, available, weighted, enemyLowHp, playerLowHp, enemyInClinch)) {
      continue;
    }

    if (id === "shuriken") {
      weighted.push(id);
      if (playerLowHp) {
        weighted.push(id);
      }
      continue;
    }

    if (!enemyInClinch) {
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
        weighted.push(id);
        if (!enemyLungeReaches) {
          weighted.push(id, id);
        }
      } else if (id === "lunge") {
        weighted.push(id, id);
        if (enemyLungeReaches) {
          weighted.push(id, id, id, id, id);
        }
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
    }
  }

  return weighted[Math.floor(random() * weighted.length)] ?? available[0] ?? "rest";
}

function availableEnemyAiActionIds(state: CombatState, defenderActor: CombatActor = "player"): ActionId[] {
  const canRest = state.enemy.stamina <= getFighterMaxStamina(state.enemy) * 0.5;

  return actionOrder.filter((id) => canUseAction(state, id, "enemy", defenderActor)).filter((id) => {
    if (id === "rest") {
      return canRest;
    }

    if (id === "taunt" && state.encounter?.kind === "boss") {
      return false;
    }

    return true;
  });
}

function chooseEnemyTarget(state: CombatState, random: () => number): CombatActor {
  if (!isDuoBossAiCombat(state) || !state.helper || state.helper.hp <= 0) {
    return "player";
  }

  const playerInClinch = isEnemyInClinchWithActor(state, "player");
  const helperInClinch = isEnemyInClinchWithActor(state, "helper");

  if (helperInClinch && !playerInClinch) {
    return "helper";
  }

  if (playerInClinch && !helperInClinch) {
    return "player";
  }

  if (state.player.hp <= 0) {
    return "helper";
  }

  const playerHpRatio = state.player.hp / getFighterMaxHp(state.player);
  const helperHpRatio = state.helper.hp / getFighterMaxHp(state.helper);

  if (playerHpRatio <= 0.3 && helperHpRatio > 0.5) {
    return random() < 0.35 ? "player" : "helper";
  }

  return random() < 0.62 ? "player" : "helper";
}

function chooseDuoBossHelperAction(state: CombatState, random: () => number): ActionId {
  const helper = state.helper;

  if (!helper) {
    return "rest";
  }

  const available = actionOrder.filter((id) => isDuoBossHelperAiAction(id) && canUseAction(state, id, "helper"));
  const weighted: ActionId[] = [];
  const helperLowStamina = helper.stamina <= Math.max(2, Math.floor(getFighterMaxStamina(helper) * 0.35));
  const helperInClinch = isFighterInClinchRange(state, "helper");
  const lungeReaches = available.includes("lunge") && doesLungeReachTarget(state, "helper");

  if (helper.stamina <= 0 && available.includes("rest")) {
    return "rest";
  }

  if (!helperInClinch) {
    pushAvailableActions(weighted, available, "lunge", lungeReaches ? 7 : 2);
    pushAvailableActions(weighted, available, "forward", lungeReaches ? 1 : 6);
    pushAvailableActions(weighted, available, "light", isRangedFighter(helper) ? 4 : 0);
    pushAvailableActions(weighted, available, "medium", isRangedFighter(helper) ? 3 : 0);
    pushAvailableActions(weighted, available, "heavy", isRangedFighter(helper) ? 2 : 0);
    pushAvailableActions(weighted, available, "rest", helperLowStamina ? 2 : 0);
    return pickWeightedAction(weighted, random) ?? available[0] ?? "rest";
  }

  pushAvailableActions(weighted, available, "medium", helperLowStamina ? 2 : 5);
  pushAvailableActions(weighted, available, "light", 3);
  pushAvailableActions(weighted, available, "heavy", helperLowStamina ? 1 : 3);
  pushAvailableActions(weighted, available, "rest", helperLowStamina ? 3 : 1);
  pushAvailableActions(weighted, available, "back", helperLowStamina ? 2 : 0);
  return pickWeightedAction(weighted, random) ?? available[0] ?? "rest";
}

function isDuoBossHelperAiAction(actionId: ActionId): boolean {
  return (
    actionId === "forward" ||
    actionId === "back" ||
    actionId === "lunge" ||
    actionId === "light" ||
    actionId === "medium" ||
    actionId === "heavy" ||
    actionId === "rest"
  );
}

function chooseBossSpecificEnemyAction(
  current: CombatState,
  available: readonly ActionId[],
  random: () => number,
  defenderActor: CombatActor,
): ActionId | undefined {
  if (current.encounter?.kind !== "boss") {
    return undefined;
  }

  if (current.encounter.opponentId === EAGLE_BOSS_ID) {
    return chooseEagleBossAction(current, available, random, defenderActor);
  }

  return undefined;
}

function chooseEagleBossAction(
  current: CombatState,
  available: readonly ActionId[],
  random: () => number,
  defenderActor: CombatActor,
): ActionId | undefined {
  const weighted: ActionId[] = [];
  const enemyInClinch = isEnemyInClinchWithAnyLivingAlly(current);
  const defender = getDefenderForActor(current, "enemy", defenderActor) ?? current.player;
  const playerLowHp = defender.hp <= 9;
  const enemyLowStamina = current.enemy.stamina <= 3;
  const lungeReaches = available.includes("lunge") && doesLungeReachTarget(current, "enemy", defenderActor);

  if (enemyInClinch) {
    pushAvailableActions(weighted, available, "back", playerLowHp ? 3 : 7);
    pushAvailableActions(weighted, available, "medium", playerLowHp ? 4 : 2);
    pushAvailableActions(weighted, available, "light", playerLowHp ? 2 : 1);
    pushAvailableActions(weighted, available, "heavy", playerLowHp ? 2 : 1);
    pushAvailableActions(weighted, available, "rest", enemyLowStamina ? 2 : 0);
    return pickWeightedAction(weighted, random);
  }

  if (lungeReaches) {
    pushAvailableActions(weighted, available, "lunge", 8);
    pushAvailableActions(weighted, available, "forward", 1);
    pushAvailableActions(weighted, available, "back", 1);
    pushAvailableActions(weighted, available, "rest", enemyLowStamina ? 1 : 0);
    return pickWeightedAction(weighted, random);
  }

  pushAvailableActions(weighted, available, "forward", 7);
  pushAvailableActions(weighted, available, "lunge", 1);
  pushAvailableActions(weighted, available, "back", 1);
  pushAvailableActions(weighted, available, "rest", enemyLowStamina ? 1 : 0);
  return pickWeightedAction(weighted, random);
}

function pushAvailableActions(weighted: ActionId[], available: readonly ActionId[], actionId: ActionId, count: number): void {
  if (!available.includes(actionId) || count <= 0) {
    return;
  }

  for (let index = 0; index < count; index += 1) {
    weighted.push(actionId);
  }
}

function pickWeightedAction(weighted: readonly ActionId[], random: () => number): ActionId | undefined {
  return weighted[Math.floor(random() * weighted.length)];
}

function addEnemyScrollActionWeights(
  current: CombatState,
  actionId: ActionId,
  available: readonly ActionId[],
  weighted: ActionId[],
  enemyLowHp: boolean,
  playerLowHp: boolean,
  enemyInClinch: boolean,
): boolean {
  if (!isScrollAction(actionId)) {
    return false;
  }

  if (actionId === "ward") {
    weighted.push(actionId, actionId);
    if (enemyLowHp) {
      weighted.push(actionId, actionId);
    }
    return true;
  }

  if (actionId === "poison") {
    weighted.push(actionId, actionId);
    if (getFighterPoisonTurns(current.player) <= 0) {
      weighted.push(actionId);
    }
    return true;
  }

  if (actionId === "fireball") {
    weighted.push(actionId, actionId);
    if (playerLowHp || current.player.hp <= getFighterFireballDamage(current.enemy)) {
      weighted.push(actionId, actionId);
    }
    return true;
  }

  if (actionId === "scroll") {
    weighted.push(actionId, actionId);
    if (current.player.armor > 0) {
      weighted.push(actionId);
    }
    return true;
  }

  if (actionId === "preciseStrike" || actionId === "doubleStrike") {
    const canFollowWithAttack = available.some((id) => id === "light" || id === "medium" || id === "heavy" || id === "lunge");

    if (canFollowWithAttack) {
      weighted.push(actionId);
      if (enemyInClinch) {
        weighted.push(actionId);
      }
    }
    return true;
  }

  return true;
}

interface CombatLogLabels {
  playerActor: string;
  playerDefender: string;
  helperActor: string;
  helperDefender: string;
  enemyActor: string;
  enemyDefender: string;
}

const DEFAULT_COMBAT_LOG_LABELS: CombatLogLabels = {
  playerActor: "You",
  playerDefender: "you",
  helperActor: "Ally",
  helperDefender: "ally",
  enemyActor: "Grumbus",
  enemyDefender: "Grumbus",
};

function getCombatActorLogLabel(labels: CombatLogLabels, actor: CombatActor, role: "actor" | "defender"): string {
  if (actor === "player") {
    return role === "actor" ? labels.playerActor : labels.playerDefender;
  }

  if (actor === "helper") {
    return role === "actor" ? labels.helperActor : labels.helperDefender;
  }

  return role === "actor" ? labels.enemyActor : labels.enemyDefender;
}

function applyAction(
  state: CombatState,
  actor: CombatActor,
  actionId: ActionId,
  random: () => number,
  labels: CombatLogLabels = DEFAULT_COMBAT_LOG_LABELS,
  defenderActor: CombatActor = getDefaultDefenderActor(state, actor),
): void {
  const action = actions[actionId];
  const attacker = getCombatActorFighter(state, actor);
  const defender = getDefenderForActor(state, actor, defenderActor);

  if (!attacker || !defender) {
    return;
  }

  let actionMove = getActionMove(actionId, attacker);
  const actorLabel = getCombatActorLogLabel(labels, actor, "actor");
  const defenderLabel = getCombatActorLogLabel(labels, defenderActor, "defender");
  const defenderOwner = defenderActor;
  const actionTitle = getActionTitle(actionId, attacker);
  const actionRangeMax = getActionRangeMax(action, attacker);
  const staminaRestore = getActionStaminaRestore(actionId, attacker);
  const heal = getActionHeal(actionId, attacker);

  attacker.stamina = clamp(attacker.stamina - getActionStaminaCost(actionId, attacker), 0, getFighterMaxStamina(attacker));

  if (actionId === "switchWeapon") {
    attacker.weaponClass = getFighterSwitchTargetWeaponClass(attacker);
  }

  if (actionMove) {
    actionMove = clampActionMoveToContactRange(state, actionId, attacker, actor, actionMove, defenderActor);
    moveActor(state, actor, actionMove, defenderActor);
    forceClinchWeapons(state);
  }

  if (staminaRestore > 0) {
    attacker.stamina = clamp(attacker.stamina + staminaRestore, 0, getFighterMaxStamina(attacker));
  }

  if (heal > 0) {
    attacker.hp = clamp(attacker.hp + heal, 0, getFighterMaxHp(attacker));
  }

  if (actionId === "rest") {
    addRestDefensePenalty(state, actor, REST_DEFENSE_PENALTY);
  }

  let damage = getActionDamage(actionId, attacker);
  const actionDistance = getActorDistance(state, actor, defenderActor);
  const inRange = actionRangeMax === undefined || actionDistance <= actionRangeMax;
  let blocked = false;
  let appliedDamage: DamageApplication = { armorAbsorbed: 0, armorBroken: false };
  let hitResults: CombatHitResult[] | undefined;

  if (actionId === "shuriken" && getFighterShurikenCount(attacker) > 0) {
    attacker.shurikenCount = getFighterShurikenCount(attacker) - 1;
  }

  if (actionId === "scroll" && getFighterScrollCount(attacker) > 0) {
    attacker.scrollCount = getFighterScrollCount(attacker) - 1;
    appliedDamage = applyCrackArmorScroll(attacker, defender, random);
    damage = appliedDamage.armorAbsorbed;
  }

  if (actionId === "fireball" && getFighterFireballScrollCount(attacker) > 0) {
    attacker.fireballScrollCount = getFighterFireballScrollCount(attacker) - 1;
    damage = getFighterFireballDamage(attacker);
    if (consumeWardHit(defender)) {
      damage = 0;
      appliedDamage = { armorAbsorbed: 0, armorBroken: false, wardAbsorbed: true };
    } else {
      appliedDamage = applyDamageToFighter(defender, damage);
    }
  }

  if (actionId === "ward" && getFighterWardScrollCount(attacker) > 0) {
    attacker.wardScrollCount = getFighterWardScrollCount(attacker) - 1;
    attacker.wardHits = getFighterWardHitCount(attacker);
  }

  if (actionId === "preciseStrike" && getFighterPreciseStrikeScrollCount(attacker) > 0) {
    attacker.preciseStrikeScrollCount = getFighterPreciseStrikeScrollCount(attacker) - 1;
    attacker.preciseStrikeHits = PRECISE_STRIKE_HITS;
  }

  if (actionId === "doubleStrike" && getFighterDoubleStrikeScrollCount(attacker) > 0) {
    attacker.doubleStrikeScrollCount = getFighterDoubleStrikeScrollCount(attacker) - 1;
    attacker.doubleStrikeHits = 1;
  }

  if (actionId === "poison" && getFighterPoisonScrollCount(attacker) > 0) {
    attacker.poisonScrollCount = getFighterPoisonScrollCount(attacker) - 1;
    const currentPoisonDamage = getFighterPoisonTurns(defender) > 0 ? getFighterPoisonDamage(defender) : 0;
    defender.poisonDamage = Math.max(currentPoisonDamage, getFighterPoisonDamage(attacker));
    defender.poisonTurns = getFighterPoisonTurns(defender) + POISON_SCROLL_TURNS;
  }

  if (isAttackAction(actionId) && isBowFighter(attacker) && getBowShotsRemaining(attacker) > 0) {
    attacker.bowShotsRemaining = getBowShotsRemaining(attacker) - 1;
  }

  if (damage > 0 && !inRange && actionId !== "scroll" && actionId !== "fireball") {
    damage = 0;
  }

  const preciseStrikeBoosted = shouldConsumePreciseStrikeForAction(actionId, attacker);
  const doubleStrikeBoosted = shouldConsumeDoubleStrikeForAction(actionId, attacker, damage, inRange);
  let doubleStrikeRepeat = false;
  let preciseStrikeConsumed = false;

  if (damage > 0 && actionId !== "scroll" && actionId !== "fireball") {
    const firstHit = resolveWeaponHit(state, action, attacker, defender, defenderOwner, damage, random);

    damage = firstHit.damage;
    blocked = firstHit.blocked;
    appliedDamage = firstHit.appliedDamage;
    hitResults = [createCombatHitResult(firstHit)];

    if (preciseStrikeBoosted) {
      consumePreciseStrikeHit(attacker);
      preciseStrikeConsumed = true;
    }

    if (doubleStrikeBoosted && defender.hp > 0 && canResolveDoubleStrikeRepeat(actionId, attacker)) {
      const repeatBaseDamage = getDoubleStrikeRepeatDamage(getActionDamage(actionId, attacker), attacker);
      const preciseStrikeRepeatBoosted = shouldConsumePreciseStrikeForAction(actionId, attacker);

      doubleStrikeRepeat = true;
      consumeDoubleStrikeRepeatCost(actionId, attacker);
      const secondHit = resolveWeaponHit(state, action, attacker, defender, defenderOwner, repeatBaseDamage, random);

      damage += secondHit.damage;
      blocked ||= secondHit.blocked;
      appliedDamage = mergeDamageApplications(appliedDamage, secondHit.appliedDamage);
      hitResults.push(createCombatHitResult(secondHit));

      if (preciseStrikeRepeatBoosted) {
        consumePreciseStrikeHit(attacker);
      }
    }
  }

  if (preciseStrikeBoosted && !preciseStrikeConsumed) {
    consumePreciseStrikeHit(attacker);
  }

  if (doubleStrikeBoosted) {
    consumeDoubleStrikeHit(attacker);
  }

  if (actor === "player") {
    const glory = action.glory ?? 0;
    const staminaBonus = state.player.stamina >= 5 ? 12 : 0;

    state.score += damage * 90 + glory + staminaBonus;
    pushCombatActionTrace(state, actor, actionId, defenderOwner);
    state.lastPlayerAction = actionId;
    state.lastPlayerDamage = damage;
    state.lastPlayerArmorAbsorbed = appliedDamage.armorAbsorbed;
    state.lastPlayerArmorBroken = appliedDamage.armorBroken;
    state.lastPlayerRemovedArmorSlots = appliedDamage.removedArmorSlots;
    state.lastPlayerWardAbsorbed = Boolean(appliedDamage.wardAbsorbed);
    state.lastPlayerHitResults = hitResults;
    state.lastPlayerDoubleStrikeRepeat = doubleStrikeRepeat;
    state.lastPlayerBlocked = blocked;
  } else if (actor === "helper") {
    pushCombatActionTrace(state, actor, actionId, defenderOwner);
    state.lastHelperAction = actionId;
    state.lastHelperDamage = damage;
    state.lastHelperArmorAbsorbed = appliedDamage.armorAbsorbed;
    state.lastHelperArmorBroken = appliedDamage.armorBroken;
    state.lastHelperRemovedArmorSlots = appliedDamage.removedArmorSlots;
    state.lastHelperWardAbsorbed = Boolean(appliedDamage.wardAbsorbed);
    state.lastHelperHitResults = hitResults;
    state.lastHelperDoubleStrikeRepeat = doubleStrikeRepeat;
    state.lastHelperBlocked = blocked;
  } else {
    pushCombatActionTrace(state, actor, actionId, defenderOwner);
    state.lastEnemyAction = actionId;
    state.lastEnemyTarget = defenderActor === "helper" ? "helper" : "player";
    state.lastEnemyDamage = damage;
    state.lastEnemyArmorAbsorbed = appliedDamage.armorAbsorbed;
    state.lastEnemyArmorBroken = appliedDamage.armorBroken;
    state.lastEnemyRemovedArmorSlots = appliedDamage.removedArmorSlots;
    state.lastEnemyWardAbsorbed = Boolean(appliedDamage.wardAbsorbed);
    state.lastEnemyHitResults = hitResults;
    state.lastEnemyDoubleStrikeRepeat = doubleStrikeRepeat;
    state.lastEnemyBlocked = blocked;
  }

  addActionLog(state, actor, actorLabel, defenderLabel, action, actionTitle, actionMove, damage, inRange, blocked, actionDistance, getFighterClinchRange(attacker), staminaRestore, heal);

  if (shouldFinishBattle(state)) {
    finishBattle(state);
  }
}

function pushCombatActionTrace(state: CombatState, actor: CombatActor, actionId: ActionId, defender: CombatActor): void {
  const trace: CombatActionTrace = { actionId, defender };

  if (actor === "player") {
    (state.lastPlayerActions ??= []).push(trace);
    return;
  }

  if (actor === "helper") {
    (state.lastHelperActions ??= []).push(trace);
    return;
  }

  (state.lastEnemyActions ??= []).push(trace);
}

function isActionBlocked(
  state: CombatState,
  action: ActionConfig,
  attacker: FighterState,
  defender: FighterState,
  defenderOwner: CombatActor,
  random: () => number,
): boolean {
  void defender;

  const blockChance = getAdjustedActionBlockChance(action, getActionBlockChanceModifier(action, attacker), getRestDefensePenalty(state, defenderOwner));

  return blockChance > 0 && random() < blockChance;
}

function resolveWeaponHit(
  state: CombatState,
  action: ActionConfig,
  attacker: FighterState,
  defender: FighterState,
  defenderOwner: CombatActor,
  baseDamage: number,
  random: () => number,
): WeaponHitResolution {
  let damage = Math.max(0, Math.floor(baseDamage));
  let blocked = false;
  let appliedDamage: DamageApplication = { armorAbsorbed: 0, armorBroken: false };

  if (damage <= 0) {
    return { damage: 0, blocked, appliedDamage };
  }

  blocked = isActionBlocked(state, action, attacker, defender, defenderOwner, random);
  clearRestDefensePenalty(state, defenderOwner);

  if (blocked) {
    return { damage: 0, blocked, appliedDamage };
  }

  damage = applyWeaponArmorDamageBonus(action.id, attacker, defender, damage);

  if (consumeWardHit(defender)) {
    return {
      damage: 0,
      blocked,
      appliedDamage: { armorAbsorbed: 0, armorBroken: false, wardAbsorbed: true },
    };
  }

  appliedDamage = applyDamageToFighter(defender, damage);
  return { damage, blocked, appliedDamage };
}

function mergeDamageApplications(first: DamageApplication, second: DamageApplication): DamageApplication {
  return {
    armorAbsorbed: first.armorAbsorbed + second.armorAbsorbed,
    armorBroken: first.armorBroken || second.armorBroken,
    removedArmorSlots: mergeRemovedArmorSlots(first.removedArmorSlots, second.removedArmorSlots),
    wardAbsorbed: first.wardAbsorbed || second.wardAbsorbed,
  };
}

function createCombatHitResult(hit: WeaponHitResolution): CombatHitResult {
  return {
    damage: hit.damage,
    armorAbsorbed: hit.appliedDamage.armorAbsorbed,
    armorBroken: hit.appliedDamage.armorBroken,
    removedArmorSlots: hit.appliedDamage.removedArmorSlots,
    wardAbsorbed: Boolean(hit.appliedDamage.wardAbsorbed),
    blocked: hit.blocked,
  };
}

function mergeRemovedArmorSlots(
  first: CombatArmorSlotState[] | undefined,
  second: CombatArmorSlotState[] | undefined,
): CombatArmorSlotState[] | undefined {
  const merged = [...(first ?? []), ...(second ?? [])];

  return merged.length > 0 ? merged : undefined;
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

function getActionMeleeDamageMultiplier(attacker: FighterState): number {
  const meleeDamagePercentBonus = Math.max(0, attacker.meleeDamagePercentBonus ?? 0);
  const spearDamagePercentBonus = getFighterWeaponClass(attacker) === "spear" ? Math.max(0, attacker.spearMeleeDamagePercentBonus ?? 0) : 0;
  const weaponMultiplier = getFighterWeaponClass(attacker) === "axe" ? AXE_MELEE_DAMAGE_PERCENT_BONUS_MULTIPLIER : 1;

  return 1 + meleeDamagePercentBonus * weaponMultiplier + spearDamagePercentBonus;
}

function getMeleeWeaponDamage(attacker: FighterState): number {
  return Math.max(MIN_MELEE_WEAPON_DAMAGE, Math.max(0, attacker.damageBonus ?? 0));
}

function getActionMeleeWeaponDamageMultiplier(actionId: ActionId, attacker: FighterState): number | undefined {
  if (getFighterWeaponClass(attacker) === "axe") {
    return AXE_MELEE_DAMAGE_MULTIPLIER[actionId] ?? actions[actionId].meleeDamageMultiplier;
  }

  return actions[actionId].meleeDamageMultiplier;
}

function getActionMeleeFlatDamageBonus(actionId: ActionId): number {
  return MELEE_ACTION_FLAT_DAMAGE_BONUS[actionId] ?? 0;
}

function getActionDamage(actionId: ActionId, attacker: FighterState): number {
  if (actionId === "shuriken") {
    return Math.max(0, Math.floor(attacker.shurikenDamage ?? 0));
  }

  const actionDamage = actions[actionId].damage ?? 0;
  const isSpearLunge = actionId === "lunge" && isSpearFighter(attacker);

  if (actionDamage <= 0 && !isSpearLunge) {
    return 0;
  }

  const meleeDamageMultiplier = getActionMeleeWeaponDamageMultiplier(actionId, attacker);

  if (!isRangedFighter(attacker) && meleeDamageMultiplier !== undefined) {
    return Math.ceil(getMeleeWeaponDamage(attacker) * meleeDamageMultiplier * getActionMeleeDamageMultiplier(attacker)) + getActionMeleeFlatDamageBonus(actionId);
  }

  const baseDamage = actionDamage + getActionDamageBonus(attacker);
  const spearLungeDamageMultiplier = getSpearLungeDamageMultiplier(actionId, attacker);
  const spearLungeAgilityDamageMultiplier = getSpearLungeAgilityDamageMultiplier(actionId, attacker);

  if (isSpearLunge) {
    return Math.ceil(getActionDamageBonus(attacker) * spearLungeDamageMultiplier * spearLungeAgilityDamageMultiplier);
  }

  return isRangedFighter(attacker) ? baseDamage : Math.ceil(baseDamage * getActionMeleeDamageMultiplier(attacker) * spearLungeDamageMultiplier);
}

function applyWeaponArmorDamageBonus(actionId: ActionId, attacker: FighterState, defender: FighterState, damage: number): number {
  if (damage <= 0 || actionId === "shuriken" || isRangedFighter(attacker)) {
    return damage;
  }

  if (getFighterWeaponClass(attacker) !== "mace" || Math.max(0, defender.armor ?? 0) <= 0) {
    return damage;
  }

  return Math.ceil(damage * (MACE_ARMORED_TARGET_DAMAGE_MULTIPLIER + Math.max(0, attacker.maceArmorDamagePercentBonus ?? 0)));
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

function applyDirectDamageToFighter(defender: FighterState, damage: number): DamageApplication {
  const hpDamage = Math.max(0, Math.floor(damage));

  if (hpDamage <= 0) {
    return { armorAbsorbed: 0, armorBroken: false };
  }

  defender.hp = clamp(defender.hp - hpDamage, 0, getFighterMaxHp(defender));
  return { armorAbsorbed: 0, armorBroken: false };
}

function applyPoisonTurnStart(state: CombatState, owner: CombatActor): void {
  const fighter = getCombatActorFighter(state, owner);

  if (!fighter) {
    return;
  }

  const poisonTurns = getFighterPoisonTurns(fighter);

  if (poisonTurns <= 0 || fighter.hp <= 0) {
    return;
  }

  const poisonDamage = getFighterPoisonDamage(fighter);
  fighter.poisonTurns = poisonTurns - 1;
  applyDirectDamageToFighter(fighter, poisonDamage);

  if (fighter.poisonTurns <= 0) {
    fighter.poisonDamage = 0;
  }

  if (owner === "enemy") {
    state.lastPlayerPoisonDamage = poisonDamage;
  } else {
    state.lastEnemyPoisonDamage = poisonDamage;
  }

  addLog(state, `${fighter.name} suffers ${poisonDamage} poison damage.`, true);

  if (shouldFinishBattle(state)) {
    finishBattle(state);
  }
}

function consumeWardHit(defender: FighterState): boolean {
  const wardHits = getFighterWardHits(defender);

  if (wardHits <= 0) {
    return false;
  }

  defender.wardHits = Math.max(0, wardHits - 1);
  return true;
}

function applyCrackArmorScroll(attacker: FighterState, defender: FighterState, random: () => number): DamageApplication {
  const removedArmorSlots = pickCrackableArmorSlotGroups(defender, getFighterCrackArmorParts(attacker), random);

  if (removedArmorSlots.length === 0) {
    return { armorAbsorbed: 0, armorBroken: false };
  }

  const currentArmor = Math.max(0, defender.armor ?? 0);
  const armorDamage = Math.min(
    currentArmor,
    removedArmorSlots.reduce((total, removedSlot) => total + Math.max(0, Math.floor(removedSlot.armorHp)), 0),
  );

  if (armorDamage <= 0) {
    return { armorAbsorbed: 0, armorBroken: false };
  }

  removedArmorSlots.forEach((removedSlot) => {
    const armorSlot = defender.armorSlots?.find((candidate) => candidate.slotKey === removedSlot.slotKey);

    if (armorSlot) {
      armorSlot.armorHp = 0;
    }
  });
  defender.armor = clamp(currentArmor - armorDamage, 0, getFighterMaxArmor(defender));
  if (defender.equipment) {
    removedArmorSlots.forEach((removedSlot) => {
      defender.equipment![removedSlot.slotKey] = null;
    });
  }

  return {
    armorAbsorbed: armorDamage,
    armorBroken: currentArmor > 0 && armorDamage >= currentArmor,
    removedArmorSlots,
  };
}

function pickCrackableArmorSlotGroups(defender: FighterState, count: number, random: () => number): CombatArmorSlotState[] {
  const removedArmorSlots: CombatArmorSlotState[] = [];
  const removedSlotKeys = new Set<HeroEquipmentSlotKey>();
  const groupCount = Math.max(1, Math.floor(count));

  for (let index = 0; index < groupCount; index += 1) {
    const slots = getCrackableArmorSlots(defender).filter((slot) =>
      getArmorSlotRemovalKeys(slot.slotKey).every((slotKey) => !removedSlotKeys.has(slotKey)),
    );
    const rolledSlot = slots[Math.floor(random() * slots.length)];

    if (!rolledSlot) {
      break;
    }

    getRemovedArmorSlotsForCrack(defender, rolledSlot).forEach((removedSlot) => {
      if (removedSlotKeys.has(removedSlot.slotKey)) {
        return;
      }

      removedSlotKeys.add(removedSlot.slotKey);
      removedArmorSlots.push(removedSlot);
    });
  }

  return removedArmorSlots;
}

function getRemovedArmorSlotsForCrack(defender: FighterState, rolledSlot: CombatArmorSlotState): CombatArmorSlotState[] {
  return getArmorSlotRemovalKeys(rolledSlot.slotKey).flatMap((slotKey) => {
    const armorSlot = defender.armorSlots?.find((candidate) => candidate.slotKey === slotKey);

    if (armorSlot) {
      return [{ ...armorSlot }];
    }

    const itemId = defender.equipment?.[slotKey];
    if (!itemId) {
      return [];
    }

    return [
      {
        slotKey,
        itemId,
        label: itemId,
        armorHp: 0,
      },
    ];
  });
}

function getArmorSlotRemovalKeys(slotKey: HeroEquipmentSlotKey): readonly HeroEquipmentSlotKey[] {
  const pair = PAIRED_ARMOR_SLOT_KEYS.find(([left, right]) => left === slotKey || right === slotKey);

  return pair ?? [slotKey];
}

function hasCrackableArmorSlot(defender: FighterState): boolean {
  return getCrackableArmorSlots(defender).length > 0;
}

function getCrackableArmorSlots(defender: FighterState): CombatArmorSlotState[] {
  if (Math.max(0, defender.armor ?? 0) <= 0) {
    return [];
  }

  return (defender.armorSlots ?? []).filter((slot) => Math.max(0, Math.floor(slot.armorHp)) > 0);
}

function addActionLog(
  state: CombatState,
  actor: CombatActor,
  actorLabel: string,
  defenderLabel: string,
  action: ActionConfig,
  actionTitle: string,
  actionMove: number,
  damage: number,
  inRange: boolean,
  blocked: boolean,
  actionDistance: number,
  actorClinchRange: number,
  staminaRestore: number,
  heal: number,
): void {
  if (action.id === "scroll") {
    addLog(
      state,
      `${actorLabel} used ${actionTitle} and ${
        damage > 0 ? `cracked ${defenderLabel}'s armor for ${damage}` : "found no armor to crack"
      }.`,
      damage >= 10,
    );
    return;
  }

  if (action.id === "ward") {
    addLog(state, `${actorLabel} used ${actionTitle}. The next hit will be absorbed.`, true);
    return;
  }

  if (action.id === "preciseStrike") {
    addLog(state, `${actorLabel} used ${actionTitle}. The next ${PRECISE_STRIKE_HITS} strikes are focused.`, true);
    return;
  }

  if (action.id === "doubleStrike") {
    addLog(state, `${actorLabel} used ${actionTitle}. The next strike will hit twice.`, true);
    return;
  }

  if (action.id === "poison") {
    addLog(state, `${actorLabel} used ${actionTitle}. ${defenderLabel} is poisoned.`, true);
    return;
  }

  const wardAbsorbed = actor === "player" ? state.lastPlayerWardAbsorbed : actor === "helper" ? state.lastHelperWardAbsorbed : state.lastEnemyWardAbsorbed;

  if (wardAbsorbed) {
    addLog(state, `${actorLabel} used ${actionTitle}, but the ward absorbed it.`, true);
    return;
  }

  if (actionMove && action.damage) {
    addLog(
      state,
      `${actorLabel} used ${actionTitle}, rushed to ${distanceLabel(actionDistance, actorClinchRange)}, and ${
        blocked ? `${defenderLabel} blocked it` : damage > 0 ? `hit ${defenderLabel} for ${damage}` : "came up short"
      }.`,
      damage >= 4,
    );
    return;
  }

  if (actionMove) {
    addLog(state, `${actorLabel} used ${actionTitle}. Distance is now ${distanceLabel(actionDistance, actorClinchRange)}.`);
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
    addLog(state, `${actorLabel} used ${actionTitle} and switched to ${actionTitle === "Draw Bow" ? "bow" : "melee"}.`);
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

function isScrollAction(actionId: ActionId): boolean {
  return (
    actionId === "scroll" ||
    actionId === "fireball" ||
    actionId === "ward" ||
    actionId === "preciseStrike" ||
    actionId === "doubleStrike" ||
    actionId === "poison"
  );
}

function isPreciseStrikeAction(actionId: ActionId): boolean {
  return isAttackAction(actionId) || actionId === "lunge";
}

function isPreciseStrikeBoostedAction(actionId: ActionId, attacker?: FighterState): boolean {
  return Boolean(attacker && isPreciseStrikeAction(actionId) && getFighterPreciseStrikeHits(attacker) > 0);
}

function shouldConsumePreciseStrikeForAction(actionId: ActionId, attacker: FighterState): boolean {
  return isPreciseStrikeBoostedAction(actionId, attacker);
}

function consumePreciseStrikeHit(fighter: FighterState): void {
  fighter.preciseStrikeHits = Math.max(0, getFighterPreciseStrikeHits(fighter) - 1);
}

function isDoubleStrikeAction(actionId: ActionId): boolean {
  return isAttackAction(actionId);
}

function isDoubleStrikeBoostedAction(actionId: ActionId, attacker?: FighterState): boolean {
  return Boolean(attacker && isDoubleStrikeAction(actionId) && getFighterDoubleStrikeHits(attacker) > 0);
}

function shouldConsumeDoubleStrikeForAction(actionId: ActionId, attacker: FighterState, damage: number, inRange: boolean): boolean {
  return isDoubleStrikeBoostedAction(actionId, attacker) && damage > 0 && inRange;
}

function canResolveDoubleStrikeRepeat(actionId: ActionId, attacker: FighterState): boolean {
  return !isBowFighter(attacker) || (isAttackAction(actionId) && getBowShotsRemaining(attacker) > 0);
}

function consumeDoubleStrikeRepeatCost(actionId: ActionId, attacker: FighterState): void {
  if (isAttackAction(actionId) && isBowFighter(attacker)) {
    attacker.bowShotsRemaining = Math.max(0, getBowShotsRemaining(attacker) - 1);
  }
}

function getDoubleStrikeRepeatDamage(baseDamage: number, attacker: FighterState): number {
  const damage = Math.max(0, Math.floor(baseDamage));

  if (damage <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(damage * getFighterDoubleStrikeDamageMultiplier(attacker)));
}

function consumeDoubleStrikeHit(fighter: FighterState): void {
  fighter.doubleStrikeHits = Math.max(0, getFighterDoubleStrikeHits(fighter) - 1);
}

function finishBattle(state: CombatState): void {
  const playerName = state.player.name;
  const helperName = state.helper?.name ?? "Ally";
  const enemyName = state.enemy.name;
  const allAlliesDefeated = areAllAlliesDefeated(state);

  if (state.enemy.hp <= 0 && allAlliesDefeated) {
    state.result = "draw";
    state.score += 250;
    addLog(state, "The last fighters collapse together. The crowd calls it art.", true);
    return;
  }

  if (state.enemy.hp <= 0) {
    const survivorName = state.player.hp > 0 ? playerName : helperName;
    const survivorHp = Math.max(0, state.player.hp > 0 ? state.player.hp : (state.helper?.hp ?? 0));

    state.result = "win";
    state.score += 1000 + survivorHp * 40;
    addLog(state, `Victory! ${survivorName} keeps the allied side standing.`, true);
    return;
  }

  if (allAlliesDefeated) {
    state.result = "lose";
    addLog(state, `Defeat. ${enemyName} wins and immediately starts posing at the wrong crowd.`, true);
  }
}

function clampActionMoveToContactRange(
  state: CombatState,
  actionId: ActionId,
  attacker: FighterState,
  actor: CombatActor,
  distanceDelta: number,
  defenderActor = getDefaultDefenderActor(state, actor),
): number {
  if (actionId !== "lunge" || !isSpearFighter(attacker) || distanceDelta >= 0) {
    return distanceDelta;
  }

  const actorDistance = getActorDistance(state, actor, defenderActor);
  const contactDistance = getFighterClinchRange(attacker);
  const targetDistance = roundCombatDistance(actorDistance + distanceDelta);

  if (targetDistance >= contactDistance) {
    return distanceDelta;
  }

  return Math.min(0, roundCombatDistance(contactDistance - actorDistance));
}

function moveActor(state: CombatState, actor: CombatActor, distanceDelta: number, defenderActor = getDefaultDefenderActor(state, actor)): void {
  const currentDistance = getActorDistance(state, actor, defenderActor);
  const nextDistance = roundCombatDistance(clamp(currentDistance + distanceDelta, MIN_DISTANCE, MAX_DISTANCE));
  const actualDistanceDelta = roundCombatDistance(nextDistance - currentDistance);

  if (actualDistanceDelta === 0) {
    return;
  }

  if (actor === "player") {
    state.playerPosition = Math.min(state.playerPosition - actualDistanceDelta, state.enemyPosition);
  } else if (actor === "helper") {
    state.helperPosition = Math.min((state.helperPosition ?? state.playerPosition) - actualDistanceDelta, state.enemyPosition);
  } else {
    state.enemyPosition = Math.max(state.enemyPosition + actualDistanceDelta, getClosestAlliedPosition(state));
  }

  syncSharedCombatDistance(state);
}

function addRestDefensePenalty(state: CombatState, actor: CombatActor, value: number): void {
  if (actor === "player") {
    state.playerRestDefensePenalty = Math.max(state.playerRestDefensePenalty, value);
  } else if (actor === "helper") {
    state.helperRestDefensePenalty = Math.max(state.helperRestDefensePenalty, value);
  } else {
    state.enemyRestDefensePenalty = Math.max(state.enemyRestDefensePenalty, value);
  }
}

function getRestDefensePenalty(state: CombatState, actor: CombatActor): number {
  if (actor === "player") {
    return state.playerRestDefensePenalty;
  }

  if (actor === "helper") {
    return state.helperRestDefensePenalty;
  }

  return state.enemyRestDefensePenalty;
}

function clearRestDefensePenalty(state: CombatState, actor: CombatActor): void {
  if (actor === "player") {
    state.playerRestDefensePenalty = 0;
  } else if (actor === "helper") {
    state.helperRestDefensePenalty = 0;
  } else {
    state.enemyRestDefensePenalty = 0;
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
