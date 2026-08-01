import { HERO_IDS, isHeroId } from "./game/heroes.ts";
import { CAMPAIGN_MODE_ID, ENDLESS_MODE_ID, MAX_ENDLESS_WAVE } from "./game/content.ts";
import type { HeroId } from "./game/types.ts";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;
const MAX_INIT_DATA_LENGTH = 32_768;
const MAX_NAME_LENGTH = 128;
const MAX_ENTRIES = 100;
const CONTENT_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,95}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

const LEGACY_RESPONSE_KEYS = Object.freeze([
  "ok",
  "game_id",
  "level_id",
  "mode_id",
  "max_waves",
  "total_players",
  "entries",
  "me",
] as const);
const RANKED_RESPONSE_KEYS = Object.freeze([...LEGACY_RESPONSE_KEYS, "season_id"] as const);
const LEGACY_ENTRY_KEYS = Object.freeze([
  "rank",
  "name",
  "outcome",
  "completed_waves",
  "duration_ms",
  "is_me",
] as const);
const ENTRY_KEYS = Object.freeze([...LEGACY_ENTRY_KEYS, "hero_wins"] as const);
const RANKED_ENTRY_KEYS = Object.freeze([...ENTRY_KEYS, "hero_id"] as const);
const HERO_WIN_KEYS = Object.freeze(["hero_id", "completions"] as const);

export const TOWER_DEFENSE_LEADERBOARD_URL =
  "https://work-bot.mr-maybik.workers.dev/api/minigames/td/leaderboard";
export const LEADERBOARD_CACHE_TTL_MS = 30_000;

export type LeaderboardOutcome = "defeat" | "victory";
export type LeaderboardModeId = typeof CAMPAIGN_MODE_ID | typeof ENDLESS_MODE_ID;

export type LeaderboardHeroWin = Readonly<{
  heroId: HeroId;
  completions: number;
}>;
const EMPTY_HERO_WINS: readonly LeaderboardHeroWin[] = Object.freeze([]);

export type LeaderboardEntry = Readonly<{
  rank: number;
  name: string | null;
  outcome: LeaderboardOutcome;
  completedWaves: number;
  durationMs: number | null;
  heroWins: readonly LeaderboardHeroWin[];
  heroId: HeroId | null;
  isMe: boolean;
}>;

export type TowerDefenseLeaderboard = Readonly<{
  gameId: "td";
  levelId: string;
  modeId: LeaderboardModeId;
  maxWaves: number | null;
  seasonId: string | null;
  totalPlayers: number;
  entries: readonly LeaderboardEntry[];
  me: LeaderboardEntry | null;
}>;

type FetchResponseLike = Readonly<{
  ok: boolean;
  status?: number;
  json(): Promise<unknown>;
}>;

export type LeaderboardFetch = (
  input: string,
  init: Readonly<{
    method: "POST";
    headers: Readonly<Record<string, string>>;
    body: string;
    signal: AbortSignal;
    cache: "no-store";
    credentials: "omit";
  }>,
) => Promise<FetchResponseLike>;

export type LeaderboardClientOptions = Readonly<{
  fetch?: LeaderboardFetch;
  now?: () => number;
  timeoutMs?: number;
}>;

export type LeaderboardClient = Readonly<{
  load(levelId: string, modeId?: LeaderboardModeId): Promise<TowerDefenseLeaderboard>;
  invalidate(levelId?: string, modeId?: LeaderboardModeId): void;
}>;

type CachedLeaderboard = Readonly<{
  expiresAt: number;
  value: TowerDefenseLeaderboard;
}>;

/**
 * Creates a page-scoped client. Telegram init data stays only in this closure and
 * is never written to durable browser storage.
 */
