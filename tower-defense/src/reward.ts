const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;
const MAX_PAYLOAD_LENGTH = 32_768;
const MAX_SCORE = 2_147_483_647;

export type TelegramPayload = Record<string, unknown>;

export type RewardLaunch = Readonly<{
  mode: "local" | "server";
  runId: string | null;
  token: string | null;
  finishUrl: string | null;
}>;

export type LaunchParams = Readonly<{
  payload: TelegramPayload | null;
  reward: RewardLaunch;
  rewardError: "invalid_launch" | null;
}>;

export type FinalResult = Readonly<{ score: number; durationMs: number }>;
export type FinishResult = Readonly<{
  mode: "local" | "server";
  ok: boolean;
  duplicate: boolean;
  error: string | null;
}>;

type FetchResponseLike = { ok: boolean; status?: number; json(): Promise<unknown> };
export type RewardFetch = (input: string, init: {
  method: "POST";
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
}) => Promise<FetchResponseLike>;

export type RewardFinisher = Readonly<{
  finalResult: FinalResult;
  readonly status: "local" | "idle" | "pending" | "succeeded";
  readonly attempts: number;
  finish(): Promise<FinishResult>;
}>;

type RequestOptions = { fetch?: RewardFetch; timeoutMs?: number };

export function parseLaunchParams(source: string | URLSearchParams, baseUrl?: string): LaunchParams {
  const { params, effectiveBaseUrl } = readSearchParams(source, baseUrl);
  const payload = decodePayload(params.get("p"));
  const runId = boundedText(params.get("run_id"), 256);
  const token = boundedText(params.get("token"), 4_096);
  const finishUrl = safeHttpUrl(params.get("finish_url"), effectiveBaseUrl);
  const complete = Boolean(runId && token && finishUrl);
  const hasRewardParameters = ["run_id", "token", "finish_url"].some((key) => params.has(key));
  return Object.freeze({
    payload,
    rewardError: hasRewardParameters && !complete ? "invalid_launch" : null,
    reward: Object.freeze(complete
      ? { mode: "server" as const, runId, token, finishUrl }
      : { mode: "local" as const, runId: null, token: null, finishUrl: null }),
  });
}

export function decodePayload(encoded: string | null | undefined): TelegramPayload | null {
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

export function captureFinalResult(score: unknown, durationMs: unknown): FinalResult {
  return Object.freeze({
    score: normalizeInteger(score, MAX_SCORE),
    durationMs: normalizeInteger(durationMs, Number.MAX_SAFE_INTEGER),
  });
}

export function createRewardFinisher(
  reward: RewardLaunch,
  finalResult: FinalResult,
  options: RequestOptions = {},
): RewardFinisher {
  const capturedReward = Object.freeze({ ...reward });
  const capturedResult = captureFinalResult(finalResult.score, finalResult.durationMs);
  const localResult = Object.freeze({ mode: "local" as const, ok: true, duplicate: false, error: null });
  let status: RewardFinisher["status"] = reward.mode === "server" ? "idle" : "local";
  let attempts = 0;
  let pending: Promise<FinishResult> | null = null;
  let succeeded: FinishResult | null = null;

  const finish = async (): Promise<FinishResult> => {
    if (capturedReward.mode !== "server" || !capturedReward.runId || !capturedReward.token || !capturedReward.finishUrl) {
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
      duration_ms: capturedResult.durationMs,
    });
    pending = postJson(capturedReward.finishUrl, body, options)
      .then(({ response, data }) => {
        const duplicate = isRecord(data) && data.duplicate === true;
        const accepted = duplicate || (response.ok && isRecord(data) && data.ok === true);
        if (!accepted) {
          status = "idle";
          return Object.freeze({
            mode: "server" as const,
            ok: false,
            duplicate: false,
            error: response.ok ? responseError(data, "finish_rejected") : `http_${response.status || 0}`,
          });
        }
        succeeded = Object.freeze({ mode: "server", ok: true, duplicate, error: null });
        status = "succeeded";
        return succeeded;
      })
      .catch((error: unknown) => {
        status = "idle";
        return Object.freeze({ mode: "server", ok: false, duplicate: false, error: errorMessage(error) });
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  };

  return Object.freeze({
    finalResult: capturedResult,
    get status() { return status; },
    get attempts() { return attempts; },
    finish,
  });
}

function readSearchParams(source: string | URLSearchParams, baseUrl?: string): {
  params: URLSearchParams;
  effectiveBaseUrl?: string;
} {
  if (source instanceof URLSearchParams) return { params: new URLSearchParams(source), effectiveBaseUrl: baseUrl };
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
    effectiveBaseUrl: baseUrl,
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
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) return null;
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

async function postJson(url: string, body: string, options: RequestOptions): Promise<{
  response: FetchResponseLike;
  data: unknown;
}> {
  const fetcher = options.fetch || defaultFetch;
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.min(MAX_TIMEOUT_MS, Math.max(1, Math.floor(options.timeoutMs || DEFAULT_TIMEOUT_MS)))
    : DEFAULT_TIMEOUT_MS;
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
        signal: controller.signal,
      }),
      timeout,
    ]);
    const data = await Promise.race([response.json().catch(() => ({})), timeout]);
    return { response, data };
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

async function defaultFetch(input: string, init: Parameters<RewardFetch>[1]): Promise<FetchResponseLike> {
  if (typeof globalThis.fetch !== "function") throw new Error("fetch_unavailable");
  return globalThis.fetch(input, init);
}

function normalizeInteger(value: unknown, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(0, Math.floor(parsed))) : 0;
}

function responseError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string" && value.error.trim()
    ? value.error.trim().slice(0, 256)
    : fallback;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "request_failed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
