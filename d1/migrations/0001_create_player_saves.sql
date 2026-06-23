CREATE TABLE IF NOT EXISTS player_saves (
  telegram_user_id TEXT PRIMARY KEY,
  telegram_username TEXT,
  hero_json TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_player_saves_updated_at
  ON player_saves(updated_at);
