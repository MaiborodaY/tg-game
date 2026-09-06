import type { RunState } from "./game/types";
import { PvpRequestError, type PvpApiRequestOptions } from "./pvpSession";
import { SOLO_RUN_RULESET_VERSION, type SoloRoundChoice, type SoloRunSession, type SoloRunStorage } from "./soloPersistence";

export const SOLO_RANKING_QUEUE_KEY = "brobattler:solo-ranking-pending:v1";
export type SoloRankingStatus = "pending" | "recorded" | "rejected";
export interface RankedSoloStart {
  participation: "ranked" | "telegram_required" | "missing_profile";
  run: { runId: string; seed: string; startedAt: number; rulesetVersion: string } | null;
}
interface PendingSoloResult {
  runId: string;
  rounds: SoloRoundChoice[];
}

export function isRankedSoloRun(session: SoloRunSession | undefined, run: RunState): boolean {
  return session?.source === "standard" && run.botDifficulty === "strong" && session.runId.startsWith("ranked-strong:");
}

export async function requestRankedSoloStart(apiOrigin: string, options: PvpApiRequestOptions = {}): Promise<RankedSoloStart> {
  const payload = await postSolo(apiOrigin, "start", { rulesetVersion: SOLO_RUN_RULESET_VERSION }, options);
  if ((payload.participation === "telegram_required" || payload.participation === "missing_profile") && payload.run === null) {
    return { participation: payload.participation, run: null };
  }
  const run = payload.run as RankedSoloStart["run"];
  if (payload.participation !== "ranked" || !run || typeof run.runId !== "string"
    || !run.runId.startsWith("ranked-strong:") || typeof run.seed !== "string"
    || !Number.isSafeInteger(run.startedAt) || run.startedAt <= 0 || run.rulesetVersion !== SOLO_RUN_RULESET_VERSION) {
    throw new PvpRequestError("bad_response", 200);
  }
  return { participation: "ranked", run };
}

// Persist before sending so a lost response, reload or next run cannot double-count
// or discard a finished result. The server owns the first accepted settlement.
export class SoloRankingDelivery {
  private pending = new Map<string, PendingSoloResult>();
  private statuses = new Map<string, SoloRankingStatus>();
  private flushing?: Promise<void>;
  private readonly storage: SoloRunStorage | undefined;

  constructor(storage: SoloRunStorage | undefined) {
    this.storage = storage;
    try {
      const saved: unknown = JSON.parse(storage?.getItem(SOLO_RANKING_QUEUE_KEY) ?? "[]");
      if (Array.isArray(saved)) {
        for (const entry of saved) {
          if (entry && typeof entry.runId === "string" && entry.runId.startsWith("ranked-strong:")
            && Array.isArray(entry.rounds) && entry.rounds.length > 0 && entry.rounds.length <= 15) {
            this.pending.set(entry.runId, entry);
            this.statuses.set(entry.runId, "pending");
          }
        }
      }
    } catch { /* The active finished snapshot can recreate its delivery record. */ }
  }

  status(runId: string): SoloRankingStatus | undefined {
    return this.statuses.get(runId);
  }

  get hasPending(): boolean {
    return this.pending.size > 0;
  }

  queue(session: SoloRunSession, run: RunState): boolean {
    if (!isRankedSoloRun(session, run) || run.status !== "finished") return true;
    const status = this.status(session.runId);
    if (status === "recorded" || status === "rejected") return true;
    this.pending.set(session.runId, {
      runId: session.runId,
      rounds: run.roundHistory.map(({ draftRerollCount, playerSlots }) => ({ draftRerollCount, playerSlots })),
    });
    this.statuses.set(session.runId, "pending");
    return this.save();
  }

  flush(apiOrigin: string, options: PvpApiRequestOptions = {}): Promise<void> {
    if (this.flushing) return this.flushing;
    if (!options.telegramInitData) return Promise.resolve();
    this.flushing = this.sendPending(apiOrigin, options).finally(() => { this.flushing = undefined; });
    return this.flushing;
  }

  private async sendPending(apiOrigin: string, options: PvpApiRequestOptions): Promise<void> {
    for (const entry of this.pending.values()) {
      try {
        const response = await postSolo(apiOrigin, "finish", entry, options);
        if (response.status !== "recorded") throw new PvpRequestError("bad_response", 200);
        this.statuses.set(entry.runId, "recorded");
      } catch (error) {
        if (error instanceof PvpRequestError && (error.status === 0 || error.status >= 500 || error.status === 401)) break;
        if (!(error instanceof PvpRequestError) || !["ruleset_mismatch", "invalid_solo_result"].includes(error.code)) continue;
        this.statuses.set(entry.runId, "rejected");
      }
      this.pending.delete(entry.runId);
      this.save();
    }
  }

  private save(): boolean {
    try {
      if (!this.storage) return false;
      this.storage.setItem(SOLO_RANKING_QUEUE_KEY, JSON.stringify([...this.pending.values()]));
      return true;
    } catch {
      return false;
    }
  }
}

async function postSolo(apiOrigin: string, action: "start" | "finish", body: unknown, options: PvpApiRequestOptions): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.telegramInitData) headers["x-telegram-init-data"] = options.telegramInitData;
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(`${apiOrigin}/api/solo/${action}`, {
      method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new PvpRequestError("connection_failed", 0);
  }
  let payload: Record<string, unknown>;
  try { payload = await response.json(); } catch { throw new PvpRequestError("bad_response", response.status); }
  if (!payload || typeof payload !== "object") throw new PvpRequestError("bad_response", response.status);
  if (!response.ok) throw new PvpRequestError(typeof payload.code === "string" ? payload.code : "request_failed", response.status);
  if (payload.ok !== true) throw new PvpRequestError("bad_response", response.status);
  return payload;
}
