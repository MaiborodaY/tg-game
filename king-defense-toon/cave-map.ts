import type { BattlefieldMap } from './tiny-map.ts';
import { loadImage } from './asset-cache.ts';

const MAP_URL = new URL('./assets/dungeons/goblin-cave-map.webp', import.meta.url).href;

export async function createCaveMap(): Promise<BattlefieldMap> {
  const image = await loadImage(MAP_URL);
  return {
    width: 502, height: 890, backgroundColor: '#101e2c',
    draw(context) {
      // Authored world bounds from cave-arena/layout.json. Keep the native scale
      // and bottom alignment; the extra upper half is approach, not a stretched arena.
      context.drawImage(image, -56, -445, 502, 890);
    },
  };
}
