import assert from "node:assert/strict";
import test from "node:test";

import {
  SeededRandom,
  autoplayRun,
  getCardDefinition,
  getCardPowerScore,
  pickHighestPowerCards,
  pickSynergyCards,
} from "../src/game/index.ts";

const BALANCE_CORPUS_SIZE = 500;
// These bands guard whether a strategy remains viable under current rules, not historical combat outcomes.
const BALANCE_TARGETS = [
  {
    label: "highest-power deliberate play wins a clear majority without becoming automatic",
    strategy: pickHighestPowerCards,
    minimum: 0.75,
    maximum: 0.9,
  },
  {
    label: "synergy deliberate play wins a majority of symmetric matches",
    strategy: pickSynergyCards,
    minimum: 0.65,
    maximum: 0.85,
  },
  {
    label: "first-offer play can win but is punished by the drafting bot",
    strategy: pickFirstOffer,
    minimum: 0.3,
    maximum: 0.6,
  },
  {
    label: "deterministic random-pick play can win but is punished by the drafting bot",
    strategy: pickRandomOffer,
    minimum: 0.3,
    maximum: 0.6,
  },
  {
    label: "lowest-power play rarely beats the deterministic drafting bot",
    strategy: pickLowestPower,
    minimum: 0.05,
    maximum: 0.25,
  },
];

const STRONG_BALANCE_TARGETS = [
  {
    label: "highest-power deliberate play remains competitive against the strong bot",
    strategy: pickHighestPowerCards,
    minimum: 0.4,
    maximum: 0.6,
  },
  {
    label: "synergy play can beat the strong bot without becoming favored",
    strategy: pickSynergyCards,
    minimum: 0.25,
    maximum: 0.5,
  },
  {
    label: "first-offer play is heavily punished by the strong bot",
    strategy: pickFirstOffer,
    minimum: 0.05,
    maximum: 0.2,
  },
  {
    label: "random-pick play is heavily punished by the strong bot",
    strategy: pickRandomOffer,
    minimum: 0.05,
    maximum: 0.2,
  },
  {
    label: "lowest-power play only rarely beats the strong bot",
    strategy: pickLowestPower,
    minimum: 0,
    maximum: 0.08,
  },
];

for (const target of BALANCE_TARGETS) {
  test(`solo balance over ${BALANCE_CORPUS_SIZE} seeds: ${target.label}`, () => {
    let playerWins = 0;
    let draws = 0;

    for (let seedIndex = 0; seedIndex < BALANCE_CORPUS_SIZE; seedIndex += 1) {
      const state = autoplayRun(`balance-large-${seedIndex}`, target.strategy);

      if (state.outcome === "player") {
        playerWins += 1;
      }
      if (state.outcome === "draw") {
        draws += 1;
      }
    }

    const winRate = playerWins / BALANCE_CORPUS_SIZE;
    assert.ok(
      winRate >= target.minimum && winRate <= target.maximum,
      `${playerWins}/${BALANCE_CORPUS_SIZE} won (${formatPercent(winRate)}); ` +
        `expected ${formatPercent(target.minimum)}-${formatPercent(target.maximum)}.`,
    );
    assert.ok(draws / BALANCE_CORPUS_SIZE <= 0.02, `${draws}/${BALANCE_CORPUS_SIZE} draws exceeds 2%.`);
  });
}

for (const target of STRONG_BALANCE_TARGETS) {
  test(`strong bot balance over ${BALANCE_CORPUS_SIZE} seeds: ${target.label}`, () => {
    let playerWins = 0;
    let draws = 0;

    for (let seedIndex = 0; seedIndex < BALANCE_CORPUS_SIZE; seedIndex += 1) {
      const state = autoplayRun(`balance-large-${seedIndex}`, target.strategy, "strong");
      playerWins += state.outcome === "player" ? 1 : 0;
      draws += state.outcome === "draw" ? 1 : 0;
    }

    const winRate = playerWins / BALANCE_CORPUS_SIZE;
    assert.ok(
      winRate >= target.minimum && winRate <= target.maximum,
      `${playerWins}/${BALANCE_CORPUS_SIZE} won (${formatPercent(winRate)}); ` +
        `expected ${formatPercent(target.minimum)}-${formatPercent(target.maximum)}.`,
    );
    assert.ok(draws / BALANCE_CORPUS_SIZE <= 0.02, `${draws}/${BALANCE_CORPUS_SIZE} draws exceeds 2%.`);
  });
}

