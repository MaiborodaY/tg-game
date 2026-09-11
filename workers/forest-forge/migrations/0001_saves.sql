CREATE TABLE IF NOT EXISTS player_saves (
  telegram_id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL CHECK (json_valid(state_json)),
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
