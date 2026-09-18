import { getSceneAssetPlan } from '../../scene-assets.ts';
import type { SceneAssetInput, SceneAssetPlan } from '../../scene-assets.ts';
import { createBattle } from '../../combat.ts';
import type { FormationUnit } from '../../combat-types.ts';
import { createTinyMap } from '../../tiny-map.ts';
import type { BattlefieldMap } from '../../tiny-map.ts';
import { createGraveyardMap } from '../../graveyard-map.ts';
import { UNIT_IMAGES } from '../../asset-web.ts';

// Plans accept the renderer's minimal state while retaining known asset identifiers.
export function verifySceneAssetContracts(context: CanvasRenderingContext2D): void {
  const formation: readonly FormationUnit[] = [{ id: 1, type: 'lancer', col: 2, row: 1, level: 26 }];
  const state: SceneAssetInput = { units: formation, battle: createBattle(formation, 201), placementType: null };
  const plan: SceneAssetPlan = getSceneAssetPlan(state);
  getSceneAssetPlan({ units: [], battle: null, placementType: 'healer', placementLevel: 76 }, { formationOnly: true });
  getSceneAssetPlan({ wave: { spawns: [{ type: 'goblinHealer' }] } });
  for (const resource of plan.resources.values()) {
    if (resource.levelNumber !== undefined) {
      const level: 1 | 2 = resource.levelNumber;
      void level;
    } else {
      const url: string = resource.url;
      void url;
    }
  }
  const forest: Promise<BattlefieldMap> = createTinyMap();
  const graveyard: Promise<BattlefieldMap> = createGraveyardMap();
  void forest.then(map => map.draw(context, .5, { top: -150 }));
  const art = UNIT_IMAGES.get('swordsman');
  if (art) { const portrait: string = art.portrait; void portrait; }
  // @ts-expect-error Formation plans contain allied units, not enemy roles.
  getSceneAssetPlan({ units: [{ type: 'goblin' }] });
  // @ts-expect-error Placement uses a known allied identifier.
  getSceneAssetPlan({ placementType: 'dragon' });
  // @ts-expect-error Enemy resources require a named enemy definition.
  getSceneAssetPlan({ wave: { spawns: [{ type: 'swordsman' }] } });
  // @ts-expect-error Formation-only rendering is a boolean option.
  getSceneAssetPlan({}, { formationOnly: 'true' });
  // @ts-expect-error A map resource cannot simultaneously describe an image.
  plan.resources.set('invalid', { url: '/map.png', levelNumber: 2 });
  // @ts-expect-error Only the two current campaign maps have map resources.
  plan.resources.set('map:3', { levelNumber: 3 });
  // @ts-expect-error Monks may have no dedicated cast sheet at some ranks.
  const cast: string = plan.allies[0].cast;
  // @ts-expect-error Army-only plans omit hero direction sheets.
  const heroUp: string = plan.heroArt.up;
  // @ts-expect-error The optional enemy healer pulse is absent in ordinary waves.
  const pulse: string = plan.goblinHealPulse;
  // @ts-expect-error Image generation does not imply every unit has a static portrait.
  const portrait: string = UNIT_IMAGES.get('lancer').portrait;
  // @ts-expect-error Generated static image keys remain known allied identifiers.
  UNIT_IMAGES.get('dragon');
  // @ts-expect-error Map rendering requires a Canvas 2D context.
  void graveyard.then(map => map.draw({}));
  // @ts-expect-error Map extension bounds use numeric world coordinates.
  void forest.then(map => map.draw(context, 0, { top: '-150' }));
  void [cast, heroUp, pulse, portrait];
}
