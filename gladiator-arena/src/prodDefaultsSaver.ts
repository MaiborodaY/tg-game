import type { ArenaDebugTuning } from "./debugTuning";

interface SaveProdDefaultsResponse {
  message?: string;
  updated?: number;
}

const saveProdDefaultsEndpoint = "/__dust-arena/save-prod-defaults";
const saveProdAnimationEndpoint = "/__dust-arena/save-prod-animation";

export async function saveProdDefaults(tuning: ArenaDebugTuning): Promise<string> {
  const response = await fetch(saveProdDefaultsEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tuning),
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(payload.message ?? "Could not save prod defaults. Is the Vite dev server running?");
  }

  return payload.message ?? `Saved ${payload.updated ?? 0} prod defaults.`;
}

export async function saveProdAnimation(tuning: ArenaDebugTuning): Promise<string> {
  const response = await fetch(saveProdAnimationEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tuning),
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(payload.message ?? "Could not save prod animation. Is the Vite dev server running?");
  }

  return payload.message ?? "Saved animation to prod.";
}

async function readResponse(response: Response): Promise<SaveProdDefaultsResponse> {
  try {
    return (await response.json()) as SaveProdDefaultsResponse;
  } catch {
    return { message: response.statusText };
  }
}
