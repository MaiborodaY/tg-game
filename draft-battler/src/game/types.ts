export const PLAYER_STARTING_HP = 20;
export const MAX_RUN_ROUNDS = 10;
export const BOARD_SLOT_COUNT = 6;
export const DRAFT_OPTION_COUNT = 3;
export const MAX_UPGRADE_LEVEL = 1;
export const UPGRADE_STAT_MULTIPLIER = 2;

export type Owner = "player" | "enemy";

export type UnitRole = "tank" | "striker" | "ranged" | "caster" | "support";

export type UnitTag = "warrior" | "beast" | "mage" | "undead" | "rogue" | "guardian";

export type AbilityId =
  | "none"
  | "shield_wall"
  | "bulwark"
  | "battle_banner"
  | "charge"
  | "backstab"
  | "snipe"
  | "fireball"
  | "frost_hex"
  | "bone_pact"
  | "heal_ally"
  | "heal_only"
  | "pack_hunter"
  | "thorn_guard"
  | "stone_skin"
  | "pyro_splash"
  | "riposte";

export type CardId =
  | "iron_guard"
  | "shieldbearer"
  | "boar_rider"
  | "sneakblade"
  | "spear_recruit"
  | "longbow_hunter"
  | "ember_mage"
  | "frost_acolyte"
  | "grave_binder"
  | "bone_soldier"
  | "witch_doctor"
  | "field_cleric"
  | "wolfhound"
  | "thorn_druid"
  | "stone_golem"
  | "pyromancer"
  | "duelist"
  | "banner_knight";

export interface UnitStats {
  attack: number;
  hp: number;
  speed: number;
  range: 1 | 2 | 3;
}

export interface CardDefinition {
  id: CardId;
  name: string;
  role: UnitRole;
  tags: UnitTag[];
  tier: 1 | 2 | 3;
  stats: UnitStats;
  abilityId: AbilityId;
  cardText?: string;
  summary: string;
}

export interface BoardSlot {
  slotIndex: number;
  cardId: CardId | null;
  upgradeLevel: 0 | 1;
}

export interface DraftOption {
  optionId: string;
  cardId: CardId;
}

export interface CombatUnit {
  instanceId: string;
  owner: Owner;
  cardId: CardId;
  name: string;
  role: UnitRole;
  tags: UnitTag[];
  abilityId: AbilityId;
  slotIndex: number;
  upgradeLevel: BoardSlot["upgradeLevel"];
  attack: number;
  maxHp: number;
  hp: number;
  speed: number;
  range: 1 | 2 | 3;
  shield: number;
  acted: number;
  summonedBy?: string;
}

export type CombatWinner = "player" | "enemy" | "draw";

type CombatEventPayload =
  | { type: "combat_started"; playerUnits: string[]; enemyUnits: string[] }
  | { type: "synergy_applied"; owner: Owner; tag: UnitTag; unitIds: string[]; attackBonus?: number; hpBonus?: number }
  | { type: "unit_spawned"; unit: CombatUnit }
  | { type: "unit_buffed"; unitId: string; attackDelta?: number; hpDelta?: number; shieldDelta?: number; source: string }
  | { type: "unit_attacked"; attackerId: string; targetId: string; abilityId: AbilityId; damage: number }
  | { type: "unit_blocked"; unitId: string; attackerId: string; amount: number }
  | { type: "unit_damaged"; unitId: string; amount: number; remainingHp: number; shieldAbsorbed: number }
  | { type: "unit_healed"; unitId: string; amount: number; remainingHp: number; source: string }
  | { type: "unit_died"; unitId: string; killerId?: string }
  | { type: "combat_finished"; winner: CombatWinner; hpLoss: number; actions: number };

export type CombatEvent = CombatEventPayload & { time: number };

export interface CombatResult {
  winner: CombatWinner;
  hpLoss: number;
  actions: number;
  events: CombatEvent[];
  survivingPlayerUnits: CombatUnit[];
  survivingEnemyUnits: CombatUnit[];
}

export interface RoundRecord {
  round: number;
  playerHpBefore: number;
  playerHpAfter: number;
  draftOptions: DraftOption[];
  draftRerollCount: number;
  playerSlots: BoardSlot[];
  enemySlots: BoardSlot[];
  combatResult: CombatResult;
}

export type RunStatus = "draft" | "combat_ready" | "finished";

export interface RunState {
  seed: string;
  round: number;
  playerHp: number;
  status: RunStatus;
  draftOptions: DraftOption[];
  draftRerollCount: number;
  boardSlots: BoardSlot[];
  enemyBoardSlots: BoardSlot[];
  roundHistory: RoundRecord[];
}
