CREATE TABLE IF NOT EXISTS romchat_google_play_purchases (
  purchase_token TEXT PRIMARY KEY,
  transaction_id TEXT,
  member_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  entitlement JSONB NOT NULL,
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_romchat_google_play_purchases_member
  ON romchat_google_play_purchases(member_id, created_at DESC);
