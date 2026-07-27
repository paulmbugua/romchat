ALTER TABLE romchat_messages
  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlock_cost_tokens INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unlocked_by_actor BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_kind TEXT NOT NULL DEFAULT 'text';

CREATE TABLE IF NOT EXISTS romchat_video_requests (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  sender_profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  teaser TEXT NOT NULL,
  unlock_cost_tokens INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'locked',
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_token_unlocks (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL DEFAULT 'me',
  target_type TEXT NOT NULL CHECK (target_type IN ('message', 'video_request', 'admirer', 'read_receipt', 'undo_swipe')),
  target_id TEXT NOT NULL,
  cost_tokens INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_romchat_video_requests_match_created ON romchat_video_requests(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_romchat_token_unlocks_member_created ON romchat_token_unlocks(member_id, created_at DESC);
