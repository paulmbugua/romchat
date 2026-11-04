ALTER TABLE romchat_token_unlocks
  DROP CONSTRAINT IF EXISTS romchat_token_unlocks_target_type_check;

ALTER TABLE romchat_token_unlocks
  ADD CONSTRAINT romchat_token_unlocks_target_type_check
  CHECK (target_type IN ('message', 'video_request', 'admirer', 'read_receipt', 'undo_swipe', 'super_like'));
