import { migrateCampaignSave } from './progression.ts';
import { UnsupportedSaveVersionError } from './save-version.ts';
import { CAMPAIGN_VERSION } from './waves.ts';
import { createKitchen } from './kitchen.ts';
import { isUnitIdCursor, restoreNextUnitId } from './campaign-roster.ts';

// Save shape and campaign wave numbering evolve independently.
// Older clients must not drop paid food and its cooking progress when saving.
export const SAVE_SCHEMA_VERSION = 4;

export interface DecodedCampaignSave extends Record<string, unknown> {
  saveSchemaVersion: typeof SAVE_SCHEMA_VERSION;
  nextUnitId: number;
  gold: number;
  clearedWaves: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function needsCampaignSaveMigration(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return !Object.hasOwn(value, 'saveSchemaVersion')
    || (typeof value.saveSchemaVersion === 'number' && Number.isInteger(value.saveSchemaVersion)
      && value.saveSchemaVersion >= 0 && value.saveSchemaVersion < SAVE_SCHEMA_VERSION);
}

export function decodeCampaignSave(value: unknown): DecodedCampaignSave {
  if (!isRecord(value)) throw new Error('Invalid saved campaign');
  if (Object.hasOwn(value, 'saveSchemaVersion')) {
    const version = value.saveSchemaVersion;
    if (typeof version !== 'number' || !Number.isSafeInteger(version) || version < 0) {
      throw new Error('Invalid saved campaign schema version');
    }
    if (version > SAVE_SCHEMA_VERSION) {
      throw new UnsupportedSaveVersionError('schema', version, SAVE_SCHEMA_VERSION);
    }
  }
  // Older releases used numeric coercion for campaign numbering. Retain that
  // compatibility, but stop before restoring or rewriting any future campaign.
  const campaignVersion = Number(value.campaignVersion);
  if (campaignVersion > CAMPAIGN_VERSION) {
    throw new UnsupportedSaveVersionError('campaign', campaignVersion, CAMPAIGN_VERSION);
  }
  // A version-two save knows IDs consumed by fighters no longer in the roster.
  // Losing that cursor must not silently allow old command targets to be reused.
  if (typeof value.saveSchemaVersion === 'number' && value.saveSchemaVersion >= 2 && !isUnitIdCursor(value.nextUnitId)) {
    throw new Error('Invalid saved campaign fighter ID cursor');
  }
  createKitchen(value.kitchen);
  const saved = migrateCampaignSave(value);
  if (!saved || typeof saved.gold !== 'number' || !Number.isFinite(saved.gold) || saved.gold < 0) {
    throw new Error('Invalid saved campaign');
  }
  // Legacy numeric coercion can throw for malformed JSON objects. Validate while
  // storage still protects the original bytes, before any live state is restored.
  return { ...saved, saveSchemaVersion: SAVE_SCHEMA_VERSION, gold: saved.gold,
    nextUnitId: restoreNextUnitId(saved.nextUnitId, saved.units, saved.reserve),
    clearedWaves: Number(saved.clearedWaves) };
}
