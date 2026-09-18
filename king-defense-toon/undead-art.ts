import type { AnimationActor, FrameFunction } from './animation-types.ts';
import type { AnimationMetadata, EnemyArt, SpriteRectTuple } from './art-types.ts';
import { tinyGoblinChiefFrame } from './tiny-goblin-chief.ts';
import { tinyGoblinArcherFrame } from './tiny-goblin-archer.ts';

const cell = 192;
const layout = Object.freeze({ columns: 4, rows: 4 });

function ghoulFrame(actor?: AnimationActor | null, time = 0): number {
  if (actor?.action === 'walk') {
    const elapsed = Number.isFinite(actor.walkTime) ? Math.max(0, actor.walkTime!) : 0;
    return 4 + Math.floor(elapsed * 8) % 4;
  }
  return tinyGoblinChiefFrame(actor, time);
}

function metadata(bodyHeight: number, baselines: number[], centers: number[],
  rectangles: SpriteRectTuple[], frameFor: FrameFunction) {
  return Object.freeze({
    layout, pixelArt: true, fullCells: true, bakedShadow: false,
    renderHeight: 40, bodyHeight: bodyHeight / cell, horizontalFacing: true,
    baselines: baselines.map(y => y / cell),
    centers: centers.map(x => x / cell),
    // Crops follow the supplied gutters; raised swords, arrows and claws cross nominal cells.
    sourceRects: Object.fromEntries(rectangles.map(([x, y, width, height], frame) =>
      [frame, { x, y, width, height }])),
    frameFor,
  } satisfies AnimationMetadata);
}

// Foot anchors exclude projecting weapons and claws. All ordinary enemies keep 40px bodies.
export const UNDEAD_ART = Object.freeze({
  skeleton: {
    url: new URL('./assets/web/skeleton-footman.webp', import.meta.url).href,
    fallback: 'goblin',
    metadata: metadata(111,
      [170,170,170,171,159,161,160,160,145,145,144,145,130,130,129,130],
      [103,103,100,99,101,103,96,103,101,110,95,104,99,108,96,100],
      [
        [0,0,192,191], [192,0,192,191], [384,0,192,191], [576,0,192,191],
        [0,191,192,193], [192,191,192,193], [384,191,192,193], [576,191,192,193],
        [0,384,192,179], [192,384,192,179], [384,384,192,179], [576,384,192,179],
        [0,563,192,205], [192,563,192,205], [384,563,192,205], [576,563,192,205],
      ], tinyGoblinChiefFrame),
  },
  skeletonArcher: {
    url: new URL('./assets/web/skeleton-archer.webp', import.meta.url).href,
    fallback: 'goblinArcher',
    metadata: metadata(136,
      [175,175,174,175,175,177,176,177,169,169,169,169,149,149,149,151],
      [94,94,94,94,101,100,104,106,87,88,86,95,99,100,106,100],
      [
        [0,0,193,193], [193,0,191,193], [384,0,195,193], [579,0,189,193],
        [0,193,193,191], [193,193,191,191], [384,193,195,191], [579,193,189,191],
        [0,384,207,195], [207,384,192,195], [399,384,191,195], [590,384,178,195],
        [0,579,193,189], [193,579,191,189], [384,579,195,189], [579,579,189,189],
      ], tinyGoblinArcherFrame),
  },
  ghoul: {
    url: new URL('./assets/web/ghoul.webp', import.meta.url).href,
    fallback: 'boar',
    metadata: metadata(106,
      [175,175,175,175,174,171,174,171,160,160,161,160,134,135,134,134],
      [92,92,94,91,83,84,94,84,97,90,78,100,102,110,104,98],
      [
        [0,0,204,220], [204,0,189,220], [393,0,193,220], [586,0,182,220],
        [0,220,201,174], [201,220,189,174], [390,220,196,174], [586,220,182,174],
        [0,394,206,182], [206,394,180,182], [386,394,215,182], [601,394,167,182],
        [0,576,206,192], [206,576,185,192], [391,576,193,192], [584,576,184,192],
      ], ghoulFrame),
  },
} satisfies Record<string, EnemyArt>);
