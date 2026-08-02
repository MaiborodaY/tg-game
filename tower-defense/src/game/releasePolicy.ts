import {
  CLASSIC_CAMPAIGN_LEVEL_ID,
  CONTENT_CATALOG,
  NORTHERN_PASS_LEVEL_ID,
} from "./content.ts";

export type ClientLaunchKind = "practice" | "miniapp" | "legacy" | "error";

export function shouldExposePreviewContent(
  isDevelopment: boolean,
  launchKind: ClientLaunchKind,
): boolean {
  // A deployed direct-browser launch is also classified as practice, so the
  // Vite development flag is required to keep preview content local-only.
  return isDevelopment && launchKind === "practice";
}

export function isClientLevelReleased(levelId: string, previewContentEnabled: boolean): boolean {
  if (!Object.hasOwn(CONTENT_CATALOG.levels, levelId)) return false;
  return previewContentEnabled
    || levelId === CLASSIC_CAMPAIGN_LEVEL_ID
    || levelId === NORTHERN_PASS_LEVEL_ID;
}

export function normalizeClientLevelId(levelId: string, previewContentEnabled: boolean): string {
  return isClientLevelReleased(levelId, previewContentEnabled)
    ? levelId
    : CLASSIC_CAMPAIGN_LEVEL_ID;
}
