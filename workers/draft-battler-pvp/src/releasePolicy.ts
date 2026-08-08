export type PvpEnabledFlag = "true" | "false";

export interface PvpFeatureEnvironment {
  PVP_ENABLED?: PvpEnabledFlag;
}

export function isPvpEnabled(env: Pick<PvpFeatureEnvironment, "PVP_ENABLED">): boolean {
  // PvP is opt-in: missing, misspelled, or unexpected runtime values keep the solo release closed.
  return env.PVP_ENABLED === "true";
}

export function getEnabledPvpBinding<T>(
  env: PvpFeatureEnvironment & { readonly DRAFT_PVP_ROOM: T },
): T | undefined {
  if (!isPvpEnabled(env)) {
    return undefined;
  }

  return env.DRAFT_PVP_ROOM;
}
