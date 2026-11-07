ALTER TABLE romchat_messages
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

ALTER TABLE romchat_reports
  ADD COLUMN IF NOT EXISTS reported_member_id TEXT,
  ADD COLUMN IF NOT EXISTS match_id TEXT,
  ADD COLUMN IF NOT EXISTS message_id TEXT,
  ADD COLUMN IF NOT EXISTS evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS moderation JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

CREATE INDEX IF NOT EXISTS idx_romchat_messages_moderation_queue
  ON romchat_messages (moderation_status, created_at DESC)
  WHERE moderation_status = 'pending_review';

CREATE INDEX IF NOT EXISTS idx_romchat_reports_moderation_queue
  ON romchat_reports (status, severity, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_romchat_reports_message_reporter
  ON romchat_reports (reporter_id, message_id)
  WHERE message_id IS NOT NULL AND reporter_id <> 'system';
