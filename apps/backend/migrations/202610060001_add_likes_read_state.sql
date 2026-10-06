CREATE TABLE IF NOT EXISTS romchat_likes_read_state (
  member_id TEXT PRIMARY KEY,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
