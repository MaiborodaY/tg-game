import { CONTENT_VERSION } from "./game/content.ts";
import { isHeroId } from "./game/heroes.ts";
import {
  parsePlayerProfileTransport,
  serializePlayerProfileTransport,
} from "./game/profileTransport.ts";
import type { PlayerProfileSnapshot } from "./game/profile.ts";
import type { HeroId } from "./game/types.ts";
import {
  sanitizeServerRunBinding,
  type ServerRunBinding,
} from "./game/runBinding.ts";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;
const MAX_PAYLOAD_LENGTH = 32_768;
const MAX_BOOTSTRAP_CACHE_LENGTH = 262_144;
const MAX_SCORE = 2_147_483_647;

export const TOWER_DEFENSE_START_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/start";
export const TOWER_DEFENSE_FINISH_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/finish";
export const TOWER_DEFENSE_RESET_ATTEMPTS_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/td/attempts/reset";
export const MINIAPP_BOOTSTRAP_SESSION_KEY = "td-miniapp-bootstrap-v2";
export const MINIAPP_REWARD_SESSION_KEY = "td-miniapp-reward-v1";
// The server keeps a run for 120 minutes; the client stops reusing it well before that boundary.
export const MINIAPP_REWARD_TTL_MS = 90 * 60_000;

export type TelegramPayload = Record<string, unknown>;

export type RewardLaunch = Readonly<{
  mode: "local" | "server";
  runId: string | null;
  token: string | null;
  runNumber: number | null;
  finishUrl: string | null;
}>;

export type ServerRewardLaunch = Readonly<{
  mode: "server";
  runId: string;
  token: string;
  runNumber: number;
  finishUrl: string;
}>;

export type MiniAppBootstrap = Readonly<{
  reward: ServerRewardLaunch;
  resumed: boolean;
  expiresAt: number;
  binding: ServerRunBinding;
  profile: PlayerProfileSnapshot;
}>;

export type LaunchParams = Readonly<{
  payload: TelegramPayload | null;
  reward: RewardLaunch;
  rewardError: "invalid_launch" | null;
}>;

export type FinalResult = Readonly<{ score: number; durationMs: number }>;
export type FinishOutcome = "defeat" | "victory";
export type FinishMetadata = Readonly<{
  outcome: FinishOutcome;
  completedWaves: number;
  heroId: HeroId | null;
}>;
export type FinishSubmission = FinalResult & FinishMetadata;
export type FinishResult = Readonly<{
  mode: "local" | "server";
  ok: boolean;
  duplicate: boolean;
  error: string | null;
  profile: PlayerProfileSnapshot | null;
  profileSync: "applied" | "pending" | null;
}>;

type FetchResponseLike = { ok: boolean; status?: number; json(): Promise<unknown> };
export type RewardFetch = (input: string, init: {
  method: "POST";
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
}) => Promise<FetchResponseLike>;

export type RewardSessionStorage = Readonly<{
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}>;

export type RewardFinisher = Readonly<{
  finalResult: FinalResult;
  finishMetadata: FinishMetadata | null;
  readonly status: "local" | "idle" | "pending" | "profile_pending" | "succeeded";
  readonly attempts: number;
  finish(): Promise<FinishResult>;
}>;
export type RewardLaunchDecision = Readonly<
  | { kind: "legacy"; reward: RewardLaunch }
  | { kind: "practice"; reward: RewardLaunch }
  | { kind: "miniapp"; initData: string }
  | { kind: "error"; error: "invalid_launch" }
>;

export type MiniAppStartResult = Readonly<
  | { ok: true; reward: ServerRewardLaunch; bootstrap: MiniAppBootstrap }
  | { ok: false; error: string; canResetAttempts?: true }
>;
export type DailyAttemptsResetResult = Readonly<
  | { ok: true }
  | { ok: false; error: string }
>;

type RequestOptions = { fetch?: RewardFetch; timeoutMs?: number };
export type MiniAppStartOptions = RequestOptions & Readonly<{
  resumeRunId?: string | null;
  now?: () => number;
}>;

