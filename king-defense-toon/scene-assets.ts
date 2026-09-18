import type { FormationUnit, AllyActor, EnemyActor } from './combat-types.ts';
import type { EnemySpawn, WaveDefinition, EnemyType } from './waves.ts';
import type { UnitType } from './units.ts';
import type { PaletteRank } from './unit-ranks.ts';
import type { SheetArtUrls } from './art-types.ts';

export interface SceneAssetWave {
  levelNumber?: WaveDefinition['levelNumber'];
  roundNumber?: WaveDefinition['roundNumber'];
  spawns?: readonly Pick<EnemySpawn, 'type'>[] | null;
}
export interface SceneAssetInput {
  units?: readonly Pick<FormationUnit, 'type' | 'level'>[] | null;
  wave?: SceneAssetWave | null;
  levelNumber?: number;
  battle?: {
    wave?: SceneAssetWave | null;
    allies?: readonly Pick<AllyActor, 'type' | 'level'>[] | null;
    enemies?: readonly Pick<EnemyActor, 'type'>[] | null;
  } | null;
  placementType?: UnitType | null;
  placementLevel?: number | string | null;
}
export type SceneMapKey = 'map:1' | 'map:2';
export type SceneAssetResource =
  | { url: string; levelNumber?: never }
  | { levelNumber: 1 | 2; url?: never };
export interface AllyAssetPlan {
  type: UnitType; rank: PaletteRank; sheet: string; walk: string | null; cast: string | null;
}
export interface EnemyAssetPlan { type: EnemyType; sheet: string }
export interface SceneAssetPlan {
  levelNumber: 1 | 2;
  mapKey: SceneMapKey;
  resources: Map<string, SceneAssetResource>;
  allies: AllyAssetPlan[];
  enemies: EnemyAssetPlan[];
  heroArt: Partial<Record<keyof typeof ST_KNIHOR_ASSETS, string>>;
  heroEffects: string | null;
  goblinHealPulse: string | null;
  keys: string[];
  signature: string;
}
export interface SceneAssetOptions { formationOnly?: boolean }
type AllyAssetUrls = Pick<SheetArtUrls, 'sheet' | 'walk' | 'cast'>;

import { UNIT_RANK_ASSETS } from './rank-art.ts';
import { LANCER_ASSETS } from './lancer-art.ts';
import { ST_KNIHOR_ASSETS, ST_KNIHOR_EFFECTS_IMAGE_URL } from './st-knihor-art.ts';
import { getUnitRank } from './unit-ranks.ts';
import { GOBLIN_ROUND_ASSETS, getGoblinRoundColor } from './goblin-round-art.ts';
import { GOBLIN_ARCHER_IMAGE_URL } from './goblin-archer-art.ts';
import { GOBLIN_CHIEF_IMAGE_URL } from './goblin-chief-art.ts';
import { GOBLIN_HEALER_IMAGE_URL, GOBLIN_HEAL_PULSE_IMAGE_URL } from './goblin-healer-art.ts';
import { OGRE_IMAGE_URL } from './ogre-art.ts';
import { UNDEAD_ART } from './undead-art.ts';
import { GRAVEYARD_BOSS_ART } from './graveyard-boss-art.ts';

const ALLIES: Record<UnitType, AllyAssetUrls> = {
  swordsman: { sheet: new URL('./assets/tiny-swords-warrior-blue.png', import.meta.url).href },
  archer: { sheet: new URL('./assets/tiny-swords-archer-blue.png', import.meta.url).href },
  healer: {
    sheet: new URL('./assets/tiny-monk/Idle.png', import.meta.url).href,
    walk: new URL('./assets/tiny-monk/Run.png', import.meta.url).href,
    cast: new URL('./assets/tiny-monk/Heal.png', import.meta.url).href,
  },
  lancer: LANCER_ASSETS[1],
};
const ALLY_RANK_ASSETS: Partial<Record<UnitType, Partial<Record<PaletteRank, AllyAssetUrls>>>> = { ...UNIT_RANK_ASSETS, lancer: LANCER_ASSETS };
const ENEMIES: Partial<Record<EnemyType, string>> = {
  goblinArcher: GOBLIN_ARCHER_IMAGE_URL,
  goblinChief: GOBLIN_CHIEF_IMAGE_URL,
  goblinHealer: GOBLIN_HEALER_IMAGE_URL,
  ogre: OGRE_IMAGE_URL,
  boar: new URL('./assets/web/boar.webp', import.meta.url).href,
  ...Object.fromEntries(Object.entries({ ...UNDEAD_ART, ...GRAVEYARD_BOSS_ART }).map(([type, art]) => [type, art.url])),
};

/** Describe the visible army and the current wave, including enemies that have not spawned yet. */
export function getSceneAssetPlan(state: SceneAssetInput = {}, { formationOnly = false }: SceneAssetOptions = {}): SceneAssetPlan {
  const wave = state.battle?.wave ?? state.wave;
  const levelNumber = (state.levelNumber ?? wave?.levelNumber) === 2 ? 2 : 1;
  const mapKey: SceneMapKey = `map:${levelNumber}`;
  const resources = new Map<string, SceneAssetResource>([[mapKey, { levelNumber }]]);
  const allies = new Map<string, AllyAssetPlan>();
  const enemies = new Map<EnemyType, EnemyAssetPlan>();
  const addImage = (url: string): string => { resources.set(url, { url }); return url; };
  const units = [...(state.units ?? []), ...(!formationOnly ? state.battle?.allies ?? [] : [])];
  if (state.placementType) units.push({ type: state.placementType, level: state.placementLevel ?? 1 });
  for (const unit of units) {
    if (!ALLIES[unit.type]) continue;
    const rank = getUnitRank(unit.level ?? 1).level;
    const urls = ALLY_RANK_ASSETS[unit.type]?.[rank] ?? ALLIES[unit.type];
    const key = `${unit.type}:${rank}`;
    if (allies.has(key)) continue;
    allies.set(key, { type: unit.type, rank, sheet: addImage(urls.sheet),
      walk: urls.walk ? addImage(urls.walk) : null, cast: urls.cast ? addImage(urls.cast) : null });
  }
  if (!formationOnly) {
    for (const enemy of [...(wave?.spawns ?? []), ...(state.battle?.enemies ?? [])]) {
      if (enemies.has(enemy.type)) continue;
      const url = enemy.type === 'goblin' ? GOBLIN_ROUND_ASSETS[getGoblinRoundColor(wave?.roundNumber)] : ENEMIES[enemy.type];
      if (url) enemies.set(enemy.type, { type: enemy.type, sheet: addImage(url) });
    }
  }
  // The hero is always visible on the battlefield, but never in the Army grid.
  const heroArt = formationOnly ? {} : Object.fromEntries(
    Object.entries(ST_KNIHOR_ASSETS).map(([direction, url]) => [direction, addImage(url)]));
  const heroEffects = formationOnly ? null : addImage(ST_KNIHOR_EFFECTS_IMAGE_URL);
  const goblinHealPulse = enemies.has('goblinHealer') ? addImage(GOBLIN_HEAL_PULSE_IMAGE_URL) : null;
  const keys = [...resources.keys()].sort();
  return { levelNumber, mapKey, resources, allies: [...allies.values()], enemies: [...enemies.values()],
    heroArt, heroEffects, goblinHealPulse, keys, signature: JSON.stringify(keys) };
}
