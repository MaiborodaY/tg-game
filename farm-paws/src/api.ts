export type FarmPawsRunSession = {
  mode: "local" | "server";
  runId: string | null;
  bestScore: number;
  error: string | null;
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
  bestScore?: number;
  best_score?: number;
  error?: string;
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

export async function startFarmPawsRun(localBestScore: number): Promise<FarmPawsRunSession> {
  const initData = telegramInitData();
  if (!initData) {
    return localSession(localBestScore, null);
  }

  try {
    const response = await postJson<ApiStartResponse>("/api/farm-paws/start", { initData });
    const runId = response.runId || response.run_id || null;
    if (!response.ok || !runId) {
      return localSession(localBestScore, response.error || "start_failed");
    }

    return {
      mode: "server",
      runId,
      bestScore: normalizedScore(response.bestScore ?? response.best_score ?? localBestScore),
      error: null
    };
  } catch (error) {
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
  const parsed = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof parsed.error === "string" ? parsed.error : `HTTP ${response.status}`);
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
    error
  };
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
