import type { ForgeUpgradeId } from './forge.ts';

// Shared vocabulary across Forge and Kitchen. A moving sword means attack speed;
// clocks are reserved for durations, never a combat stat.
export const STAT_ICONS: Readonly<Record<ForgeUpgradeId, string>> = {
  health: '<path d="M12 21S3 15 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 13-9 13Z"/><path d="M12 7v8m-4-4h8"/>',
  attack: '<path d="m6 17 11-13h4v4L9 20m-5-7 7 7m-7 1 3-3"/>',
  attackSpeed: '<path d="m9 16 7-10 5-2-1 5-9 9Z"/><path d="m6 14 7 7m-9 1 4-4M3 13C2 7 7 2 13 2M3 7C5 3 8 1 11 1" fill="none"/>',
};

export const CLOCK_ICON = '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2" fill="none"/>';

export function statIcon(stat: ForgeUpgradeId): string {
  return `<svg class="stat-icon" data-stat-icon="${stat}" viewBox="0 0 24 24" aria-hidden="true">${STAT_ICONS[stat]}</svg>`;
}
