import { getCardDefinition } from "./cards";
import { applyDraftSelectionToBoard, chooseDraftCards, createRun, resolveRound } from "./run";
import {
  type CardDefinition,
  type CardId,
  type CombatResult,
  type DraftOption,
  type RoundRecord,
  type RunState,
  type UnitRole,
  type UnitStats,
  type UnitTag,
} from "./types";

export type DebugPickStrategyId = "highestPower" | "balanced" | "synergy";

export type DebugPickStrategy = (state: RunState) => readonly CardId[];

export interface DebugRunOptions {
  seed?: string;
  strategy?: DebugPickStrategyId | DebugPickStrategy;
  maxRounds?: number;
}

export interface DebugCardSnapshot {
  id: CardId;
  name: string;
  role: UnitRole;
  tags: UnitTag[];
  tier: CardDefinition["tier"];
  stats: UnitStats;
  abilityId: CardDefinition["abilityId"];
  powerScore: number;
}

export interface DebugCombatSummary {
  winner: CombatResult["winner"];
  hpLoss: number;
  actions: number;
  eventCounts: Record<string, number>;
  attackSamples: string[];
  deaths: string[];
  damageByTarget: Record<string, number>;
}

export interface DebugRoundReport {
  round: number;
  playerHpBefore: number;
  playerHpAfter: number;
  draftOptions: DebugCardSnapshot[];
  draftRerollCount: number;
  selectedCards: DebugCardSnapshot[];
  enemyCards: DebugCardSnapshot[];
  combat: DebugCombatSummary;
}

export interface DebugRunReport {
  seed: string;
  strategy: string;
  finalStatus: RunState["status"];
  finalHp: number;
  rounds: DebugRoundReport[];
}

export const DEBUG_PICK_STRATEGIES: Readonly<Record<DebugPickStrategyId, DebugPickStrategy>> = {
  highestPower: pickHighestPowerCards,
  balanced: pickBalancedCards,
  synergy: pickSynergyCards,
};

export function simulateDebugRun(options: DebugRunOptions = {}): DebugRunReport {
  const seed = options.seed ?? "debug-seed-001";
  const { strategy, strategyName } = resolvePickStrategy(options.strategy);
  const maxRounds = options.maxRounds ?? Number.POSITIVE_INFINITY;
  const rounds: DebugRoundReport[] = [];
  let state = createRun(seed);

  while (state.status !== "finished" && rounds.length < maxRounds) {
    const selection = sanitizeSelection(strategy(state), state);
    const combatReadyState = chooseDraftCards(state, applyDraftSelectionToBoard(state, selection));
    const nextState = resolveRound(combatReadyState);
    const roundRecord = getLatestRoundRecord(nextState);

    if (!roundRecord) {
      throw new Error("Expected round history after resolving a round.");
    }

    rounds.push(createRoundReport(roundRecord));
    state = nextState;
  }

  return {
    seed,
    strategy: strategyName,
    finalStatus: state.status,
    finalHp: state.playerHp,
    rounds,
  };
}

