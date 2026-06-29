CREATE TABLE IF NOT EXISTS shop_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_user_id TEXT NOT NULL,
  shop_kind TEXT NOT NULL,
  action TEXT NOT NULL,
  product_id TEXT,
  item_ids_json TEXT NOT NULL DEFAULT '[]',
  gold_spent INTEGER NOT NULL,
  hero_level INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_shop_purchases_created_at
  ON shop_purchases(created_at);

CREATE INDEX IF NOT EXISTS idx_shop_purchases_shop_created_at
  ON shop_purchases(shop_kind, created_at);
