CREATE INDEX IF NOT EXISTS idx_romchat_messages_priority_inbox
  ON romchat_messages (match_id, priority, read_at, created_at DESC);
