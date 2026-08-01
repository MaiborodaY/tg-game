import {
  CONTENT_VERSION,
  ENDLESS_MODE_ID,
  getLevelDefinition,
  getModeRuleset,
} from "./game/content.ts";
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
export const RANKED_RUN_CONTRACT_VERSION = 3 as const;

export const TOWER_DEFENSE_START_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/start";
export const TOWER_DEFENSE_FINISH_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/finish";
export const TOWER_DEFENSE_BOOTSTRAP_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/td/bootstrap";
export const TOWER_DEFENSE_CHECKPOINT_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/td/checkpoint";
export const TOWER_DEFENSE_RESTART_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/td/restart";
export const TOWER_DEFENSE_RESET_ATTEMPTS_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/td/attempts/reset";
export const TOWER_DEFENSE_PURCHASE_ATTEMPTS_URL = "https://work-bot.mr-maybik.workers.dev/api/minigames/td/attempts/purchase";
export const MINIAPP_BOOTSTRAP_SESSION_KEY = "td-miniapp-bootstrap-v2";
export const MINIAPP_REWARD_SESSION_KEY = "td-miniapp-reward-v1";
export const MINIAPP_ATTEMPT_PURCHASE_SESSION_KEY = "td-attempt-purchase-request-v1";
// Campaign is the shortest server run at 120 minutes; cached credentials expire earlier.
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
  runContractVersion: 2 | typeof RANKED_RUN_CONTRACT_VERSION;
  profile: PlayerProfileSnapshot;
  runRevision: number | null;
  heroId: HeroId | null;
  confirmedWave: number;
  checkpointUrl: string | null;
  restartUrl: string | null;
}>;

export type MiniAppActiveRun = Readonly<{
  runId: string;
  expiresAt: number;
  runRevision: number;
  heroId: HeroId;
  confirmedWave: number;
  binding: ServerRunBinding;
  runContractVersion: 2 | typeof RANKED_RUN_CONTRACT_VERSION;
}>;

export type MiniAppProfileBootstrap = Readonly<{
  profile: PlayerProfileSnapshot;
  activeRun: MiniAppActiveRun | null;
}>;

export type MiniAppRunSelection = Readonly<{
  levelId: string;
  modeId: string;
  heroId: HeroId;
}>;

export type LaunchParams = Readonly<{
  payload: TelegramPayload | null;
  reward: RewardLaunch;
  rewardError: "invalid_launch" | null;
}>;

export type FinalResult = Readonly<{ score: number; durationMs: number }>;
export type FinishOutcome = "defeat" | "victory" | "retired";

export function normalizeFinishOutcome(
  modeId: string,
  outcome: FinishOutcome | "gameover",
): FinishOutcome {
  if (outcome === "gameover") return "defeat";
  return modeId === ENDLESS_MODE_ID && outcome === "victory" ? "retired" : outcome;
}
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

export type AttemptPurchaseOffer = Readonly<{
  attempts: number;
  priceCrystals: number;
  balanceCrystals: number;
}>;

export type MiniAppStartResult = Readonly<
  | { ok: true; reward: ServerRewardLaunch; bootstrap: MiniAppBootstrap }
  | { ok: false; error: string; canResetAttempts?: true; attemptPurchase?: AttemptPurchaseOffer }
>;
export type DailyAttemptsResetResult = Readonly<
  | { ok: true }
  | { ok: false; error: string }
>;
export type DailyAttemptsPurchaseResult = Readonly<
  | {
    ok: true;
    purchaseId: string;
    attemptsAdded: number;
    crystalsSpent: number;
    crystalBalance: number;
    duplicate: boolean;
  }
  | { ok: false; error: string; crystalBalance?: number }
>;

export type AttemptPurchaseRequestIdLifecycle = "clear" | "retain";
export type DailyAttemptLimitPrimaryAction = "admin_reset" | "purchase_offer" | "blocked";

