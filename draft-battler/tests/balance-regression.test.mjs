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
    assert.ok(draws / BALANCE_CORPUS_SIZE <= 0.05, `${draws}/${BALANCE_CORPUS_SIZE} draws exceeds 5%.`);
  });
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
