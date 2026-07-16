export const RUNNER_BEST_SCORE_KEY = "runner-best-score-v1";
export const MAX_RUNNER_SCORE = 2_147_483_647;

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;
const MAX_PAYLOAD_LENGTH = 32_768;

export type RunnerTelegramPayload = Record<string, unknown>;

export type RunnerRewardLaunch = {
  mode: "local" | "server";
  runId: string | null;
  token: string | null;
  finishUrl: string | null;
};

export type RunnerLaunchParams = {
  payload: RunnerTelegramPayload | null;
  reward: RunnerRewardLaunch;
};

export type RunnerFinalResult = Readonly<{
  score: number;
  durationMs: number;
}>;

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

type FetchResponseLike = {
  ok: boolean;
  status?: number;
  json(): Promise<unknown>;
};

export type RunnerFetch = (
  input: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
  }
) => Promise<FetchResponseLike>;

export type RunnerFinishResult = {
  mode: "local" | "server";
  ok: boolean;
  duplicate: boolean;
  error: string | null;
};

export type RunnerRewardFinisher = {
  readonly finalResult: RunnerFinalResult;
  readonly status: "local" | "idle" | "pending" | "succeeded";
  readonly attempts: number;
  finish(): Promise<RunnerFinishResult>;
};

export type TelegramScoreSubmitResult = {
  ok: boolean;
  skipped: boolean;
  error: string | null;
};

type RequestOptions = {
  fetch?: RunnerFetch;
  timeoutMs?: number;
};

export function parseRunnerLaunchParams(
  source: string | URLSearchParams,
  baseUrl?: string
): RunnerLaunchParams {
  const { params, effectiveBaseUrl } = readSearchParams(source, baseUrl);
  const payload = decodeRunnerPayload(params.get("p"));
  const runId = boundedText(params.get("run_id"), 256);
  const token = boundedText(params.get("token"), 4_096);
  const finishUrl = safeHttpUrl(params.get("finish_url"), effectiveBaseUrl);
  const hasCompleteRewardLaunch = Boolean(runId && token && finishUrl);

  return {
    payload,
    reward: hasCompleteRewardLaunch
      ? { mode: "server", runId, token, finishUrl }
      : { mode: "local", runId: null, token: null, finishUrl: null }
  };
}

