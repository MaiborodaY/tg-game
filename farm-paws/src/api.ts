export type FarmPawsRunSession = {
  mode: "local" | "server" | "blocked";
  runId: string | null;
  bestScore: number;
  error: string | null;
  petName: string | null;
  petType: string | null;
  code?: string | null;
  dailyLimit?: number | null;
  dailyStarts?: number | null;
};

export type FarmPawsFinishPayload = {
  score: number;
  round: number;
  hpLeft: number;
  durationMs: number;
};

export type FarmPawsFinishResult = {
  mode: "local" | "server";
  ok: boolean;
  xpReward: number | null;
  bestScore: number | null;
  petXp: number | null;
  error: string | null;
};

type ApiStartResponse = {
  ok?: boolean;
  runId?: string;
  run_id?: string;
  petName?: string;
  pet_name?: string;
  petType?: string;
  pet_type?: string;
  bestScore?: number;
  best_score?: number;
  error?: string;
  code?: string;
  dailyLimit?: number;
  daily_limit?: number;
  dailyStarts?: number;
  daily_starts?: number;
};

type ApiFinishResponse = {
  ok?: boolean;
  xpReward?: number;
  xp_reward?: number;
  bestScore?: number;
  best_score?: number;
  petXp?: number;
  pet_xp?: number;
  error?: string;
};

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_FARM_PAWS_API_BASE_URL || "");
const BLOCKING_START_CODES = new Set([
  "daily_limit",
  "no_pet",
  "pet_dead",
  "pet_changed",
  "not_enough_energy",
  "forbidden"
]);

export async function startFarmPawsRun(localBestScore: number): Promise<FarmPawsRunSession> {
  const initData = telegramInitData();
  if (!initData) {
    return localSession(localBestScore, null);
  }

  try {
    const response = await postJson<ApiStartResponse>("/api/farm-paws/start", { initData });
    const runId = response.runId || response.run_id || null;
    if (!response.ok || !runId) {
      const code = normalizeCode(response.code);
      if (isBlockingStartCode(code)) {
        return blockedSession(localBestScore, response.error || code || "start_blocked", code, response);
      }
      return localSession(localBestScore, response.error || "start_failed");
    }

    return {
      mode: "server",
      runId,
      bestScore: normalizedScore(response.bestScore ?? response.best_score ?? localBestScore),
      error: null,
      petName: normalizedText(response.petName ?? response.pet_name),
      petType: normalizedText(response.petType ?? response.pet_type),
      code: null,
      dailyLimit: null,
      dailyStarts: null
    };
  } catch (error) {
    if (error instanceof ApiError && isBlockingStartCode(error.code)) {
      const payload = error.payload as ApiStartResponse;
      return blockedSession(localBestScore, error.message, error.code, payload);
    }
    return localSession(localBestScore, error instanceof Error ? error.message : "network_error");
  }
}

export async function finishFarmPawsRun(
  session: FarmPawsRunSession,
  payload: FarmPawsFinishPayload
): Promise<FarmPawsFinishResult> {
  const initData = telegramInitData();
  if (session.mode !== "server" || !session.runId || !initData) {
    return {
      mode: "local",
      ok: true,
      xpReward: null,
      bestScore: null,
      petXp: null,
      error: null
    };
  }

  try {
    const response = await postJson<ApiFinishResponse>("/api/farm-paws/finish", {
      initData,
      runId: session.runId,
      score: payload.score,
      round: payload.round,
      hpLeft: payload.hpLeft,
      durationMs: payload.durationMs
    });

    if (!response.ok) {
      return serverFinishError(response.error || "finish_failed");
    }

    return {
      mode: "server",
      ok: true,
      xpReward: normalizedNullableScore(response.xpReward ?? response.xp_reward),
      bestScore: normalizedNullableScore(response.bestScore ?? response.best_score),
      petXp: normalizedNullableScore(response.petXp ?? response.pet_xp),
      error: null
    };
  } catch (error) {
    return serverFinishError(error instanceof Error ? error.message : "network_error");
  }
}

function telegramInitData(): string {
  return window.Telegram?.WebApp?.initData || "";
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const initData = typeof body.initData === "string" ? body.initData : telegramInitData();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData
    },
    body: JSON.stringify(body)
  });
  const parsed = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiError(response.status, parsed);
  }
  return parsed as T;
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function localSession(bestScore: number, error: string | null): FarmPawsRunSession {
  return {
    mode: "local",
    runId: null,
    bestScore: normalizedScore(bestScore),
    error,
    petName: null,
    petType: null,
    code: null,
    dailyLimit: null,
    dailyStarts: null
  };
}

function blockedSession(
  bestScore: number,
  error: string | null,
  code: string | null,
  response: ApiStartResponse | null
): FarmPawsRunSession {
  return {
    mode: "blocked",
    runId: null,
    bestScore: normalizedScore(bestScore),
    error,
    petName: normalizedText(response?.petName ?? response?.pet_name),
    petType: normalizedText(response?.petType ?? response?.pet_type),
    code,
    dailyLimit: normalizedNullableScore(response?.dailyLimit ?? response?.daily_limit),
    dailyStarts: normalizedNullableScore(response?.dailyStarts ?? response?.daily_starts)
  };
}

function isBlockingStartCode(code: string | null): boolean {
  return Boolean(code && BLOCKING_START_CODES.has(code));
}

function normalizeCode(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function serverFinishError(error: string): FarmPawsFinishResult {
  return {
    mode: "server",
    ok: false,
    xpReward: null,
    bestScore: null,
    petXp: null,
    error
  };
}

function normalizedNullableScore(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}

function normalizedScore(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function normalizedText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

class ApiError extends Error {
  status: number;
  code: string | null;
  payload: Record<string, unknown>;

  constructor(status: number, payload: Record<string, unknown>) {
    const code = normalizeCode(payload.code);
    const message = typeof payload.error === "string" && payload.error.trim()
      ? payload.error.trim()
      : (code || `HTTP ${status}`);
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}
