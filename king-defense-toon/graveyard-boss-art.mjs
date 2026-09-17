import { tinyGoblinChiefFrame } from './tiny-goblin-chief.mjs';

const cell = 192;
const layout = Object.freeze({ columns: 4, rows: 4 });

function metadata(renderHeight, bodyHeight, baselines, centers, rectangles) {
  return Object.freeze({
    layout, pixelArt: true, fullCells: true, bakedShadow: false,
    renderHeight, bodyHeight: bodyHeight / cell, horizontalFacing: true,
    baselines: baselines.map(y => y / cell),
    centers: centers.map(x => x / cell),
    // Supplied gutters preserve legs, the raised bell and the sarcophagus across nominal cells.
    sourceRects: Object.fromEntries(rectangles.map(([x, y, width, height], frame) =>
      [frame, { x, y, width, height }])),
    // Both atlases land their side/down attacks on local pose 2 (frames 10 and 14).
    frameFor: tinyGoblinChiefFrame,
  });
}

export const GRAVEYARD_BOSS_ART = Object.freeze({
  cryptSpider: {
    url: new URL('./assets/web/crypt-spider.webp', import.meta.url).href,
    fallback: 'goblinChief',
    // Anchor the supporting legs under the body, not a raised or extended front leg.
    metadata: metadata(54, 145,
      [185,186,185,184,176,174,174,174,164,162,162,164,144,146,143,143],
      [100,101,99,97,103,105,105,104,102,105,104,99,97,97,95,95],
      [
        [0,0,197,203], [197,0,190,203], [387,0,193,203], [580,0,188,203],
        [0,203,197,182], [197,203,193,182], [390,203,192,182], [582,203,186,182],
        [0,385,201,178], [201,385,182,178], [383,385,199,178], [582,385,186,178],
        [0,563,195,205], [195,563,185,205], [380,563,196,205], [576,563,192,205],
      ]),
  },
  cryptKing: {
    url: new URL('./assets/web/crypt-king.webp', import.meta.url).href,
    fallback: 'ogre',
    // Feet define the ground line: the bell extends below them during its downward impact.
    metadata: metadata(72, 114,
      [164,163,163,163,165,164,164,164,146,149,147,148,135,136,135,136],
      [114,112,107,104,110,111,105,108,112,113,69,111,108,110,104,99],
      [
        [0,0,200,199], [200,0,189,199], [389,0,186,199], [575,0,193,199],
        [0,199,197,186], [197,199,187,186], [384,199,191,186], [575,199,193,186],
        [0,385,198,177], [198,385,190,177], [388,385,200,177], [588,385,180,177],
        [0,562,194,206], [194,562,198,206], [392,562,177,206], [569,562,199,206],
      ]),
  },
});
