CREATE TABLE IF NOT EXISTS player_daily_resources (
  telegram_user_id TEXT NOT NULL,
  resource_key TEXT NOT NULL,
  day_key TEXT NOT NULL,
  current INTEGER NOT NULL,
  max INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (telegram_user_id, resource_key, day_key)
);

CREATE INDEX IF NOT EXISTS idx_player_daily_resources_updated_at
  ON player_daily_resources(updated_at);