export function decideAttemptPurchaseRequestIdLifecycle(
  result: DailyAttemptsPurchaseResult,
): AttemptPurchaseRequestIdLifecycle {
  if (result.ok) return "clear";
  return ["not_enough_crystals", "attempts_available", "request_conflict", "invalid_purchase_request"].includes(result.error)
    ? "clear"
    : "retain";
}

export function decideDailyAttemptLimitPrimaryAction({
  canResetAttempts,
  hasPurchaseOffer,
}: Readonly<{
  canResetAttempts: boolean;
  hasPurchaseOffer: boolean;
}>): DailyAttemptLimitPrimaryAction {
  if (canResetAttempts) return "admin_reset";
  if (hasPurchaseOffer) return "purchase_offer";
  return "blocked";
}

export async function executeDailyAttemptLimitPrimaryAction({
  canResetAttempts,
  hasPurchaseOffer,
  onAdminReset,
  onPurchaseOffer,
}: Readonly<{
  canResetAttempts: boolean;
  hasPurchaseOffer: boolean;
  onAdminReset: () => void | Promise<void>;
  onPurchaseOffer: () => void | Promise<void>;
}>): Promise<DailyAttemptLimitPrimaryAction> {
  const action = decideDailyAttemptLimitPrimaryAction({ canResetAttempts, hasPurchaseOffer });
  if (action === "admin_reset") await onAdminReset();
  if (action === "purchase_offer") await onPurchaseOffer();
  return action;
}

type RequestOptions = { fetch?: RewardFetch; timeoutMs?: number };
export type RewardFinisherOptions = RequestOptions & Readonly<{ runRevision?: number | null }>;
export type MiniAppStartOptions = RequestOptions & Readonly<{
  resumeRunId?: string | null;
  selection?: MiniAppRunSelection | null;
  now?: () => number;
}>;

export type MiniAppProfileResult = Readonly<
  | { ok: true; bootstrap: MiniAppProfileBootstrap }
  | { ok: false; error: string }
>;

export type MiniAppCheckpointResult = Readonly<
  | { ok: true; replayed: boolean; runRevision: number; confirmedWave: number }
  | { ok: false; error: string; retryAfterMs?: number }
>;

export type MiniAppRunRestartResult = Readonly<
  | { ok: true; bootstrap: MiniAppBootstrap }
  | { ok: false; error: string }
>;

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