export function decodeRunnerPayload(encoded: string | null | undefined): RunnerTelegramPayload | null {
  if (!encoded || encoded.length > MAX_PAYLOAD_LENGTH) return null;
  try {
    const normalized = normalizeBase64(encoded);
    if (!normalized) return null;
    const binary = globalThis.atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function normalizeRunnerScore(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(MAX_RUNNER_SCORE, Math.max(0, Math.floor(parsed)));
}

export function captureRunnerFinalResult(score: unknown, durationMs: unknown): RunnerFinalResult {
  return Object.freeze({
    score: normalizeRunnerScore(score),
    durationMs: normalizeNonnegativeInteger(durationMs)
  });
}

export function loadRunnerBestScore(storage: StorageLike | null | undefined): number {
  if (!storage) return 0;
  try {
    return normalizeRunnerScore(storage.getItem(RUNNER_BEST_SCORE_KEY));
  } catch {
    return 0;
  }
}

export function saveRunnerBestScore(
  storage: StorageLike | null | undefined,
  score: unknown
): number {
  const previousBest = loadRunnerBestScore(storage);
  const nextBest = Math.max(previousBest, normalizeRunnerScore(score));
  if (!storage) return nextBest;
  try {
    storage.setItem(RUNNER_BEST_SCORE_KEY, String(nextBest));
  } catch {
    // Storage can be disabled by a WebView or privacy settings. The run remains playable.
  }
  return nextBest;
}

export function createRunnerRewardFinisher(
  reward: RunnerRewardLaunch,
  finalResult: RunnerFinalResult,
  options: RequestOptions = {}
): RunnerRewardFinisher {
  const capturedResult = captureRunnerFinalResult(finalResult.score, finalResult.durationMs);
  const capturedReward = Object.freeze({ ...reward });
  const localResult: RunnerFinishResult = Object.freeze({
    mode: "local",
    ok: true,
    duplicate: false,
    error: null
  });
  let status: RunnerRewardFinisher["status"] = capturedReward.mode === "server" ? "idle" : "local";
  let attempts = 0;
  let pending: Promise<RunnerFinishResult> | null = null;
  let succeeded: RunnerFinishResult | null = null;

  const finish = async (): Promise<RunnerFinishResult> => {
    if (
      capturedReward.mode !== "server"
      || !capturedReward.runId
      || !capturedReward.token
      || !capturedReward.finishUrl
    ) {
      return localResult;
    }
    if (succeeded) return succeeded;
    if (pending) return pending;

    attempts += 1;
    status = "pending";
    const body = JSON.stringify({
      run_id: capturedReward.runId,
      token: capturedReward.token,
      score: capturedResult.score,
      duration_ms: capturedResult.durationMs
    });

    const request: Promise<RunnerFinishResult> = postJson(capturedReward.finishUrl, body, options)
      .then(({ response, data }) => {
        const duplicate = isRecord(data) && data.duplicate === true;
        const accepted = duplicate || (response.ok && isRecord(data) && data.ok === true);
        if (!accepted) {
          status = "idle";
          return {
            mode: "server" as const,
            ok: false,
            duplicate: false,
            error: response.ok ? responseError(data, "finish_rejected") : `http_${response.status || 0}`
          };
        }

        succeeded = Object.freeze({
          mode: "server",
          ok: true,
          duplicate,
          error: null
        });
        status = "succeeded";
        return succeeded;
      })
      .catch((error: unknown) => {
        status = "idle";
        return {
          mode: "server" as const,
          ok: false,
          duplicate: false,
          error: errorMessage(error)
        };
      })
      .finally(() => {
        pending = null;
      });

    pending = request;
    return request;
  };

  return Object.freeze({
    finalResult: capturedResult,
    get status() {
      return status;
    },
    get attempts() {
      return attempts;
    },
    finish
  });
}

export async function submitRunnerTelegramScore(
  payload: RunnerTelegramPayload | null,
  finalResult: RunnerFinalResult,
  options: RequestOptions & { scoreUrl?: string } = {}
): Promise<TelegramScoreSubmitResult> {
  if (!payload) return { ok: true, skipped: true, error: null };
  const capturedResult = captureRunnerFinalResult(finalResult.score, finalResult.durationMs);
  const scoreUrl = boundedText(options.scoreUrl || "/api/score", 2_048);
  if (!scoreUrl) return { ok: false, skipped: false, error: "invalid_score_url" };

  const body = JSON.stringify({
    score: capturedResult.score,
    payload: cloneJsonRecord(payload)
  });

  try {
    const { response, data } = await postJson(scoreUrl, body, options);
    if (!response.ok || !isRecord(data) || data.ok !== true) {
      return {
        ok: false,
        skipped: false,
        error: response.ok ? responseError(data, "score_rejected") : `http_${response.status || 0}`
      };
    }
    return { ok: true, skipped: false, error: null };
  } catch (error) {
    return { ok: false, skipped: false, error: errorMessage(error) };
  }
}

function readSearchParams(
  source: string | URLSearchParams,
  baseUrl?: string
): { params: URLSearchParams; effectiveBaseUrl?: string } {
  if (source instanceof URLSearchParams) {
    return { params: new URLSearchParams(source), effectiveBaseUrl: baseUrl };
  }

  const trimmed = source.trim();
  try {
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      return { params: url.searchParams, effectiveBaseUrl: url.toString() };
    }
  } catch {
    return { params: new URLSearchParams(), effectiveBaseUrl: baseUrl };
  }
  return {
    params: new URLSearchParams(trimmed.startsWith("?") ? trimmed.slice(1) : trimmed),
    effectiveBaseUrl: baseUrl
  };
}

function normalizeBase64(value: string): string | null {
  const compact = value.trim().replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
  if (!compact || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) return null;
  const unpadded = compact.replace(/=+$/, "");
  if (unpadded.length % 4 === 1) return null;
  return unpadded + "=".repeat((4 - (unpadded.length % 4)) % 4);
}

function safeHttpUrl(value: string | null, baseUrl?: string): string | null {
  const text = boundedText(value, 2_048);
  if (!text) return null;
  try {
    const url = baseUrl ? new URL(text, baseUrl) : new URL(text);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function boundedText(value: string | null, maxLength: number): string | null {
  const text = value?.trim() || "";
  return text && text.length <= maxLength ? text : null;
}

function normalizeNonnegativeInteger(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(parsed)));
}

async function postJson(
  url: string,
  body: string,
  options: RequestOptions
): Promise<{ response: FetchResponseLike; data: unknown }> {
  const fetcher = options.fetch || defaultFetch;
  const controller = new AbortController();
  const timeoutMs = normalizeTimeout(options.timeoutMs);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("request_timeout"));
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      fetcher(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: controller.signal
      }),
      timeout
    ]);
    const data = await Promise.race([response.json().catch(() => ({})), timeout]);
    return { response, data };
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

async function defaultFetch(input: string, init: Parameters<RunnerFetch>[1]): Promise<FetchResponseLike> {
  if (typeof globalThis.fetch !== "function") throw new Error("fetch_unavailable");
  return globalThis.fetch(input, init);
}

function normalizeTimeout(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
  return Math.min(MAX_TIMEOUT_MS, Math.max(1, Math.floor(value || DEFAULT_TIMEOUT_MS)));
}

function responseError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string" && value.error.trim()
    ? value.error.trim().slice(0, 256)
    : fallback;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "request_failed";
}

function cloneJsonRecord(value: RunnerTelegramPayload): RunnerTelegramPayload {
  try {
    const cloned = JSON.parse(JSON.stringify(value)) as unknown;
    return isRecord(cloned) ? cloned : {};
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