export function parseLaunchParams(source: string | URLSearchParams, baseUrl?: string): LaunchParams {
  const { params, effectiveBaseUrl } = readSearchParams(source, baseUrl);
  const payload = decodePayload(params.get("p"));
  const runId = boundedText(params.get("run_id"), 256);
  const token = boundedText(params.get("token"), 4_096);
  const runNumber = positiveInteger(params.get("run_number"));
  const finishUrl = safeHttpUrl(params.get("finish_url"), effectiveBaseUrl);
  const complete = Boolean(runId && token && finishUrl);
  const hasRewardParameters = ["run_id", "token", "finish_url"].some((key) => params.has(key));
  return Object.freeze({
    payload,
    rewardError: hasRewardParameters && !complete ? "invalid_launch" : null,
    reward: Object.freeze(complete
      ? { mode: "server" as const, runId, token, runNumber, finishUrl }
      : { mode: "local" as const, runId: null, token: null, runNumber: null, finishUrl: null }),
  });
}

export function decideRewardLaunch(
  launch: LaunchParams,
  rawInitData: unknown,
): RewardLaunchDecision {
  if (launch.rewardError) return Object.freeze({ kind: "error", error: launch.rewardError });
  if (launch.reward.mode === "server") return Object.freeze({ kind: "legacy", reward: launch.reward });

  const initData = typeof rawInitData === "string" ? boundedText(rawInitData, MAX_PAYLOAD_LENGTH) : null;
  if (!initData) return Object.freeze({ kind: "practice", reward: launch.reward });
  return Object.freeze({ kind: "miniapp", initData });
}

export async function startMiniAppReward(
  initData: string,
  options: MiniAppStartOptions = {},
): Promise<MiniAppStartResult> {
  const boundedInitData = boundedText(initData, MAX_PAYLOAD_LENGTH);
  if (!boundedInitData) {
    return Object.freeze({ ok: false, error: "invalid_start_request" });
  }

  try {
    const resumeRunId = boundedUnknownText(options.resumeRunId, 256);
    const body = JSON.stringify({
      init_data: boundedInitData,
      game_id: "td",
      client_content_version: CONTENT_VERSION,
      ...(resumeRunId ? { resume_run_id: resumeRunId } : {}),
    });
    const { response, data } = await postJson(TOWER_DEFENSE_START_URL, body, options);
    if (!response.ok) {
      if (isRecord(data) && data.code === "daily_attempt_limit") {
        return Object.freeze({
          ok: false,
          error: "daily_attempt_limit",
          ...(data.can_reset_attempts === true ? { canResetAttempts: true as const } : {}),
        });
      }
      return Object.freeze({ ok: false, error: "http_" + (response.status || 0) });
    }
    const bootstrap = parseMiniAppBootstrapResponse(data);
    const now = readNow(options.now);
    return bootstrap && bootstrap.expiresAt > now
      ? Object.freeze({ ok: true, reward: bootstrap.reward, bootstrap })
      : Object.freeze({ ok: false, error: responseError(data, "start_rejected") });
  } catch (error: unknown) {
    return Object.freeze({ ok: false, error: errorMessage(error) });
  }
}

export async function resetMiniAppDailyAttempts(
  initData: string,
  options: RequestOptions = {},
): Promise<DailyAttemptsResetResult> {
  const boundedInitData = boundedText(initData, MAX_PAYLOAD_LENGTH);
  if (!boundedInitData) return Object.freeze({ ok: false, error: "invalid_reset_request" });

  try {
    const { response, data } = await postJson(
      TOWER_DEFENSE_RESET_ATTEMPTS_URL,
      JSON.stringify({ init_data: boundedInitData }),
      options,
    );
    if (!response.ok) {
      return Object.freeze({ ok: false, error: "http_" + (response.status || 0) });
    }
    return isRecord(data) && data.ok === true && data.code === "daily_attempts_reset"
      ? Object.freeze({ ok: true })
      : Object.freeze({ ok: false, error: "reset_rejected" });
  } catch (error: unknown) {
    return Object.freeze({ ok: false, error: errorMessage(error) });
  }
}

export function loadMiniAppBootstrap(
  storage: RewardSessionStorage | null | undefined,
  now = Date.now(),
): MiniAppBootstrap | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(MINIAPP_BOOTSTRAP_SESSION_KEY);
    if (!raw || raw.length > MAX_BOOTSTRAP_CACHE_LENGTH) {
      if (raw) storage.removeItem(MINIAPP_BOOTSTRAP_SESSION_KEY);
      return null;
    }
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value)) {
      storage.removeItem(MINIAPP_BOOTSTRAP_SESSION_KEY);
      return null;
    }
    const savedAt = positiveInteger(value.saved_at);
    const age = savedAt === null ? Number.POSITIVE_INFINITY : now - savedAt;
    const bootstrap = parseMiniAppBootstrapResponse({ ...value, ok: true });
    if (
      !bootstrap
      || age < 0
      || age >= MINIAPP_REWARD_TTL_MS
      || bootstrap.expiresAt <= now
    ) {
      storage.removeItem(MINIAPP_BOOTSTRAP_SESSION_KEY);
      return null;
    }
    return bootstrap;
  } catch {
    try { storage.removeItem(MINIAPP_BOOTSTRAP_SESSION_KEY); } catch { /* session storage is optional */ }
    return null;
  }
}