// These bands record the 42-card pool, shared 3x incumbent weighting, and actual-board tiered-synergy scoring.
const UPGRADE_RETENTION_TARGETS = [
  {
    label: "highest-power versus standard",
    strategy: pickHighestPowerCards,
    botDifficulty: "standard",
    anyUpgrade: [0.94, 0.99],
    averageUpgrades: [2.15, 2.5],
  },
  {
    label: "highest-power versus strong",
    strategy: pickHighestPowerCards,
    botDifficulty: "strong",
    anyUpgrade: [0.94, 0.99],
    averageUpgrades: [2.2, 2.55],
  },
  {
    label: "synergy versus standard",
    strategy: pickSynergyCards,
    botDifficulty: "standard",
    anyUpgrade: [0.89, 0.96],
    averageUpgrades: [2.15, 2.4],
  },
  {
    label: "synergy versus strong",
    strategy: pickSynergyCards,
    botDifficulty: "strong",
    anyUpgrade: [0.89, 0.96],
    averageUpgrades: [2.3, 2.6],
  },
];

for (const target of UPGRADE_RETENTION_TARGETS) {
  test(`draft upgrade retention over ${BALANCE_CORPUS_SIZE} seeds: ${target.label}`, () => {
    let runsWithUpgrade = 0;
    let finalUpgrades = 0;

    for (let seedIndex = 0; seedIndex < BALANCE_CORPUS_SIZE; seedIndex += 1) {
      const state = autoplayRun(`balance-large-${seedIndex}`, target.strategy, target.botDifficulty);
      const upgradedSlots = state.boardSlots.filter((slot) => slot.upgradeLevel === 1).length;
      runsWithUpgrade += upgradedSlots > 0 ? 1 : 0;
      finalUpgrades += upgradedSlots;
    }

    const anyUpgradeRate = runsWithUpgrade / BALANCE_CORPUS_SIZE;
    const averageFinalUpgrades = finalUpgrades / BALANCE_CORPUS_SIZE;
    assert.ok(
      anyUpgradeRate >= target.anyUpgrade[0] && anyUpgradeRate <= target.anyUpgrade[1],
      `${runsWithUpgrade}/${BALANCE_CORPUS_SIZE} runs retained an upgrade (${formatPercent(anyUpgradeRate)}); ` +
        `expected ${formatPercent(target.anyUpgrade[0])}-${formatPercent(target.anyUpgrade[1])}.`,
    );
    assert.ok(
      averageFinalUpgrades >= target.averageUpgrades[0] && averageFinalUpgrades <= target.averageUpgrades[1],
      `${averageFinalUpgrades.toFixed(3)} final upgrades per run; ` +
        `expected ${target.averageUpgrades[0]}-${target.averageUpgrades[1]}.`,
    );
  });
}

const SYNERGY_MASTERY_TARGETS = [
  {
    label: "standard",
    botDifficulty: "standard",
    anyMastery: [0.58, 0.72],
    finalMastery: [0.45, 0.6],
  },
  {
    label: "strong",
    botDifficulty: "strong",
    anyMastery: [0.6, 0.74],
    finalMastery: [0.45, 0.6],
  },
];

