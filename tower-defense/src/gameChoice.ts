export const DEFAULT_BRIDGE_APP_URL = "https://bridge-pvp.mr-maybik.workers.dev/";

const TELEGRAM_HASH_KEY = /^tgWebApp[A-Za-z0-9_]*$/;

export function buildBridgeLaunchUrl(
  currentUrl: string,
  bridgeAppUrl = DEFAULT_BRIDGE_APP_URL,
): string {
  const target = parseHttpUrl(bridgeAppUrl) ?? new URL(DEFAULT_BRIDGE_APP_URL);
  target.searchParams.set("source", "td");
  const source = parseUrl(currentUrl);
  if (!source) return target.toString();

  const targetHash = new URLSearchParams(target.hash.replace(/^#/, ""));
  const sourceHash = new URLSearchParams(source.hash.replace(/^#/, ""));
  for (const [key, value] of sourceHash) {
    if (TELEGRAM_HASH_KEY.test(key)) targetHash.set(key, value);
  }
  target.hash = targetHash.toString();
  return target.toString();
}

export function shouldShowTowerDefenseIntro(
  launchHasError: boolean,
  completedWave: number,
  introSeen: boolean,
): boolean {
  return launchHasError || (completedWave <= 0 && !introSeen);
}

export function shouldProtectRewardNavigation(
  isServerReward: boolean,
  finishSettled: boolean,
  leavingForBridge: boolean,
): boolean {
  return isServerReward && !finishSettled && !leavingForBridge;
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function parseHttpUrl(value: string): URL | null {
  const parsed = parseUrl(value);
  if (!parsed) return null;
  if (parsed.protocol === "https:") return parsed;
  if (parsed.protocol !== "http:") return null;
  return ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ? parsed : null;
}