export function createLeaderboardClient(
  rawInitData: string,
  options: LeaderboardClientOptions = {},
): LeaderboardClient {
  const initData = readInitData(rawInitData);
  if (!initData) throw new Error("invalid_init_data");

  const fetcher = options.fetch ?? defaultFetch;
  const readCurrentTime = options.now ?? Date.now;
  const timeoutMs = normalizeTimeout(options.timeoutMs);
  const cache = new Map<string, CachedLeaderboard>();
  const inFlight = new Map<string, Promise<TowerDefenseLeaderboard>>();
  const revisions = new Map<string, number>();
  let epoch = 0;

  const load = (
    rawLevelId: string,
    rawModeId: LeaderboardModeId = CAMPAIGN_MODE_ID,
  ): Promise<TowerDefenseLeaderboard> => {
    const levelId = readContentId(rawLevelId);
    if (!levelId) return Promise.reject(new Error("invalid_level_id"));
    const modeId = readModeId(rawModeId);
    if (!modeId) return Promise.reject(new Error("invalid_mode_id"));
    const cacheKey = leaderboardCacheKey(levelId, modeId);

    const now = safeNow(readCurrentTime);
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) return Promise.resolve(cached.value);
    if (cached) cache.delete(cacheKey);

    const pending = inFlight.get(cacheKey);
    if (pending) return pending;

    const requestEpoch = epoch;
    const requestRevision = revisions.get(cacheKey) ?? 0;
    const request = requestLeaderboard(fetcher, initData, levelId, modeId, timeoutMs)
      .then((value) => {
        if (epoch === requestEpoch && (revisions.get(cacheKey) ?? 0) === requestRevision) {
          cache.set(cacheKey, {
            expiresAt: safeNow(readCurrentTime) + LEADERBOARD_CACHE_TTL_MS,
            value,
          });
        }
        return value;
      });
    inFlight.set(cacheKey, request);
    void request.finally(() => {
      if (inFlight.get(cacheKey) === request) inFlight.delete(cacheKey);
    }).catch(() => undefined);
    return request;
  };

  const invalidate = (rawLevelId?: string, rawModeId?: LeaderboardModeId): void => {
    if (rawLevelId === undefined) {
      epoch += 1;
      cache.clear();
      inFlight.clear();
      return;
    }

    const levelId = readContentId(rawLevelId);
    if (!levelId) return;
    if (rawModeId === undefined) {
      for (const modeId of [CAMPAIGN_MODE_ID, ENDLESS_MODE_ID] as const) {
        const cacheKey = leaderboardCacheKey(levelId, modeId);
        revisions.set(cacheKey, (revisions.get(cacheKey) ?? 0) + 1);
        cache.delete(cacheKey);
        inFlight.delete(cacheKey);
      }
      return;
    }
    const modeId = readModeId(rawModeId);
    if (!modeId) return;
    const cacheKey = leaderboardCacheKey(levelId, modeId);
    revisions.set(cacheKey, (revisions.get(cacheKey) ?? 0) + 1);
    cache.delete(cacheKey);
    inFlight.delete(cacheKey);
  };

  return Object.freeze({ load, invalidate });
}