for (const target of SYNERGY_MASTERY_TARGETS) {
  test(`tier-four synergy retention over ${BALANCE_CORPUS_SIZE} seeds: deliberate synergy versus ${target.label}`, () => {
    let runsWithMastery = 0;
    let finalBoardsWithMastery = 0;

    for (let seedIndex = 0; seedIndex < BALANCE_CORPUS_SIZE; seedIndex += 1) {
      const state = autoplayRun(`balance-large-${seedIndex}`, pickSynergyCards, target.botDifficulty);
      runsWithMastery += state.roundHistory.some((record) => hasTierFourSynergy(record.playerSlots)) ? 1 : 0;
      finalBoardsWithMastery += hasTierFourSynergy(state.boardSlots) ? 1 : 0;
    }

    const anyMasteryRate = runsWithMastery / BALANCE_CORPUS_SIZE;
    const finalMasteryRate = finalBoardsWithMastery / BALANCE_CORPUS_SIZE;
    assert.ok(
      anyMasteryRate >= target.anyMastery[0] && anyMasteryRate <= target.anyMastery[1],
      `${runsWithMastery}/${BALANCE_CORPUS_SIZE} runs activated a tier-four synergy (${formatPercent(anyMasteryRate)}); ` +
        `expected ${formatPercent(target.anyMastery[0])}-${formatPercent(target.anyMastery[1])}.`,
    );
    assert.ok(
      finalMasteryRate >= target.finalMastery[0] && finalMasteryRate <= target.finalMastery[1],
      `${finalBoardsWithMastery}/${BALANCE_CORPUS_SIZE} final boards retained a tier-four synergy ` +
        `(${formatPercent(finalMasteryRate)}); expected ${formatPercent(target.finalMastery[0])}-` +
        `${formatPercent(target.finalMastery[1])}.`,
    );
  });
}

function hasTierFourSynergy(slots) {
  const tagCounts = new Map();
  slots.forEach((slot) => {
    if (!slot.cardId) {
      return;
    }

    getCardDefinition(slot.cardId).tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    });
  });

  return [...tagCounts.values()].some((count) => count >= 4);
}

test(`solo balance over ${BALANCE_CORPUS_SIZE} seeds: r7/r8 do not become a first/random defeat cliff`, () => {
  for (const [label, strategy] of [
    ["first-offer", pickFirstOffer],
    ["random-pick", pickRandomOffer],
  ]) {
    const defeatsByRound = new Map();
    let defeats = 0;

    for (let seedIndex = 0; seedIndex < BALANCE_CORPUS_SIZE; seedIndex += 1) {
      const state = autoplayRun(`balance-large-${seedIndex}`, strategy);

      if (state.outcome !== "enemy") {
        continue;
      }

      const defeatRound = state.round;
      defeats += 1;
      defeatsByRound.set(defeatRound, (defeatsByRound.get(defeatRound) ?? 0) + 1);
    }

    for (const round of [7, 8]) {
      const share = (defeatsByRound.get(round) ?? 0) / defeats;
      assert.ok(share <= 0.3, `${label} has ${formatPercent(share)} of defeats concentrated in round ${round}.`);
    }
  }
});

test(`solo balance over ${BALANCE_CORPUS_SIZE} seeds: the five-round extension is meaningfully exercised`, () => {
  for (const [label, strategy] of [
    ["first-offer", pickFirstOffer],
    ["random-pick", pickRandomOffer],
  ]) {
    let matchesAfterRoundTen = 0;

    for (let seedIndex = 0; seedIndex < BALANCE_CORPUS_SIZE; seedIndex += 1) {
      const state = autoplayRun(`balance-large-${seedIndex}`, strategy);
      matchesAfterRoundTen += state.round > 10 ? 1 : 0;
    }

    const share = matchesAfterRoundTen / BALANCE_CORPUS_SIZE;
    assert.ok(
      share >= 0.35,
      `${label} reaches the added rounds in only ${formatPercent(share)} of matches; expected at least 35%.`,
    );
  }
});

function pickFirstOffer(state) {
  return state.draftOptions[0] ? [state.draftOptions[0].cardId] : [];
}

function pickRandomOffer(state) {
  const rng = new SeededRandom(`${state.seed}:balance-random:${state.round}`);
  const option = rng.pick(state.draftOptions);

  return option ? [option.cardId] : [];
}

function pickLowestPower(state) {
  const option = [...state.draftOptions].sort(
    (left, right) =>
      getCardPowerScore(getCardDefinition(left.cardId)) - getCardPowerScore(getCardDefinition(right.cardId)) ||
      left.cardId.localeCompare(right.cardId),
  )[0];

  return option ? [option.cardId] : [];
}

function formatPercent(value) {
  return `${Math.round(value * 1_000) / 10}%`;
}
