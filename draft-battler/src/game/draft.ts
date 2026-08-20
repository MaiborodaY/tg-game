import { CARD_DEFINITIONS, getCardStatsForUpgrade } from "./cards";
import { applyDraftPlacement, classifyDraftPlacement, type DraftPlacementClassification } from "./placement";
import { SeededRandom } from "./random";
import {
  BOARD_SLOT_COUNT,
  DRAFT_OPTION_COUNT,
  MAX_UPGRADE_LEVEL,
  type BoardSlot,
  type BotDifficulty,
  type CardDefinition,
  type CardId,
  type DraftOption,
} from "./types";

const FIRST_ROUND_HIDDEN_CARD_IDS = new Set<CardId>(["field_cleric", "shieldbearer"]);
const INCUMBENT_DRAFT_WEIGHT_MULTIPLIER = 3;

export interface EnemyDraftResult {
  draftOptions: DraftOption[];
  pickedCardId: CardId;
  targetSlotIndex: number;
  boardSlots: BoardSlot[];
}

export function createEmptyBoardSlots(): BoardSlot[] {
  return Array.from({ length: BOARD_SLOT_COUNT }, (_, slotIndex) => ({ slotIndex, cardId: null, upgradeLevel: 0 }));
}

export function cloneBoardSlots(slots: readonly BoardSlot[]): BoardSlot[] {
  return createEmptyBoardSlots().map((emptySlot) => {
    const sourceSlot = slots.find((slot) => slot.slotIndex === emptySlot.slotIndex);

    if (!sourceSlot) {
      return emptySlot;
    }

    return {
      slotIndex: emptySlot.slotIndex,
      cardId: sourceSlot.cardId,
      upgradeLevel: sourceSlot.cardId ? normalizeUpgradeLevel(sourceSlot.upgradeLevel) : 0,
    };
  });
}

export function getBoardCapacityForRound(_round: number): number {
  return BOARD_SLOT_COUNT;
}

export function createDraftOptions(
  seed: string,
  round: number,
  rerollCount = 0,
  incumbentSlots: readonly BoardSlot[] = [],
): DraftOption[] {
  const rng = new SeededRandom(`${seed}:draft:${round}:${rerollCount}`);
  const weightedPool = createWeightedDraftPool(round, incumbentSlots);
  const options: DraftOption[] = [];
  const used = new Set<string>();

  while (options.length < DRAFT_OPTION_COUNT && used.size < CARD_DEFINITIONS.length) {
    const card = rng.pick(weightedPool);

    if (used.has(card.id)) {
      continue;
    }

    used.add(card.id);
    options.push({
      optionId: `r${round}-rr${rerollCount}-o${options.length + 1}`,
      cardId: card.id,
    });
  }

  return options;
}

export function createEnemyDraftOptions(
  seed: string,
  round: number,
  incumbentSlots: readonly BoardSlot[] = [],
): DraftOption[] {
  return createDraftOptions(`${seed}:enemy`, round, 0, incumbentSlots);
}

export function createBoardFromSlots(slots: readonly BoardSlot[], capacity: number): BoardSlot[] {
  const normalizedSlots = cloneBoardSlots(slots);

  normalizedSlots.forEach((slot) => {
    if (slot.cardId && slot.slotIndex >= capacity) {
      throw new Error(`Slot ${slot.slotIndex + 1} is outside board capacity.`);
    }

    if (slot.cardId && !isCardAllowedInSlot(slot.cardId, slot.slotIndex)) {
      throw new Error(`${slot.cardId} cannot be placed in slot ${slot.slotIndex + 1}.`);
    }
  });

  return normalizedSlots;
}

export function createEnemyBoardSlots(
  seed: string,
  round: number,
  botDifficulty: BotDifficulty = "standard",
): BoardSlot[] {
  let boardSlots = createEmptyBoardSlots();

  for (let currentRound = 1; currentRound <= round; currentRound += 1) {
    boardSlots = advanceEnemyBoardSlots(seed, currentRound, boardSlots, botDifficulty).boardSlots;
  }

  return boardSlots;
}

