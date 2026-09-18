import { migrateCampaignSave } from './progression.ts';

export function decodeCampaignSave(value: unknown): Record<string, unknown> {
  const saved = migrateCampaignSave(value);
  if (!saved || typeof saved.gold !== 'number' || !Number.isFinite(saved.gold) || saved.gold < 0) {
    throw new Error('Invalid saved campaign');
  }
  // Legacy numeric coercion can throw for malformed JSON objects. Validate while
  // storage still protects the original bytes, before any live state is restored.
  return { ...saved, clearedWaves: Number(saved.clearedWaves) };
}