export function saveMiniAppBootstrap(
  storage: RewardSessionStorage | null | undefined,
  bootstrap: MiniAppBootstrap,
  now = Date.now(),
): boolean {
  const transport = serializeMiniAppBootstrap(bootstrap);
  if (!storage || !transport || bootstrap.expiresAt <= now) return false;
  try {
    storage.setItem(MINIAPP_BOOTSTRAP_SESSION_KEY, JSON.stringify({
      saved_at: Math.max(1, Math.floor(now)),
      ...transport,
    }));
  } catch {
    return false;
  }
  try { storage.removeItem(MINIAPP_REWARD_SESSION_KEY); } catch { /* legacy cleanup is optional */ }
  return true;
}

export function replaceMiniAppBootstrap(
  storage: RewardSessionStorage | null | undefined,
  bootstrap: MiniAppBootstrap,
  now = Date.now(),
): boolean {
  const saved = saveMiniAppBootstrap(storage, bootstrap, now);
  // Never leave a known-stale finish token behind when replacement storage fails.
  if (!saved) clearMiniAppReward(storage);
  return saved;
}

export function clearMiniAppBootstrap(storage: RewardSessionStorage | null | undefined): void {
  try { storage?.removeItem(MINIAPP_BOOTSTRAP_SESSION_KEY); } catch { /* session storage is optional */ }
}

export function loadMiniAppReward(
  storage: RewardSessionStorage | null | undefined,
  now = Date.now(),
): RewardLaunch | null {
  if (!storage) return null;
  const bootstrap = loadMiniAppBootstrap(storage, now);
  if (bootstrap) return bootstrap.reward;
  try {
    const raw = storage.getItem(MINIAPP_REWARD_SESSION_KEY);
    if (!raw || raw.length > 8_192) {
      if (raw) storage.removeItem(MINIAPP_REWARD_SESSION_KEY);
      return null;
    }
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value)) {
      storage.removeItem(MINIAPP_REWARD_SESSION_KEY);
      return null;
    }
    const savedAt = positiveInteger(value.saved_at);
    const age = savedAt === null ? Number.POSITIVE_INFINITY : now - savedAt;
    const reward = parseMiniAppRewardFields({ ...value, ok: true });
    if (!reward || age < 0 || age >= MINIAPP_REWARD_TTL_MS) {
      storage.removeItem(MINIAPP_REWARD_SESSION_KEY);
      return null;
    }
    return reward;
  } catch {
    try { storage.removeItem(MINIAPP_REWARD_SESSION_KEY); } catch { /* session storage is optional */ }
    return null;
  }
}

export function saveMiniAppReward(
  storage: RewardSessionStorage | null | undefined,
  reward: RewardLaunch,
  now = Date.now(),
): boolean {
  const validated = reward.mode === "server"
    ? parseMiniAppRewardFields({
      ok: true,
      game_id: "td",
      run_id: reward.runId,
      token: reward.token,
      run_number: reward.runNumber,
      finish_url: reward.finishUrl,
    })
    : null;
  if (!storage || !validated) return false;
  try {
    storage.setItem(MINIAPP_REWARD_SESSION_KEY, JSON.stringify({
      saved_at: Math.max(1, Math.floor(now)),
      game_id: "td",
      run_id: validated.runId,
      token: validated.token,
      run_number: validated.runNumber,
      finish_url: validated.finishUrl,
    }));
  } catch {
    return false;
  }
  clearMiniAppBootstrap(storage);
  return true;
}

