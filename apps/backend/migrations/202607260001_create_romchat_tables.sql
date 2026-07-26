
CREATE TABLE IF NOT EXISTS romchat_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  city TEXT NOT NULL,
  match_score INTEGER NOT NULL DEFAULT 80,
  intent TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL DEFAULT '',
  voice_note TEXT NOT NULL DEFAULT '',
  video_prompt TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  song TEXT NOT NULL DEFAULT '',
  gallery_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  answers TEXT[] NOT NULL DEFAULT '{}',
  poll JSONB NOT NULL DEFAULT '{}'::jsonb,
  color TEXT NOT NULL DEFAULT '#ff2f73',
  photo_key TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_swipes (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL DEFAULT 'me',
  profile_id TEXT NOT NULL REFERENCES romchat_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('pass', 'like', 'super_like')),
  matched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_matches (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL DEFAULT 'me',
  profile_id TEXT NOT NULL REFERENCES romchat_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(actor_id, profile_id)
);

CREATE TABLE IF NOT EXISTS romchat_messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  gift_id TEXT,
  priority BOOLEAN NOT NULL DEFAULT false,
  view_once BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  risk TEXT NOT NULL DEFAULT 'clear',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_privacy_settings (
  member_id TEXT PRIMARY KEY DEFAULT 'me',
  incognito BOOLEAN NOT NULL DEFAULT true,
  screenshots_blocked BOOLEAN NOT NULL DEFAULT true,
  visible_to_liked_only BOOLEAN NOT NULL DEFAULT true,
  disappearing_default_seconds INTEGER NOT NULL DEFAULT 86400,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_wallet_ledger (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL DEFAULT 'me',
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_subscriptions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL DEFAULT 'me',
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  renews_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS romchat_boosts (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL DEFAULT 'me',
  boost_id TEXT NOT NULL,
  profile_id TEXT NOT NULL DEFAULT 'me',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS romchat_gifts (
  id TEXT PRIMARY KEY,
  gift_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  sender_id TEXT NOT NULL DEFAULT 'me',
  note TEXT NOT NULL DEFAULT '',
  token_cost INTEGER NOT NULL DEFAULT 0,
  redeemable_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL DEFAULT 'me',
  profile_id TEXT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_verification_requests (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL DEFAULT 'me',
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'manual_review',
  risk TEXT NOT NULL DEFAULT 'low',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_romchat_messages_match_created ON romchat_messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_romchat_swipes_actor_created ON romchat_swipes(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_romchat_reports_status ON romchat_reports(status);
