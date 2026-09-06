import { replaySoloRunChoices, SOLO_RUN_RULESET_VERSION } from "../../../draft-battler/src/soloPersistence";
import { getUtcIsoWeek } from "./ranking";
import type { PvpErrorCode } from "./protocol";
import type { TelegramPlayerIdentity } from "./telegramAuth";

interface SoloRunRow {
  run_id: string;
  seed: string;
  ruleset_version: string;
  started_at: number;
  result: "win" | "loss" | "draw" | null;
  week_key: string | null;
}

export class SoloRankingError extends Error {
  readonly code: PvpErrorCode;
  readonly status: number;

  constructor(code: PvpErrorCode, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export async function startRankedSoloRun(
  db: D1Database,
  identity: TelegramPlayerIdentity | undefined,
  rulesetVersion: unknown,
  now = Date.now(),
) {
  if (rulesetVersion !== SOLO_RUN_RULESET_VERSION) throw new SoloRankingError("ruleset_mismatch", 409);
  if (!identity) return { participation: "telegram_required" as const, run: null };
  const profile = await db.prepare("SELECT name FROM user_directory WHERE user_id = ? LIMIT 1")
    .bind(identity.userId).first<{ name: string | null }>();
  if (!profile) return { participation: "missing_profile" as const, run: null };
  const runId = `ranked-strong:${crypto.randomUUID()}`;
  const seed = crypto.randomUUID();
  const displayName = (profile.name?.trim() || identity.displayName).replace(/\s+/gu, " ").slice(0, 32);
  await db.prepare(`INSERT INTO brobattler_solo_runs
    (run_id, user_id, display_name, seed, ruleset_version, started_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(runId, identity.userId, displayName, seed, SOLO_RUN_RULESET_VERSION, now).run();
  return { participation: "ranked" as const, run: { runId, seed, startedAt: now, rulesetVersion: SOLO_RUN_RULESET_VERSION } };
}

export async function finishRankedSoloRun(
  db: D1Database,
  identity: TelegramPlayerIdentity | undefined,
  runId: unknown,
  rounds: unknown,
  now = Date.now(),
) {
  if (!identity) throw new SoloRankingError("invalid_init_data", 401);
  if (typeof runId !== "string" || !/^ranked-strong:[0-9a-f-]{36}$/u.test(runId)) {
    throw new SoloRankingError("bad_request", 400);
  }
  const statement = db.prepare(`SELECT run_id, seed, ruleset_version, started_at, result, week_key
    FROM brobattler_solo_runs WHERE run_id = ? AND user_id = ?`).bind(runId, identity.userId);
  const stored = await statement.first<SoloRunRow>();
  if (!stored) throw new SoloRankingError("solo_run_not_found", 404);
  if (stored.result) return { status: "recorded" as const, result: stored.result, weekKey: stored.week_key };
  if (stored.ruleset_version !== SOLO_RUN_RULESET_VERSION) throw new SoloRankingError("ruleset_mismatch", 409);
  const run = replaySoloRunChoices(stored.seed, rounds);
  if (!run?.outcome) throw new SoloRankingError("invalid_solo_result", 422);
  const result = run.outcome === "player" ? "win" : run.outcome === "enemy" ? "loss" : "draw";
  const { weekKey } = getUtcIsoWeek(now);
  // First accepted finish owns both outcome and week, even if delivery is retried
  // after a lost response or concurrently from a restored browser tab.
  await db.prepare(`UPDATE brobattler_solo_runs SET result = ?, rounds_played = ?, week_key = ?, finished_at = ?
    WHERE run_id = ? AND user_id = ? AND result IS NULL`)
    .bind(result, run.roundHistory.length, weekKey, now, runId, identity.userId).run();
  const finished = await statement.first<SoloRunRow>();
  if (!finished?.result) throw new Error("Solo result was not stored");
  return { status: "recorded" as const, result: finished.result, weekKey: finished.week_key };
}
