import type { HeroId } from "../game/types.ts";

export const HERO_BATTLE_ATLAS_HERO_IDS = Object.freeze(["eira", "toren"] as const);
export type HeroBattleAtlasHeroId = (typeof HERO_BATTLE_ATLAS_HERO_IDS)[number];
export type HeroFacing = -1 | 1;

export type HeroBattleAtlasSpec = Readonly<{
  textureKey: string;
  textureWidth: number;
  textureHeight: number;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  displayHeight: number;
  maxBytes: number;
}>;

export const HERO_BATTLE_ATLAS_SPECS = Object.freeze({
  eira: Object.freeze({
    textureKey: "hero-eira-battle-atlas",
    textureWidth: 512,
    textureHeight: 192,
    frameWidth: 128,
    frameHeight: 192,
    frameCount: 4,
    displayHeight: 62,
    maxBytes: 96 * 1_024,
  }),
  toren: Object.freeze({
    textureKey: "hero-toren-battle-atlas",
    textureWidth: 640,
    textureHeight: 192,
    frameWidth: 160,
    frameHeight: 192,
    frameCount: 4,
    displayHeight: 64,
    maxBytes: 96 * 1_024,
  }),
}) satisfies Readonly<Record<HeroBattleAtlasHeroId, HeroBattleAtlasSpec>>;

export const HERO_BATTLE_FRAMES = Object.freeze({
  eira: Object.freeze({
    idle: 0,
    attackDraw: 2,
    attackRelease: 3,
  }),
  toren: Object.freeze({
    idle: 0,
    attackWindup: 1,
    attackImpact: 2,
    attackRecover: 3,
  }),
});

export function isHeroBattleAtlasHeroId(heroId: HeroId): heroId is HeroBattleAtlasHeroId {
  return heroId === "eira" || heroId === "toren";
}

export function selectHeroFacing(fromX: number, targetX: number, current: HeroFacing): HeroFacing {
  if (!Number.isFinite(fromX) || !Number.isFinite(targetX) || fromX === targetX) return current;
  return targetX < fromX ? -1 : 1;
}

export function selectHeroBattleFrame(heroId: HeroBattleAtlasHeroId, attackProgress: number): number {
  const safeAttack = Number.isFinite(attackProgress)
    ? Math.max(0, Math.min(1, attackProgress))
    : 0;
  if (safeAttack <= 0) return HERO_BATTLE_FRAMES[heroId].idle;
  if (heroId === "eira") {
    return safeAttack < 0.52
      ? HERO_BATTLE_FRAMES.eira.attackDraw
      : HERO_BATTLE_FRAMES.eira.attackRelease;
  }
  if (safeAttack < 0.3) return HERO_BATTLE_FRAMES.toren.attackWindup;
  if (safeAttack < 0.62) return HERO_BATTLE_FRAMES.toren.attackImpact;
  return HERO_BATTLE_FRAMES.toren.attackRecover;
}
