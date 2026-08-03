import { CONTENT_VERSION, getLevelDefinition, getModeRuleset } from "./content.ts";

export type ServerRunBinding = Readonly<{
  contentVersion: typeof CONTENT_VERSION;
  levelId: string;
  modeId: string;
}>;

export function sanitizeServerRunBinding(value: unknown): ServerRunBinding | null {
  if (!isRecord(value) || !hasExactBindingKeys(value) || value.contentVersion !== CONTENT_VERSION) return null;
  if (typeof value.levelId !== "string" || typeof value.modeId !== "string") return null;
  if (!getLevelDefinition(value.levelId) || !getModeRuleset(value.modeId)) return null;
  return Object.freeze({
    contentVersion: CONTENT_VERSION,
    levelId: value.levelId,
    modeId: value.modeId,
  });
}

function hasExactBindingKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === 3
    && keys[0] === "contentVersion"
    && keys[1] === "levelId"
    && keys[2] === "modeId";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
