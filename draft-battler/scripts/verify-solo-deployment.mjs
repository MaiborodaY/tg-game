import path from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 2_000;
const REQUEST_TIMEOUT_MS = 5_000;
const PVP_RULESET_VERSION = "draft-battler-pvp-v4";

export async function verifyDeployment(origin, request = fetch) {
  const baseUrl = new URL(origin);
  const healthUrl = new URL("/health", baseUrl);
  const homeUrl = new URL("/", baseUrl);
  const assetUrl = new URL("/assets/ui/cards/frames/card-frame-common.svg", baseUrl);

  const healthResponse = await requestWithTimeout(request, healthUrl, "application/json");
  if (!healthResponse.ok) {
    throw new Error(`Draft Battler health check returned HTTP ${healthResponse.status}.`);
  }

  const health = await healthResponse.json();
  if (health?.pvpEnabled !== true) {
    throw new Error("Draft Battler deployment does not report pvpEnabled=true.");
  }
  if (health?.rulesetVersion !== PVP_RULESET_VERSION) {
    throw new Error(`Draft Battler deployment reports unsupported ruleset ${String(health?.rulesetVersion)}.`);
  }

  const homeResponse = await requestWithTimeout(request, homeUrl, "text/html");
  const home = await homeResponse.text();
  if (!homeResponse.ok || !home.includes('id="app"')) {
    throw new Error(`Draft Battler homepage is not serving the app shell (HTTP ${homeResponse.status}).`);
  }

  const assetResponse = await requestWithTimeout(request, assetUrl, "image/svg+xml");
  const asset = await assetResponse.text();
  if (!assetResponse.ok || !/<svg\b/i.test(asset)) {
    throw new Error(`Draft Battler runtime asset is unavailable (HTTP ${assetResponse.status}).`);
  }

  const roomResponse = await requestWithTimeout(request, new URL("/api/pvp/rooms", baseUrl), "application/json", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseUrl.origin,
    },
    body: "{}",
  });
  const room = await roomResponse.json();
  if (
    !roomResponse.ok ||
    room?.ok !== true ||
    room?.seat !== "host" ||
    typeof room?.roomId !== "string" ||
    typeof room?.seatToken !== "string" ||
    typeof room?.socketTicket !== "string" ||
    room?.snapshot?.rulesetVersion !== PVP_RULESET_VERSION
  ) {
    throw new Error(`Draft Battler room creation smoke failed (HTTP ${roomResponse.status}).`);
  }

  return { health, roomId: room.roomId };
}

// Backward-compatible export for existing local tooling; the release policy is now PvP-enabled.
export const verifySoloDeployment = verifyDeployment;

function requestWithTimeout(request, url, accept, init = {}) {
  return request(url, {
    ...init,
    cache: "no-store",
    headers: { accept, ...init.headers },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function verifyWithRetry(origin) {
  let lastError = new Error("Draft Battler deployment verification did not run.");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await verifyDeployment(origin);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`Deployment check ${attempt}/${MAX_ATTEMPTS} failed; retrying.`);
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
}

function isEntrypoint() {
  return Boolean(process.argv[1]) && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isEntrypoint()) {
  const origin = process.argv[2];
  if (!origin) {
    console.error("Usage: node draft-battler/scripts/verify-solo-deployment.mjs <origin>");
    process.exitCode = 1;
  } else {
    try {
      await verifyWithRetry(origin);
      console.log(`Verified Draft Battler deployment at ${new URL(origin).origin}.`);
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  }
}
