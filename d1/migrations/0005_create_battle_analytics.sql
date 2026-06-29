CREATE TABLE IF NOT EXISTS battle_results (
  id TEXT PRIMARY KEY,
  telegram_user_id TEXT NOT NULL,
  battle_kind TEXT NOT NULL,
  result TEXT NOT NULL,
  encounter_kind TEXT NOT NULL,
  tier_id INTEGER NOT NULL,
  opponent_id TEXT NOT NULL,
  difficulty_id TEXT,
  room_code TEXT,
  player_seat TEXT,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  hero_level_before INTEGER NOT NULL,
  hero_level_after INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_battle_results_created_at
  ON battle_results(created_at);

CREATE INDEX IF NOT EXISTS idx_battle_results_user_created_at
  ON battle_results(telegram_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_battle_results_encounter_created_at
  ON battle_results(encounter_kind, tier_id, opponent_id, created_at);

CREATE TABLE IF NOT EXISTS loot_drops (
  id TEXT PRIMARY KEY,
  battle_result_id TEXT NOT NULL,
  telegram_user_id TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_id TEXT NOT NULL,
  opponent_id TEXT NOT NULL,
  tier_id INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  item_ids_json TEXT NOT NULL DEFAULT '[]',
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_loot_drops_battle_result_id
  ON loot_drops(battle_result_id);

CREATE INDEX IF NOT EXISTS idx_loot_drops_item_created_at
  ON loot_drops(item_id, created_at);

CREATE INDEX IF NOT EXISTS idx_loot_drops_user_created_at
  ON loot_drops(telegram_user_id, created_at);
