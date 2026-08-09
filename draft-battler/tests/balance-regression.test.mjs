import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_RUN_ROUNDS,
  SeededRandom,
  getCardDefinition,
  getCardPowerScore,
  simulateDebugRun,
} from "../src/game/index.ts";

const BALANCE_CORPUS_SIZE = 500;
const BALANCE_TARGETS = [
  {
    label: "highest-power deliberate completion stays below the 98% near-automatic-win guardrail",
    strategy: "highestPower",
    minimum: 0.8,
    maximum: 0.98,
  },
  {
    label: "synergy deliberate completion stays in the 80%-95% MVP band",
    strategy: "synergy",
    minimum: 0.8,
    maximum: 0.95,
  },
  {
    label: "first-offer play remains viable in the 35%-65% target band",
    strategy: pickFirstOffer,
    minimum: 0.35,
    maximum: 0.65,
  },
  {
    label: "deterministic random-pick play remains viable in the 35%-65% target band",
    strategy: pickRandomOffer,
    minimum: 0.35,
    maximum: 0.65,
  },
  {
    label: "lowest-power play still completes 5%-20% of seeded runs",
    strategy: pickLowestPower,
    minimum: 0.05,
    maximum: 0.2,
  },
];

for (const target of BALANCE_TARGETS) {
  test(`solo balance over ${BALANCE_CORPUS_SIZE} seeds: ${target.label}`, () => {
    let completions = 0;

    for (let seedIndex = 0; seedIndex < BALANCE_CORPUS_SIZE; seedIndex += 1) {
      const report = simulateDebugRun({
        seed: `balance-large-${seedIndex}`,
        strategy: target.strategy,
      });

      if (report.finalHp > 0 && report.rounds.length === MAX_RUN_ROUNDS) {
        completions += 1;
      }
    }

    const completionRate = completions / BALANCE_CORPUS_SIZE;
    assert.ok(
      completionRate >= target.minimum && completionRate <= target.maximum,
      `${completions}/${BALANCE_CORPUS_SIZE} completed (${formatPercent(completionRate)}); ` +
        `expected ${formatPercent(target.minimum)}-${formatPercent(target.maximum)}.`,
    );
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
      const report = simulateDebugRun({ seed: `balance-large-${seedIndex}`, strategy });

      if (report.finalHp > 0 && report.rounds.length === MAX_RUN_ROUNDS) {
        continue;
      }

      const defeatRound = report.rounds.at(-1)?.round ?? 0;
      defeats += 1;
      defeatsByRound.set(defeatRound, (defeatsByRound.get(defeatRound) ?? 0) + 1);
    }

    for (const round of [7, 8]) {
      const share = (defeatsByRound.get(round) ?? 0) / defeats;
      assert.ok(share <= 0.3, `${label} has ${formatPercent(share)} of defeats concentrated in round ${round}.`);
    }
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
