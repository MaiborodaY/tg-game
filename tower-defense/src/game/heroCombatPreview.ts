import {
  CAMPAIGN_MODE_ID,
  CLASSIC_CAMPAIGN_LEVEL_ID,
} from "./content.ts";
import type { ClientLaunchKind } from "./releasePolicy.ts";
import type { HeroId } from "./types.ts";

export const HERO_COMBAT_PREVIEW_QUERY_PARAM = "preview_hero_combat";
export const HERO_COMBAT_PREVIEW_SAVE_NAMESPACE = "hero-combat-preview-v1";

export type HeroCombatPreviewContext = Readonly<{
  isDevelopment: boolean;
  launchKind: ClientLaunchKind;
  rewardMode: "local" | "server";
  queryValue: string | null;
  levelId: string;
  modeId: string;
  heroId: HeroId;
}>;

export type HeroCombatPreviewSessionContext = Omit<HeroCombatPreviewContext, "heroId">;
export type HeroCombatPreviewLaunchContext = Omit<HeroCombatPreviewSessionContext, "levelId" | "modeId">;

export function isHeroCombatPreviewRequest(context: HeroCombatPreviewLaunchContext): boolean {
  return context.isDevelopment
    && context.launchKind === "practice"
    && context.rewardMode === "local"
    && context.queryValue === "1";
}

export function isHeroCombatPreviewSession(context: HeroCombatPreviewSessionContext): boolean {
  return isHeroCombatPreviewRequest(context)
    && context.levelId === CLASSIC_CAMPAIGN_LEVEL_ID
    && context.modeId === CAMPAIGN_MODE_ID;
}

export function shouldEnableHeroCombatPreview(context: HeroCombatPreviewContext): boolean {
  return isHeroCombatPreviewSession(context) && context.heroId === "toren";
}

export function buildHeroCombatPreviewSaveKey(baseSaveKey: string, enabled: boolean): string {
  if (!enabled) return baseSaveKey;
  if (!baseSaveKey) throw new TypeError("A base save key is required for the hero combat preview.");
  return `${baseSaveKey}:${HERO_COMBAT_PREVIEW_SAVE_NAMESPACE}`;
}
