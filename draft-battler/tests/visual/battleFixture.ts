import {
  createBattleTimeline,
  resolveCombat,
  type BattleTimeline,
  type BoardSlot,
  type CardId,
} from "../../src/game/index";

/** A deterministic full board using the same combat and timeline as the game. */
export function createVisualBattleFixture() {
  const playerSlots = createBoard([
    "night_warden", "ironhide_bear", "phantom_duelist",
    "battle_alchemist", "moon_priestess", "grave_binder",
  ]);
  const enemySlots = createBoard([
    "bronze_minotaur", "war_mastiff", "plague_rat",
    "frost_wraith", "field_cleric", "siege_engineer",
  ]);
  const combat = resolveCombat(playerSlots, enemySlots, 8);
  const timeline = createBattleTimeline({
    playerSlots,
    enemySlots,
    combat,
    playerCastleHpBefore: 20,
    playerCastleHpAfter: Math.max(0, 20 - combat.playerCastleDamage),
    enemyCastleHpBefore: 20,
    enemyCastleHpAfter: Math.max(0, 20 - combat.enemyCastleDamage),
  });
  return { playerSlots, enemySlots, combat, timeline };
}

/** Real start buffs and approach stay intact; 250 ticks add 15 seconds at x1. */
export function holdVisualBattleFormation(timeline: BattleTimeline): BattleTimeline {
  return {
    ...timeline,
    events: timeline.events.map((event) => {
      if (event.time === 0) return event;
      return event.type === "combat_step"
        ? { ...event, time: event.time + 250, events: event.events.map((step) => ({ ...step, time: step.time + 250 })) }
        : { ...event, time: event.time + 250 };
    }),
  };
}

function createBoard(cards: readonly CardId[]): BoardSlot[] {
  return cards.map((cardId, slotIndex) => ({ cardId, slotIndex, upgradeLevel: 0 }));
}
