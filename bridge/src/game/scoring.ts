import type { Contract, DuplicateScoreBreakdown, Partnership, Strain, Vulnerability } from "./types.ts";

export function isPartnershipVulnerable(side: Partnership, vulnerability: Vulnerability): boolean {
  return vulnerability === "both" || vulnerability === side;
}

/** Duplicate bridge scoring from the declaring partnership's point of view. */
export function scoreDuplicateContract(
  contract: Pick<Contract, "level" | "strain" | "doubled" | "declaringSide">,
  declarerTricks: number,
  vulnerability: Vulnerability,
): DuplicateScoreBreakdown {
  if (!Number.isInteger(declarerTricks) || declarerTricks < 0 || declarerTricks > 13) {
    throw new Error("Declarer tricks must be an integer from 0 through 13.");
  }

  const target = 6 + contract.level;
  const vulnerable = isPartnershipVulnerable(contract.declaringSide, vulnerability);
  if (declarerTricks < target) {
    const undertrickPenalty = calculateUndertrickPenalty(target - declarerTricks, contract.doubled, vulnerable);
    return Object.freeze({
      total: -undertrickPenalty,
      made: false,
      contractPoints: 0,
      overtrickPoints: 0,
      insultBonus: 0,
      gameOrPartscoreBonus: 0,
      slamBonus: 0,
      undertrickPenalty,
    });
  }

  const multiplier = contract.doubled === 0 ? 1 : contract.doubled === 1 ? 2 : 4;
  const contractPoints = undoubledContractPoints(contract.level, contract.strain) * multiplier;
  const overtricks = declarerTricks - target;
  const overtrickPoints = calculateOvertrickPoints(overtricks, contract.strain, contract.doubled, vulnerable);
  const insultBonus = contract.doubled === 1 ? 50 : contract.doubled === 2 ? 100 : 0;
  const gameOrPartscoreBonus = contractPoints >= 100 ? (vulnerable ? 500 : 300) : 50;
  const slamBonus = contract.level === 6
    ? (vulnerable ? 750 : 500)
    : contract.level === 7
      ? (vulnerable ? 1_500 : 1_000)
      : 0;
  return Object.freeze({
    total: contractPoints + overtrickPoints + insultBonus + gameOrPartscoreBonus + slamBonus,
    made: true,
    contractPoints,
    overtrickPoints,
    insultBonus,
    gameOrPartscoreBonus,
    slamBonus,
    undertrickPenalty: 0,
  });
}

export const calculateDuplicateScore = scoreDuplicateContract;

function undoubledContractPoints(level: number, strain: Strain): number {
  if (strain === "clubs" || strain === "diamonds") return level * 20;
  if (strain === "hearts" || strain === "spades") return level * 30;
  return 40 + (level - 1) * 30;
}

function calculateOvertrickPoints(
  overtricks: number,
  strain: Strain,
  doubled: 0 | 1 | 2,
  vulnerable: boolean,
): number {
  if (overtricks <= 0) return 0;
  if (doubled === 1) return overtricks * (vulnerable ? 200 : 100);
  if (doubled === 2) return overtricks * (vulnerable ? 400 : 200);
  return overtricks * (strain === "clubs" || strain === "diamonds" ? 20 : 30);
}

function calculateUndertrickPenalty(undertricks: number, doubled: 0 | 1 | 2, vulnerable: boolean): number {
  if (doubled === 0) return undertricks * (vulnerable ? 100 : 50);

  const doubledPenalty = vulnerable
    ? 200 + Math.max(0, undertricks - 1) * 300
    : 100 + Math.min(2, Math.max(0, undertricks - 1)) * 200 + Math.max(0, undertricks - 3) * 300;
  return doubled === 2 ? doubledPenalty * 2 : doubledPenalty;
}