export function parseLeaderboardResponse(
  value: unknown,
  expectedLevelId: string,
  expectedModeId: LeaderboardModeId = CAMPAIGN_MODE_ID,
): TowerDefenseLeaderboard | null {
  const levelId = readContentId(expectedLevelId);
  const modeId = readModeId(expectedModeId);
  const rankedResponse = hasExactKeys(value, RANKED_RESPONSE_KEYS);
  if (!levelId || !modeId || (!rankedResponse && !hasExactKeys(value, LEGACY_RESPONSE_KEYS))) return null;
  if (value.ok !== true || value.game_id !== "td" || value.mode_id !== modeId) return null;
  if (value.level_id !== levelId) return null;

  const maxWaves = modeId === CAMPAIGN_MODE_ID
    ? readInteger(value.max_waves, 1, Number.MAX_SAFE_INTEGER)
    : value.max_waves === null ? null : undefined;
  const seasonId = rankedResponse && typeof value.season_id === "string" ? value.season_id : null;
  const totalPlayers = readInteger(value.total_players, 0, Number.MAX_SAFE_INTEGER);
  if (
    maxWaves === undefined
    || (modeId === CAMPAIGN_MODE_ID && maxWaves === null)
    || totalPlayers === null
    || !Array.isArray(value.entries)
  ) return null;
  if (modeId === ENDLESS_MODE_ID && (!rankedResponse || seasonId !== "endless-v1")) return null;
  if (modeId === CAMPAIGN_MODE_ID && rankedResponse && value.season_id !== null) return null;
  if (value.entries.length > MAX_ENTRIES || value.entries.length > totalPlayers) return null;

  const entries: LeaderboardEntry[] = [];
  let previousRank = 0;
  let ownEntry: LeaderboardEntry | null = null;
  for (const candidate of value.entries) {
    const entry = parseEntry(candidate, modeId, maxWaves, totalPlayers);
    if (!entry || entry.rank <= previousRank) return null;
    previousRank = entry.rank;
    if (entry.isMe) {
      if (ownEntry) return null;
      ownEntry = entry;
    }
    entries.push(entry);
  }

  const me = value.me === null ? null : parseEntry(value.me, modeId, maxWaves, totalPlayers);
  if (me && !me.isMe) return null;
  if (!me && ownEntry) return null;
  if (me && ownEntry && !sameEntry(me, ownEntry)) return null;

  return Object.freeze({
    gameId: "td",
    levelId,
    modeId,
    maxWaves,
    seasonId,
    totalPlayers,
    entries: Object.freeze(entries),
    me,
  });
}

async function requestLeaderboard(
  fetcher: LeaderboardFetch,
  initData: string,
  levelId: string,
  modeId: LeaderboardModeId,
  timeoutMs: number,
): Promise<TowerDefenseLeaderboard> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("request_timeout"));
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      fetcher(TOWER_DEFENSE_LEADERBOARD_URL, {
        method: "POST",
        headers: Object.freeze({
          accept: "application/json",
          "content-type": "application/json",
        }),
        body: JSON.stringify({
          init_data: initData,
          level_id: levelId,
          mode_id: modeId,
          stats_version: 3,
        }),
        signal: controller.signal,
        cache: "no-store",
        credentials: "omit",
      }),
      timeout,
    ]);
    if (!response.ok) throw new Error(`http_${response.status ?? 0}`);
    const data = await Promise.race([response.json(), timeout]);
    const parsed = parseLeaderboardResponse(data, levelId, modeId);
    if (!parsed) throw new Error("invalid_response");
    return parsed;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function parseEntry(
  value: unknown,
  modeId: LeaderboardModeId,
  maxWaves: number | null,
  totalPlayers: number,
): LeaderboardEntry | null {
  const hasRankedHero = hasExactKeys(value, RANKED_ENTRY_KEYS);
  const hasHeroWins = hasExactKeys(value, ENTRY_KEYS);
  if (!hasRankedHero && !hasHeroWins && !hasExactKeys(value, LEGACY_ENTRY_KEYS)) return null;
  if (modeId === ENDLESS_MODE_ID && !hasRankedHero) return null;
  const rank = readInteger(value.rank, 1, totalPlayers);
  const name = value.name === null ? null : readName(value.name);
  const completedWaves = readInteger(value.completed_waves, 0, maxWaves ?? MAX_ENDLESS_WAVE);
  const durationMs = value.duration_ms === null
    ? null
    : readInteger(value.duration_ms, 0, Number.MAX_SAFE_INTEGER);
  const heroWins = hasHeroWins || hasRankedHero ? parseHeroWins(value.hero_wins) : EMPTY_HERO_WINS;
  const heroId = hasRankedHero
    ? value.hero_id === null ? null : isHeroId(value.hero_id) ? value.hero_id : undefined
    : null;
  if (
    rank === null
    || (name === null && value.name !== null)
    || (value.outcome !== "defeat" && value.outcome !== "victory")
    || completedWaves === null
    || durationMs === null && value.duration_ms !== null
    || heroWins === null
    || heroId === undefined
    || modeId === ENDLESS_MODE_ID && (value.outcome !== "defeat" || heroWins.length > 0)
    || modeId === CAMPAIGN_MODE_ID && heroWins.length > 0 && (value.outcome !== "victory" || completedWaves !== maxWaves)
    || typeof value.is_me !== "boolean"
  ) return null;

  return Object.freeze({
    rank,
    name,
    outcome: value.outcome,
    completedWaves,
    durationMs,
    heroWins,
    heroId,
    isMe: value.is_me,
  });
}

