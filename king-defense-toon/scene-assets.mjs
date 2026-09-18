import { UNIT_RANK_ASSETS } from './rank-art.mjs';
import { LANCER_ASSETS } from './lancer-art.mjs';
import { ST_KNIHOR_ASSETS, ST_KNIHOR_EFFECTS_IMAGE_URL } from './st-knihor-art.mjs';
import { getUnitRank } from './unit-ranks.mjs';
import { GOBLIN_ROUND_ASSETS, getGoblinRoundColor } from './goblin-round-art.mjs';
import { GOBLIN_ARCHER_IMAGE_URL } from './goblin-archer-art.mjs';
import { GOBLIN_CHIEF_IMAGE_URL } from './goblin-chief-art.mjs';
import { GOBLIN_HEALER_IMAGE_URL, GOBLIN_HEAL_PULSE_IMAGE_URL } from './goblin-healer-art.mjs';
import { OGRE_IMAGE_URL } from './ogre-art.mjs';
import { UNDEAD_ART } from './undead-art.mjs';
import { GRAVEYARD_BOSS_ART } from './graveyard-boss-art.mjs';

const ALLIES = {
  swordsman: { sheet: new URL('./assets/tiny-swords-warrior-blue.png', import.meta.url).href },
  archer: { sheet: new URL('./assets/tiny-swords-archer-blue.png', import.meta.url).href },
  healer: {
    sheet: new URL('./assets/tiny-monk/Idle.png', import.meta.url).href,
    walk: new URL('./assets/tiny-monk/Run.png', import.meta.url).href,
    cast: new URL('./assets/tiny-monk/Heal.png', import.meta.url).href,
  },
  lancer: LANCER_ASSETS[1],
};
const ALLY_RANK_ASSETS = { ...UNIT_RANK_ASSETS, lancer: LANCER_ASSETS };
const ENEMIES = {
  goblinArcher: GOBLIN_ARCHER_IMAGE_URL,
  goblinChief: GOBLIN_CHIEF_IMAGE_URL,
  goblinHealer: GOBLIN_HEALER_IMAGE_URL,
  ogre: OGRE_IMAGE_URL,
  boar: new URL('./assets/web/boar.webp', import.meta.url).href,
  ...Object.fromEntries(Object.entries({ ...UNDEAD_ART, ...GRAVEYARD_BOSS_ART }).map(([type, art]) => [type, art.url])),
};

/** Describe the visible army and the current wave, including enemies that have not spawned yet. */
export function getSceneAssetPlan(state = {}, { formationOnly = false } = {}) {
  const wave = state.battle?.wave ?? state.wave;
  const levelNumber = (state.levelNumber ?? wave?.levelNumber) === 2 ? 2 : 1;
  const mapKey = `map:${levelNumber}`;
  const resources = new Map([[mapKey, { levelNumber }]]);
  const allies = new Map();
  const enemies = new Map();
  const addImage = url => { resources.set(url, { url }); return url; };
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