export function formatDebugRunReport(report: DebugRunReport): string {
  const lines = [
    `Draft Battler debug run`,
    `Seed: ${report.seed}`,
    `Strategy: ${report.strategy}`,
    `Final: ${report.finalStatus}, HP ${report.finalHp}`,
    "",
  ];

  for (const round of report.rounds) {
    lines.push(`Round ${round.round}: HP ${round.playerHpBefore} -> ${round.playerHpAfter}`);
    lines.push(`  Cards: ${formatCards(round.draftOptions)}${round.draftRerollCount > 0 ? ` (rerolls ${round.draftRerollCount})` : ""}`);
    lines.push(`  Pick:  ${formatCards(round.selectedCards)}`);
    lines.push(`  Enemy: ${formatCards(round.enemyCards)}`);
    lines.push(
      `  Combat: ${round.combat.winner}, HP loss ${round.combat.hpLoss}, actions ${round.combat.actions}`,
    );
    lines.push(`  Events: ${formatEventCounts(round.combat.eventCounts)}`);

    if (round.combat.deaths.length > 0) {
      lines.push(`  Deaths: ${round.combat.deaths.join(", ")}`);
    }

    if (round.combat.attackSamples.length > 0) {
      lines.push(`  First attacks: ${round.combat.attackSamples.join(" | ")}`);
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function pickHighestPowerCards(state: RunState): CardId[] {
  const option = sortDraftOptionsByScore(state.draftOptions)[0];

  return option ? [option.cardId] : [];
}

export function pickBalancedCards(state: RunState): CardId[] {
  const rolePriority: UnitRole[] = ["tank", "striker", "ranged", "caster", "support"];
  const rankedOptions = sortDraftOptionsByScore(state.draftOptions);

  const candidate =
    rolePriority
      .map((role) => rankedOptions.find((option) => getCardDefinition(option.cardId).role === role))
      .find((option): option is DraftOption => option !== undefined) ?? rankedOptions[0];

  return candidate ? [candidate.cardId] : [];
}

export function pickSynergyCards(state: RunState): CardId[] {
  const existingCards = state.boardSlots.flatMap((slot) => (slot.cardId ? [slot.cardId] : []));
  const rankedOptions = [...state.draftOptions].sort((left, right) => {
    const leftScore = scoreTeam([...existingCards, left.cardId]);
    const rightScore = scoreTeam([...existingCards, right.cardId]);

    return rightScore - leftScore || left.cardId.localeCompare(right.cardId);
  });
  const option = rankedOptions[0];

  return option ? [option.cardId] : pickHighestPowerCards(state);
}

export function getCardPowerScore(card: CardDefinition): number {
  const abilityScore = getAbilityScore(card.abilityId);
  const roleScore = getRoleScore(card.role);

  return (
    card.stats.attack * 2.2 +
    card.stats.hp * 0.75 +
    card.stats.speed * 0.45 +
    card.stats.range * 0.5 +
    card.tier * 1.5 +
    abilityScore +
    roleScore
  );
}

function resolvePickStrategy(strategy: DebugRunOptions["strategy"]): { strategy: DebugPickStrategy; strategyName: string } {
  if (!strategy) {
    return { strategy: DEBUG_PICK_STRATEGIES.synergy, strategyName: "synergy" };
  }

  if (typeof strategy === "function") {
    return { strategy, strategyName: "custom" };
  }

  return { strategy: DEBUG_PICK_STRATEGIES[strategy], strategyName: strategy };
}

function sanitizeSelection(selection: readonly CardId[], state: RunState): CardId[] {
  const allowedCardIds = new Set(state.draftOptions.map((option) => option.cardId));
  const cardId = selection.find((selectedCardId) => allowedCardIds.has(selectedCardId));

  return cardId ? [cardId] : pickHighestPowerCards(state);
}

function createRoundReport(roundRecord: RoundRecord): DebugRoundReport {
  return {
    round: roundRecord.round,
    playerHpBefore: roundRecord.playerHpBefore,
    playerHpAfter: roundRecord.playerHpAfter,
    draftOptions: roundRecord.draftOptions.map((option) => createCardSnapshot(option.cardId)),
    draftRerollCount: roundRecord.draftRerollCount,
    selectedCards: roundRecord.playerSlots.flatMap((slot) => (slot.cardId ? [createCardSnapshot(slot.cardId)] : [])),
    enemyCards: roundRecord.enemySlots.flatMap((slot) => (slot.cardId ? [createCardSnapshot(slot.cardId)] : [])),
    combat: summarizeCombat(roundRecord.combatResult),
  };
}

function getLatestRoundRecord(state: RunState): RoundRecord | undefined {
  return state.roundHistory[state.roundHistory.length - 1];
}

function createCardSnapshot(cardId: CardId): DebugCardSnapshot {
  const card = getCardDefinition(cardId);

  return {
    id: card.id,
    name: card.name,
    role: card.role,
    tags: [...card.tags],
    tier: card.tier,
    stats: { ...card.stats },
    abilityId: card.abilityId,
    powerScore: roundScore(getCardPowerScore(card)),
  };
}

function summarizeCombat(combatResult: CombatResult): DebugCombatSummary {
  const eventCounts: Record<string, number> = {};
  const attackSamples: string[] = [];
  const deaths: string[] = [];
  const damageByTarget: Record<string, number> = {};

  for (const event of combatResult.events) {
    eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;

    if (event.type === "unit_attacked" && attackSamples.length < 8) {
      attackSamples.push(`${event.attackerId}->${event.targetId}:${event.damage}/${event.abilityId}`);
    }

    if (event.type === "unit_died") {
      deaths.push(event.unitId);
    }

    if (event.type === "unit_damaged") {
      damageByTarget[event.unitId] = (damageByTarget[event.unitId] ?? 0) + event.amount;
    }
  }

  return {
    winner: combatResult.winner,
    hpLoss: combatResult.hpLoss,
    actions: combatResult.actions,
    eventCounts,
    attackSamples,
    deaths,
    damageByTarget,
  };
}

function sortDraftOptionsByScore(options: readonly DraftOption[]): DraftOption[] {
  return [...options].sort(
    (left, right) =>
      getCardPowerScore(getCardDefinition(right.cardId)) - getCardPowerScore(getCardDefinition(left.cardId)) ||
      left.cardId.localeCompare(right.cardId),
  );
}

function scoreTeam(cardIds: readonly CardId[]): number {
  const cards = cardIds.map(getCardDefinition);
  const tagCounts = new Map<UnitTag, number>();
  const roleCounts = new Map<UnitRole, number>();
  let score = cards.reduce((total, card) => total + getCardPowerScore(card), 0);

  for (const card of cards) {
    roleCounts.set(card.role, (roleCounts.get(card.role) ?? 0) + 1);
    for (const tag of card.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  for (const count of tagCounts.values()) {
    if (count >= 2) {
      score += 5 + count;
    }
  }

  if ((roleCounts.get("tank") ?? 0) >= 1) {
    score += 2;
  }

  if ((roleCounts.get("striker") ?? 0) + (roleCounts.get("ranged") ?? 0) + (roleCounts.get("caster") ?? 0) >= 2) {
    score += 2;
  }

  if ((roleCounts.get("support") ?? 0) >= 1) {
    score += 1;
  }

  return score;
}

function getAbilityScore(abilityId: CardDefinition["abilityId"]): number {
  switch (abilityId) {
    case "none":
      return 0;
    case "shield_wall":
    case "bulwark":
    case "heal_ally":
    case "heal_only":
    case "charge":
      return 2;
    case "battle_banner":
    case "thorn_guard":
    case "fireball":
    case "backstab":
    case "snipe":
      return 3;
    case "frost_hex":
    case "bone_pact":
    case "pack_hunter":
    case "stone_skin":
    case "pyro_splash":
    case "riposte":
      return 4;
  }
}

function getRoleScore(role: UnitRole): number {
  switch (role) {
    case "tank":
      return 1.5;
    case "striker":
      return 1.25;
    case "ranged":
    case "caster":
      return 1;
    case "support":
      return 0.75;
  }
}

function formatCards(cards: readonly DebugCardSnapshot[]): string {
  if (cards.length === 0) {
    return "none";
  }

  return cards
    .map(
      (card) =>
        `${card.name}[${card.role}, t${card.tier}, ${card.tags.join("+")}, ${card.stats.attack}/${card.stats.hp}/${card.stats.speed}, ${card.abilityId}, ${card.powerScore}]`,
    )
    .join("; ");
}

function formatEventCounts(eventCounts: Record<string, number>): string {
  return Object.entries(eventCounts)
    .map(([type, count]) => `${type}:${count}`)
    .join(", ");
}

function roundScore(score: number): number {
  return Math.round(score * 10) / 10;
}
