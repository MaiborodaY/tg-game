import { ROUNDS_PER_LEVEL } from './waves.mjs';

export const GOBLIN_ROUND_COLORS = Object.freeze(['Blue', 'Purple', 'Red', 'Yellow']);
export const GOBLIN_ROUND_ASSETS = Object.freeze({
  Blue: new URL('./assets/goblin-colors/torch-blue.webp', import.meta.url).href,
  Purple: new URL('./assets/goblin-colors/torch-purple.webp', import.meta.url).href,
  Red: new URL('./assets/tiny-swords-torch-red.png', import.meta.url).href,
  Yellow: new URL('./assets/goblin-colors/torch-yellow.webp', import.meta.url).href,
});

export function getGoblinRoundColor(roundNumber = 1) {
  const value = typeof roundNumber === 'number' || typeof roundNumber === 'string'
    ? Number(roundNumber) : 1;
  const round = Number.isFinite(value) ? Math.max(1, Math.min(ROUNDS_PER_LEVEL, Math.floor(value))) : 1;
  const index = Math.floor((round - 1) * GOBLIN_ROUND_COLORS.length / ROUNDS_PER_LEVEL);
  return GOBLIN_ROUND_COLORS[index];
}

export function getEnemyRoundArt(art, wave) {
  // Undead can share fallback atlases with goblins, but keep their own appearance.
  if (wave?.levelNumber !== 1) return art;
  return art.roundColors?.[getGoblinRoundColor(wave.roundNumber)] ?? art;
}
