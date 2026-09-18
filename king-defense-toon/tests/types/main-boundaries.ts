import { byId } from '../../main-dom.ts';
import { restoreCampaignRoster } from '../../campaign-roster.ts';
import { createProgression } from '../../progression.ts';

export function verifyMainBoundaries(raw: unknown): void {
  const canvas: HTMLCanvasElement = byId('battle');
  const volume: HTMLInputElement = byId('music-volume');
  const portrait: HTMLImageElement = byId('market-recruit-art');
  const button: HTMLButtonElement = byId('start-wave');
  // @ts-expect-error Static IDs must exist in the game template.
  byId('battle-canvas-typo');
  // @ts-expect-error A canvas is not a form control.
  byId('battle').disabled = true;
  // @ts-expect-error A button is not an image.
  byId('start-wave').src = 'portrait.png';
  const { units, reserve } = restoreCampaignRoster(raw, raw, createProgression());
  const level: number | undefined = units[0]?.level;
  // @ts-expect-error An unplaced reserve fighter has no formation cell.
  reserve[0].col;
  // @ts-expect-error Restored IDs are normalized numbers.
  const id: string = units[0].id;
  // @ts-expect-error Restored unit types must be valid catalogue identifiers.
  units[0].type = 'dragon';
  // @ts-expect-error Personal levels cannot be absent in the saved formation.
  units.push({ id: 1, type: 'archer', col: 2, row: 0 });
  void [canvas, volume, portrait, button, level, id];
}
