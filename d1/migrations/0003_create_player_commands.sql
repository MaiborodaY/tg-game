CREATE TABLE IF NOT EXISTS player_commands (
  telegram_user_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  command_type TEXT NOT NULL,
  status TEXT NOT NULL,
  response_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (telegram_user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_player_commands_updated_at
  ON player_commands(updated_at);
