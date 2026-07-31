import { HERO_IDS, isHeroId } from "./game/heroes.ts";
import type { HeroId } from "./game/types.ts";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;
const MAX_INIT_DATA_LENGTH = 32_768;
const MAX_NAME_LENGTH = 128;
const MAX_ENTRIES = 100;
const CONTENT_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,95}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

const RESPONSE_KEYS = Object.freeze([
  "ok",
  "game_id",
  "level_id",
  "mode_id",
  "max_waves",
  "total_players",
  "entries",
  "me",
] as const);
const LEGACY_ENTRY_KEYS = Object.freeze([
  "rank",
  "name",
  "outcome",
  "completed_waves",
  "duration_ms",
  "is_me",
] as const);
const ENTRY_KEYS = Object.freeze([...LEGACY_ENTRY_KEYS, "hero_wins"] as const);
const HERO_WIN_KEYS = Object.freeze(["hero_id", "completions"] as const);

export const TOWER_DEFENSE_LEADERBOARD_URL =
  "https://work-bot.mr-maybik.workers.dev/api/minigames/td/leaderboard";
export const LEADERBOARD_CACHE_TTL_MS = 30_000;

export type LeaderboardOutcome = "defeat" | "victory";

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
  isMe: boolean;
}>;

export type TowerDefenseLeaderboard = Readonly<{
  gameId: "td";
  levelId: string;
  modeId: "campaign";
  maxWaves: number;
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
  load(levelId: string): Promise<TowerDefenseLeaderboard>;
  invalidate(levelId?: string): void;
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

  const load = (rawLevelId: string): Promise<TowerDefenseLeaderboard> => {
    const levelId = readContentId(rawLevelId);
    if (!levelId) return Promise.reject(new Error("invalid_level_id"));

    const now = safeNow(readCurrentTime);
    const cached = cache.get(levelId);
    if (cached && cached.expiresAt > now) return Promise.resolve(cached.value);
    if (cached) cache.delete(levelId);

    const pending = inFlight.get(levelId);
    if (pending) return pending;

    const requestEpoch = epoch;
    const requestRevision = revisions.get(levelId) ?? 0;
    const request = requestLeaderboard(fetcher, initData, levelId, timeoutMs)
      .then((value) => {
        if (epoch === requestEpoch && (revisions.get(levelId) ?? 0) === requestRevision) {
          cache.set(levelId, {
            expiresAt: safeNow(readCurrentTime) + LEADERBOARD_CACHE_TTL_MS,
            value,
          });
        }
        return value;
      });
    inFlight.set(levelId, request);
    void request.finally(() => {
      if (inFlight.get(levelId) === request) inFlight.delete(levelId);
    }).catch(() => undefined);
    return request;
  };

  const invalidate = (rawLevelId?: string): void => {
    if (rawLevelId === undefined) {
      epoch += 1;
      cache.clear();
      inFlight.clear();
      return;
    }

    const levelId = readContentId(rawLevelId);
    if (!levelId) return;
    revisions.set(levelId, (revisions.get(levelId) ?? 0) + 1);
    cache.delete(levelId);
    inFlight.delete(levelId);
  };

  return Object.freeze({ load, invalidate });
}

export function parseLeaderboardResponse(
  value: unknown,
  expectedLevelId: string,
): TowerDefenseLeaderboard | null {
  const levelId = readContentId(expectedLevelId);
  if (!levelId || !hasExactKeys(value, RESPONSE_KEYS)) return null;
  if (value.ok !== true || value.game_id !== "td" || value.mode_id !== "campaign") return null;
  if (value.level_id !== levelId) return null;

  const maxWaves = readInteger(value.max_waves, 1, Number.MAX_SAFE_INTEGER);
  const totalPlayers = readInteger(value.total_players, 0, Number.MAX_SAFE_INTEGER);
  if (maxWaves === null || totalPlayers === null || !Array.isArray(value.entries)) return null;
  if (value.entries.length > MAX_ENTRIES || value.entries.length > totalPlayers) return null;

  const entries: LeaderboardEntry[] = [];
  let previousRank = 0;
  let ownEntry: LeaderboardEntry | null = null;
  for (const candidate of value.entries) {
    const entry = parseEntry(candidate, maxWaves, totalPlayers);
    if (!entry || entry.rank <= previousRank) return null;
    previousRank = entry.rank;
    if (entry.isMe) {
      if (ownEntry) return null;
      ownEntry = entry;
    }
    entries.push(entry);
  }

  const me = value.me === null ? null : parseEntry(value.me, maxWaves, totalPlayers);
  if (me && !me.isMe) return null;
  if (!me && ownEntry) return null;
  if (me && ownEntry && !sameEntry(me, ownEntry)) return null;

  return Object.freeze({
    gameId: "td",
    levelId,
    modeId: "campaign",
    maxWaves,
    totalPlayers,
    entries: Object.freeze(entries),
    me,
  });
}

async function requestLeaderboard(
  fetcher: LeaderboardFetch,
  initData: string,
  levelId: string,
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
          mode_id: "campaign",
          stats_version: 2,
        }),
        signal: controller.signal,
        cache: "no-store",
        credentials: "omit",
      }),
      timeout,
    ]);
    if (!response.ok) throw new Error(`http_${response.status ?? 0}`);
    const data = await Promise.race([response.json(), timeout]);
    const parsed = parseLeaderboardResponse(data, levelId);
    if (!parsed) throw new Error("invalid_response");
    return parsed;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function parseEntry(value: unknown, maxWaves: number, totalPlayers: number): LeaderboardEntry | null {
  const hasHeroWins = hasExactKeys(value, ENTRY_KEYS);
  if (!hasHeroWins && !hasExactKeys(value, LEGACY_ENTRY_KEYS)) return null;
  const rank = readInteger(value.rank, 1, totalPlayers);
  const name = value.name === null ? null : readName(value.name);
  const completedWaves = readInteger(value.completed_waves, 0, maxWaves);
  const durationMs = value.duration_ms === null
    ? null
    : readInteger(value.duration_ms, 0, Number.MAX_SAFE_INTEGER);
  const heroWins = hasHeroWins ? parseHeroWins(value.hero_wins) : EMPTY_HERO_WINS;
  if (
    rank === null
    || (name === null && value.name !== null)
    || (value.outcome !== "defeat" && value.outcome !== "victory")
    || completedWaves === null
    || durationMs === null && value.duration_ms !== null
    || heroWins === null
    || heroWins.length > 0 && (value.outcome !== "victory" || completedWaves !== maxWaves)
    || typeof value.is_me !== "boolean"
  ) return null;

  return Object.freeze({
    rank,
    name,
    outcome: value.outcome,
    completedWaves,
    durationMs,
    heroWins,
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