export function clearMiniAppReward(storage: RewardSessionStorage | null | undefined): void {
  clearMiniAppBootstrap(storage);
  try { storage?.removeItem(MINIAPP_REWARD_SESSION_KEY); } catch { /* session storage is optional */ }
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

export function captureFinishSubmission(
  score: unknown,
  durationMs: unknown,
  outcome: FinishOutcome,
  completedWaves: unknown,
  heroId: unknown = null,
): FinishSubmission {
  if (outcome !== "defeat" && outcome !== "victory") throw new Error("Invalid finish outcome.");
  if (heroId !== null && !isHeroId(heroId)) throw new Error("Invalid finish hero.");
  return Object.freeze({
    ...captureFinalResult(score, durationMs),
    outcome,
    completedWaves: normalizeInteger(completedWaves, MAX_SCORE),
    heroId,
  });
}

export function createRewardFinisher(
  reward: RewardLaunch,
  finalResult: FinalResult | FinishSubmission,
  options: RequestOptions = {},
): RewardFinisher {
  const capturedReward = Object.freeze({ ...reward });
  const capturedResult = captureFinalResult(finalResult.score, finalResult.durationMs);
  const finishMetadata = readFinishMetadata(finalResult);
  const hasInvalidMetadata = hasFinishMetadataFields(finalResult) && !finishMetadata;
  const localResult = Object.freeze({
    mode: "local" as const,
    ok: true,
    duplicate: false,
    error: null,
    profile: null,
    profileSync: null,
  });
  let status: RewardFinisher["status"] = reward.mode === "server" ? "idle" : "local";
  let attempts = 0;
  let pending: Promise<FinishResult> | null = null;
  let succeeded: FinishResult | null = null;

  const finish = async (): Promise<FinishResult> => {
    if (capturedReward.mode !== "server" || !capturedReward.runId || !capturedReward.token || !capturedReward.finishUrl) {
      return localResult;
    }
    if (hasInvalidMetadata) return finishFailure("invalid_finish_metadata");
    if (succeeded) return succeeded;
    if (pending) return pending;

    attempts += 1;
    status = "pending";
    const body = JSON.stringify({
      run_id: capturedReward.runId,
      token: capturedReward.token,
      score: capturedResult.score,
      duration_ms: capturedResult.durationMs,
      ...(finishMetadata ? {
        outcome: finishMetadata.outcome,
        completed_waves: finishMetadata.completedWaves,
        ...(finishMetadata.heroId ? { hero_id: finishMetadata.heroId } : {}),
      } : {}),
    });
    pending = postJson(capturedReward.finishUrl, body, options)
      .then(({ response, data }) => {
        const duplicate = isRecord(data) && data.duplicate === true;
        const accepted = duplicate || (response.ok && isRecord(data) && data.ok === true);
        if (!accepted) {
          status = "idle";
          return finishFailure(response.ok ? responseError(data, "finish_rejected") : `http_${response.status || 0}`);
        }
        const profileEnvelope = parseFinishProfileEnvelope(data);
        if (!profileEnvelope.ok) {
          status = "idle";
          return finishFailure(profileEnvelope.error);
        }
        const acceptedResult: FinishResult = Object.freeze({
          mode: "server",
          ok: true,
          duplicate,
          error: null,
          profile: profileEnvelope.profile,
          profileSync: profileEnvelope.profileSync,
        });
        if (profileEnvelope.profileSync === "pending") {
          status = "profile_pending";
          return acceptedResult;
        }
        succeeded = acceptedResult;
        status = "succeeded";
        return succeeded;
      })
      .catch((error: unknown) => {
        status = "idle";
        return finishFailure(errorMessage(error));
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  };

  return Object.freeze({
    finalResult: capturedResult,
    finishMetadata,
    get status() { return status; },
    get attempts() { return attempts; },
    finish,
  });
}

function readFinishMetadata(value: FinalResult | FinishSubmission): FinishMetadata | null {
  if (!("outcome" in value) || !("completedWaves" in value)) return null;
  if (value.outcome !== "defeat" && value.outcome !== "victory") return null;
  if (!Number.isSafeInteger(value.completedWaves) || value.completedWaves < 0 || value.completedWaves > MAX_SCORE) return null;
  if (!("heroId" in value) || value.heroId !== null && !isHeroId(value.heroId)) return null;
  return Object.freeze({ outcome: value.outcome, completedWaves: value.completedWaves, heroId: value.heroId });
}

function hasFinishMetadataFields(value: FinalResult | FinishSubmission): boolean {
  return "outcome" in value || "completedWaves" in value || "heroId" in value;
}

function finishFailure(error: string): FinishResult {
  return Object.freeze({
    mode: "server",
    ok: false,
    duplicate: false,
    error,
    profile: null,
    profileSync: null,
  });
}

function parseFinishProfileEnvelope(value: unknown): Readonly<
  | {
      ok: true;
      profile: PlayerProfileSnapshot | null;
      profileSync: "applied" | "pending" | null;
    }
  | { ok: false; error: "invalid_profile" | "invalid_profile_sync" }
> {
  if (!isRecord(value)) return Object.freeze({ ok: true, profile: null, profileSync: null });
  const hasProfile = Object.hasOwn(value, "profile");
  const hasProfileSync = Object.hasOwn(value, "profile_sync");
  if (!hasProfile && !hasProfileSync) {
    return Object.freeze({ ok: true, profile: null, profileSync: null });
  }
  if (!hasProfileSync || (value.profile_sync !== "applied" && value.profile_sync !== "pending")) {
    return Object.freeze({ ok: false, error: "invalid_profile_sync" });
  }

  if (value.profile_sync === "pending") {
    const profile = hasProfile ? parsePlayerProfileTransport(value.profile) : null;
    return Object.freeze({ ok: true, profile, profileSync: "pending" });
  }

  const profile = hasProfile ? parsePlayerProfileTransport(value.profile) : null;
  return profile
    ? Object.freeze({ ok: true, profile, profileSync: "applied" })
    : Object.freeze({ ok: false, error: "invalid_profile" });
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

function parseMiniAppBootstrapResponse(value: unknown): MiniAppBootstrap | null {
  if (!isRecord(value)) return null;
  const reward = parseMiniAppRewardFields(value);
  const expiresAt = positiveInteger(value.expires_at);
  const binding = parseServerRunBindingTransport(value.binding);
  const profile = parsePlayerProfileTransport(value.profile);
  if (!reward || typeof value.resumed !== "boolean" || expiresAt === null || !binding || !profile) return null;
  if (!profile.unlockedLevelIds.includes(binding.levelId)) return null;
  return Object.freeze({ reward, resumed: value.resumed, expiresAt, binding, profile });
}

function parseMiniAppRewardFields(value: unknown): ServerRewardLaunch | null {
  if (!isRecord(value) || value.ok !== true || value.game_id !== "td") return null;
  const runId = boundedUnknownText(value.run_id, 256);
  const token = boundedUnknownText(value.token, 4_096);
  const runNumber = positiveInteger(value.run_number);
  const finishUrl = safeHttpUrl(typeof value.finish_url === "string" ? value.finish_url : null);
  return runId && token && runNumber !== null && finishUrl === TOWER_DEFENSE_FINISH_URL
    ? Object.freeze({ mode: "server", runId, token, runNumber, finishUrl: TOWER_DEFENSE_FINISH_URL })
    : null;
}

function parseServerRunBindingTransport(value: unknown): ServerRunBinding | null {
  if (!isRecord(value) || !hasExactKeys(value, ["content_version", "level_id", "mode_id"])) return null;
  return sanitizeServerRunBinding({
    contentVersion: value.content_version,
    levelId: value.level_id,
    modeId: value.mode_id,
  });
}

function serializeMiniAppBootstrap(bootstrap: MiniAppBootstrap): Record<string, unknown> | null {
  const reward = bootstrap.reward;
  const binding = sanitizeServerRunBinding(bootstrap.binding);
  const profile = serializePlayerProfileTransport(bootstrap.profile);
  const expiresAt = positiveInteger(bootstrap.expiresAt);
  if (
    !reward
    || reward.mode !== "server"
    || typeof bootstrap.resumed !== "boolean"
    || !binding
    || !profile
    || expiresAt === null
  ) return null;
  const validatedReward = parseMiniAppRewardFields({
    ok: true,
    game_id: "td",
    run_id: reward.runId,
    token: reward.token,
    run_number: reward.runNumber,
    finish_url: reward.finishUrl,
  });
  if (!validatedReward) return null;
  return {
    game_id: "td",
    run_id: validatedReward.runId,
    token: validatedReward.token,
    run_number: validatedReward.runNumber,
    finish_url: validatedReward.finishUrl,
    resumed: bootstrap.resumed,
    expires_at: expiresAt,
    binding: {
      content_version: binding.contentVersion,
      level_id: binding.levelId,
      mode_id: binding.modeId,
    },
    profile,
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

function boundedUnknownText(value: unknown, maxLength: number): string | null {
  return typeof value === "string" ? boundedText(value, maxLength) : null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && /^\d+$/.test(value.trim())
      ? Number(value)
      : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
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

function readNow(source: (() => number) | undefined): number {
  const value = source ? source() : Date.now();
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : Date.now();
}

function responseError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string" && value.error.trim()
    ? value.error.trim().slice(0, 256)
    : fallback;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "request_failed";
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
