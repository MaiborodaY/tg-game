import { type FarmPawsLang, initialFarmPawsLang, normalizeFarmPawsLang } from "./i18n";

export type FarmPawsGame = "farm_paws" | "snake" | "tetris";

export type FarmPawsRunSession = {
  mode: "local" | "server" | "blocked";
  game: FarmPawsGame;
  runId: string | null;
  bestScore: number;
  error: string | null;
  petName: string | null;
  petType: string | null;
  lang: FarmPawsLang;
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
  duplicate: boolean;
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
  lang?: string;
  language?: string;
  dailyLimit?: number;
  daily_limit?: number;
  dailyStarts?: number;
  daily_starts?: number;
};

type ApiFinishResponse = {
  ok?: boolean;
  duplicate?: boolean;
  xpReward?: number;
  xp_reward?: number;
  bestScore?: number;
  best_score?: number;
  petXp?: number;
  pet_xp?: number;
  error?: string;
};

const API_BASE_URL = normalizeBaseUrl(import.meta.env?.VITE_FARM_PAWS_API_BASE_URL || "");
const API_TIMEOUT_MS = 15_000;
const BLOCKING_START_CODES = new Set([
  "daily_limit",
  "no_pet",
  "pet_dead",
  "pet_changed",
  "not_enough_energy",
  "forbidden"
]);

export async function startFarmPawsRun(
  localBestScore: number,
  game: FarmPawsGame = "farm_paws"
): Promise<FarmPawsRunSession> {
  const initData = telegramInitData();
  if (!initData) {
    return localSession(localBestScore, game, null);
  }

  try {
    const response = await postJson<ApiStartResponse>("/api/farm-paws/start", { initData, game });
    const runId = response.runId || response.run_id || null;
    if (!response.ok || !runId) {
      const code = normalizeCode(response.code);
      if (isBlockingStartCode(code)) {
        return blockedSession(localBestScore, game, response.error || code || "start_blocked", code, response);
      }
      return blockedSession(
        localBestScore,
        game,
        response.error || code || "start_failed",
        "start_unavailable",
        response
      );
    }

    return {
      mode: "server",
      game,
      runId,
      bestScore: normalizedScore(response.bestScore ?? response.best_score ?? localBestScore),
      error: null,
      petName: normalizedText(response.petName ?? response.pet_name),
      petType: normalizedText(response.petType ?? response.pet_type),
      lang: responseLang(response),
      code: null,
      dailyLimit: normalizedNullableScore(response.dailyLimit ?? response.daily_limit),
      dailyStarts: normalizedNullableScore(response.dailyStarts ?? response.daily_starts)
    };
  } catch (error) {
    if (error instanceof ApiError && isBlockingStartCode(error.code)) {
      const payload = error.payload as ApiStartResponse;
      return blockedSession(localBestScore, game, error.message, error.code, payload);
    }
    if (error instanceof ApiError) {
      return blockedSession(
        localBestScore,
        game,
        error.message,
        "start_unavailable",
        error.payload as ApiStartResponse
      );
    }
    return blockedSession(
      localBestScore,
      game,
      error instanceof Error ? error.message : "network_error",
      "start_unavailable",
      null
    );
  }
}

export async function finishFarmPawsRun(
  session: FarmPawsRunSession,
  payload: FarmPawsFinishPayload
): Promise<FarmPawsFinishResult> {
  const initData = telegramInitData();
  if (session.mode !== "server") {
    return {
      mode: "local",
      ok: true,
      duplicate: false,
      xpReward: null,
      bestScore: null,
      petXp: null,
      error: null
    };
  }
  if (!session.runId || !initData) {
    return serverFinishError("missing_run_session");
  }

  try {
    const response = await postJson<ApiFinishResponse>("/api/farm-paws/finish", {
      initData,
      game: session.game,
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
      duplicate: response.duplicate === true,
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
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": initData
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const parsed = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      throw new ApiError(response.status, parsed);
    }
    return parsed as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("request_timeout", { cause: error });
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function localSession(
  bestScore: number,
  game: FarmPawsGame,
  error: string | null,
  lang: FarmPawsLang = initialFarmPawsLang()
): FarmPawsRunSession {
  return {
    mode: "local",
    game,
    runId: null,
    bestScore: normalizedScore(bestScore),
    error,
    petName: null,
    petType: null,
    lang,
    code: null,
    dailyLimit: null,
    dailyStarts: null
  };
}

function blockedSession(
  bestScore: number,
  game: FarmPawsGame,
  error: string | null,
  code: string | null,
  response: ApiStartResponse | null
): FarmPawsRunSession {
  return {
    mode: "blocked",
    game,
    runId: null,
    bestScore: normalizedScore(bestScore),
    error,
    petName: normalizedText(response?.petName ?? response?.pet_name),
    petType: normalizedText(response?.petType ?? response?.pet_type),
    lang: responseLang(response),
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
    duplicate: false,
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

function responseLang(response: ApiStartResponse | null): FarmPawsLang {
  return normalizeFarmPawsLang(response?.lang ?? response?.language ?? initialFarmPawsLang());
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
