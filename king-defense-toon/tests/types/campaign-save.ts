import { decodeCampaignSave, needsCampaignSaveMigration, SAVE_SCHEMA_VERSION } from '../../campaign-save.ts';
import { UnsupportedSaveVersionError } from '../../save-version.ts';
import type { SaveVersionKind } from '../../save-version.ts';

export function verifyCampaignSaveBoundary(raw: unknown): void {
  const saved = decodeCampaignSave(raw);
  const version: 4 = saved.saveSchemaVersion;
  const migrationRequired: boolean = needsCampaignSaveMigration(raw);
  const error = new UnsupportedSaveVersionError('schema', 2, SAVE_SCHEMA_VERSION);
  const kind: SaveVersionKind = error.versionKind;
  // @ts-expect-error Version validation does not validate every gameplay field.
  const hero: { xp: number } = saved.hero;
  // @ts-expect-error The decoded version is the supported literal, not a future schema.
  const futureVersion: 5 = saved.saveSchemaVersion;
  // @ts-expect-error Errors distinguish save schema from campaign numbering only.
  new UnsupportedSaveVersionError('client', 2, 1);
  // @ts-expect-error Checked version metadata stays numeric after legacy coercion.
  new UnsupportedSaveVersionError('campaign', '4', 3);
  // @ts-expect-error Version metadata cannot change after the load error was classified.
  error.versionKind = 'campaign';
  void [version, migrationRequired, kind, hero, futureVersion];
}