export function advanceEnemyBoardSlots(
  seed: string,
  round: number,
  previousSlots: readonly BoardSlot[],
  botDifficulty: BotDifficulty = "standard",
): EnemyDraftResult {
  const capacity = getBoardCapacityForRound(round);
  const boardSlots = createBoardFromSlots(previousSlots, capacity);
  const draftOptions = createEnemyDraftOptions(seed, round, boardSlots);
  const createCandidates = (option: DraftOption) => boardSlots
    .filter((slot) => slot.slotIndex < capacity)
    .flatMap((slot) => {
      const placement = classifyDraftPlacement(boardSlots, option.cardId, slot.slotIndex);
      if (placement.kind === "invalid") {
        return [];
      }

      const result = applyDraftPlacement(boardSlots, option.cardId, slot.slotIndex, { allowReplacement: true });
      if (!result.applied) {
        return [];
      }

      return [{
        cardId: option.cardId,
        targetSlotIndex: slot.slotIndex,
        placement,
        boardSlots: result.boardSlots,
        score: scoreEnemyBoard(result.boardSlots, placement),
      }];
    });
  const compareCandidates = (
    left: ReturnType<typeof createCandidates>[number],
    right: ReturnType<typeof createCandidates>[number],
  ) => right.score - left.score ||
    left.targetSlotIndex - right.targetSlotIndex ||
    left.cardId.localeCompare(right.cardId);

  // Standard deliberately preserves the original first-legal-card policy. Strong remains fair:
  // it sees the same three offers, but evaluates every legal card and position before choosing.
  const candidates = botDifficulty === "strong"
    ? draftOptions.flatMap(createCandidates).sort(compareCandidates)
    : new SeededRandom(`${seed}:enemy-pick:${round}`)
      .shuffle(draftOptions)
      .map(createCandidates)
      .find((optionCandidates) => optionCandidates.length > 0)
      ?.sort(compareCandidates) ?? [];

  const choice = candidates[0];
  if (!choice) {
    throw new Error(`Enemy has no legal draft placement in round ${round}.`);
  }

  return {
    draftOptions: draftOptions.map((option) => ({ ...option })),
    pickedCardId: choice.cardId,
    targetSlotIndex: choice.targetSlotIndex,
    boardSlots: choice.boardSlots,
  };
}

export function isFrontRowSlot(slotIndex: number): boolean {
  return slotIndex >= 0 && slotIndex < 3;
}

export function isFrontRowOnlyCard(cardId: CardId): boolean {
  return cardId === "shieldbearer";
}

export function isCardAllowedInSlot(cardId: CardId, slotIndex: number): boolean {
  return !isFrontRowOnlyCard(cardId) || isFrontRowSlot(slotIndex);
}

function scoreEnemyBoard(slots: readonly BoardSlot[], placement: DraftPlacementClassification): number {
  let score = placement.kind === "upgrade" ? 12 : 0;
  const tagCounts = new Map<string, number>();

  slots.forEach((slot) => {
    if (!slot.cardId) {
      return;
    }

    const card = CARD_DEFINITIONS.find((candidate) => candidate.id === slot.cardId);
    if (!card) {
      return;
    }

    const stats = getCardStatsForUpgrade(card, slot.upgradeLevel);
    score += stats.attack * 6 + stats.hp * 2 + stats.speed + stats.range * 2 + card.tier * 4;
    score += getAbilityDraftScore(card.abilityId);
    score += getRolePositionScore(card, slot.slotIndex);
    card.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  });

  tagCounts.forEach((count) => {
    if (count >= 2) {
      score += count * 5;
    }
  });

  return score;
}

function getAbilityDraftScore(abilityId: CardDefinition["abilityId"]): number {
  if (abilityId === "bulwark" || abilityId === "battle_banner" || abilityId === "thorn_guard") {
    return 12;
  }

  if (abilityId === "heal_ally" || abilityId === "heal_only" || abilityId === "stone_skin") {
    return 9;
  }

  if (abilityId === "fireball" || abilityId === "pyro_splash" || abilityId === "bone_pact") {
    return 7;
  }

  return abilityId === "none" ? 0 : 4;
}

function getRolePositionScore(card: CardDefinition, slotIndex: number): number {
  const frontRow = isFrontRowSlot(slotIndex);
  if (card.role === "tank") {
    return frontRow ? 5 : -3;
  }

  if (card.role === "ranged" || card.role === "caster" || card.role === "support") {
    return frontRow ? -2 : 4;
  }

  return frontRow ? 2 : 0;
}

function normalizeUpgradeLevel(upgradeLevel: BoardSlot["upgradeLevel"]): BoardSlot["upgradeLevel"] {
  return upgradeLevel >= MAX_UPGRADE_LEVEL ? MAX_UPGRADE_LEVEL : 0;
}

function createWeightedDraftPool(round: number, incumbentSlots: readonly BoardSlot[]): CardDefinition[] {
  const pool: CardDefinition[] = [];
  const incumbentCardIds = new Set(
    incumbentSlots.flatMap((slot) => slot.cardId ? [slot.cardId] : []),
  );

  CARD_DEFINITIONS.forEach((card) => {
    if (!isCardAvailableForRound(card, round)) {
      return;
    }

    const incumbentMultiplier = incumbentCardIds.has(card.id) ? INCUMBENT_DRAFT_WEIGHT_MULTIPLIER : 1;
    const weight = getTierWeight(card.tier, round) * incumbentMultiplier;
    for (let count = 0; count < weight; count += 1) {
      pool.push(card);
    }
  });

  return pool;
}

function isCardAvailableForRound(card: CardDefinition, round: number): boolean {
  if (round <= 1 && FIRST_ROUND_HIDDEN_CARD_IDS.has(card.id)) {
    return false;
  }

  return card.tier <= getMaxTierForRound(round);
}

function getMaxTierForRound(round: number): 1 | 2 | 3 {
  if (round >= 7) {
    return 3;
  }

  if (round >= 4) {
    return 2;
  }

  return 1;
}

function getTierWeight(tier: CardDefinition["tier"], round: number): number {
  if (tier === 1) {
    return round >= 7 ? 2 : 5;
  }

  if (tier === 2) {
    return round >= 7 ? 4 : 2;
  }

  return 1;
}
