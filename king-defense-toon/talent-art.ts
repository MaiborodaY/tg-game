import type { TalentId } from './hero.ts';

export const HERO_TALENT_ART_URL = new URL('./assets/hero-talents/talents.webp', import.meta.url).href;

// The authored atlas has one row per branch; keep crops keyed by stable save IDs.
export const HERO_TALENT_ART_CELLS: Readonly<Record<TalentId, readonly [number, number]>> = Object.freeze({
  heal_unlock: [0, 0], heal_power: [1, 0], heal_haste: [2, 0],
  heal_shield: [3, 0], second_target: [4, 0], miracle: [5, 0],
  aura_unlock: [0, 1], aura_power: [1, 1], aura_radius: [2, 1],
  emergency_guard: [3, 1], guardian_ward: [4, 1], bastion: [5, 1],
  hammer_unlock: [0, 2], hammer_power: [1, 2], hammer_haste: [2, 2],
  hammer_splash: [3, 2], holy_strike: [4, 2], heavenly_hammer: [5, 2],
});

export function talentArtStyle(id: TalentId): string {
  const [column, row] = HERO_TALENT_ART_CELLS[id];
  return `background-image:url('${HERO_TALENT_ART_URL}');background-size:600% 300%;background-position:${column * 20}% ${row * 50}%`;
}