function parseHeroWins(value: unknown): readonly LeaderboardHeroWin[] | null {
  if (!Array.isArray(value) || value.length > HERO_IDS.length) return null;

  const heroWins: LeaderboardHeroWin[] = [];
  let previousHeroIndex = -1;
  for (const candidate of value) {
    if (!hasExactKeys(candidate, HERO_WIN_KEYS) || !isHeroId(candidate.hero_id)) return null;
    const heroIndex = HERO_IDS.indexOf(candidate.hero_id);
    const completions = readInteger(candidate.completions, 1, Number.MAX_SAFE_INTEGER);
    if (heroIndex <= previousHeroIndex || completions === null) return null;
    previousHeroIndex = heroIndex;
    heroWins.push(Object.freeze({ heroId: candidate.hero_id, completions }));
  }
  return Object.freeze(heroWins);
}

function sameEntry(left: LeaderboardEntry, right: LeaderboardEntry): boolean {
  return left.rank === right.rank
    && left.name === right.name
    && left.outcome === right.outcome
    && left.completedWaves === right.completedWaves
    && left.durationMs === right.durationMs
    && sameHeroWins(left.heroWins, right.heroWins)
    && left.heroId === right.heroId
    && left.isMe === right.isMe;
}

function sameHeroWins(left: readonly LeaderboardHeroWin[], right: readonly LeaderboardHeroWin[]): boolean {
  return left.length === right.length
    && left.every((heroWin, index) => heroWin.heroId === right[index]?.heroId
      && heroWin.completions === right[index]?.completions);
}

function readInitData(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim() || value.length > MAX_INIT_DATA_LENGTH) return null;
  return value;
}

function readContentId(value: unknown): string | null {
  return typeof value === "string" && CONTENT_ID_PATTERN.test(value) ? value : null;
}

function readModeId(value: unknown): LeaderboardModeId | null {
  return value === CAMPAIGN_MODE_ID || value === ENDLESS_MODE_ID ? value : null;
}

function leaderboardCacheKey(levelId: string, modeId: LeaderboardModeId): string {
  return `${levelId}:${modeId}`;
}

function readName(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.length > MAX_NAME_LENGTH) return null;
  if (value.trim() !== value || CONTROL_CHARACTER_PATTERN.test(value)) return null;
  return value;
}

function readInteger(value: unknown, minimum: number, maximum: number): number | null {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= minimum
    && value <= maximum
    ? value
    : null;
}

function normalizeTimeout(value: number | undefined): number {
  return Number.isFinite(value)
    ? Math.min(MAX_TIMEOUT_MS, Math.max(1, Math.floor(value || DEFAULT_TIMEOUT_MS)))
    : DEFAULT_TIMEOUT_MS;
}

function safeNow(readCurrentTime: () => number): number {
  const value = readCurrentTime();
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : Date.now();
}

function hasExactKeys<const TKeys extends readonly string[]>(
  value: unknown,
  keys: TKeys,
): value is Record<TKeys[number], unknown> {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort(compareText);
  const expected = [...keys].sort(compareText);
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function defaultFetch(input: string, init: Parameters<LeaderboardFetch>[1]): Promise<FetchResponseLike> {
  if (typeof globalThis.fetch !== "function") throw new Error("fetch_unavailable");
  return globalThis.fetch(input, init);
}