export async function fetchMiniAppProfile(
  initData: string,
  options: RequestOptions = {},
): Promise<MiniAppProfileResult> {
  const boundedInitData = boundedText(initData, MAX_PAYLOAD_LENGTH);
  if (!boundedInitData) return Object.freeze({ ok: false, error: "invalid_bootstrap_request" });

  try {
    const { response, data } = await postJson(
      TOWER_DEFENSE_BOOTSTRAP_URL,
      JSON.stringify({ init_data: boundedInitData }),
      options,
    );
    if (!response.ok) return Object.freeze({ ok: false, error: "http_" + (response.status || 0) });
    const bootstrap = parseMiniAppProfileBootstrapResponse(data);
    return bootstrap
      ? Object.freeze({ ok: true, bootstrap })
      : Object.freeze({ ok: false, error: responseError(data, "bootstrap_rejected") });
  } catch (error: unknown) {
    return Object.freeze({ ok: false, error: errorMessage(error) });
  }
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
    const selection = sanitizeMiniAppRunSelection(options.selection);
    if (options.selection && !selection) {
      return Object.freeze({ ok: false, error: "invalid_start_selection" });
    }
    const body = JSON.stringify({
      init_data: boundedInitData,
      game_id: "td",
      client_content_version: CONTENT_VERSION,
      client_protocol_version: RANKED_RUN_CONTRACT_VERSION,
      ...(selection ? {
        level_id: selection.levelId,
        mode_id: selection.modeId,
        hero_id: selection.heroId,
      } : {}),
      ...(resumeRunId ? { resume_run_id: resumeRunId } : {}),
    });
    const { response, data } = await postJson(TOWER_DEFENSE_START_URL, body, options);
    if (!response.ok) {
      if (isRecord(data) && data.code === "daily_attempt_limit") {
        const attemptPurchase = parseAttemptPurchaseOffer(data.attempt_purchase);
        return Object.freeze({
          ok: false,
          error: "daily_attempt_limit",
          ...(data.can_reset_attempts === true ? { canResetAttempts: true as const } : {}),
          ...(attemptPurchase ? { attemptPurchase } : {}),
        });
      }
      const code = isRecord(data) ? boundedUnknownText(data.code, 128) : null;
      if (code) return Object.freeze({ ok: false, error: code });
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

export async function recordMiniAppCheckpoint(
  initData: string,
  bootstrap: MiniAppBootstrap,
  completedWave: number,
  options: RequestOptions = {},
): Promise<MiniAppCheckpointResult> {
  const boundedInitData = boundedText(initData, MAX_PAYLOAD_LENGTH);
  const runRevision = positiveInteger(bootstrap.runRevision);
  const wave = nonNegativeInteger(completedWave);
  if (
    !boundedInitData
    || bootstrap.runContractVersion !== RANKED_RUN_CONTRACT_VERSION
    || bootstrap.checkpointUrl !== TOWER_DEFENSE_CHECKPOINT_URL
    || runRevision === null
    || wave === null
  ) return Object.freeze({ ok: false, error: "invalid_checkpoint_request" });

  try {
    const { response, data } = await postJson(
      TOWER_DEFENSE_CHECKPOINT_URL,
      JSON.stringify({
        init_data: boundedInitData,
        run_id: bootstrap.reward.runId,
        token: bootstrap.reward.token,
        run_revision: runRevision,
        completed_wave: wave,
      }),
      options,
    );
    if (response.ok && isRecord(data) && data.ok === true) {
      const confirmedWave = nonNegativeInteger(data.confirmed_wave);
      const confirmedRevision = positiveInteger(data.run_revision);
      if (
        (data.code !== "checkpoint_recorded" && data.code !== "checkpoint_replayed")
        || confirmedWave === null
        || confirmedRevision !== runRevision
        || confirmedWave !== wave
      ) return Object.freeze({ ok: false, error: "checkpoint_rejected" });
      return Object.freeze({
        ok: true,
        replayed: data.code === "checkpoint_replayed",
        runRevision: confirmedRevision,
        confirmedWave,
      });
    }
    const error = isRecord(data) ? boundedUnknownText(data.code, 128) : null;
    const retryAfterMs = isRecord(data) ? nonNegativeInteger(data.retry_after_ms) : null;
    return Object.freeze({
      ok: false,
      error: error ?? (response.ok ? "checkpoint_rejected" : "http_" + (response.status || 0)),
      ...(retryAfterMs === null ? {} : { retryAfterMs: Math.min(retryAfterMs, MAX_TIMEOUT_MS) }),
    });
  } catch (error: unknown) {
    return Object.freeze({ ok: false, error: errorMessage(error) });
  }
}

export async function restartMiniAppRun(
  initData: string,
  bootstrap: MiniAppBootstrap,
  heroId: HeroId,
  options: RequestOptions & Readonly<{ now?: () => number }> = {},
): Promise<MiniAppRunRestartResult> {
  const boundedInitData = boundedText(initData, MAX_PAYLOAD_LENGTH);
  const runRevision = positiveInteger(bootstrap.runRevision);
  if (
    !boundedInitData
    || !isHeroId(heroId)
    || bootstrap.runContractVersion !== RANKED_RUN_CONTRACT_VERSION
    || bootstrap.restartUrl !== TOWER_DEFENSE_RESTART_URL
    || runRevision === null
  ) return Object.freeze({ ok: false, error: "invalid_restart_request" });

  try {
    const { response, data } = await postJson(
      TOWER_DEFENSE_RESTART_URL,
      JSON.stringify({
        init_data: boundedInitData,
        run_id: bootstrap.reward.runId,
        token: bootstrap.reward.token,
        run_revision: runRevision,
        hero_id: heroId,
      }),
      options,
    );
    if (!response.ok) {
      const code = isRecord(data) ? boundedUnknownText(data.code, 128) : null;
      return Object.freeze({ ok: false, error: code ?? "http_" + (response.status || 0) });
    }
    const restarted = parseRestartedBootstrapResponse(data, bootstrap);
    const now = readNow(options.now);
    return restarted && restarted.expiresAt > now
      ? Object.freeze({ ok: true, bootstrap: restarted })
      : Object.freeze({ ok: false, error: responseError(data, "restart_rejected") });
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

export async function purchaseMiniAppDailyAttempts(
  initData: string,
  requestId: string,
  options: RequestOptions = {},
): Promise<DailyAttemptsPurchaseResult> {
  const boundedInitData = boundedText(initData, MAX_PAYLOAD_LENGTH);
  const boundedRequestId = readPurchaseRequestId(requestId);
  if (!boundedInitData || !boundedRequestId) {
    return Object.freeze({ ok: false, error: "invalid_purchase_request" });
  }

  try {
    const { response, data } = await postJson(
      TOWER_DEFENSE_PURCHASE_ATTEMPTS_URL,
      JSON.stringify({ init_data: boundedInitData, request_id: boundedRequestId }),
      options,
    );
    const success = parseAttemptPurchaseSuccess(data);
    if (response.ok && success) return success;
    if (isRecord(data)) {
      const error = boundedUnknownText(data.code, 128);
      if (error === "not_enough_crystals") {
        const crystalBalance = nonNegativeInteger(data.crystal_balance);
        return Object.freeze({
          ok: false,
          error,
          ...(crystalBalance === null ? {} : { crystalBalance }),
        });
      }
      if ([
        "attempts_available",
        "purchase_in_progress",
        "profile_sync_pending",
        "request_conflict",
        "invalid_purchase_request",
        "purchase_unavailable",
      ].includes(error ?? "")) {
        return Object.freeze({ ok: false, error: error! });
      }
    }
    return Object.freeze({
      ok: false,
      error: response.ok ? "purchase_rejected" : "http_" + (response.status || 0),
    });
  } catch (error: unknown) {
    return Object.freeze({ ok: false, error: errorMessage(error) });
  }
}

export function getOrCreateAttemptPurchaseRequestId(
  storage: RewardSessionStorage | null | undefined,
  createRequestId: () => string | null = createSecureRequestId,
): string | null {
  if (!storage) return null;
  try {
    const existing = readPurchaseRequestId(storage.getItem(MINIAPP_ATTEMPT_PURCHASE_SESSION_KEY));
    if (existing) return existing;
    const created = readPurchaseRequestId(createRequestId());
    if (!created) return null;
    storage.setItem(MINIAPP_ATTEMPT_PURCHASE_SESSION_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function clearAttemptPurchaseRequestId(
  storage: RewardSessionStorage | null | undefined,
): void {
  try { storage?.removeItem(MINIAPP_ATTEMPT_PURCHASE_SESSION_KEY); } catch { /* session storage is optional */ }
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
  if (outcome !== "defeat" && outcome !== "victory" && outcome !== "retired") {
    throw new Error("Invalid finish outcome.");
  }
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
  options: RewardFinisherOptions = {},
): RewardFinisher {
  const capturedReward = Object.freeze({ ...reward });
  const capturedResult = captureFinalResult(finalResult.score, finalResult.durationMs);
  const capturedRunRevision = positiveInteger(options.runRevision);
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
      ...(capturedRunRevision === null ? {} : { run_revision: capturedRunRevision }),
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
  if (value.outcome !== "defeat" && value.outcome !== "victory" && value.outcome !== "retired") return null;
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
  const runContractVersion = readRunContractVersion(value.run_contract_version, 2);
  if (runContractVersion === null) return null;
  if (runContractVersion === 2) {
    return Object.freeze({
      reward,
      resumed: value.resumed,
      expiresAt,
      binding,
      runContractVersion,
      profile,
      runRevision: null,
      heroId: null,
      confirmedWave: 0,
      checkpointUrl: null,
      restartUrl: null,
    });
  }

  const runRevision = positiveInteger(value.run_revision);
  const heroId = isHeroId(value.hero_id) ? value.hero_id : null;
  const confirmedWave = nonNegativeInteger(value.confirmed_wave);
  const checkpointUrl = safeHttpUrl(typeof value.checkpoint_url === "string" ? value.checkpoint_url : null);
  const restartUrl = safeHttpUrl(typeof value.restart_url === "string" ? value.restart_url : null);
  if (
    runRevision === null
    || !heroId
    || confirmedWave === null
    || checkpointUrl !== TOWER_DEFENSE_CHECKPOINT_URL
    || restartUrl !== TOWER_DEFENSE_RESTART_URL
  ) return null;
  return Object.freeze({
    reward,
    resumed: value.resumed,
    expiresAt,
    binding,
    runContractVersion,
    profile,
    runRevision,
    heroId,
    confirmedWave,
    checkpointUrl: TOWER_DEFENSE_CHECKPOINT_URL,
    restartUrl: TOWER_DEFENSE_RESTART_URL,
  });
}

function parseMiniAppProfileBootstrapResponse(value: unknown): MiniAppProfileBootstrap | null {
  if (
    !isRecord(value)
    || value.ok !== true
    || value.game_id !== "td"
    || value.content_version !== CONTENT_VERSION
    || value.run_contract_version !== RANKED_RUN_CONTRACT_VERSION
  ) {
    return null;
  }
  const profile = parsePlayerProfileTransport(value.profile);
  if (!profile) return null;
  if (value.active_run === null) return Object.freeze({ profile, activeRun: null });
  if (!isRecord(value.active_run)) return null;

  const runId = boundedUnknownText(value.active_run.run_id, 256);
  const expiresAt = positiveInteger(value.active_run.expires_at);
  const runRevision = positiveInteger(value.active_run.run_revision);
  const heroId = isHeroId(value.active_run.hero_id) ? value.active_run.hero_id : null;
  const confirmedWave = nonNegativeInteger(value.active_run.confirmed_wave);
  const runContractVersion = readRunContractVersion(value.active_run.run_contract_version, 2);
  const binding = parseServerRunBindingTransport(value.active_run.binding);
  if (
    !runId
    || expiresAt === null
    || runRevision === null
    || !heroId
    || confirmedWave === null
    || runContractVersion === null
    || !binding
  ) return null;
  if (!profile.unlockedLevelIds.includes(binding.levelId)) return null;
  return Object.freeze({
    profile,
    activeRun: Object.freeze({
      runId,
      expiresAt,
      runRevision,
      heroId,
      confirmedWave,
      binding,
      runContractVersion,
    }),
  });
}

function parseRestartedBootstrapResponse(
  value: unknown,
  previous: MiniAppBootstrap,
): MiniAppBootstrap | null {
  if (!isRecord(value) || value.ok !== true || value.code !== "run_restarted") return null;
  const runId = boundedUnknownText(value.run_id, 256);
  const token = boundedUnknownText(value.token, 4_096);
  const runRevision = positiveInteger(value.run_revision);
  const runContractVersion = readRunContractVersion(value.run_contract_version, null);
  const heroId = isHeroId(value.hero_id) ? value.hero_id : null;
  const confirmedWave = nonNegativeInteger(value.confirmed_wave);
  const expiresAt = positiveInteger(value.expires_at);
  const binding = parseServerRunBindingTransport(value.binding);
  const profile = parsePlayerProfileTransport(value.profile);
  if (
    runId !== previous.reward.runId
    || !token
    || runRevision === null
    || previous.runRevision === null
    || runRevision <= previous.runRevision
    || !heroId
    || confirmedWave !== 0
    || expiresAt === null
    || !binding
    || runContractVersion !== RANKED_RUN_CONTRACT_VERSION
    || binding.levelId !== previous.binding.levelId
    || binding.modeId !== previous.binding.modeId
    || !profile
  ) return null;
  return Object.freeze({
    reward: Object.freeze({ ...previous.reward, token }),
    resumed: true,
    expiresAt,
    binding,
    runContractVersion,
    profile,
    runRevision,
    heroId,
    confirmedWave,
    checkpointUrl: TOWER_DEFENSE_CHECKPOINT_URL,
    restartUrl: TOWER_DEFENSE_RESTART_URL,
  });
}

function parseAttemptPurchaseOffer(value: unknown): AttemptPurchaseOffer | null {
  if (!isRecord(value) || !hasExactKeys(value, ["attempts", "price_crystals", "balance_crystals"])) return null;
  const attempts = positiveInteger(value.attempts);
  const priceCrystals = positiveInteger(value.price_crystals);
  const balanceCrystals = nonNegativeInteger(value.balance_crystals);
  return attempts === 5 && priceCrystals === 5 && balanceCrystals !== null
    ? Object.freeze({ attempts, priceCrystals, balanceCrystals })
    : null;
}

function parseAttemptPurchaseSuccess(value: unknown): DailyAttemptsPurchaseResult | null {
  if (
    !isRecord(value)
    || value.ok !== true
    || value.code !== "daily_attempts_purchased"
    || typeof value.duplicate !== "boolean"
  ) return null;
  const purchaseId = boundedUnknownText(value.purchase_id, 256);
  const attemptsAdded = positiveInteger(value.attempts_added);
  const crystalsSpent = positiveInteger(value.crystals_spent);
  const crystalBalance = nonNegativeInteger(value.crystal_balance);
  return purchaseId && attemptsAdded === 5 && crystalsSpent === 5 && crystalBalance !== null
    ? Object.freeze({
      ok: true,
      purchaseId,
      attemptsAdded,
      crystalsSpent,
      crystalBalance,
      duplicate: value.duplicate,
    })
    : null;
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
  const runRevision = positiveInteger(bootstrap.runRevision);
  const heroId = bootstrap.heroId && isHeroId(bootstrap.heroId) ? bootstrap.heroId : null;
  const confirmedWave = nonNegativeInteger(bootstrap.confirmedWave);
  const runContractVersion = readRunContractVersion(bootstrap.runContractVersion, 2);
  if (runContractVersion === null) return null;
  const rankedV3 = runContractVersion === RANKED_RUN_CONTRACT_VERSION;
  if (
    rankedV3
    && (
      runRevision === null
      || !heroId
      || confirmedWave === null
      || bootstrap.checkpointUrl !== TOWER_DEFENSE_CHECKPOINT_URL
      || bootstrap.restartUrl !== TOWER_DEFENSE_RESTART_URL
    )
  ) return null;
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
    run_contract_version: runContractVersion,
    profile,
    ...(rankedV3 ? {
      run_revision: runRevision,
      hero_id: heroId,
      confirmed_wave: confirmedWave,
      checkpoint_url: TOWER_DEFENSE_CHECKPOINT_URL,
      restart_url: TOWER_DEFENSE_RESTART_URL,
    } : {}),
  };
}

function readRunContractVersion(
  value: unknown,
  fallback: 2 | null,
): 2 | typeof RANKED_RUN_CONTRACT_VERSION | null {
  if (value === 2 || value === RANKED_RUN_CONTRACT_VERSION) return value;
  return value === undefined ? fallback : null;
}

function sanitizeMiniAppRunSelection(value: unknown): MiniAppRunSelection | null {
  if (!isRecord(value) || !isHeroId(value.heroId)) return null;
  if (typeof value.levelId !== "string" || typeof value.modeId !== "string") return null;
  if (!getLevelDefinition(value.levelId) || !getModeRuleset(value.modeId)) return null;
  return Object.freeze({ levelId: value.levelId, modeId: value.modeId, heroId: value.heroId });
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

function nonNegativeInteger(value: unknown): number | null {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && /^\d+$/.test(value.trim())
      ? Number(value)
      : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function readPurchaseRequestId(value: unknown): string | null {
  const candidate = boundedUnknownText(value, 64);
  return candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : null;
}

function createSecureRequestId(): string | null {
  try {
    if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
    if (typeof globalThis.crypto?.getRandomValues !== "function") return null;
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    return null;
  }
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
